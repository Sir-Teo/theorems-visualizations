// Real input checks for the algebra/cryptography source review.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {getGroup} from '../content/alg/ch06.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch();
 const body=(await response.text()).replace('stats.stages++;',`stats.stages++;
   (window.__auditStages ||= []).push(s);
   const begin=s.begin.bind(s),path=s.path.bind(s),rect=s.rect.bind(s),dot=s.dot.bind(s);
   s.begin=()=>{s.__paths=[];s.__rects=[];s.__dots=[];return begin();};
   s.path=(p,st={})=>{s.__paths.push(p.map(q=>q&&Array.from(q)));return path(p,st);};
   s.rect=(...a)=>{s.__rects.push(a.slice(0,4));return rect(...a);};
   s.dot=(x,y,st={})=>{s.__dots.push([x,y,st.color]);return dot(x,y,st);};`);
 await route.fulfill({response,body});
});
const settle=()=>page.waitForTimeout(100);
const open=async(id,theme)=>{const file=id==='6.10'?'ch06.js':['7.4','7.4a','7.5','7.5a'].includes(id)?'ch07-b.js':'ch07.js';await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/alg/${file}&id=alg-${id}&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);const r=await page.evaluate(()=>window.__done);assert.deepEqual(r.errors,[]);assert.deepEqual(r.texErrors,[]);};
const read=()=>page.locator('.viz-readout').innerText();
const fill=async text=>{await page.locator('input[type=text]').fill(text);await page.waitForTimeout(250);};
const button=async name=>{await page.getByRole('button',{name,exact:true}).click();await settle();};
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const state=()=>page.evaluate(()=>window.__auditStages.map(s=>({view:s.view,paths:s.__paths,rects:s.__rects,dots:s.__dots})));
const sane=async()=>{assert.doesNotMatch(await read(),/NaN|Infinity|undefined/);assert.equal(await page.locator('.katex-error').count(),0);};
try{
 for(const theme of ['light','dark']){
  await open('6.10',theme);
  for(let i=0;i<4;i++){
   await page.locator('.ctl-select button').nth(i).click();await settle();
   const A=getGroup(['Z12','D6','A4','U15'][i]);
   for(let j=0;j<A.subs.length;j++){
    const b=(await state())[1];assert.equal(b.rects.length,A.G.n);
    for(const [x0,y0,x1,y1]of b.rects)assert.ok(x0>=b.view.x[0]&&x1<=b.view.x[1]&&y0>=b.view.y[0]&&y1<=b.view.y[1]);
    await button('subgroup ▶');
   }
   if(i===2)assert.match(await read(),/no.*subgroup: 6/s);
  }
  console.log(`PASS ${theme} Lagrange: all 40 subgroup states, complete rectangles and A4 missing order`);

  await open('7.1',theme);await slider(0,'End');
  await fill('XYZ');assert.match(await read(),/WXY/);
  await button('Decrypt');await fill('WXY');assert.match(await read(),/XYZ/);
  const p=await page.evaluate(()=>{const s=window.__auditStages[0],b=s.canvas.getBoundingClientRect(),a=Math.PI/2-2*Math.PI*25/26;return{x:b.x+s.X(1.17*Math.cos(a)),y:b.y+s.Y(1.17*Math.sin(a))};});
  await page.mouse.click(p.x,p.y);await settle();assert.match(await read(),/Selected:.*Z/s);
  await slider(0,'Home');await page.locator('input[type=range]').focus();for(let j=0;j<13;j++)await page.keyboard.press('ArrowRight');await settle();assert.match(await read(),/ROT13/);await sane();
  await open('7.1a',theme);await page.locator('.ctl-select button').nth(1).click();await page.locator('.ctl-toggle label').click();await slider(0,'End');assert.match(await read(),/Only Z produces/);assert.match(await read(),/without the private exponent or factoring/);await sane();
  console.log(`PASS ${theme} shift and public-key lookup: input roundtrip, ring click, ROT13 and all-letter attack`);

  await open('7.2',theme);
  for(const text of ['short (12 letters)','medium (53)','long (207)']){
   await button(text);
   for(const end of ['Home','End']){
    await slider(0,end);await button('Best match');const s=(await state())[0];
    for(const pts of s.paths)for(const p of pts)if(p)assert.ok(p[1]<=s.view.y[1]&&p[1]>=0);
    assert.match(await read(),text.startsWith('short')?/missed/:/recovered/);await sane();
   }
  }
  console.log(`PASS ${theme} frequency analysis: all samples and key endpoints, best-match action and full peaks`);

  await open('7.4',theme);assert.match(await read(),/RR GR/);assert.match(await read(),/returns HELP/);
  await slider(4,'End');assert.doesNotMatch(await read(),/RR GR/);assert.match(await read(),/returns HELP/);
  await fill('ABCDEFGHIJKLMNOPQRSTUVWX');await slider(6,'End');
  assert.equal((await state())[0].dots.filter(d=>d[2]==='gold').length,1);
  await slider(1,'Home');assert.match(await read(),/not invertible/);
  await fill('');await sane();
  console.log(`PASS ${theme} Hill: exact book example, offset changes, pair 12, singular matrix and empty input`);

  await open('7.5',theme);assert.match(await read(),/667/);assert.match(await read(),/D=191/);assert.match(await read(),/169/);
  for(const p of ['Home','End'])for(const q of ['Home','End'])for(const e of ['Home','End']){
   await slider(0,p);await slider(1,q);await slider(2,e);await slider(3,'End');await sane();
   if(p===q)assert.match(await read(),/not the totient/);
  }
  await open('7.4a',theme);
  for(const end of ['Home','End']){
   await slider(0,end);const s=(await state())[0];for(const pts of s.paths)for(const p of pts)if(p)assert.ok(p[1]>=s.view.y[0]&&p[1]<=s.view.y[1]);await sane();
  }
  console.log(`PASS ${theme} RSA: source example, eight prime/exponent extremes and unclipped toy work curves`);

  await open('7.5a',theme);
  for(const w of ['BUY','PAY','YES','NOT','SAY']){
   await button(w);await button('honest');assert.match(await read(),new RegExp('= '+w));
   await button('Eve searches signatures');assert.match(await read(),/= MAN/);assert.match(await read(),/391/);assert.match(await read(),/sender not authenticated/);await sane();
  }
  await page.locator('.ctl-toggle label').click();await button('Eve sends unsigned word');assert.match(await read(),/word accepted/);await sane();
  console.log(`PASS ${theme} signatures: honest recovery and public-only dictionary forgery for every message`);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
