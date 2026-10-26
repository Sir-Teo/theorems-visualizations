// Authored nonatomic routing families. The later atomic congestion model is separate.
import {Q,quantity}from './ch06.selection.shared.js';
const {add,sub,mul,div,sign}=Q;
const min=(a,b)=>sign(sub(a,b))<=0?Q.exact(a):Q.exact(b),max=(a,b)=>sign(sub(a,b))>=0?Q.exact(a):Q.exact(b);
const clip=(x,a,b)=>min(b,max(a,x)),square=x=>mul(x,x);
const pack=values=>Object.fromEntries(Object.entries(values).map(([k,v])=>[k,quantity(v)]));
function bound(x,a,b,label){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw Error(label+' outside declared range');}
function wardrop(flows,costs){
 const least=costs.reduce(min),gaps=costs.map(c=>sub(c,least)),residual=flows.reduce((sum,f,i)=>add(sum,mul(f,gaps[i])),Q.ZERO);
 return{least,gaps,residual,verified:gaps.every((g,i)=>sign(g)>=0&&(!sign(flows[i])||!sign(g)))};
}
const optimum=(x,limit,derivative)=>!sign(limit)||(sign(x)===0?sign(derivative)>=0:sign(sub(x,limit))===0?sign(derivative)<=0:sign(derivative)===0);

export function braess({demand=1,shortcutCost=0,selectedShortcutShare=1}={}){
 bound(demand,0,3,'nonatomic demand');bound(shortcutCost,0,2,'shortcut latency');bound(selectedShortcutShare,0,1,'selected shortcut share');
 const r=Q.exact(demand),k=Q.exact(shortcutCost),withoutEach=div(r,2);
 const zEq=clip(sub(mul(2,sub(1,k)),r),0,r),zOpt=clip(sub(sub(1,k),r),0,r),zSelected=mul(r,selectedShortcutShare);
 const outer=z=>div(sub(r,z),2),flows=z=>[outer(z),outer(z),z];
 const costs=z=>{const outside=add(div(add(r,z),2),1);return[outside,outside,add(add(r,z),k)];};
 const total=z=>add(add(div(square(add(r,z)),2),r),mul(sub(k,1),z));
 const withoutTotal=total(0),equilibriumTotal=total(zEq),optimalTotal=total(zOpt),selectedTotal=total(zSelected);
 const eq=wardrop(flows(zEq),costs(zEq)),selected=wardrop(flows(zSelected),costs(zSelected)),derivative=add(add(r,zOpt),sub(k,1));
 const physical={withoutEachFlow:withoutEach,withoutRouteLatency:add(withoutEach,1),withoutTotalCost:withoutTotal,equilibriumShortcutFlow:zEq,equilibriumOuterEach:outer(zEq),optimalShortcutFlow:zOpt,optimalOuterEach:outer(zOpt),selectedShortcutFlow:zSelected,selectedOuterEach:outer(zSelected),equilibriumTotalCost:equilibriumTotal,optimalTotalCost:optimalTotal,selectedTotalCost:selectedTotal,totalCostChange:sub(equilibriumTotal,withoutTotal),flowConservationResidual:sub(flows(zEq).reduce(add,Q.ZERO),r),wardropResidual:eq.residual,selectedWardropResidual:selected.residual,optimalDerivative:derivative,optimalityGap:sub(equilibriumTotal,optimalTotal)};
 return{parameters:{demand,shortcutCost,selectedShortcutShare},...pack(physical),equilibriumFlows:flows(zEq).map(quantity),equilibriumRouteLatencies:costs(zEq).map(quantity),equilibriumRouteGaps:eq.gaps.map(quantity),selectedFlows:flows(zSelected).map(quantity),selectedRouteLatencies:costs(zSelected).map(quantity),withoutMeanLatency:sign(r)?quantity(div(withoutTotal,r)):null,equilibriumMeanLatency:sign(r)?quantity(div(equilibriumTotal,r)):null,optimalMeanLatency:sign(r)?quantity(div(optimalTotal,r)):null,priceOfAnarchy:sign(optimalTotal)?quantity(div(equilibriumTotal,optimalTotal)):null,wardropVerified:eq.verified,optimumVerified:optimum(zOpt,r,derivative),shortcutComparison:!sign(r)?'no traffic; mean latency and ratio undefined':sign(sub(equilibriumTotal,withoutTotal))>0?'shortcut worsens equilibrium travel time':sign(sub(equilibriumTotal,withoutTotal))<0?'shortcut improves equilibrium travel time':'shortcut leaves equilibrium travel time unchanged',scope:'Declared symmetric nonatomic Braess family: two variable links with latency equal to their own flow, two latency-one links, and a directed shortcut with nonnegative latency k. The full route-count decomposition is upper/lower/shortcut. Wardrop compares infinitesimal deviations at fixed edge loads. The optimum is global by a convex quadratic reduction, not a sampled flow search.'};
}

export function pigou({slope=1,intercept=0,constantCost=1,selectedFlow=.75}={}){
 bound(slope,0,4,'nonnegative variable-link slope');bound(intercept,0,2,'nonnegative variable-link intercept');bound(constantCost,.25,3,'positive constant-link latency');bound(selectedFlow,0,1,'selected variable-link flow');
 const a=Q.exact(slope),b=Q.exact(intercept),c=Q.exact(constantCost),tie=!sign(a)&&!sign(sub(b,c));
 const xEq=sign(a)?clip(div(sub(c,b),a),0,1):sign(sub(b,c))<0?Q.ONE:sign(sub(b,c))>0?Q.ZERO:Q.exact(.5);
 const xOpt=sign(a)?clip(div(sub(c,b),mul(2,a)),0,1):xEq;
 const total=x=>add(add(mul(a,square(x)),mul(sub(b,c),x)),c),latencies=x=>[add(mul(a,x),b),c],flows=x=>[Q.exact(x),sub(1,x)];
 const eqCost=total(xEq),optCost=total(xOpt),selectedCost=total(selectedFlow),eq=wardrop(flows(xEq),latencies(xEq)),chosen=wardrop(flows(selectedFlow),latencies(selectedFlow)),derivative=add(mul(mul(2,a),xOpt),sub(b,c));
 const physical={equilibriumVariableFlow:xEq,equilibriumConstantFlow:sub(1,xEq),optimalVariableFlow:xOpt,optimalConstantFlow:sub(1,xOpt),equilibriumTotalCost:eqCost,optimalTotalCost:optCost,selectedTotalCost:selectedCost,optimalDerivative:derivative,wardropResidual:eq.residual,selectedWardropResidual:chosen.residual,optimalityGap:sub(eqCost,optCost),affineBoundSlack:sub(mul(4,optCost),mul(3,eqCost))};
 const set=x=>tie?{kind:'whole unit interval',low:quantity(0),high:quantity(1)}:{kind:'single point',point:quantity(x)};
 return{parameters:{slope,intercept,constantCost,selectedFlow},...pack(physical),equilibriumRouteLatencies:latencies(xEq).map(quantity),equilibriumRouteGaps:eq.gaps.map(quantity),selectedRouteLatencies:latencies(selectedFlow).map(quantity),equilibriumSet:set(xEq),optimalSet:set(xOpt),priceOfAnarchy:sign(optCost)?quantity(div(eqCost,optCost)):null,wardropVerified:eq.verified,optimumVerified:optimum(xOpt,1,derivative),ratioStatus:sign(optCost)?'defined for positive optimal cost':'zero optimal cost; ratio undefined',scope:'One unit of nonatomic flow, a variable route with nonnegative affine latency ax+b and a constant route with c>0. The4/3bound is for nonatomic nonnegative affine routing with positive optimal cost; it is not asserted for atomic players, arbitrary nonlinear costs or a0/0ratio. A zero slope with equal route costs gives a genuine equilibrium/optimum continuum.'};
}
