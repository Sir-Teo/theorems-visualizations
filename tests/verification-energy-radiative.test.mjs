import test from'node:test';import assert from'node:assert/strict';
import{radiativeFluxAudit as flux,radiativeEnergyAudit as energy,radiativeJunctionAudit as junction,radiativeMaximumAudit as mpp,radiativeStackAudit as stack,RADIATIVE_INPUTS_AUDIT as C}from'../content/energy/source-audit-radiative.shared.js';
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(Math.abs(b),1e-250),`${a} != ${b}`),pref=2*Math.PI/(C.HPL**3*C.CLIGHT**2);
function simpson(f,a,b,N=16000){if(!(b>a))return 0;const h=(b-a)/N;let q=f(a)+f(b);for(let i=1;i<N;i++)q+=(i%2?4:2)*f(a+i*h);return q*h/3;}
// Direct energy quadrature with a logarithmic change of variable in the
// distance above the chemical potential; no polylogarithms or tail series.
function independent(E1,E2,T,V=0,gap=E1-V,power=2){
 const t=C.KB*T,x=gap/t,hi=Math.min(80+x,(E2-E1)/t+x);
 return pref*simpson(z=>{const u=Math.exp(z),E=E1+t*(u-x);return E**power*t*u/Math.expm1(u);},Math.log(x),Math.log(hi));
}
test('Generalized Planck photon and energy integrals match direct independent quadrature, including near-gap chemical potentials',()=>{
 for(const T of[250,300,400,5772])for(const E1 of[.4,1.34,3])for(const E2 of[E1+.1,Infinity]){
  for(const gap of[E1,.01,.00001]){const V=E1-gap;near(flux(E1,E2,T,V).N,independent(E1,E2,T,V,gap),2e-9);}
  near(energy(E1,E2,T),independent(E1,E2,T,0,E1,3),2e-9);
 }
 near(energy(0,Infinity,5772)*C.FW*C.QE,C.S0,2e-9);
 assert.equal(flux(1,1,300).N,0);assert.equal(energy(1,1,5772),0);
});
test('Current balance and power stationarity hold across gaps, temperatures, emitting faces and the full concentration range',()=>{
 for(const conc of[1,1000,C.maxConcentration])for(const Tc of[250,400])for(const faces of[1,2])for(const E of[.4,1.34,3]){
  const j=junction(E,Infinity,{conc,Tc,faces}),p=mpp(j);assert.ok(j.VocGap>0&&j.Voc<=E);assert.ok(p.V>0&&p.V<E&&p.J>0&&p.J<j.A);near(j.J(0),j.A);
  const emitted=independent(E,Infinity,Tc,j.Voc,j.VocGap),target=j.thermal+j.A/faces;near(emitted,target,2e-9);
  const q=j.flux(p.V);near(j.J(p.V),p.V*faces*q.dN,2e-11);near(p.P,C.QE*p.V*p.J);
  for(const V of[p.V*.99,p.V*1.01])assert.ok(C.QE*V*j.J(V)<p.P);
  for(const fraction of[0,.1,.9,1]){const current=fraction*j.A,z=j.voltageForCurrent(current);if(fraction<1)near(independent(E,Infinity,Tc,z.V,z.gap),j.thermal+(j.A-current)/faces,2e-9);else assert.equal(z.V,0);}
 }
});
test('Spectrum windows conserve photons; common-current operation respects each junction and independent loads provide an upper comparison',()=>{
 for(const conc of[1,1000,C.maxConcentration])for(const gaps of[[1.34],[1.8,1.1],[1.9,1.3,.8],[1.2,1.2,.8]]){
  const o={conc,Tc:300,faces:1},s=stack(gaps,o,'series'),i=stack(gaps,o,'indep');assert.ok(s.eta>=0&&s.eta<1&&i.eta>=s.eta-1e-12&&i.eta<1);
  const sorted=[...gaps].sort((a,b)=>b-a),total=s.js.reduce((q,j)=>q+j.A,0),low=sorted.at(-1),expected=C.FW*conc*(flux(low,Infinity,5772).N-flux(low,Infinity,300).N);near(total,expected);
  if(new Set(gaps).size<gaps.length){assert.equal(s.eta,0);continue;}
  near(s.parts.reduce((q,p)=>q+p.P,0),s.eta*C.S0*conc);for(let k=0;k<s.js.length;k++){const j=s.js[k],p=s.parts[k];near(j.J(p.V),s.j,1e-11);assert.ok(p.V>=0&&p.V<j.E1);}
  const slope=s.parts.reduce((q,p,k)=>q+p.V-s.j/(s.js[k].faces*s.js[k].flux(p.V).dN),0);assert.ok(Math.abs(slope)<1e-8);
 }
});
test('Original Rühle2016 Table1 generation currents recover its two-face,298.15K maximum-power values',()=>{
 // Feed the table's AM1.5G photon-generation currents into the emission model.
 // This checks the radiative/MPP calculation without pretending the app's
 // blackbody source is the AM1.5G spectrum. Table entries are rounded.
 for(const[E,Jmax,Vref,Jref,etaRef]of[[.4,66.95,.152,57.29,8.73],[1.4,32.88,1.026,32.08,32.91],[3,1.86,2.491,1.84,4.58]]){
  const faces=2,thermal=flux(E,Infinity,298.15).N,A=Jmax/(C.QE*.1)-faces*thermal,f=V=>flux(E,Infinity,298.15,V),J=V=>A-faces*(f(V).N-thermal),p=mpp({E1:E,A,faces,thermal,flux:f,J});
  assert.ok(Math.abs(p.V-Vref)<.001);assert.ok(Math.abs(p.J*C.QE*.1-Jref)<.03);assert.ok(Math.abs(p.P/1000.37*100-etaRef)<.03);
 }
});
