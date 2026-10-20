// Authored bounded comparisons of exact equal-division definitions.
import {weRenderAudio,WE_C4} from './source-audit-wolf-equal.js';
export const EDO_TARGETS=Object.freeze({fifth:[3,2,'fifth'],major:[5,4,'major third'],minor:[6,5,'minor third'],seventh:[7,4,'harmonic seventh'],septimal:[7,6,'septimal third']});
export const EDO_CHOICES=Object.freeze([12,19,31]);
const logs=Object.fromEntries(Object.entries(EDO_TARGETS).map(([id,[p,q]])=>[id,Math.log2(p/q)]));
export function edoApproximation(n,target){
 if(!Number.isInteger(n)||n<3||n>700||typeof target!=='string'||!Object.hasOwn(EDO_TARGETS,target))throw new RangeError('Offered integer division and target required');
 const [p,q,name]=EDO_TARGETS[target],a=logs[target],k=Math.round(n*a),fraction=k/n;
 return{n,target,p,q,name,k,cents:1200*fraction,error:1200*(fraction-a),stepError:Math.abs(n*a-k),ratio:2**fraction};
}
export const EDO_RECORD_DATA=Object.freeze(Object.fromEntries(['fifth','major','seventh'].map(target=>{
 let best=Infinity;return[target,Object.freeze(Array.from({length:698},(_,j)=>{const x=edoApproximation(j+3,target),record=Math.abs(x.error)<best;if(record)best=Math.abs(x.error);return Object.freeze({...x,record});}))];
})));
export function edoRecordModel(n=12,target='fifth'){
 if(!Number.isInteger(n)||n<3||n>120||!Object.hasOwn(EDO_RECORD_DATA,target))throw new RangeError('Offered3–120 integer division and target required');
 const all=EDO_RECORD_DATA[target];return{n,target,current:all[n-3],points:all.slice(0,118),records:all.slice(0,118).filter(x=>x.record).map(x=>x.n),records700:all.filter(x=>x.record).map(x=>x.n)};
}
export function edoCompareModel(n=31){
 if(!EDO_CHOICES.includes(n))throw new RangeError('Offered12/19/31 division required');
 const p=1200*Math.log2(3/2),s=1200*Math.log2(81/80),generator=n===12?700:p-s/(n===19?3:4),fifth=edoApproximation(n,'fifth'),start=-Math.floor((n-1)/2),chain=Array.from({length:n},(_,j)=>{const k=start+j;return{k,meantone:((k*generator%1200)+1200)%1200,equal:((k*fifth.cents%1200)+1200)%1200,error:k*(generator-fifth.cents)};});
 const rows=EDO_CHOICES.flatMap(N=>Object.keys(EDO_TARGETS).map(id=>edoApproximation(N,id)));
 const chord=(N,seventh)=>['major','fifth',...(seventh?['seventh']:[])].map(t=>WE_C4*edoApproximation(N,t).ratio);
 return{n,step:1200/n,generator,fifth,chain,maxChainError:Math.max(...chain.map(x=>Math.abs(x.error))),closureError:n*generator-Math.round(n*generator/1200)*1200,rows,
   triad:[WE_C4,...chord(n,false)],seventh:[WE_C4,...chord(n,true)],triad12:[WE_C4,...chord(12,false)],seventh12:[WE_C4,...chord(12,true)]};
}
export function edoCompareAudio(n,action='triad'){
 const m=edoCompareModel(n);if(!['triad','seventh','pure'].includes(action))throw new RangeError('Unknown chord comparison');
 return weRenderAudio(action==='pure'?[[1,5/4,3/2,7/4].map(x=>WE_C4*x)]:action==='triad'?[m.triad12,m.triad]:[m.seventh12,m.seventh],.8,.1);
}
export function edoRecordAudio(n,target,action='tempered'){
 const m=edoRecordModel(n,target);if(!['tempered','pure'].includes(action))throw new RangeError('Unknown interval comparison');
 const [p,q]=EDO_TARGETS[target];return weRenderAudio([[WE_C4,WE_C4*(action==='pure'?p/q:m.current.ratio)]],.8,0);
}
