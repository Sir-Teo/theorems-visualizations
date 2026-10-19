import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectSample, createManifest } from '../scripts/review-sample.mjs';
import { reviewSummary, validateRecords } from '../tools/review-state.js';

test('the human draw is reproducible, unique, field-stratified and independent of input order', () => {
  const items = Array.from({ length: 100 }, (_, i) => ({ id: `item-${i}`, field: `field-${i % 13}` }));
  const sample = selectSample(items, 20);
  assert.deepEqual(sample, selectSample(items.slice().reverse(), 20));
  assert.equal(new Set(sample.map(i => i.id)).size, 20);
  assert.equal(new Set(sample.map(i => i.field)).size, 13);
  assert.notDeepEqual(sample, selectSample(items, 20, 'another-seed'));
  assert.throws(() => selectSample(items, 12));
});

const manifest = { entries: [{ id: 'a-1.1', fingerprint: 'current', visual: true, audio: true }, { id: 'b-1.1', fingerprint: 'other', visual: true, audio: false }] };
const review = (extra = {}) => ({ id: 'a-1.1', type: 'visual', fingerprint: 'current', status: 'pass', reviewer: 'Human reviewer', notes: '', reviewedAt: '2026-10-19T12:00:00Z', attestations: { controls: true, light: true, dark: true }, ...extra });

test('old source, absent listening attestations, duplicates and unsupported claims never count as passes', () => {
  const invalid = [review({ fingerprint: 'old' }), review({ reviewer: '' }), review({ attestations: { controls: true, light: true } }),
    review({ type: 'audio', attestations: {} }), review({ id: 'b-1.1', type: 'audio', fingerprint: 'other', attestations: { listened: true } }),
    review({ reviewedAt: 'invalid' }), review({ status: 'needs-fix', notes: '' }), null];
  assert.equal(validateRecords(manifest, invalid).accepted.length, 0);
  const result = validateRecords(manifest, [review(), review()]);
  assert.equal(result.accepted.length, 1); assert.equal(result.rejected.length, 1);
  assert.equal(reviewSummary(manifest, invalid).visual.passed, 0);
});

test('visual and listening gates remain separate and issues prevent completion', () => {
  const listening = review({ type: 'audio', attestations: { listened: true } });
  const records = [review(), listening, review({ id: 'b-1.1', fingerprint: 'other', status: 'needs-fix', notes: 'Label clips at the minimum.' })];
  const summary = reviewSummary(manifest, records);
  assert.deepEqual(summary.visual, { total: 2, passed: 1, issues: 1, pending: 0, complete: false });
  assert.deepEqual(summary.audio, { total: 1, passed: 1, issues: 0, pending: 0, complete: true });
});

test('the real manifest covers exactly 5 percent of the audited inventory and all audio examples without certifying any', async () => {
  const current = await createManifest();
  assert.equal(current.visualCount, Math.ceil(current.scope.items * .05));
  assert.equal(current.visualCount, 113);
  assert.equal(new Set(current.entries.filter(e => e.visual).map(e => e.field)).size, current.fields.length);
  assert.equal(current.entries.filter(e => e.audio).length, current.audioCount);
  assert.ok(current.audioCount >= 149);
  assert.equal(new Set(current.entries.map(e => e.id)).size, current.entries.length);
  assert.ok(current.entries.every(e => /^[a-f0-9]{64}$/.test(e.fingerprint)));
  assert.ok(current.entries.every(e => !('status' in e)));
  assert.equal(reviewSummary(current, []).visual.passed, 0);
  assert.equal(reviewSummary(current, []).audio.passed, 0);
});
