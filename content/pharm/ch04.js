import {renalRegimens,renalVertices} from './source-audit-renal.js';
import {infusionRegimen,infusionVertices} from './source-audit-infusion.js';
import { WINDOW_PRESETS, windowProfile, centeredWindowDose } from './source-audit-window.js';
// Pharmacology — Chapter 4: Dosing regimens
import { LN2, clamp, memo, DRUGS, BODY, clOf, cSingle, cMulti, cSS, meanOver, extrema, odeDoses, nPrev } from './ch04.shared.js';

const fx = (x, d = 2) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(d));

export default {
  collection: 'pharm',
  chapter: 4,
  title: 'Dosing regimens',
  summary: String.raw`Repeated doses superimpose, so concentrations accumulate toward a steady state that oscillates between a peak and a trough. Accumulation, the average steady-state level and the fluctuation within an interval all follow from the single-dose curve. Dosing is then tuned to keep concentrations inside the therapeutic window, adjusted for kidney function, scaled across species and made robust to missed doses. All drug parameters in this chapter are rounded teaching values or models, not fitted data and not dosing advice.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Model',
      name: 'Repeated dosing by superposition',
      statement: String.raw`If absorption and elimination are first-order (the system is linear and time-invariant), the concentration after repeated doses $D$ given at times $0,\tau,2\tau,\dots$ is the sum of the single-dose curves, each shifted to its dose time: $C(t)=\sum_{n\ge 0,\; n\tau\le t} C_1(t-n\tau)$. For an intravenous bolus $C_1(t)=\tfrac{D}{V}e^{-kt}$; for an oral dose it is the Bateman function. The sum climbs in a sawtooth and, when $k>0$, approaches a repeating pattern.`,
      idea: String.raw`Linearity means the response to a sum of inputs is the sum of the responses, so a second dose does not care that a first one is still in the body: each dose decays on its own schedule (the one-compartment decay of pharm-2.1). Adding the shifted copies gives the whole history. Nothing here needs a differential equation per dose; the same sum is recovered by integrating the ODE across the dose jumps, which the readout does as a check.

The superposition argument is the linear-solution property in ode 3.1 applied between the prescribed dose jumps. Each shifted single-dose state solves the same homogeneous disposition system after its own arrival; differentiation of their finite sum gives that system between doses, while the sum has exactly the required bolus increments. For an oral dose include the linear gut compartment as part of the state. Uniqueness on each interval then identifies this sum with the piecewise initial-value solution. Saturable loss or coefficients that change with dose break this argument.`,
      caption: String.raw`Each thin coloured curve is the contribution of one dose; the thick curve is their sum. Drag the **interval** and the **half-life**: when $\tau$ is short compared with $t_{1/2}$ the contributions pile up, when it is long they hardly overlap. Switch to an **oral** dose to see the same superposition with the Bateman curve. The dashed lines mark the steady-state peak and trough that the sawtooth is heading for.`,
      scope: String.raw`Holds only for linear kinetics: first-order absorption and elimination, constant parameters. It fails for saturable elimination (chapter 5), time-varying clearance, or autoinduction. Values here are a model (V = 40 L, dose 100 mg), not a particular drug.`,
      deps: ['pharm-2.1', 'ode-3.1'],
      refs: ['Rowland–Tozer'],
      tags: ['superposition', 'accumulation'],
      viz(v) {
        const V = 40, D = 100, nD = 10;
        const tau = v.slider('dosing interval $\\tau$ (h)', 1, 48, 8, { step: 0.5 });
        const t12 = v.slider('half-life $t_{1/2}$ (h)', 1, 48, 10, { step: 0.5 });
        const route = v.select('route', [{ value: 'iv', label: 'IV bolus' }, { value: 'po', label: 'oral ($k_a=1$ h$^{-1}$)' }], 'iv');
        const parts = v.toggle('show single-dose curves', true);
        const s = v.stage({ x: [0, 80], y: [0, 10], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L)', height: 340 });
        let info = null;
        v.render(() => {
          const k = LN2 / t12.value, ka = route.value === 'iv' ? Infinity : 1, T = tau.value;
          const times = Array.from({ length: nD }, (_, n) => n * T), tEnd = (nD - 0.2) * T;
          const f = (t) => cMulti(t, times, V, k, ka, 0, D);
          const ss = (t) => cSS(t, T, D, V, k, ka);
          const ex = extrema(ss, 0, T, 300);
          const top = Math.max(ex.hi, ...times.map((t) => f(t + 1e-6))) * 1.12;
          s.setView([0, nD * T], [0, top]);
          if (parts.value) times.forEach((t0, n) => s.fn((t) => cSingle(t - t0, D, V, k, ka), { domain: [t0, nD * T], color: ['purple', 'teal', 'orange', 'pink', 'blue'][n % 5], width: 1, alpha: 0.55 }));
          s.hline(ex.hi, { color: 'green', dash: true, width: 1.2 });
          s.hline(ex.lo, { color: 'green', dash: true, width: 1.2 });
          const pts = []; const N = 700;
          for (let i = 0; i <= N; i++) { const t = (nD * T * i) / N; pts.push([t, f(t)]); }
          s.path(pts, { color: 'accent', width: 2.6 });
          times.forEach((t0) => s.vline(t0, { color: 'muted', alpha: 0.25, width: 1 }));
          s.text(`peak ${fx(ex.hi)}`, nD * T, ex.hi, { size: 10.5, color: 'green', align: 'right', baseline: 'bottom' });
          s.text(`trough ${fx(ex.lo)}`, nD * T, ex.lo, { size: 10.5, color: 'green', align: 'right', baseline: 'top' });
          const chk = odeDoses(V, k, ka, times, D, tEnd);
          info = { sum: f(tEnd), chk, hi: ex.hi, lo: ex.lo, n: times.length };
        });
        v.legend([['accent', 'sum of doses'], ['purple', 'single-dose curves', { dash: true }], ['green', 'steady-state peak / trough', { dash: true }]]);
        v.readout(() => `At $t=${v.fix((nD - 0.2) * tau.value, 1)}$ h: superposition $=${v.fix(info.sum, 4)}$ mg/L; ODE integrated across the ${info.n} dose jumps $=${v.fix(info.chk, 4)}$ mg/L (difference $${v.sci(Math.abs(info.sum - info.chk), 2)}$).`);
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Accumulation factor 1/(1 − e^{−kτ})',
      statement: String.raw`For an intravenous bolus $D$ repeated every $\tau$ in a one-compartment body with elimination rate $k$, put $r=e^{-k\tau}$. The peak just after the $n$-th dose is $C_{\max,n}=\tfrac{D}{V}\,(1+r+\dots+r^{n-1})=\tfrac{D}{V}\,\tfrac{1-r^n}{1-r}$ and the trough just before the $n$-th dose is $r$ times the preceding peak. As $n\to\infty$ the peak tends to $C_{\max,ss}=\tfrac{D}{V}\,R$ with **accumulation factor** $R=\dfrac{1}{1-e^{-k\tau}}$, and the trough to $C_{\min,ss}=C_{\max,ss}\,e^{-k\tau}$.`,
      idea: String.raw`Just after the $n$-th dose the body still holds a fraction $r$ of the previous dose's contribution, $r^2$ of the one before, and so on: the peak is a geometric series (pma-3.26) in the residual fraction $r<1$. It converges because each dose is eliminated by a factor $r$ per interval, and its sum is $1/(1-r)$. With $r=2^{-\tau/t_{1/2}}$ the factor depends only on the ratio $\tau/t_{1/2}$.`,
      caption: String.raw`Left: each dose-number group pairs the blue peak immediately after dose n with the orange trough immediately before that same dose n; the first trough is zero. The green lines are the separate steady-state peak and trough limits. Right: the IV-bolus accumulation factor as a function of $\tau/t_{1/2}$; drag the point. At $\tau=t_{1/2}$ the factor is exactly 2, and for short intervals $R\approx t_{1/2}/(0.693\,\tau)$.`,
      scope: String.raw`IV bolus, linear kinetics, equal doses at equal intervals, instantaneous mixing. The stated peak/trough and single accumulation factor are for instantaneous IV boluses. With first-order oral absorption and distinct positive rates, the periodic curve instead has separate absorption and elimination terms with factors $1/(1-e^{-k_a\tau})$ and $1/(1-e^{-k\tau})$; its trough need not equal the IV value.`,
      deps: ['pharm-4.1', 'pma-3.26'],
      refs: ['Rowland–Tozer'],
      tags: ['accumulation', 'geometric series'],
      viz(v) {
        const ratio = v.slider('interval / half-life, $\\tau/t_{1/2}$', 0.1, 6, 1, { step: 0.05 });
        const nn = v.slider('doses shown $n$', 1, 20, 10, { int: true });
        const sB = v.stage({ x: [0, 21], y: [0, 4], axes: 'box', gutter: true, xlabel: 'dose number', ylabel: 'C in units of $D/V$', height: 330, weight: 1.2, minWidth: 270 });
        const sR = v.stage({ x: [0, 6], y: [1, 12], axes: 'box', gutter: true, xlabel: 'interval / half-life', ylabel: 'accumulation factor $R$', height: 330, weight: 1, minWidth: 250 });
        const hR = sR.handle(1, 2, { color: 'gold', constrain: (x) => [clamp(x, 0.1, 6), 1 / (1 - 2 ** -clamp(x, 0.1, 6))] });
        hR.onDrag = () => { ratio.set(clamp(hR.x, 0.1, 6)); };
        let info = null;
        v.render(() => {
          const x = ratio.value, r = 2 ** -x, R = 1 / (1 - r), n = nn.value;
          hR.set(x, R);
          sB.setView([0, n + 1], [0, Math.max(1.3, R * 1.15)]);
          let peak = 0, sum = 0;
          for (let i = 1; i <= n; i++) {
            peak = (i === 1 ? 1 : peak * r + 1); sum = peak;
            const trough = i === 1 ? 0 : (peak - 1);
            sB.rect(i - 0.38, 0, i + 0.02, peak, { fill: 'accent', fillAlpha: 0.55, stroke: false });
            sB.rect(i + 0.02, 0, i + 0.42, trough + (i === 1 ? 0 : 0), { fill: 'orange', fillAlpha: 0.55, stroke: false });
          }
          sB.hline(R, { color: 'green', dash: true, width: 1.6 });
          sB.hline(R * r, { color: 'green', dash: true, width: 1, alpha: 0.6 });
          sB.text(`R = ${fx(R, 3)}`, n + 1, R, { size: 11, color: 'green', align: 'right', baseline: 'bottom' });
          sR.fn((u) => 1 / (1 - 2 ** -u), { domain: [0.1, 6], color: 'accent', width: 2.2 });
          sR.hline(1, { color: 'muted', dash: true, width: 1 });
          sR.text('at τ = t½, R = 2', 1, 2, { size: 10.5, color: 'muted', dx: 14, dy: -12, align: 'left' });
          const n90 = Math.ceil(Math.log(0.1) / Math.log(r));
          info = { peak: sum, R, r, n, n90, sumDirect: (1 - r ** n) / (1 - r) };
        });
        v.legend([['accent', 'peak after dose $n$'], ['orange', 'trough before dose n'], ['green', 'steady-state limit', { dash: true }]]);
        v.readout(() => `$r=2^{-\\tau/t_{1/2}}=${v.fix(info.r, 4)}$; sum of ${info.n} terms $=${v.fix(info.peak, 4)}$ vs closed form $(1-r^{${info.n}})/(1-r)=${v.fix(info.sumDirect, 4)}$; limit $R=1/(1-r)=${v.fix(info.R, 4)}$. Within 10 % of steady state after ${info.n90} dose${info.n90 === 1 ? '' : 's'} (about 3.3 half-lives).`);
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Average steady-state concentration = F·Dose/(CL·τ)',
      statement: String.raw`With linear kinetics and equal doses $D$ (bioavailable fraction $F$) every $\tau$, the average concentration over a dosing interval at steady state is $\bar C_{ss}=\dfrac{1}{\tau}\int_0^\tau C_{ss}(t)\,dt=\dfrac{F\,D}{\mathrm{CL}\,\tau}$: dosing rate divided by clearance. It does not depend on the volume of distribution or on the absorption rate.`,
      idea: String.raw`The area under one single-dose curve is $F D/\mathrm{CL}$ (pharm-1.5). At steady state the superposed tails of all earlier doses fill each interval, and the area per interval equals the area of one complete dose curve (the part of its tail falling into later intervals is exactly compensated by the earlier tails entering this one). Dividing the area $FD/\mathrm{CL}$ by $\tau$ gives the mean. Absorption speed reshapes the curve but cannot change its area.

Passing from finitely many previous doses to the periodic profile needs a justified limit under the integral. For these positive-rate one-compartment IV or Bateman responses, the old-dose tails on one dosing interval are bounded by a summable geometric sequence (with an additional linear age factor in the equal-rate Bateman case). The partial sums therefore converge uniformly on that interval. Uniform convergence and integration, pma 7.16, let their integrals tend to the integral of the periodic profile; partitioning the single-dose time axis into consecutive intervals gives the full single-dose AUC. This is a steady-state limit, not the area during a finite startup interval.`,
      caption: String.raw`Steady-state profiles for an IV bolus, a fast oral dose and a slow oral dose of the same drug and dose. Their peaks and troughs differ, but the numerically averaged level (Simpson) is the same for all three and equals the dashed formula. Choose the **interval** to see the average in the first interval, the third, or at steady state; only at steady state does it equal $FD/(\mathrm{CL}\tau)$.`,
      scope: String.raw`Linear, time-invariant kinetics. With saturable elimination or changing clearance the average is not given by this formula (chapter 5).`,
      deps: ['pharm-4.2', 'pharm-1.5', 'pma-7.16'],
      refs: ['Rowland–Tozer'],
      tags: ['steady state', 'clearance'],
      viz(v) {
        const D = 200, V = 40;
        const CL = v.slider('clearance CL (L/h)', 1, 15, 4, { step: 0.1 });
        const tau = v.slider('interval $\\tau$ (h)', 4, 36, 12, { step: 1 });
        const F = v.slider('bioavailability $F$', 0.2, 1, 0.8, { step: 0.05 });
        const which = v.select('interval', [{ value: 1, label: 'first' }, { value: 3, label: 'third' }, { value: 0, label: 'steady state' }], 0);
        const s = v.stage({ x: [0, 12], y: [0, 10], axes: 'box', gutter: true, xlabel: 'time within the interval (h)', ylabel: 'C (mg/L)', height: 340 });
        const curves = [['iv', 'IV bolus', 'accent', Infinity], ['fast', 'oral, fast ($k_a=3$)', 'orange', 3], ['slow', 'oral, slow ($k_a=0.25$)', 'purple', 0.25]];
        let info = null;
        v.render(() => {
          const k = CL.value / V, T = tau.value, n = which.value;
          const target = (F.value * D) / (CL.value * T);
          const res = curves.map(([id, nm, col, ka]) => {
            const Fe = id === 'iv' ? 1 : F.value; // IV: F = 1 (no absorption loss); oral doses carry F
            const g = (t) => {
              if (n === 0) return cSS(t, T, D * Fe, V, k, ka);
              let c = 0; for (let m = 0; m < n; m++) c += cSingle(t + m * T, D * Fe, V, k, ka); return c;
            };
            return { id, col, g, mean: meanOver(g, 0, T), ex: extrema(g, 0, T, 300), Fe };
          });
          const top = Math.max(...res.map((r) => r.ex.hi), target) * 1.15;
          s.setView([0, T], [0, top]);
          res.forEach((r) => s.fn(r.g, { domain: [0, T], color: r.col, width: 2.2 }));
          res.forEach((r) => s.hline(r.mean, { color: r.col, dash: [3, 5], width: 1, alpha: 0.7 }));
          s.hline((n === 0 ? 1 : 1) * target, { color: 'green', dash: true, width: 1.8 });
          info = { res, target, n };
        });
        v.legend(curves.map(([, nm, col]) => [col, nm]).concat([['green', '$F D/(\\mathrm{CL}\\,\\tau)$ (oral $F$)', { dash: true }]]));
        v.readout(() => `Average over the interval: ${info.res.map((r) => `${r.id === 'iv' ? 'IV' : r.id} $=${v.fix(r.mean, 3)}$`).join(', ')} mg/L. Formula for the oral doses $F D/(\\mathrm{CL}\\tau)=${v.fix(info.target, 3)}$ mg/L${info.n === 0 ? '' : '; **not yet at steady state**, so the means are lower'}. (The IV curve is drawn with $F=1$, so its formula value is $D/(\\mathrm{CL}\\tau)=${v.fix(info.target / F.value, 3)}$.)`);
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Concept',
      name: 'Peak–trough fluctuation and the dosing interval',
      statement: String.raw`Fix the daily dose (hence the same average concentration $\bar C_{ss}$, pharm-4.3) and split it into $N$ equal doses at interval $\tau=24/N$ h. For an IV bolus the steady-state peak-to-trough ratio is $C_{\max}/C_{\min}=e^{k\tau}=2^{\tau/t_{1/2}}$, so the fluctuation $(C_{\max}-C_{\min})/\bar C_{ss}$ shrinks as $\tau/t_{1/2}\to 0$ and the profile flattens toward a constant infusion.`,
      idea: String.raw`Between doses the concentration only decays by the factor $e^{-k\tau}$, whatever the dose size; the accumulation factor of pharm-4.2 fixes the level at which that decay starts. Splitting the dose lowers each jump but not the mean (pharm-4.3), so the swing relative to the mean decreases with $\tau$. A drug with a half-life much longer than $\tau$ is already nearly flat; a short half-life gives large swings unless doses are frequent.`,
      caption: String.raw`Choose how many doses per day and the half-life. The thick curve is the chosen regimen at steady state, the faint red curve is once-daily dosing of the same daily amount. The bars (right) give the fluctuation index for every regimen; the mean (dashed) stays put.`,
      scope: String.raw`Linear kinetics. Oral absorption blunts the peak, so fluctuation is smaller than the IV value for the same $\tau$ (switch the route to see how much). Smaller swings are not always better: some drugs act through the peak (concentration-dependent antibiotics, pharm-4.9).`,
      deps: ['pharm-4.2'],
      refs: ['Rowland–Tozer'],
      tags: ['fluctuation', 'dosing interval'],
      viz(v) {
        const Dday = 480, V = 40;
        const t12 = v.slider('half-life $t_{1/2}$ (h)', 1, 48, 6, { step: 0.5 });
        const N = v.select('doses per day', [1, 2, 3, 4, 6, 8, 12].map((n) => ({ value: n, label: String(n) })), 2);
        const route = v.select('route', [{ value: 'iv', label: 'IV bolus' }, { value: 'po', label: 'oral ($k_a=1.5$)' }], 'iv');
        const sP = v.stage({ x: [0, 48], y: [0, 10], axes: 'box', gutter: true, xlabel: 'time (h), steady state', ylabel: 'C (mg/L)', height: 330, weight: 1.3, minWidth: 280 });
        const sF = v.stage({ x: [0, 8], y: [0, 4], axes: 'box', gutter: true, xlabel: 'doses per day', ylabel: '(Cmax − Cmin) / mean', height: 330, weight: 0.9, minWidth: 240, xticks: [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [6, '6'], [8, '8'], [12, '12']] });
        const Ns = [1, 2, 3, 4, 6, 8, 12];
        let info = null;
        v.render(() => {
          const k = LN2 / t12.value, ka = route.value === 'iv' ? Infinity : 1.5;
          const prof = (n) => { const T = 24 / n, d = Dday / n; return { T, g: (t) => cSS(t, T, d, V, k, ka), f: (t) => cSS(((t % T) + T) % T, T, d, V, k, ka), d }; };
          const stat = (n) => { const p = prof(n); const e = extrema(p.g, 0, p.T, 240), m = meanOver(p.g, 0, p.T, 240); return { ...e, m, fl: (e.hi - e.lo) / m }; };
          const sel = stat(N.value), one = stat(1);
          const meanC = Dday / (clOf0(k, V) * 24);
          sP.setView([0, 48], [0, Math.max(sel.hi, one.hi) * 1.15]);
          const p1 = prof(1), pS = prof(N.value);
          sP.fn((t) => p1.f(t), { domain: [0, 48], color: 'red', alpha: 0.45, width: 1.4, n: 600 });
          sP.fn((t) => pS.f(t), { domain: [0, 48], color: 'accent', width: 2.6, n: 900 });
          sP.hline(meanC, { color: 'green', dash: true, width: 1.5 });
          const stats = Ns.map(stat);
          sF.setView([0, 13], [0, Math.max(1, ...stats.map((x) => x.fl)) * 1.2]);
          Ns.forEach((n, i) => sF.rect(n - 0.4, 0, n + 0.4, stats[i].fl, { fill: n === N.value ? 'accent' : 'muted', fillAlpha: n === N.value ? 0.7 : 0.25, stroke: false }));
          info = { sel, one, ratio: sel.hi / sel.lo, ex: Math.pow(2, 24 / N.value / t12.value), m: sel.m, meanC, iv: route.value === 'iv' };
        });
        v.legend([['accent', 'chosen regimen'], ['red', 'once daily', { dash: false }], ['green', 'mean $FD/(\\mathrm{CL}\\tau)$', { dash: true }]]);
        v.readout(() => `${N.value} dose${N.value > 1 ? 's' : ''} per day: peak $=${v.fix(info.sel.hi, 2)}$, trough $=${v.fix(info.sel.lo, 2)}$ mg/L, ratio $=${v.fix(info.ratio, 3)}$${info.iv ? ` (formula $2^{\\tau/t_{1/2}}=${v.fix(info.ex, 3)}$)` : ''}; fluctuation $=${v.fix(info.sel.fl, 2)}$ vs once-daily $${v.fix(info.one.fl, 2)}$. Numerical mean $=${v.fix(info.m, 3)}$, formula $=${v.fix(info.meanC, 3)}$ mg/L.`);
        function clOf0(k, V) { return k * V; }
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Concept',
      name: 'Therapeutic window and target concentration',
      statement: String.raw`A **therapeutic window** summarizes concentration ranges associated with benefit and adverse effects. Its limits depend on indication, sampling time and individual sensitivity; they are not switches that guarantee efficacy or toxicity. In a linear model, the mean steady concentration is $\bar C=FD/(\mathrm{CL}\tau)$, while absorption and the interval shape the peak and trough. A comparison band lets us study these mathematical constraints without turning a concentration curve into a clinical outcome prediction.`,
      idea: String.raw`Changing dose scales the whole curve; changing interval also changes its shape. Centring the mean inside a chosen band does not ensure that every point lies inside it. The drug labels illustrate why interpretation matters: theophylline's label discusses a 10–15 mg/L peak range for balancing benefit and risk and adverse effects even below 20 mg/L; digoxin's label relates lower efficacy to levels below 0.5 ng/mL and higher risk above 2 ng/mL, while noting that toxicity can occur lower and that sample timing matters. The displayed green bands are chosen reference comparisons, not universal treatment targets.`,
      caption: String.raw`Choose a preset and vary dose and interval. The solid curve shows the **periodic steady state**; the faint dashed curve shows accumulation from an initially drug-free model. **Centre on target** puts the model mean at the geometric middle of the chosen band. The readout gives the exact peak, trough and fraction of a steady cycle inside that band.`,
      scope: String.raw`One compartment, first-order absorption and elimination, chosen 70 kg body mass and rounded teaching pharmacokinetic presets; no nonlinear clearance, distribution phase or individual response model. Bands remain 10–20 mg/L for theophylline and 0.5–2 ng/mL for digoxin solely as comparison ranges. The directly read labels do not establish that remaining in these bands is safe, that all values outside are ineffective/toxic, or that the same range applies to peaks and troughs. The model's dose and interval controls are mathematical inputs, not patient-specific recommendations.`,
      verify: false,
      deps: ['pharm-4.4'],
      refs: ['Theophylline extended-release official label, DailyMed setid9591d4db-2b88-4f0f-b61e-64ba67626e3d, Clinical Pharmacology/Serum Concentration-Effect Relationship and Adverse Reactions', 'Digoxin official label, DailyMed setidf9897bec-c16f-2728-e053-6394a90aecb7, sections2.5 and5.3; both read2026-10-19'],
      links: { source: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9591d4db-2b88-4f0f-b61e-64ba67626e3d' },
      tags: ['therapeutic window', 'target concentration'],
      viz(v) {
        const cfg=WINDOW_PRESETS;
        const drug = v.select('drug (teaching preset)', [{ value: 'theo', label: 'theophylline' }, { value: 'digo', label: 'digoxin' }], 'theo');
        const dose = v.slider('dose per administration (mg)', 0.0125, 2000, 500, { step: 0.0125, log: true, sig: 3, fmt:x=>v.fix(x,x<1?4:2) });
        const tau = v.slider('interval $\\tau$ (h)', 2, 48, 12, { step: 1 });
        v.button('centre on target',()=>dose.set(clamp(centeredWindowDose(cfg[drug.value],tau.value),.0125,2000)));
        let last = 'theo';
        const s = v.stage({ x: [0, 120], y: [0, 30], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C', height: 340 });
        let info = null;
        v.render(() => {
          const c = cfg[drug.value];
          if (last !== drug.value) { last = drug.value; dose.set(c.dose); tau.set(c.tau); }
          const profile=windowProfile(c,dose.value,tau.value),{V,k,T,D}=profile,tShow=clamp(6*c.d.t12,4*T,300),times=[];
          for(let t=0;t<tShow;t+=T)times.push(t);
          const f=t=>cMulti(t,times,V,k,c.ka,0,D),ss=t=>profile.C(((t%T)+T)%T),ex={hi:profile.peak,lo:profile.trough};
          s.setView([-tShow*.015,tShow*1.015],[-Math.max(c.hi,ex.hi)*.04,Math.max(c.hi*1.4,ex.hi*1.15)]);
          s.setLabels(undefined, `C (${c.unit})`);
          s.hband(c.lo, c.hi, { color: 'green', alpha: 0.16 });
          s.hline(c.lo, { color: 'green', width: 1.2, dash: true }); s.hline(c.hi, { color: 'red', width: 1.2, dash: true });
          s.fn(f,{domain:[0,tShow],color:'muted',dash:[5,4],width:1.4,n:900});s.fn(ss,{domain:[0,tShow],color:'accent',width:2.5,n:900});
          s.text('upper reference', tShow, c.hi, { size: 10.5, color: 'red', align: 'right', baseline: 'bottom' });
          s.text('lower reference', tShow, c.lo, { size: 10.5, color: 'green', align: 'right', baseline: 'top' });
          info = { ex, inside:profile.inside, mean:profile.mean, c };
        });
        v.legend([['accent','periodic steady state'],['muted','accumulation from zero',{dash:true}],['green','chosen comparison band',{area:true}]]);
        v.readout(()=>`Steady model: peak ${fx(info.ex.hi)}, trough ${fx(info.ex.lo)}, mean ${fx(info.mean)} ${info.c.unit}; chosen band ${info.c.lo}–${info.c.hi}. Fraction of a cycle in the band: ${v.fix(100*info.inside,2)}%${info.ex.hi>info.c.hi?'; peak exceeds upper reference':''}${info.ex.lo<info.c.lo?'; trough below lower reference':''}`);

      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num:'4.6',kind:'Model',name:'Renal clearance and model dose-rate adjustment',
      statement:String.raw`The historical Cockcroft–Gault equation estimates creatinine clearance in mL/min as $\mathrm{CrCl}=(140-\mathrm{age})\,W/(72S_{cr})$, with weight in kg, serum creatinine in mg/dL and a factor 0.85 in the authors' female correction. This is an estimate of creatinine clearance, not an indexed GFR or direct drug-clearance measurement. For a chosen model whose renal fraction is $f_e$, assume $K_F=\min(\mathrm{CrCl}/120,1)$ and total-clearance ratio $Q=(1-f_e)+f_eK_F$. Equal mean steady concentrations then require equal dose-rate/clearance ratios.`,
      idea:String.raw`If only the renal component scales with the chosen kidney-function fraction, the remaining component contributes $1-f_e$ of reference clearance. Reducing each model dose by $Q$ or lengthening its interval by $1/Q$ both restore the reference mean. They give different peaks and troughs. The cap at $K_F=1$ explicitly confines this example to impairment relative to its chosen reference; the raw estimated creatinine clearance is displayed without an artificial minimum.`,
      caption:String.raw`Vary the historical equation's inputs and the model renal fraction. Every curve is a **periodic steady state**: dashed grey is the reference, red keeps the usual model regimen, blue reduces its dose and orange lengthens its interval. Mean lines show that both modified regimens restore the reference mean. Dose jumps are drawn exactly, including long intervals that exceed the 96-hour view.`,
      scope:String.raw`Cockcroft and Gault derived their relation from adult male data; their original discussion addresses steady renal function, muscle mass, body size and creatinine-assay limitations, and proposes a 15% female reduction. The present body-weight control is a mathematical input; it does not choose a clinically appropriate weight. The separate drug model assumes unchanged nonrenal clearance, proportional renal drug clearance, fixed volume 40 L and reference half-life 6 h, dose 200 mg, interval 8 h and CrCl 120 mL/min. These chosen values and the dose-rate comparison do not constitute a patient dosing rule.`,
      verify: false,credit:'Cockcroft & Gault, 1976 (historical creatinine-clearance equation)',links:{doi:'https://doi.org/10.1159/000180580'},deps:['physio-7.5','pharm-4.3'],refs:['Cockcroft & Gault, Prediction of Creatinine Clearance from Serum Creatinine, Nephron16:31–41 (1976); complete original paper read, especially Methods, equation3 and Discussion pp38–40, 2026-10-19'],tags:['renal clearance','dose adjustment'],
      viz(v){
        const age=v.slider('age (years)',20,90,70,{int:true}),wt=v.slider('weight input (kg)',40,120,70,{int:true}),scr=v.slider('serum creatinine (mg/dL)',.5,6,2.4,{step:.1}),sex=v.select('historical equation factor',[{value:'m',label:'male (×1)'},{value:'f',label:'female (×0.85)'}],'m'),fe=v.slider('renal drug-clearance fraction $f_e$',0,1,.8,{step:.05});
        const s=v.stage({x:[-1.5,97.5],y:[-.5,10],axes:'box',gutter:true,xlabel:'time (h)',ylabel:'periodic C (mg/L)',height:340});let info;
        v.render(()=>{
          const p=renalRegimens(age.value,wt.value,scr.value,sex.value==='f',fe.value),regimens=[p.normal,p.unadjusted,p.reduced,p.lengthened],top=Math.max(...regimens.map(r=>r.peak))*1.12,colors=['muted','red','blue','orange'];
          s.setView([-1.5,97.5],[-top*.03,top]);
          regimens.forEach((r,i)=>s.path(renalVertices(r),{color:colors[i],width:i?2.2:1.3,dash:i?false:[5,3]}));
          s.hline(p.unadjusted.mean,{color:'red',dash:true,width:1});s.hline(p.normal.mean,{color:'green',dash:true,width:1.5});
          info={...p,inputs:[age.value,wt.value,scr.value,sex.value,fe.value]};
        });
        v.legend([['muted','reference periodic profile',{dash:true}],['red','same regimen, reduced clearance'],['blue','model dose ×Q'],['orange','model interval ÷Q'],['green','reference/restored mean',{dash:true}]]);
        v.readout(()=>`Historical CrCl estimate ${v.fix(info.crcl,2)} mL/min; raw ratio ${v.fix(info.rawFraction,3)}, model capped ratio ${v.fix(info.kidneyFraction,3)}; Q=${v.fix(info.Q,4)}. Model comparisons: ${v.fix(info.reduced.dose,2)} mg every 8 h or 200 mg every ${v.fix(info.lengthened.interval,2)} h. Periodic means: unmodified ${v.fix(info.unadjusted.mean,3)}, dose-reduced ${v.fix(info.reduced.mean,3)}, interval-lengthened ${v.fix(info.lengthened.mean,3)} mg/L; reference ${v.fix(info.normal.mean,3)} mg/L.`);
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Phenomenon',
      name: 'Missed doses and adherence',
      statement: String.raw`When planned doses are taken independently with probability $a$ (adherence), the expected dosing rate is $a\cdot D/\tau$, and the realized long-run rate tends to this value almost surely. In the fixed linear model the long-run time-mean concentration is $a\bar C_{ss}$; a finite record need not have that mean. A short half-life relative to the interval can let a missed dose take the model curve below a chosen comparison band, while a long half-life averages contributions from many earlier doses. This mathematical smoothing does not guarantee efficacy or safety after a miss.`,
      idea: String.raw`The concentration is the superposition of the doses actually taken (pharm-4.1): each missed dose deletes one term. The missing single-dose contribution has a decaying tail; one elimination half-life halves its terminal component rather than ending its effect. The relevant comparison is this decay time against the dosing interval. With a long half-life the missing term is small relative to the stored sum from many earlier doses; with a short one it is most of the signal.

Write the taken-dose indicators as independent Bernoulli variables B_j with mean a. Linearity of expectation (prob 1.6.1) gives expected input $aND$ over N planned doses and, in a stationary dosing history, expected concentration equal to a times the perfect-adherence periodic curve. The strong law prob 2.4.1 applies because these indicators are identically distributed, pairwise independent and bounded: their realized average tends to a almost surely. Integrated mass balance over N intervals then gives the same long-run time-mean concentration, since the remaining gut/body amount is bounded for fixed positive rates and contributes a vanishing endpoint term after division by N. This is an asymptotic model result; the finite 14-day history with a perfect-adherence lead-in and the 60-member sampled band statistic are not exact realizations of that mean.`,
      caption: String.raw`A 14-day record of once-daily oral dosing with misses drawn at random for the chosen adherence (the same seed for every slider position; **resample** draws a new patient). Faint curve: perfect adherence. The band is an illustrative window of 0.5–1.5 times the planned mean. The readout also averages 60 simulated patients, so a short and a long half-life can be compared on the same adherence.`,
      scope: String.raw`Model: independent misses, no “catching up”, a fixed dose time each day, oral absorption $k_a=1.5$ h$^{-1}$, history of perfect adherence before day 0. Real adherence can be patterned (drug holidays or clustered misses), changing gap lengths and band occupancy; these patterns are outside the independent-miss argument. The window is illustrative, not drug-specific.`,
      deps: ['pharm-4.1', 'prob-1.6.1', 'prob-2.4.1'],
      refs: ['Rowland–Tozer'],
      tags: ['adherence', 'missed doses'],
      viz(v) {
        const V = 40, D = 100, ka = 1.5, tau = 24, days = 14, lead = 20;
        const adh = v.slider('adherence $a$', 0.4, 1, 0.8, { step: 0.05 });
        const t12 = v.slider('half-life $t_{1/2}$ (h)', 2, 120, 8, { step: 1, log: true, sig: 2 });
        let seed = 7;
        v.button('resample', () => { seed++; });
        const s = v.stage({ x: [0, days * 24], y: [0, 2.2], axes: 'box', gutter: true, xlabel: 'time (days)', ylabel: 'C / planned mean', height: 340, xticks: Array.from({ length: days + 1 }, (_, i) => [i * 24, i % 2 ? '' : String(i)]) });
        const cache = memo();
        let info = null;
        v.render(() => {
          const k = LN2 / t12.value, mean0 = D / (k * V * tau);
          const taken = (rng) => { const a = []; for (let n = -lead; n < 0; n++) a.push(n * tau); for (let n = 0; n < days; n++) if (rng() < adh.value) a.push(n * tau); return a; };
          const grid = []; for (let t = 0; t <= days * 24; t += 1) grid.push(t);
          const curve = (ts) => grid.map((t) => cMulti(t, ts, V, k, ka, 0, D) / mean0);
          const below = (ys) => { let n = 0; for (let i = 0; i < ys.length; i++) if (ys[i] < 0.5) n++; return n / ys.length; };
          const res = cache(`${seed}|${adh.value}|${t12.value}`, () => {
            const r = v.rng(seed * 101 + 5);
            const mine = taken(() => r.uniform(0, 1));
            const myc = curve(mine);
            const perfect = curve(taken(() => 0));
            const rr = v.rng(999); let sum = 0; const S = 60;
            for (let i = 0; i < S; i++) sum += below(curve(taken(() => rr.uniform(0, 1))));
            return { mine, myc, perfect, mc: sum / S, missed: days - mine.filter((t) => t >= 0).length };
          });
          s.hband(0.5, 1.5, { color: 'green', alpha: 0.13 });
          s.path(grid.map((t, i) => [t, res.perfect[i]]), { color: 'muted', alpha: 0.6, width: 1.3 });
          s.path(grid.map((t, i) => [t, res.myc[i]]), { color: 'accent', width: 2.4 });
          for (let n = 0; n < days; n++) {
            const was = res.mine.includes(n * tau);
            s.dot(n * tau, 0.05, { r: 3.5, color: was ? 'green' : 'red', hollow: !was });
          }
          info = { res, below: below(res.myc), perfect: below(res.perfect) };
        });
        v.legend([['accent', 'this patient'], ['muted', 'perfect adherence'], ['green', 'dose taken', { dot: true }], ['red', 'dose missed', { dot: true }]]);
        v.readout(() => `${info.res.missed} of ${days} doses missed. Time below 0.5 × planned mean: **${v.fix(100 * info.below, 0)}%** (perfect adherence ${v.fix(100 * info.perfect, 0)}%); average over 60 simulated patients ${v.fix(100 * info.res.mc, 0)}%.`);
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Concept',
      name: 'Zero-order and sustained-release delivery',
      statement: String.raw`At a fixed daily dose the average concentration is fixed (pharm-4.3), so a delivery form can change only the **shape** of the steady-state profile. Slowing first-order release (small $k_a$) lowers and delays the peak; releasing at a constant, zero-order rate $D/T$ over a time $T$ (a patch, an osmotic pump, an infusion) does so more completely, and for $T=\tau$ the steady-state concentration is constant, $\bar C_{ss}$, with no fluctuation.`,
      idea: String.raw`The area under each single-dose curve is the same, $FD/\mathrm{CL}$, whatever the release (pharm-1.5), and so is the mean. What changes is how that area is spread in time: a zero-order input with duration $T$ is a rectangle of rate $D/T$, whose response $\tfrac{D}{TkV}(1-e^{-kt})$ rises smoothly, and consecutive rectangles abut to a constant rate. Note that “zero-order” here describes the **input**; elimination is still first-order (not the saturation of chapter 5).`,
      caption: String.raw`Steady-state profiles for the same daily dose given three ways: immediate release ($k_a=3$ h$^{-1}$), a first-order slow release (drag $k_a$), and a zero-order release lasting $T$ hours of each interval (drag $T$). Dashed line: the common mean. The readout lists the fluctuation index $(C_{\max}-C_{\min})/\bar C$ of each.`,
      scope: String.raw`Linear elimination and complete release inside the absorption window; real sustained-release forms are limited by transit through the gut and by gastric emptying. Model values only (V = 40 L, daily dose 240 mg).`,
      deps: ['pharm-2.4', 'pharm-2.7'],
      refs: ['Rowland–Tozer'],
      tags: ['sustained release', 'zero-order input'],
      viz(v) {
        const V = 40, Dday = 240;
        const t12 = v.slider('half-life $t_{1/2}$ (h)', 1, 24, 4, { step: 0.5 });
        const tau = v.select('interval $\\tau$', [{ value: 12, label: '12 h' }, { value: 24, label: '24 h' }], 24);
        const kaS = v.slider('slow-release $k_a$ (h$^{-1}$)', 0.05, 1, 0.2, { step: 0.01, log: true, sig: 2 });
        const Tz = v.slider('zero-order release time $T$ (h)', 1, 24, 24, { step: 1 });
        const s = v.stage({ x: [0, 48], y: [0, 10], axes: 'box', gutter: true, xlabel: 'time (h), steady state', ylabel: 'C (mg/L)', height: 340 });
        let info = null;
        v.render(() => {
          const k = LN2 / t12.value, T = tau.value, D = (Dday * T) / 24, Tr = Math.min(Tz.value, T);
          const forms = [['immediate', 'accent', Infinity, 0], ['slow first-order', 'orange', kaS.value, 0], ['zero-order', 'green', Infinity, Tr]];
          const prof = forms.map(([nm, col, ka, Tz_]) => ({ nm, col, g: (t) => cSS(t, T, D, V, k, ka, Tz_), f: (t) => cSS(((t % T) + T) % T, T, D, V, k, ka, Tz_), T }));
          const stats = prof.map((p) => { const e = extrema(p.g, 0, T, 360), m = meanOver(p.g, 0, T, 360); return { ...e, m, fl: (e.hi - e.lo) / m }; });
          s.setView([0, 48], [0, Math.max(...stats.map((x) => x.hi)) * 1.15]);
          prof.forEach((p) => s.fn(p.f, { domain: [0, 48], color: p.col, width: 2.2, n: 900 }));
          s.hline(D / (k * V * T), { color: 'muted', dash: true, width: 1.3 });
          info = { stats, forms, mean: D / (k * V * T) };
        });
        v.legend([['accent', 'immediate release'], ['orange', 'slow first-order'], ['green', 'zero-order (constant rate)'], ['muted', 'common mean', { dash: true }]]);
        v.readout(() => `Mean: ${info.stats.map((x) => v.fix(x.m, 3)).join(' / ')} mg/L (formula ${v.fix(info.mean, 3)}). Fluctuation index: immediate $${v.fix(info.stats[0].fl, 2)}$, slow $${v.fix(info.stats[1].fl, 2)}$, zero-order $${v.fix(info.stats[2].fl, 2)}$.`);
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num:'4.9',kind:'Model',name:'Intermittent infusion and aminoglycoside schedules',
      statement:String.raw`For linear elimination, equal total daily input gives the same **steady-state** daily AUC, $\mathrm{AUC}_{24}=D_{day}/\mathrm{CL}$, for different infusion intervals. Peak and trough still change. With equal 30-minute infusion durations, the q24h/q8h steady-peak ratio is $3(1-e^{-8k})/(1-e^{-24k})$: it approaches three for rapid elimination but approaches one for slow elimination. Equal steady exposure does not imply equal startup exposure or equal clinical outcomes.`,
      idea:String.raw`The exact periodic curve follows from accumulation of identical finite infusions. Its peak occurs at infusion end, then declines exponentially until the next infusion. AUC depends on daily input and clearance, while the interval changes accumulation, peak/MIC and time below MIC. These are concentration summaries; this example contains no bacterial killing, post-antibiotic-effect, kidney-toxicity or hearing-loss model.`,
      caption:String.raw`Compare q8h, q12h and q24h for the same chosen daily input. Solid: exact periodic steady concentration. Faint dashed: accumulation from zero. The shaded region lies below the chosen MIC; the readout gives exact steady peak/trough and duration below MIC. Infusion-end vertices are included explicitly so the drawn peaks match the reported ones.`,
      scope:String.raw`Chosen gentamicin-like teaching model: one compartment, 17.5 L volume, 30-minute infusions, adjustable first-order half-life and no binding. Barza and colleagues' 1996 original meta-analysis examined 21 randomized trials, mainly without pre-existing renal impairment. Clinical-failure results varied across trials; ototoxicity evidence was underpowered, and the nephrotoxicity estimate depended on pooling method. Those aggregate clinical results do not validate this model's MIC target, doses or individual efficacy/safety; no universal peak/MIC target is asserted.`,
      verify: false,deps:['pharm-4.1','pharm-2.4'],refs:['Barza, Ioannidis, Cappelleri & Lau, Single or multiple daily doses of aminoglycosides: a meta-analysis, BMJ312:338–345 (1996), Methods, Results/Figures1–2 and Discussion read in original scans 2026-10-19; DOI10.1136/bmj.312.7027.338'],links:{source:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2350289/'},tags:['aminoglycoside','infusion'],
      viz(v){
        const daily=v.slider('daily input (mg/kg/day)',3,7,5,{step:.5}),t12=v.slider('model half-life $t_{1/2}$ (h)',1.5,12,2.5,{step:.1}),mic=v.slider('comparison MIC (mg/L)',.25,8,1,{log:true,sig:2}),freq=v.select('schedule',[{value:8,label:'q8h'},{value:12,label:'q12h'},{value:24,label:'q24h'}],8),s=v.stage({x:[-1,73],y:[-.5,40],axes:'box',gutter:true,xlabel:'time (h)',ylabel:'C (mg/L)',height:340});let info;
        v.render(()=>{
          const p=infusionRegimen(daily.value,t12.value,mic.value,Number(freq.value)),top=Math.max(p.peak,mic.value)*1.15;
          s.setView([-1,73],[-top*.03,top]);s.hband(0,mic.value,{color:'red',alpha:.15});s.hline(mic.value,{color:'red',width:1.3,dash:true});
          s.path(infusionVertices(p,false),{color:'muted',dash:[5,4],width:1.3});s.path(infusionVertices(p),{color:'accent',width:2.4});s.text('comparison MIC',72,mic.value,{size:10.5,color:'red',align:'right',baseline:'bottom'});
          info={...p,inputs:[daily.value,t12.value,mic.value,Number(freq.value)]};
        });
        v.legend([['accent','periodic steady concentration'],['muted','accumulation from zero',{dash:true}],['red','below comparison MIC',{area:true}]]);
        v.readout(()=>`Model input ${v.fix(info.D,1)} mg every ${info.interval} h: steady peak ${v.fix(info.peak,3)}, trough ${v.fix(info.trough,4)} mg/L; peak/MIC ${v.fix(info.ratio,3)}. Exact steady time below MIC ${v.fix(info.belowHours,3)} h/day; steady AUC24 ${v.fix(info.auc24,3)} mg·h/L = daily input/clearance. This AUC identity describes the periodic state, not the first 24 hours after starting.`);
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Concept',
      name: 'Allometric dose scaling across species',
      statement: String.raw`Physiological quantities scale with body mass $W$ as power laws $Y=aW^{b}$: clearance and metabolic rate with $b\approx 0.75$, volumes with $b\approx 1$, and hence half-lives $\propto W^{1/4}$. On log–log axes the data of several species fall near a line, so a regression on animal values can be extrapolated to a human; per kilogram, clearance is lower in larger animals ($\propto W^{-1/4}$), which is why mg/kg doses do not transfer.`,
      idea: String.raw`If the rates of the underlying physiological processes follow the quarter-power laws of metabolic scaling (ecol-1.5, Kleiber's law), then any clearance that is proportional to those processes inherits the exponent about $3/4$; volumes follow organ and body size. A linear fit of $\log Y$ on $\log W$ (a power law, ecol-1.4) turns the extrapolation into a straight line. It works best for drugs cleared by blood flow and organ size, and badly when a species-specific enzyme or transporter is involved.`,
      caption: String.raw`Five species on log–log axes, with simulated values: a hidden power law with the exponent of the chosen quantity, log-normal scatter (slider) and a **human deviation** slider that moves the human away from the animals' line (as species-specific metabolism does). The accent line is fitted to the four animals and extrapolated to 70 kg; the green dashed line is the true exponent. Read the prediction error as a fold-change.`,
      scope: String.raw`The exponents 0.75 and 1 are typical, not exact (fitted exponents for clearance in practice vary widely with drug and species set). The values shown are a model/reconstruction generated from the sliders, not measured data. Prediction from four animals carries a large uncertainty (shown as the readout's fold-range); allometry is a first estimate, not a substitute for human data.`,
      credit: 'Dedrick, 1973; Boxenbaum, 1982',
      links: { doi: 'https://doi.org/10.1007/bf01062336' },
      deps: ['ecol-1.5'],
      see: ['ecol-1.4'],
      refs: ['Rowland–Tozer'],
      tags: ['allometry', 'scaling'],
      viz(v) {
        const sp = [['mouse', 0.02], ['rat', 0.25], ['monkey', 5], ['dog', 10], ['human', 70]];
        const qty = v.select('quantity', [{ value: 0.75, label: 'clearance ($b=0.75$)' }, { value: 1, label: 'volume ($b=1$)' }, { value: 0.25, label: 'half-life ($b=0.25$)' }], 0.75);
        const scatter = v.slider('scatter (ln s.d.)', 0, 0.6, 0.2, { step: 0.02 });
        const dev = v.slider('human deviation (fold)', 0.25, 4, 1, { step: 0.05, log: true, sig: 2 });
        let seed = 3; v.button('resample', () => { seed++; });
        const s = v.stage({ x: [0.01, 200], y: [0.1, 100000], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'body mass (kg)', ylabel: 'CL (mL/min), log', height: 360 });
        const draw = memo();
        let info = null;
        v.render(() => {
          const b = qty.value, ref = 70 ** b; // anchor so that "typical human" = 100 units
          const noise = draw(`${seed}`, () => { const r = v.rng(seed * 13 + 1); return sp.map(() => r.normal()); });
          const vals = sp.map(([, W], i) => 100 * (W / 70) ** b * Math.exp(scatter.value * noise[i]) * (i === 4 ? dev.value : 1));
          const lw = sp.slice(0, 4).map(([, W]) => Math.log(W)), ly = vals.slice(0, 4).map(Math.log);
          const fit = v.M.linreg(lw, ly);
          const pred = Math.exp(fit.predict(Math.log(70)));
          s.setLabels(undefined, qty.value === 0.75 ? 'CL (mL/min), log' : qty.value === 1 ? 'V (L), log' : 'half-life (h), log');
          s.setView([0.01, 200], [Math.min(...vals) / 4, Math.max(...vals) * 4]);
          s.fn((W) => 100 * (W / 70) ** b, { domain: [0.01, 200], color: 'green', dash: true, width: 1.6 });
          s.fn((W) => Math.exp(fit.predict(Math.log(W))), { domain: [0.01, 200], color: 'accent', width: 2.2 });
          s.dot(70, pred, { r: 8, color: 'accent', hollow: true, label: 'predicted', labelPos: 'se' });
          sp.forEach(([nm, W], i) => s.dot(W, vals[i], { r: 5, color: i === 4 ? 'red' : 'gold', label: nm, labelPos: 'nw' }));
          info = { fit, pred, human: vals[4], fold: vals[4] / pred, b, perKg: (100 * (1 / 70) ** b) };
        });
        v.legend([['gold', 'animals (model values)', { dot: true }], ['red', 'human (model value)', { dot: true }], ['accent', 'fit to animals, extrapolated'], ['green', 'true exponent', { dash: true }]]);
        v.readout(() => `Fitted exponent $${v.fix(info.fit.slope, 2)}\\pm${v.fix(info.fit.seSlope, 2)}$ (generating value ${info.b}); predicted human ${v.fix(info.pred, 1)} vs model value ${v.fix(info.human, 1)}: error **${v.fix(info.fold, 2)}-fold**. Per kilogram, a value scaling as $W^{${info.b}}$ changes with mass like $W^{${v.fix(info.b - 1, 2)}}$.`);
      },
    },
  ],
};
