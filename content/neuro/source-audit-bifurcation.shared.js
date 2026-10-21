/** Exact equilibria/Hopf locations for the displayed FHN family (0<b<1, eps*b<1, eps*b*b<1). */
export function fhnHopfPoints({a,b,eps}){
  if(!(b>0&&b<1&&eps>0&&eps*b<1&&eps*b*b<1))return[];
  const omega=Math.sqrt(eps*(1-eps*b*b)),l1=(2*b-1-eps*b*b)/(8*(1-eps*b*b));
  return[-1,1].map(sign=>{const V=sign*Math.sqrt(1-eps*b),I=(V+a)/b-V+V**3/3,dVdI=1/(1/b-1+V*V);return{V,I,omega,l1,muPrime:-V*dVdI};});
}
/** Finite-window detector, not a proof of periodicity or nonexistence when it fails. */
export function windowOscillation(ys,dt){
  const q=ys.length>>2,size=(a,b)=>{let lo=Infinity,hi=-Infinity;for(let k=a;k<b;k++){lo=Math.min(lo,ys[k][0]);hi=Math.max(hi,ys[k][0]);}return hi-lo;},previous=size(2*q,3*q),amp=size(3*q,ys.length),half=ys.slice(2*q),level=half.reduce((s,y)=>s+y[0],0)/half.length,events=[];
  for(let k=1;k<half.length;k++)if(half[k-1][0]<level&&half[k][0]>=level)events.push((k-1+(level-half[k-1][0])/(half[k][0]-half[k-1][0]))*dt);
  const detected=amp>.05&&amp>=.9*previous&&events.length>=3;
  return{rate:detected?(events.length-1)/(events.at(-1)-events[0]):null,amp,previous,count:events.length,detected};
}
