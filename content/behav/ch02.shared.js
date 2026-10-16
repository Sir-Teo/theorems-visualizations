// Behavioural Economics — Chapter 2: helpers shared by ch02.js and ch02-b.js
// (formatting, choice cards and bars, the prospect-theory value and weighting functions, cumulative and original
// prospect-theory evaluation, certainty equivalents, a normal quantile for return distributions).

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const inside = (r, x, y) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];

/** 12345.6 → "12,346" (real minus sign). */
export function num(x, d = 0) {
  if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
  const s = Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return (x < 0 && +s.replace(/,/g, '') !== 0 ? '−' : '') + s;
}
export const pct = (x, d = 0) => `${(100 * x).toFixed(d)}%`;
/** Money for canvas text: "$1,250" / "−$500" (one dollar sign, so it is never read as TeX). */
export const usdC = (x, d = 0) => (x < 0 ? '−' : '') + '$' + num(Math.abs(x), d);
/** Money for rich text (readouts, captions): "\$1,250". */
export const usdR = (x, d = 0) => (x < 0 ? '−' : '') + '\\$' + num(Math.abs(x), d);

// ------------------------------------------------------------------ prospect theory
/** Tversky–Kahneman (1992) one-parameter weighting function. */
export const wTK = (p, g) => (p >= 1 ? 1 : p <= 0 ? 0 : p ** g / (p ** g + (1 - p) ** g) ** (1 / g));
/** Prelec (1998) weighting function w(p) = exp(−b(−ln p)^a); b = 1 gives the one-parameter form with fixed point 1/e. */
export const wPrelec = (p, a, b = 1) => (p >= 1 ? 1 : p <= 0 ? 0 : Math.exp(-b * Math.pow(-Math.log(p), a)));
/** Power value function: x^α for gains, −λ(−x)^β for losses. */
export const vPT = (x, a, l, b = a) => (x >= 0 ? Math.pow(x, a) : -l * Math.pow(-x, b));
/** Inverse of vPT. */
export const vInv = (V, a, l, b = a) => (V >= 0 ? Math.pow(V, 1 / a) : -Math.pow(-V / l, 1 / b));

/** Default parameters: Tversky & Kahneman (1992), medians of individual fits. */
export const TK92 = { a: 0.88, b: 0.88, l: 2.25, g: 0.61, d: 0.69 };

/**
 * Cumulative prospect theory decision weights of a prospect [[x, p], …] (outcomes relative to the reference point).
 * Gains are ranked from best to worst and weighted by w⁺ of "this good or better"; losses from worst up, by w⁻ of
 * "this bad or worse". Returns [{x, p, pi}] in the order of the outcomes (sorted ascending).
 */
export function cptWeights(pros, par = TK92, wf = wTK) {
  const s = pros.filter(([, p]) => p > 0).map(([x, p]) => ({ x, p, pi: 0 })).sort((A, B) => A.x - B.x);
  let cum = 0;
  for (const o of s) if (o.x < 0) { const c1 = cum + o.p; o.pi = wf(Math.min(1, c1), par.d) - wf(cum, par.d); cum = c1; }
  cum = 0;
  for (let i = s.length - 1; i >= 0; i--) { const o = s[i]; if (o.x < 0) break; const c1 = cum + o.p; o.pi = wf(Math.min(1, c1), par.g) - wf(cum, par.g); cum = c1; }
  return s;
}
/** CPT value V = Σ π_i v(x_i). */
export function cptValue(pros, par = TK92, wf = wTK) {
  return cptWeights(pros, par, wf).reduce((S, o) => S + o.pi * vPT(o.x, par.a, par.l, par.b ?? par.a), 0);
}
/** CPT certainty equivalent (in the same units as the outcomes). */
export const cptCE = (pros, par = TK92, wf = wTK) => vInv(cptValue(pros, par, wf), par.a, par.l, par.b ?? par.a);
/** Original (1979) prospect theory, separable weights: V = Σ π(p_i) v(x_i) with π = w applied outcome by outcome. */
export function optValue(pros, par = TK92, wf = wTK) {
  return pros.reduce((S, [x, p]) => S + (x === 0 || p <= 0 ? 0 : wf(p, x > 0 ? par.g : par.d) * vPT(x, par.a, par.l, par.b ?? par.a)), 0);
}
export const EV = (pros) => pros.reduce((S, [x, p]) => S + x * p, 0);

/** Fixed point of a weighting function (where w(p) = p), by bisection on (0.01, 0.99). */
export function fixedPoint(w) {
  let lo = 0.01, hi = 0.99;
  if ((w(lo) - lo) * (w(hi) - hi) > 0) return null;
  const up = w(lo) > lo;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if ((w(m) > m) === up) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

/** Golden-section minimisation of f on [a, b]. */
export function golden(f, a, b, it = 60) {
  const r = (Math.sqrt(5) - 1) / 2;
  let c = b - r * (b - a), d = a + r * (b - a), fc = f(c), fd = f(d);
  for (let i = 0; i < it; i++) {
    if (fc < fd) { b = d; d = c; fd = fc; c = b - r * (b - a); fc = f(c); } else { a = c; c = d; fc = fd; d = a + r * (b - a); fd = f(d); }
  }
  return (a + b) / 2;
}

/** Standard normal quantile (Acklam's rational approximation, relative error < 1.2e−9). */
export function ninv(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - pl) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  const q = p - 0.5, r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// ------------------------------------------------------------------ drawing
/**
 * A clickable choice card on a stage: r = [x0, y0, x1, y1] in data units.
 * lines: text lines; chosen/dim: state; tag: big letter; sub: small note at the bottom left; segs = [[prob, colour, label], …]
 * draws a stacked probability bar along the bottom.
 */
export function card(s, r, { tag, lines = [], chosen = false, dim = false, sub, subColor, segs, size = 12.5 }) {
  const [x0, y0, x1, y1] = r;
  s.rect(x0, y0, x1, y1, { fill: chosen ? 'accent' : 'panel', fillAlpha: chosen ? 0.13 : 1, color: chosen ? 'accent' : 'faint', width: chosen ? 2.6 : 1.2, radius: 9 });
  const tx = tag ? 22 + 11 * tag.length : 12;
  if (tag) s.text(tag, x0, y1, { dx: 11, dy: 16, size: 16, weight: 800, color: chosen ? 'accent' : dim ? 'faint' : 'muted' });
  lines.forEach((t, i) => s.text(t, x0, y1, { dx: tx, dy: 15 + 16 * i, size, weight: 500, color: dim ? 'muted' : 'ink' }));
  if (sub) s.text(sub, x0, y0, { dx: tx, dy: segs ? -30 : -11, size: 11, color: subColor || (chosen ? 'accent' : 'muted'), weight: 600 });
  if (segs) {
    const bx0 = s.X(x0) + 12, bx1 = s.X(x1) - 12, by = s.Y(y0) - 13;
    let acc = 0;
    for (const [p, col, lab] of segs) {
      if (p <= 0) continue;
      const A = bx0 + (bx1 - bx0) * acc, B = bx0 + (bx1 - bx0) * (acc + p);
      const [xa] = s.inv(A, 0), [xb] = s.inv(B, 0), [, ya] = s.inv(0, by - 6), [, yb] = s.inv(0, by + 6);
      s.rect(xa, ya, xb, yb, { fill: col, fillAlpha: 0.75, color: 'panel', width: 1 });
      if (B - A > 40 && lab) s.text(lab, (xa + xb) / 2, (ya + yb) / 2, { align: 'center', size: 10, weight: 700, color: 'ink', halo: false });
      acc += p;
    }
  }
}

/** Horizontal bar chart in data units: rows = [{label, value, color, note, bold}], value axis 0..max mapped to [x0, x1]. */
export function hbars(s, rows, { x0, x1, yTop, rowH, max = 1, size = 11.5, fmt = (v) => pct(v), barFrac = 0.62 }) {
  rows.forEach((r, i) => {
    const yc = yTop - (i + 0.5) * rowH, h = (rowH * barFrac) / 2;
    s.rect(x0, yc - h, x1, yc + h, { fill: 'grid', fillAlpha: 0.5, stroke: false });
    const xv = x0 + ((x1 - x0) * clamp(r.value, 0, max)) / max;
    s.rect(x0, yc - h, xv, yc + h, { fill: r.color || 'accent', fillAlpha: r.alpha ?? 0.75, color: r.color || 'accent', width: 1 });
    if (r.label) s.text(r.label, x0, yc, { dx: -8, align: 'right', size, color: r.labelColor || 'ink', weight: r.bold ? 700 : 500 });
    s.text(r.note ?? fmt(r.value), xv, yc, { dx: 6, size, weight: 700, color: r.color || 'accent' });
  });
}

/** A small two-button choice inside a rectangle: returns the two half-rectangles [left, right]. */
export function halves(r, gap = 1) {
  const [x0, y0, x1, y1] = r, m = (x0 + x1) / 2;
  return [[x0, y0, m - gap / 2, y1], [m + gap / 2, y0, x1, y1]];
}
