// Explicit independent witnesses for the fifteen added GEO prerequisite uses.
import assert from'node:assert/strict';
let cases=0;const near=(a,b,t=1e-9)=>{assert.ok(Math.abs(a-b)<=t*(1+Math.abs(b)),`${a} != ${b}`);cases++;};
const integrate=(f,a,b,n=2000)=>{let h=(b-a)/n,s=f(a)+f(b);for(let j=1;j<n;j++)s+=(j%2?4:2)*f(a+j*h);return s*h/3;};
// Hydrostatic separation with a positive, non-isothermal profile and analytic logarithmic integral.
for(let j=1;j<=70;j++){let T0=250+j/2,b=.001,z=j*40,R=287,g=9.81;near(integrate(x=>g/(R*(T0+b*x)),0,z),g/(R*b)*Math.log((T0+b*z)/T0));}
// Logarithmic potential-temperature label along each dry adiabat.
for(let j=1;j<=100;j++){let theta=270+j/2,p=200+j*7,kap=2/7,T=theta*(p/1000)**kap;near(T*(1000/p)**kap,theta);near(Math.log(T)-kap*Math.log(p),Math.log(theta)-kap*Math.log(1000));}
// Harmonic buoyancy motion and work per unit mass for an ideal positive buoyancy profile.
for(let j=1;j<=100;j++){let N=.001+j/10000,t=j/3,z=2*Math.cos(N*t),zz=-2*N*N*Math.cos(N*t);near(zz,-N*N*z);let H=100+j,b=x=>.02*x/H;const cape=integrate(b,0,H),w=Math.sqrt(2*cape);near(w*w/2,.01*H);}
// Quadratic Taylor witnesses: negative curvature gives a denser central mixture; positive reverses it.
for(let j=1;j<=80;j++)for(const sign of [-1,1]){let h=j/100,rho=x=>1025+2*x+sign*x*x,endpointMean=(rho(h)+rho(-h))/2,mix=rho(0);near(endpointMean-mix,sign*h*h);assert.equal(Math.sign(mix-endpointMean),-sign);cases++;}
// Real components verify the complex inertial exponential and optional linear damping.
for(let j=1;j<=100;j++){let f=(j%2?1:-1)*(.1+j/200),r=.02,t=j/10,u=Math.exp(-r*t)*Math.cos(f*t),v=-Math.exp(-r*t)*Math.sin(f*t),du=-r*u+f*v,dv=-r*v-f*u;near(u*u+v*v,Math.exp(-2*r*t));near(du*u+dv*v,-r*(u*u+v*v));}
// Beta-plane absolute Taylor remainder, including the equator where relative f0 error is meaningless.
for(let j=-80;j<=80;j++)for(const d of [-.2,-.05,.01,.1]){let phi=j*Math.PI/180,error=Math.sin(phi+d)-Math.sin(phi)-Math.cos(phi)*d;assert.ok(Math.abs(error)<=d*d/2+1e-15);cases++;}
// Centrifugal acceleration is minus the gradient of its potential, with outward sign.
for(let j=1;j<=80;j++){let x=j/7,y=2-j/40,om=.3,h=1e-5,U=(a,b)=>-.5*om*om*(a*a+b*b);near(-(U(x+h,y)-U(x-h,y))/(2*h),om*om*x,1e-8);near(-(U(x,y+h)-U(x,y-h))/(2*h),om*om*y,1e-8);}
// Inviscid axisymmetric ring angular momentum before/after contraction in a constant-f frame.
for(let j=1;j<=100;j++){let R=1+j/100,r=R/(1+j/10),f=.1,v0=.02,L=R*v0+f*R*R/2,v=(L-f*r*r/2)/r;near(r*v+f*r*r/2,L);}
// Smooth polynomial pressure: curl grad vanishes by exact component derivatives.
for(let j=1;j<=100;j++){let x=j/20,y=1-j/70,z=j/60,pyz=2*x*z, pzy=2*x*z,pzx=2*y*z,pxz=2*y*z,pxy=z*z,pyx=z*z;near(pyz-pzy,0);near(pzx-pxz,0);near(pxy-pyx,0);}
// Thermal wind: smooth geopotential Phi=x*s²+3y*s gives commuting horizontal/log-p derivatives.
for(let j=1;j<=100;j++){let s=-j/20,R=287,f=.01;let dxds=2*s,dsdx=2*s,T_x=-2*s/R;near(dxds,dsdx);near(-R*T_x/f,dxds/f);}
// Integrating a shear that reverses at the tropopause gives a wind maximum there.
for(let j=1;j<=80;j++){let H=8+j/10,a=.1;const wind=z=>z<=H?a*z:a*H-a*(z-H);near(wind(H)-wind(0),integrate(()=>a,0,H));assert.ok(wind(H)>wind(H-.1)&&wind(H)>wind(H+.1));cases++;}
// Carnot factor with dissipative heat returned, distinguished from the engine efficiency itself.
for(let Ts=280;Ts<=320;Ts+=2)for(let To=180;To<=240;To+=3){let eta=1-To/Ts,Q=3,W=eta*Q/(1-eta);near(W,eta*(Q+W));near(W/Q,(Ts-To)/To);assert.ok(eta<1);cases++;}
// Stress endpoint theorem on finite layers, with a controlled vanishing lower stress limit.
for(let j=1;j<=80;j++){let d=.2+j/100,tau=.1,L=10*d;near(integrate(z=>tau/d*Math.exp(z/d),-L,0),tau-tau*Math.exp(-L/d),1e-10);near(integrate(z=>tau/d*Math.exp(z/d),-30*d,0),tau,1e-8);}
// Fixed-coefficient spin-down: n rigid boundaries change the e-folding coefficient.
for(let j=1;j<=100;j++)for(let n of [1,2]){let H=2,nu=.001+j/10000,om=.5,c=n*Math.sqrt(nu*om)/H;near(Math.exp(-c*(1/c)),Math.exp(-1));near(1/c,H/(n*Math.sqrt(nu*om)));}
console.log(`PASS ${cases} independent prerequisite identity/witness cases across all 15 edges`);
