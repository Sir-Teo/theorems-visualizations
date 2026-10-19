import assert from 'node:assert/strict';
import { test } from 'node:test';
import { crossFieldInventory } from '../scripts/audit-cross-field-deps.mjs';

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
