// Symmetric one-population games: A is the row payoff; column payoff is Aᵀ.
// Original binary64 factors determine classifications. No epsilon sign tests.
import * as Q from './ch06.exact.shared.js';
export {Q};
const {add,sub,mul,div,sign}=Q;
export const quantity=x=>{x=Q.exact(x);const value=Q.approximate(x),s=sign(x);return{exact:x,value,sign:s,logMagnitude:Q.logAbs(x),belowRange:s!==0&&value===0,aboveRange:!Number.isFinite(value),approximate:false};};
const pack=values=>Object.fromEntries(Object.entries(values).map(([k,v])=>[k,quantity(v)]));
function bound(x,a,b,label){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw Error(label+' outside declared range');}
function matrix2(A){
 if(!Array.isArray(A)||A.length!==2||A.some(row=>!Array.isArray(row)||row.length!==2))throw Error('a 2×2 row payoff matrix is required');
 for(const x of A.flat())bound(x,-50,50,'payoff');
 return A.map(row=>row.map(Q.exact));
}
const payoff=(A,p,q)=>add(mul(p,add(mul(q,A[0][0]),mul(sub(1,q),A[0][1]))),mul(sub(1,p),add(mul(q,A[1][0]),mul(sub(1,q),A[1][1]))));
function differences(A){const againstSecond=sub(A[0][1],A[1][1]),againstFirst=sub(A[0][0],A[1][0]);return{againstSecond,againstFirst,slope:sub(againstFirst,againstSecond)};}
const gradient=(d,p)=>add(d.againstSecond,mul(p,d.slope));
function classification(d,p){
 p=Q.exact(p);const atZero=sign(p)===0,atOne=sign(sub(p,1))===0,g=gradient(d,p);
 const nash=atZero?sign(g)<=0:atOne?sign(g)>=0:sign(g)===0;
 const strictNash=atZero?sign(g)<0:atOne?sign(g)>0:false;
 const ess=nash&&(strictNash||sign(d.slope)<0);
 return{nash,strictNash,ess};
}
function equilibria(d){
 if(sign(d.againstFirst)===0&&sign(d.againstSecond)===0)return{kind:'whole unit interval',points:[],interval:{low:quantity(0),high:quantity(1)},essExists:false};
 const points=[];
 for(const p of [Q.ZERO,Q.ONE]){const c=classification(d,p);if(c.nash)points.push({share:quantity(p),...c});}
 if(sign(d.slope)!==0){const p=div(Q.neg(d.againstSecond),d.slope);if(sign(p)>0&&sign(sub(p,1))<0)points.push({share:quantity(p),...classification(d,p)});}
 points.sort((a,b)=>sign(sub(a.share.exact,b.share.exact)));
 return{kind:'finite points',points,interval:null,essExists:points.some(p=>p.ess)};
}
function selection(A,p){
 const d=differences(A),g=gradient(d,p),shareVelocity=mul(mul(p,sub(1,p)),g),firstPayoff=payoff(A,1,p),secondPayoff=payoff(A,0,p),meanPayoff=payoff(A,p,p);
 const selected=classification(d,p),rest=sign(shareVelocity)===0;
 return{...pack({firstPayoff,secondPayoff,meanPayoff,payoffDifference:g,shareVelocity,gradientAtZero:d.againstSecond,gradientAtOne:d.againstFirst,gradientSlope:d.slope}),selected:{...selected,rest},equilibria:equilibria(d),direction:sign(shareVelocity)>0?'first strategy increases':sign(shareVelocity)<0?'first strategy decreases':'rest point'};
}
export function selection2({matrix=[[0,4],[2,2]],share=.4}={}){
 bound(share,0,1,'first-strategy share');const A=matrix2(matrix);
 return{parameters:{matrix:matrix.map(row=>[...row]),share},...selection(A,share),scope:'Exact instantaneous two-strategy replicator field and complete symmetric Nash/ESS classification. Every boundary is a rest point, including boundary points that are not Nash; no sampled trajectory is a proof.'};
}
export function invasion({matrix=[[0,4],[2,2]],resident=.5,mutant=.8,fraction=.05}={}){
 for(const[label,x]of Object.entries({resident,mutant,fraction}))bound(x,0,1,label);
 const A=matrix2(matrix),d=differences(A),mix=add(mul(sub(1,fraction),resident),mul(fraction,mutant));
 const incumbentPayoff=payoff(A,resident,mix),mutantPayoff=payoff(A,mutant,mix),gap=sub(incumbentPayoff,mutantPayoff);
 const firstAdvantage=sub(payoff(A,resident,resident),payoff(A,mutant,resident)),secondAdvantage=sub(payoff(A,resident,mutant),payoff(A,mutant,mutant));
 const identity=sub(gap,add(mul(sub(1,fraction),firstAdvantage),mul(fraction,secondAdvantage))),same=resident===mutant;
 const rare=same?null:sign(firstAdvantage)>0||sign(firstAdvantage)===0&&sign(secondAdvantage)>0;
 let invasionBarrier=null;
 if(rare)invasionBarrier=quantity(sign(firstAdvantage)>0&&sign(secondAdvantage)<0?div(firstAdvantage,sub(firstAdvantage,secondAdvantage)):Q.ONE);
 return{parameters:{matrix:matrix.map(row=>[...row]),resident,mutant,fraction},...pack({populationMix:mix,incumbentPayoff,mutantPayoff,incumbentAdvantage:gap,firstAdvantage,secondAdvantage,linearIdentityResidual:identity}),residentClassification:classification(d,resident),distinctMutant:!same,rareInvasionResisted:rare,invasionBarrier,selectedOutcome:same?'same strategy, no distinct mutant':sign(gap)>0?'incumbent earns more':sign(gap)<0?'mutant earns more':'equal payoffs',scope:'The selected mutant/fraction tests one comparison. The separate complete two-strategy ESS classification quantifies over all distinct mutant mixtures. Fraction zero is the uninvaded limit, not a strict test against a positive-sized invasion.'};
}
export function hawkDove({resource=4,fightingCost=8,hawkShare=.3}={}){
 bound(resource,0,20,'resource value');bound(fightingCost,1,30,'positive fighting cost');bound(hawkShare,0,1,'hawk share');
 const A=[[div(sub(resource,fightingCost),2),Q.exact(resource)],[Q.ZERO,div(resource,2)]];
 const z=selection(A,hawkShare),rawRatio=div(resource,fightingCost),stableShare=sign(sub(rawRatio,1))>0?Q.ONE:rawRatio;
 return{parameters:{resource,fightingCost,hawkShare},matrix:A.map(row=>row.map(quantity)),...z,...pack({unconstrainedHawkRatio:rawRatio,stableHawkShare:stableShare}),regime:resource<fightingCost?'mixed equilibrium (boundary if resource is zero)':resource===fightingCost?'pure hawk with a nonhyperbolic boundary':'strict pure hawk',scope:'Random matching, no self-interaction correction in this infinite-population game. The Hawk–Dove row payoffs are[(V−C)/2,V;0,V/2], with C>0. The stable share is min(V/C,1); endpoint equalities need not have exponential convergence.'};
}
