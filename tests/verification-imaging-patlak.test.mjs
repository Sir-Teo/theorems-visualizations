import test from 'node:test';
import assert from 'node:assert/strict';
import { patlakPlasmaAudit as plasma, patlakInputIntegralAudit as integral, patlakModelAudit as model, patlakFrameAudit as frame } from '../content/imaging/source-audit-patlak.shared.js';
import { fitLine } from '../content/imaging/ch04.shared.js';
const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} != ${b}`);
const terms = [[55,.9],[-55,5.9],[7,.1],[-7,5.1],[4.5,.0045],[-4.5,5.0045]];
// Independent analytical convolution of each plasma exponential with the
// two eigenmodes of the tissue impulse response; production uses RK4 instead.
function exactTotal(t, K1, k2, k3, k4, Vp = .04) {
  const s = k2+k3+k4, d = Math.sqrt(s*s-4*k2*k4), l1=(s-d)/2, l2=(s+d)/2;
  const conv = (b,l) => Math.abs(b-l)<1e-10 ? t*Math.exp(-b*t) : (Math.exp(-l*t)-Math.exp(-b*t))/(b-l);
  return Vp*plasma(t)+terms.reduce((q,[a,b]) => q+a*K1/d*((k3+k4-l1)*conv(b,l1)+(l2-k3-k4)*conv(b,l2)),0);
}
test('analytic plasma integral differentiates to the declared six-term input', () => {
  near(integral(0),0); near(plasma(0),0);
  for(const t of [.025,.25,.75,2.5,20,90]) {
    near(plasma(t),terms.reduce((s,[a,b])=>s+a*Math.exp(-b*t),0),1e-13);
    near((integral(t+1e-5)-integral(t-1e-5))/2e-5,plasma(t),1e-7);
  }
});
test('RK4 tissue curves agree with independent exponential convolution at sixteen rate corners', () => {
  for(const K1 of [.04,.3]) for(const k2 of [.04,.4]) for(const k3 of [0,.2]) for(const k4 of [0,.08]) {
    const m=model(K1,k2,k3,k4);
    for(const t of [.25,.75,1.25,3.5,20,60,90]) near(frame(m,t).ct,exactTotal(t,K1,k2,k3,k4),2e-6);
    assert.ok([...m.c1,...m.c2].every(x=>Number.isFinite(x)&&x>=0));
  }
});
test('quarter-minute frames use their declared time, not a rounded tenth-minute', () => {
  const m=model(.1,.13,.06,0), f=frame(m,.25);
  near(f.cp,plasma(.25),1e-14); near(f.cum,integral(.25),1e-14);
  assert.ok(Math.abs(f.ct-frame(m,.3).ct)>.01);
  near(f.ct,exactTotal(.25,.1,.13,.06,0),2e-6);
});
test('irreversible identity includes the corrected k2/(k2+k3) residual', () => {
  for(const k3 of [0,.06,.2]) {
    const K1=.1,k2=.13,a=k2+k3,ki=K1*k3/a,m=model(K1,k2,k3,0);
    for(const t of [.25,2.5,20,90]) {
      const i=Math.round(t/m.dt), f=frame(m,t);
      near(f.ct,ki*f.cum+k2/a*m.c1[i]+.04*f.cp,2e-6);
    }
  }
});
test('late slow-tail intercept differs from the free compartment volume', () => {
  const K1=.1,k2=.13,k3=.06,a=k2+k3,beta=.0045,m=model(K1,k2,k3,0,.04,500);
  const f=frame(m,500),ki=K1*k3/a,residual=f.ct/f.cp-ki*f.cum/f.cp;
  const exactTail=.04+K1*k2/(a*(a-beta));
  near(residual,exactTail,2e-6);
  assert.ok(Math.abs(residual-(.04+K1/a))>.1);
});
test('no-trap slope tends to zero and a leaking trap differs from the irreversible benchmark', () => {
  const times=[60,70,80,90];
  const slope=k4=>{const m=model(.1,.13,.06,k4),fs=times.map(t=>frame(m,t));return fitLine(fs.map(f=>f.cum/f.cp),fs.map(f=>f.ct/f.cp)).slope;};
  near(slope(0),.1*.06/.19,5e-5);
  assert.ok(slope(.08)<slope(0)/3);
  const m=model(.1,.13,0,0,.04,500),fs=[400,450,500].map(t=>frame(m,t));
  near(fitLine(fs.map(f=>f.cum/f.cp),fs.map(f=>f.ct/f.cp)).slope,0,1e-8);
});
