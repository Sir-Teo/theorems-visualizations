import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { unitMiddleExample, irrationalExample, exactAdversarialRun, edmondsKarpAudit, criticalTally, konigCertificate } from '../content/algo/flow-paths-audit.shared.js';
import { fordFulkerson, isFeasible, coverBrute } from '../content/algo/ch11.shared.js';

const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({viewport:{width:1450,height:2200}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
  const response=await route.fetch();
  const body=(await response.text()).replace('stats.stages++;',`stats.stages++;(window.__auditStages||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__paths=[];s.__h=[];return begin();};for(const[key,list]of[['path','__paths'],['hline','__h']]){const f=s[key].bind(s);s[key]=(...a)=>{s[list].push(a);return f(...a);};}`).replace('return item.viz(v);',`const graph=v.graph;v.graph=(...a)=>{const G=graph(...a);(window.__auditGraphs||=[]).push(G);const draw=G.draw.bind(G);G.draw=(o={})=>{G.__draw=o;return draw(o);};return G;};const steps=v.steps;v.steps=(...a)=>{const S=steps(...a);window.__auditSteps=S;return S;};const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__auditReadout=f();return window.__auditReadout;});return item.viz(v);`);
  await route.fulfill({response,body});
});
const near=(a,b,t=1e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const settle=()=>page.waitForTimeout(60);
const menu=async(i,j)=>{await page.locator('.ctl-select').nth(i).locator('button').nth(j).click();await settle();};
const button=async name=>{const b=page.getByRole('button',{name,exact:true});if(await b.isDisabled()){assert.equal(name,'First step');assert.equal((await sample()).steps.i,0);return;}await b.click();await settle();};
const stepKey=async key=>{await page.getByRole('slider',{name:'Step',exact:true}).focus();await page.keyboard.press(key);await settle();};
const open=async(id,theme)=>{await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/algo/ch11-b.js&id=algo-${id}&still=1&wait=80&theme=${theme}`);await page.waitForFunction(()=>window.__done);const q=await page.evaluate(()=>window.__done);assert.deepEqual(q.errors,[]);assert.deepEqual(q.texErrors,[]);assert.deepEqual(q.blank,[]);};
const sample=()=>page.evaluate(()=>({
  readout:window.__auditReadout,
  stages:window.__auditStages.map(s=>({bounds:s.bounds,paths:s.__paths,h:s.__h})),
  graphs:window.__auditGraphs.map(G=>({nodes:G.nodes.map(n=>({id:n.id,x:n.x,y:n.y,fill:G.__draw.nodeFill?.(n.id)||null,ring:G.__draw.nodeRing?.(n.id)||null})),edges:G.edges.map(e=>({from:String(e.from),to:String(e.to),w:e.w,color:G.__draw.edgeColor?.(e)||null,dash:!!G.__draw.edgeDash?.(e)}))})),
  steps:window.__auditSteps?{i:window.__auditSteps.i,n:window.__auditSteps.n,frames:window.__auditSteps.frames,frame:window.__auditSteps.frame}:null,
  errors:window.__vizErrors||[],tex:document.querySelectorAll('.katex-error').length,
}));
const clean=q=>{assert.deepEqual(errors,[]);assert.deepEqual(q.errors,[]);assert.equal(q.tex,0);assert.doesNotMatch(q.readout,/NaN|undefined|NO\*\*/);for(const s of q.stages)for(const[P]of s.paths)for(const[x,y]of P){assert.ok(Number.isFinite(x)&&Number.isFinite(y));assert.ok(x>=s.bounds.x[0]-1e-12&&x<=s.bounds.x[1]+1e-12&&y>=s.bounds.y[0]-1e-12&&y<=s.bounds.y[1]+1e-12);}};
const graphData=q=>({ids:q.graphs[0].nodes.map(n=>n.id),arcs:q.graphs[0].edges.map(e=>[e.from,e.to,e.w])});
async function slowCheck(C,rule,irr=false){
  const q=await sample(),N=irr?irrationalExample(4):unitMiddleExample(C),expected=rule==='bad'?exactAdversarialRun(N):fordFulkerson(Object.keys(N.pos),N.arcs,'s','t','bfs');
  assert.equal(q.steps.frames.filter(f=>f.type==='push').length,expected.steps.length);
  const i=q.steps.i,fr=q.steps.frame,n=q.steps.frames.slice(0,i+1).filter(f=>f.type==='push').length;
  assert.ok(isFeasible(N.arcs,fr.f,Object.keys(N.pos),'s','t'));
  near(fr.value,expected.frames[i].value);assert.ok(q.readout.includes(`Augmentations so far: **${n}**`));
  const line=q.stages[1].paths[0][0];assert.equal(line.length,n+1);
  assert.ok(q.stages[1].h.some(([v,o])=>o.color==='green'&&v===(irr?9:2*C)));
  if(irr){assert.ok(q.stages[1].h.some(([v,o])=>o.color==='red'&&Math.abs(v-(2+Math.sqrt(5)))<1e-12));if(rule==='bad'&&i===q.steps.n-1){assert.equal(n,30);assert.equal(fr.type,'end');assert.match(fr.note,/cutoff.*not algorithmic completion/);}}
  for(const a of fr.path||[])assert.ok(a.w>0);
  for(let k=0;k<q.graphs[0].edges.length;k++)assert.equal(q.graphs[0].edges[k].dash,(fr.path||[]).some(a=>a.i===k&&!a.fwd));
  clean(q);
}
async function ekCheck(){
  const q=await sample(),{ids,arcs}=graphData(q),R=edmondsKarpAudit(ids,arcs),done=q.steps.frames.slice(0,q.steps.i+1).filter(f=>f.type==='push').length;
  assert.equal(q.stages[1].paths.length,ids.length-1);
  ids.filter(v=>v!=='s').forEach((v,j)=>{const P=q.stages[1].paths[j][0];assert.equal(P.length,done+1);P.forEach(([k,d])=>{assert.equal(d,Number.isFinite(R.states[k].dist[v])?R.states[k].dist[v]:ids.length);});});
  assert.ok(q.readout.includes(`Completed augmentations: ${done} of ${R.steps.length}`));
  const top=criticalTally(R.events,done)[0];if(top)assert.ok(q.readout.includes(`**${top.count}** time`));else assert.match(q.readout,/so far: —/);
  assert.ok(isFeasible(arcs,q.steps.frame.f,ids,'s','t'));clean(q);
}
async function nodeClick(id){const point=await page.evaluate(id=>{const G=window.__auditGraphs[0],n=G.node(id),r=G.s.canvas.getBoundingClientRect();return[r.x+G.s.X(n.x),r.y+G.s.Y(n.y)];},id);await page.mouse.click(...point);await settle();}
async function nodeDrag(id){const p=await page.evaluate(id=>{const G=window.__auditGraphs[0],n=G.node(id),r=G.s.canvas.getBoundingClientRect();return{a:[r.x+G.s.X(n.x),r.y+G.s.Y(n.y)],b:[r.x+G.s.X(n.x+.3),r.y+G.s.Y(n.y-.2)],x:n.x};},id);await page.mouse.move(...p.a);await page.mouse.down();await page.mouse.move(...p.b,{steps:8});await page.mouse.up();await settle();assert.ok(Math.abs((await sample()).graphs[0].nodes.find(n=>n.id===id).x-p.x)>.1);}
async function coverCheck(show=true){
  const q=await sample(),g=q.graphs[0],nL=g.nodes.filter(n=>String(n.id).startsWith('l')).length,nR=g.nodes.length-nL,E=g.edges.map(e=>[+e.from.slice(1),+e.to.slice(1)]),C=konigCertificate(nL,nR,E),mine=new Set(g.nodes.filter(n=>n.ring==='gold').map(n=>n.id));
  for(const n of g.nodes)assert.equal(n.fill,show&&C.cover.has(n.id)?'red':null);
  for(const e of g.edges){const uncovered=mine.size>0&&!mine.has(e.from)&&!mine.has(e.to);assert.equal(e.dash,uncovered);if(uncovered)assert.equal(e.color,'red');}
  assert.ok(q.readout.includes(`$|M|=${C.matching.length}$`));assert.ok(q.readout.includes(`$|K|=${C.cover.size}$`));assert.ok(q.readout.includes(`Your cover: ${mine.size} vertices`));
  assert.equal(C.cover.size,coverBrute(nL,nR,E));clean(q);return{q,C,mine};
}
try{for(const theme of ['light','dark']){
  await open('11.8',theme);
  for(let C=1;C<=12;C++){
    const capacity=page.getByRole('slider',{name:'capacity C',exact:true});await capacity.focus();await page.keyboard.press('Home');for(let j=1;j<C;j++)await page.keyboard.press('ArrowRight');await settle();
    for(const[rule,j]of [['bad',0],['bfs',1]]){await menu(1,j);await button('First step');await slowCheck(C,rule);await button('Next step');await slowCheck(C,rule);await stepKey('End');await slowCheck(C,rule);await button('First step');await slowCheck(C,rule);await stepKey('End');}
  }
  await menu(0,1);for(const[rule,j]of [['bad',0],['bfs',1]]){await menu(1,j);await button('First step');await slowCheck(0,rule,true);const max=(await sample()).steps.n;for(let k=1;k<max;k++){await button('Next step');await slowCheck(0,rule,true);}}
  await menu(1,0);await stepKey('End');await nodeDrag('v1');await slowCheck(0,'bad',true);await page.screenshot({path:`/tmp/atlas-flow-irrational-${theme}.png`});
  console.log(`PASS ${theme} adversarial: all12capacities×bothrules, actualfirst/next/final, everyirrationalframe, exact30cutoff and genuineBFScompletion`);
  await open('11.9',theme);
  for(let trial=0;trial<11;trial++){
    if(trial<3)await menu(0,trial);else await button('Random network');
    await button('First step');await ekCheck();const n=(await sample()).steps.n;
    for(let k=1;k<n;k++){await button('Next step');await ekCheck();}
  }
  await nodeDrag('a');await ekCheck();await page.screenshot({path:`/tmp/atlas-flow-shortest-${theme}.png`});
  console.log(`PASS ${theme} shortest: all3presets+8randomnetworks, everyframe, actualpostpush/finaldistances includinginfinity and completedcriticaltallies`);
  await open('11.12',theme);
  for(let trial=0;trial<7;trial++){
    if(trial<3)await menu(0,trial);else await button('New random');
    let q=await coverCheck();for(const n of q.q.graphs[0].nodes){await nodeClick(n.id);await coverCheck();}
    await button('Clear my cover');q=await coverCheck();for(const id of q.C.cover){await nodeClick(id);await coverCheck();}
    assert.match((await sample()).readout,/covers all edges/);
    await page.locator('.ctl-toggle label').click();await settle();await coverCheck(false);await page.locator('.ctl-toggle label').click();await settle();await coverCheck(true);await button('Clear my cover');
  }
  await page.screenshot({path:`/tmp/atlas-flow-konig-${theme}.png`});
  console.log(`PASS ${theme} Konig: all3presets+4randomgraphs, everyvertexclick, uncoveredmatching-edgedashes, canonicalminimumcover, toggle andclear`);
}}finally{await browser.close();server.close();}
