import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({viewport:{width:1440,height:1800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/content/nla/ch04.js',async route=>{
 const response=await route.fetch();let body=await response.text();
 body=body.replace('const {L,B} = partialFactors(fr);','const {L,B} = partialFactors(fr);window.__luState={fr,L,B,Acur};');
 body=body.replace('st = { n, md, max:', 'window.__growthData={data,d,h,meds,p95,seed};st = { n, md, max:');
 await route.fulfill({response,body});
});
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch();let body=await response.text();
 body=body.replace('stats.stages++;',`stats.stages++;(window.__stages||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__paths=[];s.__hist=[];return begin();};for(const [k,list]of[['path','__paths'],['hist','__hist']]){const fn=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return fn(...a);};}`);
 body=body.replace('return item.viz(v);',`const table=v.table;v.table=(...args)=>{const t=table(...args),draw=t.draw.bind(t);(window.__tables||=[]).push(t);t.draw=o=>{t.__values=Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>o.value(i,j)));return draw(o);};return t;};return item.viz(v);`);
 await route.fulfill({response,body});
});
const settle=()=>page.waitForTimeout(90),read=()=>page.locator('.viz-readout').innerText(),menu=async i=>{await page.locator('.ctl-select button').nth(i).click();await settle();},step=async key=>{await page.getByRole('slider',{name:'Step',exact:true}).focus();await page.keyboard.press(key);await settle();};
const clean=async()=>{assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.doesNotMatch(await read(),/NaN|undefined/);};
const open=async(id,theme)=>{await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/nla/ch04.js&id=nla-${id}&still=1&wait=200&theme=${theme}`);try{await page.waitForFunction(()=>window.__done);}catch(e){console.log({errors,body:await page.locator('body').innerText()});throw e;}const d=await page.evaluate(()=>window.__done);assert.deepEqual(d.errors,[]);assert.deepEqual(d.texErrors,[]);assert.deepEqual(d.blank,[]);};
const lu=async()=>{
 const s=await page.evaluate(()=>({...window.__luState,tables:window.__tables.map(t=>t.__values)}));
 assert.deepEqual(s.tables,[s.fr.W,s.L,s.B]);
 for(let i=0;i<4;i++)for(let j=0;j<4;j++){let x=0;for(let k=0;k<4;k++)x+=s.L[i][k]*s.B[k][j];assert.ok(Math.abs(x-s.Acur[i][j])<1e-10);}
 const t=await read();assert.match(t,new RegExp(`Flops so far: ${s.fr.flops}`));
 if(s.fr.kind==='breakdown'){assert.match(t,/Stopped at zero pivot/);assert.doesNotMatch(t,/Finished:/);}
 if(s.fr.kind==='done')assert.match(t,/Finished:/);
 await clean();return s;
};
const growth=async()=>{
 const s=await page.evaluate(()=>({...window.__growthData,stages:window.__stages.map(x=>({hist:x.__hist,paths:x.__paths,view:x.view}))}));
 assert.equal(s.h.counts.reduce((a,b)=>a+b,0),s.d.length);assert.ok(s.h.hi>Math.max(...s.d));
 assert.deepEqual(s.stages[0].hist[0][0].counts,s.h.counts);assert.deepEqual(s.stages[0].hist[0][0].edges,s.h.edges);
 for(const x of s.data){assert.ok(x.rho>=1&&Number.isFinite(x.rho));assert.ok(x.normalized>0);}
 const q=s.stages[1].paths.find(x=>x[1].color==='red')[0];assert.ok(Math.abs(q.at(-1)[0]-(1+Math.log2(1000)))<1e-12);assert.ok(Math.abs(q.at(-1)[1]-1000)<1e-10);
 for(const [n,y]of s.meds){assert.ok(n>=8&&n<=128&&y>=1&&y<1000);}
 assert.match(await read(),new RegExp(`${s.d.length}/${s.d.length} samples in histogram`));assert.match(await read(),/not an asymptotic exponent/);await clean();return s;
};
try{for(const theme of ['light','dark']){
 await open('4.1',theme);await step('Home');let s=await lu();assert.equal(s.B[3][0],6);
 for(let i=0;i<3;i++){await page.getByRole('button',{name:'Next step',exact:true}).click();await settle();await lu();}
 assert.match(await read(),/Total 34 flops/);await step('ArrowLeft');await lu();
 for(const mode of [2,3]){await menu(mode);await step('Home');await lu();await step('End');s=await lu();assert.equal(s.fr.kind,'breakdown');assert.equal(s.fr.k,mode===2?0:3);}
 for(let i=0;i<16;i++){await page.getByRole('button',{name:'Resample',exact:true}).click();await settle();await step('End');await lu();}
 await menu(2);await step('End');await page.screenshot({path:`/tmp/atlas-lu-breakdown-${theme}.png`});
 await menu(0);await step('Home');await page.screenshot({path:`/tmp/atlas-lu-partial-${theme}.png`});
 console.log(`PASS ${theme} LU: all textbook frames, actual tables/product/counts, early/final breakdown and16 random resets`);
 await open('4.6',theme);const first=await growth();for(let i=0;i<5;i++){await menu(i);await growth();}
 await page.getByRole('button',{name:'Resample',exact:true}).click();await settle();const second=await growth();assert.notDeepEqual(first.meds,second.meds);
 for(let i=0;i<5;i++){await menu(i);await growth();}
 await page.screenshot({path:`/tmp/atlas-lu-growth-${theme}.png`});
 console.log(`PASS ${theme} growth: every size at two seeds, full histogram mass, all-stage samples, exact red clipping and distinct resampling`);
 }assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
