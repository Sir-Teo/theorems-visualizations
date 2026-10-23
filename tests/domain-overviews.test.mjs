import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readOrientation, orientationHashes, buildDomainOverviews, validateOverviewReviewFiles } from '../scripts/build-domain-overviews.mjs';
import { validateOverviews, overviewDigest, overviewArtifactDigest } from '../orientation/contract.mjs';
import { renderOverview, renderOverviewIndex } from '../orientation/render.mjs';
const data = await readOrientation(), hashes = await orientationHashes();
const artifact = d => overviewArtifactDigest(d, hashes);
const validate = d => validateOverviews(d, artifact(d));
function mutate(name, edit, pattern) {
  test(name, () => { const d = structuredClone(data); edit(d); assert.match(validateOverviews(d, '0'.repeat(64)).join('\n'), pattern); });
}
function reviewedFixture() {
  const d = structuredClone(data), ids = d.catalog.overviews.map(r => r.domainId);
  delete d.catalog.authorVerification;
  d.catalog.review.status = 'reviewed-local';
  d.catalog.review.receipts = ['source-content','engineering'].map(dimension => ({
    dimension, domainIds: ids, result: 'passed', reviewer: { id: 'fixture-' + dimension, kind: 'ai', independent: true },
    contentDigest: overviewDigest(d, ids), ...(dimension === 'engineering' ? {artifactDigest: artifact(d)} : {}),
    reviewedOn: '2026-10-22', evidencePath: 'docs/coverage/reviews/orientation-fixture.md'
  }));
  return d;
}
test('30 unique orientations have usable scoped reading tasks and reproducible pages', async () => {
  assert.deepEqual(validate(data), []);
  assert.deepEqual(await validateOverviewReviewFiles(data), []);
  assert.equal(data.catalog.overviews.length, 30);
  assert.equal((await buildDomainOverviews({checkOnly:true})).pages, 31);
});
mutate('a repeated domain cannot conceal a missing one', d => d.catalog.overviews[1].domainId = 'D01', /30 domains exactly once/);
mutate('a source from another field cannot satisfy a next step', d => d.catalog.overviews[0].sourceIds = ['orientation-nist-eda'], /out-of-scope source|next step/);
mutate('an unavailable source cannot become supporting evidence', d => d.sources.unavailableCandidates.push({url:d.sources.sources[0].url}), /unavailable candidate/);
mutate('javascript and authenticated source links are rejected', d => d.sources.sources[0].url = 'javascript:alert(1)', /unsafe source URL/);
mutate('unread discovery metadata cannot claim a body receipt', d => d.sources.sources[0].access.status = 'indexed', /scoped body receipt/);
mutate('orientation pages cannot claim lesson acceptance', d => d.catalog.overviews[0].accepted = true, /cannot claim lesson acceptance/);
mutate('a local catalog cannot silently become public', d => d.catalog.publication = 'published', /Only local/);
mutate('unsupported gap keys cannot reach the renderer', d => d.catalog.overviews[0].representationGaps[''] = 'Extra gap', /representation gaps must be exactly/);
mutate('collection and pilot routes cannot escape their local base', d => { d.collectionLinks[0].collectionId = '../../private'; d.pilotLinks[0].id = '../private'; }, /Invalid collection link[\s\S]*Invalid pilot link/);
test('malformed structures return diagnostics without throwing', () => {
  for (const edit of [d=>d.catalog.overviews=null,d=>d.catalog.overviews[0].sourceIds={},d=>d.catalog.overviews[0].relatedDomainIds='D02',d=>d.sources.sources[0].domainIds=null,d=>d.sources.unavailableCandidates={},d=>d.registry.domains[0].gaps=[null],d=>d.catalog.review.receipts=[null],d=>d.catalog.review=null]) {
    const d=structuredClone(data);edit(d);assert.ok(validateOverviews(d).length>0);
  }
});
test('review binds source wording, reading tasks, neighboring titles, collection links and pilot status', () => {
  const d=reviewedFixture();assert.deepEqual(validate(d),[]);
  for (const edit of [x=>x.sources.sources[0].summary+=' Changed',x=>x.catalog.overviews[0].nextStep.task+=' Changed',x=>x.registry.domains[1].title+=' Changed',x=>x.collectionLinks[0].title+=' Changed',x=>x.pilotLinks[0].status='withdrawn']) {
    const copy=structuredClone(d);edit(copy);assert.match(validate(copy).join('\n'),/review missing\/stale/);
  }
});
test('renderer edits invalidate engineering review, while review metadata avoids circular hashing', () => {
  const d=reviewedFixture(), changed={...hashes,'orientation/render.mjs':'0'.repeat(64)};
  assert.match(validateOverviews(d,overviewArtifactDigest(d,changed)).join('\n'),/artifact review missing\/stale/);
  const before=overviewDigest(d,['D01']);d.catalog.review.receipts[0].reviewedOn='2026-10-23';
  assert.equal(overviewDigest(d,['D01']),before);
});
test('source and engineering reviews must be independent of author and each other', () => {
  for (const edit of [r=>r.receipts=[],r=>r.receipts[0].reviewer.id=r.author,r=>r.receipts[1].reviewer.id=r.receipts[0].reviewer.id,r=>r.receipts[0].reviewer.kind='human']) {
    const d=reviewedFixture();edit(d.catalog.review);assert.ok(validate(d).length>0);
  }
});
test('evidence paths and exact report digest references are checked', async () => {
  const root=await mkdtemp(join(tmpdir(),'orientation-receipts-')), d=reviewedFixture();
  try {
    assert.match((await validateOverviewReviewFiles(d,root)).join('\n'),/Missing orientation evidence/);
    await mkdir(join(root,'docs/coverage/reviews'),{recursive:true});
    await writeFile(join(root,'docs/coverage/reviews/orientation-fixture.md'),'A pass without a digest');
    assert.match((await validateOverviewReviewFiles(d,root)).join('\n'),/exact digest/);
    d.catalog.review.receipts[0].evidencePath='../../private';
    assert.match(validate(d).join('\n'),/evidence binding/);
    assert.match((await validateOverviewReviewFiles(d,root)).join('\n'),/Unsafe orientation evidence path/);
  } finally {await rm(root,{recursive:true,force:true});}
});
test('all editorial text and attribute values are escaped', () => {
  const d=structuredClone(data), injection='"><img src=x onerror=alert(1)>';
  d.catalog.overviews[0].summary=injection;d.registry.domains[0].methods=[injection];d.registry.domains[0].title=injection;
  for (const html of [renderOverviewIndex(d),renderOverview(d,d.catalog.overviews[0])]) {
    assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;img'));
  }
});
test('local links resolve to real pages at root and a project prefix', async () => {
  for (const prefix of ['/','/project/']) for(const row of data.catalog.overviews) {
    const html=renderOverview(data,row), base=new URL(prefix+'labs/atlas/domains/'+row.domainId+'/', 'https://example.org');
    for(const [,href] of html.matchAll(/href="([^"]+)"/g)) {
      if(href.startsWith('https:')||href.startsWith('#'))continue;
      const url=new URL(href,base);assert.ok(url.pathname.startsWith(prefix));
      let relative=url.pathname.slice(prefix.length);if(relative.endsWith('/')||relative==='')relative+='index.html';
      await readFile(new URL('../'+relative,import.meta.url));
    }
    assert.ok(html.includes('noindex,nofollow'));assert.ok(!html.includes('rel="canonical"'));
  }
});
test('explicit read roots use the target runtime metadata, never the author checkout', async () => {
  const root=await mkdtemp(join(tmpdir(),'orientation-root-'));
  try {
    await mkdir(join(root,'scripts'),{recursive:true});
    await writeFile(join(root,'scripts/lib.mjs'),'export async function loadRegistry(){throw new Error("TARGET-RUNTIME-READ")};');
    await assert.rejects(readOrientation(root),/TARGET-RUNTIME-READ/);
  } finally {await rm(root,{recursive:true,force:true});}
});
