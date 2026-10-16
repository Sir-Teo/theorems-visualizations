// Medical Imaging — Chapter 3 (part 2): 3.6 simple back-projection, 3.7 filtered back-projection, 3.8 filter windows and noise,
// 3.9 fan-beam reconstruction, 3.10 angular sampling and view-aliasing streaks.
import {
  clamp, fx, mean, sd, showImage, frame, raster, ellAt, ellProj, slEllipses, makeScan, sinoEll, fbp, backproject, filterSino, makeFilter, winFn,
  fbpAt, fanScan, fanSino, fanFBP, fanRebin, rmse, rms, rng32, noiseField, poissonFrom,
} from './ch03.shared.js';

const PI = Math.PI;
const grey = (t) => { const c = Math.round(255 * clamp(t, 0, 1)); return [c, c, c]; };
const lin = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

export default {
  collection: 'imaging',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Algorithm',
      name: 'Simple back-projection and its 1/r blur',
      statement: String.raw`**Back-projection** assigns to every point $(x,y)$ the sum of the values that all projections give to the rays through it:
$$b(x,y)=\int_0^{\pi}p_\theta(x\cos\theta+y\sin\theta)\,d\theta .$$
It is the adjoint of the Radon transform, not its inverse: back-projecting the projections of a point source gives not a point but the blur $1/|\mathbf r-\mathbf r_0|$ centred on it, so in general $b=f*\dfrac1{|\mathbf r|}$ (convolution in the plane). Back-projection alone is therefore always a blurred version of the object, with a long $1/r$ halo.`,
      idea: String.raw`Rays through a point source all give it the same large value, so back-projecting puts the full value at the source; but every ray also deposits that value along its whole length, not only at the source. Each direction contributes a line; the lines pass through the source and spread out like spokes, so the density a distance $r$ away is $\int_0^\pi\delta\!\big(r\cos(\theta-\varphi)\big)d\theta=1/r$. The radial distribution is thus the same $1/r$ wherever the source is: the blur is shift-invariant, so $b=f*(1/r)$, and in the Fourier domain (3.4) the blur is $1/|\omega|$ — the reason the ramp filter $|\omega|$ undoes it (3.7).`,
      caption: String.raw`Drag the **point** (left panel; displayed on a log grey scale) and change the **number of views**: with few views the back-projection is a star of rays, with many a smooth halo. The middle panel plots the profile on log–log axes against the dashed $1/r$ line; the slope fitted to it is read out. Choose **phantom** to back-project the head phantom's real sinogram and compare the profile with the truth: everything is there, but washed out.`,
      deps: ['imaging-3.3'],
      tags: ['back-projection', 'point spread function'],
      refs: ['Kak–Slaney §3.3'],
      scope: String.raw`Parallel-beam, noise-free, with the continuous view integral replaced by $n$ equally spaced views; the point is a narrow Gaussian ($\sigma=0.02$ of the half-width) so that its projections are finite. The exact $1/r$ law is the limit of many views; the radial profile is measured to the right of the point.`,
      viz(v) {
        const Wp = 96, SG = 0.02;
        const PH = slEllipses(0.9), scp = makeScan(180, 140), sinoPh = sinoEll(PH, scp), truth = raster((x, y) => ellAt(PH, x, y), Wp, Wp, 2);
        const A = v.stage({ x: [0, Wp], y: [0, Wp], equal: true, axes: false, height: 300, title: 'Back-projection', minWidth: 240 });
        const B = v.stage({ x: [0.02, 1.2], y: [0.3, 80], xlog: true, ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'distance $r$ from the source', ylabel: 'back-projection value', title: 'Radial profile', minWidth: 260 });
        const nv = v.slider('number of views', 1, 180, 60, { step: 1, int: true });
        const obj = v.select('object', [{ value: 'pt', label: 'point source' }, { value: 'ph', label: 'head phantom' }], 'pt');
        const h = A.handle(Wp * 0.5, Wp * 0.5, { color: 'gold', r: 8 });
        const toX = (px) => (px / Wp) * 2 - 1, toY = (py) => (py / Wp) * 2 - 1;
        const bpPt = (x, y, x0, y0, n) => {
          let a = 0;
          for (let k = 0; k < n; k++) { const th = (k * PI) / n, d = x * Math.cos(th) + y * Math.sin(th) - (x0 * Math.cos(th) + y0 * Math.sin(th)); a += Math.exp(-(d * d) / (2 * SG * SG)) / (SG * Math.sqrt(2 * PI)); }
          return (a * PI) / n;
        };
        const phCache = new Map();
        let st = null;
        v.render(() => {
          const n = nv.value, ph = obj.value === 'ph';
          h.visible = !ph;
          if (!ph) {
            const x0 = toX(h.x), y0 = toY(h.y);
            const img = new Float64Array(Wp * Wp);
            for (let j = 0; j < Wp; j++) for (let i = 0; i < Wp; i++) img[j * Wp + i] = bpPt(-1 + ((i + 0.5) * 2) / Wp, 1 - ((j + 0.5) * 2) / Wp, x0, y0, n);
            const lg = Float64Array.from(img, (q) => Math.log10(Math.max(q, 0.05)));
            showImage(A, lg, Wp, Wp, { lo: -0.6, hi: 1.3, id: 'bp', extra: `L${n}|${x0.toFixed(3)}|${y0.toFixed(3)}` }); frame(A, Wp, Wp);
            A.dot(h.x, h.y, { r: 3, color: 'gold' });
            const rs = lin(Math.log(0.03), Math.log(1.2), 120).map(Math.exp);
            const prof = rs.map((r) => bpPt(x0 + r, y0, x0, y0, n)), g = rs.map((r) => 1 / r);
            B.setScale({ xlog: true, ylog: true, x: [0.02, 1.2], y: [0.3, 80] });
            B.setLabels('distance $r$ from the source', 'back-projection value');
            B.path(rs.map((r, i) => [r, Math.max(prof[i], 0.31)]), { color: 'accent', width: 2.4 });
            B.path(rs.map((r, i) => [r, g[i]]), { color: 'orange', width: 2, dash: true });
            // least-squares slope on r in [0.08, 0.6]
            const pts = rs.map((r, i) => [Math.log(r), Math.log(Math.max(prof[i], 1e-6))]).filter(([lr]) => lr > Math.log(0.08) && lr < Math.log(0.6));
            const mx = mean(pts.map((p) => p[0])), my = mean(pts.map((p) => p[1]));
            const sl = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
            const rb = [0.1, 0.3, 0.6].map((r) => r * bpPt(x0 + r, y0, x0, y0, n));
            st = { pt: true, sl, rb, n };
          } else {
            if (!phCache.has(n)) { if (phCache.size > 12) phCache.clear(); phCache.set(n, backproject(sinoPh, scp, Wp, Wp, n, 0, 180 / n)); }
            const bp = phCache.get(n); let mx = 0; for (const q of bp) mx = Math.max(mx, q);
            showImage(A, bp, Wp, Wp, { lo: 0, hi: mx, id: 'bpp', extra: `${n}` }); frame(A, Wp, Wp);
            const row = Math.floor(Wp / 2), xs = lin(-1, 1, Wp), tm = Math.max(...truth);
            B.setScale({ xlog: false, ylog: false, x: [-1, 1], y: [0, 1.1] });
            B.setLabels('position $x$ along the middle row', 'value (each curve scaled to its maximum)');
            st = { pt: false, n };
            B.path(xs.map((x, i) => [x, bp[row * Wp + i] / mx]), { color: 'accent', width: 2.4 });
            B.path(xs.map((x, i) => [x, truth[row * Wp + i] / tm]), { color: 'green', width: 2, dash: true });
          }
        });
        v.legend([['accent', 'back-projection'], ['orange', '$1/r$', { dash: true }], ['green', 'true object (phantom mode)', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.pt) return `${st.n} views: fitted log–log slope of the halo between $r=0.08$ and $0.6$: $${fx(st.sl, 2)}$ (the continuous limit is $-1$).\n$r\\,b(r)$ at $r=0.1,\\,0.3,\\,0.6$: $${st.rb.map((q) => fx(q, 2)).join(',\\ ')}$ — nearly constant, the signature of a $1/r$ law (normalised to $1$ for a unit-mass source).`;
          return `Head phantom back-projected from ${st.n} views: the skull ring, ventricles and brain are all visible but the contrast is washed out and a smooth positive pedestal fills the background (and outside the head). Correcting this needs the ramp filter (3.7).`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Algorithm',
      name: 'Filtered back-projection',
      statement: String.raw`Filtered back-projection reconstructs $f$ from its projections by two steps. First **filter** each projection with the ramp filter, $q_\theta=p_\theta*h$ with $\hat h(\omega)=|\omega|$; then **back-project** the filtered projections:
$$f(x,y)=\int_0^\pi q_\theta(x\cos\theta+y\sin\theta)\,d\theta,\qquad q_\theta(s)=\int_{-\infty}^\infty |\omega|\,P_\theta(\omega)\,e^{2\pi i\omega s}\,d\omega .$$
In the discrete implementation $h$ is the band-limited Ram–Lak kernel, $h[0]=1/(4\tau^2)$, $h[n]=-1/(\pi^2n^2\tau^2)$ for odd $n$ and $0$ for even $n\ne0$, with detector spacing $\tau$; the negative side-lobes cancel the $1/r$ halo of simple back-projection. The filtered projection integrates to (almost) zero.`,
      idea: String.raw`Write the inverse 2-D Fourier transform in polar coordinates, using the Fourier slice theorem (imaging-3.4) to replace $F(\omega\cos\theta,\omega\sin\theta)$ by $P_\theta(\omega)$; the polar area element $dk_x\,dk_y=|\omega|\,d\omega\,d\theta$ (change of variables, pma-10.9) supplies the factor $|\omega|$. The $\theta$-integral is then a back-projection (imaging-3.6) — of filtered, not raw, projections. The ramp is large at high frequencies, which in the sampled implementation is cut off at the detector's Nyquist frequency, giving the discrete kernel with its negative tails; in space these tails subtract exactly the $1/r$ halo.`,
      caption: String.raw`Drag **views accumulated** from 1 to 180: each filtered projection is smeared across the image and the head phantom emerges (left). Switch **filter** off to see the blurry unfiltered result (simple back-projection). The sinogram of filtered projections (second panel) has dark/light fringes next to every edge — the negative side-lobes. Right: the current raw projection, its filtered version, and the Ram–Lak kernel.`,
      deps: ['imaging-3.4', 'imaging-3.6', 'pma-10.9'],
      tags: ['filtered back-projection', 'ramp filter'],
      refs: ['Kak–Slaney §3.3', 'Prince–Links ch. 6'],
      credit: 'Ramachandran & Lakshminarayanan, 1971 (convolution back-projection); Shepp & Logan, 1974',
      verify: true,
      scope: String.raw`Parallel beam, noise-free, 140 detector samples and up to 180 views; the Shepp–Logan values here are Toft's contrast-enhanced version. With fewer views, streaks (3.10); with noise, the ramp amplifies it (3.8); the reconstructed values are in the same units as the object.`,
      viz(v) {
        const Wp = 96, nA = 180, nd = 140, PH = slEllipses(0.9);
        const sc = makeScan(nA, nd), sino = sinoEll(PH, sc), truth = raster((x, y) => ellAt(PH, x, y), Wp, Wp, 2);
        const F = makeFilter(nd, sc.tau, 'ramp', 1), q = filterSino(sino, sc, F);
        const A = v.stage({ x: [0, Wp], y: [0, Wp], equal: true, axes: false, height: 290, title: 'Reconstruction', minWidth: 230 });
        const S = v.stage({ x: [0, 180], y: [-1.45, 1.45], axes: 'box', gutter: true, height: 290, xlabel: 'view angle $\\theta$ (°)', ylabel: 's', title: 'Filtered sinogram', minWidth: 230, xticks: [0, 90, 180] });
        const P = v.stage({ x: [-1.45, 1.45], y: [-1.2, 1.4], axes: 'box', gutter: true, height: 290, xlabel: 'detector position $s$', ylabel: 'value', title: 'One view: raw, filtered', minWidth: 230 });
        const K = v.stage({ x: [-8.5, 8.5], y: [-0.35, 1.1], axes: 'box', gutter: true, height: 290, xlabel: 'sample index $n$', ylabel: '$h[n]/h[0]$', title: 'Ram–Lak kernel $h[n]$', minWidth: 230 });
        const nv = v.slider('views accumulated', 1, 180, 180, { step: 1, int: true });
        const fl = v.select('filter', [{ value: 'ramp', label: 'ramp (filtered)' }, { value: 'none', label: 'none (simple BP)' }], 'ramp');
        const cache = new Map();
        const recon = (k, filt) => {
          const key = `${k}|${filt}`;
          if (!cache.has(key)) { if (cache.size > 40) cache.clear(); cache.set(key, backproject(filt === 'ramp' ? q : sino, sc, Wp, Wp, k)); }
          return cache.get(key);
        };
        let st = null;
        v.render(() => {
          const k = nv.value, r = recon(k, fl.value);
          const ok = fl.value === 'ramp';
          // unfiltered image: scale to best fit for display and for the error
          let a = 1, b = 0;
          if (!ok) { const mr = mean(r), mt = mean(truth); let sxy = 0, sxx = 0; for (let i = 0; i < r.length; i++) { sxy += (r[i] - mr) * (truth[i] - mt); sxx += (r[i] - mr) ** 2; } a = sxy / sxx; b = mt - a * mr; }
          const shown = ok ? r : Float64Array.from(r, (x) => a * x + b);
          showImage(A, shown, Wp, Wp, { lo: 0.05, hi: 0.4, id: 'fbp', extra: `${k}${fl.value}` }); frame(A, Wp, Wp);
          const qs = ok ? q : sino; let mx = 0; for (const x of qs) mx = Math.max(mx, Math.abs(x));
          S.raster((th, s) => {
            const kk = Math.min(nA - 1, Math.floor((th / 180) * nA)), j = Math.floor((s + sc.half) / sc.tau);
            if (j < 0 || j >= nd) return null;
            const t = qs[kk * nd + j] / mx;
            return ok ? v.diverge(clamp(t * 1.4, -1, 1), 'blue', 'red') : grey(t);
          }, { res: 2, id: 'fs', key: fl.value });
          S.vline((180 * (k - 1)) / nA, { color: 'gold', width: 1.5 });
          const kk = k - 1, th = (kk * 180) / nA;
          const raw = Array.from({ length: nd }, (_, j) => [sc.sOf(j), sino[kk * nd + j]]), fil = Array.from({ length: nd }, (_, j) => [sc.sOf(j), q[kk * nd + j]]);
          P.setView([-1.45, 1.45], [-1.2, Math.max(1.4, ...raw.map((p) => p[1]) ) * 1.1]);
          P.hline(0, { color: 'faint', width: 1 });
          P.path(raw, { color: 'muted', width: 2 });
          P.path(fil, { color: 'accent', width: 2.2 });
          const h0 = 1 / (4 * sc.tau * sc.tau);
          for (let n = -8; n <= 8; n++) { const hv = n === 0 ? h0 : n % 2 === 0 ? 0 : -1 / (PI * PI * n * n * sc.tau * sc.tau); const y = hv / h0; K.segment([n, 0], [n, y], { color: n === 0 ? 'accent' : 'red', width: 2.5 }); K.dot(n, y, { r: 4, color: n === 0 ? 'accent' : 'red' }); }
          K.hline(0, { color: 'faint', width: 1 });
          const ints = (arr) => arr.reduce((s, p) => s + p[1], 0) * sc.tau;
          st = { k, th, e: rmse(shown, truth), ip: ints(raw), iq: ints(fil), ok };
        });
        v.legend([['muted', 'raw projection'], ['accent', 'filtered projection'], ['red', 'negative tails of $h$', { dot: true }]]);
        v.readout(() => st ? `${st.k} view${st.k === 1 ? '' : 's'} (last at $${fx(st.th, 0)}^\\circ$), ${st.ok ? 'ramp-filtered' : 'unfiltered (rescaled to best fit)'}: RMS error against the phantom $${fx(st.e, 4)}$ (phantom RMS $${fx(rms(truth), 3)}$).\nThis view: $\\int p\\,ds=${fx(st.ip, 3)}$ (the total mass) but $\\int q\\,ds=${fx(st.iq, 4)}\\approx0$: the ramp removes the zero-frequency component and puts negative lobes beside every positive feature.` : '');
      },
    },

    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Concept',
      name: 'Ramp-filter windows and noise',
      statement: String.raw`The ramp $|\omega|$ amplifies high spatial frequencies, where photon-counting noise (imaging-1.7) is as strong as at low frequencies and the signal is weak. Practical filters multiply the ramp by a **window** $W(\omega)$ that falls from 1 to 0 at a cutoff $\omega_c$: Shepp–Logan $\operatorname{sinc}$, cosine, Hamming or Hann. The reconstructed noise variance is proportional to $\int|\omega|^2W(\omega)^2\,d\omega$ while the resolution is set by the width of $|\omega| W(\omega)$; a sharper filter (ramp, high cutoff) gives better resolution and more noise, a smoother one the reverse, and the trade-off is a curve in the noise–resolution plane.`,
      idea: String.raw`Reconstruction is linear, so noise in the sinogram passes through the same filter-and-back-project operation as the signal. White noise in the projections has a flat spectrum; after the ramp its spectrum grows as $\omega^2$, so variance comes mostly from the highest frequencies. A window removes those frequencies — less variance, and a lower modulation transfer (imaging-1.4) at fine scale. The reconstruction's point spread function is the Fourier transform of the windowed filter, so the window also fixes the edge sharpness measured here.`,
      caption: String.raw`The phantom has a flat region (noise measured there), and a bright disc whose edge rise measures resolution. Change **window**, **cutoff** and **photons per ray**. Left: the reconstruction from Poisson-noisy projections. Middle: the filter responses $|\omega|W(\omega)$ for all windows (current one thick). Right: noise against edge width for every window as the cutoff goes from 0.3 to 1 — a smoother filter moves a point down and to the right along its curve; the gold dot is the current setting.`,
      deps: ['imaging-3.7'],
      tags: ['filter window', 'noise', 'resolution'],
      refs: ['Kak–Slaney §3.3', 'Kak–Slaney §5.2'],
      scope: String.raw`Parallel beam, 180 views, 140 detector samples; Poisson counts $N\sim\mathrm{Poisson}(I_0e^{-p})$ per ray with fixed noise realisation; attenuation scaled so the largest line integral is about $2.5$. Noise is the standard deviation of reconstruction error in a uniform 0.12-radius disc, resolution the 10–90% rise across the edge of the bright disc. Both are measured on this phantom only.`,
      viz(v) {
        const Wp = 96, nA = 180, nd = 140, KAP = 5;
        const PH = [[0.2, 0.7, 0.7, 0, 0, 0], [0.3, 0.22, 0.22, -0.28, 0.18, 0], [0.3, 0.06, 0.06, 0.3, 0.38, 0], [0.3, 0.04, 0.04, 0.45, 0.15, 0], [0.3, 0.025, 0.025, 0.1, 0.5, 0], [-0.15, 0.09, 0.09, -0.1, -0.35, 0]];
        const sc = makeScan(nA, nd), sinoC = sinoEll(PH, sc).map((x) => x * KAP);
        const r = rng32(7), { u, z } = noiseField(v.M, r, nA * nd);
        const I0s = v.slider('photons per ray $I_0$', 300, 1e6, 3000, { log: true, sig: 2 });
        const win = v.select('window', [{ value: 'ramp', label: 'ramp' }, { value: 'shepp', label: 'Shepp–Logan' }, { value: 'cosine', label: 'cosine' }, { value: 'hann', label: 'Hann' }], 'shepp');
        const cut = v.slider('cutoff (× Nyquist)', 0.3, 1, 1, { step: 0.01 });
        const A = v.stage({ x: [0, Wp], y: [0, Wp], equal: true, axes: false, height: 290, title: 'Reconstruction (noisy data)', minWidth: 230 });
        const B = v.stage({ x: [0, 1], y: [0, 1.05], axes: 'box', gutter: true, height: 290, xlabel: 'frequency $\\omega/\\omega_{Nyq}$', ylabel: '$|\\omega|\\,W(\\omega)$', title: 'Filter responses', minWidth: 230 });
        const C = v.stage({ x: [0, 40], y: [0, 1], axes: 'box', gutter: true, height: 290, xlabel: 'edge rise 10–90% (detector samples)', ylabel: 'noise SD / contrast', title: 'Noise–resolution trade-off', minWidth: 230 });
        const wins = ['ramp', 'shepp', 'cosine', 'hann'], wcol = { ramp: 'red', shepp: 'accent', cosine: 'green', hann: 'purple' }, wname = { ramp: 'ramp', shepp: 'Shepp–Logan', cosine: 'cosine', hann: 'Hann' };
        const roi = []; for (let i = -20; i <= 20; i++) for (let j = -20; j <= 20; j++) { const x = 0.25 + i * 0.006, y = -0.3 + j * 0.006; if (Math.hypot(i, j) <= 20) roi.push([x, y]); }
        const edge = lin(-0.82, -0.18, 140).map((x) => [x, 0.18]);
        let nzKey = '', noisySino = null, nzSino = null;
        const getNoise = (I0) => {
          const k = `${I0}`; if (k === nzKey) return;
          nzKey = k; noisySino = new Float64Array(sinoC.length); nzSino = new Float64Array(sinoC.length);
          for (let i = 0; i < sinoC.length; i++) { const N = poissonFrom(I0 * Math.exp(-sinoC[i]), u[i], z[i]); noisySino[i] = -Math.log(Math.max(N, 0.5) / I0); nzSino[i] = noisySino[i] - sinoC[i]; }
        };
        const measure = (w, c, I0) => {
          const F = makeFilter(nd, sc.tau, w, c), qn = filterSino(nzSino, sc, F), qc = filterSino(sinoC, sc, F);
          const sdv = sd(Array.from(fbpAt(qn, sc, roi)).map((x) => x / KAP));
          const pr = fbpAt(qc, sc, edge).map((x) => x / KAP), lo = 0.2, hi = 0.5, t10 = lo + 0.1 * (hi - lo), t90 = lo + 0.9 * (hi - lo);
          let x10 = null, x90 = null;
          for (let i = 1; i < pr.length; i++) {
            if (x10 === null && pr[i - 1] < t10 && pr[i] >= t10) x10 = edge[i - 1][0] + ((t10 - pr[i - 1]) / (pr[i] - pr[i - 1])) * (edge[i][0] - edge[i - 1][0]);
            if (x90 === null && pr[i - 1] < t90 && pr[i] >= t90) x90 = edge[i - 1][0] + ((t90 - pr[i - 1]) / (pr[i] - pr[i - 1])) * (edge[i][0] - edge[i - 1][0]);
          }
          return { noise: sdv / 0.3, width: x10 !== null && x90 !== null ? (x90 - x10) / sc.tau : NaN };
        };
        let st = null, curves = null, ckey = '';
        v.render(() => {
          const I0 = Math.round(I0s.value);
          getNoise(I0);
          const F = makeFilter(nd, sc.tau, win.value, cut.value), q = filterSino(noisySino, sc, F);
          const img = backproject(q, sc, Wp, Wp).map((x) => x / KAP);
          showImage(A, img, Wp, Wp, { lo: 0.05, hi: 0.55, id: 'nz', extra: `${I0}|${win.value}|${cut.value}`, smooth: true }); frame(A, Wp, Wp);
          A.circle(((0.25 + 1) / 2) * Wp, ((-0.3 + 1) / 2) * Wp, 0.12 * Wp / 2, { color: 'gold', width: 1.5 });
          A.text('noise ROI', ((0.25 + 1) / 2) * Wp, ((-0.3 + 1) / 2) * Wp - 0.15 * Wp / 2 - 2, { color: 'gold', size: 11, align: 'center' });
          for (const w of wins) { const th = w === win.value; B.fn((x) => x * winFn(w, x, w === win.value ? cut.value : 1), { color: wcol[w], width: th ? 3 : 1.2, alpha: th ? 1 : 0.55, n: 200 }); }
          if (ckey !== `${I0}`) { ckey = `${I0}`; curves = {}; for (const w of wins) curves[w] = lin(0.3, 1, 8).map((c) => measure(w, c, I0)); }
          for (const w of wins) { const cs = curves[w].filter((m) => Number.isFinite(m.width)); C.path(cs.map((m) => [m.width, m.noise]), { color: wcol[w], width: w === win.value ? 2.6 : 1.4, alpha: w === win.value ? 1 : 0.6 }); C.dots(cs.map((m) => [m.width, m.noise]), { r: 2.5, color: wcol[w] }); }
          const m = measure(win.value, cut.value, I0);
          if (Number.isFinite(m.width)) C.dot(m.width, m.noise, { r: 7, color: 'gold' });
          const mx = Math.max(...Object.values(curves).flat().filter((a) => Number.isFinite(a.width)).map((a) => a.noise), m.noise) * 1.15, wx = Math.max(...Object.values(curves).flat().filter((a) => Number.isFinite(a.width)).map((a) => a.width), m.width || 0) * 1.1;
          C.setView([0, Math.max(6, wx)], [0, Math.max(0.05, mx)]);
          st = { m, I0 };
        });
        v.legend(wins.map((w) => [wcol[w], wname[w]]).concat([['gold', 'current setting', { dot: true }]]));
        v.readout(() => st ? `$I_0=${st.I0}$ photons per ray: noise SD in the flat region $${fx(100 * st.m.noise, 1)}\\%$ of the disc contrast, edge rise ${Number.isFinite(st.m.width) ? fx(st.m.width, 1) : '—'} detector samples.\nNoise falls roughly as $1/\\sqrt{I_0}$ at fixed filter (quadruple $I_0$ to halve it); the window trades it against sharpness along the curves.` : '');
      },
    },

    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Algorithm',
      name: 'Fan-beam reconstruction',
      statement: String.raw`In a fan-beam scanner a point source at distance $D$ from the rotation centre illuminates a fan of rays, indexed by the fan angle $\gamma$ from the central ray, while the source goes round a circle at angle $\beta$. The ray $(\beta,\gamma)$ is the parallel ray $(\theta,s)=(\beta+\gamma,\;D\sin\gamma)$, so fan data are the Radon transform resampled. Two reconstructions agree: (i) **rebinning** — interpolate the fan data onto a parallel sinogram and use filtered back-projection (3.7); (ii) **direct** weighted filtered back-projection (equiangular detector, full $2\pi$):
$$f(\mathbf r)=\int_0^{2\pi}\frac{d\beta}{L^2}\int R_\beta(\gamma)\,D\cos\gamma\;g(\gamma'-\gamma)\,d\gamma,\quad g(\delta)=\tfrac12\Big(\frac{\delta}{\sin\delta}\Big)^{2}h(\delta),$$
where $L$ is the source–pixel distance, $\gamma'$ the fan angle of the pixel and $h$ the ramp kernel.`,
      idea: String.raw`Change variables from parallel $(\theta,s)$ to fan $(\beta,\gamma)$ in the filtered back-projection formula: the Jacobian is $D\cos\gamma$, the full circle $2\pi$ covers every parallel ray twice (hence the factor $\tfrac12$), and the ramp kernel evaluated at the parallel offset $s'-s=L\sin(\gamma'-\gamma)$ becomes $h(\delta)\,(\delta/\sin\delta)^2/L^2$ because $h$ is homogeneous of degree $-2$. The weight $1/L^2$ makes pixels close to the source count more, because the fan samples them more densely. Rebinning instead pays for an interpolation but reuses the parallel code.`,
      caption: String.raw`Drag **source angle** to rotate the source around the head phantom; the fan sweeps it and the highlighted row of the fan sinogram is the data of that view. Compare the **direct** weighted reconstruction with the **rebinned** one: both reconstruct the phantom; the direct one avoids the interpolation of rebinning and is slightly sharper, and their difference is displayed. Larger **source distance** gives a narrower fan, approaching parallel beam; fewer **views** degrades both.`,
      deps: ['imaging-3.7'],
      tags: ['fan beam', 'rebinning'],
      refs: ['Kak–Slaney §3.4'],
      scope: String.raw`Equiangular detector, full $360^\circ$ rotation, noise-free exact line integrals of the phantom, detector arc just wide enough to cover the unit disc. Short-scan (180° + fan angle) acquisition with Parker weights is not shown.`,
      viz(v) {
        const Wp = 80, PH = slEllipses(0.9), truth = raster((x, y) => ellAt(PH, x, y), Wp, Wp, 2);
        const Dsl = v.slider('source distance $D$', 1.8, 8, 3, { step: 0.1 });
        const nvs = v.slider('number of views over $360^\\circ$', 60, 360, 240, { step: 12, int: true });
        const ang = v.slider('source angle $\\beta$ (°)', 0, 359, 30, { step: 1, int: true });
        const G = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 290, title: 'Scanner geometry', minWidth: 230 });
        const Sg = v.stage({ x: [0, 360], y: [-30, 30], axes: 'box', gutter: true, height: 290, xlabel: 'source angle $\\beta$ (°)', ylabel: 'fan angle $\\gamma$ (°)', title: 'Fan sinogram $R_\\beta(\\gamma)$', minWidth: 230, xticks: [0, 90, 180, 270, 360] });
        const Rd = v.stage({ x: [0, Wp], y: [0, Wp], equal: true, axes: false, height: 290, title: 'Direct weighted FBP', minWidth: 200 });
        const Rb = v.stage({ x: [0, Wp], y: [0, Wp], equal: true, axes: false, height: 290, title: 'Rebinned to parallel, then FBP', minWidth: 200 });
        const Df = v.stage({ x: [0, Wp], y: [0, Wp], equal: true, axes: false, height: 290, title: 'Direct − rebinned', minWidth: 200 });
        let data = null, key = '';
        v.render(() => {
          const D = Dsl.value, nb = nvs.value, k = `${D}|${nb}`;
          if (k !== key) {
            key = k;
            const F = fanScan(D, nb, 120), R = fanSino(PH, F), direct = fanFBP(R, F, Wp, Wp), scp = makeScan(120, 100, 1.2), par = fanRebin(R, F, scp), reb = fbp(par, scp, Wp, Wp, 'ramp');
            data = { F, R, direct, reb, diff: Float64Array.from(direct, (x, i) => x - reb[i]) };
          }
          const { F, R, direct, reb, diff } = data;
          // geometry
          G.circle(0, 0, D, { color: 'faint', width: 1, dash: true });
          const bt = (ang.value * PI) / 180, ph = bt + PI / 2, Sx = D * Math.cos(ph), Sy = D * Math.sin(ph);
          G.setView([-D - 0.45, D + 0.45], [-D - 0.45, D + 0.45]);
          G.curve((t) => [0.9 * 0.69 * Math.cos(t), 0.9 * 0.92 * Math.sin(t)], 0, 2 * PI, { color: 'muted', width: 2, n: 120 });
          const gm = F.gm, dirAt = (g) => { const th = bt + g; return [Math.sin(th), -Math.cos(th)]; };
          for (let j = 0; j <= 20; j++) {
            const g = -gm + (j / 20) * 2 * gm, [dx, dy] = dirAt(g);
            G.segment([Sx, Sy], [Sx + dx * 2 * D, Sy + dy * 2 * D], { color: 'accent', width: j === 10 ? 2.2 : 0.8, alpha: j === 10 ? 0.9 : 0.3 });
          }
          G.dot(Sx, Sy, { r: 7, color: 'orange', label: 'source', labelPos: 'ne' });
          G.curve((g) => { const [dx, dy] = dirAt(g); return [Sx + dx * 2 * D, Sy + dy * 2 * D]; }, -gm, gm, { color: 'green', width: 4, n: 40 });
          Sg.raster((b, g) => {
            const kb = Math.min(F.nb - 1, Math.floor((b / 360) * F.nb)), j = Math.floor((((g * PI) / 180 + F.gm) / (2 * F.gm)) * F.ng);
            if (j < 0 || j >= F.ng) return null;
            return grey(R[kb * F.ng + j] / 1.6);
          }, { res: 2, id: 'fs', key });
          Sg.setView([0, 360], [(-gm * 180) / PI * 1.05, (gm * 180) / PI * 1.05]);
          Sg.vline(ang.value, { color: 'gold', width: 1.8 });
          showImage(Rd, direct, Wp, Wp, { lo: 0.05, hi: 0.4, id: 'd', extra: key, smooth: true }); frame(Rd, Wp, Wp);
          showImage(Rb, reb, Wp, Wp, { lo: 0.05, hi: 0.4, id: 'r', extra: key, smooth: true }); frame(Rb, Wp, Wp);
          showImage(Df, Float64Array.from(diff, (x) => 0.5 + x * 3), Wp, Wp, { lo: 0, hi: 1, id: 'df', extra: key }); frame(Df, Wp, Wp);
        });
        v.legend([['orange', 'source'], ['green', 'detector arc', {}], ['gold', 'current view']]);
        v.readout(() => data ? `$D=${fx(Dsl.value, 1)}$, fan half-angle $${fx((data.F.gm * 180) / PI, 1)}^\\circ$, ${nvs.value} views, ${data.F.ng} detector elements.\nRMS error against the phantom: direct $${fx(rmse(data.direct, truth), 4)}$, rebinned $${fx(rmse(data.reb, truth), 4)}$; RMS difference between them $${fx(rmse(data.direct, data.reb), 4)}$ (phantom RMS $${fx(rms(truth), 3)}$). The difference image (grey = 0) is amplified ×3.` : '');
      },
    },

    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Concept',
      name: 'Angular sampling and view-aliasing streaks',
      statement: String.raw`A parallel-beam scan with $N$ detector samples across the object needs about $M\gtrsim\frac{\pi}{2}N$ equally spaced views over $180^\circ$ for a reconstruction free of **view-aliasing**: in Fourier space the spokes of the projections (3.4) must be no farther apart than one sample of the transform at the highest frequency $\omega_{\max}$, i.e. $\omega_{\max}\,\Delta\theta\lesssim1/(N\tau)$ with $\omega_{\max}=1/(2\tau)$ giving $\Delta\theta=\pi/M\lesssim 2/N$. With fewer views, fine detail near edges is lost and **streaks** radiate from high-contrast structures (bone, metal, small bright points), growing in strength towards the periphery.`,
      idea: String.raw`The detector samples each projection finely, so the sampling is limited along $\theta$: the spokes in Fourier space (imaging-3.4) spread apart with radius, and at radius $\omega$ the gap between spokes is $\omega\,\Delta\theta$. The object's transform varies on a scale $1/(\text{object width})$, so the gap must stay below that scale out to the Nyquist radius $1/2\tau$ — the 2-D sampling theorem (imaging-1.5) applied in polar coordinates. When it is violated the high-frequency content between spokes is aliased, and in the image the view-to-view jumps of an edge show up as lines that continue the rays.`,
      caption: String.raw`Set the number of **detector samples** $N$ and the number of **views** $M$: the reconstruction of the head phantom (or of a ring of bright point targets, which make streaks obvious) is shown next to the curve of RMS error against the number of views. The dashed vertical line marks $M=\tfrac{\pi}{2}N$; below it the error rises quickly and streaks appear, above it the error stops improving (the floor is set by the detector sampling).`,
      deps: ['imaging-3.7', 'imaging-1.5'],
      tags: ['aliasing', 'streak artifact', 'sampling'],
      refs: ['Kak–Slaney §5.1'],
      scope: String.raw`Parallel beam, exact line integrals of the phantom, ramp filter with linear interpolation, 96×96 image; the knee in the error curve is a rule of thumb, not a sharp threshold, and depends on the object (here the head phantom's sharp skull edge, or point-like targets).`,
      viz(v) {
        const Wp = 96;
        const objs = {
          ph: { E: slEllipses(0.9), lo: 0.05, hi: 0.4 },
          pt: { E: Array.from({ length: 8 }, (_, i) => [1, 0.035, 0.035, 0.7 * Math.cos((i * PI) / 4), 0.7 * Math.sin((i * PI) / 4), 0]).concat([[0.3, 0.28, 0.28, 0, 0, 0], [1, 0.03, 0.03, 0, 0, 0]]), lo: -0.1, hi: 0.6 },
        };
        const obj = v.select('object', [{ value: 'ph', label: 'head phantom' }, { value: 'pt', label: 'bright point targets' }], 'ph');
        const nds = v.slider('detector samples $N$', 24, 128, 64, { step: 1, int: true });
        const nvs = v.slider('number of views $M$', 4, 256, 32, { log: true, sig: 2, int: true });
        const A = v.stage({ x: [0, Wp], y: [0, Wp], equal: true, axes: false, height: 310, title: 'Reconstruction', minWidth: 250 });
        const B = v.stage({ x: [3, 300], y: [0.03, 0.4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 310, xlabel: 'number of views $M$', ylabel: 'RMS error', title: 'Error against number of views', minWidth: 280 });
        const views = [4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256];
        const cache = {};
        let st = null;
        const sinoOf = (k, nd, nA) => { const sc = makeScan(nA, nd, 1.0); return { sc, sino: sinoEll(objs[k].E, sc) }; };
        v.render(() => {
          const k = obj.value, nd = nds.value, M = Math.round(nvs.value), O = objs[k];
          const ck = `${k}|${nd}`;
          if (!cache[ck]) {
            const truth = raster((x, y) => ellAt(O.E, x, y), Wp, Wp, 2);
            cache[ck] = { truth, curve: views.map((nv) => { const { sc, sino } = sinoOf(k, nd, nv); return [nv, rmse(fbp(sino, sc, Wp, Wp, 'ramp'), truth)]; }), recs: new Map() };
          }
          const C = cache[ck];
          if (!C.recs.has(M)) { const { sc, sino } = sinoOf(k, nd, M); C.recs.set(M, fbp(sino, sc, Wp, Wp, 'ramp')); }
          const rec = C.recs.get(M), err = rmse(rec, C.truth);
          showImage(A, rec, Wp, Wp, { lo: O.lo, hi: O.hi, id: 'ang', extra: `${ck}|${M}` }); frame(A, Wp, Wp);
          B.path(C.curve, { color: 'accent', width: 2.4 }); B.dots(C.curve, { r: 3, color: 'accent' });
          const knee = (PI / 2) * nd;
          B.vline(knee, { color: 'red', dash: true, width: 1.5 });
          B.text('$M=\\tfrac{\\pi}{2}N$', knee, 0.3, { color: 'red', size: 13, align: 'left', dx: 5 });
          B.dot(M, err, { r: 7, color: 'gold' });
          st = { M, nd, err, knee };
        });
        v.legend([['accent', 'RMS error'], ['red', '$M=\\pi N/2$', { dash: true }], ['gold', 'current $M$', { dot: true }]]);
        v.readout(() => st ? `$N=${st.nd}$ detector samples, $M=${st.M}$ views: $M/(\\tfrac\\pi2N)=${fx(st.M / st.knee, 2)}$, RMS error $${fx(st.err, 4)}$.\n${st.M < st.knee * 0.7 ? 'Under-sampled in angle: view-aliasing streaks fan out from the high-contrast edges.' : st.M < st.knee * 1.1 ? 'Close to the rule of thumb: streaks are fading.' : 'Angular sampling is sufficient; remaining error comes from the detector sampling and the ramp filter.'}` : '');
      },
    },
  ],
};
