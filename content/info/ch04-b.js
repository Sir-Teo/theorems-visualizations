// Information & Coding Theory — Chapter 4: Source coding (items 4.6, 4.7, 4.10, 4.11, 4.12; the rest in ch04.js and ch04-c.js)
//
// Full-source review: arithmetic coding follows Witten–Neal–Cleary (1987) and Cover–Thomas §13.3.
// Shannon–Fano–Elias original attribution remains flagged; see the verification report.

import { clamp, sum, H, h2, KL, hashStr, LET, barEd, resizeP, shannonLens, expLen, huffLens, canon, isPrefixFree, lbinom, lbinPmf, binomCdf, cdfPick,
  fracBits, arithmeticTag, mono, pw2, log2, commas, setProb } from './ch04.shared.js';

const COL3 = ['accent', 'orange', 'teal', 'purple', 'pink', 'gold'];

export default {
  collection: 'info',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Block coding approaches the entropy',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with entropy $H=H(X)$, and let $L_n$ be the minimal expected length of a prefix code for the block $X^n=(X_1,\dots,X_n)$, so that $L_n/n$ is the expected number of bits per source symbol. Then
$$H\ \le\ \frac{L_n}{n}\ <\ H+\frac1n,\qquad\text{hence}\qquad \frac{L_n}{n}\longrightarrow H\quad(n\to\infty).$$
(The same bounds hold for a stationary process, with $H$ replaced by the entropy rate and $H(X^n)/n$ in the lower bound; see 3.11.)`,
      idea: String.raw`Apply the symbol-code theorem (4.5) to the "super-symbol" $X^n$, whose entropy is $H(X^n)=nH$ by independence: $nH\le L_n<nH+1$. Dividing by $n$ spreads the one wasted bit of rounding over $n$ source symbols. Behind this is the typical set (3.3): almost all blocks are about equally likely, near $2^{-nH}$, so the lengths $\lceil -\log p(x^n)\rceil\approx nH$ nearly match the ideal lengths in aggregate, even though no single-symbol code can. The price is a codebook of size $|\mathcal X|^n$, which is why arithmetic coding (4.12) is preferred in practice.`,
      caption: String.raw`A binary source with $P(1)=p$. For each block length $n\le12$ the optimal (Huffman, 4.5) code for all $2^n$ blocks is built and its expected length per source symbol is plotted (green) between the entropy (solid) and the guarantee $H+1/n$ (orange). Slide $n$ to inspect the code for that block length: right, the codeword length of every block as a function of its number of ones $k$, against the ideal length $-\log_2p(x^n)$. For $p=\frac12$ one bit per symbol is already optimal; for skewed sources the gain from blocking is dramatic.`,
      deps: ['info-4.5', 'info-3.3', 'algo-10.11'],
      refs: ['Cover–Thomas §5.4'],
      tags: ['block coding', 'Huffman'],
      credit: 'C. E. Shannon, 1948',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shannon%27s_source_coding_theorem' },
      viz(v) {
        const pS = v.slider('$p=P(X=1)$', 0.02, 0.5, 0.1, { step: 0.01 });
        const nS = v.slider('block length $n$', 1, 12, 5, { int: true });
        const NMAX = 12;
        const s1 = v.stage({ x: [0.5, NMAX + 0.5], y: [0, 1], height: 280, axes: 'box', gutter: true, xlabel: 'block length n', ylabel: 'bits per source symbol', title: 'expected length per symbol of the optimal block code', minWidth: 320 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], height: 280, axes: 'box', gutter: true, xlabel: 'number of ones k in the block', ylabel: 'codeword length (bits)', title: 'codeword lengths for blocks of length $n$', minWidth: 320 });
        let cache = null, info = {};
        const build = (p) => {
          const q = 1 - p, per = [], lensAll = [];
          for (let n = 1; n <= NMAX; n++) {
            const N = 1 << n, w = new Float64Array(N), pc = new Uint8Array(N);
            for (let b = 0; b < N; b++) { let k = 0, x = b; while (x) { k += x & 1; x >>= 1; } pc[b] = k; w[b] = Math.pow(p, k) * Math.pow(q, n - k); }
            const l = huffLens(Array.from(w)); let L = 0, Ls = 0; for (let b = 0; b < N; b++) { L += w[b] * l[b]; Ls += w[b] * Math.ceil(-log2(w[b]) - 1e-12); }
            per.push({ L: L / n, Ls: Ls / n }); lensAll.push({ l, pc });
          }
          return { p, per, lensAll };
        };
        v.render(() => {
          const p = pS.value, n = nS.value, Hh = h2(p);
          if (!cache || cache.p !== p) cache = build(p);
          s1.setView([0.5, NMAX + 0.5], [0, Math.max(1.05, Hh + 1.08)]);
          s1.setTicks(Array.from({ length: NMAX }, (_, i) => [i + 1, String(i + 1)]), null);
          s1.path(Array.from({ length: NMAX }, (_, i) => [i + 1, Hh + 1 / (i + 1)]), { color: 'orange', width: 2, dash: true });
          s1.path(Array.from({ length: NMAX }, (_, i) => [i + 1, cache.per[i].Ls]), { color: 'purple', width: 1.4, alpha: 0.7 });
          s1.hline(Hh, { color: 'ink', width: 1.8 });
          s1.path(cache.per.map((r, i) => [i + 1, r.L]), { color: 'green', width: 2 });
          cache.per.forEach((r, i) => s1.dot(i + 1, r.L, { r: i + 1 === n ? 6.5 : 3.5, color: i + 1 === n ? 'gold' : 'green' }));
          s1.text(`H = ${v.fix(Hh, 3)}`, NMAX + 0.4, Hh, { align: 'right', dy: 13, size: 12, color: 'ink', weight: 600 });
          const { l, pc } = cache.lensAll[n - 1], q = 1 - p;
          const lo = new Array(n + 1).fill(Infinity), hi = new Array(n + 1).fill(-Infinity);
          for (let b = 0; b < l.length; b++) { const k = pc[b]; lo[k] = Math.min(lo[k], l[b]); hi[k] = Math.max(hi[k], l[b]); }
          const ideal = (k) => -(k * log2(p) + (n - k) * log2(q));
          const top = Math.max(...hi, ideal(n)) + 1;
          s2.setView([-0.6, n + 0.6], [0, top]);
          s2.setTicks(Array.from({ length: n + 1 }, (_, k) => [k, String(k)]).filter((_, k) => n <= 12 || k % 2 === 0), null);
          s2.path(Array.from({ length: n + 1 }, (_, k) => [k, ideal(k)]), { color: 'muted', width: 1.5, dash: true });
          for (let k = 0; k <= n; k++) {
            s2.line(k, lo[k], k, hi[k], { color: 'green', width: 5, alpha: 0.5 });
            s2.dot(k, lo[k], { r: 4, color: 'green' }); if (hi[k] !== lo[k]) s2.dot(k, hi[k], { r: 4, color: 'green' });
          }
          info = { Hh, n, L: cache.per[n - 1].L, Ls: cache.per[n - 1].Ls, p };
        });
        v.legend([['green', 'optimal (Huffman) code on blocks'], ['purple', 'Shannon code on blocks'], ['orange', '$H+1/n$', { dash: true }], ['ink', 'entropy $H$'], ['muted', 'ideal length $-\\log_2 p(x^n)$', { dash: true }]]);
        v.readout(() => `$H=${v.fix(info.Hh, 4)}$ bits. For $n=${info.n}$: $L_n/n=${v.fix(info.L, 4)}$ (Shannon code ${v.fix(info.Ls, 4)}) lies in $[H,\\,H+1/n)=[${v.fix(info.Hh, 4)},\\,${v.fix(info.Hh + 1 / info.n, 4)})$. Redundancy $L_n/n-H=${v.fix(info.L - info.Hh, 4)}$ bit per symbol. Single symbols ($n=1$) always need 1 bit, however skewed the source.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'Fixed-rate source coding theorem',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with entropy $H$. A **fixed-rate code** of rate $R$ assigns a binary index of $\lceil nR\rceil$ bits to (at most $2^{nR}$ of) the length-$n$ blocks, and the decoder fails on every other block. Let $P_e^{(n)}$ be the smallest possible probability of failure.

(a) If $R>H$, then $P_e^{(n)}\to0$ as $n\to\infty$.

(b) If $R<H$, then $P_e^{(n)}\to1$ as $n\to\infty$.

So $H$ is the sharp threshold: the number of bits per symbol needed for a vanishing error probability is exactly the entropy.`,
      idea: String.raw`For (a), index the typical set $A_\varepsilon^{(n)}$ with $\varepsilon=\frac{R-H}2$: it has at most $2^{n(H+\varepsilon)}<2^{nR}$ elements (3.3) and probability tending to $1$ (3.1), so only the atypical blocks, of vanishing probability, fail. For (b), the best a code can do is to index the $2^{nR}$ most probable blocks; but every typical block has probability about $2^{-nH}$, and no set of $2^{nR}$ blocks with $R<H$ can carry more than about $2^{n(R-H)}\to0$ of the typical probability (3.4), so the success probability goes to $0$.`,
      caption: String.raw`A binary source with $P(1)=p$ is coded in blocks of length $n$ at rate $R$ bits per symbol: the $2^{nR}$ most probable blocks get an index and all others fail. The curves show the exact failure probability against $R$ for four block lengths; they steepen into a step at $R=H$ as $n$ grows. Move the rate and the block length: the gold dot is the exact failure probability at your rate and the red ring the failure frequency in 3000 simulated blocks; the right panel shows which classes (by number of ones) are indexed: green classes fully, orange partly, red not at all.`,
      deps: ['info-3.3'],
      refs: ['Cover–Thomas §3.2', 'MacKay ch. 4'],
      tags: ['source coding', 'typical set'],
      credit: 'C. E. Shannon, 1948',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shannon%27s_source_coding_theorem' },
      viz(v) {
        const pS = v.slider('$p=P(X=1)$', 0.05, 0.5, 0.2, { step: 0.01 });
        const nS = v.slider('block length $n$', 8, 500, 100, { int: true, log: true });
        const rS = v.slider('rate $R$', 0.02, 1, 0.78, { step: 0.005 });
        let seed = 3; v.button('Resample', () => { seed++; });
        const s1 = v.stage({ x: [0, 1], y: [0, 1.04], height: 280, axes: 'box', gutter: true, xlabel: 'rate R (bits per symbol)', ylabel: 'failure probability', title: 'best fixed-rate code: probability of failure', minWidth: 320 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], height: 280, axes: 'box', gutter: true, xlabel: 'number of ones k', ylabel: 'P(K = k)', title: 'which blocks get an index', minWidth: 320 });
        const NS = [10, 40, 160, 500];
        // exact failure probability at rate R for block length n
        const classes = (n, p) => {
          const q = 1 - p, ks = []; for (let k = 0; k <= n; k++) ks.push({ k, lc: lbinom(n, k), lseq: lseqP(n, k, p) });
          ks.sort((a, b) => b.lseq - a.lseq); return ks;
        };
        const lseqP = (n, k, p) => (k > 0 ? k * log2(p) : 0) + (n - k > 0 ? (n - k) * log2(1 - p) : 0);
        const coverage = (cl, logM) => {
          let rem = Math.pow(2, Math.min(logM, 1000)), covered = 0; const frac = {};
          for (const c of cl) { const cnt = Math.pow(2, Math.min(c.lc, 1000)), take = Math.min(cnt, Math.max(0, rem)); frac[c.k] = cnt > 0 ? take / cnt : 0; covered += take * Math.pow(2, c.lseq); rem -= take; }
          return { fail: Math.max(0, 1 - covered), frac };
        };
        let cacheP = null, curves = null, info = {};
        v.render(() => {
          const p = pS.value, n = nS.value, R = rS.value, Hh = h2(p);
          if (!cacheP || cacheP !== p) {
            cacheP = p;
            curves = NS.map((m) => { const cl = classes(m, p); return { m, pts: Array.from({ length: 101 }, (_, i) => { const r = i / 100; return [r, coverage(cl, m * r).fail]; }) }; });
          }
          const cl = classes(n, p), cv = coverage(cl, n * R);
          curves.forEach((c, i) => s1.path(c.pts, { color: 'accent', width: 1.4, alpha: 0.25 + 0.15 * i }));
          const here = Array.from({ length: 101 }, (_, i) => [i / 100, coverage(cl, n * (i / 100)).fail]);
          s1.path(here, { color: 'green', width: 2.6 });
          s1.vline(Hh, { color: 'ink', width: 1.6, dash: true });
          s1.text(`H = ${v.fix(Hh, 3)}`, Hh, 1.0, { dx: 6, align: 'left', size: 12, color: 'ink', weight: 600 });
          s1.dot(R, cv.fail, { r: 6, color: 'gold' });
          // simulation
          const cdf = binomCdf(n, p), r = v.rng(hashStr(`${p}|${n}|${seed}`)); let bad = 0; const T = 3000;
          for (let i = 0; i < T; i++) { const k = cdfPick(cdf, r()); if (r() >= cv.frac[k]) bad++; }
          s1.dot(R, bad / T, { r: 4, color: 'red', hollow: true });
          // classes
          const pm = []; let mx = 0; for (let k = 0; k <= n; k++) { const pr = Math.pow(2, lbinom(n, k) + lseqP(n, k, p)); pm.push(pr); mx = Math.max(mx, pr); }
          s2.setView([-0.5, n + 0.5], [0, mx * 1.15]);
          const wd = Math.max(0.35, 0.5);
          for (let k = 0; k <= n; k++) { const f = cv.frac[k], col = f >= 0.999 ? 'green' : f <= 0.001 ? 'red' : 'orange'; s2.rect(k - wd, 0, k + wd, pm[k], { fill: col, fillAlpha: 0.5, color: col, width: n > 120 ? 0.5 : 1 }); }
          s2.vline(p * n, { color: 'ink', dash: true, width: 1.2 });
          info = { Hh, n, R, fail: cv.fail, sim: bad / T, T };
        });
        v.legend([['green', 'exact failure probability, chosen $n$'], ['accent', 'other block lengths ($n=10,40,160,500$)'], ['gold', 'exact at the chosen $R$', { dot: true }], ['red', 'simulated', { dot: true }]]);
        v.readout(() => `$H=${v.fix(info.Hh, 3)}$ bits. At $R=${v.fix(info.R, 3)}$ (${info.R > info.Hh ? 'above' : 'below'} $H$) and $n=${info.n}$, the best code fails with probability ${info.fail < 1e-4 && info.fail > 0 ? v.sci(info.fail, 2) : '$' + v.fix(info.fail, 4) + '$'}; simulated: $${v.fix(info.sim, 3)}$ in ${commas(info.T)} blocks. The dashed vertical line $R=H$ is where the curves steepen into a step as $n$ grows.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'The cost of coding with the wrong distribution',
      statement: String.raw`Let the source have distribution $p$ but let the code be designed for a distribution $q$ with full support, with Shannon lengths $\ell_q(x)=\lceil-\log_2 q(x)\rceil$. Then the expected length under the true law satisfies
$$H(p)+D(p\,\|\,q)\ \le\ \mathbb E_p[\ell_q(X)]\ <\ H(p)+D(p\,\|\,q)+1 .$$
So designing for the wrong distribution costs about $D(p\|q)$ extra bits per symbol: the relative entropy is the **price of a wrong model**. (Equivalently, $-\log q$ is the ideal length and its $p$-average is the cross-entropy $H(p,q)=H(p)+D(p\|q)$.)`,
      idea: String.raw`Without rounding, the expected ideal length is $\sum p\log\frac1q=\sum p\log\frac{p}{q}+\sum p\log\frac1p=D(p\|q)+H(p)$, the cross-entropy (2.4). Rounding every length up adds between $0$ and $1$ bit, and the rounded lengths still satisfy Kraft because $\sum2^{-\lceil-\log q\rceil}\le\sum q=1$ (4.3), so a prefix code with these lengths exists. By Gibbs' inequality (2.2), $D\ge0$, with equality only for $q=p$: the right model is never beaten.`,
      caption: String.raw`Edit the true distribution $p$ (blue) and the assumed $q$ (orange). Right: the excess length $L-H(p)$ of the $q$-code is plotted against $D(p\|q)$ along the straight path from $p$ to your $q$ (the gold dot is the current $q$); the curve has to stay in the shaded band $D\le L-H<D+1$. Press Resample to draw 5000 fresh symbols from $p$: the measured average length (red ring) agrees with the exact one.`,
      deps: ['info-4.5', 'info-2.4'],
      refs: ['Cover–Thomas §5.4'],
      tags: ['cross-entropy', 'model mismatch'],
      credit: 'Cover & Thomas, Thm 5.4.3 (the mismatch bound follows from Shannon, 1948, and Gibbs\' inequality)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cross-entropy' },
      viz(v) {
        const edP = barEd(v, { title: 'true distribution $p$', p: [0.5, 0.25, 0.15, 0.1], labels: (i) => LET[i], height: 210, minWidth: 220 });
        const edQ = barEd(v, { title: 'assumed distribution $q$', p: [0.1, 0.15, 0.25, 0.5], color: 'orange', labels: (i) => LET[i], height: 210, minWidth: 220 });
        const s3 = v.stage({ x: [0, 3], y: [0, 4], height: 260, axes: 'box', gutter: true, xlabel: 'D(p‖q)  [bits]', ylabel: 'L − H(p)  [bits]', title: 'excess length against divergence', minWidth: 300 });
        let seed = 5; v.button('Resample', () => { seed++; });
        let info = {};
        const lenFor = (q) => shannonLens(q);
        v.render(() => {
          const p = edP.p, q = edQ.p, n = p.length;
          edP.draw({ values: true, alpha: 0.45 }); edQ.draw({ values: true, alpha: 0.45 });
          const Hp = H(p), D = KL(p, q), ls = lenFor(q), L = expLen(p, ls);
          // path q_t
          const pts = []; let dm = 0;
          for (let i = 0; i <= 100; i++) { const t = i / 100, qt = p.map((x, j) => (1 - t) * x + t * q[j]); if (qt.some((x, j) => p[j] > 0 && !(x > 0))) break; const d = KL(p, qt); pts.push([d, expLen(p, lenFor(qt)) - Hp]); dm = Math.max(dm, d); }
          const xmax = Math.max(1, Math.min(6, (isFinite(D) ? D : dm) * 1.08 + 0.2));
          s3.setView([0, xmax], [0, xmax + 1.4]);
          s3.between((x) => x, (x) => x + 1, 0, xmax, { fill: 'green', fillAlpha: 0.1 });
          s3.path([[0, 0], [xmax, xmax]], { color: 'green', width: 1.6 });
          s3.path([[0, 1], [xmax, xmax + 1]], { color: 'green', width: 1.2, dash: true });
          s3.path(pts, { color: 'orange', width: 2 });
          if (isFinite(D)) s3.dot(D, L - Hp, { r: 8.5, color: 'gold' });
          // simulation
          const r = v.rng(hashStr(`${p.join()}|${seed}`)); let acc = 0; const T = 5000, c = []; let a = 0; for (const x of p) { a += x; c.push(a); }
          for (let i = 0; i < T; i++) { const u = r(); let j = 0; while (j < n - 1 && u > c[j]) j++; acc += ls[j]; }
          if (isFinite(D)) s3.dot(D, acc / T - Hp, { r: 3.5, color: 'red' });
          info = { Hp, D, L, sim: acc / T, ok: L >= Hp + D - 1e-9 && L < Hp + D + 1 };
        });
        v.legend([['orange', 'path from $p$ to $q$'], ['green', 'band $D\\le L-H<D+1$', { area: true }], ['gold', 'current $q$', { dot: true }], ['red', 'simulation', { dot: true }]]);
        v.readout(() => !isFinite(info.D) ? `$q$ gives probability $0$ to a symbol that $p$ produces: $D(p\\|q)=\\infty$ and that symbol has no codeword. Raise that bar of $q$.` : `$H(p)=${v.fix(info.Hp, 3)}$, $D(p\\|q)=${v.fix(info.D, 3)}$, so $H+D=${v.fix(info.Hp + info.D, 3)}$ ≤ $L=${v.fix(info.L, 3)}$ < $H+D+1=${v.fix(info.Hp + info.D + 1, 3)}$ ${info.ok ? '✓' : '✗'}. Simulated average length: $${v.fix(info.sim, 3)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Algorithm',
      name: 'Shannon–Fano–Elias coding',
      statement: String.raw`Let $p(x)>0$ on the encoded support, order its symbols $x=1,\dots,m$, and let $F(x)=\sum_{a<x}p(a)$, $\bar F(x)=F(x)+\tfrac12p(x)$ (the midpoint of the interval $[F(x),F(x)+p(x))$). Give $x$ the codeword consisting of the first $\ell(x)=\lceil\log_2\frac1{p(x)}\rceil+1$ binary digits of $\bar F(x)$. Then the code is a prefix code and
$$H(X)+1\ \le\ L\ <\ H(X)+2 .$$
No sorting of the symbols is needed, and the code needs only the cumulative distribution, which is the idea that arithmetic coding (4.12) extends to long strings.`,
      idea: String.raw`Truncating $\bar F(x)$ to $\ell$ bits gives a number $c$ with $\bar F-2^{-\ell}<c\le\bar F$. The dyadic interval $[c,c+2^{-\ell})$ then contains $\bar F(x)$, and because $2^{-\ell}\le p(x)/2$ it lies inside $[F(x),F(x)+p(x))$: it sticks out neither to the left of $F$ (it starts within $p/2$ below the midpoint) nor beyond the right end. The symbols' intervals are disjoint, so the dyadic intervals are disjoint; and two codewords, one a prefix of the other, would have nested dyadic intervals. Hence the code is prefix-free. The lengths exceed $\log\frac1p$ by at most $2$, giving $L<H+2$.`,
      caption: String.raw`Edit the distribution (bars) and the number of symbols. Each symbol owns the interval $[F,F+p)$ of $[0,1)$ (top bar of each row); its midpoint $\bar F$ is the dot, and its codeword is the dyadic interval of length $2^{-\ell}$ below, which must lie inside the symbol's interval. Switch to the broken variant without the extra bit (length $\lceil\log\frac1p\rceil$) to break the construction: dyadic intervals then stick out (red) and codewords can collide.`,
      deps: ['info-4.3'],
      refs: ['Cover–Thomas 2nd ed. §5.9 pp. 127–130, Eqs. (5.73)–(5.76); historical notes p. 158 (Gilbert–Moore construction)'],
      tags: ['arithmetic coding', 'prefix codes'],
      credit: 'Shannon (1948) and Fano (1949); the cumulative-distribution version is attributed to Elias (unpublished; via Abramson, 1963)',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shannon%E2%80%93Fano%E2%80%93Elias_coding' },
      viz(v) {
        const nS = v.slider('symbols', 2, 6, 4, { int: true });
        const extra = v.select('codeword length', [{ value: 1, label: '$\\lceil\\log\\frac1p\\rceil+1$' }, { value: 0, label: '$\\lceil\\log\\frac1p\\rceil$ (broken)' }], 1);
        const ed = barEd(v, { title: 'source distribution (drag)', p: [0.25, 0.4, 0.15, 0.2], height: 190, minWidth: 260 });
        const s = v.stage({ x: [-0.07, 1.42], y: [-6.4, 1.1], height: 330, axes: false, title: 'intervals of $[0,1)$ and the dyadic interval of each codeword', minWidth: 420, weight: 1.6 });
        let last = 4, info = {};
        v.render(() => {
          if (nS.value !== last) { last = nS.value; ed.p = resizeP(ed.p, last); }
          const p = ed.p, m = p.length, add = extra.value;
          ed.draw({ values: true, alpha: 0.4 });
          let F = 0; const words = [], rows = [];
          for (let i = 0; i < m; i++) {
            const pi = p[i], Fb = F + pi / 2;
            if (pi > 0) {
              const l = Math.ceil(log2(1 / pi) - 1e-12) + add, k = Math.floor(Fb * pw2(l) + 1e-12), c = k / pw2(l);
              const w = k.toString(2).padStart(l, '0').slice(-l);
              rows.push({ i, F, pi, Fb, l, c, w, inside: c >= F - 1e-12 && c + pw2(-l) <= F + pi + 1e-12 });
              words.push(w);
            }
            F += pi;
          }
          const col = (i) => COL3[i % COL3.length];
          rows.forEach((r, j) => {
            const y = -j * 1.05;
            s.rect(r.F, y - 0.05, r.F + r.pi, y + 0.42, { fill: col(r.i), fillAlpha: 0.3, color: col(r.i), width: 1.6 });
            s.dot(r.Fb, y + 0.18, { r: 4.5, color: 'ink' });
            s.rect(r.c, y - 0.62, r.c + pw2(-r.l), y - 0.2, { fill: r.inside ? 'green' : 'red', fillAlpha: 0.5, color: r.inside ? 'green' : 'red', width: 1.6 });
            s.text(`${LET[r.i]}`, 0, y + 0.18, { dx: -4, align: 'right', size: 13, weight: 700, color: col(r.i), halo: false });
            s.text(r.w, 1.04, y + 0.1, { align: 'left', size: 13, weight: 700, color: r.inside ? 'ink' : 'red', halo: false });
            s.text(`ℓ=${r.l}`, 1.3, y + 0.1, { align: 'left', size: 11, color: 'muted', halo: false });
          });
          s.text('code', 1.04, 0.85, { align: 'left', size: 10.5, color: 'muted' });
          s.vline(0, { color: 'faint' }); s.vline(1, { color: 'faint' });
          const L = sum(rows.map((r) => r.pi * r.l)), Hh = H(p);
          const pf = isPrefixFree(words) && new Set(words).size === words.length;
          info = { L, Hh, pf, allIn: rows.every((r) => r.inside), add };
        });
        v.readout(() => `$H=${v.fix(info.Hh, 3)}$, $L=${v.fix(info.L, 3)}$ ${info.add ? `∈ [H+1, H+2) = [${v.fix(info.Hh + 1, 3)}, ${v.fix(info.Hh + 2, 3)})` : '(shorter, but no longer guaranteed to work)'}. Every dyadic interval inside its symbol's interval: ${info.allIn ? '**yes**' : '**no**'}; prefix-free: ${info.pf ? '**yes**' : '**no**'}.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Algorithm',
      name: 'Arithmetic coding',
      statement: String.raw`Given a model that assigns each next symbol a conditional probability $P(x_t\mid x_1,\dots,x_{t-1})$ (it may be adaptive), arithmetic coding encodes the string $x_1\dots x_N$ as follows. Start with the interval $I_0=[0,1)$. At step $t$ divide $I_{t-1}$ into subintervals proportional to the model's probabilities for the next symbol and let $I_t$ be the subinterval of the symbol that occurs. The final interval has width $\prod_tP(x_t\mid x_{<t})=P(x_1\dots x_N)$; choose a dyadic cell $[0.b_1\dots b_k,\ 0.b_1\dots b_k+2^{-k})$ wholly inside $I_N$ and transmit its $k$ bits. Such a cell exists with
$$k\ <\ \log_2\frac1{P(x_1\dots x_N)}+2 .$$
The decoder, running the same model and knowing $N$, recovers the string from a value in this cell. A variable-length stream instead needs an end-of-message symbol or separate framing; that cost is additional to this bound. The cost is within $2$ bits of the ideal $-\log P$ for the **whole string**, not $1$ bit per symbol, so the integer-length overhead per symbol vanishes for long messages, and the model can learn as it goes.`,
      idea: String.raw`Nested intervals: each step multiplies the width by the probability of the actual symbol, so after $N$ symbols the width is exactly the model probability of the whole message. A dyadic interval of width at most half the final width fits inside it (as in 4.11), and its length is at most $\lceil\log\frac1P\rceil+1<\log\frac1P+2$ bits. The decoder reverses the process, comparing the code value with the model's cumulative probabilities. Practical coders use finite-precision integer arithmetic and emit a bit as soon as the interval lies within one half of the current range, which is the "output bits as soon as the interval fits" pictured below.`,
      caption: String.raw`Type a message over $\{a,b,c\}$ (up to 14 symbols) and choose the model: a **fixed** model (drag the three bars) or an **adaptive** one that starts with one count per letter and counts what it has seen (Laplace). Each row is the current interval magnified to full width and cut according to the model; the chosen slice is outlined and zoomed into the next row. The bits on the right are those already fixed because the interval lies in a single dyadic half, quarter, … The slider steps through the message; at the end the code, the ideal length $-\log_2P$ and a decoding check are shown.`,
      deps: ['info-4.11'],
      refs: ['Cover–Thomas 2nd ed. §13.3 pp. 436–440 (known block length)', 'Witten–Neal–Cleary (1987), Commun. ACM 30: 520–540, pp. 521–523 and 532–535 (intervals, EOF, finite precision)'],
      tags: ['arithmetic coding', 'adaptive models'],
      credit: 'R. Pasco (1976, Stanford thesis) and J. Rissanen (1976, IBM J. Res. Dev. 20: 198–203); practical methods described by Witten, Neal & Cleary (Commun. ACM 30 (6): 520–540, 1987)',
      scope: String.raw`Positive model probability for every encoded symbol; decoder knows the message length. The visualization uses floating-point intervals for at most 14 symbols, not the paper's renormalized integer coder; it reports zero-probability messages and unresolved intervals explicitly. The shortest contained dyadic cell is used, so same-length messages have prefix-free tags. Pasco/Rissanen priority is corroborated by the full 1987 primary account, whose algorithm is distinct.`,
      links: { source: 'https://web.stanford.edu/class/ee398a/handouts/papers/WittenACM87ArithmCoding.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Arithmetic_coding' },
      viz(v) {
        const model = v.select('model', [{ value: 'fixed', label: 'fixed $p$' }, { value: 'adapt', label: 'adaptive (Laplace)' }], 'adapt');
        const msg = v.input('message', 'abaabcaab', { width: 220 });
        const stepS = v.slider('steps shown', 0, 14, 14, { int: true });
        const ed = barEd(v, { title: 'fixed model $p$ (drag; used when “fixed” is selected)', p: [0.6, 0.3, 0.1], height: 150, minWidth: 220, weight: 0.8 });
        const s = v.stage({ x: [0, 1.38], y: [-14.6, 1.4], height: 430, axes: false, title: 'interval narrowing: each row is the previous chosen slice, magnified', minWidth: 340, weight: 1.6 });
        const SYM = 'abc';
        let info = {};
        const commonBits = (lo, hi) => { let b = ''; for (let k = 0; k < 40; k++) { const a = Math.floor(lo * pw2(k + 1)), c = Math.floor((hi - 1e-15) * pw2(k + 1)); if (a !== c || Math.floor(lo * pw2(k)) !== Math.floor((hi - 1e-15) * pw2(k))) break; b += (a & 1) ? '1' : '0'; } return b; };
        v.render(() => {
          const text = String(msg.value).toLowerCase().replace(/[^abc]/g, '').slice(0, 14);
          const adaptive = model.value === 'adapt';
          ed.draw({ values: true, alpha: 0.4 });
          const pf = ed.p, cnt = [1, 1, 1];
          let lo = 0, hi = 1, logP = 0, impossible = false; const rows = [];
          for (let t = 0; t < text.length; t++) {
            const pr = adaptive ? cnt.map((c) => c / (cnt[0] + cnt[1] + cnt[2])) : pf.slice();
            const j = SYM.indexOf(text[t]); if (!(pr[j] > 0)) { impossible = true; break; } let cum = 0; const cs = [0, pr[0], pr[0] + pr[1], 1];
            const w = hi - lo; rows.push({ pr, j, lo, hi, cs, bits: commonBits(lo, hi) });
            hi = lo + w * cs[j + 1]; lo = lo + w * cs[j]; logP -= log2(pr[j]); cnt[j]++;
          }
          if (impossible) { info = { text, impossible: true }; return; }
          const final = { lo, hi, bits: commonBits(lo, hi) };
          const shown = Math.min(stepS.value, text.length);
          const R = Math.min(shown + 1, 15);
          for (let t = 0; t < Math.min(R, text.length + 1); t++) {
            const y = -t * 1.0, r = t < text.length ? rows[t] : null;
            if (r) {
              for (let a = 0; a < 3; a++) {
                const sel = a === r.j && t < shown + (shown < text.length ? 1 : 0) && t <= shown;
                const chosen = a === r.j && t < shown;
                s.rect(r.cs[a], y - 0.3, r.cs[a + 1], y + 0.3, { fill: COL3[a], fillAlpha: chosen ? 0.55 : 0.2, color: COL3[a], width: chosen ? 2.4 : 1 });
                if (r.cs[a + 1] - r.cs[a] > 0.07) s.text(SYM[a], (r.cs[a] + r.cs[a + 1]) / 2, y, { align: 'center', size: 12, weight: 700, color: 'ink', halo: false });
              }
              if (t < shown) {
                const a = r.j; s.line(r.cs[a], y - 0.3, 0, y - 0.7, { color: 'faint', width: 1 }); s.line(r.cs[a + 1], y - 0.3, 1, y - 0.7, { color: 'faint', width: 1 });
              }
              s.text(t < shown ? `${SYM[r.j]}` : '?', -0.0, y, { dx: -6, align: 'right', size: 12, color: 'muted', weight: 700 });
              const bits = rows[t].bits;
              s.text(bits ? `0.${bits}…` : '', 1.03, y, { align: 'left', size: 11.5, color: 'green', weight: 700, halo: false });
            }
          }
          // result
          const done = shown === text.length && text.length > 0;
          let code = '', dec = '', ok = false;
          if (done) {
            const tag = arithmeticTag(lo, hi);
            if (!tag) { info = { text, precision: true }; return; }
            code = tag.code; const val = tag.value;
            // decode
            const cnt2 = [1, 1, 1]; let l2 = 0, h2_ = 1; dec = '';
            for (let t = 0; t < text.length; t++) { const pr = adaptive ? cnt2.map((c) => c / (cnt2[0] + cnt2[1] + cnt2[2])) : pf.slice(); const w = h2_ - l2; const cs = [0, pr[0], pr[0] + pr[1], 1]; let a = 0; while (a < 2 && val >= l2 + w * cs[a + 1]) a++; dec += SYM[a]; h2_ = l2 + w * cs[a + 1]; l2 = l2 + w * cs[a]; cnt2[a]++; }
            ok = dec === text;
          }
          info = { text, shown, done, code, dec, ok, logP, adaptive };
        });
        v.readout(() => {
          const i = info; if (!i.text.length) return 'Type a message over a, b, c.';
          if (i.impossible) return 'The model assigns probability zero to a symbol in this message. Raise its fixed-model bar or choose the adaptive model.';
          if (i.precision) return 'The interval is too narrow for this floating-point demonstration. Use a shorter message or less extreme probabilities; practical coders renormalize.';
          if (!i.done) return `Step ${i.shown} of ${i.text.length}: move the slider to the end to see the final code and the decoding check.`;
          return `Message \`${i.text}\`: ideal length $-\\log_2P=${v.fix(i.logP, 2)}$ bits. Arithmetic code: \`${i.code}\` (${i.code.length} bits, < ${v.fix(i.logP + 2, 2)}). Decoded with the same ${i.adaptive ? 'adaptive ' : ''}model and known length $N=${i.text.length}$: \`${i.dec}\` ${i.ok ? '✓' : '✗'}. A plain symbol code would need at least ${i.text.length} bits.`;
        });
      },
    },
  ],
};
