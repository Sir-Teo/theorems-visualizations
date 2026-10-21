import test from 'node:test';import assert from 'node:assert/strict';
import { heartBeat } from '../content/physio/ch03.shared.js';
import { OUTPUT_PRESETS, outputMetrics, integrateSamples } from '../content/physio/physio-source-audit-cardiac.js';
const close=(a,b,e=1e-10)=>assert.ok(Math.abs(a-b)<e*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function simpson(a,h){let n=a.length-1;if(n%2)n--;let s=a[0]+a[n];for(let j=1;j<n;j++)s+=(j%2?4:2)*a[j];return s*h/3+(n<a.length-1?h*(a[n]+a[n+1])/2:0);}
test('Cardiac definitions: equal stroke volume can have different EF; equal EF can have different output; units require /1000',()=>{
 const A=outputMetrics(100,40,75),B=outputMetrics(150,90,75),C=outputMetrics(200,80,75);close(A.SV,B.SV);close(A.EF,.6);close(B.EF,.4);close(A.CO,B.CO);close(A.CO,4.5);close(C.EF,A.EF);close(C.CO,2*A.CO);
});
test('Sample integration handles nonuniform time intervals exactly for an independent affine pressure function',()=>{
 const t=[0,.01,.07,.2,.66,.8],v=t.map(t=>80+30*t);close(integrateSamples(t,v),80*.8+15*.8**2);
});
test('All4 model presets at own default and2 rate endpoints: independent integrated ejection volume, ideal-valve direction, mass balance and finite warmup residual',()=>{
 for(const {hr,...p}of Object.values(OUTPUT_PRESETS))for(const HR of[40,hr,130]){
  const R=heartBeat({...p,HR}),M=outputMetrics(R.EDV,R.ESV,HR),n=R.t.length;
  for(const k of['SV','EF','CO'])close(R[k],M[k]);assert.ok(R.EDV>R.ESV&&R.EF>0&&R.EF<1);
  assert.ok(Math.abs(simpson(R.Q,.001)-R.SV)<.015,'integrated aortic ejection differs from volume width');
  assert.ok(Math.abs(simpson(R.Qm,.001)-simpson(R.Q,.001)-(R.V[n-1]-R.V[0]))<.02,'ventricular cycle balance');
  assert.ok(R.drift<.03,'finite warmup residual no longer within disclosed tested precision');
  for(let i=0;i<n;i++){assert.ok(Number.isFinite(R.V[i])&&R.V[i]>0);assert.equal(R.Q[i]>0,R.P[i]>R.Pa[i]);assert.equal(R.Qm[i]>0,R.Pat[i]>R.P[i]);}
  const mean=integrateSamples(R.t,R.Pa)/R.t.at(-1);assert.ok(mean>=R.PaMin&&mean<=R.PaMax);assert.ok(Math.abs(mean-simpson(R.Pa,.001)/R.t.at(-1))<.001);
 }
});
test('Preset comparison matches caption at chosen defaults, without asserting empirical athlete or disease data',()=>{
 const get=name=>{const {hr,...p}=OUTPUT_PRESETS[name];return heartBeat({...p,HR:hr});};
 const A=get('healthy'),B=get('stiff'),C=get('athlete'),D=get('failing');assert.ok(Math.abs(A.EF-B.EF)<.01);assert.ok(B.CO<A.CO);assert.ok(C.SV>A.SV);assert.ok(D.EF<A.EF);
});
