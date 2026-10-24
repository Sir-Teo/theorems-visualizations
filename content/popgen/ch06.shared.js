// POPGEN6: explicit per-copy selection, diploid 2N gene-copy convention.
export const O={step:'any',sig:5,decimals:5},I={step:1,int:true};
export const fmt=x=>x===null?'not defined':x===0?'0':Math.abs(x)<1e-4||Math.abs(x)>=1e5?x.toExponential(4):Number(x.toPrecision(5)).toString();
export const sum=a=>a.reduce((s,x)=>s+x,0);
export const lin=(n,a=0,b=1)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
export const axes=(title,x,y,extra={})=>({title,x,y,axes:'box',gutter:true,height:320,...extra});
export function finite(x,a,b,name='parameter'){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw RangeError(name+' outside its finite domain');return x;}
export function integer(x,a,b,name='integer'){finite(x,a,b,name);if(!Number.isInteger(x))throw RangeError(name+' must be integral');return x;}
export function rng(seed){integer(seed,0,4294967295,'seed');let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return(x+.5)/4294967296;};}
// Stable nontrivial root: -log(1-rho)/rho - 1 = s. The divided
// series retains advantages too small to survive rounding of 1+s.
function excess(p){if(p<.05){let term=p,total=0;for(let k=1;k<60;k++){const add=term/(k+1);total+=add;if(Math.abs(add)<Number.EPSILON*total)break;term*=p;}return total;}return-Math.log1p(-p)/p-1;}
export function survival(s){finite(s,-.5,1,'s');if(s<=0)return 0;let lo=0,hi=Math.min(1,2*s);for(let j=0;j<90;j++){const mid=(lo+hi)/2;if(excess(mid)>s)hi=mid;else lo=mid;}return(lo+hi)/2;}
export function manySurvival(s,k=1){integer(k,0,10000,'founders');return-Math.expm1(k*Math.log1p(-survival(s)));}
export function extinction(s,t,k=1){finite(s,-.5,1,'s');integer(t,0,1000,'generations');integer(k,0,10000,'founders');if(k===0)return 1;let q=0;for(let j=0;j<t;j++)q=Math.exp((1+s)*(q-1));return q**k;}
// Sum independent Poisson chunks; no Gaussian approximation or size-conditioned draw.
export function poisson(mean,random){finite(mean,0,20000,'Poisson mean');if(mean===0)return 0;const chunks=Math.ceil(mean/16),limit=Math.exp(-mean/chunks);let total=0;for(let j=0;j<chunks;j++){let product=1,k=0;do{k++;product*=random();}while(product>limit);total+=k-1;}return total;}
export function branching({s=.03,k=1,seed=12,generations=100,runs=48,cap=2000}={}){
 finite(s,-.1,.2,'s');integer(k,1,10,'founders');integer(generations,0,160,'generations');integer(runs,1,200,'runs');integer(cap,10,10000,'observation cap');const random=rng(seed),paths=[];
 for(let j=0;j<runs;j++){const path=[k];let censored=false;for(let t=0;t<generations;t++){const n=poisson(path.at(-1)*(1+s),random);path.push(n);if(n>cap){censored=true;break;}if(n===0)break;}paths.push({path,censored,extinct:path.at(-1)===0});}
 return{paths,extinct:paths.filter(p=>p.extinct).length,censored:paths.filter(p=>p.censored).length,runs};
}
export function fixation(p,Ne,s){finite(p,0,1,'initial frequency');finite(Ne,1,1e9,'effective size');finite(s,-.5,1,'s');if(p===0||p===1||s===0)return p;const a=4*Ne*s;if(Math.abs(a)<1e-6)return p*(1+a*(1-p)/2+a*a*(1-p)*(1-2*p)/12);if(a*p===0)return Math.exp(logFixation(p,Ne,s));return a>0?-Math.expm1(-a*p)/-Math.expm1(-a):Math.exp(a*(1-p))*(-Math.expm1(a*p))/-Math.expm1(a);}
export function logFixation(p,Ne,s){finite(p,0,1,'initial frequency');finite(Ne,1,1e9,'effective size');finite(s,-.5,1,'s');if(p===0)return -Infinity;if(p===1)return 0;if(s===0)return Math.log(p);const a=4*Ne*s;if(Math.abs(a)<1e-6)return Math.log(p)+Math.log1p(a*(1-p)/2+a*a*(1-p)*(1-2*p)/12);const numerator=a*p===0?Math.log(Math.abs(a))+Math.log(p):Math.log(-Math.expm1(-Math.abs(a)*p));return a>0?numerator-Math.log(-Math.expm1(-a)):a*(1-p)+numerator-Math.log(-Math.expm1(a));}
const logsum=terms=>{const high=Math.max(...terms);return high+Math.log(sum(terms.map(x=>Math.exp(x-high))));};
export function logfmt(x){if(x===-Infinity)return '0';const exponent=Math.floor(x/Math.LN10),mantissa=Math.exp(x-exponent*Math.LN10);return fmt(mantissa)+'e'+exponent;}
export function binomialRow(M,p){integer(M,2,120,'copies');finite(p,0,1,'sampling frequency');if(p===0||p===1)return Array.from({length:M+1},(_,j)=>Number(j===M*p));const logs=[0];for(let j=1;j<=M;j++)logs.push(logs.at(-1)+Math.log(j));const row=Array.from({length:M+1},(_,j)=>Math.exp(logs[M]-logs[j]-logs[M-j]+j*Math.log(p)+(M-j)*Math.log1p(-p))),total=sum(row);return row.map(x=>x/total);}
function factor(A){const n=A.length,L=A.map(r=>r.slice()),perm=Array.from({length:n},(_,j)=>j);for(let k=0;k<n;k++){let p=k;for(let j=k+1;j<n;j++)if(Math.abs(L[j][k])>Math.abs(L[p][k]))p=j;[L[k],L[p]]=[L[p],L[k]];[perm[k],perm[p]]=[perm[p],perm[k]];if(Math.abs(L[k][k])<1e-15)throw Error('Finite-chain solve is singular');for(let i=k+1;i<n;i++){L[i][k]/=L[k][k];for(let j=k+1;j<n;j++)L[i][j]-=L[i][k]*L[k][j];}}
 return b=>{const x=perm.map(i=>b[i]);for(let i=0;i<n;i++)for(let j=0;j<i;j++)x[i]-=L[i][j]*x[j];for(let i=n-1;i>=0;i--){for(let j=i+1;j<n;j++)x[i]-=L[i][j]*x[j];x[i]/=L[i][i];}return x;};}
export function finiteWF(N,s){
 integer(N,2,60,'diploid size');finite(s,-.25,.3,'s');const M=2*N,P=Array.from({length:M+1},(_,i)=>{const p=i/M;return binomialRow(M,p*(1+s)/(1+s*p));}),Q=P.slice(1,M).map(r=>r.slice(1,M)),A=Q.map((r,i)=>r.map((x,j)=>Number(i===j)-x)),solve=factor(A),u=solve(P.slice(1,M).map(r=>r[M])),g=solve(u),tau=solve(Array(M-1).fill(1));
 const residual=Math.max(...u.map((x,i)=>Math.abs(x-sum(Q[i].map((p,j)=>p*u[j]))-P[i+1][M])),...g.map((x,i)=>Math.abs(x-sum(Q[i].map((p,j)=>p*g[j]))-u[i])));
 return{M,P,Q,u:[0,...u,1],conditional:[null,...g.map((x,i)=>x/u[i]),0],absorption:[0,...tau,0],residual};
}
export function sweep(N,s){finite(N,2,1e9,'size');finite(s,Number.MIN_VALUE,.3,'positive s');return{rule:2*Math.log(2*N)/s,logistic:2*Math.log(2*N-1)/s,discrete:2*Math.log(2*N-1)/Math.log1p(s)};}
export function nearly(N,scale=.0001,neutral=.2){finite(N,2,1e9,'size');finite(scale,0,.03,'effect scale');finite(neutral,0,1,'neutral fraction');const effects=[0,-scale/10,-scale,-10*scale],weights=[neutral,.2*(1-neutral),.5*(1-neutral),.3*(1-neutral)],rates=effects.map((s,i)=>weights[i]*2*N*fixation(1/(2*N),N,s));const logRate=logsum(effects.map((s,i)=>weights[i]>0?Math.log(weights[i])+Math.log(2*N)+logFixation(1/(2*N),N,s):-Infinity));return{effects,weights,rates,rate:sum(rates),logRate};}
export function barrier(Ne,A,delta,x){finite(Ne,1,1e9,'effective size');finite(A,0,.3,'benefit scale');finite(delta,0,1,'step');finite(x,0,30,'progress');const gain=A*Math.exp(-x)*(-Math.expm1(-delta)),scaled=4*Ne*gain,threshold=A>0&&delta>0?Math.log(4*Ne*A*(-Math.expm1(-delta))):null;return{gain,scaled,threshold,relative:2*Ne*fixation(1/(2*Ne),Ne,gain)};}
export function origin(N,mu,s){finite(N,2,1e9,'size');finite(mu,0,.01,'mutation rate');finite(s,0,.3,'s');const u=fixation(1/(2*N),N,s),rate=2*N*mu*u,T=s>0?sweep(N,s).rule:null;return{u,rate,waiting:rate>0?1/rate:null,overlap:T===null?null:rate*T,approx:4*N*mu*s};}
export function dfe(N,scale,beneficial=.05,neutral=.2){finite(N,2,1e9,'size');finite(scale,0,.005,'effect scale');finite(beneficial,0,.25,'beneficial fraction');finite(neutral,0,.7,'neutral fraction');const harmful=1-beneficial-neutral,effects=[-10*scale,-scale,-scale/10,0,scale/10,scale,10*scale],weights=[.2*harmful,.5*harmful,.3*harmful,neutral,.5*beneficial,.35*beneficial,.15*beneficial],terms=effects.map((s,i)=>weights[i]>0?Math.log(weights[i])+logFixation(1/(2*N),N,s):-Infinity),logTotal=logsum(terms),total=Math.exp(logTotal),fixed=terms.map(x=>Math.exp(x-logTotal));return{effects,weights,fixed,total,logTotal,mean:sum(effects.map((s,i)=>s*weights[i])),meanFixed:sum(effects.map((s,i)=>s*fixed[i]))};}
function categorical(weights,random){const u=random()*sum(weights);let c=0;for(let j=0;j<weights.length;j++){c+=weights[j];if(u<c)return j;}return weights.length-1;}
export function clones({N=1000,a=.04,b=.08,arrival=35,recombination=0,seed=12,generations=240}={}){
 integer(N,100,2000,'haploid census');finite(a,0,.2,'A log-fitness');finite(b,0,.2,'B log-fitness');integer(arrival,0,120,'arrival');finite(recombination,0,.5,'recombination');integer(generations,0,240,'generations');const random=rng(seed),initial=Math.min(20,Math.floor(N/10));let counts=[N-initial,initial,0,0],introduced=false;const frames=[];
 for(let t=0;t<=generations;t++){if(t===arrival&&counts[0]>0){const k=Math.min(initial,counts[0]);counts[0]-=k;counts[2]+=k;introduced=k;}frames.push(counts.slice());if(t===generations)break;let p=counts.map((n,i)=>n*Math.exp([0,a,b,a+b][i]));const total=sum(p);p=p.map(x=>x/total);const D=p[0]*p[3]-p[1]*p[2],q=[p[0]-recombination*D,p[1]+recombination*D,p[2]+recombination*D,p[3]-recombination*D];counts=[0,0,0,0];for(let i=0;i<N;i++)counts[categorical(q,random)]++;}
 return{frames,introduced,initial};
}
export function ratchet({N=100,U=.3,s=.03,seed=12,generations=120}={}){
 integer(N,50,500,'haploid census');finite(U,0,.5,'mutation input');finite(s,0,.3,'deleterious effect');integer(generations,0,120,'generations');const random=rng(seed);let loads=Array(N).fill(0);const frames=[],summary=[];
 for(let t=0;t<=generations;t++){const min=Math.min(...loads),max=Math.max(...loads),hist=Array(max+1).fill(0);loads.forEach(k=>hist[k]++);frames.push(hist);summary.push({min,mean:sum(loads)/N,least:hist[min]});if(t===generations)break;const w=loads.map(k=>Math.exp(Math.log1p(-s)*(k-min))),cdf=[];let total=0;for(const x of w){total+=x;cdf.push(total);}const next=[];for(let i=0;i<N;i++){const u=random()*total;let lo=0,hi=N-1;while(lo<hi){const mid=(lo+hi)>>1;if(u<cdf[mid])hi=mid;else lo=mid+1;}next.push(loads[lo]+poisson(U,random));}loads=next;}
 return{frames,summary,equilibriumMean:s>0?U/s:null,zeroClass:s>0?N*Math.exp(-U/s):null};
}
export function rescue({N0=10000,d=.03,g=.05,mu=.00001,k=1,t=100}={}){
 finite(N0,100,1e6,'initial census');finite(d,.001,.2,'decline rate');finite(g,0,.2,'absolute mutant excess');finite(mu,0,.001,'mutation rate');integer(k,0,20,'standing copies');finite(t,0,240,'generation');const rho=survival(g),q=1-rho,H=mu*N0*rho*(-Math.expm1(-d*t))/d,Hinf=mu*N0*rho/d,logStanding=k*Math.log1p(-rho),stand=-Math.expm1(logStanding),newByT=-Math.expm1(-H),total=-Math.expm1(logStanding-Hinf),resident=N0*Math.exp(-d*t),conditional=k>0&&rho>0?k*(1+g)**t*(-Math.expm1((k+t)*Math.log1p(-rho)))/stand:null;
 return{rho,q,H,Hinf,stand,newByT,total,resident,conditional,conditionalTotal:conditional===null?null:resident+conditional};
}
