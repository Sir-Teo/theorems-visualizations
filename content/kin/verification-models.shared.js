import { RJ, kTh } from './ch03.shared.js';
/** Stable exact normalized populations, including nearly equal rates. */
export function consecutive(a,b,t){const A=Math.exp(-a*t),d=b-a;const B=d===0?a*t*A:d>0?a*A*(-Math.expm1(-d*t))/d:a*Math.exp(-b*t)*Math.expm1(d*t)/d;return[A,B,Math.max(0,1-A-B)];}
export function intermediatePeak(a,b){const r=(b-a)/a;const time=r===0?1/a:Math.log1p(r)/(a*r);return{time,value:consecutive(a,b,time)[1]};}
/** Final product yields from the integrated two-transient-state first-order scheme. */
export function curtinHammett(T,gB,gA,gTB,gI,start='eq') {const RT=RJ*T/1000,f=G=>kTh(T)*Math.exp(-G/RT),GI=Math.max(gI,Math.max(0,gB)+2),kAB=f(GI),kBA=f(GI-gB),kA=f(gA),kB=f(gTB-gB),K=Math.exp(-gB/RT),x=start==='eq'?[1/(1+K),K/(1+K)]:[1,0];const a=kA*((kBA+kB)*x[0]+kBA*x[1]),b=kB*(kAB*x[0]+(kAB+kA)*x[1]);return{r:b/a,pA:a/(a+b),pB:b/(a+b),kAB,kBA,kA,kB,K,GI};}
export function branchingPopulation(lambda,t,initiation=1){return initiation*(lambda===0?t:Math.expm1(lambda*t)/lambda);}
/** Two positive pressure roots of tau*p^3-kappa*p^2+wall=0, when they exist. */
export function branchingLimits(kappa,tau,wall){const mid=2*kappa/(3*tau),F=p=>tau*p**3-kappa*p*p+wall;if(F(mid)>=0)return null;const root=(lo,hi,lower)=>{for(let i=0;i<70;i++){const p=(lo+hi)/2;if((F(p)>0)===lower)lo=p;else hi=p;}return(lo+hi)/2;};return{lower:root(0,mid,true),upper:root(mid,kappa/tau,false)};}
export function bromineChain(capacityRatio=.1){const k1=1,k2=10,k3=200,k4=k3*capacityRatio,k5=1e4;const field=(_t,[h2,b2,hb,b,h])=>{const i=k1*b2,z=k5*b*b,p=k2*b*h2,q=k3*h*b2,r=k4*h*hb;return[-p+r,-i+z-q,p+q-r,2*i-2*z-p+q+r,p-q-r];};const BrSS=y=>Math.sqrt(Math.max(0,k1*y[1]/k5)),HSS=y=>k2*BrSS(y)*y[0]/(k3*y[1]+k4*y[2]),rate=y=>2*k2*Math.sqrt(k1/k5)*y[0]*Math.sqrt(Math.max(0,y[1]))/(1+(k4/k3)*y[2]/y[1]);return{field,BrSS,HSS,rate};}
