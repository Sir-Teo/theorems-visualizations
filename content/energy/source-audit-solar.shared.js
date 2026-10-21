// IAU2015 ResolutionB3 nominal conversion constants; blackbody model, not measured SSI.
export const SOLAR_INPUTS_AUDIT={h:6.62607015e-34,c:299792458,k:1.380649e-23,sigma:5.670374419e-8,T:5772,R:6.957e8,AU:149597870700};
export function solarSpectrumAudit(nm,T){
  const a=SOLAR_INPUTS_AUDIT,l=nm*1e-9,x=a.h*a.c/(l*a.k*T);
  return (a.R/a.AU)**2*2*Math.PI*a.h*a.c*a.c/(l**5*Math.expm1(x))*1e-9;
}
export const solarPowerAudit=T=>{const a=SOLAR_INPUTS_AUDIT;return a.sigma*T**4*(a.R/a.AU)**2;};
// Exact Planck-tail expansion for the fraction below a wavelength. The n-th
// exponential integral is analytic; the supported display is100–4000nm,4000–7500K.
export function solarFractionAudit(nm,T){
  const a=SOLAR_INPUTS_AUDIT,x=a.h*a.c/(nm*1e-9*a.k*T),r=Math.exp(-x);let q=r,sum=0;
  if(!q)return 0;
  for(let n=1;n<=2000;n++){
    const term=q*(x**3/n+3*x*x/(n*n)+6*x/(n**3)+6/n**4);sum+=term;
    if(term<1e-15*sum)break;q*=r;
  }
  return sum*15/Math.PI**4;
}
// Deliberately chosen optical-depth toy, not Bird/Meinel/HITRAN parameters or
// a fit to measured atmospheric transmission. Named bands indicate intended
// absorbers; their centers, widths and strengths are illustration inputs.
export const SOLAR_BANDS_AUDIT=[[690,2.5,.25,'O₂'],[720,7,.35,'H₂O'],[760,3,1.6,'O₂'],[820,8,.3,'H₂O'],[940,22,1.6,'H₂O'],[1130,28,1.7,'H₂O'],[1380,45,5,'H₂O'],[1870,70,6,'H₂O'],[2010,14,1.2,'CO₂'],[2700,90,8,'H₂O']];
export function solarTransmissionAudit(nm,am){
  const um=nm/1000;let tau=.0087*um**-4+.1*(um/.5)**-1.3+25*Math.exp(-(nm-250)/20);
  for(const[c,s,d]of SOLAR_BANDS_AUDIT)tau+=d*Math.exp(-.5*((nm-c)/s)**2);
  return Math.exp(-tau*am);
}
