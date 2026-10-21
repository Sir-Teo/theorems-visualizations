import { ylm, realY } from './ch07.shared.js';
const rx=a=>[[1,0,0],[0,Math.cos(a),-Math.sin(a)],[0,Math.sin(a),Math.cos(a)]];
const ry=a=>[[Math.cos(a),0,Math.sin(a)],[0,1,0],[-Math.sin(a),0,Math.cos(a)]];
const mm=(A,B)=>A.map(row=>[0,1,2].map(j=>row.reduce((s,x,k)=>s+x*B[k][j],0)));
const transpose=A=>A[0].map((_,j)=>A.map(row=>row[j]));
// Quaternion convention [scalar, x, y, z], acting actively on column vectors.
function qmul([a,x,y,z],[b,u,v,w]){return[a*b-x*u-y*v-z*w,a*u+b*x+y*w-z*v,a*v+b*y+z*u-x*w,a*w+b*z+x*v-y*u];}
export function rotationComparison(a,b){
 const RA=mm(ry(b),rx(a)),RB=mm(rx(a),ry(b)),Rc=mm(RA,transpose(RB));
 if(a===0||b===0)return{RA,RB,Rc,angle:0,axis:null,ratio:null};
 const qa=[Math.cos(a/2),Math.sin(a/2),0,0],qb=[Math.cos(b/2),0,Math.sin(b/2),0],A=qmul(qb,qa),B=qmul(qa,qb),q=qmul(A,[B[0],-B[1],-B[2],-B[3]]);
 if(q[0]<0)for(let i=0;i<4;i++)q[i]=-q[i];
 const n=Math.hypot(...q.slice(1)),angle=2*Math.atan2(n,q[0]);
 return{RA,RB,Rc,angle,axis:n?q.slice(1).map(x=>x/n):null,ratio:angle/Math.abs(a*b)};
}
export function gaussLegendre(n=12){
 const nodes=[];
 for(let i=0;i<n;i++){
  let x=Math.cos(Math.PI*(i+.75)/(n+.5)),derivative=0;
  for(let it=0;it<30;it++){
   let p=1,q=0;for(let k=1;k<=n;k++){const z=p;p=((2*k-1)*x*p-(k-1)*q)/k;q=z;}
   derivative=n*(x*p-q)/(x*x-1);const dx=p/derivative;x-=dx;if(Math.abs(dx)<2e-16)break;
  }
  nodes.push([x,2/((1-x*x)*derivative*derivative)]);
 }
 return nodes;
}
const QUAD=gaussLegendre(12);
export function angularInnerProduct(f,g){
 let re=0,im=0;const np=24;
 for(const[x,w]of QUAD)for(let k=0;k<np;k++){const phi=2*Math.PI*k/np,a=f(Math.acos(x),phi),b=g(Math.acos(x),phi),weight=w*2*Math.PI/np;re+=weight*(a[0]*b[0]+a[1]*b[1]);im+=weight*(a[1]*b[0]-a[0]*b[1]);}
 return[re,im];
}
export const HARMONIC_INDICES=Array.from({length:5},(_,l)=>Array.from({length:2*l+1},(_,i)=>[l,i-l])).flat();
export function harmonicCoefficients(l,m,real=false){
 const out=HARMONIC_INDICES.map(()=>[0,0]),index=m=>l*l+l+m;
 if(!real||m===0)out[index(m)]=[1,0];
 else{const a=Math.abs(m),sign=a%2?-1:1;if(m>0){out[index(a)]=[sign/Math.SQRT2,0];out[index(-a)]=[1/Math.SQRT2,0];}else{out[index(a)]=[0,-sign/Math.SQRT2];out[index(-a)]=[0,1/Math.SQRT2];}}
 return out;
}
export function harmonicAudit(l,m,real=false){
 const f=real?(t,p)=>[realY(l,m,t,p),0]:(t,p)=>ylm(l,m,t,p),coefficients=HARMONIC_INDICES.map(([j,k])=>angularInnerProduct(f,(t,p)=>ylm(j,k,t,p))),expected=harmonicCoefficients(l,m,real),norm=angularInnerProduct(f,f)[0];
 return{l,m,real,coefficients,expected,bars:coefficients.map(z=>Math.hypot(...z)),norm,power:coefficients.reduce((s,z)=>s+z[0]**2+z[1]**2,0),error:Math.max(...coefficients.map((z,i)=>Math.hypot(z[0]-expected[i][0],z[1]-expected[i][1]))),nodes:l-Math.abs(m)};
}
