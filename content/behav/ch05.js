// Behavioural Economics — Chapter 5: Time preference and self-control (items 5.1–5.6; 5.7–5.11 in ch05-b.js)
//
// Sources checked (Oct 2026):
// - Bibliographic details confirmed in Crossref: Samuelson 1937 (Rev. Econ. Studies 4(2): 155–161), Strotz 1955 (Rev. Econ. Studies
//   23(3): 165–180), Phelps & Pollak 1968 (Rev. Econ. Studies 35(2): 185–199), Ainslie 1975 (Psychological Bulletin 82(4): 463–496),
//   Thaler 1981 (Economics Letters 8(3): 201–207), Laibson 1997 (QJE 112(2): 443–478), O'Donoghue & Rabin 1999 (AER 89(1): 103–124),
//   Kirby & Herrnstein 1995 (Psychological Science 6(2): 83–89), Green, Fristoe & Myerson 1994 (Psychonomic Bulletin & Review 1(3):
//   383–389), Frederick, Loewenstein & O'Donoghue 2002 (J. Economic Literature 40(2): 351–401). Their content is described
//   from memory and abstracts, not re-read, except as stated below.
// - Thaler 1981 numbers: the MIT 14.13 lecture notes (Spring 2004, lecture 16, read in the PDF) give "$15 now ~ $20 in one month" = 345% per
//   year and "$15 now ~ $100 in ten years" = 19% per year, computed as ln(X/15)/t; course slides found by search give $15 ~ $60
//   in one year = 139%, $250 ~ $350 = 34%, $3,000 ~ $4,000 = 29%. The original paper was not opened (verify: true on 5.3).
// - Mazur (1987) is credited with the hyperbola 1/(1 + kD) from memory; the chapter in Commons et al. (eds) was not found in Crossref.
// - Everything labelled "model" (the sliders, the reward pairs in 5.2 and 5.4, the task in 5.6) is an illustration computed for this page.
import { clamp, num, pct, usdC, usdR, dExp, dHyp, dQH, fx } from './ch05.shared.js';

const GUIDE = { color: 'muted', width: 1, dash: [4, 4] };

export default {
  collection: 'behav',
  chapter: 5,
  title: 'Time preference and self-control',
  summary: String.raw`The standard model discounts the future exponentially, which guarantees that today’s plans are still optimal tomorrow. People instead discount steeply for short delays and gently for long ones, so preferences reverse as the date approaches. The quasi-hyperbolic model captures this present bias, and whether people know about it (sophisticated) or not (naive) changes behaviour — and creates a demand for commitment.`,
  items: [
    // ------------------------------------------------------------------ 5.1
    {
      num: '5.1', kind: 'Model', name: 'Exponential discounting (discounted utility model)',
      statement: String.raw`In the **discounted utility model** a plan $(c_0,c_1,c_2,\dots)$ is valued at $U=\sum_{t\ge0}\delta^t\,u(c_t)$ with one **discount factor** $\delta\in(0,1]$ that does not depend on the date, the good or the size of the reward. A reward worth $x$ delivered $t$ periods from now has present value $D(t)\,x$ with $D(t)=\delta^t=e^{-\rho t}$, where $\rho=-\ln\delta$ is the **discount rate**. All of intertemporal choice is summarised by one number. Its signature property: the ratio $D(t+1)/D(t)=\delta$ of the values of two rewards one period apart is the same at every horizon.`,
      scope: String.raw`A normative benchmark and a bookkeeping device, introduced by Samuelson (1937) as an explicitly simplified form and axiomatised by Koopmans (1960); it was never claimed to be an empirical description. The laboratory evidence in the rest of this chapter is about where it fails.`,
      idea: String.raw`Because $\delta^{t+s}=\delta^t\delta^s$ (the functional equation of the exponential, pma-8.6), waiting one more period always costs the same fraction of what you have, however far away you are. This is what makes the model tractable in market settings: a unique interest rate prices every delay, and present values add. The cost is that a single parameter must explain a household's impatience for a snack, a car and a pension.`,
      caption: String.raw`Drag the **gold point** along the curve to a delay and read the present value of the reward. In the right panel the **blue dots** are $D(t+1)/D(t)$ at each horizon: with exponential discounting they all sit on the line $\delta$. Switch on the **hyperbola** to see the ratio that a different discount function would give at the same one-period value.`,
      deps: ['micro-11.9', 'pma-8.6'], refs: ['W&K ch. 7'], tags: ['discounting', 'time preference'],
      credit: 'Paul Samuelson, 1937',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Exponential_discounting', doi: 'https://doi.org/10.2307/2967612' },
      viz(v) {
        const dl = v.slider('discount factor per period $\\delta$', 0.5, 1, 0.9, { step: 0.005 });
        const R = v.slider('reward (\\$)', 10, 1000, 100, { step: 10, int: true });
        const hyp = v.toggle('overlay a hyperbola with the same one-period value', false);
        const A = v.stage({ x: [0, 20], y: [0, 1.05], axes: 'box', gutter: true, height: 320, xlabel: 'delay t (periods)', ylabel: 'discount function D(t)', title: 'present value of one unit' });
        const B = v.stage({ x: [0, 20], y: [0.3, 1.05], axes: 'box', gutter: true, height: 320, xlabel: 'horizon t', ylabel: 'D(t+1) / D(t)', title: 'value of waiting one more period' });
        const h = A.handle(6, 0.53, { color: 'gold', r: 8, constrain: (x) => { const t = clamp(x, 0, 20); return [t, Math.pow(dl.value, t)]; } });
        v.legend([['blue', 'δᵗ'], ['red', 'hyperbola 1/(1+kt)', { dash: true }]]);
        v.render(() => {
          const d = dl.value, k = 1 / d - 1;
          A.fn((t) => Math.pow(d, t), { color: 'blue', width: 2.6 });
          if (hyp.value) A.fn((t) => dHyp(k, t), { color: 'red', width: 2, dash: true });
          const t = h.x; h.set(t, Math.pow(d, t));
          A.vline(t, GUIDE); A.hline(Math.pow(d, t), GUIDE);
          B.hline(d, { color: 'blue', width: 2.4 });
          for (let i = 0; i < 20; i++) B.dot(i, Math.pow(d, i + 1) / Math.pow(d, i), { r: 4.5, color: 'blue' });
          if (hyp.value) B.fn((x) => dHyp(k, x + 1) / dHyp(k, x), { color: 'red', width: 2, dash: true });
          B.text('constant: δ = ' + d.toFixed(3), 10, d, { dy: -14, align: 'center', color: 'blue', weight: 700, size: 12 });
        });
        v.readout(() => {
          const d = dl.value, t = h.x, rho = -Math.log(d);
          return `A reward of ${usdR(R.value)} at delay $t=${t.toFixed(1)}$ is worth **${usdC(R.value * Math.pow(d, t))}** now ($D=${Math.pow(d, t).toFixed(3)}$). Rate $\\rho=-\\ln\\delta=${(100 * rho).toFixed(1)}\\%$ per period, half-life of value $\\ln2/\\rho=${(Math.LN2 / rho).toFixed(1)}$ periods. Every period of waiting multiplies value by **${d.toFixed(3)}**, at any horizon.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.2
    {
      num: '5.2', kind: 'Theorem', name: 'Exponential discounting is time-consistent',
      statement: String.raw`Let a decision maker rank the dated rewards $x$ at date $T$ and $y$ at date $T+g$ by present value, $xD(T-s)$ against $yD(T+g-s)$, as seen from the date $s\le T$ at which the choice is made. If $D(t)=\delta^t$, the ranking is the same for every $s$: it prefers $y$ at $T+g$ exactly when $y\,\delta^{g}>x$, whatever the date from which it looks. More generally, preferences over dated consumption streams are **time-consistent** (a plan that is optimal at date 0 stays optimal when re-optimised at any later date) if and only if the discount function is exponential, $D(t+s)=D(t)D(s)$ (Strotz 1955).`,
      scope: String.raw`Time-consistency is a statement about the plan, given the same information. Surprises, changing tastes or changing opportunities can of course change a plan; the theorem excludes only the change that comes from the passing of time itself.`,
      idea: String.raw`The ratio of the two present values is $\dfrac{y}{x}\dfrac{D(\tau+g)}{D(\tau)}$ with $\tau=T-s$ the remaining wait. For $D(t)=\delta^t$ the factor $D(\tau+g)/D(\tau)=\delta^g$ does not contain $\tau$, so the sign of $y\delta^g-x$ cannot change as the clock advances (this is the multiplicative property from behav-5.1). Conversely a ranking that is stable for every pair and every $\tau$ forces $D(\tau+g)/D(\tau)$ to be independent of $\tau$, which is Cauchy's functional equation for the exponential.`,
      caption: String.raw`The left panel plots the **ratio $R(s)$ of the larger-later to the smaller-sooner present value** as the clock $s$ advances towards the smaller reward at day $T=30$; above the dashed line 1 you want to wait. Under **exponential** discounting the ratio is a constant; switch to **hyperbolic** (same rate parameter) and it crosses 1. Drag the **gold point** to move the clock.`,
      deps: ['behav-5.1'], refs: ['W&K ch. 7'], tags: ['time consistency', 'discounting'],
      credit: 'Robert Strotz, 1955',
      links: { doi: 'https://doi.org/10.2307/2295722' },
      viz(v) {
        const mode = v.select('discount function', [{ value: 'exp', label: 'exponential' }, { value: 'hyp', label: 'hyperbolic' }], 'exp');
        const r = v.slider('rate $r$ (per day, \\%)', 0, 25, 15, { step: 0.5 });
        const g = v.slider('extra wait $g$ (days)', 1, 14, 1, { step: 1, int: true });
        const yy = v.slider('larger reward at $T+g$ (\\$), smaller is \\$100', 101, 160, 110, { step: 1, int: true });
        const T = 30;
        const D = (t) => (mode.value === 'exp' ? dExp(r.value / 100, t) : dHyp(r.value / 100, t));
        const Rr = (s) => (yy.value / 100) * D(T - s + g.value) / D(T - s);
        const A = v.stage({ x: [0, T], y: [0.85, 1.25], axes: 'box', gutter: true, height: 320, xlabel: 'date of the decision s (days from today)', ylabel: 'R(s) = value of later / value of sooner', title: 'when do you want to wait?' });
        const B = v.stage({ x: [0, 3], y: [0, 105], axes: false, height: 320, title: 'values at the chosen date' });
        const h = A.handle(14, 1, { color: 'gold', r: 8, constrain: (x) => { const s = clamp(x, 0, T); return [s, Rr(s)]; } });
        v.legend([['blue', 'R(s)'], ['muted', 'R = 1: indifferent', { dash: true }]]);
        v.render(() => {
          A.hline(1, GUIDE);
          A.fn(Rr, { color: 'blue', width: 2.6, domain: [0, T] });
          const s = h.x; h.set(s, Rr(s));
          A.vline(s, GUIDE);
          const vs = 100 * D(T - s), vl = yy.value * D(T + g.value - s), mx = Math.max(vs, vl, 1);
          B.setView([0, 3], [0, Math.max(105, mx * 1.15)]);
          B.rect(0.35, 0, 1.25, vs, { fill: 'orange', fillAlpha: 0.6, color: 'orange', width: 1.5 });
          B.rect(1.75, 0, 2.65, vl, { fill: 'blue', fillAlpha: vl > vs ? 0.75 : 0.45, color: 'blue', width: vl > vs ? 3 : 1.5 });
          B.text('$100 on day 30', 0.8, 0, { dy: 18, align: 'center', size: 12, color: 'orange', weight: 700 });
          B.text('later reward, day ' + (T + g.value), 2.2, 0, { dy: 18, align: 'center', size: 12, color: 'blue', weight: 700 });
          B.text(vs.toFixed(1), 0.8, vs, { dy: -10, align: 'center', size: 13, weight: 800, color: 'orange' });
          B.text(vl.toFixed(1), 2.2, vl, { dy: -10, align: 'center', size: 13, weight: 800, color: 'blue' });
        });
        v.readout(() => {
          const s = h.x;
          let flips = false, prev = Rr(0) > 1;
          for (let i = 1; i <= 120; i++) { const c = Rr((T * i) / 120) > 1; if (c !== prev) flips = true; prev = c; }
          return `On day $s=${s.toFixed(1)}$ the ratio is $R=${Rr(s).toFixed(3)}$, so you choose **${Rr(s) > 1 ? 'to wait' : 'the smaller, sooner reward'}**. Over the whole month the ranking ${flips ? '**reverses**: the same pair is ranked differently at different dates' : 'never changes'}${mode.value === 'exp' ? `; the exponential value is constant at $${(yy.value / 100).toFixed(2)}\\,\\delta^{g}=${Rr(0).toFixed(3)}$` : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.3
    {
      num: '5.3', kind: 'Model', name: 'Hyperbolic discounting',
      statement: String.raw`**Hyperbolic discounting** replaces $\delta^t$ by $D(t)=\dfrac{1}{1+kt}$ (Mazur's form; the generalised version $(1+\alpha t)^{-\gamma/\alpha}$ is due to Loewenstein and Prelec). The per-period discount rate $-D'(t)/D(t)=k/(1+kt)$ is **not constant**: it is $k$ for immediate delays and falls toward zero for distant ones, whereas an exponential has the same rate at every horizon. Experiments that ask for the amount $X$ that makes a person indifferent between \$15 now and \$$X$ after a delay $t$ find implied rates $\ln(X/15)/t$ that fall steeply as $t$ grows (for example about 345% a year for one month against about 19% a year for ten years in Thaler's 1981 questions).`,
      scope: String.raw`A descriptive curve fitted to choices of animals and people over delays of seconds to years; the implied rates are for hypothetical questions about small sums, and their size is sensitive to the question format. The hyperbola is one of several declining-rate forms.`,
      idea: String.raw`If the rate of discounting declines with the delay, a given extra wait costs less far in the future than near the present, which is what choice data show (Ainslie 1975 collected the animal evidence; Thaler's questions the human). Mathematically the hyperbola is the discount function you get by averaging exponentials over an unknown rate (a mixture of impatiences) and it has a fatter tail than any single exponential matched to the same one-year value.`,
      caption: String.raw`Drag the **gold point** (the value of waiting one year) to set $k$ and compare the hyperbola with the exponential that has the **same one-year value**: the hyperbola falls faster at first and slower later. The right panel plots the **average discount rate** $-\ln D(t)/t$ against the delay on log axes: the exponential is a flat line, the hyperbola a falling one. The **dots** are Thaler's implied rates; **Fit k** puts the hyperbola through them in the least-squares sense.`,
      deps: ['behav-5.1'], refs: ['W&K ch. 8'], tags: ['discounting', 'hyperbolic'],
      credit: 'George Ainslie, 1975; Mazur, 1987; Thaler, 1981',
      links: { doi: 'https://doi.org/10.1016/0165-1765(81)90067-7', wikipedia: 'https://en.wikipedia.org/wiki/Hyperbolic_discounting' },
      verify: true,
      viz(v) {
        const kS = v.slider('hyperbola parameter $k$ (per year)', 0.2, 20, 4.8, { log: true, sig: 3 });
        const logs = v.toggle('log axes for the delay (left panel)', false);
        const fit = v.button('Fit k to Thaler’s three points', () => {
          let best = [1e9, 1];
          for (let i = 0; i <= 600; i++) {
            const k = Math.exp(Math.log(0.2) + (Math.log(100) * i) / 600);
            const e = THALER.reduce((s, [t, , rho]) => s + Math.pow(Math.log(Math.log(1 + k * t) / t) - Math.log(rho), 2), 0);
            if (e < best[0]) best = [e, k];
          }
          kS.set(best[1]);
        });
        const THALER = [[1 / 12, 20, Math.log(20 / 15) * 12], [1, 60, Math.log(60 / 15)], [10, 100, Math.log(100 / 15) / 10]];
        const A = v.stage({ x: [0, 10], y: [0, 1.02], axes: 'box', gutter: true, height: 330, xlabel: 'delay t (years)', ylabel: 'D(t)', title: 'same one-year value, different shapes' });
        const B = v.stage({ x: [0.05, 20], y: [0.05, 8], axes: 'box', gutter: true, xlog: true, ylog: true, height: 330, xlabel: 'delay t (years)', ylabel: 'average rate −ln D(t)/t  (1 = 100% a year)', title: 'implied discount rate falls with delay' });
        const hk = A.handle(1, 0.17, { color: 'gold', r: 8, constrain: (x, y) => [1, clamp(y, 0.03, 0.9)] });
        hk.onDrag = () => { kS.set(clamp(1 / hk.y - 1, 0.2, 20)); };
        v.legend([['red', 'hyperbola 1/(1+kt)'], ['blue', 'exponential, same value at 1 year'], ['green', 'Thaler 1981 implied rates', { dot: true }]]);
        v.render(() => {
          const k = kS.value, rho = Math.log(1 + k);
          A.setView(logs.value ? [0.05, 10] : [0, 10], [0, 1.02]);
          A.setScale({ xlog: logs.value });
          A.fn((t) => dHyp(k, t), { color: 'red', width: 2.6 });
          A.fn((t) => Math.exp(-rho * t), { color: 'blue', width: 2.6 });
          hk.set(1, dHyp(k, 1));
          A.text('1/(1+k) = ' + (1 / (1 + k)).toFixed(3), 1, 1 / (1 + k), { dx: 12, dy: -12, size: 11.5, weight: 700, color: 'ink', plate: true });
          B.hline(rho, { color: 'blue', width: 2.4 });
          B.fn((t) => Math.log(1 + k * t) / t, { color: 'red', width: 2.6 });
          THALER.forEach(([t, X, r]) => {
            B.dot(t, r, { r: 6, color: 'green' });
            B.text('15 → ' + X + ' dollars', t, r, { dx: 9, dy: -11, size: 11, color: 'green', weight: 700 });
          });
        });
        v.readout(() => {
          const k = kS.value, rho = Math.log(1 + k);
          const rows = THALER.map(([t, , r]) => `${(100 * r).toFixed(0)}% (data) / ${(100 * Math.log(1 + k * t) / t).toFixed(0)}% (hyperbola) / ${(100 * rho).toFixed(0)}% (exponential)`);
          return `Value of \\$1 in one year: ${(1 / (1 + k)).toFixed(3)} for both curves. Average rate at 1 month, 1 year, 10 years — data / hyperbola / exponential:\n1 month: ${rows[0]}\n1 year: ${rows[1]}\n10 years: ${rows[2]}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.4
    {
      num: '5.4', kind: 'Phenomenon', name: 'Preference reversal as rewards draw near',
      statement: String.raw`Offered \$60 at date $d$ or \$100 four weeks later, many people choose the larger, later reward when $d$ is far away and the smaller, sooner one when $d$ is zero. Adding the same front-end delay to both options flips the choice. Kirby and Herrnstein (1995) report this with real money in a laboratory, and Green, Fristoe and Myerson (1994) with children, young adults and older adults; the pattern also appears in pigeons (Ainslie 1975). It contradicts exponential discounting (behav-5.2) and fits a declining discount rate (behav-5.3): the reversal date is where the two present-value curves cross.`,
      scope: String.raw`Reversal is the typical direction in these experiments; a minority of choices go the other way and individuals differ a great deal. The reward pair and the hyperbola parameter below are an illustration, not estimates.`,
      idea: String.raw`Both rewards are in the future, so both values rise as the clock advances, but the sooner one rises faster in relative terms as it closes in on today, where a hyperbolic $D$ is steepest. The value curves of the two rewards therefore cross once, a little before the smaller reward arrives, and from that moment the smaller-sooner reward looks better. With an exponential $D$ the two curves are proportional and never cross.`,
      caption: String.raw`Left: the **present value of each reward** as the clock $s$ runs towards them (drag the **gold point**). Under hyperbolic discounting the curves cross; switch to exponential and they do not. Right: **your own choices** — click a cell to record whether you would take the smaller reward now-ish or wait for the larger, for each front-end delay; the model's choice is shown under each cell.`,
      deps: ['behav-5.3'], refs: ['W&K ch. 8'], tags: ['preference reversal', 'present bias'],
      credit: 'George Ainslie, 1975; Green, Fristoe & Myerson, 1994; Kirby & Herrnstein, 1995',
      links: { doi: 'https://doi.org/10.1111/j.1467-9280.1995.tb00311.x' },
      viz(v) {
        const mode = v.select('discount function', [{ value: 'hyp', label: 'hyperbolic' }, { value: 'exp', label: 'exponential' }], 'hyp');
        const k = v.slider('rate $k$ per week', 0.05, 1.5, 0.5, { step: 0.05 });
        const SS = v.slider('smaller reward (\\$), larger is \\$100', 20, 95, 60, { step: 1, int: true });
        const gap = v.slider('extra wait for the larger (weeks)', 1, 12, 4, { step: 1, int: true });
        const DELAYS = [0, 1, 2, 4, 8, 16, 32];
        const mine = DELAYS.map(() => 0);
        const D = (t) => (mode.value === 'hyp' ? dHyp(k.value, t) : dExp(k.value, t));
        const tSS = 20;
        const A = v.stage({ x: [0, 25], y: [0, 100], axes: 'box', gutter: true, height: 330, xlabel: 'the clock s (weeks); smaller reward arrives at week 20', ylabel: 'value now of each reward (\\$)', title: 'present values as the rewards draw near' });
        const B = v.stage({ x: [0, DELAYS.length], y: [0, 4], axes: false, height: 330, title: 'your choices at several front-end delays', hover: false });
        const h = A.handle(10, 0, { color: 'gold', r: 8, constrain: (x) => [clamp(x, 0, 24), 0] });
        v.legend([['orange', 'smaller, sooner'], ['blue', 'larger, later']]);
        B.onClick((x, y) => {
          const i = Math.floor(x);
          if (i >= 0 && i < DELAYS.length && y > 1.2 && y < 3.6) { mine[i] = (mine[i] + 1) % 3; v.invalidate(); }
        });
        const model = (d) => (SS.value * D(d) >= 100 * D(d + gap.value) ? 1 : 2);
        v.render(() => {
          const s = h.x;
          A.fn((x) => SS.value * D(tSS - x), { color: 'orange', width: 2.6, domain: [0, tSS] });
          A.fn((x) => 100 * D(tSS + gap.value - x), { color: 'blue', width: 2.6, domain: [0, tSS + gap.value] });
          h.set(clamp(s, 0, 24), 0);
          A.vline(s, GUIDE);
          DELAYS.forEach((d, i) => {
            const m = model(d), u = mine[i];
            B.rect(i + 0.08, 1.3, i + 0.92, 3.5, { fill: u === 1 ? 'orange' : u === 2 ? 'blue' : 'panel', fillAlpha: u ? 0.4 : 1, color: u === 1 ? 'orange' : u === 2 ? 'blue' : 'faint', width: u ? 2.6 : 1.2, radius: 8 });
            B.text(d === 0 ? 'now' : d + ' wk', i + 0.5, 3.5, { dy: -20, align: 'center', size: 12.5, weight: 800, color: 'ink' });
            B.text(u === 1 ? 'sooner' : u === 2 ? 'later' : 'click', i + 0.5, 2.4, { align: 'center', size: 11, color: u === 1 ? 'orange' : u === 2 ? 'blue' : 'muted', weight: 700 });
            B.text(m === 1 ? 'model: sooner' : 'model: later', i + 0.5, 1.3, { dy: 16, align: 'center', size: 10, weight: 700, color: m === 1 ? 'orange' : 'blue' });
          });
          B.text('front-end delay before the smaller reward', DELAYS.length / 2, 0.35, { align: 'center', size: 11, color: 'muted' });
        });
        v.readout(() => {
          const s = h.x, a = SS.value * D(tSS - s), b = 100 * D(tSS + gap.value - s);
          const ms = DELAYS.map(model), sw = ms.some((m, i) => i > 0 && m !== ms[i - 1]);
          const picks = mine.filter((x) => x), rev = mine.some((x, i) => i > 0 && x && mine[i - 1] && x !== mine[i - 1]);
          return `At week $s=${s.toFixed(1)}$ the smaller reward is worth ${usdC(a)} and the larger ${usdC(b)}: you want **${a >= b ? 'the smaller, sooner' : 'the larger, later'}**. The model ${sw ? '**reverses** across the front-end delays' : 'gives the same choice at every front-end delay'}. ${picks.length ? `Your row: ${rev ? '**you reversed too**' : 'no reversal so far'}.` : 'Click cells to add your own row.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.5
    {
      num: '5.5', kind: 'Model', name: 'Quasi-hyperbolic β–δ discounting (Laibson)',
      statement: String.raw`The **quasi-hyperbolic** (or **β–δ**) model values a stream by $U_t=u(c_t)+\beta\sum_{\tau\ge1}\delta^{\tau}u(c_{t+\tau})$, with $0<\beta\le1$ and $0<\delta\le1$. The discount function is $D(0)=1$ and $D(\tau)=\beta\delta^\tau$ for $\tau\ge1$: everything that is not today is scaled down once by $\beta$ (**present bias**) and then discounted exponentially. For $\beta=1$ it is the exponential model. For $\beta<1$ a plan with an immediate cost $c$ and a benefit $b$ one period later is carried out at the time of action only if $\beta\delta b>c$, whereas the self that planned it a period earlier wanted it whenever $\delta b>c$.`,
      scope: String.raw`A tractable two-parameter approximation to hyperbolic discounting, used in most applied work; $\beta$ is estimated anywhere between about 0.5 and 1 depending on the data and the model, and a one-period step has no natural length (days for diet, years for saving).`,
      idea: String.raw`Seen from yesterday, the cost and the benefit are both in the future and both are scaled by $\beta$, which cancels from the comparison; seen from today, only the benefit is scaled, which makes the cost loom larger. The discount function therefore has the shape of a hyperbola in the one respect that matters, a steep drop between now and later and a gentle slope afterwards, without losing the stationarity of the exponential from tomorrow onwards. Phelps and Pollak (1968) introduced the form for intergenerational altruism; Laibson (1997) put it to work for self-control and saving.`,
      caption: String.raw`Left: $D(\tau)$ for the β–δ model (blue), the exponential with the same $\delta$ (dashed) and the drop at $\tau=0$. Right: the value of a plan "go to the gym tomorrow" **judged yesterday** and **judged on the day**, as a function of $\beta$. Drag the **gold handle** along $\beta$: when $\beta$ falls below the threshold $\beta^*=c/(\delta b)$ the plan is abandoned on the day although it was worth it yesterday.`,
      deps: ['behav-5.3'], refs: ['W&K ch. 8'], tags: ['present bias', 'beta-delta'],
      credit: 'Phelps & Pollak, 1968; David Laibson, 1997',
      links: { doi: 'https://doi.org/10.1162/003355397555253', wikipedia: 'https://en.wikipedia.org/wiki/Hyperbolic_discounting#Quasi-hyperbolic_discounting' },
      viz(v) {
        const dl = v.slider('daily discount factor $\\delta$', 0.9, 1, 0.97, { step: 0.001 });
        const c = v.slider('effort cost of the workout $c$ (today)', 1, 20, 10, { step: 0.5 });
        const b = v.slider('benefit $b$ (the next day)', 1, 30, 14, { step: 0.5 });
        const A = v.stage({ x: [0, 40], y: [0, 1.05], axes: 'box', gutter: true, height: 320, xlabel: 'delay τ (days)', ylabel: 'D(τ)', title: 'discount function' });
        const B = v.stage({ x: [0, 1], y: [-10, 12], axes: 'box', gutter: true, height: 320, xlabel: 'present-bias parameter β', ylabel: 'net value of going to the gym', title: 'plan made yesterday, tested today' });
        const hb = B.handle(0.7, 0, { color: 'gold', r: 8, constrain: (x) => [clamp(x, 0, 1), 0] });
        v.legend([['blue', 'β–δ', { dot: true }], ['faint', 'exponential δᵗ', { dash: true }], ['green', 'judged yesterday'], ['red', 'judged on the day']]);
        v.render(() => {
          const d = dl.value, be = hb.x;
          A.fn((t) => Math.pow(d, t), { color: 'faint', width: 2, dash: true });
          A.path(Array.from({ length: 40 }, (_, i) => [i + 1, be * Math.pow(d, i + 1)]), { color: 'blue', width: 2.6 });
          A.dots(Array.from({ length: 40 }, (_, i) => [i + 1, be * Math.pow(d, i + 1)]), { r: 3, color: 'blue' });
          A.dot(0, 1, { r: 6, color: 'blue' });
          A.line(0, 1, 1, be * d, { color: 'blue', width: 1, dash: true });
          A.text('drop by β at once', 2, (1 + be * d) / 2, { dx: 10, size: 11.5, color: 'blue', weight: 700 });
          const yest = (x) => x * d * (d * b.value - c.value), today = (x) => -c.value + x * d * b.value;
          const bs = c.value / (d * b.value);
          B.hline(0, { color: 'muted', width: 1 });
          if (bs <= 1) B.rect(0, -10, Math.min(1, bs), 12, { fill: 'red', fillAlpha: 0.08, stroke: false });
          B.fn(yest, { color: 'green', width: 2.6, domain: [0, 1] });
          B.fn(today, { color: 'red', width: 2.6, domain: [0, 1] });
          hb.set(be, 0);
          B.vline(be, GUIDE);
          B.dot(be, yest(be), { r: 5, color: 'green' }); B.dot(be, today(be), { r: 5, color: 'red' });
          if (bs <= 1) B.text('β* = ' + bs.toFixed(3), bs, 0, { dx: 6, dy: -12, size: 11.5, weight: 800, color: 'red', plate: true });
        });
        v.readout(() => {
          const d = dl.value, be = hb.x, bs = c.value / (d * b.value);
          const worth = d * b.value > c.value;
          return `Planned a day earlier the workout is worth **${fx(be * d * (d * b.value - c.value))}** (it is a good plan iff $\\delta b>c$: ${worth ? 'yes' : 'no'}). On the day it is worth **${fx(-c.value + be * d * b.value)}**. Threshold $\\beta^*=c/(\\delta b)=${bs.toFixed(3)}$: at $\\beta=${be.toFixed(2)}$ the plan is ${!worth ? 'not worth making' : be >= bs ? 'kept' : '**abandoned** — a preference reversal with nothing new learned'}. At $\\beta=1$ the two evaluations agree in sign.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.6
    {
      num: '5.6', kind: 'Concept', name: 'Naive versus sophisticated present bias',
      statement: String.raw`A present-biased agent ($\beta<1$) plans for the future selves that will inherit its decisions. A **sophisticated** agent (Strotz 1955, Pollak 1968) knows its future selves will also be present-biased and predicts what they will actually do; it finds its plan by backward induction. A **naive** agent believes that its future selves will carry out whatever is best from today's point of view, and so keeps planning to do things later. For a task that must be done exactly once before a deadline and whose cost is incurred immediately, the naive agent can postpone it again and again; the sophisticated one anticipates the postponement and, to avoid it, often acts earlier. O'Donoghue and Rabin (1999) show that for immediate-cost tasks the naive agent delays longer than the sophisticated one, and that sophistication does not remove all delay.`,
      scope: String.raw`This is the stylised one-shot task with immediate costs and delayed rewards: for tasks with immediate rewards (and delayed costs) present bias leads to doing things too early, and sophistication can make the problem worse. Costs below are an illustration.`,
      idea: String.raw`Let $a_{t+1}$ be the date on which the task will actually be done if it is not done up to $t$. At date $t$ the agent does it now if $c_t\le\beta\,\delta^{\,a_{t+1}-t}c_{a_{t+1}}$, otherwise it waits. The sophisticated agent uses the true $a_{t+1}$; the naive agent uses instead the date that minimises $\beta\delta^{k}c_{t+k}$ — the date that $t$'s own preferences would pick — and then fails to follow it, because when that date comes the plan is judged afresh. This is the quasi-hyperbolic model of behav-5.5 applied recursively.`,
      caption: String.raw`The task must be done **once** in $N$ weeks and costs more each week of delay (the **bars**). Slide $\beta$ down. Each row of the grid shows, for a person who reaches that week without having done it, the week the **naive** agent plans (orange) and the week the **sophisticated** agent expects (green); the filled marks are when each actually acts.`,
      deps: ['behav-5.5'], refs: ['W&K ch. 8'], tags: ['procrastination', 'sophistication'],
      credit: 'Strotz, 1955; Pollak, 1968; O’Donoghue & Rabin, 1999',
      links: { doi: 'https://doi.org/10.1257/aer.89.1.103' },
      viz(v) {
        const N = v.slider('weeks until the deadline $N$', 3, 8, 4, { step: 1, int: true });
        const c1 = v.slider('cost in week 1', 1, 10, 5, { step: 0.5 });
        const gr = v.slider('extra cost per week of delay', 0, 3, 1, { step: 0.25 });
        const be = v.slider('present bias $\\beta$', 0.2, 1, 0.8, { step: 0.01 });
        const dl = v.slider('weekly $\\delta$', 0.8, 1, 1, { step: 0.01 });
        const A = v.stage({ x: [0.3, 8.7], y: [0, 14], axes: 'box', gutter: true, height: 320, xlabel: 'week in which the task is done', ylabel: 'cost of doing it then', title: 'a task that gets more costly' });
        const B = v.stage({ x: [0.3, 8.7], y: [0.3, 8.7], axes: false, height: 320, title: 'plans, by the week you are in' });
        const solve = () => {
          const n = N.value, b = be.value, d = dl.value, c = [];
          for (let t = 1; t <= n; t++) c[t] = c1.value + gr.value * (t - 1);
          const soph = [], naive = [];
          soph[n] = n;
          for (let t = n - 1; t >= 1; t--) soph[t] = c[t] <= b * Math.pow(d, soph[t + 1] - t) * c[soph[t + 1]] ? t : soph[t + 1];
          for (let t = 1; t <= n; t++) {
            let best = t, bv = c[t];
            for (let k = t + 1; k <= n; k++) { const val = b * Math.pow(d, k - t) * c[k]; if (val < bv - 1e-12) { bv = val; best = k; } }
            naive[t] = best;
          }
          let nAct = n; for (let t = 1; t <= n; t++) if (naive[t] === t) { nAct = t; break; }
          return { n, c, soph, naive, nAct, sAct: soph[1] };
        };
        v.legend([['accent', 'cost in each week'], ['orange', 'naive agent'], ['green', 'sophisticated agent']]);
        v.render(() => {
          const S = solve();
          A.setView([0.3, S.n + 0.7], [0, Math.max(6, S.c[S.n] * 1.25)]);
          for (let t = 1; t <= S.n; t++) A.rect(t - 0.32, 0, t + 0.32, S.c[t], { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1.2 });
          for (let t = 1; t <= S.n; t++) A.text(String(S.c[t]), t, S.c[t], { dy: -10, align: 'center', size: 11.5, weight: 700, color: 'accent' });
          A.dot(S.nAct - 0.14, S.c[S.nAct] * 0.5, { r: 9, color: 'orange' });
          A.dot(S.sAct + 0.14, S.c[S.sAct] * 0.5, { r: 9, color: 'green' });
          B.setView([0.3, S.n + 0.7], [0.3, S.n + 0.7]);
          for (let t = 1; t <= S.n; t++) {
            B.text('week ' + t, 0.3, S.n + 1 - t, { dx: 4, size: 11.5, color: 'muted', weight: 700 });
            B.hline(S.n + 1 - t, { color: 'grid', width: 1 });
            const yn = S.n + 1 - t + 0.17, ys = S.n + 1 - t - 0.17;
            B.dot(S.naive[t], yn, { r: 6, color: 'orange', hollow: !(S.naive[t] === t) });
            B.dot(S.soph[t], ys, { r: 6, color: 'green', hollow: !(S.soph[t] === t) });
            if (S.naive[t] !== t) B.arrow(t, yn, S.naive[t] - 0.15, yn, { color: 'orange', head: 7 });
            if (S.soph[t] !== t) B.arrow(t, ys, S.soph[t] - 0.15, ys, { color: 'green', head: 7 });
          }
          B.text('mark in the column of the week planned for; filled = act now', S.n / 2 + 0.5, 0.3, { dy: -4, align: 'center', size: 10.5, color: 'muted' });
        });
        v.readout(() => {
          const S = solve();
          return `Costs by week: ${S.c.slice(1).join(', ')}. The naive agent does the task in **week ${S.nAct}** (cost ${S.c[S.nAct]}); the sophisticated agent in **week ${S.sAct}** (cost ${S.c[S.sAct]}); the cost-minimising plan (week 1) costs ${S.c[1]}. ${S.nAct > S.sAct ? 'Naive delays longer, as in O’Donoghue and Rabin.' : S.nAct === S.sAct ? 'Same week for both here: try a smaller β or steeper cost growth.' : ''}`;
        });
      },
    },
  ],
};
