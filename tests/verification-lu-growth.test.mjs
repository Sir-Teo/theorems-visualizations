import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rng} from '../assets/js/viz/math.js';
import {checkedElimination,partialFactors,maxEntry,fullHistogram,fittedExponent,clippedWorstGrowth} from '../content/nla/lu-growth-audit.shared.js';
import {mm,wilkinsonGrowth,gaussMat} from '../content/nla/ch04.shared.js';
const near=(a,b,t=2e-12)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);
const det=A=>A.length===1?A[0][0]:A[0].reduce((s,x,j)=>s+(-1)**j*x*det(A.slice(1).map(r=>r.filter((_,k)=>k!==j))),0);
function invariant(A,fr){const {L,B}=partialFactors(fr),P=fr.perm.map(i=>A[i]);mm(L,B).forEach((r,i)=>r.forEach((x,j)=>near(x,P[i][j])));}

test('actual Gaussian UI inputs agree with independent 90-digit Decimal elimination at all five sizes',()=>{
 const refs=JSON.parse(readFileSync(new URL('../docs/verification/lu-growth-references.json',import.meta.url)));
 for(const r of refs.rows){const f=checkedElimination(gaussMat(rng(r.seed*977+r.n),r.n),{pivot:true,record:false});near(f.rho,+r.rho,1e-11);near(f.maxGenerated,+r.maxGenerated,1e-10);assert.deepEqual(f.perm,r.perm);}
});

test('every intermediate frame retains the whole remaining block and exact textbook flop count',()=>{
 const A=[[2,1,1,0],[4,3,3,1],[8,7,9,5],[6,7,9,8]],f=checkedElimination(A);
 assert.equal(f.ok,true);assert.deepEqual(f.steps.map(x=>x.flops),[0,21,31,34]);
 assert.equal(partialFactors(f.steps[0]).B[3][0],6);
 assert.equal(partialFactors(f.steps[1]).B[3][2],6);
 f.steps.forEach(fr=>invariant(A,fr));assert.equal(f.steps.at(-1).kind,'done');
 assert.deepEqual(f.L,[[1,0,0,0],[2,1,0,0],[4,3,1,0],[3,4,1,1]]);
 assert.deepEqual(f.B,[[2,1,1,0],[0,1,1,1],[0,0,2,2],[0,0,0,2]]);
});

test('all 19683 ternary 3x3 matrices obey nonsingular LU hypotheses and every pivoted frame identity',()=>{
 let nonsingular=0;
 for(let mask=0;mask<19683;mask++){
  let m=mask;const A=Array.from({length:3},()=>Array.from({length:3},()=>{const x=m%3-1;m=Math.floor(m/3);return x;}));
  const d=det(A),f=checkedElimination(A,{pivot:true});f.steps.forEach(fr=>invariant(A,fr));
  assert.equal(f.ok,d!==0);
  if(d!==0){nonsingular++;const g=checkedElimination(A);assert.equal(g.ok,A[0][0]!==0&&det(A.slice(0,2).map(r=>r.slice(0,2)))!==0);g.steps.forEach(fr=>invariant(A,fr));near(f.flops,13);}
 }
 assert.equal(nonsingular,11808);
});

test('zero required pivots stop immediately and final singularity is distinct from successful completion',()=>{
 const early=[[0,1,0],[1,1,0],[0,0,1]],f=checkedElimination(early);
 assert.equal(f.ok,false);assert.equal(f.flops,0);assert.equal(f.stoppedAt,0);assert.equal(f.steps.at(-1).kind,'breakdown');assert.equal(f.steps.length,2);
 assert.equal(checkedElimination(early,{pivot:true}).ok,true);
 const late=checkedElimination([[1,0,0],[0,1,0],[0,0,0]]);assert.equal(late.stoppedAt,2);assert.equal(late.flops,13);assert.equal(late.steps.at(-1).kind,'breakdown');assert.ok(!late.steps.some(x=>x.kind==='done'));
 // The singular zero matrix has infinitely many unit-L factorizations A=L*0.
 assert.deepEqual(mm([[1,0],[3,1]],[[0,0],[0,0]]),[[0,0],[0,0]]);
});

test('growth counts transient Schur entries, excludes multiplier storage and attains the sharp family',()=>{
 const A=[[1,0,-1],[0,-1,-1],[-1,-1,-1]],f=checkedElimination(A,{pivot:true});
 assert.equal(f.rho,2);assert.equal(maxEntry(f.B),1);assert.equal(f.maxGenerated,2);
 assert.equal(checkedElimination([[.001,0],[1,1]]).rho,1); // multiplier1000 is not a matrix entry
 for(let n=2;n<=30;n++){const g=checkedElimination(wilkinsonGrowth(n),{pivot:true,record:false});assert.equal(g.rho,2**(n-1));assert.equal(g.maxGenerated,2**(n-1));assert.equal(g.flops,(4*n**3-3*n*n-n)/6);}
 for(const scale of [.125,2,32])near(checkedElimination(A.map(r=>r.map(x=>x*scale)),{pivot:true}).rho,f.rho);
});

test('histogram includes extreme tails and reference clipping and regression are numerically exact',()=>{
 const data=[1,1.1,1.2,1.3,1e5],h=fullHistogram(data);assert.equal(h.counts.reduce((a,b)=>a+b,0),data.length);assert.ok(h.hi>1e5);assert.equal(h.counts.at(-4),1);
 const p=clippedWorstGrowth();near(p.at(-1)[0],1+Math.log2(1000));near(p.at(-1)[1],1000,2e-12);p.forEach(([n,y])=>near(y,2**(n-1)));for(let i=1;i<p.length;i++)assert.ok(p[i][0]>p[i-1][0]);
 for(const a of [.25,.5,2/3])near(fittedExponent([8,16,32,64,128].map(n=>[n,3*n**a])),a);
});
