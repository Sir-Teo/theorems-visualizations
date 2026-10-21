import test from'node:test';import assert from'node:assert/strict';
import{monopolyWelfareState as welfare,finiteDiscriminationState as finite}from'../content/micro/source-audit-monopoly-welfare.js';
const close=(x,y,tol=2e-10)=>assert.ok(Math.abs(x-y)<=tol*Math.max(1,Math.abs(y)),`${x} != ${y}`);
function root(f){let lo=0,hi=1;while(f(hi)>0)hi*=2;for(let i=0;i<90;i++){const mid=(lo+hi)/2;if(f(mid)>0)lo=mid;else hi=mid;}return(lo+hi)/2;}
function simpson(f,a,b,n=8192){let sum=f(a)+f(b);for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(a+(b-a)*i/n);return sum*(b-a)/(3*n);}
function numericalBenefit(kind,e,q){if(!q)return 0;return simpson(t=>{if(!t)return 0;const x=q*t**8,dx=8*q*t**7;return(kind==='lin'?12-x:8*x**(-1/e))*dx;},0,1);}
test('Adaptive independent roots cover every actual cost/elasticity setting, including the former 65,536-unit failure',()=>{
 for(let ci=0;ci<=90;ci++)for(let ei=0;ei<=52;ei++){
  const c=.5+.05*ci,e=1.4+.05*ei;
  for(const kind of['lin','iso']){
   const p=welfare(kind,c,e),P=q=>kind==='lin'?12-q:8/Math.pow(q,1/e),MR=q=>kind==='lin'?12-2*q:P(q)*(1-1/e);
   close(p.qm,root(q=>MR(q)-c));close(p.qc,root(q=>P(q)-c));assert.ok(p.qm>0&&p.qm<p.qc&&Number.isFinite(p.dwl)&&p.dwl>0);close(P(p.qm),p.pm);close(MR(p.qm),c);close(P(p.qc),c);
  }
 }
 const p=welfare('iso',.5,4);close(p.qc,65536);close(p.qm,20736);assert.ok(p.qm>400&&p.qc>400);
});
test('Independent transformed numerical integrals include the singular near-zero benefit and recover transfer plus deadweight loss',()=>{
 for(const kind of['lin','iso'])for(const c of[.5,2.35,5])for(const e of[1.4,1.75,2,2.65,4]){
  const p=welfare(kind,c,e),nm=numericalBenefit(kind,e,p.qm),nc=numericalBenefit(kind,e,p.qc);
  close(p.benefit(p.qm),nm,2e-8);close(p.benefit(p.qc),nc,2e-8);close(p.wm,nm-c*p.qm,2e-8);close(p.wc,nc-c*p.qc,2e-8);
  const lost=simpson(q=>(kind==='lin'?12-q:8/Math.pow(q,1/e))-c,p.qm,p.qc);
  close(p.dwl,lost,2e-9);close(p.wm,p.profit+p.cs);close(p.competitiveCS-p.cs,p.transfer+p.dwl);
  if(kind==='lin')close(p.dwl,(p.pm-c)*(p.qc-p.qm)/2);
 }
});
test('Independent global output searches verify monopoly profit and efficient surplus rather than only the marginal equations',()=>{
 for(const kind of['lin','iso'])for(const c of[.5,1.85,5])for(let ei=0;ei<=52;ei++){
  const e=1.4+.05*ei,p=welfare(kind,c,e),profit=q=>q===0?0:q*((kind==='lin'?12-q:8/Math.pow(q,1/e))-c);
  const qmax=kind==='lin'?12:1.2*p.qc;
  for(let i=0;i<=4096;i++){const q=qmax*i/4096;assert.ok(profit(q)<=p.profit+1e-8*Math.max(1,p.profit));assert.ok(p.welfare(q)<=p.wc+1e-8*Math.max(1,p.wc));}
  const h=p.qm*1e-4;assert.ok(profit(p.qm-h)<p.profit&&profit(p.qm+h)<p.profit);
 }
});
test('Exact finite-buyer accounting includes both missed gains and inefficient sales, every buyer count and actual posted-price setting',()=>{
 for(let n=5;n<=40;n++)for(const c of[0,2.35,6])for(let pi=0;pi<=200;pi++){
  const price=pi/20,p=finite(n,c,price),vals=Array.from({length:n},(_,i)=>(10*n-5-10*i)/n);
  const sold=vals.filter(v=>v>=price),surplus=sold.reduce((s,v)=>s+v-c,0),opt=vals.reduce((s,v)=>s+Math.max(0,v-c),0);
  close(p.total,surplus);close(p.profit,sold.length*(price-c));close(p.cs,sold.reduce((s,v)=>s+v-price,0));close(p.efficient,opt);close(p.dwl,opt-surplus);close(p.missed+p.waste,p.dwl);close(p.profit+p.cs,p.total);assert.ok(p.dwl>=-1e-10);
 }
 const bad=finite(5,6,0);close(bad.total,-5);close(bad.efficient,4);close(bad.dwl,9);close(bad.missed,0);close(bad.waste,9);assert.equal(bad.sold,5);
 const roundoffTie=finite(20,3.25,0,true);assert.equal(roundoffTie.sold,14);assert.equal(roundoffTie.values[13],3.25);
 const tied=finite(5,5,0,true);assert.equal(tied.sold,3);close(tied.cs,0);close(tied.profit,6);close(tied.dwl,0);
});
test('The finite-market best common price is global over all price intervals and perfect discrimination maximizes every feasible allocation',()=>{
 for(let n=5;n<=40;n++)for(let ci=0;ci<=120;ci++){
  const c=ci*.05,p=finite(n,c,0),pd=finite(n,c,0,true);
  const revenue=price=>p.values.filter(v=>v>=price).length*(price-c);
  const candidates=[0,10,...p.values.flatMap(v=>[v,Math.min(10,v+1e-9)])];
  for(const price of candidates)assert.ok(revenue(price)<=p.bestProfit+1e-9);
  close(revenue(p.bestPrice),p.bestProfit);close(pd.profit,p.efficient);close(pd.cs,0);close(pd.dwl,0);assert.ok(pd.profit>=p.bestProfit-1e-10);
 }
 for(let n=5;n<=12;n++)for(const c of[0,3.45,6]){
  const p=finite(n,c,0,true);
  for(let mask=0;mask<(1<<n);mask++){
   let surplus=0;for(let i=0;i<n;i++)if(mask&(1<<i))surplus+=p.values[i]-c;
   assert.ok(surplus<=p.profit+1e-10);
  }
 }
});
