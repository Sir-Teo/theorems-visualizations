// Authored continuous pair-coalescent illustration; not an empirical demographic fit.
export const TOBA_DOMAINS=[[2000,50000,100],[50,20000,10],[20,30000,10],[30,140,1],[20,30,1]];
export const TOBA_DEFAULTS=[10000,3000,1000,74,25];
// Storey2012 reported one-sigma full-external age, not a fitted model parameter.
export const TOBA_DATE={age:73.88,error:.32};
export const tobaTick=(x,[lo,hi,step])=>typeof x==='number'&&Number.isFinite(x)&&x>=lo&&x<=hi&&Number.isInteger((x-lo)/step);
export function tobaCDF(t,N0,Nb,duration,time,generation){
 if(!(Number.isFinite(t)&&t>=0&&N0>0&&Nb>0&&duration>=0&&generation>0&&time>=duration/1000))throw new RangeError('Positive supported history required');
 const a=time-duration/1000,inside=Math.max(0,Math.min(t-a,duration/1000)),outside=t-inside;
 const hazard=(outside/N0+inside/Nb)*1000/(2*generation);
 return-Math.expm1(-hazard);
}
export function tobaModel(...args){
 const xs=args.length?args:TOBA_DEFAULTS;if(xs.length!==5||xs.some((x,i)=>!tobaTick(x,TOBA_DOMAINS[i])))throw new RangeError('Supported saved Toba ticks required');
 const[N0,Nb,duration,time,generation]=xs,a=time-duration/1000,b=time,d=duration/generation;
 const before=Math.exp(-a*1000/(2*N0*generation)),conditional=-Math.expm1(-d/(2*Nb)),baselineConditional=-Math.expm1(-d/(2*N0));
 const steps=Math.max(1,Math.ceil(d/(2*Nb)/.04));
 const times=[...new Set([...Array.from({length:301},(_,i)=>i),...Array.from({length:steps+1},(_,i)=>i===steps?b:a+(b-a)*i/steps)])].sort((x,y)=>x-y);
 const changed=times.map(t=>[t,tobaCDF(t,...xs)]),baseline=times.map(t=>[t,-Math.expm1(-t*1000/(2*N0*generation))]);
 // A present-day interval begins at Nb, without a fictitious vertical edge at zero.
 const population=a===0?[[0,Nb],[b,Nb],[b,N0],[200,N0]]:[[0,N0],[a,N0],[a,Nb],[b,Nb],[b,N0],[200,N0]];
 return{N0,Nb,duration,time,generation,a,b,generations:d,before,conditional,baselineConditional,mass:before*conditional,baselineMass:before*baselineConditional,relation:Nb<N0?'bottleneck':Nb>N0?'expansion':'no size change',population,changed,baseline};
}
