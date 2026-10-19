import{BURST,mlWinf,mlF,burstF,rk4}from'./ch03.shared.js';
import{mlEquilibriaAudit}from'./source-audit-morris-lecar.shared.js';
/** Frozen Ca-like conductance is exactly an extra ohmic leak to VK; no root-count scan. */
export function frozenBurstParameters(p,z){const g=p.gKCa*z/(1+z);return{...p,gL:p.gL+g,VL:(p.gL*p.VL+g*p.VK)/(p.gL+g)};}
export function burstEquilibriaAudit(p,z,I=p.I){return mlEquilibriaAudit(frozenBurstParameters(p,z),I);}
export function burstGroups(times,gap=250){const groups=[];for(const t of times){if(!groups.length||t-groups.at(-1).at(-1)>gap)groups.push([]);groups.at(-1).push(t);}return groups;}
/** Fixed warm-up and observation, with events resolved on integration rather than plotted samples. */
export function burstRecorded(p,{warm=12000,T=8000,dt=.25,every=8}={}){let y=[-50,mlWinf(p,-50),.1],F=q=>burstF(p,q[0],q[1],q[2],p.I);for(let k=0;k<Math.round(warm/dt);k++)y=rk4(F,y,dt);const rec=[y],t=[0],sp=[];for(let k=1;k<=Math.round(T/dt);k++){const previous=y;y=rk4(F,y,dt);if(previous[0]<0&&y[0]>=0)sp.push((k-1-previous[0]/(y[0]-previous[0]))*dt);if(k%every===0){rec.push(y);t.push(k*dt);}}return{rec,t,sp,groups:burstGroups(sp),warm,T,dt,final:y};}
/** One finite frozen-z launch; an unobserved cycle is not excluded. */
export function burstFastSlice(p,z,{T=1500,dt=.25}={}){const q=frozenBurstParameters(p,z),F=y=>mlF(q,y[0],y[1],p.I);let y=[0,mlWinf(q,0)],lo=Infinity,hi=-Infinity;const events=[];for(let k=0;k<Math.round(T/dt);k++){const old=y;y=rk4(F,y,dt);if((k+1)*dt>=T/2){lo=Math.min(lo,y[0]);hi=Math.max(hi,y[0]);if(old[0]<0&&y[0]>=0)events.push((k-old[0]/(y[0]-old[0]))*dt);}}const observed=hi-lo>8&&events.length>=3;return{z,eq:burstEquilibriaAudit(p,z),cycle:observed?{lo,hi,period:(events.at(-1)-events[0])/(events.length-1),count:events.length}:null,events,T,dt};}
