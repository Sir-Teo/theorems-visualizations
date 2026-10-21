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
const open=async(id,theme)=>{await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/rep/${Number(id.slice(2))<=8?'ch03.js':'ch03-b.js'}&id=rep-${id}&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);const r=await page.evaluate(()=>window.__done);assert.deepEqual(r.errors,[]);assert.deepEqual(r.texErrors,[]);};
const read=()=>page.locator('.viz-readout').innerText();
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const menu=async(i,j)=>{await page.locator('.ctl-select').nth(i).locator('button').nth(j).click();await settle();};
const button=async name=>{await page.getByRole('button',{name,exact:true}).click();await settle();};
const cell=async(i,j)=>{const p=await page.evaluate(({i,j})=>{const t=window.__tables[0],g=t.geo,b=t.s.canvas.getBoundingClientRect();return{x:b.x+g.X0+g.xs[j]+g.cws[j]/2,y:b.y+g.Y0+(i+.5)*g.ch};},{i,j});await page.mouse.click(p.x,p.y);await settle();};
const bounds=async(index)=>{const s=await page.evaluate(i=>{const s=window.__auditStages[i];return {view:s.view,rects:s.__rects,polys:s.__polys};},index);for(const r of s.rects)for(const [x,y] of [[r[0],r[1]],[r[2],r[3]]])assert.ok(x>=s.view.x[0]-1e-8&&x<=s.view.x[1]+1e-8&&y>=s.view.y[0]-1e-8&&y<=s.view.y[1]+1e-8,JSON.stringify({r,view:s.view}));for(const p of s.polys)for(const [x,y] of p)assert.ok(x>=s.view.x[0]-1e-8&&x<=s.view.x[1]+1e-8&&y>=s.view.y[0]-1e-8&&y<=s.view.y[1]+1e-8);};
try{
for(const theme of ['light','dark']){
 await open('3.4',theme);for(let g=0;g<5;g++){await menu(0,g);await button('next character → φ');await button('random');await bounds(0);await bounds(1);assert.match(await read(),/element-by-element sum/);}console.log(`PASS ${theme} inner products: five groups, character and random controls`);
 await open('3.5',theme);await menu(0,3);await cell(1,1);await page.locator('.ctl-toggle label').nth(1).click();await settle();await page.locator('.ctl-toggle label').nth(0).click();await settle();assert.doesNotMatch(await read(),/NaN|undefined/);console.log(`PASS ${theme} character Gram matrix: complex A4, conjugation and weighting toggles`);
 await open('3.6',theme);for(let o=0;o<6;o++){await menu(0,o);for(let g=0;g<5;g++){await menu(1,g);assert.doesNotMatch(await read(),/NaN|undefined/);}}console.log(`PASS ${theme} cube: all 30 object/class combinations`);
 await open('3.7',theme);for(let c=0;c<4;c++){await menu(0,c);for(const key of ['Home','End']){await slider(0,key);await bounds(1);assert.match(await read(),c<2?/explicit isomorphism/:/no isomorphism exists/);}}await menu(0,0);await button('zero X');assert.match(await read(),/no invertible witness/);await page.screenshot({path:`/tmp/atlas-rep-zero-${theme}.png`});await page.getByRole('button').filter({hasText:'new random'}).click();await settle();assert.match(await read(),/explicit isomorphism/);console.log(`PASS ${theme} averaging: four candidates, shear endpoints, zero and random X`);
 await open('3.8',theme);await menu(0,6);assert.deepEqual(await page.locator('input[type=range]').evaluateAll(es=>es.map(e=>Number(e.value))),[5,1,3,2,2]);assert.match(await read(),/degree.*24/s);assert.match(await read(),/43/);await page.screenshot({path:`/tmp/atlas-rep-conjugation-${theme}.png`});for(let i=0;i<5;i++)await slider(i,'Home');assert.match(await read(),/degree.*0/s);for(let i=0;i<5;i++)await slider(i,'End');assert.match(await read(),/125/);console.log(`PASS ${theme} norm: conjugation preset, zero and maximal multiplicities`);
 await open('3.9',theme);for(let g=0;g<6;g++){await menu(0,g);for(let a=0;a<2;a++){await menu(1,a);await bounds(0);assert.doesNotMatch(await read(),/NaN|undefined/);}}console.log(`PASS ${theme} regular and conjugation actions: six groups`);
 await open('3.12',theme);for(const name of ['one vertex','alternating','rotating wave']){await button(name);assert.doesNotMatch(await read(),/NaN|undefined/);assert.match(await read(),/largest overlap/);}console.log(`PASS ${theme} isotypic projections: three source examples`);
 await open('3.13',theme);for(let g=0;g<2;g++){await menu(0,g);await slider(0,'Home');assert.match(await read(),/Largest deviation over the whole table: 0/);await slider(0,'End');for(let i=0;i<(g?8:6);i++){await cell(i,i);await bounds(0);}assert.match(await read(),/non-unitary basis/);}await page.screenshot({path:`/tmp/atlas-rep-shear-${theme}.png`});console.log(`PASS ${theme} coefficients: unitary Gram matrices, all sheared diagonal selections and full plot extents`);
}
assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
