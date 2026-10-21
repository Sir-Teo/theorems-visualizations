import {rk4} from './ch03.shared.js';

// Chosen teaching parameters: this is not a fitted thiopental or wake-up model.
export const redistributionParameters = Object.freeze({V1:6,V2:22,V3:130,CL:.2,Q2:1,Q3:.3,ke0:.55,dose:300});
export function redistributionTrace({muscle=true,fat=true,liver=true,second=false,dt=.05,end=120}={}) {
  const P=redistributionParameters,Q2=muscle?P.Q2:0,Q3=fat?P.Q3:0,CL=liver?P.CL:0;
  const rhs=([a1,a2,a3,ce])=>{const c1=a1/P.V1,c2=a2/P.V2,c3=a3/P.V3;return[-CL*c1-Q2*(c1-c2)-Q3*(c1-c3),Q2*(c1-c2),Q3*(c1-c3),P.ke0*(c1-ce),CL*c1];};
  const out={t:[],c1:[],ce:[],a1:[],a2:[],a3:[],el:[],given:[]};
  let y=[P.dose,0,0,0,0],given=P.dose;
  const store=t=>{out.t.push(t);out.c1.push(y[0]/P.V1);out.ce.push(y[3]);out.a1.push(y[0]);out.a2.push(y[1]);out.a3.push(y[2]);out.el.push(y[4]);out.given.push(given);};
  const n=Math.round(end/dt),stride=Math.max(1,Math.round(.2/dt));
  for(let i=0;i<=n;i++){
    const t=i*dt;
    if(i%stride===0||i===n)store(t);
    // Both sides of the event preserve the central-concentration jump.
    if(second&&Math.abs(t-30)<dt/4){y[0]+=P.dose;given+=P.dose;store(t);}
    if(i<n)y=rk4(rhs,y,t,dt);
  }
  return out;
}
export function redistributionCrossings(trace,fraction){
  const peak=Math.max(...trace.ce.filter((_,i)=>trace.t[i]<30)),ip=trace.ce.indexOf(peak),threshold=peak*fraction,crossings=[];
  for(let i=ip+1;i<trace.t.length;i++)if(trace.ce[i-1]>threshold&&trace.ce[i]<=threshold){
    const w=(trace.ce[i-1]-threshold)/(trace.ce[i-1]-trace.ce[i]),t=trace.t[i-1]+w*(trace.t[i]-trace.t[i-1]);
    const state={t,given:trace.given[i]};for(const k of['a1','a2','a3','el'])state[k]=trace[k][i-1]+w*(trace[k][i]-trace[k][i-1]);crossings.push(state);
  }
  return {peak,peakTime:trace.t[ip],threshold,crossings};
}
