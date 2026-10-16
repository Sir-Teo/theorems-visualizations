// Geography & Cartography — Chapter 4: Cylindrical projections
import { D2R, R2D, R_MEAN, WGS84, vec, lonlat, cross3, unit3, angle3, comma } from './ch01.shared.js';

const PI = Math.PI;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mod = (a, n) => ((a % n) + n) % n;
/** Mercator ordinate (isometric latitude) of φ in radians, and its inverse. */
const merc = (f) => Math.log(Math.tan(PI / 4 + f / 2));
const imerc = (y) => Math.atan(Math.sinh(y));
/** sec for degrees. */
const secd = (d) => 1 / Math.cos(d * D2R);
const E_WGS = Math.sqrt(WGS84.e2);

// ---------------------------------------------------------------- world land in (λ, φ) radians, cut at the antimeridian
let LANDC = null;
/** Natural Earth land clipped to the plate carrée frame (radians): {fills: rings, lines: polylines}. Cached. */
function landRad(v) {
  if (LANDC) return LANDC;
  const P = v.geo('projection', 'equirectangular', { center: [0, 0] }), fills = [], lines = [];
  for (const poly of v.geo('land')) { fills.push(...P.clipPolygon(poly.rings)); for (const r of poly.rings) lines.push(...P.clipLine(r, true)); }
  return (LANDC = { fills, lines });
}
/**
 * Base map of a cylindrical projection x = X(λ), y = Y(φ) (radians) on a plain stage: ocean, graticule, land, frame.
 * o = {lat: drawn latitude limit (deg), step: meridian step, pstep: parallel step, land: true, ocean: true}.
 */
function cylBase(s, v, X, Y, o = {}) {
  const lat = o.lat ?? 90, fl = lat * D2R, Yc = (f) => Y(clamp(f, -fl, fl));
  const x0 = X(-PI), x1 = X(PI), y0 = Yc(-fl), y1 = Yc(fl);
  if (o.ocean !== false) s.rect(x0, y0, x1, y1, { fill: 'blue', fillAlpha: 0.07, stroke: false });
  const g = [], step = o.step ?? 30, ps = o.pstep ?? step;
  for (let l = -180 + step; l < 180 - 1e-9; l += step) g.push([X(l * D2R), y0], [X(l * D2R), y1], null);
  for (let f = ps; f < lat - 1e-9; f += ps) for (const sg of [1, -1]) g.push([x0, Y(sg * f * D2R)], [x1, Y(sg * f * D2R)], null);
  s.path(g, { color: 'muted', width: 0.7, alpha: 0.38 });
  s.line(x0, Y(0), x1, Y(0), { color: 'muted', width: 0.9, alpha: 0.5 });
  if (o.land !== false) {
    const L = landRad(v), T = (r) => r.map((p) => [X(p[0]), Yc(p[1])]);
    s.rings(L.fills.map(T), { fill: 'gold', fillAlpha: 0.26, stroke: false });
    const out = []; for (const pl of L.lines) out.push(...T(pl), null);
    s.path(out, { color: 'gold', width: 0.9, alpha: 0.8 });
  }
  s.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], { color: 'faint', width: 1.2, fill: false });
}
/** Axis-aligned ellipse (an indicatrix of a cylindrical map, whose principal directions are east and north). */
function ell(s, cx, cy, rx, ry, col, alpha = 0.26) {
  const p = []; for (let i = 0; i <= 48; i++) { const t = (2 * PI * i) / 48; p.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]); }
  s.path(p, { close: true, fill: col, fillAlpha: alpha, color: col, width: 0.9 });
}
/** Maximum angular distortion ω (deg) from the two principal scales. */
const omega = (h, k) => 2 * Math.asin(Math.abs(h - k) / (h + k)) * R2D;
/** Plane polygon area (shoelace). */
function shoelace(pts) { let s = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) s += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]; return Math.abs(s / 2); }
/** Map-plane area of a ring of [lon, lat] under project(), or null if a vertex is clipped or the ring jumps a seam. */
function mapArea(project, ring) {
  const pts = []; let prev = null;
  for (const p of ring) { const q = project(p[0], p[1]); if (!q) return null; if (prev && Math.hypot(q[0] - prev[0], q[1] - prev[1]) > 0.8) return null; pts.push(q); prev = q; }
  return shoelace(pts);
}
/** Even–odd point-in-polygon test in the (lon, lat) plane. */
function inRing(ring, x, y) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
}
/** Area-weighted centre of a ring that does not cross the antimeridian (0.5° grid, cos φ weights), as a unit vector. */
function areaCentroid(ring) {
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]); let S = [0, 0, 0];
  for (let f = Math.min(...ys) + 0.25; f < Math.max(...ys); f += 0.5) for (let l = Math.min(...xs) + 0.25; l < Math.max(...xs); l += 0.5) if (inRing(ring, l, f)) { const w = vec([l, f]), c = Math.cos(f * D2R); S = [S[0] + w[0] * c, S[1] + w[1] * c, S[2] + w[2] * c]; }
  return unit3(S);
}
const ringCentroid = (ring) => unit3(ring.map(vec).reduce((s, q) => [s[0] + q[0], s[1] + q[1], s[2] + q[2]], [0, 0, 0]));
/** Rotate rings rigidly on the sphere so that the unit vector c0 moves to the point t ([lon, lat]). */
function moveRings(v, rings, c0, t) {
  const tv = vec(t), ang = angle3(c0, tv) * R2D; if (ang < 1e-6) return rings;
  return v.geo('rotate', rings, lonlat(unit3(cross3(c0, tv))), ang);
}

// ---------------------------------------------------------------- UTM (Krüger series to n⁴, Karney 2011), WGS84
const KR = (() => {
  const a = WGS84.a, f = WGS84.f, n = f / (2 - f), n2 = n * n, n3 = n2 * n, n4 = n3 * n;
  return {
    a, n, A: (a / (1 + n)) * (1 + n2 / 4 + n4 / 64),
    al: [n / 2 - (2 * n2) / 3 + (5 * n3) / 16 + (41 * n4) / 180, (13 * n2) / 48 - (3 * n3) / 5 + (557 * n4) / 1440, (61 * n3) / 240 - (103 * n4) / 140, (49561 * n4) / 161280],
  };
})();
/** Transverse Mercator on WGS84: {E, N (m, UTM false origin), k (point scale)} for central meridian lon0 (deg). */
function utmXY(lat, lon, lon0, k0 = 0.9996) {
  const { a, n, A, al } = KR, f = lat * D2R, dl = (lon - lon0) * D2R, c = (2 * Math.sqrt(n)) / (1 + n);
  const t = Math.sinh(Math.atanh(Math.sin(f)) - c * Math.atanh(c * Math.sin(f)));
  const xi = Math.atan2(t, Math.cos(dl)), eta = Math.atanh(Math.sin(dl) / Math.sqrt(1 + t * t));
  let E = eta, N = xi, sig = 1, tau = 0;
  for (let j = 1; j <= 4; j++) {
    const q = al[j - 1], c2 = Math.cos(2 * j * xi), s2 = Math.sin(2 * j * xi), ch = Math.cosh(2 * j * eta), sh = Math.sinh(2 * j * eta);
    E += q * c2 * sh; N += q * s2 * ch; sig += 2 * j * q * c2 * ch; tau += 2 * j * q * s2 * sh;
  }
  const k = ((k0 * A) / a) * Math.sqrt(((1 + (((1 - n) / (1 + n)) * Math.tan(f)) ** 2) * (sig * sig + tau * tau)) / (t * t + Math.cos(dl) ** 2));
  return { E: 500000 + k0 * A * E, N: (lat < 0 ? 1e7 : 0) + k0 * A * N, k };
}
/** UTM zone number of a point, with the Norway and Svalbard exceptions. */
function utmZone(lat, lon) {
  lon = mod(lon + 180, 360) - 180;
  if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) return 32;
  if (lat >= 72 && lat < 84 && lon >= 0 && lon < 42) return lon < 9 ? 31 : lon < 21 ? 33 : lon < 33 ? 35 : 37;
  return Math.min(60, Math.floor((lon + 180) / 6) + 1);
}
const zoneCM = (z) => -183 + 6 * z;

// ---------------------------------------------------------------- ellipsoidal Mercator (WGS84)
const psiS = (f) => Math.atanh(Math.sin(f));                                  // sphere
const psiE = (f) => Math.atanh(Math.sin(f)) - E_WGS * Math.atanh(E_WGS * Math.sin(f)); // ellipsoid (isometric latitude)
/** Meridian arc length (m) on WGS84 from φ1 to φ2 (radians), by Simpson's rule. */
function meridArc(f1, f2) {
  const n = 16, h = (f2 - f1) / n, Mf = (f) => (WGS84.a * (1 - WGS84.e2)) / Math.pow(1 - WGS84.e2 * Math.sin(f) ** 2, 1.5);
  let s = Mf(f1) + Mf(f2); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * Mf(f1 + i * h);
  return (s * h) / 3;
}
/** Latitude whose ellipsoidal isometric latitude equals y (Newton). */
function invPsiE(y) {
  let f = imerc(y);
  for (let i = 0; i < 30; i++) { const s = Math.sin(f), d = (psiE(f) - y) / ((1 - WGS84.e2) / ((1 - WGS84.e2 * s * s) * Math.cos(f))); f -= d; if (Math.abs(d) < 1e-14) break; }
  return f;
}

export default {
  collection: 'geog',
  chapter: 4,
  title: 'Cylindrical projections',
  summary: String.raw`Wrap a cylinder around the globe, unroll it, and the meridians become equally spaced vertical lines: every cylindrical map is $x = \lambda$, $y = g(\varphi)$, and the whole art is the choice of $g$. Spacing the parallels evenly gives the plate carrée; stretching them by exactly $\sec\varphi$ — the integral that Edward Wright summed by hand in 1599 — gives Mercator's conformal chart, on which every rhumb line is straight and Greenland looks as big as Africa. Archimedes' hat-box theorem gives the opposite choice, Lambert's equal-area cylinder, whose rescalings (Behrmann, Gall–Peters) started a public row about what a world map should show. Turning the cylinder sideways gives the transverse Mercator behind the UTM grid, and the web runs on a spherical shortcut of Mercator cut off at 85.05°.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Model',
      name: 'Equirectangular projection (plate carrée)',
      credit: 'Marinus of Tyre, c. AD 100 (as reported by Ptolemy)',
      statement: String.raw`The **equirectangular** (equidistant cylindrical) projection with standard parallels $\pm\varphi_1$ maps a point of the sphere of radius $R$ to
$$x = R\,\lambda\cos\varphi_1,\qquad y = R\,\varphi .$$
With $\varphi_1 = 0$ it is the **plate carrée**, $x = R\lambda$, $y = R\varphi$: longitude and latitude used directly as plane coordinates. Its scale factors are
$$h = 1 \ \text{(along every meridian)},\qquad k = \frac{\cos\varphi_1}{\cos\varphi}\ \text{(along the parallel of latitude } \varphi),$$
so distances along meridians are true everywhere, the parallels $\pm\varphi_1$ are true to scale, and elsewhere east–west lengths, areas (factor $hk = k$) and angles are distorted, increasingly toward the poles, which become lines as long as the equator. It is neither conformal nor equal-area.`,
      idea: String.raw`A cylindrical map sends meridians to equally spaced verticals, so the only choice is where to put each parallel. Spacing them by their true distance along a meridian, $y = R\varphi$, makes the meridian scale $h = dy/(R\,d\varphi) = 1$. A parallel of latitude $\varphi$ is a circle of length $2\pi R\cos\varphi$ drawn as a segment of length $2\pi R\cos\varphi_1$, giving $k = \cos\varphi_1/\cos\varphi$; the Tissot indicatrix (geog-3.4) is an ellipse with axes $k$ east–west and $1$ north–south. Because $h \ne k$ off the standard parallels the map is not conformal (geog-3.5), and because $hk \ne 1$ it is not equal-area (geog-3.6).`,
      caption: String.raw`Drag $P$, set the standard parallel (or pick Marinus's 36° or Gall's isographic 45°). Indicatrices are green on the true-scale parallels, red where east–west lengths are stretched and blue where they are shrunk. At $P$ the green bar is a 24° stretch of meridian and the red bar 24° of the parallel, with its true length drawn beneath it. Right: the two scale factors against latitude. Switch on the cell shading to see how little of the Earth the polar rows of a lat/lon grid hold.`,
      deps: ['geog-3.4'],
      refs: ['Snyder §12'],
      tags: ['map projections', 'cylindrical'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equirectangular_projection' },
      viz(v) {
        const s = v.stage({ x: [-3.3, 3.3], y: [-1.72, 1.72], equal: true, axes: false, height: 330, weight: 1.45 });
        const g = v.stage({ x: [0, 85], y: [0, 4], axes: 'box', gutter: true, height: 330, xlabel: 'latitude φ (°)', ylabel: 'scale factor', xticks: [0, 15, 30, 45, 60, 75] });
        const sp = v.slider('standard parallel $\\varphi_1$', 0, 60, 0, { step: 0.5, fmt: (x) => x.toFixed(1) + '°' });
        v.select('preset', [{ value: '0', label: 'plate carrée 0°' }, { value: '36', label: 'Marinus 36°' }, { value: '45', label: 'Gall isographic 45°' }], '0', { onChange: (x) => sp.set(+x) });
        const cells = v.toggle('shade 15° cells by true area', false);
        let lon = 30, lat = 55;
        const P = s.handle(lon * D2R, lat * D2R, {
          color: 'accent', label: 'P',
          constrain: (x, y) => { const c = Math.cos(sp.value * D2R); return [clamp(x, -PI * c * 0.95, PI * c * 0.95), clamp(y, -80 * D2R, 80 * D2R)]; },
          onDrag: (h) => { lon = (h.x / Math.cos(sp.value * D2R)) * R2D; lat = h.y * R2D; },
        });
        v.render(() => {
          const c1 = Math.cos(sp.value * D2R), X = (l) => l * c1, Y = (f) => f;
          if (!P.dragging) P.set(lon * D2R * c1, lat * D2R);
          cylBase(s, v, X, Y, { lat: 90, step: 15, pstep: 15 });
          if (cells.value) {
            const eq = Math.sin(15 * D2R);
            for (let f = -90; f < 90; f += 15) {
              const rel = Math.abs(Math.sin((f + 15) * D2R) - Math.sin(f * D2R)) / eq;
              s.rect(X(-PI), f * D2R, X(PI), (f + 15) * D2R, { fill: 'purple', fillAlpha: 0.42 * rel, stroke: false });
              s.text(`${Math.round(rel * 100)}%`, X(-PI) + 0.2 * c1 + 0.06, (f + 7.5) * D2R, { size: 11, color: 'purple', weight: 600, plate: true });
            }
          }
          // standard parallels
          for (const sg of sp.value > 0 ? [1, -1] : [0]) s.hline(sg * sp.value * D2R, { color: 'green', width: 1.6, dash: [6, 4] });
          // indicatrices
          const r0 = 4.2 * D2R;
          for (let f = -75; f <= 75; f += 15) for (let l = -120; l <= 150; l += 30) {
            const k = c1 / Math.cos(f * D2R), col = Math.abs(k - 1) < 0.03 ? 'green' : k > 1 ? 'red' : 'blue';
            ell(s, X(l * D2R), f * D2R, k * r0, r0, col, 0.24);
          }
          // probe bars
          const px = X(lon * D2R), py = lat * D2R, d8 = 12 * D2R, k = c1 / Math.cos(py);
          s.line(px, py - d8, px, py + d8, { color: 'green', width: 4, alpha: 0.9 });
          s.line(px - d8 * c1, py, px + d8 * c1, py, { color: 'red', width: 4, alpha: 0.9 });
          const tl = d8 * Math.cos(py); // half the true length of 16° of this parallel, at nominal scale
          s.line(px - tl, py - 4 * D2R, px + tl, py - 4 * D2R, { color: 'ink', width: 2.4 });
          s.text(`k = ${k.toFixed(2)}`, px + d8 * c1 + 0.06, py + 0.1, { size: 12, color: 'red', weight: 600, align: 'left', plate: true });
          s.corner(sp.value === 0 ? 'Plate carrée' : `Equirectangular, φ₁ = ${sp.value.toFixed(1)}°`, 'tl', { color: 'muted', weight: 600, plate: true });
          // scale plot
          g.hline(1, { color: 'faint', width: 1 });
          g.fn(() => 1, { domain: [0, 85], color: 'green', width: 2.6 });
          g.fn((x) => c1 / Math.cos(x * D2R), { domain: [0, 85], color: 'red', width: 2.6 });
          if (sp.value > 0) g.vline(sp.value, { color: 'green', dash: [4, 4], width: 1.2 });
          g.vline(Math.abs(lat), { color: 'muted', dash: [3, 3] });
          g.dot(Math.abs(lat), 1, { r: 5, color: 'green' }); g.dot(Math.abs(lat), Math.min(k, 3.98), { r: 5, color: 'red' });
          v.legend([['green', 'meridian scale h = 1'], ['red', 'parallel scale k = cos φ₁ / cos φ'], ['blue', 'k < 1 (shrunk)', { area: true }], ['ink', 'true length of the red bar']]);
        });
        v.readout(() => {
          const c1 = Math.cos(sp.value * D2R), f = lat * D2R, k = c1 / Math.cos(f);
          let t = `At $P = (${lat.toFixed(1)}^\\circ, ${lon.toFixed(1)}^\\circ)$: **$h = 1$** — the map distance from $P$ to the equator is ${comma(Math.abs(f) * R_MEAN)} km, exactly the distance along the meridian on a ${comma(R_MEAN)} km sphere. **$k = \\cos\\varphi_1/\\cos\\varphi = ${k.toFixed(3)}$**, so here east–west lengths and areas are multiplied by ${k.toFixed(3)} and angles change by up to $\\omega = ${omega(1, k).toFixed(1)}^\\circ$.`;
          if (cells.value) t += ` Every 15° row has the same height on the map, yet the polar row 75°–90° holds only ${Math.round(((1 - Math.sin(75 * D2R)) / Math.sin(15 * D2R)) * 100)}% of the true area of the equatorial row: a global lat/lon raster spends most of its polar pixels on very little ground.`;
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Mercator projection and the isometric latitude',
      credit: 'G. Mercator, 1569 (map); E. Wright, 1599 (table); H. Bond, c. 1645 (log-tangent rule); J. Gregory, 1668 (proof)',
      statement: String.raw`Among cylindrical maps $x = R\lambda$, $y = R\,g(\varphi)$ with $g$ increasing and $g(0) = 0$, exactly one is **conformal**: the **Mercator projection**, with
$$g(\varphi) = \int_0^\varphi \sec t\,dt = \ln\tan\Big(\frac{\pi}{4} + \frac{\varphi}{2}\Big) = \ln(\sec\varphi + \tan\varphi) = \operatorname{artanh}(\sin\varphi),\qquad |\varphi| < \tfrac{\pi}{2}.$$
The quantity $\psi = g(\varphi)$ is the **isometric latitude**. On this map the scale is $h = k = \sec\varphi$ in every direction at latitude $\varphi$, the area factor is $\sec^2\varphi$, and $y \to \pm\infty$ as $\varphi \to \pm\pi/2$: the poles cannot be shown.`,
      idea: String.raw`On any cylindrical map the parallel of latitude $\varphi$, of true length $2\pi R\cos\varphi$, is drawn with length $2\pi R$, so $k = \sec\varphi$; the meridian scale is $h = g'(\varphi)$. The indicatrix is a circle (geog-3.5) exactly when $h = k$, i.e. $g' = \sec$, and integrating (pma-6.21) with $g(0) = 0$ fixes $g$. Edward Wright found $g$ in 1599 the way the Riemann sum in the picture does: stacking strips of height $\Delta\varphi\cdot\sec\varphi$ (at 10′ steps in 1599, at 1′ steps in his 1610 edition). Henry Bond noticed around 1645 that Wright's numbers matched a table of $\ln\tan(45^\circ + \varphi/2)$, and James Gregory proved it in 1668. Since $\int_0^{\pi/2}\sec t\,dt$ diverges, the map is infinitely tall.`,
      caption: String.raw`Choose the strip height and where the secant is taken, and slide $\varphi$. Left: the strips under $\sec\varphi$; their total area up to $\varphi$ is the height $y$ at which the parallel is drawn. Right: the chart built from that table (to 80°), with the exact Mercator parallels as green ticks on the right edge. Indicatrices turn green when their axes agree to 1% — coarse strips leave them visibly oval, Wright's 1′ steps make the chart conformal to the eye.`,
      deps: ['geog-3.5', 'pma-6.21'],
      see: ['geog-2.1'],
      refs: ['Snyder §7'],
      tags: ['map projections', 'conformal maps', 'Mercator'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Integral_of_the_secant_function', source: 'https://journals.lib.unb.ca/index.php/ihr/article/download/28476/1882521231/1882521479' },
      viz(v) {
        const DEG = { a: 10, b: 5, c: 1, d: 1 / 6, e: 1 / 60 };
        const stepSel = v.select('strip height Δφ', [{ value: 'a', label: '10°' }, { value: 'b', label: '5°' }, { value: 'c', label: '1°' }, { value: 'd', label: '10′ (Wright 1599)' }, { value: 'e', label: '1′ (Wright 1610)' }], 'a');
        const rule = v.select('secant taken at', [{ value: 'R', label: 'top of each strip (Wright)' }, { value: 'M', label: 'middle' }, { value: 'L', label: 'bottom' }], 'R');
        const phi = v.slider('latitude $\\varphi$', 1, 85, 70, { step: 0.5, fmt: (x) => x.toFixed(1) + '°' });
        const sA = v.stage({ x: [0, 85], y: [0, 12], axes: 'box', gutter: true, height: 350, xlabel: 'latitude φ (°)', ylabel: 'sec φ (stretch of the parallel)', xticks: [0, 15, 30, 45, 60, 75] });
        const sB = v.stage({ x: [-3.3, 3.75], y: [-3.15, 3.15], equal: true, axes: false, height: 350, weight: 1.15 });
        let key = '', T = null;
        function table() {
          const d = DEG[stepSel.value], r = rule.value, kk = stepSel.value + r;
          if (kk === key) return T; key = kk;
          const n = Math.ceil(86 / d) + 1, ys = new Float64Array(n + 1);
          for (let i = 1; i <= n; i++) { const a = (i - 1) * d, b = i * d, m = r === 'R' ? b : r === 'L' ? a : (a + b) / 2; ys[i] = ys[i - 1] + (d * D2R) / Math.cos(Math.min(m, 89.9) * D2R); }
          const idx = (f) => Math.min(n - 1, Math.floor(Math.abs(f * R2D) / d + 1e-9));
          return (T = {
            d, ys, n,
            Y: (f) => { const x = Math.abs(f * R2D) / d, i = Math.min(n - 1, Math.floor(x)), t = x - i; return Math.sign(f) * (ys[i] + (ys[i + 1] - ys[i]) * t); },
            slope: (f) => { const i = idx(f); return (ys[i + 1] - ys[i]) / (d * D2R); },
          });
        }
        v.render(() => {
          const Tb = table(), d = Tb.d, r = rule.value, f1 = phi.value;
          // ---- left: strips under sec
          if (d >= 1) {
            for (let a = 0; a < 80 - 1e-9; a += d) {
              const b = a + d, m = r === 'R' ? a + d : r === 'L' ? a : a + d / 2, hgt = secd(m);
              if (a < f1) sA.rect(a, 0, Math.min(b, f1), Math.min(hgt, 12), { fill: 'accent', fillAlpha: 0.32, color: 'accent', width: 0.8 });
              if (b > f1) sA.rect(Math.max(a, f1), 0, b, Math.min(hgt, 12), { fill: false, color: 'accent', width: 0.6, alpha: 0.35 });
            }
          } else sA.fn((x) => secd(x), { domain: [0, f1], fill: 'accent', fillAlpha: 0.32, color: 'accent', width: 0.6 });
          sA.fn((x) => secd(x), { domain: [0, 85], color: 'ink', width: 2.2 });
          sA.vline(f1, { color: 'accent', width: 1.4, dash: [5, 4] });
          sA.text(`strip area to ${f1.toFixed(1)}° = ${Tb.Y(f1 * D2R).toFixed(4)}`, 3, 10.9, { size: 12.5, color: 'accent', weight: 600, align: 'left', plate: true });
          sA.text(`exact ln tan(45° + φ/2) = ${merc(f1 * D2R).toFixed(4)}`, 3, 9.6, { size: 12.5, color: 'green', weight: 600, align: 'left', plate: true });
          // ---- right: the chart built from the table
          const X = (l) => l, Y = Tb.Y;
          cylBase(sB, v, X, Y, { lat: 80, step: 30, pstep: 10 });
          for (let f = 10; f <= 80; f += 10) for (const sg of [1, -1]) {
            const ye = merc(sg * f * D2R), yt = Y(sg * f * D2R);
            sB.line(PI + 0.06, ye, PI + 0.34, ye, { color: 'green', width: 2.2 });
            if (Math.abs(ye - yt) > 0.004) sB.line(PI, yt, PI + 0.06, ye, { color: 'red', width: 1.2 });
          }
          sB.text('exact', PI + 0.2, merc(80 * D2R) + 0.17, { size: 11, color: 'green', weight: 600 });
          const r0 = 3.6 * D2R;
          for (let f = -75; f <= 75; f += 15) for (let l = -157.5; l < 180; l += 45) {
            const k = 1 / Math.cos(f * D2R), h = Tb.slope(f * D2R), good = Math.abs(h / k - 1) < 0.01;
            ell(sB, l * D2R, Y(f * D2R), k * r0, h * r0, good ? 'green' : 'orange', 0.28);
          }
          for (const sg of [1, -1]) sB.line(-PI, Y(sg * f1 * D2R), PI, Y(sg * f1 * D2R), { color: 'accent', width: 1.8, alpha: sg > 0 ? 0.95 : 0.35 });
          sB.corner(`chart from the table (Δφ = ${d >= 1 ? d + '°' : Math.round(d * 60) + '′'})`, 'tl', { color: 'muted', weight: 600, plate: true });
          v.legend([['accent', 'strips Δφ · sec φ', { area: true }], ['ink', 'sec φ'], ['green', 'exact Mercator parallels / circular indicatrix'], ['orange', 'indicatrix off by > 1%', { area: true }]]);
        });
        v.readout(() => {
          const Tb = table(), f = phi.value * D2R, MP = 10800 / PI;
          const sum = Tb.Y(f) * MP, ex = merc(f) * MP;
          let worst = 0; for (let a = 0; a < 80; a += 0.25) { const q = a * D2R; worst = Math.max(worst, Math.abs(Tb.slope(q) * Math.cos(q) - 1)); }
          return `Meridional parts (minutes of equator) at $\\varphi = ${phi.value.toFixed(1)}^\\circ$: the strip sum gives **${comma(sum, 1)}′**, the exact value $\\tfrac{10800}{\\pi}\\ln\\tan(45^\\circ + \\varphi/2)$ is **${comma(ex, 1)}′**, an error of ${v.fix(sum - ex, 2)}′ (${v.fix(((sum - ex) / ex) * 100, 3)}%). Largest conformality defect $|h/k - 1|$ on this chart up to 80°: **${(worst * 100).toFixed(2)}%**. (Marguet, 1930, put the error of Wright's printed 1′ table at only 0.8′ in 5966′ at 70°.) The poles never arrive: $y(89^\\circ) = ${merc(89 * D2R).toFixed(2)}$, $y(89.99^\\circ) = ${merc(89.99 * D2R).toFixed(2)}$, $\\to\\infty$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Proposition',
      name: 'Mercator maps rhumb lines to straight lines',
      credit: 'P. Nunes, 1537 (rhumb lines); G. Mercator, 1569',
      statement: String.raw`On the Mercator projection every rhumb line (loxodrome, geog-2.1) — a course that crosses every meridian at the same bearing $\beta$ — is mapped to a straight line making the angle $\beta$ with the vertical meridians. Conversely every straight segment on the map is a rhumb line on the sphere. Explicitly, a loxodrome through $(\varphi_0, \lambda_0)$ with bearing $\beta \neq 90^\circ, 270^\circ$ satisfies
$$\lambda - \lambda_0 = \tan\beta\,\big(\psi(\varphi) - \psi(\varphi_0)\big),\qquad \psi = \ln\tan\Big(\frac{\pi}{4} + \frac{\varphi}{2}\Big),$$
a linear relation between the map coordinates $x = \lambda$ and $y = \psi$. Its length from $\varphi_0$ to $\varphi$ is $R\,|\varphi - \varphi_0|/|\cos\beta|$. No other cylindrical map has this property.`,
      idea: String.raw`Along a course of bearing $\beta$, a step $ds$ moves $R\,d\varphi = ds\cos\beta$ north and $R\cos\varphi\,d\lambda = ds\sin\beta$ east, so $d\lambda = \tan\beta\,\sec\varphi\,d\varphi = \tan\beta\,d\psi$: in Mercator coordinates the slope $dx/dy$ is the constant $\tan\beta$. Equivalently, the map is conformal (geog-4.2), so it keeps the angle between the course and each meridian, and the meridians are parallel straight lines; a curve meeting a family of parallel lines at a constant angle is straight. On a non-conformal cylinder (plate carrée) the angle is distorted by different amounts at different latitudes, and the same course bends. This is why Mercator titled his 1569 chart *ad usum navigantium*: a navigator rules a line from port to port and reads off the compass course.`,
      caption: String.raw`Drag the port (Lisbon) on either map and set the compass bearing and distance sailed. The blue course is computed on the sphere; the dashed green arc is the great circle to the same landfall. Below, the angle between the course and the meridians, measured on the globe and on the right-hand map, along the whole voyage. On Mercator the map angle is flat at $\beta$; switch to the plate carrée and it wanders.`,
      deps: ['geog-4.2', 'geog-2.1'],
      see: ['geog-2.2'],
      refs: ['Snyder §7'],
      tags: ['map projections', 'navigation', 'Mercator'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rhumb_line' },
      viz(v) {
        const pj = v.select('right-hand map', [{ value: 'mercator', label: 'Mercator' }, { value: 'equirectangular', label: 'Plate carrée' }], 'mercator');
        const brg = v.slider('compass bearing $\\beta$', 0, 359, 75, { step: 1, int: true, fmt: (x) => x + '°' });
        const len = v.slider('distance sailed', 1000, 30000, 12000, { step: 100, fmt: (x) => comma(x) + ' km' });
        const sA = v.stage({ height: 330, weight: 0.85 }), sB = v.stage({ height: 330, weight: 1.35 });
        const sC = v.stage({ x: [0, 12000], y: [0, 180], axes: 'box', gutter: true, height: 190, full: true, xlabel: 'distance sailed along the course (km)', ylabel: 'angle with the meridians (°)', yticks: [0, 45, 90, 135, 180] });
        const G1 = v.globe(sA, { projection: 'orthographic', center: [45, 42], graticule: 15 });
        const G2 = v.globe(sB, { projection: 'mercator', center: [0, 0], graticule: 15 });
        const A = G1.handle(-9.14, 38.71, { label: 'Lisbon', color: 'accent' }); G2.handle(A);
        let last = 'mercator';
        function course() {
          const b = brg.value * D2R, cb = Math.cos(b), sb = Math.sin(b), f0 = A.lat * D2R, l0 = A.lon * D2R, L = len.value / R_MEAN, out = [], lim = 89.4 * D2R, n = 500;
          for (let i = 0; i <= n; i++) {
            const t = (L * i) / n, f = f0 + t * cb; if (Math.abs(f) > lim) break;
            const l = Math.abs(cb) > 1e-9 ? l0 + Math.tan(b) * (merc(f) - merc(f0)) : l0 + (t * sb) / Math.cos(f0);
            out.push([mod(l * R2D + 180, 360) - 180, f * R2D, t * R_MEAN]);
          }
          return out;
        }
        function angles(Cs, project) { // angle between the course and the local meridian, measured on the map
          const out = [];
          for (let i = 0; i + 1 < Cs.length; i++) {
            const p = Cs[i], q = Cs[i + 1], P0 = project(p[0], p[1]), Q0 = project(q[0], q[1]), N0 = project(p[0], Math.min(89.9, p[1] + 0.01));
            if (!P0 || !Q0 || !N0 || Math.hypot(Q0[0] - P0[0], Q0[1] - P0[1]) > 0.5) { out.push(null); continue; }
            const u = [Q0[0] - P0[0], Q0[1] - P0[1]], w = [N0[0] - P0[0], N0[1] - P0[1]];
            const a = Math.acos(clamp((u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w)), -1, 1)) * R2D;
            out.push([(p[2] + q[2]) / 2, a, Math.atan2(u[0], u[1]) * R2D]);
          }
          return out;
        }
        v.render(() => {
          if (pj.value !== last) { last = pj.value; G2.set({ projection: pj.value }); }
          const Cs = course(), end = Cs[Cs.length - 1], ll = Cs.map((p) => [p[0], p[1]]);
          for (const G of [G1, G2]) {
            G.draw();
            if (Cs.length > 1) {
              G.greatCircle(A, [end[0], end[1]], { color: 'green', width: 1.8, dash: [6, 4] });
              G.path(ll, { geodesic: false, color: 'accent', width: 2.8 });
              G.dot([end[0], end[1]], { r: 5, color: 'accent' });
            }
          }
          sB.corner(pj.value === 'mercator' ? 'Mercator: the course is straight' : 'Plate carrée: the course bends', 'tl', { color: pj.value === 'mercator' ? 'green' : 'red', weight: 600, plate: true });
          sA.corner('the globe', 'tl', { color: 'muted', weight: 600 });
          // angle along the course
          sC.setView([0, len.value], [0, 180]);
          const expect = Math.min(brg.value, 360 - brg.value);
          sC.hline(expect, { color: 'faint', width: 6, alpha: 0.6 });
          const onGlobe = [];
          for (let i = 0; i + 1 < Cs.length; i++) { const b = v.geo('bearing', [Cs[i][0], Cs[i][1]], [Cs[i + 1][0], Cs[i + 1][1]]); onGlobe.push([(Cs[i][2] + Cs[i + 1][2]) / 2, Math.min(b, 360 - b)]); }
          const onMap = angles(Cs, (l, f) => G2.project(l, f));
          sC.path(onGlobe, { color: 'accent', width: 2.2, dash: [7, 5] });
          sC.path(onMap.map((q) => (q ? [q[0], q[1]] : null)), { color: pj.value === 'mercator' ? 'green' : 'red', width: 2.6 });
          if (end[2] < len.value - 1) sC.vline(end[2], { color: 'muted', dash: [3, 3] });
          v.legend([['accent', 'rhumb line (on the globe: bearing β)'], ['green', 'great circle to the same landfall', { dash: true }], [pj.value === 'mercator' ? 'green' : 'red', 'angle measured on the map'], ['accent', 'angle measured on the globe', { dash: true }]]);
        });
        v.readout(() => {
          const Cs = course(); if (Cs.length < 3) return 'Sail a little further.';
          const end = Cs[Cs.length - 1], onMap = angles(Cs, (l, f) => G2.project(l, f)).filter(Boolean);
          const mins = Math.min(...onMap.map((q) => q[1])), maxs = Math.max(...onMap.map((q) => q[1]));
          const dirs = onMap.map((q) => q[2]); let turn = 0; for (let i = 1; i < dirs.length; i++) { let d = Math.abs(dirs[i] - dirs[i - 1]); if (d > 180) d = 360 - d; turn += d; }
          const gc = v.geo('haversine', [A.lon, A.lat], [end[0], end[1]]), rl = end[2];
          const b = brg.value, expect = Math.min(b, 360 - b), merc_ = pj.value === 'mercator';
          const stop = end[2] < len.value - 1 ? ` The course reaches ${end[1] > 0 ? '89.4°N' : '89.4°S'} after ${comma(end[2])} km and would spiral into the pole after ${comma((Math.abs((end[1] > 0 ? 90 : -90) - A.lat) * D2R * R_MEAN) / Math.abs(Math.cos(b * D2R)))} km.` : '';
          return `On the globe the course meets every meridian at **${expect}°**. On the ${merc_ ? 'Mercator' : 'plate carrée'} map its image meets the meridians at **${mins.toFixed(2)}° to ${maxs.toFixed(2)}°** and its direction turns through **${turn.toFixed(2)}°** in all — ${turn < 0.05 ? 'a straight line' : 'a curve'}. Rhumb line ${comma(rl)} km; the great circle to the same landfall is ${comma(gc)} km (${v.fix((1 - gc / rl) * 100, 1)}% shorter).${stop}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Paradox',
      name: 'Greenland versus Africa on Mercator',
      statement: String.raw`On a Mercator world map Greenland looks about as large as Africa, yet Africa's area (about 30.4 million km²) is roughly **14 times** Greenland's (about 2.17 million km²). The illusion is exact geometry: Mercator multiplies areas near latitude $\varphi$ by $\sec^2\varphi$, which stays below about 1.6 over nearly all of Africa (35° S to 37° N) but runs from 4 at Greenland's southern tip (60° N) to over 60 on its north coast (83.6° N). Moving Greenland rigidly to the equator on the globe and redrawing it shows its true size relative to Africa.`,
      idea: String.raw`Mercator is conformal with scale $\sec\varphi$ in every direction (geog-4.2), so a small region at latitude $\varphi$ is drawn similar to itself but enlarged linearly by $\sec\varphi$ and in area by $\sec^2\varphi$. Africa straddles the equator, where $\sec^2\varphi \approx 1$ to $1.5$; the centre of Greenland's area is near 73° N, where $\sec^2 73^\circ \approx 11.8$. A tenfold-plus enlargement of something 14 times smaller makes the two look comparable. Shapes are right locally, sizes are not — the trade-off forced by geog-3.7.`,
      caption: String.raw`Drag the blue copy of Greenland anywhere (or use the buttons). It is moved rigidly on the sphere, so its true area never changes; watch its size on the map shrink as it nears the equator. The corner shows the apparent Greenland : Africa ratio on the map; the right panel plots the area factor $\sec^2\varphi$, with each outline's measured map-to-true ratio as a dot. Switch to Mollweide (equal-area) to see the true proportion everywhere.`,
      deps: ['geog-4.2'],
      see: ['geog-3.6'],
      refs: ['Snyder §7'],
      tags: ['map projections', 'area', 'Mercator'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mercator_projection' },
      viz(v) {
        const pj = v.select('map', [{ value: 'mercator', label: 'Mercator' }, { value: 'mollweide', label: 'Mollweide (equal-area)' }], 'mercator');
        const sA = v.stage({ height: 420, weight: 1.5 });
        const sB = v.stage({ x: [0, 85], y: [0.7, 150], ylog: true, axes: 'box', gutter: true, height: 420, xlabel: 'latitude of the outline’s centre (°)', ylabel: 'area on the map ÷ true area' });
        const G = v.globe(sA, { projection: 'mercator', center: [-10, 0], graticule: 15, drag: false });
        const GR = v.geo('landmass', 'Greenland'), AF = v.geo('landmass', 'Africa'), C0 = areaCentroid(GR[0]), home = lonlat(C0);
        const CA = lonlat(areaCentroid(AF[0]));
        const H = G.handle(-28, 2, { color: 'accent', r: 5 });
        v.button('Drop it on the equator', () => H.set(-25, 0));
        v.button('Send it home', () => H.set(home[0], home[1]));
        let last = 'mercator';
        const gArea = Math.abs(v.geo('sphericalArea', GR[0])), aArea = Math.abs(v.geo('sphericalArea', AF[0]));
        const ratios = () => {
          const R = moveRings(v, GR, C0, [H.lon, H.lat]), pr = (l, f) => G.project(l, f);
          return { R, g: mapArea(pr, R[0]), a: mapArea(pr, AF[0]), g0: mapArea(pr, GR[0]) };
        };
        v.render(() => {
          if (pj.value !== last) { last = pj.value; G.set({ projection: pj.value }); }
          G.draw();
          G.polygon(AF, { fill: 'orange', fillAlpha: 0.45, color: 'orange', width: 1.6 });
          G.polygon(GR, { color: 'accent', width: 1.4, dash: [4, 3] });
          const r = ratios();
          G.polygon(r.R, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1.8 });
          G.text('Africa', [CA[0] + 4, CA[1] - 6], { size: 13, color: 'orange', weight: 700, plate: true });
          G.text('Greenland (copy)', [H.lon, H.lat], { size: 12.5, color: 'accent', weight: 700, plate: true, align: 'right', dx: -14 });
          if (r.g && r.a) sA.corner(`Greenland : Africa on this map = 1 : ${(r.a / r.g).toFixed(1)}   (true 1 : ${(aArea / gArea).toFixed(1)})`, 'bl', { color: 'ink', weight: 600, plate: true });
          sA.corner(pj.value === 'mercator' ? 'Mercator' : 'Mollweide (equal-area)', 'tl', { color: 'muted', weight: 600, plate: true });
          // area factor
          const mer = pj.value === 'mercator';
          sB.fn((x) => (mer ? secd(x) ** 2 : 1), { domain: [0, 85], color: mer ? 'red' : 'green', width: 2.6 });
          sB.hline(1, { color: 'faint', width: 1 });
          if (r.a) sB.dot(Math.abs(CA[1]), r.a / aArea, { r: 6, color: 'orange', label: 'Africa', labelPos: 'ne', math: false });
          if (r.g0) sB.dot(Math.abs(home[1]), r.g0 / gArea, { r: 6, color: 'accent', hollow: true, label: 'Greenland at home', labelPos: mer ? 'w' : 'n', math: false });
          if (r.g) sB.dot(Math.abs(H.lat), r.g / gArea, { r: 6, color: 'accent', label: Math.abs(H.lat - home[1]) > 4 ? 'copy' : undefined, labelPos: 'se', math: false });
          v.legend([['orange', 'Africa', { area: true }], ['accent', 'Greenland, moved rigidly', { area: true }], ['accent', 'Greenland at home', { dash: true }], [mer ? 'red' : 'green', mer ? 'sec²φ (Mercator)' : '1 (equal-area)']]);
        });
        v.readout(() => {
          const r = ratios(), km = (x) => comma((x * R_MEAN * R_MEAN) / 1e6, 2);
          const head = `True areas of the outlines (Natural Earth 1:110m on a ${comma(R_MEAN)} km sphere): **Greenland ${km(gArea)} million km²**, **Africa ${km(aArea)} million km²** — Africa is **${(aArea / gArea).toFixed(1)}×** larger (published figures 2.166 and 30.37 million km², ratio 14.0).`;
          if (!r.g || !r.a) return head + ' The copy is cut by the map edge; move it.';
          const sec2 = secd(H.lat) ** 2;
          const home_ = r.g0 ? ` At home it looks **${((r.g0 / r.a) * 100).toFixed(0)}%** of Africa.` : '';
          return `${head} On this map the copy covers ${km(r.g)} and Africa ${km(r.a)} million km² at nominal scale, so here Greenland looks **${((r.g / r.a) * 100).toFixed(0)}%** of Africa.${home_} ${pj.value === 'mercator' ? `At the copy's centre ($\\varphi = ${H.lat.toFixed(1)}^\\circ$) Mercator's area factor is $\\sec^2\\varphi = ${sec2.toFixed(2)}$; the outline's measured ratio is ${(r.g / gArea).toFixed(2)} (the area-weighted mean of $\\sec^2\\varphi$ over it).` : 'Equal-area: every outline keeps its true area wherever it is.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Archimedes’ hat-box theorem and Lambert’s cylinder',
      credit: 'Archimedes, On the Sphere and Cylinder, c. 225 BC; J. H. Lambert, 1772 (the map)',
      statement: String.raw`Let a sphere of radius $R$ sit inside the cylinder of radius $R$ that touches it along the equator. For any two horizontal planes at heights $z_1 < z_2$ (with $-R \le z_1 < z_2 \le R$), the zone of the sphere between them has the same area as the band of the cylinder between them:
$$A_{\text{zone}} = 2\pi R\,(z_2 - z_1) = A_{\text{band}}.$$
In particular the whole sphere has area $4\pi R^2$, the lateral area of the cylinder. Consequently **Lambert's cylindrical equal-area projection** — project each point horizontally, away from the axis, onto the cylinder and unroll it:
$$x = R\lambda,\qquad y = R\sin\varphi$$
— maps every region of the sphere to a region of the same area. Its scales are $k = \sec\varphi$ along parallels and $h = \cos\varphi$ along meridians, so $hk = 1$ while shapes are squashed north–south toward the poles.`,
      idea: String.raw`The zone between latitudes $\varphi$ and $\varphi + d\varphi$ is a thin ribbon of radius $R\cos\varphi$ and slant width $R\,d\varphi$, so its area is $2\pi R^2\cos\varphi\,d\varphi$; its height is $dz = R\cos\varphi\,d\varphi$. Thus the zone's area is $2\pi R\,dz$, exactly the area of the cylinder band of the same height: the shrinking circumference and the growing slant cancel. Integrating (pma-10.9) gives the theorem for any zone. For the map this says the Jacobian determinant is $hk = \sec\varphi\cdot\cos\varphi = 1$, the condition of geog-3.6. Archimedes asked for a sphere in a cylinder on his tombstone; Lambert turned the theorem into a map in 1772.`,
      caption: String.raw`Drag the handles $z_1, z_2$ beside the cross-section to choose a slab (the 3D view rotates by dragging). The zone on the sphere (blue) and the band on the cylinder (orange) are shaded, with horizontal projection rays; the section shows why they match — the zone's circumference shrinks by $\cos\varphi$ exactly as its slant width grows by $1/\cos\varphi$. The bars compare the zone's area, integrated numerically, with the band and with the strip on Lambert's map. Switch on the ten slabs of equal height: on the sphere they look very different, yet each covers exactly a tenth of the Earth, and on Lambert's map they are equal strips. Indicatrices all have area 1 but grow flatter toward the poles.`,
      deps: ['geog-3.6', 'pma-10.9'],
      see: ['geog-4.6'],
      refs: ['Snyder §10'],
      tags: ['map projections', 'area', 'equal-area'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/On_the_Sphere_and_Cylinder' },
      viz(v) {
        const s3 = v.stage3d({ range: 1.45, height: 330, yaw: -0.55, pitch: 0.32, persp: 0, minWidth: 300 });
        const sX = v.stage({ x: [-1.3, 1.5], y: [-1.18, 1.18], equal: true, axes: false, height: 330, minWidth: 300 });
        const sB = v.stage({ x: [-3.25, 3.25], y: [-1.1, 1.1], equal: true, axes: false, height: 270, weight: 1.75, minWidth: 500 });
        const sC = v.stage({ x: [0.4, 3.6], y: [0, 4], axes: 'box', gutter: true, height: 270, weight: 0.75, ylabel: 'area (unit sphere)', xticks: [[1, 'zone'], [2, 'band'], [3, 'map']] });
        const slabs = v.toggle('ten slabs of equal height', false);
        const XH = 1.3;
        const H2 = sX.handle(XH, 0.78, { color: 'accent', label: 'z₂', labelPos: 'e', constrain: (x, y) => [XH, clamp(y, -1, 1)] });
        const H1 = sX.handle(XH, 0.36, { color: 'accent', label: 'z₁', labelPos: 'e', constrain: (x, y) => [XH, clamp(y, -1, 1)] });
        const zs = () => [Math.min(H1.y, H2.y), Math.max(H1.y, H2.y)];
        const slabOf = (z) => Math.min(9, Math.floor((z + 1) * 5));
        const zoneArea = (z1, z2) => v.M.integrate((f) => 2 * PI * Math.cos(f), Math.asin(z1), Math.asin(z2), 200);
        let lastEq = null;
        v.render(() => {
          const [z1, z2] = zs(), eq = slabs.value, inZ = (z) => z >= z1 && z <= z2;
          const bands = eq ? Array.from({ length: 10 }, (_, i) => [-1 + i * 0.2, -0.8 + i * 0.2, i % 2 ? 'teal' : 'accent']) : [[z1, z2, 'accent']];
          H1.visible = H2.visible = !eq;
          // ---- 3D
          s3.surface((u, w) => [Math.cos(w) * Math.cos(u), Math.cos(w) * Math.sin(u), Math.sin(w)], [0, 2 * PI], [-PI / 2, PI / 2], {
            nu: 40, nv: 30, alpha: 0.92, colorFn: (u, w) => { const z = Math.sin(w); return eq ? (slabOf(z) % 2 ? 'teal' : 'accent') : inZ(z) ? 'accent' : 'grid'; },
          });
          s3.surface((u, z) => [Math.cos(u), Math.sin(u), z], [0, 2 * PI], [-1, 1], {
            nu: 40, nv: 20, alpha: 0.18, shade: false, colorFn: (u, z) => (eq ? (slabOf(z) % 2 ? 'teal' : 'accent') : inZ(z) ? 'orange' : 'faint'),
          });
          if (!eq) {
            const z = (z1 + z2) / 2, r = Math.sqrt(Math.max(0, 1 - z * z));
            for (let i = 0; i < 5; i++) { const u = -1.02 - 1.1 + 0.55 * i; s3.arrow([r * Math.cos(u), r * Math.sin(u), z], [Math.cos(u), Math.sin(u), z], { color: 'ink', width: 1.3, head: 6, bias: -0.6 }); }
          }
          for (const z of [-1, 1]) s3.curve((t) => [Math.cos(t), Math.sin(t), z], 0, 2 * PI, { color: 'muted', width: 1, n: 60 });
          // ---- cross-section through the axis
          for (const [a, b, col] of bands) {
            sX.rect(-1.25, a, 1.25, b, { fill: col, fillAlpha: eq ? 0.14 : 0.16, stroke: false });
            for (const sg of [1, -1]) {
              const arc = []; for (let i = 0; i <= 30; i++) { const t = Math.asin(a) + ((Math.asin(b) - Math.asin(a)) * i) / 30; arc.push([sg * Math.cos(t), Math.sin(t)]); }
              sX.path(arc, { color: col, width: 4.5 });
              sX.line(sg, a, sg, b, { color: eq ? col : 'orange', width: 4.5 });
            }
          }
          sX.circle(0, 0, 1, { color: 'ink', width: 1.4 });
          for (const sg of [1, -1]) sX.line(sg, -1, sg, 1, { color: 'muted', width: 1.4 });
          sX.line(-1, 1, 1, 1, { color: 'muted', width: 1, dash: [4, 4] }); sX.line(-1, -1, 1, -1, { color: 'muted', width: 1, dash: [4, 4] });
          sX.line(0, -1.02, 0, 1.06, { color: 'faint', width: 1, dash: [3, 3] });
          if (!eq) {
            const zm = (z1 + z2) / 2, fm = Math.asin(zm), cm = Math.cos(fm);
            for (const z of [z1 + 0.15 * (z2 - z1), zm, z2 - 0.15 * (z2 - z1)]) { const c = Math.sqrt(1 - z * z); if (1 - c > 0.06) sX.arrow(c, z, 1, z, { color: 'ink', width: 1.2, head: 6 }); }
            sX.line(0, 0, cm, zm, { color: 'muted', width: 1.2, dash: [4, 3] });
            sX.line(0, zm, cm, zm, { color: 'ink', width: 1.6 });
            sX.tex(String.raw`R\cos\varphi`, cm / 2, zm, { size: 13, dy: -11 });
            const ang = []; for (let i = 0; i <= 16; i++) ang.push([0.22 * Math.cos((fm * i) / 16), 0.22 * Math.sin((fm * i) / 16)]);
            sX.path(ang, { color: 'muted', width: 1.2 }); sX.tex(String.raw`\varphi`, 0.3 * Math.cos(fm / 2), 0.3 * Math.sin(fm / 2), { size: 13, color: 'muted' });
            sX.tex(String.raw`dA = 2\pi R\cos\varphi\cdot R\,d\varphi = 2\pi R\,dz`, 0.1, -1.11, { size: 13 });
          }
          sX.corner('section through the axis', 'tl', { color: 'muted', weight: 600 });
          // ---- Lambert map
          const X = (l) => l, Y = (f) => Math.sin(f);
          cylBase(sB, v, X, Y, { lat: 90, step: 30, pstep: 15 });
          for (const [a, b, col] of bands) { sB.rect(-PI, a, PI, b, { fill: col, fillAlpha: 0.2, stroke: false }); if (!eq) for (const z of [a, b]) sB.line(-PI, z, PI, z, { color: 'accent', width: 1.6 }); }
          const r0 = 4 * D2R;
          for (let f = -75; f <= 75; f += 15) for (let l = -150; l <= 150; l += 30) { const c = Math.cos(f * D2R); ell(sB, l * D2R, Y(f * D2R), r0 / c, r0 * c, 'green', 0.3); }
          sB.corner('Lambert cylindrical equal-area: x = λ, y = sin φ', 'tl', { color: 'muted', weight: 600, plate: true });
          // ---- bars
          if (eq !== lastEq) { lastEq = eq; sC.setTicks(eq ? Array.from({ length: 10 }, (_, i) => [i + 1, String(i + 1)]) : [[1, 'zone'], [2, 'band'], [3, 'map']], null); sC.setLabels(eq ? 'slab (south to north)' : null, undefined); }
          if (eq) {
            const vals = bands.map(([a, b]) => zoneArea(a, b));
            sC.setView([0.4, 10.6], [0, 1.6]);
            sC.bars(vals, { x0: 1, dx: 1, color: (q, i) => (i % 2 ? 'teal' : 'accent') });
            sC.hline((4 * PI) / 10, { color: 'green', width: 1.4, dash: [6, 4] });
          } else {
            const za = zoneArea(z1, z2), ba = 2 * PI * (z2 - z1);
            sC.setView([0.4, 3.6], [0, Math.max(0.5, ba * 1.25)]);
            sC.bars([za, ba, ba], { x0: 1, dx: 1, color: (q, i) => ['accent', 'orange', 'green'][i] });
          }
          v.legend(eq ? [['accent', 'slabs of height 0.2R', { area: true }], ['teal', 'alternate slabs', { area: true }], ['green', 'one tenth of the sphere, 0.4π', { dash: true }]]
            : [['accent', 'zone of the sphere / its image', { area: true }], ['orange', 'band of the cylinder', { area: true }], ['green', 'indicatrices (all of area 1)', { area: true }]]);
        });
        v.readout(() => {
          const [z1, z2] = zs(), f1 = Math.asin(z1), f2 = Math.asin(z2);
          if (slabs.value) {
            const b = []; for (let i = 0; i <= 5; i++) b.push((Math.asin(i * 0.2) * R2D).toFixed(1) + '°');
            return `Ten slabs, each 0.2 R high: each covers **exactly one tenth** of the sphere, ${comma((4 * PI * R_MEAN * R_MEAN) / 10 / 1e6, 1)} million km² on the Earth. Their boundaries in the northern hemisphere are at latitudes ${b.join(', ')} — the polar slab spans ${(90 - Math.asin(0.8) * R2D).toFixed(1)}° of latitude, the equatorial one only ${(Math.asin(0.2) * R2D).toFixed(1)}°.`;
          }
          const zone = v.M.integrate((f) => 2 * PI * Math.cos(f), f1, f2, 200), band = 2 * PI * (z2 - z1);
          return `Slab from $z_1 = ${z1.toFixed(3)}$ to $z_2 = ${z2.toFixed(3)}$, i.e. latitudes ${(f1 * R2D).toFixed(1)}° to ${(f2 * R2D).toFixed(1)}°. Zone on the unit sphere, $\\int 2\\pi\\cos\\varphi\\,d\\varphi$ by Simpson's rule: **${zone.toFixed(6)}**; cylinder band $2\\pi(z_2 - z_1)$: **${band.toFixed(6)}**; strip on Lambert's map: ${(2 * PI * (z2 - z1)).toFixed(6)}. On the Earth that is ${comma((zone * R_MEAN * R_MEAN) / 1e6, 2)} million km², ${(((z2 - z1) / 2) * 100).toFixed(1)}% of the surface.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Event',
      name: 'The Gall–Peters controversy',
      credit: 'J. Gall, 1855 (published 1885); A. Peters, 1973',
      statement: String.raw`The cylindrical equal-area maps form a one-parameter family: true to scale along standard parallels $\pm\varphi_s$,
$$x = R\lambda\cos\varphi_s,\qquad y = R\,\frac{\sin\varphi}{\cos\varphi_s},$$
all with $hk = 1$. Lambert's (1772) has $\varphi_s = 0$, Behrmann's (1910) $30^\circ$, and $\varphi_s = 45^\circ$ is the projection James Gall presented to the British Association in Glasgow in 1855 (published 1885). Arno Peters devised the same map independently (by 1967) and launched it at a press conference in Bonn in May 1973 as a fairer alternative to Mercator, with claims — that it alone was area-correct, and that it kept angles and distances — which were false. Cartographers objected that it was neither new nor uniquely equal-area and that it distorts shapes badly (equatorial lands are stretched two to one north–south); in 1989–90 seven North American geographic organisations adopted a resolution against rectangular world maps of every kind, Mercator and Gall–Peters alike. The map was nevertheless widely adopted by aid agencies, UNESCO and schools (Boston Public Schools, 2017).`,
      idea: String.raw`Rescaling Lambert's cylinder (geog-4.5) by $\cos\varphi_s$ horizontally and $1/\cos\varphi_s$ vertically keeps areas (the factors multiply to 1) and moves the circular indicatrices from the equator to latitude $\pm\varphi_s$, where $h = k = 1$. Everywhere else $h/k = \cos^2\varphi/\cos^2\varphi_s$, so shapes are stretched vertically equatorward of $\varphi_s$ and squashed poleward. No choice of $\varphi_s$ removes the shape error (geog-3.7): the debate was never about mathematics, which allows only trade-offs, but about which distortion a world map should show — Mercator's area error (geog-4.4) or an equal-area map's shape error.`,
      caption: String.raw`Slide the standard parallels or pick a named map (or click an event on the timeline). The map is redrawn at nominal scale — its area never changes, only its proportions. Indicatrices are green where they are circles, orange elsewhere; Africa is outlined. Right: the largest angle distortion $\omega$ along each latitude, for the chosen map (thick) and the named ones (thin). The readout checks Africa's area on the map and measures how tall it is drawn relative to its width.`,
      deps: ['geog-4.5', 'geog-4.4'],
      see: ['geog-3.7'],
      refs: ['Snyder §10'],
      tags: ['map projections', 'equal-area', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gall%E2%80%93Peters_projection', peters: 'https://en.wikipedia.org/wiki/Arno_Peters' },
      viz(v) {
        const NAMED = [['0', 'Lambert 0°', 'teal'], ['30', 'Behrmann 30°', 'purple'], ['37.5', 'Hobo–Dyer 37.5°', 'pink'], ['45', 'Gall–Peters 45°', 'red'], ['50', 'Balthasart 50°', 'blue']];
        const sp = v.slider('standard parallels $\\pm\\varphi_s$', 0, 55, 45, { step: 0.5, fmt: (x) => x.toFixed(1) + '°' });
        v.select('named map', NAMED.map(([value, label]) => ({ value, label })), '45', { onChange: (x) => sp.set(+x) });
        const sA = v.stage({ x: [-3.3, 3.3], y: [-1.82, 1.82], equal: true, axes: false, height: 330, weight: 1.45 });
        const sB = v.stage({ x: [0, 85], y: [0, 120], axes: 'box', gutter: true, height: 330, xlabel: 'latitude (°)', ylabel: 'max angle distortion ω (°)', xticks: [0, 15, 30, 45, 60, 75], yticks: [0, 30, 60, 90, 120] });
        const sT = v.stage({ height: 130, full: true });
        const T = v.timeline(sT, {
          scale: 'linear', range: [1755, 2030], zoom: false,
          events: [
            { t: 1772, label: 'Lambert: equal-area cylinder', sp: 0, priority: 1 },
            { t: 1855, label: 'Gall presents 45° version (Glasgow)', sp: 45, priority: 1 },
            { t: 1885, label: 'Gall publishes it', sp: 45 },
            { t: 1910, label: 'Behrmann 30°', sp: 30 },
            { t: 1935, label: 'Balthasart 50°', sp: 50 },
            { t: 1973, label: 'Peters launches it in Bonn', sp: 45, priority: 1, color: 'red' },
            { t: 1989, label: 'geographers resolve against rectangular world maps', priority: 1, color: 'green' },
            { t: 2002, label: 'Hobo–Dyer 37.5°', sp: 37.5 },
            { t: 2017, label: 'Boston schools adopt Gall–Peters', sp: 45 },
          ],
          onSelect: (e) => { if (e && e.sp != null) sp.set(e.sp); },
        });
        const AF = v.geo('landmass', 'Africa'), aTrue = Math.abs(v.geo('sphericalArea', AF[0]));
        const om = (f, s) => { const c = Math.cos(s * D2R), k = c / Math.cos(f * D2R), h = Math.cos(f * D2R) / c; return omega(h, k); };
        const africa = () => {
          const c = Math.cos(sp.value * D2R), pts = AF[0].map(([l, f]) => [l * D2R * c, Math.sin(f * D2R) / c]);
          const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
          return { pts, area: shoelace(pts), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
        };
        // Africa's extent on the globe: N–S along the meridian, E–W along the equator (arc lengths on the unit sphere)
        const lats = AF[0].map((p) => p[1]), lons = AF[0].map((p) => p[0]);
        const trueAspect = ((Math.max(...lats) - Math.min(...lats)) * D2R) / ((Math.max(...lons) - Math.min(...lons)) * D2R);
        v.render(() => {
          const s = sp.value, c = Math.cos(s * D2R), X = (l) => l * c, Y = (f) => Math.sin(f) / c;
          cylBase(sA, v, X, Y, { lat: 90, step: 30, pstep: 15 });
          const A = africa(); sA.poly(A.pts, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1.6 });
          for (const sg of s > 0 ? [1, -1] : [0]) sA.line(X(-PI), Y(sg * s * D2R), X(PI), Y(sg * s * D2R), { color: 'green', width: 1.6, dash: [6, 4] });
          const r0 = 3.6 * D2R;
          for (let f = -75; f <= 75; f += 15) for (let l = -150; l <= 150; l += 30) {
            const cf = Math.cos(f * D2R), k = c / cf, h = cf / c;
            ell(sA, X(l * D2R), Y(f * D2R), k * r0, h * r0, Math.abs(h / k - 1) < 0.04 ? 'green' : 'orange', 0.28);
          }
          const named = NAMED.find(([vv]) => Math.abs(+vv - s) < 1e-9);
          sA.corner(named ? named[1].replace(/ [\d.]+°$/, '') + ` (φs = ${s}°)` : `cylindrical equal-area, φs = ${s.toFixed(1)}°`, 'tl', { color: 'muted', weight: 600, plate: true });
          for (const [vv, , col] of NAMED) sB.fn((f) => om(f, +vv), { domain: [0, 85], color: col, width: 1.1, alpha: 0.55 });
          sB.fn((f) => om(f, s), { domain: [0, 85], color: 'ink', width: 3 });
          if (s > 0) sB.dot(s, 0, { r: 5, color: 'green' });
          T.draw();
          v.legend([...NAMED.map(([, label, col]) => [col, label]), ['ink', 'chosen map'], ['orange', 'Africa', { area: true }]]);
        });
        v.readout(() => {
          const s = sp.value, c = Math.cos(s * D2R), A = africa(), mapAspect = A.h / A.w;
          return `Africa on this map: area ${A.area.toFixed(4)} vs ${aTrue.toFixed(4)} on the unit sphere (ratio **${(A.area / aTrue).toFixed(3)}** — equal-area for every $\\varphi_s$). Its bounding box is drawn **${(mapAspect / trueAspect).toFixed(2)}×** as tall, relative to its width, as its north–south and east–west extents on the globe (at the equator $h/k = 1/\\cos^2\\varphi_s = ${(1 / (c * c)).toFixed(2)}$). Map width : height $= \\pi\\cos^2\\varphi_s = ${(PI * c * c).toFixed(3)}$. Shapes are true only on the green parallels; the largest angle error on the equator is $\\omega = ${om(0, s).toFixed(1)}^\\circ$, at 70° it is ${om(70, s).toFixed(1)}°.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Model',
      name: 'Transverse Mercator and the UTM grid',
      credit: 'J. H. Lambert, 1772 (sphere); C. F. Gauss, 1822, and L. Krüger, 1912 (ellipsoid); UTM: U.S. Army, 1940s',
      statement: String.raw`The **transverse Mercator** projection is Mercator's map with the cylinder turned to touch a chosen *central meridian* $\lambda_0$ instead of the equator. On the sphere it is conformal with point scale
$$k = \frac{k_0}{\sqrt{1 - \cos^2\varphi\,\sin^2(\lambda - \lambda_0)}} = k_0\cosh\frac{x}{k_0R},$$
which depends only on the distance $x$ from the central meridian (about 0.4% at 5° of longitude on the equator). Gauss (1822) and Krüger (1912) gave the ellipsoidal version. The **Universal Transverse Mercator (UTM)** system divides the Earth from 80° S to 84° N into **60 zones, each 6° of longitude wide** (zone 1 is 180°–174° W), and maps each with its own transverse Mercator on the WGS84 ellipsoid, with **scale factor $k_0 = 0.9996$** on the central meridian, a false easting of 500 000 m and, in the southern hemisphere, a false northing of 10 000 000 m. The scale is exactly 1 about 180 km either side of the central meridian and stays within 1 part in 1000 of 1 throughout a zone (up to 1.0010 at the zone edges on the equator). Norway and Svalbard have widened zones.`,
      idea: String.raw`Rotating the sphere so that the central meridian becomes the "equator" and applying Mercator (geog-4.2) gives a conformal map whose scale $\sec$ of the angular distance from that meridian is close to 1 in a narrow strip: at 3° the excess is only $\sec 3^\circ - 1 \approx 0.0014$. Multiplying the whole map by $k_0 = 0.9996$ spreads the error evenly: the scale is $0.9996$ on the central meridian, 1 on two lines about 180 km away (where $\cosh(x/R) = 1/0.9996$) and about $1.0010$ at the edge of a zone on the equator, so grid distances are true to within 1:1000 everywhere. A local rectangular grid in metres, valid over a whole zone, is what surveyors and soldiers needed.`,
      caption: String.raw`Drag $P$ on either map, or click a zone on the strip. Left: the transverse Mercator for $P$'s zone, its 6° strip shaded, neighbouring zone boundaries curving away, the lines of exact scale (green, dashed) and Tissot circles that grow away from the central meridian. Right: the 60 zones from 80° S to 84° N; below, the UTM point scale across the zone at $P$'s latitude. The readout gives $P$'s UTM coordinates computed by Krüger's series on WGS84, checked against a published example.`,
      deps: ['geog-4.2'],
      see: ['geog-3.8'],
      refs: ['Snyder §8'],
      tags: ['map projections', 'conformal maps', 'grids'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Universal_Transverse_Mercator_coordinate_system', tm: 'https://en.wikipedia.org/wiki/Transverse_Mercator_projection' },
      viz(v) {
        const sA = v.stage({ height: 350, weight: 0.85 });
        const sB = v.stage({ height: 350, weight: 1.3 });
        const sC = v.stage({ x: [-520, 520], y: [0.9993, 1.0016], axes: 'box', gutter: true, height: 240, full: true, xlabel: 'distance east of the central meridian (km)', ylabel: 'UTM point scale k', yticks: [0.9994, 0.9996, 0.9998, 1, 1.0002, 1.0006, 1.001, 1.0014].map((y) => [y, y === 1 ? '1' : y.toFixed(4)]) });
        const G = v.globe(sA, { projection: 'transverseMercator', center: [9, 0], graticule: 15, zoom: 1.75, drag: false });
        const G2 = v.globe(sB, { projection: 'equirectangular', center: [0, 0], graticule: 30, drag: false });
        const P = G.handle(10.75, 59.91, { label: 'P', color: 'accent' }); G2.handle(P);
        sB.onClick((x, y) => { const q = G2.invert(x, y); if (q) { const z = utmZone(q[1], q[0]); P.set(zoneCM(z) + 1.2, clamp(q[1], -79, 83)); } });
        let cm = null;
        const strip = (l0, l1, f0 = -80, f1 = 84) => { const r = []; for (let f = f0; f <= f1; f += 2) r.push([l1, f]); for (let f = f1; f >= f0; f -= 2) r.push([l0, f]); return r; };
        const cn = utmXY(43 + 38 / 60 + 33.24 / 3600, -(79 + 23 / 60 + 13.7 / 3600), zoneCM(17));
        v.render(() => {
          const z = utmZone(P.lat, P.lon), c0 = zoneCM(z);
          if (c0 !== cm) { cm = c0; G.set({ center: [c0, 0] }); }
          G.draw({ graticule: 15 });
          // neighbouring zone boundaries and the selected zone
          for (let l = c0 - 33; l <= c0 + 33; l += 6) G.path(strip(l, l, -80, 84).slice(0, 83), { geodesic: false, color: 'purple', width: 1, alpha: 0.55 });
          G.polygon([strip(c0 + 3, c0 - 3).reverse()], { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 1.6 });
          G.path([[c0, -80], [c0, 84]], { geodesic: false, color: 'accent', width: 1.4, dash: [6, 4] });
          // lines of exact scale: cos B = k0, sin B = cos φ sin Δλ
          const sB0 = Math.sqrt(1 - 0.9996 ** 2);
          for (const sg of [1, -1]) { const pts = []; for (let f = -80; f <= 84; f += 1) pts.push([c0 + sg * Math.asin(Math.min(1, sB0 / Math.cos(f * D2R))) * R2D, f]); G.path(pts, { geodesic: false, color: 'green', width: 1.6, dash: [5, 4] }); }
          G.tissot({ step: 15, lon: [c0 - 45, c0 + 46], lat: [-60, 60], radius: 3.5, fill: 'red', fillAlpha: 0.22, color: 'red', width: 0.8 });
          sA.corner(`transverse Mercator, zone ${z} (central meridian ${c0 < 0 ? -c0 + '°W' : c0 + '°E'})`, 'tl', { color: 'muted', weight: 600, plate: true });
          // the 60 zones
          G2.draw({ graticule: 30 });
          for (let i = 1; i <= 60; i++) {
            const x0 = (-180 + 6 * (i - 1)) * D2R, x1 = x0 + 6 * D2R;
            if (i === z) sB.rect(x0, -80 * D2R, x1, 84 * D2R, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1.2 });
            else if (i % 2) sB.rect(x0, -80 * D2R, x1, 84 * D2R, { fill: 'purple', fillAlpha: 0.07, stroke: false });
            if ((i % 3 === 1 && Math.abs(i - z) > 2) || i === z) sB.text(String(i), (x0 + x1) / 2, -85.5 * D2R, { size: i === z ? 12 : 10, color: i === z ? 'accent' : 'muted', weight: i === z ? 700 : 500 });
          }
          sB.line(-PI, 84 * D2R, PI, 84 * D2R, { color: 'purple', width: 1, dash: [3, 3] }); sB.line(-PI, -80 * D2R, PI, -80 * D2R, { color: 'purple', width: 1, dash: [3, 3] });
          // scale across the zone at P's latitude
          sC.hband(0.999, 1.001, { color: 'green', alpha: 0.05 });
          sC.hline(1, { color: 'green', width: 1.4, dash: [6, 4] }); sC.hline(0.9996, { color: 'faint', width: 1 });
          const pts = []; let e3 = null, w3 = null;
          for (let d = -4.6; d <= 4.6 + 1e-9; d += 0.05) { const u = utmXY(P.lat, c0 + d, c0); pts.push([(u.E - 500000) / 1000, u.k]); }
          e3 = (utmXY(P.lat, c0 + 3, c0).E - 500000) / 1000; w3 = -e3;
          sC.vband(w3, e3, { color: 'accent', alpha: 0.1 });
          sC.path(pts, { color: 'accent', width: 2.6 });
          const up = utmXY(P.lat, P.lon, c0); sC.dot((up.E - 500000) / 1000, up.k, { r: 6, color: 'accent', label: 'P', labelPos: 'n' });
          for (const sg of [1, -1]) { const xk = sg * Math.acosh(1 / 0.9996) * 0.9996 * R_MEAN; sC.dot(xk, 1, { r: 4, color: 'green' }); }
          for (const xe of [w3, e3]) sC.text('zone edge', xe, 1.00135, { size: 11, color: 'accent', align: xe > 0 ? 'right' : 'left', dx: xe > 0 ? -4 : 4, plate: true });
          v.legend([['accent', 'P’s zone (6°)', { area: true }], ['green', 'scale exactly 1', { dash: true }], ['purple', 'other zone boundaries'], ['red', 'Tissot circles (conformal)', { area: true }]]);
        });
        v.readout(() => {
          const z = utmZone(P.lat, P.lon), c0 = zoneCM(z), u = utmXY(P.lat, P.lon, c0);
          const ksph = 0.9996 / Math.sqrt(1 - (Math.cos(P.lat * D2R) * Math.sin((P.lon - c0) * D2R)) ** 2);
          const ppm = (u.k - 1) * 1e6;
          return `$P = (${P.lat.toFixed(4)}^\\circ, ${P.lon.toFixed(4)}^\\circ)$ → **zone ${z}${P.lat >= 0 ? 'N' : 'S'}, E ${comma(Math.floor(u.E))} m, N ${comma(Math.floor(u.N))} m** (truncated to the metre, as UTM references are). Point scale $k = ${u.k.toFixed(6)}$ (spherical formula: ${ksph.toFixed(6)}): grid distances here are ${ppm >= 0 ? 'longer' : 'shorter'} than ground distances by ${Math.abs(ppm).toFixed(0)} parts per million (${(Math.abs(ppm) / 10).toFixed(1)} cm per km). Check: the CN Tower (43°38′33.24″ N, 79°23′13.7″ W) comes out as 17N ${comma(Math.floor(cn.E))} / ${comma(Math.floor(cn.N))}; the published value is 17N 630084 / 4833438.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Model',
      name: 'Web Mercator',
      credit: 'Google Maps, 2005; EPSG:3857, 2008',
      statement: String.raw`**Web Mercator** (EPSG:3857, "Pseudo-Mercator") takes WGS84 geodetic coordinates $(\varphi, \lambda)$ and applies the *spherical* Mercator formulas with the equatorial radius $a = 6\,378\,137$ m:
$$x = a\lambda,\qquad y = a\ln\tan\Big(\frac{\pi}{4} + \frac{\varphi}{2}\Big),$$
instead of the ellipsoidal Mercator $y = a\big[\operatorname{artanh}(\sin\varphi) - e\operatorname{artanh}(e\sin\varphi)\big]$. The world is cut off at $|y| = \pi a$, i.e. at latitude $\arctan(\sinh\pi) \approx 85.0511^\circ$, so that it is a square, divided at zoom level $z$ into $2^z \times 2^z$ tiles of 256 × 256 pixels. Because spherical formulas are applied to ellipsoidal latitudes, the map is **not exactly conformal** (angles err by up to about 0.4°, largest at the equator), and its northings differ from true Mercator northings by up to about 43 km; mixing the two up displaces positions by up to about 21 km on the ground. The U.S. National Geospatial-Intelligence Agency warned in 2014 that such mix-ups can cause errors "up to 40,000 meters".`,
      idea: String.raw`On the ellipsoid a parallel has length $2\pi N\cos\varphi$ and a meridian element is $M\,d\varphi$, with $M < N$ the two radii of curvature (geog-1.7). Web Mercator scales the parallel by $k = a/(N\cos\varphi)$ but the meridian by $h = a\sec\varphi/M$, so $h/k = N/M = (1 - e^2\sin^2\varphi)/(1 - e^2)$: about $1.0067$ at the equator, tending to 1 at the poles. True ellipsoidal Mercator stretches its parallels by the corrected isometric latitude so that $h = k$ (geog-4.2). The shortcut buys simple tile arithmetic — a tile's corners are given by closed formulas on the sphere — at the price of a slightly non-conformal map that is easy to confuse with the real thing.`,
      caption: String.raw`Drag $P$ on the square world and choose a zoom level: the tile grid is drawn and $P$'s tile is labelled $z/x/y$ as in web map URLs. Right: choose what to plot against latitude — the northing difference from true (ellipsoidal) Mercator, the ground displacement if the two are confused, or the angle error. The readout gives $P$'s coordinates in metres, its tile and pixel size.`,
      deps: ['geog-4.2', 'geog-1.7'],
      refs: ['Snyder §7'],
      tags: ['map projections', 'web maps', 'Mercator'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Web_Mercator_projection', tiles: 'https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames' },
      viz(v) {
        const zoom = v.slider('zoom level $z$', 0, 6, 2, { step: 1, int: true });
        const what = v.select('plot', [{ value: 'dy', label: 'northing offset (km)' }, { value: 'gr', label: 'ground offset (km)' }, { value: 'om', label: 'angle error ω (°)' }], 'dy');
        const sA = v.stage({ x: [-3.3, 3.3], y: [-3.3, 3.3], equal: true, axes: false, height: 370, weight: 1.05 });
        const sB = v.stage({ x: [0, 90], y: [0, 45], axes: 'box', gutter: true, height: 370, xlabel: 'latitude (°)', ylabel: 'northing offset (km)', xticks: [0, 15, 30, 45, 60, 75, 90] });
        const CUT = Math.atan(Math.sinh(PI)) * R2D;
        let lon = 2.35, lat = 48.86;
        const P = sA.handle(lon * D2R, merc(lat * D2R), { color: 'accent', label: 'P', constrain: (x, y) => [clamp(x, -PI + 1e-6, PI - 1e-6), clamp(y, -PI + 1e-6, PI - 1e-6)], onDrag: (h) => { lon = h.x * R2D; lat = imerc(h.y) * R2D; } });
        const dy = (f) => (WGS84.a * (psiS(f) - psiE(f))) / 1000;
        const gr = (f) => (meridArc(f, invPsiE(psiS(f))) / 1000);
        const om = (f) => { const s2 = Math.sin(f) ** 2, r = (1 - WGS84.e2 * s2) / (1 - WGS84.e2); return omega(r, 1); };
        const META = { dy: [dy, [0, 45], 'northing offset (km)'], gr: [gr, [0, 25], 'ground offset (km)'], om: [om, [0, 0.45], 'angle error ω (°)'] };
        let lastW = '';
        const tile = () => { const n = 2 ** zoom.value; return { n, x: Math.min(n - 1, Math.floor((n * (lon + 180)) / 360)), y: Math.min(n - 1, Math.floor((n * (1 - merc(lat * D2R) / PI)) / 2)) }; };
        v.render(() => {
          if (!P.dragging) P.set(lon * D2R, merc(lat * D2R));
          const Y = (f) => clamp(merc(clamp(f, -89.99 * D2R, 89.99 * D2R)), -PI, PI);
          cylBase(sA, v, (l) => l, Y, { lat: CUT, step: 30, pstep: 30 });
          const t = tile(), w = (2 * PI) / t.n, g = [];
          for (let i = 1; i < t.n; i++) g.push([-PI + i * w, -PI], [-PI + i * w, PI], null, [-PI, -PI + i * w], [PI, -PI + i * w], null);
          sA.path(g, { color: 'purple', width: t.n > 32 ? 0.5 : 1, alpha: 0.6 });
          const tx0 = -PI + t.x * w, ty1 = PI - t.y * w;
          sA.rect(tx0, ty1 - w, tx0 + w, ty1, { fill: 'purple', fillAlpha: 0.28, color: 'purple', width: 2 });
          sA.text(`${zoom.value}/${t.x}/${t.y}`, clamp(tx0 + w / 2, -2.75, 2.75), clamp(ty1 + 0.17, -3.05, 3.2), { size: 12, color: 'purple', weight: 700, plate: true });
          sA.line(-PI, PI, PI, PI, { color: 'red', width: 1.4 }); sA.line(-PI, -PI, PI, -PI, { color: 'red', width: 1.4 });
          sA.text(`cut at ${CUT.toFixed(4)}° N`, 0, PI - 0.15, { size: 11, color: 'red', weight: 600, plate: true });
          sA.text(`cut at ${CUT.toFixed(4)}° S`, 0, -PI + 0.15, { size: 11, color: 'red', weight: 600, plate: true });
          // plot
          const [F, yr, lab] = META[what.value];
          if (what.value !== lastW) { lastW = what.value; sB.setLabels(undefined, lab); }
          sB.setView([0, 90], yr);
          sB.fn((x) => F(Math.min(x, 89.999) * D2R), { domain: [0, 90], color: what.value === 'om' ? 'red' : 'accent', width: 2.6 });
          sB.vband(CUT, 90, { color: 'red', alpha: 0.08 });
          sB.vline(Math.abs(lat), { color: 'muted', dash: [3, 3] });
          sB.dot(Math.abs(lat), F(Math.abs(lat) * D2R), { r: 6, color: 'accent', label: 'P', labelPos: 'nw' });
          v.legend([['purple', `tile grid at zoom ${zoom.value} (${t.n}×${t.n})`], ['red', 'edge of the square world', {}], [what.value === 'om' ? 'red' : 'accent', lab.replace(/ \(.*\)/, '') + ' vs ellipsoidal Mercator']]);
        });
        v.readout(() => {
          const f = lat * D2R, t = tile(), res = (156543.03 * Math.cos(f)) / 2 ** zoom.value;
          return `$P = (${lat.toFixed(4)}^\\circ, ${lon.toFixed(4)}^\\circ)$: Web Mercator $x = ${comma(WGS84.a * lon * D2R)}$ m, $y = ${comma(WGS84.a * psiS(f))}$ m; true (ellipsoidal) Mercator $y = ${comma(WGS84.a * psiE(f))}$ m — **${dy(Math.abs(f)).toFixed(2)} km** apart in northing; read as true Mercator, the point would be put **${gr(Math.abs(f)).toFixed(2)} km** ${lat >= 0 ? 'north' : 'south'} of where it is. Angles here err by up to $\\omega = ${om(f).toFixed(3)}^\\circ$. Tile **${zoom.value}/${t.x}/${t.y}** of ${t.n}×${t.n}; one 256-px tile pixel covers ${res >= 1000 ? comma(res / 1000, 1) + ' km' : comma(res, 1) + ' m'} of ground here. The cut-off $\\arctan(\\sinh\\pi) = ${CUT.toFixed(7)}^\\circ$ makes the world square.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Model',
      name: 'Miller cylindrical projection',
      credit: 'O. M. Miller, 1942',
      statement: String.raw`The **Miller cylindrical** projection is the compromise
$$x = R\lambda,\qquad y = \tfrac54 R\ln\tan\Big(\frac{\pi}{4} + \frac{2\varphi}{5}\Big),$$
obtained by applying Mercator's formula to $\tfrac45\varphi$ and multiplying by $\tfrac54$ so that the equator stays true and the map agrees with Mercator to first order near it. More generally $y = \frac{1}{m}\ln\tan\big(\frac{\pi}{4} + \frac{m\varphi}{2}\big)$ interpolates between the plate carrée ($m \to 0$) and Mercator ($m = 1$); Miller chose $m = 4/5$. Its scales are $h = \sec\tfrac{4\varphi}{5}$ and $k = \sec\varphi$, so it is neither conformal nor equal-area, but the poles are finite lines: the map's height is about $0.733$ of its width.`,
      idea: String.raw`For any $m < 1$ the meridian scale $h = dy/d\varphi = \sec(m\varphi)$ stays finite up to the pole, so $y(\pm\pi/2) = \frac1m\ln\tan\frac{\pi(1+m)}{4}$ is finite and the whole globe fits; for $m = 1$ we recover Mercator's divergent $\int\sec$ (geog-4.2). Since $h < k$ away from the equator, the indicatrices are flattened ellipses (not conformal) whose areas $hk$ still grow, though far less than Mercator's $\sec^2\varphi$ (not equal-area). Miller picked $m = 4/5$ to keep the familiar Mercator look at low latitudes while showing the polar regions.`,
      caption: String.raw`Slide $m$ (or pick plate carrée, Miller or Mercator) and drag $P$. The map is drawn from the formula with indicatrices; $P$'s indicatrix is enlarged with its principal axes. Right: the meridian scale $h$, parallel scale $k$ and area factor $hk$ on a log axis; conformal would mean $h = k$, equal-area $hk = 1$. The readout reports the pole's position and the distortion at $P$.`,
      deps: ['geog-4.2'],
      see: ['geog-4.1'],
      refs: ['Snyder §11'],
      tags: ['map projections', 'cylindrical', 'compromise'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Miller_cylindrical_projection' },
      viz(v) {
        const mm = v.slider('compromise $m$', 0, 1, 0.8, { step: 0.01, fmt: (x) => x.toFixed(2) });
        v.select('preset', [{ value: '0', label: 'plate carrée (m = 0)' }, { value: '0.8', label: 'Miller (m = 4/5)' }, { value: '1', label: 'Mercator (m = 1)' }], '0.8', { onChange: (x) => mm.set(+x) });
        const sA = v.stage({ x: [-3.3, 3.3], y: [-3.25, 3.25], equal: true, axes: false, height: 380, weight: 1.15 });
        const sB = v.stage({ x: [0, 90], y: [0.8, 30], ylog: true, axes: 'box', gutter: true, height: 380, xlabel: 'latitude (°)', ylabel: 'scale factor', xticks: [0, 15, 30, 45, 60, 75, 90] });
        const Yf = (m) => (f) => (m < 1e-4 ? f : Math.log(Math.tan(PI / 4 + (m * f) / 2)) / m);
        const Yinv = (m, y) => (m < 1e-4 ? y : (2 / m) * (Math.atan(Math.exp(m * y)) - PI / 4));
        let lon = -40, lat = 66;
        const P = sA.handle(lon * D2R, Yf(0.8)(lat * D2R), { color: 'accent', label: 'P', constrain: (x, y) => [clamp(x, -PI * 0.97, PI * 0.97), clamp(y, -3.1, 3.1)], onDrag: (h) => { lon = h.x * R2D; lat = clamp(Yinv(mm.value, h.y) * R2D, -84, 84); } });
        const latMax = (m) => Math.min(90, Yinv(m, 3.12) * R2D);
        v.render(() => {
          const m = mm.value, Y = Yf(m), lm = latMax(m);
          sA.setView([-3.3, 3.3], [-(Y(lm * D2R) + 0.3), Y(lm * D2R) + 0.3]);
          if (Math.abs(lat) > lm - 0.5) lat = Math.sign(lat) * (lm - 0.5);
          if (!P.dragging) P.set(lon * D2R, Y(lat * D2R));
          cylBase(sA, v, (l) => l, Y, { lat: lm, step: 30, pstep: 15 });
          if (lm < 90) for (const sg of [1, -1]) sA.text(`${sg > 0 ? 'N' : 'S'} pole at y = ${m >= 0.999 ? '∞' : Y(PI / 2).toFixed(2)}`, 0, sg * (Y(lm * D2R) + 0.12), { size: 11, color: 'red', weight: 600 });
          const r0 = 2.8 * D2R;
          for (let f = -75; f <= 75; f += 15) for (let l = -150; l <= 150; l += 30) {
            if (Math.abs(f) > lm) continue; const h = 1 / Math.cos(m * f * D2R), k = 1 / Math.cos(f * D2R);
            ell(sA, l * D2R, Y(f * D2R), k * r0, h * r0, Math.abs(h / k - 1) < 0.01 ? 'green' : 'orange', 0.26);
          }
          const f = lat * D2R, h = 1 / Math.cos(m * f), k = 1 / Math.cos(f), R = 7 * D2R, px = lon * D2R, py = Y(f);
          ell(sA, px, py, k * R, h * R, 'accent', 0.3);
          sA.line(px - k * R, py, px + k * R, py, { color: 'accent', width: 1.4 }); sA.line(px, py - h * R, px, py + h * R, { color: 'accent', width: 1.4 });
          sA.corner(m < 1e-4 ? 'plate carrée' : Math.abs(m - 0.8) < 1e-9 ? 'Miller cylindrical (m = 4/5)' : m >= 0.999 ? 'Mercator (to 85°)' : `compromise m = ${m.toFixed(2)}`, 'tl', { color: 'muted', weight: 600, plate: true });
          sB.hline(1, { color: 'faint', width: 1 });
          sB.fn((x) => 1 / Math.cos(m * x * D2R), { domain: [0, 89.9], color: 'blue', width: 2.4 });
          sB.fn((x) => 1 / Math.cos(x * D2R), { domain: [0, 88], color: 'red', width: 2.4 });
          sB.fn((x) => 1 / (Math.cos(m * x * D2R) * Math.cos(x * D2R)), { domain: [0, 88], color: 'purple', width: 2.4, dash: [7, 4] });
          sB.vline(Math.abs(lat), { color: 'muted', dash: [3, 3] });
          v.legend([['blue', 'meridian scale h = sec mφ'], ['red', 'parallel scale k = sec φ'], ['purple', 'area factor hk', { dash: true }], ['orange', 'indicatrix (h ≠ k)', { area: true }]]);
        });
        v.readout(() => {
          const m = mm.value, f = lat * D2R, h = 1 / Math.cos(m * f), k = 1 / Math.cos(f);
          const pole = m >= 0.999 ? null : Yf(m)(PI / 2);
          let worst = 0; for (let a = 0; a <= 80; a += 1) worst = Math.max(worst, omega(1 / Math.cos(m * a * D2R), 1 / Math.cos(a * D2R)));
          return `$m = ${m.toFixed(2)}$: ${pole == null ? 'the poles are at $y = \\pm\\infty$ (Mercator)' : `the poles are the lines $y = \\pm${pole.toFixed(4)}$, so the map is **${(pole / PI).toFixed(3)}** times as tall as it is wide`}. At $P$ ($\\varphi = ${lat.toFixed(1)}^\\circ$): $h = ${h.toFixed(3)}$, $k = ${k.toFixed(3)}$, area factor $hk = ${(h * k).toFixed(3)}$ (Mercator: ${(k * k).toFixed(3)}), angles off by up to $\\omega = ${omega(h, k).toFixed(1)}^\\circ$. Largest $\\omega$ up to 80°: ${worst.toFixed(1)}°.`;
        });
      },
    },
  ],
};
