// Scoped source-audit constructions. Predicates operate on the exact binary
// rationals supplied by JS numbers; drawing coordinates remain floating point.
import {clipHalf} from './ch03.shared.js';
const bits=new DataView(new ArrayBuffer(8)),parts=new Map(),sign=x=>x<0n?-1:x>0n?1:0;
function dyadic(x){if(!Number.isFinite(x))throw Error('nonfinite coordinate');if(x===0)return[0n,0];if(parts.has(x))return parts.get(x);bits.setFloat64(0,x);const u=bits.getBigUint64(0),e=Number(u>>52n&2047n),m=(u&((1n<<52n)-1n))+(e?1n<<52n:0n),r=[u>>63n?-m:m,e?e-1023-52:-1074];parts.set(x,r);return r;}
export function integerScale(rows){const a=rows.map(r=>r.map(dyadic)),e=Math.min(...a.flat().filter(([m])=>m!==0n).map(([,e])=>e),0);return{e,P:a.map(r=>r.map(([m,p])=>m===0n?0n:m<<BigInt(p-e)))};}
const crossI=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
export const orientation=(a,b,c)=>{const{P}=integerScale([a,b,c]);return sign(crossI(...P));};
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
export const onSegment=(a,b,p)=>orientation(a,b,p)===0&&p[0]>=Math.min(a[0],b[0])&&p[0]<=Math.max(a[0],b[0])&&p[1]>=Math.min(a[1],b[1])&&p[1]<=Math.max(a[1],b[1]);
export function segmentsMeet(a,b,c,d){const x=orientation(a,b,c),y=orientation(a,b,d),z=orientation(c,d,a),w=orientation(c,d,b);return x*y<0&&z*w<0||!x&&onSegment(a,b,c)||!y&&onSegment(a,b,d)||!z&&onSegment(c,d,a)||!w&&onSegment(c,d,b);}
export function polygonStatus(P){const n=P.length;if(n<3)return'too few vertices';for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(same(P[i],P[j]))return'coincident vertices';
 for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n],c=P[(i+2)%n];if(orientation(a,b,c)===0&&(onSegment(a,b,c)||onSegment(b,c,a)))return'overlapping adjacent edges';for(let j=i+1;j<n;j++){if(j===i+1||i===0&&j===n-1)continue;if(segmentsMeet(a,b,P[j],P[(j+1)%n]))return'nonadjacent edges meet';}}
 return null;
}
export function polygonArea(P){const{P:Q,e}=integerScale(P);let a=0n;for(let i=0;i<Q.length;i++){const p=Q[i],q=Q[(i+1)%Q.length];a+=p[0]*q[1]-p[1]*q[0];}return Number(a)*2**(2*e)/2;}
export function planeStatus(V,E){for(let i=0;i<V.length;i++)for(let j=i+1;j<V.length;j++)if(same(V[i],V[j]))return'coincident vertices';
 for(let i=0;i<E.length;i++){const[a,b]=E[i];if(a===b)return'zero-length edge';for(let p=0;p<V.length;p++)if(p!==a&&p!==b&&onSegment(V[a],V[b],V[p]))return'vertex on an edge';for(let j=i+1;j<E.length;j++){const[c,d]=E[j],common=[a,b].filter(x=>x===c||x===d);if(common.length===2)return'duplicate edge';if(!common.length&&segmentsMeet(V[a],V[b],V[c],V[d]))return'edges cross or touch';}}
 const seen=new Set(V.length?[0]:[]);for(let i=0;i<V.length;i++)for(const[a,b]of E){if(seen.has(a))seen.add(b);if(seen.has(b))seen.add(a);}return seen.size===V.length?null:'disconnected graph (outside this demo)';
}
export function auditedDCEL(V,E){const bad=planeStatus(V,E);if(bad)return{bad};const{P:Q}=integerScale(V),H=[],out=V.map(()=>[]),faces=[];
 E.forEach(([a,b])=>{const i=H.length;H.push({origin:a,dest:b,id:i,twin:i+1},{origin:b,dest:a,id:i+1,twin:i});out[a].push(i);out[b].push(i+1);});
 const delta=(v,h)=>[Q[H[h].dest][0]-Q[v][0],Q[H[h].dest][1]-Q[v][1]],half=([x,y])=>y>0n||y===0n&&x>=0n?0:1;
 out.forEach((row,v)=>row.sort((a,b)=>{const U=delta(v,a),W=delta(v,b);return half(U)-half(W)||-sign(U[0]*W[1]-U[1]*W[0]);}));
 H.forEach(h=>{const row=out[h.dest],k=row.indexOf(h.twin);h.next=row[(k+row.length-1)%row.length];});H.forEach(h=>{H[h.next].prev=h.id;});
 H.forEach(h=>{if(h.face!==undefined)return;const edges=[],f=faces.length;let k=h.id;do{H[k].face=f;edges.push(k);k=H[k].next;}while(k!==h.id);const verts=edges.map(i=>H[i].origin);let area=0n;verts.forEach((v,i)=>{const w=verts[(i+1)%verts.length];area+=Q[v][0]*Q[w][1]-Q[v][1]*Q[w][0];});faces.push({edges,verts,area:polygonArea(verts.map(i=>V[i])),signedArea:area,outer:false});});
 if(faces.length)faces.reduce((a,b)=>a.signedArea<b.signedArea?a:b).outer=true;return{D:{H,out,faces},bad:null};
}
const inTriangle=(a,b,c,p)=>orientation(a,b,p)>=0&&orientation(b,c,p)>=0&&orientation(c,a,p)>=0;
export function auditedEars(P){const bad=polygonStatus(P);if(bad)return{bad,frames:[],tris:[]};const ids=P.map((_,i)=>i),tris=[],diags=[],frames=[];
 const push=o=>frames.push({ids:ids.slice(),tris:tris.slice(),diags:diags.slice(),...o});
 while(ids.length>3){const n=ids.length,ears=[];for(let j=0;j<n;j++){const ai=ids[(j+n-1)%n],bi=ids[j],ci=ids[(j+1)%n],a=P[ai],b=P[bi],c=P[ci];if(orientation(a,b,c)<=0)continue;if(ids.some(i=>i!==ai&&i!==bi&&i!==ci&&inTriangle(a,b,c,P[i])))continue;ears.push(j);}
  if(!ears.length){push({stuck:true,ears:[]});return{frames,tris,stuck:true,bad:'no valid ear found'};}const j=ears[0],other=ears.find(k=>k!==j&&k!==(j+1)%n&&k!==(j+n-1)%n),tri=[ids[(j+n-1)%n],ids[j],ids[(j+1)%n]];
  push({ears:ears.map(i=>ids[i]),twoEars:other===undefined?[ids[j]]:[ids[j],ids[other]],ear:ids[j],tri});tris.push(tri);diags.push([tri[0],tri[2]]);ids.splice(j,1);
 }tris.push(ids.slice());push({done:true,ears:[]});return{frames,tris,stuck:false,bad:null};
}
export function validDiagonal(P,a,b){const n=P.length;if(a===b||(a+1)%n===b||(b+1)%n===a)return false;const A=P[a],B=P[b];
 for(let i=0;i<n;i++){const j=(i+1)%n;if(i===a||i===b||j===a||j===b){const k=i===a||i===b?j:i;if(k!==a&&k!==b&&onSegment(A,B,P[k]))return false;}else if(segmentsMeet(A,B,P[i],P[j]))return false;}
 const{P:Q}=integerScale(P),M=[Q[a][0]+Q[b][0],Q[a][1]+Q[b][1]];let winding=0;for(let i=0;i<n;i++){const U=Q[i].map(x=>2n*x),V=Q[(i+1)%n].map(x=>2n*x),o=sign(crossI(U,V,M));if(o===0&&M[0]>= (U[0]<V[0]?U[0]:V[0])&&M[0]<=(U[0]>V[0]?U[0]:V[0])&&M[1]>=(U[1]<V[1]?U[1]:V[1])&&M[1]<=(U[1]>V[1]?U[1]:V[1]))return false;if(U[1]<=M[1]&&V[1]>M[1]&&o>0)winding++;if(U[1]>M[1]&&V[1]<=M[1]&&o<0)winding--;}return winding!==0;
}
export function diagonalWitness(P){let v=0;for(let i=1;i<P.length;i++)if(P[i][0]<P[v][0]||P[i][0]===P[v][0]&&P[i][1]<P[v][1])v=i;const n=P.length,u=(v+n-1)%n,w=(v+1)%n,inside=P.map((_,i)=>i).filter(i=>i!==u&&i!==v&&i!==w&&inTriangle(P[u],P[v],P[w],P[i]));if(!inside.length)return{u,v,w,a:u,b:w,inside,kind:'uw'};
 const{P:Q}=integerScale(P);let best=inside[0],d=-1n;for(const i of inside){const a=crossI(Q[u],Q[w],Q[i]),q=a<0n?-a:a;if(q>d){d=q;best=i;}}return{u,v,w,a:v,b:best,inside,kind:'vx'};
}
// Exact vertex enumeration for the bounded LP used by the backwards-analysis
// illustration. This reference is NOT an implementation of Seidel's O(n) method.
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;},fracKey=(a,b)=>{const g=gcd(a,b);return`${a/g}/${b/g}`;};
export function boundedOpt(cons,c,B=8){const rows=cons.concat([[1,0,B],[-1,0,B],[0,1,B],[0,-1,B]]),{P}=integerScale([...rows,[...c,0]]),C=P.pop();let best=null;const verts=[];
 for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const[a,b,r]=P[i],[d,e,s]=P[j];let D=a*e-b*d;if(!D)continue;let X=r*e-b*s,Y=a*s-r*d;if(D<0n){D=-D;X=-X;Y=-Y;}if(P.some(([a,b,r])=>a*X+b*Y>r*D))continue;const value=C[0]*X+C[1]*Y,q={X,Y,D,value,p:[Number(X)/Number(D),Number(Y)/Number(D)]};verts.push(q.p);if(!best||value*best.D>best.value*D||value*best.D===best.value*D&&(X*best.D>best.X*D||X*best.D===best.X*D&&Y*best.D>best.Y*D))best=q;}
 if(!best)return null;return{p:best.p,v:c[0]*best.p[0]+c[1]*best.p[1],key:fracKey(best.X,best.D)+','+fracKey(best.Y,best.D),vertices:verts,tight:P.slice(0,cons.length).map(([a,b,r],i)=>a*best.X+b*best.Y===r*best.D?i:-1).filter(i=>i>=0)};
}
export function deletionAnalysis(cons,c,B=8){const full=boundedOpt(cons,c,B),deleted=cons.map((_,i)=>boundedOpt(cons.filter((_,j)=>i!==j),c,B)),essential=deleted.map((q,i)=>q.key!==full.key?i:-1).filter(i=>i>=0);return{full,deleted,essential};}
// A Welzl/de Berg incremental run with exact containment on the input dyadics.
// A triple is only used under the algorithm's two-fixed-boundary-point invariant.
export function auditedWelzl(P){if(!P.length)return{frames:[],D:null,tests:0,rebuilds:0};const{P:Q,e}=integerScale(P);let tests=0,rebuilds=0;
 const disk=ids=>{if(ids.length===1)return{x:P[ids[0]][0],y:P[ids[0]][1],r:0,bnd:ids};const[a,b,c]=ids,A=P[a],B=P[b];if(ids.length===2){const bnd=same(A,B)?[a]:ids;return{x:A[0]+(B[0]-A[0])/2,y:A[1]+(B[1]-A[1])/2,r:Math.hypot(A[0]-B[0],A[1]-B[1])/2,bnd};}
  const U=Q[a],V=Q[b],W=Q[c],bx=V[0]-U[0],by=V[1]-U[1],cx=W[0]-U[0],cy=W[1]-U[1],det=2n*(bx*cy-by*cx);if(!det){const pairs=[[a,b],[a,c],[b,c]];return pairs.map(disk).reduce((a,b)=>a.r>b.r?a:b);}
  const ux=Number(cy*(bx*bx+by*by)-by*(cx*cx+cy*cy))/Number(det)*2**e,uy=Number(bx*(cx*cx+cy*cy)-cx*(bx*bx+by*by))/Number(det)*2**e;
  return{x:A[0]+ux,y:A[1]+uy,r:Math.hypot(ux,uy),bnd:ids};
 };
 const contains=(D,i)=>{const p=Q[i],ids=D.bnd;if(ids.length===1)return p[0]===Q[ids[0]][0]&&p[1]===Q[ids[0]][1];const a=Q[ids[0]],b=Q[ids[1]];if(ids.length===2)return(p[0]-a[0])*(p[0]-b[0])+(p[1]-a[1])*(p[1]-b[1])<=0n;
  const c=Q[ids[2]],ax=a[0]-p[0],ay=a[1]-p[1],bx=b[0]-p[0],by=b[1]-p[1],cx=c[0]-p[0],cy=c[1]-p[1],d=(ax*ax+ay*ay)*(bx*cy-by*cx)-(bx*bx+by*by)*(ax*cy-ay*cx)+(cx*cx+cy*cy)*(ax*by-ay*bx);return sign(d)*sign(crossI(a,b,c))>=0;
 };
 const check=(D,i)=>{tests++;return contains(D,i);};let D=disk([0]),frames=[];
 const frame=(i,reb,t0)=>{if(D.bnd.length===3){const[a,b,c]=D.bnd;for(const[u,v,w]of[[a,b,c],[a,c,b],[b,c,a]]){const U=Q[u],V=Q[v],W=Q[w];if((U[0]-W[0])*(V[0]-W[0])+(U[1]-W[1])*(V[1]-W[1])===0n){D=disk([u,v]);break;}}}
  frames.push({i,D:{x:D.x,y:D.y,r:D.r},bnd:D.bnd.slice(),reb,tests:tests-t0,total:tests,rebuilds,containsAll:Q.slice(0,i+1).every((_,j)=>contains(D,j))});};
 if(P.length===1)frame(0,false,0);else{D=disk([0,1]);frame(1,false,0);}
 for(let i=2;i<P.length;i++){const t0=tests;let reb=false;if(!check(D,i)){reb=true;rebuilds++;D=disk([0,i]);for(let j=1;j<i;j++)if(!check(D,j)){D=disk([i,j]);for(let k=0;k<j;k++)if(!check(D,k))D=disk([i,j,k]);}}frame(i,reb,t0);}
 return{frames,tests,rebuilds,D:{x:D.x,y:D.y,r:D.r},valid:frames.every(f=>f.containsAll&&Object.values(f.D).every(Number.isFinite))};
}
// Enumerate cells and edge incidences of the ENTIRE affine line arrangement.
// A bounding rectangle is used only to shade visible portions of selected cells.
function signSequence(line,L,skip=-1){const[a,b,c]=line,D=a*a+b*b;if(!D)return{bad:'the query line needs two distinct points'};const X=a*c,Y=b*c,initial=[],events=[];
 for(let j=0;j<L.length;j++){if(j===skip){initial.push(0);continue;}const[u,v,w]=L[j],q=u*X+v*Y-w*D,den=-u*b+v*a;if(!den){if(!q)return{bad:'coincident lines: choose a distinct query line'};initial.push(sign(q));continue;}initial.push(-sign(den));let n=-q,d=den;if(d<0n){n=-n;d=-d;}events.push({j,n,d});}
 events.sort((a,b)=>sign(a.n*b.d-b.n*a.d));const rows=[initial.slice()],groups=[];
 for(let k=0;k<events.length;){let j=k+1;while(j<events.length&&events[j].n*events[k].d===events[k].n*events[j].d)j++;const ids=events.slice(k,j).map(x=>x.j);ids.forEach(i=>initial[i]*=-1);rows.push(initial.slice());groups.push(ids);k=j;}
 return{rows,groups,generic:groups.every(g=>g.length===1)};
}
export function fullArrangementZone(lines,p,q,box=[-5,-3.6,5,3.6]){const{P:scaled,e}=integerScale([...lines,[...p,0],[...q,0]]),S=1n<<BigInt(-e),V=scaled.splice(lines.length),L=scaled.map(([a,b,c])=>[a,b,c*S]),[u,v]=V,a=u[1]-v[1],b=v[0]-u[0],query=[a,b,a*u[0]+b*u[1]],Z=signSequence(query,L);if(Z.bad)return{bad:Z.bad,faces:[],total:0};
 const cells=new Map(),key=r=>r.join(','),vertexKeys=new Set();let edges=0,generic=Z.generic;
 for(let i=0;i<L.length;i++){const seq=signSequence(L[i],L,i);if(seq.bad)return{bad:'duplicate arrangement lines',faces:[],total:0};generic&&=seq.generic;edges+=seq.rows.length;
  for(const r of seq.rows)for(const side of[-1,1]){const signs=r.slice();signs[i]=side;const k=key(signs);if(!cells.has(k))cells.set(k,{signs,edges:0});cells.get(k).edges++;}
  for(let j=i+1;j<L.length;j++){const[A,B,C]=L[i],[D,E,F]=L[j];let W=A*E-B*D;if(!W){generic=false;continue;}let X=C*E-B*F,Y=A*F-C*D;if(W<0n){W=-W;X=-X;Y=-Y;}const g=gcd(gcd(X,Y),W);vertexKeys.add(`${X/g},${Y/g},${W/g}`);}
 }
 const[x0,y0,x1,y1]=box,faces=Z.rows.map(r=>{const cell=cells.get(key(r))||{signs:r,edges:0};let poly=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];lines.forEach(([a,b,c],i)=>{poly=clipHalf(poly,-r[i]*a,-r[i]*b,-r[i]*c);});return{...cell,poly};});
 return{bad:null,faces,total:faces.reduce((s,f)=>s+f.edges,0),vertices:vertexKeys.size,edges,faceCount:lines.length?cells.size:1,generic:generic&&Z.groups.length===lines.length,insertedZoneTotal:Z.generic?faces.reduce((s,f)=>s+f.edges,0)+2*(Z.rows.length-1)+2*Z.rows.length:null};
}
