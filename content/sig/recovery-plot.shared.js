import {NG,iOf,tOf} from './ch02.shared.js';

/** Keep every recovered sample, including isolated spikes between ordinary samples.
 * Finite off-scale values stay unchanged in the path; edge markers explain clipping.
 * Nonfinite values break the path and receive a separate, explicitly nonfinite mark.
 */
export function recoveryPlot(ys,{a=-5.2,b=5.2,ymin=-1.9,ymax=2.1}={}){
  const points=[],above=[],below=[],nonFinite=[];
  for(let i=Math.max(0,iOf(a));i<=Math.min(NG,iOf(b));i++){
    const value=ys[i],t=tOf(i),sample={index:i,t,value};
    if(!Number.isFinite(value)){points.push(null);nonFinite.push(sample);}
    else{points.push([t,value]);if(value>ymax)above.push(sample);else if(value<ymin)below.push(sample);}
  }
  return{points,above,below,nonFinite};
}
