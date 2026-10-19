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
 .replace('return item.viz(v);',`const table=v.table.bind(v);v.table=(...a)=>{const t=table(...a);(window.__tables ||= []).push(t);return t;};return item.viz(v);`);
 await route.fulfill({response,body});
});
const settle=()=>page.waitForTimeout(150);
const open=async(id,theme)=>{await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/rep/${id.startsWith('4.')?(id==='4.1'?'ch04.js':'ch04-b.js'):'ch03-b.js'}&id=rep-${id}&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);const r=await page.evaluate(()=>window.__done);assert.deepEqual(r.errors,[]);assert.deepEqual(r.texErrors,[]);};
const read=()=>page.locator('.viz-readout').innerText();
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const menu=async(i,j)=>{await page.locator('.ctl-select').nth(i).locator('button').nth(j).click();await settle();};
const button=async name=>{await page.getByRole('button',{name,exact:true}).click();await settle();};
const cell=async(i,j)=>{const p=await page.evaluate(({i,j})=>{const t=window.__tables[0],g=t.geo,b=t.s.canvas.getBoundingClientRect();return{x:b.x+g.X0+g.xs[j]+g.cws[j]/2,y:b.y+g.Y0+(i+.5)*g.ch};},{i,j});await page.mouse.click(p.x,p.y);await settle();};
const bounds=async(index)=>{const s=await page.evaluate(i=>{const s=window.__auditStages[i];return {view:s.view,rects:s.__rects,polys:s.__polys};},index);for(const r of s.rects)for(const [x,y] of [[r[0],r[1]],[r[2],r[3]]])assert.ok(x>=s.view.x[0]-1e-8&&x<=s.view.x[1]+1e-8&&y>=s.view.y[0]-1e-8&&y<=s.view.y[1]+1e-8,JSON.stringify({r,view:s.view}));for(const p of s.polys)for(const [x,y] of p)assert.ok(x>=s.view.x[0]-1e-8&&x<=s.view.x[1]+1e-8&&y>=s.view.y[0]-1e-8&&y<=s.view.y[1]+1e-8);};
try{
for(const theme of ['light','dark']){
 await open('3.15',theme);
 for(let mode=0;mode<3;mode++){
  await menu(0,mode);
  for(const n of ['Home','End'])for(const k of ['Home','End']){await slider(0,n);await slider(1,k);assert.match(await read(),/brute-force orbit count/);assert.match(await read(),/equal/);assert.doesNotMatch(await read(),/NaN|undefined/);}
 }
 await page.screenshot({path:`/tmp/atlas-rep-counting-${theme}.png`});console.log(`PASS ${theme} orbit counting: all three actions, bead/colour endpoints`);
 await open('4.1',theme);
 for(const m of ['Home','End'])for(const n of ['Home','End']){
  await slider(0,m);await slider(1,n);await cell(0,0);await cell(0,0);assert.match(await read(),/Gram matrix from.*I: 0/s);assert.match(await read(),/within 0/);
 }
 await cell(35,0);await cell(17,0);assert.match(await read(),/Gram matrix from.*I: 0/s);await page.screenshot({path:`/tmp/atlas-rep-abelian-${theme}.png`});console.log(`PASS ${theme} abelian characters: endpoint groups, repeated/distinct row selections`);
 await open('4.10',theme);
 for(let g=0;g<10;g++){await menu(0,g);await bounds(0);await bounds(1);assert.match(await read(),/largest difference 0/);assert.match(await read(),/agrees with.*yes/s);assert.doesNotMatch(await read(),/NaN|undefined/);}
 await menu(0,4);await page.screenshot({path:`/tmp/atlas-rep-indicators-${theme}.png`});console.log(`PASS ${theme} indicators: all ten groups, root-count and form-search agreement`);
 await open('4.9',theme);for(let g=0;g<6;g++){await menu(0,g);for(const end of ['Home','End']){await slider(0,end);for(let j=0;j<[3,4,3,5,5,4][g];j++){assert.doesNotMatch(await read(),/NaN|undefined/);await button('next irreducible');}}}console.log(`PASS ${theme} bilinear forms: every smaller-group irrep, both shear endpoints`);
 await open('4.8',theme);for(const n of ['Home','End'])for(const k of ['Home','End']){await slider(0,n);await slider(1,k);assert.doesNotMatch(await read(),/NaN|undefined/);}console.log(`PASS ${theme} exterior powers: n/k endpoints`);
}
assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
