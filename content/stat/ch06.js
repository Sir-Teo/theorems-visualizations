// Statistical Inference — Chapter 6: Hypothesis testing (items 6.1–6.10; 6.11–6.21 in ch06-b.js)
//
// A test is a region of the sample space, so every picture here draws one: shaded tails under a null density, a
// painted set of cells in the plane, a half-plane that does not move when the alternative does. Each claim is
// checked twice, by an exact area or sum and by simulated datasets (gold), and each item has a setting that leaves
// the theorem's hypotheses: a discrete statistic, a Cauchy likelihood ratio, a parameter on the boundary.
import {
  phi, clamp, commas, pct, hashStr, memo, mean, sortNum, binned, legender, titler, repeater, strip, mulberry, lfact,
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
        const hM = sL.handle(0.35, 0.07, { color: TC.h0, label: '$\\bar x$', labelPos: 'e', constrain: (x) => [clamp(x, -1.6, 1.6), 0.07] });
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
          sL.text('$\\mu_0=0$', 0, 0.2, { color: 'muted', size: 12, dx: -5, align: 'right' });
          sL.dots(B.e.map((e, i) => [xb + e, B.jit[i]]), { r: 4, color: TC.sim, alpha: 0.85 });
          sL.vline(xb, { color: TC.h0, width: 2.4 });
          sL.text(reject ? 'x̄ is in the red band: reject' : 'x̄ is outside the band: retain', -2.5, 0.95, { color: reject ? TC.alpha : 'green', size: 12, weight: 700, plate: true, align: 'left' });
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
        const sR = v.stage({ x: [-3.5, 6.5], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 0.9, minWidth: 250, xlabel: 'statistic', yticks: [[0.75, 'H₀ true'], [0.25, 'H₁ true']], title: '1,000 simulated decisions' });
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
            tag(sL, `α = ${v.fix(al, 3)}`, c, 0.445, { color: TC.alpha, align: 'left', dx: 6 });
            tag(sL, `β = ${v.fix(be, 3)}`, c, 0.445, { color: TC.beta, align: 'right', dx: -6 });
            sL.text('$H_0$', 0, 0.4, { color: TC.h0, size: 14, dx: -14, dy: -4, align: 'right' }); sL.text('$H_1$', d, 0.4, { color: TC.h1, size: 14, dx: 14, dy: -4, align: 'left' });
            fp = S.a.filter((x) => x >= c).length; fn = S.b.filter((x) => x < c).length;
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
          s.text('$\\Theta_0$ (null)', -0.25, 0.5, { color: TC.h0, size: 14 }); s.text('$\\Theta_1$ (alternative)', 1.3, 0.3, { color: TC.h1, size: 14 });
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
    // ───────────────────────────────────────────────────────────── 6.4
    {
      num: '6.4',
      kind: 'Theorem',
      name: 'Neyman–Pearson lemma',
      credit: 'J. Neyman & E. S. Pearson, 1933',
      statement: String.raw`Test a simple null $H_0:\theta=\theta_0$ against a simple alternative $H_1:\theta=\theta_1$, where the data $X$ have density (or mass function) $f_0$ or $f_1$. For $k\ge0$ let $R_k=\{x: f_1(x)>k\,f_0(x)\}$ be the **likelihood-ratio region**, and suppose its size is $\alpha=P_0(X\in R_k)$ (randomize on the boundary $\{f_1=kf_0\}$ if needed to reach exactly $\alpha$). Then

(a) **(sufficiency)** $R_k$ is a **most powerful** level-$\alpha$ test: every region $R$ with $P_0(X\in R)\le\alpha$ has $P_1(X\in R)\le P_1(X\in R_k)$;

(b) **(necessity)** every most powerful level-$\alpha$ test agrees with a likelihood-ratio test except on $\{f_1=kf_0\}$ and a null set, and has size exactly $\alpha$ unless it has power 1.`,
      idea: String.raw`Think of each small piece of the sample space as an item with a cost $f_0\,dx$ (type I error spent) and a value $f_1\,dx$ (power earned): the best region with a budget $\alpha$ buys the pieces with the highest value per cost, $f_1/f_0$, first. Formally, for any $R$ of size at most $\alpha$,
$$P_1(R_k)-P_1(R)=\int(\mathbf 1_{R_k}-\mathbf 1_R)(f_1-kf_0)\,dx+k\big(P_0(R_k)-P_0(R)\big)\ge0,$$
because the integrand is nonnegative pointwise ($\mathbf 1_{R_k}-\mathbf 1_R$ and $f_1-kf_0$ have the same sign) and the last bracket is at least $0$. The likelihood ratio is a Radon–Nikodym derivative (rca-6.10), which is what makes the lemma work in any sample space.`,
      caption: String.raw`Two observations $(x_1,x_2)$, i.i.d. normal with mean $0$ under $H_0$ and mean $\theta_1$ (the purple handle) under $H_1$; the plane is cut into 400 cells (edge cells hold the tails), shaded by the log-likelihood ratio. **Paint** a rejection region by dragging across cells (gold); the presets fill a shape of size close to the target $\alpha$. The green outline is the likelihood-ratio region of exactly the same size, a half-plane perpendicular to $\theta_1$. Right: power against size; the green curve is the Neyman–Pearson frontier, and your region (gold) can touch it but never rise above it.`,
      deps: ['stat-6.3', 'rca-6.10'],
      see: ['stat-6.21', 'stat-6.5'],
      refs: ['Casella–Berger §8.3', 'Wasserman §10.10'],
      tags: ['Neyman–Pearson', 'likelihood ratio', 'most powerful test'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Neyman%E2%80%93Pearson_lemma' },
      viz(v) {
        const G = 20, A = 3, w = (2 * A) / G;
        const edges = Array.from({ length: G + 1 }, (_, i) => (i === 0 ? -Infinity : i === G ? Infinity : -A + i * w));
        const aS = v.slider('target size for presets', 0.01, 0.3, 0.05, { step: 0.005 });
        const s = v.stage({ x: [-A, A], y: [-A, A], equal: true, axes: 'box', gutter: true, height: 380, weight: 1.05, xlabel: '$x_1$', ylabel: '$x_2$', title: 'the sample space, 400 cells: paint a rejection region' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 380, weight: 0.95, minWidth: 250, xlabel: 'size $\\alpha=P_0(R)$', ylabel: 'power $P_1(R)$', title: 'power against size' });
        const h1 = s.handle(1.2, 0.8, { color: TC.h1, label: '$\\theta_1$', labelPos: 'ne', constrain: (x, y) => [clamp(x, -2, 2), clamp(y, -2, 2)] });
        const R = new Uint8Array(G * G);
        const cellOf = (x, y) => { const i = clamp(Math.floor((x + A) / w), 0, G - 1), j = clamp(Math.floor((y + A) / w), 0, G - 1); return j * G + i; };
        let paintVal = 1;
        s.onDrag((x, y, ph) => { const c = cellOf(x, y); if (ph === 'start') paintVal = R[c] ? 0 : 1; if (ph !== 'end') R[c] = paintVal; });
        const mc = memo();
        const masses = (a, b) => mc(a.toFixed(3) + '|' + b.toFixed(3), () => {
          const p0 = new Float64Array(G * G), p1 = new Float64Array(G * G), m0 = [], m1x = [], m1y = [];
          for (let i = 0; i < G; i++) { m0.push(Phi(edges[i + 1]) - Phi(edges[i])); m1x.push(Phi(edges[i + 1] - a) - Phi(edges[i] - a)); m1y.push(Phi(edges[i + 1] - b) - Phi(edges[i] - b)); }
          for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { p0[j * G + i] = m0[i] * m0[j]; p1[j * G + i] = m1x[i] * m1y[j]; }
          const order = Array.from({ length: G * G }, (_, c) => c).sort((c, d) => p1[d] / p0[d] - p1[c] / p0[c]);
          const cum = [[0, 0]]; let s0 = 0, s1 = 0; for (const c of order) { s0 += p0[c]; s1 += p1[c]; cum.push([s0, s1]); }
          return { p0, p1, order, cum };
        });
        // NP power at size a: whole cells in LR order, the last one randomized
        const npAt = (M, a) => { const C = M.cum; for (let i = 1; i < C.length; i++) if (C[i][0] >= a - 1e-15) { const f = (a - C[i - 1][0]) / (C[i][0] - C[i - 1][0]); return { pow: C[i - 1][1] + f * (C[i][1] - C[i - 1][1]), m: i - 1, f }; } return { pow: 1, m: C.length - 1, f: 0 }; };
        const fillBy = (score) => { const M = masses(h1.x, h1.y), idx = Array.from({ length: G * G }, (_, c) => c).sort((c, d) => score(d) - score(c)); R.fill(0); let a = 0; for (const c of idx) { if (a + M.p0[c] > aS.value + 0.004) continue; R[c] = 1; a += M.p0[c]; if (a >= aS.value - 0.002) break; } };
        const ctr = (c) => [-A + ((c % G) + 0.5) * w, -A + (Math.floor(c / G) + 0.5) * w];
        v.button('Disc around θ₁', () => fillBy((c) => { const [x, y] = ctr(c); return -Math.hypot(x - h1.x, y - h1.y); }));
        v.button('Two tails of x₁', () => fillBy((c) => Math.abs(ctr(c)[0])));
        v.button('Square in the middle', () => fillBy((c) => -Math.max(...ctr(c).map(Math.abs))));
        v.button('Random cells', () => { const r = v.rng(hashStr('np' + Date.now())); fillBy(() => r()); });
        v.button('Clear', () => R.fill(0));
        fillBy((c) => { const [x, y] = ctr(c); return -Math.hypot(x - 1.2, y - 0.8); });
        let st = null;
        v.render(() => {
          const a = h1.x, b = h1.y, M = masses(a, b);
          // cells shaded by the log-likelihood ratio (at the cell centre)
          const L = (x, y) => a * x + b * y - (a * a + b * b) / 2;
          for (let c = 0; c < G * G; c++) {
            const [x, y] = ctr(c), l = L(x, y), t = clamp(l / 4, -1, 1);
            s.rect(x - w / 2, y - w / 2, x + w / 2, y + w / 2, { fill: t > 0 ? TC.h1 : TC.h0, fillAlpha: 0.04 + 0.22 * Math.abs(t), stroke: false });
          }
          let sz = 0, pw = 0;
          for (let c = 0; c < G * G; c++) if (R[c]) { const [x, y] = ctr(c); sz += M.p0[c]; pw += M.p1[c]; s.rect(x - w / 2, y - w / 2, x + w / 2, y + w / 2, { fill: TC.sim, fillAlpha: 0.75, color: TC.sim, width: 0.6 }); }
          // the LR region of the same size: outline its cells
          const N = npAt(M, sz);
          for (let i = 0; i < N.m + (N.f > 0 ? 1 : 0); i++) { const c = M.order[i], [x, y] = ctr(c); s.rect(x - w / 2, y - w / 2, x + w / 2, y + w / 2, { color: 'green', width: i === N.m ? 1 : 2, dash: i === N.m ? [3, 3] : undefined, fill: false }); }
          s.contour((x, y) => Math.hypot(x, y), [1, 2], { color: TC.h0, width: 1.4, alpha: 0.7 });
          s.contour((x, y) => Math.hypot(x - a, y - b), [1, 2], { color: TC.h1, width: 1.4, alpha: 0.7 });
          s.dot(0, 0, { r: 4, color: TC.h0 }); s.text('$\\theta_0$', 0, 0, { color: TC.h0, size: 13, dx: -8, dy: 10, align: 'right' });
          s.arrow(0, 0, a, b, { color: TC.h1, width: 1.4, alpha: 0.7 });
          // right: frontier and the painted point
          sR.fn((x) => x, { domain: [0, 1], color: 'faint', width: 1, dash: [4, 4] });
          sR.path(M.cum, { color: 'green', width: 2.8 });
          if (sz > 0) {
            sR.line(sz, pw, sz, N.pow, { color: 'green', width: 1.6, dash: [3, 3] });
            sR.dot(sz, N.pow, { r: 5, color: 'green' });
            sR.dot(sz, pw, { r: 6, color: TC.sim });
            tag(sR, `yours: ${v.fix(pw, 3)}`, sz, pw, { color: 'ink', align: 'left', dx: 10, dy: 14, size: 11 });
            tag(sR, `LR: ${v.fix(N.pow, 3)}`, sz, N.pow, { color: 'green', align: 'left', dx: 10, dy: -12, size: 11 });
          }
          sR.text('random guessing', 0.62, 0.62, { color: 'muted', size: 10.5, dy: 12, dx: 4, align: 'left' });
          v.legend([[TC.sim, 'your region', { area: true }], ['green', 'likelihood-ratio region of the same size'], [TC.h0, '$H_0$ density contours'], [TC.h1, '$H_1$ density contours'], ['green', 'Neyman–Pearson frontier']]);
          st = { sz, pw, np: N.pow, cells: R.reduce((x, y) => x + y, 0), a, b };
        });
        v.readout(() => {
          if (!st) return '';
          const { sz, pw, np, cells, a, b } = st;
          if (!cells) return 'paint some cells (drag on the left panel) or press a preset';
          const gap = np - pw;
          return String.raw`your region: ${cells} cells, size $\alpha=${v.fix(sz, 4)}$, power ${v.fix(pw, 4)} · likelihood-ratio region of the same size ($\{\theta_1\cdot x>k\}$, $\theta_1=(${v.fix(a, 2)},${v.fix(b, 2)})$): power **${v.fix(np, 4)}** · difference ${v.fix(gap, 4)} ${gap > -1e-9 ? '≥ 0 ✓' : '✗'}` + (gap < 0.003 ? ' · your region is (almost) the likelihood-ratio region' : ' · every cell outside the half-plane buys less power per unit of α');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.5
    {
      num: '6.5',
      kind: 'Concept',
      name: 'ROC curve',
      statement: String.raw`For a family of tests "reject when $T(X)>t$" indexed by the threshold $t$, the **receiver operating characteristic (ROC) curve** plots power $P_1(T>t)$ against size $P_0(T>t)$ as $t$ runs from $+\infty$ to $-\infty$; it climbs from $(0,0)$ to $(1,1)$. The diagonal is the ROC of a coin flip. By the Neyman–Pearson lemma (stat-6.4) the ROC curve of the likelihood ratio $f_1(X)/f_0(X)$ lies on or above the ROC curve of every other statistic at every size, and it is concave. The **area under the curve** (AUC) equals $P(T_1>T_0)$ for independent $T_0\sim P_0$, $T_1\sim P_1$ (the Mann–Whitney probability).`,
      idea: String.raw`Each point of an ROC curve is a test; the curve is a menu of $(\alpha,1-\beta)$ trade-offs that one statistic offers. Neyman–Pearson says the likelihood-ratio menu dominates every other, so ROC curves turn "which statistic is better?" into a picture with a clear answer when the curves do not cross. The AUC identity follows by writing the area as $\int P_1(T>t)\,dP_0(t)$.`,
      caption: String.raw`Data: $n$ observations from the null law centred at $0$ or the alternative centred at $\mu$. Left: null (blue) and alternative (purple) histograms of the likelihood-ratio statistic over 4,000 simulated data sets each; drag the threshold. Right: ROC curves of the likelihood ratio (green, thick), the sample mean, the median and the first observation alone; the dot is the current threshold. For **normal** data the mean *is* the likelihood-ratio statistic and its exact ROC (black dashes) sits on the green curve; the median lies below. For **Laplace** data the likelihood ratio is $\sum(|x_i|-|x_i-\mu|)$: now the mean falls below and the median comes close.`,
      deps: ['stat-6.4'],
      see: ['stat-6.21'],
      refs: ['Casella–Berger §8.3'],
      tags: ['ROC curve', 'power', 'likelihood ratio'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Receiver_operating_characteristic' },
      viz(v) {
        const lawS = v.select('data', [{ value: 'normal', label: 'normal' }, { value: 'laplace', label: 'Laplace' }], 'normal');
        const nS = v.slider('sample size $n$', 1, 25, 5, { int: true });
        const mS = v.slider('effect $\\mu$', 0.1, 1.5, 0.6, { step: 0.05 });
        const sL = v.stage({ x: [-2, 2], y: [0, 1], axes: 'box', gutter: true, height: 350, weight: 1, xlabel: 'likelihood-ratio statistic', ylabel: 'density', title: 'the likelihood-ratio statistic under $H_0$ and $H_1$' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 350, weight: 1, xlabel: 'size $P_0(T>t)$', ylabel: 'power $P_1(T>t)$', title: 'ROC curves of four statistics' });
        const hT = sL.handle(0.5, 0.03, { color: TC.alpha, label: '$t$', labelPos: 'ne', constrain: 'x' });
        const NR = 4000, med = (a) => { const s = Float64Array.from(a).sort(), n = s.length; return n % 2 ? s[(n - 1) >> 1] : 0.5 * (s[n / 2 - 1] + s[n / 2]); };
        const mc = memo();
        const sim = (law, n, mu) => mc([law, n, mu].join('|'), () => {
          const r = v.rng(hashStr(`t6.5|${law}|${n}|${mu}`)), out = { 0: [], 1: [] };
          for (const h of [0, 1]) {
            const LR = new Float64Array(NR), MN = new Float64Array(NR), MD = new Float64Array(NR), X1 = new Float64Array(NR), xs = new Float64Array(n);
            for (let k = 0; k < NR; k++) {
              let lr = 0, sm = 0;
              for (let i = 0; i < n; i++) { const x = (h ? mu : 0) + (law === 'normal' ? r.normal() : rlaplace(r)); xs[i] = x; sm += x; lr += law === 'normal' ? x : Math.abs(x) - Math.abs(x - mu); }
              LR[k] = lr / n; MN[k] = sm / n; MD[k] = med(xs); X1[k] = xs[0];
            }
            out[h] = { LR, MN, MD, X1 };
          }
          // empirical ROC of each statistic and its AUC
          const roc = (a0, a1) => {
            const s0 = Float64Array.from(a0).sort(), s1 = Float64Array.from(a1).sort(), pts = [[0, 0]];
            const ts = Float64Array.from([...s0, ...s1]).sort(); let auc = 0, px = 0, py = 0;
            for (let i = ts.length - 1; i >= 0; i -= 20) {
              const t = ts[i], fx = 1 - upperIdx(s0, t) / NR, fy = 1 - upperIdx(s1, t) / NR;
              auc += (fx - px) * (fy + py) / 2; px = fx; py = fy; pts.push([fx, fy]);
            }
            auc += (1 - px) * (1 + py) / 2; pts.push([1, 1]);
            return { pts, auc, s0, s1 };
          };
          const keys = ['LR', 'MN', 'MD', 'X1'], R = {};
          for (const k of keys) R[k] = roc(out[0][k], out[1][k]);
          return { out, R };
        });
        function upperIdx(s, t) { let lo = 0, hi = s.length; while (lo < hi) { const m = (lo + hi) >> 1; if (s[m] <= t) lo = m + 1; else hi = m; } return lo; }
        const COL = { LR: 'green', MN: TC.h0, MD: 'orange', X1: 'muted' }, NAME = { LR: 'likelihood ratio', MN: 'mean', MD: 'median', X1: 'first observation' };
        let last = '', st = null;
        v.render(() => {
          const law = lawS.value, n = nS.value, mu = mS.value, S = sim(law, n, mu), L0 = S.out[0].LR, L1 = S.out[1].LR;
          const key = [law, n, mu].join('|');
          const sd = law === 'normal' ? 1 / Math.sqrt(n) : Math.sqrt(2 / n) * Math.min(1, mu);
          const lo = law === 'normal' ? -3.2 * sd : -1.04 * mu, hi = law === 'normal' ? mu + 3.2 * sd : 1.04 * mu;
          const B0 = binned(L0, lo, hi, 40), B1 = binned(L1, lo, hi, 40), top = Math.max(B0.max, B1.max) * 1.15;
          sL.setView([lo, hi], [0, top]);
          if (key !== last) { last = key; hT.set(law === 'normal' ? mu / 2 + 0.6 * sd : 0.5 * (lo + hi) + 0.3 * (hi - lo) * 0.3, top * 0.04); }
          const t = hT.x; hT.set(t, top * 0.04);
          sL.vband(t, hi, { color: TC.alpha, alpha: 0.08 });
          sL.hist(B0, { density: true, color: TC.h0, fillAlpha: 0.22, width: 1.4 });
          sL.hist(B1, { density: true, color: TC.h1, fillAlpha: 0.22, width: 1.4 });
          if (law === 'normal') { sL.fn((x) => Math.sqrt(n) * phi(x * Math.sqrt(n)), { domain: [lo, hi], color: TC.h0, width: 1.6, dash: [5, 4] }); sL.fn((x) => Math.sqrt(n) * phi((x - mu) * Math.sqrt(n)), { domain: [lo, hi], color: TC.h1, width: 1.6, dash: [5, 4] }); }
          sL.vline(t, { color: TC.alpha, width: 1.8, dash: [5, 4] });
          const fx = 1 - upperIdx(S.R.LR.s0, t) / NR, fy = 1 - upperIdx(S.R.LR.s1, t) / NR;
          tag(sL, `size ${v.fix(fx, 3)} · power ${v.fix(fy, 3)}`, t, top * 0.93, { align: t > 0.5 * (lo + hi) ? 'right' : 'left', dx: t > 0.5 * (lo + hi) ? -8 : 8, size: 11 });
          // right
          sR.fn((x) => x, { domain: [0, 1], color: 'faint', width: 1, dash: [4, 4] });
          for (const k of ['X1', 'MD', 'MN', 'LR']) { if (law === 'normal' && k === 'MN') continue; sR.path(S.R[k].pts, { color: COL[k], width: k === 'LR' ? 3.2 : 2 }); }
          if (law === 'normal') sR.fn((a) => Q(zq(Math.max(1e-9, a)) - Math.sqrt(n) * mu), { domain: [0.0005, 1], color: 'ink', width: 1.6, dash: [5, 4], n: 200 });
          sR.dot(fx, fy, { r: 5.5, color: TC.alpha });
          v.legend([...['LR', 'MN', 'MD', 'X1'].filter((k) => !(law === 'normal' && k === 'MN')).map((k) => [COL[k], `${law === 'normal' && k === 'LR' ? 'mean = likelihood ratio' : NAME[k]} (AUC ${v.fix(S.R[k].auc, 3)})`]), ...(law === 'normal' ? [['ink', 'exact ROC of the mean', { dash: true }]] : [])]);
          st = { law, n, mu, S, fx, fy };
        });
        v.readout(() => {
          if (!st) return '';
          const { law, n, mu, S } = st, A = (k) => v.fix(S.R[k].auc, 3);
          if (law === 'normal') return String.raw`normal, $n=${n}$, $\mu=${mu}$: the likelihood ratio is increasing in $\bar x$, so the mean is optimal · AUC: mean ${A('LR')} (exact $\Phi(\sqrt n\mu/\sqrt2)=${v.fix(Phi((Math.sqrt(n) * mu) / Math.SQRT2), 3)}$), median ${A('MD')}, first observation ${A('X1')} (exact $\Phi(\mu/\sqrt2)=${v.fix(Phi(mu / Math.SQRT2), 3)}$) · no curve rises above the green one ✓`;
          return String.raw`Laplace, $n=${n}$, $\mu=${mu}$: AUC likelihood ratio **${A('LR')}**, median ${A('MD')}, mean ${A('MN')}, first observation ${A('X1')} · for heavy-ish tails the mean wastes information; the likelihood ratio still dominates every other statistic (up to simulation noise) ✓`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.6
    {
      num: '6.6',
      kind: 'Definition',
      name: 'Monotone likelihood ratio',
      statement: String.raw`A family of densities (or mass functions) $\{g(t\mid\theta):\theta\in\Theta\subset\R\}$ for a real statistic $T$ has a **monotone likelihood ratio (MLR)** in $t$ if for every $\theta_2>\theta_1$ the ratio $g(t\mid\theta_2)/g(t\mid\theta_1)$ is a nondecreasing function of $t$ on $\{t: g(t\mid\theta_1)>0\text{ or }g(t\mid\theta_2)>0\}$ (with $c/0=\infty$). Every one-parameter exponential family $g(t\mid\theta)=h(t)c(\theta)e^{w(\theta)t}$ with $w$ nondecreasing has MLR in $t$ (stat-1.17): the ratio is $\frac{c(\theta_2)}{c(\theta_1)}e^{(w(\theta_2)-w(\theta_1))t}$. So do the normal, Poisson, binomial and exponential families in their natural statistics, and $\mathrm{Uniform}(0,\theta)$ in $\max X_i$. The Cauchy location family does not.`,
      idea: String.raw`MLR says that larger values of $T$ are always relatively more likely under larger $\theta$, whichever two parameter values are compared. That is exactly what makes "reject for large $T$" the likelihood-ratio test against every alternative above the null at once (stat-6.7). For exponential families the log ratio is linear in $t$, so monotone; for the Cauchy, both tails are so heavy that far from the centres the two densities become proportional again and the ratio returns to 1.`,
      caption: String.raw`Pick a family and two parameter values $\theta_1<\theta_2$ (sliders). Left: the two densities. Right: the log-likelihood ratio $\log\{f(x\mid\theta_2)/f(x\mid\theta_1)\}$ as a function of $x$, green where it increases and red where it decreases; for exponential families it is a straight line in the natural statistic. Choose **Cauchy**: the curve rises and falls back to 0 at both ends, so no ordering of $x$ is uniformly "more extreme".`,
      deps: ['stat-6.4', 'stat-1.17'],
      refs: ['Casella–Berger §8.3'],
      tags: ['monotone likelihood ratio', 'exponential family'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Monotone_likelihood_ratio' },
      viz(v) {
        const FAM = {
          normal: { lab: 'normal location', t1: 0, t2: 1.5, rng: [-2, 3], xr: [-4, 6], pdf: (x, t) => phi(x - t), disc: false },
          expo: { lab: 'exponential (mean θ)', t1: 1, t2: 2.5, rng: [0.3, 4], xr: [0, 10], pdf: (x, t) => (x < 0 ? 0 : Math.exp(-x / t) / t), disc: false },
          poisson: { lab: 'Poisson', t1: 2, t2: 5, rng: [0.5, 10], xr: [-0.5, 16.5], pdf: (x, t) => (x < 0 || x !== Math.round(x) ? 0 : Math.exp(x * Math.log(t) - t - lfact(x))), disc: true },
          unif: { lab: 'uniform on (0, θ)', t1: 1.5, t2: 3, rng: [0.5, 4], xr: [-0.2, 4.5], pdf: (x, t) => (x >= 0 && x <= t ? 1 / t : 0), disc: false },
          cauchy: { lab: 'Cauchy location', t1: 0, t2: 2, rng: [-2, 4], xr: [-8, 10], pdf: (x, t) => 1 / (Math.PI * (1 + (x - t) ** 2)), disc: false },
        };
        const famS = v.select('family', Object.entries(FAM).map(([k, f]) => ({ value: k, label: { normal: 'normal', expo: 'exponential', poisson: 'Poisson', unif: 'uniform $(0,\\theta)$', cauchy: 'Cauchy' }[k] })), 'normal', { onChange: (k) => { const F = FAM[k]; t1S.set(F.t1); t2S.set(F.t2); } });
        const t1S = v.slider('$\\theta_1$', -2, 10, 0, { step: 0.05 });
        const t2S = v.slider('$\\theta_2$', -2, 10, 1.5, { step: 0.05 });
        const sL = v.stage({ x: [-4, 6], y: [0, 0.45], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: '$x$', ylabel: 'density', title: '$f(x\\mid\\theta_1)$ and $f(x\\mid\\theta_2)$' });
        const sR = v.stage({ x: [-4, 6], y: [-4, 4], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: '$x$', ylabel: '$\\log\\frac{f(x\\mid\\theta_2)}{f(x\\mid\\theta_1)}$', title: 'the log-likelihood ratio in $x$' });
        let st = null;
        v.render(() => {
          const k = famS.value, F = FAM[k];
          let a = clamp(t1S.value, F.rng[0], F.rng[1]), b = clamp(t2S.value, F.rng[0], F.rng[1]);
          if (b <= a) b = Math.min(F.rng[1], a + 0.05);
          const [x0, x1] = F.xr, ymax = Math.max(...Array.from({ length: 200 }, (_, i) => Math.max(F.pdf(F.disc ? Math.round(x0 + (i / 199) * (x1 - x0)) : x0 + (i / 199) * (x1 - x0), a), F.pdf(F.disc ? Math.round(x0 + (i / 199) * (x1 - x0)) : x0 + (i / 199) * (x1 - x0), b)))) * 1.15;
          sL.setView(F.xr, [0, ymax]);
          if (F.disc) for (let x = 0; x <= x1; x++) { sL.rect(x - 0.38, 0, x, F.pdf(x, a), { fill: TC.h0, fillAlpha: 0.45, color: TC.h0, width: 1 }); sL.rect(x, 0, x + 0.38, F.pdf(x, b), { fill: TC.h1, fillAlpha: 0.45, color: TC.h1, width: 1 }); }
          else { sL.fn((x) => F.pdf(x, a), { domain: F.xr, color: TC.h0, width: 2.6, n: 400, fill: TC.h0, fillAlpha: 0.08 }); sL.fn((x) => F.pdf(x, b), { domain: F.xr, color: TC.h1, width: 2.6, n: 400, fill: TC.h1, fillAlpha: 0.08 }); }
          // log ratio
          const lr = (x) => Math.log(F.pdf(x, b)) - Math.log(F.pdf(x, a));
          const xs = F.disc ? Array.from({ length: x1 + 1 }, (_, i) => i) : Array.from({ length: 500 }, (_, i) => x0 + ((i + 0.5) / 500) * (x1 - x0));
          const pts = xs.map((x) => [x, lr(x)]).filter((p) => Number.isFinite(p[1]) || p[1] === Infinity);
          const fin = pts.filter((p) => Number.isFinite(p[1])).map((p) => p[1]);
          const lo = Math.min(...fin), hi = Math.max(...fin), pad = Math.max(0.5, 0.15 * (hi - lo));
          sR.setView(F.xr, [Math.min(-0.5, lo - pad), Math.max(0.5, hi + pad)]);
          sR.hline(0, { color: 'muted', width: 1, dash: [3, 3] });
          let down = 0, maxDrop = 0, xm = null;
          for (let i = 1; i < pts.length; i++) {
            const [xa, ya] = pts[i - 1], [xb, yb] = pts[i];
            if (!Number.isFinite(ya) || !Number.isFinite(yb)) continue;
            const dec = yb < ya - 1e-12; if (dec) { down += 1; maxDrop += ya - yb; if (xm == null) xm = xa; }
            if (F.disc) sR.line(xa, ya, xb, yb, { color: dec ? 'red' : 'green', width: 1.4, alpha: 0.5 });
            else sR.line(xa, ya, xb, yb, { color: dec ? 'red' : 'green', width: 3 });
          }
          if (F.disc) sR.dots(pts.filter((p) => Number.isFinite(p[1])), { r: 4, color: 'green' });
          if (k === 'unif') { const yt = sR.bounds.y[1]; sR.arrow(a + 0.04, Math.log(a / b), a + 0.04, yt - 0.1 * (yt - Math.log(a / b)), { color: 'green', width: 2.4 }); sR.line(a + 0.04, yt - 0.1 * (yt - Math.log(a / b)), b, yt - 0.1 * (yt - Math.log(a / b)), { color: 'green', width: 3 }); tag(sR, '+∞: only θ₂ allows x here', 0.5 * (a + b), yt - 0.1 * (yt - Math.log(a / b)), { color: 'green', dy: 14, size: 11 }); }
          if (k === 'cauchy') { const xpk = pts.reduce((m, p) => (p[1] > m[1] ? p : m), [0, -Infinity]), xmn = pts.reduce((m, p) => (p[1] < m[1] ? p : m), [0, Infinity]); sR.dot(xpk[0], xpk[1], { r: 4.5, color: 'red' }); sR.dot(xmn[0], xmn[1], { r: 4.5, color: 'red' }); tag(sR, 'ratio → 1 in both tails', x1 - 0.2, 0, { color: 'red', align: 'right', dy: -14, size: 11 }); }
          v.legend([[TC.h0, `$\\theta_1=${v.fix(a, 2)}$`], [TC.h1, `$\\theta_2=${v.fix(b, 2)}$`], ['green', 'log ratio increasing'], ['red', 'decreasing']]);
          st = { k, a, b, down, maxDrop, xm, F };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, a, b, down, maxDrop, xm } = st;
          const form = { normal: String.raw`$\log\frac{f_2}{f_1}=(\theta_2-\theta_1)x-\frac{\theta_2^2-\theta_1^2}2$: a line with slope ${v.fix(b - a, 2)} > 0`, expo: String.raw`$\log\frac{f_2}{f_1}=\big(\frac1{\theta_1}-\frac1{\theta_2}\big)x+\log\frac{\theta_1}{\theta_2}$: slope ${v.fix(1 / a - 1 / b, 3)} > 0`, poisson: String.raw`$\log\frac{f_2}{f_1}=x\log\frac{\theta_2}{\theta_1}-(\theta_2-\theta_1)$: slope ${v.fix(Math.log(b / a), 3)} > 0 in $x$`, unif: String.raw`ratio $=\theta_1/\theta_2$ on $[0,\theta_1]$, $+\infty$ on $(\theta_1,\theta_2]$: nondecreasing in $x$ (and in $\max X_i$ for samples)`, cauchy: String.raw`$\frac{f_2}{f_1}=\frac{1+(x-\theta_1)^2}{1+(x-\theta_2)^2}\to1$ as $x\to\pm\infty$` }[k];
          return `${form} · ` + (down === 0 ? '**monotone likelihood ratio ✓**' : `**not monotone ✗**: the log ratio decreases by a total of ${v.fix(maxDrop, 2)}, starting near x = ${v.fix(xm, 2)}, so a large x is not uniformly evidence for a larger θ`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.7
    {
      num: '6.7',
      kind: 'Theorem',
      name: 'Karlin–Rubin theorem',
      credit: 'S. Karlin & H. Rubin, 1956',
      statement: String.raw`Let $T$ be a sufficient statistic for a real parameter $\theta$, and suppose the family of densities (or mass functions) $g(t\mid\theta)$ of $T$ has a monotone likelihood ratio in $t$ (stat-6.6). For testing $H_0:\theta\le\theta_0$ against $H_1:\theta>\theta_0$, the test that rejects when $T>t_0$, with $t_0$ chosen so that $P_{\theta_0}(T>t_0)=\alpha$ (randomizing at $t_0$ in the discrete case), is a **uniformly most powerful (UMP)** level-$\alpha$ test: its power at every $\theta>\theta_0$ is at least that of any other test of level $\alpha$. Its power function is nondecreasing in $\theta$, so its size is attained at $\theta_0$.`,
      idea: String.raw`Fix one alternative $\theta_1>\theta_0$. By the Neyman–Pearson lemma (stat-6.4) the most powerful test of $\theta_0$ against $\theta_1$ rejects when $g(T\mid\theta_1)/g(T\mid\theta_0)>k$, and by monotonicity that region is $\{T>t_0\}$. The cutoff $t_0$ is fixed by the size under $\theta_0$ alone, so it does **not** depend on $\theta_1$: the same test is most powerful against every alternative simultaneously. The monotone power function (another consequence of MLR) makes the test of level $\alpha$ for the whole composite null $\theta\le\theta_0$. Without MLR the Neyman–Pearson region moves with $\theta_1$ and no single test can be best everywhere.`,
      caption: String.raw`One observation; $H_0:\theta=\theta_0$, level 5%. Left: the Neyman–Pearson rejection region against each alternative $\theta_1\in\{0.5,1,2,4\}$ and against the gold $\theta_1$ (slider), one row each, computed by sorting a fine grid of cells by their likelihood ratio; the null density is drawn underneath. Right: the power curves of these five tests. For the **normal** and **exponential** families (monotone likelihood ratio) the five regions are the same tail and the five power curves are one curve: a UMP test. For the **Cauchy** location family each region is a different interval near its own $\theta_1$, the curves cross, and none is best everywhere.`,
      deps: ['stat-6.6', 'stat-6.4'],
      refs: ['Casella–Berger §8.3'],
      tags: ['uniformly most powerful', 'monotone likelihood ratio', 'one-sided test'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Uniformly_most_powerful_test#The_Karlin%E2%80%93Rubin_theorem' },
      viz(v) {
        const FAM = {
          normal: { t0: 0, xr: [-3, 7], pr: [-1, 5], cdf: (x, t) => Phi(x - t), sf: (x, t) => Phi(t - x), pdf: (x, t) => phi(x - t), lpdf: (x, t) => -0.5 * (x - t) ** 2, lo: -12, hi: 16 },
          expo: { t0: 1, xr: [0, 14], pr: [0.5, 7], cdf: (x, t) => (x <= 0 ? 0 : 1 - Math.exp(-x / t)), sf: (x, t) => (x <= 0 ? 1 : Math.exp(-x / t)), pdf: (x, t) => (x < 0 ? 0 : Math.exp(-x / t) / t), lpdf: (x, t) => (x < 0 ? -Infinity : -x / t - Math.log(t)), lo: 0, hi: 80 },
          cauchy: { t0: 0, xr: [-3, 8], pr: [-1, 7], cdf: (x, t) => 0.5 + Math.atan(x - t) / Math.PI, sf: (x, t) => 0.5 - Math.atan(x - t) / Math.PI, pdf: (x, t) => 1 / (Math.PI * (1 + (x - t) ** 2)), lpdf: (x, t) => -Math.log1p((x - t) ** 2), lo: -30, hi: 30 },
        };
        const famS = v.select('family', [{ value: 'normal', label: 'normal location' }, { value: 'expo', label: 'exponential mean' }, { value: 'cauchy', label: 'Cauchy location' }], 'normal');
        const aS = v.slider('alternative $\\theta_1-\\theta_0$ (gold row)', 0.1, 5, 3, { step: 0.05 });
        const sL = v.stage({ x: [-3, 7], y: [0, 6.2], axes: 'box', gutter: { l: 66 }, height: 360, weight: 1.05, xlabel: '$x$', yticks: [], title: 'Neyman–Pearson rejection region against each $\\theta_1$' });
        const sR = v.stage({ x: [-1, 5], y: [0, 1], axes: 'box', gutter: true, height: 360, weight: 0.95, minWidth: 250, xlabel: '$\\theta$', ylabel: 'power', title: 'power functions of the five tests' });
        const ALPHA = 0.05, ROWS = [0.5, 1, 2, 4], NC = 2400;
        // NP region of size α against θ1: cells sorted by likelihood ratio, last one split; returns merged intervals
        const npRegion = (F, t1) => {
          const t0 = F.t0, E = [-Infinity], cw = (F.hi - F.lo) / NC; for (let i = 0; i <= NC; i++) E.push(F.lo + cw * i); E.push(Infinity);
          const mass = (a, b, t) => (a >= t ? F.sf(a, t) - F.sf(b, t) : F.cdf(b, t) - F.cdf(a, t));
          const cells = [];
          for (let i = 0; i < E.length - 1; i++) {
            const a = E[i], b = E[i + 1], p0 = Math.max(0, mass(a, b, t0));
            const xm = !Number.isFinite(a) ? b - 50 : !Number.isFinite(b) ? a + 50 : 0.5 * (a + b);
            const l0 = F.lpdf(xm, t0), l1 = F.lpdf(xm, t1);
            if (l0 === -Infinity && l1 === -Infinity) continue;
            cells.push({ i, a, b, p0, lr: l1 - l0 });
          }
          cells.sort((c, d) => d.lr - c.lr);
          const taken = new Set(), pieces = []; let s = 0;
          for (const c of cells) {
            if (s + c.p0 <= ALPHA + 1e-13) { taken.add(c.i); pieces.push([c.a, c.b]); s += c.p0; continue; }
            const f = (ALPHA - s) / c.p0;
            if (f > 1e-6) pieces.push(taken.has(c.i - 1) || !taken.has(c.i + 1) ? [c.a, c.a + f * (c.b - c.a)] : [c.b - f * (c.b - c.a), c.b]);
            break;
          }
          pieces.sort((u, w) => u[0] - w[0]);
          const merged = []; for (const iv of pieces) { const L = merged[merged.length - 1]; if (L && iv[0] <= L[1] + 1e-9) L[1] = Math.max(L[1], iv[1]); else merged.push([iv[0], iv[1]]); }
          return merged;
        };
        const powerOf = (F, R, t) => R.reduce((s, [a, b]) => s + (a >= t ? F.sf(a, t) - F.sf(b, t) : F.cdf(b, t) - F.cdf(a, t)), 0);
        const mc = memo();
        const regions = (k, a) => mc(k + '|' + a, () => { const F = FAM[k], th = (d) => (k === 'expo' ? F.t0 + d : F.t0 + d); return [...ROWS, a].map((d) => ({ d, t1: th(d), R: npRegion(F, th(d)) })); });
        let st = null;
        v.render(() => {
          const k = famS.value, F = FAM[k], a = aS.value, RG = regions(k, a);
          sL.setView(F.xr, [0, 6.2]); sR.setView([F.pr[0], F.pr[1]], [0, 1]);
          sL.setTicks(null, [...RG.map((g, i) => [i + 1.5, i < 4 ? `θ₀ + ${g.d}` : 'gold θ₁'])]);
          // null density underneath, scaled to height 0.9
          const top = F.pdf(k === 'expo' ? 0 : F.t0, F.t0);
          sL.fn((x) => (0.9 * F.pdf(x, F.t0)) / top, { domain: F.xr, color: TC.h0, width: 2, n: 300, fill: TC.h0, fillAlpha: 0.12 });
          sL.text('null density', F.xr[0] + 0.02 * (F.xr[1] - F.xr[0]), 0.95, { color: TC.h0, size: 11, align: 'left', dy: -6 });
          RG.forEach((g, i) => {
            const y = i + 1.5, cur = i === 4;
            sL.hline(y, { color: 'faint', width: 1 });
            for (const [lo, hi] of g.R) { const x0 = Math.max(lo, F.xr[0]), x1 = Math.min(hi, F.xr[1]); if (x1 > x0) sL.rect(x0, y - 0.28, x1, y + 0.28, { fill: cur ? TC.sim : TC.alpha, fillAlpha: cur ? 0.8 : 0.55, color: cur ? TC.sim : TC.alpha, width: 1 }); if (hi > F.xr[1]) sL.arrow(F.xr[1] - 0.04 * (F.xr[1] - F.xr[0]), y, F.xr[1] - 0.005 * (F.xr[1] - F.xr[0]), y, { color: cur ? TC.sim : TC.alpha, width: 2 }); }
            sL.dot(g.t1, y, { r: 3.5, color: TC.h1 });
          });
          // power curves
          sR.hline(ALPHA, { color: TC.alpha, width: 1, dash: [3, 3] });
          sR.vline(F.t0, { color: 'muted', width: 1, dash: [3, 3] });
          const pc = RG.map((g) => (t) => powerOf(F, g.R, t));
          RG.forEach((g, i) => { if (i < 4) sR.fn(pc[i], { domain: F.pr, color: ['teal', 'purple', 'orange', 'pink'][i], width: 2, n: 160, alpha: 0.85 }); });
          sR.fn(pc[4], { domain: F.pr, color: TC.sim, width: 3, n: 160, dash: [7, 5] });
          // spread between the curves
          let spread = 0; for (let j = 0; j <= 60; j++) { const t = F.pr[0] + ((F.pr[1] - F.pr[0]) * j) / 60, ps = pc.map((f) => f(t)); spread = Math.max(spread, Math.max(...ps) - Math.min(...ps)); }
          if (spread < 0.002) tag(sR, 'all five power curves coincide: one UMP test', 0.5 * (F.pr[0] + F.pr[1]), 0.12, { color: 'green' });
          else tag(sR, 'the curves cross: no test is best everywhere', 0.5 * (F.pr[0] + F.pr[1]), 0.93, { color: 'red' });
          v.legend([[TC.h1, 'the alternative θ₁ of each row', { dot: true }], [TC.alpha, 'NP rejection region', { area: true }], ...ROWS.map((d, i) => [['teal', 'purple', 'orange', 'pink'][i], `power, test built for θ₀ + ${d}`]), [TC.sim, 'power, gold test', { dash: true }]]);
          st = { k, F, RG, spread, pc };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, F, RG, spread, pc } = st, fmtR = (R) => R.map(([a, b]) => `(${Number.isFinite(a) ? v.fix(a, 2) : '−∞'}, ${Number.isFinite(b) ? v.fix(b, 2) : '∞'})`).join(' ∪ ');
          if (spread < 0.002) return `every Neyman–Pearson region is the same tail ${fmtR(RG[4].R)} (exactly: ${k === 'normal' ? 'x > z₀.₀₅ = 1.645' : 'x > −θ₀ log 0.05 = 2.996'}), so the five power curves agree to ${v.fix(spread, 4)}: **uniformly most powerful** ✓`;
          const i0 = 0, i3 = 3, tA = RG[i0].t1, tB = RG[i3].t1;
          return `gold region ${fmtR(RG[4].R)} · the test built for θ₀ + 0.5 has power ${v.fix(pc[i0](tA), 3)} at θ = ${v.fix(tA, 1)} but only ${v.fix(pc[i0](tB), 3)} at θ = ${v.fix(tB, 1)}, where the test built for θ₀ + 4 has ${v.fix(pc[i3](tB), 3)} · largest gap between curves ${v.fix(spread, 3)}: **no UMP test** for the Cauchy family (no monotone likelihood ratio)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.8
    {
      num: '6.8',
      kind: 'Proposition',
      name: 'No uniformly most powerful two-sided test',
      statement: String.raw`Let $X_1,\dots,X_n$ be i.i.d. $N(\theta,1)$ and test $H_0:\theta=\theta_0$ against the two-sided alternative $H_1:\theta\ne\theta_0$ at level $\alpha\in(0,1)$. There is **no** uniformly most powerful level-$\alpha$ test. Against $\theta>\theta_0$ the most powerful test is the upper one-sided test, and against $\theta<\theta_0$ the lower one; each has power below $\alpha$ (tending to $0$) on the wrong side, and any test that matches both has to coincide with two different tests. The same holds for any one-parameter exponential family with a two-sided alternative.`,
      idea: String.raw`Suppose $\phi$ were UMP. Against a fixed $\theta_1>\theta_0$ the Neyman–Pearson test is unique up to null sets (stat-6.4(b)), so $\phi$ must be the upper test $\{Z>z_\alpha\}$; against $\theta_2<\theta_0$ it must equally be the lower test $\{Z<-z_\alpha\}$. These differ on a set of positive probability, a contradiction. The **power envelope**, the pointwise best power $\sup_\phi\beta_\phi(\theta)$ over level-$\alpha$ tests, is attained on each side by a different test, so no single power curve can reach it everywhere. The way out is to restrict the class of tests, e.g. to unbiased ones (stat-6.18).`,
      caption: String.raw`Left: power curves of the upper one-sided test (teal), the lower one-sided test (orange) and the symmetric two-sided test (blue), with the power envelope (black dashes). Drag the gold alternative $\theta$. Each one-sided test touches the envelope on its own side and falls below $\alpha$ on the other; the two-sided test never touches it. Right: the distribution of $Z=\sqrt n(\bar X-\theta_0)$ when the truth is the gold $\theta$, with the three rejection regions as bars and the probability each one captures.`,
      deps: ['stat-6.7'],
      refs: ['Casella–Berger §8.3'],
      tags: ['uniformly most powerful', 'two-sided test', 'power envelope'],
      viz(v) {
        const nS = v.slider('sample size $n$', 1, 60, 10, { int: true });
        const sL = v.stage({ x: [-1.2, 1.2], y: [0, 1], axes: 'box', gutter: true, height: 350, weight: 1.1, xlabel: '$\\theta$ ($\\theta_0=0$)', ylabel: 'power', title: 'three level-5% tests and the power envelope' });
        const sR = v.stage({ x: [-5, 5], y: [-0.5, 0.46], axes: 'box', gutter: true, height: 350, weight: 0.9, minWidth: 250, xlabel: '$z$', yticks: [[0, '0'], [0.2, '0.2'], [0.4, '0.4']], title: 'where $Z$ falls when the truth is $\\theta$' });
        const hT = sL.handle(0.35, 0.04, { color: TC.sim, label: '$\\theta$', labelPos: 'ne', constrain: 'x' });
        const za = zq(0.05), z2 = zq(0.025);
        const up = (t, n) => Q(za - Math.sqrt(n) * t), dn = (t, n) => Phi(-za - Math.sqrt(n) * t), two = (t, n) => Q(z2 - Math.sqrt(n) * t) + Phi(-z2 - Math.sqrt(n) * t);
        const env = (t, n) => Math.max(up(t, n), dn(t, n));
        const mc = memo();
        const sim = (n, t) => mc(n + '|' + t.toFixed(3), () => { const r = v.rng(hashStr(`t6.8|${n}|${t.toFixed(3)}`)); let u = 0, d = 0, w = 0; const R = 4000; for (let i = 0; i < R; i++) { let s = 0; for (let j = 0; j < n; j++) s += t + r.normal(); const z = s / Math.sqrt(n); if (z > za) u++; if (z < -za) d++; if (Math.abs(z) > z2) w++; } return { u: u / R, d: d / R, w: w / R, R }; });
        let st = null;
        v.render(() => {
          const n = nS.value, t = hT.x, mu = Math.sqrt(n) * t;
          sL.hband(0, 0.05, { color: TC.alpha, alpha: 0.1 });
          sL.fn((x) => env(x, n), { domain: [-1.2, 1.2], color: 'ink', width: 2, dash: [6, 5], n: 300 });
          sL.fn((x) => up(x, n), { domain: [-1.2, 1.2], color: 'teal', width: 2.6, n: 300 });
          sL.fn((x) => dn(x, n), { domain: [-1.2, 1.2], color: 'orange', width: 2.6, n: 300 });
          sL.fn((x) => two(x, n), { domain: [-1.2, 1.2], color: TC.h0, width: 2.6, n: 300 });
          sL.vline(t, { color: TC.sim, width: 1.4, dash: [3, 3] });
          const S = sim(n, +t.toFixed(3));
          [[up(t, n), 'teal', S.u], [dn(t, n), 'orange', S.d], [two(t, n), TC.h0, S.w]].forEach(([p, c, q]) => { sL.dot(t, p, { r: 4.5, color: c }); sL.dot(t, q, { r: 2.6, color: TC.sim }); });
          tag(sL, 'below α on the wrong side', t < 0 ? 0.62 : -0.62, 0.12, { color: 'red', size: 11 });
          // right: Z ~ N(√n θ, 1) and the three regions
          sR.fn((z) => phi(z - mu), { domain: [-5, 5], color: TC.h1, width: 2.4, n: 300, fill: TC.h1, fillAlpha: 0.1 });
          sR.fn(phi, { domain: [-5, 5], color: TC.h0, width: 1.2, dash: [4, 4], n: 200 });
          sR.hline(0, { color: 'muted', width: 1 });
          const rows = [[-0.12, 'teal', [[za, 5]], up(t, n), 'upper'], [-0.26, 'orange', [[-5, -za]], dn(t, n), 'lower'], [-0.4, TC.h0, [[-5, -z2], [z2, 5]], two(t, n), 'two-sided']];
          for (const [y, c, R, p, nm] of rows) {
            for (const [a, b] of R) { sR.rect(a, y - 0.04, b, y + 0.04, { fill: c, fillAlpha: 0.6, stroke: false }); area(sR, (z) => phi(z - mu), a, b, c, 0.18); }
            tag(sR, `${nm}: ${v.fix(p, 3)}`, 0, y, { color: c, size: 11 });
          }
          sR.text('true law of Z', mu, phi(0), { color: TC.h1, size: 11, dy: -10 });
          v.legend([['teal', 'upper one-sided'], ['orange', 'lower one-sided'], [TC.h0, 'two-sided'], ['ink', 'power envelope', { dash: true }], [TC.sim, 'simulated (4,000 samples)', { dot: true }]]);
          st = { n, t, S, e: env(t, n), u: up(t, n), d: dn(t, n), w: two(t, n) };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, t, S, e, u, d, w } = st;
          const best = t > 0 ? 'upper' : 'lower';
          return String.raw`at $\theta=${v.fix(t, 2)}$, $n=${n}$: power upper ${v.fix(u, 3)} (sim ${v.fix(S.u, 3)}), lower ${v.fix(d, 3)} (sim ${v.fix(S.d, 3)}), two-sided ${v.fix(w, 3)} (sim ${v.fix(S.w, 3)}) · envelope ${v.fix(e, 3)}, attained only by the ${best} test · the ${best === 'upper' ? 'lower' : 'upper'} test has power ${v.fix(best === 'upper' ? d : u, 4)} < α here · two-sided shortfall ${v.fix(e - w, 3)} > 0: **no test attains the envelope on both sides**`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.9
    {
      num: '6.9',
      kind: 'Method',
      name: 'Likelihood ratio test',
      statement: String.raw`For $H_0:\theta\in\Theta_0$ against $H_1:\theta\in\Theta\setminus\Theta_0$ with likelihood $L(\theta\mid x)$, the **likelihood ratio statistic** is
$$\lambda(x)=\frac{\sup_{\theta\in\Theta_0}L(\theta\mid x)}{\sup_{\theta\in\Theta}L(\theta\mid x)}\in[0,1],$$
the best explanation the null can offer divided by the best overall (stat-3.5: the denominator is the likelihood at the MLE). A **likelihood ratio test (LRT)** rejects when $\lambda(x)\le c$, equivalently when $-2\log\lambda(x)=2\{\ell(\hat\theta)-\ell(\hat\theta_0)\}\ge c'$, with $c'$ chosen for size $\alpha$ from the exact null distribution of $-2\log\lambda$ or from its $\chi^2$ limit (Wilks, stat-6.10). For a simple null $\theta=\theta_0$ the statistic is twice the drop of the log-likelihood from its peak to $\theta_0$; the values of $\theta_0$ not rejected at level $\alpha$ form a likelihood-ratio confidence set.`,
      idea: String.raw`The Neyman–Pearson lemma says to threshold the likelihood ratio when both hypotheses are simple; the LRT extends the recipe to composite hypotheses by letting each side choose its best parameter. It is invariant under reparametrization, uses only the likelihood, and in many classical problems reproduces the familiar test (the $t$-test for a normal mean, the $F$-test in regression, the $G$-test for counts). Reading it off the log-likelihood curve is direct: the farther $\theta_0$ is from the peak in height, the stronger the evidence against it.`,
      caption: String.raw`Left: the log-likelihood $\ell(\theta)-\ell(\hat\theta)$ for $x$ successes in $n$ trials (or a Poisson total). Drag the gold null value $\theta_0$; the purple drop is $\tfrac12(-2\log\lambda)$ and the red dashed line is the cutoff $\tfrac12\chi^2_{1,0.95}=1.92$; the green bar is the set of $\theta_0$ the test would not reject. Change the data with the sliders. Right: the **exact** null distribution of $-2\log\lambda$ at $\theta_0$, obtained by listing every possible outcome, against the $\chi^2_1$ density, with the observed value; the readout compares the exact $p$-value with the $\chi^2$ approximation.`,
      deps: ['stat-6.4', 'stat-3.5'],
      see: ['stat-8.9', 'stat-13.13'],
      refs: ['Casella–Berger §8.2', 'Wasserman §10.6'],
      tags: ['likelihood ratio test', 'log-likelihood'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Likelihood-ratio_test' },
      viz(v) {
        const modS = v.select('model', [{ value: 'bin', label: 'binomial' }, { value: 'pois', label: 'Poisson' }], 'bin', { onChange: () => home() });
        const nS = v.slider('$n$ (trials or observations)', 3, 100, 20, { int: true, onChange: () => { xS.set(Math.min(xS.value, modS.value === 'bin' ? nS.value : 999)); } });
        const xS = v.slider('observed total $x$', 0, 100, 7, { int: true });
        const sL = v.stage({ x: [0, 1], y: [-6, 0.6], axes: 'box', gutter: true, height: 350, weight: 1.05, xlabel: '$p$', ylabel: '$\\ell(\\theta)-\\ell(\\hat\\theta)$', title: 'the log-likelihood and the drop at $\\theta_0$' });
        const sR = v.stage({ x: [0, 10], y: [0, 1], axes: 'box', gutter: true, height: 350, weight: 0.95, minWidth: 250, xlabel: '$-2\\log\\lambda$', ylabel: 'density', title: 'exact null distribution of $-2\\log\\lambda$' });
        const hP = sL.handle(0.5, -4.8, { color: TC.sim, label: '$\\theta_0$', labelPos: 'ne', constrain: (x) => [clamp(x, xr()[0] + 1e-3, xr()[1]), -4.8] });
        const xr = () => { if (modS.value === 'bin') return [0.001, 0.999]; const n = nS.value, lh = Math.max(xS.value, 1) / n; return [0.001, lh + 6 * Math.sqrt(Math.max(lh, 0.5) / n) + 0.15]; };
        const home = () => { const r = xr(); sL.setView([0, r[1]], [-6, 0.6]); sL.setLabels(modS.value === 'bin' ? '$p$' : '$\\lambda$'); hP.set(modS.value === 'bin' ? 0.5 : Math.max(0.2, (1.6 * Math.max(1, xS.value)) / nS.value), -4.8); };
        const ll = (m, n, x, t) => (m === 'bin' ? (x ? x * Math.log(t) : 0) + (n - x ? (n - x) * Math.log(1 - t) : 0) : (x ? x * Math.log(t) : 0) - n * t);
        const mle = (m, n, x) => (m === 'bin' ? x / n : x / n);
        const stat = (m, n, x, t) => 2 * (ll(m, n, x, mle(m, n, x)) - ll(m, n, x, t));
        const pmf = (m, n, x, t) => (m === 'bin' ? dbinom(x, n, t) : Math.exp((x ? x * Math.log(n * t) : 0) - n * t - lfact(x)));
        let st = null;
        home();
        v.render(() => {
          const m = modS.value, n = nS.value;
          if (m === 'bin' && xS.value > n) xS.set(n);
          const x = xS.value, th = mle(m, n, x), t0 = hP.x, r = xr();
          sL.setView([0, r[1]], [-6, 0.6]);
          const f = (t) => ll(m, n, x, t) - ll(m, n, x, th);
          // likelihood interval {θ: drop ≤ 1.92}
          const cut = qchi(1, 0.95) / 2, root = (a, b) => { for (let i = 0; i < 60; i++) { const c = 0.5 * (a + b); if ((f(c) + cut) * (f(a) + cut) <= 0) b = c; else a = c; } return 0.5 * (a + b); };
          const lo = th <= r[0] || f(r[0]) > -cut ? 0 : root(r[0], th), hi = f(r[1]) > -cut ? r[1] : root(th, r[1]);
          sL.rect(lo, -6, hi, -5.82, { fill: 'green', fillAlpha: 0.6, stroke: false });
          sL.text('not rejected at 5%', 0.5 * (lo + hi), -5.82, { color: 'green', size: 11, dy: -8, weight: 600 });
          sL.hline(-cut, { color: TC.alpha, width: 1.4, dash: [6, 4] });
          sL.text('cutoff −1.92', r[1], -cut, { color: TC.alpha, size: 11, align: 'right', dx: -4, dy: -9 });
          sL.fn(f, { domain: [r[0], r[1]], color: TC.h0, width: 2.8, n: 400 });
          sL.dot(th, 0, { r: 4.5, color: TC.h0 }); sL.tex('\\hat\\theta', th, 0, { color: TC.h0, size: 14, dy: -12 });
          const d0 = f(t0);
          sL.vline(t0, { color: TC.sim, width: 1.2, dash: [3, 3] });
          sL.line(t0, Math.max(d0, -6), t0, 0, { color: TC.h1, width: 4 });
          sL.line(Math.min(t0, th), 0, Math.max(t0, th), 0, { color: 'faint', width: 1, dash: [2, 3] });
          tag(sL, `drop ${v.fix(-d0, 2)}`, t0, Math.max(d0, -5.2) / 2, { color: TC.h1, align: t0 > th ? 'left' : 'right', dx: t0 > th ? 8 : -8, size: 11 });
          // exact null distribution of −2 log λ at θ0
          const K = m === 'bin' ? n : Math.ceil(n * t0 + 10 * Math.sqrt(n * t0) + 20), lam = [], P = [];
          for (let k = 0; k <= K; k++) { lam.push(stat(m, n, k, t0)); P.push(pmf(m, n, k, t0)); }
          const obs = stat(m, n, x, t0);
          let pex = 0; for (let k = 0; k <= K; k++) if (lam[k] >= obs - 1e-9) pex += P[k];
          const w = 0.25, nb = 40, cnt = new Array(nb).fill(0);
          for (let k = 0; k <= K; k++) { const b = Math.floor(lam[k] / w); if (b < nb) cnt[b] += P[k]; }
          const dens = cnt.map((c) => c / w), top = Math.min(2.2, Math.max(1.0, ...dens.slice(1)) * 1.1);
          sR.setView([0, 10], [0, top]);
          dens.forEach((d, b) => { if (d > 0) sR.rect(b * w, 0, (b + 1) * w, Math.min(d, top * 0.995), { fill: TC.h0, fillAlpha: 0.3, color: TC.h0, width: 1 }); });
          sR.fn((u) => dchisq1(u), { domain: [0.03, 10], color: 'ink', width: 2.2, n: 300 });
          sR.vline(Math.min(obs, 9.95), { color: TC.sim, width: 2.6 });
          sR.vline(qchi(1, 0.95), { color: TC.alpha, width: 1.2, dash: [5, 4] });
          tag(sR, `observed ${v.fix(obs, 2)}`, Math.min(obs, 9.9), top * 0.9, { align: obs > 6 ? 'right' : 'left', dx: obs > 6 ? -6 : 6, size: 11 });
          v.legend([[TC.h0, 'log-likelihood'], [TC.h1, 'drop at θ₀'], ['green', 'LR confidence set', { area: true }], [TC.h0, 'exact null law of −2 log λ', { area: true }], ['ink', '$\\chi^2_1$ density']]);
          st = { m, n, x, th, t0, obs, pex, pchi: chiUp(1, obs), lo, hi };
        });
        v.readout(() => {
          if (!st) return '';
          const { m, n, x, th, t0, obs, pex, pchi, lo, hi } = st, p = m === 'bin' ? 'p' : '\\lambda';
          return String.raw`$x=${x}$, $n=${n}$, $\hat ${p}=${v.fix(th, 3)}$ · at $${p}_0=${v.fix(t0, 3)}$: $-2\log\lambda=${v.fix(obs, 3)}$ ${obs >= 3.841 ? '≥' : '<'} 3.841 → **${obs >= 3.841 ? 'reject' : 'retain'}** · exact $p$-value ${pfmt(pex)} vs $\chi^2_1$ approximation ${pfmt(pchi)} · 95% likelihood-ratio set $[${v.fix(lo, 3)}, ${v.fix(hi, 3)}]$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.10
    {
      num: '6.10',
      kind: 'Theorem',
      name: 'Wilks’ theorem',
      credit: 'S. S. Wilks, 1938',
      statement: String.raw`Let $X_1,\dots,X_n$ be i.i.d. from a regular parametric family with $\Theta$ an open subset of $\R^p$ (the conditions of stat-5.2), and let $H_0:\theta\in\Theta_0$, where $\Theta_0$ is a smooth $(p-r)$-dimensional submanifold (e.g. $r$ coordinates fixed). If the true $\theta$ lies in the **interior** of $\Theta$ and in $\Theta_0$, the likelihood ratio statistic satisfies
$$-2\log\lambda_n=2\{\ell_n(\hat\theta)-\ell_n(\hat\theta_0)\}\ \xrightarrow{\ d\ }\ \chi^2_r,$$
the chi-squared law with $r$ = number of independent restrictions (stat-1.8). So rejecting when $-2\log\lambda_n>\chi^2_{r,1-\alpha}$ has asymptotic size $\alpha$. If instead the null value lies on the **boundary** of the parameter space, the limit changes: for one parameter restricted to $\theta\ge\theta_0$ and tested at $\theta_0$, it is the 50:50 mixture $\tfrac12\chi^2_0+\tfrac12\chi^2_1$ (Chernoff, 1954).`,
      idea: String.raw`Near the MLE the log-likelihood is a quadratic with curvature $nI(\theta)$ (stat-5.2), and $\sqrt n(\hat\theta-\theta)$ is approximately $N(0,I^{-1})$. In coordinates where $I$ is the identity, $2\{\ell_n(\hat\theta)-\ell_n(\theta)\}\approx\|Z\|^2$ for a standard normal vector $Z\in\R^p$, and maximizing over $\Theta_0$ projects $Z$ onto a $(p-r)$-dimensional subspace, so the drop is the squared length of the projection onto the $r$-dimensional complement: $\chi^2_r$. At a boundary the MLE cannot cross $\theta_0$: half the time it sticks at $\theta_0$ and the statistic is exactly 0.`,
      caption: String.raw`Left: the histogram of $-2\log\lambda$ over thousands of data sets simulated under the null, against the $\chi^2_r$ density. Right: the $p$-values computed from $\chi^2_r$, which should look uniform. Choose a model and grow $n$: a Poisson mean ($r=1$), an exponential rate ($r=1$), a normal mean and variance both fixed ($r=2$), a fair die ($r=5$, the $G$-test). At small $n$ the discrete models give lumpy, slightly anti-conservative histograms that smooth out. Choose the **variance at its boundary** ($X_i\sim N(0,1+\tau^2)$, testing $\tau^2=0$ with $\tau^2\ge0$): about half the statistics are exactly 0 (the gold bar), the rest follow $\tfrac12\chi^2_1$, and the naive $\chi^2_1$ $p$-values pile up at 1.`,
      deps: ['stat-6.9', 'stat-5.2', 'stat-1.8'],
      see: ['stat-5.5', 'stat-6.14'],
      refs: ['Casella–Berger §10.3', 'Wasserman §10.6'],
      tags: ['likelihood ratio test', 'chi-squared', 'asymptotics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wilks%27_theorem' },
      viz(v) {
        const MOD = {
          pois: { lab: 'Poisson mean', k: 1 }, expo: { lab: 'exponential rate', k: 1 }, norm2: { lab: 'normal $(\\mu,\\sigma^2)$', k: 2 }, die: { lab: 'fair die', k: 5 }, bdry: { lab: 'variance at boundary', k: 1, bdry: true },
        };
        const modS = v.select('null model', Object.entries(MOD).map(([value, m]) => ({ value, label: m.lab })), 'pois');
        const nS = v.slider('sample size $n$', 3, 500, 20, { int: true, log: true });
        const sL = v.stage({ x: [0, 10], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: '$-2\\log\\lambda$', ylabel: 'density', title: 'null distribution of $-2\\log\\lambda$' });
        const sR = v.stage({ x: [0, 1], y: [0, 2], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 240, xlabel: '$p$-value from $\\chi^2_r$', ylabel: 'density', title: '$p$-values (uniform if Wilks holds)' });
        const one = (k, n, r) => {
          if (k === 'pois') { const l0 = 1.5; let s = 0; for (let i = 0; i < n; i++) s += rpois(r, l0); const m = s / n; return 2 * n * ((m > 0 ? m * Math.log(m / l0) : 0) - (m - l0)); }
          if (k === 'expo') { let s = 0; for (let i = 0; i < n; i++) s += -Math.log(1 - r()); const m = s / n; return 2 * n * (m - 1 - Math.log(m)); }
          if (k === 'norm2') { let s = 0, q = 0; const xs = new Float64Array(n); for (let i = 0; i < n; i++) { xs[i] = r.normal(); s += xs[i]; } const m = s / n; for (let i = 0; i < n; i++) q += (xs[i] - m) ** 2; const s2 = q / n; return n * (m * m + s2 - 1 - Math.log(s2)); }
          if (k === 'die') { const O = [0, 0, 0, 0, 0, 0]; for (let i = 0; i < n; i++) O[Math.floor(6 * r())]++; const E = n / 6; let g = 0; for (const o of O) if (o > 0) g += o * Math.log(o / E); return 2 * g; }
          let q = 0; for (let i = 0; i < n; i++) { const z = r.normal(); q += z * z; } const s = q / n; return s > 1 ? n * (s - 1 - Math.log(s)) : 0;
        };
        const R = repeater(v, { key: () => [modS.value, nS.value].join('|'), sample: (r) => one(modS.value, nS.value, r), init: 5000, buttons: [5000, 20000], seed: 'stat6.10' });
        let st = null;
        v.render(() => {
          const S = R.sync(), L = S.vals, k = modS.value, M = MOD[k], df = M.k, N = L.length;
          const xmax = Math.max(8, qchi(df, 0.995) * 1.05);
          const B = binned(L, 0, xmax, 48), w = xmax / 48;
          let zeros = 0; for (const x of L) if (x <= 1e-12) zeros++;
          const f = M.bdry ? (x) => 0.5 * dchi(1, x) : (x) => dchi(df, x);
          const dens = B.density.slice(); if (M.bdry) dens[0] = Math.max(0, (B.counts[0] - zeros) / (N * w));
          const top = Math.min(Math.max(f(df > 2 ? df - 2 : 0.6 * w) * 1.4, Math.max(...dens.slice(1)) * 1.15, 0.3), 1.2);
          sL.setView([0, xmax], [0, top]);
          if (N) sL.hist({ edges: B.edges, counts: B.counts.map((c, i) => (i === 0 && M.bdry ? c - zeros : c)), density: dens, total: N }, { density: true, color: TC.sim, fillAlpha: 0.35, width: 1.2 });
          sL.fn(f, { domain: [Math.min(0.02, w / 4), xmax], color: M.bdry ? 'green' : 'ink', width: 2.4, n: 400 });
          if (M.bdry) { sL.fn((x) => dchi(1, x), { domain: [0.02, xmax], color: 'red', width: 1.6, dash: [6, 4], n: 300 }); sL.rect(0, 0, w * 0.6, top * 0.97, { fill: TC.sim, fillAlpha: 0.9, stroke: false }); tag(sL, `mass at 0: ${pct(zeros / Math.max(1, N))}`, w * 0.8, top * 0.88, { align: 'left', color: 'ink', size: 11 }); }
          const cut = qchi(df, 0.95);
          sL.vline(cut, { color: TC.alpha, width: 1.4, dash: [5, 4] });
          sL.text(`χ² 5% cut ${v.fix(cut, 2)}`, cut, top * 0.97, { color: TC.alpha, size: 11, align: 'left', dx: 5, dy: 6 });
          // p-values from χ²_df
          const P = L.map((x) => chiUp(df, x)), PB = binned(P, 0, 1, 20), ptop = Math.max(2, PB.max * 1.1);
          sR.setView([0, 1], [0, ptop]);
          sR.hline(1, { color: 'green', width: 2 });
          if (N) sR.hist(PB, { density: true, color: TC.sim, fillAlpha: 0.35, width: 1.2 });
          sR.vband(0, 0.05, { color: TC.alpha, alpha: 0.12 });
          const rej = L.filter((x) => x > cut).length / Math.max(1, N);
          v.legend([[TC.sim, `simulated, ${commas(N)} null data sets`, { area: true }], M.bdry ? ['green', '$\\frac12\\chi^2_0+\\frac12\\chi^2_1$ (continuous part)'] : ['ink', `$\\chi^2_{${df}}$ density`], ...(M.bdry ? [['red', '$\\chi^2_1$ (wrong reference)', { dash: true }]] : []), ['green', 'uniform density']]);
          st = { k, M, df, N, rej, zeros, n: nS.value, mean: L.reduce((a, b) => a + b, 0) / Math.max(1, N) };
        });
        v.readout(() => {
          if (!st) return '';
          const { M, df, N, rej, zeros, n, mean } = st;
          let s = String.raw`${M.lab}, $n=${n}$, ${commas(N)} null data sets: mean of $-2\log\lambda$ **${v.fix(mean, 3)}** (χ²$_{${df}}$ mean ${M.bdry ? '0.5 for the mixture' : df}) · rejection rate at the χ²$_{${df}}$ 5% cutoff **${pct(rej, 2)}** ± ${pct(2 * mcse(0.05, N), 2)}`;
          if (M.bdry) s += String.raw` · ${pct(zeros / N)} of the statistics are exactly 0 (theory 50%): the true null value sits on the edge of $\tau^2\ge0$, Wilks' interior condition fails, and the naive test has size about 2.5%; the correct mixture $p$-value is $\tfrac12P(\chi^2_1>x)$`;
          else s += Math.abs(rej - 0.05) < 2.5 * mcse(0.05, N) ? ' · matches the nominal 5% ✓' : ' · not yet at the limit: grow n';
          return s;
        });
      },
    },
  ],
};
