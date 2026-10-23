import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { observeCatalogRecord, checkCatalogPacket } from '../scripts/catalog-observations.mjs';
const record = () => ({ key: '/books/OL1M', type: { key: '/type/edition' }, revision: 1, title: 'Fictional test record', works: [{ key: '/works/OL1W' }], subjects: ['Nature', 'Nature'] });

test('missing classification is distinct from an explicitly empty field', () => {
  const a = observeCatalogRecord(record(), [0, 1]);
  const b = observeCatalogRecord({ ...record(), lc_classifications: [] }, [0, 1]);
  assert.equal(a.classificationField.state, 'absent'); assert.equal(a.classificationField.values, null);
  assert.equal(b.classificationField.state, 'present'); assert.deepEqual(b.classificationField.values, []);
});

test('record-local subject occurrences preserve repetition, spelling and unknown authority', () => {
  const x = record(); x.subjects.push('Wildnerness areas');
  const observed = observeCatalogRecord(x, [0, 1, 2]);
  assert.deepEqual(observed.subjectField.selected.map(s => s.value), x.subjects);
  for (const s of observed.subjectField.selected) assert.deepEqual([s.authority, s.authorityIdentifier, s.labelLanguage], [null, null, null]);
  assert.deepEqual(observed.linkedWorkIds, ['/works/OL1W']);
  assert.equal(observed.subjectField.totalValues, 3);
});

test('work metadata is never inherited into an edition or promoted to holdings evidence', () => {
  const edition = record(); delete edition.subjects; edition.lc_classifications = ['PS0000 .T1'];
  const work = { key: '/works/OL1W', type: { key: '/type/work' }, revision: 2, title: 'Fictional test work', subjects: ['Another subject'] };
  const e = observeCatalogRecord(edition, []), w = observeCatalogRecord(work, [0]);
  assert.equal(e.subjectField.state, 'absent'); assert.equal(e.subjectField.totalValues, null);
  assert.equal(w.subjectField.totalValues, 1);
  assert.equal(e.classificationField.schemeEdition, null); assert.equal(e.classificationField.physicalLocation, null);
  assert.throws(() => observeCatalogRecord({ ...work, type: { key: '/type/edition' } }, [0]), /kind mismatch/);
});

test('invalid selections and malformed fields are rejected rather than silently normalized', () => {
  for (const indexes of [[-1], [2], [0, 0], [0.5]]) assert.throws(() => observeCatalogRecord(record(), indexes));
  for (const subjects of [null, 'Nature', [false], ['']]) assert.throws(() => observeCatalogRecord({ ...record(), subjects }, []));
});

test('captured-source checks detect changed bytes, wrong list locators and altered observations', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-catalog-test-'));
  try {
    const data = Buffer.from(JSON.stringify({ entries: [record()] }));
    await writeFile(join(dir, 'fixture.body'), data);
    const entry = { capture: { filename: 'fixture.body', bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') }, entryIndex: 0, subjectIndexes: [0], observation: observeCatalogRecord(record(), [0]) };
    const packet = { schemaVersion: 1, status: 'research-preparation', records: [entry] };
    assert.equal((await checkCatalogPacket(packet, dir)).capturedRecords, 1);
    entry.observation.subjectField.selected[0].authority = 'invented';
    await assert.rejects(checkCatalogPacket(packet, dir), /differs/);
    entry.observation = observeCatalogRecord(record(), [0]); entry.entryIndex = 1;
    await assert.rejects(checkCatalogPacket(packet, dir), /locator/);
    entry.entryIndex = 0; await writeFile(join(dir, 'fixture.body'), Buffer.from('changed'));
    await assert.rejects(checkCatalogPacket(packet, dir), /Changed captured/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
