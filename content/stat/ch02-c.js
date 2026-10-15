// Statistical Inference — Chapter 2: Sufficiency and the likelihood principle (items 2.13–2.17; header and 2.1–2.6 in ch02.js)
import {
  SQ2PI, phi, clamp, commas, pct, hashStr, memo, mean, moments, qSorted, sortNum, binned, fmtP,
  viewPad, axisLabels, legender, titler, repeater, lchoose, choose, digamma, trigamma,
} from './ch02.shared.js';

// ── coin-tossing experiments: binomial (n tosses planned) and negative binomial (toss until the r-th tail) ──
const binPmf = (n, k, p) => (k < 0 || k > n ? 0 : Math.exp(lchoose(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p)));
const nbPmf = (r, y, p) => (y < 0 ? 0 : Math.exp(lchoose(y + r - 1, r - 1) + y * Math.log(p) + r * Math.log1p(-p))); // y heads before the r-th tail
const binTail = (n, h, p) => { let s = 0; for (let k = h; k <= n; k++) s += binPmf(n, k, p); return s; };
const nbTail = (r, h, p) => { let s = 0; for (let y = 0; y < h; y++) s += nbPmf(r, y, p); return Math.max(0, 1 - s); };
/** Smallest h with P(Bin(n, ½) ≥ h) ≤ α (n + 1 if none): the optional-stopping boundary. */
const critH = (n, a = 0.05) => { for (let h = 0; h <= n; h++) if (binTail(n, h, 0.5) <= a) return h; return n + 1; };
const CRIT = Array.from({ length: 41 }, (_, n) => critH(n));

export default {
  collection: 'stat',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Principle',
      name: 'Likelihood principle',
      credit: 'Fisher, 1922 (implicit); Barnard, 1949; Birnbaum, 1962',
      statement: String.raw`**Likelihood principle (LP).** If two experiments $E_1$ and $E_2$ about the same parameter $\theta$ produce outcomes $x_1$ and $x_2$ whose likelihood functions are proportional,
$$L_1(\theta;x_1)=c\,L_2(\theta;x_2)\quad\text{for all }\theta,\ \text{with }c>0\text{ not depending on }\theta,$$
then the two outcomes carry identical evidence about $\theta$: $\mathrm{Ev}(E_1,x_1)=\mathrm{Ev}(E_2,x_2)$. In particular, once the data are in, inference should depend on them only through the observed likelihood function, and not on outcomes that could have occurred but did not.

Example: 9 heads and 3 tails, either from 12 planned tosses, $L_1=\binom{12}{9}p^9(1-p)^3$, or from tossing until the third tail, $L_2=\binom{11}{2}p^9(1-p)^3$; the ratio is $220/55=4$ for every $p$.`,
      scope: String.raw`Satisfied by Bayesian inference and by pure likelihood methods (maximum likelihood, likelihood intervals, likelihood ratios). Violated by any method that averages over the sample space: p-values, confidence coefficients, unbiasedness, error rates. Whether it should be accepted is the central divide in the foundations of statistics; Birnbaum (2.16) derived it from the sufficiency and conditionality principles.`,
      idea: String.raw`Within one experiment the likelihood function is the minimal sufficient statistic (2.6), so the sufficiency principle already says that two outcomes with proportional likelihoods are equivalent; the LP extends this across experiments, and conditionality (2.12) is what bridges the gap (2.16). In the coin example, every sequence with 9 heads and 3 tails has probability $p^9(1-p)^3$ whatever the plan; the plan only decides how many sequences end at that point (220 or 55), a factor free of $p$ (2.11). Methods that look only at the observed likelihood therefore cannot tell the experiments apart, while tail areas sum over different sets of unobserved outcomes.`,
      caption: String.raw`Choose the numbers of heads and tails observed. Left: the two likelihoods; the negative binomial one rescaled by the constant $c$ (dashed) lies exactly on the binomial one. Right: the two sampling distributions of the number of heads under $p=\tfrac12$, with the outcomes at least as extreme as the observed one shaded. Bottom: what each experiment reports. Every row computed from the likelihood alone agrees (green); every row that uses outcomes that did not occur disagrees (red).`,
      deps: ['stat-2.11', 'stat-2.12', 'stat-2.2'],
      refs: ['Casella–Berger §6.3'],
      tags: ['likelihood principle', 'foundations'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Likelihood_principle' },
      viz(v) {
        const hS = v.slider('heads observed $h$', 1, 20, 9, { int: true });
        const tS = v.slider('tails observed $t$', 1, 8, 3, { int: true });
        const sL = v.stage({ x: [0, 1], y: [0, 1], height: 260, axes: 'box', weight: 1, title: 'likelihoods of the observed data, as functions of $p$' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], height: 260, axes: 'box', weight: 1.15, title: 'sampling distributions of the heads count at $p=\\frac12$' });
        const sT = v.stage({ x: [0, 1], y: [0, 1], height: 220, axes: false, full: true });
        const T = v.table(sT, { rows: 5, cols: 4, square: false, maxCell: 36, cellAspect: 6, colWeights: [1.6, 1.2, 1.2, 0.75], size: 14, margin: 4,
          colLabels: ['method', 'binomial: n fixed', 'negative binomial: t fixed', 'obeys the LP?'] });
        const lg = legender(v);
        let info = null;
        v.render(() => {
          const h = hS.value, t = tS.value, n = h + t, c = Math.exp(lchoose(n, h) - lchoose(n - 1, t - 1));
          const L1 = (p) => binPmf(n, h, p), L2 = (p) => nbPmf(t, h, p);
          const ph = h / n, top = L1(ph) * 1.15;
          viewPad(sL, [0, 1], [0, top], { left: 50 });
          sL.fn(L1, { domain: [0, 1], color: 'accent', width: 4.5, alpha: 0.85 });
          sL.fn(L2, { domain: [0, 1], color: 'orange', width: 2.4 });
          sL.fn((p) => c * L2(p), { domain: [0, 1], color: 'orange', width: 2, dash: [6, 5] });
          sL.vline(ph, { color: 'muted', width: 1, dash: [3, 4] });
          sL.text(`× c = ${v.fix(c, 3)}`, ph, L2(ph), { dx: -10, dy: -10, align: 'right', color: 'orange', size: 12, weight: 600 });
          // sampling distributions at p = 1/2
          const K = Math.max(n, Math.ceil(t + 6 * Math.sqrt(2 * t) + 6), h + 3);
          let ymax = 0; for (let k = 0; k <= K; k++) ymax = Math.max(ymax, binPmf(n, k, 0.5), nbPmf(t, k, 0.5));
          viewPad(sR, [-0.7, K + 0.7], [0, ymax * 1.18], { left: 40 });
          for (let k = 0; k <= K; k++) {
            const tail = k >= h, b = binPmf(n, k, 0.5), q = nbPmf(t, k, 0.5);
            if (b > 0) sR.rect(k - 0.4, 0, k - 0.02, b, { fill: 'accent', fillAlpha: tail ? 0.8 : 0.22, stroke: false });
            sR.rect(k + 0.02, 0, k + 0.4, q, { fill: 'orange', fillAlpha: tail ? 0.8 : 0.22, stroke: false });
          }
          sR.vline(h - 0.5, { color: 'red', width: 1.6, dash: [5, 4] });
          const p1 = binTail(n, h, 0.5), p2 = nbTail(t, h, 0.5);
          sR.text(`P(X ≥ ${h}) = ${p1.toFixed(4)}`, K + 0.6, ymax * 1.08, { align: 'right', color: 'accent', size: 12, weight: 700 });
          sR.text(`P(Y ≥ ${h}) = ${p2.toFixed(4)}`, K + 0.6, ymax * 0.96, { align: 'right', color: 'orange', size: 12, weight: 700 });
          // what each experiment reports
          const root = (a, b, f) => { for (let i = 0; i < 80; i++) { const m = 0.5 * (a + b); if (f(a) * f(m) <= 0) b = m; else a = m; } return 0.5 * (a + b); };
          const ll = (p) => h * Math.log(p) + t * Math.log1p(-p) - (h * Math.log(ph) + t * Math.log1p(-ph)) + Math.log(8);
          const lo = root(1e-9, ph, ll), hi = ph < 1 ? root(ph, 1 - 1e-12, ll) : 1;
          const unbN = h / (h + t - 1);
          const rows = [
            ['maximum likelihood p̂', ph.toFixed(3), ph.toFixed(3), true],
            ['1/8 likelihood interval', `[${lo.toFixed(3)}, ${hi.toFixed(3)}]`, `[${lo.toFixed(3)}, ${hi.toFixed(3)}]`, true],
            ['posterior mean (uniform prior)', ((h + 1) / (n + 2)).toFixed(3), ((h + 1) / (n + 2)).toFixed(3), true],
            ['unbiased estimate of p', `${(h / n).toFixed(3)}  (h/n)`, `${unbN.toFixed(3)}  (h/(n−1))`, false],
            ['p-value for p = ½ against p > ½', p1.toFixed(4), p2.toFixed(4), false],
          ];
          T.draw({ value: (i, j) => (j < 3 ? rows[i][j] : rows[i][3] ? 'yes' : 'no'), fill: (i, j) => (j === 3 ? [rows[i][3] ? 'green' : 'red', 0.22] : j > 0 && !rows[i][3] ? ['red', 0.07] : null), textColor: (i, j) => (j === 3 ? (rows[i][3] ? 'green' : 'red') : null), weight: (i, j) => (j === 3 ? 700 : 500) });
          lg([['accent', `binomial: $n=${n}$ tosses planned`], ['orange', `negative binomial: toss until tail number $${t}$`], ['orange', `negative binomial × $c$`, { dash: true }], ['red', 'as or more extreme than observed', { dash: true }]]);
          let dev = 0; for (let i = 1; i < 200; i++) { const p = i / 200; dev = Math.max(dev, Math.abs(L1(p) / L2(p) - c) / c); }
          info = { h, t, n, c, p1, p2, dev };
        });
        v.readout(() => {
          if (!info) return '';
          const { h, t, n, c, p1, p2, dev } = info;
          const sig = (p) => (p < 0.05 ? 'significant at 5%' : 'not significant at 5%');
          return String.raw`$L_{\text{bin}}/L_{\text{negbin}}=\binom{${n}}{${h}}\big/\binom{${n - 1}}{${t - 1}}=${v.fix(c, 3)}$ at every $p$ (largest relative deviation over 199 values of $p$: $${dev < 1e-15 ? '0' : v.sci(dev, 1)}$) · so maximum likelihood, likelihood intervals and every Bayesian posterior coincide · but the binomial p-value is ${v.fix(p1, 4)} (${sig(p1)}) and the negative binomial one ${v.fix(p2, 4)} (${sig(p2)})` + (h === 9 && t === 3 ? ' — the classic 0.073 against 0.033 (Lindley and Phillips, 1976)' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.14
    {
      num: '2.14',
      kind: 'Paradox',
      name: 'Stopping rules: binomial versus negative binomial',
      credit: 'Lindley & Phillips, 1976; after Barnard, Jeffreys and Savage',
      statement: String.raw`A coin is tossed and shows 9 heads and 3 tails, and we test $H_0:p=\tfrac12$ against $p>\tfrac12$. If the experimenter had planned 12 tosses, the number of heads is binomial and the p-value is
$$P(X\ge9)=\frac{220+66+12+1}{2^{12}}=\frac{299}{4096}\approx0.073,$$
not significant at 5%. If she had planned to toss until the third tail, the number of heads is negative binomial and the p-value is
$$P(\text{at least 9 heads before the 3rd tail})=1-\sum_{y=0}^{8}\binom{y+2}{2}2^{-(y+3)}=\frac{67}{2048}\approx0.033,$$
significant at 5%. The data and the likelihood, $\propto p^9(1-p)^3$, are the same; only the experimenter's intention differs. More generally, a significance test depends on the stopping rule, while likelihood and Bayesian inferences do not (the **stopping rule principle**, a consequence of the likelihood principle 2.13). Optional stopping ("toss until the result is significant") inflates the frequentist error rate without changing any likelihood.`,
      idea: String.raw`A stopping rule is a stopping time (prob-4.2.8a): the decision to stop after $k$ tosses depends only on the first $k$ results. Every such rule assigns each sequence that ends at $t$ tails and $h$ heads the probability $p^h(1-p)^t$; the rule only decides which endpoints are possible and how many paths reach each one. So the likelihood is the same up to a constant, but the reference set of "outcomes at least as extreme" is different, and so is the p-value. Under $H_0$ the likelihood ratio $L(p_1)/L(\tfrac12)$ is a martingale (prob-4.3.6), so no stopping rule can make it large often (by optional stopping it exceeds $k$ with probability at most $1/k$), whereas a p-value can be driven below 0.05 by sampling long enough.`,
      caption: String.raw`The lattice of tosses: each path goes right on a tail and up on a head; the observed sequence (green) ends at 3 tails and 9 heads, which lies on both stopping boundaries, the diagonal of 12 planned tosses (blue) and the line of the third tail (orange). Pick a stopping rule and simulate experiments at the chosen true $p$ (faint gold paths, endpoints sized by frequency). Right: the simulated null distribution of the number of heads with the tail $\ge9$ shaded, giving 0.073 for one plan and 0.033 for the other; under optional stopping, the share of null experiments declared significant climbs well past 5%.`,
      deps: ['stat-2.13', 'prob-4.2.8a'],
      see: ['prob-4.3.6', 'prob-4.8.3'],
      refs: ['Casella–Berger §6.3'],
      tags: ['likelihood principle', 'stopping rules', 'paradox'],
      viz(v) {
        const ruleS = v.select('stopping rule', [{ value: 'bin', label: '12 tosses planned' }, { value: 'nb', label: 'until the 3rd tail' }, { value: 'opt', label: 'until $p\\le0.05$ (at most 30)' }], 'nb');
        const pS = v.slider('true chance of heads $p$', 0.2, 0.8, 0.5, { step: 0.01 });
        const sL = v.stage({ x: [-0.6, 12.6], y: [-0.6, 14.6], equal: true, height: 360, axes: 'box', weight: 1, title: 'tosses as lattice paths: right = tail, up = head' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], height: 360, axes: 'box', weight: 1.05 });
        const tR = titler(sR), lg = legender(v);
        const OBS = [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0]; // 9 heads, 3 tails, ends on the third tail
        const run = (r, rule, p) => {
          let h = 0, t = 0, bits = 0, len = 0, sig = 0;
          for (;;) {
            const head = r() < p; if (head) { h++; bits |= 1 << len; } else t++; len++;
            if (rule === 'bin' && len === 12) break;
            if (rule === 'nb' && t === 3) break;
            if (rule === 'opt') { if (h >= CRIT[len]) { sig = 1; break; } if (len === 30) break; }
          }
          return [t, h, sig, bits, len];
        };
        const R = repeater(v, { key: () => [ruleS.value, pS.value].join('|'), sample: (r) => run(r, ruleS.value, pS.value), init: 4000 });
        const pathPts = (bits, len, off) => { const pts = [[off, off]]; let h = 0, t = 0; for (let i = 0; i < len; i++) { if ((bits >> i) & 1) h++; else t++; pts.push([t + off, h + off]); } return pts; };
        // exact optional-stopping rejection probability by dynamic programming over (n, h)
        const optExact = (p) => { let alive = new Float64Array(41); alive[0] = 1; const cum = [0]; let rej = 0; for (let n = 1; n <= 30; n++) { const nx = new Float64Array(41); for (let h = 0; h < n; h++) { nx[h + 1] += alive[h] * p; nx[h] += alive[h] * (1 - p); } for (let h = CRIT[n]; h <= n; h++) { rej += nx[h]; nx[h] = 0; } alive = nx; cum.push(rej); } return cum; };
        let info = null;
        v.render(() => {
          const S = R.sync(), rule = ruleS.value, p = pS.value, N = S.vals.length;
          const big = rule === 'opt';
          viewPad(sL, big ? [-0.6, 20.6] : [-0.6, 12.6], big ? [-0.6, 20.6] : [-0.6, 14.6], { left: 22, bottom: 16 });
          const X1 = big ? 20 : 12, Y1 = big ? 20 : 14;
          for (let i = 0; i <= X1; i++) for (let j = 0; j <= Y1; j++) sL.dot(i, j, { r: 1.3, color: 'faint' });
          // the boundaries
          sL.line(0, 12, 12, 0, { color: 'accent', width: rule === 'bin' ? 3.2 : 1.6, alpha: rule === 'bin' ? 1 : 0.5 });
          sL.line(3, 0, 3, Y1, { color: 'orange', width: rule === 'nb' ? 3.2 : 1.6, alpha: rule === 'nb' ? 1 : 0.5 });
          if (big) { const pts = []; for (let n = 1; n <= 30; n++) if (CRIT[n] <= n) pts.push([n - CRIT[n], CRIT[n]]); sL.path(pts, { color: 'purple', width: 3 }); sL.dots(pts, { r: 3, color: 'purple' }); sL.line(0, 30, 30, 0, { color: 'purple', width: 1.4, dash: [5, 4] }); }
          // simulated paths and endpoints
          const last = S.vals.slice(-40);
          last.forEach(([, , , bits, len], i) => sL.path(pathPts(bits, len, ((i % 9) - 4) * 0.035), { color: 'gold', width: 1.2, alpha: 0.35 }));
          const ends = new Map(); for (const [t, h] of S.vals) { const k = t + ',' + h; ends.set(k, (ends.get(k) || 0) + 1); }
          for (const [k, c] of ends) { const [t, h] = k.split(',').map(Number); sL.dot(t, h, { r: 1.5 + 9 * Math.sqrt(c / N), color: 'gold', alpha: 0.85 }); }
          sL.path(pathPts(OBS.reduce((b, x, i) => b | (x << i), 0), 12, 0), { color: 'green', width: 3.4 });
          sL.dot(3, 9, { r: 6.5, color: 'green' });
          sL.text('observed: 3 tails, 9 heads', 3, 9, { dx: 11, dy: -2, color: 'green', size: 12, weight: 700 });
          sL.text('12 tosses', big ? 9.4 : 9.3, big ? 2.6 : 2.7, { color: 'accent', size: 11.5, weight: 600, align: 'left' });
          sL.text('3rd tail', 3, Y1 - 0.3, { dx: 6, color: 'orange', size: 11.5, weight: 600, align: 'left' });
          axisLabels(sL, '\\text{tails}', '\\text{heads}');
          // right panel
          let extra = {};
          if (!big) {
            const K = rule === 'bin' ? 12 : 16, cnt = new Array(K + 1).fill(0); let tail = 0, over = 0;
            for (const [, h] of S.vals) { if (h <= K) cnt[h]++; else over++; if (h >= 9) tail++; }
            const ex = (k) => (rule === 'bin' ? binPmf(12, k, p) : nbPmf(3, k, p));
            let top = 0; for (let k = 0; k <= K; k++) top = Math.max(top, cnt[k] / N, ex(k));
            viewPad(sR, [-0.7, K + 0.7], [0, top * 1.2], { left: 40 });
            for (let k = 0; k <= K; k++) { sR.rect(k - 0.38, 0, k + 0.38, cnt[k] / N, { fill: k >= 9 ? 'red' : 'gold', fillAlpha: k >= 9 ? 0.55 : 0.45, stroke: false }); sR.line(k - 0.42, ex(k), k + 0.42, ex(k), { color: 'ink', width: 2 }); }
            const exT = rule === 'bin' ? binTail(12, 9, p) : nbTail(3, 9, p);
            tR(rule === 'bin' ? 'heads in 12 tosses, simulated (bars) and exact (ticks)' : 'heads before the 3rd tail, simulated (bars) and exact (ticks)');
            sR.text(`P(heads ≥ 9): ${(tail / N).toFixed(4)} simulated, ${exT.toFixed(4)} exact`, K + 0.6, top * 1.12, { align: 'right', color: 'red', size: 12, weight: 700 });
            extra = { tail: tail / N, exT, N };
            lg([['green', 'observed sequence'], ['gold', 'simulated experiments', { dot: true }], ['accent', 'stop after 12 tosses'], ['orange', 'stop at the 3rd tail'], ['red', 'at least 9 heads', { area: true }], ['ink', 'exact law']]);
          } else {
            const ex = optExact(p), simCum = new Array(31).fill(0); let rej = 0;
            for (const [, , sig, , len] of S.vals) if (sig) simCum[len]++;
            for (let n = 1; n <= 30; n++) { rej += simCum[n]; simCum[n] = rej / N; }
            viewPad(sR, [0, 30.5], [0, Math.max(0.12, ex[30] * 1.25, simCum[30] * 1.25)], { left: 44 });
            sR.hline(0.05, { color: 'green', width: 1.6, dash: [6, 4] });
            sR.text('nominal 5%', 30.3, 0.05, { align: 'right', dy: -9, color: 'green', size: 11, weight: 600 });
            for (let n = 1; n <= 30; n++) sR.rect(n - 0.4, 0, n + 0.4, simCum[n], { fill: 'purple', fillAlpha: 0.4, stroke: false });
            sR.path(ex.flatMap((c, n) => [[n - 0.5, c], [n + 0.5, c]]), { color: 'ink', width: 2 });
            tR(p === 0.5 ? 'share of null experiments declared significant by toss $n$' : 'share of experiments declared significant by toss $n$');
            axisLabels(sR, 'n', null);
            extra = { rej: simCum[30], ex: ex[30], N };
            lg([['green', 'observed sequence'], ['gold', 'simulated experiments', { dot: true }], ['purple', 'stop as soon as $p\\le0.05$', { area: true }], ['ink', 'exact (dynamic programming)']]);
          }
          info = { rule, p, ...extra };
        });
        v.readout(() => {
          if (!info) return '';
          const { rule, p, N } = info, se = (q) => 2 * Math.sqrt(q * (1 - q) / N);
          const atNull = Math.abs(p - 0.5) < 1e-9;
          if (rule === 'opt') return String.raw`${commas(N)} experiments at $p=${v.fix(p, 2)}$: declared significant ${pct(info.rej, 1)} ± ${pct(se(info.rej), 1)} of the time (exact ${pct(info.ex, 2)})` + (atNull ? ' — **more than double the nominal 5%**, from a rule that only looks at the data so far; yet every stopped sequence still has likelihood $\\propto p^h(1-p)^t$, so by the likelihood principle the evidence is unaffected' : ' (power at this $p$)');
          const which = rule === 'bin' ? 'binomial (12 tosses planned)' : 'negative binomial (until the 3rd tail)';
          return String.raw`${commas(N)} experiments, ${which}, at $p=${v.fix(p, 2)}$: share with at least 9 heads ${v.fix(info.tail, 4)} ± ${v.fix(se(info.tail), 4)}, exact ${v.fix(info.exT, 4)}` + (atNull ? (rule === 'bin' ? ' $=299/4096$: the p-value of 9 heads and 3 tails is **0.073, not significant**' : ' $=67/2048$: the p-value of the same 9 heads and 3 tails is **0.033, significant**') + ' · the likelihood of the observed sequence is $p^9(1-p)^3$ under both plans (times 220 or 55 paths), so its evidence is the same' : ' (power against this $p$)');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.15
    {
      num: '2.15',
      kind: 'Principle',
      name: 'Equivariance principle',
      credit: 'Pitman, 1939; Hunt & Stein, 1946',
      statement: String.raw`Suppose a model is invariant under a group of transformations of the data: in the location–scale case, if $X\sim P_{\mu,\sigma}$ then $a+bX\sim P_{a+b\mu,\,b\sigma}$ for every $a$ and $b>0$. The **equivariance principle** asks that estimators respond to transformed data the way the parameter does,
$$\hat\mu(a+bx)=a+b\,\hat\mu(x),\qquad\hat\sigma(a+bx)=b\,\hat\sigma(x),$$
so that two statisticians who record the same data in different units (°C and °F) reach the same conclusion. The mean, the median, the midrange, trimmed means and the Pitman estimator are location–scale equivariant; shrinkage toward a fixed point, such as $\frac{n}{n+k}\bar x$, is not. A location-equivariant estimator has constant risk: its bias and mean squared error do not depend on $\mu$, so equivariant estimators can be ranked by a single number, and the best of them is the Pitman estimator.`,
      scope: String.raw`Applies when the model and the loss are invariant under the group and there is no natural origin or scale. When there is genuine prior information (a parameter known to be near 0, a physical bound), non-equivariant estimators can do better, and in three or more dimensions the best equivariant estimator of a normal mean is inadmissible (Stein's phenomenon).`,
      idea: String.raw`Transforming the data maps the model to itself (1.18), so the transformed problem is "the same problem in new units", and its answer should be the transformed answer. For a location-equivariant $\delta$, $\delta(X)-\mu=\delta(X-\mu)=\delta(Z)$ with $Z=X-\mu$ whose law does not depend on $\mu$, so the error has the same distribution for every $\mu$ and the risk is constant; a shrinkage estimator gains near its target and loses far from it.`,
      caption: String.raw`Top: eight temperature readings in °C and four estimates of their centre. Middle: the same readings transformed by $x\mapsto a+bx$ (press **°C → °F** or drag $a$ and $b$): filled markers are the estimators applied to the new data, rings are the old estimates transformed. They coincide for the mean, median and midrange; the shrinkage estimator gives two different answers, depending on the units. Bottom: simulated mean squared error (dots) against the true $\mu$ for normal samples of size 8: flat for the equivariant estimators, U-shaped for shrinkage.`,
      deps: ['stat-1.18'],
      refs: ['Casella–Berger §6.4'],
      tags: ['equivariance', 'invariance', 'foundations'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equivariant_map#Statistics' },
      viz(v) {
        const aS = v.slider('shift $a$', -40, 40, 32, { step: 0.5 });
        const bS = v.slider('scale $b$', 0.2, 3, 1.8, { step: 0.05 });
        v.button('°C → °F', () => { aS.set(32); bS.set(1.8); });
        v.button('no change', () => { aS.set(0); bS.set(1); });
        let seed = 3; v.button('New readings', () => { seed++; });
        const s1 = v.stage({ x: [0, 1], y: [-0.6, 1.4], height: 118, axes: false, full: true });
        const s2 = v.stage({ x: [0, 1], y: [-0.6, 1.4], height: 118, axes: false, full: true });
        const s3 = v.stage({ x: [-4, 4], y: [0, 0.4], height: 230, axes: 'box', full: true, title: 'mean squared error against the true $\\mu$ (normal samples, $n=8$, $\\sigma=1$)' });
        const t1 = titler(s1), t2 = titler(s2);
        const n = 8, k = 2;
        const EST = [
          { id: 'mean', name: 'mean', col: 'accent', f: (xs) => mean(xs) },
          { id: 'med', name: 'median', col: 'green', f: (xs) => qSorted(sortNum(xs), 0.5) },
          { id: 'mid', name: 'midrange', col: 'teal', f: (xs) => (Math.min(...xs) + Math.max(...xs)) / 2 },
          { id: 'shr', name: 'shrink to 0: $\\frac{n}{n+2}\\bar x$', short: 'shrinkage', col: 'red', f: (xs) => (n / (n + k)) * mean(xs) },
        ];
        const dc = memo();
        const data = () => dc(seed, () => { const r = v.rng(hashStr('eq|' + seed)), xs = []; for (let i = 0; i < n; i++) xs.push(Math.round((16 + 3 * r.normal()) * 10) / 10); return xs; });
        const rc = memo();
        const risk = () => rc('r', () => { // simulated MSE on a grid of μ (2,000 samples each)
          const out = EST.map(() => []);
          for (let m = -4; m <= 4.001; m += 0.5) {
            const r = v.rng(hashStr('risk|' + m.toFixed(1))), se = EST.map(() => 0), N = 2000;
            for (let i = 0; i < N; i++) { const xs = []; for (let j = 0; j < n; j++) xs.push(m + r.normal()); EST.forEach((E, q) => { se[q] += (E.f(xs) - m) ** 2; }); }
            EST.forEach((E, q) => out[q].push([m, se[q] / N]));
          }
          return out;
        });
        const line = (s, xs, ests, unit) => {
          const lo = Math.min(...xs, ...ests.flat()), hi = Math.max(...xs, ...ests.flat()), pad = 0.08 * (hi - lo) + 0.5;
          s.setView([lo - pad, hi + pad], [-0.6, 1.4]);
          s.line(lo - pad, 0, hi + pad, 0, { color: 'muted', width: 1.4 });
          const step = Math.pow(10, Math.floor(Math.log10((hi - lo + 2 * pad) / 4))), st = (hi - lo + 2 * pad) / step > 8 ? step * 2 : step;
          for (let t = Math.ceil((lo - pad) / st) * st; t <= hi + pad; t += st) { s.line(t, -0.06, t, 0.06, { color: 'muted' }); s.text(`${v.fix(t, st < 1 ? 1 : 0)}`, t, -0.3, { align: 'center', size: 11, color: 'muted' }); }
          xs.forEach((x) => s.dot(x, 0.18, { r: 4, color: 'gold' }));
          s.text(unit, hi + pad, -0.3, { align: 'right', dx: -4, size: 12, color: 'muted', weight: 600 });
        };
        let info = null;
        v.render(() => {
          const xs = data(), a = aS.value, b = bS.value, ys = xs.map((x) => a + b * x);
          const e0 = EST.map((E) => E.f(xs)), e1 = EST.map((E) => E.f(ys)), et = e0.map((e) => a + b * e);
          line(s1, xs, [e0], '°C');
          EST.forEach((E, q) => { s1.line(e0[q], 0.35, e0[q], 0.95 - 0.13 * q, { color: E.col, width: 1.4 }); s1.dot(e0[q], 0.95 - 0.13 * q, { r: 5.5, color: E.col }); });
          t1('readings in the original units (°C) and four estimates of the centre');
          line(s2, ys, [e1, et], a === 32 && b === 1.8 ? '°F' : 'new units');
          EST.forEach((E, q) => { const y = 0.95 - 0.13 * q; s2.line(e1[q], 0.35, e1[q], y, { color: E.col, width: 1.4 }); s2.dot(et[q], y, { r: 8.5, color: E.col, hollow: true, width: 2.2 }); s2.dot(e1[q], y, { r: 5.5, color: E.col }); if (Math.abs(e1[q] - et[q]) > 1e-9) s2.line(Math.min(e1[q], et[q]), y, Math.max(e1[q], et[q]), y, { color: E.col, width: 2.2, dash: [4, 3] }); });
          t2(`transformed readings $a+bx$ with $a=${v.fix(a, 1)}$, $b=${v.fix(b, 2)}$: filled = estimator on new data, ring = transformed old estimate`);
          // risk
          const Rk = risk();
          viewPad(s3, [-4, 4], [0, 0.4], { left: 40 });
          s3.fn(() => 1 / n, { color: 'accent', width: 1.6, dash: [6, 4] });
          s3.fn((m) => (k * m / (n + k)) ** 2 + n / (n + k) ** 2, { color: 'red', width: 1.6, dash: [6, 4] });
          EST.forEach((E, q) => s3.dots(Rk[q], { r: 4, color: E.col }));
          axisLabels(s3, '\\mu', null);
          v.legend([...EST.map((E) => [E.col, E.name, { dot: true }]), ['ink', 'exact MSE (mean, shrinkage)', { dash: true }]]);
          info = { e0, e1, et, a, b, Rk };
        });
        v.readout(() => {
          if (!info) return '';
          const { e1, et, Rk, a, b } = info;
          const parts = EST.map((E, q) => `${E.short || E.name}: gap ${v.fix(Math.abs(e1[q] - et[q]), 3)}`).join(' · ');
          const spread = (q) => { const ys = Rk[q].map(([, r]) => r); return `${v.fix(Math.min(...ys), 3)}–${v.fix(Math.max(...ys), 3)}`; };
          return String.raw`$|\delta(a+bx)-(a+b\,\delta(x))|$ — ${parts} · the shrinkage estimate in the new units is ${v.fix(e1[3], 2)}, but converting its old answer gives ${v.fix(et[3], 2)} · simulated MSE over $\mu\in[-4,4]$: mean ${spread(0)} (exact $1/8$), median ${spread(1)}, midrange ${spread(2)}, shrinkage ${spread(3)} — constant risk only for the equivariant ones`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.16
    {
      num: '2.16',
      kind: 'Theorem',
      name: 'Birnbaum’s theorem',
      credit: 'Birnbaum, 1962',
      statement: String.raw`The sufficiency principle (S) and the weak conditionality principle (C) together imply the likelihood principle (L); conversely L implies both. Here

- (S): if $T$ is sufficient in an experiment $E$ and $T(x)=T(x')$, then $\mathrm{Ev}(E,x)=\mathrm{Ev}(E,x')$;
- (C): for the mixture $E^*$ in which a fair coin $J$ decides whether $E_1$ or $E_2$ is performed, $\mathrm{Ev}\big(E^*,(j,x_j)\big)=\mathrm{Ev}(E_j,x_j)$;
- (L): if $x_1$ in $E_1$ and $x_2$ in $E_2$ have proportional likelihoods, $\mathrm{Ev}(E_1,x_1)=\mathrm{Ev}(E_2,x_2)$.

So anyone who accepts sufficiency and conditionality, as most frequentists do, is committed to the likelihood principle, which ordinary significance tests violate (2.14).`,
      scope: String.raw`The derivation is valid as a statement about an evidence function defined on all experiments at once; critics (Durbin 1970, Evans 2013, Mayo 2014) argue that sufficiency should only be applied within the experiment actually performed, which blocks the argument. The theorem is about principles of inference, not about any particular procedure.`,
      idea: String.raw`Take $x_1$, $x_2$ with $L_1(\theta;x_1)=c\,L_2(\theta;x_2)$ and build the mixture $E^*$. In $E^*$ the outcomes $(1,x_1)$ and $(2,x_2)$ have likelihoods $\tfrac12L_1$ and $\tfrac12L_2$, proportional again, so the statistic $T$ that merges these two points and leaves every other point alone is sufficient: given the merged value, $J=1$ with probability $c/(1+c)$ whatever $\theta$ is (2.2, 2.3). By S, $\mathrm{Ev}(E^*,(1,x_1))=\mathrm{Ev}(E^*,(2,x_2))$; by C each side equals the evidence of its component experiment (2.12). Chaining the three equalities gives L (2.13).`,
      caption: String.raw`Step through the proof with the player. The two experiments are the coin plans of 2.13: $n$ tosses planned ($E_1$) and tossing until tail number $r$ ($E_2$); $x_1$ and $x_2$ are both "$n-r$ heads". The mixture $E^*$ flips a fair coin to choose. Right: simulate $E^*$ at many values of $p$ and keep the runs that land on $x_1$ or $x_2$; the share that came from $E_1$ is flat in $p$ (at $c/(1+c)$), which is what makes the merging statistic sufficient. Pair $x_1$ with an outcome whose likelihood is not proportional and the share drifts with $p$: S no longer applies and the chain breaks.`,
      deps: ['stat-2.12', 'stat-2.13', 'stat-2.3'],
      refs: ['Casella–Berger §6.3'],
      tags: ['likelihood principle', 'foundations', 'sufficiency'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Likelihood_principle#The_likelihood_principle_and_Birnbaum%E2%80%99s_theorem' },
      viz(v) {
        const nS = v.slider('$E_1$: tosses planned $n$', 6, 14, 12, { int: true });
        const rS = v.slider('$E_2$: toss until tail number $r$', 1, 5, 3, { int: true });
        const pairS = v.select('pair', [{ value: 'prop', label: 'proportional likelihoods' }, { value: 'not', label: 'not proportional ($x_2$ one head more)' }], 'prop', { onChange: () => S.set(S.i) });
        const frames = [
          { line: 1, note: String.raw`Two experiments and two outcomes with proportional likelihoods: $L_1(p;x_1)=c\,L_2(p;x_2)$.` },
          { line: 2, note: String.raw`The mixture $E^*$: a fair coin $J$ picks which experiment is run; its outcomes are pairs $(j,x)$.` },
          { line: 3, note: () => (pairS.value === 'prop' ? String.raw`(S) In $E^*$ the statistic $T$ that merges $(1,x_1)$ with $(2,x_2)$ is sufficient: given $T$, $P(J=1)=c/(1+c)$ for every $p$ (right).` : String.raw`(S) fails: these two outcomes have likelihoods of different shapes, so given the merged value $P(J=1)$ moves with $p$ (right).`) },
          { line: 4, note: String.raw`(C) Within $E^*$, the outcome $(j,x_j)$ carries the evidence of $x_j$ in $E_j$ alone.` },
          { line: 5, note: () => (pairS.value === 'prop' ? String.raw`Chain: $\mathrm{Ev}(E_1,x_1)\overset{C}{=}\mathrm{Ev}(E^*,(1,x_1))\overset{S}{=}\mathrm{Ev}(E^*,(2,x_2))\overset{C}{=}\mathrm{Ev}(E_2,x_2)$.` : String.raw`Without the middle (S) link the two (C) links connect nothing: no conclusion about these outcomes.`) },
        ];
        const S = v.steps({ frames, start: 0, still: 4, codePos: 'below', code: ['$x_1\\in E_1$, $x_2\\in E_2$ with $L_1\\propto L_2$', 'mixture $E^*$: fair coin $J$, then run $E_J$', '(S) merge $(1,x_1)$ and $(2,x_2)$ in $E^*$', '(C) $\\mathrm{Ev}(E^*,(j,x_j))=\\mathrm{Ev}(E_j,x_j)$', 'therefore $\\mathrm{Ev}(E_1,x_1)=\\mathrm{Ev}(E_2,x_2)$'] });
        const sL = v.stage({ x: [0, 10], y: [-1.2, 11], height: 360, axes: false, weight: 1.15 });
        const sR = v.stage({ x: [0, 1], y: [0, 1], height: 360, axes: 'box', weight: 1, title: 'runs of $E^*$ landing on $x_1$ or $x_2$: share from $E_1$' });
        const lg = legender(v);
        const mc = new Map();
        const simAt = (n, r, h1, h2, p) => {
          const key = [n, r, h1, h2, p].join('|'); if (mc.has(key)) return mc.get(key);
          const rr = v.rng(hashStr('birn|' + key)); let a = 0, b = 0;
          for (let i = 0; i < 40000; i++) {
            if (rr() < 0.5) { let h = 0; for (let k = 0; k < n; k++) if (rr() < p) h++; if (h === h1) a++; }
            else { let h = 0, t = 0; while (t < r) { if (rr() < p) h++; else t++; if (h > 60) break; } if (h === h2) b++; }
          }
          const o = { a, b }; if (mc.size > 300) mc.clear(); mc.set(key, o); return o;
        };
        let info = null;
        v.render(() => {
          const n = nS.value, r = Math.min(rS.value, n - 1), h1 = n - r, h2 = pairS.value === 'prop' ? h1 : h1 + 1, step = S.i;
          const c = Math.exp(lchoose(n, h1) - lchoose(h2 + r - 1, r - 1)), prop = h2 === h1;
          // ── left: the diagram
          const maxH = Math.max(n, h2 + 3), Y = (h) => 0.4 + (9.2 * h) / maxH;
          const col1 = 2.7, col2 = 7.3;
          if (step >= 1) { sL.rect(0.15, -0.9, 9.85, 10.6, { color: 'purple', width: 2, dash: [7, 5], radius: 12, fill: 'purple', fillAlpha: 0.04 }); sL.text('mixture E*: fair coin J picks E₁ or E₂', 5, 10.25, { align: 'center', color: 'purple', size: 12.5, weight: 700 }); }
          sL.text(`E₁: ${n} tosses planned`, col1, -0.45, { align: 'center', color: 'accent', size: 12, weight: 700 });
          sL.text(`E₂: until tail number ${r}`, col2, -0.45, { align: 'center', color: 'orange', size: 12, weight: 700 });
          sL.line(col1, Y(0), col1, Y(n), { color: 'accent', width: 1.2, alpha: 0.5 }); sL.line(col2, Y(0), col2, Y(maxH), { color: 'orange', width: 1.2, alpha: 0.5 });
          for (let h = 0; h <= n; h++) sL.dot(col1, Y(h), { r: h === h1 ? 7 : 3, color: 'accent' });
          for (let h = 0; h <= maxH; h++) sL.dot(col2, Y(h), { r: h === h2 ? 7 : 3, color: 'orange', alpha: h > maxH - 1 ? 0.5 : 1 });
          sL.text(`x₁: ${h1} heads`, col1, Y(h1), { dx: -12, align: 'right', color: 'accent', size: 12, weight: 700 });
          sL.text(`x₂: ${h2} heads`, col2, Y(h2), { dx: 12, align: 'left', color: 'orange', size: 12, weight: 700 });
          sL.text('h = 0', col1, Y(0), { dx: 9, align: 'left', size: 10.5, color: 'muted' }); sL.text('h = 0', col2, Y(0), { dx: -9, align: 'right', size: 10.5, color: 'muted' });
          if (step >= 2) {
            const yA = Y(h1), yB = Y(h2), ym = Math.max(yA, yB) + 1.1;
            sL.path([[col1 + 0.25, yA], [col1 + 0.9, ym], [col2 - 0.9, ym], [col2 - 0.25, yB]], { color: prop ? 'green' : 'red', width: 2.6 });
            sL.text(prop ? `T merges them: P(J = 1 | T) = ${v.fix(c / (1 + c), 3)} for every p` : 'likelihoods not proportional: merging is not sufficient', 5, ym + 0.42, { align: 'center', color: prop ? 'green' : 'red', size: 11.5, weight: 700 });
          }
          if (step >= 3) {
            sL.text('C: Ev(E*, (1, x₁)) = Ev(E₁, x₁)', col1 + 0.25, Y(h1) - 0.85, { align: 'left', color: 'purple', size: 11, weight: 600 });
            sL.text('C: Ev(E*, (2, x₂)) = Ev(E₂, x₂)', col2 - 0.25, Y(h1) - 1.6, { align: 'right', color: 'purple', size: 11, weight: 600 });
          }
          if (step >= 4) { sL.rect(1.0, 2.5, 9.0, 4.1, { fill: 'panel', fillAlpha: 0.96, color: prop ? 'green' : 'red', width: 2, radius: 8 }); sL.tex(prop ? '\\mathrm{Ev}(E_1,x_1)=\\mathrm{Ev}(E_2,x_2)' : '\\text{chain broken: S does not apply}', 5, 3.3, { color: prop ? 'green' : 'red', size: prop ? 18 : 15 }); }
          // ── right: the simulation of E*
          const pc = h1 / n, pa = Math.max(0.08, pc - 0.3), pb = Math.min(0.95, pc + 0.18), PS = Array.from({ length: 7 }, (_, i) => +(pa + ((pb - pa) * i) / 6).toFixed(3));
          const pts = PS.map((p) => { const o = simAt(n, r, h1, h2, p), N = o.a + o.b, f = N ? o.a / N : NaN; return [p, f, N ? 2 * Math.sqrt(f * (1 - f) / N) : 0, N]; });
          const exact = (p) => { const a = binPmf(n, h1, p), b = nbPmf(r, h2, p); return a / (a + b); };
          viewPad(sR, [pa - 0.03, pb + 0.03], [0, 1.02], { left: 40 });
          sR.fn(exact, { domain: [pa - 0.03, pb + 0.03], color: prop ? 'green' : 'red', width: 2.4 });
          for (const [p, f, e] of pts) if (isFinite(f)) { sR.line(p, f - e, p, f + e, { color: 'gold', width: 2 }); sR.dot(p, f, { r: 5, color: 'gold' }); }
          axisLabels(sR, 'p', null);
          sR.corner(prop ? `flat at c/(1+c) = ${v.fix(c / (1 + c), 3)}: T is sufficient` : 'drifts with p: T is not sufficient', 'tr', { color: prop ? 'green' : 'red', weight: 700 });
          lg([['accent', '$E_1$ (binomial) outcomes', { dot: true }], ['orange', '$E_2$ (negative binomial) outcomes', { dot: true }], ['gold', 'simulated share ±2 SE', { dot: true }], [prop ? 'green' : 'red', 'exact $P(J=1\\mid T)$']]);
          info = { n, r, h1, h2, c, prop, pts };
        });
        v.readout(() => {
          if (!info) return '';
          const { n, r, h1, h2, c, prop, pts } = info, fs = pts.map((q) => q[1]).filter(isFinite);
          return String.raw`$x_1$ = ${h1} heads in ${n} tosses, $x_2$ = ${h2} heads before tail ${r}: ` + (prop ? String.raw`$L_1/L_2=\binom{${n}}{${h1}}\big/\binom{${h2 + r - 1}}{${r - 1}}=${v.fix(c, 3)}$ for every $p$ · ` : 'likelihood ratio changes with $p$ · ') + `simulated share from $E_1$ ranges over ${v.fix(Math.min(...fs), 3)}–${v.fix(Math.max(...fs), 3)} for $p$ from ${v.fix(pts[0][0], 2)} to ${v.fix(pts[pts.length - 1][0], 2)} — ` + (prop ? '**constant**: sufficiency merges the two outcomes, conditionality splits them back into their own experiments, and the evidence must agree' : '**not constant**: merging these outcomes loses information about $p$, so neither S nor L says anything about them');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.17
    {
      num: '2.17',
      kind: 'Paper',
      name: 'On the mathematical foundations of theoretical statistics',
      paper: { authors: 'R. A. Fisher', year: 1922, title: 'On the Mathematical Foundations of Theoretical Statistics', venue: 'Philosophical Transactions of the Royal Society of London A 222: 309–368', doi: '10.1098/rsta.1922.0009' },
      introduces: ['stat-2.2', 'stat-3.5', 'stat-5.3'],
      credit: 'Fisher, 1922',
      statement: String.raw`Fisher set out statistics as the reduction of data: a sample is replaced by a few numbers that should contain "as much as possible, ideally the whole, of the relevant information". He split the subject into problems of specification (choosing the parametric family), estimation and distribution, gave the words *parameter* and *statistic* their modern meaning, and proposed criteria for estimates: **consistency**, **efficiency** (smallest variance in large samples) and **sufficiency** (the statistic leaves nothing of relevance in the rest of the sample). He advocated **maximum likelihood** as the general method of estimation, argued that its estimates are efficient and are functions of a sufficient statistic whenever one exists, and showed that Pearson's method of moments, then standard, can be badly inefficient for the skew Pearson curves.

His motivating example (from his 1920 paper on Eddington's claim): for normal data, the spread can be estimated from the mean absolute deviation ($\sigma_1$) or from the root-mean-square deviation ($\sigma_2$); in large samples $\sigma_1$ has efficiency $1/(\pi-2)\approx0.876$, and once $\sigma_2$ is known the distribution of $\sigma_1$ no longer depends on $\sigma$. Scope: the efficiency of maximum likelihood was argued heuristically; regularity conditions and proofs came later (Cramér, Wald, Le Cam).`,
      idea: String.raw`Before 1922 estimation was a collection of recipes: Pearson's method of moments for frequency curves (stat-3.4), inverse probability with uniform priors, least squares; "likelihood" had been named only the year before. Fisher replaced the recipes by criteria: a statistic is judged by its sampling distribution (stat-1.2), and a good one should be consistent, efficient and, best of all, sufficient. The σ example made sufficiency concrete: given $\sigma_2$, the conditional law of $\sigma_1$ is free of $\sigma$, so $\sigma_1$ adds nothing. Maximum likelihood (stat-3.5) delivered efficient estimates in general, and the paper's comparison of moments and likelihood on the Pearson curves showed what was at stake. The paper introduced sufficiency (2.2), maximum likelihood as a method (stat-3.5) and efficiency (stat-5.3), and it set the agenda of mathematical statistics for the rest of the century.`,
      caption: String.raw`The paper has no data set; its arguments are recreated by simulation. **Efficiency**: many normal samples of size $n$, the two unbiased estimates of $\sigma$ from the mean absolute deviation (orange) and the root-mean-square deviation (blue); the readout compares their variance ratio with Fisher's $1/(\pi-2)$. **Sufficiency**: samples under $\sigma=1$ and a second $\sigma$; within a thin slice of $\sigma_2$ (gold band) the histograms of $\sigma_1$ coincide, but within a slice of $\sigma_1$ (toggle) those of $\sigma_2$ do not. **Moments vs ML**: gamma (Pearson Type III) samples; drag the shape to make the curve skewed and watch the moment estimate lose to maximum likelihood (raise the sample size to approach the large-sample curve).`,
      deps: ['stat-3.4', 'stat-1.2'],
      refs: [],
      tags: ['history', 'sufficiency', 'Fisher'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ronald_Fisher' },
      viz(v) {
        const M = v.M;
        const modeS = v.select('show', [{ value: 'eff', label: 'efficiency of $\\sigma_1$' }, { value: 'suff', label: 'sufficiency of $\\sigma_2$' }, { value: 'mom', label: 'moments vs maximum likelihood' }], 'eff');
        const nS = v.slider('sample size $n$', 3, 60, 10, { int: true });
        const s2S = v.slider('second $\\sigma$', 1.1, 2, 1.4, { step: 0.05 });
        const flipT = v.toggle('condition on $\\sigma_1$ instead', false);
        const aS = v.slider('gamma shape $\\alpha$', 0.3, 12, 1, { step: 0.05, log: true });
        const ngS = v.slider('gamma sample size', 20, 400, 50, { int: true, log: true });
        const sL = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', weight: 1 });
        const sR = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', weight: 1 });
        const tL = titler(sL), tR = titler(sR), lg = legender(v);
        const c4 = (n) => Math.exp(0.5 * Math.log(2 / (n - 1)) + M.lgamma(n / 2) - M.lgamma((n - 1) / 2));
        const sig12 = (xs) => { const n = xs.length, m = mean(xs); let a = 0, q = 0; for (const x of xs) { a += Math.abs(x - m); q += (x - m) ** 2; } return [(a / n) * Math.sqrt((Math.PI * n) / (2 * (n - 1))), Math.sqrt(q / (n - 1)) / c4(n)]; };
        const gammaML = (xs) => { const n = xs.length, m = mean(xs), lm = xs.reduce((s, x) => s + Math.log(x), 0) / n, s = Math.log(m) - lm; let a = (3 - s + Math.sqrt((s - 3) ** 2 + 24 * s)) / (12 * s); for (let i = 0; i < 8; i++) { const f = Math.log(a) - digamma(a) - s, d = 1 / a - trigamma(a); a = Math.max(1e-6, a - f / d); } return a; };
        const gammaMM = (xs) => { const n = xs.length, m = mean(xs); let v2 = 0; for (const x of xs) v2 += (x - m) ** 2; return (m * m) / (v2 / n); };
        const R = repeater(v, {
          key: () => [modeS.value, nS.value, modeS.value === 'suff' ? s2S.value : '', modeS.value === 'mom' ? aS.value + '|' + ngS.value : ''].join('|'),
          sample: (r) => {
            const mode = modeS.value;
            if (mode === 'mom') { const G = M.dist.gamma(aS.value, 1), xs = []; for (let i = 0; i < ngS.value; i++) xs.push(G.sample(r)); return [gammaMM(xs), gammaML(xs)]; }
            const n = nS.value, sg = mode === 'suff' && r() < 0.5 ? s2S.value : 1, xs = []; for (let i = 0; i < n; i++) xs.push(sg * r.normal());
            return [...sig12(xs), sg === 1 ? 0 : 1];
          },
          init: () => (modeS.value === 'suff' ? 40000 : modeS.value === 'mom' ? 2000 : 6000), buttons: [100, 10000],
        });
        let info = null;
        v.render(() => {
          const S = R.sync(), mode = modeS.value, V = S.vals, N = V.length;
          sR.setScale({ xlog: mode === 'mom' });
          nS.el.hidden = mode === 'mom'; s2S.el.hidden = mode !== 'suff'; flipT.el.hidden = mode !== 'suff'; aS.el.hidden = mode !== 'mom'; ngS.el.hidden = mode !== 'mom';
          if (mode === 'eff') {
            const n = nS.value, a = moments(V, (p) => p[0]), b = moments(V, (p) => p[1]);
            const lo = Math.max(0, 1 - 4.2 * Math.sqrt(1 / (2 * n))), hi = 1 + 4.2 * Math.sqrt(1 / (2 * n)) + 0.1;
            const Ba = binned(V, lo, hi, 50, (p) => p[0]), Bb = binned(V, lo, hi, 50, (p) => p[1]);
            viewPad(sL, [lo, hi], [0, Math.max(Ba.max, Bb.max) * 1.15], { left: 36 });
            sL.hist(Ba, { density: true, color: 'orange', fillAlpha: 0.22, width: 2 });
            sL.hist(Bb, { density: true, color: 'accent', fillAlpha: 0, width: 2.2 });
            sL.vline(1, { color: 'green', width: 1.6, dash: [5, 4] });
            tL(`estimates of $\\sigma=1$ from ${commas(N)} samples of size ${n}`);
            axisLabels(sL, '\\hat\\sigma', null);
            // right: exact finite-n efficiency (variance of the mean deviation from Godwin, 1945), its limit, and the simulated value
            const eff = b.var / a.var, se = eff * Math.sqrt(2 / N);
            const effN = (m) => { const vd = (2 * (m - 1) / (Math.PI * m * m)) * (Math.PI / 2 + Math.sqrt(m * m - 2 * m) - m + Math.asin(1 / (m - 1))), ed2 = (2 * (m - 1)) / (Math.PI * m); return (1 / (c4(m) ** 2) - 1) / (vd / ed2); };
            viewPad(sR, [0, 62], [0.8, 1.02], { left: 40 });
            sR.hline(1 / (Math.PI - 2), { color: 'green', width: 2, dash: [6, 4] });
            sR.text('Fisher’s limit: 1/(π − 2) = 0.876', 61, 1 / (Math.PI - 2), { align: 'right', dy: 12, color: 'green', size: 12, weight: 700 });
            const ex = []; for (let m = 3; m <= 60; m++) ex.push([m, effN(m)]);
            sR.path(ex, { color: 'ink', width: 2 }); sR.dots(ex.filter(([m]) => m <= 12 || m % 6 === 0), { r: 2.4, color: 'ink' });
            sR.line(n, eff - 2 * se, n, eff + 2 * se, { color: 'ink', width: 1.6 });
            sR.dot(n, eff, { r: 6, color: 'orange' });
            sR.text(`n = ${n}: ${eff.toFixed(3)}`, n, eff, { dx: 10, dy: 12, color: 'orange', size: 12, weight: 700, align: 'left' });
            tR('efficiency of $\\sigma_1$: $\\operatorname{Var}\\sigma_2/\\operatorname{Var}\\sigma_1$');
            axisLabels(sR, 'n', null);
            lg([['orange', '$\\sigma_1$ from the mean absolute deviation', { area: true }], ['accent', '$\\sigma_2$ from the root-mean-square deviation'], ['ink', 'exact efficiency at each $n$'], ['green', 'true $\\sigma$ · Fisher’s large-sample value', { dash: true }]]);
            info = { mode, eff, se, a, b, n, N, effX: effN(n) };
          } else if (mode === 'suff') {
            const s2 = s2S.value, flip = flipT.value, ci = flip ? 0 : 1, oi = flip ? 1 : 0, c0 = Math.sqrt(s2), w = 0.04 * c0;
            // left: scatter of (σ2, σ1) for both σ
            const lim = [0, s2 * 2.3];
            viewPad(sL, lim, lim, { left: 36 });
            const pa = [], pb = []; for (let i = Math.max(0, N - 5000); i < N; i++) (V[i][2] ? pb : pa).push([V[i][1], V[i][0]]);
            sL.dots(pa, { r: 1.4, color: 'accent', alpha: 0.35 }); sL.dots(pb, { r: 1.4, color: 'orange', alpha: 0.35 });
            if (!flip) sL.vband(c0 - w, c0 + w, { color: 'gold', alpha: 0.28, edges: true }); else sL.hband(c0 - w, c0 + w, { color: 'gold', alpha: 0.28, edges: true });
            tL(`${commas(N)} samples of size ${nS.value}: $(\\sigma_2,\\sigma_1)$ under $\\sigma=1$ and $\\sigma=${v.fix(s2, 2)}$`);
            axisLabels(sL, '\\sigma_2', '\\sigma_1');
            // right: conditional histograms of the other estimate within the slice
            const A = [], B = []; for (const p of V) if (Math.abs(p[ci] - c0) < w) (p[2] ? B : A).push(p[oi]);
            const sa = sortNum(A), sb = sortNum(B), lo = Math.min(qSorted(sa, 0.005), qSorted(sb, 0.005)), hi = Math.max(qSorted(sa, 0.995), qSorted(sb, 0.995));
            const Ba = binned(A, lo, hi, 26), Bb = binned(B, lo, hi, 26);
            viewPad(sR, [lo, hi], [0, Math.max(Ba.max, Bb.max) * 1.18], { left: 36 });
            sR.hist(Ba, { density: true, color: 'accent', fillAlpha: 0.2, width: 2.2 });
            sR.hist(Bb, { density: true, color: 'orange', fillAlpha: 0, width: 2.2 });
            tR(flip ? `$\\sigma_2$ given $\\sigma_1\\approx${v.fix(c0, 2)}$: depends on $\\sigma$` : `$\\sigma_1$ given $\\sigma_2\\approx${v.fix(c0, 2)}$: free of $\\sigma$`);
            axisLabels(sR, flip ? '\\sigma_2' : '\\sigma_1', null);
            const ma = moments(A), mb = moments(B);
            lg([['accent', 'samples with $\\sigma=1$', { area: true }], ['orange', `samples with $\\sigma=${v.fix(s2, 2)}$`, { area: true }], ['gold', 'the conditioning slice', { area: true }]]);
            info = { mode, flip, nA: A.length, nB: B.length, ma, mb, c0 };
          } else {
            const a = aS.value, mm = moments(V, (p) => p[0]), ml = moments(V, (p) => p[1]);
            const all = sortNum(V.flatMap((p) => p)), lo = Math.max(0, qSorted(all, 0.005)), hi = qSorted(all, 0.995);
            const Bm = binned(V, lo, hi, 50, (p) => p[0]), Bl = binned(V, lo, hi, 50, (p) => p[1]);
            viewPad(sL, [lo, hi], [0, Math.max(Bm.max, Bl.max) * 1.15], { left: 40 });
            sL.hist(Bm, { density: true, color: 'red', fillAlpha: 0.2, width: 2 });
            sL.hist(Bl, { density: true, color: 'accent', fillAlpha: 0.2, width: 2 });
            sL.vline(a, { color: 'green', width: 1.8, dash: [5, 4] });
            tL(`estimates of the shape $\\alpha=${v.fix(a, 2)}$ from ${commas(N)} samples of size ${ngS.value}`);
            axisLabels(sL, '\\hat\\alpha', null);
            // right: the curve and the efficiency against α (theory) with the simulated point
            const effT = (x) => 1 / (2 * (x + 1) * (x * trigamma(x) - 1)), effS = ml.var / mm.var;
            sR.setView([0.3, 12], [0, 1.05]);
            sR.fn(effT, { domain: [0.3, 12], color: 'green', width: 2.4 });
            sR.dot(a, effS, { r: 6, color: 'red' });
            sR.text(`simulated ${effS.toFixed(2)}`, a, effS, { dx: 10, dy: 12, align: 'left', color: 'red', size: 12, weight: 700 });
            tR('efficiency of the moment estimate of the shape');
            axisLabels(sR, '\\alpha', null);
            lg([['red', 'method of moments $\\bar x^2/s^2$', { area: true }], ['accent', 'maximum likelihood', { area: true }], ['green', 'true $\\alpha$ · large-sample efficiency $1/\\big(2(\\alpha+1)(\\alpha\\psi\'(\\alpha)-1)\\big)$']]);
            info = { mode, a, effS, effT: effT(a), mm, ml, N };
          }
        });
        v.readout(() => {
          if (!info) return '';
          const I = info;
          if (I.mode === 'eff') return String.raw`${commas(I.N)} samples of size ${I.n}: SD of $\sigma_1$ = ${v.fix(I.a.sd, 4)}, of $\sigma_2$ = ${v.fix(I.b.sd, 4)} (both centred on 1: means ${v.fix(I.a.mean, 3)} and ${v.fix(I.b.mean, 3)}) · efficiency $\operatorname{Var}\sigma_2/\operatorname{Var}\sigma_1$ = **${v.fix(I.eff, 3)}** ± ${v.fix(2 * I.se, 3)} (exact at $n=${I.n}$: ${v.fix(I.effX, 3)}) · Fisher (1920, restated 1922): **0.876** in large samples, $1/(\pi-2)$, the value accepted today — so $\sigma_1$ wastes about an eighth of the data`;
          if (I.mode === 'suff') { const d = Math.abs(I.ma.mean - I.mb.mean); return String.raw`within the slice: ${commas(I.nA)} samples from $\sigma=1$ and ${commas(I.nB)} from the second $\sigma$ · mean of the other estimate ${v.fix(I.ma.mean, 3)} vs ${v.fix(I.mb.mean, 3)} (difference ${v.fix(d, 3)}) — ` + (I.flip ? '**the slice of $\\sigma_1$ still tells the two values of $\\sigma$ apart: $\\sigma_1$ is not sufficient**' : '**the same law for both values of $\\sigma$: once $\\sigma_2$ is known, $\\sigma_1$ carries no further information** (Fisher’s criterion of sufficiency)'); }
          return String.raw`${commas(I.N)} gamma samples of size ${ngS.value} with shape ${v.fix(I.a, 2)}: SD of the moment estimate ${v.fix(I.mm.sd, 3)}, of maximum likelihood ${v.fix(I.ml.sd, 3)} · efficiency of moments: simulated **${v.fix(I.effS, 3)}**, large-sample theory ${v.fix(I.effT, 3)} — near 1 only when the curve is close to normal (large $\alpha$), as Fisher found for Pearson's curves`;
        });
      },
    },
  ],
};
