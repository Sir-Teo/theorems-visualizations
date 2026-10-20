/** Authored three-good Cobb–Douglas reconstruction, not data from Walras.
 * Original1874 Lessons9/21–23 motivate prices/net demands and the value identity.
 * The simultaneous numeraire ODE, exact equilibrium and contraction proof are
 * derived for this specific economy, independently of any finite integration.
 */
export const WALRAS_ALPHA = [[.5, .3, .2], [.2, .5, .3], [.3, .2, .5]];
export const WALRAS_OMEGA = [[3, .5, 1], [.5, 2.5, 1], [1, .5, 3]];
export const WALRAS_TOTAL = [4.5, 3.5, 5];
export const WALRAS_COEFFICIENTS = [[19 / 10, 9 / 10, 8 / 5], [27 / 20, 3 / 2, 7 / 5], [5 / 4, 11 / 10, 2]];
export const WALRAS_EQUILIBRIUM = [892 / 797, 1160 / 797, 1];
const positive = (p, n) => Array.isArray(p) && p.length === n && p.every(x => Number.isFinite(x) && x > 0);

export function walrasMarket(p) {
  if (!positive(p, 3)) throw new RangeError('Three strictly positive finite prices are required');
  const income = WALRAS_OMEGA.map(w => w.reduce((s, x, g) => s + x * p[g], 0));
  const demand = WALRAS_ALPHA.map((a, i) => a.map((q, g) => q * income[i] / p[g]));
  const z = WALRAS_TOTAL.map((w, g) => demand.reduce((s, d) => s + d[g], 0) - w);
  const valueTerms = z.map((q, g) => q * p[g]);
  return { p: [...p], income, demand, z, valueTerms, value: valueTerms.reduce((s, x) => s + x, 0) };
}

/** Physical direction (p1',p2') with p3=1; no price clipping or normalization. */
export function walrasFlow(p) {
  if (!positive(p, 2)) return null;
  return [-13 / 5 + ((9 / 10) * p[1] + 8 / 5) / p[0], -2 + ((27 / 20) * p[0] + 7 / 5) / p[1]];
}

/** Analytic, global-in-time certificate for the exact ODE, not an error bound
 * for the numerical integrator: r_i=p_i/p_i*, r3=1; [lower,upper]^2 invariant.
 * At every active index of V=max|r_i-1|, D+V <= -rate V.
 */
export function walrasContraction(start) {
  if (!positive(start, 2)) throw new RangeError('Two strictly positive starting prices are required');
  const ratios = start.map((p, g) => p / WALRAS_EQUILIBRIUM[g]);
  const lower = Math.min(1, ...ratios), upper = Math.max(1, ...ratios);
  const initial = Math.max(...ratios.map(x => Math.abs(x - 1)));
  const rate = Math.min((8 / 5) / WALRAS_EQUILIBRIUM[0] ** 2, (7 / 5) / WALRAS_EQUILIBRIUM[1] ** 2) / upper;
  return { lower, upper, initial, rate };
}

function rk4(p, h) {
  const a = walrasFlow(p); if (!a) return null;
  const b = walrasFlow(p.map((x, i) => x + h * a[i] / 2)); if (!b) return null;
  const c = walrasFlow(p.map((x, i) => x + h * b[i] / 2)); if (!c) return null;
  const d = walrasFlow(p.map((x, i) => x + h * c[i])); if (!d) return null;
  const q = p.map((x, i) => x + h * (a[i] + 2 * b[i] + 2 * c[i] + d[i]) / 6);
  return positive(q, 2) ? q : null;
}

/** Positive-stage RK4 with step doubling. Accepted local error estimates are
 * numerical estimates, not a formal global numerical-error certificate.
 * Every fixed output time, including both endpoints, is retained.
 */
export function walrasTrajectory(start, { end = 14, spacing = .05, tolerance = 2e-11 } = {}) {
  if (!positive(start, 2) || !Number.isFinite(end) || end < 0 || !(spacing > 0) ||
      !Number.isFinite(spacing) || !(tolerance > 0) || !Number.isFinite(tolerance)) throw new RangeError('Invalid finite integration request');
  const count = Math.ceil(end / spacing);
  if (count > 200000) throw new RangeError('Too many requested output times');
  let p = [...start], time = 0, h = .01, steps = 0, rejections = 0, largestErrorRatio = 0;
  const points = [{ t: 0, ...walrasMarket([...p, 1]) }], certificate = walrasContraction(start);
  for (let n = 1; n <= count; n++) {
    const goal = Math.min(n * spacing, end);
    while (time < goal - 1e-13) {
      if (++steps > 2000000) throw new Error('Finite integration did not finish');
      const step = Math.min(h, goal - time), coarse = rk4(p, step), first = rk4(p, step / 2), fine = first && rk4(first, step / 2);
      if (!coarse || !fine) { h = step / 2; rejections++; if (h < 1e-14) throw new Error('Finite integration exhausted arithmetic resolution'); continue; }
      const error = Math.max(...fine.map((x, i) => Math.abs(x - coarse[i]))) / 15;
      const limit = tolerance * (1 + Math.max(...fine.map(Math.abs)));
      if (error <= limit) {
        p = fine; time += step; largestErrorRatio = Math.max(largestErrorRatio, error / limit);
        h = step * Math.min(2, Math.max(.2, .9 * (limit / (error || limit * .001)) ** .2));
      } else { h = step * Math.max(.1, .9 * (limit / error) ** .2); rejections++; }
      if (h < 1e-14) throw new Error('Finite integration exhausted arithmetic resolution');
    }
    time = goal;
    points.push({ t: goal, ...walrasMarket([...p, 1]) });
  }
  return { points, certificate, steps, rejections, largestErrorRatio };
}
