import test from 'node:test';import assert from 'node:assert/strict';
import{stackelbergState,bertrandProfit,bertrandState,bertrandPath,differentiatedState,capacityProfit,capacityState}from'../content/micro/source-audit-oligopoly.js';
const close=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Independent constrained first-order conditions, follower exit and Cournot comparison hold at every actual Stackelberg cost setting',()=>{
 for(let i=0;i<=100;i++)for(let j=0;j<=100;j++){
  const c1=i/20,c2=j/20,p=stackelbergState(c1,c2),exit=12-c2;
  close(p.leader,Math.min((12-2*c1+c2)/2,exit));assert.ok(p.leaderProfit>=p.cournotProfit1-1e-10);assert.ok(p.follower<=p.cournot2+1e-10);
  assert.ok(p.leader+p.follower>=p.cournot1+p.cournot2-1e-10);
  const activeDerivative=(12+c2)/2-c1-p.leader,inactiveDerivative=12-c1-2*p.leader;
  if(p.corner){assert.ok(activeDerivative>=-1e-10);assert.ok(inactiveDerivative<=1e-10);}else close(activeDerivative,0);
  close(p.follower,Math.max(0,(12-c2-p.leader)/2));
 }
 const corner=stackelbergState(0,5);close(corner.leader,7);close(corner.follower,0);close(corner.interior,8.5);close(corner.leaderProfit,35);
});
test('Independent exhaustive output search verifies global leader/follower optimality including all chosen-output endpoints',()=>{
 for(const c1 of[0,2,5])for(const c2 of[0,2,5]){
  const p=stackelbergState(c1,c2);
  for(let n=0;n<=2400;n++){
   const q=n/200,reply=Math.max(0,(12-c2-q)/2),value=q*(Math.max(0,12-q-reply)-c1);assert.ok(value<=p.leaderProfit+1e-9);
   for(const perturbation of[-.1,.1]){const y=Math.max(0,reply+perturbation);assert.ok(y*(Math.max(0,12-q-y)-c2)<=reply*(Math.max(0,12-q-reply)-c2)+1e-9);}
  }
  for(const q of[0,12]){const chosen=stackelbergState(c1,c2,q);close(chosen.chosenProfit,q*(Math.max(0,12-q-chosen.reply)-c1));}
 }
});
test('Continuous-price Bertrand discontinuity has an unattained supremum, finite cuts need not pay, and the terminal equilibrium has no profitable deviation',()=>{
 for(const c of[1,2,5])for(const fraction of[.01,.5,1]){
  const r=c+fraction*(10-c)/2,limit=(r-c)*(10-r);close(bertrandProfit(r,r,c),limit/2);close(bertrandProfit(r+1e-8,r,c),0);
  let old=-Infinity;for(const eps of[(r-c)/2,(r-c)/8,(r-c)/128,(r-c)/32768]){const value=bertrandProfit(r-eps,r,c);assert.ok(value>old&&value<limit);old=value;}
  for(let n=0;n<=1000;n++)assert.ok(bertrandProfit(n/100,c,c)<=1e-12);
 }
 assert.ok(bertrandProfit(2,2.01,2)<bertrandProfit(2.01,2.01,2));
});
test('All actual cost/decrement combinations produce a bounded finite illustrative path with inspectable start and exact (c,c) finish',()=>{
 for(let i=0;i<=80;i++)for(let j=1;j<=20;j++){
  const c=1+i*.05,d=j*.05,path=bertrandPath(c,d),first=path[0];close(first[0],(10+c)/2);close(first[1],(10+c)/2);assert.deepEqual(path.at(-1),[c,c]);assert.ok(path.length<=183);
  for(let n=1;n<path.length;n++){const mover=(n-1)%2;close(path[n][1-mover],path[n-1][1-mover]);assert.ok(path[n][mover]<=path[n-1][mover]+1e-12);assert.ok(path[n][mover]>=c);}
  const start=bertrandState(c,d,0),end=bertrandState(c,d,1);assert.equal(start.k,0);assert.equal(end.k,end.last);assert.equal(end.profit1,0);assert.equal(end.profit2,0);
 }
});
test('Independent simultaneous FOCs and unilateral payoff checks verify differentiated prices/quantities, Cournot gap and the singular homogeneous limit',()=>{
 for(let n=0;n<=100;n++){
  const s=n/100,p=differentiatedState(s),q=(8/(2-s))/(1+s);
  close(p.qB,q);close(p.pB,2+(1-s*s)*q);close(p.pC,2+p.qC);close(p.pC-p.pB,8*s*s/(4-s*s));
  if(s<1){const D=x=>Math.max(0,((1-s)*10-x+s*p.pB)/(1-s*s));close(D(p.pB),p.qB);
   for(let j=0;j<=500;j++){const price=2+j*8/500;assert.ok((price-2)*D(price)<=p.profitB+1e-9);}
  }
  for(let j=0;j<=500;j++){const output=j*10/500;assert.ok(output*(Math.max(0,10-output-s*p.qC)-2)<=p.profitC+1e-9);}
 }
 const limit=differentiatedState(1);assert.equal(limit.homogeneousLimit,true);close(limit.pB,2);close(limit.qB,4);close(limit.pC,14/3);
});
test('Independent full-price deviation search and analytic residual quadratic verify every actual capacity value and both exact regime boundaries',()=>{
 const ks=Array.from({length:171},(_,i)=>.5+i*.05).concat([8/3,8/3-.0001,8/3+.0001,8-.0001,8,8+.0001]);
 for(const k of ks){
  const p=capacityState(k),r=Math.max(2,10-2*k),own=(r-2)*Math.min(k,(10-r)/2);close(p.own,own);
  const upper=Math.max(r,(12-k)/2),up=(upper-2)*Math.min(k,Math.max(0,10-upper-k));close(p.upward,up);close(p.gain,Math.max(0,up-own));assert.equal(p.equilibrium,k<=8/3||k>=8);
  for(let j=0;j<=4000;j++){const price=10*j/4000,sales=price<r?Math.min(k,10-price):price===r?Math.min(k,(10-price)/2):Math.min(k,Math.max(0,10-price-k));
   close(capacityProfit(price,k,r),(price-2)*sales);assert.ok((price-2)*sales<=Math.max(own,up)+1e-9);
  }
  if(p.equilibrium)assert.ok(p.gain<1e-10);else if(Math.abs(k-8/3)>.00001&&Math.abs(k-8)>.00001)assert.ok(p.gain>0);
 }
});
