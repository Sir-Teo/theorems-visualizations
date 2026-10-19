import assert from 'node:assert/strict';import{mkdirSync,writeFileSync}from'node:fs';import{chromium}from'playwright-core';
import{createServer}from'../scripts/serve.mjs';import{findBrowser,installBrowserAssets}from'../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const dir='/tmp/peer-corrections-shots';mkdirSync(dir,{recursive:true});const results=[];
const cases=[['physio','3.7','ch03-b.js'],['mathbio','3.4','ch03.js'],['mathbio','4.13','ch04-b.js'],['ecol','2.10','ch02-b.js'],['ecol','4.7','ch04-b.js'],['epi','2.7','ch02.js']];
try{for(const theme of['light','dark'])for(const[col,num,file]of cases){const id=`${col}-${num}`,page=await browser.newPage({viewport:{width:1300,height:1900}});await installBrowserAssets(page.context());const errors=[];page.on('pageerror',e=>errors.push(e.message));
const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const read=async()=>{await settle();return page.locator('.viz-readout').innerText();};
const end=async(n,key)=>{const el=page.locator('#viz input[type=range]').nth(n);await el.focus();await el.press(key);await settle();};
const shot=async(label)=>{const path=`${dir}/${id}-${theme}-${label}.png`;await page.locator('#shot').screenshot({path});return path;};
try{await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/${col}/${file}&id=${id}&theme=${theme}&wait=150&still`,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>window.__done,null,{timeout:60000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);const snapshots=[];
if(id==='physio-3.7'){
 const initial=await read();assert.match(initial,/power at 75\/min: 1.09 W/);snapshots.push({case:'normal-default',readout:initial,screenshot:await shot('normal')});
 await page.locator('.ctl-toggle label').click();await end(0,'End');await page.getByRole('button',{name:'weak',exact:true}).click();const high=await read();assert.match(high,/0.44/);assert.match(high,/0.56 W/);snapshots.push({case:'weak-high-afterload-split',readout:high,screenshot:await shot('weak-split')});await end(0,'Home');assert.match(await read(),/0.40/);
}else if(id==='mathbio-3.4'){
 await page.getByRole('button',{name:'symplectic Euler',exact:true}).click();await end(2,'End');const large=await read();assert.match(large,/energy is not exactly conserved/);assert.doesNotMatch(large,/V−V0=0\.00000/);snapshots.push({case:'symplectic-large-step',readout:large,screenshot:await shot('symplectic')});await end(2,'Home');assert.doesNotMatch(await read(),/NaN|Infinity/);await page.getByRole('button',{name:'reference (tiny RK4)',exact:true}).click();assert.match(await read(),/finite discretization error/);
}else if(id==='mathbio-4.13'){
 await end(0,'Home');await end(1,'End');assert.doesNotMatch(await read(),/NaN|Infinity/);await end(0,'End');await end(1,'Home');snapshots.push({case:'Gamma-kernel-forcing',readout:await read(),screenshot:await shot('renewal')});
}else if(id==='ecol-2.10'){
 await end(0,'End');await end(1,'Home');await page.getByRole('button',{name:'Resample',exact:true}).click();assert.doesNotMatch(await read(),/NaN|Infinity/);snapshots.push({case:'Taylor-sample-extremes',readout:await read(),screenshot:await shot('Taylor')});
}else if(id==='ecol-4.7'){
 for(const name of['Gaussian','exponential','box']){await page.getByRole('button',{name,exact:true}).click();await end(1,'End');assert.doesNotMatch(await read(),/NaN|Infinity/);}snapshots.push({case:'equal-width-overlap-presets',readout:await read(),screenshot:await shot('overlap')});
}else{
 await page.getByRole('button',{name:'PSA (PCPT)',exact:true}).click();await end(1,'Home');await end(2,'Home');const txt=await read();assert.match(txt,/least cost on displayed grid/);assert.match(txt,/interior target slope/);snapshots.push({case:'PSA-constrained-grid-endpoint',readout:txt,screenshot:await shot('PSA')});
}
assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.ok(await page.locator('.katex').count()>0);assert.ok(await page.evaluate(()=>typeof window.katex?.render==='function'));results.push({id,theme,status:'passed',snapshots});
}catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});}finally{await page.close();}console.log(results.at(-1).status,id,theme);}}
finally{await browser.close();await new Promise(r=>server.close(r));}writeFileSync('/tmp/peer-corrections-browser.json',JSON.stringify(results,null,2)+'\n');for(const r of results.filter(r=>r.status==='failed'))console.error(r.id,r.theme,r.error);process.exitCode=results.some(r=>r.status==='failed')?1:0;
