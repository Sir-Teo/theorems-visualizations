// Numerical paths in log-ratio coordinates; exact instantaneous certificates are separate.
import {Q,quantity,selection2,hawkDove}from './ch06.selection.shared.js';
const {add,sub,mul,div,sign}=Q;
function bound(x,a,b,label,integer=false){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b||integer&&!Number.isInteger(x))throw Error(label+' outside declared range');}
const sum=xs=>xs.reduce(add,Q.ZERO),dot=(a,b)=>sum(a.map((x,i)=>mul(x,b[i])));
function exactField(A,x){const payoffs=A.map(row=>dot(row,x)),mean=dot(x,payoffs),velocity=x.map((s,i)=>mul(s,sub(payoffs[i],mean)));return{payoffs:payoffs.map(quantity),meanPayoff:quantity(mean),velocity:velocity.map(quantity),conservationResidual:quantity(sum(velocity))};}
function fromLogs(y,support,dimension){const all=Array(dimension).fill(-Infinity);support.forEach((s,i)=>all[s]=i===support.length-1?0:y[i]);const largest=Math.max(...all),weights=all.map(x=>Number.isFinite(x)?Math.exp(x-largest):0),denominator=weights.reduce((a,b)=>a+b,0),logDenominator=largest+Math.log(denominator);return{shares:weights.map(x=>x/denominator),logShares:all.map(x=>x-logDenominator)};}
function rk4(y,h,fn){const k1=fn(y),k2=fn(y.map((x,i)=>x+h*k1[i]/2)),k3=fn(y.map((x,i)=>x+h*k2[i]/2)),k4=fn(y.map((x,i)=>x+h*k3[i]));return y.map((x,i)=>x+h*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);}
function trajectory(A,initial,time,samples){
 const n=A.length,support=initial.map((x,i)=>sign(x)>0?i:-1).filter(i=>i>=0),reference=support.at(-1),numbers=A.map(row=>row.map(Q.approximate)),start=support.slice(0,-1).map(i=>Q.logAbs(initial[i])-Q.logAbs(initial[reference])),amplitude=Math.max(1,...numbers.flat().map(Math.abs));
 const derivative=y=>{const x=fromLogs(y,support,n).shares,payoff=numbers.map(row=>row.reduce((a,z,i)=>a+z*x[i],0));return support.slice(0,-1).map(i=>payoff[i]-payoff[reference]);};
 const solve=steps=>{let y=[...start];const path=[];for(let j=0;j<samples;j++){
  const z=fromLogs(y,support,n),t=time*j/(samples-1);if(j===0)z.shares=initial.map(Q.approximate);
  const payoff=numbers.map(row=>row.reduce((a,aij,i)=>a+aij*z.shares[i],0)),mean=z.shares.reduce((a,x,i)=>a+x*payoff[i],0);
  path.push({time:t,...z,payoffs:payoff,meanPayoff:mean,conservationError:z.shares.reduce((a,b)=>a+b,0)-1,positiveComponentsBelowRange:support.filter(i=>z.shares[i]===0)});
  if(j<samples-1)for(let k=0;k<steps;k++)y=rk4(y,time/(samples-1)/steps,derivative);
 }return path;};
 let steps=Math.max(1,Math.ceil(time*amplitude*12/(samples-1))),coarse=solve(steps),fine,error=0;
 for(let attempt=0;attempt<8;attempt++){fine=solve(steps*2);error=Math.max(...fine.flatMap((p,j)=>p.shares.map((x,i)=>Math.abs(x-coarse[j].shares[i]))));if(error<=2e-8)break;coarse=fine;steps*=2;}
 if(error>2e-8)throw Error('trajectory step-halving discrepancy exceeds declared bound');
 return{path:fine,support,stepsPerOutputInterval:steps*2,maximumStepHalvingDifference:error,maximumConservationError:Math.max(...fine.map(x=>Math.abs(x.conservationError))),method:'RK4 in log ratios on the original support; step-halving discrepancy is a numerical diagnostic, not a rigorous global error bound. Positive components are never floored; their log shares survive physical underflow.'};
}
export function replicatorTwo({matrix=[[0,4],[2,2]],initialShare=.2,time=8,samples=61}={}){
 bound(initialShare,0,1,'initial first-strategy share');bound(time,0,12,'time');bound(samples,3,121,'output samples',true);const field=selection2({matrix,share:initialShare}),A=matrix.map(r=>r.map(Q.exact)),initial=[Q.exact(initialShare),sub(1,initialShare)],result=trajectory(A,initial,time,samples);
 return{parameters:{matrix:matrix.map(r=>[...r]),initialShare,time,samples},initialShares:initial.map(quantity),field,...result,scope:'Two-strategy replicator path. Boundary initial conditions remain on their original support even if a missing strategy could invade. Time and the finite trajectory are authored numerical illustrations; exact field/equilibrium classifications do not depend on the sampled path.'};
}
export function hawkPath({resource=4,fightingCost=8,hawkShare=.3,time=8,samples=61}={}){
 bound(time,0,12,'time');bound(samples,3,121,'output samples',true);const field=hawkDove({resource,fightingCost,hawkShare}),A=field.matrix.map(r=>r.map(x=>x.exact)),initial=[Q.exact(hawkShare),sub(1,hawkShare)];
 return{parameters:{resource,fightingCost,hawkShare,time,samples},initialShares:initial.map(quantity),field,...trajectory(A,initial,time,samples),scope:'Numerical Hawk–Dove replicator path formed from the original exact resource/cost payoff factors. Boundary support is preserved; exact field/equilibrium certificates remain separate from the finite path.'};
}
export function replicator({game='cyclic',win=1,loss=1,initialFirst=.6,initialSecond=.25,secondOfRemainder,time=16,samples=81}={}){
 if(!['cyclic','stable mixing','coordination'].includes(game))throw Error('unknown three-strategy teaching game');bound(win,.25,4,'win payoff');bound(loss,.25,4,'loss magnitude');bound(initialFirst,0,1,'initial first share');bound(initialSecond,0,1,'initial second share');bound(time,0,30,'time');bound(samples,3,121,'output samples',true);
 if(secondOfRemainder!==undefined)bound(secondOfRemainder,0,1,'second share of the remainder');
 const initial=secondOfRemainder===undefined?[Q.exact(initialFirst),Q.exact(initialSecond),sub(sub(1,initialFirst),initialSecond)]:[Q.exact(initialFirst),mul(sub(1,initialFirst),secondOfRemainder),mul(sub(1,initialFirst),sub(1,secondOfRemainder))];if(sign(initial[2])<0)throw Error('initial shares exceed one');
 const A=(game==='cyclic'?[[0,Q.neg(loss),win],[win,0,Q.neg(loss)],[Q.neg(loss),win,0]]:game==='stable mixing'?[[-1,0,0],[0,-1,0],[0,0,-1]]:[[1,0,0],[0,1,0],[0,0,1]]).map(r=>r.map(Q.exact));
 const center=Array(3).fill(div(1,3)),field=exactField(A,initial),payoffs=A.map(row=>dot(row,initial)),mean=dot(initial,payoffs),squareSum=dot(initial,initial),interior=initial.every(x=>sign(x)>0),klDerivative=interior?sub(mean,dot(center,payoffs)):null,logProductDerivative=interior?sub(sum(payoffs),mul(3,mean)):null;
 const cyclicIdentity=game==='cyclic'&&interior?sub(logProductDerivative,mul(div(sub(win,loss),2),sub(mul(3,squareSum),1))):null;
 const result=trajectory(A,initial,time,samples);result.path=result.path.map(p=>({...p,relativeEntropy:interior?-Math.log(3)-p.logShares.reduce((a,b)=>a+b,0)/3:null,logProduct:interior?p.logShares.reduce((a,b)=>a+b,0):null}));
 return{parameters:{game,win,loss,initialFirst,initialSecond,...secondOfRemainder===undefined?{}:{secondOfRemainder},time,samples},matrix:A.map(r=>r.map(quantity)),initialShares:initial.map(quantity),candidate:center.map(quantity),field,interior,relativeEntropyDerivative:klDerivative===null?null:quantity(klDerivative),logProductDerivative:logProductDerivative===null?null:quantity(logProductDerivative),cyclicIdentityResidual:cyclicIdentity===null?null:quantity(cyclicIdentity),squaredShareSum:quantity(squareSum),centerESS:game==='stable mixing'||game==='cyclic'&&sign(sub(win,loss))>0,regime:game==='stable mixing'?'strict interior ESS':game==='coordination'?'interior Nash point is unstable':sign(sub(win,loss))>0?'inward cyclic selection':sign(sub(win,loss))<0?'outward cyclic selection':'zero-sum cycles',...result,scope:'Symmetric one-population three-strategy replicator equation. Exact instantaneous fields, conservation and derivative identities use original rational coefficients. The candidate is exactly(1/3,1/3,1/3). With secondOfRemainder supplied, shares are formed exactly as[first,(1−first)split,(1−first)(1−split)], retaining positivity and unit sum even when products underflow. Relative entropy and log-product require all three shares positive; boundary paths retain their support and those diagnostics are undefined. Numerical paths and arrows do not certify stability or periodicity. The cyclic family is an authored payoff model, not fitted ecological observations.'};
}
