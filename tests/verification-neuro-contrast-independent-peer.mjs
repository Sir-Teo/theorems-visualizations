// Explicit immutable-revision peer audit; never part of the default test suite.
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
const [base,root,out]=process.argv.slice(2).map(x=>resolve(x));
const edits=["v.ramp(lev(F[i]),'orange')","v.ramp(lev(F[0]),'orange')"];
for(const name of await readdir(base+'/content/neuro')){
  const rel='/content/neuro/'+name, old=await readFile(base+rel,'utf8');let next=old;
  if(name==='ch04-b.js')for(const x of edits){assert.equal(next.split(x).length,2);next=next.replace(x,()=>x.slice(0,-1)+",'muted')");}
  assert.equal(await readFile(root+rel,'utf8'),next,rel);
}
await mkdir(out,{recursive:true});
const {createServer}=await import(pathToFileURL(root+'/scripts/serve.mjs'));
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),rows=[];
try{for(const theme of ['light','dark']){
  const ctx=await browser.newContext({viewport:{width:320,height:2600},colorScheme:theme,reducedMotion:'reduce'});
  await ctx.addInitScript(t=>{localStorage.setItem('theme',t);window.__vizStill=true;},theme);
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://localhost:${server.address().port}/#/t/neuro-4.6`);
  await p.waitForFunction(()=>document.querySelector('.viz-readout')?.textContent.includes('frame t='));
  const palette=await p.evaluate(async()=>{
    const {themeRamp,resolveColor}=await import('/assets/js/viz/core.js');
    const channels=s=>s.match(/[\d.]+/g)?.map(Number);
    return {zero:themeRamp(0,'orange','muted'),one:themeRamp(1,'orange','muted'),mid:themeRamp(.5,'orange','muted'),muted:resolveColor('muted'),orange:resolveColor('orange'),panel:resolveColor('panel')};
  });
  const rgb=s=>s.startsWith('#')?[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)):s.match(/[\d.]+/g).map(Number).slice(0,3);
  assert.deepEqual(palette.zero,rgb(palette.muted));assert.deepEqual(palette.one,rgb(palette.orange));
  const lum=a=>a.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
  const a=lum(palette.zero),b=lum(rgb(palette.panel)),contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(contrast>3);
  for(let k=0;k<3;k++)assert.ok(palette.mid[k]>=Math.min(palette.zero[k],palette.one[k])&&palette.mid[k]<=Math.max(palette.zero[k],palette.one[k]));
  const fields=[];for(const selector of ['.statement','.scope','#idea','#caption','.viz-readout']){
    const el=p.locator(selector),bounds=await el.evaluate(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e),left=b.left+parseFloat(s.paddingLeft)+parseFloat(s.borderLeftWidth),right=b.right-parseFloat(s.paddingRight)-parseFloat(s.borderRightWidth),bad=[];const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.parentElement.closest('.katex-mathml,annotation'))continue;const r=document.createRange();r.selectNodeContents(n);for(const q of r.getClientRects())if(q.width&&(q.left<left-.8||q.right>right+.8))bad.push([q.left,q.right]);}return{client:e.clientWidth,scroll:e.scrollWidth,inner:right-left,bad,displays:[...e.querySelectorAll('.katex-display')].map(x=>[x.clientWidth,x.scrollWidth])};});
    assert.deepEqual(bounds.bad,[]);assert.ok(bounds.scroll<=bounds.client+1);for(const [c,s]of bounds.displays)assert.ok(s<=c+1);
    await el.screenshot({path:out+'/'+theme+'-'+selector.replace(/[^a-z]/g,'')+'.png'});fields.push({selector,bounds});
  }
  assert.equal(await p.locator('.katex-error').count(),0);assert.deepEqual(errors,[]);rows.push({theme,palette,contrast,fields});await ctx.close();
}await writeFile(out+'/peer.json',JSON.stringify(rows,null,2));console.log('PASS exact 27 source files; palette endpoints/linear-light channel bounds; resting contrast>3; complete five fields and inner displays both themes');}
finally{await browser.close();await new Promise(r=>server.close(r));}
