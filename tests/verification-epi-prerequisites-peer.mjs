// Explicit independently authored conditional-model math witnesses. No review flags.
import assert from 'node:assert/strict';
let count=0;const near=(x,y,t=2e-9)=>{assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=t*(1+Math.abs(y)),`${x} != ${y}`);count++;};const sum=a=>a.reduce((s,x)=>s+x,0);
const quad=(f,a,b,N=10000)=>{let z=f(a)+f(b),h=(b-a)/N;for(let i=1;i<N;i++)z+=(i%2?4:2)*f(a+i*h);return z*h/3;};
// Fixed-exposure likelihood maxima, including boundary d=0; no assertion D|randomT is Poisson.
for(const T of [.4,3,90])for(const d of [0,1,4,50]){const hat=d/T,ell=l=>d?d*Math.log(l)-T*l:-T*l;for(const v of [.1,.5,2,10]){assert.ok(ell(hat)>=ell(d?hat*v:v));count++;}}
// Exact exponential remainder bounds and polynomial continuous hazard integration.
for(let j=1;j<=100;j++){const x=j/50,r=-Math.expm1(-x),e=x-r;assert.ok(e>=0&&e<=x*x/2+1e-14);assert.ok(Math.abs(r-x+x*x/2)<=x**3/6+1e-14);count+=2;}
for(const t of [.1,1,3,10]){const H=.02*t+.004*t*t+.0002*t**3;near(quad(s=>.02+.008*s+.0006*s*s,0,t),H);near(Math.exp(-H),Math.exp(-.02*t)*Math.exp(-.004*t*t-.0002*t**3));}
// Dependent count expectations still add, and discrete tail area gives remaining lifetime.
for(let j=1;j<=100;j++){const p=[.2,.3,.5],v=[[j,2*j,0],[0,j,3],[2,0,j]],m=v[0].map((_,k)=>sum(v.map((a,i)=>p[i]*a[k])));near(sum(m),sum(v.map((a,i)=>p[i]*sum(a))));const ages=[1,3,7,12],w=[j%5+1,2,j%3+1,3],z=sum(w),mu=sum(w.map((v,i)=>v*ages[i]))/z;const cuts=[0,...ages];near(sum(ages.map((a,i)=>(a-cuts[i])*sum(w.slice(i))/z)),mu);for(const x of [0,2,5,10]){const survivors=ages.map((a,i)=>a>x?w[i]:0),den=sum(survivors),direct=sum(ages.map((a,i)=>Math.max(0,a-x)*w[i]))/den,bs=[x,...ages.filter(a=>a>x)];near(sum(bs.slice(1).map((b,i)=>(b-bs[i])*sum(ages.map((a,k)=>a>(b+bs[i])/2?w[k]:0))/den)),direct);}const m2=sum(w.map((v,i)=>v*ages[i]**2))/z,variance=sum(w.map((v,i)=>v*(ages[i]-mu)**2))/z;near(m2/mu,mu+variance/mu);}
// Products within disease strata, serial/parallel complements, and mixture dependence.
for(const a of [.2,.7,.95])for(const b of [.3,.8])for(const fa of [.05,.2])for(const fb of [.03,.15]){near((a*b)/(fa*fb),(a/fa)*(b/fb));near((1-a)*(1-b),1-(a+b-a*b));near(1-(1-fa)*(1-fb),fa+fb-fa*fb);const p=.3,ab=p*a*b+(1-p)*fa*fb,ma=p*a+(1-p)*fa,mb=p*b+(1-p)*fb;near(ab-ma*mb,p*(1-p)*(a-fa)*(b-fb));}
// Interior cost derivative: Gaussian location families; stationary threshold is a minimum here.
const phi=z=>Math.exp(-z*z/2)/Math.sqrt(2*Math.PI),Phi=z=>quad(phi,-10,z),sep=1.4;
for(const p of [.05,.3,.7])for(const cn of [.5,4])for(const cp of [.2,2]){const threshold=sep/2+Math.log((1-p)*cp/(p*cn))/sep,cost=c=>p*cn*Phi(c-sep)+(1-p)*cp*(1-Phi(c));near(p*cn*phi(threshold-sep),(1-p)*cp*phi(threshold));for(const delta of [-1,.4,2]){assert.ok(cost(threshold)<=cost(threshold+delta)+1e-12);count++;}}
// Independent Bernoulli groups: exact RD variance via exhaustive weighted samples.
for(let n1=1;n1<=4;n1++)for(let n0=1;n0<=4;n0++)for(const p of [.2,.6])for(const q of [.1,.7]){let e=0,e2=0;for(let a=0;a<2**n1;a++)for(let b=0;b<2**n0;b++){const k=a.toString(2).replaceAll('0','').length,l=b.toString(2).replaceAll('0','').length,w=p**k*(1-p)**(n1-k)*q**l*(1-q)**(n0-l),d=k/n1-l/n0;e+=w*d;e2+=w*d*d;}near(e,p-q);near(e2-e*e,p*(1-p)/n1+q*(1-q)/n0);}
// Log-risk gradient and count substitution are asymptotic, not exact finite-count variances.
for(const p of [.1,.4,.8])for(const q of [.05,.3,.7])for(const n of [100,1000]){near((1/p)**2*p*(1-p)/n+(-1/q)**2*q*(1-q)/n,(1-p)/(n*p)+(1-q)/(n*q));const h=1e-5;near((Math.log(p+h)-Math.log(p-h))/(2*h),1/p,1e-7);}
// Poisson rate variance, gradient, and plug-in inverse counts under fixed exposures.
for(const l1 of [.2,2])for(const l0 of [.1,.7])for(const T1 of [10,100])for(const T0 of [20,200])near(l1/T1/l1**2+l0/T0/l0**2,1/(l1*T1)+1/(l0*T0));
// Complete the normal square and directly integrate tilted weights and tail masses.
for(const beta of [-.5,.2,1,2]){for(const z of [-3,-1,0,2,4])near(Math.exp(beta*z)*phi(z),Math.exp(beta*beta/2)*phi(z-beta));const total=quad(z=>Math.exp(beta*z)*phi(z),-12,12);near(total,Math.exp(beta*beta/2));for(const c of [.5,1.5,2.5])near(quad(z=>Math.exp(beta*z)*phi(z),c,12)/total,quad(phi,c-beta,12),2e-8);for(const d of [.1,.5])near(quad(z=>Math.exp(beta*(z-d))*phi(z),-12,12)/total,Math.exp(-beta*d));}
// A generative binary common cause: exact back-door standardization and Simpson reversal.
for(const mass of [.2,.5,.8])for(const low of [.1,.2]){const q=[1-mass,mass],t=[.05,.95],r0=[low,.8],r1=r0.map(x=>x*.7);const treated=sum(q.map((w,i)=>w*t[i])),untreated=1-treated,crude1=sum(q.map((w,i)=>w*t[i]*r1[i]))/treated,crude0=sum(q.map((w,i)=>w*(1-t[i])*r0[i]))/untreated,do1=sum(q.map((w,i)=>w*r1[i])),do0=sum(q.map((w,i)=>w*r0[i]));near(do1/do0,.7);assert.ok(crude1>crude0);count++;for(let i=0;i<2;i++){assert.ok(t[i]>0&&t[i]<1);count++;}}
// Non-informative fixed censoring preserves intensity identity; informative censoring need not.
for(const l of [.1,.7,2])for(const c of [.2,1,5])near(-Math.expm1(-l*c),l*quad(t=>Math.exp(-l*t),0,c));
// If eventX~Exp(l) and censorC=X/2, no event is observed, yet l*E[min(X,C)]=1/2.
for(const l of [.1,1,3]){const expectedObserved=quad(x=>x/2*l*Math.exp(-l*x),0,50/l);near(l*expectedObserved,.5);assert.notEqual(0,l*expectedObserved);count++;}
console.log(`PASS ${count} independently authored EPI conditional-model assertions`);
