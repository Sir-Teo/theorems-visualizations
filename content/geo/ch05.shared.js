// GEO5: local, explicit models; east x, north y, upward z; CCW circulation positive.
export const O={step:'any',decimals:4},I={step:1,int:true},TAU=2*Math.PI,OMEGA=7.292115e-5,DAY=86400;
export const fcor=lat=>2*OMEGA*Math.sin(lat*Math.PI/180);
export const axes=(title,x,y,extra={})=>({title,x,y,axes:'box',gutter:true,height:310,...extra});
export const dot=(a,b)=>a.reduce((s,x,j)=>s+x*b[j],0);
export const mul=(A,B)=>A.map(row=>B[0].map((_,j)=>row.reduce((s,x,k)=>s+x*B[k][j],0)));
export const mv=(A,v)=>A.map(row=>dot(row,v));
export const transpose=A=>A[0].map((_,j)=>A.map(row=>row[j]));
export const det3=A=>A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1])-A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0])+A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0]);
export const inverse3=A=>{const d=det3(A);return transpose(A.map((row,i)=>row.map((_,j)=>{const r=[0,1,2].filter(k=>k!==i),c=[0,1,2].filter(k=>k!==j);return((-1)**(i+j))*(A[r[0]][c[0]]*A[r[1]][c[1]]-A[r[0]][c[1]]*A[r[1]][c[0]])/d;})));};
export const cmul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
export function affine2(a,b,f,r,t){
 const d=r*r+f*f,e=Math.exp(-r*t),C=Math.cos(f*t),S=Math.sin(f*t),A=Math.expm1(-r*t)*C-2*Math.sin(f*t/2)**2,B=-e*S;
 let K;if(Math.hypot(r*t,f*t)<.001){K=[t,0];let term=[t,0];for(let j=1;j<=8;j++){term=cmul(term,[-r*t/(j+1),-f*t/(j+1)]);K=[K[0]+term[0],K[1]+term[1]];}}else K=[(-r*A-f*B)/d,(f*A-r*B)/d];
 const z=cmul(K,[a,b]),F=[1+z[0],z[1]],Fp=cmul([e*C,-e*S],[a,b]),J=F[0]**2+F[1]**2,grad=[dot(Fp,F)/J,(Fp[1]*F[0]-Fp[0]*F[1])/J],vort=2*grad[1];
 let circulation=0;const N=64;for(let j=0;j<N;j++){const q=TAU*(j+.5)/N,p=cmul(F,[Math.cos(q),Math.sin(q)]),dl=cmul(F,[-Math.sin(q),Math.cos(q)]),u=cmul(Fp,[Math.cos(q),Math.sin(q)]);circulation+=((u[0]-f*p[1]/2)*dl[0]+(u[1]+f*p[0]/2)*dl[1])*TAU/N;}
 return{F,Fp,J,grad,vort,height:1/J,q:(vort+f)*J,circulation,initial:Math.PI*(2*b+f),divergence:2*grad[0]};
}
export function velocity(mode,x,y,rate){return mode==='solid rotation'?[-rate*y,rate*x]:mode==='shear'?[-rate*y,0]:[rate*x,-rate*y];}
export const relativeVorticity=(mode,rate)=>mode==='solid rotation'?2*rate:mode==='shear'?rate:0;
// Exact ballistic affine Euler flow: x=(I+tB)X, spatially uniform pressure and density.
// theta here is an independent advected tracer, not an imposed thermodynamic temperature field.
export function ertel(a,b,c,s,t,tilt){
 const B=[[a,-b,s],[b,-a,0],[0,0,c]],F=B.map((row,i)=>row.map((x,j)=>(i===j?1:0)+t*x)),J=det3(F),inv=inverse3(F),L=mul(B,inv),omega=[L[2][1]-L[1][2],L[0][2]-L[2][0],L[1][0]-L[0][1]],g0=[Math.sin(tilt),0,Math.cos(tilt)],gradient=mv(transpose(inv),g0),rho=1/J,initial=dot([0,s,2*b],g0),q=dot(omega,gradient)/rho;
 return{B,F,J,L,omega,gradient,rho,q,initial,stretch:mv(F,[0,s,2*b]).map(x=>x/J)};
}
export const ridgeShape=x=>Math.abs(x)<1?(1+Math.cos(Math.PI*x))/2:0;
// Green-function convolution for chi''+lambda chi=-B(X), upstream chi=chi'=0.
export function ridge(lambda,x,n=128){
 if(x<=-1)return{psi:0,v:0,vort:0,bottom:0};const upper=Math.min(x,1),h=(upper+1)/n,k=Math.sqrt(lambda);let psi=0,v=0;
 for(let j=0;j<=n;j++){const s=-1+j*h,z=x-s,w=(j===0||j===n)?1:j%2?4:2,b=ridgeShape(s);psi-=w*b*(k?Math.sin(k*z)/k:z);v-=w*b*Math.cos(k*z);}
 psi*=h/3;v*=h/3;const bottom=ridgeShape(x),vort=-lambda*psi-bottom;return{psi,v,vort,bottom};
}
// beta*Psi_x+r*Laplacian(Psi)=-C/rho sin(pi*y/Ly), Psi=0 on all walls.
// phi''+B*phi'-k^2*phi=-1, X=x/Lx and k=pi*Lx/Ly.
export function stommel(B,k,x){
 const d=Math.hypot(B,2*k),p=B>=0?2*k*k/(d+B):(d-B)/2,m=B>=0?-(d+B)/2:-2*k*k/(d-B),em=Math.exp(-p),ep=Math.exp(m),den=-Math.expm1(m-p),A=-Math.expm1(-p)/den,C=-Math.expm1(m)/den,E=Math.exp(m*x),G=Math.exp(p*(x-1)),scale=1/(k*k),phi=scale*(1-A*E-C*G),dx=-scale*(A*m*E+C*p*G),dxx=-scale*(A*m*m*E+C*p*p*G),integral=scale*(x-A*Math.expm1(m*x)/m-C*Math.exp(-p)*Math.expm1(p*x)/p);
 return{phi,dx,dxx,integral,p,m,residual:dxx+B*dx-k*k*phi+1};
}
export function gyre(B,aspect,x,y){const k=Math.PI*aspect,z=stommel(B,k,x),sy=Math.sin(Math.PI*y),cy=Math.cos(Math.PI*y);return{...z,psi:z.phi*sy,U:-k*z.phi*cy,V:z.dx*sy,lap:(z.dxx-k*k*z.phi)*sy,curl:-sy};}
// Finite, zero-mean periodic Fourier PV blob: no grid PDE or observation is implied.
export function pvModes(width,sign=1){const modes=[];let sum=0;for(let m=-4;m<=4;m++)for(let n=-4;n<=4;n++)if(m||n){const c=Math.exp(-width*width*(m*m+n*n)/2);modes.push({m,n,c});sum+=c;}return modes.map(z=>({...z,c:sign*z.c/sum}));}
export function invertPV(modes,R,x,y){let q=0,psi=0,u=0,v=0,lap=0;const a=R===Infinity?0:1/(R*R);for(const {m,n,c}of modes){const phase=m*x+n*y,C=Math.cos(phase),S=Math.sin(phase),w=-c/(m*m+n*n+a);q+=c*C;psi+=w*C;u+=n*w*S;v-=m*w*S;lap-=(m*m+n*n)*w*C;}return{q,psi,u,v,lap,residual:lap-a*psi-q};}
export function simpson(fn,a,b,n=256){const h=(b-a)/n;let s=fn(a)+fn(b);for(let j=1;j<n;j++)s+=(j%2?4:2)*fn(a+j*h);return s*h/3;}
// Finite guide strokes stay inside the plot, including their round caps.
export function guideH(s,y,o={}){const p=3/Math.abs(s.sx);s.line(s.xr[0]+p,y,s.xr[1]-p,y,{width:1.2,...o});}
export function guideV(s,x,o={}){const p=3/Math.abs(s.sy);s.line(x,s.yr[0]+p,x,s.yr[1]-p,{width:1.2,...o});}
