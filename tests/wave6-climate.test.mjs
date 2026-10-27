import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import chapter from '../content/climate/ch06.js';
import syllabus from '../content/climate/syllabus.js';
import {rho0} from '../content/geo/ch01.shared.js';
import * as H from '../content/climate/ch06.shared.js';
const near=(a,b,t=5e-12,absolute=0)=>assert.ok(Math.abs(a-b)<=absolute+t*Math.max(Math.abs(a),Math.abs(b)),`${a} versus ${b}`);
test('CLIMATE6 preserves nine frozen identities, dependency order and original Paper bibliography',()=>{
 const plan=JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json',import.meta.url))).chapters.find(c=>c.collection==='climate');
 const sync=syllabus.chapters.find(c=>c.n===6);assert.equal(chapter.items.length,9);assert.equal(sync.summary,chapter.summary);
 chapter.items.forEach((x,i)=>{const frozen=plan.items[i],s=sync.items[i];for(const k of ['num','kind','name','deps','paper','introduces'])assert.deepEqual(x[k],frozen[k]);for(const k of ['refs','links','verify'])assert.deepEqual(x[k],s[k]);assert.equal(s.pic,x.caption);assert.equal(typeof x.viz,'function');});
 assert.equal(chapter.items[8].verify,true);assert.match(chapter.items[8].scope,/HTTP 403/);
});
test('CLIMATE6 slab has exact initial power, e-folding response and heat-capacity scaling',()=>{
 for(const depth of [10,50,200])for(const lambda of [.5,1.2,3])for(const forcing of [0,3.7,8]){
  const p={depth,lambda,forcing},a=H.slab(0,p),b=H.slab(a.tau,p),c=H.slab(2*a.tau,p);
  assert.equal(a.T,0);assert.equal(a.N,forcing);near(b.T,forcing/lambda*(1-Math.exp(-1)));near(c.N,forcing*Math.exp(-2));near(H.slab(2*a.tau,{...p,depth:2*depth}).T,b.T);
 }
});
test('CLIMATE6 tiny elapsed time retains the leading deep heat uptake',()=>{
 for(const t of [1e-12,1e-9,1e-6]){const z=H.twoLayer(t);near(z.Ts,3.7/z.C*t,4e-7);near(z.Td,3.7*.7/(2*z.C*z.Cd)*t*t,4e-7);assert.ok(z.Td>0);}
});
test('CLIMATE6 thermal state, carbon-sink trajectory and recharge match independent SciPy solutions',()=>{
 const refs=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-climate-reference.json',import.meta.url))),cache=new Map();let count=0;
 for(const r of refs.cases){let q;if(r.kind==='thermal'){const z=H.twoLayer(r.t,r.params);q=[z.Ts,z.Td];}else if(r.kind==='recharge'){const z=H.recharge(r.t,r.params);q=[z.T,z.h];}else{const key=JSON.stringify(r.params);if(!cache.has(key))cache.set(key,H.commitment(r.params));const z=cache.get(key).at(r.t);q=[z.Ts,z.Td];}q.forEach((x,i)=>near(x,r.expected[i],r.kind==='commitment'?3e-8:2e-10,r.kind==='commitment'?3e-11:1e-28));count++;}
 assert.equal(count,153);
});
test('CLIMATE6 two-box power sums conserve energy and decay rates solve the characteristic equation',()=>{
 for(const gamma of [0,1e-12,.7,2])for(const t of [0,.1,70,500]){
  const q=H.twoLayer(t,{gamma});near(q.C*q.ds+q.Cd*q.dd,q.forcing-q.lambda*q.Ts,5e-12,1e-14);near(q.fast*q.slow,q.lambda*q.gamma/(q.C*q.Cd));near(q.fast+q.slow,q.a+q.d);
  const e=1e-3;if(t>0){const a=H.twoLayer(t-2*e,{gamma}),b=H.twoLayer(t-e,{gamma}),c=H.twoLayer(t+e,{gamma}),d=H.twoLayer(t+2*e,{gamma});for(const [key,deriv]of [['Ts',q.ds],['Td',q.dd]])near((-d[key]+8*c[key]-8*b[key]+a[key])/(12*e),deriv,1e-7,1e-12);}
 }
});
test('CLIMATE6 zero exchange isolates the deep ocean; positive exchange reaches shared equilibrium',()=>{
 for(const t of [0,1,70,500]){const q=H.twoLayer(t,{gamma:0});near(q.Ts,H.slab(t).T);assert.equal(q.Td,0);assert.equal(q.slowYears,null);}
 const q=H.twoLayer(1e6);near(q.Ts,3.7/1.2);near(q.Td,3.7/1.2);
});
test('CLIMATE6 fixed concentration and zero emissions share a continuous cutoff but different forcing',()=>{
 const fixed={mode:'fixed concentration'},zero={mode:'zero emissions: toy sinks',permanent:.25,carbonYears:80};
 for(const t of [0,1,69,70])assert.equal(H.scenarioForcing(t,fixed),H.scenarioForcing(t,zero));near(H.scenarioForcing(70+1e-8,zero),3.7,1e-8);assert.ok(H.scenarioForcing(300,zero)<H.scenarioForcing(300,fixed));
 const a=H.commitment(fixed),b=H.commitment(zero);near(a.stop.Ts,b.stop.Ts);assert.ok(a.at(300).Ts>b.at(300).Ts);
 // Compare step refinement; a convergence check tests the numeric method.
 const c=H.commitment(zero,300,.03125);near(b.at(300).Ts,c.at(300).Ts,2e-9);
});
test('CLIMATE6 heat inventory uses whole-Earth area and seconds, with a reversible ZJ conversion',()=>{
 const power=1,years=20,heat=power*years;near(H.imbalanceFromHeat(H.zettajoules(heat),years),power);near(H.zettajoules(heat),4*Math.PI*6371000**2*365.25*86400*years/1e21);
});
test('CLIMATE6 nonlinear column expansion preserves mass and agrees with the independent density evaluator',()=>{
 for(const S of [0,10,35,40])for(const T of [0,3,18,28])for(const warming of [0,.1,2,4]){
  const q=H.columnExpansion(T,warming,200,S),r=rho0(S,T+warming);near(q.finalDensity,r,2e-15);near((200+q.rise)*q.finalDensity,200*q.density,2e-15);if(warming>0)near(q.rise,200*(q.density-r)/r,3e-8,1e-12);
 }
});
test('CLIMATE6 sub-roundoff warming retains real expansion and fresh water can contract',()=>{
 const a=H.columnExpansion(18,1e-20,200,35);assert.ok(a.rise>0);assert.equal(a.finalDensity,a.density);assert.ok(H.columnExpansion(0,2,200,0).rise<0);assert.ok(H.columnExpansion(18,2,200,35).rise>0);assert.equal(H.columnExpansion(18,0).rise,0);
});
test('CLIMATE6 land-ice mass conversion and the Antarctic bracket are additive, not a probability model',()=>{
 const q=H.seaLevel({years:1,glaciers:360,greenland:0,antarctica:0,thermal:0,spread:0});near(q.total,1);assert.equal(H.seaLevel({years:0}).total,0);
 const a=H.seaLevel();near(a.parts.reduce((x,y)=>x+y),a.total);near(a.high-a.low,2*a.uncertainty);assert.ok(H.seaLevel({antarctica:0,spread:600,thermal:0,glaciers:0,greenland:0}).low<0);
});
test('CLIMATE6 recharge neutral threshold, phase direction and delayed-feedback removal are distinct',()=>{
 const z=H.recharge(0,{feedback:.55});near(z.growth,0,1e-12,1e-16);assert.ok(z.period>4&&z.period<5);const q=H.recharge(1e-5);assert.ok(q.h<0);const a=H.recharge(4,{delayed:false});assert.equal(a.period,null);assert.equal(a.h,0);
 // For zero net modal growth, the state returns after an analytic period.
 const r=H.recharge(z.period,{feedback:.55});near(r.T,1,2e-14);near(r.h,0,1e-12,1e-14);
});
test('CLIMATE6 generic linear flow handles a repeated eigenvalue without division by zero',()=>{
 const q=H.linearFlow([[-1,2],[0,-1]],[0,1],3);near(q[0],6*Math.exp(-3));near(q[1],Math.exp(-3));
});
test('CLIMATE6 sea-ice diagnostic converts tonnes, Gt and million square kilometres consistently',()=>{
 const a=H.seaIce(1000,{area:6,sensitivity:3});near(a.loss,3);near(a.remaining,3);near(a.zero,2000);near(H.seaIce(2500).remaining,0);assert.ok(H.seaIce(2500).raw<0);near(H.seaIce(1000,{area:6,sensitivity:3}).nearlyIceFree,5000/3);
});
test('CLIMATE6 Bjerknes pathway separates reinforcement from cycle generation',()=>{
 for(const gain of [.5,1,1.5]){const a=H.feedbackLoop(2,{wind:gain,thermocline:1,surface:1});near(a.T,Math.exp((gain-1)*2));near(a.returned,a.gain*a.T);}
 const q=H.feedbackLoop(2,{closed:false,wind:1.5,thermocline:1.5,surface:1.5});near(q.T,Math.exp(-2));assert.equal(q.rate,-1);
});
