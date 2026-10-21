import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';

const output = process.env.DEEP_CLIPPING_OUTPUT || '/tmp/atlas-new-imaging-source/deep-clipping';
await mkdir(output, { recursive: true });
const server = createServer();
await new Promise(resolve => server.listen(0, resolve));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const page = await browser.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route(/\/tools\/harness\.html\?/, async route => {
  const response = await route.fetch();
  let body = await response.text();
  body = body.replace("mount(document.getElementById('viz'), (v) => {", "window.__mount=mount(document.getElementById('viz'), window.__setup=(v) => {");
  body = body.replace('return item.viz(v);', `window.__C=[];window.__S=[];window.__SEL=[];
    const slider=v.slider.bind(v);v.slider=(...args)=>{const c=slider(...args);window.__C.push(c);return c;};
    const select=v.select.bind(v);v.select=(...args)=>{const c=select(...args);window.__SEL.push(c);return c;};
    const stage=v.stage.bind(v);v.stage=(...args)=>{const s=stage(...args);window.__S.push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__paths=[];s.__hlines=[];return begin();};const path=s.path.bind(s);s.path=(...a)=>{s.__paths.push(a);return path(...a);};const hline=s.hline.bind(s);s.hline=(...a)=>{s.__hlines.push(a);return hline(...a);};return s;};
    return item.viz(v);`);
  await route.fulfill({ response, body });
});
const paint = async () => {
  await page.locator('.viz-controls').scrollIntoViewIfNeeded();
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
};
const read = () => page.evaluate(() => ({
  values: window.__C.map(c => c.value), mode: window.__SEL[0].value,
  raw: window.__C.map(c => ({ value: c.input.valueAsNumber, step: c.input.step, min: +c.input.min, max: +c.input.max })),
  state: window.__mount.snapshot(), paths: window.__S.map(s => s.__paths), lines: window.__S.map(s => s.__hlines),
  start: [window.__S[0].handles[0].x, window.__S[0].handles[0].y],
  readout: document.querySelector('.viz-readout').textContent,
  errors: window.__vizErrors || [], tex: document.querySelectorAll('.katex-error').length,
  overflow: document.documentElement.scrollWidth > innerWidth + 1,
}));
const near = (x, y, tolerance=3e-12) => assert.ok(Math.abs(x-y) <= tolerance*Math.max(1,Math.abs(y)), `${x} != ${y}`);
// Separate polynomial evaluation and loss differentiation; no production helpers imported.
function oracle(start, eta, threshold, mode) {
  let [w,u]=start; const path=[[w,u]], loss=[], steps=[];
  for(let t=0;t<=60;t++) {
    const powers=Array.from({length:30},(_,k)=>w**k), sum=powers.reduce((a,b)=>a+b,0);
    const ds=powers.slice(0,29).reduce((a,p,k)=>a+(k+1)*p,0), residual=u*sum-2;
    loss.push(.5*residual**2); if(t===60)break;
    let g=[residual*u*ds,residual*sum];
    if(threshold) {
      if(mode==='norm') { const norm=Math.sqrt(g.reduce((a,x)=>a+x*x,0)); if(norm>threshold)g=g.map(x=>x*threshold/norm); }
      else g=g.map(x=>Math.max(-threshold,Math.min(threshold,x)));
    }
    const delta=g.map(x=>-eta*x); w+=delta[0];u+=delta[1];
    if(!Number.isFinite(w)||!Number.isFinite(u)||Math.abs(w)>1e30||Math.abs(u)>1e30)break;
    steps.push(Math.sqrt(delta[0]**2+delta[1]**2));path.push([w,u]);
  }
  return {path,loss,steps};
}
async function check() {
  const q=await read(); assert.deepEqual(q.errors,[]); assert.deepEqual(errors,[]); assert.equal(q.tex,0); assert.equal(q.overflow,false);
  q.raw.forEach((raw,i)=>{near(raw.value,Math.log10(q.values[i]),6e-14);assert.equal(raw.step,'any');assert.ok(raw.value>=raw.min&&raw.value<=raw.max);});
  assert.deepEqual(q.state.parts.filter(([k])=>k.startsWith('slider:')).map(([,value])=>value),q.values);
  for(const [color,c] of [['red',0],['accent',q.values[1]]]) {
    const expected=oracle(q.start,q.values[0],c,q.mode), actual=q.paths[0].find(([,s])=>s.color===color)[0];
    assert.equal(actual.length,expected.path.length); actual.forEach((p,i)=>p.forEach((x,j)=>near(x,expected.path[i][j],2e-9)));
    const lengths=q.paths[2].find(([,s])=>s.color===color)[0];
    lengths.forEach((p,i)=>near(p[1],color==='red'?Math.min(1e6,Math.max(1e-5,expected.steps[i])):Math.max(1e-5,expected.steps[i]),2e-9));
  }
  near(q.lines[2][0][0],q.values[0]*q.values[1]*(q.mode==='value'?Math.SQRT2:1));
  return q;
}
async function remount(state) {
  await page.evaluate(async state => { const {mount}=await import('/assets/js/viz/core.js'); window.__mount();window.__mount=mount(document.getElementById('viz'),window.__setup,{state}); }, state);
  await paint();
}
async function replay() {
  const before=await check();await remount(before.state);const after=await check();
  for(const k of ['state','paths','lines','values','mode','raw','readout'])assert.deepEqual(after[k],before[k],`exact replay ${k}`);
  assert.equal(await page.locator('.viz-state-notice').count(),0);
}
try {
  for(const theme of ['light','dark'])for(const width of [1450,430,320]) {
    if(process.argv[2]&&process.argv[2]!==theme)continue;
    if(process.argv[3]&&+process.argv[3]!==width)continue;
    await page.setViewportSize({width,height:1300});
    await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/deep/ch05-c.js&id=deep-5.12&still=1&wait=100&theme=${theme}&w=${width-36}`);
    await page.waitForFunction(()=>window.__done);
    const done=await page.evaluate(()=>window.__done);for(const key of ['errors','texErrors','blank'])assert.deepEqual(done[key],[]);
    await paint();const base=(await check()).state;
    await page.screenshot({path:`${output}/default-${theme}-${width}.png`,fullPage:true});
    for(const mode of [0,1]) {
      await page.locator('.ctl-select button').nth(mode).click();await paint();
      for(const i of [0,1]) {
        const input=page.locator('input[type=range]').nth(i);
        for(const key of ['Home','End','ArrowLeft','ArrowRight']) {
          await input.press(key);await paint();const q=await check();
          if(key==='Home'||key==='End')assert.equal(q.values[i],[[.0005,.01],[1,400]][i][key==='End'?1:0]);
          assert.equal(q.values[i],Number(q.values[i].toPrecision(2)));await replay();
        }
        for(const f of [.19,.47,.81]) {
          await input.scrollIntoViewIfNeeded();const b=await input.boundingBox();
          await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5);await page.mouse.down();await page.mouse.move(b.x+b.width*f,b.y+b.height*.5,{steps:5});await page.mouse.up();await paint();
          const q=await check();assert.equal(q.values[i],Number(q.values[i].toPrecision(2)));await replay();
        }
      }
    }
    // Replay preserves continuous raw states, independently from two-sig pointer input.
    for(const values of [[.002,20],[.0012345678912345,Math.PI],[.0005000000000001,399.9999999999999]]) {
      const state=structuredClone(base);state.parts.filter(([key])=>key.startsWith('slider:')).forEach((p,i)=>p[1]=values[i]);
      await remount(state);assert.deepEqual((await check()).values,values);await replay();
    }
    // A bad complete state resets every component, including other valid edits.
    for(const i of [0,1])for(const bad of [null,'20',0,-1, i===0?.010000001:400.000001]) {
      const state=structuredClone(base), sliders=state.parts.filter(([k])=>k.startsWith('slider:'));
      sliders[1-i][1]=i===0?31:.004321;sliders[i][1]=bad;
      const select=state.parts.find(([k])=>k.startsWith('select:'));select[1][0]=1;
      await remount(state);const q=await check();assert.deepEqual(q.state,base);assert.equal(await page.locator('.viz-state-notice').count(),1);
    }
    await remount(base);await page.locator('.ctl-select button').nth(1).click();await paint();await check();
    await page.screenshot({path:`${output}/value-${theme}-${width}.png`,fullPage:true});
    for(let i=0;i<3;i++)await page.locator('.stage').nth(i).screenshot({path:`${output}/panel${i}-${theme}-${width}.png`});
    console.log(`PASS ${theme} ${width}: actual raw DOM log/model, independent trajectories, keyboard/pointer, exact replay, continuous raw values, 10 whole-state fallbacks, output pixels`);
  }
} finally {await page.close();await browser.close();server.close();}
