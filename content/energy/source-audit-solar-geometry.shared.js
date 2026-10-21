import {S0} from './ch04.shared.js';

// NOAA's complete two-page General Solar Position Calculations note supports
// the local solar-vector geometry. Its ephemeris, civil-time and refraction
// algorithms are not implemented here. These are explicit teaching inputs:
// sinusoidal declination, fixed 1 au source, chosen optical depth 0.25.
export const GEOMETRY_INPUTS_AUDIT={obliquity:23.44,yearDays:365,equinoxDay:81,opticalDepth:.25,flux:S0};
export const SOLAR_RAD_AUDIT=Math.PI/180;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const solarDeclinationAudit=n=>23.44*Math.sin(2*Math.PI*(n-81)/365);

// Local coordinates: east, north, up. Solar time fixes the hour angle;
// longitude, civil-time offsets, refraction and equation of time are absent.
export function solarPositionAudit(phi,n,h){
 const r=SOLAR_RAD_AUDIT,p=phi*r,d=solarDeclinationAudit(n)*r,w=15*(h-12)*r;
 const east=-Math.cos(d)*Math.sin(w),north=Math.sin(d)*Math.cos(p)-Math.cos(d)*Math.sin(p)*Math.cos(w);
 const sa=Math.sin(p)*Math.sin(d)+Math.cos(p)*Math.cos(d)*Math.cos(w);
 return{alt:Math.asin(clamp(sa,-1,1))/r,az:(Math.atan2(east,north)/r+360)%360,sa};
}
export function solarIncidenceAudit(phi,n,h,beta){
 const r=SOLAR_RAD_AUDIT,s=phi<0?-1:1,p=Math.abs(phi)*r,d=s*solarDeclinationAudit(n)*r,w=15*(h-12)*r,b=beta*r;
 return Math.sin(d)*Math.sin(p-b)+Math.cos(d)*Math.cos(p-b)*Math.cos(w);
}
export function solarBeamAudit(altDeg,atm){
 const sa=Math.sin(altDeg*SOLAR_RAD_AUDIT);
 return sa>0?S0*(atm?Math.exp(-.25/sa):1):0;
}
// Positive interval of a+b cos(w), 0<=w<=pi; b is nonnegative for the
// supported equator-facing tilts 0..90deg and terrestrial latitudes.
function positiveEnd(a,b){
 if(b<1e-15)return a>0?Math.PI:0;
 const x=-a/b;return x>=1?0:x<=-1?Math.PI:Math.acos(x);
}
export function solarDayEnergyAudit(phi,n,beta,atm){
 const r=SOLAR_RAD_AUDIT,p=phi*r,d=solarDeclinationAudit(n)*r,s=phi<0?-1:1,q=(Math.abs(phi)-beta)*r;
 const A=Math.sin(p)*Math.sin(d),B=Math.cos(p)*Math.cos(d),a=Math.sin(s*d)*Math.sin(q),b=Math.cos(d)*Math.cos(q);
 const end=Math.min(positiveEnd(A,B),positiveEnd(a,b));if(!end)return 0;
 // dh=12/pi dw, and the symmetric afternoon contributes the same energy.
 if(!atm)return S0*24/Math.PI*(a*end+b*Math.sin(end))/1000;
 let total=0;const N=160,dw=end/N;
 for(let i=0;i<N;i++){const cw=Math.cos((i+.5)*dw),sa=A+B*cw;total+=Math.exp(-.25/sa)*Math.max(0,a+b*cw);}
 return S0*24/Math.PI*dw*total/1000;
}
export function solarYearEnergyAudit(phi,beta,atm){
 let total=0;for(let n=1;n<=365;n++)total+=solarDayEnergyAudit(phi,n,beta,atm);return total/365;
}
