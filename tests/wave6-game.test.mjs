import test,{after}from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../content/game/ch06.selection.shared.js';
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
for(const family of ['selection2','invasion','hawkDove'])test('GAME6 independently evaluated complete '+family+' cases',()=>{
 for(const row of reference.rows.filter(r=>r.name===family)){
  const actual=H[family](row.parameters);assert.deepEqual(physicalPaths(actual).sort(),physicalPaths(row.expected).sort(),'every physical output independently covered');
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
test('GAME6 declared selection domains reject malformed matrices and invalid shares',()=>{
 for(const run of [()=>H.selection2({matrix:[[1,2]]}),()=>H.selection2({matrix:[[NaN,0],[0,1]]}),()=>H.selection2({matrix:[[51,0],[0,1]]}),()=>H.selection2({share:1.1}),()=>H.invasion({resident:-1}),()=>H.invasion({mutant:Infinity}),()=>H.invasion({fraction:'0.1'}),()=>H.hawkDove({resource:-1}),()=>H.hawkDove({fightingCost:0})])assert.throws(run);
});
after(()=>{assert.equal(stats.cases,1101);console.log('GAME6 initial independent selection statistics '+JSON.stringify(stats));});
