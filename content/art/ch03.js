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
      verify: true,
      viz(v) {
        const SRC = {
          sun: { f: (l) => planck(l, 5772), lines: null, label: 'sunlight (5772 K black body)' },
          tung: { f: (l) => planck(l, 2856), lines: null, label: 'incandescent lamp (2856 K black body)' },
          led: { f: (l) => 1.8 * gauss(l, 450, 22) + gauss(l, 570, 120), lines: null, label: 'white LED (blue pump + phosphor, model)' },
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
            S1.text('two lines, 589.0 and 589.6 nm', 610, 0.9, { align: 'left', size: 11, color: 'muted' });
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
          const c0 = paint(() => 1, 0.1, 1.9, 3.2, 3.6, 'white card');
          cards.slice(1).forEach((cd, i) => paint(cd.R, 0.1 + i * 1.6, 0.45, 0.1 + i * 1.6 + 1.4, 1.5, cd.name));
          const sun = xyOf(xyzOf(SRC.sun, () => 1)), me = xyOf(w);
          info = { xy: me, dsun: Math.hypot(me[0] - sun[0], me[1] - sun[1]), Yw, clip: rgbOf(w.map((u) => (u / Yw) * 0.8)).clip };
        });
        v.legend([['ink', 'spectrum'], ['accent', 'bars: colour of each wavelength']]);
        v.readout(() => `chromaticity of the lamp: $x=${v.fix(info.xy[0], 4)},\\ y=${v.fix(info.xy[1], 4)}$ · distance from sunlight in the $xy$ plane: $${v.fix(info.dsun, 4)}$${sel.value !== 'sun' && info.dsun < 0.02 ? ' (almost the same colour as sunlight, from a different curve)' : ''}${info.clip > 0.02 ? ' · this colour lies outside the sRGB gamut and is shown desaturated' : ''}\nthe display colour of each card is the integral $\\int S(\\lambda)R(\\lambda)\\,\\bar c(\\lambda)\\,d\\lambda$, scaled by the lamp’s own $Y$`);
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Concept',
      name: 'Newton’s colour circle and centre-of-gravity mixing',
      credit: 'Isaac Newton, Opticks, 1704 (Book I, Part II, Prop. VI)',
      statement: String.raw`Newton arranges the spectral colours around a circle (red, orange, yellow, green, blue, indigo, violet, with the purples closing the gap between violet and red). To find the colour of a mixture of lights, put at the centre of gravity of each colour’s arc a weight equal to the amount of that colour in the mixture, and find the centre of gravity $Z$ of all the weights. The direction of $Z$ from the centre $O$ gives the **hue** of the mixture and the ratio $|OZ|/R$ its **fullness**; a mixture whose $Z$ is at the centre is white.

The rule is exact in one respect, that mixing is a weighted average: the colour of a mixture lies on the segment between the colours mixed, in proportion to their amounts. It is only a rough guide in another: the circle is a diagram, and the true mixing space is the chromaticity diagram, whose colour-wheel is not a circle with equal-weight centres.`,
      idea: String.raw`Light adds linearly, so the response of the eye to a mixture is the weighted sum of its responses to the parts; in the chromaticity plane that is a weighted average of points. Newton’s circle is a hand-drawn version of that plane in which the spectrum is bent into a ring, and its centre stands for white. The picture is qualitative: the true spectral locus is not a circle and the weights $X+Y+Z$ that make the average exact are not equal for equal powers, which is why the comparison panel disagrees with the circle by a visible amount.`,
      caption: String.raw`Drag the seven sliders (amounts of each spectral colour). The coloured ring is Newton’s circle with his arc proportions; the gold point $Z$ is the centre of gravity of the weights placed at the arcs’ own centres of gravity, and the line $OZ$ extended hits the rim at the hue. On the right, the chromaticity diagram compares Newton’s prediction (open ring) with the true mixture of lights at the same wavelengths (gold dot). Try the presets: Newton’s own example, a red–green–violet mixture balanced so that $Z=O$, and an orange–blue pair.`,
      deps: ['art-3.1'],
      refs: ['Kemp ch. 7'],
      tags: ['Newton', 'colour circle', 'mixing'],
      scope: String.raw`Newton’s arc lengths are the proportions printed in the Opticks; the wavelength attached to each colour name is a conventional mid-band value (660, 607, 577, 532, 482, 452, 420 nm), not Newton’s. The “true mixture” assumes the weights are radiant powers of monochromatic lights at those wavelengths and uses the standard-observer fit of the colour-matching functions.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Color_wheel' },
      viz(v) {
        const names = NEWTON.arcs.map((a) => a.name);
        const sl = names.map((nm, i) => v.slider(nm, 0, 12, [10, 6, 5, 3, 2, 1, 1][i], { step: 0.1 }));
        const set = (a) => a.forEach((x, i) => sl[i].set(x));
        v.button('Newton’s example', () => set([10, 6, 5, 3, 2, 1, 1]));
        v.button('red + green + violet, balanced', () => {
          // barycentric weights placing Z at the centre of the circle
          const P = [0, 3, 6].map(arcCentroid), Mx = [[P[0][0], P[1][0], P[2][0]], [P[0][1], P[1][1], P[2][1]], [1, 1, 1]], w = v.M.solve(Mx, [0, 0, 1]);
          const k = 6 / Math.max(...w); set([w[0] * k, 0, 0, w[1] * k, 0, 0, w[2] * k]);
        });
        v.button('all seven equal', () => set([4, 4, 4, 4, 4, 4, 4]));
        v.button('orange + blue', () => set([0, 6, 0, 0, 6, 0, 0]));
        const C = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, height: 400, weight: 1, title: 'Newton’s circle' });
        const X = v.stage({ x: [0.0, 0.8], y: [0.0, 0.9], equal: true, axes: false, height: 400, weight: 1, title: 'the same mixture on the chromaticity diagram' });
        const centres = NEWTON.arcs.map((a) => (a.a0 + a.a1) / 2);
        const hueXY = (ang) => {
          // piecewise interpolation of the wavelengths of the arc centres; across the red–violet seam the hue is a purple
          const A = NEWTON.arcs, cc = centres.map((c, i) => [c, A[i].rep]);
          const ext = [[cc[6][0] - 2 * Math.PI, A[6].rep, 6], ...cc.map((c, i) => [c[0], c[1], i]), [cc[0][0] + 2 * Math.PI, A[0].rep, 0]];
          for (let j = 0; j + 1 < ext.length; j++) {
            const a = ext[j], b = ext[j + 1];
            if (ang >= a[0] && ang <= b[0]) {
              const u = (ang - a[0]) / (b[0] - a[0]);
              if (j === 0 || j === ext.length - 2) { // purple seam: mix of violet and red lights of equal luminance
                const ca = cmf(420), cb = cmf(660), na = ca[1] ? ca.map((q) => q / ca[1]) : ca, nb = cb.map((q) => q / cb[1]);
                const uu = j === 0 ? u : u, m = [0, 1, 2].map((q) => (j === 0 ? (1 - uu) * na[q] + uu * nb[q] : (1 - uu) * nb[q] + uu * na[q]));
                return xyOf(j === 0 ? m : m);
              }
              const l = a[1] + u * (b[1] - a[1]); return xyOf(cmf(l));
            }
          }
          return [1 / 3, 1 / 3];
        };
        let info = {};
        v.render(() => {
          const wts = sl.map((s) => s.value), mx = newtonMix(wts);
          // the ring
          C.circle(0, 0, 1, { color: 'faint', width: 1 });
          for (const A of NEWTON.arcs) {
            const NST = 16;
            for (let k = 0; k < NST; k++) {
              const t0 = A.a0 + (A.w * k) / NST, t1 = A.a0 + (A.w * (k + 1)) / NST + 0.004, l = Math.min(660, Math.max(430, A.l0 + ((A.l1 - A.l0) * (k + 0.5)) / NST));
              C.poly([circPt(t0, 0.9), circPt(t1, 0.9), circPt(t1, 1.0), circPt(t0, 1.0)], { fill: specRGB(l, 0.5), stroke: false, fillAlpha: 1 });
            }
          }
          NEWTON.arcs.forEach((A, i) => {
            const p = circPt(A.a0, 1.0), q = circPt(A.a0, 1.07), m = circPt((A.a0 + A.a1) / 2, 1.3);
            C.line(p[0], p[1], q[0], q[1], { color: 'muted', width: 1 });
            C.text(A.letter, ...circPt(A.a0, 1.13), { size: 11, color: 'muted', align: 'center', baseline: 'middle' });
            C.text(A.name, m[0], m[1], { size: 11, color: 'muted', align: 'center', baseline: 'middle' });
          });
          // weights at the arcs' centres of gravity (area proportional to the amount)
          const tot = wts.reduce((a, b) => a + b, 0) || 1;
          wts.forEach((w, i) => {
            if (w <= 0) return;
            const c = arcCentroid(i), r = 0.075 * Math.sqrt(w);
            C.circle(c[0], c[1], r, { fill: specRGB(NEWTON.arcs[i].rep, 0.5), fillAlpha: 0.75, color: 'ink', width: 1 });
          });
          if (mx.sw > 0) {
            const Y = circPt(mx.ang, 1), hue = hueXY(mx.ang);
            C.line(0, 0, Y[0], Y[1], { color: 'ink', width: 1.2, dash: [5, 4], alpha: 0.7 });
            C.line(0, 0, mx.Z[0], mx.Z[1], { color: 'ink', width: 2.6 });
            C.dot(Y[0], Y[1], { r: 5, hollow: true, color: 'ink', label: 'Y', labelPos: 'n' });
            C.dot(mx.Z[0], mx.Z[1], { r: 6.5, color: 'gold', label: 'Z', labelPos: 'ne' });
          }
          C.dot(0, 0, { r: 3.5, color: 'ink', label: 'O', labelPos: 'sw' });
          // chromaticity comparison
          X.setView([-0.02, 0.8], [-0.02, 0.9]);
          drawChromaticity(X, v, { ticks: [460, 500, 540, 580, 620] });
          const Wp = [1 / 3, 1 / 3], mixc = mixXYZ(wts), xyMix = mx.sw > 0 ? xyOf(mixc) : Wp;
          let pred = Wp;
          if (mx.sw > 0) { const h = hueXY(mx.ang); pred = [Wp[0] + mx.full * (h[0] - Wp[0]), Wp[1] + mx.full * (h[1] - Wp[1])]; }
          X.dot(Wp[0], Wp[1], { r: 3.5, color: 'ink', label: 'white', labelPos: 'sw' });
          X.dot(pred[0], pred[1], { r: 8, hollow: true, color: 'ink', label: 'Newton', labelPos: 'nw' });
          X.dot(xyMix[0], xyMix[1], { r: 6, color: 'gold', label: 'light mixture', labelPos: 'se' });
          const dm = dominant(xyMix[0], xyMix[1]), at = arcAt(mx.ang);
          info = { mx, pred, xyMix, dm, at, dist: Math.hypot(pred[0] - xyMix[0], pred[1] - xyMix[1]) };
        });
        v.legend([['gold', '$Z$, the centre of gravity, and the true mixture'], ['ink', 'Newton’s predicted colour (ring) and the rule $OZ$']]);
        v.readout(() => {
          if (info.mx.sw <= 0) return 'all weights are zero: no light, no colour';
          const A = NEWTON.arcs[info.at.i];
          const purple = info.mx.ang > centres[6] || info.mx.ang < centres[0] ? ' (in the purple gap between violet and red)' : '';
          return `Newton’s rule: hue in the ${A.name} arc, ${v.fix(100 * info.at.u, 0)}% of the way from ${A.letter} to ${NEWTON.arcs[(info.at.i + 1) % 7].letter}${purple}; fullness $|OZ|/R=${v.fix(info.mx.full, 3)}$\nmixture of the lights themselves: $x=${v.fix(info.xyMix[0], 3)},\\ y=${v.fix(info.xyMix[1], 3)}$, ${info.dm.l ? `${info.dm.purple ? 'complementary' : 'dominant'} wavelength $${v.fix(info.dm.l, 0)}$ nm, purity $${v.fix(info.dm.purity, 2)}$` : 'white'}; Newton’s prediction and the true mixture are $${v.fix(info.dist, 3)}$ apart in $xy$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Phenomenon',
      name: 'The rainbow and Descartes’ 42° ray',
      credit: 'René Descartes, Les Météores (Discours VIII), 1637; the colours: Isaac Newton, Opticks, 1704',
      statement: String.raw`A parallel beam of sunlight falls on a spherical water drop. A ray at impact parameter $b$ (distance from the axis, in units of the drop’s radius) meets the surface at incidence angle $i$ with $\sin i=b$, refracts to the angle $r$ with $\sin i=n\sin r$, is reflected $k$ times inside and leaves. For $k=1$ the angle between the incoming and outgoing directions is $D=180^\circ+2i-4r$, so an observer sees that ray at $\psi=180^\circ-D=4r-2i$ from the antisolar point.

$\psi(b)$ has a **maximum**, $\psi_{\max}$, where $\cos^2 i=(n^2-1)/3$: rays near it leave in nearly the same direction, so the light piles up in a bright ring at $\psi_{\max}$ and the sky is dark outside it. Because $n$ is larger for blue than for red, $\psi_{\max}$ is about $42.4^\circ$ for red and $40.6^\circ$ for violet, giving a bow with red outside. For $k=2$ the extremum is a minimum near $51^\circ$ and the order of colours is reversed (secondary bow).`,
      idea: String.raw`Snell’s law (mech-5.2) turns the family of parallel rays into a map $b\mapsto\psi$; light is concentrated where that map has a stationary point, since $\psi$ changes least there. That is a fold caustic of the ray bundle, and it is why a rainbow is a thin ring and not a disc. Descartes found the 42° ring by tracing rays through a large water-filled sphere and computing; Newton’s prism result (art-3.1) supplied the missing step, that each colour has its own $n$ and therefore its own ring.`,
      caption: String.raw`Drag the incoming ray (the handle on the left) up and down: the path through the drop is traced with Snell’s law, and the point on the curve at the right marks the angle $\psi$ at which an observer sees it. The curve flattens at its maximum: many rays share almost one direction. Move the wavelength slider to see the maximum move; switch to the secondary bow; raise the sun to watch the bow sink below the horizon (the primary bow is invisible when the sun is higher than about $42^\circ$).`,
      deps: ['art-3.1', 'mech-5.2'],
      refs: ['Kemp ch. 6'],
      tags: ['rainbow', 'Descartes', 'refraction'],
      scope: String.raw`Geometric optics for a single spherical drop (no diffraction, so no supernumerary bows and no brightness estimate) with the refractive index of pure water at $20^\circ$C (Daimon–Masumura 2007 fit); real bows are broadened by the finite size of the sun ($0.53^\circ$) and by the drop-size distribution.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rainbow' },
      viz(v) {
        const M = v.M;
        const order = v.select('bow', [{ value: 1, label: 'primary (1 reflection)' }, { value: 2, label: 'secondary (2 reflections)' }], 1);
        const lam = v.slider('wavelength (nm)', 400, 700, 656, { step: 1 });
        const many = v.toggle('show many rays', true);
        const sun = v.slider('sun elevation (°)', 0, 50, 15, { step: 0.5 });
        const D = v.stage({ x: [-2.1, 2.1], y: [-1.6, 1.6], equal: true, axes: false, height: 380, weight: 1.05, title: 'a ray through a water drop' });
        const Pst = v.stage({ x: [0, 1], y: [0, 50], axes: 'box', gutter: true, height: 380, weight: 0.85, minWidth: 260, xlabel: 'impact parameter $b$', ylabel: 'angle from the antisolar point $\\psi$ (°)', title: 'where the ray is seen' });
        const Sky = v.stage({ x: [-90, 90], y: [-12, 62], equal: true, axes: false, height: 340, full: true, title: 'the sky, with the sun behind you' });
        const hb = D.handle(-1.9, 0.86, { color: 'gold', constrain: (x, y) => [-1.9, M.clamp(y, 0.01, 0.995)], label: 'b' });
        const trace = (b, n, k) => {
          let P = [-Math.sqrt(1 - b * b), b], d = refract([1, 0], P, 1, n); if (!d) return null;
          const pts = [P];
          for (let j = 0; j < k; j++) { const t = -2 * (P[0] * d[0] + P[1] * d[1]); P = [P[0] + t * d[0], P[1] + t * d[1]]; pts.push(P); const dn = d[0] * P[0] + d[1] * P[1]; d = [d[0] - 2 * dn * P[0], d[1] - 2 * dn * P[1]]; }
          const t = -2 * (P[0] * d[0] + P[1] * d[1]); P = [P[0] + t * d[0], P[1] + t * d[1]]; pts.push(P);
          d = refract(d, P, n, 1); if (!d) return null;
          return { pts, d, psi: deg(Math.acos(M.clamp(-d[0], -1, 1))) }; // psi = 180 - scattering angle
        };
        // extremum of psi(b) for the order k and index n: scan, then refine by golden section
        const extremum = (n, k) => {
          const f = (b) => { const r = trace(b, n, k); return r ? r.psi : NaN; };
          let best = 0.5, bv = k === 1 ? -1 : 1e9;
          for (let b = 0.02; b < 0.995; b += 0.002) { const q = f(b); if (k === 1 ? q > bv : q < bv) { bv = q; best = b; } }
          let a = best - 0.004, c = best + 0.004; const sgn = k === 1 ? -1 : 1;
          for (let it = 0; it < 60; it++) { const m1 = a + (c - a) * 0.382, m2 = a + (c - a) * 0.618; if (sgn * f(m1) < sgn * f(m2)) c = m2; else a = m1; }
          return { b: (a + c) / 2, psi: f((a + c) / 2) };
        };
        let info = {};
        v.render(() => {
          const k = order.value, n = nWater(lam.value), col = specRGB(lam.value, 0.5), ext = extremum(n, k);
          // drop
          D.circle(0, 0, 1, { fill: 'accent', fillAlpha: 0.07, color: 'accent', width: 1.6 });
          if (many.value) for (let b = -0.98; b <= 0.98; b += 0.04) {
            const bb = Math.abs(b); if (bb < 0.005) continue;
            const r = trace(bb, n, k); if (!r) continue;
            const sg = Math.sign(b), pts = r.pts.map((p) => [p[0], sg * p[1]]), e = r.pts[r.pts.length - 1], dd = [r.d[0], sg * r.d[1]];
            D.path([[-1.9, sg * bb], ...pts, [pts[pts.length - 1][0] + 1.0 * dd[0], pts[pts.length - 1][1] + 1.0 * dd[1]]], { color: col, width: 0.9, alpha: 0.42 });
          }
          const r = trace(hb.y, n, k);
          D.line(-1.9, hb.y, r ? r.pts[0][0] : 0, hb.y, { color: 'gold', width: 2.2 });
          if (r) {
            D.path(r.pts, { color: 'gold', width: 2.2 });
            const e = r.pts[r.pts.length - 1];
            D.arrow(e[0], e[1], e[0] + 0.9 * r.d[0], e[1] + 0.9 * r.d[1], { color: 'gold', width: 2.2 });
          }
          D.arrow(-1.9, -1.35, -1.2, -1.35, { color: 'muted', width: 1.5 });
          D.text('sunlight', -1.9, -1.5, { size: 11, color: 'muted', align: 'left' });
          // psi(b) for three colours
          const lo = k === 1 ? 0 : 45, hi = k === 1 ? 50 : 185;
          Pst.setView([0, 1], [lo, hi]);
          for (const l of [400, 550, 700]) {
            const pts = []; for (let b = 0.005; b < 1; b += 0.005) { const q = trace(b, nWater(l), k); if (q) pts.push([b, q.psi]); }
            Pst.path(pts, { color: specRGB(l, 0.5), width: l === lam.value ? 3 : 1.8, alpha: 0.9 });
          }
          const pts = []; for (let b = 0.005; b < 1; b += 0.005) { const q = trace(b, n, k); if (q) pts.push([b, q.psi]); }
          Pst.path(pts, { color: col, width: 3 });
          Pst.hline(ext.psi, { color: col, width: 1, dash: [5, 4] });
          Pst.dot(ext.b, ext.psi, { r: 5, color: col, label: `${v.fix(ext.psi, 2)}°`, labelPos: k === 1 ? 'nw' : 'se' });
          if (r) Pst.dot(hb.y, r.psi, { r: 6, color: 'gold' });
          // sky
          const h = sun.value;
          Sky.rect(-400, -12, 400, 0, { fill: 'ink', fillAlpha: 0.12, stroke: false });
          Sky.line(-400, 0, 400, 0, { color: 'muted', width: 1.5 });
          Sky.clip(() => {
            for (let l = 700; l >= 400; l -= 10) {
              const e = extremum(nWater(l), k), cc = specRGB(l, 0.5);
              Sky.curve((t) => [e.psi * Math.cos(t), -h + e.psi * Math.sin(t)], 0.0, Math.PI, { color: cc, width: 5, n: 200 });
            }
          });
          Sky.dot(0, -h, { r: 4, color: 'muted' });
          Sky.text(`antisolar point (${v.fix(h, 0)}° below the horizon)`, 3, -10, { size: 11, color: 'muted', align: 'left' });
          const eR = extremum(nWater(700), k), eV = extremum(nWater(400), k);
          Sky.text(k === 1 ? 'red outside' : 'red inside', 0, Math.max(eR.psi, eV.psi) - h + 4, { size: 11, color: 'muted', align: 'center' });
          const ex = extremum(nWater(656.3), 1), fi = Math.acos(Math.sqrt((nWater(656.3) ** 2 - 1) / 3));
          info = { ext, n, r, k, red: extremum(nWater(656.3), k), vio: extremum(nWater(405), k), ibest: fi, formula: deg(4 * Math.asin(Math.sin(fi) / nWater(656.3)) - 2 * fi), h, top: eR.psi - h, topV: eV.psi - h };
        });
        v.legend([['gold', 'the ray you hold'], ['accent', 'drop']]);
        v.readout(() => `$n(${v.fix(lam.value, 0)}\\,\\text{nm})=${v.fix(info.n, 4)}$: the ${info.k === 1 ? 'maximum' : 'minimum'} of $\\psi$ is $${v.fix(info.ext.psi, 2)}^\\circ$ at $b=${v.fix(info.ext.b, 3)}$ ($i=${v.fix(deg(Math.asin(info.ext.b)), 1)}^\\circ$)\nred (656 nm) ${v.fix(info.red.psi, 2)}°, violet (405 nm) ${v.fix(info.vio.psi, 2)}°: the ${info.k === 1 ? 'primary' : 'secondary'} bow is $${v.fix(Math.abs(info.red.psi - info.vio.psi), 2)}^\\circ$ wide · check for the primary bow at 656 nm from $\\cos^2 i=(n^2-1)/3$: $\\psi_{\\max}=4r-2i=${v.fix(info.formula, 2)}^\\circ$ · with the sun at $${v.fix(info.h, 1)}^\\circ$ the top of the ${info.k === 1 ? 'primary' : 'secondary'} bow is ${info.top > 0 || info.topV > 0 ? `$${v.fix(Math.max(info.top, info.topV), 1)}^\\circ$ above the horizon` : 'below the horizon: no bow'}`);
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Concept',
      name: 'Additive colour mixing',
      credit: 'Grassmann’s laws, 1853; Maxwell’s colour-matching experiments, 1860',
      statement: String.raw`When several lights fall on the same spot their spectra **add**: the mixture of lights with spectra $S_1,S_2,S_3$ and intensities $I_1,I_2,I_3$ has spectrum $\sum_k I_kS_k(\lambda)$. Because the tristimulus values are integrals of the spectrum, they add too, $(X,Y,Z)=\sum_kI_k(X_k,Y_k,Z_k)$, and the chromaticity of the mixture is a weighted average of the primaries’ chromaticities, with weights $I_k(X_k+Y_k+Z_k)$. The colours obtainable from three real primaries therefore fill the **triangle** whose corners are the primaries on the chromaticity diagram, and no triangle with corners on the spectral locus can fill the whole diagram.`,
      idea: String.raw`Integration is linear, and the eye’s three responses are integrals of the incoming spectrum (art-3.2), so mixing lights is vector addition in $XYZ$ space and a barycentric average in the chromaticity plane. The curved edge of the spectral locus is the limit: every real colour is a positive combination of monochromatic lights, so it lies inside the locus, but a triangle with its corners on the curved boundary cuts off the bays between the corners. That is why a screen cannot show a saturated cyan or the deepest greens.`,
      caption: String.raw`Three spotlights on a dark wall, mixed by their intensity sliders (the spectra on the left add, the mixed colour sits inside the triangle on the chromaticity diagram). Switch the primaries: broad LEDs make a modest triangle, narrow laser lines a big one that reaches far outside the dashed sRGB triangle of a typical screen, so your own screen can only approximate those colours (the wall shows the nearest displayable colour and the readout says when it had to). The intensities are scaled so that all three at 1 give an equal-energy white.`,
      deps: ['art-3.2'],
      refs: ['Fairchild ch. 3'],
      tags: ['additive', 'primaries', 'gamut'],
      scope: String.raw`Valid for lights superposed on the retina, in the range where the cone responses are linear (Grassmann’s laws hold approximately, not at very high intensities). The primaries here are model Gaussian lines with the stated wavelengths and widths, and the observer is the CIE 1931 standard observer.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Additive_color' },
      viz(v) {
        const SETS = {
          led: { name: 'LED-like (630, 532, 465 nm; width 30 nm)', c: [630, 532, 465], w: 30 },
          laser: { name: 'laser lines (635, 532, 450 nm; width 2 nm)', c: [635, 532, 450], w: 2 },
          broad: { name: 'broad filters (610, 545, 460 nm; width 70 nm)', c: [610, 545, 460], w: 70 },
        };
        const sel = v.select('primaries', [{ value: 'led', label: 'LED-like' }, { value: 'laser', label: 'laser lines' }, { value: 'broad', label: 'broad' }], 'led');
        const sI = [v.slider('red', 0, 1, 1, { step: 0.01 }), v.slider('green', 0, 1, 1, { step: 0.01 }), v.slider('blue', 0, 1, 0.6, { step: 0.01 })];
        const sRGBtri = v.toggle('dashed sRGB triangle', true);
        const W = v.stage({ x: [0, 9], y: [0, 6.2], equal: true, axes: false, height: 330, weight: 1, title: 'three spotlights on a wall' });
        const X = v.stage({ x: [-0.02, 0.8], y: [-0.02, 0.9], equal: true, axes: false, height: 330, weight: 1, title: 'chromaticity diagram' });
        const Sp = v.stage({ x: [380, 780], y: [0, 1.05], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'power', height: 240, full: true, title: 'the spectra that are added' });
        const cache = {};
        const setup = (key) => {
          if (cache[key]) return cache[key];
          const S = SETS[key], spec = S.c.map((c) => (l) => gauss(l, c, S.w));
          const P = spec.map((f) => spdXYZ(f, 1)), Mx = [[P[0][0], P[1][0], P[2][0]], [P[0][1], P[1][1], P[2][1]], [P[0][2], P[1][2], P[2][2]]];
          const E = spdXYZ(() => 1, 1), wgt = v.M.solve(Mx, E), k = Math.max(...wgt);
          const w = wgt.map((u) => u / k), XY = P.map((p, i) => p.map((u) => u * w[i])); // XYZ of each primary at full intensity
          const white = [0, 1, 2].map((j) => XY[0][j] + XY[1][j] + XY[2][j]), wl = xyz2lin(white);
          return (cache[key] = { S, spec, w, XY, white, wl });
        };
        const showRGB = (c, st) => { // white-balanced display colour, negative parts clamped
          let l = xyz2lin(c).map((u, i) => u / st.wl[i]); const sc = 0.9 / st.wl.reduce((a, b) => Math.max(a, b), 0) * 0 + 0.85;
          l = l.map((u) => Math.max(0, u) * sc); const m = Math.max(...l); if (m > 1) l = l.map((u) => u / m);
          return lin2srgb(l);
        };
        let info = {};
        const cols = [[220, 60, 60], [60, 180, 80], [70, 90, 230]];
        v.render(() => {
          const st = setup(sel.value), I = sI.map((s) => s.value);
          const sub = (mask) => { const c = [0, 0, 0]; for (let k = 0; k < 3; k++) if (mask & (1 << k)) for (let j = 0; j < 3; j++) c[j] += I[k] * st.XY[k][j]; return c; };
          const tab = Array.from({ length: 8 }, (_, m) => showRGB(sub(m), st));
          const centres = [[3.4, 3.7], [5.6, 3.7], [4.5, 1.95]], R = 2.0;
          W.rect(0, 0, 9, 6.2, { fill: [22, 22, 28], stroke: false, fillAlpha: 1 });
          W.raster((x, y) => {
            let m = 0; for (let k = 0; k < 3; k++) if (Math.hypot(x - centres[k][0], y - centres[k][1]) < R) m |= 1 << k;
            if (!m) return null; const c = tab[m]; return [c[0], c[1], c[2], 1];
          }, { res: 3, key: `${sel.value}|${I.map((u) => u.toFixed(3)).join(',')}`, rect: [0, 0, 9, 6.2] });
          ['red', 'green', 'blue'].forEach((nm, k) => W.text(nm + ' light', centres[k][0] + (k === 0 ? -1.2 : k === 1 ? 1.2 : 0), centres[k][1] + (k === 2 ? -2.25 : 2.15), { size: 11, color: [190, 190, 200], align: 'center', plate: false }));
          // chromaticity
          drawChromaticity(X, v, { ticks: [460, 500, 520, 540, 580, 620] });
          const xyP = st.XY.map((p) => xyOf(p));
          if (sRGBtri.value) X.path(SRGB, { color: 'ink', width: 1.4, dash: [6, 4], close: true, alpha: 0.7 });
          X.poly(xyP, { fill: 'ink', fillAlpha: 0.04, color: 'ink', width: 1.8 });
          xyP.forEach((p, k) => X.dot(p[0], p[1], { r: 6, color: cols[k] }));
          const mixc = sub(7), xyM = mixc[1] > 1e-9 ? xyOf(mixc) : [1 / 3, 1 / 3];
          X.dot(xyM[0], xyM[1], { r: 7, color: 'gold', label: 'mixture', labelPos: 'ne' });
          // spectra
          let tot = (l) => 0; const pk = [0, 1, 2].map((k) => I[k] * st.w[k]);
          const sc = Math.max(...pk, 1e-6);
          [0, 1, 2].forEach((k) => {
            const f = (l) => (pk[k] * st.spec[k](l)) / sc;
            Sp.fn(f, { color: cols[k], width: 1.6, domain: [380, 780], n: 800, fill: true });
          });
          Sp.fn((l) => [0, 1, 2].reduce((a, k) => a + (pk[k] * st.spec[k](l)) / sc, 0), { color: 'ink', width: 2.2, domain: [380, 780], n: 800 });
          // linearity check: XYZ of the summed spectrum, integrated directly
          const direct = spdXYZ((l) => [0, 1, 2].reduce((a, k) => a + I[k] * st.w[k] * st.spec[k](l), 0), 1);
          info = { xyM, mixc, err: Math.max(...direct.map((u, j) => Math.abs(u - mixc[j]))), inSRGB: xyz2lin(mixc).every((u) => u >= -1e-6), clipped: xyz2lin(mixc).some((u) => u < -1e-6), dm: dominant(xyM[0], xyM[1]) };
        });
        v.legend([['red', 'red primary'], ['green', 'green primary'], ['accent', 'blue primary'], ['gold', 'mixture'], ['ink', 'sum of the spectra']]);
        v.readout(() => `mixture: $x=${v.fix(info.xyM[0], 3)},\\ y=${v.fix(info.xyM[1], 3)}$, $Y=${v.fix(info.mixc[1], 3)}$${info.dm.l ? `, ${info.dm.purple ? 'complementary' : 'dominant'} wavelength ${v.fix(info.dm.l, 0)} nm` : ''} · $XYZ$ of the summed spectrum minus the sum of the primaries’ $XYZ$: $${info.err < 1e-9 ? '<10^{-9}' : v.sci(info.err, 2)}$ (additivity)\n${info.clipped ? 'This colour is outside the sRGB gamut of a screen: the wall shows the nearest colour it can make.' : 'This colour lies inside the sRGB gamut, so the wall shows it faithfully.'}`);
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Concept',
      name: 'Subtractive mixing: filters multiply spectra',
      credit: 'The Beer–Lambert law of absorption (Bouguer, Lambert and Beer)',
      statement: String.raw`A filter with transmittance $T(\lambda)$ passes the fraction $T(\lambda)$ of the light at each wavelength. Light that goes through a stack of filters has the spectrum
$$S_{\text{out}}(\lambda)=S_{\text{in}}(\lambda)\,T_1(\lambda)\,T_2(\lambda)\cdots T_m(\lambda),$$
the **product** of the transmittances, in whatever order the filters are stacked. For an absorbing medium of thickness (or density) $d$ the transmittance is $T^{\,d}$, so doubling the layer squares it. A product of numbers at most 1 never exceeds any of its factors: filtering only removes light, and a pair of filters that overlap in no wavelength passes none.`,
      idea: String.raw`Each wavelength is attenuated independently of the others, and attenuations compose by multiplication since a layer removes a fixed fraction of what reaches it (the Beer–Lambert law). That is why the subtractive primaries are the colours that remove one third of the spectrum each: cyan removes red, magenta removes green, yellow removes blue, so that any pair leaves one third (cyan × yellow leaves green) and all three leave almost nothing. The additive primaries (red, green, blue filters) are poor subtractive primaries because each removes two thirds of the spectrum, and a pair of them already kills everything.`,
      caption: String.raw`Daylight-like light passes through up to three filters. The three coloured curves are the transmittances raised to the densities set by the sliders; the heavy black curve is their product, and the coloured bars below show the spectrum that actually comes out. The row of swatches shows the colour after each filter alone and after the stack. Choose the cyan–magenta–yellow set and try pairs; then switch to the red–green–blue filters and stack two of them.`,
      deps: ['art-3.2'],
      refs: ['Fairchild ch. 3'],
      tags: ['subtractive', 'filters', 'Beer–Lambert'],
      scope: String.raw`Non-fluorescent, non-scattering absorbing filters in series, with no interreflection between layers. The filter curves are smooth model curves of the usual shapes, not measurements of any dye; the light is a $6504$ K black body standing in for daylight.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Subtractive_color' },
      viz(v) {
        const FS = {
          cmy: { names: ['cyan', 'magenta', 'yellow'], T: [(l) => 0.93 * (1 - 0.97 * sigm((l - 585) / 14)), (l) => 0.93 * (1 - 0.95 * gauss(l, 545, 95)), (l) => 0.93 * sigm((l - 505) / 12)], col: [[0, 170, 200], [210, 30, 150], [230, 190, 0]] },
          rgb: { names: ['red', 'green', 'blue'], T: [(l) => 0.93 * (0.02 + 0.98 * sigm((l - 590) / 12)), (l) => 0.93 * (0.03 + 0.97 * gauss(l, 540, 70)), (l) => 0.93 * (0.03 + 0.97 * gauss(l, 455, 60))], col: [[220, 40, 40], [40, 170, 60], [50, 80, 220]] },
        };
        const set = v.select('filters', [{ value: 'cmy', label: 'cyan, magenta, yellow' }, { value: 'rgb', label: 'red, green, blue' }], 'cmy');
        const d = [v.slider('density of filter 1', 0, 3, 1, { step: 0.05 }), v.slider('density of filter 2', 0, 3, 1, { step: 0.05 }), v.slider('density of filter 3', 0, 3, 0, { step: 0.05 })];
        const Tc = v.stage({ x: [380, 780], y: [0, 1], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'transmittance $T(\\lambda)$', height: 300, weight: 1, title: 'the filters and their product' });
        const Sp = v.stage({ x: [380, 780], y: [0, 1.05], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'relative power', height: 300, weight: 1, title: 'light in (outline) and light out (bars)' });
        const Sw = v.stage({ x: [0, 10], y: [0, 1.6], axes: false, height: 150, full: true, title: 'colour of the light: source, after each filter alone, after the stack' });
        const S0 = (l) => planck(l, 6504);
        const Smax = (() => { let m = 0; for (let l = 380; l <= 780; l += 2) m = Math.max(m, S0(l)); return m; })();
        const Y0 = spdXYZ(S0, 5)[1];
        const sw = (f) => rgbOf(spdXYZ((l) => S0(l) * f(l), 5).map((u) => (u / Y0) * 0.85));
        let info = {};
        v.render(() => {
          const F = FS[set.value], dd = d.map((s) => s.value);
          const Tk = F.T.map((f, k) => (l) => Math.pow(f(l), dd[k])), Tp = (l) => Tk[0](l) * Tk[1](l) * Tk[2](l);
          Tk.forEach((f, k) => { if (dd[k] > 0) Tc.fn(f, { color: F.col[k], width: 2, domain: [380, 780], n: 300 }); });
          Tc.fn(Tp, { color: 'ink', width: 3.4, domain: [380, 780], n: 300 });
          const nm = F.names.map((u, k) => (dd[k] > 0 ? `${u} ×${v.fix(dd[k], 2)}` : null)).filter(Boolean);
          Tc.text(nm.length ? 'stack: ' + nm.join(' + ') : 'no filters: T = 1', 776, 0.62, { size: 11, color: 'muted', align: 'right' });
          Sp.fn((l) => S0(l) / Smax, { color: 'muted', width: 1.4, domain: [380, 780], n: 300 });
          specBars(Sp, (l) => (S0(l) * Tp(l)) / Smax, 380, 780, 2, { alpha: 0.9 });
          // swatches
          const cells = [['source', () => 1], ...F.names.map((u, k) => [u + (dd[k] > 0 ? '' : ' (off)'), Tk[k]]), ['stack', Tp]];
          cells.forEach(([nmx, f], i) => {
            Sw.rect(i * 2 + 0.05, 0.4, i * 2 + 1.85, 1.5, { fill: sw(f), stroke: false, fillAlpha: 1, radius: 8 });
            Sw.text(nmx, i * 2 + 0.95, 0.3, { size: 11, color: 'muted', align: 'center', baseline: 'top' });
          });
          // luminance transmitted, and the order-independence check at 550 nm
          const Yout = spdXYZ((l) => S0(l) * Tp(l), 5)[1] / Y0;
          const seq = Tk.reduce((a, f) => a * f(550), 1);
          info = { Yout, T550: Tp(550), err: Math.abs(seq - Tp(550)), minT: Math.min(...[400, 450, 500, 550, 600, 650, 700].map(Tp)), maxF: Math.max(...Tk.map((f) => f(550))) };
        });
        v.legend([['ink', 'product of the filters'], ['muted', 'source spectrum']]);
        v.readout(() => `the stack passes $${v.fix(100 * info.Yout, 1)}\\%$ of the luminance; at 550 nm $T_{\\text{stack}}=${v.fix(info.T550, 4)}$ ≤ the most transparent single filter there ($${v.fix(info.maxF, 3)}$) · least transmittance among 400, 450, …, 700 nm: $${v.fix(info.minT, 4)}$`);
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Model',
      name: 'Pigment mixing: Kubelka–Munk theory',
      credit: 'Paul Kubelka & Franz Munk, 1931',
      statement: String.raw`In the Kubelka–Munk model a thick, opaque layer of paint is characterised at each wavelength by an absorption coefficient $K(\lambda)$ and a scattering coefficient $S(\lambda)$. Its reflectance is
$$R_\infty=1+\frac{K}{S}-\sqrt{\left(\frac{K}{S}\right)^2+2\,\frac{K}{S}},$$
a decreasing function of the ratio $K/S$ alone. For a mixture of pigments with concentrations $c_j$ both coefficients are **additive**: $K=\sum_jc_jK_j$ and $S=\sum_jc_jS_j$. The reflectance spectrum of the mixture is then computed wavelength by wavelength, and the colour follows from it as in art-3.2. Neither the average of the pigments’ reflectances nor the average of their screen colours is a good predictor.`,
      idea: String.raw`A paint film is a scattering slab in which light is absorbed on the way in and on the way out, so the fraction that escapes depends on $K/S$ nonlinearly; the two coefficients, unlike reflectance, are quantities per unit amount of material and therefore add. Blue and yellow pigments each absorb a different end of the spectrum, so in the mixture the only region where *both* absorb weakly is the middle: a green. Averaging reflectances, as in optical mixing of tiny dots, keeps the blue and yellow light and gives a pale grey instead. Averaging RGB triples, as image-editing tools do, has no physical basis at all. The filters of art-3.6 are the transmission analogue of the same bookkeeping.`,
      caption: String.raw`Blue and yellow pigments (curves $R_\infty$ at the top left) are mixed in the ratio set by the slider. The swatches show the pure paints and three predictions of the mixture: Kubelka–Munk (additive $K$ and $S$), a straight average of the reflectance curves, and an average of the sRGB values. The strips run the whole mixing ratio from pure blue to pure yellow. Raise the blue pigment’s scattering strength to see how a strong scatterer dominates a mixture even at low concentration.`,
      deps: ['art-3.6'],
      refs: ['Fairchild ch. 3'],
      tags: ['pigment', 'Kubelka–Munk', 'mixing'],
      scope: String.raw`Opaque, optically thick, non-fluorescent paint, diffuse illumination, no surface reflection (real paints need a Saunderson correction for the glossy surface). The two pigments are **models** with plausible smooth $K/S$ spectra, not measurements of any real paint; the illuminant is a $6504$ K black body. The numerical results demonstrate the theory, not the colour of any named pigment.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kubelka%E2%80%93Munk_theory' },
      viz(v) {
        const c = v.slider('fraction of blue pigment', 0, 1, 0.5, { step: 0.01 });
        const sA = v.slider('scattering strength of the blue pigment $S_A/S_B$', 0.25, 4, 1, { step: 0.01, log: true });
        const ksA = (l) => 0.04 + 6 * sigm((l - 555) / 14), ksB = (l) => 0.03 + 9 * (1 - sigm((l - 505) / 12));
        const Rinf = (q) => 1 + q - Math.sqrt(q * q + 2 * q);
        const Rc = v.stage({ x: [380, 780], y: [0, 1], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'reflectance $R_\\infty$', height: 320, weight: 1, title: 'reflectance of the paints and of the mixture' });
        const Sw = v.stage({ x: [0, 10], y: [0, 6.4], axes: false, height: 320, weight: 1, title: 'colour of the paint, by theory' });
        const ill = (l) => planck(l, 6504), Y0 = spdXYZ(ill, 5)[1];
        const xyzR = (R) => spdXYZ((l) => ill(l) * R(l), 5).map((u) => u / Y0);
        const rgbR = (R) => rgbOf(xyzR(R));
        const enc = (u) => { const q = u / 255; return q <= 0.04045 ? q / 12.92 : Math.pow((q + 0.055) / 1.055, 2.4); };
        const rgb2xyz = (c) => { const [r, g, b] = c.map(enc); return [0.4124 * r + 0.3576 * g + 0.1805 * b, 0.2126 * r + 0.7152 * g + 0.0722 * b, 0.0193 * r + 0.1192 * g + 0.9505 * b]; };
        const km = (q, sa) => (l) => { const a = q * sa, b = 1 - q; return Rinf((a * ksA(l) + b * ksB(l)) / (a + b)); }; // S_A = sa, S_B = 1: K = S ks
        let info = {};
        v.render(() => {
          const q = c.value, sa = sA.value;
          const RA = (l) => Rinf(ksA(l)), RB = (l) => Rinf(ksB(l)), RK = km(q, sa), Rav = (l) => q * RA(l) + (1 - q) * RB(l);
          Rc.fn(RA, { color: 'accent', width: 1.8, domain: [380, 780], n: 200 });
          Rc.fn(RB, { color: 'gold', width: 1.8, domain: [380, 780], n: 200 });
          Rc.fn(RK, { color: 'green', width: 3.2, domain: [380, 780], n: 200 });
          Rc.fn(Rav, { color: 'muted', width: 2, dash: [6, 4], domain: [380, 780], n: 200 });
          const cA = rgbR(RA), cB = rgbR(RB), cK = rgbR(RK), cR = rgbR(Rav), cN = [0, 1, 2].map((j) => Math.round(q * cA[j] + (1 - q) * cB[j]));
          const sq = (x, y, w, h, col, label) => { Sw.rect(x, y, x + w, y + h, { fill: col, stroke: false, fillAlpha: 1, radius: 7 }); Sw.text(label, x + w / 2, y - 0.1, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' }); };
          sq(0.1, 4.6, 1.5, 1.3, cA, 'blue'); sq(1.8, 4.6, 1.5, 1.3, cB, 'yellow');
          sq(3.8, 4.6, 1.5, 1.3, cK, 'K–M mix'); sq(5.5, 4.6, 1.5, 1.3, cR, 'avg of R'); sq(7.2, 4.6, 1.5, 1.3, cN, 'avg of RGB');
          // strips over the whole ratio
          const N = 40, rows = [['Kubelka–Munk', (u) => rgbR(km(u, sa)), 3.1], ['average of reflectances', (u) => rgbR((l) => u * RA(l) + (1 - u) * RB(l)), 2.0], ['average of sRGB', (u) => [0, 1, 2].map((j) => Math.round(u * cA[j] + (1 - u) * cB[j])), 0.9]];
          rows.forEach(([nm, f, y]) => {
            for (let k = 0; k < N; k++) { const u = 1 - (k + 0.5) / N; Sw.rect(0.4 + (9.2 * k) / N, y, 0.4 + (9.2 * (k + 1)) / N + 0.02, y + 0.75, { fill: f(u), stroke: false, fillAlpha: 1 }); }
            Sw.text(nm, 0.4, y + 0.82, { size: 10.5, color: 'muted', align: 'left', baseline: 'bottom' });
          });
          Sw.text('blue', 0.4, 0.55, { size: 10.5, color: 'muted', align: 'left' }); Sw.text('yellow', 9.6, 0.55, { size: 10.5, color: 'muted', align: 'right' });
          Sw.line(0.4 + 9.2 * (1 - q), 0.85, 0.4 + 9.2 * (1 - q), 3.95, { color: 'ink', width: 2 });
          const xyK = xyOf(xyzR(RK)), xyN = xyOf(rgb2xyz(cN)), xyR = xyOf(xyzR(Rav));
          info = { dK: dominant(xyK[0], xyK[1]), dN: dominant(xyN[0], xyN[1]), dR: dominant(xyR[0], xyR[1]), peak: (() => { let b = 0, bl = 0; for (let l = 400; l <= 700; l += 2) { const r = RK(l); if (r > b) { b = r; bl = l; } } return [bl, b]; })() };
        });
        v.legend([['accent', 'blue pigment'], ['gold', 'yellow pigment'], ['green', 'Kubelka–Munk mixture'], ['muted', 'average of the two reflectances', { dash: true }]]);
        v.readout(() => `Kubelka–Munk mixture peaks at ${v.fix(info.peak[0], 0)} nm ($R_\\infty=${v.fix(info.peak[1], 2)}$): dominant wavelength ${info.dK.l ? v.fix(info.dK.l, 0) + ' nm, purity ' + v.fix(info.dK.purity, 2) : 'none'} · reflectance average: ${info.dR.l ? v.fix(info.dR.l, 0) + ' nm, purity ' + v.fix(info.dR.purity, 2) : 'neutral'} · RGB average: ${info.dN.l ? v.fix(info.dN.l, 0) + ' nm, purity ' + v.fix(info.dN.purity, 2) : 'neutral'}\n$K/S$ of the mixture $=\\dfrac{c_AS_AK_A/S_A+c_BS_BK_B/S_B}{c_AS_A+c_BS_B}$ (coefficients add, reflectances do not)`);
      },
    },
  ],
};
