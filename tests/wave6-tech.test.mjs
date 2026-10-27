import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import * as H from'../content/tech/ch07.shared.js';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-tech-reference.json',import.meta.url))),decimal=/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
function complete(actual,expected,path){
 if(typeof expected==='string'&&decimal.test(expected)){const want=Number(expected);assert.equal(typeof actual,'number',path+' numeric type');assert.ok(Number.isFinite(actual),path+' finite output');assert.ok(Math.abs(actual-want)<=2e-11+3e-11*Math.abs(want),path+' independent numerical budget');return;}
 if(Array.isArray(expected)){assert.ok(Array.isArray(actual),path+' array type');assert.equal(actual.length,expected.length,path+' complete array');expected.forEach((x,i)=>complete(actual[i],x,path+'['+i+']'));return;}
 if(expected&&typeof expected==='object'){assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort(),path+' complete keys');for(const[k,v]of Object.entries(expected))complete(actual[k],v,path+'.'+k);return;}
 assert.deepEqual(actual,expected,path);
}
for(const family of Object.keys(fixture.families))test('TECH7 '+family+': every complete independent expected object',()=>{const rows=fixture.cases.filter(x=>x.family===family);assert.equal(rows.length,fixture.families[family]);for(const row of rows)complete(H[family](...row.args),row.expected,family+':'+JSON.stringify(row.args));});
test('TECH7 bounded mechanisms reject nonnumeric, nonfinite and out-of-domain control inputs',()=>{
 for(const bad of[NaN,Infinity,-Infinity,'0.4',null,true])for(const[fn,key]of[['steamDevice','area'],['newcomen','area'],['coke','iron'],['boring','length'],['condenser','volume'],['governor','lag'],['indicator','supply'],['highPressure','difference'],['carnot','hot'],['puddling','time'],['rolling','length'],['bessemer','removed'],['threads','lead'],['interchangeability','holeWidth']])assert.throws(()=>H[fn]({[key]:bad}),fn+' '+key);
 for(const fn of[()=>H.parallelLink(.56),()=>H.sunPlanet(-1),()=>H.governor({lag:0}),()=>H.threads({driver:20.5}),()=>H.threads({starts:0}),()=>H.interchangeability({count:2.2}),()=>H.interchangeability({holeWidth:-.1}),()=>H.interchangeability({minimum:.1,maximum:.05}),()=>H.indicator({clearance:0}),()=>H.rolling({reduction:1})])assert.throws(fn);
});
test('TECH7 condensing a receiver and pushing a piston use distinct pressure balances',()=>{
 const a=H.steamDevice({ambient:101.325,condensed:10,steam:200}),b=H.steamDevice({ambient:101.325,condensed:10,steam:400});assert.equal(a.pressureHead,b.pressureHead);assert.ok(b.dischargeHead>a.dischargeHead);assert.equal(H.steamDevice({ambient:100,condensed:100}).suctionPossible,false);assert.ok(H.steamDevice({ambient:100,condensed:150}).force<0);
});
test('TECH7 a mine-pump load can exceed the beam capacity; motion is not predicted by cycle phase',()=>{
 const a=H.newcomen(),b=H.newcomen({area:.05,armRatio:3,pumpArea:.05,head:150});assert.equal(a.loadFeasible,true);assert.equal(b.loadFeasible,false);assert.ok(b.pumpWork>b.work);assert.ok(a.indicatedFraction<1);assert.ok(b.indicatedFraction<1);
});
test('TECH7 removing cyclic cylinder reheat changes the declared heat budget without inventing a universal fuel ratio',()=>{
 const zero=H.condenser({deltaT:0}),same=H.condenser({reheatFraction:1}),cold=H.condenser({reheatFraction:0});assert.equal(zero.chosenSaving,0);assert.equal(same.chosenSaving,0);assert.equal(cold.separate.reheat,0);assert.ok(cold.chosenSaving>.8);assert.ok(cold.separateFraction<1);
});
test('TECH7 boring bar deflection obeys stated loads, supports and fourth-power diameter dependence',()=>{
 const a=H.boring(),b=H.boring({diameter:.24});assert.ok(Math.abs(a.cantilever/a.supported-16)<1e-12);assert.ok(Math.abs(a.cantilever/b.cantilever-16)<1e-12);assert.equal(a.curves[0].supported,0);assert.equal(a.curves.at(-1).supported,0);assert.equal(H.boring({load:0}).cantilever,0);
});
test('TECH7 equal sun/planet gearing constrains absolute angles while the planet oscillates',()=>{
 for(const phi of[0,.2,1,3,5,2*Math.PI,4*Math.PI]){const z=H.sunPlanet(phi,.3);assert.ok(Math.abs(z.sun+z.planet-2*phi)<1e-14);}const end=H.sunPlanet(2*Math.PI,.3);assert.ok(Math.abs(end.sunTurns-2)<1e-14);
});
test('TECH7 governor droop and lag remain properties of the stated stable two-state teaching system',()=>{
 assert.equal(H.governor({gain:0}).steadySpeed,-.3);assert.ok(Math.abs(H.governor({gain:5}).steadySpeed+.05)<1e-16);const tiny=H.governor({time:1e-20}).current;assert.ok(tiny.speed<0);assert.ok(tiny.throttle>0);assert.ok(Math.abs(tiny.speed/(-.3e-20)-1)<1e-14);assert.equal(H.governor({load:0}).trace.every(x=>x.speed===0&&x.throttle===0),true);
});
test('TECH7 linkage satisfies all three rod lengths and resolves its fifth-order deviation at the appropriate scale',()=>{
 for(const row of fixture.cases.filter(x=>x.family==='parallelLink')){const z=H.parallelLink(...row.args),expected=Number(row.expected.deviation);assert.ok(z.arms.every(x=>Math.abs(x-2)<2e-14));assert.ok(Math.abs(z.coupler-2)<2e-14);if(expected!==0)assert.ok(Math.abs(z.deviation/expected-1)<3e-13,'relative accuracy at '+z.theta);assert.equal(z.deviationSign,Math.sign(z.theta));}
 assert.equal(H.parallelLink(0).deviation,0);assert.equal(H.parallelLink(Number.MIN_VALUE).deviationUnderflow,true);assert.ok(H.parallelLink(.01).deviation>0);assert.ok(H.parallelLink(-.01).deviation<0);
});
test('TECH7 governor ball geometry uses its own stated conical equilibrium, with an explicit missing branch',()=>{assert.equal(H.governorCone(0).radius,null);assert.equal(H.governorCone(.4).angle,null);const low=H.governorCone(.75),high=H.governorCone(1.25);assert.ok(high.radius>low.radius);assert.ok(high.height<low.height);assert.ok(Math.abs(high.radius**2+high.height**2-1)<1e-14);assert.throws(()=>H.governorCone(NaN));});
test('TECH7 indicator work retains its isothermal limit, sign and zero-cycle case',()=>{
 const z=H.indicator({exponent:1});assert.ok(Math.abs(z.expansion-z.supply*z.vcut*Math.log(z.vmax/z.vcut))<1e-12);for(const n of[1-Number.EPSILON/2,1,1+Number.EPSILON])assert.ok(Math.abs(H.indicator({exponent:n}).work-z.work)<1e-11);assert.equal(H.indicator({cutoff:1,supply:200,back:200}).work,0);assert.ok(H.indicator({back:900}).work<0);
});
test('TECH7 subnormal cut-off admission is computed from the original factors before volume rounding',()=>{const z=H.indicator({cutoff:Number.MIN_VALUE});assert.equal(z.vcut,z.vmin);assert.ok(z.admission>0);assert.equal(z.admission/Number.MIN_VALUE,200);assert.equal(H.indicator({cutoff:0}).admission,0);});
test('TECH7 elastic hoop stresses are identities, and Carnot entropy is exactly zero at the reversible limit',()=>{
 const a=H.highPressure(),b=H.highPressure({difference:400});assert.equal(a.volume/b.volume,2);assert.equal(b.thinHoop/a.thinHoop,2);assert.ok(a.lameHoop>a.thinHoop);assert.equal(H.carnot({utilization:1}).entropy,0);assert.equal(H.carnot({hot:300,cold:300}).work,0);assert.equal(H.carnot({hot:300,cold:600}).work,null);assert.equal(H.carnot({utilization:Number.MIN_VALUE}).workPositive,true);
});
test('TECH7 falling carbon mass need not imply falling concentration, and constant-width rolling conserves volume',()=>{
 const z=H.puddling({carbonRate:.1,ironRate:1});assert.ok(z.current.carbon<35);assert.ok(z.current.fraction>.035);assert.equal(z.concentrationTrend,'rising');for(const r of[0,.5,.9]){const a=H.rolling({reduction:r});assert.ok(Math.abs(a.finalVolume/a.initialVolume-1)<1e-14);}
});
test('TECH7 an acid-converter teaching ledger leaves phosphorus mass while its fraction can rise',()=>{
 const a=H.bessemer(),b=H.bessemer({removed:1});assert.equal(a.initialPhosphorus,b.initialPhosphorus);assert.ok(b.finalPhosphorusFraction>a.finalPhosphorusFraction);assert.equal(b.carbon,0);assert.equal(H.bessemer({removed:0,chosenLoss:0}).heat,0);
});
test('TECH7 a change-gear ratio sets lead; multiple starts change pitch rather than carriage feed',()=>{
 const one=H.threads({starts:1}),four=H.threads({starts:4});assert.equal(one.advance,four.advance);assert.equal(four.pitch*4,one.pitch);assert.equal(one.actual,four.actual);assert.equal(H.threads({amplitude:0,slope:0}).error,0);
});
test('TECH7 tolerance probabilities include point masses, uniform limits and a bias counterexample',()=>{
 assert.equal(H.interchangeability({holeWidth:0,shaftWidth:0,minimum:.04,maximum:.04}).probability,1);assert.equal(H.interchangeability({holeWidth:0,shaftWidth:0,minimum:.04000000000000001}).probability,0);
 const broad=H.interchangeability({holeWidth:.03,shaftWidth:.03,bias:.04}),tight=H.interchangeability({holeWidth:0,shaftWidth:0,bias:.04});assert.ok(broad.probability>0);assert.equal(tight.probability,0);assert.equal(H.interchangeability({count:0}).batchFraction,null);assert.ok(H.interchangeability({holeWidth:Number.MIN_VALUE,shaftWidth:Number.MIN_VALUE,minimum:.04,maximum:.04}).probability===0);
});
