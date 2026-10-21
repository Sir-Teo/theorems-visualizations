const bounded=(x,a,b)=>Math.max(a,Math.min(b,x));
export const passiveRadius=pressure=>1+.25*(pressure-100)/100;
export const passiveFlow=pressure=>(pressure/100)*passiveRadius(pressure)**4;
export const toneRatio=(pressure,gain,reserve)=>bounded(passiveFlow(pressure)**(-gain/4),1-.3*reserve,1+.35*reserve);
export const regulatedFlow=(pressure,gain,reserve)=>passiveFlow(pressure)*toneRatio(pressure,gain,reserve)**4;
export function myogenicStep(pressure,gain,reserve,tau,time){
 const elapsed=Math.max(0,time-5),P=time<5?100:pressure,target=toneRatio(P,gain,reserve),tone=target+(1-target)*Math.exp(-elapsed/tau),radius=passiveRadius(P)*tone;
 return {pressure:P/100,tone,radius,flow:(P/100)*radius**4,target};
}
