import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { DETERMINACY_GAMES, solveLineGame } from '../content/game/determinacy-audit.js';
const output=process.env.DETERMINACY_OUTPUT||'/tmp/atlas-coordinator/determinacy';await mkdir(output,{recursive:true});
const models=Object.fromEntries(Object.entries(DETERMINACY_GAMES).map(([k,g])=>[k,solveLineGame(g)]));
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
  const response=await route.fetch();let body=await response.text();
  body=body.replace('stats.stages++;','stats.stages++;(window.__S||=[]).push(s);');
  body=body.replace('return item.viz(v);','window.__V=v;return item.viz(v);');
  body=body.replace("mount(document.getElementById('viz'),","window.__mount=mount(document.getElementById('viz'),");
  body=body.replace('    });\n    window.__vizStats',"    },{state:JSON.parse(sessionStorage.getItem('determinacyRestore')||'null')});\n    window.__vizStats");
  await route.fulfill({response,body});
});
async function settle(){await page.evaluate(async()=>{await document.fonts.ready;window.__V.invalidate();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
async function ready(){await page.waitForFunction(()=>window.__done);const q=await page.evaluate(()=>window.__done);assert.deepEqual(q.errors,[]);assert.deepEqual(q.texErrors,[]);assert.deepEqual(q.blank,[]);assert.equal(q.quality.readout,true);await settle();}
async function snapshot(){return page.evaluate(()=>({state:window.__mount.snapshot(),readout:document.querySelector('.viz-readout').textContent,errors:window.__vizErrors||[],tex:window.__texErrors||[],overflow:document.documentElement.scrollWidth>innerWidth+1}));}
async function check(){const q=await snapshot(),d=q.state.parts.find(([k])=>k.startsWith('custom:line-game board'))[1],G=models[d.game];assert.deepEqual(q.errors,[]);assert.deepEqual(q.tex,[]);assert.equal(q.overflow,false);assert.ok(G.memo.has(d.board));assert.ok(q.readout.includes(`${G.memo.size} reachable positions`));assert.doesNotMatch(q.readout,/NaN|undefined|Infinity/);if(G.term(d.board)!==null)assert.match(q.readout,/game over/);else assert.ok(q.readout.includes(`value ${G.val(d.board)>0?'win':G.val(d.board)<0?'loss':'draw'} for ${G.mover(d.board)}`));return{...q,d};}
async function clickCell(i){const {d}=await check(),{W,H}=models[d.game].g;const pos=await page.evaluate(({i,W,H})=>{const s=window.__S[0],b=s.canvas.getBoundingClientRect(),cs=.9/Math.max(W,H),x=.5-cs*W/2+(i%W+.5)*cs,y=.5+cs*H/2-(Math.floor(i/W)+.5)*cs;return{x:b.x+s.X(x)*b.width/s.width,y:b.y+s.Y(y)*b.height/s.height};},{i,W,H});await page.mouse.click(pos.x,pos.y);await settle();return check();}
async function button(label){await page.getByRole('button',{name:label,exact:true}).click();await settle();}
async function replay(){const before=await check();await page.evaluate(s=>sessionStorage.setItem('determinacyRestore',JSON.stringify(s)),before.state);await page.reload();await ready();const after=await check();assert.deepEqual(after.state,before.state);assert.equal(after.readout,before.readout);await page.evaluate(()=>sessionStorage.removeItem('determinacyRestore'));}
try{
 for(const theme of ['light','dark'])for(const width of [1440,320]){
  await page.setViewportSize({width,height:1300});
  await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/game/ch04.js&id=game-4.3&still=1&wait=100&theme=${theme}&w=${width-36}`);await ready();
  for(const [key,g]of Object.entries(DETERMINACY_GAMES)){
   await button(g.label);await check();
   if((await snapshot()).state.parts.find(([k])=>k.startsWith('toggle:'))[1]){await page.getByText('computer replies after your move',{exact:true}).click();await settle();}
   const moves=key==='t34'?[0,4,1,5,2]:[0,3,1,4,2];
   for(const i of moves)await clickCell(i);
   let q=await check();assert.equal(models[key].term(q.d.board),key==='mis'?1:-1);
   const terminal=q.d.board;await clickCell(moves[0]);await clickCell(key==='t34'?11:8);assert.equal((await check()).d.board,terminal);
   await replay();await page.screenshot({path:`${output}/${key}-${width}-${theme}.png`,fullPage:true});
   await button('undo');q=await check();assert.equal(q.d.history.length,4);assert.equal(models[key].term(q.d.board),null);
   await button('new game');assert.equal((await check()).d.board,models[key].empty);
   await page.getByText('computer replies after your move',{exact:true}).click();await settle();q=await clickCell(0);assert.equal(q.d.history.length,2);await replay();
   await button('undo');assert.equal((await check()).d.history.length,1);
   await button('new game');
  }
  const saved=(await check()).state;const custom=saved.parts.find(([k])=>k.startsWith('custom:line-game board'));
  custom[1].board='X'.repeat(12);custom[1].history=[];
  await page.evaluate(s=>sessionStorage.setItem('determinacyRestore',JSON.stringify(s)),saved);await page.reload();await ready();
  assert.match(await page.locator('.viz-state-notice').textContent(),/invalid visualization value/);assert.equal((await check()).d.board,models.ttt.empty);
  await page.evaluate(()=>sessionStorage.removeItem('determinacyRestore'));
  console.log(`PASS ${width} ${theme}: all three games, terminal/no-op/undo/reset, native computer reply, saved board/history replay and invalid-state rejection`);
 }
 assert.deepEqual(errors,[]);
}catch(e){await page.screenshot({path:`${output}/failure.png`,fullPage:true}).catch(()=>{});throw e;}
finally{await browser.close();await new Promise(r=>server.close(r));}
