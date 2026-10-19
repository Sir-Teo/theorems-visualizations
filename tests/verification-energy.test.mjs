// Independent solar-energy checks: analytic Bose-series integrals, root conditions
// and the actual spectral-area callbacks, rather than stored screenshot numbers.
import assert from 'node:assert/strict';
import test from 'node:test';
import * as M from '../assets/js/viz/math.js';
import { KB, HPL, CLIGHT, QE, SIGMA, T_SUN, FW, S0, phot, photMu, engy, cell, junction, junctionMax, stack, ffGreen } from '../content/energy/ch04.shared.js';
import base from '../content/energy/ch04.js';
import extra from '../content/energy/ch04-b.js';
import papers from '../content/energy/ch04-papers.js';

const near = (a, b, rel = 1e-7) => assert.ok(Math.abs(a - b) <= rel * Math.max(Math.abs(b), 1e-30), `${a} ≉ ${b}`);
// Independently sum the integrated Bose expansion, without quadrature or polylogs.
function photons(a, b, T, mu = 0) {
  const kt = KB * T;
  function tail(E) {
    if (!Number.isFinite(E)) return 0;
    let sum = 0;
    for (let n = 1; n <= 200000; n++) {
      const z = Math.exp(-n * (E - mu) / kt);
      const term = z * (kt * E * E / n + 2 * kt * kt * E / n ** 2 + 2 * kt ** 3 / n ** 3);
      sum += term;
      if (term < 1e-15 * sum) break;
    }
    return sum * 2 * Math.PI / (HPL ** 3 * CLIGHT ** 2);
  }
  return tail(a) - tail(b);
}
function integrate(f, a, b, n = 4000) {
  const dx = (b - a) / n; let sum = 0;
  for (let i = 0; i < n; i++) sum += f(a + (i + 0.5) * dx);
  return sum * dx;
}
test('Planck units, nominal solar flux, and actual blackbody spectral fractions', () => {
  near(S0, 1361.1632307, 1e-9);
  for (const T of [300, 5772, 6000]) near(QE * engy(0, Infinity, T), SIGMA * T ** 4, 1e-6);
  near(FW * QE * engy(1.239841984, Infinity, T_SUN) / S0, 0.71754594, 2e-7);
  near(FW * QE * engy(3.09960496, Infinity, T_SUN) / S0, 0.12176963, 2e-7);
  for (const a of [.4, 1.1, 1.8]) for (const T of [300, 5772]) near(phot(a, Infinity, T), photons(a, Infinity, T), 2e-6);
});
test('generalized emission agrees with an independent Bose series across the gap and expansion boundary', () => {
  for (const a of [.4, 1.1, 3]) for (const x of [.001, .1, .499, .501, 2, 15]) {
    const mu = a - x * KB * 300;
    for (const b of [a + .2, Infinity]) near(photMu(a, b, 300, mu), photons(a, b, 300, mu), 5e-10);
  }
});
test('radiative maximum obeys its derivative and voltage stays below the gap at full concentration', () => {
  for (const Eg of [.4, 1.1, 1.34, 3]) for (const conc of [1, 1000, 46200]) {
    const j = junction(Eg, Infinity, { conc, Tc: 300, faces: 1 }), m = junctionMax(j);
    assert.ok(0 < m.V && m.V < j.Voc && j.Voc < Eg);
    const h = 1e-6, derivative = ((m.V + h) * j.current(m.V + h) - (m.V - h) * j.current(m.V - h)) / (2 * h);
    assert.ok(Math.abs(derivative) < 1e-4 * j.A, `stationarity at ${Eg} eV, ${conc} suns`);
    const expected = QE * m.V * (j.A - (photons(Eg, Infinity, 300, m.V) - photons(Eg, Infinity, 300)));
    near(m.P, expected, 1e-9);
  }
});
test('single-diode signs, parasitic residuals, MPP and temperature derivative', () => {
  for (const suns of [.01, 1, 10]) for (const rs of [0, 1.2, 6]) {
    const c = cell({ suns, rs, rsh: rs ? 800 : Infinity, j0ref: 1e-12, T: 298.15, n: 1 });
    for (const V of [-.1, 0, .3, c.voc()]) {
      const J = c.J(V), Vd = V + J * rs / 1000;
      const residual = c.jph - c.j0 * Math.expm1(Vd / c.a) - (rs ? 1000 * Vd / 800 : 0) - J;
      assert.ok(Math.abs(residual) < 1e-8);
    }
    const m = c.pmax(), h = 1e-6;
    assert.ok(Math.abs((m.V + h) * c.J(m.V + h) - (m.V - h) * c.J(m.V - h)) < 1e-7);
    assert.ok(m.P > 0 && m.P < c.voc() * c.jsc());
    if (!rs) near(c.voc(), c.a * Math.log1p(c.jph / c.j0), 1e-12);
  }
  const mk = T => cell({ T, n: 1, alpha: 0, rs: 0, rsh: Infinity });
  const T = 298.15, c = mk(T), slope = (mk(T + .001).voc() - mk(T - .001).voc()) / .002;
  near(slope, (c.voc() - 1.12) / T - 3 * KB, 1e-8);
  assert.ok(cell({ n: 2 }).voc() > cell({ n: 1 }).voc(), 'fixed J0: n increases Voc');
  const m = c.pmax(); assert.ok(Math.abs(ffGreen(c.voc() / c.a) - m.P / (c.voc() * c.jsc())) < .0003);
});
test('series tandems conserve shared current and power; independent terminals cannot lose power', () => {
  for (const gaps of [[1.34], [1.8, 1.1], [2, 1.4, .9], [1.3, 1.3]]) for (const conc of [1, 46200]) {
    const o = { conc, Tc: 300, faces: 1 }, s = stack(gaps, o), four = stack(gaps, o, 'indep');
    assert.ok(s.eta <= four.eta + 1e-8);
    near(s.parts.reduce((sum, p) => sum + p.P, 0), s.eta * S0 * conc, 1e-12);
    s.js.forEach((j, i) => { assert.ok(Math.abs(j.current(s.parts[i].V) - s.j) < 2e-10 * Math.max(j.A, s.j, 1)); assert.ok(s.parts[i].V < j.E1); });
  }
});
// Capture the production visualization's callbacks without a DOM.
function record(item) {
  const stages = [], controls = [], callbacks = [], readouts = [];
  const noop = () => {};
  const v = { M, fix: (x, n) => x.toFixed(n), slider: (label, min, max, value) => { const c = { label, value, el: {} }; controls.push(c); return c; },
    select: (label, options, value) => { const c = { label, value }; controls.push(c); return c; }, toggle: (label, value) => ({ value }),
    button: noop, legend: noop, readout: fn => readouts.push(fn), render: fn => callbacks.push(fn),
    stage: () => { const calls = []; const stage = new Proxy({ calls, handle: (x, y) => ({ x, y, set(a,b) { this.x=a; this.y=b; } }) }, { get: (s,k) => k in s ? s[k] : (...args) => calls.push([k, ...args]) }); stages.push(stage); return stage; } };
  item.viz(v); callbacks.forEach(f => f()); return { stages, controls, readouts };
}
test('actual paper spectral output area includes the MPP current loss', () => {
  const r = record(papers.items[0]), green = r.stages[0].calls.find(c => c[0] === 'between' && c[5]?.fill === 'green');
  assert.ok(green);
  const o = { Ts: 6000, Tc: 300, fw: 2.18e-5, conc: 1, faces: 2 }, Eg = 1.1;
  const j = junction(Eg, Infinity, o), m = junctionMax(j);
  const ratio = green[1](2) / ((2 ** 3 / Math.expm1(2 / (KB * 6000))) / ((2.821 * KB * 6000) ** 3 / Math.expm1(2.821)));
  near(ratio, m.P / (QE * j.A * 2), 1e-12);
});
test('actual tandem dark bands allocate delivered power, including current mismatch', () => {
  const r = record(extra.items.find(i => i.num === '4.6'));
  const bands = r.stages[0].calls.filter(c => c[0] === 'between' && c[5]?.fillAlpha === .6);
  const s = stack([1.8, 1.3], { conc: 1, Tc: 300, faces: 1 });
  assert.equal(bands.length, 2);
  bands.forEach((b, i) => {
    const x = i ? 1.5 : 2.5, kt = KB * T_SUN;
    const f = (x ** 3 / Math.expm1(x / kt)) / ((2.82144 * kt) ** 3 / Math.expm1(2.82144));
    near(b[1](x) / f, s.parts[i].P / (QE * s.parts[i].A * x), 1e-12);
  });
});
test('actual solar spectrum uses wavelength density, and the étendue thermal limit matches the Sun', () => {
  const r = record(base.items[0]), f = r.stages[0].calls.find(c => c[0] === 'fn')[1];
  near(integrate(f, 50, 100000, 200000), S0, 1e-6);
  const peak = 2897771.955 / 5772; assert.ok(f(peak) > f(peak - 2) && f(peak) > f(peak + 2));
  near(((S0 / FW) / SIGMA) ** .25, T_SUN, 1e-12);
  near(1 / Math.sqrt(FW), 215.03, .0001);
});
