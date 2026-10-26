// Finite anonymous unweighted players; deviations update all resource loads first.
import {Q,quantity}from './ch06.selection.shared.js';
const {add,sub,mul,div,sign}=Q;
const ROUTES=[[0,1],[2,3],[0,4,3]];
function bound(x,a,b,label,integer=false){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b||integer&&!Number.isInteger(x))throw Error(label+' outside declared range');}
export function atomicCongestion({players=4,slope=1,constantLatency=3.25,shortcutLatency=0,initialUpperRequests=2,initialLowerRequests=2,step=0,priority='largest decrease'}={}){
 bound(players,1,8,'unit players',true);bound(slope,0,2,'variable-link slope');bound(constantLatency,0,6,'constant-link latency');bound(shortcutLatency,0,3,'shortcut latency');
 bound(initialUpperRequests,0,8,'upper-route allocation request',true);bound(initialLowerRequests,0,8,'lower-route remaining allocation request',true);bound(step,0,44,'requested improving-move count',true);
 if(!['largest decrease','first available'].includes(priority))throw Error('unknown improving-switch order');
 const a=Q.exact(slope),c=Q.exact(constantLatency),k=Q.exact(shortcutLatency);
 const resources=counts=>{
  const [u,l,z]=counts,loads=[u+z,u,l,l+z,z],latencies=[mul(a,loads[0]),c,c,mul(a,loads[3]),k];
  const routeCosts=ROUTES.map(route=>route.reduce((sum,index)=>add(sum,latencies[index]),Q.ZERO));
  const potential=add(add(add(mul(a,loads[0]*(loads[0]+1)/2),mul(a,loads[3]*(loads[3]+1)/2)),mul(c,loads[1]+loads[2])),mul(k,loads[4]));
  const totalCost=loads.reduce((sum,n,j)=>add(sum,mul(n,latencies[j])),Q.ZERO);
  return{loads,latencies,routeCosts,potential,totalCost};
 };
 const inventory=[],byKey=new Map();
 for(let u=0;u<=players;u++)for(let l=0;l<=players-u;l++){
  const counts=[u,l,players-u-l],before=resources(counts),deviations=[];
  for(let from=0;from<3;from++)if(counts[from])for(let to=0;to<3;to++)if(from!==to){
   const targetCounts=[...counts];targetCounts[from]--;targetCounts[to]++;
   const after=resources(targetCounts),costChange=sub(after.routeCosts[to],before.routeCosts[from]),potentialChange=sub(after.potential,before.potential);
   deviations.push({from,to,targetCounts,costBefore:quantity(before.routeCosts[from]),costAfter:quantity(after.routeCosts[to]),ownCostChange:quantity(costChange),potentialChange:quantity(potentialChange),identityResidual:quantity(sub(costChange,potentialChange)),improves:sign(costChange)<0});
  }
  const state={counts,resourceLoads:before.loads,resourceLatencies:before.latencies.map(quantity),routeCosts:before.routeCosts.map(quantity),potential:quantity(before.potential),totalCost:quantity(before.totalCost),meanCost:quantity(div(before.totalCost,players)),nash:deviations.every(d=>!d.improves),deviations};
  inventory.push(state);byKey.set(counts.join(','),state);
 }
 const upper=Math.min(players,initialUpperRequests),lower=Math.min(players-upper,initialLowerRequests),initialCounts=[upper,lower,players-upper-lower];
 const state=counts=>byKey.get(counts.join(','));
 const entry=(counts,move=null)=>{const s=state(counts);return{counts:[...counts],potential:s.potential,totalCost:s.totalCost,meanCost:s.meanCost,from:move?.from??null,to:move?.to??null,ownCostDecrease:move?quantity(Q.neg(move.ownCostChange.exact)):quantity(0),potentialDecrease:move?quantity(Q.neg(move.potentialChange.exact)):quantity(0),identityResidual:move?.identityResidual??quantity(0)};};
 const path=[entry(initialCounts)],seen=new Set([initialCounts.join(',')]);
 while(true){
  const available=state(path.at(-1).counts).deviations.filter(d=>d.improves);
  if(!available.length)break;
  const chosen=priority==='first available'?available[0]:[...available].sort((a,b)=>sign(sub(a.ownCostChange.exact,b.ownCostChange.exact))||a.from-b.from||a.to-b.to)[0];
  const key=chosen.targetCounts.join(',');if(seen.has(key))throw Error('strict Rosenthal descent revisited a state');
  seen.add(key);path.push(entry(chosen.targetCounts,chosen));
 }
 const displayedStep=Math.min(step,path.length-1),current=path[displayedStep],minimumCost=inventory.reduce((a,b)=>sign(sub(a.totalCost.exact,b.totalCost.exact))<=0?a:b).totalCost,minimumPotential=inventory.reduce((a,b)=>sign(sub(a.potential.exact,b.potential.exact))<=0?a:b).potential;
 return{parameters:{players,slope,constantLatency,shortcutLatency,initialUpperRequests,initialLowerRequests,step,priority},initialCounts,inventory,path,displayedStep,current,currentState:state(current.counts),terminal:state(path.at(-1).counts),equilibria:inventory.filter(s=>s.nash).map(s=>[...s.counts]),minimumCost,costMinimizers:inventory.filter(s=>!sign(sub(s.totalCost.exact,minimumCost.exact))).map(s=>[...s.counts]),minimumPotential,potentialMinimizers:inventory.filter(s=>!sign(sub(s.potential.exact,minimumPotential.exact))).map(s=>[...s.counts]),currentExcessCost:quantity(sub(current.totalCost.exact,minimumCost.exact)),allDeviationIdentitiesVerified:inventory.every(s=>s.deviations.every(d=>!d.identityResidual.sign)),pathStrictlyDecreases:path.slice(1).every(s=>s.potentialDecrease.sign>0),scope:'Unweighted identical unit players on three routes of the declared five-resource network. The upper allocation request is filled up to N, then the lower request up to the remaining players; all others start on the shortcut. Every anonymous route-count state and every available unilateral switch is enumerated. New route costs use post-switch loads. Rosenthal potential decreases exactly by the moving player cost decrease, while total travel cost need not decrease. Indifferent switches are excluded; requesting steps beyond termination holds the terminal state. No nonatomic 4/3 bound is asserted for this atomic model.'};
}
