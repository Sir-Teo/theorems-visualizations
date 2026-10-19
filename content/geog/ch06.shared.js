// Geography & Cartography — Chapter 6: helpers for world maps (pseudocylindrical, compromise, interrupted, polyhedral).
// Re-exports chapter 5's helpers (which re-export chapter 1's) and adds world-map formulas on the unit sphere, a numerical
// distortion measure, an icosahedral net and a few clipping utilities.
import { D2R, R2D, vec, enu, dot3, clamp, PI, landFrame, landMask, isLand, azLines } from './ch05.shared.js';
export * from './ch05.shared.js';

const SQ2 = Math.SQRT2, HALF = PI / 2;
export const sgn = (x) => (x < 0 ? -1 : 1);

// ---------------------------------------------------------------- the projections (unit sphere; l = longitude from the central meridian, f = latitude, radians)
/** Mollweide auxiliary angle theta: 2 theta + sin 2 theta = pi sin phi (bracketed Newton from 2 phi; returns theta and optional safeguarded iterates of t = 2 theta). */
export function mollTheta(f, trace) {
  if (Math.abs(f) > HALF - 1e-9) return sgn(f) * HALF;
  const k = PI * Math.sin(f); let t = 2 * f, lo = -PI, hi = PI;
  if (trace) trace.push(t);
  for (let i = 0; i < 80; i++) {
    const g = t + Math.sin(t) - k;
    if (Math.abs(g) < 2e-15) break;
    if (g > 0) hi = t; else lo = t;
    const dd = 1 + Math.cos(t), trial = t - g / dd;
    const next = Number.isFinite(trial) && trial > lo && trial < hi ? trial : (lo + hi) / 2;
    if (trace) trace.push(next);
    if (Math.abs(next - t) < 1e-13) { t = next; break; }
    t = next;
  }
  return t / 2;
}
const mollRaw = (l, f) => { const t = mollTheta(f); return [((2 * SQ2) / PI) * l * Math.cos(t), SQ2 * Math.sin(t)]; };

// Robinson's table of parallel lengths X and distances from the equator Y at 5-degree steps (as tabulated on Wikipedia,
// which agrees with the globe kit); smoothed here by a natural cubic spline, so the map is a reconstruction of Robinson's.
const ROB = [[1, 0], [0.9986, 0.062], [0.9954, 0.124], [0.99, 0.186], [0.9822, 0.248], [0.973, 0.31], [0.96, 0.372], [0.9427, 0.434], [0.9216, 0.4958], [0.8962, 0.5571], [0.8679, 0.6176], [0.835, 0.6769], [0.7986, 0.7346], [0.7597, 0.7903], [0.7186, 0.8435], [0.6732, 0.8936], [0.6213, 0.9394], [0.5722, 0.9761], [0.5322, 1]];
function spline(ys) {
  const n = ys.length, M = new Float64Array(n), c = new Float64Array(n), d = new Float64Array(n);
  for (let i = 1; i < n - 1; i++) { const r = 6 * (ys[i + 1] - 2 * ys[i] + ys[i - 1]), w = 4 - (i > 1 ? c[i - 1] : 0); c[i] = 1 / w; d[i] = (r - (i > 1 ? d[i - 1] : 0)) / w; }
  for (let i = n - 2; i >= 1; i--) M[i] = d[i] - c[i] * M[i + 1];
  return (u) => { const i = clamp(Math.floor(u), 0, n - 2), t = u - i, s = 1 - t; return s * ys[i] + t * ys[i + 1] + ((s * s * s - s) * M[i] + (t * t * t - t) * M[i + 1]) / 6; };
}
const ROBX = spline([...ROB.slice(1).reverse().map((r) => r[0]), ...ROB.map((r) => r[0])]);
const ROBY = spline([...ROB.slice(1).reverse().map((r) => -r[1]), ...ROB.map((r) => r[1])]);
export const robX = (f) => ROBX(f / (5 * D2R) + 18), robY = (f) => ROBY(f / (5 * D2R) + 18);

const PHI1 = Math.acos(2 / PI);
function winkel(l, f) {
  const a = Math.acos(clamp(Math.cos(f) * Math.cos(l / 2), -1, 1)), sc = a < 1e-9 ? 1 : Math.sin(a) / a;
  return [0.5 * (l * Math.cos(PHI1) + (2 * Math.cos(f) * Math.sin(l / 2)) / sc), 0.5 * (f + Math.sin(f) / sc)];
}
/** Van der Grinten (Snyder's closed form), bounded by the circle of radius pi. */
function vdg(l, f) {
  if (Math.abs(f) < 1e-9) return [l, 0];
  const sT = clamp(Math.abs(f / HALF), 0, 1), th = Math.asin(sT);
  if (Math.abs(l) < 1e-9 || Math.abs(Math.abs(f) - HALF) < 1e-9) return [0, sgn(f) * PI * Math.tan(th / 2)];
  const cT = Math.cos(th), A = Math.abs(PI / l - l / PI) / 2, A2 = A * A, G = cT / (sT + cT - 1), P = G * (2 / sT - 1), P2 = P * P, PA = P2 + A2, GP = G - P2, Q = A2 + G;
  return [sgn(l) * PI * (A * GP + Math.sqrt(Math.max(0, A2 * GP * GP - PA * (G * G - P2)))) / PA, sgn(f) * PI * (P * Q - A * Math.sqrt(Math.max(0, (A2 + 1) * PA - Q * Q))) / PA];
}
/** Goode's join latitude: where the Mollweide parallel has the sinusoidal's length, ~ 40.7366 degrees. */
export const GOODE_PHI0 = (() => { let a = 30 * D2R, b = 50 * D2R; for (let i = 0; i < 60; i++) { const m = (a + b) / 2, t = mollTheta(m); if (((2 * SQ2) / PI) * Math.cos(t) > Math.cos(m)) b = m; else a = m; } return (a + b) / 2; })();
const GOODE_DY = SQ2 * Math.sin(mollTheta(GOODE_PHI0)) - GOODE_PHI0;
function goode(l, f) { if (Math.abs(f) <= GOODE_PHI0) return [l * Math.cos(f), f]; const p = mollRaw(l, f); return [p[0], p[1] - sgn(f) * GOODE_DY]; }

export const PROJ = {
  equirect: { label: 'Equirectangular', fwd: (l, f) => [l, f] },
  sinu: { label: 'Sinusoidal', equalArea: true, fwd: (l, f) => [l * Math.cos(f), f] },
  moll: { label: 'Mollweide', equalArea: true, fwd: mollRaw },
  robinson: { label: 'Robinson', fwd: (l, f) => [0.8487 * robX(f) * l, 1.3523 * robY(f)] },
  winkel: { label: 'Winkel tripel', fwd: winkel },
  vdg: { label: 'Van der Grinten', fwd: vdg },
  goode: { label: 'Goode homolosine', equalArea: true, fwd: goode },
};

// ---------------------------------------------------------------- numerical distortion (Tissot) of any l,f -> [x,y]
/** Semi-axes a >= b, meridian/parallel scales h, k, area factor, angular distortion omega (deg) and the meridian-parallel angle theta (deg) at (l, f); null across a jump. */
export function distort(fwd, l, f) {
  const hd = 1e-4, fc = clamp(f, -HALF + 2e-3, HALF - 2e-3), cf = Math.cos(fc);
  const e1 = fwd(l + hd, fc), e0 = fwd(l - hd, fc), n1 = fwd(l, fc + hd), n0 = fwd(l, fc - hd);
  if (![e1, e0, n1, n0].every((p) => p && isFinite(p[0]) && isFinite(p[1]))) return null;
  if (Math.hypot(e1[0] - e0[0], e1[1] - e0[1]) > 0.05 || Math.hypot(n1[0] - n0[0], n1[1] - n0[1]) > 0.05) return null;
  const E = [(e1[0] - e0[0]) / (2 * hd * cf), (e1[1] - e0[1]) / (2 * hd * cf)], N = [(n1[0] - n0[0]) / (2 * hd), (n1[1] - n0[1]) / (2 * hd)];
  const s1 = E[0] ** 2 + E[1] ** 2 + N[0] ** 2 + N[1] ** 2, det = E[0] * N[1] - E[1] * N[0];
  const a = Math.sqrt((s1 + Math.sqrt(Math.max(0, s1 * s1 - 4 * det * det))) / 2), b = Math.abs(det) / a;
  const h = Math.hypot(N[0], N[1]), k = Math.hypot(E[0], E[1]);
  return { a, b, h, k, area: Math.abs(det), omega: 2 * Math.asin(clamp((a - b) / (a + b), 0, 1)) * R2D, theta: Math.acos(clamp((E[0] * N[0] + E[1] * N[1]) / (h * k), -1, 1)) * R2D, E, N };
}
/** Draw the indicatrix ellipse of the Jacobian (columns E, N) at map point (x, y), the unit circle scaled by r0. */
export function jacEllipse(s, x, y, J, r0, col, alpha = 0.26) {
  const p = [];
  for (let i = 0; i <= 40; i++) { const t = (2 * PI * i) / 40, u = Math.cos(t) * r0, w = Math.sin(t) * r0; p.push([x + J.E[0] * u + J.N[0] * w, y + J.E[1] * u + J.N[1] * w]); }
  s.path(p, { close: true, fill: col, fillAlpha: alpha, color: col, width: 0.9 });
}

// ---------------------------------------------------------------- sampling the sphere and the error measures
/** Equal-area sample of the sphere: [l, f] radians, l in (-pi, pi). */
export function sphereGrid(nLat = 34, per = 68) {
  const out = [];
  for (let i = 0; i < nLat; i++) {
    const f = Math.asin(-1 + (2 * i + 1) / nLat), m = per;
    for (let j = 0; j < m; j++) out.push([-PI + ((j + 0.5) * 2 * PI) / m, f]);
  }
  return out;
}
const gcAngle = (l1, f1, l2, f2) => 2 * Math.asin(Math.sqrt(Math.min(1, Math.sin((f2 - f1) / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin((l2 - l1) / 2) ** 2)));
/**
 * Error measures of a world map f(l, f) -> [x, y] over an equal-area sample, in the spirit of (not identical to) Goldberg and Gott:
 * area = rms of ln(area factor / its geometric mean); shape = mean angular distortion omega (deg); dist = rms of ln(map distance / (c * great-circle
 * distance)) over 900 fixed random pairs, with the best single scale c; plus the per-point fields for plotting.
 */
export function mapErrors(fwd, grid = sphereGrid(), seed = 7) {
  let sl = 0, n = 0, so = 0; const pts = [];
  for (const [l, f] of grid) { const J = distort(fwd, l, f); if (!J) continue; pts.push({ l, f, ln: Math.log(J.area), om: J.omega, J }); sl += Math.log(J.area); so += J.omega; n++; }
  const m = sl / n; let sa = 0; for (const p of pts) { p.la = p.ln - m; sa += p.la * p.la; }
  let st = seed; const rnd = () => ((st = (st * 1664525 + 1013904223) >>> 0) / 4294967296);
  const lr = []; let sr = 0;
  for (let i = 0; i < 900; i++) {
    const a = grid[Math.floor(rnd() * grid.length)], b = grid[Math.floor(rnd() * grid.length)], g = gcAngle(a[0], a[1], b[0], b[1]);
    if (g < 0.05) continue;
    const p = fwd(a[0], a[1]), q = fwd(b[0], b[1]), r = Math.log(Math.hypot(p[0] - q[0], p[1] - q[1]) / g);
    if (isFinite(r)) { lr.push(r); sr += r; }
  }
  const mr = sr / lr.length; let sd = 0; for (const r of lr) sd += (r - mr) ** 2;
  return { area: Math.sqrt(sa / n), shape: so / n, dist: Math.sqrt(sd / lr.length), pts, n };
}

// ---------------------------------------------------------------- drawing a world map from a forward function of (l, f)
export const wrapRel = (lonDeg, lon0) => { let d = lonDeg - lon0; d = ((((d + 180) % 360) + 360) % 360) - 180; return d; };
/** Outline ring of a world map with central meridian (the map's own l in [-pi, pi]). */
export function worldRing(fwd) {
  const R = [], L = [];
  for (let i = 0; i <= 120; i++) { const f = -HALF + (PI * i) / 120; R.push(fwd(PI, f)); L.push(fwd(-PI, f)); }
  return R.concat(L.reverse());
}
/** Ocean, graticule, land and rim of a world map on stage s; lon0 (deg) is the central meridian. Returns the outline ring. */
export function worldBase(s, v, fwd, o = {}) {
  const lon0 = o.lon0 ?? 0, st = o.step ?? 30, ring = worldRing(fwd), gr = [];
  s.poly(ring, { fill: 'blue', fillAlpha: 0.07, stroke: false });
  for (let L = -180; L < 180; L += st) {
    let r = wrapRel(L, lon0); const rs = Math.abs(Math.abs(r) - 180) < 1e-6 ? [-180, 180] : [r];
    for (const q of rs) { for (let f = -90; f <= 90; f += 3) gr.push(fwd(q * D2R, f * D2R)); gr.push(null); }
  }
  for (let f = -90 + st; f < 90; f += st) { for (let l = -180; l <= 180; l += 3) gr.push(fwd(l * D2R, f * D2R)); gr.push(null); }
  s.path(gr, { color: 'muted', width: 0.7, alpha: 0.38 });
  if (o.land !== false) {
    const F = landFrame(v, lon0);
    s.rings(F.fills.map((r) => r.map((p) => fwd(p[0], p[1]))), { fill: o.landColor ?? 'gold', fillAlpha: o.landAlpha ?? 0.28, stroke: false });
    const out = [];
    for (const pl of F.lines) { for (const p of pl) out.push(fwd(p[0], p[1])); out.push(null); }
    s.path(out, { color: 'gold', width: 0.9, alpha: 0.8 });
  }
  s.poly(ring, { color: 'faint', width: 1.2, fill: false });
  return ring;
}

// ---------------------------------------------------------------- interrupted maps
/** Ocean-interrupted Goode layout: [lonMin, lonMax, central meridian, hemisphere] (degrees); a standard layout, cut longitudes not re-checked against Goode's atlas. */
export const GOODE_LOBES = [[-180, -40, -100, 1], [-40, 180, 30, 1], [-180, -100, -160, -1], [-100, -20, -60, -1], [-20, 80, 20, -1], [80, 180, 140, -1]];
export const lobeOf = (lobes, lon, lat) => lobes.find((b) => (lat >= 0 ? b[3] > 0 : b[3] < 0) && lon >= b[0] && lon <= b[1]) || lobes[0];
/** An interrupted version of a base map fwd(l, f): argument is the ABSOLUTE longitude in degrees. Lobes meet at the equator because x = lon0 + g(lon - lon0). */
export function interrupted(lobes, base) {
  return (lonDeg, f) => { const b = lobeOf(lobes, lonDeg, f), p = base((lonDeg - b[2]) * D2R, f); return [p[0] + b[2] * D2R, p[1]]; };
}
/** Insert points so that no edge of the closed ring is longer than `step` (so a clipped edge follows the curved image of a parallel). */
export function densify(ring, step = 0.02) {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length], n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / step));
    for (let k = 0; k < n; k++) out.push([p[0] + ((q[0] - p[0]) * k) / n, p[1] + ((q[1] - p[1]) * k) / n]);
  }
  return out;
}
/** Sutherland-Hodgman clip of a ring (array of [x, y]) to an axis-aligned rectangle. */
export function clipRect(ring, x0, x1, y0, y1) {
  const edges = [[(p) => p[0] >= x0, (p, q) => [x0, p[1] + ((q[1] - p[1]) * (x0 - p[0])) / (q[0] - p[0])]], [(p) => p[0] <= x1, (p, q) => [x1, p[1] + ((q[1] - p[1]) * (x1 - p[0])) / (q[0] - p[0])]],
    [(p) => p[1] >= y0, (p, q) => [p[0] + ((q[0] - p[0]) * (y0 - p[1])) / (q[1] - p[1]), y0]], [(p) => p[1] <= y1, (p, q) => [p[0] + ((q[0] - p[0]) * (y1 - p[1])) / (q[1] - p[1]), y1]]];
  let out = ring;
  for (const [inside, cut] of edges) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const p = inp[i], q = inp[(i + 1) % inp.length], pi = inside(p), qi = inside(q);
      if (pi && qi) out.push(q); else if (pi && !qi) out.push(cut(p, q)); else if (!pi && qi) { out.push(cut(p, q)); out.push(q); }
    }
    if (!out.length) break;
  }
  return out;
}

// ---------------------------------------------------------------- the icosahedral net (gnomonic projection onto the 20 faces)
let ICO = null;
/** Icosahedral gnomonic world map: faces, fwd(lon, lat deg) -> [x, y] on the unfolded net, inv(x, y) -> [lon, lat] | null, and the cut edges. */
export function icosa() {
  if (ICO) return ICO;
  const th = Math.atan(0.5) * R2D, H = Math.sqrt(3) / 2, N = [0, 0, 1], S = [0, 0, -1];
  const U = [0, 1, 2, 3, 4, 5].map((i) => vec([72 * i, th])), Lw = [0, 1, 2, 3, 4, 5].map((i) => vec([36 + 72 * i, -th]));
  const pu = (i) => [i, -H], pl = (i) => [i + 0.5, -2 * H], faces = [];
  for (let i = 0; i < 5; i++) {
    faces.push({ V: [N, U[i], U[i + 1]], P: [[i + 0.5, 0], pu(i), pu(i + 1)] });
    faces.push({ V: [U[i], Lw[i], U[i + 1]], P: [pu(i), pl(i), pu(i + 1)] });
    faces.push({ V: [Lw[i], Lw[i + 1], U[i + 1]], P: [pl(i), pl(i + 1), pu(i + 1)] });
    faces.push({ V: [S, Lw[i], Lw[i + 1]], P: [[i + 1, -3 * H], pl(i), pl(i + 1)] });
  }
  const inv3 = (M) => {
    const [a, b, c] = [M[0], M[1], M[2]], d = (A, B) => [A[1] * B[2] - A[2] * B[1], A[2] * B[0] - A[0] * B[2], A[0] * B[1] - A[1] * B[0]];
    const r0 = d(b, c), r1 = d(c, a), r2 = d(a, b), det = dot3(a, r0);
    return [[r0[0] / det, r0[1] / det, r0[2] / det], [r1[0] / det, r1[1] / det, r1[2] / det], [r2[0] / det, r2[1] / det, r2[2] / det]];
  };
  for (const F of faces) F.I = inv3(F.V); // rows give barycentric (unnormalised) coordinates of a vector in the basis V0, V1, V2
  const bary = (F, p) => [dot3(F.I[0], p), dot3(F.I[1], p), dot3(F.I[2], p)]; // unnormalised: all >= 0 only on the face whose cone contains p
  const fwd = (lon, lat) => {
    const p = vec([lon, lat]); let best = null, bm = -Infinity;
    for (const F of faces) { const b = bary(F, p), m = Math.min(b[0], b[1], b[2]); if (m > bm) { bm = m; best = [F, b]; } }
    const [F, b0] = best, t = b0[0] + b0[1] + b0[2], b = b0.map((x) => x / t); return [b[0] * F.P[0][0] + b[1] * F.P[1][0] + b[2] * F.P[2][0], b[0] * F.P[0][1] + b[1] * F.P[1][1] + b[2] * F.P[2][1]];
  };
  const inv = (x, y) => {
    for (const F of faces) {
      const [A, B, C] = F.P, d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]);
      const a = ((B[1] - C[1]) * (x - C[0]) + (C[0] - B[0]) * (y - C[1])) / d, b = ((C[1] - A[1]) * (x - C[0]) + (A[0] - C[0]) * (y - C[1])) / d, c = 1 - a - b;
      if (a >= -1e-9 && b >= -1e-9 && c >= -1e-9) {
        const w = [0, 1, 2].map((k) => a * F.V[0][k] + b * F.V[1][k] + c * F.V[2][k]), n = Math.hypot(...w);
        return [Math.atan2(w[1], w[0]) * R2D, Math.asin(w[2] / n) * R2D];
      }
    }
    return null;
  };
  // outline of the net and its cut edges (edges of the planar triangles that are not shared by two triangles)
  const key = (p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`, count = new Map();
  for (const F of faces) for (let k = 0; k < 3; k++) { const a = F.P[k], b = F.P[(k + 1) % 3], kk = [key(a), key(b)].sort().join('|'); count.set(kk, (count.get(kk) || 0) + 1); }
  const outline = [];
  for (const F of faces) for (let k = 0; k < 3; k++) { const a = F.P[k], b = F.P[(k + 1) % 3], kk = [key(a), key(b)].sort().join('|'); if (count.get(kk) === 1) outline.push([a, b, F.V[k], F.V[(k + 1) % 3]]); }
  return (ICO = { faces, fwd, inv, outline, width: 5.5, height: 3 * H, edgeAngle: Math.atan(2) });
}
export { landMask, isLand, azLines, enu };
