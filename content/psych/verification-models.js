// Pure numerical models used by the reviewed perception cards.

/** Mass of an isotropic 2-D Gaussian inside an offset disk, via a Poisson/gamma mixture. */
export function gaussianDiskMass(sigma, offset, radius) {
  if(radius<=0)return 0;
  const mu=offset*offset/(2*sigma*sigma),t=radius*radius/(2*sigma*sigma);
  if(mu===0)return -Math.expm1(-t);
  let poisson=Math.exp(-mu),term=Math.exp(-t),gammaSum=term,total=poisson*(1-gammaSum);
  for(let k=1;k<240;k++){
    poisson*=mu/k;term*=t/k;gammaSum+=term;
    total+=poisson*Math.max(0,1-gammaSum);
    if(k>mu+20&&poisson<1e-16)break;
  }
  return Math.min(1,Math.max(0,total));
}

/** Gilchrist et al.1999 equation3: average framework lightness values, not anchor luminances. */
export function anchoredReflectances(luminances, localMembership, localWeight) {
  const globalMax=Math.max(...luminances);
  const localMax=localMembership.map(group=>Math.max(...luminances.filter((_,i)=>localMembership[i]===group)));
  return luminances.map((L,i)=>.9*L*(localWeight/localMax[i]+(1-localWeight)/globalMax));
}

/** A compact cusp has equal physical luminance outside its finite tails. */
export function cornsweetCusp(x, amplitude, width, edge=5, baseline=.5) {
  const tail=Math.max(0,1-Math.abs(x-edge)/width)**2;
  return baseline+(x<edge?1:-1)*amplitude*tail;
}

/** The demo's gain ratio stays exact throughout the allowed1–30dB slider range. */
export function relativeToneGains(delta) {const first=.02;return [first,first*10**(delta/20)];}
