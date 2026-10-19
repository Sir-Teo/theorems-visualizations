import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HALL_AM_1_4, LORENZ_AM_1_6, NDENS, QHE_1980, hallTransport, lorenzMomentModel, qheAt, QHE_D } from '../content/cm/ch02.shared.js';
import { CONST } from '../assets/js/viz/math.js';

test('Hall and Lorenz tables preserve the original table definitions and selected rows', () => {
  // A&M p.15, Table1.4: n0/n, not R_H/R_H^free. Plot takes the reciprocal.
  assert.deepEqual(Object.entries(HALL_AM_1_4), [
    ['Li', .8], ['Na', 1.2], ['K', 1.1], ['Rb', 1], ['Cs', .9],
    ['Cu', 1.5], ['Ag', 1.3], ['Au', 1.5], ['Be', -.2], ['Mg', -.4], ['In', -.3], ['Al', -.3],
  ]);
  assert.equal(1 / HALL_AM_1_4.Be, -5);
  // A&M p.21, Table1.6, the 273K column; W was not an original row.
  assert.deepEqual(Object.entries(LORENZ_AM_1_6), [
    ['Li', 2.22], ['Na', 2.12], ['K', 2.23], ['Cu', 2.20], ['Ag', 2.31],
    ['Au', 2.32], ['Zn', 2.28], ['Cd', 2.49], ['Al', 2.14], ['Pb', 2.64], ['Sn', 2.48],
  ]);
  // Table1.1 p.5, units 10^22/cm^3 = 10^28/m^3, selected readout densities.
  assert.deepEqual(['Li', 'Na', 'K', 'Cu', 'Ag', 'Au', 'Al'].map(x => NDENS[x]), [4.70, 2.65, 1.40, 8.47, 5.86, 5.90, 18.1]);
});

test('toy Hall transport obeys particle-hole symmetry and its free-electron dilute limit', () => {
  const low = hallTransport(0, .05, .1, 128), high = hallTransport(0, 1.95, .1, 128);
  assert.ok(Math.abs(-.05 * low.RH - 1) < .001);
  assert.ok(Math.abs(low.RH + high.RH) < 1e-9);
  assert.ok(Math.abs(low.mu + high.mu) < 1e-10);
  assert.ok(Math.abs(hallTransport(0, 1, .1, 128).RH) < 1e-12);
});

test('open-circuit Lorenz moments match independent logistic integrals and the small-alpha expansion', () => {
  // Logistic density 1/(4*cosh(x/2)^2) has integral1, mean0, variance pi^2/3.
  const r = lorenzMomentModel(0);
  assert.ok(Math.abs(r.area - Math.PI ** 2 / 3) < 2e-9);
  assert.ok(Math.abs(r.ratio - 1) < 1e-9);
  const a = .01, expected = 1 - a * a * Math.PI ** 2 / 3;
  assert.ok(Math.abs(lorenzMomentModel(a).ratio - expected) < 1e-9);
  for (const a of [.1, .5, 1.5]) {
    const plus = lorenzMomentModel(a), minus = lorenzMomentModel(-a);
    assert.ok(Math.abs(plus.ratio - minus.ratio) < 1e-12);
    assert.ok(plus.ratio > 0);
  }
});

test('1980 improved Hall uncertainty is about3ppm, distinct from the earlier mean', () => {
  assert.deepEqual(QHE_1980, { R4: 6453.17, errorR4: .02, inverseAlpha: 137.0353, errorInverseAlpha: .0004, initialMeanR4: 6453.22, initialErrorR4: .10 });
  const ppm = QHE_1980.errorR4 / QHE_1980.R4 * 1e6;
  assert.ok(ppm > 3.09 && ppm < 3.11);
  assert.ok(QHE_1980.initialErrorR4 / QHE_1980.initialMeanR4 * 1e6 > 15);
  assert.ok(QHE_1980.errorInverseAlpha / QHE_1980.inverseAlpha * 1e6 < 3);
  assert.ok(Math.abs(CONST.h / CONST.e ** 2 / 4 - 6453.201864826128) < 1e-9);
});

test('fourfold-degenerate toy Hall plateaus give R_K/4 with suppressed longitudinal response', () => {
  const p = { g: 4, hw: .609, G0: .4, T: 1.5, sp: .4 };
  for (const nu of [3.5, 4, 4.5]) {
    const r = qheAt(nu * QHE_D * 18, 18, p);
    assert.ok(Math.abs(r.rxy - .25) < 1e-10);
    assert.ok(r.rxx < 1e-10);
  }
  const off = qheAt(6 * QHE_D * 18, 18, p);
  assert.ok(off.rxx > .01, 'a half-filled next Landau level is a transition, not the i=4 plateau');
});

import { debyeU2, feynmanTrialEnergy } from '../content/cm/ch03.shared.js';
import { mosModel, excitonLineStrength, excitonRadius, MAT, niB, eg, KB } from '../content/cm/ch04.shared.js';

test('Debye quantum displacement exceeds its classical limit and retains zero-point motion', () => {
  const th = 343, mass = 63.55 * CONST.u;
  const zero = 9 * CONST.hbar ** 2 / (4 * mass * CONST.kB * th);
  assert.ok(Math.abs(debyeU2(.001, th, mass, CONST.hbar, CONST.kB) / zero - 1) < 1e-9);
  for (const T of [1, 100, 300, 2000]) {
    const classical = 9 * CONST.hbar ** 2 * T / (mass * CONST.kB * th ** 2);
    assert.ok(debyeU2(T, th, mass, CONST.hbar, CONST.kB) > classical);
  }
});

test('MOS accumulation and inversion profiles integrate the signed Poisson first integral', () => {
  for (const na of [1e15, 1e17, 1e18]) {
    const m = mosModel(na, 10);
    for (const vg of [-.5, .1, 1.6, 3.5]) {
      const psi = m.psiOf(vg), p = m.profile(psi);
      assert.equal(p[0][1], psi);
      assert.ok(p.length > 4);
      assert.ok(Math.abs(p.at(-1)[1]) < .031 * m.Vt);
      for (let i = 1; i < p.length; i++) {
        assert.ok(p[i][0] > p[i - 1][0]);
        assert.ok(Math.abs(p[i][1]) <= Math.abs(p[i - 1][1]));
      }
      const r = (m.ni / na) ** 2;
      // Independent integrated Poisson equation, SI depth conversion nm -> cm.
      const j = Math.floor(p.length / 4), a = p[j], b = p[j + 1], u = (a[1] + b[1]) / (2 * m.Vt);
      const deriv = (b[1] - a[1]) / ((b[0] - a[0]) * 1e-7);
      const expected2 = 2 * 1.602176634e-19 * na * m.Vt / m.eps * (Math.exp(-u) + u - 1 + r * (Math.exp(u) - u - 1));
      assert.ok(Math.abs(deriv ** 2 / expected2 - 1) < .02);
      assert.ok(Math.abs(psi + m.Qs(psi) / m.Cox - vg) < 1e-10);
    }
  }
});

test('Cu2O P excitons use their selection rule and published hydrogenic orbit scale', () => {
  assert.equal(excitonLineStrength(1, 1), 0);
  assert.equal(excitonLineStrength(2, 1), 3 / 32);
  assert.equal(excitonLineStrength(2, 0), 1 / 8);
  assert.ok(Math.abs(excitonLineStrength(100, 1) * 100 ** 3 - 1) < .00011);
  assert.ok(Math.abs(excitonRadius(25, 1, 1.11) / 1000 - 1.039515) < 1e-12);
});

test('intrinsic Arrhenius slope includes 3kBT and the temperature derivative of the gap', () => {
  for (const m of Object.values(MAT)) {
    const T = 300, dt = .001;
    const slope = -2 * KB * (Math.log(niB(m, T + dt)) - Math.log(niB(m, T - dt))) / (1 / (T + dt) - 1 / (T - dt));
    const dgap = (eg(m, T + dt) - eg(m, T - dt)) / (2 * dt);
    assert.ok(Math.abs(slope - (eg(m, T) + 3 * KB * T - T * dgap)) < 1e-8);
  }
});


test('Feynman transformed integral preserves its nonzero endpoint and decoupled limit', () => {
  // As v -> w the fictitious particle decouples: D(tau)->1 and the
  // Gaussian integral gives E=-alpha exactly, independently of v=w.
  for (const a of [.5, 1, 3]) assert.ok(Math.abs(feynmanTrialEnergy(3 + 1e-8, 3, a) + a) < 1e-8);
});
