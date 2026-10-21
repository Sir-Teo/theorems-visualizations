import test from 'node:test';import assert from 'node:assert/strict';
import {sectionAudit,criticalMachAudit,localMachAudit,kornAudit,waveDragAudit,KORN_OFFSET_AUDIT,sweepVectorsAudit}from'../content/aero/source-audit-compressibility.js';
import{cpCrit,pgCorr,DEG}from'../content/aero/ch04.shared.js';
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('PG transformation preserves the flattened boundary condition and PDE; sonic coefficient follows independent stagnation pressure',()=>{
 for(const m of [.1,.3,.6,.9,.95]){
  const b=Math.sqrt(1-m*m),x=.23,y=.17; // Phi=exp(x)cos(eta), an independent harmonic potential
  const phixx=Math.exp(x)*Math.cos(b*y)/b,phiyy=-b*Math.exp(x)*Math.cos(b*y);near(b*b*phixx+phiyy,0);
  // Phi=exp(x)sin(eta): phi_y(x,0)=Phi_eta(x,0), while phi_x=Phi_x/b.
  near((Math.exp(x)*Math.sin(b*1e-7)/b)/1e-7,Math.exp(x),1e-12);
  const p0OverP=(1+.2*m*m)**3.5,pStarOverP0=1.2**-3.5,cp=(p0OverP*pStarOverP0-1)/(.7*m*m);near(cpCrit(m),cp);near(localMachAudit(cp,m),1);near(pgCorr(-.6,m),-.6/b);
 }
 assert.equal(localMachAudit(-5,.95),null);
});
test('All thickness/incidence states have genuine first sonic roots, unclamped pressure values and physically symmetric zero-incidence input',()=>{
 for(const t of [.06,.09,.12,.15,.18])for(let a=0;a<=8;a++){
  const d=sectionAudit(t,a),mc=criticalMachAudit(d.minimum);assert.ok(mc>0&&mc<1);near(pgCorr(d.minimum,mc),cpCrit(mc));assert.ok(pgCorr(d.minimum,mc*.99)>cpCrit(mc*.99));assert.ok(pgCorr(d.minimum,mc+(1-mc)*.01)<cpCrit(mc+(1-mc)*.01));
  if(!a){near(d.cl,0);for(let i=0;i<d.cp.length;i++)near(d.cp[i],d.cp[d.cp.length-i-1],1e-8);}
 }
 const large=sectionAudit(.06,8);assert.ok(-pgCorr(large.minimum,.95)>30,'formerly clipped high-suction state is retained');assert.equal(criticalMachAudit(0),null);assert.ok(criticalMachAudit(-100)<.3,'root must not silently stop at M=.3');
});
test('Korn/Lock closes the independent divergence definition and cosine difference; high-loading sweep can turn over',()=>{
 near(KORN_OFFSET_AUDIT,Math.cbrt(.00125));
 for(const k of [.87,.95])for(const t of [.06,.15])for(const lift of [0,.8])for(let angle=0;angle<=60;angle++){
  const L=angle*DEG,c=Math.cos(L),base=k-t-lift/10,dd=kornAudit(k,t,lift,L),cr=dd-KORN_OFFSET_AUDIT;
  near(dd*c+t/c+lift/(10*c*c),k);near(base/c-dd,t*(1/c**2-1/c)+lift/10*(1/c**3-1/c));near(80*(dd-cr)**3,.1);
  const h=1e-5;near((waveDragAudit(dd+h,cr)-waveDragAudit(dd-h,cr))/(2*h),.1,1e-8);near(waveDragAudit(cr,cr),0);near(waveDragAudit(cr-.1,cr),0);
 }
 assert.ok(kornAudit(.87,.15,.8,60*DEG)<kornAudit(.87,.15,.8,50*DEG));
});
test('Every assigned angle resolves downward velocity into actual perpendicular and parallel projections',()=>{
 for(let angle=0;angle<=60;angle++){
  const L=angle*DEG,{tangent:t,normal:n,along:a,across:b}=sweepVectorsAudit(L);
  near(t[0]*n[0]+t[1]*n[1],0);near(Math.hypot(...t),1);near(Math.hypot(...n),1);near(a[0]+b[0],0);near(a[1]+b[1],-1);near(Math.hypot(...a),Math.sin(L));near(Math.hypot(...b),Math.cos(L));near(b[0]*t[0]+b[1]*t[1],0);
 }
});
