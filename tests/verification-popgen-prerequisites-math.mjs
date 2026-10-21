// Explicit finite mathematical witnesses; no production formulas or review-state assertions.
import assert from'node:assert/strict';const near=(a,b,t=2e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`),sum=a=>a.reduce((s,x)=>s+x,0);let groups=0;
// Independent fair transmissions: one and two independent loci.
const one=[0,0,0];for(let mask=0;mask<4;mask++)one[(mask&1)+(mask>>1&1)]++;assert.deepEqual(one,[1,2,1]);const phen=[0,0,0,0];for(let mask=0;mask<16;mask++){const a=(mask&1)+(mask>>1&1)>0,b=(mask>>2&1)+(mask>>3&1)>0;phen[2*Number(a)+Number(b)]++;}assert.deepEqual(phen,[1,3,3,9]);groups+=2;
// Two independent eigenmodes of the fixed inheritance matrix give exact powers.
for(const init of[[.1,.8],[1,0],[.3,.3]]){let [m,f]=init;const mean=(m+2*f)/3,d=f-m;for(let t=0;t<30;t++){near((m+2*f)/3,mean);near(f-m,d*(-.5)**t);const next=[f,(f+m)/2];[m,f]=next;}}groups++;
// Multinomial indicators: finite variance and expectation yield unbiased diversity.
for(const p of[[.2,.3,.5],[1,0,0],[.1,.8,.1]])for(let n=2;n<=7;n++){let diversity=0,means=[0,0,0],seconds=[0,0,0];for(let state=0;state<3**n;state++){let s=state,w=1,c=[0,0,0];for(let j=0;j<n;j++){const k=s%3;s=Math.floor(s/3);c[k]++;w*=p[k];}for(let k=0;k<3;k++){means[k]+=w*c[k]/n;seconds[k]+=w*(c[k]/n)**2;}diversity+=w*(1-sum(c.map(x=>(x/n)**2)));}for(let k=0;k<3;k++){near(means[k],p[k]);near(seconds[k]-means[k]**2,p[k]*(1-p[k])/n);}near(n/(n-1)*diversity,1-sum(p.map(x=>x*x)));}groups+=2;
// Finite Jensen mixture identity is an exact quadratic variance deficit.
for(let j=1;j<100;j++){const p=[j/100,.2,.8],w=[.2,.3,.5],mean=sum(p.map((x,i)=>w[i]*x)),H=sum(p.map((x,i)=>w[i]*2*x*(1-x))),variance=sum(p.map((x,i)=>w[i]*(x-mean)**2));near(H,2*mean*(1-mean)-2*variance);}groups++;
// Independent bounded indicators reproduce binomial moments and heterozygosity factor.
for(let n=2;n<=10;n++)for(const p of[0,.1,.4,.8,1]){let mean=0,second=0,H=0,absent=0;for(let mask=0;mask<2**n;mask++){let k=0,w=1;for(let j=0;j<n;j++){const yes=mask>>j&1;k+=yes;w*=yes?p:1-p;}const x=k/n;mean+=w*x;second+=w*x*x;H+=w*2*x*(1-x);if(!k)absent+=w;}near(mean,p);near(second-mean**2,p*(1-p)/n);near(H,(1-1/n)*2*p*(1-p));near(absent,(1-p)**n);}groups+=3;
// Zero-flux beta density derivative on interior intervals; positive exponents integrate endpoints.
for(const N of[10,100])for(const u of[.001,.01,.1])for(const v of[.002,.02])for(const p of[.1,.3,.8]){const q=1-p,logDerivative=(4*N*v-1)/p-(4*N*u-1)/q,b=p*q/(2*N),db=(1-2*p)/(2*N),drift=v-(u+v)*p;near(drift-.5*(db+b*logDerivative),0);assert.ok(4*N*u>0&&4*N*v>0);}groups++;
// Finite branch sum: weights times finite waiting means require no independence for expectation.
for(let n=2;n<=30;n++){const weighted=sum(Array.from({length:n-1},(_,i)=>{const k=i+2;return k*2/(k*(k-1));})),harmonic=2*sum(Array.from({length:n-1},(_,i)=>1/(i+1)));near(weighted,harmonic);}groups++;
// Exact interior odds recurrence versus logarithm identity, including neutral and negative cases.
for(const s of[-.8,-.1,0,.2])for(const initial of[.1,.4,.9]){let p=initial;for(let t=0;t<12;t++){near(Math.log(p/(1-p)),Math.log(initial/(1-initial))+t*Math.log1p(s),1e-8);p=(1+s)*p/(1+s*p);}}groups++;
// Constant symmetric viability polynomial derivative gives the finite-step identity.
for(const W of[[1,.7,.2],[.1,2,1],[1,1,1]])for(const p of[.1,.3,.7,.9]){const q=1-p,bar=p*p*W[0]+2*p*q*W[1]+q*q*W[2],wA=p*W[0]+q*W[1],wa=p*W[1]+q*W[2],der=2*p*W[0]+2*(1-2*p)*W[1]-2*q*W[2];near(der,2*(wA-wa));near(p*wA/bar-p,p*q*der/(2*bar));}groups++;
// Weighted Jensen plus natural-log KL bound, including boundary support and zero off-diagonals.
for(const W of[[[1,0,.2],[0,2,.5],[.2,.5,1]],[[.2,2,1],[2,.3,.4],[1,.4,3]]])for(let a=0;a<=10;a++)for(let b=0;b<=10-a;b++){const p=[a/10,b/10,(10-a-b)/10],marg=W.map(row=>sum(row.map((v,i)=>v*p[i]))),bar=sum(p.map((v,i)=>v*marg[i])),next=p.map((v,i)=>v*marg[i]/bar),after=sum(next.map((v,i)=>v*sum(W[i].map((w,j)=>w*next[j])))),KL=sum(next.map((v,i)=>v?v*Math.log(v/p[i]):0));assert.ok(KL>=-1e-12);assert.ok(Math.log(after/bar)>=2*KL-1e-12);near(KL/Math.log(2),sum(next.map((v,i)=>v?v*Math.log2(v/p[i]):0)));}groups+=2;
// Logarithms, not raw fitnesses, enter the strong-law average and exact log-odds sum.
for(const W of[[.5,2],[.6,3],[.1,.9]])for(let n=1;n<=10;n++){let expected=0;for(let mask=0;mask<2**n;mask++){let odds=.3/.7,logs=0;for(let t=0;t<n;t++){const w=W[mask>>t&1];odds*=w;logs+=Math.log(w);}near(Math.log(odds),Math.log(.3/.7)+logs);expected+=logs/n/2**n;}near(expected,(Math.log(W[0])+Math.log(W[1]))/2);}groups++;
for(let a=0;a<=20;a++)for(let b=0;b<=20-a;b++){const p=[a/20,b/20,(20-a-b)/20],sq=sum(p.map(x=>x*x));assert.ok(3*sq>=1-1e-12);near(sq-1/3,sum(p.map(x=>(x-1/3)**2)));}groups++;
console.log(`PASS ${groups} independent POPGEN mathematical groups covering17additions and exact17minus1 net bookkeeping`);
