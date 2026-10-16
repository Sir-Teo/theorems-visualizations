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
        const S = v.stage({ x: [-5.2, 15.6], y: [-6.6, 3.0], equal: true, axes: false, height: 400, weight: 1.6, title: 'the prism, the beam and the screen' });
        const R = v.stage({ x: [0, 1], y: [-1, 1], axes: 'box', gutter: true, height: 400, weight: 0.55, minWidth: 190, xticks: [], ylabel: 'height on the screen', title: 'the screen, magnified' });
        const n550 = nBK7(550), nOf = (l) => n550 + dsl.value * (nBK7(l) - n550);
        const L = 2.4, XS = 13.6, W = 0.5;
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
          for (const l of lams) {
            const r = trace(l, 0); if (!r) continue;
            S.path(r.pts.slice(1), { color: specRGB(l, 0.5), width: 1.8 });
          }
          // the screen: colour of the beam at each height, from a fine set of wavelengths with finite beam width
          const NY = 120, hits = [];
          for (let l = 400; l <= 700; l += 6) { const ra = trace(l, W / 2), rb = trace(l, -W / 2); if (ra && rb) hits.push([l, Math.min(ra.y, rb.y), Math.max(ra.y, rb.y)]); }
          if (hits.length) {
            const lo = Math.min(...hits.map((h) => h[1])) - 0.06, hi = Math.max(...hits.map((h) => h[2])) + 0.06, dy = (hi - lo) / NY;
            const acc = Array.from({ length: NY }, () => [0, 0, 0]), wA = [0, 0, 0];
            for (const [l, ya, yb] of hits) {
              const c = cmfT(l); wA[0] += c[0]; wA[1] += c[1]; wA[2] += c[2];
              for (let k = Math.max(0, Math.floor((ya - lo) / dy)); k <= Math.min(NY - 1, Math.floor((yb - lo) / dy)); k++) { acc[k][0] += c[0]; acc[k][1] += c[1]; acc[k][2] += c[2]; }
            }
            const wl = xyz2lin(wA); let ymax = 0; acc.forEach((a) => { ymax = Math.max(ymax, a[1]); });
            R.setView([0, 1], [lo, hi]);
            acc.forEach((a, k) => {
              if (a[1] <= 1e-9) return;
              const q = xyz2lin(a).map((u, i) => (u / wl[i]) * (0.92 / (ymax / wA[1])));
              const m = Math.max(...q), c = lin2srgb(m > 1 ? q.map((u) => u / m) : q);
              S.rect(XS, lo + k * dy, XS + 0.5, lo + (k + 1) * dy + 0.004, { fill: c, stroke: false, fillAlpha: 1 });
              R.rect(0.05, lo + k * dy, 0.95, lo + (k + 1) * dy + 0.0005 * (hi - lo), { fill: c, stroke: false, fillAlpha: 1 });
            });
            R.text(second.value ? 'white where the colours overlap' : 'red end', 0.5, hi - 0.03 * (hi - lo), { size: 10.5, color: 'ink', align: 'center', baseline: 'top', plate: true });
            if (!second.value) R.text('violet end', 0.5, lo + 0.03 * (hi - lo), { size: 10.5, color: 'ink', align: 'center', baseline: 'bottom', plate: true });
          }
          S.line(XS, -6.5, XS, 2.9, { color: 'muted', width: 1 });
          S.text('screen', XS + 0.25, 2.5, { align: 'center', size: 12, color: 'muted' });
          S.text('prism 1', 0.1, -2.1, { align: 'center', size: 11, color: 'accent' });
          if (T2) S.text('prism 2', (T2[1][0] + T2[2][0]) / 2, T2[1][1] + 0.4, { align: 'center', size: 11, color: 'accent' });
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
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Concept',
      name: 'Spectral power distributions',
      credit: 'CIE 1931 standard observer; Wyman, Sloan & Shirley, 2013 (analytic fit used here)',
      statement: String.raw`A light is described by its **spectral power distribution** $S(\lambda)$: the power it carries per unit wavelength, over the visible range $380$–$780$ nm. The eye reduces this whole curve to three numbers, the responses of its three cone types, and the standard way to compute them is to integrate against the CIE colour-matching functions:
$$X=\int S\,\bar x\,d\lambda,\qquad Y=\int S\,\bar y\,d\lambda,\qquad Z=\int S\,\bar z\,d\lambda .$$
Two lights with different $S$ but the same $(X,Y,Z)$ look identical (metamers); a light with a narrow line or a smooth hump can be as bright and as white as another one with a completely different curve.`,
      idea: String.raw`A spectrum is a point in an infinite-dimensional space, vision keeps only three linear functionals of it, and so the map from spectra to perceived colour has a huge kernel: that is the whole reason three primaries can imitate any colour (art-3.5). The colour a surface shows depends on the light as much as on the surface, because the reflected spectrum is the product $S(\lambda)R(\lambda)$: a lamp lacking the wavelengths a pigment reflects makes it look dark.`,
      caption: String.raw`Choose a lamp: the curve is its spectrum, each bar tinted with the colour of its own wavelength. The swatches on the right are what a camera with fixed white balance would record for a white card and four coloured cards lit by that lamp. Compare the LED with sunlight: very different curves, almost the same white. Switch on “eye adapts” to rescale the lamp’s white to daylight white, as the visual system roughly does; the sodium lamp stays nearly monochromatic and cannot be rescued.`,
      deps: ['art-3.1'],
      refs: ['Fairchild ch. 3'],
      tags: ['spectrum', 'colorimetry', 'metamerism'],
      scope: String.raw`The curves are models, not measurements: the sun is a $5772$ K black body (the IAU nominal solar effective temperature), the incandescent lamp a $2856$ K black body (CIE illuminant A), the LED a blue Gaussian plus a broad phosphor Gaussian of generic shape, sodium its two D lines at $588.995$ and $589.592$ nm with intensities $2:1$. The card reflectances are smooth model curves. Colours use the standard-observer fit of the colour-matching functions and the sRGB primaries.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Spectral_power_distribution' },
      viz(v) {
        const SRC = {
          sun: { f: (l) => planck(l, 5772), lines: null, label: 'sunlight (5772 K black body)' },
          tung: { f: (l) => planck(l, 2856), lines: null, label: 'incandescent lamp (2856 K black body)' },
          led: { f: (l) => 0.62 * gauss(l, 450, 22) + 0.95 * gauss(l, 572, 105), lines: null, label: 'white LED (blue pump + phosphor, model)' },
          na: { f: () => 0, lines: [[588.995, 1], [589.592, 0.5]], label: 'sodium lamp (D lines)' },
          eq: { f: () => 1, lines: null, label: 'equal-energy spectrum (CIE illuminant E)' },
        };
        const sel = v.select('light source', [{ value: 'sun', label: 'sunlight' }, { value: 'tung', label: 'incandescent' }, { value: 'led', label: 'white LED' }, { value: 'na', label: 'sodium lamp' }, { value: 'eq', label: 'equal energy' }], 'sun');
        const adapt = v.toggle('eye adapts to the lamp’s white', false);
        const S1 = v.stage({ x: [380, 780], y: [0, 1.18], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'relative power', height: 330, weight: 1.35, title: 'spectral power distribution $S(\\lambda)$' });
        const S2 = v.stage({ x: [0, 6.4], y: [0, 3.9], axes: false, equal: true, height: 330, weight: 0.85, minWidth: 250, title: 'the lamp, and cards lit by it' });
        const cards = [
          { name: 'white', R: () => 0.9 },
          { name: 'red', R: (l) => 0.05 + 0.85 * sigm((l - 595) / 10) },
          { name: 'green', R: (l) => 0.05 + 0.55 * gauss(l, 540, 80) },
          { name: 'blue', R: (l) => 0.05 + 0.6 * gauss(l, 450, 70) },
          { name: 'yellow', R: (l) => 0.05 + 0.85 * sigm((l - 515) / 12) },
        ];
        const xyzOf = (src, R) => {
          const c = spdXYZ((l) => src.f(l) * R(l), 5);
          if (src.lines) for (const [l, p] of src.lines) { const m = cmf(l), r = R(l); c[0] += 4 * p * r * m[0]; c[1] += 4 * p * r * m[1]; c[2] += 4 * p * r * m[2]; }
          return c;
        };
        const HPE = [[0.4002, 0.7076, -0.0808], [-0.2263, 1.1653, 0.0457], [0, 0, 0.9182]], HI = v.M.inverse(HPE), D65 = [0.9505, 1, 1.089];
        const adaptXYZ = (c, w) => { const a = v.M.matVec(HPE, w), b = v.M.matVec(HPE, D65), q = v.M.matVec(HPE, c); return v.M.matVec(HI, q.map((u, i) => (u * b[i]) / a[i])); };
        let info = {};
        v.render(() => {
          const src = SRC[sel.value], w = xyzOf(src, () => 1), Yw = w[1];
          let fmax = 0;
          const f = (l) => src.f(l);
          for (let l = 380; l <= 780; l += 2) fmax = Math.max(fmax, f(l));
          if (src.lines) {
            for (const [l, p] of src.lines) { S1.line(l, 0, l, p, { color: specRGB(l, 0.55), width: 4 }); }
            S1.text('588.995 and 589.592 nm\n(two lines, 2 : 1)', 600, 1.02, { align: 'left', size: 11, color: 'muted' });
            S1.text('the lines are 0.6 nm apart: far narrower than the 5 nm sampling elsewhere', 790, 0.12, { align: 'right', size: 10, color: 'faint' });
          } else {
            specBars(S1, (l) => f(l) / fmax, 380, 780, 2, { alpha: 0.85 });
            S1.fn((l) => f(l) / fmax, { color: 'ink', width: 1.6, domain: [380, 780] });
          }
          S1.text(src.label, 384, 1.1, { align: 'left', size: 12, color: 'ink' });
          // swatches
          const paint = (R, x0, y0, x1, y1, nm) => {
            let c = xyzOf(src, R).map((u) => u / Yw);
            if (adapt.value) c = adaptXYZ(c, w.map((u) => u / Yw));
            const rgb = rgbOf(c.map((u) => u * 0.8));
            S2.rect(x0, y0, x1, y1, { fill: rgb, stroke: false, fillAlpha: 1, radius: 8 });
            S2.text(nm, (x0 + x1) / 2, y0 - 0.08, { size: 11, color: 'muted', align: 'center', baseline: 'top' });
            return c;
          };
          const c0 = paint(() => 1, 0.1, 1.9, 3.2, 3.6, 'the lamp seen on a perfect white card');
          const xs = [0.1, 1.35, 2.6, 3.85, 5.1];
          cards.slice(1).forEach((cd, i) => paint(cd.R, 0.1 + i * 1.6, 0.45, 0.1 + i * 1.6 + 1.4, 1.5, cd.name));
          for (let i = 0; i < 0; i++) xs[i];
          const sun = xyOf(xyzOf(SRC.sun, () => 1)), me = xyOf(w);
          info = { xy: me, dsun: Math.hypot(me[0] - sun[0], me[1] - sun[1]), Yw, clip: rgbOf(w.map((u) => (u / Yw) * 0.8)).clip };
        });
        v.legend([['ink', 'spectrum'], ['accent', 'bars: colour of each wavelength']]);
        v.readout(() => `chromaticity of the lamp: $x=${v.fix(info.xy[0], 4)},\\ y=${v.fix(info.xy[1], 4)}$ · distance from sunlight in the $xy$ plane: $${v.fix(info.dsun, 4)}$${sel.value === 'led' ? ' (a metamer-like match with a very different curve)' : ''}${info.clip > 0.02 ? ' · this colour lies outside the sRGB gamut and is shown desaturated' : ''}\nthe display colour of each card is the integral $\\int S(\\lambda)R(\\lambda)\\,\\bar c(\\lambda)\\,d\\lambda$, scaled by the lamp’s own $Y$`);
      },
    },
  ],
};
