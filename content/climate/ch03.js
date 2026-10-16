// Climate Science — Chapter 3: Radiative forcing and climate sensitivity
import { GRID, F2X, SIG, whenControl, lw, adjustJob, adjustAdvance, runJob, still, fx, twoBox, at, PS, RD, G0, humidity, opticalDepths, longwave, BASE, ARR } from './ch03.shared.js';

/** Interface heights (km) of a temperature profile on the column grid. */
function edgeHeights(T) {
  const { N, e } = GRID, z = [0]; let acc = 0;
  for (let i = 0; i < N; i++) { acc += ((RD * T[i]) / G0) * Math.log(e[i] / e[i + 1]) * 1e-3; z.push(acc); }
  return z;
}
function midHeights(T) { const ze = edgeHeights(T); return T.map((_, i) => 0.5 * (ze[i] + ze[i + 1])); }

export default {
  collection: 'climate',
  chapter: 3,
  title: 'Radiative forcing and climate sensitivity',
  summary: String.raw`A radiative forcing is a change in the energy budget imposed from outside the climate system; the climate responds until the imbalance is gone. The ratio of warming to forcing, the climate sensitivity, is the central number of the field: the Planck response alone gives about 1.2 K per doubling of CO₂, feedbacks raise the assessed best estimate to about 3 K. Equilibrium and transient sensitivities differ because the ocean takes time to warm, and no single line of evidence pins the number down, so assessments combine several.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Radiative forcing and effective radiative forcing',
      credit: 'concept developed in IPCC assessments from 1990; the "effective" version is the AR5 (2013) and AR6 (2021) standard',
      statement: String.raw`A **radiative forcing** is the change in the net downward energy flux at a chosen level, usually the top of the atmosphere or the tropopause, caused by an imposed change (more CO₂, a volcanic aerosol, a brighter Sun) while the climate is otherwise held fixed. Three versions are in use. The **instantaneous** forcing changes only the radiative properties and keeps all temperatures and the humidity unchanged. The **stratospheric-temperature-adjusted** forcing (SARF) lets the stratosphere, which relaxes within weeks, settle to a new radiative balance. The **effective radiative forcing** (ERF) additionally lets the troposphere's fast responses (clouds, water vapour, the lapse rate, the land surface) adjust while the global-mean *surface temperature response* is excluded. Forcing is measured in W m⁻²; by construction it is what drives the slow warming described by the sensitivity (climate-3.5).`,
      idea: String.raw`Radiative transfer (Schwarzschild's equation, climate-2.6) gives the flux change as soon as the absorber amount changes. For CO₂ the band centre is already opaque, so extra CO₂ raises the emission level; that effect is small at the top of the atmosphere but large at the tropopause, where the extra downward emission from the stratosphere is felt. The stratosphere is nearly in radiative equilibrium, so it cools until it again radiates away what it absorbs, which enlarges the top-of-atmosphere forcing and shrinks the tropopause one until the two agree. The fast tropospheric adjustments then add or subtract a few per cent. The logarithmic law of CO₂ forcing (climate-2.8) fixes how the number scales with concentration.`,
      caption: String.raw`Slide the CO₂ multiple. Left: the control column (280 ppm, grey) and the stratospherically adjusted column (red); middle: the forcing read at each height, instantaneous (blue) and after adjustment (red), which becomes the same at every level; bottom: the numbers as bars, with the AR6 assessment for doubled CO₂ beside them (the adjustments there are AR6's, not computed on this page). The adjusted run takes a second or so. The model's upper stratosphere over-cools, so its adjusted forcing exceeds AR6's; the toggle holds the layers above 3 hPa fixed, which brings the top-of-atmosphere number nearer AR6's but breaks the equality of forcing at all levels, and shows where the excess comes from.`,
      deps: ['climate-2.6', 'climate-2.8'],
      refs: ['IPCC AR6 WG1 ch. 7'],
      tags: ['forcing', 'radiative transfer', 'stratosphere'],
      scope: String.raw`The column is the chapter-2 synthetic-spectrum, clear-sky, fixed-relative-humidity model: its instantaneous top-of-atmosphere forcing for doubled CO₂ (about 2.7 W m⁻²) is close to what AR6's SARF of 3.75 W m⁻² implies once the 30 % stratospheric-adjustment share in AR6 Table 7.3 is removed, but its upper-stratosphere cooling is too strong (the synthetic spectra lack the detail that limits it), so adjusting the whole stratosphere gives about 5 W m⁻² instead of 3.75; the layers above 3 hPa supply about 1.6 W m⁻² of that. Holding them fixed gives about 3.6 W m⁻² at the top but then the forcing differs between the top and the tropopause, so that run is shown only as a diagnostic. Tropospheric adjustments are AR6's assessed values for 2×CO₂ (Table 7.4), not computed.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Radiative_forcing' },
      viz(v) {
        const kk = v.slider('CO₂ multiple of 280 ppm', 0.5, 4, 2, { step: 0.01, onChange: () => later() });
        const top = v.toggle('hold the top layers (above 3 hPa) fixed', false, { onChange: () => start() });
        const sA = v.stage({ x: [170, 300], y: [0, 56], axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 250, xlabel: 'temperature (K)', ylabel: 'height (km)', title: 'temperature profile' });
        const sB = v.stage({ x: [-1.5, 9], y: [0, 56], axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 250, xlabel: 'forcing (W/m²)', ylabel: 'height (km)', title: 'forcing read at each level' });
        const sC = v.stage({ x: [0, 12], y: [-0.8, 6], axes: 'box', gutter: true, height: 300, full: true, xlabel: '', ylabel: 'W/m²', title: 'the forcing numbers', xticks: [] });
        let ctrl = null, base = null, inst = null, job = null, res = null, cancel = null, gen = 0, debounce = null;
        function start() {
          if (!ctrl) return;
          gen++; const my = gen; if (cancel) cancel();
          const c = 280 * kk.value;
          inst = lw(ctrl.T, ctrl.Ts, c, ctrl.q); res = null;
          job = adjustJob(ctrl, c, top.value ? 3 : 0.1, 100, 70);
          cancel = runJob(adjustAdvance, job, () => { if (my === gen) v.invalidate(); }, () => { if (my === gen) { res = { T: Array.from(job.T), L: lw(job.T, ctrl.Ts, c, ctrl.q) }; v.invalidate(); } });
        }
        function later() { if (debounce) clearTimeout(debounce); debounce = setTimeout(start, 90); v.invalidate(); }
        v.onCleanup(() => { gen++; if (cancel) cancel(); if (debounce) clearTimeout(debounce); });
        whenControl((c) => { ctrl = c; base = lw(c.T, c.Ts, 280, c.q); start(); v.invalidate(); });
        let R = null;
        v.render(() => {
          if (!ctrl) { sA.corner('integrating the control column…', 'tl', { color: 'muted' }); R = null; return; }
          const { N, pm } = GRID, ze = edgeHeights(ctrl.T), zm = midHeights(ctrl.T);
          sA.path(ctrl.T.map((t, i) => [t, zm[i]]), { color: 'muted', width: 2.2 });
          const live = res ? res.T : job ? job.T : null, zl = live ? midHeights(live) : null;
          if (live) sA.path(live.map((t, i) => [t, zl[i]]), { color: 'red', width: 2.6 });
          sA.hline(ze[ctrl.kt], { color: 'faint', dash: [4, 4] }); sA.text('100 hPa', 172, ze[ctrl.kt], { size: 11, color: 'muted', align: 'left', baseline: 'bottom', dy: -2 });
          sA.dot(ctrl.Ts, 0, { color: 'muted', r: 4 });
          const dI = (i) => base.up[i] - base.down[i] - (inst.up[i] - inst.down[i]);
          const xs = Array.from({ length: N + 1 }, (_, i) => [dI(i), ze[i]]);
          sB.vline(0, { color: 'faint' });
          sB.path(xs, { color: 'blue', width: 2.6 });
          let adj = null;
          if (res) { const dA = (i) => base.up[i] - base.down[i] - (res.L.up[i] - res.L.down[i]); adj = { toa: dA(N), trop: dA(ctrl.kt), fn: dA }; sB.path(Array.from({ length: N + 1 }, (_, i) => [dA(i), ze[i]]), { color: 'red', width: 2.6 }); }
          sB.hline(ze[ctrl.kt], { color: 'faint', dash: [4, 4] });
          sB.dot(dI(N), ze[N], { color: 'blue', r: 4.5, label: fx(v, dI(N), 2), labelPos: 'sw' });
          sB.dot(dI(ctrl.kt), ze[ctrl.kt], { color: 'blue', r: 4.5, label: fx(v, dI(ctrl.kt), 2), labelPos: 'ne' });
          if (adj) sB.dot(adj.toa, ze[N], { color: 'red', r: 4.5, label: fx(v, adj.toa, 2), labelPos: 'ne' });
          // bars
          const bar = (x, a, b, col, lab, tail, o = {}) => { sC.rect(x - 0.38, Math.min(a, b), x + 0.38, Math.max(a, b), { fill: col, fillAlpha: o.alpha ?? 0.75, stroke: false, hatch: o.hatch }); sC.text(lab, x, -0.12, { size: 10, color: 'ink', align: 'center', baseline: 'top' }); if (tail != null) sC.text(tail, x, Math.max(a, b), { size: 11, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 }); };
          sC.hline(0, { color: 'faint' });
          bar(0.9, 0, dI(N), 'blue', 'instant, top', fx(v, dI(N), 2));
          bar(2.1, 0, dI(ctrl.kt), 'teal', 'instant, trop.', fx(v, dI(ctrl.kt), 2));
          if (adj) bar(3.3, 0, adj.toa, 'red', 'adjusted', fx(v, adj.toa, 2)); else sC.text('adjusting…', 3.3, 0.3, { size: 11, color: 'muted', align: 'center' });
          sC.vline(4.3, { color: 'faint', dash: [3, 4] });
          sC.text('AR6 assessment for doubled CO₂, not computed here', 4.5, 5.55, { size: 11, color: 'muted', align: 'left' });
          const a = [['temp.', -0.6], ['H₂O', 0.22], ['clouds', 0.45], ['albedo', 0.11]];
          bar(5.2, 0, 3.75, 'gold', 'AR6 SARF', '3.75', { hatch: true, alpha: 0.5 });
          let run = 3.75; a.forEach(([nm, d], i) => { bar(6.4 + i * 1.1, run, run + d, d < 0 ? 'orange' : 'green', nm, (d > 0 ? '+' : '−') + Math.abs(d).toFixed(2), { alpha: 0.6 }); run += d; });
          bar(11.2, 0, 3.93, 'gold', 'AR6 ERF', null, { alpha: 0.85 }); sC.text('3.93', 11.2, 3.5, { size: 11, color: 'ink', align: 'center' }); sC.line(11.2, 3.93 - 0.47, 11.2, 3.93 + 0.47, { color: 'ink', width: 1.5 }); sC.text('± 0.47', 11.2, 4.5, { size: 10.5, color: 'ink', align: 'center', baseline: 'bottom' });
          R = { toa: dI(N), trop: dI(ctrl.kt), adj, c: 280 * kk.value, cut: top.value ? 3 : 0 };
        });
        v.legend([['muted', 'control (280 ppm)'], ['blue', 'instantaneous'], ['red', 'stratosphere adjusted'], ['gold', 'AR6 (assessed)', { area: true }]]);
        v.readout(() => !R ? 'integrating the control column (a few seconds)…' : String.raw`CO₂ ${fx(v, R.c, 0)} ppm (×${fx(v, kk.value, 2)}): instantaneous forcing **${fx(v, R.toa, 2)}** W/m² at the top, **${fx(v, R.trop, 2)}** at 100 hPa; ${R.adj ? String.raw`after the stratosphere ${R.cut ? `(below ${R.cut} hPa)` : ''} adjusts: **${fx(v, R.adj.toa, 2)}** at the top and ${fx(v, R.adj.trop, 2)} at 100 hPa${R.cut ? '; the held top layers take up the difference' : ': equal, as it must be once the stratosphere is in balance; the model overshoots AR6 for doubled CO₂'}` : 'adjusting the stratosphere…'}
AR6, doubled CO₂ from 278 ppm: SARF 3.75, tropospheric adjustments −0.60 + 0.22 + 0.45 + 0.11 = +0.18, ERF **3.93 ± 0.47** W/m²`);
      },
    },
//@@ITEMS
  ],
};
