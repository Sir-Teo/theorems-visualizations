// Bounded authored Pareto diagnostics; ideal-law assertions are separate.
export const tailSeedValid=x=>Number.isInteger(x)&&x>=0&&x<=0xffffffff;
function random(seed){if(!tailSeedValid(seed))throw new RangeError('Unsigned32 seed required');let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
export function paretoMoment(alpha,m,xmin=1){if(!Number.isFinite(alpha)||alpha<=1||!Number.isFinite(m)||m<0||!Number.isFinite(xmin)||xmin<=0)throw new RangeError('Pareto exponent, moment and lower cutoff required');return m<alpha-1?xmin**m*(alpha-1)/(alpha-1-m):null;}
export function tailQuantile(alpha,u){if(!Number.isFinite(alpha)||alpha<1.3||alpha>4.5||!Number.isFinite(u)||u<0||u>=1)throw new RangeError('Offered exponent and uniform required');return Math.exp(-Math.log1p(-u)/(alpha-1));}
export function tailModel(alpha=2.5,n=1000,seed=17){if(![100,1000,10000].includes(n)||!tailSeedValid(seed))throw new RangeError('Offered sample size and seed required');tailQuantile(alpha,0);const streams=[];
 for(let j=0;j<4;j++){const R=random((seed+Math.imul(j,0x9e3779b9))>>>0),samples=[];for(let k=0;k<n;k++){const u=(Math.floor(R()*67108864)*134217728+Math.floor(R()*134217728))/9007199254740992;samples.push(tailQuantile(alpha,u));}streams.push(samples);}
 const sorted=streams[0].slice().sort((a,b)=>b-a),survival=[];for(let k=0;k<n;){let end=k+1;while(end<n&&sorted[end]===sorted[k])end++;survival.push([sorted[k],end/n]);k=end;}
 let high=1;const traces=streams.slice(1).map(xs=>{let sum=0;return xs.map((x,j)=>{sum+=x;const m=sum/(j+1);high=Math.max(high,m);return[j+1,m];});}),mean=paretoMoment(alpha,1),second=paretoMoment(alpha,2),variance=alpha>3?(alpha-1)/((alpha-2)**2*(alpha-3)):null;
 return{alpha,n,seed,streams,sorted,survival,traces,mean,second,variance,median:2**(1/(alpha-1)),max:sorted[0],meanHigh:Math.max(high,mean??1)};
}
export const SCALE_FREE_CATEGORIES=Object.freeze([
 {id:'not',name:'Not scale free',percent:49,definition:'Neither Super-Weak nor Weakest.',implies:['not']},
 {id:'super',name:'Super-Weak',percent:46,definition:'For at least 50% of associated simple graphs, no tested alternative is favored over the power law. The power law itself need not pass goodness of fit.',implies:['super']},
 {id:'weakest',name:'Weakest',percent:29,definition:'For at least 50% of associated simple graphs, the fitted power law is not rejected by the goodness-of-fit test (p at least 0.1).',implies:['weakest']},
 {id:'weak',name:'Weak',percent:19,definition:'Weakest, with at least 50 observations in the fitted power-law tail.',implies:['weak','weakest']},
 {id:'strong',name:'Strong',percent:10,definition:'Weak and Super-Weak, with fitted exponent strictly between 2 and 3 for at least 50% of associated graphs.',implies:['strong','weak','weakest','super']},
 {id:'strongest',name:'Strongest',percent:4,definition:'Strong requirements for at least 90% of associated graphs, and Super-Weak requirements for at least 95%.',implies:['strongest','strong','weak','weakest','super']},
].map(x=>Object.freeze({...x,implies:Object.freeze(x.implies)})));
