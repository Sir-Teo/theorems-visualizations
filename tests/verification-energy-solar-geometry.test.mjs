import test from 'node:test';import assert from 'node:assert/strict';
import{solarDeclinationAudit as decl,solarPositionAudit as pos,solarIncidenceAudit as inc,solarBeamAudit as beam,solarDayEnergyAudit as day,solarYearEnergyAudit as year,GEOMETRY_INPUTS_AUDIT as M}from'../content/energy/source-audit-solar-geometry.shared.js';
const r=Math.PI/180,near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Rotating the solar vector into the local frame independently recovers altitude, azimuth and panel incidence',()=>{
 for(const phi of[-60,-25,0,25,70])for(const n of[1,81,172,266,355])for(const h of[0,6,9.2,12,16.8,24])for(const beta of[0,17,40,90]){
  const p=phi*r,d=decl(n)*r,w=(h-12)*15*r;
  // Equatorial-frame Sun and orthonormal local basis, not the production
  // trigonometric incidence formula.
  const sun=[Math.cos(d)*Math.cos(w),Math.cos(d)*Math.sin(w),Math.sin(d)];
  const up=[Math.cos(p),0,Math.sin(p)],north=[-Math.sin(p),0,Math.cos(p)],east=[0,-1,0];
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),u=dot(sun,up),e=dot(sun,east),nn=dot(sun,north);
  const sp=pos(phi,n,h);near(sp.sa,u);near(sp.alt,Math.asin(Math.max(-1,Math.min(1,u)))/r);
  if(Math.hypot(e,nn)>1e-10){near(Math.sin(sp.az*r),e/Math.hypot(e,nn));near(Math.cos(sp.az*r),nn/Math.hypot(e,nn));}
  const panel=up.map((x,i)=>x*Math.cos(beta*r)-(phi<0?-1:1)*north[i]*Math.sin(beta*r));near(inc(phi,n,h,beta),dot(sun,panel));
 }
});
// Independent full-day integration, including both horizon and back-face
// clipping. Production instead integrates over an analytically found interval.
function independentDay(phi,n,beta,atm){
 const rise=f=>{if(f(12)<=0)return 12;if(f(0)>=0)return 0;let a=0,b=12;for(let i=0;i<60;i++){const m=(a+b)/2;if(f(m)>0)b=m;else a=m;}return(a+b)/2;};
 const start=Math.max(rise(h=>pos(phi,n,h).sa),rise(h=>inc(phi,n,h,beta)));if(start===12)return 0;
 const N=8000,dh=(12-start)/N,f=h=>{const sp=pos(phi,n,h);return (atm?Math.exp(-M.opticalDepth/Math.max(1e-300,sp.sa)):1)*M.flux*Math.max(0,inc(phi,n,h,beta));};
 let sum=f(start)+f(12);for(let i=1;i<N;i++)sum+=(i%2?4:2)*f(start+i*dh);return 2*sum*dh/3/1000;
}
test('Analytic geometric and midpoint attenuated day integrals match an independent time-domain quadrature',()=>{
 for(const phi of[-60,0,40,70])for(const n of[1,81,172,355])for(const beta of[0,29,90])for(const atm of[false,true]){
  const E=day(phi,n,beta,atm),ref=independentDay(phi,n,beta,atm);near(E,ref,atm?6e-5:2e-8);assert.ok(E>=0);assert.ok(E<=day(phi,n,beta,false)+1e-10);
 }
 assert.equal(day(70,355,40,false),0);assert.equal(day(70,355,40,true),0);
 for(const phi of[25,70])for(const n of[1,81,172])near(day(phi,n,31,true),day(-phi,n+182.5,31,true),1e-12);
 for(const n of[1,81,172])near(day(0,n,0,true),day(0,n+182.5,0,true),1e-12);
 near(day(0,81,0,false),M.flux*24/Math.PI/1000);
});
test('The annual value is the mean of all365 days at the actual selected tilt, with explicit attenuation scope',()=>{
 for(const phi of[-60,0,40,70])for(const beta of[0,40,41,90]){
  const sum=Array.from({length:365},(_,i)=>day(phi,i+1,beta,true)).reduce((a,b)=>a+b,0);near(year(phi,beta,true),sum/365,1e-14);
 }
 assert.notEqual(year(40,40,true),year(40,39,true));assert.notEqual(year(40,41,true),year(40,42,true));
 assert.equal(beam(-1,true),0);assert.equal(beam(0,false),0);near(beam(90,true)/M.flux,Math.exp(-.25));assert.ok(beam(1,true)<beam(30,true));
});
