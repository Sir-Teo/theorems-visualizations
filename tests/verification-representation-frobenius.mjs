import {tableOf,ctext} from '../content/rep/ch03.shared.js';
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
 .replace('return item.viz(v);',`const table=v.table.bind(v);v.table=(...a)=>{const t=table(...a);(window.__tables ||= []).push(t);const draw=t.draw.bind(t);t.draw=(o={})=>{t.__values=Array.from({length:o.rows??t.rows},(_,i)=>Array.from({length:o.cols??t.cols},(_,j)=>o.value?.(i,j)));return draw(o);};return t;};return item.viz(v);`);
 await route.fulfill({response,body});
});
const settle=()=>page.waitForTimeout(150);
const open=async(id,theme)=>{await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/rep/${'ch03-b.js'}&id=rep-${id}&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);const r=await page.evaluate(()=>window.__done);assert.deepEqual(r.errors,[]);assert.deepEqual(r.texErrors,[]);};
const read=()=>page.locator('.viz-readout').innerText();
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const menu=async(i,j)=>{await page.locator('.ctl-select').nth(i).locator('button').nth(j).click();await settle();};
const button=async name=>{await page.getByRole('button',{name,exact:true}).click();await settle();};
const cell=async(i,j)=>{const p=await page.evaluate(({i,j})=>{const t=window.__tables[0],g=t.geo,b=t.s.canvas.getBoundingClientRect();return{x:b.x+g.X0+g.xs[j]+g.cws[j]/2,y:b.y+g.Y0+(i+.5)*g.ch};},{i,j});await page.mouse.click(p.x,p.y);await settle();};
const bounds=async(index)=>{const s=await page.evaluate(i=>{const s=window.__auditStages[i];return {view:s.view,rects:s.__rects,polys:s.__polys};},index);for(const r of s.rects)for(const [x,y] of [[r[0],r[1]],[r[2],r[3]]])assert.ok(x>=s.view.x[0]-1e-8&&x<=s.view.x[1]+1e-8&&y>=s.view.y[0]-1e-8&&y<=s.view.y[1]+1e-8,JSON.stringify({r,view:s.view}));for(const p of s.polys)for(const [x,y] of p)assert.ok(x>=s.view.x[0]-1e-8&&x<=s.view.x[1]+1e-8&&y>=s.view.y[0]-1e-8&&y<=s.view.y[1]+1e-8);};
try{
for(const theme of ['light','dark']){
 await open('3.16',theme);
 for(let g=0;g<5;g++){
  await menu(0,g);const {G,rows}=tableOf(['Z4','S3','D4','Q8','A4'][g]);
  for(let seed=0;seed<5;seed++){
   const values=await page.evaluate(()=>window.__tables[1].__values);
   assert.equal(values.length,rows.length);assert.equal(values[0].length,G.classes.length+2);
   rows.forEach((r,i)=>{assert.equal(values[i][0],String(r.d));r.vals.forEach((z,j)=>assert.equal(values[i][j+2],ctext(z,2).replace(/^-0$/,'0')));});
   assert.doesNotMatch(await read(),/NaN|undefined|Infinity/);assert.match(await read(),/absolute numerical difference/);
   await page.getByRole('button').filter({hasText:'new random'}).click();await settle();
  }
 }
 await page.screenshot({path:`/tmp/atlas-rep-frobenius-${theme}.png`});console.log(`PASS ${theme} group determinant: five groups, five random samples each, all reconstructed character cells`);
}
assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
