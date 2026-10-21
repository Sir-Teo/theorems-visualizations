// Eigenvalue illustrations. Small general/symmetric eigensolvers and SVD use the atlas math library.
export * from './ch01.shared.js';
import * as M from '../../assets/js/viz/math.js';
import {mm,tp,eye,fro,msub,mv,dot,rot} from './ch01.shared.js';
export const sliderOptions={step:'any',decimals:4};
export const integerOptions={int:true,step:1};
export const values=A=>M.eig(A,{vectors:false}).values.map(z=>[z.re,z.im]);
export const symmetricValues=A=>M.eigSym(A).values.slice().sort((a,b)=>a-b);
export const norm2=A=>M.svd(A).S[0];
export const residual=(A,x,l)=>Math.hypot(...mv(A,x).map((y,i)=>y-l*x[i]));
export const similar=(Q,T)=>mm(mm(Q,T),tp(Q));
export function eigenExample(kind,k,gap){return kind==='distinct'?[[1,k],[0,1+gap]]:kind==='defective'?[[1,k],[0,1]]:kind==='scalar'?[[1,0],[0,1]]:[[0,-1],[1,0]];}
export function schurExample(theta,k,kind){const Q=rot(theta),T=kind==='real'?[[1,k],[0,2]]:[[0,-1],[1,0]];return{Q,T,A:similar(Q,T)};}
export function gershgorinModel(t){const A=[[-2,t,-.4*t],[-.6*t,0,.8*t],[.5*t,-t,2]],discs=A.map((row,i)=>({x:row[i],r:row.reduce((s,x,j)=>s+(j===i?0:Math.abs(x)),0)}));return{A,discs,eigen:values(A)};}
export function bauerFike(k,delta,theta){const z=Math.hypot(k,1),V=[[1,k/z],[0,1/z]],A=[[1,k],[0,2]],E=[[delta*Math.cos(theta),0],[delta*Math.sin(theta),0]],B=A.map((r,i)=>r.map((x,j)=>x+E[i][j])),s=M.svd(V).S,kappa=s[0]/s[1];return{A,E,B,V,kappa,radius:kappa*norm2(E),eigen:values(B)};}
export function jordanSplit(n,eps){const A=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(j===i+1)));A[n-1][0]=eps;const radius=eps**(1/n),roots=Array.from({length:n},(_,j)=>[radius*Math.cos(2*Math.PI*j/n),radius*Math.sin(2*Math.PI*j/n)]);return{A,radius,roots,eigen:values(A)};}
/** Stable 2x2 complex triangular singular value: sigma_min = |det| / sigma_max. */
export function sigmaMin(x,y,k){const a=(x+1)**2+y*y,b=(x-1)**2+y*y,F=a+b+k*k,det2=a*b,max=Math.sqrt((F+Math.sqrt(Math.max(0,F*F-4*det2)))/2);return max?Math.sqrt(det2)/max:0;}
export function transient(k,t){const a=Math.exp(-t),b=Math.exp(-2*t);return[[a,k*(a-b)],[0,b]];}
export function companion(c){return[[0,0,0,0,c],[1,0,0,0,1],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0]];}
export const polynomial=(x,c)=>x**5-x-c;
export function bisect(c,steps){let lo=1,hi=2;const history=[];for(let j=0;j<=steps;j++){const mid=(lo+hi)/2;history.push({lo,hi,mid,residual:Math.abs(polynomial(mid,c))});if(polynomial(mid,c)>0)hi=mid;else lo=mid;}return history;}
export function symmetricPerturb(delta,theta,kind){const a=.63,b=.38,Q=mm([[Math.cos(a),-Math.sin(a),0],[Math.sin(a),Math.cos(a),0],[0,0,1]],[[1,0,0],[0,Math.cos(b),-Math.sin(b)],[0,Math.sin(b),Math.cos(b)]]),A=similar(Q,[[-2,0,0],[0,0,0],[0,0,2]]),R=[[Math.cos(theta),-Math.sin(theta),0],[Math.sin(theta),Math.cos(theta),0],[0,0,1]],E=similar(R,[[delta,0,0],[0,kind==='positive'?0:-delta,0],[0,0,0]]),B=A.map((r,i)=>r.map((x,j)=>x+E[i][j]));return{A,E,B,old:symmetricValues(A),next:symmetricValues(B),bound:norm2(E)};}
export function planeExtrema(theta){const u=[Math.cos(theta),0,Math.sin(theta)],v=[0,1,0],A=[[-2,0,0],[0,.5,0],[0,0,3]],W=tp([u,v]),C=mm(mm(tp(W),A),W),ev=symmetricValues(C);return{u,v,A,W,C,min:ev[0],max:ev[1]};}
export function principal(A,index){return A.filter((_,i)=>i!==index).map(row=>row.filter((_,j)=>j!==index));}
export function interlacing(t,index){const A=[[-2,t,0,0],[t,-.5,t,0],[0,t,1,t],[0,0,t,2.5]],B=principal(A,index),C=principal(B,Math.min(index,B.length-1));return{A,B,C,levels:[symmetricValues(A),symmetricValues(B),symmetricValues(C)]};}
/** Full two-sided Householder similarities, with Q accumulated; no entries are overwritten to fake zeros. */
export function hessenberg(A){let H=A.map(r=>r.slice()),Q=eye(A.length);const records=[{H:H.map(r=>r.slice()),Q:Q.map(r=>r.slice())}],n=A.length;for(let k=0;k<n-2;k++){const x=H.slice(k+1).map(r=>r[k]),length=Math.hypot(...x);if(length){x[0]+=Math.sign(x[0]||1)*length;const scale=Math.hypot(...x),v=x.map(t=>t/scale),P=eye(n);for(let i=k+1;i<n;i++)for(let j=k+1;j<n;j++)P[i][j]-=2*v[i-k-1]*v[j-k-1];H=mm(mm(P,H),P);Q=mm(Q,P);}records.push({H:H.map(r=>r.slice()),Q:Q.map(r=>r.slice())});}return records;}
export function reductionInput(kind,t){const A=[[2,1,t,-1],[1,3,2,.5],[t,2,-1,1],[-1,.5,1,1]];if(kind==='general'){A[1][0]=-1;A[3][1]=1.5;A[2][3]=-2;}return A;}
export function reductionDiagnostics(A,H,Q){const scale=Math.max(1,fro(A)),n=A.length;return{similarity:fro(msub(mm(A,Q),mm(Q,H)))/scale,orthogonality:fro(msub(mm(tp(Q),Q),eye(n))),below:Math.hypot(...H.flatMap((r,i)=>r.filter((_,j)=>i>j+1))),traceError:Math.abs(A.reduce((s,r,i)=>s+r[i],0)-H.reduce((s,r,i)=>s+r[i],0))};}
export const scalarRayleigh=(A,x)=>dot(x,mv(A,x))/dot(x,x);
