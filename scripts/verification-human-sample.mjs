// Prepare the master's 5% human sample. Agent checks never complete this gate.
import{createHash}from'node:crypto';
import{readFileSync,writeFileSync}from'node:fs';
import{join}from'node:path';
import{loadAll,ROOT}from'./lib.mjs';
const{items,problems}=await loadAll();
if(problems.some(p=>p.level==='error'))throw Error('Content could not be completely loaded; the human sample was not rewritten.');
const seed='wave-3-4-cloud-8e9e930-2026-10-18';
const rank=id=>createHash('sha256').update(`${seed}\0${id}`).digest('hex');
const population=items.map(it=>({id:it.id,name:it.name,file:it.file,route:`#/t/${it.id}`}));
const required=Math.ceil(population.length*.05);
const data={schemaVersion:2,seed,method:'Sort all written item IDs by SHA256(seed + NUL + id), take the first ceil(0.05 * population). Regenerate after the written population changes.',
 population:population.length,populationHash:createHash('sha256').update(population.map(it=>it.id).sort().join('\n')).digest('hex'),fraction:.05,required,
 status:'pending-human-review',humanReviewsRecorded:0,
 instruction:'A person must review the sampled pages, record findings and feed them into the field guide. Native browser checks and agent screenshot inspection do not count as human review. No human findings have been supplied in this task.',
 sample:population.sort((a,b)=>rank(a.id).localeCompare(rank(b.id))).slice(0,required)};
const path=join(ROOT,'docs/verification/human-sample.json'),json=JSON.stringify(data,null,2)+'\n';
if(process.argv.includes('--write'))writeFileSync(path,json);
if(process.argv.includes('--check')&&readFileSync(path,'utf8')!==json)throw Error('Human sample does not match the current written population.');
console.log(`${required} of ${population.length} written pages sampled; human review pending.`);
