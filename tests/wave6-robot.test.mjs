import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../content/robot/ch06.shared.js';
const {Q}=H;
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-robot-reference.json',import.meta.url)));
const functions={rigid:H.rigidBody,chain:H.chainState,motion:H.prescribedMotion,ellipse:H.massEllipse,recursive:H.recursiveDynamics,task:H.taskDynamics,geared:H.gearedDynamics,release:H.freeElbow,contact:H.constrainedDynamics};
let comparisons=0;const failures=[],worstScience={};
const check=(ok,label,actual,expected)=>{comparisons++;if(!ok)failures.push({label,actual,expected});};
function compare(actual,expected,label,relative){
 if(expected&&typeof expected==='object'&&'value'in expected&&'sign'in expected){
  if(!actual||typeof actual.value!=='number'){check(false,label+' quantity',actual?.value,expected.value);return;}
  const e=typeof expected.value==='string'?(expected.sign<0?-Infinity:Infinity):expected.value;
  if(expected.absoluteTolerance!==undefined){check(Number.isFinite(actual.value)&&Math.abs(actual.value-e)<=expected.absoluteTolerance,label+' scoped absolute error',actual.value,e);return;}
  const allowance=Number.isFinite(e)?Math.max(Math.abs(e)*relative,2*Number.MIN_VALUE):0;
  if(Number.isFinite(e)&&Math.abs(e)>1e-300){const error=Math.abs(actual.value-e)/Math.abs(e),family=label.split('[')[0];if(error>(worstScience[family]?.relativeError??-1))worstScience[family]={relativeError:error,label};}
  check(Number.isFinite(e)?Number.isFinite(actual.value)&&Math.abs(actual.value-e)<=allowance:Object.is(actual.value,e),label+' scientific value',actual.value,e);
  check(actual.sign===expected.sign,label+' sign',actual.sign,expected.sign);
  check(actual.belowRange===expected.belowRange,label+' below range',actual.belowRange,expected.belowRange);
  check(actual.aboveRange===expected.aboveRange,label+' above range',actual.aboveRange,expected.aboveRange);
  check(expected.sign?Number.isFinite(actual.logMagnitude)&&Math.abs(actual.logMagnitude-expected.logMagnitude)<Math.max(3e-9,relative*3):actual.logMagnitude===-Infinity,label+' log magnitude',actual.logMagnitude,expected.logMagnitude);
  return;
 }
 if(Array.isArray(expected)){check(Array.isArray(actual)&&actual.length===expected.length,label+' dense array length',actual?.length,expected.length);for(let j=0;j<expected.length;j++)compare(actual?.[j],expected[j],label+'.'+j,relative);return;}
 if(expected&&typeof expected==='object'){for(const k of Object.keys(expected))compare(actual?.[k],expected[k],label+'.'+k,relative);return;}
 if(typeof expected==='number')check(Number.isFinite(actual)&&Math.abs(actual-expected)<=Math.max(Math.abs(expected)*relative,3e-12),label+' approximate geometry',actual,expected);
 else check(actual===expected,label,actual,expected);
}
for(const[name,rows]of Object.entries(fixture.families))test(`${name}: ${rows.length} independent uniform-rod / quaternion / elliptic / saddle-solve cases`,()=>{
 const start=failures.length;
 for(const[j,{args,expect}]of rows.entries())compare(functions[name](args),expect,name+'['+j+']',name==='release'?2e-9:3e-11);
 assert.equal(failures.length-start,0,JSON.stringify(failures.slice(start,start+18),null,2));
});
const same=(a,b,label)=>assert.equal(Q.sign(Q.sub(a,b)),0,label);
const valueMatrix=m=>m.map(r=>r.map(q=>q.value));
test('uniform rods retain SPD and recursive forces recover the exact Lagrange torque',()=>{
 for(const {args}of fixture.families.recursive){const s=H.recursiveDynamics(args);assert.equal(s.massDeterminant.sign,1);same(s.massDeterminantResidual.exact,0);for(const q of s.torqueResidual)same(q.exact,0);}
 for(const q2 of[-180,-90,0,90,180,Number.MIN_VALUE])assert.equal(H.chainState({q2}).massDeterminant.sign,1);
});
test('Christoffel passivity and ideal motor power are exact algebraic identities',()=>{
 for(const {args}of fixture.families.motion){const s=H.prescribedMotion(args);same(s.powerResidual.exact,0);same(s.skewPower.exact,0);for(let i=0;i<2;i++)for(let j=0;j<2;j++)same(Q.add(s.skewMatrix[i][j].exact,s.skewMatrix[j][i].exact),0);}
 for(const {args}of fixture.families.geared){const s=H.gearedDynamics(args);same(s.powerResidual.exact,0);assert.equal(s.gearedDeterminant.sign,1);}
});
test('force-response rank and task inertia distinguish a singular arm from every positive tiny bend',()=>{
 for(const q2 of[0,180,-180]){const s=H.taskDynamics({q1:0,q2,direction:0});assert.equal(s.taskRank,1);assert.equal(s.taskMass,null);assert.equal(s.directionalMass,null);same(s.responseEigenMin.exact,0);assert.equal(s.massDeterminant.sign,1);}
 for(const q2 of[1e-12,1e-100,Number.MIN_VALUE,-Number.MIN_VALUE]){const s=H.taskDynamics({q1:0,q2,direction:0});assert.equal(s.taskRank,2);assert.equal(s.taskDeterminant.sign,1);assert.notEqual(s.taskMass,null);assert.equal(s.directionalMass.sign,1);same(s.responseDeterminantResidual.exact,0);}
 const tiny=H.taskDynamics({q1:0,q2:Number.MIN_VALUE,direction:0});assert.equal(tiny.taskDeterminant.belowRange,true);assert.equal(tiny.directionalMass.aboveRange,true);assert.equal(tiny.responseEigenMin.sign,1);
 const a=H.taskDynamics({force:0}),b=H.taskDynamics({force:2});assert.deepEqual(a.taskMass,b.taskMass);assert.deepEqual(a.responseEllipse.axes,[0,0]);
});
test('motor mounting and gear sense retain their actual off-diagonal rotor inertia',()=>{
 const a=H.gearedDynamics({mount:'link-mounted',sense:1}),b=H.gearedDynamics({mount:'link-mounted',sense:-1}),g=H.gearedDynamics({mount:'ground-mounted'});
 same(a.addedMass[0][1].exact,Q.neg(b.addedMass[0][1].exact));same(g.addedMass[0][1].exact,0);same(Q.sub(a.addedMass[0][0].exact,g.addedMass[0][0].exact),a.parameters.rotor2);
 const low=H.gearedDynamics({ratio1:1,ratio2:1}),high=H.gearedDynamics({ratio1:200,ratio2:200});assert.ok(high.relativeCoupling.value<low.relativeCoupling.value);
});
test('free rigid-body Euler balance and coaxial wrench work retain exact original factors',()=>{
 for(const {args}of fixture.families.rigid){const s=H.rigidBody(args);for(const q of[...s.angularResidual,...s.linearResidual])same(q.exact,0);same(s.workResidual.exact,0);const R=s.rotation;for(let i=0;i<3;i++)for(let j=0;j<3;j++){const x=R.reduce((v,r)=>v+r[i]*r[j],0);assert.ok(Math.abs(x-(i===j?1:0))<2e-14);}}
 const sphere=H.rigidBody({radius:.6,axialRadius:.6});same(sphere.precessionOrAcceleration.exact,0);
 const rest=H.rigidBody({transverseSpin:0,axialSpin:0});same(rest.momentumMagnitude.exact,0);
 const tiny=H.rigidBody({mode:'wrench',force:Number.MIN_VALUE,torque:Number.MIN_VALUE,time:Number.MIN_VALUE});assert.equal(tiny.displacement[0].sign,1);assert.equal(tiny.displacement[0].belowRange,true);assert.equal(tiny.work.sign,1);
});
test('released elbow has zero motor torque while the speed-controlled shoulder supplies power',()=>{
 for(const {args}of fixture.families.release){const s=H.freeElbow(args);same(s.elbowTorque.exact,0);assert.equal(s.parameters.gravity,0);if(s.steps)assert.ok(s.steps>=Math.ceil(s.dimensionlessTime.value/.001)-1);}
 const a=H.freeElbow({shoulderSpeed:3}),b=H.freeElbow({shoulderSpeed:-3});assert.equal(a.elbowRadians.value,b.elbowRadians.value);assert.equal(a.elbowRate.value,b.elbowRate.value);assert.notEqual(a.shoulderPower.value,0);
 const z=H.freeElbow({shoulderSpeed:0});same(z.elbowRate.exact,0);same(z.elbowAngleChange.exact,0);
 const tiny=H.freeElbow({shoulderSpeed:Number.MIN_VALUE,time:Number.MIN_VALUE});assert.equal(tiny.elbowRate.sign,-1);assert.equal(tiny.elbowRate.belowRange,true);assert.equal(tiny.elbowAngleChange.sign,-1);assert.equal(tiny.dimensionlessTime.sign,1);
});
test('workless contact enforces acceleration, detaches on pulling and reports degenerate normals',()=>{
 const statuses=new Set();
 for(const {args}of fixture.families.contact){const s=H.constrainedDynamics(args);statuses.add(s.status);same(s.normalVelocity.exact,0);same(s.reactionPower.exact,0);if(s.status==='active-wall'||s.status==='bilateral-guide')same(s.normalAcceleration.exact,0);if(s.status==='active-wall')assert.ok(s.reaction.sign>=0);if(s.status==='detached')same(s.reaction.exact,0);}
 for(const name of['active-wall','detached','bilateral-guide','free','degenerate-incompatible','degenerate-indeterminate'])assert.ok(statuses.has(name),name);
 const tiny=H.constrainedDynamics({q1:0,q2:Number.MIN_VALUE,normalAngle:0,speed:0,gravity:0,torque1:1});assert.equal(tiny.normalMobility.sign,1);assert.equal(tiny.normalMobility.belowRange,true);assert.notEqual(tiny.requiredReaction,null);
});
test('zero energy and tiny positive energy stay distinct without a visual numerical floor',()=>{
 const z=H.massEllipse({energy:0}),tiny=H.massEllipse({energy:Number.MIN_VALUE});assert.equal(z.collapsed,true);assert.deepEqual(z.ellipse.axes,[0,0]);assert.equal(tiny.collapsed,false);assert.ok(tiny.ellipse.axes.every(x=>x>0));assert.equal(tiny.requestedEnergy.sign,1);
});
test('declared model domains reject malformed controls and unsupported modes',()=>{
 const invalid={rigid:[{mode:'tumbling'},{mass:0},{time:3}],chain:[{m1:0},{l2:0},{q2:181},{dq1:NaN}],motion:[{amplitude1:-Number.MIN_VALUE},{duration:0},{progress:1.01}],ellipse:[{energy:-Number.MIN_VALUE},{direction:181}],recursive:[{step:.5},{step:5}],task:[{force:-1},{gravity:-1}],geared:[{ratio1:0},{rotor2:-1},{sense:0},{mount:'floating'}],release:[{initialBend:0},{bendSense:0},{shoulderSpeed:9},{time:-Number.MIN_VALUE}],contact:[{contact:'impact'},{speed:3},{normalAngle:181},{torque1:41}]};
 for(const[name,cases]of Object.entries(invalid)){for(const p of cases)assert.throws(()=>functions[name](p),name);assert.throws(()=>functions[name](null),name);assert.throws(()=>functions[name]([]),name);}
});
test('all nine independent model families and original-input extreme cases are present',t=>{
 assert.equal(Object.keys(fixture.families).length,9);assert.equal(fixture.caseCount,1110);assert.ok(Object.values(fixture.families).flat().some(x=>x.digits===2600));assert.ok(comparisons>100000);assert.equal(failures.length,0);
 t.diagnostic(JSON.stringify({independentComparisons:comparisons,worstScience}));
});
