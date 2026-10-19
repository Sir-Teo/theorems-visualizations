import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serviceEntryQueueStep, serviceEntryQueueMean } from '../content/prob/ch05-a.shared.js';
import { bookSplitGrid, gridAR, matMulS, vecM, stationary, PHI, tvNormal } from '../content/prob/ch05-z.shared.js';
import chapterA from '../content/prob/ch05-a.js';
import chapterM3 from '../content/prob/ch05-m3.js';
import chapterZ from '../content/prob/ch05-z.js';
import chapterZ2 from '../content/prob/ch05-z2.js';
import * as M from '../assets/js/viz/math.js';
const close=(a,b,tol=2e-12)=>assert.ok(Math.abs(a-b)<tol,`${a} versus ${b}`);
const matrixClose=(A,B)=>A.forEach((row,i)=>row.forEach((x,j)=>close(x,B[i][j])));

test('service-entry queue removes a waiting customer after arrivals, including at zero',()=>{
  // Durrett's Figure 5.2: increments +1,-1,-1 produce waiting counts 0,1,0,0.
  let x=0; const path=[x];for(const arrivals of [2,0,0])path.push(x=serviceEntryQueueStep(x,arrivals));
  assert.deepEqual(path,[0,1,0,0]);
  assert.equal(serviceEntryQueueStep(0,1),0);
  assert.equal(serviceEntryQueueStep(0,0),0);
});

test('M/M/1 service-entry queue agrees with its independently known stationary probabilities',()=>{
  // From the geometric M/M/1 departure law: X=(D-1)^+,
  // P(X=0)=1-rho² and P(X=k)=(1-rho)rho^(k+1), k>=1.
  for(const rho of [.2,.5,.8]){
    const K=140, pmf=Array.from({length:K},(_,k)=>k===0?1-rho*rho:(1-rho)*rho**(k+1));
    close(pmf.reduce((s,p)=>s+p,0),1,1e-12);
    const incoming=Array(K).fill(0), q=rho/(1+rho);
    for(let x=0;x<K;x++)for(let a=0;a<300;a++){const y=serviceEntryQueueStep(x,a);if(y<K)incoming[y]+=pmf[x]*(1-q)*q**a;}
    incoming.forEach((p,k)=>close(p,pmf[k],1e-12));
    close(serviceEntryQueueMean(rho,1),pmf.reduce((s,p,k)=>s+k*p,0),1e-10);
  }
});

test('Durrett split kernels have the book atom row and both identities',()=>{
  const g={K:2,xs:[-.5,.5],P:[[.7,.3],[.4,.6]]},sp=bookSplitGrid(g,1);
  close(sp.eps,.7);
  matrixClose(sp.Pb,[[.3,0,.7],[0,.3,.7],[6/35,9/70,.7]]);
  matrixClose(matMulS(sp.V,sp.Pb),sp.Pb);
  matrixClose(matMulS(sp.Pb,sp.V),sp.P);
  // sigma-finite transport: bar pi=pi Q, recovered by expanding alpha.
  const pi=[4/7,3/7,0],pb=vecM(pi,sp.Pb);
  matrixClose([pb],[[6/35,9/70,.7]]);
  matrixClose([vecM(pb,sp.Pb)],[pb]);matrixClose([vecM(pb,sp.V)],[pi]);
  close(pb[2],sp.eps);
  assert.ok(pb[0]+pb[1]<.31,'discarding alpha loses most of the stationary mass');
});

test('split construction includes epsilon=1 without residual division by zero',()=>{
  const sp=bookSplitGrid({K:2,xs:[0,1],P:[[.25,.75],[.25,.75]]},2);
  close(sp.eps,1);
  for(const matrix of [sp.P,sp.Pb,sp.V])for(const row of matrix){close(row.reduce((a,b)=>a+b,0),1);assert.ok(row.every(x=>Number.isFinite(x)&&x>=0));}
  matrixClose(matMulS(sp.Pb,sp.V),sp.P);
});

test('finite Gaussian model transfers all bounded test functions at equal times',()=>{
  for(const a of [.2,.7,.9]){
    const g=gridAR(a,15,4),sp=bookSplitGrid(g,1),f=[...g.xs.map(x=>Math.cos(2*x)),0],fb=sp.V.map(row=>row.reduce((s,p,i)=>s+p*f[i],0));
    let original=Array(16).fill(0),split=Array(16).fill(0);original[12]=split[12]=1;
    for(let n=0;n<12;n++){
      close(original.reduce((s,p,i)=>s+p*f[i],0),split.reduce((s,p,i)=>s+p*fb[i],0));
      original=vecM(original,sp.P);split=vecM(split,sp.Pb);
    }
    const pi=[...stationary(g.P,6000),0],pb=vecM(pi,sp.Pb);
    matrixClose([vecM(pb,sp.Pb)],[pb]);matrixClose([vecM(pb,sp.V)],[pi]);
  }
});

test('tail triviality and cycle-condition wording retain genuine counterexamples',()=>{
  // Deterministic two-cycle: at fixed start the path space is a singleton,
  // hence every sigma-field is trivial despite period 2.
  const fixed=[1,0],random=[.5,.5];
  close(fixed[0]*(1-fixed[0]),0);close(random[0]*(1-random[0]),.25);
  assert.match(chapterZ.items.find(i=>i.num==='5.7.3').statement,/initial distribution is concentrated/);
  // Biased nearest-neighbour walk: counting measure is stationary but not
  // reversible; a reversible exponential measure still exists.
  const p=.6,q=.4;close(p+q,1);assert.notEqual(p,q);close((p/q)*q,p);
  assert.match(chapterM3.items.find(i=>i.num==='5.5.6').statement,/existence of a reversible measure/);
  // Durrett 5.8.7 exceptional integer path escapes with probability 1/2.
  let escape=1;for(let x=2;x<=10000;x++)escape*=1-1/(x*x);
  close(escape,(10001)/(20000),1e-12);
  assert.match(chapterZ2.items.find(i=>i.num==='5.8.12').statement,/satisfying.*P_x\(R<\\infty\)=1/s);
});

test('normal total variation agrees with the analytic equal-variance formula',()=>{
  for(const delta of [.2,1,5])close(tvNormal(delta,1,0,1),2*PHI(delta/2)-1,2e-6);
});

test('continuous monotone-class approximations are honest lower envelopes',()=>{
  // Execute the actual diagram and inspect the lower-step heights against
  // independently evaluated target values, including every cell endpoint.
  for(const target of ['sqrt','sin'])for(let level=0;level<=7;level++){
    const boxes=[],controls=[],render=[];
    const stage=new Proxy({}, {get:(_,key)=>key==='rect'?((...args)=>boxes.push(args)):(()=>{})});
    const v={M,select(label,options,value){const ctl={value:label==='target $f$'?target:value,el:{}};controls.push(ctl);return ctl;},slider(){return {value:level,el:{}};},stage:()=>stage,render:fn=>render.push(fn),readout:()=>{}};
    chapterA.items.find(i=>i.num==='5.2.2').viz(v);render[0]();
    const f=target==='sqrt'?Math.sqrt:x=>(1+Math.sin(2*Math.PI*x))/2;
    for(const [a,,b,height]of boxes)for(let k=0;k<=100;k++)assert.ok(height<=f(a+(b-a)*k/100)+1e-14);
  }
});

test('regularized one-dimensional recurrence integrals agree with the exact full-period resolvent',async()=>{
 const { shellIntegral }=await import('../content/prob/ch05-m.shared.js');
 for(const p of [.5,.6])for(const r of [.9,.99,.9999]){
  const value=shellIntegral([[1,0,0,p],[-1,0,0,1-p]],1,r,{rmin:1e-10,rmax:Math.PI,nr:2000}).total;
  close(value,2*Math.PI/Math.sqrt(1-4*p*(1-p)*r*r),.0002);
 }
});

test('growth between finite regularization cutoffs does not classify a drifted walk as recurrent',async()=>{
 const {default:chapter}=await import('../content/prob/ch05-m2.js');
 for(const num of ['5.4.10','5.4.11']){
  let render,readout;
  const stage=new Proxy({}, {get:()=>()=>{}});
  const v={stage:()=>stage,slider:()=>({value:.019,el:{}}),select:()=>({value:'bias1',el:{}}),button:()=>{},rng:M.rng,legend:()=>{},render:fn=>render=fn,readout:fn=>readout=fn};
  chapter.items.find(i=>i.num===num).viz(v);render();
  assert.match(readout(),/transient/);assert.doesNotMatch(readout(),/infinite \(recurrent\)/);
 }
});

test('critical geometric branching survival agrees with its exact rational solution',async()=>{
 const {offspringLaw,survivalSeq}=await import('../content/prob/ch04-m.shared.js');
 const survival=survivalSeq(offspringLaw('geom',1),1000);
 for(const n of [1,5,20,100,1000])close(survival[n],1/(n+1),1e-10);
});
