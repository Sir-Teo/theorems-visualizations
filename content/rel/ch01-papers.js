// Special and General Relativity — Chapter 1, landmark papers: Michelson & Morley (1887).
//
// Data (verified): the paper's tables of micrometer readings (Am. J. Sci. 34: 333–345, 1887; transcription on
// Wikisource, "On the Relative Motion of the Earth and the Luminiferous Ether"): means of six turns at each of the
// sixteen marks (16, 1, …, 16) near noon on July 8, 9, 11 and near 6 p.m. on July 8, 9, 12; one division = 0.02
// wavelength; noon turns counter-clockwise, evening turns clockwise. Their stated expectation, 2Dv²/V² with
// D = 2 × 10⁷ wavelengths (about 11 m) and v/V = 10⁻⁴: 0.4 fringe; their conclusion: "certainly less than the
// twentieth part of this, and probably less than the fortieth part".
// Modern bound: Herrmann et al. (2009), rotating optical cavities, Δc/c ~ 1 × 10⁻¹⁷ (arXiv:1002.1284).
// Sun's motion relative to the CMB: 370 km/s (Planck 2018).

const D2R = Math.PI / 180;
const DWL = 2e7; // D in wavelengths
const C = 299792.458; // km/s
const READ = {
  noon: { dir: 1, days: { 'July 8': [44.7, 44.0, 43.5, 39.7, 35.2, 34.7, 34.3, 32.5, 28.2, 26.2, 23.8, 23.2, 20.3, 18.7, 17.5, 16.8, 13.7], 'July 9': [57.4, 57.3, 58.2, 59.2, 58.7, 60.2, 60.8, 62.0, 61.5, 63.3, 65.8, 67.3, 69.7, 70.7, 73.0, 70.2, 72.2], 'July 11': [27.3, 23.5, 22.0, 19.3, 19.2, 19.3, 18.7, 18.8, 16.2, 14.3, 13.3, 12.8, 13.3, 12.3, 10.2, 7.3, 6.5] } },
  evening: { dir: -1, days: { 'July 8': [61.2, 63.3, 63.3, 68.2, 67.7, 69.3, 70.3, 69.8, 69.0, 71.3, 71.3, 70.5, 71.2, 71.2, 70.5, 72.5, 75.7], 'July 9': [26.0, 26.0, 28.2, 29.2, 31.5, 32.0, 31.3, 31.7, 33.0, 35.8, 36.5, 37.3, 38.8, 41.0, 42.7, 43.7, 44.0], 'July 12': [66.8, 66.5, 66.0, 64.3, 62.2, 61.0, 61.3, 59.7, 58.2, 55.7, 53.7, 54.7, 55.0, 58.2, 58.5, 57.0, 56.0] } },
};
/** Readings (divisions) → fringe displacement: ×0.02 wavelength, linear drift over the turn removed, mean removed. */
function reduce(r) {
  const w = r.map((x) => 0.02 * x), drift = (w[16] - w[0]) / 16, d = w.map((x, k) => x - drift * k);
  const m = d.slice(0, 16).reduce((s, x) => s + x, 0) / 16;
  return d.map((x) => x - m);
}
/** Second-harmonic fit a·cos 2θ + b·sin 2θ over the 16 marks (θ_k = dir·k·22.5°). */
function harm2(z, dir) {
  let a = 0, b = 0;
  for (let k = 0; k < 16; k++) { const th = dir * k * 22.5 * D2R; a += (z[k] * Math.cos(2 * th)) / 8; b += (z[k] * Math.sin(2 * th)) / 8; }
  return { amp: Math.hypot(a, b), phase: Math.atan2(b, a) / 2 };
}
const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];

export default {
  collection: 'rel',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.13
    {
      num: '1.13',
      kind: 'Paper',
      name: 'Relative Motion of the Earth and the Luminiferous Ether',
      paper: { authors: 'A. A. Michelson and E. W. Morley', year: 1887, title: 'On the Relative Motion of the Earth and the Luminiferous Ether', venue: 'American Journal of Science (3rd series) 34 (203): 333–345', doi: '10.2475/ajs.s3-34.203.333' },
      introduces: ['rel-1.4'],
      statement: String.raw`Michelson and Morley floated an interferometer (waves-6.8) on a stone slab in a trough of mercury, folded each arm by mirrors to an optical length $D \approx 11$ m ($2\times10^7$ wavelengths of yellow light), and turned it slowly through full circles, reading the position of the white-light fringes at sixteen marks. If light travelled at a fixed speed $V$ through an ether that the Earth crosses at its orbital speed $v$, the round trip along the motion would take longer than the trip across it, and turning the apparatus through $90°$ would shift the fringes by
$$2D\,\frac{v^2}{V^2} = 0.4 \text{ fringe}\qquad (v/V = 10^{-4}).$$
In six sets of observations (noon and evening, July 1887) the shift was "certainly less than the twentieth part of this, and probably less than the fortieth part", so the relative velocity of Earth and ether was probably below one-sixth of the orbital velocity and certainly below one-quarter. This is the Michelson–Morley null result (rel-1.4); modern versions with rotating optical cavities find no anisotropy of the speed of light down to $\Delta c/c \sim 10^{-17}$.`,
      idea: String.raw`Nineteenth-century optics needed a medium for light waves. Fresnel's partially dragged ether explained stellar aberration and Fizeau's moving-water experiment, and predicted that the Earth moves through the ether; experiments of first order in $v/V$ could not detect it, because effects cancel to that order. Michelson's 1881 Potsdam attempt was second order but its expected shift (0.04 fringe) was barely above the noise, and Lorentz showed it had been overestimated by a factor of 2. The 1887 version multiplied the path tenfold by repeated reflection and removed strains by floating the slab, so the expected 0.4 fringe was unmistakable, and none appeared. FitzGerald (1889) and Lorentz (1892) explained it by a contraction of moving bodies along their motion, and Einstein's 1905 relativity made the constancy of the speed of light a postulate, with the contraction as a consequence. The experiment became the textbook evidence for special relativity, though how much it influenced Einstein is debated.`,
      caption: String.raw`**Left**: the apparatus seen from above, turning on its mercury float (one turn every 12 s; ▶/⏸), with the light folded along both arms; drag the **ether wind** arrowhead to change its direction. **Right**: fringe displacement against the angle turned. The **curve** is what the ether theory predicts for the chosen speed $v$ (30 km/s, the Earth's orbital speed, gives $\pm0.2$ fringe); the **points** are the paper's own readings (mean of three days, noon or evening, drift removed), the thin lines the individual days; dotted, as in their Fig. 6, one-eighth of the prediction. **Bottom**: the view in the telescope, fringes predicted by the ether theory against those observed. Switch on **length contraction** and the prediction vanishes; push $v$ to 370 km/s, the Sun's speed relative to the cosmic microwave background, and the predicted shift is 60 fringes.`,
      deps: ['waves-6.8'],
      refs: [],
      tags: ['ether', 'interferometry', 'history'],
      credit: 'A. A. Michelson & E. W. Morley, 1887',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Michelson%E2%80%93Morley_experiment' },
      viz(v) {
        const which = v.select('readings', [{ value: 'noon', label: 'noon (July 8, 9, 11)' }, { value: 'evening', label: 'evening (July 8, 9, 12)' }], 'noon', { onChange: () => { const H = fitOf(which.value); W.set(1.25 * Math.cos(H.phase), 1.25 * Math.sin(H.phase)); } });
        const vS = v.slider('ether wind $v$ (km/s)', 1, 400, 30, { log: true });
        const lc = v.toggle('length contraction (FitzGerald 1889, Lorentz 1892)', false);
        const sA = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, axes: false, height: 330, weight: 0.85, minWidth: 250, title: 'the interferometer, from above' });
        const sB = v.stage({ x: [0, 360], y: [-0.3, 0.3], axes: 'box', height: 330, weight: 1.25, xticks: [0, 90, 180, 270, 360], xlabel: 'angle turned (°)', ylabel: 'fringe shift', title: 'fringe displacement over one turn' });
        const sC = v.stage({ x: [-2.5, 2.5], y: [0, 2], axes: false, height: 104, full: true });
        const fitOf = (k) => { const S = READ[k], days = Object.values(S.days), mean = days[0].map((_, i) => days.reduce((s, d) => s + d[i], 0) / days.length); return harm2(reduce(mean), S.dir); };
        const H0 = fitOf('noon');
        const W = sA.handle(1.25 * Math.cos(H0.phase), 1.25 * Math.sin(H0.phase), { color: 'teal', r: 7, constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [(1.25 * x) / r, (1.25 * y) / r]; } });
        const PERIOD = 12, M16 = Array.from({ length: 17 }, (_, k) => k);
        let st = null;
        v.animate((t) => {
          const th = (((t % PERIOD) / PERIOD) * 360) * D2R, psi = Math.atan2(W.y, W.x), vv = vS.value;
          const amp = lc.value ? 0 : (DWL * vv * vv) / (C * C); // amplitude (half the 90° swing)
          const pred = (a) => amp * Math.cos(2 * (a - psi));
          const S = READ[which.value], dayZ = Object.entries(S.days).map(([n, r]) => [n, reduce(r)]);
          const days = Object.values(S.days), mean = days[0].map((_, i) => days.reduce((s, d) => s + d[i], 0) / days.length), z = reduce(mean), H = harm2(z, S.dir);
          const angle = (k) => ((((S.dir * k * 22.5) % 360) + 360) % 360);
          const obsAt = (a) => { // observed displacement interpolated at angle a (degrees)
            const pts = M16.map((k) => [angle(k), z[k]]).sort((p, q) => p[0] - q[0]); pts.push([360, pts[0][1]]);
            for (let i = 0; i < pts.length - 1; i++) if (a >= pts[i][0] && a <= pts[i + 1][0]) { const u = (a - pts[i][0]) / (pts[i + 1][0] - pts[i][0] || 1); return pts[i][1] + u * (pts[i + 1][1] - pts[i][1]); }
            return 0;
          };
          // ---- left: apparatus
          sA.circle(0, 0, 1.12, { fill: 'muted', fillAlpha: 0.12, color: 'muted', width: 1.2 });
          for (let k = 0; k < 16; k++) { const a = k * 22.5 * D2R; sA.line(1.12 * Math.cos(a), 1.12 * Math.sin(a), 1.2 * Math.cos(a), 1.2 * Math.sin(a), { color: 'muted', width: 1.4 }); }
          const sq = [[-0.78, -0.78], [0.78, -0.78], [0.78, 0.78], [-0.78, 0.78]].map((p) => rot(p, th));
          sA.poly(sq, { fill: 'orange', fillAlpha: 0.16, color: 'orange', width: 1.4 });
          // folded light paths along both arms: four passes between near and far mirrors
          const arm = (sw) => { const L = (x, y) => rot(sw ? [y, x] : [x, y], th); const P = [[0, 0], [0.72, -0.075], [0.17, -0.04], [0.72, 0], [0.17, 0.04], [0.72, 0.075]].map(([x, y]) => L(x, y));
            sA.path(P, { color: 'gold', width: 1.4 });
            const f0 = L(0.74, -0.11), f1 = L(0.74, 0.11); sA.line(f0[0], f0[1], f1[0], f1[1], { color: 'ink', width: 3.2 });
            for (const y of [-0.04, 0.04]) { const n0 = L(0.15, y - 0.022), n1 = L(0.15, y + 0.022); sA.line(n0[0], n0[1], n1[0], n1[1], { color: 'ink', width: 3.2 }); } };
          arm(false); arm(true);
          const bs = rot([0.06, 0.06], th), bs2 = rot([-0.06, -0.06], th); sA.line(bs[0], bs[1], bs2[0], bs2[1], { color: 'accent', width: 3 });
          const src = rot([-0.66, 0], th), tel = rot([0, -0.66], th);
          sA.line(src[0], src[1], 0, 0, { color: 'gold', width: 1.3, dash: [3, 3] }); sA.line(0, 0, tel[0], tel[1], { color: 'gold', width: 1.3, dash: [3, 3] });
          sA.dot(src[0], src[1], { r: 5, color: 'gold' }); sA.dot(tel[0], tel[1], { r: 5, color: 'ink' });
          const arm1 = rot([0.95, 0], th); sA.text('arm 1', arm1[0], arm1[1], { size: 11, color: 'muted', align: 'center' });
          // ether wind
          const u = [Math.cos(psi), Math.sin(psi)], n = [-u[1], u[0]];
          for (const o of [-0.8, 0, 0.8]) sA.arrow(-1.25 * u[0] + o * n[0], -1.25 * u[1] + o * n[1], 1.15 * u[0] + o * n[0], 1.15 * u[1] + o * n[1], { color: 'teal', width: 1.2, alpha: 0.45, head: 7 });
          sA.text(`ether wind ${Math.round(vv)} km/s`, W.x, W.y, { dx: W.x > 0 ? -10 : 10, dy: W.y > 0 ? 16 : -16, align: W.x > 0 ? 'right' : 'left', color: 'teal', size: 11.5, weight: 700 });
          // ---- right: fringe displacement
          const thDeg = th / D2R, top = Math.max(0.3, amp * 1.2);
          sB.setView([0, 360], [-top, top]);
          sB.hline(0, { color: 'faint', width: 1 });
          if (amp > 0) { sB.fn((a) => pred(a * D2R) / 8, { color: 'muted', width: 1.4, dash: [2, 4] }); sB.fn((a) => pred(a * D2R), { color: 'accent', width: 2.4 }); }
          else sB.text('with contraction, the ether theory predicts no shift at all', 180, 0.6 * top, { color: 'accent', size: 12, weight: 600, align: 'center' });
          for (const [, zz] of dayZ) sB.path(M16.map((k) => [angle(k), zz[k]]).sort((p, q) => p[0] - q[0]), { color: 'gold', width: 1, alpha: 0.45 });
          for (const k of M16) sB.dot(angle(k), z[k], { r: 4.5, color: 'ink' });
          sB.vline(thDeg, { color: 'orange', width: 1.4 });
          // ---- bottom: telescope view (fringes)
          const pShift = pred(th) * (lc.value ? 0 : 1), oShift = obsAt(thDeg);
          const ink = v.rgb('ink'), pan = v.rgb('panel');
          sC.raster((x, y) => {
            const sh = y > 1 ? pShift : oShift, I = Math.cos(Math.PI * (x - sh)) ** 2, k = 0.15 + 0.85 * I;
            return [pan[0] + (ink[0] - pan[0]) * (1 - k), pan[1] + (ink[1] - pan[1]) * (1 - k), pan[2] + (ink[2] - pan[2]) * (1 - k)];
          }, { res: 2, key: `${pShift.toFixed(4)}|${oShift.toFixed(4)}` });
          sC.vline(0, { color: 'red', width: 1.6 });
          sC.hline(1, { color: 'panel', width: 3 });
          sC.text('ether theory', -2.45, 1.5, { color: 'accent', size: 12, weight: 700, align: 'left' });
          sC.text('observed', -2.45, 0.5, { color: 'ink', size: 12, weight: 700, align: 'left' });
          sC.text(`${v.fix(pShift, 3)} fringe`, 2.45, 1.5, { color: 'accent', size: 12, weight: 700, align: 'right' });
          sC.text(`${v.fix(oShift, 3)} fringe`, 2.45, 0.5, { color: 'ink', size: 12, weight: 700, align: 'right' });
          st = { amp, H, vv };
        }, { still: 1.5 });
        v.legend([['accent', 'ether theory'], ['muted', 'one-eighth of it (their Fig. 6)', { dash: true }], ['ink', 'observed, mean of 3 days', { dot: true }], ['gold', 'individual days'], ['orange', 'current angle']]);
        v.readout(() => {
          if (!st) return '';
          const { amp, H, vv } = st, pp = 2 * amp, opp = 2 * H.amp, vmax = 30 * Math.sqrt(H.amp / ((DWL * 900) / (C * C)));
          const pred = lc.value ? 'with length contraction the ether theory predicts **0**' : `ether theory at ${Math.round(vv)} km/s: $2Dv^2/V^2$ = **${v.fix(pp, pp < 10 ? 3 : 1)}** fringe for a quarter turn`;
          return `${pred} · observed (${which.value}, fitted $\\cos 2\\theta$ term): **${v.fix(opp, 3)}** fringe, ${v.fix((0.4 / opp), 0)} times smaller than the 0.4 expected at 30 km/s (the paper: less than 1/20, probably less than 1/40) → $v_{\\rm ether} <$ ${v.fix(vmax, 1)} km/s, a sensitivity of $\\Delta c/c \\approx ${v.sci(opp / (4 * DWL), 2)}$ · today: rotating optical cavities, $\\Delta c/c \\lesssim 10^{-17}$ (Herrmann et al. 2009)`;
        });
      },
    },
  ],
};
