// Run with node tests/verification-pointer.mjs. Pointer and keyboard regressions for the verification backlog.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {loadAll} from '../scripts/lib.mjs';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {XS_PWT} from '../content/macro/ch03.shared.js';
import {growthRegressions} from '../content/macro/ch04.shared.js';
const {items}=await loadAll();const server=createServer();await new Promise(r=>server.listen(0,r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true});const page=await browser.newPage({viewport:{width:1200,height:1600}});const results=[];let errors=[];page.on('pageerror',e=>errors.push(e.message));
// Only expose stage coordinates in the test harness; all actions still use browser pointer/keyboard events.
await page.route(/\/tools\/harness\.html\?/,async route=>{const r=await route.fetch();const body=(await r.text()).replace('stats.stages++;','stats.stages++; (window.__testStages ||= []).push(s); const originalText = s.text.bind(s); s.text = (text, ...args) => { s.__testLastText = text; return originalText(text, ...args); }; const originalBars = s.bars.bind(s); s.bars = (values, style) => { s.__testBars = values.slice(); return originalBars(values, style); };');await route.fulfill({response:r,body});});
const open=async id=>{errors=[];const x=items.find(x=>x.id===id);await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=${x.file}&id=${id}&wait=100`);await page.waitForFunction(()=>window.__done);};
const read=()=>page.locator('.viz-readout').innerText();
try{
 await open('macro-4.8');
 const sampleSwitch=page.locator('input[type=checkbox]');
 const setSample=async value=>{if(await sampleSwitch.isChecked()!==value)await page.locator('.ctl-toggle label').click();};
 const growthSlider=page.locator('input[type=range]');
 for(const oecd of [false,true]){
  await setSample(oecd);
  for(const [key,gd] of [['Home',.02],['End',.1]]){
   await growthSlider.focus();await page.keyboard.press(key);await page.waitForTimeout(100);
   const data=XS_PWT.filter(r=>!oecd||r[8]),res=growthRegressions(data,gd);
   const expectedBars=['sol','sol3','aug','aug3'].map(name=>res[name].adjR2);
   for(const [name,label] of [['sol','Solow, free'],['sol3','Solow, α = ⅓'],['aug','Augmented, free'],['aug3','Augmented, α = ⅓']]){
    await page.getByRole('button',{name:label,exact:true}).click();await page.waitForTimeout(100);
    const {view,bars}=await page.evaluate(()=>({view:window.__testStages[0].view,bars:window.__testStages[1].__testBars}));
    bars.forEach((value,i)=>assert.ok(Math.abs(value-expectedBars[i])<1e-12,'negative adjusted R² bars reach their actual values'));
    data.forEach((r,i)=>{const fitted=Math.exp(res[name].pred[i]);assert.ok(fitted>view.x[0]&&fitted<view.x[1],`${r[0]} fitted visible`);assert.ok(r[3]>view.y[0]&&r[3]<view.y[1],`${r[0]} actual visible`);});
   }
   assert.match(await read(),new RegExp(`${data.length} countries`));assert.deepEqual(errors,[]);
  }
 }
 // Ireland was above the original hard-coded range. It must also remain selectable.
 await setSample(false);await page.getByRole('button',{name:'Solow, free',exact:true}).click();await page.waitForTimeout(100);
 const data=XS_PWT,res=growthRegressions(data,.1),i=data.findIndex(r=>r[0]==='IRL');
 const point=await page.evaluate(({x,y})=>{const s=window.__testStages[0],b=s.canvas.getBoundingClientRect();return{x:b.x+s.X(x),y:b.y+s.Y(y)};},{x:Math.exp(res.sol.pred[i]),y:data[i][3]});
 await page.mouse.click(point.x,point.y);await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>window.__testStages[0].__testLastText),'Ireland');
 assert.deepEqual(errors,[]);results.push({id:'macro-4.8',action:'all models, both samples, slider endpoints, signed bars and unclipped country points',ok:true});console.log('PASS macro-4.8 regression controls, signed bars and visible countries');
 for(const id of ['game-2.8','macro-4.4','physio-4.14','music-8.2','pde-4.2']){
  await open(id);const si=await page.evaluate(()=>window.__testStages.findIndex(s=>s.handles.some(h=>h.visible!==false)));
  assert.ok(si>=0,id+' has a handle');const canvas=page.locator('#viz canvas').nth(si);await canvas.scrollIntoViewIfNeeded();
  const h=await page.evaluate(i=>{const s=window.__testStages[i],h=s.handles.find(h=>h.visible!==false),b=s.canvas.getBoundingClientRect();return {x:h.x,y:h.y,px:b.x+s.X(h.x),py:b.y+s.Y(h.y)};},si);
  const target=id==='music-8.2'?await page.evaluate(i=>{const s=window.__testStages[i],h=s.handles.find(h=>h.visible!==false),b=s.canvas.getBoundingClientRect();return {x:b.x+s.X(-h.y),y:b.y+s.Y(h.x)};},si):{x:h.px+35,y:h.py-25};
  const before=await read();await page.mouse.move(h.px,h.py);await page.mouse.down();await page.mouse.move(target.x,target.y,{steps:8});await page.mouse.up();await page.waitForTimeout(150);
  const moved=await page.evaluate(({i,x,y})=>{const h=window.__testStages[i].handles.find(h=>h.visible!==false);return h.x!==x||h.y!==y;},{i:si,x:h.x,y:h.y});
  assert.ok(moved,id+' handle moved');assert.notEqual(await read(),before,id+' readout changed');assert.deepEqual(errors,[]);results.push({id,action:'drag handle',ok:true});console.log('PASS',id,'drag and live readout');
 }
 await open('stoch-2.6');await page.getByRole('button',{name:'no jumps',exact:true}).click();const before=await read();
 for(const [x,y] of [[1.5,.5],[1.5,1.5]]){const canvas=page.locator('#viz canvas').first();await canvas.scrollIntoViewIfNeeded();const p=await page.evaluate(({x,y})=>{const s=window.__testStages[0],b=s.canvas.getBoundingClientRect();return{x:b.x+s.X(x),y:b.y+s.Y(y)};},{x,y});await page.mouse.click(p.x,p.y);await page.waitForTimeout(150);}
 assert.notEqual(await read(),before,'editing board updates absorption time');assert.deepEqual(errors,[]);results.push({id:'stoch-2.6',action:'add ladder by two board clicks',ok:true});console.log('PASS stoch-2.6 board editing');
 await open('tech-4.1');const thick=page.locator('input[type=range]').nth(1);await thick.focus();await page.keyboard.press('Home');await page.waitForTimeout(100);assert.match(await read(),/no admissible thrust line/);for(let i=0;i<18;i++)await page.keyboard.press('ArrowRight');await page.waitForTimeout(100);assert.match(await read(),/thrust between/);results.push({id:'tech-4.1',action:'cross collapse threshold with keyboard slider',ok:true});console.log('PASS tech-4.1 collapse threshold');
 await open('geo-4.5');const base=await read();await page.getByRole('button',{name:'free top surface',exact:true}).click();await page.waitForTimeout(150);assert.notEqual(await read(),base);assert.deepEqual(errors,[]);results.push({id:'geo-4.5',action:'switch number of rigid boundaries',ok:true});console.log('PASS geo-4.5 boundary control');
}finally{writeFileSync(join(tmpdir(),'atlas-pointer-results.json'),JSON.stringify(results,null,2));await browser.close();await new Promise(r=>server.close(r));}
