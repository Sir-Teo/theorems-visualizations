import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadAll} from '../scripts/lib.mjs';
import * as H from '../content/dg/ch06.shared.js';
const near=(a,b,tol=2e-12)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} differs from ${b}`);
const vec=(a,b,tol)=>a.forEach((x,i)=>near(x,b[i],tol));
const dot2=(a,b)=>a[0]*b[0]+a[1]*b[1];
const apply=(A,x)=>A.map(r=>r.reduce((s,a,i)=>s+a*x[i],0));
const diff=(f,x,h=1e-5)=>H.mul(H.sub(f(x+h),f(x-h)),1/(2*h));

test('analytic surface jets agree with independently differenced positions and first derivatives',()=>{
 const jets=[(u,v)=>H.graphJet(u,v,{a:.8,b:.35,c:-.4,shear:.731,cubic:.24}),H.sphereJet,H.cylinderJet,H.torusJet,...['sphere','cone','cylinder','catenoid'].map(k=>(u,v)=>H.revolutionJet(u,v,k))];
 for(const jet of jets)for(const u of[-1.3,.27,1.2])for(const v of[-.7,.12,.6]){const J=jet(u,v);vec(J.u,diff(x=>jet(x,v).p,u),2e-9);vec(J.v,diff(x=>jet(u,x).p,v),2e-9);vec(J.uu,diff(x=>jet(x,v).u,u),2e-9);vec(J.uv,diff(x=>jet(u,x).u,v),2e-9);vec(J.vv,diff(x=>jet(u,x).v,v),2e-9);}
});
test('shape operator is minus the actual normal derivative, including sheared coordinates',()=>{
 for(const shear of[-1.2,0,.37123456789,1.2])for(const x of[-.7,.13,.6])for(const y of[-.4,.3]){
  const jet=(u,v)=>H.graphJet(u,v,{shear,cubic:.2}),u=x-shear*y,J=jet(u,y),F=H.forms(J),normal=(u,v)=>H.unit(H.cross(jet(u,v).u,jet(u,v).v));
  near(H.len(F.N),1);near(H.dot(F.N,J.u),0);near(H.dot(F.N,J.v),0);assert.ok(F.E*F.G-F.F*F.F>0);
  for(const j of[0,1])vec(H.mul(j?diff(t=>normal(u,t),y):diff(t=>normal(t,y),u),-1),F.tangent(F.S[0][j],F.S[1][j]),3e-9);
  near(F.B[0][1],F.B[1][0]);near(H.dot(...F.basis),0);F.basis.forEach(e=>near(H.len(e),1));
 }
});
test('sphere and cylinder values and orientation changes obey S=-dN',()=>{
 for(const R of[.8,1,1.37123456789,2])for(const u of[-1,.2,2])for(const v of[-.7,.13,.7])for(const flip of[-1,1]){
  const s=H.forms(H.sphereJet(u,v,R),flip),c=H.forms(H.cylinderJet(u,v,R),flip);
  near(s.K,1/R**2);near(s.H,-flip/R);s.eigen.values.forEach(k=>near(k,-flip/R));near(c.K,0);near(c.H,-flip/(2*R));near(c.eigen.values.reduce((p,k)=>p*k,1),0);
 }
});
test('coordinate shears preserve graph invariants and both coordinate forms represent the same bilinear form',()=>{
 for(const x of[-.5,.123,.5])for(const shear of[-1.2,-.4,0,.831,1.2]){
  const y=.3,a=1,b=.4,c=.8,F=H.forms(H.graphJet(x-shear*y,y,{a,b,c,shear})),fx=a*x+b*y,fy=b*x+c*y,w=Math.hypot(1,fx,fy);
  near(F.K,(a*c-b*b)/w**4);near(F.H,((1+fy*fy)*a-2*fx*fy*b+(1+fx*fx)*c)/(2*w**3));
  const u=[.31,-.82],v=[-.57,.29],lhs=H.dot(F.tangent(...apply(F.S,u)),F.tangent(...v)),rhs=u.reduce((s,t,i)=>s+t*apply(F.II,v)[i],0);near(lhs,rhs);
 }
});
test('principal axes satisfy eigenvector and Rayleigh identities including very small anisotropy',()=>{
 for(const [a,b,c]of[[1,.4,-.7],[1,0,1],[1,1e-15,1],[1,1e-8,1+Number.EPSILON],[0,1e-20,0],[-1.3,-.72,.3]]){
  const z=H.principal(a,b,c);near(dot2(...z.vectors),0);z.vectors.forEach((e,i)=>{near(Math.hypot(...e),1);vec(apply([[a,b],[b,c]],e),e.map(x=>x*z.values[i]));});
  for(let i=0;i<=40;i++){const t=i*.157,co=Math.cos(t),si=Math.sin(t),e=z.vectors[0].map((x,j)=>x*co+z.vectors[1][j]*si);near(dot2(e,apply([[a,b],[b,c]],e)),z.values[0]*co*co+z.values[1]*si*si);}
 }
 const tiny=H.principal(0,1e-20,0);assert.ok(tiny.values.every(k=>k!==0));near(Math.abs(tiny.vectors[0][0]),Math.SQRT1_2);
});
test('Taylor remainder of the graph normal section is exactly cubic and shrinks after quadratic rescaling',()=>{
 for(const c of[-.6,.37123456789,.6])for(const t of[0,.1,.25,.37123456789,.75])for(const h of[.02,.2,.6]){
  const[x,y]=H.trigTurn(t),J=H.graphJet(h*x,h*y,{a:1,b:.35,c:-.5,cubic:c}),q=x*x+.7*x*y-.5*y*y;near(J.p[2]-.5*h*h*q,c*(h*x)**3);
  near((2*J.p[2]/h**2)-q,2*c*h*x**3);
 }
});
test('Meusnier circles lie on the sphere and have independently computed curvature and normal component',()=>{
 for(const R of[.8,1,1.4])for(const tilt of[0,.3,.7,70*Math.PI/180]){
  const M=H.meusnier(R,tilt);for(let j=0;j<=60;j++)near(H.len(M.curve(j/60*H.TAU)),R);
  const d=diff(M.curve,0),h=1e-3,dd=[0,1,2].map(i=>(-M.curve(2*h)[i]+16*M.curve(h)[i]-30*M.curve(0)[i]+16*M.curve(-h)[i]-M.curve(-2*h)[i])/(12*h*h)),k=H.len(H.cross(d,dd))/H.len(d)**3;
  near(k,M.kappa,1e-8);near(dd[2]/H.dot(d,d),M.kn,1e-8);vec(M.curve(0),M.p);near(H.dot(M.normal,[0,0,1])*M.kappa,M.kn);
 }
});
test('torus curvature agrees with surface derivatives and finite Gauss area agrees with separate quadrature',()=>{
 for(const R of[1.05,1.8,2.8])for(const turn of[0,.13,.25,.37123456789,.5,.75]){
  const q=H.torusData(turn,R),F=H.forms(H.torusJet(.3,H.TAU*turn,R));near(F.K,q.K);near(F.H,q.H);
  for(const h of[.03,.24,.5]){let area=0,signed=0;const n=200,step=2*h/n;for(let j=0;j<=n;j++){const w=H.TAU*turn-h+j*step,wt=j===0||j===n?1:j%2?4:2,J=H.torusJet(.3,w,R),N=H.unit(H.cross(J.u,J.v)),Nu=[-Math.cos(w)*Math.sin(.3),Math.cos(w)*Math.cos(.3),0],Nv=[-Math.sin(w)*Math.cos(.3),-Math.sin(w)*Math.sin(.3),Math.cos(w)];area+=wt*H.len(H.cross(J.u,J.v));signed+=wt*H.dot(N,H.cross(Nu,Nv));}area*=step/3*2*h;signed*=step/3*2*h;const A=H.gaussArea(turn,h,R);near(area,A.area,2e-11);near(signed,A.signed,2e-11);near(signed/area,A.ratio,3e-11);}
  near(H.gaussArea(turn,0,R).ratio,q.K);
 }
 assert.ok(H.torusData(.25).K===0);assert.notEqual(H.torusData(.25).H,0);assert.ok(H.torusData(.5,1.05).H>0);assert.ok(H.torusData(.5,1.8).H<0);
});
test('point types and exact cardinal values do not collapse nonzero neighboring inputs',()=>{
 for(const[a,b,t,u]of[[1,.4,'elliptic',false],[1,-.4,'hyperbolic',false],[1,0,'parabolic',false],[0,0,'planar',true],[1,1,'elliptic',true],[1,1e-300,'elliptic',false],[1,-1e-300,'hyperbolic',false]])assert.deepEqual(H.classification(a,b),{type:t,umbilic:u,K:a*b,H:a/2+b/2});
 assert.ok(H.trigTurn(.25)[0]===0);assert.ok(H.trigTurn(.25-Number.EPSILON)[0]>0);assert.ok(H.trigTurn(.25+Number.EPSILON)[0]<0);
 assert.equal(H.spheroidData(.25,1.4).gap,0);assert.equal(H.spheroidData(0,1).gap,0);assert.ok(H.spheroidData(0,1+Number.EPSILON).gap>0);assert.ok(H.spheroidData(0,1-Number.EPSILON).gap<0);
});
test('revolution formulas match geometric derivatives and catenoid asymptotic tangents have zero second form',()=>{
 for(const kind of['sphere','cone','cylinder','catenoid'])for(const z of[-.9,-.37123456789,0,.3,.9]){
  const F=H.forms(H.revolutionJet(.63,z,kind)),Q=H.revolutionData(kind,z);near(F.K,Q.K);near(F.H,Q.H);near(F.f,0);near(F.e/F.E,Q.parallel);near(F.g/F.G,Q.meridian);
  if(kind==='sphere'){near(Q.K,1/2.25);near(Q.H,-1/1.5);}if(kind==='catenoid'){near(Q.H,0);near(Q.K,-1/Math.cosh(z)**4);near(F.e,-1);near(F.g,1);for(const sign of[-1,1])near(F.e+2*sign*F.f+F.g,0);}
 }
});
test('spheroid curvature gaps match direct ellipsoid tangent restrictions, including the poles',()=>{
 for(const c of[.5,.731,1,1.4,1.6])for(let j=-20;j<=20;j++){
  const Q=H.spheroidData(j/80,c),F=H.ellipsoidData(Q.p,1,1,c);near(Q.meridian*Q.parallel,F.K);near((Q.meridian+Q.parallel)/2,F.H);near(Q.gap,Q.meridian-Q.parallel);near(Math.abs(Q.gap),Math.abs(F.eigen.values[0]-F.eigen.values[1]));
 }
});
test('four triaxial umbilics satisfy the quadric and a separately differenced implicit Gauss map',()=>{
 for(const b of[1.05,1.23123456789,1.5,1.95]){
  const a=2,c=1,points=H.umbilics(a,b,c);assert.equal(new Set(points.map(p=>p.join(','))).size,4);
  for(const p of points){near((p[0]/a)**2+(p[1]/b)**2+(p[2]/c)**2,1);const F=H.ellipsoidData(p,a,b,c),k=-a*c/b**3;F.B.forEach((row,i)=>row.forEach((x,j)=>near(x,i===j?k:0)));
   const normal=q=>H.unit([q[0]/a**2,q[1]/b**2,q[2]/c**2]);for(const e of F.basis){const curve=t=>{const x=H.add(p,H.mul(e,t)),scale=Math.sqrt((x[0]/a)**2+(x[1]/b)**2+(x[2]/c)**2);return H.mul(x,1/scale);};vec(H.mul(diff(t=>normal(curve(t)),0),-1),H.mul(e,k),3e-9);}
  }
 }
 assert.throws(()=>H.umbilics(2,2,1),RangeError);
});
test('enclosing ellipsoid contact verifies the curvature lower bound and the distance second derivative',()=>{
 for(const a of[1.5,2,2.5])for(const b of[.8,1.4])for(const c of[.6,.75]){
  const Q=H.compactContact(a,b,c),F=H.ellipsoidData(Q.p,a,b,c);near(F.K,Q.K);Q.curvatures.forEach(k=>assert.ok(k>=Q.bound));assert.ok(Q.K>=Q.bound**2);
  for(const theta of[0,.2,.7,1.2]){const w=[0,Math.cos(theta),Math.sin(theta)],B=1/a**2,curvature=a*(w[1]**2/b**2+w[2]**2/c**2);assert.ok(2-2*a*curvature<=1e-12);assert.ok(curvature>=Math.sqrt(B));}
 }
 const disk=H.forms(H.graphJet(0,0,{a:0,b:0,c:0}));near(disk.K,0);near(disk.H,0);
});
test('DG6 preserves all frozen identities, synchronized metadata and written prerequisites',async()=>{
 const plan=JSON.parse(await readFile(new URL('../docs/wave-6-plan.json',import.meta.url),'utf8')),{items}=await loadAll(),chapter=items.filter(x=>x.col==='dg'&&x.chapter===6),all=new Set(items.map(x=>x.id));
 const S=(await import('../content/dg/syllabus.js')).default.chapters.find(x=>x.n===6),frozen=plan.chapters.find(x=>x.col==='dg'||x.collection==='dg');assert.equal(chapter.length,17);
 for(const it of chapter){const s=S.items.find(x=>x.num===it.num),p=(frozen.items||frozen.newItems).find(x=>x.num===it.num||x.id===it.id);assert.equal(it.name,s.name);assert.equal(it.kind,s.kind);assert.deepEqual(it.deps,s.deps);assert.deepEqual(it.refs,s.refs);assert.equal(it.name,p.name);assert.equal(it.kind,p.kind);for(const dep of it.deps)assert.ok(all.has(dep),dep);assert.equal(typeof it.viz,'function');}
});
