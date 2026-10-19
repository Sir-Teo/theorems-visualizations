import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomSeedOfWeight, seedWeight, seedExact, seedSensitivity, SEEDS} from '../content/bioinf/ch03.shared.js';

test('random templates preserve all editable weights, including one and nineteen/twenty', () => {
  for (let weight = 1; weight <= 20; weight++) for (let seed = 1; seed <= 100; seed++) {
    const pattern = randomSeedOfWeight(weight, seed);
    assert.equal(seedWeight(pattern), weight);
    assert.ok(pattern.length <= 20);
    assert.match(pattern, /^1[01]*1$|^1$/);
    assert.equal(randomSeedOfWeight(weight, seed), pattern);
  }
  for (const invalid of [0, 21, 1.5, NaN]) assert.throws(() => randomSeedOfWeight(invalid, 1), RangeError);
});

// Independent exhaustive alignment enumeration, without bit masks or dynamic programming.
function enumerate(pattern, length, p) {
  let probability = 0, mean = 0;
  for (let n = 0; n < 2 ** length; n++) {
    const bits = n.toString(2).padStart(length, '0');
    const matches = [...bits].filter(bit => bit === '1').length;
    const mass = p ** matches * (1 - p) ** (length - matches);
    let hits = 0;
    for (let start = 0; start + pattern.length <= length; start++) {
      if ([...pattern].every((bit, j) => bit === '0' || bits[start + j] === '1')) hits++;
    }
    if (hits) probability += mass;
    mean += hits * mass;
  }
  return {probability, mean};
}
test('seed dynamic program and span-dependent expectation match exhaustive alignments', () => {
  for (const pattern of ['1', '11', '101', '1101', '10001', '11111']) {
    for (const length of [3, 6, 9]) for (const p of [0, .3, .5, .7, 1]) {
      const exact = enumerate(pattern, length, p);
      assert.ok(Math.abs(seedExact(pattern, p, length) - exact.probability) < 1e-12);
      assert.ok(Math.abs(exact.mean - Math.max(0, length - pattern.length + 1) * p ** seedWeight(pattern)) < 1e-12);
    }
  }
  // Every length-nine alignment once makes the simulation's p=1/2 mean exact.
  const length = 9, N = 2 ** length, u = new Float32Array(N * length);
  for (let n = 0; n < N; n++) for (let k = 0; k < length; k++) u[n * length + k] = (n >> k) & 1 ? .25 : .75;
  for (const pattern of ['111', '10001']) {
    const actual = seedSensitivity({u, N, L: length}, pattern, .5);
    const expected = enumerate(pattern, length, .5);
    assert.equal(actual.hits, expected.mean);
    assert.equal(actual.sens, expected.probability);
  }
});
test('PatternHunter example is more sensitive despite fewer expected hits', () => {
  const p = .7, length = 64;
  const contiguous = seedExact(SEEDS.contiguous, p, length);
  const spaced = seedExact(SEEDS.patternhunter, p, length);
  assert.ok(Math.abs(contiguous - .300) < .001);
  assert.ok(Math.abs(spaced - .467) < .001);
  assert.ok(spaced > contiguous);
  assert.ok((length - SEEDS.patternhunter.length + 1) * p ** 11 < (length - SEEDS.contiguous.length + 1) * p ** 11);
});
