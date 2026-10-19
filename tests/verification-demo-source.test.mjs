import test from 'node:test';
import assert from 'node:assert/strict';
import {CT_NATURAL,CT_DEPARTURE,fitCoaleTrussell} from '../content/demo/verification-models.js';
import {nrrOf} from '../content/demo/ch04.shared.js';
test('published Coale–Trussell standards recover synthetic level and control, excluding age45–49 from the fit',()=>{
 for(const M of [0.2,0.8,1.1])for(const m of [0,1,3]){
  const rates=CT_NATURAL.map((n,i)=>M*n*Math.exp(m*CT_DEPARTURE[i]));
  rates[5]*=10;const fit=fitCoaleTrussell(rates);
  assert.ok(Math.abs(fit.M-M)<1e-12);assert.ok(Math.abs(fit.m-m)<1e-12);
 }
 // Independent printed-table total, distinguishing this standard from the Hutterite reference.
 assert.ok(Math.abs(5*CT_NATURAL.reduce((a,b)=>a+b,0)-8.995)<1e-12);
});
test('net reproduction weights maternal exposure once, and never exceeds gross reproduction',()=>{
 const f=[0.1,0.2,0.15],srb=1.05,exposure=[4,3,2];
 assert.ok(Math.abs(nrrOf(f,exposure,srb)-(0.4+0.6+0.3)/2.05)<1e-14);
 assert.ok(nrrOf(f,exposure,srb)<nrrOf(f,[5,5,5],srb));
 assert.equal(nrrOf(f,[0,0,0],srb),0);
});
