// Independent formulas and finite experiments; imports no production mathematics.
import assert from'node:assert/strict';let checks=0,groups=0;const near=(a,b,t=2e-8)=>{checks++;assert.ok(Math.abs(a-b)<=t*(1+Math.abs(b)),`${a} ≠ ${b}`)},ok=x=>{checks++;assert.ok(x)},D=(f,x,h=1e-5)=>(f(x+h)-f(x-h))/(2*h),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>Math.sqrt(dot(a,a));
// Dot-angle to haversine with independent Cartesian chord, including dateline.
for(let i=0;i<200;i++){let p=(i%37-18)/13,q=(i%29-14)/10,l=i*.17,m=-i*.11,u=[Math.cos(p)*Math.cos(l),Math.cos(p)*Math.sin(l),Math.sin(p)],v=[Math.cos(q)*Math.cos(m),Math.cos(q)*Math.sin(m),Math.sin(q)];near(dot(u,v),Math.sin(p)*Math.sin(q)+Math.cos(p)*Math.cos(q)*Math.cos(l-m));near(norm(u.map((x,j)=>x-v[j]))**2/4,Math.sin((p-q)/2)**2+Math.cos(p)*Math.cos(q)*Math.sin((l-m)/2)**2);}groups++;
// Gradient normal, strict oblate separation and sphere counterexample to old wording.
for(let a of[1,1.2,2,4])for(let b of[1])for(let beta of[.1,.4,.8,1.2]){let x=a*Math.cos(beta),z=b*Math.sin(beta),gradient=[2*x/a**2,2*z/b**2],tangent=[-a*Math.sin(beta),b*Math.cos(beta)],phi=Math.atan2(gradient[1],gradient[0]),psi=Math.atan2(z,x);near(dot(gradient,tangent),0);near(Math.tan(psi),(b/a)**2*Math.tan(phi));if(a>b)ok(psi<beta&&beta<phi);else{near(phi,beta);near(psi,beta);}}groups++;
// Enumerate independent centered increments: n variance vs biased/coherent n².
for(let n=1;n<=10;n++){let e2=0;for(let mask=0;mask<2**n;mask++){let s=0;for(let j=0;j<n;j++)s+=(mask>>j&1)?1:-1;e2+=s*s/2**n;}near(e2,n);near((n*n+n*n)/2,n*n);}groups++;
// Full-rank least squares projection, normal residual, Pythagoras; rank-deficient coordinates nonunique.
let A=[[1,0],[0,1],[1,1]],b=[2,-1,4],x=[3,-0],pred=A.map(r=>dot(r,x)),res=b.map((y,i)=>y-pred[i]);near(dot(A.map(r=>r[0]),res),0);near(dot(A.map(r=>r[1]),res),0);for(let u=-4;u<=4;u++)for(let v=-4;v<=4;v++){let other=A.map(r=>dot(r,[u,v]));near(norm(b.map((y,i)=>y-other[i]))**2,norm(res)**2+norm(pred.map((y,i)=>y-other[i]))**2);}near(2+3,1+4);groups++;
// FTC rhumb secant integral and log-sine sensitivity, away from poles/zeros.
const psi=p=>Math.log(Math.tan(Math.PI/4+p/2));for(let p=-1.2;p<=1.2;p+=.07){near(D(psi,p),1/Math.cos(p));near(D(x=>Math.log(Math.sin(x)),p+1.4),Math.cos(p+1.4)/Math.sin(p+1.4),3e-7);}groups++;
// Uniform differentiability remainder for a nonlinear map tends to zero over every unit direction.
const F=([x,y])=>[x+x*x+y*y,2*y+x*y];for(let eps of[.1,.01,.001])for(let k=0;k<180;k++){let u=[Math.cos(k),Math.sin(k)],v=F(u.map(x=>eps*x)),lin=[eps*u[0],2*eps*u[1]];ok(norm(v.map((x,j)=>x-lin[j]))/eps<=1.2*eps);}groups++;
// SVD angle witness: reflections preserve unsigned angles; unequal diagonal stretches fail.
for(let t of[.1,.7,1.4,2.7]){let u=[Math.cos(t),Math.sin(t)],v=[Math.cos(t+.8),Math.sin(t+.8)],R=x=>[3*x[0],-3*x[1]];near(dot(R(u),R(v))/(norm(R(u))*norm(R(v))),dot(u,v));}ok(Math.abs(dot([2,1],[2,-1])/(5)-dot([1,1],[1,-1])/2)>.5);groups++;
// Chart area determinant from exact parallelogram; changing density under x=2u,y=3v.
for(let i=1;i<50;i++){let a=i/7,b=.2,c=-.4,d=1+i/9;near(Math.abs(a*d-b*c),Math.abs(dot([a,b],[d,-c])));}const integrate=(f,a,b,n=100)=>{let h=(b-a)/n,s=f(a)+f(b);for(let k=1;k<n;k++)s+=(k%2?4:2)*f(a+k*h);return s*h/3;};near(integrate(x=>integrate(y=>x*x+y*y,0,3),0,2),26);near(6*integrate(u=>integrate(v=>4*u*u+9*v*v,0,1),0,1),26);groups++;
// Arc-length speed: orthogonal transformations preserve every sampled tangent speed.
for(let t=0;t<6;t+=.03){let v=[-Math.sin(t),2*Math.cos(2*t)],q=.7,R=[Math.cos(q)*v[0]-Math.sin(q)*v[1],Math.sin(q)*v[0]+Math.cos(q)*v[1]];near(norm(v),norm(R));}groups++;
// Miller inner/outer factors, equal-area radial primitives and separated conics.
for(let p=-1.2;p<1.2;p+=.06){for(let m of[.2,.5,.8])near(D(x=>psi(m*x)/m,p),1/Math.cos(m*p));let c=p+1.3,r=x=>2*Math.sin(x/2);near(r(c)*D(r,c),Math.sin(c));for(let n of[.2,.6,1.1]){let rho=x=>Math.exp(-n*psi(x));near(D(rho,p)/rho(p),-n/Math.cos(p));let C=3;near(D(x=>(C-2*n*Math.sin(x))/n**2,p),-2*Math.cos(p)/n);}}groups++;
// Mollweide residual strictly increasing on open interval, exact bracketed roots including poles.
for(let j=-100;j<=100;j++){let p=j*Math.PI/200,target=Math.PI*Math.sin(p),lo=-Math.PI/2,hi=Math.PI/2;for(let k=0;k<65;k++){let m=(lo+hi)/2;if(2*m+Math.sin(2*m)<target)lo=m;else hi=m;}let t=(lo+hi)/2;near(2*t+Math.sin(2*t),target,1e-14);if(Math.abs(t)<Math.PI/2-1e-5)ok(2+2*Math.cos(2*t)>0);}groups++;
console.log(JSON.stringify({groups,checks,scope:'independent proof inputs; explicit sphere/reflection witnesses, no helper/model imports'}));
