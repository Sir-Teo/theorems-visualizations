import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
const dir='/tmp/conditional-energy-fixes';mkdirSync(dir,{recursive:true});
const server=createServer({verificationAssets:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),results=[];
const files={'cplx-2.6':'content/cplx/ch02.js','logic-5.13':'content/logic/ch05-b.js','pchem-2.12':'content/pchem/ch02-c.js'};
try {
 for(const theme of ['light','dark'])for(const id of Object.keys(files)) {
  const page=await browser.newPage({viewport:{width:1180,height:1100}}),errors=[],states=[];await installBrowserAssets(page.context(),{local:true});page.on('pageerror',e=>errors.push(e.message));
  try {
   await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${files[id]}&id=${id}&theme=${theme}&w=1080&wait=100`);await page.waitForFunction(()=>window.__done);const done=await page.evaluate(()=>window.__done);
   assert.equal(done.ok,true);assert.equal(done.renderer,'KaTeX 0.16.11');assert.deepEqual(done.errors,[]);assert.deepEqual(done.texErrors,[]);
   const settle=async()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const snap=async(label)=>{
    await settle();const r=await page.evaluate(()=>({blank:window.__inspectCanvases(),errors:window.__vizErrors||[],tex:window.__texErrors||[],text:document.querySelector('.viz-readout').textContent}));
    assert.deepEqual(r.blank,[],label);assert.deepEqual(r.errors,[],label);assert.deepEqual(r.tex,[],label);assert.doesNotMatch(r.text,/NaN|Infinity|undefined/);
    const path=`${dir}/${id}-${theme}-${String(states.length).padStart(2,'0')}.png`;await page.locator('#shot').screenshot({path});states.push({label,...r,screenshot:path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});return r;
   };
   const choose=async(group,name)=>{await page.getByRole('group',{name:group,exact:true}).getByRole('button',{name,exact:true}).click();await settle();};
   await snap('default');
   if(id==='cplx-2.6'){
    const caption=await page.locator('#caption').innerText();assert.match(caption,/red shading marks the regions excluded/);assert.match(caption,/red triangles mark the planes/);
    await choose('variables','3 (cube)');await snap('cube clause-cut context');await page.locator('.ctl-toggle input:visible').first().locator('..').click();await snap('cube clause change');await choose('variables','2 (plane)');await snap('plane restored');
   } else if(id==='logic-5.13'){
    await page.getByRole('textbox',{name:'f(x) ='}).fill('abs(x)');await page.waitForTimeout(220);
    for(const sign of ['positive','negative']){await choose('ε is',sign);await snap(`absolute value: ${sign} infinitesimal`);const notation=await page.locator('.viz-readout').evaluate(el=>{const copy=el.cloneNode(true);copy.querySelectorAll('.katex').forEach(k=>k.remove());return copy.textContent;});assert.doesNotMatch(notation,/\\times|10\^\{/);assert.ok(await page.locator('.viz-readout .katex').count()>0);}
   } else {
    // Capture actual production annotation geometry, without replacing any calculation.
    await page.evaluate(()=>{const s=window.__vizStages[0],f=s.text.bind(s);window.__levels=[];s.text=(t,x,y,o={})=>{if(/^elements in|^reactants \(|^measured |^exact /.test(t)){window.__levels.push({text:t,anchor:s.Y(y),center:s.Y(y)+(o.dy||0),height:s.height});window.__levels=window.__levels.slice(-2);}return f(t,x,y,o);};});
    const layout=async()=>{const a=await page.evaluate(()=>window.__levels);assert.equal(a.length,2);assert.ok(Math.abs(a[0].center-a[1].center)>24,'annotations separated');for(const x of a){assert.ok(x.center>10&&x.center<x.height-10);for(const y of a)assert.ok(Math.abs(x.center-y.anchor)>9,'label clear of level lines');}states.at(-1).annotationGeometry=a;};
    for(const salt of ['NaCl','KCl','LiF','MgO']){await choose('salt',salt);await snap(`Born-Haber ${salt}`);await layout();const lattice=page.getByRole('slider',{name:'lattice enthalpy'});await lattice.focus();await lattice.press('Home');await snap(`${salt}: lattice minimum`);await layout();await lattice.press('End');await snap(`${salt}: lattice zero`);await layout();}
    const shown=page.getByRole('slider',{name:'steps shown'});await shown.focus();await shown.press('Home');await snap('Born-Haber zero revealed steps');await layout();await shown.press('End');
    await choose('method','bond enthalpies');
    for(const reaction of ['burn methane (gas-phase water)','H₂ + Cl₂ → 2 HCl','N₂ + 3 H₂ → 2 NH₃']){await choose('reaction',reaction);await snap(`bond enthalpies: ${reaction}`);await layout();}
    await choose('method','Born–Haber cycle');await snap('Born-Haber restored');await layout();
   }
   assert.deepEqual(errors,[]);results.push({id,theme,file:files[id],sourceFileHash:createHash('sha256').update(readFileSync(files[id])).digest('hex'),renderer:done.renderer,states});
  }finally{await page.close();}
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(`${dir}/results.json`,JSON.stringify(results,null,2));console.log(results.map(r=>({id:r.id,theme:r.theme,states:r.states.length})));
