// Verified cooling models; SI depths/fluxes internally, ages in Julian Myr.
import{MYR,KAPPA}from'./ch04.shared.js';
export{MYR,KAPPA};
const SQRT_PI=Math.sqrt(Math.PI);
// Regularized gamma(.5,x²): convergent positive series / Lentz fraction.
export function erfc(x){if(x<0)return 2-erfc(-x);if(x===0)return 1;const z=x*x;if(z>745)return 0;const factor=Math.exp(-z+Math.log(x)-Math.log(SQRT_PI));if(z<1.5){let term=2,sum=term;for(let n=1;n<200;n++){term*=z/(n+.5);sum+=term;if(term<sum*2e-16)break;}return 1-factor*sum;}let b=z+.5,c=1e300,d=1/b,h=d;for(let n=1;n<300;n++){const a=-n*(n-.5);b+=2;d=b+a*d;if(Math.abs(d)<1e-300)d=1e-300;c=b+a/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const change=d*c;h*=change;if(Math.abs(change-1)<3e-15)break;}return factor*h;}
export const erf=x=>x<0?-erf(-x):1-erfc(x);
export const Z90=2.326174307353348;
const defaults={Tm:1300,T0:0,k:3.138,kappa:KAPPA,alpha:3e-5,rhoM:3300,rhoW:1000};
export function halfTemperature(z,t,opts={}){const o={...defaults,...opts};return t===0?(z===0?o.T0:o.Tm):o.T0+(o.Tm-o.T0)*erf(z/(2*Math.sqrt(o.kappa*t*MYR)));}
export function heatCoefficient(opts={}){const o={...defaults,...opts};return o.k*(o.Tm-o.T0)/Math.sqrt(Math.PI*o.kappa*MYR);}
export const halfHeat=(t,opts={})=>t===0?Infinity:heatCoefficient(opts)/Math.sqrt(t);
export function halfSubs(t,opts={}){const o={...defaults,...opts};return 2*o.rhoM*o.alpha*(o.Tm-o.T0)/(o.rhoM-o.rhoW)*Math.sqrt(o.kappa*t*MYR/Math.PI);}
export function finiteSubs(z,t,opts={}){if(t===0)return 0;const o={...defaults,...opts},h=2*Math.sqrt(o.kappa*t*MYR),eta=z/h;return o.rhoM*o.alpha*(o.Tm-o.T0)/(o.rhoM-o.rhoW)*(z*erfc(eta)+h*(-Math.expm1(-eta*eta))/SQRT_PI);}
export function plateTemperature(z,t,a,opts={}){const o={...defaults,...opts};if(z<=0)return o.T0;if(z>=a)return o.Tm;if(t===0)return o.Tm;const s=o.kappa*t*MYR/(a*a),y=z/a;let theta;if(s<.05){const h=2*Math.sqrt(s);let deficit=0;for(let n=0;n<50;n++){const term=erfc((2*n+y)/h)-erfc((2*n+2-y)/h);deficit+=term;if(n>0&&Math.abs(term)<1e-16)break;}theta=1-deficit;}else{theta=y;for(let n=1;n<1000;n++){const e=Math.exp(-n*n*Math.PI*Math.PI*s);theta+=2*Math.sin(n*Math.PI*y)*e/(n*Math.PI);if(e<1e-16)break;}}return o.T0+(o.Tm-o.T0)*theta;}
export function plateHeat(t,a,opts={}){if(t===0)return Infinity;const o={...defaults,...opts},s=o.kappa*t*MYR/(a*a);let sum=1;if(s<.1){for(let n=1;n<100;n++){const e=Math.exp(-n*n/s);sum+=2*e;if(e<1e-16)break;}return o.k*(o.Tm-o.T0)/Math.sqrt(Math.PI*o.kappa*t*MYR)*sum;}for(let n=1;n<1000;n++){const e=Math.exp(-n*n*Math.PI*Math.PI*s);sum+=2*e;if(e<1e-16)break;}return o.k*(o.Tm-o.T0)/a*sum;}
export function plateSubsidence(t,a,opts={}){if(t===0)return 0;const o={...defaults,...opts},s=o.kappa*t*MYR/(a*a);let integral=0;if(s<.05){const h=2*Math.sqrt(s),primitive=u=>u*erfc(u/h)-h*Math.exp(-((u/h)**2))/SQRT_PI;for(let n=0;n<50;n++){const term=2*primitive(2*n+1)-primitive(2*n)-primitive(2*n+2);integral+=term;if(n>0&&Math.abs(term)<1e-16)break;}}else{let sum=0;for(let n=1;n<1000;n+=2){const e=Math.exp(-n*n*Math.PI*Math.PI*s);sum+=e/(n*n);if(e<1e-16)break;}integral=.5-4*sum/(Math.PI*Math.PI);}return o.rhoM*o.alpha*(o.Tm-o.T0)*a/(o.rhoM-o.rhoW)*integral;}
export const psYoungDepth=t=>2500+350*Math.sqrt(t),psOldDepth=t=>6400-3200*Math.exp(-t/62.8);
export const gdhDepth=t=>t<20?2600+365*Math.sqrt(t):5651-2473*Math.exp(-.0278*t);
export const gdhHeat=t=>t<=55?510/Math.sqrt(t):48+96*Math.exp(-.0278*t);
export const psHeat=t=>11.3*41.84/Math.sqrt(t); // µcal cm^-2 s^-1 to mW/m², thermochemical calorie.
export const OCEAN_AREA=3.1e14,MAX_AGE=180;
export const conductedFraction=(t,sealing,f0)=>t>=sealing?1:1-(1-f0)*(1-t/sealing)**2;
// Exact age-bin integrals for this declared triangular area / polynomial-fraction toy.
export function heatBin(lo,hi,opts={},sealing=60,f0=.2){const c=heatCoefficient(opts)*2*OCEAN_AREA/MAX_AGE/1e12,primitive=t=>2*Math.sqrt(t)-2*t**1.5/(3*MAX_AGE),a=[f0,2*(1-f0)/sealing,-(1-f0)/(sealing*sealing)],b=[a[0],a[1]-a[0]/MAX_AGE,a[2]-a[1]/MAX_AGE,-a[2]/MAX_AGE],lowPrimitive=t=>b.reduce((s,v,j)=>s+v*t**(j+.5)/(j+.5),0);const law=c*(primitive(hi)-primitive(lo));let conducted=0;if(lo<sealing)conducted+=lowPrimitive(Math.min(hi,sealing))-lowPrimitive(lo);if(hi>sealing)conducted+=primitive(hi)-primitive(Math.max(lo,sealing));return{law,conducted:c*conducted};}
export function heatBins(opts={},sealing=60,f0=.2){return Array.from({length:18},(_,i)=>({lo:10*i,hi:10*(i+1),...heatBin(10*i,10*(i+1),opts,sealing,f0)}));}
