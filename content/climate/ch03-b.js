// Climate Science — Chapter 3 (part b): transient response, Arrhenius, Pinatubo, evidence synthesis, aerosol–cloud interactions
import { F2X, fx, twoBox, at } from './ch03.shared.js';

import { pulseAOD, pulseResponse, droplet, photonCloud } from './climate-source-audit-forcing.js';

import { positiveFeedbackLaw, combineFeedback } from './climate-source-audit-inference.js';

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
      idea: String.raw`Split the response into a fast part and a slow part. The land, atmosphere and upper ocean (a layer of order a hundred metres) respond within a few years, so the surface temperature tracks the forcing, but warm surface water mixes down and exchanges heat with the deep ocean, whose large heat capacity delays full warming for centuries. A fraction $\kappa$ of each extra watt is thus carried away, and in steady ramp $\mathrm{TCR}\approx \Delta F_{2\times}/(-\alpha+\kappa)$ whereas $\mathrm{ECS}=\Delta F_{2\times}/(-\alpha)$; the ratio $\mathrm{TCR}/\mathrm{ECS}=(-\alpha)/(-\alpha+\kappa)$ is below one by the strength of ocean heat uptake. This is the thermal inertia of climate-1.9 turned into a number. For $C,C_d,\lambda=-\alpha,\gamma>0$, the two-box homogeneous matrix has diagonal entries $-(\lambda+\gamma)/C,-\gamma/C_d$ and off-diagonal entries $\gamma/C,\gamma/C_d$. Its trace is negative, determinant $\lambda\gamma/(CC_d)>0$, and discriminant is a squared diagonal difference plus $4\gamma^2/(CC_d)>0$. Thus two distinct negative eigenvalues give two decaying modes by ode 3.5, supplying the fast/slow relaxation behind the delayed ramp response. This mode analysis does not identify the parameters from observations or replace the stated forcing scenario.`,
      caption: String.raw`CO₂ rises 1 % a year. The blue line is the warming of a two-layer ocean model; the dashed line is what the surface would reach if it stayed in equilibrium with the current forcing; the horizontal line is ECS. Slide the heat-uptake coefficient $\gamma$ to zero and the transient warming approaches the equilibrium value; increase it and the gap opens. The gold bar at year 70 is AR6's likely range for TCR; the right panel shows how TCR/ECS depends on $\gamma$.`,
      deps: ['climate-3.5', 'climate-1.9', 'ode-3.5'],
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
      credit: 'B. J. Soden et al., Science 296 (2002), 727–730; AR6 WG1 (2021), §§7.3.4.6 and7.5.2.4',
      statement: String.raw`The June 1991 Mount Pinatubo eruption produced stratospheric sulphate aerosols that reduced solar heating. AR6 assesses volcanic effective radiative forcing at $-20\pm5$ W m⁻² per unit stratospheric aerosol optical depth. Soden et al. (2002, p.728 and Fig.2) report approximately 0.5 K global **lower-troposphere** cooling, peaking nearly 18 months after the eruption in their satellite record, with atmospheric drying approximately conserving relative humidity. That observation tests model water-vapour feedback; the short pulse only weakly constrains equilibrium climate sensitivity.`,
      idea: String.raw`In a two-box surface/deep-ocean model, $C\dot T=F(t)-\lambda T-\gamma(T-T_d)$ and $C_d\dot T_d=\gamma(T-T_d)$. A short negative forcing pulse depends strongly on the responding heat capacity and forcing history, while slower equilibrium differences are less developed. Soden et al. compared an atmospheric GCM with and without longwave water-vapour feedback, not this two-box emulator. Their paper explicitly cautions that volcanic forcing is not a perfect proxy for greenhouse warming; AR6 §7.5.2.4 likewise says volcanic response is not a direct estimate of ECS.`,
      caption: String.raw`The chosen optical-depth pulse rises over 0.42 years and decays with a one-year e-folding time; these are **illustrative parameters**, not a digitized aerosol dataset. Left: forcing and optical depth (the latter plotted on a labelled rescaled axis). Middle: model **surface** cooling over eight years, including two reference ECS choices. Right: computed peak surface cooling versus ECS. Change optical depth, forcing efficiency, ECS and heat capacity. No observed lower-troposphere band is overlaid on this different model variable.`,
      deps: ['climate-3.2', 'climate-1.9', 'climate-3.5'],
      refs: ['IPCC AR6 WG1 ch. 7'],
      tags: ['volcanoes', 'aerosols', 'sensitivity'],
      verify: false,
      scope: String.raw`Linear global-mean two-box demonstration, not the Soden GCM or observed temperature series. Chosen $C_d=100$ W yr m⁻² K⁻¹ and $\gamma=0.7$ W m⁻² K⁻¹; the surface capacity is a slider. RK4 integration uses a 0.02-year step; the peak is resolved on that time grid. Aerosol peak and time profile are chosen and are not estimates of Pinatubo's observed optical depth. Primary evidence: [Soden et al. 2002, pp.727–730](https://climate.envsci.rutgers.edu/pdf/SodenPinatubo.pdf); [AR6 §§7.3.4.6 and7.5.2.4](https://www.ipcc.ch/report/ar6/wg1/downloads/report/IPCC_AR6_WGI_Chapter07.pdf).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/1991_eruption_of_Mount_Pinatubo' },
      viz(v) {
        const aod=v.slider('chosen peak optical depth',.05,.3,.15,{step:.005}),eff=v.slider('forcing per optical depth (W/m²)',-30,-10,-20,{step:.5}),ecs=v.slider('ECS (K)',1.5,6,3,{step:.05}),Cm=v.slider('surface capacity (W yr/m²/K)',3,20,8,{step:.1});
        const sA=v.stage({x:[-.25,8.25],y:[-10,.5],axes:'box',gutter:true,height:320,weight:1,minWidth:250,xlabel:'years after illustrative pulse begins',ylabel:'forcing (W/m²)',title:'chosen aerosol forcing'});
        const sB=v.stage({x:[-.25,8.25],y:[-2,.2],axes:'box',gutter:true,height:320,weight:1.1,minWidth:260,xlabel:'years',ylabel:'model surface change (K)',title:'two-box surface response'});
        const sC=v.stage({x:[.7,8.3],y:[-.05,1],axes:'box',gutter:true,height:320,weight:.9,minWidth:240,xlabel:'ECS (K)',ylabel:'peak surface cooling (K)',title:'model dependence on ECS'});
        let R=null,key='',cache=null;
        v.render(()=>{
          const next=[aod.value,eff.value,ecs.value,Cm.value].join('|');if(next!==key){key=next;const run=e=>pulseResponse(e,aod.value,eff.value,Cm.value),current=run(ecs.value),lo=run(1.5),hi=run(6),curve=Array.from({length:29},(_,j)=>{const e=1+j/4;return[e,-run(e).peak];});cache={current,lo,hi,curve};}
          const{current,lo,hi,curve}=cache,fpk=eff.value*aod.value;
          sA.setView([-.25,8.25],[Math.min(-4.5,fpk*1.18),.4]);sA.fn(t=>eff.value*pulseAOD(t,aod.value),{domain:[0,8],color:'red',width:2.6,n:240});sA.fn(t=>-14*pulseAOD(t,aod.value),{domain:[0,8],color:'gold',dash:true,n:240});sA.corner('gold: AOD × −14 W/m²','br',{size:10,color:'gold'});sA.dot(.42,fpk,{color:'red',r:5});
          const bottom=Math.min(current.peak,lo.peak,hi.peak);sB.setView([-.25,8.25],[bottom*1.2,.08]);sB.hline(0,{color:'faint'});for(const model of[lo,hi,current])sB.path(Array.from(model.t,(t,j)=>[t,model.T[j]]),{color:model===current?'accent':'muted',width:model===current?2.8:1.4});sB.dot(current.time,current.peak,{color:'gold',r:5});
          sC.setView([.7,8.3],[-.03,Math.max(...curve.map(p=>p[1]))*1.2]);sC.path(curve,{color:'accent',width:2.6});sC.dot(ecs.value,-current.peak,{color:'gold',r:5});sC.vband(2.5,4,{color:'blue',alpha:.1});
          R={fpk,pk:current.peak,tpk:current.time,lo:-lo.peak,hi:-hi.peak,C:Cm.value,ecs:ecs.value,aod:aod.value,eff:eff.value};
        });
        v.legend([['red','forcing'],['gold','rescaled AOD / selected peak'],['accent','selected surface response'],['muted','ECS 1.5 and 6 K']]);
        v.readout(()=>`Chosen peak forcing ${fx(v,R.fpk,2)} W/m² → peak model surface cooling ${fx(v,-R.pk,3)} K at ${fx(v,R.tpk,2)} years. ECS 1.5 gives ${fx(v,R.lo,3)} K; ECS 6 gives ${fx(v,R.hi,3)} K. Soden's≈0.5 K at≈18 months is a lower-troposphere satellite result, a different measured variable.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Method',
      name: 'Combining lines of evidence on climate sensitivity',
      credit: 'IPCC AR6 WG1 (2021), §7.5.5 and Table 7.13; explicitly schematic Gaussian likelihood model',
      statement: String.raw`Process understanding, the instrumental record, paleoclimate evidence and emergent constraints all inform equilibrium climate sensitivity. Independent **likelihoods** multiply with a prior applied once; normalized posterior densities cannot generally be multiplied without correcting for repeated priors. For Gaussian likelihoods in restoring feedback $\lambda$ and a flat prior restricted to $\lambda>0$, the combined Gaussian is conditioned on positive feedback before mapping $ECS=F_{2\times}/\lambda$. AR6's expert synthesis assesses ECS at 3°C, likely 2.5–4°C and very likely 2–5°C; it is not the product drawn here.`,
      idea: String.raw`For independent Gaussian feedback estimates, precisions add: $s^{-2}=\sum_i s_i^{-2}$ and $\mu=s^2\sum_i\mu_i/s_i^2$. With correlated errors, replace these sums by $\mathbf1^T\Sigma^{-1}\mathbf1$ and $\mathbf1^T\Sigma^{-1}\boldsymbol\mu$. The page chooses $\Sigma_{ij}=s_i s_j[(1-\rho)\delta_{ij}+\rho]$. For $\lambda\sim N(\mu,s^2)$ conditioned on $\lambda>0$, divide the transformed ECS density by $Z=\Phi(\mu/s)$; its CDF is $\Phi[(\mu-F/E)/s]/Z$. The intervals shown are quantiles of this positive branch, not quantiles of an untruncated Gaussian. Correlation changes precision and can produce negative statistical weights when widths differ; it does not justify a universal claim about every ECS interval narrowing. For evidence streams independent conditional on a fixed feedback value, the product rule prob 2.1.1a factors their joint likelihood, with the prior applied once. At zero error correlation, the normal density in prob 1.2.5 makes the log likelihood a sum of terms $-(\lambda-\mu_i)^2/(2s_i^2)$. Completing the square gives the stated precision-weighted centre and width before restricting to $\lambda>0$. With nonzero correlation the joint covariance form replaces this product; sharing evidence does not become independence merely by naming separate lines. These are the chosen Gaussian likelihood calculations, not a reproduction of AR6's expert synthesis.`,
      caption: String.raw`Drag each line's coloured handle below the axis to change its chosen centre, toggle lines, and vary width and correlation. Each thin curve is an individual normalized positive-branch density; black is the combined likelihood with one shared flat positive-feedback prior. The plot shows only ECS 0–8K; off-screen density remains part of the normalization. The range panel marks off-screen bounds with arrows and reports actual conditional intervals below. AR6 ranges are separately transcribed from Table 7.13, including one-sided limits; they are not fit targets or outputs of the model.`,
      deps: ['climate-3.5', 'climate-3.8', 'prob-2.1.1a', 'prob-1.2.5'],
      refs: ['IPCC AR6 WG1 ch. 7'],
      tags: ['climate sensitivity', 'Bayesian', 'uncertainty'],
      verify: false,
      scope: String.raw`Chosen Gaussian feedback centres/widths and equicorrelated errors, not published likelihoods or an inference from observed datasets. The process centre1.16 and width0.40 resemble the assessed process line; the other widths/centres are illustrative. A flat prior in feedback is not flat in ECS. All densities and intervals condition on positive restoring feedback. AR6 §7.5.5 explicitly discusses dependencies and expert judgement; Table 7.13 includes paleoclimate likely<4.5, verylikely>1.5 and extremelylikely<8K (the last is not mislabelled as a two-sided very-likely interval). [Primary assessment](https://www.ipcc.ch/report/ar6/wg1/downloads/report/IPCC_AR6_WGI_Chapter07.pdf).`,
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
        const hs = LINES.map((L,i) => sA.handle(L.e, 0, { color: L.col, r: 7, constrain: (x) => [clamp(x,1.4,7),hs[i].y] }));
        hs.forEach((h, i) => { h.onDrag = () => { LINES[i].e = h.x; v.invalidate(); }; });
        const pdf=(e,mu,sd)=>positiveFeedbackLaw(mu,sd).density(e),qE=(mu,sd,q)=>positiveFeedbackLaw(mu,sd).quantile(q);
        let R = null;
        v.render(() => {
          const act = LINES.map((L, i) => ({ ...L, on: tg[i].value, mu: F2X / L.e, s: L.sd * wid.value }));
          const use=act.filter(L=>L.on),comb=combineFeedback(use,rho.value),grid=Array.from({length:801},(_,j)=>.05+j*7.95/800),top=Math.max(.2,...act.filter(L=>L.on).flatMap(L=>grid.map(e=>pdf(e,L.mu,L.s))),...(comb?grid.map(e=>comb.density(e)):[]));sA.setView([0,8],[-.3*top,1.16*top]);
          act.forEach((L,i)=>{hs[i].visible=L.on;hs[i].y=-(i+1)*.06*top;if(L.on)sA.fn(e=>pdf(e,L.mu,L.s),{color:L.col,width:1.8,domain:[.05,8],n:600});});
          if(comb){sA.fn(comb.density,{color:'ink',width:3.2,domain:[.05,8],n:800});const median=comb.quantile(.5);if(median<8)sA.vline(median,{color:'ink',dash:[4,4]});}
          // AR6 intervals
          const seg = (y, a, b, w, col, arrowR, arrowL) => { sB.line(a, y, b, y, { color: col, width: w }); if (arrowR) sB.arrow(b - 0.4, y, b, y, { color: col, width: w, head: 8 }); if (arrowL) sB.arrow(a + 0.4, y, a, y, { color: col, width: w, head: 8 }); };
          seg(6, 2.1, 7.7, 1.5, 'blue'); seg(6, 2.5, 5.1, 6, 'blue'); sB.dot(3.4, 6, { color: 'ink', r: 4 });
          seg(5, 1.8, 8, 1.5, 'orange', true); seg(5, 2.2, 8, 6, 'orange', true); sB.line(2.5, 4.8, 2.5, 5.2, { color: 'ink', width: 1.5 }); sB.line(3.5, 4.8, 3.5, 5.2, { color: 'ink', width: 1.5 });
          seg(4, 0, 4.5, 6, 'green', false, true); seg(4,1.5,8,1.5,'green',true); sB.line(3.3, 3.8, 3.3, 4.2, { color: 'ink', width: 1.5 }); sB.line(3.4, 3.8, 3.4, 4.2, { color: 'ink', width: 1.5 });
          seg(3, 1.5, 5.0, 1.5, 'purple'); sB.line(2.4, 2.8, 2.4, 3.2, { color: 'ink', width: 1.5 }); sB.line(3.3, 2.8, 3.3, 3.2, { color: 'ink', width: 1.5 });
          seg(2, 2.0, 5.0, 1.5, 'ink'); seg(2, 2.5, 4.0, 6, 'ink'); sB.dot(3, 2, { color: 'panel', r: 4, hollow: true });
          let lik = null, vl = null;
          if (comb) { lik = [qE(comb.mu, comb.sd, 0.17), qE(comb.mu, comb.sd, 0.83)]; vl = [qE(comb.mu, comb.sd, 0.05), qE(comb.mu, comb.sd, 0.95)]; const c8 = (x) => Math.min(8, x); seg(1,c8(vl[0]),c8(vl[1]),1.5,'red',vl[1]>8);seg(1,c8(lik[0]),c8(lik[1]),6,'red',lik[1]>8);const median=comb.quantile(.5);if(median<7.9)sB.dot(median,1,{color:'panel',r:4,hollow:true}); }
          sB.text('dots / ticks: central value or central range', 7.9, 0.2, { size: 10.5, color: 'muted', align: 'right' });
          R={comb:comb?{mu:comb.mu,sd:comb.sd,Z:comb.Z,weights:comb.weights}:null,lik,vl,n:use.length};
        });
        v.legend([['blue', 'process'], ['orange', 'instrumental'], ['green', 'paleoclimate'], ['purple', 'emergent'], ['ink', 'combination (thick)'], ['red', 'this page: likely (17–83 %) and very likely (5–95 %)']]);
        v.readout(() => R && (R.comb ? String.raw`${R.n} line(s), shared error ρ = ${fx(v, rho.value, 2)}: combined feedback ${fx(v, R.comb.mu, 2)} ± ${fx(v, R.comb.sd, 2)} W m⁻² K⁻¹ → conditional ECS median **${fx(v,qE(R.comb.mu,R.comb.sd,.5),2)} K**, likely ${fx(v, R.lik[0], 1)} to ${fx(v, R.lik[1], 1)}, very likely ${fx(v, R.vl[0], 1)} to ${R.vl[1] === Infinity ? '∞' : fx(v, R.vl[1], 1)} · AR6: 3 K, likely 2.5–4, very likely 2–5 · AR6 process alone: 3.4 K, likely 2.5–5.1` : 'switch on at least one line'));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Phenomenon',
      name: 'Aerosol–cloud interactions (Twomey effect)',
      credit: 'S. Twomey, The Influence of Pollution on the Shortwave Albedo of Clouds, J. Atmospheric Sciences 34 (1977), 1149–1152, §§2–4; nonabsorbing illustrative limit',
      statement: String.raw`For a cloud of fixed liquid water, adding aerosol particles that serve as cloud condensation nuclei increases the number $N$ of droplets and shrinks each one: with the water divided among more drops, the effective radius scales as $r_e\propto N^{-1/3}$, and the optical depth $\tau\propto N^{1/3}$ grows. A brighter cloud reflects more sunlight; for a non-absorbing cloud the albedo is approximately $A\approx (1-g)\tau/[2+(1-g)\tau]$ with asymmetry parameter $g\approx 0.85$, and $\mathrm{d}A/\mathrm{d}\ln N=A(1-A)/3$, greatest for clouds of albedo near one half. This is the **Twomey effect**, one part of the aerosol–cloud forcing that AR6 assesses at $-0.84$ [$-1.45$ to $-0.25$] W m⁻² for 1750–2019, together with adjustments of cloud water and cover.`,
      idea: String.raw`Mie scattering by droplets (climate-1.11) is efficient at visible wavelengths, so cloud optical depth is proportional to the total droplet cross-section per unit area, $\tau=3\,\mathrm{LWP}/(2\rho_w r_e)$. At fixed liquid water path (LWP) more, smaller drops expose more surface; the rise in $\tau$ with $N^{1/3}$ gives the brightening. The factor $A(1-A)$ explains why thin clouds and the dim oceanic low clouds are sensitive and why very thick or very thin ones are not. The prescribed stripe here simply illustrates a spatial change in droplet number; it is not an observed ship track. Twomey also treats absorption by pollution, which can reverse the brightening in sufficiently thick clouds; this nonabsorbing model excludes that effect. At fixed water path put $x=\ln N$, so $\tau$ is proportional to $e^{x/3}$. The chain rule pma 5.5 gives $dA/dx=(dA/d\tau)(\tau/3)$ for the stated smooth rational albedo law. Substitution yields $A(1-A)/3$, whose maximum on $0\le A\le1$ is at one half. This derivative holds within the fixed-water, nonabsorbing closure, not when cloud amount, water path or absorbing pollution also change.`,
      caption: String.raw`Set the liquid water path and two droplet numbers (the second may be smaller). Left: a cross-section of the cloud's droplets (drawn with their relative size and count). Middle: albedo against droplet number, from the two-stream formula (curve) and from 1500 photons with a Henyey–Greenstein phase function at normal incidence (open dot and one-standard-error bar when all photons escape). Right: a schematic cloud deck with a prescribed stripe interpolating between the two counts, with a common grayscale albedo scale in either theme.`,
      deps: ['climate-3.2', 'climate-1.11', 'pma-5.5'],
      refs: ['IPCC AR6 WG1 ch. 7'],
      tags: ['aerosols', 'clouds', 'albedo'],
      verify: false,
      scope: String.raw`Fixed 300m deep, nonabsorbing, monodisperse liquid layer at chosen water path; $g=0.85$. The rational albedo curve is a chosen two-stream approximation, not Twomey's original numerical calculation. The independent angular Monte Carlo may differ systematically from that closure; it is an illustration, not a proof of the formula. A finite scattering limit records unresolved photons separately and bounds their possible reflection, instead of silently counting them as transmission. Global scaling uses 340 W/m² times a chosen affected fraction, neglecting atmospheric absorption, adjustments and spatial/diurnal weighting; it is not an ERF estimate. [Original Twomey1977](https://atmos.washington.edu/academics/classes/2008Q2/591A/Articles/twomey_i1520-0469-34-7-1149.pdf); AR6 Table7.8 is the source for the separately quoted assessed aerosol–cloud ERF.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cloud_condensation_nuclei' },
      viz(v) {
        const lwp = v.slider('liquid water path (g/m²)', 20, 300, 100, { log: true, sig: 2 });
        const N0 = v.slider('reference droplet number $N_1$ (cm⁻³)', 20, 400, 50, { log: true, sig: 2 });
        const N1 = v.slider('stripe droplet number $N_2$ (cm⁻³)', 20, 1000, 120, { log: true, sig: 2 });
        const frac = v.slider('area fraction affected', 0.01, 0.3, 0.05, { step: 0.005 });
        const G = 0.85, H = 300; // asymmetry parameter, cloud depth (m): only enters through the droplet size picture
        const tauOf=(N,w)=>droplet(N,w).tau,albOf=t=>.15*t/(2+.15*t),rOf=(N,w)=>droplet(N,w).r;
        const mcCache=new Map();const mc=tau=>{if(!mcCache.has(tau))mcCache.set(tau,photonCloud(tau));return mcCache.get(tau);};
        const sA = v.stage({ x: [0, 10], y: [0, 10], equal: true, axes: false, height: 300, weight: 0.8, minWidth: 220, title: 'droplets (schematic cross-section)' });
        const sB = v.stage({ x: [10, 1200], xlog: true, y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xlabel: 'droplet number $N$ (cm⁻³)', ylabel: 'cloud albedo', title: 'albedo against droplet number' });
        const sC = v.stage({ x: [0, 10], y: [0, 10], equal: true, axes: false, height: 300, weight: 0.9, minWidth: 230, title: 'cloud deck with a prescribed stripe' });
        const rng = v.rng(5), pts = Array.from({ length: 260 }, () => [0.3 + 9.4 * rng(), 0.3 + 9.4 * rng()]);
        const noise = (x, y) => 0.5 + 0.25 * Math.sin(1.7 * x + 0.8 * Math.sin(2.1 * y)) + 0.25 * Math.sin(2.9 * y - 1.3 * Math.sin(1.1 * x));
        let R = null;
        v.render(() => {
          const t1 = tauOf(N0.value, lwp.value), t2 = tauOf(N1.value, lwp.value), A1 = albOf(t1), A2 = albOf(t2);
          // droplets: count proportional to N; physical relative radii on a common chosen drawing scale
          const n = Math.round(Math.min(260, N1.value / 4)), rr = rOf(N1.value, lwp.value) * 0.07;
          for (let i = 0; i < n; i++) sA.circle(rr+.2+(9.6-2*rr)*(pts[i][0]-.3)/9.4,rr+.2+(9.6-2*rr)*(pts[i][1]-.3)/9.4,rr, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 1 });
          sA.text(`N = ${fx(v, N1.value, 0)} cm⁻³, drop radius ${fx(v, rOf(N1.value, lwp.value), 1)} µm`, 5, 9.7, { size: 11.5, color: 'ink', align: 'center', baseline: 'top', plate: true });
          sA.text('(drops shown with their relative size; count scaled)', 5, 0.15, { size: 10, color: 'muted', align: 'center', baseline: 'bottom' });
          // albedo curve
          sB.fn((N) => albOf(tauOf(N, lwp.value)), { color: 'accent', width: 2.6, n: 80 });
          sB.fn((N) => albOf(tauOf(N, lwp.value)) * (1 - albOf(tauOf(N, lwp.value))), { color: 'faint', width: 1.4, dash: [4, 4], n: 80 });
          const m1 = mc(t1), m2 = mc(t2);
          [[N0.value, A1, m1, 'blue'], [N1.value, A2, m2, 'red']].forEach(([N, A, m, col]) => { sB.dot(N, A, { color: col, r: 6 }); sB.dot(N,m.a, { color: col, r: 4, hollow: true }); sB.line(N,m.se===null?m.lower:m.a-m.se,N,m.se===null?m.upper:m.a+m.se, { color: col, width: 1.6 }); });
          sB.text('dashed: A(1−A) = 3 dA/d ln N', 900, 0.08, { size: 10, color: 'muted', align: 'right' });
          // ship track
          const wk = 0.45;
          sC.raster((x, y) => {
            const d = Math.abs((y - (2 + 0.55 * x)) / Math.sqrt(1 + 0.55 * 0.55)), k = Math.exp(-(d * d) / (2 * wk * wk)) * (x < 0.5 ? x / 0.5 : 1);
            const lN = Math.log(N0.value) + k * (Math.log(N1.value) - Math.log(N0.value)), t = tauOf(Math.exp(lN), lwp.value * (0.82 + 0.36 * noise(x, y)));
            const grey=Math.round(40+210*albOf(t));return[grey,grey,grey,255];
          }, { res: 4, key: `${N0.value.toFixed(1)}|${N1.value.toFixed(1)}|${lwp.value.toFixed(1)}` });
          sC.colorbar([0,1],t=>[40+210*t,40+210*t,40+210*t,255], { pos: 'left', label: 'albedo' });
          sC.text(N1.value>=N0.value?'stripe: increased droplet number':'stripe: decreased droplet number', 9.8, 8.0, { size: 10.5, color: 'ink', align: 'right', plate: true });
          const dA = A2 - A1, forcing = -340 * frac.value * dA;
          R = { t1, t2, A1, A2, dA, forcing, sus: (A1 * (1 - A1)) / 3, m1, m2 };
        });
        v.legend([['blue', 'reference $N_1$', { dot: true }], ['red', 'stripe $N_2$', { dot: true }], ['accent', 'two-stream albedo']]);
        v.readout(() => R && String.raw`τ = ${fx(v, R.t1, 1)} → ${fx(v, R.t2, 1)}; albedo ${fx(v, R.A1, 3)} → ${fx(v, R.A2, 3)} (Monte Carlo ${fx(v,R.m1.a,3)} → ${fx(v,R.m2.a,3)}; one-SE ${R.m1.se===null?'unresolved':fx(v,R.m1.se,3)}, ${R.m2.se===null?'unresolved':fx(v,R.m2.se,3)}; unresolved photons ${R.m1.unresolved}/${R.m1.n}, ${R.m2.unresolved}/${R.m2.n}) · susceptibility A(1−A)/3 = ${fx(v, R.sus, 3)} · for ${fx(v, frac.value * 100, 1)} % of the Earth's area: forcing ≈ **${fx(v, R.forcing, 2)} W/m²** (AR6 aerosol–cloud ERF 1750–2019: −0.84, −1.45 to −0.25, which includes adjustments)`);
      },
    },
//@@B
  ],
};
