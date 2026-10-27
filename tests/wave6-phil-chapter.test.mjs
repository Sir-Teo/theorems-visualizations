import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import chapter from '../content/phil/ch06.js';
import syllabus from '../content/phil/syllabus.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url));
const json=p=>JSON.parse(read(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const frozen=json('tests/fixtures/wave6-phil-frozen.json');
test('PHIL6 frozen lesson identities, dependencies and optional-property absence are exact',()=>{
 assert.equal(chapter.collection,frozen.collection);assert.equal(chapter.chapter,frozen.chapter);assert.equal(chapter.title,frozen.title);assert.equal(chapter.items.length,11);
 const planned=syllabus.chapters.find(c=>c.n===6).items;
 for(const[i,item]of chapter.items.entries()){
  const original=frozen.items[i];assert.equal('phil-'+item.num,original.id);
  for(const key of new Set([...Object.keys(original).filter(k=>!['id','refs','pic'].includes(k)),'verify','paper','introduces','see'])){assert.equal(Object.hasOwn(item,key),Object.hasOwn(original,key),item.num+' '+key+' presence');assert.deepEqual(item[key],original[key],item.num+' '+key);}
  for(const key of['statement','idea','caption','scope'])assert.ok(item[key].length>100,item.num+' complete '+key);
  assert.equal(typeof item.viz,'function');assert.ok(item.refs.length);assert.ok(item.tags.length);assert.ok(item.links.source.startsWith('https://plato.stanford.edu/entries/'));
  assert.deepEqual(planned[i],Object.fromEntries(Object.entries(original).filter(([k])=>k!=='id')),'frozen planned preview remains unchanged');
 }
});
test('PHIL6 all7251 older raw files and all syllabi retain their exact merged-main bytes',()=>{
 const p=json('docs/verification/wave6-phil-preimages.json');assert.equal(p.sourceCommit,'55241f1f29b7bbf9f0301cd4182a84728d36d376');assert.equal(Object.keys(p.rawPins).length,7252);let count=0;
 for(const[path,hash]of Object.entries(p.rawPins))if(path!==p.mutableHandoff){assert.equal(sha(read(path)),hash,path);count++;}assert.equal(count,7251);
});
test('PHIL6 source ledger distinguishes bounded commentary, complete prerequisites and unread originals',()=>{
 const s=json('docs/verification/wave6-phil-sources.json');assert.equal(s.sources.length,5);assert.equal(s.prerequisites.length,2);assert.deepEqual(s.newAccessStops,[]);assert.ok(s.originalBodiesNotRead.includes('BlackwellDubins1962'));
 for(const source of s.sources){assert.equal(source.wholeEntryRead,false);assert.ok(source.actualReadLineRanges.length);assert.ok(source.url.startsWith('https://plato.stanford.edu/entries/'));}
 for(const p of s.prerequisites){assert.equal(sha(read(p.path)),p.sha256);assert.ok(p.readFields.startsWith('Complete written'));}
});
test('PHIL6 teaching keeps conditional-price, finite-convergence and dependence assumptions explicit',()=>{
 const item=n=>chapter.items.find(x=>x.num==='6.'+n),text=n=>['statement','idea','scope'].map(k=>item(n)[k]).join(' ');
 assert.match(text(3),/fictional/i);assert.match(text(3),/fractional/i);
 assert.match(text(4),/two-sided trading/);assert.match(text(4),/linear utility|additive/);
 assert.match(text(5),/preannounced|advance|known plan/);assert.match(text(5),/no additional relevant information/);
 assert.match(text(8),/distinct/);assert.match(text(8),/positive/);assert.match(text(8),/finite/);assert.match(text(8),/not.*certificate|does not.*certif/);
 assert.match(text(9),/another prior|separate distribution|another distribution/);
 assert.match(text(10),/one winner|one winning/);assert.match(text(10),/conjoin|agglomeration/);
 assert.match(text(11),/independent/i);assert.match(text(11),/uniform/);assert.match(text(11),/lower bound/);
});
