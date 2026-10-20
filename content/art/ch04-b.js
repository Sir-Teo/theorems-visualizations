import{maxwellPaper}from'./source-audit-maxwell.js';
import{grassmannPaperItem,cieStandardsPaperItem}from'./source-audit-colorimetry-items.js';
// Visual Art & Color — Chapter 4: Trichromacy and colorimetry (items 4.9–4.16; 4.1–4.8 are in ch04.js)
import { cmf, cmfT, specRGB, rgbOf, spdXYZ, xyOf, xyz, planck, gauss, sigm, drawChromaticity, LOCUS, inLocus, dominant, SRGB, toLMS, fromLMS, primSet, CIERGB, CIERGB_M, EW, mv3, inv3, cross3, PLANCK_TABLE, bbXY, uv60, xy60, cctNearest, cctMcCamy, SRGB_M, SRGB_MI, srgbDec, srgbEnc, codeToXYZ, xyzToCode, hsv2code, rgbMatrixFrom, Vphot, Vscot } from './ch04.shared.js';

const fmt3 = (v, a) => a.map((u) => v.fix(u, 3)).join(', ');
const LOCUS_XY = LOCUS.map((p) => [p[1], p[2]]);
/** Sample points of the region of all chromaticities (inside the locus polygon incl. the purple line), on a grid. */
const REGION = (() => { const P = []; for (let x = 0.004; x < 0.74; x += 0.006) for (let y = 0.004; y < 0.84; y += 0.006) if (inLocus(x, y)) P.push([x, y]); return P; })();
const inConvex = (p, poly) => { let s = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); if (Math.abs(c) < 1e-14) continue; if (s === 0) s = Math.sign(c); else if (Math.sign(c) !== s) return false; } return true; };
const locusAt = (l) => { const p = LOCUS[Math.max(0, Math.min(LOCUS.length - 1, Math.round(l) - 420))]; return [p[1], p[2]]; };
const coverage = (poly) => { let n = 0; for (const p of REGION) if (inConvex(p, poly)) n++; return n / REGION.length; };
let BEST3 = null;
function bestTriangle() {
  if (BEST3) return BEST3;
  const W = []; for (let l = 420; l <= 700; l += 10) W.push(l);
  let best = { c: -1 };
  const pts = W.map(locusAt);
  for (let i = 0; i < W.length; i++) for (let j = i + 1; j < W.length; j++) for (let k = j + 1; k < W.length; k++) {
    const poly = [pts[i], pts[j], pts[k]]; let n = 0; for (let q = 0; q < REGION.length; q += 3) if (inConvex(REGION[q], poly)) n++;
    if (n > best.c) best = { c: n, w: [W[i], W[j], W[k]] };
  }
  BEST3 = { w: best.w, cov: coverage(best.w.map(locusAt)) };
  return BEST3;
}
function clampLocus(x, y) {
  if (inLocus(x, y)) return [x, y];
  let a = 0, b = 1; for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (inLocus(1 / 3 + (x - 1 / 3) * m, 1 / 3 + (y - 1 / 3) * m)) a = m; else b = m; }
  return [1 / 3 + (x - 1 / 3) * a, 1 / 3 + (y - 1 / 3) * a];
}
/** Boundary point of the region of colours (locus + purple line) in the direction of angle th (degrees) seen from the equal-energy white. */
function boundaryAt(th) {
  const W = [1 / 3, 1 / 3], dx = Math.cos((th * Math.PI) / 180), dy = Math.sin((th * Math.PI) / 180);
  let best = 0;
  for (let i = 0; i < LOCUS_XY.length; i++) {
    const a = LOCUS_XY[i], b = LOCUS_XY[(i + 1) % LOCUS_XY.length], ex = b[0] - a[0], ey = b[1] - a[1], den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-14) continue;
    const t = ((a[0] - W[0]) * ey - (a[1] - W[1]) * ex) / den, u = ((a[0] - W[0]) * dy - (a[1] - W[1]) * dx) / den;
    if (t > 0 && u >= 0 && u <= 1) best = Math.max(best, t);
  }
  return [W[0] + best * dx, W[1] + best * dy];
}
const upvp = (c) => { const d = c[0] + 15 * c[1] + 3 * c[2] || 1; return [(4 * c[0]) / d, (9 * c[1]) / d]; };

export default {
  collection: 'art',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'No three real primaries reproduce all colours',
      statement: String.raw`For any three real lights, the colours obtainable by non-negative mixtures of them form the triangle in the chromaticity diagram with those lights at its corners (art-4.8), and some visible colours always lie outside it: the triangle never contains the whole region of the diagram bounded by the spectral locus and the line of purples. The same holds for any finite set of lights: their gamut is a convex polygon, and the region of all colours is not a polygon.`,
      idea: String.raw`A monochromatic light of wavelength $\lambda$ cannot be a positive mixture of lights of other chromaticities unless it already lies on the segment between them; but the spectral locus has no straight piece joining three corner points: from 420 to 700 nm it bulges outward everywhere except for the nearly straight stretch beyond 550 nm, so every real light that is not on it is strictly inside. With three corners one obtains a triangle, and a curved boundary that has more than three points not collinear with corners cannot fit inside it (a convex polygon with $n$ vertices inscribed in a strictly convex curve always leaves a sliver; the sliver shrinks as $n$ grows but never vanishes).`,
      caption: String.raw`Choose three wavelengths, the corners of a triangle on the spectral locus (the best possible corners for a real light), and read the fraction of the area of all colours it covers. The red dots mark uncovered chromaticities. Press the button for the best triangle my search finds, then increase the number of primaries: a polygon with $n$ corners spaced along the locus covers more and more, but the readout never reaches 100%.`,
      deps: ['art-4.8'],
      refs: ['Fairchild ch. 3'],
      tags: ['gamut', 'primaries', 'convexity'],
      scope: String.raw`Areas are fractions of the number of grid points in the region of chromaticities of the CIE 1931 fit between 420 and 700 nm; they are therefore model values, and the “best triangle” is the best among corners on a 10 nm grid of the locus. Negative amounts (a primary added to the test) can match everything, as in the experiments of art-4.5; the theorem is about physical mixing.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gamut' },
      viz(v) {
        const mode = v.select('primaries', [{ value: 'tri', label: 'three, chosen' }, { value: 'n', label: '$n$, evenly spaced' }], 'tri');
        const ls = [450, 530, 630].map((d, i) => v.slider(`corner ${i + 1} (nm)`, 420, 700, d, { step: 1 }));
        const nn = v.slider('number of primaries $n$', 3, 14, 5, { step: 1, int: true });
        const best = v.button('Best triangle', () => { const b = bestTriangle(); ls.forEach((s, i) => s.set(b.w[i])); mode.set('tri'); });
        const D = v.stage({ x: [0, 0.8], y: [0, 0.9], equal: true, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', height: 440, weight: 1.2, title: 'a polygon of real primaries inside the horseshoe' });
        let info = {};
        // arc-length spacing along the locus from 420 to 700
        const cum = [0]; for (let i = 1; i < LOCUS.length; i++) cum.push(cum[i - 1] + Math.hypot(LOCUS[i][1] - LOCUS[i - 1][1], LOCUS[i][2] - LOCUS[i - 1][2]));
        const evenly = (n) => Array.from({ length: n }, (_, k) => { const target = (cum[cum.length - 1] * k) / (n - 1); let i = 0; while (i < cum.length - 1 && cum[i] < target) i++; return 420 + i; });
        v.render(() => {
          const tri = mode.value === 'tri';
          ls.forEach((s) => { s.el.hidden = !tri; }); nn.el.hidden = tri;
          const W = tri ? ls.map((s) => s.value) : evenly(nn.value), poly = W.map(locusAt);
          drawChromaticity(D, v, { fade: 0.35 });
          const cov = coverage(poly);
          const miss = REGION.filter((p, i) => i % 2 === 0 && !inConvex(p, poly));
          D.dots(miss, { r: 1.6, color: 'red' });
          D.poly(poly, { fill: 'accent', fillAlpha: 0.1, color: 'ink', width: 1.6 });
          poly.forEach(([x, y], i) => D.dot(x, y, { r: 5, color: 'gold', label: tri ? `${W[i]}` : '', labelPos: 'ne' }));
          info = { cov, W, n: poly.length };
        });
        v.legend([['red', 'colours the polygon cannot make'], ['accent', 'gamut of the real primaries']]);
        v.readout(() => `${info.n} real primaries${mode.value === 'tri' ? ` at ${info.W.join(', ')} nm` : ''}: the gamut covers ${v.fix(100 * info.cov, 1)}% of the area of all colours, ${v.fix(100 * (1 - info.cov), 1)}% is out of reach\n${BEST3 ? `best triangle found by the search: corners ${BEST3.w.join(', ')} nm, ${v.fix(100 * BEST3.cov, 1)}% (still ${v.fix(100 * (1 - BEST3.cov), 1)}% missing)` : 'press “Best triangle” for the best corners a search over the locus finds'}`);
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Concept',
      name: 'Planckian locus and correlated colour temperature',
      credit: 'MacAdam, 1937 (the (u,v) scale); Robertson, 1968 (isotherms); McCamy, 1992 (approximation)',
      statement: String.raw`The chromaticities of black bodies at temperatures from about 1000 K to infinity trace a smooth curve in the chromaticity diagram, the **Planckian locus**, running from deep red through orange and white to blue. For a light whose chromaticity is near it, the **correlated colour temperature** (CCT) is the temperature of the black body whose chromaticity is closest, measured in the CIE 1960 $(u,v)$ plane, where
$$u=\frac{4x}{-2x+12y+3},\qquad v=\frac{6y}{-2x+12y+3},$$
and the lines of constant CCT (isotherms) are the normals to the locus. The signed distance $\Delta_{uv}$ from the locus says how far the light is from a true black body.`,
      idea: String.raw`The black-body spectrum depends on one parameter, $T$ (art-3.10), so its chromaticities form a curve (art-4.7); a general white light is described by two numbers, and CCT is the projection onto that curve. The projection is done in $(u,v)$ because that plane is more perceptually uniform than $(x,y)$ (a rough forerunner of art-5.5): the nearest point there is the black body that looks most like the light. McCamy’s cubic in $n=(x-0.3320)/(y-0.1858)$ is a quick empirical approximation of the same number near daylight.`,
      caption: String.raw`Drag the white point (or pick a preset). The curve is the Planckian locus with the isotherms drawn in $(u,v)$ and mapped back to $(x,y)$, where they are no longer perpendicular. The readout gives the CCT from the nearest point, the signed distance $\Delta_{uv}$ (above the locus is positive), and McCamy’s approximation for comparison. Move far above or below the curve and the CCT loses its meaning.`,
      deps: ['art-4.7', 'art-3.10'],
      refs: ['Fairchild ch. 3'],
      tags: ['colour temperature', 'Planck', 'chromaticity'],
      scope: String.raw`The locus is computed by integrating Planck’s law against the analytic fit of the colour-matching functions, so temperatures differ slightly from the published tables (a few kelvin to tens of kelvin). CCT is meaningful only close to the locus (the CIE recommends $|\Delta_{uv}|\lesssim0.05$).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Correlated_color_temperature' },
      viz(v) {
        const PRE = { A: [0.4476, 0.4074, 'illuminant A (2856 K)'], D65: [0.3127, 0.3290, 'daylight D65'], D50: [0.3457, 0.3585, 'daylight D50'], cand: null };
        const sel = v.select('preset', [{ value: 'A', label: 'illuminant A' }, { value: 'D50', label: 'D50' }, { value: 'D65', label: 'D65' }, { value: 'free', label: 'free' }], 'D65', { onChange: (val) => { if (PRE[val]) { W.set(PRE[val][0], PRE[val][1]); } } });
        const D = v.stage({ x: [0.1, 0.7], y: [0.1, 0.65], equal: true, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', height: 440, weight: 1.3, title: 'the Planckian locus and isotherms' });
        const W = D.handle(0.3127, 0.329, { color: 'ink', r: 8, label: '', constrain: (x, y) => clampLocus(x, y) });
        const U = v.stage({ x: [0.15, 0.35], y: [0.2, 0.4], equal: true, axes: 'box', gutter: true, xlabel: '$u$', ylabel: '$v$', height: 440, weight: 0.9, minWidth: 260, title: 'the same in the $(u,v)$ plane' });
        const ISO = [1500, 2000, 2500, 3000, 4000, 5000, 6500, 10000, 20000];
        const tabAt = (T) => { const m = 1e6 / T; let i = Math.round((m - 40) / 4); i = Math.max(1, Math.min(PLANCK_TABLE.length - 2, i)); return i; };
        let info = {};
        v.render(() => {
          drawChromaticity(D, v, { fade: 0.5 });
          D.path(PLANCK_TABLE.map((p) => [p.x, p.y]), { color: 'ink', width: 2 });
          const isoSeg = (T, L) => { const i = tabAt(T), a = PLANCK_TABLE[i - 1], b = PLANCK_TABLE[i + 1], p = PLANCK_TABLE[i], tu = b.u - a.u, tv = b.v - a.v, nn = Math.hypot(tu, tv); const nu = -tv / nn, nv = tu / nn; return [xy60(p.u + nu * L, p.v + nv * L), xy60(p.u - nu * L, p.v - nv * L), p]; };
          for (const T of ISO) {
            const [a, b, p] = isoSeg(T, 0.012);
            D.line(a[0], a[1], b[0], b[1], { color: 'orange', width: 1.4 });
            D.text(T >= 10000 ? `${T / 1000}k` : `${T}`, a[0] - 0.0, a[1] + 0.02, { size: 10, color: 'ink', align: 'center', plate: true });
          }
          const q = [W.x, W.y], cc = cctNearest(q[0], q[1]), pt = PLANCK_TABLE[cc.i];
          D.dot(pt.x, pt.y, { r: 4, hollow: true, color: 'accent' });
          D.line(q[0], q[1], pt.x, pt.y, { color: 'accent', width: 1.2 });
          // uv panel
          U.path(PLANCK_TABLE.map((p) => [p.u, p.v]), { color: 'ink', width: 2 });
          for (const T of ISO) { const i = tabAt(T), a = PLANCK_TABLE[i - 1], b = PLANCK_TABLE[i + 1], p = PLANCK_TABLE[i], tu = b.u - a.u, tv = b.v - a.v, nn = Math.hypot(tu, tv); U.line(p.u - (-tv / nn) * 0.012, p.v - (tu / nn) * 0.012, p.u + (-tv / nn) * 0.012, p.v + (tu / nn) * 0.012, { color: 'orange', width: 1.4 }); }
          const [u0, v0] = uv60(q[0], q[1]);
          U.dot(u0, v0, { r: 7, color: 'ink' }); U.line(u0, v0, pt.u, pt.v, { color: 'accent', width: 1.4 });
          info = { T: cc.T, duv: cc.duv, mc: cctMcCamy(q[0], q[1]), x: q[0], y: q[1] };
        });
        v.legend([['ink', 'Planckian locus'], ['orange', 'isotherms (K)']]);
        v.readout(() => `$(x,y)=(${v.fix(info.x, 4)},\\ ${v.fix(info.y, 4)})$ · CCT (nearest point on the locus in $uv$) $=${v.fix(info.T, 0)}$ K, $\\Delta_{uv}=${v.fix(info.duv, 4)}$ · McCamy: ${v.fix(info.mc, 0)} K · ${Math.abs(info.duv) > 0.05 ? 'too far from the locus: CCT is not meaningful' : Math.abs(info.duv) > 0.01 ? 'visibly tinted (green above, magenta below the locus)' : 'close to a black-body white'}`);
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Concept',
      name: 'RGB colour spaces, sRGB and gamma',
      credit: 'sRGB: Hewlett-Packard and Microsoft, 1996; IEC 61966-2-1:1999',
      statement: String.raw`An RGB colour space fixes three primaries and a white point by their chromaticities, so that linear-light $(R,G,B)$ maps to $XYZ$ by a $3\times3$ matrix. For **sRGB** the primaries are $(0.64,0.33)$, $(0.30,0.60)$, $(0.15,0.06)$ and the white is D65, $(0.3127,0.3290)$. The stored code values are not linear in light but follow the transfer curve
$$C=\begin{cases}12.92\,u,&u\le0.0031308\\ 1.055\,u^{1/2.4}-0.055,&u>0.0031308\end{cases}$$
($u$ the linear value, $C\in[0,1]$), close to a power law with exponent about $2.2$. Arithmetic that is meant to model light (averaging, blending, resizing) must be done on $u$, not on $C$.`,
      idea: String.raw`The matrix is forced by the primaries (art-4.8): the columns are the primaries’ $XYZ$, scaled so that $(1,1,1)$ gives the white. The curve compresses the signal because vision is more sensitive to ratios than to differences in dark tones (art-5.2), so more code values are spent where the eye can use them, at 8 bits per channel. The consequence for the programmer is that mixing code values means mixing something close to $\sqrt{\text{light}}$, which gives darker, wrong blends.`,
      caption: String.raw`Choose the red, green and blue code values. The diagram shows the sRGB triangle and the resulting chromaticity; the curve shows the code-to-light mapping with the three values marked; the readout lists the pipeline from code through linear light to $XYZ$. Below, two gradients between two colours: the top row interpolates code values (what a naive program does), the bottom row interpolates light. The middle swatches are their midpoints, and the one from code values is darker.`,
      deps: ['art-4.8'],
      refs: ['Fairchild ch. 3'],
      tags: ['sRGB', 'gamma', 'colour spaces'],
      scope: String.raw`The standard viewing condition (display with D65 white, roughly 80 cd/m²) is assumed; the real display curve of a monitor is often closer to a pure power law of $2.2$–$2.4$. The matrix is recomputed here from the primaries, and agrees with the published four-digit matrix.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/SRGB' },
      viz(v) {
        const rs = v.slider('red code', 0, 255, 230, { step: 1, int: true }), gs = v.slider('green code', 0, 255, 120, { step: 1, int: true }), bs = v.slider('blue code', 0, 255, 40, { step: 1, int: true });
        const PAIRS = { bw: [[0, 0, 0], [255, 255, 255], 'black → white'], rg: [[255, 0, 0], [0, 255, 0], 'red → green'], by: [[0, 0, 255], [255, 255, 0], 'blue → yellow'], rb: [[255, 0, 0], [0, 0, 255], 'red → blue'] };
        const pair = v.select('gradient between', Object.entries(PAIRS).map(([k, o]) => ({ value: k, label: o[2] })), 'bw');
        const D = v.stage({ x: [0, 0.8], y: [0, 0.9], equal: true, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', height: 330, weight: 1, title: 'sRGB triangle' });
        const C = v.stage({ x: [0, 255], y: [0, 1], axes: 'box', gutter: true, xlabel: 'code value', ylabel: 'linear light', height: 330, weight: 0.9, minWidth: 250, title: 'the transfer curve' });
        const G = v.stage({ x: [0, 1], y: [0, 2.3], axes: false, height: 200, full: true, title: 'a gradient made in code values (top) and in linear light (bottom)' });
        let info = {};
        v.render(() => {
          drawChromaticity(D, v, { fade: 0.35 });
          D.poly(SRGB, { color: 'ink', width: 1.6, fill: false });
          SRGB.forEach(([x, y], i) => D.dot(x, y, { r: 4, color: ['red', 'green', 'accent'][i] }));
          D.dot(0.3127, 0.329, { r: 4, hollow: true, color: 'ink', label: 'D65', labelPos: 'se' });
          const code = [rs.value, gs.value, bs.value], lin = code.map(srgbDec), X = mv3(SRGB_M, lin), [x, y] = xyOf(X);
          D.dot(x, y, { r: 9, color: 'ink' }); D.dot(x, y, { r: 6.5, color: code });
          C.fn((c) => srgbDec(c), { color: 'ink', width: 2, domain: [0, 255] });
          C.fn((c) => Math.pow(c / 255, 2.2), { color: 'muted', width: 1.2, dash: true, domain: [0, 255] });
          code.forEach((c, i) => { C.dot(c, srgbDec(c), { r: 5, color: ['red', 'green', 'accent'][i] }); C.line(c, 0, c, srgbDec(c), { color: ['red', 'green', 'accent'][i], dash: [3, 3], width: 1 }); });
          const [A, B] = PAIRS[pair.value], N = 32;
          const lerp = (a, b, t) => a + (b - a) * t;
          for (let k = 0; k < N; k++) {
            const t = (k + 0.5) / N, c1 = [0, 1, 2].map((i) => lerp(A[i], B[i], t)), c2 = [0, 1, 2].map((i) => srgbEnc(lerp(srgbDec(A[i]), srgbDec(B[i]), t)));
            G.rect(k / N, 1.25, (k + 1) / N + 0.002, 2.25, { fill: c1, stroke: false, fillAlpha: 1 });
            G.rect(k / N, 0.1, (k + 1) / N + 0.002, 1.1, { fill: c2, stroke: false, fillAlpha: 1 });
          }
          const m1 = [0, 1, 2].map((i) => (A[i] + B[i]) / 2), m2 = [0, 1, 2].map((i) => srgbEnc((srgbDec(A[i]) + srgbDec(B[i])) / 2));
          G.text('interpolating code values', 0.5, 1.75, { size: 11, color: 'ink', align: 'center', baseline: 'middle', plate: true });
          G.text('interpolating linear light', 0.5, 0.6, { size: 11, color: 'ink', align: 'center', baseline: 'middle', plate: true });
          info = { code, lin, X, x, y, m1, m2, Y1: mv3(SRGB_M, m1.map(srgbDec))[1], Y2: mv3(SRGB_M, m2.map(srgbDec))[1] };
        });
        v.legend([['ink', 'sRGB curve'], ['muted', 'power law $u=C^{2.2}$ (dashed)']]);
        v.readout(() => `code $(${info.code.join(', ')})$ → linear $(${fmt3(v, info.lin)})$ → $XYZ=(${fmt3(v, info.X)})$ → $(x,y)=(${v.fix(info.x, 4)},\\ ${v.fix(info.y, 4)})$, luminance $Y=${v.fix(info.X[1], 3)}$\nmatrix computed from the primaries, middle row $(${SRGB_M[1].map((u) => v.fix(u, 4)).join(', ')})$ (published $0.2126,\\ 0.7152,\\ 0.0722$) · the midpoint of the codes has $Y=${v.fix(info.Y1, 3)}$, the midpoint of the light $Y=${v.fix(info.Y2, 3)}$ (code ${info.m2.map((u) => v.fix(u, 0)).join(', ')} instead of ${info.m1.map((u) => v.fix(u, 0)).join(', ')})`);
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Phenomenon',
      name: 'Colour blindness: dichromacy as a projection',
      credit: 'Brettel, Viénot & Mollon, 1997 (simulation method)',
      statement: String.raw`A dichromat lacks one cone type (protanopia: $L$; deuteranopia: $M$; tritanopia: $S$), so his colours are described by two numbers, not three, and the colour space of three dimensions collapses onto a plane of the cone space $(L,M,S)$. Two colours that differ only in the missing cone’s response look the same to him. In the chromaticity diagram those colours lie on straight **confusion lines** that all pass through one point, the **copunctal point**, the (imaginary) chromaticity of a light that excites only the missing cone type.`,
      idea: String.raw`Adding a light that excites only the missing cone does not change what the other two cones report (art-4.4, additivity), so a dichromat cannot see it; colours $c$ and $c+\alpha\,e_L$ are the same to a protanope, and in chromaticity coordinates the set $\{c+\alpha e_L\}$ is the line through $c$ and the point of $e_L$. A simulation replaces the missing response by a function of the two remaining ones, chosen so that the neutral axis stays neutral and two anchor wavelengths keep their appearance (Brettel and colleagues use 475 and 575 nm for protans and deutans, 485 and 660 nm for tritans), a projection of cone space onto two half-planes.`,
      caption: String.raw`Choose the type of dichromacy. On the left, the chromaticity diagram with the copunctal point (when it is on the picture) and the confusion line through the point you drag; the row of swatches below shows colours taken along that line, as a trichromat sees them (top) and as the simulated dichromat does (bottom): the bottom row is a single colour. The two discs compare a hue circle for the trichromat and for the simulated dichromat.`,
      deps: ['art-4.2'],
      refs: ['Fairchild ch. 1'],
      tags: ['colour blindness', 'dichromacy', 'cones'],
      scope: String.raw`This is the standard simulation, not a measurement of anyone’s experience; real colour-deficient observers vary (many have anomalous trichromacy, a shifted cone, not a missing one). Cone space here is the Hunt–Pointer–Estévez approximation of the CIE 1931 fit, so the copunctal points differ from those quoted in the literature. The anchor wavelengths are as I recall them from the 1997 paper; one secondary source gives 470 instead of 475 nm for the protan and deutan anchor.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Color_blindness' },
      verify: true,
      viz(v) {
        const typ = v.select('type', [{ value: 'protan', label: 'protanopia (no L)' }, { value: 'deutan', label: 'deuteranopia (no M)' }, { value: 'tritan', label: 'tritanopia (no S)' }], 'deutan');
        const E = [1, 1, 1], anc = (l) => toLMS(cmf(l));
        const sim = (t, q) => {
          let A, n;
          if (t === 'tritan') { A = q[1] / q[0] < 1 ? anc(660) : anc(485); n = cross3(E, A); return [q[0], q[1], -(n[0] * q[0] + n[1] * q[1]) / n[2]]; }
          A = q[2] / q[1] < 1 ? anc(575) : anc(475); n = cross3(E, A);
          return t === 'protan' ? [-(n[1] * q[1] + n[2] * q[2]) / n[0], q[1], q[2]] : [q[0], -(n[0] * q[0] + n[2] * q[2]) / n[1], q[2]];
        };
        const simXYZ = (t, c) => fromLMS(sim(t, toLMS(c)));
        const copun = (t) => { const e = t === 'protan' ? [1, 0, 0] : t === 'deutan' ? [0, 1, 0] : [0, 0, 1]; const c = fromLMS(e), s = c[0] + c[1] + c[2]; return [c[0] / s, c[1] / s]; };
        const D = v.stage({ x: [0, 0.8], y: [0, 0.9], equal: true, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', height: 330, weight: 1.1, title: 'confusion line through a colour' });
        const H = D.handle(0.3, 0.45, { color: 'ink', r: 8, label: '', constrain: (x, y) => clampLocus(x, y) });
        const T1 = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, axes: false, height: 330, weight: 0.6, minWidth: 190, title: 'trichromat' });
        const T2 = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, axes: false, height: 330, weight: 0.6, minWidth: 190, title: 'simulated dichromat' });
        const Sw = v.stage({ x: [0, 8], y: [0, 2.1], axes: false, height: 120, full: true, title: 'colours on the line: as seen (top), as simulated (bottom)' });
        const disc = (stage, t) => stage.raster((x, y) => { const r = Math.hypot(x, y); if (r > 1) return null; const code = hsv2code(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360, r, 0.95); const c = t ? xyzToCode(simXYZ(t, codeToXYZ(code))) : code.map(Math.round); return [c[0], c[1], c[2], 1]; }, { res: 3, key: 'disc' + t });
        let info = {};
        v.render(() => {
          const t = typ.value, C = copun(t);
          drawChromaticity(D, v, { fade: 0.4 });
          const p = [H.x, H.y], dx = C[0] - p[0], dy = C[1] - p[1], nn = Math.hypot(dx, dy) || 1, ux = dx / nn, uy = dy / nn;
          D.line(p[0] - ux * 3, p[1] - uy * 3, p[0] + ux * 3, p[1] + uy * 3, { color: 'ink', width: 1.4, dash: [5, 4] });
          if (C[0] > -0.1 && C[0] < 0.9 && C[1] > -0.1 && C[1] < 1) D.dot(C[0], C[1], { r: 5, color: 'orange', label: 'copunctal', labelPos: 'nw' });
          // swatches along the line inside the locus
          const pts = []; for (let s = -2; s <= 2; s += 0.004) { const q = [p[0] + ux * s, p[1] + uy * s]; if (q[1] > 0.02 && inLocus(q[0], q[1])) pts.push(q); }
          const K = 8;
          for (let k = 0; k < K; k++) {
            const q = pts[Math.round((k * (pts.length - 1)) / (K - 1))] || p, c = xyz(q[0], q[1], 0.5), cs = simXYZ(t, c), sc = 0.5 / (cs[1] > 1e-6 ? cs[1] : 1);
            Sw.rect(k, 1.1, k + 0.98, 2.1, { fill: xyzToCode(c), stroke: false, fillAlpha: 1 });
            Sw.rect(k, 0.05, k + 0.98, 1.0, { fill: xyzToCode(cs.map((u) => u * sc)), stroke: false, fillAlpha: 1 });
            D.dot(q[0], q[1], { r: 3, color: xyzToCode(c) });
          }
          disc(T1, null); disc(T2, t);
          info = { C, n: pts.length };
        });
        v.legend([['ink', 'confusion line (dashed)']]);
        v.readout(() => `${typ.value === 'protan' ? 'protanopia' : typ.value === 'deutan' ? 'deuteranopia' : 'tritanopia'}: copunctal point of the model at $(x,y)=(${v.fix(info.C[0], 3)},\\ ${v.fix(info.C[1], 3)})$ (the chromaticity of a light that excites only the missing cone)\nthe whole bottom row of swatches is one colour for the simulated observer, because they differ only by a multiple of the missing cone’s direction`);
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Concept',
      name: 'Luminance, V(λ) and the Purkinje shift',
      credit: 'CIE 1924 photopic V(λ); CIE 1951 scotopic V′(λ); J. E. Purkyně, 1819',
      statement: String.raw`The **luminous efficiency** $V(\lambda)$ weights the spectrum to give luminance: $L_v=K_m\int S(\lambda)V(\lambda)\,d\lambda$ with $K_m=683$ lm/W, where $V$ peaks at $555$ nm for daylight (cone) vision. In dim light the rods take over and the weighting becomes the scotopic function $V'(\lambda)$, peaking near $507$ nm, so that as the illumination falls the brightness of blue-green colours rises relative to reds (the **Purkinje shift**). In the mesopic range, roughly $0.01$–$3$ cd/m$^2$, the weighting moves between the two.`,
      idea: String.raw`Luminance is a linear functional of the spectrum (art-4.6, $Y=\int S\bar y$ with $\bar y=V$), and a different receptor population gives a different functional: the cone-based $V$ combines $L$ and $M$ signals (art-4.1), while rods have one pigment (rhodopsin) with its own absorption spectrum, shifted to shorter wavelengths. Since the weights differ, two lights of equal photopic luminance can have different scotopic luminance, and the ranking of surfaces by brightness changes with the light level.`,
      caption: String.raw`Slide the light level from starlight to daylight. The curves are $V$ (green), $V'$ (blue) and the weighting in use (gold). Below, a red flower, a green leaf and a blue flower lit by daylight: the first row is their colour (fading as the cones go out of use), the second the brightness the eye assigns them (relative to a white card): the red darkens first, the blue and green stay relatively bright.`,
      deps: ['art-4.1'],
      refs: ['Fairchild ch. 1'],
      tags: ['luminance', 'rods', 'Purkinje'],
      scope: String.raw`$V$ is the CIE 1931 $\bar y$ (analytic fit). $V'$ is a two-sided Gaussian model anchored at the 507 nm peak and fitted by me to a few remembered values of the CIE 1951 table, so its wings are only approximate; the transition between the two follows a smooth step between $0.01$ and $3$ cd/m$^2$, a simplification of the CIE mesopic system. The reflectances are invented smooth curves.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Purkinje_effect' },
      verify: true,
      viz(v) {
        const lum = v.slider('light level (cd/m² on the white card)', 1e-4, 1e3, 0.05, { log: true, fmt: (x) => (x < 1 ? v.fix(x, x < 0.01 ? 4 : 3) : v.fix(x, 0)) });
        const A = v.stage({ x: [380, 720], y: [0, 1.12], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'luminous efficiency', height: 300, weight: 1.3, title: 'weighting of the spectrum' });
        const B = v.stage({ x: [0, 3], y: [0, 2.3], axes: false, height: 300, weight: 0.9, minWidth: 250, title: 'three flowers under daylight' });
        const day = (l) => planck(l, 6500);
        const OBJ = [
          { name: 'red flower', R: (l) => 0.05 + 0.8 * sigm((l - 595) / 10) },
          { name: 'green leaf', R: (l) => 0.05 + 0.4 * gauss(l, 540, 70) },
          { name: 'blue flower', R: (l) => 0.05 + 0.6 * gauss(l, 450, 45) },
        ];
        const brightness = (R, w) => { let a = 0, b = 0; for (let l = 380; l <= 780; l += 4) { const V = w * Vphot(l) + (1 - w) * Vscot(l); a += day(l) * R(l) * V; b += day(l) * V; } return a / b; };
        let info = {};
        v.render(() => {
          const lg = Math.log10(lum.value), t = Math.max(0, Math.min(1, (lg + 2) / (Math.log10(3) + 2))), w = t * t * (3 - 2 * t);
          const Veff = (l) => w * Vphot(l) + (1 - w) * Vscot(l);
          A.fn(Vphot, { color: 'green', width: 1.6, domain: [380, 720] });
          A.fn(Vscot, { color: 'accent', width: 1.6, domain: [380, 720] });
          A.fn(Veff, { color: 'gold', width: 3, domain: [380, 720] });
          A.vline(555, { color: 'green', dash: [3, 4], width: 1, alpha: 0.6 }); A.vline(507, { color: 'accent', dash: [3, 4], width: 1, alpha: 0.6 });
          const wh = spdXYZ(day, 5);
          let pk = 0, pv = 0; for (let l = 380; l <= 720; l++) { const q = Veff(l); if (q > pv) { pv = q; pk = l; } }
          OBJ.forEach((o, i) => {
            const c = spdXYZ((l) => day(l) * o.R(l), 5).map((u) => (u / wh[1]) * 0.9), g = brightness(o.R, w) / brightness(() => 1, w), g0 = brightness(o.R, 1) / brightness(() => 1, 1);
            const grey = Math.round(255 * Math.pow(Math.min(1, g * 1.1), 1 / 2.2)), rgb = rgbOf(c), mixc = rgb.map((u) => Math.round(u * w + grey * (1 - w)));
            B.rect(i, 1.25, i + 0.92, 2.2, { fill: mixc, stroke: false, fillAlpha: 1, radius: 6 });
            B.rect(i, 0.2, i + 0.92, 1.15, { fill: [grey, grey, grey], stroke: false, fillAlpha: 1, radius: 6 });
            B.text(o.name, i + 0.46, 0.12, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' });
            (info.g = info.g || [])[i] = g / g0;
          });
          info.w = w; info.pk = pk; info.lum = lum.value;
        });
        v.legend([['green', '$V(\\lambda)$ photopic'], ['accent', '$V\'(\\lambda)$ scotopic (model)'], ['gold', 'weighting in use']]);
        v.readout(() => `level ${v.sci(info.lum, 2)} cd/m² → cone weight ${v.fix(info.w, 2)} (${info.w > 0.98 ? 'photopic' : info.w < 0.02 ? 'scotopic' : 'mesopic'}), the weighting peaks at ${info.pk} nm\nbrightness relative to its daylight value: red flower ${v.fix(info.g[0], 2)}, green leaf ${v.fix(info.g[1], 2)}, blue flower ${v.fix(info.g[2], 2)}`);
      },
    },
    // Source-audited colorimetry 4.14
    grassmannPaperItem,
    // Source-audited Maxwell 4.15
    maxwellPaper,
    // Source-audited colorimetry 4.16
    cieStandardsPaperItem,
  ],
};
