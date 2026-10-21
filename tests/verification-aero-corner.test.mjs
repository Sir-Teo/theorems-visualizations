import test from 'node:test';import assert from 'node:assert/strict';
import {G,nuPM,thetaMax,thetaOf} from '../content/aero/ch04.shared.js';
import {cornerState,expansionMach} from '../content/aero/source-audit-corner.js';
const close=(a,b,t=3e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Both actual shock branches independently conserve mass, normal/tangential momentum and total enthalpy across the full Mach/attached-turn range',()=>{
  for(const M of[1.1,1.5,2,2.5,3,4,5,6])for(const fraction of[.001,.1,.5,.95,.9999])for(const branch of['weak','strong']){
    const t=thetaMax(M).theta*fraction,p=cornerState(M,t,branch),j=p.j;
    assert.equal(p.kind,'shock');const v1=M*Math.sqrt(G),un1=v1*Math.sin(p.beta),ut1=v1*Math.cos(p.beta),un2=un1/j.rho,ut2=ut1;
    close(j.rho*un2,un1);close(1+un1**2,j.p+j.rho*un2**2);close(ut2,ut1);
    close(G/(G-1)+v1*v1/2,G/(G-1)*j.T+(un2*un2+ut2*ut2)/2);
    close(Math.hypot(un2,ut2)/Math.sqrt(G*j.T),j.M2);close(p.beta-Math.atan2(un2,ut2),t);
    const entropy=G/(G-1)*Math.log(j.T)-Math.log(j.p);assert.ok(entropy>-1e-12);close(Math.exp(-entropy),j.p0);
    assert.ok(j.rho>=1&&j.p>=1&&j.p0<=1+1e-12);assert.ok(p.sa.weak<=p.sa.strong);
  }
});
test('An independent closed maximum-angle expression from NACA1135 equation168 brackets attachment loss and catches a weak branch with subsonic downstream flow',()=>{
  for(const M of[1.1,1.5,2,2.5,3,4,5,6]){
    const x=M*M,s2=(3*x-5+Math.sqrt(3*(3*x*x+4*x+20)))/(7*x),beta=Math.asin(Math.sqrt(s2)),t=thetaOf(beta,M),tm=thetaMax(M);
    close(tm.beta,beta,8e-8);close(tm.theta,t);assert.equal(cornerState(M,t+1e-7).kind,'detached');
    const attached=cornerState(M,t-1e-7,'weak');assert.equal(attached.kind,'shock');assert.ok(attached.j.M2<1);
  }
  assert.equal(cornerState(2,0).kind,'none');close(cornerState(2,0).M2,2);
});
test('Independent numerical integration of the Mach differential verifies expansion function/inverse, entropy invariants, large downstream Mach and finite-pressure limit',()=>{
  function integral(M){const top=Math.sqrt(M-1),n=10000,h=top/n,f=u=>{const x=1+u*u;return 2*u*Math.sqrt(x*x-1)/(x*(1+.2*x*x));};let s=f(0)+f(top);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(i*h);return s*h/3;}
  for(const M of[1.1,1.5,2,2.5,3,4,5,6])for(const deg of[.5,12,35]){
    const p=cornerState(M,-deg*Math.PI/180);assert.equal(p.kind,'fan');assert.ok(!p.vac&&p.M2>M);close(integral(M),nuPM(M),2e-9);close(integral(p.M2)-integral(M),deg*Math.PI/180,2e-9);
    close(expansionMach(integral(p.M2)),p.M2,2e-8);close(p.p,p.T**(G/(G-1)));assert.equal(p.p0,1);assert.ok(p.p<1&&p.T<1);
  }
  assert.ok(cornerState(6,-35*Math.PI/180).M2>20);
  assert.ok(expansionMach(nuPM(1e5))>99999);assert.equal(cornerState(2,-Math.PI).vac,true);
});
