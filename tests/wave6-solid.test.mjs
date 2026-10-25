import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../content/solid/ch06.shared.js';
const {Q}=H;
const families=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-solid-reference.json',import.meta.url))).families;
const functions={beam:H.beamState,interval:H.intervalBalance,plane:H.planeSections,flexure:H.flexure,area:H.areaAssembly,efficiency:H.sectionEfficiency,shear:H.beamShear,joint:H.jointShearFlow,channel:H.channelShearCenter,composite:H.compositeSection,unsymmetric:H.unsymmetricBending,plastic:H.plasticBending};
let comparisons=0;const failures=[];
const check=(ok,label,a,e)=>{comparisons++;if(!ok)failures.push({label,actual:a,expected:e});};
function compare(actual,expected,label){
 if(expected&&typeof expected==='object'&&'value'in expected&&'sign'in expected){
  if(!actual||typeof actual.value!=='number'){check(false,label+' quantity',actual?.value,expected.value);return;}
  const value=typeof expected.value==='string'?(expected.sign<0?-Infinity:Infinity):expected.value;
  check(Object.is(actual.value,value),label+' correctly rounded original-input quantity',actual.value,value);
  check(actual.sign===expected.sign,label+' sign',actual.sign,expected.sign);
  check(actual.belowRange===expected.belowRange,label+' below range',actual.belowRange,expected.belowRange);
  check(actual.aboveRange===expected.aboveRange,label+' above range',actual.aboveRange,expected.aboveRange);
  check(expected.sign?Number.isFinite(actual.logMagnitude)&&Math.abs(actual.logMagnitude-expected.logMagnitude)<3e-9:actual.logMagnitude===-Infinity,label+' log magnitude',actual.logMagnitude,expected.logMagnitude);return;
 }
 if(Array.isArray(expected)){check(Array.isArray(actual)&&actual.length===expected.length,label+' dense array length',actual?.length,expected.length);for(let j=0;j<expected.length;j++)compare(actual?.[j],expected[j],label+'.'+j);return;}
 if(expected&&typeof expected==='object'){for(const k of Object.keys(expected))compare(actual?.[k],expected[k],label+'.'+k);return;}
 if(typeof expected==='number')check(Number.isFinite(actual)&&Math.abs(actual-expected)<=2e-12,label+' approximate geometry',actual,expected);
 else check(actual===expected,label,actual,expected);
}
for(const[name,rows]of Object.entries(families))test(`${name}: ${rows.length} independent force/area/stress-integral cases`,()=>{
 const start=failures.length;
 for(const[j,{args,expect,probes=[]}]of rows.entries()){
  compare(functions[name](args),expect,name+'['+j+']');
  for(const[k,probe]of probes.entries())compare(H[probe.method](args,...probe.extra),probe.expect,name+'['+j+'].probe'+k);
 }
 assert.equal(failures.length-start,0,JSON.stringify(failures.slice(start,start+15),null,2));
});
const same=(a,b,label)=>assert.equal(Q.sign(Q.sub(a,b)),0,label);
test('beam loads close exactly, including load/support collisions and oriented atom endpoints',()=>{
 for(const{args}of families.beam){const z=H.beamState(args);for(const k of['forceResidual','momentResidual','endMoment'])same(z[k].exact,0,k);}
 for(const{args}of families.interval){const z=H.intervalBalance(args);same(z.shearResidual.exact,0);same(z.momentResidual.exact,0);}
 const left=H.intervalBalance({loadFraction:.4,startFraction:.4,endFraction:.8}),right=H.intervalBalance({loadFraction:.4,startFraction:.2,endFraction:.4});assert.equal(left.atomMultiplicity,0);assert.equal(right.atomMultiplicity,1);
});
test('section quantities obey translation, equal-area redistribution and elastic-modulus invariance',()=>{
 const a=H.areaAssembly(),b=H.areaAssembly({rects:a.parameters.rects.map(r=>({...r,x:r.x+10}))});same(b.centroidX.exact,Q.add(a.centroidX.exact,10));for(const k of['inertiaX','inertiaY','productInertia','axisInertia'])same(a[k].exact,b[k].exact,k);
 const s=H.flexure({modulus:210}),t=H.flexure({modulus:42});same(s.stress.exact,t.stress.exact);same(t.curvature.exact,Q.mul(5,s.curvature.exact));
 for(const u of[0,Number.MIN_VALUE,.5,.9]){const x=H.sectionEfficiency({redistribution:u});same(x.areaResidual.exact,0);same(x.chosen.area.exact,x.square.area.exact);same(x.tallRatio.exact,3);if(u===0)same(x.chosen.sectionModulus.exact,x.tall.sectionModulus.exact);else assert.equal(Q.sign(Q.sub(x.chosen.sectionModulus.exact,x.tall.sectionModulus.exact)),1);}
});
test('thin-wall flow and elastic stress recover the declared signed force and moments',()=>{
 for(const{args}of families.channel){const z=H.channelShearCenter(args);same(z.forceResidual.exact,0);same(z.torqueResidual.exact,0);if(z.parameters.loadPosition==='shear centre')same(z.twistingMomentCCW.exact,0);}
 const zero=H.channelShearCenter({shear:0}),tiny=H.channelShearCenter({shear:Number.MIN_VALUE});same(zero.shearCentre.exact,tiny.shearCentre.exact);assert.equal(zero.zeroLoad,true);assert.equal(tiny.zeroLoad,false);
 for(const name of['shear','composite','unsymmetric'])for(const{args}of families[name]){const z=functions[name](args);for(const k of['resultantResidual','axialResultant','momentResidual','momentYResidual','momentZResidual'])if(z[k])same(z[k].exact,0,name+' '+k);}
});
test('composite interface strain is continuous, with no artificial stress jump at a neutral interface',()=>{
 for(const{args}of families.composite){const a=H.compositeStressAt(args,'lower',1),b=H.compositeStressAt(args,'upper',0);same(a.strain.exact,b.strain.exact);same(b.stress.exact,Q.mul(a.stress.exact,args.modulusRatio??20));}
 const p={lowerHeight:100,upperHeight:50,modulusRatio:4};same(H.compositeSection(p).neutralHeight.exact,100);same(H.compositeStressAt(p,'lower',1).stress.exact,0);same(H.compositeStressAt(p,'upper',0).stress.exact,0);
});
test('plastic bending retains first yield and a strictly unattained finite-curvature limit',()=>{
 for(const{args}of families.plastic){const z=H.plasticBending(args);same(Q.add(z.elasticAreaFraction.exact,z.yieldedAreaFraction.exact),1);same(z.axialResultant.exact,0);if(z.parameters.section==='rectangle')same(z.shapeFactor.exact,Q.div(3,2));if(z.parameters.state==='finite'){assert.equal(Q.sign(z.plasticDeficit.exact),1);assert.notEqual(z.curvature,null);}else{same(z.plasticDeficit.exact,0);assert.equal(z.curvature,null);}}
 const z=H.plasticBending({curvatureRatio:1});assert.equal(z.phase,'first yield');same(z.moment.exact,z.yieldMoment.exact);same(z.yieldedAreaFraction.exact,0);
});
test('positive tiny inputs remain distinct from unloaded and undefined-ratio states',()=>{
 const tiny=Number.MIN_VALUE;
 assert.equal(H.beamState({pointLoad:tiny,uniformLoad:0}).peakMoment.sign,1);
 assert.equal(H.planeSections({curvature:tiny,eta:tiny}).strain.sign,-1);
 assert.equal(H.planeSections({curvature:tiny,eta:tiny}).strain.belowRange,true);
 assert.equal(H.planeSections({curvature:0}).radius,null);assert.equal(H.planeSections({curvature:tiny}).radius.aboveRange,true);
 assert.equal(H.jointShearFlow({uniformLoad:0}).globalAllowedPitch,null);assert.equal(H.jointShearFlow({uniformLoad:tiny}).globalAllowedPitch.aboveRange,true);
 assert.equal(H.unsymmetricBending({momentZ:tiny,momentY:tiny}).neutralNormal!==null,true);assert.equal(H.unsymmetricBending({momentZ:0,momentY:0}).neutralNormal,null);
 assert.equal(H.plasticBending({curvatureRatio:tiny}).moment.sign,1);
});
test('declared domains reject malformed geometry and unsupported raw states',()=>{
 const bad={beam:[{span:0},{pointLoad:-Number.MIN_VALUE},{side:'middle'}],interval:[{startFraction:0},{endFraction:1}],plane:[{curvature:1.0000000000000002},{length:0},{eta:2}],flexure:[{height:0},{modulus:0},{moment:101}],area:[{rects:Array(3)},{rects:[null,null,null]},{axisHeight:221}],efficiency:[{heightRatio:.99},{redistribution:1}],shear:[{section:'circle'},{webFraction:0},{flangeFraction:.5}],joint:[{rows:1.5},{capacity:0},{pitch:0}],channel:[{thickness:6},{loadPosition:'origin'},{flangeWidth:0}],composite:[{modulusRatio:0},{interfaceSide:'middle'},{upperHeight:0}],unsymmetric:[{thickness:60},{momentY:6},{span:0}],plastic:[{state:'collapse'},{curvatureRatio:-Number.MIN_VALUE},{yieldStress:0}]};
 for(const[name,cases]of Object.entries(bad)){for(const p of cases)assert.throws(()=>functions[name](p),name);assert.throws(()=>functions[name](null),name+' null');assert.throws(()=>functions[name]([]),name+' array');}
 assert.throws(()=>H.channelFlowAt({},'unsupported',.5));assert.throws(()=>H.compositeStressAt({},'lower',1.01));assert.throws(()=>H.plasticStressAt({},NaN));
});
test('complete independent inventory includes all twelve models and physical profile probes',()=>{
 assert.equal(Object.keys(families).length,12);assert.equal(Object.values(families).reduce((n,r)=>n+r.length,0),1247);assert.ok(comparisons>100000);assert.equal(failures.length,0);
});
