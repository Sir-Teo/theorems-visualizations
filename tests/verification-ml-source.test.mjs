import test from 'node:test';
import assert from 'node:assert/strict';
import {ermRect,ermDisc,inShape,RECT,rand} from '../content/ml/ch02.shared.js';
import {quantizeUnit} from '../content/ml/ch04.shared.js';
const error=(S,h)=>Array.from(S.X,(x,i)=>+(inShape(h,x,S.Y[i])!==!!S.L[i])).reduce((a,b)=>a+b,0);
const sample=(points)=>({X:points.map(x=>x[0]),Y:points.map(x=>x[1]),L:points.map(x=>x[2]),m:points.length});
test('exact rectangle ERM matches exhaustive boundaries, including equal-coordinate points',()=>{
 const r=rand(97);
 for(let run=0;run<50;run++){
  const S=sample(Array.from({length:7},()=>[r.int(0,3)/3,r.int(0,3)/3,r.int(0,1)]));
  let best=S.L.reduce((a,b)=>a+b,0);const xs=[...new Set(S.X)],ys=[...new Set(S.Y)];
  for(const a of xs)for(const b of xs)for(const c of ys)for(const d of ys)best=Math.min(best,error(S,RECT(a,c,b,d)));
  assert.equal(error(S,ermRect(S)),best,`tied sample ${run}`);
 }
});
test('disc ERM agrees with exhaustive distance levels for its declared finite center grid',()=>{
 const r=rand(15);
 for(let run=0;run<20;run++){
  const S=sample(Array.from({length:8},()=>[r.int(0,4)/4,r.int(0,4)/4,r.int(0,1)]));let best=S.L.reduce((a,b)=>a+b,0);
  for(let a=0;a<=16;a++)for(let b=0;b<=16;b++){
   const distances=S.X.map((x,i)=>(x-a/16)**2+(S.Y[i]-b/16)**2);
   for(const radiusSquared of distances){let mistakes=0;for(let i=0;i<S.m;i++)mistakes+=+((distances[i]<=radiusSquared)!==!!S.L[i]);best=Math.min(best,mistakes);}
  }
  assert.equal(error(S,ermDisc(S)),best,`tied radial sample ${run}`);
 }
});
test('midpoint quantization keeps the claimed error bound even at both domain edges',()=>{
 for(const bits of [1,2,4,16,32,52])for(const x of [0,Number.EPSILON,.37,.99,1-Number.EPSILON,1]){
  const q=quantizeUnit(x,bits);assert.ok(q>0&&q<1);assert.ok(Math.abs(x-q)<=2**(-bits-1));
 }
 assert.throws(()=>quantizeUnit(.5,64),RangeError);
});
