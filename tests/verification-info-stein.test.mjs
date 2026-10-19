import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {npBernoulli} from '../content/info/source-audit.shared.js';
const near=(x,y,t=2e-11)=>assert.ok(Math.abs(x-y)<t,`${x} != ${y}`);
test('randomized finite optimum agrees with independent100-digit probability and boundary references',()=>{
 const refs=JSON.parse(readFileSync(new URL('../docs/verification/info-stein-references.json',import.meta.url)));
 for(const r of refs.rows){const f=npBernoulli(r.n,+r.p,+r.q,+r.epsilon);near(f.logBeta,+r.logBeta,2e-10);assert.equal(f.boundary.k,r.boundary);near(f.boundary.probability,+r.probability);near(f.alpha,+r.epsilon);}
});
test('all Bernoulli count classes agree with independently unfolded sequence-level randomized tests',()=>{
 for(let n=1;n<=8;n++)for(const p of [.1,.25,.5,.8])for(const q of [.1,.3,.5,.9])for(const e of [.01,.1,.3,.45]){
  const seq=Array.from({length:2**n},(_,mask)=>{const ones=mask.toString(2).replaceAll('0','').length;return{a:p**ones*(1-p)**(n-ones),b:q**ones*(1-q)**(n-ones)};}).sort((x,y)=>x.b/x.a-y.b/y.a);
  let left=1-e,beta=0;for(const x of seq){const take=Math.min(left,x.a);beta+=take*x.b/x.a;left-=take;if(left<=0)break;}
  near(npBernoulli(n,p,q,e).logBeta,Math.log2(beta));
 }
});
test('all displayed lengths and representative parameter controls conserve mass and satisfy the optimality certificate',()=>{
 for(let n=5;n<=300;n++)for(const[p,q]of [[.05,.95],[.95,.05],[.05,.06],[.49,.5],[.5,.5],[.94,.95]])for(const e of [.01,.1,.3,.45]){
  const r=npBernoulli(n,p,q,e);near(r.P.reduce((a,b)=>a+b,0),1);near(r.Q.reduce((a,b)=>a+b,0),1);near(r.alpha,e);assert.ok(Number.isFinite(r.logBeta));
  r.f.forEach(f=>assert.ok(f>=0&&f<=1));
  if(p===q)near(r.logBeta,Math.log2(1-e));
  else{const k=r.boundary.k,score=j=>j*Math.log(p/q)+(n-j)*Math.log((1-p)/(1-q)),threshold=score(k);for(let j=0;j<=n;j++){if(r.f[j]===1)assert.ok(score(j)>=threshold-1e-10);if(r.f[j]===0)assert.ok(score(j)<=threshold+1e-10);}}
 }
});
test('fractional boundary is randomization, and log-domain output survives probability underflow',()=>{
 const r=npBernoulli(1,.5,.2,.1);near(r.beta,.84);near(r.boundary.probability,.8);assert.equal(r.boundary.k,0);
 // A deterministic region with P-mass>=.9 must accept both outcomes and has beta1.
 assert.ok(r.beta<1);const z=npBernoulli(300,.05,.95,.01);assert.ok(z.logBeta< -1074);assert.equal(z.beta,0);assert.ok(Number.isFinite(-z.logBeta/300));
});
