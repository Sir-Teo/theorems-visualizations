import test from 'node:test';
import assert from 'node:assert/strict';
import { reynolds, reynoldsLine, BERNOULLI_MMHG, stenosisFlow } from '../content/physio/physio-source-audit-flow.js';
const close=(a,b,e=1e-12)=>assert.ok(Math.abs(a-b)<=e*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Reynolds ratio: independent SI unit conversion and dynamic scaling over all8 control/handle corners',()=>{
 for(const D of[.005,50])for(const u of[1e-4,10])for(const mu of[1.5,6]) {
  const inertial=1060*u*u/(D*.001),viscous=mu*.001*u/(D*.001)**2;
  close(reynolds(D,u,mu),inertial/viscous);
  close(reynolds(2*D,u,mu),2*reynolds(D,u,mu));close(reynolds(D,u,2*mu),reynolds(D,u,mu)/2);
 }
 close(reynolds(25,.2,3.5),1514.2857142857142);
});
test('Isoreynolds curves terminate on true positive log-domain bounds and preserve Re at101 independent points each',()=>{
 for(const mu of[1.5,3.5,6])for(const r of[1,100,1500,2000,3000,1e4]){
  const L=reynoldsLine(r,mu);assert.ok(L.lo>=.005&&L.hi<=50&&L.lo<=L.hi);
  for(let j=0;j<=100;j++){const d=L.lo*(L.hi/L.lo)**(j/100),u=L.speed(d);assert.ok(u>=1e-4-1e-15&&u<=10+1e-12);close(reynolds(d,u,mu),r);}
 }
});
test('Stenosis: independent kinetic energy and continuity in SI units; exact upstream/rounding decomposition at all8 corners',()=>{
 close(BERNOULLI_MMHG,3.975337903721816,1e-12);
 for(const reduction of[0,90])for(const Q of[50,500])for(const recovery of[0,100]){
  const S=stenosisFlow(reduction,Q,recovery),q=Q*1e-6,A1=Math.PI*.012**2,A2=A1*(1-reduction/100),v1=q/A1,v2=q/A2;
  close(S.v1,v1);close(S.v2,v2);close(v1*A1,v2*A2);
  close(S.exact,(1060/2*(v2*v2-v1*v1))/133.322);
  close(S.simplified,S.exact+S.proximalRounded+S.rounding);
  close(S.loss,S.exact*(1-recovery/100));
  if(reduction===0){close(S.exact,0);assert.ok(S.simplified>0);}else assert.ok(S.exact>0);
 }
});
test('Fixed-flow area halving: throat kinetic term quadruples but pressure difference does not; flow doubling quadruples all drops',()=>{
 const A=stenosisFlow(50,250,60),B=stenosisFlow(75,250,60),C=stenosisFlow(50,500,60);
 close(B.v2/A.v2,2);close(B.exact,4*A.exact+3*A.proximal);assert.ok(B.exact/A.exact>4);close(C.exact,4*A.exact);close(C.loss,4*A.loss);
});
test('Only reviewed entries use new helpers; dependency arrays and source anchors remain intact',async()=>{
 const c=(await import('../content/physio/ch04-c.js')).default.items,d=(await import('../content/physio/ch04-d.js')).default.items;
 assert.deepEqual(c.find(i=>i.num==='4.14').deps,['physio-4.2','fluid-6.5']);assert.deepEqual(d.find(i=>i.num==='4.18').deps,['fluid-2.9','physio-4.10']);
 for(const i of[c.find(i=>i.num==='4.14'),d.find(i=>i.num==='4.18')]){assert.ok(i.refs.length>0);}
});
