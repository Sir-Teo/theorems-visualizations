import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as H from '../content/ml/ch06.shared.js';

test('finite threshold and interval restrictions obey duplicates and all real cut positions',()=>{
 for(let n=0;n<=8;n++){const p=Array.from({length:n},(_,i)=>i);assert.equal(H.restrictions(p).length,n+1);assert.equal(H.restrictions(p,'interval').length,1+n*(n+1)/2);}
 assert.deepEqual(H.restrictions([1,1,2]),[0,3,7]);assert.deepEqual(H.restrictions([2,0,1]),[0,2,6,7]);
 assert.deepEqual(H.restrictions([], 'rectangle'),[0]);
});
test('rectangles shatter the diamond but no five distinct planar points',()=>{
 const diamond=[[0,1],[1,0],[0,-1],[-1,0]];assert.equal(H.restrictions(diamond,'rectangle').length,16);
 const grid=Array.from({length:9},(_,i)=>[i%3,Math.floor(i/3)]);
 for(let mask=0;mask<512;mask++)if(H.pop(mask)===5){const p=grid.filter((_,i)=>H.bit(mask,i));assert.ok(H.restrictions(p,'rectangle').length<32);}
 assert.equal(H.restrictions([[0,0],[0,0]],'rectangle').length,2);
});
test('finite VC and Sauer split count actual families, including empty restrictions',()=>{
 for(let n=1;n<=6;n++)for(const kind of['threshold','interval','two intervals','all']){
 const F=H.restrictions(Array.from({length:n},(_,i)=>i),kind),{dimension:d}=H.finiteVC(F,n),q=H.splitFamily(F,n);
 assert.equal(F.length,q.union.length+q.intersection.length);assert.ok(F.length<=H.sauer(n,d));assert.equal(d,Math.min(n,kind==='threshold'?1:kind==='interval'?2:kind==='all'?n:4));}
 assert.equal(H.finiteVC([],3).dimension,0);assert.equal(H.sauer(0,0),1);
});
test('all binary targets have exact modular sine phases without floating huge angles',()=>{
 for(let d=0;d<=10;d++)for(let mask=0;mask<2**d;mask++){
 const labels=Array.from({length:d},(_,i)=>H.bit(mask,i)),q=H.sineEncoding(labels);
 assert.deepEqual(q.rows.map(x=>x.label),labels);
 for(const row of q.rows){const a=BigInt(row.numerator),b=BigInt(row.denominator);assert.ok(a>0n&&a<2n*b&&a!==b);}
 }
 const a=Array(2);a[1]=0;assert.throws(()=>H.sineEncoding(a));
});
test('threshold worst-consistent risk law agrees with independent ordered-sample enumeration',()=>{
 const weights=[.1,.2,.4,.3],target=3,epsilon=.25;
 for(let m=1;m<=5;m++){let bad=0,mean=0;const walk=(draws,p)=>{if(draws.length===m){let worst=0;for(let k=0;k<=4;k++){const pred=Array.from({length:4},(_,i)=>+(i<k));if(draws.every(i=>pred[i]===+(i<2))){const r=weights.reduce((a,w,i)=>a+w*(pred[i]!==+(i<2)),0);worst=Math.max(worst,r);}}bad+=p*(worst>epsilon);mean+=p*worst;return;}weights.forEach((w,i)=>walk([...draws,i],p*w));};walk([],1);const q=H.thresholdLaw(weights,target,m,epsilon);assert.ok(Math.abs(q.bad-bad)<1e-13);assert.ok(Math.abs(q.meanWorst-mean)<1e-13);assert.ok(q.bad<=q.bound+1e-13);}
});
test('expected supremum gaps agree with independent enumeration and are expectation quantities',()=>{
 const F=H.restrictions([0,1,2],'threshold'),p=[.2,.3,.5],labels=[1,0,1];
 for(let m=1;m<=5;m++){let mean=0;const visit=(S,prob)=>{if(S.length===m){let gap=0;for(let h=0;h<4;h++){const risk=p.reduce((a,w,i)=>a+w*(+(i<h)!==labels[i]),0),emp=S.reduce((a,i)=>a+(+(i<h)!==labels[i]),0)/m;gap=Math.max(gap,Math.abs(risk-emp));}mean+=prob*gap;return;}p.forEach((w,i)=>visit([...S,i],prob*w));};visit([],1);const q=H.expectedGap(F,p,labels,m);assert.ok(Math.abs(q.total-1)<1e-13);assert.ok(Math.abs(q.mean-mean)<1e-13);}
});
test('No-Free-Lunch occupancy mixture matches exact support bounds and subnormal-free normalization',()=>{
 for(let m=1;m<=20;m++){const q=H.nflMixture(m);assert.ok(Math.abs(q.occupancy.reduce((a,b)=>a+b,0)-1)<1e-13);assert.ok(q.mean>=.25-1e-13);assert.ok(q.tail>=1/7);}
});
test('point text domains reject sparse/bad coordinates and preserve empty-set semantics',()=>{
 assert.equal(H.parsePoints('[]').error,null);assert.ok(H.parsePoints('[null]').error);assert.ok(H.parsePoints('[[0,9]]',true).error);assert.deepEqual(H.parsePoints(' [ 2, 2, -1 ] ').points,[2,2,-1]);
});

test('stable sine keeps exact rational sign when decimal phase rounds to an integer',()=>{
 const labels=[...Array(31).fill(1),0],q=H.sineEncoding(labels),r=q.rows[31];assert.equal(r.phase,1);assert.ok(r.sine<0);assert.equal(r.label,0);assert.ok(Math.abs(r.sine+Math.PI*5e-33)<1e-46);
});

test('metadata preserves frozen identities/source flags and complete synchronized dependencies',async()=>{
 const {readFile}=await import('node:fs/promises'),S=(await import('../content/ml/syllabus.js')).default,A=(await import('../content/ml/ch06.js')).default,B=(await import('../content/ml/ch06-b.js')).default;
 const plan=JSON.parse(await readFile(new URL('../docs/wave-6-plan.json',import.meta.url),'utf8')),items=[...A.items,...B.items],base=plan.chapters.find(c=>c.collection==='ml'&&c.chapter===6),now=S.chapters.find(c=>c.n===6);
 assert.equal(items.length,16);
 for(const b of base.items){const item=items.find(i=>i.num===b.num),row=now.items.find(i=>i.num===b.num);assert.ok(item);for(const k of ['num','kind','name'])assert.equal(item[k],b[k]);if(b.verify)assert.equal(item.verify,true);for(const k of ['deps','refs'])assert.deepEqual(item[k],row[k]);}
 assert.deepEqual(items.find(i=>i.num==='6.7').deps,['ml-6.6','ml-6.5','ml-4.4','ml-6.10','ml-6.11']);assert.deepEqual(items.find(i=>i.num==='6.11').deps,['ml-6.9','ml-4.5','ml-2.2','prob-1.6.4']);
});

test('original atomic parameter comparisons preserve strict risk at rounded equality',()=>{
 const q=H.atomicThresholdLaw(.1,2,.6);assert.ok(Math.abs(q.bad-.16)<1e-14);assert.equal(q.risk[0],.6);assert.equal(q.riskFlags[0],true);
 const equal=H.atomicThresholdLaw(.25,2,.5);assert.equal(equal.risk[0],.5);assert.equal(equal.riskFlags[0],false);
});
