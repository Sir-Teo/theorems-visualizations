import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {loadEditionArchive,deliveryBinding,buildEditions} from '../scripts/build-exploration-editions.mjs';
import {freezeEditions} from '../scripts/freeze-exploration-editions.mjs';
import {sha,jsonBytes,validateBundle,resolveReleases,renderEditions,relocateEdition,bundleKey,editionPath,DELIVERY_CODE} from '../scripts/exploration-editions.mjs';
import {contentDigest,reviewArtifactDigest} from '../explorations/contract.mjs';
import {renderExploration} from '../explorations/render.mjs';
const archive=await loadEditionArchive(),binding=await deliveryBinding(),base='https://example.org/project/';
const first=archive.bundles.get('x-history-0001@0.1.2');
// Synthetic release decisions are test data only. The real release ledger remains empty.
function fixture(source=first) {
 const receiptText='Synthetic test receipt. No actual authorization or distribution approval.',evidence={path:'docs/releases/test-evidence.md',sha256:sha(receiptText)};
 const reviewer={id:'independent-test-fixture',role:'Synthetic fixture only',independent:true};
 const decision={schemaVersion:1,decision:'approve-public-distribution',id:source.bundle.id,revision:source.bundle.revision,bundleSha256:source.entry.sha256,deliveryDigest:binding.digest,canonicalBase:base,authorizedBy:'test fixture only',authorizedOn:'2026-10-22',scope:'Synthetic test only',materials:[...source.bundle.record.sources.map(s=>s.id),'original-editorial-material','software-runtime'].map(id=>({id,basis:'Fixture only',territories:'Fixture only',scope:'Fixture only',reviewer,evidence})),engineering:{reviewer,evidence}};
 const files=new Map([[evidence.path,receiptText]]),path=`docs/releases/${source.bundle.id}-${source.bundle.revision}.json`;
 const event={type:'publish',id:source.bundle.id,revision:source.bundle.revision,bundleSha256:source.entry.sha256,evidence:{path,sha256:''}};
 function sync(){const bytes=jsonBytes(decision);files.set(path,bytes);event.evidence.sha256=sha(bytes);}
 sync();return {decision,event,files,sync,readEvidence:p=>{assert.ok(files.has(p),p);return files.get(p);}};
}
const resolveFixture=(f,events=[f.event],bundles=archive.bundles)=>resolveReleases({schemaVersion:1,events},bundles,{deliveryDigest:binding.digest,base,readEvidence:f.readEvidence});
function nextEdition(source=first) {
 const bundle=structuredClone(source.bundle),r=bundle.record;r.revision='0.1.3';bundle.revision=r.revision;r.previousRevisions=['0.1.2'];
 bundle.contentDigest=contentDigest(r);const runtime=archive.runtimes.get(bundle.runtimeDigest),hashes=Object.fromEntries(Object.entries(runtime.files).map(([p,t])=>[p,sha(t)]));
 bundle.artifactDigest=reviewArtifactDigest(r,hashes,bundle.collectionTitles);
 r.reviews.push(...r.reviewRequirements.map(dimension=>({dimension,result:'passed',reviewer:{id:'fixture-only',role:'Fixture only',independent:true},revision:r.revision,contentDigest:bundle.contentDigest,artifactDigest:bundle.artifactDigest,evidencePath:r.reviews[0].evidencePath,reviewedOn:'2026-10-22'})));
 bundle.previewHTML=renderExploration(r,bundle.collectionTitles);bundle.previewDigest=sha(bundle.previewHTML);
 const entry={id:r.id,revision:r.revision,path:`editions/bundles/${r.id}/${r.revision}.json`,sha256:sha(jsonBytes(bundle))};validateBundle(bundle,runtime,entry);return {bundle,entry};
}
test('four exact accepted source editions freeze reproducibly; studio drafts and release approvals remain absent',async()=>{
 assert.equal((await freezeEditions({checkOnly:true})).retained,4);
 assert.deepEqual([...archive.bundles.values()].map(e=>e.bundle.record.pilotId).sort(),['P01','P02','P03','P05']);
 assert.deepEqual(JSON.parse(await readFile(new URL('../editions/releases.json',import.meta.url))).events,[]);
 for(const {bundle}of archive.bundles.values())assert.equal(bundle.record.publication,'local-preview');
});
test('frozen record, selected words, renderer, runtime and evidence mutations cannot retain their original bindings',()=>{
 for(const change of [b=>b.record.passages[0].text+=' altered',b=>b.previewHTML+=' altered',b=>Object.values(b.receipts)[0].text+=' altered']){
  const bundle=structuredClone(first.bundle);change(bundle);assert.throws(()=>validateBundle(bundle,archive.runtimes.get(bundle.runtimeDigest),first.entry),/changed/);
 }
 const runtime=structuredClone(archive.runtimes.get(first.bundle.runtimeDigest));runtime.files['explorations/ui.mjs']+='\n';assert.throws(()=>validateBundle(first.bundle,runtime,first.entry),/runtime binding/);
 const bundle=structuredClone(first.bundle);bundle.record.status='in-review';const entry={...first.entry,sha256:sha(jsonBytes(bundle))};assert.throws(()=>validateBundle(bundle,archive.runtimes.get(bundle.runtimeDigest),entry),/Only reviewed/);
});
test('release ledger does not treat local acceptance as distribution permission',()=>{
 assert.deepEqual(resolveReleases({schemaVersion:1,events:[]},archive.bundles,{deliveryDigest:binding.digest,base,readEvidence:()=>{throw new Error('unexpected evidence read');}}),[]);
 for(const mutate of [d=>delete d.authorizedBy,d=>d.materials.pop(),d=>d.materials[0].territories='',d=>d.materials[0].reviewer.independent=false,d=>d.deliveryDigest='0'.repeat(64),d=>d.canonicalBase='https://other.example/',d=>d.bundleSha256='0'.repeat(64),d=>d.decision='usable-for-prototype']){
  const f=fixture();mutate(f.decision);f.sync();assert.throws(()=>resolveFixture(f));
 }
 const f=fixture();f.files.set('docs/releases/test-evidence.md','Changed receipt');assert.throws(()=>resolveFixture(f),/evidence changed/);
 const g=fixture();g.event.evidence.path='../escape';assert.throws(()=>resolveFixture(g),/Unsafe/);
});
test('preview and release catalogs have separate inventories, metadata and source payloads',()=>{
 const entries=[...archive.bundles.values()].map(e=>({...e,state:'preview'})),preview=renderEditions(entries,archive.runtimes);
 assert.equal(preview.currentCount,4);assert.equal(preview.canonicalPaths.length,0);assert.equal(preview.runtimes,1);
 assert.ok(![...preview.outputs.keys()].some(p=>/^explore\/x-(?:craft|performance)-/.test(p)));
 assert.ok(![...preview.outputs.keys()].some(p=>/^(?:docs|editions|labs)\//.test(p)));
 assert.ok(![...preview.outputs.values()].some(t=>t.includes('rel="canonical"')));
 assert.throws(()=>renderEditions(entries,archive.runtimes,{base}),/must not/);
 assert.throws(()=>renderEditions(entries,archive.runtimes,{mode:'release',base}),/Incompatible/);
 const empty=renderEditions([],archive.runtimes,{mode:'release',base});assert.equal(empty.currentCount,0);assert.equal(empty.runtimes,0);assert.equal(empty.outputs.size,2);assert.equal(empty.canonicalPaths.length,0);
 const f=fixture(),published=renderEditions(resolveFixture(f),archive.runtimes,{mode:'release',base});
 assert.equal(published.currentCount,1);assert.equal(published.canonicalPaths.length,3);assert.match(published.outputs.get(editionPath(first.bundle.id,first.bundle.revision)+'index.html'),/rel="canonical"/);
});
test('delivery adapter preserves all reviewed passage bytes, browser payload and runtime code; unknown structure fails',()=>{
 for(const {bundle}of archive.bundles.values()){
  const html=relocateEdition(bundle,{mode:'preview'});
  const payload=html.match(/<script id="exploration-data" type="application\/json">([^]*?)<\/script>/)[1];assert.deepEqual(JSON.parse(payload),bundle.record);
  for(const p of bundle.record.passages)assert.ok(JSON.parse(payload).passages.some(x=>x.sha256===p.sha256&&x.text===p.text));
  assert.ok(!html.includes('../../../explorations/'));assert.ok(!html.includes('href="../../../docs/'));assert.ok(html.includes('href="../../../../#/c/'));
  assert.match(html,/Edition history and review scope/);
 }
 assert.throws(()=>relocateEdition({...first.bundle,previewHTML:first.bundle.previewHTML.replace('Exploration workshop','Unexpected shell')},{mode:'preview'}),/Unknown frozen page/);
});
test('retained older versions keep their payload and runtime; identities count once and current routing never redirects saved state',()=>{
 const next=nextEdition(),entries=[{...first,state:'preview'},{...next,state:'preview'}];
 const result=renderEditions(entries,archive.runtimes),oldPath=editionPath(first.bundle.id,first.bundle.revision)+'index.html';
 assert.equal(result.currentCount,1);assert.equal(result.retainedEditionCount,2);assert.equal(result.outputs.get(oldPath),relocateEdition(first.bundle,{mode:'preview'}));
 const identity=result.outputs.get(`explore/${first.bundle.id}/index.html`);assert.ok(identity.includes('versions/0.1.2/'));assert.ok(identity.includes('Open edition 0.1.3'));assert.ok(!identity.includes('<script'));assert.ok(!identity.includes('http-equiv="refresh"'));
});
test('withdrawal reserves identity and version URL while excluding its title, passages, JSON and runtime from a fresh output',()=>{
 const f=fixture(),withdraw={decision:'withdraw-public-edition',id:first.bundle.id,revision:first.bundle.revision,bundleSha256:first.entry.sha256,authorizedBy:'fixture only',authorizedOn:'2026-10-22',reason:'Fixture withdrawal <reason>'},path='docs/releases/withdraw.json',bytes=jsonBytes(withdraw);f.files.set(path,bytes);
 const event={...f.event,type:'withdraw',evidence:{path,sha256:sha(bytes)}},states=resolveFixture(f,[f.event,event]),result=renderEditions(states,archive.runtimes,{mode:'release',base});
 assert.equal(result.currentCount,0);assert.equal(result.runtimes,0);assert.equal(result.canonicalPaths.length,0);
 for(const [p,html]of result.outputs){assert.ok(!html.includes(first.bundle.record.title),p);assert.ok(!html.includes('exploration-data'),p);for(const passage of first.bundle.record.passages)assert.ok(!html.includes(passage.text),p);}
 assert.match(result.outputs.get(editionPath(first.bundle.id,first.bundle.revision)+'index.html'),/&lt;reason&gt;/);
 assert.throws(()=>resolveFixture(f,[event]),/previously published/);assert.throws(()=>resolveFixture(f,[f.event,event,f.event]),/cannot be republished/);
});
test('reapproving an older edition cannot become latest, and withdrawn latest never silently falls back',()=>{
 const next=nextEdition(),f=fixture(),g=fixture(next);for(const [p,t]of g.files)f.files.set(p,t);const bundles=new Map([...archive.bundles,[bundleKey(next.bundle.id,next.bundle.revision),next]]);
 const entries=resolveFixture(f,[f.event,g.event,f.event],bundles),result=renderEditions(entries,archive.runtimes,{mode:'release',base});assert.equal(JSON.parse(result.outputs.get('explore/catalog.json')).explorations[0].currentRevision,'0.1.3');
 const decision={decision:'withdraw-public-edition',id:next.bundle.id,revision:next.bundle.revision,bundleSha256:next.entry.sha256,authorizedBy:'fixture only',authorizedOn:'2026-10-22',reason:'Fixture withdrawal'},path='docs/releases/withdraw-latest.json',bytes=jsonBytes(decision);f.files.set(path,bytes);
 const withdrawn=resolveFixture(f,[f.event,g.event,{...g.event,type:'withdraw',evidence:{path,sha256:sha(bytes)}}],bundles),output=renderEditions(withdrawn,archive.runtimes,{mode:'release',base});assert.equal(output.currentCount,0);assert.ok(output.outputs.get(`explore/${first.bundle.id}/index.html`).includes('no automatic fallback'));assert.ok(output.canonicalPaths.includes(editionPath(first.bundle.id,first.bundle.revision)));assert.ok(!output.canonicalPaths.includes(`explore/${first.bundle.id}/`));
});
test('assembly rejects unsupported modes, preview canonical claims and missing release destination before writing',async()=>{
 await assert.rejects(()=>buildEditions({mode:'publish'}),/preview or release/);
 await assert.rejects(()=>buildEditions({mode:'preview',base}),/cannot receive/);
 await assert.rejects(()=>buildEditions({mode:'release'}),/base-url/);
});
test('changed imported delivery code or copied companion assets invalidate distribution approval; only declared timestamps are ignored',async()=>{
 const root=await mkdtemp(join(tmpdir(),'atlas-edition-binding-'));
 try {
  for(const p of DELIVERY_CODE){await mkdir(dirname(join(root,p)),{recursive:true});await writeFile(join(root,p),'Fixture source for '+p);}
  for(const p of ['content','data'])await mkdir(join(root,p),{recursive:true});
  await writeFile(join(root,'index.html'),'Fixture shell');await writeFile(join(root,'.nojekyll'),'');
  await writeFile(join(root,'content/example.mjs'),'Fixture companion');
  for(const name of ['index.json','home.json'])await writeFile(join(root,'data',name),JSON.stringify({generated:'old',fixture:1}));
  const before=await deliveryBinding(root),f=fixture();f.decision.deliveryDigest=before.digest;f.sync();
  assert.equal(resolveReleases({schemaVersion:1,events:[f.event]},archive.bundles,{deliveryDigest:before.digest,base,readEvidence:f.readEvidence}).length,1);
  for(const name of ['index.json','home.json'])await writeFile(join(root,'data',name),JSON.stringify({generated:'new',fixture:1}));
  assert.equal((await deliveryBinding(root)).digest,before.digest);
  for(const p of ['scripts/static-ideas.mjs','scripts/build-static-ideas.mjs','explorations/render.mjs','content/example.mjs','assets/css/exploration-delivery.css','data/index.json']){
   const bytes=await readFile(join(root,p));await writeFile(join(root,p),p.endsWith('.json')?JSON.stringify({generated:'new',fixture:2}):String(bytes)+' changed');
   const changed=await deliveryBinding(root);assert.notEqual(changed.digest,before.digest,p);
   assert.throws(()=>resolveReleases({schemaVersion:1,events:[f.event]},archive.bundles,{deliveryDigest:changed.digest,base,readEvidence:f.readEvidence}),/delivery code/);
   await writeFile(join(root,p),bytes);
  }
 } finally {await rm(root,{recursive:true,force:true});}
});
