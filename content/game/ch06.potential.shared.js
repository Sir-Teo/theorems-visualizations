// Complete finite-state certificates; potential is an incentive function, not welfare.
import {Q,quantity}from './ch06.selection.shared.js';
const {add,sub,mul,sign}=Q;
const BASES={
 'staircase base':[[0,-2,-3],[1,2,0],[-1,3,4]],
 'matching base':[[0,-1,-4],[-1,0,-1],[-4,-1,0]],
 'two peaks base':[[4,0,1],[0,3,0],[1,0,4]],
 'flat base':[[0,0,0],[0,0,0],[0,0,0]],
};
function bound(x,a,b,label,integer=false){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b||integer&&!Number.isInteger(x))throw Error(label+' outside declared range');}
export const POTENTIAL_LANDSCAPES=Object.freeze(Object.keys(BASES));
export function potentialGame({landscape='staircase base',coupling=0,rowBias=0,columnBias=0,opponentOffset=1,startRow=0,startColumn=0,step=0,priority='row first'}={}){
 if(!Object.hasOwn(BASES,landscape))throw Error('unknown potential landscape');
 if(!['row first','column first','largest gain'].includes(priority))throw Error('unknown improving-player priority');
 for(const[label,x]of Object.entries({coupling,rowBias,columnBias,opponentOffset}))bound(x,-2,2,label);
 bound(startRow,0,2,'starting row',true);bound(startColumn,0,2,'starting column',true);bound(step,0,8,'requested improving-move count',true);
 const phi=(r,c)=>add(add(add(BASES[landscape][r][c],mul(coupling,r*c)),mul(rowBias,r)),mul(columnBias,c));
 const utility=(r,c,player)=>player==='row'?add(phi(r,c),mul(opponentOffset,c)):sub(phi(r,c),mul(opponentOffset,r));
 const inventory=[];
 for(let row=0;row<3;row++)for(let column=0;column<3;column++){
  const deviations=[];
  for(const player of ['row','column'])for(let target=0;target<3;target++){
   if(target===(player==='row'?row:column))continue;
   const targetRow=player==='row'?target:row,targetColumn=player==='column'?target:column;
   const gain=sub(utility(targetRow,targetColumn,player),utility(row,column,player)),potentialChange=sub(phi(targetRow,targetColumn),phi(row,column));
   deviations.push({player,targetRow,targetColumn,payoffChange:quantity(gain),potentialChange:quantity(potentialChange),identityResidual:quantity(sub(gain,potentialChange)),improves:sign(gain)>0});
  }
  inventory.push({row,column,potential:quantity(phi(row,column)),payoffs:[quantity(utility(row,column,'row')),quantity(utility(row,column,'column'))],nash:deviations.every(d=>!d.improves),deviations});
 }
 const lookup=(r,c)=>inventory[3*r+c];
 const entry=(r,c,move=null)=>({row:r,column:c,potential:lookup(r,c).potential,payoffs:lookup(r,c).payoffs,playerMoved:move?.player??null,payoffGain:move?.payoffChange??quantity(0),potentialGain:move?.potentialChange??quantity(0),identityResidual:move?.identityResidual??quantity(0)});
 const path=[entry(startRow,startColumn)],seen=new Set([3*startRow+startColumn]);
 while(true){
  const current=path.at(-1),available=lookup(current.row,current.column).deviations.filter(d=>d.improves);
  if(!available.length)break;
  let candidates=available;
  if(priority!=='largest gain'){
   const preferred=priority==='row first'?'row':'column',preferredMoves=available.filter(d=>d.player===preferred);
   if(preferredMoves.length)candidates=preferredMoves;
  }
  const chosen=[...candidates].sort((a,b)=>sign(sub(b.payoffChange.exact,a.payoffChange.exact))||(a.player===b.player?0:a.player==='row'?-1:1)||a.targetRow-b.targetRow||a.targetColumn-b.targetColumn)[0];
  const nextKey=3*chosen.targetRow+chosen.targetColumn;
  if(seen.has(nextKey))throw Error('strict potential ascent revisited a state');
  seen.add(nextKey);path.push(entry(chosen.targetRow,chosen.targetColumn,chosen));
 }
 const displayedStep=Math.min(step,path.length-1),current=path[displayedStep],maximum=inventory.reduce((a,b)=>sign(sub(a.potential.exact,b.potential.exact))>=0?a:b).potential;
 return{parameters:{landscape,coupling,rowBias,columnBias,opponentOffset,startRow,startColumn,step,priority},inventory,path,displayedStep,current,haltedAtDisplayedState:lookup(current.row,current.column).nash,terminal:lookup(path.at(-1).row,path.at(-1).column),equilibria:inventory.filter(s=>s.nash).map(({row,column})=>({row,column})),potentialMaximum:maximum,globalMaxima:inventory.filter(s=>!sign(sub(s.potential.exact,maximum.exact))).map(({row,column})=>({row,column})),allDeviationIdentitiesVerified:inventory.every(s=>s.deviations.every(d=>!d.identityResidual.sign)),pathStrictlyIncreases:path.slice(1).every(s=>s.potentialGain.sign>0),scope:'Two players with three actions each. Own payoff equals the authored potential plus a function only of the opponent action. All36unilateral deviations are checked exactly. Strict improving moves ascend the potential and terminate in at most8moves; indifferent moves are excluded. Requesting later steps holds the terminal state. The potential is not total payoff, and the path need not reach a global potential maximum.'};
}
