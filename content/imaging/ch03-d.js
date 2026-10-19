// Medical Imaging — Chapter 3 (part 4): 3.15 Feldkamp cone-beam reconstruction, 3.16 Fourier diffraction theorem,
// 3.17 Cormack 1963 (paper), 3.18 Hounsfield 1973 (paper).
import {
  clamp, fx, mean, sd, showImage, frame, raster, ellAt, ellProj, ellFT, slEllipses, makeScan, sinoEll, fbp, fbpAt, fft2d, rmse, rms,
  ellipsoidAt, fdk, rng32, gauss, noiseField, poissonFrom, MATS, mu,
} from './ch03.shared.js';
import { diffractionLocusAudit, diffractionGridAudit } from './source-audit-diffraction.shared.js';
import { CORMACK1963_AUDIT, cormackMuAudit, cormackProjectionAudit, cormackExactJAudit, cormackBeamAudit, cormackJAudit } from './source-audit-cormack.shared.js';

const PI = Math.PI;
const lin = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

export default {
  collection: 'imaging',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Algorithm',
      name: 'Cone-beam reconstruction (Feldkamp)',
      statement: String.raw`In cone-beam CT a point source and a flat 2-D detector rotate on a circle around the object, so each view samples a whole cone of rays. The **Feldkamp–Davis–Kress (FDK) algorithm** treats each detector row as a fan-beam projection: (i) weight the data $P(u,v)$ by $D/\sqrt{D^2+u^2+v^2}$ ($D$ = source–axis distance, $(u,v)$ detector coordinates scaled to the axis); (ii) apply the ramp filter along $u$; (iii) back-project into the volume with the distance weight $D^2/(D-t)^2$, where $t$ is the voxel's coordinate along the central ray. In the plane of the circle ($v=0$) this is exactly fan-beam FBP and is exact; away from it the result is approximate, with errors that grow with the cone angle, because the circular orbit does not satisfy Tuy's data-sufficiency condition (every plane through the object must meet the orbit).`,
      idea: String.raw`FDK is the fan-beam formula (imaging-3.9) applied row by row with the extra obliquity weight that accounts for each ray's tilt out of the mid-plane, and with the back-projection geometry in 3-D. It reduces exactly to 3.9 on the central plane, and for objects that vary slowly in $z$ the error is second order in the cone angle. For objects with fine $z$-structure, the missing data (a circle gives for an off-plane point only planes through the source circle's tangents) produce intensity drop and distortion away from mid-plane.`,
      caption: String.raw`The phantom is a stack of thin discs (a Defrise-type test object, which has strong $z$-variation). Drag **source distance** $D$: with a large $D$ the cone is narrow and the whole stack is recovered; with a small $D$ the off-centre discs lose intensity and blur into each other. The coronal slices (truth left, FDK right), the axial slice at the chosen $z$ and the error-versus-height plot (peak at the outer discs) show where the algorithm fails; the mid-plane error stays low.`,
      deps: ['imaging-3.9'],
      tags: ['cone beam', 'FDK', 'Tuy condition'],
      refs: ['Kak–Slaney §3.6'],
      credit: 'L. A. Feldkamp, L. C. Davis & J. W. Kress, 1984',
      scope: String.raw`Circular orbit, flat detector, noise-free exact ellipsoid line integrals; 40³ voxels, 90 views, 56×56 detector elements. Larger errors in this coarse grid include discretisation of the thin discs (thickness about 3 voxels). The data-sufficiency condition is Tuy's (1983); a helical or dual-circle orbit satisfies it.`,
      viz(v) {
        const N = 40;
        const slabs = [-0.6, -0.3, 0, 0.3, 0.6].map((z) => [1, 0.62, 0.62, 0.09, 0, 0, z]);
        const Dsl = v.slider('source–axis distance $D$', 2.2, 16, 4, { log: true, sig: 2 });
        const zs = v.slider('axial slice height $z$', -0.9, 0.9, 0.3, { step: 0.05 });
        const mk = (t, w = 200) => v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 240, title: t, minWidth: w });
        const Ct = mk('Coronal slice $y=0$: truth', 170), Cr = mk('Coronal slice: FDK', 170), Ax = mk('Axial slice: FDK at $z$', 170);
        const Er = v.stage({ x: [-1, 1], y: [0, 0.4], axes: 'box', gutter: true, height: 240, xlabel: 'height $z$', ylabel: 'RMS error of the slice', title: 'Error against height', minWidth: 220 });
        const truthAt = (z) => raster((x, y) => ellipsoidAt(slabs, x, y, z), N, N, 1);
        const cor = new Float64Array(N * N);
        for (let k = 0; k < N; k++) { const z = -1 + ((k + 0.5) * 2) / N; for (let i = 0; i < N; i++) cor[(N - 1 - k) * N + i] = ellipsoidAt(slabs, -1 + ((i + 0.5) * 2) / N, 0.0001, z); }
        const cache = new Map(), truths = Array.from({ length: N }, (_, k) => truthAt(-1 + ((k + 0.5) * 2) / N));
        const get = (D) => {
          const key = D.toFixed(2); if (cache.has(key)) return cache.get(key);
          const { slices, out } = fdk(slabs, D, 90, 56, 56, 1.2, N);
          const rec = new Float64Array(N * N);
          for (let k = 0; k < N; k++) for (let i = 0; i < N; i++) rec[(N - 1 - k) * N + i] = out[k][(N / 2 - 1) * N + i] * 0.5 + out[k][(N / 2) * N + i] * 0.5;
          const err = out.map((o, k) => rmse(o, truths[k]));
          const R = { slices, out, rec, err }; if (cache.size > 6) cache.clear(); cache.set(key, R); return R;
        };
        let st = null;
        v.render(() => {
          const D = Dsl.value, R = get(D), z = zs.value, k = clamp(Math.floor(((z + 1) / 2) * N), 0, N - 1);
          showImage(Ct, cor, N, N, { lo: -0.1, hi: 1.1, id: 'ct' }); frame(Ct, N, N);
          showImage(Cr, R.rec, N, N, { lo: -0.1, hi: 1.1, id: 'cr', extra: D.toFixed(2) }); frame(Cr, N, N);
          Cr.hline(((z + 1) / 2) * N, { color: 'gold', width: 1.5 }); Ct.hline(((z + 1) / 2) * N, { color: 'gold', width: 1.5 });
          showImage(Ax, R.out[k], N, N, { lo: -0.1, hi: 1.1, id: 'ax', extra: `${D.toFixed(2)}|${k}` }); frame(Ax, N, N);
          const zsx = R.slices; Er.path(zsx.map((q, i) => [q, R.err[i]]), { color: 'accent', width: 2.4 });
          Er.vline(z, { color: 'gold', dash: true, width: 1.4 }); Er.dot(z, R.err[k], { r: 6, color: 'gold' });
          Er.setView([-1, 1], [0, Math.max(0.2, ...R.err) * 1.1]);
          st = { D, ang: (Math.atan(0.6 / D) * 180) / PI, e0: R.err[N / 2], eo: R.err[k], z, mid: R.out[Math.floor(N / 2)][(N / 2) * N + N / 2], top: R.out[Math.floor(((0.6 + 1) / 2) * N)][(N / 2) * N + N / 2] };
        });
        v.legend([['accent', 'error per axial slice'], ['gold', 'chosen $z$']]);
        v.readout(() => st ? `$D=${fx(st.D, 1)}$: the outermost disc (at $z=0.6$) is seen at a half-cone angle of about $${fx(st.ang, 1)}^\\circ$ from the mid-plane. Value reconstructed at the centre of the mid-plane disc $${fx(st.mid, 2)}$ and of the outermost disc (z = 0.6) $${fx(st.top, 2)}$ (truth 1).\nSlice RMS error at the mid-plane $${fx(st.e0, 3)}$; at $z=${fx(st.z, 2)}$: $${fx(st.eo, 3)}$.` : '');
      },
    },

    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16',
      kind: 'Theorem',
      name: 'Fourier diffraction theorem',
      statement: String.raw`Consider a scalar 2-D Helmholtz model (object invariant in the third direction), an incident plane wave along $+y$, and a compact scattering potential $o$. Under the **first Born approximation**, let $u_B$ be the linearized scattered field on a receiver line $y=\ell$ beyond the object. With outgoing Green function $G(\mathbf r)=\tfrac i4H_0^{(1)}(2\pi k_0|\mathbf r|)$, cycles/unit Fourier convention and $\kappa=\sqrt{k_0^2-q^2}$,
$$\widehat u_B(q,\ell)=\frac{i\,e^{2\pi i\kappa\ell}}{4\pi\kappa}\,F(q,\kappa-k_0),\qquad |q|<k_0,\qquad F(\mathbf K)=\int o(\mathbf r)e^{-2\pi i\mathbf K\cdot\mathbf r}\,d\mathbf r.$$
Thus the **lateral Fourier transform of the receiver field**, after a known propagation/obliquity correction, samples $F$ at $\mathbf K=\mathbf k_s-\mathbf k_{\rm in}$. It is not the unprocessed receiver field itself. The forward propagating directions trace a semicircle of radius $k_0$ centred at $-\mathbf k_{\rm in}$; the grazing endpoints are limiting points. A continuous full turn of illumination covers the open disc $|\mathbf K|<\sqrt2 k_0$ (and its boundary as a limit).`,
      idea: String.raw`The Born field is $u_B(\mathbf r)=\int G(\mathbf r-\mathbf r')o(\mathbf r')e^{2\pi i k_0y'}\,d\mathbf r'$. On a receiver above the support, the outgoing angular spectrum of $G$ contributes $i e^{2\pi i\kappa(\ell-y')}/(4\pi\kappa)$ in lateral frequency $q$. Interchanging integrals leaves precisely $F(q,\kappa-k_0)$, proving the formula. The same construction rotates with the incident direction. At fixed transverse $q$, $\kappa-k_0=-q^2/(k_0+\kappa)\to0$ as $k_0\to\infty$, giving the straight-slice geometry on every fixed bounded frequency window. This is not a uniform flattening if the window grows in proportion to $k_0$. The cutoff inverse $1/(\sqrt2k_0)$ is a shortest-period scale, not a point-spread FWHM or a two-object resolution criterion.`,
      caption: String.raw`The chosen real phantom is a normalized weak-potential shape. Left: illustrative incident wavefronts and forward directions. Middle: the **continuous geometric loci** for the acquired illumination set; the gold locus is a movable probe and does not add data. Right: a finite approximation built from 65 exact synthetic, deweighted $F$ samples per illumination, nearest-cell gridding, explicit real-object conjugate completion and zero fill. Samples are evaluated at the actual arc points, not at grid-cell centres; unhit cells remain zero. **Straight slices** use the same chosen finite cutoff as a comparison, not an entire infinite-wavenumber experiment. Missing samples, cutoff and gridding errors all affect the picture.`,
      deps: ['imaging-3.4'],
      tags: ['diffraction tomography', 'Born approximation', 'Ewald circle'],
      refs: ['Kak–Slaney §6.2.1–6.2.2, pp.212–218', 'Kak–Slaney §6.3.1–6.3.3, pp.220–228, Eqs.92–126'],
      credit: 'Complete derivation and conventions: Kak & Slaney, chapter 6; angular frequencies converted to cycles/unit',
      verify: true,
      scope: String.raw`Scalar, weak single scattering, 2-D translation invariance and propagating transmission modes only; grazing and evanescent modes are excluded. The Born assumption is a small scattered perturbation, not an unconditional claim about the displayed contrast values. A physically small multiplier on the real potential is divided out for display. The Rytov variant would use incident field times the complex logarithmic perturbation, with phase unwrapping and different validity conditions; it is not raw scattered amplitude and is not simulated here. No wave-equation solution or experimental field is generated. A 64² inverse Fourier grid uses spacing0.5 cycles/unit, a symmetric circular numerical cutoff at most15.5, and no hole filling or analytic continuation. Blue data include the stated real-object symmetry; for complex potentials that completion is invalid. Grey levels clip outside $[-.05,1.05]$; RMS uses unwindowed pixels.`,
      viz(v) {
        const PH = slEllipses(.9), N = 64;
        const mode = v.select('data geometry', [{ value: 'wave', label: 'waves: arcs' }, { value: 'ray', label: 'straight slices: same cutoff' }], 'wave');
        const k0 = v.slider('wavenumber $k_0=1/\\lambda$ (cycles per unit)', 3, 14, 8, { step: .5 });
        const na = v.slider('number of illumination angles', 4, 120, 48, { step: 1, int: true });
        const range = v.slider('illumination range (°)', 60, 360, 360, { step: 10, int: true });
        const probe = v.slider('probe incident direction $\\varphi$ (°)', 0, 359, 30, { step: 1, int: true });
        const A = v.stage({ x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, axes: false, height: 270, title: 'Normalized shape / illustrative waves', minWidth: 220 });
        const Fk = v.stage({ x: [-16, 16], y: [-16, 16], equal: true, axes: 'box', gutter: true, height: 270, xlabel: '$K_x$', ylabel: '$K_y$', title: 'Geometric loci and sampled cells', minWidth: 230 });
        const Rc = v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 270, title: 'Gridded synthetic Fourier estimate', minWidth: 220 });
        const truth = raster((x, y) => ellAt(PH, x, y), N, N, 2); let cur = null, key = '';
        v.render(() => {
          const k = `${mode.value}|${k0.value}|${na.value}|${range.value}`;
          if (key !== k) { key = k; cur = diffractionGridAudit(PH, k0.value, na.value, range.value, mode.value); cur.err = rmse(cur.out, truth); }
          const phi = probe.value * PI / 180, c = Math.cos(phi), sn = Math.sin(phi), radius = cur.theoreticalRadius, extent = Math.max(16.8, radius * 1.08);
          Fk.setView([-extent, extent], [-extent, extent]);
          A.raster((x, y) => { if (Math.abs(x) >= 1 || Math.abs(y) >= 1) return null; const g = Math.round(255 * clamp(ellAt(PH, x, y), 0, 1)); return [g, g, g]; }, { res: 2, id: 'shape', key: 'chosen' });
          A.rect(-1, -1, 1, 1, { color: 'muted', width: 1 });
          for (let j = -Math.ceil(1.2 * k0.value); j <= Math.ceil(1.2 * k0.value); j++) {
            const d = j / k0.value, t = Math.sqrt(Math.max(0, 1.2 ** 2 - d * d)); if (Math.abs(d) > 1.2) continue;
            A.segment([d * c + t * sn, d * sn - t * c], [d * c - t * sn, d * sn + t * c], { color: 'orange', width: 1, alpha: .4 });
          }
          A.arrow(-1.3 * c, -1.3 * sn, -.7 * c, -.7 * sn, { color: 'orange', width: 2 });
          for (let j = 0; j <= 8; j++) { const psi = phi - PI / 2 + j * PI / 8; A.arrow(0, 0, 1.22 * Math.cos(psi), 1.22 * Math.sin(psi), { color: 'green', width: 1, alpha: .5 }); }
          Fk.raster((kx, ky) => { const [re, im] = ellFT(PH, kx, ky), g = Math.round(140 * clamp(Math.log10(1 + 400 * Math.hypot(re, im)) / 3, 0, 1)); return [g, g, g]; }, { res: 3, id: 'fbg', key: `oracle-background|${extent}` });
          Fk.circle(0, 0, radius, { color: 'red', width: 1.2, dash: true }); Fk.circle(0, 0, cur.cutoff, { color: 'purple', width: 1, dash: true });
          for (let j = 0; j < na.value; j++) Fk.path(diffractionLocusAudit((j + .5) * range.value / na.value * PI / 180, k0.value, mode.value, 41, true), { color: 'accent', width: .7, alpha: .25 });
          const hit = []; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (cur.counts[j * N + i]) hit.push([(i - N / 2) * .5, (j - N / 2) * .5]);
          Fk.dots(hit, { color: 'accent', r: 1.1, alpha: .55 });
          Fk.path(diffractionLocusAudit(phi, k0.value, mode.value, 81, true), { color: 'gold', width: 2.6 });
          showImage(Rc, cur.out, N, N, { lo: -.05, hi: 1.05, id: 'diffraction', extra: key, smooth: true }); frame(Rc, N, N);
        });
        v.legend([['gold', 'probe locus (no added data)'], ['accent', 'acquired loci / gridded + conjugate cells'], ['red', 'continuous cutoff √2 k₀', { dash: true }], ['purple', 'numerical circular cutoff', { dash: true }], ['orange', 'incident wave'], ['green', 'forward directions']]);
        v.readout(() => cur ? `$k_0=${fx(k0.value, 1)}$, wavelength${fx(1 / k0.value, 3)}; continuous cutoff radius${fx(cur.theoreticalRadius, 2)}, shortest-period scale${fx(1 / cur.theoreticalRadius, 3)} (not PSF FWHM). Numerical cutoff${fx(cur.cutoff, 2)} on the64² grid.\n${cur.cells}/${cur.eligible} eligible cells (${fx(100 * cur.cells / cur.eligible, 1)}%) populated after explicit real-object conjugate completion; ${cur.accepted}/${65 * na.value} synthetic samples retained, ${cur.discarded} outside the numerical cutoff. RMS sample-to-cell displacement${fx(cur.displacementRMS, 3)} cycles/unit; unhit cells zero, no hole filling.\nRMS image error${fx(cur.err, 4)}; residual inverse-transform imaginary magnitude${fx(cur.imagMax, 12)}. The probe only moves the gold geometry. ${mode.value === 'ray' ? 'Straight slices have this same finite cutoff; this is a geometry comparison.' : 'Synthetic deweighted Born samples; no wave propagation or Rytov-log data are simulated.'}` : '');
      },
    },

    // ------------------------------------------------------------------ 3.17
    {
      num: '3.17',
      kind: 'Paper',
      name: 'Representation of a Function by Its Line Integrals',
      paper: {
        authors: 'A. M. Cormack', year: 1963, title: 'Representation of a Function by Its Line Integrals, with Some Radiological Applications',
        venue: 'Journal of Applied Physics 34 (9): 2722–2727', doi: '10.1063/1.1729798',
      },
      introduces: ['imaging-3.1'],
      statement: String.raw`Cormack formulates recovery of a bounded piecewise-continuous function supported in a disc from its line integrals over all straight lines through that disc. Expanding object and data in angular Fourier modes reduces the problem to one-dimensional equations containing Chebyshev polynomials (Eqs.4–10); the integral identity in Eq.16 leads to inversion Eqs.17–18. The radiological applications are attenuation mapping, attenuation-corrected positron-annihilation imaging, and a more restricted charged-particle density model.
The **1963 experimental test was circularly symmetric** (§6): a 5cm-thick, 20cm-diameter specimen with a 1.13cm-diameter pure-aluminium core, aluminium-alloy annulus to diameter10cm, and oak annulus to diameter20cm. A Co-60 beam of overall width7mm was measured at one angle, in5mm offset steps, with at least20,000 counts per setting. Figure1 compares the radial primitive $J(r)$, not a nonsymmetric reconstructed image. This was not a Lucite/two-disc phantom.`,
      idea: String.raw`For a radial coefficient $g(r)$ supported at radius $R$, the projection is an Abel integral. Scaling Cormack's unit-radius Eq.26 to centimetres gives
$$p(s)=2\int_s^R\frac{g(r)r}{\sqrt{r^2-s^2}}\,dr,\qquad J(r)=\frac r\pi\int_r^R\frac{p(s)}{s\sqrt{s^2-r^2}}\,ds,\qquad g(r)=-J'(r).$$
For nested constant layers, $J(r)=\sum_\ell\Delta\mu_\ell(R_\ell-r)_+$ is piecewise linear. With $s=r/\cos\theta$, its integral becomes $\pi^{-1}\int_0^{\arccos(r/R)}p(r/\cos\theta)\,d\theta$; $J(0)=p(0)/2$. The picture evaluates this integral from interpolated simulated samples, avoiding differentiation of noisy data. The paper reports alloy $0.161\pm0.002$ and oak $0.0340\pm0.0005\ \mathrm{cm^{-1}}$, and assumes $0.150\ \mathrm{cm^{-1}}$ for the pure-aluminium core; its Figure1 agreement is an experimental observation, not an error bound for this simulation.`,
      caption: String.raw`Left: the original paper's circular dimensions and central attenuation values. Middle: ideal zero-width line integrals, a chosen finite-beam model, and simulated sampled log transmissions. Right: the exact piecewise-linear $J$ and its numerical estimate from those samples, corresponding to the quantity in the original Figure1. Change **beam width**, **offset step**, and **incident counts**, or switch counting noise off. The original used7mm overall beam width and5mm steps; its unreported beam-intensity profile is not reconstructed. These are new model curves, not digitized experimental points.`,
      deps: ['imaging-2.3'],
      tags: ['Cormack', 'line integrals', 'history'],
      refs: ['Cormack (1963), §§2–4, Eqs.4–18; §6, Eq.26 and Fig.1, pp.2726–2727'],
      credit: 'A. M. Cormack, 1963; original article and its circular experimental test',
      links: { original: 'https://www.radhis.nl/uploads/5/5/4/1/55414293/cormack_1963.pdf', doi: 'https://doi.org/10.1063/1.1729798' },
      verify: false,
      scope: String.raw`The complete 1963 original was read. Geometry and central coefficients come from §6; sample thickness is5cm along the cylinder axis, while transverse ray lengths follow the20cm diameter. The beam model is an explicitly chosen uniform strip: transmitted intensities are averaged before taking the logarithm. It ignores scatter, dead time, background, the Co-60 doublet and the unknown original beam profile. Counts control means incident expectation per offset, unlike the paper's at-least20,000 recorded counts. Noise uses seed9, exact Poisson inverse sums below mean40 and a rounded normal approximation above it; a half-count floor prevents log0. The continuous inversion theorem and the original experiment are separate from this finite interpolated, Simpson-integrated illustration. The later nonsymmetric experiment, original historical priority and clinical validation are not asserted.`,
      viz(v) {
        const C = CORMACK1963_AUDIT;
        const width = v.slider('beam width (cm)', 0, 1.4, .7, { step: .05 });
        const I0 = v.slider('incident counts per offset', 3000, 1e7, 200000, { log: true, sig: 2 });
        const step = v.select('offset step (cm)', [{ value: '0.5', label: '0.5 (original)' }, { value: '0.25', label: '0.25' }, { value: '0.1', label: '0.1' }], '0.5');
        const noise = v.select('counting noise', [{ value: 'on', label: 'seeded counts' }, { value: 'off', label: 'off' }], 'on');
        const A = v.stage({ x: [-11.5, 11.5], y: [-11.5, 11.5], equal: true, axes: false, height: 280, title: '1963 circular specimen (cm)', minWidth: 220 });
        const B = v.stage({ x: [0, 12.5], y: [-.1, 2.4], axes: 'box', gutter: true, height: 280, xlabel: 'offset s (cm)', ylabel: 'log attenuation p', title: 'Simulated transmissions', minWidth: 240 });
        const D = v.stage({ x: [0, 10], y: [0, 1.1], axes: 'box', gutter: true, height: 280, xlabel: 'radius r (cm)', ylabel: 'radial primitive J', title: 'Eq.26 / Figure1 quantity', minWidth: 240 });
        const rng = rng32(9), U = Float64Array.from({ length: 126 }, () => Math.max(1e-10, rng())), Z = Float64Array.from(U, u => v.M.dist.normal(0, 1).quantile(u));
        const sx = lin(0, 12.5, 251), rx = lin(0, 10, 101); let result = null, key = '';
        v.render(() => {
          const k = `${width.value}|${Math.round(I0.value)}|${step.value}|${noise.value}`;
          if (k !== key) {
            key = k; const offsets = lin(0, 12.5, Math.round(12.5 / Number(step.value)) + 1), incident = Math.round(I0.value);
            const values = offsets.map((s, j) => { const p = cormackBeamAudit(s, width.value); return noise.value === 'off' ? p : -Math.log(Math.max(.5, poissonFrom(incident * Math.exp(-p), U[j], Z[j])) / incident); });
            const J = rx.map(r => cormackJAudit(r, offsets, values));
            result = { offsets, values, J, residual: Math.sqrt(mean(J.map((q, i) => (q - cormackExactJAudit(rx[i])) ** 2))), minMean: incident * Math.exp(-Math.max(...offsets.map(s => cormackBeamAudit(s, width.value)))) };
          }
          A.raster((x, y) => { const r = Math.hypot(x, y); if (r > C.radius) return null; const t = Math.round(255 * cormackMuAudit(r) / C.alloyMu); return [t, t, t]; }, { res: 2, id: 'cormack1963', key: 'original-central-values' });
          for (const radius of [C.radius, C.alloyRadius, C.coreRadius]) A.circle(0, 0, radius, { color: 'muted', width: 1 });
          A.hband(-width.value / 2, width.value / 2, { color: 'gold', alpha: .4 });
          A.text('oak', 0, 7.3, { color: 'orange', align: 'center', size: 12 }); A.text('Al alloy', 0, 2.5, { color: 'ink', align: 'center', size: 12 });
          const ideal = sx.map(s => [s, cormackProjectionAudit(s)]), beam = sx.map(s => [s, cormackBeamAudit(s, width.value)]);
          const ys = [...ideal, ...beam, ...result.values.map((q, i) => [result.offsets[i], q])].map(p => p[1]);
          B.setView([0, 12.5], [Math.min(-.04, ...ys) - .03, Math.max(...ys) * 1.08]);
          B.path(ideal, { color: 'ink', width: 2 }); B.path(beam, { color: 'orange', width: 2 }); B.dots(result.values.map((q, i) => [result.offsets[i], q]), { color: 'accent', r: 3 });
          const exact = rx.map(r => [r, cormackExactJAudit(r)]), estimated = rx.map((r, i) => [r, result.J[i]]), all = [...exact, ...estimated].map(p => p[1]);
          D.setView([0, 10], [Math.min(0, ...all) - .02, Math.max(...all) * 1.08]); D.path(exact, { color: 'ink', width: 2 }); D.path(estimated, { color: 'accent', width: 2.3 });
        });
        v.legend([['ink', 'ideal thin-ray / exact J'], ['orange', 'chosen finite-beam model'], ['accent', 'simulated sample / inferred J'], ['gold', 'beam strip']]);
        v.readout(() => result ? `Original1963: pure Al core radius0.565cm; alloy to5cm; oak to10cm. Source coefficients0.150 (assumed),0.161±0.002 and0.0340±0.0005 cm⁻¹; original Fig.1 plots J, not μ.\nSimulation: ${result.offsets.length} offsets0–12.5cm, width${fx(width.value, 2)}cm, ${noise.value === 'off' ? 'no counting noise' : 'seed9 counts (normal approximation at means≥40)'}. Incident expectation${fx(Math.round(I0.value), 0)}, smallest transmitted mean${fx(result.minMean, 0)}; these are not the original registered counts. RMS difference in J=${fx(result.residual, 5)} (finite sample/integration error, not an experimental residual).` : '');
      },
    },

    // ------------------------------------------------------------------ 3.18
    {
      num: '3.18',
      kind: 'Paper',
      name: 'Computerized Transverse Axial Scanning (Tomography): Part 1',
      paper: {
        authors: 'G. N. Hounsfield', year: 1973, title: 'Computerized transverse axial scanning (tomography): Part 1. Description of system',
        venue: 'British Journal of Radiology 46 (552): 1016–1022', doi: '10.1259/0007-1285-46-552-1016',
      },
      introduces: ['imaging-3.13'],
      statement: String.raw`Hounsfield described a scanner in which a narrow X-ray beam and detector traverse a slice of the head, take a row of transmission readings, then rotate by a small step and repeat; a computer reconstructs the absorption in a matrix of small elements from the whole set of readings and displays it as a picture, together with numerical values relative to water. Because the readings are digitised and used quantitatively, the system distinguishes tissues whose X-ray absorption differs by only about a per cent — grey and white matter, blood clot, cerebrospinal fluid — which a radiograph, where the shadow of bone and of the depth superimpose, cannot show. (Parameters of the first scanner — about $80\times80$ picture elements and of the order of $160$ readings at each of $180$ one-degree steps — are as commonly reported and are marked unverified.)`,
      idea: String.raw`Cormack's mathematics (3.17) had remained unread by engineers; Hounsfield, at EMI, arrived at a reconstruction from projections independently, first with a gamma-ray laboratory machine (28,000 measurements, nine days per picture by his Nobel lecture's account), then with an X-ray tube (nine hours), a human brain specimen and finally the Atkinson Morley's Hospital prototype (first patient 1972). He reckoned the method would be about two orders of magnitude more sensitive than conventional radiography because all measurements contribute to every element of the slice. The picture elements are computed by an iterative algebraic reconstruction (see 3.11) in the original machine, and the numbers expressed relative to water became the scale named after him (3.13).`,
      caption: String.raw`A head slice with the soft-tissue contrasts of today's HU values (grey matter ≈ 40, white matter ≈ 25, CSF ≈ 10, a fresh clot ≈ 65) is scanned on an 80×80 grid with a pencil beam: the slider adds **views** (one-degree steps, so the picture is incomplete until the half turn) and **photons per reading** sets the noise. Narrow the **window** around brain values and the tissues separate; the third panel shows a single radiograph-style projection, whose clot signal is lost under the bone and the long path of brain.`,
      deps: ['imaging-3.11', 'imaging-3.1'],
      tags: ['EMI scanner', 'Hounsfield', 'history'],
      refs: [],
      credit: 'G. N. Hounsfield, 1973 (Nobel Prize in Physiology or Medicine 1979, shared with A. M. Cormack)',
      links: { nobel: 'https://www.nobelprize.org/prizes/medicine/1979/hounsfield/lecture/' },
      verify: true,
      scope: String.raw`A reconstruction in the spirit of the paper, not its data: the head phantom, the HU values (modern textbook numbers; the paper used its own EMI scale), the photon counts and the reconstruction method (filtered back-projection here, an iterative method in the original) are modelled. Scanner parameters (80×80 matrix, 160 readings × 180°) are reported by secondary sources; I did not verify them against the paper itself.`,
      viz(v) {
        const NP = 80, nd = 160, nA = 180;
        // painter's list [HU, a, b, cx, cy, rot°]
        const PAINT = [[40, 0.95, 0.78, 0, 0, 0], [900, 0.9, 0.73, 0, 0, 0], [10, 0.84, 0.67, 0, 0, 0], [40, 0.82, 0.65, 0, 0, 0], [26, 0.62, 0.46, 0, 0, 0],
          [10, 0.14, 0.32, -0.16, 0.08, -12], [10, 0.14, 0.32, 0.16, 0.08, 12], [65, 0.12, 0.1, 0.38, -0.2, 20], [10, 0.05, 0.05, 0, -0.22, 0]];
        const huAt = (x, y) => { let val = -1000; for (const [h, a, b, cx, cy, ro] of PAINT) { const t = (ro * PI) / 180, dx = x - cx, dy = y - cy, u = dx * Math.cos(t) + dy * Math.sin(t), w = -dx * Math.sin(t) + dy * Math.cos(t); if ((u / a) ** 2 + (w / b) ** 2 <= 1) val = h; } return val; };
        // additive ellipse list (μ/μ_water) for the exact sinogram: each layer minus what lies under its centre
        const E2 = [];
        PAINT.forEach(([h, a, b, cx, cy, ro], i) => {
          let under = 0; for (let j = 0; j < i; j++) { const [h2, a2, b2, cx2, cy2, ro2] = PAINT[j]; const t = (ro2 * PI) / 180, dx = cx - cx2, dy = cy - cy2, u = dx * Math.cos(t) + dy * Math.sin(t), w = -dx * Math.sin(t) + dy * Math.cos(t); if ((u / a2) ** 2 + (w / b2) ** 2 <= 1) under = 1 + h2 / 1000; }
          E2.push([1 + h / 1000 - under, a, b, cx, cy, ro]);
        });
        const KAP = 2.0, sc = makeScan(nA, nd, 1.0), sinoC = sinoEll(E2, sc).map((x) => x * KAP);
        const r = rng32(3), { u: U, z: Z } = noiseField(v.M, r, nA * nd);
        const truthHU = raster((x, y) => { const h = huAt(x, y); return h; }, NP, NP, 1);
        const A = v.stage({ x: [0, NP], y: [0, NP], equal: true, axes: false, height: 290, title: 'Reconstruction (80 × 80)', minWidth: 230 });
        const S = v.stage({ x: [0, 180], y: [-1, 1], axes: 'box', gutter: true, height: 290, xlabel: 'step (1° each)', ylabel: 'beam position $s$', title: 'Readings so far', minWidth: 230, xticks: [0, 60, 120, 180] });
        const R = v.stage({ x: [-1, 1], y: [0, 7], axes: 'box', gutter: true, height: 290, xlabel: 'beam position $s$', ylabel: 'log-attenuation $p$', title: 'One projection: the clot is invisible', minWidth: 230 });
        const nv = v.slider('views acquired (1° steps)', 10, 180, 180, { step: 1, int: true });
        const ph = v.slider('photons per reading', 1e3, 1e8, 1e6, { log: true, sig: 2 });
        const lev = v.slider('window level (HU)', 0, 60, 30, { step: 1, int: true }), wid = v.slider('window width (HU)', 10, 400, 80, { step: 1, int: true });
        let res = null, key = '';
        v.render(() => {
          const I0 = Math.round(ph.value), n = nv.value, k = `${I0}|${n}`;
          if (k !== key) {
            key = k; const noisy = new Float64Array(sinoC.length);
            for (let i = 0; i < sinoC.length; i++) noisy[i] = -Math.log(Math.max(poissonFrom(I0 * Math.exp(-sinoC[i]), U[i], Z[i]), 0.5) / I0);
            const nz = noisy.map((x, i) => x - sinoC[i]);
            // use only the first n views of the half turn: zero the rest
            const part = Float64Array.from(noisy, (x, i) => (Math.floor(i / nd) < n ? x : 0));
            const img = fbp(part, sc, NP, NP, 'shepp').map((x) => 1000 * (x / KAP - 1));
            res = { img, noisy, nz };
          }
          const lo = lev.value - wid.value / 2, hi = lev.value + wid.value / 2;
          showImage(A, res.img, NP, NP, { lo, hi, id: 'h', extra: `${key}|${lo}|${hi}`, smooth: true }); frame(A, NP, NP);
          S.raster((a, s) => { const kk = Math.min(nA - 1, Math.floor(a)), j = Math.floor((s + 1) / sc.tau); if (kk >= n || j < 0 || j >= nd) return null; const c = Math.round(255 * clamp(res.noisy[kk * nd + j] / 6, 0, 1)); return [c, c, c]; }, { res: 2, id: 'sg', key });
          S.vline(n, { color: 'gold', width: 1.5 });
          const th = 0;
          R.path(lin(-1, 1, 200).map((s) => [s, KAP * ellProj(E2, th, s)]), { color: 'accent', width: 2 });
          const clot = [E2[PAINT.findIndex((q) => q[0] === 65)]]; R.path(lin(-1, 1, 200).map((s) => [s, KAP * ellProj(clot, th, s)]), { color: 'red', width: 2.4 });
          R.text('clot', 0.45, 0.35, { color: 'red', size: 12 });
        });
        v.legend([['accent', 'whole head'], ['red', 'clot alone']]);
        v.readout(() => {
          if (!res) return '';
          const roi = (cx, cy, rad) => { const vals = []; for (let j = 0; j < NP; j++) for (let i = 0; i < NP; i++) { const x = -1 + ((i + 0.5) * 2) / NP, y = 1 - ((j + 0.5) * 2) / NP; if (Math.hypot(x - cx, y - cy) < rad) vals.push(res.img[j * NP + i]); } return vals; };
          const wm = roi(0, -0.3, 0.05), cl = roi(0.38, -0.2, 0.05), gm = roi(0, 0.5, 0.0);
          void gm;
          return `Noise (SD) in a uniform patch of white matter: $${fx(sd(wm), 1)}$ HU; mean white matter $${fx(mean(wm), 0)}$ HU, clot $${fx(mean(cl), 0)}$ HU.\nGrey–white contrast is only about 1% of water's attenuation (15 HU = 1.5%): to see it the noise must be well below that, which needs more photons — here ${fx(Math.round(ph.value), 0)} per reading. In the single projection the clot adds under 1% to the signal.`;
        });
      },
    },
  ],
};
