import test from 'node:test';
import assert from 'node:assert/strict';
import { MYR, KAPPA, halfSpaceT, halfSpaceQ, halfSpaceSubs, ridgeHeatIntegrand, plateT, plateQ, plateSubs } from '../content/geol/ch04.shared.js';
import { prismField, anomalyProfile, velAt, rotPts, V, R_EARTH, NORMALS, polarityAt } from '../content/geol/ch03.shared.js';

const close = (a, b, tol = 1e-8) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);
function simpson(f, a, b, n = 2000) {
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return s * h / 3;
}
test('half-space profile satisfies diffusion and the imposed thermal boundaries', () => {
  for (const t of [2, 20, 80]) {
    close(halfSpaceT(0, t), 0, 2e-6); close(halfSpaceT(1e7, t), 1300);
    const z = 30000, dz = 20, dt = .001;
    const dTdt = (halfSpaceT(z, t + dt) - halfSpaceT(z, t - dt)) / (2 * dt * MYR);
    const lap = (halfSpaceT(z + dz, t) - 2 * halfSpaceT(z, t) + halfSpaceT(z - dz, t)) / dz ** 2;
    close(dTdt, KAPPA * lap, Math.abs(dTdt) * 1e-4);
  }
  // erf(1.163087153676674)=0.9 (independent tabulated inverse-erf value).
  close(halfSpaceT(2 * 1.163087153676674 * Math.sqrt(KAPPA * 80 * MYR), 80), 1170, .0002);
});
test('surface flux is the independently differentiated temperature profile', () => {
  for (const t of [1, 60, 180]) {
    const dz = .5;
    const derivative = (halfSpaceT(dz, t) - halfSpaceT(0, t)) / dz;
    close(3.138 * derivative, halfSpaceQ(t), halfSpaceQ(t) * 3e-5);
  }
});
test('integrated density anomaly includes the old-plate tail below the plot', () => {
  for (const t of [1, 80, 180]) {
    const limit = 8 * Math.sqrt(KAPPA * t * MYR);
    const mass = simpson(z => 3300 * 3e-5 * (1300 - halfSpaceT(z, t)), 0, limit);
    close(mass / 2300, halfSpaceSubs(t), .001);
  }
});
test('transformed ocean heat integral retains its finite ridge endpoint', () => {
  const area = 3.1e14, maxAge = 180, Tm = 1350, k = 3.3;
  const p = { area, maxAge, Tm, k };
  assert.ok(ridgeHeatIntegrand(0, p) > 0);
  const expected = 8 * area * halfSpaceQ(1, { Tm, k }) / (3 * Math.sqrt(maxAge));
  close(simpson(u => ridgeHeatIntegrand(u, p), 0, Math.sqrt(maxAge)), expected, expected * 1e-12);
  // A constant conductive fraction scales the whole integral, including t=0.
  close(simpson(u => .2 * ridgeHeatIntegrand(u, p), 0, Math.sqrt(maxAge)), .2 * expected, expected * 1e-12);
});
test('plate solution reaches its fixed-temperature and flux limits', () => {
  const a = 100000;
  close(plateT(0, 60, a), 0); close(plateT(a, 60, a), 1300);
  close(plateT(a / 3, 10000, a), 1300 / 3);
  close(plateQ(10000, a), 3.138 * 1300 / a);
  close(plateSubs(10000, a), 3300 * 3e-5 * 1300 * a / (2 * 2300));
  close(plateQ(1, a), halfSpaceQ(1), 1e-12);
});
test('vertical prism agrees with the independent symmetric-strip solution', () => {
  const m = .0027 * 4 * Math.PI * 50000, a = 10, top = 2, base = 20;
  const [bx, bz] = prismField(0, 0, -a, a, top, base, 0, m);
  close(bx, 0); close(bz, m / Math.PI * (Math.atan(a / top) - Math.atan(a / base)));
  const xs = [-30, 0, 30], blocks = [{ x0: -a, x1: a, s: .0027 * 4 * Math.PI }];
  const normal = anomalyProfile(xs, blocks, { zTop: top, thick: base - top, F: 50000, incl: 90, dAng: 0 });
  const reverse = anomalyProfile(xs, blocks.map(b => ({ ...b, s: -b.s })), { zTop: top, thick: base - top, F: 50000, incl: 90, dAng: 0 });
  normal.forEach((y, i) => close(y, -reverse[i]));
});
test('Euler speeds agree with a finite-difference rotation in physical units', () => {
  const p = [-20, -35], pole = [-37, 60], rate = .7, dt = 1e-5;
  const a = V(rotPts(p, pole, -rate * dt)), b = V(rotPts(p, pole, rate * dt));
  const measured = Math.hypot(...a.map((x, i) => (b[i] - x) / (2 * dt))) * R_EARTH;
  close(measured, velAt(p, pole, rate).speed, 1e-6);
});

test('historical CK95 includes Reunion and exact dated boundaries', () => {
  assert.equal(NORMALS.length, 12);
  assert.equal(polarityAt(2.145), 1);
  assert.equal(polarityAt(2.139), -1);
  assert.equal(polarityAt(2.151), -1);
  assert.equal(polarityAt(2.5805), -1);
  assert.equal(polarityAt(2.5815), 1);
  assert.equal(polarityAt(5.892), -1);
  assert.equal(polarityAt(5.895), 1);
});
