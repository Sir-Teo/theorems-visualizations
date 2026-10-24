import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildCoverageModel,reviewAge} from '../scripts/coverage-dashboard-model.mjs';
import {dashboardSnapshot} from '../scripts/build-coverage-dashboard-data.mjs';
import {checkDashboard,validateBundle} from '../scripts/build-coverage-dashboard.mjs';
const inputs=JSON.parse(await readFile(new URL('../docs/coverage/dashboard/inputs.json',import.meta.url),'utf8'));
const altered=fn=>{const d=structuredClone(inputs);fn(d);return d;};
test('canonical inventory partitions reconcile without counting cross-listed pilots twice',()=>{
 const m=buildCoverageModel(inputs),s=m.summary;
 assert.equal(s.productionAccepted,7751);assert.equal(s.productionPlanned,5823);assert.equal(s.localAuthored,6);assert.equal(s.localAccepted,4);
 assert.equal(m.domainRows.reduce((n,r)=>n+r.productionAccepted,0),s.productionAccepted);
 assert.ok(m.domainRows.reduce((n,r)=>n+r.localAccepted,0)>s.localAccepted);
 assert.equal(s.waveAccepted+s.waveAuthorVerified+s.waveOutsideReviewedCheckpoints,s.waveTotal);
 assert.equal(s.redesigned+s.retained+s.visualPending,s.visualScope);assert.equal(s.visualOutsideAccepted,34);
 assert.equal(s.humanAccessibilityReviewed,null);assert.equal(s.learningEvaluated,null);
 assert.match(m.discrepancies[0].message,/\(26\).*36 accepted/);
});
test('duplicate or overlapping canonical items are rejected',()=>{
 assert.throws(()=>buildCoverageModel(altered(d=>d.accepted.items.push(d.accepted.items[0]))),/duplicate identity/);
 assert.throws(()=>buildCoverageModel(altered(d=>d.accepted.plannedItems[0]=d.accepted.items[0])),/overlap/);
});
test('primary and cross-list joins reject missing, duplicate and unknown relationships',()=>{
 assert.throws(()=>buildCoverageModel(altered(d=>d.collectionMappings=d.collectionMappings.filter(m=>m.collectionId!=='pma'))),/Missing primary/);
 assert.throws(()=>buildCoverageModel(altered(d=>d.collectionMappings.push(d.collectionMappings[0]))),/Duplicate collection/);
 assert.throws(()=>buildCoverageModel(altered(d=>d.collectionMappings[0].relationship='other')),/Unknown collection relationship/);
});
test('visual and frozen-wave identities cannot silently move to another valid collection',()=>{
 assert.throws(()=>buildCoverageModel(altered(d=>d.redesign.items[0].collectionId=d.redesign.items[0].collectionId==='pma'?'rca':'pma')),/canonical collection mismatch/);
 assert.throws(()=>buildCoverageModel(altered(d=>d.wave.chapters[0].collectionId=d.wave.chapters[0].collectionId==='pma'?'rca':'pma')),/canonical collection mismatch/);
});
test('reported chapters cannot double count accepted work or exceed the frozen inventory',()=>{
 assert.throws(()=>buildCoverageModel(altered(d=>{const c=d.wave.chapters.find(c=>c.ids.some(id=>d.accepted.items.some(a=>a.id===id)));d.wave.reportedChapters.push({key:c.key,count:c.ids.length});})),/overlaps acceptance/);
 assert.throws(()=>buildCoverageModel(altered(d=>d.wave.reportedChapters[0].count++)),/count differs/);
});
test('later changes-requested receipt reopens the dimension despite an earlier pass',()=>{
 const d=altered(d=>{const p=d.pilots.find(p=>p.status==='in-review');p.reviews.push({...p.reviews[0],result:'changes-requested'});});
 const p=d.pilots.find(p=>p.status==='in-review'),row=buildCoverageModel(d).pilotRows.find(r=>r.id===p.pilotId);
 assert.ok(row.missingRequiredReviews.includes(p.reviews[0].dimension));
 p.status='accepted';assert.throws(()=>buildCoverageModel(d),/lacks required review/);
});
test('visual pass needs evidence, while null human evidence is never inferred from AI passes',()=>{
 assert.throws(()=>buildCoverageModel(altered(d=>d.redesign.items.find(r=>r.status==='verified').evidence=null)),/lacks evidence/);
 const m=buildCoverageModel(inputs);for(const r of m.pilotRows)assert.equal(r.humanAccessibilityObserved,null);
});
test('latest passing receipt age is explicit, missing remains unknown and future dates fail',()=>{
 assert.equal(reviewAge(null,inputs.asOf),null);assert.equal(reviewAge('2026-10-21',inputs.asOf),1);assert.throws(()=>reviewAge('2026-10-23',inputs.asOf),/future/);
 const d=altered(d=>{const p=d.pilots[0];p.reviews[0].reviewedOn='2026-10-20';});
 assert.equal(buildCoverageModel(d).pilotRows.find(r=>r.id===d.pilots[0].pilotId).reviewAgeDays,0);
});
test('review queue retains eleven concrete unresolved classification actions',()=>{
 const m=buildCoverageModel(inputs);assert.equal(m.classificationRows.length,11);assert.ok(m.classificationRows.every(r=>r.nextAction));
 assert.throws(()=>buildCoverageModel(altered(d=>d.classifications.find(c=>c.disposition==='review').nextAction=null)),/lacks next action/);
});
test('historical dashboard source, model, compiled sidecar and artifact bindings agree at their exact checkpoint',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'coverage-historical-test-'));
 try{
  const tar=join(dir,'source.tar');
  execFileSync('git',['archive','--format=tar','--output',tar,'b2f8e03398658979bca78b2303b1b1371f5445e6'],{cwd:fileURLToPath(new URL('..',import.meta.url))});
  execFileSync('tar',['-xf',tar,'-C',dir]);await rm(tar);
  assert.equal((await checkDashboard({root:dir})).result,'PASS');
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('bundle checker rejects changed bytes and unsafe sidecar paths before staging',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'coverage-bundle-test-'));
 try{const manifest=JSON.parse(await readFile(new URL('../labs/atlas/coverage/data-app-build.json',import.meta.url),'utf8'));await writeFile(join(dir,'data-app-build.json'),JSON.stringify({...manifest,snapshot:{...manifest.snapshot,path:'../escape.json'}}));await assert.rejects(validateBundle(dir),/Invalid dashboard build/);
 await writeFile(join(dir,'data-app-build.json'),JSON.stringify(manifest));await writeFile(join(dir,'index.html'),'changed');await assert.rejects(validateBundle(dir),/integrity mismatch/);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('refresh refuses changed local evidence before producing new acceptance counts',async()=>{
 const root=await mkdtemp(join(tmpdir(),'coverage-stale-test-'));
 try{await mkdir(join(root,'docs/coverage/dashboard'),{recursive:true});await writeFile(join(root,'docs/coverage/dashboard/inputs.json'),JSON.stringify(inputs));await writeFile(join(root,'docs/coverage/registry.json'),'{}');await assert.rejects(dashboardSnapshot(root),/local input is stale/);}
 finally{await rm(root,{recursive:true,force:true});}
});
