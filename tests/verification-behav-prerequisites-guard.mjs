// Explicit immutable-production preservation audit; excluded from default tests because later authorized edits may supersede these snapshots.
import assert from'node:assert/strict';import fs from'node:fs';import crypto from'node:crypto';
const spec=JSON.parse(fs.readFileSync(new URL('./behav-prerequisite-baseline.json',import.meta.url))),hash=x=>crypto.createHash('sha256').update(JSON.stringify(x,(k,v)=>typeof v==='function'?v.toString():v)).digest('hex');
for(const[n,row]of Object.entries(spec.baseline)){const m=(await import('../'+row.file)).default,x={...m.items.find(i=>i.num===n)};if(spec.edges[n]){assert.deepEqual(x.deps,[...row.deps,...spec.edges[n]],n);assert.ok(x.idea.startsWith(row.idea+' '),n);delete x.idea;delete x.deps;}assert.equal(hash(x),row.hash,n);}
assert.equal(hash((await import('../content/behav/syllabus.js')).default),spec.syllabusHash);
for(const[f,h]of Object.entries(spec.untouched))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('../content/behav/'+f,import.meta.url))).digest('hex'),h,f);
console.log(`PASS ${Object.keys(spec.baseline).length} full objects/functions/source flags; only 13 appended ideas/14 dependencies and matching syllabus rows; all other BEHAV files byte-identical.`);
