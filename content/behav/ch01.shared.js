// Behavioural Economics — Chapter 1: helpers shared by ch01.js and ch01-b.js
// (number formatting, the St Petersburg game under Bernoulli's logarithm, the Marschak–Machina probability triangle).

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** 12345.6 → "12,346" (real minus sign). */
export function money(x, d = 0) {
  if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
  const s = Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return (x < 0 ? '−' : '') + s;
}

/** Large numbers in words: 2.5 million, 3.1 billion, … */
export function big(x, digits = 3) {
  if (!isFinite(x)) return '∞';
  const a = Math.abs(x);
  const units = [[1e18, 'quintillion'], [1e15, 'quadrillion'], [1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million']];
  for (const [u, name] of units) if (a >= u) return `${+(x / u).toPrecision(digits)} ${name}`;
  return money(x, a < 10 ? 2 : 0);
}

// ------------------------------------------------------------------ St Petersburg
/** Bernoulli's value of Paul's game to its owner with fortune a (log utility): Π (a + 2^{k−1})^{2^{−k}} − a (Menger's footnote formula). */
export function bernValue(a) {
  let s = 0;
  for (let k = 1; k <= 90; k++) s += Math.pow(2, -k) * Math.log(a + Math.pow(2, k - 1));
  return Math.exp(s) - a;
}

/** The most a buyer with fortune a > 0 should pay: Σ 2^{−k} ln(a + 2^{k−1} − x) = ln a. */
export function bernPrice(a) {
  const f = (x) => { let s = 0; for (let k = 1; k <= 90; k++) s += Math.pow(2, -k) * Math.log(a + Math.pow(2, k - 1) - x); return s - Math.log(a); };
  let lo = 0, hi = a + 1 - 1e-12;
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  return lo;
}

/** Expected value of the game when the banker can pay at most B: L/2 + B·2^{−L}, L = number of payouts paid in full. */
export function spBanker(B) {
  const L = Math.floor(Math.log2(B) + 1e-12) + 1;
  return { L, ev: L / 2 + B * Math.pow(2, -L) };
}

// ------------------------------------------------------------------ the probability triangle
// Lotteries over three prizes x1 < x2 < x3 are points (p1, p3): p1 = P(worst) to the right, p3 = P(best) up, p2 = 1 − p1 − p3.
// Vertices: (0,0) = x2 for sure, (1,0) = x1 for sure, (0,1) = x3 for sure.

/** Keep a point inside the triangle (for handles). */
export function intoTri(x, y) {
  x = Math.max(0, x); y = Math.max(0, y);
  const s = x + y; if (s > 1) { x /= s; y /= s; }
  return [x, y];
}

/**
 * A preference over lotteries with straight-line indifference curves.
 * kind 'eu': parallel lines of slope k (expected utility with u1 = 0, u2 = m, u3 = 1, k = m/(1−m)).
 * kind 'out' / 'in': lines through a focal point F south-west (fanning out) or north-east (fanning in) of the triangle,
 * equal to slope k near the centre C; strength f ∈ (0, 1] moves F closer. value(p) is the height where the indifference line
 * through p meets the left edge p1 = 0 (a "p3-equivalent"), so it increases toward x3 and decreases toward x1.
 */
export function makePref(kind, m, f = 0.6, C = [0.3, 0.25]) {
  const k = m / (1 - m);
  if (kind === 'eu' || f <= 0) {
    return { kind: 'eu', k, m, F: null, value: (p1, p3) => p3 - k * p1, eu: (p1, p3) => m * (1 - p1 - p3) + p3, slope: () => k };
  }
  let lam = 0.55 / f;
  if (kind === 'out') lam = Math.max(lam, C[0] + 0.15, C[1] / k + 0.15);
  else lam = Math.max(lam, 1 - C[0] + 0.15, (1 - C[1]) / k + 0.15);
  const F = kind === 'out' ? [C[0] - lam, C[1] - lam * k] : [C[0] + lam, C[1] + lam * k];
  return {
    kind, k, m, F,
    value: (p1, p3) => F[1] + ((p3 - F[1]) * F[0]) / (F[0] - p1),
    slope: (p1, p3) => (p3 - F[1]) / (p1 - F[0]),
  };
}

/** Clip the line through (px, py) with direction (dx, dy) to the triangle; returns [[x0, y0], [x1, y1]] or null. */
export function clipTri(px, py, dx, dy) {
  // half-planes: x ≥ 0, y ≥ 0, x + y ≤ 1, written as n·P ≤ c
  const H = [[-1, 0, 0], [0, -1, 0], [1, 1, 1]];
  let t0 = -1e9, t1 = 1e9;
  for (const [nx, ny, c] of H) {
    const num = c - (nx * px + ny * py), den = nx * dx + ny * dy;
    if (Math.abs(den) < 1e-14) { if (num < 0) return null; continue; }
    const t = num / den;
    if (den > 0) t1 = Math.min(t1, t); else t0 = Math.max(t0, t);
  }
  if (t1 - t0 < 1e-9) return null;
  return [[px + t0 * dx, py + t0 * dy], [px + t1 * dx, py + t1 * dy]];
}

/** The indifference line of `pref` through the point (x, y), clipped to the triangle. */
export function indiffThrough(pref, x, y) {
  if (!pref.F) return clipTri(x, y, 1, pref.k);
  return clipTri(x, y, x - pref.F[0], y - pref.F[1]);
}

/** Draw n indifference lines, spaced along the hypotenuse (every line with positive slope crosses it). */
export function drawIndiff(s, pref, { n = 13, color = 'blue', width = 1.1, alpha = 0.55, dash } = {}) {
  for (let j = 0; j < n; j++) {
    const t = (j + 0.5) / n, seg = indiffThrough(pref, 1 - t, t);
    if (seg) s.line(seg[0][0], seg[0][1], seg[1][0], seg[1][1], { color, width, alpha, dash });
  }
}

/** The triangle frame with axes, ticks and vertex labels (placed outside the triangle). labels = [x1, x2, x3] prize names. */
export function drawTriangle(s, labels, { fill = true, ticks = true, size = 11.5 } = {}) {
  if (fill) s.poly([[0, 0], [1, 0], [0, 1]], { fill: 'grid', fillAlpha: 0.35, stroke: false });
  s.path([[0, 0], [1, 0], [0, 1], [0, 0]], { color: 'ink', width: 1.4 });
  if (ticks) {
    for (const t of [0.25, 0.5, 0.75]) {
      s.line(t, 0, t, -0.015, { color: 'muted', width: 1 }); s.line(0, t, -0.015, t, { color: 'muted', width: 1 });
    }
    s.text('0.5', 0.5, 0, { dy: 11, align: 'center', size: 10.5, color: 'muted' });
    s.text('0.5', 0, 0.5, { dx: -7, align: 'right', size: 10.5, color: 'muted' });
    s.text('p₁ = P(' + labels[0] + ') →', 0.5, 0, { dy: 27, align: 'center', size: 11, color: 'muted' });
    s.text('↑ p₃ = P(' + labels[2] + ')', 0, 1, { dx: -6, dy: -17, align: 'left', size: 11, color: 'muted' });
  }
  s.text(labels[1] + ' for sure', 0, 0, { dx: -6, dy: 12, size, color: 'ink', weight: 600 });
  s.text(labels[0] + ' for sure', 1, 0, { dx: 6, dy: 12, size, align: 'right', color: 'ink', weight: 600 });
  s.text(labels[2] + ' for sure', 0, 1, { dx: 12, dy: 1, size, color: 'ink', weight: 600 });
}

/** A dollar amount for rich text: "$\$12{,}345$" (no stray spaces after the thousands commas). */
export const usd = (x, d = 0) => '$\\$' + money(x, d).replace(/,/g, '{,}') + '$';
