import test from 'node:test';
import assert from 'node:assert/strict';
import { arbitrageGap, arbitrageOutcome, arbitrageSample } from '../content/fin/source-audit-arbitrage.js';
const near=(a,b,t=2e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const prepared=path=>({path,prefixMaximum:path.map((_,i)=>Math.max(...path.slice(0,i+1)))});

test('Daily Gaussian-model coefficients match independent finite weighted sums and exhaustive innovation means/variances; positive noise is not certain convergence',()=>{
 for(const k of[.002,.01,.05])for(const sigma of[.1,.6,1.2])for(let n=1;n<=8;n++){
  let sum=0,square=0;const a=Math.exp(-k);
  for(let code=0;code<2**n;code++){
   const z=Array.from({length:n},(_,j)=>(code>>j)&1?1:-1);let j=0;const g=arbitrageGap(5,k,sigma,()=>z[j++],n);
   for(let t=0;t<=n;t++){const independent=5*Math.exp(-k*t)+sigma*z.slice(0,t).reduce((v,x,h)=>v+x*Math.exp(-k*(t-h-1)),0);near(g.path[t],independent);near(g.prefixMaximum[t],Math.max(...g.path.slice(0,t+1)));}
   const x=g.path.at(-1);sum+=x;square+=x*x;
  }
  near(sum/2**n,5*a**n);near(square/2**n-(sum/2**n)**2,sigma*sigma*(-Math.expm1(-2*k*n))/(-Math.expm1(-2*k)));
  assert.ok(sigma*sigma/(1-a*a)>0,'the limiting Gaussian variance remains positive');
 }
});

test('Every offered leverage/margin pair matches direct first-hit wealth accounting, including refusal, equality, final-day hits and negative overshoots',()=>{
 let refused=0,liquidations=0,negative=0;
 for(let j=0;j<=58;j++)for(let h=0;h<=40;h++){
  const L=1+j/2,rho=h/200,threshold=5+100/L-100*rho;
  const paths=[[5,4,3,2],[5,200,-4,1],[5,1,3,100],[5,6,7,8],[5,threshold-1e-7,threshold,threshold+3],[5,threshold+1e-7,0,0]];
  for(const p of paths){const s=arbitrageOutcome(prepared(p),L,rho);
   if(L*rho>=1){refused++;assert.equal(s.status,'inadmissible');assert.equal(s.exitDay,null);assert.equal(s.wealth,1);assert.ok(s.equity.every(x=>x===1));continue;}
   const hit=p.findIndex(x=>x>=threshold),end=hit<0?p.length-1:hit,wealth=1+L*(5-p[end])/100;
   assert.equal(s.exitDay,hit<0?null:hit);assert.equal(s.status,hit<0?'open':'liquidated');near(s.wealth,wealth);
   s.equity.forEach((x,t)=>near(x,1+L*(5-p[Math.min(t,end)])/100));
   if(hit>=0){liquidations++;assert.ok(s.wealth<=rho*L+1e-12);if(s.wealth<0)negative++;}
  }
 }
 assert.ok(refused&&liquidations&&negative);
 const overshoot=arbitrageOutcome(prepared([5,20,0]),10,.05);assert.equal(overshoot.exitDay,1);near(overshoot.wealth,-.5);assert.notEqual(overshoot.wealth,.5);
 assert.equal(arbitrageOutcome(prepared([5,20,0]),10,.1).status,'inadmissible');
});

test('All400 finite stopping outcomes enter the mean/standard errors and liquidations are monotone in admitted leverage on common paths',()=>{
 const gaps=Array.from({length:400},(_,j)=>prepared(Array.from({length:251},(_,t)=>t===0?5:5+6*Math.sin(t/19+j*.13)+(j%11-5)*.12*t/250)));
 for(const rho of[0,.05,.2]){let previous=0;
  for(let j=0;j<=58;j++){const L=1+j/2,s=arbitrageSample(gaps,L,rho);
   if(L*rho>=1){assert.deepEqual(s,{status:'inadmissible',count:400});continue;}
   const wealth=[],hits=[];for(const g of gaps){let end=250,hit=false;for(let t=0;t<=250;t++)if(g.path[t]>=5+100/L-100*rho){end=t;hit=true;break;}wealth.push(1+L*(5-g.path[end])/100);hits.push(hit);}
   const mean=wealth.reduce((a,b)=>a+b)/400,p=hits.filter(Boolean).length/400;
   near(s.mean,mean);near(s.probability,p);near(s.se,Math.sqrt(wealth.reduce((v,x)=>v+(x-mean)**2,0)/(399*400)));near(s.probabilitySE,Math.sqrt(p*(1-p)/400));near(s.min,Math.min(...wealth));near(s.max,Math.max(...wealth));
   assert.ok(s.liquidated>=previous);previous=s.liquidated;
  }
 }
});

test('A first-hit exit is held as cash rather than credited the maintenance threshold or later recovery',()=>{
 const p=prepared([5,6,11,7,1,-4]),s=arbitrageOutcome(p,10,.05);assert.equal(s.exitDay,2);near(s.wealth,.4);assert.deepEqual(s.equity,[1,.9,.4,.4,.4,.4]);
 const noStop=1+10*(5-p.path.at(-1))/100;near(noStop,1.9);assert.ok(noStop>s.wealth);
 for(const k of[.002,.01,.05])for(const L of[1,10,30])for(const m0 of[1,5,12])assert.ok(1+L*m0*(-Math.expm1(-250*k))/100>1);
});
