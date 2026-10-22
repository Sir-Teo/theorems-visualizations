import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import * as H from '../content/cg/ch05.shared.js';
import {guardHandle} from '../content/cg/ch05.ui.shared.js';
const close=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} ≠ ${b}`);
const rng=seed=>()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/2**32;};
const fixture=seed=>{const r=rng(seed);return Array.from({length:8},()=>[12*r()-6,12*r()-6]);};
const canon=T=>T.map(t=>[...t].sort((a,b)=>a-b).join(',')).sort();
const area=(P,T)=>T.reduce((s,t)=>{const[a,b,c]=t.map(i=>P[i]);return s+((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;},0);
test('exact binary64 predicates, tiny represented inputs and dense bounded states',()=>{const m=Number.MIN_VALUE;assert.equal(H.orient([0,0],[1,m],[1,0]),-1);assert.equal(H.incircle([0,0],[1,0],[0,1],[m,0]),1);assert.equal(H.nearest([[0,0],[m,0]],[m,0]).index,1);assert.equal(H.nearest([[0,0],[m,0]],[0,0],true).index,1);assert.deepEqual(H.nearest([[-1,0],[1,0]],[0,0]).ties,[0,1]);assert.equal(H.minimumCircle([[0,0],[2*m,0]]).radius,m);for(const P of [Array(1),[Array(2)],[[0,0],,],[[Infinity,0]],[[9,0]],[[0]]])assert.equal(H.validPoints(P),false);assert.equal(H.validPoints([]),true);assert.equal(H.validPoints([[m,-8],[8,0]]),true);});
test('cocircular facet versus triangulation, collinear/small cases and exact dual collapse',()=>{const P=[[-4,-4],[4,-4],[4,4],[-4,4]],D=H.delaunay(P);assert.equal(D.faces.length,1);assert.equal(D.faces[0].length,4);assert.equal(D.triangles.length,2);assert.equal(D.complexEdges.length,4);assert.equal(D.edges.length,5);assert.equal(H.voronoiEdges(P).filter(e=>e.collapsed).length,2);for(const n of [0,1,2,3,7]){const Q=Array.from({length:n},(_,i)=>[i,0]),d=H.delaunay(Q);assert.equal(d.triangles.length,0);assert.equal(d.complexEdges.length,Math.max(0,n-1));assert.equal(d.dimension,n===0?-1:n===1?0:1);}const U=H.unique([[0,0],[0,0],[1,0]]);assert.deepEqual(U.map,[0,0,1]);assert.deepEqual(H.cells([[0,0],[0,0]])[1],[]);});
test('actual triangulations cover hull and agree through insertion/edge/collinear/hull cases',()=>{for(let seed=1;seed<=60;seed++){const P=fixture(seed),D=H.delaunay(P);assert.equal(D.triangles.length,2*P.length-2-D.boundary.length);assert.equal(D.edges.length,3*P.length-3-D.boundary.length);assert.ok(D.faces.length<=2*P.length-5);assert.ok(D.complexEdges.length<=3*P.length-6);for(let reverse=0;reverse<2;reverse++){const order=P.map((_,i)=>i);if(reverse)order.reverse();const I=H.incremental(P,order);assert.deepEqual(canon(I.triangles),canon(D.triangles));for(const t of I.triangles){assert.equal(H.orient(...t.map(i=>P[i])),1);assert.ok(H.circleAudit(P,t).every(s=>s<=0));}const h=D.hull.map(i=>P[i]),A=h.reduce((s,p,j)=>s+p[0]*h[(j+1)%h.length][1]-p[1]*h[(j+1)%h.length][0],0)/2;close(area(P,I.triangles),A);}}const P=[[0,0],[2,0],[1,0],[0,2],[1,1],[2,2]],I=H.incremental(P);assert.equal(I.triangles.length,H.delaunay(P).triangles.length);assert.ok(I.triangles.every(t=>H.circleAudit(P,t).every(s=>s<=0)));});
test('strict illegal flips restore exact global emptiness; ties are retained',()=>{for(let seed=1;seed<=40;seed++){const P=fixture(seed),D=H.delaunay(P),T=H.varied(P,D.triangles,seed%8+1),L=H.legalize(P,T);assert.equal(L.done,true);assert.deepEqual(canon(L.triangles),canon(D.triangles));for(let i=1;i<L.frames.length;i++){assert.ok(L.frames[i].edge.sign>0);const a=H.angles(P,L.frames[i-1].triangles),b=H.angles(P,L.frames[i].triangles);const j=a.findIndex((x,k)=>Math.abs(x-b[k])>1e-8);assert.ok(j>=0&&b[j]>a[j]);}}const P=[[0,0],[2,0],[2,2],[0,2]],D=H.delaunay(P);assert.equal(H.legalize(P,D.triangles).frames.length,1);});
test('real Fortune events retain lower-envelope arcs and match independent exact pairs',()=>{for(let seed=1;seed<=80;seed++){const P=fixture(seed),F=H.fortune(P);assert.equal(F.status,'complete',F.reason);assert.equal(F.processed,P.length+H.delaunay(P).faces.length);for(const f of F.frames){const sites=[...new Set(f.arcs.map(a=>a.site))];assert.equal(f.boundaries.length,Math.max(0,f.arcs.length-1));for(const s of H.beachSegments(P,f,{samples:8})){for(const[x,y]of s.points){const low=Math.min(...sites.map(i=>H.parabola(P[i],x,f.drawLevel)));close(y,low,1e-6);}}if(f.event?.type==='circle')assert.equal(f.arcs.some(a=>a.id===f.event.arc),false);}}for(const P of [[[0,0],[2,0]],[[0,0],[1,1],[2,2]],[[-1,-1],[1,-1],[1,1],[-1,1]],[[0,0],[0,0]]])assert.equal(H.fortune(P).status,'unresolved');});
test('rational dual endpoints obey nearest inequalities and farthest reversal',()=>{for(let seed=1;seed<=25;seed++){const P=fixture(seed);for(const far of [false,true])for(const e of H.voronoiEdges(P,[-9,9,-9,9],far)){for(const q of e.points){assert.ok(q.every(x=>x>=-9-1e-10&&x<=9+1e-10));const ds=P.map(p=>(p[0]-q[0])**2+(p[1]-q[1])**2),v=ds[e.pair[0]];close(v,ds[e.pair[1]]);for(const x of ds)assert.ok(far?x<=v+1e-7:x>=v-1e-7);}}}});
test('minimum circle has exact coverage and convex-support optimality certificate',()=>{for(let seed=1;seed<=80;seed++){const P=fixture(seed),C=H.minimumCircle(P),I=H.integerCoordinates(P),q=C.exact;for(const p of I)assert.ok((p[0]*q.d-q.x)**2n+(p[1]*q.d-q.y)**2n<=q.r);if(C.support.length===2){const[a,b]=C.support.map(i=>P[i]);close(C.center[0],(a[0]+b[0])/2);close(C.center[1],(a[1]+b[1])/2);}else if(C.support.length===3){const w=H.barycentric(P,C.support,C.center);assert.ok(w.every(x=>x>=-1e-10));close(w.reduce((s,x)=>s+x,0),1);}assert.ok(C.radius>0);}});
test('EMST candidate restriction and empty closed diameter disks, including ties',()=>{for(let seed=1;seed<=60;seed++){const P=fixture(seed),D=H.delaunay(P),A=H.mst(P),B=H.mst(P,D.complexEdges);close(A.length,B.length);assert.deepEqual(A.tree,B.tree);const E=new Set(D.complexEdges.map(e=>H.edgeKey(...e)));for(const[a,b]of A.tree){assert.ok(E.has(H.edgeKey(a,b)));for(let i=0;i<P.length;i++)if(i!==a&&i!==b){const u=P[i][0]-P[a][0],v=P[i][1]-P[a][1],x=P[i][0]-P[b][0],y=P[i][1]-P[b][1];assert.ok(u*x+v*y>0);}}}const P=[[0,0],[2,0],[2,2],[0,2]];assert.deepEqual(H.mst(P).tree,H.mst(P,H.delaunay(P).complexEdges).tree);});
test('uniform-domain Lloyd moments/descent, duplicate-empty rule and affine interpolation',()=>{const V=[[-1,-1],[1,-1],[1,1],[-1,1]],m=H.polygonMoments(V);close(m.area,4);close(m.x,0);close(m.y,0);close(m.xx,4/3);close(m.yy,4/3);for(let seed=1;seed<=30;seed++){const P=fixture(seed),F=H.lloyd(P,12);for(let i=1;i<F.length;i++)assert.ok(F[i].energy<=F[i-1].energy+1e-7);const T=H.delaunay(P).triangles,Z=P.map(p=>2*p[0]-3*p[1]+7);for(const t of T){const q=t.reduce((s,i)=>[s[0]+P[i][0]/3,s[1]+P[i][1]/3],[0,0]),o=H.interpolate(P,T,Z,q);assert.ok(o);close(o.value,2*q[0]-3*q[1]+7);}}const F=H.lloyd([[0,0],[0,0]],1);assert.deepEqual(F[1].empty,[1]);assert.ok(F[1].energy<=F[0].energy+1e-8);});
test('independent Python Fraction determinant/Prim and interior triangle-quadrature oracle',()=>{const cases=Array.from({length:120},(_,i)=>fixture(i+77).slice(0,4));cases.push([[0,0],[1,Number.MIN_VALUE],[1,0],[Number.MIN_VALUE,0]]);const sets=Array.from({length:24},(_,i)=>fixture(i+701)),polys=sets.slice(0,5).flatMap(P=>H.cells(P,{box:[-8,8,-8,8]}));const py=String.raw`
import json,sys,itertools,math
from fractions import Fraction as F
D=json.load(sys.stdin)
def det(M):
 n=len(M);v=F(0)
 for p in itertools.permutations(range(n)):
  k=sum(p[i]>p[j] for i in range(n) for j in range(i+1,n));z=F((-1)**k)
  for i in range(n):z*=M[i][p[i]]
  v+=z
 return (v>0)-(v<0)
ans=[]
for P in D['cases']:
 Q=[[F(x),F(y)] for x,y in P];o=det([[x,y,F(1)]for x,y in Q[:3]]);c=det([[x,y,x*x+y*y,F(1)]for x,y in Q]);ans.append([o,c*o])
weights=[]
for P in D['sets']:
 Q=[[F(x),F(y)]for x,y in P];A={0};total=0
 while len(A)<len(Q):
  candidates=[(sum((Q[i][k]-Q[j][k])**2 for k in range(2)),i,j)for i in A for j in range(len(Q))if j not in A]
  d,i,j=min(candidates);total+=math.sqrt(float(d));A.add(j)
 weights.append(total)
mom=[]
for V in D['polys']:
 z=[0.0]*5
 if V:
  a=V[0]
  for j in range(1,len(V)-1):
   b,c=V[j],V[j+1];A=abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2
   for w in [(2/3,1/6,1/6),(1/6,2/3,1/6),(1/6,1/6,2/3)]:
    x=sum(w[k]*[a,b,c][k][0]for k in range(3));y=sum(w[k]*[a,b,c][k][1]for k in range(3))
    for k,t in enumerate([1,x,y,x*x,y*y]):z[k]+=A*t/3
 mom.append(z)
print(json.dumps({'pred':ans,'weights':weights,'mom':mom}))
`;const R=spawnSync('python3',['-c',py],{input:JSON.stringify({cases,sets,polys}),encoding:'utf8'});assert.equal(R.status,0,R.stderr);const O=JSON.parse(R.stdout);cases.forEach((P,i)=>assert.deepEqual([H.orient(...P.slice(0,3)),H.incircle(...P)],O.pred[i]));sets.forEach((P,i)=>close(H.mst(P).length,O.weights[i]));polys.forEach((P,i)=>{const m=H.polygonMoments(P);[m.area,m.x,m.y,m.xx,m.yy].forEach((x,j)=>close(x,O.mom[i][j],1e-9));});});
test('tiny-circle/barycentric/angle construction avoids squared-distance underflow',()=>{const m=Number.MIN_VALUE,P=[[0,0],[2*m,0],[0,2*m]],C=H.circumcircle(...P);assert.deepEqual(C.center,[m,m]);assert.equal(C.radius,m);assert.deepEqual(H.barycentric(P,[0,1,2],[m,m]),[0,.5,.5]);const A=H.angles(P,[[0,1,2]]);A.forEach((a,i)=>close(a,[45,45,90][i],1e-14));const R=H.interpolate(P,[[0,1,2]],[0,2,4],[m,m]);assert.equal(R.value,3);assert.equal(H.incremental([[0,0],[1,0]]).per[1].degree,1);assert.equal(H.incremental([[0,0],[1,0]]).per[1].changes,1);});
test('cocircular diagonal choices can tie minimum but differ in later angle entries',()=>{const P=[[5,0],[3,4],[-4,3],[-5,0]],T=[[0,1,2],[0,2,3]],U=[[0,1,3],[1,2,3]],A=H.angles(P,T),B=H.angles(P,U);assert.ok(T.concat(U).every(t=>H.circleAudit(P,t).every(x=>x<=0)));close(A[0],B[0]);assert.ok(Math.abs(A[3]-B[3])>5);});
test('all14 frozen identities and researched dependency/source reconciliation',async()=>{const fs=await import('node:fs');const A=(await import('../content/cg/ch05.js')).default,B=(await import('../content/cg/ch05-b.js')).default,S=(await import('../content/cg/syllabus.js')).default,items=A.items.concat(B.items),plan=JSON.parse(fs.readFileSync(new URL('../docs/wave-five-plan.json',import.meta.url))).chapters.find(c=>c.collection==='cg'&&c.chapter===5),key=i=>[i.num,i.kind,i.name];assert.deepEqual(items.map(key),plan.items.map(key));assert.deepEqual(S.chapters.find(c=>c.n===5).items.map(key),plan.items.map(key));for(const i of items){assert.equal(typeof i.viz,'function');assert.ok(i.statement.length>50&&i.idea.length>50&&i.scope.length>50);assert.ok(!i.deps.includes('info-7.8'));assert.ok(i.links?.source?.startsWith('https://'));}assert.ok(items.find(i=>i.num==='5.13').see.includes('info-7.8'));assert.ok(!items.find(i=>i.num==='5.10').deps.includes('cg-2.11'));});

test('chapter-local handle validation rejects hidden/query out-of-domain raw states before clamping',()=>{const h={},a={valid:p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)},stage={handles:[h]};stage.rt={stages:[stage],state:{parts:new Map([['handle:0:0:0',a]])}};guardHandle(stage,h);for(const p of [[8,-8],[Number.MIN_VALUE,0],[0,0]])assert.equal(a.valid(p),true);for(const p of [[8.01,0],[0,-8.01],[NaN,0],[Infinity,0],Array(2),[0],[0,0,0]])assert.equal(a.valid(p),false);});

test('site restore preserves formatted JSON, rejects visible conflicts and retains hidden/error handles',()=>{let text='[ [ -6.0, 6 ], [3,5], [0,2] ]',error=false;const h={set:(...p)=>h.xy=p},a={valid:p=>p.every(Number.isFinite),set:()=>{throw Error('native onDrag must not rewrite JSON');}},stage={handles:[h]};stage.rt={stages:[stage],state:{parts:new Map([['handle:0:0:0',a]])}};guardHandle(stage,h,{site:0,get:()=>({error,input:error?[]:JSON.parse(text)})});a.set([-6,6]);assert.equal(text,'[ [ -6.0, 6 ], [3,5], [0,2] ]');assert.deepEqual(h.xy,[-6,6]);assert.throws(()=>a.set([0,0]),/contradicts/);assert.deepEqual(h.xy,[-6,6]);text='[]';a.set([2,3]);assert.deepEqual(h.xy,[2,3]);error=true;text='[invalid';a.set([4,5]);assert.deepEqual(h.xy,[4,5]);});
