// Visual Art & Color — Chapter 3: Light, spectra and colour mixing (items 3.1–3.7; 3.8–3.13 are in ch03-b.js)
import { cmf, cmfT, specRGB, rgbOf, spdXYZ, xyOf, xyz2lin, lin2srgb, planck, bbXYZ, gauss, sigm, nBK7, nWater, specBars, drawChromaticity, SRGB, LOCUS, dominant, NEWTON, circPt, arcCentroid, newtonMix, arcAt, mixXYZ, rad, deg } from './ch03.shared.js';

// ---- small geometry helpers for the prism picture (3.1)
const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
const unit2 = (a) => { const n = Math.hypot(a[0], a[1]) || 1; return [a[0] / n, a[1] / n]; };
/** Snell refraction of the unit direction d at a surface with outward normal N, from index n1 to n2; null on total internal reflection. */
function refract(d, Nout, n1, n2) {
  const N = dot2(d, Nout) > 0 ? [-Nout[0], -Nout[1]] : Nout; // normal facing against the ray
  const eta = n1 / n2, ci = -dot2(N, d), s2 = eta * eta * (1 - ci * ci);
  if (s2 > 1) return null;
  const k = eta * ci - Math.sqrt(1 - s2);
  return unit2([eta * d[0] + k * N[0], eta * d[1] + k * N[1]]);
}
/** First crossing of the ray P + t d with the edges of triangle T beyond t > t0: {t, edge}. */
function hitTri(P, d, T, t0 = 1e-7) {
  let best = null;
  for (let i = 0; i < 3; i++) {
    const a = T[i], b = T[(i + 1) % 3], e = sub2(b, a), den = d[0] * e[1] - d[1] * e[0];
    if (Math.abs(den) < 1e-12) continue;
    const w = sub2(a, P), t = (w[0] * e[1] - w[1] * e[0]) / den, u = (w[0] * d[1] - w[1] * d[0]) / den;
    if (t > t0 && u >= 0 && u <= 1 && (!best || t < best.t)) best = { t, edge: i };
  }
  return best;
}
/** Pass a ray through the prism with vertices T (apex first) and index n: {p1, p2, d} or null (missed, or trapped inside). */
function throughPrism(P, d, T, n) {
  const cen = [(T[0][0] + T[1][0] + T[2][0]) / 3, (T[0][1] + T[1][1] + T[2][1]) / 3];
  const outN = (i) => { const a = T[i], b = T[(i + 1) % 3], N = unit2([b[1] - a[1], a[0] - b[0]]); const m = [(a[0] + b[0]) / 2 - cen[0], (a[1] + b[1]) / 2 - cen[1]]; return dot2(N, m) > 0 ? N : [-N[0], -N[1]]; };
  const h1 = hitTri(P, d, T); if (!h1) return null;
  const p1 = [P[0] + h1.t * d[0], P[1] + h1.t * d[1]], d1 = refract(d, outN(h1.edge), 1, n); if (!d1) return null;
  const h2 = hitTri(p1, d1, T, 1e-6); if (!h2) return null;
  const p2 = [p1[0] + h2.t * d1[0], p1[1] + h2.t * d1[1]], d2 = refract(d1, outN(h2.edge), n, 1); if (!d2) return null;
  return { p1, p2, d: d2 };
}

export default {
  collection: 'art',
  chapter: 3,
  title: 'Light, spectra and colour mixing',
  summary: String.raw`Colour begins with spectra. Newton’s prism shows white light as a mixture, and the physics of scattering, interference and thermal emission explains blue skies, iridescence and the warmth of candlelight. Mixing lights adds spectra while mixing filters or paints multiplies or scatters them, which is why the painter’s and the projectionist’s primaries differ.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Phenomenon',
      name: 'Newton’s prism: white light is a mixture',
      credit: 'Isaac Newton, 1666–72 (published in Phil. Trans. 1672; Opticks, 1704)',
      statement: String.raw`A narrow beam of sunlight passed through a glass prism leaves it as a fan of colours, red least deviated and violet most, because the refractive index of glass depends on wavelength, $n(\lambda)$, and Snell’s law $\sin\theta_1=n\sin\theta_2$ is applied to each wavelength separately. The colours are not made by the prism: a single colour picked out of the fan is not split again by a second prism, and a second, inverted prism of the same glass undoes the first one’s dispersion, so that the colours overlap again into a beam that is white in its middle.

For a prism of apex angle $A$ the deviation of a ray with incidence angle $i$ is $D=i+i'-A$, where $i'$ is the exit angle; it is smallest, $D_{\min}=2i-A$, when the ray crosses the prism symmetrically.`,
      idea: String.raw`Fermat’s principle gives Snell’s law (mech-5.2), and a wave travelling in glass has a phase speed $c/n(\omega)$ that depends on frequency (em-11.8), so each wavelength has its own refraction angle at each face. Because the second prism is the first one rotated by $180^\circ$, a ray that left the first one at angle $\theta$ meets the second under the mirror-image geometry and leaves parallel to the original beam, whatever its colour: all colours are parallel again and only a sideways offset remains, which shrinks as the prisms come together. Where the offsets overlap the screen is white; the coloured fringes at the two edges are the part of the beam where a few colours stand alone.`,
      caption: String.raw`White beam from the left, through a glass prism (Schott N-BK7 dispersion, Sellmeier fit) to the screen on the right. Drag the angle of incidence, the apex angle and the gap; switch the second prism on and the fan closes into a white beam with coloured edges. The dispersion slider is a what-if: at 0 the glass has one index for all colours and nothing spreads; at 1 it is N-BK7; above 1 it is a more dispersive glass.`,
      deps: ['mech-5.2', 'em-11.8'],
      refs: ['Kemp ch. 7'],
      tags: ['Newton', 'dispersion', 'prism'],
      scope: String.raw`Geometric optics in the plane of the prism, lossless glass, a point-like sun; the screen colours treat the beam as an equal-energy mixture of the visible wavelengths (400–700 nm).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dispersion_(optics)' },
      viz(v) {
        const M = v.M;
        const Aang = v.slider('apex angle $A$ (°)', 30, 75, 60, { step: 0.5 });
        const inc = v.slider('angle of incidence (°)', 25, 80, 50, { step: 0.5 });
        const dsl = v.slider('dispersion strength (1 = N-BK7)', 0, 3, 1, { step: 0.01 });
        const second = v.toggle('second prism, inverted', false);
        const gap = v.slider('gap between the prisms', 0.2, 4.5, 1.3, { step: 0.05 });
        const S = v.stage({ x: [-5.4, 10.6], y: [-3.7, 3.7], equal: true, axes: false, height: 400, weight: 1.6, title: 'the prism, the beam and the screen' });
        const P = v.stage({ x: [380, 720], y: [0, 1], axes: 'box', gutter: true, height: 400, weight: 0.8, minWidth: 250, xlabel: 'wavelength (nm)', ylabel: 'ray direction after the prisms', title: 'direction of each colour' });
        const n550 = nBK7(550), nOf = (l) => n550 + dsl.value * (nBK7(l) - n550);
        const L = 2.4, XS = 9.6, W = 0.5, DIRS = [];
        const tri = (A, size, flip, mid) => {
          const s = size * L * Math.sin(A / 2), h = size * L * Math.cos(A / 2), sg = flip ? -1 : 1;
          const pts = [[0, sg * h], [-s, 0], [s, 0]], m = [-s / 2, (sg * h) / 2];
          return pts.map((p) => [mid[0] + p[0] - m[0], mid[1] + p[1] - m[1]]);
        };
        let info = {};
        const white = [255, 255, 255];
        v.render(() => {
          const A = rad(Aang.value), th0 = -A / 2 + rad(inc.value), d0 = [Math.cos(th0), Math.sin(th0)], perp = [-Math.sin(th0), Math.cos(th0)];
          const T1 = tri(A, 1, false, [0, 0]);
          // trace one ray (wavelength l, offset o across the beam) to the screen
          const centre = throughPrism([-d0[0] * 6, -d0[1] * 6], d0, T1, nOf(550));
          let T2 = null;
          if (second.value && centre) { const E = centre.p2, dc = centre.d; T2 = tri(A, 1.9, true, [E[0] + gap.value * dc[0], E[1] + gap.value * dc[1]]); }
          const trace = (l, o) => {
            const st = [perp[0] * o - d0[0] * 6, perp[1] * o - d0[1] * 6], r1 = throughPrism(st, d0, T1, nOf(l));
            if (!r1) return null;
            const pts = [st, r1.p1, r1.p2]; let p = r1.p2, d = r1.d;
            if (T2) { const r2 = throughPrism(p, d, T2, nOf(l)); if (r2) { pts.push(r2.p1, r2.p2); p = r2.p2; d = r2.d; } }
            if (d[0] <= 1e-6) return null;
            const t = (XS - p[0]) / d[0], end = [XS, p[1] + t * d[1]]; pts.push(end);
            return { pts, d, y: end[1] };
          };
          // the prisms and the incident beam
          S.poly(T1, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.6 });
          if (T2) S.poly(T2, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.6 });
          const e1 = trace(550, W / 2), e2 = trace(550, -W / 2), c0 = trace(550, 0);
          if (e1 && e2 && c0) S.poly([e1.pts[0], e1.pts[1], e2.pts[1], e2.pts[0]], { fill: 'ink', fillAlpha: 0.14, stroke: false });
          if (c0) S.line(c0.pts[0][0], c0.pts[0][1], c0.pts[1][0], c0.pts[1][1], { color: 'ink', width: 2.2 });
          S.text('white light', -4.9, c0 ? c0.pts[0][1] + 0.55 : 0, { align: 'left', size: 12, color: 'muted' });
          // coloured rays
          const lams = [400, 440, 480, 520, 560, 600, 640, 680, 700];
          const dirs = [];
          for (const l of lams) {
            const r = trace(l, 0); if (!r) continue;
            const col = specRGB(l, 0.5);
            S.path(r.pts.slice(1), { color: col, width: 1.8 });
            dirs.push([l, Math.atan2(r.d[1], r.d[0])]);
          }
          // the screen: colour of the beam at each height, from a fine set of wavelengths with finite beam width
          const NY = 110, y0 = -3.6, y1 = 3.6, dy = (y1 - y0) / NY, acc = Array.from({ length: NY }, () => [0, 0, 0]);
          const wA = [0, 0, 0];
          for (let l = 400; l <= 700; l += 6) {
            const ra = trace(l, W / 2), rb = trace(l, -W / 2); if (!ra || !rb) continue;
            const c = cmfT(l), ya = Math.min(ra.y, rb.y), yb = Math.max(ra.y, rb.y);
            wA[0] += c[0]; wA[1] += c[1]; wA[2] += c[2];
            for (let k = Math.max(0, Math.floor((ya - y0) / dy)); k <= Math.min(NY - 1, Math.floor((yb - y0) / dy)); k++) { acc[k][0] += c[0]; acc[k][1] += c[1]; acc[k][2] += c[2]; }
          }
          const wl = xyz2lin(wA); let ymax = 0; acc.forEach((a) => { ymax = Math.max(ymax, a[1]); });
          if (ymax > 0 && wl[1] > 0) {
            acc.forEach((a, k) => {
              if (a[1] <= 1e-9) return;
              const q = xyz2lin(a).map((u, i) => (u / wl[i]) * (0.92 / (ymax / wA[1])));
              const m = Math.max(...q), c = lin2srgb(m > 1 ? q.map((u) => u / m) : q);
              S.rect(XS, y0 + k * dy, XS + 0.55, y0 + (k + 1) * dy + 0.005, { fill: c, stroke: false, fillAlpha: 1 });
            });
          }
          S.line(XS, -3.65, XS, 3.65, { color: 'muted', width: 1 });
          S.text('screen', XS + 0.3, 3.3, { align: 'center', size: 12, color: 'muted' });
          S.text('prism 1', 0.4, -0.55 - 1.4, { align: 'center', size: 11, color: 'accent' });
          if (T2) S.text('prism 2', T2[1][0] + 1.2, T2[0][1] + 0.5, { align: 'center', size: 11, color: 'accent' });
          // direction plot
          P.hline(th0 === 0 ? 0 : 0, { color: 'faint', width: 0 });
          P.setView([380, 720], [Math.min(...dirs.map((d) => deg(d[1]))) - 1, Math.max(...dirs.map((d) => deg(d[1]))) + 1].map((u, i) => (dirs.length ? u : [-1, 1][i])));
          P.path(dirs.map((d) => [d[0], deg(d[1])]), { color: 'ink', width: 1.3, alpha: 0.6 });
          for (const d of dirs) P.dot(d[0], deg(d[1]), { r: 5, color: specRGB(d[0], 0.5) });
          P.text(second.value ? 'with prism 2 all colours leave parallel' : 'violet is bent most', 550, deg(dirs.length ? dirs[Math.floor(dirs.length / 2)][1] : 0), { size: 11, color: 'muted', dy: -16 });
          // numbers
          const r4 = trace(400, 0), r7 = trace(700, 0), rc = trace(550, 0);
          const dev = (r) => (r ? deg(Math.atan2(r.d[1], r.d[0]) - th0) : NaN);
          // minimum-deviation angle for the glass at 550 nm
          info = { spread: r4 && r7 ? deg(Math.atan2(r4.d[1], r4.d[0]) - Math.atan2(r7.d[1], r7.d[0])) : NaN, dev: dev(rc), n4: nOf(400), n7: nOf(700), width: r4 && r7 ? Math.abs(r4.y - r7.y) : NaN, im: deg(Math.asin(Math.min(1, nOf(550) * Math.sin(A / 2)))) };
        });
        v.legend([['ink', 'white beam'], ['green', 'a colour of the fan'], ['faint', 'screen: colour of the beam at each height']]);
        v.readout(() => `$n(400\\,\\text{nm})=${v.fix(info.n4, 4)}$, $n(700\\,\\text{nm})=${v.fix(info.n7, 4)}$ · the 550 nm ray is deviated by $${v.fix(Math.abs(info.dev), 2)}^\\circ$ (minimum deviation needs incidence $${v.fix(info.im, 1)}^\\circ$, i.e. $D_{\\min}=2i-A=${v.fix(2 * info.im - Aang.value, 2)}^\\circ$)\nangle between the 400 nm and 700 nm rays leaving the ${second.value ? 'last prism' : 'prism'}: $${v.fix(Math.abs(info.spread), 4)}^\\circ$ · vertical separation of the two on the screen: $${v.fix(info.width, 3)}$ (beam width $0.5$)`);
      },
    },
  ],
};
