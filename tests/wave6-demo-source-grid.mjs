// Complete physical country/year selector composition for all fifty retained
// schedules. The independent reference cases already cover these calculations;
// this gate checks their actual controls, rendering, and fresh Share replay.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import * as H from '../content/demo/ch06.shared.js';
import {installDemoProbe,captureDemo,demoScreenshot} from './wave6-demo-browser.shared.mjs';
import {demoScience} from './wave6-demo-native-science.mjs';
const out=process.env.DEMO_GRID_SHOTS||'/tmp/wave6-demo-source-grid';fs.mkdirSync(out,{recursive:true});
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-demo-reference.json',import.meta.url)));
for(const c of H.countries)for(const year of H.years)assert.ok(fixture.cases.some(row=>row.family==='stationary'&&row.args.country===c.country&&row.args.year===year&&(row.args.hazard??100)===100),'complete independent source-pair reference coverage');
const sourcePaths=[...Object.keys(JSON.parse(fs.readFileSync(new URL('../docs/verification/wave6-demo-preimages.json',import.meta.url))).rawPins).filter(p=>/^content\/demo\/ch0[34]\.shared\.js$/.test(p)).map(p=>'../'+p),...fs.readdirSync(new URL('../content/demo/',import.meta.url)).filter(p=>/^ch06(?:\.[a-z]+)*\.js$/.test(p)).map(p=>'../content/demo/'+p),'../content/demo/syllabus.js','../assets/js/viz/core.js','../assets/js/viz/math.js','../assets/js/share-state.js','../assets/js/app.js','../assets/css/style.css','../data/col/demo.json','../data/index.json','./fixtures/wave6-demo-reference.json','./wave6-demo-source-grid.mjs','./wave6-demo-browser.shared.mjs','./wave6-demo-native-science.mjs'];
const hashes=()=>Object.fromEntries(sourcePaths.map(p=>[p,createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex')])),sourceHashes=hashes();
const server=createServer();await new Promise(resolve=>server.listen(0,resolve));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({viewport:{width:320,height:1200},deviceScaleFactor:1});await installDemoProbe(page);
const errors=[],rows=[],totals={layouts:0,sourcePairs:0,actions:0,shares:0,checks:0,modelComparisons:0};page.on('pageerror',e=>errors.push(e.message));
async function check(label){const q=await captureDemo(page);assert.equal(errors.length,0,label+' page errors');assert.equal(q.drawErrors.length,0,label+' draw errors');assert.equal(q.issues.length,0,label+' ink/geometry '+JSON.stringify(q.issues.slice(0,4)));totals.modelComparisons+=demoScience(6,q);totals.checks++;return q;}
async function open(theme,width,url){await page.setViewportSize({width,height:1200});const target=new URL(url||`${base}/#/t/demo-6.6`);target.searchParams.set('qaTheme',theme);await page.goto('about:blank');await page.goto(target.href);await page.waitForFunction(()=>document.querySelector('.viz-error')||window.__demoRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);const q=await check('open');assert.equal(q.theme,theme);return q;}
function progress(){fs.writeFileSync(out+'/progress.json',JSON.stringify({totals,rows},null,2)+'\n');}
try{
 for(const theme of['light','dark'])for(const width of[320,1200]){
  await open(theme,width);const start={...totals};
  for(const country of H.countries){
   await page.getByRole('group',{name:'period schedule',exact:true}).getByRole('button',{name:country.name,exact:true}).click();totals.actions++;
   for(const year of H.years){
    await page.getByRole('group',{name:'schedule year',exact:true}).getByRole('button',{name:String(year),exact:true}).click();totals.actions++;
    const before=await check(country.country+'/'+year);assert.deepEqual(before.models.stationary.parameters,{country:country.country,year,hazard:100},'physical selectors compose the intended source pair');
    await demoScreenshot(page,`${out}/6-${theme}-${width}-${country.country}-${year}.png`);
    if(!await page.locator('.viz-share').evaluate(e=>e.open))await page.locator('.viz-share summary').click();await page.getByRole('button',{name:'Create state link',exact:true}).click();totals.actions++;
    const url=await page.locator('.share-url').inputValue();assert.ok(url.includes('#/t/demo-6.6?s='));const after=await open(theme,width,url);assert.deepEqual(after.state.parts,before.state.parts,'all source-pair components replay exactly');assert.equal(after.readout,before.readout,'all source-pair readouts replay exactly');totals.shares++;totals.sourcePairs++;progress();
   }
  }
  totals.layouts++;rows.push({theme,width,sourcePairs:50,totals:Object.fromEntries(Object.keys(totals).map(k=>[k,totals[k]-start[k]]))});progress();console.log(JSON.stringify({theme,width,totals}));
 }
 assert.deepEqual(hashes(),sourceHashes,'all source-grid inputs remained frozen');assert.equal(totals.sourcePairs,200);assert.equal(totals.shares,200);
 fs.writeFileSync(out+'/summary.json',JSON.stringify({status:'PASS',scope:'All fifty physical country/year selector combinations at 320/1200 pixels in both themes; fresh actual Share replay and complete model/geometry audits. Adds no independent numerical cases.',totals,rows,errors,sourceHashes},null,2)+'\n');
}catch(error){fs.writeFileSync(out+'/failure.txt',String(error.stack||error));try{fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await captureDemo(page),null,2));await page.screenshot({path:out+'/failure.png',fullPage:true});}catch{}throw error;}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
