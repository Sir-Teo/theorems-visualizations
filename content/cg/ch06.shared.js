// Geometric search: pure models. Point identities survive coincident coordinates.
export const SRC = {
  kd: 'https://www.cs.umd.edu/class/fall2023/cmsc754/Lects/lect14-kd-tree.pdf',
  range: 'https://www.cs.umd.edu/class/fall2023/cmsc754/Lects/lect15-orth-range-tree.pdf',
  trap: 'https://www.cs.umd.edu/class/fall2023/cmsc754/Lects/lect08-trap-map.pdf',
  location: 'https://www.cs.umd.edu/class/fall2023/cmsc754/Lects/lect09-pt-loc.pdf',
  interval: 'https://www.cs.umd.edu/class/fall2021/cmsc754/Lects/cmsc754-fall-2021-lects.pdf',
  bsp: 'https://cglab.ca/~morin/teaching/4804/bsp.html',
  mesh: 'https://courses.csail.mit.edu/18.337/2005/book/Lecture_11-Mesh_Generation.pdf',
  bvh: 'https://www.sci.utah.edu/~wald/Publications/2006/BVH/download/dynbvh.pdf',
  dimension: 'https://www.cs.cornell.edu/courses/cs4780/2022sp/lectures/Lecture3_kNN.html',
};
export const dense = a => Array.isArray(a) && Array.from({length:a.length}, (_,i)=>Object.hasOwn(a,i)).every(Boolean);
export function validPoints(P, max=64, dim=2, bound=8) {
  return dense(P) && P.length<=max && P.every(p=>dense(p) && p.length===dim && p.every(x=>Number.isFinite(x)&&Math.abs(x)<=bound));
}
function needPoints(P, max=64, dim=2, bound=8) {
  if(!validPoints(P,max,dim,bound)) throw Error(`Use at most ${max} dense ${dim}-coordinate points with finite coordinates in [−${bound},${bound}].`);
}
export function parsePoints(text) {
  if(typeof text!=='string'||text.length>8192) throw Error('Point JSON is limited to 8192 characters.');
  const P=JSON.parse(text);needPoints(P);return P;
}
export function checkedRect(R) {
  if(!dense(R)||R.length!==4||!R.every(Number.isFinite))throw Error('A rectangle needs four finite bounds.');
  return [Math.min(R[0],R[1]),Math.max(R[0],R[1]),Math.min(R[2],R[3]),Math.max(R[2],R[3])];
}
export function binaryBound(A,value,key=x=>x,upper=false,stats=null) {
  let lo=0,hi=A.length;
  while(lo<hi){const m=(lo+hi)>>>1;if(stats)stats.comparisons++;
    if(upper?key(A[m])<=value:key(A[m])<value)lo=m+1;else hi=m;
  }return lo;
}
const idsOf=P=>P.map((_,i)=>i);
const byAxis=(P,a)=>(i,j)=>P[i][a]-P[j][a]||i-j;
function sortedAxes(P){return [0,1].map(a=>idsOf(P).sort(byAxis(P,a)));}
function ranksOf(orders,n){const ranks=Array.from({length:n},()=>[0,0]);orders.forEach((A,a)=>A.forEach((id,r)=>{ranks[id][a]=r;}));return ranks;}
function rectRanks(P,orders,R,stats){return [0,1].flatMap(a=>[
  binaryBound(orders[a],R[2*a],i=>P[i][a],false,stats)-.5,
  binaryBound(orders[a],R[2*a+1],i=>P[i][a],true,stats)-.5,
]);}
function disjoint(A,B){return A[1]<B[0]||A[0]>B[1]||A[3]<B[2]||A[2]>B[3];}
function contained(A,B){return A[0]>=B[0]&&A[1]<=B[1]&&A[2]>=B[2]&&A[3]<=B[3];}

export function kdTree(P) {
  needPoints(P);const orders=sortedAxes(P),ranks=ranksOf(orders,P.length),nodes=[];
  function build(O,cell,depth){if(!O[0].length)return null;
    const n={id:nodes.length,depth,cell,count:O[0].length};nodes.push(n);
    if(n.count===1){n.point=O[0][0];return n;}
    const a=depth%2,m=Math.floor(n.count/2),L=new Set(O[a].slice(0,m));
    n.axis=a;n.cut=(ranks[O[a][m-1]][a]+ranks[O[a][m]][a])/2;
    const left=cell.slice(),right=cell.slice();left[2*a+1]=n.cut;right[2*a]=n.cut;
    n.left=build(O.map(A=>A.filter(i=>L.has(i))),left,depth+1);
    n.right=build(O.map(A=>A.filter(i=>!L.has(i))),right,depth+1);return n;
  }
  const root=build(orders,[-.5,P.length-.5,-.5,P.length-.5],0);
  return {P,orders,ranks,nodes,root};
}
export function kdRange(tree,rectangle) {
  const R=checkedRect(rectangle),stats={comparisons:0},rankRect=rectRanks(tree.P,tree.orders,R,stats),trace=[],hits=[];
  // Descendant reporting costs one operation per returned identity; it is not hidden in the node count.
  function report(n){if(Object.hasOwn(n,'point'))hits.push(n.point);else{report(n.left);report(n.right);}}
  function visit(n){if(!n)return;const action=disjoint(n.cell,rankRect)?'prune':contained(n.cell,rankRect)?'report':'descend';
    if(Object.hasOwn(n,'point')){
      const p=tree.P[n.point],inside=p[0]>=R[0]&&p[0]<=R[1]&&p[1]>=R[2]&&p[1]<=R[3];
      trace.push({node:n.id,action:inside?'point hit':'point miss'});if(inside)hits.push(n.point);return;
    }
    trace.push({node:n.id,action});if(action==='report')report(n);else if(action==='descend'){visit(n.left);visit(n.right);}
  }
  visit(tree.root);return {R,rankRect,hits,trace,visited:trace.length,rankComparisons:stats.comparisons,guide:Math.sqrt(tree.P.length)+hits.length};
}

export function rangeTree(P) {
  needPoints(P);const x=idsOf(P).sort(byAxis(P,0)),nodes=[];
  function build(lo,hi,depth){if(lo===hi)return null;const n={id:nodes.length,lo,hi,depth};nodes.push(n);
    if(hi-lo===1){n.y=[x[lo]];return n;}
    const mid=(lo+hi)>>>1;n.left=build(lo,mid,depth+1);n.right=build(mid,hi,depth+1);
    const A=n.left.y,B=n.right.y;let i=0,j=0;n.y=[];n.toLeft=[0];n.toRight=[0];
    while(i<A.length||j<B.length){if(j===B.length||(i<A.length&&byAxis(P,1)(A[i],B[j])<0))n.y.push(A[i++]);else n.y.push(B[j++]);n.toLeft.push(i);n.toRight.push(j);}
    return n;
  }const root=build(0,x.length,0);return {P,x,nodes,root,entries:nodes.reduce((s,n)=>s+n.y.length,0)};
}
export function rangeQuery(T,rectangle,cascade=true) {
  const R=checkedRect(rectangle),xStats={comparisons:0},yStats={comparisons:0};
  const lo=binaryBound(T.x,R[0],i=>T.P[i][0],false,xStats),hi=binaryBound(T.x,R[1],i=>T.P[i][0],true,xStats);
  const hits=[],trace=[],canonical=[];let links=0,searches=0;
  function yRange(n){searches+=2;return [binaryBound(n.y,R[2],i=>T.P[i][1],false,yStats),binaryBound(n.y,R[3],i=>T.P[i][1],true,yStats)];}
  function visit(n,a,b){if(!n)return;
    if(n.hi<=lo||n.lo>=hi){trace.push({node:n.id,action:'prune'});return;}
    if(lo<=n.lo&&n.hi<=hi){if(!cascade)[a,b]=yRange(n);canonical.push({node:n.id,from:a,to:b});hits.push(...n.y.slice(a,b));trace.push({node:n.id,action:'report',from:a,to:b});return;}
    trace.push({node:n.id,action:'descend',from:a,to:b});
    if(cascade){links+=4;visit(n.left,n.toLeft[a],n.toLeft[b]);visit(n.right,n.toRight[a],n.toRight[b]);}
    else{visit(n.left);visit(n.right);}
  }
  if(T.root){const [a,b]=cascade?yRange(T.root):[];visit(T.root,a,b);}
  return {R,hits,trace,canonical,xComparisons:xStats.comparisons,yComparisons:yStats.comparisons,searches,links};
}

export function checkedIntervals(I) {
  needPoints(I,32);if(I.some(([lo,hi])=>lo>hi))throw Error('Each closed interval must have left ≤ right.');return I;
}
export function intervalTree(I) {
  checkedIntervals(I);const nodes=[],ends=I.flatMap(([a,b],id)=>[{x:a,id},{x:b,id}]).sort((a,b)=>a.x-b.x||a.id-b.id);
  const left=idsOf(I).sort((a,b)=>I[a][0]-I[b][0]||a-b),right=idsOf(I).sort((a,b)=>I[b][1]-I[a][1]||a-b);
  function build(E,A,B,depth){if(!A.length)return null;const center=E[E.length>>>1].x;
    const side=id=>I[id][1]<center?-1:I[id][0]>center?1:0;
    const n={id:nodes.length,depth,center,ascending:A.filter(i=>!side(i)),descending:B.filter(i=>!side(i))};nodes.push(n);
    n.left=build(E.filter(e=>side(e.id)<0),A.filter(i=>side(i)<0),B.filter(i=>side(i)<0),depth+1);
    n.right=build(E.filter(e=>side(e.id)>0),A.filter(i=>side(i)>0),B.filter(i=>side(i)>0),depth+1);return n;
  }return {I,nodes,root:build(ends,left,right,0),entries:2*I.length};
}
export function intervalQuery(T,x) {
  if(!Number.isFinite(x))throw Error('Finite query required.');let n=T.root,tests=0;const hits=[],trace=[];
  while(n){const list=x<=n.center?n.ascending:n.descending,examined=[];
    for(const i of list){tests++;const hit=x<=n.center?T.I[i][0]<=x:T.I[i][1]>=x;examined.push({interval:i,hit});if(!hit)break;hits.push(i);}
    trace.push({node:n.id,examined});n=x===n.center?null:x<n.center?n.left:n.right;
  }return {x,hits,trace,tests};
}
export function segmentTree(I) {
  checkedIntervals(I);const ends=[...new Set(I.flat())].sort((a,b)=>a-b),nodes=[];
  function build(lo,hi,depth){const n={id:nodes.length,lo,hi,depth,intervals:[]};nodes.push(n);
    if(hi-lo>1){const m=(lo+hi)>>>1;n.left=build(lo,m,depth+1);n.right=build(m,hi,depth+1);}return n;}
  const root=ends.length?build(0,2*ends.length-1,0):null,cover=I.map(()=>[]);
  function insert(n,a,b,id){if(n.hi<=a||n.lo>=b)return;if(a<=n.lo&&n.hi<=b){n.intervals.push(id);cover[id].push(n.id);return;}insert(n.left,a,b,id);insert(n.right,a,b,id);}
  I.forEach(([a,b],id)=>insert(root,2*binaryBound(ends,a),2*binaryBound(ends,b)+1,id));
  return {I,ends,nodes,root,cover,entries:nodes.reduce((s,n)=>s+n.intervals.length,0)};
}
export function segmentQuery(T,x) {
  if(!Number.isFinite(x))throw Error('Finite query required.');const stats={comparisons:0},i=binaryBound(T.ends,x,z=>z,false,stats);
  const atom=T.ends[i]===x?2*i:2*i-1,hits=[],trace=[];let n=T.root;
  if(!n||atom<0||atom>=n.hi)return {x,atom,hits,trace,comparisons:stats.comparisons};
  while(n){hits.push(...n.intervals);trace.push({node:n.id,intervals:n.intervals.slice()});n=n.left?(atom<n.left.hi?n.left:n.right):null;}
  return {x,atom,hits,trace,comparisons:stats.comparisons};
}

export function random(seed=1){if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Seed must be an unsigned 32-bit integer.');let s=seed>>>0;return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
export function cloud(n,d,seed=1,model='cube') {
  if(!Number.isInteger(n)||n<1||n>256||!Number.isInteger(d)||d<2||d>32||!['cube','plane'].includes(model))throw Error('Cloud requires n=1…256, d=2…32, and cube or plane.');
  const next=random(seed);
  // Fixed 32-coordinate records keep prefixes comparable as dimension/model change.
  return Array.from({length:n},()=>Array.from({length:32},(_,a)=>{const x=next();return model==='plane'&&a>=2?.5:x;}).slice(0,d));
}
export function nearestTree(P) {
  const d=P[0]?.length||2;needPoints(P,256,d,8);const nodes=[];
  function build(ids,depth,cell=null){if(!ids.length)return null;const dataBox=Array.from({length:d},(_,a)=>[Math.min(...ids.map(i=>P[i][a])),Math.max(...ids.map(i=>P[i][a]))]);
    const box=cell||dataBox,n={id:nodes.length,depth,box,count:ids.length};nodes.push(n);if(ids.length===1){n.point=ids[0];return n;}
    let axis=0;for(let a=1;a<d;a++)if(dataBox[a][1]-dataBox[a][0]>dataBox[axis][1]-dataBox[axis][0])axis=a;
    const A=ids.slice().sort(byAxis(P,axis)),mid=A.length>>>1,cut=(P[A[mid-1]][axis]+P[A[mid]][axis])/2,left=box.map(r=>r.slice()),right=box.map(r=>r.slice());
    left[axis][1]=cut;right[axis][0]=cut;n.axis=axis;n.cut=cut;n.left=build(A.slice(0,mid),depth+1,left);n.right=build(A.slice(mid),depth+1,right);return n;
  }return {P,d,nodes,root:build(idsOf(P),0)};
}
export function nearestQuery(T,q) {
  if(!dense(q)||q.length!==T.d||!q.every(x=>Number.isFinite(x)&&Math.abs(x)<=8))throw Error('Query dimension and finite coordinate bounds must match the cloud.');
  const distance=p=>p.reduce((s,x,a)=>s+(x-q[a])**2,0),lower=n=>n.box.reduce((s,[a,b],j)=>s+(q[j]<a?a-q[j]:q[j]>b?q[j]-b:0)**2,0);
  let best=Infinity,index=-1,pointTests=0,boxTests=0;const trace=[];
  function visit(n,bound){if(!n)return;if(bound>best){trace.push({node:n.id,action:'prune',bound,best});return;}
    if(Object.hasOwn(n,'point')){pointTests++;const d=distance(T.P[n.point]);if(d<best||d===best&&(index<0||n.point<index)){best=d;index=n.point;}trace.push({node:n.id,action:'point',squared:d,best});return;}
    trace.push({node:n.id,action:'descend',bound,best});const a=lower(n.left),b=lower(n.right);boxTests+=2;
    if(a<=b){visit(n.left,a);visit(n.right,b);}else{visit(n.right,b);visit(n.left,a);}
  }
  if(T.root){boxTests++;visit(T.root,lower(T.root));}
  const distances=T.P.map(p=>Math.sqrt(distance(p))),near=distances.length?Math.min(...distances):null,far=distances.length?Math.max(...distances):null;
  return {index,squared:index<0?null:best,trace,pointTests,boxTests,distances,near,far,ratio:far>0?near/far:null};
}
