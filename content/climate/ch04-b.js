// Climate Science — Chapter 4 (part b): cloud feedbacks, the fat tail, polar amplification, radiative kernels
import { sensitivityDistribution, sensitivityHistogram } from './sensitivity.shared.js';
import { GRID, AR6, LAM0, whenControl, lw, humidity, tropicalAmp, polarAmp, heights, cloudOLR, tAtP, pAtT, latitudeResponse, columnKernels, Phi, PhiInv, SIG } from './ch04.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const S4 = 1361 / 4;

export default {
  collection: 'climate',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Phenomenon',
      name: 'Cloud feedbacks',
      credit: 'cloud radiative effect and feedback assessment: IPCC AR6 WG1 (2021), §7.2.1, §7.4.2.4 and Table 7.10',
      statement: String.raw`A cloud changes the energy budget in two opposing ways. It reflects sunlight, a **shortwave** cooling that is larger for clouds that are thick and low; it also absorbs the surface and lower-air radiation and re-emits at its own, colder temperature, a **longwave** warming that is larger for clouds that are high and cold. The net **cloud radiative effect** (CRE) of Earth's clouds today is a cooling: AR6's beginning-of-21st-century energy budget gives a shortwave effect of about −47 W m⁻² and a longwave effect of +28 W m⁻², a net near −19 W m⁻². These compare fluxes with clouds removed while retaining the same atmospheric state; they are not a prediction of a cloud-free equilibrium. The cloud **feedback** is how this changes with warming through the clouds' altitude, amount and reflectivity. AR6 assesses the net cloud feedback as positive, $+0.42$ W m⁻² K⁻¹ (very likely $-0.10$ to $+0.94$), with high confidence in the sign: high clouds rise (positive), subtropical marine low-cloud cover decreases (positive), and some mid- and high-latitude clouds brighten (negative). Cloud feedback is the largest source of spread in climate sensitivity among models.`,
      idea: String.raw`A cloud is a grey absorber at its own temperature, so the outgoing radiation is a weighted average of a clear column (climate-2.6) and a column whose emission comes from the cloud top. Its longwave effect is the difference, which grows as the cloud top gets colder, while its shortwave effect is proportional to the fraction of the sky covered times its reflectivity. Warming moves each of the three knobs: the **fixed-anvil-temperature** argument says the cloud top stays at the same temperature, and therefore rises as the air warms, trapping more radiation; changes in cloud fraction and optical depth, which depend on circulation and microphysics, can push either way. Their sum is the net feedback, and because the terms are comparable in size but opposite in sign, the total is poorly constrained (the gain of climate-4.1 amplifies that).`,
      caption: String.raw`A single grey cloud layer is added to the synthetic-spectrum column. Left: how the effect of the cloud depends on how high its top is (red: longwave, blue: shortwave, black: net). The buttons set a low stratocumulus, a thin cirrus or a deep anvil. Right: warm the column and let the cloud respond: the bars add the change of the net effect per kelvin from warming alone, a rising cloud top (set the slider to 1 for a cloud that keeps its temperature), a change of cloud amount, and a change of reflectivity. The shaded band is AR6's very-likely range for the whole cloud feedback.`,
      deps: ['climate-4.1', 'climate-2.6'],
      refs: ['IPCC AR6 WG1 (2021), §7.2.1 and Fig. 7.2, pp. 933–935; §7.4.2.4, pp. 971–975; Table 7.10, p. 978'],
      tags: ['feedback', 'clouds', 'radiative effect'],
      scope: String.raw`One cloud layer of fixed emissivity in the clear-sky column of chapter 2, the shortwave effect taken as $-c\,r\,S/4$ with $S/4=340$ W m⁻² (no multiple reflection or surface-albedo interaction), and the warming pattern the tropical moist adiabat of climate-4.3 scaled by a slider. The change of cloud radiative effect is shown as the feedback; AR6's cloud feedback corrects for clouds masking the radiative responses of non-cloud variables, which this change-of-CRE diagnostic omits. The three responses are inputs the reader chooses: the page does not predict how real clouds change, which is exactly the uncertainty.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cloud_feedback' },
      viz(v) {
        const pcS = v.slider('cloud-top pressure (hPa)', 150, 950, 250, { step: 5 });
        const ecS = v.slider('cloud emissivity', 0.1, 1, 0.5, { step: 0.01 });
        const rS = v.slider('shortwave reflectivity', 0, 0.7, 0.1, { step: 0.01 });
        const cS = v.slider('cloud fraction', 0.05, 1, 0.3, { step: 0.01 });
        v.button('low stratocumulus', () => { pcS.set(900); ecS.set(0.95); rS.set(0.4); cS.set(0.3); });
        v.button('thin cirrus', () => { pcS.set(250); ecS.set(0.5); rS.set(0.1); cS.set(0.3); });
        v.button('deep anvil', () => { pcS.set(200); ecS.set(0.95); rS.set(0.5); cS.set(0.2); });
        const dTS = v.slider('warming $\\Delta T$ (K)', 0.5, 4, 1, { step: 0.1 });
        const patS = v.slider('upper-air warming pattern (0 = uniform)', 0, 1, 0.5, { step: 0.05 });
        const fatS = v.slider('cloud-top temperature kept (0 = pressure fixed, 1 = temperature fixed)', 0, 1, 1, { step: 0.05 });
        const dcS = v.slider('cloud amount change (% per K)', -6, 6, 0, { step: 0.25 });
        const drS = v.slider('reflectivity change (% per K)', -6, 6, 0, { step: 0.25 });
        const sA = v.stage({ x: [150, 950], y: [-70, 70], axes: 'box', gutter: true, height: 330, weight: 1.2, minWidth: 280, xlabel: 'cloud-top pressure (hPa)', ylabel: 'cloud effect (W/m²)', title: 'effect of the cloud against its height' });
        const sB = v.stage({ x: [0, 6], y: [-1, 1.5], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: '', ylabel: 'W/m² per K', title: 'how the effect changes per kelvin', xticks: [[0.6, 'warming'], [1.6, 'height'], [2.6, 'amount'], [3.6, 'reflect.'], [5, 'total']] });
        let ctrl = null, R = null, A = null;
        whenControl((c) => { ctrl = c; A = tropicalAmp(295); v.invalidate(); });
        v.render(() => {
          if (!ctrl) { sA.corner('integrating the control column…', 'tl', { color: 'muted' }); R = null; return; }
          const Q0 = ctrl.q, pc = pcS.value, ec = ecS.value, r = rS.value, c = cS.value, d = dTS.value;
          const cre = (T, Ts, q, p, e, cc, rr) => { const o = cloudOLR(T, Ts, 280, q, p, e, cc); return { lwc: o.clear - o.all, swc: -cc * rr * S4 }; };
          // panel A: effect against height
          const ps = []; for (let p = 150; p <= 950; p += 50) ps.push(p);
          const o0 = ps.map((p) => cre(ctrl.T, ctrl.Ts, Q0, p, ec, c, r));
          const effects = o0.flatMap(o => [o.lwc, o.swc, o.lwc + o.swc]);
          sA.setView([150, 950], [Math.min(-10, ...effects) * 1.2, Math.max(10, ...effects) * 1.2]);
          sA.hline(0, { color: 'faint' });
          sA.path(ps.map((p, i) => [p, o0[i].lwc]), { color: 'red', width: 2.4 });
          sA.path(ps.map((p, i) => [p, o0[i].swc]), { color: 'blue', width: 2.4 });
          sA.path(ps.map((p, i) => [p, o0[i].lwc + o0[i].swc]), { color: 'ink', width: 2.8 });
          const cur = cre(ctrl.T, ctrl.Ts, Q0, pc, ec, c, r);
          sA.vline(pc, { color: 'gold', dash: [5, 4] }); sA.dot(pc, cur.lwc + cur.swc, { color: 'gold', r: 6 });
          // warmed climate
          const amp = A.map((a) => 1 + patS.value * (a - 1)), T1 = ctrl.T.map((t, i) => t + d * amp[i]), Ts1 = ctrl.Ts + d, q1 = humidity(T1, GRID, {});
          const Tc = tAtP(ctrl.T, pc), pFat = pAtT(T1, Tc) ?? pc, pNew = Math.exp((1 - fatS.value) * Math.log(pc) + fatS.value * Math.log(pFat));
          const cNew = clamp(c * (1 + (dcS.value * d) / 100), 0.01, 1), rNew = clamp(r * (1 + (drS.value * d) / 100), 0, 0.95);
          const s0 = cur.lwc + cur.swc;
          const a1 = cre(T1, Ts1, q1, pc, ec, c, r), a2 = cre(T1, Ts1, q1, pNew, ec, c, r), a3 = cre(T1, Ts1, q1, pNew, ec, cNew, r), a4 = cre(T1, Ts1, q1, pNew, ec, cNew, rNew);
          const net = (o) => o.lwc + o.swc;
          const parts = [(net(a1) - s0) / d, (net(a2) - net(a1)) / d, (net(a3) - net(a2)) / d, (net(a4) - net(a3)) / d], tot = parts.reduce((a, b) => a + b, 0);
          const cumulative = [0]; for (const part of parts) cumulative.push(cumulative.at(-1) + part);
          sB.setView([0, 6], [Math.min(-1, ...cumulative) * 1.2, Math.max(1.5, ...cumulative) * 1.2]);
          sB.rect(0, AR6.cloud - 0.52, 6, AR6.cloud + 0.52, { fill: 'green', fillAlpha: 0.12, stroke: false }); sB.hline(AR6.cloud, { color: 'green', dash: [5, 4] }); sB.text('AR6: 0.42 (−0.10 to 0.94)', 5.95, 0.99, { size: 10.5, color: 'green', align: 'right' });
          sB.hline(0, { color: 'faint' });
          let run = 0;
          parts.forEach((x, i) => { sB.rect(0.15 + i, Math.min(run, run + x), 1.05 + i, Math.max(run, run + x), { fill: x >= 0 ? 'orange' : 'blue', fillAlpha: 0.7, stroke: false }); sB.text((x >= 0 ? '+' : '−') + Math.abs(x).toFixed(2), 0.6 + i, Math.max(run, run + x), { size: 10.5, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 }); run += x; });
          sB.rect(4.5, Math.min(0, tot), 5.5, Math.max(0, tot), { fill: 'accent', fillAlpha: 0.7, stroke: false }); sB.text((tot >= 0 ? '+' : '−') + Math.abs(tot).toFixed(2), 5, Math.max(0, tot), { size: 11, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 });
          R = { cur, tot, parts, pc, pNew };
        });
        v.legend([['red', 'longwave'], ['blue', 'shortwave'], ['ink', 'net'], ['green', 'AR6 cloud feedback', { area: true }]]);
        v.readout(() => !R ? 'integrating the control column (a few seconds)…' : String.raw`Cloud at ${v.fix(R.pc, 0)} hPa: longwave **${v.fix(R.cur.lwc, 1)}**, shortwave **${v.fix(R.cur.swc, 1)}**, net **${v.fix(R.cur.lwc + R.cur.swc, 1)}** W/m² (AR6 global net: about −19) · after warming the top sits at ${v.fix(R.pNew, 0)} hPa · change of the net effect **${v.fix(R.tot, 2)}** W/m² per K (parts: warming ${v.fix(R.parts[0], 2)}, height ${v.fix(R.parts[1], 2)}, amount ${v.fix(R.parts[2], 2)}, reflectivity ${v.fix(R.parts[3], 2)})`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Proposition',
      name: 'The fat tail of climate sensitivity (Roe–Baker)',
      credit: 'G. H. Roe and M. B. Baker, 2007, Science 318: 629–632',
      statement: String.raw`Let $f$ be Gaussian with mean $\bar f<1$ and standard deviation $\sigma_f>0$, and let $D=\Delta T_0>0$ be fixed. The positive stable-equilibrium branch $S=D/(1-f)$ requires $f<1$. Write $Z=P(f<1)$. Conditional on that branch,
$$p_S(s\mid f<1)=\frac{D}{Zs^2}p_f(1-D/s),\qquad s>0.$$
The density has an $s^{-2}$ tail. Its population mean diverges; a finite sample mean is not an estimate of a finite population expectation. The median is obtained from $P(f\le1-D/s)=Z/2$, rather than by substituting the unconditioned mean feedback. Report $P(f\ge1)=1-Z$ separately.`,
      idea: String.raw`Roe and Baker's change of variables stretches feedback uncertainty strongly near $f=1$. Conditioning explicitly divides the positive-branch density by $Z$. The same normalization must appear in quantiles, exceedance probabilities and the sampled histogram. Since a Gaussian has nonzero density at $f=1$, $s^2p_S(s)$ tends to a positive constant and the positive-branch mean diverges logarithmically. This mathematical example illustrates skewness; it does not supply an assessed modern climate-sensitivity distribution.`,
      caption: String.raw`Left: the chosen Gaussian feedback distribution; red marks $f\ge1$, outside the stable branch. Right: the normalized stable-branch density and 6000 sampled worlds, with conditional median and 5–95% interval. Samples above 12 K are outside the plot and retain their probability mass. The dashed gold line is only the finite sample mean. The bottom panel shows $P(S>4.5\text{ K}\mid f<1)$. Change the mean or uncertainty to test the transformation.`,
      deps: ['climate-4.1', 'climate-3.5', 'pma-6.19', 'stat-2.1'],
      refs: ['Roe & Baker (2007), Science 318, 629–632, eqs. (1)–(3), Figs. 1–2'],
      tags: ['climate sensitivity', 'uncertainty', 'feedback', 'probability'],
      scope: String.raw`An illustrative Gaussian-feedback transformation with exact chosen no-feedback warming, following Roe & Baker (2007), eqs. (1)–(3) and Figs. 1–2. This display explicitly conditions on $f<1$; that is a normalization convention, not an additional empirical constraint. It omits the nonlinear physics beyond the linear feedback model. No supplementary-paper parameter claim or modern assessed range is inferred.`,
      links: { doi: 'https://doi.org/10.1126/science.1144735' },
      viz(v) {
        const mu = v.slider('mean feedback factor $\\bar f$', 0.2, 0.85, 0.65, { step: 0.01 });
        const sg = v.slider('uncertainty $\\sigma_f$', 0.02, 0.35, 0.15, { step: 0.005 });
        const d0 = v.slider('no-feedback warming $\\Delta T_0$ (K)', 0.8, 1.6, 1.2, { step: 0.01 });
        v.button('resample', () => { seed = (seed + 1) | 0; });
        let seed = 11;
        const sA = v.stage({ x: [-0.2, 1.3], y: [0, 4.2], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xlabel: 'feedback factor $f$', ylabel: 'density', title: 'symmetric in $f$' });
        const sB = v.stage({ x: [0, 12], y: [0, 0.6], axes: 'box', gutter: true, height: 300, weight: 1.4, minWidth: 300, xlabel: 'climate sensitivity $S$ (K)', ylabel: 'density', title: 'skewed in $S$' });
        const sC = v.stage({ x: [0.02, 0.35], y: [0, 0.5], axes: 'box', gutter: true, height: 260, full: true, xlabel: 'uncertainty $\\sigma_f$', ylabel: 'probability', title: 'chance of exceeding 4.5 K' });
        let R = null;
        v.render(() => {
          const m = mu.value, s = sg.value, D = d0.value;
          const distribution = sensitivityDistribution(m, s, D);
          const pf = (f) => Math.exp(-0.5 * ((f - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
          const fxmax = Math.max(1.3, m + 4 * s);
          sA.setView([Math.min(-.2, m - 4 * s), fxmax], [0, 1.15 / (s * Math.sqrt(2 * Math.PI))]);
          sA.fn(pf, { color: 'accent', width: 2.4, fill: true, domain: [Math.min(-.2, m - 4 * s), fxmax] });
          sA.vband(1, fxmax, { color: 'red', alpha: 0.12 }); sA.vline(1, { color: 'red', dash: [5, 4] }); sA.text('f ≥ 1', (1 + fxmax) / 2, .95 / (s * Math.sqrt(2 * Math.PI)), { size: 10.5, color: 'red', align: 'center' });
          const ps = distribution.pdf;
          const peak = Math.max(...Array.from({length: 1200}, (_, i) => ps((i + .5) * .01)));
          sB.setView([0, 12], [0, peak * 1.2]);
          sB.fn(ps, { color: 'ink', width: 2.6, domain: [0, 12], n: 1200 });
          // samples
          const rng = v.rng(seed), N = 6000, xs = []; let runaway = 0;
          for (let i = 0; i < N; i++) { const f = m + s * rng.normal(); if (f >= 1) runaway++; else xs.push(D / (1 - f)); }
          sB.hist(sensitivityHistogram(xs), { density: true, color: 'orange', fillAlpha: 0.35 });
          const q = distribution.quantile;
          const q05 = q(0.05), q50 = q(0.5), q95 = q(0.95);
          sB.vband(q05, Math.min(q95, 12), { color: 'green', alpha: 0.09 });
          sB.vline(q50, { color: 'green', width: 2 }); sB.text('median ' + v.fix(q50, 1), q50 + 0.1, peak * 1.1, { size: 11, color: 'green', align: 'left' });
          const mean = xs.reduce((a, b) => a + b, 0) / xs.length; sB.vline(mean, { color: 'gold', dash: [5, 4] });
          const pEx = sd => sensitivityDistribution(m, sd, D).tail(4.5);
          sC.setView([.02, .35], [0, 1.05]);
          sC.fn(pEx, { color: 'accent', width: 2.4, domain: [0.02, 0.35] }); sC.dot(s, pEx(s), { color: 'gold', r: 6 });
          sC.hline(0, { color: 'faint' });
          R = { q05, q50, q95, mean, runaway: distribution.runaway * 100, sampledRunaway: runaway * 100 / N, pEx: pEx(s), hidden: distribution.tail(12) * 100 };
        });
        v.legend([['green', 'median'], ['gold', 'sample mean', { dash: true }], ['orange', 'sampled worlds', { area: true }]]);
        v.readout(() => R && String.raw`Conditional median **${v.fix(R.q50, 2)}** K; conditional 5–95% interval ${v.fix(R.q05, 2)}–${v.fix(R.q95, 2)} K. Finite sample mean ${v.fix(R.mean, 2)} K; the population mean diverges. $P(S>4.5\text{ K}\mid f<1)=${v.fix(100 * R.pEx, 1)}$%; stable-branch mass above the 12 K plot window: ${v.fix(R.hidden, 1)}%. Separately $P(f\ge1)=${v.fix(R.runaway, 1)}$% (${v.fix(R.sampledRunaway, 1)}% of sampled worlds).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Phenomenon',
      name: 'Polar amplification',
      credit: 'mechanism assessment: IPCC AR6 WG1 (2021), §7.4.4.1; observed 1979–2021 trend ratio: Rantanen et al. (2022), Communications Earth & Environment 3: 168',
      statement: String.raw`When the climate is forced, the high latitudes, especially the Arctic, warm faster than the global mean; this is **polar amplification**. In climate-model projections of 21st-century warming the Arctic warms by a factor of two to four times the global mean (AR6 §7.4.4), and observations over 1979–2021 show a trend ratio of 3.8 (Rantanen et al., 2022, defining the Arctic as 66.5–90°N). Several feedbacks contribute: the ice–albedo feedback (climate-4.4) acts where ice melts; the lapse-rate feedback is positive in polar winter, where warming is trapped near the surface; and the Planck response itself is weaker in the cold, since $d(\sigma T^4)/dT\propto T^3$, so a given forcing needs more warming to be balanced. Diffusion of temperature smooths the pattern in the illustration; enhanced poleward latent-energy transport can itself amplify Arctic warming, and in the Southern Hemisphere, ocean uptake delays the amplification.`,
      idea: String.raw`Write the energy balance at each latitude as the forcing minus the local radiative restoring $\lambda(\phi)\,\Delta T(\phi)$ plus the divergence of the diffusive heat flux (the linear version of the Budyko–Sellers models of climate-5.1): $\tfrac{d}{dx}\bigl[(1-x^2)D\,\tfrac{d\Delta T}{dx}\bigr]-\lambda(x)\Delta T+\Delta F=0$ with $x=\sin\phi$. Where the net restoring $\lambda$ is small, the response is large, and diffusion only smooths it. Each feedback of climate-4.1 enters $\lambda(x)$ with its own latitude profile: a weak Planck response at the poles, a positive lapse-rate term there but a negative one in the tropics, the albedo feedback concentrated near the ice edge.`,
      caption: String.raw`A latitude-by-latitude linear energy-balance model forced uniformly by 3.93 W/m². Left: warming against latitude (blue) with the global mean (dashed) and the case with every feedback uniform (grey dashed flat line). Middle: the Planck restoring, the other feedbacks and their net against latitude (the net is what damps warming; where it is small, warming is large). Right: the Arctic (70–90°) warming relative to the global mean, and what it becomes when one ingredient is made uniform (bars) or heat transport is removed. Raise the diffusivity to spread the heat and the amplification falls; strengthen the ice term or the polar lapse-rate term and it grows. These illustrative annual-mean profiles are not fitted to Earth system models. Settings with an unstable restoring operator have no stable equilibrium and no amplification ratio.`,
      deps: ['climate-4.4', 'climate-4.3', 'pde-1.4'],
      refs: ['IPCC AR6 WG1 (2021), §7.4.4.1, pp. 982–984', 'Rantanen et al. (2022), Results, Fig. 1 and Table 1; Methods eq. (1)'],
      tags: ['feedback', 'polar amplification', 'energy balance'],
      scope: String.raw`A one-hemisphere linear model with illustrative latitude profiles: the base temperature is $302-45x^2$ K, the Planck restoring is rescaled to a global mean of 3.22 W m⁻² K⁻¹ (AR6), the cloud term is uniform (0.42), the water-vapour term follows $e^{0.04(T_0-288)}$ scaled to the AR6 global value 1.77, the lapse-rate term runs from the tropical to the polar value as $x^2$, and the ice term rises as $((\phi-35^\circ)/55^\circ)^2$ to its value at the pole. All feedbacks are written per kelvin of local warming, so the polar ice term is smaller than the AR6 global figure divided by the share of the planet covered. The shapes and the diffusivity are plausible choices, not fitted values; the model is a demonstration of the mechanisms, not a projection, and it omits seasonality, ocean heat uptake and changes in the type of heat transport, which models find essential for the full factor of two to four.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Polar_amplification' },
      viz(v) {
        const D = v.slider('heat-transport diffusivity $D$ (W/m²/K)', 0.02, 1.5, 0.2, { step: 0.01 });
        const ice = v.slider('ice–albedo feedback at the pole (per local K)', 0, 1.2, 0.8, { step: 0.01 });
        const lrT = v.slider('lapse-rate feedback, tropics', -2, 0, -1, { step: 0.05 });
        const lrP = v.slider('lapse-rate feedback, poles', -1, 1.5, 0.7, { step: 0.05 });
        const FF = v.slider('forcing (W/m²)', 1, 8, 3.93, { step: 0.05 });
        const n = 90, xc = Array.from({ length: n }, (_, j) => (j + 0.5) / n), phi = xc.map((x) => (Math.asin(x) * 180) / Math.PI);
        const T0 = xc.map((x) => 302 - 45 * x * x), eps = 0.61;
        const planck0 = T0.map((t) => 4 * eps * SIG * t ** 3), pm = planck0.reduce((a, b) => a + b, 0) / n, planck = planck0.map((p) => (p * LAM0) / pm);
        const g = phi.map((p) => clamp((p - 35) / 55, 0, 1) ** 2), gm = g.reduce((a, b) => a + b, 0) / n;
        const wv0 = T0.map((t) => Math.exp(0.04 * (t - 288))), wvm = wv0.reduce((a, b) => a + b, 0) / n, wvp = wv0.map((w) => (w * AR6.wv) / wvm);
        const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        function solve(o) {
          const lam = xc.map((x, j) => (o.planckUniform ? LAM0 : planck[j]) - (o.lrUniform ? AR6.wv : wvp[j]) - (o.lrUniform ? mean(xc.map((y) => lrT.value + (lrP.value - lrT.value) * y * y)) : lrT.value + (lrP.value - lrT.value) * x * x) - (o.iceUniform ? ice.value * gm : ice.value * g[j]) - AR6.cloud);
          return { ...latitudeResponse(lam, o.D, FF.value), lam };
        }
        const sA = v.stage({ x: [0, 90], y: [0, 14], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 270, xlabel: 'latitude (°)', ylabel: 'warming (K)', title: 'warming against latitude' });
        const sB = v.stage({ x: [0, 90], y: [-2.5, 5], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 270, xlabel: 'latitude (°)', ylabel: 'W/m² per K', title: 'the feedbacks against latitude' });
        const sC = v.stage({ x: [0, 6], y: [0, 4.5], axes: 'box', gutter: true, height: 320, weight: 1.3, minWidth: 250, xlabel: '', ylabel: 'Arctic ÷ global warming', title: 'one ingredient made uniform', xticks: [[0.55, 'all'], [1.55, 'D=0'], [2.55, 'Planck'], [3.55, 'LR+WV'], [4.55, 'ice'], [5.55, 'all']] });
        let R = null;
        v.render(() => {
          const all = solve({ D: D.value }), noD = solve({ D: 0 }), pU = solve({ D: D.value, planckUniform: true }), lU = solve({ D: D.value, lrUniform: true }), iU = solve({ D: D.value, iceUniform: true }), aU = solve({ D: D.value, planckUniform: true, lrUniform: true, iceUniform: true });
          R = { all, aU, noD, minLam: Math.min(...all.lam) };
          if (!all.stable) { sA.corner('no stable equilibrium for these feedbacks', 'tl', { color: 'red' }); sB.corner('restoring operator is unstable', 'tl', { color: 'red' }); sC.corner('amplification undefined', 'tl', { color: 'red' }); return; }
          sA.setView([0, 90], [0, Math.max(6, Math.ceil(Math.max(...all.dT) * 1.15))]);
          sA.hline(all.gmean, { color: 'muted', dash: [5, 4] }); sA.text('global mean ' + v.fix(all.gmean, 2) + ' K', 2, all.gmean, { size: 10.5, color: 'muted', align: 'left', baseline: 'bottom', dy: -2 });
          sA.vband(70, 90, { color: 'orange', alpha: 0.1 });
          if (aU.stable) sA.path(phi.map((p, j) => [p, aU.dT[j]]), { color: 'muted', width: 2, dash: true });
          sA.path(phi.map((p, j) => [p, all.dT[j]]), { color: 'accent', width: 2.8 });
          sA.text('Arctic', 80, 0.6, { size: 10.5, color: 'orange', align: 'center' });
          sB.hline(0, { color: 'faint' });
          const prof = (f, col, dash) => sB.path(xc.map((x, j) => [phi[j], f(x, j)]), { color: col, width: 2, dash });
          prof((x, j) => planck[j], 'blue'); prof((x, j) => wvp[j], 'teal'); prof((x) => lrT.value + (lrP.value - lrT.value) * x * x, 'purple'); prof((x, j) => ice.value * g[j], 'orange'); prof(() => AR6.cloud, 'pink');
          sB.path(phi.map((p, j) => [p, all.lam[j]]), { color: 'ink', width: 2.8 });
          sC.setView([0, 6], [0, Math.max(4.5, ...[all, noD, pU, lU, iU, aU].filter(r => r.stable).map(r => 1.15 * r.ratio))]);
          const bar = (i, val, col) => { if (val == null) { sC.text('unstable', i + .55, .25, { size: 9, color: 'red', align: 'center' }); return; } sC.rect(i + 0.15, 0, i + 0.95, val, { fill: col, fillAlpha: 0.7, stroke: false }); sC.text(v.fix(val, 1), i + 0.55, val, { size: 10.5, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 }); };
          bar(0, all.ratio, 'accent'); bar(1, noD.ratio, 'muted'); bar(2, pU.ratio, 'blue'); bar(3, lU.ratio, 'purple'); bar(4, iU.ratio, 'orange'); bar(5, aU.ratio, 'faint');
          sC.hline(1, { color: 'faint', dash: [4, 4] }); sC.rect(0, 2, 6, 4, { fill: 'green', fillAlpha: 0.08, stroke: false }); sC.text('ESM range 2–4', 5.95, 4.05, { size: 10.5, color: 'green', align: 'right' });
          R = { all, aU, noD, minLam: Math.min(...all.lam) };
        });
        v.legend([['blue', 'Planck'], ['teal', 'water vapour'], ['purple', 'lapse rate'], ['orange', 'ice–albedo'], ['pink', 'clouds'], ['ink', 'net restoring']]);
        v.readout(() => R && (!R.all.stable ? 'No stable equilibrium for these feedbacks: amplification is undefined. Reduce the amplifying feedbacks or increase heat transport.' : String.raw`Global mean warming **${v.fix(R.all.gmean, 2)}** K, Arctic (70–90°) **${v.fix(R.all.arctic, 2)}** K: amplification **${v.fix(R.all.ratio, 1)}** (all feedbacks uniform: ${R.aU.stable ? v.fix(R.aU.ratio, 1) : 'unstable'}; no heat transport: ${R.noD.stable ? v.fix(R.noD.ratio, 1) : 'unstable'}) · minimum net restoring ${v.fix(R.minLam, 2)} W/m²/K${R.minLam < 0 ? ' (negative: the local balance is unstable and only heat transport holds it)' : ''} · AR6: factor 2–4 in model projections; observed trend ratio 3.8 over 1979–2021 for 66.5–90°N (Rantanen et al. 2022); this model averages 70–90°`));
      },
    },
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Method',
      name: 'Feedback decomposition with radiative kernels',
      credit: 'radiative-kernel formulation: Soden et al. (2008), J. Climate 21: 3504–3520; assessment: IPCC AR6 WG1 (2021), §7.4.1',
      statement: String.raw`A **radiative kernel** is the derivative of the top-of-atmosphere flux with respect to a state variable at a given place and height: $K_T(p)=\partial N/\partial T(p)$ for temperature, $K_q(p)=\partial N/\partial\ln q(p)$ for water vapour, and for surface albedo $K_\alpha=\partial N/\partial\alpha$. For a climate change in which temperature, humidity and albedo change by $\delta T(p)$, $\delta\ln q(p)$, $\delta\alpha$, the change in net flux is, to first order, the sum $\delta N\approx K_{T_s}\delta T_s+\sum_p K_T\,\delta T+\sum_p K_q\,\delta\ln q+K_\alpha\delta\alpha$, and dividing each term by the surface warming gives the Planck ($\delta T$ uniform), lapse-rate (the departure of $\delta T$ from uniform), water-vapour and albedo feedbacks. Clouds need a separate correction because they mask the clear-sky kernels.`,
      idea: String.raw`The flux at the top of the atmosphere is a smooth function of the state of the column (the Schwarzschild integral of climate-2.6), so for a small change its first-order Taylor expansion is accurate, and the derivatives need to be computed only once for a given mean state, by perturbing each layer in turn. After that any model's temperature, humidity and albedo changes are fed in without further radiative-transfer calculations. The decomposition of climate-4.1 therefore becomes a measurement: each feedback parameter is the kernel-weighted change per kelvin, and the closure residual tests the accuracy of the linearization and whether radiative terms have been omitted.`,
      caption: String.raw`The two small panels are the kernels of this column (computed on this page by perturbing one layer at a time): how much a kelvin of warming, or an e-fold increase of its vapour, in each layer changes the radiation to space. Choose a warming pattern, the surface warming, a fractional change of humidity and a change of albedo: the kernel sum splits into Planck, lapse-rate, water-vapour and albedo bars (right), and the black marker is the exact recomputation of the whole column, so the gap is the error of the first-order approximation, which grows with the size of the change.`,
      deps: ['climate-4.1', 'climate-2.6', 'pma-9.16', 'pma-9.11'],
      refs: ['Soden et al. (2008), §4 eqs. (16)–(19), pp. 3507–3508; §5h eq. (25), p. 3518 (cloud correction)', 'IPCC AR6 WG1 (2021), §7.4.1, pp. 967–968'],
      tags: ['feedback', 'radiative kernel', 'method', 'linearization'],
      scope: String.raw`Clear-sky kernels of the chapter-2 synthetic-spectrum column, not published kernels (which come from observed climatologies or GCM states and include cloud masking). The humidity change is the fixed-relative-humidity increase multiplied by the chosen fractional humidity change, including the synthetic stratospheric humidity floor; this is not a percentage-point RH change; the albedo kernel is $-S/4$ per unit of albedo, the absorbed flux being $(1-\alpha)S/4$. The Planck term here is the response to uniform warming of the surface and every layer, stratosphere included.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Radiative_forcing' },
      viz(v) {
        const pat = v.select('warming pattern', [{ value: 'uni', label: 'uniform' }, { value: 'trop', label: 'tropical' }, { value: 'pol', label: 'surface-trapped' }], 'trop');
        const dTs = v.slider('surface warming (K)', 0.2, 6, 1, { step: 0.1 });
        const drh = v.slider('humidity multiplier change (%)', -10, 10, 0, { step: 0.5 });
        const dal = v.slider('albedo change $\\Delta\\alpha$', -0.01, 0.01, 0.0, { step: 0.0005, decimals: 4 });
        const sK = v.stage({ x: [-0.1, 0.5], y: [0, 16], axes: 'box', gutter: true, height: 320, weight: 0.8, minWidth: 210, xlabel: '$-K_T$ (W/m²/K per 100 hPa)', ylabel: 'height (km)', title: 'temperature kernel' });
        const sQ = v.stage({ x: [0, 4], y: [0, 16], axes: 'box', gutter: true, height: 320, weight: 0.8, minWidth: 210, xlabel: '$K_q$ (W/m² per ln $q$, per 100 hPa)', ylabel: '', title: 'humidity kernel' });
        const sB = v.stage({ x: [0, 6], y: [-6, 4], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 270, xlabel: '', ylabel: 'change of net flux (W/m²)', title: 'the kernel sum, term by term', xticks: [[0.55, 'Planck'], [1.55, 'lapse'], [2.55, 'vapour'], [3.55, 'albedo'], [5, 'total']] });
        let ctrl = null, K = null, A = null, Ap = null, R = null;
        whenControl((c) => {
          ctrl = c; A = tropicalAmp(295); Ap = polarAmp();
          K = { ...columnKernels(c), z: heights(c.T, GRID) }; v.invalidate();
        });
        v.render(() => {
          if (!ctrl || !K) { sB.corner('integrating the control column…', 'tl', { color: 'muted' }); R = null; return; }
          const { N, dp } = GRID, d = dTs.value, amp = pat.value === 'uni' ? GRID.pm.map(() => 1) : (pat.value === 'trop' ? A : Ap);
          // kernels per 100 hPa; N flux = −OLR
          const kt = K.KT.map((k, i) => (-k * 100) / dp[i]), kq = K.KQ.map((k, i) => (-k * 100) / dp[i]);
          sK.vline(0, { color: 'faint' }); sK.path(kt.map((k, i) => [-k, K.z[i]]), { color: 'blue', width: 2.4 }); sK.corner('surface −K_T = ' + v.fix(K.KTs, 2) + ' W/m²/K', 'tl', { color: 'blue' });
          sQ.setView([0, Math.max(...kq) * 1.15], [0, 16]); sQ.vline(0, { color: 'faint' }); sQ.path(kq.map((k, i) => [k, K.z[i]]), { color: 'teal', width: 2.4 });
          const T2 = ctrl.T.map((t, i) => t + d * amp[i]), q0 = ctrl.q, q2c = humidity(T2, GRID, {}), q2 = q2c.map((x, i) => x * (1 + drh.value / 100));
          const base0 = K.base, dQ = q2.map((x, i) => Math.log(x / q0[i]));
          const dTi = T2.map((t, i) => t - ctrl.T[i]);
          const planck = -d * (K.KTs + K.KT.reduce((a, b) => a + b, 0));
          const lr = -K.KT.reduce((a, k, i) => a + k * (dTi[i] - d), 0);
          const wv = -K.KQ.reduce((a, k, i) => a + k * dQ[i], 0);
          const direct = -(lw(T2, ctrl.Ts + d, 280, q2).olr - base0) - S4 * dal.value;
          const sum = planck + lr + wv - S4 * dal.value;
          sB.setView([0, 6], [Math.min(-6, planck, lr, wv, -S4 * dal.value, sum, direct) * 1.2, Math.max(4, planck, lr, wv, -S4 * dal.value, sum, direct) * 1.2]);
          const bar = (x, val, col) => { sB.rect(x + 0.1, Math.min(0, val), x + 1, Math.max(0, val), { fill: col, fillAlpha: 0.7, stroke: false }); sB.text((val >= 0 ? '+' : '−') + Math.abs(val).toFixed(2), x === 4.5 ? 5.2 : x + 0.55, val, { size: 10.5, color: 'ink', align: x === 4.5 ? 'left' : 'center', baseline: val >= 0 ? 'bottom' : 'top', dy: val >= 0 ? -3 : 3 }); };
          sB.hline(0, { color: 'faint' });
          bar(0, planck, 'blue'); bar(1, lr, 'purple'); bar(2, wv, 'teal'); bar(3, -S4 * dal.value, 'orange'); bar(4.5, sum, 'accent');
          sB.dot(5, direct, { color: 'ink', r: 6 });
          R = { planck, lr, wv, sum, direct, d, a: (x) => x / d, alb: -S4 * dal.value };
        });
        v.legend([['blue', 'Planck'], ['purple', 'lapse rate'], ['teal', 'water vapour'], ['orange', 'albedo'], ['accent', 'linear sum'], ['ink', 'exact recomputation', { dot: true }]]);
        v.readout(() => !R ? 'computing the kernels (a few seconds)…' : String.raw`Per kelvin of surface warming: Planck **${v.fix(R.planck / R.d, 2)}**, lapse rate **${v.fix(R.lr / R.d, 2)}**, water vapour **${v.fix(R.wv / R.d, 2)}**, albedo ${v.fix(R.alb / R.d, 2)} W/m²/K (clear-sky; AR6 all-sky: −3.22, water vapour + lapse rate +1.30, albedo +0.35) · kernel sum ${v.fix(R.sum, 2)} W/m² against the exact ${v.fix(R.direct, 2)}: error ${v.fix(R.sum - R.direct, 2)} W/m²`);
      },
    },
  ],
};
