// Abstract Algebra (Judson) — Chapter 4: helpers shared by ch04.js and ch04-b.js (plain named exports).
//
// The group machinery of Chapter 3 (Cayley tables as index arrays, orders, generated subgroups) is re-exported from
// ch03.shared.js. On top of it: clocks (n points on a circle, 0 at the top, clockwise like ℤₙ in Chapter 3), star
// polygons of step sizes, divisor lattices of subgroups of ℤₙ, and small complex-plane helpers for §4.2.
export { EC, elColor, gcd, cyclic, units, dihedral, quaternion, klein, finish, orderOf, power, generated, allSubgroups, covers, subgroupTest, latticeLayout, roster } from './ch03.shared.js';
import { gcd } from './ch03.shared.js';

export const mod = (a, n) => ((a % n) + n) % n;
export const TAU = 2 * Math.PI;
export function divisors(n) { const out = []; for (let d = 1; d <= n; d++) if (n % d === 0) out.push(d); return out; }
export function phi(n) { let c = 0; for (let k = 1; k <= n; k++) if (gcd(k, n) === 1) c++; return c; }
/** Number of prime factors with multiplicity. */
export function omega(n) { let c = 0; for (let p = 2; n > 1; p++) while (n % p === 0) { n /= p; c++; } return c; }

// ------------------------------------------------------------------ clocks and star polygons
/** Position of hour k of n on a circle of radius R about c (0 at the top, clockwise). */
export function hour(k, n, R = 1, c = [0, 0]) { const a = Math.PI / 2 - (TAU * k) / n; return [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)]; }
/** Nearest hour to (x, y), or -1 if farther than `px` pixels. */
export function hitHour(s, n, x, y, R = 1, c = [0, 0], px = 20) {
  let best = -1, bd = px;
  for (let k = 0; k < n; k++) { const [hx, hy] = hour(k, n, R, c); const d = Math.hypot(s.X(hx) - s.X(x), s.Y(hy) - s.Y(y)); if (d < bd) { bd = d; best = k; } }
  return best;
}
/** The walk 0, k, 2k, … mod n until it returns to 0 (inclusive of the final 0). */
export function starWalk(n, k) { const out = [0]; let x = mod(k, n); while (x !== 0 && out.length <= n) { out.push(x); x = mod(x + k, n); } out.push(0); return out; }
/**
 * Draw a clock: faint circle, n dots with labels outside. o.dot(k) → {color, r, hollow, ring}, o.label(k) → string|null,
 * o.labelColor(k), o.R (radius), o.c (centre), o.lab (label radius factor), o.size.
 */
export function drawClock(v, s, n, o = {}) {
  const R = o.R ?? 1, c = o.c || [0, 0], lab = o.lab ?? 1.2;
  if (o.circle !== false) s.circle(c[0], c[1], R, { color: 'faint', width: 1.4, fill: o.fill || false, fillAlpha: 0.05 });
  for (let k = 0; k < n; k++) {
    const [x, y] = hour(k, n, R, c), st = (o.dot && o.dot(k)) || {};
    if (st.ring) s.dot(x, y, { r: (st.r ?? 5) + 5, hollow: true, color: st.ring });
    s.dot(x, y, { r: st.r ?? 5, color: st.color || 'muted', hollow: st.hollow });
    const L = o.label ? o.label(k) : String(k);
    if (L != null && L !== '') {
      const [lx, ly] = hour(k, n, R * lab, c);
      s.text(L, lx, ly, { align: 'center', size: o.size ?? 13, weight: 700, color: (o.labelColor && o.labelColor(k)) || 'ink' });
    }
  }
}
/** Polyline through the hours of `walk` (indices), optionally with arrowheads on each edge. */
export function drawWalk(v, s, n, walk, st = {}) {
  const R = st.R ?? 1, c = st.c || [0, 0], pts = walk.map((k) => hour(k, n, R, c));
  if (!st.arrows) { s.path(pts, { color: st.color || 'accent', width: st.width ?? 2, alpha: st.alpha }); return; }
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0); if (L < 1e-9) continue;
    const tr = (st.trim ?? 9) / s.scale, ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    s.arrow(x0 + ux * tr, y0 + uy * tr, x1 - ux * tr, y1 - uy * tr, { color: st.color || 'accent', width: st.width ?? 2, alpha: st.alpha, head: st.head ?? 8 });
  }
}

// ------------------------------------------------------------------ the divisor lattice of subgroups of ℤₙ
/**
 * Subgroups of ℤₙ are ⟨d⟩ for d | n, of order n/d. Returns {nodes: [{d, order, x, y}], edges: [[i, j]]} with ⟨d⟩ ⊂ ⟨e⟩ covering
 * when e | d and d/e is prime; rows by the number of prime factors of the order (trivial subgroup at the bottom).
 */
export function divisorLattice(n, [x0, x1], [y0, y1]) {
  const D = divisors(n), rows = new Map();
  for (const d of D) { const r = omega(n / d); if (!rows.has(r)) rows.set(r, []); rows.get(r).push(d); }
  const R = Math.max(...rows.keys()), nodes = [];
  for (const [r, ds] of rows) { ds.sort((a, b) => b - a); ds.forEach((d, i) => nodes.push({ d, order: n / d, x: ds.length === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * (i + 0.5)) / ds.length, y: R === 0 ? (y0 + y1) / 2 : y0 + ((y1 - y0) * r) / R })); }
  const idx = new Map(nodes.map((nd, i) => [nd.d, i])), edges = [];
  for (const a of nodes) for (const b of nodes) if (a.d % b.d === 0 && omega(a.d / b.d) === 1) edges.push([idx.get(a.d), idx.get(b.d)]);
  return { nodes, edges };
}

// ------------------------------------------------------------------ complex plane
/** Axes through 0 and the unit circle (dashed), with Re/Im labels. */
export function plane(v, s, o = {}) {
  const [x0, x1] = s.xr, [y0, y1] = s.yr;
  s.line(x0, 0, x1, 0, { color: 'faint', width: 1.2 }); s.line(0, y0, 0, y1, { color: 'faint', width: 1.2 });
  if (o.unit !== false) s.circle(0, 0, 1, { color: 'muted', width: 1.2, dash: [4, 4], fill: false });
  if (o.labels !== false) { s.text('Re', x1, 0, { dx: -6, dy: -10, align: 'right', size: 11, color: 'muted' }); s.text('Im', 0, y1, { dx: 8, dy: 9, align: 'left', size: 11, color: 'muted' }); }
}
/** Arc of radius r from angle a0 to a1 (radians, counter-clockwise) about c, optional arrowhead. */
export function arc(v, s, r, a0, a1, st = {}) {
  const c = st.c || [0, 0], n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * 30)), pts = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); }
  s.path(pts, { color: st.color || 'accent', width: st.width ?? 2, alpha: st.alpha, dash: st.dash });
  if (st.head && Math.abs(a1 - a0) > 0.08) { const [p, q] = [pts[pts.length - 3], pts[pts.length - 1]]; s.arrow(p[0], p[1], q[0], q[1], { color: st.color || 'accent', width: st.width ?? 2, head: 7 }); }
}
/** Principal argument in [0, 2π). */
export const arg0 = (x, y) => { const a = Math.atan2(y, x); return a < 0 ? a + TAU : a; };
export const deg = (a) => (a * 180) / Math.PI;
/** Format a real number for TeX with a real minus sign. */
export function num(x, d = 2) { const r = Math.round(x * 10 ** d) / 10 ** d; return (Object.is(r, -0) ? 0 : r).toFixed(d).replace(/\.?0+$/, '') || '0'; }
/** a + bi as TeX. */
export function cxTex(a, b, d = 2) {
  const A = num(a, d), Bv = num(Math.abs(b), d), sgn = b < 0 && Bv !== '0' ? '-' : '+';
  if (Bv === '0') return A;
  const bi = Bv === '1' ? 'i' : `${Bv}i`;
  return A === '0' ? `${sgn === '-' ? '-' : ''}${bi}` : `${A} ${sgn} ${bi}`;
}
/** Fit a stage's view (equal aspect) around points, always including the unit circle. */
export function fitView(s, pts, pad = 0.25, min = 1.35) {
  let m = min; for (const [x, y] of pts) m = Math.max(m, Math.abs(x) + pad, Math.abs(y) + pad);
  s.setView([-m, m], [-m, m]);
  return m;
}
