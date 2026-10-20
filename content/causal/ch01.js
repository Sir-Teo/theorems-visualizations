// Causal Inference — Chapter 1: Potential outcomes and causal effects (items 1.1–1.6; 1.7–1.12 in ch01-b.js)
//
// Sources checked (Oct 2026):
// - Holland, "Statistics and Causal Inference", J. Amer. Statist. Assoc. 81 (396): 945–960 (1986), text read from the JSTOR scan:
//   uses the model of Rubin (1974) and Holland & Rubin (1983); notation Y_t(u), Y_c(u); the sentence "It is impossible to observe the
//   value of Y_t(u) and Y_c(u) on the same unit and, therefore, it is impossible to observe the effect of t on u" is his
//   "Fundamental Problem of Causal Inference"; he also names the assumptions of temporal stability and causal transience.
//   He says the earliest explicit reference he found to multiple versions of the response (potential outcomes) is Neyman (1935).
// - Rubin, J. Educ. Psychol. 66 (5): 688–701 (1974): bibliographic data confirmed (ETS record); full text not available here.
// - Not verified, quoted from memory: Rubin's 1980 comment (JASA 75) as the origin of the name SUTVA; Hernán–Robins chapter titles.
import {
  clamp, logistic, pct, sg, fx, mean, sdev, hashStr, memo, rng, makePop, selectAssign, completeAssign, observed, arms, binCounts, barsH, lab, commas,
} from './ch01.shared.js';

const HELP = 2; // |τ| above this counts as "clearly helped / harmed" in the icon pictures

export default {
  collection: 'causal',
  chapter: 1,
  title: 'Potential outcomes and causal effects',
  summary: String.raw`A causal effect compares the outcome a unit would have under treatment with the outcome it would have without it, and since only one of the two is ever observed, causal inference is a missing-data problem. Average effects can still be identified when the treated and untreated are exchangeable, every kind of unit has a chance of each treatment, and the treatment is well defined. Effects can differ between subgroups, and the choice of effect measure matters, because some measures, like the odds ratio, do not average the way intuition expects.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1', kind: 'Definition', name: 'Potential outcomes',
      statement: String.raw`Fix a unit $i$ (a person, a plot, a school) and a set of treatment values $a\in\mathcal A$, for a binary treatment $\mathcal A=\{0,1\}$. The **potential outcome** $Y_i^{a}$ (also written $Y_i(a)$) is the outcome unit $i$ *would* have if it were given treatment $a$. The unit's **individual causal effect** is the comparison $Y_i^{1}$ versus $Y_i^{0}$, for example the difference $Y_i^1-Y_i^0$. Before treatment is assigned, both potential outcomes are attributes of the unit; the outcome that is actually observed is the one for the treatment received, $Y_i=Y_i^{A_i}=A_iY_i^1+(1-A_i)Y_i^0$. Potential outcomes are well defined only when the treatment values are well defined interventions.`,
      idea: String.raw`The definition turns "$A$ causes $Y$" into a statement about two quantities attached to the same unit, one of them counterfactual. The notation $Y^{a}$ goes back to Neyman's field-trial model, where each plot has one yield for each variety, and was generalised to observational studies by Rubin; the name "potential outcomes" belongs to this tradition. Observed data are then a *selection* from the table of potential outcomes: the link $Y=Y^{A}$ (consistency, item 1.5) is the only thing that connects the hypothetical table to data.`,
      caption: String.raw`Left: 100 simulated patients (a health score, higher is better). **Before assignment** each person is coloured by their own effect $Y^1-Y^0$, which only a simulation can know. Press **Treat** to flip a coin for everyone: now each person shows one outcome, and the effect colours vanish. The table on the right lists eight of them with both columns; the cell in the unobserved column turns to "?". The numbers are simulated and illustrative.`,
      deps: [], refs: ['Hernán–Robins §1.1', 'Pearl §7.4'], tags: ['potential outcomes', 'counterfactuals'],
      credit: 'Neyman, 1923 (notation Y^a: Rubin, 1974)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rubin_causal_model' },
      viz(v) {
        const P = makePop(100, 21, { tau: 5, het: 7 });
        let seed = 5, A = completeAssign(100, 50, seed);
        const mode = v.select('view', [{ value: 'god', label: 'before assignment: both outcomes' }, { value: 'obs', label: 'after assignment: what is observed' }], 'obs');
        v.button('Treat (flip the coins again)', () => { seed++; A = completeAssign(100, 50, seed); mode.set('obs'); });
        const s1 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, title: '100 units', weight: 1 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, title: 'the table of potential outcomes (first eight units)', weight: 1.15 });
        const I = v.icons(s1, { n: 100, shape: 'person', hover: true });
        const R = 8;
        const T = v.table(s2, { rows: R, cols: 5, square: false, cellAspect: 1.55, maxCell: 70, size: 13.5,
          colLabels: ['$Y^{0}$', '$Y^{1}$', '$Y^1-Y^0$', '$A$', '$Y=Y^A$'], rowLabels: (i) => 'unit ' + (i + 1) });
        const cat = (i) => (P.t[i] > HELP ? 0 : P.t[i] < -HELP ? 1 : 2);
        const cnt = [0, 0, 0]; for (let i = 0; i < 100; i++) cnt[cat(i)]++;
        v.render(() => {
          const god = mode.value === 'god';
          I.set({ n: 100, shape: 'person', order: 'index', style: (i) => god
            ? [{ color: 'green', label: 'helped: $Y^1-Y^0>2$' }, { color: 'red', label: 'harmed: $Y^1-Y^0<-2$' }, { color: 'muted', alpha: 0.7, label: 'about the same' }][cat(i)]
            : (A[i] ? { color: 'accent', label: 'treated: sees $Y^1$ only' } : { color: 'orange', hollow: true, label: 'untreated: sees $Y^0$ only' }) });
          I.draw();
          v.legend(god ? [['green', `helped (${cnt[0]})`, { dot: true }], ['red', `harmed (${cnt[1]})`, { dot: true }], ['muted', `about the same (${cnt[2]})`, { dot: true }]]
            : [['accent', `treated (${A.reduce((a, b) => a + b, 0)})`, { dot: true }], ['orange', `untreated (${100 - A.reduce((a, b) => a + b, 0)})`, { dot: true }]]);
          T.draw({
            value: (i, j) => {
              if (god) return j === 0 ? fx(P.y0[i]) : j === 1 ? fx(P.y1[i]) : j === 2 ? sg(P.t[i]) : '–';
              if (j === 0) return A[i] ? '?' : fx(P.y0[i]);
              if (j === 1) return A[i] ? fx(P.y1[i]) : '?';
              if (j === 2) return '?';
              return j === 3 ? String(A[i]) : fx(A[i] ? P.y1[i] : P.y0[i]);
            },
            fill: (i, j) => {
              if (god) return j === 2 ? [P.t[i] > HELP ? 'green' : P.t[i] < -HELP ? 'red' : 'muted', 0.22] : null;
              if (j === 0) return A[i] ? ['muted', 0.28] : ['orange', 0.2];
              if (j === 1) return A[i] ? ['accent', 0.2] : ['muted', 0.28];
              if (j === 2) return ['muted', 0.28];
              return j === 4 ? ['green', 0.16] : null;
            },
            textColor: (i, j) => (!god && (j === 2 || (j === 0 && A[i]) || (j === 1 && !A[i])) ? 'muted' : 'ink'),
          });
        });
        v.readout(() => {
          const ate = mean(P.t), nt = A.reduce((a, b) => a + b, 0);
          return mode.value === 'god'
            ? `All **200** numbers exist ($100$ units × $Y^0,Y^1$). Individual effects range from $${fx(Math.min(...P.t))}$ to $${sg(Math.max(...P.t))}$; **${cnt[0]}** are helped, **${cnt[1]}** harmed. Their mean, the average effect, is $${fx(ate, 2)}$.`
            : `The study sees only **100** of the 200 numbers (${nt} treated, ${100 - nt} untreated). The effect column is entirely unobserved: no unit shows both $Y^0$ and $Y^1$, so no individual effect (and no mean of them) can be read off the data.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2', kind: 'Principle', name: 'The fundamental problem of causal inference',
      statement: String.raw`For every unit, at most one of the potential outcomes $Y_i^{0},Y_i^{1}$ can be observed: the one for the treatment actually received. Consequently the individual causal effect of any unit is not identified by data alone, and neither is the average effect $E[Y^1-Y^0]$ without further assumptions: for any observed data $(A_i,Y_i)$ there are infinitely many tables of potential outcomes consistent with it, with very different average effects. Holland called this the *fundamental problem of causal inference*. Causal conclusions therefore always rest on assumptions about the missing half (randomization, exchangeability, a homogeneity assumption, a model), not on the data alone.`,
      idea: String.raw`Write the observed data as $(A,Y)$ with $Y=Y^{A}$. For the treated unit $Y^0$ is missing and for the untreated unit $Y^1$ is missing; nothing in $(A_i,Y_i)$ constrains the missing entry, so each missing value can be filled in with any number and the observed table is unchanged. Holland (1986) states the problem as the impossibility of observing both $Y_t(u)$ and $Y_c(u)$ on the same unit, and lists the two classical "scientific" escapes (temporal stability with causal transience, and unit homogeneity) and the statistical one (averages over a population, item 1.3).`,
      caption: String.raw`30 patients; each vertical bar is one unit, running from its $Y^0$ to its $Y^1$. Filled dots are observed, hollow dots are hidden. Switch **hidden ends** between the true ones, an *imagined world* chosen with the slider, or hidden altogether. **The observed means in the readout never move,** while the average effect of the imagined world follows the slider: the data cannot tell these worlds apart. Simulated, illustrative data.`,
      deps: ['causal-1.1'], refs: ['Hernán–Robins §1.1'], tags: ['missing data', 'identification'],
      credit: 'Holland, 1986 (name); Rubin, 1974',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rubin_causal_model#The_fundamental_problem_of_causal_inference' },
      viz(v) {
        const N = 30, P = makePop(N, 8, { tau: 5, het: 5, sd: 4, sx: 6 });
        let seed = 2, A = completeAssign(N, 15, 3), noise;
        const regen = () => { const r = rng(seed * 31 + 1); const z = Array.from({ length: N }, () => r.normal() * 4); const m = mean(z); noise = z.map((q) => q - m); };
        regen();
        const ends = v.select('hidden ends', [{ value: 'true', label: 'the true ones' }, { value: 'imag', label: 'an imagined world' }, { value: 'off', label: 'hidden' }], 'imag');
        const ate = v.slider('average effect assumed in the imagined world', -8, 16, 12, { step: 0.5 });
        v.button('another imagined world', () => { seed++; regen(); });
        v.button('re-randomize', () => { A = completeAssign(N, 15, A.reduce((a, b, i) => a + b * (i + 1), 0) + 7); });
        const s = v.stage({ x: [0, N + 1], y: [20, 100], axes: 'box', gutter: true, height: 380, xlabel: 'unit (random order)', ylabel: 'outcome: health score', xticks: [], title: 'each bar runs from $Y^0$ to $Y^1$' });
        const obsY = (i) => (A[i] ? P.y1[i] : P.y0[i]);
        const hid = (i) => (ends.value === 'true' ? (A[i] ? P.y0[i] : P.y1[i]) : (A[i] ? P.y1[i] - (ate.value + noise[i]) : P.y0[i] + ate.value + noise[i]));
        v.legend([['accent', 'observed, treated ($Y^1$)', { dot: true }], ['orange', 'observed, untreated ($Y^0$)', { dot: true }], ['green', 'hidden end, effect up'], ['red', 'effect down']]);
        v.render(() => {
          for (let i = 0; i < N; i++) {
            const x = i + 1, o = obsY(i), show = ends.value !== 'off', h = show ? hid(i) : null;
            if (show) {
              const y0 = A[i] ? h : o, y1 = A[i] ? o : h;
              s.arrow(x, y0, x, y1, { color: y1 >= y0 ? 'green' : 'red', width: 2, head: 6, alpha: 0.75 });
              s.dot(x, h, { r: 4.5, hollow: true, color: 'green', width: 1.8 });
            } else s.line(x, 22, x, 98, { color: 'faint', width: 1, dash: [2, 4], alpha: 0.5 });
            s.dot(x, o, { r: 5.5, color: A[i] ? 'accent' : 'orange' });
          }
          if (ends.value === 'off') lab(s, 'the other end of every bar is missing', (N + 1) / 2, 94, { align: 'center', color: 'muted' });
        });
        v.readout(() => {
          const m1 = mean(Array.from({ length: N }, (_, i) => obsY(i)), Array.from({ length: N }, (_, i) => i).filter((i) => A[i]));
          const m0 = mean(Array.from({ length: N }, (_, i) => obsY(i)), Array.from({ length: N }, (_, i) => i).filter((i) => !A[i]));
          const world = ends.value === 'true' ? mean(P.t) : ends.value === 'imag' ? ate.value : null;
          return `**Observed (identical in every world):** treated mean $${fx(m1, 2)}$, untreated mean $${fx(m0, 2)}$, difference $${fx(m1 - m0, 2)}$.\n` +
            (world === null ? 'Hidden ends are off: nothing here says what the average effect is.' : `**This world's average effect** ($Y^1-Y^0$ over all 30 units): $${fx(world, 2)}$` + (ends.value === 'true' ? ' (the truth in the simulation).' : ' (imagined; just as consistent with the data as any other).'));
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3', kind: 'Definition', name: 'Average causal effect (ATE and ATT)',
      statement: String.raw`In a population of units, the **average causal effect** (average treatment effect, ATE) of a binary treatment is $\tau=E[Y^1-Y^0]=E[Y^1]-E[Y^0]$. Averaging only over those who were treated gives the **effect on the treated** (ATT), $E[Y^1-Y^0\mid A=1]$, and over the untreated the **effect on the untreated** (ATU). By total expectation $\tau=P(A{=}1)\,\mathrm{ATT}+P(A{=}0)\,\mathrm{ATU}$. These can all differ: an average effect of zero is compatible with large individual effects of both signs, and ATT $\neq$ ATE whenever treatment is related to the size of the effect.`,
      idea: String.raw`Individual effects are never observed (item 1.2), but their average is a difference of two marginal means $E[Y^1]-E[Y^0]$, each of which could in principle be estimated if the missing halves were exchangeable with the observed halves (item 1.7). The ATE answers "what if we treated everyone versus no one"; the ATT answers "what did treatment do for those who took it", and the two coincide when the effect is the same for everyone or treatment is independent of the effect.

For integrable potential outcomes, linearity of expectation (PROB 1.6.1) gives the difference of marginal means without assuming the two outcomes independent. Apply the tower property (PROB 4.1.13) to the integrable individual effect and the treatment partition: averaging its two conditional means gives the stated prevalence-weighted ATT/ATU decomposition. Both arm probabilities must be positive to name both conditional effects. These probability identities do not identify either missing outcome from observations.`,
      caption: String.raw`A simulated population of 1,000 with a spread of individual effects. The histogram shows the effects $Y^1-Y^0$ of all units (blue) and of the treated (orange). Raise **spread** until the mean effect is near zero but many units are helped and many harmed. Raise **selection on gain** so that those who benefit most choose treatment: ATT moves away from ATE, and the observed difference (from the observed half only) follows the ATT, not the ATE.`,
      deps: ['causal-1.1', 'prob-1.6.1', 'prob-4.1.13'], refs: ['Hernán–Robins §1.2'], tags: ['ATE', 'ATT'],
      credit: 'Rubin, 1974; ATT: Heckman, 1980s',
      viz(v) {
        const mu = v.slider('mean effect $\\tau$', -4, 12, 3, { step: 0.5 });
        const het = v.slider('spread of individual effects', 0, 12, 8, { step: 0.5 });
        const gain = v.slider('selection on gain', -2, 3, 1.2, { step: 0.1 });
        v.button('new population', () => { seedS += 1; });
        let seedS = 1;
        const A = v.stage({ x: [-25, 35], y: [0, 100], axes: 'box', gutter: true, height: 350, xlabel: 'individual effect $Y^1-Y^0$', ylabel: 'number of units', title: 'all 1,000 individual effects', weight: 1.3 });
        const B = v.stage({ x: [-8, 16], y: [0, 5], axes: 'box', gutter: true, height: 350, xlabel: 'average effect', ylabel: null, yticks: [], title: 'what each average says', weight: 1 });
        const getPop = memo();
        v.legend([['accent', 'all units'], ['orange', 'the treated'], ['teal', 'the untreated']]);
        v.render(() => {
          const key = [mu.value, het.value, gain.value, seedS].join('|');
          const { P, Ar, st, hAll, hT, hU } = getPop(key, () => {
            const P = makePop(1000, 40 + seedS, { tau: mu.value, het: het.value, sd: 4, sx: 0 });
            const Ar = selectAssign(P, 9 + seedS, 0, gain.value);
            const st = arms(P, Ar);
            const idx1 = [], idx0 = []; for (let i = 0; i < P.n; i++) (Ar[i] ? idx1 : idx0).push(P.t[i]);
            return { P, Ar, st, hAll: binCounts(Array.from(P.t), -25, 35, 30), hT: binCounts(idx1, -25, 35, 30), hU: binCounts(idx0, -25, 35, 30) };
          });
          const ymax = Math.max(10, ...hAll.counts) * 1.15;
          A.setView([-25, 35], [0, ymax]);
          barsH(A, hAll, { color: 'accent', fillAlpha: 0.2 }); barsH(A, hT, { color: 'orange', fillAlpha: 0.32 }); barsH(A, hU, { color: 'teal', fillAlpha: 0, width: 1.2, dash: [4, 3] });
          A.vline(0, { color: 'muted', width: 1, dash: [3, 4] });
          A.vline(st.ate, { color: 'accent', width: 2.2 }); A.vline(st.att, { color: 'orange', width: 2.2 });
          lab(A, 'ATE', st.ate, ymax * 0.97, { color: 'accent', dx: st.att > st.ate ? -5 : 5, align: st.att > st.ate ? 'right' : 'left' });
          lab(A, 'ATT', st.att, ymax * 0.97, { color: 'orange', dx: st.att > st.ate ? 5 : -5, align: st.att > st.ate ? 'left' : 'right' });
          // ladder
          const rows = [['ATE (all 1,000, from the full table)', st.ate, 'accent'], ['ATT (treated, full table)', st.att, 'orange'], ['ATU (untreated, full table)', st.atu, 'teal'], ['observed difference in means', st.naive, 'purple']];
          B.vline(0, { color: 'muted', width: 1, dash: [3, 4] });
          rows.forEach(([name, val, col], k) => {
            const y = 4.2 - k * 1.05;
            B.line(-8, y, val, y, { color: col, width: 2, alpha: 0.5 }); B.dot(val, y, { r: 7, color: col });
            lab(B, name, -7.6, y + 0.42, { align: 'left', color: col, size: 11 }); lab(B, fx(val, 2), val, y, { align: val >= 0 ? 'left' : 'right', dx: val >= 0 ? 12 : -12, color: col, size: 11.5 });
          });
        });
        v.readout(() => {
          const { P, st } = getPop([mu.value, het.value, gain.value, seedS].join('|'), () => null) || {};
          if (!st) return '';
          const harmed = Array.from(P.t).filter((q) => q < 0).length;
          return `**${harmed / 10}%** of the units are harmed (effect $<0$), **${100 - harmed / 10}%** are not; ATE $${fx(st.ate, 2)}$, ATT $${fx(st.att, 2)}$ (${commas(st.n1)} treated), ATU $${fx(st.atu, 2)}$. The observed contrast $${fx(st.naive, 2)}$ estimates the ATT here: treatment is chosen for its gain, so $E[Y^0\\mid A]$ is the same in both groups but $E[Y^1-Y^0\\mid A]$ is not.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4', kind: 'Definition', name: 'Effect measures: risk difference, ratio, odds ratio',
      statement: String.raw`For a binary outcome let $p_1=P(Y^{1}=1)$ and $p_0=P(Y^{0}=1)$ be the counterfactual risks if everyone were treated or untreated. A **causal effect measure** is a contrast of $p_1$ and $p_0$: the risk difference $p_1-p_0$, the risk ratio $p_1/p_0$, or the odds ratio $\dfrac{p_1/(1-p_1)}{p_0/(1-p_0)}$. All three equal their null values ($0$, $1$, $1$) exactly when $p_1=p_0$, but they say different things about the same intervention: the difference gives the absolute number of events averted (and $1/|p_1-p_0|$ the number needed to treat), the ratios are insensitive to the baseline risk. Which measure is reported changes how large the effect appears, not whether it is null.`,
      idea: String.raw`The three measures are three coordinate systems for the unit square of risk pairs $(p_0,p_1)$: lines parallel to the diagonal hold the risk difference fixed, rays from the origin hold the risk ratio fixed, and the curves $p_1=\mathrm{OR}\,p_0/(1-p_0+\mathrm{OR}\,p_0)$ hold the odds ratio fixed. They all pass through the diagonal $p_1=p_0$, the null. For rare outcomes ($p$ small) the odds ratio is close to the risk ratio; for common ones it is not.`,
      caption: String.raw`Drag the point $(p_0,p_1)$ in the right panel or pick a preset. The left panel shows 100 untreated and 100 treated people with that many events. Lines through the point show which pairs of risks share its risk difference, risk ratio or odds ratio. Move the point to a high baseline risk with $p_1/p_0$ fixed: the risk ratio is stuck while the difference and the odds ratio change a lot.`,
      deps: ['causal-1.3'], refs: ['Hernán–Robins §1.3'], tags: ['risk ratio', 'odds ratio'],
      viz(v) {
        const s1 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, title: 'if everyone were untreated | treated (100 each)', weight: 1.1 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, equal: true, xlabel: 'risk if untreated  $p_0$', ylabel: 'risk if treated  $p_1$', title: 'pairs of counterfactual risks', weight: 1 });
        const I = v.icons(s1, { n: 200, shape: 'person' });
        const h = s2.handle(0.4, 0.2, { color: 'accent', label: '$(p_0,p_1)$', labelPos: 'se', constrain: { x: [0.01, 0.99], y: [0.01, 0.99] } });
        v.select('preset', [{ value: 'a', label: 'rare, protective' }, { value: 'b', label: 'common, protective' }, { value: 'c', label: 'common, harmful' }, { value: 'd', label: 'null' }], 'b', {
          onChange: (k) => { const q = { a: [0.04, 0.02], b: [0.6, 0.3], c: [0.4, 0.6], d: [0.35, 0.35] }[k]; h.set(q[0], q[1]); } });
        v.legend([['red', 'event', { dot: true }], ['muted', 'no event', { dot: true }], ['green', 'risk difference fixed'], ['orange', 'risk ratio fixed'], ['purple', 'odds ratio fixed'], ['ink', 'null: $p_1=p_0$', { dash: true }]]);
        const odds = (p) => p / (1 - p);
        v.render(() => {
          const p0 = h.x, p1 = h.y, k0 = Math.round(100 * p0), k1 = Math.round(100 * p1);
          I.set({ n: 200, shape: 'person', block: (i) => (i < 100 ? 0 : 1), blockLabels: (b, n) => (b ? `treated: ${k1} of 100` : `untreated: ${k0} of 100`),
            style: (i) => { const j = i % 100, k = i < 100 ? k0 : k1; return j < k ? { color: 'red', label: 'event' } : { color: 'muted', alpha: 0.4, label: 'no event' }; } });
          I.draw();
          s2.line(0, 0, 1, 1, { color: 'ink', width: 1.6, dash: [5, 4] });
          s2.line(0, p1 - p0, 1 - (p1 - p0), 1, { color: 'green', width: 2.2 });
          s2.clip(() => s2.line(0, 0, 1 / Math.max(p1 / p0, 1), (p1 / p0) / Math.max(p1 / p0, 1), { color: 'orange', width: 2.2 }));
          const OR = odds(p1) / odds(p0);
          s2.curve((x) => [x, (OR * x) / (1 - x + OR * x)], 0, 1, { color: 'purple', width: 2.2, n: 160 });
        });
        v.readout(() => {
          const p0 = h.x, p1 = h.y, rd = p1 - p0, rr = p1 / p0, OR = (p1 / (1 - p1)) / (p0 / (1 - p0));
          return `$p_0=${fx(p0, 2)},\\ p_1=${fx(p1, 2)}$ — risk difference **$${fx(rd, 3)}$** (${fx(Math.abs(rd) * 1000, 0)} events per 1,000${Math.abs(rd) > 0.005 ? `; NNT $\\approx ${fx(1 / Math.abs(rd), 1)}$` : ''}), risk ratio **$${fx(rr, 2)}$**, odds ratio **$${fx(OR, 2)}$**. ` +
            (Math.abs(rd) < 0.0005 ? 'All three are at their null values.' : Math.abs(Math.log(OR) - Math.log(rr)) > 0.15 ? `The odds ratio is far from the risk ratio (the outcome is common): the same intervention looks bigger on the odds scale.` : 'Rare outcome: the odds ratio is close to the risk ratio.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5', kind: 'Principle', name: 'Consistency and no interference (SUTVA)',
      statement: String.raw`The potential-outcome notation $Y_i^{a}$ is meaningful, and links to data, only under two assumptions. **No interference**: unit $i$'s outcome depends only on its own treatment, not on the treatments of others, so that $Y_i^{a_1,\dots,a_n}=Y_i^{a_i}$. **Consistency** (treatment-variation irrelevance): if unit $i$ actually receives treatment $a$ then its observed outcome is $Y_i=Y_i^{a}$, which requires that there be only one version of "treatment $a$", or that all versions have the same effect. Together, with the absence of hidden versions, they are Rubin's *stable unit treatment value assumption* (SUTVA). When either fails, "the" effect is not defined, and contrasts of observed groups estimate something that depends on how the treatment was allocated.`,
      idea: String.raw`With interference unit $i$ has not two potential outcomes but $2^{n}$, one per allocation of treatment to everyone; the usual causal contrast of $Y^1$ with $Y^0$ no longer names a single number. In an infectious disease, vaccination protects the vaccinated (direct effect) and also their neighbours (spillover); the total effect of vaccinating everyone is larger than the direct effect measured when only a few are vaccinated. Consistency fails when "vaccinated" hides different vaccine lots: the contrast then depends on their mix.

With binary treatment, a full allocation is a sequence of $n$ choices, each with two options. The product rule (COMB 1.1) therefore counts $2^n$ allocations indexing one unit’s unrestricted response schedule. No interference restricts that schedule to depend only on its own coordinate, leaving two indexed outcomes. This counts possible treatment allocations, not distinct numerical outcome values or an assumption that assignments are independent.`,
      caption: String.raw`A contact network of 60 people; a random share are vaccinated (filled). Each person's infection risk falls with their own vaccination and with the share of their neighbours vaccinated; red rings mark simulated infections. Turn up **spillover** and compare the naive contrast of the two groups with the direct effect and the total effect of vaccinating everyone. Click a person to count their potential outcomes. Raise **share of weak lots** and the contrast is no longer a property of "vaccination". All risks are model-based and illustrative.`,
      deps: ['causal-1.1', 'comb-1.1'], refs: ['Hernán–Robins §3.4', 'Hernán–Robins §1.2'], tags: ['SUTVA', 'interference', 'consistency'],
      credit: 'Rubin, 1980 (name SUTVA); Cox, 1958 (no interference)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rubin_causal_model#Stable_unit_treatment_value_assumption_(SUTVA)' },
      viz(v) {
        const N = 60, rr = rng(77);
        const nodes = [], u = [];
        for (let i = 0; i < N; i++) { nodes.push({ id: i, x: 0.4 + rr() * 9.2, y: 0.4 + rr() * 5.2 }); u.push(rr()); }
        const edges = [], nb = Array.from({ length: N }, () => []);
        for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) < 1.3) { edges.push([i, j]); nb[i].push(j); nb[j].push(i); }
        const q = v.slider('share vaccinated', 0, 1, 0.5, { step: 0.05 });
        const rho = v.slider('spillover (protection by vaccinated neighbours)', 0, 0.9, 0.6, { step: 0.05 });
        const weak = v.slider('share of weak lots among the vaccinated', 0, 1, 0, { step: 0.05 });
        v.button('re-vaccinate', () => { seed++; });
        let seed = 1, sel = 0;
        const s1 = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 420, title: 'contact network', weight: 1.35 });
        const s2 = v.stage({ x: [-0.5, 0.1], y: [0, 5], axes: 'box', gutter: true, height: 420, xlabel: 'change in infection risk', yticks: [], title: 'what is being compared', weight: 1 });
        const G = v.graph(s1, { nodes, edges, directed: false, layout: 'none', draggable: false, r: 6, autoRadius: false, onClick: ({ node }) => { if (node) sel = node.id; return true; } });
        const B = 0.5, E_STRONG = 0.8, E_WEAK = 0.2;
        const get = memo();
        const model = () => get([q.value, rho.value, weak.value, seed].join('|'), () => {
          const r2 = rng(seed * 997 + 5), a = new Uint8Array(N), e = new Float64Array(N);
          const idx = Array.from({ length: N }, (_, i) => i); for (let i = N - 1; i > 0; i--) { const j = Math.floor(r2() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
          const nv = Math.round(q.value * N); for (let k = 0; k < nv; k++) { a[idx[k]] = 1; e[idx[k]] = r2() < weak.value ? E_WEAK : E_STRONG; }
          const f = (i, aa) => (nb[i].length ? nb[i].reduce((s, j) => s + aa[j], 0) / nb[i].length : 0);
          const risk = (i, aa, ee) => B * (1 - ee[i] * aa[i]) * (1 - rho.value * f(i, aa));
          const p = Array.from({ length: N }, (_, i) => risk(i, a, e));
          const v1 = [], v0 = []; for (let i = 0; i < N; i++) (a[i] ? v1 : v0).push(p[i]);
          const naive = mean(v1) - mean(v0);
          const eBar = (1 - weak.value) * E_STRONG + weak.value * E_WEAK;
          const direct = -B * eBar;
          const all = new Uint8Array(N).fill(1), none = new Uint8Array(N), eAll = new Float64Array(N).fill(eBar), eNone = new Float64Array(N);
          const total = mean(Array.from({ length: N }, (_, i) => risk(i, all, eAll) - risk(i, none, eNone)));
          const spill = v0.length ? mean(Array.from({ length: N }, (_, i) => i).filter((i) => !a[i]).map((i) => p[i] - B)) : NaN;
          return { a, p, naive, direct, total, spill, inf: p.map((pi, i) => u[i] < pi) };
        });
        v.legend([['accent', 'vaccinated', { dot: true }], ['muted', 'unvaccinated', { dot: true }], ['red', 'infected (ring)']]);
        v.render(() => {
          const M = model();
          G.draw({ nodeFill: (id) => (M.a[id] ? 'accent' : null), nodeColor: (id) => (M.a[id] ? 'accent' : 'muted'), nodeLabel: () => '', nodeRing: (id) => (id === sel ? 'gold' : M.inf[id] ? 'red' : null), edgeColor: () => 'faint', edgeWidth: () => 1.2 });
          const rows = [['naive contrast: vaccinated vs unvaccinated', M.naive, 'purple'], ['direct effect (nobody else vaccinated)', M.direct, 'accent'], ['total effect (everyone vs no one)', M.total, 'green'], ['spillover onto the unvaccinated', M.spill, 'orange']];
          s2.vline(0, { color: 'muted', width: 1, dash: [3, 4] });
          rows.forEach(([name, val, col], k) => {
            const y = 4.3 - k * 1.1; if (!Number.isFinite(val)) return;
            s2.line(0, y, val, y, { color: col, width: 2, alpha: 0.5 }); s2.dot(val, y, { r: 7, color: col });
            lab(s2, name, -0.49, y + 0.42, { align: 'left', color: col, size: 10.5 }); lab(s2, fx(val, 3), val, y, { align: 'left', dx: 12, color: col, size: 11.5 });
          });
        });
        v.readout(() => {
          const M = model(), d = nb[sel].length;
          return `Naive contrast **$${fx(M.naive, 3)}$**, direct effect $${fx(M.direct, 3)}$, effect of vaccinating everyone **$${fx(M.total, 3)}$**. ` +
            (rho.value === 0 && weak.value === 0 ? 'No interference, one version: the naive contrast estimates the one well-defined effect.' : `Person ${sel + 1} has ${d} neighbours, so ${d + 1} treatments affect them and they have $2^{${d + 1}}=${2 ** (d + 1)}$ potential outcomes, not 2. The naive contrast estimates neither the direct nor the total effect — it depends on the share vaccinated${weak.value ? ' and on the lot mix' : ''}.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6', kind: 'Concept', name: 'Association versus causation',
      statement: String.raw`Association compares groups as they were observed, $E[Y\mid A=1]-E[Y\mid A=0]$; causation compares the same population under two interventions, $E[Y^1]-E[Y^0]$. They are different quantities: $$E[Y\mid A=1]-E[Y\mid A=0]=\underbrace{E[Y^1-Y^0\mid A=1]}_{\text{ATT}}+\underbrace{E[Y^0\mid A=1]-E[Y^0\mid A=0]}_{\text{selection bias}},$$ so the observed contrast equals the effect on the treated plus the amount by which the treated would have fared differently from the untreated even without treatment. Equivalently, naive difference $=$ ATE $+$ bias. The association has the causal meaning only when the bias vanishes, and the bias can be large enough to reverse the sign.`,
      idea: String.raw`The identity is algebra: replace $E[Y\mid A=1]$ by $E[Y^1\mid A=1]$ (consistency) and add and subtract $E[Y^0\mid A=1]$, a quantity that is counterfactual for exactly those people. If treatment is chosen by sicker people (confounding by indication) $E[Y^0\mid A=1]$ is worse than $E[Y^0\mid A=0]$ and the bias is negative for a good outcome and positive for mortality. Under randomization (item 1.7) the bias is zero in expectation.

On the event $A=1$, conditional-expectation linearity (PROB 4.1.9) writes the difference of the two integrable potential-outcome means as the conditional mean of their difference. Adding and subtracting the missing untreated mean then gives exactly ATT plus the displayed selection term. Positive arm probabilities and consistency are separate premises; neither conditional linearity nor this algebra supplies exchangeability.`,
      caption: String.raw`480 simulated patients; the outcome is death (red). The treatment truly lowers everyone's risk. With **sicker patients seek treatment** at 0 the groups are alike; raise it and the treated die more often than the untreated even though the treatment saves lives. The right panel decomposes the naive difference (blue) into the true average effect (green) plus selection bias (red). Switch on **stratify by severity** (U = untreated, T = treated; mild, moderate, severe) to compare like with like: within the moderate and severe strata the difference moves back towards the effect (it is noisy in the mild stratum, where few were treated), and **show hidden counterfactuals** to ring the patients the treatment actually saved. Simulated, illustrative.`,
      deps: ['causal-1.3', 'prob-4.1.9'], refs: ['Hernán–Robins §1.5'], tags: ['confounding', 'selection bias', 'Simpson'],
      credit: 'Hernán & Robins, What If, 2020',
      viz(v) {
        const N = 480, r = rng(2024), xs = [], us = [];
        for (let i = 0; i < N; i++) { xs.push(r.normal()); us.push(r()); }
        const p0 = (x) => logistic(-1.0 + 1.1 * x), p1 = (x) => logistic(-1.0 + 1.1 * x - 1.0);
        const y0 = xs.map((x, i) => (us[i] < p0(x) ? 1 : 0)), y1 = xs.map((x, i) => (us[i] < p1(x) ? 1 : 0));
        const strat = xs.map((x) => (x < -0.45 ? 0 : x < 0.45 ? 1 : 2));
        const k = v.slider('sicker patients seek treatment', 0, 3, 1.6, { step: 0.1 });
        const split = v.toggle('stratify by severity', false);
        const god = v.toggle('show hidden counterfactuals', false);
        const s1 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, title: 'who died', weight: 1.4 });
        const s2 = v.stage({ x: [-0.6, 6.6], y: [-0.2, 0.3], axes: 'box', gutter: true, height: 380, ylabel: 'difference in death risk', xticks: [[0, 'ATE'], [1, 'bias'], [2, 'naive'], [4, 'mild'], [5, 'moderate'], [6, 'severe']], title: 'effect + bias = association', weight: 1 });
        const I = v.icons(s1, { n: N, shape: 'person' });
        const get = memo();
        const calc = () => get(k.value, () => {
          const R = rng(55), A = new Uint8Array(N); for (let i = 0; i < N; i++) A[i] = R() < logistic(-0.1 + k.value * xs[i]) ? 1 : 0;
          const Y = A.map((a, i) => (a ? y1[i] : y0[i]));
          const rate = (sel) => { let n = 0, d = 0; for (let i = 0; i < N; i++) if (sel(i)) { n++; d += Y[i]; } return n ? d / n : NaN; };
          const naive = rate((i) => A[i]) - rate((i) => !A[i]);
          const ate = mean(y1) - mean(y0);
          const sd = [0, 1, 2].map((g) => rate((i) => A[i] && strat[i] === g) - rate((i) => !A[i] && strat[i] === g));
          const n1 = A.reduce((a, b) => a + b, 0);
          const att = mean(y1.map((v1, i) => v1 - y0[i]), Array.from({ length: N }, (_, i) => i).filter((i) => A[i]));
          return { A, Y, naive, ate, sd, n1, att, r1: rate((i) => A[i]), r0: rate((i) => !A[i]) };
        });
        v.legend([['red', 'died', { dot: true }], ['accent', 'survived', { dot: true }], ['green', 'saved by treatment (ring)']]);
        v.render(() => {
          const C = calc(), { A, Y } = C;
          const lbl = (b, n) => {
            if (!split.value) return b ? `treated (${n}): ${pct(C.r1, 0)} died` : `untreated (${n}): ${pct(C.r0, 0)} died`;
            return `${b < 3 ? 'U' : 'T'} ${['mild', 'mod.', 'severe'][b % 3]}`;
          };
          I.set({ n: N, shape: 'person', block: (i) => (split.value ? (A[i] ? 3 : 0) + strat[i] : A[i] ? 1 : 0), blockLabels: lbl,
            style: (i) => ({ color: Y[i] ? 'red' : 'accent', alpha: Y[i] ? 1 : 0.55, ring: god.value && y1[i] < y0[i] ? 'green' : undefined, label: Y[i] ? 'died' : 'survived' }) });
          I.draw();
          const { naive, ate } = C;
          const ylo = Math.min(-0.2, ...(split.value ? C.sd.filter(Number.isFinite) : []), ate, naive) - 0.05, yhi = Math.max(0.3, ...(split.value ? C.sd.filter(Number.isFinite) : []), naive) + 0.03;
          s2.setView([-0.6, 6.6], [ylo, yhi]);
          s2.hline(0, { color: 'muted', width: 1 });
          s2.rect(-0.3, Math.min(0, ate), 0.3, Math.max(0, ate), { fill: 'green', fillAlpha: 0.4, color: 'green', width: 1.5 });
          s2.rect(0.7, Math.min(ate, naive), 1.3, Math.max(ate, naive), { fill: 'red', fillAlpha: 0.4, color: 'red', width: 1.5 });
          s2.rect(1.7, Math.min(0, naive), 2.3, Math.max(0, naive), { fill: 'accent', fillAlpha: 0.4, color: 'accent', width: 1.5 });
          s2.line(0.3, ate, 0.7, ate, { color: 'muted', dash: true }); s2.line(1.3, naive, 1.7, naive, { color: 'muted', dash: true });
          lab(s2, sg(ate * 100, 1) + ' pp', 0, ate - 0.02 * Math.sign(ate || 1), { align: 'center', color: 'green', size: 11 });
          lab(s2, sg((naive - ate) * 100, 1) + ' pp', 1, (ate + naive) / 2, { align: 'center', color: 'red', size: 11 });
          lab(s2, sg(naive * 100, 1) + ' pp', 2, naive + 0.025 * Math.sign(naive || 1), { align: 'center', color: 'accent', size: 11 });
          if (split.value) {
            s2.hline(ate, { color: 'green', width: 1, dash: [4, 4], alpha: 0.7 });
            C.sd.forEach((d, g) => { s2.dot(4 + g, d, { r: 7, color: 'purple' }); lab(s2, sg(d * 100, 1) + ' pp', 4 + g, d + 0.03, { align: 'center', color: 'purple', size: 10.5 }); });
          } else lab(s2, 'stratify →', 5, 0.2, { align: 'center', color: 'muted', size: 11, plate: false });
        });
        v.readout(() => {
          const C = calc();
          return `Death risk: treated **${pct(C.r1)}**, untreated **${pct(C.r0)}**: naive difference **$${sg(C.naive * 100, 1)}$ pp**. True average effect over the same 480 people: **$${sg(C.ate * 100, 1)}$ pp**; bias $=${sg((C.naive - C.ate) * 100, 1)}$ pp, so naive $=$ ATE $+$ bias. ` +
            (C.naive > 0 && C.ate < 0 ? 'The association has the **wrong sign**: the treatment saves lives but looks harmful.' : C.naive * C.ate > 0 && Math.abs(C.naive - C.ate) < 0.01 ? 'Exchangeable groups: association is causation.' : '');
        });
      },
    },
  ],
};
