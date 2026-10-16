// Microeconomics — Chapter 8: helpers shared by ch08.js and ch08-b.js (plain named exports).
// Visual language follows chapter 7: average cost `accent`, average variable cost `teal`, marginal cost `orange`, total cost
// `ink`; the price line (the firm's flat demand) `ink`/`gold`; profit areas `green` (gain) and `red` (loss); market demand
// `blue`, market supply `orange`. Generic helpers and the homothetic technology / cost-curve builders are copied from
// ch07.shared.js (a chapter may import only its own shared file). Every curve is computed from the production function:
// variable cost is the wage times the labour the technology needs, marginal cost its numerical derivative, and the firm's
// output is found by maximizing profit by search, so readouts can compare it with the P = MC rule instead of assuming it.

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const GUIDE = { color: 'muted', width: 1, dash: [3, 3] };
export const LBL = { size: 12, weight: 700 };
/** Show or hide a whole stage (panel). */
export const showStage = (S, on) => { S.el.hidden = !on; S.el.style.display = on ? '' : 'none'; };
/** Signed number with a real minus sign, e.g. +1.23 / −0.40. */
export const sgn = (x, d = 2) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(d)}`;
/** Number with a real minus sign. */
export const fx = (x, d = 2) => (x < 0 && Math.abs(x) >= 0.5 * 10 ** -d ? '−' : '') + Math.abs(x).toFixed(d);

/** Root of f on [a, b] by bisection; null when f does not change sign. */
export function bisect(f, a, b, it = 60) {
  let fa = f(a); const fb = f(b);
  if (!(isFinite(fa) && isFinite(fb))) return null;
  if (fa === 0) return a; if (fb === 0) return b;
  if (fa * fb > 0) return null;
  for (let i = 0; i < it; i++) { const m = (a + b) / 2, fm = f(m); if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; }
  return (a + b) / 2;
}
/** Maximise f on [a, b]: scan n + 1 points, then golden-section search on the bracket of the best one. → {x, f} */
export function argmax(f, a, b, n = 48, it = 56) {
  const h = (b - a) / n; let bi = 0, bv = -Infinity;
  for (let i = 0; i <= n; i++) { const w = f(a + i * h); if (w > bv) { bv = w; bi = i; } }
  let lo = a + Math.max(0, bi - 1) * h, hi = a + Math.min(n, bi + 1) * h;
  const phi = (Math.sqrt(5) - 1) / 2;
  let c = hi - phi * (hi - lo), d = lo + phi * (hi - lo), fc = f(c), fd = f(d);
  for (let k = 0; k < it; k++) { if (fc < fd) { lo = c; c = d; fc = fd; d = lo + phi * (hi - lo); fd = f(d); } else { hi = d; d = c; fd = fc; c = hi - phi * (hi - lo); fc = f(c); } }
  const xm = (lo + hi) / 2, fm = f(xm);
  return fm > bv ? { x: xm, f: fm } : { x: a + bi * h, f: bv };
}
export const argmin = (f, a, b, n, it) => { const r = argmax((x) => -f(x), a, b, n, it); return { x: r.x, f: -r.f }; };
/** Central difference. */
export const dif = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
/** Text label on a plate at a data point. */
export function plateText(s, str, x, y, st = {}) { s.text(str, x, y, { plate: true, size: 11.5, weight: 600, ...st }); }
/** A line through (x0, y0) with slope m, drawn half-length `len` pixels each way (works on unequal axes). */
export function slopeLine(s, x0, y0, m, len, st) {
  const px = s.X(1) - s.X(0), py = s.Y(0) - s.Y(1), dx = 1, dy = m, L = Math.hypot(dx * px, dy * py) || 1, k = len / L;
  s.clip(() => s.line(x0 - k * dx, y0 - k * dy, x0 + k * dx, y0 + k * dy, st));
}
/** Sample a function on [a, b] into a polyline (non-finite values break the line). */
export function sample(f, a, b, n = 160) { const pts = []; for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n, y = f(x); pts.push(isFinite(y) ? [x, y] : null); } return pts; }
/** Vertical bar from y0 to y1 centred at x. */
export function bar(s, x, w, y0, y1, col, st = {}) { s.rect(x - w / 2, Math.min(y0, y1), x + w / 2, Math.max(y0, y1), { fill: col, fillAlpha: st.fillAlpha ?? 0.75, color: col, width: 1.2, ...st }); }
/** Label at the right end of a curve y = f(x), placed at the largest x ≤ xr where the curve is inside the window. */
export function curveLabel(s, f, txt, col, xr, st = {}) {
  const [y0, y1] = s.bounds.y, [x0] = s.bounds.x;
  for (let k = 0; k <= 60; k++) {
    const x = xr - ((xr - x0) * k) / 60, y = f(x);
    if (isFinite(y) && y > y0 + 0.04 * (y1 - y0) && y < y1 - 0.06 * (y1 - y0)) { s.text(txt, x, y, { dx: -4, dy: -10, size: 11.5, weight: 700, color: col, align: 'right', ...st }); return; }
  }
}

// ------------------------------------------------------------------------------------------------ technology
/**
 * Scale function of a homothetic technology f(L, K) = H(L^a K^(1−a)) (copied from ch07.shared.js): Z(y) = ys·ζ(y/ys) is
 * the amount of the constant-returns index z = L^a K^(1−a) needed to make y; long-run cost is κ(w, r)·Z(y).
 *   'U'    ζ(t) = α t^e1 + (1 − α) t^e2: increasing returns at small scale, decreasing at large scale.
 *   'crs'  ζ(t) = t.
 *   'cubic' ζ(t) = √((t − β t² + t³)/(2 − β)), 0 < β < √3 (new here): with a = ½ and capital fixed, variable cost
 *          w Z²/K̄ is a cubic in y, so marginal cost starts at a finite level, falls and rises — the textbook U — and
 *          long-run average cost 2√(wr)·Z(y)/y is U-shaped with its minimum at y = ys.
 */
export function scaleFn(kind, P = {}) {
  const ys = P.ys ?? 6;
  let z;
  switch (kind) {
    case 'U': { const e1 = P.e1 ?? 1 / 3, e2 = P.e2 ?? 2, al = (e2 - 1) / (e2 - e1); z = (t) => al * t ** e1 + (1 - al) * t ** e2; break; }
    case 'crs': z = (t) => t; break;
    case 'cubic': { const b = P.beta ?? 1.6; z = (t) => Math.sqrt(Math.max(0, (t - b * t * t + t * t * t) / (2 - b))); break; }
    default: throw new Error('unknown scale function ' + kind);
  }
  const Z = (y) => (y <= 0 ? 0 : ys * z(y / ys));
  const Zinv = (q) => { if (q <= 0) return 0; let hi = ys; while (Z(hi) < q && hi < 1e9) hi *= 2; return bisect((y) => Z(y) - q, 0, hi, 64) ?? hi; };
  const dZ = (y) => { const h = 1e-6 * Math.max(1, y); return y > h ? (Z(y + h) - Z(y - h)) / (2 * h) : (Z(y + h) - Z(y)) / h; };
  return { Z, Zinv, dZ, ys, kind };
}
/** Homothetic technology H(L^a K^(1−a)) (the 'hom' case of ch07's tech): f, cmin(w, r, y) → {x: [L, K], c}, srL(y, K). */
export function homTech(S, a = 0.5) {
  const core = (L, K) => (L <= 0 || K <= 0 ? 0 : L ** a * K ** (1 - a));
  return {
    S, a, f: (L, K) => S.Zinv(core(L, K)),
    cmin: (w, r, y) => { const z = S.Z(y), L = z * ((a * r) / ((1 - a) * w)) ** (1 - a), K = z * (((1 - a) * w) / (a * r)) ** a; return { x: [L, K], c: w * L + r * K }; },
    /** labour needed for y with capital fixed at K */
    srL: (y, K) => (S.Z(y) / K ** (1 - a)) ** (1 / a),
  };
}
/**
 * The chapter's standard technology: f = H(√(LK)) with the 'cubic' scale function, efficient scale y = 6. At w = r = 10
 * the plant K̄ = 6 is the right one for y = 6, fixed cost is 60, and short-run cost is TC = 60 + 150(t − 1.6t² + t³),
 * t = y/6: MC starts at 25, bottoms out at y = 3.2, and crosses AVC at its minimum 9 (y = 4.8) and AC at its minimum
 * 20 (y = 6), which is also the minimum of long-run average cost. Chapter 7's UTECH has the same efficient scale.
 */
export const CTECH = (beta = 1.6) => homTech(scaleFn('cubic', { ys: 6, beta }), 0.5);

/**
 * Short-run and long-run cost curves of a homothetic technology at input prices w, r with capital fixed at Kb
 * (copied from ch07.shared.js). All curves come from the labour requirement, not from a cost formula.
 */
export function costCurves(T, w, r, Kb) {
  const FC = r * Kb;
  const VC = (y) => w * T.srL(y, Kb);
  const TC = (y) => FC + VC(y);
  const MC = (y) => dif(TC, Math.max(y, 2e-5), 1e-5 * Math.max(1, y));
  const LTC = (y) => T.cmin(w, r, y).c;
  const LMC = (y) => dif(LTC, Math.max(y, 2e-5), 1e-5 * Math.max(1, y));
  const out = { FC, VC, TC, MC, LTC, LMC, AVC: (y) => VC(y) / y, AC: (y) => TC(y) / y, AFC: (y) => FC / y, LAC: (y) => LTC(y) / y };
  out.minAVC = (ymax = 40) => argmin(out.AVC, 1e-3, ymax, 200, 70);
  out.minAC = (ymax = 40) => argmin(out.AC, 1e-3, ymax, 200, 70);
  return out;
}

// ------------------------------------------------------------------------------------------------ the competitive firm
/**
 * A price-taking firm with technology T, input prices w, r and plant Kb (fixed cost r·Kb, sunk in the short run).
 *   qMC(p)     output on the rising branch of MC where MC = p (bisection), or 0 if p is below the bottom of MC;
 *   supply(p)  the P = MC rule with the shutdown rule: qMC(p) if p ≥ min AVC, else 0;
 *   best(p)    profit maximized by brute-force search over q ∈ [0, qmax] (golden section) and compared with q = 0:
 *              {q, pi} — independent of the MC rule;
 *   profit(p)  maximized profit (the profit function π(p)), using the MC rule;
 *   pShut/qShut, pBE/qBE: shutdown point (min AVC) and break-even point (min AC).
 */
export function firm(T, w = 10, r = 10, Kb = 6, qmax = 30) {
  const C = costCurves(T, w, r, Kb);
  const mMC = argmin(C.MC, 1e-3, qmax, 240, 70), sh = C.minAVC(qmax), be = C.minAC(qmax);
  const qMC = (p) => { if (p <= mMC.f) return 0; let hi = Math.max(mMC.x * 2, 1); while (C.MC(hi) < p && hi < 1e4) hi *= 1.6; return bisect((q) => C.MC(q) - p, mMC.x, hi, 60) ?? 0; };
  const supply = (p) => (p < sh.f ? 0 : qMC(p));
  const prof = (p, q) => p * q - (q > 0 ? C.TC(q) : C.FC);
  const profit = (p) => prof(p, supply(p));
  const best = (p) => { const m = argmax((q) => prof(p, q), 1e-4, qmax, 300, 70); return m.f > -C.FC ? { q: m.x, pi: m.f } : { q: 0, pi: -C.FC }; };
  return { T, w, r, Kb, C, FC: C.FC, mMC, pShut: sh.f, qShut: sh.x, pBE: be.f, qBE: be.x, qMC, supply, profit, prof, best };
}

/** Market price at which N identical firms (supply s) meet demand D(p) (decreasing); bisection on excess supply. */
export function clearing(s, N, D, pmax = 200) {
  const ex = (p) => N * s(p) - D(p);
  if (ex(pmax) < 0) return { p: pmax, Q: D(pmax) };
  const p = bisect(ex, 1e-6, pmax, 70) ?? 1e-6;
  return { p, Q: D(p) };
}

// ------------------------------------------------------------------------------------------------ drawing
/** The firm's per-unit cost curves on stage s up to output X: AVC teal, AC accent, MC orange (labels at the right). */
export function drawCosts(s, F, X, o = {}) {
  const C = F.C, a = o.alpha ?? 1, lab = o.labels !== false;
  if (o.avc !== false) s.fn(C.AVC, { domain: [0.03, X], color: 'teal', width: o.width ?? 2.4, alpha: a });
  if (o.ac !== false) s.fn(C.AC, { domain: [0.2, X], color: 'accent', width: o.width ?? 2.6, alpha: a });
  if (o.mc !== false) s.fn(C.MC, { domain: [0.01, X], color: 'orange', width: (o.width ?? 2.4) + 0.2, alpha: a, n: 240 });
  if (lab) {
    const xr = X * 0.97;
    if (o.ac !== false) curveLabel(s, C.AC, 'AC', 'accent', xr);
    if (o.avc !== false) curveLabel(s, C.AVC, 'AVC', 'teal', xr, { dx: 4, dy: 13 });
    if (o.mc !== false) curveLabel(s, C.MC, 'MC', 'orange', xr, { dx: -8, dy: 0, align: 'right' });
  }
}
/** Profit rectangle between the price p and average cost ac over [0, q]: green for a profit, red for a loss. */
export function profitRect(s, q, p, ac, o = {}) {
  if (!(q > 0)) return;
  const gain = p >= ac;
  s.rect(0, Math.min(p, ac), q, Math.max(p, ac), { fill: gain ? 'green' : 'red', fillAlpha: o.fillAlpha ?? 0.28, color: gain ? 'green' : 'red', width: 1.2, hatch: gain ? false : 'red', hatchAlpha: 0.3 });
}
/** Horizontal price line (the firm's perfectly elastic demand) with a label at its right end. */
export function priceLine(s, p, label = 'P = MR', o = {}) {
  s.hline(p, { color: o.color ?? 'ink', width: o.width ?? 2, dash: o.dash });
  if (label) s.text(label, s.bounds.x[1], p, { dx: -6, dy: -9, size: 11.5, weight: 700, color: o.color ?? 'ink', align: 'right', plate: true });
}
