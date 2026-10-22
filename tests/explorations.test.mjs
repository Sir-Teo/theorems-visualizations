import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadExplorations, buildExplorations, checkCapacity } from '../scripts/build-explorations.mjs';
import { validateExploration, contentDigest, reviewArtifactDigest } from '../explorations/contract.mjs';
import { draftHref, proposedPublicHref, legacyHref, legacyEvidence, normalizeState, parseState, serializeState, assessHistory } from '../explorations/route-state.mjs';
import { renderExploration, renderIndex } from '../explorations/render.mjs';
import { loadRegistry } from '../scripts/lib.mjs';
const { records: currentRecords } = await loadExplorations();
const records = structuredClone(currentRecords).map(r => ({ ...r, status: 'draft', reviews: [] })), [h,l] = records;
const runtime = await loadRegistry(), coverage = JSON.parse(await readFile(new URL('../docs/coverage/registry.json', import.meta.url)));
const sources = JSON.parse(await readFile(new URL('../docs/coverage/sources.json', import.meta.url)));
const ctx = { domainIds: coverage.domains.map(x => x.id), collectionIds: runtime.collections.map(x => x.id), sourceIds: sources.sources.filter(x => x.access.status !== 'blocked').map(x => x.id) };
test('records validate and generated pages are reproducible', async () => {
  const built = await buildExplorations({ checkOnly: true });
  for (const r of currentRecords) assert.deepEqual(validateExploration(r, { ...ctx, artifactDigest: built.records.find(x => x.id === r.id).artifactDigest }), []);
  assert.equal(built.pages, currentRecords.length + 1);
});
test('claim classification and supporting evidence are separate requirements', () => {
  const fixtures = [
    ['conditional-offer','direct','conditional',true,true],
    ['conditional-offer','direct','speech',true,false],
    ['accepted-alliance','unsupported','none',true,true],
    ['accepted-alliance','direct','proposal',false,false],
    ['public-framing','inference','speech',true,true],
    ['single-cause','unsupported','none',true,true],
  ];
  for (const [task,category,evidence,c,e] of fixtures) {
    const a = assessHistory(h,{task,category,evidence});
    assert.equal(a.classificationMatches,c); assert.equal(a.evidenceMatches,e);
  }
});
test('text fidelity detects changed wording even with the same edition label', () => {
  const r=structuredClone(l);r.passages[1].text=r.passages[1].text.replace('jumping','jumped');
  assert.match(validateExploration(r,ctx).join('\n'),/passage digest mismatch/);
});
test('blocked or invented source references cannot become evidence', () => {
  const r=structuredClone(h);r.passages[0].sourceId='unread';
  assert.match(validateExploration(r,ctx).join('\n'),/passage source missing/);
});
test('a draft cannot become accepted without every independent dimension', () => {
  const r=structuredClone(h);r.status='accepted';
  assert.match(validateExploration(r,ctx).join('\n'),/acceptance missing review/);
});
test('content and rights remain mandatory while every declared additional review still gates acceptance', () => {
  for (const dimension of ['content','rights']) {
    const r=structuredClone(h);r.reviewRequirements=r.reviewRequirements.filter(x=>x!==dimension);
    assert.match(validateExploration(r,ctx).join('\n'),/mandatory review requirement missing/);
  }
  const r=structuredClone(h);r.reviewRequirements.push('accessibility','learning');r.status='accepted';
  const errors=validateExploration(r,ctx).join('\n');
  assert.match(errors,/acceptance missing review: accessibility/);
  assert.match(errors,/acceptance missing review: learning/);
  r.reviewLimitations=['Observation not performed'];const before=contentDigest(r);
  r.reviewLimitations=['Observed'];assert.notEqual(contentDigest(r),before);
  r.reviewLimitations={};assert.match(validateExploration(r,ctx).join('\n'),/review limitations must be text/);
});
test('content changes invalidate exact-version review receipts', () => {
  const r=structuredClone(l);
  const artifactDigest=reviewArtifactDigest(r,{'test-runtime':'a'.repeat(64)});
  r.reviews=[{dimension:'content',result:'passed',reviewer:{id:'independent-test-reviewer',role:'Test fixture only',independent:true},revision:r.revision,contentDigest:contentDigest(r),artifactDigest,evidencePath:'test-only',reviewedOn:'2026-10-22'}];
  assert.deepEqual(validateExploration(r,{...ctx,artifactDigest}),[]);
  r.claims[0].qualification='Changed claim boundary';
  // A revised draft may retain historical receipts; they cannot approve acceptance.
  assert.deepEqual(validateExploration(r,{...ctx,artifactDigest}),[]);
  r.status='accepted';
  assert.match(validateExploration(r,ctx).join('\n'),/review is stale/);
});
test('author cannot self-approve as an independent reviewer', () => {
  const r=structuredClone(h);
  r.reviews=[{dimension:'content',result:'passed',reviewer:{id:r.author,role:'Author',independent:true},revision:r.revision,contentDigest:contentDigest(r),evidencePath:'test-only',reviewedOn:'2026-10-22'}];
  assert.match(validateExploration(r,ctx).join('\n'),/independent reviewer/);
});
test('a third unaccepted exploration exceeds the work-in-progress limit', () => {
  assert.equal(checkCapacity([h,l]),true);
  assert.equal(checkCapacity([h,l,{...h,id:'x-other-0001'}]),false);
});
test('semantic relations do not become prerequisites', () => {
  const r=structuredClone(h);r.relations=[{type:'prerequisite',targetId:'pma-4.19',rationale:'invalid field'}];
  assert.match(validateExploration(r,{...ctx,knownItemIds:['pma-4.19']}).join('\n'),/prerequisites are separate/);
});
test('legacy routes and their saved parameters retain the existing hash path', () => {
  assert.equal(legacyHref('pma-4.19','x=2&mode=a','/theorems-visualizations/'),'/theorems-visualizations/#/t/pma-4.19?x=2&mode=a');
  assert.equal(draftHref(h.id,'/theorems-visualizations/'),'/theorems-visualizations/labs/atlas/x-history-0001/');
  assert.equal(proposedPublicHref(h.id),'/explore/x-history-0001/');
  assert.throws(()=>draftHref('../evil'));
  assert.throws(()=>draftHref(h.id,'//evil/'));
});
test('legacy uncertainty survives without invented review status', () => {
  const item={id:'pma-4.19',kind:'Theorem',verify:true,deps:['pma-4.18']}, a=legacyEvidence(item);
  assert.equal(a.legacy.verify,true);assert.deepEqual(a.reviews,[]);assert.deepEqual(a.prerequisites,item.deps);
  a.prerequisites.push('something');assert.equal(item.deps.length,1);
});
test('public state round-trips selections and excludes notes and unknown keys', () => {
  for (const r of records) {
    const state=normalizeState(r,{task:'single-cause',category:r===h?'unsupported':'interpretation',lens:'punctuation'});
    const hash=serializeState(r,{...state,notes:'PRIVATE',secret:'PRIVATE'});
    assert.ok(!hash.includes('PRIVATE'));assert.deepEqual(parseState(r,hash).state,state);
  }
});
test('malformed and future saved-state input has a bounded fallback', () => {
  assert.match(parseState(h,'#v=99').warning,/unsupported/);
  assert.match(parseState(h,'#'+ 'x'.repeat(1001)).warning,/too long/);
  assert.equal(parseState(h,'#v=1&task=%3Cscript%3E').state.task,'conditional-offer');
});
test('static text and escaped data remain safe without JavaScript', () => {
  const r=structuredClone(l);r.passages[0].text='</script><img src=x onerror=alert(1)>';
  const html=renderExploration(r);
  assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;/script&gt;'));
  assert.ok(html.includes('Read all three comparison guides'));assert.ok(html.includes('noindex,nofollow'));
});
test('invalid identifiers and unknown methods fail before rendering', () => {
  const r=structuredClone(l);r.methods=['unimplemented-vr'];
  assert.match(validateExploration(r,ctx).join('\n'),/unknown implemented method/);
});
test('local withdrawal reserves identity without rendering the former source text', () => {
  const r=structuredClone(l);r.status='withdrawn';r.publication='withdrawn';
  const html=renderExploration(r);
  assert.match(html,/preview has been withdrawn/);assert.ok(!html.includes('Old pond—frogs'));
});
test('a public-release flag is rejected even with an accepted lifecycle label', () => {
  const r=structuredClone(h);r.status='accepted';r.publication='published';
  assert.match(validateExploration(r,ctx).join('\n'),/public release is reserved/);
});
test('renderer changes invalidate reviews even when the authored JSON is unchanged', () => {
  const r=structuredClone(l), old=reviewArtifactDigest(r,{'ui.mjs':'a'.repeat(64)});
  r.reviews=[{dimension:'content',result:'passed',reviewer:{id:'test-reviewer',role:'Fixture',independent:true},revision:r.revision,contentDigest:contentDigest(r),artifactDigest:old,evidencePath:'test-only',reviewedOn:'2026-10-22'}];
  assert.deepEqual(validateExploration(r,{...ctx,artifactDigest:old}),[]);
  const changed=reviewArtifactDigest(r,{'ui.mjs':'b'.repeat(64)});
  r.status='accepted';
  assert.match(validateExploration(r,{...ctx,artifactDigest:changed}).join('\n'),/rendered artifact/);
});
test('superseded receipts remain recoverable while only latest exact-version reviews approve acceptance', () => {
  const r=structuredClone(l), code={'test-runtime':'a'.repeat(64)};
  const receipt=dimension=>({dimension,result:'passed',reviewer:{id:'independent-test-reviewer',role:'Fixture only',independent:true},revision:r.revision,contentDigest:contentDigest(r),artifactDigest:reviewArtifactDigest(r,code),evidencePath:'test-only',reviewedOn:'2026-10-22'});
  r.reviews=r.reviewRequirements.map(receipt);
  r.claims[0].qualification='A revised, explicitly bounded interpretation';
  r.revision='0.2.0';
  r.reviews.push(...r.reviewRequirements.map(receipt));
  r.status='accepted';
  const context={...ctx,artifactDigest:reviewArtifactDigest(r,code)};
  assert.deepEqual(validateExploration(r,context),[]);
  r.reviews.push({...receipt('content'),result:'changes-requested'});
  assert.match(validateExploration(r,context).join('\n'),/acceptance missing review: content/);
});

test('changed related collection labels invalidate acceptance but unrelated metadata does not', () => {
  for (const original of records.filter(r=>currentRecords.find(c=>c.id===r.id).status==='accepted')) {
    const r=structuredClone(original), code={'test-runtime':'a'.repeat(64)};
    const titles=Object.fromEntries(runtime.collections.map(c=>[c.id,c.title]));
    const digest=reviewArtifactDigest(r,code,titles);
    r.reviews=r.reviewRequirements.map(dimension=>({dimension,result:'passed',reviewer:{id:'independent-test-reviewer',role:'Fixture only',independent:true},revision:r.revision,contentDigest:contentDigest(r),artifactDigest:digest,evidencePath:'test-only',reviewedOn:'2026-10-22'}));
    r.status='accepted';
    assert.deepEqual(validateExploration(r,{...ctx,artifactDigest:digest}),[]);
    const changed={...titles,[r.relatedCollectionIds[0]]:'Changed visible collection title'};
    assert.notEqual(renderExploration(r,titles),renderExploration(r,changed));
    assert.match(validateExploration(r,{...ctx,artifactDigest:reviewArtifactDigest(r,code,changed)}).join('\n'),/rendered artifact/);
    assert.equal(reviewArtifactDigest(r,code,{...titles,'unrelated-collection':'Another title'}),digest);
    assert.equal(reviewArtifactDigest(r,code,{}),reviewArtifactDigest(r,code,Object.fromEntries(r.relatedCollectionIds.map(id=>[id,id]))));
  }
});


test('malformed author payloads produce diagnostics rather than crashing the builder',()=>{
  const mutations=[r=>r.activity.prompts={},r=>r.activity.prompts=[null],r=>r.activity.prompts[1].evidenceIds=null,r=>r.timeline=[null],r=>r.relations=[null],r=>r.sources=[[]],r=>r.previousRevisions=['../../escape']];
  for(const mutate of mutations){const r=structuredClone(h);mutate(r);assert.ok(validateExploration(r,ctx).length>0);}
  for(const raw of [null,[],5,'bad'])assert.deepEqual(normalizeState(h,raw),normalizeState(h));
});
test('rendered source forms distinguish original editorial writing from quotations',()=>{
  const r=structuredClone(l);r.passages[0].form='paraphrase';
  const html=renderExploration(r);assert.match(html,/Editorial paraphrase/);assert.equal((html.match(/<blockquote/g)||[]).length,2);
  assert.match(renderExploration(h),/Evidence: <a href="#passage-conditional"/);
});

test('withdrawn index entries do not leak former titles or summaries',()=>{
  const r=structuredClone(h);r.status='withdrawn';r.publication='withdrawn';
  const html=renderIndex([r,l]);assert.ok(!html.includes(r.title));assert.ok(!html.includes(r.summary));assert.match(html,/Withdrawn preview/);
});
test('studio drafts cannot gain full acceptance from invented all-pass review fixtures',()=>{
 for(const original of records.filter(r=>['P07','P08'].includes(r.pilotId))){
  const r=structuredClone(original),artifactDigest=reviewArtifactDigest(r,{'test-runtime':'a'.repeat(64)});r.status='accepted';
  r.reviews=r.reviewRequirements.map(dimension=>({dimension,result:'passed',reviewer:{id:'independent-fixture',role:'Fixture only',independent:true},revision:r.revision,contentDigest:contentDigest(r),artifactDigest,evidencePath:'test-only',reviewedOn:'2026-10-22'}));
  assert.match(validateExploration(r,{...ctx,artifactDigest}).join('\n'),r.pilotId==='P07'?/physical/:/release/);
 }
});
