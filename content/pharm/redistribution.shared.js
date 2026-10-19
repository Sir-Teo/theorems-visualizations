import { rk4 } from './ch03.shared.js';
/** Illustrative amount-balanced redistribution; effect-site concentration has no separate mass. */
export function simulateRedistribution({V1=6,V2=22,V3=130,CL=.2,Q2=1,Q3=.3,ke0=.55,D=300,second=false,end=120,dt=.05}={}) {
 const field=([a,b,c,e])=>{const x=a/V1,y=b/V2,z=c/V3;return[-CL*x-Q2*(x-y)-Q3*(x-z),Q2*(x-y),Q3*(x-z),ke0*(x-e),CL*x];};
 const out={t:[],c1:[],ce:[],a1:[],a2:[],a3:[],el:[]};let y=[D,0,0,0,0],dosed=false;const n=Math.round(end/dt);
 for(let i=0;i<=n;i++){const t=i*dt;if(second&&!dosed&&t>=30){y[0]+=D;dosed=true;}if(i%4===0){out.t.push(t);out.c1.push(y[0]/V1);out.ce.push(y[3]);out.a1.push(y[0]);out.a2.push(y[1]);out.a3.push(y[2]);out.el.push(y[4]);}if(i<n)y=rk4(field,y,t,dt);}
 return out;
}
export function lastDownwardCrossing(t,c,threshold,after=0){let crossing=NaN;for(let i=1;i<t.length;i++)if(t[i]>=after&&c[i-1]>threshold&&c[i]<=threshold){const x=t[i-1]+(c[i-1]-threshold)/(c[i-1]-c[i])*(t[i]-t[i-1]);if(x>=after)crossing=x;}return crossing;}
