// Explicit independent peer witnesses; no CIRC imports or frozen review flags.
import assert from'node:assert/strict';let count=0;const near=(x,y,t=2e-9)=>{assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=t*(1+Math.abs(y)),`${x} != ${y}`);count++;};const sum=a=>a.reduce((s,x)=>s+x,0),dot=(a,b)=>sum(a.map((x,i)=>x*b[i]));
// Exact integer row elimination: pivot cross-products and row gcd preserve rank over Q.
const gcd=(a,b)=>b?gcd(b,a%b):(a<0n?-a:a),rank=input=>{const a=input.map(r=>r.map(BigInt));let r=0;for(let c=0;c<(a[0]?.length||0)&&r<a.length;c++){let p=r;while(p<a.length&&a[p][c]===0n)p++;if(p===a.length)continue;[a[p],a[r]]=[a[r],a[p]];for(let i=r+1;i<a.length;i++)if(a[i][c]){const f=a[i][c],v=a[r][c];a[i]=a[i].map((x,j)=>v*x-f*a[r][j]);const d=a[i].reduce((g,x)=>gcd(g,x),0n);if(d)a[i]=a[i].map(x=>x/d);}r++;}return r;};
// Every four-node undirected graph, retaining self-loops, plus independent component count.
const edges=[];for(let i=0;i<4;i++)for(let j=i;j<4;j++)edges.push([i,j]);
for(let mask=0;mask<2**edges.length;mask++){const es=edges.filter((_,i)=>mask>>i&1),A=Array.from({length:4},()=>Array(es.length).fill(0)),parent=[0,1,2,3],find=i=>parent[i]===i?i:find(parent[i]);es.forEach(([i,j],e)=>{A[i][e]++;A[j][e]--;parent[find(i)]=find(j);});const c=new Set(parent.map((_,i)=>find(i))).size;assert.equal(rank(A),4-c);count++;assert.equal(es.length-rank(A),es.length-4+c);count++;}
// Equation count counterexample: unequal parallel ideal voltage sources, and equal-source freedom.
const M=[[1,-1,0,0],[0,0,1,1],[1,0,0,0],[0,1,0,0]];assert.equal(rank(M),3);assert.equal(rank(M.map((r,i)=>[...r,[0,0,1,2][i]])),4);assert.equal(rank(M.map((r,i)=>[...r,[0,0,1,1][i]])),3);count+=3;
// Grounded resistor triangle: positive energy, eigenvalues, inverse, superposition and reciprocity.
for(const a of [1,2,5])for(const b of [1,3])for(const c of [2,4]){const G=[[a+b,-a],[-a,a+c]],det=a*b+a*c+b*c,inv=[[G[1][1]/det,a/det],[a/det,G[0][0]/det]],mv=(M,x)=>M.map(r=>dot(r,x)),tr=G[0][0]+G[1][1],disc=Math.hypot(G[0][0]-G[1][1],2*a);assert.ok((tr-disc)/2>0);count++;for(const x of [[1,2],[-2,.3],[.1,-.7]]){const y=mv(G,x);near(dot(x,y),a*(x[0]-x[1])**2+b*x[0]**2+c*x[1]**2);const rec=mv(inv,y);rec.forEach((z,i)=>near(z,x[i]));}const s=[.3,2],t=[-1,.4],u=mv(inv,s),v=mv(inv,t),w=mv(inv,s.map((x,i)=>x+t[i]));w.forEach((x,i)=>near(x,u[i]+v[i]));near(dot(t,u),dot(s,v));}
// Rectangular incidence composition and orientation changes; Euclidean adjoint is transpose.
const A=[[1,0,-1,1],[-1,1,0,0],[0,-1,1,-1]],phi=[2,.3,-1],curr=[.4,.4,.4,0],drop=A[0].map((_,e)=>sum(A.map((r,i)=>r[e]*phi[i]))),Ai=A.map(r=>dot(r,curr));assert.equal(rank(A),2);assert.equal(4-rank(A),2);count+=2;near(dot(phi,Ai),dot(drop,curr));near(dot(drop,curr),0);
for(const conductance of [[1,2,3,4],[.1,5,2,.3]])for(let flip=0;flip<4;flip++){const AF=A.map(r=>r.map((x,e)=>e===flip?-x:x)),L=A.map((r,i)=>A.map((s,j)=>sum(r.map((x,e)=>x*conductance[e]*s[e])))),LF=AF.map(r=>AF.map(s=>sum(r.map((x,e)=>x*conductance[e]*s[e]))));L.forEach((r,i)=>r.forEach((x,j)=>near(x,LF[i][j])));near(dot(phi,L.map(r=>dot(r,phi))),sum(drop.map((v,e)=>conductance[e]*v*v)));}
// Weighted Pythagoras for a true resistive flow plus a feasible cycle.
const R=[2,3,4],v=[1.5,.5,-2],i=v.map((x,j)=>x/R[j]),power=x=>sum(x.map((z,j)=>R[j]*z*z));for(let h=-10;h<=10;h++){near(dot(v,[h,h,h]),0);near(power(i.map(x=>x+h))-power(i),sum(R)*h*h);}
// A passive series resistor has an ABCD and rank-one y form, but no z form.
for(let R=1;R<=50;R++){const Y=[[1,-1],[-1,1]];assert.equal(rank(Y),1);count++;for(const I of [-2,.3,1])for(const common of [-4,0,7]){const V1=common+R*I,V2=common,I2=-I;near((V1-V2)/R,I);near((V2-V1)/R,I2);near(V1,V2+R*(-I2));}}
// Noncommuting series/shunt transmission matrices multiply in physical cascade order.
for(const R of [.2,1,3])for(const G of [.1,.7,2]){const q=[2,.3],middle=[q[0],G*q[0]+q[1]],left=[middle[0]+R*middle[1],middle[1]];near(left[0],(1+R*G)*q[0]+R*q[1]);near(left[1],G*q[0]+q[1]);assert.notEqual(1+R*G,1);count++;}
// Diode exact inverse domain, forward decade approximation, bounded reverse current.
for(const Is of [1e-12,1e-8])for(const t of [.026,.052])for(const m of [-.99,-.2,0,1,10,1e6]){const current=Is*m,voltage=t*Math.log1p(m);near(Is*Math.expm1(voltage/t)/Is,m,1e-8);}for(const m of [10,100,1000])near(Math.log((1+10*m)/(1+m))-Math.log(10),Math.log((1+1/(10*m))/(1+1/m)));near(Math.expm1(-100),-1);
const bisect=(F,a,b)=>{assert.ok(F(a)<0&&F(b)>0);count++;for(let j=0;j<150;j++){const m=(a+b)/2;if(F(m)<0)a=m;else b=m;}return(a+b)/2;};
for(const V of [-3,0,5])for(const R of [.1,10,1000]){const F=x=>1e-9*Math.expm1(x/.026)+(x-V)/R,root=bisect(F,-100,6);near(F(root),0,1e-6);assert.ok(F(root-.001)<F(root+.001));count++;}
// Domain/sign limitations and continuous non-smooth monotone device.
for(const x of [-2,-.5,0,1,3])near(x+(x-0)/(-1),0);for(const x of [0,.2,.8,1]){assert.ok(x+(x-10)<0);count++;}for(const V of [-2,2]){const F=x=>Math.max(0,x)+x-V,root=bisect(F,-5,5);near(root,V<0?V:V/2);}
// Exact off-interval RC equation; the ripple replacement is a first-order approximation.
for(const R of [1,10])for(const C of [.01,.3,2])for(const V of [.5,5])for(const t of [0,.001,.1,1]){const x=V*Math.exp(-t/(R*C));near(C*(-x/(R*C))+x/R,0);const a=t/(R*C),drop=V*(1-Math.exp(-a));assert.ok(drop<=V*a+1e-12);count++;}
// Implicit smooth transfer: slope from nonzero output derivative; singular control excluded.
for(const vi of [-1,-.2,0,.4,1]){const solve=u=>bisect(x=>x+x**3+2*u-1,-3,3),vo=solve(vi),h=1e-5;near((solve(vi+h)-solve(vi-h))/(2*h),-2/(1+3*vo*vo));}near(3*0**2,0);near(Math.cbrt(1e-9)/1e-9,1e6);assert.ok(Math.cbrt(1e-9)/1e-9>Math.cbrt(1e-6)/1e-6);count++;
// Total derivative on a saturation branch, including drain output conductance.
for(const vg of [1.2,1.4,1.6])for(const RD of [500,2000]){const k=.002,VT=1,lambda=.02,VDD=5,solve=x=>{const a=k*(x-VT)**2/2;return(VDD-RD*a)/(1+RD*a*lambda);},vo=solve(vg),gm=k*(vg-VT)*(1+lambda*vo),go=lambda*k*(vg-VT)**2/2,h=1e-6;assert.ok(vo>vg-VT);count++;near((solve(vg+h)-solve(vg-h))/(2*h),-gm/(1/RD+go));}
// All finite Boolean functions through arity three via a separately evaluated NAND DNF construction.
const N=(a,b)=>!(a&&b),not=a=>N(a,a),and=(a,b)=>not(N(a,b)),or=(a,b)=>N(not(a),not(b));for(let arity=1;arity<=3;arity++)for(let f=0;f<2**(2**arity);f++)for(let row=0;row<2**arity;row++){let result=false;for(let term=0;term<2**arity;term++)if(f>>term&1){let value=true;for(let j=0;j<arity;j++){const x=!!(row>>j&1);value=and(value,term>>j&1?x:not(x));}result=or(result,value);}assert.equal(result,!!(f>>row&1));count++;}
// Latch modes and nonhyperbolic boundary; direct critical quadratic Lyapunov decrease.
for(const g of [.2,.7,1,1.2,2]){near((-1+g)+(-1-g),-2);near((-1+g)*(-1-g),1-g*g);if(g===1)near(-1+g,0);}
for(const x of [-1,-.3,-.02,0,.02,.3,1])for(const y of [-1,-.3,-.02,0,.02,.3,1])if(x||y){const Vdot=-x*x-y*y-x*Math.tanh(y)-y*Math.tanh(x);assert.ok(Vdot<0);count++;}
console.log(`PASS ${count} independent CIRC peer assertions, including exact integer ranks and statement counterexamples`);
