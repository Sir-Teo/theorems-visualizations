/** Illustrative interpolation through the reported CO2 endpoints; intermediate values are not measurements. */
export const carbonYieldGuide = r => r >= 2 ? 2 : 10 ** (-3 + Math.log10(2000) * Math.max(0,r) / 2);
/** An assumed two-day saturating shape normalized to the chosen seven-day endpoint. */
export const weekAccumulation = (endpoint,day) => endpoint * (-Math.expm1(-day/2)) / (-Math.expm1(-3.5));
/** Positive equilibrium of S - x/(x+epsilon) - k*x = 0, with x in PAL. */
export function oxygenEquilibrium(S,k,epsilon=1e-5){
 const b=1+k*epsilon-S,disc=Math.hypot(b,2*Math.sqrt(k*S*epsilon));
 return b>=0 ? 2*S*epsilon/(b+disc) : (disc-b)/(2*k);
}
export const HUMAN_MITO_PROTEINS=Object.freeze({total:1136,mitochondrial:13,nuclear:1123});
export const HYPOTHESIS_RATINGS=Object.freeze([[2,3,1,1,2],[2,0,1,2,1],[1,0,3,2,1],[3,1,1,2,2]].map(Object.freeze));
export function hypothesisScores(weights){
 const sum=weights.reduce((a,b)=>a+b,0);
 return HYPOTHESIS_RATINGS.map(row=>sum ? row.reduce((a,s,j)=>a+s*weights[j],0)/(3*sum) : 0);
}
