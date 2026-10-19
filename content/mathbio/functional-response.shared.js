/** Conventional constant-prey-density type I–III teaching parameterizations. */
export const functionalResponse = (type, density, attack, handling) => type === 'I' ? Math.min(attack*density,1/handling) : type === 'II' ? attack*density/(1+attack*handling*density) : attack*density*density/(1+attack*handling*density*density);
/** Count completed handling events; type I is a separate capped encounter model. */
export function simulateResponse(type, density, attack, handling, duration, random) {
 const rate=type==='III'?attack*density*density:attack*density;
 if(!(rate>0)) return 0;
 const handle=type==='I'?0:handling,cap=type==='I'?Math.floor(duration/handling):Infinity;
 let clock=0,n=0;
 for(;;){clock+=-Math.log1p(-random())/rate+handle;if(clock>duration)break;n++;if(n>=cap)break;}
 return n/duration;
}
