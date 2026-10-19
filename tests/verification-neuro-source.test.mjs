import assert from 'node:assert/strict';import test from 'node:test';
import {IZH,izhRun} from '../content/neuro/ch03.shared.js';
function reference(p,T=400,dt=.002){let v=-65,u=p.b*v;const spikes=[];const F=(v,u,I)=>[.04*v*v+5*v+140-u+I,p.a*(p.b*v-u)];for(let j=0;j<=Math.round(T/dt);j++){const t=j*dt;if(v>=30){spikes.push(t);v=p.c;u+=p.d;}if(j===Math.round(T/dt))break;const I=t>=20?10:0,a=F(v,u,I),b=F(v+dt*a[0]/2,u+dt*a[1]/2,I),c=F(v+dt*b[0]/2,u+dt*b[1]/2,I),d=F(v+dt*c[0],u+dt*c[1],I);v+=dt*(a[0]+2*b[0]+2*c[0]+d[0])/6;u+=dt*(a[1]+2*b[1]+2*c[1]+d[1])/6;}return spikes;}
test('Izhikevich Fig2 parameter diagram and reset identities',()=>{
 const expected={RS:[.02,.2,-65,8],IB:[.02,.2,-55,4],CH:[.02,.2,-50,2],FS:[.1,.2,-65,2],LTS:[.02,.25,-65,2]};for(const[key,q]of Object.entries(expected)){const p=IZH[key];assert.deepEqual([p.a,p.b,p.c,p.d],q);const o=izhRun(p,t=>t>=20?10:0,400);assert.equal(o.resets.length,o.spikes.length);for(let j=0;j<o.resets.length;j++){const r=o.resets[j],i=Math.round(r.t/.025);assert.equal(o.v[i],30);assert.equal(r.v,p.c);assert.ok(Math.abs(r.u-o.u[i]-p.d)<1e-12);}}
});
test('split update agrees with independent coupled RK4 on firing counts and early intervals',()=>{
 for(const key of['RS','IB','CH','FS','LTS']){const p=IZH[key],a=izhRun(p,t=>t>=20?10:0,400),b=reference(p);assert.ok(Math.abs(a.spikes.length-b.length)<=1,`${key}: ${a.spikes.length} vs ${b.length}`);assert.ok(Math.abs(a.spikes[0]-b[0])<.08);for(let j=1;j<Math.min(5,a.spikes.length,b.length);j++){const A=a.spikes[j]-a.spikes[j-1],B=b[j]-b[j-1];assert.ok(Math.abs(A-B)/B<.04,`${key} interval ${j}: ${A} vs ${B}`);}}
});
test('Izhikevich integration is finite over all displayed parameter endpoints and zero-current presets',()=>{
 for(const key of['RS','IB','CH','FS','LTS']){const o=izhRun(IZH[key],()=>0,400);assert.equal(o.spikes.length,0);assert.ok(o.v.every(Number.isFinite)&&o.u.every(Number.isFinite));}for(const a of[.01,.12])for(const b of[.15,.3])for(const c of[-70,-45])for(const d of[0,10])for(const I of[0,25]){const o=izhRun({a,b,c,d},t=>t>=20?I:0,120);assert.ok(o.v.every(Number.isFinite)&&o.u.every(Number.isFinite));}
});
import {binom} from '../content/neuro/ch02.shared.js';
test('channel binomial draws preserve binomial mass, including the former erroneous Poisson regime',()=>{
 // Deterministic uniform quadrature tests the distribution rather than the sampler's internal recursion.
 for(const [n,p] of [[25,.47],[30,.35],[60,.5],[500,.02],[500,.98],[18000,.001]]){const N=50000;let sum=0,sq=0;for(let i=0;i<N;i++){const x=binom(n,p,()=> (i+.5)/N);assert.ok(x>=0&&x<=n&&Number.isInteger(x));sum+=x;sq+=x*x;}const mean=sum/N,variance=sq/N-mean*mean;assert.ok(Math.abs(mean-n*p)<.004);assert.ok(Math.abs(variance-n*p*(1-p))<.02,`${n},${p}: var=${variance}`);}
});
import {readFileSync} from 'node:fs';
import {hhRun,hhDeriv,hhRest,phiT,gateInf,csRates,csA,csRest,csEL,csStep,csSpikes} from '../content/neuro/ch02.shared.js';
import {lineHn,hh2F,hh2Sim,FHN,fhnRest,fhnEig,ML_SETS,mlF,mlWinf,mlEquilibria,snicCurrent,mlRate} from '../content/neuro/ch03.shared.js';
const near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('HH firing rates match separate high-accuracy DOP853 solutions and temperature scales gates only',()=>{
 const fixture=JSON.parse(readFileSync(new URL('fixtures/neuro/independent-hh.json',import.meta.url)));
 for(const c of fixture.hh){const r=hhRun(()=>c.I,{T:c.T,tEnd:300,dt:c.T>10?.025:.04}),late=r.spikes.filter(t=>t>200),rate=late.length>1?1000/(late.at(-1)-late.at(-2)):0;assert.equal(r.spikes.length,c.spikes.length);near(rate,c.lateRate,.15);}
 const z=[-35,.3,.5,.4],a=hhDeriv(z,10,1),b=hhDeriv(z,10,phiT(18.5));near(a[0],b[0]);for(let i=1;i<4;i++)near(b[i]/a[i],3.8202161018185845);
});
test('reduced HH is exactly the stated substitution; fitted residuals satisfy independent normal equations',()=>{
 for(const I of[8,15,40])for(const [h0,k] of[[.89,1.1],[.95,1.2]]){const r=hh2Sim(()=>I,h0,k,{tEnd:60});assert.ok(r.V.every(Number.isFinite)&&r.n.every(Number.isFinite));for(const V of[-65,-30,10])for(const n of[.3,.5,.7]){const a=hh2F([V,n],I,h0,k,1),b=hhDeriv([V,gateInf('m',V),h0-k*n,n],I,1);near(a[0],b[0]);near(a[1],b[3]);}}
 const n=[.2,.4,.5,.6,.7],h=[.75,.54,.4,.25,.2],fit=lineHn(n,h),res=n.map((x,i)=>h[i]-fit.h0+fit.k*x);near(res.reduce((a,b)=>a+b),0);near(res.reduce((a,b,i)=>a+b*n[i],0),0);
});
test('FHN Hopf locations and stability agree with exact polynomial Jacobian and Lyapunov signs',()=>{
 for(const eps of[.08,1]){const p={...FHN,eps},v=-Math.sqrt(1-eps*p.b),I=(v+p.a)/p.b-v+v**3/3,e=fhnEig(I,p);near(fhnRest(I,p)[0],v);near(e.tr,0);near(e.det,eps*(1-eps*p.b*p.b));const l1=-1/8+p.b*(1-eps*p.b)/(4*(1-eps*p.b*p.b));assert.equal(l1>0,eps===.08);assert.ok(fhnEig(I-.001,p).tr<0);assert.ok(fhnEig(I+.001,p).tr>0);}
});
test('Morris-Lecar equilibria satisfy original current balance and SNIC fold has zero determinant',()=>{
 for(const p of Object.values(ML_SETS))for(const I of[0,30,60,100,150])for(const e of mlEquilibria(p,I)){const f=mlF(p,e.V,e.w,I);near(f[0],0);near(f[1],0);near(e.w,mlWinf(p,e.V));}
 const p=ML_SETS.snic,I=snicCurrent(p);
 // Independent ternary maximization of the equilibrium current curve, with no analytic slope helper.
 const current=V=>-mlF(p,V,mlWinf(p,V),0)[0]*p.C;let lo=-50,hi=-20;for(let j=0;j<100;j++){const a=(2*lo+hi)/3,b=(lo+2*hi)/3;if(current(a)<current(b))lo=a;else hi=b;}const V=(lo+hi)/2;near(I,current(V),1e-9);const w=mlWinf(p,V),h=1e-4,A=mlF(p,V+h,w,I),B=mlF(p,V-h,w,I),C=mlF(p,V,w+h,I),D=mlF(p,V,w-h,I),det=((A[0]-B[0])*(C[1]-D[1])-(C[0]-D[0])*(A[1]-B[1]))/(4*h*h);near(det,0,1e-8);assert.equal(mlEquilibria(p,I-.1).length,3);assert.equal(mlEquilibria(p,I+.1).length,1);
 const rates=[.1,.4,1].map(d=>mlRate(p,I+d,{T:6000}));assert.ok(rates.every(x=>x>0));const slope=Math.log(rates[2]/rates[0])/Math.log(10);assert.ok(Math.abs(slope-.5)<.05,`slope ${slope}`);
});
test('Connor-Stevens gate equations match the complete author implementation including n time scale',()=>{
 for(const v of[-75,-60,-30,0,30]){const am=.1*(v+29.7)/(-Math.expm1(-(v+29.7)/10)),bm=4*Math.exp(-(v+54.7)/18),an=.01*(v+45.7)/(-Math.expm1(-(v+45.7)/10)),bn=.125*Math.exp(-(v+55.7)/80);near(csRates.m(v)[0],am);near(csRates.m(v)[1],bm);near(csRates.n(v)[0],an);near(csRates.n(v)[1],bn);const expected=Math.pow(.0761*Math.exp((v+94.22)/31.84)/(1+Math.exp((v+1.17)/28.93)),1/3);near(csA.ainf(v),expected);}
 {const y=[-30,.3,.5,.4,.2,.3],q=[...y],h=1e-7;csStep(q,10,h,47.7,csEL(47.7));const [a,b]=csRates.n(y[0]);near((q[3]-y[3])/h,3.8/2*(a*(1-y[3])-b*y[3]),1e-5);}
 for(const g of[0,15,30,47.7]){const z=csRest(g),r=[...z];csStep(r,0,1e-5,g,csEL(g));assert.ok(Math.max(...r.map((x,i)=>Math.abs(x-z[i])))<1e-7);const a=csSpikes(10,g,{tEnd:620,dt:.05}),b=csSpikes(10,g,{tEnd:620,dt:.0125});assert.equal(a.length,b.length);near(a[0],b[0],.01);near(1000/(a.at(-1)-a.at(-2)),1000/(b.at(-1)-b.at(-2)),.05);}
});
import {channelTransition,channelAdvance,gateRates,hhStochastic} from '../content/neuro/ch02.shared.js';
test('frozen-voltage channel transitions agree with independent generator uniformization and binomial equilibrium',()=>{
 for(const kind of['K','Na'])for(const V of[-80,-65,-30,20])for(const dt of[.001,.01,.1]){const P=channelTransition(kind,V,dt),n=P.length,Q=Array.from({length:n},()=>Array(n).fill(0));
  for(let i=0;i<n;i++){const gate=kind==='K'?'n':'m',count=kind==='K'?4:3,k=kind==='K'?i:i%4,[a,b]=gateRates(gate,V);if(k<count)Q[i][i+1]=(count-k)*a;if(k>0)Q[i][i-1]=k*b;if(kind==='Na'){const [ah,bh]=gateRates('h',V);Q[i][i>=4?i-4:i+4]=i>=4?bh:ah;}Q[i][i]=-Q[i].reduce((a,b)=>a+b);}
  const rate=Math.max(...Q.map((r,i)=>-r[i])),R=Q.map((r,i)=>r.map((x,j)=>(i===j?1:0)+x/rate));
  for(let i=0;i<n;i++){let row=Array(n).fill(0);row[i]=1;let prob=Math.exp(-rate*dt),sum=row.map(x=>x*prob);for(let k=1;k<140;k++){row=Array.from({length:n},(_,j)=>row.reduce((a,x,l)=>a+x*R[l][j],0));prob*=rate*dt/k;row.forEach((x,j)=>sum[j]+=x*prob);}sum.forEach((x,j)=>near(P[i][j],x,1e-12));near(P[i].reduce((a,b)=>a+b),1);}
 }
});
test('multinomial channel update conserves every channel; displayed patch extremes remain finite',()=>{
 let state=17;const rng=()=>((state=Math.imul(1664525,state)+1013904223>>>0)/2**32);
 for(const kind of['K','Na']){const counts=kind==='K'?[4,7,1,0,6]:[9,1,0,0,48,2,0,0],P=channelTransition(kind,-30,.01);for(let n=0;n<50;n++){const a=channelAdvance(counts,P,rng);assert.equal(a.reduce((a,b)=>a+b),counts.reduce((a,b)=>a+b));assert.ok(a.every(x=>x>=0&&Number.isInteger(x)));}}
 for(const area of[1,6,300])for(const I of[0,6]){const r=hhStochastic(()=>I,{NNa:Math.round(60*area),NK:Math.round(18*area),tEnd:20,dt:.01,rng});assert.ok(r.V.every(Number.isFinite));assert.equal(r.finalNa.reduce((a,b)=>a+b),60*area);assert.equal(r.finalK.reduce((a,b)=>a+b),18*area);}
});
import {BURST,burstF,burstOrbit,burstFastEq} from '../content/neuro/ch03.shared.js';
test('illustrative bursting agrees with a separately implemented DOP853 reference and frozen current balance',()=>{
 const ref=JSON.parse(readFileSync(new URL('fixtures/neuro/independent-burst.json',import.meta.url)));assert.deepEqual(BURST,ref.parameters);const r=burstOrbit(BURST,20000,{dt:.25,every:1}),sp=[];for(let i=1;i<r.length;i++)if(r[i-1][0]<0&&r[i][0]>=0)sp.push((i-1)*.25+.25*(-r[i-1][0])/(r[i][0]-r[i-1][0]));assert.equal(sp.length,ref.spikes.length);sp.forEach((t,i)=>near(t,ref.spikes[i],.025));
 for(const z of[.3,.5,.7,.9,1.1])for(const e of burstFastEq(BURST,z)){const V=e.V,w=.5*(1+Math.tanh((V-BURST.V3)/BURST.V4)),a=burstF(BURST,V,w,z),m=.5*(1+Math.tanh((V-BURST.V1)/BURST.V2)),ica=BURST.gCa*m*(V-BURST.VCa);near(a[0],0);near(a[1],0);near(a[2],BURST.eps*(-BURST.mu*ica-z));}
});
