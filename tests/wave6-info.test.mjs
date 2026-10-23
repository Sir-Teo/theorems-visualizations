import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../content/info/ch06.shared.js';
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} ≠ ${b}`);

test('histogram entropy changes with scale and not with translation, including empty cells',()=>{
 const u=H.histogram([1],.25);near(u.entropy,-2);near(u.variance,1/192);
 const a=H.histogram([1,0,3,2],.3,-2),b=H.histogram([1,0,3,2],.6,1000);
 near(b.entropy-a.entropy,1);near(b.variance,4*a.variance);near(H.sum(a.p),1);
 assert.throws(()=>H.histogram([0,0]));assert.throws(()=>H.histogram([-1,2]));assert.throws(()=>H.histogram([1],0));
});
test('actual quantization overlaps preserve mass, recover aligned entropy and include moving endpoints',()=>{
 const h=H.histogram([1,0,3,2],.25),q=H.quantize(h,.25);near(q.corrected,h.entropy);near(q.mass,1);
 const u=H.histogram([1],1),x=H.quantize(u,.5,.25);assert.deepEqual(x.bins.map(b=>b.mass),[.25,.5,.25]);near(x.entropy,1.5);near(x.corrected,.5);
 for(const phase of [0,.17,.5,.999]){let last=Infinity;for(let j=1;j<=7;j++){const d=2**-j,r=H.quantize(h,d,phase*d);near(r.mass,1);assert(r.corrected>=h.entropy-1e-11);if(phase===0)assert(r.corrected<=last+1e-12);last=r.corrected;}assert(last-h.entropy<.06);}
 assert.throws(()=>H.quantize(h,1e-6));
});
test('linear density entropy integrates uniform and triangular laws exactly and is stable near equal endpoints',()=>{
 near(H.linearLogIntegral(2,2,3),6*Math.log(2));near(H.linearLogIntegral(0,1,1),-.25);near(H.linearLogIntegral(1,0,1),-.25);
 for(const d of [1e-12,1e-6,.01,.099,.1,.5,1]){const a=1,b=1-d,n=20000,dx=1/n;let integral=0;for(let i=0;i<n;i++){const y=a+(b-a)*(i+.5)/n;integral+=y*Math.log(y)*dx;}near(H.linearLogIntegral(a,b,1),integral,3e-9);}
});
test('convolution computes actual overlap segments, masses, entropy power and translation invariance',()=>{
 const u=H.histogram([1]);const c=H.convolve(u,u);near(c.mass,1);near(c.entropy,1/(2*Math.LN2));near(H.convolutionValue(u,u,.5),.5);near(H.convolutionValue(u,u,1),1);near(H.convolutionValue(u,u,1.5),.5);
 for(const a of [[1],[1,0,2],[0,1,0,3]])for(const b of [[1],[2,1],[1,0,1]]){const A=H.histogram(a,.17,-2),B=H.histogram(b,.31,3),C=H.convolve(A,B),D=H.convolve(H.histogram(a,.17,100),H.histogram(b,.31,-200));near(C.mass,1);near(C.entropy,D.entropy);assert(H.entropyPower(C.entropy)>=H.entropyPower(A.entropy)+H.entropyPower(B.entropy)-1e-10);}
});
test('matched families and constraint examples have the promised moments and entropy bounds',()=>{
 for(const variance of [.02,1,8])for(const mode of ['gaussian','uniform','laplace']){const f=H.family(mode,variance,3);near(f.mean,3);near(f.variance,variance);assert(f.entropy<=H.gaussianEntropy(variance)+1e-12);}
 const h=H.standardizedHistogram([1,0,4,2],2,-1);near(h.mean,-1);near(h.variance,2);
 for(const mode of ['support','nonnegative mean','variance']){const r=H.constraintExample(mode,2,[1,4,2,1]);assert(r.entropy<=r.bound+1e-12);if(mode==='support')near(r.H.right,2);if(mode==='nonnegative mean')near(r.mean,2);if(mode==='variance')near(r.variance,2);}
});
test('Gaussian capacity, bandwidth and energy formulas preserve endpoints and small positive values',()=>{
 near(H.awgn(1,1),.5);near(H.awgn(0,1),0);assert(H.awgn(1e-100,1)>0);assert.throws(()=>H.awgn(1,0));
 for(const p of [0,.001,1,100]){let previous=-1;for(const w of [.01,.1,1,10,1e4,1e10]){const c=H.hartley(p,2,w);assert(c>=previous-1e-12);assert(c<=p/(2*Math.LN2)+1e-10);previous=c;}}
 near(H.bitEnergy(0),Math.LN2);near(H.bitEnergy(1),1);near(H.bitEnergy(2),1.5);near(H.bitEnergy(1e-12),Math.LN2,1e-12);assert.throws(()=>H.bitEnergy(-1));
});
test('actual two-use codebooks enforce per-codeword power, reproducible noise and deterministic ties',()=>{
 const points=[[1,0],[0,1],[-1,0],[0,-1]],a=H.constellationExperiment(points,2,1,{seed:7}),b=H.constellationExperiment(points,2,1,{seed:7});assert.deepEqual(a,b);near(a.maxPower,2);near(a.averagePower,2);assert(a.errors>0&&a.errors<a.trials);
 for(const q of a.samples){const distances=a.code.map(p=>(p[0]-q.received[0])**2+(p[1]-q.received[1])**2);near(distances[q.decoded],Math.min(...distances));}
 const zero=H.constellationExperiment(points,0,1);assert(zero.samples.every(q=>q.decoded===0));near(zero.capacity,0);assert.throws(()=>H.parseConstellation('[[1]]'));
});
test('orthonormal sinc coordinates interpolate their samples and retain exact coefficient energy',()=>{
 for(const w of [.05,1,30]){const a=[1,0,-2,3,1],r=H.waveform(a,w);near(r.energy,15);for(const q of r.samples)near(r.value(q.time),q.value,1e-10);}
 near(H.sinc(0),1);assert.equal(H.sinc(3),0);
});
test('water-filling handles ties, dry channels, exact threshold budgets and tiny positive budgets',()=>{
 const a=H.waterfill([1,2,4,8],6);a.allocation.forEach((p,i)=>near(p,[10/3,7/3,1/3,0][i]));near(a.used,6);
 const b=H.waterfill([1,1,10],1e-100);assert.deepEqual(b.allocation,[5e-101,5e-101,0]);assert(b.capacity>0);assert.deepEqual(H.waterfill([1,2],0).allocation,[0,0]);assert.deepEqual(H.waterfill([1,2],1).allocation,[1,0]);
 for(const ns of [[1],[1,1],[1,2,3],[4,1,8,2]])for(const p of [0,.1,1,6,20]){const r=H.waterfill(ns,p);near(r.used,p);for(let i=0;i<ns.length;i++){if(r.allocation[i]>0)near(ns[i]+r.allocation[i],r.level);else assert(ns[i]>=r.level-1e-12);}for(let trial=0;trial<20;trial++){const weights=ns.map((_,i)=>1+(trial*7+i*11)%13),c=H.allocationComparison(ns,p,weights);assert(c.capacity<=r.capacity+1e-11);}near(H.sum(r.frames.at(-1).allocation),p);}
 assert.throws(()=>H.waterfill([0,1],1));assert.throws(()=>H.allocationComparison([1,2],1,[0,0]));
});
test('all nine frozen INFO identities survive without adding the absent 6.6',async()=>{
 const plan=JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json',import.meta.url))),frozen=plan.chapters.find(c=>(c.col||c.collection)==='info').items;
 const parts=await Promise.all(['','-b'].map(p=>import(`../content/info/ch06${p}.js`))),items=parts.flatMap(p=>p.default.items),syllabus=(await import('../content/info/syllabus.js')).default.chapters.find(c=>c.n===6).items;
 assert.equal(items.length,9);assert.equal(items.some(i=>i.num==='6.6'),false);
 for(const [j,i]of items.entries()){assert.equal('info-'+i.num,frozen[j].id);for(const key of ['name','kind','verify','paper','introduces']){assert.deepEqual(i[key],frozen[j][key]);assert.deepEqual(i[key],syllabus[j][key]);}for(const key of ['deps','refs'])assert.deepEqual(i[key],syllabus[j][key]);assert.equal(i.caption,syllabus[j].pic);for(const key of ['statement','idea','caption'])assert(i[key].length>100);assert.equal(typeof i.viz,'function');}
});
