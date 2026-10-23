import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {textDigest,validateExploration} from '../explorations/contract.mjs';
import {loadExplorations,loadExplorationSourceIds} from '../scripts/build-explorations.mjs';
import {loadRegistry} from '../scripts/lib.mjs';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const packet=await read('docs/pilots/sequences/preparation/remaining-sequences-20261023.json');
const {records}=await loadExplorations();const extra=records.filter(r=>r.extensions?.['atlas:preparation']?.path?.endsWith('remaining-sequences-20261023.json'));
test('all eight three-lesson sequences are actual unique records with valid scoped activities',async()=>{
 assert.equal(extra.length,10);assert.equal(records.length,24);assert.equal(new Set(records.map(r=>r.id)).size,24);
 for(const id of ['P01','P02','P03','P04','P05','P06','P07','P08'])assert.equal(records.filter(r=>r.pilotId===id).length,3,id);
 const coverage=await read('docs/coverage/registry.json'),registry=await loadRegistry(),context={domainIds:coverage.domains.map(d=>d.id),collectionIds:registry.collections.map(c=>c.id),sourceIds:await loadExplorationSourceIds()};
 for(const r of extra){assert.deepEqual(validateExploration({...r,status:'draft'},context),[]);assert.ok(r.passages.length>=3);assert.ok(r.passages.every(p=>p.form!=='quotation'));assert.ok((r.activity.prompts||r.activity.lenses).length>=3);assert.equal(r.publication,'local-preview');}
});
test('retained readings and original preparation remain exact, refreshes do not erase historical scope',async()=>{
 const bytes=await readFile(new URL('../'+packet.retainedPath,import.meta.url),'utf8');assert.equal(textDigest(bytes),packet.retainedSha256);const prior=JSON.parse(bytes);
 for(const s of packet.sources){assert.deepEqual(s.retainedReceipt,prior.sources.find(x=>x.id===s.id));assert.equal(s.readOn,s.retainedReceipt.readAt);assert.ok(s.retainedReceipt.urls.includes(s.url));}
 for(const [path,sha]of Object.entries(packet.originalEvidence))assert.equal(textDigest(await readFile(new URL('../'+path,import.meta.url),'utf8')),sha,path);
 for(const id of ['seq-sikh-faq','seq-sgpc-reht','seq-mssrf-seeds','seq-rsc-performing'])assert.equal(packet.sources.find(s=>s.id===id).refresh,undefined);
});
test('synthetic amount/rate/crop arithmetic agrees with the retained sample arrays',async()=>{
 const data=await read('docs/pilots/sequences/research/volume-time.json');const ratios=[];
 for(const c of data.cases){const samples=c.samples.map(p=>p.map(Number));const one=samples.find(p=>p[0]===1)[1],end=samples.at(-1)[1];ratios.push(one/end);assert.equal(one,Number(c.expected.volumeAtOneSecond));assert.equal(end,Number(c.expected.observedEndVolume));for(let i=1;i<samples.length;i++){const [a,b]=c.expected.intervalAverageFlows[i-1].split('/').map(Number);assert.ok(Math.abs((samples[i][1]-samples[i-1][1])/(samples[i][0]-samples[i-1][0])-a/(b||1))<1e-12);}}
 for(const [i,want]of [.75,.5,5/6].entries())assert.ok(Math.abs(ratios[i]-want)<1e-12);assert.equal(data.cases[2].completeEndpointVolume,null);assert.ok(ratios[2]>ratios[0]);
 const lesson=extra.find(r=>r.id==='x-health-0002');assert.match(lesson.scope,/Not patient data/);assert.match(JSON.stringify(lesson.activity),/5\/6/);
});
test('patch predicates and staging changes are plan facts with no fabricated event outcomes',async()=>{
 const patch=await read('docs/pilots/sequences/preparation/patch-plans-20261023.json');const hole=patch.coordinates.holeRectangle;
 for(const p of patch.plans){const a=p.patch;const area=Math.max(0,Math.min(a[2],hole[2])-Math.max(a[0],hole[0]))*Math.max(0,Math.min(a[3],hole[3])-Math.max(a[1],hole[1]));assert.equal(area,p.expectedCoverageArea);const all=p.punctures.every(([x,y])=>x>a[0]&&x<a[2]&&y>a[1]&&y<a[3]&&!(x>hole[0]&&x<hole[2]&&y>hole[1]&&y<hole[3]));assert.equal(all,p.expectedAllLocationsInBaseAndPatch);assert.equal(p.physicalVerdict,null);const passage=extra.find(r=>r.id==='x-craft-0002').passages.find(x=>x.id===p.id);for(const [x,y]of p.punctures)assert.ok(passage.text.includes(`(${x}, ${y})`));}
 const stage=await read('docs/pilots/sequences/preparation/staging-scores-20261023.json');const [a,b]=stage.scores;assert.notDeepEqual(a.performers.A.position,b.performers.A.position);assert.deepEqual(a.performers.B.position,b.performers.B.position);for(const who of ['A','B'])assert.notEqual(a.performers[who].orientationDegrees,b.performers[who].orientationDegrees);assert.ok(stage.scores.every(s=>s.actualPerformanceId===null));assert.equal(stage.observerRecordTemplate.status,'not-collected');
});
