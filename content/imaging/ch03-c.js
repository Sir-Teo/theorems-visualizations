// Medical Imaging — Chapter 3 (part 3): 3.11 ART (Kaczmarz), 3.12 SIRT and SART, 3.13 Hounsfield units, 3.14 CT artifacts (cupping, metal streaks).
import {
  clamp, fx, mean, sd, showImage, frame, raster, ellAt, ellProj, slEllipses, makeScan, sinoEll, fbp, filterSino, backproject, makeFilter, rmse, rms,
  forward, artSweep, spreadOrder, sirtStep, sartSweep, rng32, gauss, noiseField, poissonFrom,
  MATS, mu, tubeSpectrum,
} from './ch03.shared.js';
import { exactPixelSystemAudit, kaczmarzPathAudit, squareExtentAudit, equationSegmentAudit } from './source-audit-algebraic.shared.js';

const PI = Math.PI;
const lin = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

// a small tomography problem shared by 3.11 and 3.12: 24×24 head phantom, 18 views × 36 rays
const NS = 24;
let SYS = null;
function problem() {
  if (!SYS) {
    const E = slEllipses(0.9), sys = exactPixelSystemAudit(NS, 18, 36, 1.42), x0 = raster((x, y) => ellAt(E, x, y), NS, NS, 3), b0 = forward(sys, x0);
    SYS = { sys, x0, b0, E, order: spreadOrder(sys), seq: sys.rows.map((_, i) => i) };
  }
  return SYS;
}
const noisy = (b0, level, seed) => { const r = rng32(seed), m = mean(b0); return Float64Array.from(b0, (q) => q + level * m * gauss(r)); };

export default {
  collection: 'imaging',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Algorithm',
      name: 'Algebraic reconstruction technique (Kaczmarz)',
      statement: String.raw`Let $A\mu=b$ be a finite real system with nonzero rows $\mathbf a_i$. Cyclic **ART (Kaczmarz)** uses the relaxed row update
$$\mu^{(k+1)}=\mu^{(k)}+\lambda\,\frac{b_i-\mathbf a_i\cdot\mu^{(k)}}{\|\mathbf a_i\|^2}\,\mathbf a_i ,\qquad i=k\bmod m,\quad0<\lambda<2.$$
At $\lambda=1$ this is the orthogonal projection onto the equation's hyperplane; otherwise it is a relaxed projection. With fixed relaxation and every row visited cyclically, a **consistent** system converges to the solution closest in Euclidean norm to the starting point. For an inconsistent system there is no common solution: different row phases can approach different limits. An end-of-sweep sequence may converge even though the individual row iterates do not. Early stopping can reduce reconstruction error for a particular noisy problem; it has no universal optimality guarantee.`,
      idea: String.raw`For any solution $z$ of a consistent system, put $r_i=b_i-\mathbf a_i\cdot x$. One update gives
$$\begin{aligned}\|x^+-z\|^2&=\|x-z\|^2\\&\quad-\lambda(2-\lambda)\frac{r_i^2}{\|\mathbf a_i\|^2}.\end{aligned}$$
Thus distances to every solution decrease or stay fixed. Summing this identity makes successive corrections tend to zero; cyclic visitation then makes every row residual tend to zero. Boundedness gives a solution cluster point, and the same distance identity forces convergence to it. Every correction lies in the row space, so the null-space component of the start is preserved: the limit is its closest solution. For mutually orthogonal independent rows, $\lambda=1$ reaches that solution in one complete pass, not one row step. Row order and angles affect speed; no filter or positivity projection is used here. The projection definition (ladr 6.55) gives the normal-line component explicitly: projecting $x-z$ onto $\operatorname{span}(a_i)$ gives $[a_i\cdot(x-z)/\|a_i\|^2]a_i$ for any solution $z$ of that row. Subtracting this component at $\lambda=1$ leaves a vector perpendicular to $a_i$, hence a point on the row hyperplane. This proves that one ART step projects onto one equation; it does not solve all rows at once.`,
      caption: String.raw`**Left:** drag the green noise-free reference and gold start; the three equations coincide at the reference only when noise is zero. The complete relaxed path and equation lines remain in view, including overrelaxed excursions. **Image:** a chosen synthetic 24×24 phantom, with 18 views and 36 point rays per view. The sweep slider selects one of 21 stored images (zero start through 20 sweeps); the error curve measures unwindowed RMS distance to the planted phantom. The reported best sweep is only the best of this finite experiment. Noise is seeded additive Gaussian data error, not patient measurements.`,
      deps: ['imaging-3.1', 'ladr-6.55'],
      tags: ['ART', 'Kaczmarz', 'iterative reconstruction'],
      refs: ['Kak–Slaney §7.1, pp.276–282, Eqs.4–12', 'Censor–Eggermont–Gordon (1983), §§1–3'],
      credit: 'Algorithm presentation: Kak & Slaney, chapter 7; relaxed/inconsistent analysis: Censor, Eggermont & Gordon (1983)',
      verify: false,
      scope: String.raw`Chosen piecewise-constant pixels on $[-1,1]^2$ and exact line/pixel intersection lengths (up to floating-point arithmetic); no ray marching, bilinear basis, finite beam width or clinical acquisition. The same discrete matrix creates the noise-free data and reconstructs them: consistency does not imply a unique image or exact recovery of the planted phantom. Empty rays are skipped; any noise on them cannot be fitted. Image noise has standard deviation (noise control) × mean noiseless ray sum, with fixed seed11. The left panel instead uses a fixed three-component perturbation scaled by 40 × that control. Image display clips to $[-.05,.45]$; RMS calculations do not. The consistent-system proof above is exact finite-dimensional mathematics; finite pictures do not prove convergence.`,
      viz(v) {
        const P = problem();
        const L = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: true, height: 300, title: 'Two unknowns, three equations', minWidth: 250 });
        const A = v.stage({ x: [0, NS], y: [0, NS], equal: true, axes: false, height: 300, title: 'Image after $k$ sweeps', minWidth: 220 });
        const Ce = v.stage({ x: [0, 20], y: [0, 0.2], axes: 'box', gutter: true, height: 300, xlabel: 'sweeps', ylabel: 'RMS error', title: 'Error against sweeps', minWidth: 220 });
        const geo = v.select('equation angles', [{ value: 'spread', label: 'well separated' }, { value: 'near', label: 'nearly parallel' }], 'spread');
        const steps = v.slider('projections performed', 0, 36, 9, { step: 1, int: true });
        const lam = v.slider('relaxation $\\lambda$', 0.1, 1.9, 1, { step: 0.05 });
        const nz = v.slider('data noise', 0, 0.15, 0.02, { step: 0.005 });
        const sw = v.slider('sweeps $k$', 0, 20, 5, { step: 1, int: true });
        const ord = v.select('ray order (image)', [{ value: 'spread', label: 'spread-out views' }, { value: 'seq', label: 'view by view' }], 'spread');
        const hT = L.handle(0.8, 0.6, { color: 'green', r: 8 }), h0 = L.handle(-1.6, -1.4, { color: 'gold', r: 8 });
        const ANG = { spread: [20, 80, 140], near: [20, 38, 56] }, E0 = [0.5, -0.4, 0.35];
        let hist = null, hkey = '';
        const histOf = (l, n, o) => {
          const k = `${l}|${n}|${o}`; if (k === hkey) return hist;
          hkey = k; const b = noisy(P.b0, n, 11), x = new Float64Array(NS * NS), snaps = [Float64Array.from(x)], errs = [rmse(x, P.x0)];
          for (let i = 1; i <= 20; i++) { artSweep(P.sys, b, x, l, o === 'spread' ? P.order : P.seq); snaps.push(Float64Array.from(x)); errs.push(rmse(x, P.x0)); }
          hist = { snaps, errs }; return hist;
        };
        let st = null;
        v.render(() => {
          // --- 2-D Kaczmarz
          const al = ANG[geo.value].map((d) => (d * PI) / 180), nrm = al.map((a) => [Math.cos(a), Math.sin(a)]);
          const bb = nrm.map((n, i) => n[0] * hT.x + n[1] * hT.y + 40 * nz.value * E0[i] * 1.0);
          const cols = ['accent', 'orange', 'purple'];
          const path = kaczmarzPathAudit(nrm, bb, [h0.x, h0.y], steps.value, lam.value), x = path[path.length - 1];
          const bounds = squareExtentAudit([...path, [hT.x, hT.y], ...nrm.map((n, i) => n.map(q => q * bb[i]))]);
          L.setView(bounds.x, bounds.y);
          nrm.forEach((n, i) => { const ends = equationSegmentAudit(n, bb[i], bounds); if (ends) L.segment(ends[0], ends[1], { color: cols[i], width: 2 }); });
          L.path(path, { color: 'gold', width: 1.8 });
          L.dots(path, { r: 3, color: 'gold' });
          L.dot(x[0], x[1], { r: 5, color: 'red' });
          // --- image
          const H = histOf(lam.value, nz.value, ord.value), k = sw.value;
          showImage(A, H.snaps[k], NS, NS, { lo: -0.05, hi: 0.45, id: 'art', extra: `${hkey}|${k}`, smooth: true }); frame(A, NS, NS);
          Ce.setView([0, 20], [0, Math.max(0.1, Math.max(...H.errs) * 1.1)]);
          Ce.path(H.errs.map((e, i) => [i, e]), { color: 'accent', width: 2.4 }); Ce.dots(H.errs.map((e, i) => [i, e]), { r: 3, color: 'accent' });
          Ce.dot(k, H.errs[k], { r: 7, color: 'gold' });
          st = { d: Math.hypot(x[0] - hT.x, x[1] - hT.y), e: H.errs[k], emin: Math.min(...H.errs), kmin: H.errs.indexOf(Math.min(...H.errs)), path };
        });
        v.legend([['accent', 'equation 1 / error'], ['orange', 'equation 2'], ['purple', 'equation 3'], ['gold', 'start / ART path'], ['green', 'noise-free reference']]);
        v.readout(() => st ? `Two unknowns: distance to the noise-free reference after ${steps.value} row steps is $${fx(st.d, 3)}$. ${nz.value === 0 ? 'The consistent-system distance cannot increase for these relaxation values.' : 'Perturbed equations need not pass through the reference; no monotone-distance guarantee applies.'}\nImage: after ${sw.value} sweeps RMS error $${fx(st.e, 4)}$; best among stored sweeps 0–20 is $${st.kmin}$ with $${fx(st.emin, 4)}$. ${P.sys.rows.filter(r => r.ss === 0).length} empty rays are skipped. Seed11; no positivity projection; display saturation only.` : '');
      },
    },

    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Algorithm',
      name: 'SIRT and SART',
      statement: String.raw`For a nonnegative matrix $A$, define positive row sums $r_i=\sum_j a_{ij}$ and column sums $c_j=\sum_i a_{ij}$. This **normalized SIRT** variant updates all rays together:
$$\mu^{(k+1)}=\mu^{(k)}+\lambda C A^T R(b-A\mu^{(k)}),\qquad R_{ii}=1/r_i,\quad C_{jj}=1/c_j.$$
Zero rows are omitted and unobserved columns are held fixed. For fixed $0<\lambda<2$, the observed components converge to a minimizer of $\|R^{1/2}(A\mu-b)\|^2$, closest to the start in the $C^{-1}$ norm. This is **weighted**, generally not ordinary, least squares. **SART** applies the same normalized formula to one view at a time, recomputing column sums within each view. A sweep visits every view. Neither averaging nor convergence to least squares guarantees removal of noise or a universal speed ranking.`,
      idea: String.raw`The normalization gives a direct convergence proof for the stated SIRT variant. Set $B=R^{1/2}AC^{1/2}$ and $y=C^{-1/2}\mu$. Weighted Cauchy–Schwarz yields
$$\|Bz\|^2\le\sum_i\sum_j a_{ij}z_j^2/c_j=\|z\|^2.$$
The update becomes $y^+=y+\lambda B^T(R^{1/2}b-By)$. Each positive singular mode contracts by $1-\lambda\sigma^2\in(-1,1)$, while null components remain fixed, proving the weighted least-squares claim. Small singular values make some modes slow and can amplify noise in the limit. SART's view blocks use updated images between views; this SIRT proof does not assert that an inconsistent cyclic SART run has the same limit. Kak–Slaney Eq.32 supplies the view-wise normalization, but the illustration deliberately omits their bilinear basis and longitudinal Hamming weighting. The singular value decomposition (ladr 7.70) supplies the orthonormal input/output modes of the normalized matrix $B$. Its right singular vector of positive singular value $\sigma$ is an eigenvector of $B^TB$ with eigenvalue $\sigma^2$, so the corresponding SIRT error coefficient is multiplied by $1-\lambda\sigma^2$. Together with the proved bound $\|B\|\le1$, this contracts every observed mode for $0<\lambda<2$ while preserving null-space components; it makes no corresponding convergence claim for inconsistent view-wise SART.`,
      caption: String.raw`All three methods reconstruct the same chosen 24×24 phantom from the same 18-view, 36-ray-per-view matrix and one common seeded noise realization. One displayed iteration means one complete ART ray sweep, one all-ray SIRT update, or one 18-view SART sweep; these are not identical computational work units. Compare the measured RMS curves as noise and relaxation change. Each reported best iterate is restricted to the displayed 1–30 range, not a theoretical stopping rule. No method's error is guaranteed to turn upward or decrease monotonically.`,
      deps: ['imaging-3.11', 'ladr-7.70'],
      tags: ['SIRT', 'SART', 'iterative reconstruction'],
      refs: ['Kak–Slaney §7.3, p.284', 'Kak–Slaney §7.4, pp.285–292, especially Eq.32'],
      credit: 'Algorithm presentations and view-block normalization: Kak & Slaney, chapter 7; SIRT convergence follows the explicit singular-mode proof above',
      verify: false,
      scope: String.raw`Same exact point-ray/piecewise-constant discrete operator as 3.11; seed5 is fixed, and Gaussian standard deviation is the noise control times the mean noiseless ray sum. Zero rows and unobserved pixels contribute no update. No nonnegativity constraint, regularization penalty, bilinear ray model or longitudinal window is applied. Images deliberately saturate outside $[-.05,.45]$, but RMS uses unwindowed values. Error curves assess this phantom and finite run, not clinical quality, general algorithm ordering, or a proof of semi-convergence.`,
      viz(v) {
        const P = problem();
        const it = v.slider('iterations $k$', 1, 30, 6, { step: 1, int: true });
        const nz = v.slider('data noise', 0, 0.15, 0.03, { step: 0.005 });
        const lam = v.slider('relaxation $\\lambda$', 0.2, 1.5, 1, { step: 0.05 });
        const mk = (t) => v.stage({ x: [0, NS], y: [0, NS], equal: true, axes: false, height: 220, title: t, minWidth: 170 });
        const SA = mk('ART'), SS = mk('SIRT'), SR = mk('SART');
        const Ce = v.stage({ x: [0, 30], y: [0, 0.15], axes: 'box', gutter: true, height: 260, xlabel: 'iteration (sweep)', ylabel: 'RMS error', title: 'Error against iteration', minWidth: 260 });
        let H = null, key = '';
        const compute = () => {
          const k = `${nz.value}|${lam.value}`; if (k === key) return; key = k;
          const b = noisy(P.b0, nz.value, 5), out = { art: [], sirt: [], sart: [] }, errs = { art: [], sirt: [], sart: [] };
          const xa = new Float64Array(NS * NS), xs = new Float64Array(NS * NS), xr = new Float64Array(NS * NS), cache = {}, views = Array.from({ length: P.sys.nA }, (_, i) => (i * 7) % P.sys.nA);
          for (let i = 1; i <= 30; i++) {
            artSweep(P.sys, b, xa, lam.value, P.order); sirtStep(P.sys, b, xs, lam.value, cache); sartSweep(P.sys, b, xr, lam.value, views);
            out.art.push(Float64Array.from(xa)); out.sirt.push(Float64Array.from(xs)); out.sart.push(Float64Array.from(xr));
            errs.art.push(rmse(xa, P.x0)); errs.sirt.push(rmse(xs, P.x0)); errs.sart.push(rmse(xr, P.x0));
          }
          H = { out, errs };
        };
        let st = null;
        v.render(() => {
          compute(); const k = it.value - 1;
          for (const [S, a] of [[SA, 'art'], [SS, 'sirt'], [SR, 'sart']]) { showImage(S, H.out[a][k], NS, NS, { lo: -0.05, hi: 0.45, id: a, extra: `${key}|${k}`, smooth: true }); frame(S, NS, NS); }
          Ce.setView([0, 30], [0, Math.max(0.1, ...H.errs.art, ...H.errs.sirt, ...H.errs.sart) * 1.05]);
          const col = { art: 'red', sirt: 'accent', sart: 'green' };
          for (const a of ['art', 'sirt', 'sart']) { Ce.path(H.errs[a].map((e, i) => [i + 1, e]), { color: col[a], width: 2.2 }); Ce.dot(it.value, H.errs[a][k], { r: 6, color: col[a] }); }
          st = { e: ['art', 'sirt', 'sart'].map((a) => H.errs[a][k]), best: ['art', 'sirt', 'sart'].map((a) => { const m = Math.min(...H.errs[a]); return [m, H.errs[a].indexOf(m) + 1]; }) };
        });
        v.legend([['red', 'ART'], ['accent', 'SIRT'], ['green', 'SART']]);
        v.readout(() => st ? `Iteration ${it.value}: RMS error ART $${fx(st.e[0], 4)}$, SIRT $${fx(st.e[1], 4)}$, SART $${fx(st.e[2], 4)}$.\nBest among stored iterations 1–30: ART $${fx(st.best[0][0], 4)}$ (at ${st.best[0][1]}), SIRT $${fx(st.best[1][0], 4)}$ (at ${st.best[1][1]}), SART $${fx(st.best[2][0], 4)}$ (at ${st.best[2][1]}). (Phantom RMS $${fx(rms(P.x0), 3)}$; seed5, no positivity projection; display saturation only.)` : '');
      },
    },

    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Concept',
      name: 'Hounsfield units',
      statement: String.raw`CT images are displayed in **Hounsfield units** (HU), a linear rescaling of the reconstructed attenuation coefficient fixed by two reference materials:
$$\mathrm{HU}=1000\,\frac{\mu-\mu_{\rm water}}{\mu_{\rm water}-\mu_{\rm air}}\;\approx\;1000\Big(\frac{\mu}{\mu_{\rm water}}-1\Big).$$
Water is $0$ HU, air $-1000$ HU, and a change of one unit is about $0.1\%$ of the attenuation coefficient of water. Typical values: fat $\approx-100$, soft tissue $+20$ to $+60$, cancellous bone $+300$ to $+400$, cortical bone $+500$ to $+1900$. A **window** (level $\ell$ and width $w$) maps the HU range $[\ell-w/2,\ell+w/2]$ linearly onto the display's grey levels, clipping everything outside, so a screen of 256 grey levels can show small soft-tissue differences or the wide range from lung to bone, but not both.`,
      idea: String.raw`The scanner reconstructs a number proportional to $\mu$ at its effective photon energy (imaging-2.3); expressing it relative to water makes numbers reproducible between scanners and almost independent of the unknown overall scale. The numbers depend on the beam energy, because $\mu/\rho$ of bone and tissue varies with energy differently from water's (photoelectric versus Compton, imaging-2.4): HU of bone changes by several hundred between 80 and 140 kVp, soft tissue by a few. Windowing is needed because the eye can distinguish only some tens of grey levels at once while the data span about 3000 HU.`,
      caption: String.raw`A thorax slice (a synthetic phantom with textbook HU values plus noise of about 8 HU). Choose a **window preset** or set the **level and width**: the lung window shows vessels and the nodule in lung, the soft-tissue window the heart and the nodule's edge but the lungs go black, the bone window the vertebra. The histogram shows where the window sits on the HU axis; the transfer function shows how HU map to grey. The last panel is the energy dependence of HU for bone and tissue in the attenuation model of 2.3.`,
      deps: ['imaging-2.3'],
      tags: ['Hounsfield units', 'windowing', 'CT number'],
      refs: ['Prince–Links ch. 6'],
      credit: 'G. N. Hounsfield, 1970s (the scale named after him)',
      scope: String.raw`Typical value ranges are approximate and vary with the scanner, tube voltage, contrast and individual (ranges as listed on the Hounsfield-scale reference tables, e.g. lung $-700$ to $-600$, fat $-120$ to $-90$, grey matter $+37$ to $+45$, white matter $+20$ to $+30$). The thorax is synthetic. The energy panel is a model (photoelectric power law + Klein–Nishina, imaging-2.4), not measured data.`,
      viz(v) {
        const Wp = 128;
        // painter's list: [HU, a, b, cx, cy] later overrides earlier
        const PAINT = [
          [-100, 0.92, 0.68, 0, 0], [45, 0.86, 0.62, 0, 0],
          [-760, 0.3, 0.42, -0.4, 0.05], [-760, 0.3, 0.42, 0.4, 0.05],
          [45, 0.2, 0.22, -0.06, -0.02], [60, 0.06, 0.06, 0.08, -0.32],
          [900, 0.15, 0.12, 0, -0.5], [330, 0.1, 0.08, 0, -0.5],
          [-1000, 0.04, 0.05, 0, 0.3],
          [30, 0.055, 0.055, -0.42, 0.18],
          [700, 0.05, 0.03, -0.72, 0.2], [700, 0.05, 0.03, 0.72, 0.2], [700, 0.05, 0.03, -0.74, -0.1], [700, 0.05, 0.03, 0.74, -0.1], [700, 0.05, 0.03, -0.6, -0.4], [700, 0.05, 0.03, 0.6, -0.4],
        ];
        const r = rng32(21);
        const body = new Uint8Array(Wp * Wp), hu = new Float64Array(Wp * Wp);
        for (let j = 0; j < Wp; j++) for (let i = 0; i < Wp; i++) {
          const x = -1 + ((i + 0.5) * 2) / Wp, y = 1 - ((j + 0.5) * 2) / Wp; let val = -1000, inb = 0;
          for (const [h, a, b, cx, cy] of PAINT) if (((x - cx) / a) ** 2 + ((y - cy) / b) ** 2 <= 1) { val = h; if (h !== -1000 || inb) inb = 1; }
          if (((x / 0.92) ** 2 + (y / 0.68) ** 2) <= 1) inb = 1;
          hu[j * Wp + i] = val === -1000 && !inb ? -1000 + gauss(r) * 2 : val + gauss(r) * (val < -900 ? 6 : 8); body[j * Wp + i] = inb;
        }
        const A = v.stage({ x: [0, Wp], y: [0, Wp], equal: true, axes: false, height: 300, title: 'Thorax slice (HU)', minWidth: 230 });
        const T = v.stage({ x: [-1100, 1500], y: [0, 255], axes: 'box', gutter: true, height: 300, xlabel: 'HU', ylabel: 'grey level', title: 'Window transfer function', minWidth: 230 });
        const Hh = v.stage({ x: [-1100, 1500], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'HU', ylabel: '√(pixel count)', title: 'Histogram of the body', minWidth: 230 });
        const En = v.stage({ x: [60, 140], y: [0, 2200], axes: 'box', gutter: true, height: 300, xlabel: 'photon energy (keV)', ylabel: 'HU (model)', title: 'HU depends on beam energy', minWidth: 230 });
        const lev = v.slider('window level (HU)', -800, 1000, 40, { step: 5, int: true, onChange: () => { pre.value = 'custom'; } });
        const wid = v.slider('window width (HU)', 20, 3000, 400, { step: 10, int: true, onChange: () => { pre.value = 'custom'; } });
        const PRE = { soft: [40, 400], lung: [-600, 1500], bone: [400, 1800], brain: [40, 80], wide: [0, 2000] };
        const pre = v.select('preset', [{ value: 'soft', label: 'soft tissue' }, { value: 'lung', label: 'lung' }, { value: 'bone', label: 'bone' }, { value: 'brain', label: 'brain' }, { value: 'wide', label: 'wide' }, { value: 'custom', label: 'custom' }], 'soft', { onChange: (k) => { if (PRE[k]) { lev.set(PRE[k][0]); wid.set(PRE[k][1]); } } });
        const en = v.slider('beam energy (keV)', 60, 140, 70, { step: 1, int: true });
        const bins = 100, edges = lin(-1100, 1500, bins + 1), counts = new Float64Array(bins);
        for (let i = 0; i < hu.length; i++) if (body[i]) { const b = Math.floor(((hu[i] + 1100) / 2600) * bins); if (b >= 0 && b < bins) counts[b]++; }
        const sq = counts.map(Math.sqrt), sqmax = Math.max(...sq);
        const huOf = (m, E) => 1000 * (mu(m, E) / mu(MATS.water, E) - 1);
        const marks = [['fat', -100], ['water', 0], ['soft tissue', 45], ['cancellous', 330], ['cortical', 900], ['lung', -760]];
        let st = null;
        v.render(() => {
          const lo = lev.value - wid.value / 2, hi = lev.value + wid.value / 2;
          A.raster((x, y) => {
            const i = Math.floor(x), j = Wp - 1 - Math.floor(y); if (i < 0 || i >= Wp || j < 0 || j >= Wp) return null;
            const c = Math.round(255 * clamp((hu[j * Wp + i] - lo) / (hi - lo), 0, 1)); return [c, c, c];
          }, { res: 1, id: 'hu', key: `${lo}|${hi}` }); frame(A, Wp, Wp);
          T.path([[-1100, 0], [lo, 0], [hi, 255], [1500, 255]], { color: 'accent', width: 2.6 });
          T.vband(lo, hi, { color: 'gold', alpha: 0.12 });
          Hh.vband(lo, hi, { color: 'gold', alpha: 0.15 });
          for (let b = 0; b < bins; b++) Hh.rect(edges[b], 0, edges[b + 1], sq[b] / sqmax, { fill: 'accent', fillAlpha: 0.5, stroke: false });
          marks.forEach(([nm, h], i) => { Hh.vline(h, { color: 'faint', dash: true, width: 1 }); Hh.text(nm, h, 0.97 - 0.075 * (i % 6), { size: 11, color: 'muted', align: 'center' }); });
          Hh.vline(lo, { color: 'gold', width: 1.5 }); Hh.vline(hi, { color: 'gold', width: 1.5 });
          const bone = (E) => huOf(MATS.bone, E), tis = (E) => huOf(MATS.tissue, E);
          En.fn(bone, { color: 'orange', width: 2.4, n: 100 }); En.fn(tis, { color: 'accent', width: 2.4, n: 100 }); En.hline(0, { color: 'muted', width: 1.2, dash: true });
          En.vline(en.value, { color: 'gold', width: 1.5 }); En.dot(en.value, bone(en.value), { r: 6, color: 'orange' }); En.dot(en.value, tis(en.value), { r: 6, color: 'accent' });
          En.setView([60, 140], [-100, bone(60) * 1.08]);
          st = { lo, hi, E: en.value, b: bone(en.value), t: tis(en.value), mw: mu(MATS.water, en.value) };
        });
        v.legend([['accent', 'transfer / histogram / soft tissue'], ['orange', 'cortical bone (model)'], ['gold', 'window']]);
        v.readout(() => st ? `Window ${fx(st.lo, 0)} to ${fx(st.hi, 0)} HU: everything below is black and above is white; the grey scale then spans ${fx(st.hi - st.lo, 0)} HU, i.e. one grey level ≈ ${fx((st.hi - st.lo) / 255, 1)} HU.\nAt ${st.E} keV the model has $\\mu_{\\rm water}=${fx(st.mw, 3)}$ cm$^{-1}$, so 1 HU = ${fx(st.mw / 1000, 5)} cm$^{-1}$; cortical bone ${fx(st.b, 0)} HU, soft tissue ${fx(st.t, 0)} HU (model values; the table of typical values refers to ≈ 70–80 keV effective energy).` : '');
      },
    },

    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Phenomenon',
      name: 'CT artifacts: cupping and metal streaks',
      statement: String.raw`Filtered back-projection assumes that each projection value is an exact line integral, $p=\int\mu\,d\ell$ (imaging-3.1). A polychromatic beam violates this: the measured $p(L)=-\ln\!\big(\sum_E w(E)e^{-\mu(E)L}\big/\sum_Ew(E)\big)$ grows more slowly than linearly with the path length $L$ (beam hardening, imaging-2.5). Reconstructing such data gives (i) **cupping**: a uniform water cylinder appears darker in its centre, where paths are longest, than near its edge; and (ii) **streaks and dark bands** between and around dense objects such as metal implants, where the path-dependent error is largest and varies strongly with the view angle; photon starvation adds noise streaks along the longest metal paths.`,
      idea: String.raw`The reconstruction is linear in the projections but the projections are a concave function of the true line integral. A ray through the middle of the cylinder is under-measured by more than one through the edge, so the central $\mu$ is under-estimated, giving a cup-shaped profile. For metal, $p(L)$ saturates so strongly that the sinogram is inconsistent between views: no image has these Radon transforms (the consistency conditions of the transform, imaging-3.2, are violated) and the filter spreads the discrepancy along the rays as streaks. A water-based linearisation of $p$ removes cupping in a water-like object but cannot repair the metal paths.`,
      caption: String.raw`A water cylinder (radius from the slider) imaged at the chosen **tube voltage**, with an optional **metal** implant(s), reconstructed by FBP and shown in HU. The profile panel compares the middle row for the polychromatic data (cupped) with the ideal value (0 HU, the calibration of an 8 cm water phantom). Turn on **beam-hardening correction** (a water linearisation of $p$) to flatten the cup; with metal present the streaks stay, and **photon starvation noise** makes them worse. The right panel shows why: $p(L)$ for water bends below the straight line $\mu L$.`,
      deps: ['imaging-3.7', 'imaging-2.5'],
      tags: ['cupping', 'metal artifact', 'beam hardening'],
      refs: ['Prince–Links ch. 6'],
      scope: String.raw`Model: tungsten-anode spectrum and energy-integrating detector (imaging-2.1), attenuation by the photon-interaction model of chapter 2 (≈10–30% accurate), 140 detector elements, 180 views, water cylinder (centred) and copper rods standing in for steel or titanium implants; no scatter, no partial-volume or motion effects. Cupping amplitudes depend on size, filtration and calibration, so read them as qualitative.`,
      viz(v) {
        const Wp = 96, nA = 180, nd = 140, RFOV = 18;
        const kv = v.slider('tube voltage (kVp)', 70, 140, 100, { step: 5, int: true });
        const Rs = v.slider('cylinder radius (cm)', 5, 16, 12, { step: 0.5 });
        const metal = v.select('metal', [{ value: 'none', label: 'none' }, { value: 'one', label: 'one rod' }, { value: 'two', label: 'two rods' }], 'none');
        const corr = v.toggle('beam-hardening correction', false);
        const noiseT = v.toggle('photon starvation noise', false);
        const A = v.stage({ x: [0, Wp], y: [0, Wp], equal: true, axes: false, height: 290, title: 'Reconstruction (HU, window ±150; 8 cm water = 0)', minWidth: 230 });
        const Pf = v.stage({ x: [-RFOV, RFOV], y: [-250, 150], axes: 'box', gutter: true, height: 290, xlabel: 'position along the middle row (cm)', ylabel: 'HU', title: 'Profile', minWidth: 240 });
        const Cv = v.stage({ x: [0, 40], y: [0, 6], axes: 'box', gutter: true, height: 290, xlabel: 'water thickness $L$ (cm)', ylabel: '$p(L)$', title: 'Measured log-attenuation', minWidth: 230 });
        const sc = makeScan(nA, nd, 1.0), r = rng32(5), { u: U, z: Z } = noiseField(v.M, r, nA * nd);
        const cache = {};
        const setup = (kVp) => {
          if (cache[kVp]) return cache[kVp];
          const sp = tubeSpectrum(kVp, 'W', 2.5), Es = [], w = [];
          for (let i = 0; i < sp.E.length; i += 16) if (sp.E[i] > 15 && sp.E[i] < kVp && sp.N[i] > 0) { Es.push(sp.E[i]); w.push(sp.N[i] * sp.E[i]); }
          const sw = w.reduce((a, b) => a + b, 0), wn = w.map((x) => x / sw);
          const muW = Es.map((e) => mu(MATS.water, e)), muC = Es.map((e) => mu(MATS.copper, e));
          const pw = (L) => -Math.log(wn.reduce((s, x, i) => s + x * Math.exp(-muW[i] * L), 0));
          const mueff = pw(8) / 8; // water calibration: an 8 cm water phantom reads 0 HU
          const Ls = lin(0, 45, 181), ps = Ls.map(pw);
          const invp = (p) => { let lo = 0, hi = ps.length - 1; if (p <= 0) return p / mueff; if (p >= ps[hi]) return Ls[hi]; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ps[m] <= p) lo = m; else hi = m; } return Ls[lo] + ((p - ps[lo]) / (ps[hi] - ps[lo])) * (Ls[hi] - Ls[lo]); };
          return (cache[kVp] = { Es, wn, muW, muC, mueff, pw, invp });
        };
        let res = null, rkey = '';
        const run = () => {
          const key = `${kv.value}|${Rs.value}|${metal.value}|${corr.value}|${noiseT.value}`; if (key === rkey) return; rkey = key;
          const S = setup(kv.value), rho = Rs.value / RFOV, rods = metal.value === 'none' ? [] : metal.value === 'one' ? [[0.4 * rho, 0.0]] : [[-0.5 * rho, 0.0], [0.5 * rho, 0.0]], rr = 1.5 / RFOV;
          const sino = new Float64Array(nA * nd);
          for (let k = 0; k < nA; k++) for (let j = 0; j < nd; j++) {
            const s = sc.sOf(j), th = sc.th[k]; let Lw = 0, Lm = 0;
            const t = s; if (t * t < rho * rho) Lw = 2 * Math.sqrt(rho * rho - t * t);
            for (const [cx, cy] of rods) { const tt = s - (cx * Math.cos(th) + cy * Math.sin(th)); if (tt * tt < rr * rr) { const c = 2 * Math.sqrt(rr * rr - tt * tt); Lm += c; Lw -= c; } }
            Lw = Math.max(0, Lw) * RFOV; Lm *= RFOV;
            let tr = 0; for (let e = 0; e < S.Es.length; e++) tr += S.wn[e] * Math.exp(-S.muW[e] * Lw - S.muC[e] * Lm);
            if (noiseT.value) { const I0 = 3e5, N = poissonFrom(I0 * tr, U[k * nd + j], Z[k * nd + j]); tr = Math.max(N, 0.5) / I0; }
            let p = -Math.log(tr);
            if (corr.value) p = S.mueff * S.invp(p);
            sino[k * nd + j] = p;
          }
          const img = fbp(sino, sc, Wp, Wp, 'hann', 0.9).map((x) => 1000 * (x / RFOV / S.mueff - 1));
          res = { img, S, rho, Rs: Rs.value };
        };
        let st = null;
        v.render(() => {
          run();
          showImage(A, res.img, Wp, Wp, { lo: -150, hi: 150, id: 'ct', extra: rkey, smooth: true }); frame(A, Wp, Wp);
          const row = Wp / 2 - 1, xs = Array.from({ length: Wp }, (_, i) => -RFOV + ((i + 0.5) * 2 * RFOV) / Wp);
          const inside = xs.map((x) => Math.abs(x) < res.Rs - 0.6);
          Pf.hline(0, { color: 'green', width: 1.8, dash: true });
          Pf.path(xs.map((x, i) => [x, clamp(0.5 * (res.img[row * Wp + i] + res.img[(row + 1) * Wp + i]), -400, 400)]).filter((_, i) => Math.abs(xs[i]) < res.Rs - 0.4), { color: 'accent', width: 2.4 });
          const c = mean([...xs.keys()].filter((i) => Math.abs(xs[i]) < 1.5 && metal.value === 'none').map((i) => res.img[row * Wp + i])), e = mean([...xs.keys()].filter((i) => Math.abs(xs[i] - (res.Rs - 1.6)) < 0.5).map((i) => res.img[row * Wp + i]));
          const Lmax = 40; Cv.fn((L) => res.S.pw(L), { color: 'accent', width: 2.4, domain: [0, Lmax], n: 100 }); Cv.fn((L) => res.S.mueff * L, { color: 'green', width: 1.8, dash: true, domain: [0, Lmax] });
          Cv.vline(2 * res.Rs, { color: 'gold', dash: true, width: 1.2 });
          st = { c, e, L: 2 * res.Rs, pdev: 1 - res.S.pw(2 * res.Rs) / (res.S.mueff * 2 * res.Rs) };
          void inside;
        });
        v.legend([['accent', 'measured / reconstructed'], ['green', 'ideal linear', { dash: true }], ['gold', 'diameter', { dash: true }]]);
        v.readout(() => st ? `${kv.value} kVp, diameter ${fx(st.L, 0)} cm: the log-attenuation through the full diameter is ${fx(100 * st.pdev, 1)}% below the straight line $\\mu_{\\rm eff}L$.\n${metal.value === 'none' ? `Reconstructed centre ${fx(st.c, 0)} HU, near the edge ${fx(st.e, 0)} HU: cupping of ${fx(st.e - st.c, 0)} HU${corr.value ? ' after the water correction' : ''}.` : 'Metal: the centre value is not meaningful; look for dark bands between the rods and bright/dark streaks along their common tangents.'}` : '');
      },
    },
  ],
};
