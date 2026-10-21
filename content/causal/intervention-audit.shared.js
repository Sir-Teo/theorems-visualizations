// Scoped Chapter 4 audit helpers; the model calculations are not observed measurements.
import { descendants, dSep, condProb, probOf } from './ch04.shared.js';

export function backDoorCheck(n,E,x,y,Z) {
  const desc=descendants(n,E,x), bad=[...Z].filter(i=>i===x||i===y||desc.has(i));
  return {bad,ok:bad.length===0&&dSep(n,E.filter(([a])=>a!==x),x,y,new Set(Z))};
}
export function swigCovariate(o,id) {
  return Number.isInteger(id)&&id>=0&&id<o.names.length&&id!==o.t&&id!==o.y&&!o.hid.includes(id)&&!descendants(o.names.length,o.e,o.t).has(id);
}
export function mBias(s,e) {
  const vz=2*s*s+1, vx=2+2*e*s+e*e*vz;
  return {unadjusted:e*s/vx,adjusted:-s*s/(3*s*s+2)};
}
export const SIMPSON_TABLES={
  kidney:{g:['open surgery','PCNL'],st:['group 1','group 2'],n:[[87,263],[270,80]],s:[[81,192],[234,55]],out:'success',title:'kidney-stone treatments (Charig et al. 1986)',nodes:['stone size','treatment','success'],gpos:[[5,4.9],[1.6,1.3],[8.4,1.3]],ge:[[0,1],[0,2],[1,2]],note:'this illustrative graph assumes size confounds treatment and outcome; a causal adjustment interpretation also requires sufficient measured confounders and positivity'},
  ucb:{g:['women','men'],st:['A','B','C','D','E','F'],n:[[108,25,593,375,393,341],[825,560,325,417,191,373]],s:[[89,17,202,131,94,24],[512,353,120,138,53,22]],out:'admitted',title:'Berkeley graduate admissions, 1973, six largest departments',nodes:['group','department','admitted'],gpos:[[1.6,1.3],[5,4.9],[8.4,1.3]],ge:[[0,1],[1,2],[0,2]],note:'this illustrative graph posits department as a mediator; the counts alone establish neither this graph nor a causal effect of group or discrimination'},
};
export function reweightedTable(D,lambda) {
  const N=D.n.map(a=>a.reduce((s,x)=>s+x,0)), rates=D.s.map((a,g)=>a.map((x,k)=>x/D.n[g][k]));
  const counts=[D.n[0].map((x,k)=>(1-lambda)*x+lambda*N[0]*D.n[1][k]/N[1]),D.n[1].slice()];
  const pooled=counts.map((a,g)=>a.reduce((s,x,k)=>s+x*rates[g][k],0)/N[g]);
  const mix=counts[0].map((x,k)=>(x+counts[1][k])/(N[0]+N[1]));
  return {counts,rates,pooled,standardized:rates.map(a=>a.reduce((s,x,k)=>s+x*mix[k],0))};
}
// Absent required empirical strata are unavailable, never replaced with zero.
export function supportedFrontDoor(P,n,ix,im,iy,x) {
  if(!(probOf(P,n,{[ix]:x})>0))return NaN;
  let sum=0;
  for(const m of [0,1]) {
    const p1=condProb(P,n,im,{[ix]:x}), pm=m?p1:1-p1;
    if(pm===0)continue;
    let inner=0;
    for(const xp of [0,1]) {
      const px=probOf(P,n,{[ix]:xp});if(px===0)continue;
      const py=condProb(P,n,iy,{[ix]:xp,[im]:m});if(!Number.isFinite(py))return NaN;
      inner+=px*py;
    }
    sum+=pm*inner;
  }
  return sum;
}
export function lordPopulation(rho,gap,story) {
  return {groupMeans:[60-gap/2,60+gap/2],variance:64,covariance:64*rho,change:0,ancova:(1-rho)*gap,differentialDietEffect:story==='trait'?0:(1-rho)*gap};
}
// Two explicit counterfactual completions of the same observed D=1 Gaussian law.
export function lordWeight(story,d,g,rho,gap,z0,z1,z2) {
  const mu=60+(g?1:-1)*gap/2;
  if(story==='trait'){const T=mu+8*Math.sqrt(rho)*z0;return[T+8*Math.sqrt(1-rho)*z1,T+8*Math.sqrt(1-rho)*z2];}
  const w0=mu+8*z0;
  return[w0,60+rho*(w0-60)+d*(1-rho)*(mu-60)+8*Math.sqrt(1-rho*rho)*z1];
}
