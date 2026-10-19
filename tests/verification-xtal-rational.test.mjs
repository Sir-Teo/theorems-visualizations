import assert from 'node:assert/strict';
import {test} from 'node:test';
import chapter from '../content/xtal/ch01.js';
import {record} from './verification-physics-utils.mjs';

const item = chapter.items.find(it => it.num === '1.4');
test('rational brick staircases repeat without requiring identical terrace widths', () => {
  for (const [label, p, q] of [['2/3', 2, 3], ['1/3', 1, 3]]) {
    const r = record(item);
    r.buttons.find(b => b.label === label).fn();
    r.draw();
    const heights = Array(16).fill(0);
    for (const [kind, x] of r.stages[0].calls) if (kind === 'rect') heights[Math.floor(x)]++;
    // Count brick centres strictly below the mathematical line, independently
    // of the production floor-based staircase calculation.
    for (let i = 0; i < heights.length; i++) {
      let count = 0;
      for (let j = 0; j < 30; j++) if ((j + .5) * q < (i + .5) * p - 1e-10) count++;
      assert.equal(heights[i], count);
      if (i + q < heights.length) assert.equal(heights[i + q] - heights[i], p);
    }
    if (p === 2) assert.match(r.text(), /1, 2 bricks/);
    assert.doesNotMatch(r.text(), /every tread the same|exactly rational/);
  }
});
test('finite small-denominator search does not declare the default rational slope irrational', () => {
  const r = record(item);
  // The default slope is 31/50, but q<=12 cannot find its exact denominator.
  assert.match(r.text(), /0\.6200/);
  assert.match(r.text(), /5\/8/);
  assert.match(r.text(), /do not certify rationality/);
  assert.doesNotMatch(r.text(), /imitating an irrational face|never one/);
});
test('all presets and cell aspect ratios retain finite geometry and numerical-error readouts', () => {
  const r = record(item);
  for (const ratio of [.5, 1, 1.6]) for (const label of ['golden 1/φ', '2/3', '√2 − 1', '1/3']) {
    r.controls[0].set(ratio);
    r.buttons.find(b => b.label === label).fn(); r.draw();
    assert.doesNotMatch(r.text(), /NaN|Infinity|undefined/);
    assert.match(r.text(), /numerical error/);
    const handle = r.stages[0].handles[0];
    const expected = {'golden 1/φ': (Math.sqrt(5) - 1) / 2, '2/3': 2 / 3, '√2 − 1': Math.SQRT2 - 1, '1/3': 1 / 3}[label];
    assert.ok(Math.abs(handle.y / handle.x / ratio - expected) < 1e-14, 'preset preserves fractional slope at every cell aspect ratio');
    for (const call of r.stages[0].calls.filter(c => c[0] === 'rect')) assert.ok(call.slice(1, 5).every(Number.isFinite));
  }
});
