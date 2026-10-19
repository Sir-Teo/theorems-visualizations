import assert from 'node:assert/strict';
import {test} from 'node:test';
import {movingAverageFeedback, movingAverageFeedbackSummary} from '../content/sig/ch03-b.js';

const close = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(b)), `${a} versus ${b}`);
// Independent formula: convolve a finite box kernel with the geometric impulse response.
const impulse = (a, m, n) => {
  let value = 0;
  for (let k = 0; k < Math.min(m, n + 1); k++) value += a ** (n - k) / m;
  return value;
};
test('recursive implementation matches the direct convolution formula', () => {
  for (const a of [-1.1, -1, -.8, 0, .5, .99, 1, 1.1]) for (const m of [1, 2, 3, 6, 10]) {
    const input = Array(90).fill(0); input[0] = 1;
    const actual = movingAverageFeedback(input, a, m);
    actual.forEach((value, n) => close(value, impulse(a, m, n), 1e-11));
    const x = Array.from({length: 60}, (_, n) => Math.sin(.7 * n));
    movingAverageFeedback(x, a, m).forEach((value, n) => {
      let expected = 0;
      for (let k = 0; k <= n; k++) expected += x[k] * impulse(a, m, n - k);
      close(value, expected, 1e-10);
    });
  }
});
test('negative-unit feedback cancels only for even box length and gives a stable FIR zero-state map', () => {
  for (let m = 1; m <= 10; m++) {
    const info = movingAverageFeedbackSummary(-1, m, 1);
    assert.equal(info.finite, m % 2 === 0);
    assert.equal(info.stable, m % 2 === 0);
    if (m % 2 === 0) {
      close(info.mass, .5); close(info.tail, .5 - 1 / m);
      for (let n = 0; n < 100; n++) close(impulse(-1, m, n), n < m - 1 && n % 2 === 0 ? 1 / m : 0);
    } else assert.equal(info.mass, Infinity);
  }
});
test('full mass and every truncation position agree with a long independent geometric-convolution sum', () => {
  for (const a of [-.99, -.4, 0, .5, .99]) for (const m of [1, 2, 3, 6, 10]) {
    const h = Array.from({length: 5000}, (_, n) => Math.abs(impulse(a, m, n)));
    for (const length of [1, 2, 3, 9, 12, 30]) {
      const info = movingAverageFeedbackSummary(a, m, length);
      assert.equal(info.stable, true);
      close(info.mass, h.reduce((s, x) => s + x, 0));
      close(info.tail, h.slice(length).reduce((s, x) => s + x, 0));
      const x = Array.from({length: 80}, (_, n) => Math.sin(.37 * n)), y = movingAverageFeedback(x, a, m);
      for (let n = 0; n < y.length; n++) {
        let truncated = 0;
        for (let k = 0; k < Math.min(length, n + 1); k++) truncated += x[n - k] * impulse(a, m, k);
        assert.ok(Math.abs(y[n] - truncated) <= info.tail + 1e-10, 'bounded input obeys the full-tail error bound');
      }
    }
  }
});
test('uncancelled nondecaying poles have infinite mass and tail', () => {
  for (const a of [-1.1, 1, 1.1]) for (let m = 1; m <= 10; m++) {
    const info = movingAverageFeedbackSummary(a, m, 30);
    assert.equal(info.finite, false); assert.equal(info.stable, false);
    assert.equal(info.mass, Infinity); assert.equal(info.tail, Infinity);
  }
});
