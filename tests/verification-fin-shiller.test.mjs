import test from 'node:test';
import assert from 'node:assert/strict';
import {D_SHILLER,rng} from '../content/fin/ch05.shared.js';
import {shillerStats,shillerTransform,shillerFiniteProxy,shillerHistorical,shillerForecast,shillerPopulation,shillerBenchmark,shillerHistogram} from '../content/fin/source-audit-shiller.js';
const near=(a,b,t=3e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const stats=x=>{const mean=x.reduce((a,b)=>a+b)/x.length;return{mean,sd:Math.sqrt(x.map(v=>(v-mean)**2).reduce((a,b)=>a+b)/x.length)}};
const direct=(d,r,K)=>d.map((_,t)=>{let sum=K/(1+r)**(d.length-1-t);for(let j=t;j<d.length-1;j++)sum+=d[j]/(1+r)**(j-t+1);return sum;});

test('All later-data transformations independently fit the log trend and align beginning-price/end-dividend factors',()=>{
 for(const n of[2,3,109,152]){const q=shillerTransform(D_SHILLER,n),base=D_SHILLER.at(-1)[3],logs=D_SHILLER.slice(0,n).map(x=>Math.log(x[1]*base/x[3])),sx=n*(n-1)/2,sxx=n*(n-1)*(2*n-1)/6,sy=logs.reduce((a,b)=>a+b),sxy=logs.reduce((a,b,i)=>a+i*b,0),g=(n*sxy-sx*sy)/(n*sxx-sx*sx);near(q.growth,g);near(q.annualGrowth,Math.exp(g)-1);
  q.p.forEach((x,i)=>{near(x,D_SHILLER[i][1]*base/D_SHILLER[i][3]/Math.exp(i*g));near(q.d[i],D_SHILLER[i][2]*base/D_SHILLER[i][3]/Math.exp((i+1)*g));assert.equal(q.year[i],1871+i);});
  const a=shillerStats(q.p),b=stats(q.p);near(a.mean,b.mean);near(a.sd,b.sd);
 }
});

test('Every offered rate/sample/terminal combination matches direct discounted cash flows, exact terminal weights and final-dividend exclusion',()=>{
 for(const n of[109,152])for(const terminalRule of['mean','last'])for(let j=0;j<=40;j++){
  const r=.02+j*.0025,h=shillerHistorical(D_SHILLER,n,r,terminalRule),p=shillerTransform(D_SHILLER,n),K=terminalRule==='last'?p.p.at(-1):stats(p.p).mean,reference=direct(p.d,r,K);
  reference.forEach((x,t)=>near(h.proxy[t],x));near(h.terminal,K);near(h.ratio,stats(p.p).sd/stats(reference).sd);near(h.initialTerminalWeight,1/(1+r)**(n-1));
  const moved=shillerFiniteProxy(p.d,r,K+17),d=[...p.d];d[n-1]+=100000;assert.deepEqual(shillerFiniteProxy(d,r,K),h.proxy);
  moved.forEach((x,t)=>near(x-h.proxy[t],17/(1+r)**(n-1-t)));
 }
});

test('All4100 rate/persistence choices satisfy the predividend conditional-PV recursion; independent covariance sums verify population variance ratios',()=>{
 for(let i=0;i<=40;i++)for(let j=0;j<=99;j++)for(const x of[-3,0,2]){
  const r=.02+i*.0025,rho=j/100,mu=5,p=shillerForecast(mu+x,mu,r,rho),next=shillerForecast(mu+rho*x,mu,r,rho);near(p,(mu+x+next)/(1+r));
  let value=0;for(let k=0;k<80;k++)value+=(mu+rho**k*x)/(1+r)**(k+1);value+=shillerForecast(mu+rho**80*x,mu,r,rho)/(1+r)**80;near(value,p);
  const q=shillerPopulation(r,rho,2);assert.ok(q.ratio<=1&&q.errorVariance>0);near(q.ratio,Math.sqrt(q.priceVariance/q.targetVariance));
 }
 for(const r of[.02,.05,.12])for(const rho of[0,.9,.99]){
  const weights=Array.from({length:2048},(_,k)=>(1+r)**(-k-1));let target=weights.reduce((s,w)=>s+w*w,0);
  for(let h=1;h<weights.length;h++){const cov=rho**h;let diagonal=0;for(let k=0;k+h<weights.length;k++)diagonal+=weights[k]*weights[k+h];target+=2*cov*diagonal;}
  const q=shillerPopulation(r,rho,2);near(q.targetVariance,4*target,2e-10);near(q.priceVariance,4/(1+r-rho)**2);
 }
});

test('Exhaustive innovation trees verify exact last-price continuation and forecast orthogonality while an admissible path reverses the sample variance ordering',()=>{
 const n=8,sd=2,mu=5;
 for(const r of[.02,.12])for(const rho of[0,.9,.99]){
  let cov=0,meanError=0;
  for(const sign of[-1,1]){let conditional=0;const p0=shillerForecast(mu+sign*sd,mu,r,rho);
   for(let code=0;code<2**n;code++){const d=[mu+sign*sd];let x=sign*sd;for(let t=0;t<n;t++){x=rho*x+sd*Math.sqrt(1-rho*rho)*((code>>t)&1?1:-1);d.push(mu+x);}const q=direct(d,r,shillerForecast(d.at(-1),mu,r,rho))[0],e=q-p0;conditional+=q/2**n;cov+=(p0-mu/r)*e/(2*2**n);meanError+=e/(2*2**n);}
   near(conditional,p0);
  }near(cov,0,1e-8);near(meanError,0);
 }
 const d=[1,2,3],r=.05,p=d.map(x=>shillerForecast(x,2,r,0)),q=shillerFiniteProxy(d,r,p.at(-1));assert.ok(stats(p).sd>stats(q).sd,'exact continuation does not order every time-series sample variance');
});

test('All400 complete samples at both lengths and rate/persistence/terminal corners match an independent direct-PV implementation and reseed deterministically',()=>{
 for(const count of[109,152])for(const rate of[.02,.05,.12])for(const persistence of[0,.9,.99])for(const terminalRule of['mean','last'])for(const seed of[6,7]){
  const mean=5,sd=2,R=rng(seed);let draws=0;const model=shillerBenchmark({count,rate,persistence,mean,sd,terminalRule,normal:()=>{draws++;return R.normal();}}),reference=[],S=rng(seed);let nd=0,np=0;
  for(let j=0;j<400;j++){let x=sd*S.normal();const d=[],p=[];for(let t=0;t<count;t++){const dividend=mean+x,price=mean/rate+x/(1+rate-persistence);d.push(dividend);p.push(price);nd+=dividend<0;np+=price<0;if(t+1<count)x=persistence*x+sd*Math.sqrt(1-persistence*persistence)*S.normal();}const K=terminalRule==='last'?p.at(-1):stats(p).mean,proxy=direct(d,rate,K);reference.push(stats(p).sd/stats(proxy).sd);if(j===0){assert.deepEqual(model.first.dividends,d);model.first.prices.forEach((x,t)=>near(x,p[t]));model.first.proxy.forEach((x,t)=>near(x,proxy[t]));}}
  assert.equal(draws,400*count);model.ratios.forEach((x,j)=>near(x,reference[j]));assert.equal(model.aboveOne,reference.filter(x=>x>1).length);assert.equal(model.negativeDividends,nd);assert.equal(model.negativePrices,np);near(model.meanRatio,stats(reference).mean);near(model.max,Math.max(...reference));near(model.min,Math.min(...reference));
 }
});

test('Adaptive histograms count every finite ratio including large tails without folding overflow into the last bin',()=>{
 for(const ratios of[[.2,.9,1,2,40000],Array.from({length:400},(_,i)=>.1+i/100),[1,1,1]])for(const observed of[.3,1,10]){
  const h=shillerHistogram(ratios,observed);assert.equal(h.counts.reduce((a,b)=>a+b),ratios.length);assert.ok(h.upper>Math.max(1,observed,...ratios));
  h.counts.forEach((x,i)=>assert.equal(x,ratios.filter(q=>q>=i*h.width&&q<(i+1)*h.width).length));assert.equal(h.aboveObserved,ratios.filter(q=>q>=observed).length);
 }
});
