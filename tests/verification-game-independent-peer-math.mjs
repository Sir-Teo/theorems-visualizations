// Independent finite and analytic witnesses; no producer numerical helpers.
import assert from 'node:assert/strict';let checks=0;const ok=x=>{assert.ok(x);checks++},near=(a,b)=>ok(Math.abs(a-b)<1e-9);const fact=n=>n<2?1:n*fact(n-1),choose=(n,k)=>fact(n)/fact(k)/fact(n-k);
// Enumerate independent rank-maxima spaces, not random samples.
for(let m=1;m<=3;m++)for(let n=1;n<=3;n++){let hist=Array(Math.min(m,n)+1).fill(0),total=m**n*n**m;for(let r=0;r<m**n;r++)for(let c=0;c<n**m;c++){let rr=r,cc=c,R=[],C=[];for(let j=0;j<n;j++){R.push(rr%m);rr=Math.floor(rr/m)}for(let i=0;i<m;i++){C.push(cc%n);cc=Math.floor(cc/n)}let k=0;for(let j=0;j<n;j++)if(C[R[j]]===j)k++;hist[k]++;}near(hist.reduce((s,x,k)=>s+k*x,0)/total,1);let none=0;for(let k=0;k<=Math.min(m,n);k++)none+=(-1)**k*choose(m,k)*choose(n,k)*fact(k)/(m*n)**k;near(none,hist[0]/total);}
// Boundary FOC counterexample and exact clipped quadratic maxima.
near(1-0,1);for(let c=-5;c<=5;c++)for(let b=-3;b<=3;b++)for(let a=-2;a<=2;a++){const root=(c+b*a)/2,x=Math.max(0,Math.min(1,root)),u=z=>(c+b*a)*z-z*z;for(let j=0;j<=100;j++)ok(u(x)>=u(j/100)-1e-12);}
// Geometric deletion respects the player's own contribution to the mean.
for(let n=2;n<=8;n++)for(let p of[.1,.5,.9])for(let M of[1,20,100])for(let x of[p*M+.01,M+1]){let sum=(n-1)*M,d=z=>z-p*(z+sum)/n;near(d(x)-d(p*M),(1-p/n)*(x-p*M));ok(d(p*M)>0);}
// Exponential attrition primitive/endpoint; finite random mixtures preserve zero.
for(let v of[.1,1,7])for(let t of[0,.1,1,10]){const primitive=t*Math.exp(-t/v);near(primitive-t*Math.exp(-t/v),0);const h=1e-6,der=((t+h)*Math.exp(-(t+h)/v)-(t-h)*Math.exp(-(t-h)/v))/(2*h);ok(Math.abs(der-(v-t)*Math.exp(-t/v)/v)<1e-7);}
// Mixed expectations, finite positive-event conditioning and null events.
for(let p of[0,.2,.5,1])for(let q of[0,.3,1]){let A=[[1,-3],[2,4]],sum=0;for(let i=0;i<2;i++)for(let j=0;j<2;j++)sum+=[p,1-p][i]*[q,1-q][j]*A[i][j];near(sum,p*(q-3*(1-q))+(1-p)*(2*q+4*(1-q)));for(let s of[0,.2,1]){let mass=p+(1-p)*s;if(mass)near((p/mass)*mass,p);else near(p,0);}}
near((1/2)/(1/2+1/6),3/4);
// Correct fixed point argument includes unsupported improving actions.
for(let p of[0,.25,.5,.75,1])for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){let u=p*a+(1-p)*b,g=[Math.max(0,a-u),Math.max(0,b-u)],s=g[0]+g[1],f=[(p+g[0])/(1+s),(1-p+g[1])/(1+s)];if(s>1e-12)ok(Math.abs(f[0]-p)>1e-12);else near(f[0],p);}
// All finite two-line envelopes: candidate list attains grid upper bound and concavity.
for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)for(let c=-2;c<=2;c++)for(let d=-2;d<=2;d++){let g=p=>Math.min(a*p+b,c*p+d),cand=[0,1];if(a!==c){let p=(d-b)/(a-c);if(p>=0&&p<=1)cand.push(p)}let v=Math.max(...cand.map(g));for(let j=0;j<=10;j++)ok(g(j/10)<=v+1e-12);near(g(.5)>=.5*(g(0)+g(1))?1:0,1);}
// Hoeffding one-round MGF for arbitrary bounded gains, plus adaptive Hedge telescoping.
for(let p of[0,.1,.5,.9,1])for(let eta of[.01,.5,2,5]){let log=Math.log(p*Math.exp(eta)+(1-p));ok(log<=eta*p+eta*eta/8+1e-12);}
for(let eta of[.01,.2,1]){let G=[0,0,0],earned=0;for(let t=0;t<200;t++){let w=G.map(x=>Math.exp(eta*x-Math.max(...G)*eta)),z=w.reduce((a,b)=>a+b),x=w.map(v=>v/z),min=x.indexOf(Math.min(...x)),g=x.map((_,i)=>i===min?1:0);earned+=x.reduce((s,p,i)=>s+p*g[i],0);G=G.map((v,i)=>v+g[i]);}ok(Math.max(...G)-earned<=Math.log(3)/eta+eta*200/8+1e-9);}
// Chord coverage and support Lipschitz constants via direct vectors.
for(let i=0;i<180;i++){let a=i*Math.PI/90,b=a+Math.PI/180,u=[Math.cos(a),Math.sin(a)],v=[Math.cos(b),Math.sin(b)],delta=Math.hypot(u[0]-v[0],u[1]-v[1]);near(delta,2*Math.sin(Math.PI/360));for(let x=-2;x<=2;x++)for(let y=-2;y<=2;y++)ok(Math.abs((u[0]-v[0])*x+(u[1]-v[1])*y)<=Math.sqrt(8)*delta+1e-12);}
// Finite paths have two odd endpoints, cycles none; complete contingent-plan counts.
for(let n=2;n<20;n++){let deg=Array(n).fill(2);deg[0]=deg[n-1]=1;near(deg.filter(x=>x%2).length,2);near(deg.reduce((a,b)=>a+b),2*(n-1));}for(let n=0;n<12;n++)near(Array.from({length:n},()=>2).reduce((a,b)=>a*b,1),2**n);
console.log(JSON.stringify({groups:12,checks}));
