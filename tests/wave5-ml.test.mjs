import test from 'node:test';
import assert from 'node:assert/strict';
import {unseenLaw,nflLaw,population,fit,sample,levels,sweep} from '../content/ml/ch05.shared.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('occupancy recursion agrees with exhaustive sample enumeration',()=>{for(let m=1;m<=4;m++){const N=2*m,counts=Array(N+1).fill(0);function walk(a){if(a.length===m){counts[N-new Set(a).size]++;return;}for(let j=0;j<N;j++)walk([...a,j]);}walk([]);unseenLaw(N,m).forEach((p,u)=>near(p,counts[u]/N**m));}});
test('NFL law normalized, exact expectation and failure lower bound',()=>{for(let m=1;m<=40;m++){const p=nflLaw(m),N=2*m;near(p.reduce((a,b)=>a+b),1);near(p.reduce((a,b,k)=>a+b*k/N,0),.5*(1-1/N)**m);assert.ok(p.reduce((a,b,k)=>a+(k/N>=.125?b:0),0)>=1/7);}});
test('ERM and risk decomposition checked against all bin labellings',()=>{for(const noise of [0,.15,.45])for(const m of [4,32,512])for(const K of [1,2,4,8]){const eta=population(noise),S=sample(m,noise,7),f=fit(K,eta,S);let bestTrue=Infinity,bestTrain=Infinity;for(let mask=0;mask<2**K;mask++){const pred=x=>(mask>>Math.floor(x*K/32))&1;bestTrue=Math.min(bestTrue,eta.reduce((s,p,x)=>s+(pred(x)?1-p:p),0)/32);bestTrain=Math.min(bestTrain,S.reduce((s,[x,y])=>s+ +(pred(x)!==y),0)/S.length);}near(f.approximation,bestTrue);near(f.training,bestTrain);near(f.risk,f.approximation+f.estimation);}});
test('nested class approximation and zero-noise rich-class memorization',()=>{const eta=population(0),S=Array.from({length:32},(_,i)=>[i,eta[i]]);let last=1;for(const K of levels){const f=fit(K,eta,S);assert.ok(f.approximation<=last);last=f.approximation;near(f.risk,f.approximation);}near(fit(32,eta,S).risk,0);assert.deepEqual(sweep(32,.15),sweep(32,.15));});
test('edited training state rejects sparse arrays and invalid cell labels', async()=>{
 const {default:ch}=await import('../content/ml/ch05.js');let adapter;
 const stage={onClick(){},};const ctl={value:1,set(){}};
 ch.items.find(x=>x.num==='5.2a').viz({stage:()=>stage,select:()=>ctl,slider:()=>ctl,button(){},shareState:(key,a)=>{adapter=a;},render(){},legend(){},readout(){}});
 assert.ok(adapter.validate([[0,0],[31,1]]));assert.ok(!adapter.validate(Array(1)));
 const disguised=Array(1);disguised.foo=[0,0];assert.ok(!adapter.validate(disguised));
 const inner=Array(2);inner.foo=0;inner.bar=1;assert.ok(!adapter.validate([inner]));
 for(const a of [[[32,0]],[[-1,1]],[[1,.5]],[[.2,0]],Array.from({length:513},()=>[0,0])])assert.ok(!adapter.validate(a));
});
