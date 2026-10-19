import {test} from 'node:test';import assert from 'node:assert/strict';
import {PC,AU,T_SUN,boltz,popFrac,sahaRatio,K_B,H_PL,M_E,EV,CHI_H,slabIntensity,balmerAbsorber,lumOfMass,mlSlope,bvToy,tBallesteros} from '../content/astro/ch04.shared.js';
const near=(a,b,t)=>assert.ok(Math.abs(a-b)<t,`${a} vs ${b}`),rel=(a,b,t)=>near(a/b,1,t);
test('IAU parsec and solar colour calibration agree with source reference values',()=>{
 near(PC,3.085677581491367e16,20);rel(PC/AU,206264.80624709636,1e-15);near(bvToy(T_SUN),.65,1e-13);
 near(tBallesteros(.65),5778.423731066208,1e-8);for(const T of [2500,5000,10000,20000])assert.ok(bvToy(T+100)<bvToy(T));
});
test('slab formal solution agrees with independent RK4 transfer integration and LTE limits',()=>{
 for(const bg of [0,1,3])for(const src of [.1,1,5])for(const tau of [.01,1,5]){
  const n=2000,h=tau/n;let I=bg;for(let k=0;k<n;k++){const a=src-I,b=src-(I+h*a/2),c=src-(I+h*b/2),d=src-(I+h*c);I+=h*(a+2*b+2*c+d)/6;}near(slabIntensity(bg,src,tau),I,1e-11);
 }
 near(slabIntensity(2,2,10),2,1e-14);near(slabIntensity(2,4,0),2,1e-14);
 assert.ok(slabIntensity(2,1,1)<2);assert.ok(slabIntensity(2,3,1)>2);
});
test('Boltzmann source numerical ratios and finite partitions are consistent',()=>{
 rel(boltz(2,5772),4.977744152544208e-9,1e-13);rel(boltz(2,10000),2.8978650979475934e-5,1e-13);
 for(const T of [5772,10000,40000])for(const nmax of [5,10,30]){let sum=0;for(let n=1;n<=nmax;n++)sum+=popFrac(n,T,nmax);near(sum,1,1e-13);}
 assert.ok(popFrac(2,40000,30)<popFrac(2,40000,10)/10);
});
test('Saha ratio agrees with independently integrated electron phase-space density',()=>{
 // Spin2 times phase-space volume/h^3, ground hydrogen weights ion/neutral=1/2.
 let I=0;const n=20000,h=10/n;for(let k=0;k<n;k++){const x=(k+.5)*h;I+=x*x*Math.exp(-x*x)*h;}
 for(const T of [6000,10000,20000])for(const Pe of [.5,20,2000]){
  const transl=8*Math.PI*(2*M_E*K_B*T)**1.5/H_PL**3*I,ratio=.5*transl*Math.exp(-CHI_H*EV/(K_B*T))/(Pe/(K_B*T));rel(sahaRatio(T,Pe),ratio,1e-12);
 }
});
test('Balmer absorber proxy peaks between excitation and ionization and shifts with pressure',()=>{
 const peaks=[];for(const Pe of [.5,20,2000]){let max=0,t=0;for(let T=3000;T<=40000;T+=10){const y=balmerAbsorber(T,Pe);if(y>max){max=y;t=T;}}assert.ok(t>7000&&t<15000);assert.ok(balmerAbsorber(3000,Pe)<max/100);assert.ok(balmerAbsorber(40000,Pe)<max/10);peaks.push(t);}
 assert.ok(peaks[0]<peaks[1]&&peaks[1]<peaks[2]);near(peaks[1],9870,20);
});
test('empirical Eker fit respects calibrated range, solar anchor and published local slopes',()=>{
 near(lumOfMass(1),.9840111057611337,1e-14);near(lumOfMass(10),9332.54300796991,1e-8);
 assert.ok(Number.isNaN(lumOfMass(.1)));assert.ok(Number.isNaN(lumOfMass(40)));
 for(const [M,a] of [[.3,2.028],[.6,4.572],[1,5.743],[2,4.329],[5,3.967],[10,2.865]]){const h=1e-5,d=(Math.log(lumOfMass(M*Math.exp(h)))-Math.log(lumOfMass(M*Math.exp(-h))))/(2*h);near(d,a,1e-9);near(mlSlope(M),a,1e-14);}
});
test('H–R source inputs reproduce tabulated radii, white-dwarf luminosity and qualified catalogue selection',async()=>{
 const {HR_STARS}=await import('../content/astro/hr-data.shared.js');const {readFile}=await import('node:fs/promises');const ledger=JSON.parse(await readFile(new URL('../docs/verification/astro-hr-values.json',import.meta.url)));
 for(const [name,R,T] of ledger.binary_components.rows){const s=HR_STARS.find(r=>r[0]===name);assert.equal(s[1],T);rel(Math.sqrt(s[2])*(5772/T)**2,R,1e-14);}
 for(const [name,T,R] of ledger.white_dwarfs.rows){const s=HR_STARS.find(r=>r[0]===name);assert.equal(s[1],T);rel(Math.sqrt(s[2])*(5772/T)**2,R,1e-14);}
 near(HR_STARS.find(s=>s[0]==='40 Eridani B')[2],.01349,.00001);
 for(const r of ledger.selected_giants){const s=HR_STARS.find(s=>s[0]===`HIP${r.HIP}`);assert.equal(s[1],r.T);assert.equal(s[2],r.L);assert.ok(r.eDist<=.05&&r.distance<200&&r.nIR>=3&&r.EIR>.9&&r.EIR<1.1);}
 const eg=HR_STARS.find(s=>s[0]==='example supergiant');assert.match(eg[4],/chosen illustrative/);
});
