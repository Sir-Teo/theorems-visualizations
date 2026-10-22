import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from '../content/pharm/ch05.shared.js';
const near=(a,b,t=2e-12)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} versus ${b}`),u=Number.MIN_VALUE;
test('saturable removal obeys its implicit balance, derivative and limiting zero state',()=>{
 for(const initial of[.01,1,20])for(const capacity of[.1,1,3])for(const michaelis of[.1,1,4])for(const time of[0,.1,3,40]){const q=H.saturableDecline(time,{initial,capacity,michaelis});near(q.concentration-initial+michaelis*q.logRatio,-capacity*time,1e-11);near(q.concentration+q.removed,initial);assert.ok(q.concentration>=0&&q.concentration<=initial);assert.equal(q.concentration===0,q.underflow);if(time>0&&time<40){const h=1e-5,a=H.saturableDecline(time-h,{initial,capacity,michaelis}),b=H.saturableDecline(time+h,{initial,capacity,michaelis});near((a.concentration-b.concentration)/(2*h),q.rate,2e-8);}}
 assert.equal(H.saturableDecline(40,{initial:0}).concentration,0);assert.equal(H.saturableDecline(0,{initial:u,capacity:.1,michaelis:.1}).rate,u);const q=H.saturableDecline(40,{initial:u});assert.ok(q.underflow&&Number.isFinite(q.logConcentration));
});
test('tiny positive time retains representable losses without exp/log concentration artifacts',()=>{
 const q=H.saturableDecline(u,{initial:20,capacity:3,michaelis:.1});assert.equal(q.removed,3*u);assert.equal(q.concentration,20);assert.ok(q.logRatioUnderflow);assert.equal(H.saturableDecline(1e-20,{initial:20,capacity:3,michaelis:.1}).concentration,20);assert.equal(H.parentMetabolite(u,{initial:20,parentRate:.05,metaboliteRate:.05,fraction:0}).other,u);assert.ok(H.saturatedSteady(u,.1).steadyUnderflow);
});
test('steady saturation threshold, stability direction and elasticity are exact',()=>{
 for(const q of[0,.1,.6,.95,.9999999999999999]){const z=H.saturatedSteady(q,2);near(z.steady/(2+z.steady),q);near(z.elasticity,1/(1-q));}for(const q of[1,1.2])assert.equal(H.saturatedSteady(q).steady,null);near(H.saturatedSteady(.8).steady/H.saturatedSteady(2/3).steady,2);
});
test('enzyme step separates instantaneous inhibition and turnover with tiny response retained',()=>{
 for(const t of[0,.1,5,40])for(const z of[0,1,20])for(const inducer of[0,1,20]){const q=H.enzymeStep(t,{inhibitor:z,inducer});near(q.enzyme,1+3*inducer/(1+inducer)*(1-Math.exp(-.3*t)));near(q.intrinsicFactor,q.enzyme/(1+z));near(q.factorChange,q.intrinsicFactor-1);}
 assert.equal(H.enzymeStep(40,{inducer:u,maxInduction:5,turnover:.02,inhibitor:0}).enzymeIncrement,3*u);assert.equal(H.enzymeStep(u,{inducer:20,maxInduction:5,turnover:.2,inhibitor:0}).enzymeIncrement,u);
});
test('parallel clearance and independently balanced well-stirred organ ratios differ',()=>{
 for(const f of[0,.2,.8,1])for(const z of[0,1,100]){const q=H.interactionRatio(f,z);near(q.aucRatio*((1-f)+f/(1+z)),1);near(q.aucIncrement,q.aucRatio-1);if(f<1)assert.ok(q.aucRatio<=q.limit);else near(q.aucRatio,1+z);}
 for(const intrinsic of[.05,1,50]){const q=H.wellStirred(intrinsic,{inhibitorRatio:2}),Cout=1/(1+.2*intrinsic);near(1-Cout,q.hepatic);near(q.aucRatio,q.total/q.afterTotal);assert.ok(q.inhibited<=q.hepatic&&q.hepatic<1);}
});
test('dated CYP score boundaries, copy phase and inhibitor convention preserve uncertainty',()=>{
 for(const [score,expected]of[[0,'poor'],[u,'intermediate'],[1.249999,'intermediate'],[1.25,'normal'],[2.25,'normal'],[2.250001,'ultrarapid']])assert.equal(H.cypPhenotype(score),expected);
 assert.deepEqual(H.cypCase(3).scores,[1.25]);assert.deepEqual(H.cypCase(4).scores,[.5]);assert.deepEqual(H.cypCase(6).phenotypes,['poor']);assert.deepEqual(H.cypCase(7).scores,[1,2]);assert.ok(H.cypCase(7).ambiguous);assert.ok(H.cypCase(8,'strong').indeterminate);assert.deepEqual(H.cypCase(5,'moderate').adjusted,[1.5]);assert.deepEqual(H.cypCase(5,'strong').adjusted,[0]);
});
test('two inherited haplotypes obey expected HWE frequencies without conflating gene copies',()=>{
 for(const p of[0,.1,.5,.9,1])for(const a of[0,.25,1,2])for(const b of[0,.5,1,2]){const q=H.haplotypePool(p,a,b);near(q.total,1);near(q.rows[0].frequency+.5*q.rows[1].frequency,p);assert.deepEqual(q.rows.map(r=>r.score),[2*a,a+b,2*b]);}const q=H.haplotypePool(u);assert.ok(q.rows[0].underflow);assert.equal(q.rows[1].frequency,2*u);
});
test('autoinduction integrates actual feedback, conserves input and converges on refinement',()=>{
 for(const input of[0,1,2])for(const maxInduction of[0,5]){const q=H.autoinduction({input,maxInduction}),r=H.autoinduction({input,maxInduction,step:.005});assert.ok(!q.unresolved&&!r.unresolved);assert.ok(q.states.every(y=>y[0]>=0&&y[1]>=1-1e-12&&y[1]<=1+maxInduction+1e-12));near(q.massResidual,0,1e-10);near(q.final,r.final,1e-7);near(.3*q.steady*(1+maxInduction*q.steady/(1+q.steady)),input);if(maxInduction===0)near(q.final,input/.3*(-Math.expm1(-12)),1e-9);}
 const q=H.autoinduction({input:u,baseline:.05,halfResponse:.1});assert.equal(q.steady,20*u);assert.equal(q.final,17*u);assert.equal(q.states.at(-1)[2],23*u);
});
test('parent/metabolite has exact equal-rate limit, near-rate continuity and independent mass accounting',()=>{
 for(const kp of[.05,.7,3])for(const km of[.05,.7,3])for(const t of[0,.01,1,5,40])for(const fraction of[0,.8,1]){const q=H.parentMetabolite(t,{initial:2,parentRate:kp,metaboliteRate:km,fraction});near(q.massResidual,0,2e-11);assert.ok(q.metabolite>=0&&q.eliminated>=0);if(kp===km)near(q.metabolite,fraction*2*kp*t*Math.exp(-kp*t));else near(q.metabolite,fraction*2*kp*(Math.exp(-km*t)-Math.exp(-kp*t))/(kp-km));}
 const a=H.parentMetabolite(2,{parentRate:.7,metaboliteRate:.7}),b=H.parentMetabolite(2,{parentRate:.7,metaboliteRate:.7000000000000001});near(a.metabolite,b.metabolite);assert.equal(H.parentMetabolite(5,{fraction:u,parentRate:.5,metaboliteRate:.05}).metabolite,u);assert.equal(H.parentMetabolite(u,{initial:20,parentRate:.05,metaboliteRate:.05,fraction:1}).metabolite,u);
});
test('free-ligand binding inverse is monotone, mass-balanced and distinct from total binding input',()=>{
 for(const sites of[0,1,10])for(const dissociation of[.1,1,5]){let prev=-1;for(let j=0;j<=100;j++){const total=.4*j,q=H.proteinBinding(total,{sites,dissociation});near(q.free+q.bound,total);near(q.massResidual,0);near(q.bound,sites*q.free/(dissociation+q.free));assert.ok(q.free>prev);prev=q.free;assert.ok(q.derivative>=1);if(total>0)near(q.freeFraction,q.free/total);else assert.equal(q.freeFraction,null);}}
 const q=H.bindingSteady(u,{unboundClearance:2,sites:10,dissociation:.1});assert.equal(q.free,0);assert.equal(q.bound,50*u);assert.ok(q.freeUnderflow);for(const sites of[0,4,10])near(H.bindingSteady(1,{sites}).free,1);
});
test('target binding ODE conserves drug, permits target turnover and matches binding-off linear limit',()=>{
 for(const association of[0,.5,2])for(const internalization of[0,.3,2]){const q=H.targetMediated({association,internalization}),r=H.targetMediated({association,internalization,step:.00125});assert.ok(!q.unresolved&&!r.unresolved);near(q.massResidual,0,1e-10);near(q.final.free,r.final.free,1e-8);assert.ok(q.states.every(y=>y.every(x=>x>=0)));if(association===0){near(q.final.free,2*Math.exp(-2),2e-10);near(q.final.target,1);near(q.final.complex,0);}}
 const q=H.targetMediated({initial:u,association:0,linear:1});assert.equal(q.final.free,0);assert.ok(q.freeUnderflow);assert.equal(q.final.eliminated,u);assert.equal(q.massResidual,0);
});
test('tiny association retains representable complex transients rather than freezing them',()=>{
 const q=H.targetMediated({initial:1,association:u});assert.equal(q.states[Math.round(4/q.step)][2],u);const r=H.targetMediated({initial:1,association:2*u});assert.equal(r.final.complex,u);
});
test('positive target-route eliminated amount below range is distinguished from exact zero',()=>{
 const q=H.targetMediated({initial:u,target:3,association:2,dissociation:.2,internalization:0,linear:.1});assert.equal(q.final.eliminated,0);assert.ok(q.eliminatedUnderflow);assert.equal(q.final.complex,u);assert.ok(q.freeUnderflow);assert.ok(!H.targetMediated({initial:0}).eliminatedUnderflow);
});
test('unsupported states reject rather than clamp scientific parameters',()=>{
 for(const f of[()=>H.saturableDecline(-1),()=>H.saturatedSteady(1.3),()=>H.enzymeStep(1,{inhibitor:-1}),()=>H.interactionRatio(2),()=>H.cypPhenotype(-1),()=>H.cypCase(1.5),()=>H.haplotypePool(.5,.1),()=>H.autoinduction({step:0}),()=>H.parentMetabolite(1,{parentRate:0}),()=>H.proteinBinding(-1),()=>H.targetMediated({target:0})])assert.throws(f,RangeError);
});
test('frozen chapter identities and source flags match the authored syllabus',async()=>{
 const fs=await import('node:fs'),a=(await import('../content/pharm/ch05.js')).default,b=(await import('../content/pharm/ch05-b.js')).default,s=(await import('../content/pharm/syllabus.js')).default,items=[...a.items,...b.items],plan=JSON.parse(fs.readFileSync(new URL('../docs/wave-five-plan.json',import.meta.url))).chapters.find(x=>x.collection==='pharm'&&x.chapter===5),ch=s.chapters.find(x=>x.n===5),id=x=>[x.num,x.kind,x.name];
 assert.deepEqual(items.map(id),plan.items.map(id));assert.deepEqual(items.filter(x=>x.verify).map(x=>x.num),['5.10']);assert.ok((await import('../content/pharm/ch03-b.js')).default.items.find(x=>x.num==='3.12').verify);
 for(const i of items){const row=ch.items.find(x=>x.num===i.num);for(const k of['num','kind','name','deps','refs','see','verify'])assert.deepEqual(row[k],i[k]);assert.equal(row.pic,i.caption);assert.equal(typeof i.viz,'function');assert.ok(i.statement&&i.idea&&i.scope);assert.ok(!i.deps.includes('kin-6.2'));}
});
