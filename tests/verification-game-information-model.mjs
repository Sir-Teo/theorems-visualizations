import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareInformation as prep,informationExample as example,informationPlans as plans,recallAudit,informationOutcome as outcome,informationRealization as realize,mixedInformationOutcome as mixed,productInformationMixture as product,informationProfile as profile,informationStick as stick,informationRecallModel as recall,informationForgetModel as forget} from '../content/game/information-audit.js';
const near=(a,b,e=3e-14)=>{assert.equal(a.length,b.length);a.forEach((x,i)=>assert.ok(Math.abs(x-b[i])<=e,`${i}: ${x} vs ${b[i]}`));};
const grid=Array.from({length:9},(_,i)=>i/8);
test('all information sets, complete plans, remembered histories and zero-chance/empty-plan boundaries',()=>{
 for(const[k,n,s1,s2]of[['pennies',4,2,2],['poker',6,4,2],['recall',5,4,2],['forget',4,4,1]]){const P=prep(example(k));assert.equal(P.leaves.length,n);assert.equal(plans(P,1).length,s1);assert.equal(plans(P,2).length,s2);assert.equal(recallAudit(P,1).ok,k!=='forget');assert.equal(recallAudit(P,2).ok,true);}
 const F=prep(example('forget')),bad=recallAudit(F,1);assert.deepEqual(bad.violations[0].own,[[['A','L']],[['A','R']]]);assert.throws(()=>realize(F,1,[.5,0,0,.5]),/perfect recall/);
 const P=prep({player:0,actions:[{name:'zero',probability:0,to:{payoff:[10,2]}},{name:'one',probability:1,to:{payoff:[-1,3]}}]});assert.deepEqual(plans(P,1),[{}]);assert.deepEqual(product(P,1,{}),[1]);near(mixed(P,1,[1],{}).probabilities,[0,1]);near(outcome(P,{}).payoff,[-1,3]);assert.deepEqual(realize(P,1,[1]).records,[]);
 const Z=prep({payoff:[2,3]});near(mixed(Z,1,[1],{}).probabilities,[1]);
});
test('two profile examples: every terminal polynomial on729 probability triples and independently enumerated whole-plan deviation values',()=>{
 for(const a of grid)for(const b of grid)for(const c of grid){
  const mp=profile('pennies',a,b,c);near(mp.outcome.probabilities,[a*b,a*(1-b),(1-a)*b,(1-a)*(1-b)]);near(mp.outcome.payoff,[(2*a-1)*(2*b-1),-(2*a-1)*(2*b-1)]);near(mp.deviations[0].map(d=>d.payoff),[2*b-1,1-2*b]);near(mp.deviations[1].map(d=>d.payoff),[1-2*a,2*a-1]);
  const m=profile('poker',a,b,c);near(m.outcome.probabilities,[a*c/2,a*(1-c)/2,(1-a)/2,b*c/2,b*(1-c)/2,(1-b)/2]);
  const high=1+c,low=1-3*c;near(m.deviations[0].map(d=>d.payoff),[(high+low)/2,(high-1)/2,(1+low)/2,0]);
  const call=-(2*a-2*b+1-a-1+b)/2,fold=-(a+b+1-a-1+b)/2;near(m.deviations[1].map(d=>d.payoff),[call,fold]);
 }
 const eq=profile('poker',1,1/3,2/3);near(eq.outcome.payoff,[1/3,-1/3]);assert.ok(eq.regrets.every(x=>x<1e-14));assert.ok(1+2/3>1);assert.equal(1-3*(2/3),-1);near(profile('pennies',.5,.5).regrets,[0,0]);
});
test('full simplex allocation and every terminal equality on6,561 independent polynomial comparisons plus all zero fallbacks',()=>{
 for(const u of grid)for(const v of grid)for(const w of grid)for(const q of grid){const m=recall(u,v,w,q,.137),[x,y,z,t]=[u,(1-u)*v,(1-u)*(1-v)*w,(1-u)*(1-v)*(1-w)],expected=[q*x,q*y,(1-q)*x,(1-q)*y,z+t];near(m.mu,[x,y,z,t]);near(m.original.probabilities,expected);near(m.realized.probabilities,expected);near(mixed(m.P,1,m.product,m.others).probabilities,expected);}
 // Integer-simplex points independently inverted into the displayed allocation controls.
 for(let a=0;a<=8;a++)for(let b=0;b<=8-a;b++)for(let c=0;c<=8-a-b;c++){const d=8-a-b-c,mu=[a,b,c,d].map(x=>x/8),u=mu[0],v=a===8?0:b/(8-a),w=a+b===8?0:c/(8-a-b);near(stick(u,v,w),mu);}
 for(const z of[0,.123456789,.5,1]){const m=recall(0,0,.4,.37,z);assert.equal(m.converted.records[1].arbitrary,true);assert.equal(m.converted.behavior.B.a,z);near(m.original.probabilities,[0,0,0,0,1]);near(m.realized.probabilities,[0,0,0,0,1]);}
 const rare=recall(1e-14,0,0,.37,.19);assert.equal(rare.converted.behavior.B.a,1);assert.equal(rare.converted.records[1].arbitrary,false);assert.equal(rare.original.probabilities[0],3.7e-15);near(rare.realized.probabilities,rare.original.probabilities,1e-29);
 const A=recall(.25,1/3,1,.29),B=recall(.25,1/3,0,.29);assert.notDeepEqual(A.mu,B.mu);near(A.original.probabilities,B.original.probabilities);
});
test('general conditional construction on a16-plan perfect-recall tree: every terminal under100 mixtures with zero plan weights',()=>{
 const leaf=n=>({payoff:[n,-n]}),D=(info,left,right)=>({player:1,info,actions:[{name:'a',to:left},{name:'b',to:right}]}),P=prep({player:1,info:'A',actions:[{name:'L',to:D('B',D('C',leaf(0),leaf(1)),leaf(2))},{name:'R',to:D('D',leaf(3),leaf(4))}]});
 assert.equal(plans(P,1).length,16);assert.equal(recallAudit(P,1).ok,true);
 // Independent terminal matching counts over all complete plan bits.
 for(let seed=0;seed<100;seed++){const ws=Array.from({length:16},(_,i)=>(i*13+seed*7)%17),total=ws.reduce((a,b)=>a+b),mu=ws.map(x=>x/total),expected=Array(5).fill(0);for(let i=0;i<16;i++){const bits=[i>>3&1,i>>2&1,i>>1&1,i&1],z=bits[0]?(bits[3]?4:3):(bits[1]?2:(bits[2]?1:0));expected[z]+=mu[i];}const b=realize(P,1,mu,.123).behavior;near(outcome(P,b).probabilities,expected);near(mixed(P,1,mu,{}).probabilities,expected);near(mixed(P,1,product(P,1,b),{}).probabilities,expected);}
});
test('forgotten-action counterexample determinant for729 triples, honest degenerate endpoints and distinct equal-payoff histories',()=>{
 for(const l of grid)for(const p of grid)for(const q of grid){const m=forget(l,p,q);near(m.mixed.probabilities,[l,0,0,1-l]);near(m.realized.probabilities,[p*q,p*(1-q),(1-p)*q,(1-p)*(1-q)]);assert.equal(m.determinant,l*(1-l));assert.ok(Math.abs(m.behaviorDeterminant)<1e-15);if(l>0&&l<1)assert.ok(m.determinant>0);}
 for(const l of[0,1]){const m=forget(l,l,l);near(m.mixed.probabilities,m.realized.probabilities);assert.equal(m.determinant,0);}
 assert.equal(forget(.5,1,1).mixed.payoff[0],forget(.5,1,1).realized.payoff[0]);assert.notDeepEqual(forget(.5,1,1).mixed.probabilities,forget(.5,1,1).realized.probabilities);
});
test('reject malformed finite trees, distributions, continuous controls and mismatched information constraints',()=>{
 const P=prep(example('recall'));for(const mu of[[1,0,0],[-1,1,1,0],[.1,.1,.1,.1],new Array(4),[NaN,0,0,1]])assert.throws(()=>realize(P,1,mu));
 for(const x of[-.01,1.01,NaN,Infinity]){assert.throws(()=>recall(x));assert.throws(()=>forget(x));}
 for(const t of[{player:1,info:'A',actions:[]},{player:1,info:'A',actions:[null]},{player:1,info:'A',actions:new Array(2)},{player:0,actions:[{name:'a',probability:.2,to:{payoff:[0,0]}}]},{payoff:[0,Infinity]}])assert.throws(()=>prep(t));
 const cycle={player:1,info:'A',actions:[]};cycle.actions.push({name:'a',to:cycle});assert.throws(()=>prep(cycle),/cycles/);
 const t=example('pennies');t.actions[1].to.actions[0].name='wrong';assert.throws(()=>prep(t),/same mover/);
 assert.throws(()=>outcome(P,{A:{L:1,R:0},B:{a:.3,b:.3},X:{l:1,r:0}}),/distribution/);
});
