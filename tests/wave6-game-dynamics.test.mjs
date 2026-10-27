import test,{after}from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {replicator,replicatorTwo,hawkPath}from '../content/game/ch06.dynamics.shared.js';
const reference=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-game-dynamics-reference.json',import.meta.url))),models={replicator,replicatorTwo,hawkPath},stats={cases:0,exactComparisons:0,numericalComparisons:0,worstPathAbsolute:0,worstLogShareAbsolute:0,worstLogMagnitude:0};
function exact(a,b,label){
 if(b&&typeof b==='object'&&!Array.isArray(b)&&'logMagnitude'in b){for(const k of ['value','sign','belowRange','aboveRange','approximate'])assert.ok(Object.is(a[k],b[k]),label+' strict '+k);if(b.logMagnitude===null)assert.equal(a.logMagnitude,-Infinity);else{const error=Math.abs(a.logMagnitude-b.logMagnitude);stats.worstLogMagnitude=Math.max(stats.worstLogMagnitude,error);assert.ok(error<=8e-12,label+' log magnitude');}stats.exactComparisons+=6;return;}
 if(b&&typeof b==='object'){assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),label+' complete nested fields');for(const[k,v]of Object.entries(b))exact(a[k],v,label+'.'+k);return;}
 assert.ok(Object.is(a,b),label+' exact leaf');stats.exactComparisons++;
}
for(const family of ['replicator','replicatorTwo','hawkPath'])test('GAME6 independent instantaneous and full numerical '+family+' paths',()=>{
 for(const row of reference.rows.filter(x=>x.name===family)){
  const a=models[family](row.parameters),b=row.expected;for(const[k,v]of Object.entries(b))if(k!=='path')exact(a[k],v,family+'.'+k);
  assert.equal(a.path.length,b.path.length);assert.ok(a.maximumStepHalvingDifference<=2e-8);assert.ok(a.maximumConservationError<=5e-16);
  for(let j=0;j<b.path.length;j++)for(const[k,v]of Object.entries(b.path[j])){
   const left=a.path[j][k];if(k==='time'){assert.equal(left,v);continue;}
   for(const[x,y]of Array.isArray(v)?v.map((y,i)=>[left[i],y]):[[left,v]]){
    if(y===null){assert.ok(x===null||x===-Infinity);continue;}const error=Math.abs(x-y),limit=k==='logShares'||k==='logProduct'||k==='relativeEntropy'?4e-7:8e-8;
    if(k==='logShares')stats.worstLogShareAbsolute=Math.max(stats.worstLogShareAbsolute,error);else stats.worstPathAbsolute=Math.max(stats.worstPathAbsolute,error);assert.ok(error<=limit,family+' '+JSON.stringify(row.parameters)+' sample'+j+' '+k+' independent error '+error);stats.numericalComparisons++;
   }
  }
  stats.cases++;
 }
});
test('GAME6 numerical underflow retains the original support and logarithmic component',()=>{const z=replicator({initialFirst:Number.MIN_VALUE,initialSecond:Number.MIN_VALUE,time:30});assert.deepEqual(z.support,[0,1,2]);assert.ok(z.path.some(p=>p.positiveComponentsBelowRange.includes(1)));assert.ok(Number.isFinite(z.path.at(-1).logShares[1]));assert.equal(z.field.conservationResidual.sign,0);const boundary=replicator({initialFirst:1,initialSecond:0});assert.equal(boundary.relativeEntropyDerivative,null);assert.equal(boundary.logProductDerivative,null);assert.deepEqual(boundary.path.at(-1).shares,[1,0,0]);});
test('GAME6 exact cyclic and Lyapunov signs are independent of numerical trajectories',()=>{for(const[win,loss,expected]of[[2,1,1],[1,1,0],[1,2,-1]]){const z=replicator({win,loss});assert.equal(z.logProductDerivative.sign,expected);assert.equal(z.cyclicIdentityResidual.sign,0);assert.equal(z.centerESS,expected===1);}assert.equal(replicator({game:'stable mixing'}).relativeEntropyDerivative.sign,-1);assert.equal(replicator({game:'coordination'}).relativeEntropyDerivative.sign,1);});
test('GAME6 numerical dynamics reject invalid simplex points and undeclared games',()=>{for(const run of[()=>replicator({initialFirst:.8,initialSecond:.3}),()=>replicator({secondOfRemainder:2}),()=>replicator({game:'missing'}),()=>replicator({win:0}),()=>replicator({time:31}),()=>replicator({samples:2}),()=>replicatorTwo({initialShare:-1}),()=>replicatorTwo({time:13}),()=>hawkPath({fightingCost:0})])assert.throws(run);});
after(()=>{assert.equal(stats.cases,reference.cases);console.log('GAME6 independent dynamics statistics '+JSON.stringify(stats));});
