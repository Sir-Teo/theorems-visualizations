// Audited finite-cable protocol. Existing engine/builders are left unchanged.
import{HH,buildTree,buildMyelinated,treeSim}from'./ch04.shared.js';
export function positiveLogFit(points){const q=points.filter(p=>p[1]!==null&&Number.isFinite(p[1])&&p[1]>0);if(q.length<3)return null;const x=q.map(p=>Math.log(p[0])),y=q.map(p=>Math.log(p[1])),mx=x.reduce((a,b)=>a+b)/x.length,my=y.reduce((a,b)=>a+b)/y.length;return{slope:x.reduce((a,b,i)=>a+(b-mx)*(y[i]-my),0)/x.reduce((a,b)=>a+(b-mx)**2,0),sqrtC:Math.exp(my-.5*mx),mx,my,n:q.length};}
export function virtualCableVoltage(V,xs,x){if(x<=xs[0])return V[0];if(x>=xs.at(-1))return V.at(-1);let lo=0,hi=xs.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(xs[m]<x)lo=m;else hi=m;}const w=(x-xs[lo])/(xs[hi]-xs[lo]);return(1-w)*V[lo]+w*V[hi];}
export function uniformAxonAudit(d,{T=18.5,dx=50,dt=.01,tEnd=80,frames=0,length=30000,measure=[10000,24000]}={}){
 const tr=buildTree([{parent:-1,len:length,dia:d}],{dxMax:dx,Ra:35.4}),xs=tr.pos.slice(),arrivals=[null,null],prev=[-65,-65];let pt=0;
 const sim=treeSim(tr,{dt,tEnd,cm:1,gL:HH.gL,gNa:HH.gNa,gK:HH.gK,EL:HH.EL,ENa:HH.ENa,EK:HH.EK,T,stim:(t,I)=>{if(t>0&&t<=.5)for(let i=0;i<tr.n&&xs[i]-tr.len[i]/2<1000;i++){const overlap=Math.max(0,Math.min(xs[i]+tr.len[i]/2,1000)-Math.max(0,xs[i]-tr.len[i]/2));I[i]=500*tr.area[i]*1000*overlap/tr.len[i];}},rec:[],frames,
  stopWhen:(t,V)=>{for(let k=0;k<2;k++){const w=virtualCableVoltage(V,xs,measure[k]);if(arrivals[k]===null&&prev[k]<0&&w>=0&&t>pt)arrivals[k]=pt+(t-pt)*(-prev[k])/(w-prev[k]);prev[k]=w;}pt=t;return!frames&&arrivals.every(x=>x!==null);}});
 const speed=arrivals.every(x=>x!==null)&&arrivals[1]>arrivals[0]?(measure[1]-measure[0])*1e-3/(arrivals[1]-arrivals[0]):null;
 return{tr,xs,sim,arrivals,speed,dt,dx:tr.len[0],T,tEnd,measure};
}
