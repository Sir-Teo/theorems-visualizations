import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>console.error('REQUEST',r.url(),r.failure()?.errorText));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch();let body=await response.text();
 body=body.replace('stats.stages++;',`stats.stages++;(window.__S||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__P=[];s.__D=[];s.__T=[];return begin();};for(const[k,list]of[['path','__P'],['dot','__D'],['textPx','__T']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}`);
 body=body.replace('return item.viz(v);','const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();return window.__R;});return item.viz(v);');await route.fulfill({response,body});
});
const check=async()=>{
 const q=await page.evaluate(()=>({r:window.__R,e:window.__vizErrors||[],tex:document.querySelectorAll('.katex-error').length,S:window.__S.map(s=>({b:s.bounds,w:s.width,h:s.height,p:s.__P,d:s.__D,t:s.__T,handles:s.handles.map(h=>[h.x,h.y]),pb:[s.X(s.bounds.x[0]),s.Y(s.bounds.y[1]),s.X(s.bounds.x[1]),s.Y(s.bounds.y[0])],glyphs:[...s.__D.map(([x,y,o])=>[s.X(x),s.Y(y),(o?.r??4)+.75]),...s.handles.map(h=>[s.X(h.x),s.Y(h.y),h.r+2])]}))}));
 assert.deepEqual(q.e,[]);assert.equal(q.tex,0);assert.doesNotMatch(q.r,/NaN|Infinity|undefined/);assert.match(q.r,/not a reactor safety prediction/);assert.match(q.r,/Inventory exhausted after|exhaustion is not reached within the window/);
 for(const s of q.S){for(const[x,y,r]of s.glyphs)assert.ok(x-r>=s.pb[0]-1e-8&&x+r<=s.pb[2]+1e-8&&y-r>=s.pb[1]-1e-8&&y+r<=s.pb[3]+1e-8,`clipped glyph ${JSON.stringify({x,y,r,pb:s.pb})}`);const inside=p=>assert.ok(p.every(Number.isFinite)&&p[0]>=s.b.x[0]-1e-8&&p[0]<=s.b.x[1]+1e-8&&p[1]>=s.b.y[0]-1e-8&&p[1]<=s.b.y[1]+1e-8,`clipped data ${JSON.stringify({p,b:s.b})}`);for(const[p]of s.p)for(const x of p)inside(x);for(const[x,y]of s.d)inside([x,y]);for(const p of s.handles)inside(p);for(const[t,x,y]of s.t)assert.ok(x>=0&&x<=s.w&&y>=0&&y<=s.h,`text anchor clipped ${t}`);}
 return q;
};
try{
 for(const theme of ['light','dark'])for(const width of [1450,430]){
  await page.setViewportSize({width,height:1450});await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/energy/ch03-b.js&id=energy-3.9&theme=${theme}&w=${width-50}&still=1&wait=150`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__done);
  const d=await page.evaluate(()=>window.__done);assert.deepEqual(d.errors,[]);assert.deepEqual(d.texErrors,[]);assert.deepEqual(d.blank,[]);
  for(const t0 of [10,3600,8.64e6])for(let mask=0;mask<8;mask++){
   await page.locator('input[type=range]').evaluateAll((es,[m,t])=>{window.__S[0].handles[0].set(t,0);es.forEach((e,j)=>{e.value=m&(1<<j)?e.max:e.min;e.dispatchEvent(new Event('input',{bubbles:true}));});},[mask,t0]);await page.waitForTimeout(45);const q=await check();if(t0===8.64e6&&mask===4){assert.match(q.r,/not yet reached boiling/);assert.match(q.r,/600.0 t \(100.0%\) remain/);}
  }
  await page.locator('input[type=range]').evaluateAll(es=>{window.__S[0].handles[0].set(3600,0);es.forEach((e,j)=>{e.value=[3000,Math.log10(365),150][j];e.dispatchEvent(new Event('input',{bubbles:true}));});});await page.waitForTimeout(60);await check();await page.screenshot({path:`/tmp/atlas-energy-decay-${width}-${theme}.png`,fullPage:true});
  console.log(`PASS decay ${width} ${theme}: 24 history/power/water/cooling-time corners, honest dry/horizon states, finite bounded curves/labels and fully contained endpoint glyphs`);
 }
 assert.deepEqual(errors,[]);
}catch(e){console.error(e);await page.screenshot({path:'/tmp/atlas-energy-decay-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
