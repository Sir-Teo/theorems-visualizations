import test from 'node:test';
import assert from 'node:assert/strict';
import {VAULT,vaultHeight,vaultAccounting,vaultWebLoads,vaultRib,validVaultCamera,canonicalVaultYaw} from '../content/arch/vault-audit.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} ≈ ${b}`);
const integrate=(f,a,b,n=2000)=>{let z=f(a)+f(b);for(let i=1;i<n;i++)z+=(i%2?4:2)*f(a+(b-a)*i/n);return z*(b-a)/(3*n);};
test('groin open arches, cylinder membership, diagonals and symmetry over a complete square grid',()=>{const R=3;for(let i=0;i<=120;i++)for(let j=0;j<=120;j++){const x=-R+2*R*i/120,y=-R+2*R*j/120,z=vaultHeight(x,y);near(Math.min(Math.abs(x*x+z*z-R*R),Math.abs(y*y+z*z-R*R)),0);near(z,vaultHeight(y,x));near(z,vaultHeight(-x,-y));assert.ok(z>=vaultHeight(x,y,R,'barrel'));}for(let i=0;i<=120;i++){const s=-R+2*R*i/120,h=Math.sqrt(Math.max(0,R*R-s*s));near(vaultHeight(R,s),h);near(vaultHeight(s,R),h);near(vaultHeight(s,s),h);near((Math.SQRT2*s)**2/(2*R*R)+h*h/(R*R),1);}assert.equal(vaultHeight(0,3),3);assert.equal(vaultHeight(3,0),3);assert.equal(vaultHeight(3,3),0);});
test('independent surface-area and three-hinge integrals reproduce authored weights/reactions at multiple scales',()=>{for(const R of[.5,3,8])for(const t of[.08,.3,.5])for(const gamma of[1,22]){const c=vaultAccounting(t,R,gamma),w=t*gamma;
 // One cylindrical family: y strip length 2(R-|x|); x=R sin(theta).
 const groinArea=8*R*R*integrate(th=>1-Math.sin(th),0,Math.PI/2),barrelArea=4*R*R*integrate(()=>1,0,Math.PI/2);
 near(c.groinArea,groinArea);near(c.barrelArea,barrelArea);near(c.Wgroin,w*groinArea);near(c.Wbarrel,w*barrelArea);
 const diagonal=4*w*R*R*integrate(th=>th*Math.cos(th),0,Math.PI/2),H=Math.SQRT2/R*2*w*R**3*integrate(th=>th*(1-Math.sin(th))*Math.cos(th),0,Math.PI/2);
 near(diagonal,c.Wgroin/2);near(H,c.Hdiagonal);near(c.Hbarrel,w*R*integrate(th=>1-Math.sin(th),0,Math.PI/2));near(c.corner,c.Wgroin/4);near(c.wall*4*R,c.Wbarrel);
 }});
test('all 24 tributary masses and first moments agree with independent transformed quadrature, including springing bins',()=>{for(const t of[0,.08,.15,.3,.5]){const a=vaultWebLoads(t);assert.equal(a.length,24);let W=0,M=0;for(const l of a){const a0=Math.asin(Math.min(Math.abs(l.s0),Math.abs(l.s1))/3),a1=Math.asin(Math.max(Math.abs(l.s0),Math.abs(l.s1))/3),P=2*22*t*9*integrate(th=>th*Math.cos(th),a0,a1,400),moment=2*22*t*27*Math.SQRT2*integrate(th=>th*Math.sin(th)*Math.cos(th),a0,a1,400)*Math.sign(l.x);near(l.P,P);near(l.P*l.x,moment);assert.ok(l.x>=Math.SQRT2*l.s0&&l.x<=Math.SQRT2*l.s1);W+=l.P;M+=l.P*l.x;}near(W,4*22*t*9*(Math.PI/2-1));near(M,0);for(let i=0;i<12;i++){near(a[i].P,a[23-i].P);near(a[i].x,-a[23-i].x);}}});
// Independent area/centroid through a triangle fan, not the production shoelace sums.
function triangleAreaCentroid(poly){let area=0,mx=0,my=0;for(let i=1;i<poly.length-1;i++){const[a,b,c]=[poly[0],poly[i],poly[i+1]],A=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;area+=A;mx+=A*(a[0]+b[0]+c[0])/3;my+=A*(a[1]+b[1]+c[1])/3;}return{area,x:mx/area,y:my/area};}
test('declared 2×43×91 reference grid within continuous domains: independent polygon statics, all joint force/moment balances and full finite traces',()=>{let yes=0,no=0;for(const web of[false,true])for(let it=8;it<=50;it++)for(let id=10;id<=100;id++){const m=vaultRib({web,webThickness:it/100,ribDepth:id/100}), own=m.g.blocks.map(b=>{const c=triangleAreaCentroid(b.poly);near(c.area,b.area);near(c.x,b.cx);near(c.y,b.cy);return{P:c.area*22*.3,x:c.x};}),loads=[...own,...m.loads];
 assert.equal(m.joints.length,25);assert.equal(m.loads.length,24);assert.equal(m.g.blocks.length,24);near(m.V*2,loads.reduce((s,l)=>s+l.P,0));near(m.H*3,loads.filter(l=>l.x<0).reduce((s,l)=>s+l.P*(Math.SQRT2*3+l.x),0));
 for(const j of m.joints){const before=[...own.slice(0,j.i),...m.loads.slice(0,j.i)],p=j.point,fx=m.H,fy=m.V-before.reduce((s,l)=>s+l.P,0);near(j.force[0],fx);near(j.force[1],fy);const moment=(-Math.SQRT2*3-p[0])*m.V+p[1]*m.H-before.reduce((s,l)=>s+l.P*(l.x-p[0]),0);near(moment,0,2e-9);assert.ok([...p,...j.force,j.fraction,j.compression,j.residual].every(Number.isFinite));assert.ok(j.compression>0);assert.equal(j.inside,j.fraction>=-1e-8&&j.fraction<=1+1e-8);const r=m.joints[24-j.i];near(j.point[0],-r.point[0]);near(j.point[1],r.point[1]);}
 for(const i of[0,12,24])near(m.joints[i].fraction,.5);near(m.Wweb,web?vaultAccounting(it/100).Wgroin/2:0);near(m.residual,0,2e-9);m.contained?yes++:no++;}assert.ok(yes>0&&no>0);console.log({gridStates:2*43*91,contained:yes,outside:no});});
test('model endpoints and off-grid values remain meaningful; chosen candidate failure is not a minimum-depth solver',()=>{for(const d of[.1,.100001,.437,.7,1])for(const t of[.08,.080001,.3333,.5])for(const web of[false,true]){const m=vaultRib({ribDepth:d,webThickness:t,web});for(let i=0;i<=24;i++){const j=m.g.joints[i],p=m.pts[i],q0=m.pts[Math.max(0,i-1)],q1=m.pts[Math.min(24,i+1)];near((j.a[0]+j.b[0])/2,p[0]);near((j.a[1]+j.b[1])/2,p[1]);near(Math.hypot(j.a[0]-j.b[0],j.a[1]-j.b[1]),d);near((j.b[0]-j.a[0])*(q1[0]-q0[0])+(j.b[1]-j.a[1])*(q1[1]-q0[1]),0);near(p[0]*p[0]/18+p[1]*p[1]/9,1);}assert.ok(m.total>0&&m.H>0&&m.V>0);assert.equal('dmin'in m,false);assert.ok(m.excess>=0);if(!web)near(m.Wweb,0);}assert.equal(vaultRib({ribDepth:.1}).contained,false);assert.equal(vaultRib({ribDepth:1}).contained,true);
 for(const d of[{ribDepth:.099},{ribDepth:1.01},{webThickness:.079},{webThickness:.501},{web:1},{ribDepth:NaN}])assert.throws(()=>vaultRib(d));for(const args of[[0,0,0],[4,0],[0,0,3,'other']])assert.throws(()=>vaultHeight(...args));assert.throws(()=>vaultWebLoads(.3,3,22,23));assert.throws(()=>vaultAccounting(0));});
test('multi-bay weight accounting and bounded camera replay schema',()=>{const c=vaultAccounting();for(let n=1;n<=3;n++){let total=0,fx=0,fy=0;for(let i=0;i<=n;i++)for(const s of[-1,1]){const adj=i===0||i===n?1:2;total+=adj*c.corner;fx+=i===0?-1:i===n?1:0;fy+=s*adj;}near(total,n*c.Wgroin);near(fx,0);near(fy,0);}for(const yaw of[-Math.PI,0,Math.PI])for(const pitch of[-1.45,0,1.45])assert.equal(validVaultCamera({yaw,pitch}),true);for(const d of[null,{yaw:0,pitch:1.46},{yaw:4,pitch:0},{yaw:NaN,pitch:0},{yaw:0}])assert.equal(validVaultCamera(d),false);for(const yaw of[-123.2,456.8]){const y=canonicalVaultYaw(yaw);assert.equal(canonicalVaultYaw(y),y);assert.ok(Math.abs(y)<=Math.PI);near(Math.cos(y),Math.cos(yaw));near(Math.sin(y),Math.sin(yaw));}});
// Independent ruled-quadrilateral integration from the counter-review. Because
// cx(d)=C0+C2*d², its extrema on [.1,1] occur at those depth endpoints.
test('continuous depth domain: positive area/Jacobian and support levers bound all joint denominators away from zero',()=>{
 const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],R=3,a=Math.SQRT2*R,N=24;
 const pts=Array.from({length:N+1},(_,i)=>{const s=-R+2*R*i/N;return[Math.SQRT2*s,Math.sqrt(Math.max(0,R*R-s*s))];});
 const normals=pts.map((p,i)=>{const l=pts[Math.max(0,i-1)],r=pts[Math.min(N,i+1)],dx=r[0]-l[0],dy=r[1]-l[1],L=Math.hypot(dx,dy);return[-dy/L,dx/L];});
 let areaMin=Infinity,jacMin=Infinity,leverMin=Infinity,crownMin=Infinity;
 for(let i=0;i<N;i++){
  const p=pts[i],D=pts[i+1].map((v,k)=>v-p[k]),n=normals[i],E=normals[i+1].map((v,k)=>v-n[k]),j00=cross(D,n),j01=cross(D,E),j10=cross(E,n),A0=j00+j01/2;
  const C0=(p[0]*j00+(p[0]*j01+D[0]*j00)/2+D[0]*j01/3)/A0,C2=j10*(n[0]+normals[i+1][0])/24/A0;
  areaMin=Math.min(areaMin,A0);for(const s of[0,1])for(const u of[-.5,.5])jacMin=Math.min(jacMin,j00+j01*s+j10*u);
  for(const d of[.1,1])if(i<12){const x=C0+C2*d*d;leverMin=Math.min(leverMin,a+x);crownMin=Math.min(crownMin,-x);}
  for(const d of[.1,.100001,.123456789,.43703,.7,1]){const m=vaultRib({web:false,ribDepth:d});near(d*A0,m.g.blocks[i].area);near(C0+C2*d*d,m.g.blocks[i].cx);}
 }
 assert.ok(areaMin>.35&&jacMin>.32&&leverMin>.16&&crownMin>.17);
 // Own and web loads are positive and strictly inside each half-span; thus H>0.
 // On ascending/descending halves, shear and tangent-y have the same sign.
 // Therefore F·tau=H*tau-x+shear*tau-y>0 and M(a)-M(b)≠0 for every joint.
});
