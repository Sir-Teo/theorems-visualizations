// Explicit-only independent calculation audit: node tests/verification-robot-prereq-audit.mjs.
import assert from 'node:assert/strict';
const near=(x,y,t=1e-9)=>assert.ok(Math.abs(x-y)<=t*(1+Math.abs(y)),`${x} versus ${y}`),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),mv=(A,x)=>A.map(r=>dot(r,x)),tr=A=>A[0].map((_,i)=>A.map(r=>r[i])),mm=(A,B)=>A.map(r=>tr(B).map(c=>dot(r,c)));
const rot=t=>[[Math.cos(t),-Math.sin(t)],[Math.sin(t),Math.cos(t)]],det=([[a,b],[c,d]])=>a*d-b*c,inv=([[a,b],[c,d]])=>[[d,-b],[-c,a]].map(r=>r.map(x=>x/(a*d-b*c)));
const rigid=(t,p)=>{const R=rot(t);return[[...R[0],p[0]],[...R[1],p[1]],[0,0,1]];};
const adj=T=>[[1,0,0],[T[1][2],T[0][0],T[0][1]],[-T[0][2],T[1][0],T[1][1]]];
let composition=0,duality=0,chain=0,spectrum=0,implicit=0;
for(let k=1;k<=150;k++){
 const T=rigid(k*.31,[k/31,-k/71]),U=rigid(-k*.17,[-k/91,k/19]),point=[.5-k/57,.1+k/117,1];mv(mm(T,U),point).forEach((x,i)=>near(x,mv(T,mv(U,point))[i]));const A=adj(T),B=adj(U),AB=adj(mm(T,U));AB.forEach((r,i)=>r.forEach((x,j)=>near(x,mm(A,B)[i][j])));composition++;
 const F=[.2*k,-.1+k/17,1-k/71],V=[-.3+k/23,.2-k/43,k/131];near(dot(F,mv(A,V)),dot(mv(tr(A),F),V));duality++;
 const q=[k*.1,-k*.21],rates=[k/131,.1-k/57],l1=.3+k/67,l2=.2+k/97,a=q[0],b=q[0]+q[1],J=[[-l1*Math.sin(a)-l2*Math.sin(b),-l2*Math.sin(b)],[l1*Math.cos(a)+l2*Math.cos(b),l2*Math.cos(b)]],fk=([a,b])=>[l1*Math.cos(a)+l2*Math.cos(a+b),l1*Math.sin(a)+l2*Math.sin(a+b)],h=1e-6,p=fk(q.map((x,i)=>x+h*rates[i])),m=fk(q.map((x,i)=>x-h*rates[i]));p.forEach((x,i)=>near((x-m[i])/(2*h),mv(J,rates)[i],1e-7));near(det(J),l1*l2*Math.sin(q[1]));const f=[k/119,-.3+k/89];near(dot(f,mv(J,rates)),dot(mv(tr(J),f),rates));chain++;
 const th=.19*k,R=rot(th),lam1=.5+k/89,lam2=1+k/13,SPD=mm(mm(R,[[lam1,0],[0,lam2]]),tr(R)),Sinv=inv(SPD);near(det(SPD),lam1*lam2);for(let j=0;j<24;j++){const u=[Math.cos(j*.27),Math.sin(j*.27)],product=1/Math.sqrt(dot(u,mv(SPD,u))*dot(u,mv(Sinv,u)));assert.ok(product<=1+1e-12);}for(let j=0;j<2;j++){const u=[R[0][j],R[1][j]];near(1/Math.sqrt(dot(u,mv(SPD,u))*dot(u,mv(Sinv,u))),1);}spectrum++;
 const radius=1+k/111,y=radius*(.8*Math.sin(k)),x=Math.sqrt(radius*radius-y*y),dx=-y/x;near(x*x+y*y,radius*radius);near(2*x*dx+2*y,0);const yp=y+h,xp=Math.sqrt(radius*radius-yp*yp),ym=y-h,xm=Math.sqrt(radius*radius-ym*ym);near((xp-xm)/(2*h),dx,1e-7);implicit++;
}
// Singular differential constraints can have more infinitesimal than finite freedoms.
const singularPoint=[0,2],constraint=([x,y])=>x*x;assert.equal(constraint(singularPoint),0);assert.equal((constraint([1e-6,2])-constraint([-1e-6,2]))/(2e-6),0);assert.ok(constraint([.01,2])>0);
// Composition order and the transpose are substantive, not interchangeable conventions.
assert.notDeepEqual(mm(rigid(.8,[1,0]),rigid(.2,[0,1])),mm(rigid(.2,[0,1]),rigid(.8,[1,0])));
const A=[[1,2],[0,1]],f=[1,3],v=[2,-1];assert.notEqual(dot(f,mv(A,v)),dot(mv(A,f),v));
console.log(`PASS ${composition} rigid/frame compositions+adjoint homomorphisms; ${duality} wrench powers; ${chain} Jacobian-chain/determinant/virtual-work cases; ${spectrum} rotatedSPD families×24directions+2axes; ${implicit} regular implicit constraints; singular-rank and wrong-order/transpose counterexamples. No production helpers imported.`);
