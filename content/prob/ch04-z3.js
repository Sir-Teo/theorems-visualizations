import {inclusiveHistogram, exactChoose} from './ch04-exchangeability.shared.js';
// Probability: Theory and Examples (Durrett) — Chapter 4, part Z3: optional stopping and random-walk applications (§4.8.3-4.8.9, 4.9.1)
import { clampN, cornerIn, DFUN, dfunOpts, dyadicTable, dyadAt, DL, srw, ruinDP, logChoose, fr } from './ch04-z.shared.js';

const FLOOR = 1e-9;
const lg = (y) => Math.max(FLOOR, y);
const COLS = ['accent', 'orange', 'purple', 'teal', 'pink', 'blue', 'gold', 'green'];
/** Bars with 95% error whiskers: items [{label, val, se, color}] drawn at x = 1, 2, … */
function barsSE(S, items, v) {
  items.forEach((it, i) => {
    S.rect(i + 0.62, Math.min(0, it.val), i + 1.38, Math.max(0, it.val), { fill: it.color, fillAlpha: 0.35, color: it.color, width: 1.5 });
    if (it.se) { S.line(i + 1, it.val - 1.96 * it.se, i + 1, it.val + 1.96 * it.se, { color: 'ink', width: 2 }); S.line(i + 0.9, it.val + 1.96 * it.se, i + 1.1, it.val + 1.96 * it.se, { color: 'ink', width: 2 }); S.line(i + 0.9, it.val - 1.96 * it.se, i + 1.1, it.val - 1.96 * it.se, { color: 'ink', width: 2 }); }
    S.tex(it.label.replace(/\$/g, ''), i + 1, S.yr[0], { size: 14, dy: -16 });
  });
}

export default {
  collection: 'prob',
  chapter: 4,
  items: [
    {
      num: '4.8.3',
      kind: 'Theorem',
      name: 'Optional stopping theorem (uniformly integrable case)',
      statement: String.raw`Let $X_n$ be a uniformly integrable submartingale, with last element $X_\infty=\lim X_n$ (which exists, 4.6.4). For every stopping time $N$ (possibly infinite), with $X_N=X_\infty$ on $\{N=\infty\}$,
$$EX_0\ \le\ EX_N\ \le\ EX_\infty .$$
For a UI martingale all three are equal: $EX_0=EX_N=EX_\infty$.`,
      idea: String.raw`Stopping preserves uniform integrability (4.8.1), so $X_{N\wedge n}$ is a UI submartingale that converges to $X_N$ a.s. and in $L^1$ (4.6.4). Passing to the limit in $EX_0\le EX_{N\wedge n}\le EX_n$ (bounded stopping times, 4.4.1) gives the inequalities. Without UI nothing controls the limit: the simple walk stopped at its first visit to $+1$ has $EX_{N\wedge n}=0$ for every $n$ yet $X_N=1$.`,
      caption: String.raw`Choose a martingale and a stopping rule. Left: eight sample paths up to the stopping time. Right: Monte Carlo averages with 95% whiskers. Dyadic martingale $X_n=E(Y|\mathcal F_n)$ with bounded $Y$ (UI): $EX_0$, $EX_N$ and $EX_\infty$ agree for every rule (20 000 points, $N\le12$, else $N=\infty$ with $X_\infty=Y$). Switch to the simple walk with "stop at $+1$": $EX_0=0$ and $E X_{N\wedge2000}\approx0$, but $EX_N=1$ exactly (since $N<\infty$ a.s.): the identity visibly fails, because the stopped family is not UI.`,
      deps: ['prob-4.4.1', 'prob-4.8.1', 'prob-4.6.4'],
      see: ['stoch-12.3'],
      tags: ['optional stopping'],
      viz(v) {
        const mart = v.select('martingale', [{ value: 'dy', label: 'bounded $E(Y|\\mathcal F_n)$' }, { value: 'srw', label: 'simple walk, stop at $+1$' }], 'dy');
        const fS = v.select('$Y$', dfunOpts(['smooth', 'jump', 'rough']), 'smooth');
        const rule = v.select('rule', [{ value: 'hi', label: '$X_n\\ge c$' }, { value: 'jump', label: '$|X_n-X_{n-1}|\\ge c$' }, { value: 'fix', label: '$N=4$' }], 'hi');
        const cS = v.slider('$c$', 0.1, 2, 0.8, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 12], y: [-2, 2.5], height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: 'paths up to the stopping time' });
        const R = v.stage({ x: [0.3, 3.7], y: [-0.2, 1.2], height: 320, axes: 'box', gutter: true, title: 'means (95% whiskers)', xticks: [] });
        let st = null;
        v.render(() => {
          const isW = mart.value === 'srw'; fS.el.hidden = isW; rule.el.hidden = isW; cS.el.hidden = isW;
          const r = v.rng(seed * 911 + 5);
          if (!isW) {
            const tab = dyadicTable(fS.value), Y = tab[DL], c = cS.value, G = 20000;
            const stopAt = (u) => { let prev = dyadAt(tab, 0, u); for (let n = 0; n <= DL; n++) { const x = dyadAt(tab, n, u); if (rule.value === 'hi' && x >= c) return n; if (rule.value === 'jump' && n > 0 && Math.abs(x - prev) >= c) return n; if (rule.value === 'fix' && n === 4) return 4; prev = x; } return Infinity; };
            L.setView([0, 12], [-2, 2.6]);
            for (let j = 0; j < 8; j++) { const u = r(), N = stopAt(u), end = isFinite(N) ? N : 12, pts = []; for (let n = 0; n <= end; n++) pts.push([n, dyadAt(tab, n, u)]); L.path(pts, { color: COLS[j], width: 1.5 }); if (isFinite(N)) L.dot(N, dyadAt(tab, N, u), { color: COLS[j], r: 4.5 }); else L.dot(12, dyadAt(tab, 12, u), { color: 'green', r: 3 }); }
            let s = 0, s2 = 0, nInf = 0, r2 = v.rng(seed * 17 + 1);
            for (let i = 0; i < G; i++) { const u = r2(), N = stopAt(u), x = isFinite(N) ? dyadAt(tab, N, u) : dyadAt(tab, 12, u); if (!isFinite(N)) nInf++; s += x; s2 += x * x; }
            const m = s / G, se = Math.sqrt(Math.max(0, s2 / G - m * m) / G); let EY = 0; for (let i = 0; i < Y.length; i++) EY += Y[i]; EY /= Y.length;
            const lo = Math.min(EY, m) - 0.08, hi = Math.max(EY, m) + 0.08;
            R.setView([0.3, 3.7], [lo, hi]);
            R.hline(EY, { color: 'green', width: 1, dash: [4, 4] });
            R.rect(0.62, lo, 1.38, EY, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1.5 }); R.rect(2.62, lo, 3.38, EY, { fill: 'green', fillAlpha: 0.35, color: 'green', width: 1.5 });
            R.rect(1.62, lo, 2.38, m, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1.5 }); R.line(2, m - 1.96 * se, 2, m + 1.96 * se, { color: 'ink', width: 2 });
            ['$EX_0$', '$EX_N$', '$EX_\\infty$'].forEach((t, i) => R.tex(t.slice(1, -1), i + 1, lo, { size: 14, dy: -14 }));
            st = { dy: true, EY, m, se, pInf: nInf / G };
          } else {
            const T = 2000, K = 20000; let s = 0, s2 = 0, hit = 0;
            L.setView([0, 120], [-40, 3]);
            for (let j = 0; j < K; j++) { let x = 0, n = 0; const pts = j < 8 ? [[0, 0]] : null; while (x < 1 && n < T) { x += r() < 0.5 ? 1 : -1; n++; if (pts && n <= 120) pts.push([n, x]); } if (x >= 1) hit++; s += x; s2 += x * x; if (pts) { L.path(pts, { color: COLS[j], width: 1.3 }); if (x >= 1 && n <= 120) L.dot(n, 1, { color: COLS[j], r: 4 }); } }
            L.hline(1, { color: 'green', dash: [5, 4] });
            const m = s / K, se = Math.sqrt(Math.max(0, s2 / K - m * m) / K);
            R.setView([0.3, 3.7], [-0.4, 1.4]);
            barsSE(R, [{ label: '$EX_0$', val: 0, se: 0, color: 'accent' }, { label: '$EX_{N\\wedge 2000}$', val: m, se, color: 'orange' }, { label: '$EX_N$', val: 1, se: 0, color: 'red' }], v);
            st = { dy: false, m, se, pHit: hit / K };
          }
        });
        v.legend([['accent', '$EX_0$'], ['orange', '$EX_N$ (or $EX_{N\\wedge n}$)'], ['green', '$EX_\\infty$']]);
        v.readout(() => st && (st.dy ? `$EX_0=EX_\\infty=${v.fix(st.EY, 4)}$; $EX_N\\approx${v.fix(st.m, 4)}\\pm${v.fix(1.96 * st.se, 4)}$; ${v.fix(100 * st.pInf, 1)}% of points never stop. All three agree.` : `$EX_0=0$, Monte Carlo $EX_{N\\wedge2000}=${v.fix(st.m, 3)}\\pm${v.fix(1.96 * st.se, 3)}$, but $EX_N=1$ ($P(N\\le2000)\\approx${v.fix(st.pHit, 3)}$ in the sample, $N<\\infty$ a.s.). Not UI: the identity fails.`));
      },
    },
    {
      num: '4.8.4',
      kind: 'Theorem',
      name: 'Optional stopping for nonnegative supermartingales',
      statement: String.raw`If $X_n\ge0$ is a supermartingale and $N$ is any stopping time (possibly infinite), then, with $X_N=X_\infty=\lim X_n$ on $\{N=\infty\}$,
$$EX_N\ \le\ EX_0 .$$`,
      idea: String.raw`A nonnegative supermartingale converges a.s. (4.2.12), so $X_N$ is defined. For each $n$, $EX_{N\wedge n}\le EX_0$ since $N\wedge n$ is a bounded stopping time (4.4.1). Fatou's lemma (1.6.5) gives $EX_N=E\lim_nX_{N\wedge n}\le\liminf_nEX_{N\wedge n}\le EX_0$. The inequality can be strict, and no integrability is needed because positivity supplies the one-sided bound.`,
      caption: String.raw`Product process $X_n=\prod_{i\le n}\xi_i$ with $\xi=2$ w.p. $q$, else $0$: a nonnegative supermartingale when $q\le\frac12$ (a martingale at $q=\frac12$). Rule: stop at a fixed time $n_0$, at the first $X_n\ge2^m$, or never ($N=\infty$, $X_N=X_\infty=0$). Left (log scale; $0$ at the floor): one path for each lifetime $k=0,\dots,7$ (the path with lifetime $k$ has probability $q^k(1-q)$), stopped by the rule (dot). Right: $EX_{N\wedge n}=(2q)^{\min(n,m)}$ (blue, exact; gold dots = simulation of 60 000 runs) against $EX_0=1$; the limit $EX_N$ (green) is always $\le1$, and for $N=\infty$ it is $0<1$ even for the *martingale* $q=\frac12$: Fatou strict.`,
      deps: ['prob-4.2.12', 'prob-4.4.1', 'prob-1.6.5'],
      tags: ['optional stopping'],
      viz(v) {
        const qS = v.slider('$q$', 0.3, 0.5, 0.42, { step: 0.01 });
        const rule = v.select('rule', [{ value: 'fix', label: '$N=n_0$' }, { value: 'hit', label: 'first $X_n\\ge2^m$' }, { value: 'inf', label: '$N=\\infty$' }], 'hit');
        const mS = v.slider('$n_0$ or $m$', 1, 10, 5, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 14], y: [0.5, 2000], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: 'paths of $X_n$', yticks: [[0.5, '0'], [1, '1'], [10, '10'], [100, '100'], [1000, '1k']] });
        const R = v.stage({ x: [0, 14], y: [0, 1.15], height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: '$EX_{N\\wedge n}$' });
        let st = null;
        v.render(() => {
          const q = qS.value, m = rule.value === 'inf' ? Infinity : mS.value; mS.el.hidden = rule.value === 'inf';
                    for (let j = 0; j < 8; j++) {
            const K = j, pts = [];
            for (let n = 0; n <= 14; n++) { const alive = n <= K, val = alive ? 2 ** n : 0.5; pts.push([n, val]); if (isFinite(m) && n === m) { L.dot(n, val, { color: COLS[j], r: 4.5 }); break; } }
            L.path(pts, { color: COLS[j], width: 1.6 });
          }
          if (rule.value === 'hit') L.hline(2 ** m, { color: 'muted', dash: [4, 4] });
          const ex = [], sim = [], K2 = 60000, accs = new Float64Array(15), r2 = v.rng(seed * 5 + 9);
          for (let i = 0; i < K2; i++) { let k = 0; while (r2() < q && k < 40) k++; for (let n = 0; n <= 14; n++) { const nn = Math.min(n, m); accs[n] += nn <= k ? 2 ** nn : 0; } }
          for (let n = 0; n <= 14; n++) { ex.push([n, (2 * q) ** Math.min(n, m)]); sim.push([n, accs[n] / K2]); }
          R.hline(1, { color: 'ink', width: 1, dash: [4, 4] });
          const lim = isFinite(m) ? (2 * q) ** m : 0;
          R.hline(lim, { color: 'green', width: 2, dash: [6, 3] });
          R.path(ex, { color: 'blue', width: 2.6 }); sim.forEach((p) => R.dot(p[0], Math.min(1.12, p[1]), { color: 'gold', r: 3 }));
          st = { q, m, lim };
        });
        v.legend([['blue', '$EX_{N\\wedge n}$ exact'], ['gold', 'simulation'], ['green', '$EX_N$', { dash: true }], ['ink', '$EX_0=1$', { dash: true }]]);
        v.readout(() => st && `$q=${v.fix(st.q, 2)}$ ($E\\xi=${v.fix(2 * st.q, 2)}$): $EX_N=${v.fix(st.lim, 4)}\\le EX_0=1$` + (st.lim < 1 - 1e-9 ? ' with strict inequality.' : ' (equality: $q=\\frac12$ and a finite stopping rule).'));
      },
    },
    {
      num: '4.8.5',
      kind: 'Theorem',
      name: 'Optional stopping with bounded increments and EN < ∞',
      statement: String.raw`Let $X_n$ be a martingale (submartingale) with $|X_{n+1}-X_n|\le K$ a.s., and let $N$ be a stopping time for $\mathcal F_n=\sigma(\xi_1,\dots,\xi_n)$ with $EN<\infty$. Then $X_N$ is integrable and $EX_N=EX_0$ ($EX_N\ge EX_0$).`,
      idea: String.raw`Write $|X_{N\wedge n}-X_0|\le\sum_{k\le N}|X_k-X_{k-1}|\le KN$, which is integrable. So $X_{N\wedge n}$ is dominated by $|X_0|+KN$ and converges to $X_N$; dominated convergence (1.6.7) passes the identity $EX_{N\wedge n}=EX_0$ (4.4.1) to the limit. If $EN=\infty$, the dominating bound disappears and the identity can fail.`,
      caption: String.raw`Walk with mean-zero bounded steps (coin $\pm1$, or $-1$ w.p. $\frac23$ and $+2$ w.p. $\frac13$, which overshoots the upper barrier), stopped when leaving $(-a,b)$; tick "no lower barrier" to stop only at $\ge b$. Left (log–log): the tail $P(N>n)$ from 3000 runs; $EN$ is finite for a two-sided exit (exponential tail) and infinite without the lower barrier (tail $\sim n^{-1/2}$, straight line of slope $-\frac12$). Right: running average of $X_{N\wedge3000}$ over the runs (blue) approaching $EX_0=0$ and of $X_N$ over the runs that finished (orange): the two agree when $EN<\infty$; without the lower barrier the finished runs all have $X_N\ge b$ while the capped runs sit far below.`,
      deps: ['prob-4.4.1', 'prob-1.6.7'],
      tags: ['optional stopping'],
      viz(v) {
        const step = v.select('steps', [{ value: 'coin', label: '$\\pm1$' }, { value: 'skew', label: '$-1$ (2/3), $+2$ (1/3)' }], 'coin');
        const aS = v.slider('$a$', 1, 30, 8, { int: true });
        const bS = v.slider('$b$', 1, 12, 4, { int: true });
        const one = v.toggle('no lower barrier', false);
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [1, 3000], xlog: true, y: [1e-3, 1.5], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: '$P(N>n)$' });
        const R = v.stage({ x: [1, 3000], xlog: true, y: [-3, 5], height: 320, axes: 'box', gutter: true, xlabel: 'number of runs', title: 'running averages' });
        let st = null;
        v.render(() => {
          const a = one.value ? 1e9 : aS.value, b = bS.value, T = 3000, K = 3000, r = v.rng(seed * 631 + 1), sk = step.value === 'skew';
          const Ns = new Int32Array(K), Ss = new Float64Array(K), done = new Uint8Array(K);
          for (let j = 0; j < K; j++) { let x = 0, n = 0; while (x < b && x > -a && n < T) { x += sk ? (r() < 2 / 3 ? -1 : 2) : r() < 0.5 ? 1 : -1; n++; } Ns[j] = n; Ss[j] = x; done[j] = x >= b || x <= -a ? 1 : 0; }
          const cnt = new Float64Array(T + 2); for (let j = 0; j < K; j++) cnt[Ns[j]]++;
          let surv = K; const tail = []; const grid = new Set([1, 2, 3, 5, 8]); for (let n = 1; n <= T; n++) { surv -= cnt[n]; if (n <= 20 || n % Math.max(1, Math.floor(n / 25)) === 0) tail.push([n, lg(surv / K)]); }
          L.path(tail, { color: 'accent', width: 2.6 });
          L.fn((n) => 0.8 * Math.pow(n, -0.5), { color: 'muted', width: 1, dash: [4, 4] });
          let sumAll = 0, sumDone = 0, nDone = 0, sumN = 0; const pa = [], pd = [];
          for (let j = 0; j < K; j++) { sumAll += Ss[j]; sumN += Ns[j]; if (done[j]) { sumDone += Ss[j]; nDone++; } if (j + 1 >= 1 && (j < 20 || j % 30 === 0 || j === K - 1)) { pa.push([j + 1, sumAll / (j + 1)]); if (nDone) pd.push([j + 1, sumDone / nDone]); } }
          R.setView([1, 3000], one.value ? [-4, 5] : [-3, 5]);
          R.hline(0, { color: 'green', width: 1.8, dash: [6, 3] });
          R.path(pa, { color: 'blue', width: 2.2 }); R.path(pd, { color: 'orange', width: 2 });
          st = { EN: sumN / K, capped: 1 - nDone / K, one: one.value, a, b, finAvg: nDone ? sumDone / nDone : NaN, allAvg: sumAll / K, sk };
        });
        v.legend([['accent', '$P(N>n)$'], ['muted', 'slope $-\\tfrac12$', { dash: true }], ['blue', 'avg of $X_{N\\wedge3000}$'], ['orange', 'avg of $X_N$, finished runs'], ['green', '$EX_0$', { dash: true }]]);
        v.readout(() => st && `Sample $EN\\approx${v.fix(st.EN, 1)}$` + (!st.one && !st.sk ? ` (exact $ab=${st.a * st.b}$)` : '') + `; ${v.fix(100 * st.capped, 1)}% of runs hit the cap; average of $X_{N\\wedge3000}=${v.fix(st.allAvg, 3)}$, of $X_N$ over finished runs $${fr(st.finAvg, 3)}$` + (st.one ? '. With $EN=\\infty$ the finished runs alone give $\\ge b$: the identity cannot be read off from them.' : '. Finite $EN$: both near $0$.'));
      },
    },
    {
      num: '4.8.6',
      kind: 'Theorem',
      name: 'Wald’s equation via optional stopping',
      statement: String.raw`Let $\xi_1,\xi_2,\dots$ be i.i.d. with $E|\xi_1|<\infty$ and mean $\mu$, $S_n=\xi_1+\dots+\xi_n$, and let $N$ be a stopping time for $\mathcal F_n=\sigma(\xi_1,\dots,\xi_n)$ with $EN<\infty$. Then
$$E S_N=\mu\,EN .$$`,
      idea: String.raw`$M_n=S_n-n\mu$ is a martingale. Its increments are not bounded, but the argument of 4.8.5 only needs a dominating integrable variable: $|M_{N\wedge n}|\le\sum_{k\le N}|\xi_k-\mu|$, and since $\{N\ge k\}\in\mathcal F_{k-1}$ is independent of $\xi_k$, $E\sum_{k\le N}|\xi_k-\mu|=EN\cdot E|\xi_1-\mu|<\infty$. Dominated convergence (1.6.7) then gives $EM_N=EM_0=0$, i.e. $ES_N=\mu\,EN$.`,
      caption: String.raw`Stop the walk at the first $n$ with $S_n\ge L$, capped at $T=2000$ steps (so $N\wedge T$ is bounded and Wald's identity holds exactly for it). Step law: exponential ($\mu=1$), uniform on $(-1,3)$ ($\mu=1$) or normal with mean $\mu$ (slider). Left: histogram of $S_{N\wedge T}$, including every capped and completed run; completed runs overshoot $L$. Right: $ES_{N\wedge T}$ and $\mu\,E(N\wedge T)$ from 6000 seeded runs, with approximate 95% Monte Carlo whiskers. Both estimates use the same runs; the readout also reports their paired difference and its standard error. Slide the normal's $\mu$ to $0$ or below: $N$ is often capped (and $EN=\infty$ without the cap), yet the capped identity still holds.`,
      deps: ['prob-4.8.5'],
      see: ['prob-2.6.2', 'stoch-12.5'],
      tags: ['optional stopping', 'random walk'],
      refs: ['Durrett, Probability: Theory and Examples, version 5 (2019), Theorem 4.8.6 and §4.8.1, p. 257'],
      links: { source: 'https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      viz(v) {
        const law = v.select('steps', [{ value: 'exp', label: 'exponential(1)' }, { value: 'unif', label: 'uniform$(-1,3)$' }, { value: 'norm', label: 'normal$(\\mu,1)$' }], 'exp');
        const muS = v.slider('$\\mu$', -0.3, 1.5, 0.5, { step: 0.05 });
        const LS = v.slider('level $L$', 1, 30, 10, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [0, 40], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: '$S_{N\\wedge T}$', title: 'capped stopped value (all runs)' });
        const B = v.stage({ x: [0.3, 2.7], y: [0, 1], height: 320, axes: 'box', gutter: true, title: 'the two sides of Wald', xticks: [] });
        let st = null;
        v.render(() => {
          muS.el.hidden = law.value !== 'norm';
          const k = law.value, mu = k === 'norm' ? muS.value : 1, L = LS.value, T = 2000, K = 6000, r = v.rng(seed * 12007 + 5);
          const draw = k === 'exp' ? () => -Math.log(1 - r()) : k === 'unif' ? () => -1 + 4 * r() : () => mu + r.normal();
          let sS = 0, sS2 = 0, sN = 0, sN2 = 0, cap = 0, sD=0,sD2=0; const vals = [];
          for (let j = 0; j < K; j++) { let s = 0, n = 0; while (s < L && n < T) { s += draw(); n++; } if (s < L) cap++; sS += s; sS2 += s * s; sN += n; sN2 += n * n; const d=s-mu*n;sD+=d;sD2+=d*d;vals.push(s); }
          const mS = sS / K, seS = Math.sqrt(Math.max(0, sS2 / K - mS * mS) / K), mN = sN / K, seN = Math.sqrt(Math.max(0, sN2 / K - mN * mN) / K);
          const lo = Math.min(...vals), hi = Math.max(...vals), padding=Math.max(.01,(hi-lo)*.01), a0=Math.min(lo,L)-padding,b0=Math.max(hi,L)+padding;
          const histogram=inclusiveHistogram(vals,a0,b0,40);
          A.setView([a0,b0],[0,Math.max(...histogram.density)*1.15]);
          A.hist(histogram,{density:true,color:'accent',fillAlpha:.3});
          A.vline(L, { color: 'red', dash: [5, 4], width: 1.6 });
          const endpoints=[0,mS-1.96*seS,mS+1.96*seS,mu*mN-1.96*Math.abs(mu)*seN,mu*mN+1.96*Math.abs(mu)*seN], span=Math.max(...endpoints)-Math.min(...endpoints),top=Math.max(...endpoints)+.12*Math.max(1,span),bot=Math.min(...endpoints)-.12*Math.max(1,span);
          B.setView([0.3, 2.7], [bot, top]);
          barsSE(B, [{ label: '$ES_{N\\wedge T}$', val: mS, se: seS, color: 'accent' }, { label: '$\\mu\\,E(N\\wedge T)$', val: mu * mN, se: Math.abs(mu) * seN, color: 'orange' }], v);
          st = { mS, seS, rhs: mu * mN, seR: Math.abs(mu) * seN, mN, cap: cap / K, mu, difference:sD/K,pairedSe:Math.sqrt(Math.max(0,sD2/K-(sD/K)**2)/K) };
        });
        v.legend([['accent', '$ES_{N\\wedge T}$'], ['orange', '$\\mu E(N\\wedge T)$'], ['red', 'level $L$', { dash: true }]]);
        v.readout(() => st && `$\\mu=${v.fix(st.mu, 2)}$: $E(N\\wedge T)=${v.fix(st.mN, 2)}$; $ES_{N\\wedge T}=${v.fix(st.mS, 3)}\\pm${v.fix(1.96 * st.seS, 3)}$ and $\\mu E(N\\wedge T)=${v.fix(st.rhs, 3)}\\pm${v.fix(1.96 * st.seR, 3)}$. ${v.fix(100 * st.cap, 1)}% remain below the barrier at the cap. Paired difference $${v.fix(st.difference,3)}$ (standard error $${v.fix(st.pairedSe,3)}$).`);
      },
    },
    {
      num: '4.8.7',
      kind: 'Theorem',
      name: 'Gambler’s ruin for symmetric simple random walk',
      statement: String.raw`Let $S_n$ be the symmetric simple random walk started at $x$, and $a<x<b$ integers, $N=\inf\{n:S_n\in\{a,b\}\}$. Then $N<\infty$ a.s.,
$$P_x(S_N=a)=\frac{b-x}{b-a},\qquad P_x(S_N=b)=\frac{x-a}{b-a},\qquad E_xN=(x-a)(b-x).$$`,
      idea: String.raw`$S_n$ is a bounded-until-$N$ martingale, so optional stopping (4.8.2, 4.4.1) gives $x=ES_N=a\,P(S_N=a)+b\,P(S_N=b)$, which together with $P(S_N=a)+P(S_N=b)=1$ solves the first two formulas. For the time, $S_n^2-n$ is a martingale; stopping gives $E S_N^2-EN=x^2$, hence $EN=ES_N^2-x^2=(x-a)(b-x)$. Finiteness of $N$ follows from a geometric tail: from any point the barrier is reached within $b-a$ steps with probability $\ge2^{-(b-a)}$.`,
      caption: String.raw`Interval $[0,b]$ ($a=0$; shift for general $a$). Left: from $x$ (slider) six seeded walks until absorption. Middle: $P_y(\text{hit }b)=y/b$ (line) and Monte Carlo estimates from every starting point $y$ (dots, 1500 runs each). Right: $E_yN=y(b-y)$ (parabola, red) and the simulated means (dots). Make $b$ larger and watch the parabola's peak $b^2/4$ grow: crossing an interval takes time $\propto$ width$^2$.`,
      deps: ['prob-4.8.2', 'prob-4.4.1'],
      see: ['stoch-2.4', 'stoch-12.4'],
      tags: ['random walk', 'optional stopping'],
      viz(v) {
        const bS = v.slider('$b$', 4, 30, 14, { int: true });
        const xS = v.slider('start $x$', 1, 29, 5, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const P = v.stage({ x: [0, 150], y: [0, 14], height: 300, axes: 'box', gutter: true, xlabel: '$n$', title: 'walks from $x$ until absorption' });
        const Q = v.stage({ x: [0, 14], y: [0, 1], height: 300, axes: 'box', gutter: true, xlabel: '$y$', title: '$P_y(S_N=b)$' });
        const Rr = v.stage({ x: [0, 14], y: [0, 60], height: 300, axes: 'box', gutter: true, xlabel: '$y$', title: '$E_yN$' });
        let st = null, pool = null;
        v.render(() => {
          const b = bS.value, x = Math.min(xS.value, b - 1), key = `${b}|${seed}`;
          if (!pool || pool.key !== key) {
            const r = v.rng(seed * 313 + b), K = 1500, ph = [], et = [];
            for (let y = 1; y < b; y++) { let hit = 0, tot = 0; for (let j = 0; j < K; j++) { let s = y, n = 0; while (s > 0 && s < b) { s += r() < 0.5 ? 1 : -1; n++; } if (s === b) hit++; tot += n; } ph.push(hit / K); et.push(tot / K); }
            pool = { key, ph, et };
          }
          const r3 = v.rng(seed * 5 + 1);
          P.setView([0, Math.max(40, b * b / 2)], [-0.5, b + 0.5]); P.hline(0, { color: 'red', width: 1.6 }); P.hline(b, { color: 'green', width: 1.6 });
          for (let j = 0; j < 6; j++) { let s = x, n = 0; const pts = [[0, s]]; while (s > 0 && s < b && n < 5000) { s += r3() < 0.5 ? 1 : -1; n++; pts.push([n, s]); } P.path(pts, { color: COLS[j], width: 1.3 }); P.dot(n, s, { color: s === b ? 'green' : 'red', r: 4 }); }
          Q.setView([0, b], [0, 1]); Q.line(0, 0, b, 1, { color: 'accent', width: 2.4 });
          Rr.setView([0, b], [0, (b * b) / 4 * 1.2]); Rr.fn((y) => y * (b - y), { color: 'red', width: 2.4 });
          let dev1 = 0, dev2 = 0;
          pool.ph.forEach((p, i) => { const y = i + 1; Q.dot(y, p, { color: 'orange', r: 3.5 }); dev1 = Math.max(dev1, Math.abs(p - y / b)); });
          pool.et.forEach((e, i) => { const y = i + 1; Rr.dot(y, e, { color: 'orange', r: 3.5 }); dev2 = Math.max(dev2, Math.abs(e - y * (b - y)) / (y * (b - y))); });
          Q.vline(x, { color: 'gold', dash: true }); Rr.vline(x, { color: 'gold', dash: true });
          st = { x, b, p: x / b, e: x * (b - x), dev1, dev2 };
        });
        v.legend([['accent', '$y/b$'], ['red', '$y(b-y)$'], ['orange', 'simulation']]);
        v.readout(() => st && `From $x=${st.x}$ with $b=${st.b}$: $P_x(\\text{hit }b)=x/b=${v.fix(st.p, 3)}$, $E_xN=x(b-x)=${st.e}$. Worst simulation error: ${v.fix(st.dev1, 3)} in probability, ${v.fix(100 * st.dev2, 1)}% in mean time.`);
      },
    },
    {
      num: '4.8.8',
      kind: 'Theorem',
      name: 'Generating function of the first passage time to 1',
      statement: String.raw`For the symmetric simple random walk from $0$ let $T_1=\inf\{n:S_n=1\}$. For $0<s<1$,
$$E\,s^{T_1}=\frac{1-\sqrt{1-s^2}}{s}.$$
Equivalently $P(T_1=2k-1)=\dfrac{\binom{2k-2}{k-1}}{k\,2^{2k-1}}$, and $P(T_1<\infty)=1$ while $ET_1=\infty$.`,
      idea: String.raw`For $\theta>0$, $X_n=\exp(\theta S_n)\cosh(\theta)^{-n}$ is a nonnegative martingale. Stopped at $T_1$, $X_{T_1\wedge n}\le e^{\theta}$ is bounded, so $EX_{T_1\wedge n}=1$ (4.4.1). On $\{T_1=\infty\}$, $X_n\le e^\theta\cosh(\theta)^{-n}\to0$, and on $\{T_1<\infty\}$ the limit is $e^\theta\cosh(\theta)^{-T_1}$; dominated convergence gives $E[e^{\theta}\cosh(\theta)^{-T_1};T_1<\infty]=1$. With $s=1/\cosh\theta$ this reads $E[s^{T_1}]=e^{-\theta}=(1-\sqrt{1-s^2})/s$. Letting $s\uparrow1$ gives $P(T_1<\infty)=1$ (the recurrence found by 4.8.7).`,
      caption: String.raw`6000 seeded walks, each run until $T_1$ or at most 3000 steps (the factor $s^{T}$ is negligible for the capped ones when $s\le0.99$). Left: the empirical $E\,s^{T_1}$ for $s$ on a grid (dots, with the running estimate in accent) against $(1-\sqrt{1-s^2})/s$ (red); drag the gold handle along $s$ to read off the martingale parameter $\theta=\operatorname{arccosh}(1/s)$ and $e^{-\theta}$. Right: the empirical law of $T_1$ against $P(T_1=2k-1)=C_{k-1}/2^{2k-1}$ (Catalan numbers): the heavy tail $k^{-3/2}$ is why $ET_1=\infty$.`,
      deps: ['prob-4.8.7', 'prob-4.8.2'],
      tags: ['random walk', 'generating functions'],
      viz(v) {
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: '$s$', title: '$E\\,s^{T_1}$' });
        const B = v.stage({ x: [0.5, 12.5], y: [0, 0.55], height: 320, axes: 'box', gutter: true, xlabel: '$k$ (where $T_1=2k-1$)', title: 'law of $T_1$' });
        const h = A.handle(0.7, 0, { color: 'gold', label: '$s$', constrain: 'x' });
        let pool = null, st = null;
        v.render(() => {
          if (!pool || pool.seed !== seed) {
            const r = v.rng(seed * 421 + 7), K = 6000, T = 3000, Ts = new Int32Array(K); let capped = 0;
            for (let j = 0; j < K; j++) { let s = 0, n = 0; while (s < 1 && n < T) { s += r() < 0.5 ? 1 : -1; n++; } Ts[j] = s >= 1 ? n : 0; if (s < 1) capped++; }
            pool = { seed, Ts, K, capped };
          }
          const f = (s) => (1 - Math.sqrt(1 - s * s)) / s, emp = (s) => { let a = 0; for (let j = 0; j < pool.K; j++) if (pool.Ts[j]) a += Math.pow(s, pool.Ts[j]); return a / pool.K; };
          A.fn(f, { color: 'red', width: 2.6, domain: [0.001, 0.999] });
          const S = Array.from({ length: 24 }, (_, i) => 0.04 + 0.04 * i); S.forEach((s) => A.dot(s, emp(s), { color: 'accent', r: 3.5 }));
          const s0 = clampN(h.x, 0.05, 0.99); h.set(s0, 0);
          A.line(s0, 0, s0, f(s0), { color: 'gold', dash: true }); A.dot(s0, emp(s0), { color: 'gold', r: 6 });
          const cnt = new Float64Array(13); for (let j = 0; j < pool.K; j++) { const T = pool.Ts[j]; if (T && T <= 25) cnt[(T + 1) / 2]++; }
          const cat = (k) => Math.exp(logChoose(2 * k - 2, k - 1) - Math.log(k) - (2 * k - 1) * Math.LN2);
          for (let k = 1; k <= 12; k++) { B.rect(k - 0.36, 0, k - 0.04, cnt[k] / pool.K, { fill: 'accent', fillAlpha: 0.4, color: 'accent' }); B.rect(k + 0.04, 0, k + 0.36, cat(k), { fill: 'red', fillAlpha: 0.4, color: 'red' }); }
          const th = Math.acosh(1 / s0);
          st = { s0, emp: emp(s0), ex: f(s0), th, e: Math.exp(-th), capped: pool.capped / pool.K };
        });
        v.legend([['accent', 'simulation'], ['red', 'formula'], ['gold', 'chosen $s$']]);
        v.readout(() => st && `$s=${v.fix(st.s0, 3)}$: empirical $Es^{T_1}=${v.fix(st.emp, 4)}$; formula $${v.fix(st.ex, 4)}$; martingale parameter $\\theta=${v.fix(st.th, 3)}$, $e^{-\\theta}=${v.fix(st.e, 4)}$. ${v.fix(100 * st.capped, 2)}% of walks had not reached $1$ after 3000 steps.`);
      },
    },
    {
      num: '4.8.9',
      kind: 'Theorem',
      name: 'Gambler’s ruin for asymmetric simple random walk',
      statement: String.raw`Let $S_n$ step $+1$ with probability $p\ne\frac12$ and $-1$ with probability $q=1-p$, started at $x\in(0,b)$, and $r=q/p$. With $N$ the exit time from $(0,b)$:
$$P_x(S_N=b)=\frac{1-r^{x}}{1-r^{b}},\qquad P_x(S_N=0)=\frac{r^x-r^b}{1-r^b}.$$
If $p>\frac12$ and $T_b$ is the hitting time of $b$ (no lower barrier), $E_xT_b=(b-x)/(2p-1)$.`,
      idea: String.raw`$r^{S_n}$ is a martingale ($E r^{\xi}=pr+q/r=q+p=1$), bounded up to time $N$, so optional stopping (4.8.2, 4.4.1) gives $r^x=P(S_N=0)+r^bP(S_N=b)$ — two equations, two unknowns. For the hitting time use the martingale $S_n-(2p-1)n$: by Wald/4.8.5 $E_xS_{T_b}-x=(2p-1)E_xT_b$, with $S_{T_b}=b$; $ET_b<\infty$ because the walk drifts upward.`,
      caption: String.raw`Bias slider $p$. Left: the probability to reach $b$ before $0$ from each start $y$: the formula from the martingale $r^{S_n}$ (line) and simulation (dots, 1500 runs per start), for $b=12$. Right: for $p>\frac12$, the histogram of $T_b$ from $0$ for the target $d$ (slider) over 3000 runs, with the simulated mean (gold) and the formula $d/(2p-1)$ (red); for $p\le\frac12$ the hitting time is infinite with probability $1-(p/q)^d$ for $p<\frac12$, so no finite mean exists and the panel says so.`,
      deps: ['prob-4.8.2', 'prob-4.4.1'],
      tags: ['random walk', 'optional stopping'],
      viz(v) {
        const pS = v.slider('$p$', 0.3, 0.9, 0.6, { step: 0.01 });
        const dS = v.slider('target $d$', 2, 20, 8, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const B = 12;
        const A = v.stage({ x: [0, B], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: '$y$', title: '$P_y(\\text{hit }12\\text{ before }0)$' });
        const R = v.stage({ x: [0, 200], y: [0, 0.1], height: 320, axes: 'box', gutter: true, xlabel: '$T_d$', title: 'hitting time of $d$' });
        let st = null;
        v.render(() => {
          const p = pS.value, d = dS.value, r = v.rng(seed * 701 + Math.round(p * 100)), q = 1 - p, rho = q / p;
          const F = (y) => (Math.abs(p - 0.5) < 1e-9 ? y / B : (1 - rho ** y) / (1 - rho ** B));
          A.fn(F, { color: 'accent', width: 2.6, domain: [0, B] });
          let dev = 0;
          for (let y = 1; y < B; y++) { let hit = 0, K = 1500; for (let j = 0; j < K; j++) { let s = y; while (s > 0 && s < B) s += r() < p ? 1 : -1; if (s === B) hit++; } A.dot(y, hit / K, { color: 'orange', r: 3.5 }); dev = Math.max(dev, Math.abs(hit / K - F(y))); }
          const cap = 6000, K2 = 3000; let tot = 0, nfin = 0; const times = [];
          for (let j = 0; j < K2; j++) { let s = 0, n = 0; while (s < d && n < cap) { s += r() < p ? 1 : -1; n++; } if (s >= d) { tot += n; nfin++; times.push(n); } }
          const mean = nfin ? tot / nfin : NaN, pf = nfin / K2;
          if (p > 0.5) {
            const ex = d / (2 * p - 1), xmax = Math.max(40, Math.min(600, ex * 3));
            const bins = 40, E = Array.from({ length: bins + 1 }, (_, i) => (xmax * i) / bins), cnt = new Float64Array(bins);
            for (const t of times) { const k = Math.floor((t / xmax) * bins); if (k < bins) cnt[k]++; }
            const dens = Array.from(cnt, (c) => c / (K2 * (xmax / bins)));
            R.setView([0, xmax], [0, Math.max(...dens) * 1.2]);
            R.hist({ edges: E, counts: Array.from(cnt), density: dens }, { density: true, color: 'accent', fillAlpha: 0.3 });
            R.vline(ex, { color: 'red', width: 2.2 }); R.vline(mean, { color: 'gold', width: 2, dash: [5, 3] });
          } else { R.setView([0, 100], [0, 1]); cornerIn(R, p < 0.5 ? 'drift is downward: $ET_d=\\infty$' : 'critical case: $ET_d=\\infty$', 'tl', { size: 14, color: 'red' }); }
          st = { p, rho, dev, mean, ex: p > 0.5 ? d / (2 * p - 1) : Infinity, pf, d, pinf: p < 0.5 ? 1 - Math.pow(p / q, d) : 0 };
        });
        v.legend([['accent', 'martingale formula; simulation histogram'], ['orange', 'simulated ruin probability'], ['red', 'mean $d/(2p-1)$'], ['gold', 'simulated mean', { dash: true }]]);
        v.readout(() => st && `$r=q/p=${v.fix(st.rho, 3)}$; worst gap between formula and simulation: ${v.fix(st.dev, 3)}. ` + (st.p > 0.5 ? `Mean hitting time of $${st.d}$: simulated $${v.fix(st.mean, 2)}$ vs $d/(2p-1)=${v.fix(st.ex, 2)}$.` : `Not reached within 6000 steps in ${v.fix(100 * (1 - st.pf), 1)}% of runs (infinite-time probability $${v.fix(st.pinf, 3)}$ for $p<\\frac12$).`));
      },
    },
    // ============================================================ 4.9 reflection and arcsine
    {
      num: '4.9.1',
      kind: 'Theorem',
      name: 'Reflection principle (path counting)',
      statement: String.raw`Let $x,y$ be positive integers and $n\ge0$ an integer. The number of nearest-neighbor paths of the simple walk from $(0,x)$ to $(n,y)$ that touch $0$ equals the number of all paths from $(0,-x)$ to $(n,y)$:
$$\#\{\text{paths }x\to y\text{ in }n\text{ steps touching }0\}=\binom{n}{\frac{n+y+x}{2}} .$$
The binomial coefficient is zero when its lower argument is not an integer in $[0,n]$.
Consequently, for the symmetric walk, $P_x(S_n=y,\ \min_{k\le n}S_k\le0)=P_x(S_n=-y)$ (for $y>0$).`,
      idea: String.raw`Reflect the initial segment of a touching path, up to its first visit to $0$, across the line $y=0$. This maps touching paths from $x$ to $y$ bijectively onto paths from $-x$ to $y$: every path from $-x$ to $y>0$ must cross $0$, and reflecting back up to its first crossing returns the original. The number of up-steps in a path from $-x$ to $y$ is $(n+y+x)/2$, giving the binomial coefficient.`,
      caption: String.raw`Set $n$, the start $x$ and the endpoint $y$. All $\binom{n}{(n+y-x)/2}$ paths are enumerated; the ones touching $0$ are listed. Choose one with the slider "touching path index" (clamped to the available index range): red is the path, the dashed blue path is its reflection up to the first zero (dot), which starts at $-x$. Right: the counts: all paths $x\to y$, those touching $0$ (enumerated), and the number of paths from $-x$ to $y$ (formula): the last two bars are equal for every $(n,x,y)$.`,
      refs: ['Durrett, Probability: Theory and Examples, version 5 (2019), Theorem 4.9.1, p. 263'],
      links: { source: 'https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      deps: [],
      see: ['comb-5.2', 'stoch-2.10'],
      tags: ['random walk', 'combinatorics'],
      viz(v) {
        const nS = v.slider('$n$', 4, 16, 12, { int: true });
        const xS = v.slider('start $x$', 1, 5, 2, { int: true });
        const yS = v.slider('end $y$', 1, 10, 2, { int: true });
        const kS = v.slider('touching path index', 0, 12869, 0, { int: true });
        const A = v.stage({ x: [0, 16], y: [-6, 8], height: 340, weight: 1.3, axes: 'box', gutter: true, xlabel: '$k$', title: 'a touching path and its reflection' });
        const B = v.stage({ x: [0.4, 3.6], y: [0, 1], height: 340, axes: 'box', gutter: true, title: 'counts', xticks: [] });
        let st = null;
        v.render(() => {
          const n=nS.value,x=xS.value,y=yS.value;
          const ups = (n + y - x) / 2;
          const envelope=(n+x+y)/2+1; A.setView([0,n],[-envelope,envelope]);
          A.hline(0, { color: 'ink', width: 1.8 });
          if (!Number.isInteger(ups)||ups<0||ups>n) {kS.el.hidden=true;B.setView([.4,3.6],[0,1]);B.text('No paths: parity or reach fails',2,.5,{align:'center',color:'muted'});st={bad:true};return;}
          const touching = []; let total = 0;
          for (let m = 0; m < 1 << n; m++) {
            let pc = 0, t = m; while (t) { pc += t & 1; t >>= 1; } if (pc !== ups) continue; total++;
            let s = x, hit = false; for (let i = 0; i < n; i++) { s += (m >> i) & 1 ? 1 : -1; if (s === 0) { hit = true; } } if (hit) touching.push(m);
          }
          const idx = touching.length ? Math.min(kS.value, touching.length - 1) : -1; kS.el.hidden = !touching.length;
          // draw a few non-touching paths faintly
          let drawn = 0; for (let m = 0; m < 1 << n && drawn < 40; m += 1 + (m >> 3)) { let pc = 0, t = m; while (t) { pc += t & 1; t >>= 1; } if (pc !== ups || touching.includes(m)) continue; let s = x; const pts = [[0, s]]; for (let i = 0; i < n; i++) { s += (m >> i) & 1 ? 1 : -1; pts.push([i + 1, s]); } A.path(pts, { color: 'faint', width: 1, alpha: 0.5 }); drawn++; }
          if (idx >= 0) {
            const m = touching[idx]; let s = x, first = -1; const pts = [[0, s]], refl = [[0, -s]];
            for (let i = 0; i < n; i++) { s += (m >> i) & 1 ? 1 : -1; pts.push([i + 1, s]); if (first < 0 && s === 0) first = i + 1; }
            for (let i = 1; i <= n; i++) refl.push([i, i <= first ? -pts[i][1] : pts[i][1]]);
            A.path(refl, { color: 'blue', width: 2.4, dash: [6, 4] }); A.path(pts, { color: 'red', width: 2.6 }); A.dot(first, 0, { color: 'gold', r: 6 });
            A.dot(0, x, { color: 'red', r: 4, label: 'x', labelPos: 'ne' }); A.dot(0, -x, { color: 'blue', r: 4 }); A.dot(n, y, { color: 'ink', r: 5 });
          }
          const refCount = exactChoose(n, (n + y + x) / 2), cnts = [total, touching.length, refCount];
          const top = Math.max(1,...cnts) * 1.15; B.setView([0.4, 3.6], [0, top]);
          ['accent', 'red', 'blue'].forEach((c, i) => { B.rect(i + 0.62, 0, i + 1.38, cnts[i], { fill: c, fillAlpha: 0.4, color: c, width: 1.5 }); B.text(String(Math.round(cnts[i])), i + 1, cnts[i], { size: 13, baseline: 'bottom', dy: -4 }); });
          B.tex('\\text{all }x\\to y', 1, 0, { size: 13, dy: -16 }); B.tex('\\text{touching }0', 2, 0, { size: 13, dy: -16 }); B.tex('-x\\to y', 3, 0, { size: 13, dy: -16 });
          st = {n,x,y,total,touch:touching.length,ref:refCount,idx};
        });
        v.legend([['red', 'touching path'], ['blue', 'reflected up to first zero', { dash: true }], ['gold', 'first zero']]);
        v.readout(() => st && (st.bad ? 'No such path: the selected parity or distance is incompatible with nearest-neighbor steps.' : `$n=${st.n}$, $x=${st.x}$, $y=${st.y}$: ${st.total} paths in all, ${st.touch} touch $0$, and $\\binom{${st.n}}{${(st.n + st.y + st.x) / 2}}=${st.ref}$ paths go from $-x$ to $y$. Equal: ${st.touch === st.ref}. ${st.idx>=0?`Displayed touching path index ${st.idx} of ${st.touch-1}.`:'No touching paths.'}`));
      },
    },
  ],
};
