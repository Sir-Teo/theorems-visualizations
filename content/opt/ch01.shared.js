// Optimization — Chapter 1: helpers shared by ch01.js and ch01-b.js (plain named exports).
//
// House style for this collection: a contour map of an objective f(x, y) that the reader can retype (a formula field
// with ready-made examples), a draggable point carrying the local data (gradient, Hessian eigen-directions, constraint
// gradients), and a numerical check drawn or read out beside every analytic statement: stationary points found by
// Newton's method are classified by the Hessian and compared with brute-force sampling, constrained optima are found
// by grid refinement and compared with the multiplier condition.

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const hypot = Math.hypot;

/** Central-difference gradient of f(x, y). */
export function gradNum(f, x, y, h = 1e-5) {
  return [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)];
}
/** Central-difference Hessian of f(x, y) as [[a, b], [b, d]]. */
export function hessNum(f, x, y, h = 1e-3) {
  const f0 = f(x, y);
  const a = (f(x + h, y) - 2 * f0 + f(x - h, y)) / (h * h);
  const d = (f(x, y + h) - 2 * f0 + f(x, y - h)) / (h * h);
  const b = (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h);
  return [[a, b], [b, d]];
}
/** Eigen-decomposition of a symmetric 2×2 matrix: values l1 ≤ l2 with unit eigenvectors v1, v2. */
export function eig2([[a, b], [, d]]) {
  const m = (a + d) / 2, r = Math.hypot((a - d) / 2, b), l1 = m - r, l2 = m + r;
  let v1, v2;
  if (r < 1e-14) { v1 = [1, 0]; v2 = [0, 1]; }
  else {
    const th = 0.5 * Math.atan2(2 * b, a - d); // direction of the larger eigenvalue
    v2 = [Math.cos(th), Math.sin(th)]; v1 = [-v2[1], v2[0]];
  }
  return { l1, l2, v1, v2 };
}
/** Classify a stationary point by its Hessian eigenvalues (relative tolerance tol). */
export function classify(H, tol = 1e-5) {
  const { l1, l2 } = eig2(H), s = Math.max(1, Math.abs(l1), Math.abs(l2)) * tol;
  if (l1 > s) return 'min';
  if (l2 < -s) return 'max';
  if (l1 < -s && l2 > s) return 'saddle';
  return 'flat';
}
export const CLS = {
  min: { name: 'strict local minimum', short: 'minimum', color: 'green' },
  max: { name: 'strict local maximum', short: 'maximum', color: 'red' },
  saddle: { name: 'saddle point', short: 'saddle', color: 'purple' },
  flat: { name: 'degenerate (Hessian singular)', short: 'degenerate', color: 'orange' },
};

/** Newton's method on ∇f = 0 with a safeguard (a few gradient steps if the Hessian is singular). Returns [x, y] or null. */
export function newtonStat(f, x, y, iters = 40) {
  for (let k = 0; k < iters; k++) {
    const g = gradNum(f, x, y), H = hessNum(f, x, y), det = H[0][0] * H[1][1] - H[0][1] * H[1][0];
    if (Math.hypot(g[0], g[1]) < 1e-9) return [x, y];
    let dx, dy;
    if (Math.abs(det) < 1e-12) { dx = -0.1 * g[0]; dy = -0.1 * g[1]; }
    else { dx = -(H[1][1] * g[0] - H[0][1] * g[1]) / det; dy = -(-H[1][0] * g[0] + H[0][0] * g[1]) / det; }
    const st = Math.hypot(dx, dy); if (st > 1) { dx /= st; dy /= st; }
    x += dx; y += dy;
    if (!Number.isFinite(x + y)) return null;
  }
  const g = gradNum(f, x, y); return Math.hypot(g[0], g[1]) < 1e-6 ? [x, y] : null;
}

/** All stationary points in a window: seeds at local minima of |∇f| on a grid, refined by Newton, deduplicated. */
export function stationaryPoints(f, [x0, x1], [y0, y1], n = 40) {
  const G = [], dx = (x1 - x0) / n, dy = (y1 - y0) / n;
  for (let j = 0; j <= n; j++) { G.push([]); for (let i = 0; i <= n; i++) { const g = gradNum(f, x0 + i * dx, y0 + j * dy, 1e-4); G[j].push(g[0] * g[0] + g[1] * g[1]); } }
  const seeds = [];
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const v = G[j][i]; if (!Number.isFinite(v)) continue;
    let ok = true;
    for (let dj = -1; dj <= 1 && ok; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const jj = j + dj, ii = i + di;
      if (jj < 0 || ii < 0 || jj > n || ii > n) continue;
      if (G[jj][ii] < v) { ok = false; break; }
    }
    if (ok) seeds.push([v, x0 + i * dx, y0 + j * dy]);
  }
  seeds.sort((a, b) => a[0] - b[0]);
  const out = [], mx = 0.15 * (x1 - x0), my = 0.15 * (y1 - y0);
  for (const [, sx, sy] of seeds.slice(0, 80)) {
    const r = newtonStat(f, sx, sy); if (!r) continue;
    const [x, y] = r;
    if (x < x0 - mx || x > x1 + mx || y < y0 - my || y > y1 + my) continue;
    if (out.some((p) => Math.hypot(p.x - x, p.y - y) < 2e-3 * Math.max(1, x1 - x0))) continue;
    const H = hessNum(f, x, y);
    out.push({ x, y, f: f(x, y), H, eig: eig2(H), cls: classify(H) });
  }
  return out;
}

/** Gradient descent with Armijo backtracking from (x, y); stops at a stationary point or when leaving [-R, R]². */
export function descend(f, x, y, { maxIt = 600, R = 1e3, keep = false } = {}) {
  const path = keep ? [[x, y]] : null; let fx = f(x, y), t = 0.1, it = 0;
  for (; it < maxIt; it++) {
    const g = gradNum(f, x, y, 1e-6), gn = Math.hypot(g[0], g[1]);
    if (!(gn > 1e-7) || !Number.isFinite(fx)) break;
    t = Math.min(t * 2, 1);
    let ok = false;
    for (let k = 0; k < 40; k++) {
      const nx = x - t * g[0], ny = y - t * g[1], fn = f(nx, ny);
      if (fn <= fx - 1e-4 * t * gn * gn) { x = nx; y = ny; fx = fn; ok = true; break; }
      t *= 0.5;
    }
    if (!ok || Math.abs(x) > R || Math.abs(y) > R) break;
    if (keep) path.push([x, y]);
  }
  return { x, y, f: fx, it, path };
}

/** Colour scale for a landscape on a window: returns {lo, scale, t(v) ∈ [0, 1), level(k, K)} so that contours are evenly spaced in t. */
export function landScale(f, [x0, x1], [y0, y1]) {
  const vals = [], n = 36;
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const v = f(x0 + (i / n) * (x1 - x0), y0 + (j / n) * (y1 - y0)); if (Number.isFinite(v)) vals.push(v); }
  if (!vals.length) return { lo: 0, scale: 1, t: () => 0, level: () => 0 };
  vals.sort((a, b) => a - b);
  const lo = vals[0], q = vals[Math.floor(0.55 * (vals.length - 1))], scale = Math.max(1e-9, q - lo) / 1.2;
  return { lo, scale, t: (v) => 1 - Math.exp(-(v - lo) / scale), level: (k, K) => lo - scale * Math.log(1 - (k / K) * 0.93) };
}

/** Draw the heat map and contours of f on stage s. `key` must change whenever f or the window changes. */
export function drawLand(s, f, view, key, { levels = 14, alpha = 0.9, contourAlpha = 0.5 } = {}) {
  const sc = landScale(f, view.x, view.y);
  s.heat((x, y) => sc.t(f(x, y)), { range: [0, 1], cmap: 'theme', color: 'accent', res: 3, key: 'L|' + key, alpha });
  const L = []; for (let k = 1; k <= levels; k++) L.push(sc.level(k, levels));
  s.contour(f, L, { color: 'ink', alpha: contourAlpha, width: 1, res: 110 });
  return sc;
}

/**
 * Typed-objective controls: a text field v.input('f(x,y)') and a row of ready-made examples that fill it.
 * Returns {f, view, cur, inp, sel, key}. presets: [{key, label, src, view: {x:[..], y:[..]}, note?}].
 */
export function landscape(v, presets, def, { onChange, width = 340, label = '$f(x,y)=$' } = {}) {
  let cur = presets.find((p) => p.key === def) || presets[0];
  const inp = v.input(label, cur.src, { vars: ['x', 'y'], width, onChange: () => onChange && onChange(cur) });
  const sel = v.select('example', presets.map((p) => ({ value: p.key, label: p.label })), cur.key, {
    onChange: (k) => { cur = presets.find((p) => p.key === k); inp.set(cur.src); onChange && onChange(cur); },
  });
  const L = {
    inp, sel,
    f: (x, y) => { const g = inp.fn; return g ? g(x, y) : NaN; },
    get view() { return cur.view; },
    get cur() { return cur; },
    get key() { return cur.key + '|' + inp.value; },
  };
  return L;
}

/** Example objectives (formula strings are parsed by the runtime, so they use x, y, ^, sin, exp …). */
export const EX = {
  himmel: { key: 'himmel', label: 'Himmelblau', src: '(x^2+y-11)^2+(x+y^2-7)^2', view: { x: [-5.2, 5.2], y: [-5.2, 5.2] } },
  egg: { key: 'egg', label: 'egg crate', src: 'sin(x)*cos(y)+0.07*(x^2+y^2)', view: { x: [-5, 5], y: [-5, 5] } },
  bowl: { key: 'bowl', label: 'tilted bowl', src: '(x-1)^2+2*(y+0.5)^2+0.8*x*y', view: { x: [-3, 4], y: [-3.5, 3] } },
  cubic: { key: 'cubic', label: 'min + saddle', src: 'x^3/3-x+y^2', view: { x: [-2.8, 2.8], y: [-2.2, 2.2] } },
  saddle: { key: 'saddle', label: 'saddle', src: 'x^2-y^2', view: { x: [-2.5, 2.5], y: [-2, 2] } },
  peak: { key: 'peak', label: 'hill', src: '1-x^2-2*y^2+0.2*x*y', view: { x: [-2.5, 2.5], y: [-2, 2] } },
  rosen: { key: 'rosen', label: 'Rosenbrock', src: '(1-x)^2+100*(y-x^2)^2', view: { x: [-2, 2], y: [-1, 3] } },
  quart1: { key: 'quart1', label: '$x^2+y^4$', src: 'x^2+y^4', view: { x: [-1.5, 1.5], y: [-1.2, 1.2] } },
  quart2: { key: 'quart2', label: '$x^2-y^4$', src: 'x^2-y^4', view: { x: [-1.5, 1.5], y: [-1.2, 1.2] } },
  quart3: { key: 'quart3', label: '$x^4+y^4$', src: 'x^4+y^4', view: { x: [-1.5, 1.5], y: [-1.2, 1.2] } },
};

/** Format a number with a real minus sign. */
export const fx = (v, x, d = 3) => (Number.isFinite(x) ? v.fix(x, d) : '—');
/** Format a 2-vector. */
export const fv = (v, a, d = 2) => `(${fx(v, a[0], d)}, ${fx(v, a[1], d)})`;

/** Sutherland–Hodgman: clip a convex polygon (list of [x, y]) to the half-plane a·x + b·y ≤ c. */
export function clipHalf(poly, a, b, c) {
  const out = [], n = poly.length;
  for (let i = 0; i < n; i++) {
    const P = poly[i], Q = poly[(i + 1) % n], dp = a * P[0] + b * P[1] - c, dq = a * Q[0] + b * Q[1] - c;
    if (dp <= 0) out.push(P);
    if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) { const t = dp / (dp - dq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
