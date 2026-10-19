import {binomPmf} from './ch03.shared.js';
export function normalizedTransitionWeights(W){return W.map(row=>{const sum=row.reduce((a,b)=>a+b,0);return sum>0?row.map(x=>x/sum):row.map(()=>1/row.length);});}
export function transitionObservations(path,steps,n){const counts=Array.from({length:n},()=>Array(n).fill(0)),departures=Array(n).fill(0);for(let t=0;t<steps;t++){counts[path[t]][path[t+1]]++;departures[path[t]]++;}return {counts,departures};}
export function ehrenfestLaw(r,x0,n){let mu=new Array(r+1).fill(0);mu[x0]=1;for(let t=0;t<n;t++){const v=new Array(r+1).fill(0);for(let k=0;k<=r;k++){if(k>0)v[k-1]+=mu[k]*k/r;if(k<r)v[k+1]+=mu[k]*(1-k/r);}mu=v;}return mu;}
export function queueReferences(rho,kind){const c2=kind==='det'?0:1,a0=kind==='det'?Math.exp(-rho):1/(1+rho);return {a0,mean:rho<1?rho*rho*(1+c2)/(2*(1-rho)):Infinity,empty:rho<1?(1-rho)/a0:0};}
export const queueStartStep=(x,arrivals)=>Math.max(0,x+arrivals-1);
/** Exact ranges on [a,b), including infimum/supremum at excluded endpoints. */
export function targetRange(kind,a,b){
 if(kind==='sqrt')return [Math.sqrt(a),Math.sqrt(b)];
 if(kind==='ind'){const L=3/8,R=13/16;if(a>=L&&b<=R)return[1,1];return Math.max(a,L)<Math.min(b,R)?[0,1]:[0,0];}
 let lo=Math.min((1+Math.sin(2*Math.PI*a))/2,(1+Math.sin(2*Math.PI*b))/2),hi=Math.max((1+Math.sin(2*Math.PI*a))/2,(1+Math.sin(2*Math.PI*b))/2);
 for(const x of [.25,.75])if(x>=a&&x<=b){lo=Math.min(lo,x===.75?0:1);hi=Math.max(hi,x===.25?1:0);}return[lo,hi];
}
export function dyadicApproximation(kind,n){const m=2**n,ranges=Array.from({length:m},(_,k)=>targetRange(kind,k/m,(k+1)/m)),values=ranges.map(r=>r[0]);return{values,error:Math.max(...ranges.map(r=>r[1]-r[0])),coefficients:values.map((g,k)=>g-(values[k+1]??0))};}
export function simpleReflectionLaw(n,a){const h=Math.ceil(a-1e-12),pmf=binomPmf(n,.5);let ge=0,gt=0;pmf.forEach((p,k)=>{const x=2*k-n;if(x>=h)ge+=p;if(x>h)gt+=p;});return{h,ge,gt,max:ge+gt};}
export function finiteReturnProbability(P,y,T=300){let mass=P.map((_,x)=>+(x===y)),returned=0;for(let n=1;n<=T;n++){const next=P.map(()=>0);for(let i=0;i<P.length;i++)for(let j=0;j<P.length;j++){const w=mass[i]*P[i][j];if(j===y)returned+=w;else next[j]+=w;}mass=next;}return{returned,survival:mass.reduce((a,b)=>a+b,0)};}
