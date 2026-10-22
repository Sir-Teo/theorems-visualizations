import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from '../content/qchem/ch05.shared.js';
import { schrodinger1D } from '../assets/js/viz/math.js';
const near=(a,b,t=2e-12)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} versus ${b}`);

test('H2+ normalized states solve the actual positive-definite generalized pencil',()=>{
 for(const R of[.2,.5,1,2,5,12,20]){
  const q=H.stoIon(R);assert.ok(q.S>0&&q.S<1);assert.ok(q.coupling<0);
  for(const sign of[1,-1]){const norm=Math.sqrt(2*(1+sign*q.S)),c=[1/norm,sign/norm],E=sign===1?q.bonding:q.antibonding;near(c[0]*c[0]+c[1]*c[1]+2*q.S*c[0]*c[1],1);near(q.alpha*c[0]+q.beta*c[1],E*(c[0]+q.S*c[1]));near(q.beta*c[0]+q.alpha*c[1],E*(q.S*c[0]+c[1]));}
 }
 near(H.stoIon(2).bonding,-.5537714953184827);near(H.stoIon(20).bonding,-.5,2e-7);
});
test('interference is normalized and antisymmetric mid-plane remains exactly zero',()=>{
 for(const R of[.2,1,4,10])for(const y of[-5,-1,0,.3,5]){assert.equal(H.stoOrbital(R,0,y,true).psi,0);assert.ok(H.stoOrbital(R,0,y,false).density>0);for(const odd of[false,true]){const q=H.stoOrbital(R,.4,y,odd);near(q.density,(q.a*q.a+q.b*q.b)/(2*(1+(odd?-1:1)*H.stoIon(R).S))+q.interference);}}
});
test('overlap asymmetry requires the stated sign and disappears with orthogonality',()=>{
 for(const S of[0,.2,.7,.9])for(const sign of[-1,1]){const alpha=-1,beta=alpha*S+sign*.4,q=H.overlapLevels(S,alpha,beta);near(q.minusShift/q.plusShift,-(1+S)/(1-S));assert.equal(q.bondingConvention,sign<0);assert.ok(Math.sign(q.plusShift)===sign);}
});
test('Boys F0 has its finite origin value and independent quadrature limits',()=>{
 assert.equal(H.boys0(0),1);assert.equal(H.boys0(Number.MIN_VALUE),1);
 const expected=[[.01,.9966766429033635],[1,.746824132812427],[5,.3957123096105135],[20,.1981663648299737],[36,.14770448757545965],[1000,.028024956081989644]];
 for(const[t,value]of expected)near(H.boys0(t),value,5e-15);
 for(let t=0;t<35;t+=.37)assert.ok(H.boys0(t+.1)<H.boys0(t));
});
test('Gaussian HL includes electron repulsion and the overlap-weighted nuclear term once',()=>{
 for(const R of[.5,1.4,3,8,12])for(const a of[.15,.3,.7,1.5]){
  const q=H.gaussianPair(R,a);near((q.singlet-q.repulsion)*(1+q.S*q.S),q.direct+q.exchange);near((q.triplet-q.repulsion)*(1-q.S*q.S),q.direct-q.exchange);near(q.onSite,2*Math.sqrt(a/Math.PI));near(q.separated,2*(1.5*a-2*Math.sqrt(2*a/Math.PI)));assert.ok(q.electronDirect>0&&q.electronExchange>0);
 }
 // Independent 50-digit Cartesian/Fourier quadrature, not the JS Boys implementation.
 const q=H.gaussianPair(1.4,.3);near(q.singlet,-.9600846557357797);near(q.triplet,-.5459283505768487);near(q.ciEnergy,-.9621957130260516);
});
test('spin symmetry enforces an exchange node in the actual two-electron axis slice',()=>{
 for(const x of[-5,-1,0,.2,3]){assert.equal(H.pairAmplitude(1.6,.3,x,x,true).psi,0);for(const triplet of[false,true]){const a=H.pairAmplitude(1.6,.3,x,.7,triplet),b=H.pairAmplitude(1.6,.3,.7,x,triplet);near(a.psi,(triplet?-1:1)*b.psi);}}
});
test('two-configuration CI minimizes its Rayleigh quotient and cancels ionic amplitude',()=>{
 for(const R of[.5,1.4,3,8,12])for(const a of[.15,.3,.7,1.5]){const q=H.gaussianPair(R,a);near(q.ciNorm,1);near(q.Hgg*q.cg+q.Hgu*q.cu,q.ciEnergy*q.cg);near(q.Hgu*q.cg+q.Huu*q.cu,q.ciEnergy*q.cu);assert.ok(q.ciEnergy<=q.Hgg+2e-12);for(const theta of[-Math.PI/2,-1,-.3,0,.3,1,Math.PI/2])assert.ok(H.ciMix(R,a,theta).energy>=q.ciEnergy-2e-12);const angle=Math.atan2(-(1-q.S),1+q.S),hl=H.ciMix(R,a,angle);near(hl.ionicAmplitude,0);near(hl.energy,q.singlet);}
 const q=H.gaussianPair(12,.3);near(q.singlet,q.separated,1e-12);near(q.ciEnergy,q.separated,1e-12);assert.ok(q.Hgg-q.separated>.2);
});
test('MO counts preserve electrons, Pauli capacities and Hund occupancy in both orderings',()=>{
 for(let n=0;n<=16;n++)for(const early of[false,true]){const q=H.moOccupation(n,early);assert.equal(q.levels.reduce((s,l)=>s+l.n,0),n);assert.equal(q.bonding+q.antibonding,n);for(const l of q.levels){assert.equal(l.slots.reduce((a,b)=>a+b),l.n);assert.ok(l.slots.every(x=>x<=2&&x>=0));}near(q.bondOrder,(q.bonding-q.antibonding)/2);}
 for(const[n,bond,unpaired]of[[2,1,0],[4,0,0],[6,1,2],[8,2,0],[10,3,0],[12,2,2],[14,1,0],[16,0,0]]){const q=H.moOccupation(n,n<=10);assert.equal(q.bondOrder,bond);assert.equal(q.unpaired,unpaired);}
});
test('spin-only S=1 response has zero-field symmetry and actual normalized populations',()=>{
 for(const x of[0,1e-10,.1,1,5]){const q=H.spinTriplet(x),negative=H.spinTriplet(-x);near(q.probabilities.reduce((a,b)=>a+b),1);near(q.mean,-negative.mean);near(q.mean,2*Math.sinh(x)/(1+2*Math.cosh(x)));assert.ok(q.mean>=0&&q.mean<1);}
 assert.ok(H.spinTriplet(1e-200).mean>0);near(H.spinTriplet(1e-200).mean/1e-200,2/3);
 near(H.spinTriplet(0).probabilities[0],1/3);assert.equal(H.spinTriplet(0).mean,0);
});
test('same-symmetry sigma repulsion can cross a different-symmetry pi reference',()=>{
 const tiny=H.sigmaMix(2,1e-8,0);assert.ok(tiny.upper>0&&tiny.upperAbovePi);near(tiny.upper,5e-17,1e-30);assert.ok(H.sigmaMix(2,1e-200,0).shiftUnderflow);
 assert.ok(H.sigmaMix(.2,1,.2).upperAbovePi);assert.ok(!H.sigmaMix(8,1,.2).upperAbovePi);
 for(const d of[.2,2,8])for(const t of[0,.1,1,2]){const q=H.sigmaMix(d,t);near(q.upper+q.lower,-d);near(q.upper*q.lower,-t*t);assert.ok(q.upper>=0&&q.lower<=-d);assert.ok(q.pUpper>=.5&&q.pUpper<=1);}
});
test('orthogonal two-site populations conserve neutral charge and signed dipole',()=>{
 assert.ok(H.polarPair(1e-200,1).dipole<0);
 for(const d of[-5,-1,0,1,5])for(const t of[.1,1,2]){const q=H.polarPair(d,t,3);near(q.pA+q.pB,1);near(q.qA+q.qB,0);near(q.dipole,-3*d/q.gap);near(q.pA,H.polarPair(-d,t,3).pB);assert.ok(q.pA>0&&q.pB>0);}
});
test('Morse exact full-line levels omit threshold equality; finite box stays a diagnostic',()=>{
 for(const lambda of[.25,.5,1.5,2.5,5,12]){const q=H.morseModel(lambda);assert.equal(q.levels.length,Math.max(0,Math.ceil(lambda-.5)));for(const l of q.levels){assert.ok(l.binding>0&&l.energy<q.threshold);near(l.energy,2*lambda*(l.n+.5)-(l.n+.5)**2);}}
 const tiny=H.morseModel(2,1e-10);near(tiny.potential/(4e-20),1,2e-10);const threshold=H.morseModel(.5000000000000001);assert.ok(threshold.levels[0].binding>0);assert.ok(threshold.levels[0].energyAtThresholdByRounding);assert.ok(H.morseModel(2,1e-200).potentialUnderflow);
 const a=H.morseGrid(schrodinger1D,2,160),b=H.morseGrid(schrodinger1D,2,320);assert.ok(Math.abs(b.comparison[0].error)<Math.abs(a.comparison[0].error));assert.ok(b.comparison[0].error<0);const empty=H.morseGrid(schrodinger1D,.5,160);assert.equal(empty.comparison[0].exact,null);assert.ok(empty.comparison[0].energy>.25);
});
test('Lewis electron budgets and formal charges expose the boron octet exception',()=>{
 for(const[p,i]of H.LEWIS_PRESETS.map((p,i)=>[p,i])){const q=H.lewisMolecule(i,p.bond,p.lone);assert.ok(q.budgetMatch&&q.chargeMatch&&q.terminalShellMatch);assert.equal(q.central.shellElectrons,i===4?6:8);assert.equal(q.central.formalCharge,i===3?1:0);for(let b=0;b<=3;b++)for(let l=0;l<=4;l++){const x=H.lewisMolecule(i,b,l);assert.equal(x.formalCharge,p.charge+x.budget-x.drawn);}}
});
test('computed minimal LCAO equilibrium and curvature agree with independent stencil',()=>{
 const q=H.ionMinimum();near(q.R,2.4928304,1e-6);near(q.bonding,-.5648309923708077);assert.ok(q.binding>0&&q.curvature>0);const h=.002,d=(H.stoIon(q.R-2*h).bonding-8*H.stoIon(q.R-h).bonding+8*H.stoIon(q.R+h).bonding-H.stoIon(q.R+2*h).bonding)/(12*h);assert.ok(Math.abs(d)<1e-7);
});
test('invalid and nonfinite domain inputs never become fabricated chemistry',()=>{
 for(const f of[()=>H.stoIon(0),()=>H.boys0(-1),()=>H.gaussianPair(.1),()=>H.gaussianPair(2,NaN),()=>H.moOccupation(1.1),()=>H.spinTriplet(Infinity),()=>H.polarPair(1,0),()=>H.morseModel(.1),()=>H.lewisMolecule(6),()=>H.lewisMolecule(0,.1),()=>H.morseGrid(schrodinger1D,2,200)])assert.throws(f,RangeError);
});
test('all thirteen frozen identities and rich metadata remain synchronized; both originals flagged',async()=>{
 const fs=await import('node:fs'),a=(await import('../content/qchem/ch05.js')).default,b=(await import('../content/qchem/ch05-b.js')).default,s=(await import('../content/qchem/syllabus.js')).default,items=[...a.items,...b.items],plan=JSON.parse(fs.readFileSync(new URL('../docs/wave-five-plan.json',import.meta.url))).chapters.find(c=>c.collection==='qchem'&&c.chapter===5),id=i=>[i.num,i.kind,i.name];
 assert.deepEqual(items.map(id),plan.items.map(id));const ch=s.chapters.find(c=>c.n===5);assert.deepEqual(ch.items[0],{num:'5.1',alias:'qm-12.5',name:'Born–Oppenheimer approximation'});assert.deepEqual(items.filter(i=>i.verify).map(i=>i.num),['5.13','5.14']);
 for(const i of items){const row=ch.items.find(r=>r.num===i.num);for(const k of['kind','name','deps','refs','see','paper','introduces','verify'])assert.deepEqual(row[k],i[k]);assert.equal(row.pic,i.caption);assert.equal(typeof i.viz,'function');assert.ok(i.statement&&i.idea&&i.scope);assert.ok(!i.deps.some(d=>['qchem-5.1','qm-12.5','qm-10.2','qchem-3.13'].includes(d)));}
});
