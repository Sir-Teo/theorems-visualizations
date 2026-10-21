// Radiative transfer models: SI constants; all artificial normalizations declared by callers.
export const C=299792458,K=1.380649e-23,MH=1.6735575e-27,SIGMA=5.670374419e-8,RSUN=6.957e8,YEAR=365.25*86400;
export function rng(seed=1){let a=seed>>>0;return()=>{a=(1664525*a+1013904223)>>>0;return(a+.5)/4294967296;};}
export const slab=(I,S,t)=>I*Math.exp(-t)+S*(-Math.expm1(-t));
export const linearSlab=(I,S,g,t)=>slab(I,S,t)+g*(t+Math.expm1(-t));
export const grey=(Te,t)=>Te*(.75*(t+2/3))**.25;
export const limb=(mu,isothermal=false)=>isothermal?1:.4+.6*mu;
export function disk(d,I=1){const angle=Math.asin(1/d);return{angle,omega:2*Math.PI*(1-Math.sqrt(1-1/d**2)),flux:Math.PI*I/d**2};}
export function fluxQuadrature(d,I=1,n=2048){const h=Math.asin(1/d)/n;let f=0;for(let j=0;j<n;j++){const t=(j+.5)*h;f+=2*Math.PI*I*Math.cos(t)*Math.sin(t)*h;}return f;}
export function paths(seed=7,count=128,n=400){const R=rng(seed),all=[],sum=Array(n+1).fill(0),sum2=Array(n+1).fill(0);for(let k=0;k<count;k++){const path=[[0,0,0]];for(let j=1;j<=n;j++){const L=-Math.log(R()),mu=2*R()-1,ph=2*Math.PI*R(),sn=Math.sqrt(1-mu*mu),p=path[j-1],q=[p[0]+L*sn*Math.cos(ph),p[1]+L*sn*Math.sin(ph),p[2]+L*mu],r2=q.reduce((s,v)=>s+v*v,0);sum[j]+=r2;sum2[j]+=r2*r2;path.push(q);}all.push(path);}return{all,mean:sum.map(s=>s/count),se:sum.map((s,j)=>Math.sqrt(Math.max(0,sum2[j]/count-(s/count)**2)/(count-1)))};}
export function opacity(T,rho,X=.7,Z=.02){return{ff:3.68e18*(1-Z)*(1+X)*rho*T**-3.5,bf:4.34e21/10*Z*(1+X)*rho*T**-3.5,es:.02*(1+X)};}
// Unit-area Voigt profile: Gaussian e^-x²/sqrt(pi) convolved with a/[pi(x²+a²)].
// Core uses its Fourier integral. Wings use Gaussian convolution, away from its narrow pole.
export function voigt(x,a){x=Math.abs(x);if(a===0)return Math.exp(-x*x)/Math.sqrt(Math.PI);if(x>8){const n=128,h=16/n;let s=0;for(let j=0;j<=n;j++){const u=-8+j*h,term=Math.exp(-u*u)*a/(Math.PI*((x-u)**2+a*a));s+=(j===0||j===n?1:j%2?4:2)*term;}return s*h/(3*Math.sqrt(Math.PI));}const n=2048,h=14/n;let s=0;for(let j=0;j<=n;j++){const t=j*h,term=Math.exp(-t*t/4-a*t)*Math.cos(x*t);s+=(j===0||j===n?1:j%2?4:2)*term;}return s*h/(3*Math.PI);}
export function profileGrid(a,n=1600,xmax=1e5){const ds=Math.asinh(xmax)/n;return{a,xmax,n,ds,nodes:Array.from({length:n},(_,j)=>{const s=(j+.5)*ds,x=Math.sinh(s);return{x,p:voigt(x,a),w:Math.cosh(s)*ds};})};}
export function equivalent(Q,G){return 2*G.nodes.reduce((s,p)=>s+(-Math.expm1(-Q*p.p))*p.w,0);}
export const ewTailBound=(Q,G)=>2*Q*G.a/(Math.PI*(G.xmax-8))+Q*2e-29;
export function widths(T,n){const b=Math.sqrt(2*K*T/MH)/1000,lambda=121.567e-9,A=6.265e8,collision=n*1e-18*Math.sqrt(8*K*T/(Math.PI*MH)),gamma=lambda*(A+2*collision)/(4*Math.PI)/1000;return{b,gamma,a:gamma/b,collision,pressure:n*K*T};}
