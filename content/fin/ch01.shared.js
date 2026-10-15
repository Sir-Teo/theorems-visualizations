// Finance — Chapter 1: helpers shared by ch01.js and ch01-b.js (plain functions, no runtime access).

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const minus = (s) => String(s).replace(/^-/, '−');
const isZero = (x, d) => Number(Math.abs(x).toFixed(d)) === 0;

/** Percent as plain text with a real minus sign: pct(0.0825, 2) → "8.25%". */
export const pct = (x, d = 1) => (isZero(100 * x, d) ? (0).toFixed(d) : minus((100 * x).toFixed(d))) + '%';
/** Fixed decimals with a real minus sign (plain text). */
export const fx = (x, d = 2) => (isZero(x, d) ? (0).toFixed(d) : minus(x.toFixed(d)));
/** Signed fixed decimals: +1.20 / −0.40. */
export const sg = (x, d = 2) => (x < 0 && !isZero(x, d) ? '−' : '+') + Math.abs(x).toFixed(d);
const grp = (x, d) => Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
/** Dollars for canvas text (a plain $ is safe there): money(-1234.5) → "−$1,235". */
export const money = (x, d = 0) => (x < 0 && !isZero(x, d) ? '−' : '') + '$' + grp(x, d);
/** Dollars for rich text and TeX (a bare $ would open math): usd(1234) → "$\$1{,}234$". */
export const usd = (x, d = 0) => `$${x < 0 && !isZero(x, d) ? '-' : ''}\\$${grp(x, d).replace(/,/g, '{,}')}$`;
/** Signed dollars for rich text: +$12 / −$12. */
export const usdS = (x, d = 0) => `$${x < 0 && !isZero(x, d) ? '-' : '+'}\\$${grp(x, d).replace(/,/g, '{,}')}$`;

/** Net present value of flows [[t, c], …] at a rate r per period (compounded once a period). */
export function npv(flows, r) { let s = 0; for (const [t, c] of flows) s += c * Math.pow(1 + r, -t); return s; }
/** Flows given as an array c[0..N] (c[t] at the end of period t) → [[t, c], …]. */
export const dated = (cs) => cs.map((c, t) => [t, c]);
/**
 * Every rate r in (lo, hi) with NPV(r) = 0 where the NPV changes sign: a scan uniform in log(1 + r), then bisection.
 * (A root where the curve only touches zero is not reported.)
 */
export function irrs(flows, lo = -0.9, hi = 4, n = 1600) {
  const f = (r) => npv(flows, r), out = [], L0 = Math.log1p(lo), L1 = Math.log1p(hi);
  let rp = lo, fp = f(lo);
  for (let i = 1; i <= n; i++) {
    const r = Math.expm1(L0 + ((L1 - L0) * i) / n), fr = f(r);
    if (fp === 0) out.push(rp);
    else if (fp * fr < 0) {
      let a = rp, b = r, fa = fp;
      for (let k = 0; k < 90; k++) { const m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } }
      out.push((a + b) / 2);
    }
    rp = r; fp = fr;
  }
  return out;
}
/** Present value of 1 a period for n periods (end of period) at rate r: [1 − (1+r)^−n]/r. */
export const annuityFactor = (r, n) => (Math.abs(r) < 1e-12 ? n : (1 - Math.pow(1 + r, -n)) / r);

/** Spread label positions (pixels) so neighbours are at least `gap` apart inside [lo, hi]; keeps the input order. */
export function spread(ys, gap, lo, hi) {
  const idx = ys.map((_, i) => i).sort((a, b) => ys[a] - ys[b]), out = ys.slice();
  let prev = -Infinity; for (const i of idx) { out[i] = Math.max(out[i], prev + gap, lo); prev = out[i]; }
  let next = Infinity; for (let k = idx.length - 1; k >= 0; k--) { const i = idx[k]; out[i] = Math.min(out[i], next - gap, hi); next = out[i]; }
  return out;
}
/**
 * Labels in a column at data x, each placed near its data y but pushed apart so none overlap:
 * items = [[y, text, colour], …]. With st.leader (a CSS colour, e.g. v.color('faint')) a thin leader joins a
 * label to its y when it had to move.
 */
export function labelColumn(S, x, items, st = {}) {
  const gap = st.gap ?? 15, H = S.H || 300;
  const ys = spread(items.map(([y]) => S.Y(y)), gap, 8, H - 8);
  items.forEach(([y, text, col], i) => {
    const X0 = S.X(x), X = X0 + (st.dx ?? 8), Y0 = S.Y(y);
    if (st.leader && Math.abs(ys[i] - Y0) > 2) {
      const c = S.ctx; c.save(); c.strokeStyle = st.leader; c.lineWidth = 1; c.beginPath(); c.moveTo(X0 + 1, Y0); c.lineTo(X - 2, ys[i]); c.stroke(); c.restore();
    }
    S.textPx(text, X, ys[i], { color: col, size: st.size ?? 11.5, weight: st.weight ?? 600, align: 'left' });
  });
}
/** A nice upper bound for an axis: 1, 2, 2.5 or 5 × 10^k at or above x. */
export function niceUp(x) {
  if (!(x > 0)) return 1;
  const k = Math.pow(10, Math.floor(Math.log10(x))), m = x / k;
  return k * (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10);
}
