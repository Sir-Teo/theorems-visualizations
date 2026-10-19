import test from 'node:test';import assert from 'node:assert/strict';
import {hapStep,selStep,wbarD,dwbarD,alleleFitness,alleleSelectionStep} from '../content/popgen/ch04.shared.js';
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('haploid recursion matches independently normalized geometric genotype counts and exact target time',()=>{
 for(const s of [-.9,-.2,0,.01,.5])for(const p0 of [.001,.02,.5,.99]){let p=p0;for(let t=0;t<100;t++){const a=p0*Math.pow(1+s,t),b=1-p0;near(p,a/(a+b));p=hapStep(p,s);}}
 const p0=.001,s=.1,target=.99,t=Math.ceil((Math.log(target/(1-target))-Math.log(p0/(1-p0)))/Math.log1p(s));let p=p0;for(let k=0;k<t-1;k++)p=hapStep(p,s);assert.ok(p<target);assert.ok(hapStep(p,s)>=target);
});
test('Wright gradient equals genotype-count update and independent finite-difference slope',()=>{
 for(const w of [[1.1,1.05,1],[.7,1,.85],[1,0,1],[0,1,0]])for(const p of [.01,.1,.4,.8,.99]){const q=1-p,survivors=[p*p*w[0],2*p*q*w[1],q*q*w[2]],total=survivors.reduce((a,b)=>a+b),next=(2*survivors[0]+survivors[1])/(2*total),eps=1e-6,der=(wbarD(p+eps,w)-wbarD(p-eps,w))/(2*eps);near(selStep(p,w),next);near(dwbarD(p,w),der,2e-9);near(next-p,p*q*der/(2*total),2e-9);}
});
test('multi-allele selection agrees with enumerated surviving diploid genotypes and strict fitness inequality',()=>{
 let state=1234567;const rnd=()=>((state=Math.imul(1664525,state)+1013904223>>>0)/2**32);
 for(let trial=0;trial<400;trial++){const k=2+trial%6,W=Array.from({length:k},()=>Array(k).fill(0)),p=Array.from({length:k},rnd),sum=p.reduce((a,b)=>a+b);for(let i=0;i<k;i++){p[i]/=sum;for(let j=0;j<=i;j++)W[i][j]=W[j][i]=rnd()<.15?0:.01+2*rnd();}const allele=Array(k).fill(0);let total=0;
  for(let i=0;i<k;i++)for(let j=i;j<k;j++){const weight=p[i]*p[j]*W[i][j]*(i===j?1:2);total+=weight;allele[i]+=weight/2;allele[j]+=weight/2;}if(!total)continue;
  const q=alleleSelectionStep(p,W);q.forEach((x,i)=>near(x,allele[i]/total));near(q.reduce((a,b)=>a+b),1);assert.ok(alleleFitness(q,W).mean>=alleleFitness(p,W).mean-1e-12);
 }
 const p=[.2,.3,.5],W=Array.from({length:3},()=>[1,1,1]);assert.deepEqual(alleleSelectionStep(p,W),p);
});
test('overdominance is globally monotone and local convergence matches the derivative',()=>{
 for(const s of [.02,.3,.8,1])for(const t of [.02,.15,.8,1]){const eq=t/(s+t),w=[1-s,1,1-t],h=s*t/(s+t),lambda=(1-2*h)/(1-h);near(selStep(eq,w),eq);const eps=1e-6,der=(selStep(eq+eps,w)-selStep(eq-eps,w))/(2*eps);near(der,lambda,1e-8);
  for(const p0 of [.0001,.02,.3,.75,.9999]){let p=p0;for(let n=0;n<1000;n++){const next=selStep(p,w);assert.ok(Math.abs(next-eq)<=Math.abs(p-eq)+1e-14);assert.ok((next-eq)*(p-eq)>=-1e-14);p=next;}assert.ok(Math.abs(p-eq)<Math.abs(p0-eq)||Math.abs(p0-eq)<1e-14);}
 }
});
import {fitnessLogGrowth} from '../content/popgen/ch04.shared.js';
test('fluctuating fitness log growth agrees with exact enumeration of all environments',()=>{
 for(const a of[1,2,3])for(const b of[.1,.5,1.2])for(const pi of[.05,.5,.95]){const q=fitnessLogGrowth(a,b,pi),T=6;let mean=0,square=0,mass=0;for(let mask=0;mask<2**T;mask++){let probability=1,odds=.25,log=0;for(let t=0;t<T;t++){const good=!!(mask&(1<<t)),w=good?a:b;probability*=good?pi:1-pi;odds*=w;log+=Math.log(w);}near(Math.log(odds/.25),log);mass+=probability;mean+=probability*log;square+=probability*log*log;}near(mass,1);near(mean,T*q.logG);near(square-mean*mean,T*q.varianceLog,1e-9);assert.ok(q.G<=q.A+1e-12);}
 const neutral=fitnessLogGrowth(2,.5,.5);near(neutral.logG,0);near(neutral.G,1);assert.ok(neutral.A>1);const loser=fitnessLogGrowth(1.8,.4,.5);assert.ok(loser.A>1&&loser.G<1);
});
test('sickle-cell balance and withdrawal follow independent genotype counts including recessive rare-allele limit',()=>{
 for(const s of[0,.01,.15,.3])for(const t of[.3,.8,1]){const q=s/(s+t),AA=(1-q)**2*(1-s),AS=2*q*(1-q),SS=q*q*(1-t),next=(SS+AS/2)/(AA+AS+SS);near(next,q);near(1-selStep(1-q,[1-s,1,1-t]),q);}
 for(const t of[.3,1])for(const q of[1e-5,.01,.1,.5]){const next=1-selStep(1-q,[1,1,1-t]),delta=-t*q*q*(1-q)/(1-t*q*q);near(next-q,delta);assert.ok(next<q);if(q===1e-5)near((next-q)/(-t*q*q),1,2e-5);}
});
import {clockPoisson,summarizeClock} from '../content/popgen/clock-model.shared.js';
test('clock event sampler retains Poisson moments across former normal-approximation cutoff; known-rate Pearson divisor is P',()=>{
 let state=61231;const rng=()=>((state=Math.imul(1664525,state)+1013904223>>>0)/2**32);for(const lam of[.5,3,41,100]){let s=0,s2=0;const N=40000;for(let j=0;j<N;j++){const d=clockPoisson(rng,lam);assert.ok(Number.isInteger(d)&&d>=0);s+=d;s2+=d*d;}near(s/N,lam,5*Math.sqrt(lam/N));assert.ok(Math.abs((s2/N-(s/N)**2)/lam-1)<.035);}
 const a=summarizeClock([[1,0],[1,2]],.5,1);near(a.dispersion,1);near(a.fittedRate,.5);assert.equal(a.overflow,0);
});
test('dominant moth sweeps have independently fitted genotype-count anchors and distinct rare-allele limits',()=>{
 const run=(f,s,T,up)=>{let p=1-Math.sqrt(1-f);for(let j=0;j<T;j++){const q=1-p,AA=p*p*(up?1:1-s),Aa=2*p*q*(up?1:1-s),aa=q*q*(up?1-s:1);p=(AA+Aa/2)/(AA+Aa+aa);}return 1-(1-p)**2;};near(run(.01,.2544810764702793,47,true),.98);near(run(.93,.14771064425325026,41,false),.1);
 for(const s of[.1,.5]){const rare=1e-7,next=selStep(rare,[1-s,1-s,1]);near(next/rare,1-s,1e-7);const q=1e-5,p=1-q,after=selStep(p,[1,1,1-s]);near((1-after-q)/(q*q),-s,.00002);}
});
import {resistanceStep,resistanceBalance,resistanceFractions} from '../content/popgen/ch04.shared.js';
test('resistance life cycle matches independent normalized counts and exact quadratic balance, including zero influx',()=>{
 for(const c of[.005,.05,.3])for(const mu of[1e-9,1e-7,1e-5])for(const m of[0,.002,.05]){const p=resistanceBalance(c,mu,m);near(resistanceStep(p,c,0,mu,m,false),p,1e-12);if(m===0)near(p,mu/c);for(const on of[false,true])for(const p0 of[.001,.3,.99]){const R=p0*(1-c),S=(1-p0)*(on?.05:1),afterR=(1-m)*R/(R+S),afterS=(1-m)*S/(R+S)+m;near(resistanceStep(p0,c,.95,mu,m,on),afterR+mu*afterS);}}
 for(const p of[.01,.5,.99]){const q=resistanceStep(p,.1,.5,0,0,false);assert.ok(q<p);near((q/(1-q))/(p/(1-p)),.9);}assert.equal(resistanceStep(1,.1,.5,0,0,false),1);
 let pair=[.001,.999];for(let k=0;k<200;k++)pair=resistanceFractions(...pair,.3,.95,0,0,true);assert.ok(pair[1]>0);const before=pair[1];for(let k=0;k<100;k++)pair=resistanceFractions(...pair,.3,.95,0,0,false);assert.ok(pair[1]>before*1e10);
});
