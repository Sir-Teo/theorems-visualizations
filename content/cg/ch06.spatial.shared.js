import {validPoints,random,dense} from './ch06.shared.js';
import {segmentsMeet,integerScale} from './geometry-source-audit.shared.js';

// Dyadic mesh: the feature polyline controls refinement, not the domain boundary.
export function quadMesh(curve,maxDepth=4,balance=true) {
  if(!validPoints(curve,12)||curve.length<2)throw Error('Use 2…12 finite polyline vertices in [−8,8]².');
  if(!Number.isInteger(maxDepth)||maxDepth<0||maxDepth>5)throw Error('Refinement depth must be an integer from0 to5.');
  const nodes=[],history=[];
  const make=(x,y,size,level)=>{const n={id:nodes.length,x,y,size,level};nodes.push(n);return n;};
  const root=make(-8,-8,16,0);
  function split(n,reason){const h=n.size/2;n.children=[[0,0],[1,0],[0,1],[1,1]].map(([i,j])=>make(n.x+i*h,n.y+j*h,h,n.level+1));history.push({node:n.id,reason,children:n.children.map(c=>c.id)});}
  function touches(n){const x=n.x,y=n.y,s=n.size,box=[[x,y],[x+s,y],[x+s,y+s],[x,y+s]],inside=p=>p[0]>=x&&p[0]<=x+s&&p[1]>=y&&p[1]<=y+s;
    for(let i=1;i<curve.length;i++)if(inside(curve[i-1])||inside(curve[i])||box.some((p,j)=>segmentsMeet(curve[i-1],curve[i],p,box[(j+1)%4])))return true;return false;}
  function refine(n){if(n.level<maxDepth&&touches(n)){split(n,'feature');n.children.forEach(refine);}}
  refine(root);const leaves=()=>nodes.filter(n=>!n.children);
  const neighbors=(a,b)=>((a.x+a.size===b.x||b.x+b.size===a.x)&&Math.max(a.y,b.y)<Math.min(a.y+a.size,b.y+b.size))||((a.y+a.size===b.y||b.y+b.size===a.y)&&Math.max(a.x,b.x)<Math.min(a.x+a.size,b.x+b.size));
  if(balance){for(;;){const L=leaves(),mark=new Set();for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++)if(Math.abs(L[i].level-L[j].level)>1&&neighbors(L[i],L[j]))mark.add(L[i].level<L[j].level?L[i]:L[j]);
    if(!mark.size)break;for(const n of mark)split(n,'balance');}}
  const L=leaves(),vertices=[],lookup=new Map(),triangles=[],owners=[];
  function vertex(p){const key=p.join(',');if(!lookup.has(key)){lookup.set(key,vertices.length);vertices.push(p);}return lookup.get(key);}
  for(const n of L)for(const [i,j] of [[0,0],[1,0],[1,1],[0,1]])vertex([n.x+i*n.size,n.y+j*n.size]);
  const corners=vertices.slice();
  for(const n of L){const {x,y,size:s}=n,boundary=corners.filter(([a,b])=>(a===x||a===x+s)&&y<=b&&b<=y+s||(b===y||b===y+s)&&x<=a&&a<=x+s);
    boundary.sort((a,b)=>Math.atan2(a[1]-y-s/2,a[0]-x-s/2)-Math.atan2(b[1]-y-s/2,b[0]-x-s/2));
    const c=vertex([x+s/2,y+s/2]);n.boundary=boundary.map(vertex);n.center=c;
    for(let j=0;j<n.boundary.length;j++){triangles.push([c,n.boundary[j],n.boundary[(j+1)%n.boundary.length]]);owners.push(n.id);}
  }
  let maxGap=0;for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++)if(neighbors(L[i],L[j]))maxGap=Math.max(maxGap,Math.abs(L[i].level-L[j].level));
  let minAngle=180;for(const t of triangles)for(let k=0;k<3;k++){const p=vertices[t[k]],a=vertices[t[(k+1)%3]].map((x,j)=>x-p[j]),b=vertices[t[(k+2)%3]].map((x,j)=>x-p[j]);minAngle=Math.min(minAngle,Math.atan2(Math.abs(a[0]*b[1]-a[1]*b[0]),a[0]*b[0]+a[1]*b[1])*180/Math.PI);}
  return {root,nodes,leaves:L,history,vertices,triangles,owners,maxGap,minAngle,featureSplits:history.filter(f=>f.reason==='feature').length,balanceSplits:history.filter(f=>f.reason==='balance').length};
}

const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],typeof a[0]==='bigint'?0n:0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function trianglesValid(T){return Array.isArray(T)&&T.length<=48&&Array.from({length:T.length},(_,i)=>Object.hasOwn(T,i)&&validPoints(T[i],3,3)&&T[i].length===3).every(Boolean);}
export function bounds(T,ids=T.map((_,i)=>i)) {
  if(!ids.length)return null;
  return Array.from({length:3},(_,a)=>[Math.min(...ids.flatMap(i=>T[i].map(p=>p[a]))),Math.max(...ids.flatMap(i=>T[i].map(p=>p[a])))]);
}
export function surface(B){if(!B)return 0;const [x,y,z]=B.map(([a,b])=>b-a);return 2*(x*y+x*z+y*z);}
function unionBox(A,B){if(!A)return B.map(r=>r.slice());return A.map(([a,b],i)=>[Math.min(a,B[i][0]),Math.max(b,B[i][1])]);}
export function bvh(T,method='SAH',boxCost=.5) {
  if(!trianglesValid(T))throw Error('Use at most48 triangles, each with three finite 3D vertices in [−8,8].');
  if(!['SAH','median'].includes(method)||!Number.isFinite(boxCost)||boxCost<0||boxCost>4)throw Error('Choose SAH or median and a box cost in [0,4].');
  const nodes=[],boxes=T.map(t=>bounds([t])),centers=boxes.map(b=>b.map(([a,c])=>(a+c)/2));
  function build(ids,depth){if(!ids.length)return null;const box=bounds(T,ids),n={id:nodes.length,depth,box,ids:ids.slice(),leafCost:ids.length,candidates:[]};nodes.push(n);
    if(ids.length===1||surface(box)===0)return n;
    let best=null;
    for(let axis=0;axis<3;axis++){
      const A=ids.slice().sort((a,b)=>centers[a][axis]-centers[b][axis]||a-b),prefix=[],suffix=[];let B=null;
      for(let i=0;i<A.length;i++){B=unionBox(B,boxes[A[i]]);prefix[i]=B;}B=null;
      for(let i=A.length-1;i>=0;i--){B=unionBox(B,boxes[A[i]]);suffix[i]=B;}
      for(let k=1;k<A.length;k++){const cost=2*boxCost+(surface(prefix[k-1])*k+surface(suffix[k])*(A.length-k))/surface(box),c={axis,k,cost};n.candidates.push(c);
        if(!best||cost<best.cost)best={...c,order:A};}
    }
    if(method==='median'){
      let axis=0;for(let a=1;a<3;a++)if(box[a][1]-box[a][0]>box[axis][1]-box[axis][0])axis=a;
      const order=ids.slice().sort((a,b)=>centers[a][axis]-centers[b][axis]||a-b),k=ids.length>>>1;
      best={...n.candidates.find(c=>c.axis===axis&&c.k===k),order};
    }
    n.best=best?{axis:best.axis,k:best.k,cost:best.cost}:null;
    if(best&&(method==='median'||best.cost<n.leafCost)){n.axis=best.axis;n.left=build(best.order.slice(0,best.k),depth+1);n.right=build(best.order.slice(best.k),depth+1);}
    return n;
  }return {T,nodes,root:build(T.map((_,i)=>i),0),method,boxCost};
}
const fraction=(n,d)=>d<0n?{n:-n,d:-d}:{n,d};
const compare=(a,b)=>{const d=a.n*b.d-b.n*a.d;return d<0n?-1:d>0n?1:0;};
function approximate({n,d}){if(n===0n)return 0;const sign=n<0n?-1:1,a=n<0n?-n:n,sa=Math.max(0,a.toString(2).length-53),sb=Math.max(0,d.toString(2).length-53);return sign*(Number(a>>BigInt(sa))/Number(d>>BigInt(sb)))*2**(sa-sb);}
function exactBox(box,origin,direction,maxT=null) {
  const {P}=integerScale([box.map(r=>r[0]),box.map(r=>r[1]),origin,direction]),[lo,hi,o,d]=P;
  let near={n:0n,d:1n},far=maxT;
  for(let a=0;a<3;a++){
    if(d[a]===0n){if(o[a]<lo[a]||o[a]>hi[a])return null;}
    else {let x=fraction(lo[a]-o[a],d[a]),y=fraction(hi[a]-o[a],d[a]);if(compare(x,y)>0)[x,y]=[y,x];if(compare(x,near)>0)near=x;if(!far||compare(y,far)<0)far=y;if(compare(near,far)>0)return null;}
  }return [near,far];
}
export function rayBox(box,origin,direction,maxT=Infinity) {
  let limit=null;if(maxT!==Infinity){if(!Number.isFinite(maxT)||maxT<0)throw Error('Nonnegative ray limit required.');const {P,e}=integerScale([[maxT]]);limit={n:P[0][0],d:1n<<BigInt(-e)};}
  const span=exactBox(box,origin,direction,limit);return span?.map(x=>x?approximate(x):Infinity)??null;
}
// Determinant decisions are exact on the input binary64 rationals. Coplanar rays
// and zero-area primitives have no isolated intersection in this surface model.
export function rayTriangle(T,o,d) {
  const {P}=integerScale([...T,o,d]),e=sub(P[1],P[0]),f=sub(P[2],P[0]),p=cross(P[4],f),det=dot(e,p);
  if(det===0n)return null;const s=sub(P[3],P[0]),q=cross(s,e),u=fraction(dot(s,p),det),v=fraction(dot(P[4],q),det),t=fraction(dot(f,q),det);
  if(u.n<0n||v.n<0n||u.n+v.n>u.d||t.n<0n)return null;
  const un=approximate(u),vn=approximate(v),tn=approximate(t);
  return {t:tn,u:un,v:vn,point:T[0].map((x,a)=>(1-un-vn)*x+un*T[1][a]+vn*T[2][a]),exact:{t,u,v},finiteDistance:Number.isFinite(tn)};
}
export function rayQuery(tree,origin,direction) {
  if(!validPoints([origin,direction],2,3,16)||direction.every(x=>x===0))throw Error('Ray origin/direction need three finite coordinates in [−16,16] and nonzero direction.');
  let nearest=null,triangle=-1,boxTests=0,triangleTests=0;const trace=[],tested=[];
  function visit(n){if(!n)return;boxTests++;const span=exactBox(n.box,origin,direction,nearest?.exact.t??null);
    if(!span){trace.push({node:n.id,action:'box miss'});return;}
    trace.push({node:n.id,action:n.left?'descend':'test triangles',entry:approximate(span[0])});
    if(n.left){
      // Fixed child order keeps every box test explicit; closest-hit pruning still uses current t.
      visit(n.left);visit(n.right);
    }else for(const id of n.ids){triangleTests++;tested.push(id);const hit=rayTriangle(tree.T[id],origin,direction);
      if(hit&&(!nearest||compare(hit.exact.t,nearest.exact.t)<0||compare(hit.exact.t,nearest.exact.t)===0&&id<triangle)){nearest=hit;triangle=id;}}
  }
  visit(tree.root);return {nearest,triangle,trace,tested,boxTests,triangleTests};
}
export function triangleScene(seed=1,count=16) {
  if(!Number.isInteger(count)||count<1||count>48)throw Error('Scene size must be1…48.');const next=random(seed);
  return Array.from({length:count},()=>{const x=next()*12-6,y=next()*12-6,z=next()*12-6,r=.3+next();return [[x-r,y-r,z],[x+r,y-r,z+.3],[x,y+r,z-.3]];});
}

// Homogeneous rational points keep BSP fragments on their original supporting
// lines. Only the conversion to screen coordinates rounds intersections.
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){const t=a%b;a=b;b=t;}return a||1n;};
function reduced(A,point=false){let D=A.reduce((g,x)=>gcd(g,x),0n);if(point&&A[2]<0n)D=-D;return A.map(x=>x/D);}
const lineOf=(a,b)=>reduced(cross(a,b));
const side=(L,p)=>{const x=dot(L,p);return x<0n?-1:x>0n?1:0;};
const displayPoint=p=>[approximate({n:p[0],d:p[2]}),approximate({n:p[1],d:p[2]})];
function rationalPoints(P){const {P:Q,e}=integerScale(P),S=1n<<BigInt(-e);return Q.map(([x,y])=>reduced([x,y,S],true));}
function validSegments(S,max=10){return Array.isArray(S)&&S.length<=max&&Array.from({length:S.length},(_,i)=>Object.hasOwn(S,i)&&validPoints(S[i],2)&&S[i].length===2&&S[i][0].some((x,a)=>x!==S[i][1][a])).every(Boolean);}
export function bsp(S,order=S.map((_,i)=>i)) {
  if(!validSegments(S))throw Error('Use at most10 nonzero segments, each with two finite vertices in [−8,8]².');
  if(!dense(order)||order.length!==S.length||new Set(order).size!==S.length||order.some(i=>!Number.isInteger(i)||i<0||i>=S.length))throw Error('Insertion order must be a permutation of segment identities.');
  const Q=rationalPoints(S.flat()),nodes=[],splits=[];
  const initial=order.map(id=>({key:String(id),source:id,a:Q[2*id],b:Q[2*id+1]}));
  function build(A,depth){if(!A.length)return null;const first=A[0],L=lineOf(first.a,first.b),n={id:nodes.length,depth,line:L,fragments:[first]};nodes.push(n);const neg=[],pos=[];
    for(const f of A.slice(1)){const a=side(L,f.a),b=side(L,f.b);
      if(!a&&!b)n.fragments.push(f);
      else if(a>=0&&b>=0)pos.push(f);
      else if(a<=0&&b<=0)neg.push(f);
      else {const p=reduced(cross(L,lineOf(f.a,f.b)),true),left={...f,key:f.key+'a',b:p},right={...f,key:f.key+'b',a:p};
        (a<0?neg:pos).push(left);(b<0?neg:pos).push(right);splits.push({source:f.source,node:n.id,point:displayPoint(p)});}
    }
    n.negative=build(neg,depth+1);n.positive=build(pos,depth+1);return n;
  }
  const root=build(initial,0),fragments=nodes.flatMap(n=>n.fragments.map(f=>({...f,node:n.id,points:[displayPoint(f.a),displayPoint(f.b)]})));
  return {S,order,nodes,root,fragments,splits};
}
export function painterOrder(T,viewer) {
  if(!validPoints([viewer],1))throw Error('Viewer must be finite and in [−8,8]².');const [p]=rationalPoints([viewer]),fragments=[],trace=[];let onPlanes=0;
  function visit(n){if(!n)return;const s=side(n.line,p);if(!s)onPlanes++;const far=s>=0?n.negative:n.positive,near=s>=0?n.positive:n.negative;
    visit(far);for(const f of n.fragments){fragments.push(f);trace.push({node:n.id,fragment:f.key,source:f.source,side:s});}visit(near);
  }visit(T.root);return {fragments,trace,onPlanes};
}
// Exact 2D ray/segment intersection parameter; collinear rays are identified.
export function raySegment(segment,origin,direction) {
  if(!validPoints([...segment,origin,direction],4,2,16)||segment.length!==2||direction.every(x=>x===0))throw Error('Finite ray/segment coordinates and a nonzero direction required.');
  return rationalRaySegment(...rationalPoints([...segment,origin,direction]));
}
function rationalRaySegment(a,b,o,d){
  const end=reduced([o[0]*d[2]+d[0]*o[2],o[1]*d[2]+d[1]*o[2],o[2]*d[2]],true),L=lineOf(o,end),K=lineOf(a,b),p=cross(L,K);
  if(p[2]===0n)return {hit:null,collinear:side(L,a)===0&&side(L,b)===0};
  const q=reduced(p,true),axis=d[0]!==0n?0:1;
  const t=fraction((q[axis]*o[2]-o[axis]*q[2])*d[2],q[2]*o[2]*d[axis]);
  const within=[0,1].every(j=>{const x={n:q[j],d:q[2]},u={n:a[j],d:a[2]},v={n:b[j],d:b[2]};return compare(x,compare(u,v)<=0?u:v)>=0&&compare(x,compare(u,v)<=0?v:u)<=0;});
  return {hit:t.n>=0n&&within?t:null,collinear:false};
}
export function paintRay(T,viewer,direction){
  if(!validPoints([viewer,direction],2,2,8)||direction.every(x=>x===0))throw Error('Finite viewer/direction in [−8,8]² and a nonzero direction required.');
  const [o,d]=rationalPoints([viewer,direction]),order=painterOrder(T,viewer),layers=[];let collinear=false;
  for(const f of order.fragments){const r=rationalRaySegment(f.a,f.b,o,d);collinear||=r.collinear;if(r.hit)layers.push({source:f.source,fragment:f.key,exact:r.hit,t:approximate(r.hit)});}
  return {layers,collinear,source:layers.length?layers.at(-1).source:-1};
}

const addF=(a,b)=>fraction(a.n*b.d+b.n*a.d,a.d*b.d);
function numberF(x){const {P,e}=integerScale([[x]]);return {n:P[0][0],d:1n<<BigInt(-e)};}
const midF=(a,b)=>{const s=addF(a,b);return {n:s.n,d:2n*s.d};};
const yOn=(L,x)=>fraction(-L[0]*x.n-L[2]*x.d,L[1]*x.d);
function trapezoids(S,ids,lines) {
  const xs=[-9,...ids.flatMap(i=>S[i].map(p=>p[0])),9].sort((a,b)=>a-b),cells=[],slabs=[];let prior=new Map();
  for(let k=1;k<xs.length;k++){
    const left=xs[k-1],right=xs[k],x=midF(numberF(left),numberF(right));
    const active=ids.filter(i=>S[i][0][0]<right&&S[i][1][0]>left).sort((a,b)=>compare(yOn(lines[a],x),yOn(lines[b],x)));
    const bounds=[-1,...active,-2],next=new Map(),slice=[];
    for(let j=1;j<bounds.length;j++){const bottom=bounds[j-1],top=bounds[j],key=bottom+':'+top;let c=prior.get(key);
      if(c)c.right=right;else{c={id:cells.length,left,right,bottom,top};cells.push(c);}next.set(key,c);slice.push(c.id);
    }slabs.push({left,right,cells:slice});prior=next;
  }
  return {cells,slabs};
}
export function trapezoidalMap(input,order=input.map((_,i)=>i)) {
  if(!validSegments(input,8))throw Error('Use at most8 nonzero segments in [−8,8]².');
  const S=input.map(s=>s[0][0]<s[1][0]?s.map(p=>p.slice()):[s[1].slice(),s[0].slice()]);
  if(new Set(S.flatMap(s=>s.map(p=>p[0]))).size!==2*S.length)throw Error('This map requires distinct endpoint x-coordinates; vertical segments are excluded.');
  for(let i=0;i<S.length;i++)for(let j=i+1;j<S.length;j++)if(segmentsMeet(...S[i],...S[j]))throw Error('This map requires disjoint segments, including their endpoints.');
  if(!dense(order)||order.length!==S.length||new Set(order).size!==S.length||order.some(i=>!Number.isInteger(i)||i<0||i>=S.length))throw Error('Insertion order must be a permutation.');
  const Q=rationalPoints(S.flat()),lines=S.map((_,i)=>lineOf(Q[2*i],Q[2*i+1]));lines[-1]=[0n,1n,9n];lines[-2]=[0n,1n,-9n];
  const nodes=[],frames=[],inserted=[];
  const cellKey=c=>[c.left,c.right,c.bottom,c.top].join(':');
  const makeLeaf=c=>{const n={id:nodes.length,type:'leaf',cell:cellKey(c)};nodes.push(n);return n;};
  let map=trapezoids(S,[],lines),leaves=new Map(map.cells.map(c=>[cellKey(c),makeLeaf(c)]));const root=nodes[0];
  function snapshot(segment,affected){frames.push({segment,inserted:inserted.slice(),cells:map.cells.map(c=>({...c,leaf:leaves.get(cellKey(c)).id})),nodes:nodes.map(n=>({...n,...(n.type!=='leaf'?{left:n.left.id,right:n.right.id}:{})})),affected:affected.slice()});}
  snapshot(null,[]);
  for(const id of order){const old=map;inserted.push(id);map=trapezoids(S,inserted,lines);const next=new Map(map.cells.map(c=>{const key=cellKey(c);return [key,leaves.get(key)||makeLeaf(c)];})),affected=[];
    function ref(bottom,top,x){const c=map.cells.find(c=>c.bottom===bottom&&c.top===top&&compare(numberF(c.left),x)<0&&compare(x,numberF(c.right))<0);if(!c)throw Error('Unresolved trapezoid replacement.');return {ref:next.get(cellKey(c))};}
    function install(target,spec){target.type=spec.type;delete target.cell;if(spec.type==='x')target.x=spec.x;else target.segment=spec.segment;
      for(const dir of ['left','right']){if(spec[dir].ref)target[dir]=spec[dir].ref;else{const n={id:nodes.length};nodes.push(n);install(n,spec[dir]);target[dir]=n;}}}
    for(const c of old.cells){const key=cellKey(c);if(next.has(key))continue;affected.push(key);
      const a=Math.max(c.left,S[id][0][0]),b=Math.min(c.right,S[id][1][0]);if(!(a<b))throw Error('Changed cell misses inserted segment.');const mid=midF(numberF(a),numberF(b)),y=yOn(lines[id],mid);
      if(compare(y,yOn(lines[c.bottom],mid))<=0||compare(y,yOn(lines[c.top],mid))>=0)throw Error('Changed cell has no interior crossing.');
      let spec={type:'y',segment:id,left:ref(c.bottom,id,mid),right:ref(id,c.top,mid)};
      if(b<c.right)spec={type:'x',x:b,left:spec,right:ref(c.bottom,c.top,midF(numberF(b),numberF(c.right)))};
      if(a>c.left)spec={type:'x',x:a,left:ref(c.bottom,c.top,midF(numberF(c.left),numberF(a))),right:spec};
      install(leaves.get(key),spec);
    }leaves=next;snapshot(id,affected);
  }
  return {S,order,lines,nodes,root,frames,cells:map.cells,leaves};
}
export function locateTrapezoid(T,q,frame=T.frames.length-1) {
  if(!validPoints([q],1)||!Number.isInteger(frame)||frame<0||frame>=T.frames.length)throw Error('Use a finite query in [−8,8]² and an existing insertion frame.');
  const F=T.frames[frame],[p]=rationalPoints([q]),x=numberF(q[0]),y=numberF(q[1]);let n=F.nodes[0];const trace=[];
  while(n.type!=='leaf'){
    let right;if(n.type==='x')right=q[0]>=n.x;else right=compare(y,yOn(T.lines[n.segment],x))>=0;
    trace.push({node:n.id,type:n.type,right,...(n.type==='x'?{x:n.x}:{segment:n.segment})});n=F.nodes[right?n.right:n.left];
    if(trace.length>F.nodes.length)throw Error('Cyclic location graph.');
  }
  const cell=F.cells.find(c=>c.leaf===n.id);if(!cell)throw Error('DAG reached an inactive cell.');
  const boundary=F.inserted.some(i=>side(T.lines[i],p)===0&&T.S[i][0][0]<=q[0]&&q[0]<=T.S[i][1][0]);
  return {cell,leaf:n.id,trace,depth:trace.length,boundary};
}
export function trapezoidPolygon(T,c){return [[c.left,approximate(yOn(T.lines[c.bottom],numberF(c.left)))],[c.right,approximate(yOn(T.lines[c.bottom],numberF(c.right)))],[c.right,approximate(yOn(T.lines[c.top],numberF(c.right)))],[c.left,approximate(yOn(T.lines[c.top],numberF(c.left)))]];}
export function shuffledOrder(n,seed){const A=Array.from({length:n},(_,i)=>i),next=random(seed);for(let i=n-1;i>0;i--){const j=Math.floor(next()*(i+1));[A[i],A[j]]=[A[j],A[i]];}return A;}
