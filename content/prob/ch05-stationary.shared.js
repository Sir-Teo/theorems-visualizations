// Finite calculations for the source-audited stationary-measure examples.
export function balancedRing(forward,g=.3) {
 const lo=Math.log(.1),hi=Math.log(.65),target=forward.length*Math.log(g),logs=forward.map(Math.log);
 let a=-10,b=10;for(let k=0;k<80;k++){const m=(a+b)/2,s=logs.reduce((s,x)=>s+Math.max(lo,Math.min(hi,x+m)),0);if(s<target)a=m;else b=m;}
 return logs.map(x=>Math.exp(Math.max(lo,Math.min(hi,x+(a+b)/2))));
}
export function ringModel(forward,g=.3) {
 const n=forward.length,P=forward.map((f,i)=>Array.from({length:n},(_,j)=>j===(i+1)%n?f:j===(i+n-1)%n?g:j===i?1-f-g:0));
 return {P,forward:forward.reduce((a,x)=>a*x,1),backward:g**n};
}
export function finiteReturnSample(cum,base,r,cap=100000) {
 let state=base,T=0;do{const row=cum[state],u=r();let j=0;while(j<row.length-1&&row[j]<u)j++;state=j;T++;}while(state!==base&&T<cap);
 return {T,censored:state!==base};
}
/** Reflecting 0->1 walk: f(2n)=Catalan(n-1) p^(n-1)q^n.
 * Tail series is summed backwards; its omitted mass has a geometric upper bound.
 * At p=1/2 the central-binomial survival formula avoids a slowly converging series.
 */
export function reflectingReturnLaw(p,cap=5000) {
 const q=1-p,survival=new Float64Array(cap+1),pmf=new Float64Array(cap+1),returnProbability=p<=.5?1:q/p;
 let remainder=0;
 if(p===.5){let u=1;for(let t=0;t<=cap;t++){if(t>0&&t%2===0)u*=(t-1)/t;survival[t]=u;}for(let t=2;t<=cap;t+=2)pmf[t]=survival[t-1]-survival[t];}
 else{
  const fs=[0,q],ratio=4*p*q;let n=1,next=q*p*q;
  while(n<Math.ceil(cap/2)||next/(1-ratio)>1e-18){if(n>=200000)break;fs.push(next);n++;next*=((4*n-2)/(n+1))*p*q;}
  remainder=next/(1-ratio);let tail=1-returnProbability;
  for(let t=2*n;t>=0;t--){if(t<=cap)survival[t]=tail;if(t>0&&t%2===0){if(t<=cap)pmf[t]=fs[t/2];tail+=fs[t/2];}}
 }
 let cappedMean=0;for(let t=0;t<cap;t++)cappedMean+=survival[t];
 return {pmf,survival,returnProbability,cappedMean,remainder,mean:p<.5?2*q/(1-2*p):Infinity,classification:p<.5?'positive recurrent':p===.5?'null recurrent':'transient'};
}
