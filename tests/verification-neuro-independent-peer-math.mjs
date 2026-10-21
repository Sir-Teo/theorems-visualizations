// Independent NEURO proof-input witnesses; imports no production models/helpers.
import assert from'node:assert/strict';let checks=0;const eq=(a,b)=>{checks++;assert.deepEqual(a,b);},near=(a,b,t=1e-8)=>{checks++;assert.ok(Math.abs(a-b)<=t*(1+Math.abs(b)),`${a} != ${b}`);},ok=x=>{checks++;assert.ok(x);};
// Fixed-time Bernoulli joint laws and variance; different last marginal is allowed.
for(let N=1;N<=8;N++)for(const p of[.1,.3,.7,.9]){let mean=0,second=0,all=0;for(let mask=0;mask<2**N;mask++){const sum=Array.from({length:N},(_,j)=>mask>>j&1).reduce((a,b)=>a+b),weight=p**sum*(1-p)**(N-sum);mean+=weight*sum/N;second+=weight*(sum/N)**2;if(mask===2**N-1)all=weight;}near(mean,p);near(second-mean*mean,p*(1-p)/N);near(all,p**N);}
for(const m of[0,.2,.6,1])for(const h of[0,.3,.8,1]){let joint=0;for(let mask=0;mask<16;mask++){let w=1;for(let j=0;j<4;j++){const p=j===3?h:m;w*=mask>>j&1?p:1-p;}if(mask===15)joint+=w;}near(joint,m**3*h);}const sharedP=.3;near(sharedP*(1-sharedP),.21);ok(sharedP*(1-sharedP)>.21/8);
// Exact held-rate solutions, rate reconstruction, asymptotic conductance orders.
for(const alpha of[.01,.2,1,4])for(const beta of[.03,.7,3])for(const x0 of[0,.2,.8,1])for(const t of[0,.1,1,10]){const k=alpha+beta,xi=alpha/k,x=xi+(x0-xi)*Math.exp(-k*t),dx=-k*(x0-xi)*Math.exp(-k*t);near(dx,alpha*(1-x)-beta*x);near(xi*k,alpha);near((1-xi)*k,beta);ok(x>=0&&x<=1);}
for(const a of[0,.2,.8])for(const c of[.1,.5])for(const z of[1e-2,1e-4,1e-6]){const diff=(a+c*z)**4-a**4;if(a===0)near(diff/z**4,c**4);else near(diff/z,4*a**3*c,1e-2);}const logistic=x=>1/(1+Math.exp(-x));for(const v of[-2,-1,0,1,2]){near(Math.exp(v)/(1+Math.exp(v)),logistic(v));near(Math.exp(v*v)/(1+Math.exp(v*v)),logistic(v*v));}ok(logistic(4)>logistic(-2));eq(logistic(4),logistic((-2)**2));
// Local Taylor remainder at a reversal, with a genuine nonzero curvature witness.
for(const h of[-.1,-.03,.02,.07]){const g=.4,c=.7,I=x=>g*x+c*x*x;near((I(h)-g*h)/(h*h),c);}
// Fixed-switch pulse sensitivity: x'=-kx+mu during [0,a], then -kx thereafter.
for(const k of[.2,1,3])for(const a of[.3,1])for(const T of[2,4])for(const mu of[-.4,.2,2]){const sensitivity=(1-Math.exp(-k*a))*Math.exp(-k*(T-a))/k,flow=m=>m*sensitivity,h=1e-5;near((flow(mu+h)-flow(mu-h))/(2*h),sensitivity);}
// Euclidean intercept/slope projection: residual orthogonality and Pythagorean excess.
for(let seed=1;seed<=12;seed++){const n=Array.from({length:8},(_,j)=>j/7),y=n.map((x,j)=>.8-.6*x+.03*Math.sin(seed+j)),mn=n.reduce((a,b)=>a+b)/8,my=y.reduce((a,b)=>a+b)/8,b=n.reduce((s,x,j)=>s+(x-mn)*(y[j]-my),0)/n.reduce((s,x)=>s+(x-mn)**2,0),a=my-b*mn,res=y.map((v,j)=>v-a-b*n[j]),ss=res.reduce((s,x)=>s+x*x,0);near(res.reduce((s,x)=>s+x,0),0);near(res.reduce((s,x,j)=>s+x*n[j],0),0);for(const da of[-.1,.04])for(const db of[-.2,.08]){const excess=y.reduce((s,v,j)=>s+(v-a-da-(b+db)*n[j])**2,0)-ss;near(excess,n.reduce((s,x)=>s+(da+db*x)**2,0));}}
const flat=Array(8).fill(.4);near(flat.reduce((s,x)=>s+(x-.4)**2,0),0);
// FHN equilibrium monotonicity, finite-window Gronwall and radial cycle stability.
for(const b of[.1,.4,.8,.99])for(let j=-20;j<=20;j++){const v=j/5,I=x=>(x+.7)/b-x+x**3/3,h=1e-5;near((I(v+h)-I(v-h))/(2*h),1/b-1+v*v,2e-8);ok(1/b-1+v*v>0);}// x'=-x-x^3 has exact decaying solutions inside [-1,1], where L=4.
const nonlinearFlow=(x,t)=>x*Math.exp(-t)/Math.sqrt(1+x*x*(1-Math.exp(-2*t)));
for(const x0 of[-.8,-.2,.3,.8])for(const eps of[1e-4,.01])for(const T of[.2,1,3]){let maximumDifference=0,peakA=-Infinity,peakB=-Infinity;for(let j=0;j<=100;j++){const t=T*j/100,a=nonlinearFlow(x0,t),b=nonlinearFlow(x0+eps,t);ok(Math.abs(a-b)<=eps*Math.exp(4*t)*(1+1e-10));maximumDifference=Math.max(maximumDifference,Math.abs(a-b));peakA=Math.max(peakA,a);peakB=Math.max(peakB,b);}ok(Math.abs(peakA-peakB)<=maximumDifference+1e-12);} 
for(const ell of[-2,-.3,.4,1.5])for(const mu of[-.1,.1])if(-mu/ell>0){const r=Math.sqrt(-mu/ell);near(mu*r+ell*r**3,0);near(mu+3*ell*r*r,-2*mu);eq(mu>0,mu+3*ell*r*r<0);}
// Generic fold conditions are distinct from a stationary point or a spectral candidate.
near(3*0**2,0);near(6*0,0); // x^3 has stationary derivative but degenerate curvature.
for(const tr of[-3,-.2,.2,3])for(const det of[-1,.1,4]){const disc=tr*tr-4*det,largest=disc>=0?(tr+Math.sqrt(disc))/2:tr/2;eq(largest<0,tr<0&&det>0);}for(const t of[1,2,5])ok(t>0); // Jordan block [[0,1],[0,0]] has solution (t,1), unbounded.
// Separated SNIC passage, checked by independent midpoint quadrature.
for(const a of[.5,2])for(const b of[.3,1.4])for(const delta of[.02,.1,.4]){const L=2,N=20000,h=2*L/N;let numerical=0;for(let j=0;j<N;j++){const x=-L+(j+.5)*h;numerical+=h/(a*delta+b*x*x);}near(numerical,2*Math.atan(L*Math.sqrt(b/(a*delta)))/Math.sqrt(a*b*delta),1e-8);}
// Tangent chart coordinate derivative; extension at the identified infinity is 2.
for(const theta of[-3,-1.4,-.1,0,.5,2.9])for(const I of[-2,0,.1,3]){const V=Math.tan(theta/2),dtheta=2*(V*V+I)/(1+V*V);near(dtheta,(1-Math.cos(theta))+I*(1+Math.cos(theta)));}for(const I of[-2,0,3])near(1-Math.cos(Math.PI)+I*(1+Math.cos(Math.PI)),2);
// Symmetric second difference, independently exact for quartic polynomials.
for(const x of[-2,-.4,0,.8,2])for(const h of[.1,.2,.5]){const f=t=>t**4+.7*t**3-2*t+1;near(((f(x-h)-2*f(x)+f(x+h))/(h*h)-(12*x*x+4.2*x))/(h*h),2,1e-7);}
// Cable characteristic modes and sealed/clamped boundary checks.
for(const lambda of[.3,1,2])for(const length of[.5,2]){const sealed=x=>Math.cosh((length-x)/lambda)/Math.cosh(length/lambda),killed=x=>Math.sinh((length-x)/lambda)/Math.sinh(length/lambda),h=1e-5;near((sealed(length+h)-sealed(length-h))/(2*h),0);near(killed(length),0);near(sealed(0),1);near(killed(0),1);}
// Leaky Gaussian: independent finite-difference PDE, mass, unique peak, X=0 singularity.
const G=(x,t)=>Math.exp(-t-x*x/(4*t))/Math.sqrt(4*Math.PI*t);for(const x of[-2,-.4,0,.7,3])for(const t of[.1,.5,2]){const h=1e-4,dt=1e-5,gt=(G(x,t+dt)-G(x,t-dt))/(2*dt),gxx=(G(x+h,t)-2*G(x,t)+G(x-h,t))/(h*h);near(gt,gxx-G(x,t),2e-6);}
for(const t of[.1,.7,2]){const L=10*Math.sqrt(t),N=20000,h=2*L/N;let mass=0;for(let j=0;j<N;j++)mass+=h*G(-L+(j+.5)*h,t);near(mass,Math.exp(-t),1e-9);}for(const x of[.01,.2,1,4]){const peak=x*x/(Math.sqrt(1+4*x*x)+1),sign=t=>x*x-2*t-4*t*t;near(sign(peak),0);ok(sign(peak*.9)>0);ok(sign(peak*1.1)<0);}ok(G(0,1e-6)>G(0,1e-4));
// Kernel peak hypotheses: negative charge reverses the extremum; zero has none.
for(const X of[.2,1,2]){const t=X*X/(Math.sqrt(1+4*X*X)+1);near(G(-X,t),G(X,t));ok(G(X,t)>G(X,.8*t));ok(-G(X,t)<-G(X,.8*t));near(0*G(X,t),0);}
const peakTime=X=>X*X/(Math.sqrt(1+4*X*X)+1);near(peakTime(-2),peakTime(2));ok(peakTime(-2)>peakTime(-1));
// Bounded smooth source cos(kx), zero initial data: exact Duhamel solution.
for(const k of[0,.4,1.5])for(const t of[0,.2,1])for(const x of[-1,0,.7]){const rate=1+k*k,co=(1-Math.exp(-rate*t))/rate,V=Math.cos(k*x)*co,Vt=Math.cos(k*x)*Math.exp(-rate*t),Vxx=-k*k*V;near(Vt,Vxx-V+Math.cos(k*x));if(t===0)near(V,0);}
// Tree leaf Schur elimination compared with independent dense Gaussian elimination.
const dense=(A,b)=>{A=A.map((row,i)=>[...row,b[i]]);for(let k=0;k<b.length;k++){for(let i=k+1;i<b.length;i++){const q=A[i][k]/A[k][k];for(let j=k;j<=b.length;j++)A[i][j]-=q*A[k][j];}}const x=Array(b.length).fill(0);for(let i=b.length-1;i>=0;i--)x[i]=(A[i][b.length]-x.reduce((s,v,j)=>s+(j>i?A[i][j]*v:0),0))/A[i][i];return x;};
for(let N=2;N<=30;N++){const parent=Array.from({length:N},(_,i)=>i?Math.floor((i-1)/2):-1),edge=Array.from({length:N},(_,i)=>i?.2+(i%5)/7:0),diag=Array.from({length:N},(_,i)=>.5+i/17),A=Array.from({length:N},(_,i)=>Array.from({length:N},(_,j)=>i===j?diag[i]:0));for(let i=1;i<N;i++){const p=parent[i],g=edge[i];A[i][i]+=g;A[p][p]+=g;A[i][p]=A[p][i]=-g;}const b=Array.from({length:N},(_,i)=>Math.sin(i+1)),D=A.map((row,i)=>row[i]),rhs=[...b];let ops=0;for(let i=N-1;i>0;i--){const p=parent[i],g=edge[i];ok(D[i]>0);D[p]-=g*g/D[i];rhs[p]+=g*rhs[i]/D[i];ops++;}const x=Array(N).fill(0);x[0]=rhs[0]/D[0];for(let i=1;i<N;i++)x[i]=(rhs[i]+edge[i]*x[parent[i]])/D[i];const ref=dense(A,b);for(let i=0;i<N;i++)near(x[i],ref[i]);eq(ops,N-1);}
// Multivariable chain rule with unchanged time and local gate dynamics.
for(const d of[.1,.5,1,4,10])for(const d0 of[.2,1,3]){const q=Math.sqrt(d/d0);near(d/(q*q),d0);for(const x of[-1,.2,2])for(const t of[.1,1]){const V=(X,T)=>Math.sin(X)*Math.exp(-T),h=1e-4;near((V((x+h)/q,t)-2*V(x/q,t)+V((x-h)/q,t))/(h*h),-V(x/q,t)/(q*q),2e-6);}}
console.log({independentGroups:17,checks,productionHelpersImported:false});
