import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { complexityPlotData, simulationBits, lzPrefixEncode, lzPrefixDecode } from '../content/info/complexity-audit.shared.js';

const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1450,height:2200}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
  const response=await route.fetch();
  const body=(await response.text()).replace('stats.stages++;',`stats.stages++;(window.__auditStages||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__paths=[];s.__dots=[];s.__dotSets=[];return begin();};for(const[k,list]of[['path','__paths'],['dot','__dots'],['dots','__dotSets']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}`).replace('return item.viz(v);',`const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__auditReadout=f();return window.__auditReadout;});return item.viz(v);`);
  await route.fulfill({response,body});
});
const settle=()=>page.waitForTimeout(100);
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const near=(a,b,t=1e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
async function check(mode,seed) {
  const [n,p]=await page.locator('input[type=range]').evaluateAll(a=>a.map(x=>+x.getAttribute('aria-valuetext')));
  const expected=complexityPlotData(n,p,mode,seed);
  const got=await page.evaluate(()=>({stages:window.__auditStages.map(s=>({bounds:s.bounds,paths:s.__paths,dots:s.__dots,sets:s.__dotSets})),readout:window.__auditReadout,done:window.__done}));
  assert.deepEqual(got.done.errors,[]);assert.deepEqual(got.done.texErrors,[]);assert.deepEqual(got.done.blank,[]);assert.deepEqual(errors,[]);
  assert.equal(got.stages[0].paths.length,3);assert.equal(got.stages[1].paths.length,2);
  for(const [j,field,color]of [[0,'kt','orange'],[1,'lz','purple']]) {
    const left=got.stages[0].paths.find(q=>q[1].color===color)[0],right=got.stages[1].paths[j][0];
    assert.equal(left.length,25);assert.equal(right.length,expected.curve.length);
    for(let k=0;k<left.length;k++){near(left[k][0],expected.grid[k].p);near(left[k][1],expected.grid[k][field]);}
    for(let k=0;k<right.length;k++){assert.equal(right[k][0],expected.curve[k].n);near(right[k][1],expected.curve[k][field]);}
    const selected=got.stages[1].dots.find(q=>q[2].color===color);assert.equal(selected[0],n);near(selected[1],expected.selected[field]);
  }
  for(const s of got.stages)for(const[P]of s.paths)for(const[x,y]of P){assert.ok(Number.isFinite(x)&&Number.isFinite(y));assert.ok(x>=s.bounds.x[0]-1e-12&&x<=s.bounds.x[1]+1e-12);assert.ok(y>=s.bounds.y[0]-1e-12&&y<=s.bounds.y[1]+1e-12);}
  for(const[field,label]of [['ideal','KT ideal loss'],['kt','constructive prefix bound'],['lz','emitted LZ78 length']])assert.ok(got.readout.includes(`${label} $${expected.selected[field].toFixed(3)}$`));
  assert.ok(got.readout.includes(`Seed ${seed}`));assert.doesNotMatch(got.readout,/NaN|undefined|260|both upper bounds on/);
  const x=simulationBits(n,p,mode,seed,`follow|${p}`),code=lzPrefixEncode(x),decoded=lzPrefixDecode(code.code,n);
  assert.deepEqual(decoded.bits,x);near(expected.selected.lz*n,code.bitLength);
  return JSON.stringify(got.stages.map(s=>s.paths));
}
try {
  for(const theme of ['light','dark']) {
    await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/info/ch04-c.js&id=info-4.16&still=1&wait=80&theme=${theme}`);
    await page.waitForFunction(()=>window.__done);await check('coin',9);
    for(const [mode,index]of [['coin',0],['prng',1]]) {
      await page.locator('.ctl-select').locator('button').nth(index).click();await settle();
      for(const n of ['Home','End']){await slider(0,n);for(const p of ['Home','End']){await slider(1,p);await check(mode,9);}}
      await page.screenshot({path:`/tmp/atlas-info-complexity-${mode}-${theme}.png`});
      console.log(`PASS ${theme} ${mode}: both length/bias extremes, exact KT integer bounds, decoded emitted LZ lengths, all actual prefix marks and unclipped curves`);
    }
    const before=await check('prng',9);await page.getByRole('button',{name:'Resample',exact:true}).click();await settle();const after=await check('prng',10);assert.notEqual(after,before);
    await page.locator('.ctl-select').locator('button').nth(0).click();await settle();const coinBefore=await check('coin',10);await page.getByRole('button',{name:'Resample',exact:true}).click();await settle();assert.notEqual(await check('coin',11),coinBefore);
    await page.screenshot({path:`/tmp/atlas-info-complexity-resampled-${theme}.png`});
    console.log(`PASS ${theme} resampling: both seeded modes change their actual code-length curves and readouts`);
  }
}finally{await browser.close();server.close();}
