import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
  const response=await route.fetch();let body=await response.text();
  body=body.replace('stats.stages++;',`stats.stages++;(window.__S||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__P=[];s.__D=[];s.__T=[];s.__F=[];return begin();};for(const[k,list]of[['path','__P'],['dot','__D'],['textPx','__T']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}const fill=s.ctx.fillRect.bind(s.ctx);s.ctx.fillRect=(...a)=>{s.__F.push(a);return fill(...a);};`);
  body=body.replace('return item.viz(v);','const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();return window.__R;});return item.viz(v);');
  await route.fulfill({response,body});
});
const check=async()=>{
  const q=await page.evaluate(()=>({r:window.__R,e:window.__vizErrors||[],tex:document.querySelectorAll('.katex-error').length,S:window.__S.map(s=>({b:s.bounds,w:s.width,h:s.height,p:s.__P,d:s.__D,t:s.__T,f:s.__F}))}));
  assert.deepEqual(q.e,[]);assert.equal(q.tex,0);assert.doesNotMatch(q.r,/NaN|Infinity|undefined/);assert.match(q.r,/boundaries do not predict vehicle range/);
  const s=q.S[0],inside=p=>assert.ok(p.every(Number.isFinite)&&p[0]>=s.b.x[0]&&p[0]<=s.b.x[1]&&p[1]>=s.b.y[0]&&p[1]<=s.b.y[1]);
  for(const [p] of s.p)for(const x of p)inside(x);for(const[x,y]of s.d)inside([x,y]);assert.equal(s.d.length,9);
  const panel=q.S[1];for(const [x,y,w,h]of panel.f)assert.ok([x,y,w,h].every(Number.isFinite)&&x>=0&&y>=0&&x+w<=panel.w+.01&&y+h<=panel.h+.01,`square outside panel ${[x,y,w,h,panel.w,panel.h]}`);
  for(const [text,x,y]of panel.t)assert.ok(x>=0&&x<=panel.w&&y>=0&&y<=panel.h,`text anchor outside panel ${text} (${x},${y}; canvas ${panel.w}x${panel.h})`);
  return q;
};
try{
  for(const theme of ['light','dark'])for(const width of [1450,430]){
    await page.setViewportSize({width,height:1450});
    await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/energy/ch03.js&id=energy-3.4&theme=${theme}&w=${width-50}&still=1&wait=150`);await page.waitForFunction(()=>window.__done);
    const d=await page.evaluate(()=>window.__done);assert.deepEqual(d.errors,[]);assert.deepEqual(d.texErrors,[]);assert.deepEqual(d.blank,[]);
    for(let mask=0;mask<16;mask++)for(let toggled=0;toggled<2;toggled++){
      await page.locator('input[type=range]').evaluateAll((es,m)=>es.forEach((e,j)=>{e.value=m&(1<<j)?e.max:e.min;e.dispatchEvent(new Event('input',{bubbles:true}));}),mask);
      await page.waitForTimeout(35);const q=await check();assert.match(q.r,new RegExp(`selected ${mask&2?40:15}% engine and ${mask&4?95:70}%`));assert.match(q.r,new RegExp(`H₂ conversion ${mask&8?65:30}%`));
      await page.locator('.ctl-toggle').click();await page.waitForTimeout(35);
    }
    await page.locator('input[type=range]').evaluateAll(es=>es.forEach((e,j)=>{e.value=[3,.25,.85,.5][j];e.dispatchEvent(new Event('input',{bubbles:true}));}));await page.waitForTimeout(50);await check();
    await page.screenshot({path:`/tmp/atlas-energy-density-${width}-${theme}.png`,fullPage:true});
    console.log(`PASS energy density ${width} ${theme}: all 16 target/conversion corners, both output modes, nine bounded points, finite readouts, contained volume squares`);
  }
  assert.deepEqual(errors,[]);
}catch(e){await page.screenshot({path:'/tmp/atlas-energy-density-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
