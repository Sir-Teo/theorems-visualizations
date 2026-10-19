import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ekmanSolve, spinDownTime } from '../content/geo/ch04.shared.js';
const near=(a,b,t)=>assert.ok(Math.abs(a-b)<t,`${a} vs ${b}, tolerance ${t}`);
function exact(A,f,H){
 const d=Math.sqrt(2*A/Math.abs(f)), a=H/d, sign=Math.sign(f), den=Math.cosh(2*a)+Math.cos(2*a);
 const re=Math.sinh(2*a)/den, im=sign*Math.sin(2*a)/den, p=d/(2*A);
 const cr=Math.cosh(a)*Math.cos(a), ci=sign*Math.sinh(a)*Math.sin(a), norm=cr*cr+ci*ci;
 return {surf:[p*(re+sign*im),p*(im-sign*re)],T:[ci/norm/f,-(1-cr/norm)/f]};
}
test('finite-depth Ekman currents converge to the independent complex hyperbolic solution',()=>{
 for(const f of [1e-4,-1e-4])for(const ratio of [.1,.5,1,3]){
  const A=.1,H=ratio*Math.PI*Math.sqrt(2*A/Math.abs(f)), e=exact(A,f,H);
  const coarse=ekmanSolve(()=>A,f,H,120),fine=ekmanSolve(()=>A,f,H,240);
  for(let i=0;i<2;i++){
   const a=Math.abs(coarse.surf[i]-e.surf[i]),b=Math.abs(fine.surf[i]-e.surf[i]);
   assert.ok(b<a/3.8);near(fine.surf[i],e.surf[i],.2);
   near(fine.T[i],e.T[i],2);
  }
 }
});
test('deep Ekman transport is perpendicular with opposite signs in opposite hemispheres',()=>{
 for(const f of [1e-4,-1e-4]){
  const A=.1,H=3*Math.PI*Math.sqrt(2*A/Math.abs(f)),s=ekmanSolve(()=>A,f,H,500);
  near(-Math.atan2(s.surf[1],s.surf[0])*180/Math.PI,45*Math.sign(f),.01);
  near(s.T[0]*Math.abs(f),0,.0002);near(s.T[1]*f,-1,.0002);
 }
});
test('spin-down time uses Greenspan half-depth and one-lid flux balance',()=>{
 const H=.08,nu=1e-6,omega=3,delta=Math.sqrt(nu/omega);
 near(spinDownTime(H,nu,omega,2),(H/2)/Math.sqrt(nu*omega),1e-12);
 // Each lid pumps at w=delta*zeta/2, so d zeta/dt=-lids*omega*delta*zeta/H.
 for(const lids of [1,2])near(1/spinDownTime(H,nu,omega,lids),lids*omega*delta/H,1e-12);
});

import { hollandP, hollandV, hollandMaximum, deficitForVmax, potentialIntensity, RHO_TC } from '../content/geo/ch03.shared.js';
import { esat, Lv, EPS } from '../content/geo/ch01.shared.js';
test('hurricane speed satisfies independently differentiated pressure-gradient balance',()=>{
 for(const B of [1,1.4,2.5])for(const r of [10000,35000,100000]){
  const f=5e-5,V=hollandV(r,95000,101000,35000,B,f),h=.1;
  const G=(hollandP(r+h,95000,101000,35000,B)-hollandP(r-h,95000,101000,35000,B))/(2*h*RHO_TC);
  near(V*V/r+f*V,G,1e-9);
 }
 const Rm=35000,p=hollandMaximum(95000,101000,Rm,1.4,0);
 near(p.radius,Rm,.01);near(p.speed,Math.sqrt(1.4*6000/(RHO_TC*Math.E)),1e-10);
 assert.ok(hollandMaximum(95000,101000,Rm,1.4,5e-5).radius<Rm);
 for(const f of [2e-5,1e-4])for(const target of [20,60,100]){
  const dp=deficitForVmax(target,Rm,1.4,f);near(hollandMaximum(101000-dp,101000,Rm,1.4,f).speed,target,1e-10);
 }
});
test('Bister-Emanuel eq21 includes dissipative heating and actual specific humidity',()=>{
 for(const sst of [18,28,33]){
  const Ts=sst+273.15,Ta=Ts-1,To=203,p=101000,ea=.8*esat(Ta);
  const qs=EPS*esat(Ts)/(p-(1-EPS)*esat(Ts)),qa=EPS*ea/(p-(1-EPS)*ea);
  const dk=1005*(Ts-Ta)+Lv(Ts)*qs-Lv(Ta)*qa,eps=(Ts-To)/Ts,pi=potentialIntensity(sst);
  near(pi.dk,dk,1e-9);near(pi.V**2,eps/(1-eps)*dk,1e-9);
  assert.ok(pi.V**2>eps*dk);
 }
});
