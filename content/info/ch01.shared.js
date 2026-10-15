// Information & Coding Theory — Chapter 1: helpers shared by ch01.js and ch01-b.js (plain named exports).

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const sum = (a) => { let s = 0; for (const x of a) s += x; return s; };
/** Shannon entropy in bits of a vector of weights (normalised first; 0 log 0 = 0). */
export function H(p) { const s = sum(p); if (!(s > 0)) return 0; let h = 0; for (const x of p) if (x > 0) { const q = x / s; h -= q * Math.log2(q); } return h; }
/** Binary entropy h(p) in bits. */
export const h2 = (p) => (p <= 0 || p >= 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p));
/** Surprisal −log₂ p (∞ for p = 0). */
export const surpr = (p) => (p > 0 ? -Math.log2(p) : Infinity);
export const LET = 'abcdefghijklmnopqrstuvwxyz';
export const commas = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** Set p[i] = val and rescale the other entries proportionally so that the vector still sums to 1. */
export function setProb(p, i, val) {
  val = clamp(val, 0, 1); if (val < 0.004) val = 0; if (val > 0.996) val = 1;
  let S = 0; for (let j = 0; j < p.length; j++) if (j !== i) S += p[j];
  const rest = 1 - val;
  for (let j = 0; j < p.length; j++) if (j !== i) p[j] = S > 1e-12 ? (p[j] * rest) / S : rest / (p.length - 1);
  p[i] = val;
}
/** Truncate or extend a distribution to n outcomes and renormalise. */
export function resizeP(p, n) { const q = p.slice(0, n); while (q.length < n) q.push(0.6 / n); const s = sum(q); return s > 0 ? q.map((x) => x / s) : q.map(() => 1 / n); }
/** Bars of stage s sit at x = 0, 1, …: pressing on a bar and dragging sets its height (the rest rescale). Returns {active, fit(p)}. */
export function dragBars(s, getP, onEdit) {
  const st = { active: false, top: 1.05 };
  let idx = -1;
  s.onDrag((x, y, phase) => {
    const p = getP(); if (!p) return;
    if (phase === 'start') { const i = Math.round(x); idx = i >= 0 && i < p.length && Math.abs(x - i) < 0.5 ? i : -1; }
    if (idx >= 0) { setProb(p, idx, y); onEdit?.(idx); }
    st.active = idx >= 0 && phase !== 'end';
    if (phase === 'end') idx = -1;
  });
  /** Top of the probability axis: fitted to the tallest bar, but frozen while a bar is being dragged. */
  st.fit = (p, lo = 0.4) => { if (!st.active) st.top = Math.min(1.05, Math.max(lo, Math.ceil((Math.max(...p) * 1.18 + 0.02) * 10) / 10)); return st.top; };
  return st;
}
/** FNV-1a: a 32-bit seed from a string. */
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/** Box-axes view leaving ~34 px on the left and ~20 px at the bottom for the tick labels. */
export function viewPad(s, xr, yr, o = {}) {
  const pad = (r, f, lg) => { const g = f / (1 - f); return lg ? [r[0] / Math.pow(r[1] / r[0], g), r[1]] : [r[0] - g * (r[1] - r[0]), r[1]]; };
  s.setView(pad(xr, (o.left ?? 34) / Math.max(150, s.width), o.xlog), pad(yr, (o.bottom ?? 20) / Math.max(100, s.height), o.ylog));
}
/** Legend / title setters that touch the DOM only when the content changes. */
export function legender(v) { let last = ''; return (items) => { const k = JSON.stringify(items); if (k !== last) { last = k; v.legend(items); } }; }
export function titler(s) { let last = null; return (t) => { if (t !== last) { last = t; s.setTitle(t); } }; }
/** Lens (intersection) area of two discs with radii a, b at distance d. */
export function lensArea(a, b, d) {
  if (d >= a + b) return 0;
  if (d <= Math.abs(a - b)) return Math.PI * Math.min(a, b) ** 2;
  const x = clamp((d * d + a * a - b * b) / (2 * d * a), -1, 1), y = clamp((d * d + b * b - a * a) / (2 * d * b), -1, 1);
  return a * a * Math.acos(x) + b * b * Math.acos(y) - 0.5 * Math.sqrt(Math.max(0, (-d + a + b) * (d + a - b) * (d - a + b) * (d + a + b)));
}

