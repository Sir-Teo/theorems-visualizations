import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {chainFactorsAudit as factors,poissonSurvivalAudit as survival} from '../content/energy/source-audit-chain.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch();let body=await response.text();
 body=body.replace('stats.stages++;',`stats.stages++;(window.__S||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__D=[];s.__R=[];s.__T=[];return begin();};for(const[k,list]of[['dot','__D'],['rect','__R'],['textPx','__T']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}`);
 body=body.replace('return item.viz(v);','const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__readout=f();return window.__readout;});const slider=v.slider.bind(v);v.slider=(...a)=>{const c=slider(...a);(window.__C||=[]).push(c);return c;};return item.viz(v);');await route.fulfill({response,body});
});
await page.route(/\/content\/energy\/source-audit-chain\.shared\.js$/,async route=>{
 const response=await route.fetch(),body=(await response.text()).replace('return layers;','window.__counts=layers.map(x=>x.length);return layers;');await route.fulfill({response,body});
});
const check=async(moderator)=>{
 const q=await page.evaluate(()=>({r:window.__readout,counts:window.__counts,e:window.__vizErrors||[],tex:document.querySelectorAll('.katex-error').length,values:window.__C.map(c=>c.value),
 S:window.__S.map(s=>({b:s.bounds,w:s.width,h:s.height,rects:s.__R,d:s.__D,glyphs:s.__D.map(([x,y,o])=>[s.X(x),s.Y(y),(o?.r??4)+.75]),texts:s.__T.map(([t,X,Y,o={}])=>{s.ctx.save();s.ctx.font=s._font(o);const a=s.ctx.measureText(t).width,siz=o.size||12.5;let x=X+(o.dx||0);if(o.align==='center')x-=a/2;else if(o.align==='right')x-=a;s.ctx.restore();return[t,x,Y+(o.dy||0)-siz/2,x+a,Y+(o.dy||0)+siz/2];})}))}));
 assert.deepEqual(q.e,[]);assert.equal(q.tex,0);assert.doesNotMatch(q.r,/NaN|Infinity|undefined/);assert.match(q.r,/Full simulated population at generation 9/);assert.match(q.r,/expected population from four sources/);
 const [en,ratio,absorber,nonleakage]=q.values,c=factors({moderator,fraction:en/100,ratio,absorber,nonleakage});
 const expected=[c.eta,c.f,c.p,c.eps,c.kinf,c.keff];assert.equal(q.S[0].rects.length,6);
 q.S[0].rects.forEach((r,i)=>assert.ok(Math.abs(r[3]-expected[i])<1e-10));
 assert.equal(q.counts.length,10);assert.equal(q.counts[0],4);assert.match(q.r,new RegExp(`generation 9: \\$${q.counts[9]}\\$`));
 const pct=100*(1-(1-survival(c.keff))**4);assert.match(q.r,new RegExp(`${pct.toFixed(2)}%`));
 assert.equal(q.S[1].d.length,q.counts.reduce((a,n)=>a+Math.min(60,n),0));
 for(const s of q.S){for(const[x,y,r]of s.glyphs)assert.ok(x-r>=0&&x+r<=s.w&&y-r>=0&&y+r<=s.h,'complete tree glyph inside stage');for(const[t,x,y,x1,y1]of s.texts)assert.ok(x>=-1&&y>=-1&&x1<=s.w+1&&y1<=s.h+1,`text glyph clipped: ${t}, ${JSON.stringify({x,y,x1,y1,w:s.w,h:s.h})}`);}
 return q;
};
try{
 for(const theme of ['light','dark'])for(const width of [1450,430]){
  await page.setViewportSize({width,height:1450});await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/energy/ch03-b.js&id=energy-3.6&theme=${theme}&w=${width-50}&still=1&wait=150`);await page.waitForFunction(()=>window.__done);
  const d=await page.evaluate(()=>window.__done);assert.deepEqual(d.errors,[]);assert.deepEqual(d.texErrors,[]);assert.deepEqual(d.blank,[]);
  for(const moderator of ['h2o','d2o','c']){
   await page.getByRole('button',{name:{h2o:'light water',d2o:'heavy water',c:'graphite'}[moderator],exact:true}).click();
   for(let mask=0;mask<16;mask++){
    await page.locator('input[type=range]').evaluateAll((es,m)=>es.forEach((e,j)=>{e.value=m&(1<<j)?e.max:e.min;e.dispatchEvent(new Event('input',{bubbles:true}));}),mask);await page.waitForTimeout(40);await check(moderator);
   }
  }
  await page.getByRole('button',{name:'light water',exact:true}).click();
  await page.locator('input[type=range]').evaluateAll(es=>es.forEach((e,j)=>{e.value=[Math.log10(20),Math.log10(3),0,1][j];e.dispatchEvent(new Event('input',{bubbles:true}));}));await page.waitForTimeout(70);const before=await check('h2o');assert.ok(Math.max(...before.counts)>60);
  await page.getByRole('button',{name:'Resample',exact:true}).click();await page.waitForTimeout(60);const after=await check('h2o');assert.notDeepEqual(after.counts,before.counts);assert.ok(Math.max(...after.counts)>60);
  await page.screenshot({path:`/tmp/atlas-energy-chain-${width}-${theme}.png`,fullPage:true});
  console.log(`PASS chain ${width} ${theme}: all 48 moderator/control corners, uncapped stochastic counts, correct factor bars/survival, resampling, complete tree/text glyphs`);
 }
 assert.deepEqual(errors,[]);
}catch(e){console.error(e);await page.screenshot({path:'/tmp/atlas-energy-chain-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
