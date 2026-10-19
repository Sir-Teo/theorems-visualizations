import{CS,csRates,csA,csStep}from'./ch02.shared.js';
const inf=(g,V)=>{const[a,b]=csRates[g](V);return a/(a+b);};
export function csGateState(V){return[V,inf('m',V),inf('h',V),inf('n',V),csA.ainf(V),csA.binf(V)];}
export function csFieldAudit(y,I,gA,EL){const[V,m,h,n,a,b]=y,slow=['m','h','n'].map((g,j)=>{const[alpha,beta]=csRates[g](V);return CS.q/(g==='n'?2:1)*(alpha*(1-y[j+1])-beta*y[j+1]);});return[(-CS.gL*(V-EL)-CS.gNa*m**3*h*(V-CS.ENa)-CS.gK*n**4*(V-CS.EK)-gA*a**3*b*(V-CS.EA)+I)/CS.C,...slow,(csA.ainf(V)-a)/csA.taua(V),(csA.binf(V)-b)/csA.taub(V)];}
let root=null;
export function csTargetRest(){if(root!==null)return root;const f=V=>csFieldAudit(csGateState(V),0,CS.gA,CS.EL)[0];let lo=-80,hi=-50;for(let j=0;j<80;j++){const m=(lo+hi)/2;if(f(lo)*f(m)<=0)hi=m;else lo=m;}return root=(lo+hi)/2;}
export function csLeakAudit(gA){const V=csTargetRest(),y=csGateState(V),[_,m,h,n,a,b]=y;return V+(CS.gNa*m**3*h*(V-CS.ENa)+CS.gK*n**4*(V-CS.EK)+gA*a**3*b*(V-CS.EA))/CS.gL;}
/** Entire integration-resolution event train; plotted samples are not used to count events. */
export function csSimulationAudit(I,gA,{T=620,t0=20,dt=.05,every=2}={}){const y=csGateState(csTargetRest()),EL=csLeakAudit(gA),t=[],V=[],conductance=[],events=[];let armed=true;for(let k=0;k<=Math.round(T/dt);k++){if(k%every===0){t.push(k*dt);V.push(y[0]);conductance.push(gA*y[4]**3*y[5]);}if(k<Math.round(T/dt)){const old=y[0];csStep(y,k*dt>=t0?I:0,dt,gA,EL);if(armed&&old< -20&&y[0]>=-20){events.push((k+(-20-old)/(y[0]-old))*dt);armed=false;}if(y[0]<-40)armed=true;}}const retained=events.filter(t=>t>=t0),late=events.filter(t=>t>=120);return{t,V,conductance,events:retained,pre:events.filter(t=>t<t0),latency:retained.length?retained[0]-t0:null,rate:late.length>=3?1000/(late.at(-1)-late.at(-2)):null,late:late.length,EL,final:Array.from(y),T,t0,dt};}
export function csCurveAudit(gA,Is){return Is.map(I=>({I,...csSimulationAudit(I,gA,{every:Math.round(620/.05)})}));}
