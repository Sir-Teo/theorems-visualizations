import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import chapter from '../content/geog/ch08.js';
import syllabus from '../content/geog/syllabus.js';
import * as H from '../content/geog/ch08.shared.js';
import {deaths,pumps} from '../content/geog/ch08.snow.js';
const near=(a,b,t=4e-12,abs=1e-14)=>assert.ok(Math.abs(a-b)<=abs+t*Math.max(Math.abs(a),Math.abs(b)),`${a} vs ${b}`);
test('GEOG8 preserves the eight frozen identities and complete Tobler Paper metadata',()=>{
 const plan=JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json',import.meta.url))).chapters.find(c=>c.collection==='geog'),s=syllabus.chapters.find(c=>c.n===8);assert.equal(chapter.items.length,8);assert.equal(s.summary,chapter.summary);
 for(let i=0;i<8;i++){for(const k of ['num','kind','name','deps','paper','introduces'])assert.deepEqual(chapter.items[i][k],plan.items[i][k]);for(const k of ['refs','links','verify'])assert.deepEqual(chapter.items[i][k],s.items[i][k]);assert.equal(s.items[i].pic,chapter.items[i].caption);assert.equal(typeof chapter.items[i].viz,'function');}
});
test('GEOG8 row weights have zero diagonal, no isolates and unit row sums',()=>{
 for(const mode of ['rook','queen']){const W=H.weights(H.grid(),mode);for(let i=0;i<9;i++){near(H.sum(W[i]),1);assert.equal(W[i][i],0);assert.ok(W[i].every(x=>x>=0));}assert.equal(W[4].filter(x=>x>0).length,mode==='rook'?4:8);}
});
test('GEOG8 Moran statistic is translation/scale invariant and not defined at zero variance or zero weights',()=>{
 const a=H.field('smooth'),W=H.weights(H.grid()),q=H.moran(a,W);near(q.I,H.moran(a.map(x=>7-3*x),W).I);near(H.moran(H.field('checkerboard'),W).I,-1);assert.equal(H.moran(H.field('constant'),W).I,null);assert.equal(H.moran(a,W.map(r=>r.map(()=>0))).I,null);
});
test('GEOG8 permutation expectation follows exact enumeration on a six-site ring',()=>{
 const W=Array.from({length:6},(_,i)=>Array.from({length:6},(_,j)=>j===(i+1)%6||j===(i+5)%6?.5:0));let total=0,count=0;function visit(a,left){if(!left.length){total+=H.moran(a,W).I;count++;return;}left.forEach((x,j)=>visit([...a,x],left.filter((_,i)=>i!==j)));}visit([],[1,2,3,4,5,6]);assert.equal(count,720);near(total/count,-1/5);
});
test('GEOG8 permutation p-values include observed state and ties and are reproducible',()=>{
 const W=H.weights(H.grid()),a=H.permutation(H.field('smooth'),W,23);assert.deepEqual(a,H.permutation(H.field('smooth'),W,23));assert.ok(a.p>=1/200&&a.p<=1);assert.equal(a.rep.length,199);const b=H.permutation(H.field('constant'),W);assert.equal(b.p,null);assert.deepEqual(b.rep,[]);
});
test('GEOG8 kriging, clipped Voronoi geometry, radial integrals and Snow assignments match independent references',()=>{
 const refs=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-geog-reference.json',import.meta.url)));let count=0;
 for(const r of refs.cases){if(r.kind==='kriging'){const q=H.kriging(H.observations,...r.point,r.length,r.nugget);q.weights.forEach((v,i)=>near(v,r.weights[i]));near(q.value,r.value);near(q.variance,r.variance,2e-11,3e-14);}else if(r.kind==='radial')near(H.radialMass(r.radius,r.length,r.mode,r.power),r.value,4e-11,1e-30);else if(r.kind==='voronoi'){const cells=H.voronoi(r.points);cells.forEach((cell,i)=>{near(H.area(cell),r.regions[i].area,2e-11);for(const p of cell)assert.ok(Math.min(...r.regions[i].vertices.map(q=>Math.hypot(p[0]-q[0],p[1]-q[1])))<2e-10);});}else{const counts=Array(13).fill(0);for(const [x,y]of deaths)counts[H.nearest(pumps.map(p=>[p.x,p.y]),x,y,r.metric==='cityblock'?'Manhattan':'Euclidean').index]++;assert.deepEqual(counts,r.counts);}count++;}assert.equal(count,143);
});
test('GEOG8 Voronoi cells partition the square and have the exact central-diamond area',()=>{
 const cells=H.voronoi([...H.sites,[5,5]]);near(H.area(cells[4]),18);cells.slice(0,4).forEach(c=>near(H.area(c),20.5));near(H.sum(cells.map(H.area)),100);
 for(const c of cells)for(const p of c){assert.ok(p[0]>=-1e-12&&p[0]<=10+1e-12&&p[1]>=-1e-12&&p[1]<=10+1e-12);}
});
test('GEOG8 coincident-site ties do not double-count a Voronoi area',()=>{
 const cells=H.voronoi([...H.sites,[2,2]]);assert.deepEqual(cells[4],[]);near(H.sum(cells.map(H.area)),100);assert.deepEqual(H.nearest([...H.sites,[2,2]],2,2).ties,[0,4]);
});
test('GEOG8 distinct nearby sites retain a unique exact hit and their bisector displacement',()=>{
 const p=[2,2.0000000000001],sites=[...H.sites,p],q=H.nearest(sites,2,2);assert.deepEqual(q.ties,[0]);assert.ok(q.distances[4]>0);
 const cells=H.voronoi(sites),top=Math.max(...cells[0].map(p=>p[1])),mid=(2+p[1])/2;assert.ok(top>2);near(top,mid,4e-16,0);near(H.sum(cells.map(H.area)),100);
});
test('GEOG8 IDW interpolates positive-power samples and has a deliberately separate zero-power convention',()=>{
 for(const p of H.observations){const q=H.idw(H.observations,p[0],p[1],2);near(q.value,p[2]);near(H.sum(q.weights),1);}
 const mean=H.sum(H.observations.map(p=>p[2]))/4;near(H.idw(H.observations,2,2,0).value,mean);
 for(const point of [[0,0],[5,5],[10,10]])for(const power of [.01,1,4]){const q=H.idw(H.observations,...point,power);assert.ok(q.weights.every(x=>x>=0));assert.ok(q.value>=1&&q.value<=5);}
});
test('GEOG8 ordinary kriging honors unbiasedness, original constrained equations and exact noiseless samples',()=>{
 for(const [x,y]of [[0,0],[2,2],[5,5],[10,10]])for(const length of [.2,2,6])for(const noise of [0,.1,1]){
  const q=H.kriging(H.observations,x,y,length,noise);near(H.sum(q.weights),1);q.C.forEach((r,i)=>near(H.sum(r.map((a,j)=>a*q.weights[j]))+q.lagrange,q.c[i]));assert.ok(q.variance>=0);assert.ok(q.rawVariance>=-q.varianceTolerance);const constant=H.observations.map(p=>[p[0],p[1],2.7]);near(H.kriging(constant,x,y,length,noise).value,2.7);
 }
 H.observations.forEach(p=>{const q=H.kriging(H.observations,p[0],p[1]);near(q.value,p[2]);near(q.variance,0,1e-12,2e-14);});
});
test('GEOG8 radial integration has the correct ring derivative and logarithmic exponent limits',()=>{
 for(const mode of ['exponential','power law'])for(const power of [1,1+1e-12,2-1e-12,2,4])for(const r of [.01,1,12]){const h=r*1e-5,a=H.radialMass(r+h,2,mode,power),b=H.radialMass(r-h,2,mode,power);near((a-b)/(2*h),2*Math.PI*r*H.distanceKernel(r,2,mode,power),5e-8);}
 near(H.radialMass(1000,2,'exponential'),2*Math.PI*4);near(H.radialMass(1e-10,2),Math.PI*1e-20,1e-9,1e-35);
});
test('GEOG8 historical transcription retains 578 coordinate records and all thirteen named pumps',()=>{
 assert.equal(deaths.length,578);assert.equal(pumps.length,13);assert.equal(pumps[6].name,'Broad St');assert.deepEqual(deaths[0],[13.58801,11.0956]);assert.ok(deaths.every(p=>p.length===2&&p.every(Number.isFinite)));assert.equal(new Set(pumps.map(p=>p.name)).size,13);
});
test('GEOG8 adoption stops without information, is monotone and replays exactly from a seed',()=>{
 const q=H.adoption({contact:0,external:0});assert.ok(q.counts.every(x=>x===1));const a=H.adoption({seed:12,generations:24}),b=H.adoption({seed:12,generations:24});assert.deepEqual(a.when,b.when);a.counts.forEach((n,i)=>{assert.equal(n,a.states[i].filter(Boolean).length);assert.equal(n,a.when.filter(t=>t!==null&&t<=i).length);assert.ok(n>=1&&n<=64);if(i)assert.ok(n>=a.counts[i-1]);});
});
test('GEOG8 urban kernel preserves mass before growth for every redistribution strength',()=>{
 for(const length of [.2,1,3])for(const mixing of [0,.6,1])for(const growth of [0,.05,.15]){const q=H.urban({length,mixing,growth,steps:20});near(H.sum(q.kernel.map(k=>k.w)),1);assert.ok(q.P.every(x=>x>=0));near(q.total,q.initialTotal*(1+growth)**20,2e-13);}
 const q=H.urban({mixing:0,growth:0});assert.deepEqual(q.P,q.initial);
});
