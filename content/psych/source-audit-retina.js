import { RETINA_TEMPORAL } from './source-audit-retina-data.js';
export { RETINA_TEMPORAL };
export const retinaX=e=>Math.log10(1+e),retinaY=density=>Math.log10(1+density);
export function retinaNearest(x){if(!Number.isFinite(x))throw new RangeError('Finite display coordinate required');let k=0;for(let i=1;i<RETINA_TEMPORAL.length;i++)if(Math.abs(retinaX(RETINA_TEMPORAL[i].degrees)-x)<Math.abs(retinaX(RETINA_TEMPORAL[k].degrees)-x))k=i;return k;}
/** Integer icons approximate a 900-µm² area's count; layout/size are authored. */
export function retinaView(index,emphasis='both'){
 if(!Number.isInteger(index)||index<0||index>=RETINA_TEMPORAL.length||!['both','cones','rods'].includes(emphasis))throw new RangeError('Source index0–27 and declared emphasis required');
 const sample=RETINA_TEMPORAL[index],expectedCones=sample.cones*.0009,expectedRods=sample.rods*.0009,coneCount=Math.round(expectedCones),rodCount=Math.round(expectedRods),n=coneCount+rodCount,side=Math.ceil(Math.sqrt(n)),slots=Array.from({length:side*side},(_,i)=>i);let seed=1729;
 for(let i=slots.length-1;i>0;i--){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;const j=(seed>>>0)%(i+1);[slots[i],slots[j]]=[slots[j],slots[i]];}
 const cells=slots.slice(0,n).map((s,i)=>({x:30*((s%side)+.5+.12*Math.sin(s*2.37))/side,y:30*(Math.floor(s/side)+.5+.12*Math.cos(s*1.73))/side,cone:i<coneCount,alpha:emphasis==='both'||(i<coneCount)===(emphasis==='cones')?1:.18}));
 return{index,emphasis,...sample,expectedCones,expectedRods,coneCount,rodCount,cells,coneCurve:RETINA_TEMPORAL.map(p=>[retinaX(p.degrees),retinaY(p.cones)]),rodCurve:RETINA_TEMPORAL.map(p=>[retinaX(p.degrees),retinaY(p.rods)])};
}
/** Authored log10(relative threshold) branches. No dose calibration or data fit. */
export const darkCone=t=>-2.3+3.3*Math.exp(-t/1.6);
export const darkRod=(t,t0)=>t<=t0?5:-6+11*Math.exp(-(t-t0)/5.5);
export function darkAdaptation(t0,mode='both',time=8){
 if(!Number.isFinite(t0)||t0<.5||t0>4||!['both','cone','rod'].includes(mode)||!Number.isFinite(time)||time<0||time>40)throw new RangeError('Delay.5–4, time0–40 and declared branch isolation required');
 const diff=t=>darkRod(t,t0)-darkCone(t);let lo=t0,hi=40;for(let i=0;i<80&&hi-lo>1e-13;i++){const mid=(lo+hi)/2;if(diff(mid)>0)lo=mid;else hi=mid;}
 const t=(lo+hi)/2,crossing={t,y:darkCone(t),residual:diff(t),lo,hi},selected=x=>mode==='cone'?darkCone(x):mode==='rod'?darkRod(x,t0):Math.min(darkCone(x),darkRod(x,t0)),times=[...new Set([...Array.from({length:401},(_,i)=>i/10),t0,t])].sort((a,b)=>a-b);
 return{t0,mode,time,crossing,value:selected(time),coneAtTime:darkCone(time),rodAtTime:darkRod(time,t0),coneCurve:times.map(x=>[x,darkCone(x)]),rodCurve:times.map(x=>[x,darkRod(x,t0)]),selectedCurve:times.map(x=>[x,selected(x)])};
}
