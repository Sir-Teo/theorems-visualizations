// Each segmented group gets its own evidence namespace, including users vs passes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {installFinProbe,captureFin,finScreenshot} from './wave6-fin-browser.shared.mjs';
import {finScience} from './wave6-fin-native-science.mjs';
import chapter from '../content/fin/ch07.js';
import {PRESETS} from '../content/fin/ch07.shared.js';
const output=process.env.FIN_SHOTS||'/tmp/wave6-fin-modes-complete';fs.mkdirSync(output,{recursive:true});
const inputs=['../content/fin/ch07.js','../content/fin/ch07.viz.js','../content/fin/ch07.shared.js','../content/fin/ch07.exact.shared.js','../content/fin/ch07.law.shared.js','../content/fin/ch07.cashflow.shared.js','../content/fin/ch07.positions.shared.js','../content/fin/syllabus.js','../assets/js/viz/core.js','../assets/js/viz/math.js','../assets/js/share-state.js','../data/col/fin.json','../data/index.json','./wave6-fin-browser.shared.mjs','./wave6-fin-native-science.mjs','./wave6-fin-mode-coverage.mjs'];
const hashes=()=>Object.fromEntries(inputs.map(p=>[p,createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex')]));const sourceHashes=hashes();
const shard=JSON.parse(fs.readFileSync(new URL('../data/col/fin.json',import.meta.url)));for(const item of chapter.items)assert.equal(shard['fin-'+item.num].st,item.statement,'current rebuilt statement');
const server=createServer();await new Promise(r=>server.listen(0,r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({viewport:{width:320,height:1200},deviceScaleFactor:1});await installFinProbe(page);
const errors=[],rows=[],files=new Set();let comparisons=0,checks=0,actions=0,shares=0;page.on('pageerror',e=>errors.push(e.message));
async function audit(id,label){const q=await captureFin(page);assert.equal(errors.length,0,label+' page errors');assert.equal(q.drawErrors.length,0,label+' draw errors');assert.deepEqual(q.issues,[],label+' complete scientific/rich ink');comparisons+=finScience(id,q);checks++;return q;}
async function open(id,theme,url){await page.goto('about:blank');const target=new URL(url||base+`/?qaTheme=${theme}#/t/fin-7.${id}`);target.searchParams.set('qaTheme',theme);await page.goto(target.href);await page.waitForFunction(()=>window.__finRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);const q=await audit(id,'open '+id);assert.equal(q.theme,theme);return q;}
try{
 for(const id of chapter.items.map((_,j)=>j+1))for(const theme of ['light','dark']){
  const baseline=await open(id,theme),groups=await page.locator('#viz .seg').evaluateAll(es=>es.map(e=>({name:e.getAttribute('aria-label'),options:[...e.querySelectorAll('button')].map(b=>b.textContent)})));
  for(const [groupIndex,{name,options}]of groups.entries())for(const [optionIndex,option]of options.entries()){
   let localBaseline=await open(id,theme);if(id===6&&/^leg [23] option right$/.test(name)){await page.getByRole('group',{name:'leg to edit',exact:true}).getByRole('button',{name:name.slice(4,5),exact:true}).click();actions++;localBaseline=await audit(id,'reveal hidden leg editor');}await page.getByRole('group',{name,exact:true}).getByRole('button',{name:option,exact:true}).click();actions++;
   const label=`${id}-${theme}-320-mode-g${groupIndex}-o${optionIndex}`,q=await audit(id,label),wanted=structuredClone(localBaseline.state),part=wanted.parts.find(([k])=>k.startsWith('select:'+name+':'));assert.ok(part);part[1][0]=optionIndex;assert.deepEqual(q.state.parts,wanted.parts,'only the actual intended selector changes');
   const file=output+'/'+label+'.png';assert.ok(!files.has(file),'unique group/option evidence path');files.add(file);await finScreenshot(page,file);
   await page.locator('.viz-share summary').click();await page.getByRole('button',{name:'Create state link',exact:true}).click();actions++;const url=await page.locator('.share-url').inputValue(),after=await open(id,theme,url);assert.deepEqual(after.state.parts,q.state.parts,'actual group-specific Share replay');assert.equal(after.readout,q.readout,'identical replayed explanation');shares++;
   rows.push({id,theme,width:320,group:name,groupIndex,option,optionIndex,file,state:q.state});console.log(JSON.stringify({label,shares,checks,comparisons}));
  }
  if(id===6)for(const [index,recipe] of Object.keys(PRESETS).entries()){
   await open(id,theme);await page.getByRole('group',{name:'recipe to load',exact:true}).getByRole('button',{name:recipe,exact:true}).click();actions++;const pending=await audit(id,'pending '+recipe);assert.deepEqual(pending.model.parameters,baseline.model.parameters,'selecting a pending recipe alone does not alter the portfolio');await page.getByRole('button',{name:'Load recipe',exact:true}).click();actions++;const q=await audit(id,'loaded '+recipe);assert.deepEqual(q.model.parameters.legs,PRESETS[recipe].legs);assert.equal(q.model.parameters.stockUnits,PRESETS[recipe].stockUnits);const file=output+`/${id}-${theme}-320-mode-loaded-${index}.png`;assert.ok(!files.has(file));files.add(file);await finScreenshot(page,file);await page.locator('.viz-share summary').click();await page.getByRole('button',{name:'Create state link',exact:true}).click();actions++;const url=await page.locator('.share-url').inputValue(),after=await open(id,theme,url);assert.deepEqual(after.state.parts,q.state.parts);assert.equal(after.readout,q.readout);shares++;rows.push({id,theme,width:320,group:'actually loaded recipe',option:recipe,file,state:q.state});
  }
 }
 assert.equal(rows.length,62,'every offered group/option and actually loaded recipe in both narrow themes');assert.equal(files.size,62,'no overwritten mode evidence');assert.deepEqual(hashes(),sourceHashes,'all captured source bytes remained fixed');
 fs.writeFileSync(output+'/summary.json',JSON.stringify({status:'PASS',layouts:18,modes:rows.length,actions,shares,checks,comparisons,errors,sourceHashes,rows},null,2)+'\n');
}catch(error){fs.writeFileSync(output+'/failure.txt',error.stack||String(error));try{fs.writeFileSync(output+'/failure-state.json',JSON.stringify(await captureFin(page),null,2));await page.screenshot({path:output+'/failure.png',fullPage:true});}catch{}throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
