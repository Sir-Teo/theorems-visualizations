import test from 'node:test';import assert from 'node:assert/strict';
import {bracketDistribution as dist,bracketScenario as model,transactionParts as parts,transactionWtp as wtp} from '../content/behav/source-audit-bracketing.js';
const near=(a,b,t=1e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const choose=(n,k)=>{let c=1n;for(let i=1;i<=k;i++)c=c*BigInt(n-i+1)/BigInt(i);return c;};
test('Exact fair-coin bundle distributions match independent BigInt counts, all dollar moments and strict lattice loss masses',()=>{
 for(let n=1;n<=100;n++){const d=dist(n);assert.equal(d.length,n+1);let sum=0,mean=0,second=0,loss=0,zero=0;for(let k=0;k<=n;k++){const probability=Number(choose(n,k))/2**n,total=300*k-100*n;near(d[k].probability,probability,1e-14);assert.equal(d[k].total,total);sum+=probability;mean+=probability*total;second+=probability*total*total;if(3*k<n)loss+=probability;if(3*k===n)zero+=probability;}near(sum,1);near(mean,50*n);near(second-mean*mean,22500*n,2e-12);const r=model(1,2.5).rows[n-1];near(r.lossProbability,loss,1e-14);near(r.zeroProbability,zero,1e-14);assert.ok(loss<=9/n+1e-13);}
 near(model().rows[99].lossProbability,.0004368599184561965,1e-14);near(model().rows[2].lossProbability,1/8);near(model().rows[3].lossProbability,5/16);
});
test('Ordinary-probability values match exhaustive outcome-path enumeration; all finite acceptance intervals match their actual decisions',()=>{
 for(const alpha of[.5,.88,1])for(const lambda of[1,2,2.5,4]){const m=model(alpha,lambda);for(let n=1;n<=12;n++){let value=0;for(let path=0;path<2**n;path++){let wins=0;for(let bit=0;bit<n;bit++)wins+=(path>>>bit)&1;const total=300*wins-100*n;value+=(total>=0?total**alpha:-lambda*(-total)**alpha)/2**n;}near(m.rows[n-1].value,value,2e-12);}
  const expanded=m.ranges.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j));assert.deepEqual(expanded,m.accepted);assert.deepEqual(expanded,m.rows.filter(r=>r.decision>0).map(r=>r.n));assert.equal(m.firstAccepted,expanded[0]??null);
  near(m.singleValue,.5*100**alpha*(2**alpha-lambda));for(const r of m.rows){near(r.mean,50*r.n);near(r.sd,150*Math.sqrt(r.n));}
 }
 const flip=model(.5,4);assert.equal(flip.firstAccepted,3);assert.ok(flip.rows[2].value>0&&flip.rows[3].value<0);assert.deepEqual(flip.ranges,[[3,3],[5,100]]);assert.equal(model(1,2).singleDecision,0);assert.ok(model(.5,1).singleValue>0);assert.ok(100*model(.5,1).singleValue>Math.max(...model(.5,1).rows.map(r=>r.value)));
});
test('Read et al. source illustration and Samuelson wealth-range premise are distinguished by exact finite expected utility',()=>{
 const m=model(1,2.5);near(m.rows[0].value,-25,0);near(m.rows[1].value,25,0);
 // This SAME concave piecewise-linear utility at fixed absolute wealth zero
 // rejects one bet yet accepts two: single rejection is not the theorem premise.
 const u=x=>x>=0?x:2.5*x;near(.5*u(200)+.5*u(-100),-25,0);near(.25*u(400)+.5*u(100)+.25*u(-200),25,0);assert.ok(.5*u(400)+.5*u(100)>u(200));
 // CARA utility supplies a genuine all-wealth rejection example. Direct
 // exhaustive paths agree with the independent product of one-bet MGFs.
 const r=.01,one=.5*Math.exp(-200*r)+.5*Math.exp(100*r);assert.ok(one>1);for(const wealth of[-100,0,200])for(let n=1;n<=10;n++){let eu=0;for(let path=0;path<2**n;path++){let wins=0;for(let j=0;j<n;j++)wins+=(path>>>j)&1;eu-=Math.exp(-r*(wealth+300*wins-100*n))/2**n;}near(eu,-Math.exp(-r*wealth)*one**n,2e-12);assert.ok(eu<-Math.exp(-r*wealth));}
});
test('Exact piecewise reservation prices satisfy zero/sign/branch conditions over the complete control family',()=>{
 for(const value of[.5,1.5,4])for(const reference of[.5,1,1.5,3.8,4,6])for(const lambda of[1,2.25,4])for(const weight of[0,.5,1]){
  const p=wtp(reference,{value,lambda,weight}),o={value,lambda,weight};assert.ok(p>=Math.min(value,reference)-1e-12&&p<=Math.max(value,reference)+1e-12);near(parts(p,reference,o).total,0,1e-12);assert.ok(parts(p-.0001,reference,o).total>0&&parts(p+.0001,reference,o).total<0);
  const lo=parts(0,reference,o).total,hi=parts(6,reference,o).total;assert.ok(lo>0&&hi<=0);let left=0,right=6;for(let i=0;i<50;i++){const mid=(left+right)/2;if(parts(mid,reference,o).total>0)left=mid;else right=mid;}near((left+right)/2,p,1e-12);
  for(const price of[0,.5,2.65,6]){const c=parts(price,reference,o);near(c.acquisition,value-price);near(c.transaction,weight*(reference-price)*(price<=reference?1:lambda));near(c.total,c.acquisition+c.transaction);assert.ok(c.total<=lo+1e-12&&c.total>=hi-1e-12);}if(weight===0)near(p,value,0);
 }
 near(wtp(3.8),2.65,1e-14);near(wtp(1.5),1.5,0);near(parts(6,.5,{value:.5,lambda:4,weight:1}).total,-27.5,0);near(parts(0,6,{value:4,lambda:4,weight:1}).total,10,0);
});
