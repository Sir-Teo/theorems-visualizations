// VCALC6 pure geometric models. Coordinates are dimensionless; no singular normal is invented.
export {add3,sub3,mul3,dot3,cross3,norm3} from './ch01.shared.js';
import{add3 as add,sub3 as sub,mul3 as mul,dot3 as dot,cross3 as cross,norm3 as norm}from'./ch01.shared.js';
export const PI=Math.PI,TAU=2*PI;
export const unit=a=>{const n=norm(a);return n>0?mul(a,1/n):null;};
export const phase=t=>t===1?0:TAU*t;
export const latitude=(t,q=0)=>Math.abs(t)===PI/2?t:t+q*Math.sin(2*t)/2;
export const latCos=t=>Math.abs(t)===PI/2?0:Math.cos(t);
export function sphere(u,v,r=1){const c=latCos(v);return[r*c*Math.cos(u),r*c*Math.sin(u),r*Math.sin(v)];}
export function sphereD(u,v,r=1){const c=latCos(v),s=Math.sin(v);return{u:[-r*c*Math.sin(u),r*c*Math.cos(u),0],v:[-r*s*Math.cos(u),-r*s*Math.sin(u),r*c]};}
export function torus(u,v,R=1.2,r=.4){const a=R+r*Math.cos(v);return[a*Math.cos(u),a*Math.sin(u),r*Math.sin(v)];}
export function torusD(u,v,R=1.2,r=.4){const a=R+r*Math.cos(v);return{u:[-a*Math.sin(u),a*Math.cos(u),0],v:[-r*Math.sin(v)*Math.cos(u),-r*Math.sin(v)*Math.sin(u),r*Math.cos(v)]};}
export const helicoid=(u,v)=>[v*Math.cos(u),v*Math.sin(u),.35*u];
export const helicoidD=(u,v)=>({u:[-v*Math.sin(u),v*Math.cos(u),.35],v:[Math.cos(u),Math.sin(u),0]});
export function geometry(d){const N=cross(d.u,d.v),J=norm(N);return{N,J,n:J>0?mul(N,1/J):null,E:dot(d.u,d.u),F:dot(d.u,d.v),G:dot(d.v,d.v)};}
export function midpoint(f,U,V,n=24,m=n){if(U[0]===U[1]||V[0]===V[1])return 0;let s=0;const du=(U[1]-U[0])/n,dv=(V[1]-V[0])/m;for(let i=0;i<n;i++)for(let j=0;j<m;j++)s+=f(U[0]+(i+.5)*du,V[0]+(j+.5)*dv);return s*du*dv;}
export function gauss(n){const x=[],w=[];for(let j=0;j<n;j++){let z=Math.cos(PI*(j+.75)/(n+.5)),dp;for(let k=0;k<20;k++){let a=1,b=0;for(let l=1;l<=n;l++){const c=b;b=a;a=((2*l-1)*z*b-(l-1)*c)/l;}dp=n*(z*a-b)/(z*z-1);const dz=a/dp;z-=dz;if(Math.abs(dz)<2e-15)break;}x.push(z);w.push(2/((1-z*z)*dp*dp));}return{x,w};}
const rules=new Map();
export function integral(f,U,V,n=24){if(U[0]===U[1]||V[0]===V[1])return 0;if(!rules.has(n))rules.set(n,gauss(n));const{x,w}=rules.get(n),du=(U[1]-U[0])/2,dv=(V[1]-V[0])/2,cu=U[0]+du,cv=V[0]+dv;let sum=0;for(let i=0;i<n;i++)for(let j=0;j<n;j++)sum+=w[i]*w[j]*f(cu+du*x[i],cv+dv*x[j]);return sum*du*dv;}
export function triangles(F,U,V,n=20,m=n){const rows=Array.from({length:n+1},(_,i)=>Array.from({length:m+1},(_,j)=>F(U[0]+(U[1]-U[0])*i/n,V[0]+(V[1]-V[0])*j/m))),out=[];for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=rows[i][j],b=rows[i+1][j],c=rows[i+1][j+1],d=rows[i][j+1];out.push([a,b,c],[a,c,d]);}return out;}
export const triangleArea=t=>norm(cross(sub(t[1],t[0]),sub(t[2],t[0])))/2;
export const meshArea=tris=>tris.reduce((s,t)=>s+triangleArea(t),0);
export function warpedSphere(u,v,r,q){return sphere(u,latitude(v,q),r);}
export function warpedD(u,v,r,q){const d=sphereD(u,latitude(v,q),r);return{u:d.u,v:mul(d.v,1+q*Math.cos(2*v))};}
export const sphereArea=(r,q,n=24)=>integral((u,v)=>geometry(warpedD(u,v,r,q)).J,[0,TAU],[-PI/2,PI/2],n);
/** m horizontal bands, n vertices per ring; alternate rings shifted π/n. 2mn actual triangles. */
export function lantern(n,m,r=1,H=2){const ring=j=>Array.from({length:n},(_,i)=>{const t=TAU*(i+(j%2)/2)/n;return[r*Math.cos(t),r*Math.sin(t),H*(j/m-.5)];}),out=[];let A=ring(0);for(let j=0;j<m;j++){const B=ring(j+1);for(let i=0;i<n;i++){const next=(i+1)%n,prev=(i+n-1)%n;if(j%2===0)out.push([A[i],A[next],B[i]],[B[prev],B[i],A[i]]);else out.push([A[i],A[next],B[next]],[B[i],B[next],A[i]]);}A=B;}return out;}
export function lanternArea(n,m,r=1,H=2){const half=PI/n,sag=2*r*Math.sin(half/2)**2;return 2*n*r*Math.sin(half)*Math.hypot(H,m*sag);}
export const lanternBands=(n,mode)=>mode==='balanced'?n:mode==='critical'?n*n:n*n*n;
export function heightSphere(u,z,r=1){const a=Math.sqrt(Math.max(0,(r-z)*(r+z)));return[a*Math.cos(u),a*Math.sin(u),z];}
export function zone(center,height,r=1){return{a:center-height/2,b:center+height/2,area:TAU*r*height,empty:height===0};}
export function scalarIntegral(beta=1,mode='height',n=32){const covers=mode==='double cover'?2:1;if(mode==='latitude')return integral((u,v)=>(1+beta*Math.sin(v)**2)*latCos(v),[0,TAU],[-PI/2,PI/2],n);return integral((u,z)=>(1+beta*z*z),[0,covers*TAU],[-1,1],n);}
export function loop(t,kind='sphere'){const u=phase(t),v=.35*Math.sin(u);if(kind==='torus'){return{p:torus(u,v),n:[Math.cos(v)*Math.cos(u),Math.cos(v)*Math.sin(u),Math.sin(v)]};}return{p:sphere(u,v),n:sphere(u,v)};}
export function strip(t,w,k=1,R=1.3){const u=phase(t),a=k*PI*t,c=t===1?(k%2?-1:1):Math.cos(a),s=t===1?0:Math.sin(a),b=R+w*c;return{p:[b*Math.cos(u),b*Math.sin(u),w*s],u:[-b*Math.sin(u)-w*k/2*s*Math.cos(u),b*Math.cos(u)-w*k/2*s*Math.sin(u),w*k/2*c].map(x=>TAU*x),v:[c*Math.cos(u),c*Math.sin(u),s]};}
export function degreeTrig(degrees){const a=Math.abs(degrees);if(a>45&&a<=90){const d=(90-a)*PI/180;return{c:Math.sin(d),s:Math.sign(degrees)*Math.cos(d)};}const t=degrees*PI/180;return{c:Math.cos(t),s:Math.sin(t)};}
export function net(u,v,a,b,degrees){const{c,s}=degreeTrig(degrees);return{p:[a*u*c,b*v,a*u*s],u:[a*c,0,a*s],v:[0,b,0]};}
export function flux(a,b,degrees,c=1,shear=0,orientation=1,n=24){const A=integral((u,v)=>geometry(net(u,v,a,b,degrees)).N[2],[-1,1],[-1,1],n),B=integral((u,v)=>{const d=net(u,v,a,b,degrees);return d.p[0]**2*geometry(d).N[2];},[-1,1],[-1,1],n);return orientation*(c*A+shear*B);}
export function fluxExact(a,b,degrees,c=1,shear=0,orientation=1){const q=degreeTrig(degrees).c;return orientation*4*a*b*q*(c+shear*a*a*q*q/3);}
export function curved(kind,u,v,deformation=1){let p,d,uu,uv,vv;if(kind==='torus'){const R=1.2,r=deformation,c=Math.cos(v),s=Math.sin(v),a=R+r*c;p=torus(u,v,R,r);d=torusD(u,v,R,r);uu=[-a*Math.cos(u),-a*Math.sin(u),0];uv=[r*s*Math.sin(u),-r*s*Math.cos(u),0];vv=[-r*c*Math.cos(u),-r*c*Math.sin(u),-r*s];}else{const a=1,b=.8,c=deformation,sv=Math.sin(v),cv=latCos(v),su=Math.sin(u),cu=Math.cos(u);p=[a*cv*cu,b*cv*su,c*sv];d={u:[-a*cv*su,b*cv*cu,0],v:[-a*sv*cu,-b*sv*su,c*cv]};uu=[-a*cv*cu,-b*cv*su,0];uv=[a*sv*su,-b*sv*cu,0];vv=mul(p,-1);}const g=geometry(d);if(!g.n)return{p,...d,...g,K:null,density:0};const e=dot(g.n,uu),h=dot(g.n,uv),q=dot(g.n,vv),K=(e*q-h*h)/(g.E*g.G-g.F*g.F);return{p,...d,...g,K,density:K*g.J};}
export const curvatureDomain=kind=>kind==='torus'?[0,TAU]:[-PI/2,PI/2];
export const curvatureIntegral=(kind,d,n=32)=>integral((u,v)=>curved(kind,u,v,d).density,[0,TAU],curvatureDomain(kind),n);
export function topology(kind,n=24,m=16){return kind==='torus'?{V:n*m,E:3*n*m,F:2*n*m,chi:0}:{V:n*(m-1)+2,E:3*n*(m-1),F:2*n*(m-1),chi:2};}

export function fluxMaximum(a,b,c,shear){const B=shear*a*a/3,values=[0,Math.abs(c+B)];if(B>0&&c<0){const q=Math.sqrt(-c/(3*B));if(q<1)values.push(Math.abs(c*q+B*q*q*q));}return 4*a*b*Math.max(...values);}
