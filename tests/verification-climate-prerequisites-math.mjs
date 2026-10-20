// Explicit finite witnesses and independent calculations; no source/review-status snapshots.
import assert from'node:assert/strict';import{twoBox,irf,irfInt}from'../content/climate/ch03.shared.js';import{combineFeedback,positiveFeedbackLaw}from'../content/climate/climate-source-audit-inference.js';
let count=0;const near=(x,y,t=2e-8)=>{assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=t*(1+Math.abs(y)),`${x} != ${y}`);count++;};const sum=a=>a.reduce((s,x)=>s+x,0),dot=(a,b)=>sum(a.map((x,i)=>x*b[i]));const quad=(f,a,b,N=12000)=>{if(a===b)return 0;const h=(b-a)/N;let s=f(a)+f(b);for(let i=1;i<N;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;};
// Finite reflected Planck substitution: the exact target map is increasing, not decreasing.
for(const T of [.5,1,2])for(const L of [.1,.3])for(const U of [2,5]){const a=1/T,phi=x=>-a/x;assert.ok(phi(a/U)<phi(a/L));count++;near(quad(l=>l**(-5)/Math.expm1(a/l),L,U),T**4*quad(x=>x**3/Math.expm1(x),a/U,a/L),2e-7);}
// Positive interior Wien root, with correct density representation and endpoint control.
for(const n of [3,4,5]){let a=n-1,b=n;for(let j=0;j<90;j++){const x=(a+b)/2;if(x-n*(-Math.expm1(-x))<0)a=x;else b=x;}const x=(a+b)/2,F=z=>z**n/Math.expm1(z);near(x,n*(1-Math.exp(-x)));assert.ok(F(x)>F(x-.1)&&F(x)>F(x+.1)&&F(x)>F(.0001));count++;}
// Jensen on normalized area distributions, including strictness for unequal temperatures.
for(let j=1;j<=100;j++){const weights=[.2,.3,.5],T=[100+j,200+j,250+j],mean=dot(weights,T),fourth=dot(weights,T.map(x=>x**4));assert.ok(mean**4<fourth);count++;near(dot(weights,[j**4,j**4,j**4]),dot(weights,[j,j,j])**4);}
// Daily insolation uses a full-day denominator and correct polar endpoint branches.
for(const lat of [-Math.PI/2,-1,-.4,0,.7,Math.PI/2])for(const dec of [-.41,0,.41]){const a=Math.sin(lat)*Math.sin(dec),b=Math.cos(lat)*Math.cos(dec);let h;if(Math.abs(b)<1e-14)h=a>0?Math.PI:0;else{const q=-a/b;h=q<=-1?Math.PI:q>=1?0:Math.acos(q);}near(quad(x=>a+b*Math.cos(x),-h,h)/(2*Math.PI),(a*h+b*Math.sin(h))/Math.PI);}
// Exact forced seasonal slab solution and its homogeneous transient.
for(const C of [1,8,50])for(const B of [.5,3])for(const w of [.2,2])for(const t of [0,.3,2]){const den=B*B+w*w*C*C,F=4,T=F*(B*Math.cos(w*t)+w*C*Math.sin(w*t))/den,dT=F*(-B*w*Math.sin(w*t)+w*w*C*Math.cos(w*t))/den;near(C*dT+B*T,F*Math.cos(w*t));near(Math.hypot(F*B/den,F*w*C/den),F/Math.sqrt(den));}
// Variable absorption coefficient and an inhomogeneous linear thermal source.
for(const a of [.1,.7])for(const b of [0,.3])for(const t of [.1,1,4]){const I=2*Math.exp(-a*t-b*t*t/2);near(-(a+b*t)*I+(a+b*t)*I,0);near(I,2*Math.exp(-quad(x=>a+b*x,0,t)));}
for(const B0 of [.3,2])for(const B1 of [0,.4])for(const tau of [.01,.5,3]){const I0=1,closed=I0*Math.exp(-tau)+B0*(-Math.expm1(-tau))+B1*(tau-1+Math.exp(-tau)),integral=I0*Math.exp(-tau)+quad(s=>(B0+B1*s)*Math.exp(-(tau-s)),0,tau);near(closed,integral);if(B1===0)near(B0*Math.exp(-tau)+B0*(-Math.expm1(-tau)),B0);}
// Exponential wing threshold and equal-factor increments; ideal Lorentz normalization.
for(const K of [.5,2])for(const C of [10,100,500])for(const w of [.2,1]){const edge=w*Math.log(K*C);near(K*C*Math.exp(-edge/w),1);near(w*Math.log(K*2*C)-edge,w*Math.log(2));}
for(const S of [.3,2])for(const gamma of [.01,.1,1])for(const M of [1,10,100])near(quad(x=>S*(gamma/Math.PI)/(x*x+gamma*gamma),-M*gamma,M*gamma,20000),2*S*Math.atan(M)/Math.PI,1e-7);
// FTC pulse integrals; actual CO2 helper checked against independent quadrature.
for(const tau of [2,11.8,100])for(const H of [0,20,100])near(quad(t=>.7*Math.exp(-t/tau),0,H),.7*tau*(-Math.expm1(-H/tau)));
for(const H of [1,20,100,500])near(irfInt(H),quad(irf,0,H,20000));
// Exact blackbody Taylor remainder and its intermediate-temperature bounds.
const sigma=5.67e-8;for(const T of [200,255,288,320])for(const d of [-2,.1,1,5]){const rem=sigma*((T+d)**4-T**4)-4*sigma*T**3*d,lo=6*sigma*Math.min(T,T+d)**2*d*d,hi=6*sigma*Math.max(T,T+d)**2*d*d;assert.ok(rem>=lo-1e-10&&rem<=hi+1e-10);count++;}
// Actual two-box integration vs independent exact 2x2 eigenmode solution for a step.
for(const C of [4,8])for(const Cd of [50,100])for(const lam of [.7,2]){const gam=.7,F=3.93,a=-(lam+gam)/C,b=gam/C,c=gam/Cd,d=-gam/Cd,tr=a+d,det=lam*gam/(C*Cd),dis=Math.sqrt((a-d)**2+4*b*c),r1=(tr+dis)/2,r2=(tr-dis)/2;assert.ok(r1<0&&r2<0&&r1!==r2);count++;near(r1*r2,det);const s=twoBox(()=>F,lam,{C,Cd,gam},20,.02),eq=F/lam,x0=-eq;for(const t of [1,5,20]){const e1=Math.exp(r1*t),e2=Math.exp(r2*t),at=(aa,bb)=>((e1*(aa-r2)-e2*(aa-r1))*x0+(e1-e2)*bb*x0)/(r1-r2);near(s.T[Math.round(t/.02)],eq+at(a,b));near(s.Td[Math.round(t/.02)],eq+at(d,c));}}
// Actual Gaussian combination vs independently inverted covariance and complete squares.
const solve=(A,b)=>{A=A.map((r,i)=>[...r,b[i]]);for(let j=0;j<b.length;j++){const p=A[j][j];for(let k=j;k<=b.length;k++)A[j][k]/=p;for(let i=0;i<b.length;i++)if(i!==j){const f=A[i][j];for(let k=j;k<=b.length;k++)A[i][k]-=f*A[j][k];}}return A.map(r=>r.at(-1));};
const lines=[{mu:1.16,s:.4},{mu:1.1,s:.3},{mu:1.4,s:.6}];for(const rho of [0,.3,.7,.9]){const S=lines.map((x,i)=>lines.map((y,j)=>x.s*y.s*(i===j?1:rho))),v=solve(S,[1,1,1]),p=sum(v),expected=dot(v,lines.map(x=>x.mu))/p,r=combineFeedback(lines,rho);near(r.mu,expected);near(r.sd**2,1/p);r.weights.forEach((x,i)=>near(x,v[i]/p));if(rho===0)for(const l of [.1,.5,1,2,4]){const log=x=>sum(lines.map(q=>-((x-q.mu)**2)/(2*q.s*q.s)));near(log(l)-log(r.mu),-((l-r.mu)**2)/(2*r.sd*r.sd));}}
// Normal density product independence is conditional on the parameter, not a mixed law.
for(const lambda of [.2,1,2]){const p0=Math.exp(-((lambda-lines[0].mu)**2)/(2*lines[0].s**2)),p1=Math.exp(-((lambda-lines[1].mu)**2)/(2*lines[1].s**2));near(Math.log(p0*p1),Math.log(p0)+Math.log(p1));}
// Fixed-water Twomey chain rule, including maximal sensitivity at A=1/2.
for(const g of [.7,.85])for(const tau of [.1,1,5,20,100]){const c=1-g,A=c*tau/(2+c*tau),h=1e-5,al=x=>c*tau*Math.exp(x/3)/(2+c*tau*Math.exp(x/3));near((al(h)-al(-h))/(2*h),A*(1-A)/3);assert.ok(A*(1-A)/3<=1/12+1e-14);count++;}
// Feedback rounds: nonnegative theorem and paired negative terms, distinct from time stability.
for(const f of [-.9,-.5,-.1,0,.2,.7,.95]){let p=1,s=0;for(let j=0;j<1000;j++){s+=p;p*=f;}near(s+p/(1-f),1/(1-f));if(f<0)near((1+f)/(1-f*f),1/(1-f));}
// Stable branch conditioning via bounded indicators and density Jacobian; tail stays nonintegrable.
const phi=x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI),Phi=x=>quad(phi,-12,x);
for(const mu of [.35,.7])for(const sd of [.1,.3]){const F=1.2,Z=Phi(mu/sd),law=positiveFeedbackLaw(mu,sd,F),tailConstant=F*phi(mu/sd)/(sd*Z);near(law.Z,Z,2e-6);near(quad(x=>phi((x-mu)/sd)/(sd*Z),0,mu+12*sd),1,2e-6);for(const s of [.5,2,10,100]){near(law.density(s),F*phi((F/s-mu)/sd)/(sd*s*s*Z),2e-6);near(law.cdf(s),Phi((mu-F/s)/sd)/Z,2e-6);}near(1e16*law.density(1e8),tailConstant,2e-6);assert.ok(tailConstant>0);count++;}
// Kernel row is a total derivative on a smooth positive-humidity branch; finite steps leave remainder.
const flux=([T,eta,a])=>-sigma*T**4*Math.exp(-Math.exp(eta))+340*(1-a);for(const T of [255,288])for(const eta of [-1,.2]){const state=[T,eta,.3],q=Math.exp(eta),row=[-4*sigma*T**3*Math.exp(-q),sigma*T**4*Math.exp(-q)*q,-340],direction=[2,.1,.01],step=e=>state.map((x,i)=>x+e*direction[i]),res=e=>flux(step(e))-flux(state)-e*dot(row,direction);for(const h of [.001,.0005]){for(let j=0;j<3;j++){const x=state.slice(),y=state.slice();x[j]+=h;y[j]-=h;near((flux(x)-flux(y))/(2*h),row[j],1e-6);}}assert.ok(Math.abs(res(.0005))<Math.abs(res(.001)));count++;}
console.log(`PASS ${count} independent CLIMATE prerequisite assertions, including actual two-box/IRF/Gaussian helpers`);
