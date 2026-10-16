// Pharmacology — Chapter 1: helpers shared by the items of ch01.js
// (a small table of typical adult drug parameters, trapezoid/NCA helpers, one-compartment curves, drawing helpers)

// ---------------------------------------------------------------- reference volumes
/** Reference body-water volumes of a 70 kg adult (L): plasma ≈ 3, extracellular fluid ≈ 14, total body water ≈ 42. */
export const BODY = { kg: 70, plasma: 3, ecf: 14, tbw: 42 };

// ---------------------------------------------------------------- typical adult parameters
/**
 * Typical adult values (rounded; textbook / drug-label summaries, 70 kg man) used as presets.
 * V in L/kg, CL in L/h (whole body), F = oral bioavailability, fu = unbound fraction in plasma.
 * Quoted ranges differ between sources; these are round teaching values, not dosing information.
 */
export const DRUGS = {
  warfarin:    { name: 'warfarin',    V: 0.14, t12: 40,  F: 1.0,  fu: 0.01, note: 'V 0.14 L/kg, effective t½ ≈ 40 h (range 20–60 h), about 99 % bound' },
  gentamicin:  { name: 'gentamicin',  V: 0.25, t12: 2.2, F: 0.0,  fu: 0.9,  note: 'V ≈ 0.25 L/kg, t½ 2–4 h, cleared by filtration (CL ≈ creatinine clearance), not absorbed orally' },
  theophylline:{ name: 'theophylline',V: 0.5,  t12: 8.7, F: 1.0,  fu: 0.6,  note: 'V 0.4–0.7 L/kg, t½ ≈ 8–9 h in non-smoking adults' },
  caffeine:    { name: 'caffeine',    V: 0.6,  t12: 5.3, F: 1.0,  fu: 0.65, note: 'V ≈ 0.6 L/kg, CL ≈ 0.078 L/h/kg, t½ 4–6 h' },
  digoxin:     { name: 'digoxin',     V: 7,    t12: 40,  F: 0.7,  fu: 0.75, note: 'V ≈ 7 L/kg (some tables 2–5), t½ ≈ 36–48 h' },
};
/** Clearance (L/h, whole body) from V (L/kg) and t½ (h): CL = ln2 · V / t½. */
export const clOf = (d) => (Math.LN2 * d.V * BODY.kg) / d.t12;

// ---------------------------------------------------------------- numerics
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
/** Linear trapezoid area of (ts, ys). */
export function trapz(ts, ys) {
  let a = 0;
  for (let i = 1; i < ts.length; i++) a += 0.5 * (ys[i] + ys[i - 1]) * (ts[i] - ts[i - 1]);
  return a;
}
/** Linear-up / log-down trapezoid area: log trapezoid on declining segments (exact for exponentials). */
export function trapzLog(ts, ys) {
  let a = 0;
  for (let i = 1; i < ts.length; i++) {
    const dt = ts[i] - ts[i - 1], c0 = ys[i - 1], c1 = ys[i];
    if (c1 < c0 && c1 > 0 && c0 > 0) a += ((c0 - c1) * dt) / Math.log(c0 / c1);
    else a += 0.5 * (c0 + c1) * dt;
  }
  return a;
}
/** Least squares line of ln y on t over the points idx; returns {k (= −slope), c0 (intercept in y units), r2}. */
export function logSlope(ts, ys, idx) {
  const n = idx.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  for (const i of idx) { const x = ts[i], y = Math.log(ys[i]); sx += x; sy += y; sxx += x * x; sxy += x * y; syy += y * y; }
  const d = n * sxx - sx * sx, b = d ? (n * sxy - sx * sy) / d : 0, a = (sy - b * sx) / n;
  const r = (n * sxy - sx * sy) / Math.sqrt(Math.max(1e-300, d * (n * syy - sy * sy)));
  return { k: -b, c0: Math.exp(a), r2: r * r };
}
/** One-compartment bolus: concentration after dose D into volume V with rate k. */
export const bolus = (D, V, k, t) => (t < 0 ? 0 : (D / V) * Math.exp(-k * t));
/** Bateman function: concentration after an oral dose D (F absorbed) with first-order absorption ka, elimination k. */
export function bateman(F, D, V, ka, k, t) {
  if (t < 0) return 0;
  if (Math.abs(ka - k) < 1e-9 * Math.max(ka, k)) return ((F * D) / V) * ka * t * Math.exp(-k * t);
  return (((F * D * ka) / (V * (ka - k))) * (Math.exp(-k * t) - Math.exp(-ka * t)));
}
/** One RK4 step for an array state. */
export function rk4(f, y, t, h) {
  const add = (a, b, c) => a.map((v, i) => v + c * b[i]);
  const k1 = f(y, t), k2 = f(add(y, k1, h / 2), t + h / 2), k3 = f(add(y, k2, h / 2), t + h / 2), k4 = f(add(y, k3, h), t + h);
  return y.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
/** Index of the last sample with ts[i] ≤ t. */
export function idxAt(ts, t) {
  let lo = 0, hi = ts.length - 1;
  if (t <= ts[0]) return 0;
  if (t >= ts[hi]) return hi;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= t) lo = m; else hi = m; }
  return lo;
}
/** Draw arrays as a polyline, skipping non-finite values. */
export function trace(s, ts, ys, st = {}) {
  const pts = new Array(ts.length);
  for (let i = 0; i < ts.length; i++) pts[i] = isFinite(ys[i]) && ys[i] > (st.floor ?? -Infinity) ? [ts[i], ys[i]] : null;
  s.path(pts, st);
}
/** One-slot memo: recomputes f() only when the key changes. */
export function memo() { let key = {}, val; return (k, f) => (k === key ? val : ((key = k), (val = f()))); }
/** Round to n significant figures, as a string without TeX. */
export const sig = (x, n = 3) => (x === 0 || !isFinite(x) ? String(x) : String(Number(x.toPrecision(n))));

// ---------------------------------------------------------------- drawing
/** A labelled box centred at (x, y). st: {color, fill, fillAlpha, sub (below the label), size, active}. */
export function box(s, x, y, w, h, label, st = {}) {
  const col = st.color || 'ink', r = st.radius ?? 8;
  s.rect(x - w / 2, y - h / 2, x + w / 2, y + h / 2, { fill: 'panel', fillAlpha: 1, stroke: false, radius: r });
  s.rect(x - w / 2, y - h / 2, x + w / 2, y + h / 2, { fill: st.fill || col, fillAlpha: st.fillAlpha ?? 0.06, color: col, width: st.active ? 2.4 : 1.5, radius: r });
  if (label) s.text(label, x, y + (st.sub ? 0.14 * h : 0), { size: st.size || 12, color: st.labelColor || 'ink', align: 'center', baseline: 'middle', weight: 600 });
  if (st.sub) s.text(st.sub, x, y - 0.26 * h, { size: st.subSize || 10.5, color: st.subColor || 'muted', align: 'center', baseline: 'middle' });
}
/** Arrow along a polyline (last segment has the head). */
export function wire(s, pts, st = {}) {
  const col = st.color || 'muted', w = st.width ?? 1.7;
  if (pts.length > 2) s.path(pts.slice(0, -1), { color: col, width: w, dash: st.dash, alpha: st.alpha });
  const a = pts[pts.length - 2], b = pts[pts.length - 1];
  s.arrow(a[0], a[1], b[0], b[1], { color: col, width: w, head: st.head ?? 8, dash: st.dash, alpha: st.alpha });
}
function polyAt(pts, u) {
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (u <= l || i === pts.length - 1) { const f = l ? Math.min(1, u / l) : 0; return [pts[i - 1][0] + f * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + f * (pts[i][1] - pts[i - 1][1])]; }
    u -= l;
  }
  return pts[pts.length - 1];
}
export function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
/** Dots streaming along a polyline; gap = spacing in data units of arc length, phase in the same units. */
export function flowDots(s, pts, phase, gap, st = {}) {
  const L = polyLen(pts), out = [];
  for (let u = ((phase % gap) + gap) % gap; u < L - 0.05; u += gap) out.push(polyAt(pts, u));
  s.dots(out, { r: st.r ?? 2.4, color: st.color || 'gold', alpha: st.alpha });
}
/** Standard log-time/concentration tick list for a semilog plot: [[value, label]…] over [lo, hi] using 1-2-5. */
export function logTicks(lo, hi) {
  const out = [];
  for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) for (const m of [1, 2, 5]) {
    const x = m * 10 ** e; if (x >= lo * 0.999 && x <= hi * 1.001) out.push([x, x >= 1 ? String(Math.round(x)) : String(Number(x.toPrecision(2)))]);
  }
  return out;
}
