// Probability: Theory and Examples (Durrett) — Chapter 4, part Z2: backwards martingales, exchangeability, stopping and UI (§4.7, 4.8.1-4.8.2)
import { clampN, cornerIn, PHI, PhiN, DFUN, dfunOpts, dyadicTable, dyadAt, DL, tailExp, srw, ruinDP, sampleBeta, betaMoment, betaPdf, polyaDraws, polyaSeqProb, logChoose, fr } from './ch04-z.shared.js';

const FLOOR = 1e-9;
const lg = (y) => Math.max(FLOOR, y);
const EXAMPLE_COLS = ['accent', 'orange', 'purple', 'teal', 'pink', 'blue', 'gold', 'green'];
/** Standard samplers for the data of the backward-martingale pictures. */
function drawFrom(kind, r) { return kind === 'norm' ? r.normal() : kind === 'coin' ? (r() < 0.5 ? -1 : 1) : -Math.log(1 - r()) - 1; }
const KIND_OPTS = [{ value: 'norm', label: 'normal' }, { value: 'coin', label: 'coin $\\pm1$' }, { value: 'exp', label: 'exponential $-1$' }];

export default {
  collection: 'prob',
  chapter: 4,
  items: [
    // ============================================================ 4.7 backwards martingales, exchangeability
    {
      num: '4.7.1a',
      kind: 'Definition',
      name: 'Backwards martingale',
      statement: String.raw`A **backwards (reverse) martingale** is a sequence $X_{-n}$, $n\ge0$, adapted to a *decreasing* sequence of $\sigma$-fields $\mathcal F_{-n}\supset\mathcal F_{-n-1}$ (time runs towards $-\infty$ as $n$ grows), with $E|X_0|<\infty$ and
$$E(X_{-n}\mid\mathcal F_{-n-1})=X_{-n-1}\qquad(n\ge0).$$
Equivalently: reading the index from $-\infty$ up to $0$ it is an ordinary martingale; and every $X_{-n}=E(X_0\mid\mathcal F_{-n})$.`,
      idea: String.raw`Example: i.i.d. $\xi_i$ with $E|\xi_1|<\infty$, $S_n=\xi_1+\dots+\xi_n$, $\mathcal F_{-n}=\sigma(S_n,\xi_{n+1},\xi_{n+2},\dots)$ and $X_{-n}=S_n/n$. Given $S_{n+1}$ the $n+1$ summands are exchangeable, so each has conditional mean $S_{n+1}/(n+1)$; hence $E(S_n/n\mid\mathcal F_{-n-1})=S_{n+1}/(n+1)$. The $\sigma$-fields shrink as the sample grows, because the sum forgets which individual terms made it. This is the setting of Lévy's downward theorem and the strong law.`,
      caption: String.raw`Left: running means $S_n/n$ of five seeded samples, drawn against *time* $-n$ (so time flows left to right: the sample size shrinks as we go forward and the martingale ends at $X_{-1}=\xi_1$). Right: for the chosen $n$, a scatter of $(X_{-n-1},X_{-n})=(S_{n+1}/(n+1),\,S_n/n)$ over 1500 samples, with the average of $X_{-n}$ in each of 14 bins of $X_{-n-1}$ (orange): the bin averages fall on the diagonal, which is the defining identity $E(X_{-n}|X_{-n-1})=X_{-n-1}$. Change the law of $\xi$ and the identity persists.`,
      deps: ['prob-4.2.1a'],
      tags: ['martingales'],
      verify: true,
      scope: String.raw`Durrett's convention indexes by $n\le0$ with $X_{-n}$ adapted to $\mathcal F_{-n}$; some texts instead write $Y_n=X_{-n}$ and call it a reverse martingale with respect to a decreasing filtration. Only the direction of time differs.`,
      viz(v) {
        const kind = v.select('law of $\\xi$', KIND_OPTS, 'norm');
        const nS = v.slider('$n$', 2, 40, 8, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 60;
        const L = v.stage({ x: [-NMAX, -1], y: [-1.6, 1.6], height: 320, weight: 1.15, axes: 'box', gutter: true, xlabel: 'time $-n$', title: '$X_{-n}=S_n/n$, time runs to the right' });
        const R = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 320, axes: 'box', gutter: true, xlabel: '$X_{-n-1}$', ylabel: '$X_{-n}$', title: 'conditional means on the diagonal' });
        let st = null;
        v.render(() => {
          const k = kind.value, n = nS.value, r = v.rng(seed * 131 + 7);
          const lim = k === 'exp' ? [-1.2, 3] : [-1.6, 1.6];
          L.setView([-NMAX, -1], lim);
          L.hline(0, { color: 'faint' });
          for (let j = 0; j < 5; j++) { let s = 0; const pts = []; for (let i = 1; i <= NMAX; i++) { s += drawFrom(k, r); pts.push([-i, s / i]); } L.path(pts, { color: EXAMPLE_COLS[j], width: 1.8 }); }
          L.vline(-n, { color: 'gold', dash: true }); L.vline(-n - 1, { color: 'gold', dash: true, alpha: 0.5 });
          const P = [], r2 = v.rng(seed * 977 + 3);
          for (let j = 0; j < 1500; j++) { let s = 0; for (let i = 0; i < n; i++) s += drawFrom(k, r2); const s1 = s + drawFrom(k, r2); P.push([s1 / (n + 1), s / n]); }
          const xs = P.map((p) => p[0]).sort((a, b) => a - b), lo = xs[Math.floor(0.02 * xs.length)], hi = xs[Math.floor(0.98 * xs.length)];
          R.setView([lo - 0.2, hi + 0.2], [lo - 0.2, hi + 0.2]);
          P.forEach(([a, b]) => R.dot(a, b, { r: 1.6, color: 'accent', alpha: 0.35 }));
          R.line(lo - 1, lo - 1, hi + 1, hi + 1, { color: 'ink', width: 1.2, dash: true });
          const B = 14, bins = Array.from({ length: B }, () => ({ sx: 0, sy: 0, c: 0 }));
          P.forEach(([a, b]) => { const q = Math.floor(clampN((a - lo) / (hi - lo), 0, 0.999999) * B); bins[q].sx += a; bins[q].sy += b; bins[q].c++; });
          let dev = 0, cnt = 0;
          bins.forEach((b) => { if (b.c >= 15) { R.dot(b.sx / b.c, b.sy / b.c, { r: 5, color: 'orange' }); dev = Math.max(dev, Math.abs(b.sx / b.c - b.sy / b.c)); cnt++; } });
          st = { n, dev, cnt };
        });
        v.legend([['accent', 'sample pairs'], ['orange', 'bin averages of $X_{-n}$'], ['ink', 'diagonal', { dash: true }]]);
        v.readout(() => st && `$n=${st.n}$: the largest gap between a bin average of $X_{-n}$ and the bin average of $X_{-n-1}$ is $${v.fix(st.dev, 3)}$ (sampling noise only), over ${st.cnt} well-populated bins.`);
      },
    },
    {
      num: '4.7.1',
      kind: 'Theorem',
      name: 'Backwards martingales converge a.s. and in L¹',
      statement: String.raw`Let $X_{-n}$ be a backwards martingale. Then $X_{-n}\to X_{-\infty}$ almost surely and in $L^1$ as $n\to\infty$.`,
      idea: String.raw`Apply the upcrossing inequality (4.2.10) to the finite stretch $X_{-N},\dots,X_0$, which is an ordinary martingale: the expected number of upcrossings of $[a,b]$ is at most $E(X_0-a)^+/(b-a)$, a bound that does not depend on $N$. Let $N\to\infty$: the number of upcrossings of the whole backward sequence is a.s. finite for every rational $a<b$, so the limit exists a.s. No $L^1$-boundedness hypothesis is needed because $X_{-n}=E(X_0|\mathcal F_{-n})$ is automatically uniformly integrable (4.6.1), and Vitali (4.6.3) upgrades a.s. convergence to $L^1$.`,
      caption: String.raw`Running means of i.i.d. data, read in backward-martingale time (from sample size $N$ down to $1$). Drag the band $[a,b]$ (orange handles). Top: the sample (of 150) with the most upcrossings in the window shown; a green dot marks each completed upcrossing of the band in time order (large $n$ first). Bottom: the average number of upcrossings over 150 samples as the horizon $N$ grows (log scale): it levels off at a finite value, below the bound $E(X_{-1}-a)^+/(b-a)$ (red), which does not depend on $N$. Contrast the forward case, where upcrossings of a martingale can pile up without a uniform bound.`,
      deps: ['prob-4.2.10', 'prob-4.6.1', 'prob-4.6.3', 'prob-4.7.1a'],
      tags: ['martingales', 'convergence'],
      viz(v) {
        const kind = v.select('law of $\\xi$', KIND_OPTS.slice(0, 2), 'norm');
        const nS = v.slider('horizon $N$', 20, 1000, 300, { int: true, log: true });
        const NMAX = 1000, NS = 150;
        const L = v.stage({ x: [-100, -1], y: [-0.8, 0.8], height: 300, weight: 1.15, axes: 'box', gutter: true, xlabel: 'time $-n$', title: 'one sample (last 100 steps), with the band' });
        const R = v.stage({ x: [10, 1000], xlog: true, y: [0, 2], height: 300, axes: 'box', gutter: true, xlabel: 'horizon $N$', title: 'mean number of upcrossings' });
        const ha = L.handle(-96, -0.1, { color: 'orange', label: 'a', constrain: 'y' }), hb = L.handle(-96, 0.1, { color: 'orange', label: 'b', constrain: 'y' });
        let data = null, st = null;
        const upc = (arr, off, N, a, b) => { let state = 0, c = 0; for (let n = N; n >= 1; n--) { const x = arr[off + n - 1]; if (state === 0) { if (x <= a) state = 1; } else if (x >= b) { c++; state = 0; } } return c; };
        v.render(() => {
          const k = kind.value;
          if (!data || data.k !== k) {
            const r = v.rng(4242), arr = new Float32Array(NS * NMAX);
            for (let j = 0; j < NS; j++) { let s = 0; for (let n = 1; n <= NMAX; n++) { s += drawFrom(k, r); arr[j * NMAX + n - 1] = s / n; } }
            data = { k, arr };
          }
          const a = Math.min(ha.y, hb.y), b = Math.max(ha.y, hb.y), N = nS.value;
          const W = Math.min(N, 100); ha.set(-W * 0.96, ha.y); hb.set(-W * 0.96, hb.y);
          L.setView([-W, -1], k === 'coin' ? [-1.1, 1.1] : [-0.8, 0.8]);
          L.hband(a, b, { color: 'orange', alpha: 0.15 });
          let best = 0, bestC = -1; for (let j = 0; j < NS; j++) { const c = upc(data.arr, j * NMAX, W, a, b); if (c > bestC) { bestC = c; best = j; } }
          const pts = [], ups = []; let state = 0;
          for (let n = W; n >= 1; n--) { const x = data.arr[best * NMAX + n - 1]; pts.push([-n, x]); if (state === 0) { if (x <= a) state = 1; } else if (x >= b) { ups.push([-n, x]); state = 0; } }
          L.path(pts, { color: 'accent', width: 1.6 }); ups.forEach((p) => L.dot(p[0], p[1], { color: 'green', r: 4.5 }));
          const Ns = [10, 14, 20, 30, 45, 70, 100, 150, 220, 330, 500, 750, 1000], avg = Ns.map((M) => { let s = 0; for (let j = 0; j < NS; j++) s += upc(data.arr, j * NMAX, M, a, b); return [M, s / NS]; });
          const Eplus = k === 'norm' ? PHI(a) - a * (1 - PhiN(v.M, a)) : 0.5 * Math.max(0, 1 - a) + 0.5 * Math.max(0, -1 - a);
          const bound = Eplus / (b - a);
          R.setView([10, 1000], [0, Math.max(0.5, bound * 1.2, ...avg.map((p) => p[1]) ) * 1.1]);
          R.hline(bound, { color: 'red', width: 2, dash: [6, 4] });
          R.path(avg, { color: 'accent', width: 2.4 }); avg.forEach((p) => R.dot(p[0], p[1], { color: 'accent', r: 3 }));
          R.vline(N, { color: 'gold', dash: true });
          st = { ups: ups.length, bound, last: avg[avg.length - 1][1], a, b };
        });
        v.legend([['accent', 'running mean'], ['green', 'upcrossing'], ['red', 'bound $E(X_{-1}-a)^+/(b-a)$', { dash: true }]]);
        v.readout(() => st && `Band $[${v.fix(st.a, 2)},${v.fix(st.b, 2)}]$: ${st.ups} upcrossings in the displayed sample; average at $N=1000$ is $${v.fix(st.last, 3)}$ versus the bound $${v.fix(st.bound, 3)}$.`);
      },
    },
    {
      num: '4.7.2',
      kind: 'Theorem',
      name: 'The backward limit is E(X₀ | F₋∞)',
      statement: String.raw`If $X_{-n}$ is a backwards martingale and $\mathcal F_{-\infty}=\bigcap_n\mathcal F_{-n}$, then $X_{-\infty}=\lim X_{-n}=E(X_0\mid\mathcal F_{-\infty})$ a.s. In particular, if $\mathcal F_{-\infty}$ is trivial the limit is the constant $EX_0$.`,
      idea: String.raw`$X_{-\infty}$ exists by 4.7.1 and is measurable with respect to every $\mathcal F_{-n}$ (it is a limit of $X_{-m}$, $m\ge n$), hence to $\mathcal F_{-\infty}$. For $A\in\mathcal F_{-\infty}\subset\mathcal F_{-n}$: $E(X_{-n};A)=E(X_0;A)$, and $L^1$ convergence (Lemma 4.6.5) gives $E(X_{-\infty};A)=E(X_0;A)$. This is the definition of $E(X_0|\mathcal F_{-\infty})$.`,
      caption: String.raw`The backward martingale is $S_n/n$ for an *exchangeable* 0–1 sequence; $\mathcal F_{-\infty}$ is the exchangeable $\sigma$-field. Pick the law: i.i.d. fair coin (exchangeable field trivial, limit constant $\frac12=EX_1$), or a coin whose bias $\theta$ is drawn first (uniform, or $0.2/0.8$ with equal chance). Left: twelve running means, coloured by their hidden $\theta$ (blue small, red large); they settle on $\theta$, not on $EX_1$. Right: limit proxy $S_{3000}/3000$ against $\theta$ for 300 sequences, on the diagonal: the limit is $E(X_1|\mathcal F_{-\infty})=\theta$.`,
      deps: ['prob-4.7.1', 'prob-4.6.5'],
      tags: ['martingales'],
      viz(v) {
        const mix = v.select('law', [{ value: 'fair', label: 'i.i.d. fair coin' }, { value: 'unif', label: '$\\theta\\sim U(0,1)$' }, { value: 'two', label: '$\\theta\\in\\{0.2,0.8\\}$' }], 'unif');
        let seed = 1; v.button('Resample', () => { seed++; });
        const NN = 3000;
        const L = v.stage({ x: [1, NN], xlog: true, y: [0, 1], height: 320, weight: 1.15, axes: 'box', gutter: true, xlabel: '$n$', title: 'running means $S_n/n=X_{-n}$' });
        const R = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 320, axes: 'box', gutter: true, xlabel: '$\\theta=E(X_1|\\mathcal F_{-\\infty})$', ylabel: 'limit proxy $S_{3000}/3000$', title: 'the limit equals the conditional mean' });
        let st = null;
        v.render(() => {
          const r = v.rng(seed * 59 + 3), m = mix.value;
          const th = () => (m === 'fair' ? 0.5 : m === 'unif' ? r() : r() < 0.5 ? 0.2 : 0.8);
          for (let j = 0; j < 12; j++) {
            const t = th(), pts = []; let s = 0, next = 1;
            for (let i = 1; i <= NN; i++) { s += r() < t ? 1 : 0; if (i >= next) { pts.push([i, s / i]); next = Math.max(next + 1, Math.ceil(next * 1.06)); } }
            L.path(pts, { color: v.mix('blue', 'red', t), width: 1.8 });
          }
          L.hline(0.5, { color: 'muted', dash: true, width: 1 });
          R.line(0, 0, 1, 1, { color: 'ink', dash: true, width: 1.2 });
          let err = 0, mean = 0, vr = 0;
          const r2 = v.rng(seed * 7 + 1), K = 300, lim = [];
          for (let j = 0; j < K; j++) { const t = th2(m, r2); let s = 0; for (let i = 0; i < NN; i++) s += r2() < t ? 1 : 0; const x = s / NN; R.dot(t, x, { r: 2.4, color: 'accent', alpha: 0.6 }); err += Math.abs(x - t); mean += x; lim.push(x); }
          mean /= K; for (const x of lim) vr += (x - mean) ** 2; vr /= K;
          st = { err: err / K, mean, vr };
        });
        v.legend([['blue', 'path with small $\\theta$'], ['red', 'path with large $\\theta$'], ['muted', '$EX_1=\\frac12$', { dash: true }]]);
        v.readout(() => st && `Mean of $\\lim X_{-n}$: $${v.fix(st.mean, 3)}=EX_1$; spread of the limit (variance) $${v.fix(st.vr, 3)}$ ($0$ exactly when $\\mathcal F_{-\\infty}$ is trivial); average distance from $\\theta$: $${v.fix(st.err, 4)}$.`);
        function th2(m, r2) { return m === 'fair' ? 0.5 : m === 'unif' ? r2() : r2() < 0.5 ? 0.2 : 0.8; }
      },
    },
    {
      num: '4.7.3',
      kind: 'Theorem',
      name: 'Lévy’s downward theorem',
      statement: String.raw`If $\mathcal F_n\downarrow\mathcal F_{\infty}=\bigcap_n\mathcal F_n$ as $n\to\infty$ and $E|Y|<\infty$, then
$$E(Y\mid\mathcal F_n)\longrightarrow E(Y\mid\mathcal F_\infty)\qquad\text{almost surely and in }L^1 .$$`,
      idea: String.raw`$X_{-n}=E(Y\mid\mathcal F_n)$ is a backwards martingale, so it converges a.s. and in $L^1$ (4.7.1) to $E(Y\mid\mathcal F_\infty)$ (4.7.2). The proof is the mirror image of the upward theorem, with upcrossings of a backward sequence replacing those of a forward one, and it needs no extra hypothesis because $L^1$ boundedness is automatic.`,
      caption: String.raw`Take $\xi_1,\xi_2,\dots$ and the coarsening fields $\mathcal F_n=\sigma(S_n,\xi_{n+1},\dots)$ (the symmetric functions of the first $n$ coordinates, plus the rest). For $Y=\varphi(\xi_1,\xi_2)$, $E(Y|\mathcal F_n)$ is the average of $\varphi$ over all ordered pairs among the first $n$ points (a U-statistic). Left: eight such paths against $n$ (log scale), converging; the dashed line is the limit. Right: $E|E(Y|\mathcal F_n)-E(Y|\mathcal F_\infty)|$ over 300 samples, on log axes. With a coin whose bias $\theta$ is drawn first the limit is random: it equals $E(\varphi|\theta)$ for each path.`,
      deps: ['prob-4.7.1', 'prob-4.7.2'],
      tags: ['martingales', 'conditional expectation'],
      viz(v) {
        const phi = v.select('$\\varphi(x,y)$', [{ value: 'var', label: '$(x-y)^2/2$' }, { value: 'prod', label: '$xy$' }], 'var');
        const mod = v.select('data', [{ value: 'norm', label: 'i.i.d. $N(1,1)$' }, { value: 'bern', label: 'Bernoulli($\\theta$), $\\theta\\sim U$' }], 'norm');
        let seed = 1; v.button('Resample', () => { seed++; });
        const NN = 1000;
        const L = v.stage({ x: [2, NN], xlog: true, y: [-0.2, 2.6], height: 320, weight: 1.15, axes: 'box', gutter: true, xlabel: '$n$', title: '$E(\\varphi(\\xi_1,\\xi_2)\\mid\\mathcal F_n)$' });
        const R = v.stage({ x: [2, NN], xlog: true, y: [1e-3, 3], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: '$L^1$ distance to the limit' });
        const trace = (r, kind, ph) => {
          const th = kind === 'bern' ? r() : 0; let S = 0, Q = 0; const pts = []; let next = 2;
          for (let i = 1; i <= NN; i++) {
            const x = kind === 'bern' ? (r() < th ? 1 : 0) : 1 + r.normal(); S += x; Q += x * x;
            if (i >= next) { pts.push([i, ph === 'var' ? (Q - (S * S) / i) / (i - 1) : (S * S - Q) / (i * (i - 1))]); next = Math.max(next + 1, Math.ceil(next * 1.08)); }
          }
          const lim = kind === 'bern' ? (ph === 'var' ? th * (1 - th) : th * th) : ph === 'var' ? 1 : 1;
          return { pts, lim };
        };
        let st = null;
        v.render(() => {
          const k = mod.value, ph = phi.value, r = v.rng(seed * 17 + 5);
          L.setView([2, NN], k === 'norm' ? [ph === 'var' ? -0.2 : -1, ph === 'var' ? 2.6 : 3] : [-0.1, 0.6]);
          for (let j = 0; j < 8; j++) { const t = trace(r, k, ph); L.path(t.pts, { color: EXAMPLE_COLS[j], width: 1.6 }); L.hline(t.lim, { color: EXAMPLE_COLS[j], width: 1, dash: [3, 4], alpha: 0.7 }); }
          const r2 = v.rng(seed * 31 + 11), acc = new Map(); let cnt = 0;
          for (let j = 0; j < 300; j++) { const t = trace(r2, k, ph); cnt++; t.pts.forEach(([n, y]) => { acc.set(n, (acc.get(n) || 0) + Math.abs(y - t.lim)); }); }
          const e = [...acc.entries()].map(([n, s]) => [n, lg(s / cnt)]);
          R.path(e, { color: 'blue', width: 2.6 });
          R.fn((n) => 1.6 / Math.sqrt(n), { color: 'muted', width: 1, dash: [4, 4] });
          st = { last: e[e.length - 1][1], n: e[e.length - 1][0] };
        });
        v.legend([['blue', '$E|\\cdot-\\text{limit}|$'], ['muted', 'slope $-\\tfrac12$ guide', { dash: true }]]);
        v.readout(() => st && `At $n=${st.n}$: $E|E(Y|\\mathcal F_n)-E(Y|\\mathcal F_\\infty)|\\approx${v.fix(st.last, 4)}$, consistent with $L^1$ convergence (roughly $n^{-1/2}$ here).`);
      },
    },
    {
      num: '4.7.7',
      kind: 'Lemma',
      name: 'U-statistic averages and the exchangeable σ-field',
      statement: String.raw`Let $X_1,X_2,\dots$ be exchangeable and $\varphi$ a bounded function of $k$ variables. The average of $\varphi$ over all $k$-tuples of distinct indices among the first $n$,
$$A_n(\varphi)=\frac1{(n)_k}\sum_{i_1,\dots,i_k\ \text{distinct}\le n}\varphi(X_{i_1},\dots,X_{i_k}),\qquad (n)_k=n(n-1)\cdots(n-k+1),$$
equals $E(\varphi(X_1,\dots,X_k)\mid\mathcal E_n)$, where $\mathcal E_n$ is the $\sigma$-field of events invariant under permutations of the first $n$ coordinates. Hence $A_n(\varphi)\to E(\varphi(X_1,\dots,X_k)\mid\mathcal E)$ a.s. and in $L^1$, and for $\varphi=\varphi_1\otimes\dots\otimes\varphi_k$ the limit factors: $\lim A_n(\varphi)=\prod_j\lim A_n(\varphi_j)$.`,
      idea: String.raw`$\mathcal E_n$ decreases to the exchangeable $\sigma$-field $\mathcal E$ (2.5.3a). Given $\mathcal E_n$, every ordered $k$-tuple of distinct indices $\le n$ is equally likely to carry the data, so the conditional expectation of $\varphi(X_1,\dots,X_k)$ is the average over those tuples. Lévy's downward theorem (4.7.3) gives the convergence. For the factorisation, expand the product of two averages: all but $O(1/n)$ of the index pairs are disjoint, so $A_n(\varphi_1)A_n(\varphi_2)-A_n(\varphi_1\otimes\varphi_2)\to0$ (the $\pi$–$\lambda$ theorem 2.1.6 is used to pass from products to the whole class).`,
      caption: String.raw`Pólya's urn (start with $a$ red, $b$ blue; draw, return with an extra ball of the drawn colour) gives an exchangeable 0–1 sequence $X_i=\mathbf 1(\text{red at draw }i)$. With $\varphi_k=x_1\cdots x_k$ the averages are $U^{(k)}_n=\binom{S_n}{k}/\binom nk$. Left: $U^{(1)},U^{(2)},U^{(3)}$ along one sequence. Right: at time $N$ (slider), the pairs $(U^{(1)}_N,U^{(2)}_N)$ (blue) and $(U^{(1)}_N,U^{(3)}_N)$ (orange) over 300 sequences, against the curves $t\mapsto t^2$, $t^3$: the limit factors. The limit $U^{(1)}$ itself is random (Beta$(a,b)$); with $a,b\to\infty$ proportionally it concentrates and one recovers the i.i.d. case.`,
      deps: ['prob-4.7.3', 'prob-2.1.6', 'prob-2.5.3a'],
      see: ['prob-4.3.4a'],
      tags: ['exchangeability'],
      viz(v) {
        const aS = v.slider('red $a$', 0.5, 6, 1, { step: 0.5 });
        const bS = v.slider('blue $b$', 0.5, 6, 1, { step: 0.5 });
        const nS = v.slider('time $N$', 10, 1500, 1500, { int: true, log: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NN = 1500, K = 300;
        const L = v.stage({ x: [3, NN], xlog: true, y: [0, 1], height: 320, weight: 1.1, axes: 'box', gutter: true, xlabel: '$n$', title: 'one urn: $U^{(k)}_n$' });
        const R = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 320, axes: 'box', gutter: true, xlabel: '$U^{(1)}_N$', ylabel: '$U^{(2)}_N,\\ U^{(3)}_N$', title: 'limits factor over 300 urns' });
        let pool = null, st = null;
        const U = (S, n, k) => { if (S < k) return 0; return Math.exp(logChoose(S, k) - logChoose(n, k)); };
        v.render(() => {
          const a = aS.value, b = bS.value, key = `${a}|${b}|${seed}`;
          if (!pool || pool.key !== key) {
            const r = v.rng(seed * 313 + 17), arr = new Int16Array(K * (NN + 1));
            for (let j = 0; j < K; j++) { const d = polyaDraws(r, a, b, NN); let s = 0; for (let i = 0; i < NN; i++) { s += d[i]; arr[j * (NN + 1) + i + 1] = s; } }
            pool = { key, arr };
          }
          const N = nS.value;
          [1, 2, 3].forEach((k, ci) => { const pts = []; for (let n = 3; n <= NN; n = Math.max(n + 1, Math.ceil(n * 1.05))) pts.push([n, U(pool.arr[n], n, k)]); L.path(pts, { color: ['accent', 'orange', 'red'][ci], width: 2 }); });
          L.vline(N, { color: 'gold', dash: true });
          R.fn((t) => t * t, { color: 'orange', width: 1.4, dash: [5, 4] }); R.fn((t) => t * t * t, { color: 'red', width: 1.4, dash: [5, 4] });
          let e2 = 0, e3 = 0;
          for (let j = 0; j < K; j++) { const S = pool.arr[j * (NN + 1) + N], u1 = U(S, N, 1), u2 = U(S, N, 2), u3 = U(S, N, 3); R.dot(u1, u2, { r: 2.6, color: 'accent', alpha: 0.7 }); R.dot(u1, u3, { r: 2.6, color: 'orange', alpha: 0.7 }); e2 += Math.abs(u2 - u1 * u1); e3 += Math.abs(u3 - u1 ** 3); }
          st = { e2: e2 / K, e3: e3 / K, N };
        });
        v.legend([['accent', '$U^{(1)}$ / pairs $(U^{(1)},U^{(2)})$'], ['orange', '$U^{(2)}$ / pairs $(U^{(1)},U^{(3)})$'], ['red', '$U^{(3)}$']]);
        v.readout(() => st && `At $N=${st.N}$: mean $|U^{(2)}-(U^{(1)})^2|=${v.fix(st.e2, 4)}$ and mean $|U^{(3)}-(U^{(1)})^3|=${v.fix(st.e3, 4)}$, both $O(1/N)$: the limit factorises.`);
      },
    },
    {
      num: '4.7.9',
      kind: 'Theorem',
      name: 'de Finetti’s theorem',
      statement: String.raw`Let $X_1,X_2,\dots$ be an exchangeable sequence of random variables with values in a nice space (for instance $\R$). Then, conditionally on the exchangeable $\sigma$-field $\mathcal E$, the $X_i$ are i.i.d.: there is a random probability measure $\mu$ ($\mathcal E$-measurable) such that
$$P(X_1\in A_1,\dots,X_k\in A_k\mid\mathcal E)=\prod_{j=1}^k\mu(A_j)\quad\text{a.s.}$$
In words, every infinite exchangeable sequence is a mixture of i.i.d. sequences.`,
      idea: String.raw`By the U-statistic lemma (4.7.7), $A_n(\varphi)\to E(\varphi(X_1,..,X_k)|\mathcal E)$ and the limit factors over coordinates. Taking $\varphi_j=\mathbf 1_{A_j}$ identifies $\mu(A)=\lim\frac1n\sum_i\mathbf 1(X_i\in A)$, the limiting empirical measure, which is $\mathcal E$-measurable, and shows that the conditional law of $(X_1,\dots,X_k)$ is the product. The measurability of $\mu$ and the extension from half-lines to all Borel sets use the $\pi$–$\lambda$ theorem and, on $\R$, a countable generating class.`,
      caption: String.raw`The Pólya urn is the standard exchangeable sequence that is *not* i.i.d. Left: the exact probability of each of the 16 colour patterns of the first four draws, computed from the urn rule; patterns with the same number of reds (bars of one colour) have exactly equal probability, which is exchangeability. Right: the histogram of the limiting red fraction $\theta$ (from 3000 simulated urns of 600 draws) against its Beta$(a,b)$ law. Drag the gold window along $\theta$: among urns with $\theta$ in the window, the first two draws behave like i.i.d. Bernoulli($\theta$), as the readout compares ($P(RR)$ vs $\theta^2$, $P(RB)$ vs $\theta(1-\theta)$), while over all urns they are positively correlated.`,
      credit: 'B. de Finetti (0-1 sequences, around 1930); Hewitt & Savage, 1955 (general case)',
      verify: true,
      deps: ['prob-4.7.7', 'prob-4.7.3', 'prob-2.5.3a'],
      see: ['stat-10.12', 'prob-4.3.4a'],
      tags: ['exchangeability'],
      viz(v) {
        const aS = v.slider('red $a$', 0.5, 6, 2, { step: 0.5 });
        const bS = v.slider('blue $b$', 0.5, 6, 1, { step: 0.5 });
        const wS = v.slider('window half-width', 0.02, 0.2, 0.06, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [-0.5, 15.5], y: [0, 0.3], height: 320, axes: 'box', gutter: true, xlabel: 'pattern (sorted by number of reds)', title: 'exact $P(\\text{pattern})$, 4 draws' });
        const B = v.stage({ x: [0, 1], y: [0, 3], height: 320, axes: 'box', gutter: true, xlabel: '$\\theta$ (limiting red fraction)', title: 'limit fraction and window' });
        const h = B.handle(0.5, 0, { color: 'gold', label: '$\\theta_0$', constrain: 'x' });
        let pool = null, st = null;
        const NN = 600, K = 3000;
        v.render(() => {
          const a = aS.value, b = bS.value, key = `${a}|${b}|${seed}`;
          const pats = []; for (let m = 0; m < 16; m++) { let k = 0; for (let i = 0; i < 4; i++) k += (m >> i) & 1; pats.push({ m, k }); }
          pats.sort((x, y) => x.k - y.k || x.m - y.m);
          const ymax = Math.max(...pats.map((p) => polyaSeqProb(a, b, p.k, 4))) * 1.2;
          A.setView([-0.5, 15.5], [0, ymax]);
          const cols = ['blue', 'teal', 'green', 'orange', 'red'];
          pats.forEach((p, i) => { A.rect(i - 0.38, 0, i + 0.38, polyaSeqProb(a, b, p.k, 4), { fill: cols[p.k], fillAlpha: 0.55, color: cols[p.k] }); A.text(String(p.m.toString(2).padStart(4, '0')).replace(/1/g, 'R').replace(/0/g, 'B'), i, -ymax * 0.0, { size: 9, color: 'muted', baseline: 'top', dy: 4 }); });
          if (!pool || pool.key !== key) {
            const r = v.rng(seed * 8191 + 3), th = new Float32Array(K), x12 = new Uint8Array(K);
            for (let j = 0; j < K; j++) { const d = polyaDraws(r, a, b, NN); let s = 0; for (let i = 0; i < NN; i++) s += d[i]; th[j] = (a + s) / (a + b + NN); x12[j] = d[0] * 2 + d[1]; }
            pool = { key, th, x12 };
          }
          const E = Array.from({ length: 41 }, (_, i) => i / 40), cnt = new Float64Array(40);
          for (let j = 0; j < K; j++) cnt[Math.min(39, Math.floor(pool.th[j] * 40))]++;
          const dens = Array.from(cnt, (c) => c / (K / 40)), mx = Math.max(...dens, ...E.map((x) => betaPdf(a, b, clampN(x, 0.005, 0.995))).slice(1, 40));
          B.setView([0, 1], [0, Math.min(5, mx * 1.2)]);
          B.hist({ edges: E, counts: Array.from(cnt), density: dens }, { density: true, color: 'accent', fillAlpha: 0.3 });
          B.fn((x) => betaPdf(a, b, x), { color: 'red', width: 2.2, domain: [0.004, 0.996] });
          const t0 = clampN(h.x, 0.02, 0.98), w = wS.value; h.set(t0, 0);
          B.vband(t0 - w, t0 + w, { color: 'gold', alpha: 0.2 });
          let n = 0, rr = 0, rb = 0, bb = 0, sth = 0;
          for (let j = 0; j < K; j++) if (Math.abs(pool.th[j] - t0) < w) { n++; sth += pool.th[j]; const c = pool.x12[j]; if (c === 3) rr++; else if (c === 2 || c === 1) rb++; else bb++; }
          const tb = n ? sth / n : t0;
          st = { n, rr: n ? rr / n : NaN, rb: n ? rb / n : NaN, bb: n ? bb / n : NaN, tb };
        });
        v.legend([['accent', 'simulated $\\theta$', { area: true }], ['red', 'Beta$(a,b)$'], ['gold', 'window', { area: true }]]);
        v.readout(() => st && `${st.n} urns in the window, mean $\\theta=${v.fix(st.tb, 3)}$. First two draws: $P(RR)=${fr(st.rr, 3)}$ vs $\\theta^2=${v.fix(st.tb ** 2, 3)}$; $P(RB\\text{ or }BR)=${fr(st.rb, 3)}$ vs $2\\theta(1-\\theta)=${v.fix(2 * st.tb * (1 - st.tb), 3)}$; $P(BB)=${fr(st.bb, 3)}$ vs $(1-\\theta)^2=${v.fix((1 - st.tb) ** 2, 3)}$.`);
      },
    },
    {
      num: '4.7.10',
      kind: 'Theorem',
      name: 'Exchangeable 0-1 sequences are mixtures of coin tossing',
      statement: String.raw`If $X_1,X_2,\dots\in\{0,1\}$ are exchangeable, there is a probability measure $\nu$ on $[0,1]$ such that for all $k$ and $x\in\{0,1\}^k$ with $s=\sum x_i$,
$$P(X_1=x_1,\dots,X_k=x_k)=\int_0^1\theta^{s}(1-\theta)^{k-s}\,\nu(d\theta).$$
Here $\nu$ is the law of $\theta=\lim_n S_n/n$.`,
      idea: String.raw`This is de Finetti (4.7.9) for the two-point space: the conditional law of each $X_i$ given $\mathcal E$ is Bernoulli$(\theta)$ with $\theta=\lim S_n/n$ (the strong law applied conditionally, or 4.7.2). Integrating the conditional product formula over $\theta$ gives the displayed mixture; taking $x=(1,\dots,1)$ gives $P(X_1=\dots=X_k=1)=E\theta^k$, so $\nu$ is determined by its moments and hence by the law of the sequence.`,
      caption: String.raw`Choose the mixing law $\nu$ (the bias of the hidden coin). Left: histogram of the running frequency $S_n/n$ over 2500 simulated sequences, for the $n$ you choose, against the exact mixing law $\nu$ (red; atoms drawn as stems). As $n$ grows the histogram recovers $\nu$. Right: $P(X_1=\dots=X_k=1)$ for $k=1,\dots,8$, simulated (accent bars) against the exact moment $E\theta^k$ (dots): the finite-dimensional laws are the moments of $\nu$.`,
      credit: 'B. de Finetti, around 1930',
      verify: true,
      deps: ['prob-4.7.9'],
      tags: ['exchangeability'],
      viz(v) {
        const mix = v.select('mixing law $\\nu$', [{ value: 'unif', label: 'uniform' }, { value: 'arc', label: 'Beta$(\\frac12,\\frac12)$' }, { value: 'atoms', label: 'two atoms' }, { value: 'bump', label: 'two bumps' }], 'unif');
        const wS = v.slider('atom weight at $0.2$', 0.05, 0.95, 0.4, { step: 0.05 });
        const nS = v.slider('$n$', 5, 2000, 200, { int: true, log: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const K = 2500;
        const L = v.stage({ x: [0, 1], y: [0, 3], height: 320, axes: 'box', gutter: true, xlabel: '$S_n/n$', title: 'running frequency at time $n$' });
        const R = v.stage({ x: [0.5, 8.5], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: '$k$', title: '$P(X_1=\\dots=X_k=1)$' });
        let pool = null, st = null;
        const sampleTheta = (r, m, w) => (m === 'unif' ? r() : m === 'arc' ? sampleBeta(r, 0.5, 0.5) : m === 'atoms' ? (r() < w ? 0.2 : 0.8) : r() < 0.5 ? sampleBeta(r, 20, 60) : sampleBeta(r, 60, 20));
        const moment = (m, w, k) => (m === 'unif' ? 1 / (k + 1) : m === 'arc' ? betaMoment(0.5, 0.5, k) : m === 'atoms' ? w * 0.2 ** k + (1 - w) * 0.8 ** k : 0.5 * betaMoment(20, 60, k) + 0.5 * betaMoment(60, 20, k));
        const pdf = (m, x) => (m === 'unif' ? 1 : m === 'arc' ? betaPdf(0.5, 0.5, x) : m === 'bump' ? 0.5 * betaPdf(20, 60, x) + 0.5 * betaPdf(60, 20, x) : 0);
        v.render(() => {
          const m = mix.value, w = wS.value, n = nS.value; wS.el.hidden = m !== 'atoms';
          const key = `${m}|${w}|${n}|${seed}`;
          if (!pool || pool.key !== key) {
            const r = v.rng(seed * 4099 + 1), fr_ = new Float32Array(K), first = new Uint8Array(K);
            for (let j = 0; j < K; j++) { const t = sampleTheta(r, m, w); let s = 0, run = 0; for (let i = 0; i < n; i++) { const x = r() < t ? 1 : 0; s += x; if (i < 8 && run === i && x === 1) run = i + 1; } fr_[j] = s / n; first[j] = run; }
            pool = { key, fr_, first };
          }
          const E = Array.from({ length: 41 }, (_, i) => i / 40), cnt = new Float64Array(40);
          for (let j = 0; j < K; j++) cnt[Math.min(39, Math.floor(pool.fr_[j] * 40))]++;
          const dens = Array.from(cnt, (c) => c / (K / 40));
          const top = m === 'atoms' ? 1.2 : Math.min(8, Math.max(...dens) * 1.25);
          L.setView([0, 1], [0, m === 'atoms' ? Math.max(...dens) * 1.15 : Math.max(Math.max(...dens), m === 'arc' ? 1.5 : m === 'bump' ? 6 : 1) * 1.15]);
          L.hist({ edges: E, counts: Array.from(cnt), density: dens }, { density: true, color: 'accent', fillAlpha: 0.3 });
          if (m === 'atoms') { const sc = Math.max(...dens) / Math.max(w, 1 - w) * 0.9; [[0.2, w], [0.8, 1 - w]].forEach(([x, p]) => { L.line(x, 0, x, p * sc, { color: 'red', width: 3 }); L.dot(x, p * sc, { color: 'red', r: 5 }); }); }
          else L.fn((x) => pdf(m, clampN(x, 0.002, 0.998)), { color: 'red', width: 2.4, domain: [0.002, 0.998] });
          const sim = [], ex = [];
          for (let k = 1; k <= 8; k++) { let c = 0; for (let j = 0; j < K; j++) if (pool.first[j] >= k) c++; sim.push(c / K); ex.push(moment(m, w, k)); }
          R.bars(sim, { x0: 1, dx: 1, color: 'accent' }); ex.forEach((e, i) => R.dot(i + 1, e, { color: 'red', r: 5 }));
          const mean = (() => { let s = 0; for (let j = 0; j < K; j++) s += pool.fr_[j]; return s / K; })();
          st = { sim, ex, mean, n };
        });
        v.legend([['accent', 'simulation', { area: true }], ['red', 'exact $\\nu$ / moments $E\\theta^k$']]);
        v.readout(() => st && `$n=${st.n}$: mean frequency $${v.fix(st.mean, 3)}=E\\theta=${v.fix(st.ex[0], 3)}$. $P(X_1=X_2=1)$: simulated $${v.fix(st.sim[1], 3)}$, $E\\theta^2=${v.fix(st.ex[1], 3)}$; $P(X_1=\\dots=X_8=1)$: $${v.fix(st.sim[7], 4)}$ vs $E\\theta^8=${v.fix(st.ex[7], 4)}$.`);
      },
    },
    // ============================================================ 4.8 optional stopping
    {
      num: '4.8.1',
      kind: 'Theorem',
      name: 'Stopping preserves uniform integrability',
      statement: String.raw`If $X_n$ is a uniformly integrable submartingale (for example $X_n=E(Y|\mathcal F_n)$) and $N$ is any stopping time, then $\{X_{N\wedge n}\}_{n\ge0}$ is uniformly integrable.`,
      idea: String.raw`In the martingale case $X_{N\wedge n}=E(X_{N\wedge n}\mid\mathcal F_{N\wedge n})$ is the conditional expectation of $Y$ given the stopped $\sigma$-field $\mathcal F_{N\wedge n}$ (4.2.5, 4.4.1), so the family $\{X_{N\wedge n}\}$ sits under the single tail bound of 4.6.1. For submartingales one compares $X^+_{N\wedge n}$ with the martingale part and uses UI of the original family.`,
      caption: String.raw`Dyadic martingale $X_n=E(Y|\mathcal F_n)$ with $Y$ on $[0,1]$. Rule: stop the first time $|X_n|\ge c$ (slider; if never, stop at level 10). Log curves: the original family's tail $T(M)=\max_{n\le10}E(|X_n|;|X_n|>M)$ (black), the stopped family's tail $\max_{n\le10}E(|X_{N\wedge n}|;|X_{N\wedge n}|>M)$ (green), and the one bound from 4.6.1 that depends on $Y$ alone (red, dashed). The stopped curve sits below the same bound for every rule you choose: stopping cannot create a tail.`,
      deps: ['prob-4.2.5', 'prob-4.4.1', 'prob-4.6.1a', 'prob-4.6.1'],
      tags: ['optional stopping', 'uniform integrability'],
      viz(v) {
        const fS = v.select('$Y$', dfunOpts(['smooth', 'jump', 'rough', 'blow']), 'blow');
        const cS = v.slider('threshold $c$', 0.3, 8, 2.5, { step: 0.1 });
        const S = v.stage({ x: [0, 40], y: [1e-3, 6], ylog: true, height: 340, axes: 'box', gutter: true, xlabel: '$M$', title: 'tails of the original and the stopped family' });
        let st = null;
        v.render(() => {
          const tab = dyadicTable(fS.value), Y = tab[DL], G = 1 << DL, c = cS.value;
          const orig = new Array(11), stop = new Array(11);
          for (let n = 0; n <= 10; n++) { orig[n] = new Float64Array(G); stop[n] = new Float64Array(G); }
          let stopped = 0;
          for (let i = 0; i < G; i++) {
            const u = (i + 0.5) / G; let N = 10;
            for (let n = 0; n <= 10; n++) if (Math.abs(dyadAt(tab, n, u)) >= c) { N = n; break; }
            if (N < 10) stopped++;
            for (let n = 0; n <= 10; n++) { orig[n][i] = dyadAt(tab, n, u); stop[n][i] = dyadAt(tab, Math.min(N, n), u); }
          }
          let E1 = 0; for (let i = 0; i < G; i++) E1 += Math.abs(Y[i]); E1 /= G;
          const Ms = Array.from({ length: 81 }, (_, i) => 0.5 * i), po = [], ps = [], pb = [];
          for (const M of Ms) {
            let a = 0, b = 0; for (let n = 0; n <= 10; n++) { a = Math.max(a, tailExp(orig[n], M)); b = Math.max(b, tailExp(stop[n], M)); }
            po.push([M, lg(a)]); ps.push([M, lg(b)]);
            if (M > 0) { let best = Infinity; for (let K = 0; K <= 300; K++) best = Math.min(best, tailExp(Y, K) + (K * E1) / M); pb.push([M, best]); }
          }
          S.path(pb, { color: 'red', width: 2.2, dash: [6, 4] }); S.path(po, { color: 'ink', width: 2.2 }); S.path(ps, { color: 'green', width: 2.8 });
          let worst = 0; for (let j = 0; j < ps.length; j++) if (j > 0) worst = Math.max(worst, ps[j][1] - pb[j - 1][1]);
          st = { frac: stopped / G, worst };
        });
        v.legend([['ink', 'original family'], ['green', 'stopped family'], ['red', 'bound from $Y$ alone', { dash: true }]]);
        v.readout(() => st && `${v.fix(100 * st.frac, 1)}% of the points stop before level 10. The stopped tail never exceeds the bound (largest excess $${st.worst <= 1e-9 ? '0' : v.fix(st.worst, 4)}$).`);
      },
    },
    {
      num: '4.8.2',
      kind: 'Theorem',
      name: 'Optional stopping under E|X_N| < ∞ and a UI tail',
      statement: String.raw`Let $X_n$ be a submartingale and $N$ a stopping time with $P(N<\infty)=1$ (so $X_N$ is defined). If $E|X_N|<\infty$ and $E(|X_n|;N>n)\to0$, then $EX_0\le EX_N$; for a martingale, $EX_N=EX_0$.`,
      idea: String.raw`The stopped process $X_{N\wedge n}$ is a submartingale (4.2.9) so $EX_0\le EX_{N\wedge n}=E(X_N;N\le n)+E(X_n;N>n)$ (4.4.1 for the bounded time $N\wedge n$). As $n\to\infty$ the first term tends to $EX_N$ by dominated convergence ($E|X_N|<\infty$) and the second tends to $0$ by the tail hypothesis. The conditions are exactly what is missing for "hit $+1$": $X_N=1$ but $E(X_n;N>n)\to-1$.`,
      caption: String.raw`Simple random walk from $0$, exactly computed by dynamic programming over the killed walk. Rule A: stop on leaving $(-a,b)$. Rule B: stop on hitting $+b$ (no lower barrier; $N<\infty$ a.s. but $EN=\infty$). Right: $E X_{N\wedge n}$ (blue) is $0$ for every $n$; the hypothesis term $E(|X_n|;N>n)$ (red, even $n$) decays to $0$ for A and tends to $b$ for B, where $EX_N=b\ne0=EX_0$. Left: ten sample paths up to the stopping time (squares: stopped at $+b$ or at $-a$).`,
      deps: ['prob-4.6.4', 'prob-4.4.1', 'prob-4.2.9'],
      tags: ['optional stopping'],
      viz(v) {
        const rule = v.select('rule', [{ value: 'A', label: 'exit $(-a,b)$' }, { value: 'B', label: 'hit $+b$ only' }], 'A');
        const aS = v.slider('$a$', 1, 20, 6, { int: true });
        const bS = v.slider('$b$', 1, 20, 4, { int: true });
        let seed = 1; v.button('New paths', () => { seed++; });
        const T = 400;
        const L = v.stage({ x: [0, 120], y: [-20, 20], height: 320, weight: 1, axes: 'box', gutter: true, xlabel: '$n$', title: 'paths up to the stopping time' });
        const R = v.stage({ x: [0, T], y: [-0.2, 5], height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$n$', title: 'the quantities in the theorem' });
        let st = null;
        v.render(() => {
          const A = rule.value === 'A', a = A ? aS.value : T, b = bS.value, r = v.rng(seed * 773 + 9);
          L.setView([0, 120], [A ? -a - 1 : -b * 3 - 6, b + 2]);
          L.hline(b, { color: 'green', width: 1.5, dash: [5, 4] }); if (A) L.hline(-a, { color: 'red', width: 1.5, dash: [5, 4] });
          for (let j = 0; j < 10; j++) {
            let s = 0; const pts = [[0, 0]]; let hit = null;
            for (let n = 1; n <= 120; n++) { s += r() < 0.5 ? 1 : -1; pts.push([n, s]); if (s === b || (A && s === -a)) { hit = [n, s]; break; } }
            L.path(pts, { color: EXAMPLE_COLS[j % 8], width: 1.4, alpha: 0.9 }); if (hit) L.dot(hit[0], hit[1], { color: hit[1] > 0 ? 'green' : 'red', r: 4 });
          }
          const dp = ruinDP(-a, b, 0, 0.5, T), mean = [], tail = [], alive = [];
          dp.forEach(({ t, alive: al, cur }) => { let m = 0, ta = 0; for (let i = 0; i < cur.length; i++) { m += (i - a) * cur[i]; if (i > 0 && i < cur.length - 1) ta += Math.abs(i - a) * cur[i]; } mean.push([t, m]); if (t % 2 === 0) tail.push([t, ta]); alive.push([t, al]); });
          const EXN = A ? 0 : b;
          const ymax = Math.max(1.2, b * 1.15, ...tail.map((p) => p[1]));
          R.setView([0, T], [-0.3 * ymax * 0.2, ymax]);
          R.hline(EXN, { color: 'green', width: 1.8, dash: [6, 4] });
          R.path(alive, { color: 'muted', width: 1.4 });
          R.path(mean, { color: 'blue', width: 2.8 }); R.path(tail, { color: 'red', width: 2.6 });
          st = { A, a, b, tailEnd: tail[tail.length - 1][1], aliveEnd: alive[T][1], EXN };
        });
        v.legend([['blue', '$EX_{N\\wedge n}$'], ['red', '$E(|X_n|;N>n)$'], ['muted', '$P(N>n)$'], ['green', '$EX_N$', { dash: true }]]);
        v.readout(() => st && (st.A ? `Exit $(-${st.a},${st.b})$: $P(N>400)=${v.fix(st.aliveEnd, 4)}$, tail term $${v.fix(st.tailEnd, 4)}\\to0$, so $EX_N=EX_0=0$ (indeed $-a\\cdot\\frac{b}{a+b}+b\\cdot\\frac{a}{a+b}=0$).` : `Hit $+${st.b}$: $X_N=${st.b}$ a.s., $EX_N=${st.b}\\ne0$, and the tail term at $n=400$ is $${v.fix(st.tailEnd, 3)}$ and climbs slowly towards $${st.b}$, not to $0$: the hypothesis fails.`));
      },
    },
  ],
};
