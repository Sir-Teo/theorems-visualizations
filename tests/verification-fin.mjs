import test from 'node:test';
import assert from 'node:assert/strict';
import {data,ols,excess} from '../content/fin/ch04.shared.js';

test('factor regression recovers an independently specified three-factor return equation',()=>{
 const n=121, X=[Array.from({length:n},(_,i)=>Math.sin(.7*i)),Array.from({length:n},(_,i)=>Math.cos(.3*i)),Array.from({length:n},(_,i)=>(i%7)-3)];
 const beta=[.02,1.2,.3,-.4], y=X[0].map((_,i)=>beta[0]+X.reduce((s,col,k)=>s+beta[k+1]*col[i],0)),f=ols(y,X);
 beta.forEach((b,k)=>assert.ok(Math.abs(f.b[k]-b)<1e-12));assert.ok(Math.abs(f.r2-1)<1e-12);
});

test('French 202608 source-audited data give the independently calculated alpha summaries',()=>{
 const D=data();assert.equal(D.n,758);assert.equal(D.p25.length,25);
 const expected=[[0,342,.030834456719105813,.01125706052965574],[342,758,.020709057621428047,.013901861155244053],[0,758,.023606611792710883,.01041815661562791]];
 for(const[a,b,capm,ff]of expected){let c=0,f=0;for(const p of D.p25){const y=excess(p,D.rf);c+=Math.abs(12*ols(y,[D.mkt],a,b).b[0]);f+=Math.abs(12*ols(y,[D.mkt,D.smb,D.hml],a,b).b[0]);}assert.ok(Math.abs(c/25-capm)<1e-12);assert.ok(Math.abs(f/25-ff)<1e-12);}
});


import {bachelierCall} from '../content/fin/ch05-c.js';
test('Bachelier call agrees with independent Gaussian quadrature and put-call parity',()=>{
 for(const [S,K,s,T] of [[100,102,1,40],[100,85,.2,1],[100,115,2,60],[100,100,1,1]]){
  const sd=s*Math.sqrt(T),N=100000,h=16/N;let integral=0;
  for(let i=0;i<N;i++){const z=-8+(i+.5)*h;integral+=Math.max(S+sd*z-K,0)*Math.exp(-z*z/2)/Math.sqrt(2*Math.PI)*h;}
  const call=bachelierCall(S,K,s,T);assert.ok(Math.abs(call-integral)<2e-7);assert.ok(Math.abs(call-bachelierCall(K,S,s,T)-(S-K))<1e-10);
 }
 assert.ok(Math.abs(bachelierCall(100,100,1,1)-1/Math.sqrt(2*Math.PI))<1e-12);assert.equal(bachelierCall(100,95,0,10),5);
});


import {marginOutcome,ouSpreadStep} from '../content/fin/ch05-b.js';
test('margin accounting preserves capital for inadmissible leverage and realizes observed gap losses',()=>{
 assert.deepEqual(marginOutcome([5,8,0],30,.2),{day:0,equity:1,admissible:false});
 const breached=marginOutcome([5,8,0],30,.03);assert.equal(breached.day,1);assert.ok(Math.abs(breached.equity-.1)<1e-14);assert.equal(breached.admissible,true);
 const o=marginOutcome([5,4,0],10,.05);assert.equal(o.day,-1);assert.equal(o.equity,1.5);
 const jump=marginOutcome([5,20,0],10,.05);assert.equal(jump.day,1);assert.equal(jump.equity,-.5);
});

test('OU exact transitions have the analytic conditional mean and variance',()=>{
 const k=.05,s=.6,m=5,a=ouSpreadStep(m,k,s,1),b=ouSpreadStep(m,k,s,-1);
 assert.ok(Math.abs((a+b)/2 - m*Math.exp(-k))<1e-14);
 assert.ok(Math.abs((a-b)**2/4 - s*s*(1-Math.exp(-2*k))/(2*k))<1e-14);
 assert.equal(ouSpreadStep(5,0,.6,2),6.2);
});


import {equityPremiumCalibration} from '../content/fin/ch04-b.js';
test('equity premium calibration converts arithmetic returns to log gaps and retains large required risk aversion',()=>{
 const a=equityPremiumCalibration(.0618,.3*.036*.2);
 assert.ok(Math.abs(a.logGap-Math.log(1.0698/1.008))<1e-15);
 assert.ok(Math.abs(a.gamma-27.55)<.02);
 const extreme=equityPremiumCalibration(.1,.1*.015*.1);assert.ok(extreme.gamma>600);
});


import {finiteDividendValue} from '../content/fin/ch05-c.js';
test('finite-horizon fundamental equals an independent discounted dividend sum and ends at zero',()=>{
 for(const r of [.02,.05,.1])for(const T of [1,5,25,50]){
  const direct=Array.from({length:T},(_,k)=>5/(1+r)**(k+1)).reduce((a,b)=>a+b,0);
  assert.ok(Math.abs(finiteDividendValue(5,r,T)-direct)<1e-11);
  assert.ok(Math.abs((finiteDividendValue(5,r,T-1)+5)/(1+r)-direct)<1e-11);
 }
 assert.equal(finiteDividendValue(5,.05,0),0);
});
