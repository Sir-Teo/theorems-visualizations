// Explicit synthetic energy-response bands, truncated to the displayed250–900nm interval.
import{AU,PC,planckL,bandT,T_SUN}from'./ch04.shared.js';
export const parsecMeters=648000/Math.PI*AU;
export const distanceModulus=d=>5*Math.log10(d/10);
export const relativeFlux=m=>10**(-.4*m);
export function parallaxProjection(distance,beta,phase){const p=1/distance,b=beta*Math.PI/180;return[-p*Math.cos(phase),p*Math.sin(b)*Math.sin(phase)];}
export function energyBand(b,T){let sum=0;const N=650,h=650/N;for(let i=0;i<=N;i++){const nm=250+i*h;sum+=(i===0||i===N?1:i%2?4:2)*planckL(nm*1e-9,T)*bandT(b,nm);}return sum*h*1e-9/3;}
const anchor=.65+2.5*Math.log10(energyBand('B',T_SUN)/energyBand('V',T_SUN));
const cache=new Map();export function syntheticColour(T){if(!cache.has(T))cache.set(T,-2.5*Math.log10(energyBand('B',T)/energyBand('V',T))+anchor);return cache.get(T);}
export function ballesterosColourTemperature(bv){return 4600*(1/(.92*bv+1.7)+1/(.92*bv+.62));}
