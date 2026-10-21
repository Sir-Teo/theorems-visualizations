import{solveDense}from'./ch04.shared.js';
export const packingOverlap=(k,d)=>{d=Math.abs(d);return k==='g'?Math.exp(-d*d/4):k==='l'?(1+d)*Math.exp(-d):Math.max(0,1-d/2);};
export const packingUtil=(k,x)=>k==='g'?Math.exp(-x*x/2):k==='l'?Math.exp(-Math.abs(x)):Math.abs(x)<=1?1:0;
export function packingMatrix(k,n,d){return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>packingOverlap(k,(i-j)*d)));}
export function packingCondition(M){const n=M.length,cols=Array.from({length:n},(_,j)=>solveDense(M,Array.from({length:n},(_,i)=>+(i===j))));if(cols.some(x=>!x))return Infinity;const norm=Math.max(...M.map(r=>r.reduce((s,x)=>s+Math.abs(x),0))),inv=Math.max(...M.map((_,i)=>cols.reduce((s,c)=>s+Math.abs(c[i]),0)));return norm*inv;}
export function packingSolve(M,K,condition=packingCondition(M)){const x=solveDense(M,K);if(!x||!Number.isFinite(condition)||condition*Number.EPSILON>1e-5)return{x:null,status:'unresolved',condition};const max=Math.max(...x.map(Math.abs),1),uncertainty=64*condition*Number.EPSILON*max;return{x,status:x.some(t=>Math.abs(t)<=uncertainty)?'unresolved':x.every(t=>t>0)?'feasible':'infeasible',condition};}
