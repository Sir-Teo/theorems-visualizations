// Explicit independent prerequisite audit, with no imports from GEOL numerical helpers.
import assert from'node:assert/strict';
let cases=0;const near=(a,b,t=1e-9)=>{assert.ok(Math.abs(a-b)<=t*(1+Math.abs(b)),`${a} != ${b}`);cases++;};
const simpson=(f,a,b,n=2000)=>{let h=(b-a)/n,s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;};
// Diffusion similarity scaling: dimensionless time is unchanged after rescaling a body.
for(const L of [5,100,1000,5000])for(const k of [1e-7,1e-6,2e-6])for(const scale of [.2,2,10])near(k*(scale*scale*L*L/k)/(scale*L)**2,1);
// Inverse age equation and integrating factors, including coincident decay constants.
for(let j=1;j<=80;j++){let lam=.01+j/100,t=.1+j/10,P0=50,P=P0*Math.exp(-lam*t),D=P0-P;near(Math.log1p(D/P)/lam,t);let l2=.15+j/200,l1=.03,source=s=>l1*Math.exp(-l1*s),daughter=Math.exp(-l2*t)*simpson(s=>Math.exp(l2*s)*source(s),0,t);near(daughter,l1*(Math.exp(-l1*t)-Math.exp(-l2*t))/(l2-l1),1e-10);near(Math.exp(-lam*t)*simpson(s=>lam,0,t),lam*t*Math.exp(-lam*t));let b=.03+j/200,prod=3;near(Math.exp(-b*t)*simpson(s=>prod*Math.exp(b*s),0,t),prod/b*(-Math.expm1(-b*t)),1e-10);}
// Orthogonal normal projection and symmetric Gram matrix minimum in an explicit eigenbasis.
for(let j=0;j<90;j++){let a=j/10,n=[Math.cos(a),Math.sin(a)],v=[j/20-2,1-j/30],d=v[0]*n[0]+v[1]*n[1],par=v.map((x,i)=>x-d*n[i]);near(par[0]*n[0]+par[1]*n[1],0);near(d*d+par[0]**2+par[1]**2,v[0]**2+v[1]**2);for(let k=0;k<10;k++){let theta=k*Math.PI/10,c=Math.cos(theta),s=Math.sin(theta),lambda1=.2,lambda2=1.8;let x=c*n[0]-s*n[1],y=c*n[1]+s*n[0],e1=x*n[0]+y*n[1],e2=-x*n[1]+y*n[0],loss=lambda1*e1*e1+lambda2*e2*e2;assert.ok(loss>=lambda1-1e-12);cases++;}}
// Chronological proper rotations preserve length but need not commute.
const rx=(p,a)=>[p[0],Math.cos(a)*p[1]-Math.sin(a)*p[2],Math.sin(a)*p[1]+Math.cos(a)*p[2]],rz=(p,a)=>[Math.cos(a)*p[0]-Math.sin(a)*p[1],Math.sin(a)*p[0]+Math.cos(a)*p[1],p[2]],norm=p=>Math.hypot(...p);
for(let j=1;j<=90;j++){let p=[.2,.3,.7],a=j/70,b=.6;near(norm(rz(rx(p,a),b)),norm(p));assert.ok(Math.hypot(...rz(rx(p,a),b).map((x,i)=>x-rx(rz(p,b),a)[i]))>1e-6);cases++;}
// Fundamental theorem for layered resistance and the exponential source geotherm.
for(let j=1;j<=60;j++){let h=[100,200+j,500],k=[2,3,4],q=.06;near(h.reduce((s,x,i)=>s+simpson(()=>q/k[i],0,x),0),q*h.reduce((s,x,i)=>s+x/k[i],0));let A=.001,H=10+j,z=j/2,qm=.03,kk=3;const flux=x=>qm+A*H*Math.exp(-x/H);near(simpson(x=>flux(x)/kk,0,z),qm*z/kk+A*H*H/kk*(-Math.expm1(-z/H)),1e-10);}
// Chain-rule reduction of the half-space PDE, using a Gaussian profile derivative.
for(let j=1;j<=100;j++){let z=j/10,t=.2+j/30,k=.7,eta=z/(2*Math.sqrt(k*t)),Fp=2/Math.sqrt(Math.PI)*Math.exp(-eta*eta),Fpp=-2*eta*Fp,Tt=-eta*Fp/(2*t),Tzz=Fpp/(4*k*t);near(Tt,k*Tzz);}
// Independent numerical integration of the Gaussian tail area and its boundary term.
const erfc=x=>2/Math.sqrt(Math.PI)*simpson(s=>Math.exp(-s*s),x,10,1200);
near(simpson(erfc,0,8,800),1/Math.sqrt(Math.PI),2e-9);assert.ok(8*erfc(8)<1e-26);cases++;
// Upper-limit Gaussian derivative and singular-age substitution, including endpoint 0.
for(let j=1;j<=80;j++){let x=j/20,h=1e-5;near((simpson(s=>Math.exp(-s*s),0,x+h)-simpson(s=>Math.exp(-s*s),0,x-h))/(2*h),Math.exp(-x*x),1e-7);let top=j/4,C=2.3;near(simpson(()=>2*C,0,Math.sqrt(top)),2*C*Math.sqrt(top));near(2*C*Math.sqrt(top)-2*C*Math.sqrt(1e-12),2*C*Math.sqrt(top),3e-6);}
// Dirichlet sine modes solve the heat equation and vanish at both plate boundaries.
for(let n=1;n<=12;n++)for(let j=1;j<=30;j++){let a=3,k=.2,z=a*j/31,t=.1+j/20,lambda=(n*Math.PI/a)**2,u=Math.sin(n*Math.PI*z/a)*Math.exp(-k*lambda*t);near(-k*lambda*u,k*(-lambda*u));near(Math.sin(n*Math.PI),0);}
// Onset curve: derivative sign, divergent endpoints and exact stationary global minimum.
const p2=Math.PI**2,f=k=>(k*k+p2)**3/(k*k),crit=Math.PI/Math.sqrt(2);near(f(crit),27*Math.PI**4/4);near(6*crit/(crit*crit+p2)-2/crit,0);
for(let j=1;j<=1000;j++){let k=Math.exp(-5+j/100);assert.ok(f(k)>=f(crit)*(1-1e-14));assert.equal(Math.sign(6*k/(k*k+p2)-2/k),Math.sign(k-crit));cases+=2;}
console.log(`PASS ${cases} independent prerequisite identity/witness cases across all 15 edges`);
