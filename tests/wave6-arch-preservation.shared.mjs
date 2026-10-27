import assert from 'node:assert/strict';
import fs from 'node:fs';
const before=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-arch-syllabus-before.json',import.meta.url)));
// The historical ARCH5 assertion keeps its original whole-syllabus hash. Only the
// eleven subsequently researched chapter6 refs/pic fields are restored for it.
export function archSyllabusAtWave5(syllabus){
 const current=structuredClone(syllabus),old=before.chapters.find(c=>c.n===6),now=current.chapters.find(c=>c.n===6);
 assert.deepEqual(now.items.map(i=>i.num),old.items.map(i=>i.num));
 for(let j=0;j<old.items.length;j++){now.items[j].refs=structuredClone(old.items[j].refs);now.items[j].pic=old.items[j].pic;}
 assert.deepEqual(current,before,'Only ARCH6 references and captions may change');
 return current;
}
