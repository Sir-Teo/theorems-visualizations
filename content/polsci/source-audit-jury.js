// Audited finite, odd-jury probabilities. No simulation or data fitting.
export const JURY_MAX = 401;
const validP = p => Number.isFinite(p) && p >= 0 && p <= 1;
export function assertOddJurySize(n) { if (!Number.isInteger(n) || n < 1 || n > JURY_MAX || n % 2 !== 1) throw new RangeError('An odd jury size 1…401 is required.'); }
function valid(n,p) { assertOddJurySize(n); if (!validP(p)) throw new RangeError('A probability 0…1 is required.'); }
/** Evaluate the smaller majority tail by a decreasing series, retaining its log
 * even when the probability is below binary64's positive range. */
export function juryProbability(n,p) {
  valid(n,p);
  if (p === 0 || p === 1) return {right:p,wrong:1-p,logRight:p?0:-Infinity,logWrong:p?-Infinity:0};
  if (p === .5) return {right:.5,wrong:.5,logRight:-Math.LN2,logWrong:-Math.LN2};
  const q=Math.min(p,1-p),m=(n+1)/2;
  let logChoose=0;for(let k=1;k<=m;k++)logChoose+=Math.log((n-k+1)/k);
  let term=1,sum=1;for(let k=m;k<n;k++){term*=((n-k)/(k+1))*(q/(1-q));sum+=term;}
  const logSmall=logChoose+m*Math.log(q)+(n-m)*Math.log1p(-q)+Math.log(sum),small=Math.exp(logSmall),large=1-small,logLarge=Math.log1p(-small);
  return p<.5?{right:small,wrong:large,logRight:logSmall,logWrong:logLarge}:{right:large,wrong:small,logRight:logLarge,logWrong:logSmall};
}
/** Normalized binomial masses built outward from a mode; endpoints are exact. */
export function juryMass(n,p) {
  valid(n,p);const a=Array(n+1).fill(0);
  if(p===0||p===1){a[p?n:0]=1;return a;}
  const m=Math.floor((n+1)*p);a[m]=1;
  for(let k=m;k>0;k--)a[k-1]=a[k]*k/(n-k+1)*(1-p)/p;
  for(let k=m;k<n;k++)a[k+1]=a[k]*(n-k)/(k+1)*p/(1-p);
  const total=a.reduce((s,x)=>s+x,0);return a.map(x=>x/total);
}
export function juryLowerBound(n,p){valid(n,p);return p>.5?Math.max(0,1-p*(1-p)/(n*(p-.5)**2)):null;}
function decimalFraction(x){const [mant,e='0']=String(x).split('e'),[a,b='']=mant.split('.');let numerator=BigInt(a+b),denominator=10n**BigInt(b.length),power=+e;if(power>0)numerator*=10n**BigInt(power);else if(power<0)denominator*=10n**BigInt(-power);return[numerator,denominator];}
/** Sign of 2p(1-rho)-1 for the exact finite decimal input values. This avoids
 * using display rounding or a tolerance to manufacture the critical case. */
export function juryLeaderRelation(p,rho){if(!Number.isFinite(p)||p<=.5||p>=1||!validP(rho))throw new RangeError('Require .5<p<1 and 0≤rho≤1.');const[a,b]=decimalFraction(p),[c,d]=decimalFraction(rho),s=2n*a*(d-c)-b*d;return s>0n?1:s<0n?-1:0;}
export function juryLeader(n,p,rho,critical=false){
  valid(n,p);const relation=critical?0:juryLeaderRelation(p,rho);if(p<=.5||p>=1||!validP(rho))throw new RangeError('Require .5<p<1 and 0≤rho≤1.');
  const threshold=1-1/(2*p),r=critical?threshold:rho,q0=relation===0?.5:(1-r)*p;
  // The critical state is an analytic parameter choice, independent of slider rounding.
  const actualQ1=relation===0?1.5-1/(2*p):r+(1-r)*p,a=juryProbability(n,actualQ1),b=juryProbability(n,q0);
  const right=p*a.right+(1-p)*b.right,wrong=p*a.wrong+(1-p)*b.wrong;
  const logAdd=(x,y)=>{if(x===-Infinity)return y;if(y===-Infinity)return x;const z=Math.max(x,y);return z+Math.log1p(Math.exp(Math.min(x,y)-z));};
  return{n,p,rho:r,manualRho:rho,critical,threshold,relation,q0,q1:actualQ1,right,wrong,logRight:logAdd(Math.log(p)+a.logRight,Math.log1p(-p)+b.logRight),logWrong:logAdd(Math.log(p)+a.logWrong,Math.log1p(-p)+b.logWrong),limit:relation>0?1:relation<0?p:(1+p)/2,correlation:r*r};
}
/** Plain-text readout of a probability, preserving tiny positive tails. */
export function juryNumber(value,logValue){if(logValue===-Infinity)return '0 (exact endpoint)';if(value>=1-.5e-6)return '1 to displayed precision';if(value===0)return `10^(${(logValue/Math.LN10).toFixed(2)}) (below binary64 range)`;return value<.0001?value.toExponential(3):value.toFixed(6);}
