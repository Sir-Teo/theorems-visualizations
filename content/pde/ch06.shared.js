// PDE6 dimensionless numerical examples. Every quadrature uses the stated kernel.
export const PI=Math.PI,TAU=2*PI;
const cache=new Map();
// Compensate affine support boundaries before their final rounding.
function supportSum(...xs){let s=0,e=0;for(const x of xs){const a=s+x,b=a-s;e+=(s-(a-b))+(x-b);s=a;}return s+e;}
export function gauss(n=40){if(cache.has(n))return cache.get(n);const x=[],w=[];for(let j=0;j<n;j++){let z=Math.cos(PI*(j+.75)/(n+.5)),dp;for(let k=0;k<24;k++){let a=1,b=0;for(let l=1;l<=n;l++){const c=b;b=a;a=((2*l-1)*z*b-(l-1)*c)/l;}dp=n*(z*a-b)/(z*z-1);const d=a/dp;z-=d;if(Math.abs(d)<2e-15)break;}x.push(z);w.push(2/((1-z*z)*dp*dp));}const out={x,w};cache.set(n,out);return out;}
export function integrate(f,a,b,n=40){if(a===b)return 0;const{x,w}=gauss(n),h=(b-a)/2,m=a+h;return h*x.reduce((s,z,i)=>s+w[i]*f(m+h*z),0);}
export function bump(q,width=1){const z=q/width;if(Math.abs(z)>=1)return 0;return(1-z*z)**4;}
export function bumpD(q,width=1){const z=q/width;if(Math.abs(z)>=1)return 0;return -8*z*(1-z*z)**3/width;}
export function radialBump(r2,width=1){const z=r2/(width*width);return z<1?(1-z)**4:0;}
export function radialGradientDot(r2,dot,width=1){const z=r2/(width*width);return z<1?-8*dot*(1-z)**3/(width*width):0;}
export function planePulse(x,t,c=1,width=.65){const q=x-c*t;return{u:bump(q,width),ux:bumpD(q,width),ut:-c*bumpD(q,width)};}
export function coneEnergy(t,center=0,R=2,c=1,width=.65,n=64){const r=Math.max(0,R-c*t);if(r===0)return{energy:0,rate:0,r};const A=R-width-center,B=(R+width+center)-2*c*t,lo=Math.max(0,-A),hi=Math.min(2*width,B);if(hi<=lo)return{energy:0,rate:0,r};const W=lo===-A&&hi===B?2*r:hi-lo,at=z=>{const delta=lo+W*z,f=delta*((2*width-lo)-W*z)/(width*width),q=delta-width,square=64*q*q/(width**4)*f**6,left=lo===-A?W*z:A+delta,right=hi===B?W*(1-z):B-delta;return{square,left,right};};const energy=PI*c*c*W*integrate(z=>{const q=at(z);return q.left*q.right*q.square;},0,1,n),rate=-TAU*c**3*W*integrate(z=>{const q=at(z);return q.left*q.square;},0,1,n);return{energy,rate,r};}
export function sinc(x){if(Math.abs(x)<.01){const z=x*x;return 1-z/6+z*z/120-z*z*z/5040+z**4/362880;}return Math.sin(x)/x;}
export function sincD(x){if(Math.abs(x)<.01){const z=x*x;return x*(-1/3+z/30-z*z/840+z*z*z/45360);}return(Math.cos(x)-sinc(x))/x;}
export const sincDOverX=x=>Math.abs(x)<.01?-1/3+x*x/30-(x*x)**2/840+(x*x)**3/45360:sincD(x)/x;
export function sincDD(x){if(Math.abs(x)<.01){const z=x*x;return -1/3+z/10-z*z/168+z*z*z/6480;}return -sinc(x)-2*sincD(x)/x;}
export function sphericalMean(x,r,t,k=2,c=1,n=40){const C=Math.cos(c*k*t),analytic=Math.cos(k*x)*sinc(k*r)*C,numeric=integrate(mu=>Math.cos(k*(x+r*mu))*C,-1,1,n)/2;const rr=Math.cos(k*x)*k*k*sincDD(k*r)*C,drOverR=Math.cos(k*x)*k*k*sincDOverX(k*r)*C,tt=-((c*k)**2)*analytic;return{analytic,numeric,rr,drOverR,tt,residual:tt-c*c*(rr+2*drOverR)};}
// Unit-sphere integration: radial data about origin; observer=(d,0,0).
export function radialDeficit(d,r,mu,width){return ((width-d)*(width+d)-r*r-2*d*r*mu)/(width*width);}
export function radialShell(d,r,width=.65,mode='velocity',n=48){if(d===0||r===0){const f=((width-d)*(width+d)-r*r)/(width*width);return f>0?(mode==='velocity'?f**4:f**4-8*r*r/(width*width)*f**3):0;}const deficit=supportSum(width,-d,r)*supportSum(width,d,-r);if(deficit<=0)return 0;const dr=d*r,L=Math.min(2,deficit/(2*dr));return integrate(z=>{const q=L*z,f=(deficit-2*dr*q)/(width*width);return mode==='velocity'?f**4:f**4-8*(r*(r-d)+dr*q)/(width*width)*f**3;},0,1,n)*(L/2);}
export function kirchhoff(d,t,c=1,width=.65,mode='velocity',n=48){if(t===0)return mode==='velocity'?0:radialBump(d*d,width);return radialShell(d,c*t,width,mode,n)*(mode==='velocity'?t:1);}
// Sphere projection for an interior disk; a support-adapted cap coordinate when it cuts the data boundary.
export function poisson(d,t,c=1,width=.65,mode='velocity',n=32,angles=96){if(t===0)return mode==='velocity'?0:radialBump(d*d,width);const r=c*t;if(r<=width-d||r===0)return integrate(mu=>{const rho=Math.sqrt(Math.max(0,1-mu*mu)),R=r*rho;let s=0;for(let j=0;j<angles;j++){const z=Math.cos(TAU*(j+.5)/angles),f=radialDeficit(d,R,z,width);if(f>0)s+=mode==='velocity'?f**4:f**4-8*(R*R+d*R*z)/(width*width)*f**3;}return s/angles;},0,1,n)*(mode==='velocity'?t:1);
const cap=supportSum(width,-d,r);if(cap<=0)return 0;const W=Math.min(2*width,cap),angular=Math.max(12,Math.floor(angles/4));return integrate(z=>{const delta=W*z,X=width-delta,D=delta*(2*width-delta),Y2=supportSum(r,d,-width,delta)*(cap===W?W*(1-z):cap-delta),limit=Y2>D?Math.asin(Math.sqrt(D/Y2)):PI/2;return (2/PI)*integrate(alpha=>{const transverse=Y2*Math.sin(alpha)**2,f=Math.max(0,(D-transverse)/(width*width));return mode==='velocity'?f**4:f**4-8*(supportSum(width,-d,-delta)*X+transverse)/(width*width)*f**3;},0,limit,angular);},0,1,n)*(W/(2*r))*(mode==='velocity'?t:1);}
export function signal(d,t,c=1,width=.65,dimension=3,n=48){if(t===0)return 0;if(dimension===1){
 // d'Alembert's velocity integral, split at actual compact support and origin.
 // Five-point Gauss integrates each degree-eight polynomial exactly in exact arithmetic.
 d=Math.abs(d);const r=c*t;if(r===0)return t*bump(d,width);
 if(r<=width-d)return t*integrate(mu=>{const f=((width-d)-r*mu)*((width+d)+r*mu)/(width*width);return f**4;},-1,1,5)/2;
 let mean=0;for(const D of[d,-d]){const lo=Math.max(0,supportSum(width,-D,-r)),hi=Math.min(width,supportSum(width,-D,r));if(hi<=lo)continue;const W=hi-lo;mean+=(W/r)*integrate(z=>{const delta=lo+W*z,f=delta*((2*width-lo)-W*z)/(width*width);return f**4;},0,1,5)/2;}
 return t*mean;
 }return dimension===2?poisson(d,t,c,width,'velocity',n,96):kirchhoff(d,t,c,width,'velocity',n);}
export function support(d,t,c,width,dimension){const r=c*t;if(t===0)return false;return dimension===3?supportSum(width,-d,r)>0&&supportSum(width,d,-r)>0:supportSum(width,-d,r)>0;}
export const flash=s=>s>=0&&s<=1?Math.sin(PI*s)**4:0;
export function retardedCenter(d,t,c=1,v=.25){if(t<d/c)return null;let lo=0,hi=t;for(let j=0;j<64;j++){const m=lo+(hi-lo)/2;if(m+Math.abs(d-v*m)/c<t)lo=m;else hi=m;}return lo+(hi-lo)/2;}
export function retardedPotential(d,t,c=1,v=.25,width=.35,n=40){
 if(t===0)return 0;
 // Work in source time s, split at temporal and every signed spatial support boundary.
 // Store distance from the temporal end instead of subtracting rounded near-end roots.
 const sum=(...xs)=>{let s=0,e=0;for(const x of xs){const a=s+x,b=a-s;e+=(s-(a-b))+(x-b);s=a;}return s+e;},end=Math.min(t,1),points=[end,0];
 for(const sign of[-1,1])for(const edge of[-width,width]){const den=v+sign*c;if(den===0)continue;const s=sum(d,-edge,sign*c*t)/den,toEnd=sum(v*end,sign*c*(end-t),-d,edge)/den;if(s>0&&toEnd>0&&toEnd<end)points.push(toEnd);}
 if(v!==0){const s=d/v,toEnd=sum(v*end,-d)/v;if(s>0&&toEnd>0&&toEnd<end)points.push(toEnd);}
 points.sort((a,b)=>b-a);let total=0;
 for(let j=0;j+1<points.length;j++){const far=points[j],near=points[j+1],W=far-near;if(!(W>0))continue;const mid=near+W/2,sign=sum(d,-v*end,v*mid)>=0?1:-1,L0=sum(width,-sign*d,sign*v*end,c*(t-end)),U0=sum(width,sign*d,-sign*v*end,-c*(t-end)),slope=c-sign*v;
  total+=W*integrate(z=>{const u=near+W*z,s=sum(end,-u),delay=(t-end)+u,r=c*delay,D=Math.abs(sum(d,-v*end,v*u)),L=sum(L0,slope*u),U=sum(U0,-slope*u);if(L<=0||U<=0)return 0;const fmax=L*U/(width*width),den=2*D*r,cap=den>0?Math.min(2,L*U/den):2,drop=den*cap/(width*width),mean=integrate(q=>Math.max(0,fmax-drop*q)**4,0,1,n)*(cap/2),phase=Math.min(s,(1-end)+u);return delay*Math.sin(PI*phase)**4*mean;},0,1,n);
 }
 return total;
}
export function medium(x,y,strength=.3){const a=strength*Math.exp(-(x*x+y*y)/.64),c=1-a;return{c,dx:2*x*a/.64,dy:2*y*a/.64};}
export function rayDerivative(Y,strength){const[x,y,px,py]=Y,{c,dx,dy}=medium(x,y,strength),p=Math.hypot(px,py);return[c*px/p,c*py/p,-p*dx,-p*dy];}
export function rk4(y,h,f){const a=f(y),b=f(y.map((x,i)=>x+h*a[i]/2)),c=f(y.map((x,i)=>x+h*b[i]/2)),d=f(y.map((x,i)=>x+h*c[i]));return y.map((x,i)=>x+h*(a[i]+2*b[i]+2*c[i]+d[i])/6);}
export function ray(b,t,strength=.3,dt=.02){const c0=medium(-2,b,strength).c;let Y=[-2,b,1/c0,0],points=[Y.slice()];const steps=Math.max(1,Math.ceil(t/dt)),h=t/steps;for(let j=0;j<steps;j++){Y=rk4(Y,h,z=>rayDerivative(z,strength));points.push(Y.slice());}return{Y,points,c0,H:medium(Y[0],Y[1],strength).c*Math.hypot(Y[2],Y[3])};}
export function rayTube(b,t,strength=.3,dt=.02){const h=1e-4,A=ray(b-h,t,strength,dt),B=ray(b+h,t,strength,dt),R=ray(b,t,strength,dt),vel=rayDerivative(R.Y,strength),db=[(B.Y[0]-A.Y[0])/(2*h),(B.Y[1]-A.Y[1])/(2*h)],J=vel[0]*db[1]-vel[1]*db[0],c=medium(R.Y[0],R.Y[1],strength).c;return{...R,J,amplitude:J>0?c/Math.sqrt(R.c0*J):null};}
export function packet(x,t,sigma=.45,p=1){const q=t/(2*sigma*sigma),width=sigma*Math.hypot(1,q),center=p*t,z=(x-center)/width,density=Math.exp(-z*z/2)/(Math.sqrt(TAU)*width),phase=(z*z*q)/4+p*(x-p*t/2)-Math.atan(q)/2,amp=Math.sqrt(density);return{re:amp*Math.cos(phase),im:amp*Math.sin(phase),density,width,center,phase};}
export function packetWindow(t,sigma=.45,p=1,n=80){const a=packet(p*t,t,sigma,p),mass=integrate(z=>packet(a.center+a.width*z,t,sigma,p).density*a.width,-8,8,n);return{...a,mass,window:[a.center-8*a.width,a.center+8*a.width]};}
export function boost(x,t,beta=.4,c=1,kind='Lorentz'){const gamma=kind==='Lorentz'?1/Math.sqrt((1-beta)*(1+beta)):1;return{X:gamma*(x-beta*c*t),T:kind==='Lorentz'?gamma*(t-beta*x/c):t,gamma};}
export function boostedWave(x,t,beta=.4,c=1,k=2,kind='Lorentz'){const{X,T,gamma}=boost(x,t,beta,c,kind),a=Math.cos(k*X),b=Math.cos(c*k*T),uxx=-k*k*a*b,utt=-c*c*k*k*a*b,uxt=c*k*k*Math.sin(k*X)*Math.sin(c*k*T),Xt=-gamma*beta*c,Tt=kind==='Lorentz'?gamma:1,Xx=gamma,Tx=kind==='Lorentz'?-gamma*beta/c:0,tt=uxx*Xt*Xt+2*uxt*Xt*Tt+utt*Tt*Tt,xx=uxx*Xx*Xx+2*uxt*Xx*Tx+utt*Tx*Tx;return{u:a*b,tt,xx,residual:tt-c*c*xx,X,T,gamma};}
export function outgoing(r,t,c=1,width=.45,shift=1.3){if(!(r>0))return null;const q=r-c*t-shift,F=bump(q,width),D=bumpD(q,width),u=F/r,ut=-c*D/r,ur=D/r-F/(r*r),power=-4*PI*r*r*c*c*ut*ur,leading=4*PI*c**3*D*D;return{u,ut,ur,power,leading,cross:4*PI*c**3*F*D/r,F,D};}
export function outgoingPulseEnergy(r,c=1,width=.45,n=64){return integrate(q=>{const F=bump(q,width),D=bumpD(q,width);return 4*PI*c*c*(D*D-F*D/r);},-width,width,n);}
