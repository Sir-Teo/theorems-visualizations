// Chosen linear common-base output model. Voltage/current are collector magnitudes.
export function pointContact(d,ieMilli,R){
 const alpha=3*Math.exp(-d/40),go=4e-6,Reff=1/(1/R+go),vc=(30-R*alpha*ieMilli*1e-3)/(1+R*go),ic=(30-vc)/R,rin=26/Math.max(ieMilli,.05)+200;
 const valid=vc>=2&&vc<=30;
 return{alpha,vc,ic,rin,Reff,valid,voltageGain:alpha*Reff/rin,powerGain:alpha*alpha*Reff*Reff/(R*rin)};
}
