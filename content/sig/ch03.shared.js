// Signals & Systems — Chapter 3 shared helpers: signals on a uniform grid with full-length convolution, a small library of
// impulse responses (smooth part + point masses), and the usual stem/colour helpers of chapter 2 (re-exported).
export * from './ch02.shared.js';

/** Colours cycled through for "one copy per impulse" pictures. */
export const CYCLE = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];

// ================================================================ signals on a uniform grid
/** A signal sampled at t0 + k·D (zero outside the array): {t0, D, a}. */
export function sg(f, t0, t1, D = 0.02) {
  const n = Math.round((t1 - t0) / D) + 1, a = new Float64Array(n);
  for (let k = 0; k < n; k++) a[k] = f(t0 + k * D);
  return { t0, D, a };
}
/** Full convolution (b ∗ a)(t) = Σ a[j] b[k − j] · D on the grid: exact convolution of the sample sequences, scaled by D. */
export function convSg(A, B) {
  const na = A.a.length, nb = B.a.length, out = new Float64Array(na + nb - 1), D = A.D;
  for (let j = 0; j < na; j++) { const aj = A.a[j] * D; if (aj === 0) continue; for (let k = 0; k < nb; k++) out[j + k] += aj * B.a[k]; }
  return { t0: A.t0 + B.t0, D, a: out };
}
export const addSg = (A, B, ca = 1, cb = 1) => {
  const t0 = Math.min(A.t0, B.t0), D = A.D, t1 = Math.max(A.t0 + (A.a.length - 1) * D, B.t0 + (B.a.length - 1) * D), n = Math.round((t1 - t0) / D) + 1, a = new Float64Array(n);
  const oa = Math.round((A.t0 - t0) / D), ob = Math.round((B.t0 - t0) / D);
  for (let k = 0; k < A.a.length; k++) a[oa + k] += ca * A.a[k];
  for (let k = 0; k < B.a.length; k++) a[ob + k] += cb * B.a[k];
  return { t0, D, a };
};
/** Value of a gridded signal at time t (linear interpolation, zero outside). */
export function sgAt(S, t) {
  const u = (t - S.t0) / S.D, i = Math.floor(u), f = u - i, n = S.a.length;
  const g = (k) => (k < 0 || k >= n ? 0 : S.a[k]);
  return g(i) * (1 - f) + g(i + 1) * f;
}
/** [[t, y]] points of a gridded signal on [a, b]. */
export function sgPts(S, a, b, step = 1) {
  const out = [], i0 = Math.max(0, Math.ceil((a - S.t0) / S.D)), i1 = Math.min(S.a.length - 1, Math.floor((b - S.t0) / S.D));
  for (let i = i0; i <= i1; i += step) out.push([S.t0 + i * S.D, S.a[i]]);
  return out;
}
export const sgMax = (S, a = -Infinity, b = Infinity) => { let m = 0; for (let i = 0; i < S.a.length; i++) { const t = S.t0 + i * S.D; if (t >= a && t <= b) m = Math.max(m, Math.abs(S.a[i])); } return m; };
/** Largest |A − B| over [a, b] (both interpolated on A's grid). */
export function sgDiff(A, B, a, b) { let m = 0; for (let i = 0; i < A.a.length; i++) { const t = A.t0 + i * A.D; if (t >= a && t <= b) m = Math.max(m, Math.abs(A.a[i] - sgAt(B, t))); } return m; }

// ================================================================ impulse responses
/** Composite midpoint rule of f over [a, b] with n cells. */
export function midpoint(f, a, b, n = 600) { const h = (b - a) / n; let s = 0; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h); return s * h; }

/**
 * Library of impulse responses h(t) = f(t) + Σ aₖ δ(t − Tₖ), zero before 0 (causal), with support end T.
 * f: smooth part; deltas: [[Tₖ, aₖ]]; Hc: closed-form frequency response (jω) → [re, im] where there is one.
 */
export const KER = {
  rc: { label: 'RC lowpass', tex: 'h(t)=e^{-t}u(t)', f: (t) => (t >= 0 ? Math.exp(-t) : 0), deltas: [], T: 16, Hc: (w) => [1 / (1 + w * w), -w / (1 + w * w)] },
  box: { label: 'moving average', tex: 'h(t)=\\mathbf 1_{[0,1)}(t)', f: (t) => (t >= 0 && t < 1 ? 1 : 0), deltas: [], T: 1, Hc: (w) => (w === 0 ? [1, 0] : [Math.sin(w) / w, (Math.cos(w) - 1) / w]) },
  tri: { label: 'triangle', tex: 'h(t)=\\text{tent on }[0,2]', f: (t) => (t >= 0 && t < 1 ? t : t >= 1 && t < 2 ? 2 - t : 0), deltas: [], T: 2 },
  res: { label: 'resonator', tex: 'h(t)=e^{-0.4t}\\sin 3t\\,u(t)', f: (t) => (t >= 0 ? Math.exp(-0.4 * t) * Math.sin(3 * t) : 0), deltas: [], T: 18 },
  echo: { label: 'echo', tex: 'h(t)=\\delta(t)+0.6\\,\\delta(t-1.5)', f: () => 0, deltas: [[0, 1], [1.5, 0.6]], T: 1.5, Hc: (w) => [1 + 0.6 * Math.cos(1.5 * w), -0.6 * Math.sin(1.5 * w)] },
  hp: { label: 'RC highpass', tex: 'h(t)=\\delta(t)-e^{-t}u(t)', f: (t) => (t >= 0 ? -Math.exp(-t) : 0), deltas: [[0, 1]], T: 16, Hc: (w) => [(w * w) / (1 + w * w), w / (1 + w * w)] },
};
for (const [id, k] of Object.entries(KER)) k.id = id;
/** y(t) = (x ∗ h)(t) for a function x(t), by midpoint rule on the smooth part plus the point masses exactly. */
export function kerResp(K, x, t, n = 640) {
  let s = K.deltas.reduce((q, [T, a]) => q + a * x(t - T), 0);
  if (K.T > 0 && K.f !== undefined) s += midpoint((tau) => K.f(tau) * x(t - tau), 0, K.T, n);
  return s;
}
/** H(jω) = ∫ h(τ)e^{−jωτ} dτ as [re, im] straight from the impulse response (complex σ allowed: s = σ + jω). */
export function kerHat(K, sig, w, n = 1200) {
  let re = 0, im = 0;
  for (const [T, a] of K.deltas) { const m = Math.exp(-sig * T); re += a * m * Math.cos(w * T); im -= a * m * Math.sin(w * T); }
  const h = K.T / n;
  if (K.T > 0) for (let i = 0; i < n; i++) { const tau = (i + 0.5) * h, v = K.f(tau) * Math.exp(-sig * tau) * h; re += v * Math.cos(w * tau); im -= v * Math.sin(w * tau); }
  return [re, im];
}
/** The kernel as a gridded signal on [0, T + pad] (smooth part only; point masses are returned separately). */
export const kerSg = (K, D = 0.02, pad = 0) => sg(K.f, 0, K.T + pad, D);
/** Draw h: its smooth part as a curve and each point mass as an arrow whose height is its weight. */
export function drawKer(s, K, st = {}) {
  const col = st.color || 'orange', flip = st.flip, shift = st.shift || 0, ex = st.xr;
  const map = (tau) => (flip ? shift - tau : shift + tau);
  if (K.T > 0 && K.f) {
    const pts = []; const n = 400;
    for (let i = 0; i <= n; i++) { const tau = -0.2 + ((K.T + 0.4) * i) / n; pts.push([map(tau), K.f(tau)]); }
    if (st.fill) s.path(pts, { color: col, width: st.width ?? 2.2, alpha: st.alpha });
    else s.path(pts, { color: col, width: st.width ?? 2.2, alpha: st.alpha });
  }
  for (const [T, a] of K.deltas) { s.arrow(map(T), 0, map(T), a, { color: col, width: 2.2, head: 8, alpha: st.alpha }); }
  return ex;
}
/** Convolution of two impulse responses of the library (as gridded signals; point masses become a spike of height a/D). */
export const kerAsSg = (K, t1, D = 0.02) => {
  const S = sg((t) => K.f(t), 0, t1, D);
  for (const [T, a] of K.deltas) S.a[Math.round(T / D)] += a / D;
  return S;
};

// ================================================================ discrete-time helpers
/** Convolution of two finite sequences (as plain arrays starting at index 0). */
export function conv(x, h) { const y = new Array(x.length + h.length - 1).fill(0); for (let i = 0; i < x.length; i++) for (let j = 0; j < h.length; j++) y[i + j] += x[i] * h[j]; return y; }
/** Largest |a − b| over two equal-length arrays. */
export const arrDiff = (a, b) => { let m = 0; for (let i = 0; i < Math.min(a.length, b.length); i++) m = Math.max(m, Math.abs(a[i] - b[i])); return m; };
