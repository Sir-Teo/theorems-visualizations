import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadAll} from '../scripts/lib.mjs';
import * as H from '../content/mfd/ch06.shared.js';
const near=(a,b,t=2e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const vec=(a,b,t)=>a.forEach((x,i)=>near(x,b[i],t));
const diff=(f,x,h=1e-5)=>(f(x+h)-f(x-h))/(2*h);
const integrate=(f,a,b,n=256)=>{let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+(b-a)*i/n);return s*(b-a)/(3*n);};
const det3=(a,b,c)=>a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]);

test('covector evaluations survive independent changes of basis',()=>{
 for(const a of[-1,.27,1])for(const b of[-1,.35,1])for(const shear of[-1.2,0,.71345678,1.2])for(const v of[[1,0],[-.4,.7],[0,0]]){const q=H.covector(a,b,v,shear);near(q.value,a*v[0]+b*v[1]);near(q.localValue,q.value);vec(H.mv(q.B,q.local),v);vec(q.coeff,[a,a*shear+b]);}
});
test('function differentials agree with derivatives and actual quadratic increments',()=>{
 for(const c of[-1,1])for(const x of[-.65,.123,.65])for(const y of[-.65,.2,.65])for(const t of[0,.123456789,.25,.71])for(const h of[0,1e-7,.31,.5]){const q=H.differential(x,y,c,t,h),f=s=>q.f(x+s*q.v[0],y+s*q.v[1]);near(q.value,diff(f,0),1e-9);near(q.increment,f(h)-f(0));if(h>1e-6)near(q.secant,(f(h)-f(0))/h);}
});
const gauss3=(f,a,b)=>{const c=(a+b)/2,h=(b-a)/2,r=Math.sqrt(3/5);return h*(5*f(c-h*r)/9+8*f(c)/9+5*f(c+h*r)/9);};
test('line-integral model agrees with direct path differentiation and quadrature',()=>{
 for(const b of[-1.5,0,.734567,1.5])for(const k of[-.8,0,.43123,.8])for(const reverse of[false,true]){
  const f=s=>{const t=reverse?1-((1-k)*s+k*s*s):(1-k)*s+k*s*s,dt=(reverse?-1:1)*(1-k+2*k*s),x=t,y=b*t*(1-t),dx=dt,dy=b*(1-2*t)*dt;return(-y*dx+x*dy)/2;};
  for(const s of[0,.37,1]){const q=H.pathData(b,k,s,reverse);near(q.density,f(s));near(q.partial,gauss3(f,0,s));near(q.total,gauss3(f,0,1));assert.ok(Math.abs(q.dt)>=.2-1e-15);}
 }
});
test('potential and angle-form integrals distinguish identical endpoints and loop periods',()=>{
 for(const mode of['exact','angle'])for(const path of['upper','lower','loop'])for(const s of[0,.234,1]){const end=path==='upper'?Math.PI:path==='lower'?-Math.PI:2*Math.PI,q=H.conservative(mode,path,s),f=t=>{const x=Math.cos(t),y=Math.sin(t),dx=-Math.sin(t),dy=Math.cos(t);return mode==='exact'?dx+.8*y*dy:(-y*dx+x*dy)/(x*x+y*y);};near(q.integral,integrate(f,0,end*s,1024));near(q.total,integrate(f,0,end,1024));}
 near(H.conservative('angle','upper',1).total-H.conservative('angle','lower',1).total,2*Math.PI);near(H.conservative('exact','loop',1).total,0);
});
test('bilinear tensor congruence preserves values and distinguishes symmetry from alternation',()=>{
 for(const mode of['positive','indefinite','alternating'])for(const shear of[-1.2,.7123,1.2])for(const t of[0,.2,.5]){const q=H.tensor(mode,shear,H.trigTurn(t),H.trigTurn(t+.17));near(q.value,q.localValue);near(q.reverse,mode==='alternating'?-q.value:q.value);if(mode==='positive')assert.ok(H.dot(q.v,H.mv(q.A,q.v))>0);if(mode==='alternating')near(H.dot(q.v,H.mv(q.A,q.v)),0);}
});
test('wedge evaluations match shoelace area and detect dependent pairs without thresholds',()=>{
 const area=pts=>pts.reduce((s,p,i)=>{const q=pts[(i+1)%pts.length];return s+p[0]*q[1]-p[1]*q[0];},0)/2;
 for(const a of[-1.5,0,1,1+Number.EPSILON])for(const b of[-1.5,.3,1])for(const t of[-.5,0,Number.MIN_VALUE,.25,.5])for(const swap of[false,true]){const q=H.wedge(a,b,t,swap);near(q.value,area([[0,0],q.V,H.add(q.V,q.W),q.W]));near(q.value,q.imageArea);}
 assert.equal(H.wedge(1,1,.25).value,0);assert.notEqual(H.wedge(1+Number.EPSILON,1,.25).value,0);
});
test('sphere form is intrinsic while longitude coordinates lose rank exactly at the poles',()=>{
 for(const u of[0,.123,.25,.7])for(const w of[-.25,-.25+Number.EPSILON,.1,.25-Number.EPSILON,.25])for(const swap of[false,true]){const q=H.sphereForm(u,w,swap);near(det3(q.p,q.e1,q.e2),1);near(H.dot(q.p,q.e1),0);near(H.dot(q.p,q.e2),0);near(q.coordinateValue,q.coefficient);near(q.orthValue,swap?-1:1);assert.equal(q.chartRegular,Math.abs(w)!==.25);}
});
test('pullback agrees with actual differential images, wedge determinants and rank collapse',()=>{
 for(const eps of[-1,0,1])for(const c of[-.8,.23456,.8])for(const u of[-.65,.17,.65])for(const t of[0,.33,.5]){const q=H.pullback(u,.25,c,eps,t),F=(u,v)=>[u,eps*v+c*u*u],d=[diff(s=>F(u+s*q.w[0],.25+s*q.w[1])[0],0),diff(s=>F(u+s*q.w[0],.25+s*q.w[1])[1],0)];vec(q.pushed,d,1e-9);near(q.value,q.F[0]*d[1],1e-9);near(q.value,q.localValue);near(q.area,q.J[0][0]*q.J[1][1]-q.J[0][1]*q.J[1][0]);}
});
test('small-square circulation uses four separate boundary integrals, not the area formula',()=>{
 for(const x of[-.6,.123,.6])for(const y of[-.6,.23,.6])for(const h of[0,1e-5,.31,.6]){const q=H.circulation(x,y,h),P=(x,y)=>-(y**3)/3,Q=(x,y)=>x**3/3;
  const boundary=integrate(t=>P(t,y-h),x-h,x+h)+integrate(t=>Q(x+h,t),y-h,y+h)+integrate(t=>P(t,y+h),x+h,x-h)+integrate(t=>Q(x-h,t),y+h,y-h);near(q.total,boundary);near(q.density,diff(t=>Q(t,y),x)-diff(t=>P(x,t),y),1e-9);near(q.average-q.density,q.error);
 }
});
test('grad curl divergence and d² cancellations agree with separately differenced fields',()=>{
 for(const p of[[-.6,.4,-.2],[.23,-.15,.6],[0,0,0],[.6,.6,.6]]){
  const q=H.vectorCalculus(...p),D=(field,i,j)=>diff(t=>{const x=[...p];x[j]=t;return H.vectorCalculus(...x)[field][i];},p[j]);
  vec(q.grad,p.map((x,j)=>diff(t=>{const a=[...p];a[j]=t;return H.vectorCalculus(...a).f;},x)),1e-9);
  vec(q.curl,[D('F',2,1)-D('F',1,2),D('F',0,2)-D('F',2,0),D('F',1,0)-D('F',0,1)],1e-9);
  near(q.div,D('F',0,0)+D('F',1,1)+D('F',2,2),1e-9);near(D('curl',0,0)+D('curl',1,1)+D('curl',2,2),0,1e-9);
  near(q.divCurlTerms.reduce((a,b)=>a+b,0),0);
 }
});
test('contraction evaluates signed flux and annihilates its inserted vector',()=>{
 for(const a of[-1,0,.6])for(const b of[-1,0,.3])for(const x of[-1,.31,1])for(const t of[0,.2,.5]){const q=H.contraction(a,b,x,t);near(q.value,q.rho*(a*q.v[1]-b*q.v[0]));near(q.area,q.value);near(H.dot(q.coeff,q.X),0);}
});
test('Cartan terms match the derivative of the actual flow pullback',()=>{
 for(const mode of['one-form','area-form'])for(const a of[-1,-.23,0,1])for(const b of[-1,.51,1]){
  const q=H.cartan(mode,a,b,1e-5),x=.6,y=.4,flow=t=>[x*Math.exp(a*t),y*Math.exp(b*t)],pulled=t=>mode==='one-form'?flow(t)[0]*Math.exp(b*t):(1+flow(t)[0]**2)*Math.exp((a+b)*t);
  near(q.lie.at(-1),diff(pulled,0),2e-9);vec(q.dInterior.map((n,j)=>n+q.interiorD[j]),q.lie);vec(q.difference,q.lie,2e-9);
  const zero=H.cartan(mode,a,b,0);vec(zero.difference,zero.lie);
 }
 const q=H.cartan('one-form',.7,-.4,.2);assert.notEqual(q.dInterior[0],0);near(q.dInterior[0]+q.interiorD[0],0);
});
test('strip frames are tangent to the actual embeddings and show the Möbius seam reversal',()=>{
 for(const twisted of[false,true])for(const t of[0,.13,.5,.98,1]){const q=H.stripFrame(t,twisted),d=H.stripPoint(t,1e-5,twisted).map((x,i)=>(x-H.stripPoint(t,-1e-5,twisted)[i])/2e-5);vec(q.width,d,1e-9);near(H.dot(q.tangent,q.width),0);near(Math.hypot(...q.normal),1);vec(H.stripPoint(t+1,.21,twisted),H.stripPoint(t,twisted?-.21:.21,twisted));}
 vec(H.stripFrame(1,true).normal,H.scale(H.stripFrame(0,true).normal,-1));vec(H.stripFrame(1,false).normal,H.stripFrame(0,false).normal);
});
test('orientation-cover lift projects correctly and distinguishes one-loop from two-loop return',()=>{
 for(const twisted of[false,true])for(const sheet of[0,1])for(const t of[0,.4123456,1,1.3,2]){const q=H.orientationCover(t,twisted,sheet),[x,y]=q.lift;vec(twisted?[x*x-y*y,2*x*y]:q.lift,q.base);assert.equal(q.components,twisted?1:2);}
 vec(H.orientationCover(1,true).lift,[-1,0]);vec(H.orientationCover(2,true).lift,[1,0]);
});
test('volume-form zeros and seam compatibility retain exact boundary decisions',()=>{
 for(const a of[0,1-Number.EPSILON,1,1+Number.EPSILON,1.5]){const q=H.volumeDensity('circle',a,.5);assert.equal(q.nonvanishing,a<1);near(q.value,1-a);for(const z of q.zeros)near(H.volumeDensity('circle',a,z).value,0);}
 for(const t of[0,.12,.5,.83,1])near(H.volumeDensity('Möbius band',0,t+1).value,-H.volumeDensity('Möbius band',0,t).value);
});
test('smooth chart partition covers the circle and agrees with independent adaptive-size quadrature',()=>{
 for(const bias of[.25,.7134567,1,4]){
  for(let i=0;i<=720;i++){const t=i/720,w=H.partition(t,bias);assert.ok(w.every(x=>Number.isFinite(x)&&x>=0));near(w.reduce((a,b)=>a+b,0),1);vec(H.partition(t+1,bias),w);for(let j=0;j<3;j++){const d=Math.acos(Math.cos(H.TAU*(t-j/3)));if(d>2.4+1e-12)near(w[j],0);}}
  const q=H.partitionIntegrals(bias);for(let j=0;j<3;j++){const integral=integrate(t=>H.partition(t/H.TAU,bias)[j]*(1+.4*Math.cos(t)),0,H.TAU,8192);near(q.pieces[j],integral,2e-10);}near(q.total,H.TAU);
 }
});
test('annulus orientation is checked by direct contour quadrature and independent radial area',()=>{
 for(const R of[.8,1.2345,1.5])for(const q of[0,1e-8,.4321,.85])for(const orientation of[-1,1])for(const wrong of[false,true]){const z=H.annulus(R,q,orientation,wrong),around=(r,sign)=>integrate(t=>{const x=r*Math.cos(t),y=r*Math.sin(t),dx=-r*Math.sin(t)*sign,dy=r*Math.cos(t)*sign;return(-y*dx+x*dy)/2;},0,H.TAU);near(z.boundary,around(R,orientation)+around(z.r,orientation*(wrong?1:-1)));near(z.area,orientation*integrate(r=>H.TAU*r,z.r,R));near(z.boundary-z.area,z.defect);}
});
test('bent-disk curl flux agrees with its actual parameter normal and boundary circulation',()=>{
 for(const R of[.6,1,1.2])for(const h of[-1,0,.623])for(const c of[-1,.3,1])for(const sign of[-1,1]){const q=H.classical(R,h,c,sign),flux=integrate(r=>integrate(t=>{const normal=[2*h*r*r*Math.cos(t)/(R*R),2*h*r*r*Math.sin(t)/(R*R),r];return sign*H.dot(q.curl,normal);},0,H.TAU,64),0,R,64),boundary=integrate(t=>{const p=q.surface(R,t),velocity=[-R*Math.sin(t),R*Math.cos(t),0];return sign*H.dot(q.F(p[0],p[1]),velocity);},0,H.TAU);near(q.integral,flux);near(q.integral,boundary);}
});
test('global sphere primitive differentiates to the exact density and matches cap boundaries',()=>{
 for(const z of[-1,-.7,0,.234567,.8,1]){const q=H.exactCap(z),integral=integrate(w=>2*Math.PI*(3*w*w-1),z,1);near(q.integral,integral);const boundary=integrate(t=>{const x=q.radius*Math.cos(t),y=q.radius*Math.sin(t),dx=-q.radius*Math.sin(t),dy=q.radius*Math.cos(t);return z*(x*dy-y*dx);},0,H.TAU);near(q.boundary,boundary);near(H.exactCap(z,'area').integral,integrate(()=>H.TAU,z,1));}
 near(H.exactCap(-1).integral,0);near(H.exactCap(-1,'area').integral,4*Math.PI);
 for(const z of[-.8,0,.6])near(-diff(t=>t*(1-t*t),z),3*z*z-1,1e-9);
});
test('left and right affine translation volumes follow actual Jacobians and density integrals',()=>{
 for(const v of[-.8,.371234,.8])for(const c of[-.7,0,.7])for(const side of['left','right']){const q=H.affineVolume(v,c,side);for(const u of[-.35,0,.35]){const J=[[diff(t=>q.map([t,.13])[0],u),diff(t=>q.map([u,t])[0],.13)],[diff(t=>q.map([t,.13])[1],u),diff(t=>q.map([u,t])[1],.13)]];near(q.jacobian,J[0][0]*J[1][1]-J[0][1]*J[1][0],1e-9);near(Math.exp(-q.map([u,.13])[0])*q.jacobian/Math.exp(-u),q.factor);}
  near(q.image,integrate(u=>.7*Math.exp(-q.map([u,0])[0])*q.jacobian,-.35,.35));near(q.original,integrate(u=>.7*Math.exp(-u),-.35,.35));}
});
test('MFD6 retains frozen identities, synchronized metadata and written prerequisites',async()=>{
 const plan=JSON.parse(await readFile(new URL('../docs/wave-6-plan.json',import.meta.url),'utf8')),{items}=await loadAll(),chapter=items.filter(x=>x.col==='mfd'&&x.chapter===6),all=new Set(items.map(x=>x.id));
 const S=(await import('../content/mfd/syllabus.js')).default.chapters.find(x=>x.n===6),frozen=plan.chapters.find(x=>x.col==='mfd'||x.collection==='mfd');assert.equal(chapter.length,20);
 for(const it of chapter){const s=S.items.find(x=>x.num===it.num),p=(frozen.items||frozen.newItems).find(x=>x.num===it.num||x.id===it.id);assert.equal(it.name,s.name);assert.equal(it.kind,s.kind);assert.deepEqual(it.deps,s.deps);assert.deepEqual(it.refs,s.refs);assert.equal(it.name,p.name);assert.equal(it.kind,p.kind);for(const dep of it.deps)assert.ok(all.has(dep),dep);assert.equal(typeof it.viz,'function');}
});
