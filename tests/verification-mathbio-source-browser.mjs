import assert from 'node:assert/strict';import {mkdirSync,writeFileSync}from'node:fs';import{chromium}from'playwright-core';
import{createServer}from'../scripts/serve.mjs';import{findBrowser,installBrowserAssets}from'../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const dir='/tmp/mathbio-source-verification-shots';mkdirSync(dir,{recursive:true});const results=[];
try{for(const theme of ['light','dark'])for(const[num,file]of [['2.14','ch02-b.js'],['3.6','ch03.js'],['3.8','ch03-b.js'],['3.17','ch03-c.js'],['3.19','ch03-d.js'],['3.20','ch03-d.js'],['3.22','ch03-d.js'],['3.23','ch03-d.js'],['4.4','ch04.js'],['4.10','ch04-b.js'],['4.12','ch04-b.js'],['4.14','ch04-b.js']].filter(c=>!process.env.MATHBIO_ITEMS||process.env.MATHBIO_ITEMS.split(',').includes(c[0]))){const id=`mathbio-${num}`,page=await browser.newPage({viewport:{width:1300,height:1800}});await installBrowserAssets(page.context());const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const read=async()=>{await settle();return page.locator('.viz-readout').innerText();};
 const slider=async(n,value)=>{await page.locator('#viz input[type=range]').nth(n).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);await settle();};
 try{await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/mathbio/${file}&id=${id}&theme=${theme}&wait=150&still`,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>window.__done,null,{timeout:120000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);
 const drag=async(x0,y0,x1,y1)=>{const p=await page.evaluate(([x0,y0,x1,y1])=>{const s=window.__vizStages[0],r=s.canvas.getBoundingClientRect();return[r.left+s.X(x0),r.top+s.Y(y0),r.left+s.X(x1),r.top+s.Y(y1)];},[x0,y0,x1,y1]);await page.mouse.move(p[0],p[1]);await page.mouse.down();await page.mouse.move(p[2],p[3],{steps:12});await page.mouse.up();await settle();};
 if(num==='2.14'){
  await page.getByRole('button',{name:'Set k = 1',exact:true}).click();assert.match(await read(),/marginal: unit-modulus/);await drag(0,3,-.6,5);assert.match(await read(),/locally asymptotically stable/);await drag(-.6,5,.6,5);assert.match(await read(),/equilibrium unstable/);
 }else if(num==='4.12'){
  await slider(0,1);assert.match(await read(),/M=1\.000/);await slider(0,3);await slider(1,60);assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(num==='4.14'){
  await page.getByRole('button',{name:'old bulge',exact:true}).click();await slider(0,.3);assert.match(await read(),/Euler/);await slider(0,2);await page.getByRole('button',{name:'uniform',exact:true}).click();assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(num==='4.10'){
  await slider(0,30);assert.match(await read(),/0\.9450/);assert.match(await read(),/1\.000000/);assert.doesNotMatch(await read(),/NaN|Infinity/);await slider(0,1);
 }else if(num==='4.4'){
  await slider(0,0);assert.match(await read(),/imprimitive: period 4/);await slider(1,0);assert.match(await read(),/No reproduction/);assert.doesNotMatch(await read(),/NaN|Infinity/);await slider(0,2);assert.match(await read(),/reducible/);assert.match(await read(),/extinct \(share undefined\)/);await slider(1,2);assert.match(await read(),/primitive: shape converges/);
 }else if(num==='3.6'){
  await slider(0,.6);await slider(1,0);assert.doesNotMatch(await read(),/NaN|Infinity/);await slider(0,.1);await slider(1,.3);assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(num==='3.8'){
  await page.getByRole('button',{name:'III',exact:true}).click();await slider(0,2);await slider(1,.1);assert.match(await read(),/10\.00/);await page.getByRole('button',{name:'Resample',exact:true}).click();await page.getByRole('button',{name:'I',exact:true}).click();await slider(1,1);assert.match(await read(),/1\.00/);assert.doesNotMatch(await read(),/NaN|Infinity/);await page.getByRole('button',{name:'II',exact:true}).click();
 }else if(num==='3.17'){
  await slider(0,0);await slider(1,1);assert.match(await read(),/neutral: identical species/);await slider(1,1.6);assert.match(await read(),/species 2 excludes species 1/);await slider(0,4);assert.match(await read(),/stable coexistence/);assert.match(await read(),/t=60/);
 }else if(num==='3.19'){
  await slider(0,1.2);await slider(1,.2);assert.match(await read(),/washout/);await slider(0,.05);await slider(1,6);assert.match(await read(),/culture survives/);
 }else if(num==='3.20'){
  await slider(0,.4);assert.match(await read(),/strain 2 \+ strain 4 \(tied\)/);await slider(0,.8);assert.match(await read(),/none \(washout\)/);await slider(1,5);assert.match(await read(),/predicted winner strain 1/);assert.ok(await page.evaluate(()=>window.__vizStages[0].X(4.8)<window.__vizStages[0].canvas.width));
 }else if(num==='3.22'){
  await slider(0,.4);await slider(1,2);assert.doesNotMatch(await read(),/NaN|Infinity/);await page.getByRole('button',{name:'Clear orbits',exact:true}).click();await slider(0,2);await slider(1,.4);assert.match(await read(),/small-oscillation period/);
 }else{
  await page.getByRole('button',{name:'1. periodic cycle',exact:true}).click();await drag(2.4,1,.3,2.5);assert.match(await read(),/0\.30/);assert.match(await read(),/2\.50/);assert.match(await read(),/measured period/);await page.getByRole('button',{name:'Start at equilibrium',exact:true}).click();assert.match(await read(),/no complete nonzero cycle/);await slider(0,1.5);await slider(1,1.5);await slider(2,.45);await page.getByRole('button',{name:'3. averages disturbed',exact:true}).click();assert.match(await read(),/1\.950/);assert.ok(await page.evaluate(()=>window.__vizStages[3].Y(1.95)>0));await page.getByRole('button',{name:'2. averages conserved',exact:true}).click();assert.doesNotMatch(await read(),/NaN|Infinity/);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.ok(await page.evaluate(()=>typeof window.katex?.render==='function'));assert.ok(await page.locator('.katex').count()>0);
 const screenshot=`${dir}/${id}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id,theme,status:'passed',screenshot});
 }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});}finally{await page.close();}console.log(`${results.at(-1).status} ${id} ${theme}`);}}
finally{await browser.close();await new Promise(r=>server.close(r));}writeFileSync(process.env.MATHBIO_REPORT||'/tmp/mathbio-source-verification-browser.json',JSON.stringify(results,null,2)+'\n');for(const r of results.filter(r=>r.status==='failed'))console.error(r.id,r.theme,r.error);process.exitCode=results.some(r=>r.status==='failed')?1:0;
