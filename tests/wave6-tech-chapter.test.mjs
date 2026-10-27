import {historicalPinBytes} from './wave6-phil-tech-pins.shared.mjs';
import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{createHash}from'node:crypto';
import chapter from'../content/tech/ch07.js';import syllabus from'../content/tech/syllabus.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url)),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex'),frozen=json('tests/fixtures/wave6-tech-frozen.json');
test('TECH7 retains every frozen lesson identity, enabling dependency, source flag and planned preview',()=>{
 assert.equal(chapter.collection,'tech');assert.equal(chapter.chapter,7);assert.equal(chapter.title,frozen.title);assert.equal(chapter.items.length,14);const plans=syllabus.chapters.find(c=>c.n===7).items;
 for(const[i,item]of chapter.items.entries()){const original=frozen.items[i];assert.equal('tech-'+item.num,original.id);for(const key of new Set([...Object.keys(original).filter(k=>!['id','refs','pic'].includes(k)),'verify','paper','introduces','see'])){assert.equal(Object.hasOwn(item,key),Object.hasOwn(original,key),item.num+' '+key+' presence');assert.deepEqual(item[key],original[key],item.num+' '+key);}assert.deepEqual(plans[i],Object.fromEntries(Object.entries(original).filter(([k])=>k!=='id')));for(const k of['statement','idea','scope','caption'])assert.ok(item[k].length>100,item.num+' complete '+k);assert.equal(typeof item.viz,'function');assert.ok(item.credit);assert.ok(item.refs.length);assert.ok(item.links.source.startsWith('https://'));}
});
test('TECH7 preserves all7277 older tracked raw files except the explicitly mutable handoff',()=>{
 const p=json('docs/verification/wave6-tech-preimages.json');assert.equal(p.sourceCommit,'707b5336257049f743eae4dd70881bff1ff0176b');assert.equal(Object.keys(p.rawPins).length,7278);let count=0;for(const[path,hash]of Object.entries(p.rawPins))if(path!==p.mutableHandoff){assert.equal(sha(historicalPinBytes(new URL('../'+path,import.meta.url),hash)),hash,path);count++;}assert.equal(count,7277);
});
test('TECH7 source boundaries preserve actual prerequisites, source-image research and both binding access stops',()=>{
 const s=json('docs/verification/wave6-tech-sources.json');assert.equal(s.sources.length,11);assert.equal(s.prerequisites.length,9);assert.equal(s.newAccessStops.length,2);assert.ok(s.originalBodiesNotRead.includes('Carnot1824 original'));const t=s.sources.find(x=>x.id==='Thurston1886');assert.equal(t.wholeWorkRead,false);assert.equal(t.sourceImages.length,4);for(const x of s.prerequisites){assert.equal(sha(read(x.path)),x.sha256);assert.match(x.readFields,/Complete written/);}for(const x of s.newAccessStops){assert.equal(x.bodyRead,false);assert.ok(x.recoveryForbidden);}
});
test('TECH7 current native certificate covers every frozen layout and preserves complete chapter records',()=>{
 const n=json('docs/verification/wave6-tech-native-receipt.json'),v=json('docs/verification/wave6-tech-visual-receipt.json');
 const labels=Array.from({length:14},(_,i)=>i+1).flatMap(i=>['light','dark'].flatMap(t=>[320,1200].map(w=>`tech-7.${i}-${t}-${w}`))).sort();
 assert.equal(n.totals.layouts,56);assert.deepEqual(n.rows.map(r=>r.label).sort(),labels);assert.equal(n.totals.shares,880);assert.equal(n.totals.trustedShares,n.totals.shares);assert.equal(n.totals.critical,300);assert.equal(n.totals.invalid,356);assert.equal(n.totals.raw,256);assert.equal(n.batches.length,6);assert.equal(n.allOwnedSessionsClosed,true);
 for(const b of n.batches){assert.equal(b.receipt.failure,null);assert.equal(b.receipt.sourceDataHarnessUnchanged,true);assert.deepEqual(b.receipt.sourceHashes,n.sourceHashes);assert.deepEqual(b.receipt.afterHashes,n.sourceHashes);}
 for(const[path,h]of Object.entries(n.sourceHashes))if(!path.startsWith('data/'))assert.equal(sha(read(path)),h,path+' complete native source/model/harness pin');
 const details=json('data/col/tech.json'),projection=Object.fromEntries(Object.entries(details).filter(([id])=>id.startsWith('tech-7.')));assert.deepEqual(projection,n.chapterProjection,'all fourteen complete TECH7 detail records preserve the certificate while other chapters may grow');
 assert.equal(v.currentPNGTargets,422);assert.equal(v.uniqueTeachingTargets,366);assert.equal(v.actualOriginalDetailSheetViews,99);assert.equal(v.nativeCurrent.length,226);assert.equal(v.ordinaryCurrent.length,196);assert.ok([...v.nativeCurrent,...v.ordinaryCurrent].every(r=>r.personallyQualifiedCurrentRGB&&r.exactOriginalPixelViews.length));
});
