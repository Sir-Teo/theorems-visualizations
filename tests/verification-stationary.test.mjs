import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {CHAINS,piOf,muP,cumRows} from '../content/prob/ch05-m.shared.js';
import {balancedRing,ringModel,finiteReturnSample,reflectingReturnLaw} from '../content/prob/ch05-stationary.shared.js';
const ref=JSON.parse(readFileSync(new URL('../docs/verification/stationary-references.json',import.meta.url))),fraction=s=>s.includes('/')?s.split('/').reduce((a,b)=>Number(a)/Number(b)):Number(s);
const near=(a,b,tol=1e-12)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('finite stationary and return references satisfy independent exact first-step equations',()=>{
 for(const [key,row] of Object.entries(ref.finite)){const P=CHAINS[key].P,pi=row.pi.map(fraction),T=row.returnMean.map(fraction),got=piOf(P);pi.forEach((p,i)=>{near(p,got[i]);near(p*T[i],1);near(muP(pi,P)[i],p);});}
 // An unnormalized mass must not lose its entries above one when advanced.
 const mu=[1,1,1,1,1],q=muP(mu,CHAINS.gen5.P);assert.ok(Math.max(...q)>1);near(q.reduce((a,b)=>a+b),5);
 for(const {P}of Object.values(CHAINS))for(const mu of [new Array(P.length).fill(0),new Array(P.length).fill(3),Array.from({length:P.length},(_,i)=>i*i)])near(muP(mu,P).reduce((a,b)=>a+b),mu.reduce((a,b)=>a+b));
});
test('bounded log projection always makes the full ring reversible, including formerly infeasible corners',()=>{
 for(let code=0;code<81;code++){let k=code;const f=Array.from({length:4},()=>{const x=[.1,.3,.65][k%3];k=Math.floor(k/3);return x;}),b=balancedRing(f),r=ringModel(b),pi=piOf(r.P);
  assert.ok(b.every(x=>x>=.1-1e-14&&x<=.65+1e-14));near(r.forward,r.backward,1e-14);
  for(let i=0;i<4;i++){near(r.P[i].reduce((a,b)=>a+b),1);const j=(i+1)%4;near(pi[i]*r.P[i][j],pi[j]*r.P[j][i],3e-14);}
 }
});
test('cycle condition concerns existence, not arbitrary stationary measures of a transient chain',()=>{
 const p=.6,q=.4;
 for(let x=-8;x<=8;x++){near(p+q,1);near((p/q)**x*p,(p/q)**(x+1)*q);assert.notEqual(p,q);}
 for(let n=2;n<=10;n+=2)for(let mask=0;mask<2**n;mask++){let displacement=0,fw=1,bw=1;for(let k=0;k<n;k++){const up=!!(mask>>k&1);displacement+=up?1:-1;fw*=up?p:q;bw*=up?q:p;}if(displacement===0)near(fw,bw);}
});
test('reflecting Catalan law agrees with independent killed-state evolution at every offered p',()=>{
 for(let i=30;i<=70;i++){const p=i/100,C=80,r=reflectingReturnLaw(p,C);let active=new Map([[1,1]]),mean=2;
  near(r.survival[0],1);near(r.survival[1],1);
  for(let t=2;t<=C;t++){const next=new Map();let returned=0;for(const [x,w]of active)for(const [d,v]of [[1,p],[-1,1-p]]){const y=x+d;if(y===0)returned+=w*v;else next.set(y,(next.get(y)||0)+w*v);}active=next;const tail=[...active.values()].reduce((a,b)=>a+b,0);near(r.pmf[t],returned,2e-13);near(r.survival[t],tail,2e-13);if(t<C)mean+=tail;}
  near(r.cappedMean,mean,3e-13);near(r.pmf.reduce((a,b)=>a+b)+r.survival[C],1,4e-13);assert.ok(r.remainder<1e-18);
 }
});
test('capped means and endpoint survival match independent 70-digit hypergeometric tails',()=>{
 for(const row of ref.reflecting){const r=reflectingReturnLaw(Number(row.p),row.cap),tail=Number(row.tail),mean=Number(row.cappedMean);near(r.cappedMean,mean,2e-12);assert.ok(Math.abs(r.survival[row.cap]-tail)<=r.remainder+2e-13*Math.max(tail,1e-200));}
 const r=reflectingReturnLaw(.5);assert.equal(r.mean,Infinity);assert.ok(r.survival[5000]>.01);assert.ok(r.cappedMean>100&&r.cappedMean<120);
 const t=reflectingReturnLaw(.7);near(t.returnProbability,3/7);assert.ok(t.survival[5000]>.57);assert.equal(t.classification,'transient');
});
test('finite return sampler distinguishes completed excursions from censored times',()=>{
 const cum=cumRows([[.5,.5],[.5,.5]]);
 assert.deepEqual(finiteReturnSample(cum,0,()=>0,5),{T:1,censored:false});
 assert.deepEqual(finiteReturnSample(cum,0,()=>.99,5),{T:5,censored:true});
 let values=[.99,.01];assert.deepEqual(finiteReturnSample(cum,0,()=>values.shift(),5),{T:2,censored:false});
});
