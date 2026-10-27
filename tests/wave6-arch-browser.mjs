// Owned default/rich-field browser gate; actual native actions have their own gate.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash}from'node:crypto';
import {chromium}from'playwright-core';
import {createServer}from'../scripts/serve.mjs';
import {findBrowser}from'../scripts/browser.mjs';
import {installArchProbe,captureArch,arch6Screenshot}from'./wave6-arch-browser.shared.mjs';
import chapter from'../content/arch/ch06.js';
import syllabus from'../content/arch/syllabus.js';
const out=process.env.ARCH6_SHOTS||'/workspace/scratch/wave6-arch-research/default-draft-v1';fs.mkdirSync(out,{recursive:true});
const files=['content/arch/ch06.js','content/arch/ch06.shared.js','content/arch/ch06.viz.js','content/arch/syllabus.js','assets/js/viz/core.js','assets/js/viz/math.js','assets/js/app.js','assets/js/share-state.js','assets/css/style.css','data/index.json','data/col/arch.json','tests/wave6-arch-browser.mjs','tests/wave6-arch-browser.shared.mjs'];
const hashes=()=>Object.fromEntries(files.map(p=>[p,createHash('sha256').update(fs.readFileSync(new URL('../'+p,import.meta.url))).digest('hex')])),before=hashes();
const shard=JSON.parse(fs.readFileSync(new URL('../data/col/arch.json',import.meta.url)));
for(const i of chapter.items){const row=syllabus.chapters.find(c=>c.n===6).items.find(r=>r.num===i.num);assert.equal(row.pic,i.caption);assert.deepEqual(row.refs,i.refs);assert.equal(shard['arch-'+i.num].st,i.statement);}
const server=createServer();await new Promise(r=>server.listen(0,r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true});const page=await browser.newPage({viewport:{width:320,height:1100},deviceScaleFactor:1});await installArchProbe(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));const rows=[];
try{
 for(const n of(process.env.ARCH6_IDS?.split(',').map(Number)||Array.from({length:11},(_,i)=>i+1)))for(const theme of(process.env.ARCH6_THEMES?.split(',')||['light','dark']))for(const width of(process.env.ARCH6_WIDTHS?.split(',').map(Number)||[1200,320])){
  const id='arch-6.'+n,label=id+'-'+theme+'-'+width;await page.setViewportSize({width,height:1100});await page.goto(`http://localhost:${server.address().port}/?qaTheme=${theme}#${'/t/'+id}`);await page.waitForFunction(()=>window.__arch6Runtime?.host===document.querySelector('#viz')&&document.querySelector('.viz-readout')?.textContent.length>20);const row=await captureArch(page);row.label=label;row.pageErrors=[...errors];row.prose=await page.locator('#idea').innerText();row.verify=await page.locator('.verify-badge').count();
  await page.screenshot({path:out+'/'+label+'-rich.png',fullPage:true});await arch6Screenshot(page,out+'/'+label+'.png');row.richFields=[];
  for(const[selector,name]of[['.statement','statement'],['#idea','idea'],['#caption','caption'],['.refs-inline','refs'],['.scope','scope']])if(await page.locator(selector).count()){const clip=await page.locator(selector).evaluate(e=>{const b=e.getBoundingClientRect(),x=Math.max(0,b.x+scrollX-2),y=Math.max(0,b.y+scrollY-2);return{x,y,width:Math.min(document.documentElement.scrollWidth-x,b.width+4),height:b.height+4};});const file=out+'/'+label+'-'+name+'.png';await page.screenshot({path:file,clip,fullPage:true});row.richFields.push({selector,name,file,clip});}
  fs.writeFileSync(out+'/'+label+'.json',JSON.stringify(row,null,2)+'\n');rows.push(row);console.log(JSON.stringify({label,issues:row.issues,pageErrors:row.pageErrors,model:row.modelName,stages:row.stages.length,richFields:row.richFields.length}));
 }
 assert.deepEqual(hashes(),before,'Guarded capture source/data/harness hashes unchanged');fs.writeFileSync(out+'/receipt.json',JSON.stringify({sourceHashes:before,layouts:rows.length,stageCount:rows.reduce((n,r)=>n+r.stages.length,0),issues:rows.flatMap(r=>r.issues.map(i=>({label:r.label,...i}))),pageErrors:errors},null,2)+'\n');assert.deepEqual(errors,[]);assert.ok(rows.every(r=>r.issues.length===0),'See retained layout receipts');
}finally{await browser.close();await new Promise(r=>server.close(r));}
