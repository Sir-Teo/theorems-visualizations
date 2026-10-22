import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadRegistry } from '../scripts/lib.mjs';
import { readCoverage, validateCoverage, validateBriefFiles, classificationReviewDigest, validateClassificationReviewFiles } from '../scripts/validate-coverage.mjs';

const data = await readCoverage(), runtime = await loadRegistry();
const ids = runtime.collections.map(x => x.id);
const validate = (d) => validateCoverage(d, ids, runtime.fields.length);
function mutation(name, edit, expected) {
  test(name, () => {
    const copy = structuredClone(data); edit(copy);
    assert.ok(validate(copy).some(e => expected.test(e)), 'Expected error: ' + expected);
  });
}
test('registry matches actual collection metadata and all brief files', async () => {
  assert.deepEqual(runtime.problems.filter(x => x.level === 'error'), []);
  assert.deepEqual(validate(data), []);
  assert.deepEqual(await validateBriefFiles(data), []);
  assert.deepEqual(await validateClassificationReviewFiles(data), []);
});
mutation('losing a collection primary is detected', d => {
  d.registry.collectionMappings = d.registry.collectionMappings.filter(x => x.collectionId !== 'pma');
}, /missing primary pma/);
mutation('cross-listings cannot conceal two primary homes', d => {
  d.registry.collectionMappings.push({ collectionId: 'pma', domainId: 'D02', relationship: 'primary', rationale: 'bad duplicate' });
}, /duplicate primary pma/);
mutation('unknown collections cannot inflate the inventory', d => {
  d.registry.collectionMappings[0].collectionId = 'invented';
}, /unknown collection invented/);
mutation('removed classification entry remains accountable', d => {
  d.registry.crosswalks = d.registry.crosswalks.filter(x => !(x.schemeId === 'isced-f' && x.code === '9999'));
}, /missing category isced-f:9999/);
mutation('coordinated deletion from inventory and crosswalk breaks the edition pin', d => {
  const s = d.inventory.schemes.find(x => x.id === 'ford');
  s.codes = s.codes.filter(x => x !== '1.7'); s.expectedCount--;
  d.registry.crosswalks = d.registry.crosswalks.filter(x => !(x.schemeId === 'ford' && x.code === '1.7'));
}, /pinned inventory hash mismatch/);
mutation('duplicate crosswalk categories cannot hide an omission', d => {
  d.registry.crosswalks.push(structuredClone(d.registry.crosswalks[0]));
}, /duplicate category/);
mutation('unknown domain IDs in a crosswalk fail', d => {
  d.registry.crosswalks[0].domainIds = ['D99'];
}, /unknown reference D99/);
mutation('administrative exclusion cannot also imply coverage', d => {
  d.registry.crosswalks.find(x => x.code === '9999').domainIds = ['D01'];
}, /excluded category cannot claim domains/);
mutation('source references must resolve', d => {
  d.pilots.pilots[0].sourceIds.push('unread-invention');
}, /unknown reference unread-invention/);
mutation('blocked bodies cannot support a researched pilot', d => {
  d.pilots.pilots[0].sourceIds.push('stop-founders');
}, /blocked source cannot support/);
mutation('research is not production acceptance', d => {
  d.pilots.pilots[0].accepted = true;
}, /cannot claim accepted/);
mutation('domain presence is not introductory coverage', d => {
  d.registry.domains[0].coverage.introductory = 'complete';
}, /planning metadata cannot claim/);
mutation('unassigned review roles cannot be promoted silently', d => {
  d.pilots.pilots[0].reviewers[0].status = 'approved';
}, /reviewer role is not an assignment/);
mutation('candidate proposals cannot register runtime collections', d => {
  d.registry.domains[0].candidateCollections[0].runtimeCollectionId = 'newcollection';
}, /candidate cannot become a runtime collection/);
mutation('domain and pilot links must agree', d => {
  d.registry.domains.find(x => x.id === 'D20').pilotIds = [];
}, /asymmetric domain link D20/);
test('missing brief files fail with a concrete path', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'coverage-empty-'));
  try {
    const errors = await validateBriefFiles(data, temp);
    assert.equal(errors.length, 8);
    assert.ok(errors.every(x => x.includes('brief file missing')));
  } finally { await rm(temp, { recursive: true, force: true }); }
});
test('malformed top-level structure is reported without crashing', () => {
  const copy = structuredClone(data); copy.registry.domains = null;
  assert.match(validate(copy).join('\n'), /expected object array/);
});
mutation('unspecified language fields cannot silently widen to the arts/humanities parent',d=>{
 d.registry.crosswalks.find(c=>c.schemeId==='isced-f'&&c.code==='0230').routing.scopeCode='02';
},/routing kind\/scope disagrees/);
mutation('residual and interdisciplinary categories cannot exchange semantics',d=>{
 d.registry.crosswalks.find(c=>c.schemeId==='isced-f'&&c.code==='0619').routing.kind='interdisciplinary';
},/routing kind\/scope disagrees/);
mutation('unknown fields and provisional heritage cannot become mapped by status alone',d=>{
 d.registry.crosswalks.find(c=>c.schemeId==='ich').disposition='mapped';
},/provisional heritage route requires review/);
mutation('review scope cannot quietly drop a tagged classification row',d=>{
 d.registry.classificationReviews[0].scopeKeys.pop();
},/mapping review batch missing or out of scope/);
function reviewedFixture(){
 const copy=structuredClone(data),review=copy.registry.classificationReviews[0];review.status='reviewed';
 const digest=classificationReviewDigest(copy,review);
 review.receipts=['source-routing','engineering'].map(dimension=>({dimension,result:'passed',reviewer:{id:'fixture-'+dimension,kind:'ai',independent:true},digest,evidencePath:'docs/coverage/reviews/fixture-only.md',reviewedOn:'2026-10-22'}));
 return copy;
}
test('exact reviewed routes bind parent scopes, domain meanings and source-access limitations',()=>{
 const baseline=reviewedFixture();assert.deepEqual(validate(baseline),[]);
 for(const edit of [d=>d.registry.crosswalks.find(c=>c.code==='0230').domainIds=['D01'],d=>d.registry.domains.find(x=>x.id==='D23').scope='Changed meaning',d=>d.sources.sources.find(x=>x.id==='isced2013').access.scope='Different evidence',d=>d.inventory.schemes.find(x=>x.id==='isced-f').edition='Unreviewed edition']){
  const copy=structuredClone(baseline);edit(copy);assert.match(validate(copy).join('\n'),/review missing or stale/);
 }
 const unrelated=structuredClone(baseline);unrelated.pilots.pilots[0].nextAction='A changed planning action';assert.deepEqual(validate(unrelated),[]);
});
test('two separate independent AI roles are required to report the classification batch reviewed',()=>{
 for(const edit of [r=>r.receipts=[],r=>r.receipts[1].reviewer.id=r.receipts[0].reviewer.id,r=>r.receipts[0].reviewer.id=r.author,r=>r.receipts[0].reviewer.kind='human']){
  const copy=reviewedFixture();edit(copy.registry.classificationReviews[0]);assert.ok(validate(copy).length>0);
 }
});
test('malformed review metadata reports diagnostics rather than throwing',()=>{
 for(const edit of [d=>d.registry.classificationReviews[0].scopeKeys=null,d=>d.registry.classificationReviews[0].receipts=[null],d=>d.registry.routingKinds=null,d=>d.registry.crosswalks[0].routing=null]){
  const copy=structuredClone(data);edit(copy);assert.ok(validate(copy).length>0);
 }
});
test('classification evidence paths cannot escape the review directory',async()=>{
 const copy=reviewedFixture();copy.registry.classificationReviews[0].receipts[0].evidencePath='../../private';
 assert.match(validate(copy).join('\n'),/malformed review binding/);assert.match((await validateClassificationReviewFiles(copy)).join('\n'),/unsafe evidence path/);
});
test('classification evidence file checks preserve diagnostics on malformed metadata',async()=>{
 for(const edit of [d=>d.registry=null,d=>d.registry.classificationReviews={},d=>d.registry.classificationReviews=[null],d=>d.registry.classificationReviews[0].receipts={},d=>d.registry.classificationReviews[0].receipts=[null],d=>d.registry.classificationReviews[0].receipts=[[]],d=>d.registry.classificationReviews[0].receipts[0].digest=null]){
  const copy=reviewedFixture();edit(copy);
  assert.ok((await validateClassificationReviewFiles(copy)).length>0);
 }
 assert.ok((await validateClassificationReviewFiles(null)).length>0);
});
