// Scoped source-audit models. SI units; Q^{-1}=sin(2 geometric lag).
import {G, YEAR, BODY, TAU} from './ch03.shared.js';
export function lockingModel({planet=BODY.earth,radius=1737e3,rho=3344,rigidity=3e10,Q=100,period=12*3600,distance=60}={}){
 const mass=4*Math.PI*rho*radius**3/3,a=distance*planet.R,g=G*mass/radius**2,I=.4*mass*radius**2;
 const k2=1.5/(1+19*rigidity/(2*rho*g*radius)),torque=1.5*G*planet.M**2*k2*radius**5/(a**6*Q),rate=torque/I;
 const n=Math.sqrt(G*(planet.M+mass)/a**3),w0=TAU/period,tl=Math.abs(w0-n)/rate/YEAR;
 return{mass,k2,torque,rate,n,w0,tl,p:planet,valid:mass/planet.M<=.02&&a>planet.R+radius,spin:t=>n+Math.sign(w0-n)*Math.max(0,Math.abs(w0-n)-rate*t*YEAR)};
}
export function lunarModel(scale=1){
 const E=BODY.earth,m=BODY.moon.M,a0=BODY.moon.a,C=.3307*E.M*E.R**2,w0=TAU/86164.1,mu=E.M*m/(E.M+m),rate0=.03808/YEAR;
 const L=a=>mu*Math.sqrt(G*(E.M+m)*a),Ltot=C*w0+L(a0),w=a=>(Ltot-L(a))/C,n=a=>Math.sqrt(G*(E.M+m)/a**3);
 let lo=a0,hi=2*a0;for(let i=0;i<90;i++){const a=(lo+hi)/2;if(w(a)>n(a))lo=a;else hi=a;}const sync=(lo+hi)/2,inner=10*E.R,A=rate0*scale*a0**5.5;
 const time=a=>scale===0?Infinity:(a**6.5-a0**6.5)/(6.5*A*1e9*YEAR);
 const evaluate=t=>{const z=a0**6.5+6.5*A*t*1e9*YEAR;if(!(z>=inner**6.5))return{valid:false,reason:'inside the chosen 10-Earth-radius cutoff'};const a=z**(1/6.5);if(a>sync)return{valid:false,reason:'past spin–orbit synchronism'};return{valid:true,a,w:w(a),period:TAU/w(a)/3600};};
 const dLdt=.5*L(a0)/a0*rate0*scale,dLODms=TAU/w0*(dLdt/C/w0)*(36525*86400)*1000;
 return{evaluate,inner,sync,timeInner:time(inner),timeSync:time(sync),rate0,C,L,Ltot,w,n,dLODms};
}
export function jeansModel({mass,radius,particleMass,temperature}){
 const v0=Math.sqrt(2*1.380649e-23*temperature/particleMass),escape=Math.sqrt(2*G*mass/radius),lambda=(escape/v0)**2;
 const logFlux=Math.log(v0/(2*Math.sqrt(Math.PI)))+Math.log1p(lambda)-lambda;
 const height=radius/lambda,logYears=(Math.log(height)-logFlux-Math.log(YEAR))/Math.LN10;
 return{v0,escape,lambda,height,logFlux,logYears,fluxPerDensity:Math.exp(logFlux),density:speed=>4/Math.sqrt(Math.PI)*speed**2/v0**3*Math.exp(-((speed/v0)**2))};
}
export function resonanceWindow(states,p){
 const gamma=states.map(([t,theta])=>theta-p*TAU*t),span=Math.max(...gamma)-Math.min(...gamma);
 return{span,librationCandidate:gamma.length>16&&span<Math.PI}; // finite-window diagnostic, never an asymptotic certificate
}
