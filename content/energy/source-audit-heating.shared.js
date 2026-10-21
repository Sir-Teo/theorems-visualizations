// NIST SRD69 selected standard formation enthalpies, kJ/mol at 298.15K.
// CO2(g): CODATA; H2O(l/g): CODATA; CH4(g): Manion2002;
// C3H8(g): Pittam/Pilcher1972; n-octane(l): Good1972.
export const FUEL_WATER_AUDIT = 18.01528;
export const FUEL_LATENT_AUDIT = (285.830 - 241.826) / FUEL_WATER_AUDIT;
export const HEATING_FUELS_AUDIT = [
  {key:'H2',label:'hydrogen H₂',M:2.01588,nC:0,nW:1,dHf:0},
  {key:'CH4',label:'methane CH₄',M:16.0425,nC:1,nW:2,dHf:-74.6},
  {key:'C3H8',label:'propane C₃H₈',M:44.0956,nC:3,nW:4,dHf:-104.7},
  {key:'C8H18',label:'n-octane C₈H₁₈',M:114.2285,nC:8,nW:9,dHf:-250.3},
  {key:'coal',label:'coal model (3% H)',hhv:32.5,h:.03,c:.9,o:.02,ash:.05},
  {key:'wood',label:'wood model (6% H)',hhv:21.7,h:.06,c:.5,o:.4,ash:.04},
];
export function fuelHeatingAudit(f,moisture=0) {
  if(f.M) {
    const hhv=(f.nC*393.51+f.nW*285.830+f.dHf)/f.M,mw=f.nW*FUEL_WATER_AUDIT/f.M,co2=f.nC*44.0095/f.M;
    return {hhv,lhv:(f.nC*393.51+f.nW*241.826+f.dHf)/f.M,mw,co2,ash:0,o2:(f.nC+f.nW/2)*31.9988/f.M};
  }
  const wet=f.key==='wood'?moisture:0,dry=1-wet,hhv=f.hhv*dry,mw=wet+FUEL_WATER_AUDIT/2.01588*f.h*dry,co2=44.0095/12.0107*f.c*dry,ash=f.ash*dry;
  return {hhv,lhv:hhv-FUEL_LATENT_AUDIT*mw,mw,co2,ash,o2:co2+mw+ash-1};
}
