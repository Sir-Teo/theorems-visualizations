// Explicit independent peer checks. No production formula imports, content hashes or review flags.
import assert from'node:assert/strict';
const near=(a,b,t=2e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`),sum=a=>a.reduce((s,x)=>s+x,0);let groups=0;
// 1.3: product probability for all joint subsets under independent occupancy.
for(const n of[2,3,4]){const total=7**n;let count=0;for(let x=0;x<total;x++){let y=x,ok=true;for(let j=0;j<n;j++){ok&&=y%7<j+1;y=Math.floor(y/7);}if(ok)count++;}near(count/total,Array.from({length:n},(_,i)=>(i+1)/7).reduce((a,b)=>a*b,1));}groups++;
// 1.6: integrate reciprocal derivative and check each successive half-time exactly.
for(const A0 of[.1,1,7])for(const k of[.01,.3,5]){const A=t=>A0/(1+k*A0*t);for(let n=1;n<=8;n++){const t=(2**n-1)/(k*A0);near(A(t),A0/2**n);near(1/A(t)-1/A0,k*t);}}groups++;
// 1.8: real powers are exp(alpha log x), with distinct positive concentration slopes.
for(const m of[-2,.5,1,3])for(const B of[.2,2]){const rate=A=>.7*A**m*B**1.3;near((Math.log(rate(3))-Math.log(rate(.4)))/(Math.log(3)-Math.log(.4)),m);}groups++;
// 1.10: water-rate Taylor remainder is exactly -kr delta²; negative linear term restores.
for(const kr of[.2,5,17])for(const eq of[.1,1,3])for(const delta of[-.03,.001,.02]){const F=x=>kr*(eq*eq-x*x);near(F(eq+delta)-(-2*kr*eq)*delta,-kr*delta*delta);}groups++;
// 1.12: arbitrary consistent common-temperature state energies telescope on a cycle.
for(let j=1;j<=50;j++){const G=[Math.sin(j),j/11,Math.cos(j)*3,-2],RT=.7+j/33;const ratios=G.map((g,i)=>Math.exp(-(G[(i+1)%G.length]-g)/RT));near(ratios.reduce((a,b)=>a*b,1),1);}groups++;
// 2.2: reciprocal-temperature Taylor remainder is known exactly for signed small jumps.
for(const T of[200,300,800])for(const h of[-10,1,10]){const rem=1/(T+h)-1/T+h/T**2;near(rem,h*h/(T*T*(T+h)),1e-14);near(1/T-1/(T+h),h/(T*(T+h)),1e-14);}groups++;
// 2.4: uniform cos(theta) makes cap fraction (1-cos(alpha))/2; independent pair is square.
for(const cells of[4,8,16])for(let cap=0;cap<=cells;cap++){let joint=0;for(let a=0;a<cells;a++)for(let b=0;b<cells;b++)if(a<cap&&b<cap)joint++;near(joint/(cells*cells),(cap/cells)**2);}groups++;
// 2.7: rotated symmetric indefinite Hessian has exactly its signed quadratic directions.
for(let j=0;j<100;j++){const a=j/17,c=Math.cos(a),s=Math.sin(a),lambda=[-2,3],U=[[c,-s],[s,c]],H=U.map((r,i)=>r.map((_,k)=>sum(lambda.map((l,q)=>U[i][q]*l*U[k][q]))));near(H[0][1],H[1][0]);for(let q=0;q<2;q++)for(let i=0;i<2;i++)near(sum(H[i].map((h,k)=>h*U[k][q])),lambda[q]*U[i][q]);}groups++;
// 2.10: independent centred log-rate derivative in x=1/T checks weighted activation energy.
for(const E of[[5,30,8],[15,4,9],[0,0,0]])for(const T of[250,500,1000]){const R=.008314,x=1/T,rate=x=>{const [a,b,c]=E.map((e,i)=>(i+1)*Math.exp(-e*x/R));return a*c/(b+c);},h=x*1e-5,[a,b,c]=E.map((e,i)=>(i+1)*Math.exp(-e*x/R));near(-R*(Math.log(rate(x+h))-Math.log(rate(x-h)))/(2*h),E[0]+b/(b+c)*(E[2]-E[1]),2e-8);}groups++;
// 3.3: divide out T before logarithm; positive constant H,S give an affine Eyring plot.
for(const H of[10,50,100])for(const S of[-.1,0,.1]){const R=.008314,k=T=>4*T*Math.exp(S/R-H/(R*T));near((Math.log(k(400)/400)-Math.log(k(300)/300))/(1/400-1/300),-H/R);}groups++;
// 3.5: extended-energy small-u correction has fourth-order remainder, not pole repair.
for(const u of[.02,.05,.1,.2]){const exact=(u/2)/Math.sin(u/2),leading=1+u*u/24;assert.ok(exact>leading);assert.ok((exact-leading)/u**4<.0013);}assert.ok((Math.PI-.001)/Math.sin(Math.PI-.001)>1000);groups++;
// 3.7: the local parabola remainder is exact at either sign of energy shift.
for(const L of[30,100,300])for(const E of[-.8*L,0,.6*L])for(const d of[-3,.1,7]){const f=x=>(L+x)**2/(4*L);near(f(E+d)-f(E)-.5*(1+E/L)*d,d*d/(4*L));}groups++;
// 3.10: column-generator detailed balance makes D^-1 M D symmetric, negative semidefinite.
for(const rates of[[1,2,3,4],[.01,4,.7,2],[3,.2,.1,5]]){const[a,b,c,d]=rates,raw=[1,a/b,c/d],Z=sum(raw),pi=raw.map(x=>x/Z),M=[[-a-c,b,d],[a,-b,0],[c,0,-d]],S=M.map((row,i)=>row.map((x,j)=>x*Math.sqrt(pi[j]/pi[i])));for(let i=0;i<3;i++){near(sum(M.map(row=>row[i])),0);near(sum(M[i].map((x,j)=>x*pi[j])),0);for(let j=0;j<3;j++)near(S[i][j],S[j][i]);}for(let k=0;k<100;k++){const z=[Math.sin(k),Math.cos(k),Math.sin(2*k)];assert.ok(sum(z.map((x,i)=>x*sum(S[i].map((v,j)=>v*z[j]))))<=1e-12);}}groups++;
// 4.2: finite expectation linearity even for dependent stage times; exponential means1/k.
for(const k of[[1,2,5],[.1,4,.3]]){let mean=0;for(let i=0;i<10000;i++){const u=(i+.5)/10000;mean+=sum(k.map(r=>-Math.log(u)/r))/10000;}near(mean,sum(k.map(x=>1/x)),5e-5);}groups++;
// 4.6: exhaustive weighted independent molecule indicators, arbitrary channel probability.
for(const p of[.1,.3,.7])for(let n=1;n<=10;n++){let mean=0,second=0;for(let mask=0;mask<2**n;mask++){let count=0,weight=1;for(let j=0;j<n;j++){const yes=mask>>j&1;count+=yes;weight*=yes?p:1-p;}mean+=count*weight;second+=count*count*weight;}near(mean,n*p);near(second-mean*mean,n*p*(1-p));}groups++;
// 4.11: exponential affine shift, including exact zero-exponent branch and initial value.
for(const nu of[.01,1,8])for(const l of[-2,-.1,0,.3])for(const t of[0,.1,2]){const n=x=>l?nu*Math.expm1(l*x)/l:nu*x,h=1e-5;near((n(t+h)-n(t-h))/(2*h),nu+l*n(t));near(n(0),0);}groups++;
console.log(`PASS ${groups} independently derived KIN peer groups for all16 consumers`);
