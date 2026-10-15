// Geography & Cartography — Chapter 1: The shape of the Earth and its coordinates
import { D2R, R2D, R_MEAN, vec, lonlat, dot3, cross3, unit3, add3, scale3, angle3, tangentTo, comma, dms, arcPts, radii, vincenty } from './ch01.shared.js';

const MERIDIAN_KM = 40007.86; // WGS84 meridian circumference (numerical integral of M dφ)
/** Thousands separators inside TeX: 12{,}345. */
const tc = (x, d = 0) => comma(x, d).replace(/,/g, '{,}');

/** Resample a polyline of [lon, lat] points into n equal arc-length pieces → unit vectors (n + 1 of them). */
function resample(pts, n) {
  const V = pts.map(vec), cum = [0];
  for (let i = 1; i < V.length; i++) cum.push(cum[i - 1] + angle3(V[i - 1], V[i]));
  const L = cum[cum.length - 1], out = [];
  let j = 0;
  for (let k = 0; k <= n; k++) {
    const s = (L * k) / n;
    while (j < V.length - 2 && cum[j + 1] < s) j++;
    const seg = cum[j + 1] - cum[j] || 1, t = Math.min(1, Math.max(0, (s - cum[j]) / seg));
    out.push(unit3(add3(scale3(V[j], 1 - t), scale3(V[j + 1], t))));
  }
  return out;
}
/** Dense great-circle polyline through the listed points (slerp, ~1° steps). */
function gcPolyline(list) {
  const out = [];
  for (let i = 0; i + 1 < list.length; i++) {
    const u = vec(list[i]), w = vec(list[i + 1]), om = angle3(u, w), n = Math.max(2, Math.ceil(om * R2D));
    for (let k = i ? 1 : 0; k <= n; k++) {
      const t = k / n, s = Math.sin(om) || 1, a = Math.sin((1 - t) * om) / s, b = Math.sin(t * om) / s;
      out.push(lonlat(add3(scale3(u, a), scale3(w, b))));
    }
  }
  return out;
}
const polyLen = (V) => { let s = 0; for (let i = 0; i + 1 < V.length; i++) s += angle3(V[i], V[i + 1]); return s; };
/** Bearing (radians, clockwise from north) of a unit tangent t at unit position u. */
function bearingOf(u, t) {
  const ll = lonlat(u), l = ll[0] * D2R, f = ll[1] * D2R;
  const e = [-Math.sin(l), Math.cos(l), 0], nn = [-Math.sin(f) * Math.cos(l), -Math.sin(f) * Math.sin(l), Math.cos(f)];
  return Math.atan2(dot3(t, e), dot3(t, nn));
}
/** Mercator ordinate ψ(φ) for φ in degrees. */
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + Math.max(-89.9, Math.min(89.9, lat)) * D2R / 2));
const wrap180 = (x) => ((((x + 180) % 360) + 360) % 360) - 180;

export default {
  collection: 'geog',
  chapter: 1,
  title: 'The shape of the Earth and its coordinates',
  summary: String.raw`Geography begins by measuring the globe. Eratosthenes found its size from a shadow, latitude and longitude put a grid on it, and great circles give its shortest paths, measured with spherical trigonometry — where the angles of a triangle add up to more than 180° by exactly its area. The real Earth is an oblate ellipsoid with a lumpy geoid, so every map rests on a chosen datum; finding longitude at sea took a clock that could keep a steady rate for months, and today it takes clocks in orbit, four ranges and a least-squares fix.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Method',
      name: 'Eratosthenes measures the Earth',
      credit: 'Eratosthenes of Cyrene, c. 240 BC (reported by Cleomedes)',
      statement: String.raw`Suppose the Sun is so far away that its rays arrive parallel. If at the same moment the noon Sun is overhead at one place and makes an angle $\theta$ with the vertical at a second place a distance $d$ due north of it, then the two verticals meet at the Earth's centre at the same angle $\theta$, and the circumference is
$$C = \frac{360^\circ}{\theta}\, d .$$
Eratosthenes, as Cleomedes tells it, used Syene (Aswan), where the summer-solstice Sun lit the bottom of a well, and Alexandria, where a gnomon's shadow gave $\theta \approx 7.2^\circ$ (a fiftieth of a circle), with $d \approx 5000$ stadia, and found $C \approx 250{,}000$ stadia. Converting to kilometres needs the length of his stadion, which is uncertain: modern proposals run from about 157.5 m to 185 m (and wider).`,
      idea: String.raw`Each vertical points to the Earth's centre and the Sun's rays are parallel, so the line from the centre through Alexandria cuts two parallel lines and makes equal alternate angles (Euclid I.29): the angle between the two verticals at the centre equals the shadow angle. Arc length is proportional to central angle, hence $d/C = \theta/360^\circ$. The method is exact; the error lies in the inputs — Syene is about $3^\circ$ east of Alexandria and about $0.4^\circ$ north of the Tropic of his day (obliquity $23^\circ43'$), the true latitude difference is $7.11^\circ$, and the stadion is debated. Parallel rays are the hidden hypothesis: over a flat Earth the same two shadows would only say how high a nearby Sun is, and a third observer farther north tells the two pictures apart.`,
      caption: String.raw`Slide the shadow angle, the distance and the stadion length: the lower panel turns $360^\circ/\theta \times d$ into kilometres and compares it with the true meridian circumference, 40,008 km. Drag the purple third observer along the meridian and compare the shadow the globe predicts with the one a nearby Sun over a flat Earth would cast; switch on the flat Earth to draw that alternative. (Real noon shadows follow the globe: at the solstice the Sun's zenith angle is the latitude minus the Tropic.)`,
      deps: [],
      refs: ['Snyder §2', 'Haggett'],
      tags: ['geodesy', 'history of science'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Eratosthenes' },
      viz(v) {
        const flat = v.toggle('flat Earth with a nearby Sun', false);
        const th = v.slider('shadow angle $\\theta$', 2, 20, 7.2, { step: 0.1, fmt: (x) => x.toFixed(1) + '°' });
        const dd = v.slider('distance $d$ (stadia)', 2000, 9000, 5000, { step: 50, fmt: (x) => comma(x) });
        const st = v.slider('stadion length', 150, 210, 157.5, { step: 0.5, fmt: (x) => x.toFixed(1) + ' m' });
        const A = v.stage({ x: [-1.32, 1.32], y: [-0.32, 1.64], equal: true, axes: false, height: 360, weight: 1.35 });
        const L = v.stage({ x: [-1.25, 1.25], y: [-0.62, 1.5], equal: true, axes: false, height: 360, weight: 0.85, minWidth: 220, title: 'what each city sees at noon' });
        const B = v.stage({ x: [150, 210], y: [30000, 60000], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'length of one stadion (m)', ylabel: 'circumference (km)' });
        let s3 = 3.4; // third observer, in units of d north of Syene
        const XS = 0.95, YG = -0.04, HS = 1.5, GH = 0.22; // flat picture: Sun above Syene at height HS, gnomons GH (drawing units)
        const s3max = () => (flat.value ? (XS + 1.22) / (HS * Math.tan(th.value * D2R)) : Math.min(12, 50 / th.value));
        const obs = A.handle(0, 1, {
          color: 'purple', r: 6.5,
          constrain: (x, y) => {
            if (flat.value) s3 = (XS - x) / (HS * Math.tan(th.value * D2R));
            else { let a = Math.atan2(y, x) * R2D; if (a < -90) a += 360; s3 = (a - 90) / th.value; }
            s3 = Math.max(0.25, Math.min(s3max(), s3));
            return place3();
          },
        });
        function place3() {
          if (flat.value) return [XS - s3 * HS * Math.tan(th.value * D2R), YG];
          const a = (90 + s3 * th.value) * D2R; return [Math.cos(a), Math.sin(a)];
        }
        const gnomonGlobe = (ang, hgt, col) => { // gnomon on the circle at polar angle ang (deg); vertical sunlight; returns shadow tip
          const a = ang * D2R, b = [Math.cos(a), Math.sin(a)], tip = [b[0] * (1 + hgt), b[1] * (1 + hgt)];
          const yHit = Math.sqrt(Math.max(0, 1 - tip[0] * tip[0]));
          A.line(b[0], b[1], tip[0], tip[1], { color: 'ink', width: 2.4 });
          A.arrow(tip[0], 1.5, tip[0], yHit + 0.01, { color: 'gold', width: 1.4, head: 6 });
          const a2 = Math.atan2(yHit, tip[0]);
          A.path(arcPts(0, 0, 1, a, a2, 12), { color: col || 'ink', width: 4.5 });
          return tip;
        };
        v.render(() => {
          s3 = Math.min(s3, s3max());
          const p3 = place3(); obs.x = p3[0]; obs.y = p3[1];
          const t = th.value, d = dd.value, tanT = Math.tan(t * D2R);
          // ---------------- main picture
          if (!flat.value) {
            A.circle(0, 0, 1, { fill: 'blue', fillAlpha: 0.08, color: 'blue', width: 1.5 });
            A.text('sunlight: parallel rays', A.xr[0] + 0.05, 1.54, { color: 'gold', size: 12, weight: 600 });
            for (const x of [0.2, 0.4, 0.6, 0.8, -0.9]) A.arrow(x, 1.5, x, Math.sqrt(1 - x * x) + 0.01, { color: 'gold', width: 1.4, head: 6, alpha: 0.75 });
            A.arrow(0, 1.5, 0, 1.0, { color: 'gold', width: 1.4, head: 6 });
            const aA = (90 + t) * D2R, a3 = (90 + s3 * t) * D2R;
            // verticals to the centre and the central angle
            A.line(0, 0, 0, 1, { color: 'muted', width: 1.1, dash: [4, 3] });
            A.line(0, 0, Math.cos(aA), Math.sin(aA), { color: 'muted', width: 1.1, dash: [4, 3] });
            A.line(0, 0, Math.cos(a3) * 0.98, Math.sin(a3) * 0.98, { color: 'purple', width: 1, dash: [3, 4], alpha: 0.6 });
            A.path(arcPts(0, 0, 0.42, Math.PI / 2, aA, 20), { color: 'red', width: 2 });
            A.tex('\\theta', 0.42 * Math.cos((Math.PI / 2 + aA) / 2) - 0.02, 0.42 * Math.sin((Math.PI / 2 + aA) / 2) + 0.09, { color: 'red', size: 15 });
            A.dot(0, 0, { r: 3, color: 'ink' }); A.text('centre', 0.05, -0.07, { size: 11, color: 'muted' });
            // the arc d between the cities
            A.path(arcPts(0, 0, 1.0, Math.PI / 2, aA, 20), { color: 'orange', width: 5, alpha: 0.85 });
            gnomonGlobe(90 + t, 0.26, 'ink');
            gnomonGlobe(90 + s3 * t, 0.26, 'purple');
            const tip = [Math.cos(aA) * 1.26, Math.sin(aA) * 1.26];
            A.path(arcPts(tip[0], tip[1], 0.2, -Math.PI / 2, aA - Math.PI, 10), { color: 'red', width: 1.8 });
            A.dot(0, 1, { color: 'gold', r: 5, label: 'Syene', labelPos: 'e', labelColor: 'ink', math: false });
            A.dot(Math.cos(aA), Math.sin(aA), { color: 'ink', r: 4 });
            A.text('Alexandria', tip[0], tip[1] + 0.13, { size: 12, align: 'center', weight: 600 });
            A.text(`d = ${comma(d)} stadia`, 0.07, 1.13, { size: 12, color: 'orange', weight: 600 });
            const ang3 = s3 * t;
            A.text('3', Math.cos(a3) * 0.88, Math.sin(a3) * 0.88, { size: 12, color: 'purple', weight: 700, align: 'center' });
            A.text(`observer 3: globe ${ang3.toFixed(1)}°`, A.xr[0] + 0.05, -0.22, { size: 12, color: 'purple', weight: 600 });
            A.text('north ←', A.xr[1] - 0.05, -0.22, { size: 11, color: 'muted', align: 'right' });
          } else {
            const dD = HS * tanT, xA = XS - dD, x3 = XS - s3 * dD, sun = [XS, YG + HS];
            A.rect(A.xr[0], A.yr[0], A.xr[1], YG, { fill: 'gold', fillAlpha: 0.12, stroke: false });
            A.line(A.xr[0], YG, A.xr[1], YG, { color: 'ink', width: 1.6 });
            A.text('flat ground', A.xr[0] + 0.05, YG - 0.12, { size: 11, color: 'muted' });
            A.line(XS, YG, XS, sun[1], { color: 'muted', dash: [4, 3], width: 1 });
            A.tex('h', XS + 0.06, YG + HS * 0.55, { align: 'left', size: 15, color: 'muted' });
            const gn = (x, col) => { // vertical gnomon at x, ray from the Sun through its tip
              const tip = [x, YG + GH], u = [tip[0] - sun[0], tip[1] - sun[1]], k = (YG - sun[1]) / u[1];
              A.line(x, YG, tip[0], tip[1], { color: 'ink', width: 2.4 });
              A.arrow(sun[0], sun[1], sun[0] + u[0] * k, YG + 0.005, { color: 'gold', width: 1.3, head: 6, alpha: 0.85 });
              A.line(x, YG, sun[0] + u[0] * k, YG, { color: col, width: 4.5 });
              return tip;
            };
            gn(XS, 'ink'); const tipA = gn(xA, 'ink'); gn(x3, 'purple');
            const ra = Math.atan2(sun[1] - tipA[1], sun[0] - tipA[0]);
            A.line(tipA[0], tipA[1], tipA[0], tipA[1] + 0.42, { color: 'muted', width: 1, dash: [3, 3] });
            A.path(arcPts(tipA[0], tipA[1], 0.34, Math.PI / 2, ra, 10), { color: 'red', width: 1.8 });
            A.tex('\\theta', tipA[0] + 0.48 * Math.cos((Math.PI / 2 + ra) / 2), tipA[1] + 0.48 * Math.sin((Math.PI / 2 + ra) / 2), { color: 'red', size: 14 });
            A.dot(sun[0], sun[1], { color: 'gold', r: 11 });
            A.text('a nearby Sun', sun[0] - 0.17, sun[1] + 0.02, { size: 12, color: 'gold', weight: 600, align: 'right' });
            A.arrow(xA, YG - 0.13, XS, YG - 0.13, { color: 'orange', width: 1.4, head: 6, both: true });
            A.tex('d', XS + 0.05, YG - 0.13, { color: 'orange', size: 14, align: 'left' });
            A.text('Syene', XS + 0.05, YG + 0.14, { size: 12, align: 'left', weight: 600 });
            A.text('Alexandria', xA - 0.04, YG + GH + 0.09, { size: 12, align: 'right', weight: 600 });
            const ang3 = Math.atan(s3 * tanT) * R2D;
            A.text('3', x3, YG - 0.15, { size: 12, color: 'purple', weight: 700, align: 'center' });
            A.text(`observer 3: flat ${ang3.toFixed(1)}°`, A.xr[0] + 0.05, 1.54, { size: 12, color: 'purple', weight: 600 });
          }
          // ---------------- local views (identical on both models)
          L.rect(-1.25, -0.62, 1.25, 0, { fill: 'gold', fillAlpha: 0.12, stroke: false });
          L.line(-1.25, 0, 1.25, 0, { color: 'ink', width: 1.4 });
          // Syene: the well
          L.rect(-0.82, -0.5, -0.58, 0, { fill: 'ink', fillAlpha: 0.75, stroke: false });
          L.rect(-0.82, -0.5, -0.58, -0.42, { fill: 'gold', fillAlpha: 0.9, stroke: false });
          for (const x of [-0.78, -0.7, -0.62]) L.arrow(x, 1.15, x, -0.42, { color: 'gold', width: 1.3, head: 5 });
          L.text('Syene', -0.7, 1.3, { align: 'center', size: 12, weight: 600 });
          L.text('no shadow', -0.7, 0.62, { align: 'center', size: 11, color: 'muted' });
          // Alexandria: gnomon of height 1, rays tilted by θ, shadow to the north (left)
          const gx = 0.62, H = 0.9, sx = gx - H * tanT;
          for (const o of [0.3, 0.6, 0]) { // parallel rays, the last one grazing the gnomon's tip
            const x0 = gx + o + (1.22 - H) * tanT, x1 = gx + o - H * tanT;
            L.arrow(x0, 1.22, x1, 0.004, { color: 'gold', width: o ? 1.2 : 1.6, head: 6, alpha: o ? 0.6 : 1 });
          }
          L.line(gx, 0, gx, H, { color: 'ink', width: 3 });
          L.line(sx, 0, gx, 0, { color: 'ink', width: 5 });
          L.path(arcPts(gx, H, 0.5, -Math.PI / 2, -Math.PI / 2 - t * D2R, 12), { color: 'red', width: 1.8 });
          L.tex('\\theta', gx - 0.08 - 0.55 * Math.sin(t * D2R), H - 0.62, { color: 'red', size: 15 });
          L.text('Alexandria', gx, 1.3, { align: 'center', size: 12, weight: 600 });
          L.text('shadow', (sx + gx) / 2, -0.14, { align: 'center', size: 11, color: 'muted' });
          L.text(`= ${tanT.toFixed(3)} × gnomon`, (sx + gx) / 2, -0.3, { align: 'center', size: 11, color: 'muted' });
          // ---------------- circumference panel
          const Nst = (360 / t) * d, Ckm = (s) => (Nst * s) / 1000;
          const lo = Math.min(Ckm(150), MERIDIAN_KM, 252000 * 0.15), hi = Math.max(Ckm(210), MERIDIAN_KM, 252000 * 0.21);
          B.setView([150, 210], [lo - (hi - lo) * 0.08, hi + (hi - lo) * 0.1]);
          B.vband(157.5, 185, { color: 'orange', alpha: 0.1 });
          B.vline(157.5, { color: 'orange', width: 1, dash: [3, 3] }); B.vline(185, { color: 'orange', width: 1, dash: [3, 3] });
          B.text('157.5 m (Egyptian)', 158.2, hi + (hi - lo) * 0.04, { size: 11, color: 'orange' });
          B.text('185 m (Attic)', 185.7, hi + (hi - lo) * 0.04, { size: 11, color: 'orange' });
          B.hline(MERIDIAN_KM, { color: 'green', width: 2 });
          B.text('true meridian circumference 40,008 km', 209.4, MERIDIAN_KM, { size: 11.5, color: 'green', align: 'right', baseline: 'bottom', dy: -4, weight: 600 });
          B.fn((s) => 252000 * s / 1000, { color: 'muted', width: 1.2, dash: [5, 4] });
          B.fn(Ckm, { color: 'accent', width: 2.6 });
          B.dot(st.value, Ckm(st.value), { color: 'accent', r: 6 });
          v.legend([['accent', String.raw`$C = \tfrac{360^\circ}{\theta}\,d \times$ stadion`], ['muted', '252,000 stadia (later Roman sources)', { dash: true }], ['green', 'true value'], ['orange', 'proposed stadion lengths', { area: true }]]);
        });
        v.readout(() => {
          const t = th.value, d = dd.value, Nst = (360 / t) * d, km = (Nst * st.value) / 1000, err = (km / MERIDIAN_KM - 1) * 100;
          const tanT = Math.tan(t * D2R), g3 = s3 * t, f3 = Math.atan(s3 * tanT) * R2D;
          const main = `$C = \\dfrac{360^\\circ}{${t.toFixed(1)}^\\circ}\\times ${tc(d)} = ${tc(Nst)}$ stadia $= ${tc(km)}$ km at ${st.value.toFixed(1)} m per stadion: **${err >= 0 ? '+' : '−'}${Math.abs(err).toFixed(1)}%** against 40,008 km (the whole proposed range gives ${comma((Nst * 157.5) / 1000)}–${comma((Nst * 185) / 1000)} km).`;
          const h = d / tanT;
          const flatTxt = flat.value ? ` On a flat Earth the same two shadows put the Sun only $h = d/\\tan\\theta = ${tc(h)}$ stadia ≈ ${comma((h * st.value) / 1000)} km up.` : '';
          return main + flatTxt + ` Observer 3, ${s3.toFixed(1)} $d$ north of Syene: the globe predicts a shadow angle of **${g3.toFixed(1)}°**, a nearby Sun over a flat Earth **${f3.toFixed(1)}°**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Latitude and longitude',
      statement: String.raw`On a sphere spinning about an axis through its centre $O$, the **latitude** $\varphi$ of a point $P$ is the angle at $O$ between $OP$ and the equatorial plane ($-90^\circ \le \varphi \le 90^\circ$, positive north), and its **longitude** $\lambda$ is the angle between the plane through the axis and $P$ (its *meridian*) and a chosen prime meridian, now the one through Greenwich ($-180^\circ < \lambda \le 180^\circ$, positive east). Points of equal latitude form a *parallel*, a circle of radius $R\cos\varphi$; points of equal longitude form a meridian, half a great circle. The position vector is
$$\vec{OP} = R\,(\cos\varphi\cos\lambda,\ \cos\varphi\sin\lambda,\ \sin\varphi),$$
so a degree of latitude is always $\pi R/180 \approx 111.2$ km while a degree of longitude is $(\pi R/180)\cos\varphi$, shrinking to zero at the poles. On the real, slightly flattened Earth $\varphi$ is taken as the geodetic latitude (1.7).`,
      idea: String.raw`Two angles are enough because the axis gives a natural pole and the rotation makes all meridians equivalent; only longitude needs a convention (Greenwich, fixed in 1884). The parallel at latitude $\varphi$ is the circle cut by a plane at height $R\sin\varphi$, so its radius is $R\cos\varphi$, which is why east–west distances shrink with latitude while north–south ones do not. Latitude can be read from the sky (the pole star's altitude, or the noon Sun as in 1.1); longitude is a difference of local times, which is why it was so hard to find at sea (1.9).`,
      caption: String.raw`Drag $P$ (or the globe). The orange meridian and blue parallel through $P$ are drawn with the two arcs that measure $\lambda$ along the equator and $\varphi$ up the meridian; the middle panel shows the same angles in the equatorial and meridian planes, and the strip below plots the length of a degree of longitude against latitude.`,
      deps: ['geog-1.1'],
      refs: ['Snyder §2'],
      tags: ['coordinates'],
      viz(v) {
        const sA = v.stage({ height: 330 });
        const sB = v.stage({ x: [-1.3, 3.95], y: [-1.42, 1.5], equal: true, axes: false, height: 330 });
        const sC = v.stage({ x: [0, 90], y: [0, 118], axes: 'box', gutter: true, height: 190, full: true, xlabel: 'latitude (°)', ylabel: 'km per degree' });
        const G = v.globe(sA, { projection: 'orthographic', center: [-38, 26], graticule: 15 });
        const P = G.handle(-74.006, 40.713, { label: 'P', color: 'accent' });
        const mer = (lon, a = -90, b = 90) => { const pts = [], n = Math.max(2, Math.ceil(Math.abs(b - a) / 2)); for (let i = 0; i <= n; i++) pts.push([lon, a + ((b - a) * i) / n]); return pts; };
        const par = (lat, a = -180, b = 180) => { const pts = [], n = Math.max(2, Math.ceil(Math.abs(b - a) / 2)); for (let i = 0; i <= n; i++) pts.push([a + ((b - a) * i) / n, lat]); return pts; };
        const DEG = (Math.PI * R_MEAN) / 180;
        v.render(() => {
          const lam = P.lon, phi = P.lat;
          G.draw();
          G.path(par(0), { geodesic: false, color: 'ink', width: 1.3, alpha: 0.55 });
          G.path(mer(0), { geodesic: false, color: 'green', width: 1.8 });
          G.path(mer(lam), { geodesic: false, color: 'orange', width: 2 });
          G.path(par(phi), { geodesic: false, color: 'accent', width: 2 });
          G.path(par(0, 0, lam), { geodesic: false, color: 'red', width: 4 });
          G.path(mer(lam, 0, phi), { geodesic: false, color: 'purple', width: 4 });
          G.tex('\\lambda', [lam / 2, -5], { color: 'red', size: 15 });
          G.tex('\\varphi', [lam + 4, phi / 2], { color: 'purple', size: 15 });
          G.text('Greenwich', [0, 62], { color: 'green', size: 11, align: 'center' });
          G.text('equator', [-118, 3], { color: 'muted', size: 11, align: 'center' });
          // ---- equatorial plane from above the North Pole (east = counter-clockwise)
          const c1 = [0, 0], c2 = [2.62, 0], lr = lam * D2R, fr = phi * D2R;
          sB.circle(c1[0], c1[1], 1, { fill: 'blue', fillAlpha: 0.06, color: 'blue', width: 1.2 });
          sB.line(c1[0], c1[1], c1[0], c1[1] - 1, { color: 'green', width: 2 });
          sB.line(c1[0], c1[1], c1[0] + Math.sin(lr), c1[1] - Math.cos(lr), { color: 'orange', width: 2 });
          sB.path(arcPts(c1[0], c1[1], 0.38, -Math.PI / 2, -Math.PI / 2 + lr, 30), { color: 'red', width: 2.2 });
          sB.tex('\\lambda', c1[0] + 0.58 * Math.cos(-Math.PI / 2 + lr / 2), c1[1] + 0.58 * Math.sin(-Math.PI / 2 + lr / 2), { color: 'red', size: 15 });
          sB.text('Greenwich', c1[0], c1[1] - 1.13, { align: 'center', size: 11, color: 'green', baseline: 'top' });
          sB.dot(c1[0], c1[1], { r: 3, color: 'ink' }); sB.text('N pole', c1[0] + 0.06, c1[1] + 0.12, { size: 10.5, color: 'muted' });
          sB.dot(c1[0] + Math.cos(fr) * Math.sin(lr), c1[1] - Math.cos(fr) * Math.cos(lr), { r: 4.5, color: 'accent' });
          sB.text('above the pole', c1[0], 1.32, { align: 'center', size: 11.5, weight: 600 });
          // ---- the meridian plane through P
          sB.circle(c2[0], c2[1], 1, { fill: 'blue', fillAlpha: 0.06, color: 'blue', width: 1.2 });
          sB.line(c2[0] - 1, c2[1], c2[0] + 1, c2[1], { color: 'muted', width: 1, dash: [4, 3] });
          sB.line(c2[0], c2[1] - 1.08, c2[0], c2[1] + 1.08, { color: 'muted', width: 1 });
          sB.text('axis', c2[0] + 0.05, c2[1] - 1.12, { size: 10.5, color: 'muted' });
          const Px = c2[0] + Math.cos(fr), Py = c2[1] + Math.sin(fr);
          sB.line(c2[0], c2[1], Px, Py, { color: 'accent', width: 2 });
          sB.line(c2[0], Py, Px, Py, { color: 'accent', width: 2.6, dash: [5, 3] });
          sB.tex('R\\cos\\varphi', (c2[0] + Px) / 2, Py, { color: 'accent', size: 13, baseline: phi >= 0 ? 'bottom' : 'top', dy: phi >= 0 ? -3 : 3 });
          sB.path(arcPts(c2[0], c2[1], 0.36, 0, fr, 24), { color: 'purple', width: 2.2 });
          sB.tex('\\varphi', c2[0] + 0.55 * Math.cos(fr / 2), c2[1] + 0.55 * Math.sin(fr / 2), { color: 'purple', size: 15 });
          sB.dot(Px, Py, { r: 5, color: 'accent', label: 'P', labelPos: 'e' });
          sB.text('equator', c2[0] - 0.95, c2[1] - 0.1, { size: 10.5, color: 'muted', baseline: 'top' });
          sB.text("slice along P's meridian", c2[0], 1.32, { align: 'center', size: 11.5, weight: 600 });
          // ---- degree lengths
          sC.fn((f) => DEG * Math.cos(f * D2R), { color: 'accent', width: 1.4, dash: [5, 4] });
          sC.fn((f) => (Math.PI / 180) * radii(f).N * Math.cos(f * D2R) / 1000, { color: 'accent', width: 2.4 });
          sC.fn((f) => (Math.PI / 180) * radii(f).M / 1000, { color: 'purple', width: 2.4 });
          const af = Math.abs(phi);
          sC.vline(af, { color: 'muted', dash: [3, 3] });
          sC.dot(af, (Math.PI / 180) * radii(af).N * Math.cos(af * D2R) / 1000, { color: 'accent', r: 5 });
          sC.dot(af, (Math.PI / 180) * radii(af).M / 1000, { color: 'purple', r: 5 });
          v.legend([['accent', '1° of longitude (WGS84)'], ['accent', String.raw`sphere: $111.2\cos\varphi$ km`, { dash: true }], ['purple', '1° of latitude (WGS84)'], ['green', 'prime meridian']]);
        });
        v.readout(() => {
          const lam = P.lon, phi = P.lat, f = phi * D2R, l = lam * D2R;
          const dLon = (Math.PI / 180) * radii(phi).N * Math.cos(f) / 1000, dLat = (Math.PI / 180) * radii(phi).M / 1000;
          const X = [R_MEAN * Math.cos(f) * Math.cos(l), R_MEAN * Math.cos(f) * Math.sin(l), R_MEAN * Math.sin(f)];
          return `$P$: $\\varphi = ${phi.toFixed(4)}^\\circ$, $\\lambda = ${lam.toFixed(4)}^\\circ$ = ${dms(phi)}, ${dms(lam, 'E', 'W')}. Here 1° of longitude spans **${dLon.toFixed(1)} km** (sphere: $111.2\\cos\\varphi = ${(DEG * Math.cos(f)).toFixed(1)}$ km) and 1° of latitude **${dLat.toFixed(1)} km**. Position vector $R(\\cos\\varphi\\cos\\lambda, \\cos\\varphi\\sin\\lambda, \\sin\\varphi) = (${tc(X[0])},\\ ${tc(X[1])},\\ ${tc(X[2])})$ km.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Theorem',
      name: 'Great circles are the shortest paths on a sphere',
      statement: String.raw`On a sphere of radius $R$, among all curves joining two points $A$ and $B$ that are not antipodal, the shortest is the minor arc of the unique great circle through $A$ and $B$ (the circle cut by the plane through $A$, $B$ and the centre). Its length is $R\,\sigma$, where $\sigma \in [0, \pi)$ is the central angle, $\cos\sigma = \hat A\cdot\hat B$. Every arc of a great circle is a geodesic (it has no sideways curvature on the sphere), but the major arc, longer than $\pi R$, is not a shortest path; antipodal points are joined by infinitely many shortest great semicircles.`,
      idea: String.raw`Great circles are the geodesics of the sphere (dg-9.3): their acceleration points straight at the centre, so they never turn within the surface. Shortest paths are always geodesics (dg-9.7), and through two non-antipodal points there are only two great-circle arcs, the minor and the major, so the minor one wins. A direct argument: write any curve in coordinates centred on $A$ with $\sigma$ the distance from $A$; then $|ds| \ge |d\sigma|$, with equality only when the curve runs straight along a meridian of that system — the great circle. Pulling a string tight on a globe does the same minimisation physically.`,
      caption: String.raw`Drag the cities, the waypoint $W$ or the globe. The string (gold) starts along the rhumb line or a detour through $W$; the slider applies relaxation steps that move each bead to the midpoint of its neighbours on the sphere. The string's length (right) falls every step and settles on the great-circle length; the rhumb line, though it keeps a constant compass bearing, is longer. Switch on the major arc: also a great circle, but far from shortest.`,
      deps: ['geog-1.2', 'dg-9.3', 'dg-9.7'],
      see: ['dg-9.11', 'mech-5.13'],
      refs: ['Snyder §5'],
      tags: ['geodesics', 'navigation'],
      viz(v) {
        const sA = v.stage({ height: 360 });
        const sB = v.stage({ x: [0, 300], y: [0, 1], axes: 'box', gutter: true, height: 360, xlabel: 'relaxation steps', ylabel: 'length (km)' });
        const G = v.globe(sA, { projection: 'orthographic', center: [-58, 50], graticule: 15 });
        const A = G.handle(-122.33, 47.61, { label: 'Seattle', color: 'accent' });
        const B = G.handle(2.35, 48.86, { label: 'Paris', color: 'accent' });
        const W = G.handle(-62, 24, { label: 'W', color: 'orange' });
        const start = v.select('string starts along', [{ value: 'via', label: 'a detour through W' }, { value: 'rhumb', label: 'the rhumb line' }], 'via');
        const K = v.slider('relaxation steps $k$', 0, 300, 45, { step: 1, int: true });
        const major = v.toggle('show the long way round (major arc)', false);
        const N = 26, KMAX = 300;
        let cache = null, key = '';
        function run() {
          const k = `${A.lon},${A.lat},${B.lon},${B.lat},${W.lon},${W.lat},${start.value}`;
          if (k === key) return cache; key = k;
          const init = start.value === 'rhumb' ? v.geo('rhumb', [A.lon, A.lat], [B.lon, B.lat]).points : gcPolyline([[A.lon, A.lat], [W.lon, W.lat], [B.lon, B.lat]]);
          let P = resample(init, N); const hist = [P.map((p) => p.slice())], lens = [polyLen(P) * R_MEAN];
          for (let it = 1; it <= KMAX; it++) {
            for (let i = 1; i < N; i++) P[i] = unit3(add3(P[i - 1], P[i + 1]));
            lens.push(polyLen(P) * R_MEAN); hist.push(P.map((p) => p.slice()));
          }
          return (cache = { hist, lens });
        }
        v.render(() => {
          W.visible = start.value === 'via';
          const R = run(), k = K.value, P = R.hist[k];
          const a = [A.lon, A.lat], b = [B.lon, B.lat];
          G.draw();
          if (major.value) {
            const u = vec(a), w = vec(b), nrm = unit3(cross3(u, w)), pts = [];
            for (let i = 0; i <= 180; i++) { const t = -(i / 180) * (2 * Math.PI - angle3(u, w)); const q = add3(scale3(u, Math.cos(t)), scale3(cross3(nrm, u), Math.sin(t))); pts.push(lonlat(q)); }
            G.path(pts, { geodesic: false, color: 'green', width: 2, dash: [6, 4] });
          }
          G.rhumbLine(a, b, { color: 'red', width: 1.8, dash: [6, 4] });
          G.greatCircle(a, b, { color: 'green', width: 2.6 });
          if (start.value === 'via' && k > 0) G.path(R.hist[0].map(lonlat), { geodesic: true, color: 'orange', width: 1.2, alpha: 0.5, dash: [3, 3] });
          G.path(P.map(lonlat), { geodesic: true, color: 'gold', width: 3 });
          for (const p of P) G.dot(lonlat(p), { r: 2.3, color: 'gold', ring: false });
          // length history
          const gc = v.geo('haversine', a, b), rl = v.geo('rhumb', a, b).length, maj = 2 * Math.PI * R_MEAN - gc;
          const hi = Math.max(R.lens[0], rl, major.value ? maj : 0) * 1.04, lo = gc * 0.96;
          sB.setView([0, KMAX], [lo, hi]);
          sB.hline(gc, { color: 'green', width: 2 });
          sB.text(`great circle ${comma(gc)} km`, KMAX * 0.98, gc, { align: 'right', baseline: 'top', dy: 4, size: 11.5, color: 'green', weight: 600 });
          if (rl < hi) { sB.hline(rl, { color: 'red', width: 1.5, dash: [6, 4] }); sB.text(`rhumb line ${comma(rl)} km`, KMAX * 0.98, rl, { align: 'right', baseline: 'bottom', dy: -4, size: 11.5, color: 'red' }); }
          if (major.value && maj < hi) { sB.hline(maj, { color: 'green', width: 1.5, dash: [6, 4] }); sB.text(`major arc ${comma(maj)} km`, KMAX * 0.98, maj, { align: 'right', baseline: 'bottom', dy: -4, size: 11.5, color: 'green' }); }
          sB.path(R.lens.map((L, i) => [i, L]), { color: 'gold', width: 2.4 });
          sB.dot(k, R.lens[k], { color: 'gold', r: 6 });
          v.legend([['gold', 'string being pulled tight'], ['green', 'great circle'], ['red', 'rhumb line (constant bearing)', { dash: true }]]);
        });
        v.readout(() => {
          const R = run(), k = K.value, a = [A.lon, A.lat], b = [B.lon, B.lat];
          const gc = v.geo('haversine', a, b), rl = v.geo('rhumb', a, b).length, L = R.lens[k];
          const dec = R.lens.every((x, i) => i === 0 || x <= R.lens[i - 1] + 1e-6);
          return `Great circle **${comma(gc)} km** · string after $k = ${k}$ steps **${comma(L)} km** (${L - gc < 0.5 ? 'on the great circle' : '+' + ((L / gc - 1) * 100).toFixed(2) + '%'}) · rhumb line ${comma(rl)} km (+${((rl / gc - 1) * 100).toFixed(1)}%)${major.value ? ` · major arc ${comma(2 * Math.PI * R_MEAN - gc)} km` : ''}. The length ${dec ? 'decreased at every one' : 'did not always decrease'} of the ${KMAX} steps.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Proposition',
      name: 'Great-circle distance (haversine formula)',
      statement: String.raw`For points $(\varphi_1, \lambda_1)$ and $(\varphi_2, \lambda_2)$ on a sphere of radius $R$, the central angle $\sigma$ satisfies the spherical law of cosines
$$\cos\sigma = \sin\varphi_1\sin\varphi_2 + \cos\varphi_1\cos\varphi_2\cos\Delta\lambda,$$
and equivalently the **haversine formula** (with $\operatorname{hav}\theta = \sin^2(\theta/2)$)
$$\operatorname{hav}\sigma = \operatorname{hav}\Delta\varphi + \cos\varphi_1\cos\varphi_2\operatorname{hav}\Delta\lambda, \qquad d = 2R\arcsin\sqrt{\operatorname{hav}\sigma}.$$
The two are equal in exact arithmetic, but the haversine form stays accurate in floating point for nearby points, where $\cos\sigma \approx 1$ and $\arccos$ loses digits. With $R = 6371.0$ km either formula differs from the geodesic on the WGS84 ellipsoid by up to about 0.5 % (as computed, for example, by Vincenty's method).`,
      idea: String.raw`The law of cosines is the dot product $\hat A\cdot\hat B$ of the position vectors of 1.2. Substituting $\cos\theta = 1 - 2\operatorname{hav}\theta$ throughout turns it into the haversine formula, which computes the small quantity $\operatorname{hav}\sigma \approx \sigma^2/4$ directly instead of as $1 - \cos\sigma$, a difference of two nearly equal numbers. Navigators tabulated haversines for exactly this reason; today the same cancellation appears whenever single-precision arithmetic is used. The leftover error is the model's: the Earth is flattened (1.6), and a sphere cannot be right in every direction at once.`,
      caption: String.raw`Drag the two cities. The map shows the great circle (green) and the rhumb line (red); the log–log plot scans points along the same course from 1 m to 20,000 km and plots the relative error of each formula against the exact central angle. Switch to single precision and watch the law of cosines collapse for short distances while haversine holds on; the purple curve is the sphere's own error against the ellipsoid, larger than either rounding error in double precision. (Near the antipode, at 20,000 km, haversine loses digits in its turn.)`,
      deps: ['geog-1.3'],
      see: ['geog-1.6'],
      refs: ['Snyder §5'],
      tags: ['geodesics', 'numerics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Haversine_formula' },
      viz(v) {
        const prec = v.select('arithmetic', [{ value: '64', label: 'double (16 digits)' }, { value: '32', label: 'single (7 digits)' }], '64');
        const sA = v.stage({ height: 300, full: true });
        const sB = v.stage({ x: [1e-3, 2e4], y: [1e-17, 2], xlog: true, ylog: true, axes: 'box', gutter: true, height: 290, full: true, xlabel: 'distance along the course (km)', ylabel: 'relative error' });
        const G = v.globe(sA, { projection: 'robinson', center: [20, 0], graticule: 30 });
        const A = G.handle(-0.13, 51.51, { label: 'London', color: 'accent' });
        const B = G.handle(103.82, 1.35, { label: 'Singapore', color: 'orange' });
        const F = Math.fround, id = (x) => x;
        const rnd = () => (prec.value === '32' ? F : id);
        function hav(p, q, r) {
          const f1 = r(r(p[1]) * r(D2R)), f2 = r(r(q[1]) * r(D2R)), l1 = r(r(p[0]) * r(D2R)), l2 = r(r(q[0]) * r(D2R));
          const s1 = r(Math.sin(r(r(f2 - f1) * 0.5))), s2 = r(Math.sin(r(r(l2 - l1) * 0.5)));
          const h = r(r(s1 * s1) + r(r(r(Math.cos(f1)) * r(Math.cos(f2))) * r(s2 * s2)));
          return r(2 * r(Math.asin(r(Math.sqrt(Math.min(1, h))))));
        }
        function cosLaw(p, q, r) {
          const f1 = r(r(p[1]) * r(D2R)), f2 = r(r(q[1]) * r(D2R)), l1 = r(r(p[0]) * r(D2R)), l2 = r(r(q[0]) * r(D2R));
          const c = r(r(r(Math.sin(f1)) * r(Math.sin(f2))) + r(r(r(Math.cos(f1)) * r(Math.cos(f2))) * r(Math.cos(r(l2 - l1)))));
          return r(Math.acos(Math.max(-1, Math.min(1, c))));
        }
        const floor = 1e-17, re = (x, ref) => Math.min(1.4, Math.max(floor, Math.abs(x - ref) / ref));
        let scan = null, skey = '';
        function doScan() {
          const k = `${A.lon},${A.lat},${B.lon},${B.lat},${prec.value}`; if (k === skey) return scan; skey = k;
          const a = [A.lon, A.lat], brg = v.geo('bearing', a, [B.lon, B.lat]), r = rnd(), out = { c: [], h: [], e: [] };
          for (let i = 0; i <= 110; i++) {
            const d = 1e-3 * Math.pow(2e7, i / 110), p = v.geo('destination', a, brg, (d / R_MEAN) * R2D);
            const ref = angle3(vec(a), vec(p));
            out.c.push([d, re(cosLaw(a, p, r), ref)]); out.h.push([d, re(hav(a, p, r), ref)]);
            const vin = vincenty(a, p); if (vin.ok && d > 1e-3) out.e.push([d, Math.abs((ref * R_MEAN * 1000) / vin.s - 1)]);
          }
          return (scan = out);
        }
        v.render(() => {
          const a = [A.lon, A.lat], b = [B.lon, B.lat];
          G.draw();
          G.rhumbLine(a, b, { color: 'red', width: 2, dash: [6, 4] });
          G.greatCircle(a, b, { color: 'green', width: 2.6 });
          const S = doScan(), d = v.geo('haversine', a, b);
          sB.hband(1e-17, 1.2e-16, { color: 'muted', alpha: 0.07 });
          sB.text('double-precision rounding', 1.3e-3, 3e-17, { size: 10.5, color: 'muted' });
          if (prec.value === '32') { sB.hband(1e-17, 6e-8, { color: 'muted', alpha: 0.06 }); sB.text('single-precision rounding', 1.3e-3, 2.5e-8, { size: 10.5, color: 'muted', baseline: 'bottom' }); }
          sB.path(S.e, { color: 'purple', width: 2 });
          sB.path(S.c, { color: 'red', width: 2.2 });
          sB.path(S.h, { color: 'green', width: 2.2 });
          sB.vline(d, { color: 'orange', dash: [4, 3], width: 1.2 });
          sB.text('A → B', d, 0.5, { size: 11, color: 'orange', align: d > 300 ? 'right' : 'left', dx: d > 300 ? -5 : 5 });
          v.legend([['red', 'law of cosines'], ['green', 'haversine'], ['purple', 'sphere vs WGS84 ellipsoid (model error)'], ['red', 'rhumb line on the map', { dash: true }]]);
        });
        v.readout(() => {
          const a = [A.lon, A.lat], b = [B.lon, B.lat], r = rnd();
          const dh = hav(a, b, r) * R_MEAN, dc = cosLaw(a, b, r) * R_MEAN, vin = vincenty(a, b), rl = v.geo('rhumb', a, b).length;
          const dv = vin.s / 1000, ex = angle3(vec(a), vec(b)) * R_MEAN;
          const diffM = Math.abs(dc - dh) * 1000;
          const ell = vin.ok ? `Vincenty on WGS84 **${comma(dv, 1)} km**, so the sphere is off by ${((ex / dv - 1) * 100).toFixed(2)}%` : 'Vincenty fails to converge (nearly antipodal points)';
          return `Haversine **${comma(dh, 1)} km** · law of cosines ${comma(dc, 1)} km (they differ by ${diffM < 1 ? (diffM * 1000).toFixed(1) + ' mm' : comma(diffM, 1) + ' m'} in ${prec.value === '32' ? 'single' : 'double'} precision) · ${ell} · rhumb line ${comma(rl)} km.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'Spherical triangles and Girard’s theorem',
      credit: 'Albert Girard, 1629 (proved by Cavalieri, 1632)',
      statement: String.raw`A spherical triangle is a region bounded by three arcs of great circles, each shorter than a semicircle. If its interior angles are $\alpha, \beta, \gamma$, its angle sum exceeds $\pi$, and the **spherical excess** equals the area divided by the square of the radius:
$$\alpha + \beta + \gamma - \pi = \frac{\text{Area}}{R^2}.$$
So the excess is between $0$ and $4\pi$ ($720^\circ$), a small triangle is nearly Euclidean, and the octant with three right angles has excess $\pi/2$ and area one eighth of the sphere. The sides must be geodesics: a triangle bounded by rhumb lines has a different angle sum.`,
      idea: String.raw`Each pair of sides extended to full great circles bounds a *lune* of angle $\alpha$, with area $2\alpha R^2$ (a fraction $\alpha/2\pi$ of $4\pi R^2$). The three lunes at $\alpha, \beta, \gamma$ and their antipodal copies cover the whole sphere once, except that the triangle and its antipode are covered three times: $2(2\alpha+2\beta+2\gamma)R^2 = 4\pi R^2 + 4\,\text{Area}$. It is the case $K = 1/R^2$ of the local Gauss–Bonnet theorem (dg-10.2): the turning of a geodesic triangle's boundary falls short of $2\pi$ by the curvature enclosed. Rhumb lines curve within the sphere (they are straight on the conformal Mercator map, so their triangles have angle sum exactly $180^\circ$), and the curvature they carry breaks the balance.`,
      caption: String.raw`Drag the vertices $A, B, C$ or the globe, or pick a preset. The angles are measured from the tangents of the sides, and the area is found independently by counting which of 60,000 equal-area cells lie inside. Each configuration you visit is plotted on the right: excess against area $/R^2$, falling on the diagonal. Switch the sides to rhumb lines and the points drop to an excess of exactly $0$ while the area stays.`,
      deps: ['geog-1.3', 'dg-10.2'],
      see: ['dg-10.3', 'dg-10.1'],
      refs: ['Snyder §5'],
      tags: ['spherical geometry', 'curvature'],
      viz(v) {
        const preset = v.select('preset', [{ value: 'free', label: 'free' }, { value: 'oct', label: 'octant (90°, 90°, 90°)' }, { value: 'small', label: 'small' }, { value: 'big', label: 'large' }], 'free', {
          onChange: (p) => {
            const P = { oct: [[0, 0], [90, 0], [45, 89.999]], small: [[18, 22], [32, 20], [24, 34]], big: [[-40, -10], [100, -5], [30, 75]] }[p];
            if (P) [A, B, C].forEach((h, i) => h.set(P[i][0], P[i][1]));
          },
        });
        const rh = v.toggle('sides are rhumb lines (not great circles)', false);
        const sA = v.stage({ height: 360 });
        const sB = v.stage({ x: [0, 100], y: [0, 100], axes: 'box', gutter: true, height: 360, xlabel: 'area / R² (degrees)', ylabel: 'angle excess (°)' });
        const G = v.globe(sA, { projection: 'orthographic', center: [28, 28], graticule: 30 });
        const A = G.handle(0, 8, { label: 'A', color: 'accent', labelPos: 'w' }), B = G.handle(62, 2, { label: 'B', color: 'accent', labelPos: 'e' }), C = G.handle(28, 58, { label: 'C', color: 'accent', labelPos: 'n' });
        // 60,000 equal-area cells (Fibonacci lattice): unit vectors, longitudes and Mercator ordinates
        const NC = 60000, LAT = new Float64Array(NC), LON = new Float64Array(NC), PSI = new Float64Array(NC), X = new Float64Array(NC), Y = new Float64Array(NC), Z = new Float64Array(NC);
        const ga = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < NC; i++) {
          const z = 1 - (2 * i + 1) / NC, r = Math.sqrt(1 - z * z), t = i * ga;
          X[i] = r * Math.cos(t); Y[i] = r * Math.sin(t); Z[i] = z;
          LAT[i] = Math.asin(z) * R2D; LON[i] = Math.atan2(Y[i], X[i]) * R2D; PSI[i] = merc(LAT[i]);
        }
        const history = [];
        /** Angles (tangent directions) and area (cell count) of the triangle P with great-circle or rhumb sides. */
        function measureP(P, rhumb) {
          const V = P.map(vec);
          let angles, count = 0, ring, ok = true, perim = 0;
          if (!rhumb) {
            angles = [0, 1, 2].map((i) => { const u = V[i], t1 = tangentTo(u, V[(i + 1) % 3]), t2 = tangentTo(u, V[(i + 2) % 3]); return angle3(t1, t2); });
            const n = [0, 1, 2].map((i) => cross3(V[i], V[(i + 1) % 3])), sg = Math.sign(dot3(n[0], V[2])) || 1;
            for (let i = 0; i < NC; i++) {
              const q = [X[i], Y[i], Z[i]];
              if (sg * dot3(n[0], q) >= 0 && sg * dot3(n[1], q) >= 0 && sg * dot3(n[2], q) >= 0) count++;
            }
            ring = gcPolyline([...P, P[0]]);
            for (let i = 0; i < 3; i++) perim += angle3(V[i], V[(i + 1) % 3]);
          } else {
            // a straight triangle on the Mercator plane, longitudes unwrapped along the short rhumb legs
            const xs = [P[0][0]], ys = P.map((p) => merc(p[1]));
            xs.push(xs[0] + wrap180(P[1][0] - P[0][0])); xs.push(xs[1] + wrap180(P[2][0] - P[1][0]));
            const close = xs[2] + wrap180(P[0][0] - P[2][0]) - xs[0];
            if (Math.abs(close) > 1) ok = false; // the rhumb triangle winds round a pole
            const ang = (i) => { const j = (i + 1) % 3, k2 = (i + 2) % 3, ax = xs[j] - xs[i], ay = (ys[j] - ys[i]) * R2D, bx = xs[k2] - xs[i], by = (ys[k2] - ys[i]) * R2D; return Math.abs(Math.atan2(ax * by - ay * bx, ax * bx + ay * by)); };
            angles = [ang(0), ang(1), ang(2)];
            const cr = (ax, ay, bx, by, px, py) => (bx - ax) * (py - ay) - (by - ay) * (px - ax);
            const sg = Math.sign(cr(xs[0], ys[0], xs[1], ys[1], xs[2], ys[2])) || 1;
            const x0 = Math.min(...xs), x1 = Math.max(...xs);
            if (ok) for (let i = 0; i < NC; i++) {
              const py = PSI[i];
              for (const sh of [-360, 0, 360]) {
                const px = LON[i] + sh; if (px < x0 || px > x1) continue;
                if (sg * cr(xs[0], ys[0], xs[1], ys[1], px, py) >= 0 && sg * cr(xs[1], ys[1], xs[2], ys[2], px, py) >= 0 && sg * cr(xs[2], ys[2], xs[0], ys[0], px, py) >= 0) { count++; break; }
              }
            }
            ring = [];
            for (let i = 0; i < 3; i++) { const r = v.geo('rhumb', P[i], P[(i + 1) % 3]); ring.push(...r.points.slice(i ? 1 : 0)); perim += r.length / R_MEAN; }
          }
          // counting error: only the ~perimeter/spacing cells cut by the boundary are in doubt
          const cell = (4 * Math.PI) / NC, area = count * cell, sigma = 0.3 * Math.sqrt(perim / Math.sqrt(cell)) * cell;
          const excess = angles[0] + angles[1] + angles[2] - Math.PI;
          if (v.geo('sphericalArea', ring) < 0) ring.reverse();
          return { angles, area, sigma, excess, ring, ok };
        }
        let cache = null, key = '';
        function measure() {
          const k = `${A.lon},${A.lat},${B.lon},${B.lat},${C.lon},${C.lat},${rh.value}`;
          if (k === key) return cache; key = k;
          return (cache = measureP([A, B, C].map((h) => [h.lon, h.lat]), rh.value));
        }
        // 24 random triangles of all sizes, for reference (computed once per mode)
        const refs = {};
        function reference(rhumb) {
          if (refs[rhumb]) return refs[rhumb];
          const rng = v.rng(11), out = [];
          for (let k = 0; out.length < 24 && k < 200; k++) {
            const c = [rng.uniform(-180, 180), rng.uniform(-50, 50)], rad = 8 + 62 * rng();
            const P = [0, 1, 2].map((j) => v.geo('destination', c, rng.uniform(0, 360), rad * rng.uniform(0.6, 1)));
            const m = measureP(P, rhumb); if (m.ok && m.area > 0.01) out.push([m.area * R2D, m.excess * R2D]);
          }
          return (refs[rhumb] = out);
        }
        v.render(() => {
          const R = measure(), P = [A, B, C].map((h) => [h.lon, h.lat]), V = P.map(vec);
          G.draw();
          G.polygon([R.ring], { fill: rh.value ? 'red' : 'accent', fillAlpha: 0.22, color: rh.value ? 'red' : 'accent', width: 2.4 });
          // angle arcs at the vertices (radius 7°)
          const names = ['\\alpha', '\\beta', '\\gamma'];
          for (let i = 0; i < 3; i++) {
            const u = V[i], ll = P[i];
            let b1, b2;
            if (!rh.value) { b1 = bearingOf(u, tangentTo(u, V[(i + 1) % 3])); b2 = bearingOf(u, tangentTo(u, V[(i + 2) % 3])); }
            else { b1 = v.geo('rhumb', ll, P[(i + 1) % 3]).bearing * D2R; b2 = v.geo('rhumb', ll, P[(i + 2) % 3]).bearing * D2R; }
            let d = b2 - b1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
            const arc = []; for (let k = 0; k <= 16; k++) arc.push(v.geo('destination', ll, (b1 + (d * k) / 16) * R2D, 7));
            G.path(arc, { geodesic: false, color: 'ink', width: 1.6 });
            G.tex(names[i], v.geo('destination', ll, (b1 + d / 2) * R2D, 13), { size: 14, color: 'ink' });
          }
          // history scatter
          const exD = R.excess * R2D, arD = R.area * R2D;
          const last = history[history.length - 1];
          if (R.ok && (!last || Math.abs(last[0] - arD) + Math.abs(last[1] - exD) > 0.3)) { history.push([arD, exD, rh.value]); if (history.length > 400) history.shift(); }
          const top = Math.max(100, ...history.map((h) => Math.max(h[0], h[1])), ...reference(rh.value).map((h) => Math.max(h[0], h[1])), arD, exD) * 1.08;
          sB.setView([0, top], [0, top]);
          sB.line(0, 0, top, top, { color: 'green', width: 1.6, dash: [6, 4] });
          sB.text('excess = area / R²', top * 0.96, top * 0.9, { align: 'right', size: 11.5, color: 'green', weight: 600 });
          for (const h of reference(rh.value)) sB.dot(h[0], h[1], { r: 3, color: 'muted', alpha: 0.45, ring: false });
          for (const h of history) sB.dot(h[0], h[1], { r: 2.6, color: h[2] ? 'red' : 'accent', alpha: 0.6, ring: false });
          if (R.ok) sB.dot(arD, exD, { r: 7, color: rh.value ? 'red' : 'accent' });
          sB.hline(90, { color: 'muted', width: 0.8, dash: [2, 4] }); sB.vline(90, { color: 'muted', width: 0.8, dash: [2, 4] });
          sB.text('octant', 91, 4, { size: 10.5, color: 'muted' });
          v.legend([['accent', 'great-circle triangles you made'], ['red', 'rhumb-line triangles'], ['muted', 'random triangles', { dot: true }], ['green', 'Girard: excess = area / R²', { dash: true }]]);
        });
        v.readout(() => {
          const R = measure(), a = R.angles.map((x) => x * R2D), sum = a[0] + a[1] + a[2];
          if (!R.ok) return 'This rhumb-line triangle winds round a pole; move a vertex.';
          const km2 = R.area * R_MEAN * R_MEAN;
          const s = `$\\alpha + \\beta + \\gamma = ${a[0].toFixed(1)}^\\circ + ${a[1].toFixed(1)}^\\circ + ${a[2].toFixed(1)}^\\circ = ${sum.toFixed(2)}^\\circ$, excess **${(sum - 180).toFixed(2)}°**; area by counting cells: $\\text{Area}/R^2 = ${R.area.toFixed(4)}$ sr = **${(R.area * R2D).toFixed(2)}° ± ${(R.sigma * R2D).toFixed(2)}°** (${comma(km2 / 1e6, 1)} million km² on the Earth).`;
          return s + (rh.value ? ' With rhumb-line sides the angle sum is 180° exactly — they are straight lines on the conformal Mercator map — so Girard fails: its sides must be geodesics.' : ' Girard: the two agree to within the counting error.');
        });
      },
    },
  ],
};
