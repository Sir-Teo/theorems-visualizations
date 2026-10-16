// Information & Coding Theory — Chapter 2: helpers shared by ch02.js and ch02-b.js (plain named exports).
// Same house style as chapter 1 (bits, blue bars you can drag, green entropies, orange bounds, red failures,
// purple shared information), plus divergence helpers and small editors for pairs of distributions and joint tables.

import { clamp, sum, H, h2, surpr, LET, commas, setProb, dragBars, hashStr } from './ch01.shared.js';
export { clamp, sum, H, h2, surpr, LET, commas, setProb, dragBars, hashStr };

export const LN2 = Math.LN2;
/** D(p‖q) in bits (∞ when some p_i > 0 has q_i = 0; q need not be normalised). */
export function KL(p, q) { let d = 0; for (let i = 0; i < p.length; i++) { if (p[i] > 0) { if (!(q[i] > 0)) return Infinity; d += p[i] * Math.log2(p[i] / q[i]); } } return d; }
/** Binary divergence d(a‖b) in bits. */
export const d2 = (a, b) => KL([a, 1 - a], [b, 1 - b]);
/** Total-variation distance ½Σ|p−q|. */
export const TV = (p, q) => { let s = 0; for (let i = 0; i < p.length; i++) s += Math.abs(p[i] - q[i]); return s / 2; };
export const fmtB = (v, x, d = 3) => (x === Infinity ? '∞' : v.fix(x, d));

/** Marginals and entropies of a joint table P (flat, row-major, nr rows = values of X, nc columns = values of Y). */
export function jointStats(P, nr, nc) {
  const px = new Array(nr).fill(0), py = new Array(nc).fill(0);
  for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) { px[i] += P[i * nc + j]; py[j] += P[i * nc + j]; }
  const HX = H(px), HY = H(py), HXY = H(P);
  return { px, py, HX, HY, HXY, HYgX: HXY - HX, HXgY: HXY - HY, I: Math.max(0, HX + HY - HXY) };
}
/** Entropy (bits) of the marginal of a pmf over k bits-valued variables (index = Σ x_v·2^v) on the variables in `mask`. */
export function Hm(pmf, mask) {
  const m = new Map();
  for (let s = 0; s < pmf.length; s++) { const key = s & mask; m.set(key, (m.get(key) || 0) + pmf[s]); }
  return H([...m.values()]);
}

/** A bar editor: a stage with draggable bars for a distribution; `ed.p` is mutated in place. */
export function barEd(v, { title, p, color = 'accent', labels, height = 220, minTop = 0.5, ...rest }) {
  const n = p.length;
  const ed = { p, color, s: v.stage({ x: [-0.6, n - 0.4], y: [0, 1], height, axes: 'box', gutter: true, title, ...rest }) };
  ed.db = dragBars(ed.s, () => ed.p, () => ed.onEdit && ed.onEdit());
  ed.draw = ({ values = true, alpha = 0.5, fn } = {}) => {
    const s = ed.s, q = ed.p;
    s.setView([-0.6, q.length - 0.4], [0, ed.db.fit(q, minTop)]);
    s.setTicks(q.map((_, i) => [i, labels ? labels(i) : LET[i]]), null);
    q.forEach((x, i) => {
      s.rect(i - 0.34, 0, i + 0.34, x, { fill: ed.color, fillAlpha: alpha, color: ed.color, width: 1.5 });
      if (values) s.text(v.fix(x, 2), i, x, { dy: -9, align: 'center', size: 10.5, color: 'muted', weight: 600 });
    });
    if (fn) fn(s, q);
  };
  return ed;
}

/** Free (unnormalised) bar editor for positive numbers: drag a bar to set its height. */
export function freeBars(s, vals, { lo = 0.02, hi = 1, onEdit } = {}) {
  let idx = -1;
  s.onDrag((x, y, phase) => {
    if (phase === 'start') { const i = Math.round(x * 2); idx = i >= 0 && i < vals.length * 2 && Math.abs(x * 2 - i) < 0.9 ? i : -1; }
    if (idx >= 0) { vals[idx] = clamp(y, lo, hi); onEdit?.(idx); }
    if (phase === 'end') idx = -1;
  });
}

/** Joint-table editing: drag vertically inside a cell of a table drawn with `drawTable` on stage s. */
export function tableDrag(s, getP, nr, nc, st) {
  s.onDrag((x, y, phase) => {
    const P = getP();
    if (phase === 'start') { const j = Math.floor(x), i = Math.floor(-y); st.drag = i >= 0 && i < nr && j >= 0 && j < nc ? { k: i * nc + j, p0: P[i * nc + j], y0: y } : null; }
    else if (st.drag) setProb(P, st.drag.k, st.drag.p0 + (y - st.drag.y0) * 0.35);
    if (phase === 'end') st.drag = null;
  });
}
/** Draw a joint table of cell squares (area ∝ probability) at x ∈ [0, nc], y ∈ [−nr, 0]. */
export function drawTable(s, v, P, nr, nc, { drag = null, color = 'accent', cellFn, margins = true, xName = 'x', yName = 'y', showMarg = true } = {}) {
  const st = jointStats(P, nr, nc);
  for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) {
    const q = P[i * nc + j], x0 = j, y0 = -i - 1, side = 0.74 * Math.sqrt(q), act = drag && drag.k === i * nc + j;
    const cs = cellFn ? cellFn(i, j, q) : null;
    s.rect(x0 + 0.03, y0 + 0.03, x0 + 0.97, y0 + 0.97, { color: act ? 'gold' : cs?.edge || 'faint', width: act ? 2.4 : cs?.edge ? 2 : 1.2, fill: cs?.fill || false, fillAlpha: cs?.fillAlpha ?? 0.18 });
    if (q > 0) s.rect(x0 + 0.5 - side / 2, y0 + 0.6 - side / 2, x0 + 0.5 + side / 2, y0 + 0.6 + side / 2, { fill: color, fillAlpha: 0.45, stroke: false });
    s.text(q > 0 ? v.fix(q, 3) : '0', x0 + 0.5, y0 + 0.15, { align: 'center', size: 11.5, weight: 600, color: q > 0 ? 'ink' : 'muted', halo: false });
  }
  if (margins) {
    for (let j = 0; j < nc; j++) {
      s.tex(`${yName}_${j + 1}`, j + 0.5, 0.3, { color: 'teal', size: 15 });
      if (showMarg) s.text(v.fix(st.py[j], 2), j + 0.5, -nr - 0.45, { align: 'center', size: 12, color: 'teal', weight: 600 });
    }
    for (let i = 0; i < nr; i++) {
      s.tex(`${xName}_${i + 1}`, -0.35, -i - 0.5, { color: 'accent', size: 15 });
      if (showMarg) s.text(v.fix(st.px[i], 2), nc + 0.38, -i - 0.5, { align: 'center', size: 12, color: 'accent', weight: 600 });
    }
  }
  return st;
}
