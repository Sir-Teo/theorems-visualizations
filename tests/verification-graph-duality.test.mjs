import test from'node:test';import assert from'node:assert/strict';
import {planeDualModel,dualityPresets,planeDualLine}from'../content/graph/ch04-z2.js';
import {abstractDualAudit,edgeSubsetCycles,incidenceRealizer,schnyderCertificate,drawingDefects}from'../content/graph/ch04-duality-audit.shared.js';
import {norm,ix,ixE,allCycles,allBonds,amask,nonSepInduced,isKconn,randomTriangulation,triDraw,schnyder,schnyderRegions,spread,simpleBasis}from'../content/graph/ch04-z.shared.js';
import{rng}from'../assets/js/viz/math.js';
const key=F=>Array.from(F).join(''),near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t);
const componentCount=(n,ends,mask)=>{const seen=new Set();let c=0;for(let v=0;v<n;v++){if(seen.has(v))continue;c++;seen.add(v);const q=[v];for(let i=0;i<q.length;i++)ends.forEach(([a,b],k)=>{if(mask&(1<<k))return;const z=a===q[i]?b:b===q[i]?a:-1;if(z>=0&&!seen.has(z)){seen.add(z);q.push(z);}});}return c;};
function referenceBonds(n,ends){const all=[];for(let mask=1;mask<2**ends.length;mask++){const base=componentCount(n,ends,0);if(componentCount(n,ends,mask)!==base+1)continue;let minimal=true;for(let k=0;k<ends.length;k++)if(mask&(1<<k))if(componentCount(n,ends,mask^(1<<k))!==base)minimal=false;if(minimal)all.push(ends.map((_,k)=>+(!!(mask&(1<<k)))));}return all;}
test('Kelmans counts agree with independent edge-subset cycles and induced/removal tests for every preset',()=>{
 for(const name of['cube','prism','w5','oct','k4','k33','k5','pet']){
  const N=norm(dualityPresets[name]()),H=ixE(N.n,N.E),all=edgeSubsetCycles(H.n,N.E),ref=all.filter(c=>{const vs=new Set(c.vs),induced=N.E.filter(([a,b])=>vs.has(a)&&vs.has(b));if(induced.length!==vs.size)return false;const left=Array.from({length:N.n},(_,i)=>i).filter(x=>!vs.has(x));if(!left.length)return false;const seen=new Set([left[0]]),q=[left[0]];for(let i=0;i<q.length;i++)for(const[a,b]of N.E){const v=a===q[i]?b:b===q[i]?a:-1;if(v>=0&&!vs.has(v)&&!seen.has(v)){seen.add(v);q.push(v);}}return seen.size===left.length;});
  assert.equal(allCycles(H).length,all.length);const got=allCycles(H).filter(c=>nonSepInduced(H,amask(H),c));assert.deepEqual(got.map(c=>key(c.E)).sort(),ref.map(c=>key(c.E)).sort());assert.ok(isKconn(H,3).ok);
  const counts=N.E.map((_,k)=>ref.reduce((s,c)=>s+c.E[k],0));if(['k5','k33','pet'].includes(name))assert.ok(Math.max(...counts)>2);else assert.ok(counts.every(x=>x===2));
 }
});
test('every preset face choice has Euler balance, exact cycle-bond correspondence, dual degrees and intended crossings',()=>{
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 for(const name of['cube','prism','w5','oct','k4','k24','k4k4']){
  const N=norm(dualityPresets[name]()),first=planeDualModel(N);for(let outer=0;outer<first.F.length;outer++){
   const S=planeDualModel(N,outer),ends=S.dual.edges.map(e=>[e.a,e.b]),D={n:S.F.length,ends},cycles=edgeSubsetCycles(N.n,N.E);assert.equal(N.n-N.E.length+S.F.length,2);assert.deepEqual(drawingDefects(N.n,N.E,S.P),[]);assert.equal(abstractDualAudit(S.H,D,ends.map((_,k)=>k),cycles),null);
   assert.equal(cycles.length,referenceBonds(D.n,ends).length);S.F.forEach((f,i)=>assert.equal(ends.reduce((s,[a,b])=>s+(a===i)+(b===i),0),f.walk.length));
   for(let k=0;k<N.E.length;k++){const P=planeDualLine(S,k),[a,b]=N.E[k];assert.ok(cross(S.P[a],S.P[b],P[0])*cross(S.P[a],S.P[b],P[2])<0);for(let j=0;j<N.E.length;j++){if(j===k)continue;const[c,d]=N.E[j];for(let t=0;t<2;t++)assert.ok(!(cross(P[t],P[t+1],S.P[c])*cross(P[t],P[t+1],S.P[d])< -1e-12&&cross(S.P[c],S.P[d],P[t])*cross(S.P[c],S.P[d],P[t+1])< -1e-12));}}
  }
  const keys=first.dual.edges.map(e=>[e.a,e.b].sort().join());assert.equal(keys.length-new Set(keys).size,name==='k24'?4:0);
 }
});
function permutations(xs){if(!xs.length)return[[]];return xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>j!==i)).map(p=>[x,...p]));}
test('K4 has exactly 24 abstract self-duality pairings, not just the opposite-edge pairing',()=>{
 const N=norm(dualityPresets.k4()),H=ixE(N.n,N.E),cycles=edgeSubsetCycles(N.n,N.E),D={n:N.n,ends:N.E};let good=0;
 for(const pi of permutations(N.E.map((_,k)=>k)))if(!abstractDualAudit(H,D,pi,cycles))good++;
 assert.equal(good,24);const opposite=N.E.map(([a,b])=>N.E.findIndex(([c,d])=>![a,b].includes(c)&&![a,b].includes(d)));assert.equal(abstractDualAudit(H,D,opposite,cycles),null);
});
test('dual checker tests reverse direction, bijection, loops/parallel cycles and disconnected isolated vertices',()=>{
 const forest=ixE(2,[[0,1]]);assert.equal(abstractDualAudit(forest,{n:2,ends:[[0,1]]},[0],[]).kind,'bond');assert.equal(abstractDualAudit(forest,{n:1,ends:[[0,0]]},[0],[]),null);
 const H=ixE(3,[[0,1],[1,2],[0,2]]),D={n:4,ends:[[0,1],[0,1],[0,1]]};assert.equal(abstractDualAudit(H,D,[0,1,2],edgeSubsetCycles(3,[[0,1],[1,2],[0,2]])),null);assert.equal(3-3+1,4-3);assert.equal(abstractDualAudit(H,D,[0,0,2]).kind,'bijection');
 assert.equal(edgeSubsetCycles(2,[[0,0],[0,1],[0,1]]).length,2);const loop=ix({nodes:[{id:0}],edges:[[0,0]]},{multi:true}),double=ix({nodes:[{id:0},{id:1}],edges:[[0,1],[0,1]]},{multi:true});assert.equal(abstractDualAudit(loop,{n:2,ends:[[0,1]]},[0]),null);assert.equal(abstractDualAudit(double,{n:2,ends:[[0,1],[0,1]]},[0,1]),null);
});
test('Schnyder woods and actual incidence realizers satisfy all local/pair conditions on 480 instances',()=>{
 for(let n=5;n<=12;n++)for(let seed=1;seed<=60;seed++){
  const r=rng(seed*8191+17),T=triDraw(randomTriangulation(n,r,4+Math.floor(r()*8))),W=schnyder(n,T.E,T.pos);assert.ok(W);const pos=spread(n,T.E,T.pos,60,[0,1,2]),certificate=schnyderCertificate(n,T.E,pos,W.out);assert.deepEqual(certificate.errors,[]);assert.deepEqual(drawingDefects(n,T.E,pos),[]);
  const m=2*n-5,C=Array.from({length:n},(_,v)=>v<3?[+(v===0)*m,+(v===1)*m,+(v===2)*m]:schnyderRegions(n,T.tri,W.out,v).counts);C.forEach(c=>assert.equal(c.reduce((a,b)=>a+b,0),m));const P=C.map(c=>c.slice(0,2));assert.deepEqual(drawingDefects(n,T.E,P),[]);const R=incidenceRealizer(n,T.E,C);assert.equal(R.bad,0);
  // Independently intersect complete linear-order relations against incidence, without helper ranks.
  for(let a=0;a<n+T.E.length;a++)for(let b=a+1;b<n+T.E.length;b++){const orders=R.orders.map(L=>L.indexOf(a)<L.indexOf(b)),want=a<n&&b>=n&&T.E[b-n].includes(a);assert.equal(orders.every(Boolean),want);if(!want)assert.ok(orders.some(Boolean)&&orders.some(x=>!x));}
 }
});
test('Schnyder/drawing certificates reject actual orientation, root, vertex-contact and overlap defects',()=>{
 const r=rng(5),T=triDraw(randomTriangulation(7,r,8)),W=schnyder(7,T.E,T.pos),bad=W.out.map(es=>es.map(e=>e.slice()));bad[3][0][2]=bad[3][1][2];assert.equal(schnyderCertificate(7,T.E,T.pos,bad).valid,false);
 assert.ok(drawingDefects(3,[[0,1]],[[0,0],[2,0],[1,0]]).includes('vertex on edge'));assert.ok(drawingDefects(4,[[0,1],[2,3]],[[0,0],[2,0],[1,0],[3,0]]).includes('edge intersection'));
});
test('sparse-basis search budgets distinguish a witness, completed exclusion and an inconclusive stop',()=>{
 for(const name of['cube','k4','k5','k33','pet']){const N=norm(dualityPresets[name]()),H=ixE(N.n,N.E),q=simpleBasis(H);console.log(name,q.nCycles,q.nodes,q.exhausted,!!q.basis);if(['cube','k4'].includes(name))assert.ok(q.basis);else{assert.equal(q.basis,null);assert.equal(q.exhausted,true);}const stopped=simpleBasis(H,0);assert.equal(stopped.basis,null);assert.equal(stopped.exhausted,false);}
});
