import test from 'node:test';import assert from 'node:assert/strict';
import {ramseyGrowthAudit as ramsey,diamondGrowthAudit as diamond} from '../content/macro/source-audit-optimal-growth.js';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('RCK steady state, golden rule and linearized saddle follow the planner equations for all control corners',()=>{
 for(const rho of[.005,.03,.1])for(const theta of[.5,1,5])for(const alpha of[.2,.33,.5]){
  const m=ramsey({rho,theta,alpha});near(alpha*m.ks**(alpha-1),.05+rho);near(alpha*m.kg**(alpha-1),.05);assert.ok(m.ks<m.kg);near(m.saddle(m.ks),m.cs,0);near(m.F(m.ks,m.cs)[0],0);near(m.F(m.ks,m.cs)[1],0);
  // Direct physical-unit Jacobian: [[rho,-1],[c*f''/theta,0]].
  const q=m.cs*alpha*(alpha-1)*m.ks**(alpha-2)/theta,other=rho-m.lambda;assert.ok(q<0&&m.lambda<0&&other>0);near(m.lambda*other,q);near(m.slope,rho-m.lambda);
  for(const x of[.1,.6,1,1.8]){const k=x*m.ks,c=.8*m.cs,[dk,dc]=m.F(k,c);near(dk,k**alpha-.05*k-c);near(dc/c,(alpha*k**(alpha-1)-.05-rho)/theta);}
 }
});
test('Backward stable arm and time interpolation recover independently derived exact constant-saving optimal paths',()=>{
 // If rho=delta*(alpha*theta-1)>0, c=(1-1/theta)*A*k^alpha
 // solves BOTH planner ODEs. z=k^(1-alpha) then obeys a linear ODE.
 for(const[alpha,theta]of[[.3,4],[.4,3],[.5,3],[.5,5],[.25,5]]){
  const delta=.05,rho=delta*(alpha*theta-1),m=ramsey({alpha,theta,rho});
  for(const k0 of[m.domain[0],.3*m.ks,.999*m.ks,1.001*m.ks,1.5*m.ks,m.domain[1]]){
   near(m.saddle(k0),(1-1/theta)*k0**alpha,2e-8);
   for(const[t,k,c]of m.stablePath(k0,240,2)){
    const z=1/(theta*delta)+(k0**(1-alpha)-1/(theta*delta))*Math.exp(-(1-alpha)*delta*t),K=z**(1/(1-alpha));near(k,K,3e-8);near(c,(1-1/theta)*K**alpha,3e-8);
   }
  }
 }
});
test('Stable interpolation satisfies both Euler/resource equations; off-arm paths match independent midpoint integration and stop explicitly',()=>{
 for(const rho of[.005,.03,.1])for(const theta of[.5,5])for(const alpha of[.2,.5]){
  const m=ramsey({rho,theta,alpha});
  for(const x of[.06,.2,.7,.999,1.001,1.4,1.9*m.kg/m.ks]){
   const k=x*m.ks,c=m.saddle(k),h=1e-4*k,dcdk=(m.saddle(k+h)-m.saddle(k-h))/(2*h),[dk,dc]=m.F(k,c);near(dcdk*dk/m.cs,dc/m.cs,2e-7);
  }
  for(const k0 of[.5*m.ks,1.6*m.ks]){
   const points=m.stablePath(k0,120,.5);near(points[0][1],k0);for(let i=1;i<points.length;i++){assert.ok(points[i].slice(1).every(v=>v>0&&Number.isFinite(v)));assert.ok(Math.abs(points[i][1]/m.ks-1)<=Math.abs(points[i-1][1]/m.ks-1)+1e-12);}
  }
 }
 for(const alpha of[.2,.33,.5])for(const fraction of[.8,1.15]){
  const m=ramsey({alpha}),k0=.7*m.ks,c0=fraction*m.saddle(k0),p=m.trajectory(k0,c0,5,.5,{cmax:20*m.cs});let k=k0,c=c0;const dt=.0005,steps=10000;
  for(let i=0;i<steps;i++){const a=k**alpha-.05*k-c,b=c*(alpha*k**(alpha-1)-.08)/2,K=k+a*dt/2,C=c+b*dt/2;k+=dt*(K**alpha-.05*K-C);c+=dt*C*(alpha*K**(alpha-1)-.08)/2;}
  assert.equal(p.status,'horizon');near(p.pts.at(-1)[1],k,2e-8);near(p.pts.at(-1)[2],c,2e-8);
 }
 const m=ramsey(),cap=1.3*m.cs,high=m.trajectory(.2*m.ks,cap*.98,120,.5,{cmax:cap}),low=m.trajectory(.5*m.ks,.1*m.cs,120,.5,{kmax:1.2*m.ks,cmax:cap});
 assert.notEqual(high.status,'horizon');assert.equal(low.status,'phase-window boundary');for(const result of[high,low])for(const p of result.pts)assert.ok(p.every(Number.isFinite)&&p[1]>0&&p[2]>0);
 assert.ok(low.pts.at(-1)[1]<=1.2*m.ks*(1+1e-12));
});
test('Full-depreciation log OLG satisfies household budgets, exact global convergence and a feasible overaccumulation resource improvement',()=>{
 for(const alpha of[.1,.25,.5,.6])for(const beta of[.2,.9,3])for(const n of[0,.2,.8]){
  const m=diamond(alpha,beta,n);near(m.map(m.ks),m.ks);near(alpha*m.kg**(alpha-1),1+n);near(m.R/(1+n),alpha/(m.savingShare*(1-alpha)));
  assert.equal(m.ks>m.kg,m.savingShare*(1-alpha)>alpha);
  for(const k0 of[1e-6*m.ks,.3*m.ks,2*m.ks,1e3*m.ks]){
   let k=k0;for(let t=1;t<=30;t++){const w=(1-alpha)*k**alpha,s=m.savingShare*w,K=m.map(k),R=alpha*K**(alpha-1),c1=w-s,c2=R*s;near(s,(1+n)*K);near(1/c1,beta*R/c2);assert.ok(c1>0&&c2>0);k=K;near(k,m.iterate(k0,t));}
   assert.ok(Math.abs(k/m.ks-1)<.001);
  }
  near(m.c,m.ks**alpha-(1+n)*m.ks);
  if(m.cut>0){assert.ok(m.reduced>m.kg&&m.reduced<m.ks&&m.initialGain>0&&m.laterGain>0);near(m.initialGain,(1+n)*(m.ks-m.reduced));near(m.laterGain,m.reduced**alpha-m.ks**alpha+(1+n)*m.cut);
   // Divide each date's resource gain equally per young-worker unit:
   // young receive gain/2, each old receives (1+n)*gain/2. Both are
   // positive for every affected cohort, so their log utility increases.
   for(const gain of[m.initialGain,m.laterGain]){const young=gain/2,old=(1+n)*gain/2;near(young+old/(1+n),gain);assert.ok(young>0&&old>0);}
  }else{near(m.initialGain,0);near(m.laterGain,0);}
 }
});
