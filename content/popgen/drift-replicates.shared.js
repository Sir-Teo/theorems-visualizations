import {binom,gammaDraw} from './ch02.shared.js';
/** A neutral beta-binomial generation on 32 census copies, matched to effective diploid size Ne.
 * E[p'|p]=p and Var[p'|p]=p(1-p)/(2Ne). This is an illustrative overdispersion model, not Buri's breeding protocol.
 */
export function replicateDriftNext(r,k,Ne,n=32){
 if(k<=0)return 0;if(k>=n)return n;const p=k/n;
 if(2*Ne>=n)return binom(r,n,p);
 const concentration=n*(2*Ne-1)/(n-2*Ne),a=gammaDraw(r,p*concentration),b=gammaDraw(r,(1-p)*concentration);
 return binom(r,n,a/(a+b));
}
export function replicateDriftPaths(r,lines,Ne,generations=19){
 return Array.from({length:lines},()=>{const p=[16];for(let t=1;t<=generations;t++)p.push(replicateDriftNext(r,p[t-1],Ne));return p;});
}
