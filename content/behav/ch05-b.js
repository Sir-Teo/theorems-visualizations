// Behavioural Economics — Chapter 5, part b: items 5.7–5.11 (commitment, self-imposed deadlines, magnitude and sign effects,
// the marshmallow test, projection bias).
//
// Sources checked (Oct 2026):
// - Ashraf, Karlan & Yin 2006 (QJE 121(2): 635–672; Crossref + abstract): SEARCH commitment savings account in the Philippines; offered
//   to 710 randomly chosen clients, 202 (28.4%) opened it, average balances up 81 percentage points after 12 months relative to control.
// - Ariely & Wertenbroch2002 complete original pp219–224 and the complete official2026 retraction notice
//   DOI10.1177/09567976261488042 read. Historical findings are attributed to the retracted paper only;
//   no empirical numbers are used. The notice’s reliability concerns are reported without asserting proven fabrication.
// - Watts, Duncan & Quan 2018 (Psychological Science 29(7): 1159–1177; doi 10.1177/0956797618761661): read in the full-text PDF.
//   n = 918 at age 15, children of mothers without a college degree (NICHD SECCYD). Standardized coefficients of minutes waited
//   (Table 4): Grade 1 .279 / .102 / .047 (SE .038 / .033 / .030), age 15 .236 / .081 / .050 (SE .037 / .034 / .032) without controls, with
//   early controls, with concurrent controls. The .57 (SAT math) and .42 (SAT verbal) of Shoda, Mischel & Peake (1990) are quoted
//   in the Watts text. Group coefficients (relative to < 20 s) are from the same table; the assignment of columns to outcomes follows the text.
// - Read & van Leeuwen 1998 (OBHDP 76(2): 189–205; doi 10.1006/obhd.1998.2803): read in a PDF. 200 Amsterdam employees, 50 per
//   condition. Table 1 gives for each condition the number choosing healthy in advance, the percentage of each advance group that changed
//   its mind; the share choosing the unhealthy snack at the immediate choice is derived from those rounded percentages (approximate).
// - Thaler1981 original Table2A p204 and loss discussion pp205–206; Loewenstein & Prelec1992
//   original §§II–III pp574–585. The sign-effect factor below remains an illustrative assumption.
// - Loewenstein, O'Donoghue & Rabin 2003 (QJE 118(4): 1209–1248, Crossref) and Loewenstein 1996 (OBHDP 65(3): 272–292): citations only.
import { clamp, num, pct, usdC, usdR, dExp, dHyp, logistic, logit, fx, errBar, wilson } from './ch05.shared.js';

const GUIDE = { color: 'muted', width: 1, dash: [4, 4] };

export default {
  collection: 'behav',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.7
    {
      num: '5.7', kind: 'Concept', name: 'Commitment devices',
      statement: String.raw`A **commitment device** is a voluntary arrangement that restricts one's own future choices (a locked savings account, a gym contract, a deadline, a pre-paid fee, giving the cheque book to a friend). For an exponential discounter it can never help, since extra constraints never improve an optimum. For a **sophisticated** present-biased agent ($\beta<1$, behav-5.6) it can: the long-run self ranks plans with weights $1,\delta$ for two future dates, but the self who will actually spend them uses $1,\beta\delta$, so tying the future self's hands by locking a share $\ell$ of wealth raises the long-run self's welfare unless the lock is too costly. A **naive** agent believes the future self will behave, sees no use for the lock and declines it. In the field, Ashraf, Karlan and Yin (2006) offered a locked-deposit account to 710 randomly chosen bank clients in the Philippines and 28.4% opened it; a year later savings had risen by 81 percentage points relative to a control group.`,
      scope: String.raw`The model below is a three-date consumption problem with log utility and a proportional fee $f$ on locked money (a stand-in for lost liquidity). The account study is one field experiment on one product; take-up and effects differ across settings.`,
      idea: String.raw`Dated 0, wealth $1$ is split into locked money $\ell$, paid out at date 2 (net of the fee), and liquid money $1-\ell$ spent by the date-1 self, who maximises $\ln c_1+\beta\delta\ln c_2$ and so consumes $c_1=(1-\ell)/(1+\beta\delta)$. The date-0 self wants $\ln c_1+\delta\ln c_2$, i.e. $c_1=(1-\ell)/(1+\delta)$, which is lower. Locking money moves consumption to date 2 against the date-1 self's wish; the benefit is the gain in $\ln c_1+\delta\ln c_2$ along the true path, the cost the fee. The optimal lock exists whenever $\beta<1$ and the fee is small, and vanishes at $\beta=1$.`,
      caption: String.raw`Drag the **gold handle** along the share of wealth locked. The green curve is the long-run self's welfare when the future self behaves as it really will (relative to the unreachable ideal); the dashed orange curve is what the **naive** agent believes, which only falls as you lock more. The green dot is the sophisticated choice, the orange dot the naive one (no lock). Raise the **fee** until the gain disappears, or set $\beta=1$.`,
      deps: ['behav-5.6'], refs: ['Nudge ch. 2', 'W&K ch. 8'], tags: ['commitment', 'savings'],
      credit: 'Strotz, 1955; Ashraf, Karlan & Yin, 2006',
      links: { doi: 'https://doi.org/10.1162/qjec.2006.121.2.635' },
      viz(v) {
        const be = v.slider('present bias $\\beta$', 0.3, 1, 0.6, { step: 0.01 });
        const dl = v.slider('$\\delta$', 0.8, 1, 0.95, { step: 0.01 });
        const fee = v.slider('fee on locked money $f$ (%)', 0, 30, 3, { step: 0.5 });
        const A = v.stage({ x: [0, 0.9], y: [-0.6, 0.05], axes: 'box', gutter: true, height: 320, xlabel: 'share of wealth locked until date 2', ylabel: 'welfare of the long-run self, relative to ideal', title: 'is it worth tying the future self’s hands?' });
        const B = v.stage({ x: [0, 3], y: [0, 0.75], axes: 'box', gutter: true, height: 320, xticks: [[0.75, 'ideal'], [1.5, 'no lock'], [2.25, 'your lock']], ylabel: 'consumption', title: 'consumption at date 1 and date 2' });
        const h = A.handle(0.3, -0.1, { color: 'gold', r: 8, constrain: (x) => [clamp(x, 0, 0.9), 0] });
        const path = (l, plan) => {
          const b = be.value, d = dl.value, f = fee.value / 100;
          const m = plan ? d : b * d;
          const c1 = (1 - l) / (1 + m), c2 = (1 - l) * m / (1 + m) + l * (1 - f);
          return [c1, c2];
        };
        const W = (l, plan) => { const [c1, c2] = path(l, plan); return Math.log(c1) + dl.value * Math.log(c2); };
        const ideal = () => W(0, true);
        const best = () => { let b = [-1e9, 0]; for (let i = 0; i <= 900; i++) { const l = i / 1000, w = W(l, false); if (w > b[0]) b = [w, l]; } return b; };
        v.legend([['green', 'true welfare (future self is present-biased)'], ['orange', 'what the naive agent expects', { dash: true }]]);
        v.render(() => {
          const I = ideal();
          A.fn((l) => W(l, false) - I, { color: 'green', width: 2.8, domain: [0, 0.9] });
          A.fn((l) => W(l, true) - I, { color: 'orange', width: 2.2, dash: true, domain: [0, 0.9] });
          A.hline(0, GUIDE);
          const l = h.x; h.set(l, W(l, false) - I);
          const [bw, bl] = best();
          A.dot(bl, bw - I, { r: 6, color: 'green', label: 'sophisticated', labelPos: 'ne' });
          A.dot(0, W(0, false) - I, { r: 6, color: 'orange', label: 'naive: no lock', labelPos: 'se' });
          const ps = [[path(0, true), 'purple', 0], [path(0, false), 'orange', 1], [path(l, false), 'green', 2]];
          ps.forEach(([[c1, c2], col, i]) => {
            B.rect(i + 0.12, 0, i + 0.48, c1, { fill: col, fillAlpha: 0.5, color: col, width: 1.4 });
            B.rect(i + 0.52, 0, i + 0.88, c2, { fill: col, fillAlpha: 0.25, color: col, width: 1.4 });
            B.text('c₁', i + 0.3, c1, { dy: -9, align: 'center', size: 11, weight: 700, color: col });
            B.text('c₂', i + 0.7, c2, { dy: -9, align: 'center', size: 11, weight: 700, color: col });
          });
        });
        v.readout(() => {
          const I = ideal(), [bw, bl] = best(), l = h.x;
          const ce = (w) => Math.exp((w - W(0, false)) / (1 + dl.value)) - 1;
          return `Your lock of ${pct(l)}: welfare ${fx(W(l, false) - I, 3)} against the no-lock outcome ${fx(W(0, false) - I, 3)}. The sophisticated agent locks **${pct(bl)}** and gains the equivalent of **${(100 * ce(bw)).toFixed(1)}%** more consumption in every period; the naive agent locks nothing and gets none of it. ${be.value >= 0.995 ? 'With β = 1 there is nothing to commit against.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.8
    {
      num: '5.8', kind: 'Phenomenon', name: 'Self-imposed deadlines (Ariely–Wertenbroch, retracted)',
      statement: String.raw`Present-biased people who know it may set deadlines for themselves that carry a cost for missing them, even though a deadline can only add constraints (behav-5.7). Ariely and Wertenbroch (2002) argued from a proofreading experiment that participants did choose binding deadlines, that this helped, and that deadlines spread evenly by an experimenter helped more. **That article has been retracted** (retraction recorded in September 2026, because the journal could no longer attest to the reliability of the findings, citing replication concerns, unconfirmed dataset authenticity/completeness and a Data Colada investigation), so its numbers are not used here. What stands is the logic of the mechanism, shown as a model: with three tasks and a procrastinator who does each on its deadline, **when** the deadlines fall decides how many tasks pile into one week and whether they fall in the weeks that are costly for you.`,
      scope: String.raw`A computational illustration of why a rational planner might choose deadlines, **not** evidence that people do or that spaced deadlines raise performance. The pure-procrastinator assumption (each task done in its last permitted week) and the cost numbers are mine. The retracted article cannot establish whether externally imposed deadlines beat self-chosen ones.`,
      idea: String.raw`With no deadline but the last, a procrastinator piles all three tasks into week 12, paying the convex crunch cost. Each additional deadline spreads the work, at the price of fixing a week for each task whether or not that week suits. A planner who knows which weeks are busy can place the deadlines in the good weeks and beat both the end deadline and mechanical spacing; an externally imposed even spacing ignores that knowledge, which is the argument for letting people choose. The fully informed, unconstrained planner in this model can simply select cheap weeks without imposing deadlines.`,
      caption: String.raw`Weeks 1–12; red columns are **busy** (every task done then costs extra). Drag the two **gold flags** to set the first two deadlines (the third is week 12). The bars on the right compare the total cost of the schedule you chose with the single end deadline, evenly spaced deadlines, the best self-chosen schedule (found by brute force), and the benchmark of someone with no present bias. Nothing here comes from the retracted study.`,
      deps: ['behav-5.6'], refs: ['W&K ch. 8'], tags: ['deadlines', 'procrastination'],
      credit: 'Ariely & Wertenbroch, 2002 (retracted 2026)',
      links: { doi: 'https://doi.org/10.1111/1467-9280.00441' },
      viz(v) {
        const W = 12, BUSY = [4, 8];
        const bz = v.slider('extra cost of a busy week', 0, 3, 1.5, { step: 0.25 });
        const gz = v.slider('crunch cost $g$ per pair of tasks in one week', 0, 3, 1.5, { step: 0.25 });
        const A = v.stage({ x: [0.5, W + 0.5], y: [-0.6, 4.2], axes: false, height: 320, title: 'a procrastinator does each task in its deadline week', hover: false });
        const B = v.stage({ x: [0, 5], y: [0, 10], axes: 'box', gutter: true, height: 320, ylabel: 'total cost of the three tasks', xticks: [[0.5, 'end only'], [1.5, 'even'], [2.5, 'yours'], [3.5, 'best'], [4.5, 'no bias']], title: 'which schedule is cheapest?' });
        const f1 = A.handle(4, 3.7, { color: 'gold', r: 9, label: 'd₁', constrain: (x) => [clamp(Math.round(x), 1, 11), 3.7] });
        const f2 = A.handle(8, 3.7, { color: 'gold', r: 9, label: 'd₂', constrain: (x) => [clamp(Math.round(x), 1, 11), 3.7] });
        const cost = (ds) => {
          const n = {}; ds.forEach((d) => { n[d] = (n[d] || 0) + 1; });
          let tot = 0;
          for (const d in n) tot += n[d] * (1 + (BUSY.includes(+d) ? bz.value : 0)) + gz.value * n[d] * (n[d] - 1) / 2;
          return tot;
        };
        const best = () => { let b = [1e9, null]; for (let a = 1; a <= W; a++) for (let c = a; c <= W; c++) { const k = cost([a, c, W]); if (k < b[0] - 1e-9) b = [k, [a, c, W]]; } return b; };
        const free = () => { const cs = []; for (let t = 1; t <= W; t++) cs.push(1 + (BUSY.includes(t) ? bz.value : 0)); return cs.sort((x, y) => x - y).slice(0, 3).reduce((s, x) => s + x, 0); };
        v.render(() => {
          const d1 = Math.min(f1.x, f2.x), d2 = Math.max(f1.x, f2.x), ds = [d1, d2, W];
          f1.set(Math.round(f1.x), 3.7); f2.set(Math.round(f2.x), 3.7);
          for (let t = 1; t <= W; t++) {
            const busy = BUSY.includes(t);
            A.rect(t - 0.45, 0.2, t + 0.45, 3.3, { fill: busy ? 'red' : 'panel', fillAlpha: busy ? 0.18 : 1, color: 'faint', width: 1, radius: 6 });
            A.text(String(t), t, 0.2, { dy: 14, align: 'center', size: 11.5, color: busy ? 'red' : 'muted', weight: 700 });
            const n = ds.filter((d) => d === t).length;
            for (let j = 0; j < n; j++) A.rect(t - 0.36, 0.55 + 0.9 * j, t + 0.36, 1.35 + 0.9 * j, { fill: 'accent', fillAlpha: 0.6, color: 'accent', width: 1.3, radius: 5 });
          }
          A.text('week', 6.5, 0.2, { dy: 34, align: 'center', size: 11.5, color: 'muted' });
          const [bc, bd] = best();
          const vals = [[cost([W, W, W]), 'muted'], [cost([4, 8, 12]), 'orange'], [cost(ds), 'accent'], [bc, 'green'], [free(), 'purple']];
          B.setView([0, 5], [0, Math.max(6, ...vals.map((x) => x[0])) * 1.18]);
          vals.forEach(([val, col], i) => {
            B.rect(i + 0.12, 0, i + 0.88, val, { fill: col, fillAlpha: 0.6, color: col, width: 1.4 });
            B.text(val.toFixed(2), i + 0.5, val, { dy: -10, align: 'center', size: 12, weight: 800, color: col });
          });
        });
        v.readout(() => {
          const ds = [Math.min(f1.x, f2.x), Math.max(f1.x, f2.x), W], [bc, bd] = best();
          return `Your deadlines: weeks ${ds.join(', ')} (cost **${cost(ds).toFixed(2)}**). End deadline only: ${cost([W, W, W]).toFixed(2)}; evenly spaced (4, 8, 12): ${cost([4, 8, 12]).toFixed(2)}; best self-chosen: weeks ${bd.join(', ')} at **${bc.toFixed(2)}**; no present bias: ${free().toFixed(2)}. ${bc < cost([4, 8, 12]) - 1e-9 ? 'Mechanical spacing loses to a schedule that knows which weeks are busy.' : 'Here even spacing already avoids the busy weeks.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.9
    {
      num: '5.9', kind: 'Phenomenon', name: 'Magnitude and sign effects in discounting',
      statement: String.raw`For a single exponential money-discount rate and linear utility of money, the amount $X$ that makes her indifferent between $a$ now and $X$ after a delay $t$ would give the same implied rate $\ln(X/a)/t$ whatever $a$ is. Experiments find instead (i) a **magnitude effect**: small amounts are discounted much more steeply than large ones (in Thaler's 1981 questions the median indifference points \$15 ~ \$60, \$250 ~ \$350 and \$3,000 ~ \$4,000 after one year imply 139%, 34% and 29% a year), and (ii) a **sign effect**: delayed losses are discounted less than delayed gains of the same size (Loewenstein and Prelec 1992; Thaler 1981). These medians contradict one common exponential rate applied to money with linear money utility; they do not by themselves exclude every discounted-utility model with nonlinear utility.`,
      scope: String.raw`Hypothetical questions, mostly student samples; the size of the effects depends on the elicitation. The functional form below is a convenience fitted by eye to the three amounts, and the loss factor is illustrative, not an estimate.`,
      idea: String.raw`The pattern says that the premium people demand for waiting grows much less than in proportion to the amount (at 15 dollars a year's wait is paid with a factor 4, at 3,000 with a factor 1.33). Several readings compete: diminishing sensitivity of utility to money, borrowing constraints and the fact that small sums can be spent without any planning, and mental accounting of small amounts (behav-4.1). Loewenstein and Prelec (1992) related the magnitude and sign effects, and the asymmetry between delaying and speeding up, to a reference-dependent value function (behav-2.3). Whatever the cause, one constant money-discount rate with linear money utility cannot describe these medians.`,
      caption: String.raw`Left: the implied annual rate against the **amount**, on log axes. The **green dots** are Thaler's three medians (original 1981 Table 2A, p. 204); the curve is $r(a)=r_\infty+(r_0-r_\infty)(15/a)^p$, adjustable with the sliders. The dashed line is a **single rate**. Drag the **gold point** along the amount. Right: what you would have to be paid, or would agree to pay, after a delay, for the chosen amount, under the curve and under the single rate. Switch to **losses** to see the sign effect.`,
      deps: ['behav-5.1'], refs: ['W&K ch. 7'], tags: ['discounting', 'magnitude effect', 'sign effect'],
      credit: 'Thaler, 1981; Loewenstein & Prelec, 1992',
      links: { doi: 'https://doi.org/10.1016/0165-1765(81)90067-7' },
      viz(v) {
        const sign = v.select('outcomes', [{ value: 'g', label: 'gains' }, { value: 'l', label: 'losses' }], 'g');
        const rInf = v.slider('rate for large sums $r_\\infty$ (per year)', 0.05, 0.6, 0.27, { step: 0.01 });
        const r0 = v.slider('rate for \\$15, $r_0$', 0.4, 3, 1.386, { step: 0.01 });
        const p = v.slider('curvature $p$', 0.3, 2, 1, { step: 0.05 });
        const rs = v.slider('single rate $r$ (per year)', 0.05, 1.5, 0.3, { step: 0.01 });
        const lossF = v.slider('losses discounted at this fraction of the gain rate (illustrative)', 0.2, 1, 0.5, { step: 0.05 });
        const t = v.slider('delay $t$ (years)', 0.25, 5, 1, { step: 0.25 });
        const DATA = [[15, 60], [250, 350], [3000, 4000]];
        const rate = (a) => (rInf.value + (r0.value - rInf.value) * Math.pow(15 / a, p.value)) * (sign.value === 'l' ? lossF.value : 1);
        const A = v.stage({ x: [8, 6000], y: [0.1, 3], axes: 'box', gutter: true, xlog: true, ylog: true, height: 330, xlabel: 'amount a (dollars)', ylabel: 'implied rate (per year; 1 = 100%)', title: 'implied discount rate depends on the amount' });
        const B = v.stage({ x: [0, 5], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'delay (years)', ylabel: 'amount later / amount now', title: 'compensation for waiting (chosen amount)' });
        const h = A.handle(100, 0.5, { color: 'gold', r: 8, constrain: (x) => { const a = clamp(x, 10, 5000); return [a, rate(a)]; } });
        v.legend([['blue', 'rate fitted to the three sums'], ['muted', 'single rate', { dash: true }], ['green', 'Thaler 1981, gains', { dot: true }]]);
        v.render(() => {
          A.fn(rate, { color: 'blue', width: 2.6 });
          A.hline(rs.value * (sign.value === 'l' ? lossF.value : 1), { color: 'muted', width: 2, dash: true });
          if (sign.value === 'g') DATA.forEach(([a, X]) => { A.dot(a, Math.log(X / a), { r: 6, color: 'green' }); A.text(a + ' → ' + X, a, Math.log(X / a), a > 1000 ? { dx: -9, dy: -12, align: 'right', size: 11, color: 'green', weight: 700 } : { dx: 9, dy: -11, size: 11, color: 'green', weight: 700 }); });
          const a = h.x; h.set(a, rate(a));
          const ra = rate(a), rsingle = rs.value * (sign.value === 'l' ? lossF.value : 1);
          B.setView([0, 5], [0.85, Math.max(1.6, Math.exp(Math.max(ra, rsingle) * 5) * 1.05)]);
          B.fn((x) => Math.exp(ra * x), { color: 'blue', width: 2.6 });
          B.fn((x) => Math.exp(rsingle * x), { color: 'muted', width: 2, dash: true });
          B.vline(t.value, GUIDE);
          B.dot(t.value, Math.exp(ra * t.value), { r: 6, color: 'blue' });
          B.dot(t.value, Math.exp(rsingle * t.value), { r: 6, color: 'muted' });
        });
        v.readout(() => {
          const a = h.x, ra = rate(a), rsingle = rs.value * (sign.value === 'l' ? lossF.value : 1), g = sign.value === 'g';
          const X1 = a * Math.exp(ra * t.value), X2 = a * Math.exp(rsingle * t.value);
          return `${g ? 'Being paid' : 'Paying'} ${usdR(a)} now versus later: after ${t.value} year${t.value === 1 ? '' : 's'} the indifference amount is **${usdR(X1)}** under the fitted curve (rate ${pct(ra)}) but ${usdR(X2)} under a single rate (${pct(rsingle)}). The data say the rate falls from ${pct(rate(15))} at \\$15 to ${pct(rate(3000))} at \\$3,000; no single rate can fit both, since the first is ${num(rate(15) / rate(3000), 1)} times the second.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.10
    {
      num: '5.10', kind: 'Phenomenon', name: 'The marshmallow test, re-examined',
      statement: String.raw`In Mischel's marshmallow studies at a Stanford nursery school, a child chooses between one treat now and two if she waits alone for the experimenter; the 1972 papers showed that how long children wait depends strongly on the strategies available to them (covering the treat, thinking about something else). Shoda, Mischel and Peake (1990) reported that for the children they could follow up, waiting time at about age 4 correlated with adolescent SAT scores (.57 math, .42 verbal, as quoted by Watts et al.). A conceptual replication in a much larger and more representative sample (Watts, Duncan and Quan 2018; $n=918$ at age 15, children of mothers without a college degree) found a bivariate standardized association of about **0.24** with age-15 achievement, **0.28** at first grade, roughly half the original size, which fell to about **0.05** once family background, early cognitive ability and the home environment were controlled. Most of the association came from waiting at least 20 seconds.`,
      scope: String.raw`The replication used a different task version in a sample of children from less advantaged families, so it is a conceptual rather than a direct replication; it tests the claim that early delay of gratification predicts later achievement as a stand-alone trait, not the finding that strategies matter in the moment. The coefficients are standardized regression coefficients, not Pearson correlations of the original kind.`,
      idea: String.raw`Children who can wait differ from those who cannot in many ways that also predict school success — household resources, early cognitive skills, the reliability of the adults around them — and the original sample (children of Stanford faculty and staff, a small fraction followed up) offered little variation in those. Adding controls to a regression absorbs the shared variance, and the leftover coefficient is what delay of gratification adds. The result is a lesson in omitted-variable bias and in treating a laboratory task as a trait; it does not make self-control irrelevant.`,
      caption: String.raw`Left: the original correlations (grey bars) against the replication's standardized coefficient of minutes waited, with 95% intervals, for the outcome you select, at each control level (none, early childhood and family controls, plus concurrent controls). Right: the same regression with waiting time in **groups**, relative to children who waited under 20 seconds; choose the controls. The gradient flattens and most of the gain sits in the first 20 seconds.`,
      deps: ['behav-5.3', 'causal-3.4'], refs: ['W&K ch. 8'], tags: ['replication', 'self-control'],
      credit: 'Mischel et al., 1972; Shoda, Mischel & Peake, 1990; Watts, Duncan & Quan, 2018',
      links: { doi: 'https://doi.org/10.1177/0956797618761661' },
      viz(v) {
        const out = v.select('outcome', [{ value: 'g1', label: 'Grade 1 achievement' }, { value: 'a15', label: 'age-15 achievement' }], 'a15');
        const ctl = v.select('controls (right panel)', [{ value: '0', label: 'none' }, { value: '1', label: '+ early & family' }, { value: '2', label: '+ concurrent' }], '0');
        const COEF = { g1: [[0.279, 0.038], [0.102, 0.033], [0.047, 0.030]], a15: [[0.236, 0.037], [0.081, 0.034], [0.050, 0.032]] };
        const GRP = {
          g1: [[0.298, 0.189, 0.127], [0.424, 0.206, 0.041], [0.720, 0.284, 0.141]],
          a15: [[0.353, 0.230, 0.178], [0.457, 0.300, 0.235], [0.646, 0.234, 0.150]],
        };
        const A = v.stage({ x: [0, 5.2], y: [0, 0.7], axes: 'box', gutter: true, height: 330, xticks: [[0.6, 'SAT math'], [1.5, 'SAT verbal'], [2.9, 'none'], [3.8, '+ early'], [4.7, '+ concurrent']], ylabel: 'correlation / standardized coefficient', title: 'waiting time and later achievement' });
        const B = v.stage({ x: [0, 3.2], y: [0, 0.75], axes: 'box', gutter: true, height: 330, xticks: [[0.5, '20 s–2 min'], [1.5, '2–7 min'], [2.5, 'full 7 min']], xlabel: 'time waited (reference: under 20 s)', ylabel: 'achievement gap (SD)', title: 'where the gain comes from' });
        v.legend([['faint', 'original (Shoda et al. 1990)'], ['blue', 'Watts et al. 2018, minutes waited'], ['orange', 'by group']]);
        v.render(() => {
          [[0.6, 0.57], [1.5, 0.42]].forEach(([x, val]) => {
            A.rect(x - 0.32, 0, x + 0.32, val, { fill: 'faint', fillAlpha: 0.35, color: 'muted', width: 1.4 });
            A.text(val.toFixed(2), x, val, { dy: -10, align: 'center', size: 12, weight: 800, color: 'muted' });
          });
          COEF[out.value].forEach(([b, se], i) => {
            const x = 2.9 + 0.9 * i, on = String(i) === ctl.value;
            A.rect(x - 0.32, 0, x + 0.32, b, { fill: 'blue', fillAlpha: on ? 0.75 : 0.4, color: 'blue', width: on ? 2.6 : 1.2 });
            errBar(A, x, b - 1.96 * se, b + 1.96 * se, { color: 'ink', cap: 0.08, width: 1.3 });
            A.text(b.toFixed(2), x, b + 1.96 * se, { dy: -10, align: 'center', size: 12, weight: 800, color: 'blue' });
          });
          A.vline(2.2, { color: 'grid', width: 1 });
          GRP[out.value].forEach((row, i) => {
            const val = row[+ctl.value], x = i + 0.5;
            B.rect(x - 0.32, 0, x + 0.32, val, { fill: 'orange', fillAlpha: 0.7, color: 'orange', width: 1.6 });
            B.text(val.toFixed(2), x, val, { dy: -10, align: 'center', size: 12, weight: 800, color: 'orange' });
          });
        });
        v.readout(() => {
          const c = COEF[out.value], k = +ctl.value;
          return `Per extra minute waited: **${c[0][0].toFixed(2)}** with no controls, **${c[1][0].toFixed(2)}** with early and family controls, **${c[2][0].toFixed(2)}** with concurrent controls (SE ${c[2][1].toFixed(2)}). That is ${pct(c[0][0] / 0.57)} of the original math correlation before controls and a fall of **${pct(1 - c[2][0] / c[0][0])}** after them. Groups at the chosen control level: ${GRP[out.value].map((r) => r[k].toFixed(2)).join(', ')} SD above the under-20-second group.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.11
    {
      num: '5.11', kind: 'Phenomenon', name: 'Projection bias and the hot–cold empathy gap',
      statement: String.raw`People underestimate how much their tastes will change with their physical or emotional state, and predict their future choices as if tomorrow's state were closer to today's (**projection bias**; Loewenstein, O'Donoghue and Rabin 2003), and the extreme version for visceral states is the **hot–cold empathy gap** (Loewenstein 1996). In Read and van Leeuwen's (1998) field experiment 200 office workers chose between a healthy and an unhealthy snack to be handed over in a week, and again on that day, while either hungry (late afternoon) or satisfied (just after lunch). Choosing in advance, 78% chose the unhealthy snack when hungry then and hungry on delivery, but only 26% when satisfied at both times; the state at the time of the advance choice, not just the state at consumption, moved the choice.`,
      scope: String.raw`One food experiment with a modest sample (50 per cell, no ages recorded); the model fits eight cells with four parameters and is meant to show the mechanism, not to estimate $\alpha$. The immediate-choice shares are derived from the paper's Table 1 percentages and are approximate.`,
      idea: String.raw`Write the taste for the unhealthy snack as a function of the state $s$ ($s=1$ hungry), $\Delta_0+\gamma s$ on a logit scale. A chooser in state $s$ forecasting state $s'$ uses $(1-\alpha)s'+\alpha s$: with $\alpha=0$ she is a perfect forecaster, with $\alpha=1$ she thinks her future taste is her present one. Read and van Leeuwen's design separates the two: advance choices depend on the state at choosing as well as the state at delivery, which no model with correct forecasts allows. It also shows a second effect: advance choices are healthier than immediate ones in every cell, a present-bias pattern (behav-5.5) layered on top.`,
      caption: String.raw`Left: the four conditions (state when choosing in advance, state on delivery: H hungry, S satisfied). Solid bars are the **data** — blue the advance choice, orange the immediate choice; the dots are the **model** with the sliders. **Fit** finds the best four parameters. Right: the model's advance choice as the projection weight $\alpha$ goes from 0 to 1; drag the **gold handle**. At $\alpha=1$ only today's state matters (HH = HS); at $\alpha=0$ only the delivery state does.`,
      deps: ['behav-5.1'], refs: ['W&K ch. 8'], tags: ['projection bias', 'empathy gap'],
      credit: 'George Loewenstein, 1996; Read & van Leeuwen, 1998; Loewenstein, O’Donoghue & Rabin, 2003',
      links: { doi: 'https://doi.org/10.1006/obhd.1998.2803' },
      viz(v) {
        // Table 1 of Read & van Leeuwen (1998): condition = state at advance choice, state on delivery (H hungry, S satisfied).
        const COND = [
          { name: 'HH', sa: 1, si: 1, nH: 11, pHU: 0.82, nU: 39, pUH: 0.05 },
          { name: 'SH', sa: 0, si: 1, nH: 23, pHU: 0.82, nU: 27, pUH: 0.07 },
          { name: 'HS', sa: 1, si: 0, nH: 28, pHU: 0.69, nU: 22, pUH: 0.0 },
          { name: 'SS', sa: 0, si: 0, nH: 37, pHU: 0.62, nU: 13, pUH: 0.08 },
        ];
        COND.forEach((c) => { c.adv = c.nU / 50; c.imm = (c.nU * (1 - c.pUH) + c.nH * c.pHU) / 50; });
        const d0 = v.slider('base taste for the unhealthy snack $\\Delta_0$ (logit)', -1, 3, 1.0, { step: 0.05 });
        const gm = v.slider('effect of hunger on taste $\\gamma$', 0, 3, 1.9, { step: 0.05 });
        const al = v.slider('projection weight $\\alpha$', 0, 1, 0.4, { step: 0.01 });
        const ph = v.slider('extra healthiness of advance choices $\\phi$', 0, 3, 1.9, { step: 0.05 });
        const fit = v.button('Fit the four parameters', () => {
          const f = (x) => {
            const [a0, g, a, p] = x, aa = clamp(a, 0, 1);
            return COND.reduce((s, c) => s + Math.pow(pAdv(c, a0, g, aa, p) - c.adv, 2) + Math.pow(pImm(c, a0, g) - c.imm, 2), 0);
          };
          const r = v.M.nelderMead(f, [d0.value, gm.value, al.value, ph.value], { step: 0.3, tol: 1e-10, maxIt: 800 });
          d0.set(clamp(r.x[0], -1, 3)); gm.set(clamp(r.x[1], 0, 3)); al.set(clamp(r.x[2], 0, 1)); ph.set(clamp(r.x[3], 0, 3));
        });
        const pImm = (c, a0, g) => logistic(a0 + g * c.si);
        const pAdv = (c, a0, g, a, p) => logistic(a0 - p + g * ((1 - a) * c.si + a * c.sa));
        const A = v.stage({ x: [0, 4], y: [0, 1], axes: 'box', gutter: true, height: 330, xticks: COND.map((c, i) => [i + 0.5, c.name]), xlabel: 'state when choosing in advance, state on delivery', ylabel: 'share choosing the unhealthy snack', title: 'Read & van Leeuwen (1998), 50 per cell' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'projection weight α', ylabel: 'model: advance choice, unhealthy', title: 'how the forecast leans on today’s state' });
        const hh = B.handle(0.4, 0, { color: 'gold', r: 8, constrain: (x) => [clamp(x, 0, 1), 0] });
        hh.onDrag = () => { al.set(hh.x); };
        const COL = ['red', 'orange', 'purple', 'green'];
        v.legend([['blue', 'advance choice (data)'], ['orange', 'immediate choice (data, derived)'], ['ink', 'model', { dot: true }]]);
        v.render(() => {
          hh.set(al.value, 0);
          COND.forEach((c, i) => {
            const x = i + 0.5;
            A.rect(x - 0.4, 0, x - 0.02, c.adv, { fill: 'blue', fillAlpha: 0.55, color: 'blue', width: 1.3 });
            A.rect(x + 0.02, 0, x + 0.4, c.imm, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1.3 });
            A.text(Math.round(100 * c.adv) + '%', x - 0.21, 0, { dy: -12, align: 'center', size: 11, weight: 700, color: 'blue' });
            A.text(Math.round(100 * c.imm) + '%', x + 0.21, 0, { dy: -12, align: 'center', size: 11, weight: 700, color: 'orange' });
            A.dot(x - 0.21, pAdv(c, d0.value, gm.value, al.value, ph.value), { r: 6, color: 'ink' });
            A.dot(x + 0.21, pImm(c, d0.value, gm.value), { r: 6, color: 'ink' });
          });
          COND.forEach((c, i) => {
            B.fn((a) => pAdv(c, d0.value, gm.value, a, ph.value), { color: COL[i], width: 2.4, domain: [0, 1] });
            B.dot(al.value, pAdv(c, d0.value, gm.value, al.value, ph.value), { r: 5, color: COL[i], label: c.name, labelPos: 'e' });
          });
          B.vline(al.value, GUIDE);
        });
        v.readout(() => {
          const sse = COND.reduce((s, c) => s + Math.pow(pAdv(c, d0.value, gm.value, al.value, ph.value) - c.adv, 2) + Math.pow(pImm(c, d0.value, gm.value) - c.imm, 2), 0);
          const hungryEffect = pAdv(COND[0], d0.value, gm.value, al.value, ph.value) - pAdv(COND[1], d0.value, gm.value, al.value, ph.value);
          return `Data: the advance choice rises from ${pct(COND[3].adv)} (SS) to ${pct(COND[0].adv)} (HH); the gap between HH and SH, same delivery state, is ${pct(COND[0].adv - COND[1].adv)} and must come from today's hunger. Model gap ${pct(hungryEffect)}; root-mean-square error over the eight cells **${pct(Math.sqrt(sse / 8), 1)}**. With $\\alpha=0$ that gap would be zero.`;
        });
      },
    },
  ],
};
