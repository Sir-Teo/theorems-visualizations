import assert from 'node:assert/strict';
import {test} from 'node:test';
import{affineCollisionAudit,expectedPerfectSpaceAudit,buildPerfectHashAudit,perfectLookupAudit,drawAffineAudit,PERFECT_HASH_BUDGET}from'../content/algo/perfect-hashing-audit.shared.js';
const exactHash=(a,b,p,m,x)=>Number(((BigInt(a)*BigInt(x)+BigInt(b))%BigInt(p))%BigInt(m));
test('concrete affine collision and space expectations match exhaustive ordered residues/functions',()=>{
 for(const p of[5,7,13,19])for(let m=1;m<p;m++){
  let pairs=0,hits=0;for(let r=0;r<p;r++)for(let s=0;s<p;s++)if(r!==s){pairs++;hits+=r%m===s%m;}
  const C=affineCollisionAudit(p,m);assert.equal(C.numerator,hits);assert.equal(C.denominator,pairs);
  let familyHits=0;for(let a=1;a<p;a++)for(let b=0;b<p;b++)familyHits+=exactHash(a,b,p,m,0)===exactHash(a,b,p,m,1);
  assert.equal(familyHits,hits);
 }
 for(const[p,keys]of[[13,[0,1,2]],[13,[1,4,7]],[19,[0,3,9,14]]]){
  let sum=0,draws=0;for(let a=1;a<p;a++)for(let b=0;b<p;b++){const count=Array(keys.length).fill(0);keys.forEach(x=>count[exactHash(a,b,p,keys.length,x)]++);sum+=count.reduce((s,x)=>s+x*x,0);draws++;}
  assert.ok(Math.abs(expectedPerfectSpaceAudit(keys.length,p)-sum/draws)<1e-12);assert.ok(sum/draws<2*keys.length-1);
 }
});
test('actual first-level retry exhaustion never constructs or certifies a table',()=>{
 const keys=[12,18,24,30,36,42];let calls=0;
 // The real random branch repeatedly samples admissible a=1,b=0; all keys share a bucket.
 const B=buildPerfectHashAudit(keys,()=>{calls++;return 0;});assert.equal(calls,2*PERFECT_HASH_BUDGET);
 assert.equal(B.firstDraws,PERFECT_HASH_BUDGET);assert.equal(B.space,36);assert.equal(B.firstAccepted,false);assert.equal(B.perfect,false);
 assert.ok(B.rows.every(r=>r.status==='blocked'&&r.draws===0&&r.slots.length===0));keys.forEach(k=>assert.equal(perfectLookupAudit(B,k),null));
});
test('actual bucket exhaustion keeps the complete construction uncertified, including successful buckets',()=>{
 const keys=[10,16,11,12,13,14];let calls=0;
 // First pair a=1,b=0 gives space8<24; later a=4,b=0 collides keys10,16 in their4-slot table.
 const B=buildPerfectHashAudit(keys,()=>{const i=calls++;return i<2||i%2?0:3/4294967296;});
 assert.equal(B.firstAccepted,true);assert.equal(B.space,8);assert.equal(B.perfect,false);assert.equal(B.status,'bucket-level exhausted');
 const failed=B.rows.find(r=>r.status==='exhausted');assert.deepEqual(failed.keys,[10,16]);assert.equal(failed.draws,PERFECT_HASH_BUDGET);
 assert.ok(B.rows.some(r=>r.status==='ready'));keys.forEach(k=>assert.equal(perfectLookupAudit(B,k),null));
});
test('real demonstration modes exercise both exhausted branches with admissible family members',()=>{
 const keys=[10,16,11,12,13,14],never=()=>{throw new Error('repeat mode must not pretend to draw independent functions');};
 assert.equal(buildPerfectHashAudit(keys,never,{mode:'first-collisions'}).status,'first-level exhausted');
 assert.equal(buildPerfectHashAudit(keys,never,{mode:'bucket-collisions'}).status,'bucket-level exhausted');
});
test('accepted seeded tables satisfy independent BigInt hash, partition, collision and lookup invariants',()=>{
 for(let seed=1;seed<=40;seed++)for(const n of[6,12,16]){
  let s=seed;const r=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;},keys=Array.from({length:n},(_,i)=>10+(7*i)%90),B=buildPerfectHashAudit(keys,r);
  assert.equal(B.perfect,true);assert.ok(B.space<4*n);assert.deepEqual(B.rows.flatMap(row=>row.keys).sort((a,b)=>a-b),[...keys].sort((a,b)=>a-b));
  for(const key of keys){const j=exactHash(B.first.a,B.first.b,B.p,n,key),row=B.rows[j],slot=exactHash(row.a,row.b,B.p,row.slots.length,key);assert.equal(row.slots[slot],key);assert.deepEqual(perfectLookupAudit(B,key),{bucket:j,slot,found:true});}
  assert.equal(perfectLookupAudit(B,999).found,false);
 }
});
test('dense distinct bounded inputs are required and uniform integer sampling actually rejects the biased tail',()=>{
 for(const keys of[[10,10],[10,NaN],new Array(6),[10,,12],[-1,12]])assert.throws(()=>buildPerfectHashAudit(keys,()=>0),RangeError);
 for(const options of[{firstBudget:0},{bucketBudget:Infinity},{mode:'unknown'}])assert.throws(()=>buildPerfectHashAudit([10,11],()=>0,options),RangeError);
 let calls=0;const samples=[4294967295/4294967296,5/4294967296,0];assert.deepEqual(drawAffineAudit(()=>{calls++;return samples.shift();},7),[6,0]);assert.equal(calls,3);
});
