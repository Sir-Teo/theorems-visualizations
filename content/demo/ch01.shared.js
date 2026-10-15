// Demography — Chapter 1: helpers shared by ch01.js and ch01-b.js (plain functions, no runtime access).

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const sum = (a) => a.reduce((s, x) => s + x, 0);
/** Parse a comma-separated string of numbers. */
export const nums = (s) => s.split(',').map(Number);

/** Integer with thin spaces between thousands and a real minus sign (plain text). */
export function int(x) {
  const r = Math.round(Math.abs(x));
  return (x < 0 && r > 0 ? '−' : '') + String(r).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
}
/** Fixed decimals with a real minus sign. */
export function fx(x, d = 1) { const s = Math.abs(x).toFixed(d); return (x < 0 && +s !== 0 ? '−' : '') + s; }
/** Fixed decimals with an explicit sign (+1.2, −0.4). */
export function sg(x, d = 1) { const s = Math.abs(x).toFixed(d); return (x < 0 && +s !== 0 ? '−' : '+') + s; }
/** A count of people given in thousands, written in full (rounded to the nearest hundred), e.g. 81 987 900. */
export const ppl = (k) => int(Math.round(k * 10) * 100);
/** A count given in thousands as "81.99 million" / "738 thousand". */
export function big(k, d = 2) {
  const a = Math.abs(k);
  if (a >= 1e6) return `${fx(k / 1e6, d)} billion`;
  if (a >= 1e3) return `${fx(k / 1e3, d)} million`;
  return `${fx(k, a >= 100 ? 0 : 1)} thousand`;
}

/** Spread label positions (pixels) so neighbours are at least `gap` apart inside [lo, hi]; keeps the input order. */
export function spread(ys, gap, lo, hi) {
  const idx = ys.map((y, i) => i).sort((a, b) => ys[a] - ys[b]), out = ys.slice();
  let prev = -Infinity; for (const i of idx) { out[i] = Math.max(out[i], prev + gap, lo); prev = out[i]; }
  let next = Infinity; for (let k = idx.length - 1; k >= 0; k--) { const i = idx[k]; out[i] = Math.min(out[i], next - gap, hi); next = out[i]; }
  return out;
}

/** Signed area (positive for counter-clockwise). */
function area2(P) { let a = 0; for (let i = 0; i < P.length; i++) { const [x0, y0] = P[i], [x1, y1] = P[(i + 1) % P.length]; a += x0 * y1 - x1 * y0; } return a; }
/** Clip a convex polygon by the half-plane a·x + b·y ≤ c (Sutherland–Hodgman). */
export function clipHalf(P, a, b, c) {
  const out = [], f = (p) => a * p[0] + b * p[1] - c;
  for (let i = 0; i < P.length; i++) {
    const p = P[i], q = P[(i + 1) % P.length], fp = f(p), fq = f(q);
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
  }
  return out;
}
/** Is the point inside the convex polygon (boundary counts)? */
export function inConvex(pt, P) {
  const s = Math.sign(area2(P)) || 1;
  for (let i = 0; i < P.length; i++) {
    const [x0, y0] = P[i], [x1, y1] = P[(i + 1) % P.length];
    if (s * ((x1 - x0) * (pt[1] - y0) - (y1 - y0) * (pt[0] - x0)) < -1e-12) return false;
  }
  return true;
}
/** Parameter interval [u0, u1] ⊂ [0, 1] of the segment p → q lying inside the convex polygon (Cyrus–Beck), or null. */
export function clipSeg(p, q, P) {
  const s = Math.sign(area2(P)) || 1, dx = q[0] - p[0], dy = q[1] - p[1];
  let u0 = 0, u1 = 1;
  for (let i = 0; i < P.length; i++) {
    const [x0, y0] = P[i], [x1, y1] = P[(i + 1) % P.length];
    // inside: s·cross(edge, point − v0) ≥ 0, linear in u: A + B·u ≥ 0
    const ex = x1 - x0, ey = y1 - y0, A = s * (ex * (p[1] - y0) - ey * (p[0] - x0)), B = s * (ex * dy - ey * dx);
    if (Math.abs(B) < 1e-15) { if (A < 0) return null; continue; }
    const u = -A / B;
    if (B > 0) u0 = Math.max(u0, u); else u1 = Math.min(u1, u);
    if (u0 > u1) return null;
  }
  return [u0, u1];
}

/** The 18 five-year age groups used for the WPP data of 1.7–1.9. */
export const AGE18 = ['0–4', '5–9', '10–14', '15–19', '20–24', '25–29', '30–34', '35–39', '40–44', '45–49', '50–54', '55–59', '60–64', '65–69', '70–74', '75–79', '80–84', '85+'];
/** WHO World Standard Population 2000–2025 (Ahmad et al. 2001), % in the same 18 groups (85–89, 90–94, 95–99, 100+ merged). */
export const WHO18 = [8.86, 8.69, 8.6, 8.47, 8.22, 7.93, 7.61, 7.15, 6.59, 6.04, 5.37, 4.55, 3.72, 2.96, 2.21, 1.52, 0.91, 0.635];
