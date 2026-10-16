// Statistical Inference — Chapter 6: Hypothesis testing (items 6.1–6.10; 6.11–6.21 in ch06-b.js)
//
// A test is a region of the sample space, so every picture here draws one: shaded tails under a null density, a
// painted set of cells in the plane, a half-plane that does not move when the alternative does. Each claim is
// checked twice, by an exact area or sum and by simulated datasets (gold), and each item has a setting that leaves
// the theorem's hypotheses: a discrete statistic, a Cauchy likelihood ratio, a parameter on the boundary.
import {
  phi, clamp, commas, pct, hashStr, memo, mean, sortNum, binned, legender, titler, strip, mulberry, lfact,
  Phi, qnorm, dchisq1, lchoose, dbinom, rpois, rcauchy, rlaplace,
  TC, Q, chiUp, chiCdf, dchi, qchi, binUp, area, tag, mcse, pfmt,
} from './ch06.shared.js';

/** Upper-tail quantile of N(0, 1). */
const zq = (a) => qnorm(1 - a);

export default {
  collection: 'stat',
  chapter: 6,
  title: 'Hypothesis testing',
  summary: String.raw`A test is a rule for rejecting a null hypothesis: a region of the sample space, judged by its two error probabilities and summarized by its power function. The Neyman–Pearson lemma shows that thresholding the likelihood ratio is the best use of a fixed type I error for simple hypotheses; monotone likelihood ratios extend this to one-sided composite alternatives (Karlin–Rubin), while against two-sided alternatives no test is uniformly best and one settles for the best unbiased test. For general problems we use the likelihood-ratio, Wald and score tests, tied together by Wilks’ chi-squared limit, and the classical $t$, chi-squared and exact tests, each checked here by simulation against its nominal size, and each shown failing when its assumptions do.`,
  items: [
    // ───────────────────────────────────────────────────────────── 6.1
    {
      num: '6.1',
      kind: 'Definition',
      name: 'Hypotheses, test statistic and rejection region',
      statement: String.raw`In a statistical model $\{P_\theta:\theta\in\Theta\}$ a **hypothesis** is a statement $\theta\in\Theta_0$ about the parameter. A testing problem pits a **null hypothesis** $H_0:\theta\in\Theta_0$ against an **alternative** $H_1:\theta\in\Theta_1$, with $\Theta_0\cap\Theta_1=\varnothing$; a hypothesis is **simple** if its set is a single point and **composite** otherwise. A **test** is a rule that, for each possible data set $x$, decides whether to reject $H_0$. It is specified by a **rejection region** (critical region) $R$ in the sample space: reject $H_0$ if $x\in R$, otherwise retain it. Usually $R=\{x: T(x)\ge c\}$ (or $\le c$, or $|T(x)|\ge c$) for a **test statistic** $T$ and a **critical value** $c$. A randomized test is a function $\phi(x)\in[0,1]$ giving the probability of rejection.

Example: for $X_1,\dots,X_n$ i.i.d. $N(\mu,1)$ and $H_0:\mu=0$, the statistic $Z=\sqrt n\,\bar X$ has a known $N(0,1)$ law under $H_0$, and $R=\{Z\ge1.645\}$ (against $\mu>0$), $\{Z\le-1.645\}$ (against $\mu<0$) or $\{|Z|\ge1.96\}$ (against $\mu\ne0$) each reject a true null 5% of the time. "Retain" is not "accept": a test controls the chance of a false rejection, not the chance that $H_0$ is true.`,
      idea: String.raw`The asymmetry is deliberate. The null is the hypothesis we would embarrass ourselves by rejecting wrongly, so the test is calibrated by the null distribution of the statistic: we need to know how $T$ behaves when $H_0$ is true, and a statistic is useful when that law is known (a **pivot** under $H_0$) and the alternative pushes $T$ toward the rejection region. The shape of the region comes from the alternative: large $Z$ is evidence for $\mu>0$, small $Z$ for $\mu<0$. Everything else in the chapter is about choosing $T$ and $R$ well.`,
      caption: String.raw`Left: a seeded data set of $n=16$ draws from $N(\mu,1)$; drag the blue handle to slide the whole sample (its mean $\bar x$) left or right; the red band marks the sample means that lead to rejection. Right: the null density of $Z=\sqrt n\,\bar X$ with the rejection region shaded; drag the red cutoff. The gold line is the observed $z$: the decision flips exactly when the cutoff passes it. Switch the alternative to see the region change shape.`,
      deps: ['stat-1.1'],
      refs: ['Casella–Berger §8.1', 'Wasserman §6.3'],
      tags: ['hypothesis test', 'rejection region', 'test statistic'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Statistical_hypothesis_testing' },
      viz(v) {
        const n = 16, sq = Math.sqrt(n);
        let seed = 1;
        const altS = v.select('alternative $H_1$', [{ value: 'gt', label: '$\\mu>0$' }, { value: 'lt', label: '$\\mu<0$' }, { value: 'ne', label: '$\\mu\\ne0$' }], 'gt', { onChange: (k) => { hC.set(k === 'lt' ? -1.645 : k === 'ne' ? 1.96 : 1.645, hy); } });
        v.button('New data set', () => { seed++; });
        const sL = v.stage({ x: [-2.6, 2.6], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 0.95, minWidth: 250, xlabel: '$x$', yticks: [], title: 'the data: 16 draws and their mean $\\bar x$' });
        const sR = v.stage({ x: [-4.2, 4.2], y: [0, 0.46], axes: 'box', gutter: true, height: 320, weight: 1.05, xlabel: '$z=\\sqrt n\\,\\bar x$', ylabel: 'null density', title: 'null distribution of $Z$ and the rejection region' });
        const hy = 0.03;
        const hM = sL.handle(0.35, 0.1, { color: TC.h0, label: '$\\bar x$', labelPos: 'n', constrain: (x) => [clamp(x, -1.6, 1.6), 0.1] });
        const hC = sR.handle(1.645, hy, { color: TC.alpha, label: '$c$', labelPos: 'ne', constrain: (x) => [clamp(x, -3.8, 3.8), hy] });
        const mc = memo();
        const base = () => mc(seed, () => { const r = v.rng(hashStr('t6.1|' + seed)), e = Array.from({ length: n }, () => r.normal()), m = mean(e); return { e: e.map((x) => x - m), jit: e.map(() => 0.28 + 0.55 * r()) }; });
        let st = null;
        v.render(() => {
          const alt = altS.value, B = base(), xb = hM.x, z = sq * xb;
          let c = hC.x;
          if (alt === 'ne') c = Math.abs(c);
          const inR = (u) => (alt === 'gt' ? u >= c : alt === 'lt' ? u <= c : Math.abs(u) >= c);
          const reject = inR(z);
          const size = alt === 'gt' ? Q(c) : alt === 'lt' ? Phi(c) : 2 * Q(c);
          // left: the data and the rejection set in units of x̄
          const xc = c / sq;
          if (alt === 'gt') sL.vband(xc, 2.6, { color: TC.alpha, alpha: 0.1 });
          else if (alt === 'lt') sL.vband(-2.6, xc, { color: TC.alpha, alpha: 0.1 });
          else { sL.vband(xc, 2.6, { color: TC.alpha, alpha: 0.1 }); sL.vband(-2.6, -xc, { color: TC.alpha, alpha: 0.1 }); }
          sL.vline(0, { color: 'muted', width: 1.2, dash: [4, 4] });
          sL.text('$\\mu_0=0$', 0, 0.95, { color: 'muted', size: 12, dx: 4, align: 'left' });
          sL.dots(B.e.map((e, i) => [xb + e, B.jit[i]]), { r: 4, color: TC.sim, alpha: 0.85 });
          sL.vline(xb, { color: TC.h0, width: 2.4 });
          sL.text(reject ? '$\\bar x$ is in the red band: reject' : '$\\bar x$ is outside the band: retain', 0, 0.2, { color: reject ? TC.alpha : 'green', size: 12, weight: 700, plate: true });
          // right: null density, region, observed z
          const f = phi, L = -4.2, U = 4.2;
          if (alt === 'gt') area(sR, f, c, U, TC.alpha);
          else if (alt === 'lt') area(sR, f, L, c, TC.alpha);
          else { area(sR, f, c, U, TC.alpha); area(sR, f, L, -c, TC.alpha); }
          sR.fn(f, { domain: [L, U], color: TC.h0, width: 2.6, n: 300 });
          sR.vline(c, { color: TC.alpha, width: 1.6, dash: [5, 4] });
          if (alt === 'ne') sR.vline(-c, { color: TC.alpha, width: 1.6, dash: [5, 4] });
          const zc = clamp(z, L, U);
          sR.vline(zc, { color: TC.sim, width: 2.6 });
          sR.text(`observed z = ${v.fix(z, 2)}`, zc, 0.43, { color: 'ink', size: 11.5, align: zc > 1.5 ? 'right' : 'left', dx: zc > 1.5 ? -6 : 6, plate: true, weight: 600 });
          sR.text(`size ${v.fix(size, 3)}`, alt === 'lt' ? -3.9 : 3.9, 0.12, { color: TC.alpha, size: 11.5, align: alt === 'lt' ? 'left' : 'right', plate: true, weight: 700 });
          sR.corner(reject ? 'decision: reject H₀' : 'decision: retain H₀', 'tl', { color: reject ? TC.alpha : 'green', weight: 700 });
          v.legend([[TC.sim, 'observations', { dot: true }], [TC.h0, 'null density of $Z$ ($H_0:\\mu=0$)'], [TC.alpha, 'rejection region', { area: true }], [TC.sim, 'observed statistic']]);
          st = { alt, xb, z, c, size, reject };
        });
        v.readout(() => {
          if (!st) return '';
          const { alt, xb, z, c, size, reject } = st;
          const R = alt === 'gt' ? `\\{Z\\ge${v.fix(c, 2)}\\}` : alt === 'lt' ? `\\{Z\\le${v.fix(c, 2)}\\}` : `\\{|Z|\\ge${v.fix(c, 2)}\\}`;
          return String.raw`$\bar x=${v.fix(xb, 3)}$, $z=\sqrt{16}\,\bar x=${v.fix(z, 2)}$ · rejection region $R=${R}$ · size $P_{H_0}(Z\in R)=${v.fix(size, 4)}$ · decision: **${reject ? 'reject $H_0$' : 'retain $H_0$'}**` + (Math.abs(size - 0.05) < 0.002 ? ' · this is the conventional 5% test' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.2
    {
      num: '6.2',
      kind: 'Definition',
      name: 'Type I and type II errors; size and level',
      statement: String.raw`A test with rejection region $R$ can go wrong in two ways:

- a **type I error**: rejecting $H_0$ when it is true, with probability $P_\theta(X\in R)$ for $\theta\in\Theta_0$;
- a **type II error**: retaining $H_0$ when it is false, with probability $P_\theta(X\notin R)$ for $\theta\in\Theta_1$.

The **size** of the test is its largest type I error probability, $\sup_{\theta\in\Theta_0}P_\theta(X\in R)$; the test has **level** $\alpha$ if its size is at most $\alpha$. For simple hypotheses one writes $\alpha=P_0(X\in R)$ and $\beta=P_1(X\notin R)$; $1-\beta$ is the **power**. For a fixed amount of data the two errors trade off: shrinking $R$ lowers $\alpha$ and raises $\beta$. With a discrete statistic only finitely many sizes are possible, so a level-$\alpha$ test usually has size strictly below $\alpha$ (unless one randomizes on the boundary).`,
      idea: String.raw`Both error probabilities are areas under the sampling distribution of the statistic: $\alpha$ the part of the null distribution inside $R$, $\beta$ the part of the alternative distribution outside it. Moving the cutoff transfers area between the two, so one cannot minimize both; the Neyman–Pearson convention fixes $\alpha$ and makes $\beta$ as small as possible (stat-6.4). Only more information, a larger sample or a bigger effect, separates the two densities and lowers both errors at once.`,
      caption: String.raw`Left: the null (blue) and alternative (purple) sampling distributions of the statistic with the cutoff $c$ (drag it): type I error $\alpha$ in red, type II error $\beta$ in orange. Raise the effect to pull the densities apart. Right: 1,000 simulated decisions, 500 data sets from $H_0$ (top row) and 500 from $H_1$ (bottom row), each a dot at its statistic; red dots are false rejections, orange dots missed effects, and their counts match $\alpha$ and $\beta$. Switch to the **discrete** binomial statistic: the attainable sizes jump in steps, and the best cutoff at level 5% has size well below 5%.`,
      deps: ['stat-6.1'],
      refs: ['Casella–Berger §8.3'],
      tags: ['type I error', 'type II error', 'size'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Type_I_and_type_II_errors' },
      viz(v) {
        const NB = 20, p0 = 0.5;
        const modeS = v.select('statistic', [{ value: 'z', label: 'continuous: $Z\\sim N(\\delta,1)$' }, { value: 'bin', label: 'discrete: $X\\sim\\mathrm{Bin}(20,p)$' }], 'z', { onChange: (k) => { hC.set(k === 'z' ? 1.645 : 14.5, hy()); } });
        const dS = v.slider('effect $\\delta$ (alternative mean)', 0, 4, 2.5, { step: 0.05 });
        const pS = v.slider('alternative $p_1$', 0.5, 0.95, 0.75, { step: 0.01 });
        const lvS = v.slider('level $\\alpha$', 0.01, 0.2, 0.05, { step: 0.005, onChange: () => { if (modeS.value === 'bin') hC.set(kLevel() - 0.5, hy()); } });
        const sL = v.stage({ x: [-3.5, 6.5], y: [0, 0.46], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'statistic', ylabel: 'density', title: 'two sampling distributions and one cutoff' });
        const sR = v.stage({ x: [-3.5, 6.5], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 0.9, minWidth: 250, xlabel: 'statistic', yticks: [[0.75, '$H_0$ true'], [0.25, '$H_1$ true']], title: '1,000 simulated decisions' });
        const tL = titler(sL), leg = legender(v);
        const hy = () => (modeS.value === 'z' ? 0.02 : 0.012);
        const hC = sL.handle(1.645, 0.02, { color: TC.alpha, label: '$c$', labelPos: 'ne', constrain: (x) => (modeS.value === 'z' ? [clamp(x, -3, 6), 0.02] : [clamp(Math.round(x - 0.5) + 0.5, 0.5, 20.5), 0.012]) });
        // smallest k with P0(X ≥ k) ≤ level
        const kLevel = () => { for (let k = 0; k <= NB + 1; k++) if (binUp(k, NB, p0) <= lvS.value + 1e-12) return k; return NB + 1; };
        const mc = memo();
        const sims = (mode, eff) => mc(mode + '|' + eff, () => {
          const r = v.rng(hashStr(`t6.2|${mode}|${eff}`)), a = [], b = [];
          for (let i = 0; i < 500; i++) {
            if (mode === 'z') { a.push(r.normal()); b.push(eff + r.normal()); }
            else { let x = 0, y = 0; for (let j = 0; j < NB; j++) { if (r() < p0) x++; if (r() < eff) y++; } a.push(x); b.push(y); }
          }
          return { a, b };
        });
        let st = null;
        v.render(() => {
          const z = modeS.value === 'z';
          dS.el.hidden = !z; pS.el.hidden = z; lvS.el.hidden = z;
          let al, be, c, fp, fn;
          const S = sims(modeS.value, z ? dS.value : pS.value);
          if (z) {
            const d = dS.value; c = hC.x;
            sL.setView([-3.5, 6.5], [0, 0.46]); sR.setView([-3.5, 6.5], [0, 1]); tL('two sampling distributions and one cutoff');
            area(sL, phi, c, 6.5, TC.alpha, 0.4);
            area(sL, (x) => phi(x - d), -3.5, c, TC.beta, 0.4);
            sL.fn(phi, { domain: [-3.5, 6.5], color: TC.h0, width: 2.6, n: 300 });
            sL.fn((x) => phi(x - d), { domain: [-3.5, 6.5], color: TC.h1, width: 2.6, n: 300 });
            sL.vline(c, { color: TC.alpha, width: 1.6, dash: [5, 4] });
            al = Q(c); be = Phi(c - d);
            tag(sL, `α = ${v.fix(al, 3)}`, c + 0.25, 0.3, { color: TC.alpha, align: 'left' });
            tag(sL, `β = ${v.fix(be, 3)}`, c - 0.25, 0.38, { color: TC.beta, align: 'right' });
            sL.text('$H_0$', 0, 0.41, { color: TC.h0, size: 14, dy: -4 }); sL.text('$H_1$', d, 0.41, { color: TC.h1, size: 14, dy: -4, dx: d < 0.6 ? 18 : 0 });
            fp = S.a.filter((x) => x >= c).length; fn = S.b.filter((x) => x < c).length;
            sR.setTicks(null, [[0.75, '$H_0$ true'], [0.25, '$H_1$ true']]);
          } else {
            const p1 = pS.value, k = Math.round(hC.x + 0.5); c = k;
            sL.setView([-0.5, 20.5], [0, 0.3]); sR.setView([-0.5, 20.5], [0, 1]); tL('null Bin(20, 0.5) and alternative Bin(20, $p_1$)');
            for (let x = 0; x <= NB; x++) {
              const a = dbinom(x, NB, p0), b = dbinom(x, NB, p1);
              sL.rect(x - 0.42, 0, x, a, { fill: x >= k ? TC.alpha : TC.h0, fillAlpha: x >= k ? 0.75 : 0.35, color: TC.h0, width: 1 });
              sL.rect(x, 0, x + 0.42, b, { fill: x < k ? TC.beta : TC.h1, fillAlpha: x < k ? 0.75 : 0.35, color: TC.h1, width: 1 });
            }
            sL.vline(k - 0.5, { color: TC.alpha, width: 1.6, dash: [5, 4] });
            al = binUp(k, NB, p0); be = 1 - binUp(k, NB, p1);
            tag(sL, `reject if X ≥ ${k}: size ${v.fix(al, 4)}`, k - 0.3, 0.27, { color: TC.alpha, align: k > 12 ? 'right' : 'left', dx: k > 12 ? -6 : 10 });
            fp = S.a.filter((x) => x >= k).length; fn = S.b.filter((x) => x < k).length;
          }
          // right: dartboard rows
          const jit = mulberry(5), row = (vals, y, isNull) => {
            const ok = [], bad = [];
            for (const x of vals) { const px = z ? x : x + (jit() - 0.5) * 0.5, py = y + (jit() * 2 - 1) * 0.17; const wrong = isNull ? (z ? x >= c : x >= c) : (z ? x < c : x < c); (wrong ? bad : ok).push([px, py]); }
            sR.dots(ok, { r: 2, color: 'muted', alpha: 0.45 }); sR.dots(bad, { r: 2.6, color: isNull ? TC.alpha : TC.beta, alpha: 0.9 });
          };
          const cl = z ? c : c - 0.5;
          sR.vband(cl, z ? 6.5 : 20.5, { color: TC.alpha, alpha: 0.07 });
          sR.hline(0.5, { color: 'faint', width: 1 });
          row(S.a, 0.75, true); row(S.b, 0.25, false);
          sR.vline(cl, { color: TC.alpha, width: 1.6, dash: [5, 4] });
          tag(sR, `${fp} false rejections`, z ? 6.3 : 20.2, 0.96, { color: TC.alpha, align: 'right', size: 11 });
          tag(sR, `${fn} misses`, z ? -3.3 : -0.3, 0.46, { color: TC.beta, align: 'left', size: 11 });
          leg([[TC.h0, 'null'], [TC.h1, 'alternative'], [TC.alpha, 'type I error α', { area: true }], [TC.beta, 'type II error β', { area: true }]]);
          st = { z, al, be, fp, fn, c, k: z ? null : c, kL: z ? null : kLevel() };
        });
        v.readout(() => {
          if (!st) return '';
          const { z, al, be, fp, fn, k, kL } = st;
          let s = String.raw`exact: $\alpha=${v.fix(al, 4)}$, $\beta=${v.fix(be, 4)}$, power $1-\beta=${v.fix(1 - be, 4)}$ · simulated: ${fp}/500 false rejections ($${v.fix(fp / 500, 3)}\pm${v.fix(2 * mcse(al, 500), 3)}$), ${fn}/500 misses ($${v.fix(fn / 500, 3)}\pm${v.fix(2 * mcse(be, 500), 3)}$)`;
          if (!z) {
            const sz = binUp(kL, NB, p0);
            s += String.raw` · at level $\alpha=${v.fix(lvS.value, 3)}$ the best cutoff is $X\ge${kL}$ with **size ${v.fix(sz, 4)}** $<\alpha$ (the next cutoff, $X\ge${kL - 1}$, has size ${v.fix(binUp(kL - 1, NB, p0), 4)}): a discrete test cannot use its full level without randomizing`;
            if (k < kL) s += ' · **your cutoff exceeds the level**';
          }
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.3
    {
      num: '6.3',
      kind: 'Definition',
      name: 'Power function',
      statement: String.raw`The **power function** of a test with rejection region $R$ is
$$\beta(\theta)=P_\theta(X\in R),\qquad\theta\in\Theta,$$
the probability of rejecting $H_0$ as a function of the true parameter. On $\Theta_0$ it is the type I error probability, so the size is $\sup_{\Theta_0}\beta$; on $\Theta_1$ it is the power, one minus the type II error probability. An ideal test would have $\beta=0$ on $\Theta_0$ and $\beta=1$ on $\Theta_1$. For the one-sided $z$-test of $H_0:\theta\le\theta_0$ against $H_1:\theta>\theta_0$ with $X_i$ i.i.d. $N(\theta,\sigma^2)$, rejecting when $\sqrt n(\bar X-\theta_0)/\sigma>z_\alpha$,
$$\beta(\theta)=1-\Phi\!\Big(z_\alpha-\frac{\sqrt n\,(\theta-\theta_0)}{\sigma}\Big),$$
increasing in $\theta$, equal to $\alpha$ at $\theta_0$, and steeper as $n$ grows.`,
      idea: String.raw`The whole performance of a test is one curve. The formula follows because $\sqrt n(\bar X-\theta_0)/\sigma\sim N(\sqrt n(\theta-\theta_0)/\sigma,1)$: the alternative only shifts the statistic, so power is a normal tail with a moving threshold. The scale of the effect that matters is $\sqrt n(\theta-\theta_0)/\sigma$, so quadrupling $n$ halves the effect needed for the same power. Power functions are how tests are compared: one test is better than another at $\theta$ if its curve is higher there with the same size.`,
      caption: String.raw`The exact power curve of the one-sided $z$-test (blue) against $\theta$, with $\theta_0=0$, $\sigma=1$; faint curves show $n/4$ and $4n$. Gold dots are rejection rates in 1,000 simulated samples at each $\theta$ (bars ±2 Monte Carlo SE). Drag the gold handle to read the power at any $\theta$. Raise $n$: the curve steepens but still passes through $(\theta_0,\alpha)$. Turn on the **sign test** (orange), which only counts positive observations: same size, lower power everywhere on the alternative.`,
      deps: ['stat-6.2'],
      refs: ['Casella–Berger §8.3'],
      tags: ['power', 'z-test', 'sample size'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Power_(statistics)' },
      viz(v) {
        const nS = v.slider('sample size $n$', 1, 100, 16, { int: true, log: true });
        const aS = v.select('$\\alpha$', [{ value: 0.01, label: '0.01' }, { value: 0.05, label: '0.05' }, { value: 0.1, label: '0.10' }], 0.05);
        const sgn = v.toggle('compare with the sign test', false);
        const s = v.stage({ x: [-0.5, 1.5], y: [0, 1], axes: 'box', gutter: true, height: 360, xlabel: '$\\theta$', ylabel: '$\\beta(\\theta)=P_\\theta(\\text{reject})$', title: 'power function of the one-sided $z$-test of $H_0:\\theta\\le0$' });
        const hT = s.handle(0.5, 0.04, { color: TC.sim, label: '$\\theta$', labelPos: 'ne', constrain: (x) => [clamp(x, -0.48, 1.48), 0.04] });
        const TH = [-0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4], R = 1000;
        const pw = (t, n, a) => Q(zq(a) - Math.sqrt(n) * t);
        // sign test: reject when #{X_i > 0} ≥ k with P(Bin(n, 1/2) ≥ k) ≤ α
        const signK = (n, a) => { for (let k = 0; k <= n + 1; k++) if (binUp(k, n, 0.5) <= a + 1e-12) return k; return n + 1; };
        const signPw = (t, n, a) => binUp(signK(n, a), n, Phi(t));
        const mc = memo();
        const sim = (n, a) => mc(n + '|' + a, () => {
          const r = v.rng(hashStr(`t6.3|${n}|${a}`)), c = zq(a);
          return TH.map((t) => { let k = 0; for (let i = 0; i < R; i++) { let sm = 0; for (let j = 0; j < n; j++) sm += t + r.normal(); if (sm / Math.sqrt(n) > c) k++; } return k / R; });
        });
        let st = null;
        v.render(() => {
          const n = nS.value, a = +aS.value, sim0 = sim(n, a), t = hT.x;
          s.hband(0, a, { color: TC.alpha, alpha: 0.1 });
          s.vband(-0.5, 0, { color: TC.h0, alpha: 0.05 });
          s.text('$\\Theta_0$', -0.25, 0.93, { color: TC.h0, size: 14 }); s.text('$\\Theta_1$', 0.75, 0.93, { color: TC.h1, size: 14 });
          if (n >= 4) s.fn((x) => pw(x, n / 4, a), { domain: [-0.5, 1.5], color: TC.h0, width: 1.3, alpha: 0.35, dash: [4, 4] });
          s.fn((x) => pw(x, 4 * n, a), { domain: [-0.5, 1.5], color: TC.h0, width: 1.3, alpha: 0.35, dash: [4, 4] });
          if (sgn.value) s.fn((x) => signPw(x, n, a), { domain: [-0.5, 1.5], color: 'orange', width: 2.4, n: 160 });
          s.fn((x) => pw(x, n, a), { domain: [-0.5, 1.5], color: TC.h0, width: 2.8, n: 300 });
          if (n >= 4) { const x4 = clamp((zq(a) - qnorm(0.5)) / Math.sqrt(n / 4) + 0.02, -0.4, 1.3); s.text(`n/4 = ${v.fix(n / 4, n % 4 ? 1 : 0)}`, Math.min(1.42, x4 + 0.5 / Math.sqrt(n / 4)), pw(Math.min(1.42, x4 + 0.5 / Math.sqrt(n / 4)), n / 4, a), { color: TC.h0, size: 10.5, dx: 4, dy: 10, align: 'left', alpha: 0.7 }); }
          TH.forEach((th, i) => { const p = sim0[i], e = 2 * mcse(p, R); s.line(th, Math.max(0, p - e), th, Math.min(1, p + e), { color: TC.sim, width: 2 }); s.dot(th, p, { r: 3.6, color: TC.sim }); });
          s.dot(0, a, { r: 5, color: TC.alpha, hollow: true, width: 2 });
          tag(s, `β(θ₀) = α = ${a}`, 0.03, a, { color: TC.alpha, align: 'left', dx: 8, dy: -12, size: 11 });
          const pt = pw(t, n, a);
          s.line(t, 0, t, pt, { color: TC.sim, width: 1.2, dash: [3, 3] }); s.line(-0.5, pt, t, pt, { color: TC.sim, width: 1.2, dash: [3, 3] });
          s.dot(t, pt, { r: 5, color: TC.sim });
          tag(s, `power ${v.fix(pt, 3)}`, t, pt, { align: t > 1 ? 'right' : 'left', dx: t > 1 ? -10 : 10, dy: 12, size: 11 });
          v.legend([[TC.h0, `exact power, $n=${n}$`], [TC.h0, '$n/4$ and $4n$', { dash: true }], [TC.sim, 'simulated rejection rate', { dot: true }], ...(sgn.value ? [['orange', 'sign test (same level)']] : [])]);
          const i0 = TH.indexOf(0);
          st = { n, a, t, pt, sim0, i0, sp: sgn.value ? signPw(t, n, a) : null, ss: sgn.value ? binUp(signK(n, a), n, 0.5) : null };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, a, t, pt, sim0, i0, sp, ss } = st;
          const err = Math.max(...TH.map((th, i) => Math.abs(sim0[i] - pw(th, n, a)) / mcse(pw(th, n, a), R)));
          let s0 = String.raw`$n=${n}$, $\alpha=${a}$: $\beta(${v.fix(t, 2)})=1-\Phi(${v.fix(zq(a), 3)}-\sqrt{${n}}\cdot${v.fix(t, 2)})=${v.fix(pt, 4)}$ · at $\theta_0=0$: simulated ${v.fix(sim0[i0], 3)} vs exact ${a} · largest simulation error ${v.fix(err, 1)} Monte Carlo SEs` + (err < 3.5 ? ' ✓' : '');
          const t80 = (zq(a) - qnorm(0.2)) / Math.sqrt(n);
          s0 += String.raw` · 80% power is reached at $\theta=${v.fix(t80, 3)}$ (at $4n$: ${v.fix(t80 / 2, 3)})`;
          if (sp != null) s0 += ` · sign test: size ${v.fix(ss, 4)}, power at θ ${v.fix(sp, 4)} (lower: it throws away the magnitudes)`;
          return s0;
        });
      },
    },
  ],
};
