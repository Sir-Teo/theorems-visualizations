import assert from 'node:assert/strict';
import { test } from 'node:test';
import { crossFieldInventory, acceptedCrossFieldInventory } from '../scripts/audit-cross-field-deps.mjs';

test('connection counts distinguish published prerequisites, future items, same-field links and missing IDs', () => {
  const report = crossFieldInventory({ collections: [{ id: 'a', field: 'physics' }, { id: 'b', field: 'physics' }, { id: 'm', field: 'math' }],
    items: [{ id: 'a-1', col: 'a', deps: ['b-1', 'm-1', 'm-1', 'm-2', 'missing'] }, { id: 'b-1', col: 'b' }, { id: 'm-1', col: 'm' }],
    planned: [{ id: 'a-2', col: 'a', deps: ['m-1'] }, { id: 'm-2', col: 'm' }] }, 2);
  const a = report.entries.find(e => e.collection === 'a');
  assert.equal(a.writtenToWritten, 1); assert.equal(a.writtenToKnown, 2); assert.equal(a.wholeSyllabus, 3);
  assert.equal(a.publishedShortfall, 1);
  assert.deepEqual(a.unknown, [{ item: 'a-1', prerequisite: 'missing' }]);
  assert.equal(report.collections, 2);
  assert.equal(report.publishedBelowTarget, 2); assert.equal(report.wholeSyllabusBelowTarget, 1);
});

const fixture = () => ({ collections: [{ id: 'a', field: 'physics' }, { id: 'm', field: 'math' }],
  items: [{ id: 'a-1', col: 'a', deps: ['m-1', 'm-2'] }, { id: 'm-1', col: 'm' }],
  planned: [{ id: 'a-2', col: 'a', deps: ['m-1'] }, { id: 'm-2', col: 'm' }] });

test('accepted accounting excludes only the recorded candidate and preserves raw evidence', () => {
  const atlas = fixture(), before = structuredClone(atlas);
  const acceptance = { reviewedCandidates: ['reviewed'], excludedUnacceptedEdges: [{ item: 'a-1', prerequisite: 'm-1', reason: 'Independent peer unavailable' }] };
  const raw = crossFieldInventory(atlas, 2).entries[0];
  const accepted = acceptedCrossFieldInventory(atlas, acceptance, 2);
  assert.deepEqual([raw.writtenToWritten, raw.writtenToKnown, raw.wholeSyllabus], [1, 2, 3]);
  assert.deepEqual([accepted.entries[0].writtenToWritten, accepted.entries[0].writtenToKnown, accepted.entries[0].wholeSyllabus], [0, 1, 2]);
  assert.deepEqual(accepted.entries[0].edges.map(e => `${e.item}>${e.prerequisite}`), ['a-1>m-2', 'a-2>m-1']);
  assert.deepEqual(atlas, before);
  accepted.acceptance.reviewedCandidates.push('later');
  assert.deepEqual(acceptance.reviewedCandidates, ['reviewed']);
});

test('stale, unknown or duplicate exclusions fail instead of silently changing accepted accounting', () => {
  const edge = { item: 'a-1', prerequisite: 'm-1' };
  for (const edges of [[{ ...edge, item: 'missing' }], [{ ...edge, prerequisite: 'missing' }], [{ item: 'a-2', prerequisite: 'm-2' }], [edge, edge]]) {
    assert.throws(() => acceptedCrossFieldInventory(fixture(), { excludedUnacceptedEdges: edges }), /exclusion/);
  }
});
