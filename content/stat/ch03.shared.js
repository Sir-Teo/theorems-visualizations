// Statistical Inference — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports).
//
// House style (as in chapters 1–2): every claim is tested by repeated sampling from a population the reader
// controls; randomness comes from v.rng seeded by the current settings, so pictures are reproducible.

export const SQ2PI = Math.sqrt(2 * Math.PI);
export const LOG2PI = Math.log(2 * Math.PI);
export const phi = (z) => Math.exp(-0.5 * z * z) / SQ2PI;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const commas = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const pct = (x, d = 1) => (100 * x).toFixed(d) + '%';
export const sortNum = (a) => Float64Array.from(a).sort();
export const mean = (a) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s / a.length; };
/** Real minus sign for plain-text numbers. */
export const mnus = (s) => String(s).replace(/-/g, '−');
/** log(Σ exp a_i) without overflow. */
export const lse = (a, b) => { const m = Math.max(a, b); return m === -Infinity ? -Infinity : m + Math.log(Math.exp(a - m) + Math.exp(b - m)); };

/** FNV-1a: a 32-bit seed from a string, so every setting of the controls has its own reproducible stream. */
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/** One-slot cache: recompute only when the key changes. */
export function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }
/** Mean, variance (divisor n − 1) and SD by Welford's algorithm. */
export function moments(a, f = (x) => x) {
  let n = 0, m = 0, s = 0;
  for (let i = 0; i < a.length; i++) { const x = f(a[i]); n++; const d = x - m; m += d / n; s += d * (x - m); }
  return { n, mean: m, var: n > 1 ? s / (n - 1) : NaN, sd: n > 1 ? Math.sqrt(s / (n - 1)) : NaN };
}
/** Sample quantile (type 7) of an ascending array. */
export function qSorted(s, p) { const n = s.length; if (!n) return NaN; const h = (n - 1) * p, lo = Math.floor(h); return lo + 1 < n ? s[lo] + (h - lo) * (s[lo + 1] - s[lo]) : s[lo]; }
/** k-th smallest (0-based) of a[0..n-1] by quickselect; works in place on the buffer. */
export function kth(a, n, k) {
  let lo = 0, hi = n - 1;
  while (hi > lo) {
    const p = a[(lo + hi) >> 1]; let i = lo, j = hi;
    while (i <= j) { while (a[i] < p) i++; while (a[j] > p) j--; if (i <= j) { const t = a[i]; a[i] = a[j]; a[j] = t; i++; j--; } }
    if (k <= j) hi = j; else if (k >= i) lo = i; else return a[k];
  }
  return a[k];
}
/** Median of the first n entries of src (src is not modified; buf is scratch space of length ≥ n). */
export function medianOf(src, n, buf) {
  for (let i = 0; i < n; i++) buf[i] = src[i];
  if (n % 2) return kth(buf, n, (n - 1) >> 1);
  const a = kth(buf, n, n / 2 - 1); let b = Infinity; for (let i = n / 2; i < n; i++) if (buf[i] < b) b = buf[i];
  return 0.5 * (a + b);
}

/** log k! from a table (k ≤ 400), then Stirling. */
const LF = [0]; for (let k = 1; k <= 400; k++) LF.push(LF[k - 1] + Math.log(k));
export const lfact = (k) => (k <= 400 ? LF[k] : (k + 0.5) * Math.log(k) - k + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * k));
/** Digamma and trigamma by recurrence + asymptotic series (x > 0). */
export function digamma(x) { let r = 0; while (x < 6) { r -= 1 / x; x += 1; } const f = 1 / (x * x); return r + Math.log(x) - 0.5 / x - f * (1 / 12 - f * (1 / 120 - f * (1 / 252 - f * (1 / 240 - f / 132)))); }
export function trigamma(x) { let r = 0; while (x < 6) { r += 1 / (x * x); x += 1; } const f = 1 / (x * x); return r + 1 / x + f / 2 + (f / x) * (1 / 6 - f * (1 / 30 - f * (1 / 42 - f / 30))); }

/**
 * Gamma(shape α, rate β) maximum likelihood from the sufficient statistics (x̄, mean log x):
 * solve log α − ψ(α) = log x̄ − mean(log x) by Newton from Minka's start; β = α / x̄.
 */
export function gammaMLE(xbar, mlog) {
  const s = Math.max(1e-12, Math.log(xbar) - mlog);
  let a = (3 - s + Math.sqrt((s - 3) ** 2 + 24 * s)) / (12 * s);
  for (let i = 0; i < 30; i++) {
    const f = Math.log(a) - digamma(a) - s, d = 1 / a - trigamma(a), na = a - f / d;
    a = na > 0 ? na : a / 2; if (Math.abs(f) < 1e-13) break;
  }
  return { alpha: a, beta: a / xbar };
}
/** Gamma(α, rate β) log-likelihood from n, Σx and Σ log x. */
export const gammaLL = (a, b, n, sx, slog) => n * (a * Math.log(b) - lgammaF(a)) + (a - 1) * slog - b * sx;
/** log Γ by Lanczos (g = 7). */
const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
export function lgammaF(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgammaF(1 - x);
  x -= 1; let a = LG[0]; const t = x + 7.5; for (let i = 1; i < 9; i++) a += LG[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Histogram normalised by ALL finite values (so mass outside [lo, hi] is honestly missing). */
export function binned(vals, lo, hi, nb, f) {
  const w = (hi - lo) / nb, counts = new Array(nb).fill(0); let N = 0, inside = 0;
  for (let i = 0; i < vals.length; i++) {
    const x = f ? f(vals[i]) : vals[i]; if (x !== x) continue; N++;
    if (x < lo || x > hi) continue; counts[Math.min(nb - 1, Math.floor((x - lo) / w))]++; inside++;
  }
  const edges = []; for (let i = 0; i <= nb; i++) edges.push(lo + i * w);
  const density = counts.map((c) => (N ? c / (N * w) : 0));
  return { edges, counts, density, N, out: N - inside, max: Math.max(0, ...density) };
}

/** Set a box-axes view leaving ~34 px on the left and ~20 px at the bottom, so tick labels sit in empty space. */
export function viewPad(s, xr, yr, o = {}) {
  const pad = (r, f) => { const g = f / (1 - f); return [r[0] - g * (r[1] - r[0]), r[1]]; };
  s.setView(o.noX ? xr : pad(xr, (o.left ?? 34) / Math.max(150, s.width)), o.noY ? yr : pad(yr, (o.bottom ?? 20) / Math.max(100, s.height)));
}
/** TeX axis names just inside the top-left and bottom-right corners of a padded box panel. */
export function axisLabels(s, xl, yl, o = {}) {
  const b = s.bounds;
  if (xl) s.tex(xl, b.x[1], b.y[0], { color: 'muted', size: o.size ?? 15, align: 'right', baseline: 'bottom', dx: -8, dy: o.xdy ?? -22 });
  if (yl) s.tex(yl, b.x[0], b.y[1], { color: 'muted', size: o.size ?? 15, align: 'left', baseline: 'top', dx: o.dx ?? 40, dy: 4 });
}
/** Legend / title setters that touch the DOM only when the content changes. */
export function legender(v) { let last = ''; return (items) => { const k = JSON.stringify(items); if (k !== last) { last = k; v.legend(items); } }; }
export function titler(s) { let last = null; return (t) => { if (t !== last) { last = t; s.setTitle(t); } }; }

/**
 * Repeated-sampling engine. sample(r) draws one data set, stat(data) reduces it to what is stored.
 * key() lists everything the simulation depends on: when it changes the RNG is reseeded from it and `init`
 * repetitions are drawn. Adds Draw buttons (and Clear unless clear: false).
 */
export function repeater(v, o) {
  const S = { vals: [], last: null, key: null, r: null, ver: 0 };
  const cap = o.cap ?? 250000;
  S.run = (m) => { for (let i = 0; i < m && S.vals.length < cap; i++) { const d = o.sample(S.r); S.vals.push(o.stat ? o.stat(d) : d); S.last = d; } S.ver++; };
  S.sync = () => {
    const k = String(o.key());
    if (k !== S.key) { S.key = k; S.r = v.rng(hashStr(k + '|' + (o.seed ?? 'stat3'))); S.vals = []; S.last = null; S.run(typeof o.init === 'function' ? o.init() : o.init ?? 1000); }
    return S;
  };
  S.id = () => S.key + '#' + S.ver;
  for (const m of o.buttons ?? [1, 100, 10000]) v.button(`Draw ${commas(m)}`, () => { S.sync(); S.run(m); });
  if (o.clear !== false) v.button('Clear', () => { S.sync(); S.vals = []; S.last = null; S.ver++; });
  return S;
}

/** Points of the k-SD ellipse of a 2×2 covariance [[a, b], [b, c]] centred at (mx, my). */
export function ellipsePts(mx, my, a, b, c, k = 2, n = 72) {
  const tr = a + c, det = a * c - b * b, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  const l1 = Math.max(0, tr / 2 + disc), l2 = Math.max(0, tr / 2 - disc);
  const ang = Math.abs(b) < 1e-14 ? (a >= c ? 0 : Math.PI / 2) : Math.atan2(l1 - a, b);
  const ca = Math.cos(ang), sa = Math.sin(ang), r1 = k * Math.sqrt(l1), r2 = k * Math.sqrt(l2), pts = [];
  for (let i = 0; i <= n; i++) { const t = (2 * Math.PI * i) / n, u = r1 * Math.cos(t), w = r2 * Math.sin(t); pts.push([mx + ca * u - sa * w, my + sa * u + ca * w]); }
  return pts;
}
/** Log-density of a bivariate normal with mean m = [mx, my] and covariance S = [a, b, c] (entries a, b; b, c). */
export function lbinorm(x, y, m, S) {
  const [a, b, c] = S, det = a * c - b * b, dx = x - m[0], dy = y - m[1];
  return -LOG2PI - 0.5 * Math.log(det) - (0.5 * (c * dx * dx - 2 * b * dx * dy + a * dy * dy)) / det;
}
/** Colour cycle for partitions (never red, which means failure on this site). */
export const CYCLE = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold'];
