// Climate Science — Chapter 3: Radiative forcing and climate sensitivity
import { GRID, F2X, SIG, whenControl, lw, adjustJob, adjustAdvance, runJob, still, fx, twoBox, at, RD, G0, humidity, irf, irfInt } from './ch03.shared.js';

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
          bar(11.2, 0, 3.93, 'gold', 'AR6 ERF', null, { alpha: 0.85 }); sC.text('3.93', 11.2, 2.0, { size: 11, color: 'ink', align: 'center' }); sC.line(11.2, 3.93 - 0.47, 11.2, 3.93 + 0.47, { color: 'ink', width: 1.5 }); sC.text('± 0.47', 11.2, 4.5, { size: 10.5, color: 'ink', align: 'center', baseline: 'bottom' });
          R = { toa: dI(N), trop: dI(ctrl.kt), adj, c: 280 * kk.value, cut: top.value ? 3 : 0 };
        });
        v.legend([['muted', 'control (280 ppm)'], ['blue', 'instantaneous'], ['red', 'stratosphere adjusted'], ['gold', 'AR6 (assessed)', { area: true }]]);
        v.readout(() => !R ? 'integrating the control column (a few seconds)…' : String.raw`CO₂ ${fx(v, R.c, 0)} ppm (×${fx(v, kk.value, 2)}): instantaneous forcing **${fx(v, R.toa, 2)}** W/m² at the top, **${fx(v, R.trop, 2)}** at 100 hPa; ${R.adj ? String.raw`after the stratosphere ${R.cut ? `(below ${R.cut} hPa)` : ''} adjusts: **${fx(v, R.adj.toa, 2)}** at the top and ${fx(v, R.adj.trop, 2)} at 100 hPa${R.cut ? '; the held top layers take up the difference' : ': equal, as it must be once the stratosphere is in balance; the model overshoots AR6 for doubled CO₂'}` : 'adjusting the stratosphere…'}
AR6, doubled CO₂ from 278 ppm: SARF 3.75, tropospheric adjustments −0.60 + 0.22 + 0.45 + 0.11 = +0.18, ERF **3.93 ± 0.47** W/m²`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Concept',
      name: 'Forcing agents: greenhouse gases, aerosols, Sun, volcanoes',
      credit: 'values: IPCC AR6 WG1 (2021) Chapter 7, Table 7.8, with the AR5 (2013) values for comparison',
      statement: String.raw`Climate is pushed by a handful of agents, each with its own effective radiative forcing (climate-3.1) and its own uncertainty. Over 1750–2019 the assessed global-mean ERF of long-lived greenhouse gases is large and positive, led by CO₂ (+2.16 W m⁻²) then methane (+0.54), halogenated gases (+0.41) and nitrous oxide (+0.21); ozone adds about +0.47. Aerosols cool, through aerosol–radiation interactions (−0.22) and, more uncertainly, aerosol–cloud interactions (−0.84); land use cools slightly (−0.20); black carbon on snow, contrails and stratospheric water vapour add a few hundredths to tenths. Summed, the anthropogenic ERF is **+2.72 W m⁻²** (5–95 %: 1.96 to 3.48). The Sun's contribution since 1750 is close to zero (+0.01), and volcanic forcing is episodic, a large negative pulse after an eruption but no lasting trend, so it is left out of the table.`,
      idea: String.raw`Each agent is quantified by a different route: spectroscopy and radiative transfer for the gases (climate-2.6, climate-2.8), where the uncertainty is mostly in the concentrations' history and in adjustments; satellite and in-situ observations plus models for aerosols, which are short-lived, patchy, and act on clouds in ways that are hard to isolate (climate-3.10); reconstructions of irradiance for the Sun. Uncertainties are combined as independent errors, so the total range is narrower than the sum of the parts. The aerosol term is the largest uncertainty and partly hides the greenhouse forcing, which is why the total grows more slowly than the gas forcing alone.`,
      caption: String.raw`Bars are the AR6 best estimates with 5–95 % whiskers; the small diamonds are the AR5 values for 1750–2011. **Click a bar to switch that agent off or on** and watch the total: switch off the aerosols to see how much cooling they currently mask. The histogram on the right draws 4000 random worlds by sampling each included agent independently (a normal distribution matched to its 5–95 % range) and compares the spread of the total with AR6's quoted range.`,
      deps: ['climate-3.1'],
      refs: ['IPCC AR6 WG1 ch. 7'],
      tags: ['forcing', 'aerosols', 'greenhouse gases'],
      scope: String.raw`Values are global means for 1750–2019 from AR6 Table 7.8 (aerosol values are the 2019 single-year values; solar is based on total solar irradiance only). The ozone row is the AR6 combined troposphere-plus-stratosphere value; for AR5 the diamond is the sum of its separate tropospheric (+0.40) and stratospheric (−0.05) estimates. The sampling treats the agents as independent, normal and symmetric, which is a simplification of how AR6 combined them, yet it reproduces AR6's range closely.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Radiative_forcing' },
      viz(v) {
        // [label, AR6 best, lo, hi, AR5 best (1750–2011) or null, anthropogenic?]
        const ROWS = [
          ['CO₂', 2.16, 1.90, 2.41, 1.82, true], ['CH₄', 0.54, 0.43, 0.65, 0.48, true], ['N₂O', 0.21, 0.18, 0.24, 0.17, true], ['halogenated gases', 0.41, 0.33, 0.49, 0.36, true],
          ['ozone', 0.47, 0.24, 0.71, 0.35, true], ['stratospheric H₂O', 0.05, 0.0, 0.10, 0.07, true], ['aerosol–radiation', -0.22, -0.47, 0.04, -0.45, true], ['aerosol–cloud', -0.84, -1.45, -0.25, -0.45, true],
          ['land use', -0.20, -0.30, -0.10, -0.15, true], ['soot on snow', 0.08, 0.0, 0.18, 0.04, true], ['contrails & cirrus', 0.06, 0.02, 0.10, 0.05, true], ['Sun (not anthropogenic)', 0.01, -0.06, 0.08, 0.05, false],
        ];
        const n = ROWS.length, on = ROWS.map(() => true);
        const ar5 = v.toggle('show AR5 values (diamonds)', true);
        v.button('switch everything on', () => on.fill(true));
        const sA = v.stage({ x: [-2, 3.2], y: [-0.2, n + 0.6], axes: 'box', gutter: { l: 128, b: 40, t: 8, r: 8 }, height: 400, weight: 1.4, minWidth: 300, xlabel: 'effective radiative forcing 1750–2019 (W/m²)', ylabel: '', title: 'forcing by agent (click a bar)', yticks: ROWS.map((r, i) => [n - i, r[0]]) });
        const sB = v.stage({ x: [0, 5], y: [0, 1.1], axes: 'box', gutter: true, height: 400, weight: 0.9, minWidth: 250, xlabel: 'total anthropogenic ERF (W/m²)', ylabel: 'density', title: '4000 sampled worlds' });
        sA.onClick((x, y) => { const i = n - Math.round(y); if (i >= 0 && i < n) on[i] = !on[i]; v.invalidate(); });
        const rng = v.rng(7);
        const Z = Array.from({ length: 4000 }, () => ROWS.map(() => rng.normal()));
        let R = null;
        v.render(() => {
          sA.vline(0, { color: 'faint' });
          ROWS.forEach((r, i) => {
            const y = n - i, col = r[1] >= 0 ? (r[5] ? 'orange' : 'gold') : 'blue';
            sA.rect(Math.min(0, r[1]), y - 0.32, Math.max(0, r[1]), y + 0.32, { fill: col, fillAlpha: on[i] ? 0.75 : 0.1, stroke: false });
            sA.line(r[2], y, r[3], y, { color: on[i] ? 'ink' : 'faint', width: 1.4 }); sA.line(r[2], y - 0.15, r[2], y + 0.15, { color: on[i] ? 'ink' : 'faint', width: 1.4 }); sA.line(r[3], y - 0.15, r[3], y + 0.15, { color: on[i] ? 'ink' : 'faint', width: 1.4 });
            if (ar5.value && r[4] != null) sA.dot(r[4], y, { r: 4.5, color: 'purple', hollow: !on[i] });
            sA.text((r[1] >= 0 ? '+' : '−') + Math.abs(r[1]).toFixed(2), Math.max(r[3], 0) + 0.06, y, { size: 10.5, color: on[i] ? 'ink' : 'muted', align: 'left', baseline: 'middle' });
          });
          sA.text('click to switch off', -1.95, n + 0.35, { size: 10.5, color: 'muted', align: 'left' });
          const anth = ROWS.reduce((a, r, i) => a + (on[i] && r[5] ? r[1] : 0), 0), all = ROWS.reduce((a, r, i) => a + (on[i] ? r[1] : 0), 0);
          // sampling
          const sd = ROWS.map((r) => (r[3] - r[2]) / 3.29);
          const tot = Z.map((z) => ROWS.reduce((a, r, i) => a + (on[i] && r[5] ? r[1] + sd[i] * z[i] : 0), 0)).sort((a, b) => a - b);
          const q = (p) => tot[Math.min(tot.length - 1, Math.floor(p * tot.length))];
          const lo = q(0.05), hi = q(0.95);
          sB.vband(1.96, 3.48, { color: 'green', alpha: 0.12 });
          sB.text('AR6 5–95 %', 2.72, 1.06, { size: 10.5, color: 'green', align: 'center', baseline: 'top' });
          sB.hist(tot, { bins: 40, range: [0, 5], density: true, color: 'orange', fillAlpha: 0.45 });
          sB.vline(anth, { color: 'ink', width: 2 }); sB.line(lo, 0.05, hi, 0.05, { color: 'red', width: 3 });
                    R = { anth, all, lo, hi, sum: ROWS.reduce((a, r, i) => a + (r[5] ? r[1] : 0), 0) };
        });
        v.legend([['orange', 'warming agent'], ['blue', 'cooling agent'], ['purple', 'AR5 value', { dot: true }], ['red', 'sampled 5–95 %']]);
        v.readout(() => R && String.raw`Sum of the switched-on anthropogenic best estimates: **${fx(v, R.anth, 2)}** W/m² (all agents on: 2.72, AR6's total; with the Sun ${fx(v, R.all, 2)}) · sampled 5–95 % range ${fx(v, R.lo, 2)} to ${fx(v, R.hi, 2)} W/m², AR6: 1.96 to 3.48 · for scale, the four long-lived gas groups sum to 3.32 and the two aerosol terms to −1.06 W/m²`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Definition',
      name: 'Global warming potential',
      credit: 'metric introduced in the IPCC First Assessment Report (1990); values below follow AR6 (2021) Table 7.15',
      statement: String.raw`The **absolute global warming potential** of a gas is the radiative forcing from a one-kilogram pulse of it, integrated over a time horizon $H$: $\mathrm{AGWP}_x(H)=\int_0^H \mathrm{RF}_x(t)\,dt$. The **global warming potential** is the ratio to the same integral for one kilogram of CO₂: $\mathrm{GWP}_x(H)=\mathrm{AGWP}_x(H)/\mathrm{AGWP}_{\mathrm{CO_2}}(H)$. For a gas that decays as $e^{-t/\tau}$ with radiative efficiency $a_x$ per kilogram, $\mathrm{AGWP}_x=a_x\tau(1-e^{-H/\tau})$, whereas CO₂ is removed in several stages (it never fully leaves within centuries), so a short-lived gas has a large GWP for short horizons that falls as $H$ grows. In AR6 methane has GWP-20 of about 80 and GWP-100 of about 27–30; nitrous oxide about 273 for both 20 and 100 years.`,
      idea: String.raw`The pulse of gas decays by first-order loss (first-order loss, as in kin-1.5, gives $e^{-t/\tau}$ with half-life $\tau\ln 2$): methane's perturbation lifetime is 11.8 years, so it contributes strongly early on and nothing after a few decades, while CO₂ keeps a fraction of order 20 % in the air for millennia. Integrating over a long horizon dilutes the gas whose forcing has already died. Per kilogram, methane absorbs about a hundred times more than CO₂ at first, because a kilogram holds 2.7 times as many methane molecules and, at present concentrations, each added molecule absorbs about forty times more than an added CO₂ molecule (the CO₂ band centre is already saturated), which is why the early forcing is so large. For finite $H\ge0$ and $\tau>0$, the pulse-forcing antiderivative is $-a_x\tau e^{-t/\tau}$. The fundamental theorem pma 6.21 gives $a_x\tau(1-e^{-H/\tau})$ between zero and H. Applying the same evaluation to each exponential term of the chosen CO₂ impulse response, plus its constant retained fraction, gives the denominator. These are integrated pulse forcings under the stated convention, not temperature responses or an alternative assessment of published GWP values.`,
      caption: String.raw`Choose a gas and slide the horizon $H$. Left: forcing after a 1 kg pulse, on a log scale (CO₂ in grey, from its multi-model impulse response); right: the GWP computed as a function of horizon, with AR6's published values at 20, 100 and 500 years marked. The switch adds the CO₂ that methane oxidises to (about 75 % by AR6's central yield), which AR6 includes for fossil methane.`,
      deps: ['climate-3.2', 'kin-1.5', 'pma-6.21'],
      refs: ['IPCC AR6 WG1 ch. 7'],
      tags: ['emissions metrics', 'lifetime', 'methane'],
      scope: String.raw`Computed here from AR6 Table 7.15 radiative efficiencies and lifetimes with Joos et al.'s (2013) CO₂ impulse response; AR6's published values additionally include carbon-cycle feedbacks and chemical effects, so they differ by a few per cent (e.g. fossil methane GWP-100: 29.8 published against about 26.5 computed here, 28.5 with the oxidation CO₂). Mass per ppb uses the dry-air mass 5.1352×10¹⁸ kg of Trenberth & Smith (2005) and 28.97 g/mol; molar masses are standard values. GWP is a policy convention for pulses; it does not give the temperature effect of a gas (that is the GTP).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Global_warming_potential' },
      viz(v) {
        // τ (yr), a (W m⁻² ppb⁻¹), M (g/mol), AR6 GWP-20/100/500
        const G = {
          CH4: { n: 'methane', tau: 11.8, a: 5.7e-4, M: 16.043, g: [82.5, 29.8, 10.0], col: 'orange' },
          N2O: { n: 'nitrous oxide', tau: 109, a: 2.8e-3, M: 44.013, g: [273, 273, 130], col: 'orange' },
          HFC: { n: 'HFC-134a', tau: 14.0, a: 1.67e-1, M: 102.03, g: [4144, 1526, 436], col: 'orange' },
          CFC: { n: 'CFC-11', tau: 52.0, a: 2.91e-1, M: 137.37, g: [8321, 6226, 2093], col: 'orange' },
        };
        const gas = v.select('gas', [{ value: 'CH4', label: 'CH₄' }, { value: 'N2O', label: 'N₂O' }, { value: 'HFC', label: 'HFC-134a' }, { value: 'CFC', label: 'CFC-11' }], 'CH4');
        const H = v.slider('horizon $H$ (years)', 5, 500, 100, { log: true, sig: 2 });
        const ox = v.toggle('add the CO₂ from methane oxidation (75 %)', false);
        const kgppb = (M) => (5.1352e18 / 28.97e-3) * 1e-9 * M * 1e-3; // kg of gas in 1 ppb of dry air
        const aco2 = 1.33e-5 / kgppb(44.009);
        const gwp = (g, h, withOx) => {
          const ak = g.a / kgppb(g.M), A = irfInt(h);
          let num = ak * g.tau * (1 - Math.exp(-h / g.tau));
          if (withOx && g === G.CH4) { const k = 1 / g.tau, nst = 400, dt = h / nst; let s = 0; for (let i = 0; i < nst; i++) { const t = (i + 0.5) * dt; s += k * Math.exp(-k * t) * irfInt(h - t) * dt; } num += 0.75 * (44.009 / 16.043) * aco2 * s; }
          return num / (aco2 * A);
        };
        const sA = v.stage({ x: [0, 300], y: [1e-3, 1e3], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'years after the pulse', ylabel: 'forcing per kg, relative to CO₂ at t = 0', title: 'forcing from a 1 kg pulse' });
        const sB = v.stage({ x: [5, 500], xlog: true, y: [0, 100], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'time horizon $H$ (years)', ylabel: 'GWP', title: 'GWP against horizon' });
        let R = null;
        v.render(() => {
          const g = G[gas.value], ak = g.a / kgppb(g.M), rel = ak / aco2;
          sA.setView([0, 300], [1e-3, Math.max(1e3, 10 ** Math.ceil(Math.log10(rel * 2)))]);
          sA.fn((t) => irf(t), { color: 'muted', width: 2.4 });
          sA.fn((t) => rel * Math.exp(-t / g.tau), { color: g.col, width: 2.6 });
          sA.vline(Math.min(H.value, 300), { color: 'gold', dash: [5, 4] }); sA.text('$H$', Math.min(H.value, 300), Math.max(1e3, 10 ** Math.ceil(Math.log10(rel * 2))), { size: 12, color: 'gold', align: 'center', baseline: 'top', dy: 4 });
          const top = Math.max(2 * g.g[0], 5); sB.setView([5, 500], [0, top * 1.1]);
          sB.fn((h) => gwp(g, h, ox.value && gas.value === 'CH4'), { color: g.col, width: 2.6, n: 90 });
          g.g.forEach((val, i) => { const h = [20, 100, 500][i]; sB.dot(h, val, { color: 'ink', r: 5, hollow: true }); sB.text(String(val), h, val, { size: 11, color: 'ink', align: i === 2 ? 'right' : 'center', baseline: 'bottom', dy: -6, dx: i === 2 ? -4 : 0 }); });
          sB.vline(H.value, { color: 'gold', dash: [5, 4] });
          const here = gwp(g, H.value, ox.value && gas.value === 'CH4'); sB.dot(H.value, here, { color: 'gold', r: 6 });
          R = { here, g20: gwp(g, 20, ox.value && gas.value === 'CH4'), g100: gwp(g, 100, ox.value && gas.value === 'CH4'), g, rel };
        });
        v.legend([['muted', 'CO₂'], ['orange', 'the gas'], ['ink', 'AR6 published GWP', { dot: true }]]);
        v.readout(() => R && String.raw`${R.g.n}: τ = ${R.g.tau} yr, per kg its initial forcing is ${fx(v, R.rel, 0)}× CO₂'s · GWP(${fx(v, H.value, 0)} yr) = **${fx(v, R.here, R.here < 100 ? 1 : 0)}** · computed GWP-20 ${fx(v, R.g20, R.g20 < 100 ? 1 : 0)}, GWP-100 ${fx(v, R.g100, R.g100 < 100 ? 1 : 0)} against AR6's ${R.g.g[0]} and ${R.g.g[1]} (the published values also include carbon-cycle and chemical effects)`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Proposition',
      name: 'Planck response: about 1.2 K per CO₂ doubling',
      credit: 'standard in feedback analysis (e.g. Hansen et al. 1984; Soden & Held 2006); numbers from IPCC AR6 §7.4.2.1',
      statement: String.raw`If the whole surface and atmosphere warm together by $\Delta T$ and nothing else about the atmosphere changes (the same water vapour amount, clouds, albedo), the planet radiates more to space by $\Delta \mathrm{OLR}\approx -\alpha_P\,\Delta T$, with a **Planck response** $\alpha_P\approx -3.2$ W m⁻² K⁻¹. Balancing a forcing $\Delta F$ then needs $\Delta T_P=\Delta F/(-\alpha_P)$. For a CO₂ doubling, $\Delta F=3.93$ W m⁻² gives $\Delta T_P\approx 3.93/3.22\approx 1.2$ K. It is the temperature response with no feedbacks other than the one that always acts: warmer things emit more.`,
      idea: String.raw`The Stefan–Boltzmann law (climate-1.6) gives the slope: $d(\sigma T^4)/dT=4\sigma T^3$, which is 3.8 W m⁻² K⁻¹ at the effective emission temperature 255 K and 5.4 at the surface's 288 K. The real planet sits between, because the greenhouse effect makes the emission come from a range of heights, and the AR6 estimate $(\tilde g-1)\,4\sigma T_s^3\approx -3.3$ uses the fraction $\tilde g\approx 0.4$ of the surface emission trapped. Combined with the logarithmic CO₂ forcing (climate-2.8) this fixes the baseline from which all feedbacks (water vapour, albedo, clouds) are measured as multipliers. Taylor's theorem pma 5.15 makes the local blackbody slope precise: $\sigma(T+\Delta T)^4-\sigma T^4=4\sigma T^3\Delta T+6\sigma\xi^2(\Delta T)^2$ for some intermediate positive temperature $\xi$. The linear term is the restoring approximation and the remainder records its finite-change error. This blackbody calculation does not by itself determine the assessed all-sky Planck coefficient; the page's column calculation and the separately quoted assessment retain their stated scopes.`,
      caption: String.raw`The curves are the column's change in outgoing infrared when the surface and the whole atmosphere are warmed by $\Delta T$ at fixed specific humidity (blue) and at fixed relative humidity (green), with the black-body curves for 255 K and 288 K dashed. Set the forcing with the slider: where it meets a curve is the warming that restores balance. The bars compare model and AR6 numbers.`,
      deps: ['climate-1.6', 'climate-2.8', 'climate-3.1', 'pma-5.15'],
      refs: ['Archer ch. 7', 'IPCC AR6 WG1 ch. 7'],
      tags: ['Planck response', 'feedback', 'Stefan–Boltzmann'],
      scope: String.raw`The computed curves come from the chapter-2 clear-sky synthetic-spectrum column warmed uniformly (stratosphere included); AR6's all-sky Planck value, from radiative kernels, is −3.22 W m⁻² K⁻¹ (very likely −3.4 to −3.0), and we do not decompose the difference. The fixed-relative-humidity curve is not the Planck response: it adds the water-vapour feedback, and it is shown to preview how that feedback shrinks the slope (climate-4.2).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Climate_sensitivity' },
      viz(v) {
        const F = v.slider('forcing $\\Delta F$ (W/m²)', 0.5, 8, 3.93, { step: 0.01 });
        const sA = v.stage({ x: [-3, 6], y: [-12, 30], axes: 'box', gutter: true, height: 380, weight: 1.2, minWidth: 290, xlabel: 'uniform warming $\\Delta T$ (K)', ylabel: 'extra outgoing radiation (W/m²)', title: 'how fast the planet sheds heat' });
        const sB = v.stage({ x: [0, 5], y: [0, 4.5], axes: 'box', gutter: true, height: 380, weight: 0.8, minWidth: 250, xlabel: '', ylabel: 'warming that balances $\\Delta F$ (K)', title: 'the balancing warming', xticks: [[0.5, 'fixed q'], [1.5, 'fixed RH'], [2.5, 'AR6 Planck'], [3.5, 'AR6 best']] });
        let ctrl = null, X = null, Yq = null, Yr = null;
        whenControl((c) => {
          ctrl = c; X = []; Yq = []; Yr = [];
          const o0 = lw(c.T, c.Ts, 280, c.q).olr;
          for (let d = -3; d <= 6.001; d += 0.75) {
            const T = c.T.map((t) => t + d), Ts = c.Ts + d;
            X.push(d); Yq.push(lw(T, Ts, 280, c.q).olr - o0); Yr.push(lw(T, Ts, 280, humidity(T, GRID, {})).olr - o0);
          }
          v.invalidate();
        });
        const interp = (xs, ys, x) => { if (x <= xs[0]) return ys[0]; for (let i = 1; i < xs.length; i++) if (x <= xs[i]) { const f = (x - xs[i - 1]) / (xs[i] - xs[i - 1]); return ys[i - 1] + f * (ys[i] - ys[i - 1]); } return ys[ys.length - 1]; };
        const solve = (ys, f) => { let lo = X[0], hi = X[X.length - 1]; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (interp(X, ys, m) < f) lo = m; else hi = m; } return (lo + hi) / 2; };
        let R = null;
        v.render(() => {
          const TE = 255, TS = 288;
          sA.fn((d) => SIG * ((TE + d) ** 4 - TE ** 4), { color: 'muted', dash: [6, 4], width: 1.6 });
          sA.fn((d) => SIG * ((TS + d) ** 4 - TS ** 4), { color: 'faint', dash: [6, 4], width: 1.6 });
          sA.hline(F.value, { color: 'gold', width: 2 }); sA.text('forcing', 5.9, F.value, { size: 11, color: 'gold', align: 'right', baseline: 'bottom', dy: -3 });
          if (!ctrl) { sA.corner('integrating the control column…', 'tl', { color: 'muted' }); R = null; return; }
          sA.path(X.map((x, i) => [x, Yq[i]]), { color: 'accent', width: 2.8 });
          sA.path(X.map((x, i) => [x, Yr[i]]), { color: 'green', width: 2.8 });
          const dq = solve(Yq, F.value), dr = solve(Yr, F.value);
          sA.dot(dq, F.value, { color: 'accent', r: 6, label: fx(v, dq, 2) + ' K', labelPos: 'se' }); sA.dot(dr, F.value, { color: 'green', r: 6, label: fx(v, dr, 2) + ' K', labelPos: 'nw' });
          const slope = (ys) => (interp(X, ys, 0.75) - interp(X, ys, -0.75)) / 1.5;
          const lq = slope(Yq), lr = slope(Yr);
          const bar = (x, val, col, lab) => { sB.rect(x - 0.35, 0, x + 0.35, val, { fill: col, fillAlpha: 0.75, stroke: false }); sB.text(fx(v, val, 2), x, val, { size: 11, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 }); };
          bar(0.5, dq, 'accent'); bar(1.5, dr, 'green'); bar(2.5, F.value / 3.22, 'gold'); bar(3.5, (F.value / 3.93) * 3.0, 'orange');
          R = { dq, dr, lq, lr, bb255: 4 * SIG * TE ** 3, bb288: 4 * SIG * TS ** 3 };
        });
        v.legend([['accent', 'column, fixed humidity (Planck)'], ['green', 'column, fixed relative humidity'], ['muted', 'black body 255 K', { dash: true }], ['faint', 'black body 288 K', { dash: true }]]);
        v.readout(() => R ? String.raw`Slope at ΔT = 0: Planck (fixed humidity) **${fx(v, R.lq, 2)}** W m⁻² K⁻¹, fixed relative humidity ${fx(v, R.lr, 2)} · black body 4σT³: ${fx(v, R.bb255, 2)} at 255 K, ${fx(v, R.bb288, 2)} at 288 K · AR6 all-sky Planck 3.22 → ΔF/3.22 = ${fx(v, F.value / 3.22, 2)} K (for 3.93: 1.22 K); AR6 best-estimate ECS 3 K for 3.93 (the last bar scales it with the forcing)` : 'integrating the control column (a few seconds)…');
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Definition',
      name: 'Equilibrium climate sensitivity',
      credit: 'Charney et al., 1979 (report); AR6 assessment 2021',
      statement: String.raw`The **equilibrium climate sensitivity** (ECS) is the long-term rise in global-mean surface air temperature after atmospheric CO₂ is doubled and the planetary energy budget has come back into balance, leaving out feedbacks from ice sheets. With a doubling forcing $\Delta F_{2\times}$ and a net feedback parameter $\alpha<0$ (the sum of the Planck response and all the other feedbacks, in W m⁻² K⁻¹), $$\mathrm{ECS}=\frac{\Delta F_{2\times}}{-\alpha}.$$ AR6 assesses ECS at a best estimate of **3 °C**, likely 2.5 to 4 °C and very likely 2 to 5 °C, from $\Delta F_{2\times}=3.93$ W m⁻² and a net feedback near $-1.3$ W m⁻² K⁻¹.`,
      idea: String.raw`The restoring flux in balance is $\alpha\,\Delta T+\Delta F=0$ (climate-3.4 supplies the largest term, the Planck response). Each other feedback adds a positive piece to $\alpha$ (water vapour plus lapse rate, albedo, clouds), reducing the magnitude of the net restoring force, so the same forcing needs a larger temperature change. Because $\alpha$ sits in the denominator, a symmetric uncertainty in the feedbacks gives a skewed ECS with a long tail toward high values, and if the net feedback reached zero the linear balance would have no solution.`,
      caption: String.raw`Set the feedbacks (AR6 central values at the start) and the doubling forcing. Top left: the feedbacks stacked against the Planck response; right: warming in a two-layer ocean model after an abrupt doubling, which approaches ECS over centuries; bottom: ECS against net feedback, with AR6's likely and very likely ranges shaded. Push the feedbacks toward cancelling the Planck term and ECS runs away.`,
      deps: ['climate-3.4', 'climate-3.1'],
      refs: ['IPCC AR6 WG1 ch. 7'],
      tags: ['climate sensitivity', 'feedback'],
      scope: String.raw`Feedbacks assumed constant in time and independent of temperature. Real feedbacks vary with the pattern of warming and the climate state (AR6 §7.4.3–7.4.4); ice-sheet feedbacks are excluded by definition. The ocean model is a generic two-layer illustration (C = 8, C_d = 100 W yr m⁻² K⁻¹, γ = 0.7 W m⁻² K⁻¹), not AR6's emulator.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Climate_sensitivity' },
      viz(v) {
        const wv = v.slider('water vapour + lapse rate', 0, 2.6, 1.3, { step: 0.01 });
        const al = v.slider('surface albedo', -0.2, 1.2, 0.35, { step: 0.01 });
        const cl = v.slider('clouds', -1, 2, 0.42, { step: 0.01 });
        const f2 = v.slider('doubling forcing (W/m²)', 3, 5, F2X, { step: 0.01 });
        const sA = v.stage({ x: [0, 6.5], y: [-4, 1.5], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: '', ylabel: 'feedback (W/m² per K)', title: 'feedbacks add to the Planck response', xticks: [[0.7, 'Planck'], [1.8, 'H₂O+LR'], [2.9, 'albedo'], [4.0, 'clouds'], [5.6, 'net']] });
        const sB = v.stage({ x: [0, 600], y: [0, 7], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'years after doubling CO₂', ylabel: 'warming (K)', title: 'approach to equilibrium' });
        const sC = v.stage({ x: [0.1, 3], y: [0, 10], axes: 'box', gutter: true, height: 300, full: true, xlabel: 'net feedback magnitude $-\\alpha$ (W/m² per K)', ylabel: 'ECS (K)', title: 'ECS against net feedback' });
        let R = null;
        v.render(() => {
          const P = -3.22, oth = -0.01, net = P + wv.value + al.value + cl.value + oth, lam = -net;
          const st = [[0.7, P, 'accent'], [1.8, wv.value, 'red'], [2.9, al.value, 'red'], [4.0, cl.value, 'red']];
          sA.hline(0, { color: 'faint' });
          let run = 0;
          st.forEach(([x, val, col], i) => { const a = i === 0 ? 0 : run; sA.rect(x - 0.4, a, x + 0.4, a + val, { fill: i === 0 ? 'blue' : 'orange', fillAlpha: 0.7, stroke: false }); sA.text((val > 0 ? '+' : '−') + Math.abs(val).toFixed(2), x, Math.max(a, a + val), { size: 11, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 }); run = a + val; });
          sA.rect(5.2, 0, 6.0, net, { fill: net < 0 ? 'green' : 'red', fillAlpha: 0.75, stroke: false }); sA.text(fx(v, net, 2), 5.6, Math.max(0, net), { size: 11.5, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 });
          const stable = lam > 0.03, ecs = stable ? f2.value / lam : Infinity;
          // time series
          let t90 = null;
          if (stable) {
            const s = twoBox(() => f2.value, lam, {}, 600, 0.5);
            sB.hband(2.5, 4.0, { color: 'green', alpha: 0.1 });
            sB.hline(Math.min(ecs, 7), { color: 'green', dash: [5, 4] });
            sB.path(Array.from(s.t).map((t, i) => [t, s.T[i]]).filter((_, i) => i % 4 === 0), { color: 'accent', width: 2.6 });
            for (let i = 0; i < s.t.length; i++) if (s.T[i] >= 0.9 * ecs) { t90 = s.t[i]; break; }
            sB.text(`ECS = ${fx(v, ecs, 1)} K`, 598, Math.min(ecs, 7), { size: 11.5, color: 'green', align: 'right', baseline: 'bottom', dy: -4 });
          } else sB.text('no equilibrium: the net feedback is not restoring', 300, 3.5, { size: 13, color: 'red', align: 'center' });
          // ECS(−α)
         
          const bandL = f2.value / 4.0, bandH = f2.value / 2.5, vl = [f2.value / 5.0, f2.value / 2.0];
          sC.rect(vl[0], 0, vl[1], 10, { fill: 'green', fillAlpha: 0.08, stroke: false }); sC.rect(bandL, 0, bandH, 10, { fill: 'green', fillAlpha: 0.14, stroke: false });
          sC.fn((x) => f2.value / x, { color: 'accent', width: 2.6, domain: [0.1, 3] });
          sC.text('AR6 likely 2.5–4 K', (bandL + bandH) / 2, 0.4, { size: 10.5, color: 'green', align: 'center' }); sC.text('very likely 2–5 K', vl[1] + 0.03, 8.6, { size: 10.5, color: 'green', align: 'left' });
          if (stable && lam <= 3) sC.dot(lam, Math.min(ecs, 10), { color: 'gold', r: 7, label: fx(v, ecs, 1) + ' K', labelPos: 'ne' });
          sC.vline(1.16, { color: 'faint', dash: [4, 4] }); sC.text('AR6 process-based net feedback 1.16', 1.18, 9.4, { size: 10.5, color: 'muted', align: 'left' });
          R = { net, ecs, stable, t90, lam };
        });
        v.legend([['blue', 'Planck response'], ['orange', 'other feedbacks'], ['green', 'AR6 ranges (shaded)']]);
        v.readout(() => R && (R.stable ? String.raw`net feedback $\alpha$ = ${fx(v, R.net, 2)} W m⁻² K⁻¹ → ECS = ${fx(v, f2.value, 2)}/${fx(v, R.lam, 2)} = **${fx(v, R.ecs, 2)} K** ${R.ecs >= 2.5 && R.ecs <= 4 ? '(inside' : R.ecs >= 2 && R.ecs <= 5 ? '(inside the very likely range but outside' : '(outside'} the AR6 likely range 2.5–4 K) · the two-layer ocean reaches 90 % of it after ${R.t90 ? fx(v, R.t90, 0) + ' years' : 'more than 600 years'} · all-feedback amplification of the Planck-only 1.2 K: ×${fx(v, R.ecs / (f2.value / 3.22), 1)} (AR6: 2.8)` : String.raw`net feedback $\alpha$ = ${fx(v, R.net, 2)} W m⁻² K⁻¹ ≥ 0: the linear balance has no equilibrium (ECS → ∞); the real climate is stabilised by feedbacks that change with temperature`));
      },
    },
//@@ITEMS
  ],
};
