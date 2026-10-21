// Actual control and canvas interaction checks for the character-theory audit.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch();
 const body=(await response.text()).replace('stats.stages++;',`stats.stages++;
 (window.__auditStages ||= []).push(s);
 const begin=s.begin.bind(s),rect=s.rect.bind(s),poly=s.poly.bind(s);
 s.begin=()=>{s.__rects=[];s.__polys=[];return begin();};
 s.rect=(...a)=>{s.__rects.push(a.slice(0,4));return rect(...a);};
 s.poly=(p,...a)=>{s.__polys.push(p);return poly(p,...a);};`)
 .replace('return item.viz(v);',`const table=v.table.bind(v);v.table=(...a)=>{const t=table(...a);(window.__tables ||= []).push(t);return t;};const scene3=v.scene3.bind(v);v.scene3=(...a)=>{const sc=scene3(...a);(window.__scenes ||= []).push(sc);const begin=sc.begin.bind(sc),arrow=sc.arrow.bind(sc);sc.begin=()=>{sc.__arrows=[];return begin();};sc.arrow=(p,q,...r)=>{sc.__arrows.push([p,q]);return arrow(p,q,...r);};return sc;};return item.viz(v);`);
 await route.fulfill({response,body});
});
const settle=()=>page.waitForTimeout(150);
const open=async(id,theme)=>{await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/rep/${'ch04-b.js'}&id=rep-${id}&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);const r=await page.evaluate(()=>window.__done);assert.deepEqual(r.errors,[]);assert.deepEqual(r.texErrors,[]);};
const read=()=>page.locator('.viz-readout').innerText();
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const menu=async(i,j)=>{await page.locator('.ctl-select').nth(i).locator('button').nth(j).click();await settle();};
const button=async name=>{await page.getByRole('button',{name,exact:true}).click();await settle();};
const cell=async(i,j)=>{const p=await page.evaluate(({i,j})=>{const t=window.__tables[0],g=t.geo,b=t.s.canvas.getBoundingClientRect();return{x:b.x+g.X0+g.xs[j]+g.cws[j]/2,y:b.y+g.Y0+(i+.5)*g.ch};},{i,j});await page.mouse.click(p.x,p.y);await settle();};
const bounds=async(index)=>{const s=await page.evaluate(i=>{const s=window.__auditStages[i];return {view:s.view,rects:s.__rects,polys:s.__polys};},index);for(const r of s.rects)for(const [x,y] of [[r[0],r[1]],[r[2],r[3]]])assert.ok(x>=s.view.x[0]-1e-8&&x<=s.view.x[1]+1e-8&&y>=s.view.y[0]-1e-8&&y<=s.view.y[1]+1e-8,JSON.stringify({r,view:s.view}));for(const p of s.polys)for(const [x,y] of p)assert.ok(x>=s.view.x[0]-1e-8&&x<=s.view.x[1]+1e-8&&y>=s.view.y[0]-1e-8&&y<=s.view.y[1]+1e-8);};
const arrows=()=>page.evaluate(()=>window.__scenes[0].__arrows.length);
const turn=async()=>{const b=await page.locator('canvas').first().boundingBox();await page.mouse.move(b.x+b.width*.45,b.y+b.height*.5);await page.mouse.down();await page.mouse.move(b.x+b.width*.7,b.y+b.height*.65,{steps:12});await page.mouse.up();await settle();};
try{
for(const theme of ['light','dark']){
 await open('4.11',theme);
 for(let m=0;m<2;m++){
  await menu(0,m);
  for(let i=0;i<(m?3:4);i++){
   const absent=m?i===1:[1,3].includes(i);
   await slider(0,'End');assert.equal((await arrows())===0,absent);
   await button('new random displacement');assert.equal((await arrows())===0,absent);
   await turn();assert.equal((await arrows())===0,absent);
   const bounded=await page.evaluate(()=>{const s=window.__auditStages[0],sc=window.__scenes[0];return sc.__arrows.every(a=>a.every(p=>{const q=sc.P(p);return q[0]>=s.view.x[0]&&q[0]<=s.view.x[1]&&q[1]>=s.view.y[0]&&q[1]<=s.view.y[1];}));});assert.ok(bounded);
   await slider(0,'Home');assert.equal(await arrows(),0);await button('next irreducible type');
   assert.doesNotMatch(await read(),/NaN|undefined/);
  }
 }
 await slider(0,'End');await page.screenshot({path:`/tmp/atlas-rep-vibrations-${theme}.png`});console.log(`PASS ${theme} vibrations: all seven symmetry types, new seeds, amplitude endpoints and camera rotation`);
 await open('4.12',theme);
 for(let g=0;g<2;g++){
  await menu(0,g);for(let op=0;op<5;op++){
   await menu(1,op);for(let i=0;i<(g?3:4);i++)for(let j=0;j<(g?3:4);j++){
    await cell(i,j);assert.match(await read(),/Forbidden cells with a non-zero numerical element: 0/);assert.doesNotMatch(await read(),/NaN|undefined/);await bounds(1);
   }
  }
 }
 await page.screenshot({path:`/tmp/atlas-rep-selection-${theme}.png`});console.log(`PASS ${theme} selection rules: both groups, five components, every table cell`);
}
assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
