// Source-audited single-action dining model and finite erasure experiment.
import {mulberry32} from './ch04.shared.js';
export const diningClass = pc => pc===0?0:pc<=2?1:pc===5?3:2;
export function diningEngine(n,{rule='coin',lefty=false,rng=()=>0.5}={}) {
 const E={n,pc:Array(n).fill(0),own:Array(n).fill(-1),eat:Array(n).fill(0),side:Array.from({length:n},(_,i)=>lefty&&i===n-1?1:0)};
 E.stepOne=(i,forcedCoin)=>{
  const first=E.side[i]===0?i:(i+1)%n,second=E.side[i]===0?(i+1)%n:i;
  switch(E.pc[i]){
   case 0:E.pc[i]=1;break;
   case 1:if(rule==='coin')E.side[i]=(forcedCoin===undefined?rng()<.5:forcedCoin===0)?0:1;E.pc[i]=2;break;
   case 2:if(E.own[first]<0){E.own[first]=i;E.pc[i]=3;}break;
   case 3:if(E.own[second]<0){E.own[second]=i;E.pc[i]=5;E.eat[i]++;}else if(rule!=='hold')E.pc[i]=4;break;
   case 4:E.own[first]=-1;E.pc[i]=1;break;
   case 5:E.pc[i]=6;break;
   case 6:E.own[first]=-1;E.pc[i]=7;break;
   case 7:E.own[second]=-1;E.pc[i]=0;break;
  }
 };
 E.lockstep=()=>{for(let i=0;i<n;i++)E.stepOne(i);}; // cyclic INTERLEAVING, never simultaneous fork accesses
 E.sequential=()=>{for(let i=0;i<n;i++)for(let j=0;j<8;j++)E.stepOne(i);};
 E.key=()=>E.pc.join(',')+'|'+E.own.join(',')+'|'+E.side.join(',');
 return E;
}
export function diningRun(n,steps,seed,rule='coin',schedule='rand'){
 const coin=mulberry32(seed*7919+n*31+1),pick=mulberry32(seed*104729+n*17+11),E=diningEngine(n,{rule,rng:coin});let first=null;
 for(let t=0;t<steps;t++){const i=schedule==='lock'?t%n:Math.floor(pick()*n);E.stepOne(i);if(first===null&&E.eat.some(x=>x>0))first=t+1;}
 return {E,first,steps};
}
export function erasureExperiment(m,covered,outside=false,rmw=false){
 const cover=[...covered].sort((a,b)=>a-b),free=Array.from({length:m},(_,i)=>i).find(i=>!covered.has(i)),writes=outside&&free!==undefined?[...cover,free]:cover.slice();
 const before=Array(m).fill(0),afterP=before.slice();for(const i of writes)afterP[i]=1;
 const baseline=before.slice(),afterBlock=afterP.slice(),returns0=[],returns1=[];
 for(const i of cover){if(rmw){returns0.push(baseline[i]);returns1.push(afterBlock[i]);baseline[i]=afterBlock[i]=1;}else baseline[i]=afterBlock[i]=0;}
 const sameMemory=baseline.every((x,i)=>x===afterBlock[i]),sameLocals=returns0.every((x,i)=>x===returns1[i]);
 return {cover,writes,free,before,afterP,baseline,afterBlock,returns0,returns1,sameMemory,sameLocals,erased:sameMemory&&sameLocals};
}
export function bulkConcurrency(spec,steps,seed){
 const r=mulberry32(seed),S=spec.init(),n=spec.n,entries=Array(n).fill(0),wait=Array(n).fill(0),longest=Array(n).fill(0);let viol=0;
 for(let t=0;t<steps;t++){const p=Math.floor(r()*n),before=spec.reg(S,p);spec.step(S,p);if(before!=='C'&&spec.reg(S,p)==='C')entries[p]++;for(let q=0;q<n;q++){wait[q]=spec.reg(S,q)==='T'?wait[q]+1:0;longest[q]=Math.max(longest[q],wait[q]);}if(spec.regs(S).filter(x=>x==='C').length>=2)viol++;}
 const key=JSON.stringify(S),frozen=Array.from({length:n},(_,p)=>{const T=JSON.parse(key);spec.step(T,p);return JSON.stringify(T)===key;}).every(Boolean);
 return {viol,entries,longest,frozen,seed,state:S};
}
