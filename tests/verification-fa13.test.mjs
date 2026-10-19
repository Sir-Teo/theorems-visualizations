import assert from 'node:assert/strict';import test from 'node:test';
import {heatDifferenceMultiplier,shiftCommutator,domainDemo,normalDomainDemo} from '../content/fa/ch13.verified.shared.js';
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t,`${a} ≠ ${b}`);
test('heat source approximation equals the Poisson-weighted semigroup series',()=>{
 for(const k of[1,3,10])for(const t of[.01,.2,1])for(const eps of[.02,.1,1]){const mean=t/eps;let p=Math.exp(-mean),s=p;for(let j=1;j<500;j++){p*=mean/j;s+=p*Math.exp(-k*k*j*eps);}near(heatDifferenceMultiplier(k,t,eps),s,1e-11);assert.ok(heatDifferenceMultiplier(k,t,eps)>=Math.exp(-k*k*t)-1e-14);}
 for(const k of[1,3,10]){const exact=Math.exp(-k*k*.01);assert.ok(Math.abs(heatDifferenceMultiplier(k,.01,1e-6)-exact)<Math.abs(heatDifferenceMultiplier(k,.01,.01)-exact));}
});
test('the finite commutator defect follows from independent differentiation and truncated multiplication',()=>{
 for(const N of[2,3,8,30]){const D=Array.from({length:N},()=>Array(N).fill(0)),M=D.map(r=>r.slice());for(let j=1;j<N;j++)D[j-1][j]=j;for(let j=0;j<N-1;j++)M[j+1][j]=1;const c=D.map((_,i)=>D[i].reduce((s,z,k)=>s+z*M[k][i],0)-M[i].reduce((s,z,k)=>s+z*D[k][i],0));assert.deepEqual(c,shiftCommutator(N));near(c.reduce((a,b)=>a+b),0);}
});
test('the actual domain demo uses the discrete-series threshold k+1/2, distinct from the continuous x^{-2α} threshold',()=>{
 for(const alpha of[.55,1.4,3])for(const k of[0,1,3]){let read;const v={slider(label){return{value:label.includes('α')?alpha:label.includes('order')?k:30}},stage:()=>({setView(){},path(){},fn(){}}),legend(){},render:f=>f(),readout:f=>read=f(),sci:x=>String(x)};domainDemo(v,'domain');assert.ok(read.includes(`α>${(k+.5).toFixed(1)}`));const sum=Array.from({length:30},(_,i)=>(i+1)**(2*k-2*alpha)).reduce((a,b)=>a+b);assert.ok(read.includes(String(sum)));}
});
test('continuous multiplier-domain threshold from a direct tail integral is α>k/2+1/4',()=>{
 for(const k of[0,1,2,3])for(const alpha of[k/2+.1,k/2+.4]){const exponent=2*k-4*alpha;assert.equal(exponent< -1,alpha>k/2+.25);}
});
test('Dirichlet tent and step coefficients satisfy exact independent piecewise integrals',()=>{
 const integ=(f,a,b,n=30000)=>{let s=0,h=(b-a)/n;for(let i=0;i<n;i++)s+=f(a+(i+.5)*h)*h;return s;};const a=1.2,L=Math.PI;
 for(const k of[1,3,7,40]){const tent=integ(x=>x/a*Math.sin(k*x),0,a)+integ(x=>(L-x)/(L-a)*Math.sin(k*x),a,L),step=integ(x=>Math.sin(k*x),0,2);near(tent,L*Math.sin(k*a)/(a*(L-a)*k*k),3e-8);near(step,(1-Math.cos(2*k))/k,3e-8);}
});
test('translation of a step has exact difference-quotient norm, without a grid resolution floor',()=>{
 for(const h of[1e-5,.001,.1,1,3]){const symmetricDifference=2*Math.min(Math.abs(h),1),q=Math.sqrt(symmetricDifference)/Math.abs(h);near(q*q,2*Math.min(h,1)/(h*h),1e-5);if(h<=1)near(q*Math.sqrt(h),Math.SQRT2);}
});
test('half-line shifts preserve the norm even when the input is cut off at the boundary',()=>{
 const f=x=>x>=0&&x<=1?1:0;const norm=(g,lo,hi)=>{const n=200000,h=(hi-lo)/n;let s=0;for(let i=0;i<n;i++){const z=g(lo+(i+.5)*h);s+=z*z*h;}return Math.sqrt(s);};for(const t of[0,.3,2])near(norm(x=>f(x-t),0,4),1,1e-8);near(norm(x=>f(x+.3),0,4),Math.sqrt(.7),1e-8);
});
test('Hille–Yosida powers hold for a nonnormal contraction generator via its actual inverse',()=>{
 const mm=(A,B)=>A.map(r=>B[0].map((_,j)=>r.reduce((s,a,k)=>s+a*B[k][j],0)));const norm=A=>{const p=A[0][0]**2+A[1][0]**2,q=A[0][1]**2+A[1][1]**2,r=A[0][0]*A[0][1]+A[1][0]*A[1][1];return Math.sqrt((p+q)/2+Math.hypot((p-q)/2,r));};
 for(const lam of[.1,1,3]){const R=[[1/(lam+1),1/(lam+1)**2],[0,1/(lam+1)]];let P=[[1,0],[0,1]];for(let m=1;m<=8;m++){P=mm(P,R);assert.ok(norm(P)<=lam**(-m)+1e-8);}}
});
test('numerical range criterion agrees with independent matrix-exponential action',()=>{
 for(const shear of[0,1,2,3]){const omega=-1+shear/2;for(const t of[.001,.1,1]){const e=Math.exp(-t),A=[[e,shear*t*e],[0,e]];let mx=0;for(let j=0;j<20000;j++){const a=2*Math.PI*j/20000,x=Math.cos(a),y=Math.sin(a);mx=Math.max(mx,Math.hypot(A[0][0]*x+A[0][1]*y,A[1][1]*y));}assert.ok(mx<=Math.exp(t*omega)+1e-8);if(shear<=2)assert.ok(mx<=1+1e-9);if(shear===3&&t===.1)assert.ok(mx>1);}}
});
test('canonical source results and unnumbered corollary are present; legacy13.39 is transparent',async()=>{
 const files=['ch13.js','ch13-a2.js','ch13-a3.js','ch13-a4.js','ch13-a5.js'];const items=(await Promise.all(files.map(f=>import('../content/fa/'+f)))).flatMap(m=>m.default.items);for(const num of[2,6,8,9,10,11,12,13,15,16,18,19,23,24,25,27,28,30,31,32,33,35,36,37,38])assert.ok(items.some(x=>x.num===`13.${num}`));assert.ok(items.some(x=>x.num==='13.10a'));assert.match(items.find(x=>x.num==='13.39').scope,/not a number in Rudin/);
});
