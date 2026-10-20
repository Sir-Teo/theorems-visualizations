// Authored dimensionless scalar family. At r=1 and s=-k this has the scalar
// form of Case et al. (1995), Eq. 1; their learning equation is not used.
function parameters(r, s) {
  if (!Number.isFinite(r) || r < -.5 || r > 1.5 || !Number.isFinite(s) || s < -1 || s > 1) throw new RangeError('Use the declared model parameter and stimulus ranges.');
}
export const hysteresisVelocity = (r, s, z) => r * z - z ** 3 + s;
export const hysteresisPotential = (r, s, z) => z ** 4 / 4 - r * z * z / 2 - s * z;
export function hysteresisFold(r) {
  parameters(r, 0); return r > 0 ? { z: Math.sqrt(r / 3), s: 2 * (r / 3) ** 1.5 } : null;
}
function root(r, s, lo, hi) {
  let f = hysteresisVelocity(r, s, lo);
  if (f === 0) return lo;
  if (hysteresisVelocity(r, s, hi) === 0) return hi;
  for (let i = 0; i < 65; i++) {
    const mid = (lo + hi) / 2, g = hysteresisVelocity(r, s, mid);
    if (g === 0) return mid;
    if ((f < 0) === (g < 0)) { lo = mid; f = g; } else hi = mid;
  }
  return (lo + hi) / 2;
}
export function hysteresisEquilibria(r, s) {
  parameters(r, s); const fold = hysteresisFold(r);
  let roots;
  if (fold && Math.abs(s) < fold.s) roots = [[root(r, s, -2, -fold.z), 'stable'], [root(r, s, -fold.z, fold.z), 'unstable'], [root(r, s, fold.z, 2), 'stable']];
  else if (fold && s === fold.s) roots = [[-fold.z, 'fold'], [2 * fold.z, 'stable']];
  else if (fold && s === -fold.s) roots = [[-2 * fold.z, 'stable'], [fold.z, 'fold']];
  else roots = [[root(r, s, -2, 2), r === 0 && s === 0 ? 'nonlinear stable' : 'stable']];
  return roots.map(([z, kind]) => ({ z, kind, slope: r - 3 * z * z }));
}
export function hysteresisBranches(r) {
  parameters(r, 0); const fold = hysteresisFold(r), lo = hysteresisEquilibria(r, -1)[0].z, hi = hysteresisEquilibria(r, 1).at(-1).z;
  const cuts = fold ? [lo, -fold.z, fold.z, hi] : [lo, hi];
  return cuts.slice(0, -1).map((a, i) => ({ stable: !fold || i !== 1, points: Array.from({ length: 121 }, (_, k) => {
    const z = a + (cuts[i + 1] - a) * k / 120; return [z ** 3 - r * z, z];
  }) }));
}
// One full triangular forcing cycle: 100 stored intervals per leg, but RK4
// substeps <= .01 model-time units; the return starts at the actual turn state.
export function hysteresisCycle(r, duration, start = 'low', maxStep = .01) {
  parameters(r, 0);
  if (!Number.isFinite(duration) || duration < 4 || duration > 160 || !['low', 'high'].includes(start) || !Number.isFinite(maxStep) || maxStep <= 0 || maxStep > .05) throw new RangeError('Use the declared cycle preparation, duration and positive integration step.');
  const sign = start === 'low' ? 1 : -1, initialS = -sign;
  let z = hysteresisEquilibria(r, initialS)[0].z;
  const points = [{ t: 0, s: initialS, z }], events = [];
  const interval = duration / 100, substeps = Math.ceil(interval / maxStep), h = interval / substeps;
  for (let i = 0; i < 200; i++) {
    const leg = i < 100 ? 0 : 1, direction = leg ? -sign : sign;
    const s0 = leg ? sign - 2 * sign * (i - 100) / 100 : -sign + 2 * sign * i / 100;
    for (let j = 0; j < substeps; j++) {
      const s = s0 + direction * 2 * (j * h) / duration, ds = direction * 2 * h / duration, before = z;
      const f = (x, u) => hysteresisVelocity(r, u, x);
      const k1 = f(z, s), k2 = f(z + h * k1 / 2, s + ds / 2), k3 = f(z + h * k2 / 2, s + ds / 2), k4 = f(z + h * k3, s + ds);
      z += h * (k1 + 2 * k2 + 2 * k3 + k4) / 6;
      if ((before < 0 && z >= 0) || (before > 0 && z <= 0)) {
        const fraction = before / (before - z);
        events.push({ t: (i * substeps + j + fraction) * h, s: s + fraction * ds, leg, direction: z > before ? 1 : -1 });
      }
    }
    const step = i + 1, s = step <= 100 ? -sign + 2 * sign * step / 100 : sign - 2 * sign * (step - 100) / 100;
    points.push({ t: step * interval, s, z });
  }
  return { r, duration, start, maxStep: h, points, events };
}
