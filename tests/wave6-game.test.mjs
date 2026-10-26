import test,{after}from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../content/game/ch06.selection.shared.js';
import * as R from '../content/game/ch06.routing.shared.js';
import * as P from '../content/game/ch06.potential.shared.js';
import * as C from '../content/game/ch06.congestion.shared.js';
import chapter from '../content/game/ch06.js';
import syllabus from '../content/game/syllabus.js';
const models={...H,...R,...P,...C};
const reference=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-game-reference.json',import.meta.url)));
const stats={cases:0,comparisons:0,worstLogAbsolute:0};
function compare(a,b,label){
 if(b&&typeof b==='object'&&!Array.isArray(b)&&'logMagnitude'in b){
  for(const k of ['value','sign','belowRange','aboveRange','approximate'])assert.ok(Object.is(a[k],b[k]),label+' strict '+k);
  if(b.logMagnitude===null)assert.equal(a.logMagnitude,-Infinity,label+' exact zero');
  else{const error=Math.abs(a.logMagnitude-b.logMagnitude);stats.worstLogAbsolute=Math.max(stats.worstLogAbsolute,error);assert.ok(error<=8e-12,label+' logarithmic magnitude '+error);}
  stats.comparisons+=6;return;
 }
 if(b&&typeof b==='object'){assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),label+' complete nested fields');for(const[k,v]of Object.entries(b))compare(a[k],v,label+'.'+k);return;}
 assert.ok(Object.is(a,b),label+' exact leaf');stats.comparisons++;
}
function physicalPaths(x,path=''){
 if(x&&typeof x==='object'&&'logMagnitude'in x)return[path];
 return x&&typeof x==='object'?Object.entries(x).filter(([k])=>k!=='exact').flatMap(([k,v])=>physicalPaths(v,path+'.'+k)):[];
}
for(const family of ['selection2','invasion','hawkDove','braess','pigou','potentialGame','atomicCongestion'])test('GAME6 independently evaluated complete '+family+' cases',()=>{
 for(const row of reference.rows.filter(r=>r.name===family)){
  const actual=models[family](row.parameters);assert.deepEqual(physicalPaths(actual).sort(),physicalPaths(row.expected).sort(),'every physical output independently covered');
  for(const[k,v]of Object.entries(row.expected))compare(actual[k],v,family+' '+JSON.stringify(row.parameters)+'.'+k);
  stats.cases++;
 }
});
test('GAME6 rare-invasion signs survive a quadratic product below physical range',()=>{
 const r=H.invasion({matrix:[[-Number.MIN_VALUE,Number.MIN_VALUE],[Number.MIN_VALUE,-Number.MIN_VALUE]],resident:.5,mutant:0,fraction:Number.MIN_VALUE});
 assert.equal(r.residentClassification.ess,true);assert.equal(r.firstAdvantage.sign,0);assert.equal(r.secondAdvantage.sign,1);assert.equal(r.incumbentAdvantage.sign,1);assert.equal(r.incumbentAdvantage.belowRange,true);assert.equal(r.rareInvasionResisted,true);assert.equal(r.linearIdentityResidual.sign,0);
});
test('GAME6 boundary rest points and neutral continua are distinguished from ESS',()=>{
 const neutral=H.selection2({matrix:[[1,2],[1,2]],share:.5});assert.equal(neutral.equilibria.kind,'whole unit interval');assert.equal(neutral.selected.nash,true);assert.equal(neutral.selected.ess,false);
 const bad=H.selection2({matrix:[[2,0],[3,1]],share:1});assert.equal(bad.selected.rest,true);assert.equal(bad.selected.nash,false);assert.equal(bad.selected.ess,false);
 const weak=H.hawkDove({resource:8,fightingCost:8,hawkShare:1});assert.equal(weak.selected.ess,true);assert.equal(weak.selected.strictNash,false);assert.equal(weak.stableHawkShare.value,1);
 const same=H.invasion({resident:.5,mutant:.5});assert.equal(same.distinctMutant,false);assert.equal(same.rareInvasionResisted,null);assert.equal(same.invasionBarrier,null);
});
test('GAME6 declared model domains reject malformed matrices, shares, finite states and costs',()=>{
 for(const run of [()=>H.selection2({matrix:[[1,2]]}),()=>H.selection2({matrix:[[NaN,0],[0,1]]}),()=>H.selection2({matrix:[[51,0],[0,1]]}),()=>H.selection2({share:1.1}),()=>H.invasion({resident:-1}),()=>H.invasion({mutant:Infinity}),()=>H.invasion({fraction:'0.1'}),()=>H.hawkDove({resource:-1}),()=>H.hawkDove({fightingCost:0}),()=>R.braess({demand:-1}),()=>R.braess({shortcutCost:NaN}),()=>R.braess({selectedShortcutShare:2}),()=>R.pigou({slope:-1}),()=>R.pigou({constantCost:0}),()=>R.pigou({selectedFlow:1.1}),()=>P.potentialGame({landscape:'missing'}),()=>P.potentialGame({startRow:.5}),()=>P.potentialGame({step:9}),()=>C.atomicCongestion({players:0}),()=>C.atomicCongestion({players:2.5}),()=>C.atomicCongestion({slope:3}),()=>C.atomicCongestion({initialUpperRequests:9}),()=>C.atomicCongestion({step:45})])assert.throws(run);
});
test('GAME6 routing shows the canonical paradox and bound without assigning a zero-cost ratio',()=>{
 const b=R.braess();assert.equal(b.withoutMeanLatency.value,1.5);assert.equal(b.equilibriumMeanLatency.value,2);assert.equal(b.priceOfAnarchy.value,4/3);assert.equal(b.wardropVerified,true);assert.equal(b.optimumVerified,true);
 const empty=R.braess({demand:0});assert.equal(empty.equilibriumMeanLatency,null);assert.equal(empty.priceOfAnarchy,null);assert.equal(empty.optimumVerified,true);
 assert.match(R.braess({demand:.25}).shortcutComparison,/improves/);assert.match(R.braess({demand:3}).shortcutComparison,/unchanged/);
 const p=R.pigou();assert.equal(p.equilibriumTotalCost.value,1);assert.equal(p.optimalTotalCost.value,.75);assert.equal(p.priceOfAnarchy.value,4/3);assert.equal(p.affineBoundSlack.sign,0);
 const zero=R.pigou({slope:0,intercept:0});assert.equal(zero.priceOfAnarchy,null);assert.match(zero.ratioStatus,/undefined/);
 assert.equal(R.pigou({slope:0,intercept:1,constantCost:1}).equilibriumSet.kind,'whole unit interval');
});
test('GAME6 finite strict ascent can stop at a local Nash point below the global potential maximum',()=>{
 const defaultPath=P.potentialGame();assert.deepEqual(defaultPath.path.map(s=>[s.row,s.column]),[[0,0],[1,0],[1,1],[2,1],[2,2]]);assert.equal(defaultPath.terminal.nash,true);assert.equal(defaultPath.pathStrictlyIncreases,true);assert.equal(defaultPath.allDeviationIdentitiesVerified,true);
 const local=P.potentialGame({landscape:'matching base',coupling:.5,startRow:2,startColumn:0,step:8});assert.equal(local.current.potential.value,0);assert.equal(local.potentialMaximum.value,2);assert.equal(local.haltedAtDisplayedState,true);
 const flat=P.potentialGame({landscape:'flat base',step:8});assert.equal(flat.equilibria.length,9);assert.equal(flat.path.length,1);assert.equal(flat.displayedStep,0);
});
test('GAME6 atomic selfish switches decrease Rosenthal potential while total travel cost can rise',()=>{
 const z=C.atomicCongestion();assert.deepEqual(z.path.map(s=>s.counts),[[2,2,0],[1,2,1],[1,1,2]]);assert.deepEqual(z.path.map(s=>s.potential.value),[19,18.75,18.5]);assert.deepEqual(z.path.map(s=>s.totalCost.value),[21,22.75,24.5]);assert.equal(z.terminal.nash,true);assert.equal(z.allDeviationIdentitiesVerified,true);assert.equal(z.minimumCost.value,21);
 const flat=C.atomicCongestion({players:8,slope:0,constantLatency:0,shortcutLatency:0,step:44});assert.equal(flat.inventory.length,45);assert.equal(flat.equilibria.length,45);assert.equal(flat.path.length,1);assert.equal(flat.displayedStep,0);
});
test('GAME6 all twelve teaching drafts retain the frozen identities and full explanations',()=>{
 const frozen=JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json',import.meta.url))).chapters.find(c=>c.collection==='game').items,outline=syllabus.chapters.find(c=>c.n===6).items;
 assert.equal(chapter.items.length,12);for(const[i,item]of chapter.items.entries()){for(const k of['num','kind','name','deps','paper','introduces','verify','see'])assert.deepEqual(item[k],frozen[i][k],item.num+' frozen '+k);for(const k of['num','kind','name','deps','refs'])assert.deepEqual(item[k],outline[i][k],item.num+' syllabus '+k);assert.equal(item.caption,outline[i].pic);for(const k of['statement','idea','scope','caption'])assert.ok(item[k].length>120,item.num+' complete '+k);assert.equal(typeof item.viz,'function');}
});
test('GAME6 preserves the complete previous syllabus except new researched refs and picture captions',()=>{
 const before=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-game-syllabus-before.json',import.meta.url))),omit=c=>c.n!==6?c:{...c,items:c.items.map(({refs,pic,...rest})=>rest)};
 assert.deepEqual({...syllabus,chapters:syllabus.chapters.map(omit)},{...before,chapters:before.chapters.map(omit)});
});
after(()=>{assert.equal(stats.cases,1937);console.log('GAME6 independent finite-game/routing statistics '+JSON.stringify(stats));});
