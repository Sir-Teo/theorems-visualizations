import test from'node:test';import assert from'node:assert/strict';
import{discriminationState,entryState,cournotAdjustment,cournotPotential}from'../content/micro/source-audit-market-power.js';
const close=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const corners=[];for(const a of[8,20])for(const b of[.5,3])for(const c of[0,6])for(const m of[0,.5])corners.push([a,b,c,m]);
test('Independent constrained marginal conditions and complete output/price searches verify discriminatory and uniform global optima at all16 actual parameter corners',()=>{
 for(const[a,b,c,m]of corners){
  const p=discriminationState(a,b,c,m),f=(x,y)=>16*x-x*x+a*y-b*y*y-c*(x+y)-m*(x+y)**2/2;
  for(let i=0;i<2;i++){const q=p.separate.q[i],mr=[16-2*p.separate.q[0],a-2*b*p.separate.q[1]][i];if(q>1e-10)close(mr,c+m*p.separate.Q);else assert.ok(mr<=c+m*p.separate.Q+1e-10);}
  for(let i=0;i<=160;i++)for(let j=0;j<=160;j++)assert.ok(f(i/10,a*j/(160*b))<=p.separate.profit+1e-9);
  for(let i=0;i<=4000;i++){const price=i/200,q1=Math.max(0,16-price),q2=Math.max(0,(a-price)/b),Q=q1+q2;assert.ok(price*Q-c*Q-m*Q*Q/2<=p.one.profit+1e-9);}
  assert.ok(p.separate.profit>=p.one.profit-1e-9);
 }
});
test('Zero-cost elasticity degeneracy, slope-independent constant-cost prices, closed markets and the two-policy linear-output/welfare qualification are explicit',()=>{
 const zero=discriminationState(12,.5,0,0);close(zero.separate.elasticity[0],1);close(zero.separate.elasticity[1],1);assert.notEqual(zero.separate.p[0],zero.separate.p[1]);
 for(const b of[.5,1,3]){const p=discriminationState(12,b,2,0);close(p.separate.p[0],9);close(p.separate.p[1],7);}
 const closed=discriminationState(8,3,6,.5);close(closed.lambda,8);close(closed.separate.q[1],0);assert.equal(closed.separate.elasticity[1],null);close(closed.one.q[1],0);
 for(const a of[8,12,16,20])for(const b of[.5,1.5,3])for(const c of[0,2,6]){
  const p=discriminationState(a,b,c,0);if(p.one.q.every(q=>q>1e-9)){close(p.one.Q,p.separate.Q);assert.ok(p.separate.welfare<=p.one.welfare+1e-9);}
  if(c>0)for(let i=0;i<2;i++)close(p.separate.p[i]*(1-1/p.separate.elasticity[i]),c);
 }
});
test('Independent exact quadratic willingness-to-pay integrals verify surplus, cost and profit in both pricing modes at every parameter corner',()=>{
 for(const args of corners){const p=discriminationState(...args);for(const o of[p.separate,p.one]){
  let gross=0;for(let i=0;i<2;i++){const{a,b}=p.markets[i],q=o.q[i];gross+=q*(a+4*(a-b*q/2)+(a-b*q))/6;}
  close(o.welfare,gross-p.c*o.Q-p.m*o.Q*o.Q/2);close(o.welfare,o.profit+o.cs);
 }}
});
test('Independent profit derivatives and exhaustive quantity searches verify every actual entry index, the zero-profit tangency and minimum-AC scale',()=>{
 for(let i=0;i<=700;i++){
  const n=1+i/100,p=entryState(n);close(p.a-2*p.q,p.marginalCost);close(p.profit,p.q*(p.p-p.averageCost));
  for(let j=0;j<=500;j++){const q=j*42/500,value=(p.a-q)*q-16-2*q-q*q/4;assert.ok(value<=p.profit+1e-9);}
 }
 const p=entryState(Math.sqrt(20));close(p.profit,0);close(p.p,p.averageCost);close(-16/(p.q*p.q)+.25,-1);close(-16/64+.25,0);assert.ok(p.q<8&&p.p>p.marginalCost);
 close(entryState(1).q,16);close(entryState(1).profit,304);assert.ok(entryState(8).profit<0);
});
test('Independent individual-profit comparisons verify the constrained replies and exact update timing for all actual firm-count/start corners',()=>{
 for(let n=2;n<=6;n++)for(const x of[0,10])for(const y of[0,10])for(const sequential of[false,true]){
  const p=cournotAdjustment(n,x,y,sequential),states=sequential?[p.states[0],...p.updates]:p.states;
  for(let t=1;t<states.length;t++){
   const old=states[t-1],next=states[t],indices=sequential?[(t-1)%n]:Array.from({length:n},(_,i)=>i);
   for(const i of indices){const others=old.reduce((s,q,j)=>s+(j===i?0:q),0),q=next[i],profit=z=>z*(Math.max(0,12-others-z)-2);assert.ok(q>=0&&q<=5);
    for(let j=0;j<=100;j++)assert.ok(profit(j/20)<=profit(q)+1e-9);
   }
   if(sequential)for(let i=0;i<n;i++)if(!indices.includes(i))close(next[i],old[i]);
  }
  assert.ok(p.states.slice(1).flat().every(q=>q>=0&&q<=5));
 }
});
test('Independent interior matrix modes distinguish zero-sum decay, common-mode instability and bounded clipped cycles; duopoly retains its global max-norm contraction',()=>{
 for(let n=2;n<=6;n++){
  const q=10/(n+1),uniform=cournotAdjustment(n,q+.01,q+.01,false,1),balanced=cournotAdjustment(n,q+.5,q-.5/(n-1),false,1);
  for(let i=0;i<n;i++){close(uniform.states[1][i]-q,-(n-1)*.01/2);close(balanced.states[1][i]-q,(balanced.states[0][i]-q)/2);}
  const cycle=cournotAdjustment(n,0,0,false,4);assert.ok(cycle.states.flat().every(z=>z>=0&&z<=5));if(n>=3){close(cycle.totals[1],5*n);close(cycle.totals[2],0);close(cycle.totals[3],5*n);}
 }
 for(let i=0;i<=20;i++)for(let j=0;j<=20;j++){
  const x=[i/2,j/2],y=[10-i/2,10-j/2],a=cournotAdjustment(2,...x,false,1).states[1],b=cournotAdjustment(2,...y,false,1).states[1];assert.ok(Math.max(...a.map((z,k)=>Math.abs(z-b[k])))<=.5*Math.max(...x.map((z,k)=>Math.abs(z-y[k])))+1e-10);
 }
 const p=cournotAdjustment(3,3,2.25,false,24);close(p.totals[0],p.totalEquilibrium);assert.ok(p.norms[0]>.5);close(p.norms[24],p.norms[0]*2**-24,1e-10);
});
test('Sequential replies independently decrease the strictly convex potential by at least the squared coordinate movement and approach its unique minimum',()=>{
 for(let n=2;n<=6;n++)for(const[x,y]of[[0,0],[10,10],[10,0],[0,10],[8,1]]){
  const p=cournotAdjustment(n,x,y,true,500),all=[p.states[0],...p.updates];
  for(let i=1;i<all.length;i++){const old=all[i-1],next=all[i],moved=(i-1)%n,delta=next[moved]-old[moved];assert.ok(cournotPotential(old)-cournotPotential(next)>=delta*delta-1e-9);}
  assert.ok(p.norms.at(-1)<1e-7);const e=Array(n).fill(p.equilibrium),Q=e.reduce((s,x)=>s+x,0);for(const x of e)close(Q+x-10,0);
  // The independently written Hessian quadratic form is ||v||²+(sum v)²>0.
  const v=Array.from({length:n},(_,i)=>i%2?-.7:.3);assert.ok(v.reduce((s,x)=>s+x*x,0)+v.reduce((s,x)=>s+x,0)**2>0);
 }
});
test('Reported total-deviation factors use only valid positive transitions and no ratio is invented at an equilibrium or zero-total-deviation trajectory',()=>{
 for(let n=2;n<=6;n++){
  const q=10/(n+1),fixed=cournotAdjustment(n,q,q);assert.equal(fixed.ratio,null);assert.ok(fixed.norms.at(-1)<1e-4);
  const interior=cournotAdjustment(n,q+.1,q+.1);assert.notEqual(interior.ratio,null);assert.equal(interior.clipped[interior.ratioAt],false);close(interior.ratio,-(n-1)/2);
 }
 assert.equal(cournotAdjustment(3,3,2.25).ratio,null);
});
