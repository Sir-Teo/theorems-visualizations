// Independent DOP853 encounter references in tests/verification-astro-source-audit-rings-reference.py.
// Finite starting boundaries500/1000 Hill radii, extrapolated in1/Y. Values are numerical, not rigorous enclosures.
import {TAU} from './ch03.shared.js';
const TABLE=[
 [2.6,1.6773165179130571],
 [2.8,0.5758599858790818],
 [3,0.29208377623330595],
 [3.25,0.15375927418632784],
 [3.5,0.09134520604155583],
 [3.8,0.0538063003046334],
 [4.2,0.02950527422731053],
 [4.7,0.015584211612323706],
 [5.3,0.00809381830307121],
 [6,0.004192738133387053],
 [7,0.0018801393025960067],
 [8.5,0.0006975492800087579],
 [10,0.00030607972258778204],
 [12,0.00012184283629324],
 [16,2.882074560517367e-05],
 [24,3.808271941352359e-06],
 [32,8.907813082714711e-07]];
export function auditedHillKick(D){const x=Math.abs(D);if(x<2.6)return NaN;const last=TABLE.at(-1);if(x>=last[0])return Math.sign(D)*last[1]*(last[0]/x)**5;let i=0;while(TABLE[i+1][0]<x)i++;const[a,u]=TABLE[i],[b,w]=TABLE[i+1],t=Math.log(x/a)/Math.log(b/a);return Math.sign(D)*Math.exp(Math.log(u)*(1-t)+Math.log(w)*t);}
export function ringStats(arr,mask){const keep=Array.from(arr).filter((_,i)=>!mask?.[i]);if(!keep.length)return{count:0,rms:null};const mean=keep.reduce((a,b)=>a+b,0)/keep.length;return{count:keep.length,rms:Math.sqrt(keep.reduce((a,b)=>a+(b-mean)**2,0)/keep.length)};}
export function advanceToyRing(st,dt,{mu,sigma,moons=true}){
 const RH=Math.cbrt(mu/3),am=[.93,1.07],old=st.mph.slice();for(let j=0;j<2;j++)st.mph[j]+=TAU*dt*am[j]**-1.5;
 const inBox=x=>Number.isFinite(x)&&x>=.8&&x<=1.2;
 for(let i=0;i<st.a.length;i++){
  const z=(st.rng()+st.rng()+st.rng()+st.rng()-2)*Math.sqrt(3),noise=sigma*Math.sqrt(dt)*z;
  if(!st.lostB[i]){st.b[i]+=noise;if(!inBox(st.b[i])){st.lostB[i]=1;st.b[i]=Math.min(1.2,Math.max(.8,st.b[i]));}else st.pb[i]+=TAU*dt*st.b[i]**-1.5;}
  if(st.lost[i])continue;st.a[i]+=noise;if(!inBox(st.a[i])){st.lost[i]=2;st.a[i]=Math.min(1.2,Math.max(.8,st.a[i]));continue;}
  const dph=TAU*dt*st.a[i]**-1.5;
  if(moons)for(let j=0;j<2;j++){
   const before=st.ph[i]-old[j],after=st.ph[i]+dph-st.mph[j];
   if(Math.floor(before/TAU)!==Math.floor(after/TAU)){
    const kick=auditedHillKick((st.a[i]-am[j])/(am[j]*RH));
    if(!Number.isFinite(kick)){st.lost[i]=1;break;}
    st.a[i]+=am[j]*RH*kick;if(!inBox(st.a[i])){st.lost[i]=2;st.a[i]=Math.min(1.2,Math.max(.8,st.a[i]));break;}
   }
  }
  st.ph[i]+=dph;
 }
 st.t+=dt;
}

export function ringHistogram(arr,mask){const nb=48,lo=.8,hi=1.2,dx=(hi-lo)/nb,counts=Array(nb).fill(0);for(let i=0;i<arr.length;i++){if(mask?.[i])continue;const j=Math.min(nb-1,Math.floor((arr[i]-lo)/dx));if(j>=0&&j<nb)counts[j]+=1/(arr.length*dx);}return{edges:Array.from({length:nb+1},(_,j)=>lo+j*dx),counts};}
