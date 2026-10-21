import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const font=readFileSync(new URL('../assets/vendor/google-fonts/fonts/newsreader-cY9CfjOCX1hbuyalUrK439vCjohCBJWxZA.woff2',import.meta.url));
after(async()=>{await browser.close();await new Promise(r=>server.close(r));});
const sample='mmmmmmmmiiiiiiiwwwww';
async function scenario(mode){
 const context=await browser.newContext({viewport:{width:640,height:500}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let release;const gate=new Promise(r=>release=r);let held=0;
 await page.route('**/__atlas_probe.woff2',async route=>{held++;await gate;await route.fulfill({body:font,contentType:'font/woff2'});});
 const html=`<!doctype html><meta charset="utf-8"><style>@font-face{font-family:AtlasProbe;src:url('/__atlas_probe.woff2');font-display:swap}html,body{margin:0}#viz{width:600px;height:250px}.stage{width:560px;height:200px}.warm{position:absolute;left:-9999px;font:16px AtlasProbe}</style>${mode==='late'?'':`<span class="warm">${sample}</span>`}<div id="viz"></div><script type="module">import{mount}from'/assets/js/viz/core.js';window.fontListeners=new Set();const add=document.fonts.addEventListener.bind(document.fonts),remove=document.fonts.removeEventListener.bind(document.fonts);document.fonts.addEventListener=(t,f,...a)=>{if(t==='loadingdone')fontListeners.add(f);return add(t,f,...a)};document.fonts.removeEventListener=(t,f,...a)=>{if(t==='loadingdone')fontListeners.delete(f);return remove(t,f,...a)};window.useProbe=${mode!=='late'};window.count=0;window.widths=[];window.stop=mount(document.getElementById('viz'),v=>{window.v=v;window.control=v.slider('preserved level',0,10,7);v.t=12.5;const s=v.stage({x:[0,1],y:[0,1],axes:false,height:180,full:true});window.s=s;v.render(()=>{s.ctx.font=useProbe?'16px AtlasProbe, monospace':'16px monospace';const w=s.ctx.measureText('${sample}').width;s.ctx.fillText('${sample}',20,60);window.widths.push(w);window.count++;});});</script>`;
 await page.route('**/__atlas_font_fixture',route=>route.fulfill({body:html,contentType:'text/html'}));
 const frames=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
 try{
  await page.goto(`http://localhost:${server.address().port}/__atlas_font_fixture`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.count>0);await frames();
  if(mode==='late'){await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>{window.useProbe=true;window.v.invalidate();});await page.waitForFunction(()=>document.fonts.status==='loading');await frames();}
  assert.ok(held>0,'real local font request is gated');
  const before=await page.evaluate(()=>({count,width:widths.at(-1),loading:document.fonts.status,control:control.value,time:v.t,listeners:fontListeners.size}));assert.equal(before.loading,'loading');assert.equal(before.listeners,1);
  if(mode==='destroy')await page.evaluate(()=>window.stop());
  release();await page.evaluate(()=>document.fonts.ready);await frames();
  const after=await page.evaluate(()=>{s.ctx.font='16px AtlasProbe, monospace';return{count,drawn:widths.at(-1),loaded:s.ctx.measureText('mmmmmmmmiiiiiiiwwwww').width,status:document.fonts.status,control:control.value,time:v.t,listeners:fontListeners.size};});
  assert.equal(after.status,'loaded');assert.equal(after.control,before.control);assert.equal(after.time,before.time);assert.equal(after.listeners,mode==='destroy'?0:1);assert.notEqual(before.width,after.loaded,'probe font has distinct native metrics');
  if(mode==='destroy'){assert.equal(after.count,before.count,'font completion cannot revive a destroyed visualization');assert.equal(after.drawn,before.width);}else{assert.ok(after.count>before.count,'font completion redraws a static visualization without input');assert.equal(after.drawn,after.loaded,'actual paint uses loaded font metrics');}
  assert.deepEqual(errors,[]);
 }finally{release();await context.close();}
}
test('fonts ready repaints a static visualization after an initially pending local font',()=>scenario('initial'));
test('later font loading repaints a visualization whose initial fonts-ready promise already resolved',()=>scenario('late'));
test('font completion does not revive a visualization destroyed while the request is pending',()=>scenario('destroy'));
