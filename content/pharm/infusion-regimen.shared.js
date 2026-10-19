/** Exact one-compartment steady-state metrics for one rectangular infusion per interval. */
export function infusionRegimen(dailyDose, volume, halfLife, interval, duration, mic) {
 const k=Math.LN2/halfLife,dose=dailyDose*interval/24,rate=dose/duration,plateau=rate/(k*volume);
 const peak=plateau*(-Math.expm1(-k*duration))/(-Math.expm1(-k*interval)),trough=peak*Math.exp(-k*(interval-duration));
 let fraction=0;
 if(mic>=peak)fraction=1;
 else if(mic>trough){const rise=-Math.log((plateau-mic)/(plateau-trough))/k,fall=duration+Math.log(peak/mic)/k;fraction=(rise+interval-fall)/interval;}
 return {dose,peak,trough,dailyAUC:dailyDose/(k*volume),hoursBelow:24*fraction};
}
