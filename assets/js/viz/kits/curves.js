// Curves kit — economics-style diagrams. Reference: docs/kits-world.md.
//
//   const s = v.stage({ x: [0, 100], y: [0, 100], axes: 'box', xlabel: 'Q', ylabel: 'P' });
//   const E = v.curves(s, { demand: { linear: [[10, 90], [90, 15]] }, supply: { linear: [[10, 12], [90, 80]] }, tax: () => t.value });
//   v.render(() => E.draw());   v.readout(() => `DWL = ${v.fix(E.result.dwl, 1)}`);
//
// Markets: curves are inverse functions P(Q) given as { linear: [[q, p], [q, p]] } (two draggable handles),
// { points: [[q, p], …] } (monotone cubic through draggable handles: "curved"), or { fn: q => p } (fixed), each with
// optional shift: () => ΔQ (horizontal shift; the original is drawn dashed). Policies: tax (per unit; negative =
// subsidy), ceiling, floor (numbers or functions). E.result is computed numerically (bisection + Simpson): equilibrium,
// quantities and prices, consumer/producer surplus, tax revenue, deadweight loss, shortage/surplus.
// Consumers: { utility: 'cobb-douglas' | 'substitutes' | 'complements' | 'quasilinear' | (x, y) => u, alpha, income,
// prices: [px, py] } → budget line with intercept handles (dragging one pivots the line), optimal bundle by golden-section
// search, indifference curves by marching squares. Frontiers: { frontier: {a, b, k} } (PPF) with a draggable bundle.
// Also E.curve(fn, st) for any labelled curve (cost curves), E.lorenz(incomes) (Gini). DOM-free helpers: v.econ(name, …).

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const val = (f, ...a) => (typeof f === 'function' ? f(...a) : f);

// ------------------------------------------------------------------ numerics (DOM-free)
/** Composite Simpson rule. */
export function simpson(f, a, b, n = 400) { if (a === b) return 0; n += n % 2; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3; }
/** Root of f on [a, b] by bisection (null if no sign change). */
export function root(f, a, b, tol = 1e-10) { let fa = f(a), fb = f(b); if (!isFinite(fa) || !isFinite(fb)) return null; if (fa === 0) return a; if (fb === 0) return b; if (fa * fb > 0) return null; for (let i = 0; i < 200 && b - a > tol; i++) { const m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; } } return (a + b) / 2; }
/** Monotone cubic (Fritsch–Carlson) through points sorted by x; linear extrapolation outside. */
export function monotone(pts) {
  const n = pts.length, x = pts.map((p) => p[0]), y = pts.map((p) => p[1]);
  if (n === 2) { const k = (y[1] - y[0]) / (x[1] - x[0]); return (q) => y[0] + k * (q - x[0]); }
  const d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
  return (q) => {
    if (q <= x[0]) return y[0] + m[0] * (q - x[0]); if (q >= x[n - 1]) return y[n - 1] + m[n - 1] * (q - x[n - 1]);
    let i = 0; while (q > x[i + 1]) i++; const h = x[i + 1] - x[i], t = (q - x[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * y[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
/**
 * Market outcome for inverse demand D(q), inverse supply S(q) on [0, qmax] with one policy: {tax, ceiling, floor}.
 * Returns {q0, p0 (free market), q, pb (buyers pay), ps (sellers get), cs, ps_, rev, dwl, total, total0, shortage, excess, binding}.
 */
export function market(D, S, qmax, pol = {}) {
  const I = (f, a, b) => simpson(f, a, b, 400);
  const q0 = root((q) => D(q) - S(q), 0, qmax); if (q0 == null) return null;
  const p0 = D(q0), cs0 = I((q) => D(q) - p0, 0, q0), ps0 = I((q) => p0 - S(q), 0, q0), out = { q0, p0, cs0, ps0, total0: cs0 + ps0, binding: null, rev: 0, shortage: 0, excess: 0 };
  const inv = (F, p) => { const r = root((q) => F(q) - p, 0, qmax); if (r != null) return r; const up = F(qmax) > F(0); return (up ? F(0) > p : F(0) < p) ? 0 : qmax; }; // quantity at price p (clamped to [0, qmax])
  const t = pol.tax || 0;
  let q = q0, pb = p0, ps = p0;
  if (t) { q = root((x) => D(x) - S(x) - t, 0, qmax) ?? 0; pb = D(q); ps = pb - t; out.rev = t * q; out.binding = t > 0 ? 'tax' : 'subsidy'; }
  else if (pol.ceiling != null && pol.ceiling < p0) { const p = pol.ceiling; q = inv(S, p); pb = ps = p; out.shortage = inv(D, p) - q; out.binding = 'ceiling'; }
  else if (pol.floor != null && pol.floor > p0) { const p = pol.floor; q = inv(D, p); pb = ps = p; out.excess = inv(S, p) - q; out.binding = 'floor'; }
  Object.assign(out, { q, pb, ps, cs: I((x) => D(x) - pb, 0, q), psur: I((x) => ps - S(x), 0, q), dwl: I((x) => D(x) - S(x), q, q0) });
  out.total = out.cs + out.psur + out.rev; // net of the subsidy's cost when t < 0 (rev < 0)
  return out;
}
/** Utility functions u(x, y) by name. */
export function utility(kind = 'cobb-douglas', a = 0.5, b = 1) {
  if (typeof kind === 'function') return kind;
  switch (kind) {
    case 'cobb-douglas': return (x, y) => (x <= 0 || y <= 0 ? 0 : x ** a * y ** (1 - a));
    case 'substitutes': return (x, y) => a * x + b * y;
    case 'complements': return (x, y) => Math.min(a * x, b * y);
    case 'quasilinear': return (x, y) => a * Math.log(Math.max(x, 1e-12)) + y;
    case 'ces': return (x, y) => (x <= 0 || y <= 0 ? 0 : (0.5 * x ** b + 0.5 * y ** b) ** (1 / b));
    default: throw new Error(`v.curves: unknown utility "${kind}"`);
  }
}
/** Utility-maximising bundle on the budget px x + py y = m (golden-section on the budget line; handles corners and kinks). */
export function optimum(U, px, py, m) {
  const g = (x) => U(x, (m - px * x) / py), X = m / px, phi = (Math.sqrt(5) - 1) / 2;
  let a = 0, b = X, c = b - phi * (b - a), d = a + phi * (b - a), fc = g(c), fd = g(d);
  for (let i = 0; i < 120; i++) { if (fc < fd) { a = c; c = d; fc = fd; d = a + phi * (b - a); fd = g(d); } else { b = d; d = c; fd = fc; c = b - phi * (b - a); fc = g(c); } }
  let x = (a + b) / 2; for (const e of [0, X]) if (g(e) >= g(x) - 1e-12 && Math.abs(e - x) < X * 1e-6 || g(e) > g(x) + 1e-12) x = e; // snap to corner solutions (perfect substitutes)
  return { x, y: (m - px * x) / py, u: g(x) };
}
/** Marginal rate of substitution U_x / U_y (central differences). */
export function mrs(U, x, y, h = 1e-6) { const ux = (U(x + h, y) - U(x - h, y)) / (2 * h), uy = (U(x, y + h) - U(x, y - h)) / (2 * h); return ux / uy; }
/** Contour segments of f = level over a grid on [x0, x1] × [y0, y1] (marching squares) → [[p, q], …]. */
export function contour(f, level, [x0, x1], [y0, y1], n = 120) {
  const nx = n, ny = n, dx = (x1 - x0) / nx, dy = (y1 - y0) / ny, F = new Float64Array((nx + 1) * (ny + 1)), segs = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) F[j * (nx + 1) + i] = f(x0 + i * dx, y0 + j * dy) - level;
  const lerp = (a, b, fa, fb) => a + (b - a) * (fa / (fa - fb));
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = F[j * (nx + 1) + i], b = F[j * (nx + 1) + i + 1], c = F[(j + 1) * (nx + 1) + i + 1], d = F[(j + 1) * (nx + 1) + i];
    const X = x0 + i * dx, Y = y0 + j * dy, pts = [];
    if ((a < 0) !== (b < 0)) pts.push([lerp(X, X + dx, a, b), Y]);
    if ((b < 0) !== (c < 0)) pts.push([X + dx, lerp(Y, Y + dy, b, c)]);
    if ((c < 0) !== (d < 0)) pts.push([lerp(X, X + dx, d, c), Y + dy]);
    if ((d < 0) !== (a < 0)) pts.push([X, lerp(Y, Y + dy, a, d)]);
    if (pts.length === 2) segs.push(pts); else if (pts.length === 4) { segs.push([pts[0], pts[1]], [pts[2], pts[3]]); }
  }
  return segs;
}
/** Lorenz curve of incomes → [[cumulative population share, cumulative income share], …] starting at [0, 0]. */
export function lorenz(incomes) { const v = incomes.slice().sort((a, b) => a - b), T = v.reduce((a, b) => a + b, 0), out = [[0, 0]]; let c = 0; v.forEach((x, i) => { c += x; out.push([(i + 1) / v.length, c / T]); }); return out; }
/** Gini coefficient = 1 − 2 × (area under the Lorenz curve) (exact for the piecewise-linear curve). */
export function gini(incomes) { const L = lorenz(incomes); let a = 0; for (let i = 1; i < L.length; i++) a += ((L[i][0] - L[i - 1][0]) * (L[i][1] + L[i - 1][1])) / 2; return 1 - 2 * a; }
/** Cubic cost family TC(q) = F + a q + b q² + c q³ → {TC, VC, AVC, AC, MC, minAC: {q, value}, minAVC: {q, value}}. */
export function costs({ F = 100, a = 20, b = -1.2, c = 0.03 } = {}) {
  const VC = (q) => a * q + b * q * q + c * q ** 3, TC = (q) => F + VC(q), AVC = (q) => a + b * q + c * q * q, AC = (q) => TC(q) / q, MC = (q) => a + 2 * b * q + 3 * c * q * q;
  const qv = -b / (2 * c), qa = root((q) => MC(q) - AC(q), Math.max(qv, 1e-6), qv * 20 + 1000) ?? qv;
  return { TC, VC, AVC, AC, MC, minAVC: { q: qv, value: AVC(qv) }, minAC: { q: qa, value: AC(qa) } };
}

// ================================================================== the kit
const ROLE = { demand: { color: 'blue', label: 'D', sign: -1 }, supply: { color: 'orange', label: 'S', sign: 1 } };
class Curves {
  constructor(api, rt, stage, spec = {}) {
    if (!stage || typeof stage.X !== 'function') throw new Error('v.curves(stage, spec): the first argument must be a 2D stage');
    this.api = api; this.rt = rt; this.s = stage; this.spec = spec; this.o = { shade: ['cs', 'ps', 'rev', 'dwl'], labels: true, guides: true, ...spec };
    this.c = {};
    for (const role of ['demand', 'supply']) if (spec[role]) this.c[role] = this._curve(role, spec[role]);
    if (spec.utility) this._consumer(spec);
    if (spec.frontier) this._frontier(spec.frontier);
    this._labels = [];
  }
  get bx() { return this.s.bounds.x; }
  get by() { return this.s.bounds.y; }
  // ---------------------------------------------------------------- market curves
  _curve(role, cs) {
    const R = ROLE[role], st = this.s, out = { role, spec: cs, color: cs.color || R.color, label: cs.label ?? R.label, handles: [] };
    const pts = cs.linear || cs.points;
    if (pts && cs.drag !== false) {
      const hs = out.handles, eps = 0.01 * ((this.bx[1] - this.bx[0]) || 1);
      pts.forEach(([q, p], i) => {
        const h = st.handle(q, p, { color: out.color, r: 6.5, constrain: (x, y) => { // keep the curve monotone: x increasing, y decreasing (demand) / increasing (supply)
          const L = hs[i - 1], Rr = hs[i + 1]; if (L) x = Math.max(x, L.x + eps); if (Rr) x = Math.min(x, Rr.x - eps);
          if (R.sign < 0) { if (L) y = Math.min(y, L.y - eps); if (Rr) y = Math.max(y, Rr.y + eps); } else { if (L) y = Math.max(y, L.y + eps); if (Rr) y = Math.min(y, Rr.y - eps); }
          return [x, y];
        } });
        hs.push(h);
      });
    }
    return out;
  }
  /** Inverse demand/supply as a function q → p (with the current handles and shift). */
  fn(role, shifted = true) {
    const c = this.c[role]; if (!c) return null; const cs = c.spec, sh = shifted ? val(cs.shift) || 0 : 0;
    let f; if (cs.fn) f = cs.fn; else { const pts = c.handles.length ? c.handles.map((h) => [h.x, h.y]) : (cs.linear || cs.points); f = monotone(pts); }
    return sh ? (q) => f(q - sh) : f;
  }
  get D() { return this.fn('demand'); }
  get S() { return this.fn('supply'); }
  /** Market outcome (see market()); computed fresh on each access. */
  get result() { const D = this.D, S = this.S; if (!D || !S) return null; return market(D, S, this.bx[1], { tax: val(this.spec.tax) || 0, ceiling: val(this.spec.ceiling), floor: val(this.spec.floor) }); }
  // ---------------------------------------------------------------- drawing helpers
  /** A labelled curve y = f(x) (labels are placed at the right end and nudged apart). st: stage style + {label, labelAt: x}. */
  curve(f, st = {}) {
    const s = this.s; s.fn(f, { width: 2.4, ...st, domain: st.domain || [this.bx[0], this.bx[1]] });
    if (st.label) this._queueLabel(f, st);
    return this;
  }
  _queueLabel(f, st) {
    const [x0, x1] = st.domain || this.bx, [y0, y1] = this.by; let x = st.labelAt ?? x1 - (x1 - x0) * 0.01;
    if (st.labelAt == null) { for (let k = 0; k < 60; k++) { const y = f(x); if (isFinite(y) && y >= y0 && y <= y1) break; x -= (x1 - x0) / 60; } }
    const y = f(x); if (isFinite(y)) this._labels.push({ x, y: clamp(y, y0, y1), text: st.label, color: st.color || 'ink' });
  }
  _flushLabels() {
    const s = this.s, L = this._labels.map((l) => ({ ...l, X: s.X(l.x), Y: s.Y(l.y) })).sort((a, b) => a.Y - b.Y); let last = -1e9;
    for (const l of L) { let Y = Math.max(l.Y - 10, last + 15); Y = clamp(Y, 9, s.height - 9); last = Y; s.textPx(l.text, Math.min(l.X + 4, s.width - 4), Y, { color: l.color, math: true, size: 16, align: l.X + 4 > s.width - 30 ? 'right' : 'left' }); }
    this._labels = [];
  }
  _area(name, poly, color, label, st = {}) {
    const s = this.s; if (poly.length < 3) return;
    s.poly(poly, { fill: color, fillAlpha: st.alpha ?? 0.22, stroke: false });
    if (label && this.o.labels) { let cx = 0, cy = 0, A = 0; for (let i = 0; i < poly.length; i++) { const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length], cr = x1 * y2 - x2 * y1; A += cr; cx += (x1 + x2) * cr; cy += (y1 + y2) * cr; } if (Math.abs(A) > 1e-12) { cx /= 3 * A; cy /= 3 * A; const big = Math.abs(A / 2) * s.sx * s.sy > 500; if (big) s.text(label, cx, cy, { color, size: 12, weight: 700, align: 'center' }); } }
  }
  _under(f, a, b, n = 60) { const out = []; for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; out.push([x, f(x)]); } return out; }
  /** Draw whatever the spec describes: market (areas, curves, equilibrium, policy lines), consumer, frontier. o overrides spec options. */
  draw(o = {}) {
    const op = { ...this.o, ...o };
    if (this.c.demand || this.c.supply) this._drawMarket(op);
    if (this.cons) this._drawConsumer(op);
    if (this.front) this._drawFrontier(op);
    this._flushLabels();
    return this;
  }
  _drawMarket(op) {
    const s = this.s, D = this.D, S = this.S, r = D && S ? this.result : null, shade = new Set(op.shade || []), t = val(this.spec.tax) || 0;
    const [qa, qb] = this.bx, [pa, pb] = this.by;
    if (r) {
      const col = { cs: 'blue', ps: 'orange', rev: 'green', dwl: 'red', ...op.areaColors };
      if (shade.has('cs') && r.q > 0) this._area('cs', [...this._under(D, 0, r.q), [r.q, r.pb], [0, r.pb]], col.cs, 'CS');
      if (shade.has('ps') && r.q > 0) this._area('ps', [[0, r.ps], [r.q, r.ps], ...this._under(S, r.q, 0)], col.ps, 'PS');
      if (shade.has('rev') && t && r.q > 0) this._area('rev', [[0, r.ps], [r.q, r.ps], [r.q, r.pb], [0, r.pb]], t > 0 ? col.rev : 'purple', t > 0 ? 'tax' : 'subsidy', { alpha: 0.2 });
      if (shade.has('dwl') && Math.abs(r.q0 - r.q) > 1e-9) { const lo = Math.min(r.q, r.q0), hi = Math.max(r.q, r.q0); this._area('dwl', [...this._under(D, lo, hi, 30), ...this._under(S, hi, lo, 30)], col.dwl, 'DWL', { alpha: 0.32 }); }
    }
    // shifted-from curves (dashed) and policy lines
    for (const role of ['demand', 'supply']) { const c = this.c[role]; if (c && val(c.spec.shift)) s.fn(this.fn(role, false), { color: c.color, width: 1.4, dash: [5, 4], alpha: 0.6 }); }
    if (t && S) this.curve((q) => S(q) + t, { color: 'orange', width: 1.6, dash: [7, 4], label: t > 0 ? 'S + t' : 'S − s' });
    const cap = val(this.spec.ceiling), flo = val(this.spec.floor);
    if (cap != null) { s.hline(cap, { color: 'red', width: 1.6, dash: [8, 4] }); s.text('ceiling', qb, cap, { align: 'right', dy: -9, color: 'red', size: 11.5 }); }
    if (flo != null) { s.hline(flo, { color: 'purple', width: 1.6, dash: [8, 4] }); s.text('floor', qb, flo, { align: 'right', dy: -9, color: 'purple', size: 11.5 }); }
    for (const role of ['demand', 'supply']) { const c = this.c[role]; if (c) this.curve(this.fn(role), { color: c.color, label: c.label }); }
    if (!r) { s.corner('no equilibrium in view', 'tr', { color: 'red' }); return; }
    // guides and markers
    if (op.guides) {
      const g = { color: 'muted', width: 1, dash: [3, 3] };
      s.line(0, r.p0, r.q0, r.p0, g); s.line(r.q0, pa, r.q0, r.p0, g);
      if (r.binding) { s.line(0, r.pb, r.q, r.pb, g); s.line(0, r.ps, r.q, r.ps, g); s.line(r.q, pa, r.q, Math.max(r.pb, r.ps), g); }
    }
    const tick = (y, lab, col) => s.tex(lab, qa, y, { dx: 30, dy: -1, color: col, size: 14, align: 'left', baseline: 'bottom' }); // clear of the axis tick labels
    const qlab = (x, lab, dx = 3) => s.tex(lab, x, pa, { dx, dy: -19, color: 'ink', size: 14, align: dx < 0 ? 'right' : 'left', baseline: 'bottom' });
    s.dot(r.q0, r.p0, { r: 4.5, color: 'ink', hollow: !!r.binding });
    tick(r.p0, 'P^*', 'ink'); qlab(r.q0, 'Q^*', r.binding && r.q > r.q0 ? -3 : 3);
    if (r.binding) {
      s.dot(r.q, r.pb, { r: 4.5, color: 'blue' }); s.dot(r.q, r.ps, { r: 4.5, color: 'orange' });
      if (r.binding === 'tax' || r.binding === 'subsidy') { tick(r.pb, 'P_b', 'blue'); tick(r.ps, 'P_s', 'orange'); s.measure(r.q - (qb - qa) * 0.02, r.ps, r.q - (qb - qa) * 0.02, r.pb, t > 0 ? 't' : 's', { color: t > 0 ? 'green' : 'purple', offset: -10 }); }
      qlab(r.q, r.binding === 'tax' || r.binding === 'subsidy' ? 'Q_t' : r.binding === 'ceiling' ? 'Q_c' : 'Q_f', r.q < r.q0 ? -3 : 3);
      if (r.shortage > 1e-9) { const p = r.pb, a = r.q, b = r.q + r.shortage; s.arrow(a, p, b, p, { color: 'red', width: 1.6, both: true, head: 6 }); s.text(`shortage`, (a + b) / 2, p, { dy: 10, align: 'center', color: 'red', size: 11.5 }); }
      if (r.excess > 1e-9) { const p = r.pb, a = r.q, b = r.q + r.excess; s.arrow(a, p, b, p, { color: 'purple', width: 1.6, both: true, head: 6 }); s.text(`surplus`, (a + b) / 2, p, { dy: -10, align: 'center', color: 'purple', size: 11.5 }); }
    }
  }
  // ---------------------------------------------------------------- consumer
  _consumer(sp) {
    const [px, py] = sp.prices || [1, 1], m = sp.income ?? 10, st = this.s;
    const hx = st.handle(m / px, 0, { color: 'accent', constrain: (x) => [Math.max(x, 1e-3 * this.bx[1]), 0], label: null });
    const hy = st.handle(0, m / py, { color: 'accent', constrain: (x, y) => [0, Math.max(y, 1e-3 * this.by[1])] });
    this.cons = { hx, hy, m };
  }
  /** Consumer state: {px, py, m, U, opt: {x, y, u}, mrs, ratio}. Income is fixed; intercept handles set the prices. */
  get consumer() {
    if (!this.cons) return null; const sp = this.spec, m = val(sp.income) ?? this.cons.m, { hx, hy } = this.cons;
    const px = m / hx.x, py = m / hy.y, U = utility(sp.utility, val(sp.alpha) ?? 0.5, val(sp.beta) ?? 1), opt = optimum(U, px, py, m);
    return { px, py, m, U, opt, mrs: mrs(U, Math.max(opt.x, 1e-6), Math.max(opt.y, 1e-6)), ratio: px / py };
  }
  _drawConsumer(op) {
    const s = this.s, C = this.consumer, { px, py, m, U, opt } = C, [x0, x1] = this.bx, [y0, y1] = this.by;
    s.poly([[0, 0], [m / px, 0], [0, m / py]], { fill: 'accent', fillAlpha: 0.07, stroke: false });
    const levels = op.levels || [0.45, 0.7, 1, 1.35, 1.75].map((k) => k * opt.u);
    for (const L of levels) {
      const on = Math.abs(L - opt.u) < 1e-9 * Math.max(1, opt.u), segs = contour(U, L, [Math.max(x0, 1e-6), x1], [Math.max(y0, 1e-6), y1], op.resolution ?? 110), pts = [];
      for (const [p, q] of segs) pts.push(p, q, null);
      s.path(pts, { color: on ? 'purple' : 'purple', width: on ? 2.4 : 1.2, alpha: on ? 1 : 0.45 });
    }
    s.line(m / px, 0, 0, m / py, { color: 'accent', width: 2.6 });
    if (op.guides !== false) { s.line(opt.x, 0, opt.x, opt.y, { color: 'muted', dash: [3, 3], width: 1 }); s.line(0, opt.y, opt.x, opt.y, { color: 'muted', dash: [3, 3], width: 1 }); }
    s.dot(opt.x, opt.y, { r: 5.5, color: 'green', label: op.optLabel ?? 'x*', labelPos: 'ne' });
    const xl = x0 + (x1 - x0) * 0.93, yl = root((y) => U(xl, y) - opt.u, Math.max(y0, 1e-9), y1); // where U = U* meets the right edge
    if (yl != null) this._labels.push({ x: xl, y: yl, text: 'U*', color: 'purple' });
  }
  // ---------------------------------------------------------------- production possibility frontier
  _frontier(f) { const st = this.s; this.front = { f, h: st.handle(f.point?.[0] ?? f.a * 0.5, f.point?.[1] ?? f.b * 0.5, { color: 'gold', label: f.label ?? 'A' }) }; }
  /** PPF state for (x/a)^k + (y/b)^k = 1: {x, y, onFrontier: 'inside' | 'on' | 'outside', yMax(x), cost (−dy/dx at the bundle's x)}. */
  get frontier() {
    if (!this.front) return null; const { f, h } = this.front, a = val(f.a), b = val(f.b), k = val(f.k) ?? 2;
    const Y = (x) => b * Math.max(0, 1 - (x / a) ** k) ** (1 / k), g = (h.x / a) ** k + (h.y / b) ** k;
    const x = clamp(h.x, 0, a * 0.999999), dy = (Y(x + 1e-6 * a) - Y(x - 1e-6 * a)) / (2e-6 * a);
    return { x: h.x, y: h.y, a, b, k, Y, level: g, status: Math.abs(g - 1) < 0.02 ? 'on' : g < 1 ? 'inside' : 'outside', cost: -dy };
  }
  _drawFrontier(op) {
    const s = this.s, F = this.frontier, { a, Y } = F, pts = this._under(Y, 0, a, 160);
    s.poly([[0, 0], ...pts], { fill: 'green', fillAlpha: 0.08, stroke: false });
    s.path(pts, { color: 'green', width: 2.6 });
    const col = F.status === 'on' ? 'green' : F.status === 'inside' ? 'gold' : 'red';
    this.front.h.color = col;
    if (F.status !== 'outside' && F.x < a) { const x = F.x, y = Y(x), c = F.cost, w = a * 0.12; s.line(x - w, y + c * w, x + w, y - c * w, { color: 'muted', width: 1.2, dash: [4, 3] }); s.dot(x, y, { r: 3, color: 'green' }); }
    this._labels.push({ x: a * 0.2, y: Y(a * 0.2), text: op.frontierLabel ?? 'PPF', color: 'green' });
  }
  // ---------------------------------------------------------------- Lorenz curve
  /** Draw the Lorenz curve of incomes on the unit square with the equality line and the Gini area. Returns the Gini coefficient. */
  lorenz(incomes, st = {}) {
    const s = this.s, L = lorenz(incomes), G = gini(incomes);
    s.poly([...L, [1, 1]].reverse().concat([[0, 0]]), { fill: st.fill || 'red', fillAlpha: st.fillAlpha ?? 0.18, stroke: false });
    s.line(0, 0, 1, 1, { color: 'muted', width: 1.4, dash: [5, 4] });
    s.path(L, { color: st.color || 'accent', width: 2.4 });
    if (st.label !== false) { const x = 0.6, f = monotone(L.filter((p, i) => i === 0 || p[0] > L[i - 1][0])), y = (x + f(x)) / 2; s.text(`Gini = ${G.toFixed(3)}`, x, y, { color: st.fill || 'red', size: 12.5, weight: 600, align: 'center' }); } // inside the Gini area
    return G;
  }
}

export default function curves(api, rt, stage, spec) { return new Curves(api, rt, stage, spec); }
export const ECON = { market, simpson, root, monotone, utility, optimum, mrs, contour, lorenz, gini, costs };
Object.assign(curves, ECON);
/** v.econ(name, ...args): market, simpson, root, monotone, utility, optimum, mrs, contour, lorenz, gini, costs; v.econ() → the table. */
export function econ(api, rt, name, ...args) {
  if (name == null) return ECON;
  const f = ECON[name]; if (!f) throw new Error(`v.econ: unknown helper "${name}" (${Object.keys(ECON).join(', ')})`);
  return f(...args);
}
