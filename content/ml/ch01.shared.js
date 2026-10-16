// Understanding Machine Learning — helpers shared by ch01.js and ch02.js (re-exported by ch02.shared.js).
//
// House style of the ml collection: the learning problem is always a sample the reader can see (points on a line or
// in the papaya square), the hypothesis class is fitted live on it, and every statement about "probably" or
// "on average" is checked by a seeded simulation drawn next to the exact or bounded value.

// ---------------------------------------------------------------- small utilities
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const mean = (a) => { let s = 0; for (const x of a) s += x; return a.length ? s / a.length : 0; };
export const commas = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** Percentage text with one decimal. */
export const pct = (x, d = 1) => `${(100 * x).toFixed(d)}\\%`;
/** FNV-1a: a 32-bit seed from a string. */
export function hashStr(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/** One-slot cache: recompute only when the key changes. */
export function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }
/** Seeded generator: r() in [0,1), r.normal(), r.uniform(a, b), r.int(a, b). */
export function rand(seed = 1) {
  let a = (seed >>> 0) || 1;
  const next = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const r = () => next();
  r.uniform = (lo = 0, hi = 1) => lo + (hi - lo) * next();
  r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * next());
  r.normal = (mu = 0, s = 1) => { const u = 1 - next(), w = next(); return mu + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w); };
  return r;
}
export const binom = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };

/** Standard normal CDF. */
const erf = (x) => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; };
export const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));

// ---------------------------------------------------------------- threshold learning on [0, 1] (chapter 1)
/** Probability mass of [a, b] under the 1-D data law: uniform on [0,1], or (gap) uniform on [0,1] with the band (th-w, th+w) removed. */
export function lineMass(a, b, th, gap) {
  if (b < a) [a, b] = [b, a];
  a = clamp(a, 0, 1); b = clamp(b, 0, 1);
  if (!gap) return b - a;
  const w = GAP_W, tot = 1 - 2 * w, ov = Math.max(0, Math.min(b, th + w) - Math.max(a, th - w));
  return (b - a - ov) / tot;
}
export const GAP_W = 0.07;
/** Draw one point from the 1-D law above. */
export function lineDraw(r, th, gap) {
  if (!gap) return r();
  const u = r() * (1 - 2 * GAP_W); // uniform on the complement of the band
  return u < th - GAP_W ? u : u + 2 * GAP_W;
}

// ---------------------------------------------------------------- Skinner's pigeon (chapter 1)
export const BEHAVIOURS = ['turn', 'peck floor', 'head-bob', 'flap wing', 'hop', 'stretch'];
/**
 * One pigeon for T seconds. Food arrives every `period` seconds whatever the bird does. With `credit` the bird adds one unit of
 * credit to the behaviour it is performing at the moment food arrives and chooses behaviours with probability proportional to
 * credit^2 (a mild rich-get-richer rule); without it credits never change.
 */
export function pigeonRun(seed, T, period, credit, K = BEHAVIOURS.length) {
  const r = rand(seed), c = new Float64Array(K).fill(1), act = new Uint8Array(T), food = new Uint8Array(T);
  for (let t = 0; t < T; t++) {
    let tot = 0; for (let k = 0; k < K; k++) tot += c[k] * c[k];
    let u = r() * tot, a = 0; while (a < K - 1 && u >= c[a] * c[a]) { u -= c[a] * c[a]; a++; }
    act[t] = a;
    if ((t + 1) % period === 0) { food[t] = 1; if (credit) c[a] += 1; }
  }
  return { act, food };
}
/** Share of the favourite behaviour in the window (t - w, t]. */
export function favouriteShare(run, t, w, K = BEHAVIOURS.length) {
  const cnt = new Array(K).fill(0), lo = Math.max(0, t - w);
  for (let i = lo; i < t; i++) cnt[run.act[i]]++;
  const n = Math.max(1, t - lo), m = Math.max(...cnt);
  return { share: m / n, fav: cnt.indexOf(m), cnt, n };
}
