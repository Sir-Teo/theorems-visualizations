// Climate Science — Chapter 4: Climate feedbacks (items 4.1–4.4; 4.5–4.8 are in ch04-b.js)
import { GRID, AR6, LAM0, whenControl, lw, humidity, esat, tropicalAmp, polarAmp, heights, SIG, fx } from './ch04.shared.js';

import { feedbackRounds, iceFraction, iceASR, iceOLR, iceRoots, iceForcing, ICE_S, ICE_AI, ICE_AO, ICE_EPS, ICE_F0, ICE_SIG } from './climate-source-audit-energy.js';

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
      verify: false, // AR6 core feedback values checked; historical credits and remaining numerical quotations still need review.
      credit: 'Linear energy-balance algebra; assessed feedback inputs: IPCC AR6 WG1 (2021), §§7.4.1–7.4.2 and Table 7.10',
      statement: String.raw`Let a forcing produce the no-feedback warming $\Delta T_0=\Delta F/\lambda_0$, where $\lambda_0>0$ is the Planck restoring rate (climate-3.4), and suppose each kelvin of warming changes the energy budget by a further $\alpha_x$ (W m⁻² K⁻¹) through feedback $x$, with sign convention that positive $\alpha_x$ amplifies. With the **feedback factor** $f=\sum_x\alpha_x/\lambda_0$, the equilibrium warming is $\Delta T=\Delta T_0/(1-f)$ provided $f<1$, and the **gain** is $G=1/(1-f)$. Equivalently the net feedback parameter is $\lambda=\lambda_0(1-f)$ and $\Delta T=\Delta F/\lambda$. For $|f|<1$, the same result is the limit of the series $\Delta T_0(1+f+f^2+\cdots)$ obtained by feeding back round after round. For $f\ge1$ the feedback rounds do not converge and there is no stable equilibrium: at $f=1$ the restoring term vanishes, while $f>1$ gives an unstable algebraic fixed point. For $f\le-1$ the round-by-round iteration also fails, although the continuous energy-balance model still has a stable equilibrium.`,
      idea: String.raw`Write the energy balance at equilibrium: forcing plus the extra flux from all feedbacks equals the Planck loss, $\Delta F+\sum_x\alpha_x\Delta T=\lambda_0\Delta T$. Solving for $\Delta T$ gives $\Delta F/(\lambda_0-\sum\alpha_x)=\Delta T_0/(1-f)$. The geometric series is an algebraic iteration, not a physical time integration: the first round of warming $\Delta T_0$ triggers extra forcing $f\,\Delta T_0\,\lambda_0$, which warms by a further $f\Delta T_0$, and so on. It is the closed-loop formula of control theory (ctrl-1.4) with forward gain $1/\lambda_0$ and loop gain $f\lambda_0/\lambda_0=f$.`,
      caption: String.raw`The staircase shows the warming added in each round of feedback (the first, blue step, is the no-feedback response; orange steps are the feedback rounds), with the running total as gold dots and the limit $\Delta T_0/(1-f)$ as a dashed line. Drag the feedback factor $f$: at $f=0.64$ (the sum of the AR6 non-Planck feedbacks over the Planck response) the total settles within a few rounds at about 2.8 times the no-feedback warming; push $f$ past 1 and the displayed totals grow without being clipped; within the negative slider range, the rounds alternate and shrink. All rounds and the selected stable gain remain visible. The right panel is the gain curve.`,
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
          const rounds=feedbackRounds(F,d0,n),lim=rounds.limit;
          const values=[0,...rounds.pts.map(p=>p.total),...(lim===null?[]:[lim])],lo=Math.min(...values),hi=Math.max(...values),pad=Math.max(.2,(hi-lo)*.12);
          sA.setView([-.7,n+.7],[lo-pad,hi+pad]);
          sA.hline(0, { color: 'faint' });
          if (lim != null) { sA.hline(lim, { color: 'green', dash: [6, 4], width: 1.6 }); sA.text('limit ' + v.fix(lim, 2) + ' K', n + 0.6, lim, { size: 11, color: 'green', align: 'right', baseline: 'bottom', dy: -3 }); }
          for(const p of rounds.pts)sA.rect(p.j-.36,Math.min(p.before,p.total),p.j+.36,Math.max(p.before,p.total),{fill:p.j===0?'blue':'orange',fillAlpha:.75,stroke:false});
          const pts=rounds.pts.map(p=>[p.j,p.total]),S=rounds.total;
          sA.path(pts,{color:'gold',width:1.6,alpha:.7});sA.dots(pts,{color:'gold',r:3.5});
          const G=rounds.gain,ymax=Math.max(12,G===null?0:G*1.15);
          sB.setView([-1,1.4],[0,ymax]);
          sB.fn(x=>1/(1-x),{domain:[-1,1-1/(ymax*.95)],color:'accent',width:2.4,n:240});
          sB.vband(1, 1.4, { color: 'red', alpha: 0.12 }); sB.vline(1, { color: 'red', dash: [5, 4] }); sB.text('unstable', 1.2, 6, { size: 11, color: 'red', align: 'center' });
          const f6 = 2.06 / LAM0; sB.dot(f6, 1 / (1 - f6), { color: 'green', r: 4, hollow: true, label: 'AR6', labelPos: 'nw' });
          if (F < 1) sB.dot(F, G, { color: 'gold', r: 6 });
          sB.hline(1, { color: 'faint', dash: [3, 4] });
          R = { S, lim, G, lam: LAM0 * (1 - F), F };
        });
        v.legend([['blue', 'no-feedback response'], ['orange', 'feedback round'], ['gold', 'running total', { dot: true }], ['green', 'limit', { dash: true }]]);
        v.readout(() => !R ? 'computing…' : (R.F < 1
          ? String.raw`$f=${v.fix(R.F, 2)}$: after ${nR.value} rounds ${v.fix(R.S, 2)} K, limit $\Delta T_0/(1-f)=$ **${v.fix(R.lim, 2)} K** (gain ${v.fix(R.G, 2)}) · net feedback $\lambda=\lambda_0(1-f)=$ ${v.fix(R.lam, 2)} W/m²/K with $\lambda_0=3.22$ · AR6: gain ${v.fix(1 / (1 - 2.06 / LAM0), 2)}, $\lambda=1.16$`
          : String.raw`$f=${v.fix(R.F, 2)}\ge1$: the feedback increments do not decay, the total after ${nR.value} rounds is ${v.fix(R.S, 1)} K and keeps growing — the linear model has no stable equilibrium.`));
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Phenomenon',
      name: 'Water-vapour feedback',
      verify: false, // AR6 core feedback values checked; historical credits and remaining numerical quotations still need review.
      credit: 'Assessed water-vapour feedback: IPCC AR6 WG1 (2021), §7.4.2.2; illustrative synthetic-spectrum column',
      statement: String.raw`Saturation vapour pressure rises by roughly 6–7 % per kelvin (Clausius–Clapeyron, geo-1.5), and observations and models show that the atmosphere's relative humidity changes little as it warms, so its water-vapour content rises by about that rate. Water vapour is a greenhouse gas, so the extra vapour, particularly effective in the upper troposphere, reduces the outgoing longwave radiation at a given temperature. The result is a **positive feedback**: AR6 gives a water-vapour feedback of $\alpha_{WV}\approx+1.8$ W m⁻² K⁻¹ (CMIP5/6: $1.77\pm0.20$; satellite estimate $1.85\pm0.32$), more than half the size of the Planck response, which would give a gain of about 2.2 if this 1.77 term acted alone with a 3.22 Planck restoring magnitude.`,
      idea: String.raw`Compute the outgoing radiation of the same warmed atmosphere twice: once with the humidity left unchanged, which gives the Planck response alone, and once with relative humidity held fixed, so that $q$ follows Clausius–Clapeyron (geo-1.5). The difference in outgoing radiation, per kelvin, is the feedback. It comes mainly from the upper troposphere because the emission level (climate-2.7) of the water bands lies there, and the vapour that matters most is the small amount in cold air, where a fractional increase can have a disproportionately large effect on escaping radiation. The feedback is thus a statement about how the emission level of water vapour rises as the air warms.`,
      caption: String.raw`The synthetic-spectrum column is warmed uniformly by $\Delta T$. Left: how much more radiation escapes to space, with humidity frozen (blue: the Planck response) and with fixed relative humidity (red: less escapes, because the added vapour traps it); the gap divided by $\Delta T$ is the water-vapour feedback. Middle: which layers matter; each bar is the incremental effect of moistening a slab after the layers above it have been moistened; these sequential contributions include overlap and are not independent layer kernels (the slider restricts the red curve to layers above a chosen pressure). Right: the chosen saturation-pressure approximation increases more rapidly per kelvin in colder air; it is a numerical illustration, not a precision vapour-pressure fit over the entire plotted temperature range. The first computation takes a few seconds.`,
      deps: ['climate-4.1', 'geo-1.5'],
      refs: ['Archer ch. 7', 'IPCC AR6 WG1 ch. 7'],
      tags: ['feedback', 'water vapour', 'Clausius–Clapeyron'],
      scope: String.raw`Clear-sky synthetic-spectrum column with a chosen pressure-dependent relative-humidity profile and a 4 ppm specific-humidity floor (chapter 2); the warming is uniform in the vertical, so no lapse-rate change is included (that is climate-4.3), and the computed number is for this column and not an AR6 estimate. The 6–7 % per kelvin figure applies to saturation vapour pressure near the surface; real relative humidity does shift a little with circulation, but its feedback is assessed as close to zero (AR6: $0.00\pm0.06$).`,
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
          const vals=[0,...P,...W],vlo=Math.min(...vals),vhi=Math.max(...vals);sA.setView([-.2,6.2],[vlo-.08*(vhi-vlo+1),vhi+.16*(vhi-vlo+1)]);
          sA.path(ds.map((d, i) => [d, P[i]]), { color: 'blue', width: 2.6 }); sA.dots(ds.map((d, i) => [d, P[i]]), { color: 'blue', r: 3 });
          sA.path(ds.map((d, i) => [d, W[i]]), { color: 'red', width: 2.6 }); sA.dots(ds.map((d, i) => [d, W[i]]), { color: 'red', r: 3 });
          const d = dT.value, pD = olrAt(d, qFixed) - base, wD = olrAt(d, qCut(cut.value)) - base;
          sA.line(d, wD, d, pD, { color: 'orange', width: 3 }); sA.text('trapped by extra vapour ' + v.fix(pD - wD, 1), d+(d>3?-.1:.1),(pD+wD)/2,{size:10.5,color:'orange',align:d>3?'right':'left',plate:true});
          // slabs: moistening only the layers above each cutoff
          const edges = Array.from({ length: 14 }, (_, j) => 1000 * 0.84 ** j);
          const O = edges.map((p0) => olrAt(d, qCut(p0)) - base);
          const parts=O.slice(1).map((x,j)=>(x-O[j])/d);sB.setView([Math.min(...edges)*.94,1050],[Math.min(0,...parts)-.04,Math.max(.1,...parts)*1.2]);
          for (let j = 0; j < edges.length - 1; j++) { const part = (O[j + 1] - O[j]) / d; sB.rect(edges[j + 1] * 1.01, 0, edges[j] * 0.99, part, { fill: 'red', fillAlpha: 0.6, stroke: false }); }
          const alpha = (pD - wD) / d, alphaAll = (pD - (olrAt(d, qCut(1100)) - base)) / d;
          const qNew = qCut(1100)(T1(ctrl.T, d));
          R = { alpha, alphaAll, pD, wD, d, pwr: (pw(qNew) / pw(ctrl.q) - 1) * 100 / d };
          sC.setView([195,315],[0,100*(esat(201)/esat(200)-1)*1.1]);
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
      verify: false, // AR6 core feedback values checked; historical credits and remaining numerical quotations still need review.
      credit: 'Assessed lapse-rate and humidity decompositions: IPCC AR6 WG1 (2021), §7.4.2.2; illustrative column',
      statement: String.raw`When the tropics warm, convection keeps the temperature profile close to a moist adiabat, which cools more slowly with height as the surface warms, so the upper troposphere warms more than the surface (the amplification depends on temperature and height). The upper air is where the planet radiates to space, so it emits more than it would if the whole column warmed by the same amount as the surface. This is a **negative feedback**, the **lapse-rate feedback** $\alpha_{LR}<0$, which cancels part of the water-vapour feedback; in polar regions, where winter warming is trapped near the surface by inversions, the sign reverses. AR6 assesses the combined water-vapour plus lapse-rate feedback as $+1.30$ W m⁻² K⁻¹ (likely 1.2 to 1.4), against water vapour alone near $+1.77$, so the lapse-rate term is roughly $-0.5$; the different LR* decomposition, which includes the moistening accompanying the lapse-rate change at fixed relative humidity, has a model mean of $-0.10\pm0.07$.`,
      idea: String.raw`A rising air parcel cools at the moist-adiabatic rate (geo-1.6), which is smaller at higher temperature because more latent heat is released: the moist adiabat of a warmer surface is shifted by more aloft than at the ground. Radiation to space from the upper troposphere (climate-2.7, climate-2.11) therefore grows faster than $\sigma T^4$ evaluated at the surface warming. Comparing the outgoing radiation with the actual warming pattern to that with uniform warming isolates the feedback. If humidity follows relative humidity, the extra warming aloft also moistens the upper air, which blocks radiation again, and the two effects largely cancel; that is why the lapse-rate and water-vapour feedbacks are anticorrelated across models.`,
      caption: String.raw`Choose where the warming happens (tropics: the moist-adiabat pattern computed on this page; uniform; surface-trapped, as at high latitude in winter) and how strongly the pattern is expressed, then warm the surface. Left: the warming at each height compared with uniform warming; right: the change in outgoing radiation for each, and the feedback computed from the difference. Flip the humidity switch to hold relative humidity fixed instead of specific humidity and watch most of the negative feedback disappear. The small panel traces pattern strength from 0 to 1.5; values above 1 extrapolate the chosen pattern and can produce cooling aloft in the surface-trapped case.`,
      deps: ['climate-4.2', 'geo-1.6'],
      refs: ['IPCC AR6 WG1 ch. 7', 'Pierrehumbert'],
      tags: ['feedback', 'lapse rate', 'moist adiabat'],
      scope: String.raw`The tropical pattern is the saturated moist adiabat from a 295 K surface (computed here), blended back to uniform warming above the troposphere; it is applied to the global-mean synthetic-spectrum clear-sky column of chapter 2, so the numbers show the mechanism rather than reproduce an AR6 value. Real tropical air is not saturated at the surface, and the real polar pattern is more complex than the one-parameter shape used here.`,
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
          const xs=[d,...ampU.map(a=>d*a),...ampP.map(a=>d*a)],xmin=Math.min(0,...xs),xmax=Math.max(...xs);sA.setView([xmin-.12*(xmax-xmin+1),xmax+.12*(xmax-xmin+1)],[-1,Math.max(...z)*1.05]);
          sA.path([[d, 0], ...z.map((zz, i) => [d * ampU[i], zz])], { color: 'muted', width: 2.2, dash: true });
          sA.path([[d, 0], ...z.map((zz, i) => [d * ampP[i], zz])], { color: 'red', width: 2.8 });
          sA.dot(d, 0, { color: 'gold', r: 5 });
          sB.setView([0,4],[Math.min(0,dU,dP)-.15*(Math.abs(dU)+Math.abs(dP)+1),Math.max(0,dU,dP)+.15*(Math.abs(dU)+Math.abs(dP)+1)]);
          sB.rect(0.55, 0, 1.45, dU, { fill: 'muted', fillAlpha: 0.6, stroke: false }); sB.text(v.fix(dU, 2), 1, dU, { size: 11, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 });
          sB.rect(2.15, 0, 3.05, dP, { fill: 'red', fillAlpha: 0.65, stroke: false }); sB.text(v.fix(dP, 2), 2.6, dP, { size: 11, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 });
          const a = -(dP - dU) / d;
          sB.line(0.55, dU, 3.05, dU, { color: 'muted', dash: [4, 4] });
          // strength curve
          const ss = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5], pts = ss.map((s) => [s, -(olrWith(ampOf(pat.value, s), d, fol) - base2 - dU) / d]);
          const ys=[0,...pts.map(p=>p[1]),a,fol?AR6.lrStar:-.5],ymin=Math.min(...ys),ymax=Math.max(...ys);sC.setView([-.08,1.58],[ymin-.15*(ymax-ymin+1),ymax+.15*(ymax-ymin+1)]);
          sC.hline(0, { color: 'faint' }); sC.path(pts, { color: 'accent', width: 2.4 }); sC.dots(pts, { color: 'accent', r: 3 });
          sC.dot(str.value, a, { color: 'gold', r: 6 });
          sC.hline(fol ? AR6.lrStar : -0.5, { color: 'green', dash: [5, 4] }); sC.text(fol ? 'AR6 LR* −0.10' : 'AR6 ≈ −0.5', 1.48, fol ? AR6.lrStar : -0.5, { size: 10.5, color: 'green', align: 'right', baseline: 'bottom', dy: -2 });
          const aOf = (amp) => -(olrWith(amp, d, fol) - base2 - dU) / d;
          const mix = 0.5 * aOf(ampOf('trop', 1)) + 0.366 * aOf(ampOf('trop', 0.5)) + 0.134 * aOf(ampOf('pol', 1));
          R = { a, dU, dP, d, fol, mix };
        });
        v.readout(() => !R ? 'integrating the control column (a few seconds)…' : String.raw`Surface warming ${v.fix(R.d, 1)} K: uniform warming lets ${v.fix(R.dU, 2)} W/m² more escape, the pattern ${v.fix(R.dP, 2)} W/m² → lapse-rate feedback **${v.fix(R.a, 2)}** W/m²/K (${R.fol ? 'relative humidity fixed; AR6 LR* = −0.10 ± 0.07' : 'specific humidity held; AR6: water vapour + lapse rate = +1.30 and water vapour alone 1.77, so roughly −0.5'})
Global mix (tropics 50 % of the area with the full pattern, mid-latitudes 37 % at half strength, poles 13 % surface-trapped): **${v.fix(R.mix, 2)}** W/m²/K against AR6's ${R.fol ? '−0.10 ± 0.07' : 'about −0.5'}: these are chosen area weights and a synthetic clear-sky column, not an estimate of the assessed global feedback`);      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Phenomenon',
      name: 'Ice–albedo feedback',
      verify: false, // AR6 core feedback values checked; historical credits and remaining numerical quotations still need review.
      credit: 'Assessed surface-albedo feedback: IPCC AR6 WG1 (2021), §7.4.2.3 and Table 7.10; illustrative energy-balance model',
      statement: String.raw`Loss of reflective snow and sea ice generally lowers surface albedo and increases absorbed sunlight, producing a positive feedback. Atmospheric scattering and absorption reduce the resulting change in **planetary** albedo, so surface and planetary albedos are distinct. For a global model whose planetary albedo is $\alpha(T)$, the feedback is $\alpha_A=-(S/4)\alpha'(T)$. AR6 assesses the surface-albedo contribution as $+0.35$ W m⁻² K⁻¹, very likely $+0.10$ to $+0.60$. A positive local energy-balance slope makes an equilibrium unstable; its eventual warm or cold destination depends on the forcing and initial state.`,
      idea: String.raw`Let $f_i(T)$ be a decreasing ice fraction and $\alpha=\alpha_o+(\alpha_i-\alpha_o)f_i$. Then $ASR'=-\tfrac S4(\alpha_i-\alpha_o)f_i'>0$. Stability of $C\dot T=ASR(T)+F-OLR(T)$ requires $ASR'-OLR'<0$. A larger ice response can create multiple equilibria, but instability alone does not select a Snowball outcome. This page's clipped linear ice law has corners at zero/full ice cover; branch changes there need not be smooth saddle-node bifurcations.`,
      caption: String.raw`Change forcing and ice sensitivity. Intersections on the left are all equilibria (green stable, red unstable, orange marginal); the grey marker uses constant planetary albedo 0.3. The middle panel shows equilibrium branches within forcing −50 to +12 W/m²; selected equilibria are gold. At high sensitivity there can be several stable branches, so no particular branch is presented as a time-evolved outcome. The right panel is the assumed ice fraction. Plot ranges include every equilibrium for all slider settings.`,
      deps: ['climate-4.1', 'climate-1.5'],
      refs: ['Archer ch. 7', 'IPCC AR6 WG1 ch. 7'],
      tags: ['feedback', 'albedo', 'ice', 'bistability'],
      scope: String.raw`One global box with $OLR=0.6106\sigma T^4$, $S=1361$ W/m², and effective **planetary** albedo $0.265+(0.62-0.265)f_i$, where $f_i=\mathrm{clip}[f_0+k(288-T),0,1]$ and $f_0=(0.3-0.265)/(0.62-0.265)$. These effective albedos and the ice law are chosen, not measured surface reflectances. The default $k=0.0029$ K⁻¹ matches an albedo slope near AR6's global contribution; it is not an inferred global ice-cover sensitivity. No heat transport or seasonal ice physics is represented. Source assessment: [AR6 §7.4.2.3](https://www.ipcc.ch/report/ar6/wg1/downloads/report/IPCC_AR6_WGI_Chapter07.pdf).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ice%E2%80%93albedo_feedback' },
      viz(v) {
        const dF=v.slider('forcing (W/m²)',-40,12,3.93,{step:.05}),kk=v.slider('ice response k (fraction per K)',0,.06,.0029,{step:.0001,decimals:4});
        v.button('AR6-sized slope (k=0.0029)',()=>kk.set(.0029));
        const sA=v.stage({x:[180,330],y:[20,450],axes:'box',gutter:true,height:340,weight:1.3,minWidth:280,xlabel:'surface temperature (K)',ylabel:'W/m²',title:'all energy-balance intersections'});
        const sB=v.stage({x:[-53,15],y:[180,330],axes:'box',gutter:true,height:340,weight:1,minWidth:250,xlabel:'forcing (W/m²)',ylabel:'equilibrium temperature (K)',title:'branches within −50 to +12 W/m²'});
        const sC=v.stage({x:[180,330],y:[-.08,1.12],axes:'box',gutter:true,height:340,weight:.8,minWidth:220,xlabel:'temperature (K)',ylabel:'assumed ice fraction',title:'chosen clipped ice law'});
        let R=null;
        v.render(()=>{
          const F=dF.value,k=kk.value,rs=iceRoots(F,k),fixed=((ICE_S/4*.7+F)/(ICE_EPS*ICE_SIG))**.25;
          sA.fn(iceOLR,{color:'blue',width:2.6,domain:[180,330]});
          sA.hline(ICE_S/4*.7+F,{color:'muted',dash:true});sA.fn(T=>iceASR(T,k)+F,{color:'orange',width:2.6,domain:[180,330]});
          for(const r of rs)sA.dot(r.T,iceOLR(r.T),{color:r.stable?'green':r.unstable?'red':'orange',hollow:!r.stable,r:6});
          sA.dot(fixed,iceOLR(fixed),{color:'muted',r:5});
          // Parametrize the complete branch by T, avoiding missed roots at folds.
          const branches={stable:[],unstable:[]};let segment=[];let kind=null;
          const flush=()=>{if(segment.length>1)sB.path(segment,{color:kind==='stable'?'green':'red',width:2});segment=[];};
          for(let j=0;j<=1800;j++){const T=180+j*150/1800,ff=iceForcing(T,k),h=.0001,slope=(iceForcing(T+h,k)-iceForcing(T-h,k))/(2*h),next=slope>0?'stable':'unstable';if(ff< -50||ff>12){flush();kind=null;continue;}if(kind!==next){flush();kind=next;}segment.push([ff,T]);}flush();
          for(const r of rs)sB.dot(F,r.T,{color:'gold',r:5,hollow:!r.stable});
          sC.fn(T=>iceFraction(T,k),{domain:[180,330],color:'teal',width:2.6});
          for(const r of rs)sC.dot(r.T,iceFraction(r.T,k),{color:r.stable?'gold':'red',hollow:!r.stable,r:5});
          const aice=ICE_S/4*(ICE_AI-ICE_AO)*k,dolr=4*iceOLR(288)/288;
          R={F,k,rs,fixed,aice,dolr};
        });
        v.legend([['blue','emitted'],['orange','absorbed'],['muted','fixed albedo'],['green','stable'],['red','unstable'],['gold','selected forcing equilibria']]);
        v.readout(()=>`Chosen albedo feedback at 288 K ${v.fix(R.aice,3)} W/m²/K; restoring slope ${v.fix(R.dolr,3)}. Local instability threshold k=${v.fix(R.dolr/(ICE_S/4*(ICE_AI-ICE_AO)),4)} K⁻¹.\nForcing ${v.fix(R.F,2)} W/m²: ${R.rs.map(r=>`${v.fix(r.T,3)} K (${r.stable?'stable':r.unstable?'unstable':'marginal'})`).join('; ')}. Fixed-albedo temperature ${v.fix(R.fixed,3)} K. Multiple stable states require an initial state/history to select an outcome.`);
      },
    },
  ],
};
