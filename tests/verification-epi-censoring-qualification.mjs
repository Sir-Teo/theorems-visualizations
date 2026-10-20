// Explicit independent check of the observed-at-risk hazard qualification, no source/runtime imports.
import assert from'node:assert/strict';
const close=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`),integrate=(f,a,b,n=12000)=>{const h=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;};
for(const rate of[.05,.7,3])for(const censor of[.2,1,7]){const survival=t=>Math.exp(-rate*t),expectedEvent=-Math.expm1(-rate*censor),expectedTime=integrate(survival,0,censor);close(expectedEvent,rate*expectedTime);}
// A censoring clock tied to the future event can hide every event and change the observed intensity.
for(const rate of[.05,.7,3]){const expectedEvent=0,expectedTime=integrate(x=>x/2*rate*Math.exp(-rate*x),0,40/rate);close(rate*expectedTime,.5);assert.notEqual(expectedEvent,rate*expectedTime);}
console.log('PASS 9 non-informative fixed-censor identities and3 informative-censor counterexamples; E[d]=lambda E[T] needs maintained observed hazard');
