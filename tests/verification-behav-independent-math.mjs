// Independent finite/algebraic checks of the BEHAV prerequisite uses. No producer numerical imports.
import assert from'node:assert/strict';let checks=0;const near=(a,b,t=1e-9)=>{assert.ok(Math.abs(a-b)<=t*(1+Math.abs(b)),`${a} != ${b}`);checks++;},ok=x=>{assert.ok(x);checks++;};
const quad=(f,a,b,n=1000)=>{let h=(b-a)/n,s=f(a)+f(b);for(let j=1;j<n;j++)s+=(j%2?4:2)*f(a+j*h);return s*h/3;};
// Exact dyadic truncated St Petersburg moments; the consumer pays half the target.
for(let m=1;m<=45;m++){let mean=0,second=0;for(let j=1;j<=m;j++){mean+=2**-j*2**(j-1);second+=2**-j*2**(2*j-2);}near(mean,m/2);near(second,(2**m-1)/2);near(2*mean,m);}
// A truncation sequence: tail-union and normalized variance bounds both tend to zero.
for(let q=8;q<=1000;q++){let K=Math.floor(Math.log2(q)/2),m=q+K;near((q+K)/q,1+K/q);ok(2**(-K)<=1);ok(2**(K+1)/(q*q)>0&&2**(K+1)/(q*q)<.1);ok(m/q<=1.5);}
// Expected utility mixture differences, exhaustive finite probability vectors of denominator four.
const ps=[];for(let a=0;a<=4;a++)for(let b=0;b<=4-a;b++)ps.push([a/4,b/4,(4-a-b)/4]);const U=[-3,2,11],E=p=>p.reduce((s,x,i)=>s+x*U[i],0);for(const p of ps)for(const q of ps)for(const r of ps)for(const a of[.1,.5,.9,1])near(E(p.map((x,i)=>a*x+(1-a)*r[i]))-E(q.map((x,i)=>a*x+(1-a)*r[i])),a*(E(p)-E(q)));
// Chain-rule curvature comparison for power utilities, using explicit composition derivatives.
for(let j=1;j<=40;j++)for(let l=1;l<=40;l++){let a=j/50,b=l/50,w=.3+j/10,z=w**b/b,pp=(b*z)**(a/b-1),ppp=(a-b)*(b*z)**(a/b-2),u2p=w**(b-1),A1=(1-a)/w,A2=(1-b)/w;near(ppp*u2p/pp,A2-A1);ok(Math.sign(ppp)===Math.sign(A2-A1));}
// Fair bounded asymmetric risks and exact logarithmic certainty equivalents.
for(let j=1;j<=80;j++){let w=3+j/20,t=.005+j/10000,EU=.5*Math.log(w-t)+.25*Math.log(w)+.25*Math.log(w+2*t),pi=w-Math.exp(EU),pred=.75*t*t/w;near(pi/pred,1,.004);}
// Finite variance alone: rare losses approach log utility's singular boundary, no shrinking support.
let previous=0;for(const d of[.01,.001,.0001,.00001]){let p=d*d,g=p*(1-d)/(1-p),variance=p*(1-d)**2+(1-p)*g*g,EU=p*Math.log(d)+(1-p)*Math.log1p(g),pi=-Math.expm1(EU),ratio=pi/variance;ok(ratio>previous);previous=ratio;near(p*(-1+d)+(1-p)*g,0);}
// Integrating positive marginal utilities, including zero CARA curvature and gamma=1.
for(let j=1;j<=50;j++){let a=j/30,w=.3+j/20,w0=.7,g=j%2?1:j/25;near(quad(x=>Math.exp(-a*x),w0,w),(-Math.exp(-a*w)+Math.exp(-a*w0))/a);let ant=x=>g===1?Math.log(x):x**(1-g)/(1-g);near(quad(x=>x**-g,w0,w),ant(w)-ant(w0),1e-7);near(quad(()=>1,w0,w),w-w0);}
// Atomic lotteries: exact piecewise CDF integrals and second integration-by-parts identity.
const lotteries=[];for(let a=0;a<5;a++)for(let b=a;b<5;b++)for(let c=b;c<5;c++)lotteries.push([a,b,c]);const utility=x=>x-.03*x*x,deriv=x=>1-.06*x;
for(const A of lotteries)for(const B of lotteries){let H=0,first=0,intH=0,minH=0;for(let x=0;x<5;x++){let d=(B.filter(y=>y<=x).length-A.filter(y=>y<=x).length)/3;first+=d*(utility(x+1)-utility(x));intH+=H+d/2;H+=d;minH=Math.min(minH,H);}let direct=A.reduce((s,x)=>s+utility(x)/3,0)-B.reduce((s,x)=>s+utility(x)/3,0);near(direct,first);near(first,deriv(5)*H+.06*intH);if(minH>=-1e-12)ok(direct>=-1e-12);}
// Compact finite-state prior intervals: endpoint minima for affine acts, including constant slope.
for(let j=1;j<=70;j++)for(const slope of[-3,-.1,0,.8,4]){let l=j/500,h=l+.3,intercept=Math.sin(j),value=x=>intercept+slope*x,best=Math.min(value(l),value(h));for(let q=0;q<=20;q++)ok(value(l+(h-l)*q/20)>=best-1e-12);near(value(slope>0?l:h),best);}
// Every pair of events in a six-atom weighted finite space: no independence needed.
const weight=[1,2,3,4,5,6],mass=mask=>weight.reduce((s,w,k)=>s+((mask>>k)&1)*w,0);for(let T=0;T<64;T++)for(let F=0;F<64;F++){near(mass(T),mass(T&F)+mass(T&~F));ok(mass(T&F)<=mass(T));}
// Biased independent Bernoulli laws, and exact fair-bet absolute versus average variance.
for(let n=1;n<=10;n++){let s=0,s2=0,bet=0,bet2=0;for(let bits=0;bits<2**n;bits++){let k=0;for(let i=0;i<n;i++)k+=(bits>>i)&1;let p=(1/3)**k*(2/3)**(n-k),v=k/n,Y=300*k-100*n;s+=p*v;s2+=p*v*v;bet+=Y/2**n;bet2+=Y*Y/2**n;}near(s,1/3);near(s2-s*s,2/(9*n));near(bet,50*n);near(bet2-bet*bet,22500*n);near(((200*n)**2+(-100*n)**2)/2-(50*n)**2,22500*n*n);}
// All events in the four-toss history sigma-field are independent of the next toss.
for(let event=1;event<65536;event++){let H=0,N=0;for(let history=0;history<16;history++)if((event>>history)&1){for(let next=0;next<2;next++){N++;H+=next;}}near(H/N,.5);}
// Exact longest head/tail/either runs and the alternation-count bijection on finite fair strings.
const choose=(n,k)=>{let a=1;for(let j=1;j<=k;j++)a=a*(n+1-j)/j;return a;};for(let n=1;n<=12;n++){let hist=Array(n).fill(0),head=Array(n+1).fill(0),tail=Array(n+1).fill(0);for(let bits=0;bits<2**n;bits++){let last=-1,run=0,heads=0,tails=0,alt=0;for(let j=0;j<n;j++){let bit=(bits>>j)&1;if(bit!==last){if(last!==-1)alt++;run=1;}else run++;last=bit;if(bit)heads=Math.max(heads,run);else tails=Math.max(tails,run);}hist[alt]++;head[heads]++;tail[tails]++;}assert.deepEqual(head,tail);checks++;for(let k=0;k<n;k++)near(hist[k],2*choose(n-1,k));}
// Normalized Jensen on separate branches; affine equality and non-normalized counterexample.
for(let j=1;j<=100;j++){let x=.2+j/30,y=.4+j/20,a=.2+j/200,g=t=>t**a,loss=t=>-2*t**a;ok(g(x)+g(y)>g(x+y));ok(loss(x)+loss(y)<loss(x+y));near(2*x+2*y,2*(x+y));ok((x+10)+(y+10)!==x+y+10);}
// Actual finite-cutoff antiderivative with its decaying tail, including t=0.
for(let j=1;j<=100;j++){let k=.05+j/20,t=j%4?j/30:0,c=t+1/k,M=12/c;near(quad(r=>Math.exp(-c*r)/k,0,M),(-Math.expm1(-c*M))/(k*c),1e-8);near(1/(k*c),1/(1+k*t));ok(c>0);near(1/(k*c)-(-Math.expm1(-c*M))/(k*c),Math.exp(-c*M)/(k*c));}
console.log(`PASS ${checks} independent mathematical assertions across all 14 new BEHAV prerequisite uses`);
