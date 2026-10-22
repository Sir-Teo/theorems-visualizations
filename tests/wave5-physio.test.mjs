import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from '../content/physio/ch05.shared.js';
const near=(a,b,t=2e-12)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} versus ${b}`);

test('open breathing obeys resistance/recoil balance and exact periodic derivative',()=>{
 for(const resistance of[.2,2,10])for(const compliance of[.03,.1,.2])for(const time of[0,.37,1,2,3.7]){const args={resistance,compliance,time},q=H.periodicBreath(args),h=1e-5;near(q.elastic+resistance*q.flow,q.drive);near((H.periodicBreath({...args,time:time+h}).volume-H.periodicBreath({...args,time:Math.max(0,time-h)}).volume)/(time===0?h:2*h),q.flow,time===0?1e-4:2e-9);assert.ok(q.volume>0);}
 for(const V of[1,2,3,6]){const q=H.sealedGas(V);near(q.absolutePressure*V,3099);near(q.absolutePressure-q.gauge,1033);}
});
test('compliance is a positive local slope and branch work is an integral',()=>{
 for(const surface of[0,12,20])for(const hysteresis of[0,1,2])for(const branch of[-1,1])for(let k=0;k<=20;k++){const u=k/20,q=H.complianceModel(u,{surface,hysteresis,branch});assert.ok(q.derivative>0);near(q.compliance*q.derivative,4);if(k>0&&k<20){const h=1e-5,dp=(H.complianceModel(u+h,{surface,hysteresis,branch}).pressure-H.complianceModel(u-h,{surface,hysteresis,branch}).pressure)/(2*h);near(dp,q.derivative,1e-9);}}
 let work=0;for(let j=0;j<1000;j++){const u=(j+.5)/1000;work+=(H.complianceModel(u).pressure-H.complianceModel(u,{branch:-1}).pressure)*4/1000;}near(work,H.complianceModel().loopArea,1e-6);
});
test('one-interface sphere law has the conditional stability sign and reciprocal transfer',()=>{
 for(const m of[0,.25,.5,.75,1.5])for(const f of[.1,.3,.5,.7,.9]){const q=H.bubblePair(f,m),other=H.bubblePair(f===.9?.1:1-f,m);near(q.difference,-other.difference);near(q.radii[0]**3+q.radii[1]**3,2);near(q.pressures[0],q.radii[0]**(2*m-1));if(m===.5)near(q.difference,0);else if(f!==.5)assert.equal(Math.sign(q.flowToFirst),-Math.sign((f-.5)*(2*m-1)));}
});
test('spirometry measures differences while the supplied residual offset remains independent',()=>{
 for(const tau of[.15,.35,1.2,3]){const q=H.spirogram(1,{tau}),r=H.spirogram(1,{tau,residual:2.7});near(q.FEV1,q.expired);near(q.ratio,-Math.expm1(-1/tau));near(q.FEV1,r.FEV1);near(r.TLC-q.TLC,1.5);near(H.spirogram(0,{tau}).expired,0);}
});
test('dead space preserves ventilation accounting and excludes a fictitious zero-ventilation equilibrium',()=>{
 for(const tidal of[.1,.2,.5,2])for(const dead of[0,.15,.4]){const q=H.ventilation(tidal,dead,6/tidal);near(q.minute,6);near(q.alveolar+q.deadVentilation,6);assert.ok(q.alveolar>=0);assert.equal(q.steadyCO2===null,tidal<=dead);if(q.steadyCO2!==null)near(q.steadyCO2*q.alveolar,H.CO2_K*.2);}
 near(H.btpsToStpd().standard,4*273*713/(310*760));near(H.CO2_K,310*760/273);assert.ok(H.ventilation(.2,.15,30).alveolar<H.ventilation(.8,.15,7.5).alveolar);
});
test('listed Henry coefficients retain actual physical units and separately scaled tiny concentration',()=>{
 near(H.henryPlasma(100).micromolar,140);near(H.henryPlasma(100,'carbon dioxide').micromolar,3300);assert.equal(H.henryPlasma(Number.MIN_VALUE).micromolar,Number.MIN_VALUE);assert.ok(H.henryPlasma(Number.MIN_VALUE).molarUnderflow);assert.ok(H.henryPlasma(1e-320).micromolar>0);
});
test('full alveolar balance satisfies independent inert-gas and net exchange identities',()=>{
 near(H.alveolarGas().full,101.83);near(H.alveolarGas().approximate,99.73);near(H.alveolarGas({inspiredOxygen:1}).full,673);assert.equal(H.alveolarGas({inspiredOxygen:1}).exhaledNitrogen,0);
 for(const fi of[.1,.21,.6,.99])for(const rq of[.5,.8,1,1.2])for(const co2 of[0,20,60,100]){const q=H.alveolarGas({inspiredOxygen:fi,quotient:rq,co2});near(q.full-q.approximate,q.correction);near(q.full+co2+q.exhaledNitrogen,q.dry);if(!q.valid)continue;const ao=q.full/q.dry,ac=co2/q.dry,inspiredPerExpired=(1-ao-ac)/(1-fi);near(rq*(inspiredPerExpired*fi-ao),ac);}
 assert.ok(!H.alveolarGas({inspiredOxygen:.1,barometric:300,co2:100,quotient:.5}).valid);
});
test('Fick capacity obeys geometric scaling and signed pressure reversal',()=>{
 for(const area of[.1,1,2])for(const thickness of[.25,1,5]){const q=H.diffusingCapacity(area,thickness);near(q.relative,area/thickness);near(q.rate,-H.diffusingCapacity(area,thickness,1,-60).rate);near(H.diffusingCapacity(2*area<=2?2*area:area,thickness).capacity,q.capacity*(2*area<=2?2:1));}
});
test('constant-capacitance transport preserves endpoints and tiny positive increments',()=>{
 assert.equal(H.capillaryTransfer(0,{venous:Number.MIN_VALUE}).pressure,Number.MIN_VALUE);near(H.capillaryTransfer(1e-20,{venous:0}).pressure/3e-18,1);for(const B of[.1,1,30])for(const DL of[.1,3,10]){const q=H.capillaryTransfer(1,{capacity:B,conductance:DL});near(q.fraction,-Math.expm1(-DL/B));near(q.transitPressure,40+60*q.fraction);assert.ok(q.fraction>=0&&q.fraction<=1);}
});
test('positive content law and inverse preserve tiny quantities and ordinary mixtures',()=>{
 assert.equal(H.oxygenContent(Number.MIN_VALUE,{hill:1,p50:10,bindingCapacity:25}).bound,2*Number.MIN_VALUE);assert.ok(H.oxygenContent(1e-310,{hill:1,p50:10,bindingCapacity:25}).bound>0);
 for(const p of[10,40,80,100,700])near(H.invertContent(H.oxygenContent(p).total),p);
 for(const c of[Number.MIN_VALUE,1e-320,1e-100,1e-20]){const p=H.invertContent(c);assert.ok(p>0);const result=H.oxygenContent(p).total;assert.ok(Math.abs(result-c)<=Math.max(Number.MIN_VALUE,c*1e-12),`${c} ->${p} ->${result}`);}
});
test('V/Q balances actual gas content and mixes contents before pressure inversion',()=>{
 const venous=H.gasUnit(0),dead=H.gasUnit(Infinity);assert.equal(venous.oxygen,40);near(venous.co2,46);near(dead.oxygen,.21*713);assert.equal(dead.co2,0);
 for(const ratio of[0,.01,.2,1,5,20]){const q=H.gasUnit(ratio);near(q.oxygenBalanceResidual,0);near(q.co2FluxPerPerfusion,100*ratio*q.co2/713);assert.ok(q.oxygen>=40&&q.oxygen<=149.73);}
 const a=H.gasUnit(.2),b=H.gasUnit(1.8),q=H.mixUnits([a,b],[1,1]);near(H.oxygenContent(q.oxygen).total,(a.oxygenContent+b.oxygenContent)/2);assert.ok(q.oxygen<q.pressureAverage);near(H.mixUnits([a,b],[0,1]).oxygen,b.oxygen);
});
test('West pressure equalities are continuous and a no-flow apex is not obligatory',()=>{
 assert.equal(H.westZone(30).zone,2);assert.ok(H.westZone(30).flow>0);assert.equal(H.westZone(30,{alveolar:3}).flow,0);
 for(const z of[0,12,20,30]){const q=H.westZone(z);near(q.flow,Math.max(q.arterial-Math.max(q.alveolar,q.venous),0));}
 near(H.westZone(12-1e-8).flow,H.westZone(12+1e-8).flow,2e-8);
});
test('static CO2 controller finds the actual attainable intersection without cancellation',()=>{
 for(const baseline of[0,2,10])for(const gain of[0,Number.MIN_VALUE,1e-200,.3,2])for(const inspired of[0,20]){const q=H.co2Steady({baseline,gain,inspired});if(baseline===0&&gain===0){assert.equal(q.equilibrium,null);continue;}assert.ok(q.equilibrium>inspired&&q.ventilation>0);near((q.equilibrium-inspired)*q.ventilation,H.CO2_K*.2,3e-12);}
 assert.equal(H.co2Steady({baseline:Number.MIN_VALUE,gain:0}).equilibrium,null);
});
test('source Hill tank has the actual characteristic crossing and no invented universal gain-delay product',()=>{
 const q=H.delayEquilibrium();near(q.production,.270899470899471);near(q.criticalDelay,3.6171307425717836);near(q.a+q.b*Math.cos(q.frequency*q.criticalDelay),0);near(q.frequency-q.b*Math.sin(q.frequency*q.criticalDelay),0);
 for(const n of[2,3,6])for(const state of[.25,.8,1,2]){const e=H.delayEquilibrium({state,n});near(e.production,state*H.hillVentilation(state,n));if(e.criticalDelay!==null){assert.ok(e.b>e.a);near(e.a+e.b*Math.cos(e.frequency*e.criticalDelay),0);}else assert.ok(e.b<=e.a||e.numericBoundary);}
 assert.ok(H.delayEquilibrium({state:1,n:2}).numericBoundary);assert.equal(H.delayEquilibrium({state:2,n:3}).criticalDelay,null);
});
test('delay traces use actual history and converge under refinement rather than scripted oscillation',()=>{
 for(const delay of[0,1,4,8]){const q=H.delayTrace({delay,horizon:20,step:.02}),r=H.delayTrace({delay,horizon:20,step:.01});assert.ok(!q.unresolved&&!r.unresolved);assert.equal(q.states[0],.8*1.05);assert.ok(q.states.every(x=>x>0&&Number.isFinite(x)));assert.ok(Math.abs(q.states.at(-1)-r.states.at(-1))<5e-6);}
 assert.ok(H.delayTrace({delay:Number.MIN_VALUE}).unresolved);assert.ok(H.delayTrace({delay:.001}).unresolved);const steady=H.delayTrace({perturbation:0,horizon:10});near(steady.states.at(-1),.8,2e-12);
});
test('unsupported domains are rejected instead of clamped',()=>{
 for(const f of[()=>H.bubblePair(0),()=>H.spirogram(1,{vitalCapacity:0}),()=>H.ventilation(.5,.1,NaN),()=>H.alveolarGas({quotient:0}),()=>H.invertContent(-1),()=>H.gasUnit(-1),()=>H.westZone(31),()=>H.delayEquilibrium({n:2.5})])assert.throws(f,RangeError);
});
test('frozen identities, actual prerequisite lists and retained original-source flag stay synchronized',async()=>{
 const fs=await import('node:fs'),a=(await import('../content/physio/ch05.js')).default,b=(await import('../content/physio/ch05-b.js')).default,s=(await import('../content/physio/syllabus.js')).default,items=[...a.items,...b.items],plan=JSON.parse(fs.readFileSync(new URL('../docs/wave-five-plan.json',import.meta.url))).chapters.find(x=>x.collection==='physio'&&x.chapter===5),ch=s.chapters.find(x=>x.n===5),id=x=>[x.num,x.kind,x.name];
 assert.deepEqual(items.map(id),plan.items.map(id));assert.deepEqual(items.filter(x=>x.verify).map(x=>x.num),['5.12']);assert.equal(ch.items.find(x=>x.num==='5.6').alias,'pchem-1.5');
 for(const i of items){const row=ch.items.find(x=>x.num===i.num);for(const k of['num','kind','name','deps','refs','see','verify'])assert.deepEqual(row[k],i[k]);assert.equal(row.pic,i.caption);assert.equal(typeof i.viz,'function');assert.ok(i.statement&&i.idea&&i.scope);assert.ok(!i.deps.includes('mathbio-1.17'));}
});
