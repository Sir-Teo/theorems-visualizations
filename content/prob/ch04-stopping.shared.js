// Exact finite models used by the stopping-time/source verification follow-up.
export const gamblingSystems = {
 flat: {l:'constant stake 1',H:()=>1},
 dbl: {l:'double after a loss (cap 8)',H:(xi,n)=>{let h=1;for(let m=2;m<=n;m++)h=xi[m-2]<0?Math.min(8,2*h):1;return h;}},
 chase: {l:'raise after wins (cap 8)',H:(xi,n)=>{let h=1;for(let m=1;m<n;m++)h=xi[m-1]>0?Math.min(8,h+1):1;return h;}},
 peek: {l:'peek at round $n$',H:(xi,n)=>xi[n-1]>0?2:0},
};
/** Exhaust all 2^N outcomes: equal past must imply equal round-n stakes. */
export function predictableFailures(H,N=12){
 const seen=Array.from({length:N},()=>new Map()),bad=new Set();
 for(let mask=0;mask<2**N;mask++){
  const xi=Array.from({length:N},(_,j)=>mask&(1<<j)?1:-1);
  for(let n=1;n<=N;n++){const past=mask&((1<<(n-1))-1),h=H(xi,n),m=seen[n-1];if(m.has(past)&&m.get(past)!==h)bad.add(n);else m.set(past,h);}
 }
 return [...bad].sort((a,b)=>a-b);
}
/** Exact finite-horizon walk law; state is (position, currently holding an upcrossing bet). */
export function exactUpcrossingWalk(N,p,a,b){
 if(!(a<b))throw new Error('upcrossing band must have a < b');
 const off=N+1,sz=2*N+3;let mass=[new Float64Array(sz),new Float64Array(sz)];mass[0<=a?1:0][off]=1;
 const EU=[0],bound=[0];let count=0;
 for(let n=1;n<=N;n++){
  const next=[new Float64Array(sz),new Float64Array(sz)];let posPart=0;
  for(let x=-(n-1);x<=n-1;x+=2)for(let h=0;h<2;h++)for(const [d,q]of[[1,p],[-1,1-p]]){
   const w=mass[h][off+x]*q,y=x+d;if(!w)continue;let held=h;
   if(h&&y>=b){count+=w;held=0;}else if(!h&&y<=a)held=1;
   next[held][off+y]+=w;posPart+=w*Math.max(y-a,0);
  }
  mass=next;EU.push(count);bound.push((posPart-Math.max(-a,0))/(b-a));
 }
 return {EU,bound};
}
export function doobWalkDecomposition(S,g,p){
 const n=S.length-1,Xs=new Float64Array(n+1),As=new Float64Array(n+1),Ms=new Float64Array(n+1);Xs[0]=g(S[0]);Ms[0]=Xs[0];
 for(let m=1;m<=n;m++){const s=S[m-1];As[m]=As[m-1]+p*g(s+1)+(1-p)*g(s-1)-g(s);Xs[m]=g(S[m]);Ms[m]=Xs[m]-As[m];}
 return {Xs,As,Ms};
}
/** Beta-binomial exact finite urn law; rising products avoid reliance on the Beta limit. */
export function polyaFiniteLaw(b,r,n){
 let p0=1;for(let j=0;j<n;j++)p0*=(r+j)/(b+r+j);
 const pmf=[p0];for(let k=0;k<n;k++)pmf.push(pmf[k]*(n-k)/(k+1)*(b+k)/(r+n-k-1));
 const total=pmf.reduce((s,x)=>s+x,0);for(let k=0;k<=n;k++)pmf[k]/=total;
 let acc=0;const cdf=pmf.map(x=>(acc+=x));
 const support=pmf.map((_,k)=>(b+k)/(b+r+n));
 const F=x=>{const k=Math.floor(x*(b+r+n)-b+1e-10);return k<0?0:k>=n?1:cdf[k];};
 const hist=(bins=40)=>{const counts=new Array(bins).fill(0);pmf.forEach((p,k)=>counts[Math.min(bins-1,Math.floor(support[k]*bins))]+=p);return counts;};
 return {pmf,cdf,support,F,hist,mean:b/(b+r),variance:b*r*n/((b+r)**2*(b+r+1)*(b+r+n))};
}
/** Supremum ECDF error against a finite distribution, including both sides of every atom. */
export function discreteKolmogorov(values,law){
 const sorted=[...values].sort((a,b)=>a-b);let j=0,ks=0,prev=0;
 law.support.forEach((x,k)=>{while(j<sorted.length&&sorted[j]<x-1e-12)j++;ks=Math.max(ks,Math.abs(j/sorted.length-prev));while(j<sorted.length&&sorted[j]<=x+1e-12)j++;ks=Math.max(ks,Math.abs(j/sorted.length-law.cdf[k]));prev=law.cdf[k];});return ks;
}
export function stoppingRules(T=40){return {
 hit4:{l:'first hit of $+4$ by $T$',N:p=>{const k=p.findIndex(x=>x>=4);return k<0?Infinity:k;}},
 back:{l:'first time $\\le-2$ after $\\ge2$ (by $T$)',N:p=>{let up=false;for(let i=0;i<=T;i++){if(p[i]>=2)up=true;if(up&&p[i]<=-2)return i;}return Infinity;}},
 last0:{l:'last visit to $0$ in $[0,T]$',N:p=>{let k=0;for(let i=0;i<=T;i++)if(p[i]===0)k=i;return k;}},
 argmax:{l:'first time of the maximum on $[0,T]$',N:p=>{let k=0;for(let i=0;i<=T;i++)if(p[i]>p[k])k=i;return k;}},
};}
