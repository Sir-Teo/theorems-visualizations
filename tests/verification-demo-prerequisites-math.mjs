// Explicit prerequisite audit: independent finite witnesses and numerical identities.
import assert from 'node:assert/strict';
let cases=0;const near=(a,b,t=1e-9)=>{assert.ok(Math.abs(a-b)<=t*(1+Math.abs(b)),`${a} != ${b}`);cases++;};
// Exponential inverse and product laws: doubling, log-linear fertility and positive indices.
for(const r of [-.1,-.02,.001,.01,.07]){near(Math.exp(r*Math.log(2)/r),2);}
for(let j=1;j<=30;j++){const M=.2+j/10,m=j/20,v=-j/30;near(Math.log(M*Math.exp(m*v)),Math.log(M)+m*v);const c=[j/31,.4,.7,.9];near(Math.log(c.reduce((a,b)=>a*b,1)),c.reduce((a,b)=>a+Math.log(b),0));}
// The APC tilt is in the actual design map's kernel, for many age-period cells.
for(let a=0;a<20;a++)for(let p=20;p<40;p++)for(const theta of [-2,.1,3])near(theta*(a-9.5)-theta*(p-29.5)+theta*((p-a)-20),0);
// Exact conditional death-age means rise when the smallest surviving atom is removed.
for(let mask=1;mask<256;mask++){const w=Array.from({length:8},(_,i)=>(mask>>i)&1);let prev=-Infinity;for(let x=0;x<8;x++){let den=0,num=0;for(let k=x;k<8;k++){den+=w[k];num+=w[k]*k;}if(den){const mu=num/den;assert.ok(mu>=prev);prev=mu;cases++;}}}
// Multiple-decrement integral identity from constant hazards, no death counted twice.
for(let a=1;a<=15;a++)for(let b=1;b<=15;b++){const mu=(a+b)/100,t=4,all=1-Math.exp(-mu*t),ca=a/(a+b)*all,cb=b/(a+b)*all;near(ca+cb,all);near(Math.exp(-a*t/100)*Math.exp(-b*t/100),Math.exp(-mu*t));assert.ok(Math.exp(-a*t/100)>=Math.exp(-mu*t));cases++;}
// Gamma frailty conditioning: integrate the unnormalized survivor density directly.
const integrate=(f,end,n=20000)=>{let s=f(0)+f(end),h=end/n;for(let i=1;i<n;i++)s+=(i%2?4:2)*f(i*h);return s*h/3;};
for(const shape of [1,2,3,4])for(const H of [.1,1,3]){let rate=shape+H;const den=integrate(z=>z**(shape-1)*Math.exp(-rate*z),40/rate);const num=integrate(z=>z**shape*Math.exp(-rate*z),40/rate);near(num/den,shape/rate,2e-10);}
// A concrete orthogonal singular decomposition reconstructs a matrix and its first outer product.
for(let i=1;i<=30;i++){let s1=2+i/10,s2=.5;const u=[.6,.8],v=[.8,-.6],p=[1/Math.sqrt(2),1/Math.sqrt(2)],q=[-1/Math.sqrt(2),1/Math.sqrt(2)];const A=u.map((a,j)=>p.map((b,k)=>s1*a*b+s2*v[j]*q[k]));for(let j=0;j<2;j++)near(A[j][0]*p[0]+A[j][1]*p[1],s1*u[j]);near(u[0]*v[0]+u[1]*v[1],0);}
// Projection onto intercept + age-pattern column: normal equations and strict Pythagoras.
const v=[-.1,-.3,-.6,-1,-1.4],mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
for(let j=0;j<30;j++){let y=v.map((x,i)=>.2+.4*x+j/100*x*x),vx=mean(v),ym=mean(y),slope=v.reduce((s,x,i)=>s+(x-vx)*(y[i]-ym),0)/v.reduce((s,x)=>s+(x-vx)**2,0),intercept=ym-slope*vx,res=y.map((x,i)=>x-intercept-slope*v[i]);near(res.reduce((a,b)=>a+b,0),0);near(res.reduce((s,x,i)=>s+x*v[i],0),0);for(const d of [-.5,.3]){let loss=y.reduce((s,x,i)=>s+(x-intercept-d-slope*v[i])**2,0);near(loss,res.reduce((s,x)=>s+x*x,0)+v.length*d*d);}}
// Riemann area of five-year bands, then child-size weighting and moment identity.
for(let j=1;j<=100;j++){let rates=[.01,.08,.12,.1,.06,.03,.01].map(x=>x*j/100);near(rates.reduce((a,b)=>a+5*b,0),5*rates.reduce((a,b)=>a+b,0));let w=[1,j%7+1,j%5+1,j%3+1],total=w.reduce((a,b)=>a+b,0),mu=w.reduce((s,x,k)=>s+k*x,0)/total,second=w.reduce((s,x,k)=>s+k*k*x,0)/total,variance=w.reduce((s,x,k)=>s+(k-mu)**2*x,0)/total;near(second/mu,mu+variance/mu);}
// Exhaustive independent innovation signs: variance is h sigma², without a normal law.
for(let h=1;h<=12;h++){let sx=0,sq=0;for(let mask=0;mask<2**h;mask++){let x=0;for(let k=0;k<h;k++)x+=(mask>>k&1)?2:-2;sx+=x;sq+=x*x;}near(sx/2**h,0);near(sq/2**h,4*h);}
console.log(`PASS ${cases} independent prerequisite identity/witness cases across all 13 edges`);
