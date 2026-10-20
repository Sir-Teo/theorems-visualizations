import test from 'node:test';
import assert from 'node:assert/strict';
import { irRun, irLaw } from '../content/dist/ch02.shared.js';

test('an all-tie finite election run reports every survivor and no leader', () => {
  const run = irRun(12, 2, () => 0);
  assert.equal(run.rounds.length, 200);
  assert.equal(run.complete, false);
  assert.equal(run.leader, null);
  assert.deepEqual(run.candidates, Array.from({length: 12}, (_, i) => i));
  let draw = 0;
  const elected = irRun(12, 2, () => draw++ === 0 ? .999 : 0);
  assert.equal(elected.complete, true);
  assert.equal(elected.leader, 0);
  assert.deepEqual(elected.candidates, [0]);
});

test('two-candidate mean includes the geometric tail beyond the plotted rounds', () => {
  for (const K of [2, 3, 40]) {
    // Equal draws occur with probability 1/K; otherwise one candidate remains.
    const law = irLaw(2, K, 1);
    assert.ok(Math.abs(law.mean - K / (K - 1)) < 1e-12);
    assert.ok(Math.abs(law.cdf[1] - (1 - 1 / K)) < 1e-12);
    assert.ok(Math.abs(law.truncatedMean - 1) < 1e-12);
    assert.ok(Math.abs(law.remainingMean - 1 / (K - 1)) < 1e-12);
  }
  const empty = irLaw(2, 2, 0), sixty = irLaw(2, 2, 60);
  assert.equal(empty.truncatedMean, 0);
  assert.equal(empty.remainingMean, 2);
  assert.ok(sixty.remainingMean > 0);
  assert.equal(irLaw(1, 2, 0).mean, 0);
  assert.equal(irLaw(1, 2, 60).tail, 0);
});
