import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';
import{founderModel,geneDiversity,FOUNDER_LOCI,FOUNDER_RUNS}from'../content/bighist/source-audit-founder.js';
const refs=JSON.parse(await readFile(new URL('../docs/verification/bighist-founder-reference.json',import.meta.url))),near=(a,b,t=3e-12)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('independent Python32bit/Bernoulli counts and rational moments reproduce every simulated locus',()=>{
 for(const ref of refs){const m=founderModel(ref.N,ref.K,ref.seed);m.p0.slice(0,10).forEach((p,i)=>near(p,ref.p0[i]));near(m.H0,+ref.H0);m.runs.forEach((r,i)=>r.hs.forEach((h,k)=>near(h,+ref.hs[i][k])));m.expected.forEach((h,i)=>near(h,+ref.expected[i]));const b=Buffer.alloc(20*400*2);m.runs.flatMap(r=>r.pEnd).forEach((p,i)=>b.writeUInt16LE(Math.round(p*2*m.N),i*2));assert.equal(createHash('sha256').update(b).digest('hex'),ref.finalCountsSHA256);}
});
test('binomial identity follows by exhaustive ideal gene draws, and cumulative small-loss condition is necessary',()=>{
 const n=4;for(const p of[.01,.2,.5,.9,.99]){let EH=0,mass=0,mean=0;for(let mask=0;mask<2**n;mask++){let x=0;for(let i=0;i<n;i++)x+=mask>>i&1;const prob=p**x*(1-p)**(n-x);mass+=prob;mean+=prob*x/n;EH+=prob*2*(x/n)*(1-x/n);}near(mass,1);near(mean,p);near(EH,2*p*(1-p)*(1-1/n));}
 const m=founderModel(2,24,3);assert.ok(m.expected.at(-1)/m.H0<.002);assert.ok(1-24/4<0,'first-order linear formula is invalid when cumulative loss is large');
});
test('step extension preserves every chain prefix and finite means/histograms are actual full samples',()=>{
 const a=founderModel(2,3,41),b=founderModel(2,24,41);assert.equal(FOUNDER_LOCI,400);assert.equal(FOUNDER_RUNS,20);assert.deepEqual(a.p0,b.p0);a.runs.forEach((r,i)=>assert.deepEqual(r.hs,b.runs[i].hs.slice(0,4)));
 for(const m of[a,b,founderModel(200,3,0)]){assert.ok(m.p0.every(p=>p>.01&&p<.99));m.runs.forEach(r=>{near(geneDiversity(r.pEnd),r.hs.at(-1));assert.ok(r.pEnd.every(p=>p>=0&&p<=1));r.pEnd.forEach(p=>near(p*2*m.N,Math.round(p*2*m.N)));});m.mean.forEach((h,k)=>near(h,m.runs.reduce((s,r)=>s+r.hs[k],0)/20));for(const h of[m.initialHist,m.finalHist]){near(h.reduce((s,x)=>s+x,0),1);h.forEach(x=>near(x*400,Math.round(x*400)));}near(m.fixed,m.runs[0].pEnd.filter(p=>p===0||p===1).length/400);}
 const first=founderModel(),again=founderModel();assert.deepEqual(first,again);first.p0[0]=99;first.runs[0].pEnd[0]=99;assert.deepEqual(founderModel(),again);assert.notDeepEqual(founderModel(10,16,4).p0,again.p0);
});
test('raw unsupported integer domains and types are rejected',()=>{for(let i=0;i<3;i++)for(const x of[[1,201,2.5,'10',null,NaN],[2,25,3.1,'3',null,Infinity],[-1,10000,.5,'3',null,NaN]][i]){const a=[10,16,3];a[i]=x;assert.throws(()=>founderModel(...a),RangeError);}});
