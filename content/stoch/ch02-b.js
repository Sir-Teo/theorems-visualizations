// Stochastic Processes — Chapter 2 (part b): items 2.7–2.12
import { cumRows, nextState, pfmt, binom, solveLin } from './ch02.shared.js';

/** Simple random walk path S_0..S_L (S_0 = start) with steps ±1 (up with probability p). */
function walk(R, L, start = 0, p = 0.5) { const S = [start]; for (let i = 0; i < L; i++) S.push(S[i] + (R() < p ? 1 : -1)); return S; }

export default {
  collection: 'stoch',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7', kind: 'Definition', name: 'Stopping times',
      statement: String.raw`Let $(X_n)_{n\ge0}$ be a Markov chain (or any process) and let $\mathcal F_n=\sigma(X_0,\dots,X_n)$ record what has been seen by time $n$. A random time $T$ with values in $\{0,1,2,\dots\}\cup\{\infty\}$ is a **stopping time** if for every $n$ the event $\{T=n\}$ is determined by $(X_0,\dots,X_n)$, that is, $\{T=n\}\in\mathcal F_n$. Equivalently, the decision “stop now” never peeks at the future. Hitting times $H^A$ are stopping times; so are $\min(S,T)$, $\max(S,T)$ and $S+T$ for stopping times $S,T$ ($S+T$ when, as usual, $T$ is the second of two successive waiting periods). The last visit to a state, or the time before a hitting time, is not.`,
      idea: String.raw`To decide whether $\{T=n\}$ happens it must be enough to look at the path up to time $n$. For a hitting time, $\{H^A=n\}=\{X_0\notin A,\dots,X_{n-1}\notin A,X_n\in A\}$ is visibly a statement about $X_0,\dots,X_n$. For “the last visit to $0$ before time 20” the event $\{T=n\}$ also demands that the path avoid $0$ on $(n,20]$, which is information from the future, so it is not a stopping time. This distinction is exactly what the strong Markov property (2.8) needs: it holds at random times that are determined by the past.`,
      caption: String.raw`Pick a rule and a path (simple random walk). The gold line is the time $T$ the rule picks. Slide the observation time $n$: the bold part of the path is what has been seen, the thin continuations are 14 random futures, coloured green where the rule would fire exactly at $n$ and red where it would not. The bars at the right give, for every $n$, the fraction of 40 futures in which $T=n$ given the past: a stopping time always shows exactly 0 or 1; any value strictly in between (red) means the past was not enough to decide.`,
      deps: ['stoch-1.1'], refs: ['Norris §1.4'], tags: ['stopping times', 'filtration'],
      viz(v) {
        const H = 20, L = 30, INF = L + 1;
        const first = (S, f, from = 0) => { for (let n = from; n < S.length; n++) if (f(S, n)) return n; return INF; };
        const RULES = {
          first0: { label: 'first return to 0', T: (S) => first(S, (s, n) => s[n] === 0, 1), stop: true },
          hit3: { label: 'first visit to +3', T: (S) => first(S, (s, n) => s[n] === 3), stop: true },
          twoups: { label: 'two up-steps in a row', T: (S) => first(S, (s, n) => s[n] - s[n - 1] === 1 && s[n - 1] - s[n - 2] === 1, 2), stop: true },
          cap: { label: 'visit to +3, or time 12', T: (S) => Math.min(first(S, (s, n) => s[n] === 3), 12), stop: true },
          before3: { label: 'one step before +3', T: (S) => { const t = first(S, (s, n) => s[n] === 3); return t === INF ? INF : t - 1; }, stop: false },
          last0: { label: 'last visit to 0 by time 20', T: (S) => { for (let n = H; n >= 0; n--) if (S[n] === 0) return n; return INF; }, stop: false },
          maxt: { label: 'time of the maximum on [0,20]', T: (S) => { let b = 0; for (let n = 1; n <= H; n++) if (S[n] > S[b]) b = n; return b; }, stop: false },
        };
        const rule = v.select('rule', Object.entries(RULES).map(([value, r]) => ({ value, label: r.label })), 'before3', { onChange: () => recompute() });
        const nn = v.slider('observation time $n$', 0, H, 2, { int: true, step: 1 });
        let seed = 6; v.button('new path', () => { seed++; recompute(); });
        const s1 = v.stage({ x: [0, L], y: [-9, 9], axes: 'box', gutter: true, height: 340, xlabel: 'time', ylabel: '$S_n$', title: 'the past (bold) and possible futures' });
        const s2 = v.stage({ x: [-0.7, H + 0.7], y: [0, 1.15], axes: 'box', gutter: true, height: 340, xlabel: 'time $n$', ylabel: 'P($T=n$ | past)', title: 'is “stop now” decided by the past?' });
        let S, T, probs;
        const ext = (pre, R) => pre.concat(walk(R, L - pre.length + 1, pre[pre.length - 1]).slice(1));
        function recompute() {
          const R = v.rng(seed * 977 + 3); S = walk(R, L); const r = RULES[rule.value]; T = r.T(S);
          probs = [];
          for (let n = 0; n <= H; n++) { const Rf = v.rng(n * 31 + seed); let c = 0; const F = 40; for (let f = 0; f < F; f++) { if (r.T(ext(S.slice(0, n + 1), Rf)) === n) c++; } probs.push(c / F); }
          v.invalidate();
        }
        recompute();
        let info = {};
        v.render(() => {
          const r = RULES[rule.value], n = nn.value, pre = S.slice(0, n + 1);
          const Rf = v.rng(n * 131 + seed * 7);
          for (let f = 0; f < 14; f++) { const full = ext(pre, Rf), fire = r.T(full) === n; s1.path(full.slice(n).map((y, i) => [n + i, y]), { color: fire ? 'green' : 'red', width: 1.3, alpha: 0.6 }); }
          s1.path(pre.map((y, i) => [i, y]), { color: 'ink', width: 3 });
          s1.dot(n, S[n], { color: 'gold', r: 6 });
          s1.hline(0, { color: 'faint' });
          if (rule.value.includes('hit3') || rule.value === 'cap' || rule.value === 'before3') s1.hline(3, { color: 'faint', dash: true });
          if (T <= L) { s1.vline(T, { color: 'gold', width: 2, dash: true }); s1.tex(String.raw`T=${T}`, T + 0.3, 8, { color: 'gold', align: 'left' }); }
          s1.vline(H, { color: 'faint', alpha: 0.5 });
          probs.forEach((p, i) => { const dec = p < 1e-9 || p > 1 - 1e-9; s2.bars([p], { x0: i - 0.4, dx: 0.8, color: i === T ? 'gold' : dec ? 'green' : 'red' }); s2.dot(i, p, { color: dec ? 'green' : 'red', r: 4.5 }); });
          const bad = probs.filter((p) => p > 1e-9 && p < 1 - 1e-9).length;
          s2.hline(1, { color: 'faint', dash: true });
          info = { bad, atN: probs[n] };
        });
        v.legend([['green', 'decided (0 or 1)', { area: true }], ['red', 'depends on the future', { area: true }], ['gold', 'the actual $T$']]);
        v.readout(() => `Rule: **${RULES[rule.value].label}**. On this path $T=$ ${T <= L ? T : '“not within the horizon”'}. At time $n=${nn.value}$ the chance the rule fires now, given the past, is ${v.fix(info.atN, 3)}.\n${info.bad === 0 ? 'Every time $n$ has $\\Pr(T=n\\mid\\text{past})\\in\\{0,1\\}$: consistent with a **stopping time**.' : `At ${info.bad} of the times $0,\\dots,${H}$ the past does not decide whether $T=n$: this is **not** a stopping time.`}`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8', kind: 'Theorem', name: 'Strong Markov property',
      statement: String.raw`Let $(X_n)$ be a Markov chain with transition matrix $P$ and let $T$ be a stopping time. Then, conditional on $T<\infty$ and $X_T=i$, the process $(X_{T+n})_{n\ge0}$ is a Markov chain with transition matrix $P$ started at $i$, and it is independent of the pre-$T$ path $(X_0,\dots,X_T)$. In words: at a stopping time the chain starts afresh from its current state.`,
      idea: String.raw`For a fixed time $m$ this is the ordinary Markov property. For a stopping time, split according to the value of $T$: on $\{T=m\}$, which lies in $\mathcal F_m$ (2.7), the ordinary Markov property at time $m$ gives the claim for the event $\{T=m,X_m=i\}$, and summing over $m$ (a countable partition) yields the statement. The argument breaks exactly when $\{T=m\}$ depends on the future after $m$, because then conditioning on $T=m$ also conditions the future path.`,
      caption: String.raw`Simple random walk is cut at a rule's time $\tau$ and the futures $Y_k=X_{\tau+k}-X_\tau$ of 3000 paths are overlaid (60 are drawn; the gold curve is the mean). The histogram at lag $k$ (drag the slider) is compared with a *fresh* walk from 0, the binomial law (black dots). For the stopping time “first visit to $+3$” they agree to within sampling noise; for the last visit to $+3$ or the time just before the first visit, which are not stopping times, the futures are visibly different (try $k=1$ for the rule “one step before”, $k=2$ for the last visit).`,
      deps: ['stoch-2.7'], refs: ['Norris §1.4'], tags: ['strong Markov property', 'stopping times'],
      scope: String.raw`$T$ must be a stopping time; the statement fails for non-stopping times such as the last visit.`,
      viz(v) {
        const RULES = [{ value: 'hit', label: 'first visit to +3 (stopping)' }, { value: 'before', label: 'one step before it (not stopping)' }, { value: 'last', label: 'last visit to +3 before time 100 (not stopping)' }];
        const rule = v.select('cut at', RULES, 'hit', { onChange: () => build() });
        const kk = v.slider('lag $k$', 1, 30, 2, { int: true, step: 1 });
        let seed = 9; v.button('resample', () => { seed++; build(); });
        const s1 = v.stage({ x: [0, 30], y: [-14, 14], axes: 'box', gutter: true, height: 340, xlabel: 'time $k$ after the cut', ylabel: '$Y_k$', title: 'futures after the cut' });
        const s2 = v.stage({ x: [-14, 14], y: [0, 0.6], axes: 'box', gutter: true, height: 340, xlabel: '$Y_k$', ylabel: 'probability', title: 'law of $Y_k$ vs a fresh walk' });
        const K = 30, LT = 400, NP = 3000;
        let fut = [], used = 0, dropped = 0;
        function build() {
          const R = v.rng(seed * 6007 + 11); fut = []; dropped = 0;
          for (let g = 0; g < NP; g++) {
            const S = walk(R, LT); let tau = -1;
            const h = S.indexOf(3);
            if (rule.value === 'hit') tau = h;
            else if (rule.value === 'before') tau = h > 0 ? h - 1 : -1;
            else { for (let n = 100; n >= 0; n--) if (S[n] === 3) { tau = n; break; } }
            if (tau < 0 || tau + K > LT) { dropped++; continue; }
            fut.push(S.slice(tau, tau + K + 1).map((x) => x - S[tau]));
          }
          used = fut.length; v.invalidate();
        }
        build();
        let info = {};
        v.render(() => {
          const k = kk.value;
          for (let g = 0; g < 60; g++) s1.path(fut[g].map((y, i) => [i, y]), { color: 'accent', width: 1, alpha: 0.28 });
          const mean = Array.from({ length: K + 1 }, (_, i) => fut.reduce((a, f) => a + f[i], 0) / used);
          s1.path(mean.map((y, i) => [i, y]), { color: 'gold', width: 3 });
          s1.vline(k, { color: 'orange', width: 1.8 });
          const cnt = new Map(); fut.forEach((f) => cnt.set(f[k], (cnt.get(f[k]) || 0) + 1));
          let tv = 0;
          for (let j = -k; j <= k; j += 2) {
            const ex = binom(k, (k + j) / 2) / 2 ** k, em = (cnt.get(j) || 0) / used;
            s2.rect(j - 0.8, 0, j + 0.8, em, { fill: 'accent', fillAlpha: 0.5, color: 'accent' });
            s2.dot(j, ex, { color: 'ink', r: 5 }); tv += Math.abs(ex - em);
          }
          info = { tv: tv / 2, mean1: mean[1], mean: mean[k] };
          s2.setView([-Math.max(4, k + 1.5), Math.max(4, k + 1.5)], [0, Math.max(0.3, ...[...cnt.values()].map((c) => c / used)) * 1.15]);
        });
        v.legend([['accent', 'futures after the cut', { area: true }], ['ink', 'fresh walk from 0 (binomial)', { dot: true }], ['gold', 'mean of $Y_k$']]);
        v.readout(() => `${used} paths used (${dropped} dropped: no such time within the horizon). Total variation between the law of $Y_{${kk.value}}$ and a fresh walk: **${v.fix(info.tv, 3)}** (pure sampling noise is about ${v.fix(Math.sqrt(kk.value + 1) / Math.sqrt(used) * 0.8, 3)}).\n$\\Pr(Y_1=+1)=${v.fix(fut.filter((f) => f[1] === 1).length / used, 3)}$ (a fresh walk: 0.5).`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9', kind: 'Definition', name: 'Harmonic functions and the maximum principle',
      statement: String.raw`Let $P$ be the transition matrix of a chain on $S$ and $D\subset S$ a set of states (the boundary), $U=S\setminus D$ (the interior). A function $h:S\to\mathbb R$ is **harmonic** on $U$ if $h(x)=\sum_yp_{xy}h(y)$ for all $x\in U$, i.e. $h(x)$ equals the average of $h$ over one step of the chain. If the chain exits $U$ almost surely, then the **maximum principle** holds: $\min_Dh\le h(x)\le\max_Dh$ for all $x\in U$, and the harmonic function with boundary values $g$ is unique, namely $h(x)=\mathbb E_x\big[g(X_{\tau})\big]$ where $\tau=H^D$ is the exit time. In particular the probability of exiting through a boundary piece $B\subseteq D$ is the harmonic function with boundary values $\mathbf 1_B$.`,
      idea: String.raw`If $h$ is harmonic, then $h(X_{n\wedge\tau})$ is a bounded martingale-like sequence: $\mathbb E_x[h(X_{n\wedge\tau})]=h(x)$ for every $n$, by the Markov property and the harmonic equation. Letting $n\to\infty$ and using $\tau<\infty$ gives $h(x)=\mathbb E_x[g(X_\tau)]$, which is an average of boundary values and so lies between their minimum and maximum. Uniqueness follows because the difference of two harmonic functions with equal boundary values has zero boundary values and hence vanishes. This is the discrete Dirichlet problem, and it is also the equation $h=\mathbf 1_B+\mathbf 1_{D^c}Ph$ of 2.2.`,
      caption: String.raw`A random walk on a $13\times13$ grid exits through the boundary. Click boundary cells to switch their value between 0 (pale) and 1 (dark); click an interior cell to choose a starting point. The picture is $h$ after the chosen number of neighbour-averaging sweeps. Bars on the right: where 3000 simulated walkers from the start actually exit, so the sum over value-1 boundary cells matches $h$ at the start. Add a heat source and $h$ is no longer an average: the maximum principle fails and the interior exceeds the boundary.`,
      deps: ['stoch-2.2'], refs: ['LPW §9.2', 'Norris §4.2'], tags: ['harmonic functions', 'maximum principle'],
      viz(v) {
        const n = 13, GS = 2500;
        const bnd = []; for (let j = 1; j < n - 1; j++) bnd.push([0, j]); for (let i = 1; i < n - 1; i++) bnd.push([i, n - 1]); for (let j = n - 2; j >= 1; j--) bnd.push([n - 1, j]); for (let i = n - 2; i >= 1; i--) bnd.push([i, 0]);
        const bIndex = new Map(bnd.map(([i, j], k) => [i * n + j, k]));
        const PRE = {
          side: (k) => (k >= 2 * 11 + 11 ? 1 : 0), half: (k) => (k < 22 ? 1 : 0), blocks: (k) => (Math.floor(k / 6) % 2 ? 1 : 0), single: (k) => (k >= 5 && k <= 9 ? 1 : 0),
        };
        const pre = v.select('boundary values', [{ value: 'half', label: 'bottom and right' }, { value: 'blocks', label: 'alternating blocks' }, { value: 'single', label: 'one short arc' }], 'half', { onChange: () => { bval = bnd.map((_, k) => PRE[pre.value](k)); build(); } });
        const sweeps = v.slider('sweeps', 0, 400, 400, { int: true, step: 1 });
        const src = v.slider('heat source strength', 0, 6, 0, { step: 0.5, onChange: () => build() });
        const s1 = v.stage({ x: [-0.5, n - 0.5], y: [-0.5, n - 0.5], axes: false, equal: true, height: 400, title: 'the harmonic function $h$' });
        const s2 = v.stage({ x: [-1, 45], y: [0, 0.2], axes: 'box', gutter: true, height: 400, xlabel: 'boundary cell (going round the square)', ylabel: 'exit probability', title: 'where walkers from the start leave' });
        let bval = bnd.map((_, k) => PRE.half(k)), start = [6, 6], exact, simExit, simH, simSrc = [8, 3];
        const idx = (i, j) => i * n + j;
        function relax(count) {
          const h = new Float64Array(n * n);
          bnd.forEach(([i, j], k) => { h[idx(i, j)] = bval[k]; });
          const sg = src.value;
          for (let t = 0; t < count; t++) for (let i = 1; i < n - 1; i++) for (let j = 1; j < n - 1; j++) h[idx(i, j)] = (h[idx(i - 1, j)] + h[idx(i + 1, j)] + h[idx(i, j - 1)] + h[idx(i, j + 1)]) / 4 + (i === simSrc[0] && j === simSrc[1] ? sg / 4 : 0);
          return h;
        }
        function build() {
          exact = relax(GS);
          const R = v.rng(2024 + start[0] * 13 + start[1]), W = 3000; simExit = new Array(bnd.length).fill(0); let vis = 0;
          for (let w = 0; w < W; w++) {
            let i = start[0], j = start[1];
            for (;;) {
              if (i === simSrc[0] && j === simSrc[1]) vis++;
              const u = R(); if (u < 0.25) i--; else if (u < 0.5) i++; else if (u < 0.75) j--; else j++;
              if (i === 0 || j === 0 || i === n - 1 || j === n - 1) { simExit[bIndex.get(idx(i, j))]++; break; }
            }
          }
          simExit = simExit.map((c) => c / W);
          simH = simExit.reduce((a, p, k) => a + p * bval[k], 0) + (src.value / 4) * (vis / W);
          s2.setView([-1, bnd.length], [0, Math.max(0.05, ...simExit) * 1.2]);
          v.invalidate();
        }
        build();
        s1.onClick((x, y) => {
          const j = Math.round(x), i = Math.round(y); if (i < 0 || j < 0 || i >= n || j >= n) return;
          const b = bIndex.get(idx(i, j));
          if (b !== undefined) bval[b] = 1 - bval[b]; else if (i > 0 && j > 0 && i < n - 1 && j < n - 1) start = [i, j]; else return;
          build();
        });
        let info = {};
        v.render(() => {
          const h = relax(sweeps.value);
          let mxI = -Infinity, mnI = Infinity;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const b = bIndex.has(idx(i, j)), corner = (i === 0 || i === n - 1) && (j === 0 || j === n - 1);
            const val = h[idx(i, j)];
            if (!b && !corner) { mxI = Math.max(mxI, val); mnI = Math.min(mnI, val); }
            if (corner) { s1.rect(j - 0.5, i - 0.5, j + 0.5, i + 0.5, { fill: 'faint', fillAlpha: 0.15, stroke: false }); continue; }
            s1.rect(j - 0.5, i - 0.5, j + 0.5, i + 0.5, { fill: v.ramp(Math.max(0, Math.min(1, val / 1.0)), 'accent'), fillAlpha: 1, color: b ? (bval[bIndex.get(idx(i, j))] ? 'panel' : 'muted') : 'grid', width: b ? 1.5 : 0.6 });
          }
          s1.dot(start[1], start[0], { color: 'gold', r: 7 }); s1.text('start', start[1], start[0] + 0.85, { size: 11, color: 'ink', align: 'center' });
          if (src.value > 0) s1.dot(simSrc[1], simSrc[0], { color: 'red', r: 5, hollow: true });
          simExit.forEach((p, k) => s2.rect(k - 0.4, 0, k + 0.4, p, { fill: bval[k] ? 'accent' : 'muted', fillAlpha: bval[k] ? 0.7 : 0.4, color: bval[k] ? 'accent' : 'muted' }));
          const bmax = Math.max(...bval), bmin = Math.min(...bval);
          info = { mxI, mnI, bmax, bmin, hx: h[idx(...start)], ex: exact[idx(...start)] };
        });
        v.legend([['accent', 'boundary value 1 / exit through it', { area: true }], ['muted', 'boundary value 0', { area: true }], ['gold', 'start of the walkers', { dot: true }]]);
        v.readout(() => `Interior values lie in $[${v.fix(info.mnI, 3)},\\,${v.fix(info.mxI, 3)}]$, boundary values in $[${info.bmin},${info.bmax}]$: ${info.mxI <= info.bmax + 1e-9 && info.mnI >= info.bmin - 1e-9 ? 'maximum principle holds.' : '**maximum principle violated** (the source adds heat inside).'}\nAt the start: $h=${v.fix(info.hx, 4)}$ after ${sweeps.value} sweeps (limit ${v.fix(info.ex, 4)}); simulated ${src.value ? '$\\mathbb E[g(X_\\tau)]+\\tfrac{\\sigma}{4}\\mathbb E[\\text{visits to the source}]$' : 'exit probability through the dark arcs'} $=${v.fix(simH, 4)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10', kind: 'Theorem', name: 'Reflection principle and ballot theorem for random walk',
      statement: String.raw`Let $(S_m)$ be simple symmetric random walk. **Reflection principle:** for integers $a,b>0$, the number of paths from $(0,a)$ to $(n,b)$ that touch the level $0$ equals the number of paths from $(0,-a)$ to $(n,b)$, namely $\binom{n}{(n+a+b)/2}$. Hence the probability that a walk starting at $a>0$ and ending at $b>0$ has touched $0$ is $\binom{n}{(n+a+b)/2}\big/\binom{n}{(n+b-a)/2}$. **Ballot theorem:** if candidate A receives $p$ votes and B receives $q<p$ votes, the probability that A is strictly ahead throughout the count (in a uniformly random ordering of the ballots) equals $\dfrac{p-q}{p+q}$; equivalently, a walk of $n$ steps from $0$ to $k>0$ stays strictly positive after time 0 with probability $k/n$.`,
      idea: String.raw`Cut a path that touches $0$ at its first touching time $\tau$ (a stopping time, 2.7) and reflect the part before $\tau$ in the axis $y=0$: this is a bijection onto the paths from $-a$ to $b$, since every such path must cross $0$ and one reflects it back at the first crossing. The ballot count follows: paths from $(1,1)$ to $(n,k)$ that touch $0$ correspond to paths from $(1,-1)$ to $(n,k)$, so good paths number $\binom{n-1}{p-1}-\binom{n-1}{p}=\frac{p-q}{p+q}\binom{n}{p}$. This is André's reflection principle and Bertrand's ballot theorem, proved combinatorially in comb-5.2 and comb-5.6.`,
      caption: String.raw`**Reflection:** a sample of random paths from $a$ to $b$ (chosen uniformly among all of them); the ones that touch 0 are red, and with "show reflections" on, each is replaced by its dashed twin that begins at $-a$. The right panel is the running fraction of touching paths in 4000 samples against the exact ratio of binomials. **Ballot:** green paths stay positive; the running fraction approaches $(p-q)/(p+q)$.`,
      deps: ['comb-5.2', 'comb-5.6', 'stoch-2.7'], refs: ['Grimmett–Stirzaker §3.10', 'LPW §2.7'], tags: ['reflection principle', 'ballot theorem'],
      credit: 'D. André, 1887; J. Bertrand, 1887',
      viz(v) {
        let fixing = false;
        const mode = v.select('theorem', [{ value: 'refl', label: 'reflection principle' }, { value: 'ballot', label: 'ballot theorem' }], 'refl', { onChange: () => { sync(); resim(); } });
        const n = v.slider('steps $n$', 4, 40, 20, { int: true, step: 1, onChange: () => resim() });
        const a = v.slider('start $a$', 1, 8, 3, { int: true, step: 1, onChange: () => resim() });
        const b = v.slider('end $b$', 1, 12, 2, { int: true, step: 1, onChange: () => { if (!fixing) resim(); } });
        const pv = v.slider('votes for A, $p$', 2, 30, 14, { int: true, step: 1, onChange: () => { if (qv.value >= pv.value) qv.set(pv.value - 1); resim(); } });
        const qv = v.slider('votes for B, $q$', 0, 29, 8, { int: true, step: 1, onChange: () => { if (qv.value >= pv.value) pv.set(qv.value + 1); resim(); } });
        const refl = v.toggle('show reflections', true);
        let seed = 2; v.button('new sample', () => { seed++; resim(); });
        function sync() { [n, a, b].forEach((c) => { c.el.hidden = mode.value !== 'refl'; }); [pv, qv].forEach((c) => { c.el.hidden = mode.value !== 'ballot'; }); refl.el.hidden = mode.value !== 'refl'; }
        const s1 = v.stage({ x: [0, 20], y: [-8, 12], axes: 'box', gutter: true, height: 340, xlabel: 'step $m$', ylabel: '$S_m$', title: '40 random paths with the same endpoints' });
        const s2 = v.stage({ x: [0, 4000], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'number of sampled paths', ylabel: 'fraction', title: 'running fraction vs exact' });
        let N, A, B, U, paths, run, exact, counts;
        function resim() {
          if (mode.value === 'refl') {
            N = n.value; A = a.value; B = Math.min(b.value, A + N); if ((N + B - A) % 2 !== 0) B += 1; U = (N + B - A) / 2;
            if (B !== b.value) { fixing = true; b.set(B); fixing = false; }
          } else { N = pv.value + qv.value; A = 0; B = pv.value - qv.value; U = pv.value; }
          const R = v.rng(seed * 331 + N * 7 + A);
          const base = Array.from({ length: N }, (_, i) => (i < U ? 1 : -1));
          const sample = () => { const s = R.shuffle(base), S = [A]; for (let i = 0; i < N; i++) S.push(S[i] + s[i]); return S; };
          const hit = (S) => (mode.value === 'refl' ? S.some((x) => x <= 0) : S.slice(1).some((x) => x <= 0));
          paths = Array.from({ length: 40 }, sample).map((S) => ({ S, hit: hit(S) }));
          let c = 0; run = [];
          for (let t = 1; t <= 4000; t++) { if (hit(sample())) c++; if (t % 20 === 0 || t < 20) run.push([t, c / t]); }
          if (mode.value === 'refl') { counts = { total: binom(N, U), touch: binom(N, (N + A + B) / 2) }; exact = counts.touch / counts.total; }
          else { exact = 1 - (pv.value - qv.value) / (pv.value + qv.value); counts = { total: binom(N, U), good: ((pv.value - qv.value) * binom(N, U)) / N }; }
          s1.setView([0, N], [Math.min(-A - 1, -3, ...paths.map((p) => Math.min(...p.S))) - 1, Math.max(B + 2, ...paths.map((p) => Math.max(...p.S))) + 1]);
          s2.setTitle(mode.value === 'refl' ? 'fraction of paths touching 0' : 'fraction of orderings where A is not always ahead');
          v.invalidate();
        }
        sync(); resim();
        v.render(() => {
          s1.hline(0, { color: 'red', width: 2 });
          paths.forEach(({ S, hit }) => {
            const tau = S.findIndex((x, i) => (mode.value === 'refl' ? x <= 0 : i > 0 && x <= 0));
            s1.path(S.map((y, i) => [i, y]), { color: hit ? 'red' : mode.value === 'refl' ? 'accent' : 'green', width: 1.4, alpha: hit ? 0.7 : 0.5 });
            if (hit && mode.value === 'refl' && refl.value) {
              s1.path(S.map((y, i) => [i, i <= tau ? -y : y]), { color: 'orange', width: 1.4, dash: true, alpha: 0.8 });
              s1.dot(tau, 0, { color: 'red', r: 3.5 });
            }
          });
          s1.dot(0, A, { color: 'gold', r: 6 }); if (mode.value === 'refl' && refl.value) s1.dot(0, -A, { color: 'orange', r: 6 });
          s1.dot(N, B, { color: 'gold', r: 6 });
          s2.path(run, { color: 'accent', width: 2 });
          s2.hline(exact, { color: 'green', width: 2.2, dash: true });
        });
        v.legend([['red', 'touches 0 (original)'], ['orange', 'reflected path', { dash: true }], ['accent', 'avoids 0'], ['green', 'exact value', { dash: true }]]);
        v.readout(() => {
          const last = run[run.length - 1][1];
          return mode.value === 'refl'
            ? `Paths from $${A}$ to $${B}$ in $${N}$ steps: $\\binom{${N}}{${U}}=${counts.total}$. Touching 0: $\\binom{${N}}{${(N + A + B) / 2}}=${counts.touch}$ (the paths from $-${A}$ to $${B}$). Exact $\\Pr=${v.fix(exact, 4)}$; simulated **${v.fix(last, 4)}**; in the 40 shown: ${paths.filter((p) => p.hit).length}.`
            : `$p=${pv.value}$ for A, $q=${qv.value}$ for B, $n=${N}$. Exact $\\Pr(\\text{A always strictly ahead})=\\frac{p-q}{p+q}=${v.fix(1 - exact, 4)}$; simulated **${v.fix(1 - last, 4)}**. Of the $\\binom{${N}}{${pv.value}}=${counts.total}$ orderings, ${Math.round(counts.good)} are good.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11', kind: 'Theorem', name: 'Hitting-time theorem for random walks',
      statement: String.raw`Let $S_n=\xi_1+\dots+\xi_n$ be a random walk whose steps are i.i.d. integers with $\xi_i\le 1$ (it can only go up by one at a time). For $k\ge1$ let $T_k=\inf\{n:S_n=k\}$ be the first time it reaches level $k$. Then for all $n\ge1$
$$\Pr(T_k=n)=\frac kn\,\Pr(S_n=k).$$
For simple symmetric random walk this gives $\Pr(T_k=n)=\frac kn\binom{n}{(n+k)/2}2^{-n}\sim \dfrac{2k}{\sqrt{2\pi}}\,n^{-3/2}$ for $n\equiv k\pmod 2$ (and $0$ otherwise), so the hitting time is almost surely finite but has infinite mean.`,
      idea: String.raw`Reverse the time order of the first $n$ steps and use the cycle lemma (comb-5.5): among the $n$ cyclic rotations of any sequence of steps with sum $k$ that are at most $+1$, exactly $k$ rotations have the property that the partial sums stay below $k$ until the very last step, i.e. first reach $k$ at time $n$. Since the steps are exchangeable, all rotations are equally likely, so $\Pr(T_k=n)=\Pr(S_n=k)\cdot\frac kn$. The reflection count of 2.10 is the special case of simple walk. The $n^{-3/2}$ tail follows from the local central limit theorem for $\Pr(S_n=k)\approx\sqrt{2/(\pi n)}$.`,
      caption: String.raw`Pick a walk whose steps never exceed $+1$ and a level $k$. Bars: histogram of the first-passage time of 30000 simulated walks; black dots: $\frac kn\Pr(S_n=k)$, computed by convolution (exact). The right panel plots the exact law on log–log axes against the $n^{-3/2}$ law $k/(\sigma\sqrt{2\pi})\,n^{-3/2}$ (gold; doubled for the ±1 walk, which only visits every other time): straight for the symmetric walks, while a bias towards $-1$ makes the tail collapse exponentially.`,
      scope: String.raw`Steps i.i.d., integer valued and bounded above by $+1$ ("skip-free to the right"); the walk may have any drift.`,
      deps: ['stoch-2.10', 'comb-5.5'], refs: ['Grimmett–Stirzaker §3.10'], tags: ['hitting times', 'cycle lemma'],
      credit: 'Kemperman 1961; Otter 1949',
      viz(v) {
        const walkSel = v.select('steps', [{ value: 'simple', label: '±1' }, { value: 'lazy', label: '+1, 0, −1 (¼, ½, ¼)' }, { value: 'poisson', label: '1 − Poisson(1)' }], 'simple', { onChange: () => rebuild() });
        const pU = v.slider('P(up) for ±1 walk', 0.3, 0.7, 0.5, { step: 0.05, onChange: () => rebuild() });
        const k = v.slider('level $k$', 1, 8, 2, { int: true, step: 1, onChange: () => resim() });
        const nsel = v.slider('look at time $n$', 1, 60, 10, { int: true, step: 1 });
        const s1 = v.stage({ x: [0, 40], y: [0, 0.4], axes: 'box', gutter: true, height: 340, xlabel: 'time $n$', ylabel: '$\\Pr(T_k=n)$', title: 'first-passage time to level $k$' });
        const s2 = v.stage({ x: [1, 120], y: [1e-8, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'time $n$', ylabel: '$\\Pr(T_k=n)$', title: 'the tail, log–log' });
        const NH = 120;
        let steps, Pn, sim, hh;
        function stepDist() {
          if (walkSel.value === 'simple') return [[1, pU.value], [-1, 1 - pU.value]];
          if (walkSel.value === 'lazy') return [[1, 0.25], [0, 0.5], [-1, 0.25]];
          const w = []; let f = 1, Z = 0; for (let x = 0; x <= 5; x++) { if (x) f /= x; w.push([1 - x, Math.exp(-1) * f]); Z += Math.exp(-1) * f; } return w.map(([s, p]) => [s, p / Z]);
        }
        function rebuild() {
          steps = stepDist(); pU.el.hidden = walkSel.value !== 'simple';
          const minS = Math.min(...steps.map((s) => s[0])), off = -minS * NH, W = off + NH + 2;
          let cur = new Float64Array(W); cur[off] = 1; Pn = [cur];
          for (let t = 1; t <= NH; t++) { const nx = new Float64Array(W); for (let x = 0; x < W; x++) if (cur[x]) for (const [s, p] of steps) { const y = x + s; if (y >= 0 && y < W) nx[y] += cur[x] * p; } Pn.push(nx); cur = nx; }
          Pn.off = off; resim();
        }
        const pS = (nn, kk) => Pn[nn][Pn.off + kk] || 0;
        function resim() {
          const R = v.rng(77), C = cumRows([steps.map((s) => s[1])])[0], W = 30000; hh = new Array(NH + 1).fill(0);
          for (let w = 0; w < W; w++) { let x = 0; for (let t = 1; t <= NH; t++) { const u = R(); let j = 0; while (j < C.length - 1 && u >= C[j]) j++; x += steps[j][0]; if (x === k.value) { hh[t]++; break; } } }
          sim = hh.map((c) => c / W);
          v.invalidate();
        }
        rebuild();
        let info = {};
        v.render(() => {
          const kk = k.value, ex = (nn) => (nn >= kk ? (kk / nn) * pS(nn, kk) : 0);
          const top = Math.max(0.05, ...Array.from({ length: 41 }, (_, i) => ex(i))) * 1.25; s1.setView([0, 40], [0, top]);
          for (let nn = 1; nn <= 40; nn++) s1.rect(nn - 0.4, 0, nn + 0.4, sim[nn], { fill: 'accent', fillAlpha: 0.5, color: 'accent' });
          for (let nn = kk; nn <= 40; nn++) s1.dot(nn, ex(nn), { color: 'ink', r: 4 });
          s1.vline(nsel.value, { color: 'gold', width: 1.8 });
          const pts = []; let mn = 1; for (let nn = kk; nn <= NH; nn++) { const e = ex(nn); if (e > 1e-12) { pts.push([nn, e]); mn = Math.min(mn, e); } }
          s2.setView([1, NH], [Math.max(1e-10, mn / 3), 1]);
          s2.path(pts, { color: 'ink', width: 2 });
          const sg2 = steps.reduce((a, [s, p]) => a + s * s * p, 0) - (steps.reduce((a, [s, p]) => a + s * p, 0)) ** 2, c = (walkSel.value === 'simple' ? 2 : 1) * kk / Math.sqrt(2 * Math.PI * sg2); s2.path(Array.from({ length: NH }, (_, i) => [i + 1, c * (i + 1) ** -1.5]), { color: 'gold', width: 2, dash: true });
          s2.dot(nsel.value, Math.max(1e-10, ex(nsel.value)), { color: 'gold', r: 5 });
          let mx = 0, tot = 0; for (let nn = kk; nn <= NH; nn++) { mx = Math.max(mx, Math.abs(sim[nn] - ex(nn))); tot += ex(nn); }
          info = { mx, tot, mean: steps.reduce((a, [s, p]) => a + s * p, 0) };
        });
        v.legend([['accent', 'simulated first-passage', { area: true }], ['ink', '$\\frac kn\\Pr(S_n=k)$', { dot: true }], ['gold', '$k\\,n^{-3/2}/(\\sigma\\sqrt{2\\pi})$ (×2 for ±1)', { dash: true }]]);
        v.readout(() => { const nn = nsel.value, kk = k.value; return `Drift per step $${v.fix(info.mean, 3)}$. At $n=${nn}$: $\\Pr(S_n=k)=${v.fix(pS(nn, kk), 5)}$, times $k/n=${v.fix(kk / nn, 4)}$ gives **${v.fix((kk / nn) * pS(nn, kk), 5)}**; simulated ${v.fix(sim[nn], 5)}.\nLargest gap simulation vs formula over $n\\le${NH}$: ${v.fix(info.mx, 4)}. Total mass reached by time ${NH}: ${v.fix(info.tot, 4)}.`; });
      },
    },

    // ───────────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12', kind: 'Theorem', name: 'Arcsine laws for simple random walk',
      statement: String.raw`Let $S$ be simple symmetric random walk and $u_{2m}=\Pr(S_{2m}=0)=\binom{2m}{m}2^{-2m}$. Over $2n$ steps, let $L_{2n}$ be the time of the last visit to $0$, and let $P_{2n}$ be the number of steps in which the walk is on the positive side (a step from $S_{m-1}$ to $S_m$ counts when $S_{m-1}+S_m>0$). Then for $k=0,\dots,n$
$$\Pr(L_{2n}=2k)=\Pr(P_{2n}=2k)=u_{2k}\,u_{2n-2k}.$$
Consequently, as $n\to\infty$, both $L_{2n}/2n$ and $P_{2n}/2n$ converge in distribution to the **arcsine law** with density $\dfrac{1}{\pi\sqrt{x(1-x)}}$ on $(0,1)$, with $\Pr(\text{limit}\le x)=\frac2\pi\arcsin\sqrt x$.`,
      idea: String.raw`The probability that the last zero before $2n$ is at $2k$ is $u_{2k}$ (be at $0$ at time $2k$) times the probability of $2n-2k$ steps without returning to $0$, which equals $u_{2n-2k}$ by the reflection-principle count of 2.10. The equality for the occupation time is proved by induction on $n$ using a first-return decomposition. Stirling's formula $u_{2m}\sim1/\sqrt{\pi m}$ gives $u_{2k}u_{2n-2k}\sim\frac1{\pi n\sqrt{x(1-x)}}$ with $x=k/n$. The density has its minimum at $x=\frac12$: a long fair game is much more likely to be dominated by one side than to be balanced.`,
      caption: String.raw`Bars: the simulated distribution of the chosen statistic over 20000 walks of $2n$ steps; black dots: the exact values $u_{2k}u_{2n-2k}$; the gold curve is the arcsine density. Turn on the dashed bell curve to see the "intuitive" guess of an even split, which the data contradict: the most likely outcomes are the extremes. The six sample walks above show a coloured positive stretch (blue) and negative stretch (red): one colour usually owns almost the whole walk.`,
      deps: ['stoch-2.10'], refs: ['Grimmett–Stirzaker §3.10'], tags: ['arcsine law', 'random walk'],
      credit: 'P. Lévy, 1939; W. Feller (discrete form)',
      viz(v) {
        const nSl = v.slider('half-length $n$ (walk has $2n$ steps)', 4, 60, 30, { int: true, step: 1, onChange: () => build() });
        const stat = v.select('statistic', [{ value: 'pos', label: 'time spent positive' }, { value: 'zero', label: 'time of last zero' }], 'pos');
        const bell = v.toggle('compare with an even-split guess', false);
        let seed = 4; v.button('resample', () => { seed++; build(); });
        const s0 = v.stage({ x: [0, 120], y: [-14, 14], axes: 'box', gutter: true, height: 260, xlabel: 'step', ylabel: '$S_m$', title: 'six sample walks', full: true });
        const s1 = v.stage({ x: [-0.02, 1.02], y: [0, 3.5], axes: 'box', gutter: true, height: 340, xlabel: 'fraction of the $2n$ steps', ylabel: 'density', title: 'distribution over 20000 walks', full: true });
        const NW = 20000;
        let hp, hz, samples;
        const u = (m) => binom(2 * m, m) / 4 ** m;
        function build() {
          const n = nSl.value, N = 2 * n, R = v.rng(seed * 8191 + n);
          hp = new Array(n + 1).fill(0); hz = new Array(n + 1).fill(0); samples = [];
          for (let w = 0; w < NW; w++) {
            let x = 0, pos = 0, lz = 0; const tr = [0];
            for (let m = 1; m <= N; m++) { const y = x + (R() < 0.5 ? 1 : -1); if (x + y > 0) pos++; x = y; if (x === 0) lz = m; if (w < 6) tr.push(x); }
            hp[pos / 2]++; hz[lz / 2]++; if (w < 6) samples.push(tr);
          }
          s0.setView([0, N], [-Math.max(8, ...samples.map((t) => Math.max(...t.map(Math.abs)))) - 1, Math.max(8, ...samples.map((t) => Math.max(...t.map(Math.abs)))) + 1]);
          v.invalidate();
        }
        build();
        let info = {};
        v.render(() => {
          const n = nSl.value, h = stat.value === 'pos' ? hp : hz;
          samples.forEach((tr, i) => {
            for (let m = 1; m < tr.length; m++) s0.line(m - 1, tr[m - 1] + (i - 2.5) * 0.0, m, tr[m], { color: tr[m - 1] + tr[m] > 0 ? 'accent' : tr[m - 1] + tr[m] < 0 ? 'red' : 'faint', width: 1.2, alpha: 0.55 });
          });
          s0.hline(0, { color: 'faint' });
          s1.bars(h.map((c) => (c / NW) * n), { x0: 0, dx: 1 / n, color: 'accent' });
          for (let k = 0; k <= n; k++) s1.dot(k / n, u(k) * u(n - k) * n, { color: 'ink', r: 3.5 });
          s1.fn((x) => 1 / (Math.PI * Math.sqrt(x * (1 - x))), { domain: [0.004, 0.996], color: 'gold', width: 2.2 });
          if (bell.value) s1.fn((x) => Math.exp(-((x - 0.5) ** 2) / (2 * 0.125)) / Math.sqrt(2 * Math.PI * 0.125), { color: 'red', width: 2, dash: true });
          let mid = 0, midEx = 0, ends = 0;
          for (let k = 0; k <= n; k++) { const x = k / n; if (x >= 0.4 - 1e-9 && x <= 0.6 + 1e-9) { mid += h[k] / NW; midEx += u(k) * u(n - k); } if (x <= 0.1 || x >= 0.9) ends += h[k] / NW; }
          info = { mid, midEx, ends, n };
        });
        v.legend([['accent', 'simulated', { area: true }], ['ink', 'exact $u_{2k}u_{2n-2k}$', { dot: true }], ['gold', 'arcsine density'], ['red', 'even-split guess', { dash: true }]]);
        v.readout(() => `$2n=${2 * nSl.value}$ steps. Share of walks with the statistic in $[0.4,0.6]\\cdot 2n$ (bins centred on $k/n$): simulated **${v.fix(info.mid, 3)}**, exact ${v.fix(info.midEx, 3)}, arcsine integral over the same window $=${v.fix((2 / Math.PI) * (Math.asin(Math.sqrt(Math.min(1, 0.6 + 0.5 / nSl.value))) - Math.asin(Math.sqrt(0.4 - 0.5 / nSl.value))), 3)}$.\nShare in the outer tenths ($\\le0.1$ or $\\ge0.9$): **${v.fix(info.ends, 3)}**; a uniform law would give 0.2.`);
      },
    },
  ],
};
