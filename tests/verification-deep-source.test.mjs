import test from 'node:test';
import assert from 'node:assert/strict';
import {randomDeep,scaleReluRun} from '../content/deep/ch05.shared.js';
test('ReLU homogeneity optimization agrees with independent weight resimulation, both directions',()=>{
 for(const seed of [1,27]){
  const opts={N:17,L:8,act:'relu',seed};const base=randomDeep({...opts,cw:2});
  for(const cw of [.3,1,1.5,2,4]){
   const scaled=scaleReluRun(base,cw),direct=randomDeep({...opts,cw});
   for(const key of ['std','grad'])for(let l=0;l<=opts.L;l++)assert.ok(Math.abs(scaled[key][l]-direct[key][l])<=2e-12*Math.max(1e-15,direct[key][l]),`${key}, variance ${cw}, layer ${l}`);
  }
 }
 assert.throws(()=>scaleReluRun({std:[1],grad:[1]},0),RangeError);
});

const {makeScaleInvariantLogistic}=await import('../content/deep/normalization-source.shared.js');
test('ideal BN loss and gradient satisfy scale symmetry, finite differences and the norm identity',()=>{
 const X=[[-1,0],[1,.3],[.2,1],[.7,-1],[-.9,-.8]],Y=[-1,1,1,1,-1],F=makeScaleInvariantLogistic(X,Y);
 const w=[.3,-.7],base=F(w);
 for(const scale of [.01,.2,1,7,100]){
  const q=F(w.map(x=>scale*x));assert.ok(Math.abs(q.L-base.L)<1e-12);
  for(let j=0;j<2;j++)assert.ok(Math.abs(q.g[j]*scale-base.g[j])<1e-11);
 }
 for(let j=0;j<2;j++){const a=w.slice(),b=w.slice();a[j]+=1e-6;b[j]-=1e-6;assert.ok(Math.abs((F(a).L-F(b).L)/2e-6-base.g[j])<1e-8);}
 assert.ok(Math.abs(w[0]*base.g[0]+w[1]*base.g[1])<1e-12);
 const eta=.3,next=w.map((x,j)=>x-eta*base.g[j]);
 assert.ok(Math.abs(next.reduce((s,x)=>s+x*x,0)-w.reduce((s,x)=>s+x*x,0)-eta**2*base.g.reduce((s,x)=>s+x*x,0))<1e-12);
 assert.ok(Number.isNaN(F([0,0]).L));
});

const {adaptiveQuadratic}=await import('../content/deep/adaptive-source.shared.js');
test('adaptive optimizer first updates agree with source equations and stationary moment corrections',()=>{
 const eps=1e-8;
 for(const a of [1,50,400])for(const eta of [.01,.1,.5]){
  const expected={ada:[eta*a/(a+eps),eta/(1+eps)],rms:[eta*a/(Math.sqrt(.1)*a+eps),eta/(Math.sqrt(.1)+eps)],adam:[eta*a/(a+eps),eta/(1+eps)]};
  for(const kind of Object.keys(expected)){
   const r=adaptiveQuadratic(a,eta,kind,true,1);
   for(let j=0;j<2;j++)assert.ok(Math.abs(1-r.pts[1][j]-expected[kind][j])<1e-14);
  }
  const no=adaptiveQuadratic(a,eta,'adam',false,1);
  for(let j=0;j<2;j++){const g=j===0?a:1,want=eta*.1*g/(Math.sqrt(.001)*g+eps);assert.ok(Math.abs(1-no.pts[1][j]-want)<1e-14);}
 }
});

const {readFileSync}=await import('node:fs');
const oracle=JSON.parse(readFileSync(new URL('./fixtures/deep-source-oracles.json',import.meta.url)));
const {makeResidualField,residualEuler,residualRK4}=await import('../content/deep/residual-ode-source.shared.js');
test('all optimizer trajectories agree with independent 60-digit Decimal recurrences',()=>{
 for(const c of oracle.adaptiveQuadratic){
  const r=adaptiveQuadratic(c.curvature,c.eta,c.kind==='adamUncorrected'?'adam':c.kind,c.kind!=='adamUncorrected');
  for(const q of c.records)for(let j=0;j<2;j++)assert.ok(Math.abs(r.pts[q.step][j]-q.point[j])<2e-11,`${c.kind},a=${c.curvature},step=${q.step},coordinate=${j}`);
 }
});
test('RK4 reference agrees with adaptive DOP853 and Euler has first-order refinement',()=>{
 const f=makeResidualField();
 for(const c of oracle.residualODE){
  const ref=residualRK4(f,c.point,c.amplitude,400),fine=residualRK4(f,c.point,c.amplitude,800);
  assert.ok(Math.hypot(...ref.map((x,j)=>x-c.endpoint[j]))<2e-9,'400-step RK4 agrees with independent adaptive solver');
  assert.ok(Math.hypot(...ref.map((x,j)=>x-fine[j]))<2e-9,'reference resolves step refinement');
  const errors=[64,128,256].map(n=>Math.hypot(...residualEuler(f,c.point,n,c.amplitude).map((x,j)=>x-c.endpoint[j])));
  for(let j=1;j<errors.length;j++)assert.ok(errors[j-1]/errors[j]>1.85&&errors[j-1]/errors[j]<2.15,`first-order ratio ${errors[j-1]/errors[j]}`);
 }
});
