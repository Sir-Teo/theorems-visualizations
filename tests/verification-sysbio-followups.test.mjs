import test from 'node:test';import assert from 'node:assert/strict';
import {toggleRoots,integrate,rep} from '../content/sysbio/ch04.shared.js';
const near=(x,y,t=1e-8)=>assert.ok(Math.abs(x-y)<t,`${x} != ${y}`);
test('toggle equilibria agree with analytic symmetric beta=gamma=2 solutions',()=>{
 for(const a of [1,1.9,2.1,3,10,100,300]){const roots=toggleRoots(a,a,2,2),expected=a>2?3:1;assert.equal(roots.length,expected);for(const r of roots){near(r.u*(1+r.v*r.v),a,1e-7);near(r.v*(1+r.u*r.u),a,1e-7);}if(a>2){const d=Math.sqrt(a*a-4),lo=(a-d)/2,hi=(a+d)/2;near(roots[0].u,hi);near(roots[0].v,lo);near(roots[2].u,lo);near(roots[2].v,hi);assert.deepEqual(roots.map(r=>r.stable),[true,false,true]);}}
});
test('noncooperative loop is monostable; actual paper asymmetric parameters are bistable',()=>{
 for(const b of [.5,1,2])for(const g of [.5,1,2])if(b*g<=1)for(const a1 of [1,10,300])for(const a2 of [1,10,300])assert.equal(toggleRoots(a1,a2,b,g).length,1);
 const r=toggleRoots(156.25,15.6,2.5,1);assert.equal(r.length,3);assert.deepEqual(r.map(q=>q.stable),[true,false,true]);
});
test('transient inducer moves a symmetric circuit into the opposite basin and memory persists',()=>{
 const roots=toggleRoots(10,10,2,2),high=roots[0];
 const step=(z,sg,T,n)=>integrate(y=>[10*rep(y[1]/(sg<0?11:1),2)-y[0],10*rep(y[0]/(sg>0?11:1),2)-y[1]],z,T,n).at(-1).slice(1);
 const low=step(step([high.u,high.v],1,20,800),0,40,1600);near(low[0],roots[2].u,1e-6);near(low[1],roots[2].v,1e-6);
 const back=step(step(low,-1,20,800),0,40,1600);near(back[0],high.u,1e-6);near(back[1],high.v,1e-6);
});
import {fflSim,crossAfter,hillAct} from '../content/sysbio/ch03.shared.js';
test('arabinose comparison has the exact intermediate relaxation and asymmetric step responses',()=>{
 for(const ay of [.3,1,3])for(const activity of [.3,1])for(const K of [.1,.3,.5]){
  const p={sxy:1,syz:1,sxz:1,lg:'AND',Kxy:.1,Kyz:K/activity,Kxz:.1,n:6,by:ay,ay,bz:4,az:4},dt=.002;
  const up=fflSim(p,t=>t>=1?1:0,14,dt),down=fflSim(p,t=>t<1?1:0,14,dt),ref=fflSim({...p,Kyz:1e-6},t=>t>=1?1:0,14,dt),f=hillAct(1,.1,6);
  // RK4 straddles the input discontinuity, so permit one time step of error.
  for(const j of [1000,2000,5000])near(up.Y[j],f*(1-Math.exp(-ay*(up.t[j]-1))),ay*dt);
  const z0=down.Z[0];for(const j of [1000,2000])near(down.Z[j]/z0,Math.exp(-4*(down.t[j]-1)),4*dt);
  if(K/activity<.9){assert.ok(crossAfter(up.t,up.Z,.5,1)>=crossAfter(ref.t,ref.Z,.5,1));}
 }
});
import {temporalProgram} from '../content/sysbio/ch03.shared.js';
test('identical SIM output kinetics preserve threshold ordering even for fast inputs',()=>{
 for(const ax of [.1,.4,20])for(const spacing of [1.1,1.8,2.6])for(const duration of [3,8,14]){
  const Kx=Array.from({length:4},(_,i)=>.12*spacing**i),r=temporalProgram({Kx,ax,duration,maximum:2,T:24});
  for(let i=0;i<r.t.length;i++)for(let j=1;j<4;j++)assert.ok(r.Z[j-1][i]>=r.Z[j][i]-1e-14);
  // Exact regulator solution is independent of the Euler implementation.
  for(const t of [2,4,12,20]){const j=Math.round(t/.01),top=2*(1-Math.exp(-ax*duration)),exact=t<=1+duration?2*(1-Math.exp(-ax*(t-1))):top*Math.exp(-ax*(t-1-duration));near(r.X[j],exact,.008);}
 }
});
test('directional shutdown detection excludes a late upward crossing',()=>{
 const t=[0,1,2,3,4,5],z=[0,0,.2,.7,.6,.3];near(crossAfter(t,z,.5,1),2.6);near(crossAfter(t,z,.5,1,-1),4+1/3);
 for(const ay of [.1,.3,5])for(const duration of [4,7,10])for(const Ky of [[.7,.4,.15],[.15,.4,.7]]){const r=temporalProgram({Kx:[.15,.4,.7],Ky,ax:1.5,ay,az:4,duration,T:20});for(const z of r.Z){assert.ok(z.every(x=>x>=0&&x<=1));const off=crossAfter(r.t,z,.5,1+duration,-1);if(Number.isFinite(off)){const j=Math.floor(off/.01);assert.ok(z[j+1]<z[j]);}}}
});
import {lacD,lacRoots} from '../content/sysbio/ch04.shared.js';
test('lac root counts match independent cubic discriminants and full two-dimensional Jacobians',()=>{
 for(const al of[3,10,30])for(const e of[.05,.1,.2,.4,1,4,30]){const p={kap:1,phi:.05,eps:.02,al,n:2},s=e/(1+e),B=s*(p.phi+al),A=s*(p.phi+al*p.eps),disc=B*B-4-4*B**3*A-27*A*A+18*B*A;if(Math.abs(disc)<1e-5)continue;const r=lacRoots(e,p,400),expected=disc>0?3:1;assert.equal(r.length,expected);assert.equal(r.filter(x=>x.stable).length,expected===3?2:1);for(const z of r){const X=z.X,P=al*(p.eps+X*X)/(1+X*X),gain=s*al*2*X*(1-p.eps)/(1+X*X)**2;near(P-al*lacD(X,2,p.eps),0);near(s*(p.phi+P)-X,0);assert.equal(z.stable,-1+Math.sqrt(gain)<0);}}
 for(const al of[3,30])for(const e of[.05,.5,30])assert.equal(lacRoots(e,{kap:1,phi:.05,eps:.02,al,n:1}).length,1);
});
import {LAM,lamF} from '../content/sysbio/ch04-b.js';
test('lambda toy equations preserve positivity, separate establishment from maintenance, and converge with smaller time steps',()=>{
 for(const m of[1,3,8])for(const E of[2,8])for(const k of[.5,3]){const f=lamF(m,k,E,0),a=integrate(f,[0,0,0],60,600,600).at(-1).slice(1),b=integrate(f,[0,0,0],60,2400,2400).at(-1).slice(1);a.forEach((x,i)=>{assert.ok(x>=0&&Number.isFinite(x));near(x,b[i],1e-5);});for(const axis of[0,1,2]){const y=[1,1,1];y[axis]=0;assert.ok(f(y)[axis]>=0);}}
 for(const u of[.01,1,5]){const v=LAM.V/(1+4*u*u),c=3*LAM.kap/(1+4*u*u),f=lamF(3,LAM.kap,4,0)([u,v,c]);near(f[1],0);near(f[2],0);near(f[0],(LAM.eps+LAM.A*u*u/(1+u*u)+4*c)/(1+v*v)-u);}
 const a=integrate(lamF(0,LAM.kap,0,0),[3.5,.5,0],80,3200,3200).at(-1),b=integrate(lamF(0,LAM.kap,0,3),[3.5,.5,0],80,3200,3200).at(-1);assert.ok(a[1]>a[2]&&b[1]<b[2]);
});
