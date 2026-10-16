// Climate Science — Chapter 4: Climate feedbacks (items 4.1–4.4; 4.5–4.8 are in ch04-b.js)
import { GRID, AR6, LAM0, whenControl, lw, humidity, esat, tropicalAmp, polarAmp, heights, SIG, fx } from './ch04.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export default {
  collection: 'climate',
  chapter: 4,
  title: 'Climate feedbacks',
  summary: String.raw`Feedbacks multiply the Planck response. Warmer air holds more water vapour, a strong positive feedback partly offset by the lapse-rate feedback; melting ice darkens the surface; clouds remain the largest uncertainty. The gain formula $1/(1-f)$ is nonlinear, so symmetric uncertainty in the feedbacks becomes a long tail toward high sensitivity, and the polar regions warm fastest. Radiative kernels turn the bookkeeping into a measurement: each feedback is the flux change per kelvin that a given change of temperature, humidity, albedo or cloud produces.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Theorem',
      name: 'Feedback gain and amplification',
      credit: 'feedback amplifier analysis: H. S. Black, 1934 (electronics); applied to climate by Hansen et al., 1984, and the IPCC assessments',
      statement: String.raw`Let a forcing produce the no-feedback warming $\Delta T_0=\Delta F/\lambda_0$, where $\lambda_0>0$ is the Planck restoring rate (climate-3.4), and suppose each kelvin of warming changes the energy budget by a further $\alpha_x$ (W m⁻² K⁻¹) through feedback $x$, with sign convention that positive $\alpha_x$ amplifies. With the **feedback factor** $f=\sum_x\alpha_x/\lambda_0$, the equilibrium warming is $\Delta T=\Delta T_0/(1-f)$ provided $f<1$, and the **gain** is $G=1/(1-f)$. Equivalently the net feedback parameter is $\lambda=\lambda_0(1-f)$ and $\Delta T=\Delta F/\lambda$. The same result is the limit of the series $\Delta T_0(1+f+f^2+\cdots)$ obtained by feeding back round after round. For $f\ge1$ the series diverges: in this linear model there is no equilibrium (a runaway), so the linear picture must give way to nonlinear limits.`,
      idea: String.raw`Write the energy balance at equilibrium: forcing plus the extra flux from all feedbacks equals the Planck loss, $\Delta F+\sum_x\alpha_x\Delta T=\lambda_0\Delta T$. Solving for $\Delta T$ gives $\Delta F/(\lambda_0-\sum\alpha_x)=\Delta T_0/(1-f)$. The geometric series is the same algebra unrolled in time: the first round of warming $\Delta T_0$ triggers extra forcing $f\,\Delta T_0\,\lambda_0$, which warms by a further $f\Delta T_0$, and so on. It is the closed-loop formula of control theory (ctrl-1.4) with forward gain $1/\lambda_0$ and loop gain $f\lambda_0/\lambda_0=f$.`,
      caption: String.raw`The staircase shows the warming added in each round of feedback (the first, blue step, is the no-feedback response; orange steps are the feedback rounds), with the running total as gold dots and the limit $\Delta T_0/(1-f)$ as a dashed line. Drag the feedback factor $f$: at $f=0.64$ (the sum of the AR6 non-Planck feedbacks over the Planck response) the total settles within a few rounds at about 2.8 times the no-feedback warming; push $f$ past 1 and it never settles; make $f$ negative and the rounds alternate and shrink. The right panel is the gain curve.`,
      deps: ['climate-3.4', 'ctrl-1.4'],
      refs: ['Archer ch. 7', 'IPCC AR6 WG1 ch. 7'],
      tags: ['feedback', 'gain', 'geometric series', 'climate sensitivity'],
      scope: String.raw`Holds for small perturbations where each feedback is linear in $\Delta T$ and independent of the others and of the climate state. For $f$ near 1, curvature and state dependence of the real feedbacks matter (climate-4.6). The AR6 numbers (Table 7.10): Planck $-3.22$, water vapour plus lapse rate $+1.30$, surface albedo $+0.35$, clouds $+0.42$, other $-0.01$ W m⁻² K⁻¹, so $f=2.06/3.22=0.64$ and the net feedback is $-1.16$ W m⁻² K⁻¹.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Climate_sensitivity#Feedbacks' },
      viz(v) {
        const f = v.slider('feedback factor $f$', -0.8, 1.3, 0.64, { step: 0.01 });
        const dT0 = v.slider('no-feedback warming $\\Delta T_0$ (K)', 0.5, 2, 1.22, { step: 0.01 });
        const nR = v.slider('rounds shown', 1, 30, 12, { int: true });
        v.button('AR6 central values', () => { f.set(2.06 / LAM0); dT0.set(3.93 / LAM0); });
        const sA = v.stage({ x: [-0.7, 30.7], y: [-1, 8], axes: 'box', gutter: true, height: 340, weight: 1.5, minWidth: 300, xlabel: 'round of feedback', ylabel: 'warming (K)', title: 'feedback, round by round' });
        const sB = v.stage({ x: [-1, 1.4], y: [0, 12], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: 'feedback factor $f$', ylabel: 'gain $1/(1-f)$', title: 'the gain curve' });
        let R = null;
        v.render(() => {
          const F = f.value, d0 = dT0.value, n = nR.value;
          sA.setView([-0.7, n + 0.7], [Math.min(-0.5, -d0 * 0.6), Math.max(8, 1.15 * d0 / Math.max(1 - F, 0.12))]);
          const lim = F < 1 ? d0 / (1 - F) : null;
          sA.hline(0, { color: 'faint' });
          if (lim != null) { sA.hline(lim, { color: 'green', dash: [6, 4], width: 1.6 }); sA.text('limit ' + v.fix(lim, 2) + ' K', n + 0.6, lim, { size: 11, color: 'green', align: 'right', baseline: 'bottom', dy: -3 }); }
          let S = 0, term = d0; const pts = [];
          for (let k = 0; k <= n; k++) {
            const nxt = S + term;
            sA.rect(k - 0.36, Math.min(S, nxt), k + 0.36, Math.max(S, nxt), { fill: k === 0 ? 'blue' : 'orange', fillAlpha: 0.75, stroke: false });
            pts.push([k, nxt]); S = nxt; term *= F;
          }
          sA.path(pts, { color: 'gold', width: 1.6, alpha: 0.7 }); sA.dots(pts, { color: 'gold', r: 3.5 });
          const G = F < 1 ? 1 / (1 - F) : Infinity;
          sB.fn((x) => 1 / (1 - x), { domain: [-1, 0.9167], color: 'accent', width: 2.4 });
          sB.vband(1, 1.4, { color: 'red', alpha: 0.12 }); sB.vline(1, { color: 'red', dash: [5, 4] }); sB.text('runaway', 1.2, 6, { size: 11, color: 'red', align: 'center' });
          const f6 = 2.06 / LAM0; sB.dot(f6, 1 / (1 - f6), { color: 'green', r: 4, hollow: true, label: 'AR6', labelPos: 'nw' });
          if (F < 1) sB.dot(F, Math.min(G, 12), { color: 'gold', r: 6 });
          sB.hline(1, { color: 'faint', dash: [3, 4] });
          R = { S, lim, G, lam: LAM0 * (1 - F), F };
        });
        v.legend([['blue', 'no-feedback response'], ['orange', 'feedback round'], ['gold', 'running total', { dot: true }], ['green', 'limit', { dash: true }]]);
        v.readout(() => !R ? 'computing…' : (R.F < 1
          ? String.raw`$f=${v.fix(R.F, 2)}$: after ${nR.value} rounds ${v.fix(R.S, 2)} K, limit $\Delta T_0/(1-f)=$ **${v.fix(R.lim, 2)} K** (gain ${v.fix(R.G, 2)}) · net feedback $\lambda=\lambda_0(1-f)=$ ${v.fix(R.lam, 2)} W/m²/K with $\lambda_0=3.22$ · AR6: gain ${v.fix(1 / (1 - 2.06 / LAM0), 2)}, $\lambda=1.16$`
          : String.raw`$f=${v.fix(R.F, 2)}\ge1$: each round adds more than the one before, the total after ${nR.value} rounds is ${v.fix(R.S, 1)} K and keeps growing — the linear model has no equilibrium.`));
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Phenomenon',
      name: 'Water-vapour feedback',
      credit: 'idea: Arrhenius, 1896 and Manabe & Wetherald, 1967 (fixed relative humidity); AR6 value: IPCC AR6 WG1 (2021) §7.4.2.2',
      statement: String.raw`Saturation vapour pressure rises by roughly 6–7 % per kelvin (Clausius–Clapeyron, geo-1.5), and observations and models show that the atmosphere's relative humidity changes little as it warms, so its water-vapour content rises by about that rate. Water vapour is a greenhouse gas, so the extra vapour, mostly in the upper troposphere, reduces the outgoing longwave radiation at a given temperature. The result is a **positive feedback**: AR6 gives a water-vapour feedback of $\alpha_{WV}\approx+1.8$ W m⁻² K⁻¹ (CMIP5/6: $1.77\pm0.20$; satellite estimate $1.85\pm0.32$), more than half the size of the Planck response, which raises the no-feedback warming by about a factor 1.6–2 on its own.`,
      idea: String.raw`Compute the outgoing radiation of the same warmed atmosphere twice: once with the humidity left unchanged, which gives the Planck response alone, and once with relative humidity held fixed, so that $q$ follows Clausius–Clapeyron (geo-1.5). The difference in outgoing radiation, per kelvin, is the feedback. It comes mainly from the upper troposphere because the emission level (climate-2.7) of the water bands lies there, and the vapour that matters most is the small amount in cold air, where a given percentage increase blocks most of the radiation that would have escaped. The feedback is thus a statement about how the emission level of water vapour rises as the air warms.`,
      caption: String.raw`The synthetic-spectrum column is warmed uniformly by $\Delta T$. Left: how much more radiation escapes to space, with humidity frozen (blue: the Planck response) and with fixed relative humidity (red: less escapes, because the added vapour traps it); the gap divided by $\Delta T$ is the water-vapour feedback. Middle: which layers matter; each bar is the part of the effect from moistening one slab of the troposphere (the slider restricts moistening to layers above a chosen pressure). Right: Clausius–Clapeyron growth per kelvin falls from about 7 % per kelvin at the surface to 10–11 % in the cold upper troposphere. The first computation takes a few seconds.`,
      deps: ['climate-4.1', 'geo-1.5'],
      refs: ['Archer ch. 7', 'IPCC AR6 WG1 ch. 7'],
      tags: ['feedback', 'water vapour', 'Clausius–Clapeyron'],
      scope: String.raw`Clear-sky, fixed-relative-humidity column with synthetic spectra (chapter 2); the warming is uniform in the vertical, so no lapse-rate change is included (that is climate-4.3), and the computed number is for this column and not an AR6 estimate. The 6–7 % per kelvin figure applies to saturation vapour pressure near the surface; real relative humidity does shift a little with circulation, but its feedback is assessed as close to zero (AR6: $0.00\pm0.06$).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Climate_change_feedback#Water_vapor' },
      viz(v) {
        const dT = v.slider('uniform warming $\\Delta T$ (K)', 0.5, 6, 2, { step: 0.1 });
        const cut = v.slider('moisten only layers above (hPa)', 100, 1000, 1000, { step: 10 });
        const sA = v.stage({ x: [0, 6], y: [0, 24], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 270, xlabel: 'warming $\\Delta T$ (K)', ylabel: 'extra outgoing radiation (W/m²)', title: 'what escapes to space as the column warms' });
        const sB = v.stage({ x: [100, 1000], xlog: true, y: [0, 0.6], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 270, xlabel: 'pressure of the moistened slab (hPa)', ylabel: 'W/m² per K', title: 'where the vapour matters' });
        const sC = v.stage({ x: [200, 310], y: [0, 14], axes: 'box', gutter: true, height: 320, weight: 0.9, minWidth: 230, xlabel: 'temperature (K)', ylabel: '% per K', title: 'Clausius–Clapeyron growth' });
        let ctrl = null, R = null;
        const T1 = (T, d) => T.map((t) => t + d);
        whenControl((c) => { ctrl = c; v.invalidate(); });
        const olrAt = (d, qfun) => { const T = T1(ctrl.T, d); return lw(T, ctrl.Ts + d, 280, qfun(T)).olr; };
        const qFixed = () => ctrl.q;
        const qCut = (p0) => (T) => { const q = humidity(T, GRID, {}); return q.map((x, i) => (GRID.pm[i] < p0 ? x : ctrl.q[i])); };
        const pw = (q) => q.reduce((a, x, i) => a + (x * GRID.dp[i] * 100) / 9.81, 0);
        v.render(() => {
          if (!ctrl) { sA.corner('integrating the control column…', 'tl', { color: 'muted' }); R = null; return; }
          const base = lw(ctrl.T, ctrl.Ts, 280, ctrl.q).olr;
          const ds = [0, 1, 2, 3, 4, 5, 6];
          const P = ds.map((d) => olrAt(d, qFixed) - base), W = ds.map((d) => olrAt(d, qCut(cut.value)) - base);
          sA.path(ds.map((d, i) => [d, P[i]]), { color: 'blue', width: 2.6 }); sA.dots(ds.map((d, i) => [d, P[i]]), { color: 'blue', r: 3 });
          sA.path(ds.map((d, i) => [d, W[i]]), { color: 'red', width: 2.6 }); sA.dots(ds.map((d, i) => [d, W[i]]), { color: 'red', r: 3 });
          const d = dT.value, pD = olrAt(d, qFixed) - base, wD = olrAt(d, qCut(cut.value)) - base;
          sA.line(d, wD, d, pD, { color: 'orange', width: 3 }); sA.text('trapped by extra vapour ' + v.fix(pD - wD, 1), d + 0.1, (pD + wD) / 2, { size: 11, color: 'orange', align: 'left' });
          // slabs: moistening only the layers above each cutoff
          const edges = Array.from({ length: 14 }, (_, j) => 1000 * 0.84 ** j);
          const O = edges.map((p0) => olrAt(d, qCut(p0)) - base);
          for (let j = 0; j < edges.length - 1; j++) { const part = (O[j + 1] - O[j]) / d; sB.rect(edges[j + 1] * 1.01, 0, edges[j] * 0.99, Math.max(0, part), { fill: 'red', fillAlpha: 0.6, stroke: false }); }
          const alpha = (pD - wD) / d, alphaAll = (pD - (olrAt(d, qCut(1100)) - base)) / d;
          const qNew = qCut(1100)(T1(ctrl.T, d));
          R = { alpha, alphaAll, pD, wD, d, pwr: (pw(qNew) / pw(ctrl.q) - 1) * 100 / d };
          // CC
          sC.fn((T) => 100 * (esat(T + 1) / esat(T) - 1), { domain: [200, 310], color: 'accent', width: 2.4 });
          sC.dot(288, 100 * (esat(289) / esat(288) - 1), { color: 'gold', r: 5, label: 'surface', labelPos: 'nw' });
          sC.dot(235, 100 * (esat(236) / esat(235) - 1), { color: 'gold', r: 5, label: 'upper troposphere', labelPos: 'ne' });
          sC.hline(7, { color: 'faint', dash: [4, 4] });
        });
        v.legend([['blue', 'humidity frozen'], ['red', 'relative humidity fixed']]);
        v.readout(() => !R ? 'integrating the control column (a few seconds)…' : String.raw`At $\Delta T=${v.fix(R.d, 1)}$ K the frozen-humidity column gains ${v.fix(R.pD, 1)} W/m², the moistening column ${v.fix(R.wD, 1)}: the vapour traps ${v.fix(R.pD - R.wD, 1)} W/m², i.e. a feedback of **${v.fix(R.alpha, 2)}** W/m²/K (all layers moistened: ${v.fix(R.alphaAll, 2)}) · column water vapour rises ${v.fix(R.pwr, 1)} % per K · AR6 assessment: water vapour ${AR6.wv.toFixed(2)} ± 0.20 W/m²/K, Planck −3.22`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Phenomenon',
      name: 'Lapse-rate feedback',
      credit: 'Manabe & Wetherald, 1967; Cess, 1975 (separation of lapse-rate and water-vapour terms); AR6 value: IPCC AR6 WG1 (2021) §7.4.2.3',
      statement: String.raw`When the tropics warm, convection keeps the temperature profile close to a moist adiabat, which cools more slowly with height as the surface warms, so the upper troposphere warms by about 2–3 times the surface warming (the exact factor depends on the temperature). The upper air is where the planet radiates to space, so it emits more than it would if the whole column warmed by the same amount as the surface. This is a **negative feedback**, the **lapse-rate feedback** $\alpha_{LR}<0$, which cancels part of the water-vapour feedback; in polar regions, where winter warming is trapped near the surface by inversions, the sign reverses. AR6 assesses the combined water-vapour plus lapse-rate feedback as $+1.30$ W m⁻² K⁻¹ (likely 1.2 to 1.4), against water vapour alone near $+1.77$, so the lapse-rate term is roughly $-0.5$; with relative humidity held fixed it is only about $-0.10\pm0.07$.`,
      idea: String.raw`A rising air parcel cools at the moist-adiabatic rate (geo-1.6), which is smaller at higher temperature because more latent heat is released: the moist adiabat of a warmer surface is shifted by more aloft than at the ground. Radiation to space from the upper troposphere (climate-2.7, climate-2.11) therefore grows faster than $\sigma T^4$ evaluated at the surface warming. Comparing the outgoing radiation with the actual warming pattern to that with uniform warming isolates the feedback. If humidity follows relative humidity, the extra warming aloft also moistens the upper air, which blocks radiation again, and the two effects largely cancel; that is why the lapse-rate and water-vapour feedbacks are anticorrelated across models.`,
      caption: String.raw`Choose where the warming happens (tropics: the moist-adiabat pattern computed on this page; uniform; surface-trapped, as at high latitude in winter) and how strongly the pattern is expressed, then warm the surface. Left: the warming at each height compared with uniform warming; right: the change in outgoing radiation for each, and the feedback computed from the difference. Flip the humidity switch to hold relative humidity fixed instead of specific humidity and watch most of the negative feedback disappear. The small panel traces the feedback as the pattern strength goes from 0 to 1.5.`,
      deps: ['climate-4.2', 'geo-1.6'],
      refs: ['IPCC AR6 WG1 ch. 7', 'Pierrehumbert'],
      tags: ['feedback', 'lapse rate', 'moist adiabat'],
      scope: String.raw`The tropical pattern is the saturated moist adiabat from a 295 K surface (computed here), tapered to zero at the tropopause; it is applied to the global-mean synthetic-spectrum clear-sky column of chapter 2, so the numbers show the mechanism rather than reproduce an AR6 value. Real tropical air is not saturated at the surface, and the real polar pattern is more complex than the one-parameter shape used here.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lapse_rate' },
      viz(v) {
        const pat = v.select('warming pattern', [{ value: 'trop', label: 'tropics: moist adiabat' }, { value: 'uni', label: 'uniform' }, { value: 'pol', label: 'surface-trapped' }], 'trop');
        const str = v.slider('pattern strength', 0, 1.5, 1, { step: 0.05 });
        const dTs = v.slider('surface warming (K)', 0.5, 4, 1, { step: 0.1 });
        const rh = v.toggle('humidity follows (fixed relative humidity)', false);
        const sA = v.stage({ x: [0, 4], y: [0, 16], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: 'warming (K)', ylabel: 'height (km)', title: 'warming at each height' });
        const sB = v.stage({ x: [0, 4], y: [0, 6.5], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: '', ylabel: 'extra outgoing radiation (W/m²)', title: 'what escapes to space', xticks: [[1, 'uniform'], [2.6, 'pattern']] });
        const sC = v.stage({ x: [0, 1.5], y: [-1.2, 0.8], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 230, xlabel: 'pattern strength', ylabel: 'lapse-rate feedback (W/m²/K)', title: 'feedback against strength' });
        let ctrl = null, R = null, A = null, Ap = null;
        whenControl((c) => { ctrl = c; A = tropicalAmp(295); Ap = polarAmp(); v.invalidate(); });
        const ampOf = (kind, s) => (kind === 'uni' ? GRID.pm.map(() => 1) : (kind === 'trop' ? A : Ap).map((a) => 1 + s * (a - 1)));
        const olrWith = (amp, d, follow) => {
          const T = ctrl.T.map((t, i) => t + d * amp[i]); const q = follow ? humidity(T, GRID, {}) : ctrl.q;
          return lw(T, ctrl.Ts + d, 280, q).olr;
        };
        v.render(() => {
          if (!ctrl) { sA.corner('integrating the control column…', 'tl', { color: 'muted' }); R = null; return; }
          const base = lw(ctrl.T, ctrl.Ts, 280, ctrl.q).olr, d = dTs.value, fol = rh.value, z = heights(ctrl.T, GRID);
          const base2 = fol ? lw(ctrl.T, ctrl.Ts, 280, humidity(ctrl.T, GRID, {})).olr : base;
          const ampU = ampOf('uni', 1), ampP = ampOf(pat.value, str.value);
          const dU = olrWith(ampU, d, fol) - base2, dP = olrWith(ampP, d, fol) - base2;
          sA.path([[d, 0], ...z.map((zz, i) => [d * ampU[i], zz])], { color: 'muted', width: 2.2, dash: true });
          sA.path([[d, 0], ...z.map((zz, i) => [d * ampP[i], zz])], { color: 'red', width: 2.8 });
          sA.dot(d, 0, { color: 'gold', r: 5 });
          sB.setView([0, 4], [0, Math.max(dU, dP, 1) * 1.25]);
          sB.rect(0.55, 0, 1.45, Math.max(0, dU), { fill: 'muted', fillAlpha: 0.6, stroke: false }); sB.text(v.fix(dU, 2), 1, Math.max(0, dU), { size: 11, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 });
          sB.rect(2.15, 0, 3.05, Math.max(0, dP), { fill: 'red', fillAlpha: 0.65, stroke: false }); sB.text(v.fix(dP, 2), 2.6, Math.max(0, dP), { size: 11, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 });
          const a = -(dP - dU) / d;
          sB.line(0.55, dU, 3.05, dU, { color: 'muted', dash: [4, 4] });
          // strength curve
          const ss = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5], pts = ss.map((s) => [s, -(olrWith(ampOf(pat.value, s), d, fol) - base2 - dU) / d]);
          sC.hline(0, { color: 'faint' }); sC.path(pts, { color: 'accent', width: 2.4 }); sC.dots(pts, { color: 'accent', r: 3 });
          sC.dot(str.value, a, { color: 'gold', r: 6 });
          sC.hline(fol ? AR6.lrStar : -0.5, { color: 'green', dash: [5, 4] }); sC.text(fol ? 'AR6 LR* −0.10' : 'AR6 ≈ −0.5', 1.48, fol ? AR6.lrStar : -0.5, { size: 10.5, color: 'green', align: 'right', baseline: 'bottom', dy: -2 });
          const aOf = (amp) => -(olrWith(amp, d, fol) - base2 - dU) / d;
          const mix = 0.5 * aOf(ampOf('trop', 1)) + 0.366 * aOf(ampOf('trop', 0.5)) + 0.134 * aOf(ampOf('pol', 1));
          R = { a, dU, dP, d, fol, mix };
        });
        v.readout(() => !R ? 'integrating the control column (a few seconds)…' : String.raw`Surface warming ${v.fix(R.d, 1)} K: uniform warming lets ${v.fix(R.dU, 2)} W/m² more escape, the pattern ${v.fix(R.dP, 2)} W/m² → lapse-rate feedback **${v.fix(R.a, 2)}** W/m²/K (${R.fol ? 'relative humidity fixed; AR6 LR* = −0.10 ± 0.07' : 'specific humidity held; AR6: water vapour + lapse rate = +1.30 and water vapour alone 1.77, so roughly −0.5'})
Global mix (tropics 50 % of the area with the full pattern, mid-latitudes 37 % at half strength, poles 13 % surface-trapped): **${v.fix(R.mix, 2)}** W/m²/K against AR6's ${R.fol ? '−0.10 ± 0.07' : 'about −0.5'}: the sign is right, but this column overstates the size`);      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Phenomenon',
      name: 'Ice–albedo feedback',
      credit: 'recognised by Croll, 1864; quantified in the energy-balance models of Budyko (1969) and Sellers (1969); AR6 value: IPCC AR6 WG1 (2021) Table 7.10',
      statement: String.raw`Snow and ice reflect most sunlight (albedo about 0.6–0.9) while open ocean and bare ground reflect little (about 0.05–0.3). Warming melts ice, lowers the planetary albedo, and so increases absorbed sunlight, which warms the planet further. In global terms the feedback is $\alpha_{ice}=\tfrac{S}{4}\,\bigl|\tfrac{d\alpha}{dT}\bigr|>0$, where $\alpha(T)$ is the planetary albedo. AR6 assesses the surface-albedo feedback at $+0.35$ W m⁻² K⁻¹ (very likely $+0.10$ to $+0.60$), small beside the water-vapour feedback but much more important regionally. If the feedback were strong enough that it exceeded the Planck response, the climate would have no stable state near the present one: a runaway to a frozen planet (Snowball Earth).`,
      idea: String.raw`Treat the planet as one box (climate-1.6) whose albedo depends on the ice cover, and that cover on temperature. The slope of absorbed sunlight with temperature, $\tfrac S4(\alpha_{ice}-\alpha_{open})\,df_{ice}/dT$, adds to the net balance exactly as in the feedback algebra of climate-4.1. For modest slope the equilibrium moves smoothly and the warming is amplified by the gain $1/(1-f)$. When $dASR/dT$ exceeds the Planck slope $d\,OLR/dT$ the equilibrium becomes unstable and an additional pair of equilibria appears (a saddle-node bifurcation, climate-5.2).`,
      caption: String.raw`The curves show absorbed sunlight (including the forcing $\Delta F$) and emitted radiation against surface temperature; equilibria are where they cross (green: stable; red ring: unstable). Drag the forcing: with the observed-sized ice sensitivity the warming is a little larger than with fixed albedo (gold dot against grey). Raise the ice sensitivity and the crossings merge and vanish: warm and frozen states appear, as the S-shaped curve on the right shows when you sweep the forcing. The small panel shows the ice cover assumed and the latitude of the ice edge.`,
      deps: ['climate-4.1', 'climate-1.5'],
      refs: ['Archer ch. 7', 'IPCC AR6 WG1 ch. 7'],
      tags: ['feedback', 'albedo', 'ice', 'bistability'],
      scope: String.raw`One-box model, $OLR=\varepsilon\sigma T^4$ with $\varepsilon=0.61$ (climate-1.6), albedo $=0.265\,(1-f_{ice})+0.62\,f_{ice}$, with ice cover $f_{ice}=0.0986+k\,(288-T)$ limited to $[0,1]$. The albedo values and the linear ice-cover law are illustrative: $k=0.0029$ K⁻¹ is chosen so that the model's $\alpha_{ice}=0.35$ W m⁻² K⁻¹ equals AR6's global figure. It is not a model of the seasonal or regional ice, and it has no heat transport, so the instability at large $k$ is an indication of the mechanism and not of the real Earth's threshold (see chapter 5).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ice%E2%80%93albedo_feedback' },
      viz(v) {
        const dF = v.slider('forcing $\\Delta F$ (W/m²)', -40, 12, 3.93, { step: 0.05 });
        const kk = v.slider('ice sensitivity $k$ (ice-cover fraction per K)', 0, 0.02, 0.0029, { step: 0.0001, decimals: 4 });
        v.button('AR6-sized ($k=0.0029$)', () => kk.set(0.0029));
        const S = 1361, AO = 0.265, AI = 0.62, EPS = 0.6106, F0 = (0.3 - AO) / (AI - AO);
        const fice = (T, k) => clamp(F0 + k * (288 - T), 0, 1);
        const alb = (T, k) => AO + (AI - AO) * fice(T, k);
        const asr = (T, k) => (S / 4) * (1 - alb(T, k)), olr = (T) => EPS * SIG * T ** 4;
        const roots = (F, k) => {
          const out = []; let prev = null;
          for (let T = 150; T <= 340.01; T += 0.25) {
            const g = asr(T, k) + F - olr(T);
            if (prev && prev[1] * g <= 0 && !(prev[1] === 0 && g === 0)) { const T0 = prev[0] + (0.25 * prev[1]) / (prev[1] - g); const gT = (asr(T0 + 0.05, k) + F - olr(T0 + 0.05)) - (asr(T0 - 0.05, k) + F - olr(T0 - 0.05)); out.push({ T: T0, stable: gT < 0 }); }
            prev = [T, g];
          }
          return out;
        };
        const sA = v.stage({ x: [200, 320], y: [100, 420], axes: 'box', gutter: true, height: 340, weight: 1.3, minWidth: 280, xlabel: 'surface temperature (K)', ylabel: 'W/m²', title: 'absorbed and emitted energy' });
        const sB = v.stage({ x: [-50, 8], y: [200, 320], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: 'forcing $\\Delta F$ (W/m²)', ylabel: 'equilibrium $T$ (K)', title: 'equilibria against forcing' });
        const sC = v.stage({ x: [200, 320], y: [0, 1.05], axes: 'box', gutter: true, height: 340, weight: 0.8, minWidth: 220, xlabel: 'temperature (K)', ylabel: 'ice-covered fraction', title: 'assumed ice cover' });
        let R = null;
        v.render(() => {
          const F = dF.value, k = kk.value;
          sA.fn((T) => olr(T), { color: 'blue', width: 2.6 });
          sA.fn((T) => (S / 4) * (1 - 0.3) + F, { color: 'muted', dash: true, width: 1.8 });
          sA.fn((T) => asr(T, k) + F, { color: 'orange', width: 2.6 });
          const rs = roots(F, k);
          rs.forEach((r) => sA.dot(r.T, olr(r.T), { color: r.stable ? 'green' : 'red', hollow: !r.stable, r: 6 }));
          const T0 = Math.pow(((S / 4) * 0.7 + F) / (EPS * SIG), 0.25);
          sA.dot(T0, olr(T0), { color: 'muted', r: 5, label: 'fixed albedo', labelPos: 'sw' });
          const near = rs.filter((r) => r.stable).sort((a, b) => Math.abs(a.T - 288 - (F > 0 ? 3 : 0)) - Math.abs(b.T - 288 - (F > 0 ? 3 : 0)))[0];
          if (near) sA.dot(near.T, olr(near.T), { color: 'gold', r: 5, label: 'with ice', labelPos: 'nw' });
          // bifurcation diagram
          const st = [], un = [];
          for (let ff = -50; ff <= 8.01; ff += 0.4) roots(ff, k).forEach((r) => (r.stable ? st : un).push([ff, r.T]));
          sB.dots(un, { color: 'red', r: 1.6 }); sB.dots(st, { color: 'green', r: 1.8 });
          sB.dot(F, near ? near.T : 200, { color: 'gold', r: 6 });
          // ice cover
          sC.fn((T) => fice(T, k), { color: 'teal', width: 2.6 });
          if (near) { sC.dot(near.T, fice(near.T, k), { color: 'gold', r: 6 }); const sphi = 1 - fice(near.T, k); sC.text('ice edge ≈ ' + v.fix((Math.asin(clamp(sphi, 0, 1)) * 180) / Math.PI, 0) + '° latitude', 205, 0.95, { size: 11, color: 'ink', align: 'left' }); }
          const dasr = (S / 4) * (AI - AO) * k * (fice(288, k) > 0 && fice(288, k) < 1 ? 1 : 0), dolr = 4 * olr(288) / 288;
          R = { T0, near, rs, aice: dasr, dolr, F, k };
        });
        v.legend([['blue', 'emitted'], ['orange', 'absorbed (ice-dependent)'], ['muted', 'absorbed, albedo fixed', { dash: true }], ['green', 'stable', { dot: true }], ['red', 'unstable', { dot: true }]]);
        v.readout(() => R && String.raw`Ice feedback at 288 K: $\alpha_{ice}=\tfrac S4(0.62-0.265)k=$ **${v.fix(R.aice, 2)}** W/m²/K (AR6: +0.35), Planck slope ${v.fix(R.dolr, 2)} → ${R.aice < R.dolr ? 'stable' : 'unstable'}
${R.near ? String.raw`Forcing ${v.fix(R.F, 1)} W/m²: warming with ice ${v.fix(R.near.T - 288, 2)} K versus ${v.fix(R.T0 - 288, 2)} K with albedo fixed (ratio ${Math.abs(R.T0 - 288) > 0.05 ? v.fix((R.near.T - 288) / (R.T0 - 288), 2) : '—'}) · ${R.rs.length} equilibri${R.rs.length === 1 ? 'um' : 'a'}` : 'no stable state near the present climate: the planet runs away to a different state'}`);
      },
    },
  ],
};
