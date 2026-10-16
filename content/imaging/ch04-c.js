// Medical Imaging — Chapter 4 (part 3): 4.8 MLEM and OSEM iterative reconstruction, 4.9 time-of-flight PET, 4.10 tracer kinetics and the Patlak plot.
import {
  clamp, fx, mean, showImage, frame, raster, ellAt, buildSystem, forward, subsetSens, osemSub, logLik, noiseField, poissonFrom, rng32, gauss,
  plasma, twoTissue, fitLine,
} from './ch04.shared.js';

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
      statement: String.raw`If a PET scanner measures the arrival-time difference $\Delta t=t_1-t_2$ of the two annihilation photons, the annihilation is located along the line of response at a displacement $x=c\,\Delta t/2$ from its midpoint, with an uncertainty
$$\Delta x=\frac{c\,\Delta\tau}{2}\quad(\text{FWHM}),$$
for a coincidence timing resolution $\Delta\tau$ (FWHM). For example $\Delta\tau=500$ ps gives $\Delta x\approx7.5$ cm and $\Delta\tau=100$ ps about 1.5 cm. In reconstruction each event is back-projected not along the whole line but as a Gaussian of width $\Delta x$ centred on the measured position. For an object of diameter $D\gg\Delta x$ this concentrates the information of each event and improves the signal-to-noise ratio of the image, to a good approximation, by the factor $\sqrt{D/\Delta x}$; if $\Delta x\gtrsim D$ nothing is gained.`,
      idea: String.raw`A photon travels $c\approx30$ cm/ns, so a 1 ns difference in arrival shifts the inferred point by 15 cm: the conversion is just kinematics. Without timing, an event adds a uniform count along a chord of length about $D$, and only a fraction $\Delta x/D$ of that chord is where the emitter actually was within the timing blur; the rest is noise for the voxel in question. Using the timing information, the effective number of independent "looks" at a voxel rises by $D/\Delta x$, and a Poisson signal-to-noise ratio goes as the square root of counts (imaging-1.7). The benefit is therefore largest for large patients and fast detectors, and is also what lets TOF scanners hold image quality with lower dose or shorter scans.`,
      caption: String.raw`Drag the **gold annihilation point** in the object, set the **direction** and the **timing resolution**: the Gaussian along the LOR is where the scanner places the event. The two images are simple back-projections of the same $N$ events (a hot lesion in a uniform disc), without timing (left) and with it (right): the blur streaks collapse onto the lesion. The curve shows the approximate gain $\sqrt{D/\Delta x}$ against timing resolution for the chosen $D$.`,
      deps: ['imaging-4.6', 'imaging-1.7'],
      tags: ['PET', 'time of flight'],
      refs: ['Prince–Links ch. 9'],
      scope: String.raw`Valid for a source distribution larger than $\Delta x$; the gain formula $\sqrt{D/\Delta x}$ is the standard approximation for a uniform object of diameter $D$ and is quoted from the literature as recalled (not rederived here). The pictures are unfiltered back-projections, not iterative reconstructions, and the contrast numbers shown for them are measured on this one noisy realisation; they illustrate localisation but need not reproduce the formula. Gaussian timing response, no scatter or randoms.`,
      verify: true,
      viz(v) {
        const CC = 29.979, NG = 56, FOV = 25, NMAX = 12000, RING = 40;
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
        v.button('Resample timing', () => { seed++; z0 = gauss(zr()); });
        const h = A.handle(6, 4, { color: 'gold', r: 9 });
        const r0 = rng32(2026), U = new Float64Array(NMAX), AL = new Float64Array(NMAX), RR = new Float64Array(NMAX), TH = new Float64Array(NMAX), ZZ = new Float64Array(NMAX), GA = new Float64Array(NMAX), GB = new Float64Array(NMAX);
        for (let i = 0; i < NMAX; i++) { U[i] = r0(); AL[i] = r0() * PI; RR[i] = Math.sqrt(r0()); TH[i] = r0() * 2 * PI; ZZ[i] = gauss(r0); GA[i] = gauss(r0); GB[i] = gauss(r0); }
        const cache = new Map();
        const bp = (D, dtps, N) => {
          const key = `${D}|${dtps}|${N}`; if (cache.has(key)) return cache.get(key);
          const R = D / 2, lx = 0.45 * R, ly = 0.3 * R, sx = ((CC * dtps * 1e-3) / 2) / 2.3548, pl = Math.min(0.5, 4 / (R * R + 4));
          const non = new Float64Array(NG * NG), tof = new Float64Array(NG * NG), px = (2 * FOV) / NG, dtS = 0.4;
          for (let i = 0; i < N; i++) {
            let x, y;
            if (U[i] < pl) { x = lx + 1.0 * GA[i] * 0.55; y = ly + 1.0 * GB[i] * 0.55; } else { x = R * RR[i] * Math.cos(TH[i]); y = R * RR[i] * Math.sin(TH[i]); }
            const c = Math.cos(AL[i]), s = Math.sin(AL[i]), pu = x * c + y * s, pp = x * x + y * y, disc = pu * pu - pp + R * R; if (disc <= 0) continue;
            const ch = Math.sqrt(disc), tLo = -pu - ch, tHi = -pu + ch, uMeas = sx * ZZ[i];   // position along the line relative to the true point
            let wn = 0, wt = 0; const pts = [];
            for (let t = tLo + dtS / 2; t < tHi; t += dtS) { const g = Math.exp(-0.5 * ((t - uMeas) / sx) ** 2); pts.push([t, g]); wn += dtS; wt += g * dtS; }
            if (wt <= 0) continue;
            for (const [t, g] of pts) {
              const X = x + t * c, Y = y + t * s, fi = (X + FOV) / px - 0.5, fj = (FOV - Y) / px - 0.5, i0 = Math.floor(fi), j0 = Math.floor(fj), a = fi - i0, b = fj - j0;
              for (const [di, dj, w] of [[0, 0, (1 - a) * (1 - b)], [1, 0, a * (1 - b)], [0, 1, (1 - a) * b], [1, 1, a * b]]) {
                const ii = i0 + di, jj = j0 + dj; if (ii < 0 || ii >= NG || jj < 0 || jj >= NG) continue;
                non[jj * NG + ii] += (w * dtS) / wn; tof[jj * NG + ii] += (w * g * dtS) / wt;
              }
            }
          }
          const lesion = (img) => { let s = 0, n = 0, bs = 0, bn = 0, bq = 0; for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) { const X = -FOV + (i + 0.5) * px, Y = FOV - (j + 0.5) * px, dl = Math.hypot(X - lx, Y - ly), db = Math.hypot(X, Y); if (dl < 1.3) { s += img[j * NG + i]; n++; } else if (db < 0.55 * R && dl > 0.35 * R) { bs += img[j * NG + i]; bn++; bq += img[j * NG + i] ** 2; } } const m = bs / bn; return { les: s / n, bg: m, sd: Math.sqrt(Math.max(0, bq / bn - m * m)) }; };
          const out = { non, tof, ln: lesion(non), lt: lesion(tof), lx, ly }; if (cache.size > 10) cache.clear(); cache.set(key, out); return out;
        };
        let info = {};
        v.render(() => {
          const D = dd.value, R = D / 2, dx = (CC * tr.value * 1e-3) / 2, sg = dx / 2.3548, th = (ang.value * PI) / 180, c = Math.cos(th), s = Math.sin(th);
          const hr = Math.hypot(h.x, h.y); if (hr > R) h.set((h.x * R) / hr, (h.y * R) / hr);
          // geometry
          A.circle(0, 0, RING, { color: 'muted', width: 1.4 });
          A.circle(0, 0, R, { color: 'accent', width: 1.6, fill: 'accent', fillAlpha: 0.1 });
          A.circle(0.45 * R, 0.3 * R, 1.3, { color: 'red', width: 1.6, fill: 'red', fillAlpha: 0.5 });
          const pu = h.x * c + h.y * s, disc = Math.sqrt(Math.max(0, pu * pu - (h.x ** 2 + h.y ** 2) + RING * RING)), a1 = -pu - disc, a2 = -pu + disc;
          A.segment([h.x + a1 * c, h.y + a1 * s], [h.x + a2 * c, h.y + a2 * s], { color: 'orange', width: 1.4 });
          A.dot(h.x + a1 * c, h.y + a1 * s, { r: 5, color: 'orange' }); A.dot(h.x + a2 * c, h.y + a2 * s, { r: 5, color: 'orange' });
          const um = z0 * sg, amp = 9;
          A.path(Array.from({ length: 161 }, (_, k) => { const t = -50 + (k * 100) / 160, g = Math.exp(-0.5 * ((t - um) / sg) ** 2); return [h.x + t * c - amp * g * s, h.y + t * s + amp * g * c]; }), { color: 'green', width: 2.2 });
          A.dot(h.x + um * c, h.y + um * s, { r: 5, color: 'green' });
          A.measure(h.x + (um - dx / 2) * c - 11 * s, h.y + (um - dx / 2) * s + 11 * c, h.x + (um + dx / 2) * c - 11 * s, h.y + (um + dx / 2) * s + 11 * c, 'FWHM');
          // images
          const R2 = bp(D, tr.value, Math.round(nEv.value)), top = Math.max(R2.ln.les, R2.lt.les, 1e-9);
          const hiN = Math.max(...R2.non) * 0.95, hiT = Math.max(...R2.tof) * 0.95;
          showImage(B, R2.non, NG, NG, { lo: 0, hi: hiN, id: 'non', smooth: true, extra: `${D}|${tr.value}|${nEv.value}` }); frame(B, NG, NG);
          showImage(C, R2.tof, NG, NG, { lo: 0, hi: hiT, id: 'tof', smooth: true, extra: `${D}|${tr.value}|${nEv.value}` }); frame(C, NG, NG);
          const gain = (t) => Math.max(1, Math.sqrt(D / ((CC * t * 1e-3) / 2)));
          G.fn(gain, { color: 'accent', width: 2.4, n: 200, domain: [20, 1000] });
          G.hline(1, { color: 'muted', dash: true });
          G.dot(tr.value, gain(tr.value), { r: 7, color: 'gold' });
          info = { dx, gain: gain(tr.value), cn: R2.ln.les / Math.max(R2.ln.bg, 1e-9), ct: R2.lt.les / Math.max(R2.lt.bg, 1e-9), D };
        });
        v.readout(() => `$\\Delta x=c\\,\\Delta\\tau/2=${fx(info.dx, 1)}$ cm for $\\Delta\\tau=${tr.value}$ ps (FWHM); object $D=${info.D}$ cm ⇒ approximate gain $\\sqrt{D/\\Delta x}=${fx(info.gain, 2)}$.\nLesion-to-background ratio of the back-projections (this noisy realisation): without timing $${fx(info.cn, 2)}$, with timing $${fx(info.ct, 2)}$ (true activity ratio 4).`);
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Method',
      name: 'Tracer kinetics and the Patlak plot',
      statement: String.raw`In a two-tissue compartment model of FDG, tracer enters tissue from plasma with rate $K_1$, leaves with $k_2$, and is phosphorylated (trapped) with rate $k_3$ and, in general, de-phosphorylated with $k_4$. For an **irreversible** trap ($k_4=0$) the **Patlak transformation**
$$\frac{C_T(t)}{C_p(t)}=K_i\,\frac{\int_0^tC_p(\tau)\,d\tau}{C_p(t)}+V_0,\qquad K_i=\frac{K_1k_3}{k_2+k_3},$$
is, once the reversible compartment has equilibrated with plasma ($t\ge t^*$), a straight line in the coordinates $x=\int_0^tC_p/C_p(t)$, $y=C_T/C_p$. Its slope is the **net influx constant** $K_i$ and its intercept the apparent initial distribution volume $V_0$. A straight line is fitted to late frames without solving the model. If $k_4>0$ the line bends downward and the slope under-estimates the influx.`,
      idea: String.raw`With $k_4=0$ the trapped amount obeys $\dot C_2=k_3C_1$ and $C_1$ is in rapid equilibrium with plasma, $C_1\approx(K_1/(k_2+k_3))\,C_p$ after the initial transient, so $\dot C_2=K_iC_p$ and $C_2(t)=K_i\int_0^tC_p$: dividing by $C_p(t)$ gives the line, and everything reversible adds only a constant $V_0$. The method needs the plasma curve but no model fit, so it can be applied voxel by voxel to dynamic PET images to produce a parametric map of glucose influx. It is a linear fit to noisy points, hence the slope has an error that depends on the frames used and on how far $k_4$ and the noise bend the line.`,
      caption: String.raw`Left: the **model plasma input** $C_p$ and the **tissue curve** $C_T$ from the two-tissue model (dots: 24 simulated frames with noise). Right: the Patlak plot of the same frames; the fit uses frames after $t^*$ (green). Move $t^*$ to see the line establish itself. Increase **$k_4$** (reversible trapping) and watch the late points bend over; raise the **noise** and resample. The fitted slope is compared with the true $K_i=K_1k_3/(k_2+k_3)$.`,
      deps: ['pharm-3.1', 'imaging-4.6'],
      tags: ['Patlak', 'compartment model', 'FDG'],
      refs: ['Prince–Links ch. 9'],
      credit: 'C. S. Patlak, R. G. Blasberg & J. D. Fenstermacher, 1983 (J. Cereb. Blood Flow Metab. 3: 1–7)',
      links: { doi: 'https://doi.org/10.1038/jcbfm.1983.1' },
      scope: String.raw`Needs an irreversible trap ($k_4\approx0$ over the observation time), a measured plasma input and a late time window. The rate constants (units: $K_1$ in mL/g/min, others per min) and the plasma curve are illustrative values of the order seen in brain FDG studies (compare Phelps et al., Ann. Neurol. 6: 371–388, 1979, whose tabulated values were not rechecked here), and the input function is a made-up bolus with a bi-exponential fall and a slow tail, not patient data. Noise is multiplicative Gaussian on each frame.`,
      verify: true,
      viz(v) {
        const FR = [0.25, 0.75, 1.25, 1.75, 2.5, 3.5, 4.5, 6, 8, 10, 13, 16, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90];
        const A = v.stage({ x: [0, 90], y: [0, 50], axes: 'box', gutter: true, height: 330, xlabel: 'time (min)', ylabel: 'concentration (kBq/mL)', title: 'Plasma input and tissue curve', minWidth: 280 });
        const B = v.stage({ x: [0, 80], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'normalised time $\\int_0^tC_p\\,d\\tau\\,/\\,C_p(t)$ (min)', ylabel: '$C_T/C_p$', title: 'Patlak plot', minWidth: 280 });
        const K1 = v.slider('$K_1$ (mL/g/min)', 0.04, 0.3, 0.1, { step: 0.005 });
        const k2 = v.slider('$k_2$ (1/min)', 0.04, 0.4, 0.13, { step: 0.005 });
        const k3 = v.slider('$k_3$ (1/min)', 0.0, 0.2, 0.06, { step: 0.002 });
        const k4 = v.slider('$k_4$ (1/min)', 0.0, 0.08, 0.0, { step: 0.001 });
        const ts = v.slider('start of fit $t^*$ (min)', 3, 60, 20, { step: 1, int: true });
        const nz = v.slider('noise (%)', 0, 25, 4, { step: 0.5 });
        let seed = 1, zf = FR.map(() => 0); const mkz = () => { const r = rng32(seed * 131); zf = FR.map(() => gauss(r)); }; mkz();
        v.button('Resample noise', () => { seed++; mkz(); });
        const cache = new Map();
        const model = (a, b, c, d) => { const key = `${a}|${b}|${c}|${d}`; if (cache.has(key)) return cache.get(key); const m = twoTissue(a, b, c, d, 0.04); if (cache.size > 40) cache.clear(); cache.set(key, m); return m; };
        let info = {};
        v.render(() => {
          const m = model(K1.value, k2.value, k3.value, k4.value), dt = m.dt;
          const cum = new Float64Array(m.n); for (let i = 1; i < m.n; i++) cum[i] = cum[i - 1] + 0.5 * (m.cp[i] + m.cp[i - 1]) * dt;
          const idx = (t) => Math.round(t / dt);
          A.path(Array.from(m.t, (t, i) => [t, m.cp[i]]), { color: 'orange', width: 2.2 });
          A.path(Array.from(m.t, (t, i) => [t, m.ct[i]]), { color: 'accent', width: 2.2 });
          const xs = [], ys = [], fx_ = [], fy = [];
          FR.forEach((t, q) => {
            const i = idx(t), ctn = Math.max(0, m.ct[i] * (1 + (nz.value / 100) * zf[q])), cp = m.cp[i];
            A.dot(t, ctn, { r: 3.5, color: 'accent' });
            const X = cum[i] / cp, Y = ctn / cp; xs.push(X); ys.push(Y);
            if (t >= ts.value) { fx_.push(X); fy.push(Y); }
          });
          const f = fy.length >= 2 ? fitLine(fx_, fy) : { slope: 0, intercept: 0 };
          const xmax = Math.max(...xs) * 1.08, ymax = Math.max(...ys) * 1.15;
          B.setView([0, xmax], [0, ymax]);
          xs.forEach((X, q) => B.dot(X, ys[q], { r: 4, color: FR[q] >= ts.value ? 'green' : 'muted', hollow: FR[q] < ts.value }));
          B.line(0, f.intercept, xmax, f.intercept + f.slope * xmax, { color: 'green', width: 2, dash: true });
          const kiTrue = (K1.value * k3.value) / (k2.value + k3.value);
          A.vline(ts.value, { color: 'gold', dash: true });
          // tissue max for y range
          info = { ki: f.slope, v0: f.intercept, kiTrue, err: kiTrue > 0 ? (f.slope - kiTrue) / kiTrue : 0, npts: fx_.length, cpMax: Math.max(...m.cp), ctMax: Math.max(...m.ct) };
        });
        v.legend([['orange', 'plasma $C_p$'], ['accent', 'tissue $C_T$ (model; dots = frames)'], ['green', 'frames used in the fit']]);
        v.readout(() => `Fit of ${info.npts} late frames: $K_i=${fx(info.ki, 4)}$ mL/g/min, $V_0=${fx(info.v0, 3)}$. Model value $K_1k_3/(k_2+k_3)=${fx(info.kiTrue, 4)}$ → error ${fx(100 * info.err, 1)}%.${k4.value > 0.0005 ? ` With $k_4=${fx(k4.value, 3)}$ the trap leaks and the slope under-estimates the true influx.` : ''}`);
      },
    },
  ],
};
