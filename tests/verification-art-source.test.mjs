import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateDichromat } from '../content/art/verification-models.js';
import { toLMS, cmf } from '../content/art/ch04.shared.js';
const close=(a,b)=>a.forEach((x,i)=>assert.ok(Math.abs(x-b[i])<1e-12,`${i}: ${x} != ${b[i]}`));

test('dichromat projections ignore the absent component on both sides of the neutral axis',()=>{
 for(const [type,missing]of [['protan',0],['deutan',1],['tritan',2]])for(const q of [[.4,.7,.2],[.4,.7,1.2],[1.2,.7,.2]]){
  const base=simulateDichromat(type,q);
  for(const changed of [.01,.3,2,5]){const another=q.slice();another[missing]=changed;close(simulateDichromat(type,another),base);}
  close(simulateDichromat(type,base),base);
  for(let i=0;i<3;i++)if(i!==missing)assert.equal(base[i],q[i]);
 }
});

test('dichromat simulations preserve neutrals and both source anchor wavelengths',()=>{
 for(const type of ['protan','deutan','tritan']){
  for(const level of [0,.1,1,3])close(simulateDichromat(type,[level,level,level]),[level,level,level]);
  for(const wavelength of type==='tritan'?[485,660]:[475,575]){const q=toLMS(cmf(wavelength));close(simulateDichromat(type,q),q);}
 }
});

test('Maxwell recreation spans every spectral target and reconstructs the original tristimulus response',async()=>{
 const {primSet,EW}=await import('../content/art/ch04.shared.js');
 const basis=primSet([630,528,457]);
 close(basis.amounts(EW),[1,1,1]);
 for(let wavelength=420;wavelength<=680;wavelength+=5){
  const t=cmf(wavelength),a=basis.amounts(t),recovered=[0,1,2].map(k=>a.reduce((sum,x,i)=>sum+x*basis.prim(i)[k],0));close(recovered,t);
 }
 // The red primary itself lies in a two-primary span: fewer than three do not fail for every possible target.
 const primary=basis.prim(0);const coefficients=basis.amounts(primary);close(coefficients,[1,0,0]);
});
