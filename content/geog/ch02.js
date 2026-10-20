// Geography & Cartography — Chapter 2: Navigation on the sphere
import { D2R, R2D, R_MEAN, vec, lonlat, dot3, cross3, unit3, sub3, angle3, tangentTo, enu, comma, arcPts } from './ch01.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mod = (a, n) => ((a % n) + n) % n;
const wrap180 = (x) => mod(x + 180, 360) - 180;
/** Mercator ordinate (isometric latitude) ψ(φ), φ in degrees. */
const psi = (lat) => Math.log(Math.tan(Math.PI / 4 + clamp(lat, -89.999999, 89.999999) * D2R / 2));
/** Inverse: φ (degrees) from ψ. */
const gd = (p) => Math.atan(Math.sinh(p)) * R2D;
/** Bearing (degrees, clockwise from north, 0–360) of the chord a → b at its midpoint (a, b = [lon, lat]). */
function chordBearing(a, b) {
  const u = vec(a), w = vec(b), d = sub3(w, u), m = lonlat(unit3([u[0] + w[0], u[1] + w[1], u[2] + w[2]])), E = enu(m);
  return mod(Math.atan2(dot3(d, E.e), dot3(d, E.n)) * R2D, 360);
}
/**
 * Loxodrome from [l0, f0] at bearing b (deg) up to latitude fEnd: points with UNWRAPPED longitude,
 * λ = λ0 + tan β · (ψ(φ) − ψ(φ0)), sampled uniformly in ψ (so evenly in longitude).
 */
function loxodrome(l0, f0, b, fEnd) {
  const t = Math.tan(b * D2R), p0 = psi(f0), p1 = psi(fEnd), dp = p1 - p0;
  const n = Math.min(40000, Math.max(60, Math.ceil((Math.abs(t * dp) * R2D) / 1.5), Math.ceil(Math.abs(dp) * 120)));
  const out = [];
  for (let i = 0; i <= n; i++) { const p = p0 + (dp * i) / n; out.push([l0 + t * (p - p0) * R2D, gd(p)]); }
  return out;
}
const compass = (b) => ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(mod(b, 360) / 22.5) % 16];
const deg3 = (b) => String(Math.round(mod(b, 360)) % 360).padStart(3, '0') + '°';
/** Ellipse outline (data coords) from a 2×2 covariance, scaled by k standard deviations. */
function covEllipse(cx, cy, sxx, sxy, syy, k, n = 72) {
  const tr = sxx + syy, det = sxx * syy - sxy * sxy, d = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  const l1 = tr / 2 + d, l2 = Math.max(0, tr / 2 - d), th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const a = k * Math.sqrt(l1), b = k * Math.sqrt(l2), c = Math.cos(th), s = Math.sin(th), out = [];
  for (let i = 0; i <= n; i++) { const t = (2 * Math.PI * i) / n, x = a * Math.cos(t), y = b * Math.sin(t); out.push([cx + c * x - s * y, cy + s * x + c * y]); }
  return { pts: out, a, b };
}

const NM = 1.852; // km per nautical mile (exact, by definition)

export default {
  collection: 'geog',
  chapter: 2,
  title: 'Navigation on the sphere',
  summary: String.raw`A ship that holds a constant compass bearing does not follow the shortest path: it traces a loxodrome, which crosses every meridian at the same angle and spirals round the pole infinitely often in a finite distance. Comparing rhumb lines with great circles, fixing position by dead reckoning and by the altitude of Polaris and the noon Sun, and measuring a country by a chain of triangles from a single baseline, shows how the geometry of the sphere governs travel and surveying — down to the few arcseconds by which a surveyor's triangle overshoots 180°.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Loxodromes (rhumb lines)',
      credit: 'Pedro Nunes, 1537 (first analysed); Mercator, 1569 (made straight on his map)',
      statement: String.raw`A **loxodrome** or **rhumb line** is a curve on the sphere that crosses every meridian at the same angle $\beta$, the course a ship follows when it steers a constant compass bearing. With latitude $\varphi$, longitude $\lambda$ and the *isometric latitude* $\psi(\varphi) = \ln\tan\!\big(\tfrac{\pi}{4} + \tfrac{\varphi}{2}\big)$, the loxodrome through $(\varphi_0, \lambda_0)$ with bearing $\beta$ is
$$\lambda - \lambda_0 = \tan\beta\,\big(\psi(\varphi) - \psi(\varphi_0)\big),$$
and its length from $\varphi_0$ to $\varphi$ is $R\,|\varphi - \varphi_0| / |\cos\beta|$. For $\beta = 0^\circ$ or $180^\circ$ it is a meridian, for $\beta = 90^\circ$ a parallel; for any other bearing it reaches a pole after the **finite** length $R\,(\tfrac{\pi}{2} \mp \varphi_0)/|\cos\beta|$ while winding round it **infinitely many** times, because $\psi(\varphi) \to \pm\infty$ at the poles.`,
      idea: String.raw`On a small step $ds$ at bearing $\beta$ the ship moves $R\,d\varphi = \cos\beta\,ds$ north and $R\cos\varphi\,d\lambda = \sin\beta\,ds$ east (the parallel has radius $R\cos\varphi$, 1.2). Dividing, $d\lambda = \tan\beta\,\sec\varphi\,d\varphi$, and $\int\sec\varphi\,d\varphi = \psi(\varphi)$ gives the formula; the north–south equation alone gives the length. Near the pole the parallels shrink, so each turn round it is shorter than the last, and the turns form a convergent series of lengths but a divergent number of turns. In polar stereographic coordinates the radius is exactly $2e^{-\psi}$, so the loxodrome becomes a **logarithmic spiral**: zooming in by any factor shows the same picture, which is the infinitude made visible. Away from the poles, $\psi'=\sec\varphi$, so the fundamental theorem (pma 6.21) evaluates the longitude integral as the difference of endpoint isometric latitudes. The finite-length calculation integrates the northward component separately when $\cos\beta\ne0$; an east–west parallel is the separate limiting course, not a division by zero.`,
      caption: String.raw`Drag the start (Lisbon) or the globe and set the bearing $\beta$. The track is drawn to $89.9^\circ$ on the globe; gold dots mark its crossings with every $30^\circ$ meridian, where the readout measures the crossing angle. The middle panel looks straight down on the pole the track is heading for: zoom by up to a million and the spiral looks exactly the same. The strip plots turns round the pole against distance sailed: the turns blow up at the finite distance $L$. Set $\beta = 90^\circ$ for a parallel, which never arrives.`,
      deps: ['geog-1.2', 'pma-6.21'],
      see: ['geog-4.3'],
      refs: ['Snyder §7'],
      tags: ['navigation', 'loxodrome'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rhumb_line' },
      viz(v) {
        const beta = v.slider('bearing $\\beta$', 1, 179, 62, { step: 1, int: true, fmt: (x) => `${x.toFixed(0)}° (${compass(x)})` });
        const zoom = v.slider('zoom on the pole', 1, 1e6, 1, { log: true, sig: 2, fmt: (x) => '×' + (x < 1e3 ? x.toFixed(x < 10 ? 1 : 0) : x < 1e6 ? comma(x) : '10⁶') });
        const sA = v.stage({ height: 340 });
        const sB = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 340 });
        const sC = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 200, full: true, xlabel: 'distance sailed (km)', ylabel: 'turns round the pole' });
        const G = v.globe(sA, { projection: 'orthographic', center: [-40, 46], graticule: 15 });
        const S = G.handle(-9.14, 38.72, { label: 'start', color: 'accent', constrain: (l, f) => [l, clamp(f, -80, 80)] });
        let hemi = 1;
        function info() {
          const b = beta.value, sg = Math.cos(b * D2R) >= 0 ? 1 : -1, par = b === 90;
          const f0 = S.lat, l0 = S.lon, cb = Math.abs(Math.cos(b * D2R));
          const L = par ? Infinity : (R_MEAN * (90 - sg * f0) * D2R) / cb;
          return { b, sg, par, f0, l0, L, t: Math.tan(b * D2R) };
        }
        function crossings(pts) {
          const out = [];
          for (let i = 1; i < pts.length && out.length < 14; i++) {
            if (Math.floor(pts[i][0] / 30) !== Math.floor(pts[i - 1][0] / 30)) out.push({ p: pts[i], ang: chordBearing(pts[i - 1], pts[i]) });
          }
          return out;
        }
        let last = null;
        v.render(() => {
          const I = info();
          if (I.sg !== hemi) { hemi = I.sg; G.set({ center: [G.center[0], 46 * hemi] }); }
          G.draw();
          let pts;
          if (I.par) { pts = []; for (let k = 0; k <= 360; k += 2) pts.push([I.l0 + k, I.f0]); }
          else pts = loxodrome(I.l0, I.f0, I.b, 89.9 * I.sg);
          G.path(pts, { geodesic: false, color: 'red', width: 2.4 });
          const cr = crossings(pts);
          for (const c of cr) G.dot(c.p, { r: 3.2, color: 'gold', ring: false });
          G.dot([0, 90 * I.sg], { r: 3, color: 'ink' });
          last = { I, cr, turns89: I.par ? 1 : Math.abs(pts[pts.length - 1][0] - I.l0) / 360 };
          // ---- polar stereographic close-up: r = 2 e^{−σψ}, θ = λ (a logarithmic spiral)
          const sg = I.sg, r0 = 2 * Math.exp(-sg * psi(I.f0)), W = (1.12 * r0) / zoom.value;
          sB.setView([-W, W], [-W, W]);
          const P = (r, lam) => [r * Math.sin(lam * D2R), -sg * r * Math.cos(lam * D2R)];
          for (let l = 0; l < 360; l += 30) { const q = P(3 * W, l); sB.line(0, 0, q[0], q[1], { color: 'muted', width: 0.8, alpha: 0.45 }); }
          // parallels at "nice" colatitudes
          const cmax = 2 * Math.atan(1.5 * W / 2) * R2D;
          const rings = []; for (let e = -9; e <= 2; e++) for (const m of [1, 2, 5]) { const c = m * 10 ** e; if (c < cmax && c > cmax / 25 && c < 180) rings.push(c); }
          let lastLab = 0;
          for (const c of rings.sort((x, y) => y - x)) {
            const r = 2 * Math.tan((c * D2R) / 2);
            sB.circle(0, 0, r, { color: 'muted', width: 0.8, alpha: 0.5 });
            if (lastLab && r > lastLab / 2.2) continue; lastLab = r;
            const km = c * D2R * R_MEAN, lab = km >= 1 ? `${comma(km, km < 10 ? 1 : 0)} km` : km >= 1e-3 ? `${comma(km * 1000, km < 0.01 ? 1 : 0)} m` : `${comma(km * 1e6, 1)} mm`;
            sB.text(lab, r * 0.71, r * 0.71, { size: 10, color: 'muted', dx: 3 });
          }
          sB.dot(0, 0, { r: 3.5, color: 'ink' });
          let turnsIn = 0;
          if (I.par) sB.circle(0, 0, r0, { color: 'red', width: 2.4 });
          else {
            const sp0 = sg * psi(I.f0), spA = Math.max(sp0, Math.log(2 / (3 * W))), spB = Math.log(2 / (W / 300));
            const n = Math.min(60000, Math.ceil((Math.abs(I.t) * (spB - spA) * R2D) / 3) + 200), pts2 = [];
            for (let i = 0; i <= n; i++) { const sp = spA + ((spB - spA) * i) / n, lam = I.l0 + Math.abs(I.t) * (sp - sp0) * R2D * Math.sign(Math.sin(I.b * D2R)); pts2.push(P(2 * Math.exp(-sp), lam)); }
            sB.path(pts2, { color: 'red', width: 2.2 });
            const spV = Math.max(sp0, Math.log(2 / W));
            turnsIn = (Math.abs(I.t) * (spB - spV)) / (2 * Math.PI);
          }
          if (zoom.value < 1.5) { const q = P(r0, I.l0); sB.dot(q[0], q[1], { r: 5, color: 'accent' }); }
          sB.corner(`${sg > 0 ? 'North' : 'South'} Pole from above · ×${zoom.value < 1e3 ? zoom.value.toFixed(zoom.value < 10 ? 1 : 0) : comma(zoom.value)}`, 'tl', { color: 'ink', weight: 600, plate: true });
          if (!I.par) sB.corner(`${turnsIn > 99 ? comma(turnsIn) : turnsIn.toFixed(1)} turns inside this window`, 'bl', { color: 'red', plate: true });
          // ---- turns against distance
          if (I.par) {
            sC.setView([0, 2 * Math.PI * R_MEAN * Math.cos(I.f0 * D2R)], [0, 1.6]);
            sC.hline(0, { color: 'red', width: 2.4 });
            sC.text('a parallel: it circles the globe without approaching the pole', sC.xr[1] * 0.5, 0.8, { align: 'center', size: 12, color: 'red' });
          } else {
            const turns = (d) => (Math.abs(I.t) * Math.abs(psi(I.f0 + (Math.cos(I.b * D2R) * d / R_MEAN) * R2D) - psi(I.f0))) / (2 * Math.PI);
            const ymax = Math.max(1, turns(I.L * (1 - 1e-4)) * 1.12);
            sC.setView([0, I.L * 1.06], [0, ymax]);
            sC.vline(I.L, { color: 'green', width: 1.8, dash: [6, 4] });
            sC.text(`pole: L = ${comma(I.L)} km`, I.L, ymax * 0.93, { align: 'right', dx: -6, size: 11.5, color: 'green', weight: 600 });
            sC.fn(turns, { domain: [0, I.L * (1 - 1e-9)], n: 900, color: 'red', width: 2.4 });
            for (let k = 1; k < ymax; k++) sC.hline(k, { color: 'faint', width: 0.6 });
          }
          v.legend([['red', 'loxodrome (constant bearing)'], ['gold', 'crossings of the 30° meridians', { dot: true }], ['green', 'distance to the pole', { dash: true }]]);
        });
        v.readout(() => {
          if (!last) return '';
          const { I, cr } = last;
          const angs = cr.map((c) => c.ang), lo = Math.min(...angs), hi = Math.max(...angs);
          const m = angs.length ? `At the first ${angs.length} meridian crossings the course makes **${lo.toFixed(2)}°–${hi.toFixed(2)}°** with north (target ${I.b}°).` : '';
          if (I.par) return `$\\beta = 90^\\circ$: the loxodrome is the parallel $\\varphi = ${I.f0.toFixed(1)}^\\circ$, a closed curve of length $2\\pi R\\cos\\varphi = ${comma(2 * Math.PI * R_MEAN * Math.cos(I.f0 * D2R))}$ km; it never reaches a pole. ${m}`;
          return `${m} Length to the ${I.sg > 0 ? 'North' : 'South'} Pole $L = R\\,\\Delta\\varphi/|\\cos\\beta| = ${comma(I.L)}$ km — finite — yet $\\lambda - \\lambda_0 = \\tan\\beta\\,(\\psi - \\psi_0)$ grows without bound: **${last.turns89.toFixed(1)} turns** by $89.9^\\circ$, **${((Math.abs(I.t) * Math.abs(psi(I.sg * 89.999999) - psi(I.f0))) / (2 * Math.PI)).toFixed(1)}** by $89.999999^\\circ$ (11 cm from the pole), and infinitely many in all.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Proposition',
      name: 'Great circle versus rhumb line',
      statement: String.raw`Between two points on a sphere the great-circle arc (1.3) is never longer than the rhumb line, and strictly shorter unless both lie on one meridian or on the equator. The great circle's bearing changes continuously along the way (except on meridians and the equator), while the rhumb line keeps one bearing. For two points on the same parallel $\varphi$ separated by $\Delta\lambda$, the rhumb line runs along the parallel with length $R\,\Delta\lambda\cos\varphi$, while the great circle has length $2R\arcsin\!\big(\cos\varphi\,\sin\tfrac{\Delta\lambda}{2}\big)$; the saving grows with both $\Delta\lambda$ and $|\varphi|$, toward $1 - 2/\pi \approx 36\%$ for antipodal longitudes near a pole.`,
      idea: String.raw`The great circle is the shortest path (1.3), so it can only win. The size of the win depends on how far the parallel is from being a geodesic: the equator and meridians are great circles, while a parallel at latitude $\varphi$ turns sideways with geodesic curvature $\tan\varphi/R$, so a high-latitude east–west course wastes most. The haversine formula (1.4) gives the great-circle length and the loxodrome formula (2.1) the rhumb length; the great circle's bearing along the way follows from the initial-bearing formula applied at each point. Navigators therefore sailed great circles as a series of short rhumb-line legs, changing course at waypoints.`,
      caption: String.raw`Drag either port or pick a route. At six points along each route a wedge spans the angle from north (black tick) to the heading: identical wedges on the red rhumb line, turning ones on the green great circle. The right panel plots heading against distance sailed for both routes. The heat map shows the percentage saving for two points on one parallel, against latitude and longitude difference; the white dot is the east–west equivalent of your route (its mean latitude and longitude gap).`,
      deps: ['geog-2.1', 'geog-1.4'],
      refs: ['Snyder §5', 'Snyder §7'],
      tags: ['navigation', 'great circles'],
      viz(v) {
        const ROUTES = {
          pac: { a: [139.65, 35.44], b: [-122.42, 37.77], c: [-170, 18], label: 'Yokohama → San Francisco' },
          atl: { a: [-9.14, 38.72], b: [-74.01, 40.71], c: [-42, 45], label: 'Lisbon → New York' },
          ind: { a: [18.42, -33.92], b: [115.86, -31.95], c: [67, -45], label: 'Cape Town → Perth' },
          ns: { a: [-17.44, 14.69], b: [-34.88, -8.05], c: [-25, 5], label: 'Dakar → Recife' },
        };
        const route = v.select('route', Object.entries(ROUTES).map(([k, r]) => ({ value: k, label: r.label })), 'pac', {
          onChange: (k) => { const r = ROUTES[k]; A.set(r.a[0], r.a[1]); B.set(r.b[0], r.b[1]); G.set({ center: r.c }); },
        });
        const sA = v.stage({ height: 340 });
        const sB = v.stage({ x: [0, 1], y: [0, 360], axes: 'box', gutter: true, height: 340, xlabel: 'distance sailed (km)', ylabel: 'heading' });
        const sC = v.stage({ x: [0, 180], y: [0, 85], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'longitude difference Δλ (°) between two points on one parallel', ylabel: 'latitude (°)' });
        const R0 = ROUTES.pac;
        const G = v.globe(sA, { projection: 'orthographic', center: R0.c, graticule: 15 });
        const A = G.handle(R0.a[0], R0.a[1], { label: 'A', color: 'accent' }), B = G.handle(R0.b[0], R0.b[1], { label: 'B', color: 'accent' });
        const save = (dl, f) => { const g = 2 * Math.asin(Math.cos(f * D2R) * Math.sin((dl * D2R) / 2)), r = dl * D2R * Math.cos(f * D2R); return r > 1e-9 ? 100 * (1 - g / r) : 0; };
        function profile() {
          const a = [A.lon, A.lat], b = [B.lon, B.lat], gc = v.geo('haversine', a, b), rh = v.geo('rhumb', a, b);
          const pts = v.geo('interpolate', a, b, 120), hd = [];
          let prev = null;
          for (let i = 0; i <= 120; i++) {
            let h = i < 120 ? v.geo('bearing', pts[i], b) : mod(v.geo('bearing', b, a) + 180, 360);
            if (prev != null) h = prev + wrap180(h - prev);
            hd.push([(gc * i) / 120, h]); prev = h;
          }
          let rb = rh.bearing; rb = hd[0][1] + wrap180(rb - hd[0][1]);
          return { a, b, gc, rl: rh.length, rb, hd, pts, rpts: rh.points };
        }
        v.render(() => {
          const P = profile();
          G.draw();
          G.rhumbLine(P.a, P.b, { color: 'red', width: 2.2, dash: [7, 5] });
          G.greatCircle(P.a, P.b, { color: 'green', width: 2.8 });
          for (let i = 1; i <= 6; i++) {
            const q = P.pts[Math.round((i * 120) / 7)], h = v.geo('bearing', q, P.b);
            const r = P.rpts[Math.round((i * (P.rpts.length - 1)) / 7)];
            for (const [p0, hh, col] of [[q, h, 'green'], [r, mod(P.rb, 360), 'red']]) {
              const d = wrap180(hh), wedge = [p0];
              for (let j = 0; j <= 16; j++) wedge.push(v.geo('destination', p0, (d * j) / 16, 4.6));
              G.polygon([wedge], { fill: col, fillAlpha: 0.35, color: col, width: 1, geodesic: false });
              G.path([p0, v.geo('destination', p0, 0, 5.6)], { color: 'ink', width: 1.2, alpha: 0.75 });
            }
          }
          // headings
          const hs = P.hd.map((p) => p[1]).concat([P.rb]), lo = Math.min(...hs), hi = Math.max(...hs), mid = (lo + hi) / 2, half = Math.max(50, (hi - lo) / 2 + 15);
          sB.setView([0, Math.max(P.gc, P.rl) * 1.04], [mid - half, mid + half]);
          const tk = []; for (let y = Math.ceil((mid - half) / 45) * 45; y <= mid + half; y += 45) tk.push([y, `${Math.round(mod(y, 360)) % 360}°`]);
          sB.setTicks(undefined, tk);
          sB.path([[0, P.rb], [P.rl, P.rb]], { color: 'red', width: 2.4, dash: [7, 5] });
          sB.path(P.hd, { color: 'green', width: 2.6 });
          sB.dot(P.rl, P.rb, { r: 4, color: 'red' }); sB.dot(P.gc, P.hd[120][1], { r: 4, color: 'green' });
          sB.text('arrive', P.gc, P.hd[120][1], { size: 11, color: 'green', dx: -6, dy: P.hd[120][1] > P.rb ? -10 : 12, align: 'right' });
          // savings map
          sC.heat((x, y) => save(x, y), { range: [0, 40], cmap: 'theme', color: 'green', key: 'save', res: 3 });
          sC.contour((x, y) => save(x, y), [1, 5, 10, 20, 30], { color: 'ink', alpha: 0.55, width: 1, labels: true, fmt: (x) => x + '%', res: 90 });
          let dl = Math.abs(wrap180(P.b[0] - P.a[0])), fm = Math.abs((P.a[1] + P.b[1]) / 2);
          sC.dot(dl, Math.min(fm, 84), { r: 6, color: 'panel' });
          sC.dot(dl, Math.min(fm, 84), { r: 3, color: 'ink' });
          sC.text(`your route: ${(100 * (1 - P.gc / P.rl)).toFixed(1)}%`, dl, Math.min(fm, 84), { size: 12, weight: 600, align: dl > 140 ? 'right' : dl < 30 ? 'left' : 'center', dy: fm > 70 ? 16 : -14, plate: true });
          v.legend([['green', 'great circle'], ['red', 'rhumb line', { dash: true }], ['green', 'saving on one parallel (%)', { area: true }]]);
        });
        v.readout(() => {
          const P = profile(), h0 = mod(P.hd[0][1], 360), h1 = mod(P.hd[120][1], 360);
          return `Great circle **${comma(P.gc)} km**, heading changes from ${deg3(h0)} to ${deg3(h1)} (a turn of ${Math.abs(P.hd[120][1] - P.hd[0][1]).toFixed(1)}°) · rhumb line **${comma(P.rl)} km** at a constant ${deg3(P.rb)} (${compass(P.rb)}) · the great circle saves **${comma(P.rl - P.gc)} km (${(100 * (1 - P.gc / P.rl)).toFixed(1)}%)**. On one parallel at the route's mean latitude the formula predicts ${save(Math.abs(wrap180(P.b[0] - P.a[0])), Math.abs((P.a[1] + P.b[1]) / 2)).toFixed(1)}%.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Method',
      name: 'Dead reckoning',
      statement: String.raw`**Dead reckoning** estimates a vessel's position by integrating its logged velocity from a known starting point: with logged speed $V(t)$ and heading $H(t)$ (clockwise from north),
$$\hat{\mathbf x}(t) = \mathbf x_0 + \int_0^t V\,(\sin H,\ \cos H)\,dt' .$$
The true position adds whatever the log and compass do not see: steering noise, compass and log calibration errors, and the set and drift of currents and leeway. Random errors that are independent from hour to hour make the position error grow like $\sqrt t$; systematic errors (a compass bias, a mis-calibrated log, an unknown current) make it grow like $t$. Dead reckoning therefore needs periodic *fixes* — celestial sights (2.4), landmarks, or today satellites — to reset the error.`,
      idea: String.raw`The estimate is a sum of many small displacement vectors, so its error is the sum of their errors. Independent errors add in quadrature (the variance of a sum is the sum of variances), giving the random-walk $\sqrt t$ law; a constant error adds coherently, giving $t$. A heading error $\delta H$ displaces the ship sideways by about $V t\,\delta H$, a speed error lengthens the track along it, so the cloud of possible positions stretches into an ellipse whose axes follow the course. A current $\mathbf c$ simply adds $\mathbf c\,t$, which the navigator cannot see at all until a fix reveals it. Apply variance additivity (prob 2.2.1) to each coordinate's independent, zero-mean finite-variance displacement errors. For equal interval variances the coordinate variance grows as $n$, and its standard deviation as $\sqrt n$. Correlation between intervals adds covariance terms, while a shared bias accumulates coherently; neither is covered by that square-root rule.`,
      caption: String.raw`Slide the time and the error sizes. Blue: the navigator's dead-reckoning track (it jumps to the true position at each fix when fixes are on). Gold: where the ship really went in one voyage. Purple: 400 possible true positions given the same log, with their 95% error ellipse (orange) centred on the cloud. The teal arrow is the unseen drift from the current. Below: the root-mean-square error against time, against the current's drift and the $\sqrt t$ growth that steering noise alone would give. All errors are illustrative.`,
      deps: ['geog-2.1', 'prob-2.2.1'],
      see: ['geog-1.9'],
      refs: ['Haggett'],
      tags: ['navigation', 'error propagation'],
      viz(v) {
        const tt = v.slider('time $t$', 0, 36, 30, { step: 0.25, fmt: (x) => x.toFixed(2).replace(/\.?0+$/, '') + ' h' });
        const sh = v.slider('steering noise (per hour) σ', 0, 10, 4, { step: 0.5, fmt: (x) => x.toFixed(1) + '°' });
        const sb = v.slider('compass bias σ', 0, 5, 1.5, { step: 0.1, fmt: (x) => x.toFixed(1) + '°' });
        const sv = v.slider('log (speed) error σ', 0, 15, 4, { step: 0.5, fmt: (x) => x.toFixed(1) + '%' });
        const cs = v.slider('current speed', 0, 2, 0.8, { step: 0.05, fmt: (x) => x.toFixed(2) + ' kn' });
        const cd = v.slider('current sets toward', 0, 359, 200, { step: 1, int: true, fmt: (x) => deg3(x) });
        const fix = v.toggle('fix the position every 12 h', false);
        let seed = 3;
        v.button('New voyage', () => { seed++; });
        const sA = v.stage({ x: [-25, 415], y: [-95, 195], equal: true, axes: false, height: 380, weight: 1.5 });
        const sB = v.stage({ x: [0, 36], y: [0, 1], axes: 'box', gutter: true, height: 380, xlabel: 'hours since departure', ylabel: 'position error (nmi)' });
        const PLAN = [[72, 12, 12], [112, 12, 12], [45, 12, 12]]; // [heading °, speed kn, hours]
        const legAt = (k) => { let s = 0; for (const p of PLAN) { s += p[2]; if (k < s) return p; } return PLAN[PLAN.length - 1]; };
        const NR = 400, NH = 36;
        let cache = null, key = '';
        function sim() {
          const kk = [sh.value, sb.value, sv.value, cs.value, cd.value, fix.value, seed].join();
          if (kk === key) return cache; key = kk;
          const rng = v.rng(seed * 7919 + 1), cx = cs.value * Math.sin(cd.value * D2R), cy = cs.value * Math.cos(cd.value * D2R);
          const nom = [[0, 0]];
          for (let k = 0; k < NH; k++) { const [h, s] = legAt(k), p = nom[k]; nom.push([p[0] + s * Math.sin(h * D2R), p[1] + s * Math.cos(h * D2R)]); }
          const offX = [], offY = [], tr0 = [], dr0 = [];
          for (let r = 0; r < NR; r++) {
            const bias = rng.normal() * sb.value, kv = 1 + (rng.normal() * sv.value) / 100;
            let T = [0, 0], Dp = [0, 0];
            const ox = new Float64Array(NH + 1), oy = new Float64Array(NH + 1);
            if (r === 0) { tr0.push([0, 0]); dr0.push([[0, 0]]); }
            for (let k = 0; k < NH; k++) {
              const [h, s] = legAt(k), hh = (h + bias + rng.normal() * sh.value) * D2R;
              T = [T[0] + s * kv * Math.sin(hh) + cx, T[1] + s * kv * Math.cos(hh) + cy];
              Dp = [Dp[0] + s * Math.sin(h * D2R), Dp[1] + s * Math.cos(h * D2R)];
              if (r === 0) dr0[dr0.length - 1].push(Dp.slice());
              if (fix.value && (k + 1) % 12 === 0 && k + 1 < NH) { Dp = T.slice(); if (r === 0) dr0.push([Dp.slice()]); }
              ox[k + 1] = T[0] - Dp[0]; oy[k + 1] = T[1] - Dp[1];
              if (r === 0) tr0.push(T.slice());
            }
            offX.push(ox); offY.push(oy);
          }
          // statistics per hour
          const rms = [], mx = [], my = [], sxx = [], sxy = [], syy = [];
          for (let k = 0; k <= NH; k++) {
            let a = 0, b = 0, q = 0;
            for (let r = 0; r < NR; r++) { a += offX[r][k]; b += offY[r][k]; q += offX[r][k] ** 2 + offY[r][k] ** 2; }
            a /= NR; b /= NR; mx.push(a); my.push(b); rms.push(Math.sqrt(q / NR));
            let u = 0, w = 0, z = 0;
            for (let r = 0; r < NR; r++) { const dx = offX[r][k] - a, dy = offY[r][k] - b; u += dx * dx; w += dx * dy; z += dy * dy; }
            sxx.push(u / (NR - 1)); sxy.push(w / (NR - 1)); syy.push(z / (NR - 1));
          }
          return (cache = { nom, offX, offY, tr0, dr0, rms, mx, my, sxx, sxy, syy, cx, cy });
        }
        const lerp2 = (A, t) => { const k = Math.min(NH - 1, Math.floor(t)), f = t - k; return [A[k][0] + (A[k + 1][0] - A[k][0]) * f, A[k][1] + (A[k + 1][1] - A[k][1]) * f]; };
        const lerpA = (a, t) => { const k = Math.min(NH - 1, Math.floor(t)), f = t - k; return a[k] + (a[k + 1] - a[k]) * f; };
        function drAt(S, t) { // run-0 dead-reckoning position at time t (piecewise between fixes)
          const seg = fix.value ? Math.min(S.dr0.length - 1, Math.floor(t / 12 - 1e-9)) : 0, s0 = seg * 12;
          const path = S.dr0[Math.max(0, seg)], u = t - s0, k = Math.min(path.length - 2, Math.floor(u)), f = u - k;
          return [path[k][0] + (path[k + 1][0] - path[k][0]) * f, path[k][1] + (path[k + 1][1] - path[k][1]) * f];
        }
        v.render(() => {
          const S = sim(), t = tt.value;
          // chart furniture
          const [X0, X1] = sA.xr, [Y0, Y1] = sA.yr;
          for (let x = Math.ceil(X0 / 50) * 50; x <= X1; x += 50) sA.line(x, Y0, x, Y1, { color: 'grid', width: 0.7 });
          for (let y = Math.ceil(Y0 / 50) * 50; y <= Y1; y += 50) sA.line(X0, y, X1, y, { color: 'grid', width: 0.7 });
          sA.arrow(X0 + 18, Y1 - 50, X0 + 18, Y1 - 18, { color: 'ink', head: 7, width: 1.6 }); sA.text('N', X0 + 18, Y1 - 56, { size: 12, weight: 700, align: 'center', baseline: 'top' });
          sA.line(X1 - 70, Y0 + 12, X1 - 20, Y0 + 12, { color: 'ink', width: 2 }); sA.text('50 nmi', X1 - 45, Y0 + 16, { align: 'center', size: 11, baseline: 'bottom' });
          sA.path(S.nom, { color: 'muted', width: 1, dash: [2, 4] });
          sA.text('planned course', S.nom[36][0] - 6, S.nom[36][1] + 6, { size: 11, color: 'muted', align: 'right' });
          for (const p of S.dr0) sA.path(p, { color: 'accent', width: 2, dash: [6, 3] });
          // true track of this voyage up to t
          const k = Math.floor(t), tr = S.tr0.slice(0, k + 1); if (t > k) tr.push(lerp2(S.tr0, t));
          sA.path(tr, { color: 'gold', width: 2.6 });
          if (fix.value) for (let h = 12; h < 36 && h <= t; h += 12) sA.dot(S.tr0[h][0], S.tr0[h][1], { r: 5, color: 'green', label: 'fix', labelPos: 'n', labelColor: 'green', math: false });
          // cloud + ellipse at t
          const D = drAt(S, t);
          for (let r = 0; r < S.offX.length; r++) sA.dot(D[0] + lerpA(S.offX[r], t), D[1] + lerpA(S.offY[r], t), { r: 1.6, color: 'purple', alpha: 0.45, ring: false });
          const E = covEllipse(D[0] + lerpA(S.mx, t), D[1] + lerpA(S.my, t), lerpA(S.sxx, t), lerpA(S.sxy, t), lerpA(S.syy, t), Math.sqrt(5.991));
          sA.path(E.pts, { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.08 });
          const tc0 = fix.value ? t - Math.min(24, Math.floor(t / 12 - 1e-9) * 12) : t;
          if (cs.value > 0 && tc0 > 0.5) sA.arrow(D[0], D[1], D[0] + S.cx * tc0, D[1] + S.cy * tc0, { color: 'teal', width: 2, head: 7 });
          const T = lerp2(S.tr0, t);
          sA.dot(D[0], D[1], { r: 5, color: 'accent', label: 'DR', labelPos: 'nw', math: false });
          sA.dot(T[0], T[1], { r: 5, color: 'gold', label: 'true', labelPos: 'se', math: false });
          sA.dot(0, 0, { r: 4, color: 'ink', label: 'departure', labelPos: 'se', math: false });
          // errors against time
          const ts = S.rms.map((r, i) => [i, r]), run0 = S.tr0.map((p, i) => [i, Math.hypot(S.offX[0][i], S.offY[0][i])]);
          const drift = (h) => cs.value * (fix.value ? h - clamp(Math.floor((h - 1e-9) / 12), 0, 2) * 12 : h);
          const ymax = Math.max(5, ...S.rms, ...run0.map((p) => p[1]), drift(36)) * 1.1;
          sB.setView([0, 36], [0, ymax]);
          const g = 12 * sh.value * D2R; // steering noise alone: σ_lateral = V·σ_H per hour, adding in quadrature
          if (g > 0) sB.fn((h) => g * Math.sqrt(fix.value ? h - clamp(Math.floor((h - 1e-9) / 12), 0, 2) * 12 : h), { color: 'muted', width: 1.4, dash: [3, 4], n: 400 });
          if (cs.value > 0) sB.fn((h) => drift(h), { color: 'teal', width: 1.6, dash: [6, 4], n: 400 });
          sB.path(run0, { color: 'gold', width: 1.8 });
          sB.path(ts, { color: 'purple', width: 2.6 });
          sB.vline(t, { color: 'muted', dash: [3, 3] });
          sB.dot(t, lerpA(S.rms, t), { r: 5, color: 'purple' });
          v.legend([['accent', 'dead reckoning', { dash: true }], ['gold', 'true track (this voyage)'], ['purple', 'possible positions; RMS error'], ['orange', '95% error ellipse', { area: true }], ['teal', 'drift from the current', { dash: true }], ['muted', String.raw`steering noise alone, $V\sigma_H\sqrt t$`, { dash: true }]]);
        });
        v.readout(() => {
          const S = sim(), t = tt.value, D = drAt(S, t), T = lerp2(S.tr0, t);
          const E = covEllipse(0, 0, lerpA(S.sxx, t), lerpA(S.sxy, t), lerpA(S.syy, t), Math.sqrt(5.991));
          const err = Math.hypot(T[0] - D[0], T[1] - D[1]);
          return `After ${t.toFixed(2).replace(/\.?0+$/, '')} h: this voyage's true position is **${err.toFixed(1)} nmi** (${(err * NM).toFixed(1)} km) from the dead-reckoning estimate; over 400 voyages the RMS error is **${lerpA(S.rms, t).toFixed(1)} nmi**, the 95% ellipse has semi-axes ${E.a.toFixed(1)} × ${E.b.toFixed(1)} nmi, and its centre is displaced ${Math.hypot(lerpA(S.mx, t), lerpA(S.my, t)).toFixed(1)} nmi by the current — an error no amount of careful logging reveals.${fix.value ? ' Each fix resets the error to zero.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Method',
      name: 'Celestial navigation: latitude from Polaris and the Sun',
      statement: String.raw`An observer's latitude can be read from the sky with an instrument that measures altitude above the horizon.
(a) **Polaris.** The north celestial pole stands at an altitude equal to the observer's latitude $\varphi$. Polaris lies within about $0.7^\circ$ of the pole (0.66° in 2018), so its altitude $H$ gives $\varphi \approx H - p\cos t$, where $p$ is its polar distance and $t$ its local hour angle; without the correction the error is at most $p$, about 40 nautical miles.
(b) **The noon Sun.** When the Sun crosses the meridian at declination $\delta$, its altitude is $H_\odot = 90^\circ - |\varphi - \delta|$, so $\varphi = \delta + (90^\circ - H_\odot)$ when the Sun bears south and $\varphi = \delta - (90^\circ - H_\odot)$ when it bears north. The declination for the date comes from an almanac; it swings between about $\pm 23.44^\circ$, the obliquity of the ecliptic.
Polaris is invisible south of the equator, where only the Sun (or southern stars) can be used.`,
      idea: String.raw`The stars are so far away that the direction to the celestial pole is the direction of the Earth's axis everywhere. The horizon is perpendicular to the local vertical, which makes the angle $\varphi$ with the equatorial plane (1.2); turning both by a right angle shows that the horizon makes the angle $\varphi$ with the axis, so the pole's altitude is $\varphi$. The Sun's rays are parallel too and make the angle $\delta$ with the equatorial plane, so its zenith distance at noon is the difference $|\varphi - \delta|$ — the same parallel-ray geometry Eratosthenes used (1.1). One minute of arc of altitude error is one nautical mile of latitude error, which is why the nautical mile was defined that way.`,
      caption: String.raw`Drag the observer around the Earth's cross-section (left). The horizon (dashed) makes the angle $\varphi$ with the direction to Polaris, parallel to the axis, and the noon Sun's rays arrive at the declination $\delta$ set by the date. The dome (right) is the observer's meridian, north horizon to south horizon: Polaris (with its small daily circle about the pole, exaggerated ×20 if you like) and the noon Sun. The readout recovers the latitude from each, with and without the Polaris correction.`,
      deps: ['geog-1.2'],
      see: ['geog-1.1', 'geog-1.9'],
      refs: ['Haggett'],
      tags: ['navigation', 'astronomy'],
      viz(v) {
        const day = v.slider('date', 1, 365, 172, { step: 1, int: true, fmt: (d) => { const dt = new Date(Date.UTC(2026, 0, d)); return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }); } });
        const lha = v.slider("Polaris' hour angle $t$", 0, 360, 60, { step: 1, int: true, fmt: (x) => x.toFixed(0) + '°' });
        const corr = v.toggle('apply the Polaris correction', true);
        const exag = v.toggle("exaggerate Polaris' circle ×20", true);
        const sA = v.stage({ x: [-1.75, 2.15], y: [-1.45, 1.6], equal: true, axes: false, height: 350 });
        const sB = v.stage({ x: [-1.25, 1.25], y: [-0.42, 1.28], equal: true, axes: false, height: 350, title: "the observer's meridian sky" });
        const P_DIST = 0.66; // degrees: Polaris' distance from the pole in 2018 (Wikipedia)
        let phi = 40;
        const O = sA.handle(Math.cos(phi * D2R), Math.sin(phi * D2R), { color: 'accent', r: 7, constrain: (x, y) => { phi = clamp(Math.atan2(y, Math.max(0.05, x)) * R2D, -70, 80); return [Math.cos(phi * D2R), Math.sin(phi * D2R)]; } });
        // solar declination: an approximate formula (illustrative; navigators use the Nautical Almanac)
        const decl = (d) => { const g = (2 * Math.PI / 365.24) * (d - 1); return Math.asin(Math.sin(-23.44 * D2R) * Math.cos((2 * Math.PI / 365.24) * (d + 9) + 2 * 0.0167 * Math.sin(g - 0.04))) * R2D; };
        const polarisAlt = (f, t) => { const dp = (90 - P_DIST) * D2R; return Math.asin(Math.sin(f * D2R) * Math.sin(dp) + Math.cos(f * D2R) * Math.cos(dp) * Math.cos(t * D2R)) * R2D; };
        v.render(() => {
          const f = phi, fr = f * D2R, d = decl(day.value), dr = d * D2R, ox = Math.cos(fr), oy = Math.sin(fr);
          O.x = ox; O.y = oy;
          // ---- cross-section
          sA.circle(0, 0, 1, { fill: 'blue', fillAlpha: 0.08, color: 'blue', width: 1.5 });
          sA.line(0, -1.3, 0, 1.3, { color: 'muted', width: 1.2 });
          sA.text('axis', 0.04, -1.36, { size: 10.5, color: 'muted', baseline: 'top' });
          sA.line(-1.15, 0, 1.15, 0, { color: 'muted', width: 1, dash: [4, 3] });
          sA.text('equator', -1.12, 0.05, { size: 10.5, color: 'muted', baseline: 'bottom' });
          sA.text('N', 0, 1.34, { size: 12, weight: 700, align: 'center', baseline: 'bottom' });
          // sunlight from the right at declination δ
          for (const off of [-0.9, -0.45, 0, 0.45, 0.9]) {
            const nx = -Math.sin(dr), ny = Math.cos(dr), bx = 2.1 * Math.cos(dr) + off * nx, by = 2.1 * Math.sin(dr) + off * ny;
            sA.arrow(bx, by, bx - 0.55 * Math.cos(dr), by - 0.55 * Math.sin(dr), { color: 'gold', width: 1.4, head: 6, alpha: 0.85 });
          }
          sA.text(`noon Sun, δ = ${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}°`, 2.1, -1.32, { size: 11.5, color: 'gold', align: 'right', weight: 600 });
          sA.line(0, 0, ox * 1.0, oy * 1.0, { color: 'muted', width: 1, dash: [3, 3] });
          sA.path(arcPts(0, 0, 0.3, 0, fr, 20), { color: 'purple', width: 2 });
          sA.tex('\\varphi', 0.42 * Math.cos(fr / 2), 0.42 * Math.sin(fr / 2), { color: 'purple', size: 14 });
          // horizon, zenith, Polaris and Sun directions at O
          const tN = [-Math.sin(fr), Math.cos(fr)];
          sA.line(ox - 0.75 * tN[0], oy - 0.75 * tN[1], ox + 0.75 * tN[0], oy + 0.75 * tN[1], { color: 'ink', width: 1.4, dash: [6, 4] });
          sA.text('horizon', ox - 0.72 * tN[0], oy - 0.72 * tN[1], { size: 10.5, color: 'muted', dx: 6 });
          sA.arrow(ox, oy, ox * 1.5, oy * 1.5, { color: 'muted', width: 1.2, head: 6 });
          sA.text('zenith', ox * 1.52, oy * 1.52, { size: 10.5, color: 'muted', dx: 4 });
          sA.arrow(ox, oy, ox, oy + 0.62, { color: 'teal', width: 2, head: 7 });
          sA.text('★ to Polaris', ox, oy + 0.66, { size: 11.5, color: 'teal', weight: 600, align: 'center', baseline: 'bottom' });
          const aN = Math.atan2(tN[1], tN[0]);
          if (f > 0.5) { sA.path(arcPts(ox, oy, 0.26, Math.PI / 2, aN, 16), { color: 'teal', width: 2 }); sA.tex('\\varphi', ox + 0.38 * Math.cos((Math.PI / 2 + aN) / 2), oy + 0.38 * Math.sin((Math.PI / 2 + aN) / 2), { color: 'teal', size: 13 }); }
          const sunSouth = f >= d, hS = 90 - Math.abs(f - d), tS = sunSouth ? [Math.sin(fr), -Math.cos(fr)] : tN, aS = Math.atan2(tS[1], tS[0]);
          sA.line(ox, oy, ox + 0.7 * Math.cos(dr), oy + 0.7 * Math.sin(dr), { color: 'gold', width: 2 });
          let a1 = aS, a2 = dr; while (a2 - a1 > Math.PI) a2 -= 2 * Math.PI; while (a1 - a2 > Math.PI) a2 += 2 * Math.PI;
          sA.path(arcPts(ox, oy, 0.4, a1, a2, 16), { color: 'gold', width: 2 });
          sA.tex('H_\\odot', ox + 0.55 * Math.cos((a1 + a2) / 2), oy + 0.55 * Math.sin((a1 + a2) / 2), { color: 'gold', size: 13 });
          // ---- the meridian dome: N horizon on the left, S on the right
          const dome = (alt, north) => [(north ? -1 : 1) * Math.cos(alt * D2R), Math.sin(alt * D2R)];
          sB.rect(-1.25, -0.42, 1.25, 0, { fill: 'green', fillAlpha: 0.12, stroke: false });
          sB.line(-1.2, 0, 1.2, 0, { color: 'ink', width: 1.4 });
          sB.path(arcPts(0, 0, 1, 0, Math.PI, 90), { color: 'muted', width: 1.2 });
          sB.text('N', -1.08, -0.06, { size: 12, weight: 700, align: 'center', baseline: 'top' }); sB.text('S', 1.08, -0.06, { size: 12, weight: 700, align: 'center', baseline: 'top' });
          sB.line(0, 0.96, 0, 1.04, { color: 'muted', width: 1 }); sB.text('zenith', 0, 0.93, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' });
          for (const a of [30, 60]) for (const n of [true, false]) { const q = dome(a, n); sB.line(q[0] * 0.96, q[1] * 0.96, q[0] * 1.04, q[1] * 1.04, { color: 'muted', width: 1 }); }
          // celestial pole + Polaris
          const poleAlt = f, pv = dome(Math.abs(poleAlt), f >= 0);
          const Hp = polarisAlt(f, lha.value);
          if (f >= 0) {
            sB.line(0, 0, pv[0], pv[1], { color: 'teal', width: 1, dash: [3, 3] });
            const k = exag.value ? 20 : 1, rr = P_DIST * D2R * k, along = [Math.sin(poleAlt * D2R), Math.cos(poleAlt * D2R)], side = [along[1], -along[0]];
            sB.path(arcPts(pv[0], pv[1], rr, 0, 2 * Math.PI, 48), { color: 'teal', width: 1, alpha: 0.6 });
            sB.dot(pv[0], pv[1], { r: 2.5, color: 'ink' });
            const tl = lha.value * D2R, px = pv[0] + rr * (Math.cos(tl) * along[0] + Math.sin(tl) * side[0]), py = pv[1] + rr * (Math.cos(tl) * along[1] + Math.sin(tl) * side[1]);
            sB.text('★', px, py, { size: 15, color: 'teal', align: 'center', baseline: 'middle' });
            sB.text(`Polaris ${Hp.toFixed(2)}°`, pv[0] + 0.08, pv[1] + 0.14, { size: 11.5, color: 'teal', weight: 600 });
            sB.path(arcPts(0, 0, 0.3, Math.PI, Math.PI - poleAlt * D2R, 20), { color: 'teal', width: 2 });
          } else {
            sB.text('Polaris is below the horizon', -0.62, -0.22, { size: 11.5, color: 'muted', align: 'center' });
          }
          // celestial equator on the meridian and the noon Sun
          const eqAlt = 90 - Math.abs(f), ev = dome(eqAlt, f < 0);
          sB.dot(ev[0], ev[1], { r: 3, color: 'muted' });
          sB.text('celestial equator', ev[0], ev[1], { size: 10, color: 'muted', align: f < 0 ? 'right' : 'left', dx: f < 0 ? -6 : 6, dy: 8 });
          const sv2 = dome(hS, !sunSouth);
          sB.line(0, 0, sv2[0], sv2[1], { color: 'gold', width: 1, dash: [3, 3] });
          sB.dot(sv2[0], sv2[1], { r: 9, color: 'gold' });
          sB.text(`Sun ${hS.toFixed(2)}°`, sv2[0] + (sunSouth ? 0.08 : -0.08), sv2[1] + 0.08, { size: 11.5, color: 'gold', weight: 600, align: sunSouth ? 'left' : 'right', baseline: 'bottom' });
          v.legend([['teal', 'Polaris / celestial pole'], ['gold', 'noon Sun'], ['purple', 'latitude φ at the centre']]);
        });
        v.readout(() => {
          const f = phi, d = decl(day.value), hS = 90 - Math.abs(f - d), Hp = polarisAlt(f, lha.value);
          const fS = f >= d ? d + (90 - hS) : d - (90 - hS);
          const fP = corr.value ? Hp - P_DIST * Math.cos(lha.value * D2R) : Hp, eP = (fP - f) * 60;
          const sun = `Noon Sun: altitude $H_\\odot = ${hS.toFixed(2)}^\\circ$ bearing ${f >= d ? 'south' : 'north'}, declination $\\delta = ${d.toFixed(2)}^\\circ$ ⇒ $\\varphi = ${d.toFixed(2)}^\\circ ${f >= d ? '+' : '-'} ${(90 - hS).toFixed(2)}^\\circ = ${fS.toFixed(2)}^\\circ$.`;
          const pol = f >= 0 ? `Polaris: altitude ${Hp.toFixed(3)}° ⇒ $\\varphi \\approx ${fP.toFixed(3)}^\\circ$ ${corr.value ? `(after subtracting $p\\cos t = ${(P_DIST * Math.cos(lha.value * D2R)).toFixed(3)}^\\circ$)` : '(uncorrected)'}, off by **${Math.abs(eP).toFixed(1)}′ = ${Math.abs(eP).toFixed(1)} nmi**.` : 'Polaris is not visible from the southern hemisphere.';
          return `True latitude **${f.toFixed(2)}°**. ${pol} ${sun}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Method',
      name: 'Triangulation surveying',
      credit: 'Gemma Frisius, 1533 (proposed); Willebrord Snellius, 1615 (first large survey); Legendre, 1787 (spherical reduction)',
      statement: String.raw`**Triangulation** fixes the positions of many distant points from a single measured length, the *baseline*, and angles alone. In a chain of triangles each sharing a side with the next, the law of sines gives the two unknown sides of every triangle from the known one and its angles, $a = c\,\sin A/\sin C$, $b = c\,\sin B/\sin C$, and the computation marches along the chain. On the curved Earth the triangles are spherical, so their angles sum to $180^\circ$ plus the **spherical excess** $\varepsilon = \text{Area}/R^2$ (1.5) — about $1''$ for every 197 km² of triangle — and the planar formulas need a reduction: by **Legendre's theorem**, a small spherical triangle has (to second order) the same sides as the plane triangle whose angles are each smaller by $\varepsilon/3$. Angle errors propagate along the chain and accumulate with its length.`,
      idea: String.raw`Angles are easy to measure precisely over long sightlines, lengths are not, so measuring one baseline and then only angles is the efficient way to survey a country. Each law-of-sines step multiplies the scale by a ratio of sines; an angle error $\delta$ changes that ratio by about $\delta\cot A$, and these relative errors add up along the chain. If a surveyor computes the third angle as $180^\circ$ minus the two measured ones, the ignored excess acts as an error in every triangle and the sides drift systematically; if all three angles are measured, the triangle *fails to close* by $\varepsilon$, and that misclosure is how 18th-century surveyors saw the Earth's curvature in their own data. Snellius's 1615 chain of 33 triangles between Alkmaar and Breda used this to measure a degree of latitude. The chain rule (pma 5.5) makes the relative-angle sensitivity explicit: differentiating $\log\sin A$ gives $\cot A$. Thus a sine-ratio step has first-order log error $\cot A\,\delta A-\cot C\,\delta C$, away from zero sines. Multiplying successive ratios adds these log errors, explaining why skinny triangles can amplify angular uncertainty.`,
      caption: String.raw`Set the size of the triangles, how many there are, and the angle-measurement noise (in arcseconds). The chain (on a local plane) colours each new side by its error in this survey; numbers inside the triangles are their spherical excess. Below: the error of each successive side in parts per million — red if the third angle is taken as 180° minus the other two, green with Legendre's reduction, and the band covering 95% of 300 noisy surveys for the method chosen by the toggle.`,
      deps: ['geog-1.5', 'pma-5.5'],
      see: ['geog-1.1'],
      refs: ['Haggett'],
      tags: ['surveying', 'spherical geometry'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Legendre%27s_theorem_on_spherical_triangles' },
      viz(v) {
        const side = v.slider('triangle side', 5, 150, 60, { step: 1, fmt: (x) => x.toFixed(0) + ' km' });
        const nt = v.slider('number of triangles', 3, 16, 10, { step: 1, int: true });
        const sig = v.slider('angle noise σ', 0, 3, 0.5, { step: 0.05, fmt: (x) => x.toFixed(2) + '″' });
        const leg = v.toggle('reduce angles by ε/3 (Legendre)', false);
        let seed = 1;
        v.button('New survey', () => { seed++; });
        const sA = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 250, full: true });
        const sB = v.stage({ x: [0.5, 10.5], y: [-1, 1], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'side number along the chain', ylabel: 'side error (ppm)' });
        const ASEC = D2R / 3600;
        let cache = null, key = '';
        function build() {
          const kk = [side.value, nt.value].join();
          if (cache && kk === key) return cache; key = kk;
          const s = side.value, n = nt.value, h = (s * Math.sqrt(3)) / 2, rng = v.rng(5), loc = [];
          for (let i = 0; i < n + 2; i++) loc.push([i * s / 2 + (i > 1 ? rng.uniform(-0.12, 0.12) * s : 0), (i % 2) * h + (i > 1 ? rng.uniform(-0.12, 0.12) * s : 0)]);
          const cxk = loc[loc.length - 1][0] / 2, cyk = h / 2, O = [10, 45];
          const sph = loc.map(([x, y]) => vec(v.geo('destination', O, Math.atan2(x - cxk, y - cyk) * R2D, (Math.hypot(x - cxk, y - cyk) / R_MEAN) * R2D)));
          const ang = (i, j, k) => angle3(tangentTo(sph[i], sph[j]), tangentTo(sph[i], sph[k]));
          const tri = [];
          for (let k = 0; k < n; k++) {
            const A = ang(k, k + 1, k + 2), B = ang(k + 1, k, k + 2), C = ang(k + 2, k, k + 1);
            tri.push({ A, B, C, eps: A + B + C - Math.PI });
          }
          const len = (i, j) => angle3(sph[i], sph[j]) * R_MEAN;
          return (cache = { loc, tri, len, base: len(0, 1), truth: tri.map((_, k) => len(k + 1, k + 2)) });
        }
        /** Carry the scale along the chain: c = known side (between k and k+1), new side k+1 → k+2 opposite angle A_k. */
        function survey(Ch, noise, rng, legendre) {
          let c = Ch.base; const out = [];
          for (const t of Ch.tri) {
            let A = t.A + (noise ? rng.normal() * noise * ASEC : 0), B = t.B + (noise ? rng.normal() * noise * ASEC : 0);
            if (legendre) { const C0 = Math.PI - A - B, b0 = (c * Math.sin(B)) / Math.sin(C0), eps = (0.5 * c * b0 * Math.sin(A)) / (R_MEAN * R_MEAN); A -= eps / 3; B -= eps / 3; }
            const C = Math.PI - A - B; // the third angle inferred, not measured
            c = (c * Math.sin(A)) / Math.sin(C); out.push(c);
          }
          return out;
        }
        function stats() {
          const Ch = build(), rng = v.rng(seed * 101), N = 300, n = Ch.tri.length;
          const bias0 = survey(Ch, 0, null, false).map((c, k) => (c / Ch.truth[k] - 1) * 1e6), bias1 = survey(Ch, 0, null, true).map((c, k) => (c / Ch.truth[k] - 1) * 1e6);
          const runs = []; for (let r = 0; r < N; r++) runs.push(survey(Ch, sig.value, rng, leg.value).map((c, k) => (c / Ch.truth[k] - 1) * 1e6));
          const lo = [], hi = [];
          for (let k = 0; k < n; k++) { const col = runs.map((r) => r[k]).sort((a, b) => a - b); lo.push(col[Math.floor(0.025 * N)]); hi.push(col[Math.ceil(0.975 * N) - 1]); }
          return { Ch, bias0, bias1, run: runs[0], lo, hi };
        }
        v.render(() => {
          const S = stats(), Ch = S.Ch, L = Ch.loc, n = Ch.tri.length;
          const xs = L.map((p) => p[0]), ys = L.map((p) => p[1]), w = Math.max(...xs) - Math.min(...xs), hgt = Math.max(...ys) - Math.min(...ys);
          sA.setView([Math.min(...xs) - 0.06 * w, Math.max(...xs) + 0.06 * w], [Math.min(...ys) - 0.35 * hgt, Math.max(...ys) + 0.3 * hgt]);
          for (let k = 0; k < n; k++) {
            const p = [L[k], L[k + 1], L[k + 2]];
            sA.poly(p, { fill: 'blue', fillAlpha: 0.05 + 0.04 * (k % 2), color: 'muted', width: 1 });
            if (n <= 12) { const cx = (p[0][0] + p[1][0] + p[2][0]) / 3, cy = (p[0][1] + p[1][1] + p[2][1]) / 3; sA.text(`${(Ch.tri[k].eps / ASEC).toFixed(1)}″`, cx, cy, { size: 10.5, color: 'muted', align: 'center', baseline: 'middle' }); }
          }
          const emax = Math.max(1, ...S.run.map(Math.abs));
          for (let k = 0; k < n; k++) {
            const e = S.run[k] / emax, a = L[k + 1], b = L[k + 2];
            sA.line(a[0], a[1], b[0], b[1], { color: Math.abs(S.run[k]) < 1 ? 'green' : e > 0 ? 'red' : 'blue', width: 2 + 2.5 * Math.abs(e) });
          }
          sA.line(L[0][0], L[0][1], L[1][0], L[1][1], { color: 'orange', width: 5 });
          sA.text(`baseline ${Ch.base.toFixed(3)} km`, L[0][0], L[0][1], { size: 11.5, color: 'orange', weight: 600, dy: 10, baseline: 'top', align: 'left' });
          for (const p of L) sA.dot(p[0], p[1], { r: 3.5, color: 'ink' });
          sA.corner(`a chain of ${n} triangles, ${comma(w)} km long`, 'bl', { color: 'muted' });
          // errors per side
          const all = [...S.bias0, ...S.bias1, ...S.lo, ...S.hi], m = Math.max(0.5, ...all.map(Math.abs)) * 1.15;
          sB.setView([0.5, n + 0.5], [-m, m]);
          sB.hline(0, { color: 'muted', width: 1 });
          const band = []; for (let k = 0; k < n; k++) band.push([k + 1, S.hi[k]]); for (let k = n - 1; k >= 0; k--) band.push([k + 1, S.lo[k]]);
          if (sig.value > 0) sB.poly(band, { fill: leg.value ? 'green' : 'red', fillAlpha: 0.13, stroke: false });
          sB.path(S.bias0.map((e, k) => [k + 1, e]), { color: 'red', width: 2.2 });
          sB.dots(S.bias0.map((e, k) => [k + 1, e]), { r: 3.5, color: 'red' });
          sB.path(S.bias1.map((e, k) => [k + 1, e]), { color: 'green', width: 2.2 });
          sB.dots(S.bias1.map((e, k) => [k + 1, e]), { r: 3.5, color: 'green' });
          if (sig.value > 0) sB.path(S.run.map((e, k) => [k + 1, e]), { color: 'gold', width: 1.4, dash: [4, 3] });
          v.legend([['red', 'third angle = 180° − A − B (no reduction)'], ['green', 'Legendre: A, B reduced by ε/3'], [leg.value ? 'green' : 'red', '95% of noisy surveys', { area: true }], ['gold', 'this survey', { dash: true }], ['orange', 'measured baseline']]);
        });
        v.readout(() => {
          const S = stats(), Ch = S.Ch, n = Ch.tri.length, t0 = Ch.tri[0], last = Ch.truth[n - 1];
          const mm = (ppm) => (Math.abs(ppm * last) / 1e3).toFixed(Math.abs(ppm * last) < 1e4 ? 2 : 1);
          return `First triangle: angles sum to $180^\\circ + ${(t0.eps / ASEC).toFixed(2)}''$ (the excess; area/$R^2$). After ${n} triangles the last side (${last.toFixed(3)} km) is off by **${v.fix(S.bias0[n - 1], 2)} ppm = ${mm(S.bias0[n - 1])} m** with no reduction and **${v.fix(S.bias1[n - 1], 3)} ppm** with Legendre's; ${sig.value > 0 ? `noise of ${sig.value.toFixed(2)}″ spreads it over ${v.fix(S.lo[n - 1], 1)} … ${v.fix(S.hi[n - 1], 1)} ppm (95%).` : 'with perfect angles only the excess matters.'} Doubling the side quadruples the excess.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Paradox',
      name: 'Why polar flight routes look curved on maps',
      statement: String.raw`The shortest route between two distant cities at middle latitudes, such as London and Los Angeles, appears on a Mercator world map as a long arc bulging toward the pole, while the straight line between them on the map (a rhumb line, 2.1) is in fact longer. Nothing is wrong with the route: a straight line on a map is a geodesic only if the projection sends great circles to straight lines, which Mercator's does only for meridians and the equator. On the **gnomonic** projection, which maps every great circle to a straight line, the same route is straight and the rhumb line is the curve; on the globe the route is the minor arc of a great circle (1.3).`,
      idea: String.raw`A great circle that is not a meridian or the equator reaches its highest latitude (its *vertex*) between the endpoints, so it must climb toward the pole and come back down. Mercator's map stretches high latitudes by $\sec\varphi$, so the northern detour, which is short on the globe because the meridians converge there, is drawn long and the route looks bent. The gnomonic projection is the central projection from the Earth's centre onto a tangent plane: a great circle lies in a plane through the centre, and that plane meets the tangent plane in a straight line. The map's notion of "straight" is a property of the projection, not of the route.`,
      caption: String.raw`Drag either airport on any map, or pick a route. Left: Mercator, with the great circle (green) bowing poleward and the straight rhumb line (red). Middle: the globe. Right: a gnomonic map centred on the route's midpoint, where the great circle is straight and the rhumb line bends. The readout gives both lengths, the route's highest latitude and whether it crosses Greenland (tested against the coastline).`,
      deps: ['geog-1.3', 'geog-2.2'],
      see: ['geog-5.1', 'geog-4.3'],
      refs: ['Snyder §7'],
      tags: ['navigation', 'map projections'],
      viz(v) {
        const R = {
          lhr: { a: [-0.45, 51.47], b: [-118.41, 33.94], label: 'London → Los Angeles' },
          jfk: { a: [-73.78, 40.64], b: [113.91, 22.31], label: 'New York → Hong Kong' },
          fra: { a: [8.56, 50.03], b: [140.39, 35.77], label: 'Frankfurt → Tokyo' },
          syd: { a: [151.18, -33.95], b: [-70.79, -33.39], label: 'Sydney → Santiago' },
        };
        const sM = v.stage({ height: 330 });
        const sG = v.stage({ height: 330 });
        const sN = v.stage({ height: 330 });
        const GM = v.globe(sM, { projection: 'mercator', center: [-60, 0], graticule: 30, drag: true });
        const GG = v.globe(sG, { projection: 'orthographic', center: [-55, 55], graticule: 15 });
        const GN = v.globe(sN, { projection: 'gnomonic', center: [-60, 60], graticule: 15, clip: 72, drag: false });
        const A = GM.handle(R.lhr.a[0], R.lhr.a[1], { label: 'A', color: 'accent' }), B = GM.handle(R.lhr.b[0], R.lhr.b[1], { label: 'B', color: 'accent' });
        GG.handle(A); GG.handle(B); GN.handle(A); GN.handle(B);
        const center = (a, b) => { const u = vec(a), w = vec(b); return lonlat([u[0] + w[0], u[1] + w[1], u[2] + w[2]]); };
        v.select('route', Object.entries(R).map(([k, r]) => ({ value: k, label: r.label })), 'lhr', {
          onChange: (k) => { const r = R[k]; A.set(r.a[0], r.a[1]); B.set(r.b[0], r.b[1]); const c = center(r.a, r.b); GG.set({ center: [c[0], clamp(c[1], -60, 60)] }); GM.set({ center: [c[0], 0] }); },
        });
        const GREEN = v.geo('landmass', 'Greenland')[0];
        let lastC = '';
        function info() {
          const a = [A.lon, A.lat], b = [B.lon, B.lat], pts = v.geo('interpolate', a, b, 200);
          let vtx = pts[0]; for (const p of pts) if (Math.abs(p[1]) > Math.abs(vtx[1])) vtx = p;
          const gr = pts.some((p) => v.M.pointInPoly(p, GREEN));
          return { a, b, pts, vtx, gr, gc: v.geo('haversine', a, b), rl: v.geo('rhumb', a, b).length };
        }
        v.render(() => {
          const I = info(), c = center(I.a, I.b), ck = c.map((x) => x.toFixed(3)).join();
          if (ck !== lastC) { lastC = ck; GN.set({ center: c }); }
          for (const [G, lbl] of [[GM, true], [GG, false], [GN, false]]) {
            G.draw();
            if (lbl) G.polygon(GREEN, { fill: 'purple', fillAlpha: 0.25, color: 'purple', width: 1.2 });
            G.rhumbLine(I.a, I.b, { color: 'red', width: 2.2, dash: [7, 5] });
            G.greatCircle(I.a, I.b, { color: 'green', width: 2.8 });
            G.dot(I.vtx, { r: 4, color: 'green' });
          }
          GM.text(`highest point ${Math.abs(I.vtx[1]).toFixed(1)}°${I.vtx[1] >= 0 ? 'N' : 'S'}`, I.vtx, { size: 11, color: 'green', weight: 600, dy: I.vtx[1] >= 0 ? -10 : 14, align: 'center' });
          sG.corner('globe', 'tl', { color: 'muted', weight: 600 });
          sN.corner('gnomonic: great circles are straight', 'tl', { color: 'muted', weight: 600, plate: true });
          sM.corner('Mercator: rhumb lines are straight', 'tl', { color: 'muted', weight: 600, plate: true });
          v.legend([['green', 'great circle (shortest)'], ['red', 'rhumb line (straight on Mercator)', { dash: true }], ['purple', 'Greenland', { area: true }]]);
        });
        v.readout(() => {
          const I = info();
          return `Great circle **${comma(I.gc)} km** · rhumb line **${comma(I.rl)} km** (${(100 * (I.rl / I.gc - 1)).toFixed(1)}% longer, though straight on Mercator). The great circle climbs to **${Math.abs(I.vtx[1]).toFixed(1)}°${I.vtx[1] >= 0 ? 'N' : 'S'}** at its vertex (the endpoints are at ${Math.abs(I.a[1]).toFixed(1)}° and ${Math.abs(I.b[1]).toFixed(1)}°) and ${I.gr ? '**crosses Greenland**' : 'does not cross Greenland'}; it leaves on an initial bearing of ${deg3(v.geo('bearing', I.a, I.b))} against the rhumb line's constant ${deg3(v.geo('rhumb', I.a, I.b).bearing)}.`;
        });
      },
    },
  ],
};
