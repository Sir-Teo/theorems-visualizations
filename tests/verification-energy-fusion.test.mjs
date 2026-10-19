import test from 'node:test';
import assert from 'node:assert/strict';
import {fusionReactivityAudit as sv,fusionThresholdAudit as threshold,fusionBalanceAudit as balance,fusionMinimumAudit as minimum,KEV_J_AUDIT as J} from '../content/energy/source-audit-fusion.shared.js';
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol*Math.max(Math.abs(b),1e-100),`${a} != ${b}`);
test('Original Bosch–Hale TableVIII printed D–T reactivities and validity range',()=>{
  // Printed cm³/s table, independently transcribed from original p625.
  for(const[T,v]of[[.2,1.254e-26],[.5,5.697e-23],[1,6.857e-21],[2,2.977e-19],[3,1.867e-18],[5,1.366e-17],[10,1.136e-16],[15,2.740e-16],[20,4.330e-16],[30,6.681e-16],[50,8.649e-16]])close(sv(T),v*1e-6,7e-4);
  assert.throws(()=>sv(.19),RangeError);assert.throws(()=>sv(100.1),RangeError);
});
test('Independent Maxwell integral of the original valid low-energy cross-section agrees with reactivity fit',()=>{
  const sigma=E=>1e-31*(6.927e4+E*(7.454e8+E*(2.05e6+E*5.2002e4)))/(1+E*(63.8+E*(-.995+E*(6.981e-5+E*1.728e-4))))/E*Math.exp(-34.3827/Math.sqrt(E));
  for(const T of[1,2,5,10,20]){
    // All cross-section evaluations stay in its original 0.5–550 keV domain.
    const N=4096,h=Math.log(550/.5)/N;let integral=0;
    for(let i=0;i<=N;i++){const E=.5*Math.exp(h*i),f=sigma(E)*E*E*Math.exp(-E/T);integral+=(i===0||i===N?1:i%2?4:2)*f;}
    integral*=h/3;const expected=299792458*Math.sqrt(8/(Math.PI*1124656))*T**-1.5*integral;
    close(sv(T),expected,.025);
  }
});
test('Independent heating/loss power balances close threshold contours across the entire displayed domain',()=>{
  for(let i=0;i<=200;i++){
    const T=1*100**(i/200);
    for(const Q of[1,5,20,Infinity]){
      const target=threshold(T,Q);
      if(Number.isFinite(target)){
        const n=1e20,tau=target/(n*T),p=balance({n,T,tau});
        if(Number.isFinite(Q))close(p.fusion/Q+p.alpha,p.transport+p.brems,5e-13);else close(p.alpha,p.transport+p.brems,5e-13);
      }
    }
  }
  for(const n of[1e19,1e20,3e21])for(const T of[2,15,80])for(const tau of[.01,1,20]){
    const p=balance({n,T,tau});close(p.transport,3*n*T*J/tau);close(p.brems,5.34e-37*n*n*Math.sqrt(T));
    close(p.fusion,n*n/4*sv(T)*17600*J);close(p.alpha,n*n/4*sv(T)*3500*J);assert.equal(p.external,Math.max(0,p.transport+p.brems-p.alpha));
    if(p.net>0){close(p.Q,p.fusion/p.external);close(threshold(T,p.Q),p.triple,3e-13);}else assert.equal(p.Q,Infinity);
  }
});
test('Ignition minimum agrees with an independent dense search and the rounded original modern derivation table',()=>{
  const m=minimum(),grid=Array.from({length:10001},(_,i)=>{const T=1+99*i/10000;return{T,triple:threshold(T)};}).reduce((a,b)=>a.triple<b.triple?a:b);
  close(m.triple,grid.triple,1e-6);assert.ok(Math.abs(m.T-grid.T)<.02);close(m.triple,2.9e21,.03);assert.ok(m.T>13&&m.T<15);
  assert.equal(threshold(2),Infinity);assert.ok(Number.isFinite(threshold(5)));
});
