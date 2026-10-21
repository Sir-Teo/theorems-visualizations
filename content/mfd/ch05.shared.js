// Chapter-local exact low-dimensional Lie-group models; all numbers binary64.
export const SOURCE='https://live.ocw.mit.edu/courses/18-755-lie-groups-and-lie-algebras-ii-spring-2024/mit18_755_s24_lec_full.pdf';
export const CLOSED='https://people.maths.ox.ac.uk/ritter/lie-groups/L08-Closed-subgroups.pdf';
export const ACTION='https://www.math.toronto.edu/mein/teaching/LectureNotes/action.pdf';
export const TAU=2*Math.PI,mod=(x,n=1)=>((x%n)+n)%n;
export const add=(a,b)=>a.map((x,i)=>x+b[i]),scale=(a,t)=>a.map(x=>t*x),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>Math.hypot(...a),unit=a=>scale(a,1/norm(a)),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const I2=[1,0,0,1],I3=[1,0,0,0,1,0,0,0,1];
export const mul=(A,B,n=2)=>Array.from({length:n*n},(_,k)=>{const i=Math.floor(k/n),j=k%n;let s=0;for(let l=0;l<n;l++)s+=A[i*n+l]*B[l*n+j];return s;});
export const mv=(A,x,n=x.length)=>Array.from({length:n},(_,i)=>dot(A.slice(i*n,(i+1)*n),x));
export const transpose=(A,n=2)=>Array.from({length:n*n},(_,k)=>A[(k%n)*n+Math.floor(k/n)]);
export const det2=A=>A[0]*A[3]-A[1]*A[2],inv2=A=>scale([A[3],-A[1],-A[2],A[0]],1/det2(A));
export const residual=(A,B)=>norm(A.map((x,i)=>x-B[i])),comm=(A,B,n=2)=>add(mul(A,B,n),scale(mul(B,A,n),-1));
export const rotation=t=>[Math.cos(t),-Math.sin(t),Math.sin(t),Math.cos(t)];
export const sl2=(theta,s,u)=>mul(mul(rotation(theta),[Math.exp(s),0,0,Math.exp(-s)]),[1,u,0,1]);
export const H=[1,0,0,-1],E=[0,1,0,0],F=[0,0,1,0];
export const fromCoef=([h,e,f])=>[h,e,f,-h],coef=A=>[(A[0]-A[3])/2,A[1],A[2]];
/** Closed traceless2x2 formula using A²=−det(A)I, with rounding-negligible small-argument series. No logarithm used. */
export function exp2(A){const d=A[0]*A[0]+A[1]*A[2];let c,s;if(Math.abs(d)<1e-12){c=1+d/2+d*d/24;s=1+d/6+d*d/120;}else if(d>0){const r=Math.sqrt(d);c=Math.cosh(r);s=Math.sinh(r)/r;}else{const r=Math.sqrt(-d);c=Math.cos(r);s=Math.sin(r)/r;}return add(scale(I2,c),scale(A,s));}
export function bch(t,commuting=false){const A=E,B=commuting?scale(E,2):F,K=comm(A,B),product=mul(exp2(scale(A,t)),exp2(scale(B,t))),first=exp2(scale(add(A,B),t)),second=exp2(add(scale(add(A,B),t),scale(K,t*t/2)));return{A,B,K,product,first,second,e1:residual(product,first),e2:residual(product,second)};}
export const heisenberg=([x,y,z])=>[1,x,z,0,1,y,0,0,1];
export const hmul=(p,q)=>[p[0]+q[0],p[1]+q[1],p[2]+q[2]+p[0]*q[1]];
export const hinv=p=>[-p[0],-p[1],p[0]*p[1]-p[2]];
export const affineMul=(p,q)=>[p[0]+q[0],p[1]+Math.exp(p[0])*q[1]];
export const affineInv=p=>[-p[0],-p[1]*Math.exp(-p[0])];
export const leftField=(u,a,b)=>[a,Math.exp(u)*b];
export const affineMatrix=p=>[Math.exp(p[0]),p[1],0,1];
export function qmul(p,q){return[p[0]*q[0]-dot(p.slice(1),q.slice(1)),...add(add(scale(q.slice(1),p[0]),scale(p.slice(1),q[0])),cross(p.slice(1),q.slice(1)))];}
export const qinv=q=>[q[0],-q[1],-q[2],-q[3]];
export const axisQ=(axis,t)=>[Math.cos(t/2),...scale(unit(axis),Math.sin(t/2))];
export function qmatrix(q){const[w,x,y,z]=q;return[1-2*(y*y+z*z),2*(x*y-w*z),2*(x*z+w*y),2*(x*y+w*z),1-2*(x*x+z*z),2*(y*z-w*x),2*(x*z-w*y),2*(y*z+w*x),1-2*(x*x+y*y)];}
export const qrotate=(q,v)=>qmul(qmul(q,[0,...v]),qinv(q)).slice(1);
/** Real4x4 representation of SU2 on(Re z1,Im z1,Re z2,Im z2). */
export const su2=q=>{const[a,b,c,d]=q;return[a,-b,c,-d,b,a,d,c,-c,-d,a,b,d,-c,-b,a];};
export const hat=([x,y,z])=>[0,-z,y,z,0,-x,-y,x,0];
export const unhat=A=>[(A[7]-A[5])/2,(A[2]-A[6])/2,(A[3]-A[1])/2];
export const euler=(a,b,c)=>mul(mul(qmatrix(axisQ([0,0,1],a)),qmatrix(axisQ([0,1,0],b)),3),qmatrix(axisQ([1,0,0],c)),3);
export const spherical=(azimuth,polar)=>[Math.sin(polar)*Math.cos(azimuth),Math.sin(polar)*Math.sin(azimuth),Math.cos(polar)];
export const project=([x,y,z])=>[x+.35*y,z+.2*y]; // explicit fixed oblique projection
export const torus=(t,alpha)=>[mod(t),mod(alpha*t)];
export const torusEmbed=([x,y])=>[Math.cos(TAU*x),Math.sin(TAU*x),Math.cos(TAU*y),Math.sin(TAU*y)];
export function winding(alpha,T,n=1200){let prev=null;const out=[];for(let i=0;i<=n;i++){const p=torus(i*T/n,alpha);if(prev&&(Math.abs(p[0]-prev[0])>.5||Math.abs(p[1]-prev[1])>.5))out.push(null);out.push(p);prev=p;}return out;}
export const slopes={half:{alpha:.5,p:1,q:2,label:'1/2'},threehalf:{alpha:1.5,p:3,q:2,label:'3/2'},irr:{alpha:Math.SQRT2,p:null,q:null,label:'sqrt(2)'}};
export const AXES={x:[1,0,0],z:[0,0,1],diagonal:[1,1,1]};
export function pell(n){if(!Number.isInteger(n)||n<0||n>20)throw new RangeError('Pell index0–20 required');let p=1n,q=1n;for(let i=0;i<n;i++)[p,q]=[p+2n*q,p+q];const certificate=p*p-2n*q*q;return{p:Number(p),q:Number(q),certificate:String(certificate),error:-Number(certificate)/(Math.SQRT2*Number(q)+Number(p))};}
export const finiteTriple=q=>Array.isArray(q)&&q.length===3&&[0,1,2].every(i=>Object.hasOwn(q,i)&&Number.isFinite(q[i]));
export const fmt=(a,n=3)=>a.map(x=>x.toFixed(n)).join(', '),sci=x=>x.toExponential(3).replace('e-','e−');
export const lin=(a,b,n)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
export const planeStage=(v,title,lim=1.5)=>v.stage({title,x:[-lim,lim],y:[-lim,lim],equal:true,axes:'box',gutter:true,height:330,xlabel:'x',ylabel:'y'});
export function fit(s,points,min=1){const L=Math.max(min,...points.filter(Boolean).flat().map(Math.abs))*1.25;s.setView([-L,L],[-L,L]);}
export function transformed(s,A,color='accent'){s.path(lin(0,TAU,161).map(t=>mv(A,[Math.cos(t),Math.sin(t)])),{color,width:2});for(const p of[[1,0],[0,1]]){const q=mv(A,p);s.arrow(0,0,...q,{color,width:1.5});}}
export function frame(s,R,color='accent',origin=[0,0,0],length=1){for(const e of[[1,0,0],[0,1,0],[0,0,1]]){const a=project(origin),b=project(add(origin,scale(mv(R,e),length)));s.arrow(...a,...b,{color,width:2});} }
export function sphere(s){for(let j=0;j<7;j++){const t=j*Math.PI/6;s.path(lin(0,TAU,81).map(p=>project([Math.cos(p)*Math.sin(t),Math.sin(p)*Math.sin(t),Math.cos(t)])),{color:'muted',alpha:.35,width:1});}for(let j=0;j<8;j++){const p=j*Math.PI/4;s.path(lin(0,Math.PI,65).map(t=>project(spherical(p,t))),{color:'muted',alpha:.35,width:1});}}
export const note=String.raw`Finite pictures use explicit matrix or coordinate formulas in binary64; residuals check the chosen examples, not the full theorem. Fixed 3D projections are labelled and are not injective.`;
