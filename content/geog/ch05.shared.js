// Geography & Cartography — Chapter 5: helpers for the azimuthal and conic items.
// Re-exports the shared helpers of chapter 1 (vectors, ellipsoids, formatting) and adds a land mask, an azimuthal
// map with an arbitrary radial law r(c), and the three classical conic families on the unit sphere.
import { D2R, R2D, vec, enu, dot3 } from './ch01.shared.js';
export * from './ch01.shared.js';

export const PI = Math.PI;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const mod = (a, n) => ((a % n) + n) % n;
export const wrap180 = (l) => mod(l + 180, 360) - 180;

/** Plane polygon area (shoelace). */
export function shoelace(pts) { let s = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) s += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]; return Math.abs(s / 2); }
/** Ellipse with semi-axes a (along angle th) and b, centred at (cx, cy). */
export function ellipse(s, cx, cy, a, b, th, col, alpha = 0.26) {
  const p = [], c = Math.cos(th), sn = Math.sin(th);
  for (let i = 0; i <= 48; i++) { const t = (2 * PI * i) / 48, u = a * Math.cos(t), w = b * Math.sin(t); p.push([cx + u * c - w * sn, cy + u * sn + w * c]); }
  s.path(p, { close: true, fill: col, fillAlpha: alpha, color: col, width: 0.9 });
}

// ---------------------------------------------------------------- land, as a 0.5-degree mask and as plate-carree rings
let MASK = null;
/** Land mask of Natural Earth 110 m on a 720 x 360 grid (row 0 = 90 N, column 0 = 180 W), built once by even-odd scan lines. */
export function landMask(v) {
  if (MASK) return MASK;
  const W = 720, H = 360, m = new Uint8Array(W * H), P = v.geo('projection', 'equirectangular', { center: [0, 0] });
  for (const poly of v.geo('land')) {
    const E = [];
    for (const r of P.clipPolygon(poly.rings)) for (let i = 0, j = r.length - 1; i < r.length; j = i++) E.push([r[j], r[i]]);
    for (let row = 0; row < H; row++) {
      const y = (90 - (row + 0.5) / 2) * D2R, xs = [];
      for (const [a, b] of E) if (a[1] > y !== b[1] > y) xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const i0 = Math.max(0, Math.ceil(xs[k] * R2D * 2 + 360 - 0.5)), i1 = Math.min(W - 1, Math.floor(xs[k + 1] * R2D * 2 + 360 - 0.5));
        for (let i = i0; i <= i1; i++) m[row * W + i] = 1;
      }
    }
  }
  return (MASK = m);
}
export const isLand = (m, lon, lat) => m[clamp(Math.floor((90 - lat) * 2), 0, 359) * 720 + clamp(Math.floor((wrap180(lon) + 180) * 2), 0, 719)];

let FRAME = null;
/** Land cut along the antimeridian of a map with central meridian lon0: {fills, lines} as rings of [lambda - lambda0, phi] in radians. */
export function landFrame(v, lon0) {
  const key = Math.round(lon0 * 2) / 2;
  if (FRAME && FRAME.key === key) return FRAME;
  const P = v.geo('projection', 'equirectangular', { center: [key, 0] }), fills = [], lines = [];
  for (const poly of v.geo('land')) { fills.push(...P.clipPolygon(poly.rings)); for (const r of poly.rings) lines.push(...P.clipLine(r, true)); }
  return (FRAME = { key, fills, lines });
}

// ---------------------------------------------------------------- azimuthal maps with a radial law r(c)
/**
 * An azimuthal map of the unit sphere centred on `center` ([lon, lat]), north up: a point at angular distance c and azimuth
 * theta goes to r(c)(sin theta, cos theta). cMax (radians) is where the map stops. Provides forward, the radius of the edge and a
 * monotone table for inversion.
 */
export function azMap(center, rOf, cMax, key = '') {
  const F = enu(center), n = 600, tab = new Float64Array(n + 1);
  for (let i = 0; i <= n; i++) tab[i] = rOf((cMax * i) / n);
  const M = {
    center, rOf, cMax, rMax: tab[n], key: `${center}|${cMax}|${key}`,
    fwd(lon, lat) {
      const p = vec([lon, lat]), c = Math.acos(clamp(dot3(F.u, p), -1, 1));
      if (c > cMax) return null;
      const x = dot3(F.e, p), y = dot3(F.n, p), s = Math.hypot(x, y);
      if (s < 1e-12) return [0, 0];
      const r = rOf(c); return [(r * x) / s, (r * y) / s];
    },
    /** angular distance c for a map radius r (null beyond the edge) */
    cOf(r) {
      if (r > tab[n]) return null;
      let lo = 0, hi = n; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m] <= r) lo = m; else hi = m; }
      const t = tab[hi] > tab[lo] ? (r - tab[lo]) / (tab[hi] - tab[lo]) : 0; return (cMax * (lo + t)) / n;
    },
    /** [lon, lat] under the map point (x, y) */
    inv(x, y) {
      const r = Math.hypot(x, y), c = M.cOf(r); if (c == null) return null;
      const s = r > 1e-12 ? Math.sin(c) / r : 0, cc = Math.cos(c);
      const w = [cc * F.u[0] + s * (x * F.e[0] + y * F.n[0]), cc * F.u[1] + s * (x * F.e[1] + y * F.n[1]), cc * F.u[2] + s * (x * F.e[2] + y * F.n[2])];
      return [Math.atan2(w[1], w[0]) * R2D, Math.atan2(w[2], Math.hypot(w[0], w[1])) * R2D];
    },
  };
  return M;
}
/** Break a list of [lon, lat] into polylines on azimuthal map M (hidden points cut the line; jumps larger than `jump` are cut too). */
export function azLines(M, pts, jump = 0.9) {
  const out = []; let cur = null, prev = null;
  for (const p of pts) {
    const q = M.fwd(p[0], p[1]);
    if (!q || (prev && Math.hypot(q[0] - prev[0], q[1] - prev[1]) > jump)) { if (cur && cur.length > 1) out.push(cur); cur = q ? [q] : null; } else { (cur ||= []).push(q); }
    prev = q;
  }
  if (cur && cur.length > 1) out.push(cur);
  return out;
}
/** Base map for azimuthal map M on stage s: ocean disc, land (raster by inverse mapping) with coastline, graticule, rim. */
export function azBase(s, v, M, o = {}) {
  const rim = []; for (let i = 0; i <= 180; i++) { const t = (2 * PI * i) / 180; rim.push([M.rMax * Math.cos(t), M.rMax * Math.sin(t)]); }
  s.poly(rim, { fill: 'blue', fillAlpha: 0.07, stroke: false });
  if (o.land !== false) {
    const mask = landMask(v), g = v.rgb('gold');
    s.raster((x, y) => { const w = M.inv(x, y); return w && isLand(mask, w[0], w[1]) ? [g[0], g[1], g[2], 0.3] : null; }, { res: 2, key: M.key, id: 'land' });
    const out = [];
    for (const poly of v.geo('land')) for (const ring of poly.rings) for (const pl of azLines(M, ring.concat([ring[0]]), 0.6)) out.push(...pl, null);
    s.path(out, { color: 'gold', width: 0.9, alpha: 0.8 });
  }
  const st = o.step ?? 30, gr = [];
  for (let l = -180; l < 180; l += st) { const m = []; for (let f = -90; f <= 90; f += 2) m.push([l, f]); for (const pl of azLines(M, m)) gr.push(...pl, null); }
  for (let f = -90 + st; f < 90; f += st) { const p = []; for (let l = -180; l <= 180; l += 2) p.push([l, f]); for (const pl of azLines(M, p)) gr.push(...pl, null); }
  s.path(gr, { color: 'muted', width: 0.7, alpha: 0.38 });
  s.poly(rim, { color: 'faint', width: 1.2, fill: false });
}

// ---------------------------------------------------------------- conic projections on the unit sphere
const tq = (f) => Math.tan(PI / 4 + f / 2);
/**
 * A conic map x = rho sin(n dl), y = rho0 - rho cos(n dl) (dl = lon - lon0, radians) for family 'eqdc' (equidistant), 'lcc'
 * (Lambert conformal) or 'albers' (equal-area) with standard parallels f1, f2 (radians). Provides n, rho(phi), the meridian
 * and parallel scales h(phi), k(phi), and forward().
 */
export function conic(kind, f1, f2, f0) {
  const same = Math.abs(f1 - f2) < 1e-9; let n, rho;
  if (kind === 'eqdc') {
    n = same ? Math.sin(f1) : (Math.cos(f1) - Math.cos(f2)) / (f2 - f1);
    const G = Math.cos(f1) / n + f1; rho = (f) => G - f;
  } else if (kind === 'lcc') {
    n = same ? Math.sin(f1) : Math.log(Math.cos(f1) / Math.cos(f2)) / Math.log(tq(f2) / tq(f1));
    const F = (Math.cos(f1) * Math.pow(tq(f1), n)) / n; rho = (f) => F * Math.pow(tq(clamp(f, -PI / 2 + 1e-6, PI / 2)), -n);
  } else {
    n = (Math.sin(f1) + Math.sin(f2)) / 2;
    const C = Math.cos(f1) ** 2 + 2 * n * Math.sin(f1); rho = (f) => Math.sqrt(Math.max(0, C - 2 * n * Math.sin(f))) / n;
  }
  const rho0 = f0 === 'apex' ? 0 : rho(f0 ?? (f1 + f2) / 2), kk = (f) => (n * rho(f)) / Math.cos(f);
  const k = (f) => Math.abs(kk(f)), h = kind === 'eqdc' ? () => 1 : kind === 'lcc' ? k : (f) => 1 / k(f);
  return { kind, n, rho, rho0, k, h, f1, f2, fwd: (dl, f) => { const t = n * dl, r = rho(f); return [r * Math.sin(t), rho0 - r * Math.cos(t)]; } };
}
/**
 * Base map of conic C on stage s: ocean, graticule, land and frame, with latitudes limited to [fa, fb] (degrees) and
 * longitudes to lon0 +- span (degrees). Returns the bounding box of the frame.
 */
export function conicBase(s, v, C, lon0, fa, fb, o = {}) {
  const span = o.span ?? 180, st = o.step ?? 15, pst = o.pstep ?? st, A = fa * D2R, B = fb * D2R, X = (l, f) => C.fwd(l, clamp(f, A, B));
  const open = o.frame === false, frame = [];
  for (let l = -span; l <= span; l += 3) frame.push(X(l * D2R, A));
  for (let f = fa; f <= fb; f += 3) frame.push(X(span * D2R, f * D2R));
  for (let l = span; l >= -span; l -= 3) frame.push(X(l * D2R, B));
  for (let f = fb; f >= fa; f -= 3) frame.push(X(-span * D2R, f * D2R));
  if (!open) s.poly(frame, { fill: 'blue', fillAlpha: 0.07, stroke: false });
  const gr = [];
  for (let l = Math.ceil(-span / st) * st; l <= span + 1e-9; l += st) { for (let f = fa; f <= fb + 1e-9; f += 3) gr.push(X(l * D2R, f * D2R)); gr.push(null); }
  for (let f = Math.ceil(fa / pst) * pst; f <= fb + 1e-9; f += pst) { for (let l = -span; l <= span + 1e-9; l += 3) gr.push(X(l * D2R, f * D2R)); gr.push(null); }
  s.path(gr, { color: 'muted', width: 0.7, alpha: 0.38 });
  if (o.land !== false) {
    const L = landFrame(v, lon0), lim = open ? 10 : span * D2R, T = (r) => r.map((p) => X(clamp(p[0], -lim, lim), p[1]));
    s.rings(L.fills.map(T), { fill: 'gold', fillAlpha: 0.26, stroke: false });
    const out = [];
    for (const pl of L.lines) { for (const p of pl) { if (p[1] >= A && p[1] <= B) out.push(X(clamp(p[0], -lim, lim), p[1])); else if (out.length && out[out.length - 1]) out.push(null); } out.push(null); }
    s.path(out, { color: 'gold', width: 0.9, alpha: 0.8 });
  }
  if (!open) s.poly(frame, { color: 'faint', width: 1.2, fill: false });
  const xs = frame.map((p) => p[0]), ys = frame.map((p) => p[1]);
  return { x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)] };
}
/** Indicatrix of a conic at (dl, phi): semi-axes h along the meridian and k along the parallel, scaled by r0. */
export function conicIndicatrix(s, C, dl, f, r0, col, alpha = 0.26) {
  const t = C.n * dl, [x, y] = C.fwd(dl, f);
  ellipse(s, x, y, C.h(f) * r0, C.k(f) * r0, Math.atan2(-Math.cos(t), Math.sin(t)), col, alpha);
}
/** Boundary points of a conic map frame (latitudes fa..fb, longitudes +-span degrees from the central meridian). */
export function conicFrame(C, fa, fb, span = 180) {
  const A = fa * D2R, B = fb * D2R, out = [];
  for (let l = -span; l <= span; l += 3) out.push(C.fwd(l * D2R, A));
  for (let f = fa; f <= fb; f += 3) out.push(C.fwd(span * D2R, f * D2R));
  for (let l = span; l >= -span; l -= 3) out.push(C.fwd(l * D2R, B));
  for (let f = fb; f >= fa; f -= 3) out.push(C.fwd(-span * D2R, f * D2R));
  return out;
}
