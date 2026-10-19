import test from 'node:test';
import assert from 'node:assert/strict';
import { logisticValue, logisticRecovery, iridiumSchematic, coalescenceCDF,
  completeSegmentMean, completeSegmentDensity, estimateSegmentRate, uniformTiming, founderSample } from '../content/bighist/source-models.shared.js';
import { paintSegments } from '../content/bighist/ch04.shared.js';
import { crater, impactorMass } from '../content/bighist/ch03-b.js';
const close = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);
const integrate = (fn, a, b, n = 40000) => {
  let sum = fn(a) + fn(b);
  for (let k = 1; k < n; k++) sum += (k % 2 ? 4 : 2) * fn(a + (b - a) * k / n);
  return sum * (b - a) / (3 * n);
};
test('recovery targets the old stock, with zero waiting when already above target', () => {
  for (const initial of [.2, .7, .999]) for (const killed of [.05, .1, .3, .96, .995]) for (const rate of [.1, .5, 2]) {
    const time = logisticRecovery(initial, killed, rate);
    if (killed <= .1) { close(time, 0); continue; }
    // Independently advance the ODE using RK4, rather than repeating logit algebra.
    let value = initial * (1 - killed); const dt = time / 3000;
    const f = x => rate * x * (1 - x);
    for (let k = 0; k < 3000; k++) {
      const a = f(value), b = f(value + dt * a / 2), c = f(value + dt * b / 2), d = f(value + dt * c);
      value += dt * (a + 2 * b + 2 * c + d) / 6;
    }
    close(value, .9 * initial, 3e-10);
    close(logisticValue(initial * (1 - killed), rate, time), value, 3e-10);
  }
});
test('schematic iridium peaks equal their labels and join continuously at the boundary', () => {
  for (const enhancement of [20, 30, 160]) {
    close(iridiumSchematic(0, enhancement), enhancement);
    for (let k = -600; k <= 600; k++) assert.ok(iridiumSchematic(k / 100, enhancement) <= enhancement);
    close(iridiumSchematic(-1e-7, enhancement), iridiumSchematic(1e-7, enhancement), 1e-10);
  }
});
test('finite-window complete-tract density normalizes and its mean agrees with independent quadrature', () => {
  for (const window of [2, 10, 40]) for (const threshold of [0, .05, .3]) for (const rate of [0, .001, .1, 1, 40]) {
    const pdf = x => completeSegmentDensity(x, rate, window, threshold);
    close(integrate(pdf, threshold, window), 1, 2e-7);
    close(integrate(x => x * pdf(x), threshold, window), completeSegmentMean(rate, window, threshold), 2e-7);
    close(pdf(window + .1), 0);
  }
});
test('complete-tract likelihood corrects actual window censoring in the painting process', () => {
  let state = 12345;
  const random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return (state + .5) / 2 ** 32; };
  const window = 2, threshold = .1, generations = 70, fraction = .08, lengths = [];
  for (let k = 0; k < 1000000; k++) for (const [a, b] of paintSegments(random, window / 100, generations, fraction)) {
    if (a > 0 && b < window / 100 && (b - a) * 100 >= threshold) lengths.push((b - a) * 100);
  }
  assert.ok(lengths.length > 30000);
  const rate = estimateSegmentRate(lengths, window, threshold), actual = generations * (1 - fraction) / 100;
  assert.ok(Math.abs(rate / actual - 1) < .03, 'window-aware inference recovers the generating rate');
  const oldRate = 1 / (lengths.reduce((a, b) => a + b) / lengths.length - threshold);
  assert.ok(oldRate / actual > 2, 'memoryless threshold correction alone is severely biased here');
  close(estimateSegmentRate([1, 1.2, 1.4], 2), 0, 0);
});
test('pairwise coalescence is exact for the stated continuous hazard, including the present and short bottlenecks', () => {
  close(coalescenceCDF(0, 10000, 3000, 74, 1000, 25), 0);
  for (const years of [20, 1000, 30000]) for (const ka of [30, 74, 110, 300]) {
    const lo = 74 - years / 1000;
    const boundaries = [0, Math.min(ka, lo), Math.min(ka, 74), ka].sort((a, b) => a - b);
    let survival = 1;
    for (let k = 1; k < boundaries.length; k++) {
      const a = boundaries[k - 1], b = boundaries[k], midpoint = (a + b) / 2;
      const size = midpoint >= lo && midpoint < 74 ? 3000 : 10000;
      survival *= Math.exp(-(b - a) * 1000 / 25 / (2 * size));
    }
    close(coalescenceCDF(ka, 10000, 3000, 74, years, 25), 1 - survival);
  }
});
test('uniform timing uses exact rectangle areas and lag integrals, including collapsed windows', () => {
  close(uniformTiming([0, 1], [0, 1]).pAfter, .5);
  close(uniformTiming([0, 1], [0, 1]).lag, 1 / 3);
  close(uniformTiming([3, 4], [0, 1]).pAfter, 1);
  close(uniformTiming([3, 4], [0, 1]).lag, 3);
  close(uniformTiming([0, 1], [3, 4]).pAfter, 0);
  close(uniformTiming([1, 1], [1, 1]).pAfter, 0);
  close(uniformTiming([1, 1], [0, 2]).pAfter, .5);
  close(uniformTiming([1, 1], [0, 2]).lag, .5);
  close(uniformTiming([0, 2], [1, 1]).lag, .5);
  for (const [a, e] of [[[13, 23], [11.4, 13.8]], [[.7, .78], [.55, .7]], [[45, 60], [10, 40]], [[20, 30], [22, 35]]]) {
    const n = 700; let count = 0, lag = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = a[0] + (i + .5) / n * (a[1] - a[0]), y = e[0] + (j + .5) / n * (e[1] - e[0]);
      if (x > y) { count++; lag += x - y; }
    }
    const actual = uniformTiming(a, e, [11.7, 14.7]);
    close(actual.pAfter, count / n ** 2, .002);
    close(actual.lag, lag / count, .003);
    close(actual.pClim, Math.max(0, Math.min(e[1], 14.7) - Math.max(e[0], 11.7)) / (e[1] - e[0]));
  }
});
test('impact scaling respects SI dimensions, mass conservation and source power laws', () => {
  close(impactorMass(10, 3000), 4 / 3 * Math.PI * 5000 ** 3 * 3000, 1);
  const base = crater(10, 20, 45, 2700);
  close(crater(20, 20, 45, 2700).Dtc / base.Dtc, 2 ** .78);
  close(crater(10, 40, 45, 2700).Dtc / base.Dtc, 2 ** .44);
  close(crater(10, 20, 45, 5400).Dtc / base.Dtc, Math.cbrt(2));
  close(base.D, 1.17 * base.Dtc ** 1.13 / 3.2 ** .13, 1e-10);
});
test('enumerating every founder gene draw recovers the expected heterozygosity contraction', () => {
  for (const founders of [1, 2, 4]) for (const frequency of [.1, .4, .5, .9]) {
    const n = 2 * founders; let expected = 0, mass = 0;
    for (let mask = 0; mask < 2 ** n; mask++) {
      let k = 0;
      const value = founderSample(() => (mask & 1 << k++) ? 0 : 1, frequency, founders);
      const successes = value * n, weight = frequency ** successes * (1 - frequency) ** (n - successes);
      expected += weight * 2 * value * (1 - value); mass += weight;
    }
    close(mass, 1);
    close(expected, 2 * frequency * (1 - frequency) * (1 - 1 / n));
  }
});
