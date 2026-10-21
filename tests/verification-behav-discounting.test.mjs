import test from 'node:test';import assert from 'node:assert/strict';
import {THALER_FORM_C as C,THALER_FORM_A_YEAR as A,hyperbolicDiscount as D,hyperbolicAverageRate as avg,hyperbolicInstantaneousRate as inst,hyperbolicFitError as err,fitThalerHyperbola as fit,magnitudeModel} from '../content/behav/source-audit-discounting.js';
const near=(a,b,t=1e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Thaler median observations preserve actual forms A and C, with consistent continuously compounded money rates',()=>{
 assert.deepEqual(C.map(x=>[x.t,x.now,x.later]),[[1/12,15,20],[1,15,50],[10,15,100]]);assert.deepEqual(A.map(x=>[x.now,x.later]),[[15,60],[250,350],[3000,4000]]);
 for(const p of C){near(p.now*Math.exp(p.rate*p.t),p.later);near(p.rate,Math.log(p.later/p.now)/p.t);}for(const p of A)near(p.now*Math.exp(p.rate),p.later);
 near(C[1].rate,1.2039728043259361);assert.notEqual(C[1].later,A[0].later);
});
test('Hyperbola derivative/average rates, matched-exponential crossing and specified exponential-rate mixture agree independently',()=>{
 for(const k of[.2,1,4.8,20]){
  near(avg(k,0),k);near(inst(k,0),k);near(D(k,1),Math.exp(-Math.log1p(k)));
  for(const t of[.05,1/12,.5,1,3,10,20]){const h=1e-6,der=(D(k,t+h)-D(k,t-h))/(2*h);near(-der/D(k,t),inst(k,t),3e-9);near(-Math.log(D(k,t))/t,avg(k,t));assert.ok(inst(k,t)<avg(k,t)&&avg(k,t)<k);
   if(t<1)assert.ok(D(k,t)<Math.exp(-Math.log1p(k)*t));if(t>1)assert.ok(D(k,t)>Math.exp(-Math.log1p(k)*t));
   // Substitution x=(1+kt)r/k makes the independent Simpson integral
   // over the exponentially distributed rate density resolve every scale.
   const n=2000,end=32,dt=end/n;let integral=1+Math.exp(-end);for(let i=1;i<n;i++)integral+=(i%2?4:2)*Math.exp(-i*dt);integral*=dt/(3*(1+k*t));near(integral,D(k,t),4e-10);
  }
 }
 // An arbitrary mixture is NOT this hyperbola: a degenerate rate is exponential.
 assert.ok(Math.abs(Math.exp(-1)-D(1,1))>.1);
});
test('Approximate fit minimizes the specified 601-candidate squared-log-rate objective without interpolating three medians',()=>{
 const objective=k=>[[1/12,20],[1,50],[10,100]].reduce((s,[t,x])=>s+Math.log((Math.log(1+k*t)/t)/(Math.log(x/15)/t))**2,0);
 const m=fit();near(m.error,objective(m.k));near(m.error,err(m.k));assert.ok(m.error>1e-4&&m.index>0&&m.index<600);
 for(let i=0;i<=600;i++){const k=Math.exp(Math.log(.2)+i*Math.log(100)/600);assert.ok(objective(k)>=m.error-1e-13);}
 let lo=Math.log(.2),hi=Math.log(20);for(let i=0;i<100;i++){const l=lo+(hi-lo)/3,r=hi-(hi-lo)/3;if(objective(Math.exp(l))<objective(Math.exp(r)))hi=r;else lo=l;}
 assert.ok(Math.abs(Math.log(m.k)-(lo+hi)/2)<Math.log(100)/600);
});
test('Full amount/rate control family stays positive, reports actual monotonic direction and uses exact log compensation',()=>{
 for(const large of[.05,.6])for(const small of[.4,3])for(const curvature of[.3,2])for(const single of[.05,1.5])for(const lossFraction of[.2,1])for(const loss of[false,true]){
  const m=magnitudeModel({large,small,curvature,single,lossFraction,loss});assert.ok(m.low>0);assert.equal(m.direction,small>large?'decreases':'increases');let last=m.rate(10);
  for(const a of[10,15,100,250,3000,5000]){const r=(large+(small-large)*(15/a)**curvature)*(loss?lossFraction:1);near(m.rate(a),r);assert.ok(r>=m.low-1e-12&&r<=m.high+1e-12);assert.ok(small>large?r<=last+1e-12:r>=last-1e-12);last=r;
   for(const t of[.25,1,5]){near(m.logRatio(a,t),r*t);const ratio=Math.exp(r*t);assert.ok(Number.isFinite(ratio)&&ratio>=1);near(Math.log(ratio),r*t);}
  }
 }
 const increasing=magnitudeModel({large:.6,small:.4,curvature:2}),large=magnitudeModel({large:.05,small:3,curvature:2});near(increasing.rate(10),.15);assert.equal(increasing.direction,'increases');assert.ok(large.rate(10)>6);assert.equal(magnitudeModel({large:.4,small:.4}).direction,'is constant');
});
test('A common nonlinear utility discount factor can produce a gain/loss money-rate asymmetry',()=>{
 // u(c)=log(c), constant baseline c, present equivalent q(x) solves
 // log(c+q)-log(c)=delta*(log(c+x)-log(c)). This is an exact DU example.
 const c=1000,delta=.9,r=-Math.log(delta);for(const x of[10,100,500]){const gain=c*Math.expm1(delta*Math.log1p(x/c)),loss=-c*Math.expm1(delta*Math.log1p(-x/c)),rg=Math.log(x/gain),rl=Math.log(x/loss);assert.ok(rg>r&&rl<r&&rg>rl);near(Math.log1p(gain/c),delta*Math.log1p(x/c));near(Math.log1p(-loss/c),delta*Math.log1p(-x/c));}
});
