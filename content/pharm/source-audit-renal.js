// Historical Cockcroft–Gault equation; no hidden floor or body-surface normalization.
export const cockcroftGault=(age,weight,creatinine,female=false)=>(140-age)*weight/(72*creatinine)*(female?.85:1);
export function renalRegimens(age,weight,creatinine,female,fraction){
  const crcl=cockcroftGault(age,weight,creatinine,female),rawFraction=crcl/120,kidneyFraction=Math.min(rawFraction,1),Q=1-fraction+fraction*kidneyFraction,k0=Math.LN2/6,k=k0*Q,V=40,dose=200,interval=8;
  const regimen=(D,T,rate=k)=>{const peak=D/V/(-Math.expm1(-rate*T)),trough=peak*Math.exp(-rate*T);return{dose:D,interval:T,k:rate,peak,trough,mean:D/(rate*V*T),C:t=>peak*Math.exp(-rate*(((t%T)+T)%T))};};
  return{crcl,rawFraction,kidneyFraction,Q,normal:regimen(dose,interval,k0),unadjusted:regimen(dose,interval),reduced:regimen(dose*Q,interval),lengthened:regimen(dose,interval/Q)};
}
// Explicit pre/post-dose vertices preserve discontinuities in a bolus profile.
export function renalVertices(regimen,end=96){const {interval:T,peak,k}=regimen,pts=[];for(let start=0;start<end;start+=T){const duration=Math.min(T,end-start);for(let i=0;i<=64;i++){const phase=duration*i/64;pts.push([start+phase,peak*Math.exp(-k*phase)]);}}return pts;}
