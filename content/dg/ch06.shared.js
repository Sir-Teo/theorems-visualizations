// DG6: outward normals on closed examples; S = -dN throughout.
import {eigSym2, matMul, transpose} from '../../assets/js/viz/math.js';
import {add,sub,mul,dot,cross,len,unit} from './ch04.shared.js';
export {add,sub,mul,dot,cross,len,unit};
export const TAU=2*Math.PI;
export const source='https://webapps.math.uci.edu/~ndonalds/math162a/surfaces.html';
export const scope='Smooth regular surfaces in Euclidean three-space. The shape operator is S=−dN and II(v,w)=⟨Sv,w⟩. Reversing N reverses S, principal curvatures and H, but preserves K. All pictures are dimensionless examples; screen projection does not preserve tangent angles.';
export function trigTurn(t){
  const q=Math.floor(4*t),a=TAU*(t-q/4),c=Math.cos(a),s=Math.sin(a);
  return [[c,s],[-s,c],[-c,-s],[s,-c]][((q%4)+4)%4];
}
export function principal(a,b,c){
  // Center and scale before calling the shared symmetric solver, so a tiny
  // anisotropy near a scalar matrix does not get mistaken for a diagonal one.
  const mid=a/2+c/2,d=a/2-c/2,scale=Math.max(Math.abs(d),Math.abs(b));
  if(scale===0)return{values:[mid,mid],vectors:[[1,0],[0,1]],split:0};
  const z=eigSym2([[d/scale,b/scale],[b/scale,-d/scale]]);
  return{values:z.values.map(x=>mid+scale*x),vectors:z.vectors,split:Math.hypot(d,b)};
}
export function forms(J,orientation=1){
  const {p,u,v,uu,uv,vv}=J,n=cross(u,v),area=len(n),N=mul(n,orientation/area);
  const E=dot(u,u),F=dot(u,v),G=dot(v,v),det=area*area;
  const e=dot(uu,N),f=dot(uv,N),g=dot(vv,N),I=[[E,F],[F,G]],II=[[e,f],[f,g]];
  const S=[[(G*e-F*f)/det,(G*f-F*g)/det],[(E*f-F*e)/det,(E*g-F*f)/det]];
  const rootE=Math.sqrt(E),height=area/rootE,C=[[1/rootE,-F/(E*height)],[0,1/height]];
  const B=matMul(transpose(C),matMul(II,C)),eigen=principal(B[0][0],(B[0][1]+B[1][0])/2,B[1][1]);
  const basis=[mul(u,1/rootE),mul(sub(v,mul(u,F/E)),1/height)];
  return{p,N,E,F,G,e,f,g,I,II,S,B,basis,eigen,area,K:(e*g-f*f)/det,H:(G*e+E*g-2*F*f)/(2*det),
    tangent:(a,b)=>add(mul(u,a),mul(v,b)),
    orth:(a,b)=>add(mul(basis[0],a),mul(basis[1],b))};
}
export function graphJet(u,v,{a=1,b=.3,c=-.6,shear=0,cubic=0}={}){
  const x=u+shear*v,y=v,fx=a*x+b*y+3*cubic*x*x,fy=b*x+c*y,A=a+6*cubic*x;
  return{p:[x,y,(a*x*x+2*b*x*y+c*y*y)/2+cubic*x*x*x],u:[1,0,fx],v:[shear,1,shear*fx+fy],uu:[0,0,A],uv:[0,0,shear*A+b],vv:[0,0,shear*shear*A+2*shear*b+c]};
}
export function sphereJet(u,v,R=1){
  const C=Math.cos(u),S=Math.sin(u),c=Math.cos(v),s=Math.sin(v);
  return{p:[R*c*C,R*c*S,R*s],u:[-R*c*S,R*c*C,0],v:[-R*s*C,-R*s*S,R*c],uu:[-R*c*C,-R*c*S,0],uv:[R*s*S,-R*s*C,0],vv:[-R*c*C,-R*c*S,-R*s]};
}
export function cylinderJet(u,v,R=1){
  const c=Math.cos(u),s=Math.sin(u);return{p:[R*c,R*s,v],u:[-R*s,R*c,0],v:[0,0,1],uu:[-R*c,-R*s,0],uv:[0,0,0],vv:[0,0,0]};
}
export function torusJet(u,v,R=1.8,r=.7){
  const C=Math.cos(u),S=Math.sin(u),c=Math.cos(v),s=Math.sin(v),q=R+r*c;
  return{p:[q*C,q*S,r*s],u:[-q*S,q*C,0],v:[-r*s*C,-r*s*S,r*c],uu:[-q*C,-q*S,0],uv:[r*s*S,-r*s*C,0],vv:[-r*c*C,-r*c*S,-r*s]};
}
export function torusData(turn,R=1.8,r=.7){
  const[c,s]=trigTurn(turn),q=R+r*c,meridian=-1/r,parallel=-c/q;
  return{c,s,q,meridian,parallel,K:c/(r*q),H:-(R+2*r*c)/(2*r*q)};
}
export function gaussArea(turn,h,R=1.8,r=.7){
  const {c}=torusData(turn,R,r),sinc=h===0?1:Math.sin(h)/h;
  return{signed:4*h*h*c*sinc,area:4*h*h*r*(R+r*c*sinc),ratio:c*sinc/(r*(R+r*c*sinc)),K:torusData(turn,R,r).K};
}
export function meusnier(R,angle){
  const c=Math.cos(angle),s=Math.sin(angle),radius=R*c,normal=[0,s,-c],p=[0,0,R],center=add(p,mul(normal,radius));
  return{radius,normal,center,p,kappa:1/radius,kn:-1/R,curve:t=>add(center,mul(sub([Math.sin(t),0,0],mul(normal,Math.cos(t))),radius))};
}
export function profile(kind,z){
  if(kind==='sphere'){const r=Math.sqrt(2.25-z*z);return{r,d:-z/r,dd:-2.25/(r*r*r)};}
  if(kind==='cone')return{r:1+.4*z,d:.4,dd:0};
  if(kind==='catenoid')return{r:Math.cosh(z),d:Math.sinh(z),dd:Math.cosh(z)};
  return{r:1,d:0,dd:0};
}
export function revolutionJet(theta,z,kind='catenoid'){
  const {r,d,dd}=profile(kind,z),c=Math.cos(theta),s=Math.sin(theta);
  return{p:[r*c,r*s,z],u:[-r*s,r*c,0],v:[d*c,d*s,1],uu:[-r*c,-r*s,0],uv:[-d*s,d*c,0],vv:[dd*c,dd*s,0]};
}
export function revolutionData(kind,z){const {r,d,dd}=profile(kind,z),w=Math.hypot(1,d),meridian=dd/(w*w*w),parallel=-1/(r*w);return{r,d,dd,meridian,parallel,K:meridian*parallel,H:(meridian+parallel)/2};}
export function classification(a,b){
  return{type:a===0&&b===0?'planar':a===0||b===0?'parabolic':Math.sign(a)===Math.sign(b)?'elliptic':'hyperbolic',umbilic:a===b,K:a*b,H:a/2+b/2};
}
export function ellipsoidPoint(theta,latitude,a=2,b=1.5,c=1){return[a*Math.cos(latitude)*Math.cos(theta),b*Math.cos(latitude)*Math.sin(theta),c*Math.sin(latitude)];}
export function ellipsoidData(p,a=2,b=1.5,c=1){
  const D=[1/(a*a),1/(b*b),1/(c*c)],q=p.map((x,i)=>x*D[i]),L=len(q),N=mul(q,1/L);
  const axis=Math.abs(N[0])<.8?[1,0,0]:[0,1,0],e1=unit(cross(N,axis)),e2=cross(N,e1),B=[e1,e2].map(v=>[e1,e2].map(w=>-v.reduce((s,x,i)=>s+x*D[i]*w[i],0)/L));
  const eigen=principal(B[0][0],B[0][1],B[1][1]);
  return{p,N,B,eigen,basis:[e1,e2],K:1/((a*b*c)**2*L**4),H:(B[0][0]+B[1][1])/2};
}
export function umbilics(a,b,c){
  if(!(a>b&&b>c&&c>0))throw new RangeError('Strictly triaxial positive axes required');
  const x=a*Math.sqrt((a*a-b*b)/(a*a-c*c)),z=c*Math.sqrt((b*b-c*c)/(a*a-c*c));
  return[-1,1].flatMap(s=>[-1,1].map(t=>[s*x,0,t*z]));
}
export function compactContact(a,b,c){return{p:[a,0,0],radius:a,curvatures:[a/(b*b),a/(c*c)],bound:1/a,K:(a/b/c)**2};}
export function spheroidData(turn,c){
  const [co,si]=trigTurn(turn),L=Math.hypot(si,c*co),meridian=-c/L**3,parallel=-c/L;
  return{p:[co,0,c*si],meridian,parallel,gap:c*(c-1)*(c+1)*co*co/L**3};
}
