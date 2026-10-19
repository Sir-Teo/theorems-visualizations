// Statistical Inference — Chapter 7 (part b): items 7.8–7.14 — Bonferroni and Holm, the false discovery rate and the
// Benjamini–Hochberg procedure, its behaviour under dependence, permutation tests, and the 1995 paper. Same visual
// language as part a: simulated screens in gold beside exact formulas; nulls blue, real effects purple, false
// discoveries red, true discoveries green, misses orange.
import {
  phi, clamp, commas, pct, hashStr, memo, mean, legender, titler, mulberry, Phi, qnorm, Q, tUp, twoSample, area, tag, mcse, pfmt,
  TC, PC, orderOf, procs, falseFirst, genZ, pZ, runScreens, summary, quant,
} from './ch07.shared.js';

// Primary source review: BH1995 §§2–4, AppendixA and p295 original values;
// Hemerik & Goeman2018 §§2–3 establish permutation validity. Historical Pitman original remains inaccessible.
export const BH1995_P_VALUES = Object.freeze([0.0001, 0.0004, 0.0019, 0.0095, 0.0201, 0.0278, 0.0298, 0.0344, 0.0459, 0.3240, 0.4262, 0.5719, 0.6528, 0.7590, 1.0000]);

export default {
  collection: 'stat',
  chapter: 7,
  items: [
    // ───────────────────────────────────────────────────────────── 7.8
    {
      num: '7.8',
      kind: 'Method',
      name: 'Bonferroni correction',
      credit: 'C. E. Bonferroni, 1936 (inequalities); O. J. Dunn, 1961 (use for multiple comparisons)',
      statement: String.raw`To test $m$ hypotheses $H_{0,1},\dots,H_{0,m}$ with p-values $p_1,\dots,p_m$, the **Bonferroni procedure** at level $\alpha$ rejects $H_{0,i}$ exactly when $p_i\le\alpha/m$. It controls the family-wise error rate (stat-7.7) in the strong sense, for **any** dependence between the p-values: if $m_0$ of the nulls are true,
$$\mathrm{FWER}=P\Big(\bigcup_{i\in\text{true nulls}}\{p_i\le\alpha/m\}\Big)\le\sum_{i\in\text{true nulls}}\frac{\alpha}{m}=\frac{m_0}{m}\,\alpha\le\alpha.$$
For independent uniform null p-values the exact value is $1-(1-\alpha/m)^{m_0}$, just below $\alpha$. When the test statistics are strongly positively correlated the true FWER can be far below $\alpha$, so the procedure is conservative and loses power; for a single real effect it also requires an effect of about $z_{\alpha/(2m)}$ standard errors to be detected.`,
      idea: String.raw`The union bound $P(\bigcup A_i)\le\sum P(A_i)$ needs no assumption on how the events overlap, so neither does the correction: each true null is allowed a false-rejection budget of $\alpha/m$ and the budgets add up to at most $\alpha$. Equality in the union bound requires the events to be disjoint; independent small events are nearly disjoint, so the bound is nearly sharp then, while highly correlated tests reject together, the events overlap almost completely, and the union is about as likely as one event alone, $\alpha/m$.`,
      caption: String.raw`Simulated screens of $m$ two-sided $z$-tests, $m_1$ of them real effects of size $\mu$ (purple), the rest null (blue), with common-factor correlation $\rho$ between the statistics. Left: the FWER of uncorrected tests (red) and of Bonferroni (blue), and the power of Bonferroni (green), against $\rho$, from 1,500 screens at each value of $\rho$; the dashed line is $\alpha$. Right: one screen, $|z|$ sorted, with the uncorrected cutoff 1.96 and the Bonferroni cutoff. Slide $\rho$ to 1: Bonferroni's FWER falls well below 5% (conservative), uncorrected stays high.`,
      deps: ['stat-7.7'],
      refs: ['Wasserman §10.7'],
      tags: ['Bonferroni', 'multiple testing', 'FWER'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bonferroni_correction' },
      scope: String.raw`Valid for any dependence between the p-values, with no assumption beyond each null p-value being super-uniform; the simulation uses two-sided $z$-tests with equicorrelated statistics.`,
      viz(v) {
        const mS = v.slider('number of tests $m$', 2, 200, 20, { int: true, log: true });
        const m1S = v.slider('real effects $m_1$', 0, 20, 3, { int: true });
        const muS = v.slider('effect size $\\mu$', 1.5, 5, 3.5, { step: 0.1 });
        const rhoS = v.slider('correlation $\\rho$ (screen on the right)', 0, 0.99, 0, { step: 0.01 });
        v.button('New screen', () => { seed++; });
        let seed = 1;
        const A = 0.05, RG = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99], REP = 1500;
        const sL = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.05, xlabel: 'correlation $\\rho$ between the test statistics', ylabel: 'probability', title: 'error rates against dependence (1,500 screens per point)' });
        const sR = v.stage({ x: [0, 1], y: [0, 6], axes: 'box', gutter: true, height: 340, weight: 0.95, minWidth: 250, xlabel: 'rank (sorted by $|z|$)', ylabel: '$|z|$', title: 'one screen, sorted' });
        const mc = memo(), ms = memo();
        const sims = (m, m1, mu) => mc([m, m1, mu].join('|'), () => {
          const r = v.rng(hashStr(`t7.8|${m}|${m1}|${mu}`)), zc = qnorm(1 - A / 2), zb = qnorm(1 - A / (2 * m)), z = new Float64Array(m);
          return RG.map((rho) => {
            let fu = 0, fb = 0, pw = 0;
            for (let t = 0; t < REP; t++) {
              genZ(r, z, m1, mu, rho); let vu = false, vb = false, tp = 0;
              for (let i = 0; i < m; i++) { const a = Math.abs(z[i]); if (i >= m1) { if (a > zc) vu = true; if (a > zb) vb = true; } else if (a > zb) tp++; }
              if (vu) fu++; if (vb) fb++; if (m1) pw += tp / m1;
            }
            return { fu: fu / REP, fb: fb / REP, pw: m1 ? pw / REP : NaN };
          });
        });
        const leg = legender(v), ttl = titler(sR);
        let st = null;
        v.render(() => {
          const m = mS.value, m1 = Math.min(m1S.value, m - 1), mu = muS.value, rho = rhoS.value, S = sims(m, m1, mu);
          const m0 = m - m1;
          sL.hline(A, { color: 'green', width: 1.2, dash: [5, 4] }); sL.text('α = 0.05', 0.99, A, { color: 'green', size: 11, align: 'right', dy: -9 });
          sL.path(RG.map((r, i) => [r, S[i].fu]), { color: TC.alpha, width: 2.4 }); sL.dots(RG.map((r, i) => [r, S[i].fu]), { r: 3.5, color: TC.alpha });
          sL.path(RG.map((r, i) => [r, S[i].fb]), { color: TC.h0, width: 2.4 }); sL.dots(RG.map((r, i) => [r, S[i].fb]), { r: 3.5, color: TC.h0 });
          if (m1) { sL.path(RG.map((r, i) => [r, S[i].pw]), { color: TC.power, width: 2.2, dash: [2, 4] }); sL.dots(RG.map((r, i) => [r, S[i].pw]), { r: 3, color: TC.power }); }
          sL.vline(rho, { color: TC.sim, width: 1.4, dash: [3, 3] });
          const exact = 1 - (1 - A / m) ** m0;
          sL.dot(0, S[0].fb, { r: 6, color: TC.h0, hollow: true });
          // right: a screen
          const r = v.rng(hashStr(`t7.8s|${seed}|${m}|${m1}|${mu}|${rho}`)), z = new Float64Array(m); genZ(r, z, m1, mu, rho);
          const idx = Array.from({ length: m }, (_, i) => i).sort((a, b) => Math.abs(z[a]) - Math.abs(z[b])), zc = qnorm(1 - A / 2), zb = qnorm(1 - A / (2 * m));
          const top = Math.max(5.2, zb + 0.9, ...Array.from(z, Math.abs)) * 1.03;
          sR.setView([0, m + 1], [0, top]);
          sR.hline(zc, { color: TC.alpha, width: 1.6, dash: [5, 4] }); sR.hline(zb, { color: TC.h0, width: 1.8, dash: [5, 4] });
          sR.text(`uncorrected ${v.fix(zc, 2)}`, 0.4, zc, { color: TC.alpha, size: 11, align: 'left', dy: -9 }); sR.text(`Bonferroni ${v.fix(zb, 2)}`, 0.4, zb, { color: TC.h0, size: 11, align: 'left', dy: -9 });
          let uV = 0, bV = 0, uT = 0, bT = 0;
          idx.forEach((i, k) => {
            const a = Math.abs(z[i]), real = i < m1; if (a > zc) { if (real) uT++; else uV++; } if (a > zb) { if (real) bT++; else bV++; }
            sR.dot(k + 1, a, { r: a > zb ? 5 : 3.6, color: real ? PC.real : PC.nul, hollow: false });
          });
          ttl(`one screen: $m=${m}$ tests, ${m1} real; correlation $\\rho=${v.fix(rho, 2)}$`);
          leg([[TC.alpha, 'FWER, uncorrected'], [TC.h0, 'FWER, Bonferroni'], [TC.power, 'power, Bonferroni (per real effect)', { dash: true }], [PC.real, 'real effect', { dot: true }]]);
          st = { m, m1, rho, S, exact, uV, bV, uT, bT, m0 };
        });
        v.readout(() => {
          if (!st) return '';
          const { m, m1, rho, S, exact, uV, bV, uT, bT, m0 } = st;
          const i = RG.reduce((b, r, k) => (Math.abs(r - rho) < Math.abs(RG[b] - rho) ? k : b), 0), P = S[i];
          return String.raw`$m=${m}$ ($m_0=${m0}$ true nulls) at $\alpha=0.05$: Bonferroni cutoff $|z|>z_{\alpha/2m}=${v.fix(qnorm(1 - 0.05 / (2 * m)), 2)}$ · independent case ($\rho=0$): simulated FWER ${v.fix(S[0].fb, 3)} $\pm$ ${v.fix(2 * mcse(exact, REP), 3)} vs exact $1-(1-\alpha/m)^{m_0}=${v.fix(exact, 4)}\le\frac{m_0}{m}\alpha=${v.fix((m0 / m) * 0.05, 4)}$ · at $\rho\approx${v.fix(RG[i], 2)}$: uncorrected ${v.fix(P.fu, 3)}, **Bonferroni ${v.fix(P.fb, 3)}**` + (m1 ? String.raw`, Bonferroni power ${v.fix(P.pw, 2)}` : '') + String.raw` · this screen: uncorrected ${uV} false and ${uT} true rejections, Bonferroni ${bV} false and ${bT} true` + (P.fb > 0.05 + 3 * mcse(0.05, REP) ? ' · **above 0.05?!**' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.9
    {
      num: '7.9',
      kind: 'Method',
      name: 'Holm’s step-down procedure',
      credit: 'S. Holm, 1979',
      statement: String.raw`Sort the p-values $p_{(1)}\le\dots\le p_{(m)}$ with hypotheses $H_{(1)},\dots,H_{(m)}$. **Holm's procedure** at level $\alpha$ compares $p_{(1)}$ with $\alpha/m$, $p_{(2)}$ with $\alpha/(m-1)$, and so on, $p_{(i)}$ with $\alpha/(m-i+1)$; let $k$ be the first index at which $p_{(k)}>\alpha/(m-k+1)$, and reject $H_{(1)},\dots,H_{(k-1)}$ (reject all $m$ if no failure occurs). It controls the family-wise error rate (stat-7.7) at level $\alpha$ in the strong sense for any dependence between the p-values, and it is **uniformly more powerful** than the Bonferroni procedure (stat-7.8): every hypothesis Bonferroni rejects, Holm rejects too, since the first threshold is the same and every later one is larger.`,
      idea: String.raw`Bonferroni spends a budget $\alpha/m$ on each true null, but once the smallest p-values have been rejected they cannot be among the true nulls that could cause a false rejection, so the budget can be redistributed over the hypotheses that remain. If $k-1$ hypotheses have been rejected correctly, at most $m-k+1$ nulls are left and $\alpha/(m-k+1)$ per hypothesis still sums to $\alpha$. The proof of strong control looks at the smallest p-value among the $m_0$ true nulls: a false rejection occurs only if that p-value is at most $\alpha/m_0$ (because at least $m-m_0$ rejections precede it in rank), and the union bound over the true nulls gives $\alpha$.`,
      caption: String.raw`A screen of $m=20$ two-sided tests, $m_1$ of them real (purple), sorted by p-value on a log scale. Blue stairs are Holm's thresholds $\alpha/(m-i+1)$; the dashed line is Bonferroni's constant $\alpha/m$. Slide the step to see the procedure move along the sorted p-values and stop at the first failure (open circles are not reached). Right: over 2,000 screens, how many more hypotheses Holm rejects than Bonferroni — never fewer — and both procedures' FWER.`,
      deps: ['stat-7.8'],
      refs: ['Wasserman §10.7'],
      tags: ['Holm', 'step-down', 'FWER'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Holm%E2%80%93Bonferroni_method' },
      viz(v) {
        const m = 20, A = 0.05, REP = 2000;
        const m1S = v.slider('real effects $m_1$', 0, 14, 6, { int: true });
        const muS = v.slider('effect size $\\mu$', 2, 5, 3.5, { step: 0.1 });
        const stS = v.slider('step through the sorted p-values (rank)', 0, m, m, { int: true });
        v.button('New screen', () => { seed++; });
        let seed = 1;
        const sL = v.stage({ x: [0, m + 1], y: [1e-6, 1.5], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: 'rank $i$ of the sorted p-values', ylabel: 'p-value', title: 'sorted p-values against Holm and Bonferroni thresholds' });
        const sR = v.stage({ x: [-0.6, 6.6], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 0.85, minWidth: 250, xlabel: 'hypotheses rejected by Holm minus by Bonferroni', ylabel: 'share of screens', title: 'Holm − Bonferroni over 2,000 screens' });
        const mc = memo();
        const sims = (m1, mu) => mc(m1 + '|' + mu, () => runScreens(v.rng(hashStr(`t7.9|${m1}|${mu}`)), { m, m1, mu, reps: REP, alpha: A, sided: 2 }));
        const leg = legender(v);
        let st = null;
        v.render(() => {
          const m1 = m1S.value, mu = muS.value, j = stS.value, S = sims(m1, mu), r = v.rng(hashStr(`t7.9s|${seed}|${m1}|${mu}`));
          const z = genZ(r, new Float64Array(m), m1, mu, 0), p = Float64Array.from(z, (x) => Math.max(2 * Q(Math.abs(x)), 1e-6)), o = orderOf(p), c = procs(p, A, o);
          // left
          const thr = (i) => A / (m - i + 1);
          sL.hline(A / m, { color: 'muted', width: 1.6, dash: [5, 4] }); sL.text('Bonferroni α/m', m + 0.8, A / m, { color: 'muted', size: 11, align: 'right', dy: -9 });
          for (let i = 1; i <= m; i++) sL.segment([i - 0.4, thr(i)], [i + 0.4, thr(i)], { color: TC.h0, width: 2.6 });
          sL.path(Array.from({ length: m }, (_, i) => [i + 1, thr(i + 1)]), { color: TC.h0, width: 1, alpha: 0.35 });
          o.forEach((ix, k) => {
            const i = k + 1, real = ix < m1, reached = i <= Math.min(j, c.holm + 1), rej = i <= c.holm && i <= j;
            sL.dot(i, p[ix], { r: 5, color: real ? PC.real : PC.nul, hollow: !reached });
            if (i === c.holm + 1 && i <= j) sL.vline(i, { color: TC.alpha, width: 1.3, dash: [3, 4] });
          });
          if (c.holm < m && c.holm + 1 <= j) tag(sL, `stop: p(${c.holm + 1}) = ${pfmt(p[o[c.holm]], 2)} > ${pfmt(thr(c.holm + 1), 2)}`, c.holm + 1.3, Math.max(1.2e-6, thr(c.holm + 1) * 0.12), { color: TC.alpha, align: c.holm > 12 ? 'right' : 'left', dx: c.holm > 12 ? -8 : 8, size: 11 });
          // right: histogram of the difference
          const diff = new Int32Array(REP); let mn = 99, fw = 0, fb = 0; const cnt = new Array(8).fill(0);
          for (let t = 0; t < REP; t++) { diff[t] = S.holm.R[t] - S.bonf.R[t]; mn = Math.min(mn, diff[t]); cnt[Math.min(7, diff[t])]++; if (S.holm.V[t] > 0) fw++; if (S.bonf.V[t] > 0) fb++; }
          cnt.forEach((n, d) => { if (d > 6) return; sR.rect(d - 0.35, 0, d + 0.35, n / REP, { fill: d === 0 ? TC.h0 : PC.td, fillAlpha: 0.55, color: d === 0 ? TC.h0 : PC.td, width: 1 }); if (n) tag(sR, pct(n / REP, 0), d, n / REP, { size: 11, dy: -12 }); });
          sR.setView([-0.6, 6.6], [0, Math.min(1, Math.max(...cnt) / REP * 1.18 + 0.02)]);
          leg([[TC.h0, 'Holm threshold $\\alpha/(m-i+1)$'], ['muted', 'Bonferroni $\\alpha/m$', { dash: true }], [PC.real, 'real effect', { dot: true }], [PC.nul, 'true null', { dot: true }]]);
          st = { m1, c, mn, fw: fw / REP, fb: fb / REP, mean: cnt.reduce((s, n, d) => s + n * d, 0) / REP, V: falseFirst(o, c.holm, m1) };
        });
        v.readout(() => {
          if (!st) return '';
          const { c, mn, fw, fb, mean: me, V } = st;
          return String.raw`this screen: Holm rejects **${c.holm}** (${V} false), Bonferroni rejects ${c.bonf} · over 2,000 screens Holm minus Bonferroni was never negative (minimum ${mn}), on average +${v.fix(me, 2)} · FWER: Holm ${v.fix(fw, 3)}, Bonferroni ${v.fix(fb, 3)} (both $\le0.05$ up to Monte Carlo error $\pm$ ${v.fix(2 * mcse(0.05, REP), 3)})`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.10
    {
      num: '7.10',
      kind: 'Definition',
      name: 'False discovery rate',
      credit: 'Y. Benjamini & Y. Hochberg, 1995',
      statement: String.raw`In a screen of $m$ hypotheses a procedure makes $R$ rejections (discoveries), of which $V$ are false (true nulls) and $R-V$ true. The **false discovery proportion** is $\mathrm{FDP}=V/R$ when $R>0$ and $0$ when $R=0$, a random quantity of the particular screen. The **false discovery rate** is its expectation,
$$\mathrm{FDR}=E\!\left[\frac{V}{\max(R,1)}\right].$$
Where the family-wise error rate (stat-7.7) asks whether *any* rejection is false, $P(V\ge1)$, the FDR asks what *fraction* of the rejections is false on average. Always $\mathrm{FDR}\le\mathrm{FWER}$, because $V/\max(R,1)\le\mathbf 1\{V\ge1\}$; and when all $m$ nulls are true the two are equal, since then $V=R$ and $\mathrm{FDP}=\mathbf 1\{R\ge1\}$.`,
      idea: String.raw`With thousands of tests, a screen with a few hundred real effects should be allowed a few false discoveries if it finds many true ones: guarding against even one false rejection (FWER) makes the procedure shout only at enormous effects. The FDR measures the quantity a scientist following up the list cares about, the share of leads that are dead ends. It adapts to the evidence: with many real effects present, more rejections are tolerated, while if there are none, the FDR criterion reduces to the FWER one.`,
      caption: String.raw`A screen of 1,000 one-sided $z$-tests drawn as a $40\times25$ grid, a fraction $\pi_0$ truly null. Each cell is coloured by truth and decision: red = false discovery, green = true discovery, orange = missed effect, pale = true null not rejected. Choose the procedure; the readout gives this screen's false discovery proportion. Right: over 300 repeated screens, the FWER (red) — the share of screens containing any red cell — and the FDR (gold) — the mean red share of rejections — for three procedures. Uncorrected testing has FWER near 1 and a large FDR; Bonferroni keeps both small but finds little; Benjamini–Hochberg keeps the FDR near $\pi_0\cdot0.05$ and finds far more, while its FWER stays high.`,
      deps: ['stat-7.7'],
      refs: ['Wasserman §10.7'],
      tags: ['false discovery rate', 'multiple testing', 'screening'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/False_discovery_rate' },
      viz(v) {
        const pi0S = v.slider('fraction of true nulls $\\pi_0$', 0.5, 1, 0.9, { step: 0.01 });
        const muS = v.slider('effect size $\\mu$ of the real ones', 1.5, 5, 3, { step: 0.1 });
        const prS = v.select('procedure on the grid', [{ value: 'unc', label: 'uncorrected, $\\alpha=0.05$' }, { value: 'bonf', label: 'Bonferroni' }, { value: 'bh', label: 'Benjamini–Hochberg' }], 'bh');
        v.button('New screen', () => { seed++; });
        let seed = 1;
        const m = 1000, A = 0.05, REP = 300, CW = 40, CH = 25;
        const sL = v.stage({ x: [0, CW], y: [0, CH], axes: false, height: 340, weight: 1.05, equal: true, title: 'one screen of 1,000 tests' });
        const sR = v.stage({ x: [0, 3], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 0.95, minWidth: 260, xticks: [[0.5, 'uncorrected'], [1.5, 'Bonferroni'], [2.5, 'BH']], ylabel: 'rate', title: 'FWER and FDR over 300 screens' });
        const mc = memo();
        const sims = (m1, mu) => mc(m1 + '|' + mu, () => runScreens(v.rng(hashStr(`t7.10|${m1}|${mu}`)), { m, m1, mu, reps: REP, alpha: A, sided: 1 }));
        const leg = legender(v);
        let st = null;
        v.render(() => {
          const pi0 = pi0S.value, mu = muS.value, m1 = Math.round((1 - pi0) * m), pr = prS.value, S = sims(m1, mu);
          const r = v.rng(hashStr(`t7.10s|${seed}|${m1}|${mu}`)), z = genZ(r, new Float64Array(m), m1, mu, 0), p = Float64Array.from(z, (x) => Q(x)), o = orderOf(p), c = procs(p, A, o);
          const rej = new Uint8Array(m); const thr = pr === 'unc' ? A : A / m;
          if (pr === 'bh') for (let k = 0; k < c.bh; k++) rej[o[k]] = 1; else for (let i = 0; i < m; i++) if (p[i] <= thr) rej[i] = 1;
          // shuffle positions so the real effects are scattered
          const jr = mulberry(77), pos = Array.from({ length: m }, (_, i) => i); for (let i = m - 1; i > 0; i--) { const k = Math.floor(jr() * (i + 1)); [pos[i], pos[k]] = [pos[k], pos[i]]; }
          let V = 0, R = 0, T = 0;
          for (let i = 0; i < m; i++) {
            const real = i < m1, rj = rej[i], cell = pos[i], cx = cell % CW, cy = CH - 1 - Math.floor(cell / CW);
            if (rj) { R++; if (real) T++; else V++; }
            const col = rj ? (real ? PC.td : PC.fd) : real ? PC.miss : 'faint', al = rj ? 0.85 : real ? 0.8 : 0.1;
            sL.rect(cx + 0.06, cy + 0.06, cx + 0.94, cy + 0.94, { fill: col, fillAlpha: al, stroke: false });
          }
          // right: bars
          const keys = ['unc', 'bonf', 'bh'], sm = keys.map((k) => summary(S[k]));
          keys.forEach((k, i) => {
            sR.rect(i + 0.12, 0, i + 0.48, sm[i].fwer, { fill: PC.fd, fillAlpha: 0.6, color: PC.fd, width: 1 });
            sR.rect(i + 0.52, 0, i + 0.88, sm[i].fdr, { fill: TC.sim, fillAlpha: 0.6, color: TC.sim, width: 1 });
            tag(sR, v.fix(sm[i].fwer, 2), i + 0.3, sm[i].fwer, { size: 11, dy: -10 }); tag(sR, v.fix(sm[i].fdr, 3), i + 0.7, sm[i].fdr, { size: 11, dy: -10 });
          });
          sR.hline(A, { color: 'green', width: 1.2, dash: [5, 4] });
          leg([[PC.td, 'true discovery', { area: true }], [PC.fd, 'false discovery', { area: true }], [PC.miss, 'missed effect', { area: true }], ['faint', 'true null, kept', { area: true }], [PC.fd, 'FWER = P(any false)', { area: true }], [TC.sim, 'FDR = E[FDP]', { area: true }]]);
          st = { pi0, m1, pr, R, V, T, sm, keys };
        });
        v.readout(() => {
          if (!st) return '';
          const { m1, pr, R, V, T, sm, keys } = st, i = keys.indexOf(pr);
          return String.raw`this screen (${m1} real effects): **${R}** discoveries, ${V} false, ${T} true, ${m1 - T} missed · false discovery proportion $V/R=${R ? v.fix(V / R, 3) : '0 (no rejections)'}$ · over 300 screens, this procedure: FWER ${v.fix(sm[i].fwer, 3)}, FDR ${v.fix(sm[i].fdr, 3)} (FDR $\le$ FWER), on average ${v.fix(sm[i].R, 1)} discoveries`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.11
    {
      num: '7.11',
      kind: 'Theorem',
      name: 'Benjamini–Hochberg procedure controls the FDR',
      credit: 'Y. Benjamini & Y. Hochberg, 1995',
      statement: String.raw`Let $p_{(1)}\le\dots\le p_{(m)}$ be the sorted p-values of $m$ hypotheses, $m_0$ of them true nulls. The **Benjamini–Hochberg** (BH) **step-up procedure** at level $q$ finds
$$k=\max\Big\{i:\ p_{(i)}\le \frac{i}{m}\,q\Big\}$$
and rejects $H_{(1)},\dots,H_{(k)}$ (nothing if the set is empty): sort the p-values, draw the line of slope $q/m$ through the origin, and reject everything up to the last p-value that lies on or below it. **Theorem.** If the p-values of the true nulls are independent of each other and of the p-values of the false nulls, and each is uniform on $(0,1)$ (super-uniform in general), then
$$\mathrm{FDR}=E\!\left[\frac{V}{\max(R,1)}\right]\le\frac{m_0}{m}\,q\le q,$$
with equality when the null p-values are exactly uniform. The bound holds whatever the number $m_0$ of true nulls and whatever the distributions of the other p-values, a guarantee Bonferroni-type procedures do not need but also do not exploit.`,
      idea: String.raw`Each true null $i$ contributes to the FDR through the event "it is rejected, and the number of rejections is $R$". Condition on the p-values of all the other hypotheses. Given them, $H_i$ is rejected exactly when $p_i$ falls below a threshold of the form $jq/m$ that depends only on the others, and for a uniform $p_i$ the contribution to $E[\mathbf 1\{i\text{ rejected}\}/R]$ works out to $q/m$ regardless of what the others do. Summing over the $m_0$ true nulls gives $m_0q/m$. Benjamini and Hochberg's original proof proceeds by induction on $m$; Benjamini and Yekutieli (2001) extended the guarantee to positively dependent statistics (stat-7.12).`,
      caption: String.raw`Left: a screen of $m=100$ one-sided $z$-tests, p-values sorted (real effects purple, nulls blue) against the line $iq/m$ (green). BH rejects every point up to the last one on or under the line, even if some earlier points lie above it. Right: the realized FDR over 500 simulated screens (gold) against the fraction $\pi_0$ of true nulls, with the bound $\pi_0q$ (green) and the level $q$ (dashed). The FDR hugs $\pi_0q$ from below: BH is exact, not just a bound. Try $\pi_0=1$: all nulls true, FDR $=$ FWER $=q$.`,
      deps: ['stat-7.10', 'stat-7.2'],
      refs: ['Wasserman §10.7'],
      tags: ['Benjamini–Hochberg', 'FDR', 'step-up'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/False_discovery_rate#Benjamini%E2%80%93Hochberg_procedure' },
      scope: String.raw`Independent p-values (or positively dependent in the sense of PRDS, see stat-7.12); the simulation uses independent one-sided $z$-tests.`,
      viz(v) {
        const pi0S = v.slider('fraction of true nulls $\\pi_0$', 0.1, 1, 0.8, { step: 0.01 });
        const muS = v.slider('effect size $\\mu$', 1, 5, 3, { step: 0.1 });
        const qS = v.slider('level $q$', 0.01, 0.3, 0.1, { step: 0.01 });
        v.button('New screen', () => { seed++; });
        let seed = 1;
        const m = 100, REP = 500, PG = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
        const sL = v.stage({ x: [0, 40], y: [0, 0.4], axes: 'box', gutter: true, height: 340, weight: 1.05, xlabel: 'rank $i$', ylabel: 'sorted p-value $p_{(i)}$', title: 'BH on one screen' });
        const sR = v.stage({ x: [0, 1.04], y: [0, 0.4], axes: 'box', gutter: true, height: 340, weight: 0.95, minWidth: 250, xlabel: 'fraction of true nulls $\\pi_0$', ylabel: 'FDR', title: 'realized FDR over 500 screens' });
        const mc = memo(), m2 = memo();
        const sims = (mu, q) => mc(mu + '|' + q, () => PG.map((pi0) => summary(runScreens(v.rng(hashStr(`t7.11|${mu}|${q}|${pi0}`)), { m, m1: Math.round((1 - pi0) * m), mu, reps: REP, alpha: q, sided: 1 }).bh)));
        const one = (pi0, mu, q) => m2([pi0, mu, q].join('|'), () => summary(runScreens(v.rng(hashStr(`t7.11b|${pi0}|${mu}|${q}`)), { m, m1: Math.round((1 - pi0) * m), mu, reps: REP, alpha: q, sided: 1 }).bh));
        const leg = legender(v);
        let st = null;
        v.render(() => {
          const pi0 = pi0S.value, mu = muS.value, q = qS.value, m1 = Math.round((1 - pi0) * m);
          const r = v.rng(hashStr(`t7.11s|${seed}|${m1}|${mu}`)), z = genZ(r, new Float64Array(m), m1, mu, 0), p = Float64Array.from(z, (x) => Q(x)), o = orderOf(p), c = procs(p, q, o), k = c.bh;
          const X = Math.max(20, Math.min(m, 2 * k + 16));
          sL.setView([0, X + 1], [0, Math.max(0.12, Math.min(1, 1.35 * q * X / m + 0.02))]);
          sL.fn((x) => (x * q) / m, { domain: [0, X + 1], color: PC.td, width: 2.4 });
          let V = 0;
          o.forEach((ix, j) => { if (j >= X + 1) return; const real = ix < m1, rej = j < k; if (rej && !real) V++; sL.dot(j + 1, p[ix], { r: 4.6, color: real ? PC.real : PC.nul, hollow: !rej }); });
          if (k) { sL.vline(k + 0.5, { color: TC.alpha, width: 1.4, dash: [4, 4] }); tag(sL, `k = ${k}`, k + 0.5, 0, { color: TC.alpha, size: 12, dy: -14, align: k > X - 8 ? 'right' : 'left', dx: k > X - 8 ? -6 : 6, weight: 700 }); }
          // right
          const S = sims(mu, q);
          sR.hline(q, { color: 'muted', width: 1.2, dash: [5, 4] }); sR.text('level $q$', 0.02, q, { color: 'muted', size: 11, align: 'left', dy: -9 });
          sR.line(0, 0, 1, q, { color: PC.td, width: 2.2 });
          sR.path(PG.map((pp, i) => [pp, S[i].fdr]), { color: TC.sim, width: 2.4 }); sR.dots(PG.map((pp, i) => [pp, S[i].fdr]), { r: 4, color: TC.sim });
          const cur = one(pi0, mu, q);
          sR.vline(pi0, { color: TC.h0, width: 1.3, dash: [3, 3] }); sR.dot(pi0, cur.fdr, { r: 6, color: TC.alpha });
          sR.setView([0, 1.04], [0, Math.max(0.12, q * 1.35)]);
          leg([[PC.td, 'line $iq/m$ and bound $\\pi_0q$'], [TC.sim, 'simulated FDR', { dot: true }], [PC.real, 'real effect', { dot: true }], [PC.nul, 'true null', { dot: true }], [TC.alpha, 'current $\\pi_0$', { dot: true }]]);
          st = { pi0, q, k, V, cur, m1 };
        });
        v.readout(() => {
          if (!st) return '';
          const { pi0, q, k, V, cur, m1 } = st, bound = ((100 - m1) / 100) * q;
          return String.raw`this screen: BH rejects $k=${k}$ (${V} false, proportion ${k ? v.fix(V / k, 2) : '0'}) · over 500 screens at $\pi_0=${v.fix(pi0, 2)}$ ($m_0=${100 - m1}$): realized FDR **${v.fix(cur.fdr, 4)}** $\pm$ ${v.fix(2 * mcse(Math.max(cur.fdr, 0.01), 500), 4)} vs $\frac{m_0}{m}q=${v.fix(bound, 4)}$` + (cur.fdr <= bound + 2 * mcse(bound, 500) ? ' ✓' : ' · **above the bound**') + String.raw` · average discoveries ${v.fix(cur.R, 1)} · FWER of the same procedure ${v.fix(cur.fwer, 3)} (not controlled at $q$)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.12
    {
      num: '7.12',
      kind: 'Phenomenon',
      name: 'Dependence and the false discovery proportion',
      statement: String.raw`The Benjamini–Hochberg guarantee (stat-7.11) is on the **expectation** of the false discovery proportion, and it needs some form of independence. It continues to hold when the test statistics are positively dependent in the PRDS sense (positive regression dependency on the subset of true nulls), which includes one-sided tests of equicorrelated normal statistics with nonnegative correlation; Benjamini and Yekutieli (2001) proved this. But even when the FDR is controlled, the FDP of an individual screen is a random variable whose spread grows with the correlation: with a common factor $W$ shifting every statistic, the nulls tend to be rejected together or not at all, so the distribution of the FDP has an atom at 0 and a heavy upper tail, while its mean stays at most $\pi_0q$. The guarantee holds on average over screens, and says little about the screen in hand.`,
      idea: String.raw`With independent p-values the number of false rejections $V$ in a screen is concentrated around its mean, so the FDP is close to $\mathrm{FDR}$ each time. With a common factor the null statistics move together: when $W$ is negative almost no null is rejected (FDP $=0$), and when $W$ is large many are (a disaster), and the two cancel in the mean. The mean is controlled by the same expectation argument in which the dependence is positive; the variance is not controlled by anything.`,
      caption: String.raw`Screens of $m=200$ one-sided $z$-tests with a fraction $\pi_0$ of true nulls and common-factor correlation $\rho$ between all the statistics, BH at level $q$. Left: histogram of the false discovery proportion over 2,000 screens at the chosen $\rho$; the green bar is the share of screens with no false discovery at all. Right: as $\rho$ grows, the mean FDP (gold) stays at or below $\pi_0q$ (green line), while the share of screens with no false discovery at all (green, dotted) climbs and the share whose FDP exceeds $2q=0.2$ (red) is larger at moderate $\rho$ than at $\rho=0$: the same average is made of more clean screens and more bad ones. Compare $\rho=0$ with $\rho=0.8$.`,
      deps: ['stat-7.11'],
      refs: ['Wasserman §10.7'],
      tags: ['dependence', 'false discovery proportion', 'Benjamini–Hochberg'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/False_discovery_rate#Dependency_among_the_test_statistics' },
      credit: 'Y. Benjamini & D. Yekutieli, 2001 (the PRDS result)',
      scope: String.raw`One-sided normal tests with equal positive correlation $\rho$ (a one-factor model); FDR control then holds, the variability of the FDP is what changes. Other dependence structures (negative correlations, two-sided tests) can behave differently and are not shown here.`,
      viz(v) {
        const rhoS = v.slider('correlation $\\rho$ between the statistics', 0, 0.95, 0.5, { step: 0.01 });
        const pi0S = v.slider('fraction of true nulls $\\pi_0$', 0.5, 0.98, 0.9, { step: 0.01 });
        const muS = v.slider('effect size $\\mu$', 1.5, 5, 3, { step: 0.1 });
        const m = 200, Q0 = 0.1, REP = 2000, RG = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95], RR = 500;
        const sL = v.stage({ x: [-0.1, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.05, xticks: [[0, 'FDP = 0'], [0.2, '0.2'], [0.4, '0.4'], [0.6, '0.6'], [0.8, '0.8'], [1, '1']], xlabel: 'false discovery proportion of a screen', ylabel: 'share of screens', title: 'FDP of 2,000 screens at the chosen $\\rho$' });
        const sR = v.stage({ x: [0, 0.97], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 0.95, minWidth: 250, xlabel: 'correlation $\\rho$', ylabel: 'probability / rate', title: 'FDR, bad screens and clean screens against $\\rho$' });
        const mc = memo(), m2 = memo();
        const hist = (rho, m1, mu) => mc([rho, m1, mu].join('|'), () => summary(runScreens(v.rng(hashStr(`t7.12|${rho}|${m1}|${mu}`)), { m, m1, mu, rho, reps: REP, alpha: Q0, sided: 1 }).bh));
        const curves = (m1, mu) => m2(m1 + '|' + mu, () => RG.map((rho) => { const S = summary(runScreens(v.rng(hashStr(`t7.12c|${rho}|${m1}|${mu}`)), { m, m1, mu, rho, reps: RR, alpha: Q0, sided: 1 }).bh); return { fdr: S.fdr, big: S.fdp.filter((f) => f > 2 * Q0).length / RR, pz: S.pzero }; }));
        const leg = legender(v);
        let st = null;
        v.render(() => {
          const rho = rhoS.value, pi0 = pi0S.value, mu = muS.value, m1 = Math.round((1 - pi0) * m), S = hist(rho, m1, mu);
          const NB = 20, cnt = new Array(NB).fill(0); let zero = 0;
          for (const f of S.fdp) { if (f === 0) zero++; else cnt[Math.min(NB - 1, Math.floor(f * NB))]++; }
          const top = Math.max(zero, ...cnt) / REP * 1.15;
          sL.setView([-0.1, 1], [0, top]);
          sL.rect(-0.045, 0, 0.005, zero / REP, { fill: PC.td, fillAlpha: 0.6, color: PC.td, width: 1 });
          cnt.forEach((n, b) => sL.rect(b / NB + 0.004, 0, (b + 1) / NB - 0.004, n / REP, { fill: PC.fd, fillAlpha: 0.5, color: PC.fd, width: 1 }));
          sL.vline(S.fdr, { color: TC.sim, width: 2.2 }); sL.text(`mean = FDR ${v.fix(S.fdr, 3)}`, S.fdr, top * 0.97, { color: TC.sim, size: 11.5, align: S.fdr > 0.6 ? 'right' : 'left', dx: S.fdr > 0.6 ? -6 : 6, plate: true, weight: 700 });
          sL.vline(pi0 * Q0, { color: 'green', width: 1.4, dash: [5, 4] });
          // right
          const C = curves(m1, mu);
          sR.hline(pi0 * Q0, { color: 'green', width: 1.4, dash: [5, 4] }); sR.text('$\\pi_0 q$', 0.01, pi0 * Q0, { color: 'green', size: 12, align: 'left', dy: -10 });
          sR.path(RG.map((r, i) => [r, C[i].big]), { color: PC.fd, width: 2.4 }); sR.dots(RG.map((r, i) => [r, C[i].big]), { r: 3.5, color: PC.fd });
          sR.path(RG.map((r, i) => [r, C[i].fdr]), { color: TC.sim, width: 2.4 }); sR.dots(RG.map((r, i) => [r, C[i].fdr]), { r: 3.5, color: TC.sim });
          sR.path(RG.map((r, i) => [r, C[i].pz]), { color: PC.td, width: 2.2, dash: [2, 4] });
          sR.vline(rho, { color: TC.h0, width: 1.3, dash: [3, 3] });
          leg([[PC.fd, 'FDP of a screen', { area: true }], [PC.td, 'FDP = 0', { area: true }], [TC.sim, 'mean FDP = FDR'], [PC.fd, 'share of screens with FDP $>2q$'], [PC.td, 'share with no false discovery', { dash: true }]]);
          st = { rho, pi0, S, bound: pi0 * Q0, p90: quant(S.fdp, 0.9), se: Math.sqrt(S.fdp.reduce((a, f) => a + (f - S.fdr) ** 2, 0) / (REP - 1) / REP), big: S.fdp.filter((f) => f > 2 * Q0).length / REP };
        });
        v.readout(() => {
          if (!st) return '';
          const { rho, pi0, S, bound, p90, big, se } = st;
          return String.raw`$\rho=${v.fix(rho, 2)}$, BH at $q=0.1$, $\pi_0=${v.fix(pi0, 2)}$: **FDR ${v.fix(S.fdr, 3)}** (bound $\pi_0q=${v.fix(bound, 3)}$; Monte Carlo error $\pm$ ${v.fix(2 * se, 3)}) · no false discovery at all in ${pct(S.pzero, 0)} of screens · FDP above $2q=0.2$ in ${pct(big, 1)} of screens · 90th percentile of the FDP ${v.fix(p90, 2)}` + (rho > 0.4 ? ' · controlled on average, but screen to screen the FDP is spread between zero and large values' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.13
    {
      num: '7.13',
      kind: 'Method',
      name: 'Permutation test',
      statement: String.raw`Two groups of sizes $n_1$ and $n_2$ are compared by a statistic $T$ such as the difference of means, and the null hypothesis says the group labels carry no information: under $H_0$ the $N=n_1+n_2$ observations are exchangeable between the groups. The **permutation test** computes $T$ for every one of the $\binom{N}{n_1}$ ways of reassigning the labels and reports
$$p=\frac{\#\{\text{relabellings with }|T^*|\ge|T_{\rm obs}|\}}{\binom{N}{n_1}}.$$
Because the observed labelling is one of the equally likely relabellings under $H_0$, this p-value satisfies $P_{H_0}(p\le\alpha)\le\alpha$ **exactly**, for every sample size, with no assumption about the shape of the data distribution, only exchangeability. When the full enumeration is too large, $B$ independent uniform relabellings sampled with replacement from all assignments give the Monte Carlo p-value $(1+\#\{|T^*|\ge|T_{\rm obs}|\})/(B+1)$, which is also finite-sample valid: its null rejection probability is at most the chosen level, with possible conservatism from discreteness or ties.`,
      idea: String.raw`The null model is the experiment itself: if the treatment did nothing, each unit would have produced the same value under either label, so the label assignment is the only randomness (stat-7.1 supplies the tail-area definition of the p-value). The reference distribution is built from the data rather than taken from a table, so heavy tails, skewness and outliers cannot invalidate it, although they may cost power. Exchangeability is stronger than equality of means: groups with the same mean and different distributions do not satisfy this null. Hemerik and Goeman (2018, §§2–3) prove the complete-enumeration and properly sampled random-permutation guarantees.`,
      caption: String.raw`Two groups of 8 (top two rows: A in blue, B in orange); drag the orange handle to slide group B and change the observed difference. Each shuffle reassigns the 16 values at random (the lower two rows show the latest one) and adds its difference of means to the gold histogram; the blue outline is the exact distribution over all 12,870 relabellings. The red tails beyond $\pm|D_{\rm obs}|$ give the p-value. Pick **skewed** or **outlier** data: the permutation p-value stays exact while Welch’s approximate $t$ reference p-value can differ; a difference for one dataset does not by itself measure either test’s long-run error rate.`,
      deps: ['stat-7.1'],
      refs: ['Wasserman §10.5'],
      tags: ['permutation test', 'exact test', 'nonparametric'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Permutation_test' },
      credit: 'R. A. Fisher, 1930s; E. J. G. Pitman, 1937',
      // Mathematical guarantees checked in complete Hemerik & Goeman2018§§2–3.
      // Historical Pitman1937 original remains inaccessible: JSTOR2984124 PDF502, OUP PDF403.
      verify: true,
      viz(v) {
        const popS = v.select('data', [{ value: 'norm', label: 'normal' }, { value: 'skew', label: 'skewed (lognormal)' }, { value: 'out', label: 'one outlier in A' }], 'skew', { onChange: () => resetPos() });
        v.button('New data', () => { dseed++; masks.length = 0; resetPos(); });
        v.button('Shuffle once', () => addShuffles(1));
        v.button('Shuffle ×100', () => addShuffles(100));
        v.button('Shuffle ×10,000', () => addShuffles(10000));
        v.button('Clear shuffles', () => { masks.length = 0; });
        let dseed = 1;
        const NA = 8, N = 16, masks = [];
        const sL = v.stage({ x: [-3, 6], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'measurement', yticks: [[0.88, 'A'], [0.66, 'B'], [0.34, 'A*'], [0.12, 'B*']], title: 'the data, and the latest shuffled labelling' });
        const sR = v.stage({ x: [-3, 3], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'difference of means $\\bar A-\\bar B$ under relabelling', ylabel: 'density', title: 'permutation distribution' });
        const hB = sL.handle(1, 0.56, { color: TC.beta, label: 'drag B', labelPos: 's', constrain: (x) => [clamp(x, -3, 5.8), 0.6] });
        const mc = memo(), rr = { r: null, k: 0 };
        const base = () => mc(popS.value + '|' + dseed, () => {
          const r = v.rng(hashStr(`t7.13|${popS.value}|${dseed}`)), kind = popS.value, g = () => (kind === 'skew' ? (Math.exp(0.9 * r.normal()) - 1.2) : r.normal());
          const a = Array.from({ length: NA }, g), b = Array.from({ length: NA }, g);
          if (kind === 'out') a[0] = 5.2;
          const mb = b.reduce((s, x) => s + x, 0) / NA;
          return { a, b, mb, jit: Array.from({ length: N }, () => (r() - 0.5) * 0.12) };
        });
        const resetPos = () => { const B = base(); hB.set(B.mb + 1.0, 0.6); };
        resetPos();
        function addShuffles(n) {
          if (!rr.r) rr.r = v.rng(hashStr('t7.13shuffle'));
          for (let t = 0; t < n && masks.length < 200000; t++) { const idx = Array.from({ length: N }, (_, i) => i); for (let i = 0; i < NA; i++) { const j = i + Math.floor(rr.r() * (N - i)); [idx[i], idx[j]] = [idx[j], idx[i]]; } let m = 0; for (let i = 0; i < NA; i++) m |= 1 << idx[i]; masks.push(m); }
        }
        const leg = legender(v);
        let st = null;
        v.render(() => {
          const B = base(), delta = hB.x - B.mb, a = B.a, b = B.b.map((x) => x + delta), pooled = a.concat(b), tot = pooled.reduce((s, x) => s + x, 0);
          const mA = a.reduce((s, x) => s + x, 0) / NA, mB = b.reduce((s, x) => s + x, 0) / NA, D = mA - mB;
          // exact: all 12,870 relabellings
          const sums = new Float64Array(65536), pc = new Uint8Array(65536); const dif = [];
          for (let k = 1; k < 65536; k++) { const low = k & -k, bit = 31 - Math.clz32(low); sums[k] = sums[k ^ low] + pooled[bit]; pc[k] = pc[k ^ low] + 1; if (pc[k] === NA) dif.push(2 * sums[k] / NA - tot / NA); }
          const eps = 1e-9, cntEx = dif.filter((d) => Math.abs(d) >= Math.abs(D) - eps).length, pEx = cntEx / dif.length;
          let lo = -3, hi = 3; const span = Math.max(...dif.map(Math.abs), Math.abs(D)) * 1.08; lo = -span; hi = span;
          sR.setView([lo, hi], [0, 1]);
          const NB = 41, w = (hi - lo) / NB, ce = new Array(NB).fill(0); for (const d of dif) ce[Math.min(NB - 1, Math.floor((d - lo) / w))]++;
          const dEx = ce.map((c) => c / dif.length / w), ptsR = masks.map((m) => { let s = 0; for (let i = 0; i < N; i++) if (m & (1 << i)) s += pooled[i]; return 2 * s / NA - tot / NA; });
          const cr = new Array(NB).fill(0); for (const d of ptsR) cr[Math.min(NB - 1, Math.max(0, Math.floor((d - lo) / w)))]++;
          const dR = cr.map((c) => (ptsR.length ? c / ptsR.length / w : 0));
          const top = Math.max(...dEx, ...dR) * 1.12;
          sR.setView([lo, hi], [0, top]);
          for (let i = 0; i < NB; i++) { const x0 = lo + i * w, x1 = x0 + w, xc = x0 + w / 2, tail = Math.abs(xc) >= Math.abs(D) - w / 2 + 1e-9 && Math.abs(xc) >= Math.abs(D) - eps - w / 2; if (dR[i]) sR.rect(x0 + 0.04 * w, 0, x1 - 0.04 * w, dR[i], { fill: TC.sim, fillAlpha: 0.5, color: TC.sim, width: 1 }); }
          sR.path(dEx.flatMap((h, i) => [[lo + i * w, h], [lo + (i + 1) * w, h]]), { color: TC.h0, width: 2.2 });
          sR.vband(Math.abs(D), hi, { color: TC.alpha, alpha: 0.12 }); sR.vband(lo, -Math.abs(D), { color: TC.alpha, alpha: 0.12 });
          sR.vline(D, { color: TC.beta, width: 2.4 }); sR.vline(-D, { color: TC.beta, width: 1.2, dash: [4, 4] });
          // left: the data and the latest shuffle
          const dot = (x, y, col, hollow) => sL.dot(x, y, { r: 5.5, color: col, hollow });
          a.forEach((x, i) => dot(x, 0.88 + B.jit[i], TC.h0)); b.forEach((x, i) => dot(x, 0.66 + B.jit[NA + i], TC.beta));
          sL.vline(mA, { color: TC.h0, width: 1.2, dash: [3, 3] }); sL.vline(mB, { color: TC.beta, width: 1.2, dash: [3, 3] });
          if (masks.length) {
            const m = masks[masks.length - 1]; let sa = 0;
            pooled.forEach((x, i) => { const inA = !!(m & (1 << i)); if (inA) sa += x; dot(x, (inA ? 0.34 : 0.12) + B.jit[i], inA ? TC.h0 : TC.beta, true); });
            sL.text(`latest shuffle: difference ${v.fix(2 * sa / NA - tot / NA, 2)}`, -2.9, 0.4, { size: 11.5, color: 'muted', align: 'left', plate: true });
          } else sL.text('press “Shuffle” to relabel at random', -2.9, 0.4, { size: 11.5, color: 'muted', align: 'left', plate: true });
          // t-test
          const T = twoSample(a, b), pT = Math.min(1, 2 * tUp(Math.abs(T.tW), T.nuW));
          const nB = ptsR.length, cB = ptsR.filter((d) => Math.abs(d) >= Math.abs(D) - eps).length;
          leg([[TC.h0, 'exact distribution, all 12,870 relabellings'], [TC.sim, 'random shuffles', { area: true }], [TC.beta, 'observed difference'], [TC.alpha, 'as extreme or more', { area: true }]]);
          st = { D, pEx, cntEx, nTot: dif.length, nB, cB, pMC: (cB + 1) / (nB + 1), pT, tW: T.tW };
        });
        v.readout(() => {
          if (!st) return '';
          const { D, pEx, cntEx, nTot, nB, cB, pMC, pT } = st;
          return String.raw`observed $\bar A-\bar B=${v.fix(D, 3)}$ · **exact permutation p** $=${commas(cntEx)}/${commas(nTot)}=${v.fix(pEx, 4)}$` + (nB ? String.raw` · ${commas(nB)} random shuffles: ${commas(cB)} as extreme, $p=(1+${cB})/(1+${commas(nB)})=${v.fix(pMC, 4)}$ (error $\pm$ ${v.fix(2 * mcse(pEx, nB), 4)})` : ' · no random shuffles yet') + String.raw` · Welch $t$-test $p=${v.fix(pT, 4)}$` + (Math.abs(pT - pEx) > 0.02 ? ' (approximate reference differs from the permutation reference)' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.14
    {
      num: '7.14',
      kind: 'Paper',
      name: 'Controlling the false discovery rate',
      paper: { authors: 'Yoav Benjamini and Yosef Hochberg', year: 1995, title: 'Controlling the False Discovery Rate: A Practical and Powerful Approach to Multiple Testing', venue: 'Journal of the Royal Statistical Society B 57 (1): 289–300', doi: '10.1111/j.2517-6161.1995.tb02031.x' },
      introduces: ['stat-7.10', 'stat-7.11'],
      credit: 'Yoav Benjamini & Yosef Hochberg, 1995',
      statement: String.raw`Benjamini and Hochberg argued that when many hypotheses are tested, controlling the chance of any false rejection (the family-wise error rate, stat-7.7) is often too demanding, costing power that the scientist would rather spend on discoveries. They proposed to control instead the expected proportion of false discoveries among the rejected hypotheses, the **false discovery rate** $\mathrm{FDR}=E[V/\max(R,1)]$ (stat-7.10), and a simple step-up procedure that does it: sort the $m$ p-values, find the largest $k$ with $p_{(k)}\le kq/m$, and reject the $k$ smallest. For independent tests with valid null p-values its FDR is at most $\frac{m_0}{m}q\le q$; equality holds when the independent true-null p-values are continuous Uniform$(0,1)$ (stat-7.11); when every null is true it coincides with FWER control; and with many false nulls it rejects more than Bonferroni-type procedures. They illustrated the idea on fifteen p-values from a study of treatments after myocardial infarction.`,
      idea: String.raw`Before 1995 the multiple-comparison literature (Bonferroni, stat-7.8; Holm, stat-7.9) aimed at FWER control, which becomes very conservative in screens of hundreds or thousands of hypotheses, and practitioners often simply did not correct. The paper changed the error criterion to the one that matches the use of a list of discoveries (the share that will turn out to be false), showed it can be controlled by a procedure no harder than sorting, and reported that the gain in power over FWER methods grows with the number of true effects. The idea became standard in genomics and imaging, where $m$ is in the thousands.`,
      caption: String.raw`The fifteen p-values of the paper's example, sorted and plotted on a log scale against the BH line $iq/m$ (green), Holm's staircase (orange) and Bonferroni's constant $q/m$ (dashed); drag $q$. At $q=0.05$ BH rejects four hypotheses, Holm and Bonferroni three. The values were checked directly against the original article, §3.2 p. 295. The simulation is computed for this page, rather than reproducing the paper’s simulation design. Right: a simulation of fifteen hypotheses with $m_1$ real effects: FWER and FDR of the four procedures over 3,000 screens at level $q$, to see what the extra rejection costs.`,
      deps: ['stat-7.7', 'stat-7.8', 'stat-7.9'],
      refs: [],
      tags: ['false discovery rate', 'history', 'multiple testing'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/False_discovery_rate', doi: 'https://doi.org/10.1111/j.2517-6161.1995.tb02031.x' },
      viz(v) {
        const P = BH1995_P_VALUES;
        const m = 15, REP = 3000;
        const qS = v.slider('level $q$', 0.01, 0.3, 0.05, { step: 0.005 });
        const m1S = v.slider('real effects in the simulation $m_1$', 0, 15, 4, { int: true });
        const muS = v.slider('effect size $\\mu$ in the simulation', 2, 5, 3.5, { step: 0.1 });
        const sL = v.stage({ x: [0, 16], y: [4e-5, 1.5], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: 'rank $i$', ylabel: 'p-value', title: 'the 15 p-values of the paper’s example' });
        const sR = v.stage({ x: [0, 4], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 260, xticks: [[0.5, 'uncorrected'], [1.5, 'Bonferroni'], [2.5, 'Holm'], [3.5, 'BH']], ylabel: 'rate', title: 'simulation: 15 hypotheses at level $q$' });
        const mc = memo();
        const sims = (m1, mu, q) => mc([m1, mu, q].join('|'), () => runScreens(v.rng(hashStr(`t7.14|${m1}|${mu}|${q}`)), { m, m1, mu, reps: REP, alpha: q, sided: 2 }));
        const leg = legender(v);
        let st = null;
        v.render(() => {
          const q = qS.value, m1 = m1S.value, mu = muS.value, c = procs(P, q, Array.from({ length: m }, (_, i) => i));
          sL.fn((x) => (x * q) / m, { domain: [0.01, 16], color: PC.td, width: 2.4, n: 200 });
          sL.hline(q / m, { color: 'muted', width: 1.6, dash: [5, 4] });
          for (let i = 1; i <= m; i++) sL.segment([i - 0.35, q / (m - i + 1)], [i + 0.35, q / (m - i + 1)], { color: TC.beta, width: 2.2 });
          P.forEach((p, k) => { const i = k + 1, rej = i <= c.bh; sL.dot(i, p, { r: 5.2, color: TC.h0, hollow: !rej }); if (i <= 4) sL.text(String(p), i, p, { size: 10.5, color: 'muted', dx: i === 4 ? -9 : 0, dy: i === 4 ? 0 : 13, align: i === 4 ? 'right' : 'center', plate: true }); });
          if (c.bh) { sL.vline(c.bh + 0.5, { color: TC.alpha, width: 1.4, dash: [4, 4] }); tag(sL, `BH rejects ${c.bh}`, c.bh + 0.7, 1e-4 * 1.0, { color: TC.alpha, align: 'left', size: 11.5, weight: 700, dy: 14 }); }
          // adjusted p
          const adj = P.map((p, i) => (m * p) / (i + 1)); for (let i = m - 2; i >= 0; i--) adj[i] = Math.min(adj[i], adj[i + 1]);
          // right
          const S = sims(m1, mu, q), keys = ['unc', 'bonf', 'holm', 'bh'], sm = keys.map((k) => summary(S[k]));
          keys.forEach((k, i) => {
            sR.rect(i + 0.1, 0, i + 0.47, sm[i].fwer, { fill: PC.fd, fillAlpha: 0.6, color: PC.fd, width: 1 }); sR.rect(i + 0.53, 0, i + 0.9, sm[i].fdr, { fill: TC.sim, fillAlpha: 0.6, color: TC.sim, width: 1 });
            tag(sR, v.fix(sm[i].fwer, 2), i + 0.285, sm[i].fwer, { size: 10.5, dy: -10 }); tag(sR, v.fix(sm[i].fdr, 2), i + 0.715, sm[i].fdr, { size: 10.5, dy: -10 });
          });
          sR.hline(q, { color: 'green', width: 1.2, dash: [5, 4] });
          leg([[TC.h0, 'p-value (filled: rejected by BH)', { dot: true }], [PC.td, 'BH line $iq/m$'], [TC.beta, 'Holm $q/(m-i+1)$'], ['muted', 'Bonferroni $q/m$', { dash: true }], [PC.fd, 'FWER', { area: true }], [TC.sim, 'FDR', { area: true }]]);
          st = { q, c, adj, sm, m1, S };
        });
        v.readout(() => {
          if (!st) return '';
          const { q, c, adj, sm, m1 } = st, nAdj = adj.filter((a) => a <= q + 1e-12).length;
          return String.raw`level $q=${v.fix(q, 3)}$ on the 15 p-values: **BH rejects ${c.bh}**, Holm ${c.holm}, Bonferroni ${c.bonf}, uncorrected ${c.unc}` + (Math.abs(q - 0.05) < 1e-9 ? ' · at $q=0.05$ the BH step-up gives 4, as the 2015 arXiv reproduction of the example also reports; Bonferroni and Holm give 3 (computed here)' : '') + String.raw` · today's BH-adjusted p-values (monotone $\min_{j\ge i}mp_{(j)}/j$) $\le q$: ${nAdj}, the same set · simulation, ${m1} real of 15: FDR  BH ${v.fix(sm[3].fdr, 3)} (level ${v.fix(q, 2)}), Holm ${v.fix(sm[2].fdr, 3)}; FWER BH ${v.fix(sm[3].fwer, 3)} vs Holm ${v.fix(sm[2].fwer, 3)}; mean rejections BH ${v.fix(sm[3].R, 1)} vs Holm ${v.fix(sm[2].R, 1)}`;
        });
      },
    },
  ],
};
