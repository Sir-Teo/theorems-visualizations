import test from 'node:test';
import assert from 'node:assert/strict';
import { giantTheory,wsSkeleton,wsBuild,bowTie,rateEq } from '../content/soc/ch04.shared.js';

test('giant-component solution remains accurate arbitrarily close to the critical point',()=>{
 for(const c of [1,1+1e-6,1.001,1.1,2,10]){
  const S=giantTheory(c);assert.ok(S>=0&&S<=1);assert.ok(Math.abs(S+Math.expm1(-c*S))<1e-14);
  if(c>1)assert.ok(S>0);
 }
 const e=1e-6;assert.ok(Math.abs(giantTheory(1+e)-(2*e-8*e*e/3))<1e-14);
});

test('every selected Watts–Strogatz edge reconnects without loops or duplicates',()=>{
 for(const seed of [1,2,31])for(const mode of ['rewire','add']){
  const sk=wsSkeleton(30,6,seed),result=wsBuild(sk,1,mode);
  assert.equal(result.moved.length,90);
  assert.equal(result.g.edges.length,mode==='add'?180:90);
  assert.ok(result.g.edges.every(([a,b])=>a!==b));
  assert.equal(new Set(result.g.edges.map(([a,b])=>[Math.min(a,b),Math.max(a,b)].join(','))).size,result.g.edges.length);
 }
});

const directed=(n,edges)=>{const out=Array.from({length:n},()=>[]),inn=Array.from({length:n},()=>[]);for(const[a,b]of edges){out[a].push(b);inn[b].push(a);}return{n,out,inn};};

test('bow-tie classification finds the actual largest SCC even when high-degree vertices are acyclic',()=>{
 const E=[];for(let i=0;i<9;i++)E.push([i,(i+1)%9]);
 for(let i=9;i<15;i++)for(let j=15;j<25;j++)E.push([i,j]);
 const result=bowTie(directed(25,E));assert.equal(result.counts.scc,9);assert.equal(result.counts.disc,16);
});

test('bow-tie labels distinguish core, IN, OUT, tubes, tendrils and disconnected vertices',()=>{
 const G=directed(12,[[0,1],[1,2],[2,0],[3,0],[4,3],[0,5],[5,6],[4,7],[7,6],[3,8],[9,5],[10,11]]);
 const result=bowTie(G);assert.deepEqual(result.counts,{scc:3,in:2,out:2,tendril:2,tube:1,disc:2});
});

test('preferential-attachment rate equation agrees with its exact discrete law and normalization',()=>{
 for(const m of [1,2,5]){
  const P=rateEq(m,0,50000);for(const k of [m,m+1,10,100])assert.ok(Math.abs(P[k]-2*m*(m+1)/(k*(k+1)*(k+2)))<1e-14);
  const tail=m*(m+1)/(50001*50002);assert.ok(Math.abs(P.reduce((a,b)=>a+b,0)+tail-1)<1e-12);
  assert.ok(Math.abs(P[50000]*50000**3/(2*m*(m+1))-1)<1e-4);
 }
});

test('empty preferential-attachment tail has no estimated exponent',async()=>{
 const{hillDisc}=await import('../content/soc/ch04.shared.js');assert.deepEqual(hillDisc([3,4,5],100),{gamma:null,n:0});
});

test('occupancy distance mass and mean survive the sparse, billion-user controls',async()=>{
 const {occupancyDistances}=await import('../content/soc/ch04.shared.js');
 for(const N of [1000,7.21e8,1e10])for(const c of [3,190,400]){
  const {probabilities,mean,last}=occupancyDistances(N,c);
  assert.ok(probabilities.every(p=>p>=0&&p<=1));
  assert.ok(Math.abs(probabilities.reduce((a,b)=>a+b,0)-(1-1/N))<1e-14);
  assert.ok(mean>0&&mean<=last);
 }
 assert.ok(occupancyDistances(1e10,3).mean>20);
});
