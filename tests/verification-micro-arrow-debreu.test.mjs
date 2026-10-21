import test from 'node:test';
import assert from 'node:assert/strict';
import { AD_ALPHA as alpha, AD_OMEGA as omega, AD_SHARES as theta, AD_TOTAL as total, adFirm, adMarket, adConditionalClearing, adConvexEquilibrium, adNonconvexCertificate, adPriceMap, adProjectStart, adTrajectory } from '../content/micro/source-audit-arrow-debreu.js';
const close=(x,y,t=2e-10)=>assert.ok(Math.abs(x-y)<=t*Math.max(1,Math.abs(x),Math.abs(y)),`${x} != ${y}`);
const norm=p=>{const sum=p.reduce((a,b)=>a+b);return p.map(x=>x/sum);};
function solveLinear(A,b){A=A.map((r,i)=>[...r,b[i]]);for(let c=0;c<b.length;c++){let j=c;for(let i=c+1;i<b.length;i++)if(Math.abs(A[i][c])>Math.abs(A[j][c]))j=i;[A[j],A[c]]=[A[c],A[j]];const q=A[c][c];assert.ok(Math.abs(q)>1e-12);for(let h=c;h<=b.length;h++)A[c][h]/=q;for(let i=0;i<b.length;i++)if(i!==c){const f=A[i][c];for(let h=c;h<=b.length;h++)A[i][h]-=f*A[c][h];}}return A.map(r=>r[b.length]);}
function independentConditional(k,kind,L){
 const output=k*L**(kind==='cvx'?.5:1.6),net=[-L,output,0];
 const matrix=total.map((s,g)=>[0,1,2].map(h=>(h===g?s+net[g]:0)-alpha.reduce((v,a,i)=>v+a[g]*(omega[i][h]+theta[i]*net[h]),0)));
 const[r,t]=solveLinear([[matrix[0][0],matrix[0][2]],[matrix[2][0],matrix[2][2]]],[-matrix[0][1],-matrix[2][1]]);return norm([r,1,t]);
}
function independentEquilibrium(k){
 // Direct consumer budget sums and the firm's first-order/cap rule; no exact-root coefficients.
 const residual=r=>{const L=Math.min(1000,(k/(2*r))**2),profit=k*Math.sqrt(L)-r*L;
  const constant=alpha.reduce((s,a,i)=>s+a[2]*(omega[i][0]*r+omega[i][1]+theta[i]*profit),0),coefficient=total[2]-alpha.reduce((s,a,i)=>s+a[2]*omega[i][2],0),t=constant/coefficient;
  const demand1=alpha.reduce((s,a,i)=>s+a[0]*(omega[i][0]*r+omega[i][1]+omega[i][2]*t+theta[i]*profit)/r,0);return{p:norm([r,1,t]),residual:demand1-total[0]+L};};
 let lo=1e-5,hi=100;assert.ok(residual(lo).residual>0&&residual(hi).residual<0);for(let i=0;i<100;i++){const m=(lo+hi)/2;if(residual(m).residual>0)lo=m;else hi=m;}return residual((lo+hi)/2).p;
}
test('Every offered productivity has an exact convex equilibrium independently confirmed by direct-demand bisection and Gaussian market clearing',()=>{
 for(let n=0;n<=40;n++){const k=1+n*.05,e=adConvexEquilibrium(k),reference=independentEquilibrium(k),linear=independentConditional(k,'cvx',e.L);
  e.p.forEach((x,g)=>{close(x,reference[g]);close(x,linear[g]);assert.ok(x>0);});assert.ok(e.L>0&&e.L<.711&&e.L<1000);e.z.forEach(z=>close(z,0));assert.equal(e.profitMaximizing,true);
  e.demands.forEach((d,i)=>{assert.ok(d.every(x=>x>0));close(d.reduce((s,x,g)=>s+x*e.p[g],0),e.incomes[i]);});
  close(1159*k*e.u**2+2230*e.u-1450*k,0);close(e.p[1]*k/(2*Math.sqrt(e.L)),e.p[0]);
 }
});
test('Global production profit comparisons verify both technologies, including convex capacity KKT and strict increasing-returns endpoint maxima',()=>{
 for(let n=0;n<=40;n++)for(const kind of['cvx','inc'])for(const r of[.00001,.0001,.001,.01,.1,.3,1,3,10,100]){
  const k=1+n*.05,p=norm([r,1,.7]),f=adFirm(k,kind,p),cap=kind==='cvx'?1000:3,a=kind==='cvx'?.5:1.6;
  for(let i=0;i<=300;i++){const L=cap*i/300,profit=p[1]*k*L**a-p[0]*L;assert.ok(profit<=f.profit+2e-10*Math.max(1,Math.abs(profit),Math.abs(f.profit)));}
  if(kind==='cvx'){const derivative=p[1]*k/(2*Math.sqrt(f.L))-p[0];if(f.L===cap)assert.ok(derivative>=-1e-12);else close(derivative,0);}else assert.ok(f.L===0||f.L===3);
 }
});
test('Both increasing-returns clearing branches violate profit maximization for all actual k, including both genuine maximizers at a tie',()=>{
 for(let n=0;n<=40;n++){const k=1+n*.05,F=k*3**1.6,certificate=adNonconvexCertificate(k);
  for(const c of certificate.branches){const p=independentConditional(k,'inc',c.L);p.forEach((x,g)=>close(x,c.p[g]));c.z.forEach(z=>close(z,0));assert.ok(c.incomes.every(x=>x>0));assert.equal(c.profitMaximizing,false);
   if(c.L===0){assert.ok(c.capacityGain>0);close(c.capacityGain/c.p[1],F-3*1115/1450);}else{assert.ok(c.capacityGain<0);close(c.capacityGain/c.p[1],(-800*F-3345)/427);}
  }
  assert.deepEqual(adFirm(k,'inc',certificate.tiePrice).maximizers,[0,3]);
  for(const s of certificate.tieStates){close(s.profit,0);close(s.z[2],0);close(s.z[0],-29/15+223/(50*F)+s.L);assert.ok(s.L===0?s.z[0]<0:s.z[0]>0);for(let j=1;j<60;j++){const q=3*j/60;assert.ok(certificate.tiePrice[1]*k*q**1.6-certificate.tiePrice[0]*q<0);}}
  for(const factor of[1-1e-6,1+1e-6])assert.equal(adFirm(k,'inc',norm([F/3*factor,1,1])).L,factor<1?3:0);
 }
});
test('All 41×29×2 actual parameter settings and four simplex starts retain positive finite prices, budgets and Walras accounting for all 41 displayed states',()=>{
 let largest=0,smallest=1;
 for(let n=0;n<=40;n++)for(let j=0;j<=28;j++)for(const kind of['cvx','inc'])for(const q of[[1,0,0],[0,1,0],[0,0,1],[1/3,1/3,1/3]]){
  const k=1+n*.05,lambda=.02+j*.01,t=adTrajectory(k,kind,adProjectStart(q),lambda);assert.equal(t.path.length,41);assert.equal(t.displacements.length,41);
  for(let i=0;i<=40;i++){const p=t.path[i],s=t.markets[i];assert.ok(p.every(x=>x>0&&Number.isFinite(x)));assert.ok(s.incomes.every(x=>x>0));close(p.reduce((a,b)=>a+b),1);close(s.value,0,1e-8);
   s.demands.forEach((d,j)=>close(d.reduce((v,x,g)=>v+x*p[g],0),s.incomes[j],1e-8));assert.ok(t.displacements[i]<=Math.sqrt(2)+1e-12);
   const next=adPriceMap(p,s.z,lambda);close(t.displacements[i],Math.hypot(...next.map((x,g)=>x-p[g])));if(i<40)next.forEach((x,g)=>close(x,t.path[i+1][g]));largest=Math.max(largest,t.displacements[i]);smallest=Math.min(smallest,...p);
  }
 }
 assert.ok(largest>1.39,'the old .6 vertical clipping would conceal genuine points');assert.ok(smallest<1e-20,'later iterates must not be described as retaining the starting-price floor');
});
test('Strictly positive prices are enforced before divisions; trimmed-simplex projection is idempotent and reaches all true handle vertices',()=>{
 for(const p of[[0,1,1],[1,0,1],[1,1,0],[-1,1,1]]){assert.throws(()=>adMarket(1,'cvx',p));assert.throws(()=>adPriceMap(p,[0,0,0],.1));}
 for(const q of[[1,0,0],[0,1,0],[0,0,1],[.6,.15,.25],[-10,12,-1],[5,5,5],[-3,-3,-3]]){const p=adProjectStart(q);close(p.reduce((a,b)=>a+b),1);assert.ok(p.every(x=>x>=.02-1e-14));adProjectStart(p).forEach((x,g)=>close(x,p[g]));}
 for(let i=0;i<3;i++){const q=[0,0,0];q[i]=1;adProjectStart(q).forEach((x,g)=>close(x,g===i?.96:.02));}
 const boundaryPrices=[[0,.5,.5],[.5,0,.5],[.5,.5,0]];
 for(const p of boundaryPrices)for(let i=0;i<3;i++){const wealth=omega[i].reduce((s,x,g)=>s+x*p[g],0);assert.ok(wealth>0);const free=p.indexOf(0),bundle=[wealth/2,wealth/2,wealth/2],cost=bundle.reduce((s,x,g)=>s+x*p[g],0),utility=x=>x.reduce((s,q,g)=>s*q**alpha[i][g],1);const larger=[...bundle];larger[free]*=100;close(cost,larger.reduce((s,x,g)=>s+x*p[g],0));assert.ok(utility(larger)>utility(bundle));}
});
test('Firm selection, both tie maximizers and household demands are invariant to the price unit, including extremely small positive units',()=>{
 for(const k of[1,1.5,3])for(const kind of['cvx','inc'])for(const p of[[.2,.3,.5],adNonconvexCertificate(k).tiePrice]){
  const base=adMarket(k,kind,p);for(const scale of[1e-25,1e-12,1e8]){const s=adMarket(k,kind,p.map(x=>x*scale));close(s.L,base.L);assert.equal(s.firm.maximizers.length,base.firm.maximizers.length);s.firm.maximizers.forEach((x,i)=>close(x,base.firm.maximizers[i]));s.demands.forEach((d,i)=>d.forEach((x,g)=>close(x,base.demands[i][g])));}
 }
});
