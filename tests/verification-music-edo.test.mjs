import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as E from '../content/music/source-audit-edo.js';
const ref=JSON.parse(fs.readFileSync(new URL('../docs/verification/music-edo-reference.json',import.meta.url))),near=(a,b,t=2e-12)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('all3 ×698 cents errors and strict records agree with independent exact rational-log enclosures',()=>{
 for(const target of Object.keys(ref.points)){const expected=ref.points[target],actual=E.EDO_RECORD_DATA[target];assert.equal(actual.length,698);for(let j=0;j<698;j++){assert.equal(actual[j].k,expected[j].k);assert.equal(actual[j].record,expected[j].record);near(actual[j].error,expected[j].error);}
  for(let n=3;n<=120;n++){const m=E.edoRecordModel(n,target);assert.equal(m.current.n,n);assert.equal(m.points.length,118);assert.deepEqual(m.records,expected.slice(0,118).filter(x=>x.record).map(x=>x.n));}
 }
 assert.deepEqual(E.edoRecordModel().records700,[3,5,7,12,29,41,53,200,253,306,359,665]);near(E.edoRecordModel().current.stepError,.019550008653874177,2e-15);assert.equal(E.edoRecordModel(24).current.error,E.edoRecordModel(12).current.error);
});
test('all15 source table comparisons; primitive generator cycles and exactly n centered chain points',()=>{
 for(const n of[12,19,31]){const m=E.edoCompareModel(n);assert.equal(m.rows.length,15);assert.equal(m.chain.length,n);assert.equal(new Set(m.chain.map(x=>x.k)).size,n);const residues=Array.from({length:n},(_,i)=>(i*m.fifth.k)%n);assert.equal(new Set(residues).size,n);
  for(const r of m.rows){const x=ref.comparisons.find(x=>x.n===r.n&&x.target===r.target);assert.equal(r.k,x.k);near(r.error,x.error);}
  for(const x of m.chain){near(x.error,x.k*(m.generator-m.fifth.cents));assert.ok(x.meantone>=0&&x.meantone<1200);assert.ok(x.equal>=0&&x.equal<1200);}
  const g=n===31?300*Math.log2(5):n===19?400*Math.log2(10/3):700;near(m.generator,g);near(m.maxChainError,Math.max(...m.chain.map(x=>Math.abs(x.error))));
  for(const fs of[m.triad,m.seventh,m.triad12,m.seventh12])for(const f of fs)assert.ok(f>=261.6256&&f<2*261.6256&&8*f<22050);
 }
});
function check(a){assert.equal(a.sampleRate,44100);assert.equal(a.harmonics,8);assert.equal(a.frames,35280);for(let e=0;e<a.frequencies.length;e++){for(const j of[0,1,440,441,999,8001,35279]){let x=0;for(let h=8;h>0;h--)for(const f of a.frequencies[e])x+=Math.sin(j*2*Math.PI*f*h/44100)/h;const env=j<441?j/441:j>=a.frames-441?(a.frames-1-j)/441:1;x*=.12*env/(a.frequencies[e].length*(761/280));near(a.samples[e*(a.frames+a.silence)+j],x,7e-9);}if(e<a.frequencies.length-1)for(let j=0;j<a.silence;j++)assert.equal(a.samples[e*(a.frames+a.silence)+a.frames+j],0);}for(const x of a.samples)assert.ok(Number.isFinite(x)&&Math.abs(x)<=.12000001);}
test('all comparison actions and actual selected-target intervals use correct register and declared H8 signals',()=>{
 for(const n of[12,19,31])for(const action of['triad','seventh','pure']){const a=E.edoCompareAudio(n,action),m=E.edoCompareModel(n);check(a);assert.deepEqual(a.frequencies,action==='triad'?[m.triad12,m.triad]:action==='seventh'?[m.seventh12,m.seventh]:[[1,1.25,1.5,1.75].map(x=>x*261.6256)]);}
 for(const n of[3,12,120])for(const target of['fifth','major','seventh'])for(const action of['tempered','pure']){const a=E.edoRecordAudio(n,target,action),[p,q]=E.EDO_TARGETS[target];check(a);assert.deepEqual(a.frequencies,[[261.6256,261.6256*(action==='pure'?p/q:2**(Math.round(n*Math.log2(p/q))/n))]]);}
});
test('reject invalid divisors, targets and actions',()=>{
 for(const n of[0,2,701,.5,'12',NaN,Infinity,null])assert.throws(()=>E.edoApproximation(n,'fifth'));for(const n of[2,121,'12',NaN])assert.throws(()=>E.edoRecordModel(n));for(const n of[11,20,'31',null,NaN])assert.throws(()=>E.edoCompareModel(n));for(const t of['',null,'minor','__proto__','toString'])assert.throws(()=>E.edoRecordModel(12,t));for(const a of['',null,'toString']){assert.throws(()=>E.edoRecordAudio(12,'fifth',a));assert.throws(()=>E.edoCompareAudio(31,a));}
});
