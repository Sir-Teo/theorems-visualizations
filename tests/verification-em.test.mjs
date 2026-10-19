import assert from 'node:assert/strict';
import test from 'node:test';
import {record,near} from './verification-physics-utils.mjs';
import conductors from '../content/em/ch03.js';
import variational from '../content/em/ch03-d.js';
import images from '../content/em/ch03-b.js';
import separated from '../content/em/ch03-c.js';
import multipoles from '../content/em/ch04.js';
import multipoleApps from '../content/em/ch04-b.js';
import {realY,qlm,rot3} from '../content/em/ch04.shared.js';
import {KV,pot,fld,sor,resid} from '../content/em/ch03.shared.js';
const item=num=>images.items.find(i=>i.num===num);
test('actual cylindrical cage remains finite at a centred charge and isolates the two regions',()=>{
 const r=record(item('3.7')),s=r.stages[0],field=()=>s.calls.find(c=>c[0]==='heat')[1];
 const F=field(),inside=F(.2,.7),outside=F(4,-2);s.handles[0].set(5,-2);r.draw();near(field()(.2,.7),inside,1e-14);const newOutside=field()(4,-2);
 s.handles[1].set(-.4,.6);r.draw();near(field()(4,-2),newOutside,1e-14);
 s.handles[1].set(0,0);r.draw();assert.doesNotMatch(r.text(),/NaN|Infinity/);assert.ok(Number.isFinite(field()(.4,.2)));
 r.controls[1].set(0);r.draw();near(field()(.2,.7),0,0);near(field()(2,0),0,0);
 const constrained=s.handles[0].constrain(0,0);assert.ok(constrained.every(Number.isFinite));assert.ok(Math.hypot(...constrained)>2.5);
});
test('plane images satisfy the boundary, total induced charge and exact zero input',()=>{
 const q=3,d=2.4,src=[{x:0,y:d,q},{x:0,y:-d,q:-q}];
 for(const x of[-5,-1,0,2,10]){near(pot(src,x,0),0,1e-12);near(fld(src,x,0)[0],0,1e-12);near(fld(src,x,0)[1],-2*KV*q*d/(x*x+d*d)**1.5,1e-11);}
 // Independent substitution rho=d*tan(t) turns the whole-plane flux integral into -q*sin(t).
 let sum=0;const N=10000;for(let k=0;k<N;k++){const t=(k+.5)*Math.PI/(2*N);sum+=-q*Math.sin(t)*Math.PI/(2*N)}near(sum,-q,2e-9);
 const r=record(item('3.11'));r.controls[0].set(0);r.draw();assert.doesNotMatch(r.text(),/NaN|Infinity/);assert.match(r.text(),/density.*0.0000/);
});
test('sphere image cancels every surface point and the actual zero-charge callback is finite',()=>{
 const R=1.6,a=3.7,q=-4,src=[{x:a,y:0,q},{x:R*R/a,y:0,q:-q*R/a}];
 for(let k=0;k<500;k++){const t=2*Math.PI*k/500;near(pot(src,R*Math.cos(t),R*Math.sin(t)),0,1e-8);}
 const r=record(item('3.12'));r.controls[0].set(0);r.draw();assert.doesNotMatch(r.text(),/NaN|Infinity/);assert.match(r.text(),/Largest.*0.00/);
 const c=r.stages[0].handles[0].constrain(0,0);assert.ok(c.every(Number.isFinite));assert.ok(Math.hypot(...c)>R);
});

test('real harmonics obey the addition theorem and preserve moment power under actual rigid rotations',()=>{
 const p=[.3,-.4,.8],q=[-.2,.7,.4],rp=Math.hypot(...p),rq=Math.hypot(...q),c=p.reduce((s,x,i)=>s+x*q[i],0)/(rp*rq),P=[1,c,(3*c*c-1)/2,(5*c*c*c-3*c)/2];
 for(let l=0;l<=3;l++){let sum=0;for(let m=-l;m<=l;m++)sum+=realY(l,m,...p)*realY(l,m,...q);near(sum,(2*l+1)/(4*Math.PI)*P[l],1e-12);}
 const cl=[{x:.3,y:.7,z:-.2,q:2},{x:-.5,y:.2,z:.4,q:-1}],rot=cl.map(c=>{const p=rot3([c.x,c.y,c.z],.7,1.2);return{x:p[0],y:p[1],z:p[2],q:c.q}});
 for(let l=0;l<=3;l++){let a=0,b=0;for(let m=-l;m<=l;m++){a+=qlm(cl,l,m)**2;b+=qlm(rot,l,m)**2}near(a,b,1e-12);}
 const r=record(multipoles.items.find(i=>i.num==='4.6')),power=()=>r.stages[2].calls.filter(c=>c[0]==='rect').map(c=>c[4]);const before=power();r.controls[0].set(137);r.controls[1].set(83);r.draw();power().forEach((v,i)=>near(v,before[i],1e-12));assert.doesNotMatch(r.text(),/NaN|Infinity/);
});
test('actual spherical boundary data recover exact Legendre coefficients and require a surface charge',()=>{
 const r=record(separated.items.find(i=>i.num==='3.15'));r.controls[0].set('p2');r.controls[1].set(2);r.draw();const potential=r.stages[0].calls.find(c=>c[0]==='heat')[1];
 for(const[x,y]of[[1,0],[0,1],[3,4],[.4,.8]]){const radius=Math.hypot(x,y),P2=(3*(x/radius)**2-1)/2;near(potential(x,y),P2*(radius<2?(radius/2)**2:(2/radius)**3),1e-12);}
 r.controls[0].set('hemi');r.controls[1].set(30);r.draw();const bars=r.stages[2].calls.filter(c=>c[0]==='rect');near(bars[0][4],0,0);near(bars[1][4],1.5,1e-13);near(bars[3][4],-.875,1e-13);assert.doesNotMatch(r.text(),/NaN|Infinity/);
});
test('actual complex potentials distinguish a critical point, a masked singularity and a conductor boundary',()=>{
 const r=record(separated.items.find(i=>i.num==='3.17'));r.stages[0].handles[0].set(0,0);r.draw();assert.match(r.text(),/undefined/);assert.doesNotMatch(r.text(),/NaN|Infinity/);
 r.controls[0].set('ln');r.draw();assert.match(r.text(),/masked singular/);
 r.controls[0].set('jou');r.stages[0].handles[0].set(.7,.8);r.draw();const u=r.stages[0].calls.find(c=>c[0]==='contour')[1];
 for(let k=0;k<20;k++){const t=2*Math.PI*k/20;near(u(Math.cos(t),Math.sin(t)),0,1e-12);}
 r.controls[0].set('bad');r.draw();assert.doesNotMatch(r.text(),/NaN|Infinity/);assert.match(r.text(),/NOT analytic/);
});

test('actual distributional multipoles have the correct sign, second-order error and exact polynomial limits',()=>{
 const r=record(multipoleApps.items.find(i=>i.num==='4.8')),action=()=>r.stages[1].calls.find(c=>c[0]==='fn')[1];const x=.4;r.controls[0].set('cubic');r.draw();
 const f1=.36*x*x-.5;for(const e of[.2,.4,1])near(action()(e),f1+.03*e*e,1e-13);
 r.controls[1].set(2);r.draw();for(const e of[.1,.4,1])near(action()(e),.72*x,1e-12);
 r.controls[0].set('wave');r.draw();const d2=-2.25*Math.sin(1.5*x)+.2,a=action(),err1=Math.abs(a(.2)-d2),err2=Math.abs(a(.1)-d2);near(err1/err2,4,.004);assert.doesNotMatch(r.text(),/NaN|Infinity/);
});
test('actual water dipole fits the NIST ground-state convention and has a finite zero-charge field',()=>{
 const r=record(multipoleApps.items.find(i=>i.num==='4.10'));r.buttons.find(b=>b.label.startsWith('fit')).fn();r.draw();assert.match(r.text(),/1.855/);
 r.controls[1].set(180);r.draw();assert.match(r.text(),/cancel exactly/);r.controls[2].set(0);r.draw();assert.doesNotMatch(r.text(),/NaN|Infinity/);
 const heat=r.stages[0].calls.find(c=>c[0]==='heat')[1];near(heat(0,0),0,0);
});

test('two-sphere graph varies common potential with radius at fixed total charge',()=>{
 const r=record(conductors.items.find(i=>i.num==='3.4'));r.controls[0].set(.1);r.controls[1].set(400);r.draw();
 const E=r.stages[1].calls.find(c=>c[0]==='fn')[1];for(const R of[.1,.5,3,8])near(E(R),KV*400/(R*(R+8)),1e-13);
 const dot=r.stages[1].calls.find(c=>c[0]==='dot');near(dot[2],E(.1),1e-13);assert.match(r.text(),/illustrative/);
 r.controls[0].set(8);r.draw();const circles=r.stages[0].calls.filter(c=>c[0]==='circle');assert.ok(circles[1][1]-circles[0][1]>circles[0][3]+circles[1][3]);
});
test('Cartesian separated boundary coefficients match independent piecewise integrals',()=>{
 const r=record(separated.items.find(i=>i.num==='3.14'));r.controls[1].set(80);
 const modes={sq:[[0,1]],half:[[0,.5]],two:[[1/3,2/3]]};
 for(const[k,intervals]of Object.entries(modes)){r.controls[0].set(k);r.draw();const bars=r.stages[2].calls.filter(c=>c[0]==='rect');for(let n=1;n<=40;n++)near(bars[n-1][4],intervals.reduce((s,[a,b])=>s+2*(Math.cos(n*Math.PI*a)-Math.cos(n*Math.PI*b))/(n*Math.PI),0),1e-13);
 const F=r.stages[0].calls.find(c=>c[0]==='heat')[1];near(F(2,0),0,1e-13);near(F(2,4),0,1e-13);assert.ok(Math.abs(F(8,2))<.003);}
 r.controls[0].set('tri');r.draw();const bars=r.stages[2].calls.filter(c=>c[0]==='rect');near(bars[0][4],8/Math.PI**2,1e-13);near(bars[1][4],0,1e-13);near(bars[2][4],-8/(9*Math.PI**2),1e-13);
});
test('five-point relaxation matches an independent sweep, spectral decay, range and residual definition',()=>{
 const N=9,fixed=new Uint8Array(N*N);for(let j=0;j<N;j++)for(let i=0;i<N;i++)if(!i||!j||i===N-1||j===N-1)fixed[j*N+i]=1;
 const V=Float64Array.from({length:N*N},(_,k)=>fixed[k]?0:Math.sin(Math.PI*(k%N)/(N-1))*Math.sin(Math.PI*Math.floor(k/N)/(N-1))),expected=V.slice();
 for(let j=1;j<N-1;j++)for(let i=1;i<N-1;i++){const k=j*N+i;expected[k]=(expected[k-1]+expected[k+1]+expected[k-N]+expected[k+N])/4;}
 sor(V,fixed,N,N,1,1);V.forEach((x,k)=>near(x,expected[k],1e-14));let prev;for(let n=0;n<150;n++){prev=resid(V,fixed,N,N);sor(V,fixed,N,N,1,1)}near(resid(V,fixed,N,N)/prev,Math.cos(Math.PI/(N-1))**2,1e-9);
 const b=Float64Array.from(fixed,x=>x?0:1);sor(b,fixed,N,N,1.9,1);assert.ok(Math.min(...b)<0,'convergent SOR can overshoot the initial and boundary range');
 const r=record(separated.items.find(i=>i.num==='3.19'));r.controls[0].set(2.1);r.controls[1].set(300);r.draw();assert.doesNotMatch(r.text(),/NaN|Infinity/);assert.match(r.text(),/no longer converges/);
});
test('Thomson midpoint model has positive neutral quadratic form and correct circular Fourier limit',()=>{
 for(let k=0;k<=80;k++){
 const b=3*(.2+k*.01),N=48,P=[[3,0]],L=[0],T=4000;for(let j=1;j<=T;j++){const t=2*Math.PI*j/T,p=[3*Math.cos(t),b*Math.sin(t)];L.push(L[j-1]+Math.hypot(p[0]-P[j-1][0],p[1]-P[j-1][1]));P.push(p)}
 const per=L[T],pts=[];let j=0;for(let i=0;i<N;i++){const z=(i+.5)*per/N;while(L[j+1]<z)j++;const f=(z-L[j])/(L[j+1]-L[j]);pts.push(P[j].map((x,d)=>x+f*(P[j+1][d]-x)))}
 const A=pts.map((p,i)=>pts.map((q,j)=>i===j?1-Math.log(per/(2*N)):-Math.log(Math.hypot(p[0]-q[0],p[1]-q[1]))));
 // Eliminate the final coordinate to span every zero-total perturbation, then independent Cholesky.
 const C=Array.from({length:N-1},(_,i)=>Array.from({length:N-1},(_,j)=>A[i][j]-A[i][N-1]-A[N-1][j]+A[N-1][N-1]));
 for(let i=0;i<N-1;i++)for(let j=0;j<=i;j++){let x=C[i][j];for(let n=0;n<j;n++)x-=C[i][n]*C[j][n];if(i===j){assert.ok(x>0,`positive pivot at b/a=${b/3}`);C[i][j]=Math.sqrt(x)}else C[i][j]=x/C[j][j]}
 }
 const r=record(variational.items.find(i=>i.num==='3.22'));r.controls[0].set(1);r.controls.slice(1).forEach(c=>c.set(0));r.controls[1].set(.7);r.draw();const dW=Number(r.text().match(/W-W_\{eq\}=([^$]+)/)[1]);near(dW,.08*.7**2,.0015);
 r.controls[1].set(0);r.draw();assert.match(r.text(),/W-W_\{eq\}=0.000e\+0/);assert.doesNotMatch(r.text(),/NaN|Infinity/);
 r.controls.slice(1).forEach(c=>c.set(1));r.draw();const view=r.stages[1].calls.find(c=>c[0]==='setView');assert.ok(view[2][0]<0);
});

test('plate-edge map preserves boundary and probe correspondence including bounded inverse targets',()=>{
 const r=record(separated.items.find(i=>i.num==='3.18')),w=r.stages[0].handles[0],z=r.stages[1].handles[0],f=(u,v)=>[u+1+Math.exp(u)*Math.cos(v),v+Math.exp(u)*Math.sin(v)];
 for(const[u,v]of[[-3,1.2],[1,2.8],[.3,-2],[2,.2],[-4,0]]){const target=f(u,v);z.set(...target);z.onDrag();r.draw();near(z.x,f(w.x,w.y)[0],1e-13);near(z.y,f(w.x,w.y)[1],1e-13);near(z.x,target[0],1e-8);near(z.y,target[1],1e-8)}
 z.set(100,100);z.onDrag();r.draw();near(z.x,f(w.x,w.y)[0],1e-13);near(z.y,f(w.x,w.y)[1],1e-13);assert.doesNotMatch(r.text(),/NaN|Infinity/);
 for(const u of[-5,-1,0,1,2])for(const v of[-Math.PI,Math.PI]){const p=f(u,v);near(p[1],v,1e-13);assert.ok(p[0]<=1e-13)}
});
