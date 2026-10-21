// Dedicated audited calculations for the four source follow-ups; existing shared helpers are unchanged.
import { binIntervals, dbinom } from './ch08.shared.js';
import { dist } from '../../assets/js/viz/math.js';
/** Exact dyadic encoding of the finite JavaScript inputs. */
function dyadic(x) {
  if (!Number.isFinite(x)) throw new RangeError('finite input required');
  const b = new DataView(new ArrayBuffer(8)); b.setFloat64(0,x);
  const bits=b.getBigUint64(0), exp=Number(bits>>52n&2047n), mant=(bits&((1n<<52n)-1n))+(exp?1n<<52n:0n);
  return { mant: bits>>63n ? -mant:mant, exp:exp?exp-1075:-1074 };
}
/** Enumerate all equally sized two-group label assignments. Extremeness uses exact integer ranks, including ties. */
export function exactPermutations(pooled, nA=pooled.length/2) {
  const n=pooled.length, nB=n-nA;
  if(n>20||!Number.isInteger(nA)||nA<1||nB<1) throw new RangeError('small nonempty groups required');
  const dy=pooled.map(dyadic), exponent=Math.min(...dy.filter(x=>x.mant!==0n).map(x=>x.exp),0);
  const a=dy.map(x=>x.mant<<BigInt(x.exp-exponent)), total=a.reduce((s,x)=>s+x,0n);
  const score = sum=>BigInt(n)*sum-BigInt(nA)*total, abs=x=>x<0n?-x:x;
  const observedScore=score(a.slice(0,nA).reduce((s,x)=>s+x,0n)), threshold=abs(observedScore);
  const masks=[],dif=[],lookup=new Float64Array(2**n),extreme=new Uint8Array(2**n);let count=0;
  const value=s=>{const negative=s<0n,t=negative?-s:s,shift=Math.max(0,t.toString(2).length-53);return (negative?-1:1)*Number(t>>BigInt(shift))/(nA*nB)*2**(exponent+shift);};
  function visit(i,k,sum,mask) {if(!k){const s=score(sum),d=value(s),tail=abs(s)>=threshold;masks.push(mask);dif.push(d);lookup[mask]=d;extreme[mask]=+tail;count+=+tail;return;}for(let j=i;j<=n-k;j++)visit(j+1,k-1,sum+a[j],mask|(1<<j));}
  visit(0,nA,0n,0);
  return {masks,dif,lookup,extreme,count,p:count/dif.length,observed:value(observedScore)};
}
/** Closed conditional probabilities for two uniform draws, split at their range d. */
export function rangeSubsetCoverage(d) {
  if(d<0||d>1)throw new RangeError('range cut must lie in [0,1]');
  const pa=(1-d)**2, below=d*(2-d);
  return {pa,hi:d>=.5?1:(.5-d*d)/pa,lo:d===0?0:d<=.5?d/(2-d):(.5-pa)/below};
}
/** Direct inversion of all binomial intervals, with no theta grid or interpolated count boundaries. */
export function binomialBelt(n,level) {
  const intervals=binIntervals('cp',n,level);
  const accepts=(theta,k)=>intervals[k][0]<=theta&&theta<=intervals[k][1];
  const belt=theta=>{const ks=intervals.flatMap((_,k)=>accepts(theta,k)?[k]:[]);return [ks[0],ks.at(-1)];};
  const coverage=theta=>intervals.reduce((s,_,k)=>s+(accepts(theta,k)?dbinom(k,n,theta):0),0);
  return {intervals,accepts,belt,coverage,ci:x=>intervals[x],draw:(r,theta)=>{let k=0;for(let i=0;i<n;i++)k+=+(r()<theta);return k;}};
}
export function normalBelt(level,n=100) {
  const half=dist.normal().quantile((1+level)/2)/Math.sqrt(n),ci=x=>[x/20-half,x/20+half];
  return {half,belt:theta=>[20*(theta-half),20*(theta+half)],ci,coverage:()=>level,draw:(r,theta)=>20*(theta+r.normal()/Math.sqrt(n))};
}
export function fdpSE(values) { const n=values.length;if(n<2)return 0;const mean=values.reduce((s,x)=>s+x,0)/n;return Math.sqrt(values.reduce((s,x)=>s+(x-mean)**2,0)/(n*(n-1))); }
