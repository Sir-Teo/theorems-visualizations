import test from 'node:test';import assert from 'node:assert/strict';
import { twoMaterialSystem, solveTwoMaterial } from '../content/imaging/ch02-dual-energy.shared.js';
import { MATS, mu } from '../content/imaging/ch02.shared.js';
const near=(x,y,t=2e-10)=>assert.ok(Math.abs(x-y)<=t*(1+Math.abs(y)),`${x} versus ${y}`);
test('all5151 offered energy pairs retain5110 finite inverses and41 honest rank failures',()=>{
 let unique=0,singular=0;for(let E1=30;E1<=80;E1++)for(let E2=40;E2<=140;E2++){
  const a=mu(MATS.bone,E1),b=mu(MATS.tissue,E1),c=mu(MATS.bone,E2),d=mu(MATS.tissue,E2),S=twoMaterialSystem(a,b,c,d);assert.equal(S.singular,E1===E2);
  if(S.singular){singular++;assert.equal(S.rowAngleProxy,null);for(const y of[0,1,8.234]){assert.deepEqual(solveTwoMaterial(S,y,y),{status:'nonunique',bone:null,soft:null});assert.deepEqual(solveTwoMaterial(S,y,y+.0001),{status:'inconsistent',bone:null,soft:null});}continue;}
  unique++;assert.ok(Number.isFinite(S.rowAngleProxy)&&S.rowAngleProxy>=1);
  for(const[bone,soft]of[[0,0],[1.7,17.3],[3,30]]){const A1=a*bone+b*soft,A2=c*bone+d*soft,x=solveTwoMaterial(S,A1,A2);assert.equal(x.status,'unique');assert.ok(Number.isFinite(x.bone)&&Number.isFinite(x.soft));near(x.bone,bone);near(x.soft,soft);near(a*x.bone+b*x.soft,A1);near(c*x.bone+d*x.soft,A2);}
  // Independently eliminate the first unknown on a noisy data pair.
  const A1=3+.001*Math.sin(E1),A2=2+.001*Math.cos(E2),soft=(A2-(c/a)*A1)/(d-(c/a)*b),bone=(A1-b*soft)/a,x=solveTwoMaterial(S,A1,A2);near(x.bone,bone);near(x.soft,soft);
 }
 assert.equal(unique,5110);assert.equal(singular,41);
});
test('the closest nonzero offered pair is still invertible and its noise gain is explicit',()=>{
 const a=mu(MATS.bone,80),b=mu(MATS.tissue,80),c=mu(MATS.bone,81),d=mu(MATS.tissue,81),S=twoMaterialSystem(a,b,c,d);assert.ok(S.rowAngleProxy>330);assert.equal(S.singular,false);
 const base=solveTwoMaterial(S,4,3),delta=1e-6,changed=solveTwoMaterial(S,4,3+delta);near(changed.bone-base.bone,-b*delta/S.det,1e-8);near(changed.soft-base.soft,a*delta/S.det,1e-8);
});
test('rank-one equations distinguish consistent nonunique from inconsistent without an inverse',()=>{
 const S=twoMaterialSystem(1,2,2,4);assert.deepEqual(solveTwoMaterial(S,4,8),{status:'nonunique',bone:null,soft:null});assert.deepEqual(solveTwoMaterial(S,4,8.000001),{status:'inconsistent',bone:null,soft:null});
});
test('row-angle proxy is invariant under positive row scaling rather than a relative condition number',()=>{
 const S=twoMaterialSystem(1,1,1,2),R=twoMaterialSystem(1,1,10,20);near(S.rowAngleProxy,R.rowAngleProxy);const x=solveTwoMaterial(S,3,5),y=solveTwoMaterial(R,3,50);near(x.bone,y.bone);near(x.soft,y.soft);
});
test('private two-material arithmetic rejects invalid coefficient and measurement values',()=>{
 for(const bad of[0,-1,NaN,Infinity,'1',null])for(let i=0;i<4;i++){const c=[1,2,3,4];c[i]=bad;assert.throws(()=>twoMaterialSystem(...c),RangeError);}const S=twoMaterialSystem(1,1,1,2);for(const bad of[NaN,Infinity,'3',null]){assert.throws(()=>solveTwoMaterial(S,bad,2),RangeError);assert.throws(()=>solveTwoMaterial(S,2,bad),RangeError);}
});
