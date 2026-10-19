import test from 'node:test';
import assert from 'node:assert/strict';
import { twinSpacing, twinLayerShift, projectedRowPeriod, rowPhase, wrapRow, mirrorRowError, rowSites, hcpSignedShear, partialBalance, stackingRegistry } from '../content/mat/source-audit-dislocation-microstructure.shared.js';
const near=(a,b,e=1e-11)=>assert.ok(Math.abs(a-b)<e*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0), norm=a=>Math.hypot(...a), unit=a=>a.map(x=>x/norm(a));
test('fcc projected rows agree with independent three-dimensional lattice enumeration, including absent cropped parent rows',()=>{
 for(let m=-20;m<=20;m++)for(let w=-12;w<=12;w++){
  const u=2*m-w,v=0,x=(u+v-2*w)/(2*Math.sqrt(6));near(wrapRow(x-rowPhase(m)),0);
 }
 for(let lower=-6;lower<=2;lower++)for(let thickness=1;thickness<=9;thickness++)for(let m=lower+1;m<=lower+thickness;m++){
  near(mirrorRowError(m,lower,1),0);const sites=rowSites(m,rowPhase(m),-6.05,6.05);assert.ok(sites.length>0);for(const[x,y]of sites){assert.ok(x>=-6.05&&x<=6.05);near(y,m*twinSpacing);}
 }
 near(twinLayerShift/twinSpacing,1/Math.SQRT2);near(projectedRowPeriod,Math.sqrt(6)/4);assert.ok(mirrorRowError(1,0,.99)>.003);
});
test('full fcc shear followed by reflection maps primitive lattice generators by an integer unimodular correspondence',()=>{
 const n=unit([1,1,1]),l=unit([1,1,-2]),S=p=>p.map((x,i)=>x+dot(p,n)*l[i]/Math.SQRT2),F=p=>p.map((x,i)=>x-2*dot(p,n)*n[i]);
 const basis=[[0,.5,.5],[.5,0,.5],[.5,.5,0]], columns=basis.map(p=>{const q=F(S(p));return[-q[0]+q[1]+q[2],q[0]-q[1]+q[2],q[0]+q[1]-q[2]];});
 for(const c of columns)for(const x of c)near(x,Math.round(x));const[a,b,c]=columns;near(dot(a,[b[1]*c[2]-b[2]*c[1],b[2]*c[0]-b[0]*c[2],b[0]*c[1]-b[1]*c[0]]),-1);
 for(let u=-4;u<=4;u++)for(let v=-4;v<=4;v++)for(let w=-4;w<=4;w++){if((u+v+w)%2)continue;const r=F(S([u/2,v/2,w/2])).map(x=>2*x);for(const x of r)near(x,Math.round(x));near(r.reduce((s,x)=>s+x,0)/2,Math.round(r.reduce((s,x)=>s+x,0)/2));}
});
test('hcp signed shear reverses at the geometric degeneracy, with the published conventional magnitudes',()=>{near(hcpSignedShear(Math.sqrt(3)),0);assert.ok(hcpSignedShear(1.4)<0&&hcpSignedShear(1.95)>0);near(Math.abs(hcpSignedShear(Math.sqrt(8/3))),1/(6*Math.SQRT2));for(const g of[1.4,1.587,1.856,1.95])near(hcpSignedShear(g),g/Math.sqrt(3)-Math.sqrt(3)/g);});
test('partial balance matches independently projected Burgers components, physical units and energy minima at all parameter corners',()=>{
 const full=[-.5,0,.5],p1=[-2/6,1/6,1/6],p2=[-1/6,-1/6,2/6],n=unit([1,1,1]);for(let j=0;j<3;j++)near(p1[j]+p2[j],full[j]);near(dot(p1,p1)+dot(p2,p2),1/3);near(dot(full,full),1/2);
 for(const kind of['edge','screw'])for(const G of[20,45,80])for(const a of[.35,.3615,.42])for(const gamma of[8,45,250]){
  const l=kind==='screw'?unit(full):unit([n[1]*full[2]-n[2]*full[1],n[2]*full[0]-n[0]*full[2],n[0]*full[1]-n[1]*full[0]]),q=partialBalance(G,a,gamma,kind),s1=dot(p1,l),s2=dot(p2,l),edge=dot(p1,p2)-s1*s2;
  const C=G*1e9*(a*1e-9)**2/(2*Math.PI)*(s1*s2+edge/.66),d=C/(gamma*1e-3)*1e9;near(q.equilibrium,d);near(q.ratio(d),1);
  const eps=d*1e-4;assert.ok(q.energy(d-eps)>q.energy(d)&&q.energy(d+eps)>q.energy(d));near((q.energy(d+eps)-q.energy(d-eps))/(2*eps*1e-9),0,1e-8);
 }
 assert.throws(()=>partialBalance(20,.4,0,'edge'),RangeError);const q=partialBalance(45,.3615,45,'edge');near(q.equilibrium,3.072539077321829,1e-9);
});
test('intrinsic registry has exactly two hcp-like layers and full lattice slip restores the perfect letters',()=>{assert.equal(stackingRegistry().letters.join(''),'ABCABC');const q=stackingRegistry(true);assert.equal(q.letters.join(''),'ABCBCA');assert.deepEqual(q.hcp,[2,3]);assert.deepEqual(stackingRegistry().hcp,[]);});
