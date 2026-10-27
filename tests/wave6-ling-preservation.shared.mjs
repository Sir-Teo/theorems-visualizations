import assert from 'node:assert/strict';
import fs from 'node:fs';
const before=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-ling-syllabus-before.json',import.meta.url)));
// Keep the whole original LING5 metadata assertion. Restore only the16later
// chapter6 researched refs/pic fields before checking the entire old syllabus.
export function lingSyllabusAtWave5(syllabus){
 const restored=structuredClone(syllabus),old=before.chapters.find(c=>c.n===6),now=restored.chapters.find(c=>c.n===6);
 assert.deepEqual(now.items.map(i=>i.num),old.items.map(i=>i.num));
 for(let i=0;i<old.items.length;i++){now.items[i].refs=structuredClone(old.items[i].refs);now.items[i].pic=old.items[i].pic;}
 assert.deepEqual(restored,before,'Only LING6 researched references/captions may change');return restored;
}
