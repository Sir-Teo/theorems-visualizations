// Only the 3.15 authored direction/projection illustration, not an original data transcription.
import {D,V,dot,cross,vnorm,mod360,wrap180,velAt,azDiff} from './ch03.shared.js';
import {faultTangent} from './kinematics-audit.shared.js';
export const MP_POLE=[-85,50];
export const MP_SITES=[['Southern California',[-116.5,33.4]],['Parkfield',[-120.4,35.9]],['Cape Mendocino',[-124.2,40.4]],['Queen Charlotte',[-132.5,53]],['Fairweather',[-137.5,58.5]],['Kodiak',[-152,57]],['Shumagin',[-160,54.2]],['Unalaska',[-166,53]],['Andreanof',[-175,51.5]],['Rat Islands',[178,51.5]]];
export const MP_OFFSETS=[-.7,.3,1.1,-.5,.2,-1.4,.8,.6,-.1,-.3];
export function poleMap(point,pole,azimuth){
 const r=V(point),k=V(pole),cr=cross(k,r),sn=vnorm(cr),co=dot(k,r),delta=Math.atan2(sn,co)/D;
 if(sn<1e-10)return{delta,resolved:false,visible:false};
 const east=cr.map(x=>x/sn),north=k.map((x,i)=>(x-co*r[i])/sn),seed=Math.abs(k[2])<.99?[0,0,1]:[1,0,0],raw=cross(seed,k),ex=raw.map(x=>x/vnorm(raw)),ey=cross(k,ex);
 const xy=[Math.atan2(dot(r,ey),dot(r,ex))/D,Math.log(Math.tan((Math.PI-Math.atan2(sn,co))/2))/D];
 const t=faultTangent(point,azimuth),dir=[dot(t,east),dot(t,north)];
 return{delta,resolved:true,visible:delta>=5&&delta<=175,xy,dir};
}
export function mckenzieModel(pole,noise){
 const rows=MP_SITES.map(([name,point],i)=>{const observed=mod360(velAt(point,MP_POLE,-1).az+noise*MP_OFFSETS[i]),map=poleMap(point,pole,observed),predicted=map.resolved?velAt(point,pole,-1).az:null,residual=predicted===null?null:azDiff(predicted,observed);return{name,point,observed,predicted,residual,...map};});
 const resolved=rows.filter(r=>r.resolved),visible=rows.filter(r=>r.visible),rms=resolved.length===rows.length?Math.sqrt(resolved.reduce((s,r)=>s+r.residual**2,0)/rows.length):null;
 return{pole,noise,rows,rms,unresolved:rows.length-resolved.length,omitted:rows.length-visible.length};
}
export const oppositePole=([lon,lat])=>[wrap180(lon+180),-lat];
