import test,{after}from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {moran,logitCoordination}from '../content/game/ch06.chains.shared.js';
import {Q,expQ,uniquelyRounded}from '../content/game/ch06.enclosure.shared.js';
const reference=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-game-chains-reference.json',import.meta.url))),models={moran,logitCoordination},stats={cases:0,comparisons:0,worstLogAbsolute:0};
function decimal(text){const m=String(text).match(/^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);assert.ok(m,'independent oracle decimal');const n=BigInt(m[2]+(m[3]||''))*(m[1]==='-'?-1n:1n),power=Number(m[4]||0)-(m[3]||'').length;return power>=0?Q.rational(n*10n**BigInt(power)):Q.rational(n,10n**BigInt(-power));}
function compare(a,b,label){
 if(b&&typeof b==='object'&&!Array.isArray(b)&&'logMagnitude'in b){
  for(const k of ['value','sign','belowRange','aboveRange','approximate'])assert.ok(Object.is(a[k],b[k]),label+' strict '+k+' '+a[k]+' expected '+b[k]);
  if(b.logMagnitude===null)assert.equal(a.logMagnitude,-Infinity,label+' exact zero');else{const error=Math.abs(a.logMagnitude-b.logMagnitude);stats.worstLogAbsolute=Math.max(stats.worstLogAbsolute,error);assert.ok(error<=8e-12,label+' log error '+error);}
  if(a.interval){assert.ok(uniquelyRounded(a.interval),label+' retained enclosure determines rounded physical output');const center=decimal(b.oracle),magnitude=Q.sign(center)<0?Q.neg(center):center,tolerance=Q.mul(magnitude,Q.rational(1n,10n**68n));assert.ok(Q.sign(Q.sub(a.interval.hi,Q.sub(center,tolerance)))>=0&&Q.sign(Q.sub(a.interval.lo,Q.add(center,tolerance)))<=0,label+' independent70digit oracle uncertainty overlaps retained enclosure');assert.ok(Q.sign(Q.sub(a.interval.hi,a.interval.lo))>=0,label+' ordered enclosure');}
  stats.comparisons+=6;return;
 }
 if(b&&typeof b==='object'){assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),label+' complete nested fields');for(const[k,v]of Object.entries(b))compare(a[k],v,label+'.'+k);return;}
 assert.ok(Object.is(a,b),label+' exact leaf');stats.comparisons++;
}
function physicalPaths(x,path=''){if(x&&typeof x==='object'&&'logMagnitude'in x)return[path];return x&&typeof x==='object'?Object.entries(x).filter(([k])=>k!=='exact').flatMap(([k,v])=>physicalPaths(v,path+'.'+k)):[];}
for(const family of ['moran','logitCoordination'])test('GAME6 independent complete finite-chain '+family+' laws',()=>{
 for(const row of reference.rows.filter(r=>r.name===family)){const actual=models[family](row.parameters);assert.deepEqual(physicalPaths(actual).sort(),physicalPaths(row.expected).sort(),'all physical fields independently covered');for(const[k,v]of Object.entries(row.expected))compare(actual[k],v,family+' '+JSON.stringify(row.parameters)+'.'+k);assert.ok([160,320,640,1280,2560,4096].includes(actual.precisionBits));stats.cases++;}
});
test('GAME6 finite neutrality, absorbing states and revision multiplicity have separate meanings',()=>{
 const m=moran({selectionStrength:0,population:12,initialCount:3});assert.equal(m.selectedFixation.value,.25);assert.equal(m.neutral,true);assert.equal(m.singleMutantDifference.sign,0);assert.equal(m.fixation[0].value,0);assert.equal(m.fixation[12].value,1);
 const tiny=moran({matrix:[[0,0],[Number.MIN_VALUE,0]],population:2,selectionStrength:Number.MIN_VALUE});assert.equal(tiny.neutral,false);assert.equal(tiny.singleMutantDifference.sign,-1);assert.equal(tiny.singleMutantDifference.belowRange,true);assert.ok(Object.is(tiny.singleMutantDifference.value,-0));assert.equal(tiny.selectedFixation.value,.5);
 const l=logitCoordination({population:12,inverseNoise:0});assert.equal(l.rows[6].probability.value,924/4096);assert.notEqual(l.rows[6].probability.value,1/13);assert.equal(l.allDetailedBalanceIdentitiesVerified,true);
 assert.deepEqual(logitCoordination({firstLoss:2,secondLoss:2}).zeroNoiseSupport,[0,12]);assert.deepEqual(logitCoordination({firstLoss:2,secondLoss:3}).zeroNoiseSupport,[0]);
});
test('GAME6 exponential range reduction retains positive mass past physical underflow',()=>{const x=expQ(-5800);assert.equal(Q.sign(x.lo),1);assert.equal(Q.sign(x.hi),1);assert.ok(uniquelyRounded(x));assert.equal(Q.approximate(x.lo),0);});
test('GAME6 finite chains reject invalid counts, fitness parameters and coordination scope',()=>{for(const run of [()=>moran({population:1}),()=>moran({initialCount:.5}),()=>moran({initialCount:13}),()=>moran({selectionStrength:-1}),()=>moran({matrix:[[11,0],[0,0]]}),()=>logitCoordination({population:31}),()=>logitCoordination({firstLoss:0}),()=>logitCoordination({inverseNoise:Infinity}),()=>logitCoordination({selectedCount:13})])assert.throws(run);});
after(()=>{assert.equal(stats.cases,reference.cases);console.log('GAME6 independent finite-chain statistics '+JSON.stringify(stats));});
