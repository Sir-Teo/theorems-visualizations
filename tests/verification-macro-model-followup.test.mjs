import test from 'node:test';
import assert from 'node:assert/strict';
import { fixedProportionsAt, solowCapitalOutputAt } from '../content/macro/ch03-b.js';
import { gaussianRegressionLeague } from '../content/behav/ch03-b.js';
import { rng } from '../assets/js/viz/math.js';

// Integrate the original capital-stock equation, with the independent labour
// path L(t)=exp(nt). This does not use the normalized analytic solution.
function integrateCapital(s, v, n, delta, time, solow = false) {
  const steps = Math.ceil(time / 0.002), h = time / steps;
  let capital = solow ? 1 : v;
  const f = (t, k) => solow
    ? s * k ** 0.35 - (n + delta) * k
    : s * Math.min(k / v, Math.exp(n * t)) - delta * k;
  for (let j = 0; j < steps; j++) {
    const t = j * h, a = f(t, capital), b = f(t + h / 2, capital + h * a / 2);
    const c = f(t + h / 2, capital + h * b / 2), d = f(t + h, capital + h * c);
    capital += h * (a + 2 * b + 2 * c + d) / 6;
  }
  return capital;
}

test('fixed-proportions exact utilization agrees with integration of the original min-production law', () => {
  for (const [s, v, n, d] of [[.2, 3, .01, .03], [.05, 6, .05, .08], [.12, 3, .01, .03], [.4, 1.5, 0, 0], [.05, 6, 0, .08], [.4, 6, .05, .08]]) {
    for (const time of [1, 25, 100]) {
      const capital = integrateCapital(s, v, n, d, time), labour = Math.exp(n * time);
      const output = Math.min(capital / v, labour), actual = fixedProportionsAt(s, v, n, d, time);
      assert.ok(Math.abs(actual.employed - output / labour) < 1e-9);
      assert.ok(Math.abs(actual.capitalUsed - output / (capital / v)) < 1e-9);
    }
  }
});

test('utilization fractions stay bounded, the knife edge stays exact, and excess saving has the correct limit', () => {
  for (const s of [.05, .2, .4]) for (const v of [1.5, 3, 6]) for (const n of [0, .01, .05]) for (const d of [0, .03, .08]) {
    for (const time of [0, 1, 25, 100, 1000]) {
      const point = fixedProportionsAt(s, v, n, d, time);
      for (const value of [point.employed, point.capitalUsed]) assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
    }
  }
  for (const t of [0, 1, 100, 10000]) {
    const point = fixedProportionsAt(.12, 3, .01, .03, t);
    assert.ok(Math.abs(point.employed - 1) < 1e-13);
    assert.ok(Math.abs(point.capitalUsed - 1) < 1e-13);
  }
  const excess = fixedProportionsAt(.2, 3, .01, .03, 10000);
  assert.equal(excess.employed, 1);
  assert.ok(Math.abs(excess.capitalUsed - .6) < 1e-13);
  assert.ok(Math.abs(fixedProportionsAt(.2, 3, 0, 0, 100).ratio - (1 + .2 / 3 * 100)) < 1e-13);
});

test('Solow capital/output agrees with the nonlinear capital equation, including zero dilution', () => {
  for (const [s, n, d] of [[.2, .01, .03], [.05, .05, .08], [.4, 0, 0], [.4, 0, .001]]) {
    for (const time of [1, 25, 100]) {
      const k = integrateCapital(s, 1, n, d, time, true);
      assert.ok(Math.abs(solowCapitalOutputAt(s, n, d, time) - k / k ** .35) < 1e-8);
    }
  }
  assert.ok(Math.abs(solowCapitalOutputAt(.2, 0, 0, 100) - 14) < 1e-13);
  assert.ok(Math.abs(solowCapitalOutputAt(.2, 1e-12, 0, 100) - 14) < 1e-8);
});

test('the actual Gaussian league has unit marginal variances, shared-skill covariance and the selected-group conditional mean', () => {
  for (const luck of [0, .25, .75, 1]) {
    const points = gaussianRegressionLeague(luck, 60000, rng(421));
    const mean = j => points.reduce((s, p) => s + p[j], 0) / points.length;
    const m1 = mean(0), m2 = mean(1);
    for (const j of [0, 1]) assert.ok(Math.abs(points.reduce((s, p) => s + p[j] ** 2, 0) / points.length - mean(j) ** 2 - 1) < .025);
    const covariance = points.reduce((s, p) => s + p[0] * p[1], 0) / points.length - m1 * m2;
    assert.ok(Math.abs(covariance - (1 - luck)) < .02);
    const selected = points.sort((a, b) => b[0] - a[0]).slice(0, points.length / 10);
    const selectedMean = j => selected.reduce((s, p) => s + p[j], 0) / selected.length;
    assert.ok(Math.abs(selectedMean(1) - (1 - luck) * selectedMean(0)) < .04);
    if (luck === 0) assert.ok(points.every(p => p[0] === p[1]));
  }
});

test('correlation alone cannot justify the conditional-mean sentence removed from the card', () => {
  // Standardized X=sqrt(2)Z, Y=2Z²−1 with P(Z=±1)=1/4, P(Z=0)=1/2.
  const law = [[-Math.SQRT2, 1, .25], [0, -1, .5], [Math.SQRT2, 1, .25]];
  assert.equal(law.reduce((s, [x, y, p]) => s + x * y * p, 0), 0);
  assert.ok(Math.abs(law.reduce((s, [x, , p]) => s + x * x * p, 0) - 1) < 1e-14);
  assert.equal(law.reduce((s, [, y, p]) => s + y * y * p, 0), 1);
  assert.equal(law.find(([x]) => x === 0)[1], -1); // E[Y|X=0]=-1, whereas rho*0=0.
});
