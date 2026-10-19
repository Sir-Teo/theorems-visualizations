import {test} from 'node:test';import assert from 'node:assert/strict';
import {BODY,G,YEAR,TAU,AMU,moonTideState,tidalLockModel,lockingSpin,orbitTable,spinOrbit,jeansParameters,tidalPower,eccentricityDamping} from '../content/astro/ch03.shared.js';
const near=(a,b,t)=>assert.ok(Math.abs(a-b)<t,`${a} vs ${b}`),rel=(a,b,t)=>near(a/b,1,t);
test('lunar branch conserves angular momentum, matches recession, rejects contact and post-synchronism',()=>{
 const z=moonTideState(0),h=1e-5,ap=moonTideState(h),am=moonTideState(-h);
 rel((ap.a-am.a)/(2*h*1e9),.038,1e-8);for(const t of [-1,-.5,0,1,3]){const q=moonTideState(t);rel(q.C*q.w+q.Lorb,q.Ltot,1e-14);}
 assert.ok(!moonTideState(-1.6).valid);assert.ok(!moonTideState(5,20).valid);assert.ok(z.valid);
});
test('locking torque matches derivative of quadrupole potential, spins either way, and has exact arrival',()=>{
 for(const periodHours of [2,100]){const q=tidalLockModel({planet:BODY.earth,radius:1737e3,density:3344,rigidity:3e10,Q:100,periodHours,aRp:2});
  const delta=.5*Math.asin(.01),h=1e-6,U=d=>-.75*q.k2*G*BODY.earth.M**2*(1737e3)**5/q.a**6*Math.cos(2*d);
  const torque=(U(delta+h)-U(delta-h))/(2*h);rel(q.I*q.rate,torque,2e-8);assert.ok(q.tl>=0);near(lockingSpin(q,q.tl*1.1),q.n,1e-18);near(lockingSpin(q,q.tl/2),(q.w0+q.n)/2,1e-18);
 }
 const fluid=tidalLockModel({planet:BODY.earth,radius:1e6,density:3000,rigidity:0,Q:100,periodHours:12,aRp:60});near(fluid.k2,1.5,1e-14);
});
test('spin integrator converges and conserves circular Hamiltonian; viscous-only solution agrees',()=>{
 const err=[];for(const Ns of [32,64,128]){const tab=orbitTable(0,Ns),s=[.4,1.3],sig=.008,E=q=>.5*(q[1]-1)**2-.75*sig*Math.cos(2*q[0]);const e0=E(s);for(let k=0;k<20;k++)spinOrbit(tab,sig,0,s);err.push(Math.abs(E([s[0]-20*TAU,s[1]])-e0));}
 assert.ok(err[1]<err[0]/8&&err[2]<err[1]/8);
 const s=[.2,3.3],kap=.003;for(let k=0;k<100;k++)spinOrbit(orbitTable(.2056,96),0,kap,s);near(s[1],1+2.3*Math.exp(-kap*100*TAU),1e-12);
});
test('independent eccentric-anomaly quadrature recovers Goldreich–Peale Fourier coefficients',()=>{
 const e=.01,N=100000;let H1=0,H15=0;for(let k=0;k<N;k++){const E=(k+.5)*TAU/N,M=E-e*Math.sin(E),f=2*Math.atan2(Math.sqrt(1+e)*Math.sin(E/2),Math.sqrt(1-e)*Math.cos(E/2)),w=1/(1-e*Math.cos(E))**2;H1+=w*Math.cos(2*f-2*M)/N;H15+=w*Math.cos(2*f-3*M)/N;}
 near(H1,1-2.5*e**2+13*e**4/16,2e-12);near(H15,3.5*e-123*e**3/16,6e-10);
});
test('Jeans flux matches independent speed and angular integration; extreme logs stay finite',()=>{
 for(const T of [100,1000,3000]){const q=jeansParameters({M:BODY.earth.M,r:BODY.earth.R+500e3,m:1.008*AMU,T}),a=Math.sqrt(q.lambda),b=a+10,N=100000,h=(b-a)/N;let I=0;for(let k=0;k<N;k++){const x=a+(k+.5)*h;I+=x**3*Math.exp(-x*x)*h;}rel(q.effusion,q.v0/Math.sqrt(Math.PI)*I,2e-7);}
 const q=jeansParameters({M:BODY.earth.M,r:BODY.earth.R,m:44.009*AMU,T:100});assert.ok(q.log10Years>1000&&Number.isFinite(q.log10Years));
});
test('Io heating scales quadratically and damping matches independent fixed-angular-momentum energy balance',()=>{
 const p={M:BODY.jupiter.M,m:BODY.io.M,R:BODY.io.R,a:BODY.io.a,n:TAU/BODY.io.P,e:.004,kq:.015},P=tidalPower(p),tau=eccentricityDamping(p)*YEAR;
 rel(tidalPower({...p,e:.008}),4*P,1e-14);near(tidalPower({...p,e:0}),0,1e-14);
 const h=p.a*(1-p.e**2),E=e=>-G*p.M*p.m*(1-e*e)/(2*h),de=1e-6,dEde=(E(p.e+de)-E(p.e-de))/(2*de);
 rel(p.e*dEde/P,tau,2e-5);assert.ok(tau/YEAR>1e4&&tau/YEAR<1e6);
});
test('Hill passing-orbit kicks approach independent linear impulse/Jacobi limit and have the right sign',async()=>{
 const {hillKick,hillKickRaw}=await import('../content/astro/ch03.shared.js');let I=0;const T=200,N=400000,h=2*T/N;
 // First-order epicycle forced by a straight shear passage, combined with
 // the far-field Jacobi integral: deltaD=(2/3)e_epi²/D.
 for(let k=0;k<N;k++){const t=-T+(k+.5)*h,b=(1+2.25*t*t)**1.5;I+=(-3*Math.cos(t)-9*t*Math.sin(t))/b*h;}
 const C=2*I*I/3;near(C,30.09338,1e-4);rel(hillKick(20)*20**5,C,.004);
 const ds=[3,4,6,8,10,12,16];for(let k=0;k<ds.length;k++){const d=ds[k];assert.ok(hillKick(d)>0);near(hillKick(d),-hillKick(-d),1e-15);if(k)assert.ok(hillKick(d)<hillKick(ds[k-1]));}
 rel(hillKickRaw(6,2400),hillKickRaw(6,1200),.001);assert.ok(Number.isNaN(hillKick(2)));
});
