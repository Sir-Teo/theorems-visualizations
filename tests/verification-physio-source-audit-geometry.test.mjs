import test from 'node:test';
import assert from 'node:assert/strict';
import { tubeFlow, murrayRadius, murrayCost, COMPLIANCE_MODELS, vesselVolume, vesselCompliance, addedVolumePressure, VESSEL_AREAS_CM2, classFlow } from '../content/physio/physio-source-audit-geometry.js';
const close = (a,b,tol=1e-10) => assert.ok(Math.abs(a-b)<=tol*Math.max(1e-20,Math.abs(b)),`${a} != ${b}`);
test('Poiseuille: independent disk quadrature, no-slip, peak/mean, wall shear and units at all 16 control corners',()=>{
  for(const r of [.0002,.003])for(const L of [.01,.2])for(const mu of [.001,.008])for(const mmHg of [1,50]){
    const dP=mmHg*133.322,m=tubeFlow(r,L,mu,dP),n=1000,h=r/n;
    const u=x=>dP*(r*r-x*x)/(4*mu*L);let q=0;
    // Composite Simpson rule is exact for this cubic area integrand, independent of closed Q.
    for(let k=0;k<=n;k++)q+=(k===0||k===n?1:k%2?4:2)*u(k*h)*2*Math.PI*k*h;
    q*=h/3;close(m.Q,q);close(m.mean,m.umax/2);close(u(r),0);
    close(m.tau,mu*(u(r-h)-u(r))/(h)*(2*r/(2*r-h)),1e-9);
    close(m.Q*6e4,m.Q*1e6*60/1000);close(m.Re,1060*m.mean*2*r/mu);close(m.resistance*m.Q,dP);
  }
});
test('Poiseuille: dimensional scaling and formal out-of-regime warning examples',()=>{
 const a=tubeFlow(.001,.1,.0035,266.644),b=tubeFlow(.002,.1,.0035,266.644);close(b.Q/a.Q,16);close(b.tau/a.tau,2);close(b.Re/a.Re,8);
 assert.ok(tubeFlow(.003,.01,.001,50*133.322).Re>1e6);assert.ok(tubeFlow(.0002,.2,.008,133.322).Re<1);
});
test('Murray: unique minimizer, derivative sign and volume/pump ratio independently calculated',()=>{
 for(const Q of [1e-7,5e-6,5e-5])for(const m of [300,1100,30000]){
  const mu=.0035,r=murrayRadius(Q,m,mu),cost=murrayCost(r,Q,m,mu),d=x=>-32*mu*Q*Q/(Math.PI*x**5)+2*m*Math.PI*x;
  close(cost.volume,2*cost.pump);assert.ok(d(.999*r)<0&&d(1.001*r)>0);
  for(const z of [.25,.3,.5,1,1.5,2,3]){const c=murrayCost(z*r,Q,m,mu);close(c.total/cost.total,(z**-4+2*z*z)/3);assert.ok(c.total>=cost.total*(1-1e-14));}
 }
});
test('Murray: 41 branch fractions conserve Q and cubes, give equal shear and increased total area',()=>{
 for(let j=0;j<=40;j++){const f=.1+j*.01,Q=5e-6,mu=.0035,r=murrayRadius(Q,1100),r1=r*Math.cbrt(f),r2=r*Math.cbrt(1-f),tau=(q,R)=>4*mu*q/(Math.PI*R**3);close(r1**3+r2**3,r**3);close(tau(f*Q,r1),tau(Q,r));close(tau((1-f)*Q,r2),tau(Q,r));assert.ok(r1*r1+r2*r2>r*r);}
});
test('Compliance: local slopes match independent centered differences and the low-pressure ordering reverses',()=>{
 for(const m of COMPLIANCE_MODELS)for(const p of [2,10,50,120]){const h=.001;close((vesselVolume(m,p+h)-vesselVolume(m,p-h))/(2*h),vesselCompliance(m,p),1e-8);}
 const [a,b]=COMPLIANCE_MODELS;assert.ok(vesselCompliance(b,2)>vesselCompliance(a,2));assert.ok(vesselCompliance(b,120)<vesselCompliance(a,120));
});
test('Compliance: all 119 pressures ×50 volume additions invert exactly or explicitly have no finite solution',()=>{
 let finite=0,missing=0;
 for(const m of COMPLIANCE_MODELS)for(let P=2;P<=120;P++)for(let dV=10;dV<=500;dV+=10){const cap=m.Vu+m.C0*m.pinf,headroom=m.C0*m.pinf*Math.exp(-P/m.pinf),jump=addedVolumePressure(m,P,dV);if(dV<headroom){finite++;assert.ok(Number.isFinite(jump)&&jump>0);close(vesselVolume(m,P+jump)-vesselVolume(m,P),dV,1e-11);}else{missing++;assert.equal(jump,null);assert.ok(vesselVolume(m,P)+dV>=cap-1e-10);}}
 assert.ok(finite>0&&missing>0);
 for(const m of COMPLIANCE_MODELS){const h=m.C0*m.pinf*Math.exp(-.4);assert.equal(addedVolumePressure(m,.4*m.pinf,h),null);assert.equal(addedVolumePressure(m,.4*m.pinf,h*1.01),null);}
});
test('Continuity: exact author-table area column and every 8 control corners preserve flow/transit units',()=>{
 assert.deepEqual([...VESSEL_AREAS_CM2],[2.5,20,40,2500,250,80,8]);
 for(const q of [2,25])for(const rec of [.3,3])for(const L of [.03,.15]){const a=classFlow(q,rec,L);for(let i=0;i<7;i++)close(a.area[i]*a.velocity[i],q*1000/60);close(a.transit,L/a.velocity[3]);close(a.transit,L*10/(a.velocity[3]*10));assert.ok(a.velocity[0]>a.velocity[3]);}
 assert.ok(classFlow(25,.3,.03).velocity[0]>100);assert.equal(classFlow(5,3,.07).area[3],7500);
});
test('Integration: audited chapter statements preserve prerequisite arrays and precise references',async()=>{
 const a=(await import('../content/physio/ch04.js')).default.items,b=(await import('../content/physio/ch04-b.js')).default.items;
 for(const [items,num,deps]of[[a,'4.2',['physio-4.1','fluid-6.8']],[a,'4.5',['physio-4.2','pma-5.8']],[b,'4.6',[]],[b,'4.10',['fluid-1.5']]]){const it=items.find(x=>x.num===num);assert.deepEqual(it.deps,deps);assert.ok(it.refs.length);}
});
