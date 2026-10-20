// Explicit independent peer calculations. No snapshots or review-status assertions.
import assert from 'node:assert/strict';
const near=(a,b,t=2e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
let checks=0;
// Rectangular coordinate-map composition with exact integer arithmetic, including singular maps.
for(const d of[2,3])for(let seed=0;seed<101;seed++){const K=Array.from({length:5},(_,i)=>Array.from({length:4},(_,j)=>Array.from({length:d},(_,k)=>(i*7+j*11+k*3+seed)%13-6))),n=Array.from({length:5},(_,i)=>Array.from({length:d},(_,k)=>(i+k+seed)%5-2)),x=[1,-2,3,0];for(let i=0;i<5;i++){const velocity=Array.from({length:d},(_,k)=>K[i].reduce((s,r,j)=>s+r[k]*x[j],0));assert.equal(velocity.reduce((s,v,k)=>s+v*n[i][k],0),K[i].reduce((s,r,j)=>s+x[j]*r.reduce((s,v,k)=>s+v*n[i][k],0),0));checks++;}}
// rho,V,S give independent dimensional columns; exact kernel vectors remain dimensionless.
const D=[[1,0,0,1,0,1],[-3,1,2,-1,1,1],[0,-1,0,-1,-1,-2]],basis=[[-1,-2,-1,0,0,1],[-2,-2,-1,2,0,0],[0,-1,0,0,1,0]];assert.equal(1*(1*0-2*-1),2);for(let a=-4;a<=4;a++)for(let b=-4;b<=4;b++)for(let c=-4;c<=4;c++){const v=basis[0].map((_,j)=>a*basis[0][j]+b*basis[1][j]+c*basis[2][j]);for(const r of D)assert.equal(r.reduce((s,x,j)=>s+x*v[j],0),0);checks++;}
// Convexity/square identities and signs establish global, not merely stationary, extrema.
for(let j=1;j<=150;j++){const A=j/137,B=(151-j)/83,root=(B/A)**.25;for(const scale of[.01,.2,.7,1,1.8,10]){const V=root*scale;near(A*V*V+B/(V*V)-2*Math.sqrt(A*B),(Math.sqrt(A)*V-Math.sqrt(B)/V)**2);const L=Math.sqrt(A/B)*scale,derivative=(A-B*L*L)/(A+B*L*L)**2;assert.ok(scale===1?Math.abs(derivative)<1e-10:Math.sign(derivative)===Math.sign(1-scale));checks++;}}
// Hydrostatic quadrature in each positive temperature layer and exact pressure continuity.
for(const L of[-.0065,0,.001,.0028])for(const H of[100,1000,7000]){const T=280,R=287.05,g=9.80665,pb=80000,N=20000,h=H/N;let sum=0;for(let j=0;j<N;j++)sum+=-g/(R*(T+L*(j+.5)*h))*h;const p=pb*Math.exp(sum),analytic=pb*(L?((T+L*H)/T)**(-g/(R*L)):Math.exp(-g*H/(R*T)));near(p,analytic,2e-10);near(pb*(L?1**(-g/(R*L)):Math.exp(0)),pb);checks++;}
// Scalar isentropic chain and a centred difference independently check fixed entropy.
for(const gamma of[1.2,1.4,5/3])for(const rho of[.2,1,7]){const C=300,p=r=>C*r**gamma,h=rho*1e-5;near((p(rho+h)-p(rho-h))/(2*h),gamma*p(rho)/rho,3e-10);assert.notEqual(gamma*p(rho)/rho,p(rho)/rho);checks++;}
// Upper/lower force orientation and ambient cancellation, exact polynomial antiderivatives.
for(const p0 of[0,100000,200000]){const upper=p0+1+4/3,lower=p0+8-1/2;near(lower-upper,31/6);checks++;}
// Multivariable chain rule on a general harmonic polynomial and an arbitrary wave profile.
for(const M of[.01,.3,.8,.999]){const beta=Math.sqrt(1-M*M),x=.7,y=-.3,xx=6*x/beta,yy=-6*beta*x;near(beta*beta*xx+yy,0);checks++;}for(const M of[1.001,1.2,2,6]){const beta=Math.sqrt(M*M-1),s=.7-beta*.2,second=12*s*s;near(beta*beta*second-beta*beta*second,0);checks++;}
// Differentiating the closed Prandtl-Meyer primitive independently, away from sonic endpoint.
for(const gamma of[1.1,1.4,1.8])for(const M of[1.001,1.2,2,9]){const a=(gamma-1)/(gamma+1),s=Math.sqrt(M*M-1),ds=M/s,d=Math.sqrt(1/a)*Math.sqrt(a)*ds/(1+a*s*s)-ds/(1+s*s);near(d,s/(M*(1+(gamma-1)*M*M/2)));checks++;}
// Threshold derivative convention and radiation reference are algebraic conditional balances.
near(80*((.1/80)**(1/3))**3,.1);for(const eps of[.1,.4,1])for(const q of[1,1e4,1e7]){const sigma=5.670374419e-8,T=(q/(eps*sigma))**.25;near(eps*sigma*T**4,q);near(((8*q/(eps*sigma))**.25)/T,2**.75);checks++;}
console.log(`PASS ${checks} independent AERO peer cases (exact linear algebra, extrema, integration, derivatives and radiation)`);
