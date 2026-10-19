// Electrostatics audit: cm, nC (line charge nC/cm), V and V/cm.
import { KV, EPS0 } from './ch03.shared.js';
export { KV, EPS0 };
export function pointPotential(src,x,y){let z=0;for(const c of src)if(c.q)z+=KV*c.q/Math.hypot(x-c.x,y-c.y);return z;}
export function pointField(src,x,y){let ex=0,ey=0;for(const c of src)if(c.q){const dx=x-c.x,dy=y-c.y,r=Math.hypot(dx,dy),k=KV*c.q/r**3;ex+=k*dx;ey+=k*dy;}return[ex,ey];}
function linePotential(src,x,y){let z=0;for(const c of src)if(c.q)z-=2*KV*c.q*Math.log(Math.hypot(x-c.x,y-c.y));return z;}
function lineField(src,x,y){let ex=0,ey=0;for(const c of src)if(c.q){const dx=x-c.x,dy=y-c.y,k=2*KV*c.q/(dx*dx+dy*dy);ex+=k*dx;ey+=k*dy;}return[ex,ey];}
export function connectedSpheres(Q,R1,R2=8){const V=KV*Q/(R1+R2),Q1=Q*R1/(R1+R2);return{V,Q1,Q2:Q-Q1,E1:V/R1,E2:V/R2,field:R=>KV*Q/(R*(R+R2))};}
export function exteriorHandle(x,y,min,max=Infinity){const r=Math.hypot(x,y);if(!r)return[min,0];const t=Math.max(min,Math.min(max,r))/r;return[x*t,y*t];}
export function shellModel({a=1.6,b=2.5,inside=[.55,-.3],outside=[4.4,2.2],I=5,L=6,Q=0}={}){
 const [wx,wy]=inside,w2=wx*wx+wy*wy,[ex,ey]=outside,e2=ex*ex+ey*ey;
 if(!(w2<a*a&&e2>b*b))throw Error('line sources must lie strictly in their physical regions');
 const ext=[{x:ex,y:ey,q:L},{x:b*b*ex/e2,y:b*b*ey/e2,q:-L},{x:0,y:0,q:Q+I+L}],wall=linePotential(ext,b,0);
 // Disk Green function written without an inverted inside source: valid also w=0.
 const cavityPotential=(x,y)=>{if(!I)return 0;const d=Math.hypot(x-wx,y-wy),D=a**4-2*a*a*(x*wx+y*wy)+(x*x+y*y)*w2;return-2*KV*I*Math.log(a*d/Math.sqrt(D));};
 const cavityField=(x,y)=>{if(!I)return[0,0];const dx=x-wx,dy=y-wy,d2=dx*dx+dy*dy,D=a**4-2*a*a*(x*wx+y*wy)+(x*x+y*y)*w2,k=2*KV*I;return[k*(dx/d2+(a*a*wx-w2*x)/D),k*(dy/d2+(a*a*wy-w2*y)/D)];};
 const outerField=(x,y)=>lineField(ext,x,y),outerPotential=(x,y)=>linePotential(ext,x,y)-wall;
 return{a,b,I,L,Q,inside,outside,cavityField,cavityPotential,outerField,outerPotential,
  field(x,y){const r=Math.hypot(x,y);return r<a?cavityField(x,y):r>b?outerField(x,y):[0,0];},
  potential(x,y){const r=Math.hypot(x,y);return r<a?cavityPotential(x,y):r>b?outerPotential(x,y):0;},
  sigmaInner(t){const c=Math.cos(t),s=Math.sin(t),f=cavityField(a*c,a*s);return-EPS0*(c*f[0]+s*f[1]);},
  sigmaOuter(t){const c=Math.cos(t),s=Math.sin(t),f=outerField(b*c,b*s);return EPS0*(c*f[0]+s*f[1]);}
 };
}
export const planeShape=t=>(1+t*t)**-1.5;
export const planeFraction=t=>t*t/(Math.sqrt(1+t*t)*(1+Math.sqrt(1+t*t)));
export function sphereTrial(q,a,R=1.6,size=1,offset=0){
 if(!(a>R&&Math.abs(offset)<=.5))throw Error('invalid image trial');
 const qc=-q*R/a,bc=R*R/a,b=bc+offset*(R-bc),qi=qc*size;
 const at=c=>KV*(q/Math.sqrt(R*R+a*a-2*R*a*c)+qi/Math.sqrt(R*R+b*b-2*R*b*c));
 const cosines=[-1,1];
 // Boundary extrema: derivative q*a/d1^3 + qi*b/d2^3 = 0.
 if(q*a*qi*b<0){const k=(-qi*b/(q*a))**(2/3),den=2*R*(b-k*a),c=(R*R+b*b-k*(R*R+a*a))/den;if(Number.isFinite(c)&&c>-1&&c<1)cosines.push(c);}
 const values=cosines.map(at),max=Math.max(...values.map(Math.abs));
 return{q,a,R,qi,b,qc,bc,at,cosines,max};
}
