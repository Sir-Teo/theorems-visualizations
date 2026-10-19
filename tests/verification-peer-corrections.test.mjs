import test from 'node:test';
import assert from 'node:assert/strict';
import {heartBeat,MMHG_ML_TO_J} from '../content/physio/ch03.shared.js';
import {lvV} from '../content/mathbio/ch03.shared.js';
import {competitionSystem,overlap} from '../content/ecol/competition-system.shared.js';
const near=(a,b,tol)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('ventricular work sign agrees with pressure times outward flow, filling subtraction and SI units',()=>{
 for(const Ees of[1.5,2.8])for(const R of[.5,1.25,3.1]){
  const b=heartBeat({R,Ees});let signed=0,outflow=0;
  for(let i=1;i<b.t.length;i++){
   signed+=(b.P[i]+b.P[i-1])*(b.V[i]-b.V[i-1])/2;
   outflow+=(b.t[i]-b.t[i-1])*(b.P[i]*(b.Q[i]-b.Qm[i])+b.P[i-1]*(b.Q[i-1]-b.Qm[i-1]))/2;
  }
  assert.ok(signed<0);near(b.work,-signed,1e-9);near(b.work,b.ejectionWork-b.fillingWork,1e-8);
  near(b.work/outflow,1,2e-4);assert.ok(b.ejectionWork>b.fillingWork);
 }
 near(MMHG_ML_TO_J,133.322*1e-6,1e-9);near(7500*MMHG_ML_TO_J*60/60,.999915,1e-5);
});
test('log-coordinate symplectic Euler is area preserving but does not conserve the original LV Hamiltonian',()=>{
 const step=(q,p,h)=>{q+=h*(Math.exp(p)-1);p+=h*(1-Math.exp(q));return[q,p];};
 const q=0,p=Math.log(1.8),h=.08,[Q,P]=step(q,p,h),e=1e-6;
 const qp=step(q+e,p,h),qm=step(q-e,p,h),pp=step(q,p+e,h),pm=step(q,p-e,h);
 const jac=(qp[0]-qm[0])*(pp[1]-pm[1])/(4*e*e)-(pp[0]-pm[0])*(qp[1]-qm[1])/(4*e*e);
 near(jac,1,1e-9);assert.ok(Math.abs(lvV(1,1,Math.exp(P),Math.exp(Q))-lvV(1,1,Math.exp(p),Math.exp(q)))>1e-4);
 const energyError=(dt)=>{let q=0,p=Math.log(1.8),max=0;const e0=lvV(1,1,Math.exp(p),Math.exp(q));for(let t=0;t<60;t+=dt){[q,p]=step(q,p,dt);max=Math.max(max,Math.abs(lvV(1,1,Math.exp(p),Math.exp(q))-e0));}return max;};
 assert.ok(energyError(.02)<energyError(.08)/2);
});
test('renewal finite-mean limit holds in an independently solvable continuous exponential example',()=>{
 // k(a)=lambda exp(-lambda a), g(t)=exp(-c t): renewal density=lambda,
 // hence b(t)=g(t)+lambda integral_0^t g(s)ds; limit integral g / mean(k).
 const lambda=.7,c=1.3;
 const b=t=>Math.exp(-c*t)+lambda*(1-Math.exp(-c*t))/c;
 near(b(40),lambda/c,1e-12);near((1/c)/(1/lambda),lambda/c,1e-12);
 // Infinite mean cannot be silently allowed: density (1+a)^-2 has divergent first moment.
 const truncatedMean=A=>Math.log(1+A)+1/(1+A)-1;
 assert.ok(truncatedMean(1e8)>truncatedMean(1e4)+9);
});
test('equal-width overlap presets are symmetric Gram matrices; arbitrary row normalization is not symmetric',()=>{
 for(const k of['g','l','b'])for(const n of[3,5,9])for(const d of[.8,1.5,3.5]){
  const {M}=competitionSystem(k,n,d),L=Array.from({length:n},()=>Array(n).fill(0));
  // Independent Cholesky criterion, at well-conditioned settings.
  for(let i=0;i<n;i++)for(let j=0;j<=i;j++){near(M[i][j],M[j][i],1e-15);let a=M[i][j];for(let r=0;r<j;r++)a-=L[i][r]*L[j][r];if(i===j){assert.ok(a>0);L[i][j]=Math.sqrt(a);}else L[i][j]=a/L[j][j];}
 }
 // u1=1, u2=2 on a unit interval: dependent Gram PSD, unequal row norms.
 const G=[[1,2],[2,4]],A=G.map((r,i)=>r.map(x=>x/G[i][i]));assert.notEqual(A[0][1],A[1][0]);near(G[0][0]*G[1][1]-G[0][1]**2,0,1e-15);
 for(const [k,u]of[['g',x=>Math.exp(-x*x/2)],['l',x=>Math.exp(-Math.abs(x))],['b',x=>Math.abs(x)<=1?1:0]]){const dx=.0005;let norm=0,inner=0;for(let i=0;i<80000;i++){const x=-20+(i+.5)*dx;norm+=u(x)**2*dx;inner+=u(x)*u(x-1)*dx;}near(inner/norm,overlap(k,1),2e-7);}
});
test('Taylor transformation has constant leading delta variance and a logarithmic b=2 limit',()=>{
 for(const b of[1,1.6,2,2.6])for(const m of[2,20,200]){const a=1.5,g=x=>b===2?Math.log(x):(x**(1-b/2)-1)/(1-b/2),h=m*1e-5;const derivative=(g(m+h)-g(m-h))/(2*h);near(derivative**2*a*m**b,a,1e-8);}
 const b=2-1e-6,m=20;near((m**(1-b/2)-1)/(1-b/2),Math.log(m),3e-6);
});
test('a likelihood ratio need not be monotone even when an upper score cutoff is available',()=>{
 const density=(x,s)=>Math.exp(-x*x/(2*s*s))/(s*Math.sqrt(2*Math.PI)),lr=x=>density(x,2)/density(x,1);
 assert.ok(lr(-3)>1&&lr(3)>1&&lr(0)<1); // unrestricted optimum uses both tails, not one upper interval.
 const expectedLoss=(positive,x)=>positive?.5*density(x,1):.5*density(x,2);
 assert.ok(expectedLoss(true,-3)<expectedLoss(false,-3));assert.ok(expectedLoss(false,0)<expectedLoss(true,0));
});
