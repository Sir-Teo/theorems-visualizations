import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projection,interpolate,smallCircle,destination,centralAngle,bearing} from '../assets/js/viz/kits/globe.js';
import {conic} from '../content/geog/ch05.shared.js';
import {PROJ,mollTheta,distort,sphereGrid,GOODE_PHI0,icosa} from '../content/geog/ch06.shared.js';
const D=Math.PI/180,near=(a,b,t)=>assert.ok(Math.abs(a-b)<t,`${a} vs ${b}`);
test('azimuthal map radial and principal scales match independent spherical geometry',()=>{
 const ctr=[10,35];
 for(const [name,r,h,k] of [['gnomonic',c=>Math.tan(c),c=>1/Math.cos(c)**2,c=>1/Math.cos(c)],['stereographic',c=>2*Math.tan(c/2),c=>1/Math.cos(c/2)**2,c=>1/Math.cos(c/2)**2],['orthographic',c=>Math.sin(c),c=>Math.cos(c),()=>1],['azimuthalEquidistant',c=>c,()=>1,c=>c/Math.sin(c)]]){
  const P=projection(name,{center:ctr});
  for(const c of [10,35,60])for(const brg of [0,47,130]){
   const q=destination(ctr,brg,c),xy=P.forward(q),J=P.tissot(q);near(Math.hypot(...xy),r(c*D),1e-12);
   near(J.a,Math.max(h(c*D),k(c*D)),2e-5);near(J.b,Math.min(h(c*D),k(c*D)),2e-5);
   if(name==='azimuthalEquidistant'){near(Math.atan2(xy[0],xy[1])/D,(brg>180?brg-360:brg),1e-9);near(Math.hypot(...xy)/D,centralAngle(ctr,q),1e-9);}
  }
 }
});
test('gnomonic great circles are straight and stereographic circles remain circles beyond antipode containment',()=>{
 const P=projection('gnomonic',{center:[10,35]});const a=[-20,15],b=[50,60],pa=P.forward(a),pb=P.forward(b);
 for(const q of interpolate(a,b,100)){const p=P.forward(q);near((pb[0]-pa[0])*(p[1]-pa[1])-(pb[1]-pa[1])*(p[0]-pa[0]),0,1e-12);}
 const S=projection('stereographic',{center:[0,90],clip:179});
 for(const c of [30,120,160])for(const rho of [15,40]){
  if(c+rho===180)continue;
  const cen=destination([0,90],0,c),den=Math.cos(c*D)+Math.cos(rho*D),rad=2*Math.sin(c*D)/den,R=2*Math.sin(rho*D)/Math.abs(den),p0=S.forward(cen),n=Math.hypot(...p0),cx=rad*p0[0]/n,cy=rad*p0[1]/n;
  for(const p of smallCircle(cen,rho,100)){const xy=S.forward(p);if(xy)near(Math.hypot(xy[0]-cx,xy[1]-cy),R,2e-9);}
 }
});
test('equidistant conic preserves meridian spacing and both standard parallels including tangent limit',()=>{
 for(const pair of [[20,60],[10,10],[80,80]]){
  const [a,b]=pair.map(x=>x*D),C=conic('eqdc',a,b,0);near(C.k(a),1,1e-13);near(C.k(b),1,1e-13);
  const p=C.fwd(.3,.2),q=C.fwd(.3,.5);near(Math.hypot(q[0]-p[0],q[1]-p[1]),.3,1e-13);
  if(a===b)near(C.n,Math.sin(a),1e-13);
 }
});
test('sinusoidal Jacobian and safeguarded Mollweide solver satisfy source equations',()=>{
 for(const la of [-2,-.3,1.7])for(const f of [-1.2,0,.7,1.2]){
  const J=distort(PROJ.sinu.fwd,la,f);near(J.area,1,1e-8);near(J.h*J.k*Math.sin(J.theta*D),1,1e-8);
 }
 for(const deg of [-90,-89.999,-80,-45,0,45,80,89.999,90]){
  const f=deg*D,t=mollTheta(f);assert.ok(Math.abs(t)<=Math.PI/2);near(2*t+Math.sin(2*t),Math.PI*Math.sin(f),2e-13);
 }
 for(const f of [-1.2,-.7,0,.7,1.2])near(distort(PROJ.moll.fwd,.4,f).area,1,3e-7);
});
test('sphere quadrature weights equal-area bands equally and Goode join is continuous',()=>{
 const grid=sphereGrid();assert.equal(grid.length,34*68);near(grid.reduce((s,p)=>s+Math.sin(p[1])**2,0)/grid.length,1/3,1/34**2);
 const eps=1e-8;for(const l of [-2,0,2]){const a=PROJ.goode.fwd(l,GOODE_PHI0-eps),b=PROJ.goode.fwd(l,GOODE_PHI0+eps);near(a[0],b[0],1e-7);near(a[1],b[1],1e-7);}
 const I=icosa();assert.equal(I.faces.length,20);assert.equal(I.outline.length/2,11);near(I.edgeAngle,Math.acos(1/Math.sqrt(5)),1e-14);
});
test('compromise projections reproduce primary tabular nodes and geometric limiting cases',()=>{
 // Snyder table41 gives coordinates divided by pi (map radius1) at lon90°,lat80°.
 const g=PROJ.vdg.fwd(Math.PI/2,80*D);near(g[0]/Math.PI,.31293,6e-6);near(g[1]/Math.PI,.65778,6e-6);
 // PROJ9.5.1 Robinson c0 node values, not this atlas's interpolated outputs.
 const r=PROJ.robinson.fwd(1,30*D);near(r[0],.8487*.96,1e-13);near(r[1],1.3523*.372,1e-13);
 for(const l of [-2,.4,2])near(PROJ.winkel.fwd(l,0)[0],l*(1+2/Math.PI)/2,1e-13);
 for(const f of [-1.2,.6,1.2])near(PROJ.winkel.fwd(0,f)[1],f,1e-13);
 const pole=PROJ.winkel.fwd(Math.PI,Math.PI/2),eq=PROJ.winkel.fwd(Math.PI,0);near(pole[0]/eq[0],2/(Math.PI+2),1e-13);
});
