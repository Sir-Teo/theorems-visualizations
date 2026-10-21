// Scoped mathematical helpers for source-reviewed one-locus selection examples.
export const logOdds=p=>p===0?-Infinity:p===1?Infinity:Math.log(p)-Math.log1p(-p);
export const logistic=z=>z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
export function haploidFrequency(p0,s,t){if(!(s>-1&&p0>=0&&p0<=1&&t>=0))throw new RangeError('positive relative fitness and frequency/time domain required');return p0===0?0:p0===1?1:logistic(logOdds(p0)+t*Math.log1p(s));}
export function haploidDrift(r,binomial,N,p0,s,T){const initial=Math.max(0,Math.min(N,Math.round(N*p0))),path=[initial/N];let k=initial;for(let t=1;t<=T;t++){if(k>0&&k<N)k=binomial(r,N,(1+s)*k/(N+s*k));path.push(k/N);}return{initial,path};}
export function meanFitness(p,W){return p.reduce((s,x,i)=>s+x*W[i].reduce((q,w,j)=>q+w*p[j],0),0);}
export function selectionStep(p,W){const marginal=W.map(row=>row.reduce((s,w,j)=>s+w*p[j],0)),mean=p.reduce((s,x,i)=>s+x*marginal[i],0);if(!(mean>0))throw new RangeError('positive mean fitness required');return p.map((x,i)=>x*marginal[i]/mean);}
export function selectionCertificate(p,W){const mean=meanFitness(p,W),next=selectionStep(p,W),after=meanFitness(next,W),KL=next.reduce((s,x,i)=>x===0?s:s+x*Math.log(x/p[i]),0);return{next,mean,after,change:after-mean,KL,logRatio:Math.log(after/mean)};}
export function overdominance(s,t){if(!(s>0&&s<1&&t>0&&t<1))throw new RangeError('strictly positive homozygote viabilities and disadvantages required');const h=s*t/(s+t);return{p:t/(s+t),h,lambda:(1-2*h)/(1-h),peak:1-h};}
export function fluctuationMeans(a,b,pi){if(!(a>0&&b>0&&pi>=0&&pi<=1))throw new RangeError('positive fitnesses required');const A=pi*a+(1-pi)*b,m=pi*Math.log(a)+(1-pi)*Math.log(b);return{A,m,G:Math.exp(m),gap:Math.log(A)-m,direction:Math.abs(m)<1e-12?'zero':m>0?'increase':'decrease'};}
