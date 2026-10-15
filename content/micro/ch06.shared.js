// Microeconomics — Chapter 6: helpers shared by ch06.js and ch06-b.js (plain named exports).
// House style of the consumer diagrams (as in chapters 4–5): budget line and set in `accent`, indifference curves in `purple`,
// best bundles in `green`, test bundles in `gold`; substitution effect `orange`, income effect `teal`; good 1 on the
// horizontal axis, good 2 on the vertical. Preference families, ray tracing and drawing helpers are copied from
// ch05.shared.js (a chapter may import only its own shared file); demand and Hicksian demand are solved here by bisection on
// first-order conditions, so finite differences of them are accurate enough to check the Slutsky equation to many digits.

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const GUIDE = { color: 'muted', width: 1, dash: [3, 3] };
export const LBL = { size: 12, weight: 700 };
export const SUP = (n) => String(n).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('');
export const SUB = (n) => String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');
/** Show or hide a whole stage (panel). */
export const showStage = (S, on) => { S.el.hidden = !on; S.el.style.display = on ? '' : 'none'; };
/** Signed number with a real minus sign, e.g. +1.23 / −0.40. */
export const sgn = (x, d = 2) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(d)}`;

/** Root of f on [a, b] by bisection; null when f does not change sign (or is not finite at the ends). */
export function bisect(f, a, b, it = 60) {
  let fa = f(a); const fb = f(b);
  if (!(isFinite(fa) && isFinite(fb))) return null;
  if (fa === 0) return a; if (fb === 0) return b;
  if (fa * fb > 0) return null;
  for (let i = 0; i < it; i++) { const m = (a + b) / 2, fm = f(m); if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; }
  return (a + b) / 2;
}

/** Maximise f on [a, b]: scan n + 1 points, then golden-section search on the bracket of the best one. → {x, f} */
export function argmax(f, a, b, n = 48, it = 56) {
  const h = (b - a) / n; let bi = 0, bv = -Infinity;
  for (let i = 0; i <= n; i++) { const w = f(a + i * h); if (w > bv) { bv = w; bi = i; } }
  let lo = a + Math.max(0, bi - 1) * h, hi = a + Math.min(n, bi + 1) * h;
  const phi = (Math.sqrt(5) - 1) / 2;
  let c = hi - phi * (hi - lo), d = lo + phi * (hi - lo), fc = f(c), fd = f(d);
  for (let k = 0; k < it; k++) { if (fc < fd) { lo = c; c = d; fc = fd; d = lo + phi * (hi - lo); fd = f(d); } else { hi = d; d = c; fd = fc; c = hi - phi * (hi - lo); fc = f(c); } }
  const xm = (lo + hi) / 2, fm = f(xm);
  return fm > bv ? { x: xm, f: fm } : { x: a + bi * h, f: bv };
}

/** Simpson's rule on [a, b] with n (even) panels. */
export function simpson(f, a, b, n = 64) {
  if (a === b) return 0; n += n % 2; const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

/**
 * Preference families. Each returns {u(x, y), grad?(x, y) → [MU1, MU2], ray, smooth?, dem?, hk?}:
 *   ray = u strictly increases along every ray from the origin (level sets are traced exactly by bisection along rays);
 *   smooth = differentiable and strictly quasi-concave, so demand and Hicksian demand are found from first-order conditions;
 *   dem(p1, p2, m) = closed-form Marshallian demand; hk(p1, p2, L) = closed-form Hicksian demand {x, e}.
 */
export function prefs(kind, P = {}) {
  switch (kind) {
    case 'cd': { const a = P.a ?? 0.5; const u = (x, y) => (x <= 0 || y <= 0 ? 0 : x ** a * y ** (1 - a));
      return { u, grad: (x, y) => { const w = u(x, y); return [(a * w) / x, ((1 - a) * w) / y]; }, ray: true, smooth: true, dem: (p1, p2, m) => [(a * m) / p1, ((1 - a) * m) / p2],
        hk: (p1, p2, L) => { const k = (a * p2) / ((1 - a) * p1), x = L * k ** (1 - a), y = L * k ** -a; return { x: [x, y], e: p1 * x + p2 * y }; } }; }
    case 'subs': { const a = P.a ?? 1, b = P.b ?? 1;
      return { u: (x, y) => a * x + b * y, grad: () => [a, b], ray: true,
        dem: (p1, p2, m) => { const d = a / p1 - b / p2; return Math.abs(d) < 1e-12 ? [m / (2 * p1), m / (2 * p2)] : d > 0 ? [m / p1, 0] : [0, m / p2]; },
        hk: (p1, p2, L) => { const x = p1 / a <= p2 / b ? [L / a, 0] : [0, L / b]; return { x, e: p1 * x[0] + p2 * x[1] }; } }; }
    case 'comp': { const a = P.a ?? 1, b = P.b ?? 1;
      return { u: (x, y) => Math.min(a * x, b * y), grad: (x, y) => (a * x < b * y - 1e-12 ? [a, 0] : a * x > b * y + 1e-12 ? [0, b] : [NaN, NaN]), ray: true, kinks: [Math.atan2(a, b)],
        dem: (p1, p2, m) => { const x = m / (p1 + (a * p2) / b); return [x, (a * x) / b]; },
        hk: (p1, p2, L) => ({ x: [L / a, L / b], e: (p1 * L) / a + (p2 * L) / b }) }; }
    case 'ql': { const a = P.a ?? 2;
      return { u: (x, y) => a * Math.log(Math.max(x, 1e-12)) + y, grad: (x) => [a / x, 1], ray: true, smooth: true,
        dem: (p1, p2, m) => (a * p2 <= m ? [(a * p2) / p1, (m - a * p2) / p2] : [m / p1, 0]) }; }
    case 'ces': { const a = P.a ?? 0.5, r = P.r ?? -1;
      if (Math.abs(r) < 1e-3) return prefs('cd', { a });
      const s = 1 / (1 - r);
      const u = (x, y) => (r < 0 && (x <= 0 || y <= 0) ? 0 : (a * Math.max(x, 0) ** r + (1 - a) * Math.max(y, 0) ** r) ** (1 / r));
      return { u, grad: (x, y) => { const w = u(x, y), k = w ** (1 - r); return [a * k * x ** (r - 1), (1 - a) * k * y ** (r - 1)]; }, ray: true, smooth: true,
        dem: (p1, p2, m) => { const w1 = a ** s * p1 ** (1 - s), w2 = (1 - a) ** s * p2 ** (1 - s), s1 = w1 / (w1 + w2); return [(s1 * m) / p1, ((1 - s1) * m) / p2]; },
        hk: (p1, p2, L) => { const w1 = a ** s * p1 ** (1 - s), w2 = (1 - a) ** s * p2 ** (1 - s), e = L * (w1 + w2) ** (1 / (1 - s)), s1 = w1 / (w1 + w2); return { x: [(s1 * e) / p1, ((1 - s1) * e) / p2], e }; } }; }
    case 'inf': { // good 1 inferior: the indifference curve of level c is x2 = c − K(c) ln(1 + x1), K(c) = A k/(k + c), flatter for larger c
      const A = P.A ?? 5, k = P.k ?? 8;
      const u = (x, y) => { const L = Math.log(1 + Math.max(x, 0)), z = Math.max(y, 0); return (-(k - z) + Math.sqrt((k - z) ** 2 + 4 * k * (z + A * L))) / 2; };
      return { u, ray: true, smooth: true, grad: (x, y) => { const c = u(x, y), K = (A * k) / (k + c), Gc = 1 + (A * k * Math.log(1 + x)) / (k + c) ** 2; return [K / (1 + x) / Gc, 1 / Gc]; } }; }
    case 'ie': { // u = a ln x1 + (x2^(1−η) − 1)/(1 − η): η = 0 quasilinear (no income effect on good 1), η = 1 Cobb–Douglas
      const a = P.a ?? 2, eta = P.eta ?? 0.5, one = Math.abs(1 - eta) < 1e-9;
      const g2 = (y) => (one ? Math.log(y) : (Math.max(y, 0) ** (1 - eta) - 1) / (1 - eta));
      return { u: (x, y) => a * Math.log(Math.max(x, 1e-300)) + g2(Math.max(y, 1e-300)), grad: (x, y) => [a / x, Math.max(y, 1e-300) ** -eta], ray: true, smooth: true, eta, a }; }
    case 'giffen': { // subsistence: soft minimum of a calorie index S(x1 + x2 − C) and a taste index A ln(1 + x2) + b ln(1 + x1)
      const C = P.C ?? 8, S = P.S ?? 3, kap = P.kap ?? 1, A = P.A ?? 2, b = P.b ?? 0.3;
      const parts = (x, y) => [S * (x + y - C), A * Math.log(1 + Math.max(y, 0)) + b * Math.log(1 + Math.max(x, 0))];
      const u = (x, y) => { const [F, G] = parts(x, y), m = Math.min(F, G); return m - Math.log(Math.exp(-kap * (F - m)) + Math.exp(-kap * (G - m))) / kap; };
      const grad = (x, y) => { const [F, G] = parts(x, y), m = Math.min(F, G), wf = Math.exp(-kap * (F - m)), wg = Math.exp(-kap * (G - m)), W = wf + wg; return [(wf * S + (wg * b) / (1 + x)) / W, (wf * S + (wg * A) / (1 + y)) / W]; };
      return { u, grad, ray: true, smooth: true, C, calWeight: (x, y) => { const [F, G] = parts(x, y), m = Math.min(F, G), wf = Math.exp(-kap * (F - m)), wg = Math.exp(-kap * (G - m)); return wf / (wf + wg); } }; }
    default: throw new Error('unknown preference family ' + kind);
  }
}

/** Radius at which u = L along the ray of angle th (u increasing along rays); null if not reached within rmax. */
export function rayLevel(u, L, th, rmax, it = 56) {
  const c = Math.cos(th), s = Math.sin(th);
  return bisect((r) => u(r * c, r * s) - L, 1e-9, rmax, it);
}

/**
 * Marshallian demand on the budget line p1 x1 + p2 x2 = m: closed form when the family has one; for smooth families the
 * point where the slope of u along the line, MU1·m/p1 − MU2·m/p2, changes sign (bisection, corners included); else a scan.
 */
export function demand(F, p1, p2, m) {
  if (F.dem) { const d = F.dem(p1, p2, m); if (d) return d; }
  const X = m / p1, Y = m / p2;
  if (F.smooth && F.grad) {
    const d = (t) => { const g = F.grad(t * X, (1 - t) * Y); return g[0] * X - g[1] * Y; };
    const lo = 1e-13, hi = 1 - 1e-13;
    if (!(d(lo) > 0)) return [0, Y];
    if (!(d(hi) < 0)) return [X, 0];
    const t = bisect(d, lo, hi, 64);
    return [t * X, (1 - t) * Y];
  }
  const r = argmax((t) => F.u(t * X, (1 - t) * Y), 0, 1, 64);
  return [r.x * X, (1 - r.x) * Y];
}
export const indirect = (F, p1, p2, m) => F.u(...demand(F, p1, p2, m));

/**
 * Expenditure minimisation: the cheapest point of the level set u = L. Closed form when available; for smooth families the
 * point of the level set where MRS = p1/p2 (bisection over the ray angle; the MRS rises from the x1 axis to the x2 axis);
 * otherwise a golden-section search over the ray angle. → {x: [h1, h2], e} or null.
 */
export function hicks(F, p1, p2, L, rmax = 800) {
  if (F.hk) return F.hk(p1, p2, L);
  const pt = (th) => { const r = rayLevel(F.u, L, th, rmax, 60); return r == null ? null : [r * Math.cos(th), r * Math.sin(th)]; };
  if (F.smooth && F.grad) {
    const k = p1 / p2, lo = 1e-7, hi = Math.PI / 2 - 1e-7;
    const d = (th) => { const q = pt(th); if (!q) return th < Math.PI / 4 ? -1 : 1; const g = F.grad(q[0], q[1]); return g[0] / g[1] - k; };
    let th;
    if (d(lo) >= 0) th = lo; else if (d(hi) <= 0) th = hi; else th = bisect(d, lo, hi, 62);
    const q = pt(th); if (!q) return null;
    return { x: q, e: p1 * q[0] + p2 * q[1] };
  }
  const cost = (th) => { const q = pt(th); return q ? p1 * q[0] + p2 * q[1] : Infinity; };
  const r = argmax((th) => -cost(th), 0, Math.PI / 2, 90);
  let th = r.x;
  if (F.kinks) for (const kk of F.kinks) if (cost(kk) <= -r.f + 1e-12) th = kk;
  const q = pt(th); if (!q) return null;
  return { x: q, e: p1 * q[0] + p2 * q[1] };
}

/**
 * The Slutsky decomposition at (p1, p2, m) by central differences of step h: dx = ∂x1/∂p1, dh = ∂h1/∂p1 (at the utility
 * reached), dm = ∂x1/∂m and the income term inc = −x1 ∂x1/∂m. The identity dx = dh + inc is then checked, not assumed.
 */
export function slutsky(F, p1, p2, m, h = 1e-4) {
  const x = demand(F, p1, p2, m), L = F.u(...x);
  const dx = (demand(F, p1 + h, p2, m)[0] - demand(F, p1 - h, p2, m)[0]) / (2 * h);
  const hp = hicks(F, p1 + h, p2, L), hm = hicks(F, p1 - h, p2, L);
  const dh = (hp.x[0] - hm.x[0]) / (2 * h);
  const dm = (demand(F, p1, p2, m + h)[0] - demand(F, p1, p2, m - h)[0]) / (2 * h);
  return { x, L, dx, dh, dm, inc: -x[0] * dm };
}

/** Points of the level set u = L in the quadrant, traced ray by ray (kink angles included exactly); null breaks the path. */
export function icurve(F, L, X, Y, n = 220) {
  const R = 4 * Math.hypot(X, Y), ths = [];
  for (let i = 0; i <= n; i++) ths.push((Math.PI / 2) * (i / n));
  if (F.kinks) for (const k of F.kinks) ths.push(k);
  ths.sort((a, b) => a - b);
  const pts = [];
  for (const th of ths) { const r = rayLevel(F.u, L, th, R, 48); pts.push(r == null ? null : [r * Math.cos(th), r * Math.sin(th)]); }
  return pts;
}
/** Draw the indifference curve u = L on stage s (exact ray tracing). */
export function drawLevel(s, F, L, st = {}) {
  const X = s.bounds.x[1], Y = s.bounds.y[1];
  s.clip(() => s.path(icurve(F, L, X, Y, st.n), st));
  return s;
}
/** Arrow between two points, trimmed in pixels at both ends so it clears the dots. Returns false when too short to draw. */
export function trimArrow(s, a, b, st, t0 = 9, t1 = 10) {
  const X1 = s.X(a[0]), Y1 = s.Y(a[1]), X2 = s.X(b[0]), Y2 = s.Y(b[1]), L = Math.hypot(X2 - X1, Y2 - Y1);
  if (L < t0 + t1 + 4) return false;
  const ux = (X2 - X1) / L, uy = (Y2 - Y1) / L, [x1, y1] = s.inv(X1 + ux * t0, Y1 + uy * t0), [x2, y2] = s.inv(X2 - ux * t1, Y2 - uy * t1);
  s.arrow(x1, y1, x2, y2, st); return true;
}
/** Budget set (shaded) and budget line p1 x1 + p2 x2 = m. */
export function budget(s, p1, p2, m, st = {}) {
  const X1 = m / p1, X2 = m / p2;
  s.clip(() => {
    if (st.fill !== false) s.poly([[0, 0], [X1, 0], [0, X2]], { fill: st.color || 'accent', fillAlpha: st.fillAlpha ?? 0.1, stroke: false });
    s.line(X1, 0, 0, X2, { color: st.color || 'accent', width: st.width ?? 2.8, dash: st.dash, alpha: st.alpha });
  });
}
/** Just the line p1 x1 + p2 x2 = m, clipped to the window. */
export function bline(s, p1, p2, m, st = {}) { s.clip(() => s.line(m / p1, 0, 0, m / p2, { width: 2, ...st })); }
/** Closest point of the segment AB to (x, y), measured in pixels (so it works on unequal axes). → [x, y, t] */
export function nearestOnSegment(s, A, B, x, y) {
  const ax = s.X(A[0]), ay = s.Y(A[1]), bx = s.X(B[0]), by = s.Y(B[1]), px = s.X(x), py = s.Y(y);
  const L2 = (bx - ax) ** 2 + (by - ay) ** 2, t = L2 > 0 ? clamp(((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / L2, 0, 1) : 0;
  return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, t];
}
/** Text label on a plate at a data point. */
export function plateText(s, str, x, y, st = {}) { s.text(str, x, y, { plate: true, size: 11.5, weight: 600, ...st }); }

// ------------------------------------------------------------------------------------------------ revealed preference

/** Cost of bundle s at the prices of observation t. obs = [{x: [x1, x2], p: [p1, p2]}]. */
export const costAt = (obs, t, s) => obs[t].p[0] * obs[s].x[0] + obs[t].p[1] * obs[s].x[1];

/**
 * Revealed-preference analysis of a finite data set (Varian 1982), with Afriat's efficiency e ≤ 1 deflating every budget.
 * R[t][s]: x^t directly revealed preferred to x^s (e·p^t·x^t ≥ p^t·x^s); P[t][s]: strictly (>); Rs = transitive closure of R
 * (Warshall). GARP fails at (t, s) when x^t R* x^s and x^s P x^t. warp lists Samuelson-WARP violations (distinct bundles each
 * directly revealed preferred to the other). cycle = a shortest violating cycle as a list of observation indices.
 */
export function rpAnalyze(obs, e = 1) {
  const T = obs.length, tol = 1e-9;
  const R = [], P = [];
  for (let t = 0; t < T; t++) { R.push([]); P.push([]); const own = e * costAt(obs, t, t); for (let s = 0; s < T; s++) { const c = costAt(obs, t, s); R[t][s] = t !== s && own >= c - tol; P[t][s] = t !== s && own > c + tol; } }
  const Rs = R.map((r) => r.slice());
  for (let k = 0; k < T; k++) for (let i = 0; i < T; i++) if (Rs[i][k]) for (let j = 0; j < T; j++) if (Rs[k][j]) Rs[i][j] = true;
  const viol = [];
  for (let t = 0; t < T; t++) for (let s = 0; s < T; s++) if (t !== s && (Rs[t][s] || false) && P[s][t]) viol.push([t, s]);
  const warp = [];
  for (let t = 0; t < T; t++) for (let s = t + 1; s < T; s++) { const same = Math.hypot(obs[t].x[0] - obs[s].x[0], obs[t].x[1] - obs[s].x[1]) < 1e-9; if (!same && R[t][s] && R[s][t]) warp.push([t, s]); }
  // shortest violating cycle: a shortest R-path t → … → s, closed by the strict edge s → t
  let cycle = null;
  for (const [t, s] of viol) {
    const prev = Array(T).fill(-1), seen = Array(T).fill(false), q = [t]; seen[t] = true;
    while (q.length) { const a = q.shift(); for (let b = 0; b < T; b++) if (R[a][b] && !seen[b]) { seen[b] = true; prev[b] = a; q.push(b); } }
    if (!seen[s]) continue;
    const path = []; for (let c = s; c !== -1; c = prev[c]) path.unshift(c);
    if (!cycle || path.length < cycle.length) cycle = path;
  }
  return { T, R, P, Rs, viol, warp, garp: viol.length === 0, cycle };
}

/**
 * Afriat numbers by the recursive construction in the proof of Afriat's theorem (in the form of Quah 2014 / Chambers–Echenique):
 * observations are ranked by the length of the longest chain of strictly revealed-preferred observations above them, then
 * u_i = min({u_j + λ_j p^j·(x^k − x^j) : rank j < rank i = rank k} ∪ {0}) and λ_i = max({(u_j − u_i)/p^i·(x^j − x^i) : rank j < rank i} ∪ {1}).
 * Requires GARP (pass the analysis A). Returns {u, lam, rank} or null.
 */
export function afriat(obs, A) {
  if (!A.garp) return null;
  const T = obs.length, RS = A.Rs.map((r, i) => r.map((v, j) => v && !A.Rs[j][i]));
  const rank = Array(T).fill(0);
  const rk = (t) => { if (rank[t]) return rank[t]; let best = 0; for (let s = 0; s < T; s++) if (RS[s][t]) best = Math.max(best, rk(s)); return (rank[t] = best + 1); }; // RS is acyclic under GARP
  for (let t = 0; t < T; t++) rk(t);
  const order = [...Array(T).keys()].sort((a, b) => rank[a] - rank[b]), u = Array(T).fill(0), lam = Array(T).fill(1);
  const levels = [...new Set(order.map((t) => rank[t]))];
  for (const L of levels) {
    const here = order.filter((t) => rank[t] === L), below = order.filter((t) => rank[t] < L);
    let ul = 0;
    for (const j of below) for (const k of here) ul = Math.min(ul, u[j] + lam[j] * (costAt(obs, j, k) - costAt(obs, j, j)));
    for (const i of here) u[i] = ul;
    for (const i of here) { let l = 1; for (const j of below) { const d = costAt(obs, i, j) - costAt(obs, i, i); if (d > 1e-12) l = Math.max(l, (u[j] - u[i]) / d); } lam[i] = l; }
  }
  return { u, lam, rank };
}
/** Smallest slack of Afriat's inequalities u_s ≤ u_t + λ_t p^t·(x^s − x^t) (≥ 0 when they all hold). */
export function afriatSlack(obs, sol) {
  let mn = Infinity; const T = obs.length;
  for (let s = 0; s < T; s++) for (let t = 0; t < T; t++) if (s !== t) mn = Math.min(mn, sol.u[t] + sol.lam[t] * (costAt(obs, t, s) - costAt(obs, t, t)) - sol.u[s]);
  return mn;
}
/** Afriat's utility U(x) = min_t u_t + λ_t p^t·(x − x^t). */
export const afriatU = (obs, sol) => (x, y) => { let m = Infinity; obs.forEach((o, t) => { m = Math.min(m, sol.u[t] + sol.lam[t] * (o.p[0] * (x - o.x[0]) + o.p[1] * (y - o.x[1]))); }); return m; };
/**
 * The level set {U = c} of a piecewise-linear concave U = min_t (a_t + b_t·x), drawn exactly: clip the box [0, X] × [0, Y] by the
 * half-planes a_t + b_t·x ≥ c (Sutherland–Hodgman) and keep the polygon edges that do not lie on the box. → list of segments.
 */
export function plLevel(planes, c, X, Y) {
  let poly = [[0, 0], [X, 0], [X, Y], [0, Y]];
  for (const { a, b } of planes) {
    const f = (q) => a + b[0] * q[0] + b[1] * q[1] - c, out = [];
    for (let i = 0; i < poly.length; i++) {
      const P = poly[i], Q = poly[(i + 1) % poly.length], fp = f(P), fq = f(Q);
      if (fp >= 0) out.push(P);
      if ((fp >= 0) !== (fq >= 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
    }
    poly = out; if (poly.length < 3) return [];
  }
  const onBox = (q) => Math.abs(q[0]) < 1e-9 || Math.abs(q[1]) < 1e-9 || Math.abs(q[0] - X) < 1e-9 || Math.abs(q[1] - Y) < 1e-9;
  const sameEdge = (P, Q) => (Math.abs(P[0]) < 1e-9 && Math.abs(Q[0]) < 1e-9) || (Math.abs(P[1]) < 1e-9 && Math.abs(Q[1]) < 1e-9) || (Math.abs(P[0] - X) < 1e-9 && Math.abs(Q[0] - X) < 1e-9) || (Math.abs(P[1] - Y) < 1e-9 && Math.abs(Q[1] - Y) < 1e-9);
  const segs = [];
  for (let i = 0; i < poly.length; i++) { const P = poly[i], Q = poly[(i + 1) % poly.length]; if (!(onBox(P) && onBox(Q) && sameEdge(P, Q))) segs.push([P, Q]); }
  return segs;
}
/** Planes of Afriat's utility for plLevel. */
export const afriatPlanes = (obs, sol) => obs.map((o, t) => ({ a: sol.u[t] - sol.lam[t] * (o.p[0] * o.x[0] + o.p[1] * o.x[1]), b: [sol.lam[t] * o.p[0], sol.lam[t] * o.p[1]] }));
/** Afriat's critical cost efficiency index: the largest e ≤ 1 at which the deflated data satisfy GARP (bisection). */
export function ccei(obs) {
  if (rpAnalyze(obs, 1).garp) return 1;
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (rpAnalyze(obs, m).garp) lo = m; else hi = m; }
  return lo;
}

/**
 * Draggable observations for revealed-preference pictures: each has a bundle handle and a knob that orbits it at a fixed
 * radius and sets the slope of the budget line through the bundle (prices normalised to p2 = 1). n is the maximum number;
 * the first init.length are shown. → {list(), count, setCount(k), load(init), handles}
 */
export function obsEditor(v, s, init, { n = 6, colors, R = 1.5, box = [11.6, 11.6], onTouch } = {}) {
  const st = Array.from({ length: n }, (_, i) => ({ x: init[i]?.x?.slice() ?? [2 + i, 6 - 0.6 * i], k: init[i]?.k ?? 1 }));
  let count = init.length;
  const B = [], K = [];
  const knobAt = (i) => { const { x, k } = st[i], d = Math.hypot(1, k); return [x[0] + (R * 1) / d, x[1] - (R * k) / d]; };
  for (let i = 0; i < n; i++) {
    B.push(s.handle(st[i].x[0], st[i].x[1], { color: colors[i], r: 7, label: `x${SUP(i + 1)}`, labelPos: 'nw', constrain: (x, y) => { st[i].x = [clamp(x, 0.3, box[0]), clamp(y, 0.3, box[1])]; return st[i].x; } }));
  }
  for (let i = 0; i < n; i++) {
    const q = knobAt(i);
    K.push(s.handle(q[0], q[1], { color: colors[i], r: 5, constrain: (x, y) => { const dx = x - st[i].x[0], dy = y - st[i].x[1]; const ang = clamp(Math.atan2(-dy, dx), 0.06, 1.48); st[i].k = Math.tan(ang); return knobAt(i); } }));
  }
  if (onTouch) for (let i = 0; i < n; i++) { B[i].onDrag = () => onTouch(i); K[i].onDrag = () => onTouch(i); }
  const sync = () => { for (let i = 0; i < n; i++) { const on = i < count; B[i].visible = on; K[i].visible = on; B[i].x = st[i].x[0]; B[i].y = st[i].x[1]; const q = knobAt(i); K[i].x = q[0]; K[i].y = q[1]; } };
  sync();
  return {
    get count() { return count; },
    setCount(c) { count = clamp(c, 1, n); sync(); },
    load(arr) { arr.forEach((o, i) => { st[i].x = o.x.slice(); st[i].k = o.k; }); count = arr.length; sync(); },
    list() { sync(); return st.slice(0, count).map((o) => ({ x: o.x.slice(), p: [o.k, 1], k: o.k })); },
    sync,
  };
}
/** Draw one observation: its budget triangle (shaded), budget line and chosen bundle. */
export function drawObs(s, o, col, st = {}) {
  const m = o.p[0] * o.x[0] + o.p[1] * o.x[1], X1 = m / o.p[0], X2 = m / o.p[1];
  s.clip(() => {
    if (st.fill !== false) s.poly([[0, 0], [X1, 0], [0, X2]], { fill: col, fillAlpha: st.fillAlpha ?? 0.07, stroke: false, hatch: st.hatch, hatchAlpha: st.hatchAlpha });
    s.line(X1, 0, 0, X2, { color: col, width: st.width ?? 2, alpha: st.alpha ?? 0.95, dash: st.dash });
  });
}
