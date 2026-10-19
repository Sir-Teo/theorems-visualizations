// Actual native choices, local KaTeX, and measured cell bounds for REP 3.3.
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {findBrowser, installBrowserAssets} from '../scripts/browser.mjs';
import {createServer} from '../scripts/serve.mjs';

const dir='/tmp/rep-character-layout';mkdirSync(dir,{recursive:true});
const server=createServer({verificationAssets:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[];
const settle=page=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
try{for(const theme of ['light','dark']){
 const context=await browser.newContext({viewport:{width:1150,height:1500},colorScheme:theme});
 await installBrowserAssets(context,{local:true});const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/rep/ch03.js&id=rep-3.3&theme=${theme}&still=1&w=860`);
  await page.waitForFunction(()=>window.__done,null,{timeout:90000});
  assert.equal(await page.evaluate(()=>window.__done.renderer),'KaTeX 0.16.11');
  assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);
  const select=async(label,index)=>{await page.locator(`#viz .seg[aria-label="${label}"]:visible button`).nth(index).click();await settle(page);};
  const correction=async(value)=>{const toggle=page.locator('#viz .ctl-toggle');if(await toggle.locator('input').isChecked()!==value)await toggle.locator('label').click();await settle(page);};
  async function check(mode,agrees=true){
   await settle(page);assert.deepEqual(errors,[]);
   assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);
   assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);
   assert.deepEqual(await page.evaluate(()=>window.__inspectCanvases()),[]);
   assert.equal(await page.locator('.katex-error').count(),0);
   const readout=await page.locator('.viz-readout').innerText();
   assert.match(readout,agrees?/direct and formula agree on every class/:/class\(es\) disagree/);
   assert.doesNotMatch(readout,/NaN|undefined/);
   const geometry=await page.evaluate(()=>{
    const stage=window.__vizStages[0];
    const labels=stage._tex.filter(el=>el.style.display!=='none').map(el=>({
     tex:el.querySelector('annotation')?.textContent,x:parseFloat(el.style.left),y:parseFloat(el.style.top),
     width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,
    })).filter(el=>el.tex&&!['\\chi_A','\\chi_B'].includes(el.tex));
    const ys=[...new Set(labels.map(el=>el.y))].sort((a,b)=>a-b);
    const first=labels.filter(el=>el.y===ys[0]).sort((a,b)=>a.x-b.x),cw=first[1].x-first[0].x,ch=ys[1]-ys[0];
    return {cellWidth:cw,cellHeight:ch,labels:labels.length,stacked:labels.filter(el=>el.tex.includes('gathered')).length,
     overflow:labels.filter(el=>el.width>cw-4||el.height>ch-4)};
   });
   assert.ok(geometry.cellWidth>0&&geometry.cellHeight>0);
   assert.deepEqual(geometry.overflow,[],`${theme} ${mode} table overflow`);
   const screenshot=`${dir}/${theme}-${mode}.png`;await page.locator('#shot').screenshot({path:screenshot});
   results.push({theme,mode,status:'passed',readout,geometry,screenshot});
  }
  for(const [group,n] of [['S3',4],['Z5',3]]){
   await select('group',group==='S3'?0:1);
   // Binary operations: every A/B pair, including the largest cyclic sums.
   for(const operation of [0,1]){await select('operation',operation);
    for(let a=0;a<n;a++){await select('A',a);for(let b=0;b<n;b++){await select('B',b);await check(`${group}-op${operation}-A${a}-B${b}`);}}
   }
   // Unary operations: every A, with the correction both enabled and broken.
   for(const operation of [2,3,4]){await select('operation',operation);
    for(let a=0;a<n;a++){await select('A',a);await correction(true);await check(`${group}-op${operation}-A${a}-correct`);
     if(operation>=3){await correction(false);await check(`${group}-op${operation}-A${a}-broken`,false);await correction(true);}
    }
   }
  }
  // Also retain the originally reported wider layout with maximal complex cells.
  await page.evaluate(()=>document.getElementById('wrap').style.setProperty('--w','1080px'));
  await select('group',1);await select('operation',1);await select('A',2);await select('B',2);await check('Z5-wide-largest-tensor');
 }catch(error){results.push({theme,status:'failed',error:String(error.stack||error)});console.error(error);}
 finally{await context.close();}
}}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(`${dir}/browser.json`,JSON.stringify(results,null,2)+'\n');
console.log(`${results.filter(row=>row.status==='passed').length} REP3.3 native states passed`);
process.exitCode=results.some(row=>row.status!=='passed')?1:0;
