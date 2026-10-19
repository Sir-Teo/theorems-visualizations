// Medical Imaging — Chapter 4: Nuclear medicine and emission tomography
// Part 1 (this file): 4.2 effective half-life, 4.3 Anger gamma camera, 4.4 collimator resolution–sensitivity trade-off.
// Part 2 (ch04-b.js): 4.5 SPECT, 4.6 PET coincidence and lines of response, 4.7 PET attenuation correction.
// Part 3 (ch04-c.js): 4.8 MLEM and OSEM, 4.9 time-of-flight PET, 4.10 tracer kinetics and the Patlak plot.
// (4.1, radioactive decay as a stochastic first-order process, is cross-listed from the collection `kin`.)
import { clamp, fx, mean, showImage, frame, rng32, gauss, MATS, mu, TUBES, tubeMeans, centroid } from './ch04.shared.js';

const LN2 = Math.LN2;
const fmtT = (h) => (h < 1 ? `${fx(h * 60, h * 60 < 10 ? 1 : 0)}\\ \\mathrm{min}` : h < 48 ? `${fx(h, h < 10 ? 2 : 1)}\\ \\mathrm{h}` : `${fx(h / 24, h / 24 < 10 ? 2 : 1)}\\ \\mathrm{d}`);

export default {
  collection: 'imaging',
  chapter: 4,
  title: 'Nuclear medicine and emission tomography',
  summary: String.raw`In nuclear medicine the patient is the source: a radiotracer follows a physiological process and emitted photons are counted. Gamma cameras with collimators form planar images; SPECT reconstructs them tomographically, and PET uses coincident annihilation photons for better sensitivity and exact attenuation correction. Poisson statistics make iterative maximum-likelihood reconstruction natural, and tracer-kinetic models turn images into physiology.`,
  items: [
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Concept',
      name: 'Effective half-life',
      statement: String.raw`A radiopharmaceutical in the body disappears by two independent first-order processes: radioactive decay with rate constant $\lambda_p=\ln 2/T_p$ and biological clearance (excretion, washout) with $\lambda_b=\ln 2/T_b$. The activity retained is $A(t)=A_0e^{-(\lambda_p+\lambda_b)t}$, so the **effective half-life** satisfies
$$\frac1{T_{\rm eff}}=\frac1{T_p}+\frac1{T_b},\qquad T_{\rm eff}=\frac{T_pT_b}{T_p+T_b}<\min(T_p,T_b).$$
The total number of decays in the organ, $\tilde A=\int_0^\infty A\,dt=A_0T_{\rm eff}/\ln2$, is the "cumulated activity" that sets the radiation dose.`,
      idea: String.raw`Rates of independent first-order loss processes add (imaging-4.1 and the kinetics of first-order decay), and a half-life is $\ln2$ divided by the rate. The faster process therefore dominates: a tracer cleared in an hour cannot stay long however slowly its nuclide decays, and a short-lived nuclide is gone by decay however slowly the body clears it. Both $T_p$ and $T_b$ appear symmetrically, as in resistors in parallel.`,
      caption: String.raw`Pick an **isotope** and slide the **biological half-life** $T_b$ (log scale). Left: physical decay (dashed), biological clearance (orange) and the product, the effective curve (green), on a log activity axis where each is a straight line; the dots mark where each falls to one half. Right: $T_{\rm eff}$ against $T_b$ — it follows $T_b$ when clearance is fast and saturates at $T_p$ when clearance is slow. Drag the gold handle along the curve.`,
      deps: ['kin-9.7', 'pharm-2.2'],
      tags: ['half-life', 'dosimetry'],
      refs: ['Prince–Links ch. 7'],
      scope: String.raw`Both processes first-order and independent. Real organ washout is often multi-exponential, in which case each component has its own $T_{\rm eff}$. The biological half-lives offered here are free choices for illustration, not tabulated values; the physical half-lives are rounded (about 6 h, 110 min, 68 min, 8 d).`,
      viz(v) {
        const ISO = { tc: ['Tc-99m', 6.0], f18: ['F-18', 110 / 60], ga: ['Ga-68', 68 / 60], i131: ['I-131', 192] };
        const iso = v.select('isotope', [{ value: 'tc', label: 'Tc-99m' }, { value: 'f18', label: 'F-18' }, { value: 'ga', label: 'Ga-68' }, { value: 'i131', label: 'I-131' }], 'tc');
        const tb = v.slider('biological half-life $T_b$ (h)', 0.3, 3000, 24, { log: true, sig: 2 });
        const A = v.stage({ x: [0, 40], y: [0.02, 1.4], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'time (h)', ylabel: 'activity fraction', title: 'Activity left in the organ', minWidth: 280 });
        const B = v.stage({ x: [0.3, 3000], y: [0.2, 400], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'biological half-life $T_b$ (h)', ylabel: '$T_{\\rm eff}$ (h)', title: 'Effective vs biological half-life', minWidth: 280 });
        const teffOf = (tp, b) => (tp * b) / (tp + b);
        const h = B.handle(24, 5, { color: 'gold', r: 8, constrain: (x) => [clamp(x, 0.3, 3000), teffOf(ISO[iso.value][1], clamp(x, 0.3, 3000))] });
        h.onDrag = () => { tb.set(h.x); };
        v.legend([['ink', 'physical decay'], ['orange', 'biological clearance'], ['green', 'effective (both)']]);
        let info = {};
        v.render(() => {
          const tp = ISO[iso.value][1], b = tb.value, te = teffOf(tp, b), tmax = Math.min(4 * Math.max(te, 0.4 * tp), 4000);
          A.setView([0, tmax], [0.02, 1.4]);
          const f = (T) => (t) => Math.exp((-LN2 * t) / T);
          A.fn(f(tp), { color: 'ink', dash: true, width: 1.6, alpha: 0.8 });
          A.fn(f(b), { color: 'orange', width: 1.8 });
          A.fn(f(te), { color: 'green', width: 3 });
          A.hline(0.5, { color: 'grid', dash: true });
          A.dot(tp, 0.5, { r: 4.5, color: 'ink' }); A.dot(b, 0.5, { r: 4.5, color: 'orange' }); A.dot(te, 0.5, { r: 6, color: 'green', });
          A.tex('T_{\\rm eff}', te, 0.5, { color: 'green', dy: -16, dx: 6 });
          B.fn((x) => teffOf(tp, x), { color: 'green', width: 2.6 });
          B.fn((x) => x, { color: 'orange', dash: true, width: 1.2 });
          B.hline(tp, { color: 'ink', dash: true, width: 1.2 });
          B.text(`$T_p = ${fx(tp, 2)}$ h`, 0.4, tp * 1.25, { size: 11, color: 'ink' });
          h.set(b, te);
          const kT = (LN2 / tp) + (LN2 / b), area = v.M.integrate((t) => Math.exp(-kT * t), 0, 14 / kT, 600);
          info = { tp, b, te, kT, area, ratio: te / tp, cum: te / LN2 };
        });
        v.readout(() => `$T_p=${fmtT(info.tp)}$, $T_b=${fmtT(info.b)}$ ⇒ $T_{\\rm eff}=\\dfrac{T_pT_b}{T_p+T_b}=${fmtT(info.te)}$ (${fx(100 * info.ratio, 0)}% of $T_p$).\nRates add: $\\lambda_p+\\lambda_b=${fx(info.kT, 4)}\\ \\mathrm{h^{-1}}$ $=\\ln2/T_{\\rm eff}$ ✓.  Cumulated activity $\\int A\\,dt$ by numerical integration $=${fx(info.area, 3)}\\,A_0\\mathrm{h}$ vs $T_{\\rm eff}/\\ln2=${fx(info.cum, 3)}\\,A_0\\mathrm{h}$ ✓`);
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Invention',
      name: 'Anger gamma camera',
      statement: String.raw`The **Anger camera** forms an image of a gamma-emitting tracer with one large scintillation crystal viewed by an array of photomultiplier tubes (PMTs). A gamma ray absorbed at $(x,y)$ produces a flash whose light spreads over several tubes; each tube $i$, at position $(x_i,y_i)$, reports a signal $s_i$. The event position is estimated by the signal-weighted centroid
$$\hat x=\frac{\sum_i s_ix_i}{\sum_i s_i},\qquad \hat y=\frac{\sum_i s_iy_i}{\sum_i s_i},$$
and the total $z=\sum_is_i$ is proportional to the deposited energy. A pulse-height window on $z$ accepts photopeak events and rejects Compton-scattered photons, which have lost energy. A collimator (4.4) in front of the crystal makes the position of the event correspond to a line of sight into the body.`,
      idea: String.raw`Each flash is shared among neighbouring tubes in proportion to the solid angle each subtends, so the centre of mass of the tube signals sits close to the flash itself; a few dozen tubes locate events to a small fraction of the tube pitch. Counting noise in the photoelectrons (Poisson, imaging-1.7) limits the precision: the position error scales as $1/\sqrt{N}$ and so does the relative width of the energy peak. Near the edge there are no tubes beyond the crystal to balance the light, so the centroid is pulled inwards and the total signal falls — which is why real cameras apply position-dependent corrections.`,
      caption: String.raw`**Drag the gold flash** inside the circular crystal; shaded tubes show each signal and the green ring is the centroid estimate (noise frozen; **Resample** draws new photoelectron counts). Raise or lower the **photoelectron yield** $N_0$. Middle: the estimate against the true position along $y=0$ — the line bends inward at the edge — with $\pm1\sigma$ from 300 simulated events. Right: the pulse-height spectrum (photopeak plus a scatter continuum) and the energy window.`,
      deps: ['kin-9.7'],
      tags: ['gamma camera', 'scintillation'],
      refs: ['Prince–Links ch. 8'],
      credit: 'H. O. Anger, 1958 (Scintillation camera, Rev. Sci. Instrum. 29: 27–33)',
      links: { doi: 'https://doi.org/10.1063/1.1715998' },
      scope: String.raw`Model, not a device: 19 tubes on a hexagonal lattice of pitch 1, light distribution $\propto(1+r^2/0.62^2)^{-3/2}$, Poisson photoelectron counts, ideal tubes and crystal, no depth-of-interaction effects. $N_0$ is the mean total number of photoelectrons for a central event; the scatter continuum is a made-up triangular shape for illustration.`,
      viz(v) {
        const R = 2.25;
        const A = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: false, height: 330, title: 'Tubes, flash and centroid', minWidth: 250 });
        const B = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], axes: 'box', gutter: true, height: 330, xlabel: 'true position $x$ (tube pitches)', ylabel: 'estimated $\\hat x$', title: 'Position bias along $y=0$', minWidth: 250 });
        const C = v.stage({ x: [0, 1.3], y: [0, 1.15], axes: 'box', gutter: true, height: 330, xlabel: 'pulse height $z/z_{\\rm photopeak}$', ylabel: 'relative counts', title: 'Pulse-height spectrum', minWidth: 250 });
        const n0 = v.slider('photoelectron yield $N_0$', 40, 4000, 500, { log: true, sig: 2 });
        const win = v.slider('energy window ± (%)', 2, 30, 10, { step: 1, int: true });
        const rs = rng32(11), ZZ = Array.from({ length: 19 }, () => gauss(rs));
        let seed = 1; const zs = () => { const r = rng32(seed * 977 + 5); return TUBES.map(() => gauss(r)); };
        let zNoise = zs();
        v.button('Resample', () => { seed++; zNoise = zs(); });
        const h = A.handle(0.55, 0.3, { color: 'gold', r: 9, constrain: (x, y) => { const d = Math.hypot(x, y); return d > R ? [(x * R) / d, (y * R) / d] : [x, y]; } });
        const mcCache = {};
        const mc = (N0) => {
          const key = Math.round(N0 * 100); if (mcCache[key]) return mcCache[key];
          const r = rng32(2024), pts = [];
          for (let k = 0; k <= 24; k++) {
            const x = -2.4 + 0.2 * k, m = tubeMeans(x, 0, N0), ex = [];
            for (let e = 0; e < 300; e++) ex.push(centroid(m.map((q) => Math.max(0, q + Math.sqrt(q) * gauss(r)))).x);
            const mu_ = mean(ex), sd_ = Math.sqrt(mean(ex.map((q) => (q - mu_) ** 2)));
            pts.push({ x, m: centroid(m).x, sd: sd_ });
          }
          return (mcCache[key] = pts);
        };
        let info = {};
        v.render(() => {
          const N0 = n0.value, m = tubeMeans(h.x, h.y, N0), sig = m.map((q, i) => Math.max(0, q + Math.sqrt(q) * zNoise[i]));
          const est = centroid(sig), mx = Math.max(...sig);
          A.circle(0, 0, R, { color: 'muted', width: 1.4, dash: true });
          TUBES.forEach(([tx, ty], i) => {
            A.circle(tx, ty, 0.5, { color: 'accent', width: 1, fill: 'accent', fillAlpha: 0.05 + 0.6 * (sig[i] / mx) });
            A.text(String(Math.round(sig[i])), tx, ty, { size: 10, color: 'ink' });
          });
          A.dot(h.x, h.y, { r: 5, color: 'gold' });
          A.dot(est.x, est.y, { r: 9, hollow: true, color: 'green' });
          A.segment([h.x, h.y], [est.x, est.y], { color: 'green', width: 1.2 });
          const pts = mc(N0);
          B.line(-2.5, -2.5, 2.5, 2.5, { color: 'grid', dash: true });
          B.between((x) => { const p = pts.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a)); return p.m - p.sd; }, (x) => { const p = pts.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a)); return p.m + p.sd; }, -2.4, 2.4, { fill: 'accent', fillAlpha: 0.18 });
          B.path(pts.map((p) => [p.x, p.m]), { color: 'accent', width: 2.4 });
          B.vline(R, { color: 'muted', dash: true }); B.vline(-R, { color: 'muted', dash: true });
          B.dot(h.x, centroid(tubeMeans(h.x, 0, N0)).x, { r: 5, color: 'gold' });
          // spectrum
          const sE = 1 / Math.sqrt(N0), w = win.value / 100;
          const peak = (e) => Math.exp(-0.5 * ((e - 1) / sE) ** 2);
          const scat = (e) => (e > 0.55 && e < 1.0 ? 0.16 * ((e - 0.55) / 0.45) : 0);
          const sc2 = (e) => peak(e) + scat(e);
          C.fn(sc2, { color: 'ink', width: 2, n: 500, fill: 'ink', fillAlpha: 0.08 });
          C.vband(1 - w, 1 + w, { color: 'green', alpha: 0.13, edges: true });
          const acc = (f, a, b) => v.M.integrate(f, a, b, 400), pk = acc(peak, 0.2, 1.8), pkIn = acc(peak, 1 - w, 1 + w), scT = acc(scat, 0, 1.3), scIn = acc(scat, 1 - w, 1 + w);
          const fwhm = 2.3548 * sE, zc = centroid(tubeMeans(h.x, h.y, N0)).z / N0;
          info = { err: Math.hypot(est.x - h.x, est.y - h.y), fwhm, pkIn: pkIn / pk, scIn: scT > 0 ? scIn / scT : 0, zc };
        });
        v.readout(() => `Position error of this event: $${fx(info.err, 2)}$ tube pitches. Energy resolution FWHM $=2.355/\\sqrt{N_0}=${fx(100 * info.fwhm, 1)}\\%$. A ±${win.value}% window keeps $${fx(100 * info.pkIn, 0)}\\%$ of photopeak events and $${fx(100 * info.scIn, 0)}\\%$ of the model scatter continuum.\nTotal signal at this position is $${fx(100 * info.zc, 0)}\\%$ of the central value (edge events lose light).`);
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Concept',
      name: 'Collimator resolution–sensitivity trade-off',
      statement: String.raw`A parallel-hole collimator of hole diameter $d$, hole length $L$ and septal thickness $t$ lets through only photons travelling nearly along the holes. With effective length $L_e=L-2/\mu_{\rm Pb}$ (septal edges are partly transparent), a point source at distance $z$ is imaged with geometric resolution (FWHM)
$$R_c\approx d\,\frac{L_e+z}{L_e},$$
which worsens linearly with distance, and a fraction
$$g\approx K^2\Big(\frac d{L_e}\Big)^2\Big(\frac{d}{d+t}\Big)^2$$
of the emitted photons passes, nearly independent of $z$ ($K\approx0.24$ for hexagonal holes). At fixed $L_e,z$ and fixed open-area ratio $d/(d+t)$, changing $d$ gives $g\propto R_c^2$. With fixed septal thickness $t$, the open-area ratio changes too: halving the blur loses more than a factor of four in counts. System resolution adds the intrinsic camera resolution in quadrature, $R_s=\sqrt{R_c^2+R_i^2}$.`,
      idea: String.raw`A hole accepts rays within an angle of about $d/L_e$ of its axis, so the cone of lines the camera "sees" through one hole has width $d(L_e+z)/L_e$ at depth $z$. Narrower or longer holes shrink the cone and sharpen the picture, but they also shrink the solid angle each hole presents to the source, and with it the count rate, in proportion to $(d/L_e)^2$. Thicker septa stop more oblique photons but throw away detector area (the factor $(d/(d+t))^2$), so $t$ is chosen only just thick enough to stop septal penetration. Counts then set noise through Poisson statistics (imaging-1.7), which is why resolution and image quality pull against each other.`,
      caption: String.raw`Set the **hole diameter, length and septal thickness** (or choose a preset design) and drag the gold source up and down. Left: holes that the source can see are shaded green, and the accepted cone widens with distance. Middle: resolution $R_c$ and $R_s$ against distance. Right: sensitivity against $R_c$ at the chosen distance as $d$ varies — a curve with local log–log slope between 2 and 4 when $t$ is fixed — with your design marked.`,
      deps: ['imaging-4.3', 'imaging-1.9'],
      tags: ['collimator', 'gamma camera'],
      refs: ['Prince–Links ch. 8'],
      scope: String.raw`Parallel-hole collimator, 140 keV photons (lead $\mu\approx26\ \mathrm{cm^{-1}}$ from the chapter-2 attenuation model), point source in air, no septal penetration or scatter in the body. The formulae are the standard textbook approximations as recalled by the author and the value $K\approx0.24$ is quoted from patent literature for hexagonal holes (some texts give a slightly different constant); the three preset designs and the intrinsic resolution $R_i=3.5$ mm are illustrative round numbers, not any manufacturer's specification.`,
      verify: true,
      viz(v) {
        const muPb = mu(MATS.lead, 140) / 10; // per mm
        const K = 0.24, Ri = 3.5;
        const A = v.stage({ x: [-40, 40], y: [-45, 125], equal: true, axes: false, height: 400, title: 'Collimator and point source', minWidth: 280 });
        const B = v.stage({ x: [0, 200], y: [0, 40], axes: 'box', gutter: true, height: 400, xlabel: 'source distance $z$ (mm)', ylabel: 'FWHM (mm)', title: 'Resolution vs distance', minWidth: 250 });
        const C = v.stage({ x: [2, 40], y: [1e-5, 3e-3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 400, xlabel: 'resolution $R_c$ at $z$ (mm)', ylabel: 'sensitivity $g$', title: 'Sensitivity vs resolution', minWidth: 250 });
        const PRE = { hr: [1.2, 32, 0.2], gp: [1.8, 27, 0.25], hs: [3.2, 22, 0.4] };
        const pre = v.select('design', [{ value: 'hr', label: 'high resolution' }, { value: 'gp', label: 'general purpose' }, { value: 'hs', label: 'high sensitivity' }, { value: 'c', label: 'custom' }], 'gp', {
          onChange: (val) => { if (PRE[val]) { d.set(PRE[val][0]); L.set(PRE[val][1]); t.set(PRE[val][2]); pre.value = val; } },
        });
        const d = v.slider('hole diameter $d$ (mm)', 0.8, 6, PRE.gp[0], { step: 0.05, onChange: () => { pre.value = 'c'; } });
        const L = v.slider('hole length $L$ (mm)', 12, 60, PRE.gp[1], { step: 1, onChange: () => { pre.value = 'c'; } });
        const t = v.slider('septal thickness $t$ (mm)', 0.1, 1.5, PRE.gp[2], { step: 0.05, onChange: () => { pre.value = 'c'; } });
        const zs = v.slider('source distance $z$ (mm)', 5, 200, 80, { step: 1 });
        const hz = A.handle(0, 80, { color: 'gold', r: 9, constrain: (x, y) => [0, clamp(y, 5, 125)] });
        hz.onDrag = () => { zs.set(hz.y); };
        const gf = (dd, LL, tt) => { const Le = LL - 2 / muPb; return K * K * (dd / Le) ** 2 * (dd / (dd + tt)) ** 2; };
        const Rc = (dd, LL, z) => { const Le = LL - 2 / muPb; return (dd * (Le + z)) / Le; };
        let info = {};
        v.render(() => {
          const dd = d.value, LL = L.value, tt = t.value, z = zs.value, Le = LL - 2 / muPb, reach = (z * dd) / Le;
          hz.set(0, Math.min(z, 125));
          // geometry
          const pitch = dd + tt, nh = Math.floor(40 / pitch);
          for (let k = -nh; k <= nh; k++) {
            const xc = k * pitch, see = Math.abs(xc) - dd / 2 <= reach;
            if (see) A.rect(xc - dd / 2, -LL, xc + dd / 2, 0, { fill: 'green', fillAlpha: 0.5, stroke: false });
            A.rect(xc + dd / 2, -LL, xc + dd / 2 + tt, 0, { fill: 'muted', fillAlpha: 0.9, stroke: false });
          }
          A.rect(-40, -LL - 6, 40, -LL, { fill: 'accent', fillAlpha: 0.35, stroke: false });
          A.text('crystal', -38, -LL - 3, { size: 10, align: 'left', baseline: 'middle' });
          A.segment([0, Math.min(z, 125)], [-reach - dd / 2, 0], { color: 'orange', width: 1.2 });
          A.segment([0, Math.min(z, 125)], [reach + dd / 2, 0], { color: 'orange', width: 1.2 });
          if (z > 125) A.text(`source at ${z} mm ↑`, 0, 122, { size: 11, color: 'gold', align: 'center' });
          else A.dot(0, z, { r: 7, color: 'gold' });
          // resolution curves
          B.fn((x) => Rc(dd, LL, x), { color: 'accent', width: 2.4, domain: [0, 200] });
          B.fn((x) => Math.hypot(Rc(dd, LL, x), Ri), { color: 'green', width: 2.4, domain: [0, 200] });
          B.hline(Ri, { color: 'muted', dash: true });
          B.vline(z, { color: 'gold', dash: true });
          B.dot(z, Rc(dd, LL, z), { r: 5, color: 'accent' }); B.dot(z, Math.hypot(Rc(dd, LL, z), Ri), { r: 5, color: 'green' });
          // trade-off
          const pts = []; for (let q = 0; q <= 60; q++) { const dq = 0.8 + (5.5 * q) / 60; pts.push([Rc(dq, LL, z), gf(dq, LL, tt)]); }
          C.path(pts, { color: 'accent', width: 2.2 });
          for (const key of ['hr', 'gp', 'hs']) { const [a, b, c] = PRE[key]; C.dot(Rc(a, b, z), gf(a, b, c), { r: 4, color: 'muted', label: key.toUpperCase(), labelPos: 'se' }); }
          C.dot(Rc(dd, LL, z), gf(dd, LL, tt), { r: 8, color: 'gold' });
          const tmin = (6 * dd) / (muPb * LL - 3);
          info = { rc: Rc(dd, LL, z), rs: Math.hypot(Rc(dd, LL, z), Ri), g: gf(dd, LL, tt), Le, nh: Math.round((2 * reach) / pitch + 1), tmin, tt };
        });
        v.legend([['accent', 'collimator $R_c$'], ['green', 'system $R_s$ with $R_i=3.5$ mm'], ['gold', 'this source']]);
        v.readout(() => `$L_e=${fx(info.Le, 1)}$ mm. At $z=${zs.value}$ mm: $R_c=${fx(info.rc, 1)}$ mm, $R_s=${fx(info.rs, 1)}$ mm, about ${info.nh} holes see the source. Sensitivity $g=${fx(1e4 * info.g, 2)}\\times10^{-4}$ (one photon in ${fx(1 / info.g, 0)}).\nWith fixed $L$ and $t$, doubling $d$ doubles $R_c$ and multiplies $g$ by ${fx(gf(2 * d.value, L.value, t.value) / gf(d.value, L.value, t.value), 1)} here.  Rule-of-thumb septal thickness for ≤5% penetration, $6d/(\\mu L-3)$, is $${fx(info.tmin, 2)}$ mm${info.tt < info.tmin ? ' — **your septa are thinner: expect septal penetration**' : ' — your septa satisfy it'}.`);
      },
    },
  ],
};
