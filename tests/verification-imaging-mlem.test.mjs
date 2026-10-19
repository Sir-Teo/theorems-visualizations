import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSystem, forward, subsetSens, osemSub, logLik } from '../content/imaging/ch04.shared.js';
const close=(a,b,t=1e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} versus ${b}`);
const system=A=>({N:A[0].length,rows:A.map((a,view)=>({view,idx:a.flatMap((v,j)=>v?[j]:[]),val:a.filter(Boolean)}))});
const dot=(a,b)=>a.reduce((s,v,j)=>s+v*b[j],0);

test('MLEM uses the transpose of its actual ray projector and sensitivity weights',()=>{
  const sys=buildSystem(6,5,10),x=Float64Array.from({length:sys.N},(_,j)=>.3+(j%7)/5),z=Float64Array.from(sys.rows,(_,i)=>.2+(i%9)/4);
  const ax=forward(sys,x),y=Float64Array.from(ax,(v,i)=>v*z[i]),sens=subsetSens(sys,1),next=Float64Array.from(x);
  osemSub(sys,y,next,0,1,sens);
  const atz=Float64Array.from(next,(v,j)=>v*sens[0][j]/x[j]);
  close(dot(z,ax),dot(atz,x));
  for(let j=0;j<sys.N;j++){
    let independent=0;sys.rows.forEach((r,i)=>{const k=Array.from(r.idx).indexOf(j);if(k>=0)independent+=r.val[k]*z[i]});
    close(atz[j],independent);
  }
});

test('Full-data update conserves sensitivity-weighted counts, even below former denominator and sensitivity floors',()=>{
  for(const scale of [1,1e-18]){
    const sys=system([[scale,2*scale],[3*scale,scale],[0,0]]),y=[1,4,0],x=[.7,1.2],sens=subsetSens(sys,1);
    osemSub(sys,y,x,0,1,sens);close(dot(sens[0],x),5);assert.ok(x.every(Number.isFinite));
  }
});

test('Zero-count empty rays use 0/0=0, unobserved columns are inert, and unsupported positive counts are rejected',()=>{
  const sys=system([[1,0],[0,0]]),x=[2,7],sens=subsetSens(sys,1);
  osemSub(sys,[0,0],x,0,1,sens);assert.deepEqual(x,[0,7]);assert.equal(logLik(sys,[0,0],x),0);
  assert.equal(logLik(sys,[1,0],x),-Infinity);
  assert.throws(()=>osemSub(sys,[1,0],x,0,1,sens),/zero model prediction/);
  assert.throws(()=>osemSub(sys,[0,1],[2,7],0,1,sens),/zero model prediction/);
});

test('Poisson likelihood uses the exact tiny mean and the correct zero-bin convention',()=>{
  const sys=system([[1e-18],[0]]);
  close(logLik(sys,[1,0],[2]),Math.log(2e-18)-2e-18);
  assert.equal(logLik(sys,[0,0],[0]),0);
  assert.equal(logLik(sys,[1,0],[0]),-Infinity);
});

test('Zero locking can give a non-ML fixed point; a positive start approaches an independently certified boundary MLE',()=>{
  const A=[[1,1],[1,2]],sys=system(A),y=[1,4],sens=subsetSens(sys,1),locked=[1,0],positive=[1,1],optimum=[0,5/3];
  osemSub(sys,y,locked,0,1,sens);assert.deepEqual(locked,[2.5,0]);
  const mu=optimum.map((_,i)=>dot(A[i],optimum)),gradient=[0,1].map(j=>A.reduce((s,a,i)=>s+a[j]*(y[i]/mu[i]-1),0));
  close(gradient[0],-.2);close(gradient[1],0); // Concavity + these KKT signs certify the global constrained maximum.
  assert.ok(logLik(sys,y,optimum)>logLik(sys,y,locked));
  let old=logLik(sys,y,positive);for(let k=0;k<1500;k++){osemSub(sys,y,positive,0,1,sens);const ll=logLik(sys,y,positive);assert.ok(ll>=old-1e-12);old=ll}
  close(positive[0],0);close(positive[1],5/3);close(old,logLik(sys,y,optimum));
});

test('Fixed OSEM subsets can cycle and decrease full-data likelihood even from the exact MLE',()=>{
  const sys=system([[1],[1]]),y=[1,9],x=[5],sens=subsetSens(sys,2),best=logLik(sys,y,x);
  for(let k=0;k<4;k++){osemSub(sys,y,x,0,2,sens);close(x[0],1);assert.ok(logLik(sys,y,x)<best);osemSub(sys,y,x,1,2,sens);close(x[0],9);assert.ok(logLik(sys,y,x)<best)}
  const full=[1];osemSub(sys,y,full,0,1,subsetSens(sys,1));close(full[0],5);
});
