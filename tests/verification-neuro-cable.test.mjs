import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTree,hinesSolve,treeSteady,treeSim,lambdaUm,gInf,unmyelinatedSpeed,buildMyelinated,myelinatedSpeed} from '../content/neuro/ch04.shared.js';
const near=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
function dense(A,b){A=A.map((r,i)=>[...r,b[i]]);for(let k=0;k<b.length;k++){let p=k;for(let j=k+1;j<b.length;j++)if(Math.abs(A[j][k])>Math.abs(A[p][k]))p=j;[A[p],A[k]]=[A[k],A[p]];for(let j=k+1;j<b.length;j++){const f=A[j][k]/A[k][k];for(let l=k;l<=b.length;l++)A[j][l]-=f*A[k][l];}}const x=Array(b.length).fill(0);for(let i=b.length-1;i>=0;i--)x[i]=(A[i].at(-1)-x.slice(i+1).reduce((s,v,j)=>s+v*A[i][i+1+j],0))/A[i][i];return x;}
test('tree elimination matches pivoted dense circuit equations and independent Kirchhoff balance',()=>{
 for(const dx of[25,60,200]){const tr=buildTree([{parent:-1,len:120,dia:6},{parent:0,len:200,dia:3},{parent:0,len:130,dia:2},{parent:1,len:90,dia:1}],{dxMax:dx,Ra:100}),n=tr.n,A=Array.from({length:n},()=>Array(n).fill(0)),I=Array.from({length:n},(_,i)=>.002*Math.sin(i+1));for(let i=0;i<n;i++)A[i][i]=tr.area[i]*.05*1000;for(let i=1;i<n;i++){const p=tr.par[i],r=4*100/Math.PI*(tr.len[i]*1e-4/(tr.dia[i]*1e-4)**2+tr.len[p]*1e-4/(tr.dia[p]*1e-4)**2)/2,g=1e6/r;near(g,tr.gc[i]);A[i][i]+=g;A[p][p]+=g;A[i][p]=A[p][i]=-g;}
 const expected=dense(A,I),actual=treeSteady(tr,I,.05);actual.forEach((v,i)=>near(v,expected[i]));near(actual.reduce((s,v,i)=>s+v*tr.area[i]*50,0),I.reduce((a,b)=>a+b));}
});
test('sealed cylinder discretization converges to independent hyperbolic cable solution',()=>{
 const errors=[];for(const dx of[100,50,25]){const L=1000,d=2,Rm=20000,Ra=100,tr=buildTree([{parent:-1,len:L,dia:d}],{dxMax:dx,Ra}),I=Array(tr.n).fill(0);I[0]=.01;const V=treeSteady(tr,I,1000/Rm),lam=lambdaUm(d,Rm,Ra),err=Math.max(...V.map((v,i)=>Math.abs(v-.01/gInf(d,Rm,Ra)*Math.cosh((L-tr.pos[i])/lam)/Math.sinh(L/lam))));errors.push(err);}assert.ok(errors[1]<errors[0]*.27&&errors[2]<errors[1]*.27);
});
test('passive transient conserves total charge with sealed ends and exact implicit leak update',()=>{
 const tr=buildTree([{parent:-1,len:200,dia:5},{parent:0,len:300,dia:2},{parent:0,len:170,dia:3}],{dxMax:30}),dt=.02,r=treeSim(tr,{dt,tEnd:2,gL:.05,cm:1,EL:-65,V0:-65,stim:(_,I)=>{I[3]=.01;},rec:Array.from({length:tr.n},(_,i)=>i)});let Q=0;for(let k=1;k<r.t.length;k++){Q=(Q+dt*.01)/(1+dt*.05);near(r.V.reduce((s,row,i)=>s+(row[k]+65)*tr.area[i]*1000,0),Q,1e-10);}
});
test('measured unmyelinated velocities converge under joint time and space refinement',()=>{
 for(const d of[10,160,476]){const v=[[100,.02],[50,.01],[25,.005]].map(([dx,dt])=>unmyelinatedSpeed(d,{dx,dt,N:30000/dx}).speed);assert.ok(v.every(Number.isFinite));assert.ok(Math.abs(v[2]-v[1])<Math.abs(v[1]-v[0]));assert.ok(Math.abs(v[2]/v[0]-1)<.02);}
 const a=unmyelinatedSpeed(40).speed,b=unmyelinatedSpeed(160).speed;near(b/a,2,.02);
});
test('myelin geometry has explicit series-layer approximation and measured speed stabilizes in time',()=>{
 for(const D of[.5,4,16]){const M=buildMyelinated(D),r=myelinatedSpeed(D),fine=myelinatedSpeed(D,{dt:.00125});near(M.d,.65*D);near(M.L,100*D);assert.equal(M.nodeIdx,undefined);assert.ok(M.nb>=1);assert.ok(Number.isFinite(r.speed)&&Number.isFinite(fine.speed));assert.ok(Math.abs(r.speed/fine.speed-1)<.04);}
});
