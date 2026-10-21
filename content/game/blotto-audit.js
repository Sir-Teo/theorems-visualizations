import {solveZS} from './ch03.shared.js';
import {lpGameCertificate} from './minimax-audit.js';
const cache=new Map();
export function blottoAllocations(N){if(!Number.isInteger(N)||N<3||N>12)throw new RangeError('Integer budget3…12 required');const a=[];for(let x=0;x<=N;x++)for(let y=0;y<=N-x;y++)a.push([x,y,N-x-y]);return a;}
export const blottoPayoff=(x,y)=>x.reduce((s,z,k)=>s+.5*Math.sign(z-y[k]),0);
export const blottoPoint=(a,N)=>[(a[1]+a[2]/2)/N,Math.sqrt(3)/2*a[2]/N];
export function blottoNearest(N,x,y){if(!Number.isFinite(x)||!Number.isFinite(y))throw new RangeError('Finite point required');let best=0,d=Infinity;const a=blottoAllocations(N);a.forEach((p,i)=>{const q=blottoPoint(p,N),e=(q[0]-x)**2+(q[1]-y)**2;if(e<d){d=e;best=i;}});return{index:best,point:blottoPoint(a[best],N)};}
export function blottoPointValid(N,p){if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))return false;const q=blottoNearest(N,...p).point;return p[0]===q[0]&&p[1]===q[1];}
export function blottoGame(N){if(cache.has(N))return cache.get(N);const allocations=blottoAllocations(N),A=allocations.map(x=>allocations.map(y=>blottoPayoff(x,y))),raw=solveZS(A);
  // Remove numerical dust, then check the actual displayed feasible vectors again.
  const clean=q=>{const a=q.map(x=>Math.abs(x)<1e-10?0:x),s=a.reduce((x,y)=>x+y,0);return a.map(x=>x/s);},solution={...raw,x:clean(raw.x),y:clean(raw.y)},certificate=lpGameCertificate(A,solution),payoffs=allocations.map((_,j)=>solution.x.reduce((s,x,i)=>s+x*A[i][j],0)),rowMin=A.map(a=>Math.min(...a)),value=0;
  const result={N,allocations,A,solution,certificate,payoffs,rowMin,value,pureSecurity:Math.max(...rowMin),support:solution.x.flatMap((p,i)=>p>0?[{index:i,allocation:allocations[i],p}]:[])};cache.set(N,result);return result;
}
export function blottoSelection(N,index,mode='pure'){const g=blottoGame(N);if(!Number.isInteger(index)||index<0||index>=g.allocations.length||!['pure','mix'].includes(mode))throw new RangeError('Valid allocation index and strategy mode required');const payoffs=mode==='pure'?g.A[index]:g.payoffs;return{...g,index,mode,selected:g.allocations[index],payoffs,worst:Math.min(...payoffs),best:Math.max(...payoffs),worstReply:payoffs.indexOf(Math.min(...payoffs))};}
