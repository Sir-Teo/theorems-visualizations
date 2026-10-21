// Chosen one-compartment teaching model; no efficacy or toxicity prediction.
export function infusionRegimen(dailyDose,halfLife,mic,interval){
  const V=17.5,Tinf=.5,k=Math.LN2/halfLife,D=dailyDose*70*interval/24,plateau=D/Tinf/(k*V),peak=plateau*(-Math.expm1(-k*Tinf))/(-Math.expm1(-k*interval)),trough=peak*Math.exp(-k*(interval-Tinf));
  const C=t=>{const phase=((t%interval)+interval)%interval;return phase<=Tinf?trough*Math.exp(-k*phase)+plateau*(-Math.expm1(-k*phase)):peak*Math.exp(-k*(phase-Tinf));};
  const single=t=>t<0?0:plateau*(-Math.expm1(-k*Math.min(t,Tinf)))*Math.exp(-k*Math.max(0,t-Tinf));
  const startup=t=>{let sum=0;for(let n=0;n<=Math.floor(t/interval);n++)sum+=single(t-n*interval);return sum;};
  let belowHours=0;if(mic>=peak)belowHours=24;else if(mic>trough){const rise=-Math.log((plateau-mic)/(plateau-trough))/k,fall=Tinf+Math.log(peak/mic)/k;belowHours=24*(rise+interval-fall)/interval;}
  return{V,Tinf,k,D,interval,peak,trough,C,startup,belowHours,mean:dailyDose*70/(24*k*V),auc24:dailyDose*70/(k*V),ratio:peak/mic};
}
export function infusionVertices(profile,steady=true,end=72){const times=new Set([0,end]),T=profile.interval;for(let start=0;start<end;start+=T)for(const [lo,hi]of[[start,Math.min(start+profile.Tinf,end)],[Math.min(start+profile.Tinf,end),Math.min(start+T,end)]])for(let i=0;i<=48;i++)times.add(lo+(hi-lo)*i/48);return[...times].sort((a,b)=>a-b).map(t=>[t,steady?profile.C(t):profile.startup(t)]);}
