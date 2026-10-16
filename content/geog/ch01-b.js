// Geography & Cartography — Chapter 1 (part b): the ellipsoid, latitudes, geoid and datums, the chronometer, GPS
import { D2R, R2D, R_MEAN, WGS84, ellipsoid, vec, dot3, cross3, norm3, unit3, sub3, scale3, enu, comma, dms, arcPts, radii, geodToEcef, ecefToGeod } from './ch01.shared.js';

const GM_EARTH = 3.986004418e14; // m³/s², WGS84
const tc = (x, d = 0) => comma(x, d).replace(/,/g, '{,}');
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ---------------------------------------------------------------- 1.6: rotational flattening
/** First-order (Clairaut / Radau–Darwin) flattening of a fluid body with spin q = ω²a³/GM and moment C/Ma². */
const fDR = (q, C) => (2.5 * q) / (1 + 6.25 * (1 - 1.5 * C) ** 2);
/** Exact Maclaurin spheroid (homogeneous fluid): eccentricity e → {q, f}. */
function maclaurin(e) {
  const s = Math.sqrt(1 - e * e), g = (2 * s * (3 - 2 * e * e) * Math.asin(e)) / e ** 3 - (6 * (1 - e * e)) / (e * e); // ω²/(πGρ)
  return { q: (0.75 * g) / s, f: 1 - s };
}
const MAC_EMAX = 0.81267; // bifurcation to the Jacobi ellipsoids
function maclaurinF(q) { // invert q(e) by bisection (q increases with e up to the bifurcation)
  if (q <= 0) return 0; let lo = 1e-3, hi = MAC_EMAX;
  if (maclaurin(hi).q < q) return NaN;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (maclaurin(m).q < q) lo = m; else hi = m; }
  return maclaurin((lo + hi) / 2).f;
}
/** NASA planetary fact sheets: equatorial radius (km), GM (km³/s²), sidereal day (h), flattening, I/MR². */
const PLANETS = [
  { name: 'Earth', a: 6378.137, GM: 398600.4418, P: 23.9345, f: 1 / 298.257223563, C: 0.3307 },
  { name: 'Mars', a: 3396.2, GM: 42828, P: 24.6229, f: 0.00589, C: 0.366 },
  { name: 'Jupiter', a: 71492, GM: 126.687e6, P: 9.925, f: 0.06487, C: 0.254 },
  { name: 'Saturn', a: 60268, GM: 37.931e6, P: 10.656, f: 0.09796, C: 0.21 },
].map((p) => ({ ...p, q: (2 * Math.PI / (p.P * 3600)) ** 2 * p.a ** 3 / p.GM }));

// ---------------------------------------------------------------- 1.8: geoid from EGM2008 (degree ≤ 16) and datums
// Fully normalised EGM2008 coefficients ×10⁶ for n = 2…16 (rows split by |): C̄n0, then C̄nm S̄nm for m = 1…n, with the
// even zonals of the WGS84 normal field (C̄20, C̄40, C̄60, C̄80) already subtracted. Source: ICGEM, EGM2008.gfc (Pavlis et al. 2008).
const EGM16 = '0.0016312 -0.00020662 0.0013844 2.4394 -1.4003|0.95716 2.0305 0.2482 0.90479 -0.61901 0.72132 1.4143|-0.25034 -0.53616 -0.47357 0.3505 0.66248 0.99086 -0.20096 -0.18852 0.3088|0.06867 -0.062921 -0.09437 0.65208 -0.32335 -0.45185 -0.21496 -0.29533 0.049807 0.17481 -0.66938|-0.14827 -0.075921 0.026512 0.048649 -0.37379 0.057245 0.008952 -0.086024 -0.47143 -0.26717 -0.53649 0.0094707 -0.23738|0.090512 0.28089 0.095126 0.33041 0.092997 0.25046 -0.21712 -0.27499 -0.12406 0.0016477 0.017928 -0.3588 0.1518 0.0015075 0.024107|0.049472 0.023161 0.058897 0.080014 0.065281 -0.019375 -0.085964 -0.24436 0.069807 -0.025701 0.089203 -0.065965 0.30895 0.067257 0.074869 -0.12402 0.12055|0.028018 0.14215 0.0214 0.021414 -0.031698 -0.16061 -0.074266 -0.0093653 0.019903 -0.016313 -0.054039 0.062788 0.22296 -0.11798 -0.096922 0.18814 -0.0030054 -0.047557 0.09688|0.05333 0.083762 -0.13109 -0.093989 -0.051275 -0.0070071 -0.15414 -0.084472 -0.079026 -0.049289 -0.050614 -0.037585 -0.079769 0.0082621 -0.003049 0.040598 -0.091714 0.12538 -0.037944 0.10044 -0.02386|-0.050768 0.015613 -0.027124 0.020114 -0.099 -0.030577 -0.14884 -0.03795 -0.063767 0.037419 0.049591 -0.0015643 0.034274 0.0046546 -0.089825 -0.0063017 0.024545 -0.031073 0.042068 -0.052244 -0.018422 0.046234 -0.069671|0.036436 -0.053586 -0.043166 0.014267 0.031094 0.039621 0.025062 -0.067728 0.0038382 0.030878 0.0075907 0.0031342 0.03898 -0.019052 0.035727 -0.025887 0.016936 0.041915 0.024963 -0.0061996 0.03094 0.011364 -0.0063855 -0.0024238 -0.011099|0.041729 -0.051442 0.038691 0.055312 -0.062694 -0.021557 0.097687 -0.0036513 -0.011751 0.05837 0.067224 -0.035045 -0.0062736 0.0030141 -0.0073207 -0.010053 -0.0098579 0.02477 0.045888 0.041108 -0.03684 -0.044521 -0.0048414 -0.031313 0.087938 -0.0612 0.06815|-0.022668 -0.018772 0.02886 -0.035919 -0.0040533 0.036514 0.019694 0.0016018 -0.022663 0.029309 -0.016789 -0.019067 0.0024566 0.03763 -0.0039336 -0.034942 -0.015448 0.031952 0.028464 0.038801 -0.0012935 0.015648 -0.03904 0.0084632 -0.031121 0.032244 0.045147 -0.051865 -0.0048161|0.0021922 0.0094294 0.010483 -0.02053 -0.030301 0.053416 0.017663 -0.040172 0.0068134 0.012242 0.0076208 0.032852 -0.036469 0.059654 0.0050739 -0.032088 0.022173 0.0133 0.037991 0.010264 0.014691 -0.0013046 0.018521 -0.032415 0.015608 -0.028365 -0.0045755 0.0051986 -0.024395 -0.019044 -0.0046994|-0.0047104 0.026185 0.033342 -0.024512 0.028031 -0.033915 -0.02134 0.040854 0.047988 -0.012121 -0.0034428 0.013875 -0.035597 -0.0080619 -0.0086518 -0.021204 0.0054072 -0.022415 -0.039669 -0.011806 0.011537 0.019112 -0.0032005 0.019563 0.0067254 0.013774 0.0010475 -0.019345 -0.038652 -0.01442 -0.032776 -0.038299 0.0029586';
const EGM_A = 6378136.3, EGM_GM = 3.986004415e14, NMAX = 16;
let GEOID = null;
/** Geoid undulation on a 2° grid from Bruns's formula N = T/γ (computed once, ~5 M flops). */
function geoidGrid() {
  if (GEOID) return GEOID;
  const rows = EGM16.split('|').map((r) => r.split(' ').map(Number)), C = [], S = [];
  rows.forEach((r, i) => { const n = i + 2; C[n] = [r[0]]; S[n] = [0]; for (let m = 1; m <= n; m++) { C[n][m] = r[2 * m - 1] * 1e-6; S[n][m] = r[2 * m] * 1e-6; } C[n][0] = r[0] * 1e-6; });
  const step = 2, nlat = 91, nlon = 181, N = new Float64Array(nlat * nlon);
  const cosT = [], sinT = [];
  for (let j = 0; j < nlon; j++) { const l = (-180 + j * step) * D2R; cosT.push([]); sinT.push([]); for (let m = 0; m <= NMAX; m++) { cosT[j].push(Math.cos(m * l)); sinT[j].push(Math.sin(m * l)); } }
  const P = []; for (let n = 0; n <= NMAX; n++) P.push(new Float64Array(NMAX + 1));
  for (let i = 0; i < nlat; i++) {
    const lat = -90 + i * step, ph = lat * D2R, s = Math.sin(ph), psi = Math.atan((1 - WGS84.e2) * Math.tan(clamp(ph, -1.5707, 1.5707)));
    const Nr = WGS84.a / Math.sqrt(1 - WGS84.e2 * s * s), r = Math.hypot(Nr * Math.cos(ph), Nr * (1 - WGS84.e2) * s);
    const gam = (9.7803253359 * (1 + 0.00193185265241 * s * s)) / Math.sqrt(1 - WGS84.e2 * s * s);
    const t = Math.sin(psi), u = Math.cos(psi);
    P[0][0] = 1; P[1][1] = Math.sqrt(3) * u;
    for (let m = 2; m <= NMAX; m++) P[m][m] = u * Math.sqrt((2 * m + 1) / (2 * m)) * P[m - 1][m - 1];
    for (let m = 0; m <= NMAX; m++) {
      if (m + 1 <= NMAX) P[m + 1][m] = Math.sqrt(2 * m + 3) * t * P[m][m];
      for (let n = m + 2; n <= NMAX; n++) P[n][m] = Math.sqrt((4 * n * n - 1) / (n * n - m * m)) * t * P[n - 1][m] - Math.sqrt((((n - 1) ** 2 - m * m) * (2 * n + 1)) / ((n * n - m * m) * (2 * n - 3))) * P[n - 2][m];
    }
    const k = EGM_GM / (r * gam), ar = EGM_A / r;
    for (let j = 0; j < nlon; j++) {
      let sum = 0;
      for (let n = 2; n <= NMAX; n++) { let tn = 0; for (let m = 0; m <= n; m++) tn += (C[n][m] * cosT[j][m] + S[n][m] * sinT[j][m]) * P[n][m]; sum += ar ** n * tn; }
      N[i * nlon + j] = k * sum;
    }
  }
  return (GEOID = { N, nlat, nlon, step });
}
/** Bilinear interpolation of the geoid grid (m). */
function geoidAt(lon, lat) {
  const g = geoidGrid(), x = (((lon + 180) % 360) + 360) % 360 / g.step, y = clamp((lat + 90) / g.step, 0, g.nlat - 1.000001);
  const j = Math.min(Math.floor(x), g.nlon - 2), i = Math.floor(y), fx = x - j, fy = y - i, at = (a, b) => g.N[a * g.nlon + b];
  return (1 - fy) * ((1 - fx) * at(i, j) + fx * at(i, j + 1)) + fy * ((1 - fx) * at(i + 1, j) + fx * at(i + 1, j + 1));
}
/** Three-parameter datum shifts to WGS84 (NIMA TR8350.2 mean solutions), ΔX = X_WGS84 − X_local, in metres. */
const DATUMS = [
  { name: 'NAD27', where: 'North America', E: ellipsoid(6378206.4, 6378206.4 / (6378206.4 - 6356583.8)), d: [-8, 160, 176], color: 'orange', ell: 'Clarke 1866' },
  { name: 'ED50', where: 'western Europe', E: ellipsoid(6378388, 297), d: [-87, -98, -121], color: 'green', ell: 'International 1924' },
  { name: 'OSGB36', where: 'Great Britain', E: ellipsoid(6377563.396, 6377563.396 / (6377563.396 - 6356256.909)), d: [375, -111, 431], color: 'purple', ell: 'Airy 1830' },
  { name: 'Tokyo', where: 'Japan', E: ellipsoid(6377397.155, 299.1528128), d: [-148, 507, 685], color: 'teal', ell: 'Bessel 1841' },
];
/** Where a point's local-datum coordinates land if read as WGS84: {dE, dN} metres, and the WGS84 ellipsoid's height above the local one. */
function datumShift(lat, lon, D) {
  const X = geodToEcef(lat, lon, 0), XL = [X[0] - D.d[0], X[1] - D.d[1], X[2] - D.d[2]];
  const [la, lo, h] = ecefToGeod(XL[0], XL[1], XL[2], D.E), R = radii(lat);
  let dl = lo - lon; if (dl > 180) dl -= 360; if (dl < -180) dl += 360;
  return { dN: (la - lat) * D2R * R.M, dE: dl * D2R * R.N * Math.cos(lat * D2R), h };
}

// ---------------------------------------------------------------- 1.10: least-squares position fix
/** Gauss–Newton fix: sats (positions), rho (pseudoranges), unknowns x (dim) and, if bias, the clock term b (same units). */
function solveFix(M, sats, rho, x0, bias) {
  const dim = x0.length; let x = x0.slice(), b = 0, Q = null, ok = false;
  for (let it = 0; it < 15; it++) {
    const H = [], r = [];
    for (let i = 0; i < sats.length; i++) {
      const d = sats[i].map((c, k) => c - x[k]), R = Math.hypot(...d);
      H.push(bias ? [...d.map((c) => -c / R), 1] : d.map((c) => -c / R)); r.push(rho[i] - R - (bias ? b : 0));
    }
    const Ht = M.transpose(H), N = M.matMul(Ht, H), dx = M.solve(N, M.matVec(Ht, r));
    if (!dx || dx.some((z) => !isFinite(z))) return { x, b, Q: null, ok: false };
    for (let k = 0; k < dim; k++) x[k] += dx[k]; if (bias) b += dx[dim];
    Q = M.inverse(N);
    if (Math.hypot(...dx) < 1e-9 * (1 + Math.hypot(...x))) { ok = true; break; }
    ok = true;
  }
  return { x, b, Q, ok };
}

export default {
  collection: 'geog',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Model',
      name: 'The Earth as an oblate ellipsoid',
      credit: 'Newton, 1687; Clairaut, 1743',
      statement: String.raw`To within about 100 m the Earth's figure is an oblate ellipsoid of revolution, $(x^2+y^2)/a^2 + z^2/b^2 = 1$ with $a > b$, described by its equatorial radius $a$ and flattening $f = (a-b)/a$. The WGS84 ellipsoid used by GPS fixes $a = 6\,378\,137$ m and $1/f = 298.257223563$, so $b = 6\,356\,752.314$ m, $a - b = 21.385$ km and $e^2 = f(2-f) = 0.00669438$.

The flattening is the equilibrium shape of a rotating, self-gravitating, nearly fluid body. To first order (Clairaut's theory with the Radau–Darwin relation)
$$f = \frac{\tfrac52\, q}{1 + \tfrac{25}{4}\left(1 - \tfrac32\,\tfrac{C}{Ma^2}\right)^2}, \qquad q = \frac{\omega^2 a^3}{GM},$$
where $q$ compares the centrifugal and gravitational accelerations at the equator and $C/Ma^2$ measures how strongly the mass is concentrated toward the centre ($0.4$ for a uniform body, giving $f = 5q/4$).`,
      scope: String.raw`Holds for a slowly rotating body in hydrostatic equilibrium ($q \ll 1$, first order in $f$). The real Earth departs from the ellipsoid by the geoid's $\pm 100$ m (1.8), and rigid structures can spoil the prediction (Mars's Tharsis bulge makes it flatter than its spin explains).`,
      idea: String.raw`In the frame turning with the Earth, gravity and the centrifugal potential $-\tfrac12\omega^2 r_\perp^2$ (mech-9.7) add up to an effective potential, and a fluid surface settles on one of its level surfaces, perpendicular to the plumb line. The centrifugal term alone would raise the equator by $q/2$; the bulge's own extra attraction raises it further, so a uniform planet flattens by $5q/4$ — Newton's $1/230$. Mass concentrated toward the centre gives the bulge less pull of its own, and the Radau–Darwin relation turns the Earth's measured $C/Ma^2 = 0.3307$ into $f \approx 1/299$, within $0.3\%$ of the geodetic $1/298.26$. The French arc measurements in Lapland and Peru (1730s) settled the shape in Newton's favour.`,
      caption: String.raw`Change the length of the day and the central concentration. The left panel draws the computed meridian section, with the flattening exaggerated by the slider (the dashed circle is the sphere of the same equatorial radius) and the centrifugal acceleration growing toward the equator; the right panel places the result on the log–log plot of flattening against spin, beside the exact curve for a uniform fluid (Maclaurin spheroids) and the measured planets.`,
      deps: ['mech-9.7', 'geog-1.2'],
      see: ['astro-3.8', 'geo-2.5'],
      refs: ['Snyder §3'],
      tags: ['geodesy', 'rotation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Earth_ellipsoid' },
      viz(v) {
        const per = v.slider('length of the day', 3, 48, 23.9345, { step: 0.01, fmt: (x) => x.toFixed(2) + ' h' });
        const conc = v.slider('central concentration $C/Ma^2$', 0.2, 0.4, 0.3307, { step: 0.001, fmt: (x) => x.toFixed(3) });
        const ex = v.slider('exaggerate the flattening ×', 1, 60, 25, { step: 1, int: true });
        const sA = v.stage({ x: [-1.5, 1.5], y: [-1.28, 1.36], equal: true, axes: false, height: 360 });
        const sB = v.stage({ x: [1e-3, 0.4], y: [1e-3, 0.4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 360, xlabel: '$q = \\omega^2 a^3/GM$', ylabel: 'flattening $f$' });
        const qOf = (P) => (2 * Math.PI / (P * 3600)) ** 2 * WGS84.a ** 3 / GM_EARTH;
        const mac = []; for (let i = 0; i <= 160; i++) { const e = 0.04 + (MAC_EMAX - 0.04) * (i / 160) ** 0.8, m = maclaurin(e); mac.push([m.q, m.f]); }
        v.render(() => {
          const q = qOf(per.value), C = conc.value, f = fDR(q, C), k = ex.value, fd = Math.min(0.62, k * f), b = 1 - fd;
          // ---- meridian section
          sA.line(0, -1.24, 0, 1.24, { color: 'muted', width: 1, dash: [5, 4] });
          const spin = arcPts(0, 1.17, 0.2, Math.PI * 1.05, Math.PI * 1.95, 24).map(([x, y]) => [x, 1.17 + (y - 1.17) * 0.35]);
          sA.path(spin, { color: 'muted', width: 1.4 });
          const s2 = spin[spin.length - 1], s1 = spin[spin.length - 3]; sA.arrow(s1[0], s1[1], s2[0], s2[1], { color: 'muted', width: 1.4, head: 7 });
          sA.text('ω', 0.24, 1.2, { math: true, color: 'muted', size: 15 });
          sA.circle(0, 0, 1, { color: 'muted', width: 1.1, dash: [4, 4] });
          sA.curve((t) => [Math.cos(t), b * Math.sin(t)], 0, 2 * Math.PI, { fill: 'blue', fillAlpha: 0.12, color: 'blue', width: 2.2, n: 200 });
          sA.line(-1, 0, 1, 0, { color: 'muted', width: 0.8, alpha: 0.6 });
          sA.arrow(0, 0, 1, 0, { color: 'ink', width: 1.6, head: 7 }); sA.tex('a', 0.5, 0, { baseline: 'bottom', dy: -3, size: 15 });
          sA.arrow(0, 0, 0, b, { color: 'ink', width: 1.6, head: 7 }); sA.tex('b', 0, b * 0.5, { align: 'left', dx: 5, size: 15 });
          if (fd > 0.015) { sA.line(0.08, b, 0.08, 1, { color: 'red', width: 2 }); sA.text(`a − b = ${comma(f * WGS84.a / 1000, 1)} km${k > 1 ? ` (×${k})` : ''}`, 0.14, (1 + b) / 2 + 0.02, { size: 11.5, color: 'red', weight: 600 }); }
          // centrifugal acceleration ω²r⊥ (relative lengths)
          const L = Math.min(0.42, 1.6 * Math.sqrt(q));
          for (const lat of [-60, -30, 0, 30, 60]) {
            const t = Math.atan2(Math.tan(lat * D2R) * b, 1), x = Math.cos(t), y = b * Math.sin(t);
            for (const sg of [1, -1]) sA.arrow(sg * x, y, sg * (x + L * x), y, { color: 'orange', width: 1.6, head: 6 });
          }
          sA.text('centrifugal ω²r⊥', -1.46, -1.18, { size: 11.5, color: 'orange', weight: 600 });
          sA.text(`drawn f = ${(fd).toFixed(3)}`, 1.46, -1.18, { size: 11, color: 'muted', align: 'right' });
          // ---- flattening against spin
          sB.path(mac, { color: 'blue', width: 2.4 });
          sB.fn((x) => 1.25 * x, { color: 'blue', width: 1.1, dash: [4, 4], alpha: 0.7 });
          sB.fn((x) => fDR(x, C), { color: 'orange', width: 2.2 });
          sB.vline(q, { color: 'gold', width: 1, dash: [3, 3] });
          sB.dot(q, f, { r: 8, color: 'gold' });
          for (const p of PLANETS) {
            const E = p.name === 'Earth';
            sB.dot(p.q, p.f, { r: 4.5, color: E ? 'green' : 'ink', ring: true });
            sB.text(`${p.name} (${p.C})`, p.q, p.f, { size: 11, color: E ? 'green' : 'ink', align: E ? 'left' : 'right', dx: E ? 10 : -8, dy: E ? 12 : p.name === 'Mars' ? -8 : 6, weight: 600 });
          }
          v.legend([['blue', 'uniform fluid, exact (Maclaurin)'], ['blue', String.raw`first order $f = 5q/4$`, { dash: true }], ['orange', String.raw`Radau–Darwin at this $C/Ma^2$`], ['gold', 'your planet', { dot: true }], ['ink', 'measured planets (I/MR² in brackets)', { dot: true }]]);
        });
        v.readout(() => {
          const q = qOf(per.value), C = conc.value, f = fDR(q, C), fM = maclaurinF(q), fE = 1 / 298.257223563;
          const earth = Math.abs(per.value - 23.9345) < 0.01 && Math.abs(C - 0.3307) < 0.0006;
          return `Day of ${per.value.toFixed(2)} h: $q = ${(q).toFixed(5)}$ ($1/${(1 / q).toFixed(1)}$). Uniform fluid: $f = 1/${(1 / fM).toFixed(1)}$ (exact), $5q/4 = 1/${(0.8 / q).toFixed(1)}$. With $C/Ma^2 = ${C.toFixed(4)}$: **$f = 1/${(1 / f).toFixed(1)}$**, $a - b = ${(f * WGS84.a / 1000).toFixed(2)}$ km` + (earth ? ` — the measured WGS84 value is $1/f = 298.257223563$, $a-b = 21.385$ km, a difference of ${((f / fE - 1) * 100).toFixed(2)}%.` : '. (The Earth: 23.93 h and 0.3307.)') + ` WGS84: $a = 6\\,378\\,137$ m, $b = ${(WGS84.b).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, '$1\\,')}$ m.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Definition',
      name: 'Geodetic, geocentric and parametric latitude',
      statement: String.raw`Let $P = (a\cos\beta,\ b\sin\beta)$ be a point of the meridian ellipse with semi-axes $a \ge b$. Its
- **geodetic latitude** $\varphi$ is the angle between the normal to the ellipse at $P$ and the equatorial plane;
- **geocentric latitude** $\psi$ is the angle between $OP$ and the equatorial plane;
- **parametric (reduced) latitude** $\beta$ is the angle at $O$ of the point of the circle of radius $a$ lying directly above $P$.

They are linked by $\tan\psi = (b/a)^2\tan\varphi = (1-e^2)\tan\varphi$ and $\tan\beta = (b/a)\tan\varphi$, so $|\psi| \le |\beta| \le |\varphi|$ with equality only at the equator and the poles. On WGS84 the difference $\varphi - \psi$ peaks at $11.55'$ at $\varphi \approx 45.1^\circ$ (about 21.4 km along the meridian) and $\varphi - \beta$ at $5.77'$. Maps and GPS use geodetic latitude; it is also, up to the deflection of the vertical (1.8), the astronomical latitude given by the height of the celestial pole.`,
      idea: String.raw`The normal to $x^2/a^2 + z^2/b^2 = 1$ is the gradient $(x/a^2,\ z/b^2)$, while $OP$ is $(x, z)$ and the circle point is $(x, a\sin\beta)$; comparing slopes gives the two tangent relations. Setting the derivative of $\varphi - \psi$ to zero gives $\tan\varphi = a/b$, just above $45^\circ$, where $\tan(\varphi - \psi) = e^2/(2\sqrt{1-e^2})$; to first order $\varphi - \psi \approx f\sin 2\varphi$. Geocentric latitude is what gravity models and satellite orbits use; reduced latitude turns the ellipse into a stretched circle and is the variable of Vincenty's geodesic formula (1.4).`,
      caption: String.raw`Drag $P$ around the ellipse and change its flattening (the button restores the true Earth, where the three lines cannot be told apart). The normal (blue) gives $\varphi$, the line to the centre (red) $\psi$, and the vertical up to the auxiliary circle (purple) $\beta$. The right panel plots, for the real WGS84 Earth, how far apart they are at each geodetic latitude, in arcminutes.`,
      deps: ['geog-1.6'],
      refs: ['Snyder §3'],
      tags: ['coordinates', 'geodesy'],
      viz(v) {
        const ba = v.slider('polar radius $b/a$ in the drawing', 0.5, 1, 0.7, { step: 0.001, fmt: (x) => x.toFixed(4) });
        v.button('true Earth: b/a = 0.99665', () => ba.set(WGS84.b / WGS84.a));
        const sA = v.stage({ x: [-0.16, 1.34], y: [-0.13, 1.13], equal: true, axes: false, height: 360 });
        const sB = v.stage({ x: [0, 90], y: [0, 12.6], axes: 'box', gutter: true, height: 360, xlabel: 'geodetic latitude φ (°)', ylabel: 'difference (arcmin)', xticks: [0, 15, 30, 45, 60, 75, 90] });
        let beta = 42 * D2R;
        const P = sA.handle(Math.cos(beta), 0.7 * Math.sin(beta), {
          color: 'accent', label: 'P', labelPos: 'e',
          constrain: (x, y) => { const k = ba.value; beta = clamp(Math.atan2(y / k, x), 0.03, 1.54); return [Math.cos(beta), k * Math.sin(beta)]; },
        });
        const e2 = WGS84.e2, k0 = 1 - e2, sq = Math.sqrt(1 - e2);
        const dPsi = (f) => (f - Math.atan(k0 * Math.tan(f))) * R2D * 60, dBeta = (f) => (f - Math.atan(sq * Math.tan(f))) * R2D * 60;
        const angles = () => { const k = ba.value; return { phi: Math.atan2(Math.tan(beta), k), psi: Math.atan(k * Math.tan(beta)), beta }; };
        v.render(() => {
          const k = ba.value, x = Math.cos(beta), y = k * Math.sin(beta); P.x = x; P.y = y;
          const { phi, psi } = angles();
          // ellipse quadrant, circle, axes
          sA.curve((t) => [Math.cos(t), k * Math.sin(t)], -0.12, Math.PI / 2 + 0.12, { color: 'blue', width: 2.4 });
          const quad = [[0, 0]]; for (let i = 0; i <= 60; i++) { const t = (i / 60) * Math.PI / 2; quad.push([Math.cos(t), k * Math.sin(t)]); }
          sA.poly(quad, { fill: 'blue', fillAlpha: 0.08, stroke: false });
          sA.curve((t) => [Math.cos(t), Math.sin(t)], -0.1, Math.PI / 2 + 0.1, { color: 'muted', width: 1.1, dash: [4, 4] });
          sA.line(-0.12, 0, 1.3, 0, { color: 'muted', width: 1 }); sA.line(0, -0.1, 0, 1.1, { color: 'muted', width: 1 });
          sA.text('equator', 1.3, -0.05, { size: 11, color: 'muted', align: 'right' });
          sA.text('axis', 0.02, 1.08, { size: 11, color: 'muted' });
          sA.text('circle of radius a', 0.72, 0.74, { size: 11, color: 'muted', align: 'left' });
          // the three constructions
          const xF = x * (1 - k * k), Pp = [x, Math.sin(beta)];
          sA.line(x, y, x, Pp[1], { color: 'purple', width: 1.2, dash: [3, 3] });
          sA.line(0, 0, Pp[0], Pp[1], { color: 'purple', width: 1.8 });
          sA.dot(Pp[0], Pp[1], { r: 3.5, color: 'purple' });
          sA.line(0, 0, x, y, { color: 'red', width: 2 });
          const n = [Math.cos(phi), Math.sin(phi)];
          sA.line(xF, 0, x + 0.16 * n[0], y + 0.16 * n[1], { color: 'accent', width: 2 });
          sA.line(x - 0.22 * n[1], y + 0.22 * n[0], x + 0.22 * n[1], y - 0.22 * n[0], { color: 'faint', width: 1.2 }); // tangent
          sA.path(arcPts(xF, 0, 0.13, 0, phi, 20), { color: 'accent', width: 2 });
          sA.path(arcPts(0, 0, 0.2, 0, psi, 20), { color: 'red', width: 2 });
          sA.path(arcPts(0, 0, 0.3, 0, beta, 20), { color: 'purple', width: 2 });
          sA.tex('\\varphi', xF + 0.19 * Math.cos(phi / 2), 0.19 * Math.sin(phi / 2), { color: 'accent', size: 14 });
          sA.tex('\\psi', 0.26 * Math.cos(psi / 2) + 0.02, 0.26 * Math.sin(psi / 2) - 0.01, { color: 'red', size: 14 });
          sA.tex('\\beta', 0.36 * Math.cos((psi + beta) / 2 + 0.06), 0.36 * Math.sin((psi + beta) / 2 + 0.06), { color: 'purple', size: 14 });
          sA.dot(0, 0, { r: 3, color: 'ink' }); sA.text('O', -0.03, -0.05, { math: true, size: 14, align: 'right' });
          // ---- WGS84 differences
          sB.fn((f) => dPsi(f * D2R), { color: 'red', width: 2.4, domain: [0, 89.99] });
          sB.fn((f) => dBeta(f * D2R), { color: 'purple', width: 2.4, domain: [0, 89.99] });
          const fmax = Math.atan(1 / sq) * R2D, m1 = dPsi(fmax * D2R);
          sB.dot(fmax, m1, { r: 4, color: 'red' });
          sB.text(`max ${m1.toFixed(2)}′ at ${fmax.toFixed(2)}° ≈ ${(m1 / 60 * D2R * radii(fmax).M / 1000).toFixed(1)} km`, fmax, m1 + 0.45, { align: 'center', size: 11.5, color: 'red', weight: 600, baseline: 'bottom', plate: true });
          const fd = phi * R2D;
          sB.vline(fd, { color: 'accent', dash: [3, 3] });
          sB.dot(fd, dPsi(phi), { r: 5.5, color: 'red' }); sB.dot(fd, dBeta(phi), { r: 5.5, color: 'purple' });
          v.legend([['accent', 'normal → geodetic φ'], ['red', 'radius → geocentric ψ (right: φ − ψ)'], ['purple', 'circle point → parametric β (right: φ − β)']]);
        });
        v.readout(() => {
          const k = ba.value, { phi, psi } = angles();
          const ratio = Math.tan(psi) / Math.tan(phi);
          return `Drawing ($b/a = ${k.toFixed(4)}$): $\\varphi = ${(phi * R2D).toFixed(2)}^\\circ$, $\\beta = ${(beta * R2D).toFixed(2)}^\\circ$, $\\psi = ${(psi * R2D).toFixed(2)}^\\circ$; measured $\\tan\\psi/\\tan\\varphi = ${ratio.toFixed(4)}$ against $(b/a)^2 = ${(k * k).toFixed(4)}$. On WGS84 at $\\varphi = ${(phi * R2D).toFixed(2)}^\\circ$: $\\varphi - \\psi = ${dPsi(phi).toFixed(2)}'$ and $\\varphi - \\beta = ${dBeta(phi).toFixed(2)}'$, i.e. ${(dPsi(phi) / 60 * D2R * radii(phi * R2D).M / 1000).toFixed(1)} km and ${(dBeta(phi) / 60 * D2R * radii(phi * R2D).M / 1000).toFixed(1)} km along the meridian.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Concept',
      name: 'The geoid and geodetic datums',
      statement: String.raw`The **geoid** is the level surface of the Earth's gravity potential (gravitation plus the centrifugal term) that best fits mean sea level. It is everywhere perpendicular to the plumb line and is the zero of heights above sea level. It departs from the best-fitting ellipsoid by the *geoid undulation* $N$, between about $-106$ m (south of India) and $+86$ m (near New Guinea), so a height above sea level is $H \approx h - N$, where $h$ is the height above the ellipsoid that GPS measures.

A **geodetic datum** fixes a reference ellipsoid $(a, f)$ and how it sits in the Earth. Global datums such as WGS84 are centred on the Earth's centre of mass; older regional datums (NAD27, ED50, OSGB36, Tokyo) chose an ellipsoid and an offset that hugged the geoid over one region. The same latitude and longitude therefore name points tens to hundreds of metres apart in different datums.`,
      idea: String.raw`Excess mass (dense slabs, mantle upwellings) bends the level surface outward and deficits bend it in; the tilt of the geoid against the ellipsoid is the deflection of the vertical, which is why the Airy transit circle that defined the Greenwich meridian lies 102 m west of the WGS84 zero meridian. The map sums the EGM2008 spherical-harmonic model up to degree 16 (wavelengths above about 2,500 km), subtracting the field of the WGS84 ellipsoid, with Bruns's formula $N = T/\gamma$: $N = \frac{GM}{r\gamma}\sum_n (a/r)^n \sum_m (\Delta\bar C_{nm}\cos m\lambda + \bar S_{nm}\sin m\lambda)\bar P_{nm}(\sin\psi)$, which uses the geocentric latitude of 1.7. A datum shift is a change of ellipsoid and origin: convert $(\varphi, \lambda)$ to Earth-centred coordinates on one ellipsoid, translate, and convert back on the other.`,
      caption: String.raw`Drag the probe across the geoid map (EGM2008 to degree 16; red above the ellipsoid, blue below). The lower left panel follows the probe's parallel all the way round, the geoid heights multiplied by the slider (10,000× by default) above the ellipse; the lower right panel shows where the probe's coordinates in four old regional datums would land if read as WGS84 coordinates.`,
      deps: ['geog-1.6', 'geog-1.7'],
      see: ['geol-5.7'],
      refs: ['Snyder §3'],
      tags: ['geodesy', 'gravity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Geoid' },
      viz(v) {
        const ex = v.slider('exaggerate the geoid heights ×', 1, 20000, 10000, { log: true, sig: 2, fmt: (x) => comma(x) });
        const sA = v.stage({ height: 320, full: true });
        const sB = v.stage({ x: [-1.32, 1.32], y: [-1.3, 1.3], equal: true, axes: false, height: 330 });
        const sC = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 330 });
        const G = v.globe(sA, { projection: 'mollweide', center: [10, 0], graticule: 30, drag: false });
        const probe = G.handle(-0.0015, 51.4778, { label: 'probe', color: 'ink' });
        const col = (N) => { const c = v.diverge(clamp(N / 95, -1, 1), 'blue', 'red'); return [c[0], c[1], c[2], 255]; };
        v.render(() => {
          geoidGrid();
          const lat = probe.lat, lon = probe.lon, Np = geoidAt(lon, lat);
          // ---- map
          G.draw({ land: false, graticule: false });
          sA.raster((x, y) => { const q = G.invert(x, y); return q ? col(geoidAt(q[0], q[1])) : null; }, { key: `geoid|${G.center}`, res: 2 });
          G.graticule(30, { alpha: 0.3 });
          G.land(null, { fillAlpha: 0, color: 'ink', alpha: 0.5, width: 0.8 });
          G.draw({ ocean: false, graticule: false, land: false, shade: false });
          G.text('Indian Ocean low', [78, -12], { size: 11, color: 'ink', align: 'center', plate: true });
          G.text('New Guinea high', [146, 12], { size: 11, color: 'ink', align: 'center', plate: true });
          G.text('N. Atlantic high', [-42, 66], { size: 11, color: 'ink', align: 'center', plate: true });
          G.path((() => { const p = []; for (let l = -180; l <= 180; l += 2) p.push([l, lat]); return p; })(), { geodesic: false, color: 'ink', width: 1.2, dash: [5, 4], alpha: 0.7 });
          sA.colorbar([-110, 110], (t) => v.diverge(2 * t - 1, 'blue', 'red'), { pos: 'right', label: 'N (m)', ticks: [-100, -50, 0, 50, 100] });
          // ---- the parallel, exaggerated
          const k = ex.value, s = 0.82, pts = [], ref = [];
          for (let i = 0; i <= 180; i++) {
            const l = -180 + 2 * i, th = Math.PI / 2 + (l - lon) * D2R, N = geoidAt(l, lat), r = s * (1 + (k * N) / (R_MEAN * 1000));
            pts.push([r * Math.cos(th), r * Math.sin(th)]); ref.push([s * Math.cos(th), s * Math.sin(th)]);
          }
          const pos = [], neg = [];
          for (let i = 0; i < 180; i++) { const quad = [ref[i], pts[i], pts[i + 1], ref[i + 1]]; ((geoidAt(-179 + 2 * i, lat) >= 0) ? pos : neg).push(quad); }
          for (const q of pos) sB.poly(q, { fill: 'red', fillAlpha: 0.28, stroke: false });
          for (const q of neg) sB.poly(q, { fill: 'blue', fillAlpha: 0.28, stroke: false });
          sB.poly(ref, { color: 'muted', width: 1.3, dash: [5, 4] });
          sB.poly(pts, { color: 'ink', width: 2 });
          const rp = s * (1 + (k * Np) / (R_MEAN * 1000));
          sB.dot(0, rp, { r: 5, color: 'ink' });
          sB.text(`${lat >= 0 ? comma(lat, 1) + '° N' : comma(-lat, 1) + '° S'} parallel, heights × ${comma(k)}`, sB.xr[0] + 0.04, sB.yr[1] - 0.1, { size: 11.5, weight: 600 });
          sB.text('ellipsoid', 0, 0.06, { size: 11, color: 'muted', align: 'center' });
          sB.text('geoid', 0, -0.08, { size: 11, color: 'ink', align: 'center', weight: 600 });
          sB.corner(lat >= 0 ? 'seen from above the North Pole' : 'seen from above the South Pole', 'br', { size: 10.5 });
          // ---- datum shifts
          const sh = DATUMS.map((D) => ({ D, ...datumShift(lat, lon, D) }));
          const big = Math.max(...sh.map((x) => Math.hypot(x.dE, x.dN)));
          const stepM = [50, 100, 200, 250, 500, 1000].find((st) => big / st <= 4) || 1000, R = Math.ceil(big / stepM + 0.3) * stepM, sc = 0.82 / R;
          for (let r = stepM; r <= R + 1e-9; r += stepM) { sC.circle(0, 0, r * sc, { color: 'grid', width: 1 }); sC.text(`${r} m`, 0.02, -r * sc - 0.03, { size: 10, color: 'muted' }); }
          sC.line(-0.9, 0, 0.9, 0, { color: 'grid', width: 1 }); sC.line(0, -0.9, 0, 0.9, { color: 'grid', width: 1 });
          sC.text('N', 0, 0.94, { size: 11, color: 'muted', align: 'center' }); sC.text('E', 0.94, 0, { size: 11, color: 'muted' });
          for (const x of sh) {
            sC.arrow(0, 0, x.dE * sc, x.dN * sc, { color: x.D.color, width: 2.2, head: 8 });
            const ang = Math.atan2(x.dN, x.dE), lr = Math.hypot(x.dE, x.dN) * sc;
            sC.text(`${x.D.name} ${Math.round(Math.hypot(x.dE, x.dN))} m`, (lr + 0.06) * Math.cos(ang), (lr + 0.06) * Math.sin(ang), { size: 11, color: x.D.color, weight: 600, align: Math.cos(ang) > 0.3 ? 'left' : Math.cos(ang) < -0.3 ? 'right' : 'center', baseline: Math.sin(ang) > 0.3 ? 'bottom' : Math.sin(ang) < -0.3 ? 'top' : 'middle' });
          }
          sC.dot(0, 0, { r: 4, color: 'ink' });
          sC.text('same numbers read as WGS84', sC.xr[0] + 0.03, sC.yr[1] - 0.06, { size: 11.5, weight: 600 });
          v.legend([['red', 'geoid above the ellipsoid', { area: true }], ['blue', 'geoid below', { area: true }], ...DATUMS.map((D) => [D.color, `${D.name} (${D.ell})`])]);
        });
        v.readout(() => {
          const lat = probe.lat, lon = probe.lon, Np = geoidAt(lon, lat);
          const sh = DATUMS.map((D) => ({ D, ...datumShift(lat, lon, D) }));
          const near = sh.slice().sort((p, q) => Math.abs(Np + p.h) - Math.abs(Np + q.h))[0];
          return `Probe ${dms(lat)}, ${dms(lon, 'E', 'W')}: geoid undulation **$N = ${Np >= 0 ? '+' : '−'}${Math.abs(Np).toFixed(1)}$ m** (EGM2008, $n \\le 16$), so mean sea level lies ${Math.abs(Np).toFixed(0)} m ${Np >= 0 ? 'above' : 'below'} the WGS84 ellipsoid and a GPS height $h$ reads $H + N$. Measured from its own ellipsoid, each regional datum puts the geoid here at ${sh.map((x) => `${x.D.name} ${(Np + x.h) >= 0 ? '+' : '−'}${Math.abs(Np + x.h).toFixed(0)} m`).join(', ')} — ${near.D.name}, fitted to ${near.D.where}, hugs it best.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Invention',
      name: 'The marine chronometer and the longitude problem',
      credit: 'John Harrison, H4 (1759); sea trial 1761–62',
      statement: String.raw`Longitude is a difference of times: the Earth turns $15^\circ$ per hour relative to the mean Sun, so a ship's longitude is $\lambda = 15^\circ/\text{h} \times (\text{local mean time} - \text{Greenwich mean time})$. Local time comes from the Sun or stars; a marine chronometer carries Greenwich time. Each second of clock error is $15''$ of longitude, $464$ m at the equator and $464\cos\varphi$ m at latitude $\varphi$.

The Longitude Act of 1714 offered £10,000, £15,000 and £20,000 for a practicable method good to $1^\circ$, $40'$ and $\tfrac12^\circ$ on a voyage to the West Indies; half a degree allows two minutes of accumulated clock error. John Harrison's sea watch H4 met it on its 1761–62 trial from Portsmouth to Jamaica (81 days 5 hours): after allowing for its measured rate (losing $24/9$ s a day) it was found 5 s slow, an error of $1.25'$ of longitude.`,
      idea: String.raw`A clock at sea need not keep exact time, only a steady, known rate, because the navigator subtracts rate × days. An unknown rate makes the error grow linearly; random day-to-day variations make it grow like $\sqrt{t}$ (a random walk). Pendulum clocks failed at sea because the ship's motion disturbs the pendulum and temperature changes the springs and the balance; Harrison's fast, heavy balance, his remontoire and bimetallic compensation made the rate steady enough. The rival lunar-distance method, which reads Greenwich time off the Moon's motion against the stars, also worked, but needed long calculations with almanac tables.`,
      caption: String.raw`Choose a timekeeper or set its daily rate and day-to-day scatter. The left panel plots the clock error of 40 simulated voyages of 81.2 days (bold: the first), with the Act's three prize bands; the dot is H4's measured result at Jamaica. Switch off the allowance for the known rate to see why steadiness mattered more than accuracy. The map shows where each voyage's longitude would put the ship on arrival — zoom to Kingston to see the half-degree band. (Only the H4 rate and its result are historical; the other presets are illustrative.)`,
      deps: ['geog-1.2'],
      refs: ['Haggett'],
      tags: ['navigation', 'timekeeping', 'history of technology'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Longitude_Act' },
      viz(v) {
        const PRE = { h4: [-2.667, 0.5], watch: [8, 6], pend: [0, 40] };
        const kind = v.select('timekeeper', [{ value: 'h4', label: 'Harrison’s H4' }, { value: 'watch', label: 'a good pocket watch' }, { value: 'pend', label: 'pendulum clock at sea' }], 'h4', { onChange: (p) => { rate.set(PRE[p][0]); scat.set(PRE[p][1]); } });
        const rate = v.slider('rate (s/day)', -20, 20, -2.667, { step: 0.01, fmt: (x) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(2) });
        const scat = v.slider('day-to-day scatter (s/day)', 0.1, 60, 0.5, { log: true, sig: 2, fmt: (x) => x.toFixed(x < 1 ? 2 : 1) });
        const allow = v.toggle('allow for the rate measured before sailing', true);
        const zoom = v.select('map', [{ value: 'all', label: 'the voyage' }, { value: 'kgn', label: 'arrival at Kingston' }], 'all');
        const sA = v.stage({ x: [0, 81.2], y: [-300, 300], axes: 'box', gutter: true, height: 340, xlabel: 'days at sea', ylabel: 'clock error (s)' });
        const sB = v.stage({ height: 340 });
        const G = v.globe(sB, { projection: 'orthographic', center: [-40, 32], graticule: 10, zoom: 1.45 });
        const T = 81.2, NV = 40, ND = 82, KGN = [-76.79, 17.97];
        const days = []; for (let d = 0; d < ND; d++) days.push(d); days.push(T);
        const rng = v.rng(1761), W = []; // cumulative standard random walks, one per voyage
        for (let k = 0; k < NV; k++) { const w = [0]; let s = 0; for (let d = 1; d < days.length; d++) { s += rng.normal() * Math.sqrt(days[d] - days[d - 1]); w.push(s); } W.push(w); }
        const route = [[-1.09, 50.8], [-10.5, 44], [-16.92, 32.65], [-45, 17], [-62, 15], KGN];
        const dense = []; for (let i = 0; i + 1 < route.length; i++) { const seg = v.geo('interpolate', route[i], route[i + 1]); dense.push(...(i ? seg.slice(1) : seg)); }
        const cum = [0]; for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + v.geo('centralAngle', dense[i - 1], dense[i]));
        const at = (frac) => { const s = frac * cum[cum.length - 1]; let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1); return [dense[i - 1][0] + t * (dense[i][0] - dense[i - 1][0]), dense[i - 1][1] + t * (dense[i][1] - dense[i - 1][1])]; };
        const err = (k, d) => (allow.value ? 0 : rate.value * days[d]) + scat.value * W[k][d];
        let lastZoom = 'all';
        const tier = (e) => { const a = Math.abs(e); return a <= 120 ? 2 : a <= 160 ? 1 : a <= 240 ? 0 : -1; };
        v.render(() => {
          let mx = 0; for (let k = 0; k < NV; k++) for (let i = 0; i < days.length; i++) mx = Math.max(mx, Math.abs(err(k, i)));
          const fin = W.map((_, k) => err(k, days.length - 1)), big = Math.max(25, mx * 1.18);
          if (big < 120) sA.text('the whole panel lies inside the ½° band (±120 s)', T * 0.02, big * 0.9, { size: 11, color: 'green', weight: 600 });
          sA.setView([0, T], [-big, big]);
          sA.hband(-240, 240, { color: 'orange', alpha: 0.08 }); sA.hband(-160, 160, { color: 'gold', alpha: 0.1 }); sA.hband(-120, 120, { color: 'green', alpha: 0.12 });
          for (const [y, lab, c] of [[120, '½° = 2 min: £20,000', 'green'], [160, '40′: £15,000', 'gold'], [240, '1°: £10,000', 'orange']]) if (y < big) sA.text(lab, 1, y, { size: 10.5, color: c, baseline: 'bottom', dy: -2, weight: 600 });
          sA.hline(0, { color: 'muted', width: 0.8 });
          for (let k = 1; k < NV; k++) sA.path(days.map((d, i) => [d, err(k, i)]), { color: 'gold', width: 1, alpha: 0.35 });
          sA.path(days.map((d, i) => [d, err(0, i)]), { color: 'accent', width: 2.4 });
          if (kind.value === 'h4' && allow.value) { sA.dot(T, -5, { r: 6, color: 'red' }); sA.text('H4 at Jamaica: 5 s slow', T - 1, -5, { size: 11, color: 'red', align: 'right', baseline: 'bottom', dy: -9, weight: 600, plate: true }); }
          // ---- map
          if (zoom.value !== lastZoom) { lastZoom = zoom.value; if (zoom.value === 'kgn') G.set({ center: KGN, zoom: 18 }); else G.set({ center: [-40, 32], zoom: 1.45 }); }
          G.draw({ graticule: zoom.value === 'kgn' ? 1 : 10 });
          for (const [w, c, a] of [[1, 'orange', 0.35], [40 / 60, 'gold', 0.5], [0.5, 'green', 0.75]]) G.path([[KGN[0] - w, KGN[1]], [KGN[0] + w, KGN[1]]], { geodesic: false, color: c, width: zoom.value === 'kgn' ? 14 : 6, alpha: a });
          G.path(dense, { geodesic: false, color: 'ink', width: 1.6, alpha: 0.7 });
          const believed = days.map((d, i) => { const p = at(d / T); return [p[0] - (err(0, i) * 15) / 3600, p[1]]; });
          G.path(believed, { geodesic: false, color: 'accent', width: 2, dash: [5, 4] });
          for (let k = 0; k < NV; k++) G.dot([KGN[0] - (fin[k] * 15) / 3600, KGN[1]], { r: k ? 2.8 : 5, color: k ? 'gold' : 'accent', ring: false, alpha: k ? 0.8 : 1 });
          if (zoom.value === 'kgn') for (const [w, lab, c] of [[0.5, '½°', 'green'], [40 / 60, '40′', 'gold'], [1, '1°', 'orange']]) G.text(lab, [KGN[0] + w, KGN[1] - 0.32], { size: 11, color: c, align: 'center', weight: 700 });
          G.dot(KGN, { r: 4, color: 'ink', label: 'Kingston', labelPos: zoom.value === 'kgn' ? 'n' : 'w', math: false });
          if (zoom.value === 'all') G.dot(route[0], { r: 4, color: 'ink', label: 'Portsmouth', labelPos: 'ne', math: false });
          v.legend([['accent', 'first voyage: clock error / believed track'], ['gold', 'other voyages'], ['green', '½° (£20,000)', { area: true }], ['gold', '40′ (£15,000)', { area: true }], ['orange', '1° (£10,000)', { area: true }]]);
        });
        v.readout(() => {
          const e = err(0, days.length - 1), arc = Math.abs(e) * 15 / 60; // arcminutes
          const kmEq = (Math.abs(e) * 15 / 3600) * D2R * WGS84.a / 1000, kmK = kmEq * Math.cos(KGN[1] * D2R);
          const tiers = W.map((_, k) => tier(err(k, days.length - 1)));
          const win = [2, 1, 0].map((t) => tiers.filter((x) => x >= t).length);
          return `First voyage, after ${T} days: clock **${e >= 0 ? '+' : '−'}${Math.abs(e).toFixed(1)} s** → longitude error **${arc.toFixed(2)}′** → ${kmEq.toFixed(1)} km at the equator, ${kmK.toFixed(1)} km at Kingston (18° N). Of ${NV} voyages, ${win[0]} are within ½° (£20,000), ${win[1]} within 40′ and ${win[2]} within 1°.` + (allow.value ? '' : ` Without the allowance, a steady ${Math.abs(rate.value).toFixed(2)} s/day alone adds ${comma(Math.abs(rate.value) * T, 0)} s.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Invention',
      name: 'GPS positioning by trilateration',
      credit: 'US Department of Defense (B. Parkinson and colleagues), 1973–1995',
      statement: String.raw`A GPS receiver measures **pseudoranges** $\rho_i = \lVert \mathbf s_i - \mathbf r\rVert + c\,\delta t$ to satellites at known positions $\mathbf s_i$ (broadcast in their ephemerides), where $\delta t$ is the error of its own cheap clock. The unknowns are the position $\mathbf r = (x, y, z)$ and $c\,\delta t$, so four satellites are needed; with more the receiver solves the over-determined system by iterated linearised least squares, $\Delta\hat{\mathbf x} = (H^{\mathsf T}H)^{-1}H^{\mathsf T}(\boldsymbol\rho - \hat{\boldsymbol\rho})$, where the rows of $H$ are $(-\hat{\mathbf u}_i^{\mathsf T},\ 1)$ with $\hat{\mathbf u}_i$ the unit vector toward satellite $i$. If each range has independent error $\sigma$, the fix has covariance $\sigma^2 (H^{\mathsf T}H)^{-1}$, and the square roots of its diagonal in local east, north and up axes are the *dilutions of precision*: $\text{PDOP} = \sqrt{Q_{EE}+Q_{NN}+Q_{UU}}$, HDOP, VDOP and TDOP. Satellites spread over the sky give small DOP; bunched ones give large. In the plane the same scheme uses circles, and three transmitters fix two coordinates and the clock.`,
      scope: String.raw`Assumes straight-line propagation at $c$ with ionospheric and tropospheric delays modelled out, satellites above the horizon (here a $10^\circ$ elevation mask), and satellite clocks kept on GPS time — including their relativistic rate offset (rel-6.9).`,
      idea: String.raw`One true range puts the receiver on a sphere about a satellite; three spheres meet in two points, only one near the Earth. A receiver's quartz clock may be off by a millisecond — 300 km of range — but the error is the same for every satellite, so it can be solved for as a fourth unknown: that is why four satellites are needed and why every receiver ends up knowing atomic time. The equations are nonlinear but nearly linear near the answer, so a few Gauss–Newton steps from the Earth's centre converge; each step is a least-squares projection of the range residuals (stat-12.2). A clock error shared by all satellites is indistinguishable from the receiver's own, so what positioning needs is that the satellite clocks agree — which is why their relativistic offsets (rel-6.9) are built into them.`,
      caption: String.raw`In 2D, drag the four beacons and the receiver: dashed circles have the raw pseudoranges and miss each other by the clock error; solid circles are corrected by the solved clock term and meet at the fix; the right panel shows 300 noisy fixes inside the predicted 95% error ellipse. In 3D, drag the satellites' ground points and the receiver on the globe: each range sphere cuts the Earth in a circle, and the sky plot shows the geometry behind the DOP. Switch off solving for the clock and watch the fix fall apart; bunch the satellites and watch the DOP blow up.`,
      deps: ['geog-1.6', 'rel-6.9', 'stat-12.2'],
      see: ['geog-1.9'],
      refs: ['Haggett'],
      tags: ['navigation', 'least squares'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Global_Positioning_System' },
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: '2d', label: '2D: circles' }, { value: '3d', label: '3D: spheres, four or more satellites' }], '2d');
        const solveB = v.toggle('solve for the receiver clock', true);
        const cb2 = v.slider('clock error $c\\,\\delta t$ (km)', -4, 4, 1.6, { step: 0.05, fmt: (x) => x.toFixed(2) });
        const sg2 = v.slider('range noise $\\sigma$ (m)', 5, 400, 80, { log: true, sig: 2, fmt: (x) => x.toFixed(0) });
        const dt3 = v.slider('clock error $\\delta t$ (ms)', -1, 1, 0.7, { step: 0.01, fmt: (x) => x.toFixed(2) });
        const sg3 = v.slider('range noise $\\sigma$ (m)', 1, 50, 5, { log: true, sig: 2, fmt: (x) => x.toFixed(1) });
        const sA = v.stage({ x: [-12, 12], y: [-12, 12], equal: true, axes: false, grid: true, height: 360 });
        const sG = v.stage({ height: 360 });
        const sB = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, axes: false, height: 360 });
        const ecefToGeodS = (x) => [Math.atan2(x[1], x[0]) * R2D, Math.atan2(x[2], Math.hypot(x[0], x[1])) * R2D];
        const COLS = ['accent', 'orange', 'green', 'purple', 'teal'];
        // ---- 2D: beacons and receiver (km)
        const B2 = [[-8, 6.5], [8.5, 7], [7.5, -7.5], [-6, -8.5]].map((p, i) => sA.handle(p[0], p[1], { color: COLS[i], label: `S${i + 1}` }));
        const R2 = sA.handle(1.2, -0.8, { color: 'ink', label: 'receiver', labelPos: 'se' });
        // ---- 3D: globe with satellite ground points and receiver
        const G = v.globe(sG, { projection: 'orthographic', center: [12, 38], graticule: 30 });
        const lat55 = (l, f) => [l, clamp(f, -55, 55)];
        const S3 = [[-30, 30], [45, 50], [15, -5], [60, 12], [-5, 55]].map((p, i) => G.handle(p[0], p[1], { color: COLS[i], label: `S${i + 1}`, constrain: lat55 }));
        const R3 = G.handle(10, 45, { color: 'ink', label: 'receiver', labelPos: 'se' });
        const RE = 6371, RS = 26560, C_KM_MS = 299.792458; // km, km, km per ms
        const rng = v.rng(4), NOISE = []; for (let k = 0; k < 300; k++) NOISE.push([0, 1, 2, 3, 4].map(() => rng.normal()));
        let last = null;
        const sync = () => {
          const is3 = mode.value === '3d';
          sA.el.hidden = is3; sG.el.hidden = !is3;
          cb2.el.hidden = is3; sg2.el.hidden = is3; dt3.el.hidden = !is3; sg3.el.hidden = !is3;
        };
        function compute() {
          const is3 = mode.value === '3d';
          if (!is3) {
            const sats = B2.map((h) => [h.x, h.y]), r = [R2.x, R2.y], cb = cb2.value, sig = sg2.value / 1000;
            const true_ = sats.map((s) => Math.hypot(s[0] - r[0], s[1] - r[1])), rho = true_.map((d) => d + cb);
            const x0 = [sats.reduce((a, s) => a + s[0], 0) / 4, sats.reduce((a, s) => a + s[1], 0) / 4];
            const fix = solveFix(M, sats, rho, x0, solveB.value);
            const mc = []; let inside = 0;
            const Q = fix.Q;
            for (const z of NOISE) {
              const f = solveFix(M, sats, rho.map((p, i) => p + sig * z[i]), fix.x, solveB.value);
              if (!f.ok) continue; const e = [f.x[0] - fix.x[0], f.x[1] - fix.x[1]]; mc.push(e);
              if (Q) { const a = Q[0][0], b = Q[0][1], d = Q[1][1], det = a * d - b * b; const m2 = (d * e[0] * e[0] - 2 * b * e[0] * e[1] + a * e[1] * e[1]) / det / (sig * sig); if (m2 <= 5.991) inside++; }
            }
            return { is3, sats, r, rho, fix, mc, inside, sig, used: sats.map(() => true) };
          }
          const rv = scale3(vec([R3.lon, R3.lat]), RE), up = vec([R3.lon, R3.lat]), F = enu([R3.lon, R3.lat]);
          const cb = dt3.value * C_KM_MS, sig = sg3.value / 1000;
          const all = S3.map((h) => scale3(vec([h.lon, h.lat]), RS));
          const els = all.map((s) => { const u = unit3(sub3(s, rv)); return { el: Math.asin(dot3(u, up)) * R2D, az: Math.atan2(dot3(u, F.e), dot3(u, F.n)) }; });
          const used = els.map((e) => e.el >= 10), sats = all.filter((_, i) => used[i]);
          const rhoAll = all.map((s) => norm3(sub3(s, rv)) + cb), rho = rhoAll.filter((_, i) => used[i]);
          let fix = { ok: false, x: [0, 0, 0], b: 0, Q: null }, mcRms = NaN;
          if (sats.length >= (solveB.value ? 4 : 3)) {
            fix = solveFix(M, sats, rho, [0, 0, 0], solveB.value);
            let ss = 0, n = 0;
            for (const z of NOISE.slice(0, 200)) { const f = solveFix(M, sats, rho.map((p, i) => p + sig * z[i % 5]), fix.x, solveB.value); if (f.ok) { ss += norm3(sub3(f.x, fix.x)) ** 2; n++; } }
            mcRms = Math.sqrt(ss / Math.max(1, n)) * 1000;
          }
          let dop = null;
          if (fix.ok && fix.Q && solveB.value) {
            const Q = fix.Q, Rm = [F.e, F.n, F.u], Qp = [0, 1, 2].map((i) => [0, 1, 2].map((j) => Q[i][j]));
            const Qe = M.matMul(M.matMul(Rm, Qp), M.transpose(Rm));
            dop = { P: Math.sqrt(Qe[0][0] + Qe[1][1] + Qe[2][2]), H: Math.sqrt(Qe[0][0] + Qe[1][1]), V: Math.sqrt(Qe[2][2]), T: Math.sqrt(Q[3][3]) };
          }
          return { is3, all, rv, rhoAll, els, used, fix, cb, sig, dop, mcRms, up };
        }
        v.render(() => {
          sync();
          const R = (last = compute());
          if (!R.is3) {
            R.sats.forEach((s, i) => {
              sA.circle(s[0], s[1], R.rho[i], { color: COLS[i], width: 1.2, dash: [5, 4], alpha: 0.75 });
              if (solveB.value) sA.circle(s[0], s[1], Math.max(0, R.rho[i] - R.fix.b), { color: COLS[i], width: 2 });
            });
            if (R.fix.ok) { const [x, y] = R.fix.x; sA.line(x - 0.5, y, x + 0.5, y, { color: 'red', width: 2.4 }); sA.line(x, y - 0.5, x, y + 0.5, { color: 'red', width: 2.4 }); }
            sA.corner('km', 'bl', { size: 11 });
            // error cloud (metres)
            const Q = R.fix.Q, sg = R.sig * 1000;
            let ax = [1, 1], th = 0;
            if (Q) { const a = Q[0][0], b = Q[0][1], d = Q[1][1], tr = (a + d) / 2, disc = Math.sqrt(((a - d) / 2) ** 2 + b * b); ax = [Math.sqrt(Math.max(0, tr + disc)), Math.sqrt(Math.max(0, tr - disc))]; th = 0.5 * Math.atan2(2 * b, a - d); }
            const k95 = Math.sqrt(5.991), half = Math.max(1e-9, 1.25 * k95 * sg * ax[0]);
            sB.setView([-half, half], [-half, half]);
            const ring = [50, 100, 200, 250, 500, 1000, 2000, 5000].find((st) => half / st <= 3.2) || 10000;
            for (let r = ring; r < half * 1.42; r += ring) { sB.circle(0, 0, r, { color: 'grid', width: 1 }); sB.text(`${r} m`, r * 0.7071, r * 0.7071, { size: 10, color: 'muted' }); }
            sB.line(-half, 0, half, 0, { color: 'grid', width: 1 }); sB.line(0, -half, 0, half, { color: 'grid', width: 1 });
            sB.dots(R.mc.map((e) => [e[0] * 1000, e[1] * 1000]), { r: 2, color: 'gold' });
            if (Q) { const pts = []; for (let i = 0; i <= 72; i++) { const t = (i / 72) * 2 * Math.PI, u = k95 * sg * ax[0] * Math.cos(t), w = k95 * sg * ax[1] * Math.sin(t); pts.push([u * Math.cos(th) - w * Math.sin(th), u * Math.sin(th) + w * Math.cos(th)]); } sB.path(pts, { color: 'accent', width: 2.2, close: true }); }
            const bias = [(R.fix.x[0] - R.r[0]) * 1000, (R.fix.x[1] - R.r[1]) * 1000];
            if (Math.hypot(...bias) > 0.02 * half) { sB.arrow(0, 0, clamp(bias[0], -half * 0.95, half * 0.95), clamp(bias[1], -half * 0.95, half * 0.95), { color: 'red', width: 2, head: 7 }); }
            sB.corner(`300 noisy fixes, σ = ${R.sig * 1000 >= 10 ? Math.round(R.sig * 1000) : (R.sig * 1000).toFixed(1)} m`, 'tl', { size: 11.5, color: 'ink', weight: 600 });
            v.legend([['accent', 'predicted 95% ellipse σ²(HᵀH)⁻¹'], ['gold', 'least-squares fixes', { dot: true }], ['red', 'fix (+) and its offset from the receiver']]);
            return;
          }
          // ---- 3D
          G.draw();
          R.all.forEach((s, i) => {
            const sp = [S3[i].lon, S3[i].lat];
            S3[i].color = R.used[i] ? COLS[i] : 'muted';
            if (!R.used[i]) return;
            const ring = (rho) => { const c = (RE * RE + RS * RS - rho * rho) / (2 * RE * RS); return c > -1 && c < 1 ? Math.acos(c) * R2D : null; };
            const g1 = ring(R.rhoAll[i]); if (g1) G.smallCircle(sp, g1, { color: COLS[i], width: 1.2, dash: [5, 4], alpha: 0.8 });
            if (solveB.value && R.fix.ok) { const g2 = ring(R.rhoAll[i] - R.fix.b); if (g2) G.smallCircle(sp, g2, { color: COLS[i], width: 2 }); }
          });
          if (R.fix.ok) { const ll = ecefToGeodS(R.fix.x); G.dot(ll, { r: 5, color: 'red' }); }
          // sky plot
          sB.setView([-1.2, 1.2], [-1.2, 1.2]);
          for (const el of [0, 30, 60]) sB.circle(0, 0, (90 - el) / 90, { color: el ? 'grid' : 'faint', width: 1 });
          sB.circle(0, 0, 80 / 90, { color: 'red', width: 1, dash: [4, 4], alpha: 0.7 });
          for (const [lab, a] of [['N', 0], ['E', 90], ['S', 180], ['W', 270]]) sB.text(lab, 1.09 * Math.sin(a * D2R), 1.09 * Math.cos(a * D2R), { size: 11.5, color: 'muted', align: 'center', weight: 600 });
          sB.text('30°', 0.02, 2 / 3 + 0.02, { size: 10, color: 'muted' }); sB.text('60°', 0.02, 1 / 3 + 0.02, { size: 10, color: 'muted' });
          R.els.forEach((e, i) => {
            if (e.el < -5) return;
            const r = (90 - Math.max(e.el, 0)) / 90, x = r * Math.sin(e.az), y = r * Math.cos(e.az);
            sB.dot(x, y, { r: 7, color: R.used[i] ? COLS[i] : 'muted', hollow: !R.used[i] });
            sB.text(`S${i + 1}`, x, y, { size: 11, dx: 10, color: R.used[i] ? COLS[i] : 'muted', weight: 600 });
          });
          sB.corner(R.dop ? `PDOP ${R.dop.P.toFixed(2)} · HDOP ${R.dop.H.toFixed(2)} · VDOP ${R.dop.V.toFixed(2)}` : 'no fix', 'tl', { size: 11.5, color: 'ink', weight: 600 });
          sB.corner('sky plot · 10° mask', 'bl', { size: 10.5 });
          v.legend([['muted', 'raw pseudorange sphere ∩ Earth', { dash: true }], ['accent', 'after solving for the clock'], ['red', 'least-squares fix', { dot: true }]]);
        });
        v.readout(() => {
          const R = last || compute();
          if (!R.is3) {
            if (!R.fix.ok) return 'The beacons are degenerate; move them apart.';
            const err = Math.hypot(R.fix.x[0] - R.r[0], R.fix.x[1] - R.r[1]) * 1000, Q = R.fix.Q;
            const hd = Q ? Math.sqrt(Q[0][0] + Q[1][1]) : NaN;
            return `Fix error **${err < 1 ? err.toFixed(2) : comma(err, 0)} m**` + (solveB.value ? `; solved clock term ${R.fix.b.toFixed(3)} km (true ${cb2.value.toFixed(3)} km). HDOP ${hd.toFixed(2)}${Q ? `, TDOP ${Math.sqrt(Q[2][2]).toFixed(2)}` : ''}: ${R.inside} of ${R.mc.length} noisy fixes (${(100 * R.inside / Math.max(1, R.mc.length)).toFixed(1)}%) lie inside the predicted 95% ellipse.` : ` — the clock error was ignored, so every circle is ${cb2.value.toFixed(2)} km too big and least squares settles on the wrong point.`);
          }
          const n = R.used.filter(Boolean).length;
          if (!R.fix.ok) return `Only ${n} satellite${n === 1 ? '' : 's'} above the 10° mask: no fix (need ${solveB.value ? 4 : 3}).`;
          const e = sub3(R.fix.x, R.rv), F = enu([R3.lon, R3.lat]), en = [dot3(e, F.e), dot3(e, F.n), dot3(e, F.u)].map((x) => x * 1000);
          const err = Math.hypot(...en);
          return `${n} satellites in view. Fix error **${err < 1 ? err.toFixed(3) : comma(err, 0)} m** (E ${en[0].toFixed(1)}, N ${en[1].toFixed(1)}, U ${en[2].toFixed(1)} m)` + (solveB.value && R.dop ? `; clock solved: $c\\,\\delta t = ${tc(R.fix.b, 2)}$ km ($\\delta t = ${(R.fix.b / C_KM_MS).toFixed(4)}$ ms). With $\\sigma = ${sg3.value.toFixed(1)}$ m: predicted 3D error $\\sigma\\cdot$PDOP $= ${(sg3.value * R.dop.P).toFixed(1)}$ m, measured RMS of 200 noisy fixes ${R.mcRms.toFixed(1)} m; TDOP ${R.dop.T.toFixed(2)}.` : ` — the ${comma(Math.abs(R.cb), 0)} km clock error was not solved for.`);
        });
      },
    },
  ],
};
