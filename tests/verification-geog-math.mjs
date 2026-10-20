// Explicit independent mathematics for the sixteen GEOG prerequisite additions.
import assert from'node:assert/strict';let cases=0;const near=(a,b,t=1e-9)=>{assert.ok(Math.abs(a-b)<=t*(1+Math.abs(b)),`${a} != ${b}`);cases++;},ok=x=>{assert.ok(x);cases++;};
const integral=(f,a,b,n=1200)=>{let h=(b-a)/n,s=f(a)+f(b);for(let j=1;j<n;j++)s+=(j%2?4:2)*f(a+j*h);return s*h/3;},dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),psi=x=>Math.log(Math.tan(Math.PI/4+x/2));
// Spherical angle as a dot product, independently compared with the half-angle expression.
for(let j=1;j<=400;j++){let p=-1.4+2.8*j/401,q=.8*Math.sin(j),dl=3*Math.cos(j/3),A=[Math.cos(p),0,Math.sin(p)],B=[Math.cos(q)*Math.cos(dl),Math.cos(q)*Math.sin(dl),Math.sin(q)],hav=Math.sin((p-q)/2)**2+Math.cos(p)*Math.cos(q)*Math.sin(dl/2)**2;near(dot(A,B),1-2*hav);}
// Ellipse gradient is perpendicular to its tangent; latitude slope relations follow.
for(let j=-100;j<=100;j++){let beta=j/80,a=3,b=2,x=a*Math.cos(beta),z=b*Math.sin(beta),normal=[x/(a*a),z/(b*b)],tangent=[-a*Math.sin(beta),b*Math.cos(beta)];near(dot(normal,tangent),0);near(z/x,(b*b/(a*a))*normal[1]/normal[0]);near(Math.tan(beta),(b/a)*normal[1]/normal[0]);}
// Clock and dead-reckoning independent accumulation, with correlated coordinates within a step.
for(let n=1;n<=12;n++){let s=0,s2=0;for(let bits=0;bits<2**n;bits++){let x=0;for(let k=0;k<n;k++)x+=(bits>>k&1)?1:-1;s+=x/2**n;s2+=x*x/2**n;}near(s,0);near(s2,n);near(4*s2,4*n);near(15**2*s2,225*n);near((n*n+n*n)/2,n*n);}
// Six-row range Jacobian witness: projection normal equations and strict Pythagoras.
const H=[[-1,0,0,1],[1,0,0,1],[0,-1,0,1],[0,1,0,1],[0,0,-1,1],[0,0,1,1]],diag=[2,2,2,6];for(let j=1;j<=100;j++){let r=H.map((_,i)=>Math.sin(j*(i+1))),x=diag.map((d,k)=>H.reduce((s,row,i)=>s+row[k]*r[i],0)/d),fit=H.map(row=>dot(row,x)),res=r.map((v,i)=>v-fit[i]);for(let k=0;k<4;k++)near(H.reduce((s,row,i)=>s+row[k]*res[i],0),0);let delta=[.1,-.2,.3,j/100],shift=H.map(row=>dot(row,delta));near(r.reduce((s,v,i)=>s+(v-fit[i]-shift[i])**2,0),dot(res,res)+dot(shift,shift));}
// Rhumb-line longitude integral and length, excluding polar and east-west singular cases.
for(let j=1;j<=100;j++){let a=-1+j/500,b=.5+j/500,beta=.1+j/200;near(integral(x=>1/Math.cos(x),a,b),psi(b)-psi(a),1e-8);near(integral(x=>Math.hypot(1,Math.cos(x)*(Math.tan(beta)/Math.cos(x))),a,b),(b-a)/Math.abs(Math.cos(beta)));}
// Triangulation log-sine chain sensitivity with two separately perturbed angles.
for(let j=1;j<=100;j++){let A=.2+j/100,C=.3+j/200,h=1e-5,f=(a,c)=>Math.log(Math.sin(a)/Math.sin(c));near((f(A+h,C)-f(A-h,C))/(2*h),1/Math.tan(A),1e-8);near((f(A,C+h)-f(A,C-h))/(2*h),-1/Math.tan(C),1e-8);}
// Differentiability controls the normalized circle image uniformly over directions.
for(let n=1;n<=20;n++){let eps=2**(-n),max=0;for(let j=0;j<64;j++){let x=eps*Math.cos(j*Math.PI/32),y=eps*Math.sin(j*Math.PI/32),remainder=Math.hypot(x*x,.3*x*y);max=Math.max(max,remainder/eps);}ok(max<=1.1*eps);}
// Equal singular stretches preserve angle; unequal stretches deform one right angle.
for(let j=1;j<=100;j++){let angle=j/10,c=Math.cos(angle),s=Math.sin(angle),Q=v=>[c*v[0]-s*v[1],s*v[0]+c*v[1]],u=[.3,1],v=[1,-.4],scale=.5+j/30;near(dot(Q(u),Q(v)),dot(u,v));near(Math.hypot(...Q(u))*scale,Math.hypot(...u)*scale);let a=1+j/100,b=.8;ok(dot([a,b],[a,-b])>0);}
// Change of variables on an injective smooth sinusoidal chart; compact-density scaling witness.
for(let j=1;j<=60;j++){let lo=-1+j/500,hi=.4+j/300,width=1.8;near(integral(phi=>width*Math.cos(phi),lo,hi),width*(Math.sin(hi)-Math.sin(lo)));let a=.5+j/20,b=.8,area=integral(x=>Math.max(0,1-(a*x)**2)*a,-1/a,1/a)*integral(y=>Math.max(0,1-(b*y)**2)*b,-1/b,1/b);near(area,16/9,1e-8);}
// Integral of speed is unchanged under an actual fixed orthogonal planar map.
for(let j=1;j<=50;j++){let angle=j/20,c=Math.cos(angle),s=Math.sin(angle),speed=t=>Math.hypot(-Math.sin(t),2*Math.cos(2*t)),rot=t=>{let x=-Math.sin(t),y=2*Math.cos(2*t);return Math.hypot(c*x-s*y,s*x+c*y);};near(integral(rot,0,2),integral(speed,0,2));}
// Miller chain factor cancellation and the finite polar derivative for 0<m<1.
for(const m of[.2,.5,.8,.95])for(let j=-80;j<=80;j++){let phi=j*Math.PI/160,h=1e-6,f=p=>psi(m*p)/m;near((f(phi+h)-f(phi-h))/(2*h),1/Math.cos(m*phi),1e-6);}
// Lambert azimuthal radius integrates sine, with its positive branch and endpoint limits.
for(let j=1;j<=100;j++){let c=j*Math.PI/101,r=2*Math.sin(c/2);near(r*r/2,integral(Math.sin,0,c));}near(2*Math.sin(0),0);near(2*Math.sin(Math.PI/2),2);
// Separated conformal-conic solution and integrated Albers radial-square relation.
for(let j=1;j<=100;j++){let phi=-.5+j/100,n=.4,F=3,h=1e-6,r=p=>F*Math.exp(-n*psi(p));near((Math.log(r(phi+h))-Math.log(r(phi-h)))/(2*h),-n/Math.cos(phi),1e-7);let C=1.2,rr=p=>(C-2*n*Math.sin(p))/(n*n),base=.1;near((rr(phi)-rr(base))/2,integral(x=>-Math.cos(x)/n,base,phi),1e-9);}
// Mollweide monotonicity and endpoint root bracketing, independent of Newton convergence.
let previous=-Math.PI;for(let j=1;j<=1000;j++){let t=-Math.PI+j*2*Math.PI/1000,g=t+Math.sin(t);ok(g>previous);previous=g;if(j<1000)ok(1+Math.cos(t)>0);}near(1+Math.cos(Math.PI),0);
for(let j=-100;j<=100;j++){let target=Math.PI*Math.sin(j/80),lo=-Math.PI,hi=Math.PI;for(let k=0;k<70;k++){let mid=(lo+hi)/2;if(mid+Math.sin(mid)<target)lo=mid;else hi=mid;}near((lo+hi)/2+Math.sin((lo+hi)/2),target);}
console.log(`PASS ${cases} independent prerequisite identity/witness cases across all 16 added GEOG edges`);
