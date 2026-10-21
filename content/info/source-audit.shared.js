import {lbinPmf,lse2} from './ch03.shared.js';

// Randomized Neyman–Pearson test; acceptance is a probability for each count.
// PMFs are normalized in the log domain to remove accumulated log-factorial drift.
export function npBernoulli(n,p,q,epsilon){
  const lp=Array.from({length:n+1},(_,k)=>lbinPmf(n,k,p));
  const lq=Array.from({length:n+1},(_,k)=>lbinPmf(n,k,q));
  const zp=lse2(lp),zq=lse2(lq),P=lp.map(x=>2**(x-zp)),Q=lq.map(x=>2**(x-zq));
  const f=Array(n+1).fill(0),target=1-epsilon;
  let boundary=null;
  if(p===q){f.fill(target);boundary={k:null,probability:target};}
  else{
    let accepted=0;
    for(let j=0;j<=n;j++){
      const k=p<q?j:n-j;
      const remaining=target-accepted;
      if(P[k]>=remaining){f[k]=Math.max(0,Math.min(1,remaining/P[k]));boundary={k,probability:f[k]};break;}
      f[k]=1;accepted+=P[k];
    }
  }
  const logBeta=p===q?Math.log2(target):lse2(lq.map((x,k)=>f[k]>0?x-zq+Math.log2(f[k]):-Infinity));
  return {P,Q,f,boundary,logBeta,alpha:P.reduce((s,x,k)=>s+x*(1-f[k]),0),beta:2**logBeta};
}
