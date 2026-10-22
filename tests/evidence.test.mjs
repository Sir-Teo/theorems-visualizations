import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { EVIDENCE_CODE, implementationDigest, prepareEvidenceSidecars } from '../scripts/evidence-sidecars.mjs';
import { evidenceRoute, legacyEvidenceSnapshot, validateEvidenceRecord } from '../assets/js/evidence-model.js';
import { loadEvidence } from '../assets/js/evidence-view.js';
import { fixtureRecord, sealFixture, hash } from './evidence-fixture.mjs';
import { ROOT } from '../scripts/lib.mjs';
const item = { id: 'pma-4.19', col: 'pma', name: 'Fixture idea', kind: 'Theorem', statement: 'Original statement', deps: ['pma-4.18'], verify: true, file: 'content/pma/ch04.js' };
const collection = { id: 'pma', source: { type: 'book', author: 'Fixture', title: 'Fixture book', edition: 'Test edition' } };
async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'evidence-test-'));
  const save = async (path, value) => {
    await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), typeof value === 'string' ? value : JSON.stringify(value));
    if (path === 'evidence/fixture.json') await writeFile(join(root, 'docs/verification/test-evidence.md'), 'Synthetic test receipts, not actual reviews:\n' + JSON.stringify({ targetId: value.targetId, reviews: value.reviews }));
  };
  try {
    for (const path of EVIDENCE_CODE) await save(path, await readFile(join(ROOT, path), 'utf8'));
    await save(item.file, "import { value } from './helper.js'; export default { value };\n");
    await save('content/pma/helper.js', 'export const value = 1;\n');
    await save('docs/verification/test-evidence.md', 'Synthetic test receipt.');
    await save('evidence/manifest.json', { schemaVersion: 1, entries: [{ targetId: item.id, file: 'fixture.json' }] });
    await run(root, save);
  } finally { await rm(root, { recursive: true, force: true }); }
}
const build = root => prepareEvidenceSidecars({ root, items: [item], collections: [collection] });
test('opaque legacy state survives evidence routes, including encoded aliases and unknown parameters', () => {
  const original = '#/t/pma-4.19?s=x%2By%3D&embed=1&unknown=a?b&x=1&x=2';
  assert.equal(evidenceRoute(evidenceRoute(original), 'idea'), original);
  assert.equal(evidenceRoute('#/evidence/pma-%34.19?z=%2520', 'idea'), '#/t/pma-%34.19?z=%2520');
  for (const bad of ['#/t/../secret', '#/t/x-history-0001', '#/t/pma-4.19/extra']) assert.throws(() => evidenceRoute(bad));
});
test('legacy projection preserves compact flags and dependencies without treating absence as acceptance', () => {
  assert.equal(legacyEvidenceSnapshot({ ...item, verify: 1 }, collection).verificationFlag, true);
  const snapshot = legacyEvidenceSnapshot({ ...item, verify: undefined }, collection);
  assert.equal(snapshot.verificationFlag, false); assert.ok(!('accepted' in snapshot));
  snapshot.prerequisites.push('changed'); assert.deepEqual(item.deps, ['pma-4.18']);
  assert.notEqual(hash(snapshot), hash(legacyEvidenceSnapshot({ ...item, name: 'Changed title' }, collection)));
});
test('empty and local-only registries emit no review or draft payload', () => fixture(async (root, save) => {
  await save('evidence/manifest.json', { schemaVersion: 1, entries: [] });
  assert.deepEqual([...((await build(root)).outputs)], [['evidence.json', '{"schemaVersion":1,"entries":[]}']]);
  await save('evidence/manifest.json', { schemaVersion: 1, entries: [{ targetId: item.id, file: 'fixture.json' }] });
  const r = fixtureRecord(); await sealFixture(root, r, item, collection); r.reviews = []; await save('evidence/fixture.json', r);
  const b = await build(root); assert.equal(b.outputs.size, 1); assert.equal(b.targetImplementations.size, 0); assert.equal(b.publicRecords, 0);
}));
test('public sidecars require actual record-specific receipt files and latest exact bindings', () => fixture(async (root, save) => {
  const r = fixtureRecord(); r.publication = 'public'; await sealFixture(root, r, item, collection); await save('evidence/fixture.json', r);
  const b = await build(root); assert.equal(b.publicRecords, 1); assert.equal(b.targetImplementations.size, 1);
  const corrupt = structuredClone(r); corrupt.claims[0].text += ' changed'; await save('evidence/fixture.json', corrupt);
  await assert.rejects(build(root), /Stale content review/);
  r.reviews.push({ ...r.reviews[0], result: 'changes-requested' }); await save('evidence/fixture.json', r);
  await assert.rejects(build(root), /Missing passing review/);
  r.reviews.pop(); await save('evidence/fixture.json', r); await rm(join(root, 'docs/verification/test-evidence.md'));
  await assert.rejects(build(root), /ENOENT/);
  await save('docs/verification/test-evidence.md', 'An existing but unrelated report.');
  await assert.rejects(build(root), /does not bind this exact receipt/);
}));
test('implementation binding detects helper edits and parses imports without evaluating modules', () => fixture(async (root, save) => {
  const r = fixtureRecord(); r.publication = 'public'; await sealFixture(root, r, item, collection); await save('evidence/fixture.json', r);
  const before = await implementationDigest(root, item.file);
  await save('content/pma/helper.js', 'export const value = 2; throw new Error("MUST NOT EXECUTE");\n');
  assert.notEqual(await implementationDigest(root, item.file), before);
  await assert.rejects(build(root), /stale for the legacy item/);
  await save('content/pma/helper.js', 'export const value = () => import /* comment */ ("./other.js");');
  await assert.rejects(implementationDigest(root, item.file), /Dynamic implementation/);
}));
test('unknown fields, invalid dates, discovery-only sources and unsafe paths never pass', () => fixture(async (root, save) => {
  const r = fixtureRecord(); const { binding } = await sealFixture(root, r, item, collection);
  for (const mutate of [x => x.privateNotes = 'secret', x => x.updatedOn = '2026-99-99', x => x.sources[0].access = 'indexed-only', x => x.sources[0].url = 'javascript:alert(1)', x => x.reviews[0].reviewer.id = x.author, x => x.reviews[0].evidencePath = 'docs/verification/../private.md']) {
    const bad = structuredClone(r); mutate(bad); assert.ok(validateEvidenceRecord(bad, binding).length);
  }
  await save('evidence/manifest.json', { schemaVersion: 1, entries: [{ targetId: item.id, file: '../private.json' }] });
  await assert.rejects(build(root), /Unsafe/);
}));
test('withdrawal exports only a reserved identity and explanation, never old claims or sources', () => fixture(async (root, save) => {
  const r = fixtureRecord(); r.publication = 'withdrawn'; r.withdrawal = { reason: 'Fixture withdrawn', withdrawnOn: '2026-10-22' }; await sealFixture(root, r, item, collection); await save('evidence/fixture.json', r);
  const b = await build(root), payload = JSON.parse(b.outputs.get('evidence/' + item.id + '.json'));
  assert.deepEqual(Object.keys(payload), ['schemaVersion', 'targetId', 'revision', 'publication', 'withdrawal']);
  assert.equal(b.publicRecords, 0);
}));
test('builder and loader share the payload size ceiling', () => fixture(async (root, save) => {
  const r = fixtureRecord(); r.publication = 'public';
  r.sources = Array.from({ length: 30 }, (_, i) => ({ ...r.sources[0], id: 'source-' + i, title: 'x'.repeat(4000), creator: 'x'.repeat(4000), edition: 'x'.repeat(4000), locator: 'x'.repeat(4000), boundary: 'x'.repeat(4000), reuse: 'x'.repeat(4000) })); r.claims[0].sourceIds = ['source-0'];
  await sealFixture(root, r, item, collection); await save('evidence/fixture.json', r);
  await assert.rejects(build(root), /size limit/);
}));
test('loader distinguishes absence, failed access, stale targets, tampering and valid scoped reviews', () => fixture(async (root, save) => {
  const r = fixtureRecord(); r.publication = 'public'; const { target } = await sealFixture(root, r, item, collection); await save('evidence/fixture.json', r);
  const b = await build(root);
  const fetcher = async url => { const path = new URL(url).pathname.replace('/data/', ''); return new Response(b.outputs.get(path), { status: b.outputs.has(path) ? 200 : 404 }); };
  const options = { fetcher, base: new URL('https://example.org/data/') };
  assert.equal((await loadEvidence(target, collection, options)).kind, 'record');
  assert.equal((await loadEvidence({ ...target, scope: 'Changed' }, collection, options)).kind, 'stale');
  assert.equal((await loadEvidence({ ...target, id: 'pma-4.18' }, collection, options)).kind, 'none');
  assert.equal((await loadEvidence(target, collection, { ...options, fetcher: async () => new Response('', { status: 503 }) })).kind, 'unavailable');
  b.outputs.set('evidence/' + item.id + '.json', '{}');
  assert.equal((await loadEvidence(target, collection, options)).kind, 'unavailable');
}));
