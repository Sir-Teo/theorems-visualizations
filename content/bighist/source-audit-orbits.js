import {fftReal} from '../../assets/js/viz/math.js';
const TAU=2*Math.PI,D2R=Math.PI/180;
export const orbitalConstants=Object.freeze({solar:1361,samples:2048,burn:1024,step:1});
function bounded(x,lo,hi){return typeof x==='number'&&Number.isFinite(x)&&x>=lo&&x<=hi;}
export function orbitalElements(t,eccentricity=true,tilt=true,precession=true){
 if(!Number.isFinite(t)||![eccentricity,tilt,precession].every(x=>typeof x==='boolean'))throw new RangeError('Invalid authored orbital arguments');
 // Chosen harmonics and phases: no ephemeris or present-day calibration is implied.
 const e=eccentricity?.028+.011*Math.cos(TAU*t/405)+.0083*Math.cos(TAU*t/124+1)+.0077*Math.cos(TAU*t/95+2.3):0,
 obliquity=tilt?23.3+1.2*Math.cos(TAU*t/41+1.49):23.3,
 perihelion=283*D2R+(precession?TAU*t/21:0);
 return{e,obliquity,perihelion,index:e*Math.sin(perihelion)};
}
export function dailySolstice(lat,e,obliquity,perihelion){
 if(!bounded(lat,-89,89)||!bounded(e,0,.1)||!bounded(obliquity,0,30)||!Number.isFinite(perihelion))throw new RangeError('Outside daily-insolation geometry domain');
 const phi=lat*D2R,delta=obliquity*D2R,c=-Math.tan(phi)*Math.tan(delta),H=c<=-1?Math.PI:c>=1?0:Math.acos(c),inverseRadius=(1+e*Math.cos(Math.PI/2-perihelion))/(1-e*e),
 Q=orbitalConstants.solar/Math.PI*inverseRadius**2*(H*Math.sin(phi)*Math.sin(delta)+Math.cos(phi)*Math.cos(delta)*Math.sin(H));
 return{Q,H,inverseRadius,annualGlobal:orbitalConstants.solar/(4*Math.sqrt(1-e*e))};
}
export function relaxIce(value,target,growth,melt,dt=1){
 if(![value,target].every(Number.isFinite)||!bounded(growth,1e-6,1e6)||!bounded(melt,1e-6,1e6)||!bounded(dt,0,1e6))throw new RangeError('Invalid relaxation arguments');
 const tau=target>value?growth:melt;
 // Exact for a held target: a convex combination, with no Euler overshoot.
 return value+(target-value)*(-Math.expm1(-dt/tau));
}
export function orbitalPower(values){
 const n=values.length;if(!Array.isArray(values)||n<2||(n&(n-1))||!Array.from(values).every(Number.isFinite))throw new RangeError('Finite power-of-two series required');
 const base=values[0],mean=base+values.reduce((s,x)=>s+x-base,0)/n,centered=values.map(x=>x-mean),{re,im}=fftReal(centered),freq=[],power=[];
 for(let k=0;k<=n/2;k++){freq.push(k/n);power.push(k===0?0:(re[k]**2+im[k]**2)/(n*n)*(k===n/2?1:2));}
 const maximum=Math.max(...power);return{freq,power,relative:power.map(x=>maximum===0?0:x/maximum),variance:power.reduce((s,x)=>s+x,0),maximum};
}
export function orbitalPeak(spectrum,lo,hi){
 let index=null;for(let i=1;i<spectrum.freq.length;i++)if(spectrum.freq[i]>=1/hi&&spectrum.freq[i]<=1/lo&&spectrum.power[i]>0&&(index===null||spectrum.power[i]>spectrum.power[index]))index=i;
 return index===null?null:{period:1/spectrum.freq[index],relative:spectrum.relative[index],bin:index};
}
export function orbitalModel(lat=65,growth=30,melt=10,eccentricity=true,tilt=true,precession=true){
 if(!bounded(lat,30,80)||!bounded(growth,10,150)||!bounded(melt,2,40)||![eccentricity,tilt,precession].every(x=>typeof x==='boolean'))throw new RangeError('Outside authored orbital-model controls');
 const{samples,burn}=orbitalConstants,total=samples+burn,time=Array.from({length:total},(_,i)=>i-total+1),elements=time.map(t=>orbitalElements(t,eccentricity,tilt,precession)),Q=elements.map(q=>dailySolstice(lat,q.e,q.obliquity,q.perihelion).Q),retained=Q.slice(burn),base=retained[0],mean=base+retained.reduce((s,x)=>s+x-base,0)/samples,
 sd=Math.max(...retained)===Math.min(...retained)?0:Math.sqrt(retained.reduce((s,x)=>s+(x-mean)**2,0)/samples),target=Q.map(x=>sd===0?0:-(x-mean)/sd),ice=[0];
 for(let i=1;i<total;i++)ice.push(relaxIce(ice[i-1],target[i-1],growth,melt));
 const retainedTarget=target.slice(burn),retainedIce=ice.slice(burn),forcingPower=orbitalPower(retainedTarget),icePower=orbitalPower(retainedIce),last=elements.at(-1),current=dailySolstice(lat,last.e,last.obliquity,last.perihelion),display=time.map((t,i)=>({t,Q:Q[i],target:target[i],ice:ice[i],...elements[i]})).filter(q=>q.t>=-800),maxAbs=Math.max(1,...display.flatMap(q=>[Math.abs(q.target),Math.abs(q.ice)]));
 return{lat,growth,melt,eccentricity,tilt,precession,time:time.slice(burn),Q:retained,target:retainedTarget,ice:retainedIce,mean,sd,forcingPower,icePower,display,maxAbs,current:{...last,...current},peaks:[[70,140],[36,46],[18,25]].map(([a,b])=>orbitalPeak(icePower,a,b)),displayRange:[Math.min(...display.map(q=>q.Q)),Math.max(...display.map(q=>q.Q))]};
}
