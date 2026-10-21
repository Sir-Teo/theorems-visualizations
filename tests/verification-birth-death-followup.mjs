// Actual browser controls and captured drawing data for the seven stopping/examples reviews.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {lyapunovDrift,lyapunovCertificate,logBirthDeathScale,birthDeathClassification,zeroSuccessUpper95}from'../content/prob/ch05-birth-death-audit.shared.js';
import {ringPos,chain5} from '../content/prob/ch05-a.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1250,height:1800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch(),body=(await response.text()).replace('stats.stages++;',`stats.stages++;
 (window.__auditStages ||= []).push(s);s.__handles=[];
 if(s.handle){const h=s.handle.bind(s);s.handle=(...a)=>{const q=h(...a);s.__handles.push(q);return q;};}
 const begin=s.begin.bind(s);s.begin=()=>{s.__paths=[];s.__dots=[];s.__hists=[];s.__rects=[];s.__hlines=[];s.__fns=[];s.__bars=[];s.__lines=[];s.__arrows=[];return begin();};
 for(const [key,list]of[['path','__paths'],['dots','__dots'],['dot','__dots'],['hist','__hists'],['rect','__rects'],['hline','__hlines'],['bars','__bars'],['line','__lines'],['arrow','__arrows']]){const f=s[key].bind(s);s[key]=(...a)=>{s[list].push(a);return f(...a);};}
 const fn=s.fn.bind(s);s.fn=(f,style={})=>{s.__fns.push([Array.from({length:401},(_,i)=>{const x=(style.domain||s.view.x)[0]+i/400*((style.domain||s.view.x)[1]-(style.domain||s.view.x)[0]);return[x,f(x)];}),style]);return fn(f,style);};`);
 await route.fulfill({response,body});
});
const settle=()=>page.waitForTimeout(90);
const open=async(id,theme)=>{const file=id.startsWith('5.3')?'ch05-a2.js':'ch05-a.js';await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/prob/${file}&id=prob-${id}&still=1&wait=120&theme=${theme}`);await page.waitForFunction(()=>window.__done);const r=await page.evaluate(()=>window.__done);assert.deepEqual(r.errors,[]);assert.deepEqual(r.texErrors,[]);};
const read=async()=>(await page.locator('.viz-readout').innerText()).replace(/\s+/g,' ');
const menu=async(i,j)=>{await page.locator('.ctl-select').nth(i).locator('button').nth(j).click();await settle();};
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const button=async name=>{await page.getByRole('button',{name,exact:true}).click();await settle();};
const sample=()=>page.evaluate(()=>window.__auditStages.map(s=>({view:s.view,paths:s.__paths,dots:s.__dots,hists:s.__hists,rects:s.__rects,hlines:s.__hlines,fns:s.__fns,bars:s.__bars,lines:s.__lines,arrows:s.__arrows,handles:s.__handles.map(h=>[h.x,h.y])})));
const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const bounds=async()=>{const stages=await sample();for(const s of stages)for(const [pts]of [...s.paths,...s.fns])for(const [x,y]of pts){assert.ok(Number.isFinite(x)&&Number.isFinite(y));assert.ok(y>=s.view.y[0]-1e-9&&y<=s.view.y[1]+1e-9,`clipped ordinate ${y} in ${s.view.y}`);}for(const s of stages){for(const r of s.rects)for(const y of [r[1],r[3]])assert.ok(y>=s.view.y[0]-1e-9&&y<=s.view.y[1]+1e-9);for(const l of s.lines)for(const y of [l[1],l[3]])assert.ok(y>=s.view.y[0]-1e-9&&y<=s.view.y[1]+1e-9);}assert.doesNotMatch(await read(),/NaN/);return stages;};
const click=async(stage,x,y)=>{const p=await page.evaluate(({stage,x,y})=>{const s=window.__auditStages[stage],r=s.canvas.getBoundingClientRect();return[r.x+s.X(x),r.y+s.Y(y)];},{stage,x,y});await page.mouse.click(...p);await settle();};
const drag=async(stage,index,x,y)=>{const p=await page.evaluate(({stage,index,x,y})=>{const s=window.__auditStages[stage],h=s.__handles[index],r=s.canvas.getBoundingClientRect();return[r.x+s.X(h.x),r.y+s.Y(h.y),r.x+s.X(x),r.y+s.Y(y)];},{stage,index,x,y});await page.mouse.move(p[0],p[1]);await page.mouse.down();await page.mouse.move(p[2],p[3],{steps:12});await page.mouse.up();await settle();};


const setValue=async(value)=>{const sliderEl=page.locator('input[type=range]'),cur=Number(await sliderEl.inputValue()),step=Number(await sliderEl.getAttribute('step'));await sliderEl.focus();const d=Math.round((value-cur)/step);for(let k=0;k<Math.abs(d);k++)await page.keyboard.press(d>0?'ArrowRight':'ArrowLeft');await settle();near(Number(await sliderEl.inputValue()),value);};
try{for(const theme of ['light','dark']){
 await open('5.3.8',theme);for(let j=0;j<3;j++){await menu(0,j);for(const b of [0,.25,.26,.6]){await setValue(b);await button('Resample');const ss=await bounds(),kind=['x','log','sq'][j],q=lyapunovCertificate(kind,b);assert.match(await read(),q.holds?/criterion holds/:/does not meet the criterion/);const rects=ss[0].rects;assert.equal(rects.length,60);rects.forEach((r,k)=>{near(r[3],lyapunovDrift(kind,b,k+1));assert.equal(r[4].fill,r[3]<=0?'green':'red');});assert.doesNotMatch(await read(),/checked up to|checked to|still positive at/);}}await menu(0,1);await setValue(.25);await page.screenshot({path:`/tmp/atlas-birth-death-critical-drift-${theme}.png`});console.log(`PASS ${theme} Lyapunov: all functions at zero/critical/above-critical/max b, exact signs and analytic certificates, resampling`);
 await open('5.3.11',theme);for(let j=0;j<3;j++){await menu(0,j);for(const b of [.25,-.2,.45,0]){await setValue(b);await button('Resample');const ss=await bounds(),family=['inv','sqrt','const'][j],logs=logBirthDeathScale(family,b,10000),q=birthDeathClassification(family,b);assert.match(await read(),q.recurrent?/Analytic classification: recurrent/:/Analytic classification: transient/);assert.doesNotMatch(await read(),/ratio.*series diverges|gain shrinks/);const scale=ss[0].paths[0][0],escape=ss[1].paths[0][0];scale.forEach(([M,y])=>near(y,logs[M]/Math.LN10,1e-8));escape.forEach(([N,p])=>near(p,Math.exp(-logs[N]),1e-10));const zeroes=ss[1].dots.filter(d=>d[2]?.hollow);for(const d of zeroes)near(d[1],zeroSuccessUpper95(3000));assert.equal(ss[1].arrows.length,zeroes.length);for(const a of ss[1].arrows)for(const y of[a[1],a[3]])assert.ok(y>=ss[1].view.y[0]&&y<=ss[1].view.y[1]);for(const d of ss[1].dots){assert.ok(d[0]>ss[1].view.x[0]&&d[0]<ss[1].view.x[1]);assert.ok(d[1]>=ss[1].view.y[0]&&d[1]<=ss[1].view.y[1]);}if(j===2&&b===-.2){assert.ok(scale.at(-1)[1]>3000);assert.ok(escape.at(-1)[1]<1e-20);assert.ok(zeroes.length>0);await page.screenshot({path:`/tmp/atlas-birth-death-huge-scale-${theme}.png`});}}}console.log(`PASS ${theme} birth/death scale: all three families at critical/negative/positive/zero b, overflow-safe true sums, unfloored tiny escapes and zero-success bounds`);
}assert.deepEqual(errors,[]);}finally{await browser.close();server.close();}
