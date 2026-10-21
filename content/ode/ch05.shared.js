// Authored finite examples. Exact formulas except the explicitly labelled RK4 paths.
export const source='https://www.mat.univie.ac.at/~gerald/ftp/book-ode/ode.pdf';
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function sample(f,a,b,n=160){return Array.from({length:n+1},(_,i)=>f(a+(b-a)*i/n));}
export function rotate([x,y],t,decay=0){const e=Math.exp(-decay*t),c=Math.cos(t),s=Math.sin(t);return[e*(c*x-s*y),e*(s*x+c*y)];}
export function radial(r,t){if(r===0)return 0;return r/Math.sqrt(r*r+(1-r*r)*Math.exp(-2*t));}
export function circleExcursion(theta,t){const q=1/Math.tan(theta/2)-t;return[ (q*q-1)/(q*q+1),2*q/(q*q+1) ];}
export function rk4(f,z,T,n=600){let y=z.slice();const out=[[0,y.slice()]],h=T/n;for(let i=0;i<n;i++){const a=f(y),b=f(y.map((v,j)=>v+h*a[j]/2)),c=f(y.map((v,j)=>v+h*b[j]/2)),d=f(y.map((v,j)=>v+h*c[j]));y=y.map((v,j)=>v+h*(a[j]+2*b[j]+2*c[j]+d[j])/6);if(y.some(v=>!Number.isFinite(v)))throw Error('Nonfinite numerical orbit');out.push([(i+1)*h,y.slice()]);}return out;}
export const pendulum=(d)=> ([x,y])=>[y,-Math.sin(x)-d*y];
export const energy=([x,y])=>1-Math.cos(x)+y*y/2;
export function basinX(x,a,t){const u=x-a;if(!u)return a;return a+u/Math.sqrt(u*u+(1-u*u)*Math.exp(-2*t));}
export function plane(v,title='phase plane',r=2.3){const s=v.stage({x:[-r,r],y:[-r,r],equal:true,axes:'box',gutter:true,height:320,minWidth:260,xlabel:'x',ylabel:'y',title});s.el.style.maxWidth='620px';s.el.style.marginInline='auto';return s;}
export function strip(v,title,x=[0,8],y=[-.1,2.2],ylabel='value'){return v.stage({x,y,axes:'box',gutter:true,height:280,minWidth:260,xlabel:'time t',ylabel,title});}
export function ring(s,r,color='muted',o={}){s.circle(0,0,r,{color,width:1.2,...o});}
export function path(s,pts,color='accent',o={}){s.path(pts,{color,width:2,...o});}
export function field(s,F,r=1.8){for(let x=-r;x<=r+.001;x+=r/4)for(let y=-r;y<=r+.001;y+=r/4){const a=F([x,y]),m=Math.hypot(...a);if(m>1e-10)s.arrow(x,y,x+.19*a[0]/m,y+.19*a[1]/m,{color:'muted',width:.7,head:3});}}
export function contours(s,V,levels){s.contour((x,y)=>V([x,y]),levels,{color:'muted',width:1});}
export const commonScope=String.raw`The theorem concerns exact continuous-time solutions. Authored finite examples illustrate hypotheses; a finite plot is not a proof. Numerical trajectories, where used, are labelled with their method and a step-halving diagnostic.`;
export function gradientX(x,a,t){if(a===0)return x/Math.sqrt(1+2*x*x*t);return x*Math.exp(a*t)/Math.sqrt(1+x*x*Math.expm1(2*a*t)/a);}
export function verlet(z,T,n=600){let[x,y]=z;const h=T/n,out=[[0,[x,y]]];for(let i=0;i<n;i++){y+=h*(x-x*x*x)/2;x+=h*y;y+=h*(x-x*x*x)/2;out.push([(i+1)*h,[x,y]]);}return out;}
export const wellEnergy=([x,y])=>(x*x-1)**2/4+y*y/2;
export function polygonArea(p){return Math.abs(p.reduce((s,[x,y],i)=>{const q=p[(i+1)%p.length];return s+x*q[1]-y*q[0];},0))/2;}

export const sci=(x,d=3)=>Number(x).toExponential(d);
