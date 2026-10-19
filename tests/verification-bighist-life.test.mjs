import {test} from 'node:test';
import assert from 'node:assert/strict';
import {carbonYieldGuide,weekAccumulation,oxygenEquilibrium,HUMAN_MITO_PROTEINS as H,hypothesisScores} from '../content/bighist/ch03-life.shared.js';
test('illustrative yield guide is continuous and the weekly model actually reaches its chosen endpoint',()=>{
 assert.equal(carbonYieldGuide(0),.001);assert.equal(carbonYieldGuide(2),2);assert.equal(carbonYieldGuide(4),2);assert.ok(Math.abs(carbonYieldGuide(2-1e-9)-2)<1e-8);
 for(const y of[.001,2,2.4,4.7]){assert.equal(weekAccumulation(y,0),0);assert.equal(weekAccumulation(y,7),y);let before=0;for(let d=0;d<=7;d+=.1){const after=weekAccumulation(y,d);assert.ok(after>=before&&after<=y);before=after;}const at2=weekAccumulation(y,2),at4=weekAccumulation(y,4),asymptote=y/(-Math.expm1(-3.5));assert.ok(Math.abs((asymptote-at4)/(asymptote-at2)-Math.exp(-1))<1e-14);}
});
test('oxygen equilibrium independently solves the flux balance across the apparent threshold',()=>{
 for(const S of[.2,.4,.98,1,1.00001,1.4,2.5])for(const k of[.3,1,3]){let lo=0,hi=10;for(let i=0;i<100;i++){const x=(lo+hi)/2;if(S-x/(x+1e-5)-k*x>0)lo=x;else hi=x;}const x=oxygenEquilibrium(S,k);assert.ok(x>0);assert.ok(Math.abs(x-(lo+hi)/2)<1e-12);assert.ok(Math.abs(S-x/(x+1e-5)-k*x)<1e-14);assert.ok(oxygenEquilibrium(S+.01,k)>x);}
});
test('protein inventory partitions one consistent protein-coding count and ranking handles zero weights',()=>{
 assert.equal(H.mitochondrial+H.nuclear,H.total);assert.equal(H.total,1136);assert.equal(H.mitochondrial,13);assert.ok(Math.abs(100*H.nuclear/H.total-98.8556338028169)<1e-12);
 assert.deepEqual(hypothesisScores([0,0,0,0,0]),[0,0,0,0]);assert.deepEqual(hypothesisScores([1,2,0,3,1]),hypothesisScores([2,4,0,6,2]));
 const heredity=hypothesisScores([0,1,0,0,0]),compartments=hypothesisScores([0,0,1,0,0]);assert.equal(heredity.indexOf(Math.max(...heredity)),0);assert.equal(compartments.indexOf(Math.max(...compartments)),2);
});
