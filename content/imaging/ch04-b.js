// Medical Imaging — Chapter 4 (part 2): 4.5 SPECT, 4.6 PET: annihilation coincidence and lines of response, 4.7 PET attenuation correction is path-independent.
import {
  clamp, fx, mean, showImage, frame, raster, ellAt, ellProj, makeScan, makeScan360, filterSino, backproject, makeFilter, spectSino, changFactor,
  rng32, gauss,
} from './ch04.shared.js';

const PI = Math.PI;
const grey = (t) => { const c = Math.round(255 * clamp(t, 0, 1)); return [c, c, c]; };

// ---- shared emission phantom: warm elliptical body, two hot lesions, one cold lesion ([A, a, b, x0, y0, φ°])
const BODY = [1, 0.85, 0.65, 0, 0, 0];
const ACT = [BODY, [2, 0.09, 0.09, 0.35, 0.35, 0], [2, 0.11, 0.11, -0.35, 0.3, 0], [-0.8, 0.13, 0.13, 0, -0.35, 0]];

export default {
  collection: 'imaging',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Concept',
      name: 'SPECT',
      statement: String.raw`**Single-photon emission computed tomography** rotates a collimated gamma camera around the patient and records, at each angle $\theta$, a planar projection of the tracer distribution $f(x,y)$. Without attenuation each pixel of a projection would be the Radon transform $\int f\,d\ell$ and filtered back-projection (imaging-3.7) would recover $f$. In the body the photons are attenuated on their way to the camera, so a point at depth $\ell$ from the detector contributes $f\,e^{-\int_0^{\ell}\mu\,d\ell'}$ instead: the measured data are the **attenuated Radon transform**. Ignoring this darkens the deep tissue (a "cupping" of uniform regions) and can hide lesions. Corrections include the first-order multiplicative correction of Chang, which divides each pixel by the average attenuation factor over the views, and pre-corrections such as the geometric mean of opposing (conjugate) views.`,
      idea: String.raw`With attenuation the line integral carries an exponential weight that depends on where on the ray the emitter lies, so projections from opposite sides ($\theta$ and $\theta+\pi$), which are identical for the plain Radon transform, now differ — the data cover $2\pi$ instead of $\pi$. For a point emitter the geometric mean of the two opposite readings is $f\,e^{-\mu T/2}$ with $T$ the total thickness of the ray, independent of the emitter's depth, so only the known body outline is needed to undo it. Chang's correction does the same job after reconstruction by averaging the factors over the angles at each pixel. Both are approximate for extended sources, which is why modern systems measure $\mu$ with CT.`,
      caption: String.raw`Set the **attenuation coefficient** $\mu$ (0 is the ideal Radon case; 0.153 cm⁻¹ is water at 140 keV, Tc-99m) and choose the **correction**. Panels: the true tracer distribution, the $360^\circ$ attenuated sinogram, the reconstruction and a profile through the uniform background (dashed: truth). With $\mu>0$ and no correction the centre of the body is too dark and the hot lesion deep in the body is dimmer than its twin near the edge; try each correction.`,
      deps: ['imaging-4.3', 'imaging-3.7'],
      tags: ['SPECT', 'attenuation'],
      refs: ['Prince–Links ch. 9', 'Kak–Slaney §4.2'],
      credit: 'L.-T. Chang (multiplicative first-order correction), 1978',
      verify: true,
      scope: String.raw`Parallel-hole geometry, 96 views over $360^\circ$, uniform attenuation inside the body outline (elliptical, 34 cm × 26 cm in a 40 cm field of view; illustrative size), no scatter, no depth-dependent collimator blur, noise-free data. The value 0.153 cm⁻¹ for water at 140 keV is computed from the chapter-2 attenuation model (NIST XCOM gives 0.1505 cm²/g at 150 keV). The year of Chang's method is quoted from memory and was not checked.`,
      viz(v) {
        const W = 48, ND = 64, NA = 96, SIZE = 40, EPS = 1e-9;
        const act = raster((x, y) => ellAt(ACT, x, y), W, W, 3), body = raster((x, y) => (ellAt([BODY], x, y) > 0 ? 1 : 0), W, W, 1);
        const sc = makeScan360(NA, ND), sc180 = { ...sc, nA: NA / 2 }, F = makeFilter(ND, sc.tau, 'shepp', 1);
        const A = v.stage({ x: [0, W], y: [0, W], equal: true, axes: false, height: 250, title: 'True tracer distribution', minWidth: 200 });
        const B = v.stage({ x: [0, NA], y: [0, ND], axes: 'box', gutter: true, height: 250, xlabel: 'view angle (0–360°)', ylabel: 'detector position', xticks: [[0, '0'], [NA / 2, '180'], [NA, '360']], yticks: [], title: 'Sinogram (attenuated)', minWidth: 200 });
        const C = v.stage({ x: [0, W], y: [0, W], equal: true, axes: false, height: 250, title: 'Reconstruction', minWidth: 200 });
        const D = v.stage({ x: [-0.9, 0.9], y: [0, 3.4], axes: 'box', gutter: true, height: 250, xlabel: 'position across the body', ylabel: 'value (edge = 1)', title: 'Profile through the middle', minWidth: 220 });
        const mus = v.slider('attenuation $\\mu$ (cm⁻¹)', 0, 0.2, 0.153, { step: 0.001 });
        const corr = v.select('correction', [{ value: 'none', label: 'none' }, { value: 'conj', label: 'conjugate views' }, { value: 'chang', label: 'Chang' }], 'none');
        const cache = new Map(), chCache = new Map();
        const px = (x) => ((x + 1) * W) / 2;
        let info = {};
        const compute = (muc, mode) => {
          const key = `${muc.toFixed(4)}|${mode}`; if (cache.has(key)) return cache.get(key);
          const mb = muc * (SIZE / 2), sino = spectSino(act, body, W, sc, mb);
          let rec;
          if (mode === 'conj') {
            const s2 = new Float64Array((NA / 2) * ND);
            for (let k = 0; k < NA / 2; k++) for (let j = 0; j < ND; j++) {
              const p1 = sino[k * ND + j], p2 = sino[(k + NA / 2) * ND + (ND - 1 - j)], chord = ellProj([BODY], sc.th[k], sc.sOf(j));
              s2[k * ND + j] = Math.sqrt(Math.max(p1, 0) * Math.max(p2, 0)) * Math.exp((mb * chord) / 2) * (chord > 0 ? 1 : 0);
            }
            rec = backproject(filterSino(s2, sc180, F), sc180, W, W);
          } else {
            rec = backproject(filterSino(sino, sc, F), sc, W, W);
            if (mode === 'chang') {
              const ck = mb.toFixed(3); if (!chCache.has(ck)) chCache.set(ck, changFactor(BODY, W, 36, mb));
              const cf = chCache.get(ck); for (let i = 0; i < rec.length; i++) rec[i] *= cf[i];
            }
          }
          const sinoT = new Float64Array(NA * ND);
          for (let k = 0; k < NA; k++) for (let j = 0; j < ND; j++) sinoT[(ND - 1 - j) * NA + k] = sino[k * ND + j];
          const out = { sino, sinoT, rec }; if (cache.size > 24) cache.clear(); cache.set(key, out); return out;
        };
        const rowAt = (img, y) => { const j = clamp(Math.floor(((1 - y) * W) / 2), 0, W - 1); return (x) => img[j * W + clamp(Math.floor(((x + 1) * W) / 2), 0, W - 1)]; };
        v.render(() => {
          const { sino, sinoT, rec } = compute(mus.value, corr.value);
          showImage(A, act, W, W, { lo: 0, hi: 3, id: 'act', smooth: true }); frame(A, W, W);
          const mx = Math.max(...sino);
          showImage(B, sinoT, NA, ND, { lo: 0, hi: mx, id: 'sino', extra: mus.value }); frame(B, NA, ND);
          const f1raw = rowAt(rec, 0), edge = Math.max((f1raw(-0.6) + f1raw(0.6)) / 2, EPS), sc1 = 1 / edge;
          showImage(C, rec, W, W, { lo: 0, hi: 3 * edge, id: 'rec', smooth: true, extra: `${mus.value}|${corr.value}` }); frame(C, W, W);
          const f0 = rowAt(act, 0), f1 = (x) => f1raw(x) * sc1;
          D.fn(f0, { color: 'ink', dash: true, width: 1.6, domain: [-0.84, 0.84], n: 200 });
          D.fn(f1, { color: 'accent', width: 2.4, domain: [-0.84, 0.84], n: 200 });
          const c = f1(0), e = 1, hot = [rowAt(rec, 0.35)(0.35), rowAt(rec, 0.3)(-0.35)];
          D.vline(0, { color: 'grid', dash: true });
          info = { ratio: c, c, e: edge, hotRatio: hot[0] / Math.max(hot[1], EPS) };
        });
        v.readout(() => `Display and profile are scaled so that the background near the edge reads 1 (its raw value is $${fx(info.e, 3)}$ of the true activity: attenuation removes most of the signal everywhere). Centre/edge $=${fx(info.ratio, 2)}$ (truth 1.00). The two equal hot lesions (true value 3 each, at the upper right and upper left): reconstructed ratio right/left $${fx(info.hotRatio, 2)}$. Whole-body thickness $\\mu T$ along the long axis: $${fx(mus.value * SIZE * 0.85, 1)}$ attenuation lengths.`);
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Concept',
      name: 'PET: annihilation coincidence and lines of response',
      statement: String.raw`A positron emitted by the tracer stops within a millimetre or so of its birth and annihilates with an electron, producing two $511$ keV photons that leave in almost exactly opposite directions. A ring of detectors that registers two photons within a short **coincidence window** (a few nanoseconds) assigns the event to the straight **line of response** (LOR) joining the two detectors: the positron emitter lies somewhere on that line, with no collimator needed. An LOR with unit normal at angle $\theta$ and signed offset $s$ is one bin of the sinogram $(s,\theta)$, and the number of events in the bin estimates the line integral of the activity along it — the Radon transform again. A point source traces a sinusoid $s=r\cos(\theta-\varphi_0)$. Two unrelated photons that happen to arrive within the window form a **random** coincidence, which adds a smooth false background whose rate grows with the window and with the square of the activity.`,
      idea: String.raw`Back-to-back emission is conservation of momentum: the pair is created essentially at rest, so the two photons carry equal and opposite momenta. Requiring coincidence replaces the lead collimator of 4.4 by "electronic collimation", which is why PET is hundreds of times more sensitive than SPECT at comparable resolution. The sinogram is exactly the one of CT (imaging-3.3) except that the "rays" are labelled after the fact by the detector pair, so every reconstruction method of chapter 3 applies — but with Poisson counts (imaging-4.8). A timing window must be wider than the largest possible difference in flight time, $2R/c$ for a ring of radius $R$, or true events from off-centre are lost; making it wider admits more randoms.`,
      caption: String.raw`Left: the detector ring, a phantom (or **two point sources**: drag the gold and pink handles) and the first LORs. Middle: the sinogram accumulating **N** events — a point source writes a sinusoid, shown dashed. Right: the histogram of arrival-time differences; true pairs are confined to $\pm 2R/c$, randoms are flat. Narrow the **window** until true events from the edge of the ring are cut, or raise the **activity** and watch the randoms background fill the sinogram.`,
      deps: ['kin-9.7', 'imaging-3.3'],
      tags: ['PET', 'coincidence', 'sinogram'],
      refs: ['Prince–Links ch. 9'],
      scope: String.raw`Idealized 2-D ring of 120 detectors of radius $R=40$ cm (an illustrative size, comparable to whole-body scanners), perfectly collinear photons, no positron range, no scatter, no attenuation, no detector blur. The randoms fraction is modelled as $R/T=0.1\,a\,(\tau/6\,\mathrm{ns})$ for relative activity $a$ and window $\tau$ — the correct functional dependence, with an invented scale — and random LORs are drawn uniformly over the ring.`,
      viz(v) {
        const ND = 120, RCM = 40, CCM = 29.98, NT = 48, NS = 64, NMAX = 20000;
        const A = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, axes: false, height: 330, title: 'Detector ring and lines of response', minWidth: 250 });
        const B = v.stage({ x: [0, NT], y: [0, NS], axes: 'box', gutter: true, height: 330, xlabel: 'angle $\\theta$ (0–180°)', ylabel: 'offset $s$', xticks: [[0, '0'], [NT / 2, '90'], [NT, '180']], yticks: [[0, '−R'], [NS / 2, '0'], [NS, 'R']], title: 'Sinogram', minWidth: 250 });
        const C = v.stage({ x: [-6, 6], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'arrival-time difference $\\Delta t$ (ns)', ylabel: 'relative counts', title: 'Coincidence timing', minWidth: 250 });
        const src = v.select('source', [{ value: 'pt', label: 'two points' }, { value: 'ph', label: 'phantom' }], 'pt');
        const nEv = v.slider('events $N$', 200, NMAX, 4000, { log: true, sig: 2, int: true });
        const win = v.slider('coincidence window $\\tau$ (ns)', 1, 6, 4.5, { step: 0.1 });
        const act = v.slider('relative activity $a$', 0.2, 6, 1, { log: true, sig: 2 });
        const h1 = A.handle(-0.45, 0.2, { color: 'gold', r: 8, constrain: (x, y) => { const d = Math.hypot(x, y); return d > 0.95 ? [(0.95 * x) / d, (0.95 * y) / d] : [x, y]; } });
        const h2 = A.handle(0.55, -0.35, { color: 'pink', r: 8, constrain: (x, y) => { const d = Math.hypot(x, y); return d > 0.95 ? [(0.95 * x) / d, (0.95 * y) / d] : [x, y]; } });
        const r = rng32(5), U = new Float64Array(NMAX), AL = new Float64Array(NMAX), RA = new Float64Array(NMAX), RB = new Float64Array(NMAX), RT = new Float64Array(NMAX);
        const PH = []; { const rp = rng32(77); while (PH.length < NMAX) { const x = -0.9 + 1.8 * rp(), y = -0.7 + 1.4 * rp(); if (rp() * 3 < ellAt(ACT, x, y)) PH.push([x, y]); } }
        for (let i = 0; i < NMAX; i++) { U[i] = r(); AL[i] = r() * PI; RA[i] = r() * 2 * PI; RB[i] = r() * 2 * PI; RT[i] = r(); }
        const qd = (phi) => Math.round(((((phi % (2 * PI)) + 2 * PI) % (2 * PI)) / (2 * PI)) * ND) % ND;
        const lorOf = (a, b) => { // detector indices a, b -> [θ, s]
          const p1 = (a * 2 * PI) / ND; let d = (((b - a) % ND) + ND) % ND; if (d === 0) d = 1;
          const dl = (d * 2 * PI) / ND; let psi = (p1 + p1 + dl) / 2, s = Math.cos(dl / 2);
          psi = ((psi % (2 * PI)) + 2 * PI) % (2 * PI); if (psi >= PI) { psi -= PI; s = -s; }
          return [psi, s];
        };
        let lastKey = '', ev = [];
        const events = (N) => {
          const key = `${src.value}|${h1.x.toFixed(3)}|${h1.y.toFixed(3)}|${h2.x.toFixed(3)}|${h2.y.toFixed(3)}`;
          if (key !== lastKey) {
            lastKey = key; ev = [];
            for (let i = 0; i < NMAX; i++) {
              let P; if (src.value === 'ph') P = PH[i]; else P = U[i] < 0.6 ? [h1.x, h1.y] : [h2.x, h2.y];
              const ux = Math.cos(AL[i]), uy = Math.sin(AL[i]), pu = P[0] * ux + P[1] * uy, disc = Math.sqrt(Math.max(0, pu * pu - (P[0] ** 2 + P[1] ** 2) + 1));
              const t1 = -pu + disc, t2 = -pu - disc, a = qd(Math.atan2(P[1] + t1 * uy, P[0] + t1 * ux)), b = qd(Math.atan2(P[1] + t2 * uy, P[0] + t2 * ux));
              const [th, s] = lorOf(a, b);
              ev.push({ P, a, b, th, s, dt: ((Math.abs(t1) - Math.abs(t2)) * RCM) / CCM });
            }
          }
          return ev;
        };
        let info = {};
        v.render(() => {
          const N = Math.round(nEv.value), E = events(N), tau = win.value, rf = 0.1 * act.value * (tau / 6), nR = Math.round(N * rf);
          h2.visible = h1.visible = src.value === 'pt';
          // ring
          A.circle(0, 0, 1, { color: 'muted', width: 1 });
          for (let i = 0; i < ND; i++) { const a = (i * 2 * PI) / ND; A.line(Math.cos(a), Math.sin(a), 1.05 * Math.cos(a), 1.05 * Math.sin(a), { color: 'muted', width: 2, alpha: 0.5 }); }
          if (src.value === 'ph') for (const q of ACT) A.circle(q[3], q[4], 0, { color: 'muted' });
          if (src.value === 'ph') { const e = ACT[0]; A.curve((t) => [e[3] + e[1] * Math.cos(t), e[4] + e[2] * Math.sin(t)], 0, 2 * PI, { color: 'accent', width: 1.4, alpha: 0.7 }); for (let k = 1; k < ACT.length; k++) { const q = ACT[k]; A.curve((t) => [q[3] + q[1] * Math.cos(t), q[4] + q[2] * Math.sin(t)], 0, 2 * PI, { color: q[0] > 0 ? 'orange' : 'red', width: 1.4 }); } }
          // sinogram counts: trues inside the window, randoms
          const sino = new Float64Array(NT * NS); let kept = 0;
          const bin = (th, s) => { const i = Math.min(NT - 1, Math.floor((th / PI) * NT)), j = Math.min(NS - 1, Math.max(0, Math.floor(((s + 1) / 2) * NS))); sino[(NS - 1 - j) * NT + i]++; };
          for (let i = 0; i < N; i++) { const e = E[i]; if (Math.abs(e.dt) <= tau) { kept++; bin(e.th, e.s); } }
          for (let i = 0; i < nR; i++) { const [th, s] = lorOf(Math.floor(RA[i] / (2 * PI) * ND) % ND, Math.floor(RB[i] / (2 * PI) * ND) % ND); bin(th, s); }
          const mx = Math.max(...sino, 1);
          showImage(B, sino, NT, NS, { lo: 0, hi: Math.max(2, mx * 0.55), id: 'pet', extra: `${N}|${kept}|${nR}|${lastKey}` }); frame(B, NT, NS);
          const nShow = 28;
          for (let i = 0; i < nShow; i++) {
            const e = E[i], inw = Math.abs(e.dt) <= tau, a1 = (e.a * 2 * PI) / ND, a2 = (e.b * 2 * PI) / ND;
            A.segment([Math.cos(a1), Math.sin(a1)], [Math.cos(a2), Math.sin(a2)], { color: inw ? 'green' : 'red', width: 1, alpha: inw ? 0.55 : 0.8, dash: !inw });
          }
          if (src.value === 'pt') {
            for (const [h, c] of [[h1, 'gold'], [h2, 'pink']]) {
              const r0 = Math.hypot(h.x, h.y), ph0 = Math.atan2(h.y, h.x);
              B.path(Array.from({ length: 61 }, (_, k) => { const th = (k / 60) * PI; return [(th / PI) * NT, ((r0 * Math.cos(th - ph0) + 1) / 2) * NS]; }), { color: c, width: 1.4, dash: true, alpha: 0.9 });
            }
          }
          // timing histogram (true events, all, then randoms)
          const edges = Array.from({ length: 61 }, (_, k) => -6 + (k * 12) / 60), cnt = new Float64Array(60);
          for (let i = 0; i < N; i++) { const k = Math.floor((E[i].dt + 6) / 0.2); if (k >= 0 && k < 60) cnt[k]++; }
          const cm = Math.max(...cnt, 1), rnd = (nR / (2 * tau)) * 0.2 / cm;
          C.bars(Array.from(cnt, (q) => q / cm), { x0: -5.9, dx: 0.2, color: 'accent' });
          C.vband(-tau, tau, { color: 'green', alpha: 0.1, edges: true });
          C.hline(rnd, { color: 'red', width: 1.6 });
          C.vline(-(2 * RCM) / CCM, { color: 'muted', dash: true }); C.vline((2 * RCM) / CCM, { color: 'muted', dash: true });
          C.text('±2R/c', (2 * RCM) / CCM + 0.1, 0.92, { size: 11, align: 'left', color: 'muted' });
          info = { kept, N, nR, rf, lost: 1 - kept / N, tmax: (2 * RCM) / CCM };
        });
        v.legend([['accent', 'true pairs (all)'], ['green', 'accepted by the window'], ['red', 'randoms (level)']]);
        v.readout(() => `Largest possible time difference $2R/c=${fx(info.tmax, 2)}$ ns. Window $\\tau=${fx(win.value, 1)}$ ns keeps $${info.kept}$ of $${info.N}$ true events (${fx(100 * info.lost, 1)}% lost) and admits $${info.nR}$ random events: randoms/trues $=${fx(100 * info.rf, 1)}\\%$, growing in proportion to $a\\,\\tau$.`);
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Concept',
      name: 'PET attenuation correction is path-independent',
      statement: String.raw`Let the two annihilation photons travel along a line of response $L$ of total length $\ell$, and let the emission point sit at distance $t$ from one end. The probability that photon 1 escapes is $e^{-\int_0^{t}\mu}$ and that photon 2 escapes is $e^{-\int_{t}^{\ell}\mu}$. Both must be detected for the event to count, so the survival probability of the pair is
$$P_{\rm coinc}=e^{-\int_0^{t}\mu\,d\ell}\;e^{-\int_t^{\ell}\mu\,d\ell}=e^{-\int_L\mu\,d\ell},$$
**independent of $t$**: it depends only on the line, not on where along it the annihilation happened. The attenuation correction factor of the LOR is therefore $\mathrm{ACF}=e^{+\int_L\mu\,d\ell}$, obtained from a transmission (or CT) measurement of the line integral of $\mu$ at 511 keV. Single-photon emission has no such property.`,
      idea: String.raw`The survival probabilities of the two photons are exponentials of path integrals over complementary pieces of the line, and the exponent of a product is the sum of exponents, $\int_0^t+\int_t^\ell=\int_0^\ell$. The depth variable cancels. This is the Beer–Lambert law (imaging-2.2) applied twice, and it is the reason PET is quantitative: one measured number per LOR, a ray sum of $\mu$ as in imaging-3.1, corrects the emission data exactly (for narrow-beam, scatter-free photons), whereas SPECT (4.5) needs the whole $\mu$ map and gets only an approximate correction.`,
      caption: String.raw`**Drag the gold annihilation point** anywhere in the body and set the **direction** of the line of response. Right: the survival probability of each photon along the LOR and their product, which is a horizontal line; move the point along the LOR and the product does not change. Switch to **one photon (SPECT-like)** to see the dependence on depth that single-photon imaging suffers. The lower plot gives the attenuation correction factor of every parallel LOR at this angle; the gold dot is the current one.`,
      deps: ['imaging-4.6', 'imaging-2.2', 'imaging-3.1'],
      tags: ['PET', 'attenuation correction', 'Beer–Lambert'],
      refs: ['Prince–Links ch. 9'],
      scope: String.raw`Narrow-beam photons: scattered photons are not accounted for (they are removed from the LOR's survival and also contaminate other LORs). Attenuation map (illustrative, at 511 keV): water $0.096\ \mathrm{cm^{-1}}$ (NIST XCOM $\mu/\rho=0.0969$ and $0.0896\ \mathrm{cm^2/g}$ at 0.5 and 0.6 MeV, interpolated); lung and bone are obtained by scaling the water value with assumed densities (0.27 and about 1.8 g/cm³, taking the same mass attenuation coefficient as water), so only orders of magnitude are meaningful. The 40 cm field of view is an illustrative size.`,
      viz(v) {
        const SIZE = 40, K = SIZE / 2, MUW = 0.096;
        const MU = [[MUW, 0.85, 0.65, 0, 0, 0], [-MUW * 0.73, 0.28, 0.45, 0.4, 0.02, 10], [-MUW * 0.73, 0.28, 0.45, -0.4, 0.02, -10], [0.085, 0.1, 0.1, 0, -0.5, 0], [0.085, 0.07, 0.05, 0.62, -0.38, 0], [0.085, 0.07, 0.05, -0.62, -0.38, 0]];
        const W = 80, img = raster((x, y) => ellAt(MU, x, y), W, W, 2);
        const A = v.stage({ x: [0, W], y: [0, W], equal: true, axes: false, height: 330, title: 'Attenuation map at 511 keV and a line of response', minWidth: 260 });
        const B = v.stage({ x: [-20, 20], y: [0, 1.05], axes: 'box', gutter: true, height: 330, xlabel: 'position along the LOR (cm)', ylabel: 'survival probability', title: 'Escape probability of each photon', minWidth: 260 });
        const C = v.stage({ x: [-20, 20], y: [1, 60], ylog: true, axes: 'box', gutter: true, height: 250, xlabel: 'LOR offset $s$ (cm)', ylabel: 'ACF $=e^{\\int\\mu}$', title: 'Correction factor of parallel LORs at this angle', minWidth: 260, full: true });
        const ang = v.slider('LOR direction $\\theta$ (°)', 0, 179, 25, { step: 1, int: true });
        const mode = v.select('detect', [{ value: 'pet', label: 'both photons (PET)' }, { value: 'one', label: 'one photon (SPECT-like)' }], 'pet');
        const P = (x) => ((x + 1) * W) / 2;
        const h = A.handle(P(0.2), P(0.25), { color: 'gold', r: 9 });
        const N = 240;
        let info = {};
        v.render(() => {
          const th = (ang.value * PI) / 180, c = Math.cos(th), sn = Math.sin(th);
          const x0 = (h.x / W) * 2 - 1, y0 = (h.y / W) * 2 - 1, s = x0 * c + y0 * sn, tp = -x0 * sn + y0 * c; // LOR direction d = (-sin, cos)
          showImage(A, img, W, W, { lo: -0.01, hi: 0.19, id: 'mu', smooth: true }); frame(A, W, W);
          const ends = [[s * c + 1.4 * sn, s * sn - 1.4 * c], [s * c - 1.4 * sn, s * sn + 1.4 * c]];
          A.segment([P(ends[0][0]), P(ends[0][1])], [P(ends[1][0]), P(ends[1][1])], { color: 'orange', width: 1.6 });
          A.dot(P(ends[0][0]), P(ends[0][1]), { r: 5, color: 'orange', label: 'det. 1', labelPos: 'se' }); A.dot(P(ends[1][0]), P(ends[1][1]), { r: 5, color: 'orange', label: 'det. 2', labelPos: 'ne' });
          // line integrals
          const ts = [], cum = []; let acc = 0; const T0 = -1.4, dt = 2.8 / N;
          for (let i = 0; i <= N; i++) { const t = T0 + i * dt, x = s * c - t * sn, y = s * sn + t * c; ts.push(t); if (i > 0) acc += ellAt(MU, x, y) * dt * K; cum.push(acc); }
          const tot = acc, atT = (t) => cum[clamp(Math.round((t - T0) / dt), 0, N)];
          const p2 = (i) => Math.exp(-cum[i]), p1 = (i) => Math.exp(-(tot - cum[i]));
          // photon 1 travels towards +t (detector 2 end): survival exp(-(tot - cum)); photon 2 towards -t: exp(-cum)
          B.path(ts.map((t, i) => [t * K, p1(i)]), { color: 'accent', width: 2.2 });
          if (mode.value === 'pet') {
            B.path(ts.map((t, i) => [t * K, p2(i)]), { color: 'pink', width: 2.2 });
            B.path(ts.map((t, i) => [t * K, p1(i) * p2(i)]), { color: 'green', width: 3 });
          }
          B.vline(tp * K, { color: 'gold', dash: true });
          const ia = clamp(Math.round((tp - T0) / dt), 0, N);
          B.dot(tp * K, p1(ia), { r: 5, color: 'accent' });
          if (mode.value === 'pet') { B.dot(tp * K, p2(ia), { r: 5, color: 'pink' }); B.dot(tp * K, p1(ia) * p2(ia), { r: 6, color: 'green' }); }
          // ACF profile
          C.fn((q) => Math.exp(K * ellProj(MU, th, q / K)), { color: 'accent', width: 2.2, n: 300, domain: [-20, 20] });
          C.dot(s * K, Math.exp(tot), { r: 7, color: 'gold' });
          const ia2 = clamp(Math.round((tp * 0.4 - T0) / dt), 0, N);
          info = { s: s * K, tot, surv: Math.exp(-tot), pa: p1(ia), pb: p2(ia), prod: p1(ia) * p2(ia), prod2: p1(ia2) * p2(ia2), exact: Math.exp(-K * ellProj(MU, th, s)) };
        });
        v.legend([['accent', 'photon 1 → detector 2'], ['pink', 'photon 2 → detector 1'], ['green', 'both photons (product)']]);
        v.readout(() => mode.value === 'pet'
          ? `At the gold point: $P_1=${fx(info.pa, 4)}$, $P_2=${fx(info.pb, 4)}$, product $${fx(info.prod, 5)}$. At another point on the same LOR the product is $${fx(info.prod2, 5)}$; the exact $e^{-\\int\\mu}=${fx(info.exact, 5)}$. The line integral is $\\int_L\\mu=${fx(info.tot, 3)}$ ⇒ ACF $=${fx(Math.exp(info.tot), 2)}$.`
          : `Single photon: the escape probability $${fx(info.pa, 4)}$ at the gold point differs from the value $${fx(info.pb === 0 ? 0 : Math.exp(-info.tot) , 4)}$ obtained at the far end, and changes continuously with depth, so no single number per line corrects it.`);
      },
    },
  ],
};
