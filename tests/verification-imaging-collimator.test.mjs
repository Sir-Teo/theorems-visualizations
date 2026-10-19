import test from 'node:test';
import assert from 'node:assert/strict';
import { collimatorAudit } from '../content/imaging/source-audit-collimator.shared.js';
const near = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
// Independent polygon-area construction, not the closed-form hexagon area.
function hexArea(flatDistance) {
  const r = flatDistance / Math.sqrt(3), p = Array.from({ length: 6 }, (_, j) => [r * Math.cos(j * Math.PI / 3), r * Math.sin(j * Math.PI / 3)]);
  return Math.abs(p.reduce((s, [x, y], j) => s + x * p[(j + 1) % 6][1] - y * p[(j + 1) % 6][0], 0)) / 2;
}
test('hexagonal aperture and cell polygon areas independently recover the geometric efficiency coefficient', () => {
  for (const d of [.8, 1.8, 6]) for (const L of [12, 27, 60]) for (const t of [.1, .25, 1.5]) {
    const m = collimatorAudit(d, L, t, 80, 2.63);
    const area = hexArea(d), cell = hexArea(d + t);
    const angularFraction = area / (4 * Math.PI * m.effective ** 2), openFraction = area / cell;
    near(m.efficiency, angularFraction * openFraction);
    assert.ok(Math.abs(m.efficiency / (.24 ** 2 * (d / m.effective) ** 2 * (d / (d + t)) ** 2) - 1) > .19);
  }
});
test('diameter sweep has the measured nonconstant log slope; fixed fractional septa restore the square law', () => {
  for (const d of [.8, 1.8, 6]) for (const t of [.1, 1.5]) {
    const m = collimatorAudit(d, 27, t, 80, 2.63), h = 1e-5;
    const a = collimatorAudit(d * Math.exp(-h), 27, t, 80, 2.63), b = collimatorAudit(d * Math.exp(h), 27, t, 80, 2.63);
    near((Math.log(b.efficiency) - Math.log(a.efficiency)) / (2 * h), m.logSlope, 2e-9);
    assert.ok(m.logSlope > 2 && m.logSlope < 4);
    const doubled = collimatorAudit(2 * d, 27, t, 80, 2.63);
    near(doubled.resolution / m.resolution, 2); near(doubled.efficiency / m.efficiency, m.doubledEfficiencyRatio);
    assert.ok(m.doubledEfficiencyRatio > 4);
    near(collimatorAudit(2 * d, 27, 2 * t, 80, 2.63).efficiency / m.efficiency, 4);
  }
});
test('near-field threshold is active at allowed controls and prevents an unconditional distance-independence claim', () => {
  for (const d of [.8, 6]) for (const L of [12, 60]) for (const t of [.1, 1.5]) {
    const m = collimatorAudit(d, L, t, 5, 2.63);
    assert.equal(m.manyHole, false);
    near(m.minimumDistance, L * (.5 + t / d));
    assert.equal(collimatorAudit(d, L, t, m.minimumDistance, 2.63).manyHole, true);
    assert.equal(collimatorAudit(d, L, t, m.minimumDistance - 1e-5, 2.63).manyHole, false);
    near(collimatorAudit(d, L, t, 200, 2.63).efficiency, m.efficiency);
  }
});
test('shortest-septal-path five-percent threshold solves the exponential attenuation inequality', () => {
  for (const d of [.8, 6]) for (const L of [12, 60]) for (const mu of [2.4, 2.8]) {
    const m = collimatorAudit(d, L, .2, 80, mu);
    near(collimatorAudit(d, L, m.minimumSeptum, 80, mu).septalTransmission, .05);
    assert.ok(collimatorAudit(d, L, m.minimumSeptum * .99, 80, mu).septalTransmission > .05);
    assert.ok(collimatorAudit(d, L, m.minimumSeptum * 1.01, 80, mu).septalTransmission < .05);
  }
});
test('all supported physical-control corners are finite, and source blur exceeds the old fixed plot limit', () => {
  for (const d of [.8, 6]) for (const L of [12, 60]) for (const t of [.1, 1.5]) for (const z of [5, 200]) {
    const m = collimatorAudit(d, L, t, z, 2.63);
    for (const value of Object.values(m)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
    assert.ok(m.efficiency > 0 && m.efficiency < 1); assert.ok(m.system >= m.resolution);
    near(m.system ** 2 - m.resolution ** 2, 3.5 ** 2, 1e-11);
  }
  assert.ok(collimatorAudit(6, 12, .1, 200, 2.63).resolution > 100);
});
