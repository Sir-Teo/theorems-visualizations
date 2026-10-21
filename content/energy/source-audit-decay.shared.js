// Untermyer & Weills, AECD-3454 (1952), p4 Eq2, inspected original.
// Natural-uranium empirical fit includes U239/Np239; conversion ratio ≈0.8.
// It excludes delayed-neutron fission and has the source's historical errors.
const difference=(t,T,a,p)=>-((t+a)**p)*Math.expm1(p*Math.log1p(T/(t+a)));
export const decayFractionAudit=(t,T)=>.1*(difference(t,T,10,-.2)-.87*difference(t,T,2e7,-.2));
const F=(t,T,a)=>(t+a)**.8*Math.expm1(.8*Math.log1p(T/(t+a)));
// Integral of the fractional power over [t0,t1], in full-power seconds.
export function decayIntegralAudit(t0,t1,T){
  if(t1<=t0)return 0;
  return .1/.8*((F(t0,T,10)-F(t1,T,10))-.87*(F(t0,T,2e7)-F(t1,T,2e7)));
}
export function decayWaterAudit({t0,T,powerMW,massKg,latent,cp=4186,warming=60,horizon=100*3600}){
  const sensible=massKg*cp*warming,dryEnergy=sensible+massKg*latent;
  const energy=dt=>powerMW*1e6*decayIntegralAudit(t0,t0+dt,T);
  const root=target=>{
    if(energy(horizon)<target)return null;
    let lo=0,hi=horizon;
    for(let j=0;j<55;j++){const mid=(lo+hi)/2;if(energy(mid)<target)lo=mid;else hi=mid;}
    return (lo+hi)/2;
  };
  const boilTime=root(sensible),dryTime=root(dryEnergy),endTime=dryTime??horizon;
  const left=dt=>Math.max(0,massKg-Math.max(0,energy(dt)-sensible)/latent);
  const times=[0,...Array.from({length:150},(_,i)=>endTime*((i+1)/150)**2),...(boilTime===null?[]:[boilTime])].sort((a,b)=>a-b);
  const points=times.map(dt=>[dt/3600,100*left(dt)/massKg]);
  if(dryTime!==null)points.at(-1)[1]=0;
  return {boilTime,dryTime,endTime,points,left:dryTime===null?left(endTime):0,energy:energy(endTime),sensible,dryEnergy};
}
