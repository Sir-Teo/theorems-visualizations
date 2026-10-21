// Aerofoil models. Clockwise circulation is positive; U=1 and map scale a=1.
import {joukBody,TAU,cadd,cpolar,cabs} from './ch04.shared.js';
export {TAU};
export const rad=a=>a*Math.PI/180;
export function foil(d=.12,h=0,alpha=0,factor=1){
 const center=[-d,h],R=Math.hypot(1+d,h),edge=Math.atan2(-h,1+d),Gk=4*Math.PI*R*Math.sin(alpha-edge),G=factor*Gk;
 const P=joukBody({zeta0:center,R,c:1,U:1,alpha,G});
 P.edge=edge;P.Gk=Gk;P.point=t=>cadd(center,cpolar(R,t));
 P.boundary=Array.from({length:481},(_,j)=>P.zOf(P.point(edge+TAU*j/480)));
 P.xmin=Math.min(...P.boundary.map(p=>p[0]));P.xmax=Math.max(...P.boundary.map(p=>p[0]));P.chord=P.xmax-P.xmin;
 P.surface=(t)=>{const zt=P.point(t),z=P.zOf(zt),q=P.vel(zt);return{z,q,cp:1-cabs(q)**2};};
 P.cl=2*G/P.chord;
 return P;
}
export function pressure(P,n=2048){
 let fx=0,fy=0;const dt=TAU/n;
 for(let j=0;j<n;j++){
 const t=P.edge+(j+.5)*dt,mid=P.surface(t),a=P.zOf(P.point(t-dt/2)),b=P.zOf(P.point(t+dt/2));
 fx-=mid.cp*(b[1]-a[1])/P.chord;fy+=mid.cp*(b[0]-a[0])/P.chord;
 }
 return{cl:-fx*Math.sin(P.alpha)+fy*Math.cos(P.alpha),cd:fx*Math.cos(P.alpha)+fy*Math.sin(P.alpha)};
}
export function rk4(f,p,dt){
 const k1=f(...p);if(!k1)return null;const k2=f(p[0]+dt*k1[0]/2,p[1]+dt*k1[1]/2);if(!k2)return null;const k3=f(p[0]+dt*k2[0]/2,p[1]+dt*k2[1]/2);if(!k3)return null;const k4=f(p[0]+dt*k3[0],p[1]+dt*k3[1]);if(!k4)return null;
 return p.map((x,j)=>x+dt*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6);
}
export function transit(P,y,dt=.004){
 const path=[[-3.5,y]],times=[0];let t=0,arrival=null;
 while(t<12){const p=path.at(-1),q=rk4(P.at,p,dt);if(!q||!q.every(Number.isFinite))break;t+=dt;path.push(q);times.push(t);if(q[0]>=2.8){const f=(2.8-p[0])/(q[0]-p[0]);arrival=t-dt+f*dt;break;}}
 return{path,times,arrival};
}
export function sampleTransit(T,t){const i=Math.min(T.path.length-1,Math.max(0,Math.floor(t/(T.times[1]||1))));return T.path[i];}
export function thin(alpha,m,r,n=2048){
 const A0=alpha-r/4,A1=4*m,A2=.75*r,gamma=t=>2*(A0/Math.tan(t/2)+A1*Math.sin(t)+A2*Math.sin(2*t));
 let lift=0,moment=0;
 for(let j=0;j<n;j++){const t=Math.PI*(j+.5)/n,x=(1-Math.cos(t))/2,dx=Math.sin(t)*Math.PI/(2*n),g=gamma(t);lift+=2*g*dx;moment-=2*(x-.25)*g*dx;}
 return{A0,A1,A2,gamma,cl:2*Math.PI*(A0+A1/2),cm:Math.PI*(A2-A1)/4,lift,moment,camber:x=>4*m*x*(1-x)+r*x*(1-x)*(1-2*x)};
}
// A prescribed circulation budget, not an unsteady Navier–Stokes solver.
export function shed(t,T,G=1,n=80){const bound=G*(1-Math.exp(-t/T)),wake=[];let prev=0;for(let j=0;j<n;j++){const b=t*(j+1)/n,g=G*(1-Math.exp(-b/T));wake.push({x:2+(t-b),g:-(g-prev)});prev=g;}return{bound,wake,sum:bound+wake.reduce((s,p)=>s+p.g,0)};}
export function lifting(AR,CL,b3){const A1=CL/(Math.PI*AR),A3=b3*A1;return{A1,A3,e:1/(1+3*b3*b3),cdi:Math.PI*AR*(A1*A1+3*A3*A3),gamma:t=>2*AR*(A1*Math.sin(t)+A3*Math.sin(3*t)),down:t=>A1+3*A3*Math.sin(3*t)/Math.sin(t)};}
