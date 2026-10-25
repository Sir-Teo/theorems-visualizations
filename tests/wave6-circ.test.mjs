import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../content/circ/ch06.shared.js';
const {Q}=H;
const F=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-circ-reference.json',import.meta.url))).families;
const near=(a,b,label='number',{relative=3e-10,absolute=3e-12}={})=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=absolute+relative*Math.abs(b),`${label}: ${a} vs ${b}`);
function scalar(actual,expected,label){
 if(typeof expected.value==='string')assert.equal(actual.value,expected.value==='negative overflow'?-Infinity:Infinity,label);
 else if(Math.abs(expected.value)<1e-290)assert.equal(actual.value,expected.value,label+' strict tiny rounding');
 else near(actual.value,expected.value,label);
 assert.equal(actual.sign,expected.sign,label+' sign');
 if(expected.sign){near(actual.logMagnitude,expected.logMagnitude,label+' log',{relative:0,absolute:3e-9});if(expected.value===0)assert.equal(actual.belowRange,true,label+' positive finite below range');}
}
test('forty-two physical parameter sets agree with exact-input regime signs and independent high-precision roots',()=>{
 assert.equal(F.parameters.length,42);
 for(const {args,expect:e}of F.parameters){const z=H.seriesParameters(args);assert.equal(z.regime,e.regime);near(z.omega,e.omega.value,'natural frequency');scalar(z.zeta,e.zeta,'damping ratio');scalar(z.alpha,e.alpha,'decay rate');const a=z.roots.slice().sort((x,y)=>x[0]-y[0]||x[1]-y[1]),b=e.roots.slice().sort((x,y)=>x[0]-y[0]||x[1]-y[1]);for(let i=0;i<2;i++)for(let j=0;j<2;j++)near(a[i][j],b[i][j],'root');}
});
test('120 normalized forced/free states agree with independent matrix exponentials across the critical double root',()=>{
 assert.equal(F.normalized.length,120);for(const {args:a,expect:e}of F.normalized){const z=H.normalizedState(a.gamma,a.t,a);scalar(z.v,e.v,'voltage');scalar(z.j,e.j,'scaled current');}
});
test('157 original-input physical states preserve signs, tiny amplitudes, energy, power and storage derivatives',()=>{
 assert.equal(F.physical.length,157);for(const {args:a,expect:e}of F.physical){const z=H.seriesState(a,a.t,a);for(const k of ['v','i','energy','dissipation'])scalar(z[k],e[k],k);scalar(z.derivativeQuantity.v,e.dv,'capacitor slope');scalar(z.derivativeQuantity.i,e.di,'inductor slope');}
});
test('180 separately propagated physical quadratic-moment references verify Joule heat without subtracting stored energies',()=>{
 assert.equal(F.joule.length,180);for(const {args:a,expect:e}of F.joule)scalar(H.jouleIntegral(a,a.t,a),e.heat,'heat');
 const z=H.jouleIntegral({R:Number.MIN_VALUE,L:1,C:1},1);assert.equal(z.sign,1);assert.equal(z.belowRange,true);
});
test('83 physical finite-rise/ideal-step cases include late currents with no stationary numerical floor',()=>{
 assert.equal(F.edge.length,83);for(const {args:a,expect:e}of F.edge){const z=H.edgeState(a,a.t);for(const k of ['v','i','input'])scalar(z[k],e[k],k);}
});
test('24 dragged-root cases retain the exact derived R/C family, including resistance below the numeric range',()=>{
 assert.equal(F.rootGeometry.length,24);for(const {args:a,expect:e}of F.rootGeometry){const z=H.fromRoot(a.real,a.imaginary,a.L);near(z.omega,e.omega.value,'root radius');scalar(z.parameters.zeta,e.zeta,'projection ratio');for(let i=0;i<2;i++){assert.ok(z.parameters.roots[i][0]===a.real);assert.equal(z.parameters.roots[i][1],i===0?a.imaginary:-a.imaginary);}const state=H.seriesState(z.parameters,a.t);scalar(state.v,e.v,'derived-family voltage');scalar(state.i,e.i,'derived-family current');}
 const z=H.fromRoot(-Number.MIN_VALUE,4,.25);assert.equal(z.R,0);assert.equal(Q.sign(z.RExact),1);assert.equal(z.parameters.strictlyStable,true);assert.equal(z.parameters.alpha.value,Number.MIN_VALUE);
});
test('36 independent parallel-network state equations check the correct current output and physical node voltage',()=>{
 assert.equal(F.parallel.length,36);for(const {args:a,expect:e}of F.parallel){const z=H.parallelState(a,a.t);for(const k of ['v','iL','energy','dissipation'])scalar(z[k],e[k],k);}
});
test('18 matched dual networks retain exact coefficient matching and normalized output agreement',()=>{
 assert.equal(F.matchedDual.length,18);for(const {args:a,expect:e}of F.matchedDual){const match=H.matchedParallelResistance(a);scalar(match,e.parallelResistance,'dual resistance');assert.equal(Q.sign(Q.sub(Q.mul(Q.mul(match.exact,a.C),a.R),a.L)),0);const p=H.parallelState({R:match.exact,L:a.L,C:a.C},a.t);scalar(p.iL,e.output,'normalized parallel current');const s=H.seriesState(a,a.t);assert.equal(p.iL.value,s.v.value);}
});
test('16 independent mass–spring–damper matrix flows verify the scaled charge/displacement and energy analogy',()=>{
 assert.equal(F.mechanical.length,16);for(const {args:a,expect:e}of F.mechanical){const z=H.mechanicalState(a);for(const k of ['x','velocity','energy'])scalar(z[k],e[k],k);}
});
test('passive stability and near-critical classification do not depend on rounded damping or root coordinates',()=>{
 const a=H.seriesParameters({R:2,L:1,C:1}),b=H.seriesParameters({R:1.9999999999999998,L:1,C:1}),c=H.seriesParameters({R:2.0000000000000004,L:1,C:1});assert.equal(a.regime,'critical');assert.equal(b.regime,'underdamped');assert.equal(c.regime,'overdamped');
 const tiny=H.seriesParameters({R:Number.MIN_VALUE,L:4,C:.1});assert.equal(tiny.gamma,0);assert.equal(Q.sign(tiny.gammaQ),1);assert.equal(tiny.strictlyStable,true);assert.equal(tiny.coordinateHalfPlaneResolved,false);assert.equal(H.seriesParameters({R:0}).strictlyStable,false);
});
test('original tiny physical time retains strictly positive state and heat when normalized time rounds to zero',()=>{
 const p=H.seriesParameters({R:1,L:4,C:4}),t=Number.MIN_VALUE,z=H.seriesState(p,t);assert.equal(t*p.omega,0);for(const k of ['v','i','energy','dissipation']){assert.equal(z[k].sign,1,k);assert.equal(z[k].belowRange,true,k);}assert.equal(H.jouleIntegral(p,t).sign,1);assert.equal(H.edgeState({},t).v.sign,1);
});
test('zero initial storage with zero input stays exactly zero in every damping regime and at tiny times',()=>{
 for(const R of [0,Number.MIN_VALUE,1,2,12])for(const t of [0,Number.MIN_VALUE,.1,20]){const z=H.seriesState({R,L:1,C:1},t,{source:0});for(const k of ['v','i','energy','dissipation'])assert.equal(z[k].sign,0,k);assert.equal(H.jouleIntegral({R,L:1,C:1},t,{v0:0,i0:0}).sign,0);}
 for(const t of [0,Number.MIN_VALUE,1e-9]){const z=H.edgeState({amplitude:0},t);for(const k of ['v','i','input'])assert.equal(z[k].sign,0);}
});
test('critical step has its polynomial-times-exponential limit and preserves the equilibrium initial state',()=>{
 for(const t of [.1,1,10]){const z=H.normalizedState(2,t,{source:1});near(z.v.value,1-(1+t)*Math.exp(-t),'critical step');near(z.j.value,t*Math.exp(-t),'critical current');}
 for(const gamma of [0,.2,2,75])for(const t of [Number.MIN_VALUE,.1,20]){const z=H.normalizedState(gamma,t,{v0:.7,source:.7});assert.equal(z.v.value,.7);assert.equal(z.j.sign,0);}
});
test('sampling resolves the first step peak and the overdamped fast initial interval without duplicate times',()=>{
 for(const R of [0,.4,1]){const p=H.seriesParameters({R,L:1,C:1}),times=H.sampleTimes(p),peak=1+Math.exp(-R/2*Math.PI/Math.sqrt(1-R*R/4)),actual=Math.max(...times.map(t=>H.seriesState(p,t).v.value));assert.ok(Math.abs(actual-peak)<.002,'resolved first peak');assert.equal(times[0],0);assert.ok(times.every((t,i)=>i===0||t>times[i-1]));}
 const p=H.seriesParameters({R:12,L:.1,C:4}),times=H.sampleTimes(p);assert.ok(times.filter(t=>t<1/(p.gamma*p.omega)).length>=6,'fast mode receives real samples');
});
test('finite rational magnitudes and the declared physical domains remain explicit at numerical limits',()=>{
 const tiny=H.quantity(Q.mul(Number.MIN_VALUE,Number.MIN_VALUE)),huge=H.quantity(Q.mul(Number.MAX_VALUE,Number.MAX_VALUE));assert.equal(tiny.sign,1);assert.equal(tiny.belowRange,true);assert.equal(huge.sign,1);assert.equal(huge.aboveRange,true);assert.ok(Number.isFinite(tiny.logMagnitude)&&Number.isFinite(huge.logMagnitude));
 for(const p of [{R:-1},{L:0},{C:0},{R:Infinity}])assert.throws(()=>H.seriesParameters(p));assert.throws(()=>H.fromRoot(1,1));assert.throws(()=>H.fromRoot(-1,0));assert.throws(()=>H.parallelParameters({R:0}));
});

test('late critical free voltage and current slope retain their decaying terms after absolute step voltage rounds to the source',()=>{const free=H.seriesState({R:2,L:1,C:1},100,{v0:1,source:0}),step=H.seriesState({R:2,L:1,C:1},100);near(free.v.value,101*Math.exp(-100),'free voltage tail',{relative:3e-12,absolute:0});near(step.derivative.i,-99*Math.exp(-100),'current slope tail',{relative:3e-12,absolute:0});assert.equal(step.v.value,1);near(step.error.value,-101*Math.exp(-100),'sub-rounding voltage error',{relative:3e-12,absolute:0});});
