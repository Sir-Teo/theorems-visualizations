import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {npBernoulli} from '../content/info/source-audit.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({viewport:{width:1440,height:1700}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/content/info/ch03-b.js',async route=>{const response=await route.fetch(),body=(await response.text()).replace('info = {D,n,alpha,beta,lb:r.logBeta,boundary,equal:p0===q,last:cache.a.at(-1)[1]};','info = {D,n,alpha,beta,lb:r.logBeta,boundary,equal:p0===q,last:cache.a.at(-1)[1]};window.__stein={...info,p0,q,eps,r,cache};');await route.fulfill({response,body});});
await page.route(/\/tools\/harness\.html\?/,async route=>{const response=await route.fetch(),body=(await response.text()).replace('stats.stages++;',`stats.stages++;(window.__stages||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__rects=[];s.__paths=[];return begin();};for(const[k,list]of [['rect','__rects'],['path','__paths']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}`);await route.fulfill({response,body});});
const settle=()=>page.waitForTimeout(70),near=(a,b,t=2e-10)=>assert.ok(Math.abs(a-b)<t,`${a} ≈ ${b}`);
const key=async(i,k)=>{await page.locator('input[type=range]').nth(i).press(k);await settle();};
const check=async()=>{
 const d=await page.evaluate(()=>({...window.__stein,stages:window.__stages.map(s=>({x:s.xr,y:s.yr,rects:s.__rects,paths:s.__paths}))}));
 const want=npBernoulli(d.n,d.p0,d.q,d.eps);near(d.alpha,d.eps);near(d.lb,want.logBeta);assert.equal(d.boundary.k,want.boundary.k);near(d.boundary.probability,want.boundary.probability);
 assert.equal(d.stages[0].paths.length,3);for(const c of ['a','b','c'])for(const[x,y]of d.cache[c]){assert.ok(x>=d.stages[0].x[0]&&x<=d.stages[0].x[1]);assert.ok(y>=d.stages[0].y[0]&&y<d.stages[0].y[1]);}
 let alpha=0,beta=0;for(const[x0,y0,x1,y1,o]of d.stages[1].rects){assert.ok(x0>=d.stages[1].x[0]&&x1<=d.stages[1].x[1]);assert.ok(y1>=0&&y1<d.stages[1].y[1]);near(y0,0);if(o.fill==='orange')beta+=y1;if(o.fill==='red')alpha+=y1;}
 near(alpha,d.alpha);near(beta,d.beta);const read=await page.locator('.viz-readout').innerText();assert.match(read,/randomized optimum.*Boundary acceptance probability/s);assert.doesNotMatch(read,/NaN|undefined|Infinity/);assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);return d;
};
try{for(const theme of ['light','dark']){
 await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/info/ch03-b.js&id=info-3.10&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);const done=await page.evaluate(()=>window.__done);for(const k of ['errors','texErrors','blank'])assert.deepEqual(done[k],[]);await check();
 for(const eps of ['Home','End']){await key(2,eps);for(const [p,q]of [['Home','End'],['End','Home'],['Home','Home'],['End','End']]){await key(0,p);await key(1,q);for(const n of ['Home','End']){await key(3,n);const d=await check();if(p===q){assert.equal(d.boundary.k,null);near(d.lb,Math.log2(1-d.eps));}else if(d.n===300&&p==='Home'&&eps==='Home'){assert.ok(d.lb< -1074);assert.equal(d.beta,0);}}}
 }
 await key(0,'Home');await key(1,'End');await key(2,'Home');await key(3,'End');await page.screenshot({path:`/tmp/atlas-info-stein-extreme-${theme}.png`});
 await key(1,'Home');await check();await page.screenshot({path:`/tmp/atlas-info-stein-tied-${theme}.png`});
 console.log(`PASS ${theme} Stein:32 actual control endpoint combinations; randomization, displayed binomial masses, all curve bounds and underflow-safe readouts`);
}}finally{await browser.close();server.close();}
