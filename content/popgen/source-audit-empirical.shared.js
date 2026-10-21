export function sickleStep(q,s,t){const p=1-q,mean=p*p*(1-s)+2*p*q+q*q*(1-t);if(!(q>=0&&q<=1&&s>=0&&s<1&&t>=0&&t<=1&&mean>0))throw new RangeError('supported genotype fitness and positive mean required');return q*(p+q*(1-t))/mean;}
export function sickleHistory(q,s,t,T=100){const out=[[0,q]];for(let k=1;k<=T;k++){q=sickleStep(q,s,t);out.push([k,q]);}return out;}

export const melanicFraction=p=>p*(2-p);
export function mothPath(f0,s,falling=false,T=55){let p=1-Math.sqrt(1-f0);const out=[p];for(let k=0;k<T;k++){const q=1-p,a=falling?1-s:1,mean=falling?1-s*p*(2-p):1-s*q*q;p=(p*p*a+p*q*a)/mean;out.push(p);}return out;}
export function mothTarget(f0,target,T,falling=false){let lo=0,hi=.95;const f=s=>melanicFraction(mothPath(f0,s,falling,T).at(-1));if((f(lo)-target)*(f(hi)-target)>0)throw new RangeError('target not bracketed');for(let k=0;k<70;k++){const mid=(lo+hi)/2;if((f(mid)<target)!==falling)lo=mid;else hi=mid;}return(lo+hi)/2;}
/** Original Cook et al.2012 Table2 (printed611), labels as printed, not shifted Figure1 years. */
export const MOTH_PREDATION=[[2002,706,101,162,31],[2003,731,82,204,24],[2004,751,53,128,17],[2005,763,58,166,18],[2006,774,34,145,6],[2007,797,14,158,4]];
export function mothProfile(r){if(!(r>0))return{logL:-Infinity,rows:[]};let logL=0;const rows=MOTH_PREDATION.map(([year,nT,nC,eT,eC])=>{const kT=nT-eT,kC=nC-eC,A=kT+kC,B=nT+kC+r*(nC+kT),p=2*A/(B+Math.sqrt(B*B-4*r*(nT+nC)*A));if(!(p>0&&p<1&&r*p>0&&r*p<1)){logL=-Infinity;return null;}logL+=kT*Math.log(p)+eT*Math.log1p(-p)+kC*Math.log(r*p)+eC*Math.log1p(-r*p);return{year,typical:kT/nT,melanic:kC/nC,fitT:p,fitC:r*p};});return{logL,rows};}
export function mothPredationFit(){let lo=.5,hi=1.2;for(let k=0;k<95;k++){const a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;if(mothProfile(a).logL<mothProfile(b).logL)lo=a;else hi=b;}const r=(lo+hi)/2,q=mothProfile(r);return{...q,r,s:1-r,LR:2*(q.logL-mothProfile(1).logL)};}

const softplus=x=>Math.max(0,x)+Math.log1p(Math.exp(-Math.abs(x)));
const logadd=(a,b)=>a===-Infinity?b:b===-Infinity?a:Math.max(a,b)+Math.log1p(Math.exp(-Math.abs(a-b)));
export const alleleLogProb=z=>({lp:-softplus(-z),lq:-softplus(z)});
/** Selection, replacement by sensitive immigrants, then forward mutation. z is natural log odds. */
export function resistanceLogStep(z,c,d,mu,m){if(!Number.isFinite(z)||!(c>=0&&c<1&&d>=0&&d<1&&mu>=0&&mu<1&&m>=0&&m<1))throw new RangeError('finite odds and admissible probabilities');const selected=z+Math.log1p(-c)-Math.log1p(-d),{lp,lq}=alleleLogProb(selected),lm=Math.log1p(-m),lu=Math.log1p(-mu),r=logadd(mu>0?Math.log(mu):-Infinity,lu+lm+lp),s=lu+logadd(m>0?Math.log(m):-Infinity,lm+lq);return r-s;}
export function resistanceBalance(c,mu,m){if(!(c>=0&&c<1&&mu>0&&mu<1&&m>=0&&m<1))throw new RangeError('positive seed mutation and admissible inputs');const B=c+mu+(1-mu)*m*(1-c);return 2*mu/(B+Math.sqrt(B*B-4*c*mu));}
export function resistanceHistory(c,d,seedMu,m,start,end,ongoing=true,T=400){const p0=resistanceBalance(c,seedMu,m);let z=Math.log(p0)-Math.log1p(-p0);const rows=[{t:0,z,...alleleLogProb(z),on:false}];for(let t=1;t<=T;t++){const on=start<end&&t>start&&t<=end;z=resistanceLogStep(z,c,on?d:0,ongoing?seedMu:0,m);rows.push({t,z,...alleleLogProb(z),on});}return{p0,rows};}
