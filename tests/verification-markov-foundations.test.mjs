import test from 'node:test';import assert from 'node:assert/strict';
import {normalizedTransitionWeights,transitionObservations,ehrenfestLaw,queueStartStep,queueReferences,dyadicApproximation,targetRange,simpleReflectionLaw,finiteReturnProbability} from '../content/prob/ch05-foundations.shared.js';
import {binomPmf} from '../content/prob/ch03.shared.js';
import {classes,chain5,rhoTo} from '../content/prob/ch05-a.shared.js';
const near=(a,b,tol=2e-12)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('transition weights and observations use departures in N steps, not N visits; zero rows explicit',()=>{
 assert.deepEqual(normalizedTransitionWeights([[0,0],[0,7]]),[[.5,.5],[0,1]]);const q=transitionObservations([0,1,1,2,2,2],5,4);assert.deepEqual(q.departures,[1,2,2,0]);assert.deepEqual(q.counts,[[0,1,0,0],[0,1,1,0],[0,0,2,0],[0,0,0,0]]);
});
test('Ehrenfest exact finite law: stationarity, period-two parity and exact mean at all offered sizes',()=>{
 for(let r=2;r<=60;r++)for(const x0 of [r,Math.round(r/2)])for(const n of [0,1,2,11,300]){
  const q=ehrenfestLaw(r,x0,n);near(q.reduce((a,b)=>a+b,0),1);near(q.reduce((s,p,k)=>s+p*k,0),r/2+(1-2/r)**n*(x0-r/2),2e-11);q.forEach((p,k)=>{if((k-x0-n)%2)assert.equal(p,0);});
 }
 for(const r of [2,3,20,60]){const pi=binomPmf(r,.5);for(let k=0;k<r;k++)near(pi[k]*(r-k)/r,pi[k+1]*(k+1)/r);const q=ehrenfestLaw(r,r,300);near(.5*q.reduce((s,p,k)=>s+Math.abs(p-pi[k]),0),.5,3e-10);}
});
test('Wright–Fisher absorption probabilities satisfy exact harmonic equations and finite-chain absorption',()=>{
 for(const N of [6,30,100])for(let k=1;k<N;k++){
  const row=binomPmf(N,k/N);near(row.reduce((a,b)=>a+b,0),1);near(row.reduce((s,p,j)=>s+p*j/N,0),k/N);assert.ok(row[0]+row[N]>0);
 }
});
test('service-start queue differs at empty state from departure embedding; stationary reference checked independently',()=>{
 assert.equal(queueStartStep(0,0),0);assert.equal(queueStartStep(0,1),0);assert.equal(queueStartStep(0,2),1);assert.equal(queueStartStep(3,2),4);
 for(const rho of [.2,.5,.8])for(const kind of ['det','exp']){
  const q=queueReferences(rho,kind),K=500,a=[];if(kind==='det'){a[0]=Math.exp(-rho);for(let k=1;k<=K;k++)a[k]=a[k-1]*rho/k;}else for(let k=0;k<=K;k++)a[k]=rho**k/(1+rho)**(k+1);
  near(q.empty,(1-rho)/a[0]);
  // Independently solve the triangular stationary equations given in Durrett Example 5.5.14.
  const pi=[q.empty];for(let j=0;j<8;j++){let sum=0;for(let i=0;i<=j;i++)sum+=pi[i]*a[j+1-i];pi.push((pi[j]-sum)/a[0]);}assert.ok(pi.every(p=>p>=0&&p<=1));
  // Independently differentiate the stationary generating function near 1.
  const G=z=>(1-rho)*(z-1)/(z-(kind==='det'?Math.exp(rho*(z-1)):1/(1+rho*(1-z))));
  const e=1e-4,der=(3-4*G(1-e)+G(1-2*e))/(2*e);near(der,q.mean,kind==='exp'?4e-6:2e-6);
  if(kind==='exp'){near(q.mean,rho*rho/(1-rho));near(q.empty,1-rho*rho);}
 }
});
test('dyadic monotone approximants use analytic infima/suprema and converge at every dyadic indicator boundary',()=>{
 const targets={sqrt:Math.sqrt,sin:x=>(1+Math.sin(2*Math.PI*x))/2,ind:x=>+(x>=3/8&&x<13/16)};
 for(const [key,f]of Object.entries(targets))for(let n=0;n<=7;n++){
  const q=dyadicApproximation(key,n),m=2**n;for(let k=0;k<m;k++)for(const x of [k/m,(k+.2)/m,(k+.7)/m,(k+.999999)/m]){
   assert.ok(q.values[k]<=f(x)+1e-14);assert.ok(f(x)-q.values[k]<=q.error+1e-14);near(q.coefficients.reduce((s,c,j)=>s+(x<(j+1)/m?c:0),0),q.values[k]);
   if(n<7)assert.ok(dyadicApproximation(key,n+1).values[Math.floor(x*2*m)]>=q.values[k]-1e-14);
  }
 }
 near(targetRange('sin',.6,.8)[0],0);assert.equal(dyadicApproximation('ind',4).error,0);for(const x of [3/8,13/16])assert.equal(dyadicApproximation('ind',4).values[Math.floor(x*16)],targets.ind(x));
});
test('simple-walk reflection identity: full enumeration includes strict-tail atom correction',()=>{
 for(let n=1;n<=12;n++)for(const a of [.2,1,2.5,4]){
  let hit=0,end=0,strict=0;const q=simpleReflectionLaw(n,a);for(let mask=0;mask<2**n;mask++){let s=0,m=0;for(let j=0;j<n;j++){s+=(mask&(1<<j))?1:-1;m=Math.max(s,m);}hit+=m>=a;end+=s>=q.h;strict+=s>q.h;}
  near(q.ge,end/2**n);near(q.gt,strict/2**n);near(q.max,hit/2**n);assert.ok(q.max<=2*q.ge+1e-14);
 }
 const q=simpleReflectionLaw(10,2);assert.ok(q.max<2*q.ge); // no overshoot, but an endpoint atom remains.
});
test('finite return probabilities count first returns; full vs censored event and graph singleton convention',()=>{
 const P=[[.25,.75],[0,1]];near(finiteReturnProbability(P,0,1).returned,.25);near(finiteReturnProbability(P,0,300).returned,.25);
 const Q=[[0,1],[.5,.5]];near(finiteReturnProbability(Q,0,1).returned,0);near(finiteReturnProbability(Q,0,2).returned,.5);near(finiteReturnProbability(Q,0,3).returned,.75);
 for(const e of [0,.01,.15,.5])for(let y=0;y<5;y++){const R=chain5(e),q=finiteReturnProbability(R,y,300),rho=rhoTo(R,y)[y];near(q.returned+q.survival,1);assert.ok(q.returned<=rho+1e-12);if(e===0||y>=3)near(rho,1);else assert.ok(rho<1);}
 const C=classes([[0,1,0],[0,1,0],[0,0,1]]);assert.deepEqual(C.list,[[0],[1],[2]]);assert.deepEqual(C.closed,[false,true,true]);near(rhoTo([[0,1],[0,1]],0)[0],0);
});
test('non-pi monotone-class counterexample: exact projection includes its negative tail',async()=>{
 const M=await import('../assets/js/viz/math.js'),weights=[.3,.3,.3,.1],basis=[[1,1,1,1],[1,1,0,0],[0,1,1,0]],target=[0,1,0,0],A=weights.map((w,i)=>basis.map(b=>Math.sqrt(w)*b[i])),b=weights.map((w,i)=>Math.sqrt(w)*target[i]),co=M.lstsq(A,b),proj=weights.map((_,i)=>basis.reduce((s,b,k)=>s+co[k]*b[i],0));
 [1/6,5/6,1/6,-.5].forEach((x,i)=>near(proj[i],x));near(Math.sqrt(weights.reduce((s,w,i)=>s+w*(target[i]-proj[i])**2,0)),1/Math.sqrt(20));
});
