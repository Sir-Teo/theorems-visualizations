// Each segmented group gets its own evidence namespace, including users vs passes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {installMacroProbe,captureMacro,macroScreenshot} from './wave6-macro-browser.shared.mjs';
import {macroScience} from './wave6-macro-native-science.mjs';
import chapter from '../content/macro/ch06.js';
const output=process.env.MACRO_SHOTS||'/tmp/wave6-macro-modes-complete';fs.mkdirSync(output,{recursive:true});
const inputs=['../content/macro/ch06.js','../content/macro/ch06.viz.js','../content/macro/ch06.shared.js','../content/macro/ch06.exact.shared.js','../content/macro/ch06.data.shared.js','../content/macro/syllabus.js','../assets/js/viz/core.js','../assets/js/viz/math.js','../assets/js/share-state.js','../data/col/macro.json','../data/index.json','./wave6-macro-browser.shared.mjs','./wave6-macro-native-science.mjs','./wave6-macro-mode-coverage.mjs'];
const hashes=()=>Object.fromEntries(inputs.map(p=>[p,createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex')]));const sourceHashes=hashes();
const shard=JSON.parse(fs.readFileSync(new URL('../data/col/macro.json',import.meta.url)));for(const item of chapter.items)assert.equal(shard['macro-'+item.num].st,item.statement,'current rebuilt statement');
const server=createServer();await new Promise(r=>server.listen(0,r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({viewport:{width:320,height:1200},deviceScaleFactor:1});await installMacroProbe(page);
const errors=[],rows=[],files=new Set();let comparisons=0,checks=0,actions=0,shares=0;page.on('pageerror',e=>errors.push(e.message));
async function audit(id,label){const q=await captureMacro(page);assert.equal(errors.length,0,label+' page errors');assert.equal(q.drawErrors.length,0,label+' draw errors');assert.deepEqual(q.issues,[],label+' complete scientific/rich ink');comparisons+=macroScience(id,q);checks++;return q;}
async function open(id,theme,url){await page.goto('about:blank');const target=new URL(url||base+`/?qaTheme=${theme}#/t/macro-6.${id}`);target.searchParams.set('qaTheme',theme);await page.goto(target.href);await page.waitForFunction(()=>window.__macroRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);const q=await audit(id,'open '+id);assert.equal(q.theme,theme);return q;}
try{
 for(const id of chapter.items.map((_,j)=>j+1))for(const theme of ['light','dark']){
  const baseline=await open(id,theme),groups=await page.locator('#viz .seg').evaluateAll(es=>es.map(e=>({name:e.getAttribute('aria-label'),options:[...e.querySelectorAll('button')].map(b=>b.textContent)})));
  for(const [groupIndex,{name,options}]of groups.entries())for(const [optionIndex,option]of options.entries()){
   await open(id,theme);await page.getByRole('group',{name,exact:true}).getByRole('button',{name:option,exact:true}).click();actions++;
   const label=`${id}-${theme}-320-mode-g${groupIndex}-o${optionIndex}`,q=await audit(id,label),wanted=structuredClone(baseline.state),part=wanted.parts.find(([k])=>k.startsWith('select:'+name+':'));assert.ok(part);part[1][0]=optionIndex;assert.deepEqual(q.state.parts,wanted.parts,'only the actual intended selector changes');
   const file=output+'/'+label+'.png';assert.ok(!files.has(file),'unique group/option evidence path');files.add(file);await macroScreenshot(page,file);
   await page.locator('.viz-share summary').click();await page.getByRole('button',{name:'Create state link',exact:true}).click();actions++;const url=await page.locator('.share-url').inputValue(),after=await open(id,theme,url);assert.deepEqual(after.state.parts,q.state.parts,'actual group-specific Share replay');assert.equal(after.readout,q.readout,'identical replayed explanation');shares++;
   rows.push({id,theme,width:320,group:name,groupIndex,option,optionIndex,file,state:q.state});console.log(JSON.stringify({label,shares,checks,comparisons}));
  }
 }
 assert.equal(rows.length,88,'every offered group/option in both narrow themes');assert.equal(files.size,88,'no overwritten mode evidence');assert.deepEqual(hashes(),sourceHashes,'all captured source bytes remained fixed');
 fs.writeFileSync(output+'/summary.json',JSON.stringify({status:'PASS',layouts:14,modes:rows.length,actions,shares,checks,comparisons,errors,sourceHashes,rows},null,2)+'\n');
}catch(error){fs.writeFileSync(output+'/failure.txt',error.stack||String(error));try{fs.writeFileSync(output+'/failure-state.json',JSON.stringify(await captureMacro(page),null,2));await page.screenshot({path:output+'/failure.png',fullPage:true});}catch{}throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
