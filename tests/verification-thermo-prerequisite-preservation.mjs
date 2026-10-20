// Explicit-only preservation audit for exact prerequisite candidate3fea5ed.
// Full-object hashes intentionally belong to immutable snapshot review, not enduring math regressions.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const spec=JSON.parse(fs.readFileSync(new URL('./thermo-prerequisite-baseline.json',import.meta.url)));
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x,(k,v)=>typeof v==='function'?v.toString():v)).digest('hex');
test('THERMO prerequisite batch preserves all 112 objects and functions outside authorized idea/deps, and entire syllabus outside owned deps',async()=>{
 let count=0;for(const [num,row]of Object.entries(spec.baseline)){const m=(await import('../'+row.file)).default,x={...m.items.find(x=>x.num===num)};assert.ok(x.num);if(spec.edges[num]){assert.deepEqual(x.deps,[...row.deps,...spec.edges[num]]);assert.ok(x.idea.startsWith(row.idea+' '));delete x.idea;delete x.deps;}assert.equal(hash(x),row.hash,num);count++;}assert.equal(count,112);assert.equal(hash((await import('../content/thermo/syllabus.js')).default),spec.syllabusHash);
});
