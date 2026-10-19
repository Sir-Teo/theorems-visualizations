import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {data,ols,excess} from '../content/fin/ch04.shared.js';
import {premiumScenario,normalProspectParts,prospectValue,prospectHorizon} from '../content/fin/source-audit-factor-premium.js';
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('758 months × 29 empirical series match independently normalized author 202608 CSV downloads',()=>{
 const d=data();assert.equal(d.n,758);for(const x of[d.mkt,d.smb,d.hml,d.rf,...d.p25])assert.equal(x.length,758);
 const canonical=Array.from({length:758},(_,i)=>[d.mkt[i],d.smb[i],d.hml[i],d.rf[i],...d.p25.map(p=>p[i])].map(x=>Math.round(x*10000)).join(',')).join('\n');
 assert.equal(createHash('sha256').update(canonical).digest('hex'),'105b3f6c1c76f199595fd3aa4134432ca839d8226b391b2212484c29b7923d62');
});
// Independent twice-reorthogonalized modified Gram–Schmidt; production solves
// normal equations, so agreement does not compare two copies of its solver.
function qr(y,cols){const n=y.length,Q=[],R=cols.map(()=>cols.map(()=>0));for(let j=0;j<cols.length;j++){let q=cols[j].slice();for(let pass=0;pass<2;pass++)for(let k=0;k<j;k++){const r=q.reduce((s,v,i)=>s+v*Q[k][i],0);R[k][j]+=r;q=q.map((v,i)=>v-r*Q[k][i]);}R[j][j]=Math.hypot(...q);Q.push(q.map(v=>v/R[j][j]));}const z=Q.map(q=>q.reduce((s,v,i)=>s+v*y[i],0)),b=z.slice();for(let j=b.length-1;j>=0;j--){for(let k=j+1;k<b.length;k++)b[j]-=R[j][k]*b[k];b[j]/=R[j][j];}const residual=y.map((v,i)=>v-cols.reduce((s,c,k)=>s+c[i]*b[k],0));return {b,residual};}
test('all 150 window/portfolio regressions agree with independent QR; residuals orthogonal, nested R² and disclosed annualization',()=>{
 const d=data();for(const[a,b]of[[0,342],[342,758],[0,758]])for(const p of d.p25){let old=-Infinity;for(const factors of[[d.mkt],[d.mkt,d.smb,d.hml]]){
  const y=Array.from(excess(p,d.rf).slice(a,b)),cols=[y.map(()=>1),...factors.map(x=>Array.from(x.slice(a,b)))],q=qr(y,cols),prod=ols(excess(p,d.rf),factors,a,b);for(let j=0;j<q.b.length;j++)near(prod.b[j],q.b[j],2e-12);
  const mean=y.reduce((s,v)=>s+v,0)/y.length,r2=1-q.residual.reduce((s,v)=>s+v*v,0)/y.reduce((s,v)=>s+(v-mean)**2,0);near(prod.r2,r2,2e-13);assert.ok(r2>=old-1e-13);old=r2;
  for(const c of cols)near(q.residual.reduce((s,v,i)=>s+v*c[i],0),0,2e-12);near(12*prod.b[0],12*q.b[0],2e-12);
 }}
});
test('lognormal moment matching and both Euler pricing identities hold over every control corner',()=>{
 for(const premium of[.02,.0618,.1])for(const consumptionSd of[.015,.036,.06])for(const stockLogSd of[.1,.2,.3])for(const rho of[.1,.3,1])for(const beta of[.9,.99,1]){
  const m=premiumScenario({premium,consumptionSd,stockLogSd,rho,beta});near(Math.exp(m.logMean+m.variance/2),1.018);near(Math.sqrt(Math.expm1(m.variance)*Math.exp(2*m.logMean+m.variance)),consumptionSd);
  near(Math.expm1(m.target)*1.008,premium);near(m.gamma*m.covariance,m.target);near(m.consumptionGamma*m.variance,m.target);
  for(const g of[0,3,10,m.gamma,m.consumptionGamma]){const Em=beta*Math.exp(-g*m.logMean+g*g*m.variance/2);near(Math.exp(m.logRiskless(g))*Em,1,1e-10);
   const logER=m.logRiskless(g)+g*m.covariance,meanLogEquity=logER-stockLogSd**2/2;
   const logEuler=Math.log(beta)+meanLogEquity-g*m.logMean+.5*(stockLogSd**2+g*g*m.variance-2*g*m.covariance);near(logEuler,0,1e-10);
  }for(const g of[m.claimDomain[0],m.claimDomain[1]])near(m.claimLogDiscount(g),0,2e-12);const middle=(m.claimDomain[0]+m.claimDomain[1])/2;assert.ok(m.claimLogDiscount(middle)<0);assert.ok(m.claimLogDiscount(m.claimDomain[1]+1)>0);
  assert.ok(m.maxGamma>m.gamma&&m.maxGamma>m.consumptionGamma);assert.ok(Number.isFinite(m.riskless(m.gamma))&&m.riskless(m.gamma)>=-1);
 }
 const m=premiumScenario();assert.ok(m.claimLogDiscount(10)<0&&m.claimLogDiscount(m.consumptionGamma)>0);near(m.riskless(10),.12717095240867624);near(Math.exp(m.logRiskless(10))*Math.expm1(10*m.variance),.014175700652577214);near(m.gamma,28.05256511164332);near(m.consumptionGamma,47.6107272508886);
});
const phi=x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
function simpson(f,a,b,n){let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+(b-a)*i/n);return s*(b-a)/(3*n);}
function independentParts(d,a){const end=Math.sqrt(Math.abs(d)+13);return ['gain','loss'].map((_,i)=>simpson(t=>2*t**(2*a+1)*phi(t*t+(i?d:-d)),0,end,8192));}
test('gain/loss quadrature agrees with independent Simpson and exact linear Gaussian positive parts',()=>{
 for(const a of[.5,.88,1])for(const d of[0,.1,.8,3,6]){const p=normalProspectParts(d,a),[g,l]=independentParts(d,a);near(p.gain,g,2e-10);near(p.loss,l,2e-10);
  if(a===1){const Phi=.5+simpson(phi,0,d,2048);near(p.gain,phi(d)+d*Phi,2e-12);near(p.loss,phi(d)-d*(1-Phi),2e-12);}
 }
 for(const h of[.05,1,10])for(const pi of[.02,.1])for(const sd of[.1,.3])near(prospectValue(h,pi,sd,1,1),pi*h,2e-12);
});
test('Gaussian prospect crossing is unique, uncapped, and classifies all-positive and off-window cases',()=>{
 for(const pi of[.02,.0618,.1])for(const sd of[.1,.2,.3])for(const a of[.5,.88,1])for(const lambda of[1,2.25,4]){
  const h=prospectHorizon(pi,sd,a,lambda);if(lambda===1){assert.equal(h,0);assert.ok(prospectValue(.05,pi,sd,a,lambda)>0);continue;}
  near(prospectValue(h,pi,sd,a,lambda),0,2e-12);assert.ok(prospectValue(h*.8,pi,sd,a,lambda)<0);assert.ok(prospectValue(h*1.2,pi,sd,a,lambda)>0);
  near(prospectHorizon(pi*2,sd,a,lambda),h/4,1e-11);
 }
 near(prospectHorizon(.0618,.2,.88,2.25),1.1764424119627879,1e-11);assert.ok(prospectHorizon(.02,.3,.5,4)>10);assert.ok(prospectHorizon(.1,.1,1,1.05)<.05);
});
