import test from 'node:test';
import assert from 'node:assert/strict';
import first from '../content/ode/ch05.js';
import middle from '../content/ode/ch05-b.js';
import last from '../content/ode/ch05-c.js';
import syllabus from '../content/ode/syllabus.js';
import {rotate,radial,circleExcursion,gradientX,basinX,rk4,pendulum,energy,verlet,wellEnergy,polygonArea} from '../content/ode/ch05.shared.js';
const close=(x,y,tol=1e-8)=>assert.ok(Math.abs(x-y)<=tol*Math.max(1,Math.abs(y)),`${x} differs from ${y}`);
const norm=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const derivative=(f,t,h=1e-5)=>{const a=f(t-h),b=f(t+h);return a.map((_,i)=>(b[i]-a[i])/(2*h));};

test('all eighteen planned numbers and kinds, explanatory/control content, no future chapter prerequisite',()=>{
 const items=[...first.items,...middle.items,...last.items],planned=syllabus.chapters.find(c=>c.n===5).items;
 assert.equal(items.length,18);assert.deepEqual(items.map(i=>[i.num,i.kind]),planned.map(i=>[i.num,i.kind]));
 for(const i of items){for(const k of['statement','idea','caption','scope'])assert.ok(i[k]?.length>40,`${i.num}: ${k}`);assert.equal(typeof i.viz,'function');assert.ok(i.refs?.length);assert.ok(i.links?.source);for(const d of i.deps??[])if(d.startsWith('ode-5.'))assert.ok(Number(d.slice(6))<Number(i.num.slice(2)),`${i.num} depends forward on ${d}`);}
 assert.ok(last.items.find(i=>i.num==='5.17').deps.includes('pma-10.9'));assert.ok(!last.items.find(i=>i.num==='5.17').deps.includes('vcalc-8.7'));
});
test('complete linear flow: semigroup, inverse and differential equation in both time directions',()=>{
 for(const z of[[0,0],[1,-.7],[-1.8,1.2]])for(const s of[-2,-.2,0,1.5])for(const t of[-1,0,.4,2]){
  const a=rotate(rotate(z,s,.2),t,.2),b=rotate(z,s+t,.2);assert.ok(norm(a,b)<2e-14);assert.ok(norm(rotate(rotate(z,t,.2),-t,.2),z)<2e-14);
  const q=rotate(z,t,.2),d=derivative(u=>rotate(z,u,.2),t);close(d[0],-.2*q[0]-q[1]);close(d[1],q[0]-.2*q[1]);
 }
});
test('maximal blow-up domain prevents algebraic continuation; straightening Jacobian really degenerates at a=0',()=>{
 const phi=(t,x)=>{if(1-t*x<=0)throw new RangeError('outside maximal interval');return x/(1-t*x);};
 for(const x of[-2,-.5,0,.5,2])for(const s of[-.1,0,.1])for(const t of[-.1,0,.1])close(phi(t,phi(s,x)),phi(s+t,x));
 assert.throws(()=>phi(2,.5));assert.throws(()=>phi(3,.5));close(phi(1.6,.5),2.5);
 for(const a of[0,.01,.5,1])for(const u of[-1,0,1]){const H=(t)=>[a*t,.2+a*a*t*t],p=H(u),d=derivative(H,u);close(d[0],a);close(d[1],2*a*p[0]);const det=a;assert.equal(det===0,a===0);}
});
test('radial cycle and unstable attracting example satisfy their ODEs; arbitrarily close starts make full excursions',()=>{
 for(const r of[.05,.35,1,1.7])for(const t of[.1,1,4]){const d=(radial(r,t+1e-5)-radial(r,t-1e-5))/2e-5,z=radial(r,t);close(d,z*(1-z*z),2e-8);}
 for(const theta of[.6,.15,.01,1e-5]){const T=1/Math.tan(theta/2),p=circleExcursion(theta,0);close(Math.hypot(p[0]-1,p[1]),2*Math.sin(theta/2));assert.ok(norm(circleExcursion(theta,T),[-1,0])<1e-12);assert.ok(norm(circleExcursion(theta,1e8+T),[1,0])<3e-8);for(const t of[0,T/2,T,T*1.5]){const p=circleExcursion(theta,t),d=derivative(u=>circleExcursion(theta,u),t,1e-4);close(Math.hypot(...p),1,1e-12);close(d[0],-p[1]*(1-p[0]),2e-7);close(d[1],p[0]*(1-p[0]),2e-7);}}
});
test('analytic basin and gradient formulas preserve signs, solve scalar equations and agree at the degenerate parameter',()=>{
 for(const x of[-1.8,-.01,0,.01,1.8])for(const a of[-.5,-.01,0,.01,1.5])for(const t of[.1,1,4,8]){const u=gradientX(x,a,t),d=(gradientX(x,a,t+1e-5)-gradientX(x,a,t-1e-5))/2e-5;assert.ok(Number.isFinite(u));close(d,a*u-u*u*u,2e-8);assert.equal(Math.sign(u),Math.sign(x));}
 for(const x of[-1.5,0,.6,1.8])for(const a of[-.5,0,.5]){const d=x-a;close(basinX(x,a,0),x);if(d)close(basinX(x,a,30),a+Math.sign(d),1e-9);else close(basinX(x,a,30),a);}
 for(const x of[-1,.2,1]){close(gradientX(x,0,2),x/Math.sqrt(1+4*x*x));close(gradientX(x,-1e-8,2),gradientX(x,1e-8,2),1e-7);}
});
test('quadratic certificate classifications equal independently sampled derivative extrema and guaranteed button choice',()=>{
 for(const k of[0,.3,1,2,3])for(const b of[.1,.25,1,2,5]){const lambda=-(1+b)/2+Math.sqrt(((b-1)/2)**2+k*k/4);let max=-Infinity;for(let j=0;j<20000;j++){const q=2*Math.PI*j/20000,x=Math.cos(q),y=Math.sin(q);max=Math.max(max,-x*x+k*x*y-b*y*y);}close(max,lambda,1e-7);if(b>k*k/4)assert.ok(lambda<0);}
 for(const k of[0,.1,2,3]){const b=1+k*k/4;close(b-k*k/4,1);}
});
test('RK4 independent oscillator oracle and fourth-order step halving, including negative integration time',()=>{
 const f=([x,y])=>[y,-x];for(const T of[-6,6]){const exact=[Math.cos(T),-Math.sin(T)],a=rk4(f,[1,0],T,60).at(-1)[1],b=rk4(f,[1,0],T,120).at(-1)[1];assert.ok(norm(b,exact)<norm(a,exact)/14);assert.ok(norm(b,exact)<4e-7);}
});
test('strict nonlinear Lyapunov path respects analytic envelope and decreases at every time sample',()=>{
 const f=([x,y])=>[-x*x*x-y,x-y*y*y];for(const z of[[0,0],[1.8,0],[-1.2,.7],[.01,-.03]]){const V0=Math.hypot(...z)**2/2,a=rk4(f,z,8,800);let previous=V0;for(const[t,p]of a){const V=Math.hypot(...p)**2/2;assert.ok(V<=previous+2e-12);assert.ok(V<=V0/(1+2*V0*t)+2e-9);previous=V;}assert.ok(norm(a.at(-1)[1],rk4(f,z,8,1600).at(-1)[1])<2e-8);}
});
test('damped pendulum energy budget and compact well; conservative comparison is periodic energy, not point attraction',()=>{
 for(const d of[0,.5])for(const x of[.2,1.2,1.7]){const z=[x,.3],E=energy(z),a=rk4(pendulum(d),z,20,2000);assert.ok(E<2);let integral=0,prev=a[0][1][1]**2;for(let j=1;j<a.length;j++){const y=a[j][1][1];integral+=(prev+y*y)*.01/2;prev=y*y;assert.ok(Math.abs(a[j][1][0])<Math.PI);assert.ok(energy(a[j][1])<=E+1e-9);}close(energy(a.at(-1)[1])+d*integral,E,3e-6);if(!d)close(energy(a.at(-1)[1]),E,1e-9);else assert.ok(energy(a.at(-1)[1])<E*.001);}
 for(const x of[-1.7,-.1,.1,1.7])assert.notEqual(pendulum(.5)([x,0])[1],0);
});
test('Verlet energy geometry, convergent second-order orbit and critical separatrix data',()=>{
 close(wellEnergy([1,Math.SQRT1_2]),.25,1e-15);close(wellEnergy([0,0]),.25);close(wellEnergy([1,0]),0);
 const z=[.5,.4],E=wellEnergy(z),reference=rk4(([x,y])=>[y,x-x*x*x],z,10,10000).at(-1)[1];let lastError=Infinity;
 for(const n of[250,500,1000]){const a=verlet(z,10,n),err=norm(a.at(-1)[1],reference);assert.ok(err<lastError/3.8);lastError=err;assert.ok(Math.max(...a.map(([,p])=>Math.abs(wellEnergy(p)-E)))<.002);}
 const zero=verlet([0,0],20,200);for(const[,p]of zero)assert.deepEqual(p,[0,0]);
});
test('volume determinant and area formula hold under complete shear-contraction map at all offered parameters',()=>{
 const P=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];close(polygonArea(P),1);
 for(const d of[0,.1,.5])for(const t of[0,.3,1.5,3]){const e=Math.exp(-d*t),map=([x,y])=>[e*(x+t*y),e*y];close(polygonArea(P.map(map)),Math.exp(-2*d*t),2e-15);const a=map([1,0]),b=map([0,1]);close(a[0]*b[1]-a[1]*b[0],Math.exp(-2*d*t),2e-15);}
});
