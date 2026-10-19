import{weissinger}from'./ch03.shared.js';
// MIT16.100 lecture33: centre downwash of a single horseshoe at fixed Gamma.
// This is a distinct approximation from a re-solved rectangular lifting line.
export const horseshoeGroundAudit=h=>16*h*h/(1+16*h*h);
export function groundWakeAudit(x,z,h,core=.01){
  let u=0,w=0;
  for(const[y,H,g]of[[.5,h,1],[-.5,h,-1],[.5,-h,-1],[-.5,-h,1]]){
    const d=x-y,e=z-H,r2=d*d+e*e+core*core;u-=g*e/(2*Math.PI*r2);w+=g*d/(2*Math.PI*r2);
  }
  return[u,w];
}
export function groundStateAudit(AR,h,M=60){
  const free=weissinger({AR,alpha:.1,h:0,M}),near=weissinger({AR,alpha:.1,h,M});
  return{free,near,phi:(near.CDi/near.CL**2)/(free.CDi/free.CL**2),liftRatio:near.CL/free.CL};
}
const cache=new Map();
export function groundCurveAudit(AR){
  if(cache.has(AR))return cache.get(AR);
  const free=weissinger({AR,alpha:.1,h:0,M:60}),base=free.CDi/free.CL**2;
  const points=Array.from({length:41},(_,i)=>{const h=.03*(1/.03)**(i/40),s=weissinger({AR,alpha:.1,h,M:60});return[h,(s.CDi/s.CL**2)/base];});
  const result={free,points};cache.set(AR,result);if(cache.size>6)cache.delete(cache.keys().next().value);return result;
}
