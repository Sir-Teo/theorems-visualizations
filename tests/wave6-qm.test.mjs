import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from '../content/qm/ch09.shared.js';
const Q=H.Q,close=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cclose=(a,b,t=1e-10)=>{close(a[0],b[0],t);close(a[1],b[1],t);};
test('QM9 unitary and antiunitary qubit actions preserve every tested transition, a stretch fails',()=>{
 for(const mode of ['unitary','antiunitary'])for(const angle of [0,.8,Math.PI,6.2]){const q=H.wigner(mode,angle);assert.ok(q.maxError<5e-16);q.images.forEach(x=>close(Math.hypot(...x),1));for(const r of q.states){const psi=Q.stateOf(r),mapped=Q.stateOf(q.map(r));close(Q.cabs2(Q.ip(psi,psi)),Q.cabs2(Q.ip(mapped,mapped)));}}
 assert.ok(H.wigner('stretched',.8,1.5).maxError>.08);assert.ok(H.wigner('stretched',.8,1).maxError<1e-15);
});
test('QM9 conserved-generator expectation and symmetry-breaking drift solve the same Hamiltonian',()=>{
 for(const epsilon of [0,.3,1])for(const time of [0,.5,3]){const q=H.conservation(epsilon,1,.8,time),h=1e-5;close(q.energy,q.initialEnergy);close((H.conservation(epsilon,1,.8,time+h).g-H.conservation(epsilon,1,.8,time-h).g)/(2*h),q.rhs,1e-9);close(Math.hypot(...q.state),1);if(!epsilon)close(q.g,q.initial[2]/2);}
});
test('QM9 Fourier translation uses the active sign, preserves norm and composes exactly',()=>{
 for(const shift of [-Math.PI,.37,2.8]){const p=H.fourierPacket(.7,1.6,-.8),c=p.translate(shift);close(Q.vnorm(c),1);for(const x of [-2.2,0,1.7])cclose(p.wave(x,c),p.wave(x-shift));c.forEach((z,i)=>close(Q.cabs2(z),Q.cabs2(p.coeffs[i])));const sum=Array.from({length:128},(_,i)=>Q.cabs2(p.wave(H.TAU*i/128,c))).reduce((a,b)=>a+b)*H.TAU/128;close(sum,1);}
});
test('QM9 parity projections are orthogonal and reconstruct the original complex wave',()=>{
 const p=H.fourierPacket(.4,2,1.2);close(p.evenWeight+p.oddWeight,1);cclose(Q.ip(p.even,p.odd),[0,0]);close(p.parity,p.evenWeight-p.oddWeight);for(const x of [-2.3,-.1,1]){cclose(p.wave(x,p.even),p.wave(-x,p.even));cclose(p.wave(x,p.odd),Q.cscale(p.wave(-x,p.odd),-1));cclose(p.wave(x),Q.cadd(p.wave(x,p.even),p.wave(x,p.odd)));}
});
test('QM9 discrete symmetric well has alternating parity and a resolved eigenproblem',()=>{
 for(const a of [-.5,.5]){const q=H.well(a,.1,0,65);q.parities.slice(0,8).forEach((p,i)=>close(p,(-1)**i));assert.ok(Math.max(...q.residuals)<2e-12);for(let i=0;i<6;i++){close(dot(q.states[i],q.states[i])*q.dx,1);for(let j=0;j<i;j++)close(dot(q.vectors[i],q.vectors[j]),0);}}
 const tilted=H.well(-.5,.1,.15,65);assert.ok(Math.abs(tilted.parities[0])<.9);
});
test('QM9 harmonic finite differences converge to independently known oscillator energies',()=>{
 const coarse=H.well(.5,0,0,31,6),fine=H.well(.5,0,0,65,6),finest=H.well(.5,0,0,129,6);
 for(let i=0;i<4;i++){const E=i+.5,a=Math.abs(coarse.values[i]-E),b=Math.abs(fine.values[i]-E),c=Math.abs(finest.values[i]-E);assert.ok(a/b>12&&b/c>12);assert.ok(c<5e-5);}
});
test('QM9 dipole parity zeros are calculated, and opposite parity is only a necessary condition',()=>{
 const q=H.well(.5,.05,0),D=H.dipoles(q);for(let i=0;i<6;i++)for(let j=0;j<6;j++){close(D[i][j],D[j][i]);if((i+j)%2===0)assert.ok(Math.abs(D[i][j])<2e-13);}
 assert.ok(Math.abs(D[0][1])>.5);assert.ok(Math.abs(D[0][3])>.001);const tilted=H.dipoles(H.well(.5,.05,.15));assert.ok(Math.abs(tilted[0][0])>.05);
});
test('QM9 computed Bloch eigenvectors have periodic amplitudes and the stated cell phase',()=>{
 for(const k of [-Math.PI,-.4,0,1.2,Math.PI])for(const V of [0,8,20]){const q=H.bloch(k,V);assert.ok(Math.max(...q.residuals)<2e-12);for(let band=0;band<3;band++){for(const x of [-.3,.2,1.7]){cclose(q.periodic(x+1,band),q.periodic(x,band));cclose(q.wave(x+1,band),Q.cmul(Q.cis(k),q.wave(x,band)));}const norm=Array.from({length:32},(_,i)=>Q.cabs2(q.periodic(i/32,band))).reduce((a,b)=>a+b)/32;close(norm,1);if(V===0){const ref=q.modes.map(n=>(k+H.TAU*n)**2).sort((a,b)=>a-b);close(q.values[band],ref[band]);}}close(q.values[0],H.bloch(-k,V).values[0]);}
});
test('QM9 plane-wave cutoff convergence is measured rather than asserting an exact continuum spectrum',()=>{
 for(const k of [-Math.PI,.8,Math.PI]){const a=H.bloch(k,20,4),b=H.bloch(k,20,6);a.values.slice(0,3).forEach((E,i)=>close(E,b.values[i],2e-10));}
});
test('QM9 rectangular cell trace agrees with independent propagating and evanescent formulas',()=>{
 for(const E of [.1,3,10,18,40]){const V=10,f=.3,k=Math.sqrt(E),d=1-f;let ref;if(E>V){const q=Math.sqrt(E-V);ref=Math.cos(k*d)*Math.cos(q*f)-(k*k+q*q)/(2*k*q)*Math.sin(k*d)*Math.sin(q*f);}else if(E<V){const q=Math.sqrt(V-E);ref=Math.cos(k*d)*Math.cosh(q*f)+(q*q-k*k)/(2*k*q)*Math.sin(k*d)*Math.sinh(q*f);}else ref=Math.cos(k*d)-k*f/2*Math.sin(k*d);const q=H.kronig(E,V,f,5);close(q.trace,ref);close(q.cell[0][0]*q.cell[1][1]-q.cell[0][1]*q.cell[1][0],1);close(q.ledger,1);assert.equal(q.allowed,Math.abs(ref)<=1);}
 assert.deepEqual(H.layer(10,10,.3),[[1,.3],[0,1]]);for(const E of [.1,1,8])close(H.kronig(E,0,.6,8).T,1);for(const n of [0,1,5,10]){const q=H.kronig(.05,20,.6,n);close(q.ledger,1);assert.ok(q.T>=0&&q.R>=0);}
});
test('QM9 open and periodic finite chains reproduce independently quantized levels',()=>{
 for(const N of [4,8,17])for(const t of [0,.3,1])for(const boundary of ['open','periodic']){const q=H.chain(N,t,boundary);q.values.forEach((E,i)=>close(E,q.analytic[i]));assert.ok(Math.max(...q.residuals)<2e-13);close(q.values.reduce((a,b)=>a+b),0);}
});
function rk4(A,initial,time,steps){let psi=initial.map(z=>z.slice()),dt=time/steps;const f=p=>Q.mvec(A.map(row=>row.map(x=>[x,0])),p).map(z=>[z[1],-z[0]]),plus=(p,k,c)=>p.map((z,i)=>Q.cadd(z,Q.cscale(k[i],c)));for(let i=0;i<steps;i++){const a=f(psi),b=f(plus(psi,a,dt/2)),c=f(plus(psi,b,dt/2)),d=f(plus(psi,c,dt));psi=psi.map((z,j)=>Q.cadd(z,Q.cscale(Q.cadd(Q.cadd(a[j],Q.cscale(b[j],2)),Q.cadd(Q.cscale(c[j],2),d[j])),dt/6)));}return psi;}
test('QM9 Bloch packet evolution agrees with independent Runge–Kutta and recurs over the Bloch period',()=>{
 const d=H.blochDynamics(.7,.8,51),q=d.evolve(3,.6,.7),ref=rk4(d.A,q.initial,.7,1400);q.psi.forEach((z,i)=>cclose(z,ref[i],2e-11));close(q.norm,1);close(q.mean,q.prediction,2e-10);const period=d.evolve(3,.6,H.TAU/.8);close(period.returnFidelity,1,2e-10);assert.ok(period.fidelityResolved);assert.ok(q.fidelityResolved);assert.ok(q.errorEstimate<1e-7);const tiny=H.blochDynamics(1,.6,81).evolve(3,.5,.4*H.TAU/.6);assert.ok(tiny.returnFidelity<1e-20);assert.equal(tiny.fidelityResolved,false);assert.ok(period.edgeProbability<1e-12);const free=H.blochDynamics(.7,0,51).evolve(3,.6,2);close(free.mean,free.prediction,2e-10);
});
test('QM9 spinless time-reversal echo requires the corresponding field transformation',()=>{
 for(const flux of [0,.7,1.8]){const q=H.timeReversal(flux,7,true);close(q.fidelity,1,2e-12);close(q.norm,1,2e-12);if(!flux)close(H.timeReversal(flux,7,false).fidelity,1,2e-12);else assert.ok(H.timeReversal(flux,7,false).fidelity<.999);}
});
test('QM9 nontrivial Kramers Hamiltonians obey antiunitary algebra and an independent closed spectrum',()=>{
 for(const seed of [1,17,532,9999])for(const field of [0,.2,.8]){const q=H.kramers(seed,field);q.values.forEach((E,i)=>close(E,q.analytic[i]));assert.ok(q.overlap<1e-28);assert.ok(q.thetaSquareResidual<1e-14);if(!field){close(q.values[0],q.values[1]);close(q.values[2],q.values[3]);assert.ok(q.partnerEnergyResidual<1e-13);assert.ok(q.breaking<1e-13);}else{assert.ok(q.partnerEnergyResidual>.01);assert.ok(q.breaking>.1);}}
});
test('QM9 rotational multiplets stay degenerate until a specified quadrupole breaks the symmetry',()=>{
 for(const ell of [0,1,2,3]){const base=H.multiplet(ell,0);base.values.forEach(E=>close(E,ell*(ell+1)));close(base.rotationalBreaking,0);for(const angle of [0,.6,Math.PI/2]){const q=H.multiplet(ell,.7,angle);close(q.values.reduce((a,b)=>a+b),q.base*(2*ell+1));if(ell)assert.ok(q.rotationalBreaking>.1);if(angle===0){const ref=Array.from({length:2*ell+1},(_,i)=>q.base+.7*((ell-i)**2-q.base/3)/Math.max(1,ell*ell)).sort((a,b)=>a-b);q.values.forEach((E,i)=>close(E,ref[i]));}}}
});

import chapter from '../content/qm/ch09.js';
import syllabus from '../content/qm/syllabus.js';
const frozen=[{"num": "9.1", "kind": "Theorem", "name": "Wigner’s theorem", "deps": ["qm-5.1", "qm-5.15"]}, {"num": "9.2", "kind": "Theorem", "name": "Symmetries give conservation laws", "deps": ["qm-9.1", "qm-5.18", "mech-7.3"]}, {"num": "9.3", "kind": "Definition", "name": "Translation operator", "deps": ["qm-9.1", "qm-2.10"]}, {"num": "9.4", "kind": "Definition", "name": "Parity", "deps": ["qm-9.1"]}, {"num": "9.5", "kind": "Theorem", "name": "Bound states of symmetric potentials have parity", "deps": ["qm-9.4", "qm-3.8"]}, {"num": "9.6", "kind": "Theorem", "name": "Parity selection rules", "deps": ["qm-9.4", "qm-8.7"]}, {"num": "9.7", "kind": "Theorem", "name": "Bloch’s theorem", "deps": ["qm-9.3", "waves-3.10"]}, {"num": "9.8", "kind": "Model", "name": "Kronig–Penney model", "deps": ["qm-9.7", "qm-3.19"]}, {"num": "9.9", "kind": "Model", "name": "Tight-binding chain", "deps": ["qm-9.7", "qm-3.17"]}, {"num": "9.10", "kind": "Phenomenon", "name": "Bloch oscillations", "deps": ["qm-9.9", "qm-2.13"]}, {"num": "9.11", "kind": "Definition", "name": "Time reversal is antiunitary", "deps": ["qm-9.1"]}, {"num": "9.12", "kind": "Theorem", "name": "Kramers degeneracy", "deps": ["qm-9.11", "qm-7.8"]}, {"num": "9.13", "kind": "Theorem", "name": "Rotational invariance implies m-degeneracy", "deps": ["qm-9.2", "qm-7.6"]}];
test('QM9 preserves every frozen identity and dependency with synchronized teaching metadata',()=>{
 const planned=syllabus.chapters.find(c=>c.n===9),strip=i=>Object.fromEntries(Object.entries(i).filter(([k])=>!['refs','pic'].includes(k)));
 assert.deepEqual(planned.items.map(strip),frozen);assert.equal(chapter.items.length,13);
 for(const item of chapter.items){const old=frozen.find(x=>x.num===item.num);for(const [k,v] of Object.entries(old))assert.deepEqual(item[k],v);for(const key of ['statement','idea','caption','scope'])assert.ok(item[key]?.length>50);assert.equal(typeof item.viz,'function');const target=planned.items.find(x=>x.num===item.num);assert.deepEqual(item.refs,target.refs);assert.equal(item.caption,target.pic);}
});
