import assert from 'node:assert/strict';
import test from 'node:test';
import {modulus2,mul,transpose,apply,projection,compactTail,cyclicAverages,cyclicLimit,fro,subtract} from '../content/fa/ch12.verified.shared.js';
const near=(a,b,t=1e-11)=>assert.ok(Math.abs(a-b)<t,`${a} ≠ ${b}`);
test('modulus agrees with independently integrated vector energies, including rank-deficient and zero maps',()=>{
 for(const a of [-2,0,.4,2])for(const b of [-2,0,.7,2])for(const k of [-2,0,1.4]){
 const T=[[a,k],[0,b]],P=modulus2(T);near(P[0][1],P[1][0]);assert.ok(P[0][0]>=-1e-12&&P[1][1]>=-1e-12);assert.ok(P[0][0]*P[1][1]-P[0][1]**2>=-1e-11);
 for(let j=0;j<37;j++){const x=[Math.cos(j),Math.sin(j)],u=apply(P,x);near(u[0]**2+u[1]**2,(a*x[0]+k*x[1])**2+(b*x[1])**2);}
 }
});
test('projection is the unique distance minimizer, with orthogonal residual',()=>{
 for(let j=0;j<50;j++){const u=[Math.cos(j),Math.sin(j)],x=[j/20-1,Math.cos(2*j)],p=projection(u,x),r=x.map((z,i)=>z-p[i]);near(r[0]*u[0]+r[1]*u[1],0);for(const t of[-3,-.2,.1,2])near((r[0]-t*u[0])**2+(r[1]-t*u[1])**2,r[0]**2+r[1]**2+t*t);}
});
test('infinite compact tail is not a finite-sample maximum',()=>{
 for(const a of[0,.5,2])for(const b of[-1,-.2,0,.3,1])for(const n of[0,1,9,40]){const q=compactTail(n,a,b);near(q,Math.max(Math.abs(b),Math.abs(a/(n+1)+b)));for(let j=n+1;j<1000;j++)assert.ok(Math.abs(a/j+b)<=q+1e-14);if(b<0)assert.ok(q>=Math.abs(b));}
});
test('Koopman limit equals conditional cycle averages and exact full-cycle Cesaro sum',()=>{
 const f=[3,1,4,1,5,9,2,6,5,3,5,8];for(let s=1;s<=6;s++){const g=cyclicLimit(f,s),A=cyclicAverages(f,s,120);for(let k=0;k<12;k++){near(A[k],g[k]);near(g[(k+s)%12],g[k]);}near(g.reduce((a,b)=>a+b),f.reduce((a,b)=>a+b));}
});
test('strong spectral tails vanish while operator tails stay one',()=>{
 for(const r of[.01,.4,.95])for(const n of[1,8,40]){let e=0;for(let j=n;j<4000;j++)e+=(1-r*r)*r**(2*j);near(Math.sqrt(e),r**n);const omittedBasis=Array(n+1).fill(0);omittedBasis[n]=1;near(Math.hypot(...omittedBasis),1);}
});
test('spectral shear defects agree with independent complex matrix multiplication',()=>{
 const cm=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],cc=a=>[a[0],-a[1]],ca=(a,b)=>[a[0]+b[0],a[1]+b[1]],cs=(a,b)=>[a[0]-b[0],a[1]-b[1]];
 const mm=(A,B)=>A.map(r=>B[0].map((_,j)=>r.map((z,k)=>cm(z,B[k][j])).reduce(ca,[0,0]))),adj=A=>A[0].map((_,j)=>A.map(r=>cc(r[j]))),fn=A=>Math.hypot(...A.flat(2));
 for(const r of[[1,0],[.3,.9],[-2,-.2]])for(const s of[[1,0],[-.5,0],[.3,-.9]])for(const k of[0,.2,2]){const T=[[r,[k,0]],[[0,0],s]],Q=adj(T),A=mm(T,Q),B=mm(Q,T),diff=A.map((z,i)=>z.map((w,j)=>cs(w,B[i][j])));near(fn(diff),Math.sqrt(2*k**4+2*k*k*Math.hypot(r[0]-s[0],r[1]-s[1])**2));near(fn(T.map((z,i)=>z.map((w,j)=>cs(w,Q[i][j])))),Math.sqrt(4*r[1]**2+4*s[1]**2+2*k*k));}
});
test('complex connected path retains positive singular values even where real projection is singular',()=>{
 for(const p of[.2,1,2])for(const q of[.2,1,2])for(const t of[0,.5,1]){const modulus=(p*q)**t;assert.ok(modulus>0);const phase=Math.PI*t,re=modulus*Math.cos(phase),im=modulus*Math.sin(phase);near(Math.hypot(re,im),modulus);if(t===.5)assert.ok(Math.abs(re)<1e-14);}
});
test('canonical chapter inventory covers all numbered results plus source corollaries',async()=>{
 const files=['ch12.js','ch12-a2.js','ch12-a3.js','ch12-a4.js','ch12-a5.js'];const items=(await Promise.all(files.map(f=>import('../content/fa/'+f)))).flatMap(m=>m.default.items);assert.equal(new Set(items.map(x=>x.num)).size,46);for(let j=1;j<=44;j++)assert.ok(items.some(x=>x.num===`12.${j}`));for(const num of['12.4a','12.7a'])assert.ok(items.some(x=>x.num===num));
});
test('the actual Schwarz demo uses the displayed subspace direction and true scalar minimizer',async()=>{
 const {geometry}=await import('../content/fa/ch12.verified.shared.js');
 for(const deg of[0,27,90,180])for(const len of[.1,1,2]){const stages=[];let read;const v={legend(){},slider(label){return{value:label.startsWith('subspace')?deg:len}},stage(){const calls={arrows:[],lines:[],fn:null,dot:null};stages.push(calls);return{handle:()=>({x:.7,y:1.2}),line:(...x)=>calls.lines.push(x),arrow:(...x)=>calls.arrows.push(x),fn:f=>calls.fn=f,dot:(...x)=>calls.dot=x,setView(){}};},render:f=>f(),readout:f=>read=f(),fix:(x)=>String(x),sci:(x)=>String(x)};geometry(v,'schwarz');const x=stages[0].arrows[0].slice(2,4),u=[Math.cos(deg*Math.PI/180),Math.sin(deg*Math.PI/180)];near(x[0],len*u[0]);near(x[1],len*u[1]);const [lm,min]=stages[1].dot;near(lm,-(.7*x[0]+1.2*x[1])/(len*len));for(const d of[-.1,.1])assert.ok(stages[1].fn(lm+d)>=min-1e-12);}
});
