// Microeconomics — Chapter 9: helpers shared by ch09.js, ch09-b.js, ch09-c.js and ch09-d.js (plain named exports).
// Re-exports the Chapter 8 helpers (clamp, GUIDE, bisect, argmax, plateText, slopeLine, …) and adds the Edgeworth-box toolkit.
// House style of the box diagrams: trader A (origin at the lower left) `accent`, trader B (origin at the upper right) `orange`,
// the lens of mutually preferred trades `green`, the contract curve `purple`, price lines `ink`, equilibria `green`, test
// allocations `gold`, failures `red`. Good 1 on the horizontal axis, good 2 on the vertical one; the box is W1 × W2 = 10 × 10.
// Everything is computed from the utilities (demands by closed form or by search, efficiency by search), never read off a formula
// for the picture.
export * from './ch08.shared.js';
import { clamp, bisect, argmax } from './ch08.shared.js';

export const W1 = 10, W2 = 10, W = [W1, W2];
export const ink = 'ink';

// ------------------------------------------------------------------------------------------------ preferences
/**
 * Preference families for one trader, in the trader's own coordinates (x = good 1, y = good 2).
 *   u(x, y), mrs(x, y) = MU1/MU2, dem(p, m) = best bundle on p x + y = m (prices p and 1), ray = u increases along rays, kinks.
 */
export function pref(kind, P = {}) {
  switch (kind) {
    case 'cd': { const a = P.a ?? 0.5;
      return { kind, a, u: (x, y) => (x <= 0 || y <= 0 ? 0 : x ** a * y ** (1 - a)), mrs: (x, y) => (a / (1 - a)) * (y / x), dem: (p, m) => [(a * m) / p, (1 - a) * m], ray: true, convex: true }; }
    case 'ces': { const a = P.a ?? 0.5, r = P.r ?? -1;
      if (Math.abs(r) < 1e-3) return pref('cd', { a });
      const s = 1 / (1 - r), u = (x, y) => (x <= 0 || y <= 0 ? 0 : (a * x ** r + (1 - a) * y ** r) ** (1 / r));
      return { kind, a, r, u, mrs: (x, y) => (a / (1 - a)) * (y / x) ** (1 - r), ray: true, convex: r <= 1,
        dem: (p, m) => { const w1 = a ** s * p ** (1 - s), w2 = (1 - a) ** s, s1 = w1 / (w1 + w2); return [(s1 * m) / p, (1 - s1) * m]; } }; }
    case 'comp': { const a = P.a ?? 1, b = P.b ?? 1;
      return { kind, a, b, u: (x, y) => Math.min(a * x, b * y), mrs: () => NaN, ray: true, kinks: [Math.atan2(a, b)], convex: true,
        dem: (p, m) => { const x = m / (p + a / b); return [x, (a * x) / b]; } }; }
    case 'subs': { const a = P.a ?? 1, b = P.b ?? 1;
      return { kind, a, b, u: (x, y) => a * x + b * y, mrs: () => a / b, ray: true, convex: true,
        dem: (p, m) => { const d = a / p - b; return Math.abs(d) < 1e-12 ? [m / (2 * p), m / 2] : d > 0 ? [m / p, 0] : [0, m]; } }; }
    case 'sq': // u = x² + y²: the indifference curves bulge away from the origin (non-convex preferences)
      return { kind, u: (x, y) => x * x + y * y, mrs: (x, y) => x / y, ray: true, convex: false,
        dem: (p, m) => (p <= 1 ? [m / p, 0] : [0, m]) };
    case 'sat': { const bx = P.bx ?? 5, by = P.by ?? 5; // quadratic loss around a bliss point (violates local non-satiation)
      return { kind, bx, by, u: (x, y) => -((x - bx) ** 2 + (y - by) ** 2), mrs: (x, y) => (bx - x) / (by - y), ray: false, convex: true,
        dem: (p, m) => {
          if (p * bx + by <= m) return [bx, by];
          // closest point of the budget line p x + y = m to (bx, by), clipped to the non-negative part
          const t = (p * bx + by - m) / (p * p + 1);
          let x = bx - p * t, y = by - t;
          if (x < 0) { x = 0; y = m; } else if (y < 0) { y = 0; x = m / p; }
          return [x, y];
        } }; }
    default: throw new Error('unknown preference family ' + kind);
  }
}

/** Radius at which u = L along the ray of angle th (u increasing along rays); null if not reached within rmax. */
export function rayLevel(u, L, th, rmax) {
  const c = Math.cos(th), s = Math.sin(th);
  return bisect((r) => u(r * c, r * s) - L, 1e-9, rmax, 46);
}
/** The level set u = L in the positive quadrant as a polyline in the trader's own coordinates (null breaks the path). */
export function levelPts(F, L, n = 150, rmax = 60) {
  const ths = [];
  for (let i = 0; i <= n; i++) ths.push(0.004 + (Math.PI / 2 - 0.008) * (i / n));
  if (F.kinks) for (const k of F.kinks) ths.push(k);
  ths.sort((a, b) => a - b);
  const pts = [];
  for (const th of ths) { const r = rayLevel(F.u, L, th, rmax); pts.push(r == null ? null : [r * Math.cos(th), r * Math.sin(th)]); }
  return pts;
}
/** The box point of B's own bundle (x, y). */
export const toBox = (x, y) => [W1 - x, W2 - y];

// ------------------------------------------------------------------------------------------------ the exchange economy
/**
 * Exchange economy of two traders in the box. wA = A's endowment (B gets the rest). Price p = p1/p2 (good 2 is numeraire).
 * demA(p), demB(p) in own coordinates; boxB(p) = B's demand as a box point; z(p) = [z1, z2] excess demand (A + B − totals);
 * roots() = market-clearing prices found by scanning a log grid and bisecting on z1 (jumps rejected), each with the sign of
 * z1' (stable for tâtonnement when negative).
 */
export function market(FA, FB, wA) {
  const wB = [W1 - wA[0], W2 - wA[1]];
  const mA = (p) => p * wA[0] + wA[1], mB = (p) => p * wB[0] + wB[1];
  const demA = (p) => FA.dem(p, mA(p)), demB = (p) => FB.dem(p, mB(p));
  const z = (p) => { const a = demA(p), b = demB(p); return [a[0] + b[0] - W1, a[1] + b[1] - W2]; };
  const z1 = (p) => z(p)[0];
  const roots = (lo = 0.02, hi = 50, n = 500) => {
    const out = []; let pa = lo, fa = z1(lo);
    for (let i = 1; i <= n; i++) {
      const p = lo * (hi / lo) ** (i / n), f = z1(p);
      if (fa === 0) out.push(pa);
      else if (fa * f < 0) {
        let a = pa, b = p, ga = fa;
        for (let k = 0; k < 60; k++) { const m = Math.sqrt(a * b), gm = z1(m); if ((gm < 0) === (ga < 0)) { a = m; ga = gm; } else b = m; }
        const r = Math.sqrt(a * b);
        if (Math.abs(z1(r)) < 0.05) out.push(r);
      }
      pa = p; fa = f;
    }
    return out.map((p) => ({ p, slope: (z1(p * 1.001) - z1(p / 1.001)) / (p * 0.002), stable: z1(p * 1.001) < z1(p / 1.001) }));
  };
  return { FA, FB, wA, wB, mA, mB, demA, demB, boxB: (p) => toBox(...demB(p)), z, z1, roots };
}

/** Contract curve of two smooth (strictly convex) traders: for each x, the y with MRS_A = MRS_B, by bisection. → polyline in the box. */
export function contractCurve(FA, FB, n = 120) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = (W1 * (i + 0.0)) / n;
    if (i === 0) { pts.push([0, 0]); continue; }
    if (i === n) { pts.push([W1, W2]); continue; }
    const f = (y) => Math.log(FA.mrs(x, y)) - Math.log(FB.mrs(W1 - x, W2 - y));
    const y = bisect(f, 1e-6, W2 - 1e-6, 50);
    if (y != null) pts.push([x, y]);
  }
  return pts;
}

/**
 * Pareto-efficient allocations by direct search (no tangency assumed): for each level L of A's utility, the point of A's
 * indifference curve inside the box where B is best off. Works for non-convex preferences. → polyline sorted by x.
 */
export function paretoSearch(FA, FB, levels = 70, rays = 110) {
  const uA1 = FA.u(W1 - 1e-3, W2 - 1e-3), pts = [];
  for (let k = 1; k < levels; k++) {
    const L = (uA1 * k) / levels; let best = null;
    for (let i = 0; i <= rays; i++) {
      const th = 0.004 + (Math.PI / 2 - 0.008) * (i / rays), r = rayLevel(FA.u, L, th, 20);
      if (r == null) continue;
      const x = r * Math.cos(th), y = r * Math.sin(th);
      if (x > W1 || y > W2) continue;
      const ub = FB.u(W1 - x, W2 - y);
      if (!best || ub > best.u) best = { u: ub, p: [x, y] };
    }
    if (best) pts.push(best.p);
  }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return pts;
}

/**
 * Pareto improvements of the allocation (x, y) (A's bundle): the points of a g × g grid that make both traders at least as
 * well off and one strictly better. → {area (fraction of the box), best: the improving point maximising the product of gains,
 * count}. Utilities may be passed as functions of the box point (ua, ub) to include externalities.
 */
export function improvements(ua, ub, x, y, g = 44) {
  const a0 = ua(x, y), b0 = ub(x, y), tol = 1e-9 * (1 + Math.abs(a0) + Math.abs(b0));
  let cnt = 0, best = null, bestV = 0, tot = 0;
  for (let i = 0; i < g; i++) for (let j = 0; j < g; j++) {
    const px = (W1 * (i + 0.5)) / g, py = (W2 * (j + 0.5)) / g; tot++;
    const da = ua(px, py) - a0, db = ub(px, py) - b0;
    if (da >= -tol && db >= -tol && (da > tol || db > tol)) { cnt++; const v = Math.max(da, 0) * Math.max(db, 0) + 1e-6 * (da + db); if (v > bestV) { bestV = v; best = [px, py]; } }
  }
  return { area: cnt / tot, best, count: cnt };
}
/** Climb from (x, y) by repeated Pareto improvements (to the grid point with the largest product of gains, then a local pattern search) until none is left. → trail of points. */
export function improveTrail(ua, ub, x, y, steps = 14) {
  const trail = [[x, y]];
  for (let k = 0; k < steps; k++) {
    const r = improvements(ua, ub, x, y, 60);
    if (!r.best) break;
    const a0 = ua(x, y), b0 = ub(x, y), gain = (px, py) => { const da = ua(px, py) - a0, db = ub(px, py) - b0; return da >= 0 && db >= 0 ? da * db : -1; };
    let [bx, by] = r.best, bv = gain(bx, by), h = 0.2;
    for (let s = 0; s < 60; s++) {
      let moved = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const cx = clamp(bx + dx * h, 0.01, W1 - 0.01), cy = clamp(by + dy * h, 0.01, W2 - 0.01), g = gain(cx, cy); if (g > bv) { bv = g; bx = cx; by = cy; moved = true; } }
      if (!moved) h *= 0.6;
    }
    x = bx; y = by; trail.push([x, y]);
  }
  return trail;
}

/** Utility of A and of B at a box point. */
export const uAat = (FA) => (x, y) => FA.u(x, y);
export const uBat = (FB) => (x, y) => FB.u(W1 - x, W2 - y);

// ------------------------------------------------------------------------------------------------ drawing
/** A stage for the box. */
export function boxStage(v, o = {}) {
  return v.stage({ x: [-1.5, W1 + 1.5], y: [-1.5, W2 + 1.5], equal: true, axes: false, height: o.height ?? 400, minWidth: o.minWidth ?? 300, weight: o.weight ?? 1, title: o.title, full: o.full });
}
/** The frame of the box with the two origins labelled. */
export function drawBox(s, o = {}) {
  s.rect(0, 0, W1, W2, { color: 'ink', width: 2, fill: 'panel', fillAlpha: 0.0 });
  s.tex('O_A', 0, 0, { color: 'accent', dx: -14, dy: 14, size: 15 });
  s.tex('O_B', W1, W2, { color: 'orange', dx: 14, dy: -14, size: 15 });
  if (o.axes !== false) {
    s.text('A: good 1 →', 0, 0, { dx: 0, dy: 16, size: 11.5, color: 'accent', align: 'left', weight: 600 });
    s.text('B: good 2 ↓', W1, 0, { dy: 16, size: 11.5, color: 'orange', align: 'right', weight: 600 });
    s.text('A: good 2 ↑', 0, W2, { dy: -15, size: 11.5, color: 'accent', align: 'left', weight: 600 });
    s.text('← B: good 1', W1, W2, { dy: -15, size: 11.5, color: 'orange', align: 'right', weight: 600 });
  }
}
/** Trader A's indifference curve of level L (clipped to the box). */
export function drawA(s, FA, L, st = {}) { s.clip(() => s.path(levelPts(FA, L), { color: 'accent', width: 2.4, ...st }), [0, W1], [0, W2]); }
/** Trader B's indifference curve of level L, drawn in the box. */
export function drawB(s, FB, L, st = {}) {
  const pts = levelPts(FB, L).map((p) => (p ? toBox(p[0], p[1]) : null));
  s.clip(() => s.path(pts, { color: 'orange', width: 2.4, ...st }), [0, W1], [0, W2]);
}
/** Shade (green) the lens of allocations both traders weakly prefer to (x, y). ua, ub: utilities of the box point. */
export function drawLens(v, s, ua, ub, x, y, key, o = {}) {
  const a0 = ua(x, y), b0 = ub(x, y), g = v.rgb(o.color || 'green'), al = 255 * (o.alpha ?? 0.3);
  s.raster((px, py) => (px >= 0 && px <= W1 && py >= 0 && py <= W2 && ua(px, py) >= a0 - 1e-12 && ub(px, py) >= b0 - 1e-12 ? [g[0], g[1], g[2], al] : null), { key: `${key}|${a0.toFixed(5)}|${b0.toFixed(5)}|${g}`, res: o.res ?? 3 });
}
/** A price line through (x0, y0) of relative price p (slope −p), clipped to the box. */
export function priceLineBox(s, x0, y0, p, st = {}) {
  s.clip(() => s.line(x0 - W1 * 1.5, y0 + p * W1 * 1.5, x0 + W1 * 1.5, y0 - p * W1 * 1.5, { color: 'ink', width: 2, ...st }), [0, W1], [0, W2]);
}
/** Shorter helper: segment of slope −p of half-length `px` pixels. */
export function slopeSeg(s, x, y, m, px, st) {
  const sx = s.X(1) - s.X(0), sy = s.Y(0) - s.Y(1), L = Math.hypot(sx, m * sy) || 1, k = px / L;
  s.line(x - k, y + k * m, x + k, y - k * m, st);
}
/** Closest point of a polyline to (x, y) in pixels → [x, y]. */
export function nearestOnPath(s, pts, x, y) {
  let best = null, bd = Infinity; const px = s.X(x), py = s.Y(y);
  for (let i = 0; i + 1 < pts.length; i++) {
    const ax = s.X(pts[i][0]), ay = s.Y(pts[i][1]), bx = s.X(pts[i + 1][0]), by = s.Y(pts[i + 1][1]);
    const L2 = (bx - ax) ** 2 + (by - ay) ** 2, t = L2 > 0 ? clamp(((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / L2, 0, 1) : 0;
    const d = Math.hypot(ax + t * (bx - ax) - px, ay + t * (by - ay) - py);
    if (d < bd) { bd = d; best = [pts[i][0] + t * (pts[i + 1][0] - pts[i][0]), pts[i][1] + t * (pts[i + 1][1] - pts[i][1])]; }
  }
  return best;
}
/** Polyline length. */
export const pathLength = (pts) => { let L = 0; for (let i = 0; i + 1 < pts.length; i++) L += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); return L; };
/** Round to a given number of decimals, with a real minus sign. */
export const f2 = (x, d = 2) => (x < 0 && Math.abs(x) >= 0.5 * 10 ** -d ? '−' : '') + Math.abs(x).toFixed(d);
/** The argmax helper re-exported under a clearer name for 1-D searches. */
export const maximize = argmax;
