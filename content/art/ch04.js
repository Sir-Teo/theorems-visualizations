// Visual Art & Color — Chapter 4: Trichromacy and colorimetry (items 4.1–4.8; 4.9–4.16 are in ch04-b.js)
import { cmf, cmfT, specRGB, rgbOf, spdXYZ, xyOf, xyz, planck, gauss, sigm, drawChromaticity, LOCUS, inLocus, dominant, specBars, SRGB, coneFund, conePeaks, coneResp, toLMS, fromLMS, primSet, CIERGB, EW, adaptXYZ, mv3, inv3, metamerNull } from './ch04.shared.js';

const CONE_COL = ['red', 'green', 'accent'], CONE_NAME = ['L', 'M', 'S'];
const CF = []; for (let l = 380; l <= 780; l++) CF.push(coneFund(l));
const cf = (l) => CF[Math.max(0, Math.min(400, Math.round(l) - 380))];
/** Move (x,y) toward the equal-energy white until it lies inside the spectral locus polygon. */
function clampLocus(x, y) {
  if (inLocus(x, y)) return [x, y];
  let a = 0, b = 1; for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (inLocus(1 / 3 + (x - 1 / 3) * m, 1 / 3 + (y - 1 / 3) * m)) a = m; else b = m; }
  return [1 / 3 + (x - 1 / 3) * a, 1 / 3 + (y - 1 / 3) * a];
}
const up = (c) => { const d = c[0] + 15 * c[1] + 3 * c[2] || 1; return [(4 * c[0]) / d, (9 * c[1]) / d]; };
const fmt3 = (v, a) => a.map((u) => v.fix(u, 3)).join(', ');

export default {
  collection: 'art',
  chapter: 4,
  title: 'Trichromacy and colorimetry',
  summary: String.raw`The eye compresses each spectrum into three cone responses, so infinitely many spectra look alike. Grassmann’s laws make colour matching linear, which lets the CIE encode any colour as three numbers and draw all colours on a chromaticity diagram, where mixtures fall on straight lines. Gamuts, colour temperature, sRGB and colour blindness all become geometry in that diagram.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Concept',
      name: 'Cone fundamentals: L, M and S',
      credit: 'Stockman & Sharpe, 2000 (standard fundamentals); here the Hunt–Pointer–Estévez matrix applied to the CIE 1931 fit',
      statement: String.raw`Under daylight the retina has three kinds of cone, with long-, medium- and short-wavelength sensitivity curves $\bar l(\lambda),\bar m(\lambda),\bar s(\lambda)$ (the cone fundamentals). A light with spectrum $S(\lambda)$ excites them by
$$q_L=\int S\,\bar l\,d\lambda,\qquad q_M=\int S\,\bar m\,d\lambda,\qquad q_S=\int S\,\bar s\,d\lambda ,$$
and these three numbers are everything the cones report about the light. The $L$ and $M$ curves overlap heavily; the $S$ curve peaks far to the blue and is much less sensitive.`,
      idea: String.raw`Each cone pigment absorbs photons with a wavelength-dependent probability and then outputs a single number, the rate of absorptions, whatever the wavelength that caused it (the principle of univariance). So a cone cannot tell a dim light at its best wavelength from a bright light at a worse one, and a spectrum is reduced to three integrals against fixed curves (the dot product of $S$ with each fundamental). Everything in the rest of the chapter is linear algebra on those three numbers.`,
      caption: String.raw`The coloured curves are the three cone fundamentals (peak-normalised); the gold curve is the light. Choose the light and drag its centre and bandwidth. The shaded area is the product $S\cdot\bar c$ of the light with the cone you select, whose integral is the response in the bar chart (relative to an equal-energy light, which reads 1, 1, 1). Notice that a very narrow band excites the $L$ and $M$ cones in a ratio that depends only on its wavelength, which is how the brain can read hue from a ratio.`,
      deps: ['art-3.2'],
      refs: ['Fairchild ch. 1'],
      tags: ['cones', 'vision', 'spectrum'],
      scope: String.raw`These are not the measured Stockman–Sharpe fundamentals: they are the CIE 1931 colour-matching functions (the analytic fit of Wyman, Sloan & Shirley) mapped to cone space by the Hunt–Pointer–Estévez matrix, which is a common textbook approximation. Its $S$ curve is too broad and the $L$ curve peaks at a different wavelength from the modern fundamentals. Values hold for the 2° foveal field in photopic light.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/LMS_color_space' },
      verify: true,
      viz(v) {
        const src = v.select('light', [{ value: 'bump', label: 'broad band' }, { value: 'mono', label: 'narrow band' }, { value: 'eq', label: 'equal energy' }, { value: 'tung', label: 'incandescent' }], 'bump');
        const lam = v.slider('centre wavelength (nm)', 400, 700, 540, { step: 1 });
        const wid = v.slider('bandwidth (FWHM, nm)', 20, 160, 80, { step: 1 });
        const pick = v.select('show the product with the', [{ value: 0, label: 'L cone' }, { value: 1, label: 'M cone' }, { value: 2, label: 'S cone' }], 1);
        const A = v.stage({ x: [380, 780], y: [0, 1.3], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'relative', height: 330, weight: 1.5, title: 'cone fundamentals, the light, and their product' });
        const B = v.stage({ x: [0, 4], y: [0, 1.6], axes: false, height: 330, weight: 0.8, minWidth: 240, title: 'cone responses' });
        const fOf = () => {
          if (src.value === 'eq') return () => 1;
          if (src.value === 'tung') return (l) => planck(l, 2856) / planck(780, 2856);
          return (l) => gauss(l, lam.value, src.value === 'mono' ? 8 : wid.value);
        };
        const eq = coneResp(() => 1);
        lam.el.hidden = wid.el.hidden = false;
        let resp = [0, 0, 0];
        v.render(() => {
          lam.el.hidden = src.value === 'eq' || src.value === 'tung'; wid.el.hidden = src.value !== 'bump';
          const f = fOf(), k = pick.value;
          A.fn((l) => f(l) * cf(l)[k], { color: CONE_COL[k], fill: CONE_COL[k], fillAlpha: 0.3, width: 1, domain: [380, 780] });
          for (let i = 0; i < 3; i++) A.fn((l) => cf(l)[i], { color: CONE_COL[i], width: i === k ? 2.6 : 1.4, alpha: i === k ? 1 : 0.8, domain: [380, 780] });
          A.fn(f, { color: 'gold', width: 2, domain: [380, 780] });
          resp = coneResp(f).map((u, i) => u / eq[i]);
          const top = Math.max(1.2, ...resp) * 1.1; B.setView([0, 4], [-0.12 * top, top]);
          resp.forEach((r, i) => {
            B.rect(0.3 + i * 1.2, 0, 1.3 + i * 1.2, r, { fill: CONE_COL[i], fillAlpha: 0.75, stroke: false });
            B.text(CONE_NAME[i], 0.8 + i * 1.2, -0.02 * top, { size: 13, color: 'ink', align: 'center', baseline: 'top' });
            B.text(v.fix(r, 2), 0.8 + i * 1.2, r, { size: 11.5, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 });
          });
          B.hline(1, { color: 'muted', dash: [4, 4], width: 1 });
        });
        v.legend([['red', 'L'], ['green', 'M'], ['accent', 'S'], ['gold', 'light $S(\\lambda)$']]);
        v.readout(() => `$(L,M,S)$ relative to equal energy: $(${fmt3(v, resp)})$ · peaks of the model fundamentals: $L$ ${conePeaks[0]} nm, $M$ ${conePeaks[1]} nm, $S$ ${conePeaks[2]} nm\nthe whole spectrum is replaced by these three numbers${resp[0] / resp[1] > 0 ? ` (ratio $L/M=${v.fix(resp[0] / resp[1], 2)}$)` : ''}`);
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Principle',
      name: 'Trichromacy (Young–Helmholtz)',
      credit: 'Thomas Young, 1802; Helmholtz, 1850s; Maxwell, 1855–60',
      statement: String.raw`For a normal observer at photopic levels, any light can be matched in colour by a mixture of three fixed lights (primaries) in suitable amounts, provided that an amount may be negative, meaning that the primary is added to the light being matched. Three primaries suffice, and two never do: the set of colours is three-dimensional, and the primaries must be linearly independent (none matched by a mixture of the other two).`,
      idea: String.raw`Because the eye keeps only the three cone responses (art-4.1), two lights match exactly when their $(L,M,S)$ triples agree. A mixture of primaries has response $a_1\mathbf p_1+a_2\mathbf p_2+a_3\mathbf p_3$ where $\mathbf p_i$ is the cone-response triple of primary $i$, so matching a test with response $\mathbf t$ is the linear system $P\mathbf a=\mathbf t$. It has a unique solution for independent primaries; with only two primaries the system has more equations than unknowns and fails except on a plane of tests.`,
      caption: String.raw`A split field: the test light on the left (a narrow band of the chosen wavelength, with optional white added) and the primaries 700, 546.1 and 435.8 nm on the right. Adjust the three amounts until the halves agree, or press Match. With three primaries you can always get zero residual (sometimes with a negative amount: the field then shows the primary moved to the left, onto the test); reduce the number of primaries to two or one and a good match is no longer possible.`,
      deps: ['art-4.1'],
      refs: ['Fairchild ch. 1'],
      tags: ['trichromacy', 'colour matching'],
      scope: String.raw`Holds for a normal trichromat in a small foveal field at fixed adaptation. The matches are computed from the CIE 1931 fit, not measured. The shown colours are mapped to sRGB, which cannot display saturated lights; they are desaturated for display, but the residual is computed on the true values.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Trichromacy' },
      viz(v) {
        const lt = v.slider('test wavelength (nm)', 420, 680, 580, { step: 1 });
        const wh = v.slider('white added to the test', 0, 0.9, 0, { step: 0.01 });
        const nP = v.select('number of primaries', [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }], 3);
        const names = ['green 546.1', 'red 700', 'blue 435.8'], order = [1, 0, 2];
        const am = [0, 1, 2].map((i) => v.slider(`amount of ${names[i]} nm`, -3, 3, 0.5, { step: 0.01 }));
        const S = EW[0];
        const test = () => { const c = cmf(lt.value), s = (S) / (c[0] + c[1] + c[2]); return [0, 1, 2].map((k) => (1 - wh.value) * c[k] * s + wh.value * EW[k] / 3); };
        const pr = (i) => CIERGB.prim(order[i]);
        const solve = () => {
          const n = nP.value, t = test(), A = [0, 1, 2].map((r) => Array.from({ length: n }, (_, j) => pr(j)[r]));
          const a = v.M.lstsq(A, t); am.forEach((s, j) => s.set(j < n ? Math.max(-3, Math.min(3, a[j])) : 0));
        };
        v.button('Match', solve);
        solve();
        const F = v.stage({ x: [0, 2], y: [0, 1], axes: false, height: 190, weight: 1.2, title: 'the split field: test (left) and mixture of primaries (right)' });
        const Bst = v.stage({ x: [0, 4], y: [-3.2, 3.2], axes: false, height: 190, weight: 0.8, minWidth: 240, title: 'amounts of the primaries' });
        let info = {};
        v.render(() => {
          const n = nP.value;
          am.forEach((s, j) => { s.el.hidden = j >= n; });
          const t = test(); let L = t.slice(), R = [0, 0, 0];
          for (let j = 0; j < n; j++) { const a = am[j].value, p = pr(j); for (let k = 0; k < 3; k++) { if (a >= 0) R[k] += a * p[k]; else L[k] += -a * p[k]; } }
          const sc = 0.55 / (((L[1] + R[1]) / 2) || 1);
          F.rect(0, 0, 1, 1, { fill: rgbOf(L.map((u) => u * sc)), stroke: false, fillAlpha: 1 });
          F.rect(1, 0, 2, 1, { fill: rgbOf(R.map((u) => u * sc)), stroke: false, fillAlpha: 1 });
          F.line(1, 0, 1, 1, { color: 'panel', width: 1 });
          const lt3 = toLMS(L), rt3 = toLMS(R), d = Math.hypot(lt3[0] - rt3[0], lt3[1] - rt3[1], lt3[2] - rt3[2]), tn = Math.hypot(...toLMS(t));
          [0, 1, 2].forEach((j) => {
            const a = j < n ? am[j].value : 0, col = ['green', 'red', 'accent'][j];
            Bst.rect(0.3 + j * 1.2, 0, 1.3 + j * 1.2, a, { fill: col, fillAlpha: 0.75, stroke: false });
            Bst.text(names[j].split(' ')[0], 0.8 + j * 1.2, 0, { size: 11.5, color: 'muted', align: 'center', baseline: a >= 0 ? 'top' : 'bottom', dy: a >= 0 ? 4 : -4 });
          });
          Bst.hline(0, { color: 'ink', width: 1 });
          info = { rel: d / tn, neg: am.slice(0, n).some((s) => s.value < -1e-6) };
        });
        v.legend([['green', 'green primary'], ['red', 'red primary'], ['accent', 'blue primary']]);
        v.readout(() => `residual cone-response difference between the halves: ${v.fix(100 * info.rel, 2)}% of the test response${info.rel < 0.005 ? ' (a match)' : nP.value < 3 ? ' (with fewer than three primaries no setting removes it)' : ''}${info.neg ? '\na negative amount means that primary is added to the test half' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Phenomenon',
      name: 'Metamerism',
      statement: String.raw`Two surfaces (or lights) with different spectra can produce identical cone responses, and so match, under one illuminant; such a pair is called *metameric*. Under a different illuminant their responses generally differ and the match fails: if $R_1(\lambda)$ and $R_2(\lambda)$ satisfy
$$\int I_a R_1\,\bar c_k\,d\lambda=\int I_a R_2\,\bar c_k\,d\lambda\quad(k=1,2,3)$$
for illuminant $I_a$, it does not follow that the same holds for another illuminant $I_b$. The difference $R_1-R_2$ lies in the kernel of the map spectrum $\to$ colour for $I_a$, but that kernel changes with the illuminant.`,
      idea: String.raw`The map from reflectance spectra to colour is a linear map to $\mathbb R^3$ (art-4.2), whose kernel is huge (infinite-dimensional), so there are always many metamers. The kernel depends on the weights $I(\lambda)\bar c_k(\lambda)$, so it moves when the illuminant does. In the demonstration the second spectrum is the first plus an oscillation that has zero integral against the three weights of daylight; under another lamp the weights are different and the oscillation no longer cancels.`,
      caption: String.raw`Two paint samples that match under daylight (the oscillation is built to be invisible to the daylight weights). Change the lamp and watch the swatches separate; the number is the distance in the $u'v'$ chromaticity plane. Increase the mismatch strength to enlarge the spectral difference. The three-band fluorescent lamp and the sodium-like peaks show how strongly the result depends on where the lamp has energy. “Eye adapts” rescales each lamp’s white to daylight white.`,
      deps: ['art-4.2'],
      refs: ['Fairchild ch. 3'],
      tags: ['metamerism', 'spectrum'],
      scope: String.raw`The daylight is a $6504$ K black body (a crude stand-in for the CIE D65 spectrum), the other lamps are models (incandescent: $2856$ K black body; LED and fluorescent: generic shapes). The reflectances are smooth invented curves. The standard observer is the CIE 1931 fit; individual observers differ and see observer metamerism too.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Metamerism_(color)' },
      viz(v) {
        const day = (l) => planck(l, 6504);
        const LAMP = {
          day: { f: day, label: 'daylight (model)' },
          tung: { f: (l) => planck(l, 2856), label: 'incandescent' },
          led: { f: (l) => 1.8 * gauss(l, 450, 22) + gauss(l, 570, 120), label: 'white LED (model)' },
          fl: { f: (l) => 0.04 + 0.6 * gauss(l, 436, 8) + gauss(l, 545, 8) + 1.1 * gauss(l, 611, 8), label: 'three-band fluorescent (model)' },
        };
        const R1 = (l) => 0.12 + 0.55 * sigm((l - 565) / 26);
        const n = metamerNull(day, v.M.nullspace);
        let amax = 1; for (let l = 380; l <= 780; l += 2) { const r = R1(l), m = Math.abs(n(l)) || 1e-9; amax = Math.min(amax, n(l) > 0 ? (0.97 - r) / n(l) : (r - 0.02) / m); }
        const sel = v.select('lamp', Object.entries(LAMP).map(([k, o]) => ({ value: k, label: o.label.replace(' (model)', '') })), 'day');
        const mis = v.slider('mismatch strength', 0, 1, 1, { step: 0.01 });
        const adapt = v.toggle('eye adapts to the lamp', false);
        const A = v.stage({ x: [380, 780], y: [0, 1.05], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'reflectance', height: 300, weight: 1.4, title: 'two paints with different reflectance spectra' });
        const Bst = v.stage({ x: [0, 4], y: [0, 2.4], axes: false, equal: true, height: 300, weight: 0.8, minWidth: 240, title: 'as seen under the lamp' });
        let info = {};
        v.render(() => {
          const a = mis.value * amax, R2 = (l) => R1(l) + a * n(l), lamp = LAMP[sel.value];
          A.fn(R1, { color: 'accent', width: 2, domain: [380, 780] });
          A.fn(R2, { color: 'orange', width: 2, domain: [380, 780] });
          let imax = 0; for (let l = 380; l <= 780; l += 4) imax = Math.max(imax, lamp.f(l));
          A.fn((l) => (0.9 * lamp.f(l)) / imax, { color: 'muted', width: 1, dash: [4, 4], domain: [380, 780] });
          const w = spdXYZ(lamp.f, 5), Yw = w[1];
          const col = (R) => { let c = spdXYZ((l) => lamp.f(l) * R(l), 5).map((u) => u / Yw); if (adapt.value) c = adaptXYZ(c, w.map((u) => u / Yw)); return c; };
          const c1 = col(R1), c2 = col(R2), pa = up(c1), pb = up(c2);
          const rg = (c) => rgbOf(c.map((u) => u * 0.9));
          Bst.rect(0.1, 0.1, 1.9, 2.3, { fill: rg(c1), stroke: false, fillAlpha: 1, radius: 8 });
          Bst.rect(2.1, 0.1, 3.9, 2.3, { fill: rg(c2), stroke: false, fillAlpha: 1, radius: 8 });
          Bst.text('paint 1', 1, 0.15, { size: 11, color: 'muted', align: 'center', baseline: 'bottom', plate: true });
          Bst.text('paint 2', 3, 0.15, { size: 11, color: 'muted', align: 'center', baseline: 'bottom', plate: true });
          info = { d: Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) };
        });
        v.legend([['accent', 'paint 1'], ['orange', 'paint 2'], ['muted', 'lamp spectrum (dashed)']]);
        v.readout(() => `distance of the two colours in the $u'v'$ plane under this lamp: $${v.sci(info.d, 2)}$${info.d < 0.002 ? ' (indistinguishable: a metameric match)' : info.d < 0.005 ? ' (barely distinguishable)' : ' (clearly different)'}\nunder model daylight the distance is $\\approx 0$ for every mismatch strength, although the spectra differ by up to ${v.fix(mis.value * amax, 2)} in reflectance`);
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Law',
      name: 'Grassmann’s laws of colour mixture',
      credit: 'Hermann Grassmann, 1853',
      statement: String.raw`Write $A\sim B$ when two lights look identical in a matching field, and $A\oplus C$ for the light made by superposing $A$ and $C$. At fixed adaptation and moderate intensities, matching is compatible with mixing and scaling:
(a) **proportionality:** if $A\sim B$ then $kA\sim kB$ for every $k>0$;
(b) **additivity:** if $A\sim B$ then $A\oplus C\sim B\oplus C$ for every light $C$;
(c) matching is symmetric and transitive, so it is an equivalence relation.
Hence colours form a three-dimensional convex cone: a match is an equality of three linear functionals of the spectrum.`,
      idea: String.raw`Absorbed photons add, so the cone responses $L,M,S$ of a superposition are the sums of the responses (art-4.1), and a match is equality of the triples. Proportionality and additivity then say that $(L,M,S)$ is linear in the light, which is true up to the nonlinearities of later vision (adaptation, saturation at high intensity). That linearity is what allows colour-matching functions (art-4.5) to be tabulated once and for all.`,
      caption: String.raw`Two lights match: the left is a smooth spectrum, the right a different spectrum built to give the same $XYZ$. Choose an operation to apply: add the same light $C$ (a narrow band you can tune) to both halves, scale both, or the “unfair” variants that add or scale on one side only. The difference in $XYZ$ stays zero for the legal operations and becomes visible for the unfair ones.`,
      deps: ['art-4.2', 'art-3.5'],
      refs: ['Fairchild ch. 3'],
      tags: ['Grassmann', 'linearity', 'colour mixing'],
      scope: String.raw`Valid for lights in a small foveal field at constant adaptation; it fails at very high intensities (bleaching), for large or long-lasting fields, and wherever the eye’s state changes between the two fields. The numerical check uses the CIE 1931 fit; the spectra are models.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Grassmann%27s_laws_(color_science)' },
      verify: true,
      viz(v) {
        const n = metamerNull(() => 1, v.M.nullspace);
        const cen = v.slider('left light: bump centre (nm)', 450, 650, 560, { step: 1 });
        const op = v.select('operation', [{ value: 'none', label: 'none' }, { value: 'addB', label: 'add $C$ to both' }, { value: 'scB', label: 'scale both' }, { value: 'addL', label: 'add $C$ to left only' }, { value: 'scL', label: 'scale left only' }], 'none');
        const cl = v.slider('$C$: wavelength (nm)', 420, 680, 620, { step: 1 });
        const ca = v.slider('$C$: amount', 0, 2, 0.6, { step: 0.01 });
        const k = v.slider('scale factor $k$', 0.2, 3, 1.8, { step: 0.01 });
        const A = v.stage({ x: [380, 780], y: [0, 2.2], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'power', height: 300, weight: 1.4, title: 'the two spectra after the operation' });
        const Bst = v.stage({ x: [0, 2], y: [0, 1], axes: false, height: 300, weight: 0.8, minWidth: 240, title: 'matching field' });
        let info = {};
        v.render(() => {
          const L0 = (l) => 0.5 + 0.5 * gauss(l, cen.value, 90), R0 = (l) => Math.max(0, L0(l) + 0.2 * n(l));
          const C = (l) => ca.value * 8 * gauss(l, cl.value, 12) / 1;
          const o = op.value;
          const addL = o === 'addB' || o === 'addL', addR = o === 'addB', kl = o === 'scB' || o === 'scL' ? k.value : 1, kr = o === 'scB' ? k.value : 1;
          [ca, cl].forEach((s) => { s.el.hidden = !(o === 'addB' || o === 'addL'); }); k.el.hidden = !(o === 'scB' || o === 'scL');
          const Lf = (l) => kl * (L0(l) + (addL ? C(l) : 0)), Rf = (l) => kr * (R0(l) + (addR ? C(l) : 0));
          A.fn(Lf, { color: 'accent', width: 2, domain: [380, 780] });
          A.fn(Rf, { color: 'orange', width: 2, domain: [380, 780] });
          const XL = spdXYZ(Lf, 5), XR = spdXYZ(Rf, 5), d = [0, 1, 2].map((i) => XL[i] - XR[i]);
          const sc = 0.55 / (((XL[1] + XR[1]) / 2) || 1);
          Bst.rect(0, 0, 1, 1, { fill: rgbOf(XL.map((u) => u * sc)), stroke: false, fillAlpha: 1 });
          Bst.rect(1, 0, 2, 1, { fill: rgbOf(XR.map((u) => u * sc)), stroke: false, fillAlpha: 1 });
          const pa = up(XL), pb = up(XR);
          info = { rel: Math.hypot(...d) / Math.hypot(...XL), du: Math.hypot(pa[0] - pb[0], pa[1] - pb[1]), diff: Math.max(...[0, 1, 2].map((i) => { let m = 0; for (let l = 380; l <= 780; l += 4) m = Math.max(m, Math.abs(Lf(l) - Rf(l))); return m; })) };
        });
        v.legend([['accent', 'left light'], ['orange', 'right light']]);
        v.readout(() => `largest difference between the two spectra: ${v.fix(info.diff, 2)} · relative difference of the $XYZ$ triples: $${v.sci(info.rel, 2)}$ · colour distance $\\Delta u'v'=${v.sci(info.du, 2)}$\n${info.rel < 1e-4 ? 'the halves still match: different spectra, same colour' : 'the match is broken'}`);
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Method',
      name: 'Colour-matching functions',
      credit: 'W. D. Wright, 1928–29, and J. Guild, 1931 (experimental data); CIE RGB primaries 700, 546.1 and 435.8 nm',
      statement: String.raw`Fix three primary lights. For each wavelength $\lambda$ let $\bar r(\lambda),\bar g(\lambda),\bar b(\lambda)$ be the amounts of the primaries that match a unit of monochromatic light at $\lambda$ (negative amounts are added to the test). By Grassmann’s laws (art-4.4), the match of any light $S(\lambda)$ then needs the amounts
$$R=\int S\,\bar r\,d\lambda,\quad G=\int S\,\bar g\,d\lambda,\quad B=\int S\,\bar b\,d\lambda ,$$
so three functions of $\lambda$ describe every colour match. The functions depend on the chosen primaries by a $3\times3$ linear change.`,
      idea: String.raw`A general light is a superposition of monochromatic lights, so by additivity and proportionality its match is the same superposition of the monochromatic matches; the integrals follow. The negative lobe of $\bar r$ between about 440 and 550 nm is not strange physics: no real mixture of a single red, green and blue primary reaches the saturation of a spectral blue-green, so the red primary must be added to the test field to desaturate it.`,
      caption: String.raw`Slide the test wavelength. The right panel shows the amounts of the three primaries; a bar below zero means that primary goes to the test side. In the field, the test is shown alone, with the negative primary added, and as the positive mixture, the last two being the same colour. Change the primaries to see that the curves change but remain related by a linear map; for primaries bunched together the negative lobes become enormous.`,
      deps: ['art-4.4'],
      refs: ['Fairchild ch. 3'],
      tags: ['colour matching', 'CIE'],
      scope: String.raw`The curves here are not the Wright and Guild measurements: they are the CIE 1931 analytic fit (art-4.6) converted to the chosen primaries by the exact linear change. The unit of each primary is scaled so that the equal-energy stimulus needs equal amounts of all three, the CIE RGB convention. Standard 2° observer.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/CIE_1931_color_space' },
      viz(v) {
        const SETS = { cie: CIERGB, disp: primSet([610, 540, 465]), tight: primSet([590, 550, 510]) };
        const sel = v.select('primaries (nm)', [{ value: 'cie', label: '700, 546.1, 435.8 (CIE RGB)' }, { value: 'disp', label: '610, 540, 465' }, { value: 'tight', label: '590, 550, 510' }], 'cie');
        const lam = v.slider('test wavelength (nm)', 400, 700, 490, { step: 1 });
        const A = v.stage({ x: [380, 720], y: [-0.2, 1.6], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'amount of primary (equal-area units)', height: 330, weight: 1.45, title: 'colour-matching functions' });
        const B = v.stage({ x: [0, 3], y: [0, 1], axes: false, equal: false, height: 330, weight: 0.75, minWidth: 230, title: 'the matching field' });
        let info = {};
        v.render(() => {
          const P = SETS[sel.value];
          const ymax = 1.0; let lo = 0, hi = 0; for (let l = 380; l <= 720; l += 4) { const c = P.cmf(l).map((u) => u * EW[0]); lo = Math.min(lo, ...c); hi = Math.max(hi, ...c); }
          A.setView([380, 720], [lo * 1.15 - 0.02, hi * 1.15]);
          const cols = ['red', 'green', 'accent'];
          for (let i = 0; i < 3; i++) A.fn((l) => P.cmf(l)[i] * EW[0], { color: cols[i], width: 2, domain: [380, 720] });
          A.hline(0, { color: 'ink', width: 0.8, alpha: 0.6 });
          A.vline(lam.value, { color: 'gold', width: 1.5, dash: [4, 4] });
          const a = P.cmf(lam.value).map((u) => u * EW[0]), t = cmf(lam.value);
          for (let i = 0; i < 3; i++) A.dot(lam.value, a[i], { r: 4.5, color: cols[i] });
          let Lc = t.slice(), Rc = [0, 0, 0];
          for (let i = 0; i < 3; i++) { const p = P.prim(i); for (let k = 0; k < 3; k++) { if (a[i] >= 0) Rc[k] += a[i] / EW[0] * p[k]; else Lc[k] += -a[i] / EW[0] * p[k]; } }
          const sc = 0.55 / (Rc[1] || 1);
          B.rect(0, 0.34, 1, 1, { fill: rgbOf(t.map((u) => u * sc)), stroke: false, fillAlpha: 1 });
          B.rect(1, 0.34, 2, 1, { fill: rgbOf(Lc.map((u) => u * sc)), stroke: false, fillAlpha: 1 });
          B.rect(2, 0.34, 3, 1, { fill: rgbOf(Rc.map((u) => u * sc)), stroke: false, fillAlpha: 1 });
          ['test', 'test + neg.', 'mixture'].forEach((s, i) => B.text(s, 0.5 + i, 0.3, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' }));
          const Y = SETS.cie.P[1];
          info = { a, neg: a.findIndex((u) => u < 0), Y, hi };
        });
        v.legend([['red', 'first primary'], ['green', 'second'], ['accent', 'third'], ['gold', 'test wavelength']]);
        v.readout(() => `amounts at ${lam.value} nm: $(${fmt3(v, info.a)})$ ${info.neg >= 0 ? `· the ${['first', 'second', 'third'][info.neg]} primary is negative: added to the test` : '· all positive'}\nthe CIE RGB unit primaries have luminances in the ratio $1:${v.fix(SETS.cie.P[1][1] / SETS.cie.P[1][0], 4)}:${v.fix(SETS.cie.P[1][2] / SETS.cie.P[1][0], 4)}$ (this is the $Y$ row of the published matrix, $0.17697:0.81240:0.01063$)`);
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Definition',
      name: 'CIE 1931 XYZ tristimulus values',
      credit: 'Commission Internationale de l’Éclairage, 1931 (Smith, Guild and colleagues)',
      statement: String.raw`The CIE 1931 standard colorimetric observer is defined by three functions $\bar x,\bar y,\bar z$ of wavelength, obtained from the experimental $\bar r,\bar g,\bar b$ by a fixed linear transformation (art-4.5) chosen so that all three are non-negative and $\bar y(\lambda)$ equals the luminous-efficiency function $V(\lambda)$. The tristimulus values of a light $S(\lambda)$ are
$$X=\int S\,\bar x\,d\lambda,\quad Y=\int S\,\bar y\,d\lambda,\quad Z=\int S\,\bar z\,d\lambda ,$$
so $Y$ is the luminance, and the equal-energy stimulus has $X=Y=Z$. Two lights match for the standard observer exactly when their $XYZ$ agree.`,
      idea: String.raw`A change of primaries is a $3\times3$ matrix $T$ acting on the matching functions (and on all tristimulus triples); because the algebra of mixing is linear (art-4.4), any invertible $T$ gives equally valid coordinates. The CIE picked the one with $\bar x,\bar y,\bar z\ge0$ (no negative lobes, so calculations by hand had no sign problems) and with all luminance in $Y$ alone. The price is that the primaries $X,Y,Z$ are imaginary: they lie outside the spectral locus (art-4.7) and cannot be produced by any light.`,
      caption: String.raw`Top: the matching functions (choose $XYZ$ or the CIE RGB system they come from). Bottom: drag the seven handles to draw a spectrum $S(\lambda)$; the shaded area under $S\bar y$ is $Y$. The readout gives $X,Y,Z$, the chromaticity $(x,y)$, and recomputes $X,Y,Z$ from the $\bar r\bar g\bar b$ route with the standard matrix to show that the two coordinate systems carry the same information.`,
      deps: ['art-4.5', 'pma-9.4'],
      refs: ['Fairchild ch. 3'],
      tags: ['CIE 1931', 'XYZ'],
      scope: String.raw`The curves are the Wyman–Sloan–Shirley analytic fit to the 1931 two-degree tables, accurate to within about a percent of the peak; the matrix with the constant $0.17697$ is the one quoted for the CIE RGB to $XYZ$ conversion. 2° field, photopic vision.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/CIE_1931_color_space' },
      viz(v) {
        const basis = v.select('matching functions', [{ value: 'xyz', label: '$\\bar x,\\bar y,\\bar z$' }, { value: 'rgb', label: '$\\bar r,\\bar g,\\bar b$' }], 'xyz');
        const A = v.stage({ x: [380, 780], y: [-0.4, 2.2], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'sensitivity', height: 260, weight: 1.2, title: 'colour-matching functions' });
        const B = v.stage({ x: [380, 780], y: [0, 1.15], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'relative power', height: 260, weight: 1.2, title: 'a spectrum $S(\\lambda)$ (drag the handles)' });
        const wl = [400, 450, 500, 550, 600, 650, 700], init = [0.2, 0.9, 0.6, 0.35, 0.8, 0.5, 0.1];
        const hs = wl.map((w, i) => B.handle(w, init[i], { color: 'gold', r: 6, constrain: (x, y) => [w, Math.max(0, Math.min(1.1, y))] }));
        const S = (l) => { if (l <= wl[0]) return hs[0].y; if (l >= wl[6]) return hs[6].y; let i = 0; while (l > wl[i + 1]) i++; const t = (l - wl[i]) / 50; return hs[i].y * (1 - t) + hs[i + 1].y * t; };
        let info = {};
        const RGBX = [[0.49, 0.31, 0.2], [0.17697, 0.8124, 0.01063], [0, 0.01, 0.99]];
        v.render(() => {
          const rgb = basis.value === 'rgb';
          const g = (l) => (rgb ? CIERGB.cmf(l) : cmf(l));
          // normalise the xyz curves to unit area for plotting at the same scale as r g b
          const sc = rgb ? EW[0] : 1;
          const cols = rgb ? ['red', 'green', 'accent'] : ['red', 'green', 'accent'];
          A.setView([380, 780], rgb ? [-0.9, 2.9] : [-0.1, 1.9]);
          for (let i = 0; i < 3; i++) A.fn((l) => g(l)[i] * sc, { color: cols[i], width: i === 1 && !rgb ? 2.6 : 1.8, domain: [380, 780] });
          A.hline(0, { color: 'ink', width: 0.8, alpha: 0.6 });
          B.fn((l) => S(l) * cmf(l)[1] / 1.0, { color: 'green', fill: 'green', fillAlpha: 0.22, width: 1, domain: [380, 780], alpha: 0.7 });
          B.fn(S, { color: 'gold', width: 2.4, domain: [380, 780] });
          const c = spdXYZ(S, 2), [xx, yy] = xyOf(c), rg = [0, 1, 2].map((i) => { let s = 0; for (let l = 380; l <= 780; l += 2) s += S(l) * CIERGB.cmf(l)[i]; return s * 2; });
          const viaM = RGBX.map((r) => r[0] * rg[0] + r[1] * rg[1] + r[2] * rg[2]);
          info = { c, xx, yy, viaM, rel: [0, 1, 2].map((i) => viaM[i] / (c[i] / EW[i]) - 1) };
        });
        v.legend([['red', '$\\bar x$ (or $\\bar r$)'], ['green', '$\\bar y$ (or $\\bar g$)'], ['accent', '$\\bar z$ (or $\\bar b$)']]);
        v.readout(() => `$X=${v.fix(info.c[0], 2)},\\ Y=${v.fix(info.c[1], 2)},\\ Z=${v.fix(info.c[2], 2)}$ · chromaticity $x=${v.fix(info.xx, 4)},\\ y=${v.fix(info.yy, 4)}$ · $Y$ is the luminance (green area)\nvia the $\\bar r\\bar g\\bar b$ route and the standard matrix the same triple comes out (relative difference ${v.sci(Math.max(...info.rel.map(Math.abs)) + 1e-16, 1)}): the change of primaries is an exact $3\\times3$ linear map, which is why either system describes the same colours`);
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Definition',
      name: 'Chromaticity diagram and the spectral locus',
      credit: 'CIE, 1931',
      statement: String.raw`The chromaticity coordinates of a light with tristimulus values $(X,Y,Z)$ are
$$x=\frac{X}{X+Y+Z},\qquad y=\frac{Y}{X+Y+Z},\qquad z=1-x-y ,$$
which forget the overall intensity and keep the colour quality. The monochromatic lights trace the horseshoe-shaped **spectral locus**; the straight **line of purples** joins its two ends; every real light has its chromaticity inside the region they enclose. The point $(x,y)=(\tfrac13,\tfrac13)$ is the equal-energy white.`,
      idea: String.raw`Because $(X,Y,Z)$ is positive and linear in the spectrum (art-4.6), a spectrum is a positive combination of monochromatic lights, so its chromaticity is an average of locus points and cannot leave the locus’s convex hull. The projection divides by a positive sum, so scaling a light does not move its point (proportionality, art-4.4): the diagram is the plane of colours with brightness divided out, and the third coordinate $Y$ (luminance) is the one dropped.`,
      caption: String.raw`Build a spectrum from one or two bands, drag the sliders, and watch its point move inside the horseshoe. A single narrow band sits on the locus; widening it or adding a second band pulls the point inward toward white, and two bands far apart land on the purple side. The brightness slider changes $Y$ but not the point. The dashed ray is the line from white through the point to the locus, whose wavelength is the dominant wavelength.`,
      deps: ['art-4.6'],
      refs: ['Fairchild ch. 3'],
      tags: ['chromaticity', 'CIE 1931'],
      scope: String.raw`Standard 2° observer, analytic fit of the matching functions; the locus is drawn from 420 to 700 nm. Colours inside the diagram are shown as they would appear after mapping into sRGB, so the saturated ones are only approximate.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_xy_chromaticity_diagram_and_the_CIE_xyY_color_space' },
      viz(v) {
        const c1 = v.slider('band 1: centre (nm)', 420, 700, 520, { step: 1 });
        const w1 = v.slider('band 1: width (nm)', 4, 200, 10, { step: 1 });
        const two = v.toggle('add a second band', false);
        const c2 = v.slider('band 2: centre (nm)', 420, 700, 650, { step: 1 });
        const mix = v.slider('band 2 relative power', 0.05, 5, 1, { step: 0.01, log: true });
        const br = v.slider('overall brightness', 0.1, 10, 1, { step: 0.01, log: true });
        const D = v.stage({ x: [0, 0.8], y: [0, 0.9], equal: true, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', height: 430, weight: 1.2, title: 'CIE 1931 chromaticity diagram' });
        const Sx = v.stage({ x: [380, 780], y: [0, 1.1], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'power', height: 430, weight: 0.8, minWidth: 250, title: 'the spectrum' });
        let info = {};
        v.render(() => {
          c2.el.hidden = mix.el.hidden = !two.value;
          const f = (l) => br.value * (gauss(l, c1.value, w1.value) / 1 + (two.value ? mix.value * gauss(l, c2.value, w1.value) : 0));
          drawChromaticity(D, v);
          const c = spdXYZ(f, 1), [x, y] = xyOf(c), dm = dominant(x, y);
          D.dot(1 / 3, 1 / 3, { r: 4, hollow: true, color: 'ink', label: 'E', labelPos: 'sw' });
          if (dm.l) { const hl = dm.purple ? null : LOCUS[Math.round(dm.l) - 420]; if (hl) D.line(1 / 3, 1 / 3, hl[1], hl[2], { color: 'ink', dash: [4, 4], width: 1 }); }
          D.dot(x, y, { r: 7, color: rgbOf(c.map((u) => u / c[1] * 0.6)), label: '', });
          D.dot(x, y, { r: 7.5, hollow: true, color: 'ink' });
          const g = (l) => f(l) / Math.max(1e-9, 10 * br.value);
          let m = 0; for (let l = 380; l <= 780; l += 2) m = Math.max(m, f(l));
          Sx.setView([380, 780], [0, Math.max(1.1, m * 1.1)]);
          specBars(Sx, f, 380, 780, 3, { alpha: 0.5 });
          Sx.fn(f, { color: 'ink', width: 1.6, domain: [380, 780] });
          info = { x, y, Y: c[1], dm, inside: inLocus(x, y) };
        });
        v.readout(() => `$(x,y)=(${v.fix(info.x, 4)},\\ ${v.fix(info.y, 4)})$ · $Y=${v.fix(info.Y, 2)}$ · ${info.dm.l ? `${info.dm.purple ? 'complementary' : 'dominant'} wavelength ${v.fix(info.dm.l, 0)} nm, excitation purity ${v.fix(info.dm.purity, 2)}` : 'achromatic'} · ${info.inside ? 'inside the spectral locus' : 'on the locus boundary'}`);
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Mixtures lie on segments; gamuts are convex hulls',
      statement: String.raw`Let lights $1,\dots,n$ have chromaticities $(x_i,y_i)$ and luminances $Y_i>0$. Their superposition has chromaticity
$$(x,y)=\sum_i m_i\,(x_i,y_i),\qquad m_i=\frac{Y_i/y_i}{\sum_j Y_j/y_j}\ \ (m_i>0,\ \textstyle\sum m_i=1),$$
a weighted average of the $(x_i,y_i)$. Hence mixtures of two lights fill exactly the segment joining them, and mixtures of three fill exactly the triangle (the $n$ lights give their convex hull, the **gamut**). A chromaticity outside the hull can be matched only with a negative amount, which no mixing produces.`,
      idea: String.raw`Tristimulus values add (art-4.4), so $X=\sum X_i$ and likewise $Y,Z$; and $X_i+Y_i+Z_i=Y_i/y_i$. Dividing, $x=\sum X_i/\sum(X_i+Y_i+Z_i)=\sum m_ix_i$ with the weights $m_i$ above, positive and summing to one. By varying the positive amounts $Y_i$ the weights $m_i$ take every positive value in the simplex, so the whole open triangle is reached. Think of $m_i$ as masses placed at the points: the mixture is the centre of mass.`,
      caption: String.raw`Drag the three primaries inside the horseshoe and set their amounts $Y_i$ with the sliders; the gold dot is the mixture, always inside the triangle at the centre of mass of the weights $Y_i/y_i$. Drag the target (the open dot) anywhere: the readout gives the amounts needed to reproduce it, and they turn negative exactly when it lies outside the triangle.`,
      deps: ['art-4.7', 'art-4.4'],
      refs: ['Fairchild ch. 3'],
      tags: ['gamut', 'convexity', 'chromaticity'],
      scope: String.raw`Mixing is of lights (additive); for paints and filters the rules differ (art-3.6, art-3.7). Primaries are restricted to the interior of the spectral locus because real lights have chromaticities there.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gamut' },
      viz(v) {
        const D = v.stage({ x: [0, 0.8], y: [0, 0.9], equal: true, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', height: 440, weight: 1.3, title: 'three primaries, their mixture and a target' });
        const start = [[0.65, 0.32], [0.2, 0.7], [0.16, 0.08]], nm = ['1', '2', '3'];
        const H = start.map(([x, y], i) => D.handle(x, y, { color: ['red', 'green', 'accent'][i], r: 8, label: nm[i], constrain: (px, py) => clampLocus(px, py) }));
        const T = D.handle(0.42, 0.45, { color: 'ink', r: 8, label: 'target', constrain: (px, py) => clampLocus(px, py) });
        const am = start.map((_, i) => v.slider(`amount $Y_${i + 1}$`, 0, 1, [0.4, 0.5, 0.3][i], { step: 0.005 }));
        let info = {};
        v.render(() => {
          const P = H.map((h) => [h.x, h.y]);
          drawChromaticity(D, v, { fade: 0.4 });
          D.poly(P, { fill: 'accent', fillAlpha: 0.1, color: 'ink', width: 1.4 });
          const w = P.map(([, y], i) => am[i].value / y), W = w.reduce((a, b) => a + b, 0) || 1;
          const m = w.map((u) => u / W);
          const mx = m.reduce((a, mi, i) => a + mi * P[i][0], 0), my = m.reduce((a, mi, i) => a + mi * P[i][1], 0);
          // XYZ sum check
          const sum = [0, 0, 0]; P.forEach(([x, y], i) => { const c = xyz(x, y, am[i].value); for (let k = 0; k < 3; k++) sum[k] += c[k]; });
          const [sx, sy] = xyOf(sum);
          D.dot(mx, my, { r: 7, color: 'gold', label: 'mixture', labelPos: 'ne' });
          // barycentric coordinates of the target
          const [a, b, c] = P, den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
          const l1 = ((b[1] - c[1]) * (T.x - c[0]) + (c[0] - b[0]) * (T.y - c[1])) / den, l2 = ((c[1] - a[1]) * (T.x - c[0]) + (a[0] - c[0]) * (T.y - c[1])) / den, l3 = 1 - l1 - l2;
          const lam = [l1, l2, l3], need = lam.map((l, i) => l * P[i][1]), ns = need.reduce((x2, y2) => x2 + Math.abs(y2), 0);
          D.dot(T.x, T.y, { r: 8, hollow: true, color: 'ink' });
          info = { mx, my, sx, sy, lam, need, inside: lam.every((l) => l >= -1e-9), m };
        });
        v.readout(() => `masses $m=(${fmt3(v, info.m)})$ · mixture $(${v.fix(info.mx, 4)},\\ ${v.fix(info.my, 4)})$ from the weights; from the summed $XYZ$: $(${v.fix(info.sx, 4)},\\ ${v.fix(info.sy, 4)})$ ✓\ntarget in barycentric coordinates $(${fmt3(v, info.lam)})$: ${info.inside ? 'inside the triangle, reachable with non-negative amounts' : 'outside the triangle: at least one amount would be negative'}; relative amounts $Y_i\\propto\\lambda_i y_i$: $(${fmt3(v, info.need.map((u) => u / Math.max(1e-9, info.need.reduce((a, b) => a + Math.abs(b), 0))))})$`);
      },
    },
  ],
};
