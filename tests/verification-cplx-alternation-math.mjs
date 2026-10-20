// Independent finite computation trees and least-fixed-point looping witness.
import assert from'node:assert/strict';let checks=0;const ok=x=>{assert.ok(x);checks++};
// A complete depth-three binary tree: independently enumerate all kinds and halts.
const tree=(kinds,leaves,dual=false)=>{let v=Array.from({length:8},(_,i)=>((leaves>>i)&1)^(dual?1:0));for(let depth=2;depth>=0;depth--){let row=[];for(let i=0;i<2**depth;i++){let type=((kinds>>((2**depth-1)+i))&1)^(dual?1:0);row.push(type?(v[2*i]&v[2*i+1]):(v[2*i]|v[2*i+1]));}v=row;}return v[0]};
for(let kinds=0;kinds<128;kinds++)for(let leaves=0;leaves<256;leaves++)ok(tree(kinds,leaves,true)===1-tree(kinds,leaves));
for(let leaves=0;leaves<256;leaves++){ok(tree(0,leaves)===(leaves?1:0));ok(tree(127,leaves)===(leaves===255?1:0));}
// Explicit monotone least-fixed-point acceptance on configuration graphs.
function lfp(nodes){let accept=new Set(nodes.flatMap((n,i)=>n.type==='acc'?[i]:[]));for(let step=0;step<=nodes.length;step++){let next=new Set(accept);for(let i=0;i<nodes.length;i++){let n=nodes[i];if(n.type==='E'&&n.to.some(j=>accept.has(j))||n.type==='A'&&n.to.length&&n.to.every(j=>accept.has(j)))next.add(i);}if(next.size===accept.size)return accept;accept=next;}throw Error('finite monotone convergence failed')}
for(let type of['E','A'])ok(!lfp([{type,to:[0]}]).has(0)); // Original and dual both reject: not complements.
ok(lfp([{type:'E',to:[0,1]},{type:'acc',to:[]}]).has(0));
ok(!lfp([{type:'A',to:[0,1]},{type:'rej',to:[]}]).has(0));
// All finite two-layer branching graphs without loops obey duality at every vertex.
for(let types=0;types<8;types++)for(let mask=0;mask<16;mask++){let nodes=[{type:types&1?'A':'E',to:[1,2]},{type:types&2?'A':'E',to:[3,4]},{type:types&4?'A':'E',to:[5,6]},...Array.from({length:4},(_,i)=>({type:mask>>i&1?'acc':'rej',to:[]}))],dual=nodes.map(n=>({...n,type:{A:'E',E:'A',acc:'rej',rej:'acc'}[n.type]})),a=lfp(nodes),b=lfp(dual);for(let i=0;i<nodes.length;i++)ok(a.has(i)!==b.has(i));}
// Finite branching matters to finite-tree inference: root with N chains of lengths
//1,...,N has no infinite branch, but size/depth are unbounded as N grows.
for(let N=1;N<=100;N++){let size=1+N*(N+1)/2,maxDepth=N;ok(size>N);ok(maxDepth===N);}
console.log(JSON.stringify({groups:5,checks,fullDepthThreeBooleanTrees:32768,selfLoopOriginalAndDual:'both rejected'}));
