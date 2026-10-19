// Medical Imaging — Chapter 1: Imaging systems and image quality
// Part 2 (this file): 1.6–1.10 — contrast, noise and SNR; Poisson counting noise; the Rose criterion; FWHM and the Rayleigh
// criterion; observer performance and ROC analysis. Part 1 (ch01.js): 1.1–1.5.
import { bindM, clamp, fx, pt, pct, mean, sd, showImage, frame, noiseField, poissonFrom, airy, TAU } from './ch01.shared.js';

export default {
  collection: 'imaging',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Concept',
      name: 'Contrast, noise and signal-to-noise ratio',
      statement: String.raw`Let an object of mean signal $\mu_{\rm obj}$ lie on a background of mean $\mu_{\rm bg}$, with pixel noise of standard deviation $\sigma$ in the background. The **contrast** is $C=(\mu_{\rm obj}-\mu_{\rm bg})/\mu_{\rm bg}$, the **signal-to-noise ratio** is $\mathrm{SNR}=\mu_{\rm bg}/\sigma$, and the **contrast-to-noise ratio** is
$$\mathrm{CNR}=\frac{\mu_{\rm obj}-\mu_{\rm bg}}{\sigma}=C\cdot\mathrm{SNR}.$$
Visibility of a faint feature is governed by CNR, not by contrast or SNR alone: a high-SNR image can hide a low-contrast lesion, and a high-contrast lesion can drown in noise. Two pixel populations whose means differ by CNR standard deviations overlap less the larger the CNR.`,
      idea: String.raw`A decision between "lesion" and "background" is a decision between two noisy populations. Their separation, measured in units of the noise, is the only thing that matters when the noise is roughly Gaussian and the same in both: the overlap of two bell curves $\mu$ and $\mu+\Delta$ with common $\sigma$ depends on $\Delta/\sigma$ alone. Contrast alone (the numerator) ignores how large the fluctuations are; SNR alone ignores how different the object is from its surroundings. Averaging $n$ independent pixels, or frames, divides $\sigma$ by $\sqrt n$, which is how a large lesion becomes visible at the same CNR per pixel.`,
      caption: String.raw`Set the lesion contrast, the noise level and the disc radius. The dashed circles are the measurement regions (a disc inside the lesion and a ring of equal area outside). The histograms show the pixel values of the two regions: separated peaks give a clearly visible disc, overlapping ones an invisible one. Every readout is measured from the pixels, not from the sliders. "New noise" draws another realisation.`,
      deps: [],
      tags: ['contrast', 'noise', 'SNR'],
      refs: ['Prince–Links ch. 3'],
      viz(v) {
        bindM(v.M);
        const N = 128, MU = 100, M = v.M;
        const I = v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 300, minWidth: 250, title: 'faint disc in noise' });
        const H = v.stage({ x: [20, 190], y: [0, 0.1], axes: 'box', gutter: true, height: 300, minWidth: 280, xlabel: 'pixel value (arbitrary units)', ylabel: 'frequency', title: 'pixel values in the two regions' });
        const con = v.slider('contrast $C$ (%)', 0, 40, 12, { step: 0.5 });
        const nz = v.slider('noise $\\sigma$ (units)', 1, 40, 10, { step: 0.5 });
        const rad = v.slider('disc radius (px)', 6, 40, 22, { step: 1 });
        let seed = 7, z = null;
        v.button('new noise', () => { seed += 1; z = null; });
        const field = () => { if (!z) { const r = v.rng(seed); z = Float64Array.from({ length: N * N }, () => r.normal()); } return z; };
        let S = null, img = null, key = '';
        v.render(() => {
          const zz = field(), R = rad.value, C = con.value / 100, s = nz.value;
          const k = `${seed}|${R}|${C}|${s}`;
          if (k !== key) {
            key = k; img = new Float64Array(N * N);
            for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
              const r = Math.hypot(i + 0.5 - N / 2, j + 0.5 - N / 2);
              img[j * N + i] = MU * (1 + (r <= R ? C : 0)) + s * zz[j * N + i];
            }
          }
          showImage(I, img, N, N, { lo: 40, hi: 160 }); frame(I, N, N);
          const rin = 0.8 * R, r1 = 1.25 * R, r2 = Math.sqrt(r1 * r1 + rin * rin);
          const a = [], b = [];
          for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
            const r = Math.hypot(i + 0.5 - N / 2, j + 0.5 - N / 2);
            if (r <= rin) a.push(img[j * N + i]); else if (r >= r1 && r <= r2) b.push(img[j * N + i]);
          }
          I.circle(N / 2, N / 2, rin, { color: 'orange', dash: true, width: 2 });
          I.circle(N / 2, N / 2, r1, { color: 'teal', dash: true, width: 2 }); I.circle(N / 2, N / 2, r2, { color: 'teal', dash: true, width: 2 });
          const bins = 44, range = [20, 190];
          const ha = M.histogram(a, { bins, range, density: true }), hb = M.histogram(b, { bins, range, density: true });
          const ymax = Math.max(...ha.density, ...hb.density, 0.02) * 1.15;
          H.setView([20, 190], [0, ymax]);
          H.hist(b, { bins, range, density: true, color: 'teal', fillAlpha: 0.35 }); H.hist(a, { bins, range, density: true, color: 'orange', fillAlpha: 0.35 });
          const ma = mean(a), mb = mean(b), sb = sd(b);
          S = { ma, mb, sb, cm: (ma - mb) / mb, cnr: (ma - mb) / sb, snr: mb / sb, nA: a.length, nB: b.length };
        });
        v.legend([['orange', 'inside the disc'], ['teal', 'background ring']]);
        v.readout(() => {
          if (!S) return '';
          const vis = S.cnr > 1.5 ? 'comfortably separated' : S.cnr > 0.7 ? 'overlapping' : 'almost indistinguishable';
          return `Measured: $\\mu_{\\rm obj}=${fx(S.ma, 1)}$, $\\mu_{\\rm bg}=${fx(S.mb, 1)}$, $\\sigma_{\\rm bg}=${fx(S.sb, 2)}$ (${S.nA} and ${S.nB} pixels).\n$C=${fx(100 * S.cm, 1)}\\%$, $\\mathrm{SNR}=\\mu_{\\rm bg}/\\sigma=${fx(S.snr, 1)}$, $\\mathrm{CNR}=${fx(S.cnr, 2)}$ (expected from the sliders: $${fx((MU * con.value) / 100 / nz.value, 2)}$) — the two populations are ${vis}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Concept',
      name: 'Poisson counting noise: SNR ∝ √N',
      statement: String.raw`When an image is formed by counting $N$ independent quanta (photons, gamma rays) per pixel, with mean $\bar N$ determined by the object and the dose, the count is Poisson distributed: $P(N=n)=e^{-\bar N}\bar N^{\,n}/n!$ with variance equal to the mean, $\operatorname{var}N=\bar N$. Hence the noise is $\sigma=\sqrt{\bar N}$ and
$$\mathrm{SNR}=\frac{\bar N}{\sqrt{\bar N}}=\sqrt{\bar N}\ \propto\ \sqrt{\text{dose}} .$$
Quadrupling the dose halves the relative noise $\sigma/\bar N=1/\sqrt{\bar N}$; noise grows with the signal in absolute terms but shrinks relative to it. In an additive Gaussian noise model with fixed $\sigma$, by contrast, SNR grows linearly with the signal.`,
      idea: String.raw`Counting events in a short interval is the rare-event limit of many independent trials (the Poisson distribution, prob-1.6.13), and the variance of a Poisson variable equals its mean. Divide the mean by the standard deviation and the square root appears. Because sums of independent Poisson counts are Poisson, raising the dose by a factor $k$ multiplies the mean by $k$ and the standard deviation by $\sqrt k$. For large $\bar N$ the Poisson law is close to a Gaussian of variance $\bar N$, so the central-limit picture (a bell curve whose width grows as $\sqrt{\bar N}$) is a good guide.`,
      caption: String.raw`Drag the dose (mean photons per pixel in the brightest disc) and watch the picture build up from a few scattered counts to a clean image. The right plot shows the SNR measured in two regions of the picture against dose on log-log axes: Poisson points follow a line of slope $\tfrac12$. Switch to additive Gaussian noise and the slope becomes 1. The readout compares the measured relative noise at your dose with that at four times the dose.`,
      deps: ['imaging-1.6', 'prob-1.6.13'],
      tags: ['Poisson', 'dose', 'noise'],
      refs: ['Prince–Links ch. 3'],
      scope: String.raw`Counts are independent and the object's mean count per pixel is fixed (no scatter, no detector blur, no electronic noise). Pixel counts above 40 are generated from the normal approximation to the Poisson law; below that, by exact inversion.`,
      viz(v) {
        bindM(v.M);
        const N = 128, M = v.M, GS = 3;
        const I = v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 320, minWidth: 260, title: 'counts ÷ dose (displayed 0 – 1.3)' });
        const P = v.stage({ x: [0.05, 5000], y: [0.05, 300], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'dose (mean counts per pixel at intensity 1)', ylabel: 'measured SNR in the ROI', title: 'SNR against dose' });
        const dose = v.slider('dose', 0.05, 5000, 20, { log: true, sig: 2 });
        const model = v.select('noise model', [{ value: 'poisson', label: 'Poisson (counting)' }, { value: 'gauss', label: 'additive Gaussian, fixed $\\sigma=3$' }], 'poisson');
        // phantom: four discs of intensity 1, 0.5, 0.2, 0.05 inside a disc of 0.35
        const F = new Float64Array(N * N), cen = [[40, 40, 1], [88, 40, 0.5], [40, 88, 0.2], [88, 88, 0.05]];
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
          const x = i + 0.5, y = j + 0.5; let f = Math.hypot(x - 64, y - 64) <= 60 ? 0.35 : 0.02;
          for (const [cx, cy, val] of cen) if (Math.hypot(x - cx, y - cy) <= 20) f = val;
          F[j * N + i] = f;
        }
        const nf = noiseField(M, v.rng(11), N * N);
        const roi = (cx, cy) => { const o = []; for (let j = cy - 10; j < cy + 10; j++) for (let i = cx - 10; i < cx + 10; i++) o.push(j * N + i); return o; };
        const ROI = [{ q: roi(40, 40), I: 1, color: 'orange', cx: 40, cy: 40, name: 'A' }, { q: roi(40, 88), I: 0.2, color: 'teal', cx: 40, cy: 88, name: 'B' }];
        const counts = (d, mod) => {
          const o = new Float64Array(N * N);
          for (let q = 0; q < o.length; q++) { const lam = d * F[q]; o[q] = mod === 'poisson' ? poissonFrom(lam, nf.u[q], nf.z[q]) : lam + GS * nf.z[q]; }
          return o;
        };
        const stat = (o, r) => { const a = r.q.map((q) => o[q]); const m = mean(a), s = sd(a); return { m, s, snr: s > 0 ? m / s : NaN, v: s * s }; };
        const grid = Array.from({ length: 17 }, (_, i) => 0.05 * Math.pow(5000 / 0.05, i / 16));
        const cacheGrid = {};
        const curves = (mod) => cacheGrid[mod] || (cacheGrid[mod] = grid.map((d) => { const o = counts(d, mod); return ROI.map((r) => stat(o, r).snr); }));
        let S = null, cur = null, ckey = '';
        v.render(() => {
          const d = dose.value, mod = model.value, k = `${d}|${mod}`;
          if (k !== ckey) { ckey = k; cur = counts(d, mod); cur = Float64Array.from(cur, (x) => x / d); cur.raw = null; }
          showImage(I, cur, N, N, { lo: 0, hi: 1.3 }); frame(I, N, N);
          for (const r of ROI) I.rect(r.cx - 10, N - r.cy - 10, r.cx + 10, N - r.cy + 10, { color: r.color, width: 2 });
          for (const r of ROI) I.text(r.name, r.cx, N - r.cy + 14, { align: 'center', size: 13, color: r.color, plate: true });
          const cv = curves(mod);
          ROI.forEach((r, ri) => {
            P.path(grid.map((g) => [g, mod === 'poisson' ? Math.sqrt(g * r.I) : (g * r.I) / GS]), { color: r.color, width: 1.4, alpha: 0.55, dash: true });
            P.dots(grid.map((g, gi) => (isFinite(cv[gi][ri]) && cv[gi][ri] > 0 ? [g, cv[gi][ri]] : null)).filter(Boolean), { r: 3.2, color: r.color });
          });
          P.vline(d, { color: 'gold', width: 2 });
          const raw = counts(d, mod), raw4 = counts(4 * d, mod);
          const sa = ROI.map((r) => stat(raw, r)), s4 = stat(raw4, ROI[0]);
          S = { d, mod, sa, rel: sa[0].s / sa[0].m, rel4: s4.s / s4.m };
        });
        v.legend([['orange', 'ROI A: intensity 1 (squares in the picture)'], ['teal', 'ROI B: intensity 0.2'], ['ink', 'dashed: theory, dots: measured', { dash: true }]]);
        v.readout(() => {
          if (!S) return '';
          const [a, b] = S.sa, po = S.mod === 'poisson';
          return `Dose $${fx(S.d, S.d < 10 ? 2 : 0)}$: ROI A mean $${fx(a.m, 1)}$, $\\mathrm{SNR}=${fx(a.snr, 2)}$ ${po ? `(theory $\\sqrt{\\bar N}=${fx(Math.sqrt(S.d), 2)}$)` : `(theory $\\bar N/\\sigma=${fx(S.d / GS, 2)}$)`}; ROI B mean $${fx(b.m, 1)}$, $\\mathrm{SNR}=${fx(b.snr, 2)}$.\nRelative noise $\\sigma/\\mu$ in A: $${fx(S.rel, 3)}$ at this dose, $${fx(S.rel4, 3)}$ at four times the dose — ratio $${fx(S.rel4 / S.rel, 2)}$ (${po ? 'Poisson predicts 0.50' : 'fixed-σ noise predicts 0.25'}).${po ? `\nVariance ÷ mean: A $${fx(a.v / a.m, 2)}$, B $${fx(b.v / b.m, 2)}$ — both near 1, as the Poisson law says.` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Concept',
      name: 'Rose criterion for detectability',
      statement: String.raw`Consider a uniform disc of area $A$ (in pixels) and contrast $C$ on a background of mean $\Phi$ photons per pixel, imaged with Poisson noise. Summing the counts over the disc, the signal excess is $\Delta N=C\Phi A$ and the noise is $\sqrt{\Phi A}$, so the signal-to-noise ratio of the disc is
$$\mathrm{SNR}_{\rm disc}=C\sqrt{\Phi A}.$$
**Rose's criterion** is the empirical finding that a human observer reliably detects such an object when this SNR exceeds a threshold $k$ of about 5 (published values run from about 4 to 7). On a plot of contrast against size, the boundary $C\,d=2k/\sqrt{\pi\Phi}$ for a disc of diameter $d$ is therefore a straight line of slope $-1$ on log–log axes that moves down as the dose $\Phi$ rises.`,
      idea: String.raw`Detection amounts to asking whether the extra counts in a region exceed the fluctuation of the counts there. Poisson counting (1.7) makes the fluctuation $\sqrt{\Phi A}$ and the extra counts $C\Phi A$, so large faint objects and small contrasty ones are equally visible when $C\sqrt{A}$ is the same. The number $k$ is not a theorem: it comes from experiments on human observers, who need the excess to be several standard deviations high to avoid false alarms when searching a whole image, and who are less efficient than an ideal observer.`,
      caption: String.raw`Left: a chart of discs, contrast falling down the rows and diameter growing along the columns, in a Poisson image at the dose you choose. Rings mark discs whose measured disc statistic (the matched-filter sum of the counts over the disc relative to the local background, in noise units) exceeds the threshold $k$. Right: the same discs on the contrast–size chart with the boundary $\mathrm{SNR}=k$; dots turn green when measured above $k$. Lower the dose and the boundary sweeps up the chart; raise it and fainter, smaller discs appear. The ring can disagree with the line for discs near it: one noise realisation gives a random number with spread 1 about the expected SNR.`,
      deps: ['imaging-1.7'],
      tags: ['Rose criterion', 'detectability'],
      refs: ['Prince–Links ch. 3'],
      credit: 'A. Rose, 1948 (human-vision threshold on an absolute scale)',
      scope: String.raw`Uniform discs of known position on a uniform Poisson background, with an observer who averages the counts over the whole disc. The numerical threshold $k$ is an empirical value for human observers (commonly quoted as about 5), not a mathematical constant.`,
      viz(v) {
        bindM(v.M);
        const CELL = 21, DIA = [2, 3, 4, 6, 9, 13], CON = [0.5, 0.3, 0.2, 0.12, 0.07, 0.04], W = CELL * 6, M = v.M;
        const I = v.stage({ x: [-16, W], y: [-14, W], equal: true, axes: false, height: 340, minWidth: 280, title: 'disc chart in Poisson noise' });
        const P = v.stage({ x: [1.5, 18], y: [0.025, 0.8], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, minWidth: 290, xlabel: 'disc diameter $d$ (pixels)', ylabel: 'contrast $C$', title: 'contrast–size chart' });
        const dose = v.slider('dose $\\Phi$ (counts/pixel)', 3, 3000, 60, { log: true, sig: 2 });
        const kS = v.slider('threshold $k$', 2, 8, 5, { step: 0.1 });
        const nf = noiseField(M, v.rng(5), W * W);
        // coverage of each pixel by each disc (3×3 supersampling), cached
        const cover = [];
        for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
          const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2, d = DIA[c], list = [];
          for (let j = r * CELL; j < (r + 1) * CELL; j++) for (let i = c * CELL; i < (c + 1) * CELL; i++) {
            let s = 0; for (let q = 0; q < 3; q++) for (let p = 0; p < 3; p++) s += Math.hypot(i + (p + 0.5) / 3 - cx, j + (q + 0.5) / 3 - cy) <= d / 2 ? 1 : 0;
            list.push([j * W + i, s / 9]);
          }
          cover.push({ r, c, d, C: CON[r], list });
        }
        let img = null, key = '', S = null;
        v.render(() => {
          const Phi = dose.value, k = kS.value;
          if (key !== String(Phi)) {
            key = String(Phi); img = new Float64Array(W * W);
            const lam = new Float64Array(W * W).fill(Phi);
            for (const d of cover) for (const [q, c] of d.list) lam[q] = Phi * (1 + d.C * c);
            for (let q = 0; q < img.length; q++) img[q] = poissonFrom(lam[q], nf.u[q], nf.z[q]);
          }
          const sh = Float64Array.from(img, (x) => x / Phi);
          sh.key = Phi; const shown = cacheShow(Phi, sh);
          showImage(I, shown, W, W, { lo: 0.4, hi: 1.9 }); frame(I, W, W);
          let above = 0, agree = 0, below = 0, belowSeen = 0, aboveSeen = 0;
          const pts = [];
          for (const d of cover) {
            const bgPix = d.list.filter(([, c]) => c === 0), bg = bgPix.reduce((s, [q]) => s + img[q], 0) / bgPix.length;
            let num = 0, den = 0, ae = 0; for (const [q, c] of d.list) { num += c * (img[q] - bg); den += c * c; ae += c * c; }
            const t = num / Math.sqrt(Math.max(1e-9, bg) * den), exp = d.C * Math.sqrt(Phi * ae);
            const cx = d.c * CELL + CELL / 2, cy = W - (d.r * CELL + CELL / 2);
            const seen = t >= k, should = exp >= k;
            if (should) { above++; if (seen) aboveSeen++; } else { below++; if (seen) belowSeen++; }
            I.circle(cx, cy, d.d / 2 + 2.6, { color: seen ? 'green' : 'red', width: seen ? 2 : 1, alpha: seen ? 1 : 0.35, dash: !seen });
            pts.push([d.d, d.C, seen]);
          }
          DIA.forEach((dd, c) => I.text(String(dd), c * CELL + CELL / 2, -6, { align: 'center', size: 12, color: 'muted' }));
          CON.forEach((cc, r) => I.text(`${Math.round(cc * 100)}%`, -2, W - (r * CELL + CELL / 2), { align: 'right', size: 12, color: 'muted' }));
                // chart: boundary C = 2k / (d sqrt(pi Phi)), region above it is "visible"
          const bnd = (d) => (2 * k) / (d * Math.sqrt(Math.PI * Phi));
          const ds = Array.from({ length: 40 }, (_, i) => 1.5 * Math.pow(18 / 1.5, i / 39));
          P.poly([...ds.map((d) => [d, Math.min(0.8, bnd(d))]), [18, 0.8], [1.5, 0.8]], { fill: 'green', fillAlpha: 0.1, stroke: false });
          P.path(ds.map((d) => [d, bnd(d)]), { color: 'green', width: 2.6 });
          for (const [d, C, seen] of pts) P.dot(d, C, { r: 6, color: seen ? 'green' : 'red', hollow: !seen });
          S = { above, aboveSeen, below, belowSeen, Phi, k };
        });
        const showCache = new Map();
        function cacheShow(Phi, sh) { if (!showCache.has(Phi)) { if (showCache.size > 30) showCache.clear(); showCache.set(Phi, sh); } return showCache.get(Phi); }
        v.legend([['green', 'measured SNR ≥ k'], ['red', 'measured SNR < k', { dot: true }], ['green', 'boundary SNR = k (theory)']]);
        v.readout(() => {
          if (!S) return '';
          return `At $\\Phi=${fx(S.Phi, S.Phi < 100 ? 1 : 0)}$ counts/pixel and $k=${fx(S.k, 1)}$: the theory line puts ${S.above} of the 36 discs above the boundary, and ${S.aboveSeen} of those reach $k$ in this noise realisation; of the ${S.below} discs below the line, ${S.belowSeen} reach $k$ by chance. The boundary is $C\\,d=${fx((2 * S.k) / Math.sqrt(Math.PI * S.Phi), 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Concept',
      name: 'Spatial resolution: FWHM and the Rayleigh criterion',
      statement: String.raw`The **full width at half maximum** (FWHM) of the point spread function — the width of the PSF where it has fallen to half its peak — is the standard single number for spatial resolution; for a Gaussian, $\mathrm{FWHM}=2\sqrt{2\ln2}\,\sigma\approx2.355\,\sigma$. Two equal point sources are said to be resolved if the sum of their blurred images has a dip between two peaks. The **Rayleigh criterion** puts the limit at the separation for which the maximum of one image falls on the first zero of the other; for the Airy pattern of a circular aperture that is $1.22\,\lambda N$ ($N$ the f-number), about $1.19$ FWHM, with a dip to about $73.5\%$ of the peak. A Gaussian PSF has no zero, so Sparrow's criterion (the dip just disappears) is used: separation $2\sigma\approx0.85$ FWHM. In practice, resolution is of the order of one FWHM.`,
      idea: String.raw`The image of two points is $h(x-x_1)+h(x-x_2)$ by linearity (1.1), so resolution is a question about the shape of a sum of two shifted copies of $h$. For close points the sum is a single hump; as the separation grows, a shallow dip forms at the midpoint, which deepens until the humps stand apart. Where one declares "resolved" is a convention — Rayleigh's, Sparrow's, or whatever dip the noise allows the reader to see — which is why the FWHM is quoted instead: it is a property of $h$ alone, and every convention lands within about 20% of it.`,
      caption: String.raw`Drag source $B$ along the line toward $A$ (or press the button for a separation of exactly one FWHM). The profile through both centres is the sum of two PSFs; the readout gives the dip measured at the midpoint. With the Gaussian PSF a dip first appears at 0.85 FWHM, and is only 6% deep at one FWHM; the Airy pattern at the Rayleigh separation shows its classic 26% dip. Change the FWHM and all separations rescale.`,
      deps: ['imaging-1.2', 'waves-7.7'],
      tags: ['resolution', 'FWHM', 'Rayleigh criterion'],
      refs: ['Prince–Links ch. 3'],
      credit: 'Lord Rayleigh, 1879 (criterion); C. M. Sparrow, 1916',
      viz(v) {
        bindM(v.M);
        const N = 96, XA = 30, YC = N / 2;
        const I = v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 270, minWidth: 250, title: 'image of two point sources (display gamma 0.5)' });
        const P = v.stage({ x: [0, N], y: [0, 1.2], axes: 'box', gutter: true, height: 270, minWidth: 300, xlabel: 'position along the line through the sources (pixels)', ylabel: 'intensity', title: 'profile' });
        const typ = v.select('PSF', [{ value: 'gauss', label: 'Gaussian' }, { value: 'airy', label: 'Airy (circular aperture)' }], 'gauss');
        const fw = v.slider('FWHM (px)', 4, 24, 14, { step: 0.5 });
        const hB = I.handle(XA + 14, YC, { color: 'teal', label: 'B', constrain: (x) => [clamp(x, XA + 1, N - 6), YC] });
        const hA = I.handle(XA, YC, { color: 'orange', label: 'A', constrain: () => [XA, YC] });
        v.button('separate by one FWHM', () => { hB.set(XA + fw.value, YC); });
        // half-maximum radius of the Airy pattern in units rho = r/(lambda N)
        let lo = 0.1, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (airy(m) > 0.5) lo = m; else hi = m; }
        const RHO_HALF = lo, AIRY_ZERO = 1.2196699, AIRY_FWHM = 2 * RHO_HALF;
        const psf = (r, w, t) => (t === 'gauss' ? Math.exp((-4 * Math.LN2 * r * r) / (w * w)) : airy((r * AIRY_FWHM) / w));
        let S = null, ver = 0;
        v.render(() => {
          const w = fw.value, t = typ.value, xb = hB.x, sep = xb - XA;
          const img = new Float64Array(N * N);
          for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
            const x = i + 0.5, y = N - j - 0.5;
            img[j * N + i] = psf(Math.hypot(x - XA, y - YC), w, t) + psf(Math.hypot(x - xb, y - YC), w, t);
          }
          showImage(I, img, N, N, { lo: 0, hi: 1.25, gamma: 0.5, id: 'i', extra: `${ver++}` }); frame(I, N, N);
          const f1 = (x) => psf(Math.abs(x - XA), w, t), f2 = (x) => psf(Math.abs(x - xb), w, t), fs = (x) => f1(x) + f2(x);
          P.fn(f1, { domain: [0, N], color: 'orange', width: 1.6, dash: true }); P.fn(f2, { domain: [0, N], color: 'teal', width: 1.6, dash: true });
          P.fn(fs, { domain: [0, N], color: 'accent', width: 2.6, n: 600 });
          P.measure(XA - w / 2, 0.5, XA + w / 2, 0.5, 'FWHM');
          // peaks and dip
          const xs = Array.from({ length: 1201 }, (_, i) => XA - 20 + ((xb - XA + 40) * i) / 1200), ys = xs.map(fs);
          const peaks = []; for (let i = 1; i < xs.length - 1; i++) if (ys[i] > ys[i - 1] && ys[i] >= ys[i + 1] && ys[i] > 0.05) peaks.push(i);
          const mid = fs((XA + xb) / 2), pk = Math.min(...peaks.map((i) => ys[i]));
          const two = peaks.length >= 2, dip = two ? 1 - mid / pk : 0;
          if (two) { P.dot((XA + xb) / 2, mid, { r: 5, color: 'red' }); P.line((XA + xb) / 2, mid, (XA + xb) / 2, pk, { color: 'red', width: 2 }); }
          S = { sep, w, t, dip, two, xs, ys };
        });
        v.legend([['orange', 'image of A', { dash: true }], ['teal', 'image of B', { dash: true }], ['accent', 'sum = what the detector sees']]);
        v.readout(() => {
          if (!S) return '';
          const r = S.sep / S.w;
          const crit = S.t === 'gauss' ? `Sparrow: dip appears at $2\\sigma=${fx(2 / (2 * Math.sqrt(2 * Math.LN2)), 3)}$ FWHM.` : `Rayleigh separation $1.22\\lambda N=${fx(AIRY_ZERO / AIRY_FWHM, 3)}$ FWHM (computed from the Airy pattern's first zero and half-maximum).`;
          return `Separation $=${fx(S.sep, 1)}$ px $=${fx(r, 2)}$ FWHM. ${S.two ? `Two peaks with a dip of $${fx(100 * S.dip, 1)}\\%$ at the midpoint: **resolved**` : 'A single peak, no dip: **not resolved**'}.\n${crit}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Concept',
      name: 'Observer performance and ROC analysis',
      statement: String.raw`To test how well readers (human or algorithmic) detect a lesion, they rate a set of images, some with and some without it. For each threshold on the rating, the **true-positive fraction** (sensitivity) among lesion-present images and the **false-positive fraction** ($1-$specificity) among lesion-absent images give one point; the **receiver operating characteristic (ROC) curve** plots all of them. The area under it, $\mathrm{AUC}$, is the probability that a random lesion-present image is rated higher than a random lesion-absent one: 0.5 is guessing, 1 is perfect. For Gaussian rating distributions with equal variance and means separated by $d'$ standard deviations, $\mathrm{AUC}=\Phi(d'/\sqrt2)$, and for a known signal in white noise the ideal (matched-filter) observer reaches $d'=\sqrt{\sum_i s_i^2}/\sigma$.`,
      idea: String.raw`The ROC curve removes the arbitrary choice of a decision threshold: moving the threshold slides the operating point along one curve, and the curve itself depends only on how separated the two score distributions are (1.6: separation over noise). Raising the dose reduces the noise relative to the lesion signal (1.7), so $d'$ grows as $\sqrt{\text{dose}}$, the score distributions separate, and the curve bows toward the top left corner. A reader who uses the wrong template, or who adds internal noise, loses part of the available $d'$ and gets a smaller AUC at the same dose.`,
      caption: String.raw`Left: sample images of the lesion-present (left column) and lesion-absent (right column) classes at four doses, rising downward. 200 images of each class are simulated at every dose and scored by the chosen observer; the staircase curves are the empirical ROC curves, the dashed ones the binormal theory with $d'$ from the formula, and the dots are the five-category rating operating points at fixed criteria. The right panel compares measured AUC with theory against dose. Try a wrong-size template or internal noise.`,
      deps: ['epi-2.5', 'imaging-1.8'],
      tags: ['ROC', 'observer'],
      refs: ['Prince–Links ch. 3'],
      scope: String.raw`Known lesion position and profile on a flat Poisson background (signal-known-exactly, background-known-exactly). Readers are simulated: a linear template observer with optional internal noise, not human readers.`,
      viz(v) {
        bindM(v.M);
        const M = v.M, S0 = 24, NIMG = 200, MULT = [0.25, 1, 4, 16], COL = ['purple', 'blue', 'teal', 'green'];
        const T = v.stage({ x: [-16, 2 * (S0 + 3)], y: [-2, 4 * (S0 + 3) + 10], equal: true, axes: false, height: 320, minWidth: 200, title: 'sample images, dose rising downward' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 320, minWidth: 280, xlabel: 'false-positive fraction', ylabel: 'true-positive fraction', title: 'ROC curves' });
        const A = v.stage({ x: [0.1, 2000], y: [0.45, 1.02], xlog: true, axes: 'box', gutter: true, height: 320, minWidth: 280, xlabel: 'dose (counts per pixel)', ylabel: 'AUC', title: 'area under the curve' });
        const con = v.slider('lesion contrast $C$ (%)', 2, 30, 10, { step: 1 });
        const base = v.slider('base dose (counts/pixel)', 0.5, 40, 2, { log: true, sig: 2 });
        const dia = v.slider('lesion diameter (px)', 4, 14, 8, { step: 1 });
        const obs = v.select('observer', [{ value: 'match', label: 'matched template' }, { value: 'wrong', label: 'template 2.2× too large' }], 'match');
        const intn = v.slider('internal noise (× score noise)', 0, 2, 0, { step: 0.1 });
        const prof = (d, sc = 1) => { const p = new Float64Array(S0 * S0), c = S0 / 2; for (let j = 0; j < S0; j++) for (let i = 0; i < S0; i++) p[j * S0 + i] = Math.hypot(i + 0.5 - c, j + 0.5 - c) <= (d * sc) / 2 ? 1 : 0; return p; };
        const nd = M.dist.normal(0, 1);
        const pois = (r, lam) => { if (lam >= 30) return Math.max(0, Math.round(lam + Math.sqrt(lam) * r.normal())); const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; };
        const cache = {};
        function simulate(Phi, C, d, ob, kin) {
          const r = v.rng(1234 + Math.round(Phi * 100)), sig = prof(d), w = ob === 'match' ? sig : prof(d, 2.2);
          const mk = (present) => { const x = new Float64Array(S0 * S0); for (let q = 0; q < x.length; q++) x[q] = pois(r, Phi * (1 + (present ? C * sig[q] : 0))); return x; };
          const score = (x) => { let t = 0; for (let q = 0; q < x.length; q++) t += w[q] * (x[q] - Phi); return t; };
          const pos = [], neg = [];
          for (let n = 0; n < NIMG; n++) { pos.push(score(mk(true))); neg.push(score(mk(false))); }
          const tiles = [mk(true), mk(false)];
          // theory: d' of the template w for the expected signal s = Phi C sig, noise variance Phi per pixel
          let sw = 0, ww = 0; for (let q = 0; q < w.length; q++) { sw += w[q] * Phi * C * sig[q]; ww += w[q] * w[q]; }
          const dth = sw / Math.sqrt(Phi * ww);
          return { pos, neg, tiles, dth };
        }
        let S = null;
        v.render(() => {
          const C = con.value / 100, d = dia.value, ob = obs.value, kin = intn.value, B = base.value;
          const key = `${C}|${d}|${ob}|${B}|${kin}`;
          if (cache.key !== key) {
            cache.key = key;
            const sims = MULT.map((m) => simulate(B * m, C, d, ob, kin));
            // internal noise: add Gaussian noise with sd = kin × (null score sd of this dose) to every score, deterministic
            sims.forEach((s, i) => {
              const sdN = sd(s.neg), r = v.rng(99 + i);
              s.pos = s.pos.map((x) => x + kin * sdN * r.normal()); s.neg = s.neg.map((x) => x + kin * sdN * r.normal());
              s.mu0 = mean(s.neg); s.sd0 = sd(s.neg);
              // empirical ROC (all thresholds)
              const all = [...s.pos.map((t) => [t, 1]), ...s.neg.map((t) => [t, 0])].sort((a, b) => b[0] - a[0]);
              let tp = 0, fp = 0; const pts = [[0, 0]];
              for (const [, lab] of all) { if (lab) tp++; else fp++; pts.push([fp / NIMG, tp / NIMG]); }
              s.roc = pts;
              let u = 0; for (const a of s.pos) for (const b of s.neg) u += a > b ? 1 : a === b ? 0.5 : 0;
              s.auc = u / (NIMG * NIMG);
              s.dEff = s.dth / Math.sqrt(1 + kin * kin);
              s.aucTh = nd.cdf(s.dEff / Math.SQRT2);
              // five-category rating operating points: criteria at fixed multiples of the null score sd of the BASE dose... use own null sd
              s.cuts = [0.5, 1.25, 2, 2.75].map((z) => { const th = s.mu0 + z * s.sd0; return [s.neg.filter((x) => x >= th).length / NIMG, s.pos.filter((x) => x >= th).length / NIMG]; });
            });
            cache.sims = sims;
            cache.curveTh = Array.from({ length: 41 }, (_, i) => { const Phi = 0.1 * Math.pow(20000, i / 40); const s = simulateTheory(Phi, C, d, ob); return [Phi, nd.cdf(s / Math.sqrt(1 + kin * kin) / Math.SQRT2)]; });
          }
          const sims = cache.sims;
          sims.forEach((s, i) => s.tiles.forEach((tile, row) => {
            const x0 = row * (S0 + 3) + 1.5, y0 = (3 - i) * (S0 + 3) + 1.5;
            T.raster((x, y) => { const ii = Math.floor(x - x0), jj = S0 - 1 - Math.floor(y - y0); if (ii < 0 || ii >= S0 || jj < 0 || jj >= S0) return null; const t = clamp((tile[jj * S0 + ii] / (B * MULT[i]) - 0.55) / 0.95, 0, 1), c = Math.round(255 * t); return [c, c, c]; }, { res: 1, id: `t${i}${row}`, rect: [x0, y0, x0 + S0, y0 + S0], key: `${key}|${i}${row}` });
          }));
          T.text('lesion present', (S0 + 3) / 2, 4 * (S0 + 3) + 4, { align: 'center', size: 11, color: 'muted' }); T.text('absent', (S0 + 3) * 1.5, 4 * (S0 + 3) + 4, { align: 'center', size: 11, color: 'muted' });
          MULT.forEach((m, i) => T.text(`${fx(B * m, B * m < 10 ? 1 : 0)}`, -2, (3 - i) * (S0 + 3) + (S0 + 3) / 2, { align: 'right', size: 11, color: COL[i] }));
          R.line(0, 0, 1, 1, { color: 'muted', dash: true, width: 1 });
          sims.forEach((s, i) => {
            R.path(s.roc, { color: COL[i], width: 2.4 });
            R.path(Array.from({ length: 81 }, (_, k) => { const f = k / 80, z = f <= 0 ? -8 : f >= 1 ? 8 : nd.quantile(f); return [f, nd.cdf(s.dEff + z)]; }), { color: COL[i], width: 1.2, dash: true, alpha: 0.7 });
            R.dots([[0, 0], ...s.cuts, [1, 1]].slice(1, 5), { r: 4, color: COL[i] });
          });
          A.path(cache.curveTh, { color: 'muted', width: 1.6, dash: true });
          A.hline(0.5, { color: 'faint', dash: true });
          sims.forEach((s, i) => A.dot(B * MULT[i], s.auc, { r: 6, color: COL[i] }));
          S = { sims, B };
        });
        function simulateTheory(Phi, C, d, ob) {
          const sig = prof(d), w = ob === 'match' ? sig : prof(d, 2.2); let sw = 0, ww = 0;
          for (let q = 0; q < w.length; q++) { sw += w[q] * Phi * C * sig[q]; ww += w[q] * w[q]; }
          return sw / Math.sqrt(Phi * ww);
        }
        v.legend([['purple', 'dose ×0.25'], ['blue', '×1'], ['teal', '×4'], ['green', '×16'], ['muted', 'dashed: theory', { dash: true }]]);
        v.readout(() => {
          if (!S) return '';
          const rows = S.sims.map((s, i) => `dose ${fx(S.B * MULT[i], S.B * MULT[i] < 10 ? 1 : 0)}: $d'=${fx(s.dEff, 2)}$, AUC $${fx(s.auc, 3)}$ (theory $${fx(s.aucTh, 3)}$)`);
          return `${rows.join('; ')}.\nEach AUC rests on 200 + 200 simulated images, so it carries a sampling error of about 0.03. The AUC rises with dose but never beyond 1; with internal noise or a wrong template it saturates at a lower value for the same $d'$ budget.`;
        });
      },
    },
  ],
};
