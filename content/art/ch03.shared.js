// Visual Art & Color — Chapter 3 (light, spectra and colour mixing): helpers shared by ch03.js and ch03-b.js.
//
// Colour science here is computed, not looked up: the CIE 1931 colour-matching functions are the analytic
// multi-lobe Gaussian fit of Wyman, Sloan & Shirley (2013), sRGB uses the standard D65 matrix and transfer curve,
// and every "rendered colour" is  spectrum -> XYZ -> linear sRGB -> (gamut mapping by desaturation) -> gamma.
export * from './ch02.shared.js';

// ---------------------------------------------------------------- colour-matching functions
const g = (l, mu, t1, t2) => { const t = (l - mu) * (l < mu ? t1 : t2); return Math.exp(-0.5 * t * t); };
/** CIE 1931 2-degree colour-matching functions [x̄, ȳ, z̄] at wavelength l (nm), Wyman–Sloan–Shirley 2013 fit. */
export function cmf(l) {
  return [
    1.056 * g(l, 599.8, 0.0264, 0.0323) + 0.362 * g(l, 442.0, 0.0624, 0.0374) - 0.065 * g(l, 501.1, 0.0490, 0.0382),
    0.821 * g(l, 568.8, 0.0213, 0.0247) + 0.286 * g(l, 530.9, 0.0613, 0.0322),
    1.217 * g(l, 437.0, 0.0845, 0.0278) + 0.681 * g(l, 459.0, 0.0385, 0.0725),
  ];
}
export const L0 = 380, L1 = 780;
const CT = []; for (let l = L0; l <= L1; l += 1) CT.push(cmf(l));
/** Tabulated cmf at integer wavelengths (fast). */
export const cmfT = (l) => CT[Math.max(0, Math.min(CT.length - 1, Math.round(l) - L0))];

/** XYZ of a spectral power distribution f(lambda_nm) (a plain integral, step nm). Not normalised. */
export function spdXYZ(f, step = 5, l0 = L0, l1 = L1) {
  let X = 0, Y = 0, Z = 0;
  for (let l = l0; l <= l1 + 1e-9; l += step) { const w = f(l), c = cmfT(l); X += w * c[0]; Y += w * c[1]; Z += w * c[2]; }
  return [X * step, Y * step, Z * step];
}
export const xyOf = (c) => { const s = c[0] + c[1] + c[2] || 1; return [c[0] / s, c[1] / s]; };
export const xyz = (x, y, Y = 1) => [(x / y) * Y, Y, ((1 - x - y) / y) * Y];

// ---------------------------------------------------------------- XYZ -> sRGB
const enc = (u) => (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);
export const lin2srgb = ([r, g2, b]) => [r, g2, b].map((u) => Math.round(255 * Math.max(0, Math.min(1, enc(Math.max(0, u))))));
export const xyz2lin = ([X, Y, Z]) => [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.2040 * Y + 1.0570 * Z];
/** Display colour for an XYZ triple: scaled so that Y = Yt, then moved toward the grey of equal Y until it is inside the sRGB gamut
 *  (and scaled down if a channel exceeds 1). Returns [r, g, b] in 0..255 plus `.clip` = how much desaturation was needed (0..1). */
export function rgbOf(c, Yt = null) {
  let [X, Y, Z] = c; if (Yt != null && Y > 1e-12) { const k = Yt / Y; X *= k; Y *= k; Z *= k; }
  let l = xyz2lin([X, Y, Z]), t = 0;
  for (const u of l) if (u < 0) t = Math.max(t, -u / (Y - u));
  if (t > 0) l = l.map((u) => (1 - t) * u + t * Y);
  const m = Math.max(...l); if (m > 1) l = l.map((u) => u / m);
  const out = lin2srgb(l); out.clip = t; return out;
}
/** Colour of a monochromatic stimulus (nm), at constant luminance Y. */
export const specRGB = (l, Y = 0.42) => rgbOf(cmf(l), Y);

// ---------------------------------------------------------------- spectra
const C2 = 1.438776877e7; // second radiation constant in nm·K
/** Planck spectral radiance up to a constant (relative), wavelength in nm. */
export const planck = (l, T) => 1 / (Math.pow(l, 5) * (Math.exp(C2 / (l * T)) - 1));
/** XYZ of a black body (normalised so that Y = 1). */
export function bbXYZ(T) { const c = spdXYZ((l) => planck(l, T), 5); return c.map((u) => u / c[1]); }
/** Gaussian bump, area-free. */
export const gauss = (l, mu, fwhm) => Math.exp(-4 * Math.LN2 * ((l - mu) / fwhm) ** 2);
export const sigm = (x) => 1 / (1 + Math.exp(-x));

/** Spectral locus (xy of monochromatic lights, 380..700 nm every nm). */
export const LOCUS = (() => { const P = []; for (let l = 420; l <= 700; l += 1) { const c = cmfT(l), s = c[0] + c[1] + c[2]; P.push([l, c[0] / s, c[1] / s]); } return P; })();
const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < ((P[j][0] - P[i][0]) * (y - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
const LOC_POLY = LOCUS.filter((_, i) => i % 2 === 0).map((p) => [p[1], p[2]]);
export const inLocus = (x, y) => inPoly(x, y, LOC_POLY);
/** Dominant (or, for purples, complementary) wavelength of the chromaticity (x, y) relative to the equal-energy white. */
export function dominant(x, y) {
  const wx = 1 / 3, wy = 1 / 3, dx = x - wx, dy = y - wy; if (Math.hypot(dx, dy) < 1e-6) return { l: null, purple: false, purity: 0 };
  const hit = (sgn) => {
    let best = null;
    for (let i = 0; i + 1 < LOCUS.length; i++) {
      const a = LOCUS[i], b = LOCUS[i + 1], ex = b[1] - a[1], ey = b[2] - a[2], den = sgn * dx * ey - sgn * dy * ex;
      if (Math.abs(den) < 1e-14) continue;
      const t = ((a[1] - wx) * ey - (a[2] - wy) * ex) / den, u = ((a[1] - wx) * sgn * dy - (a[2] - wy) * sgn * dx) / den;
      if (t > 0 && u >= 0 && u <= 1) { best = { l: a[0] + u * (b[0] - a[0]), t, ex: a[1] + u * ex, ey: a[2] + u * ey }; break; }
    }
    return best;
  };
  let h = hit(1), purple = false;
  if (!h) { h = hit(-1); purple = true; }
  if (!h) return { l: null, purple: false, purity: 0 };
  const dist = Math.hypot(h.ex - wx, h.ey - wy);
  return { l: h.l, purple, purity: dist > 0 ? Math.hypot(dx, dy) / dist : 0 };
}
/** A chromaticity-diagram backdrop (colours inside the spectral locus, faded), the locus, and a few wavelength ticks. */
export function drawChromaticity(s, v, { fade = 0.62, ticks = [440, 480, 500, 520, 540, 560, 580, 600, 650] } = {}) {
  s.raster((x, y) => {
    if (y < 0.02 || !inLocus(x, y)) return null;
    const c = rgbOf(xyz(x, y, 1), 0.78), a = fade; return [c[0] * a + 255 * (1 - a) * 0.0 + 0, c[1] * a, c[2] * a, 1];
  }, { res: 3, key: 'chroma' + fade });
  s.path(LOCUS.map((p) => [p[1], p[2]]), { color: 'ink', width: 1.4, close: true, alpha: 0.7 });
  for (const l of ticks) {
    const p = LOCUS[l - 420], q = LOCUS[l - 420 + 3], nx = -(q[2] - p[2]), ny = q[1] - p[1], nn = Math.hypot(nx, ny) || 1;
    s.line(p[1], p[2], p[1] + (nx / nn) * 0.012, p[2] + (ny / nn) * 0.012, { color: 'ink', width: 1.2, alpha: 0.7 });
    s.text(`${l}`, p[1] + (nx / nn) * 0.045, p[2] + (ny / nn) * 0.045, { size: 9.5, color: 'muted', align: 'center', baseline: 'middle' });
  }
}
/** sRGB primaries' chromaticities. */
export const SRGB = [[0.64, 0.33], [0.30, 0.60], [0.15, 0.06]];

/** Colour bars under a curve: one thin vertical bar per `step` nm, coloured by the wavelength. */
export function specBars(s, f, l0, l1, step = 2, { alpha = 0.9, Y = 0.5, floor = 0 } = {}) {
  const w = Math.max(1.6, Math.abs(s.X(l0 + step) - s.X(l0)) + 0.7);
  for (let l = l0; l <= l1 + 1e-9; l += step) {
    const h = f(l); if (!(h > floor)) continue;
    const c = specRGB(l, Y);
    s.line(l, floor, l, h, { color: c, width: w, alpha });
  }
}

// ---------------------------------------------------------------- glass, water, air
/** N-BK7 (Schott) refractive index, Sellmeier form with the manufacturer's coefficients (lambda in nm). */
export function nBK7(l) {
  const x = (l / 1000) ** 2;
  return Math.sqrt(1 + 1.03961212 * x / (x - 0.00600069867) + 0.231792344 * x / (x - 0.0200179144) + 1.01046945 * x / (x - 103.560653));
}
/** Pure water at 20 C, Daimon & Masumura (2007) Sellmeier fit, valid 182..1129 nm (lambda in nm). */
export function nWater(l) {
  const x = (l / 1000) ** 2;
  return Math.sqrt(1 + 0.5684027565 * x / (x - 0.005101829712) + 0.1726177391 * x / (x - 0.01821153936) + 0.02086189578 * x / (x - 0.02620722293) + 0.1130748688 * x / (x - 10.69792721));
}
/** Rayleigh optical depth of the whole sea-level standard atmosphere at the zenith (Bodhaine et al. 1999 formulas; lambda in nm). */
export function rayleighTau(lnm, P = 101325, T = 288.15, co2 = 360) {
  const lu = lnm / 1000, l2 = 1 / (lu * lu);
  const nPeck = 1 + 1e-8 * (8060.51 + 2480990 / (132.274 - l2) + 17455.7 / (39.32957 - l2));
  const ns = 1 + (1 + 0.54 * (co2 * 1e-6 - 300e-6)) * (nPeck - 1);
  const c = co2 * 1e-4;
  const Fn2 = 1.034 + 3.17e-4 * l2, Fo2 = 1.096 + 1.385e-3 * l2 + 1.448e-4 * l2 * l2;
  const F = (78.084 * Fn2 + 20.946 * Fo2 + 0.934 + 1.15 * c) / (78.084 + 20.946 + 0.934 + c);
  const NA = 6.02214076e23, Ns = (NA / 22.4141) * (273.15 / T) * 1e-3, lcm = lnm * 1e-7;
  const sigma = (24 * Math.PI ** 3 * (ns * ns - 1) ** 2 * F) / (lcm ** 4 * (ns * ns + 2) ** 2 * Ns * Ns);
  const ma = 15.0556 * co2 * 1e-6 + 28.9595;
  return (sigma * P * 10 * NA) / (ma * 980.616);
}
/** Relative air mass (Kasten & Young 1989) for the apparent zenith angle in degrees (about 38 at the horizon). */
export const airmassKY = (z) => 1 / (Math.cos((z * Math.PI) / 180) + 0.50572 * Math.pow(96.07995 - z, -1.6364));

// ---------------------------------------------------------------- thin films and multilayers
const cm = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cd = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
/** Reflectance of a lossless stack at wavelength l (nm), angle th0 (degrees) from medium n0 onto substrate ns;
 *  layers = [[n, d_nm], ...] from the incident side; unpolarised (average of s and p). Characteristic-matrix method. */
export function stackR(layers, n0, ns, l, th0) {
  const s0 = Math.sin((th0 * Math.PI) / 180) * n0;
  const cosT = (n) => { const q = 1 - (s0 / n) ** 2; return q > 0 ? Math.sqrt(q) : 0; };
  let R = 0;
  for (const pol of [0, 1]) {
    const eta = (n) => (pol === 0 ? n * cosT(n) : n / Math.max(cosT(n), 1e-9));
    let M = [[[1, 0], [0, 0]], [[0, 0], [1, 0]]];
    for (const [n, d] of layers) {
      const del = (2 * Math.PI * n * d * cosT(n)) / l, c = Math.cos(del), sn = Math.sin(del), e = eta(n);
      const L = [[[c, 0], [0, sn / e]], [[0, sn * e], [c, 0]]];
      M = [[0, 1].map((j) => [0, 1].reduce((a, k) => { const t = cm(M[0][k], L[k][j]); return [a[0] + t[0], a[1] + t[1]]; }, [0, 0])), [0, 1].map((j) => [0, 1].reduce((a, k) => { const t = cm(M[1][k], L[k][j]); return [a[0] + t[0], a[1] + t[1]]; }, [0, 0]))];
    }
    const es = eta(ns), e0 = eta(n0);
    const B = [M[0][0][0] + M[0][1][0] * es, M[0][0][1] + M[0][1][1] * es], C = [M[1][0][0] + M[1][1][0] * es, M[1][0][1] + M[1][1][1] * es];
    const num = [e0 * B[0] - C[0], e0 * B[1] - C[1]], den = [e0 * B[0] + C[0], e0 * B[1] + C[1]];
    const r = cd(num, den); R += 0.5 * (r[0] * r[0] + r[1] * r[1]);
  }
  return R;
}

// ---------------------------------------------------------------- Newton's colour circle
/** Newton's seven arcs: names and the proportions printed in Opticks, Book I, Part II, Prop. VI (1/9, 1/16, 1/10, 1/9, 1/16, 1/16, 1/9). */
export const NEWTON = (() => {
  const names = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
  const raw = [1 / 9, 1 / 16, 1 / 10, 1 / 9, 1 / 16, 1 / 16, 1 / 9], tot = raw.reduce((a, b) => a + b, 0);
  const letters = ['D', 'E', 'F', 'G', 'A', 'B', 'C'];
  // Illustrative wavelengths (not Newton's): the middle of the usual textbook band for each name, and the band edges for the colour wheel
  const rep = [660, 607, 577, 532, 482, 452, 420];
  const edge = [700, 625, 590, 565, 500, 465, 440, 400];
  const arcs = []; let a = 0;
  for (let i = 0; i < 7; i++) { const w = (2 * Math.PI * raw[i]) / tot; arcs.push({ name: names[i], a0: a, a1: a + w, w, frac: raw[i] / tot, rep: rep[i], l0: edge[i], l1: edge[i + 1], letter: letters[i] }); a += w; }
  return { arcs, letters, tot };
})();
/** Position on the circle (unit radius): angle t measured clockwise from the top (point D), as [x, y]. */
export const circPt = (t, r = 1) => [r * Math.sin(t), r * Math.cos(t)];
/** Centre of gravity of arc i (Newton's p, q, r, ...). */
export function arcCentroid(i) { const A = NEWTON.arcs[i], m = (A.a0 + A.a1) / 2, k = Math.sin(A.w / 2) / (A.w / 2); return circPt(m, k); }
/** Newton's recipe: weights -> centre of gravity Z of the weighted centroids, hue angle, fullness |OZ|/R. */
export function newtonMix(wts) {
  let sw = 0, zx = 0, zy = 0;
  for (let i = 0; i < 7; i++) { const c = arcCentroid(i); sw += wts[i]; zx += wts[i] * c[0]; zy += wts[i] * c[1]; }
  if (sw <= 0) return { Z: [0, 0], ang: 0, full: 0, sw: 0 };
  zx /= sw; zy /= sw;
  const ang = (Math.atan2(zx, zy) + 2 * Math.PI) % (2 * Math.PI);
  return { Z: [zx, zy], ang, full: Math.hypot(zx, zy), sw };
}
/** Which arc contains the angle, and how far through it (0..1). */
export function arcAt(ang) { for (let i = 0; i < 7; i++) { const A = NEWTON.arcs[i]; if (ang >= A.a0 && ang < A.a1) return { i, u: (ang - A.a0) / A.w }; } return { i: 6, u: 1 }; }
/** Modern colour of mixing monochromatic lights of equal "number of rays" weights at the illustrative wavelengths (energy-additive). */
export function mixXYZ(wts) { const c = [0, 0, 0]; for (let i = 0; i < 7; i++) { const m = cmf(NEWTON.arcs[i].rep); c[0] += wts[i] * m[0]; c[1] += wts[i] * m[1]; c[2] += wts[i] * m[2]; } return c; }

// ---------------------------------------------------------------- viewing through a prism (Goethe, chapter 3.11 and 3.13)
/** Prism displacement of the image at wavelength l, normalised so that violet (400 nm) and red (700 nm) differ by 1 (BK7-like dispersion). */
export const prismShift = (l) => (nBK7(l) - nBK7(550)) / (nBK7(400) - nBK7(700));
/** XYZ of the image of a 1-D luminance profile P(x) (0 = black, 1 = white card, illuminated by the equal-energy spectrum) seen through a prism
 *  whose displacement is  sign * delta * prismShift(l)  (the image at wavelength l is the profile moved by that amount). */
export function prismXYZ(P, x, delta, sign = 1, step = 5) {
  let X = 0, Y = 0, Z = 0;
  for (let l = 400; l <= 700; l += step) { const c = cmfT(l), p = P(x - sign * delta * prismShift(l)); X += p * c[0]; Y += p * c[1]; Z += p * c[2]; }
  const k = 1 / (cmfNorm(step)); return [X * k, Y * k, Z * k];
}
let _cn = {};
function cmfNorm(step) { if (!_cn[step]) { let y = 0; for (let l = 400; l <= 700; l += step) y += cmfT(l)[1]; _cn[step] = y; } return _cn[step]; }
