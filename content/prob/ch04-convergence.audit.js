// Audited helpers for the probability convergence follow-up; no shared-helper changes.
export function criticalSurvival(kind,n) {
 const out=[1];for(let k=1;k<=n;k++){const s=out[k-1];out.push(kind==='binary'?s-s*s/2:kind==='geom'?s/(1+s):-Math.expm1(-s));}return out;
}
// Exact offspring draws for the three specified critical laws; no large-population approximation.
export function criticalPath(r,kind,n) {
 const Z=new Float64Array(n+1);Z[0]=1;
 for(let k=1;k<=n;k++){let sum=0;for(let j=0;j<Z[k-1];j++){
  if(kind==='binary')sum+=r()<.5?0:2;
  else if(kind==='geom')sum+=Math.floor(Math.log1p(-r())/Math.log(.5));
  else {let p=1,count=0;do{p*=r();count++;}while(p>Math.exp(-1));sum+=count-1;}
 }Z[k]=sum;}return Z;
}
export function exactDyadicTable(key,depth=12) {
 const F=key==='blow'?x=>2*Math.sqrt(x):key==='smooth'?x=>-Math.cos(2*Math.PI*x)/(2*Math.PI)+.3*x*x:key==='jump'?x=>Math.min(x,1/3)-.5*Math.max(0,Math.min(x,.7)-1/3)+2*Math.max(0,x-.7):x=>{let y=0;for(let k=0;k<7;k++)y+=Math.sin(2*Math.PI*3**k*x)/(2**k*2*Math.PI*3**k);return y;};
 return Array.from({length:depth+1},(_,n)=>Float64Array.from({length:2**n},(_,j)=>(F((j+1)/2**n)-F(j/2**n))*2**n));
}
export function spikeTailSup(a,M,n=1) {
 if(a>1)return Infinity;if(a===1)return 1;
 const first=Math.max(n,Math.floor(M**(1/a))+1);return first**(a-1);
}
export function hiddenCoinPosterior(delta,s) {
 const z=s*Math.log((.5+delta)/(.5-delta));return z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
}
// Convexity of x log(1+x) and Pareto stochastic ordering put the supremum at alpha0.
// Integration in t=log x; the omitted tail is bounded by a*exp(-b*T)*(T/b+1/b²+exp(-T)/(b+1)).
export function paretoXLogMoment(a,simpson) {
 const T=220,b=a-1,estimate=a*simpson(t=>Math.exp(-b*t)*(t+Math.log1p(Math.exp(-t))),0,T,32000);
 const remainder=a*Math.exp(-b*T)*(T/b+1/(b*b)+Math.exp(-T)/(b+1));return {estimate,remainder,upper:a/((a-1)*(a-1))+1};
}
export function dyadicErrors(key,n,means,f,samples=16384) {
 const cells=2**n;let sampledMax=0,l1=0;
 for(let i=0;i<samples;i++){const x=(i+.5)/samples,e=Math.abs(means[Math.min(cells-1,Math.floor(x*cells))]-f(x));sampledMax=Math.max(sampledMax,e);l1+=e/samples;}
 if(key==='blow') {l1=0;for(let j=0;j<cells;j++){const a=j/cells,b=(j+1)/cells,c=means[j],t=1/(c*c);l1+=2*Math.sqrt(t)-2*Math.sqrt(a)-c*(t-a)+c*(b-t)-2*Math.sqrt(b)+2*Math.sqrt(t);}}
 if(key==='jump') {l1=0;for(let j=0;j<cells;j++){const a=j/cells,b=(j+1)/cells,c=means[j],cuts=[a,...[1/3,.7].filter(x=>x>a&&x<b),b];for(let k=1;k<cuts.length;k++)l1+=(cuts[k]-cuts[k-1])*Math.abs(c-f((cuts[k]+cuts[k-1])/2));}}
 return {sampledMax,l1,exactL1:key==='blow'||key==='jump'};
}
