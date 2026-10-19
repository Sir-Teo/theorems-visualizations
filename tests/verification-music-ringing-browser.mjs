import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';

const output='/tmp/atlas-music-ringing';mkdirSync(output,{recursive:true});
const server=createServer({verificationAssets:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),results=[];
try {
  for(const theme of ['light','dark']) {
    const page=await browser.newPage({viewport:{width:1180,height:1100}});await installBrowserAssets(page.context(),{local:true});
    const errors=[],states=[];page.on('pageerror',e=>errors.push(e.message));
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/music/ch08-c.js&id=music-8.21&theme=${theme}&w=1100&wait=100`);
      await page.waitForFunction(()=>window.__done);const done=await page.evaluate(()=>window.__done);
      assert.equal(done.ok,true);assert.equal(done.renderer,'KaTeX 0.16.11');assert.deepEqual(done.errors,[]);assert.deepEqual(done.texErrors,[]);assert.deepEqual(done.blank,[]);
      const inspect=async(label,expected)=>{
        await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
        const state=await page.evaluate(()=>({blank:window.__inspectCanvases(),errors:window.__vizErrors||[],tex:window.__texErrors||[],readout:document.querySelector('.viz-readout').textContent}));
        assert.deepEqual(state.blank,[],label);assert.deepEqual(state.errors,[],label);assert.deepEqual(state.tex,[],label);assert.doesNotMatch(state.readout,/NaN|Infinity|undefined/);if(expected)assert.match(state.readout,expected);
        states.push({label,readout:state.readout,blank:state.blank});
      };
      const choose=async(group,label)=>page.getByRole('group',{name:group,exact:true}).getByRole('button',{name:label,exact:true}).click();
      await inspect('default Plain Bob Minimus',/rounds returns after 24 changes/);
      await choose('bells','5');await inspect('mode1: five bells with four-bell notation',/place 5 with no partner/);
      await page.screenshot({path:`${output}/music-8.21-${theme}-invalid.png`,fullPage:true});
      await choose('bells','6');await inspect('six bells with current notation');await choose('bells','4');await inspect('four-bell recovery',/rounds returns after 24 changes/);
      for(const [label,count]of[['plain hunt, 4 bells',8],['Plain Bob Minimus',24],['plain hunt, 5 bells (Doubles)',10],['plain hunt, 6 bells (Minor)',12]]){
        await choose('method',label);await inspect(label,new RegExp(`rounds returns after ${count} changes`));
        const slider=page.getByRole('slider',{name:'change number'});await slider.focus();await slider.press('Home');await inspect(`${label}: first row`);await slider.press('End');await inspect(`${label}: final row`);
      }
      for(const label of ['2','3','4','5','6']){await choose('follow bell',label);await inspect(`follow bell ${label}`);}
      await choose('method','my own');await inspect('custom mode');
      const input=page.getByRole('textbox',{name:'place notation'});
      await input.fill('');await page.waitForTimeout(220);await inspect('empty notation',/cannot read the place notation/);
      await input.fill('9');await page.waitForTimeout(220);await inspect('out-of-range notation',/cannot read the place notation/);
      await input.fill('x16x16x16x16x16x16');await page.waitForTimeout(220);await inspect('native text recovery',/rounds returns after 12 changes/);
      await choose('method','Plain Bob Minimus');await inspect('final default recovery',/rounds returns after 24 changes/);
      await page.screenshot({path:`${output}/music-8.21-${theme}-valid.png`,fullPage:true});assert.deepEqual(errors,[]);
      results.push({id:'music-8.21',theme,renderer:done.renderer,states,screenshots:[`${output}/music-8.21-${theme}-invalid.png`,`${output}/music-8.21-${theme}-valid.png`]});
    } finally {await page.close();}
  }
} finally {await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(`${output}/native-controls.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(r=>({id:r.id,theme:r.theme,checkedStates:r.states.length,blank:[]}))));
