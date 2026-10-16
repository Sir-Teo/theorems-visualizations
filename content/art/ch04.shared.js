// Visual Art & Color — Chapter 4 (trichromacy and colorimetry): helpers shared by ch04.js and its part files.
// Everything is computed from the analytic CIE 1931 fit of chapter 3 (cmf), so the numbers are those of a model of the standard observer.
export * from './ch03.shared.js';
import { cmf, cmfT, spdXYZ, xyOf, planck, bbXYZ, gauss, specRGB, rgbOf } from './ch03.shared.js';

// ---------------------------------------------------------------- 3x3 helpers
export const mv3 = (M, c) => [M[0][0] * c[0] + M[0][1] * c[1] + M[0][2] * c[2], M[1][0] * c[0] + M[1][1] * c[1] + M[1][2] * c[2], M[2][0] * c[0] + M[2][1] * c[1] + M[2][2] * c[2]];
export function inv3(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  return [[A / det, -(b * i - c * h) / det, (b * f - c * e) / det], [B / det, (a * i - c * g) / det, -(a * f - c * d) / det], [C / det, -(a * h - b * g) / det, (a * e - b * d) / det]];
}
export const mm3 = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
export const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Sum of the colour-matching functions over 380..780 nm (1 nm): the XYZ of the equal-energy stimulus (not exactly equal because the fit is analytic). */
export const EW = (() => { let X = 0, Y = 0, Z = 0; for (let l = 380; l <= 780; l++) { const c = cmfT(l); X += c[0]; Y += c[1]; Z += c[2]; } return [X, Y, Z]; })();

// ---------------------------------------------------------------- cone space (Hunt-Pointer-Estevez, D65-normalised matrix), rescaled so that the equal-energy white is (1,1,1)
export const HPE = [[0.4002, 0.7076, -0.0808], [-0.2263, 1.1653, 0.0457], [0, 0, 0.9182]];
export const HPEI = inv3(HPE);
const EWL = mv3(HPE, EW);
/** XYZ -> LMS, with equal-energy white at (1,1,1). */
export const toLMS = (c) => { const q = mv3(HPE, c); return [q[0] / EWL[0], q[1] / EWL[1], q[2] / EWL[2]]; };
export const fromLMS = (q) => mv3(HPEI, [q[0] * EWL[0], q[1] * EWL[1], q[2] * EWL[2]]);
/** Cone fundamentals of the model, peak-normalised, at wavelength l. */
const LMS_PEAK = (() => { const p = [0, 0, 0]; for (let l = 380; l <= 780; l++) { const q = toLMS(cmfT(l)); for (let k = 0; k < 3; k++) p[k] = Math.max(p[k], q[k]); } return p; })();
export const coneFund = (l) => { const q = toLMS(cmf(l)); return [q[0] / LMS_PEAK[0], q[1] / LMS_PEAK[1], q[2] / LMS_PEAK[2]]; };
export const conePeaks = (() => { const pk = [0, 0, 0], at = [0, 0, 0]; for (let l = 380; l <= 780; l++) { const q = coneFund(l); for (let k = 0; k < 3; k++) if (q[k] > pk[k]) { pk[k] = q[k]; at[k] = l; } } return at; })();
/** Cone excitations (unnormalised, energy-weighted) of a spectrum f(l) in nm. */
export function coneResp(f, step = 2) { let a = [0, 0, 0]; for (let l = 380; l <= 780; l += step) { const w = f(l), q = coneFund(l); a[0] += w * q[0]; a[1] += w * q[1]; a[2] += w * q[2]; } return a.map((u) => u * step); }

/** Von Kries adaptation in HPE space: XYZ c under a light of white w, mapped to the same appearance under D65 white. */
export const D65W = [0.9505, 1, 1.089];
export function adaptXYZ(c, w) { const a = mv3(HPE, w), b = mv3(HPE, D65W), q = mv3(HPE, c); return mv3(HPEI, q.map((u, i) => (u * b[i]) / a[i])); }

// ---------------------------------------------------------------- real primaries and the matching functions they give
/** A set of three monochromatic primaries (nm). Unit amounts are scaled so that the equal-energy stimulus needs equal amounts of the three
 *  (the convention of the CIE RGB system). `cmf(l)` = amounts of the primaries that match the unit line at l (negative = added to the test). */
export function primSet(w) {
  const cols = w.map((l) => cmf(l));
  const A = [0, 1, 2].map((r) => [cols[0][r], cols[1][r], cols[2][r]]);
  const k = mv3(inv3(A), EW);
  const P = A.map((row) => row.map((a, j) => a * k[j]));
  const Pi = inv3(P);
  return { w, k, P, Pi, prim: (i) => [P[0][i], P[1][i], P[2][i]], amounts: (c) => mv3(Pi, c), cmf: (l) => mv3(Pi, cmf(l)) };
}
/** The CIE RGB system (primaries 700, 546.1, 435.8 nm), defined here by the PUBLISHED RGB -> XYZ matrix of the 1931 standard (equal-energy white = (1,1,1))
 *  rather than by the fit, whose red tail near 700 nm is too low. Unit amounts are scaled to the fit's own equal-energy white EW. */
export const CIERGB_M = [[0.49, 0.31, 0.2], [0.17697, 0.8124, 0.01063], [0, 0.01, 0.99]];
export const CIERGB = (() => {
  const P = CIERGB_M.map((row, r) => row.map((a) => a * EW[r])), Pi = inv3(P);
  return { w: [700, 546.1, 435.8], P, Pi, prim: (i) => [P[0][i], P[1][i], P[2][i]], amounts: (c) => mv3(Pi, c), cmf: (l) => mv3(Pi, cmf(l)) };
})();

// ---------------------------------------------------------------- chromaticity helpers
export const uv60 = (x, y) => { const d = -2 * x + 12 * y + 3; return [(4 * x) / d, (6 * y) / d]; };
export const xy60 = (u, v) => { const d = 2 * u - 8 * v + 4; return [(3 * u) / d, (2 * v) / d]; };
export const xyOfXYZ = (c) => xyOf(c);
/** Equal-energy white chromaticity of the fit. */
export const EWXY = xyOf(EW);
/** Black-body chromaticity (x, y) at temperature T (K), by integrating Planck's law against the fit of the colour-matching functions. */
export const bbXY = (T) => xyOf(bbXYZ(T));
/** Table of the Planckian locus in CIE 1960 (u, v): uniform steps in mired (1e6/T) from 40 to 1000. */
export const PLANCK_TABLE = (() => { const t = []; for (let m = 40; m <= 1000; m += 4) { const T = 1e6 / m, [x, y] = bbXY(T), [u, vv] = uv60(x, y); t.push({ m, T, x, y, u, v: vv }); } return t; })();
/** Correlated colour temperature by the nearest point of the Planckian locus in (u, v): {T, duv (positive above the locus), i}. */
export function cctNearest(x, y) {
  const [u, vv] = uv60(x, y); let bi = 0, bd = 1e9;
  PLANCK_TABLE.forEach((p, i) => { const d = (p.u - u) ** 2 + (p.v - vv) ** 2; if (d < bd) { bd = d; bi = i; } });
  // refine by parabolic interpolation in mired
  const P = PLANCK_TABLE; let m = P[bi].m;
  if (bi > 0 && bi < P.length - 1) {
    const f = (q) => (q.u - u) ** 2 + (q.v - vv) ** 2, a = f(P[bi - 1]), b = f(P[bi]), c = f(P[bi + 1]), den = a - 2 * b + c;
    if (den > 1e-18) m = P[bi].m + 4 * 0.5 * (a - c) / den;
  }
  return { T: 1e6 / m, duv: (vv > P[bi].v ? 1 : -1) * Math.sqrt(bd), i: bi };
}
/** McCamy's (1992) approximation of the CCT from (x, y). */
export const cctMcCamy = (x, y) => { const n = (x - 0.3320) / (y - 0.1858); return -449 * n ** 3 + 3525 * n ** 2 - 6823.3 * n + 5520.33; };

// ---------------------------------------------------------------- sRGB
export const srgbDec = (c) => { const u = c / 255; return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4); };
export const srgbEnc = (u) => 255 * (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);
/** Linear sRGB -> XYZ (D65) built from the primaries and the white point. */
export function rgbMatrixFrom(prim, white) {
  const col = prim.map(([x, y]) => [x / y, 1, (1 - x - y) / y]);
  const M0 = [0, 1, 2].map((r) => col.map((c) => c[r]));
  const W = [white[0] / white[1], 1, (1 - white[0] - white[1]) / white[1]], s = mv3(inv3(M0), W);
  return M0.map((row) => row.map((a, j) => a * s[j]));
}
export const SRGB_M = rgbMatrixFrom([[0.64, 0.33], [0.30, 0.60], [0.15, 0.06]], [0.3127, 0.3290]);
export const SRGB_MI = inv3(SRGB_M);
/** sRGB code values (0..255) -> XYZ and back (the inverse clips). */
export const codeToXYZ = (c) => mv3(SRGB_M, c.map(srgbDec));
export const xyzToCode = (c) => mv3(SRGB_MI, c).map((u) => Math.max(0, Math.min(255, Math.round(srgbEnc(Math.max(0, Math.min(1, u)))))));
/** Hue (0..360), saturation, value -> sRGB code values (0..255). */
export function hsv2code(h, s, vv) {
  const k = (n) => (n + h / 60) % 6, f = (n) => vv - vv * s * Math.max(0, Math.min(k(n), 4 - k(n), 1));
  return [255 * f(5), 255 * f(3), 255 * f(1)];
}

// ---------------------------------------------------------------- luminous efficiency
/** Photopic V(l): the y-bar of the fit (the 1931 y-bar is the 1924 V(l) by construction). */
export const Vphot = (l) => cmf(l)[1];
/** Scotopic V'(l): a two-sided Gaussian MODEL anchored at the 507 nm peak (widths fitted to a handful of remembered table values), NOT the CIE 1951 table. */
export const Vscot = (l) => { const w = l < 507 ? 45.4 : 35.6; return Math.exp(-0.5 * ((l - 507) / w) ** 2); };

// ---------------------------------------------------------------- metameric spectra
/** A function n(l) on 380..780 with  integral n(l) w(l) cbar_k(l) dl = 0  for the three colour-matching functions (k = X,Y,Z) and max |n| = 1.
 *  w(l) is the weighting spectrum (the illuminant). Built from cosines of different periods projected on the null space of the 3 conditions. */
export function metamerNull(w, nullspace) {
  const B = [60, 85, 120, 170, 250].map((P, j) => (l) => Math.cos((2 * Math.PI * (l - 380)) / P + j));
  const A = [0, 1, 2].map((k) => B.map((b) => spdXYZ((l) => w(l) * b(l), 5)[k]));
  const ns = nullspace(A);
  // choose the null vector that makes the most oscillating function (largest sup-norm per unit coefficient norm)
  let best = null, bn = -1;
  for (const c of ns) { let m = 0; for (let l = 380; l <= 780; l += 5) m = Math.max(m, Math.abs(c.reduce((s, ck, j) => s + ck * B[j](l), 0))); if (m > bn) { bn = m; best = c; } }
  let m = 0; for (let l = 380; l <= 780; l += 2) m = Math.max(m, Math.abs(best.reduce((s, ck, j) => s + ck * B[j](l), 0)));
  return (l) => best.reduce((s, ck, j) => s + ck * B[j](l), 0) / m;
}

