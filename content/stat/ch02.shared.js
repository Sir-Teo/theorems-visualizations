// Statistical Inference — Chapter 2: helpers shared by ch02.js, ch02-b.js and ch02-c.js (plain named exports).
//
// House style (as in chapter 1): every claim is tested by repeated sampling from a population the reader
// controls; randomness comes from v.rng seeded by the current settings, so pictures are reproducible.

export const SQ2PI = Math.sqrt(2 * Math.PI);
export const phi = (z) => Math.exp(-0.5 * z * z) / SQ2PI;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const commas = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const pct = (x, d = 1) => (100 * x).toFixed(d) + '%';
export const sortNum = (a) => Float64Array.from(a).sort();
export const mean = (a) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s / a.length; };
/** Real minus sign for plain-text numbers. */
export const mnus = (s) => String(s).replace(/-/g, '−');

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
/** Pearson correlation of f(a[i]) and g(a[i]). */
export function corr(a, f, g) {
  const n = a.length; if (n < 3) return NaN;
  let sx = 0, sy = 0; for (let i = 0; i < n; i++) { sx += f(a[i]); sy += g(a[i]); }
  const mx = sx / n, my = sy / n; let xx = 0, yy = 0, xy = 0;
  for (let i = 0; i < n; i++) { const u = f(a[i]) - mx, w = g(a[i]) - my; xx += u * u; yy += w * w; xy += u * w; }
  return xy / Math.sqrt(xx * yy);
}
/** Sample quantile (type 7) of an ascending array. */
export function qSorted(s, p) { const n = s.length; if (!n) return NaN; const h = (n - 1) * p, lo = Math.floor(h); return lo + 1 < n ? s[lo] + (h - lo) * (s[lo + 1] - s[lo]) : s[lo]; }

/** log k! from a table (k ≤ 400), then Stirling. */
const LF = [0]; for (let k = 1; k <= 400; k++) LF.push(LF[k - 1] + Math.log(k));
export const lfact = (k) => (k <= 400 ? LF[k] : (k + 0.5) * Math.log(k) - k + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * k));
export const lchoose = (n, k) => (k < 0 || k > n ? -Infinity : lfact(n) - lfact(k) - lfact(n - k));
export const choose = (n, k) => Math.round(Math.exp(lchoose(n, k)));
/** Digamma and trigamma by recurrence + asymptotic series (x > 0). */
export function digamma(x) { let r = 0; while (x < 6) { r -= 1 / x; x += 1; } const f = 1 / (x * x); return r + Math.log(x) - 0.5 / x - f * (1 / 12 - f * (1 / 120 - f * (1 / 252 - f * (1 / 240 - f / 132)))); }
export function trigamma(x) { let r = 0; while (x < 6) { r += 1 / (x * x); x += 1; } const f = 1 / (x * x); return r + 1 / x + f / 2 + (f / x) * (1 / 6 - f * (1 / 30 - f * (1 / 42 - f / 30))); }

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
/** Two-sample Kolmogorov–Smirnov distance between two ascending arrays. */
export function ks2(a, b) {
  let i = 0, j = 0, d = 0; const n = a.length, m = b.length; if (!n || !m) return NaN;
  while (i < n && j < m) { const x = Math.min(a[i], b[j]); while (i < n && a[i] <= x) i++; while (j < m && b[j] <= x) j++; d = Math.max(d, Math.abs(i / n - j / m)); }
  return d;
}
/** Asymptotic Kolmogorov tail with Stephens' small-sample correction. */
export function ksPval(D, nEff) {
  const e = Math.sqrt(nEff), l = (e + 0.12 + 0.11 / e) * D;
  if (l < 0.3) return 1;
  let s = 0; for (let k = 1; k <= 60; k++) s += (k % 2 ? 1 : -1) * Math.exp(-2 * k * k * l * l);
  return clamp(2 * s, 0, 1);
}
/** Pearson χ² test of independence on a table of counts (rows × cols): {stat, df, p}. */
export function chi2Indep(M, tab) {
  const R = tab.length, C = tab[0].length, rs = tab.map((r) => r.reduce((a, b) => a + b, 0)), cs = tab[0].map((_, j) => tab.reduce((a, r) => a + r[j], 0));
  const N = rs.reduce((a, b) => a + b, 0); let stat = 0, dfR = 0, dfC = 0;
  for (let i = 0; i < R; i++) if (rs[i]) dfR++;
  for (let j = 0; j < C; j++) if (cs[j]) dfC++;
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) { const e = (rs[i] * cs[j]) / N; if (e > 0) stat += (tab[i][j] - e) ** 2 / e; }
  const df = Math.max(1, (dfR - 1) * (dfC - 1));
  return { stat, df, p: M.gammaQ(df / 2, stat / 2) };
}
/** p-value as text: 3 significant figures, '< 0.0001' at the bottom. */
export const fmtP = (p) => (p < 1e-4 ? '< 0.0001' : p < 0.01 ? p.toFixed(4) : p.toFixed(3));

/** Set a box-axes view leaving ~34 px on the left and ~20 px at the bottom, so tick labels sit in empty space. */
export function viewPad(s, xr, yr, o = {}) {
  const pad = (r, f) => { const g = f / (1 - f); return [r[0] - g * (r[1] - r[0]), r[1]]; };
  s.setView(o.noX ? xr : pad(xr, (o.left ?? 34) / Math.max(150, s.width)), o.noY ? yr : pad(yr, (o.bottom ?? 20) / Math.max(100, s.height)));
}
/** TeX axis names just inside the top-left and bottom-right corners of a padded box panel. */
export function axisLabels(s, xl, yl, o = {}) {
  const b = s.bounds;
  if (xl) s.tex(xl, b.x[1], b.y[0], { color: 'muted', size: o.size ?? 15, align: 'right', baseline: 'bottom', dx: -8, dy: -22 });
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
    if (k !== S.key) { S.key = k; S.r = v.rng(hashStr(k + '|' + (o.seed ?? 'stat2'))); S.vals = []; S.last = null; S.run(typeof o.init === 'function' ? o.init() : o.init ?? 1000); }
    return S;
  };
  S.id = () => S.key + '#' + S.ver;
  for (const m of o.buttons ?? [1, 100, 10000]) v.button(`Draw ${commas(m)}`, () => { S.sync(); S.run(m); });
  if (o.clear !== false) v.button('Clear', () => { S.sync(); S.vals = []; S.last = null; S.ver++; });
  return S;
}
/** Bivariate normal density with means (m1, m2), common SD s and correlation r. */
export function binorm(x, y, m1, m2, s, r) {
  const u = (x - m1) / s, w = (y - m2) / s, q = (u * u - 2 * r * u * w + w * w) / (1 - r * r);
  return Math.exp(-0.5 * q) / (2 * Math.PI * s * s * Math.sqrt(1 - r * r));
}
/** Colour cycle for partitions (never red, which means failure on this site). */
export const CYCLE = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold'];
