import{twoBox}from'./ch03.shared.js';
export const PULSE_PEAK=.42,PULSE_DECAY=1;
export const pulseAOD=(t,a)=>t<=0?0:t<PULSE_PEAK?a*(2*t/PULSE_PEAK-(t/PULSE_PEAK)**2):a*Math.exp(-(t-PULSE_PEAK)/PULSE_DECAY);
export function pulseResponse(ecs,a,eff,C,dt=.02){const s=twoBox(t=>eff*pulseAOD(t,a),3.93/ecs,{C,Cd:100,gam:.7},8,dt);let index=0;for(let j=1;j<s.T.length;j++)if(s.T[j]<s.T[index])index=j;return{...s,peak:s.T[index],time:s.t[index]};}
export function droplet(N,lwp){const r=Math.cbrt(3*(lwp*.001/300)/(4*Math.PI*1000*N*1e6)),tau=3*lwp*.001/(2*1000*r),a=.15*tau/(2+.15*tau);return{r:r*1e6,tau,a,sus:a*(1-a)/3};}
export function photonCloud(tau,n=1500,cap=20000){let seed=11;const rng=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return(seed+.5)/4294967296;};let reflected=0,transmitted=0,unresolved=0;const G=.85;
 for(let j=0;j<n;j++){let z=0,mu=1,done=false;for(let k=0;k<cap;k++){z+=mu*-Math.log1p(-rng());if(z<0){reflected++;done=true;break;}if(z>tau){transmitted++;done=true;break;}const u=rng(),t=(1-G*G)/(1-G+2*G*u),ms=(1+G*G-t*t)/(2*G),ph=2*Math.PI*rng();mu=Math.max(-1,Math.min(1,mu*ms-Math.sqrt(Math.max(0,1-mu*mu))*Math.sqrt(Math.max(0,1-ms*ms))*Math.cos(ph)));}if(!done)unresolved++;}
 const a=reflected/n;return{a,se:unresolved?null:Math.sqrt(a*(1-a)/n),lower:a,upper:(reflected+unresolved)/n,reflected,transmitted,unresolved,n};
}
