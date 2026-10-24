import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from '../content/cg/ch06.shared.js';
import * as S from '../content/cg/ch06.spatial.shared.js';
import chapter from '../content/cg/ch06.js';
import syllabus from '../content/cg/syllabus.js';
import fs from 'node:fs';
const sorted=A=>A.slice().sort((a,b)=>a-b);
function assertIds(actual,expected){assert.deepEqual(sorted(actual),sorted(expected));assert.equal(new Set(actual).size,actual.length);}
function scanRectangle(P,R){return P.flatMap(([x,y],id)=>x>=R[0]&&x<=R[1]&&y>=R[2]&&y<=R[3]?[id]:[]);}
function scanIntervals(I,x){return I.flatMap(([a,b],id)=>a<=x&&x<=b?[id]:[]);}
const grid=Array.from({length:9},(_,i)=>[i%3-1,Math.floor(i/3)-1]);
test('CG6 range structures agree with independent scans on every subset of a 3×3 lattice',()=>{
  let queries=0;
  for(let mask=0;mask<512;mask++){
    const P=grid.filter((_,i)=>(mask>>>i)&1),K=H.kdTree(P),T=H.rangeTree(P);
    assert.equal(K.nodes.length,P.length?2*P.length-1:0);
    for(const x of [-1.5,-1,-.5,0,.5,1,1.5])for(const y of [-1.5,-1,0,1,1.5])for(const w of [0,.75,3]){
      const R=[x,x+w,y,y+w],expected=scanRectangle(P,R),k=H.kdRange(K,R),f=H.rangeQuery(T,R,true),b=H.rangeQuery(T,R,false);
      assertIds(k.hits,expected);assertIds(f.hits,expected);assertIds(b.hits,expected);
      assert.deepEqual(f.canonical.map(n=>n.node),b.canonical.map(n=>n.node));queries++;
    }
  }assert.equal(queries,53760);
});
test('CG6 stable ranks preserve all coincident identities and fractional endpoints',()=>{
  const cases=[[],[[0,0]],Array.from({length:64},()=>[0,0]),[[.1,.2],[.1,.2],[.1,.3],[-8,8],[8,-8]]];
  for(const P of cases){const K=H.kdTree(P),T=H.rangeTree(P);
    for(const R of [[0,0,0,0],[.1,.1,.2,.2],[-8,8,-8,8],[8,8,-8,-8],[.10000000000000002,1,-8,8]]){
      const E=scanRectangle(P,R);assertIds(H.kdRange(K,R).hits,E);for(const cascade of [false,true])assertIds(H.rangeQuery(T,R,cascade).hits,E);
    }
    for(const n of K.nodes)if(n.left){assert.ok(Math.abs(n.left.count-n.right.count)<=1);assert.equal(n.axis,n.depth%2);}
  }
});
test('CG6 cascading maps preserve prefix identity sets and remove repeated binary searches',()=>{
  const P=Array.from({length:64},(_,i)=>[i/4-8,((i*23)%64)/4-8]),T=H.rangeTree(P);
  for(const n of T.nodes)if(n.left){for(let k=0;k<=n.y.length;k++){
    assert.equal(n.toLeft[k]+n.toRight[k],k);
    const A=new Set(n.left.y),prefix=n.y.slice(0,k);assert.deepEqual(n.left.y.slice(0,n.toLeft[k]),prefix.filter(i=>A.has(i)));
    assert.deepEqual(n.right.y.slice(0,n.toRight[k]),prefix.filter(i=>!A.has(i)));
  }}
  const R=[-7.6,7.2,-4.1,5.1],a=H.rangeQuery(T,R,true),b=H.rangeQuery(T,R,false);
  assert.ok(a.canonical.length>3);assert.equal(a.searches,2);assert.equal(b.searches,2*b.canonical.length);
  assert.ok(a.yComparisons<b.yComparisons);assert.ok(a.links>0);assertIds(a.hits,b.hits);
  assert.equal(T.entries,64*7);
});
test('CG6 interval and segment trees handle every endpoint/gap and retain duplicate intervals',()=>{
  const all=[];for(let a=-2;a<=2;a++)for(let b=a;b<=2;b++)all.push([a,b]);
  for(let seed=0;seed<80;seed++){
    const next=H.random(seed),I=all.filter(()=>next()<.6);if(seed%2===0)I.push([0,0],[0,0],[-2,2]);
    const T=H.intervalTree(I),S=H.segmentTree(I);
    assert.equal(T.entries,2*I.length);assert.equal(T.nodes.reduce((s,n)=>s+n.ascending.length,0),I.length);
    for(let x=-3;x<=3;x+=.125){const E=scanIntervals(I,x),a=H.intervalQuery(T,x),b=H.segmentQuery(S,x);assertIds(a.hits,E);assertIds(b.hits,E);
      assert.ok(a.tests<=a.hits.length+a.trace.length);assert.ok(b.trace.length<=Math.ceil(Math.log2(Math.max(1,2*S.ends.length-1)))+1);
    }
    // Every stored cover partitions the original interval's elementary atoms exactly once.
    I.forEach(([lo,hi],id)=>{const cover=S.cover[id].flatMap(k=>Array.from({length:S.nodes[k].hi-S.nodes[k].lo},(_,j)=>S.nodes[k].lo+j));
      const expected=[];for(let a=0;a<2*S.ends.length-1;a++){const x=a%2?(S.ends[(a-1)/2]+S.ends[(a+1)/2])/2:S.ends[a/2];if(lo<=x&&x<=hi)expected.push(a);}assertIds(cover,expected);
    });
  }
});
test('CG6 interval medians balance recursive sides, including shared endpoints',()=>{
  for(const I of [[],[[1,1]],Array.from({length:32},()=>[0,0]),Array.from({length:32},(_,i)=>[i/4-4,i/4-4])]){
    const T=H.intervalTree(I),count=n=>n?n.ascending.length+count(n.left)+count(n.right):0;
    for(const n of T.nodes){assert.ok(count(n.left)<=count(n)/2);assert.ok(count(n.right)<=count(n)/2);assertIds(H.intervalQuery(T,n.center).hits,scanIntervals(I,n.center));}
  }
});
test('CG6 nearest search agrees with exact integer distances across dimensions and ties',()=>{
  for(let seed=0;seed<40;seed++)for(const dim of [2,3,8,16,32]){
    const next=H.random(seed),P=Array.from({length:65},()=>Array.from({length:dim},()=>Math.floor(next()*17)-8)),q=Array.from({length:dim},()=>Math.floor(next()*17)-8);
    if(seed%3===0)P[64]=P[0].slice();const T=H.nearestTree(P),r=H.nearestQuery(T,q);
    const D=P.map(p=>p.reduce((s,x,a)=>s+(BigInt(x)-BigInt(q[a]))**2n,0n));let j=0;for(let i=1;i<P.length;i++)if(D[i]<D[j])j=i;
    assert.equal(r.index,j);assert.equal(r.squared,Number(D[j]));assert.ok(r.pointTests>=1&&r.pointTests<=P.length);assert.ok(r.boxTests<=T.nodes.length);
  }
  const T=H.nearestTree([[1,0],[-1,0],[0,1],[0,-1],[1,0]]);assert.equal(H.nearestQuery(T,[0,0]).index,0);
  assert.equal(H.nearestQuery(H.nearestTree([]),[0,0]).index,-1);
});
test('CG6 low-dimensional padding is an actual counterexample to an ambient-dimension-only claim',()=>{
  let reference;
  for(const d of [2,3,8,16,32]){const P=H.cloud(128,d,42,'plane'),r=H.nearestQuery(H.nearestTree(P),Array(d).fill(.5));
    const current={index:r.index,squared:r.squared,near:r.near,far:r.far,pointTests:r.pointTests,boxTests:r.boxTests};
    if(reference)assert.deepEqual(current,reference);else reference=current;
  }
  assert.ok(reference.pointTests<128);assert.ok(reference.near/reference.far<.5);
});
test('CG6 malformed numeric structures are rejected before model execution',()=>{
  const sparse=[];sparse.length=2;sparse[0]=[0,0];
  for(const P of [sparse,[[NaN,0]],[[Infinity,0]],[[9,0]],[[0]],Array(65).fill([0,0])]){assert.equal(H.validPoints(P),false);assert.throws(()=>H.kdTree(P));}
  for(const I of [[[2,1]],[[0,Infinity]],Array(33).fill([0,1])]){assert.throws(()=>H.intervalTree(I));assert.throws(()=>H.segmentTree(I));}
  assert.throws(()=>H.random(NaN));assert.throws(()=>H.cloud(0,2));assert.throws(()=>H.cloud(2,33));assert.throws(()=>H.nearestQuery(H.nearestTree([[0,0]]),[0]));
  assert.throws(()=>H.kdRange(H.kdTree([]),[0,1,0,NaN]));
});

test('CG6 dyadic meshes cover the square, share edges, and have no hanging triangle vertices',()=>{
  const curves=[[[-3,-3],[-2,-3],[-2,-2]],[[-8,-8],[8,8]],[[-8,0],[0,0],[0,8]],[[.1,.2],[.1,.2]],[[7.9,7.9],[8,8]]];
  for(const curve of curves)for(const depth of [0,2,4,5])for(const balance of [false,true]){
    const m=S.quadMesh(curve,depth,balance);if(balance){assert.ok(m.maxGap<=1);assert.ok(Math.abs(m.minAngle-45)<1e-10);}
    assert.equal(m.leaves.reduce((a,c)=>a+c.size*c.size,0),256);
    let area=0;const edges=new Map();
    for(const t of m.triangles){const [a,b,c]=t.map(i=>m.vertices[i]);const twice=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);assert.ok(twice>0);area+=twice/2;
      for(let j=0;j<3;j++){const i=t[j],k=t[(j+1)%3],key=[Math.min(i,k),Math.max(i,k)].join(',');edges.set(key,(edges.get(key)||0)+1);}
    }assert.equal(area,256);
    for(const [key,count] of edges){const [a,b]=key.split(',').map(Number).map(i=>m.vertices[i]);
      const boundary=[0,1].some(j=>a[j]===b[j]&&Math.abs(a[j])===8);assert.equal(count,boundary?1:2);
      // Independent geometric check: no other vertex lies strictly inside an edge.
      for(const p of m.vertices)if(p!==a&&p!==b){const cross=(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);if(cross===0)assert.ok((p[0]-a[0])*(p[0]-b[0])+(p[1]-a[1])*(p[1]-b[1])>=0);}
    }
    assert.equal(m.vertices.length-edges.size+m.triangles.length,1);
  }
});

// Independent integer plane/edge oracle: intersect a plane, then orient all
// triangle edges about its normal. No Möller–Trumbore barycentric test is reused.
const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot3=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0n);
const sub3=(a,b)=>a.map((x,i)=>x-b[i]);
function planeOracle(T,o,d){
  const [A,B,C,O,D]=[...T,o,d].map(p=>p.map(BigInt)),normal=cross3(sub3(B,A),sub3(C,A));
  let den=dot3(normal,D),num=dot3(normal,sub3(A,O));if(!den)return null;if(den<0n){num=-num;den=-den;}if(num<0n)return null;
  const P=O.map((x,i)=>x*den+num*D[i]);
  for(const [a,b] of [[A,B],[B,C],[C,A]])if(dot3(cross3(sub3(b,a),P.map((x,i)=>x-den*a[i])),normal)<0n)return null;
  return {n:num,d:den};
}
const cmpF=(a,b)=>a.n*b.d-b.n*a.d;
test('CG6 exact ray traversal matches a separate plane-and-edge oracle',()=>{
  let rays=0;
  for(let seed=1;seed<=16;seed++){
    const next=H.random(seed),point=()=>Array.from({length:3},()=>Math.floor(next()*15)-7),T=Array.from({length:24},()=>[point(),point(),point()]);
    for(const method of ['SAH','median']){const B=S.bvh(T,method);
      for(let k=0;k<80;k++){const o=point(),d=point();if(d.every(x=>!x))d[2]=1;let hit=null,index=-1;
        T.forEach((t,i)=>{const r=planeOracle(t,o,d);if(r&&(!hit||cmpF(r,hit)<0n)){hit=r;index=i;}});
        const r=S.rayQuery(B,o,d);assert.equal(r.triangle,index);if(hit)assert.equal(cmpF(hit,r.nearest.exact.t),0n);
        assert.ok(r.boxTests<=B.nodes.length);assert.ok(r.triangleTests<=T.length);assert.equal(new Set(r.tested).size,r.tested.length);rays++;
      }
    }
  }assert.equal(rays,2560);
});
test('CG6 slab and triangle decisions retain edge hits, ties and subnormal directions',()=>{
  const triangle=[[-1,-1,1],[1,-1,1],[0,1,1]],T=[triangle,triangle,[[0,0,0],[0,0,0],[0,0,0]]];
  for(const method of ['SAH','median'])for(const origin of [[0,0,0],[-1,-1,0],[0,1,0]]){
    const r=S.rayQuery(S.bvh(T,method),origin,[0,0,Number.MIN_VALUE]);assert.equal(r.triangle,0);assert.equal(r.nearest.finiteDistance,false);assert.ok(r.nearest.point.every(Number.isFinite));assert.equal(r.nearest.point[2],1);
  }
  assert.deepEqual(S.rayBox([[-1,1],[-1,1],[-1,1]],[0,0,0],[0,0,1]),[0,1]);
  assert.equal(S.rayBox([[-1,1],[-1,1],[-1,1]],[2,0,0],[0,0,1]),null);
  assert.equal(S.rayTriangle(triangle,[0,0,1],[1,0,0]),null);
  assert.throws(()=>S.rayQuery(S.bvh(T),[0,0,0],[0,0,0]));
});
test('CG6 SAH evaluates every centroid split and respects the unsplit-leaf alternative',()=>{
  const T=S.triangleScene(17,24);
  for(const cost of [0,.5,4]){const B=S.bvh(T,'SAH',cost);
    for(const n of B.nodes){if(n.ids.length>1&&S.surface(n.box)>0){assert.equal(n.candidates.length,3*(n.ids.length-1));assert.equal(n.best.cost,Math.min(...n.candidates.map(c=>c.cost)));assert.equal(!!n.left,n.best.cost<n.leafCost);}
      for(const id of n.ids)for(const p of T[id])p.forEach((x,a)=>assert.ok(n.box[a][0]<=x&&x<=n.box[a][1]));
      if(n.left)assertIds([...n.left.ids,...n.right.ids],n.ids);
    }
  }
  assert.equal(S.bvh(Array(20).fill(T[0]),'SAH',4).nodes.length,1);
});

function segmentOracle([a,b],o,d){const u=[b[0]-a[0],b[1]-a[1]],w=[a[0]-o[0],a[1]-o[1]],cross=(x,y)=>x[0]*y[1]-x[1]*y[0];let den=cross(d,u),t=cross(w,u),v=cross(w,d);if(!den)return null;if(den<0){den=-den;t=-t;v=-v;}return t>=0&&v>=0&&v<=den?t/den:null;}
test('CG6 BSP fragments partition sources and paint noncollinear rays back to front',()=>{
  const segments=[[[-7,-4],[5,3]],[[-5,5],[6,-2]],[[-4,-5],[-2,7]],[[1,6],[7,4]]];let rays=0;
  for(let seed=0;seed<24;seed++){const B=S.bsp(segments,S.shuffledOrder(4,seed));assert.equal(B.fragments.length,segments.length+B.splits.length);
    for(let source=0;source<segments.length;source++){
      const [a,b]=segments[source],length=Math.hypot(b[0]-a[0],b[1]-a[1]),parts=B.fragments.filter(f=>f.source===source);assert.ok(Math.abs(parts.reduce((s,f)=>s+Math.hypot(f.points[1][0]-f.points[0][0],f.points[1][1]-f.points[0][1]),0)-length)<1e-12);
      for(const f of parts)for(const p of [f.a,f.b]){const X=p[0]-BigInt(a[0])*p[2],Y=p[1]-BigInt(a[1])*p[2];assert.equal(BigInt(b[0]-a[0])*Y-BigInt(b[1]-a[1])*X,0n);}
    }
    for(const eye of [[-8,-8],[8,-8],[-8,8],[8,8],[0,0]])for(let a=-8;a<=8;a++)for(let b=-8;b<=8;b++)if(a||b){const r=S.paintRay(B,eye,[a,b]);if(r.collinear)continue;
      for(let i=1;i<r.layers.length;i++)assert.ok(cmpF(r.layers[i-1].exact,r.layers[i].exact)>=0n);
      const hits=segments.map(s=>segmentOracle(s,eye,[a,b])),minimum=Math.min(...hits.filter(t=>t!==null));
      if(Number.isFinite(minimum)){assert.ok(r.source>=0);assert.ok(Math.abs(hits[r.source]-minimum)<1e-12);}else assert.equal(r.source,-1);rays++;
    }
  }assert.ok(rays>30000);
});

function cellContains(T,c,[x,y]){const segmentY=id=>id===-1?-9:id===-2?9:(()=>{const [a,b]=T.S[id];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);})();return c.left<=x&&x<=c.right&&segmentY(c.bottom)<=y+1e-12&&y<=segmentY(c.top)+1e-12;}
test('CG6 trapezoid DAG agrees with independent vertical-cell containment for all insertion orders',()=>{
  const segments=[[[-7,-3],[5,-2]],[[-6,2],[4,4]],[[-3,-.5],[7,1]],[[0,5],[6,6]]];
  const perms=A=>A.length?A.flatMap((x,i)=>perms(A.filter((_,j)=>i!==j)).map(p=>[x,...p])):[[]];let queries=0,shared=false;
  for(const order of perms([0,1,2,3])){const T=S.trapezoidalMap(segments,order);
    for(let f=0;f<T.frames.length;f++){const F=T.frames[f],incoming=new Map();assert.ok(F.cells.length<=3*f+1);
      for(const n of F.nodes)if(n.type!=='leaf')for(const child of [n.left,n.right])incoming.set(child,(incoming.get(child)||0)+1);
      if(F.cells.some(c=>incoming.get(c.leaf)>1))shared=true;
      const reachable=new Set(),visit=id=>{if(reachable.has(id))return;reachable.add(id);const n=F.nodes[id];if(n.type!=='leaf'){visit(n.left);visit(n.right);}};visit(0);assert.equal(reachable.size,F.nodes.length);
      for(let x=-8;x<=8;x+=.5)for(let y=-8;y<=8;y+=.5){const r=S.locateTrapezoid(T,[x,y],f);assert.ok(cellContains(T,r.cell,[x,y]));assert.equal(r.trace.length,r.depth);queries++;}
      // The map covers the enclosing box with no overlap of interiors.
      let area=0;for(const c of F.cells){const P=S.trapezoidPolygon(T,c);area+=(c.right-c.left)*((P[3][1]-P[0][1])+(P[2][1]-P[1][1]))/2;}assert.ok(Math.abs(area-324)<1e-10);
    }
  }assert.equal(queries,130680);assert.equal(shared,true);
});
test('CG6 geometric input degeneracies are explicit instead of silently altering the algorithms',()=>{
  for(const segments of [[[[0,0],[0,1]]],[[[-1,0],[1,0]],[[0,-1],[0,1]]],[[[-1,0],[1,0]],[[1,0],[2,1]]]])assert.throws(()=>S.trapezoidalMap(segments));
  assert.equal(S.trapezoidalMap([]).cells.length,1);assert.equal(S.locateTrapezoid(S.trapezoidalMap([]),[0,0]).depth,0);
  assert.throws(()=>S.quadMesh([[0,0],[1,1]],6));assert.throws(()=>S.bsp([[[0,0],[0,0]]]));assert.throws(()=>S.bvh([[[NaN,0,0],[0,0,0],[1,1,1]]]));
});
test('CG6 frozen identities and researched syllabus references remain synchronized',()=>{
  const plan=JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json',import.meta.url),'utf8'));
  const frozen=plan.chapters.find(c=>c.collection==='cg'&&c.chapter===6),sy=(syllabus.chapters||syllabus).find(c=>c.n===6);
  assert.equal(chapter.items.length,8);
  for(const f of frozen.items){const a=chapter.items.find(i=>i.num===f.num),b=sy.items.find(i=>i.num===f.num);assert.ok(a);for(const key of ['num','kind','name','deps'])assert.deepEqual(a[key],f[key]);assert.deepEqual(a.refs,b.refs);assert.equal(typeof a.viz,'function');assert.ok(a.statement.length>150&&a.idea.length>200&&a.scope.length>100);assert.match(a.links.source,/^https:\/\//);}
});
test('CG6 history DAG handles varying disjoint inputs and exact tiny x separations',()=>{
  for(let seed=1;seed<=30;seed++){
    const next=H.random(seed),segments=Array.from({length:8},(_,i)=>{const y=-6.5+i*1.8;return [[-7.5+next()*5,y+next()*.1],[3+next()*4.5,y+next()*.1]];});
    const T=S.trapezoidalMap(segments,S.shuffledOrder(8,seed));
    for(let frame=0;frame<=8;frame++)for(let i=0;i<70;i++){const q=[next()*16-8,next()*16-8],r=S.locateTrapezoid(T,q,frame);assert.ok(cellContains(T,r.cell,q));}
    assert.ok(T.cells.length<=25);
  }
  const m=Number.MIN_VALUE,T=S.trapezoidalMap([[[m,-1],[2*m,1]],[[3*m,2],[4*m,3]]]);
  for(const q of [[0,0],[m,-1],[2*m,1],[3*m,2],[4*m,3]]){const r=S.locateTrapezoid(T,q);assert.ok(r.cell.left<=q[0]&&q[0]<=r.cell.right);assert.ok(S.trapezoidPolygon(T,r.cell).flat().every(Number.isFinite));}
});
