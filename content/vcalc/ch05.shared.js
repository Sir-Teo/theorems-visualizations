// Pure numerical models for Chapter 5; no singularity is regularized.
export const TAU=2*Math.PI;
export function quad(f,a=0,b=1,n=800){if(n%2)n++;const h=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;}
export const potential=(x,y)=>x*x+y*y/2;
export const gradient=(x,y)=>[2*x,y];
export const rotation=(x,y)=>[-y,x];
export const vortex=(x,y)=>{const r=x*x+y*y;return r===0?[NaN,NaN]:[-y/r,x/r];};
export function work(F,r,d,a=0,b=1,n=800){return quad(t=>{const p=r(t),q=d(t),f=F(...p);return f[0]*q[0]+f[1]*q[1];},a,b,n);}
export function segmentWork(F,a,b){return work(F,t=>a.map((x,i)=>x+t*(b[i]-x)),()=>b.map((x,i)=>x-a[i]),0,1,80);}
export function wiggle(h){return {r:t=>[2*t-1,t+h*Math.sin(Math.PI*t)],d:t=>[2,1+h*Math.PI*Math.cos(Math.PI*t)]};}
export function bowed(h){return {r:t=>[2*t-1,h*Math.sin(Math.PI*t)],d:t=>[2,h*Math.PI*Math.cos(Math.PI*t)]};}
export function circle(cx,cy,a,b=a,n=1){return {r:t=>[cx+a*Math.cos(TAU*n*t),cy+b*Math.sin(TAU*n*t)],d:t=>[-a*TAU*n*Math.sin(TAU*n*t),b*TAU*n*Math.cos(TAU*n*t)]};}
export function pathDraw(s,r,color='accent',n=160){s.path(Array.from({length:n+1},(_,i)=>r(i/n)),{color,width:2.5});}
export function arrows(s,F,range=2){for(let i=-5;i<=5;i++)for(let j=-5;j<=5;j++){const x=i*range/5,y=j*range/5,f=F(x,y),m=Math.hypot(...f);if(!Number.isFinite(m)||m===0)continue;const k=.22/Math.max(1,m);s.arrow(x,y,x+k*f[0],y+k*f[1],{color:'muted',alpha:.55,width:1});}}
// RK4 integration of q'=u, u'=-q+k Jq; work'=k Jq dot u.
export function orbit(k,T=10,n=2000){let z=[1,0,0,1,0];const rows=[[0,...z]],dt=T/n;
 const f=z=>[z[2],z[3],-z[0]-k*z[1],-z[1]+k*z[0],k*(-z[1]*z[2]+z[0]*z[3])];
 for(let i=0;i<n;i++){const a=f(z),b=f(z.map((x,j)=>x+dt*a[j]/2)),c=f(z.map((x,j)=>x+dt*b[j]/2)),d=f(z.map((x,j)=>x+dt*c[j]));z=z.map((x,j)=>x+dt*(a[j]+2*b[j]+2*c[j]+d[j])/6);rows.push([(i+1)*dt,...z]);}return rows;
}
export function gas(h,V=3,p=2){const dv=V-1,dp=p-1;const pressure=t=>1+dp*t+h*Math.sin(Math.PI*t),W=quad(t=>pressure(t)*dv),dU=1.5*(p*V-1);return {pressure,W,dU,Q:dU+W,exactW:dv*((1+p)/2+2*h/Math.PI)};}
