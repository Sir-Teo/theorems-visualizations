import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {gridAR,stationary,cdfSample} from '../content/prob/ch05-z.shared.js';
import {harrisSplit,intervalSplit,cycleMeasure,completeCycles,analyticMinor,exactHarrisStep,escapeSurvival,gaussianTV,exponentialDifferenceTail,vecM,matMulS,phi} from '../content/prob/ch05-harris.shared.js';
const close=(a,b,tol=3e-12)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}`),vector=(a,b,tol)=>a.forEach((x,i)=>close(x,b[i],tol));
const P=[[.5,.5],[.25,.75]],split=harrisSplit(P,[true,true]);
test('source augmented/recovery kernels: independent rational example and epsilon one',()=>{
 close(split.eps,.75);vector(split.rho,[1/3,2/3]);split.Q.forEach((r,i)=>vector(r,[[.25,0,.75],[0,.25,.75],[1/12,1/6,.75]][i]));
 matMulS(split.V,split.U).forEach((r,i)=>vector(r,split.Q[i]));matMulS(split.U,split.V).forEach((r,i)=>vector(r,P[i]));
 const full=harrisSplit([[.4,.6],[.4,.6]],[true,true]);close(full.eps,1);full.Q.forEach(r=>vector(r,[0,0,1]));matMulS(full.U,full.V).forEach(r=>vector(r,[.4,.6]));
});
test('finite Gaussian kernels and all split corner cases are stochastic and satisfy both identities',()=>{
 for(const a of [.2,.7,.9])for(const c of [.25,.5,1,2.5]){const g=gridAR(a,41,5),s=intervalSplit(g,-c,c);for(const M of [g.P,s.Q,s.V])for(const r of M){close(r.reduce((a,b)=>a+b),1,3e-12);assert.ok(Math.min(...r)>-1e-14);}matMulS(s.U,s.V).forEach((r,i)=>vector(r,g.P[i]));matMulS(s.V,s.U).forEach((r,i)=>vector(r,s.Q[i]));}
});
test('cycle occupation solves independent finite Kac identities and includes recovered atom mass',()=>{
 const r=cycleMeasure(split);vector(r.u,[1/9,2/9,1]);vector(r.mu,[4/9,8/9]);close(r.ET,4/3);vector(r.pi,[1/3,2/3]);
 for(const a of [.2,.9])for(const [lo,hi]of [[-2.5,2.5],[-.5,.5],[2.5,3.5]]){const g=gridAR(a,41,5),s=intervalSplit(g,lo,hi),r=cycleMeasure(s),pi=stationary(g.P,3000),piA=pi.reduce((t,p,i)=>t+(s.inA[i]?p:0),0);vector(r.pi,pi,2e-11);close(r.ET,1/(s.eps*piA),2e-9);vector(vecM(r.mu,g.P),r.mu,2e-10);close(r.u.at(-1),1);close(r.mu.reduce((a,b)=>a+b),r.ET,2e-10);}
});
test('incomplete regeneration cycles are discarded wholesale',()=>{
 const deterministic={Q:[[0,1,0],[0,0,1],[1,0,0]],V:[[1,0],[0,1],[1,0]]};
 const c=completeCycles(deterministic,10,()=>.1,5);assert.equal(c.completed,1);assert.equal(c.steps,5);assert.equal(c.discarded,2);assert.equal(c.capped,true);vector(c.mu,[2,1]);close(c.ET,3);vector(c.pi,[2/3,1/3]);
 const none=completeCycles(deterministic,1,()=>.1,2);assert.equal(none.completed,0);vector(none.mu,[0,0]);assert.equal(none.discarded,2);
});
test('stationary augmentation and expectation transfer use the source recovery direction',()=>{
 const pi=[1/3,2/3],aug=vecM(pi,split.U);vector(aug,[1/12,1/6,.75]);vector(vecM(aug,split.Q),aug);vector(vecM(aug,split.V),pi);
 for(const f of [[-2,4],[0,1],[1,1]])for(const i of [0,1]){let original=[Number(i===0),Number(i===1)],bar=[...original,0];for(let n=0;n<20;n++){const recovered=vecM(bar,split.V);vector(recovered,original);close(original.reduce((s,p,i)=>s+p*f[i],0),recovered.reduce((s,p,i)=>s+p*f[i],0));original=vecM(original,P);bar=vecM(bar,split.Q);}}
});
test('analytic continuous minorization is a genuine full-space lower bound and correctly normalized',()=>{
 for(const a of [.2,.95])for(const [lo,hi]of [[-.25,.25],[-2,2],[2.5,3.5]]){const mn=analyticMinor(a,lo,hi);for(let i=0;i<=40;i++)for(let j=0;j<=100;j++){const x=lo+(hi-lo)*i/40,y=-10+j/5;assert.ok(mn.density(y)<=phi(y-a*x)+1e-15);}
  const N=100000,h=28/N;let mass=0;for(let i=0;i<N;i++)mass+=mn.density(-14+(i+.5)*h)*h;close(mass,mn.eps,3e-9);
 }
});
test('exceptional-state counterexample has positive accessibility but not almost-sure accessibility',()=>{
 for(const start of [2,3,10])for(const n of [0,1,2,20,500]){let product=1;for(let j=start;j<start+n;j++)product*=1-1/(j*j);close(escapeSurvival(start,n),product);assert.ok(escapeSurvival(start,n)>=(start-1)/start);}
 assert.equal(escapeSurvival(0,500),0);close(escapeSurvival(2,1000000),.5000004999995,2e-12);
});
test('Gaussian TV matches independent 70-digit density quadrature and handles atoms',()=>{
 const refs=JSON.parse(fs.readFileSync(new URL('../docs/verification/harris-gaussian-references.json',import.meta.url)));for(const r of refs.rows)close(gaussianTV(r.mean,r.variance,0,r.stationaryVariance),Number(r.tv),3e-12);
 assert.equal(gaussianTV(2,0,0,1),1);assert.equal(gaussianTV(2,0,2,0),0);assert.equal(gaussianTV(2,0,3,0),1);close(gaussianTV(3,1,0,1),gaussianTV(0,1,3,1));
});
test('exponential differences, including negative Y, match direct independent integration',()=>{
 for(const lambda of [.3,1,2])for(const t of [0,.3,.999,1,2,6])for(const kind of ['uniform','negative']){
  const lo=kind==='negative'?-1:0,N=120000,h=3/N;let mass=0;for(let j=0;j<N;j++){const y=lo+(j+.5)*h;mass+=Math.exp(-lambda*Math.max(0,t+y))/N;}close(exponentialDifferenceTail(kind,lambda,t),mass,3e-10);
 }
 const lambda=1,mass=exponentialDifferenceTail('negative',lambda,0),tail=exponentialDifferenceTail('negative',lambda,2)/mass;assert.ok(Math.abs(tail-Math.exp(-2))>.01);
});

test('continuous split sampler preserves Gaussian mean, variance and common-part frequency',()=>{
 let seed=128721;const r=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed+.5)/4294967296;};r.normal=()=>Math.sqrt(-2*Math.log(r()))*Math.cos(2*Math.PI*r());
 for(const [a,c]of [[.2,.25],[.95,2]])for(const x of [-c,0,c]){const mn=analyticMinor(a,-c,c),N=20000;let sum=0,squares=0,regen=0;for(let i=0;i<N;i++){const [y,g]=exactHarrisStep(x,mn,r),z=y-a*x;sum+=z;squares+=z*z;if(g)regen++;}assert.ok(Math.abs(sum/N)<8/Math.sqrt(N));assert.ok(Math.abs(squares/N-1)<8*Math.sqrt(2/N));assert.ok(Math.abs(regen-N*mn.eps)<8*Math.sqrt(N*mn.eps*(1-mn.eps)));}
});
