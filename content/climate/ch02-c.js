// Climate Science — Chapter 2 (part c): radiative–convective equilibrium, the runaway greenhouse, ozone
import { SIG, NU, GRID, CP, G0, planckNu, brightT, standardT, opticalDepths, longwave, humidity, heights, ozoneProfile, ozoneHeating, saturatedColumn, esat, rceJob, rceAdvance, rceFinishJob, ASR_RCE, KAPPA_ADIABAT } from './ch02.shared.js';

const fx = (v, x, d = 1) => v.fix(x, d);
const O3 = ozoneProfile(300), SW = ozoneHeating(O3);
const Q288 = humidity(standardT(288));
const CAP = GRID.dp.map((d) => (CP * d * 100) / G0);
const still = () => typeof window !== 'undefined' && !!window.__vizStill;

/** Tropopause height (km): the top of the layer where the lapse rate still exceeds 2 K/km, reading the profile from the ground up. */
function tropopause(T) {
  const z = heights(T); let top = 0;
  for (let i = 0; i < T.length - 1; i++) { const g = (T[i] - T[i + 1]) / (z[i + 1] - z[i]); if (g >= 2) top = i + 1; else if (i > 3) break; }
  return z[Math.min(top, z.length - 1)];
}
/** Radiative heating rate (K/day) of each layer from a column state (longwave only) and the shortwave profile. */
function heatingRates(T, Ts, q, o3, co2 = 280) {
  const L = longwave(T, Ts, opticalDepths(T, { q, o3, co2 }), {});
  return T.map((_, i) => ((L.up[i] - L.down[i] - (L.up[i + 1] - L.down[i + 1])) / CAP[i]) * 86400);
}

/** Time-sliced radiative–convective integrator with an optional "radiative first" phase; calls onDone when every phase has finished. */
function runner(v, onFrame) {
  let job = null, timer = null, gen = 0;
  const api = {
    get job() { return job; },
    start(j, then) {
      gen++; const my = gen; job = j;
      const finish = () => { if (my !== gen) return; if (then) { const nj = then(job.st); if (nj) { api.start(nj, null); return; } } onFrame(true); };
      if (still()) { rceFinishJob(job); finish(); return; }
      const tick = () => { timer = null; if (my !== gen) return; const d = rceAdvance(job, 18); onFrame(d); if (d) finish(); else timer = setTimeout(tick, 0); };
      if (timer) clearTimeout(timer);
      timer = setTimeout(tick, 0);
    },
    stop() { gen++; if (timer) clearTimeout(timer); timer = null; },
  };
  v.onCleanup(() => api.stop());
  return api;
}

export default {
  collection: 'climate',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Model',
      name: 'Radiative–convective equilibrium (Manabe–Wetherald)',
      credit: 'Syukuro Manabe & Robert Strickler, 1964; Manabe & Wetherald, 1967',
      statement: String.raw`A one-dimensional model of the atmospheric column in which the temperature profile obeys two constraints at once. **Radiation** heats or cools each layer by the divergence of the net infrared flux (2.6), with the surface balancing the absorbed sunlight; **convection** forbids any layer pair from being steeper than the critical lapse rate $\Gamma_c$ (6.5 K/km in the Manabe–Wetherald model; the moist adiabat in later versions), by mixing the pair at constant enthalpy (*convective adjustment*). Pure radiative equilibrium gives an unrealistically hot surface and a lapse rate far too steep near the ground; adding convective adjustment produces a **troposphere** (convective, temperature falling at $\Gamma_c$) topped by a **stratosphere** (radiative), and its equilibrium surface temperature responds to the CO₂ concentration. With relative humidity held fixed, doubling CO₂ raises the surface temperature and cools the stratosphere; holding the *absolute* humidity fixed gives a much smaller warming.`,
      scope: String.raw`Clear sky, global-mean, fixed lapse rate (6.5 K/km), fixed ozone (300 DU) and a fixed relative-humidity profile $0.77\,(p/p_s-0.02)/0.98$. The absorbed sunlight (${'232.5'} W/m²) is chosen so that 280 ppm gives 288 K; the spectroscopy is the synthetic band model of 2.4. The band parameters were tuned so that the fixed-relative-humidity warming for 300 → 600 ppm is about 2.6 K, and the fixed-absolute-humidity warming about 1.5 K, close to (but not equal to) the 2.36 K and 1.33 K that Manabe & Wetherald found (see 2.16); because the spectroscopy is synthetic, quote the *ratios* and sign of the responses rather than the absolute numbers.`,
      idea: String.raw`The radiative scheme alone drives each layer toward the local radiative balance (2.6); near the ground the net upward infrared flux is large and the equilibrium temperature gradient is steeper than a rising air parcel can sustain, so the lowest layers are unstable. Adjusting any unstable pair back to $\Gamma_c$ while conserving energy moves heat upward; the process repeated until nothing changes yields a profile that is convective up to the level where the radiative lapse rate falls below $\Gamma_c$ (the tropopause, set by the emission height, 2.7) and radiative above. The surface temperature is then $T_e$ plus the adiabatic rise from the emission level down to the ground, so it depends on CO₂ through the emission height, and on water vapour through the humidity assumption.`,
      caption: String.raw`The column is integrated in time from a first guess: it first relaxes to **pure radiative equilibrium** (steep, hot at the ground), then the **convective adjustment** is switched on and the troposphere and stratosphere emerge (watch the profile and the surface-temperature trace). Doubling CO₂ and switching the humidity assumption reproduce the Manabe–Wetherald experiment qualitatively: much more warming at fixed relative humidity than at fixed absolute humidity. Middle: the net radiative heating rate, which is negative (cooling) wherever convection must supply heat.`,
      deps: ['climate-2.6', 'geo-1.6', 'thermo-1.11'],
      refs: ['Pierrehumbert'],
      tags: ['radiative-convective equilibrium', 'climate model'],
      viz(v) {
        const co2 = v.select('CO₂', [{ value: '280', label: '280 ppm' }, { value: '560', label: '560 ppm (doubled)' }], '280', { onChange: () => change() });
        const hum = v.select('water vapour', [{ value: 'rh', label: 'fixed relative humidity' }, { value: 'abs', label: 'fixed absolute humidity' }, { value: 'dry', label: 'none' }], 'rh', { onChange: () => change() });
        const cv = v.toggle('convective adjustment', true, { onChange: () => change() });
        const gam = v.slider('critical lapse rate $\\Gamma_c$ (K/km)', 3, 9.8, 6.5, { step: 0.1, onChange: () => change() });
        const sA = v.stage({ x: [150, 360], y: [0, 50], axes: 'box', gutter: true, height: 400, weight: 1.1, minWidth: 270, xlabel: 'temperature (K)', ylabel: 'height (km)', title: 'temperature profile' });
        const sB = v.stage({ x: [-20, 20], y: [0, 50], axes: 'box', gutter: true, height: 400, weight: 0.9, minWidth: 250, xlabel: 'radiative heating (K/day)', ylabel: 'height (km)', title: 'net radiative heating' });
        const sC = v.stage({ x: [0, 1400], y: [250, 340], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'integration steps', ylabel: 'surface T (K)', title: 'approach to equilibrium' });
        let R = null, trace = [], marks = [], base = [], phase = 'radiative', ctrl = null, ref = null, rad = null;
        const opts = (noConv) => ({ asr: ASR_RCE, o3: O3, sw: SW, co2: +co2.value, gamma: gam.value, noConvect: noConv, fixedQ: hum.value === 'abs' ? Q288 : hum.value === 'dry' ? Q288.map(() => 4e-6) : undefined, maxSteps: 1300 });
        const run = runner(v, () => { const j = run.job; if (j) trace = base.concat(j.hist); v.invalidate(); });
        const done = (st) => { // record converged states
          const key = `${co2.value}|${hum.value}|${cv.value}|${gam.value.toFixed(1)}`;
          if (phase === 'radiative') rad = { T: Array.from(st.T), Ts: st.Ts };
          else if (key === '280|rh|true|6.5') ctrl = { T: Array.from(st.T), Ts: st.Ts };
        };
        function begin(from, radFirst) {
          base = trace.slice(); marks.push({ i: base.length, label: radFirst ? 'radiative equilibrium' : 'new settings' });
          phase = radFirst ? 'radiative' : 'run';
          run.start(rceJob(opts(radFirst || !cv.value), from), (st) => {
            trace = base.concat(run.job.hist); done(st);
            if (phase === 'radiative' && cv.value) { base = trace.slice(); marks.push({ i: base.length, label: 'convection on' }); phase = 'run'; return rceJob(opts(false), st); }
            return null;
          });
        }
        function change() { const j = run.job; if (j) begin({ T: Array.from(j.st.T), Ts: j.st.Ts }, false); }
        v.button('restart from the first guess', () => { trace = []; marks = []; rad = null; begin(null, true); });
        begin(null, true);
        v.render(() => {
          const j = run.job, st = j.st, T = st.T, Ts = st.Ts, z = heights(T), o = opts(!cv.value && phase !== 'radiative' ? true : phase === 'radiative');
          const q = o.fixedQ || humidity(T), L = longwave(T, Ts, opticalDepths(T, { q, o3: O3, co2: +co2.value }), {});
          const hr = T.map((_, i) => ((L.up[i] - L.down[i] - (L.up[i + 1] - L.down[i + 1])) / CAP[i]) * 86400);
          const sw = SW.map((w, i) => (w / CAP[i]) * 86400);
          if (rad) { const zr = heights(rad.T); sA.path(rad.T.map((t, i) => [t, zr[i]]), { color: 'red', width: 1.6, dash: [5, 4], alpha: phase === 'radiative' ? 0 : 1 }); }
          if (ctrl && !(co2.value === '280' && hum.value === 'rh' && cv.value && gam.value === 6.5)) { const zc = heights(ctrl.T); sA.path(ctrl.T.map((t, i) => [t, zc[i]]), { color: 'muted', width: 1.6, dash: [2, 3] }); }
          sA.path(T.map((t, i) => [t, z[i]]), { color: 'accent', width: 2.8 });
          sA.dot(Ts, 0, { color: 'gold', r: 6.5, label: `${fx(v, Ts, 1)} K`, labelPos: 'ne' });
          const zt = tropopause(T); if (!(phase === 'radiative') && cv.value) { sA.hline(zt, { color: 'green', dash: [6, 4], width: 1.3 }); sA.text(`tropopause ${fx(v, zt, 1)} km`, 355, zt, { color: 'green', size: 11.5, align: 'right', baseline: 'bottom', dy: -3 }); }
          sB.vline(0, { color: 'faint' });
          sB.path(hr.map((x, i) => [Math.max(-20, Math.min(20, x)), z[i]]), { color: 'purple', width: 2.4 });
          sB.path(sw.map((x, i) => [Math.max(-20, Math.min(20, x)), z[i]]), { color: 'orange', width: 2, dash: [5, 4] });
          // trace
          const tr = trace.length ? trace : j.hist;
          sC.setView([0, Math.max(300, tr.length + 60)], null);
          sC.hline(288, { color: 'faint', dash: [3, 3] });
          sC.path(tr.map((t, i) => [i, t]), { color: 'accent', width: 2.4 });
          for (const m of marks) { sC.vline(m.i, { color: 'faint', dash: [2, 3] }); sC.text(m.label, m.i + 4, 252, { size: 10.5, color: 'muted', align: 'left', baseline: 'bottom' }); }
          R = { Ts, olr: L.olr, asr: ASR_RCE, zt, done: j.done, phase, lapse: ((T[0] - T[Math.min(6, T.length - 1)]) / (z[Math.min(6, T.length - 1)] - z[0])), Tstrat: T[27], dT: ctrl ? Ts - ctrl.Ts : null, ctrlT: ctrl && ctrl.Ts };
        });
        v.legend([['accent', 'column temperature'], ['red', 'pure radiative equilibrium', { dash: true }], ['muted', '280 ppm control', { dash: true }], ['purple', 'infrared heating'], ['orange', 'ozone sunlight heating', { dash: true }]]);
        v.readout(() => R && String.raw`${R.phase === 'radiative' ? '**pure radiative equilibrium**' : cv.value ? '**convective adjustment on**' : 'radiative only'}${R.done ? '' : ' (integrating…)'} · $T_s$ = **${fx(v, R.Ts, 1)} K** · OLR = ${fx(v, R.olr, 1)} W/m² vs absorbed ${fx(v, R.asr, 1)} · lowest-layer lapse rate ${fx(v, R.lapse, 1)} K/km · stratosphere (≈ 24 km) ${fx(v, R.Tstrat, 0)} K${R.dT != null && R.done ? String.raw` · change from the 280 ppm control (${fx(v, R.ctrlT, 1)} K): **${R.dT > 0 ? '+' : ''}${fx(v, R.dT, 2)} K**` : ''}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Phenomenon',
      name: 'Runaway greenhouse and the Simpson–Nakajima limit',
      credit: 'George Simpson, 1927; Susumu Nakajima, Y.-Y. Hayashi & Y. Abe, 1992; Kasting, 1988',
      statement: String.raw`For a planet whose surface is covered by water, raising the surface temperature raises the saturation vapour pressure exponentially (Clausius–Clapeyron), so the atmosphere fills with water vapour and the troposphere becomes opaque in almost every part of the infrared. The outgoing radiation then **stops increasing with surface temperature** and saturates at the **Simpson–Nakajima limit**, of order 280 W/m² (about 282 W/m² in modern calculations, set by the radiating level in the region where water vapour is still in the stratosphere's cold trap and nearly independent of the surface). A planet that absorbs more sunlight than this cannot reach equilibrium with liquid oceans: it warms until the oceans are in the atmosphere (a **runaway greenhouse**) and then to a hot state, as Venus may once have done.`,
      scope: String.raw`A schematic saturated column of water vapour in 1000 hPa of dry air on the moist adiabat, with a synthetic water spectrum whose self-continuum was strengthened (×13) so that the limit lies near 280 W/m²; the absolute numbers are illustrative. Real calculations need line-by-line spectra and the full continuum, and clouds and the albedo of a steam atmosphere change the picture; at very high temperatures (above about 1500 K) the near-infrared windows reopen and OLR rises again.`,
      idea: String.raw`The outgoing radiation of a moist column is emitted from where the optical depth of water vapour reaches one. Along a saturated moist adiabat that level sits at nearly the same temperature however warm the surface is — the water-vapour mixing ratio there is fixed by the same Clausius–Clapeyron relation (1.5, geo-1.5), so the emission temperature barely depends on $T_s$ — and the flux $\sigma T_{\rm emit}^4$ saturates (2.7). Below the limit the surface cools back toward equilibrium; above it, no balance exists and evaporation increases the opacity further.`,
      caption: String.raw`Drag the surface temperature on the left curve: the outgoing radiation (black) rises, then flattens near 280 W/m². The horizontal line is the sunlight absorbed; where it crosses the curve there is an equilibrium (with a stable one on the rising branch). Slide the stellar flux up — beyond the limit the lines no longer cross and the planet runs away. Middle: the column's temperature (moist adiabat) with the stratospheric floor; right: the depth of ocean the atmosphere holds.`,
      deps: ['climate-2.11', 'geo-1.5'],
      refs: ['Pierrehumbert'],
      tags: ['runaway greenhouse', 'water vapour', 'Venus'],
      viz(v) {
        const flux = v.slider('stellar flux (× Earth’s 1361 W/m²)', 0.5, 2.1, 1, { step: 0.01 });
        const albS = v.slider('planetary albedo $\\alpha$', 0, 0.8, 0.3, { step: 0.01 });
        const Tsel = v.slider('surface temperature $T_s$ (K)', 240, 450, 300, { step: 1 });
        const sA = v.stage({ x: [240, 450], y: [150, 340], axes: 'box', gutter: true, height: 360, weight: 1.15, minWidth: 290, xlabel: 'surface temperature (K)', ylabel: 'outgoing radiation (W/m²)', title: 'OLR of a saturated column' });
        const sB = v.stage({ x: [180, 450], y: [1, 1e4], ylog: true, axes: 'box', gutter: true, height: 360, weight: 0.9, minWidth: 250, xlabel: 'temperature (K)', ylabel: 'pressure (hPa)', title: 'the saturated column' });
        const sC = v.stage({ x: [240, 450], y: [0.01, 5000], ylog: true, axes: 'box', gutter: true, height: 360, weight: 0.8, minWidth: 240, xlabel: 'surface temperature (K)', ylabel: 'water in the air (m of ocean)', title: 'atmospheric water' });
        const memo = new Map();
        const col = (Ts) => { const k = Math.round(Ts); if (!memo.has(k)) { const c = saturatedColumn(k); const L = longwave(c.T, k, opticalDepths(c.T, { q: c.q, co2: 0, cont: 13 }, c.grid), {}, c.grid); let w = 0; c.q.forEach((x, i) => { w += (x * c.grid.dp[i] * 100) / G0; }); memo.set(k, { c, olr: L.olr, water: w / 1000 }); } return memo.get(k); };
        const curve = []; for (let t = 240; t <= 450; t += 5) curve.push([t, col(t).olr]);
        const handle = sA.handle(300, col(300).olr, { color: 'gold', r: 7, constrain: (x) => { const t = Math.max(240, Math.min(450, Math.round(x))); return [t, col(t).olr]; } });
        handle.onDrag = () => Tsel.set(Math.round(handle.x));
        let R = null;
        v.render(() => {
          const Ts = Tsel.value, asr = (1361 * flux.value * (1 - albS.value)) / 4, cur = col(Ts);
          handle.set(Ts, cur.olr);
          sA.path(curve, { color: 'ink', width: 2.8 });
          sA.fn((t) => SIG * t ** 4, { domain: [240, 450], color: 'faint', width: 1 });
          sA.hline(asr, { color: 'gold', width: 2.2 }); sA.text(`absorbed sunlight ${fx(v, asr, 0)}`, 447, asr, { color: 'gold', size: 12, align: 'right', baseline: 'top', dy: 4, weight: 600 });
          sA.hline(282, { color: 'muted', dash: [6, 4], width: 1.2 }); sA.text('Simpson–Nakajima ≈ 282', 243, 282, { color: 'muted', size: 11, align: 'left', baseline: 'bottom', dy: -3 });
          // equilibria
          const eq = []; for (let i = 0; i < curve.length - 1; i++) { const a = curve[i][1] - asr, b = curve[i + 1][1] - asr; if (a * b <= 0 && a !== b) { const t = curve[i][0] + (5 * -a) / (b - a); eq.push({ t, stable: b > a }); } }
          for (const e of eq) sA.dot(e.t, asr, { color: 'green', r: 6.5, hollow: !e.stable });
          const runaway = eq.length === 0 && asr > curve[0][1];
          if (runaway) sA.text('no equilibrium: runaway', 345, asr + 10, { color: 'red', size: 13, weight: 700, align: 'center' });
          // column
          const c = cur.c;
          sB.path([[Ts, c.ps]].concat(c.T.map((t, i) => [t, c.grid.pm[i]])), { color: 'accent', width: 2.6 });
          sB.setView(null, [1, Math.max(1100, c.ps * 1.3)]);
          sB.dot(Ts, c.ps, { color: 'gold', r: 6 });
          sB.text(`surface ${fx(v, c.ps, 0)} hPa`, 445, c.ps * 0.55, { size: 11, color: 'muted', align: 'right', baseline: 'top' });
          // water
          const wd = []; for (let t = 240; t <= 450; t += 5) wd.push([t, col(t).water]);
          sC.path(wd, { color: 'teal', width: 2.6 });
          sC.hline(2700, { color: 'blue', dash: [5, 4] }); sC.text('Earth’s oceans 2.7 km', 243, 2700, { size: 11, color: 'blue', align: 'left', baseline: 'bottom', dy: -3 });
          sC.dot(Ts, cur.water, { color: 'gold', r: 6 });
          R = { Ts, olr: cur.olr, asr, eq, runaway, ps: c.ps, water: cur.water, lim: Math.max(...curve.slice(0, 33).map((p) => p[1])) };
        });
        v.legend([['ink', 'OLR of the column'], ['gold', 'absorbed sunlight'], ['green', 'equilibrium (filled = stable)', { dot: true }], ['faint', '$\\sigma T_s^4$']]);
        v.readout(() => R && String.raw`$T_s$ = ${fx(v, R.Ts, 0)} K: column OLR = **${fx(v, R.olr, 0)} W/m²** (a blackbody surface would emit ${fx(v, SIG * R.Ts ** 4, 0)}) · surface pressure ${fx(v, R.ps / 1000, 2)} bar, ${fx(v, R.water, 1)} m of ocean in the air · absorbed ${fx(v, R.asr, 0)} W/m²: ${R.runaway ? '**no equilibrium — runaway greenhouse**' : R.eq.length ? `equilibrium at ${R.eq.filter((e) => e.stable).map((e) => fx(v, e.t, 0) + ' K').join(', ') || '—'}` : 'the planet is below its coldest computed state'} · maximum OLR in the plateau ${fx(v, R.lim, 0)} W/m²`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Phenomenon',
      name: 'Ozone and the warm stratosphere',
      credit: 'Sydney Chapman, 1930 (ozone layer); Manabe & Strickler, 1964 (radiative–convective role)',
      statement: String.raw`Above the tropopause the temperature **increases** with height, from about 215 K at 15–20 km to a maximum of about 270 K at the stratopause near 50 km. The heat source is the absorption of solar ultraviolet radiation by **ozone** (the Hartley and Huggins bands, 200–350 nm); the heating rate per unit mass peaks at the stratopause even though the ozone concentration peaks lower (near 25 km), because the unattenuated ultraviolet is found higher up. Without ozone the stratosphere is simply the radiative-equilibrium continuation of the troposphere: colder (near 160–190 K), with no temperature inversion, and the tropopause sits **lower**. Ozone's own infrared band (9.6 µm, 2.4) contributes a small greenhouse effect.`,
      scope: String.raw`The ozone layer here is a fixed Gaussian profile in $\ln p$ peaking near 12 hPa and scaled to the chosen column in Dobson units; ultraviolet absorption is a single effective band carrying 8 W/m² of sunlight. The numbers in the stratosphere depend on the synthetic CO₂ cooling and are only roughly realistic; the qualitative changes with the ozone column are the content.`,
      idea: String.raw`Ozone absorbs a few percent of the sunlight, almost all in the ultraviolet, and re-emits it as infrared at a much lower rate than a gas of the same temperature would absorb it (2.4, Kirchhoff), so the layer heats until its emission, mainly in the CO₂ and ozone bands, balances the absorbed ultraviolet. The heating is proportional to the ultraviolet flux times the local ozone density, $Q \propto e^{-\tau_{UV}}\,\rho_{O_3}$ with $\tau_{UV}$ measured from the top, which is why it peaks at the stratopause. The resulting temperature inversion confines convection and sets the height of the tropopause (2.11).`,
      caption: String.raw`Slide the ozone column (Dobson units; the ozone hole is below about 220 DU). The column re-equilibrates in radiative–convective balance: with ozone off the stratosphere is cold and flat and the tropopause drops. Middle: the shortwave heating of ozone (orange) against the net infrared cooling (purple) at every height — they cancel in the stratosphere. Right: the ozone profile.`,
      deps: ['kin-7.6', 'climate-2.11'],
      refs: ['Pierrehumbert'],
      tags: ['ozone', 'stratosphere'],
      viz(v) {
        const du = v.slider('ozone column (Dobson units)', 0, 500, 300, { step: 10, onChange: () => go() });
        const sA = v.stage({ x: [140, 320], y: [0, 55], axes: 'box', gutter: true, height: 400, weight: 1.1, minWidth: 270, xlabel: 'temperature (K)', ylabel: 'height (km)', title: 'temperature profile' });
        const sB = v.stage({ x: [-12, 12], y: [0, 55], axes: 'box', gutter: true, height: 400, weight: 0.95, minWidth: 250, xlabel: 'heating rate (K/day)', ylabel: 'height (km)', title: 'where the heat comes from' });
        const sC = v.stage({ x: [0, 14], y: [0, 55], axes: 'box', gutter: true, height: 400, weight: 0.7, minWidth: 220, xlabel: 'ozone (ppmv)', ylabel: 'height (km)', title: 'ozone profile' });
        let R = null, trace = 0, ref = null, ctl = null;
        const o3 = () => ozoneProfile(du.value), swOf = (o) => ozoneHeating(o);
        const opts = () => { const o = o3(); return { asr: ASR_RCE, o3: du.value > 0 ? o : null, sw: swOf(o).map((x) => (du.value > 0 ? x : 0)), co2: 280, maxSteps: 1100, minSteps: 150 }; };
        const run = runner(v, () => v.invalidate());
        let last = null;
        function go() { run.start(rceJob(opts(), last ? { T: Array.from(last.T), Ts: last.Ts } : null), (st) => { last = { T: Array.from(st.T), Ts: st.Ts }; if (du.value === 300 && !ctl) ctl = last; return null; }); }
        go();
        void trace; void ref;
        v.render(() => {
          const j = run.job, T = j.st.T, Ts = j.st.Ts, z = heights(T), d = du.value, o = ozoneProfile(d), sw = ozoneHeating(o).map((w, i) => (d > 0 ? ((w / CAP[i]) * 86400) : 0));
          const hr = heatingRates(T, Ts, humidity(T), d > 0 ? o : null);
          if (ctl && d !== 300) { const zc = heights(ctl.T); sA.path(ctl.T.map((t, i) => [t, zc[i]]), { color: 'muted', width: 1.6, dash: [5, 4] }); }
          sA.path(T.map((t, i) => [t, z[i]]), { color: 'accent', width: 2.8 });
          const zt = tropopause(T); sA.hline(zt, { color: 'green', dash: [6, 4], width: 1.3 }); sA.text(`tropopause ${fx(v, zt, 1)} km`, 318, zt, { size: 11.5, color: 'green', align: 'right', baseline: 'bottom', dy: -3 });
          let imax = 0; for (let i = 14; i < T.length; i++) if (T[i] > T[imax] || imax < 14) imax = i;
          sA.dot(T[imax], z[imax], { color: 'orange', r: 6, label: `stratopause ${fx(v, T[imax], 0)} K`, labelPos: 'w' });
          sB.vline(0, { color: 'faint' });
          sB.path(hr.map((x, i) => [Math.max(-12, Math.min(12, x)), z[i]]), { color: 'purple', width: 2.4 });
          sB.path(sw.map((x, i) => [Math.max(-12, Math.min(12, x)), z[i]]), { color: 'orange', width: 2.6 });
          sC.path(o.map((q, i) => [q * (28.97 / 48) * 1e6, z[i]]), { color: 'teal', width: 2.6 });
          R = { Ts, zt, Ts2: T[imax], z2: z[imax], Tstr: T[22], d, done: j.done, olr: null };
        });
        v.legend([['accent', 'temperature'], ['muted', '300 DU', { dash: true }], ['orange', 'ozone ultraviolet heating'], ['purple', 'net infrared heating']]);
        v.readout(() => R && String.raw`ozone ${fx(v, R.d, 0)} DU${R.done ? '' : ' (equilibrating…)'}: tropopause **${fx(v, R.zt, 1)} km** · temperature maximum **${fx(v, R.Ts2, 0)} K** at ${fx(v, R.z2, 0)} km · mid-stratosphere ${fx(v, R.Tstr, 0)} K · surface ${fx(v, R.Ts, 1)} K${R.d === 0 ? ' · no ozone: no inversion, a colder and flatter stratosphere' : ''}`);
      },
    },
  ],
};
