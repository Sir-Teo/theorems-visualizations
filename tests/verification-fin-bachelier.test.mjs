import test from 'node:test';import assert from 'node:assert/strict';
import {normalPdf as phi,normalUpperTail as Q,normalCall as call,normalCallIntegral as quad,bachelierLaw as law,standardGaussianWalks as walks,sampledBachelier as sample,terminalHistogram as hist} from '../content/fin/source-audit-bachelier.js';
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`),rel=(a,b,t=2e-8)=>assert.ok(Math.abs(a/b-1)<=t,`${a} != ${b}`);
const simpson=(f,a,b,n=4000)=>{const h=(b-a)/n;let sum=f(a)+f(b);for(let j=1;j<n;j++)sum+=(j%2?4:2)*f(a+j*h);return sum*h/3;};
test('Original Gaussian/heat/ATM-premium mapping has normalized density, linear variance and heat diffusivity sigma²/2',()=>{
 for(const sigma of[.2,1,2])for(const time of[1,40,60]){const r=law(sigma,time,100),sd=sigma*Math.sqrt(time),D=sigma*sigma/2,k=sigma/Math.sqrt(2*Math.PI);near(r.sd,sd);near(r.call,k*Math.sqrt(time));near(simpson(z=>phi(z),-12,12),1);near(simpson(z=>(sd*z)**2*phi(z),-12,12),sigma*sigma*time,1e-11);
  for(const z of[-2,-.5,0,1,3]){const x=100+z*sd,p=r.pdf(x),dt=time*1e-4,dx=sd*1e-3;const density=(x,t)=>Math.exp(-((x-100)**2)/(4*D*t))/Math.sqrt(4*Math.PI*D*t);near(p,density(x,time),1e-13);const pt=(density(x,time+dt)-density(x,time-dt))/(2*dt),pxx=(density(x+dx,time)-2*p+density(x-dx,time))/(dx*dx);assert.ok(Math.abs(pt-D*pxx)<2e-6*Math.max(1,Math.abs(pt)));}
 }
});
test('Stable call formula matches independent90-digit Laplace-CF tail references and transformed positive-payoff quadrature',()=>{
 // Decimal precision90, pi90digits; R(a)=1/(a+1/(a+2/(a+...)))
 // evaluated backward with4000terms; value=phi(a)*(1-a*R(a)).
 const reference=[[0,.39894228040143267793994605993438187],[1,.083315470587686298383062738567598577],[4,.0000071452584324056667589914615520806794],[8,7.5502624119464989137388477440283922e-17],[15,2.4260250875289830482633737378721139e-52],[30,1.6319567340914011893504890710173455e-199],[37,1.5451991905122024592642342461147604e-301]];
 for(const[a,c]of reference){rel(call(0,a,1),c,3e-9);rel(quad(0,a,1),c,2e-8);near(call(0,-a,1)-call(0,a,1),a,1e-13);}
 for(const sigma of[.2,1,2])for(const time of[1,6,40,60])for(const strike of[85,100,102,104,115]){const r=law(sigma,time,strike);if(r.call)rel(r.integral,r.call,2e-8);else assert.equal(r.integral,0);near(r.integrand(r.peakX),r.peakY,1e-13);assert.ok(r.peakX>strike);for(const dx of[-r.sd/10,r.sd/10])assert.ok(r.integrand(r.peakX+dx)<=r.peakY*(1+1e-12));}
 assert.equal(call(100,85,0),15);assert.equal(call(100,115,0),0);
});
test('Entire actual sigma/time/strike grid is nonnegative, finite and monotone; delta/gamma are independent Gaussian identities',()=>{
 for(let si=0;si<=36;si++){const sigma=.2+.05*si;for(let time=1;time<=60;time++){const sd=sigma*Math.sqrt(time);let prev=Infinity;for(let ki=0;ki<=60;ki++){const strike=85+.5*ki,c=call(100,strike,sd);assert.ok(Number.isFinite(c)&&c>=Math.max(100-strike,0)&&c<=Math.max(100-strike,0)+sd/Math.sqrt(2*Math.PI)+1e-12);assert.ok(c<=prev+1e-12);prev=c;}}}
 for(const sd of[.2,2,15])for(const strike of[95,100,105]){const h=1e-3*sd,c=call(100,strike,sd),up=call(100+h,strike,sd),down=call(100-h,strike,sd),d=(100-strike)/sd;near((up-down)/(2*h),Q(-d),2e-7);near((up-2*c+down)/(h*h),phi(d)/sd,2e-6);assert.ok(call(100,strike,sd*1.1)>=c);}
});
test('Seeded-walk construction, daily-monitoring observations and sample standard errors match direct finite accounting',()=>{
 let j=0;const z=[1,-2,3,4,-5,6],p=walks(()=>z[j++],2,3);assert.deepEqual(p.map(a=>[...a]),[[0,1,-1,2],[0,4,-1,5]]);
 for(const sigma of[.2,2])for(const time of[1,2,3])for(const strike of[85,100,102,115]){const s=sample(p,sigma,time,strike),prices=p.map(p=>100+sigma*p[time]),payoffs=prices.map(x=>Math.max(x-strike,0)),mean=payoffs.reduce((a,b)=>a+b)/2,SE=Math.abs(payoffs[0]-payoffs[1])/2;assert.deepEqual(s.prices,prices);near(s.call,mean,1e-13);near(s.callSE,SE,1e-13);near(s.terminalAbove,prices.filter(x=>x>=strike).length/2);near(s.dailyHit,p.filter(a=>[...a].slice(0,time+1).some(x=>100+sigma*x>=strike)).length/2);assert.ok(s.dailyHit>=s.terminalAbove);}
 const hand=[Float64Array.from([0,5,-1]),Float64Array.from([0,-1,4]),Float64Array.from([0,-2,-3])];near(sample(hand,1,2,103).dailyHit,2/3);near(sample(hand,1,2,103).terminalAbove,1/3);
});
test('Continuous barrier hypotheses differ from finite monitoring; density histograms count every extreme observation with area one',()=>{
 for(const sigma of[.2,2])for(const time of[1,60]){for(const strike of[85,100])assert.equal(law(sigma,time,strike).continuousHit,1);for(const strike of[100.5,102,115]){const r=law(sigma,time,strike);near(r.continuousHit,2*r.terminalAbove,1e-14);assert.ok(r.continuousHit>=0&&r.continuousHit<=1);assert.ok(law(2,time,strike).continuousHit>=r.continuousHit);assert.ok(law(sigma,60,strike).continuousHit>=r.continuousHit);}}
 // Exact walk reflection identity, with the lattice endpoint correction.
 for(let n=1;n<=10;n++)for(let b=1;b<=n;b++){let hit=0,endGE=0,endGT=0;for(let bits=0;bits<2**n;bits++){let x=0,mx=0;for(let t=0;t<n;t++){x+=(bits>>>t)&1?1:-1;mx=Math.max(mx,x);}hit+=+(mx>=b);endGE+=+(x>=b);endGT+=+(x>b);}assert.equal(hit,endGE+endGT);}
 const prices=Array.from({length:4000},(_,i)=>100+4*Math.sin(i));prices[0]=-200;prices[3999]=800;const h=hist(prices,2);assert.equal(h.bins.reduce((s,b)=>s+b.count,0),4000);near(h.bins.reduce((s,b)=>s+(b.hi-b.lo)*b.density,0),1,1e-13);assert.ok(h.lo<-200&&h.hi>800);for(const x of prices){const found=h.bins.filter(b=>x>=b.lo&&x<b.hi);assert.equal(found.length,1);}
 const finite=hist([99,100,101],.2);assert.ok(finite.lo<=98.9&&finite.hi>=101.1);
});
