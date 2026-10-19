import test from 'node:test';
import assert from 'node:assert/strict';
import { relevantSubsetCoverage } from '../content/stat/ch08-b.js';
import { BH1995_P_VALUES } from '../content/stat/ch07-b.js';
import { procs } from '../content/stat/ch07.shared.js';
import { binIntervals, binCover } from '../content/stat/ch08.shared.js';

test('uniform relevant-subset integrals match an independent two-dimensional sample-space calculation',()=>{
 for(const d of [.05,.29,.5,.71,.95]){
  const result=relevantSubsetCoverage(d);let nhi=0,nlo=0,hhi=0,hlo=0;const n=1500;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){
   const x=(i+.5)/n-.5,y=(j+.5)/n-.5,cover=Math.min(x,y)<=0&&Math.max(x,y)>=0;
   if(Math.abs(x-y)>=d){nhi++;hhi+=cover;}else{nlo++;hlo+=cover;}
  }
  assert.ok(Math.abs(result.pa-nhi/(n*n))<.001);
  assert.ok(Math.abs(result.hi-hhi/nhi)<.001);assert.ok(Math.abs(result.lo-hlo/nlo)<.001);
  assert.ok(Math.abs(result.hi*result.pa+result.lo*(1-result.pa)-.5)<1e-14);
 }
 assert.equal(relevantSubsetCoverage(.5).hi,1);assert.ok(Math.abs(relevantSubsetCoverage(.5).lo-1/3)<1e-14);
});

test('BH1995 original fifteen p-values reproduce the four-versus-three rejection example',()=>{
 assert.deepEqual(BH1995_P_VALUES,[.0001,.0004,.0019,.0095,.0201,.0278,.0298,.0344,.0459,.3240,.4262,.5719,.6528,.7590,1]);
 const r=procs(BH1995_P_VALUES,.05);assert.equal(r.bh,4);assert.equal(r.holm,3);assert.equal(r.bonf,3);
});

test('inverted binomial belts have at-least-nominal coverage, including boundary parameters',()=>{
 for(const level of [.8,.95,.99])for(const n of [2,5,20]){
  const intervals=binIntervals('cp',n,level);
  for(const p of [0,.001,.05,.2,.5,.8,.95,.999,1]){
   let choose=1,cover=0;
   for(let k=0;k<=n;k++){
    const probability=choose*p**k*(1-p)**(n-k);
    if(intervals[k][0]-1e-12<=p&&p<=intervals[k][1]+1e-12)cover+=probability;
    choose*= (n-k)/(k+1);
   }
   assert.ok(cover>=level-1e-10,`${n},${p},${level}: ${cover}`);
   assert.ok(Math.abs(binCover('cp',n,level,p)-cover)<1e-8);
  }
 }
});

test('complete relabelling p-values obey the null level bound with ties and skewed observations',()=>{
 for(const values of [[0,1,2,3,4,100],[0,0,0,1,1,1]]){
  const statistics=[];for(let a=0;a<6;a++)for(let b=a+1;b<6;b++)for(let c=b+1;c<6;c++)statistics.push(Math.abs((values[a]+values[b]+values[c])/3-(values.reduce((s,x)=>s+x,0)-values[a]-values[b]-values[c])/3));
  const ps=statistics.map(t=>statistics.filter(x=>x>=t-1e-12).length/statistics.length);
  for(const alpha of [.01,.05,.1,.2,.5,1])assert.ok(ps.filter(p=>p<=alpha).length/ps.length<=alpha+1e-12);
 }
});
