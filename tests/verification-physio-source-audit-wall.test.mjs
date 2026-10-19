import test from'node:test';import assert from'node:assert/strict';import{heartBeat}from'../content/physio/ch03.shared.js';import{sphereWall,wallStress}from'../content/physio/physio-source-audit-wall.js';
const close=(a,b,e=1e-10)=>assert.ok(Math.abs(a-b)<=e*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Spherical shell geometry preserves cavity and wall volume independently over601 samples',()=>{for(let j=0;j<=600;j++){const V=20+j*.4,W=80+j*.4,g=sphereWall(V,W);close(4*Math.PI*g.ri**3/3,V);close(4*Math.PI*(g.ro**3-g.ri**3)/3,W);assert.ok(g.h>0);}});
test('Finite-thickness cut stress balances independently integrated pressure on hemisphere; thin-wall relative error and limit are exact',()=>{
 for(const V of[20,100,250])for(const W of[.001,80,320])for(const P of[0,5,20]){const g=sphereWall(V,W),s=wallStress(P,g);let sum=0;const n=2000,h=(Math.PI/2)/n;for(let j=0;j<=n;j++){const t=h*j,sumand=Math.cos(t)*Math.sin(t);sum+=(j===0||j===n?1:j%2?4:2)*sumand;}const force=2*Math.PI*g.ri**2*P*sum*h/3;close(s.cut*Math.PI*(g.ro**2-g.ri**2),force);if(P){close(s.thin/s.cut-1,g.h/(2*g.ri));if(W===.001)assert.ok(s.relativeExcess<1e-4);}}
});
test('All16 actual afterload/wall-volume/dilation/contractility corners preserve wall volume at every sample and expose thick-wall mismatch',()=>{
 let mismatch=0;for(const R of[.7,2.4])for(const W of[80,320])for(const V0 of[10,60])for(const Ees of[1,4]){const B=heartBeat({R,V0,Ees});for(let i=0;i<B.V.length;i++){const g=sphereWall(B.V[i],W),s=wallStress(B.P[i]*.133322,g);close(4*Math.PI*(g.ro**3-g.ri**3)/3,W);assert.ok(s.thin>=s.cut&&Number.isFinite(s.thin));mismatch=Math.max(mismatch,s.relativeExcess);}}assert.ok(mismatch>.2);
});
