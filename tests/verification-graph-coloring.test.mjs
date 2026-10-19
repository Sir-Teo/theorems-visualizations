import test from 'node:test';
import assert from 'node:assert/strict';
import { ix, named, wheel, grotzsch, crown, nbrs, rng32, triangulation, triFreePlanar, triangles, maxDeg, degeneracy, greedyColour, colourWith } from '../content/graph/ch05-a.shared.js';
import { vertexBounds, edgeBounds, triangulationCategory, auditedFiveFrames } from '../content/graph/ch05-coloring-audit.shared.js';
import { crossPairs } from '../content/graph/ch04-a.shared.js';
const graph=(n,E)=>ix({nodes:Array.from({length:n},(_,id)=>({id})),edges:E});
// Sequential label-order exhaustive enumeration, independent of DSATUR/saturation state.
function independentK(adj,k){const col=adj.map(()=>-1);function search(u){if(u===adj.length)return true;for(let c=0;c<k;c++){if(adj[u].some(w=>w<u&&col[w]===c))continue;col[u]=c;if(search(u+1))return true;}col[u]=-1;return false;}return search(0);}
function independentChi(adj){if(!adj.length)return 0;for(let k=1;k<=adj.length;k++)if(independentK(adj,k))return k;}
function independentLine(H){return H.E.map(([a,b],i)=>H.E.flatMap(([c,d],j)=>i!==j&&(a===c||a===d||b===c||b===d)?[j]:[]));}
function proper(adj,col){assert.equal(col.length,adj.length);for(let u=0;u<adj.length;u++){assert.ok(Number.isInteger(col[u])&&col[u]>=0);for(const w of adj[u])assert.notEqual(col[u],col[w]);}}
function subsetDegeneracy(adj){let d=0;for(let mask=1;mask<2**adj.length;mask++){let min=Infinity;for(let u=0;u<adj.length;u++)if(mask&(1<<u))min=Math.min(min,adj[u].filter(w=>mask&(1<<w)).length);d=Math.max(d,min);}return d;}
function* permutations(a){if(!a.length){yield [];return;}for(let i=0;i<a.length;i++)for(const p of permutations(a.filter((_,j)=>j!==i)))yield[a[i],...p];}

test('vertex and edge certificates match independent exhaustive colorings of every demo preset',()=>{
 const presets=[[named('complete',4),4,3],[named('complete',5),5,5],[named('petersen'),3,4],[named('kmn',3,3),2,3],[named('cube'),2,3],[named('cycle',5),3,3],[wheel(5),4,5],[grotzsch(),4,null]];
 for(const [sp,chi,index]of presets){const H=ix(sp),a=nbrs(H),r=vertexBounds(H);assert.equal(independentChi(a),chi);assert.equal(r.lower,chi);assert.equal(r.upper,chi);proper(a,r.col);if(index!==null){const line=independentLine(H),e=edgeBounds(H);assert.equal(independentChi(line),index);assert.equal(e.lower,index);assert.equal(e.upper,index);proper(line,e.col);}}
});
test('exhausted budgets preserve valid lower bounds, proper upper certificates and unresolved sample outcomes',()=>{
 const H=ix(named('cycle',5)),r=vertexBounds(H,{budget:0});assert.equal(r.exact,false);assert.equal(r.lower,2);assert.equal(r.upper,3);proper(nbrs(H),r.col);
 const P=ix(named('petersen')),e=edgeBounds(P,{budget:0});assert.equal(e.exact,false);assert.equal(e.lower,3);assert.ok(e.upper>=4);proper(independentLine(P),e.col);
 for(const a of ['yes','no','unknown'])for(const b of ['yes','no','unknown'])assert.equal(triangulationCategory({status:a},{status:b}),a==='yes'?0:a==='no'&&b==='yes'?1:2);
 for(const H of [graph(0,[]),graph(3,[])]){const v=vertexBounds(H),e=edgeBounds(H);assert.equal(v.k,H.n?1:0);assert.equal(v.exact,true);assert.equal(e.k,0);assert.equal(e.exact,true);}
});
test('all 1024 labeled five-vertex graphs satisfy independently enumerated degeneracy and greedy bounds',()=>{
 const n=5,possible=[];for(let u=0;u<n;u++)for(let w=u+1;w<n;w++)possible.push([u,w]);
 for(let mask=0;mask<1024;mask++){const H=graph(n,possible.filter((_,i)=>mask&(1<<i))),a=nbrs(H),d=degeneracy(H),ind=subsetDegeneracy(a);assert.equal(d.d,ind);const g=greedyColour(H,d.removed.slice().reverse());proper(a,g.col);assert.ok(g.used<=ind+1);assert.ok(independentChi(a)<=ind+1);assert.ok(g.used<=maxDeg(H)+1);}
});
test('coloring number is the minimum back-degree bound over every order on every four-vertex graph',()=>{
 const n=4,possible=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
 for(let mask=0;mask<64;mask++){const H=graph(n,possible.filter((_,i)=>mask&(1<<i))),a=nbrs(H);let minimum=Infinity;for(const order of permutations([0,1,2,3])){const rank=new Map(order.map((u,i)=>[u,i])),bound=1+Math.max(...order.map(u=>a[u].filter(w=>rank.get(w)<rank.get(u)).length)),g=greedyColour(H,order);assert.ok(g.used<=bound);minimum=Math.min(minimum,bound);}assert.equal(minimum,subsetDegeneracy(a)+1);}
 const H=ix(crown(5)),d=degeneracy(H);assert.equal(independentChi(nbrs(H)),2);assert.equal(d.d+1,5);assert.equal(greedyColour(H,[...Array(10).keys()]).used,5);assert.equal(greedyColour(H,d.removed.slice().reverse()).used,2);
});
test('Kempe proof frames preserve a proper five-coloring and low-degree deletions on 450 plane triangulations',()=>{
 let swaps=0;
 for(let n=6;n<=20;n++)for(let seed=1;seed<=30;seed++){const D=triangulation(n,seed*31+n),B=auditedFiveFrames(D,seed);assert.equal(D.E.length,3*n-6);assert.equal(crossPairs(D.pos,D.E,1e-6).length,0);const adj=Array.from({length:n},()=>[]);for(const [a,b]of D.E){adj[a].push(b);adj[b].push(a);}for(let i=0;i<B.frames.length;i++){const f=B.frames[i];if(!/^Swap/.test(f.note))continue;swaps++;const prev=B.frames[i-1],chain=new Set(f.chain),colors=[...new Set([...chain].flatMap(u=>[prev.col[u],f.col[u]]))];assert.equal(colors.length,2);const reached=new Set([f.chain[0]]),todo=[f.chain[0]];while(todo.length){const u=todo.pop();for(const w of adj[u])if(prev.live[w]&&colors.includes(prev.col[w])&&!reached.has(w)){reached.add(w);todo.push(w);}}assert.deepEqual([...reached].sort((a,b)=>a-b),[...chain].sort((a,b)=>a-b));for(let u=0;u<n;u++)if(chain.has(u))assert.equal(f.col[u],colors.find(c=>c!==prev.col[u]));else if(u!==f.cur)assert.equal(f.col[u],prev.col[u]);}}
 assert.ok(swaps>0,'the sampled proof runs must exercise actual Kempe swaps');
});
test('triangle-free planar generated examples and planar triangulations satisfy independently checked coloring conclusions',()=>{
 for(let n=6;n<=16;n++)for(let seed=1;seed<=8;seed++){const E=triFreePlanar(n,rng32(seed*17+n)),H=graph(n,E);assert.equal(triangles(H),0);assert.equal(independentK(nbrs(H),3),true);const D=triangulation(n,seed),T=graph(n,D.E);assert.equal(independentK(nbrs(T),4),true);assert.equal(independentK(nbrs(T),2),false);const three=colourWith(nbrs(T),3);assert.equal(three.status==='yes',independentK(nbrs(T),3));}
});
