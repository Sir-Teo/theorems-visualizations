import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from '../content/thermo/ch08.shared.js';
const close=(a,b,t=2e-10,abs=1e-13)=>assert.ok(Math.abs(a-b)<=abs+t*Math.abs(b),`${a} != ${b}`);
function simpson(f,a,b,n=8192){let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+(b-a)*i/n);return s*(b-a)/(3*n);}
function convolution(a,b){const out=Array(a.length+b.length-1).fill(0);a.forEach((x,i)=>b.forEach((y,j)=>out[i+j]+=x*y));return out;}
test('THERMO8 finite Gibbs weights, actual samples and reservoir response',()=>{
 for(const T of[.2,1,3])for(const mu of[-1,1,3])for(const U of[-.5,0,2]){const q=H.grandSites(T,mu,U,17,4096),Z=q.states.reduce((s,r)=>s+Math.exp((mu*r.N-r.E)/T),0);for(const r of q.states)close(r.p,Math.exp((mu*r.N-r.E)/T)/Z);close(q.states.reduce((s,r)=>s+r.p,0),1);close(q.counts.reduce((a,b)=>a+b),4096);const h=1e-5;close((H.grandSites(T,mu+h,U,17,1).meanN-H.grandSites(T,mu-h,U,17,1).meanN)/(2*h),q.response,3e-8);}
 const a=H.grandSites(1,1,.2,4,65536);assert.deepEqual(a,H.grandSites(1,1,.2,4,65536));a.states.forEach((s,i)=>assert.ok(Math.abs(a.counts[i]/a.count-s.p)<.008));
});
test('THERMO8 number distributions agree with independent single-mode convolutions',()=>{
 for(const kind of['fermion','boson','classical'])for(const x of[-3,-1,-.3]){const q=Math.exp(x),single=kind==='fermion'?[1/(1+q),q/(1+q)]:kind==='boson'?Array.from({length:401},(_,n)=>(1-q)*q**n):Array.from({length:101},(_,n)=>{let p=Math.exp(-q);for(let j=1;j<=n;j++)p*=q/j;return p;});const dist=convolution(single,single),r=H.numberLaw(x,2,kind,180);r.probs.forEach((p,n)=>close(p,dist[n]||0));let mean=0,second=0;dist.forEach((p,n)=>{mean+=n*p;second+=n*n*p;});close(r.mean,mean);close(r.variance,second-mean*mean);const h=1e-5;close((H.numberLaw(x+h,2,kind).mean-H.numberLaw(x-h,2,kind).mean)/(2*h),r.variance,2e-8);}
 const long=H.numberLaw(-.2,16,'boson');assert.ok(long.tail>0);close(long.probs.reduce((a,b)=>a+b)+long.tail,1);
});
test('THERMO8 mode occupancies come from their actual allowed occupation sums',()=>{
 for(const x of[.02,.3,2,20]){let Z=0,N=0;for(let n=0;n<10000;n++){const p=Math.exp(-n*x);Z+=p;N+=n*p;}close(H.bose(x),N/Z,3e-12);close(H.fermi(x),Math.exp(-x)/(1+Math.exp(-x)));}
 assert.equal(H.occupancy(.5,1,0),1);assert.equal(H.occupancy(2,1,0),0);assert.equal(H.occupancy(1,1,0),.5);assert.equal(H.bose(0),Infinity);assert.ok(Number.isNaN(H.bose(-1)));close(H.fermi(1000),0);close(H.fermi(-1000),1);
});
test('THERMO8 generated Gaussian rule integrates polynomial moments',()=>{for(let n=0;n<=30;n++)close(H.integrate(x=>x**n,-1,1),n%2?0:2/(n+1),1e-13);});
test('THERMO8 Fermi integrals retain dilute tails and independent real-space quadrature',()=>{
 for(const p of[-.5,.5,1.5])for(const mu of[-5,0,1,3])for(const T of[.05,.5,2]){const ref=simpson(y=>2*y**(2*p+1)/(1+Math.exp((y*y-mu)/T)),0,Math.sqrt(Math.max(mu,0)+40*T));close(H.fermiIntegral(p,mu,T),ref,2e-9);}
 close(H.fermiIntegral(.5,-120,1)/Math.exp(-120),Math.sqrt(Math.PI)/2,3e-12);close(H.fermiIntegral(1.5,2,0),2**2.5/2.5);
});
test('THERMO8 fixed-density heat capacity differentiates the solved energy',()=>{
 for(const T of[.01,.03,.1,.5,1,2]){const q=H.fermiThermo(T),h=T*1e-4;close(q.number,2/3);close(q.pressurePer,2*q.energyPer/3);close(q.cv,(H.fermiThermo(T+h).energyPer-H.fermiThermo(T-h).energyPer)/(2*h),8e-8);assert.ok(q.cv>=0);}
 const q=H.fermiThermo(.005);close(q.cv/q.T,Math.PI**2/2,8e-5);close(H.fermiThermo(0).energyPer,.6);assert.equal(H.fermiThermo(0).cv,0);
});
test('THERMO8 spin populations solve the density constraint including complete polarization',()=>{
 for(const T of[0,.1,.5])for(const b of[0,.01,.7,2]){const q=H.pauli(T,b);close(q.number,2/3);close(H.pauli(T,-b).polarization,-q.polarization);assert.ok(Math.abs(q.polarization)<=1+1e-13);if(T===0){close(q.up,Math.max(0,q.mu+b)**1.5/3);close(q.down,Math.max(0,q.mu-b)**1.5/3);}}
 for(const T of[0,.1,.5])close(H.pauli(T,1e-5).polarization/1e-5,H.pauli(T,0).weakSlope,3e-8);close(H.pauli(0,2).polarization,1);
});
test('THERMO8 Landau sum agrees with an independent fugacity expansion and weak-field curvature',()=>{
 for(const T of[.4,.7])for(const b of[.04,.2,.6]){const mu=-2,q=H.landau(T,b,mu);let ref=0;for(let k=1;k<80;k++)ref+=(-1)**k*Math.exp(k*mu/T)/(k**1.5*2*Math.sinh(k*b/(2*T)));ref*=b*T*Math.sqrt(Math.PI*T)/2;close(q.omega,ref,3e-11);assert.ok(q.tailBound<1e-14);}
 for(const T of[.1,.3]){const q=H.landau(T,.01);close(q.ratio,1,2e-6);assert.ok(q.delta>0);close(q.coefficient,H.fermiIntegral(-.5,1,T)/48);}
 // b=2 μB B / EF: orbital curvature is -8*coefficient; Pauli response is I[-1/2]/2.
 const q=H.landau(.1,.01);close(-8*q.coefficient/(H.fermiIntegral(-.5,1,.1)/2),-1/3);
});
test('THERMO8 thermal wavelength and quantum concentration keep units and spin degeneracy explicit',()=>{
 const q=H.thermalScales(300,8.5e28,H.M_E,2),hot=H.thermalScales(1200,8.5e28,H.M_E,2);close(q.lambda/hot.lambda,2);close(q.degeneracy,8.5e28*q.lambda**3/2);close(q.nQ*q.lambda**3,2);close(q.spacing**3*8.5e28,1);assert.ok(q.degeneracy>1);
 const f=H.fermiScales(8.5e28);close(f.kF**3,3*Math.PI**2*8.5e28);close(f.P0/(8.5e28*f.EF),.4);assert.ok(f.TF>50000&&f.TF<100000);
});
test('THERMO8 box enumeration includes every state below the spherical energy boundary',()=>{
 for(const d of[1,2,3])for(const cutoff of[3,10,37,100]){const r=H.boxStates(d,cutoff,9),ref=[];for(let i=1;i<=10;i++)for(let j=1;j<=(d>=2?10:1);j++)for(let k=1;k<=(d===3?10:1);k++){const E=i*i+(d>=2?j*j:0)+(d===3?k*k:0);if(E<=cutoff)ref.push(E);}assert.deepEqual(r.energies,ref.sort((a,b)=>a-b));assert.equal(r.counts.reduce((a,b)=>a+b),ref.length);close(r.expected.reduce((a,b)=>a+b),r.weyl(cutoff));}
 assert.deepEqual(H.boxStates(3,3).energies,[3]);
});
test('THERMO8 dilute statistics use relative occupation errors and density integrals',()=>{
 for(const z of[.0001,.01,.5,.9]){const r=H.classical(z,.7);close(Math.abs(r.fd/r.mb-1),r.fdRelative);close(r.be/r.mb-1,r.beRelative);assert.ok(r.fd<r.mb&&r.mb<r.be);assert.ok(r.fermiDensity<z&&z<r.boseDensity);}
 close(H.classical(.0001).fermiDensity/.0001,1,4e-5);close(H.classical(.0001).boseDensity/.0001,1,4e-5);
});
test('THERMO8 intrinsic carriers enforce neutrality and recover the nondegenerate prefactor',()=>{
 for(const T of[100,300,900])for(const Eg of[.2,1.1,2])for(const[me,mh]of[[1,1],[.1,2],[2,.1]]){const q=H.intrinsic(T,Eg,me,mh);close(q.n,q.p,5e-12,1e-100);close(q.muMB,Eg/2+.75*q.kT*Math.log(mh/me));close(q.nMB,2*(2*Math.PI*H.M_E*H.K_B*T/H.H_PLANCK**2)**1.5*(me*mh)**.75*Math.exp(-Eg/(2*q.kT)),1e-13,1e-100);if(Eg/(2*q.kT)>15)close(q.n,q.nMB,1e-5,1e-100);if(me===mh)close(q.mu,Eg/2);}
 const q=H.intrinsic(900,.2,.1,2);assert.ok(q.relativeMB>.01);
});
test('THERMO8 Bose integrals agree with independent series and zeta values',()=>{
 for(const s of[1,1.5,2,2.5,3])for(const a of[.1,1,10]){let sum=0;for(let k=1;k<3000;k++)sum+=Math.exp(-a*k)/k**s;close(H.boseIntegral(s,a),sum,2e-11,1e-16);}
 close(H.boseIntegral(2,0),Math.PI**2/6);close(H.boseIntegral(2.5,0),1.3414872572509172,2e-12);assert.equal(H.boseIntegral(1,0),Infinity);
 close(H.boseIntegral(1,100),3.720075976020836e-44,2e-14,0);close(H.uniform2D(1e-20).recovered,1e-20,2e-14,0);
});
test('THERMO8 homogeneous condensation conserves particles on both sides of Tc',()=>{
 for(const t of[0,.3,.99,1,1.0001,1.2,2,4]){const q=H.condensate(t);close(q.fraction+q.excited,1);if(t>1)close(t**1.5*H.boseIntegral(1.5,q.a)/H.ZETA_3_2,1);else close(q.fraction,1-t**1.5);}
});
test('THERMO8 near-condensation Bose boundary layers match 65-digit independent polylogarithms',()=>{
 for(const[s,a,ref]of[[1.5,1e-12,2.6123718037792468868],[1.5,1e-8,2.6120208725188523178],[2,1e-12,1.6449340668195954154],[2,1e-8,1.6449338726414189719]])close(H.boseIntegral(s,a),ref,3e-14,0);
});
test('THERMO8 two-dimensional infrared capacity diverges while the three-dimensional one saturates',()=>{
 for(const x of[1e-6,1e-4,.01]){close(H.infraredCapacity(2,x),-Math.log(x),x);assert.ok(H.infraredCapacity(3,x)<H.ZETA_3_2);}
 assert.ok(H.infraredCapacity(2,1e-6)>H.infraredCapacity(2,1e-4));close(H.infraredCapacity(3,1e-8),H.ZETA_3_2-4/Math.sqrt(Math.PI)*1e-4,2e-10);
 for(const density of[.1,1,10,20])close(H.uniform2D(density).recovered,density,1e-12);
});
test('THERMO8 finite oscillator shell counting agrees with explicit Cartesian levels',()=>{
 for(const d of[2,3]){const q=H.trap(50,.6,d);let explicit=0;for(let i=0;i<=q.last;i++)for(let j=0;j<=q.last-i;j++)for(let k=0;k<=(d===3?q.last-i-j:0);k++)explicit+=H.bose((i+j+k)/q.tau+q.a);close(explicit,50,2e-11);close(q.ground+q.excited,50);assert.ok(q.tailBound<1e-10);assert.ok(H.trap(1000,1.2,d).fraction>0);}
 assert.equal(H.trap(1000,0).fraction,1);assert.ok(Math.abs(H.trap(10000,.6).fraction-(1-.6**3))<Math.abs(H.trap(100,.6).fraction-(1-.6**3)));
});
test('THERMO8 helium approximation uses an actual excitation minimum and phonon power laws',()=>{
 const q=H.helium(),r=H.helium({T:.6});close(r.rhoNormal/q.rhoNormal,16);close(r.cvVolume/q.cvVolume,8);close(q.energy(q.pstar)/q.pstar,q.critical);assert.ok(q.idealTc>3&&q.idealTc<3.3);assert.ok(q.critical>50&&q.critical<70);
 for(let i=1;i<=2000;i++){const p=q.p0*i/1000;assert.ok(q.energy(p)-.99*q.critical*p>=-1e-35);}assert.ok(q.energy(q.pstar)-1.01*q.critical*q.pstar<0);
});

import chapter from '../content/thermo/ch08.js';
import syllabus from '../content/thermo/syllabus.js';
const frozen=[{"num": "8.1", "kind": "Theorem", "name": "Gibbs factor and grand partition function", "deps": ["thermo-6.1", "thermo-3.2"]}, {"num": "8.2", "kind": "Theorem", "name": "Particle-number fluctuations", "deps": ["thermo-8.1"]}, {"num": "8.3", "alias": "pchem-11.4", "name": "Langmuir adsorption isotherm"}, {"num": "8.4", "kind": "Theorem", "name": "Fermi–Dirac distribution", "deps": ["thermo-8.1", "qm-10.3"]}, {"num": "8.5", "kind": "Theorem", "name": "Bose–Einstein distribution", "deps": ["thermo-8.1", "qm-10.1"]}, {"num": "8.6", "kind": "Theorem", "name": "Classical limit of quantum statistics", "deps": ["thermo-8.4", "thermo-8.5", "thermo-6.16"]}, {"num": "8.7", "kind": "Definition", "name": "Quantum concentration and thermal wavelength", "deps": ["thermo-8.6", "qm-1.9"]}, {"num": "8.8", "kind": "Definition", "name": "Density of states", "deps": ["qm-8.1", "waves-2.8"]}, {"num": "8.9", "kind": "Model", "name": "Degenerate Fermi gas", "deps": ["thermo-8.4", "thermo-8.8", "qm-10.11"]}, {"num": "8.10", "kind": "Theorem", "name": "Sommerfeld expansion: electronic heat capacity", "deps": ["thermo-8.9"]}, {"num": "8.11", "kind": "Model", "name": "Pauli paramagnetism", "deps": ["thermo-8.9", "qm-7.13"]}, {"num": "8.12", "kind": "Phenomenon", "name": "Landau diamagnetism", "deps": ["thermo-8.9", "qm-6.8", "thermo-6.18"]}, {"num": "8.13", "kind": "Model", "name": "Semiconductors: intrinsic carriers", "deps": ["thermo-8.4", "qm-10.13"]}, {"num": "8.14", "kind": "Phenomenon", "name": "Bose–Einstein condensation", "deps": ["thermo-8.5", "thermo-8.8"]}, {"num": "8.15", "kind": "Theorem", "name": "No condensation in two dimensions", "deps": ["thermo-8.14"]}, {"num": "8.16", "kind": "Phenomenon", "name": "Condensates in harmonic traps", "deps": ["thermo-8.14", "qm-8.2"]}, {"num": "8.17", "kind": "Phenomenon", "name": "Superfluid helium-4", "deps": ["thermo-8.14"]}];
test('THERMO8 frozen identities, dependencies and Langmuir alias remain intact',()=>{
 const S=syllabus.chapters.find(c=>c.n===8),strip=i=>Object.fromEntries(Object.entries(i).filter(([k])=>!['refs','pic'].includes(k)));
 assert.deepEqual(S.items.map(strip),frozen);
 assert.equal(chapter.items.length,16);
 for(const item of chapter.items){const old=frozen.find(a=>a.num===item.num);for(const [key,value] of Object.entries(old))assert.deepEqual(item[key],value);assert.equal(typeof item.viz,'function');for(const key of ['statement','idea','caption','scope'])assert.ok(item[key]?.length>40);const planned=S.items.find(a=>a.num===item.num);assert.deepEqual(item.refs,planned.refs);assert.equal(item.caption,planned.pic);}
 assert.ok(!chapter.items.some(i=>i.num==='8.3'));
});
