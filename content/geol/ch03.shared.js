// Geology & Geophysics — Chapter 3: helpers shared by ch03.js, ch03-b.js and ch03-c.js (plain named exports).
// Re-exports the Chapter 2 helpers (decay constants, age formatting).
// Spherical geometry here works on [lon, lat] in degrees; rotations are 3×3 matrices acting on unit vectors
// (x → (0°,0°), z → north pole). A positive rotation angle is counter-clockwise seen from above the pole.
export * from './ch02.shared.js';

export const D = Math.PI / 180;
export const R_EARTH = 6371.0088; // km, IUGG mean radius
export const wrap180 = (x) => ((((x + 180) % 360) + 360) % 360) - 180;
export const mod360 = (x) => ((x % 360) + 360) % 360;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ── vectors ────────────────────────────────────────────────────────────────
export const V = (p) => { const l = p[0] * D, f = p[1] * D, c = Math.cos(f); return [c * Math.cos(l), c * Math.sin(l), Math.sin(f)]; };
export const LL = (u) => [Math.atan2(u[1], u[0]) / D, Math.atan2(u[2], Math.hypot(u[0], u[1])) / D];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const vscale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const vnorm = (a) => Math.hypot(a[0], a[1], a[2]);
export const vunit = (a) => { const n = vnorm(a) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
/** Central angle between two [lon, lat] points, degrees. */
export const angDist = (a, b) => { const u = V(a), w = V(b); return Math.atan2(vnorm(cross(u, w)), dot(u, w)) / D; };
/** Initial bearing (deg clockwise from north) of the great circle a → b. */
export function bearing(a, b) {
  const l1 = a[0] * D, f1 = a[1] * D, l2 = b[0] * D, f2 = b[1] * D, dl = l2 - l1;
  return mod360(Math.atan2(Math.sin(dl) * Math.cos(f2), Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl)) / D);
}
/** Point reached from p after `dist` degrees along initial bearing `brg`. */
export function dest(p, brg, dist) {
  const l1 = p[0] * D, f1 = p[1] * D, t = brg * D, d = dist * D;
  const f2 = Math.asin(clamp(Math.sin(f1) * Math.cos(d) + Math.cos(f1) * Math.sin(d) * Math.cos(t), -1, 1));
  const l2 = l1 + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(f1), Math.cos(d) - Math.sin(f1) * Math.sin(f2));
  return [wrap180(l2 / D), f2 / D];
}
/** Points on the minor great-circle arc a → b (n segments). */
export function arc(a, b, n = 40) {
  const u = V(a), w = V(b), om = Math.atan2(vnorm(cross(u, w)), dot(u, w)), out = [];
  if (om < 1e-12) return [a.slice(), b.slice()];
  const s = Math.sin(om);
  for (let i = 0; i <= n; i++) { const t = i / n, k0 = Math.sin((1 - t) * om) / s, k1 = Math.sin(t * om) / s; out.push(LL(vadd(vscale(u, k0), vscale(w, k1)))); }
  return out;
}

// ── rotations ──────────────────────────────────────────────────────────────
/** Rotation matrix (Rodrigues) about the pole [lon, lat] (or a unit vector) by `ang` degrees. */
export function rotMat(pole, ang) {
  const k = pole.length === 3 ? vunit(pole) : V(pole), a = ang * D, c = Math.cos(a), s = Math.sin(a), t = 1 - c;
  const [x, y, z] = k;
  return [[c + x * x * t, x * y * t - z * s, x * z * t + y * s], [y * x * t + z * s, c + y * y * t, y * z * t - x * s], [z * x * t - y * s, z * y * t + x * s, c + z * z * t]];
}
export const mmul = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
export const mapply = (M, u) => [M[0][0] * u[0] + M[0][1] * u[1] + M[0][2] * u[2], M[1][0] * u[0] + M[1][1] * u[1] + M[1][2] * u[2], M[2][0] * u[0] + M[2][1] * u[1] + M[2][2] * u[2]];
export const mT = (M) => [[M[0][0], M[1][0], M[2][0]], [M[0][1], M[1][1], M[2][1]], [M[0][2], M[1][2], M[2][2]]];
export const ID3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
/** Apply a rotation matrix to a [lon, lat] point, a list of points, or rings. */
export function rotApply(M, pts) {
  if (typeof pts[0] === 'number') return LL(mapply(M, V(pts)));
  return pts.map((q) => rotApply(M, q));
}
/** Rotate points about pole by angle (degrees). */
export const rotPts = (pts, pole, ang) => rotApply(rotMat(pole, ang), pts);
/** Axis and angle of a rotation matrix: {pole: [lon, lat], angle (deg, 0…180 about the returned pole)}. */
export function axisAngle(M) {
  const tr = M[0][0] + M[1][1] + M[2][2], ang = Math.acos(clamp((tr - 1) / 2, -1, 1));
  if (ang < 1e-9) return { pole: [0, 90], angle: 0, vec: [0, 0, 1] };
  let k;
  if (Math.PI - ang < 1e-6) { // half turn: pick the largest diagonal term
    const d = [M[0][0], M[1][1], M[2][2]], i = d.indexOf(Math.max(...d)), col = [M[0][i], M[1][i], M[2][i]]; col[i] += 1; k = vunit(col);
  } else k = vunit([M[2][1] - M[1][2], M[0][2] - M[2][0], M[1][0] - M[0][1]]);
  return { pole: LL(k), angle: ang / D, vec: k };
}
/** Euler vector (°/Myr) as a 3-vector from a pole and a rate. */
export const evec = (pole, rate) => vscale(V(pole), rate);
/** Pole [lon, lat] and rate of an Euler vector (rate ≥ 0). */
export const evecToPole = (w) => ({ pole: LL(w), rate: vnorm(w) });
/** Velocity of the point p for rotation `rate` °/Myr about `pole`: v = ω × r. Returns {east, north, speed (mm/yr), az (deg)}. */
export function velAt(p, pole, rate) {
  const w = vscale(V(pole), rate * D / 1e6), r = V(p), vv = vscale(cross(w, r), R_EARTH * 1e6);
  const l = p[0] * D, f = p[1] * D;
  const east = -Math.sin(l) * vv[0] + Math.cos(l) * vv[1];
  const north = -Math.sin(f) * Math.cos(l) * vv[0] - Math.sin(f) * Math.sin(l) * vv[1] + Math.cos(f) * vv[2];
  return { east, north, speed: Math.hypot(east, north), az: mod360(Math.atan2(east, north) / D) };
}
/** Velocity from a full Euler vector (°/Myr, 3-vector). */
export function velVec(p, w) { const m = vnorm(w); return m < 1e-14 ? { east: 0, north: 0, speed: 0, az: 0 } : velAt(p, LL(w), m); }
/** Signed difference of two azimuths modulo 180° (a transform trace has no arrow), in (−90, 90]. */
export const azDiff180 = (a, b) => { let d = (((a - b) % 180) + 180) % 180; if (d > 90) d -= 180; return d; };
/** Signed difference of two azimuths in (−180, 180]. */
export const azDiff = (a, b) => wrap180(a - b);
/** Small circle (list of points) of angular radius r about c. */
export function smallCirc(c, r, n = 90) { const o = []; for (let i = 0; i <= n; i++) o.push(dest(c, 360 * i / n, r)); return o; }
/** Mean of a list of angles (degrees) as a point on the circle. */
export const meanAngle = (a) => mod360(Math.atan2(a.reduce((s, x) => s + Math.sin(x * D), 0), a.reduce((s, x) => s + Math.cos(x * D), 0)) / D);

// ── Euler-pole fit to transform-fault azimuths ─────────────────────────────
/** RMS misfit (deg) between observed transform azimuths and the small-circle azimuths about `pole`. */
export function poleMisfit(pole, sites, azs, sense) {
  let s = 0;
  for (let i = 0; i < sites.length; i++) {
    const d = angDist(sites[i], pole); if (d < 1e-3 || d > 179.999) { s += 45 * 45; continue; }
    // direction of motion about the pole (tangent to the small circle through the site); sense −1: counter-clockwise, +1: clockwise
    const az = velAt(sites[i], pole, sense ? -sense : 1).az;
    const e = sense ? azDiff(az, azs[i]) : azDiff180(az, azs[i]); s += e * e;
  }
  return Math.sqrt(s / sites.length);
}
/** Best-fitting pole by a coarse grid search followed by shrinking-step coordinate descent. */
export function fitPole(sites, azs, start = [0, 60], sense) {
  let best = null, bf = 1e9;
  for (let lat = -88; lat <= 88; lat += 8) for (let lon = -180; lon < 180; lon += 8) { const f = poleMisfit([lon, lat], sites, azs, sense); if (f < bf) { bf = f; best = [lon, lat]; } }
  let step = 4;
  while (step > 0.01) {
    let moved = false;
    for (const [dl, df] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const c = [wrap180(best[0] + dl * step), clamp(best[1] + df * step, -89.9, 89.9)], f = poleMisfit(c, sites, azs, sense);
      if (f < bf - 1e-12) { bf = f; best = c; moved = true; }
    }
    if (!moved) step /= 2;
  }
  return { pole: best, rms: bf };
}

// ── geomagnetic polarity time scale (normal-polarity intervals, Ma) ────────
// Rounded from the Cande & Kent (1995) / GPTS 2012–2020 values for the last 5.9 Myr (agreement better than 0.06 Myr);
// intervals not listed are reversed. Subchron names: Jaramillo 0.99–1.07, Olduvai 1.77–1.95, Kaena/Mammoth reversed gaps in the Gauss.
export const NORMALS = [
  [0, 0.78], [0.99, 1.07], [1.77, 1.95], [2.58, 3.04], [3.11, 3.22], [3.33, 3.58],
  [4.18, 4.29], [4.48, 4.62], [4.80, 4.89], [4.98, 5.23], [5.89, 6.14],
];
export const CHRONS = [
  { name: 'Brunhes', t0: 0, t1: 0.78, pol: 1 }, { name: 'Matuyama', t0: 0.78, t1: 2.58, pol: -1 }, { name: 'Gauss', t0: 2.58, t1: 3.58, pol: 1 }, { name: 'Gilbert', t0: 3.58, t1: 6.03, pol: -1 },
];
export function polarityAt(t) { for (const [a, b] of NORMALS) if (t >= a && t < b) return 1; return -1; }
/** Polarity boundaries (Ma) up to tmax. */
export function reversalsUpTo(tmax) { const o = []; for (const [a, b] of NORMALS) { if (a > 0 && a < tmax) o.push(a); if (b < tmax) o.push(b); } return [...new Set(o)].sort((x, y) => x - y); }

// ── 2-D magnetic anomaly of polarised blocks ───────────────────────────────
/** ∫ (p − q)/|p − q|² dl over the segment a→c (x horizontal, z down), p the observation point: [Bx, Bz] up to the factor σ/2π. */
export function segField(px, pz, ax, az, cx, cz) {
  const L = Math.hypot(cx - ax, cz - az); if (L < 1e-12) return [0, 0];
  const ux = (cx - ax) / L, uz = (cz - az) / L, nx = -uz, nz = ux, wx = px - ax, wz = pz - az;
  const a = wx * ux + wz * uz; let b = wx * nx + wz * nz; if (Math.abs(b) < 1e-9) b = 1e-9;
  const par = -0.5 * Math.log(((L - a) ** 2 + b * b) / (a * a + b * b + 1e-18)), perp = Math.atan((L - a) / b) - Math.atan(-a / b);
  return [ux * par + nx * perp, uz * par + nz * perp];
}
/**
 * Field (Bx, Bz) of a uniformly magnetised 2-D prism x∈[x0,x1], z∈[z0,z1] (z down, km) with in-plane magnetisation (mx, mz)
 * (nT-equivalent: μ0·M), at the point (px, pz). Surface "charges" σ = M·n on the four faces; B = (1/2π) Σ σ ∫ r̂/r dl.
 */
export function prismField(px, pz, x0, x1, z0, z1, mx, mz) {
  let bx = 0, bz = 0;
  const add = (s, ax, az, cx, cz) => { if (!s) return; const [fx, fz] = segField(px, pz, ax, az, cx, cz); bx += s * fx; bz += s * fz; };
  add(-mx, x0, z0, x0, z1); add(mx, x1, z0, x1, z1); add(-mz, x0, z0, x1, z0); add(mz, x0, z1, x1, z1);
  return [bx / (2 * Math.PI), bz / (2 * Math.PI)];
}
/**
 * Total-field anomaly profile of a list of blocks [{x0, x1, s}] (s = effective susceptibility signed by polarity) forming a layer
 * from depth zTop to zTop+thick (km). Field: total intensity F (nT), inclination I (deg), angle `dAng` (deg) between the field's
 * horizontal azimuth and the profile direction. Returns the anomaly (nT) at each x.
 */
export function anomalyProfile(xs, blocks, { zTop = 3, thick = 1, F = 50000, incl = 60, dAng = 0 }) {
  const fx = Math.cos(incl * D) * Math.cos(dAng * D), fz = Math.sin(incl * D);
  return xs.map((x) => {
    let bx = 0, bz = 0;
    for (const b of blocks) { const m = b.s * F; const [qx, qz] = prismField(x, 0, b.x0, b.x1, zTop, zTop + thick, m * fx, m * fz); bx += qx; bz += qz; }
    return bx * fx + bz * fz;
  });
}

// ── hypsometry (schematic mixture, Earth's area fractions) ─────────────────
/** Gaussian density. */
export const gauss = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));

/** Schematic hypsometric mixture (area fractions of the whole Earth, heights in km above sea level): continents, shelf and slope, rises, abyssal plains, trenches. */
export const HYPS = {
  land: { w: 0.292, k: 1.15, theta: 0.73 }, // gamma(k, θ): mean 0.84 km
  ocean: [
    { name: 'shelf and slope', w: 0.130, m: -1.0, s: 0.9 },
    { name: 'ridges and rises', w: 0.180, m: -2.9, s: 0.6 },
    { name: 'abyssal plains', w: 0.380, m: -4.7, s: 0.7 },
    { name: 'trenches', w: 0.018, m: -7.6, s: 1.2 },
  ],
};
const lgam = (z) => { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = z, x = z, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let ser = 1.000000000190015; for (const cj of c) ser += cj / ++y; return -t + Math.log((2.5066282746310005 * ser) / x); };
/** Density (per km of elevation, summing to 1 over the whole Earth's area) of the schematic hypsometric mixture at height h (km). */
export function hypsDensity(h) {
  const L = HYPS.land; let d = 0;
  if (h > 0) d += L.w * Math.exp((L.k - 1) * Math.log(h / L.theta) - h / L.theta - lgam(L.k)) / L.theta;
  else for (const o of HYPS.ocean) d += (o.w * gauss(h, o.m, o.s)) / normCdf(-o.m / o.s);
  return d;
}
const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
const normCdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
