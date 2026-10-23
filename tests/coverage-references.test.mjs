import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { classificationKey, headingKey, validateResourceReferences, buildLibraryReferences, validateLibraryReferences } from '../scripts/coverage-references.mjs';

const sourceBytes = await readFile(new URL('../docs/coverage/research/library-context-20261022.json', import.meta.url));
const source = JSON.parse(sourceBytes);
const baseline = buildLibraryReferences(sourceBytes);
const c = () => ({ kind: 'classification', scheme: 'fixture-scheme', variant: 'fixture-local', edition: { kind: 'dated-edition', value: '2020' }, code: 'S' });
const h = id => ({ kind: 'subject-heading', authority: 'fictional-test-authority', edition: { kind: 'dated-edition', value: '2020' }, identifier: id, labels: [{ text: 'Fictional test label', language: 'en' }] });

test('real adapter preserves all three layers, original rows and source limits without inflating coverage', async () => {
  const bundle = JSON.parse(await readFile(new URL('../coverage-references/library-context.json', import.meta.url)));
  validateLibraryReferences(bundle, sourceBytes);
  assert.deepEqual(bundle.counts, { outlineRows: 35, archivedScheduleRows: 7, historicalLocalRows: 8, referenceRows: 50, importedHeadingRecords: 0, catalogRecords: 0 });
  const originals = ['proposedLccRoutes', 'archivedScheduleSamples', 'localSchemeComparisons'].flatMap(k => source[k]);
  assert.deepEqual(bundle.classifications.map(r => r.original), originals);
  assert.deepEqual(bundle.sourceReceipts, source.sources);
  assert.deepEqual(bundle.retainedGates, source.retainedGates);
  assert.equal(bundle.retainedGates.length, 11);
  for (const [path, expected] of Object.entries(source.canonicalBindings)) {
    const bytes = await readFile(new URL('../' + path, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, path);
  }
});

test('same bare letters in LCC and historical Xwi7xwa remain different identities', () => {
  const entries = baseline.classifications.filter(r => r.code === 'S');
  assert.equal(entries.length, 2);
  assert.notEqual(entries[0].key, entries[1].key);
  assert.notDeepEqual(entries[0].original.candidateDomainIds, entries[1].original.candidateDomainIds);
  assert.equal(entries[0].edition.kind, 'retrieval-snapshot');
  assert.equal(entries[1].edition.value, '2018-03-28');
});

test('scheme, variant, edition kind/date and exact code all participate in identity', () => {
  const original = c(); const key = classificationKey(original);
  for (const patch of [{ scheme: 'other' }, { variant: 'other' }, { code: 's' }, { code: 'S ' },
    { edition: { kind: 'retrieval-snapshot', value: '2020' } }, { edition: { kind: 'dated-edition', value: '2021' } }]) {
    assert.notEqual(classificationKey({ ...original, ...patch }), key);
  }
  assert.notEqual(classificationKey({ ...c(), scheme: 'a:b', variant: 'c' }), classificationKey({ ...c(), scheme: 'a', variant: 'b:c' }));
  assert.throws(() => classificationKey({ ...c(), variant: '' }));
  assert.throws(() => classificationKey({ ...c(), edition: { kind: 'latest', value: 'current' } }));
});

test('heading identity uses authority and identifier, never label similarity or a classification code', () => {
  const a = h('one'); const b = h('two');
  assert.notEqual(headingKey(a), headingKey(b));
  assert.notEqual(headingKey(a), headingKey({ ...a, authority: 'another-fixture' }));
  assert.equal(headingKey(a), headingKey({ ...a, labels: [{ text: 'Another label', language: 'en' }] }));
  assert.throws(() => headingKey({ ...a, labels: [{ text: 'Unknown language' }] }));
  assert.throws(() => headingKey(c()));
  assert.throws(() => classificationKey(a));
});

test('one catalog record may have multiple headings without turning them into shelf placements', () => {
  const classification = c(); const headings = [h('one'), h('two')];
  const record = { catalog: 'fictional-catalog', recordId: 'fixture-record', classifications: [classificationKey(classification)], subjectHeadings: headings.map(headingKey) };
  validateResourceReferences(record, [classification], headings);
  assert.throws(() => validateResourceReferences({ ...record, classifications: record.subjectHeadings }, [classification], headings));
  assert.throws(() => validateResourceReferences({ ...record, subjectHeadings: [...record.subjectHeadings, record.subjectHeadings[0]] }, [classification], headings));
  assert.throws(() => validateResourceReferences(record, [classification], [headings[0], headings[0]]));
});

test('changed editorial routes, missing gates, invented headings and stale source pins fail reproduction', () => {
  for (const mutate of [x => { x.classifications[0].original.candidateDomainIds = ['D30']; },
    x => { x.retainedGates.pop(); }, x => { x.subjectHeadings.push(h('invented')); },
    x => { x.source.sha256 = '0'.repeat(64); }, x => { x.sourceReceipts[0].limits = 'No limits'; }]) {
    const x = structuredClone(baseline); mutate(x);
    assert.throws(() => validateLibraryReferences(x, sourceBytes));
  }
});

test('ambiguous source receipts and repeated classification identities cannot be silently imported', () => {
  for (const mutate of [x => { x.sources.push(structuredClone(x.sources.find(s => s.id === x.proposedLccRoutes[0].sourceId))); },
    x => { x.proposedLccRoutes.push(structuredClone(x.proposedLccRoutes[0])); },
    x => { x.proposedLccRoutes[0].snapshot = ''; }]) {
    const x = structuredClone(source); mutate(x);
    assert.throws(() => buildLibraryReferences(Buffer.from(JSON.stringify(x))));
  }
});
