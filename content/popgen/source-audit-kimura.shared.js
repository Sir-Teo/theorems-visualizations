/** Historical 1968 arithmetic, not a general bound on adaptive evolution. */
export const KIMURA_1968_RATE=1.2/(28e6*300);
export function historicalBudget(genome,rate,years,cost,load){
  if(![genome,rate,years,cost,load].every(x=>Number.isFinite(x)&&x>0))throw new RangeError('positive finite budget inputs required');
  const perYear=genome*rate,perGen=perYear*years,limit=load/cost,ratio=perGen/limit,threshold=limit/perGen,amax=Math.min(1,threshold);
  return{perYear,perGen,limit,ratio,threshold,amax,actualLoad:amax*perGen*cost,interval:1/perYear,generations:1/limit};
}
