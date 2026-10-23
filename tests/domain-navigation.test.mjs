import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareNavigation,navigationBinding} from '../scripts/build-domain-navigation.mjs';
import {hash,json,renderDomainNavigation,resolveDomainReleases,attachDomainNavigation,NAV_CODE} from '../scripts/domain-navigation.mjs';
import {overviewDigest} from '../orientation/contract.mjs';
import {escape as esc,renderOverview} from '../orientation/render.mjs';
import {matchesDomain} from '../navigation/filter.mjs';
const p=await prepareNavigation(),base='https://example.org/project/';
const releaseCatalog={schemaVersion:1,mode:'release',explorations:[],currentCount:0,retainedEditionCount:0};
// All authorizations below are synthetic fixtures, never real release evidence.
function fixture(ids=p.data.catalog.overviews.map(r=>r.domainId)){
  const receipt='Synthetic fixture only. No actual reviewer authorization.',ref={path:'docs/releases/nav-test-review.md',sha256:hash(receipt)},reviewer={id:'independent-fixture-only',role:'Fixture, no credentials',independent:true};
  const sourceIds=[...new Set(p.data.catalog.overviews.filter(r=>ids.includes(r.domainId)).flatMap(r=>r.sourceIds))];
  const decision={schemaVersion:1,decision:'approve-domain-navigation',domains:ids.map(id=>({id,revision:p.data.catalog.overviews.find(r=>r.domainId===id).revision})),catalogVersion:p.data.catalog.catalogVersion,sourceDigest:overviewDigest(p.data,ids),sourceArtifactDigest:p.verification.artifactDigest,navigationDigest:p.binding.digest,canonicalBase:base,authorizedBy:'fixture only',authorizedOn:'2026-10-22',scope:'Synthetic test only',materials:[...sourceIds,'original-editorial-material','navigation-software'].map(id=>({id,basis:'Fixture',territories:'Fixture',scope:'Fixture',reviewer,evidence:ref})),engineering:{reviewer,evidence:ref}};
  const files=new Map([[ref.path,receipt]]),path='docs/releases/nav-test-approval.json',event={type:'publish',evidence:{path,sha256:''}};
  function sync(){const bytes=json(decision);files.set(path,bytes);event.evidence.sha256=hash(bytes);}sync();
  return {decision,event,files,sync,context:{navigationDigest:p.binding.digest,sourceArtifactDigest:p.verification.artifactDigest,base,readEvidence:path=>{assert.ok(files.has(path));return files.get(path);}}};
}
const resolve=(f,events=[f.event],data=p.data)=>resolveDomainReleases({schemaVersion:1,events},data,f.context);
function withdrawal(f,ids=['D20']){const decision={schemaVersion:1,decision:'withdraw-domain-orientations',domains:ids.map(id=>({id,revision:'0.1.0'})),authorizedBy:'fixture only',authorizedOn:'2026-10-22',reason:'Synthetic withdrawal <reason>'},path='docs/releases/nav-test-withdraw.json',bytes=json(decision);f.files.set(path,bytes);return {type:'withdraw',evidence:{path,sha256:hash(bytes)}};}
test('navigation joins all 30 reviewed orientations to85 distinct collections and24 checked local explorations without draft leakage',()=>{
  const c=JSON.parse(p.rendered.outputs.get('domains/catalog.json'));assert.equal(c.liveCount,30);assert.equal(c.distinctCollections,85);assert.equal(c.distinctExplorations,24);assert.equal(p.rendered.outputs.size,33);
  assert.equal(c.domains.reduce((n,r)=>n+r.primaryCount,0),85);assert.equal(c.domains.reduce((n,r)=>n+r.crossCount,0),8);
  const text=[...p.rendered.outputs.values()].join('\n');assert.ok(text.includes('x-craft-0001'));assert.ok(text.includes('x-performance-0001'));assert.ok(!text.includes('Local pilots'));
  for(const r of c.domains)for(const x of r.editions)assert.ok(p.catalog.explorations.some(e=>e.id===x.id&&e.state==='preview'));
  assert.equal(c.domains.find(r=>r.id==='D10').primaryCount,0);assert.equal(c.domains.find(r=>r.id==='D10').editions.length,3);assert.equal(c.domains.find(r=>r.id==='D14').editions.length,1);
});
test('adapter preserves every reviewed substantive field, exact source section and reading limits without mutating author data',()=>{
  const before=JSON.stringify(p.data);
  for(const r of p.data.catalog.overviews){const html=p.rendered.outputs.get(`domains/${r.domainId}/index.html`),original=renderOverview(p.data,r);
    for(const value of [r.summary,...r.questions,...r.territory,...r.waysToExplore,...r.boundaries,...Object.values(r.representationGaps),r.nextStep.task,r.nextStep.preparation])assert.ok(html.includes(esc(value)),r.domainId+': '+value);
    const sourceSection=h=>h.match(/<section><h2>Sources and reading limits<\/h2>([^]*?)<\/section>/)[0];assert.equal(sourceSection(html),sourceSection(original));
    assert.ok(html.includes('No domain specialist or community representative is appointed'));
    assert.ok(!html.includes('../../../../'));assert.ok(!/href="[^" ]*(?:labs\/|docs\/)/.test(html));assert.ok(!html.includes('rel="canonical"'));
  }assert.equal(JSON.stringify(p.data),before);
});
test('filter search combines words, methods and route availability; resets and nonmatches do not claim coverage',()=>{
  const rows=p.rendered.domains;
  assert.equal(rows.filter(r=>matchesDomain({...r,collections:r.collections.length,editions:r.editions.length})).length,30);
  const match=(r,f)=>matchesDomain({...r,collections:r.collections.length,editions:r.editions.length},f);
  assert.ok(rows.filter(r=>match(r,{query:'ＭＡＴＨＥＭＡＴＩＣＳ'})).some(r=>r.id==='D01'));
  assert.ok(rows.filter(r=>match(r,{query:'evidence',method:'source-comparison'})).every(r=>r.methods.includes('source-comparison')));
  assert.equal(rows.filter(r=>match(r,{route:'editions'})).length,new Set(p.catalog.explorations.flatMap(e=>e.domainIds)).size);assert.ok(rows.filter(r=>match(r,{route:'reading'})).every(r=>!r.collections.length&&!r.editions.length));
  assert.equal(rows.filter(r=>match(r,{query:'zzzznoresult'})).length,0);assert.equal(rows.filter(r=>match(r,{route:'unknown'})).length,0);
});
test('empty real ledgers deliver no domains, new assets or domain canonical metadata',async()=>{
  const real=await prepareNavigation({mode:'release',base});assert.equal(real.entries.length,0);assert.equal(real.rendered.outputs.size,0);assert.equal(Object.keys(real.assets).length,0);assert.equal(real.rendered.canonicalPaths.length,0);
  assert.deepEqual(JSON.parse(await readFile(new URL('../navigation/releases.json',import.meta.url))).events,[]);
  await assert.rejects(()=>prepareNavigation({mode:'publish'}));await assert.rejects(()=>prepareNavigation({mode:'preview',base}));await assert.rejects(()=>prepareNavigation({mode:'release'}));
});
test('public delivery needs exact source, full navigation, destination and independent material/engineering decisions',()=>{
  const f=fixture();assert.equal(resolve(f).length,30);
  for(const change of [d=>delete d.authorizedBy,d=>d.materials.pop(),d=>d.materials[0].scope='',d=>d.engineering.reviewer.independent=false,d=>d.domains.push(d.domains[0]),d=>d.domains[0].revision='0.9.0',d=>d.sourceDigest='0'.repeat(64),d=>d.sourceArtifactDigest='0'.repeat(64),d=>d.navigationDigest='0'.repeat(64),d=>d.canonicalBase='https://other.example/',d=>d.catalogVersion='0.2.0']){
    const g=fixture();change(g.decision);g.sync();assert.throws(()=>resolve(g));
  }
  const g=fixture();g.files.set('docs/releases/nav-test-review.md','changed');assert.throws(()=>resolve(g),/evidence changed/);
  const h=fixture();h.event.evidence.path='../escape';assert.throws(()=>resolve(h),/Unsafe/);
});
test('changed source or edition context cannot reuse old approval; release rejects preview/draft exploration catalogs',()=>{
  const f=fixture(),data=structuredClone(p.data);data.catalog.overviews[0].summary+=' changed';assert.throws(()=>resolve(f,[f.event],data),/source review binding/);
  assert.throws(()=>renderDomainNavigation(p.data,resolve(f),p.catalog,{mode:'release',base}),/modes differ/);
  const bad={...p.catalog,mode:'release'};assert.throws(()=>renderDomainNavigation(p.data,resolve(f),bad,{mode:'release',base}),/status/);
  const wrong=structuredClone(p.catalog);wrong.explorations[0].currentRevision='9.9.9';assert.throws(()=>renderDomainNavigation(p.data,p.entries,wrong),/context differs/);
});
test('partial releases omit unavailable targets; canonical paths cover only actually delivered live domains',()=>{
  const f=fixture(['D01','D02']),result=renderDomainNavigation(p.data,resolve(f),releaseCatalog,{mode:'release',base});
  assert.equal(result.liveCount,2);assert.deepEqual(result.canonicalPaths.sort(),['domains/','domains/D01/','domains/D02/']);
  const html=result.outputs.get('domains/D01/index.html');assert.ok(html.includes('D03 · orientation not included'));assert.ok(!html.includes('href="../D03/"'));assert.ok(html.includes('href="../D02/"'));assert.ok(html.includes('rel="canonical"'));
  assert.ok(html.includes('Available fields'));assert.ok(!html.includes('All 30 domains'));
  assert.ok(result.outputs.get('domains/index.html').includes('Original catalog scope:'));
  assert.equal(JSON.parse(result.outputs.get('domains/catalog.json')).distinctCollections,26);
});
test('withdrawal reserves identity and strips former title, source and content from every new output and backlink',()=>{
  const f=fixture(),w=withdrawal(f),states=resolve(f,[f.event,w]),result=renderDomainNavigation(p.data,states,releaseCatalog,{mode:'release',base}),r=p.data.catalog.overviews.find(r=>r.domainId==='D20'),d=p.data.registry.domains.find(d=>d.id==='D20');
  const all=[...result.outputs.values()].join('\n');for(const value of [d.title,r.summary,...r.questions,...r.sourceIds.map(id=>p.data.sources.sources.find(s=>s.id===id).url)])assert.ok(!all.includes(esc(value)),value);
  assert.ok(!result.canonicalPaths.includes('domains/D20/'));assert.match(result.outputs.get('domains/D20/index.html'),/&lt;reason&gt;/);
  assert.throws(()=>resolve(f,[w]),/previous release/);assert.throws(()=>resolve(f,[f.event,w,f.event]),/new reviewed revision/);
  const collection='<main>Original collection text</main>';assert.equal(attachDomainNavigation('ideas/collections/tech/index.html',collection,result.domains),collection);
});
test('all-withdrawn builds contain only tombstones/generic context and retain no canonical domain routes',()=>{
  const f=fixture(),states=resolve(f,[f.event,withdrawal(f,p.data.catalog.overviews.map(r=>r.domainId))]),result=renderDomainNavigation(p.data,states,releaseCatalog,{mode:'release',base});
  assert.equal(result.liveCount,0);assert.equal(result.retainedCount,30);assert.equal(result.canonicalPaths.length,0);
  const all=[...result.outputs.values()].join('\n');for(const r of p.data.catalog.overviews)assert.ok(!all.includes(r.summary));assert.ok(!all.includes('rel="canonical"'));assert.ok(!all.includes('data-search='));
});
test('collection/back-navigation is explicit and reversible, with no item or alias changes',()=>{
  const original='<main><p>Existing collection content</p></main>',adapted=attachDomainNavigation('ideas/collections/mathbio/index.html',original,p.rendered.domains);
  assert.ok(adapted.includes('Mathematics'));assert.ok(adapted.includes('Life sciences'));assert.ok(adapted.includes('cross-listed'));assert.ok(adapted.includes('primary'));
  assert.equal(adapted.replace(/<nav class="reading-notice"[^]*?<\/nav>/,''),original);
  assert.equal(attachDomainNavigation('ideas/mathbio-1.1/index.html',original,p.rendered.domains),original);
  assert.throws(()=>attachDomainNavigation('index.html','Unknown app shell',p.rendered.domains),/Unknown navigation adapter/);
});
test('delivery binding includes new modules, original reviewed orientation closure, source receipts and exact edition join inputs',async()=>{
  const binding=await navigationBinding(p.data);
  for(const path of [...NAV_CODE,'orientation/render.mjs','orientation/contract.mjs','orientation/ui.mjs','scripts/build-domain-overviews.mjs','docs/coverage/registry.json','docs/coverage/overviews.json','docs/coverage/overview-sources.json','editions/manifest.json','editions/releases.json',...p.data.catalog.review.receipts.map(r=>r.evidencePath)])assert.ok(binding.files[path],path);
  assert.equal(binding.digest,p.binding.digest);assert.ok(!Object.hasOwn(binding.files,'navigation/releases.json'),'Approval ledger must not create a self-referential binding');
});
