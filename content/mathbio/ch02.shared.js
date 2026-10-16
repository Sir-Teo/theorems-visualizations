// Mathematical Biology, chapter 2 — helpers shared by ch02.js and ch02-b.js (plain functions only).
export * from './ch01.shared.js';

/** One-hump and other 1-D maps used in the chapter: f(p, x), derivative df, critical point, positive fixed point, plot window. */
export const MAPS = {
  logistic: { name: 'logistic', tex: 'x\\mapsto rx(1-x)', par: 'r', f: (r, x) => r * x * (1 - x), df: (r, x) => r * (1 - 2 * x), crit: () => 0.5, fixed: (r) => (r > 1 ? 1 - 1 / r : 0), xmax: () => 1, ymax: (r) => Math.max(1, r / 4) },
  ricker: { name: 'Ricker', tex: 'x\\mapsto x\\,e^{r(1-x)}', par: 'r', f: (r, x) => x * Math.exp(r * (1 - x)), df: (r, x) => Math.exp(r * (1 - x)) * (1 - r * x), crit: (r) => 1 / r, fixed: () => 1, xmax: (r) => Math.max(2.2, Math.exp(r - 1) / r * 1.05), ymax: (r) => Math.max(1.5, Math.exp(r - 1) / r * 1.05) },
  sine: { name: 'sine', tex: 'x\\mapsto a\\sin\\pi x', par: 'a', f: (a, x) => a * Math.sin(Math.PI * x), df: (a, x) => a * Math.PI * Math.cos(Math.PI * x), crit: () => 0.5, fixed: (a) => { const g = (x) => a * Math.sin(Math.PI * x) - x; let lo = 0.02, hi = 1; if (g(lo) <= 0) return 0; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (g(m) > 0) lo = m; else hi = m; } return (lo + hi) / 2; }, xmax: () => 1, ymax: () => 1 },
  tent: { name: 'tent', tex: 'x\\mapsto \\mu\\min(x,1-x)', par: '\\mu', f: (m, x) => m * Math.min(x, 1 - x), df: (m, x) => (x < 0.5 ? m : -m), crit: () => 0.5, fixed: (m) => (m > 1 ? m / (1 + m) : 0), xmax: () => 1, ymax: (m) => Math.max(1, m / 2) },
};

/** x_0, x_1, …, x_n of x -> g(x). */
export function orbitOf(g, x0, n) { const out = [x0]; let x = x0; for (let i = 0; i < n; i++) { x = g(x); out.push(x); } return out; }

/** Cobweb polyline (x_0,0) -> (x_0,f x_0) -> (f x_0, f x_0) -> … for n steps. */
export function cobwebPts(g, x0, n) {
  const pts = [[x0, 0]]; let x = x0;
  for (let i = 0; i < n; i++) { const y = g(x); pts.push([x, y], [y, y]); x = y; if (!isFinite(x) || Math.abs(x) > 1e6) break; }
  return pts;
}

/** Period (≤ pmax) of the attractor reached from x0 after a transient, or 0 if none is found (chaotic or longer than pmax). */
export function periodOf(g, x0, pmax = 64, transient = 6000, tol = 1e-7) {
  let x = x0; for (let i = 0; i < transient; i++) x = g(x);
  const xs = x; for (let p = 1; p <= pmax; p++) { x = g(x); if (Math.abs(x - xs) < tol) return p; }
  return 0;
}

/** Lyapunov exponent of the orbit of x0: the mean of ln|f'(x_t)|. */
export function lyapunovOf(g, dg, x0, n = 4000, transient = 400) {
  let x = x0, s = 0; for (let i = 0; i < transient; i++) x = g(x);
  for (let i = 0; i < n; i++) { s += Math.log(Math.abs(dg(x)) + 1e-300); x = g(x); }
  return s / n;
}

/** Parameters r_1 < r_2 < … at which the 2^(n-1)-cycle of the logistic map loses stability (multiplier −1): r_1 = 3, r_2 = 1+√6
 *  exactly, the rest by Newton's method on (x, r) for F^p(x) = x, (F^p)'(x) = −1. */
export function logisticDoublings(nMax = 8) {
  const f = (r, x) => r * x * (1 - x), df = (r, x) => r * (1 - 2 * x);
  const R = [0, 3, 1 + Math.sqrt(6)];
  for (let n = 3; n <= nMax; n++) {
    const p = 2 ** (n - 1);
    const g = (r, x) => { let m = 1; for (let i = 0; i < p; i++) { m *= df(r, x); x = f(r, x); } return [x, m]; };
    let r = R[n - 1] + (R[n - 1] - R[n - 2]) / 4.669, x = 0.5;
    for (let i = 0; i < 20000; i++) x = f(r - 0.005 * 4 ** -n, x);
    for (let it = 0; it < 60; it++) {
      const G = (rr, xx) => { const [y, m] = g(rr, xx); return [y - xx, m + 1]; };
      const h = 1e-7, a = G(r, x), dx = G(r, x + h), dr = G(r + h, x);
      const J = [[(dx[0] - a[0]) / h, (dr[0] - a[0]) / h], [(dx[1] - a[1]) / h, (dr[1] - a[1]) / h]];
      const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
      const sx = (a[0] * J[1][1] - a[1] * J[0][1]) / det, sr = (J[0][0] * a[1] - J[1][0] * a[0]) / det;
      x -= sx; r -= sr; if (Math.abs(sx) + Math.abs(sr) < 1e-13) break;
    }
    R[n] = r;
  }
  return R.slice(1); // R[0] of the result is r_1
}

/** Superstable parameters R_0 < R_1 < … of the 2^n-cycles (the critical point is periodic), by scanning and bisection.
 *  `cap` bounds the parameter (the sine map needs a ≤ 1). */
export function superstable(m, R0, nMax = 9, cap = Infinity) {
  const c = m.crit;
  const G = (a, n) => { let x = c(a); for (let i = 0; i < 2 ** n; i++) x = m.f(a, x); return x - c(a); };
  const R = [R0];
  for (let n = 1; n <= nMax; n++) {
    let lo, hi;
    if (n === 1) { lo = R0 + 0.02; hi = Math.min(R0 + 2.5, cap); }
    else { const d = R[n - 1] - R[n - 2]; lo = R[n - 1] + (0.5 * d) / 4.669; hi = Math.min(R[n - 1] + (1.8 * d) / 4.669, cap); }
    let br = null, prev = G(lo, n);
    for (let i = 1; i <= 600; i++) { const a = lo + ((hi - lo) * i) / 600, g = G(a, n); if (Math.sign(g) !== Math.sign(prev)) { br = [lo + ((hi - lo) * (i - 1)) / 600, a]; break; } prev = g; }
    if (!br) break;
    let [p, q] = br; const sp = Math.sign(G(p, n));
    for (let k = 0; k < 80; k++) { const mid = (p + q) / 2; if (Math.sign(G(mid, n)) === sp) p = mid; else q = mid; }
    R.push((p + q) / 2);
  }
  return R;
}

/** Host–parasitoid map in units where a = c = 1: N' = λ N g(P), P' = N (1 − g(P)), g(P) = (1 + P/k)^(−k) (k = Infinity: e^(−P)). */
export const attackFree = (k, P) => (k === Infinity || k > 1e6 ? Math.exp(-P) : Math.pow(1 + P / k, -k));
export function hostParasitoid(lam, k) {
  const g = (P) => attackFree(k, P);
  const Ps = k === Infinity ? Math.log(lam) : k * (Math.pow(lam, 1 / k) - 1), Ns = (Ps * lam) / (lam - 1);
  const F = (N, P) => [lam * N * g(P), N * (1 - g(P))];
  return { F, Ps, Ns, jac() {
    const h = 1e-6 * Math.max(1, Ns), a = F(Ns + h, Ps), b = F(Ns - h, Ps), c = F(Ns, Ps + h), d = F(Ns, Ps - h);
    const J = [[(a[0] - b[0]) / (2 * h), (c[0] - d[0]) / (2 * h)], [(a[1] - b[1]) / (2 * h), (c[1] - d[1]) / (2 * h)]];
    return { J, T: J[0][0] + J[1][1], D: J[0][0] * J[1][1] - J[0][1] * J[1][0] };
  } };
}
/** Are both roots of z² − T z + D inside the unit circle? (the Jury conditions) */
export function juryStable(T, D) { return Math.abs(D) < 1 && 1 - T + D > 0 && 1 + T + D > 0; }

/** A map selector with one parameter slider per map (only the current map's slider is shown). Call `.sync()` first thing in render. */
export function mapPicker(v, keys, defs = {}) {
  const RANGES = { logistic: [0.5, 4, 2.8], ricker: [0.5, 3.2, 1.8], sine: [0.2, 1, 0.7], tent: [0.3, 2, 1.4] };
  const sel = v.select('map', keys.map((k) => ({ value: k, label: '$' + MAPS[k].tex + '$' })), keys[0]);
  const sl = {};
  for (const k of keys) { const [lo, hi, d] = RANGES[k]; sl[k] = v.slider('parameter $' + MAPS[k].par + '$', lo, hi, defs[k] ?? d, { step: 0.01 }); }
  return {
    sel, sl,
    m: () => MAPS[sel.value],
    p: () => sl[sel.value].value,
    g() { const m = MAPS[sel.value], p = sl[sel.value].value; return (x) => m.f(p, x); },
    dg() { const m = MAPS[sel.value], p = sl[sel.value].value; return (x) => m.df(p, x); },
    sync() { for (const k of keys) sl[k].el.hidden = k !== sel.value; },
  };
}
