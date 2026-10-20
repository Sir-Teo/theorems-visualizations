import { comparativeModel, recoverRisks, crossRatio, riskRatio, ratioLabel } from './epi-source-audit.js';
// Epidemiology & Evidence — Chapter 3: Measures of association and effect (items 3.9–3.13; 3.1–3.7 are in ch03.js)
import { int, pc, pcs, sig3, odds, oneIn, RATIO_TICKS, riskDot, table22, cells22 } from './ch03.shared.js';

export default {
  collection: 'epi',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Definition',
      name: 'Rate ratio and hazard ratio',
      credit: 'hazard ratio and the proportional-hazards model: D. R. Cox, 1972',
      statement: String.raw`Let $d_1, d_0$ be the numbers of events and $T_1, T_0$ the person-time at risk (1.2) in an exposed and an unexposed group. The **incidence rate ratio** (rate ratio) is
$$\mathrm{IRR} = \frac{d_1/T_1}{d_0/T_0},$$
the ratio of the two incidence rates. If the hazards (instantaneous event rates) in the two groups are $h_1(t) = \theta\,h_0(t)$ at every time $t$, then $\theta$ is the **hazard ratio**; for a constant hazard (exponential survival) the true rates are $\lambda_1 = \theta\lambda_0$ and the rate ratio estimates $\theta$ with $\ln\widehat{\mathrm{IRR}}$ having approximate variance $1/d_1 + 1/d_0$. The rate ratio uses each person's own time at risk, so it remains valid when follow-up differs between people or groups; the risk ratio $(d_1/n_1)/(d_0/n_0)$ does not. If the hazard ratio changes over time, a single rate ratio is only an average of it.`,
      idea: String.raw`Risk (1.1) is a proportion of people over a fixed period; if people are observed for different lengths of time, the proportion who have had the event is not comparable. A rate divides events by the time actually observed, so it adjusts for unequal follow-up; a constant hazard $\lambda$ makes the expected number of events proportional to person-time, $E[d] = \lambda\,E[T]$, whatever the censoring, which is why the ratio of rates targets $\lambda_1/\lambda_0$. In survival analysis (the last chapter of this collection) the same idea, applied to a hazard that varies with time and covariates, gives the Cox model, whose coefficients are log hazard ratios.

Under the approximate independent Poisson count model with fixed positive person-times, the rate estimates have variances $\lambda_g/T_g$. The delta method stat-5.6 applied to their log ratio has gradient $(1/\lambda_1,-1/\lambda_0)$, giving approximate variance $1/(\lambda_1T_1)+1/(\lambda_0T_0)$. Substituting the positive observed counts yields $1/d_1+1/d_0$. The approximation needs adequate counts and does not extend a constant-hazard interpretation to arbitrary time-varying hazards or dependent observation processes.`,
      caption: String.raw`Each row is a person followed from time 0: the line ends at the event (×) or at the end of that person's follow-up (|). Exposed people (red) have the hazard ratio set below and are followed for less time than the unexposed (blue) — drag the follow-up sliders. The bars compare the naive risk ratio (events ÷ people), the rate ratio (events ÷ person-years) and the true hazard ratio; hollow marks are their large-sample expectations. Shorten the exposed follow-up and the risk ratio drifts towards 1 while the rate ratio stays on target. A simulation with a constant hazard in each group.`,
      deps: ['epi-1.2', 'stat-5.6'],
      refs: ['Rothman ch. 4'],
      tags: ['rate ratio', 'hazard ratio', 'person-time'],
      scope: String.raw`The rate ratio estimates the hazard ratio when hazards are constant in each group, or when the hazard ratio is constant in time and the rates are summarized with a common time scale; with time-varying hazard ratios the rate ratio depends on the follow-up used.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hazard_ratio' },
      viz(v) {
        const M = v.M, NG = 36, GRID = 200;
        const sT = v.stage({ x: [0, 8], y: [-1, 2 * NG + 3], axes: 'box', gutter: true, height: 430, full: true, yticks: [], xlabel: 'years of follow-up', title: `${NG} unexposed (bottom) and ${NG} exposed (top) people` });
        const sB = v.stage({ x: [0.25, 8], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 230, full: true, xticks: RATIO_TICKS.filter((t) => t[0] >= 0.25 && t[0] <= 8), yticks: [], xlabel: 'ratio, log scale' });
        const l0S = v.slider('hazard of the unexposed (events per person-year)', 0.02, 0.5, 0.1, { log: true, sig: 2 });
        const hrS = v.slider('true hazard ratio', 0.3, 6, 2, { log: true, sig: 2 });
        const f0S = v.slider('maximum follow-up, unexposed (years)', 1, 8, 6, { step: 0.1 });
        const f1S = v.slider('maximum follow-up, exposed (years)', 1, 8, 2, { step: 0.1 });
        let seed = 11, data = null;
        const make = () => { const r = v.rng(seed), u = Array.from({ length: 4 * NG }, () => 1 - r()); data = u; };
        make();
        v.button('Resample people', () => { seed++; make(); });
        let st = null;
        v.render(() => {
          const l0 = l0S.value, hr = hrS.value, f0 = f0S.value, f1 = f1S.value, grp = [{ lam: l0, F: f0, off: 0, col: 'blue' }, { lam: l0 * hr, F: f1, off: 2 * NG, col: 'red' }];
          const res = grp.map((g, k) => {
            let d = 0, py = 0;
            for (let i = 0; i < NG; i++) {
              const T = -Math.log(data[k * 2 * NG + i]) / g.lam, f = g.F * (0.4 + 0.6 * data[k * 2 * NG + NG + i]), t = Math.min(T, f), ev = T < f, y = k ? NG + 2 + i : 1 + i;
              py += t; if (ev) d++;
              sT.line(0, y, t, y, { color: g.col, width: 1.4, alpha: 0.55 });
              if (ev) sT.dot(t, y, { r: 3.4, color: 'ink' }); else sT.line(t, y - 0.4, t, y + 0.4, { color: g.col, width: 2 });
            }
            // large-sample expectations: average over the follow-up distribution
            let er = 0; for (let m = 0; m < GRID; m++) er += 1 - Math.exp(-g.lam * g.F * (0.4 + 0.6 * ((m + 0.5) / GRID)));
            return { d, py, risk: d / NG, rate: d / py, eRisk: er / GRID };
          });
          const [a, b] = res;
          sT.text(`${b.d} events in ${v.fix(b.py, 0)} person-years`, 7.9, 2 * NG + 1.6, { align: 'right', color: 'red', size: 12, weight: 700, plate: true });
          sT.text(`${a.d} events in ${v.fix(a.py, 0)} person-years`, 7.9, NG + 0.2, { align: 'right', color: 'blue', size: 12, weight: 700, plate: true });
          const naive = b.risk / a.risk, rate = b.rate / a.rate, eNaive = b.eRisk / a.eRisk;
          const row = (y, val, ex, col, lab) => { if (isFinite(val) && val > 0) { sB.dot(val, y, { r: 8, color: col }); sB.text(sig3(val), val, y, { dy: -17, align: 'center', color: col, size: 12.5, weight: 700 }); } if (ex) sB.dot(ex, y, { r: 9, color: 'ink', hollow: true, width: 1.8 }); sB.text(lab, 0.26, y, { dy: -36, align: 'left', color: 'muted', size: 11.5 }); };
          sB.vline(1, { color: 'ink', width: 1.5 });
          sB.vline(hr, { color: 'green', width: 1.6, dash: [5, 4] }); sB.text('true HR', hr, 0.97, { align: 'center', dy: 4, baseline: 'top', color: 'green', size: 11.5, weight: 700 });
          row(0.2, naive, eNaive, 'orange', 'risk ratio: events ÷ people');
          row(0.55, rate, hr, 'accent', 'rate ratio: events ÷ person-years');
          st = { naive, rate, eNaive, hr, a, b };
        });
        v.legend([['ink', 'event (×)', { dot: true }], ['green', 'true hazard ratio', { dash: true }], ['muted', 'hollow ring: expectation in a very large sample']]);
        v.readout(() => st && `exposed ${st.b.d}/${NG} = ${pcs(st.b.risk)} vs unexposed ${st.a.d}/${NG} = ${pcs(st.a.risk)}: risk ratio **${isFinite(st.naive) ? v.fix(st.naive, 2) : '—'}** (expected ${v.fix(st.eNaive, 2)}) · rates ${v.fix(st.b.rate, 3)} vs ${v.fix(st.a.rate, 3)} per person-year: rate ratio **${isFinite(st.rate) ? v.fix(st.rate, 2) : '—'}** (expected exactly the hazard ratio ${v.fix(st.hr, 2)}; the scatter is sampling noise from ${NG} people per group)`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Definition',
      name: 'Attributable fraction and population attributable fraction',
      credit: 'Levin, 1953 (population attributable fraction)',
      statement: String.raw`Let a harmful exposure have risk ratio $\mathrm{RR} > 1$ and let a proportion $p_e$ of the population be exposed. The **attributable fraction among the exposed** is the share of their cases that would not have occurred without the exposure:
$$\mathrm{AF}_e = \frac{R_1 - R_0}{R_1} = \frac{\mathrm{RR} - 1}{\mathrm{RR}}.$$
The **population attributable fraction** is the share of *all* cases in the population that would not have occurred had no one been exposed (Levin's formula):
$$\mathrm{PAF} = \frac{R - R_0}{R} = \frac{p_e(\mathrm{RR}-1)}{1 + p_e(\mathrm{RR}-1)},$$
where $R = p_eR_1 + (1-p_e)R_0$ is the overall risk. Both are meaningful as "preventable fractions" only if the association is causal and unconfounded, and removing the exposure changes nothing else. Several exposures' PAFs may add up to more than 100% because the same case can be attributable to more than one cause.`,
      idea: String.raw`Count the cases: of the $p_eR_1$ exposed cases (per person in the population), the excess over $p_eR_0$ is the part due to exposure; divide by all cases $R$, and with $R_1 = \mathrm{RR}\,R_0$ the baseline cancels, leaving a formula in $p_e$ and $\mathrm{RR}$ alone. A strong risk factor that is rare, and a weak one that is very common, can have the same PAF; and the PAF can be much larger than the exposed group's excess risk suggests when the exposure is widespread. Levin (1953) introduced the quantity in his study of smoking and lung cancer, and it remains the standard way to turn a risk ratio and a prevalence into a public-health impact.`,
      caption: String.raw`The population is 1 000 people; the exposed are on the left. Red dots are cases that would not have occurred without the exposure, blue ones are cases that would have happened anyway. **Drag the dot** along a PAF curve to set the prevalence of exposure, and use the sliders for the risk ratio and the baseline risk: the PAF depends on the first two only (the baseline risk changes the counts, not the fraction). Numbers are illustrative.`,
      deps: ['epi-3.2'],
      refs: ['Rothman ch. 4', 'Gordis ch. 12'],
      tags: ['attributable fraction', 'PAF', 'public health impact'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Attributable_fraction_for_the_population' },
      viz(v) {
        const sI = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.15, minWidth: 300, title: '1 000 people: exposed (left) and unexposed' });
        const sC = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 0.95, minWidth: 280, xlabel: 'share of the population exposed', ylabel: 'population attributable fraction', xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0, 0.25, 0.5, 0.75, 1], title: 'PAF against prevalence of exposure' });
        const rrS = v.slider('risk ratio RR', 1.1, 30, 3, { log: true, sig: 2 });
        const r0S = v.slider('baseline risk $R_0$', 0.005, 0.3, 0.05, { log: true, fmt: (x) => pcs(x) });
        const paf = (pe, rr) => (pe * (rr - 1)) / (1 + pe * (rr - 1));
        const H = sC.handle(0.3, paf(0.3, 3), { color: 'gold', r: 8, constrain: (x) => { const p = Math.min(0.99, Math.max(0.01, x)); return [p, paf(p, rrS.value)]; } });
        const I = v.icons(sI, { n: 1000, order: 'index', region: [0, 0.02, 1, 1], block: (i) => (i < st0.E ? 0 : 1), blockLabels: (k) => (k ? 'unexposed' : 'exposed') });
        let st = null, st0 = { E: 300 };
        v.render(() => {
          const pe = H.x, r0 = r0S.value, r1 = Math.min(0.99, rrS.value * r0), rr = r1 / r0, E = Math.round(1000 * pe);
          const base = Math.round(E * r0), exc = Math.round(E * (r1 - r0)), cu = Math.round((1000 - E) * r0);
          st0.E = E;
          I.set({ rest: { color: 'muted', alpha: 0.28 }, style: (i) => (i < E ? (i < exc ? { color: 'red' } : i < exc + base ? { color: 'blue' } : undefined) : i - E < cu ? { color: 'blue' } : undefined) });
          I.draw();
          for (const k of [1.5, 3, 10, 30]) sC.fn((x) => paf(x, k), { domain: [0, 1], color: 'faint', width: 1.1 });
          sC.fn((x) => paf(x, rr), { domain: [0, 1], color: 'accent', width: 2.6 });
          H.set(pe, paf(pe, rr));
          sC.line(pe, 0, pe, paf(pe, rr), { color: 'gold', dash: [3, 3] }); sC.line(0, paf(pe, rr), pe, paf(pe, rr), { color: 'gold', dash: [3, 3] });
          sC.text('faint: RR = 1.5, 3, 10, 30', 0.98, 0.04, { align: 'right', color: 'muted', size: 10.5 });
          st = { pe, r0, r1, rr, E, base, exc, cu, paf: paf(pe, rr) };
        });
        v.legend([['red', 'case caused by the exposure'], ['blue', 'case that would occur anyway']]);
        v.readout(() => st && `${st.E} exposed; cases: ${st.exc} excess + ${st.base} baseline among them, ${st.cu} among the ${1000 - st.E} unexposed · AF among the exposed = (RR−1)/RR = **${pc((st.rr - 1) / st.rr)}** · PAF = ${pc(st.pe, 0)}·(RR−1) ÷ (1 + ${pc(st.pe, 0)}·(RR−1)) = **${pc(st.paf)}**; counted from the picture: ${st.exc} ÷ ${st.exc + st.base + st.cu} = ${pc(st.exc / (st.exc + st.base + st.cu))}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Concept',
      name: 'Effect modification and scale dependence',
      credit: 'Rothman, 1976',
      statement: String.raw`Let two binary exposures $A$ and $B$ have risks $R_{00}$ (neither), $R_{10}$ ($A$ only), $R_{01}$ ($B$ only) and $R_{11}$ (both), with risk ratios $\mathrm{RR}_{ij} = R_{ij}/R_{00}$. The effect of $A$ **differs across levels of $B$** (effect modification, interaction) on the ratio scale when
$$\mathrm{RR}_{11} \neq \mathrm{RR}_{10}\,\mathrm{RR}_{01},$$
and on the additive scale when the interaction contrast is nonzero:
$$R_{11} - R_{10} - R_{01} + R_{00} \neq 0 \qquad\Big(\text{equivalently } \mathrm{RERI} = \mathrm{RR}_{11} - \mathrm{RR}_{10} - \mathrm{RR}_{01} + 1 \neq 0\Big).$$
The two statements are different: if both $A$ and $B$ raise the risk ($R_{10}, R_{01} > R_{00}$) and the joint effect is exactly multiplicative, then $\mathrm{RERI} = (\mathrm{RR}_{10}-1)(\mathrm{RR}_{01}-1) > 0$, so there is interaction on the additive scale (a "super-additive" joint effect) and none on the ratio scale. Whether "interaction" is present therefore depends on the scale, and there is no scale on which the question is the right one in general; additive-scale interaction is the one that bears on public-health decisions (where treatment helps most in absolute terms).`,
      idea: String.raw`With risk ratios of 2 and 3 for $A$ and $B$, independent multiplicative action gives a joint risk ratio of 6; but "no interaction" in the additive sense would mean $1 + (2-1) + (3-1) = 4$. The two models of "independence" disagree except in the trivial cases, so the same data can be summarised as consistent with no interaction on one scale and showing strong interaction on the other. Rothman (1976) argued that for judging whether causes act together the departure from additivity of risks is the relevant one (it corresponds to the exposures contributing to the same cases) — a view that remains debated. The absolute-scale contrast also decides which subgroup gains most from an intervention, which is what 3.4 is about.`,
      caption: String.raw`Bars are the four risks. Set the baseline risk and the two risk ratios; hollow marks on the right bar show what the joint risk would be if effects simply *added* (gold) or *multiplied* (green). The slider scales the joint effect relative to multiplicative: at 1 the data are exactly multiplicative, with no interaction on the ratio scale and a clearly positive interaction contrast on the additive one. Press *make it additive* for the reverse. The table reads the same four risks on three scales. Illustrative numbers.`,
      deps: ['epi-3.2', 'epi-3.3'],
      refs: ['Rothman ch. 5'],
      tags: ['interaction', 'effect modification', 'scale'],
      scope: String.raw`Two binary exposures that each raise risk; absolute risks must stay below 1, so the joint risk is capped at 99% in the picture.`,
      viz(v) {
        const sB = v.stage({ x: [0.4, 6.4], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1.15, minWidth: 300, ylabel: 'risk', xticks: [[1, 'neither'], [2, 'A only'], [3, 'B only'], [4, 'A and B']], title: 'four risks' });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, minWidth: 280, title: 'is there interaction? it depends on the scale' });
        const r00 = v.slider('risk with neither exposure', 0.002, 0.2, 0.02, { log: true, fmt: (x) => pcs(x) });
        const raS = v.slider('risk ratio of A alone', 1, 8, 2, { step: 0.05 });
        const rbS = v.slider('risk ratio of B alone', 1, 8, 3, { step: 0.05 });
        const psi = v.slider('joint risk ratio ÷ (RR$_A$ · RR$_B$)', 0.1, 2, 1, { log: true, sig: 3 });
        const T = v.table(sT, { rows: 3, cols: 3, square: false, cellAspect: 1.5, maxCell: 62, size: 14, labelSize: 11.5, region: [0, 0.25, 1, 1], rowLabels: ['ratio scale', 'RERI', 'risk scale'], colLabels: ['value', 'null at', 'verdict'], labelWidth: 0.27 });
        v.button('make it multiplicative', () => psi.set(1));
        v.button('make it additive', () => { const ra = raS.value, rb = rbS.value; psi.set(Math.min(2, Math.max(0.1, (ra + rb - 1) / (ra * rb)))); });
        let st = null;
        v.render(() => {
          const R00 = r00.value, ra = raS.value, rb = rbS.value, R10 = Math.min(0.97, R00 * ra), R01 = Math.min(0.97, R00 * rb);
          const mulP = R00 * ra * rb, addP = R10 + R01 - R00, R11 = Math.min(0.99, mulP * psi.value), capped = mulP * psi.value > 0.99;
          [R00, R10, R01, R11].forEach((r, k) => { sB.rect(k + 0.62, 0, k + 1.38, r, { fill: ['muted', 'blue', 'orange', 'red'][k], fillAlpha: 0.35, color: ['muted', 'blue', 'orange', 'red'][k], width: 1.5 }); sB.text(pcs(r), k + 1, r, { dy: -12, align: 'center', color: 'ink', size: 12, weight: 700 }); });
          const top = Math.max(R11, Math.min(0.99, addP), Math.min(0.99, mulP), R01) * 1.35; sB.setView(null, [0, Math.min(1, top)]);
          sB.dot(4, Math.min(0.99, addP), { r: 8, color: 'gold', hollow: true, width: 2.2 }); sB.text('if effects add', 4.5, Math.min(0.99, addP), { align: 'left', color: 'gold', size: 11.5, weight: 700 });
          sB.dot(4, Math.min(0.99, mulP), { r: 8, color: 'green', hollow: true, width: 2.2 }); sB.text('if effects multiply', 4.5, Math.min(0.99, mulP), { align: 'left', dy: Math.abs(mulP - addP) < 0.06 * top ? (mulP > addP ? -14 : 14) : 0, color: 'green', size: 11.5, weight: 700 });
          const rr11 = R11 / R00, rr10 = R10 / R00, rr01 = R01 / R00, ratio = rr11 / (rr10 * rr01), reri = rr11 - rr10 - rr01 + 1, ic = 1000 * (R11 - R10 - R01 + R00);
          const verd = (x, nul, tol) => (Math.abs(x - nul) <= tol ? 'none' : x > nul ? 'positive' : 'negative');
          const rows = [[v.fix(ratio, 2), '1', verd(ratio, 1, 0.005)], [v.fix(reri, 2), '0', verd(reri, 0, 0.005)], [`${v.fix(ic, 1)}/1000`, '0', verd(ic, 0, 0.05)]];
          T.draw({ value: (i, j) => rows[i][j], fill: (i, j) => (j === 2 ? [rows[i][2] === 'none' ? 'green' : 'orange', 0.3] : null), weight: (i, j) => (j === 2 ? 700 : 500) });
          sT.text('ratio scale: RR₁₁ ÷ (RR₁₀·RR₀₁);  RERI = RR₁₁ − RR₁₀ − RR₀₁ + 1;', 0.5, 0.17, { align: 'center', color: 'muted', size: 11.5 });
          sT.text('risk scale: (R₁₁ − R₁₀ − R₀₁ + R₀₀) per 1 000 people', 0.5, 0.09, { align: 'center', color: 'muted', size: 11.5 });
          if (capped) sT.text('joint risk capped at 99%', 0.5, 0.01, { align: 'center', color: 'orange', size: 11.5 });
          st = { ratio, reri, ic, R11, mulP, addP };
        });
        v.readout(() => st && `joint risk **${pcs(st.R11)}**: if effects multiplied ${pcs(st.mulP)}, if they added ${pcs(st.addP)} · ratio-scale contrast ${v.fix(st.ratio, 2)} (null 1), RERI ${v.fix(st.reri, 2)} (null 0), risk-scale contrast ${v.fix(st.ic, 1)} per 1 000 (null 0) — move the slider and the two verdicts never agree except at one point`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Paradox',
      name: 'Rose’s prevention paradox',
      credit: 'Geoffrey Rose, 1981',
      statement: String.raw`Suppose a risk factor $Z$ is distributed continuously in the population and the risk of disease rises smoothly with it, for example $r(z) \propto e^{\beta z}$ for $z$ standardized (so each standard deviation multiplies risk by $e^{\beta}$). Then a **large share of the cases arises in the many people at modest risk** and only a minority in the few at high risk. A "high-risk strategy" (identify and treat the top fraction $q$) benefits those people a great deal but prevents few cases overall; a "population strategy" that shifts the whole distribution down by a small amount $\delta$ gives each person a tiny benefit but prevents more cases in total. Rose's **prevention paradox**: a measure that brings large benefits to the community offers little to each participating individual. For this log-linear model with $Z \sim N(0,1)$, the share of cases in the top fraction $q$ (threshold $z_q$) is $1 - \Phi(z_q - \beta)$, and a shift by $\delta$ prevents the fraction $1 - e^{-\beta\delta}$ of all cases.`,
      idea: String.raw`Cases are the product of two curves, a bell curve of people and a rising curve of risk (3.4): the risk is highest where the people are fewest. The classic message of Rose (1981, and his book *The Strategy of Preventive Medicine*, 1992) is that there is no sharp line separating "the diseased-to-be" from the rest: risk is continuous, so most cases occur among the many who would never be classed as high risk, and prevention aimed only at the tail misses them. The attributable fractions of 3.10 make the same point in a different way; the price of the population approach is that most participants will never know they benefited.

Using the standard normal density from prob-1.2.5, complete the square: $e^{\beta z}\phi(z)=e^{\beta^2/2}\phi(z-\beta)$. Normalising the idealized case-weight curve therefore shifts its mean to $\beta$, giving tail share $1-\Phi(z_q-\beta)$. Shifting every $z$ down by $\delta$ multiplies all weights by $e^{-\beta\delta}$, giving the stated prevented fraction in this model. An unbounded exponential weight is not a globally valid disease probability; these identities describe the chosen relative-weight model, not an empirical guarantee for every risk distribution.`,
      caption: String.raw`Left: the distribution of the risk factor (think of blood pressure), with the top fraction $q$ shaded. Middle: the cases it produces, per 1 000 people and standard deviation — the shaded tail is a minority of the area. Right: cases prevented per 1 000 people by treating only the shaded group (reducing their risk by the chosen amount) against shifting everyone down by $\delta$ SD. A model with a log-linear risk gradient and an overall risk of 5%; not data from any one study.`,
      deps: ['epi-3.10', 'prob-1.2.5'],
      refs: ['Gordis ch. 12'],
      tags: ['prevention', 'population strategy', 'risk distribution'],
      scope: String.raw`Holds for any risk factor with a continuous distribution and a smooth, not too steep, risk gradient; with a very steep gradient or a bimodal distribution most cases do arise in the high-risk tail. The picture assumes a log-linear gradient and normal distribution.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Prevention_paradox' },
      viz(v) {
        const M = v.M, N01 = M.dist.normal(0, 1), RBAR = 0.05;
        const sP = v.stage({ x: [-3.5, 3.5], y: [0, 0.45], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 250, xlabel: 'risk factor (SD from the mean)', yticks: [], title: 'people' });
        const sC = v.stage({ x: [-3.5, 3.5], y: [0, 1], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 250, xlabel: 'risk factor (SD from the mean)', yticks: [], title: 'cases that they produce' });
        const sB = v.stage({ x: [0, 3], y: [0, 1], axes: 'box', gutter: true, height: 290, weight: 0.8, minWidth: 230, xticks: [[0.75, 'treat the'], [2.25, 'shift all']], yticks: [0, 2, 4, 6, 8], ylabel: 'cases prevented per 1 000', title: 'two strategies' });
        const rrS = v.slider('risk ratio per SD of the risk factor', 1.2, 4, 1.8, { log: true, sig: 2 });
        const qS = v.slider('"high-risk" group: top fraction', 0.01, 0.4, 0.05, { log: true, fmt: (x) => pcs(x) });
        const eS = v.slider('risk reduction in those treated (high-risk strategy)', 0.1, 0.9, 0.5, { step: 0.01, fmt: (x) => pc(x, 0) });
        const dS = v.slider('shift of the whole distribution (SD)', 0, 0.5, 0.15, { step: 0.01 });
        let st = null;
        v.render(() => {
          const beta = Math.log(rrS.value), q = qS.value, zt = N01.quantile(1 - q), e = eS.value, d = dS.value;
          const cases = (x) => N01.pdf(x) * Math.exp(beta * x - beta * beta / 2) * RBAR; // cases per person per SD
          const cmax = 1000 * Math.max(...M.linspace(-3.5, 3.5, 200).map(cases));
          sC.setView(null, [0, cmax * 1.15]);
          sP.fn(N01.pdf, { domain: [-3.5, 3.5], color: 'ink', width: 2 });
          sP.fn(N01.pdf, { domain: [zt, 3.5], fill: true, color: 'red', width: 0, fillAlpha: 0.4 });
          sP.vline(zt, { color: 'red', dash: [4, 3] });
          sP.text(`top ${pcs(q)} of people`, zt, 0.4, { align: 'left', dx: 6, color: 'red', size: 12, weight: 700 });
          sC.fn((x) => 1000 * cases(x), { domain: [-3.5, 3.5], color: 'ink', width: 2 });
          sC.fn((x) => 1000 * cases(x), { domain: [zt, 3.5], fill: true, color: 'red', width: 0, fillAlpha: 0.4 });
          sC.fn((x) => 1000 * cases(x) * Math.exp(-beta * d), { domain: [-3.5, 3.5], color: 'green', width: 1.6, dash: [5, 4] });
          sC.vline(zt, { color: 'red', dash: [4, 3] });
          const tail = 1 - N01.cdf(zt - beta), pHigh = 1000 * RBAR * e * tail, pPop = 1000 * RBAR * (1 - Math.exp(-beta * d));
          sC.text(`${pc(tail, 0)} of cases above, ${pc(1 - tail, 0)} below`, -3.4, cmax * 1.12, { align: 'left', color: 'red', size: 12, weight: 700 });
          const ymax = Math.max(2, Math.ceil(Math.max(pHigh, pPop) * 1.2));
          sB.setView(null, [0, ymax]); sB.setTicks([[0.75, 'treat the top'], [2.25, 'shift everyone']], null);
          sB.rect(0.25, 0, 1.25, pHigh, { fill: 'red', fillAlpha: 0.4, color: 'red', width: 1.5 }); sB.text(v.fix(pHigh, 1), 0.75, pHigh, { dy: -11, align: 'center', color: 'red', size: 13, weight: 700 });
          sB.rect(1.75, 0, 2.75, pPop, { fill: 'green', fillAlpha: 0.4, color: 'green', width: 1.5 }); sB.text(v.fix(pPop, 1), 2.25, pPop, { dy: -11, align: 'center', color: 'green', size: 13, weight: 700 });
          st = { beta, q, tail, pHigh, pPop, e, d, nHigh: 1000 * q };
        });
        v.readout(() => st && `the top ${pcs(st.q)} of people (${int(st.nHigh)} per 1 000) produce **${pc(st.tail)}** of the cases · treating them prevents ${v.fix(st.pHigh, 1)} cases per 1 000 people, a benefit of ${v.fix(st.pHigh / st.nHigh * 1000, 1)} per 1 000 for each person treated · shifting everyone by ${v.fix(st.d, 2)} SD (risk × ${v.fix(Math.exp(-st.beta * st.d), 3)}) prevents ${v.fix(st.pPop, 1)} per 1 000 people — ${v.fix(st.pPop / Math.max(st.pHigh, 1e-9), 1)} times the high-risk strategy — yet each participant gains only ${v.fix(st.pPop, 1)} per 1 000`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.13
    {
      num: '3.13',
      kind: 'Paper',
      name: 'A Method of Estimating Comparative Rates from Clinical Data',
      paper: { authors: 'Jerome Cornfield', year: 1951, title: 'A Method of Estimating Comparative Rates from Clinical Data. Applications to Cancer of the Lung, Breast, and Cervix', venue: 'Journal of the National Cancer Institute 11 (6): 1269–1275', doi: '10.1093/jnci/11.6.1269' },
      introduces: ['epi-3.7'],
      credit: 'Jerome Cornfield, 1951',
      verify: false,
      statement: String.raw`For representative samples of cases and non-cases, let $p_1=P(E\mid D)$ and $p_0=P(E\mid\bar D)$. If the disease frequency $P=P(D)$ in the source population is known independently, Bayes' theorem gives $q=P(E)=Pp_1+(1-P)p_0$ and the exact risks
$$R_1=\frac{Pp_1}{q},\qquad R_0=\frac{P(1-p_1)}{1-q}.$$
Cornfield derives these formulas on p. 1270 and their rare-disease approximation on pp. 1270–1271: $\mathrm{RR}\approx p_1(1-p_0)/[p_0(1-p_1)]$, the case–control odds ratio. This approximation requires a sufficiently small disease frequency relative to the relevant control proportions; it is not an identity at a positive disease risk. His pp. 1273–1275 stress that unrepresentative hospital case or control groups invalidate generalisation to the source population.`,
      idea: String.raw`Multiply the exposure proportions in each sampled disease stratum by its population frequency to reconstruct the four population proportions. The case and control sampling fractions cancel in the cross-product ratio, provided selection within disease strata does not depend on exposure. The exact population relation is $\mathrm{OR}=\mathrm{RR}(1-R_0)/(1-R_1)$, so the approximation is good when both risks are small. Knowing the case–control table alone does not identify absolute risks: the external $P$ is essential. The original also discusses approximate confidence limits and concrete examples; the visual below illustrates the algebra rather than reproducing those tables.`,
      caption: String.raw`A **model of the argument, not a reconstruction of the paper's tables** (its original data are not reproduced here). Set a true relative risk and the share exposed; the left table is the whole population (per 100 000), the right table a case–control sample of 100 cases and 100 non-cases. **Drag the dot** along the odds-ratio curve to change how common the disease is: the risks remain $R_1=\mathrm{RR}\,R_0$; the allowed baseline range shortens at larger RR to keep $R_1\le0.98$. OR approaches RR as both risks approach zero. The readout combines the sample exposure proportions with the external population disease frequency to reconstruct risks. Press *Draw a sample* to see sampling noise.`,
      deps: ['epi-3.6', 'epi-3.2'],
      scope: String.raw`The original seven-page paper is directly available in a reprint (printed pp. 1269–1275; reprint pp. 95–101). This example assumes representative within-stratum sampling and a known, error-free population disease frequency. Expected cells are fractional; Draw a sample uses independent binomial draws with 100 cases and 100 controls. Zero cells can yield an infinite or undefined estimate and are reported explicitly, without an invented denominator. The pale band marks both model risks at most 5%, a visual guide rather than a universal approximation guarantee.`,
      refs: ['Cornfield (1951), pp. 1270–1271 Eqs. (1)–(2), pp. 1273–1275 Pitfalls'],
      tags: ['case-control', 'relative risk', 'history'],
      links: { source: 'https://wwwusers.ts.infn.it/~milotti/Didattica/Bayes/pdfs/Cornfield_1951.pdf', doi: 'https://doi.org/10.1093/jnci/11.6.1269' },
      viz(v) {
        const M = v.M, NC = 100;
        const sP = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 270, weight: 1, minWidth: 270, title: 'the population (per 100 000 people)' });
        const sS = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 270, weight: 1, minWidth: 270, title: 'a case–control sample (100 + 100)' });
        const sK = v.stage({ x: [5e-4, 0.4], y: [0.5, 12], xlog: true, ylog: true, axes: 'box', gutter: true, height: 270, full: true, xticks: [[0.001, '0.1%'], [0.01, '1%'], [0.1, '10%']], yticks: [[0.5, '1/2'], [1, '1'], [2, '2'], [4, '4'], [8, '8']], xlabel: 'unexposed baseline risk R₀', ylabel: 'ratio', title: 'odds and risk ratios: the rare-risk approximation' });
        const rrS = v.slider('true relative risk', 1.5, 10, 4, { log: true, sig: 2 });
        const peS = v.slider('share of the population exposed', 0.05, 0.9, 0.3, { step: 0.01, fmt: (x) => pcs(x) });
        let seed = 3, noisy = false;
        v.button('Draw a sample', () => { seed++; noisy = true; });
        v.button('Use expected counts', () => { noisy = false; });
        const Tp = table22(v, sP, [0, 0.22, 1, 1], ['exposed', 'unexposed', 'total'], ['cases', 'non-cases', 'total']);
        const Ts = table22(v, sS, [0, 0.22, 1, 1], ['exposed', 'unexposed', 'total'], ['cases', 'controls', 'total']);
        const orOf = (r0, rr) => [rr, rr * (1 - r0) / (1 - rr * r0)];
        const H = sK.handle(0.01, 4, { color: 'gold', r: 8, constrain: (x) => { const r0 = Math.min(0.39, 0.98 / rrS.value, Math.max(6e-4, x)); return [r0, orOf(r0, rrS.value)[1]]; } });
        let st = null;
        v.render(() => {
          const pe = peS.value, rr0 = rrS.value, D = comparativeModel(rr0, pe, H.x), {r0, r1, P, OR, maxRisk} = D, RR = rr0;
          const ytop = orOf(maxRisk, rr0)[1] * 1.5; sK.setView([0.0004, maxRisk * 1.25], [0.45, ytop]);
          sK.setTicks([[.001,'0.1%'],[.01,'1%'],[.1,'10%'],[.4,'40%']].filter(([x])=>x<=maxRisk*1.25),[.5,1,2,5,10,20,50,100,200,500,1000].filter(y=>y<=ytop).map(y=>[y,String(y)]));
          const pi1 = (pe * r1) / P, pi0 = (pe * (1 - r1)) / (1 - P);
          const N = 1e5, C = cells22(N * pe * r1, N * pe * (1 - r1), N * (1 - pe) * r0, N * (1 - pe) * (1 - r0));
          Tp.draw({ value: (i, j) => int(C[i][j]), fill: (i, j) => (i < 2 && j < 2 ? [j ? 'blue' : 'red', i ? 0.1 : 0.3] : i === 2 || j === 2 ? ['gray', 0.08] : null), weight: (i, j) => (i === 2 || j === 2 ? 500 : 700) });
          // sample
          let x1 = NC * pi1, x0 = NC * pi0;
          if (noisy) { const r = v.rng(seed); x1 = 0; x0 = 0; for (let k = 0; k < NC; k++) { if (r() < pi1) x1++; if (r() < pi0) x0++; } }
          const S = cells22(x1, x0, NC - x1, NC - x0), r2 = (x) => (noisy ? String(Math.round(x)) : v.fix(x, 1));
          Ts.draw({ rowLabels: ['exposed', 'unexposed', 'total'], value: (i, j) => r2(S[i][j]), fill: (i, j) => (i < 2 && j < 2 ? [j ? 'blue' : 'red', i ? 0.1 : 0.3] : i === 2 || j === 2 ? ['gray', 0.08] : null), weight: (i, j) => (i === 2 || j === 2 ? 500 : 700) });
          sP.text(`risk ratio ${v.fix(RR, 2)} · odds ratio ${v.fix(OR, 2)}`, 0.5, 0.12, { align: 'center', color: 'ink', size: 13, weight: 600 });
          sS.text(`odds ratio ad ÷ bc = ${ratioLabel(crossRatio(x1, x0, NC - x1, NC - x0))}`, 0.5, 0.2, { align: 'center', color: 'green', size: 13, weight: 700 });
          sS.text('the sample fixes 100 cases and 100 controls: no risks here', 0.5, 0.1, { align: 'center', color: 'muted', size: 11.5 });
          const cc = crossRatio(x1, x0, NC - x1, NC - x0);
          // Cornfield's recovery: P(E|D), P(E|not D) and the disease frequency P give the rates
          const p1h = x1 / NC, p0h = x0 / NC, recovered = recoverRisks(p1h, p0h, P), R1h = recovered.r1, R0h = recovered.r0;
          sK.rect(0.0006, 0.45, 0.05 / rr0, ytop, { fill: 'green', fillAlpha: 0.06, stroke: false });
          sK.fn((x) => orOf(x, rr0)[1], { domain: [0.0006, maxRisk], color: 'green', width: 2.6 });
          sK.fn((x) => orOf(x, rr0)[0], { domain: [0.0006, maxRisk], color: 'ink', width: 2, dash: [6, 4] });
          sK.text('relative risk', 0.0007, rr0, { align: 'left', dy: -9, color: 'ink', size: 12, weight: 700 });
          sK.text('odds ratio', maxRisk * 0.92, orOf(maxRisk * 0.92, rr0)[1], { align: 'right', dx: -6, dy: -9, color: 'green', size: 12, weight: 700 });
          sK.text('both risks ≤ 5%', 0.0007, 0.62, { align: 'left', color: 'green', size: 11 });
          H.set(r0, OR);
          st = { P, RR, OR, cc, R1h, R0h, r1, r0, noisy };
        });
        v.readout(() => st && `disease frequency in the population $P = ${v.fix(100 * st.P, 2)}\\%$ (true risks ${pcs(st.r1)} and ${pcs(st.r0)}, **RR = ${v.fix(st.RR, 2)}**) · case–control odds ratio${st.noisy ? ' in this sample' : ''} **${ratioLabel(st.cc)}**${st.noisy ? '' : ` = population OR ${v.fix(st.OR, 2)}`}, ${Math.abs(st.OR / st.RR - 1) < 0.1 ? 'within 10% of RR' : `${v.fix(100 * (st.OR / st.RR - 1), 0)}% above RR`} · risks recovered from the sample with $P$ (Cornfield's step): ${(st.R1h==null?'not defined':pcs(st.R1h))} and ${(st.R0h==null?'not defined':pcs(st.R0h))}, ratio **${ratioLabel(riskRatio(st.R1h,st.R0h))}**`);
      },
    },
  ],
};
