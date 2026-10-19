import{test}from'node:test';import assert from'node:assert/strict';
import{boundedFourierAttempt,fiberPolynomial,fiberBound,twoPointBlaschke,boundedDecomposition,polygonRepresentation,nonlinearFixedPoints}from'../content/fa/ch05-source.shared.js';
const near=(a,b,e=1e-10)=>assert.ok(Math.abs(a-b)<e,`${a} vs ${b}`);
const abs=z=>Math.hypot(...z),exp=(t,z)=>[Math.exp(t*z[0])*Math.cos(t*z[1]),Math.exp(t*z[0])*Math.sin(t*z[1])];
test('piecewise Fourier candidate satisfies exact arc integrals and the source norm bound',()=>{
 const target=[[1,.2],[.5,-.3],[.25,.1],[.05,.05]],r=boundedFourierAttempt(target,{M:256});
 assert.ok(r.sup<=r.bound+1e-12);assert.ok(r.error<1e-8);
 // Independent exact cell integral (primitive of e^{-in theta}).
 for(let k=0;k<target.length;k++){
  const n=2**k;let re=0,im=0;for(let j=0;j<r.g.length;j++){
   const a=2*Math.PI*j/r.g.length,b=2*Math.PI*(j+1)/r.g.length;
   const cr=(Math.sin(n*b)-Math.sin(n*a))/n,ci=(Math.cos(n*b)-Math.cos(n*a))/n;
   re+=(r.g[j][0]*cr-r.g[j][1]*ci)/(2*Math.PI);im+=(r.g[j][0]*ci+r.g[j][1]*cr)/(2*Math.PI);
  }near(re,target[k][0],1e-8);near(im,target[k][1],1e-8);
 }
});
test('joint fiber polynomials obey the independently derived Taylor-plus-Lipschitz bound',()=>{
 for(const n of[1,2,5,10,20,30])for(let j=0;j<=24;j++)for(let k=0;k<30;k++){
  const t=-1+j/12,z=[Math.cos(2*Math.PI*k/30),Math.sin(2*Math.PI*k/30)],p=fiberPolynomial(t,z,n),e=exp(t,z);
  const zz=[z[0]**2-z[1]**2,2*z[0]*z[1]],g=[e[0]+Math.abs(t)*zz[0],e[1]+Math.abs(t)*zz[1]];
  assert.ok(Math.hypot(p[0]-g[0],p[1]-g[1])<=fiberBound(n)+1e-12);
 }
});
test('two-node Blaschke formula interpolates, is unimodular on the boundary, and refuses Schwarz violations',()=>{
 for(const a of[.1,.3,.8])for(const q of[-1,-.8,0,.7,1]){
  const b=a*q;near(abs(twoPointBlaschke(a,b,[0,0])),0);near(twoPointBlaschke(a,b,[a,0])[0],b);
  for(let j=0;j<80;j++)near(abs(twoPointBlaschke(a,b,[Math.cos(j),Math.sin(j)])),1);
 }
 assert.equal(twoPointBlaschke(.3,.4,[0,0]),null);
});
test('nonunique closed-subspace decompositions have a uniform available bound, not a bound on all splits',()=>{
 for(const theta of[.12,.3,.9,Math.PI/2])for(const x of[-1,.2,1])for(const y of[-1,.7])for(const z of[-.6,0,.8]){
  const d=boundedDecomposition(x,y,z,theta,2);near(d.a+d.b*Math.cos(theta),x);near(d.b*Math.sin(theta),y);
  assert.ok(d.minimum<=d.gamma*d.norm+1e-12);
  for(let t=-2;t<=3;t+=.1)assert.ok(d.minimum<=d.costAt(t)+1e-10);
 }
 const d=boundedDecomposition(0,0,1,.9,3);assert.ok(d.cost>d.gamma*d.norm);
});
test('polygon l1 representations reconstruct the vector and obey the true norming constant',()=>{
 for(let M=4;M<=16;M+=2)for(let j=0;j<100;j++){
  const x=.9*Math.cos(j),y=.9*Math.sin(j),r=polygonRepresentation(x,y,M);
  near(r.a*r.u[0]+r.b*r.w[0],x);near(r.a*r.u[1]+r.b*r.w[1],y);
  assert.ok(r.delta*r.cost<=Math.hypot(x,y)+1e-12);
  // Norming on every unit functional; some face normal attains delta.
  const u=[Math.cos(Math.PI/M),Math.sin(Math.PI/M)];
  near(Math.max(...Array.from({length:M},(_,k)=>Math.abs(u[0]*Math.cos(2*Math.PI*k/M)+u[1]*Math.sin(2*Math.PI*k/M)))),r.delta);
 }
});
test('nonlinear disc map has bracketed fixed points even when it is not a contraction',()=>{
 for(const k of[.5,2,5,8])for(const r of[.15,.4,.55])for(const a of[.08,-.06]){
  const roots=nonlinearFixedPoints(a,r,k);assert.ok(roots.length);
  for(const x of roots)near(a+r*Math.sin(k*x),x);
 }
 assert.ok(nonlinearFixedPoints(.08,.5,5).length>1);
});
