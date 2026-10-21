import test from 'node:test';
import assert from 'node:assert/strict';
import { LIGHT_CM_PER_NS, tofWidthAudit, tofGainAudit, tofSourceAudit, tofBackprojectionAudit } from '../content/imaging/source-audit-tof.shared.js';
import { rng32, gauss } from '../content/imaging/ch04.shared.js';
const near = (a, b, e = 1e-10) => assert.ok(Math.abs(a - b) < e, `${a} != ${b}`);
const makeRandoms = N => {
  const r = rng32(581), U = [], AL = [], RR = [], TH = [], ZZ = [];
  for (let i = 0; i < N; i++) { U.push(r()); AL.push(r() * Math.PI); RR.push(Math.sqrt(r())); TH.push(2 * Math.PI * r()); ZZ.push(gauss(r)); }
  return { U, AL, RR, TH, ZZ };
};
test('independent detector flight lengths recover signed displacement and FWHM conversion', () => {
  for (const halfLength of [25, 40]) for (const x of [-20, 0, 17]) {
    const t1 = (halfLength + x) / LIGHT_CM_PER_NS, t2 = (halfLength - x) / LIGHT_CM_PER_NS;
    near((t1 - t2) * LIGHT_CM_PER_NS / 2, x);
  }
  near(tofWidthAudit(500), 7.49481145); near(tofWidthAudit(100), 1.49896229);
  const sigma = tofWidthAudit(300) / (2 * Math.sqrt(2 * Math.log(2)));
  near(Math.exp(-.5 * (tofWidthAudit(300) / 2 / sigma) ** 2), .5);
});
test('uniform-object SNR gain and effective-count gain remain distinct, with the declared lower clamp', () => {
  const D = 20, ps = 300, gain = tofGainAudit(D, ps);
  near(gain, Math.sqrt(20 / 4.49688687)); near(gain * gain, D / tofWidthAudit(ps));
  near(tofGainAudit(40, ps) / gain, Math.sqrt(2));
  near(tofGainAudit(12, 1000), 1);
  assert.ok(Math.sqrt(12 / tofWidthAudit(1000)) < 1, 'unclamped expression is not falsely reported as equal to one');
});
test('phantom mixture has a unit-radius uniform lesion with density ratio four, not a Gaussian with a mislabeled peak', () => {
  for (const R of [6, 15, 20]) {
    const p = 3 / (R * R + 3), center = [.45 * R, .3 * R];
    // Conditional uniform disc radii have mean squared radius radius²/2.
    for (const lesion of [false, true]) {
      let meanR2 = 0;
      for (let j = 0; j < 200; j++) {
        const radial = (j + .5) / 200, theta = j * 2.399963229728653;
        const x = tofSourceAudit(R, lesion ? p / 2 : (1 + p) / 2, radial, theta);
        const cx = lesion ? center[0] : 0, cy = lesion ? center[1] : 0;
        const radius = Math.hypot(x[0] - cx, x[1] - cy);
        assert.ok(radius <= (lesion ? 1 : R)); meanR2 += radius * radius / 200;
      }
      near(meanR2, (lesion ? 1 : R * R) / 2);
    }
    const backgroundDensity = (1 - p) / (Math.PI * R * R), lesionExtraDensity = p / Math.PI;
    near((backgroundDensity + lesionExtraDensity) / backgroundDensity, 4);
    assert.ok(Math.hypot(...center) + 1 < R, 'the lesion stays entirely inside the background');
  }
});
test('both reconstructions conserve one event per chord across diameter/timing endpoints and have finite ROI statistics', () => {
  const N = 500, r = makeRandoms(N);
  for (const D of [12, 40]) for (const ps of [30, 1000]) {
    const q = tofBackprojectionAudit(D, ps, N, r);
    assert.equal(q.retained, N);
    for (const image of [q.non, q.tof]) { assert.ok(image.every(x => Number.isFinite(x) && x >= 0)); near(image.reduce((s, x) => s + x, 0), N, 2e-10); }
    for (const v of [q.ln.les, q.ln.bg, q.lt.les, q.lt.bg]) assert.ok(Number.isFinite(v) && v > 0);
  }
});
test('complete midpoint chord cells retain very short near-tangent events formerly skipped by a fixed half-step start', () => {
  const D = 12, R = D / 2, r = { U: [1], AL: [Math.PI / 2], RR: [1 - 1e-6], TH: [0], ZZ: [0] };
  const halfChord = Math.sqrt(R * R - (R * r.RR[0]) ** 2);
  assert.ok(2 * halfChord < .2);
  const q = tofBackprojectionAudit(D, 30, 1, r);
  assert.equal(q.retained, 1); near(q.non.reduce((s, x) => s + x, 0), 1); near(q.tof.reduce((s, x) => s + x, 0), 1);
});
test('at very poor timing, normalized TOF weights approach the non-TOF weights', () => {
  const r = makeRandoms(50), q = tofBackprojectionAudit(12, 1e10, 50, r);
  assert.ok(Math.max(...q.non.map((x, i) => Math.abs(x - q.tof[i]))) < 1e-7);
});
