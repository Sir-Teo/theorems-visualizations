import test from 'node:test';
import assert from 'node:assert/strict';
import {foil,pressure,rad,thin,shed,transit,lifting,TAU} from '../content/fluid/ch05.shared.js';
const near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<e,`${a} versus ${b}; tolerance ${e}`);
test('circle family encloses pole and rear critical point; cusp and plate geometry',()=>{
 for(const d of[.02,.12,.22])for(const h of[-.16,0,.16]){const P=foil(d,h);near(Math.hypot(1+d,h),P.R);assert.ok(Math.hypot(d,h)<P.R);assert.ok(Math.hypot(-1+d,h)<P.R);near(P.zOf([1,0])[0],2);near(Math.hypot(...P.dz([1,0])),0);assert.ok(P.boundary.every(p=>p.every(Number.isFinite)));}
 const P=foil(0,0);near(P.chord,4);for(const p of P.boundary)near(p[1],0);
});
test('Kutta numerator cancellation and two-sided finite edge speed; nonKutta divergence is resolved',()=>{
 for(const h of[0,.06,.15])for(const a of[rad(2),rad(12)]){const P=foil(.12,h,a);near(Math.hypot(...P.Wz([1,0])),0,1e-13);const plus=Math.hypot(...P.surface(P.edge+1e-5).q),minus=Math.hypot(...P.surface(P.edge-1e-5).q);near(plus,minus,5e-5);assert.ok(plus<2);const N=foil(.12,h,a,.4),v1=Math.hypot(...N.surface(N.edge+.001).q),v2=Math.hypot(...N.surface(N.edge+.00001).q);assert.ok(v2/v1>80);}
});
test('Bernoulli surface quadrature recovers Kutta–Joukowski lift and zero drag with convergence',()=>{
 for(const d of[.02,.12,.22])for(const a of[-15,0,15]){const P=foil(d,0,rad(a)),f=pressure(P,2048),coarse=pressure(P,512),left=-1-2*d,c=2-left-1/left;near(P.chord,c,1e-12);near(P.cl,8*Math.PI*(1+d)/c*Math.sin(rad(a)),1e-12);near(f.cl,P.cl,1e-5);near(f.cd,0,1e-5);if(a!==0)assert.ok(Math.abs(f.cl-P.cl)<Math.abs(coarse.cl-P.cl)/10);}
 // Cambered chord is sampled, so compare force using that same declared chord.
 const P=foil(.12,.1,rad(6));near(pressure(P).cl,P.cl,1e-5);
});
test('normal velocity on the mapped circle vanishes and surface circulation has declared sign',()=>{
 const P=foil(.12,.08,rad(7));let circ=0,normal=0;const n=4096,dt=TAU/n;
 for(let j=0;j<n;j++){const t=P.edge+(j+.5)*dt,a=P.zOf(P.point(t-dt/2)),b=P.zOf(P.point(t+dt/2)),q=P.surface(t).q,dx=b[0]-a[0],dy=b[1]-a[1];circ+=q[0]*dx+q[1]*dy;normal=Math.max(normal,Math.abs(q[0]*dy-q[1]*dx));}
 near(circ,-P.G,1e-5);assert.ok(normal<2e-6);
});
test('thin sheet force and nose-up quarter-chord moment match Fourier formulas',()=>{
 for(const a of[-6,3,8])for(const m of[-.04,0,.04])for(const r of[-.06,0,.06]){const F=thin(rad(a),m,r);near(F.lift,F.cl,1e-10);near(F.moment,F.cm,1e-7);near(F.gamma(Math.PI),0,1e-14);near(F.cl,2*Math.PI*(rad(a)-r/4+2*m));}
 const F=thin(0,.03,0);near(F.cm,-Math.PI*.03);near(F.cl,4*Math.PI*.03);
});
test('wake budget exactly compensates bound circulation for entire prescribed parameter domain',()=>{
 for(const t of[0,.1,3,6])for(const T of[.2,.6,2]){const B=shed(t,T);near(B.sum,0,1e-14);near(B.bound,1-Math.exp(-t/T));assert.ok(B.wake.every(p=>p.g<=0&&p.x>=2));}
});
test('equal-clock particle counterexample is integrated with converged unequal arrival times',()=>{
 const symmetric=foil(.12,0,0);near(transit(symmetric,.8).arrival,transit(symmetric,-.8).arrival,1e-10);
 for(const a of[2,7,10])for(const h of[.65,1.1]){const P=foil(.12,0,rad(a)),A=transit(P,h),B=transit(P,-h);assert.ok(A.arrival&&B.arrival);assert.ok(B.arrival>A.arrival+.05);near(A.arrival,transit(P,h,.002).arrival,1e-5);near(B.arrival,transit(P,-h,.002).arrival,1e-5);assert.ok(Math.max(...A.path.map(p=>Math.abs(p[1])))<2);assert.ok(Math.max(...B.path.map(p=>Math.abs(p[1])))<2);}
});
test('lifting-line span quadrature equals Fourier drag and elliptic minimum',()=>{
 for(const AR of[4,8,18])for(const CL of[.2,.7,1.2])for(const r of[-.25,0,.25]){const F=lifting(AR,CL,r);let lift=0,drag=0;const n=4096;for(let j=0;j<n;j++){const t=Math.PI*(j+.5)/n,dy=Math.sin(t)*Math.PI/n;lift+=F.gamma(t)*dy;drag+=F.gamma(t)*F.down(t)*dy;assert.ok(F.gamma(t)>=0);}near(lift,CL,1e-12);near(drag,F.cdi,1e-12);near(F.cdi,CL*CL/(Math.PI*AR*F.e),1e-12);assert.ok(F.cdi>=lifting(AR,CL,0).cdi);}
});
