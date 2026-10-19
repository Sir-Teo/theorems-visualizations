import test from 'node:test';import assert from 'node:assert/strict';
import{FFL_TYPES,fflType,isCoherent,reg,logic,fflSim}from'../content/sysbio/ch03.shared.js';
const near=(a,b,e=1e-10)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('every edge sign and type number matches the original Tables 1 and 2',()=>{
 const original={C1:[1,1,1],C2:[-1,1,-1],C3:[1,-1,-1],C4:[-1,-1,1],I1:[1,-1,1],I2:[-1,-1,-1],I3:[1,1,-1],I4:[-1,1,1]};
 assert.equal(FFL_TYPES.length,8);assert.equal(new Set(FFL_TYPES.map(t=>t.s.join())).size,8);for(const[id,s]of Object.entries(original)){assert.deepEqual(FFL_TYPES.find(t=>t.id===id).s,s);assert.equal(fflType(...s),id);assert.equal(isCoherent(...s),id[0]==='C');}
});
test('strong-regulation AND logic agrees with each original binary input table',()=>{
 const expected={C1:(x,y)=>x*y,C2:(x,y)=>(1-x)*y,C3:(x,y)=>1-x,C4:(x,y)=>x,I1:(x,y)=>x*(1-y),I2:(x,y)=>(1-x)*(1-y),I3:()=>0,I4:()=>0};
 for(const type of FFL_TYPES)for(const x of [0,1])for(const y of [0,1]){const Y=reg(type.s[0],x,.01,4),z=logic('AND',reg(type.s[2],x,.01,4),reg(type.s[1],y*Y,.01,4));near(z,expected[type.id](x,y),1e-7);}
});
test('coherent OR logic reverses which types retain both steady input signals',()=>{
 const expected={C1:x=>x,C2:x=>1-x,C3:(x,y)=>Math.max(1-x,1-y),C4:(x,y)=>Math.max(x,1-y)};
 for(const type of FFL_TYPES.filter(t=>t.id[0]==='C'))for(const x of [0,1])for(const y of [0,1]){const Y=reg(type.s[0],x,.01,4),z=logic('OR',reg(type.s[2],x,.01,4),reg(type.s[1],y*Y,.01,4));near(z,expected[type.id](x,y),1e-7);}
});
test('all types and gate options conserve their exact steady state for constant inputs',()=>{
 for(const type of FFL_TYPES)for(const lg of ['AND','OR','SUM']){const p={sxy:type.s[0],syz:type.s[1],sxz:type.s[2],lg,Kxy:.5,Kyz:.5,Kxz:.5,n:2,by:1,ay:1,bz:1,az:1},o=fflSim(p,()=>.8,20,.01),Y=reg(p.sxy,.8,.5,2),Z=logic(lg,reg(p.sxz,.8,.5,2),reg(p.syz,Y,.5,2));for(const i of [0,100,2000]){near(o.Y[i],Y);near(o.Z[i],Z);}}
});
