// Globe kit — the Earth and the sphere. Reference: docs/kits-world.md.
//
//   const G = v.globe(stage, { projection: 'orthographic', center: [10, 30], graticule: 30 });
//   const A = G.handle(-74, 40.7, { label: 'A' }), B = G.handle(139.7, 35.7, { label: 'B', color: 'red' });
//   v.render(() => { G.draw(); const km = G.greatCircle(A, B); G.rhumbLine(A, B); G.tissot({ step: 30 }); });
//
// Everything in the API is [lon, lat] in degrees (or a handle {lon, lat}). The kit owns the stage's view: data
// coordinates are map units of the projection on the unit sphere, so G.project(lon, lat) → [x, y] works with every
// stage primitive. Drag the map to rotate it (handles take precedence). Polygons and lines are clipped on the
// sphere (antimeridian seam for cylindrical maps, horizon/cap for azimuthal ones) and re-closed along the map edge.
// Tissot indicatrices are images of the unit tangent circle under the projection's numerical Jacobian.
// DOM-free helpers (haversine, rhumb, rotate, projection, …) are exported and reachable as v.geo(name, ...args).
import { LAND_110M } from './world-110m.js';

const D = Math.PI / 180, TAU = 2 * Math.PI, HALF = Math.PI / 2, PI = Math.PI;
export const EARTH_KM = 6371.0088; // IUGG mean radius
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mod = (a, n) => ((a % n) + n) % n;
const LL = (p) => (Array.isArray(p) ? p : [p.lon, p.lat]);
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => { const n = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
const mv = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];
const mtv = (M, v) => [M[0][0] * v[0] + M[1][0] * v[1] + M[2][0] * v[2], M[0][1] * v[0] + M[1][1] * v[1] + M[2][1] * v[2], M[0][2] * v[0] + M[1][2] * v[1] + M[2][2] * v[2]];
const mm = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));

// ------------------------------------------------------------------ spherical geometry (degrees in, degrees/km out)
/** Unit vector of a [lon, lat] point (x towards (0°, 0°), z towards the north pole). */
export const vec = (p) => { const [lon, lat] = LL(p), l = lon * D, f = lat * D, c = Math.cos(f); return [c * Math.cos(l), c * Math.sin(l), Math.sin(f)]; };
/** [lon, lat] of a (not necessarily unit) vector. */
export const lonlat = (v) => [Math.atan2(v[1], v[0]) / D, Math.atan2(v[2], Math.hypot(v[0], v[1])) / D];
/** Central angle between two points, in degrees (atan2 form: accurate for tiny and near-antipodal pairs). */
export const centralAngle = (a, b) => { const u = vec(a), w = vec(b); return Math.atan2(Math.hypot(...cross(u, w)), dot3(u, w)) / D; };
/** Great-circle distance by the haversine formula (km on the Earth unless R is given). */
export function haversine(a, b, R = EARTH_KM) {
  const [l1, f1] = LL(a), [l2, f2] = LL(b), df = (f2 - f1) * D, dl = (l2 - l1) * D;
  const h = Math.sin(df / 2) ** 2 + Math.cos(f1 * D) * Math.cos(f2 * D) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
/** Initial bearing (degrees clockwise from north, 0–360) of the great circle from a to b. */
export function bearing(a, b) {
  const [l1, f1] = LL(a).map((x) => x * D), [l2, f2] = LL(b).map((x) => x * D), dl = l2 - l1;
  return mod(Math.atan2(Math.sin(dl) * Math.cos(f2), Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl)) / D, 360);
}
/** Point reached from p going `dist` degrees of arc along initial bearing `brg`. */
export function destination(p, brg, dist) {
  const [l1, f1] = LL(p).map((x) => x * D), t = brg * D, d = dist * D;
  const f2 = Math.asin(clamp(Math.sin(f1) * Math.cos(d) + Math.cos(f1) * Math.sin(d) * Math.cos(t), -1, 1));
  const l2 = l1 + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(f1), Math.cos(d) - Math.sin(f1) * Math.sin(f2));
  return [mod(l2 / D + 180, 360) - 180, f2 / D];
}
/** Points along the minor great-circle arc a→b (slerp), n segments (default: one per degree). */
export function interpolate(a, b, n) {
  const u = vec(a), w = vec(b), om = Math.atan2(Math.hypot(...cross(u, w)), dot3(u, w));
  n = n || Math.max(2, Math.ceil(om / D)); if (om < 1e-12) return [LL(a).slice(), LL(b).slice()];
  const s = Math.sin(om), out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, k0 = Math.sin((1 - t) * om) / s, k1 = Math.sin(t * om) / s; out.push(lonlat([k0 * u[0] + k1 * w[0], k0 * u[1] + k1 * w[1], k0 * u[2] + k1 * w[2]])); }
  return out;
}
/** The whole great circle through a and b (closed list of points). */
export function greatCirclePoints(a, b, n = 180) {
  const u = vec(a), nrm = unit(cross(u, vec(b))), w = cross(nrm, u), out = [];
  for (let i = 0; i <= n; i++) { const t = (TAU * i) / n; out.push(lonlat([u[0] * Math.cos(t) + w[0] * Math.sin(t), u[1] * Math.cos(t) + w[1] * Math.sin(t), u[2] * Math.cos(t) + w[2] * Math.sin(t)])); }
  return out;
}
const psi = (f) => Math.log(Math.tan(PI / 4 + clamp(f, -89.999 * D, 89.999 * D) / 2));
/** Rhumb line (loxodrome, constant bearing) a→b: {length (km), bearing (deg), points}. */
export function rhumb(a, b, R = EARTH_KM, n = 64) {
  const [l1, f1d] = LL(a), [, f2d] = LL(b), f1 = f1d * D, f2 = f2d * D;
  let dl = (LL(b)[0] - l1) * D; if (Math.abs(dl) > PI) dl -= Math.sign(dl) * TAU;
  const dp = psi(f2) - psi(f1), df = f2 - f1, q = Math.abs(dp) > 1e-12 ? df / dp : Math.cos(f1);
  const points = [];
  for (let i = 0; i <= n; i++) { const t = i / n, f = Math.abs(dp) > 1e-12 ? Math.atan(Math.sinh(psi(f1) + t * dp)) : f1; points.push([mod(l1 + (t * dl) / D + 180, 360) - 180, f / D]); }
  return { length: Math.hypot(df, q * dl) * R, bearing: mod(Math.atan2(dl, dp) / D, 360), points };
}
/** Small circle of angular radius r (degrees) about c, counter-clockwise seen from outside (a valid polygon ring). */
export function smallCircle(c, r, n = 96) { const out = []; for (let i = 0; i < n; i++) out.push(destination(c, 360 * (1 - i / n), r)); return out; }
/** Rotate points about an Euler pole by `angle` degrees (positive = counter-clockwise seen from above the pole). Accepts a point, a list or a list of rings. */
export function rotate(pts, pole, angle) {
  const k = vec(pole), a = angle * D, c = Math.cos(a), s = Math.sin(a);
  const one = (p) => { const v = vec(p), kv = cross(k, v), d = dot3(k, v) * (1 - c); return lonlat([v[0] * c + kv[0] * s + k[0] * d, v[1] * c + kv[1] * s + k[1] * d, v[2] * c + kv[2] * s + k[2] * d]); };
  const go = (x) => (x.length && typeof x[0] === 'number') || (x && x.lon != null) ? one(x) : x.map(go);
  return go(pts);
}
/** Plate velocity v = ω × r at p for rotation `omega` °/Myr about `pole`: {speed (mm/yr), east, north, azimuth (deg)}. */
export function velocity(p, pole, omega, R = EARTH_KM) {
  const r = vec(p), w = vec(pole).map((x) => x * omega * D / 1e6), v = cross(w, r).map((x) => x * R * 1e6); // km→mm
  const [lon, lat] = LL(p).map((x) => x * D), east = -Math.sin(lon) * v[0] + Math.cos(lon) * v[1];
  const north = -Math.sin(lat) * Math.cos(lon) * v[0] - Math.sin(lat) * Math.sin(lon) * v[1] + Math.cos(lat) * v[2];
  return { speed: Math.hypot(east, north), east, north, azimuth: mod(Math.atan2(east, north) / D, 360) };
}

// ------------------------------------------------------------------ projections (unit sphere; raw functions in radians)
// Robinson's table (Snyder 1993): X = parallel length, Y = distance from the equator, at 0°, 5°, …, 90°.
const ROB = [[1, 0], [0.9986, 0.062], [0.9954, 0.124], [0.99, 0.186], [0.9822, 0.248], [0.973, 0.31], [0.96, 0.372], [0.9427, 0.434], [0.9216, 0.4958], [0.8962, 0.5571], [0.8679, 0.6176], [0.835, 0.6769], [0.7986, 0.7346], [0.7597, 0.7903], [0.7186, 0.8435], [0.6732, 0.8936], [0.6213, 0.9394], [0.5722, 0.9761], [0.5322, 1]];
/** Natural cubic spline through ys at x = 0, 1, …, n−1 → f(u). */
function spline(ys) {
  const n = ys.length, M = new Float64Array(n), c = new Float64Array(n), d = new Float64Array(n);
  for (let i = 1; i < n - 1; i++) { const r = 6 * (ys[i + 1] - 2 * ys[i] + ys[i - 1]), w = 4 - (i > 1 ? c[i - 1] : 0); c[i] = 1 / w; d[i] = (r - (i > 1 ? d[i - 1] : 0)) / w; }
  for (let i = n - 2; i >= 1; i--) M[i] = d[i] - c[i] * M[i + 1];
  return (u) => { const i = clamp(Math.floor(u), 0, n - 2), t = u - i, s = 1 - t; return s * ys[i] + t * ys[i + 1] + ((s * s * s - s) * M[i] + (t * t * t - t) * M[i + 1]) / 6; };
}
// even/odd extensions over −90°…90° so the interpolant is smooth across the equator
const ROBX = spline([...ROB.slice(1).reverse().map((r) => r[0]), ...ROB.map((r) => r[0])]), ROBY = spline([...ROB.slice(1).reverse().map((r) => -r[1]), ...ROB.map((r) => r[1])]);
const robX = (f) => ROBX(f / (5 * D) + 18), robY = (f) => ROBY(f / (5 * D) + 18);
function mollTheta(f) {
  if (Math.abs(f) > HALF - 1e-7) return Math.sign(f) * HALF;
  const k = PI * Math.sin(f); let t = 2 * f; // solve t + sin t = π sin φ for t = 2θ (Newton)
  for (let i = 0; i < 40; i++) { const dd = 1 + Math.cos(t); if (dd < 1e-15) break; const dt = (t + Math.sin(t) - k) / dd; t -= dt; if (Math.abs(dt) < 1e-13) break; }
  return t / 2;
}
const R2 = Math.SQRT2, TM = [[1, 0, 0], [0, 0, -1], [0, 1, 0]];
/** Projection catalogue: type 'cyl' = seam on the antimeridian (lat limit mL), 'az' = azimuthal with a clip cap (r(c) radial law). */
export const PROJECTIONS = {
  orthographic: { label: 'Orthographic', type: 'az', clip: 90, r: (c) => Math.sin(c), ri: (p) => (p <= 1 ? Math.asin(p) : NaN) },
  equirectangular: { label: 'Equirectangular', type: 'cyl', raw: (l, f) => [l, f], inv: (x, y) => [x, y] },
  mercator: { label: 'Mercator', type: 'cyl', conformal: true, mL: 85, raw: (l, f) => [l, Math.log(Math.tan(PI / 4 + f / 2))], inv: (x, y) => [x, Math.atan(Math.sinh(y))] },
  transverseMercator: { label: 'Transverse Mercator', type: 'cyl', conformal: true, mL: 80, aux: TM, raw: (l, f) => [Math.log(Math.tan(PI / 4 + f / 2)), -l], inv: (x, y) => [-y, Math.atan(Math.sinh(x))] },
  stereographic: { label: 'Stereographic', type: 'az', conformal: true, clip: 110, r: (c) => 2 * Math.tan(c / 2), ri: (p) => 2 * Math.atan(p / 2) },
  lambert: { label: 'Lambert azimuthal equal-area', type: 'az', equalArea: true, clip: 179.5, r: (c) => 2 * Math.sin(c / 2), ri: (p) => (p <= 2 ? 2 * Math.asin(p / 2) : NaN) },
  mollweide: {
    label: 'Mollweide', type: 'cyl', equalArea: true,
    raw: (l, f) => { const t = mollTheta(f); return [(2 * R2 / PI) * l * Math.cos(t), R2 * Math.sin(t)]; },
    inv: (x, y) => { if (Math.abs(y) > R2) return null; const t = Math.asin(y / R2), c = Math.cos(t); return [c > 1e-12 ? (PI * x) / (2 * R2 * c) : 0, Math.asin(clamp((2 * t + Math.sin(2 * t)) / PI, -1, 1))]; },
  },
  robinson: {
    label: 'Robinson', type: 'cyl',
    raw: (l, f) => [0.8487 * robX(f) * l, 1.3523 * robY(f)],
    inv: (x, y) => { const Y = y / 1.3523; if (Math.abs(Y) > 1) return null; let a = -HALF, b = HALF; for (let i = 0; i < 52; i++) { const m = (a + b) / 2; if (robY(m) < Y) a = m; else b = m; } const f = (a + b) / 2; return [x / (0.8487 * robX(f)), f]; },
  },
  gnomonic: { label: 'Gnomonic', type: 'az', clip: 60, r: (c) => Math.tan(c), ri: (p) => Math.atan(p) },
  azimuthalEquidistant: { label: 'Azimuthal equidistant', type: 'az', clip: 179.5, r: (c) => c, ri: (p) => (p <= PI ? p : NaN) },
};
const ALIAS = { ortho: 'orthographic', globe: 'orthographic', plate: 'equirectangular', platecarree: 'equirectangular', equirect: 'equirectangular', tmerc: 'transverseMercator', 'transverse-mercator': 'transverseMercator', stereo: 'stereographic', laea: 'lambert', 'lambert-azimuthal': 'lambert', equalArea: 'lambert', moll: 'mollweide', robin: 'robinson', gnomic: 'gnomonic', aeqd: 'azimuthalEquidistant', 'azimuthal-equidistant': 'azimuthalEquidistant', equidistant: 'azimuthalEquidistant' };

/**
 * A projection instance: projection('mollweide', { center: [lon0, lat0], roll, clip }).
 * forward(lon, lat) → [x, y] | null (clipped); invert(x, y) → [lon, lat] | null; tissot(lon, lat) → distortion;
 * clipLine(lonlats, closed) / clipPolygon(rings) → map polylines / rings; outline() → map ring; bounds.
 */
export function projection(name = 'orthographic', o = {}) {
  const key = PROJECTIONS[name] ? name : ALIAS[name] || ALIAS[String(name).toLowerCase()];
  const def = PROJECTIONS[key]; if (!def) throw new Error(`v.globe: unknown projection "${name}" (${Object.keys(PROJECTIONS).join(', ')})`);
  const [l0, f0] = o.center ? LL(o.center) : [0, 0], g = (o.roll || 0) * D;
  const cl = Math.cos(l0 * D), sl = Math.sin(l0 * D), cf = Math.cos(f0 * D), sf = Math.sin(f0 * D), cg = Math.cos(g), sg = Math.sin(g);
  let Mx = mm([[1, 0, 0], [0, cg, -sg], [0, sg, cg]], mm([[cf, 0, sf], [0, 1, 0], [-sf, 0, cf]], [[cl, sl, 0], [-sl, cl, 0], [0, 0, 1]]));
  if (def.aux) Mx = mm(def.aux, Mx);
  const P = { name: key, label: def.label, type: def.type, def, center: [l0, f0], roll: o.roll || 0, conformal: !!def.conformal, equalArea: !!def.equalArea };
  P.frame = (p) => mv(Mx, vec(p));
  P.unframe = (v) => lonlat(mtv(Mx, v));
  if (def.type === 'az') {
    const clip = clamp(o.clip ?? def.clip, 1, 179.5) * D, cc = Math.cos(clip), rC = def.r(clip);
    Object.assign(P, { clip: clip / D, perimeter: TAU, rMax: rC });
    P.rawV = (v) => { const c = Math.acos(clamp(v[0], -1, 1)), s = Math.hypot(v[1], v[2]); if (s < 1e-15) return [0, 0]; const k = def.r(c) / s; return [k * v[1], k * v[2]]; };
    P.invV = (x, y) => { const p = Math.hypot(x, y); if (p > rC * (1 + 1e-9)) return null; if (p < 1e-15) return [1, 0, 0]; const c = def.ri(p); if (!isFinite(c)) return null; const s = Math.sin(c); return [Math.cos(c), (s * x) / p, (s * y) / p]; };
    P.inside = (v) => v[0] >= cc - 1e-12;
    P.pp = P.rawV;
    P.edgePt = (th) => [rC * Math.cos(th), rC * Math.sin(th)];
    P.edges = (a, b) => { // events where the chord a→b leaves/enters the cap
      const ia = a[0] >= cc, ib = b[0] >= cc; if (ia === ib) return null;
      let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, u = unit([a[0] + m * (b[0] - a[0]), a[1] + m * (b[1] - a[1]), a[2] + m * (b[2] - a[2])]); if ((u[0] >= cc) === ia) lo = m; else hi = m; }
      const u = unit([a[0] + lo * (b[0] - a[0]), a[1] + lo * (b[1] - a[1]), a[2] + lo * (b[2] - a[2])]), th = mod(Math.atan2(u[2], u[1]), TAU);
      return [{ exit: ia, s: th, pt: P.edgePt(th) }];
    };
    P.arc = (s0, s1) => { let d = mod(s1 - s0, TAU); const n = Math.ceil(d / (3 * D)), out = []; for (let i = 1; i < n; i++) out.push(P.edgePt(s0 + (d * i) / n)); return out; };
    P.outline = () => { const out = []; for (let i = 0; i < 180; i++) out.push(P.edgePt((TAU * i) / 180)); return out; };
    P.bounds = { x: [-rC, rC], y: [-rC, rC] };
    P.contains = (V) => { // winding number of the ring (azimuthal-equidistant coordinates) about the cap centre
      let w = 0, prev = null; for (const v of V) { const c = Math.acos(clamp(v[0], -1, 1)), s = Math.hypot(v[1], v[2]) || 1e-15, a = Math.atan2(v[2] * c / s, v[1] * c / s); if (prev != null) { let d = a - prev; if (d > PI) d -= TAU; if (d < -PI) d += TAU; w += d; } prev = a; }
      const a0 = Math.atan2(V[0][2], V[0][1]); let d = a0 - prev; if (d > PI) d -= TAU; if (d < -PI) d += TAU; w += d; return Math.round(w / TAU);
    };
  } else {
    const mL = (def.mL ?? 90) * D, mL0 = Math.min(mL, HALF - 1e-9), per = 4 * PI + 4 * mL;
    const fl = (v) => [Math.atan2(v[1], v[0]), Math.atan2(v[2], Math.hypot(v[0], v[1]))];
    Object.assign(P, { perimeter: per, maxLat: mL / D });
    P.rawV = (v) => { const [l, f] = fl(v); return def.raw(l, f); };
    P.invV = (x, y) => { const r = def.inv(x, y); if (!r || !isFinite(r[0]) || !isFinite(r[1]) || Math.abs(r[0]) > PI * (1 + 1e-9) || Math.abs(r[1]) > mL + 1e-9) return null; const c = Math.cos(r[1]); return [c * Math.cos(r[0]), c * Math.sin(r[0]), Math.sin(r[1])]; };
    P.inside = (v) => Math.abs(fl(v)[1]) <= mL + 1e-12;
    P.pp = (v) => { const [l, f] = fl(v); return def.raw(l, clamp(f, -mL0, mL0)); };
    // perimeter coordinate s of the frame rectangle [−π, π] × [−mL, mL], counter-clockwise from the bottom-left corner
    const S = (l, f) => { f = clamp(f, -mL, mL); return l > 0 ? 2 * PI + mL + f : 4 * PI + 3 * mL - f; };
    const atS = (s) => { s = mod(s, per); if (s < 2 * PI) return [-PI + s, -mL0]; if (s < 2 * PI + 2 * mL) return [PI, -mL0 + (s - 2 * PI)]; if (s < 4 * PI + 2 * mL) return [PI - (s - 2 * PI - 2 * mL), mL0]; return [-PI, mL0 - (s - 4 * PI - 2 * mL)]; };
    P.edgePt = (s) => { const [l, f] = atS(s); return def.raw(l, clamp(f, -mL0, mL0)); };
    P.edges = (a, b, poly) => {
      const A = fl(a), B = fl(b), ev = [];
      if (Math.abs(A[0] - B[0]) > PI && Math.hypot(a[0], a[1]) > 1e-9 && Math.hypot(b[0], b[1]) > 1e-9) { // crosses the seam (y = 0, x < 0)
        const t = a[1] / (a[1] - b[1]), X = [a[0] + t * (b[0] - a[0]), 0, a[2] + t * (b[2] - a[2])], f = Math.atan2(X[2], Math.abs(X[0])), sd = A[0] > 0 ? 1 : -1;
        if (poly || Math.abs(f) <= mL) ev.push({ t, exit: true, s: S(sd, f), pt: def.raw(sd * PI, clamp(f, -mL0, mL0)) }, { t, exit: false, s: S(-sd, f), pt: def.raw(-sd * PI, clamp(f, -mL0, mL0)) });
      }
      if (!poly && mL < HALF) { // latitude limit (Mercator): lines stop at ±mL
        const ia = Math.abs(A[1]) <= mL, ib = Math.abs(B[1]) <= mL;
        if (ia !== ib) {
          let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, f = fl([a[0] + m * (b[0] - a[0]), a[1] + m * (b[1] - a[1]), a[2] + m * (b[2] - a[2])])[1]; if ((Math.abs(f) <= mL) === ia) lo = m; else hi = m; }
          const u = fl([a[0] + lo * (b[0] - a[0]), a[1] + lo * (b[1] - a[1]), a[2] + lo * (b[2] - a[2])]);
          ev.push({ t: lo, exit: ia, s: 0, pt: def.raw(u[0], clamp(u[1], -mL0, mL0)) });
        }
      }
      return ev.length ? ev.sort((p, q) => p.t - q.t) : null;
    };
    const corners = [0, 2 * PI, 2 * PI + 2 * mL, 4 * PI + 2 * mL];
    P.arc = (s0, s1) => { // along the map edge, through the corners
      const d = mod(s1 - s0, per), n = Math.ceil(d / (2 * D)), ts = [];
      for (let i = 1; i < n; i++) ts.push((d * i) / n);
      for (const c of corners) { const r = mod(c - s0, per); if (r > 1e-12 && r < d - 1e-12) ts.push(r); }
      return ts.sort((a, b) => a - b).map((r) => P.edgePt(s0 + r));
    };
    P.outline = () => { const out = []; for (let s = 0; s < per; s += 2 * D) out.push(P.edgePt(s)); return out; };
    const ol = P.outline(); P.bounds = { x: [Math.min(...ol.map((p) => p[0])), Math.max(...ol.map((p) => p[0]))], y: [Math.min(...ol.map((p) => p[1])), Math.max(...ol.map((p) => p[1]))] };
    P.contains = () => 0;
  }
  P.forward = (lon, lat) => { const v = P.frame(lat === undefined ? lon : [lon, lat]); return P.inside(v) ? P.rawV(v) : null; };
  P.invert = (x, y) => { const v = P.invV(x, y); return v ? P.unframe(v) : null; };
  /** Line clipping: list of [lon, lat] → list of map polylines. */
  P.clipLine = (pts, closed = false) => {
    const V = pts.map((p) => P.frame(p)), n = V.length, out = []; if (n < 2) return out;
    let cur = P.inside(V[0]) ? [P.pp(V[0])] : null; const startIn = !!cur; let broke = false;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = V[i], b = V[(i + 1) % n], ev = P.edges(a, b, false);
      if (ev) for (const e of ev) { if (e.exit) { if (cur) { cur.push(e.pt); if (cur.length > 1) out.push(cur); } cur = null; broke = true; } else cur = [e.pt]; }
      if (P.inside(b) && cur) cur.push(P.pp(b));
    }
    if (cur && cur.length > 1) out.push(cur);
    if (closed && startIn && broke && cur && out.length > 1) { const last = out.pop(); out[0] = last.concat(out[0].slice(1)); }
    return out;
  };
  /** Polygon clipping (Weiler–Atherton on the map edge): rings of [lon, lat] (outer CCW, holes CW) → map rings. */
  P.clipPolygon = (rings) => {
    const runs = [], whole = [], IN = P.type === 'cyl' ? () => true : P.inside; // cylindrical polygons are clamped, never hidden
    rings.forEach((pts, ri) => {
      const V = pts.map((p) => P.frame(p)), n = V.length; if (n < 3) return;
      let cur = IN(V[0]) ? { pts: [P.pp(V[0])], s0: null } : null; const pieces = []; let any = false;
      for (let i = 0; i < n; i++) {
        const a = V[i], b = V[(i + 1) % n], ev = P.edges(a, b, true);
        if (ev) for (const e of ev) { any = true; if (e.exit) { if (cur) { cur.pts.push(e.pt); cur.s1 = e.s; pieces.push(cur); } cur = null; } else cur = { pts: [e.pt], s0: e.s }; }
        if (i < n - 1 && cur && IN(b)) cur.pts.push(P.pp(b));
      }
      if (!any) {
        if (IN(V[0])) whole.push(V.map(P.pp));
        else { const w = P.contains(V); if ((ri === 0 && w > 0) || (ri > 0 && w < 0)) { const ol = P.outline(); whole.push(ri === 0 ? ol : ol.reverse()); } }
        return;
      }
      if (cur) { const first = pieces.find((p) => p.s0 == null); if (first) { first.pts = cur.pts.concat(first.pts); first.s0 = cur.s0; } }
      for (const p of pieces) if (p.s0 != null && p.s1 != null) runs.push(p);
    });
    const used = new Uint8Array(runs.length), per = P.perimeter;
    for (let i = 0; i < runs.length; i++) {
      if (used[i]) continue; const loop = []; let k = i, guard = 0;
      while (guard++ <= runs.length) {
        used[k] = 1; loop.push(...runs[k].pts);
        let best = -1, bd = Infinity;
        for (let j = 0; j < runs.length; j++) { if (used[j] && j !== i) continue; const d = mod(runs[j].s0 - runs[k].s1, per); if (d < bd) { bd = d; best = j; } }
        if (best < 0) break; loop.push(...P.arc(runs[k].s1, runs[best].s0)); if (best === i) break; k = best;
      }
      whole.push(loop);
    }
    return whole;
  };
  /** Distortion at a point from the numerical Jacobian: semi-axes a ≥ b, h (meridian), k (parallel) scales, area = ab, ω (deg). */
  P.tissot = (lon, lat) => {
    if (lat === undefined) [lon, lat] = LL(lon);
    if (Math.abs(lat) > 89.5) return null;
    const hd = 1e-3, F = (l, f) => P.rawV(P.frame([l, f])), c = F(lon, lat), e1 = F(lon + hd, lat), e0 = F(lon - hd, lat), n1 = F(lon, lat + hd), n0 = F(lon, lat - hd);
    if (![c, e1, e0, n1, n0].every((p) => p && isFinite(p[0]) && isFinite(p[1]))) return null;
    const ce = 2 * hd * D * Math.cos(lat * D), E = [(e1[0] - e0[0]) / ce, (e1[1] - e0[1]) / ce], N = [(n1[0] - n0[0]) / (2 * hd * D), (n1[1] - n0[1]) / (2 * hd * D)];
    if (Math.hypot(e1[0] - e0[0], e1[1] - e0[1]) > 0.3 || Math.hypot(n1[0] - n0[0], n1[1] - n0[1]) > 0.3) return null; // straddles the seam
    const s1 = E[0] ** 2 + E[1] ** 2 + N[0] ** 2 + N[1] ** 2, det = E[0] * N[1] - E[1] * N[0];
    const a = Math.sqrt((s1 + Math.sqrt(Math.max(0, s1 * s1 - 4 * det * det))) / 2), b = Math.abs(det) / a;
    const h = Math.hypot(...N), k = Math.hypot(...E), theta = Math.acos(clamp((E[0] * N[0] + E[1] * N[1]) / (h * k), -1, 1)) / D;
    return { center: c, E, N, a, b, h, k, area: Math.abs(det), omega: (2 * Math.asin(clamp((a - b) / (a + b), 0, 1))) / D, theta };
  };
  return P;
}

// ------------------------------------------------------------------ world land (Natural Earth 110m, public domain)
const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const ALI = Object.fromEntries([...AL].map((c, i) => [c, i]));
/** Decode one ring of world-110m.js → [[lon, lat], …]. */
export function decodeRing(s) {
  const nums = []; let z = 0, sh = 1;
  for (const ch of s) { const c = ALI[ch]; z += (c & 31) * sh; if (c & 32) sh *= 32; else { nums.push(z % 2 ? -(z + 1) / 2 : z / 2); z = 0; sh = 1; } }
  const out = []; let x = 0, y = 0; for (let i = 0; i + 1 < nums.length; i += 2) { x += nums[i]; y += nums[i + 1]; out.push([x / 10, y / 10]); }
  return out;
}
let LAND = null;
/** The world's land as [{name, rings: [outer, ...holes]}] (66 polygons, ~2.2k vertices). Named: continents and big islands. */
export function land() { return (LAND ||= LAND_110M.map(([name, ...rs]) => ({ name, rings: rs.map(decodeRing) }))); }
/** Rings of one named land mass ('Africa', 'South America', 'Eurasia', 'Australia', 'Greenland', 'Madagascar', …). */
export function landmass(name) { const f = land().find((p) => p.name.toLowerCase() === String(name).toLowerCase()); if (!f) throw new Error(`v.globe: unknown land mass "${name}"`); return f.rings; }

/** Spherical polygon area (steradians, positive for CCW rings) — exact for great-circle edges (L'Huilier-free, via vector triangles). */
export function sphericalArea(ring) {
  let s = 0; const V = ring.map(vec), c = unit(V.reduce((a, v) => [a[0] + v[0], a[1] + v[1], a[2] + v[2]], [0, 0, 0]));
  for (let i = 0; i < V.length; i++) { const a = V[i], b = V[(i + 1) % V.length]; s += 2 * Math.atan2(dot3(c, cross(a, b)), 1 + dot3(c, a) + dot3(a, b) + dot3(b, c)); }
  return s;
}

// ================================================================== the kit
const fmtKm = (x) => (x >= 100 ? Math.round(x).toLocaleString('en-US').replace(/,/g, '\u202f') : x.toFixed(1)) + '\u00a0km'; // narrow no-break spaces
class Globe {
  constructor(api, rt, stage, spec = {}) {
    if (!stage || typeof stage.X !== 'function') throw new Error('v.globe(stage, spec): the first argument must be a 2D stage');
    this.api = api; this.rt = rt; this.s = stage;
    stage.o.equal = true; stage.o.axes = false; stage.o.grid = false;
    this.o = { projection: 'orthographic', center: [0, 20], roll: 0, graticule: 30, land: true, outline: true, drag: true, zoom: 1, pad: 0.04, wheel: false, ...spec };
    this._center = LL(this.o.center).slice(); this._name = this.o.projection; this._roll = this.o.roll; this._clip = this.o.clip; this.zoom = this.o.zoom;
    this._hs = []; this._P = null; this._key = '';
    this.onRotate = spec.onRotate || null;
    this._bind();
    api.render(() => this._sync()); // runs before content draws: view + handle positions
  }
  // ---------------------------------------------------------------- state
  get P() {
    const k = `${this._name}|${this._center}|${this._roll}|${this._clip}`;
    if (k !== this._key) { this._P = projection(this._name, { center: this._center, roll: this._roll, clip: this._clip }); this._key = k; }
    return this._P;
  }
  get projection() { return this.P.name; }
  set projection(n) { this._name = n; this.rt.invalidate(); }
  get center() { return this._center.slice(); }
  set center(c) { const [l, f] = LL(c); this._center = [mod(l + 180, 360) - 180, clamp(f, -90, 90)]; this.rt.invalidate(); }
  /** Change several settings at once: {projection, center, roll, clip, zoom}. Cheap; fine inside render. */
  set(o = {}) {
    if (o.projection != null) this._name = o.projection; if (o.center) this.center = o.center; if (o.roll != null) this._roll = o.roll;
    if ('clip' in o) this._clip = o.clip; if (o.zoom != null) this.zoom = o.zoom; return this;
  }
  project(lon, lat) { return this.P.forward(lon, lat); }
  invert(x, y) { return this.P.invert(x, y); }
  visible(p) { return !!this.P.forward(p); }
  /** Distortion at p: {a, b, h, k, area, omega, theta}. */
  distortion(p) { return this.P.tissot(p); }
  _sync() {
    const P = this.P, b = P.bounds, pad = 1 + this.o.pad, z = this.zoom || 1;
    const cx = (b.x[0] + b.x[1]) / 2, cy = (b.y[0] + b.y[1]) / 2, hw = ((b.x[1] - b.x[0]) / 2) * pad / z, hh = ((b.y[1] - b.y[0]) / 2) * pad / z;
    this.s.setView([cx - hw, cx + hw], [cy - hh, cy + hh]);
    for (const { pt, hd } of this._hs) { const q = P.forward(pt.lon, pt.lat); hd.visible = !!q && pt.visible !== false; if (q && !hd.dragging) { hd.x = q[0]; hd.y = q[1]; } hd.label = pt.label; hd.color = pt.color; }
  }
  _bind() {
    const s = this.s, cv = s.canvas; let start = null;
    if (this.o.drag) {
      s.onDrag((x, y, phase) => {
        const px = s.X(x), py = s.Y(y);
        if (phase === 'start') { start = [px, py, ...this._center]; return; }
        if (!start) return;
        const k = 1 / (s.scale * D), az = this.P.type === 'az' || this.o.drag === 'free';
        this.center = [start[2] - (px - start[0]) * k, az ? clamp(start[3] + (py - start[1]) * k, -90, 90) : start[3]];
        this.onRotate?.(this.center);
        if (phase === 'end') start = null;
      });
      cv.style.cursor = 'grab';
      cv.addEventListener('pointermove', () => { if (!s.handles.some((h) => h.hover || h.dragging)) cv.style.cursor = s.pointer.down ? 'grabbing' : 'grab'; });
    }
    if (this.o.wheel) cv.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom = clamp(this.zoom * Math.exp(-e.deltaY * 0.0015), 0.6, 24); this.rt.invalidate(); }, { passive: false });
  }
  /**
   * A draggable point on the sphere → {lon, lat, set(lon, lat)}. Pass an existing point (from this or another globe)
   * to show the same point here too: const A = G1.handle(-74, 40.7, {label: 'A'}); G2.handle(A).
   */
  handle(lon, lat, st = {}) {
    let pt;
    if (lon && typeof lon === 'object' && !Array.isArray(lon)) { pt = lon; st = lat || {}; }
    else {
      if (Array.isArray(lon)) { st = lat || {}; [lon, lat] = lon; }
      const rt = this.rt; pt = { lon, lat, label: st.label, color: st.color || 'accent', set(l, f) { this.lon = l; this.lat = f; rt.invalidate(); }, get ll() { return [this.lon, this.lat]; } };
    }
    const hd = this.s.handle(0, 0, {
      color: pt.color, r: st.r, label: pt.label, labelPos: st.labelPos,
      constrain: (x, y) => { const q = this.P.invert(x, y); if (!q) return [hd.x, hd.y]; let [l, f] = q; if (st.constrain) [l, f] = st.constrain(l, f) || [l, f]; pt.lon = l; pt.lat = f; const p = this.P.forward(l, f); return p || [hd.x, hd.y]; },
      onDrag: () => st.onDrag?.(pt),
    });
    this._hs.push({ pt, hd }); this._sync(); return pt;
  }
  // ---------------------------------------------------------------- layers
  /** Base map: ocean/sphere, graticule, land, outline. o = {graticule: step°|false, land: true|false|[names], ocean, landColor, shade}. */
  draw(o = {}) {
    this._sync();
    const s = this.s, P = this.P, st = { ...this.o, ...o }, ol = P.outline();
    if (st.ocean !== false) s.poly(ol, { fill: st.ocean || 'blue', fillAlpha: st.oceanAlpha ?? 0.07, stroke: false });
    if (P.name === 'orthographic' && st.shade !== false) {
      const c = s.ctx, X = s.X(0), Y = s.Y(0), R = s.scale * P.rMax, gr = c.createRadialGradient(X - R * 0.35, Y - R * 0.4, R * 0.1, X, Y, R);
      gr.addColorStop(0, this.api.color('panel', 0.45)); gr.addColorStop(0.75, this.api.color('panel', 0)); gr.addColorStop(1, this.api.color('ink', 0.07));
      c.save(); c.beginPath(); c.arc(X, Y, R, 0, TAU); c.fillStyle = gr; c.fill(); c.restore();
    }
    if (st.graticule) this.graticule(st.graticule);
    if (st.land) this.land(st.land === true ? null : st.land, { fill: st.landColor, color: st.coastColor });
    if (st.outline) s.poly(ol, { color: 'faint', width: 1.2 });
    return this;
  }
  /** Meridians and parallels every `step` degrees (o.color, o.width, o.alpha). */
  graticule(step = 30, o = {}) {
    const lines = [];
    for (let l = -180; l < 180; l += step) { const m = []; for (let f = -90 + 1e-6; f <= 90; f += 2) m.push([l, Math.min(f, 90 - 1e-6)]); m.push([l, 90 - 1e-6]); lines.push(m); }
    for (let f = -90 + step; f < 90 - 1e-9; f += step) { const p = []; for (let l = -180; l <= 180; l += 2) p.push([l, f]); lines.push(p); }
    const out = []; for (const L of lines) for (const pl of this.P.clipLine(L)) out.push(...pl, null);
    this.s.path(out, { color: o.color || 'muted', width: o.width ?? 0.7, alpha: o.alpha ?? 0.35 });
    if (o.equator !== false) { const eq = []; for (let l = -180; l <= 180; l += 2) eq.push([l, 0]); const e = []; for (const pl of this.P.clipLine(eq)) e.push(...pl, null); this.s.path(e, { color: o.color || 'muted', width: (o.width ?? 0.7) + 0.2, alpha: (o.alpha ?? 0.35) + 0.1 }); }
    return this;
  }
  /** Land fill + coastline; names = null (all) or a list of land-mass names; o.fill/o.color/o.alpha. */
  land(names = null, o = {}) {
    const L = land().filter((p) => !names || names.includes(p.name));
    for (const p of L) this.polygon(p.rings, { fill: o.fill || 'gold', fillAlpha: o.fillAlpha ?? 0.26, color: o.color || 'gold', width: o.width ?? 0.9, alpha: o.alpha ?? 0.75 });
    return this;
  }
  /** Filled spherical polygon: rings of [lon, lat] (outer counter-clockwise, holes clockwise). st: stage style + {fill, stroke}. */
  polygon(rings, st = {}) {
    if (rings.length && typeof rings[0][0] === 'number') rings = [rings];
    if (st.fill) this.s.rings(this.P.clipPolygon(rings), { fill: st.fill, fillAlpha: st.fillAlpha ?? 0.2, stroke: false });
    if (st.stroke !== false) { const out = []; for (const r of rings) for (const pl of this.P.clipLine(r, true)) out.push(...pl, null); this.s.path(out, { color: st.color || st.fill || 'ink', width: st.width ?? 1.4, alpha: st.alpha, dash: st.dash }); }
    return this;
  }
  /** Polyline through [lon, lat] points; geodesic (great-circle) edges unless st.geodesic === false. */
  path(pts, st = {}) {
    const P = this.P, dense = [];
    pts = pts.map(LL);
    if (st.geodesic === false) dense.push(...pts); else for (let i = 0; i + 1 < pts.length; i++) { const seg = interpolate(pts[i], pts[i + 1], Math.max(1, Math.ceil(centralAngle(pts[i], pts[i + 1]) / 1.5))); dense.push(...(i ? seg.slice(1) : seg)); }
    const out = []; for (const pl of P.clipLine(dense, !!st.close)) out.push(...pl, null);
    this.s.path(out, st); return this;
  }
  /** Great-circle arc a→b (st.full: also the whole great circle, faint). Returns its length in km (haversine). */
  greatCircle(a, b, st = {}) {
    if (st.full) this.path(greatCirclePoints(LL(a), LL(b)), { color: st.color || 'green', width: 1, dash: [4, 4], alpha: 0.6, geodesic: false });
    this.path([a, b], { color: 'green', width: 2.6, ...st });
    return haversine(a, b, st.R ?? EARTH_KM);
  }
  /** Rhumb line (constant bearing) a→b. Returns its length in km. */
  rhumbLine(a, b, st = {}) { const r = rhumb(a, b, st.R ?? EARTH_KM, 160); this.path(r.points, { color: 'red', width: 2.2, dash: [7, 5], ...st, geodesic: false }); return r.length; }
  /** Small circle of angular radius r° about c (st.fill to shade it). */
  smallCircle(c, r, st = {}) { return this.polygon([smallCircle(LL(c), r, 120)], { color: 'orange', width: 1.6, ...st }); }
  dot(p, st = {}) { const q = this.P.forward(p); if (q) this.s.dot(q[0], q[1], st); return this; }
  text(str, p, st = {}) { const q = this.P.forward(p); if (q) this.s.text(str, q[0], q[1], st); return this; }
  tex(latex, p, st = {}) { const q = this.P.forward(p); if (q) this.s.tex(latex, q[0], q[1], st); return this; }
  /** Geodesic arrow a→b (the head is drawn only if the tip is visible). */
  arrow(a, b, st = {}) {
    const pts = interpolate(LL(a), LL(b), 12), tip = this.P.forward(pts[12]), pre = this.P.forward(pts[10]);
    this.path(pts.slice(0, 11), { width: st.width ?? 1.8, color: st.color || 'ink', alpha: st.alpha, geodesic: false });
    if (tip && pre) this.s.arrow(pre[0], pre[1], tip[0], tip[1], { width: st.width ?? 1.8, color: st.color || 'ink', alpha: st.alpha, head: st.head ?? 7 });
    return this;
  }
  /** One Tissot indicatrix at p: the image of a geodesic circle of radius r° under the Jacobian. Returns the distortion info. */
  indicatrix(p, st = {}) {
    const T = this.P.tissot(p), r = (st.radius ?? 5) * D; if (!T || !this.P.forward(p)) return T;
    const [cx, cy] = T.center, pts = [];
    for (let i = 0; i <= 72; i++) { const t = (TAU * i) / 72, c = Math.cos(t) * r, s = Math.sin(t) * r; pts.push([cx + T.E[0] * c + T.N[0] * s, cy + T.E[1] * c + T.N[1] * s]); }
    this.s.path(pts, { fill: st.fill ?? 'red', fillAlpha: st.fillAlpha ?? 0.22, color: st.color || 'red', width: st.width ?? 1.2, close: true });
    if (st.axes) { // principal directions from the eigenvectors of JJᵀ
      const A = T.E[0] ** 2 + T.N[0] ** 2, B = T.E[0] * T.E[1] + T.N[0] * T.N[1], C = T.E[1] ** 2 + T.N[1] ** 2, th = 0.5 * Math.atan2(2 * B, A - C);
      const ux = Math.cos(th), uy = Math.sin(th);
      this.s.line(cx - ux * T.a * r, cy - uy * T.a * r, cx + ux * T.a * r, cy + uy * T.a * r, { color: st.color || 'red', width: 1, alpha: 0.8 });
      this.s.line(cx + uy * T.b * r, cy - ux * T.b * r, cx - uy * T.b * r, cy + ux * T.b * r, { color: st.color || 'red', width: 1, alpha: 0.8 });
    }
    if (st.circle) this.smallCircle(p, st.radius ?? 5, { color: st.circleColor || 'ink', width: 1, dash: [3, 3], alpha: 0.7 }); // the true image, for comparison
    return T;
  }
  /** Grid of indicatrices every `step`° (o.lat = [lo, hi], o.lon = [lo, hi], o.radius°, style keys). Returns the list of {p, ...distortion}. */
  tissot(o = {}) {
    const step = o.step ?? 30, [la, lb] = o.lat || [-60, 60], [lo0, lo1] = o.lon || [-180 + step / 2, 180], out = []; // offset by step/2 keeps ellipses off the seam
    for (let f = la; f <= lb + 1e-9; f += o.latStep ?? step) for (let l = lo0; l < lo1 - 1e-9; l += step) { const T = this.indicatrix([l, f], o); if (T) out.push({ p: [l, f], ...T }); }
    return out;
  }
  /** Velocity arrows for a rotation about `pole` at `omega` °/Myr on a grid (o.step°, o.points list, o.scale = arrow length factor). */
  velocities(pole, omega, o = {}) {
    const step = o.step ?? 20, pts = o.points || [];
    if (!o.points) for (let f = -80; f <= 80; f += step) for (let l = -180; l < 180; l += step / Math.max(0.35, Math.cos(f * D))) pts.push([l, f]);
    const col = o.color || 'purple';
    for (const p of pts) {
      if (!this.P.forward(p)) continue;
      const sp = Math.sin(centralAngle(p, pole) * D); if (sp < 0.04) continue;
      const ang = omega * (o.scale ?? 6), steps = 6, arc = []; // o.scale = degrees of rotation drawn per °/Myr
      for (let i = 0; i <= steps; i++) arc.push(rotate(p, pole, (ang * i) / steps));
      const vis = arc.map((q) => this.P.forward(q)); if (vis.some((q) => !q)) continue;
      this.s.path(vis.slice(0, steps), { color: col, width: o.width ?? 1.5, alpha: o.alpha ?? 0.85 });
      this.s.arrow(vis[steps - 1][0], vis[steps - 1][1], vis[steps][0], vis[steps][1], { color: col, width: o.width ?? 1.5, alpha: o.alpha ?? 0.85, head: 6 });
    }
    return this;
  }
  /** Rings of a named land mass (for rotating continents). */
  landmass(name) { return landmass(name); }
  /** Readable length: 12 345 km. */
  km(x) { return fmtKm(x); }
}

export default function globe(api, rt, stage, spec) { return new Globe(api, rt, stage, spec); }
export const GEO = { haversine, distance: haversine, centralAngle, bearing, destination, interpolate, greatCirclePoints, rhumb, smallCircle, rotate, velocity, projection, projections: () => Object.keys(PROJECTIONS), tissot: (name, p, o) => projection(name, o).tissot(p), land, landmass, sphericalArea, vec, lonlat, EARTH_KM };
Object.assign(globe, GEO);
/** v.geo(name, ...args) → spherical helpers (haversine, rhumb, rotate, velocity, projection, tissot, land, …); v.geo() → the table. */
export function geo(api, rt, name, ...args) {
  if (name == null) return GEO;
  const f = GEO[name]; if (f == null) throw new Error(`v.geo: unknown helper "${name}" (${Object.keys(GEO).join(', ')})`);
  return typeof f === 'function' ? f(...args) : f;
}
