import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../assets/js/viz/math.js';
import {DN_BETA as b,DN_HALF as half,DN_LAM as l,BETA,kinMatrix,kinEq,kinAdvance,inhour,kinStepCurveAudit as curve,kinProgramAudit as program} from '../content/energy/source-audit-kinetics.shared.js';
const near=(a,c,tol=1e-8)=>assert.ok(Math.abs(a-c)<=tol*Math.max(1,Math.abs(c)),`${a} != ${c}`);
// Independent explicit ODE integration: no production matrix/exponential or
// adaptive-program implementation is used in this reference.
function rk({dollars=.3,Lam=1e-4,feedback=false,alpha=.05,T=2,h=1e-4,scram=false}) {
  let y=[1,...b.map((q,i)=>q/(Lam*l[i])),0];
  const f=(t,a)=>{const rho=(scram&&t>=10?-6:dollars)*BETA-(feedback?alpha*BETA*a[7]:0),out=[rho/Lam*a[0]];let sum=0;
    for(let i=0;i<6;i++){const q=b[i]/Lam*a[0]-l[i]*a[i+1];out.push(q);sum+=q;}out[0]-=sum;out.push(a[0]);return out;};
  const n=Math.round(T/h);h=T/n;
  for(let j=0;j<n;j++){const t=j*h,k1=f(t,y),k2=f(t+h/2,y.map((x,i)=>x+h*k1[i]/2)),k3=f(t+h/2,y.map((x,i)=>x+h*k2[i]/2)),k4=f(t+h,y.map((x,i)=>x+h*k3[i]));y=y.map((x,i)=>x+h*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);}
  return y;
}
test('six-group coefficients use the inspected DOE printed fractions and half-lives',()=>{
  assert.deepEqual(b,[.00021,.00142,.00127,.00257,.00075,.00027]);assert.deepEqual(half,[55.7,22.7,6.2,2.3,.61,.23]);near(BETA,.00649,1e-15);
  l.forEach((q,i)=>near(Math.exp(-q*half[i]),.5,1e-15));
});
test('matrix obeys the neutron/precursor balance and exact critical initial condition',()=>{
  for(const L of [1e-5,1e-4,1e-3]){
    const eq=kinEq(L);M.matVec(kinMatrix(0,L),eq).forEach(x=>near(x,0,1e-10));
    for(const rho of [-BETA,.3*BETA,1.4*BETA]){const y=eq.map((x,i)=>x*(1+i/4)),d=M.matVec(kinMatrix(rho,L),y);near(d.reduce((a,b)=>a+b,0),rho/L*y[0],1e-10);}
  }
});
test('inhour root independently supplies an eigenmode at negative, zero and prompt-critical reactivity',()=>{
  for(const L of [1e-5,1e-3])for(const dollars of [-6,-1,0,.3,.99,1,1.4]){
    const rho=dollars*BETA,w=inhour(M,rho,L),v=[1,...b.map((q,i)=>q/(L*(w+l[i])))],Av=M.matVec(kinMatrix(rho,L),v);
    Av.forEach((x,i)=>near(x,w*v[i],2e-8));
    if(dollars===1)assert.ok(w<rho/L/3,'prompt-critical does not coincide with beta=0 growth');
  }
});
test('constant-reactivity exponential agrees with an independent differential solve',()=>{
  for(const dollars of [-1,.3,.99,1.3]){
    const reference=rk({dollars,T:.2,h:1e-5}),exact=kinAdvance(M,kinEq(1e-4),dollars*BETA,1e-4,.2);
    exact.forEach((q,i)=>near(q,reference[i],1e-8));
  }
});
test('feedback midpoint freezing converges to independently integrated coupled energy dynamics',()=>{
  for(const dollars of [.3,.8])for(const alpha of [.005,.2]){
    const p=program(M,{dollars,feedback:true,alpha,T:5}),ref=rk({dollars,feedback:true,alpha,T:5});
    assert.equal(p.reason,'complete');near(p.endTime,5);near(p.out.at(-1)[1],ref[0],.002);near(p.E,ref[7],.002);
  }
});
test('curves stay finite at control extremes and stopped programs report their true end time',()=>{
  const times=Array.from({length:70},(_,i)=>1e-4*10**(6*i/69));
  for(const L of [1e-5,1e-3])for(const dollars of [.05,1,1.3]){const p=curve(M,dollars*BETA,L,times);assert.ok(p.every(([t,n])=>Number.isFinite(t)&&Number.isFinite(n)&&n>=1&&n<=1e6));}
  const stop=program(M,{dollars:1.4,Lam:1e-5});assert.equal(stop.reason,'power ceiling');assert.ok(stop.endTime<1&&stop.out.at(-1)[1]>=1e5&&stop.out.at(-1)[1]<1.05e5);
  const scram=program(M,{program:'scram',dollars:.3});assert.equal(scram.reason,'complete');near(scram.endTime,60);assert.ok(scram.rr.some(([t])=>Math.abs(t-10)<1e-10));assert.ok(scram.rr.filter(([t])=>t>10+1e-9).every(([,r])=>r===-6));
});
