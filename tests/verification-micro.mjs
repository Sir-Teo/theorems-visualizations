import assert from 'node:assert/strict';
import test from 'node:test';
import { stackelbergOutcome } from '../content/micro/ch10-c.js';
import { monopolyWelfare } from '../content/micro/ch10.js';
import { pref, market } from '../content/micro/ch09.shared.js';

test('Stackelberg global solution beats an independent exhaustive quantity grid, including follower exit', () => {
  for (const c1 of [0, 1, 2.5, 5]) for (const c2 of [0, 1, 2.5, 5]) {
    const o = stackelbergOutcome(12, 1, c1, c2);
    let grid = -Infinity;
    for (let i = 0; i <= 24000; i++) {
      const q1 = i / 2000, q2 = Math.max(0, (12 - c2 - q1) / 2);
      grid = Math.max(grid, q1 * (12 - q1 - q2 - c1));
    }
    assert.ok(o.q1 >= 0 && o.q2 >= 0); assert.ok(o.profit >= grid - 1e-9); assert.ok(o.profit - grid < 1e-6);
  }
  assert.deepEqual(stackelbergOutcome(12, 1, 0, 5), { q1: 7, q2: 0, profit: 35 });
});

test('monopoly welfare agrees with independent quadrature across the full demand/control range', () => {
  for (const kind of ['lin', 'iso']) for (const c of [.5, 2, 5]) for (const e of [1.4, 2, 4]) {
    const o = monopolyWelfare(kind, c, e), price = q => kind === 'lin' ? 12 - q : 8 * q ** (-1 / e);
    assert.ok(Math.abs(price(o.Qc) - c) < 1e-10);
    assert.ok(Math.abs((kind === 'lin' ? 12 - 2 * o.Qm : price(o.Qm) * (1 - 1 / e)) - c) < 1e-10);
    let area = 0; const n = 20000, h = (o.Qc - o.Qm) / n;
    for (let i = 0; i < n; i++) area += (price(o.Qm + (i + .5) * h) - c) * h;
    assert.ok(Math.abs(area - o.dwl) < 2e-7 * Math.max(1, o.dwl));
    assert.ok(o.surplus(o.Qc) > o.surplus(o.Qm));
  }
  assert.equal(monopolyWelfare('iso', .5, 4).Qc, 65536);
});

test('Walras accounting and Cobb-Douglas equilibrium agree with an independent analytic price', () => {
  for (const x of [.4, 3, 7, 9.6]) for (const y of [.4, 3, 7, 9.6]) {
    const m = market(pref('cd', { a: .5 }), pref('cd', { a: .4 }), [x, y]);
    for (const p of [.1, .2, 1, 5, 10]) { const z = m.z(p); assert.ok(Math.abs(p * z[0] + z[1]) < 1e-12); }
    const p = (4 + .1 * y) / (6 - .1 * x); assert.ok(m.z(p).every(z => Math.abs(z) < 1e-12));
    const nonconvex = market(pref('cd', { a: .5 }), pref('sq'), [x, y]);
    assert.ok(nonconvex.z1(.999999) > 0); assert.ok(nonconvex.z1(1.000001) < 0);
    // At p=1 the convex utility x²+y² has exactly two corner maximizers; neither clears.
    const a1 = (x + y) / 2, incomeB = 20 - x - y;
    assert.ok(Math.abs(a1 - 10) > .1 && Math.abs(a1 + incomeB - 10) > .1);
  }
});
