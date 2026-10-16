// Statistical Inference — Chapter 7: p-values and multiple testing (items 7.1–7.7; 7.8–7.14 in ch07-b.js)
//
// Part a is about what a p-value is and how it misleads: a tail area under the null, uniform when the null is true,
// and easy to abuse by looking again, by choosing among analyses, or by reading only the winners. Every picture
// pairs an exact computation with simulated data sets (gold). Colours as in chapter 6: the null in blue, real
// effects and alternatives in purple, false positives in red.
import {
  phi, clamp, commas, pct, hashStr, memo, mean, sortNum, binned, legender, titler, strip, mulberry,
  Phi, qnorm, rt, dbinom, TC, Q, binUp, dt, tUp, twoSample, area, tag, mcse, pfmt,
  PC, deltaForPower, powZ2,
} from './ch07.shared.js';

export default {
  collection: 'stat',
  chapter: 7,
  title: 'p-values and multiple testing',
  summary: String.raw`The p-value reports how surprising the data would be if the null hypothesis were true; under the null it is uniformly distributed, which is what makes it calibrated — and what makes it dangerous when many tests are run, when sampling stops at a convenient moment, or when the analysis is chosen after seeing the data. Bonferroni and Holm control the chance of any false rejection, while Benjamini–Hochberg controls the expected fraction of false discoveries, a far better bargain for large-scale screening. Permutation tests give exact p-values with almost no assumptions.`,
  items: [
    // ───────────────────────────────────────────────────────────── 7.1
    {
      num: '7.1',
      kind: 'Definition',
      name: 'p-value',
      statement: String.raw`Let $T$ be a test statistic whose extreme values count as evidence against the null hypothesis $H_0$ (large values, small values, or both tails, as the alternative dictates). For observed data $x$ the **p-value** is the probability, computed as if $H_0$ were true, of a statistic at least as extreme as the one observed:
$$p(x)=\sup_{\theta\in\Theta_0}P_\theta\big(T(X)\text{ is at least as extreme as }T(x)\big),$$
for instance $P_{H_0}(T\ge t_{\rm obs})$ for a right-tailed test and $P_{H_0}(|T|\ge|t_{\rm obs}|)$ for a two-sided test with a symmetric null law (the supremum matters only when $H_0$ is composite). The p-value is itself a statistic, a number between 0 and 1 that varies from sample to sample, and the test "reject when $p\le\alpha$" has size at most $\alpha$ (stat-7.2). A small p-value says the data would be rare if $H_0$ held; it does not say how probable $H_0$ is.`,
      idea: String.raw`Instead of fixing a cutoff in advance and reporting reject or retain, the p-value reports the smallest level at which the data would have led to rejection: it is the size of the test whose critical value is the observed statistic. The same observed number can therefore carry very different p-values under different null laws or different tail conventions, because the p-value is an area under a density, and areas depend on where the tails are. It converts any statistic with a known null law to one common scale, which is why p-values from unrelated tests can be compared, combined and corrected (the rest of the chapter).`,
      caption: String.raw`Left: the null density of the statistic with the tail beyond the observed value shaded red; drag the gold handle (the observed statistic) and read the area. The dots are 1,500 simulated statistics from the null: those at least as extreme as the handle turn gold, and their share is the p-value. Right: the p-value as a function of the observed value, with the 5% line. Switch to the heavy-tailed $t_5$ null: the same observed value has a larger p-value. Switch the tail rule to see the left, right and two-sided versions.`,
      deps: ['stat-6.2'],
      refs: ['Casella–Berger §8.3', 'Wasserman §10.2'],
      tags: ['p-value', 'tail probability', 'significance'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/P-value' },
      viz(v) {
        const lawS = v.select('null law of the statistic', [{ value: 'z', label: 'normal $N(0,1)$' }, { value: 't', label: 'Student $t_5$' }], 'z');
        const tailS = v.select('"at least as extreme" means', [{ value: 'gt', label: 'right tail' }, { value: 'lt', label: 'left tail' }, { value: 'ne', label: 'both tails' }], 'ne');
        const L = -4.5, U = 4.5, NS = 1500;
        const sL = v.stage({ x: [L, U], y: [0, 0.46], axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'observed statistic $t_{\\rm obs}$', ylabel: 'null density', title: 'null distribution and the tail beyond the observed value' });
        const sR = v.stage({ x: [L, U], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 0.85, minWidth: 250, xlabel: '$t_{\\rm obs}$', ylabel: 'p-value', title: 'the p-value as a function of the data' });
        const hy = 0.02;
        const hT = sL.handle(1.7, hy, { color: TC.sim, constrain: (x) => [clamp(x, -4.3, 4.3), hy] });
        const dens = (law) => (law === 'z' ? phi : (x) => dt(x, 5));
        const S = (law, t) => (law === 'z' ? Q(t) : tUp(t, 5));
        const pv = (law, tail, t) => (tail === 'gt' ? S(law, t) : tail === 'lt' ? S(law, -t) : Math.min(1, 2 * S(law, Math.abs(t))));
        const mc = memo();
        const sims = (law) => mc(law, () => { const r = v.rng(hashStr('t7.1|' + law)), j = mulberry(3), a = []; for (let i = 0; i < NS; i++) a.push(law === 'z' ? r.normal() : rt(r, 5)); return { a, jit: a.map(() => j()) }; });
        const leg = legender(v);
        let st = null;
        v.render(() => {
          const law = lawS.value, tail = tailS.value, t = hT.x, f = dens(law), S0 = sims(law);
          const ext = (x) => (tail === 'gt' ? x >= t : tail === 'lt' ? x <= t : Math.abs(x) >= Math.abs(t));
          if (tail === 'gt') area(sL, f, t, U, TC.alpha, 0.4); else if (tail === 'lt') area(sL, f, L, t, TC.alpha, 0.4);
          else { area(sL, f, Math.abs(t), U, TC.alpha, 0.4); area(sL, f, L, -Math.abs(t), TC.alpha, 0.4); }
          sL.fn(f, { domain: [L, U], color: TC.h0, width: 2.6, n: 300 });
          const ok = [], hit = [];
          S0.a.forEach((x, i) => { if (x < L || x > U) return; (ext(x) ? hit : ok).push([x, 0.05 + 0.09 * S0.jit[i]]); });
          sL.dots(ok, { r: 1.8, color: 'muted', alpha: 0.4 }); sL.dots(hit, { r: 2.2, color: TC.sim, alpha: 0.9 });
          sL.vline(t, { color: TC.sim, width: 2.4 });
          if (tail === 'ne') sL.vline(-t, { color: TC.sim, width: 1.4, dash: [4, 4] });
          const p = pv(law, tail, t);
          tag(sL, `p = ${pfmt(p, 3)}`, t > 0 ? 3.9 : -3.9, 0.42, { color: TC.alpha, align: t > 0 ? 'right' : 'left', size: 13, weight: 700 });
          // right: p(t)
          sR.hline(0.05, { color: 'green', width: 1.2, dash: [5, 4] });
          sR.text('0.05', U - 0.1, 0.05, { color: 'green', size: 11, align: 'right', dy: -9 });
          sR.fn((x) => pv(law, tail, x), { domain: [L, U], color: TC.alpha, width: 2.6, n: 300 });
          sR.line(t, 0, t, p, { color: TC.sim, width: 1.2, dash: [3, 3] }); sR.line(L, p, t, p, { color: TC.sim, width: 1.2, dash: [3, 3] });
          sR.dot(t, p, { r: 5.5, color: TC.sim });
          leg([[TC.h0, law === 'z' ? 'null density $N(0,1)$' : 'null density $t_5$'], [TC.alpha, 'tail area = p-value', { area: true }], [TC.sim, 'simulated null statistics', { dot: true }]]);
          st = { law, tail, t, p, share: hit.length / NS, nh: S0.a.filter(ext).length };
        });
        v.readout(() => {
          if (!st) return '';
          const { law, tail, t, p, nh } = st;
          const form = tail === 'gt' ? `P_{H_0}(T\\ge ${v.fix(t, 2)})` : tail === 'lt' ? `P_{H_0}(T\\le ${v.fix(t, 2)})` : `P_{H_0}(|T|\\ge ${v.fix(Math.abs(t), 2)})`;
          return String.raw`$t_{\rm obs}=${v.fix(t, 2)}$ · exact $p=${form}=${pfmt(p, 3)}$ · simulated: ${nh} of ${commas(1500)} null statistics are at least as extreme, ${v.fix(nh / 1500, 3)} $\pm$ ${v.fix(2 * mcse(p, 1500), 3)}` + (p <= 0.05 ? ' · **below 0.05: the conventional 5% test rejects**' : ' · above 0.05: the 5% test retains') + (law === 't' ? ` · for the normal null the same $t_{\\rm obs}$ would give $p=${pfmt(pv('z', tail, t), 3)}$` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.2
    {
      num: '7.2',
      kind: 'Theorem',
      name: 'Null p-values are uniformly distributed',
      statement: String.raw`Let $T$ have a continuous distribution function $F$ under a simple null $H_0$ and let the p-value be $p=1-F(T)$ (right tail). Then $p\sim\mathrm{Uniform}(0,1)$ under $H_0$: $P_{H_0}(p\le u)=u$ for all $u\in[0,1]$. For a general statistic and a composite null, $P_\theta(p\le u)\le u$ for every $\theta\in\Theta_0$ and every $u$ (the p-value is **stochastically larger than uniform**); equality fails for a discrete statistic, whose p-value takes only finitely many values, so the exact test is conservative. Under an alternative, $p$ is stochastically *smaller* than uniform: for the two-sided $z$-test of $H_0:\mu=0$ with $Z\sim N(\delta,1)$, $P(p\le u)=Q(z_{u/2}-\delta)+Q(z_{u/2}+\delta)\ge u$, where $Q$ is the standard normal upper tail and $Q(z_{u/2})=u/2$.`,
      idea: String.raw`This is the probability integral transform (stat-1.13) in disguise: $F(T)$ is uniform when $T$ has distribution $F$, and the p-value is a tail probability of the null law evaluated at the data. The rule "reject when $p\le\alpha$" therefore has size exactly $\alpha$ for every $\alpha$ at once, which is what it means for a p-value to be calibrated. For a discrete statistic the transform only reaches the attainable values, so the cumulative distribution of $p$ lies on or below the diagonal in steps; under an alternative the density of $p$ piles up near 0, and the height of that pile is the power.`,
      caption: String.raw`5,000 p-values from simulated experiments. Left: their histogram (gold bars) against the exact expected bin heights (dots) and the flat uniform density. Right: the cumulative distribution of $p$ (gold) against the diagonal and the exact curve. **Continuous**: with effect $\delta=0$ the histogram is flat and the curve is the diagonal; raise $\delta$ and mass piles at 0. **Discrete**: for an exact binomial test the p-values live on a few values, the bars are uneven and the exact curve is a staircase below the diagonal — conservative.`,
      deps: ['stat-7.1', 'stat-1.13'],
      refs: ['Casella–Berger §8.3'],
      tags: ['p-value', 'uniform distribution', 'calibration'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/P-value#Distribution_for_the_case_of_a_simple_null_hypothesis' },
      viz(v) {
        const modeS = v.select('statistic', [{ value: 'z', label: 'continuous: two-sided $z$-test' }, { value: 'bin', label: 'discrete: exact binomial test' }], 'z');
        const dS = v.slider('effect $\\delta$ (0 = null true)', 0, 4, 0, { step: 0.05 });
        const nS = v.slider('binomial $n$', 5, 60, 10, { int: true });
        const pS = v.slider('true $p$ (null: 0.5)', 0.5, 0.9, 0.5, { step: 0.01 });
        const R = 5000, NB = 20;
        const sL = v.stage({ x: [0, 1], y: [0, 3], axes: 'box', gutter: true, height: 320, weight: 1.05, xlabel: 'p-value', ylabel: 'density', title: 'histogram of 5,000 p-values' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 0.95, minWidth: 250, xlabel: '$u$', ylabel: '$P(p\\le u)$', title: 'cumulative distribution of $p$' });
        const leg = legender(v);
        const mc = memo();
        // for the binomial test (reject for large X, null p = 1/2): p(k) = P(Bin(n,1/2) >= k)
        const model = (mode, n, d, p1) => {
          if (mode === 'z') {
            const G = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : powZ2(d, u));
            return { G, atoms: null };
          }
          const pk = [], pr = [];
          for (let k = 0; k <= n; k++) { pk.push(binUp(k, n, 0.5)); pr.push(dbinom(k, n, p1)); }
          const G = (u) => { let s = 0; for (let k = 0; k <= n; k++) if (pk[k] <= u + 1e-12) s += pr[k]; return Math.min(1, s); };
          return { G, atoms: { pk, pr } };
        };
        const sim = (mode, n, d, p1) => mc([mode, n, d, p1].join('|'), () => {
          const r = v.rng(hashStr(`t7.2|${mode}|${n}|${d}|${p1}`)), out = new Float64Array(R);
          if (mode === 'z') { const c = d; for (let i = 0; i < R; i++) out[i] = 2 * Q(Math.abs(c + r.normal())); }
          else {
            const M = model(mode, n, d, p1), cum = []; let s = 0; for (let k = 0; k <= n; k++) { s += M.atoms.pr[k]; cum.push(s); }
            for (let i = 0; i < R; i++) { const u = r() * s; let k = 0; while (k < n && cum[k] < u) k++; out[i] = M.atoms.pk[k]; }
          }
          return out;
        });
        let st = null;
        v.render(() => {
          const mode = modeS.value, z = mode === 'z', n = nS.value, d = dS.value, p1 = pS.value;
          dS.el.hidden = !z; nS.el.hidden = z; pS.el.hidden = z;
          const M = model(mode, n, d, p1), vals = sim(mode, n, d, p1);
          // exact expected bin heights
          const ex = []; for (let b = 0; b < NB; b++) ex.push((M.G((b + 1) / NB) - M.G(b / NB)) * NB);
          const cnt = new Array(NB).fill(0); for (const x of vals) cnt[Math.min(NB - 1, Math.floor(x * NB))]++;
          const dens = cnt.map((c) => (c * NB) / R);
          const top = Math.max(1.4, ...dens, ...ex) * 1.12;
          sL.setView([0, 1], [0, top]);
          dens.forEach((h, b) => sL.rect(b / NB + 0.004, 0, (b + 1) / NB - 0.004, h, { fill: TC.sim, fillAlpha: 0.5, color: TC.sim, width: 1 }));
          sL.hline(1, { color: 'muted', width: 1.4, dash: [5, 4] });
          sL.dots(ex.map((h, b) => [(b + 0.5) / NB, h]), { r: 4, color: TC.h1 });
          sL.corner('dashed: uniform density 1', 'tr', { color: 'muted' });
          // right: ECDF vs exact
          const grid = 400, emp = [], exa = [], sorted = Float64Array.from(vals).sort(); let j = 0, ks = 0;
          for (let i = 0; i <= grid; i++) { const u = i / grid; while (j < R && sorted[j] <= u + 1e-12) j++; const e = j / R; emp.push([u, e]); ks = Math.max(ks, Math.abs(e - u)); }
          for (let i = 0; i <= 1000; i++) { const u = i / 1000; exa.push([u, M.G(u)]); }
          sR.line(0, 0, 1, 1, { color: 'muted', width: 1.4, dash: [5, 4] });
          sR.path(exa, { color: TC.h1, width: 2.4 });
          sR.path(emp, { color: TC.sim, width: 2.4 });
          const e05 = emp[Math.round(0.05 * grid)][1], g05 = M.G(0.05);
          sR.dot(0.05, g05, { r: 4.5, color: TC.h1 });
          tag(sR, `P(p ≤ 0.05) = ${v.fix(g05, 3)}`, 0.07, g05, { align: 'left', dy: -14, size: 11.5, color: TC.h1 });
          leg([[TC.sim, 'simulated p-values'], [TC.h1, 'exact', { dot: true }], ['muted', 'uniform', { dash: true }]]);
          st = { mode, g05, e05, ks, nd: M.atoms ? new Set(M.atoms.pk.map((x) => x.toFixed(10))).size : 0, d, mean: mean(vals) };
        });
        v.readout(() => {
          if (!st) return '';
          const { mode, g05, e05, ks, nd, d, mean: mu } = st;
          const nullz = mode === 'z' && d === 0;
          let s = String.raw`$P(p\le0.05)$: exact ${v.fix(g05, 4)}, simulated ${v.fix(e05, 4)} $\pm$ ${v.fix(2 * mcse(g05, 5000), 4)} · largest gap between the simulated CDF and the diagonal ${v.fix(ks, 3)}` + (ks < 0.03 && nullz ? ' (typical gap for 5,000 uniform draws: about 0.01)' : '') + String.raw` · mean $p$ ${v.fix(mu, 3)} (uniform: 0.500)`;
          if (mode === 'bin') s += String.raw` · only **${nd}** distinct p-values occur`;
          if (nullz) s += ' · **the null p-values are uniform**';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.3
    {
      num: '7.3',
      kind: 'Phenomenon',
      name: 'A p-value is not the probability the null is true',
      statement: String.raw`The p-value is $P(\text{data this extreme}\mid H_0)$, not $P(H_0\mid\text{data})$. The second quantity needs a prior: if a fraction $\pi_1$ of the hypotheses a field tests are real, the tests have power $1-\beta$ at level $\alpha$, and a result counts as "significant" when $p\le\alpha$, then among significant results the share in which $H_0$ was actually true is
$$P(H_0\mid p\le\alpha)=\frac{(1-\pi_1)\,\alpha}{(1-\pi_1)\,\alpha+\pi_1(1-\beta)},$$
which is usually far larger than $\alpha$. With $\pi_1=0.1$ and power $0.5$ it is $0.9\cdot0.05/(0.9\cdot0.05+0.1\cdot0.5)=47\%$. The share is even larger among results that are only just significant (for example $0.8\alpha<p\le\alpha$), because null p-values spread evenly while p-values from real effects pile up near 0. Which fraction of hypotheses is real is not something the data of any single test can reveal.`,
      idea: String.raw`Bayes' rule: a significant result arises either from a true null that happened to fall in the rejection region (probability $\alpha$ each) or from a real effect that was detected (probability equal to the power). The ratio of these two sources of significance depends on how many nulls there were to begin with, which a p-value ignores. By stat-7.2 null p-values are flat, so they contribute equally to every bin; real effects contribute a decreasing density, so the closer to $\alpha$ one looks the larger the share of nulls.`,
      caption: String.raw`A simulated literature of 20,000 tested hypotheses, a fraction $\pi_1$ of them real (purple) and the rest null (blue); each is a two-sided $z$-test whose effect size is set by the power slider. Left: histogram of the p-values below 0.1, nulls stacked below real effects (flat blue floor, purple pile near 0); the red band is "significant", the gold band the "just significant" window $(0.8\alpha,\alpha]$. Right: composition of the significant results and of the just-significant ones; the bars' blue share is the probability the null was true. Lower the power or the prior $\pi_1$ and watch the blue share explode.`,
      deps: ['stat-7.2'],
      refs: ['Wasserman §10.2'],
      tags: ['p-value', 'false positives', 'base rate'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Misuse_of_p-values' },
      scope: String.raw`A model: a fixed prior fraction $\pi_1$ of real effects, all with the same power, independent tests, no selective reporting. Real literatures differ in all three; the point is the arithmetic of the base rate, not a claim about any particular field.`,
      viz(v) {
        const piS = v.slider('fraction of real effects $\\pi_1$', 0.01, 0.9, 0.1, { step: 0.01 });
        const pwS = v.slider('power of each test', 0.1, 0.99, 0.5, { step: 0.01 });
        const aS = v.select('$\\alpha$', [{ value: 0.05, label: '0.05' }, { value: 0.01, label: '0.01' }, { value: 0.005, label: '0.005' }], 0.05);
        const N = 20000, NB = 20;
        const sL = v.stage({ x: [0, 0.1], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'p-value', ylabel: 'number of tests', title: 'p-values of 20,000 tests' });
        const sR = v.stage({ x: [0, 1], y: [0, 3], axes: 'box', gutter: true, height: 330, weight: 0.85, minWidth: 250, xlabel: 'share of results', yticks: [], title: 'was the null true, among the significant results?' });
        const mc = memo();
        const base = () => mc('base', () => { const r = v.rng(hashStr('t7.3')), u = new Float64Array(N), e = new Float64Array(N); for (let i = 0; i < N; i++) { u[i] = r(); e[i] = r.normal(); } return { u, e }; });
        const leg = legender(v);
        let st = null;
        v.render(() => {
          const pi1 = piS.value, pw = pwS.value, a = +aS.value, B = base();
          const dl = deltaForPower(pw, a), cn = new Array(NB).fill(0), cr = new Array(NB).fill(0);
          let sigN = 0, sigR = 0, winN = 0, winR = 0;
          for (let i = 0; i < N; i++) {
            const real = B.u[i] < pi1, p = 2 * Q(Math.abs(B.e[i] + (real ? dl : 0)));
            if (p <= a) { sigN += real ? 0 : 1; sigR += real ? 1 : 0; }
            if (p <= a && p > 0.8 * a) { winN += real ? 0 : 1; winR += real ? 1 : 0; }
            if (p < 0.1) { const b = Math.min(NB - 1, Math.floor(p * 10 * NB)); (real ? cr : cn)[b]++; }
          }
          const top = Math.max(...cn.map((c, b) => c + cr[b])) * 1.1;
          sL.setView([0, 0.1], [0, top]);
          sL.vband(0, a, { color: TC.alpha, alpha: 0.1 }); sL.vband(0.8 * a, a, { color: TC.sim, alpha: 0.2 });
          for (let b = 0; b < NB; b++) {
            const x0 = (b / NB) * 0.1, x1 = ((b + 1) / NB) * 0.1, g = 0.0003;
            sL.rect(x0 + g, 0, x1 - g, cn[b], { fill: TC.h0, fillAlpha: 0.55, color: TC.h0, width: 1 });
            sL.rect(x0 + g, cn[b], x1 - g, cn[b] + cr[b], { fill: TC.h1, fillAlpha: 0.6, color: TC.h1, width: 1 });
          }
          sL.text(`α = ${a}`, a, top * 0.97, { color: TC.alpha, size: 11.5, align: 'left', dx: 5, weight: 700, plate: true });
          // right: stacked bars
          const bar = (y, nul, rea, ex) => {
            const tot = Math.max(1, nul + rea), f = nul / tot;
            sR.rect(0, y - 0.35, f, y + 0.35, { fill: TC.h0, fillAlpha: 0.6, color: TC.h0, width: 1 });
            sR.rect(f, y - 0.35, 1, y + 0.35, { fill: TC.h1, fillAlpha: 0.6, color: TC.h1, width: 1 });
            sR.vline(ex, { color: 'ink', width: 1.4, dash: [4, 4] });
            tag(sR, `null true: ${pct(f, 0)}`, Math.min(0.6, Math.max(f / 2, 0.14)), y, { size: 12, weight: 700 });
            return f;
          };
          const f1 = bar(2.1, sigN, sigR, a), f2 = bar(0.9, winN, winR, a);
          sR.text('dashed line: α', a, 2.85, { color: 'ink', size: 11, align: 'left', dx: 4 });
          sR.text('all significant results ($p\\le\\alpha$)', 0.08, 2.62, { color: 'ink', size: 12, align: 'left', weight: 600 });
          sR.text('just significant ($0.8\\alpha<p\\le\\alpha$)', 0.08, 1.42, { color: 'ink', size: 12, align: 'left', weight: 600 });
          const Gw = (u) => powZ2(dl, u);
          const exAll = ((1 - pi1) * a) / ((1 - pi1) * a + pi1 * pw);
          const exWin = ((1 - pi1) * 0.2 * a) / ((1 - pi1) * 0.2 * a + pi1 * (Gw(a) - Gw(0.8 * a)));
          leg([[TC.h0, 'null was true', { area: true }], [TC.h1, 'effect was real', { area: true }], [TC.alpha, 'p ≤ α', { area: true }], [TC.sim, 'just significant', { area: true }]]);
          st = { pi1, pw, a, sigN, sigR, winN, winR, f1, f2, exAll, exWin };
        });
        v.readout(() => {
          if (!st) return '';
          const { pi1, pw, a, sigN, sigR, winN, winR, f1, f2, exAll, exWin } = st;
          return String.raw`among the **${commas(sigN + sigR)}** significant results ($p\le${a}$) the null was true in **${pct(f1, 1)}** (formula $\frac{(1-\pi_1)\alpha}{(1-\pi_1)\alpha+\pi_1(1-\beta)}=${pct(exAll, 1)}$) · among the **${commas(winN + winR)}** just-significant ones ($${v.fix(0.8 * a, 3)}<p\le${a}$) in **${pct(f2, 1)}** (exact ${pct(exWin, 1)}) · the nominal rate is ${pct(a, 1)}` + (f1 > 3 * a ? ' · **far above it**' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.4
    {
      num: '7.4',
      kind: 'Phenomenon',
      name: 'Optional stopping inflates false positives',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. $N(0,1)$ data from a true null $H_0:\mu=0$, and let $Z_n=\sum_{i\le n}X_i/\sqrt n$. A fixed-sample test that looks once, at a sample size $N$ chosen in advance, rejects with probability exactly $\alpha$ (for $\alpha=0.05$, when $|Z_N|>1.96$). A researcher who recomputes the p-value after each new observation (or every $k$ observations) and stops the first time $|Z_n|>1.96$, or at a maximum $N$, rejects with probability $P(\max_{n\le N}|Z_n|>1.96)$, which increases with $N$ and tends to 1 as $N\to\infty$ (because $\limsup|Z_n|/\sqrt{2\ln\ln n}=1$ almost surely, the law of the iterated logarithm). The p-value reported at the stopping time is no longer uniform under the null. The remedy is to plan the looks and use a larger critical value: a group-sequential or alpha-spending design.`,
      idea: String.raw`Each look is another test, and the tests are strongly dependent because $Z_n$ and $Z_{n+1}$ share all but one observation; a random walk $S_n=\sum X_i$ scaled by $\sqrt n$ keeps wandering, and eventually it exits any band of fixed width. The chance of a crossing is not the sum of the individual 5% chances (that would exceed 1 quickly) because crossings come in clumps, but it climbs steadily; the right panel measures it. Planned sequential designs (Armitage, McPherson and Rowe studied repeated significance tests in 1969) raise the threshold so that the overall rate stays at $\alpha$.`,
      caption: String.raw`2,000 simulated experiments under a true null. Left: $|Z_n|$ against the sample size $n$ (log axis) for six of them (gold), with the critical value $c$; a red dot marks the first crossing. Right: the fraction of experiments that have *ever* crossed $c$ by sample size $n$, looking every $k$ observations; drag the handle to choose the maximum sample size $N$. The flat line is a single planned look. Raise $c$ or look less often to bring the curve back toward 5%; the readout gives the critical value that would keep the overall error at 5% for your schedule.`,
      deps: ['stat-7.2'],
      refs: ['Wasserman §10.2'],
      tags: ['optional stopping', 'sequential testing', 'false positives'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sequential_analysis' },
      scope: String.raw`Known variance, normal data, a two-sided $z$-test and at most 1,000 observations; the inflation is a feature of repeated looks at any fixed-level test, though its size depends on the test and the look schedule.`,
      credit: 'repeated significance tests: P. Armitage, C. K. McPherson & B. C. Rowe, 1969',
      viz(v) {
        const NMAX = 1000, R = 2000;
        const kS = v.slider('look every $k$ observations', 1, 100, 1, { int: true, log: true });
        const cS = v.slider('critical value $c$ for $|Z_n|$', 1.5, 4, 1.96, { step: 0.01 });
        const sL = v.stage({ x: [1, NMAX], y: [0, 4.5], xlog: true, axes: 'box', gutter: true, height: 330, weight: 1.05, xlabel: 'sample size $n$', ylabel: '$|Z_n|$', title: 'six experiments under a true null' });
        const sR = v.stage({ x: [1, NMAX], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 330, weight: 0.95, minWidth: 250, xlabel: 'maximum sample size $N$', ylabel: 'P(ever significant by $N$)', title: 'false positive rate of "stop when p < 0.05"' });
        const hN = sR.handle(NMAX, 0.2, { color: TC.sim, label: '$N$', labelPos: 'n', constrain: (x) => [clamp(Math.round(x), 1, NMAX), 0.2] });
        const mc = memo(), mk = memo();
        const paths = () => mc('p', () => {
          const r = v.rng(hashStr('t7.4')), Z = new Float32Array(R * NMAX);
          for (let t = 0; t < R; t++) { let s = 0; for (let n = 1; n <= NMAX; n++) { s += r.normal(); Z[t * NMAX + n - 1] = s / Math.sqrt(n); } }
          return Z;
        });
        const analyse = (k, c) => mk(k + '|' + c, () => {
          const Z = paths(), first = new Int32Array(R).fill(0), cnt = new Float64Array(NMAX + 2);
          for (let t = 0; t < R; t++) { const o = t * NMAX; for (let n = k; n <= NMAX; n += k) if (Math.abs(Z[o + n - 1]) > c) { first[t] = n; cnt[n]++; break; } }
          const cum = new Float64Array(NMAX + 1); for (let n = 1; n <= NMAX; n++) cum[n] = cum[n - 1] + cnt[n];
          return { first, cum };
        });
        const leg = legender(v);
        let st = null;
        v.render(() => {
          const k = kS.value, c = cS.value, N = hN.x, Z = paths(), A = analyse(k, c);
          sL.hline(c, { color: TC.alpha, width: 1.6, dash: [5, 4] });
          const cols = ['gold'];
          for (let t = 0; t < 6; t++) {
            const pts = []; for (let n = 1; n <= NMAX; n++) pts.push([n, Math.abs(Z[t * NMAX + n - 1])]);
            sL.path(pts, { color: TC.sim, width: 1.3, alpha: 0.75 });
            if (A.first[t]) sL.dot(A.first[t], Math.abs(Z[t * NMAX + A.first[t] - 1]), { r: 4.5, color: TC.alpha });
          }
          // right: curve
          const cur = []; for (let n = 1; n <= NMAX; n++) cur.push([n, A.cum[n] / R]);
          sR.hline(0.05, { color: 'green', width: 1.2, dash: [5, 4] });
          sR.text('5%', 1.2, 0.05, { color: 'green', size: 11, align: 'left', dy: -9 });
          sR.path(cur, { color: TC.alpha, width: 2.6 });
          const fN = A.cum[N] / R;
          // single planned look at N
          let one = 0; for (let t = 0; t < R; t++) if (Math.abs(Z[t * NMAX + N - 1]) > c) one++;
          const mx = new Float64Array(R); for (let t = 0; t < R; t++) { let m = 0; for (let n = k; n <= N; n += k) m = Math.max(m, Math.abs(Z[t * NMAX + n - 1])); mx[t] = m; }
          const sm = Float64Array.from(mx).sort(), cStar = sm[Math.floor(0.95 * R)];
          sR.vline(N, { color: TC.sim, width: 1.4, dash: [3, 3] });
          sR.dot(N, fN, { r: 5.5, color: TC.alpha });
          sR.dot(N, one / R, { r: 5, color: TC.h0 });
          tag(sR, `${pct(fN, 0)}`, N, fN, { color: TC.alpha, align: N > 100 ? 'right' : 'left', dx: N > 100 ? -9 : 9, dy: -12, weight: 700 });
          leg([[TC.sim, '$|Z_n|$ along one experiment'], [TC.alpha, 'ever past $c$ (looking every $k$)'], [TC.h0, 'one planned look at $N$', { dot: true }]]);
          st = { k, c, N, fN, one: one / R, cStar, nl: Math.floor(N / k) };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, c, N, fN, one, cStar, nl } = st;
          return String.raw`$c=${v.fix(c, 2)}$ (nominal two-sided size ${pct(2 * Q(c), 1)}) · looking every ${k} up to $N=${N}$ (${commas(nl)} looks): **${pct(fN, 1)}** of 2,000 true-null experiments are declared significant at some look ($\pm$${pct(2 * mcse(fN, 2000), 1)}) · a single planned look at $N$: ${pct(one, 1)} · to keep the overall rate at 5% with this schedule, $c$ would have to be about **${v.fix(cStar, 2)}**`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.5
    {
      num: '7.5',
      kind: 'Phenomenon',
      name: 'The garden of forking paths',
      statement: String.raw`Suppose a study has several defensible ways to analyse its data: which outcome to report, which subgroup to examine, which observations to call outliers. If the analyst chooses a path *after* seeing the data (even honestly and without trying many analyses, just by taking the one that looks right) the reported p-value is the smallest, or a data-dependent, member of a collection of p-values, and its null distribution is no longer uniform. With $K$ paths whose p-values are independent under the null, the chance that the best of them falls below $\alpha$ is $1-(1-\alpha)^K$; correlated paths inflate less, but still more than $\alpha$. The p-value of the analysis that was actually run would have been valid had that analysis been fixed in advance, which is why pre-registration, or reporting every path, restores calibration.`,
      idea: String.raw`This is the multiple-testing problem (stat-7.7) with the tests hidden in the researcher's choices. By stat-7.2 each path's p-value is uniform under the null; the smallest of $K$ uniform variables has distribution function $1-(1-u)^K$ if they are independent, and lies between $u$ and $\min(1,Ku)$ whatever the dependence. Andrew Gelman and Eric Loken described this problem, which arises without any deliberate fishing, in a 2013 working paper; the name echoes a Borges story.`,
      caption: String.raw`Pure-noise data: 40 participants split into two groups, no true effects anywhere. The menu of analyses has up to four outcomes, two subgroups-or-all, and two outlier rules; choose how many are allowed and how correlated the outcomes are. Left: one data set, every path as a tile with its Welch $t$-test p-value (red if below 0.05); the analyst reports the best. Right: the best p-value over 1,000 such data sets; the red part is the share that would be written up as "significant". With a single allowed path it is 5%; with all 24 it is not.`,
      deps: ['stat-7.2'],
      refs: ['Wasserman §10.7'],
      tags: ['forking paths', 'p-hacking', 'multiple comparisons'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Forking_paths_problem' },
      credit: 'A. Gelman & E. Loken, 2013 (working paper)',
      scope: String.raw`A simulation of a made-up study with the menu described in the caption. The actual number of forking paths in a real analysis is rarely known, which is the point.`,
      viz(v) {
        const outS = v.slider('outcomes allowed', 1, 4, 3, { int: true });
        const subS = v.select('subgroups allowed', [{ value: 1, label: 'everyone' }, { value: 3, label: 'everyone, men, women' }], 3);
        const ruleS = v.select('outlier rules allowed', [{ value: 1, label: 'keep all' }, { value: 2, label: 'keep all, or drop beyond 2 SD' }], 2);
        const rhoS = v.slider('correlation between outcomes', 0, 0.9, 0, { step: 0.05 });
        const nxt = v.button('Next data set', () => { ds = (ds + 1) % 1000; });
        let ds = 0;
        const ND = 1000, n = 40, NP = 24;
        const sL = v.stage({ x: [0, 6], y: [0, 4.4], axes: false, height: 330, weight: 1.05, title: 'one pure-noise data set: p-value of each analysis path' });
        const sR = v.stage({ x: [0, 1], y: [0, 3], axes: 'box', gutter: true, height: 330, weight: 0.95, minWidth: 250, xlabel: 'smallest p-value over the allowed paths', ylabel: 'density', title: 'best p over 1,000 data sets' });
        const SGN = ['everyone', 'men', 'women'], RLN = ['keep all', 'trim 2 SD'];
        const mc = memo();
        const tp = (a, b) => { if (a.length < 3 || b.length < 3) return 1; const t = twoSample(a, b); return Math.min(1, 2 * tUp(Math.abs(t.tW), t.nuW)); };
        const trim = (a) => { const m = mean(a); let s = 0; for (const x of a) s += (x - m) ** 2; const sd = Math.sqrt(s / (a.length - 1)); return a.filter((x) => Math.abs(x - m) <= 2 * sd); };
        // p[ds][o][sg][rule] flat, index ((o*3)+sg)*2+rule
        const table = (rho) => mc('t' + rho, () => {
          const r = v.rng(hashStr('t7.5|' + rho)), P = new Float32Array(ND * NP), a = Math.sqrt(rho), b = Math.sqrt(1 - rho);
          for (let d = 0; d < ND; d++) {
            const grp = [], sex = [], Y = [[], [], [], []];
            for (let i = 0; i < n; i++) { grp.push(i < n / 2 ? 0 : 1); sex.push(r() < 0.5 ? 0 : 1); }
            for (let i = 0; i < n; i++) { const w = r.normal(); for (let o = 0; o < 4; o++) Y[o].push(a * w + b * r.normal()); }
            for (let o = 0; o < 4; o++) for (let sg = 0; sg < 3; sg++) for (let ru = 0; ru < 2; ru++) {
              let A = [], B = []; for (let i = 0; i < n; i++) { if (sg === 1 && sex[i] !== 0) continue; if (sg === 2 && sex[i] !== 1) continue; (grp[i] ? B : A).push(Y[o][i]); }
              if (ru) { A = trim(A); B = trim(B); }
              P[d * NP + (o * 3 + sg) * 2 + ru] = tp(A, B);
            }
          }
          return P;
        });
        const leg = legender(v);
        let st = null;
        v.render(() => {
          const O = outS.value, S = +subS.value, Ru = +ruleS.value, rho = rhoS.value, P = table(rho);
          const paths = []; for (let o = 0; o < O; o++) for (let sg = 0; sg < S; sg++) for (let ru = 0; ru < Ru; ru++) paths.push((o * 3 + sg) * 2 + ru);
          const K = paths.length;
          // left: tile grid, rows outcomes (top = 1), columns = subgroup×rule
          const cols = 6, cw = 1;
          let best = 1, bi = -1; paths.forEach((ix) => { const p = P[ds * NP + ix]; if (p < best) { best = p; bi = ix; } });
          for (let o = 0; o < 4; o++) for (let sg = 0; sg < 3; sg++) for (let ru = 0; ru < 2; ru++) {
            const ix = (o * 3 + sg) * 2 + ru, p = P[ds * NP + ix], on = paths.includes(ix), col = sg * 2 + ru, y0 = 3 - o;
            const sig = on && p < 0.05;
            sL.rect(col + 0.04, y0 + 0.06, col + 0.96, y0 + 0.94, { fill: !on ? 'faint' : sig ? TC.alpha : TC.h0, fillAlpha: !on ? 0.06 : sig ? 0.55 : 0.12, color: ix === bi ? 'ink' : on ? TC.h0 : 'faint', width: ix === bi ? 3 : 1, radius: 6 });
            sL.text(on ? v.fix(p, 3) : '—', col + 0.5, y0 + 0.5, { size: 12, weight: ix === bi ? 800 : 500, color: on ? 'ink' : 'faint' });
          }
          for (let sg = 0; sg < 3; sg++) for (let ru = 0; ru < 2; ru++) sL.text(`${SGN[sg]}, ${RLN[ru]}`, sg * 2 + ru + 0.5, 4.2, { size: 10.5, color: 'muted' });
          for (let o = 0; o < 4; o++) sL.text(`outcome ${o + 1}`, 0.1, 3 - o + 0.78, { size: 10, color: 'muted', align: 'left' });
          // right: histogram of best p
          const bests = new Float64Array(ND); let nsig = 0;
          for (let d = 0; d < ND; d++) { let m = 1; for (const ix of paths) m = Math.min(m, P[d * NP + ix]); bests[d] = m; if (m < 0.05) nsig++; }
          const NBn = 20, cnt = new Array(NBn).fill(0); for (const x of bests) cnt[Math.min(NBn - 1, Math.floor(x * NBn))]++;
          const top = Math.max(1.5, ...cnt.map((c) => (c * NBn) / ND)) * 1.1;
          sR.setView([0, 1], [0, top]);
          cnt.forEach((c, b) => sR.rect(b / NBn + 0.004, 0, (b + 1) / NBn - 0.004, (c * NBn) / ND, { fill: b === 0 ? TC.alpha : TC.h0, fillAlpha: b === 0 ? 0.6 : 0.35, color: b === 0 ? TC.alpha : TC.h0, width: 1 }));
          sR.hline(1, { color: 'muted', width: 1.4, dash: [5, 4] });
          sR.text('uniform (a single pre-chosen path)', 0.98, 1, { color: 'muted', size: 11, align: 'right', dy: -9 });
          leg([[TC.alpha, 'p < 0.05', { area: true }], [TC.h0, 'p-value of a path', { area: true }]]);
          st = { K, O, S, Ru, rho, best, nsig, ds };
        });
        v.readout(() => {
          if (!st) return '';
          const { K, rho, best, nsig, ds: d } = st;
          const ind = 1 - 0.95 ** K;
          return String.raw`**${K}** allowed path${K === 1 ? '' : 's'} · this data set (#${d + 1}): best p = ${v.fix(best, 3)}${best < 0.05 ? ' → the analyst reports a "significant" effect in pure noise' : ' → nothing to report'} · over 1,000 data sets the best path is significant in **${pct(nsig / 1000, 1)}** ($\pm$${pct(2 * mcse(nsig / 1000, 1000), 1)}) · if the paths were independent: $1-0.95^{${K}}=${pct(ind, 1)}$` + (rho > 0 ? ` (correlation ${v.fix(rho, 2)} among outcomes gives less)` : '') + ' · the data have no effect at all';
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.6
    {
      num: '7.6',
      kind: 'Phenomenon',
      name: 'Winner’s curse',
      statement: String.raw`Let a study estimate an effect $\theta$ by $\hat\theta\sim N(\theta,s^2)$ and be reported only if $|\hat\theta|>c\,s$ (statistical significance, $c=1.96$ for $\alpha=0.05$). Then the reported estimates are biased away from zero: with $z=\theta/s$ and $\theta>0$,
$$\frac{E\big[\,|\hat\theta|\;\big|\;|\hat\theta|>cs\,\big]}{\theta}=\frac{\varphi(c-z)+z\,Q(c-z)+\varphi(c+z)-z\,Q(c+z)}{z\,\big(Q(c-z)+Q(c+z)\big)},$$
where $\varphi$ is the standard normal density and $Q$ its upper tail. This exaggeration ratio exceeds 1 for every $z$, tends to 1 as $z\to\infty$ (high power), and grows without bound, of order $c/z$, as $z\to0$ and the power falls toward $\alpha$; and with low power a sizeable share of the significant estimates even has the wrong sign. The estimator is unbiased before selection; the bias is created by conditioning on significance.`,
      idea: String.raw`Selecting the estimates that crossed the threshold selects those whose noise happened to push them upward (in absolute value): conditionally on $|\hat\theta|>cs$, the noise is not centred. The effect is the truncated-normal bias: when the true effect is far below the threshold only the lucky draws pass, and they must be at least $cs$ large however small $\theta$ is. Ioannidis (2008) described this inflation of discovered true associations in genetic and epidemiological studies; Gelman and Carlin (2014) called the sign and magnitude errors of significant estimates Type S and Type M.`,
      caption: String.raw`Left: 1,500 true effects $\theta\sim N(0,1)$ (horizontal) each estimated with standard error $s$ (vertical = estimate). Significant ones (orange) are the ones that would be published; the faint ones are filed away. The diagonal is perfect estimation; the orange cloud sits outside it. Raise $s$ (less power) and watch the exaggeration grow. Right: for a single true effect of $z=\theta/s$ standard errors (drag the gold handle), the exact exaggeration ratio (red curve) against 2,000 simulated studies (gold dot).`,
      deps: ['stat-7.2'],
      refs: ['Wasserman §10.7'],
      tags: ['winner’s curse', 'selection bias', 'exaggeration'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Winner%27s_curse' },
      credit: 'J. P. A. Ioannidis, 2008; A. Gelman & J. Carlin, 2014',
      scope: String.raw`Normal estimates with known standard error and a hard significance filter; real publication filters are softer, and the size of the exaggeration depends on the distribution of true effects, which the left panel takes to be $N(0,1)$.`,
      viz(v) {
        const sS = v.slider('standard error $s$ (true effects have SD 1)', 0.2, 3, 1, { step: 0.05 });
        const cS = v.slider('significance cutoff $c$', 1, 3.5, 1.96, { step: 0.01 });
        const N = 1500;
        const sL = v.stage({ x: [-4, 4], y: [-6, 6], axes: 'box', gutter: true, height: 340, weight: 1.05, equal: false, xlabel: 'true effect $\\theta$', ylabel: 'estimate $\\hat\\theta$', title: 'estimates against truth: the significant ones are inflated' });
        const sR = v.stage({ x: [0.1, 5], y: [1, 40], ylog: true, axes: 'box', gutter: true, height: 340, weight: 0.95, minWidth: 250, xlabel: 'true effect in standard errors $z=\\theta/s$', ylabel: 'exaggeration ratio', title: 'E[|estimate| | significant] ÷ true effect' });
        const hZ = sR.handle(1.0, 3, { color: TC.sim, label: '$z$', labelPos: 'ne', constrain: (x) => [clamp(x, 0.12, 4.9), 3] });
        const mc = memo(), m2 = memo();
        const base = () => mc('b', () => { const r = v.rng(hashStr('t7.6')), th = [], e = []; for (let i = 0; i < N; i++) { th.push(r.normal()); e.push(r.normal()); } return { th, e }; });
        const ratio = (z, c) => { const num = phi(c - z) + z * Q(c - z) + phi(c + z) - z * Q(c + z), den = z * (Q(c - z) + Q(c + z)); return den > 0 ? num / den : Infinity; };
        const sim1 = (z, c) => m2(z.toFixed(3) + '|' + c, () => { const r = v.rng(hashStr(`t7.6s|${z.toFixed(3)}|${c}`)); let s = 0, k = 0; for (let i = 0; i < 4000; i++) { const x = z + r.normal(); if (Math.abs(x) > c) { s += Math.abs(x); k++; } } return k ? s / k / z : NaN; });
        const leg = legender(v);
        let st = null;
        v.render(() => {
          const s = sS.value, c = cS.value, B = base(), z = hZ.x;
          const sel = [], rest = []; let sa = 0, sb = 0, ns = 0, wrong = 0, ma = 0;
          for (let i = 0; i < N; i++) {
            const th = B.th[i], est = th + s * B.e[i];
            ma += Math.abs(th);
            if (Math.abs(est) > c * s) { sel.push([th, est]); sa += Math.abs(est); sb += Math.abs(th); ns++; if (Math.sign(est) !== Math.sign(th)) wrong++; } else rest.push([th, est]);
          }
          sL.dots(rest, { r: 2, color: 'muted', alpha: 0.35 }); sL.dots(sel, { r: 3, color: TC.beta, alpha: 0.85 });
          sL.line(-4, -4, 4, 4, { color: 'ink', width: 1.4, dash: [5, 4] });
          sL.text('estimate = truth', 3.9, -5.2, { color: 'ink', size: 11, align: 'right', plate: true });
          // right: exact curve
          const cur = []; for (let i = 0; i <= 200; i++) { const zz = 0.1 + (4.9 * i) / 200; cur.push([zz, Math.min(40, ratio(zz, c))]); }
          sR.hline(1, { color: 'green', width: 1.2, dash: [5, 4] });
          sR.path(cur, { color: TC.alpha, width: 2.6 });
          const ex = ratio(z, c), sm = sim1(z, c);
          sR.dot(z, Math.max(1, Math.min(40, ex)), { r: 6, color: TC.alpha }); if (sm >= 1 && sm <= 40) sR.dot(z, sm, { r: 4, color: TC.sim });
          hZ.set(z, Math.max(1.02, Math.min(39, ex)) * 1.0);
          leg([[TC.beta, 'significant (reported)', { dot: true }], ['muted', 'not significant', { dot: true }], [TC.alpha, 'exact exaggeration ratio'], [TC.sim, 'simulated', { dot: true }]]);
          st = { s, c, ns, ratioSel: ns ? sa / sb : NaN, wrong: ns ? wrong / ns : NaN, z, ex, sm, pw: Q(c - z) + Q(c + z), allRatio: 1 };
        });
        v.readout(() => {
          if (!st) return '';
          const { s, c, ns, ratioSel, wrong, z, ex, sm, pw } = st;
          return String.raw`left: ${commas(ns)} of 1,500 are significant (standard error $s=${v.fix(s, 2)}$); among them $\overline{|\hat\theta|}/\overline{|\theta|}=\mathbf{${v.fix(ratioSel, 2)}}$ and ${pct(wrong, 1)} have the wrong sign · right: at $z=${v.fix(z, 2)}$ (power ${pct(pw, 0)}) the exact ratio is **${v.fix(ex, 2)}**, simulated ${v.fix(sm, 2)}` + (pw < 0.3 ? ' · low power: the published estimate is several times the truth' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.7
    {
      num: '7.7',
      kind: 'Definition',
      name: 'Family-wise error rate',
      statement: String.raw`When $m$ null hypotheses $H_{0,1},\dots,H_{0,m}$ are tested, let $V$ be the number of true nulls that are rejected. The **family-wise error rate** (FWER) of a multiple-testing procedure is the probability of at least one false rejection,
$$\mathrm{FWER}=P(V\ge1).$$
A procedure controls the FWER **weakly** at level $\alpha$ if $\mathrm{FWER}\le\alpha$ when all $m$ nulls are true, and **strongly** if $\mathrm{FWER}\le\alpha$ for every configuration of true and false nulls. If each of $m$ independent true nulls is tested at level $\alpha$ with no correction, then $\mathrm{FWER}=1-(1-\alpha)^m$, which is about $0.40$ for $m=10$, $0.92$ for $m=50$ and $0.994$ for $m=100$ at $\alpha=0.05$; without independence $\mathrm{FWER}\le m\alpha$ (the union bound).`,
      idea: String.raw`"At least one" is the complement of "none": the chance that all $m$ independent true nulls are retained is $(1-\alpha)^m$, and this shrinks geometrically. Each test is calibrated individually (stat-7.2, stat-6.2) yet the family is not; the union bound $P(\bigcup A_i)\le\sum P(A_i)$ gives $\mathrm{FWER}\le m\alpha$ with no assumption on dependence, which is the whole content of the Bonferroni correction (stat-7.8).`,
      caption: String.raw`Left: FWER against the number of tests $m$ (log axis) for uncorrected level-$\alpha$ tests of true nulls. The red curve is $1-(1-\alpha)^m$; the dashed line is the union bound $m\alpha$; gold dots are simulated rates from 3,000 repetitions. Drag the handle to read a value of $m$. Right: 30 simulated screens of $m$ tests, one row each, every dot a p-value; a row turns red if any dot falls left of the line $\alpha$. The red share of rows is the FWER.`,
      deps: ['stat-6.2'],
      refs: ['Wasserman §10.7'],
      tags: ['family-wise error rate', 'multiple testing', 'union bound'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Family-wise_error_rate' },
      viz(v) {
        const aS = v.select('level $\\alpha$ of each test', [{ value: 0.05, label: '0.05' }, { value: 0.01, label: '0.01' }, { value: 0.1, label: '0.10' }], 0.05);
        const nxt = v.button('New screens', () => { seed++; });
        let seed = 1;
        const MS = [1, 2, 3, 5, 10, 20, 50, 100, 200, 500, 1000], REP = 3000, ROWS = 30;
        const sL = v.stage({ x: [1, 1000], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1.05, xlabel: 'number of tests $m$', ylabel: 'P(at least one false rejection)', title: 'family-wise error rate of uncorrected tests' });
        const sR = v.stage({ x: [0, 1], y: [0, ROWS + 1], axes: 'box', gutter: true, height: 340, weight: 0.95, minWidth: 250, xlabel: 'p-value (all nulls true)', yticks: [], title: '30 simulated screens' });
        const hM = sL.handle(20, 0.5, { color: TC.sim, label: '$m$', labelPos: 'se', constrain: (x) => [clamp(Math.round(x), 1, 1000), 0.5] });
        const mc = memo(), m2 = memo();
        const sim = (a) => mc('s' + a, () => { const r = v.rng(hashStr('t7.7|' + a)); return MS.map((m) => { let k = 0; for (let t = 0; t < REP; t++) { for (let i = 0; i < m; i++) if (r() < a) { k++; break; } } return k / REP; }); });
        const sim1 = (a, m) => m2(a + '|' + m, () => { const r = v.rng(hashStr(`t7.7b|${a}|${m}`)); let k = 0; for (let t = 0; t < REP; t++) { for (let i = 0; i < m; i++) if (r() < a) { k++; break; } } return k / REP; });
        const leg = legender(v);
        let st = null;
        v.render(() => {
          const a = +aS.value, m = hM.x, SM = sim(a);
          const f = (x) => 1 - (1 - a) ** x;
          sL.hline(a, { color: 'green', width: 1.2, dash: [5, 4] });
          sL.text(`α = ${a}`, 1000, a, { color: 'green', size: 11, align: 'right', dy: -9 });
          sL.fn((x) => Math.min(1, a * x), { domain: [1, 1000], color: 'muted', width: 1.6, dash: [5, 4], n: 300 });
          sL.fn(f, { domain: [1, 1000], color: TC.alpha, width: 2.8, n: 300 });
          MS.forEach((mm, i) => sL.dot(mm, SM[i], { r: 4.5, color: TC.sim }));
          const sm = sim1(a, m);
          sL.vline(m, { color: TC.sim, width: 1.2, dash: [3, 3] }); sL.dot(m, f(m), { r: 5.5, color: TC.alpha });
          hM.set(m, 0.5);
          tag(sL, `m = ${m}: ${pct(f(m), 1)}`, m, f(m), { color: TC.alpha, align: m > 60 ? 'right' : 'left', dx: m > 60 ? -9 : 9, dy: 14, weight: 700 });
          // right: screens
          const r = v.rng(hashStr(`t7.7r|${seed}|${a}|${m}`)), jit = mulberry(9); let anyRows = 0;
          const mm = Math.min(m, 300);
          sR.vband(0, a, { color: TC.alpha, alpha: 0.12 });
          for (let row = 0; row < ROWS; row++) {
            const y = ROWS - row, ok = [], bad = []; let any = false;
            for (let i = 0; i < mm; i++) { const u = r(); (u < a ? bad : ok).push([u, y + (jit() - 0.5) * 0.5]); if (u < a) any = true; }
            if (m > mm) { const left = m - mm; for (let i = 0; i < left && !any; i++) if (r() < a) { any = true; bad.push([r() * a, y]); } }
            if (any) { anyRows++; sR.hband(y - 0.5, y + 0.5, { color: TC.alpha, alpha: 0.12 }); }
            sR.dots(ok, { r: 1.5, color: 'muted', alpha: 0.5 }); sR.dots(bad, { r: 2.5, color: TC.alpha });
          }
          sR.vline(a, { color: TC.alpha, width: 1.4, dash: [4, 4] });
          leg([[TC.alpha, '$1-(1-\\alpha)^m$'], ['muted', 'union bound $m\\alpha$', { dash: true }], [TC.sim, 'simulated', { dot: true }]]);
          st = { a, m, ex: f(m), sm, anyRows, ub: Math.min(1, a * m), m50: Math.ceil(Math.log(0.5) / Math.log(1 - a)) };
        });
        v.readout(() => {
          if (!st) return '';
          const { a, m, ex, sm, anyRows, ub, m50 } = st;
          return String.raw`$m=${m}$ true nulls, each tested at $\alpha=${a}$ · exact FWER $1-(1-\alpha)^m=${v.fix(ex, 4)}$ · simulated ${v.fix(sm, 3)} $\pm$ ${v.fix(2 * mcse(ex, 3000), 3)} · union bound $m\alpha=${v.fix(ub, 3)}$ · the 30 screens on the right: ${anyRows} contain a false rejection (${pct(anyRows / 30, 0)}) · more than 50% chance of a false alarm once $m\ge${m50}$`;
        });
      },
    },
  ],
};
