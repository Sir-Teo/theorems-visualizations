import assert from 'node:assert/strict';import {mkdirSync,writeFileSync}from'node:fs';import{chromium}from'playwright-core';
import{createServer}from'../scripts/serve.mjs';import{findBrowser,installBrowserAssets}from'../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const dir='/tmp/physio-pharm-verification-shots';mkdirSync(dir,{recursive:true});const results=[];
const cases=[['physio','2.7','ch02-b.js'],['physio','3.1','ch03.js'],['physio','3.11','ch03-b.js'],['physio','4.13','ch04-c.js'],['physio','4.14','ch04-c.js'],['physio','4.16','ch04-d.js'],['physio','4.17','ch04-d.js'],['physio','4.18','ch04-d.js'],['pharm','3.4','ch03.js'],['pharm','3.9','ch03-b.js'],['pharm','3.12','ch03-b.js'],['pharm','4.5','ch04.js'],['pharm','4.9','ch04.js'],['physio','3.6','ch03.js'],['physio','3.8','ch03-b.js'],['physio','3.9','ch03-b.js'],['physio','4.2','ch04.js'],['physio','4.9','ch04-b.js'],['physio','4.10','ch04-b.js'],['physio','4.6','ch04-b.js'],['physio','4.7','ch04-b.js'],['physio','4.8','ch04-b.js'],['physio','4.15','ch04-c.js'],['physio','4.20','ch04-d.js'],['physio','4.19','ch04-d.js'],['pharm','3.6','ch03.js'],['pharm','3.7','ch03-b.js'],['pharm','3.11','ch03-b.js'],['pharm','4.6','ch04.js']].filter(c=>!process.env.PHYSIO_PHARM_ITEMS||process.env.PHYSIO_PHARM_ITEMS.split(',').includes(`${c[0]}-${c[1]}`));
try{for(const theme of ['light','dark'])for(const[col,num,file]of cases){const id=`${col}-${num}`,page=await browser.newPage({viewport:{width:1200,height:1800}});await installBrowserAssets(page.context());const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const read=async()=>{await settle();return page.locator('.viz-readout').innerText();};
 const slider=async(n,value)=>{await page.locator('#viz input[type=range]').nth(n).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);await settle();};
 try{await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/${col}/${file}&id=${id}&theme=${theme}&wait=150&still`,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>window.__done,null,{timeout:60000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);
 if(id==='physio-2.7'){
  await slider(0,2);await page.getByRole('button',{name:'slow twitch',exact:true}).click();assert.match(await read(),/fused tetanus/);await slider(0,0);assert.match(await read(),/separate twitches/);
 }else if(id==='physio-3.1'){
  await slider(0,50);assert.match(await read(),/1200 ms/);await slider(0,120);assert.match(await read(),/500 ms/);await page.locator('.ctl-toggle label').click();assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(id==='physio-3.11'){
  await slider(0,3);await slider(1,.7);assert.doesNotMatch(await read(),/NaN|Infinity/);assert.ok(await page.evaluate(()=>window.__vizStages[1].Y(37.3)<window.__vizStages[1].canvas.height));await slider(0,32);await slider(1,2.6);assert.match(await read(),/23.5 mmHg/);
 }else if(id==='physio-4.13'){
  await slider(0,30);await slider(1,8);await slider(2,0);await slider(3,.6);assert.match(await read(),/no steady state below 15 L/);await slider(0,0);await slider(1,28);await slider(2,1);await slider(3,0);assert.match(await read(),/excess 0.00 L/);
 }else if(id==='physio-4.14'){
  await slider(0,1.5);await slider(1,3000);assert.doesNotMatch(await read(),/NaN|Infinity/);assert.match(await read(),/Reynolds|1060/);
 }else if(id==='physio-4.16'){
  await slider(0,0);await slider(3,200);assert.match(await read(),/gain[\s\S]*0.00/);assert.ok(await page.evaluate(()=>window.__vizStages[0].Y(6.3)>0));await slider(0,1);await slider(1,1.4);await slider(2,30);assert.match(await read(),/gain[\s\S]*1.00/);
 }else if(id==='physio-4.17'){
  await slider(0,-1500);assert.match(await read(),/No forward-return/);assert.match(await read(),/CO = 0.0/);await slider(0,1500);await slider(1,1);await slider(2,1.6);await slider(3,.8);assert.ok(await page.evaluate(()=>window.__vizStages[0].X(26)<window.__vizStages[0].canvas.width));assert.ok(await page.evaluate(()=>window.__vizStages[0].Y(29)>0));assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(id==='physio-4.18'){
  await slider(0,0);assert.match(await read(),/difference/);await slider(0,90);await slider(1,500);await slider(2,0);assert.doesNotMatch(await read(),/NaN|Infinity/);await slider(2,100);assert.match(await read(),/loss after recovery: 0.0/);
 }else if(id==='pharm-3.4'){
  const before=await read();await page.locator('.ctl-toggle label').nth(3).click();const after=await read();assert.notEqual(before,after);const match=after.match(/last dose at[\s\S]*?([\d.]+) min/);assert.ok(match,after);assert.ok(Number(match[1])>30,after);await slider(0,.05);assert.doesNotMatch(await read(),/NaN|Infinity/);assert.ok(await page.evaluate(()=>window.__vizStages[0].X(120)<window.__vizStages[0].canvas.width));
 }else if(id==='pharm-3.9'){
  await page.getByRole('button',{name:'hydrophilic',exact:true}).click();await slider(0,1.5);await slider(1,Math.log10(5));await slider(2,Math.log10(3000));assert.match(await read(),/1.000000/);await page.getByRole('button',{name:'0–50 h',exact:true}).click();await page.getByRole('button',{name:'lipophilic',exact:true}).click();await slider(1,Math.log10(.02));assert.match(await read(),/1.000000/);
 }else if(id==='pharm-3.12'){
  await slider(0,Math.log10(480));await page.getByRole('button',{name:'constant rate',exact:true}).click();assert.doesNotMatch(await read(),/NaN|Infinity/);await slider(0,0);await page.getByRole('button',{name:'holds concentration',exact:true}).click();assert.match(await read(),/illustrative/);
 }else if(id==='pharm-4.5'){
  await page.getByRole('button',{name:'digoxin',exact:true}).click();await page.getByRole('button',{name:'centre on target',exact:true}).click();assert.match(await read(),/mean[\s\S]*1.00[\s\S]*ng/);await slider(1,48);await page.getByRole('button',{name:'theophylline',exact:true}).click();await page.getByRole('button',{name:'centre on target',exact:true}).click();assert.match(await read(),/14.1/);
 }else if(id==='pharm-4.9'){
  await slider(1,12);await slider(2,Math.log10(8));await page.getByRole('button',{name:'q24h',exact:true}).click();assert.doesNotMatch(await read(),/NaN|Infinity/);await slider(1,1.5);await slider(2,Math.log10(.25));await page.getByRole('button',{name:'q12h',exact:true}).click();assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(id==='physio-3.6'){
  await page.getByRole('button',{name:'athlete',exact:true}).click();await slider(0,40);assert.match(await read(),/125|126/);await page.getByRole('button',{name:'small, stiff',exact:true}).click();await slider(0,130);assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(id==='physio-3.8'){
  await page.getByRole('button',{name:'+ hypertrophy',exact:true}).click();assert.match(await read(),/wall is not thin/);await slider(0,2.4);await slider(1,80);await slider(2,60);await slider(3,4);const txt=await read(),pk=Number(txt.match(/peak stress (\d+) kPa/)[1]);assert.ok(await page.evaluate(pk=>window.__vizStages[1].Y(pk)>0,pk));
 }else if(id==='physio-3.9'){
  await slider(0,-120);assert.match(await read(),/left-axis deviation/);await slider(0,90);assert.match(await read(),/right-axis deviation/);assert.match(await read(),/Einthoven/);
 }else if(id==='physio-4.2'){
  await slider(0,3);await slider(1,1);await slider(2,1);await slider(3,50);assert.match(await read(),/exceed the long, laminar/);assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(id==='physio-4.9'){
  await slider(0,2.5);await slider(1,1);await slider(2,.9);const p=await page.evaluate(()=>{const s=window.__vizStages[0],r=s.canvas.getBoundingClientRect();return[r.left+s.X(.05),r.top+s.Y(1.12),r.left+s.X(.85),r.top+s.Y(1.12)];});await page.mouse.move(p[0],p[1]);await page.mouse.down();await page.mouse.move(p[2],p[3],{steps:12});await page.mouse.up();await slider(2,.2);assert.ok(await page.evaluate(()=>window.__vizStages[0].handles[0].x<=.191));assert.ok(await page.evaluate(()=>window.__vizStages.every(s=>s.Y(2)>0)));assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(id==='physio-4.10'){
  await slider(0,25);await slider(1,3);assert.match(await read(),/167 cm/);assert.ok(await page.evaluate(()=>window.__vizStages[1].Y(166.7)>0));assert.ok(await page.evaluate(()=>window.__vizStages[0].Y(11250)>0));await slider(0,2);await slider(1,.3);await slider(2,.15);assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(id==='physio-4.6'){
  await slider(0,120);await slider(1,500);assert.match(await read(),/capacity exceeded/);await slider(0,2);await slider(1,10);assert.doesNotMatch(await read(),/capacity exceeded/);
 }else if(id==='physio-4.7'){
  await slider(0,2);await slider(1,Math.log10(8));await slider(2,130);const s=await read(),m=s.match(/mean pressure ([\d.]+) mmHg vs[\s\S]*?=\s*([\d.]+)/);assert.ok(m,s);assert.ok(Math.abs(Number(m[1])-Number(m[2]))<.2,s);assert.ok(await page.evaluate(()=>window.__vizStages[0].Y(304)>=0));
 }else if(id==='physio-4.8'){
  await page.getByRole('button',{name:'old / stiff',exact:true}).click();await slider(1,.15);await slider(2,1.8);assert.match(await read(),/R\+Z/);assert.ok(await page.evaluate(()=>window.__vizStages[0].Y(220)>=0));
 }else if(id==='physio-4.15'){
  await slider(0,Math.log10(6));assert.match(await read(),/93°/);assert.match(await read(),/24%/);await page.getByRole('button',{name:'arteriole',exact:true}).click();assert.match(await read(),/not a thin layer/);await page.getByRole('button',{name:'aorta',exact:true}).click();assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(id==='physio-4.19'){
  await slider(1,4);await slider(2,2500);assert.match(await read(),/104\.2 lb/);assert.ok(await page.evaluate(()=>window.__vizStages[0].Y(105)>=0));await page.getByRole('button',{name:'3 stroke back',exact:true}).click();await slider(4,0);await page.getByRole('button',{name:'4 release',exact:true}).click();await slider(4,1);
 }else if(id==='pharm-4.6'){
  await slider(0,90);await slider(1,40);await slider(2,6);await page.getByRole('button',{name:'female',exact:true}).click();await slider(3,1);assert.match(await read(),/0\.03/);await slider(0,20);await slider(1,120);await slider(2,.5);assert.match(await read(),/1\.00/);assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(id==='physio-4.20'){
  await slider(0,10);await slider(1,120);assert.ok(await page.evaluate(()=>{const s=window.__vizStages[1];return s.Y(-516)<s.canvas.height&&s.Y(636)>=0;}));assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(id==='pharm-3.6'){
  await page.getByRole('button',{name:'parallel tube',exact:true}).click();await slider(1,0);await slider(2,Math.log10(90));assert.match(await read(),/0\.63[2-9]/);await slider(0,300);await slider(2,Math.log10(20000));assert.ok(await page.evaluate(()=>window.__vizStages[0].X(20000)<window.__vizStages[0].canvas.width));await page.getByRole('button',{name:'well-stirred',exact:true}).click();assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(id==='pharm-3.7'){
  await slider(3,0);const a=await read();await page.getByRole('button',{name:'inhibited (÷4)',exact:true}).click();const b=await read();assert.notEqual(a,b);assert.match(b,/324\.00/);await slider(2,160);assert.match(await read(),/324\.00/);await slider(3,Math.log10(5000));await page.getByRole('button',{name:'induced (×3)',exact:true}).click();assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else{
  await slider(0,.9);await slider(1,1);assert.match(await read(),/10\.000/);await slider(2,10);assert.match(await read(),/10\.000/);await slider(1,0);assert.match(await read(),/1\.000/);assert.match(await read(),/0 secondary peaks/);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.ok(await page.evaluate(()=>typeof window.katex?.render==='function'));if(!['physio-4.20','physio-4.19','physio-3.11'].includes(id))assert.ok(await page.locator('.katex').count()>0);
 const screenshot=`${dir}/${id}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id,theme,status:'passed',screenshot});
 }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});}finally{await page.close();}console.log(`${results.at(-1).status} ${id} ${theme}`);}}
finally{await browser.close();await new Promise(r=>server.close(r));}writeFileSync(process.env.PHYSIO_PHARM_REPORT||'/tmp/physio-pharm-verification-browser.json',JSON.stringify(results,null,2)+'\n');for(const r of results.filter(r=>r.status==='failed'))console.error(r.id,r.theme,r.error);process.exitCode=results.some(r=>r.status==='failed')?1:0;
