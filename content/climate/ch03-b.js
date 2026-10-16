// Climate Science — Chapter 3 (part b): transient response, Arrhenius, Pinatubo, evidence synthesis, aerosol–cloud interactions
import { F2X, fx, twoBox, at } from './ch03.shared.js';

const LN2 = Math.log(2);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export default {
  collection: 'climate',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Definition',
      name: 'Transient climate response',
      credit: 'defined in the IPCC Third Assessment Report (2001); AR6 values from Chapter 7 (2021)',
      statement: String.raw`The **transient climate response** (TCR) is the rise in global-mean surface air temperature at the moment CO₂ has doubled when it is increased by 1 % per year (year 70, since $1.01^{70}\approx 2$), with all else following. Because the forcing is nearly linear in time under this scenario ($\Delta F\approx \Delta F_{2\times}\,t/69.7$ yr), the TCR measures how much of the equilibrium warming has appeared by the time of doubling. AR6 assesses TCR at **1.8 °C**, likely 1.4 to 2.2 °C and very likely 1.2 to 2.4 °C; it is always smaller than the equilibrium sensitivity (climate-3.5) because the ocean is still taking up heat.`,
      idea: String.raw`Split the response into a fast part and a slow part. The land, atmosphere and upper ocean (a layer of order a hundred metres) respond within a few years, so the surface temperature tracks the forcing, but warm surface water mixes down and exchanges heat with the deep ocean, whose large heat capacity delays full warming for centuries. A fraction $\kappa$ of each extra watt is thus carried away, and in steady ramp $\mathrm{TCR}\approx \Delta F_{2\times}/(-\alpha+\kappa)$ whereas $\mathrm{ECS}=\Delta F_{2\times}/(-\alpha)$; the ratio $\mathrm{TCR}/\mathrm{ECS}=(-\alpha)/(-\alpha+\kappa)$ is below one by the strength of ocean heat uptake. This is the thermal inertia of climate-1.9 turned into a number.`,
      caption: String.raw`CO₂ rises 1 % a year. The blue line is the warming of a two-layer ocean model; the dashed line is what the surface would reach if it stayed in equilibrium with the current forcing; the horizontal line is ECS. Slide the heat-uptake coefficient $\gamma$ to zero and the transient warming approaches the equilibrium value; increase it and the gap opens. The gold bar at year 70 is AR6's likely range for TCR; the right panel shows how TCR/ECS depends on $\gamma$.`,
      deps: ['climate-3.5', 'climate-1.9'],
      refs: ['IPCC AR6 WG1 ch. 7'],
      tags: ['climate sensitivity', 'ocean heat uptake'],
      scope: String.raw`Two-layer ocean energy-balance model with generic parameters (mixed layer C = 8 W yr m⁻² K⁻¹, deep ocean C_d = 100, γ = 0.7 W m⁻² K⁻¹; sliders change them), constant feedback, and forcing $\Delta F_{2\times}t/69.7$ (logarithmic CO₂ forcing under 1 %/yr growth, 3.93 W m⁻² for the doubling). It illustrates the mechanism; it is not the emulator behind AR6's numbers, and the slowest ocean response (millennia) is not represented. TCR in AR6 is the 20-year mean around year 70, which this single-year value approximates.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Climate_sensitivity#Transient_climate_response' },
      viz(v) {
        const lam = v.slider('net feedback magnitude $-\\alpha$ (W/m² per K)', 0.6, 2.2, 1.16, { step: 0.01 });
        const gam = v.slider('ocean heat uptake $\\gamma$ (W/m² per K)', 0, 1.6, 0.7, { step: 0.01 });
        const Cd = v.slider('deep-ocean capacity $C_d$', 20, 600, 100, { log: true, sig: 2 });
        const Cm = v.slider('mixed-layer capacity $C$', 3, 20, 8, { step: 0.1 });
        const sA = v.stage({ x: [0, 140], y: [0, 5], axes: 'box', gutter: true, height: 340, weight: 1.3, minWidth: 290, xlabel: 'years (CO₂ +1 % per year; doubled at year 70)', ylabel: 'warming (K)', title: 'transient warming' });
        const sB = v.stage({ x: [0, 2], y: [0, 1.05], axes: 'box', gutter: true, height: 340, weight: 0.8, minWidth: 240, xlabel: 'ocean heat uptake $\\gamma$ (W/m² per K)', ylabel: 'TCR / ECS', title: 'how much has appeared by year 70' });
        const Fr = (t) => (F2X * t) / (Math.log(2) / Math.log(1.01));
        let R = null;
        v.render(() => {
          const o = { C: Cm.value, Cd: Cd.value, gam: gam.value }, L = lam.value, ecs = F2X / L;
          const s = twoBox(Fr, L, o, 140, 0.25);
          sA.rect(66, 1.4, 74, 2.2, { fill: 'gold', fillAlpha: 0.25, stroke: false }); sA.text('gold bar: AR6 TCR, likely 1.4–2.2 K (best 1.8)', 138, 0.35, { size: 10.5, color: 'gold', align: 'right' });
          sA.hline(ecs, { color: 'green', dash: [5, 4] }); sA.text(`ECS = ${fx(v, ecs, 2)} K`, 139, ecs, { size: 11.5, color: 'green', align: 'right', baseline: 'bottom', dy: -3 });
          sA.fn((t) => Fr(t) / L, { color: 'muted', dash: [6, 4], width: 1.8, domain: [0, 140] });
          sA.path(Array.from(s.t).map((t, i) => [t, s.T[i]]).filter((_, i) => i % 4 === 0), { color: 'accent', width: 2.8 });
          sA.path(Array.from(s.t).map((t, i) => [t, s.Td[i]]).filter((_, i) => i % 4 === 0), { color: 'purple', width: 1.8, dash: [3, 3] });
          const tcr = at(s, s.T, 70);
          sA.vline(70, { color: 'faint' }); sA.dot(70, tcr, { color: 'gold', r: 7, label: `TCR ${fx(v, tcr, 2)} K`, labelPos: 'se' });
          // ratio against gamma
          const gs = []; for (let g = 0; g <= 2.001; g += 0.05) { const sg = twoBox(Fr, L, { ...o, gam: g }, 70, 0.5); gs.push([g, at(sg, sg.T, 70) / ecs]); }
          sB.path(gs, { color: 'accent', width: 2.6 }); sB.hline(1, { color: 'faint', dash: [3, 4] });
          sB.dot(gam.value, tcr / ecs, { color: 'gold', r: 7, label: fx(v, tcr / ecs, 2), labelPos: 'ne' });
          sB.text('AR6 combined: 1.8 / 3 = 0.6', 1.98, 0.18, { size: 10.5, color: 'muted', align: 'right' });
          R = { tcr, ecs, ratio: tcr / ecs, kappa: gam.value };
        });
        v.legend([['accent', 'surface warming'], ['purple', 'deep ocean', { dash: true }], ['muted', 'equilibrium with current forcing', { dash: true }]]);
        v.readout(() => R && String.raw`TCR (year 70) = **${fx(v, R.tcr, 2)} K**, ECS = ${fx(v, R.ecs, 2)} K, TCR/ECS = ${fx(v, R.ratio, 2)} · with γ = 0 the ratio tends to one, as heat uptake is what separates the two · AR6: TCR 1.8 K (likely 1.4–2.2), ECS 3 K (likely 2.5–4)`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Event',
      name: 'Arrhenius’s 1896 estimate',
      credit: 'Svante Arrhenius, read to the Royal Swedish Academy of Sciences on 11 December 1895; published in Philosophical Magazine, April 1896',
      statement: String.raw`In 1896 Svante Arrhenius published the first quantitative estimate of how the temperature of the ground depends on the carbonic acid (CO₂) in the air. Using Langley's measurements of the infrared radiation of the Moon to estimate the absorption by water vapour and CO₂, and balancing radiation at the surface in latitude bands and seasons, he found that raising CO₂ to 1.5, 2, 2.5 and 3 times its amount would warm the earth by about 3.4, 5.4, 7 and 8 °C (area-weighted over his table's latitudes) and that lowering it to 0.67 would cool by about 3 °C; and that, if CO₂ grows in geometric progression, the temperature rises nearly in arithmetic progression. He proposed that a fall to 0.62–0.55 of the present amount could account for an ice age 4–5 °C colder. His 5.4 °C for a doubling is nearly twice the best estimate of 3 °C that AR6 gives for the equilibrium response.`,
      idea: String.raw`The calculation joins ideas from earlier chapters: the surface and the air exchange infrared, and CO₂ and water vapour absorb it (climate-2.3); absorption grows with the amount of gas but with diminishing returns, which is why equal steps of temperature follow geometric steps of CO₂ (climate-2.8). Arrhenius also let the water vapour respond: in his calculation he took the relative humidity to stay fixed as the temperature changed, so a warmer air held more vapour and amplified the effect. His numbers rest on Langley's lunar measurements, not on modern spectra, and on a balance without convection or clouds, and modern estimates are about half as large. The result was disputed soon after: Ångström argued around 1900 that the air already absorbed so much that extra CO₂ would matter little, a view that the AR6 chapter calls incorrect. The 1.5–4.5 °C range of the 1979 Charney report then became the long-lived consensus.`,
      caption: String.raw`The slider sets the CO₂ multiple. Dots are Arrhenius's table, averaged over latitude; the red line is his geometric-to-arithmetic rule fitted through them; the green line is AR6's best estimate (3 K per doubling) with the likely range shaded. Below, the ice-age test: for a given cooling, the CO₂ multiple that each estimate needs, against the roughly 0.68 of the last glacial maximum (190 ppm against 278 ppm), which on the modern sensitivity gives only part of the 5–7 °C cooling.`,
      deps: ['climate-2.8', 'climate-2.3'],
      see: ['climate-3.11'],
      refs: ['Archer ch. 4'],
      tags: ['history', 'climate sensitivity', 'Arrhenius'],
      scope: String.raw`Arrhenius's numbers are annual means of his Table VII (13 bands from 70° N to 60° S, area-weighted by cos latitude over 70° N–50° S, an average made here from the table as transcribed in climate-3.11); the cool-and-warm values are relative to the CO₂ level of 1896, whereas AR6's ECS is relative to a doubling of whatever the level is, and the green line also ignores that other agents were responsible for part of the ice-age cooling (AR6 §7.5.3). The date of the Academy meeting is from the footnote of the 1896 paper.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Svante_Arrhenius' },
      viz(v) {
        const K = v.slider('CO₂ multiple $K$', 0.5, 3.2, 2, { log: true, sig: 3 });
        const cool = v.slider('cooling to explain (°C)', 1, 7, 4.5, { step: 0.1 });
        const sA = v.stage({ x: [0.5, 3.2], xlog: true, y: [-5, 10], axes: 'box', gutter: true, height: 340, weight: 1.1, minWidth: 280, xlabel: 'CO₂ as a multiple of the starting level', ylabel: 'equilibrium warming (°C)', title: 'warming against CO₂' });
        const sB = v.stage({ x: [1, 7], y: [0, 1.1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'cooling to explain (°C)', ylabel: 'CO₂ multiple needed', title: 'the ice-age test' });
        // least-squares slope through the origin of ΔT = s log₂K (ARR table)
        const xs = [0.67, 1.5, 2, 2.5, 3], ys = [-3.18, 3.39, 5.41, 7.05, 8.25];
        const s = xs.reduce((a, k, i) => a + Math.log2(k) * ys[i], 0) / xs.reduce((a, k) => a + Math.log2(k) ** 2, 0);
        const interp = (k) => { if (k <= xs[0]) return ys[0] * Math.log2(k) / Math.log2(xs[0]); for (let i = 1; i < xs.length; i++) if (k <= xs[i]) { const f = (Math.log(k) - Math.log(xs[i - 1])) / (Math.log(xs[i]) - Math.log(xs[i - 1])); return ys[i - 1] + f * (ys[i] - ys[i - 1]); } return ys[4]; };
        let R = null;
        v.render(() => {
          sA.hline(0, { color: 'faint' }); sA.vline(1, { color: 'faint' });
          sA.between((k) => 2.5 * Math.log2(k), (k) => 4 * Math.log2(k), 0.5, 3.2, { fill: 'green', fillAlpha: 0.18 });
          sA.fn((k) => 3 * Math.log2(k), { color: 'green', width: 2.6 });
          sA.fn((k) => s * Math.log2(k), { color: 'red', width: 2.2, dash: [6, 4] });
          sA.dots(xs.map((k, i) => [k, ys[i]]), { r: 5.5, color: 'red' });
          sA.text('Arrhenius 1896', 3.1, 9.3, { size: 11.5, color: 'red', align: 'right' }); sA.text('AR6: 3 K per doubling', 0.52, -4.4, { size: 11.5, color: 'green', align: 'left' });
          sA.vline(K.value, { color: 'gold', width: 2 });
          sA.dot(K.value, interp(K.value), { color: 'red', r: 6 }); sA.dot(K.value, 3 * Math.log2(K.value), { color: 'green', r: 6 });
          // ice age
          const need = (dT, per) => Math.pow(2, -dT / per);
          sB.vband(5, 7, { color: 'blue', alpha: 0.1 }); sB.text('LGM cooling 5–7 °C (AR6)', 6.95, 1.05, { size: 10.5, color: 'blue', align: 'right' });
          sB.hline(190 / 278, { color: 'ink', dash: [5, 4] }); sB.text('LGM CO₂: 190 / 278 = 0.68', 6.95, 190 / 278, { size: 10.5, color: 'ink', align: 'right', baseline: 'bottom', dy: -3 });
          sB.fn((d) => need(d, s), { color: 'red', width: 2.4, domain: [1, 7] });
          sB.fn((d) => need(d, 3), { color: 'green', width: 2.4, domain: [1, 7] });
          sB.vline(cool.value, { color: 'gold', dash: [4, 4] });
          sB.dot(cool.value, need(cool.value, s), { color: 'red', r: 6, label: fx(v, need(cool.value, s), 2), labelPos: 'ne' }); sB.dot(cool.value, need(cool.value, 3), { color: 'green', r: 6, label: fx(v, need(cool.value, 3), 2), labelPos: 'sw' });
          R = { a: interp(K.value), m: 3 * Math.log2(K.value), mlo: 2.5 * Math.log2(K.value), mhi: 4 * Math.log2(K.value), s, lgm: 3 * Math.log2(190 / 278) };
        });
        v.legend([['red', 'Arrhenius (his table, and log fit)'], ['green', 'AR6 best estimate ± likely range']]);
        v.readout(() => R && String.raw`CO₂ ×${fx(v, K.value, 2)}: Arrhenius **${fx(v, R.a, 1)} °C**, AR6 best estimate **${fx(v, R.m, 1)} °C** (likely ${fx(v, Math.min(R.mlo, R.mhi), 1)} to ${fx(v, Math.max(R.mlo, R.mhi), 1)}) · his rule fits ${fx(v, R.s, 1)} °C per doubling, about ${fx(v, R.s / 3, 1)} times today's 3 · for the glacial CO₂ of 190 ppm (×0.68) the same 3 K per doubling gives ${fx(v, R.lgm, 1)} °C from CO₂ alone, against 5–7 °C observed, the rest coming from ice sheets, other gases and further feedbacks`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Phenomenon',
      name: 'Volcanic cooling: Pinatubo as a test of sensitivity',
      credit: 'Mount Pinatubo eruption, 15 June 1991; sensitivity tests e.g. Soden et al., Science 2002; AR6 WG1 §7.3.4.6 and §7.5.4.1',
      statement: String.raw`The climactic eruption of Mount Pinatubo on 15 June 1991 put roughly 15–20 million tonnes of sulphur dioxide into the stratosphere, where it became a sulphate aerosol veil that spread around the world and scattered sunlight for about two years. The aerosol optical depth rose to around 0.1–0.15 globally, and with an effective radiative forcing of about $-20\pm5$ W m⁻² per unit optical depth (AR6) the global forcing reached a few watts per square metre negative. The lower atmosphere cooled by roughly half a kelvin in 1991–93 before recovering as the aerosol fell out, with an e-folding time of about a year. Because the cause is known and sudden, the cooling can be compared with model response, but the amplitude constrains the climate sensitivity only weakly.`,
      idea: String.raw`A short forcing pulse produces a short temperature pulse: the surface layer, with heat capacity of a few years' worth of forcing (climate-1.9), cools within a year or two and then relaxes as the aerosol decays, long before the deep ocean or the slow feedbacks matter. The peak cooling is therefore set mainly by the forcing amplitude and the heat capacity of the layer that responds, not by the equilibrium feedback strength: the response to a short forcing depends only weakly on the feedbacks, so Pinatubo cannot discriminate well between a sensitivity of 2 K and one of 5 K. Studies using it find values consistent with the other lines of evidence, and some point to water vapour as the amplifier of the observed cooling.`,
      caption: String.raw`Left: the aerosol optical depth (assumed shape: a rise to the peak then an exponential decay) and the forcing it produces. Middle: the global cooling of the two-layer ocean model for your ECS, with the other ECS values faint. Right: peak cooling against ECS, which is nearly flat; the band is the roughly 0.4–0.6 K cooling quoted in the literature. Slide the optical depth, forcing efficiency and mixed-layer depth: they move the answer far more than ECS does.`,
      deps: ['climate-3.2', 'climate-1.9', 'climate-3.5'],
      refs: ['IPCC AR6 WG1 ch. 7'],
      tags: ['volcanoes', 'aerosols', 'sensitivity'],
      verify: true,
      scope: String.raw`Verified from AR6 §7.3.4.6: ERF −20 ± 5 W m⁻² per unit stratospheric aerosol optical depth, and §7.5.2.4: the temperature response to volcanic eruptions depends only weakly on radiative feedbacks, so it is not a direct estimate of ECS. The peak global optical depth (about 0.1–0.15; sources differ), the cooling of about 0.5 K (a lower-troposphere satellite value after removing ENSO; other estimates range about 0.4–0.6 K), the e-folding time of about 12 months, and the rise time to the peak (assumed here as 5 months) were taken from several secondary sources, not from the original datasets, so they are marked as to be verified; the page shows a model, not the observed temperature series. The model is global-mean, linear, with generic two-layer ocean parameters; with the default mixed-layer capacity it cools by about 0.3 K at around two years, less and later than the roughly 0.5 K seen about a year after the eruption in the lower troposphere, because land and air respond faster than a 60 m ocean layer. Reduce the capacity slider to see the amplitude and timing move toward the observations; we did not tune the default to match.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/1991_eruption_of_Mount_Pinatubo' },
      viz(v) {
        const aod = v.slider('peak optical depth', 0.05, 0.3, 0.15, { step: 0.005 });
        const eff = v.slider('forcing per unit optical depth (W/m²)', -30, -10, -20, { step: 0.5 });
        const ecs = v.slider('ECS (K)', 1.5, 6, 3, { step: 0.05 });
        const Cm = v.slider('mixed-layer capacity $C$', 3, 20, 8, { step: 0.1 });
        const sA = v.stage({ x: [-0.25, 6], y: [-4.2, 0.3], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 250, xlabel: 'years after 15 June 1991', ylabel: 'forcing (W/m²)', title: 'aerosol forcing' });
        const sB = v.stage({ x: [-0.25, 6], y: [-1.1, 0.15], axes: 'box', gutter: true, height: 320, weight: 1.1, minWidth: 260, xlabel: 'years after 15 June 1991', ylabel: 'global cooling (K)', title: 'model response' });
        const sC = v.stage({ x: [1, 8], y: [0, 1.0], axes: 'box', gutter: true, height: 320, weight: 0.9, minWidth: 240, xlabel: 'ECS (K)', ylabel: 'peak cooling (K)', title: 'how much it depends on ECS' });
        const tp = 0.42, tau = 1.0; // assumed rise time (yr), e-folding decay (yr)
        const saod = (t) => (t <= 0 ? 0 : t < tp ? aod.value * (2 * (t / tp) - (t / tp) ** 2) : aod.value * Math.exp(-(t - tp) / tau));
        const run = (e, o = {}) => twoBox((t) => eff.value * saod(t), F2X / e, { C: Cm.value, Cd: 100, gam: 0.7, ...o }, 8, 0.05);
        const peak = (s) => { let m = 0, tm = 0; for (let i = 0; i < s.T.length; i++) if (s.T[i] < m) { m = s.T[i]; tm = s.t[i]; } return [m, tm]; };
        let R = null;
        v.render(() => {
          const ts = Array.from({ length: 121 }, (_, i) => -0.25 + (i * 6.25) / 120);
          sA.hline(0, { color: 'faint' });
          sA.path(ts.map((t) => [t, eff.value * saod(t)]), { color: 'red', width: 2.6 });
          sA.path(ts.map((t) => [t, (-4.2 * saod(t)) / 0.3]), { color: 'gold', width: 1.8, dash: [4, 3] });
          const fpk = eff.value * aod.value; sA.dot(tp, fpk, { color: 'red', r: 5, label: fx(v, fpk, 1) + ' W/m²', labelPos: 'se' });
          sA.text('dashed: optical depth (scale 0 to 0.3)', 5.9, -3.9, { size: 10.5, color: 'gold', align: 'right' });
          sB.hline(0, { color: 'faint' }); sB.hband(-0.6, -0.4, { color: 'green', alpha: 0.12 });
          [1.5, 6].forEach((e) => { const s = run(e); sB.path(Array.from(s.t).map((t, i) => [t, s.T[i]]).filter((_, i) => i % 2 === 0), { color: 'muted', width: 1.4, alpha: 0.6 }); });
          const s = run(ecs.value); sB.path(Array.from(s.t).map((t, i) => [t, s.T[i]]).filter((_, i) => i % 2 === 0), { color: 'accent', width: 2.8 });
          const [pk, tpk] = peak(s); sB.dot(tpk, pk, { color: 'gold', r: 6, label: fx(v, pk, 2) + ' K', labelPos: 'se' });
          sB.text('quoted 0.4–0.6 K', 5.9, -0.5, { size: 10.5, color: 'green', align: 'right', baseline: 'middle' });
          const curve = []; for (let e = 1; e <= 8.001; e += 0.35) curve.push([e, -peak(run(e))[0]]);
          sC.hband(0.4, 0.6, { color: 'green', alpha: 0.14 });
          sC.path(curve, { color: 'accent', width: 2.6 });
          sC.dot(ecs.value, -pk, { color: 'gold', r: 6 });
          sC.vband(2.5, 4, { color: 'blue', alpha: 0.1 }); sC.text('AR6 likely ECS', 3.25, 0.06, { size: 10.5, color: 'blue', align: 'center' });
          R = { fpk, pk, tpk, lo: -peak(run(1.5))[0], hi: -peak(run(6))[0] };
        });
        v.legend([['red', 'forcing'], ['accent', 'cooling for this ECS'], ['muted', 'ECS 1.5 and 6 K'], ['green', 'quoted cooling', { area: true }]]);
        v.readout(() => R && String.raw`peak forcing ${fx(v, R.fpk, 1)} W/m² → peak cooling **${fx(v, -R.pk, 2)} K** about ${fx(v, R.tpk, 1)} years after the eruption · ECS 1.5 K gives ${fx(v, R.lo, 2)} K, ECS 6 K gives ${fx(v, R.hi, 2)} K: only ${fx(v, (R.hi / R.lo - 1) * 100, 0)} % more cooling for a fourfold sensitivity, while ±25 % in optical depth shifts it by ±25 %`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Method',
      name: 'Combining lines of evidence on climate sensitivity',
      credit: 'Sherwood et al., Reviews of Geophysics 2020; IPCC AR6 WG1 §7.5.5 (2021)',
      statement: String.raw`Several independent kinds of evidence each give a probability distribution for the equilibrium climate sensitivity: **process understanding** of feedbacks, the **instrumental record** of warming and energy imbalance, **paleoclimates** such as the last glacial maximum and warm periods, and **emergent constraints** from variations in models and observations. If errors are independent, the combined likelihood is the product of the individual ones, so a value of ECS that one line cannot rule out but another makes improbable becomes improbable overall, and the combined range is narrower than any single one. The logic is Bayesian; AR6 applied it with expert judgement and gave a best estimate 3 °C, likely 2.5 to 4 °C, very likely 2 to 5 °C.`,
      idea: String.raw`It is natural to combine in feedback space: with $\Delta F_{2\times}$ fixed, ECS $=\Delta F_{2\times}/\lambda$, and each line constrains the feedback $\lambda=-\alpha$ roughly as a normal distribution (climate-3.5, process understanding gives $\alpha=-1.16\pm0.40$). Multiplying normal likelihoods gives an inverse-variance weighted mean and a narrower width; mapping back to ECS turns the symmetric distribution into the familiar skewed one with the long upper tail. If lines share errors (they use some of the same models and data) the gain shrinks, and with a common error a fraction $\rho$ of each one's variance, adding lines helps much less.`,
      caption: String.raw`Four thin curves are probability densities of ECS from the four lines, each a normal distribution in the feedback (drag the handles on the axis to move a line's centre; the widths are fixed to values chosen to resemble AR6's ranges for each line and to scale with the width slider). The thick curve is their combination. Raise the dependence $\rho$ to see the combination lose its advantage; switch lines off to see which ones carry the lower and upper ends. Below, the AR6 ranges for each line as published, with the combination from this page.`,
      deps: ['climate-3.5', 'climate-3.8'],
      refs: ['IPCC AR6 WG1 ch. 7'],
      tags: ['climate sensitivity', 'Bayesian', 'uncertainty'],
      verify: true,
      scope: String.raw`Schematic. Process understanding uses AR6's own numbers (net feedback −1.16 ± 0.40 W m⁻² K⁻¹, doubling forcing 3.93 W m⁻², which reproduce the Table 7.13 process-understanding ranges: likely 2.5 to 5.1, very likely 2.1 to 7.7). The centres and widths of the other three lines were set by us so that the curves resemble the corresponding ranges in AR6 Table 7.13 (instrumental: central 2.5–3.5, likely above 2.2; paleoclimate: central 3.3–3.4, likely below 4.5; emergent: central 2.4–3.3, very likely 1.5 to 5.0); they are not the published likelihoods, which are asymmetric and include dependencies. The AR6 combined assessment is not computed by this product (it is judgement informed by it), and AR6 notes the lines are not fully independent; the default ρ = 0 therefore gives a narrower range than AR6's.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Climate_sensitivity' },
      viz(v) {
        const LINES = [
          { n: 'process', col: 'blue', e: F2X / 1.16, sd: 0.40, on: true },
          { n: 'instrumental', col: 'orange', e: 3.0, sd: 0.50, on: true },
          { n: 'paleoclimate', col: 'green', e: 3.35, sd: 0.45, on: true },
          { n: 'emergent', col: 'purple', e: 2.8, sd: 0.56, on: true },
        ];
        const tg = LINES.map((L) => v.toggle(L.n, true));
        const rho = v.slider('shared error $\\rho$', 0, 0.7, 0, { step: 0.01 });
        const wid = v.slider('width multiplier', 0.5, 2, 1, { step: 0.01 });
        const sA = v.stage({ x: [0, 8], y: [0, 1.25], axes: 'box', gutter: true, height: 340, full: true, xlabel: 'equilibrium climate sensitivity (K)', ylabel: 'probability density', title: 'what each line says, and their combination' });
        const sB = v.stage({ x: [0, 8], y: [0, 6.6], axes: 'box', height: 300, full: true, xlabel: 'ECS (K)', ylabel: '', gutter: { l: 96, b: 40, t: 8, r: 8 }, title: 'AR6 ranges by line (likely: thick; very likely: thin) and this page', yticks: [[6, 'process'], [5, 'instrumental'], [4, 'paleoclimate'], [3, 'emergent'], [2, 'AR6 combined'], [1, 'this page']] });
        const hs = LINES.map((L) => sA.handle(L.e, 0, { color: L.col, r: 7, constrain: (x) => [clamp(x, 1.4, 7), 0] }));
        hs.forEach((h, i) => { h.onDrag = () => { LINES[i].e = h.x; v.invalidate(); }; });
        const pdf = (e, mu, sd) => (e > 0.05 ? (phi((F2X / e - mu) / sd) / sd) * (F2X / (e * e)) : 0);
        function phi(z) { return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI); }
        // quantiles of ECS from normal feedback λ ~ N(mu, sd): ECS_q = F/λ_{1-q}
        const qE = (mu, sd, q) => { const lam = mu + sd * zq(1 - q); return lam > 0.02 ? F2X / lam : Infinity; };
        function zq(p) { let lo = -8, hi = 8; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (0.5 * (1 + erf(m / Math.SQRT2)) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
        function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x < 0 ? -y : y; }
        let R = null;
        v.render(() => {
          const act = LINES.map((L, i) => ({ ...L, on: tg[i].value, mu: F2X / L.e, s: L.sd * wid.value }));
          act.forEach((L, i) => { hs[i].visible = L.on; if (!L.on) return; sA.fn((e) => pdf(e, L.mu, L.s), { color: L.col, width: 1.8, domain: [0.2, 8], n: 200 }); });
          const use = act.filter((L) => L.on);
          let comb = null;
          if (use.length) {
            const n = use.length, S = use.map((a, i) => use.map((b, j) => a.s * b.s * (i === j ? 1 : rho.value)));
            let w; try { w = v.M.solve(S, use.map(() => 1)); } catch (e) { w = use.map(() => 1 / n); }
            const tot = w.reduce((a, b) => a + b, 0), mu = use.reduce((a, L, i) => a + w[i] * L.mu, 0) / tot, sd = Math.sqrt(1 / tot);
            comb = { mu, sd };
            sA.fn((e) => pdf(e, mu, sd), { color: 'ink', width: 3.2, domain: [0.2, 8], n: 260 });
            sA.vline(F2X / mu, { color: 'ink', dash: [4, 4] });
          }
          // AR6 intervals
          const seg = (y, a, b, w, col, arrowR, arrowL) => { sB.line(a, y, b, y, { color: col, width: w }); if (arrowR) sB.arrow(b - 0.4, y, b, y, { color: col, width: w, head: 8 }); if (arrowL) sB.arrow(a + 0.4, y, a, y, { color: col, width: w, head: 8 }); };
          seg(6, 2.1, 7.7, 1.5, 'blue'); seg(6, 2.5, 5.1, 6, 'blue'); sB.dot(3.4, 6, { color: 'ink', r: 4 });
          seg(5, 1.8, 8, 1.5, 'orange', true); seg(5, 2.2, 8, 6, 'orange', true); sB.line(2.5, 4.8, 2.5, 5.2, { color: 'ink', width: 1.5 }); sB.line(3.5, 4.8, 3.5, 5.2, { color: 'ink', width: 1.5 });
          seg(4, 0, 4.5, 6, 'green', false, true); seg(4, 1.5, 8, 1.5, 'green'); sB.line(3.3, 3.8, 3.3, 4.2, { color: 'ink', width: 1.5 }); sB.line(3.4, 3.8, 3.4, 4.2, { color: 'ink', width: 1.5 });
          seg(3, 1.5, 5.0, 1.5, 'purple'); sB.line(2.4, 2.8, 2.4, 3.2, { color: 'ink', width: 1.5 }); sB.line(3.3, 2.8, 3.3, 3.2, { color: 'ink', width: 1.5 });
          seg(2, 2.0, 5.0, 1.5, 'ink'); seg(2, 2.5, 4.0, 6, 'ink'); sB.dot(3, 2, { color: 'panel', r: 4, hollow: true });
          let lik = null, vl = null;
          if (comb) { lik = [qE(comb.mu, comb.sd, 0.17), qE(comb.mu, comb.sd, 0.83)]; vl = [qE(comb.mu, comb.sd, 0.05), qE(comb.mu, comb.sd, 0.95)]; const c8 = (x) => Math.min(8, x); seg(1, c8(vl[0]), c8(vl[1]), 1.5, 'red'); seg(1, c8(lik[0]), c8(lik[1]), 6, 'red'); sB.dot(F2X / comb.mu, 1, { color: 'panel', r: 4, hollow: true }); }
          sB.text('dots / ticks: central value or central range', 7.9, 0.2, { size: 10.5, color: 'muted', align: 'right' });
          R = { comb, lik, vl, n: use.length };
        });
        v.legend([['blue', 'process'], ['orange', 'instrumental'], ['green', 'paleoclimate'], ['purple', 'emergent'], ['ink', 'combination (thick)'], ['red', 'this page: likely (17–83 %) and very likely (5–95 %)']]);
        v.readout(() => R && (R.comb ? String.raw`${R.n} line(s), shared error ρ = ${fx(v, rho.value, 2)}: combined feedback ${fx(v, R.comb.mu, 2)} ± ${fx(v, R.comb.sd, 2)} W m⁻² K⁻¹ → ECS **${fx(v, F2X / R.comb.mu, 2)} K**, likely ${fx(v, R.lik[0], 1)} to ${fx(v, R.lik[1], 1)}, very likely ${fx(v, R.vl[0], 1)} to ${R.vl[1] === Infinity ? '∞' : fx(v, R.vl[1], 1)} · AR6: 3 K, likely 2.5–4, very likely 2–5 · process alone: 3.4 K, likely 2.5–5.1` : 'switch on at least one line'));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Phenomenon',
      name: 'Aerosol–cloud interactions (Twomey effect)',
      credit: 'Sean Twomey, 1974 (Atmospheric Environment 8: 1251) and 1977 (J. Atmos. Sci. 34: 1149); ship tracks from satellite images, Conover 1966 (J. Atmos. Sci. 23: 778)',
      statement: String.raw`For a cloud of fixed liquid water, adding aerosol particles that serve as cloud condensation nuclei increases the number $N$ of droplets and shrinks each one: with the water divided among more drops, the effective radius scales as $r_e\propto N^{-1/3}$, and the optical depth $\tau\propto N^{1/3}$ grows. A brighter cloud reflects more sunlight; for a non-absorbing cloud the albedo is approximately $A\approx (1-g)\tau/[2+(1-g)\tau]$ with asymmetry parameter $g\approx 0.85$, and $\mathrm{d}A/\mathrm{d}\ln N=A(1-A)/3$, greatest for clouds of albedo near one half. This is the **Twomey effect**, one part of the aerosol–cloud forcing that AR6 assesses at $-0.84$ [$-1.45$ to $-0.25$] W m⁻² for 1750–2019, together with adjustments of cloud water and cover.`,
      idea: String.raw`Mie scattering by droplets (climate-1.11) is efficient at visible wavelengths, so cloud optical depth is proportional to the total droplet cross-section per unit area, $\tau=3\,\mathrm{LWP}/(2\rho_w r_e)$. At fixed liquid water path (LWP) more, smaller drops expose more surface; the rise in $\tau$ with $N^{1/3}$ gives the brightening. The factor $A(1-A)$ explains why thin clouds and the dim oceanic low clouds are sensitive and why very thick or very thin ones are not. Tracks of bright cloud behind ships, visible in satellite images, show the effect directly: the particles in the ship's exhaust raise $N$ along a line.`,
      caption: String.raw`Set the liquid water path and the droplet number. Left: a cross-section of the cloud's droplets (drawn with their relative size and count). Middle: albedo against droplet number, from the two-stream formula (curve) and from a Monte Carlo of 1500 photons through the same cloud (dot with error bar). Right: a satellite-style view of a cloud deck with a ship track where the droplet number is raised from the clean value to the polluted value.`,
      deps: ['climate-3.2', 'climate-1.11'],
      refs: ['IPCC AR6 WG1 ch. 7'],
      tags: ['aerosols', 'clouds', 'albedo'],
      verify: true,
      scope: String.raw`Single non-absorbing liquid layer at fixed liquid water path, $g=0.85$, normal incidence; the two-stream albedo formula is approximate (the Monte Carlo shows how closely). The forcing readout multiplies the albedo change by the global-mean insolation 340 W m⁻² and an area fraction that is a free parameter (it is not an observation), ignoring absorption above the cloud, changes in cloud water or cover (the adjustments AR6 includes in its aerosol–cloud ERF) and the day–night and latitude weighting; it shows the scaling, not an estimate. The ship-track image is a schematic; the Conover 1966 paper is cited for the observation of the anomalous cloud lines, whose attribution to ships was made later. Reference title and journal details of Twomey (1974, 1977) and Conover (1966) were confirmed in Crossref; the quoted AR6 value is from Table 7.8.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cloud_condensation_nuclei' },
      viz(v) {
        const lwp = v.slider('liquid water path (g/m²)', 20, 300, 100, { log: true, sig: 2 });
        const N0 = v.slider('clean droplet number $N_1$ (cm⁻³)', 20, 400, 50, { log: true, sig: 2 });
        const N1 = v.slider('polluted droplet number $N_2$ (cm⁻³)', 20, 1000, 120, { log: true, sig: 2 });
        const frac = v.slider('area fraction affected', 0.01, 0.3, 0.05, { step: 0.005 });
        const G = 0.85, H = 300; // asymmetry parameter, cloud depth (m): only enters through the droplet size picture
        const tauOf = (N, w) => { const lwc = (w * 1e-3) / H, r = Math.cbrt((3 * lwc) / (4 * Math.PI * 1000 * N * 1e6)); return (3 * w * 1e-3) / (2 * 1000 * r); };
        const albOf = (t) => ((1 - G) * t) / (2 + (1 - G) * t);
        const rOf = (N, w) => { const lwc = (w * 1e-3) / H; return Math.cbrt((3 * lwc) / (4 * Math.PI * 1000 * N * 1e6)) * 1e6; };
        const mcCache = new Map();
        function mc(tau) {
          const key = tau.toFixed(1); if (mcCache.has(key)) return mcCache.get(key);
          const r = v.rng(11); let refl = 0; const n = 1500;
          for (let p = 0; p < n; p++) {
            let z = 0, mu = 1;
            for (let k = 0; k < 4000; k++) {
              z += mu * -Math.log(1 - r()) ; if (z < 0) { refl++; break; } if (z > tau) break;
              const u = r(), t = (1 - G * G) / (1 - G + 2 * G * u), ms = (1 + G * G - t * t) / (2 * G), ph = 2 * Math.PI * r();
              mu = mu * ms - Math.sqrt(Math.max(0, 1 - mu * mu)) * Math.sqrt(Math.max(0, 1 - ms * ms)) * Math.cos(ph);
              if (mu > 1) mu = 1; if (mu < -1) mu = -1;
            }
          }
          const a = refl / n, res = [a, Math.sqrt((a * (1 - a)) / n)]; mcCache.set(key, res); return res;
        }
        const sA = v.stage({ x: [0, 10], y: [0, 10], equal: true, axes: false, height: 300, weight: 0.8, minWidth: 220, title: 'droplets (schematic cross-section)' });
        const sB = v.stage({ x: [10, 1000], xlog: true, y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xlabel: 'droplet number $N$ (cm⁻³)', ylabel: 'cloud albedo', title: 'albedo against droplet number' });
        const sC = v.stage({ x: [0, 10], y: [0, 10], equal: true, axes: false, height: 300, weight: 0.9, minWidth: 230, title: 'cloud deck from above, with a ship track' });
        const rng = v.rng(5), pts = Array.from({ length: 260 }, () => [0.3 + 9.4 * rng(), 0.3 + 9.4 * rng()]);
        const noise = (x, y) => 0.5 + 0.25 * Math.sin(1.7 * x + 0.8 * Math.sin(2.1 * y)) + 0.25 * Math.sin(2.9 * y - 1.3 * Math.sin(1.1 * x));
        let R = null;
        v.render(() => {
          const t1 = tauOf(N0.value, lwp.value), t2 = tauOf(N1.value, lwp.value), A1 = albOf(t1), A2 = albOf(t2);
          // droplets: count ∝ N, radius from the physical law (same scale for both, in data units 1 unit = 5 µm... capped)
          const n = Math.round(Math.min(260, N1.value / 4)), rr = rOf(N1.value, lwp.value) * 0.07;
          for (let i = 0; i < n; i++) sA.circle(pts[i][0], pts[i][1], rr, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 1 });
          sA.text(`N = ${fx(v, N1.value, 0)} cm⁻³, drop radius ${fx(v, rOf(N1.value, lwp.value), 1)} µm`, 5, 9.7, { size: 11.5, color: 'ink', align: 'center', baseline: 'top', plate: true });
          sA.text('(drops shown with their relative size; count scaled)', 5, 0.15, { size: 10, color: 'muted', align: 'center', baseline: 'bottom' });
          // albedo curve
          sB.fn((N) => albOf(tauOf(N, lwp.value)), { color: 'accent', width: 2.6, n: 80 });
          sB.fn((N) => albOf(tauOf(N, lwp.value)) * (1 - albOf(tauOf(N, lwp.value))), { color: 'faint', width: 1.4, dash: [4, 4], n: 80 });
          const m1 = mc(t1), m2 = mc(t2);
          [[N0.value, A1, m1, 'blue'], [N1.value, A2, m2, 'red']].forEach(([N, A, m, col]) => { sB.dot(N, A, { color: col, r: 6 }); sB.dot(N, m[0], { color: col, r: 4, hollow: true }); sB.line(N, m[0] - m[1], N, m[0] + m[1], { color: col, width: 1.6 }); });
          sB.text('dashed: A(1−A) = 3 dA/d ln N', 900, 0.08, { size: 10, color: 'muted', align: 'right' });
          // ship track
          const wk = 0.45;
          sC.raster((x, y) => {
            const d = Math.abs((y - (2 + 0.55 * x)) / Math.sqrt(1 + 0.55 * 0.55)), k = Math.exp(-(d * d) / (2 * wk * wk)) * (x < 0.5 ? x / 0.5 : 1);
            const lN = Math.log(N0.value) + k * (Math.log(N1.value) - Math.log(N0.value)), t = tauOf(Math.exp(lN), lwp.value * (0.82 + 0.36 * noise(x, y)));
            return v.ramp(clamp((albOf(t) - 0.3) / 0.4, 0, 1), 'accent', 'panel');
          }, { res: 4, key: `${N0.value.toFixed(1)}|${N1.value.toFixed(1)}|${lwp.value.toFixed(1)}` });
          sC.colorbar([0.3, 0.7], (t) => v.ramp(t, 'accent', 'panel'), { pos: 'left', label: 'albedo' });
          sC.text('track of raised droplet number', 9.8, 8.0, { size: 10.5, color: 'ink', align: 'right', plate: true });
          const dA = A2 - A1, forcing = -340 * frac.value * dA;
          R = { t1, t2, A1, A2, dA, forcing, sus: (A1 * (1 - A1)) / 3, m1, m2 };
        });
        v.legend([['blue', 'clean $N_1$', { dot: true }], ['red', 'polluted $N_2$', { dot: true }], ['accent', 'two-stream albedo']]);
        v.readout(() => R && String.raw`τ = ${fx(v, R.t1, 1)} → ${fx(v, R.t2, 1)}; albedo ${fx(v, R.A1, 3)} → ${fx(v, R.A2, 3)} (Monte Carlo ${fx(v, R.m1[0], 3)} ± ${fx(v, R.m1[1], 3)} → ${fx(v, R.m2[0], 3)} ± ${fx(v, R.m2[1], 3)}) · susceptibility A(1−A)/3 = ${fx(v, R.sus, 3)} · for ${fx(v, frac.value * 100, 1)} % of the Earth's area: forcing ≈ **${fx(v, R.forcing, 2)} W/m²** (AR6 aerosol–cloud ERF 1750–2019: −0.84, −1.45 to −0.25, which includes adjustments)`);
      },
    },
//@@B
  ],
};
