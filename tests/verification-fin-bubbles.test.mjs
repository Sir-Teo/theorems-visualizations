import test from 'node:test';import assert from 'node:assert/strict';
import {finiteDividendValue as fv,bubbleScenario as model,sampledBubbleReturn as sample} from '../content/fin/source-audit-bubbles.js';
const near=(a,b,t=2e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('All offered rates and terminal dates agree with direct discounted cash flows and backward induction, including zero terminal resale',()=>{
 for(let i=0;i<=32;i++){const r=.02+i*.0025,q=1+r;for(let T=5;T<=50;T++){const p=Array(T+1).fill(0);for(let t=T-1;t>=0;t--)p[t]=(5+p[t+1])/q;for(let t=0;t<=T;t++){let sum=0;for(let k=1;k<=T-t;k++)sum+=5/q**k;near(fv(r,T-t),sum);near(fv(r,T-t),p[t]);}assert.equal(fv(r,0),0);}}
 const a=model({regime:'fin',terminal:5});assert.equal(a.prices.at(-1)[1],0);assert.notEqual(a.price0,5/.05);near(a.expectedReturn,1.05);
});
test('Exact branch-weighted asset returns and homogeneous bubble equations hold over all rates and representative full-control corners',()=>{
 for(let i=0;i<=32;i++)for(const initial of[0,20,60])for(const survival of[.5,.73,.99])for(const terminal of[5,25,50])for(const regime of['cert','burst','fin']){
  const r=.02+i*.0025,q=1+r,m=model({r,initial,survival,terminal,regime,random:()=>0});
  near(m.expectedReturn,q);assert.equal(m.prices.length,(regime==='fin'?terminal:50)+1);
  if(regime==='fin'){near(m.prices.at(-1)[1],0);near(m.candidate.at(-1)[1],initial*q**terminal);near(m.candidateDiscounted.at(-1)[1],initial);assert.equal(m.tailLimit,0);}
  else{const b=initial;near(survival*(b*q/survival),q*b);for(const[t,x]of m.discountedExpected)near(x,(5/r)/q**t+initial);assert.equal(m.tailLimit,initial);}
 }
});
test('Independent enumeration of all Bernoulli histories recovers expected price, while almost-sure crashing does not imply a zero expected discounted tail',()=>{
 const H=8;for(const r of[.02,.1])for(const pi of[.5,.99])for(const initial of[0,60]){
  let e=0,mass=0;for(let mask=0;mask<2**H;mask++){
   let weight=1,b=initial;const draws=[];for(let i=0;i<H;i++){const live=!!(mask&(1<<i));weight*=live?pi:1-pi;draws.push(live?0:1);b=live?b*(1+r)/pi:0;}
   let j=0;const m=model({r,initial,survival:pi,periods:H,regime:'burst',random:()=>draws[j++]});near(m.prices.at(-1)[1],5/r+b);e+=weight*m.prices.at(-1)[1];mass+=weight;
  }near(mass,1);near(e/(1+r)**H,(5/r)/(1+r)**H+initial);
 }
 for(const H of[1,10,100,500]){const pi=.5,r=.02,B=20;near(pi**H*(B*((1+r)/pi)**H)/(1+r)**H,B,2e-10);}assert.ok(.5**500<1e-100);
 const zero=model({initial:0,regime:'burst'});assert.equal(zero.tailLimit,0);assert.equal(zero.crash,null);
});
test('Monte Carlo is a finite sample with independently calculated count, mean and theoretical standard error',()=>{
 for(const pi of[.5,.73,.99])for(const r of[.02,.1])for(const initial of[0,60]){
  const m=model({r,initial,survival:pi,regime:'burst'});let j=0;const n=100,s=sample(m,()=>((j++)+.5)/n,n);
  if(!initial){assert.equal(s.draws,0);assert.equal(s.standardError,0);continue;}
  assert.equal(s.survived,Math.round(n*pi));const returns=Array.from({length:n},(_,i)=>((5/r)+5+(i+.5<n*pi?initial*(1+r)/pi:0))/(5/r+initial));near(s.mean,returns.reduce((a,b)=>a+b)/n);
  const mean=pi*m.liveReturn+(1-pi)*m.deadReturn,variance=pi*(m.liveReturn-mean)**2+(1-pi)*(m.deadReturn-mean)**2;near(s.standardError,Math.sqrt(variance/n));
 }
 const m=model({regime:'burst',initial:60,survival:.5});const s=sample(m,()=>1,100);assert.notEqual(s.mean,m.expectedReturn);assert.ok(s.standardError>0);
});
test('An independent four-date conditional dividend tree obeys the finite forward identity at every node and horizon',()=>{
 const q=1.07,N=4,div=(t,state)=>2+t+state/3,prices=Array.from({length:N+1},(_,t)=>Array(2**t).fill(0));
 for(let t=N-1;t>=0;t--)for(let s=0;s<2**t;s++)prices[t][s]=([0,1].reduce((sum,b)=>sum+.5*(div(t+1,2*s+b)+prices[t+1][2*s+b]),0))/q;
 for(let t=0;t<N;t++)for(let s=0;s<2**t;s++)for(let H=1;H<=N-t;H++){
  let e=0;for(let suffix=0;suffix<2**H;suffix++){let state=s,pv=0;for(let k=1;k<=H;k++){state=2*state+((suffix>>(H-k))&1);pv+=div(t+k,state)/q**k;}pv+=prices[t+H][state]/q**H;e+=pv/2**H;}near(prices[t][s],e);
 }
});
