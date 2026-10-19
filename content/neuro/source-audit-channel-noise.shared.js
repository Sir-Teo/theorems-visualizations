// Finite channel-count HH model: exact frozen-voltage channel transition probabilities,
// multinomial inversion draws, then an exponential voltage update. First-order splitting
// of the coupled voltage/channel process, not a continuous-time Gillespie simulation.
import { HH, gateInf } from './ch02.shared.js';
const logFacts=[0];
function lf(n){for(let j=logFacts.length;j<=n;j++)logFacts[j]=logFacts[j-1]+Math.log(j);return logFacts[n];}
/** Inversion by alternating masses outward from the mode; no Gaussian/Poisson substitution. */
export function channelBinomial(n,p,rng){
  if(!Number.isInteger(n)||n<0||!Number.isFinite(p)||p<0||p>1)throw Error('binomial domain');
  if(!n||p===0)return 0;if(p===1)return n;if(p>.5)return n-channelBinomial(n,1-p,rng);
  let u=rng(),k=Math.floor((n+1)*p),f=Math.exp(lf(n)-lf(k)-lf(n-k)+k*Math.log(p)+(n-k)*Math.log1p(-p));
  if(u<f)return k;u-=f;let left=k,right=k,fl=f,fr=f;
  while(left>0||right<n){if(left>0){fl*=left/(n-left+1)*(1-p)/p;left--;if(u<fl)return left;u-=fl;}
    if(right<n){fr*=(n-right)/(right+1)*p/(1-p);right++;if(u<fr)return right;u-=fr;}
    if(fl+fr===0)break;
  }
  // Only a floating-point residual after the complete distribution has been visited.
  return k;
}
export function channelMultinomial(n,p,rng,stay=-1){const out=p.map(()=>0),order=p.map((_,i)=>i).filter(i=>i!==stay);if(stay>=0)order.push(stay);let remain=n,mass=p.reduce((a,b)=>a+b,0);for(let j=0;j<order.length-1;j++){const i=order[j],q=Math.max(0,Math.min(1,p[i]/mass));out[i]=channelBinomial(remain,q,rng);remain-=out[i];mass-=p[i];if(!remain)break;}out[order.at(-1)]+=remain;return out;}
const choose=(n,k)=>{let x=1;for(let j=1;j<=k;j++)x*= (n-j+1)/j;return x;};
export const gateCountLaw=(N,p)=>Array.from({length:N+1},(_,k)=>choose(N,k)*p**k*(1-p)**(N-k));
export function gateCountMatrix(N,a,b,dt){const e=-Math.expm1(-(a+b)*dt),co=a/(a+b)*e,oo=1-b/(a+b)*e;
 return Array.from({length:N+1},(_,k)=>{const A=gateCountLaw(k,oo),B=gateCountLaw(N-k,co),out=Array(N+1).fill(0);for(let i=0;i<A.length;i++)for(let j=0;j<B.length;j++)out[i+j]+=A[i]*B[j];return out;});}
export function channelMatrices(V,dt){const m=gateCountMatrix(3,HH.am(V),HH.bm(V),dt),h=gateCountMatrix(1,HH.ah(V),HH.bh(V),dt),K=gateCountMatrix(4,HH.an(V),HH.bn(V),dt),Na=Array.from({length:8},(_,i)=>Array.from({length:8},(_,j)=>m[i%4][j%4]*h[Math.floor(i/4)][Math.floor(j/4)]));return{K,Na};}
export function channelInitial(NNa,NK,rng){const M=gateCountLaw(3,gateInf('m',-65)),h=gateInf('h',-65),pn=M.map(x=>x*(1-h)).concat(M.map(x=>x*h));return{Na:channelMultinomial(NNa,pn,rng),K:channelMultinomial(NK,gateCountLaw(4,gateInf('n',-65)),rng)};}
export function channelAdvance(counts,P,rng){const out=counts.map(()=>0);for(let i=0;i<counts.length;i++){if(!counts[i])continue;const row=channelMultinomial(counts[i],P[i],rng,i);for(let j=0;j<out.length;j++)out[j]+=row[j];}return out;}
export function channelRun(Ifn,{NNa,NK,tEnd=200,dt=.025,every=8,rng,diagnostics=false}={}){
 if(![NNa,NK].every(n=>Number.isInteger(n)&&n>0)||!(dt>0)||typeof rng!=='function')throw Error('channel domain');
 let {Na,K}=channelInitial(NNa,NK,rng),V=-65,armed=true;const o={t:[],V:[],spikes:[],counts:[]},N=Math.round(tEnd/dt);
 for(let k=0;k<=N;k++){const t=k*dt;if(k%every===0||k===N){o.t.push(t);o.V.push(V);if(diagnostics)o.counts.push({Na:Na.slice(),K:K.slice()});}if(k===N)break;
   const P=channelMatrices(V,dt);Na=channelAdvance(Na,P.Na,rng);K=channelAdvance(K,P.K,rng);
   const gn=HH.gNa*Na[7]/NNa,gk=HH.gK*K[4]/NK,g=gn+gk+HH.gL,E=(Ifn(t+dt/2)+gn*HH.ENa+gk*HH.EK+HH.gL*HH.EL)/g;
   const W=E+(V-E)*Math.exp(-g*dt/HH.C);
   if(armed&&V<0&&W>=0){o.spikes.push(t+dt*(-V)/(W-V));armed=false;}if(W< -20)armed=true;V=W;
 }
 return o;
}
export function latencySummary(times,{onset=2,end=12,bins=20}={}){const lats=times.map(ts=>ts.find(t=>t>=onset&&t<=end)).filter(t=>t!==undefined).map(t=>t-onset),counts=Array(bins).fill(0),width=(end-onset)/bins;for(const l of lats)counts[Math.min(bins-1,Math.floor(l/width))]++;const mean=lats.length?lats.reduce((a,b)=>a+b,0)/lats.length:null,sd=lats.length>1?Math.sqrt(lats.reduce((a,b)=>a+(b-mean)**2,0)/(lats.length-1)):null;return{lats,counts,width,mean,sd,censored:times.length-lats.length,total:times.length};}
/** Deterministic population-limit version of the same splitting, for refinement checks. */
export function channelLimit(Ifn,{tEnd=12,dt=.025}={}){const m=gateInf('m',-65),h=gateInf('h',-65);let Na=gateCountLaw(3,m).map(x=>x*(1-h)).concat(gateCountLaw(3,m).map(x=>x*h)),K=gateCountLaw(4,gateInf('n',-65)),V=-65,armed=true;const o={t:[0],V:[V],spikes:[]},N=Math.round(tEnd/dt);for(let k=0;k<N;k++){const P=channelMatrices(V,dt),advance=(a,P)=>a.map((_,j)=>a.reduce((s,x,i)=>s+x*P[i][j],0));Na=advance(Na,P.Na);K=advance(K,P.K);const gn=HH.gNa*Na[7],gk=HH.gK*K[4],g=gn+gk+HH.gL,E=(Ifn((k+.5)*dt)+gn*HH.ENa+gk*HH.EK+HH.gL*HH.EL)/g,W=E+(V-E)*Math.exp(-g*dt/HH.C);if(armed&&V<0&&W>=0){o.spikes.push(k*dt+dt*(-V)/(W-V));armed=false;}if(W< -20)armed=true;V=W;o.t.push((k+1)*dt);o.V.push(V);}return o;}
