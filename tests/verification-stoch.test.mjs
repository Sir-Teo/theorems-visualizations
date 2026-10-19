import test from 'node:test';
import assert from 'node:assert/strict';
import { extinction, pgf, genDist, uSeq, returnedBy, solveLin } from '../content/stoch/ch03.shared.js';
import { ehrenfestMean, ehrenfestMeanBandTime, arborescences, treeWeight, stationary } from '../content/stoch/ch04.shared.js';
import { snakeLanding, snakesMatrix } from '../content/stoch/snakes.shared.js';
const close = (a, b, tol = 1e-10) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

test('zero-child-free laws cannot die, including deterministic one-child criticality', () => {
  assert.equal(extinction([0, 1]), 0);
  assert.equal(extinction([0, .7, .3]), 0);
  assert.equal(extinction([1]), 1);
  close(extinction([.75, 0, .25]), 1);
  close(extinction([.25, 0, .75]), 1 / 3);
});
test('Galton–Watson finite-generation probabilities agree with a direct population chain', () => {
  const p = [.25, .5, .25], cap = 32; let population = [0, 1];
  for (let g = 1; g <= 4; g++) {
    const next = Array(cap + 1).fill(0);
    for (let k = 0; k < population.length; k++) if (population[k]) {
      // k independent Binomial(2,1/2) variables sum to Binomial(2k,1/2).
      let bin = 2 ** (-2 * k);
      for (let j = 0; j <= 2 * k; j++) { if (j <= cap) next[j] += population[k] * bin; bin *= (2 * k - j) / (j + 1); }
    }
    population = next;
    genDist(p, g, cap).forEach((x, k) => close(x, population[k], 1e-12));
  }
});
test('Watson original binomial example has a second fixed point below one', () => {
  const p = [243, 405, 270, 90, 15, 1].map(x => x / 1024);
  let q = 0; for (let n = 0; n < 10; n++) q = pgf(p, q);
  close(q, .533, .001); // Rounded ten-generation value on the original p.143.
  const rho = extinction(p); assert.ok(rho > .53 && rho < .56); close(pgf(p, rho), rho);
});
test('exact finish, one jump, absorption and an overshoot variant are distinct rules', () => {
  assert.equal(snakeLanding(98, 4), 98);
  assert.equal(snakeLanding(98, 4, {}, true), 100);
  assert.equal(snakeLanding(79, 1), 100);
  assert.equal(snakeLanding(0, 1, { 1: 38, 38: 99 }), 38);
  assert.equal(snakeLanding(100, 6), 100);
  for (const over of [false, true]) {
    const P = snakesMatrix(undefined, over);
    for (const row of P) close(row.reduce((a, b) => a + b, 0), 1);
    assert.equal(P[100][100], 1);
  }
});
test('board linear-system expectation agrees with the independent survival-tail sum', () => {
  const P = snakesMatrix(), Q = P.slice(0, 100).map(r => r.slice(0, 100));
  const E = solveLin(Q.map((r, i) => r.map((p, j) => (i === j ? 1 : 0) - p)), Array(100).fill(1));
  let mu = Array(100).fill(0); mu[0] = 1; let sum = 0;
  for (let t = 0; t < 1800; t++) {
    sum += mu.reduce((a, b) => a + b, 0);
    const next = Array(100).fill(0);
    for (let i = 0; i < 100; i++) if (mu[i]) for (let j = 0; j < 100; j++) if (Q[i][j]) next[j] += mu[i] * Q[i][j];
    mu = next;
  }
  close(sum, E[0], 1e-9);
});
test('Ehrenfest first moment follows the transition law and its threshold is one s.d.', () => {
  for (const N of [4, 8, 20, 60]) {
    let law = Array(N + 1).fill(0); law[N] = 1;
    for (let t = 0; t < 30; t++) {
      close(law.reduce((s, p, k) => s + k * p, 0), ehrenfestMean(N, N, t), 1e-11);
      law.forEach((p, k) => { if ((k - N - t) % 2) close(p, 0); });
      const next = Array(N + 1).fill(0);
      law.forEach((p, k) => { if (k) next[k - 1] += p * k / N; if (k < N) next[k + 1] += p * (N - k) / N; }); law = next;
    }
    close(ehrenfestMean(N, N, ehrenfestMeanBandTime(N)) - N / 2, Math.sqrt(N) / 2);
  }
});
test('in-tree orientation recovers the exact stationary law of a directed chain', () => {
  const P = [[.1, .6, .3], [.2, .5, .3], [.4, .1, .5]];
  const weights = P.map((_, r) => arborescences(P, r).reduce((s, T) => s + treeWeight(P, T), 0));
  const total = weights.reduce((a, b) => a + b, 0), pi = stationary(P);
  weights.forEach((x, i) => close(x / total, pi[i]));
});
test('random-walk return recurrence agrees with direct enumeration of small paths', () => {
  for (const d of [1, 2, 3]) {
    let paths = new Map([['0,'.repeat(d - 1) + '0', 1]]), first = 0;
    const u = uSeq(d, 3), F = returnedBy(u).F;
    let alive = new Map(paths);
    for (let t = 1; t <= 6; t++) {
      const step = (input, absorb) => {
        const out = new Map();
        for (const [key, prob] of input) for (let a = 0; a < d; a++) for (const sign of [-1, 1]) {
          const q = key.split(',').map(Number); q[a] += sign;
          if (absorb && q.every(x => x === 0)) first += prob / (2 * d);
          else { const k = q.join(','); out.set(k, (out.get(k) || 0) + prob / (2 * d)); }
        }
        return out;
      };
      paths = step(paths, false); alive = step(alive, true);
      if (t % 2 === 0) { close(paths.get(Array(d).fill(0).join(',')) || 0, u[t / 2]); close(first, F[t / 2]); }
    }
  }
});
test('cycle products and detailed balance agree for potentials and a circulation', () => {
  const W = [[0, 2, 1, 4], [2, 0, 3, 1], [1, 3, 0, 2], [4, 1, 2, 0]];
  const cycles = [];
  function extend(path) {
    if (path.length >= 3) cycles.push(path);
    for (let j = path[0] + 1; j < 4; j++) if (!path.includes(j)) extend([...path, j]);
  }
  for (let i = 0; i < 4; i++) extend([i]);
  for (const theta of [0, .7]) {
    const edge = (i, j) => ((i === 0 && j === 1) || (i === 1 && j === 2) || (i === 2 && j === 0)) ? 1 : ((j === 0 && i === 1) || (j === 1 && i === 2) || (j === 2 && i === 0)) ? -1 : 0;
    const P = W.map((row, i) => { const r = row.map((x, j) => x * Math.exp(theta * edge(i, j))), sum = r.reduce((a, b) => a + b, 0); return r.map(x => x / sum); });
    const pi = stationary(P), defect = Math.max(...P.flatMap((row, i) => row.map((x, j) => Math.abs(pi[i] * x - pi[j] * P[j][i]))));
    const cycleDefect = Math.max(...cycles.map(c => { let f = 1, b = 1; for (let k = 0; k < c.length; k++) { const i = c[k], j = c[(k + 1) % c.length]; f *= P[i][j]; b *= P[j][i]; } return Math.abs(f - b); }));
    if (theta === 0) { close(defect, 0); close(cycleDefect, 0); }
    else { assert.ok(defect > .01); assert.ok(cycleDefect > .01); }
  }
});
test('three-dimensional return constant is independently recovered from the lattice sum', () => {
  // Pólya §3 gives u_n ~ a n^-3/2. Midpoint tail correction leaves O(N^-3/2).
  const a = 3 * Math.sqrt(3) / (4 * Math.PI ** 1.5);
  const estimate = N => 1 - 1 / (uSeq(3, N).reduce((s, x) => s + x, 0) + 2 * a / Math.sqrt(N + .5));
  const coarse = estimate(250), fine = estimate(1000), extrapolated = (8 * fine - coarse) / 7;
  close(extrapolated, .340537329550999, 2e-8);
});
test('urn first-return time is 2^N independently of stationary-reciprocal reasoning', () => {
  for (const N of [4, 6, 10]) {
    const A = Array.from({ length: N }, (_, k) => {
      const row = Array(N).fill(0); row[k] = 1;
      if (k) row[k - 1] -= k / N;
      if (k + 1 < N) row[k + 1] -= (N - k) / N;
      return row;
    });
    const hitting = solveLin(A, Array(N).fill(1));
    close(1 + hitting[N - 1], 2 ** N, 1e-7);
  }
});
