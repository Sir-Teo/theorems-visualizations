import {matroidTest,popc,greedyIndep,bestIndep} from './ch10.shared.js';

export function scheduleStats(jobs,order){
 let time=0,L=-Infinity,inversions=0;const rows=[];
 for(let k=0;k<order.length;k++){
  const id=order[k],j=jobs[id],a=time;time+=j.t;const l=time-j.d;L=Math.max(L,l);rows.push({id,a,c:time,d:j.d,l});
  for(let z=k+1;z<order.length;z++)if(j.d>jobs[order[z]].d)inversions++;
 }return{rows,L,inversions,time};
}
export function swapFirstInversion(jobs,order){
 const before=scheduleStats(jobs,order);
 for(let k=0;k+1<order.length;k++)if(jobs[order[k]].d>jobs[order[k+1]].d){const next=order.slice();[next[k],next[k+1]]=[next[k+1],next[k]];const after=scheduleStats(jobs,next);return{order:next,k,before:before.L,after:after.L,inversionsBefore:before.inversions,inversionsAfter:after.inversions};}
 return{order:order.slice(),none:true};
}
export function exchangeCounterexample(sys){
 const test=matroidTest(sys);if(!test.nonempty||!test.hereditary)throw new RangeError('a nonempty hereditary family is required');
 if(!test.witness)return null;
 const{A,B}=test.witness,m=popc(A),weights=Array.from({length:sys.n},(_,i)=>(A>>i&1)?m+2:(B>>i&1)?m+1:0),greedy=greedyIndep(sys,weights),best=bestIndep(sys,weights);
 return{A,B,weights,greedy,best,margin:best.weight-greedy.weight};
}
