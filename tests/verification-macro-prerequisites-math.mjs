// Explicit mathematical witnesses; no snapshot or review-status assertions.
import assert from 'node:assert/strict';import{olsMulti,growthAccounting,XS_PWT}from'../content/macro/ch03.shared.js';
import{ramseyGrowthAudit,diamondGrowthAudit}from'../content/macro/source-audit-optimal-growth.js';
let cases=0;const near=(x,y,t=2e-8)=>{assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=t*(1+Math.abs(y)),`${x} != ${y}`);cases++;};const sum=a=>a.reduce((s,x)=>s+x,0),dot=(a,b)=>sum(a.map((v,i)=>v*b[i]));
// Log growth, positive future doubling, and discounted geometric income responses.
for(const y of [.1,1,12])for(const g of [.001,.02,.1])for(const t of [0,1,50]){near(Math.log(y*Math.exp(g*t)),Math.log(y)+g*t);near(y*Math.exp(g*Math.log(2)/g),2*y);}
for(const r of [.01,.03,.08])for(const rho of [0,.3,.9,1]){const q=rho/(1+r),N=1000;let partial=0,p=1;for(let j=0;j<N;j++){partial+=p;p*=q;}near(partial+p/(1-q),1/(1-q));near(r/(1+r)/(1-q),r/(1+r-rho));}
// Certainty CRRA log-growth Taylor error with fixed positive curvature.
for(const theta of [.5,1,3])for(const r of [.001,.02,.08])for(const rho of [.002,.03,.06]){const exact=(Math.log1p(r)-Math.log1p(rho))/theta,lin=(r-rho)/theta;assert.ok(Math.abs(exact-lin)<=(r*r+rho*rho)/(2*theta)+1e-14);cases++;}
// Conditional quadratic-utility Euler algebra and predictable-regressor moments on finite trees.
for(let seed=1;seed<=50;seed++){
 const nodes=[{p:.2,c:seed/10,Z:-2},{p:.3,c:1+seed/20,Z:.7},{p:.5,c:2+seed/30,Z:4}],b=.3,a=5;let unconditional=0;
 for(const v of nodes){const shocks=[-.2,0,.3],w=[.3,.5,.2],shift=dot(w,shocks);const future=shocks.map(x=>v.c+x-shift);near(dot(w,future),v.c);near(dot(w,future.map(c=>a-b*c)),a-b*v.c);near(dot(w,future.map(c=>v.Z*(c-v.c))),0);unconditional+=v.p*dot(w,future.map(c=>v.Z*(c-v.c)));}near(unconditional,0);
}
// Complete invariant interval and signed contraction convergence, including alternating paths.
for(let si=0;si<=10;si++)for(let fi=0;fi<=10;fi++){const s=si/10,f=fi/10;if(s+f===0||s+f===2)continue;const a=1-s-f,uStar=s/(s+f);for(const start of [0,.2,.7,1]){let u=start;for(let t=1;t<=30;t++){u=a*u+s;assert.ok(u>=-1e-14&&u<=1+1e-14);cases++;near(u-uStar,a**t*(start-uStar));}}}
// Matching curve derivatives independently by finite differences; strict convexity in the interior.
for(const b of [.25,1,4])for(const u of [.1,.3,.6,.9]){const C=.7,V=x=>C*(1-x)**(b+1)*x**(-b),h=1e-5,d=-C*(1-u)**b*u**(-b-1)*(u+b),dd=C*b*(b+1)*(1-u)**(b-1)*u**(-b-2);near((V(u+h)-V(u-h))/(2*h),d,3e-7);near((V(u+h)-2*V(u)+V(u-h))/h**2,dd,3e-5);assert.ok(d<0&&dd>0);cases++;}
// Product/quotient dilution with positive A,L; capital derivative supplied by the model.
for(const K of [1,4,20])for(const L of [2,5])for(const A of [1,2])for(const n of [0,.02])for(const g of [0,.03]){const alpha=.35,s=.2,delta=.05,Y=K**alpha*(A*L)**(1-alpha),Kdot=s*Y-delta*K,k=K/L,kh=K/(A*L);near(Kdot/L-k*n,s*A**(1-alpha)*k**alpha-(n+delta)*k);near(Kdot/(A*L)-kh*(n+g),s*kh**alpha-(n+g+delta)*kh);}
// Solow local decay solves the linearized equation, not the full nonlinear one.
for(const a of [.2,.35,.6])for(const d of [.03,.08]){const s=.2,k=(s/d)**(1/(1-a)),lambda=(1-a)*d,F=x=>s*x**a-d*x,h=k*1e-5;near((F(k+h)-F(k-h))/(2*h),-lambda);for(const t of [0,10,30])near(-lambda*.2*Math.exp(-lambda*t),-lambda*(.2*Math.exp(-lambda*t)));}
// Actual endpoint log-accounting helper: exact manufactured constant-share paths on unequal intervals.
for(const alpha of [.2,.35,.6]){const times=[0,3,8,20],data=times.map(t=>['X',t,Math.exp(.01*t)*Math.exp(.03*t)**alpha*(Math.exp(.02*t)*Math.exp(.005*t))**(1-alpha),Math.exp(.03*t),Math.exp(.02*t),Math.exp(.005*t),1-alpha]),r=growthAccounting(data);near(r.mean.tfp,.01);near(r.mean.gY,.01+alpha*.03+(1-alpha)*.025);for(const row of r.out)near(row.tfp,.01);}
// Actual data and actual multiple-regression helper: independent residual slope equals full coefficient.
for(const rows of [XS_PWT,XS_PWT.filter(r=>r[8]===1)]){const x=rows.map(r=>Math.log(r[2]*1000)),y=rows.map(r=>Math.log(r[3]/r[2])/59),C=rows.map(r=>[1,Math.log(r[4]),Math.log(r[5]+.05),Math.log(r[6])]),rx=olsMulti(C,x).resid,ry=olsMulti(C,y).resid,full=olsMulti(C.map((r,i)=>[r[0],x[i],...r.slice(1)]),y);near(dot(rx,ry)/dot(rx,rx),full.b[1],2e-7);for(let j=0;j<C[0].length;j++){near(dot(rx,C.map(r=>r[j])),0,1e-7);near(dot(ry,C.map(r=>r[j])),0,1e-7);}}
// Actual RCK helper eigenmode; determinant negative gives distinct real roots.
for(const alpha of [.25,.4])for(const theta of [1,3]){const r=ramseyGrowthAudit({alpha,theta}),rho=r.rho,fp2=alpha*(alpha-1)*r.A*r.ks**(alpha-2),h=r.cs*fp2/theta,det=h;assert.ok(det<0);cases++;const plus=(rho+Math.sqrt(rho*rho-4*det))/2;near(r.lambda,(rho-Math.sqrt(rho*rho-4*det))/2);near(r.lambda+plus,rho);near(r.lambda*plus,det);near(rho-r.slope,r.lambda);near(h,r.lambda*r.slope);}
// Actual OLG map log transform and global positive convergence.
for(const alpha of [.2,.4,.7])for(const beta of [.5,2]){const r=diamondGrowthAudit(alpha,beta,.02);for(const factor of [.1,.7,2,5]){let k=r.ks*factor,z=Math.log(factor);for(let t=1;t<=60;t++){k=r.map(k);near(Math.log(k/r.ks),alpha**t*z);}}}
// Constant-coefficient AK and the uncapped Malthusian log-response regimes.
for(const gamma of [-.02,0,.03])for(const k of [.2,1,3])for(const t of [0,10,50])near((k*Math.exp(gamma*t))/(2*k*Math.exp(gamma*t)),.5);
for(const alpha of [.5,.7,.9])for(const eta of [.003,.01,.03])for(const g of [0,.001]){const lambda=eta*(1-alpha),zStar=g/lambda;for(const t of [0,20,100]){const z=zStar+.3*Math.exp(-lambda*t);near(-lambda*.3*Math.exp(-lambda*t),g-lambda*z);}}
console.log(`PASS ${cases} independent MACRO prerequisite assertions, including actual regression/accounting/growth helpers`);
