// Probability: Theory and Examples (Durrett) — Chapter 4, part A2: §4.2 martingales, stopping, upcrossings and convergence
import { clampN, cornerIn, fr, PhiN, walkPaths, meanPaths, upcrossings, expectPhi, logInts, quantileOf } from './ch04-a.shared.js';

import { gamblingSystems, predictableFailures, exactUpcrossingWalk, stoppingRules } from './ch04-stopping.shared.js';

const fx = (x, d = 3) => fr(x, d);
const polyl = (a, f = (x) => x) => Array.from(a, (y, i) => [i, f(y)]);

export default {
  collection: 'prob',
  chapter: 4,
  items: [
    {
      num: '4.2.6',
      kind: 'Theorem',
      name: 'Convex functions of martingales are submartingales',
      statement: String.raw`If $X_n$ is a martingale with respect to $\mathcal F_n$ and $\varphi$ is convex with $E|\varphi(X_n)|<\infty$ for all $n$, then $\varphi(X_n)$ is a submartingale. In particular, if $p\ge1$ and $E|X_n|^p<\infty$ for all $n$, then $|X_n|^p$ is a submartingale.`,
      idea: String.raw`Conditional Jensen (4.1.10) gives $E(\varphi(X_{n+1})\mid\mathcal F_n)\ge\varphi(E(X_{n+1}\mid\mathcal F_n))=\varphi(X_n)$, the last step because $X_n$ is a martingale. Nothing else is used; integrability of $\varphi(X_n)$ is assumed.`,
      caption: String.raw`The martingale is a symmetric $\pm1$ walk started at $x_0$. Left: seeded paths of $\varphi(X_n)$ (thin) and the exact mean $E\varphi(X_n)$ (thick orange, computed from the binomial law), which can only go up for convex $\varphi$. Right: the one-step reason. Drag the gold handle to a value $s$ of $X_n$: the next value is $s\pm1$ with probability $\tfrac12$ each, so $E(\varphi(X_{n+1})\mid X_n=s)$ is the midpoint of the chord (green), which lies above $\varphi(s)$ for convex $\varphi$. The concave choice $-|x|$ is a supermartingale: the average sinks.`,
      deps: ['prob-4.1.10', 'prob-4.2.1a'],
      tags: ['martingales', 'convexity'],
      viz(v) {
        const PH = { abs: { l: '$|x|$', f: Math.abs }, sq: { l: '$x^2$', f: (x) => x * x }, ex: { l: '$e^{x}$', f: (x) => Math.exp(x) }, cc: { l: '$-|x|$ (concave)', f: (x) => -Math.abs(x) } };
        const ph = v.select('$\\varphi$', Object.keys(PH).map((k) => ({ value: k, label: PH[k].l })), 'abs');
        const x0S = v.slider('start $x_0$', -4, 4, 0, { int: true });
        const NN = 24;
        const L = v.stage({ x: [0, NN], y: [0, 10], axes: 'box', gutter: true, height: 340, xlabel: 'time $n$', title: '$\\varphi(X_n)$: paths and exact mean' });
        const R = v.stage({ x: [-8, 8], y: [-1, 10], axes: 'box', gutter: true, height: 340, xlabel: 'value $s$ of $X_n$', title: 'one step: $s\\mapsto s\\pm1$', minWidth: 280 });
        const hd = R.handle(2, 0, { color: 'gold', r: 8, constrain: (x) => [clampN(Math.round(x), -7, 7), 0] });
        const r = v.rng(4), paths = walkPaths(r, 14, NN, 0.5, 0); let st = null;
        v.render(() => {
          const f = PH[ph.value].f, x0 = x0S.value;
          const ps = paths.map((a) => Array.from(a, (y) => f(y + x0)));
          const mean = Array.from({ length: NN + 1 }, (_, n) => expectPhi(f, n, 0.5, x0));
          const all = [...ps.flat(), ...mean], lo = Math.min(...all), hi = Math.max(...all), pd = 0.08 * (hi - lo + 1);
          L.setView([0, NN], [lo - pd, hi + pd]);
          ps.forEach((p) => L.path(polyl(p), { color: 'muted', width: 0.9, alpha: 0.45 }));
          L.hline(f(x0), { color: 'ink', dash: [5, 4], width: 1.3 });
          L.path(polyl(mean), { color: 'orange', width: 3.2 });
          const s = Math.round(hd.x) , fs = f(s), a = f(s - 1), b = f(s + 1), mid = (a + b) / 2;
          const xs = Array.from({ length: 81 }, (_, i) => -8 + i * 0.2).map(f); const l2 = Math.min(...xs, 0), h2 = Math.max(...xs.map((q) => Math.min(q, 14)));
          R.setView([-8, 8], [l2 - 1, h2 + 1]); hd.set(s, l2 - 0.6);
          R.fn(f, { color: 'ink', width: 2 });
          R.line(s - 1, a, s + 1, b, { color: 'green', width: 2 });
          R.vline(s, { color: 'faint', dash: [4, 4] });
          R.dot(s - 1, a, { r: 4, color: 'accent' }); R.dot(s + 1, b, { r: 4, color: 'accent' });
          R.dot(s, fs, { r: 6, color: 'orange', label: '$\\varphi(s)$', labelPos: 'se' }); R.dot(s, mid, { r: 6, color: 'green', label: '$\\tfrac12(\\varphi(s-1)+\\varphi(s+1))$', labelPos: 'nw' });
          let inc = Infinity; for (let n = 0; n < NN; n++) inc = Math.min(inc, mean[n + 1] - mean[n]); let dec = -Infinity; for (let n = 0; n < NN; n++) dec = Math.max(dec, mean[n + 1] - mean[n]);
          st = { mean: mean[NN], m0: mean[0], inc, dec, s, gap: mid - fs };
        });
        v.legend([['muted', '$\\varphi(X_n)$ paths'], ['orange', '$E\\varphi(X_n)$ (exact)'], ['ink', '$\\varphi(X_0)$', { dash: [5, 4] }], ['green', 'chord at $s$']]);
        v.readout(() => st && `$E\\varphi(X_{${NN}})=${fx(st.mean, 3)}$ against $\\varphi(X_0)=${fx(st.m0, 3)}$. Smallest one-step change of the mean: $${fx(st.inc, 4)}$, largest: $${fx(st.dec, 4)}$ ⇒ ${st.inc >= -1e-9 ? '**never decreases** (submartingale)' : st.dec <= 1e-9 ? '**never increases** (supermartingale)' : 'mixed'}. At $s=${st.s}$ the chord midpoint minus $\\varphi(s)$ is $${fx(st.gap, 3)}$.`);
      },
    },
    {
      num: '4.2.7',
      kind: 'Theorem',
      name: 'Increasing convex functions of submartingales',
      statement: String.raw`If $X_n$ is a submartingale and $\varphi$ is **increasing and convex** with $E|\varphi(X_n)|<\infty$, then $\varphi(X_n)$ is a submartingale. In particular $(X_n-a)^+$ is a submartingale whenever $X_n$ is, and $X_n\wedge a$ is a supermartingale whenever $X_n$ is a supermartingale.`,
      idea: String.raw`Conditional Jensen followed by monotonicity of $\varphi$: $E(\varphi(X_{n+1})\mid\mathcal F_n)\ge\varphi(E(X_{n+1}\mid\mathcal F_n))\ge\varphi(X_n)$. The first inequality needs convexity, the second needs the submartingale property **and** that $\varphi$ is increasing. For a martingale (4.2.6) the second step is an equality, so monotonicity is not needed there.`,
      caption: String.raw`A $\pm1$ walk with up-probability $p>\tfrac12$ (a submartingale) started at $x_0$. The thick curve is the exact mean $E\varphi(X_n)$ for the chosen $\varphi$. $\max(x,a)$ and $e^x$ are increasing and convex: the mean rises. $e^{-x}$ (decreasing, convex) falls once the walk drifts upward. $x^2$ is convex but not increasing: start at a negative $x_0$ and the mean first falls as the walk climbs towards $0$. Drag $x_0$ and $a$ to see which of the two hypotheses fails.`,
      deps: ['prob-4.1.10', 'prob-4.2.1a'],
      tags: ['martingales', 'convexity'],
      viz(v) {
        const aS = v.slider('level $a$ in $\\max(x,a)$', -6, 6, 0, { int: true });
        const PH = (a) => ({ mx: { l: '$\\max(x,a)$', f: (x) => Math.max(x, a), up: true }, ex: { l: '$e^{x/3}$', f: (x) => Math.exp(x / 3), up: true }, em: { l: '$e^{-x/3}$ (decreasing)', f: (x) => Math.exp(-x / 3), up: false }, sq: { l: '$x^2$ (not monotone)', f: (x) => x * x, up: false } });
        const ph = v.select('$\\varphi$', Object.entries(PH(0)).map(([k, o]) => ({ value: k, label: o.l })), 'mx');
        const pS = v.slider('up-probability $p$', 0.5, 0.8, 0.6, { step: 0.01 });
        const x0S = v.slider('start $x_0$', -8, 8, -6, { int: true });
        const NN = 30;
        const L = v.stage({ x: [0, NN], y: [0, 10], axes: 'box', gutter: true, height: 330, xlabel: 'time $n$', title: '$E\\varphi(X_n)$ and sample paths of $\\varphi(X_n)$' });
        const R = v.stage({ x: [-10, 10], y: [0, 10], axes: 'box', gutter: true, height: 330, xlabel: '$x$', title: 'the function $\\varphi$', minWidth: 260, weight: 0.8 });
        const r = v.rng(9), pathsU = []; for (let k = 0; k < 10; k++) pathsU.push(Array.from({ length: NN }, () => r())); let st = null;
        v.render(() => {
          const P = PH(aS.value)[ph.value], f = P.f, p = pS.value, x0 = x0S.value;
          const mean = Array.from({ length: NN + 1 }, (_, n) => expectPhi(f, n, p, x0));
          const ps = pathsU.map((u) => { let x = x0; const out = [f(x)]; u.forEach((q) => { x += q < p ? 1 : -1; out.push(f(x)); }); return out; });
          const all = [...ps.flat(), ...mean], lo = Math.min(...all), hi = Math.max(...all), pd = 0.08 * (hi - lo + 1);
          L.setView([0, NN], [lo - pd, hi + pd]);
          ps.forEach((q) => L.path(polyl(q), { color: 'muted', width: 0.9, alpha: 0.45 }));
          L.hline(f(x0), { color: 'ink', dash: [5, 4], width: 1.3 });
          L.path(polyl(mean), { color: 'orange', width: 3.2 });
          const grid = Array.from({ length: 101 }, (_, i) => f(-10 + i * 0.2)); R.setView([-10, 10], [Math.min(...grid) - 0.5, Math.max(...grid) + 0.5]);
          R.fn(f, { color: 'ink', width: 2.2 }); R.vline(x0, { color: 'gold', dash: [4, 4] });
          let inc = Infinity; for (let n = 0; n < NN; n++) inc = Math.min(inc, mean[n + 1] - mean[n]);
          st = { inc, up: P.up, m: mean[NN], m0: mean[0] };
        });
        v.legend([['muted', '$\\varphi(X_n)$ paths'], ['orange', '$E\\varphi(X_n)$ (exact)'], ['ink', '$\\varphi(X_0)$', { dash: [5, 4] }], ['gold', 'start $x_0$', { dash: [4, 4] }]]);
        v.readout(() => st && `Smallest one-step change of $E\\varphi(X_n)$: $${fx(st.inc, 4)}$ ⇒ ${st.inc >= -1e-9 ? 'a **submartingale** at the level of means' : '**not** a submartingale: the mean decreases'}. $\\varphi$ is ${st.up ? 'increasing and convex' : 'convex but not increasing'}. $E\\varphi(X_{${NN}})=${fx(st.m, 3)}$ vs $\\varphi(X_0)=${fx(st.m0, 3)}$.`);
      },
    },
    {
      num: '4.2.7a',
      kind: 'Definition',
      name: 'Predictable sequence',
      refs: ['Durrett, Probability: Theory and Examples, 5th ed., unnumbered definition after Theorem 4.2.7, p. 219'],
      links: { source: 'https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=227' },
      statement: String.raw`Let $(\mathcal F_n)_{n\ge0}$ be a filtration. A sequence $H_n$, $n\ge1$, is **predictable** if $H_n\in\mathcal F_{n-1}$ for every $n\ge1$: the value of $H_n$ is determined by the information available at time $n-1$. If $X_n$ is the cumulative net gain of a gambler who bets $1$ per round, then $H_n$ is the stake placed on round $n$, and a gambling system $H$ earns
$$(H\cdot X)_n=\sum_{m=1}^nH_m\,(X_m-X_{m-1}).$$`,
      idea: String.raw`The stake on round $n$ must be fixed before round $n$ is played, so it may depend on rounds $1,\dots,n-1$ but not on round $n$ itself. This single restriction is what makes gambling systems powerless against a fair game (4.2.8): a stake that could peek at the $n$th outcome could bet only on wins and never lose.`,
      caption: String.raw`Twelve fair $\pm1$ rounds (click a column in the lower panel to flip that round). Pick a system $H$: its stakes are the bars, and the top panel shows the plain game $X_n$ and the winnings $(H\cdot X)_n$. The three honest systems depend only on earlier rounds and come out green. **Peek** uses the current outcome, staking $2$ on wins and $0$ on losses. It guarantees a nonnegative gain, positive whenever a win occurs. The checker exhausts all $2^{12}$ outcome sequences and compares stakes for every common past; this verifies predictability for this finite model only.`,
      deps: ['prob-4.2.1a'],
      tags: ['martingales'],
      viz(v) {
        const NN = 12;
        const SYS = gamblingSystems;
        const failures = Object.fromEntries(Object.entries(SYS).map(([k,S]) => [k,predictableFailures(S.H,NN)]));
        const sys = v.select('system $H$', Object.entries(SYS).map(([k, o]) => ({ value: k, label: o.l })), 'dbl');
        let seed = 3; v.button('New flips', () => { seed++; flips = null; });
        let flips = null;
        const A = v.stage({ x: [0, NN], y: [-14, 14], axes: 'box', gutter: true, height: 290, xlabel: 'round $n$', title: 'the game $X_n$ and the winnings $(H\\cdot X)_n$' });
        const B = v.stage({ x: [0.5, NN + 0.5], y: [-1.6, 9], axes: 'box', gutter: true, height: 270, xlabel: 'round $n$ (click to flip $\\xi_n$)', title: 'stakes $H_n$ and the outcomes $\\xi_n$' });
        B.onClick((x, y) => { const i = clampN(Math.round(x), 1, NN) - 1; if (!flips) return; flips[i] = -flips[i]; v.invalidate(); });
        let st = null;
        v.render(() => {
          if (!flips) { const r = v.rng(seed * 17 + 1); flips = Array.from({ length: NN }, () => (r() < 0.5 ? 1 : -1)); }
          const S = SYS[sys.value], xi = flips;
          const H = Array.from({ length: NN }, (_, k) => S.H(xi, k + 1));
          const bad = new Set(failures[sys.value]);
          const X = [0], W = [0]; xi.forEach((e, k) => { X.push(X[k] + e); W.push(W[k] + H[k] * e); });
          const lo = Math.min(...X, ...W), hi = Math.max(...X, ...W), pd = 0.1 * (hi - lo + 2);
          A.setView([0, NN], [lo - pd, hi + pd]);
          A.hline(0, { color: 'grid' }); A.path(polyl(X), { color: 'muted', width: 2 }); A.path(polyl(W), { color: 'accent', width: 3 });
          W.forEach((w, i) => A.dot(i, w, { r: 3.5, color: 'accent' }));
          for (let n = 1; n <= NN; n++) {
            const ok = !bad.has(n);
            B.rect(n - 0.35, 0, n + 0.35, H[n - 1], { fill: ok ? 'green' : 'red', fillAlpha: 0.5, color: ok ? 'green' : 'red' });
            B.rect(n - 0.3, -1.45, n + 0.3, -0.55, { fill: xi[n - 1] > 0 ? 'green' : 'red', fillAlpha: 0.7, stroke: false });
            B.text(xi[n - 1] > 0 ? '+' : '−', n, -1.0, { size: 13, color: 'ink' });
          }
          st = { bad: [...bad].sort((a, b) => a - b), final: W[NN], X: X[NN] };
        });
        v.legend([['green', 'stake fixed by the past', { area: true }], ['red', 'stake depends on round $n$ or later', { area: true }], ['accent', '$(H\\cdot X)_n$'], ['muted', '$X_n$']]);
        v.readout(() => st && `${st.bad.length ? `**Not predictable**: $H_n$ changes when $\\xi_j$ ($j\\ge n$) is flipped, for $n\\in\\{${st.bad.join(',')}\\}$.` : '**Predictable in this 12-round model**: stakes agree for every common past, over all 4096 outcomes.'} Final winnings $(H\\cdot X)_{${NN}}=${st.final}$ against $X_{${NN}}=${st.X}$.`);
      },
    },
    {
      num: '4.2.8',
      kind: 'Theorem',
      name: 'Martingale transforms: no system beats a fair game',
      statement: String.raw`Let $X_n$, $n\ge0$, be a supermartingale. If $H_n\ge0$ is predictable and every $H_n$ is bounded, then $(H\cdot X)_n=\sum_{m\le n}H_m(X_m-X_{m-1})$ is a supermartingale. The same holds for submartingales, and for martingales without the restriction $H_n\ge0$. So no bounded gambling system turns an unfavourable game into a favourable one.`,
      idea: String.raw`Write $(H\cdot X)_{n+1}=(H\cdot X)_n+H_{n+1}(X_{n+1}-X_n)$. Since $H_{n+1}\in\mathcal F_n$, take it out of the conditional expectation (4.1.14): $E(H_{n+1}(X_{n+1}-X_n)\mid\mathcal F_n)=H_{n+1}E(X_{n+1}-X_n\mid\mathcal F_n)\le0$ because $H_{n+1}\ge0$ and the increment has nonpositive conditional mean. Boundedness of $H$ gives integrability.`,
      caption: String.raw`An unfavourable coin game (win probability $p$) played by 2000 seeded gamblers, each following the chosen system with stakes capped at $B$ (the theorem needs bounded stakes). Thin curves are a few gamblers; the thick orange curve is the average fortune $(H\cdot X)_n$ with a $\pm2$ standard-error band, and the dashed line is the plain game $n(2p-1)$. For $p\le\tfrac12$ the theorem bounds the expected fortune by $0$; the finite sample mean and its estimated uncertainty can fluctuate. Slide $p$ above $\tfrac12$ to make the underlying game favorable.`,
      deps: ['prob-4.2.7a', 'prob-4.1.14'],
      see: ['fin-11.2'],
      tags: ['martingales', 'gambling'],
      viz(v) {
        const SY = {
          flat: { l: 'constant 1', H: (hist) => 1 },
          dbl: { l: 'doubling after losses', H: (hist) => { let h = 1; for (const e of hist) h = e < 0 ? 2 * h : 1; return h; } },
          chase: { l: 'raise after wins', H: (hist) => { let h = 1; for (const e of hist) h = e > 0 ? h + 1 : 1; return h; } },
          stop: { l: 'stop-loss at $-6$', H: (hist) => { let s = 0; for (const e of hist) s += e; return s <= -6 ? 0 : 1; } },
        };
        const sys = v.select('system', Object.entries(SY).map(([k, o]) => ({ value: k, label: o.l })), 'dbl');
        const pS = v.slider('win probability $p$', 0.3, 0.6, 0.45, { step: 0.01 });
        const cap = v.slider('stake cap $B$', 1, 64, 16, { log: true, int: true });
        const NN = 60, M = 2000;
        const s = v.stage({ x: [0, NN], y: [-60, 60], axes: 'box', gutter: true, height: 380, xlabel: 'round $n$', ylabel: 'fortune $(H\\cdot X)_n$', title: 'average fortune of 2000 gamblers' });
        const r = v.rng(123), U = []; for (let k = 0; k < M; k++) { const u = new Float64Array(NN); for (let i = 0; i < NN; i++) u[i] = r(); U.push(u); }
        let st = null;
        v.render(() => {
          const p = pS.value, S = SY[sys.value], B = cap.value, sum = new Float64Array(NN + 1), sq = new Float64Array(NN + 1), paths = [];
          for (let k = 0; k < M; k++) {
            let w = 0; const hist = []; const path = [0];
            for (let n = 1; n <= NN; n++) { const h = clampN(S.H(hist), 0, B), e = U[k][n - 1] < p ? 1 : -1; w += h * e; hist.push(e); sum[n] += w; sq[n] += w * w; path.push(w); }
            if (k < 12) paths.push(path);
          }
          const mean = Array.from(sum, (x) => x / M), se = Array.from(sq, (q, n) => Math.sqrt(Math.max(0, q / M - mean[n] ** 2) / M));
          const lo = Math.min(NN*(2*p-1), ...paths.flat(), ...mean.map((m, n) => m - 2 * se[n])), hi = Math.max(NN*(2*p-1), ...paths.flat(), ...mean.map((m, n) => m + 2 * se[n]), 5);
          s.setView([0, NN], [lo - 4, hi + 4]);
          paths.forEach((q) => s.path(polyl(q), { color: 'muted', width: 0.9, alpha: 0.5 }));
          s.hline(0, { color: 'ink', width: 1.2 });
          s.line(0, 0, NN, NN * (2 * p - 1), { color: 'accent', dash: [6, 4], width: 1.8 });
          s.between((n) => mean[Math.round(n)] - 2 * se[Math.round(n)], (n) => mean[Math.round(n)] + 2 * se[Math.round(n)], 0, NN, { fill: 'orange', fillAlpha: 0.18 });
          s.path(polyl(mean), { color: 'orange', width: 3.2 });
          st = { m: mean[NN], se: se[NN], th: NN * (2 * p - 1), p };
        });
        v.legend([['orange', 'average fortune $\\pm2$ s.e.'], ['accent', 'plain game $n(2p-1)$', { dash: [6, 4] }], ['muted', 'individual gamblers']]);
        v.readout(() => st && `After ${NN} rounds the average fortune is $${fx(st.m, 2)}\\pm${fx(2 * st.se, 2)}$ (plain game: $${fx(st.th, 2)}$). ${st.p <= 0.5 ? 'The expected fortune is at most $0$; this finite sample can fluctuate above it. The displayed band uses estimated standard errors, not a guaranteed bound.' : '$p>\\tfrac12$: the underlying game is favourable; this is a finite sample estimate.'}`);
      },
    },
    {
      num: '4.2.8a',
      kind: 'Definition',
      name: 'Stopping time',
      refs: ['Durrett, Probability: Theory and Examples, 5th ed., unnumbered definition after Theorem 4.2.8, p. 220'],
      links: { source: 'https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=228' },
      statement: String.raw`A random variable $N$ with values in $\{0,1,2,\dots\}\cup\{\infty\}$ is a **stopping time** (for the filtration $\mathcal F_n$) if $\{N=n\}\in\mathcal F_n$ for every $n<\infty$: the decision to stop at time $n$ is made with the information known at time $n$. Equivalently $\{N\le n\}\in\mathcal F_n$ for all $n$.`,
      idea: String.raw`"First time the walk hits $5$" qualifies: to know whether $N=n$ you only look at $S_0,\dots,S_n$. "The last visit to $0$ before time $100$" does not, since at time $n$ you cannot tell whether the walk will return. Stopping times are the legal ways to quit a game; their indicator $1_{\{N\ge n\}}$ is predictable, which is how 4.2.9 is derived from 4.2.8.`,
      caption: String.raw`A seeded simple random walk and a candidate rule. Slide the test time $t$: the solid blue part is the information up to $t$, the faint curves are 12 alternative futures that agree with it, and the gold marks show where the rule says to stop on each. For a stopping time the answer to "is $N=t$?" is the same on all futures (the bar is all green or all grey); for a rule that needs the future it varies (mixed bar). Here $T=40$; hitting rules return $\infty$ if no hit occurs by $T$, while last-visit and maximum rules use $[0,T]$. The sampled alternatives can expose dependence on the future; agreement among finitely many alternatives does not prove measurability. The first two rules are stopping times by their definitions; the other two are not.`,
      deps: ['prob-4.2.1a'],
      see: ['stoch-2.7'],
      tags: ['stopping times'],
      viz(v) {
        const T = 40;
        const RULES = stoppingRules(T);
        const rule = v.select('rule $N$', Object.entries(RULES).map(([k, o]) => ({ value: k, label: o.l })), 'hit4');
        const tS = v.slider('test time $t$', 1, T - 1, 18, { int: true });
        let seed = 6; v.button('New walk', () => { seed++; });
        const s = v.stage({ x: [0, T], y: [-12, 12], axes: 'box', gutter: true, height: 300, xlabel: 'time $n$', ylabel: '$S_n$', title: 'a walk, 12 alternative futures after time $t$' });
        const B = v.stage({ x: [0, 13], y: [0, 2.2], axes: false, height: 120, title: 'is $N=t$ on each future? (first bar = the actual walk)' });
        let st = null;
        v.render(() => {
          const R = RULES[rule.value], r = v.rng(seed * 31 + 7), path = [0]; for (let i = 1; i <= T; i++) path.push(path[i - 1] + (r() < 0.5 ? 1 : -1));
          const fut = (pre, t, rr) => { const q = pre.slice(0, t + 1); for (let i = t + 1; i <= T; i++) q.push(q[i - 1] + (rr() < 0.5 ? 1 : -1)); return q; };
          const t = tS.value, rt = v.rng(900 + seed), futs = [path, ...Array.from({ length: 12 }, () => fut(path, t, rt))];
          const Nact = R.N(path);
          const yy=futs.flat(),lo=Math.min(...yy),hi=Math.max(...yy);s.setView([0,T],[lo-2,hi+2]);
          s.hline(0, { color: 'grid' });
          futs.slice(1).forEach((q) => s.path(polyl(q.slice(t)).map(([i, y]) => [i + t, y]), { color: 'muted', width: 0.9, alpha: 0.6 }));
          s.path(polyl(path.slice(0, t + 1)), { color: 'accent', width: 3 });
          s.path(polyl(path.slice(t)).map(([i, y]) => [i + t, y]), { color: 'accent', width: 1.4, alpha: 0.4 });
          s.vline(t, { color: 'gold', dash: [4, 4], width: 1.4 });
          futs.forEach((q, k) => { const n = R.N(q); if (n <= T) s.dot(n, q[n], { r: k === 0 ? 6 : 3.5, color: 'gold' }); });
          futs.forEach((q, k) => { const hit = R.N(q) === t; B.rect(k + 0.1, 0.2, k + 0.9, 1.6, { fill: hit ? 'green' : 'muted', fillAlpha: hit ? 0.7 : 0.25, stroke: false }); });
          // full test
          const rr = v.rng(2024 + seed), bad = [];
          for (let tt = 0; tt <= T && bad.length < 6; tt++) { const flags = new Set(); for (let k = 0; k < 40; k++) flags.add(R.N(fut(path, tt, rr)) === tt); if (flags.size > 1) bad.push(tt); }
          const flagsT = new Set(futs.map((q) => R.N(q) === t));
          st = { Nact, bad, mixed: flagsT.size > 1, t };
        });
        v.legend([['accent', 'information up to $t$'], ['muted', 'alternative futures'], ['gold', 'where the rule stops', { dot: true }]]);
        v.readout(() => st && `Actual $N=${st.Nact > T ? '\\infty\\ (\\text{no hit by } T)' : st.Nact}$. At $t=${st.t}$ the event $\\{N=t\\}$ is ${st.mixed ? '**decided differently on different futures**' : 'decided the same way on all 13 futures'}. Sampled witness search (40 futures per time): ${st.bad.length ? `**not a stopping time** — $\\{N=t\\}$ depends on the future for $t\\in\\{${st.bad.join(',')}${st.bad.length >= 6 ? ',\\dots' : ''}\\}$.` : '**no witness found**; finite sampling does not establish a stopping time.'}`);
      },
    },
    {
      num: '4.2.9',
      kind: 'Theorem',
      name: 'Stopped supermartingales are supermartingales',
      refs: ['Durrett, Probability: Theory and Examples, 5th ed., Theorem 4.2.9, p. 220'],
      links: { source: 'https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=228' },
      statement: String.raw`If $N$ is a stopping time and $X_n$ is a supermartingale, then the stopped process $X_{N\wedge n}$ is a supermartingale. The same holds for submartingales and martingales; in particular $EX_{N\wedge n}\le EX_0$ for a supermartingale.`,
      idea: String.raw`Bet $1$ on every round up to $N$ and nothing afterwards: $H_n=1_{\{N\ge n\}}$ is predictable (bounded, $\ge0$) because $\{N\ge n\}=\{N\le n-1\}^c\in\mathcal F_{n-1}$. By 4.2.8, $(H\cdot X)_n=X_{N\wedge n}-X_0$ is a supermartingale, and adding the constant $X_0$ keeps it one.`,
      caption: String.raw`Walks with up-probability $p$ are frozen at the stopping time $N$ you choose (hit $+a$ or $-b$, or hit $+a$ only). Thin curves are 40 frozen paths. The thick orange curve is the average of $X_{N\wedge n}$ over 5000 seeded walks; the dashed blue curve is the average of the plain walk. For $p=\tfrac12$ the stopped expectation is $0$ (martingale); for $p<\tfrac12$ it is nonincreasing and at least the unstopped expectation. Sample averages fluctuate; the terminal readout gives their estimated standard error.`,
      deps: ['prob-4.2.8', 'prob-4.2.8a'],
      tags: ['martingales', 'stopping times'],
      viz(v) {
        const RULE = { both: { l: 'hit $+a$ or $-b$', f: (a, b) => (x) => x >= a || x <= -b }, up: { l: 'hit $+a$', f: (a) => (x) => x >= a } };
        const rule = v.select('stop when', Object.entries(RULE).map(([k, o]) => ({ value: k, label: o.l })), 'both');
        const pS = v.slider('up-probability $p$', 0.35, 0.65, 0.45, { step: 0.01 });
        const aS = v.slider('$a$', 1, 12, 5, { int: true }); const bS = v.slider('$b$', 1, 12, 8, { int: true });
        const NN = 80, M = 5000;
        const s = v.stage({ x: [0, NN], y: [-15, 15], axes: 'box', gutter: true, height: 370, xlabel: 'time $n$', title: '$X_{N\\wedge n}$: paths frozen at $N$, and the averages' });
        const r = v.rng(66), U = []; for (let k = 0; k < M; k++) { const u = new Float64Array(NN); for (let i = 0; i < NN; i++) u[i] = r(); U.push(u); }
        let st = null;
        v.render(() => {
          const p = pS.value, stop = RULE[rule.value].f(aS.value, bS.value), sm = new Float64Array(NN + 1), pm = new Float64Array(NN + 1), sm2 = new Float64Array(NN + 1), drawn = [];
          for (let k = 0; k < M; k++) {
            let x = 0, frozen = false; const path = [0];
            for (let n = 1; n <= NN; n++) { x += U[k][n - 1] < p ? 1 : -1; pm[n] += x; if (!frozen) { path.push(x); if (stop(x)) frozen = true; } else path.push(path[path.length - 1]); sm[n] += path[n]; sm2[n] += path[n]**2; }
            if (k < 40) drawn.push(path);
          }
          const values=[...drawn.flat(),...Array.from(pm,x=>x/M),...Array.from(sm,x=>x/M)];s.setView([0,NN],[Math.min(0,...values)-2,Math.max(0,...values)+2]);
          drawn.forEach((q) => s.path(polyl(q), { color: 'muted', width: 0.8, alpha: 0.4 }));
          s.hline(0, { color: 'ink', width: 1.2 });
          s.path(polyl(Array.from(pm, (x) => x / M)), { color: 'accent', width: 2.2, dash: [6, 4] });
          s.path(polyl(Array.from(sm, (x) => x / M)), { color: 'orange', width: 3.4 });
          st = { stopped: sm[NN] / M, plain: pm[NN] / M, p, theory: NN * (2 * p - 1), se:Math.sqrt(Math.max(0,sm2[NN]/M-(sm[NN]/M)**2)/(M-1)) };
        });
        v.legend([['orange', 'average of $X_{N\\wedge n}$'], ['accent', 'average of $X_n$', { dash: [6, 4] }], ['muted', 'frozen paths']]);
        v.readout(() => st && `At $n=${NN}$: $E X_{N\\wedge n}\\approx${fx(st.stopped, 3)}$ (estimated s.e. $${fx(st.se,3)}$; the expected value is at most $0$ for $p\\le\\tfrac12$), against $EX_n\\approx${fx(st.plain, 2)}$ for the unstopped walk (exact $${fx(st.theory, 2)}$).`);
      },
    },
    {
      num: '4.2.10',
      kind: 'Theorem',
      name: 'Upcrossing inequality',
      statement: String.raw`Let $X_m$, $m\ge0$, be a submartingale, $a<b$, and let $U_n$ be the number of upcrossings of $[a,b]$ completed by time $n$ (successive passages from $\le a$ to $\ge b$). Then
$$(b-a)\,EU_n\le E(X_n-a)^+-E(X_0-a)^+ .$$`,
      idea: String.raw`Bet $1$ from the first time the process is $\le a$ until it is next $\ge b$, repeat: $H_m\in\{0,1\}$ is predictable (it is defined through stopping times). Each completed upcrossing earns at least $b-a$. Apply the strategy to $Y_m=a+(X_m-a)^+$, a submartingale by 4.2.7, which has the same upcrossings; then $(b-a)U_n\le(H\cdot Y)_n$: an incomplete final bet also contributes nonnegatively because its purchase value in $Y$ is $a$. The complementary strategy $K=1-H$ has $E(K\cdot Y)_n\ge0$ by 4.2.8, hence $E(H\cdot Y)_n\le E(Y_n-Y_0)$.`,
      caption: String.raw`A $\pm1$ walk with up-probability $p\ge\tfrac12$ (a submartingale). Drag the two gold handles to place the band $[a,b]$; each completed upcrossing is highlighted and numbered. Right: $EU_n$ (blue) is computed by an exact finite-state probability recursion, alongside the exact bound $\big(E(X_n-a)^+-E(X_0-a)^+\big)/(b-a)$ (orange) for every $n$ (the bound is not tight, since it only uses the expected final positive part).`,
      deps: ['prob-4.2.7', 'prob-4.2.8'],
      refs: ['Durrett, Probability: Theory and Examples, 5th ed., Theorem 4.2.10, p. 221'],
      links: { source: 'https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=229' },
      tags: ['martingales'],
      viz(v) {
        const pS = v.slider('up-probability $p$', 0.5, 0.7, 0.52, { step: 0.01 });
        const nS = v.slider('horizon $n$', 20, 200, 120, { int: true });
        const NMAX = 200;
        const L = v.stage({ x: [0, NMAX], y: [-20, 20], axes: 'box', gutter: true, height: 340, xlabel: 'time $m$', title: 'a path and its upcrossings of $[a,b]$' });
        const R = v.stage({ x: [0, NMAX], y: [0, 10], axes: 'box', gutter: true, height: 340, xlabel: 'time $n$', title: '$EU_n$ against the bound', minWidth: 280 });
        const ha = L.handle(NMAX * 0.03, -2, { color: 'gold', r: 8, label: 'a', labelPos: 'e', constrain: (x, y) => [NMAX * 0.03, clampN(Math.round(y), -15, 13)] });
        const hb = L.handle(NMAX * 0.12, 3, { color: 'gold', r: 8, label: 'b', labelPos: 'e', constrain: (x, y) => [NMAX * 0.12, clampN(Math.round(y), -14, 14)] });
        const r = v.rng(8), U = []; for (let k = 0; k < 1; k++) { const u = new Float64Array(NMAX); for (let i = 0; i < NMAX; i++) u[i] = r(); U.push(u); }
        let st = null;
        v.render(() => {
          const p = pS.value, n = nS.value; let a = Math.round(ha.y), b = Math.round(hb.y); if (b <= a) b = a + 1; ha.set(NMAX * 0.03, a); hb.set(NMAX * 0.12, b);
          const paths = U.map((u) => { const q = new Float64Array(NMAX + 1); for (let i = 1; i <= NMAX; i++) q[i] = q[i - 1] + (u[i - 1] < p ? 1 : -1); return q; });
          const base = paths[0];
          const visible=Array.from(base.slice(0,n+1));L.setView([0,NMAX],[Math.min(a,...visible)-3,Math.max(b,...visible)+4]);
          L.hband(a, b, { color: 'gold', alpha: 0.12 }); L.hline(a, { color: 'orange', width: 1.4 }); L.hline(b, { color: 'orange', width: 1.4 });
          L.path(polyl(base.slice(0, n + 1)), { color: 'accent', width: 2 });
          let below = false, start = 0, cnt = 0;
          for (let i = 0; i <= n; i++) {
            if (!below) { if (base[i] <= a) { below = true; start = i; } } else if (base[i] >= b) { cnt++; below = false; L.path(polyl(base.slice(start, i + 1)).map(([j, y]) => [j + start, y]), { color: 'green', width: 4 }); L.text(String(cnt), i, base[i] + 1.8, { size: 12, color: 'green' }); }
          }
          const {EU, bound} = exactUpcrossingWalk(NMAX,p,a,b);
          const top = Math.max(1, ...bound) * 1.15; R.setView([0, NMAX], [0, top]);
          R.path(polyl(Array.from(bound)), { color: 'orange', width: 3 }); R.path(polyl(EU), { color: 'accent', width: 2.6 }); R.vline(n, { color: 'gold', dash: [4, 4] });
          const worst = Math.min(...bound.map((bb, i) => bb - EU[i]));
          st = { cnt, EU: EU[n], bd: bound[n], n, worst, a, b };
        });
        v.legend([['accent', '$EU_n$ (exact finite-state law)'], ['orange', 'bound $\\frac{E(X_n-a)^+-E(X_0-a)^+}{b-a}$'], ['green', 'upcrossing', {}]]);
        v.readout(() => st && `Band $[${st.a},${st.b}]$: this path has completed ${st.cnt} upcrossing${st.cnt === 1 ? '' : 's'} by time ${st.n}. Exact walk law: $EU_n=${fx(st.EU, 3)}\\le$ bound $${fx(st.bd, 3)}$. Smallest margin over all $n\\le${NMAX}$: $${fx(st.worst, 3)}$ (nonnegative up to floating-point roundoff).`);
      },
    },
    {
      num: '4.2.11',
      kind: 'Theorem',
      name: 'Martingale convergence theorem',
      statement: String.raw`If $X_n$ is a submartingale with $\sup_nEX_n^+<\infty$, then $X_n$ converges almost surely to a limit $X$ with $E|X|<\infty$.`,
      idea: String.raw`The upcrossing inequality (4.2.10) gives $EU_n\le(|a|+EX_n^+)/(b-a)$, so the total number $U$ of upcrossings of $[a,b]$ has finite mean and is finite a.s. If the limit did not exist, $\liminf X_n<a<b<\limsup X_n$ for some rational $a<b$, forcing infinitely many upcrossings; the countable union over rational pairs is null. Fatou's lemma (1.6.5) shows $EX^+<\infty$ and, via $EX_n^-=EX_n^+-EX_n\le EX_n^+-EX_0$, also $EX^-<\infty$. This is Doob's theorem.`,
      caption: String.raw`Fourteen seeded paths of four processes (log time axis). **Pólya urn** fraction (starts with one red and one black ball; a martingale in $[0,1]$), **random harmonic series** $\sum\pm1/k$ (an $L^2$-bounded martingale) and **products** of mean-one factors $\{\tfrac12,\tfrac32\}$ all settle down, each path to its own random limit (the product to $0$). The **simple random walk** has $\sup EX_n^+=\infty$, violates the hypothesis, and keeps oscillating. The readout counts, over 300 paths, the mean number of upcrossings of the gold band and the typical oscillation over $[n/2,n]$.`,
      deps: ['prob-4.2.10', 'prob-1.6.5'],
      see: ['stoch-12.9'],
      credit: 'Doob, c. 1940 (known as Doob’s martingale convergence theorem)',
      tags: ['martingales', 'convergence'],
      viz(v) {
        const PR = {
          polya: { l: 'Pólya urn fraction', band: [0.4, 0.6], y: [0, 1], fn: (r, N) => { let R = 1, B = 1; const q = [R / 2]; for (let n = 1; n <= N; n++) { if (r() < R / (R + B)) R++; else B++; q.push(R / (R + B)); } return q; } },
          series: { l: 'random series $\\sum\\pm1/k$', band: [-0.5, 0.5], y: [-3, 3], fn: (r, N) => { let x = 0; const q = [0]; for (let n = 1; n <= N; n++) { x += (r() < 0.5 ? 1 : -1) / n; q.push(x); } return q; } },
          prod: { l: 'product of mean-one factors', band: [0.5, 1.5], y: [0, 3], fn: (r, N) => { let x = 1; const q = [1]; for (let n = 1; n <= N; n++) { x *= r() < 0.5 ? 0.5 : 1.5; q.push(x); } return q; } },
          walk: { l: 'simple random walk (fails)', band: [-5, 5], y: [-80, 80], fn: (r, N) => { let x = 0; const q = [0]; for (let n = 1; n <= N; n++) { x += r() < 0.5 ? 1 : -1; q.push(x); } return q; } },
        };
        const pr = v.select('process', Object.entries(PR).map(([k, o]) => ({ value: k, label: o.l })), 'polya');
        const nS = v.slider('horizon $n$', 50, 4000, 1500, { log: true, int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const s = v.stage({ x: [1, 4000], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 380, xlabel: 'time $n$ (log scale)', title: 'sample paths' });
        let cache = null, st = null;
        v.render(() => {
          const P = PR[pr.value], N = nS.value, key = `${pr.value}|${seed}`;
          if (!cache || cache.key !== key) { const r = v.rng(seed * 101 + pr.value.length * 7); cache = { key, paths: Array.from({ length: 300 }, () => P.fn(r, 4000)) }; }
          const idx = logInts(1, N, 90);
          s.setView([1, Math.max(N, 60)], P.y);
          s.hband(P.band[0], P.band[1], { color: 'gold', alpha: 0.13 });
          cache.paths.slice(0, 14).forEach((q) => s.path(idx.map((i) => [i, q[i]]), { color: 'accent', width: 1.2, alpha: 0.75 }));
          let up = 0, osc = []; for (const q of cache.paths) { up += upcrossings(q, P.band[0], P.band[1], N); const sl = q.slice(Math.floor(N / 2), N + 1); osc.push(Math.max(...sl) - Math.min(...sl)); }
          osc.sort((a, b) => a - b);
          st = { up: up / cache.paths.length, osc: osc[Math.floor(osc.length / 2)], N };
        });
        v.readout(() => st && `Over 300 paths up to $n=${st.N}$: mean number of upcrossings of the gold band $=${fx(st.up, 2)}$, median oscillation (max − min) over $[n/2,n]$ $=${fx(st.osc, 3)}$. For the three convergent processes both stay bounded or shrink as $n$ grows; for the walk they keep growing.`);
      },
    },
    {
      num: '4.2.12',
      kind: 'Theorem',
      name: 'Nonnegative supermartingales converge',
      statement: String.raw`If $X_n\ge0$ is a supermartingale, then $X_n\to X$ almost surely as $n\to\infty$, and $EX\le EX_0$.`,
      idea: String.raw`$Y_n=-X_n\le0$ is a submartingale with $EY_n^+=0$, so the convergence theorem (4.2.11) applies and $X_n$ converges a.s. to a finite limit. Since $EX_n\le EX_0$ for a supermartingale, Fatou's lemma (1.6.5) gives $EX\le\liminf EX_n\le EX_0$. The inequality can be strict: the convergence need not hold in $L^1$.`,
      caption: String.raw`Products $X_n=Y_1\cdots Y_n$ of i.i.d. positive mean-one factors, a nonnegative martingale with $EX_n=1$ for every $n$ (log vertical axis). Thin curves are 30 seeded paths: they all sink to $0$. The orange curve is the exact median, which decays geometrically; the gold curve is the sample mean of 8000 paths, which should stay at $1$ (dashed) but, honestly, collapses for large $n$ because the mean is carried by rarer and rarer huge values. Raise the volatility to see the limit $X=0$ with $EX=0<1=EX_0$: Fatou's inequality is strict.`,
      deps: ['prob-4.2.11', 'prob-1.6.5'],
      tags: ['martingales', 'convergence'],
      viz(v) {
        const law = v.select('factor $Y$', [{ value: 'ln', label: 'lognormal, $EY=1$' }, { value: 'tp', label: 'two-point $1\\pm s$' }], 'ln');
        const sg = v.slider('volatility $\\sigma$ (or $s$)', 0.1, 0.9, 0.4, { step: 0.01 });
        const NN = 300, M = 8000;
        const s = v.stage({ x: [0, NN], y: [1e-8, 1e4], ylog: true, axes: 'box', gutter: true, height: 380, xlabel: 'time $n$', title: '$X_n$ on a log scale' });
        const r = v.rng(202), Z = []; for (let k = 0; k < M; k++) { const z = new Float64Array(NN); for (let i = 0; i < NN; i++) z[i] = r.normal(); Z.push(z); }
        let st = null, cache = null;
        v.render(() => {
          const sgm = sg.value, ln = law.value === 'ln', key = `${law.value}|${sgm}`;
          if (!cache || cache.key !== key) {
            const ym = (z) => (ln ? Math.exp(sgm * z - (sgm * sgm) / 2) : (z > 0 ? 1 + Math.min(sgm, 0.999) : 1 - Math.min(sgm, 0.999)));
            const sum = new Float64Array(NN + 1), paths = [], gt1 = new Float64Array(NN + 1);
            for (let k = 0; k < M; k++) { let x = 1; sum[0] += 1; gt1[0] += 0; const q = [1]; for (let n = 1; n <= NN; n++) { x *= ym(Z[k][n - 1]); sum[n] += x; if (x > 1) gt1[n]++; if (k < 30) q.push(x); } if (k < 30) paths.push(q); }
            cache = { key, sum, paths, gt1 };
          }
          s.hline(1, { color: 'ink', dash: [5, 4], width: 1.4 });
          cache.paths.forEach((q) => s.path(q.map((y, i) => [i, Math.max(y, 1e-9)]), { color: 'muted', width: 0.9, alpha: 0.55 }));
          const med = (n) => (ln ? Math.exp((-sgm * sgm * n) / 2) : Math.pow(1 - Math.min(sgm, 0.999) ** 2, n / 2));
          s.fn((n) => Math.max(med(n), 1e-9), { color: 'orange', width: 3, n: 300 });
          s.path(Array.from(cache.sum, (x, n) => [n, Math.max(x / M, 1e-9)]), { color: 'gold', width: 2.2 });
          const n = NN;
          st = { med: med(n), mean: cache.sum[n] / M, frac: cache.gt1[n] / M };
        });
        v.legend([['muted', 'sample paths'], ['orange', 'median'], ['gold', 'sample mean of 8000 paths'], ['ink', '$EX_n=1$', { dash: [5, 4] }]]);
        v.readout(() => st && `At $n=${NN}$: exact $EX_n=1$, sample mean $${fx(st.mean, 3)}$ (unreliable: rare huge values), median $${st.med < 1e-3 ? '\\approx' + '10^{' + Math.round(Math.log10(st.med)) + '}' : fx(st.med, 4)}$, fraction of paths above $1$: $${fx(st.frac, 4)}$. The a.s. limit is $X=0$, so $EX=0\\le1=EX_0$.`);
      },
    },
  ],
};
