import test from 'node:test';
import assert from 'node:assert/strict';
import { cdBudgetDemand, blissBudgetDemand, walrasBudgetState, existenceExchangeState, exchangeExcessBranch } from '../content/micro/source-audit-exchange.js';
const close=(a,b,t=2e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];

test('CD demands exhaust budgets, obey price homogeneity and globally maximize utility on budget segments',()=>{
 for(const a of[.01,.35,.4,.5,.6,.99])for(const p of[.001,.1,.2,1,5,10,1000])for(const w of[[.4,9.6],[9.6,.4],[7,2],[3,8]]){
  const prices=[p,1],m=dot(prices,w),d=cdBudgetDemand(a,prices,w),scaled=cdBudgetDemand(a,[7*p,7],w);
  close(dot(prices,d),m);close(a/d[0]/((1-a)/d[1]),p);d.forEach((x,i)=>close(x,scaled[i]));
  const logU=x=>a*Math.log(x[0])+(1-a)*Math.log(x[1]),u=logU(d);
  for(let i=1;i<100;i++){const x=m/p*i/100,y=m-p*x;assert.ok(logU([x,y])<=u+1e-10);}
 }
});

test('bliss demands match an independent constrained scalar minimizer, including exact affordability and active nonnegative bounds',()=>{
 const reference=(p,m)=>{
  if(m>=4*p+4)return[4,4];
  const derivative=x=>2*(x-4)-2*p*(m-p*x-4);let lo=0,hi=m/p;
  if(derivative(lo)>=0)return[lo,m];if(derivative(hi)<=0)return[hi,0];
  for(let k=0;k<100;k++){const mid=(lo+hi)/2;if(derivative(mid)>0)hi=mid;else lo=mid;}
  const x=(lo+hi)/2;return[x,m-p*x];
 };
 for(const p of[.001,.1,.2,2/3-1e-9,2/3,2/3+1e-9,1,5,10,1000])for(const m of[.001,.1,1,3,7*p+2,20,100]){
  const d=blissBudgetDemand(p,m),ref=reference(p,m);d.forEach((x,i)=>close(x,ref[i]));assert.ok(d.every(x=>x>=0));assert.ok(dot([p,1],d)<=m+1e-9);
  const loss=x=>(x[0]-4)**2+(x[1]-4)**2;
  for(let i=0;i<=100;i++){const x=m/p*i/100;assert.ok(loss(d)<=loss([x,m-p*x])+1e-7);}
 }
});

test('all 401 log-price grid positions satisfy independent budget accounting; exact one-market roots distinguish exhaustion from satiation',()=>{
 for(const satiated of[false,true])for(let i=0;i<=400;i++){
  const p=.1*100**(i/400),s=walrasBudgetState(p,satiated);
  const spending=[dot([p,1],s.demandA),dot([p,1],s.demandB)],income=[7*p+2,3*p+8],z=s.demandA.map((x,j)=>x+s.demandB[j]-10);
  close(s.value,p*z[0]+z[1]);close(s.value,spending[0]+spending[1]-income[0]-income[1]);
  close(s.value,-(s.unspentA+s.unspentB));close(s.unspentA,satiated?Math.max(0,3*p-2):0);close(s.unspentB,0);
  if(!satiated)close(s.value,0);
 }
 const a=walrasBudgetState(22/23,false),b=walrasBudgetState(8/7,true);a.z.forEach(z=>close(z,0));close(b.z[0],0);close(b.z[1],-10/7);close(b.unspentA,10/7);
 close(walrasBudgetState(.1,false).z[0],49.25);close(walrasBudgetState(10,false).z[1],52);
 close(walrasBudgetState(2/3,true).unspentA,0);assert.ok(walrasBudgetState(2/3+1e-7,true).unspentA>0);
});

test('all 34,225 actual endowment pairs have the exact CD equilibrium, independent budgets, market clearing and correct finite bracket signs',()=>{
 for(let ix=0;ix<=184;ix++)for(let iy=0;iy<=184;iy++){
  const wx=.4+.05*ix,wy=.4+.05*iy,p=(.5*wy+.4*(10-wy))/(.5*wx+.6*(10-wx));
  const s=existenceExchangeState(p,wx,wy,false);close(s.equilibriumPrice,p);s.z.forEach(z=>close(z,0));
  close(dot([p,1],s.demandA),p*wx+wy);close(dot([p,1],s.demandB),p*(10-wx)+10-wy);
  assert.ok(p>.2&&p<5);assert.ok(exchangeExcessBranch(.2,wx,wy)>0);assert.ok(exchangeExcessBranch(5,wx,wy)<0);
  for(const q of[.2,1,5]){const a=existenceExchangeState(q,wx,wy,false);close(exchangeExcessBranch(q,wx,wy),a.z[0]);close(a.value,0);}
 }
});

test('exact nonconvex demand branches exclude every positive-price equilibrium, including both actual tie maximizers, throughout the endowment grid',()=>{
 for(let ix=0;ix<=184;ix++)for(let iy=0;iy<=184;iy++){
  const wx=.4+.05*ix,wy=.4+.05*iy,g=10-(wx+wy)/2;assert.ok(g>=.4-1e-12);
  for(const p of[.0001,.2,.99999,1,1.00001,5,10000]){
   const s=existenceExchangeState(p,wx,wy,true),branch=p<=1?'left':'right';
   close(exchangeExcessBranch(p,wx,wy,branch),s.z[0]);assert.ok(p<=1?s.z[0]>=g-1e-10:s.z[0]<=-g+1e-10);
   close(p*s.demandA[0]+s.demandA[1],p*wx+wy);close(p*s.demandB[0]+s.demandB[1],s.incomeB);close(s.value,0);
   assert.equal(s.equilibriumPrice,null);
   if(p===1){assert.ok(s.alternateB);close(s.z[0],g);close(s.demandA[0]+s.alternateB[0]-10,-g);close(s.incomeB**2,s.demandB[0]**2+s.demandB[1]**2);}
  }
 }
 for(const wx of[.4,7,9.6])for(const wy of[.4,3,9.6])for(const p of[.2,1,5]){
  const s=existenceExchangeState(p,wx,wy,true),u=x=>x[0]**2+x[1]**2,selected=u(s.demandB);
  for(let i=0;i<=100;i++){const x=s.incomeB/p*i/100;assert.ok(u([x,s.incomeB-p*x])<=selected+1e-8);}
  if(p===1)for(let i=1;i<100;i++)assert.ok(u([s.incomeB*i/100,s.incomeB*(1-i/100)])<selected);
 }
});
