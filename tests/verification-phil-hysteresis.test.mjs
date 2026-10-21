import test from 'node:test';
import assert from 'node:assert/strict';
import { hysteresisVelocity as velocity, hysteresisPotential as potential, hysteresisFold as fold, hysteresisEquilibria as equilibria, hysteresisBranches as branches, hysteresisCycle as cycle } from '../content/phil/source-audit-hysteresis.js';
const near = (a,b,t=1e-10) => assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
// Closed cubic formula, independent of the production monotonic-interval bisections.
function roots(r,s){
  if(r>0){const H=2*(r/3)**1.5,a=Math.sqrt(r/3);
    if(s===H)return[-a,2*a];if(s===-H)return[-2*a,a];
    if(Math.abs(s)<H){const theta=Math.acos(s/H)/3;return [0,1,2].map(k=>2*a*Math.cos(theta-2*k*Math.PI/3)).sort((a,b)=>a-b);}}
  const D=Math.sqrt(s*s/4-(r/3)**3);
  return[Math.cbrt(s/2+D)+Math.cbrt(s/2-D)];
}
test('Every offered reinforcement and 201 stimulus values: exact cubic roots, stability, folds and nonlinear critical point',()=>{
  for(let i=0;i<=40;i++){const r=-.5+i/20;for(let j=0;j<=200;j++){const s=-1+j/100,q=equilibria(r,s),ref=roots(r,s);assert.equal(q.length,ref.length);q.forEach((e,k)=>{near(e.z,ref[k],2e-9);near(velocity(r,s,e.z),0,2e-13);near(e.slope,r-3*e.z**2);assert.ok(Math.abs(e.z)<1.5);if(e.kind==='stable')assert.ok(e.slope<0);if(e.kind==='unstable')assert.ok(e.slope>0);});}
    const f=fold(r);if(r<=0)assert.equal(f,null);else{near(f.z,Math.sqrt(r/3));near(f.s,2*(r/3)**1.5);for(const sign of[-1,1]){const q=equilibria(r,sign*f.s);assert.equal(q.length,2);const e=q.find(e=>e.kind==='fold');near(e.z,-sign*f.z);near(velocity(r,sign*f.s,e.z),0);near(e.slope,0);const delta=f.s*1e-6;assert.equal(equilibria(r,sign*(f.s-delta)).length,3);assert.equal(equilibria(r,sign*(f.s+delta)).length,1);}}}
  assert.deepEqual(equilibria(0,0),[{z:0,kind:'nonlinear stable',slope:0}]);
  for(const z of[-.1,-.001,.001,.1])assert.ok(z*velocity(0,0,z)<0);
});
test('All equilibrium curves have exact endpoints/turning points; gradient sign and invariant bounds justify stability and layout',()=>{
  for(let i=0;i<=40;i++){const r=-.5+i/20,B=branches(r);assert.equal(B.length,r>0?3:1);near(B[0].points[0][0],-1);near(B.at(-1).points.at(-1)[0],1);
    for(const b of B)for(const[s,z]of b.points){assert.ok(Math.abs(s)<=1+1e-12);assert.ok(Math.abs(z)<1.5);near(s,z**3-r*z);near(velocity(r,s,z),0);if(b.stable)assert.ok(r-3*z*z<=1e-12);else assert.ok(r-3*z*z>=-1e-12);}
    for(const s of[-1,0,1]){assert.ok(velocity(r,s,-1.5)>0);assert.ok(velocity(r,s,1.5)<0);for(const z of[-1.4,-.7,0,.7,1.4]){const h=1e-5,derivative=(potential(r,s,z+h)-potential(r,s,z-h))/(2*h);near(derivative,-velocity(r,s,z),2e-9);}}
  }
});
test('Every offered reinforcement at fast/default/slow sweeps: actual return timing, preparation, symmetry, crossings and trapping',()=>{
  for(let i=0;i<=40;i++){const r=-.5+i/20;for(const T of[4,40,160]){const low=cycle(r,T,'low'),high=cycle(r,T,'high');for(const q of[low,high]){assert.equal(q.points.length,201);assert.ok(q.maxStep<=.01);near(q.points[0].z,roots(r,q.points[0].s)[0]);for(const[k,p]of q.points.entries()){near(p.t,k*T/100);const sign=q.start==='low'?1:-1;near(p.s,k<=100?-sign+2*sign*k/100:sign-2*sign*(k-100)/100);assert.ok(Math.abs(p.z)<1.5);}for(const e of q.events){assert.ok(e.t>=0&&e.t<=2*T);assert.equal(e.leg,e.t<=T?0:1);const sign=q.start==='low'?1:-1;near(e.s,e.t<=T?-sign+2*sign*e.t/T:sign-2*sign*(e.t-T)/T);assert.ok(Math.abs(e.s)<=1);}}
    low.points.forEach((p,k)=>near(p.z,-high.points[k].z,1e-12));assert.notEqual(low.points[100].z,roots(r,1)[0],'turnaround state is carried, not reset to equilibrium');
  }}
  const fast=cycle(-.5,4),slow=cycle(-.5,160);assert.equal(fold(-.5),null);assert.equal(fast.events.length,2);assert.equal(slow.events.length,2);assert.ok(fast.events[0].s>slow.events[0].s);assert.ok(slow.events[0].s>0,'finite lag exists despite unique equilibrium');
  assert.deepEqual(cycle(1,4).events.map(e=>[e.leg,e.direction]),[[1,1]],'a category may first switch after stimulus turnaround');
  assert.equal(cycle(1.5,4).events.length,0,'a fast excursion need not switch at all');
});
// Independent implicit-midpoint solution, with Newton solves, not an RK tableau.
function midpoint(r,T,hMax){const initial=roots(r,-1)[0],points=[initial];let z=initial;const N=Math.ceil((T/100)/hMax),h=(T/100)/N;for(let i=0;i<200;i++){const dir=i<100?1:-1,s0=i<100?-1+2*i/100:1-2*(i-100)/100;for(let j=0;j<N;j++){const s=s0+dir*2*(j+.5)*h/T,old=z;let next=old;for(let n=0;n<8;n++){const m=(old+next)/2,F=next-old-h*(r*m-m**3+s),D=1-h*(r-3*m*m)/2;next-=F/D;}z=next;}points.push(z);}return points;}
test('Finite trajectories agree with independent implicit-midpoint Richardson reference; parameter guards reject invalid settings',()=>{
  let worst=0,referenceChange=0;
  for(const r of[-.5,0,.05,1,1.5])for(const T of[4,160]){const q=cycle(r,T),a=midpoint(r,T,.004),b=midpoint(r,T,.002);q.points.forEach((p,i)=>{const extrapolated=(4*b[i]-a[i])/3;worst=Math.max(worst,Math.abs(p.z-extrapolated));referenceChange=Math.max(referenceChange,Math.abs(b[i]-a[i]));near(p.z,extrapolated,2e-6);});}
  console.log({maximumIndependentTrajectoryDifference:worst,maximumMidpointRefinementDifference:referenceChange});
  for(const args of[[-.6,0],[1.6,0],[1,1.1],[NaN,0]])assert.throws(()=>equilibria(...args),RangeError);
  for(const args of[[1,3],[1,161],[1,10,'other'],[1,10,'low',0]])assert.throws(()=>cycle(...args),RangeError);
});
