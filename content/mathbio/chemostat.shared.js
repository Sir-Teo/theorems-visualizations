/** Constant-yield, perfectly mixed single-resource chemostat. */
export const monod = (S, maximum, K) => maximum * S / (K + S);
export const breakEven = (D, maximum, K) => maximum > D ? D * K / (maximum - D) : Infinity;
export function chemostatField(D, feed, strains) {
 return (t, state) => { let nutrient=D*(feed-state[0]);const biomass=[];
  for(let i=0;i<strains.length;i++){const [maximum,K]=strains[i],growth=monod(state[0],maximum,K);nutrient-=growth*state[i+1];biomass.push((growth-D)*state[i+1]);}
  return [nutrient,...biomass];
 };
}
export function chemostatPrediction(rates, feed) {
 const minimum=Math.min(...rates);
 if(!(minimum<feed)) return [];
 return rates.map((r,i)=>Math.abs(r-minimum)<=1e-10*Math.max(1,minimum)?i:-1).filter(i=>i>=0);
}
