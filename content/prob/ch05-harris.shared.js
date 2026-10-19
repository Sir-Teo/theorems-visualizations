// Durrett §5.8: augmented kernel Q and recovery kernel V, not the alternative residual-kernel split.
import {PHI,phi,vecM,matMulS} from './ch05-z.shared.js';
export {PHI,phi,vecM,matMulS};
export function harrisSplit(P,inA,weight=1){
 const K=P.length,common=Array.from({length:K},(_,j)=>Math.min(...P.filter((_,i)=>inA[i]).map(row=>row[j]))*weight),eps=common.reduce((a,b)=>a+b),rho=common.map(x=>x/eps);
 if(!(eps>0&&eps<=1+1e-12))throw Error('A nonempty minorization of mass at most one is required');
 const U=P.map((row,i)=>[...row.map((p,j)=>p-(inA[i]?common[j]:0)),inA[i]?eps:0]);
 const Q=[...U,vecM(rho,U)],V=Array.from({length:K},(_,i)=>Array.from({length:K},(_,j)=>i===j?1:0));V.push(rho);
 return {Q,V,U,rho,eps,inA};
}
export const intervalSplit=(g,lo,hi)=>harrisSplit(g.P,g.xs.map(x=>x>=lo&&x<=hi));
export function solveLinear(A,b){
 const M=A.map((row,i)=>[...row,b[i]]),n=b.length;
 for(let j=0;j<n;j++){let k=j;for(let i=j+1;i<n;i++)if(Math.abs(M[i][j])>Math.abs(M[k][j]))k=i;[M[j],M[k]]=[M[k],M[j]];
  if(Math.abs(M[j][j])<1e-15)throw Error('Singular occupation system');const p=M[j][j];for(let k=j;k<=n;k++)M[j][k]/=p;
  for(let i=0;i<n;i++)if(i!==j){const f=M[i][j];for(let k=j;k<=n;k++)M[i][k]-=f*M[j][k];}}
 return M.map(row=>row[n]);
}
export function cycleMeasure(sp){
 const {Q,V}=sp,K=Q.length-1;
 const u=[...solveLinear(Array.from({length:K},(_,i)=>Array.from({length:K},(_,j)=>(i===j?1:0)-Q[j][i])),Q[K].slice(0,K)),1];
 const mu=vecM(u,V),ET=u.reduce((a,b)=>a+b);
 return {u,mu,ET,pi:mu.map(x=>x/ET)};
}
export function completeCycles(sp,target,rng,cap=500000){
 const {Q,V}=sp,K=Q.length-1,total=new Array(K+1).fill(0);let buffer=new Array(K+1).fill(0),z=K,steps=0,completedSteps=0,completed=0,length=0;
 while(completed<target&&steps<cap){buffer[z]++;length++;steps++;const row=Q[z];let u=rng(),next=row.length-1;for(let j=0;j<row.length;j++){u-=row[j];if(u<0){next=j;break;}}z=next;
  if(z===K){buffer.forEach((c,i)=>total[i]+=c);completed++;completedSteps+=length;buffer.fill(0);length=0;}}
 const projected=vecM(total,V),mu=projected.map(x=>completed?x/completed:0),ET=completed?completedSteps/completed:0;
 return {mu,pi:mu.map(x=>ET?x/ET:0),ET,completed,steps,discarded:length,capped:completed<target};
}
export function analyticMinor(a,lo,hi){
 const m0=a*lo,m1=a*hi,center=(m0+m1)/2,d=Math.abs(m1-m0)/2,eps=2*PHI(-d);
 const density=y=>phi(Math.abs(y-center)+d);
 const sample=r=>{const sign=r()<.5?-1:1;let z;do{z=r.normal();}while(z<d);return center+sign*(z-d);};
 return {a,lo,hi,center,d,eps,density,sample};
}
export function exactHarrisStep(x,m,r){
 if(x>=m.lo&&x<=m.hi){if(r()<m.eps)return [m.sample(r),true];
  for(;;){const y=m.a*x+r.normal(),logRatio=.5*((y-m.a*x)**2-(Math.abs(y-m.center)+m.d)**2),accept=Math.max(0,-Math.expm1(Math.min(0,logRatio)));if(r()<accept)return [y,false];}}
 return [m.a*x+r.normal(),false];
}
export const escapeSurvival=(start,n)=>start===0?0:(start-1)*(start+n)/(start*(start+n-1));
export function gaussianTV(m1,v1,m2,v2){
 if(v1===0||v2===0)return v1===v2&&m1===m2?0:1;
 if(v1===v2){return Math.max(0,2*PHI(Math.abs(m1-m2)/(2*Math.sqrt(v1)))-1);}
 const A=1/v2-1/v1,B=2*(m1/v1-m2/v2),C=m2*m2/v2-m1*m1/v1+Math.log(v2/v1),D=Math.max(0,B*B-4*A*C),q=-.5*(B+(B>=0?1:-1)*Math.sqrt(D));
 const roots=(q===0?[-B/(2*A)]:[q/A,C/q]).sort((a,b)=>a-b),edges=[-Infinity,...roots,Infinity];let sum=0;
 const cdf=(x,m,v)=>PHI((x-m)/Math.sqrt(v));for(let i=1;i<edges.length;i++)sum+=Math.abs(cdf(edges[i],m1,v1)-cdf(edges[i-1],m1,v1)-cdf(edges[i],m2,v2)+cdf(edges[i-1],m2,v2));
 return Math.min(1,sum/2);
}
export function exponentialDifferenceTail(kind,lambda,t){
 if(kind==='negative')return t<1?(1-t+(1-Math.exp(-lambda*(t+2)))/lambda)/3:Math.exp(-lambda*(t-1))*(-Math.expm1(-3*lambda))/(3*lambda);
 const mass=kind==='constant'?Math.exp(-.7*lambda):kind==='uniform'?-Math.expm1(-3*lambda)/(3*lambda):(1+Math.exp(-2*lambda))/2;
 return mass*Math.exp(-lambda*t);
}
