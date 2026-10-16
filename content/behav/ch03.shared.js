// Behavioural Economics — Chapter 3: helpers shared by ch03.js and ch03-b.js
// (choice cards, number formatting, binomial tails, sequential search for Simon's satisficing, run statistics).

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const inside = (r, x, y) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];

/** 12345.6 → "12,346" (real minus sign). */
export function num(x, d = 0) {
  if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
  const s = Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return (x < 0 ? '−' : '') + s;
}
export const pct = (x, d = 0) => `${(100 * x).toFixed(d)}%`;

/**
 * A clickable choice card on a stage: r = [x0, y0, x1, y1] in data units.
 * lines: text lines; chosen/dim: state; sub: small right-aligned note (e.g. data after answering); tag: big letter.
 */
export function card(s, r, { tag, lines = [], chosen = false, dim = false, sub, subColor, size = 12.5 }) {
  const [x0, y0, x1, y1] = r;
  s.rect(x0, y0, x1, y1, { fill: chosen ? 'accent' : 'panel', fillAlpha: chosen ? 0.13 : 1, color: chosen ? 'accent' : 'faint', width: chosen ? 2.6 : 1.2, radius: 9 });
  const tx = tag ? 38 : 12;
  if (tag) s.text(tag, x0, y1, { dx: 12, dy: 17, size: 17, weight: 800, color: chosen ? 'accent' : dim ? 'faint' : 'muted' });
  lines.forEach((t, i) => s.text(t, x0, y1, { dx: tx, dy: 16 + 17 * i, size, weight: 500, color: dim ? 'muted' : 'ink' }));
  if (sub) s.text(sub, x1, y0, { dx: -10, dy: -11, size: 11.5, align: 'right', color: subColor || (chosen ? 'accent' : 'muted'), weight: 700 });
}

/** log of the binomial coefficient. */
function lchoose(n, k) { let s = 0; for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i); return s; }
/** P(X = k) for X ~ Bin(n, p). */
export function binomPmf(n, k, p) {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0; if (p >= 1) return k === n ? 1 : 0;
  return Math.exp(lchoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
/** P(X ≥ k) for X ~ Bin(n, p). */
export function binomTail(n, k, p) { let s = 0; for (let j = Math.max(0, k); j <= n; j++) s += binomPmf(n, j, p); return s; }

// ------------------------------------------------------------------ sequential search (Simon's house seller)
// Offers arrive one per period, independent and uniform on [L, H]; each look costs c. Without recall, the optimal
// rule is a reservation price r*: accept the first offer ≥ r*, where c = E[(X − r*)+] = (H − r*)² / (2 (H − L)),
// and the expected net payoff of the optimal rule equals r* itself.

/** Optimal reservation price for uniform offers on [L, H] and search cost c per look. */
export function reservation(L, H, c) { return Math.max(L, H - Math.sqrt(2 * c * (H - L))); }
/** Expected net payoff of "accept the first offer ≥ a" (a fixed aspiration): E[X | X ≥ a] − c · E[looks]. */
export function satisficeValue(L, H, c, a) {
  a = clamp(a, L, H - 1e-9);
  const q = (H - a) / (H - L);
  return (a + H) / 2 - c / q;
}
/** Expected number of looks for a fixed aspiration a. */
export function satisficeLooks(L, H, a) { return (H - L) / Math.max(1e-9, H - clamp(a, L, H)); }

// ------------------------------------------------------------------ runs in binary sequences
/** Longest run and number of alternations of an array of 0/1. */
export function runStats(seq) {
  let longest = 0, cur = 0, alt = 0;
  for (let i = 0; i < seq.length; i++) {
    if (i > 0 && seq[i] !== seq[i - 1]) { alt++; cur = 1; } else cur++;
    longest = Math.max(longest, cur);
  }
  return { longest, alt, rate: seq.length > 1 ? alt / (seq.length - 1) : 0 };
}

/** Small horizontal bar chart in data units: rows = [{label, value, color, note}], value axis 0..max at [x0, x1]. */
export function hbars(s, rows, { x0, x1, yTop, rowH, max = 1, labelW = 0, size = 11.5, fmt = (v) => pct(v), barFrac = 0.62 }) {
  rows.forEach((r, i) => {
    const yc = yTop - (i + 0.5) * rowH, h = (rowH * barFrac) / 2;
    s.rect(x0, yc - h, x1, yc + h, { fill: 'grid', fillAlpha: 0.5, stroke: false });
    const xv = x0 + ((x1 - x0) * Math.max(0, r.value)) / max;
    s.rect(x0, yc - h, xv, yc + h, { fill: r.color || 'accent', fillAlpha: r.alpha ?? 0.75, color: r.color || 'accent', width: 1 });
    if (r.label) s.text(r.label, x0, yc, { dx: -8, align: 'right', size, color: r.labelColor || 'ink', weight: r.bold ? 700 : 500 });
    s.text(r.note ?? fmt(r.value), xv, yc, { dx: 6, size, weight: 700, color: r.color || 'accent' });
  });
}
