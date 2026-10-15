// Geography & Cartography — Chapter 1: helpers shared by ch01.js and ch01-b.js.

export const D2R = Math.PI / 180, R2D = 180 / Math.PI;
/** IUGG mean Earth radius (km) — the sphere used by haversine. */
export const R_MEAN = 6371.0088;

/** An ellipsoid of revolution from a and 1/f: {a, f, b, e2, ep2} (metres). */
export function ellipsoid(a, invf) {
  const f = 1 / invf, b = a * (1 - f), e2 = f * (2 - f);
  return { a, invf, f, b, e2, ep2: e2 / (1 - e2) };
}
/** WGS84 defining constants (NIMA TR8350.2): a = 6 378 137 m, 1/f = 298.257223563. */
export const WGS84 = ellipsoid(6378137, 298.257223563);

// ---------- vectors on the unit sphere ([lon, lat] in degrees; x towards (0°, 0°), z towards the north pole)
export const vec = (p) => { const l = p[0] * D2R, f = p[1] * D2R, c = Math.cos(f); return [c * Math.cos(l), c * Math.sin(l), Math.sin(f)]; };
export const lonlat = (v) => [Math.atan2(v[1], v[0]) * R2D, Math.atan2(v[2], Math.hypot(v[0], v[1])) * R2D];
export const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm3 = (a) => Math.hypot(a[0], a[1], a[2]);
export const unit3 = (a) => { const n = norm3(a) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
export const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
/** Central angle (radians) between unit vectors, atan2 form (accurate at every separation). */
export const angle3 = (u, w) => Math.atan2(norm3(cross3(u, w)), dot3(u, w));
/** Unit tangent at u pointing along the great circle towards w. */
export const tangentTo = (u, w) => unit3(sub3(w, scale3(u, dot3(u, w))));
/** Local east and north unit vectors at [lon, lat]. */
export function enu(p) {
  const l = p[0] * D2R, f = p[1] * D2R;
  return { e: [-Math.sin(l), Math.cos(l), 0], n: [-Math.sin(f) * Math.cos(l), -Math.sin(f) * Math.sin(l), Math.cos(f)], u: vec(p) };
}

// ---------- formatting
/** 12,345 with a thousands comma (plain text). */
export const comma = (x, d = 0) => (x < 0 ? '−' : '') + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
/** 40°42′46″ N (plain text). */
export function dms(deg, pos = 'N', neg = 'S') {
  const s = deg < 0 ? neg : pos; let t = Math.round(Math.abs(deg) * 3600);
  const d = Math.floor(t / 3600); t -= d * 3600; const m = Math.floor(t / 60), sec = t - m * 60;
  return `${d}°${String(m).padStart(2, '0')}′${String(sec).padStart(2, '0')}″ ${s}`;
}
/** Points of a circular arc (data coordinates) from angle a0 to a1 (radians). */
export function arcPts(cx, cy, r, a0, a1, n = 40) {
  const out = []; for (let i = 0; i <= n; i++) { const t = a0 + ((a1 - a0) * i) / n; out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
  return out;
}

// ---------- ellipsoid geometry
/** Geodetic (lat, lon in degrees, h in metres) → Earth-centred Cartesian [X, Y, Z] in metres. */
export function geodToEcef(lat, lon, h = 0, E = WGS84) {
  const p = lat * D2R, l = lon * D2R, s = Math.sin(p), N = E.a / Math.sqrt(1 - E.e2 * s * s);
  return [(N + h) * Math.cos(p) * Math.cos(l), (N + h) * Math.cos(p) * Math.sin(l), (N * (1 - E.e2) + h) * s];
}
/** Earth-centred [X, Y, Z] (m) → [lat°, lon°, h m] on ellipsoid E (fixed-point iteration, converges to < 1e-12 rad). */
export function ecefToGeod(X, Y, Z, E = WGS84) {
  const p = Math.hypot(X, Y); let lat = Math.atan2(Z, p * (1 - E.e2)), h = 0;
  for (let i = 0; i < 12; i++) { const s = Math.sin(lat), N = E.a / Math.sqrt(1 - E.e2 * s * s); h = p / Math.cos(lat) - N; lat = Math.atan2(Z, p * (1 - (E.e2 * N) / (N + h))); }
  return [lat * R2D, Math.atan2(Y, X) * R2D, h];
}
/** Meridional and prime-vertical radii of curvature (m) at geodetic latitude φ (degrees). */
export function radii(lat, E = WGS84) {
  const s = Math.sin(lat * D2R), w = 1 - E.e2 * s * s;
  return { M: (E.a * (1 - E.e2)) / Math.pow(w, 1.5), N: E.a / Math.sqrt(w) };
}

/**
 * Vincenty's inverse formula on an ellipsoid: geodesic distance between p1 and p2 ([lon, lat] in degrees).
 * Returns {s (m), az1, az2 (deg), iter, ok}; ok = false when the iteration fails to converge (nearly antipodal points).
 */
export function vincenty(p1, p2, E = WGS84) {
  const { a, b, f } = E;
  const L = (p2[0] - p1[0]) * D2R, U1 = Math.atan((1 - f) * Math.tan(p1[1] * D2R)), U2 = Math.atan((1 - f) * Math.tan(p2[1] * D2R));
  const sU1 = Math.sin(U1), cU1 = Math.cos(U1), sU2 = Math.sin(U2), cU2 = Math.cos(U2);
  let lam = L, it = 0, sinS = 0, cosS = 1, sig = 0, cos2a = 1, c2sm = 0, sinA = 0, prev;
  do {
    const sl = Math.sin(lam), cl = Math.cos(lam);
    sinS = Math.hypot(cU2 * sl, cU1 * sU2 - sU1 * cU2 * cl);
    if (sinS === 0) return { s: 0, az1: 0, az2: 0, iter: it, ok: true };
    cosS = sU1 * sU2 + cU1 * cU2 * cl; sig = Math.atan2(sinS, cosS);
    sinA = (cU1 * cU2 * sl) / sinS; cos2a = 1 - sinA * sinA;
    c2sm = cos2a !== 0 ? cosS - (2 * sU1 * sU2) / cos2a : 0;
    const C = (f / 16) * cos2a * (4 + f * (4 - 3 * cos2a));
    prev = lam; lam = L + (1 - C) * f * sinA * (sig + C * sinS * (c2sm + C * cosS * (-1 + 2 * c2sm * c2sm)));
  } while (Math.abs(lam - prev) > 1e-12 && ++it < 200);
  const u2 = (cos2a * (a * a - b * b)) / (b * b);
  const A = 1 + (u2 / 16384) * (4096 + u2 * (-768 + u2 * (320 - 175 * u2))), B = (u2 / 1024) * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
  const dS = B * sinS * (c2sm + (B / 4) * (cosS * (-1 + 2 * c2sm * c2sm) - (B / 6) * c2sm * (-3 + 4 * sinS * sinS) * (-3 + 4 * c2sm * c2sm)));
  const sl = Math.sin(lam), cl = Math.cos(lam);
  const az1 = Math.atan2(cU2 * sl, cU1 * sU2 - sU1 * cU2 * cl) * R2D, az2 = Math.atan2(cU1 * sl, -sU1 * cU2 + cU1 * sU2 * cl) * R2D;
  return { s: b * A * (sig - dS), az1: (az1 + 360) % 360, az2: (az2 + 360) % 360, iter: it, ok: it < 200 };
}
