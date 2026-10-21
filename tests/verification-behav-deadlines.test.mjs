import test from 'node:test';
import assert from 'node:assert/strict';
import { deadlineCost, deadlineComparison } from '../content/behav/source-audit-deadlines.js';

// An independent per-task/per-unordered-pair formulation; no weekly counts.
function reference(dates, b, g) {
  let result = 3;
  for (const w of dates) if (w === 4 || w === 8) result += b;
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (dates[i] === dates[j]) result += g;
  return result;
}

test('Every actual cost-grid setting and all 1728 completion schedules agree with independent task/pair accounting', () => {
  for (let ib = 0; ib <= 12; ib++) for (let ig = 0; ig <= 12; ig++) {
    const b = ib / 4, g = ig / 4;
    for (let a = 1; a <= 12; a++) for (let c = 1; c <= 12; c++) for (let d = 1; d <= 12; d++) {
      const dates = [a, c, d];
      assert.equal(deadlineCost(dates, b, g), reference(dates, b, g));
    }
  }
});

test('Independent complete feasible searches certify both optima, ties and exact end/even costs at every cost-grid setting', () => {
  for (let ib = 0; ib <= 12; ib++) for (let ig = 0; ig <= 12; ig++) {
    const b = ib / 4, g = ig / 4;
    let constrained = Infinity, flexible = Infinity;
    for (let a = 1; a <= 12; a++) for (let c = 1; c <= 12; c++) {
      constrained = Math.min(constrained, reference([a, c, 12], b, g));
      for (let d = 1; d <= 12; d++) flexible = Math.min(flexible, reference([a, c, d], b, g));
    }
    const p = deadlineComparison(4, 8, b, g);
    assert.equal(p.values[0], 3 + 3 * g);
    assert.equal(p.values[1], 3 + 2 * b);
    assert.equal(p.values[3], constrained);
    assert.equal(p.values[4], flexible);
    assert.equal(constrained, 3); assert.equal(flexible, 3);
    assert.equal(reference(p.bestDates, b, g), constrained);
    assert.equal(p.bestDates[2], 12);
    assert.ok(p.bestDates.every(d => Number.isInteger(d) && d >= 1 && d <= 12));
  }
});

test('Every selectable deadline pair preserves the actual schedule, handles week12 and agrees with closed-form corner comparisons', () => {
  for (const b of [0, 1.5, 3]) for (const g of [0, 1.5, 3]) for (let a = 1; a <= 12; a++) for (let c = 1; c <= 12; c++) {
    const p = deadlineComparison(a, c, b, g);
    assert.deepEqual(p.dates, [Math.min(a, c), Math.max(a, c), 12]);
    assert.equal(p.values[2], reference([a, c, 12], b, g));
    assert.ok(p.values.every(x => x >= 3 && Number.isFinite(x)));
    assert.equal(p.values[2], deadlineComparison(c, a, b, g).values[2]);
    assert.ok(p.values[3] <= p.values[2]);
    assert.ok(p.values[4] <= p.values[2]);
  }
  assert.deepEqual(deadlineComparison(12, 12, 3, 3).values, [12, 9, 12, 3, 3]);
  assert.equal(deadlineComparison(4, 4, 3, 3).values[2], 12);
  assert.deepEqual(deadlineComparison(4, 8, 0, 0).values, [3, 3, 3, 3, 3]);
});
