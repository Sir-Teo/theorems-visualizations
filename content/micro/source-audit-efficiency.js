/** Two-consumer, two-good Pareto geometry, totals (10,10).
 * Definition: Debreu–Scarf (1963), pp.235,238–239. The four explicit
 * preference families, efficient sets and constructive trades are derived
 * here; no sampled lens or percentage MRS tolerance certifies efficiency.
 */
export const EFFICIENCY_TOLERANCE = 1e-10;
export const EFFICIENCY_GAIN_RESOLUTION = 1e-12;
const clamp = x => Math.max(0, Math.min(10, x));

export function efficiencyUtility(family, a, x, y) {
  if (family === 'subs') return a * x + (1 - a) * y;
  if (family === 'comp') return Math.min((1 - a) * x, a * y);
  if (x <= 0 || y <= 0) return 0;
  if (family === 'cd') return x ** a * y ** (1 - a);
  return (a * x ** -1.5 + (1 - a) * y ** -1.5) ** (-2 / 3);
}

/** Exact smooth-family equation, including its two efficient endpoints. */
export function efficientCurveY(family, a, b, x) {
  if (x <= 0) return 0;
  if (x >= 10) return 10;
  const eta = (b * (1 - a) / (a * (1 - b))) ** (family === 'ces' ? .4 : 1);
  return 10 * eta * x / (10 + (eta - 1) * x);
}

function reservationRoot(fn, target, increasing = true) {
  let lo = 0, hi = 10;
  if (increasing ? target <= fn(0) : target >= fn(0)) return 0;
  if (increasing ? target >= fn(10) : target <= fn(10)) return 10;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (increasing ? fn(mid) < target : fn(mid) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function halfplane(poly, A, B, C) {
  const out = [], f = p => A * p[0] + B * p[1] + C;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], fp = f(p), fq = f(q);
    if (fp >= 0) out.push(p);
    if ((fp >= 0) !== (fq >= 0)) {
      const t = fp / (fp - fq);
      out.push([clamp(p[0] + t * (q[0] - p[0])), clamp(p[1] + t * (q[1] - p[1]))]);
    }
  }
  return out;
}

/** Two closed same-bottleneck half-plane intersections; may be lines. */
export function efficientComplementPolygons(a, b) {
  return [1, -1].map(sign => halfplane(
    halfplane([[0, 0], [10, 0], [10, 10], [0, 10]], sign * (1 - a), -sign * a, 0),
    -sign * (1 - b), sign * b, sign * 10 * (1 - 2 * b)));
}

export function efficientAllocationState(family, a, b, x, y) {
  if (!['cd', 'ces', 'comp', 'subs'].includes(family) ||
      ![a, b, x, y].every(Number.isFinite) || a < .15 || a > .85 || b < .15 || b > .85 ||
      x < 0 || x > 10 || y < 0 || y > 10) throw new RangeError('Outside the displayed exchange model');
  const uA = efficiencyUtility(family, a, x, y), uB = efficiencyUtility(family, b, 10 - x, 10 - y);
  let residual, target, reservation = null, relation;
  if (family === 'cd' || family === 'ces') {
    residual = y - efficientCurveY(family, a, b, x);
    const low = reservationRoot(t => efficiencyUtility(family, a, t, efficientCurveY(family, a, b, t)), uA);
    const high = reservationRoot(t => efficiencyUtility(family, b, 10 - t, 10 - efficientCurveY(family, a, b, t)), uB, false);
    const t = (low + high) / 2;
    reservation = { low, high };
    target = [t, efficientCurveY(family, a, b, t)];
  } else if (family === 'subs') {
    if (a === b) { residual = 0; target = [x, y]; relation = 'all'; }
    else {
      const q = (a / (1 - a) + b / (1 - b)) / 2, direction = a > b ? 1 : -1;
      residual = direction > 0 ? Math.min(10 - x, y) : Math.min(x, 10 - y);
      const distance = direction > 0 ? Math.min(10 - x, y / q) : Math.min(x, (10 - y) / q);
      target = [clamp(x + direction * distance), clamp(y - direction * q * distance)];
    }
  } else {
    const left = uA / (1 - a), right = 10 - uB / (1 - b), bottom = uA / a, top = 10 - uB / b;
    const slack1 = right - left, slack2 = top - bottom;
    residual = Math.min(slack1, slack2);
    reservation = { left, right, bottom, top, slack1, slack2 };
    const increment = Math.max(0, Math.min(slack1 / (1 / (1 - a) + 1 / (1 - b)), slack2 / (1 / a + 1 / b)));
    // At least one resource requirement binds after this common utility increment.
    target = [(uA + increment) / (1 - a), (uA + increment) / a].map(clamp);
  }
  relation ??= Math.abs(residual) <= EFFICIENCY_TOLERANCE ? 'matches' : 'off';
  const gains = [efficiencyUtility(family, a, ...target) - uA, efficiencyUtility(family, b, 10 - target[0], 10 - target[1]) - uB];
  const witness = relation === 'off' ? { point: target, gains, resolved: gains.every(g => g > EFFICIENCY_GAIN_RESOLUTION) } : null;
  return { family, a, b, x, y, uA, uB, relation, residual, target, reservation, witness };
}

/** Entire indifference boundary clipped analytically to the closed box.
 * Complement level zero includes only the two axes (not an arbitrary L).
 */
export function efficiencyIndifference(family, a, level, n = 160) {
  if (family === 'comp') {
    const x = clamp(level / (1 - a)), y = clamp(level / a);
    return [[x, 10], [x, y], [10, y]];
  }
  if (family === 'subs') {
    const lo = Math.max(0, (level - (1 - a) * 10) / a), hi = Math.min(10, level / a);
    return [[clamp(lo), clamp((level - a * lo) / (1 - a))], [clamp(hi), clamp((level - a * hi) / (1 - a))]];
  }
  if (level <= 0) return [[0, 10], [0, 0], [10, 0]];
  const lo = family === 'cd' ? (level / 10 ** (1 - a)) ** (1 / a)
    : ((level ** -1.5 - (1 - a) * 10 ** -1.5) / a) ** (-2 / 3);
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = lo + (10 - lo) * i / n;
    const y = family === 'cd' ? (level / x ** a) ** (1 / (1 - a))
      : ((level ** -1.5 - a * x ** -1.5) / (1 - a)) ** (-2 / 3);
    return [clamp(x), clamp(y)];
  });
}
