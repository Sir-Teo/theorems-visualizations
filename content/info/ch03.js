// Information & Coding Theory — Chapter 3: Typical sequences and the AEP (items 3.1–3.8; 3.9–3.15 in ch03-b.js)
//
// House style as in chapters 1–2: logarithms base 2 (bits); the source p is blue, the model q orange, typical things and
// entropies green, failures red, sampled data gold. Everything is computed exactly in the log domain (binomials,
// multinomials) or by seeded simulation, never faked. Sources for credits were checked in Oct 2026 (Crossref records).

import { clamp, sum, H, h2, KL, commas, hashStr, LET, lnFact, lbinom, lmult, lse2, lbinPmf, lseqP, binomCdf, cdfPick, typeRound, lQclass,
  simXY, simP, simStage, drawSimplex, simHandle } from './ch03.shared.js';

const log2 = Math.log2;
const pw2 = (x) => Math.pow(2, x);
/** "2^{x}" as plain text with a readable magnitude, e.g. 2^{41.3} ≈ 2.8·10^{12}. */
const big = (v, lg) => { if (lg < 40) return commas(pw2(lg)); const e = lg * Math.log10(2), m = Math.floor(e); return `${v.fix(pw2((e - m) * log2(10)), 1)}·10^${m}`; };
const isTyp = (n, k, p, eps) => Math.abs(-lseqP(n, k, p) / n - h2(p)) <= eps + 1e-12;

export default {
  collection: 'info',
  chapter: 3,
  title: 'Typical sequences and the AEP',
  summary: String.raw`For long sequences from a memoryless source, the law of large numbers makes $-\frac1n\log p(X^n)$ concentrate at the entropy. Nearly all the probability therefore sits on a typical set of about $2^{nH}$ roughly equiprobable sequences, a vanishing fraction of all sequences whenever the source is not uniform. Counting sequences by type sharpens this into exponential estimates such as Sanov's theorem and the Chernoff–Stein lemma, and the same ideas extend to Markov and other stationary sources through the entropy rate.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Theorem',
      name: 'Asymptotic equipartition property',
      statement: String.raw`Let $X_1,X_2,\dots$ be independent and identically distributed with finite-alphabet pmf $p$ and entropy $H=H(X)$. Then
$$-\frac1n\log_2 p(X_1,\dots,X_n)\ \longrightarrow\ H\qquad\text{in probability},$$
that is, for every $\varepsilon>0$, $\Pr\big(\big|-\tfrac1n\log p(X^n)-H\big|>\varepsilon\big)\to0$. In words: a long sequence drawn from $p$ has, with probability near $1$, probability close to $2^{-nH}$ ("equipartition": the likely sequences share the probability almost equally, on the exponential scale). Independence is used; for sources with memory see 3.15.`,
      idea: String.raw`Because the letters are independent, $-\log p(X^n)=\sum_i -\log p(X_i)$ is a sum of $n$ i.i.d. random variables $-\log p(X_i)$, each with mean $H(X)$ (1.2) and finite variance since the alphabet is finite. The weak law of large numbers says their average converges to the mean; Chebyshev even gives the rate, $\Pr(|\cdot|>\varepsilon)\le\sigma^2/(n\varepsilon^2)$. Nothing deeper is needed, which is the point: the entropy is the exponential rate at which the probability of a typical sequence decays.

On a finite source support, $Z_i=-\log_2p(X_i)$ are bounded i.i.d. variables with mean $H$ and finite variance $\sigma^2$. The $L^2$ weak law prob-2.2.3 gives mean-square error $\sigma^2/n$. Applying prob-1.6.4 to the squared centred average yields the explicit probability bound $\sigma^2/(n\varepsilon^2)$. Symbols of zero probability never occur, so they do not introduce infinite values into these random variables.`,
      caption: String.raw`Slide $n$ and watch the histogram of $-\frac1n\log_2p(x^n)$ for 4000 random sequences collapse onto the green line $H(p)$ with width $\propto1/\sqrt n$; the right panel is the exact probability of lying within $\pm\varepsilon$ of $H$, tending to $1$ (the gold dot is the sampled fraction). At $p=\tfrac12$ every sequence has the same probability and the statement is trivial.`,
      deps: ['info-1.2', 'prob-2.2.3', 'prob-1.6.4'],
      refs: ['Cover–Thomas §3.1', 'MacKay ch. 4'],
      tags: ['AEP', 'law of large numbers'],
      credit: 'C. E. Shannon, 1948 (the equipartition statement is the weak law of large numbers applied to −log p)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Asymptotic_equipartition_property' },
      viz(v) {
        const pS = v.slider(String.raw`$p=P(X=1)$`, 0.05, 0.95, 0.2, { step: 0.01 });
        const nS = v.slider('length $n$', 1, 2000, 100, { log: true, int: true });
        const eS = v.slider(String.raw`band $\varepsilon$`, 0.02, 0.3, 0.1, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const M = 4000, NB = 50;
        const s = v.stage({ x: [0, 1], y: [0, 1], height: 250, axes: 'box', gutter: true, xlabel: '−(1/n) log₂ p(xⁿ)  [bits per symbol]', ylabel: 'fraction of sequences', title: '4000 random sequences of length $n$' });
        const s2 = v.stage({ x: [1, 2000], y: [0, 1.05], xlog: true, height: 250, axes: 'box', gutter: true, xlabel: 'length n', ylabel: 'P(within ε of H)', title: 'exact probability of the band' });
        let cache = null, curve = null, info = {};
        v.render(() => {
          const p = pS.value, q = 1 - p, n = nS.value, eps = eS.value, Hh = h2(p);
          const key = `${p}|${n}|${seed}`;
          if (!cache || cache.key !== key) {
            const cdf = binomCdf(n, p), r = v.rng(hashStr(key)), vals = new Float64Array(M);
            for (let i = 0; i < M; i++) vals[i] = -lseqP(n, cdfPick(cdf, r()), p) / n;
            cache = { key, vals };
          }
          const ckey = `${p}|${eps}`;
          if (!curve || curve.key !== ckey) {
            const pts = [];
            for (let i = 0; i <= 70; i++) {
              const m = Math.round(Math.pow(2000, i / 70)); if (pts.length && pts[pts.length - 1][0] === m) continue;
              let t = 0; for (let k = 0; k <= m; k++) if (isTyp(m, k, p, eps)) t += pw2(lbinPmf(m, k, p));
              pts.push([m, Math.min(1, t)]);
            }
            curve = { key: ckey, pts };
          }
          const xmax = Math.max(-log2(p), -log2(q)), bw = xmax / NB, cnt = new Array(NB).fill(0);
          let m1 = 0, inb = 0;
          for (const x of cache.vals) { cnt[Math.min(NB - 1, Math.floor(x / bw))]++; m1 += x; if (Math.abs(x - Hh) <= eps + 1e-12) inb++; }
          m1 /= M; let sd = 0; for (const x of cache.vals) sd += (x - m1) ** 2; sd = Math.sqrt(sd / M);
          const top = Math.max(0.05, Math.max(...cnt) / M * 1.18);
          s.setView([0, xmax * 1.0001], [0, top]);
          s.vband(Hh - eps, Hh + eps, { color: 'green', alpha: 0.13 });
          cnt.forEach((c, i) => { if (c) s.rect(i * bw, 0, (i + 1) * bw, c / M, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1 }); });
          s.vline(Hh, { color: 'green', width: 2.2 });
          s.text(`H = ${v.fix(Hh, 3)}`, Hh, top, { dx: 6, dy: 12, size: 11.5, color: 'green', weight: 600 });
          s2.path(curve.pts, { color: 'accent', width: 2 });
          s2.hline(1, { color: 'faint', dash: true });
          const ex = curve.pts.reduce((b, pt) => (Math.abs(pt[0] - n) < Math.abs(b[0] - n) ? pt : b));
          s2.vline(n, { color: 'faint', dash: true });
          s2.dot(n, inb / M, { r: 5, color: 'gold' });
          info = { Hh, m1, sd, frac: inb / M, exact: ex[1], exn: ex[0], th: Math.sqrt(p * q) * Math.abs(log2(q / p)) / Math.sqrt(n), n, eps };
        });
        v.readout(() => String.raw`$H(p)=${v.fix(info.Hh, 3)}$ bits. At $n=${info.n}$ the sampled values have mean $${v.fix(info.m1, 3)}$ and standard deviation $${v.fix(info.sd, 3)}$ (theory $\sigma/\sqrt n=${v.fix(info.th, 3)}$). A fraction $${v.fix(info.frac, 3)}$ lies within $\pm${v.fix(info.eps, 2)}$ of $H$; the exact probability (at $n=${info.exn}$) is $${v.fix(info.exact, 3)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Typical set',
      statement: String.raw`For $\varepsilon>0$ and $n\ge1$, the **(weakly) typical set** $A_\varepsilon^{(n)}$ of an i.i.d. source $p$ is the set of sequences $x^n$ whose probability is within an exponential factor of $2^{-nH}$:
$$A_\varepsilon^{(n)}=\Big\{x^n:\ 2^{-n(H+\varepsilon)}\le p(x^n)\le 2^{-n(H-\varepsilon)}\Big\}=\Big\{x^n:\ \Big|-\tfrac1n\log p(x^n)-H\Big|\le\varepsilon\Big\}.$$
It is a set of sequences, defined through the sequence probability $p(x^n)$ alone; by 3.1 it has probability close to $1$ for large $n$. For a binary source, $p(x^n)$ depends only on the number $k$ of ones, so membership is a condition on $k$.`,
      idea: String.raw`The definition just names the event whose probability 3.1 controls. For a binary source $-\frac1n\log p(x^n)=-\frac kn\log p-(1-\frac kn)\log(1-p)$ is a straight line in the fraction $k/n$ of ones, equal to $H$ at $k/n=p$ (where it is the expected cost, 1.2), so the typical set is a band of values of $k$ around $np$. It is *not* "the most probable sequences" (3.5) and not defined by the count of ones as such: it is defined by probability, and for a non-binary alphabet the same line becomes a linear function of the type (3.6).`,
      caption: String.raw`Slide $n$ ($\le 24$, so all $2^n$ sequences can be counted), the bias $p$ and the tolerance $\varepsilon$. Top: the value $-\frac1n\log p(x^n)$ of every class of sequences with $k$ ones; classes inside the green band are typical. Middle: the share of all sequences in each class. Bottom: the probability of each class. The typical classes are a small share of the sequences but hold most of the probability.`,
      deps: ['info-3.1'],
      refs: ['Cover–Thomas §3.1'],
      tags: ['typical set', 'AEP'],
      credit: 'C. E. Shannon, 1948 (typical sequences); the name and notation follow Cover & Thomas',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Typical_set' },
      viz(v) {
        const nS = v.slider('length $n$', 2, 24, 14, { int: true });
        const pS = v.slider(String.raw`$p=P(X=1)$`, 0.05, 0.95, 0.25, { step: 0.01 });
        const eS = v.slider(String.raw`tolerance $\varepsilon$`, 0.02, 0.4, 0.15, { step: 0.01 });
        const s1 = v.stage({ x: [0, 1], y: [0, 1], height: 220, axes: 'box', gutter: true, xlabel: 'k', ylabel: '−(1/n) log₂ p(xⁿ)', title: 'the definition: per-symbol cost of a sequence with $k$ ones' });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], height: 220, axes: 'box', gutter: true, xlabel: 'k', ylabel: 'share of the 2ⁿ sequences', title: 'how many sequences have $k$ ones' });
        const s3 = v.stage({ x: [0, 1], y: [0, 1], height: 220, axes: 'box', gutter: true, xlabel: 'k', ylabel: 'probability', title: 'probability of the class' });
        let info = {};
        v.render(() => {
          const n = nS.value, p = pS.value, eps = eS.value, Hh = h2(p), q = 1 - p;
          const ticks = []; for (let k = 0; k <= n; k += n > 14 ? 2 : 1) ticks.push([k, String(k)]);
          const cost = (k) => -lseqP(n, k, p) / n, ymax = Math.max(-log2(p), -log2(q)) * 1.08;
          [s1, s2, s3].forEach((s) => s.setTicks(ticks, null));
          s1.setView([-0.7, n + 0.7], [0, ymax]);
          s1.hband(Hh - eps, Hh + eps, { color: 'green', alpha: 0.13 });
          s1.hline(Hh, { color: 'green', width: 1.6 });
          s1.path([[0, cost(0)], [n, cost(n)]], { color: 'muted', width: 1.2 });
          let cntT = 0, pT = 0, lg = [];
          const shares = [], probs = [];
          for (let k = 0; k <= n; k++) {
            const t = isTyp(n, k, p, eps), c = pw2(lbinom(n, k)), pk = pw2(lbinPmf(n, k, p));
            shares.push(c / pw2(n)); probs.push(pk);
            if (t) { cntT += Math.round(c); pT += pk; }
            s1.dot(k, cost(k), { r: 5, color: t ? 'green' : 'red' });
          }
          const wd = 0.38, m2 = Math.max(...shares) * 1.15, m3 = Math.max(...probs) * 1.15;
          s2.setView([-0.7, n + 0.7], [0, m2]); s3.setView([-0.7, n + 0.7], [0, m3]);
          for (let k = 0; k <= n; k++) {
            const t = isTyp(n, k, p, eps), c = t ? 'green' : 'accent';
            s2.rect(k - wd, 0, k + wd, shares[k], { fill: c, fillAlpha: t ? 0.55 : 0.28, color: c, width: 1.2 });
            s3.rect(k - wd, 0, k + wd, probs[k], { fill: c, fillAlpha: t ? 0.55 : 0.28, color: c, width: 1.2 });
          }
          info = { n, eps, cntT, pT, H: Hh, lo: n * (Hh - eps), hi: n * (Hh + eps) };
        });
        v.legend([['green', 'typical class (within $\\varepsilon$)', { area: true }], ['red', 'atypical value', { dot: true }], ['accent', 'atypical class', { area: true }]]);
        v.readout(() => String.raw`$n=${info.n}$, $H=${v.fix(info.H, 3)}$ bits, so a typical sequence has probability between $2^{-${v.fix(info.hi, 1)}}$ and $2^{-${v.fix(info.lo, 1)}}$. There are $|A_\varepsilon^{(n)}|=${commas(info.cntT)}$ typical sequences out of $2^{${info.n}}=${commas(pw2(info.n))}$ ($${v.fix(100 * info.cntT / pw2(info.n), 2)}\%$ of them), and together they carry probability $${v.fix(info.pT, 4)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Size and probability of the typical set',
      statement: String.raw`Let $A_\varepsilon^{(n)}$ be the typical set of an i.i.d. source with entropy $H$ (3.2). Then
(a) $\Pr\big(A_\varepsilon^{(n)}\big)\ge1-\varepsilon$ for all sufficiently large $n$;
(b) $\big|A_\varepsilon^{(n)}\big|\le 2^{n(H+\varepsilon)}$ for every $n$;
(c) $\big|A_\varepsilon^{(n)}\big|\ge(1-\varepsilon)\,2^{n(H-\varepsilon)}$ for all sufficiently large $n$.
So $\frac1n\log|A_\varepsilon^{(n)}|\in[H-\varepsilon-\tfrac1n\log\tfrac1{1-\varepsilon},\,H+\varepsilon]$ eventually: the typical set has about $2^{nH}$ elements, a fraction $2^{-n(\log|\mathcal X|-H)}$ of all sequences.`,
      idea: String.raw`(a) is the AEP (3.1). For (b), each $x^n\in A_\varepsilon^{(n)}$ has $p(x^n)\ge2^{-n(H+\varepsilon)}$ and the probabilities of all of them add to at most $1$, so there are at most $2^{n(H+\varepsilon)}$ of them. For (c), by (a) the set has probability at least $1-\varepsilon$ while each member has probability at most $2^{-n(H-\varepsilon)}$, so there must be at least $(1-\varepsilon)2^{n(H-\varepsilon)}$ members. No other property of the source enters.`,
      caption: String.raw`Left: the exact exponent $\frac1n\log_2|A_\varepsilon^{(n)}|$ (blue) for $n=1,\dots,300$ against the green line $H$ and the orange band $H\pm\varepsilon$; it is jagged because the class sizes jump as $k$ crosses the edge of the band. Right: the exact probability of the set, rising through the red line $1-\varepsilon$. Try $p$ near $\tfrac12$ (everything is typical) and a small $\varepsilon$ (convergence needs larger $n$).`,
      deps: ['info-3.2'],
      refs: ['Cover–Thomas §3.1'],
      tags: ['typical set', 'AEP'],
      viz(v) {
        const pS = v.slider(String.raw`$p=P(X=1)$`, 0.05, 0.95, 0.2, { step: 0.01 });
        const eS = v.slider(String.raw`tolerance $\varepsilon$`, 0.03, 0.4, 0.1, { step: 0.01 });
        const NM = 300;
        const s1 = v.stage({ x: [1, NM], y: [0, 1.05], height: 250, axes: 'box', gutter: true, xlabel: 'n', ylabel: '(1/n) log₂ |A|', title: 'size of the typical set, per symbol' });
        const s2 = v.stage({ x: [1, NM], y: [0, 1.05], height: 250, axes: 'box', gutter: true, xlabel: 'n', ylabel: 'P(A)', title: 'probability of the typical set' });
        let cache = null, info = {};
        v.legend([['accent', 'exact $\\frac1n\\log|A|$'], ['green', '$H$'], ['orange', '$H\\pm\\varepsilon$'], ['red', '$1-\\varepsilon$']]);
        v.render(() => {
          const p = pS.value, eps = eS.value, Hh = h2(p), key = `${p}|${eps}`;
          if (!cache || cache.key !== key) {
            const sz = [], pr = []; let n0 = 1, maxUp = -1;
            for (let n = 1; n <= NM; n++) {
              const ls = [], ps = [];
              for (let k = 0; k <= n; k++) if (isTyp(n, k, p, eps)) { ls.push(lbinom(n, k)); ps.push(pw2(lbinPmf(n, k, p))); }
              const L = ls.length ? lse2(ls) : -Infinity, P = sum(ps);
              sz.push(ls.length ? [n, L / n] : null); pr.push([n, Math.min(1, P)]);
              if (P < 1 - eps) n0 = n + 1;
              if (ls.length) maxUp = Math.max(maxUp, L / n - Hh);
            }
            cache = { key, sz, pr, n0, maxUp };
          }
          s1.hband(Hh - eps, Hh + eps, { color: 'orange', alpha: 0.12 });
          s1.hline(Hh, { color: 'green', width: 2 });
          s1.hline(Hh + eps, { color: 'orange', dash: true }); s1.hline(Math.max(0, Hh - eps), { color: 'orange', dash: true });
          s1.path(cache.sz, { color: 'accent', width: 2 });
          s2.hline(1 - eps, { color: 'red', dash: true }); s2.hline(1, { color: 'faint' });
          s2.path(cache.pr, { color: 'accent', width: 2 });
          if (cache.n0 <= NM) s2.vline(cache.n0, { color: 'red', alpha: 0.5, dash: true });
          info = { Hh, eps, n0: cache.n0, maxUp: cache.maxUp, last: cache.pr[NM - 1][1], lastS: cache.sz[NM - 1] };
        });
        v.readout(() => String.raw`$H=${v.fix(info.Hh, 3)}$, $\varepsilon=${v.fix(info.eps, 2)}$. (b) holds at every $n\le${NM}$: the largest value of $\frac1n\log|A|-H$ seen is $${v.fix(info.maxUp, 3)}\le\varepsilon$. (a): $P(A)$ stays above $1-\varepsilon$ from $n=${info.n0 <= NM ? info.n0 : '>' + NM}$ on; at $n=${NM}$ it is $${v.fix(info.last, 4)}$` + (info.lastS ? String.raw` and $\frac1n\log|A|=${v.fix(info.lastS[1], 3)}$, within $\varepsilon$ of $H$.` : '.'));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Smallest high-probability sets have about 2^{nH} elements',
      statement: String.raw`For an i.i.d. source with entropy $H$ and $0<\delta<1$, let $B_\delta^{(n)}$ be a set of **smallest** cardinality among all $B\subseteq\mathcal X^n$ with $\Pr(B)\ge1-\delta$. Then for every $\delta'>0$ and all sufficiently large $n$,
$$\frac1n\log_2\big|B_\delta^{(n)}\big|>H-\delta'$$
and also $\frac1n\log|B_\delta^{(n)}|\le H+\delta'$. Thus the exponent of the smallest set that captures probability $1-\delta$ is $H$ *whatever* $\delta\in(0,1)$ is: the typical set of 3.3 is, on the exponential scale, as small as any set of probability $1-\delta$ can be.`,
      idea: String.raw`The upper bound is 3.3(b): the typical set already has probability $\ge1-\delta$ for large $n$ and at most $2^{n(H+\varepsilon)}$ elements. For the lower bound, intersect any $B$ with $\Pr(B)\ge1-\delta$ with a typical set: $\Pr(B\cap A_\varepsilon)\ge1-\delta-\varepsilon$, and each element of $A_\varepsilon$ has probability at most $2^{-n(H-\varepsilon)}$, so $|B|\ge(1-\delta-\varepsilon)2^{n(H-\varepsilon)}$. The constants $\delta$ and $\varepsilon$ only affect sub-exponential factors.`,
      caption: String.raw`Left: the exponent $\frac1n\log_2|B_\delta^{(n)}|$ of the greedy set (most probable sequences first, last class cut exactly) for three values of $\delta$, against $H$ (green): all three converge to $H$, from different sides and at different speeds. Right: for one $n$, the captured probability as sequences are added, against $\frac1n\log$ of the set size; the curve climbs steeply at $H$.`,
      deps: ['info-3.3'],
      refs: ['Cover–Thomas §3.3'],
      tags: ['typical set', 'data compression'],
      viz(v) {
        const pS = v.slider(String.raw`$p=P(X=1)$`, 0.05, 0.45, 0.2, { step: 0.01 });
        const dS = v.slider(String.raw`$\delta$`, 0.001, 0.5, 0.05, { log: true });
        const nS = v.slider('length $n$ (right panel)', 5, 300, 100, { int: true });
        const NM = 300;
        const s1 = v.stage({ x: [5, NM], y: [0, 1.05], height: 250, axes: 'box', gutter: true, xlabel: 'n', ylabel: '(1/n) log₂ |B|', title: 'exponent of the smallest set of probability $1-\\delta$' });
        const s2 = v.stage({ x: [0, 1], y: [0, 1.05], height: 250, axes: 'box', gutter: true, xlabel: '(1/n) log₂ (number of sequences taken)', ylabel: 'probability captured', title: 'adding the likeliest sequences first' });
        v.legend([['accent', '$\\delta$ (slider)'], ['orange', '$\\delta=0.5$'], ['purple', '$\\delta=0.001$'], ['green', '$H$']]);
        // classes ordered by decreasing per-sequence probability: p<1/2, so fewer ones first
        const classes = (n, p) => { const a = []; for (let k = 0; k <= n; k++) a.push({ k, lc: lbinom(n, k), ls: lseqP(n, k, p) }); a.sort((x, y) => y.ls - x.ls); return a; };
        function smallest(cls, delta) {
          let cum = 0; const lcs = [];
          for (const c of cls) {
            const cp = pw2(c.lc + c.ls);
            if (cum + cp >= 1 - delta) { const need = (1 - delta - cum) / pw2(c.ls); return lse2([...lcs, log2(Math.max(need, 1e-300))]); }
            cum += cp; lcs.push(c.lc);
          }
          return lse2(lcs);
        }
        let cache = null, info = {};
        v.render(() => {
          const p = pS.value, d = dS.value, Hh = h2(p), key = `${p}|${d}`;
          if (!cache || cache.key !== key) {
            const mk = (dl) => { const a = []; for (let n = 5; n <= NM; n++) a.push([n, smallest(classes(n, p), dl) / n]); return a; };
            cache = { key, a: mk(d), b: mk(0.5), c: mk(0.001) };
          }
          s1.hline(Hh, { color: 'green', width: 2 });
          s1.path(cache.b, { color: 'orange', width: 1.6 }); s1.path(cache.c, { color: 'purple', width: 1.6 }); s1.path(cache.a, { color: 'accent', width: 2.4 });
          const n = nS.value, cls = classes(n, p), pts = [[0, 0]]; let cum = 0, lcs = [];
          for (const c of cls) {
            const cp = pw2(c.lc + c.ls);
            for (let j = 1; j <= 6; j++) { const f = j / 6; pts.push([lse2([...lcs, c.lc + log2(f)]) / n, Math.min(1, cum + f * cp)]); }
            cum += cp; lcs.push(c.lc);
          }
          s2.vline(Hh, { color: 'green', width: 1.8 }); s2.hline(1 - d, { color: 'accent', dash: true });
          s2.path(pts, { color: 'accent', width: 2.4 });
          const lb = smallest(cls, d) / n;
          s2.dot(lb, 1 - d, { r: 6, color: 'gold' });
          info = { Hh, d, n, lb, last: cache.a[cache.a.length - 1][1] };
        });
        v.readout(() => String.raw`$H=${v.fix(info.Hh, 3)}$ bits. For $\delta=${v.fix(info.d, 3)}$ the smallest set of probability $1-\delta$ at $n=${info.n}$ has $\frac1n\log_2|B|=${v.fix(info.lb, 3)}$ (about $2^{${v.fix(info.lb * info.n, 1)}}$ sequences out of $2^{${info.n}}$); at $n=${NM}$ the exponent is $${v.fix(info.last, 3)}$, a gap of $${v.fix(Math.abs(info.last - info.Hh), 3)}$ from $H$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Paradox',
      name: 'The most probable sequence is atypical',
      statement: String.raw`For a biased binary source with $p=P(X=1)>\tfrac12$, the single most probable sequence of length $n$ is $11\cdots1$, with probability $p^n$. Yet for any $\varepsilon<H(p)-\log\frac1p$ (that is, whenever $-\log p$ is farther than $\varepsilon$ from $H$) this sequence is **not** in the typical set $A_\varepsilon^{(n)}$ for any $n$, and the typical set (3.3) carries probability near $1$ while the likeliest sequence carries $p^n\to0$. The likeliest sequence is a single outlier in the wrong class, with the wrong "cost per symbol"; the outcome you will actually see is a sequence of a different kind.`,
      idea: String.raw`There are two competing factors in the probability of the *class* of sequences with $k$ ones: the probability of each member, $p^k(1-p)^{n-k}$, which is largest at $k=n$, and the number of members, $\binom nk$, which is largest at $k=n/2$. Their product peaks near $k=np$, where the per-sequence probability is $2^{-nH}$ (1.2, 3.1). All-ones wins the first factor by the exponentially large ratio $2^{n(H-\log(1/p))}$, but there is only one of it, whereas the typical set has about $2^{nH}$ members (3.3). Probability needs both height and width.`,
      caption: String.raw`Three views of the classes of sequences by fraction of ones $k/n$ (top row, left to right): the per-symbol cost $-\frac1n\log p(x^n)$ (the all-ones sequence, in red, is cheapest, i.e. most probable), the log of the number of sequences, and the total probability of the class (concentrated at $k/n\approx p$ inside the green band). The bottom panel follows $\log_2$ of three probabilities as $n$ grows. Lower $p$ toward $\tfrac12$, or raise $\varepsilon$, until all-ones becomes typical: the paradox needs $\varepsilon<H-\log\frac1p$.`,
      deps: ['info-3.2'],
      refs: ['Cover–Thomas §3.3'],
      tags: ['typical set', 'paradox'],
      viz(v) {
        const pS = v.slider(String.raw`$p=P(X=1)$`, 0.55, 0.98, 0.9, { step: 0.01 });
        const nS = v.slider('length $n$', 2, 400, 100, { int: true });
        const eS = v.slider(String.raw`tolerance $\varepsilon$`, 0.02, 0.4, 0.1, { step: 0.01 });
        const mk = (t, yl) => v.stage({ x: [0, 1], y: [0, 1], height: 210, axes: 'box', gutter: true, xlabel: 'fraction of ones k/n', ylabel: yl, title: t });
        const sA = mk('cost per symbol of one sequence', '−(1/n) log₂ p'), sB = mk('number of sequences', '(1/n) log₂ C(n,k)'), sC = mk('total probability of the class', 'P(class)');
        const sD = v.stage({ x: [1, 400], y: [-60, 5], height: 230, axes: 'box', gutter: true, xlabel: 'n', ylabel: 'log₂ probability', title: 'as $n$ grows' });
        v.legend([['red', 'all ones (the likeliest sequence)', { dot: true }], ['green', 'typical band', { area: true }]]);
        let info = {};
        v.render(() => {
          const n = nS.value, p = pS.value, q = 1 - p, eps = eS.value, Hh = h2(p), cost = (k) => -lseqP(n, k, p) / n;
          const ymax = -log2(q) * 1.05;
          sA.setView([-0.02, 1.02], [0, ymax]); sB.setView([-0.02, 1.02], [0, 1.08]);
          const probs = []; for (let k = 0; k <= n; k++) probs.push(pw2(lbinPmf(n, k, p)));
          sC.setView([-0.02, 1.02], [0, Math.max(...probs) * 1.15]);
          for (const s of [sA, sB, sC]) s.vband(p - eps / Math.abs(log2(q / p)), p + eps / Math.abs(log2(q / p)), { color: 'green', alpha: 0.13 });
          sA.path([[0, cost(0)], [1, cost(n)]], { color: 'muted', width: 1.4 });
          sA.hline(Hh, { color: 'green', dash: true });
          sA.dot(1, cost(n), { r: 6, color: 'red' });
          sA.text('all ones', 1, cost(n), { dx: -8, dy: 14, align: 'right', size: 11, color: 'red', weight: 600 });
          const pts = []; for (let k = 0; k <= n; k++) pts.push([k / n, lbinom(n, k) / n]);
          sB.path(pts, { color: 'accent', width: 2 }); sB.dot(1, 0, { r: 6, color: 'red' });
          let pt = 0;
          for (let k = 0; k <= n; k++) { const t = isTyp(n, k, p, eps); if (t) pt += probs[k]; sC.rect((k - 0.5) / n, 0, (k + 0.5) / n, probs[k], { fill: t ? 'green' : 'accent', fillAlpha: 0.5, stroke: false }); }
          sC.dot(1, probs[n], { r: 6, color: 'red' });
          sD.setView([1, 400], [-400 * Hh * 1.12, 40]); sD.hline(0, { color: 'faint' });
          const pa = [], pb = [], pc = [];
          for (let m = 1; m <= 400; m += 3) { pa.push([m, m * log2(p)]); pb.push([m, -m * Hh]); let tt = 0; for (let k = 0; k <= m; k++) if (isTyp(m, k, p, eps)) tt += pw2(lbinPmf(m, k, p)); pc.push([m, log2(Math.max(tt, 1e-18))]); }
          sD.path(pa, { color: 'red', width: 2 }); sD.path(pb, { color: 'accent', width: 2 }); sD.path(pc, { color: 'green', width: 2 });
          sD.vline(n, { color: 'faint', dash: true });
          sD.text('log₂ P(all ones)', 400, 400 * log2(p), { align: 'right', dy: -10, size: 11, color: 'red' });
          sD.text('log₂ p of one typical sequence', 400, -400 * Hh, { align: 'right', dy: -10, size: 11, color: 'accent' });
          sD.text('log₂ P(typical set)', 400, 0, { align: 'right', dy: -12, size: 11, color: 'green' });
          const dif = Math.abs(-log2(p) - Hh);
          info = { n, p, pAll: n * log2(p), pTyp: pt, ratio: n * (Hh + log2(p)), dif, eps, atyp: dif > eps, Hh };
        });
        v.readout(() => String.raw`At $n=${info.n}$: $P(\text{all ones})=2^{${v.fix(info.pAll, 1)}}$, while the typical set has probability $${v.fix(info.pTyp, 3)}$. One typical sequence has probability $2^{-nH}=2^{${v.fix(-info.n * info.Hh, 1)}}$, so all-ones is $2^{${v.fix(info.ratio, 1)}}$ times likelier than any one of them. Its cost per symbol is $-\log p=${v.fix(-log2(info.p), 3)}$ versus $H=${v.fix(info.Hh, 3)}$: ` + (info.atyp ? String.raw`**atypical** (the gap $${v.fix(info.dif, 3)}>\varepsilon$).` : String.raw`here the gap $${v.fix(info.dif, 3)}\le\varepsilon$, so all-ones *is* typical: the paradox needs a smaller $\varepsilon$.`));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Definition',
      name: 'Types and type classes',
      statement: String.raw`Let $\mathcal X$ be a finite alphabet and $x^n\in\mathcal X^n$. The **type** (empirical distribution) of $x^n$ is $P_{x^n}(a)=\frac1n\,\#\{i:x_i=a\}$. $\mathcal P_n$ denotes the set of all types with denominator $n$; for a type $P\in\mathcal P_n$ the **type class** is $T(P)=\{x^n:P_{x^n}=P\}$. Two basic counts: $|\mathcal P_n|=\binom{n+|\mathcal X|-1}{|\mathcal X|-1}\le(n+1)^{|\mathcal X|}$ (only polynomially many types), and $|T(P)|=\binom{n}{nP(a_1),\dots,nP(a_m)}$, a multinomial coefficient, while $\sum_P|T(P)|=|\mathcal X|^n$.`,
      idea: String.raw`A type forgets the order of a sequence and keeps only how often each letter occurs, so all permutations of a sequence lie in one class. A sequence of length $n$ is determined by its type together with a position within that class: polynomially many types, exponentially many sequences per class. This is what makes counting arguments work: any quantity that depends on a sequence only through its type (such as $p(x^n)=2^{-n(H(P)+D(P\|p))}$, a formula proved in 3.8) can be summed type by type.`,
      caption: String.raw`The triangle is the probability simplex of the alphabet $\{a,b,c\}$; each dot is a type with denominator $n$, coloured and sized by $\frac1n\log_2|T(P)|$ (largest at the centre, the uniform type). Click a dot to see its counts, its class size and a few sequences in the class. Raise $n$: the number of types grows like $n^2/2$, while the classes grow exponentially.`,
      deps: ['info-1.2'],
      refs: ['Cover–Thomas §11.1'],
      tags: ['method of types', 'combinatorics'],
      credit: 'I. Csiszár & J. Körner (the method of types); see Csiszár, IEEE Trans. Inf. Theory 44 (1998) 2505, doi:10.1109/18.720546',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Method_of_types' },
      viz(v) {
        const nS = v.slider('length $n$', 2, 40, 12, { int: true });
        const s = simStage(v, { height: 340, title: 'types of length-$n$ sequences over $\\{a,b,c\\}$' });
        let sel = [6, 4, 2], seed = 1; v.button('New examples', () => { seed++; });
        const lattice = (n) => { const a = []; for (let i = 0; i <= n; i++) for (let j = 0; i + j <= n; j++) a.push([i, j, n - i - j]); return a; };
        s.onClick((x, y) => {
          const n = nS.value, P = simP(x, y); let best = null, bd = 1e9;
          for (const c of lattice(n)) { const [px, py] = simXY(c.map((t) => t / n)), d = (px - x) ** 2 + (py - y) ** 2; if (d < bd) { bd = d; best = c; } }
          if (best) sel = best;
        });
        let info = {};
        v.render(() => {
          const n = nS.value; if (sel[0] + sel[1] + sel[2] !== n) sel = typeRound([0.5, 0.3, 0.2], n);
          drawSimplex(s, { k: Math.min(n, 5), names: ['a', 'b', 'c'] });
          const L = lattice(n), per = (c) => lmult(c) / n, Hmax = Math.log2(3);
          const r = Math.max(2.2, Math.min(9, 150 / n));
          for (const c of L) { const [x, y] = simXY(c.map((t) => t / n)), t = clamp(per(c) / Hmax, 0, 1); s.dot(x, y, { r: r * (0.45 + 0.75 * t), color: v.ramp(Math.pow(t, 1.5), 'accent') }); }
          const [sx, sy] = simXY(sel.map((t) => t / n)); s.dot(sx, sy, { r: r * 1.5, color: 'gold', hollow: true }); s.dot(sx, sy, { r: 3, color: 'gold' });
          // a few members of the selected class (seeded shuffle of the multiset)
          const rng = v.rng(hashStr(sel.join(',') + seed)), word = []; sel.forEach((cnt, i) => { for (let j = 0; j < cnt; j++) word.push('abc'[i]); });
          const ex = []; for (let e = 0; e < 3; e++) ex.push(rng.shuffle(word).join(''));
          let tot = []; for (const c of L) tot.push(lmult(c));
          info = { n, sel: [...sel], lsz: lmult(sel), nT: L.length, tot: lse2(tot), ex, H: H(sel) };
        });
        v.readout(() => String.raw`Type $P=(${info.sel.join(',')})/${info.n}$: $|T(P)|=\frac{${info.n}!}{${info.sel.map((c) => c + '!').join('\\,')}}=${big(v, info.lsz)}$, so $\frac1n\log_2|T(P)|=${v.fix(info.lsz / info.n, 3)}$ against $H(P)=${v.fix(info.H, 3)}$. Members: ${info.ex.join(', ')}. There are $|\mathcal P_n|=${commas(info.nT)}\le(n+1)^3$ types, and $\sum_P|T(P)|=${big(v, info.tot)}=3^{${info.n}}$ (check: $\log_2$ of the sum is $${v.fix(info.tot, 6)}$, $n\log_23=${v.fix(info.n * Math.log2(3), 6)}$).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'Size of a type class is 2^{nH(P)} up to polynomial factors',
      statement: String.raw`For a type $P\in\mathcal P_n$ over an alphabet of size $m=|\mathcal X|$,
$$\frac{1}{(n+1)^{m}}\,2^{nH(P)}\ \le\ |T(P)|\ \le\ 2^{nH(P)}.$$
So $\frac1n\log|T(P)|=H(P)-O\!\big(\tfrac{\log n}{n}\big)$ uniformly in $P$. A sharper statement follows from Stirling's formula (pma-8.22): for types with all counts growing, $\log_2|T(P)|=nH(P)-\frac{m-1}2\log_2(2\pi n)-\frac12\sum_a\log_2P(a)+o(1)$.`,
      idea: String.raw`The upper bound: $1\ge P^n(T(P))=|T(P)|\prod_aP(a)^{nP(a)}=|T(P)|2^{-nH(P)}$, since every member of the class has the same $P^n$-probability. The lower bound: among all types $P'$, the class $T(P)$ has the largest $P^n$-probability (that is, $P$ is the likeliest type under $P^n$), and there are at most $(n+1)^m$ types summing to $1$, so $P^n(T(P))\ge(n+1)^{-m}$. Stirling's approximation for $n!$ turns the multinomial coefficient into the refined formula, whose constant terms the picture checks.`,
      caption: String.raw`Drag the handle $P$ on the simplex. The panel shows the gap $nH(P_n)-\log_2|T(P_n)|$ in bits, where $P_n$ is the type of length $n$ nearest to $P$: it always sits between the lower bound $0$ and the orange bound $m\log_2(n+1)$ (with $m=3$), and tracks the green Stirling prediction closely once all counts are large (the jaggedness is $P_n$ re-rounding). A handle near an edge gives small counts, where the refined formula fails and the bounds still hold.`,
      deps: ['info-3.6', 'pma-8.22'],
      refs: ['Cover–Thomas §11.1'],
      tags: ['method of types', 'Stirling'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Method_of_types' },
      viz(v) {
        const sim = simStage(v, { height: 280, title: 'drag the type $P$' });
        const h = simHandle(sim, [0.5, 0.3, 0.2], { color: 'accent', label: 'P' });
        const nS = v.slider('marker $n$', 3, 400, 60, { log: true, int: true });
        const s = v.stage({ x: [3, 400], y: [-2, 28], xlog: true, height: 280, axes: 'box', gutter: true, xlabel: 'n', ylabel: 'n·H(Pₙ) − log₂|T(Pₙ)|  [bits]', title: 'how far the class falls below $2^{nH}$' });
        v.legend([['accent', 'exact gap'], ['green', 'Stirling prediction', { dash: true }], ['orange', 'bounds: $0$ and $3\\log_2(n+1)$']]);
        const gap = (n, P) => { const c = typeRound(P, n); return n * H(c) - lmult(c); };
        const stir = (n, P) => { const c = typeRound(P, n), nz = c.filter((x) => x > 0); return ((nz.length - 1) / 2) * log2(2 * Math.PI * n) + 0.5 * sum(nz.map((x) => log2(x / n))); };
        let info = {};
        v.render(() => {
          drawSimplex(sim, { k: 4 });
          const P = h.P(), n = nS.value;
          const ns = []; for (let i = 0; i <= 90; i++) { const m = Math.round(3 * Math.pow(400 / 3, i / 90)); if (!ns.length || ns[ns.length - 1] !== m) ns.push(m); }
          s.path(ns.map((m) => [m, 3 * log2(m + 1)]), { color: 'orange', width: 2 }); s.hline(0, { color: 'orange', width: 2 });
          s.path(ns.map((m) => [m, stir(m, P)]), { color: 'green', width: 2, dash: true });
          s.path(ns.map((m) => [m, gap(m, P)]), { color: 'accent', width: 2 });
          s.vline(n, { color: 'faint', dash: true });
          const c = typeRound(P, n);
          info = { n, c, g: gap(n, P), st: stir(n, P), up: 3 * log2(n + 1), lsz: lmult(c), H: H(c) };
        });
        v.readout(() => String.raw`At $n=${info.n}$ the nearest type is $(${info.c.join(',')})/${info.n}$ with $H(P)=${v.fix(info.H, 3)}$, so $2^{nH}=2^{${v.fix(info.n * info.H, 2)}}$ and $|T(P)|=2^{${v.fix(info.lsz, 2)}}$. The gap is $${v.fix(info.g, 2)}$ bits, inside $[0,\ ${v.fix(info.up, 1)}]$; Stirling predicts $${v.fix(info.st, 2)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Probability of a type class is about 2^{−nD(P‖Q)}',
      statement: String.raw`Let $X_1,\dots,X_n$ be i.i.d. with distribution $Q$ on a finite alphabet and let $P\in\mathcal P_n$ be a type. Every sequence of type $P$ has probability $Q^n(x^n)=2^{-n(H(P)+D(P\|Q))}$, and therefore
$$\frac{1}{(n+1)^{m}}\,2^{-nD(P\|Q)}\ \le\ Q^n\big(T(P)\big)\ \le\ 2^{-nD(P\|Q)}.$$
(If $Q(a)=0$ for some letter that $P$ uses, both sides vanish.) The probability that the empirical distribution equals $P$ decays exponentially at rate exactly $D(P\|Q)$ in the exponent, up to a polynomial factor.`,
      idea: String.raw`For $x^n\in T(P)$, $\log Q^n(x^n)=\sum_a nP(a)\log Q(a)=-n\big(H(P)+D(P\|Q)\big)$: add and subtract $\sum P\log P$ in the exponent (1.2, 2.1). Multiplying by the class size $|T(P)|$ and using $(n+1)^{-m}2^{nH(P)}\le|T(P)|\le2^{nH(P)}$ (3.7) gives the stated sandwich. The relative entropy appears as the exponential cost of making the empirical distribution look like $P$ when the truth is $Q$.`,
      caption: String.raw`Drag the blue handle $P$ and the orange handle $Q$ on the simplex. The plot shows the exact value of $\log_2Q^n(T(P_n))$ for the nearest type $P_n$ at each $n$, between the two green lines of slope $-D(P\|Q)$ (the upper line $-nD$ and the lower $-nD-3\log_2(n+1)$): the decay rate is $D$. Move $P$ onto $Q$ and the probability stops decaying. For $n\le9$ the readout also checks the formula by enumerating all $3^n$ sequences.`,
      deps: ['info-3.7', 'info-2.1'],
      refs: ['Cover–Thomas §11.1'],
      tags: ['method of types', 'relative entropy'],
      viz(v) {
        const sim = simStage(v, { height: 280, title: 'drag the type $P$ (blue) and the source $Q$ (orange)' });
        const hP = simHandle(sim, [0.2, 0.3, 0.5], { color: 'accent', label: 'P' });
        const hQ = simHandle(sim, [0.5, 0.3, 0.2], { color: 'orange', label: 'Q' });
        const nS = v.slider('marker $n$', 1, 200, 40, { int: true });
        const s = v.stage({ x: [1, 200], y: [-100, 1], height: 280, axes: 'box', gutter: true, xlabel: 'n', ylabel: 'log₂ Qⁿ(T(Pₙ))', title: 'probability of the type class' });
        v.legend([['accent', 'exact $\\log_2Q^n(T(P_n))$'], ['green', '$-nD$ and $-nD-3\\log_2(n+1)$']]);
        const brute = (n, c, Q) => { let t = 0; const tot = Math.pow(3, n); for (let s = 0; s < tot; s++) { let x = s; const cc = [0, 0, 0]; let pr = 1; for (let i = 0; i < n; i++) { const a = x % 3; x = (x - a) / 3; cc[a]++; pr *= Q[a]; } if (cc[0] === c[0] && cc[1] === c[1] && cc[2] === c[2]) t += pr; } return t; };
        let info = {};
        v.render(() => {
          drawSimplex(sim, { k: 4 });
          sim.line(...simXY(hP.P()), ...simXY(hQ.P()), { color: 'faint', dash: true });
          const P = hP.P(), Q = hQ.P(), D = KL(P, Q), n = nS.value;
          const ns = []; for (let m = 1; m <= 200; m++) ns.push(m);
          const ex = ns.map((m) => [m, lQclass(typeRound(P, m), Q)]);
          const lo = ns.map((m) => [m, -m * D - 3 * log2(m + 1)]), up = ns.map((m) => [m, -m * D]);
          s.setView([1, 200], [Math.min(-5, Math.min(...lo.map((a) => a[1])) * 1.05), 3]);
          s.hline(0, { color: 'faint' });
          s.path(up, { color: 'green', width: 2 }); s.path(lo, { color: 'green', width: 2, dash: true });
          s.path(ex, { color: 'accent', width: 2.4 }); s.vline(n, { color: 'faint', dash: true });
          const c = typeRound(P, n), L = lQclass(c, Q);
          info = { n, D, c, L, bf: n <= 9 ? brute(n, c, Q) : null, P, Q };
        });
        v.readout(() => String.raw`$D(P\|Q)=${v.fix(info.D, 3)}$ bits. At $n=${info.n}$, type $(${info.c.join(',')})/${info.n}$: $\log_2Q^n(T)=${v.fix(info.L, 2)}$, i.e. $-\frac1n\log_2Q^n(T)=${v.fix(-info.L / info.n, 3)}$ per symbol, to be compared with $D=${v.fix(info.D, 3)}$ (the difference is at most $\frac3n\log_2(n+1)=${v.fix(3 * log2(info.n + 1) / info.n, 3)}$).` + (info.bf != null ? String.raw` Brute force over all $3^{${info.n}}$ sequences: $Q^n(T)=${v.sci(info.bf, 5)}$ against the formula $${v.sci(Math.pow(2, info.L), 5)}$.` : ''));
      },
    },
  ],
};
