// Probability: Theory and Examples (Durrett) — Chapter 4, part M1: §4.3 Examples (bounded increments, Doob decomposition, Lévy's Borel–Cantelli, Pólya's urn, likelihood ratios)
import { clampN, fr, sciT, walkPath, meanOf, pts, lawFromPmf, offspringLaw, LAW_OPTS, gwPath } from './ch04-m.shared.js';

// ---------- measures on [0,1) used by 4.3.5 and 4.3.6: mu = (1-w)*[density 6x(1-x)] + w*[singular part] ----------
const F_AC = (x) => 3 * x * x - 2 * x * x * x;           // integral of 6t(1-t) on [0,x]
const SING = {
  cantor: { label: 'Cantor measure', cdf: (M) => (x) => M.cantorFn(x) },
  atom: { label: 'atom at $1/3$', cdf: () => (x) => (x > 1 / 3 ? 1 : 0) },
  none: { label: 'none', cdf: () => () => 0 },
};
/** muCell(a, b): mu([a, b)) for the mixture. */
function muOf(M, kind, w) {
  const S = SING[kind].cdf(M);
  return (a, b) => (1 - w) * (F_AC(b) - F_AC(a)) + w * (kind === 'none' ? 0 : S(b) - S(a));
}
/** Likelihood ratio on the 2^n dyadic cells of [0,1). */
function ratios(mu, n) {
  const m = 2 ** n, out = new Float64Array(m);
  for (let k = 0; k < m; k++) out[k] = mu(k / m, (k + 1) / m) * m;
  return out;
}
const SING_OPTS = [{ value: 'cantor', label: 'Cantor' }, { value: 'atom', label: 'atom' }, { value: 'none', label: 'none' }];

export default {
  collection: 'prob',
  chapter: 4,
  items: [
    // ======================================================================== 4.3.1
    {
      num: '4.3.1',
      kind: 'Theorem',
      name: 'Bounded increments: converge or oscillate wildly',
      statement: String.raw`Let $X_n$ be a martingale whose increments are uniformly bounded, $|X_{n+1}-X_n|\le K<\infty$. Put
$$C=\{\lim_n X_n \text{ exists and is finite}\},\qquad D=\{\limsup_n X_n=+\infty,\ \liminf_n X_n=-\infty\}.$$
Then $P(C\cup D)=1$: almost every path either settles down or swings between arbitrarily large positive and negative values. There is no third behaviour (drifting off to $+\infty$, say).`,
      idea: String.raw`Fix $a$ and stop the martingale the first time it goes below $-a$ (a stopping time, by 4.2.8a). Bounded increments mean the stopped process is bounded below by $-a-K$, so adding the constant it becomes a nonnegative martingale, which converges by 4.2.12. Hence on $\{\inf_n X_n>-a\}$ the path converges. Letting $a\to\infty$ gives convergence on $\{\liminf X_n>-\infty\}$. The same argument applied to $-X_n$ handles $\{\limsup X_n<\infty\}$. What is left is exactly $D$.`,
      caption: String.raw`300 seeded paths, 40 drawn, are run for $3000$ steps and sorted by how much they still move in the second half (the range $R$ of $X_n$ over $n\ge1500$). Green paths have settled ($R<1$), red ones are still swinging ($R\ge3$) and orange ones have drifted away ($|X_{3000}|>0.06\cdot3000$). The classes are finite-horizon proxies for the events $C$ and $D$. Switch martingales: the gap in the histogram of $R$ is the theorem. The last option is not a martingale (biased steps): orange (drifting) paths appear, so the hypothesis matters. In the coin option about half the paths are frozen and half swing: both $C$ and $D$ can have positive probability.`,
      deps: ['prob-4.2.9', 'prob-4.2.12'],
      tags: ['martingales'],
      scope: String.raw`Needs bounded increments (not just integrable ones) and a genuine martingale (or at least a sub- or supermartingale along the lines of 4.2.12's proof).`,
      viz(v) {
        const reg = v.select('martingale', [
          { value: 'rw', label: 'steps $\\pm1$' }, { value: 'shrink', label: 'steps $\\pm1/n$' }, { value: 'exit', label: 'stop on leaving $(-6,6)$' },
          { value: 'mix', label: 'coin: frozen or walking' }, { value: 'bias', label: 'biased steps' },
        ], 'mix');
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 3000, MP = 300, H = N >> 1;
        const A = v.stage({ x: [0, N], y: [-90, 90], axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: 'paths $X_n$', weight: 1.4 });
        const B = v.stage({ x: [0, 60], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'range $R$ of $X_n$ over $n\\ge1500$', ylabel: 'fraction of paths', title: 'how much paths still move' });
        let cache = null, st = null;
        v.render(() => {
          const key = `${reg.value}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 977 + reg.value.length * 13 + 5), paths = [], cls = [], Rs = [];
            for (let i = 0; i < MP; i++) {
              const X = new Float64Array(N + 1), coin = r() < 0.5 ? 1 : 0; let stopped = false;
              for (let n = 1; n <= N; n++) {
                let d = r() < 0.5 ? 1 : -1;
                if (reg.value === 'shrink') d /= n;
                else if (reg.value === 'mix') d *= coin;
                else if (reg.value === 'bias') d = r() < 0.55 ? 1 : -1;
                else if (reg.value === 'exit') { if (stopped) d = 0; }
                X[n] = X[n - 1] + d;
                if (reg.value === 'exit' && Math.abs(X[n]) >= 6) stopped = true;
              }
              let lo = Infinity, hi = -Infinity;
              for (let n = H; n <= N; n++) { lo = Math.min(lo, X[n]); hi = Math.max(hi, X[n]); }
              const R = hi - lo;
              paths.push(X); Rs.push(R); cls.push(R < 1 ? 'C' : Math.abs(X[N]) > 0.06 * N ? 'E' : R >= 3 ? 'D' : 'U');
            }
            cache = { key, paths, cls, Rs };
          }
          const sc = { rw: 200, shrink: 2.5, exit: 9, mix: 200, bias: 200 }[reg.value];
          A.setView([0, N], reg.value === 'bias' ? [-100, 400] : [-sc, sc]);
          A.vline(H, { color: 'faint', dash: [4, 4] });
          const col = { C: 'green', D: 'red', E: 'orange', U: 'gold' };
          for (let i = 0; i < 40; i++) A.path(pts(cache.paths[i], 8), { color: col[cache.cls[i]], width: 1.1, alpha: 0.7 });
          const cnt = { C: 0, D: 0, E: 0, U: 0 }; cache.cls.forEach((c) => cnt[c]++);
          const hi = Math.max(1.2, ...cache.Rs) * 1.05, h = v.M.histogram(cache.Rs, { bins: 40, range: [0, hi] });
          const top = Math.max(...h.counts) / MP;
          B.setView([0, hi], [0, Math.min(1, top * 1.2)]);
          B.hist({ edges: h.edges, counts: h.counts.map((c) => c / MP) }, { color: 'accent' });
          B.vline(1, { color: 'green', dash: [4, 4] }); B.vline(3, { color: 'red', dash: [4, 4] });
          st = cnt;
        });
        v.legend([['green', 'settled'], ['red', 'still swinging'], ['orange', 'drifted away'], ['gold', 'in between']]);
        v.readout(() => st && `Of 300 paths: **${st.C}** settled ($R<1$), **${st.D}** still swinging ($R\\ge3$), **${st.E}** drifted away, **${st.U}** in between.${reg.value === 'bias' ? '\nThe steps have mean $+0.1$, so $X_n$ is a submartingale and not a martingale: paths run off to $+\\infty$.' : '\nBounded steps and a martingale: nothing but the first two groups.'}`);
      },
    },
    // ======================================================================== 4.3.2
    {
      num: '4.3.2',
      kind: 'Theorem',
      name: 'Doob’s decomposition',
      statement: String.raw`Every submartingale $X_n$ ($n\ge0$) can be written in exactly one way as
$$X_n=M_n+A_n,$$
where $M_n$ is a martingale and $A_n$ is **predictable** ($A_n\in\mathcal F_{n-1}$) and increasing, with $A_0=0$. Explicitly $A_n=\sum_{m=1}^n E(X_m-X_{m-1}\mid\mathcal F_{m-1})$. For a supermartingale the same holds with $A_n$ decreasing.`,
      idea: String.raw`Defining $A_n$ by the displayed sum makes it predictable, and it is increasing exactly because $X$ is a submartingale (every conditional increment is $\ge0$). Then $M_n=X_n-A_n$ has $E(M_n-M_{n-1}\mid\mathcal F_{n-1})=0$ by the definition of $A$. If $X=M'+A'$ is a second decomposition, $M_n-M'_n=A'_n-A_n$ is both a martingale and predictable, and a predictable martingale is constant ($E(Y_n\mid\mathcal F_{n-1})=Y_n$ and $=Y_{n-1}$), so it is $0$.`,
      caption: String.raw`A walk $S_n$ that steps up with probability $p$ is pushed through a function $g$, giving the path $X_n=g(S_n)$ (left). The compensator $A_n$ (middle, orange) adds up the conditional drift $pg(S+1)+(1-p)g(S-1)-g(S)$, computed from the current position only: it is predictable. What remains, $M_n=X_n-A_n$ (right, green), is a fair game: the dashed line is the average of $M_n$ over 400 seeded paths and stays at $X_0$. When $p=\tfrac12$, for $g=|s|$ the compensator counts visits $S_m=0$ for $0\le m<n$, and for $g=s^2$ it is $n$. Change $p$ to see $A$ stop being monotone when $X$ is no longer a submartingale.`,
      deps: ['prob-4.2.1a', 'prob-4.2.7a'],
      tags: ['martingales'],
      credit: 'J. L. Doob',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 4.3.2 and proof, p. 225'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      viz(v) {
        const G = {
          abs: { f: (s) => Math.abs(s), name: '|s|' }, sq: { f: (s) => s * s, name: 's^2' }, pos: { f: (s) => Math.max(s, 0), name: 's^+' }, neg: { f: (s) => -Math.abs(s), name: '-|s|' },
        };
        const gSel = v.select('$g$', [{ value: 'abs', label: '$|s|$' }, { value: 'sq', label: '$s^2$' }, { value: 'pos', label: '$s^+$' }, { value: 'neg', label: '$-|s|$' }], 'abs');
        const pS = v.slider('$p$ (up-step)', 0.3, 0.7, 0.5, { step: 0.01 });
        const nS = v.slider('$n$', 20, 300, 150, { int: true });
        let seed = 1; v.button('New path', () => { seed++; });
        const X = v.stage({ x: [0, 300], y: [-10, 10], axes: 'box', gutter: true, height: 270, xlabel: '$n$', title: '$X_n=g(S_n)$' });
        const Aa = v.stage({ x: [0, 300], y: [0, 10], axes: 'box', gutter: true, height: 270, xlabel: '$n$', title: 'predictable part $A_n$' });
        const Mm = v.stage({ x: [0, 300], y: [-10, 10], axes: 'box', gutter: true, height: 270, xlabel: '$n$', title: 'martingale part $M_n$' });
        function decompose(S, g, p) {
          const n = S.length - 1, Xs = new Float64Array(n + 1), As = new Float64Array(n + 1), Ms = new Float64Array(n + 1);
          Xs[0] = g(0); Ms[0] = Xs[0];
          for (let m = 1; m <= n; m++) {
            const s = S[m - 1], c = p * g(s + 1) + (1 - p) * g(s - 1) - g(s);
            As[m] = As[m - 1] + c; Xs[m] = g(S[m]); Ms[m] = Xs[m] - As[m];
          }
          return { Xs, As, Ms };
        }
        let st = null, cache = null;
        v.render(() => {
          const g = G[gSel.value].f, p = pS.value, n = nS.value;
          const r = v.rng(seed * 31 + 7), S = walkPath(r, 300, p), D = decompose(S.subarray(0, n + 1), g, p);
          const key = `${gSel.value}|${p}|${n}|${seed}`;
          if (!cache || cache.key !== key) {
            const rr = v.rng(4242), mA = new Float64Array(n + 1), mM = new Float64Array(n + 1), mX = new Float64Array(n + 1), M = 400;
            for (let i = 0; i < M; i++) {
              const d = decompose(walkPath(rr, n, p), g, p);
              for (let k = 0; k <= n; k++) { mA[k] += d.As[k] / M; mM[k] += d.Ms[k] / M; mX[k] += d.Xs[k] / M; }
            }
            cache = { key, mA, mM, mX };
          }
          const lim = (arr) => { let lo = Infinity, hi = -Infinity; for (const a of arr) { lo = Math.min(lo, a); hi = Math.max(hi, a); } return [lo, hi]; };
          const pad = (lo, hi, f = 0.12) => { const d = Math.max(hi - lo, 1e-6) * f; return [lo - d, hi + d]; };
          const [xl, xh] = lim(D.Xs), [al, ah] = lim(cache.mA), [a2l, a2h] = lim(D.As), [ml, mh] = lim(D.Ms);
          X.setView([0, n], pad(Math.min(xl, 0), Math.max(xh, 0)));
          Aa.setView([0, n], pad(Math.min(al, a2l, 0), Math.max(ah, a2h, 0.5)));
          Mm.setView([0, n], pad(Math.min(ml, cache.mM[0], 0), Math.max(mh, cache.mM[0], 0)));
          X.hline(0, { color: 'grid' }); Aa.hline(0, { color: 'grid' }); Mm.hline(0, { color: 'grid' });
          X.path(pts(D.Xs), { color: 'accent', width: 1.8 });
          X.path(pts(cache.mX), { color: 'muted', width: 1.3, dash: [5, 4] });
          Aa.path(pts(D.As), { color: 'orange', width: 2 });
          Aa.path(pts(cache.mA), { color: 'muted', width: 1.3, dash: [5, 4] });
          Mm.path(pts(D.Ms), { color: 'green', width: 1.8 });
          Mm.path(pts(cache.mM), { color: 'muted', width: 1.3, dash: [5, 4] });
          let minInc = Infinity; for (let k = 1; k <= n; k++) minInc = Math.min(minInc, D.As[k] - D.As[k - 1]);
          let resid = 0; for (let k = 0; k <= n; k++) resid = Math.max(resid, Math.abs(D.Xs[k] - D.Ms[k] - D.As[k]));
          st = { n, minInc, resid, eA: cache.mA[n], eX: cache.mX[n] - cache.mX[0], eM: cache.mM[n], X0: g(0), An: D.As[n], Mn: D.Ms[n] };
        });
        v.legend([['accent', 'one path'], ['muted', 'average of 400 paths', { dash: [5, 4] }]]);
        v.readout(() => st && `$n=${st.n}$: $A_n=${fr(st.An, 2)}$ (predictable), $M_n=${fr(st.Mn, 2)}$, residual $\\max|X-M-A|=${sciT(st.resid, 1)}$.\nAverages: $EM_n\\approx${fr(st.eM, 2)}$ (should be $X_0=${fr(st.X0, 0)}$), $EA_n\\approx${fr(st.eA, 2)}$ and $EX_n-X_0\\approx${fr(st.eX, 2)}$. Smallest one-step change of $A$: $${fr(st.minInc, 2)}$ ${st.minInc < -1e-9 ? '(negative: $X$ is not a submartingale here)' : '(never negative)'}.`);
      },
    },
    // ======================================================================== 4.3.4
    {
      num: '4.3.4',
      kind: 'Theorem',
      name: 'Lévy’s extension of the Borel–Cantelli lemmas',
      statement: String.raw`Let $(\mathcal F_n)_{n\ge0}$ be a filtration and $B_n\in\mathcal F_n$ for $n\ge1$. Then almost surely
$$\{B_n\ \text{infinitely often}\}=\Big\{\sum_{n\ge1}P(B_n\mid\mathcal F_{n-1})=\infty\Big\}.$$
For independent events $P(B_n\mid\mathcal F_{n-1})=P(B_n)$ and this is the pair of Borel–Cantelli lemmas; here the events may depend on the past in any way.`,
      idea: String.raw`Let $N_n=\sum_{m\le n}1_{B_m}$ and $S_n=\sum_{m\le n}P(B_m\mid\mathcal F_{m-1})$. Then $N_n-S_n$ is a martingale (it is the martingale part in Doob's decomposition, 4.3.2) with increments bounded by $1$. By 4.3.1 it either converges or oscillates between $\pm\infty$. If $S_\infty<\infty$ the oscillating case is impossible, since $N_n\ge0$ gives $N_n-S_n\ge-S_\infty$; so $N_\infty<\infty$ too. If $S_\infty=\infty$, the same argument applied to the stopped martingales shows $N_\infty=\infty$.`,
      caption: String.raw`Events $B_n$ whose probability given the past is $q_n$ (the dashed orange curve $S_n=\sum q_m$ against the solid blue count $N_n$, one path, $n$ on a log axis). Pick a rule: independent $1/(n+1)$ (diverges), independent $1/(n+1)^2$ (converges), "environment" (the rate is $1/(n+1)$ while a hidden walk with a coin-chosen drift is $\ge0$, else $1/(n+1)^2$: both fates occur), and "clumping" (after an occurrence the next probability jumps to $0.5$). Right: $N_{N}$ against $S_{N}$ for 150 paths at $N=20000$; they lie together, and large $N$ goes with large $S$.`,
      deps: ['prob-4.3.1', 'prob-4.3.2'],
      tags: ['borel-cantelli', 'martingales'],
      credit: 'Paul Lévy',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 4.3.4 and proof, pp. 225–226'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      viz(v) {
        const rule = v.select('rule', [{ value: 'one', label: '$1/(n+1)$' }, { value: 'two', label: '$1/(n+1)^2$' }, { value: 'env', label: 'environment' }, { value: 'clump', label: 'clumping' }], 'env');
        let seed = 1; v.button('Next path', () => { seed++; });
        const T = 20000, NP = 150;
        const L = v.stage({ x: [1, T], y: [0, 14], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$N_n$ (blue) and $S_n=\\sum q_m$ (orange)', weight: 1.3 });
        const R = v.stage({ x: [0, 16], y: [0, 16], axes: 'box', gutter: true, height: 320, xlabel: '$S_N$', ylabel: '$N_N$', title: '150 paths at $N=20000$', equal: true });
        function run(r, kind) {
          const Ns = new Float32Array(T + 1), Ss = new Float32Array(T + 1); let N = 0, S = 0, W = 0, last = 0; const coin = r() < 0.5, pw = coin ? 0.7 : 0.3;
          for (let n = 1; n <= T; n++) {
            let q;
            if (kind === 'one') q = 1 / (n + 1);
            else if (kind === 'two') q = 1 / ((n + 1) * (n + 1));
            else if (kind === 'env') q = W >= 0 ? 1 / (n + 1) : 1 / ((n + 1) * (n + 1));
            else q = last ? 0.5 : 1 / ((n + 1) * (n + 1));
            if (kind === 'env') W += r() < pw ? 1 : -1;
            const hit = r() < q ? 1 : 0; N += hit; S += q; last = hit; Ns[n] = N; Ss[n] = S;
          }
          return { Ns, Ss, N, S };
        }
        let cache = null, st = null;
        v.render(() => {
          if (!cache || cache.rule !== rule.value) {
            const r = v.rng(99 + rule.value.length * 7), runs = []; for (let i = 0; i < NP; i++) runs.push(run(r, rule.value)); cache = { rule: rule.value, runs };
          }
          const one = run(v.rng(seed * 811 + 3 + rule.value.length), rule.value), xs = [];
          for (let k = 0; k <= 160; k++) xs.push(Math.round(Math.exp((Math.log(T) * k) / 160)));
          const top = Math.max(2, one.N, one.S) * 1.25;
          L.setView([1, T], [0, top]);
          L.path(xs.map((n) => [n, one.Ss[n]]), { color: 'orange', width: 2, dash: [6, 4] });
          L.path(xs.map((n) => [n, one.Ns[n]]), { color: 'accent', width: 1.8 });
          const mx = Math.max(4, ...cache.runs.map((u) => Math.max(u.N, u.S))) * 1.1;
          R.setView([0, mx], [0, mx]);
          R.line(0, 0, mx, mx, { color: 'muted', dash: [4, 4] });
          R.dots(cache.runs.map((u) => [u.S, u.N]), { r: 3.2, color: 'accent', alpha: 0.45 });
          R.dot(one.S, one.N, { r: 6, color: 'gold' });
          const big = cache.runs.filter((u) => u.S >= 6), small = cache.runs.filter((u) => u.S < 2);
          st = { N: one.N, S: one.S, nbig: big.length, ratio: big.length ? meanOf(Float64Array.from(big, (u) => u.N / u.S)) : NaN, nsmall: small.length, maxSmall: small.length ? Math.max(...small.map((u) => u.N)) : NaN };
        });
        v.legend([['accent', '$N_n$ (occurrences)'], ['orange', '$S_n$ (sum of conditional probabilities)', { dash: [6, 4] }], ['gold', 'this path', { dot: true }]]);
        v.readout(() => st && `This path: $N=${st.N}$ occurrences, $S=${fr(st.S, 2)}$.\nAmong 150 paths: **${st.nbig}** have $S_N\\ge6$ and there $N_N/S_N$ averages ${isNaN(st.ratio) ? '—' : '$' + fr(st.ratio, 2) + '$'}; **${st.nsmall}** have $S_N<2$ and there $N_N\\le ${isNaN(st.maxSmall) ? '?' : st.maxSmall}$.`);
      },
    },
    // ======================================================================== 4.3.4a
    {
      num: '4.3.4a',
      kind: 'Theorem',
      name: 'Pólya’s urn: the colour fraction converges to a Beta limit',
      statement: String.raw`An urn holds $b$ black and $r$ red balls ($b,r>0$). Repeatedly draw a ball uniformly at random and return it together with one more ball of the same colour. Let $X_n$ be the fraction of black balls after $n$ draws. Then $X_n$ is a martingale, $X_n\to X_\infty$ almost surely, and
$$X_\infty\sim\mathrm{Beta}(b,r),\qquad\text{density }\frac{x^{b-1}(1-x)^{r-1}}{B(b,r)}\ \text{on }(0,1).$$
For $b=r=1$ the limit is uniform.`,
      idea: String.raw`Given the history, the fraction after the next draw is $\frac{B+1}{T+1}$ with probability $\frac BT$ and $\frac{B}{T+1}$ otherwise, whose mean is $\frac BT$: a martingale taking values in $[0,1]$, hence convergent by 4.2.12 (shift by a constant to make it nonnegative). To identify the limit, note that the probability of any particular sequence of $k$ black and $n-k$ red draws is $\frac{b^{\overline k}\,r^{\overline{n-k}}}{(b+r)^{\overline n}}$ (rising factorials) whatever the order. These are the moments of a Beta$(b,r)$ variable, so conditioned on the limit the draws behave like i.i.d. coin flips with a Beta$(b,r)$ random bias.`,
      caption: String.raw`Left: fraction of black balls for 40 seeded urns against the number of draws (log axis); every path flattens out, each at its own random level. Right: the histogram of the fraction over 1500 urns after $n$ draws, with the Beta$(b,r)$ density drawn over it (green). Change the starting counts $b,r$ (try $1,1$, then $1,4$ and $8,8$), and shorten $n$ to see the histogram approach the density. The readout gives the Kolmogorov distance between the 1500 sampled fractions and the Beta law.`,
      deps: ['prob-4.2.12'],
      see: ['stoch-12.10', 'stat-10.4'],
      tags: ['martingales', 'urns'],
      scope: String.raw`The picture adds one ball of the sampled colour per draw. Adding $c>0$ balls instead gives a Beta$(b/c,r/c)$ limit, as derived in Durrett §4.3.2.`,
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), §4.3.2, pp. 226–227 (Polya urn and general Beta limit)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      viz(v) {
        const bS = v.slider('black $b$', 1, 10, 2, { int: true });
        const rS = v.slider('red $r$', 1, 10, 3, { int: true });
        const nSel = v.select('draws $n$', [5, 20, 100, 500, 1000].map((n) => ({ value: n, label: String(n) })), 100);
        let seed = 1; v.button('Resample', () => { seed++; });
        const MAXN = 1000, NP = 1500, CP = [5, 20, 100, 500, 1000];
        const P = v.stage({ x: [1, MAXN], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: 'draws $n$', title: 'fraction of black balls', weight: 1.3 });
        const Hs = v.stage({ x: [0, 1], y: [0, 3], axes: 'box', gutter: true, height: 320, xlabel: 'fraction of black', title: 'histogram of 1500 urns vs Beta$(b,r)$', weight: 1 });
        let cache = null, st = null;
        v.render(() => {
          const b = bS.value, r0 = rS.value, key = `${b}|${r0}|${seed}`;
          if (!cache || cache.key !== key) {
            const rng = v.rng(seed * 101 + b * 7 + r0), snaps = CP.map(() => new Float64Array(NP)), shown = [];
            for (let i = 0; i < NP; i++) {
              let B = b, T = b + r0, c = 0; const path = i < 40 ? [] : null;
              for (let n = 1; n <= MAXN; n++) {
                if (rng() * T < B) B++; T++;
                if (path && (n < 40 || n % 8 === 0 || n === MAXN)) path.push([n, B / T]);
                if (n === CP[c]) { snaps[c][i] = B / T; c++; }
              }
              if (path) shown.push(path);
            }
            cache = { key, snaps, shown };
          }
          const be = v.M.dist.beta(b, r0), idx = CP.indexOf(nSel.value), xs = cache.snaps[idx];
          P.hline(b / (b + r0), { color: 'muted', dash: [4, 4] });
          for (const path of cache.shown) P.path(path, { color: 'accent', width: 1, alpha: 0.5 });
          const hh = v.M.histogram(xs, { bins: 40, range: [0, 1] });
          const ymax = Math.max(1.3, Math.max(...hh.counts) * 40 / NP, ...Array.from({ length: 101 }, (_, i) => be.pdf(0.005 + 0.99 * i / 100)).filter(isFinite).map((y) => Math.min(y, 6))) * 1.12;
          Hs.setView([0, 1], [0, ymax]);
          Hs.hist(xs, { bins: 40, range: [0, 1], density: true, color: 'accent', fillAlpha: 0.35 });
          Hs.fn((x) => Math.min(be.pdf(x), 1e3), { color: 'green', width: 2.4, domain: [0.002, 0.998], n: 400 });
          P.vline(nSel.value, { color: 'gold', dash: [4, 4] });
          const s = Array.from(xs).sort((a, c) => a - c); let ks = 0;
          s.forEach((x, i) => { const F = be.cdf(x); ks = Math.max(ks, Math.abs((i + 1) / s.length - F), Math.abs(i / s.length - F)); });
          let m = 0, m2 = 0; for (const x of xs) { m += x / NP; m2 += x * x / NP; }
          st = { m, sd: Math.sqrt(m2 - m * m), bm: be.mean, bs: Math.sqrt(be.variance), ks, n: nSel.value, ks95: 1.36 / Math.sqrt(NP) };
        });
        v.legend([['accent', 'urn paths / histogram'], ['green', 'Beta$(b,r)$ density'], ['muted', 'start fraction $b/(b+r)$', { dash: [4, 4] }]]);
        v.readout(() => st && `After $n=${st.n}$ draws: mean $${fr(st.m, 3)}$ (Beta: $${fr(st.bm, 3)}$), standard deviation $${fr(st.sd, 3)}$ (Beta: $${fr(st.bs, 3)}$).\nKolmogorov distance to Beta$(b,r)$: $${fr(st.ks, 3)}$ (a 5% sampling threshold for 1500 samples is $${fr(st.ks95, 3)}$).`);
      },
    },
    // ======================================================================== 4.3.5
    {
      num: '4.3.5',
      kind: 'Theorem',
      name: 'Lebesgue decomposition via the likelihood-ratio martingale',
      statement: String.raw`Let $\mu$ and $\nu$ be finite measures on $(\Omega,\mathcal F)$, where $\mathcal F=\sigma(\bigcup_n\mathcal F_n)$ and each $\mathcal F_n$ is generated by a countable partition into sets of positive $\nu$-measure. Let $X_n=d\mu_n/d\nu_n$ (the ratio of the masses of the cells) and $X=\limsup X_n$. Then $X_n\to X$ $\nu$-a.s., and
$$\mu(A)=\int_AX\,d\nu+\mu(A\cap\{X=\infty\}).$$
The first term is the part of $\mu$ absolutely continuous with respect to $\nu$; the second is a part concentrated on a $\nu$-null set, the singular part.`,
      idea: String.raw`Under $\nu$, $X_n$ is a nonnegative martingale (Lemma 4.3.6), so it converges $\nu$-a.s. by 4.2.12. By Fatou (1.6.5), $\int_AX\,d\nu\le\mu(A)$ on each $\mathcal F_n$-set and then on all of $\mathcal F$. To show that the remaining mass sits exactly on $\{X=\infty\}$, one runs the same argument for $\mu$ against the sum $\mu+\nu$: the ratio $d\mu_n/d(\mu+\nu)_n=X_n/(1+X_n)$ is bounded, and the limit is $<1$ where $X<\infty$ and $=1$ where $X=\infty$.`,
      caption: String.raw`The measure $\mu=(1-w)\cdot 6x(1-x)\,dx+w\cdot$(singular part) on $[0,1)$ is compared with Lebesgue measure on the $2^n$ dyadic cells. Left: $X_n$ as a bar chart; the dashed green curve is the density of the absolutely continuous part. Cells above the top of the plot are clipped and marked red. Raise $n$ and the bars follow the curve where $\mu$ is spread out and spike on the singular support. Right: the mass of $\mu$ sitting on cells with $X_n\le K$ (green) and on cells with $X_n>K$ (red), against $n$: the first tends to $1-w$, the second to $w$ once $K$ is below the spikes (the Cantor ratios grow only like $2^{0.37n}$, so give $n$ and $K$ room).`,
      deps: ['prob-4.2.12', 'prob-4.1.1a'],
      see: ['prob-10.4.7'],
      tags: ['martingales', 'radon-nikodym'],
      scope: String.raw`The picture takes $\nu=$ Lebesgue measure on $[0,1)$ with dyadic cells and $\mu=(1-w)\cdot6x(1-x)\,dx+w\cdot\sigma$, where $\sigma$ is the Cantor measure or an atom at $1/3$.`,
      viz(v) {
        const sing = v.select('singular part', SING_OPTS, 'cantor');
        const wS = v.slider('weight $w$', 0, 1, 0.4, { step: 0.01 });
        const nS = v.slider('level $n$', 1, 13, 9, { int: true });
        const kS = v.slider('threshold $K$', 1.5, 40, 3, { log: true });
        const L = v.stage({ x: [0, 1], y: [0, 5], axes: 'box', gutter: true, height: 320, xlabel: '$x$', title: '$X_n=\\mu(I)/\\lambda(I)$ on dyadic cells', weight: 1.3 });
        const R = v.stage({ x: [1, 13], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'level $n$', title: 'mass of $\\mu$ on $\\{X_n\\le K\\}$ and $\\{X_n>K\\}$' });
        let cache = null, st = null;
        v.render(() => {
          const w = sing.value === 'none' ? 0 : wS.value, key = `${sing.value}|${w}`;
          if (!cache || cache.key !== key) {
            const mu = muOf(v.M, sing.value, w), lv = []; for (let n = 1; n <= 13; n++) lv.push(ratios(mu, n)); cache = { key, lv, mu };
          }
          const n = nS.value, K = kS.value, X = cache.lv[n - 1], m = 2 ** n;
          let top = 5;
          L.setView([0, 1], [0, top]);
          const edges = [], pos = [];
          for (let k = 0; k < m; k++) { const hgt = Math.min(X[k], top); pos.push([k / m, hgt], [(k + 1) / m, hgt]); }
          L.path([[0, 0], ...pos, [1, 0]], { color: 'accent', width: n > 9 ? 1 : 1.6, fill: 'accent', fillAlpha: 0.25, close: true });
          L.fn((x) => (1 - w) * 6 * x * (1 - x), { color: 'green', width: 2.2, dash: [6, 4] });
          const clipped = []; for (let k = 0; k < m; k++) if (X[k] > top) clipped.push([(k + 0.5) / m, top - 0.12]);
          if (clipped.length) L.dots(clipped.slice(0, 600), { r: 3.2, color: 'red' });
          const below = [], above = [];
          for (let j = 1; j <= 13; j++) {
            const x = cache.lv[j - 1], mm = 2 ** j; let a = 0, b = 0;
            for (let k = 0; k < mm; k++) { const mass = x[k] / mm; if (x[k] > K) b += mass; else a += mass; }
            below.push([j, a]); above.push([j, b]);
          }
          R.path(below, { color: 'green', width: 2.2 }); R.path(above, { color: 'red', width: 2.2 });
          R.dots(below, { r: 3.5, color: 'green' }); R.dots(above, { r: 3.5, color: 'red' });
          R.hline(1 - w, { color: 'green', dash: [4, 4], alpha: 0.6 }); R.hline(w, { color: 'red', dash: [4, 4], alpha: 0.6 });
          R.vline(n, { color: 'gold', dash: [4, 4] });
          st = { n, K, w, a: below[n - 1][1], b: above[n - 1][1], nclip: clipped.length };
        });
        v.legend([['accent', '$X_n$'], ['green', 'density of a.c. part', { dash: [6, 4] }], ['red', 'clipped / mass above $K$']]);
        v.readout(() => st && `$n=${st.n}$, $K=${fr(st.K, 1)}$: mass on $\\{X_n\\le K\\}$ is $${fr(st.a, 3)}$ (limit $1-w=${fr(1 - st.w, 3)}$), mass on $\\{X_n>K\\}$ is $${fr(st.b, 3)}$ (limit $w=${fr(st.w, 3)}$). The two always add to $\\mu([0,1))=1$.`);
      },
    },
    // ======================================================================== 4.3.6
    {
      num: '4.3.6',
      kind: 'Lemma',
      name: 'Likelihood ratios form a martingale',
      statement: String.raw`In the setting of 4.3.5, with $\mu_n=\mu|_{\mathcal F_n}$ and $\nu_n=\nu|_{\mathcal F_n}$ and $\mu_n\ll\nu_n$, the likelihood ratio $X_n=d\mu_n/d\nu_n$ is a nonnegative martingale on $(\Omega,\mathcal F,\nu)$ with $E_\nu X_n=\mu(\Omega)$. On dyadic cells of $[0,1)$ this says: the ratio on a cell is the average of the ratios on its two halves,
$$\frac{\mu(I)}{\lambda(I)}=\tfrac12\Big(\frac{\mu(I_0)}{\lambda(I_0)}+\frac{\mu(I_1)}{\lambda(I_1)}\Big).$$`,
      idea: String.raw`For $A\in\mathcal F_m$ and $n\ge m$, $\int_AX_n\,d\nu=\mu_n(A)=\mu(A)=\int_AX_m\,d\nu$. That is exactly the defining property of $E(X_n\mid\mathcal F_m)=X_m$ (4.1.1a). On dyadic cells, $\lambda(I_0)=\lambda(I_1)=\tfrac12\lambda(I)$ and $\mu(I)=\mu(I_0)+\mu(I_1)$, giving the averaging identity.`,
      caption: String.raw`The pyramid has one row per level; cell colour is the ratio $\mu(I)/\lambda(I)$ (stronger colour = larger), with its value written in the upper rows. Click any cell: it is outlined, its two children in the row below are highlighted, and the readout checks that the parent's ratio is the average of the children's. The right panel follows one point $x$ down the pyramid (the clicked column): the sequence $X_0,X_1,\dots$ is a path of the martingale, and the dashed line at $1$ is $E_\lambda X_n$, which never moves.`,
      deps: ['prob-4.2.1a', 'prob-4.1.1a'],
      see: ['prob-4.3.5'],
      tags: ['martingales', 'radon-nikodym'],
      viz(v) {
        const sing = v.select('singular part', SING_OPTS, 'cantor');
        const wS = v.slider('weight $w$', 0, 1, 0.4, { step: 0.01 });
        const LV = 6;
        const P = v.stage({ x: [0, 1], y: [0, LV + 1], axes: false, height: 340, title: 'ratios $\\mu(I)/\\lambda(I)$, level $0$ on top (click a cell)', weight: 1.3 });
        const Pa = v.stage({ x: [0, 10], y: [0, 4], axes: 'box', gutter: true, height: 340, xlabel: 'level $n$', title: 'the martingale along the clicked point' });
        let sel = { n: 2, k: 1 }, st = null, cache = null;
        const m = (n) => 2 ** n;
        P.onClick((x, y) => {
          const n = clampN(LV - Math.floor(y), 0, LV);
          sel = { n, k: clampN(Math.floor(x * m(n)), 0, m(n) - 1) };
          v.invalidate();
        });
        v.render(() => {
          const w = sing.value === 'none' ? 0 : wS.value, key = `${sing.value}|${w}`;
          if (!cache || cache.key !== key) { const mu = muOf(v.M, sing.value, w), lv = []; for (let n = 0; n <= 10; n++) lv.push(ratios(mu, n)); cache = { key, lv }; }
          const lv = cache.lv;
          for (let n = 0; n <= LV; n++) {
            const row = LV - n, mm = m(n);
            for (let k = 0; k < mm; k++) {
              const val = lv[n][k], t = Math.min(1, val / 2) ** 0.7;
              P.rect(k / mm, row + 0.08, (k + 1) / mm, row + 0.92, { fill: 'accent', fillAlpha: 0.05 + 0.75 * t, color: 'panel', width: 1, stroke: mm <= 16 });
              if (mm <= 8) P.text(fr(val, 2), (k + 0.5) / mm, row + 0.5, { size: 11, align: 'center', baseline: 'middle', color: 'ink' });
            }
          }
          const { n, k } = sel, row = LV - n, mm = m(n);
          P.rect(k / mm, row + 0.08, (k + 1) / mm, row + 0.92, { color: 'gold', width: 3, fill: false });
          if (n < LV) for (const c of [2 * k, 2 * k + 1]) P.rect(c / (2 * mm), row - 1 + 0.08, (c + 1) / (2 * mm), row - 1 + 0.92, { color: 'orange', width: 3, fill: false });
          // the path of the clicked point
          const xpt = (k + 0.5) / mm, path = [];
          for (let j = 0; j <= 10; j++) path.push([j, lv[j][Math.min(m(j) - 1, Math.floor(xpt * m(j)))]]);
          Pa.setView([0, 10], [0, Math.max(2, ...path.map((q) => q[1])) * 1.1]);
          Pa.hline(1, { color: 'muted', dash: [5, 4] });
          Pa.path(path, { color: 'accent', width: 2, close: false });
          Pa.dots(path, { r: 3.5, color: 'accent' });
          Pa.vline(n, { color: 'gold', dash: [4, 4] });
          let worst = 0; for (let j = 0; j < 10; j++) for (let c = 0; c < m(j); c++) worst = Math.max(worst, Math.abs(lv[j][c] - (lv[j + 1][2 * c] + lv[j + 1][2 * c + 1]) / 2));
          let means = []; for (let j = 0; j <= 10; j++) means.push(meanOf(lv[j]));
          st = { n, k, parent: lv[n][k], l: n < 10 ? lv[n + 1][2 * k] : NaN, r: n < 10 ? lv[n + 1][2 * k + 1] : NaN, worst, mm: Math.max(...means.map((x) => Math.abs(x - 1))), x: xpt };
        });
        v.legend([['gold', 'selected cell'], ['orange', 'its children'], ['accent', 'path of $X_n(x)$']]);
        v.readout(() => st && `Cell $(n,k)=(${st.n},${st.k})$: parent ratio $${fr(st.parent, 4)}$; children $${fr(st.l, 4)}$ and $${fr(st.r, 4)}$, average $${fr((st.l + st.r) / 2, 4)}$.\nLargest violation of "ratio = average of children" over all cells to level $10$: $${sciT(st.worst, 1)}$. $\\max_n|E_\\lambda X_n-1|=${sciT(st.mm, 1)}$.`);
      },
    },
    // ======================================================================== 4.3.8
    {
      num: '4.3.8',
      kind: 'Theorem',
      name: 'Kakutani dichotomy for product measures',
      statement: String.raw`Let $\mu=\prod_n\mu_n$ and $\nu=\prod_n\nu_n$ be infinite product measures with $\nu_n\ll\mu_n$, and let $a_n=\int\sqrt{d\nu_n/d\mu_n}\,d\mu_n\in(0,1]$ (the Hellinger affinity). Then either $\nu\ll\mu$ or $\nu\perp\mu$, and
$$\nu\ll\mu\iff\prod_na_n>0,\qquad \nu\perp\mu\iff\prod_na_n=0.$$
Under $\mu$ the likelihood ratio $R_n=\prod_{k\le n}\frac{d\nu_k}{d\mu_k}$ then converges to a limit that is positive a.s. in the first case and is $0$ a.s. in the second.`,
      idea: String.raw`Under $\mu$, $R_n$ is a nonnegative martingale (4.3.6), so $R_n\to R$ a.s. The square roots $\sqrt{R_n}$ have mean $E\sqrt{R_n}=\prod_{k\le n}a_k$ by independence. If $\prod a_k=0$ this mean tends to $0$, so $R=0$ a.s. and $\nu\perp\mu$ by 4.3.5. If $\prod a_k>0$, $\sqrt{R_n}$ is Cauchy in $L^2$ (the product of the $a_k$ controls $E(\sqrt{R_n}-\sqrt{R_m})^2$), so $R_n$ is uniformly integrable and $\nu\ll\mu$ with density $R$. The zero-one law (1.6.2 gives the inequality $a_n\le1$) rules out anything in between.`,
      caption: String.raw`$\mu$ is an infinite sequence of fair coins and $\nu$ a sequence of coins with bias $\tfrac12+\varepsilon_n$, $\varepsilon_n=c\,n^{-\gamma}$ (capped at $0.49$). Left: paths of $R_n$ under $\mu$ on log-log axes. Right: the partial affinity products $\prod_{k\le n}a_k$ (blue, exact) and Monte Carlo estimates of $E\sqrt{R_n}$ (gold dots, 600 paths) which agree with it. Cross $\gamma=\tfrac12$ (where $\sum\varepsilon_n^2$ changes from divergent to convergent): below it the product sinks to $0$ and every $R_n$ collapses; above it the product levels off at a positive limit and the paths settle at positive values.`,
      deps: ['prob-4.3.5', 'prob-1.6.2'],
      tags: ['martingales', 'radon-nikodym'],
      credit: 'S. Kakutani, 1948 (Ann. of Math. 49, 214–224)',
      viz(v) {
        const gS = v.slider('exponent $\\gamma$', 0.2, 1.2, 0.35, { step: 0.01 });
        const cS = v.slider('size $c$', 0.05, 0.45, 0.3, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const T = 3000, NP = 600;
        const L = v.stage({ x: [1, T], y: [1e-8, 1e3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, xlabel: '$n$', title: 'likelihood ratio $R_n$ under fair coins $\\mu$', weight: 1.3 });
        const R = v.stage({ x: [1, T], y: [0, 1.05], xlog: true, axes: 'box', gutter: true, height: 330, xlabel: '$n$', title: '$\\prod a_k$ (exact) and $E\\sqrt{R_n}$ (Monte Carlo)' });
        let cache = null, st = null;
        v.render(() => {
          const g = gS.value, c = cS.value, key = `${g}|${c}|${seed}`;
          if (!cache || cache.key !== key) {
            const eps = new Float64Array(T + 1), prod = new Float64Array(T + 1); prod[0] = 1; let s2 = 0;
            for (let k = 1; k <= T; k++) { eps[k] = Math.min(0.49, c * k ** -g); prod[k] = prod[k - 1] * 0.5 * (Math.sqrt(1 + 2 * eps[k]) + Math.sqrt(1 - 2 * eps[k])); s2 += eps[k] ** 2; }
            const rng = v.rng(seed * 59 + 11), cps = new Set(), cp = [];
            for (let j = 0; j <= 70; j++) cps.add(Math.max(1, Math.round(Math.exp((Math.log(T) * j) / 70))));
            cps.forEach((x) => cp.push(x)); cp.sort((x, y) => x - y);
            const emp = cp.map(() => 0), isCp = new Uint8Array(T + 1); cp.forEach((x) => { isCp[x] = 1; });
            const finals = new Float64Array(NP), paths = [];
            for (let i = 0; i < NP; i++) {
              let l = 0; const row = [];
              for (let k = 1; k <= T; k++) {
                l += Math.log(rng() < 0.5 ? 1 + 2 * eps[k] : 1 - 2 * eps[k]);
                if (isCp[k]) row.push(l);
              }
              finals[i] = l; for (let j = 0; j < cp.length; j++) emp[j] += Math.exp(0.5 * row[j]) / NP;
              if (i < 25) paths.push(row);
            }
            cache = { key, prod, emp, cp, paths, finals, s2, eps };
          }
          const fin = cache.paths.map((row) => Math.exp(row[row.length - 1])), lo = Math.max(1e-60, Math.min(...fin) * 0.2), hi = Math.max(20, Math.max(...fin) * 4);
          L.setView([1, T], [Math.min(lo, 0.01), hi]);
          L.hline(1, { color: 'muted', dash: [5, 4] });
          for (const row of cache.paths) L.path(row.map((l, j) => [cache.cp[j], Math.max(Math.exp(l), 1e-60)]), { color: 'accent', width: 1.1, alpha: 0.55 });
          const xs = []; for (let k = 0; k <= 120; k++) xs.push(Math.max(1, Math.round(Math.exp((Math.log(T) * k) / 120))));
          R.hline(0, { color: 'grid' });
          R.path(xs.map((n) => [n, cache.prod[n]]), { color: 'accent', width: 2.4 });
          R.dots(cache.cp.map((n, j) => [n, cache.emp[j]]), { r: 4, color: 'gold' });
          const lim = cache.prod[T], pos = Array.from(cache.finals).filter((l) => l > Math.log(0.01)).length;
          st = { s2: cache.s2, lim, frac: pos / NP, med: v.M.median(Array.from(cache.finals).map(Math.exp)), g: gS.value };
        });
        v.legend([['accent', '$R_n$ paths / exact $\\prod a_k$'], ['gold', 'Monte Carlo $E\\sqrt{R_n}$', { dot: true }]]);
        v.readout(() => st && `$\\sum_{k\\le3000}\\varepsilon_k^2=${fr(st.s2, 3)}$ (${st.g > 0.5 ? 'the series converges' : 'the series diverges'}), $\\prod_{k\\le3000}a_k=${fr(st.lim, 4)}$.\nAt $n=3000$: median $R_n=${sciT(st.med, 2)}$; **${fr(100 * st.frac, 0)}%** of paths still have $R_n>0.01$.`);
      },
    },
    // ======================================================================== 4.3.8a
    {
      num: '4.3.8a',
      kind: 'Definition',
      name: 'Galton–Watson branching process',
      statement: String.raw`Let $p_0,p_1,p_2,\dots$ be a probability distribution on $\{0,1,2,\dots\}$ (the **offspring law**) and let $\xi^n_i$ ($n\ge1$, $i\ge1$) be i.i.d. with this law. The **Galton–Watson process** with $Z_0=1$ is
$$Z_{n+1}=\sum_{i=1}^{Z_n}\xi^{n+1}_i\qquad(\text{and }Z_{n+1}=0\text{ if }Z_n=0).$$
$Z_n$ is the number of individuals in generation $n$ when every individual independently leaves a random number of children. Write $\mu=\sum_kkp_k$ for the mean offspring number and $\varphi(s)=\sum_kp_ks^k$ for the generating function.`,
      idea: String.raw`The process is a Markov chain on $\{0,1,\dots\}$ with $0$ absorbing. The independence of the $\xi$'s makes the family tree "renew" at every individual, which gives $E(Z_{n+1}\mid\mathcal F_n)=\mu Z_n$ (the martingale of 4.3.9) and $E s^{Z_n}=\varphi^{\circ n}(s)$, the $n$-fold iterate of $\varphi$. The fundamental question is whether the line dies out, answered by the sign of $\mu-1$ (4.3.10–4.3.12).`,
      caption: String.raw`A family tree grows from one ancestor generation by generation; each node's number of children is drawn from the offspring law you choose. Change the law and its mean $m$, add generations, and resample. Right: the generation sizes $Z_n$ (bars) against $\mu^n$ (dashed). The simulation stops at the generation that pushes the total past 700 individuals, so supercritical trees show fewer generations.`,
      deps: ['prob-2.2.3a'],
      see: ['stoch-3.9', 'soc-5.8'],
      tags: ['branching'],
      scope: String.raw`Individuals reproduce independently with the same nonnegative integer-valued offspring law. The illustration starts with one ancestor and truncates drawing when its tree reaches 700 individuals.`,
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), §4.3.4, pp. 229–230 (branching-process definition)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      viz(v) {
        const law = v.select('offspring law', LAW_OPTS, 'poisson');
        const mS = v.slider('mean $m$', 0.2, 2, 1.6, { step: 0.05 });
        const gS = v.slider('generations shown', 1, 8, 6, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const T = v.stage({ x: [0, 1], y: [-8.6, 0.8], axes: false, height: 360, title: 'family tree', weight: 1.5 });
        const Bz = v.stage({ x: [-0.5, 8.5], y: [0, 10], axes: 'box', gutter: true, height: 360, xlabel: 'generation $n$', ylabel: '$Z_n$', title: 'generation sizes', weight: 1 });
        let st = null;
        v.render(() => {
          const m = law.value === 'binary' ? Math.min(2, mS.value) : mS.value, L = offspringLaw(law.value, m);
          const rng = v.rng(seed * 313 + 17), kids = [], sizes = [1]; let total = 1, cut = false;
          for (let g = 0; g < 8; g++) {
            const next = []; kids[g] = [];
            for (let i = 0; i < sizes[g]; i++) { const c = L.sample(rng), lst = []; for (let j = 0; j < c; j++) { lst.push(next.length); next.push(0); } kids[g].push(lst); }
            sizes.push(next.length); total += next.length;
            if (total > 700) { cut = true; kids[g + 1] = Array.from({ length: next.length }, () => []); break; }
          }
          const G = Math.min(gS.value, sizes.length - 1);
          // widths of subtrees truncated at depth G
          const width = (g, i) => (g >= G || !kids[g][i].length ? 1 : kids[g][i].reduce((s, c) => s + width(g + 1, c), 0));
          const W = width(0, 0); let drawn = 0;
          const place = (g, i, x0) => {
            const w = width(g, i), x = (x0 + w / 2) / W, y = -g;
            if (g < G) { let cx = x0; for (const c of kids[g][i]) { const cw = width(g + 1, c); T.line(x, y, (cx + cw / 2) / W, y - 1, { color: 'muted', width: W > 120 ? 0.6 : 1, alpha: 0.7 }); place(g + 1, c, cx); cx += cw; } }
            T.dot(x, y, { r: W > 150 ? 1.6 : W > 60 ? 2.6 : 4, color: g === 0 ? 'gold' : 'accent' }); drawn++;
          };
          T.setView([0, 1], [-(G + 0.6), 0.7]);
          place(0, 0, 0);
          const upto = sizes.slice(0, G + 1), mx = Math.max(2, ...upto, ...upto.map((_, n) => L.mean ** n)) * 1.15;
          Bz.setView([-0.5, G + 0.5], [0, mx]);
          Bz.bars(upto, { x0: 0, color: 'accent' });
          Bz.path(upto.map((_, n) => [n, L.mean ** n]), { color: 'orange', width: 2, dash: [5, 4] });
          st = { sizes: upto, mean: L.mean, vr: L.var, extinct: upto.findIndex((z, i) => i > 0 && z === 0), cut, G };
        });
        v.legend([['accent', 'individuals'], ['gold', 'ancestor'], ['orange', '$\\mu^n$', { dash: [5, 4] }]]);
        v.readout(() => st && `Offspring mean $\\mu=${fr(st.mean, 2)}$, variance $${fr(st.vr, 2)}$. Generation sizes $Z_0,\\dots,Z_{${st.sizes.length - 1}}$: ${st.sizes.join(', ')}.${st.extinct > 0 ? `\nThe line has died out by generation ${st.extinct}.` : ''}${st.cut && st.G === st.sizes.length - 1 && st.sizes.length < 9 ? '\nThe simulation stops here: this generation pushed the total past 700 individuals.' : ''}`);
      },
    },
  ],
};
