import test from 'node:test';
import assert from 'node:assert/strict';
import { bundle, bundleValue, bundleLossProb } from '../content/behav/ch04.shared.js';
import { THALER_DELAY_CHOICES } from '../content/behav/ch05.js';

test('repeated-bet probabilities match independent exact integer counts and include zero outcomes correctly', () => {
  for (const n of [1, 3, 4, 20, 100]) {
    let choose=1n, loss=0n; const den=2**n;
    for(let k=0;k<=n;k++) { if(300*k-100*n<0)loss+=choose; choose=choose*BigInt(n-k)/BigInt(k+1); }
    assert.ok(Math.abs(bundleLossProb(n,200,100)-Number(loss)/den)<1e-13);
    const rows=bundle(n,200,100);assert.ok(Math.abs(rows.reduce((s,o)=>s+o.p,0)-1)<1e-13);
    assert.ok(Math.abs(rows.reduce((s,o)=>s+o.p*o.total,0)-50*n)<1e-9);
  }
  assert.ok(Math.abs(bundleLossProb(3,200,100)-.125)<1e-15);
  assert.ok(bundleValue(3,200,100,.5,4)>0); assert.ok(bundleValue(4,200,100,.5,4)<0);
});

test('hyperbolic example uses one original questionnaire rather than mixing the annual medians of two forms', () => {
  // Thaler1981 Table2C: fifteen dollars now versus 20/50/100 after1month/1year/10years.
  assert.deepEqual(THALER_DELAY_CHOICES,[[1/12,20],[1,50],[10,100]]);
  const annualRates=THALER_DELAY_CHOICES.map(([t,x])=>Math.log(x/15)/t);
  assert.deepEqual(annualRates.map(r=>Math.round(100*r)),[345,120,19]);
  for(const k of [.2,1,4.8,20]) {
    // Integrate exp(-r t) against an exponential rate density, independently of dHyp.
    for(const t of [.1,1,10]) {
      const n=100000,h=30*k/n;let value=0;
      for(let j=0;j<n;j++){const r=(j+.5)*h;value+=Math.exp(-r*t)*Math.exp(-r/k)/k*h;}
      assert.ok(Math.abs(value-1/(1+k*t))<1e-6);
    }
  }
});
