// Medical Imaging — Chapter 4 (part 3): 4.8 MLEM and OSEM iterative reconstruction, 4.9 time-of-flight PET, 4.10 tracer kinetics and the Patlak plot.
import {
  clamp, fx, mean, showImage, frame, raster, ellAt, buildSystem, forward, subsetSens, osemSub, logLik, noiseField, poissonFrom, rng32, gauss,
  fitLine,
} from './ch04.shared.js';
import { tofWidthAudit, tofGainAudit, tofBackprojectionAudit } from './source-audit-tof.shared.js';
import { patlakModelAudit, patlakFrameAudit } from './source-audit-patlak.shared.js';

const PI = Math.PI;

export default {
  collection: 'imaging',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Algorithm',
      name: 'MLEM and OSEM iterative reconstruction',
      statement: String.raw`Emission counts are Poisson: bin $i$ receives $y_i\sim\mathrm{Poisson}\big((Ax)_i\big)$, where $x_j\ge0$ is the activity in pixel $j$ and $a_{ij}$ is the probability that a decay in $j$ is recorded in bin $i$. The log-likelihood is $\ell(x)=\sum_i\big(y_i\ln(Ax)_i-(Ax)_i\big)+\mathrm{const}$. The **MLEM** iteration
$$x_j^{(k+1)}=\frac{x_j^{(k)}}{\sum_ia_{ij}}\sum_i a_{ij}\,\frac{y_i}{(Ax^{(k)})_i}$$
keeps $x\ge0$, never decreases $\ell$, and converges to a maximum-likelihood image; after every update $\sum_j\big(\sum_ia_{ij}\big)x_j=\sum_iy_i$ (the counts are conserved). **OSEM** applies the same update using only one subset $S_m$ of the bins (e.g. every $S$-th projection angle) at a time, so one pass over all subsets costs one MLEM iteration but advances about $S$ times as far, at the price of no longer guaranteeing monotone convergence.`,
      idea: String.raw`The update is a multiplicative gradient step: the ratio $y_i/(Ax)_i$ says how much each bin's prediction is too low or too high, back-projecting the ratio (as in imaging-3.6, now a ratio rather than a sum) tells each pixel how to scale, and normalising by the sensitivity $\sum_ia_{ij}$ makes the step exactly the expectation–maximisation update for Poisson data. Because the ML solution for noisy counts fits the noise (the true image has a *lower* likelihood than the ML image), the iteration is stopped early or smoothed: the error against the truth falls, reaches a minimum and then rises as noise is amplified. Subsets trade the guarantee for speed, with limit cycles at high iteration counts.`,
      caption: String.raw`Choose the **total counts** (few counts = noisy data) and the number of **subsets** $S$ (1 is MLEM). Slide the **iteration** number: left, the true image; middle, the current estimate. The two curves show how far the log-likelihood is below its best value (log axis; MLEM in blue, OSEM in orange, dashed the value at the true image) and the error against the truth — the likelihood keeps rising while the error has a minimum, after which the picture gets noisier. OSEM reaches a given likelihood in about $1/S$ as many passes.`,
      deps: ['imaging-1.7', 'imaging-3.11'],
      tags: ['MLEM', 'OSEM', 'Poisson'],
      refs: ['Prince–Links ch. 9'],
      credit: 'L. A. Shepp & Y. Vardi, 1982 (MLEM for emission tomography); H. M. Hudson & R. S. Larkin, 1994 (OSEM)',
      links: { doi: 'https://doi.org/10.1109/TMI.1982.4307558' },
      scope: String.raw`A $32\times32$ image, 32 parallel-beam views of 44 bins each (the ray-sum matrix of chapter 3), Poisson counts, no attenuation, scatter, randoms or detector blur; the images are in units of the true activity (background = 1 before scaling). The "error" is the relative root-mean-square difference from the truth over the body. OSEM subsets are every $S$-th view; for large $S$ the ordered-subset iteration does not converge to the ML image.`,
      viz(v) {
        const N = 32, NA = 32, ND = 44, IT = 60;
        const sys = buildSystem(N, NA, ND, 1.42);
        const E = [[1, 0.85, 0.65, 0, 0, 0], [2, 0.09, 0.09, 0.35, 0.35, 0], [1.2, 0.07, 0.07, 0.1, 0.4, 0], [1.5, 0.1, 0.1, -0.4, 0.3, 0], [-0.8, 0.13, 0.13, 0, -0.35, 0]];
        const xt = raster((x, y) => ellAt(E, x, y), N, N, 3), inBody = raster((x, y) => (ellAt([E[0]], x, y) > 0 ? 1 : 0), N, N, 1);
        const Ab = forward(sys, xt), abTot = Ab.reduce((s, q) => s + q, 0);
        const nf = noiseField(v.M, rng32(31), sys.rows.length);
        const A = v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 270, title: 'True image', minWidth: 200 });
        const B = v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 270, title: 'MLEM / OSEM estimate', minWidth: 200 });
        const C = v.stage({ x: [0, IT], y: [0.01, 1e5], ylog: true, axes: 'box', gutter: true, height: 270, xlabel: 'full iterations', ylabel: 'shortfall from best $\\ell$', title: 'Log-likelihood', minWidth: 230 });
        const D = v.stage({ x: [0, IT], y: [0, 1], axes: 'box', gutter: true, height: 270, xlabel: 'full iterations', ylabel: 'RMS error / mean', title: 'Error against the truth', minWidth: 230 });
        const cnt = v.slider('total counts', 3000, 300000, 30000, { log: true, sig: 2, int: true });
        const sub = v.select('subsets $S$', [{ value: 2, label: '2' }, { value: 4, label: '4' }, { value: 8, label: '8' }], 4);
        const it = v.slider('iteration', 0, IT, 10, { step: 1, int: true });
        const cache = new Map();
        const run = (S, y, scale) => {
          const sens = subsetSens(sys, S), x0 = Float64Array.from({ length: N * N }, () => y.reduce((s, q) => s + q, 0) / (sys.rows.reduce((s, r) => s + r.sum, 0) || 1));
          const x = Float64Array.from(x0), imgs = [Float64Array.from(x)], ll = [logLik(sys, y, x)], err = [], tr = Float64Array.from(xt, (q) => q * scale);
          const rerr = (z) => { let s = 0, w = 0, m = 0; for (let i = 0; i < z.length; i++) if (inBody[i] > 0) { s += (z[i] - tr[i]) ** 2; w++; m += tr[i]; } return Math.sqrt(s / w) / (m / w); };
          err.push(rerr(x));
          for (let k = 0; k < IT; k++) { for (let m = 0; m < S; m++) osemSub(sys, y, x, m, S, sens); imgs.push(Float64Array.from(x)); ll.push(logLik(sys, y, x)); err.push(rerr(x)); }
          return { imgs, ll, err, tr };
        };
        const solve = (c, S) => {
          const key = `${Math.round(c)}|${S}`; if (cache.has(key)) return cache.get(key);
          const scale = c / abTot, y = Float64Array.from(Ab, (q, i) => poissonFrom(q * scale, nf.u[i], nf.z[i]));
          const res = { S: run(S, y, scale), M: S === 1 ? null : run(1, y, scale), y, scale, llTrue: logLik(sys, y, Float64Array.from(xt, (q) => q * scale)) };
          if (!res.M) res.M = res.S; if (cache.size > 12) cache.clear(); cache.set(key, res); return res;
        };
        let info = {};
        v.render(() => {
          const S = Number(sub.value), R = solve(cnt.value, S), k = it.value, bg = R.scale;
          showImage(A, R.S.tr, N, N, { lo: 0, hi: 3 * bg, id: 'tr', smooth: true }); frame(A, N, N);
          showImage(B, R.S.imgs[k], N, N, { lo: 0, hi: 3 * bg, id: 'est', smooth: true, extra: `${cnt.value}|${S}|${k}` }); frame(B, N, N);
          const lmax = Math.max(...R.M.ll, ...R.S.ll), l0 = R.M.ll[0], rel = (l) => Math.max(lmax - l, 0.01);
          C.setView([0, IT], [0.01, (lmax - l0) * 2]);
          C.path(R.M.ll.map((l, i) => [i, rel(l)]), { color: 'accent', width: 2.2 });
          C.path(R.S.ll.map((l, i) => [i, rel(l)]), { color: 'orange', width: 2.2 });
          C.hline(rel(R.llTrue), { color: 'ink', dash: true, width: 1.2 });
          C.vline(k, { color: 'gold', dash: true });
          const emax = Math.max(...R.M.err, ...R.S.err) * 1.05; D.setView([0, IT], [0, emax]);
          D.path(R.M.err.map((e, i) => [i, e]), { color: 'accent', width: 2.2 }); D.path(R.S.err.map((e, i) => [i, e]), { color: 'orange', width: 2.2 });
          D.vline(k, { color: 'gold', dash: true });
          const emin = R.M.err.indexOf(Math.min(...R.M.err)), eminS = R.S.err.indexOf(Math.min(...R.S.err));
          let cons = 0; const x = R.S.imgs[k], sens1 = subsetSens(sys, 1)[0]; for (let j = 0; j < x.length; j++) cons += sens1[j] * x[j];
          info = { S, k, lAbove: R.S.ll[k] > R.llTrue, emin, eminS, err: R.S.err[k], eM: R.M.err[Math.min(k, IT)], cons: cons / R.y.reduce((s, q) => s + q, 0), dl: R.S.ll[k] - R.llTrue };
        });
        v.legend([['accent', 'MLEM ($S=1$)'], ['orange', 'OSEM with $S$ subsets'], ['ink', 'likelihood of the true image', { dash: true }]]);
        v.readout(() => `Pass ${info.k}, $S=${info.S}$: error $${fx(info.err, 3)}$ (MLEM at the same pass: $${fx(info.eM, 3)}$). Error is smallest at pass ${info.eminS} for OSEM and at pass ${info.emin} for MLEM — afterwards the likelihood keeps rising (it is already ${info.dl > 0 ? 'above' : 'below'} that of the truth by $${fx(Math.abs(info.dl), 1)}$) but the image gets noisier.\nSensitivity-weighted counts of the estimate over measured counts: $${fx(info.cons, 4)}$ (exactly 1 for MLEM after any update, close to 1 for OSEM).`);
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Concept',
      name: 'Time-of-flight PET',
      statement: String.raw`With the positive coordinate along the line of response pointing from detector 1 toward detector 2, a measured arrival-time difference $\Delta t=t_1-t_2$ estimates displacement $x=c\,\Delta t/2$ from the detector pair’s midpoint, with an uncertainty
$$\Delta x=\frac{c\,\Delta\tau}{2}\quad(\text{FWHM}),$$
for a coincidence timing resolution $\Delta\tau$ (FWHM). For example $\Delta\tau=500$ ps gives $\Delta x\approx7.5$ cm and $\Delta\tau=100$ ps about 1.5 cm. A Gaussian timing model localizes an event probabilistically along its LOR; this localization FWHM is not the final image’s spatial resolution. For a uniform object of diameter $D\gg\Delta x$, with otherwise comparable detection/reconstruction, the classical approximate image-SNR gain is $\sqrt{D/\Delta x}$. The associated effective-count gain is $D/\Delta x$, not its square root. The plotted heuristic is limited below by 1 when the timing blur exceeds the object size. Nonuniform activity and different detector efficiency change the comparison.`,
      idea: String.raw`A photon travels $c\approx30$ cm/ns, so a 1 ns difference in arrival shifts the inferred point by 15 cm: the conversion is just kinematics. Without timing, an event adds a uniform count along a chord of length about $D$, and only a fraction $\Delta x/D$ of that chord is where the emitter actually was within the timing blur; the rest is noise for the voxel in question. Using the timing information, the effective number of independent "looks" at a voxel rises by $D/\Delta x$, and a Poisson signal-to-noise ratio goes as the square root of counts (imaging-1.7). The benefit is therefore largest for large patients and fast detectors, and is also what lets TOF scanners hold image quality with lower dose or shorter scans.`,
      caption: String.raw`Drag the **gold annihilation point**, set the **direction** and **timing resolution**, or resample the probe’s timing error. The two images use the same fixed seeded event set: a radius-1 cm disc of activity 4 in a background of activity 1. Both unfiltered back-projections use the known circular support; TOF distributes an event as a Gaussian restricted and normalized to its chord. The green probe curve is a separate illustrative timing likelihood. The uniform-object gain curve is a heuristic, not a measured SNR ratio for these pictures. The reported contrast averages a 1.3 cm ROI, which includes the lesion edge.`,
      deps: ['imaging-4.6', 'imaging-1.7'],
      tags: ['PET', 'time of flight'],
      refs: ['Budinger (1983), J. Nucl. Med.24:73–78, Eq.1 and Eqs.2–8, pp.73–76'],
      links: { original: 'https://jnm.snmjournals.org/content/jnumed/24/1/73.full.pdf' },
      scope: String.raw`The complete Budinger1983 original was read. The SNR/count heuristic assumes a uniform extended source and otherwise comparable systems; the paper explicitly shows its limitation for nonuniform sources. Its historical detector-efficiency and performance numbers are not claims about current scanners. The illustration uses 56² pixels over 50 cm, midpoint chord steps at most 0.4 cm and bilinear deposition; it has no iterative reconstruction, attenuation, scatter or random coincidences. Each retained event has unit mass in either back-projection. The circular support is known in advance. The probe resampling button changes only its illustrative timing error, while image events retain their seed.`,
      verify: false,
      viz(v) {
        const NG = 56, FOV = 25, NMAX = 12000, RING = 40;
        const A = v.stage({ x: [-45, 45], y: [-45, 45], equal: true, axes: false, height: 320, title: 'Annihilation point and its timing blur', minWidth: 260 });
        const B = v.stage({ x: [0, NG], y: [0, NG], equal: true, axes: false, height: 300, title: 'Back-projection, no timing', minWidth: 200 });
        const C = v.stage({ x: [0, NG], y: [0, NG], equal: true, axes: false, height: 300, title: 'Back-projection with timing', minWidth: 200 });
        const G = v.stage({ x: [20, 1000], y: [1, 10], xlog: true, axes: 'box', gutter: true, height: 300, xlabel: 'timing resolution FWHM (ps)', ylabel: 'gain $\\sqrt{D/\\Delta x}$', title: 'Approximate SNR gain', minWidth: 230 });
        const dd = v.slider('object diameter $D$ (cm)', 12, 40, 30, { step: 1, int: true });
        const tr = v.slider('timing resolution (ps)', 30, 1000, 300, { log: true, sig: 2, int: true });
        const ang = v.slider('LOR direction (°)', 0, 179, 35, { step: 1, int: true });
        const nEv = v.slider('events $N$', 500, NMAX, 4000, { log: true, sig: 2, int: true });
        let seed = 3; const zr = () => { const r = rng32(seed * 7919); return r; };
        let z0 = gauss(zr());
        v.button('Resample probe timing', () => { seed++; z0 = gauss(zr()); });
        const h = A.handle(6, 4, { color: 'gold', r: 9 });
        const r0 = rng32(2026), U = new Float64Array(NMAX), AL = new Float64Array(NMAX), RR = new Float64Array(NMAX), TH = new Float64Array(NMAX), ZZ = new Float64Array(NMAX), GA = new Float64Array(NMAX), GB = new Float64Array(NMAX);
        for (let i = 0; i < NMAX; i++) { U[i] = r0(); AL[i] = r0() * PI; RR[i] = Math.sqrt(r0()); TH[i] = r0() * 2 * PI; ZZ[i] = gauss(r0); GA[i] = gauss(r0); GB[i] = gauss(r0); }
        const cache = new Map();
        const bp = (D, dtps, N) => {
          const key = `${D}|${dtps}|${N}`; if (cache.has(key)) return cache.get(key);
          const out = tofBackprojectionAudit(D, dtps, N, { U, AL, RR, TH, ZZ }, NG, FOV);
          if (cache.size > 10) cache.clear(); cache.set(key, out); return out;
        };
        let info = {};
        v.render(() => {
          const D = dd.value, R = D / 2, dx = tofWidthAudit(tr.value), sg = dx / (2 * Math.sqrt(2 * Math.log(2))), th = (ang.value * PI) / 180, c = Math.cos(th), s = Math.sin(th);
          const hr = Math.hypot(h.x, h.y); if (hr > R) h.set((h.x * R) / hr, (h.y * R) / hr);
          const um = z0 * sg, extent = Math.max(50, Math.abs(h.x + um * c) + dx / 2 + 15, Math.abs(h.y + um * s) + dx / 2 + 15);
          A.setView([-extent, extent], [-extent, extent]);
          // geometry
          A.circle(0, 0, RING, { color: 'muted', width: 1.4 });
          A.circle(0, 0, R, { color: 'accent', width: 1.6, fill: 'accent', fillAlpha: 0.1 });
          A.circle(0.45 * R, 0.3 * R, 1, { color: 'red', width: 1.6, fill: 'red', fillAlpha: 0.5 });
          const pu = h.x * c + h.y * s, disc = Math.sqrt(Math.max(0, pu * pu - (h.x ** 2 + h.y ** 2) + RING * RING)), a1 = -pu - disc, a2 = -pu + disc;
          A.segment([h.x + a1 * c, h.y + a1 * s], [h.x + a2 * c, h.y + a2 * s], { color: 'orange', width: 1.4 });
          A.dot(h.x + a1 * c, h.y + a1 * s, { r: 5, color: 'orange' }); A.dot(h.x + a2 * c, h.y + a2 * s, { r: 5, color: 'orange' });
          const amp = 9;
          A.path(Array.from({ length: 161 }, (_, k) => { const t = a1 + (k * (a2 - a1)) / 160, g = Math.exp(-0.5 * ((t - um) / sg) ** 2); return [h.x + t * c - amp * g * s, h.y + t * s + amp * g * c]; }), { color: 'green', width: 2.2 });
          A.dot(h.x + um * c, h.y + um * s, { r: 5, color: 'green' });
          A.measure(h.x + (um - dx / 2) * c - 11 * s, h.y + (um - dx / 2) * s + 11 * c, h.x + (um + dx / 2) * c - 11 * s, h.y + (um + dx / 2) * s + 11 * c, 'FWHM');
          // images
          const R2 = bp(D, tr.value, Math.round(nEv.value));
          const hiN = Math.max(...R2.non) * 0.95, hiT = Math.max(...R2.tof) * 0.95;
          showImage(B, R2.non, NG, NG, { lo: 0, hi: hiN, id: 'non', smooth: true, extra: `${D}|${tr.value}|${nEv.value}` }); frame(B, NG, NG);
          showImage(C, R2.tof, NG, NG, { lo: 0, hi: hiT, id: 'tof', smooth: true, extra: `${D}|${tr.value}|${nEv.value}` }); frame(C, NG, NG);
          const gain = (t) => tofGainAudit(D, t);
          G.setView([20, 1000], [1, gain(20) * 1.1]);
          G.fn(gain, { color: 'accent', width: 2.4, n: 200, domain: [20, 1000] });
          G.hline(1, { color: 'muted', dash: true });
          G.dot(tr.value, gain(tr.value), { r: 7, color: 'gold' });
          info = { dx, gain: gain(tr.value), cn: R2.ln.les / Math.max(R2.ln.bg, 1e-9), ct: R2.lt.les / Math.max(R2.lt.bg, 1e-9), D, retained: R2.retained };
        });
        v.readout(() => `$\\Delta x=c\\,\\Delta\\tau/2=${fx(info.dx, 2)}$ cm for $\\Delta\\tau=${tr.value}$ ps (localization FWHM); object $D=${info.D}$ cm. Uniform-object heuristic $\\max(1,\\sqrt{D/\\Delta x})=${fx(info.gain, 2)}$ (not measured here).\n${info.retained}/${Math.round(nEv.value)} events retained. In the 1.3 cm ROI, back-projection lesion/background ratios are ${fx(info.cn, 2)} without timing and ${fx(info.ct, 2)} with timing. The phantom’s radius-1 cm lesion has activity ratio 4; the wider ROI and image blur change this average.`);
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Method',
      name: 'Tracer kinetics and the Patlak plot',
      statement: String.raw`For an initially tracer-free two-tissue model, $\dot C_1=K_1C_p-(k_2+k_3)C_1+k_4C_2$ and $\dot C_2=k_3C_1-k_4C_2$. Measured tissue activity is modelled as $C_T=C_1+C_2+V_pC_p$. With an **irreversible trap** ($k_4=0$), define $K_i=K_1k_3/(k_2+k_3)$. The exact identity
$$\frac{C_T}{C_p}=K_i\frac{\int_0^t C_p(\tau)\,d\tau}{C_p(t)}+\frac{k_2}{k_2+k_3}\frac{C_1(t)}{C_p(t)}+V_p$$
becomes an **approximately straight Patlak plot** once $C_1/C_p$ is nearly constant. This requires reversible relaxation to be fast compared with the remaining plasma variation, as well as decay of the initial transient. The late slope estimates $K_i$; the intercept includes vascular and reversible contributions. Reversible trapping ($k_4>0$), early frames and noise can change the slope and curvature; a fitted line alone does not establish irreversibility.`,
      idea: String.raw`Set $a=k_2+k_3$. Since $\dot C_1=K_1C_p-aC_1$ when $k_4=0$, integrating from zero gives $C_2=(k_3/a)(K_1\int C_p-C_1)$. This yields the exact identity above without treating the early transient as equilibrium. If plasma changes slowly, $C_1/C_p\approx K_1/a$, and the intercept is approximately $V_p+K_1k_2/a^2$—not merely the free-compartment volume. The Patlak construction estimates an influx slope from a plasma curve and a suitable linear portion of tissue data without fitting all compartment rates. A later fitting window can reduce transient bias, but cannot repair a leaking trap or inadequate input measurements.`,
      caption: String.raw`The left panel overlays a made-up plasma input ($\mathrm{kBq/mL}$) and tissue activity ($\mathrm{kBq/g}$); dots are 24 **instantaneous** model samples with multiplicative Gaussian noise. The right panel transforms those same samples; green frames satisfy $t\ge t^*$. Move the fit start and rate constants to test linearity. The reference $K_1k_3/(k_2+k_3)$ is the irreversible model value when $k_4=0$; for $k_4>0$ it is only the benchmark obtained by setting the leak to zero.`,
      deps: ['pharm-3.1', 'imaging-4.6'],
      tags: ['Patlak', 'compartment model', 'FDG'],
      refs: ['Patlak, Blasberg & Fenstermacher (1983), J. Cereb. Blood Flow Metab. 3:1–7, assumptions and Eqs. 9, 14, 22–23'],
      credit: 'C. S. Patlak, R. G. Blasberg & J. D. Fenstermacher, 1983 (J. Cereb. Blood Flow Metab. 3:1–7)',
      links: { doi: 'https://doi.org/10.1038/jcbfm.1983.1', primary: 'https://journals.sagepub.com/doi/pdf/10.1038/jcbfm.1983.1' },
      scope: String.raw`The complete original seven-page article was read for the single-input, linear, initially tracer-free and effectively irreversible assumptions, the plasma-relaxation condition (Eq. 14), and intercept interpretation (Eqs. 22–23). This demonstration specializes that general theory to two compartments; its FDG-like rates and bolus are illustrative, not measured or clinically calibrated. The input is a three-exponential decay multiplied by a rapid rise. $K_1$ has units $\mathrm{mL/(g\,min)}$, other rates $\mathrm{min^{-1}}$, and $V_p=0.04\,\mathrm{mL/g}$. A fourth-order ODE integrator uses 0.025 min steps; the plasma integral is analytic. Noise is independent multiplicative Gaussian tissue noise with nonnegative clipping; there is no frame-duration averaging, plasma noise, decay correction, metabolite correction, motion or parameter uncertainty model.`,
      verify: false,
      viz(v) {
        const FR = [0.25, 0.75, 1.25, 1.75, 2.5, 3.5, 4.5, 6, 8, 10, 13, 16, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90];
        const A = v.stage({ x: [0, 90], y: [0, 50], axes: 'box', gutter: true, height: 330, xlabel: 'time (min)', ylabel: 'activity (kBq/mL plasma; kBq/g tissue)', title: 'Plasma input and tissue curve', minWidth: 280 });
        const B = v.stage({ x: [0, 80], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'normalised time $\\int_0^tC_p\\,d\\tau\\,/\\,C_p(t)$ (min)', ylabel: '$C_T/C_p$ (mL/g)', title: 'Patlak plot', minWidth: 280 });
        const K1 = v.slider('$K_1$ (mL/g/min)', 0.04, 0.3, 0.1, { step: 0.005 });
        const k2 = v.slider('$k_2$ (1/min)', 0.04, 0.4, 0.13, { step: 0.005 });
        const k3 = v.slider('$k_3$ (1/min)', 0.0, 0.2, 0.06, { step: 0.002 });
        const k4 = v.slider('$k_4$ (1/min)', 0.0, 0.08, 0.0, { step: 0.001 });
        const ts = v.slider('start of fit $t^*$ (min)', 3, 60, 20, { step: 1, int: true });
        const nz = v.slider('noise (%)', 0, 25, 4, { step: 0.5 });
        let seed = 1, zf = FR.map(() => 0); const mkz = () => { const r = rng32(seed * 131); zf = FR.map(() => gauss(r)); }; mkz();
        v.button('Resample noise', () => { seed++; mkz(); });
        const cache = new Map();
        const model = (a, b, c, d) => { const key = `${a}|${b}|${c}|${d}`; if (cache.has(key)) return cache.get(key); const m = patlakModelAudit(a, b, c, d, 0.04); if (cache.size > 40) cache.clear(); cache.set(key, m); return m; };
        let info = {};
        v.render(() => {
          const m = model(K1.value, k2.value, k3.value, k4.value);
          const xs = [], ys = [], fx_ = [], fy = [], sampled = [];
          FR.forEach((t, q) => {
            const f = patlakFrameAudit(m, t), ctn = Math.max(0, f.ct * (1 + (nz.value / 100) * zf[q])), cp = f.cp; sampled.push(ctn);
            const X = f.cum / cp, Y = ctn / cp; xs.push(X); ys.push(Y);
            if (t >= ts.value) { fx_.push(X); fy.push(Y); }
          });
          const f = fy.length >= 2 ? fitLine(fx_, fy) : { slope: 0, intercept: 0 };
          const xmax = Math.max(...xs) * 1.08, yline = [f.intercept, f.intercept + f.slope * xmax], ymin = Math.min(0, ...ys, ...yline), ymax = Math.max(...ys, ...yline, 0.01), pad = 0.08 * (ymax - ymin);
          A.setView([0, 90], [0, Math.max(...m.cp, ...m.ct, ...sampled) * 1.12]);
          A.path(Array.from(m.t, (t, i) => [t, m.cp[i]]), { color: 'orange', width: 2.2 });
          A.path(Array.from(m.t, (t, i) => [t, m.ct[i]]), { color: 'accent', width: 2.2 });
          FR.forEach((t, q) => A.dot(t, sampled[q], { r: 3.5, color: 'accent' }));
          B.setView([0, xmax], [ymin - pad, ymax + pad]);
          xs.forEach((X, q) => B.dot(X, ys[q], { r: 4, color: FR[q] >= ts.value ? 'green' : 'muted', hollow: FR[q] < ts.value }));
          B.line(0, f.intercept, xmax, f.intercept + f.slope * xmax, { color: 'green', width: 2, dash: true });
          const kiTrue = (K1.value * k3.value) / (k2.value + k3.value);
          A.vline(ts.value, { color: 'gold', dash: true });
          // tissue max for y range
          info = { ki: f.slope, v0: f.intercept, kiTrue, err: f.slope - kiTrue, npts: fx_.length, cpMax: Math.max(...m.cp), ctMax: Math.max(...m.ct) };
        });
        v.legend([['orange', 'plasma $C_p$'], ['accent', 'tissue $C_T$ (model; dots = frames)'], ['green', 'frames used in the fit']]);
        v.readout(() => `Fit of ${info.npts} late samples: slope $=${fx(info.ki, 4)}$ mL/g/min; intercept $=${fx(info.v0, 3)}$ mL/g. ${k4.value > 0 ? 'Leak-free benchmark' : 'Irreversible model value'} $K_1k_3/(k_2+k_3)=${fx(info.kiTrue, 4)}$ mL/g/min; signed difference $=${fx(info.err, 4)}$ mL/g/min.${info.kiTrue > 0 ? ` Relative difference ${fx(100 * info.err / info.kiTrue, 1)}%.` : ' The benchmark is zero, so relative error is undefined.'}${k4.value > 0 ? ' With a leaking trap, this benchmark is not an irreversible influx parameter of the displayed model.' : ' Approximate agreement requires a suitable linear fitting window.'}`);
      },
    },
  ],
};
