// Authored finite circulating-tuning model; named recipes follow Benson §5.13.
import {weRenderAudio,WE_C4} from './source-audit-wolf-equal.js';
export const WELL_FIFTH=1200*Math.log2(3/2),WELL_P=1200*Math.log2(531441/524288),WELL_S=1200*Math.log2(81/80);
export const WELL_CHAIN=Object.freeze(['E♭','B♭','F','C','G','D','A','E','B','F♯','C♯','G♯']);
const semi=[3,10,5,0,7,2,9,4,11,6,1,8],fold=x=>((x%1200)+1200)%1200;
export const WELL_RECIPES=Object.freeze({pyth:'Pythagorean cut',quarter:'quarter-comma cut',werckmeister:'Werckmeister III (Benson)',kirnberger:'Kirnberger III (Benson)',vallotti:'Vallotti recipe (Benson)',equal:'12-TET'});
export function wellRecipe(name){
 if(typeof name!=='string'||!Object.hasOwn(WELL_RECIPES,name))throw new RangeError('Unknown recipe');
 const d=Array(12).fill(0),put=(ids,x)=>ids.forEach(i=>d[i]=x);
 if(name==='pyth')d[11]=WELL_P;
 if(name==='quarter'){d.fill(WELL_S/4);d[11]=WELL_P-11*WELL_S/4;}
 if(name==='werckmeister')put([3,4,5,8],WELL_P/4);
 if(name==='kirnberger'){put([3,4,5,6],WELL_S/4);d[9]=WELL_P-WELL_S;}
 if(name==='vallotti')put([2,3,4,5,6,7],WELL_P/6);
 if(name==='equal')d.fill(WELL_P/12);
 return d;
}
export function wellValid(d){return Array.isArray(d)&&d.length===12&&Array.from({length:12},(_,i)=>Object.hasOwn(d,i)&&typeof d[i]==='number'&&Number.isFinite(d[i])&&d[i]>=-40&&d[i]<=25).every(Boolean)&&Math.abs(d.reduce((s,x)=>s+x,0)-WELL_P)<1e-9;}
export function wellRebalance(d,index,value){
 if(!wellValid(d)||!Number.isInteger(index)||index<0||index>11||!Number.isFinite(value)||value< -40||value>25)throw new RangeError('Bounded closing narrowings and handle required');
 // Project the other11 values onto their box and required sum with one common shift.
 const target=WELL_P-value,clamp=x=>Math.max(-40,Math.min(25,x));let lo=-65,hi=65;
 for(let k=0;k<70;k++){const m=(lo+hi)/2,sum=d.reduce((s,x,j)=>s+(j===index?0:clamp(x+m)),0);if(sum<target)lo=m;else hi=m;}
 const out=d.map((x,j)=>j===index?value:clamp(x+(lo+hi)/2));let residual=WELL_P-out.reduce((s,x)=>s+x,0);
 for(let j=0;j<12&&residual!==0;j++)if(j!==index){const x=clamp(out[j]+residual);residual-=x-out[j];out[j]=x;}
 if(!wellValid(out))throw new Error('Rebalance did not satisfy the declared model');return out;
}
export function wellModel(d=wellRecipe('werckmeister'),key=0){
 if(!wellValid(d)||(key!==0&&key!==6))throw new RangeError('Closing narrowings and C/F♯ key required');
 const fifths=d.map(x=>WELL_FIFTH-x),chain=Array(12).fill(0);
 for(let j=4;j<12;j++)chain[j]=chain[j-1]+fifths[j-1];for(let j=2;j>=0;j--)chain[j]=chain[j+1]-fifths[j];
 const pcs=Array(12);chain.forEach((x,j)=>pcs[semi[j]]=fold(x));
 const rows=WELL_CHAIN.map((name,j)=>{const sum=Array.from({length:4},(_,k)=>d[(j+k)%12]).reduce((a,b)=>a+b,0),major=4*WELL_FIFTH-2400-sum;return{name,j,narrowing:d[j],fifth:fifths[j],major,error:major-1200*Math.log2(5/4)};});
 const roots=[key,(key+5)%12,(key+7)%12,key],cadence=roots.map(r=>[0,4,7].map(n=>WE_C4*2**((pcs[r]+fold(pcs[(r+n)%12]-pcs[r]))/1200)));
 return{d:[...d],key,pcs,rows,cadence,narrowingResidual:d.reduce((s,x)=>s+x,0)-WELL_P,closureResidual:fifths.reduce((s,x)=>s+x,0)-8400,minFifth:Math.min(...fifths),maxFifth:Math.max(...fifths)};
}
export function wellAudio(d,key){const m=wellModel(d,key);return weRenderAudio(m.cadence,.8,.1);}
