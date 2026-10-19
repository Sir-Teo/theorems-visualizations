// Scoped interface checks; original chapter helpers remain available to other entries.
import {fresnel as legacyFresnel, cdiv, cabs2, refractVec} from './ch04.shared.js';
export function fresnel(n1,n2,th) {
  if(!(n1>0&&n2>0&&th>=0&&th<=Math.PI/2)) throw new RangeError('positive indices and incidence in [0,pi/2] required');
  // At equal indices there is no interface, including the grazing limiting value.
  if(n1===n2)return{rs:[0,0],rp:[0,0],ts:[1,0],tp:[1,0],Rs:0,Rp:0,Ts:1,Tp:1,tir:false,cosT:[Math.cos(th),0],sinT:Math.sin(th)};
  return legacyFresnel(n1,n2,th);
}
export function tangentContact(cx,r,px,side) {
  const d=px-cx;if(!(d>0)||r>d)return null;
  const x=cx+r*r/d,y=side*r*Math.sqrt(Math.max(0,1-(r/d)**2));return[x,y];
}
const sinhOver=(kap,d)=>kap===0?d:Math.sinh(kap*d)/kap;
export function gapSolution(n1,th,d) {
  if(!(n1>1&&d>=0&&th>=Math.asin(1/n1)-1e-14&&th<Math.PI/2))throw new RangeError('symmetric prism/air/prism gap at or beyond critical incidence required');
  const k0=2*Math.PI,kz=k0*n1*Math.cos(th),kap=k0*Math.sqrt(Math.abs(n1*n1*Math.sin(th)**2-1)<1e-14?0:Math.max(0,n1*n1*Math.sin(th)**2-1)),kx=k0*n1*Math.sin(th),sh=sinhOver(kap,d),ch=Math.cosh(kap*d);
  const t=cdiv([1,0],[ch,-(kz*kz-kap*kap)*sh/(2*kz)]),E0=[t[0]*ch+t[1]*kz*sh,t[1]*ch-t[0]*kz*sh],r=[E0[0]-1,E0[1]],T=cabs2(t),R=cabs2(r);
  return{n1,th,d,kz,kap,kx,t,r,T,R,c:kap===0?Infinity:(kz*kz+kap*kap)/(2*kz*kap)};
}
export function gapField(s,z) {
  const mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],exp=x=>[Math.cos(x),Math.sin(x)];
  if(z<0){const a=exp(s.kz*z),b=mul(s.r,exp(-s.kz*z));return[a[0]+b[0],a[1]+b[1]];}
  if(z>s.d)return mul(s.t,exp(s.kz*(z-s.d)));
  return mul(s.t,[Math.cosh(s.kap*(s.d-z)),-s.kz*sinhOver(s.kap,s.d-z)]);
}
export function prismDeviation(A,i,n){const r=Math.asin(Math.sin(i)/n),e=n*Math.sin(A-r);return Math.abs(e)<=1?i+Math.asin(e)-A:NaN;}
export function prismTrace(A,i,n){
  const h=2.6,w=h*Math.tan(A/2),entry=[-w/2,h/2],left=[-Math.cos(A/2),Math.sin(A/2)],right=[Math.cos(A/2),Math.sin(A/2)],ang=i-A/2,d0=[Math.cos(ang),Math.sin(ang)],d1=refractVec(d0,left,1/n);
  const candidates=[];for(const [face,N,P]of[['opposite',right,[0,h]],['base',[0,-1],[0,0]]]){const den=N[0]*d1[0]+N[1]*d1[1];if(den<=0)continue;const u=(N[0]*(P[0]-entry[0])+N[1]*(P[1]-entry[1]))/den,Q=[entry[0]+u*d1[0],entry[1]+u*d1[1]];if(u>1e-10&&Q[1]>=-1e-10&&Q[1]<=h+1e-10&&Math.abs(Q[0])<=w+1e-10)candidates.push({face,N,Q,u});}
  candidates.sort((a,b)=>a.u-b.u);const hit=candidates[0];if(!hit)throw Error('ray did not reach a prism face');
  const out=refractVec(d1,hit.N.map(x=>-x),n),pts=[[entry[0]-3*d0[0],entry[1]-3*d0[1]],entry,hit.Q];if(out)pts.push([hit.Q[0]+3*out[0],hit.Q[1]+3*out[1]]);
  return{pts,face:hit.face,tir:!out,d0,d1,out,h,w};
}
export function fibreModel(n1,n2,L,coneDegrees,c=299792458){
  if(!(n1>0&&n2>0&&L>=0&&coneDegrees>=0&&coneDegrees<=90))throw new RangeError('positive indices, nonnegative length and cone in [0,90] required');
  const guided=n1>n2,NA=guided?Math.sqrt(n1*n1-n2*n2):null,accept=guided?Math.asin(Math.min(1,NA)):0,amax=guided?Math.acos(n2/n1):null,cone=coneDegrees*Math.PI/180,limit=Math.min(cone,accept),t0=L*1000*n1/c*1e9;
  const delay=th=>t0*(1/Math.sqrt(1-(Math.sin(th)/n1)**2)-1),fraction=guided?(cone===0?1:limit/cone):0;
  return{guided,NA,accept,amax,cone,limit,t0,delay,fraction,tmax:guided?t0*(n1/n2-1):null,airMax:guided?delay(accept):null,coneMax:guided?delay(limit):null,n1};
}
export function fibrePulse(x,sigma,m){
  if(!(sigma>0))throw new RangeError('positive pulse width required');if(!m.guided)return 0;
  const g=th=>Math.exp(-.5*((x-m.delay(th))/sigma)**2);
  if(m.cone===0||m.t0===0)return Math.exp(-.5*(x/sigma)**2)*m.fraction;
  // Integrate only the angle interval whose delays are within eight Gaussian widths.
  const inv=d=>d<=0?0:Math.asin(Math.min(1,m.n1*Math.sqrt(Math.max(0,1-(1+d/m.t0)**-2))));
  const a=Math.min(m.limit,inv(x-8*sigma)),b=Math.min(m.limit,inv(x+8*sigma));if(!(b>a))return 0;
  const N=80,h=(b-a)/N;let sum=g(a)+g(b);for(let j=1;j<N;j++)sum+=(j%2?4:2)*g(a+j*h);return sum*h/(3*m.cone);
}
