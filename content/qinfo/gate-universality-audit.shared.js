// Scoped to qinfo4.2–4.4. Complex matrices use [real,imaginary] entries.
import {mmul,adj,cplx,kronC,GATE,gate2,qmul,qapply,QG} from './ch04.shared.js';
export const identity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>[+(i===j),0]));
const cp=A=>A.map(r=>r.map(z=>z.slice())),abs=z=>Math.hypot(...z),phase=(z,a)=>[z[0]*Math.cos(a)-z[1]*Math.sin(a),z[0]*Math.sin(a)+z[1]*Math.cos(a)];
const mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
export const maxError=(A,B)=>Math.max(...A.flatMap((r,i)=>r.map((z,j)=>Math.hypot(z[0]-B[i][j][0],z[1]-B[i][j][1]))));
export const rz=a=>[[[Math.cos(a/2),-Math.sin(a/2)],[0,0]],[[0,0],[Math.cos(a/2),Math.sin(a/2)]]];
export const ry=a=>cplx([[Math.cos(a/2),-Math.sin(a/2)],[Math.sin(a/2),Math.cos(a/2)]]);
export const local=(U,q)=>q===0?kronC(U,identity(2)):kronC(identity(2),U);
const single=(U,q)=>({kind:'one',q,U:local(U,q)}),cx=(c,t)=>({kind:'CNOT',c,t,U:gate2(`CX${c}${t}`)});
export function gateProduct(gates){let U=identity(4);for(const g of gates)U=mmul(g.U,U);return U;}
// Barenco Lemmas4.3,5.1,5.2: ABC=I, AXBXC=exp(-i delta)U.
export function controlledCircuit(U,c,t,bit=1){
 const det=sub(mul(U[0][0],U[1][1]),mul(U[0][1],U[1][0])),delta=Math.atan2(det[1],det[0])/2,V=U.map(r=>r.map(z=>phase(z,-delta)));
 const th=2*Math.atan2(abs(V[1][0]),abs(V[0][0]));let a,g;
 if(abs(V[1][0])<1e-13){a=-2*Math.atan2(V[0][0][1],V[0][0][0]);g=0;}
 else if(abs(V[0][0])<1e-13){a=2*Math.atan2(V[1][0][1],V[1][0][0]);g=0;}
 else{const p=Math.atan2(V[1][0][1],V[1][0][0]),q=Math.atan2(V[0][0][1],V[0][0][0]);a=p-q;g=-p-q;}
 const A=mmul(rz(a),ry(th/2)),B=mmul(ry(-th/2),rz(-(a+g)/2)),C=rz((g-a)/2),E=[[[1,0],[0,0]],[[0,0],[Math.cos(delta),Math.sin(delta)]]];
 const out=[single(C,t),cx(c,t),single(B,t),cx(c,t),single(A,t),single(E,c)];
 return bit?out:[single(GATE.X(),c),...out,single(GATE.X(),c)];
}
export function twoLevelCircuit(U,i,j){
 const d=i^j,perm=d===3?cx(0,1):null,map=k=>perm?(k&2)?k^1:k:k,ii=map(i),jj=map(j),t=(ii^jj)===2?0:1,c=1-t,mask=1<<(1-t),bit=(ii>>(1-c))&1;
 const B=[[U[i][i],U[i][j]],[U[j][i],U[j][j]]],W=(ii&mask)?[[B[1][1],B[1][0]],[B[0][1],B[0][0]]]:B,g=controlledCircuit(W,c,t,bit);
 return perm?[perm,...g,perm]:g;
}
export function diagonalCircuit(D){
 const p=D.map((r,i)=>Math.atan2(r[i][1],r[i][0])),g=p.reduce((s,x)=>s+x,0)/4,a=(-p[0]-p[1]+p[2]+p[3])/2,b=(-p[0]+p[1]-p[2]+p[3])/2,c=(-p[0]+p[1]+p[2]-p[3])/2;
 const phaseI=identity(2).map(r=>r.map(z=>phase(z,g)));
 return[single(phaseI,0),single(rz(a),0),single(rz(b),1),cx(0,1),single(rz(c),1),cx(0,1)];
}
export function eliminate4(U){
 let A=cp(U);const steps=[{A:cp(A)}],gl=[];
 for(let c=0;c<3;c++)for(let r=3;r>c;r--){
  const a=A[r-1][c],b=A[r][c],n=Math.hypot(abs(a),abs(b));if(abs(b)<1e-12)continue;
  const G=identity(4);G[r-1][r-1]=[a[0]/n,-a[1]/n];G[r-1][r]=[b[0]/n,-b[1]/n];G[r][r-1]=[-b[0]/n,-b[1]/n];G[r][r]=[a[0]/n,a[1]/n];A=mmul(G,A);
  const gates=twoLevelCircuit(adj(G),r-1,r),d=((r-1)^r)===3?2:1;gl.push({G,i:r-1,j:r,d,gates,cost:gates.filter(g=>g.kind==='CNOT').length});steps.push({A:cp(A),pair:[r-1,r],col:c});
 }
 let P=identity(4);for(const g of gl)P=mmul(P,adj(g.G));
 const diag=diagonalCircuit(A),gates=[...diag,...gl.slice().reverse().flatMap(g=>g.gates)];
 return{steps,gl,D:A,err:maxError(mmul(P,A),U),gates,synthesisError:maxError(gateProduct(gates),U),diagonalCost:2};
}
const orbitCache=new Map(),qkey=q=>{const s=(q.find(x=>Math.abs(x)>1e-9)||1)<0?-1:1;return q.map(x=>Math.round(s*x*1e10)+0).join(',');},pkey=p=>p.map(x=>Math.round(x*1e10)+0).join(',');
// Rounded numerical deduplication, not an exact algebraic distinctness certificate.
// A cap discards the entire unfinished layer: every exposed layer is complete.
export function stateOrbit(gens,cap=60000,maxDepth=30){
 const key=`${gens}|${cap}|${maxDepth}`;if(orbitCache.has(key))return orbitCache.get(key);
 const seen=new Set([qkey([1,0,0,0])]),states=new Map([[pkey([0,0,1]),{p:[0,0,1],len:0}]]),layers=[{rot:1,states:1}];let frontier=[[1,0,0,0]],capped=false,closed=false;
 for(let len=1;len<=maxDepth;len++){
  const layer=new Map();outer:for(const q of frontier)for(const g of gens){const a=qmul(QG[g],q),norm=Math.hypot(...a),nq=a.map(x=>x/norm),k=qkey(nq);if(seen.has(k)||layer.has(k))continue;layer.set(k,nq);if(seen.size+layer.size>cap){capped=true;break outer;}}
  if(capped)break;if(!layer.size){closed=true;break;}
  frontier=[...layer.values()];for(const[k,q]of layer){seen.add(k);const p=qapply(q,[0,0,1]),pk=pkey(p);if(!states.has(pk))states.set(pk,{p,len});}layers.push({rot:seen.size,states:states.size});
 }
 const out={pts:[...states.values()],layers,capped,closed,cap};orbitCache.set(key,out);return out;
}
export function orbitErrors(O,target){const best=O.layers.map(()=>Math.PI);for(const p of O.pts){const a=p.p,b=target,cross=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],d=Math.atan2(Math.hypot(...cross),a.reduce((s,x,i)=>s+x*b[i],0));best[p.len]=Math.min(best[p.len],d);}for(let i=1;i<best.length;i++)best[i]=Math.min(best[i],best[i-1]);return best;}
