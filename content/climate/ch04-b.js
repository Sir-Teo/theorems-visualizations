// Climate Science — Chapter 4 (part b): cloud feedbacks, the fat tail, polar amplification, radiative kernels
import { GRID, AR6, LAM0, whenControl, lw, humidity, tropicalAmp, polarAmp, heights, cloudOLR, tAtP, pAtT, tridiag, SIG, stableFeedbackLaw } from './ch04.shared.js';

import { polarModel } from './climate-source-audit-inference.js';

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
      verify: false, // AR6 core feedback values checked; historical credits and remaining numerical quotations still need review.
      credit: 'Assessed cloud processes and feedback: IPCC AR6 WG1 (2021), §7.4.2.4 and Table 7.10; illustrative cloud layer',
      statement: String.raw`A cloud changes the energy budget in two opposing ways. It reflects sunlight, a **shortwave** cooling that is larger for clouds that are thick and low; it also absorbs the surface and lower-air radiation and re-emits at its own, colder temperature, a **longwave** warming that is larger for clouds that are high and cold. The **cloud radiative effect** (CRE) is the difference in top-of-atmosphere net radiation between all-sky and clear-sky conditions; it contains opposing shortwave and longwave terms. The cloud **feedback** is the radiative response of cloud-property changes per kelvin, after correcting for non-cloud masking effects; a raw change of CRE also contains those effects. AR6 assesses the net cloud feedback as positive, $+0.42$ W m⁻² K⁻¹ (very likely $-0.10$ to $+0.94$), with high confidence in the sign: high clouds rise (positive), subtropical low-cloud amount decreases (positive), and some mid- and high-latitude clouds brighten (negative). Cloud feedback is the largest source of spread in climate sensitivity among models.`,
      idea: String.raw`A cloud is a grey absorber at its own temperature, so the outgoing radiation is a weighted average of a clear column (climate-2.6) and a column whose emission comes from the cloud top. Its longwave effect is the difference, which grows as the cloud top gets colder, while its shortwave effect is proportional to the fraction of the sky covered times its reflectivity. Warming moves each of the three knobs: the **fixed-anvil-temperature** argument says the cloud top stays at the same temperature, and therefore rises as the air warms, trapping more radiation; changes in cloud fraction and optical depth, which depend on circulation and microphysics, can push either way. Their sum is the net feedback, and because the terms are comparable in size but opposite in sign, the total is poorly constrained (the gain of climate-4.1 amplifies that).`,
      caption: String.raw`A single grey cloud layer is added to the synthetic-spectrum column. Left: how the effect of the cloud depends on how high its top is (red: longwave, blue: shortwave, black: net). The buttons set a low stratocumulus, a thin cirrus or a deep anvil. Right: warm the column and let the cloud respond: the bars add the change of the net effect per kelvin from warming alone, a rising cloud top (set the slider to 1 for a cloud that keeps its temperature), a change of cloud amount, and a change of reflectivity. The shaded band is AR6's very-likely range for the whole cloud feedback.`,
      deps: ['climate-4.1', 'climate-2.6'],
      refs: ['IPCC AR6 WG1 ch. 7'],
      tags: ['feedback', 'clouds', 'radiative effect'],
      scope: String.raw`One cloud layer of fixed emissivity in the clear-sky column of chapter 2, the shortwave effect taken as $-c\,r\,S/4$ with $S/4=340$ W m⁻² (no multiple reflection or surface-albedo interaction), and the warming pattern the tropical moist adiabat of climate-4.3 scaled by a slider. The change of cloud radiative effect is shown as the feedback; AR6's cloud feedback additionally corrects for the masking of cloud by water vapour and the surface, which is omitted. Cloud optical depth is distributed between adjacent ambient-temperature layers, approximating a movable grey cloud; cloud amount/reflectivity are clipped to their stated physical bounds. If the target cloud-top temperature is absent from the warmed profile, its original pressure is retained and reported. The waterfall decomposition is sequential and depends on its chosen order. The three responses are inputs the reader chooses: the page does not predict how real clouds change, which is exactly the uncertainty.`,
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
          const ys=o0.flatMap(o=>[o.lwc,o.swc,o.lwc+o.swc]),lo=Math.min(0,...ys),hi=Math.max(0,...ys);sA.setView([120,980],[lo-.14*(hi-lo+1),hi+.14*(hi-lo+1)]);
          sA.hline(0, { color: 'faint' });
          sA.path(ps.map((p, i) => [p, o0[i].lwc]), { color: 'red', width: 2.4 });
          sA.path(ps.map((p, i) => [p, o0[i].swc]), { color: 'blue', width: 2.4 });
          sA.path(ps.map((p, i) => [p, o0[i].lwc + o0[i].swc]), { color: 'ink', width: 2.8 });
          const cur = cre(ctrl.T, ctrl.Ts, Q0, pc, ec, c, r);
          sA.vline(pc, { color: 'gold', dash: [5, 4] }); sA.dot(pc, cur.lwc + cur.swc, { color: 'gold', r: 6 });
          // warmed climate
          const amp = A.map((a) => 1 + patS.value * (a - 1)), T1 = ctrl.T.map((t, i) => t + d * amp[i]), Ts1 = ctrl.Ts + d, q1 = humidity(T1, GRID, {});
          const Tc = tAtP(ctrl.T, pc), pMatch = pAtT(T1,Tc), pFat = pMatch ?? pc, pNew = Math.exp((1 - fatS.value) * Math.log(pc) + fatS.value * Math.log(pFat));
          const cNew = clamp(c * (1 + (dcS.value * d) / 100), 0.01, 1), rNew = clamp(r * (1 + (drS.value * d) / 100), 0, 0.95);
          const s0 = cur.lwc + cur.swc;
          const a1 = cre(T1, Ts1, q1, pc, ec, c, r), a2 = cre(T1, Ts1, q1, pNew, ec, c, r), a3 = cre(T1, Ts1, q1, pNew, ec, cNew, r), a4 = cre(T1, Ts1, q1, pNew, ec, cNew, rNew);
          const net = (o) => o.lwc + o.swc;
          const parts = [(net(a1) - s0) / d, (net(a2) - net(a1)) / d, (net(a3) - net(a2)) / d, (net(a4) - net(a3)) / d], tot = parts.reduce((a, b) => a + b, 0);
          const cumul=[0];for(const p of parts)cumul.push(cumul.at(-1)+p);const loB=Math.min(-.1,...cumul),hiB=Math.max(.94,tot,...cumul),pad=.16*(hiB-loB+1);sB.setView([0,6],[loB-pad,hiB+pad]);
          sB.rect(0, AR6.cloud - 0.52, 6, AR6.cloud + 0.52, { fill: 'green', fillAlpha: 0.12, stroke: false }); sB.hline(AR6.cloud, { color: 'green', dash: [5, 4] }); sB.corner('AR6: 0.42 (−0.10 to 0.94)','bl',{size:10,color:'green'});
          sB.hline(0, { color: 'faint' });
          let run = 0;
          parts.forEach((x, i) => { sB.rect(0.15 + i, Math.min(run, run + x), 1.05 + i, Math.max(run, run + x), { fill: x >= 0 ? 'orange' : 'blue', fillAlpha: 0.7, stroke: false }); sB.text((x >= 0 ? '+' : '−') + Math.abs(x).toFixed(2), 0.6+i,run+x,{size:10.5,color:'ink',align:'center',baseline:x>=0?'bottom':'top',dy:x>=0?-3:3}); run += x; });
          sB.rect(4.5, Math.min(0, tot), 5.5, Math.max(0, tot), { fill: 'accent', fillAlpha: 0.7, stroke: false }); sB.text((tot >= 0 ? '+' : '−') + Math.abs(tot).toFixed(2), 5,tot,{size:11,color:'ink',align:'center',baseline:tot>=0?'bottom':'top',dy:tot>=0?-3:3});
          R = { cur, tot, parts, pc, pNew, matched:pMatch!==null };
        });
        v.legend([['red', 'longwave'], ['blue', 'shortwave'], ['ink', 'net'], ['green', 'AR6 cloud feedback', { area: true }]]);
        v.readout(() => !R ? 'integrating the control column (a few seconds)…' : String.raw`Cloud at ${v.fix(R.pc, 0)} hPa: longwave **${v.fix(R.cur.lwc, 1)}**, shortwave **${v.fix(R.cur.swc, 1)}**, net **${v.fix(R.cur.lwc + R.cur.swc, 1)}** W/m² · after warming the top sits at ${v.fix(R.pNew, 0)} hPa${R.matched ? '' : ' (target temperature absent; original pressure retained)'} · change of the net effect **${v.fix(R.tot, 2)}** W/m² per K (parts: warming ${v.fix(R.parts[0], 2)}, height ${v.fix(R.parts[1], 2)}, amount ${v.fix(R.parts[2], 2)}, reflectivity ${v.fix(R.parts[3], 2)})`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Proposition',
      name: 'The fat tail of climate sensitivity (Roe–Baker)',
      credit: 'G. H. Roe and M. B. Baker, 2007, Science 318: 629–632',
      statement: String.raw`Let the feedback factor $f$ be normal with mean $\bar f<1$ and standard deviation $\sigma_f$, and let the no-feedback warming $\Delta T_0>0$ be fixed. On the **stable branch** $f<1$, $S=\Delta T_0/(1-f)$ has the conditional density
$$p_S(s)=\frac{\Delta T_0}{Zs^2}\,p_f\!\left(1-\frac{\Delta T_0}{s}\right),\qquad s>0,\quad Z=P(f<1).$$
The distribution has a long upper tail proportional to $s^{-2}$ and an infinite population mean, although any finite simulation gives a finite sample mean. Its $p$-quantile is $\Delta T_0/[1-\bar f-\sigma_f\Phi^{-1}(pZ)]$; the median is therefore slightly below $\Delta T_0/(1-\bar f)$ when the discarded probability is appreciable. Draws with $f\ge1$ have no stable equilibrium and are reported separately. Roe and Baker proposed this feedback transformation as an explanation for persistent uncertainty in high climate sensitivity; it does not prevent better evidence from narrowing assessed ranges.`,
      idea: String.raw`The map $f\mapsto 1/(1-f)$ is convex (climate-4.1): equal steps in $f$ near 1 correspond to ever larger steps in $S$. A symmetric density of $f$ is therefore stretched on the upper side and compressed on the lower side, and the change-of-variables formula $p_S(s)\,ds=p_f(f)\,df$ with $f=1-\Delta T_0/s$ gives the density above after dividing by the stable-branch probability $Z$. A small uncertainty $\delta f$ becomes $\delta S\approx \Delta T_0\,\delta f/(1-f)^2=G^2\,\Delta T_0\,\delta f$: it grows with the square of the gain, and a higher best estimate is automatically a more uncertain one. In terms of the AR6 summary (climate-3.5), this is part of why the very-likely range extends further above the best estimate than below it.`,
      caption: String.raw`Left: the Gaussian distribution of the feedback factor. Right: the distribution of sensitivity obtained by pushing it through $\Delta T_0/(1-f)$, analytic curve and a histogram of 6000 sampled worlds, conditioned on $f<1$, with its median, finite-sample mean and 5–95 % range marked. Mass above the 12 K plotting limit is omitted, not redistributed into the visible histogram. Lower the uncertainty $\sigma_f$: the core narrows but the conditional chance of exceeding 4.5 K, plotted in the bottom panel against $\sigma_f$, falls much more slowly. Raise the mean feedback and the tail swells.`,
      deps: ['climate-4.1', 'climate-3.5'],
      refs: ['Roe & Baker (2007), Science 318:629–632, Eq. 3 and Fig. 2; https://doi.org/10.1126/science.1144735', 'IPCC AR6 WG1 ch. 7'],
      tags: ['climate sensitivity', 'uncertainty', 'feedback', 'probability'],
      scope: String.raw`Treats $\Delta T_0$ as exact and $f$ as normally distributed, as in Roe & Baker's argument; the paper’s Figure 2 uses $\bar f=0.65$ and $\sigma_f$ between 0.10 and 0.30. Draws with $f\ge1$ have no stable equilibrium and are excluded from the histogram and the percentiles (their fraction is reported). Unlike the unconditioned transformation, all displayed densities, quantiles and exceedance probabilities condition on $f<1$. AR6 does not use this model for its assessed range; it combines several lines of evidence (climate-3.9).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Climate_sensitivity' },
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
          const m = mu.value, s = sg.value, D = d0.value, law = stableFeedbackLaw(m, s, D);
          const pf = (f) => Math.exp(-0.5 * ((f - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
          sA.fn(pf, { color: 'accent', width: 2.4, fill: true, domain: [-0.2, 1.3] });
          sA.vband(1, 1.3, { color: 'red', alpha: 0.12 }); sA.vline(1, { color: 'red', dash: [5, 4] }); sA.text('f ≥ 1', 1.15, 3.8, { size: 10.5, color: 'red', align: 'center' });
          const ps = law.density;
          sB.fn(ps, { color: 'ink', width: 2.6, domain: [0.3, 12], n: 400 });
          // samples
          const rng = v.rng(seed), N = 6000, xs = []; let runaway = 0;
          for (let i = 0; i < N; i++) { const f = m + s * rng.normal(); if (f >= 1) runaway++; else xs.push(D / (1 - f)); }
          const hist = v.M.histogram(xs, { bins: 48, range: [0, 12] });
          hist.density = hist.counts.map((n, i) => n / (xs.length * (hist.edges[i + 1] - hist.edges[i])));
          sB.hist(hist, { density: true, color: 'orange', fillAlpha: 0.35 });
          const q = law.quantile;
          const q05 = q(0.05), q50 = q(0.5), q95 = q(0.95);
          sB.vband(q05, Math.min(q95, 12), { color: 'green', alpha: 0.09 });
          sB.vline(q50, { color: 'green', width: 2 }); sB.text('median ' + v.fix(q50, 1), q50 + 0.1, 0.55, { size: 11, color: 'green', align: 'left' });
          const mean = xs.reduce((a, b) => a + b, 0) / xs.length; sB.vline(mean, { color: 'gold', dash: [5, 4] });
          const pEx = (sd) => stableFeedbackLaw(m, sd, D).exceedance(4.5);
          sC.fn(pEx, { color: 'accent', width: 2.4, domain: [0.02, 0.35] }); sC.dot(s, pEx(s), { color: 'gold', r: 6 });
          sC.hline(0, { color: 'faint' });
          R = { q05, q50, q95, mean, runaway: (100 * runaway) / N, pEx: pEx(s), p3: law.exceedance(3), lam: LAM0 };
        });
        v.legend([['green', 'median'], ['gold', 'sample mean', { dash: true }], ['orange', 'sampled worlds', { area: true }]]);
        v.readout(() => R && String.raw`Stable-branch median **${v.fix(R.q50, 2)}** K, 5–95 % range ${v.fix(R.q05, 2)} to ${Number.isFinite(R.q95) ? v.fix(R.q95, 2) : '∞'} K, mean of the finite draws ${v.fix(R.mean, 2)} K · $P(S>4.5\text{ K}\mid f<1)=$ ${v.fix(100 * R.pEx, 1)} % · $P(f\ge1)=$ ${v.fix(R.runaway, 1)} % · for comparison AR6's assessed likely range is 2.5–4 K around 3 K`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Phenomenon',
      name: 'Polar amplification',
      verify: false, // AR6 core feedback values checked; historical credits and remaining numerical quotations still need review.
      credit: 'Mechanism assessment: IPCC AR6 WG1 (2021), §7.4.4.1; observed 1979–2021 ratio: Rantanen et al. (2022), Communications Earth & Environment3:168, Table1 and Eq1',
      statement: String.raw`When the climate is forced, the high latitudes, especially the Arctic, warm faster than the global mean; this is **polar amplification**. In climate-model projections of 21st-century warming the Arctic warms by a factor of two to four times the global mean (AR6 §7.4.4), and Rantanen et al. (2022) find a four-dataset mean trend ratio of 3.8 over 1979–2021 for 66.5–90°N; this is a period-specific ratio, not a universal amplification constant. Several feedbacks contribute: the ice–albedo feedback (climate-4.4) acts where ice melts; the lapse-rate feedback is positive in polar winter, where warming is trapped near the surface; and the Planck response itself is weaker in the cold, since $d(\sigma T^4)/dT\propto T^3$, so a given forcing needs more warming to be balanced. Dry temperature diffusion smooths the chosen model pattern; real latent-energy transport can also enhance polar amplification, and in the Southern Hemisphere, ocean uptake delays the amplification.`,
      idea: String.raw`Write the energy balance at each latitude as the forcing minus the local radiative restoring $\lambda(\phi)\,\Delta T(\phi)$ plus the divergence of the diffusive heat flux (the linear version of the Budyko–Sellers models of climate-5.1): $\tfrac{d}{dx}\bigl[(1-x^2)D\,\tfrac{d\Delta T}{dx}\bigr]-\lambda(x)\Delta T+\Delta F=0$ with $x=\sin\phi$. Where the net restoring $\lambda$ is small, the response is large, and diffusion only smooths it. Each feedback of climate-4.1 enters $\lambda(x)$ with its own latitude profile: a weak Planck response at the poles, a positive lapse-rate term there but a negative one in the tropics, the albedo feedback concentrated near the ice edge.`,
      caption: String.raw`Change forcing, diffusivity and feedback profiles. The first panel compares the solution with uniform feedbacks; the second shows restoring/feedback profiles. Bars compare Arctic 66.5–90° warming divided by the symmetric-planet mean for each modified model. The no-transport case uses **D=0**; P means uniform Planck, LR/WV uniform lapse-rate plus vapour, and × marks an unstable/near-singular variant. Positive-definiteness of the full discrete restoring-plus-diffusion operator is checked before interpreting a steady solution as a stable response; unstable or numerically near-singular cases are labelled and omitted from warming curves/bars. A negative local restoring coefficient alone does not decide global stability. The model has chosen annual-mean profiles and is not a reconstruction of observed trends or a forecast.`,
      deps: ['climate-4.4', 'climate-4.3'],
      refs: ['IPCC AR6 WG1 ch. 7'],
      tags: ['feedback', 'polar amplification', 'energy balance'],
      scope: String.raw`A symmetric one-hemisphere linear model with illustrative latitude profiles: the base temperature is $302-45x^2$ K, the Planck restoring is rescaled to a global mean of 3.22 W m⁻² K⁻¹ (AR6), the cloud term is uniform (0.42), the water-vapour term follows $e^{0.04(T_0-288)}$ scaled to the AR6 global value 1.77, the lapse-rate term runs from the tropical to the polar value as $x^2$, and the ice term rises as $((\phi-35^\circ)/55^\circ)^2$ to its value at the pole. All feedbacks are written per kelvin of local warming, so the polar ice term is smaller than the AR6 global figure divided by the share of the planet covered. The shapes and the diffusivity are plausible choices, not fitted values; the model is a demonstration of the mechanisms, not a projection, and it omits seasonality, ocean heat uptake and moisture transport. The Arctic cap average uses fractional grid-cell area weights north of66.5°, matching the cited observational domain. The paper comparison concerns trend ratios over 1979–2021, not this equilibrium model. [Original Rantanen et al.](https://www.nature.com/articles/s43247-022-00498-3.pdf).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Polar_amplification' },
      viz(v) {
        const D=v.slider('heat diffusivity D (W/m²/K)',.02,1.5,.2,{step:.01}),ice=v.slider('ice feedback at pole (per local K)',0,1.2,.8,{step:.01}),lrT=v.slider('lapse-rate feedback, tropics',-2,0,-1,{step:.05}),lrP=v.slider('lapse-rate feedback, pole',-1,1.5,.7,{step:.05}),FF=v.slider('forcing (W/m²)',1,8,3.93,{step:.05});
        const sA=v.stage({x:[0,90],y:[0,14],axes:'box',gutter:true,height:320,weight:1.2,minWidth:270,xlabel:'latitude (°)',ylabel:'warming (K)',title:'stable equilibrium response only'});
        const sB=v.stage({x:[0,90],y:[-3,5],axes:'box',gutter:true,height:320,weight:1.2,minWidth:270,xlabel:'latitude (°)',ylabel:'W/m² per local K',title:'chosen feedback profiles'});
        const sC=v.stage({x:[0,6.2],y:[-.2,5],axes:'box',gutter:true,height:320,weight:1.3,minWidth:250,xlabel:'modified ingredient',ylabel:'Arctic / symmetric global warming',title:'stability checked separately per bar',xticks:[[.55,'base'],[1.55,'D=0'],[2.55,'P'],[3.55,'LR/WV'],[4.55,'ice'],[5.55,'all']]});
        let R=null;
        v.render(()=>{
          const input={D:D.value,ice:ice.value,lrT:lrT.value,lrP:lrP.value,F:FF.value},all=polarModel(input),variants=[all,polarModel({...input,D:0}),polarModel({...input,planckUniform:true}),polarModel({...input,lrUniform:true}),polarModel({...input,iceUniform:true}),polarModel({...input,planckUniform:true,lrUniform:true,iceUniform:true})],uniform=variants[5];
          const curves=variants.filter((x,j)=>x.stable&&(j===0||j===5)),values=curves.flatMap(x=>x.dT),top=Math.max(1,...values);sA.setView([0,90],[-.1*top,top*1.2]);sA.vband(66.5,90,{color:'orange',alpha:.1});
          for(const x of curves)sA.path(x.phi.map((p,j)=>[p,x.dT[j]]),{color:x===all?'accent':'muted',width:x===all?2.8:1.8,dash:x===all?undefined:[5,4]});
          if(all.stable)sA.hline(all.gmean,{color:'muted',dash:true});else sA.corner('base operator unstable / near singular','tl',{color:'red',size:10.5});
          const profiles=[all.planck,all.wv,all.lr,all.iceProfile,all.phi.map(()=>.42),all.lam],colours=['blue','teal','purple','orange','pink','ink'],pv=profiles.flat(),lo=Math.min(0,...pv),hi=Math.max(...pv);sB.setView([0,90],[lo-.12*(hi-lo+1),hi+.12*(hi-lo+1)]);sB.hline(0,{color:'faint'});profiles.forEach((p,j)=>sB.path(all.phi.map((phi,i)=>[phi,p[i]]),{color:colours[j],width:j===5?2.8:1.8}));
          const ratios=variants.filter(x=>x.stable).map(x=>x.ratio),rmax=Math.max(1,...ratios);sC.setView([0,6.2],[-.25*rmax,rmax*1.25]);sC.hline(1,{color:'faint',dash:true});
          variants.forEach((x,j)=>{if(!x.stable){sC.text('×',j+.55,-.12*rmax,{color:'red',size:9,align:'center'});return;}sC.rect(j+.15,0,j+.95,x.ratio,{fill:j===0?'accent':'muted',fillAlpha:.7,stroke:false});sC.text(v.fix(x.ratio,2),j+.55,x.ratio,{size:10.5,color:'ink',align:'center',baseline:'bottom',dy:-3});});
          R={input,all,variants};
        });
        v.legend([['blue','Planck restoring'],['teal','water vapour'],['purple','lapse rate'],['orange','ice'],['pink','cloud'],['ink','net restoring']]);
        v.readout(()=>`${R.all.stable?`Stable base: symmetric global mean ${v.fix(R.all.gmean,3)} K; Arctic 66.5–90° ${v.fix(R.all.arctic,3)} K; ratio ${v.fix(R.all.ratio,3)}.`:'Base restoring-plus-diffusion operator is not positive definite within numerical tolerance; no stable warming response displayed.'} No-transport variant: ${R.variants[1].stable?v.fix(R.variants[1].ratio,3):'unstable / near singular'}.\nRantanen et al.: observed four-dataset mean trend ratio 3.8 for 1979–2021,66.5–90°N. The present equilibrium demonstration is not a fit to that observation.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Method',
      name: 'Feedback decomposition with radiative kernels',
      verify: false, // AR6 core feedback values checked; historical credits and remaining numerical quotations still need review.
      credit: 'Radiative-kernel formulation: IPCC AR6 WG1 (2021), §7.4.1; central-difference implementation in the synthetic column',
      statement: String.raw`A **radiative kernel** is the derivative of the top-of-atmosphere flux with respect to a state variable at a given place and height: $K_T(p)=\partial N/\partial T(p)$ for temperature, $K_q(p)=\partial N/\partial\ln q(p)$ for water vapour, and for surface albedo $K_\alpha=\partial N/\partial\alpha$. For a climate change in which temperature, humidity and albedo change by $\delta T(p)$, $\delta\ln q(p)$, $\delta\alpha$, the change in net flux is, to first order, the sum $\delta N\approx K_{T_s}\delta T_s+\sum_p K_T\,\delta T+\sum_p K_q\,\delta\ln q+K_\alpha\delta\alpha$, and dividing each term by the surface warming gives the Planck ($\delta T$ uniform), lapse-rate (the departure of $\delta T$ from uniform), water-vapour and albedo feedbacks. Clouds need a separate correction because they mask the clear-sky kernels.`,
      idea: String.raw`The flux at the top of the atmosphere is a smooth function of the state of the column (the Schwarzschild integral of climate-2.6), so for a small change its first-order Taylor expansion is accurate, and the derivatives need to be computed only once for a given mean state, by perturbing each layer in turn. After that any model's temperature, humidity and albedo changes are fed in without further radiative-transfer calculations. The decomposition of climate-4.1 therefore becomes a measurement: each feedback parameter is the kernel-weighted change per kelvin, and the bars add to the linearized response. A difference from full recomputation can reflect finite-change nonlinearity, differencing error or omitted terms; it does not by itself prove a missing feedback.`,
      caption: String.raw`The two small panels are the kernels of this column (computed on this page by perturbing one layer at a time): how much a kelvin of warming, or an e-fold increase of its vapour, in each layer changes the radiation to space. Choose a warming pattern, the surface warming, a relative percentage change of relative humidity and a change of albedo: the kernel sum splits into Planck, lapse-rate, water-vapour and albedo bars (right), and the black marker is the exact recomputation of the whole column, so the gap is the error of the first-order approximation, which generally becomes more important for larger changes but need not grow monotonically.`,
      deps: ['climate-4.1', 'climate-2.6'],
      refs: ['IPCC AR6 WG1 ch. 7'],
      tags: ['feedback', 'radiative kernel', 'method', 'linearization'],
      scope: String.raw`Clear-sky kernels of the chapter-2 synthetic-spectrum column, not published kernels (which come from observed climatologies or GCM states and include cloud masking). The humidity change is the fixed-relative-humidity increase plus the chosen change of relative humidity; the albedo kernel is $-S/4$ per unit of albedo, the absorbed flux being $(1-\alpha)S/4$. Central differences use ±0.5 K and ±0.05 in ln q; these are numerical derivative approximations. Kernels include all column layers and are displayed over the full computed height. The Planck term here is the response to uniform warming of the surface and every layer, stratosphere included.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Radiative_forcing' },
      viz(v) {
        const pat = v.select('warming pattern', [{ value: 'uni', label: 'uniform' }, { value: 'trop', label: 'tropical' }, { value: 'pol', label: 'surface-trapped' }], 'trop');
        const dTs = v.slider('surface warming (K)', 0.2, 6, 1, { step: 0.1 });
        const drh = v.slider('relative-humidity change (%)', -10, 10, 0, { step: 0.5 });
        const dal = v.slider('albedo change $\\Delta\\alpha$', -0.01, 0.01, 0.0, { step: 0.0005, decimals: 4 });
        const sK = v.stage({ x: [-0.1, 0.5], y: [0, 16], axes: 'box', gutter: true, height: 320, weight: 0.8, minWidth: 210, xlabel: '$K_T$ (W/m²/K per 100 hPa)', ylabel: 'height (km)', title: 'temperature kernel' });
        const sQ = v.stage({ x: [0, 4], y: [0, 16], axes: 'box', gutter: true, height: 320, weight: 0.8, minWidth: 210, xlabel: '$K_q$ (W/m² per ln $q$, per 100 hPa)', ylabel: '', title: 'humidity kernel' });
        const sB = v.stage({ x: [0, 6], y: [-6, 4], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 270, xlabel: '', ylabel: 'change of net flux (W/m²)', title: 'the kernel sum, term by term', xticks: [[0.55, 'Planck'], [1.55, 'lapse'], [2.55, 'vapour'], [3.55, 'albedo'], [5, 'total']] });
        let ctrl = null, K = null, A = null, Ap = null, R = null;
        whenControl((c) => {
          ctrl = c; A = tropicalAmp(295); Ap = polarAmp();
          const { N } = GRID, base = lw(c.T, c.Ts, 280, c.q).olr, KT = [], KQ = [];
          for (let i = 0; i < N; i++) {
            const T2 = c.T.slice(); T2[i] += 0.5; const T3 = c.T.slice(); T3[i] -= 0.5;
            KT.push(lw(T2, c.Ts, 280, c.q).olr - lw(T3, c.Ts, 280, c.q).olr);
            const q2 = c.q.slice(); q2[i] *= Math.exp(0.05); const q3 = c.q.slice(); q3[i] *= Math.exp(-0.05);
            KQ.push((lw(c.T, c.Ts, 280, q2).olr - lw(c.T, c.Ts, 280, q3).olr) / 0.1);
          }
          const KTs = lw(c.T, c.Ts + 0.5, 280, c.q).olr - lw(c.T, c.Ts - 0.5, 280, c.q).olr;
          K = { KT, KQ, KTs, base, z: heights(c.T, GRID) }; v.invalidate();
        });
        v.render(() => {
          if (!ctrl || !K) { sB.corner('integrating the control column…', 'tl', { color: 'muted' }); R = null; return; }
          const { N, dp } = GRID, d = dTs.value, amp = pat.value === 'uni' ? GRID.pm.map(() => 1) : (pat.value === 'trop' ? A : Ap);
          // kernels per 100 hPa; N flux = −OLR
          const kt = K.KT.map((k, i) => (-k * 100) / dp[i]), kq = K.KQ.map((k, i) => (-k * 100) / dp[i]);
          sK.setView([Math.min(0,...kt)*1.15-.01,Math.max(0,...kt)*1.15+.01],[-1,Math.max(...K.z)*1.05]);sK.vline(0,{color:'faint'});sK.path(kt.map((k,i)=>[k,K.z[i]]),{color:'blue',width:2.4});
          sQ.setView([Math.min(0,...kq)-.01,Math.max(...kq)*1.15+.01],[-1,Math.max(...K.z)*1.05]); sQ.vline(0, { color: 'faint' }); sQ.path(kq.map((k, i) => [k, K.z[i]]), { color: 'teal', width: 2.4 });
          const T2 = ctrl.T.map((t, i) => t + d * amp[i]), q0 = ctrl.q, q2c = humidity(T2, GRID, {}), q2 = humidity(T2,GRID,{rh:1+drh.value/100});
          const base0 = K.base, dQ = q2.map((x, i) => Math.log(x / q0[i]));
          const dTi = T2.map((t, i) => t - ctrl.T[i]);
          const planck = -d * (K.KTs + K.KT.reduce((a, b) => a + b, 0));
          const lr = -K.KT.reduce((a, k, i) => a + k * (dTi[i] - d), 0);
          const wv = -K.KQ.reduce((a, k, i) => a + k * dQ[i], 0);
          const alb = -S4 * 4 * dal.value / 4 * 1; // −(S/4)Δα
          const direct = -(lw(T2, ctrl.Ts + d, 280, q2).olr - base0) - S4 * dal.value;
          const sum = planck + lr + wv - S4 * dal.value;
          void alb;
          const bar = (x, val, col) => { sB.rect(x + 0.1, Math.min(0, val), x + 1, Math.max(0, val), { fill: col, fillAlpha: 0.7, stroke: false }); sB.text((val >= 0 ? '+' : '−') + Math.abs(val).toFixed(2), x + 0.55, val >= 0 ? val : val, { size: 10.5, color: 'ink', align: 'center', baseline: val >= 0 ? 'bottom' : 'top', dy: val >= 0 ? -3 : 3 }); };
          const ys=[0,planck,lr,wv,-S4*dal.value,sum,direct],lo=Math.min(...ys),hi=Math.max(...ys);sB.setView([0,6],[lo-.15*(hi-lo+1),hi+.15*(hi-lo+1)]);
          sB.hline(0, { color: 'faint' });
          bar(0, planck, 'blue'); bar(1, lr, 'purple'); bar(2, wv, 'teal'); bar(3, -S4 * dal.value, 'orange'); bar(4.5, sum, 'accent');
          sB.dot(5, direct, { color: 'ink', r: 6, label: 'exact ' + v.fix(direct, 2), labelPos: 'nw' });
          R = { planck, lr, wv, sum, direct, d, a: (x) => x / d, alb: -S4 * dal.value };
        });
        v.readout(() => !R ? 'computing the kernels (a few seconds)…' : String.raw`Per kelvin of surface warming: Planck **${v.fix(R.planck / R.d, 2)}**, lapse rate **${v.fix(R.lr / R.d, 2)}**, water vapour **${v.fix(R.wv / R.d, 2)}**, albedo ${v.fix(R.alb / R.d, 2)} W/m²/K (clear-sky; AR6 all-sky: −3.22, water vapour + lapse rate +1.30, albedo +0.35) · kernel sum ${v.fix(R.sum, 2)} W/m² against the exact ${v.fix(R.direct, 2)}: error ${v.fix(R.sum - R.direct, 2)} W/m²`);
      },
    },
  ],
};
