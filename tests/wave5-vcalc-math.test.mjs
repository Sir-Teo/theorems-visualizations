import test from 'node:test';
import assert from 'node:assert/strict';
import {quad,potential,gradient,rotation,vortex,work,segmentWork,wiggle,bowed,circle,orbit,gas} from '../content/vcalc/ch05.shared.js';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}`);
test('scalar fence integral survives speed changes and orientation reversal',()=>{
 const base=t=>(1+.4*t)*Math.hypot(1,.6*Math.PI*Math.cos(Math.PI*t)),I=quad(base,0,1,4000);
 for(const a of [-.8,0,.8])for(const sign of [-1,1]){const map=u=>{let t=u+a*Math.sin(2*Math.PI*u)/(2*Math.PI);return sign===1?t:1-t;};near(quad(u=>base(map(u))*(1+a*Math.cos(2*Math.PI*u))),I,1e-8);}
});
test('piecewise work agrees with independent endpoint determinant formula',()=>{
 const F=(x,y)=>[1-y,x];for(const p of [[-2,2],[2,-2],[0,0],[.4,-.7]]){const A=[-1,-.5],B=[1,.5],w=segmentWork(F,A,p)+segmentWork(F,p,B);near(w,2+p[0]-2*p[1]);near(segmentWork(F,B,p)+segmentWork(F,p,A),-w);}
});
test('gradient theorem and route differences match analytic antiderivatives',()=>{
 for(const h of [-1,0,1]){let {r,d}=wiggle(h);near(work(gradient,r,d),potential(...r(1))-potential(...r(0)));({r,d}=bowed(h));near(work(rotation,r,d),-8*h/Math.PI);}
 for(const [x,y] of [[1,2],[-.7,1.3],[0,1]]){for(const [F,hv,vh] of [[(x,y)=>[y,x],x*y,x*y],[rotation,x*y,-x*y]]){near(segmentWork(F,[0,0],[x,0])+segmentWork(F,[x,0],[x,y]),hv);near(segmentWork(F,[0,0],[0,y])+segmentWork(F,[0,y],[x,y]),vh);}}
});
test('vortex uses the actual singular field, winding and admissible contractions',()=>{
 assert.ok(vortex(0,0).every(Number.isNaN));for(const n of [-2,-1,1,2])for(const c of [0,.98,1.02,2]){const {r,d}=circle(c,0,1,.7,n);near(work(vortex,r,d,0,1,16000),c<1?2*Math.PI*n:0,1e-8);}
 for(const a of [.01,.3,1]){let C=circle(0,0,a);near(work(vortex,C.r,C.d),2*Math.PI);C=circle(1.2,0,a);near(work(vortex,C.r,C.d),0);}
 // Finite-difference cross derivatives, independent of the integral implementation.
 const h=1e-5;for(const [x,y] of [[1,1],[-.7,1.2],[2,-.3]])near((vortex(x+h,y)[1]-vortex(x-h,y)[1]-vortex(x,y+h)[0]+vortex(x,y-h)[0])/(2*h),0,1e-8);
});
test('ellipse circulation and flux agree with independent area formula',()=>{
 for(const e of [.35,.8,1.4])for(const sign of [-1,1]){const C=circle(0,0,1.2,e,sign),a=.7,b=-.4,F=(x,y)=>[a*x-b*y,a*y+b*x];near(work(F,C.r,C.d),2*b*sign*Math.PI*1.2*e);near(quad(t=>{const f=F(...C.r(t)),d=C.d(t);return f[0]*d[1]-f[1]*d[0];}),2*a*sign*Math.PI*1.2*e);}
});
test('orbit agrees with exact circular oscillator and independent power balance',()=>{
 const rows=orbit(0);for(const z of rows){near(z[1],Math.cos(z[0]),1e-9);near(z[2],Math.sin(z[0]),1e-9);}
 for(const k of [-.3,.3]){const coarse=orbit(k,10,1000),fine=orbit(k,10,2000);let err=0;for(const z of fine)err=Math.max(err,Math.abs((z[1]**2+z[2]**2+z[3]**2+z[4]**2)/2-1-z[5]));assert.ok(err<2e-9);for(let j=1;j<=5;j++)near(coarse.at(-1)[j],fine.at(-1)[j],2e-8);assert.ok(Math.abs(fine.at(-1)[5])>.1);}
});
test('gas paths compare with pressure antiderivative and state endpoints',()=>{
 for(const h of [-.6,0,.9])for(const V of [1.2,3])for(const p of [1,2.5]){const g=gas(h,V,p);near(g.W,(V-1)*((1+p)/2+2*h/Math.PI));near(g.Q-g.W,1.5*(p*V-1));assert.ok(Math.min(...Array.from({length:101},(_,i)=>g.pressure(i/100)))>0);}
});
