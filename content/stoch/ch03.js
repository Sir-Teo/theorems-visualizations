// Stochastic Processes — Chapter 3: Recurrence, transience and branching (items 3.1–3.8; 3.9–3.13 in ch03-b.js)
import { cumRows, nextState, pfmt, edgesOf, STATE_COL, hitProb, leakChain, LEAK_POS, returnProbs, pathOf, uSeq, returnedBy, POLYA_P } from './ch03.shared.js';

/** Graph-kit node specs for the six-state leak chain. */
const leakNodes = () => LEAK_POS.map(([x, y], i) => ({ id: i, label: String(i), x, y, notePos: i === 5 ? 's' : i < 3 ? (i === 1 ? 'n' : 's') : i === 4 ? 'e' : 's' }));
const recolor = (rho, i) => (rho[i] > 1 - 1e-9 ? 'green' : 'red');

export default {
  collection: 'stoch',
  chapter: 3,
  title: 'Recurrence, transience and branching',
  summary: String.raw`A state is recurrent if the chain returns to it for sure and transient otherwise, and summing return probabilities decides which. Recurrence is shared by a whole class and is automatic in finite closed classes. Pólya’s theorem settles simple random walk — recurrent in one and two dimensions, transient in three — and returning for sure need not mean returning quickly. Branching processes, whose extinction probability is a fixed point of a generating function, give a second family of examples.`,
  items: [
    // ───────────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1', kind: 'Definition', name: 'Recurrent and transient states',
      statement: String.raw`Let $(X_n)$ be a Markov chain and $i$ a state, and let $T_i=\inf\{n\ge 1: X_n=i\}$ be the first *return* time to $i$ (infinite if there is none). The state $i$ is **recurrent** if $\Pr_i(T_i<\infty)=1$ and **transient** if $\Pr_i(T_i<\infty)<1$. Equivalently, $\Pr_i(X_n=i \text{ for infinitely many } n)=1$ for recurrent $i$ and $=0$ for transient $i$: the strong Markov property (2.8) restarts the chain at each return, so the number of visits is either almost surely infinite or finite with a geometric law.`,
      idea: String.raw`Write $\rho_i=\Pr_i(T_i<\infty)$. Each time the chain is back at $i$ it starts afresh (strong Markov property, 2.8), so the number of returns is the number of successes before the first failure in a sequence of independent trials with success probability $\rho_i$. If $\rho_i=1$ the failure never comes and $i$ is visited infinitely often; if $\rho_i<1$ the number of returns is geometric and finite. There is no middle ground. The exact $\rho_i$ comes from first-step analysis: $\rho_i=\sum_j p_{ij}h_j$, where $h_j$ is the probability of ever hitting $i$ from $j$ (2.2).`,
      caption: String.raw`A six-state chain: the class $\{0,1,2\}$ leaks into the closed class $\{3,4\}$ from state 2 with probability $\lambda$, and state 5 only feeds into it. Left: states are green (recurrent) or red (transient). Middle: bars are the fraction of simulated excursions from each state that came back within 400 steps; black dots are the exact $\rho_i$. Right: visits so far along one long run started at state 5. Set $\lambda=0$ and the class $\{0,1,2\}$ turns from transient to recurrent: its counters keep climbing, whereas transient states stop counting for good.`,
      deps: ['stoch-2.8'], refs: ['Norris §1.5'], tags: ['recurrence', 'transience'],
      viz(v) {
        const lam = v.slider('leak $\\lambda$ from state 2', 0, 0.5, 0.2, { step: 0.01, onChange: () => rebuild() });
        const Nex = v.slider('excursions per state', 100, 4000, 800, { log: true, int: true, onChange: () => rebuild() });
        let seed = 5; v.button('resample', () => { seed++; rebuild(); });
        const s1 = v.stage({ x: [-1.4, 11.2], y: [-0.3, 6.6], axes: false, equal: true, height: 300, title: 'the chain' });
        const s2 = v.stage({ x: [-0.7, 5.7], y: [0, 1.1], axes: 'box', gutter: true, height: 300, xlabel: 'state $i$', ylabel: 'return probability', title: 'excursions that came back' });
        const s3 = v.stage({ x: [0, 4000], y: [0.8, 5000], ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'time $n$', ylabel: 'visits up to time $n$', title: 'one long run from state 5 (log scale)' });
        const G = v.graph(s1, { directed: true, layout: 'none', draggable: false, r: 16, nodes: leakNodes(), edges: [] });
        let P, rho, est, counts, tops;
        function rebuild() {
          P = leakChain(lam.value); rho = returnProbs(P);
          G.set({ directed: true, layout: 'none', draggable: false, r: 16, nodes: leakNodes(), edges: edgesOf(P) });
          const R = v.rng(seed * 17 + 3), C = cumRows(P);
          est = P.map((_, i) => {
            let back = 0;
            for (let e = 0; e < Nex.value; e++) { let x = nextState(C, i, R()), t = 1; while (x !== i && t < 400) { x = nextState(C, x, R()); t++; } if (x === i) back++; }
            return back / Nex.value;
          });
          const T = 4000, path = pathOf(P, R, 5, T), c = new Array(6).fill(0); counts = P.map(() => []);
          for (let t = 1; t <= T; t++) { c[path[t]]++; if (t % 20 === 0 || t < 20) c.forEach((k, i) => counts[i].push([t, k])); }
          tops = Math.max(10, ...c) * 1.6; s3.setView([0, T], [0.8, tops]);
          v.invalidate();
        }
        rebuild();
        v.render(() => {
          G.draw({
            nodeColor: (id) => recolor(rho, id), nodeFill: null,
            nodeNote: (id) => `ρ=${v.fix(rho[id], 2)}`, noteColor: (id) => recolor(rho, id),
            edgeWidth: (e) => 1 + 4 * e.w, edgeLabel: (e) => pfmt(e.w),
          });
          s2.bars(est, { x0: 0, dx: 1, color: (x, i) => recolor(rho, i) });
          rho.forEach((r, i) => s2.dot(i, r, { color: 'ink', r: 5 }));
          s2.hline(1, { color: 'faint', dash: true });
          counts.forEach((pts, i) => {
            const pp = pts.filter((q) => q[1] > 0); if (!pp.length) return;
            s3.path(pp, { color: recolor(rho, i), width: 2 });
            const last = pp[pp.length - 1]; s3.text(String(i), last[0], last[1], { color: recolor(rho, i), dx: 8, baseline: 'middle', size: 13 });
          });
        });
        v.legend([['green', 'recurrent ($\\rho=1$)', { area: true }], ['red', 'transient ($\\rho<1$)', { area: true }], ['ink', 'exact $\\rho_i$', { dot: true }]]);
        v.readout(() => {
          const rec = rho.map((r, i) => (r > 1 - 1e-9 ? i : -1)).filter((i) => i >= 0), tr = rho.map((r, i) => (r <= 1 - 1e-9 ? i : -1)).filter((i) => i >= 0);
          const gap = Math.max(...rho.map((r, i) => Math.abs(r - est[i])));
          return `Recurrent: $\\{${rec.join(',')}\\}$; transient: $\\{${tr.join(',')}\\}$. Largest gap between simulated and exact return probability: **${v.fix(gap, 3)}**.\nA transient state with $\\rho_i$ is visited a geometric number of times, ${tr.length ? `on average $1/(1-\\rho_i)$ = ${tr.map((i) => `${v.fix(1 / (1 - rho[i]), 2)} (state ${i})`).join(', ')}` : 'but here there is none'}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2', kind: 'Theorem', name: 'Recurrence criterion: Σ pᵢᵢ⁽ⁿ⁾ = ∞',
      statement: String.raw`A state $i$ is recurrent if and only if $\sum_{n=0}^{\infty}p_{ii}^{(n)}=\infty$, and transient if and only if the sum is finite. More precisely, if $\rho_i=\Pr_i(T_i<\infty)$ then the total number of visits $N_i=\sum_{n\ge0}\mathbf 1\{X_n=i\}$ (counting the visit at time 0) satisfies $\Pr_i(N_i> k)=\rho_i^{\,k}$ and $\mathbb E_i[N_i]=\sum_n p^{(n)}_{ii}=\dfrac1{1-\rho_i}$.`,
      idea: String.raw`Since $\mathbb E_i[\mathbf 1\{X_n=i\}]=p_{ii}^{(n)}$, the series is the expected number of visits. By the strong Markov property (2.8) the chain restarts at each return, so $N_i\ge k+1$ requires $k$ successive returns, each with probability $\rho_i$: $\Pr_i(N_i\ge k+1)=\rho_i^k$. Hence $N_i$ is geometric with mean $1/(1-\rho_i)$ when $\rho_i<1$, and infinite almost surely when $\rho_i=1$. The sum is an ordinary geometric series (pma-3.26) in disguise: $\sum_k\rho_i^k$ converges exactly when $\rho_i<1$.`,
      caption: String.raw`Left: the partial sums $S_N=\sum_{n\le N}p^{(n)}_{ii}$ against the number of steps (log axis). Pick the walk on $\mathbb Z$ (state 0, up-probability $p$) or the leak chain of 3.1 (any state). When the state is transient, $S_N$ flattens at $1/(1-\rho)$ (green line); when recurrent it never stops growing — for the symmetric walk like $\sqrt{2N/\pi}$ (dashed). Right: simulated number of returns within 1000 steps against the geometric law $\rho^k(1-\rho)$; a recurrent state has no finite geometric law and the mass runs off to the last bin.`,
      deps: ['stoch-3.1', 'pma-3.26'], refs: ['Norris §1.5'], tags: ['recurrence', 'geometric series'],
      viz(v) {
        const kind = v.select('chain', [{ value: 'walk', label: 'walk on ℤ' }, { value: 'leak', label: 'leak chain of 3.1' }], 'walk', { onChange: () => rebuild() });
        const pu = v.slider('up-probability $p$', 0.3, 0.7, 0.5, { step: 0.01, onChange: () => rebuild() });
        const lam = v.slider('leak $\\lambda$', 0, 0.5, 0.15, { step: 0.01, onChange: () => rebuild() });
        const st = v.slider('state $i$', 0, 5, 0, { int: true, step: 1, onChange: () => rebuild() });
        let seed = 1; v.button('resample', () => { seed++; rebuild(); });
        const NM = 4000, HZ = 1000, KB = 12;
        const s1 = v.stage({ x: [1, NM], y: [0, 10], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: 'number of steps $N$', ylabel: '$\\sum_{n\\le N}p^{(n)}_{ii}$', title: 'partial sums of return probabilities' });
        const s2 = v.stage({ x: [-0.7, KB + 0.7], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: `returns within ${HZ} steps (last bin: ${KB} or more)`, ylabel: 'proportion of runs', title: 'number of returns' });
        let S, rho, cnt, sRef;
        function rebuild() {
          const walk = kind.value === 'walk';
          pu.el.hidden = !walk; lam.el.hidden = walk; st.el.hidden = walk;
          const R = v.rng(seed * 13 + 1); S = [];
          let step;
          if (walk) {
            const p = pu.value, q = 1 - p; rho = 1 - Math.abs(p - q);
            let a = 1, sum = 1; S.push([1, 1]); // N = 1: only time 0 has p_00 > 0 (p_00^(1) = 0)
            for (let n = 1; n <= NM / 2; n++) { a *= (2 * (2 * n - 1) / n) * p * q; sum += a; if (2 * n >= 1) S.push([2 * n, sum]); }
            step = () => (R() < p ? 1 : -1);
            cnt = new Array(KB + 1).fill(0);
            for (let r = 0; r < 1500; r++) { let x = 0, k = 0; for (let t = 0; t < HZ; t++) { x += step(); if (x === 0) k++; } cnt[Math.min(KB, k)]++; }
          } else {
            const P = leakChain(lam.value), i = st.value; rho = returnProbs(P)[i];
            let row = P.map((_, j) => (j === i ? 1 : 0)), sum = 1; S.push([1, 1]);
            for (let n = 1; n <= NM; n++) { row = row.map((_, j) => row.reduce((acc, x, k) => acc + x * P[k][j], 0)); sum += row[i]; if (n >= 1) S.push([n, sum]); }
            const C = cumRows(P); cnt = new Array(KB + 1).fill(0);
            for (let r = 0; r < 1500; r++) { let x = i, k = 0; for (let t = 0; t < HZ; t++) { x = nextState(C, x, R()); if (x === i) k++; } cnt[Math.min(KB, k)]++; }
          }
          sRef = rho < 1 - 1e-9 ? 1 / (1 - rho) : Infinity;
          const top = rho < 1 - 1e-9 ? Math.max(sRef * 1.25, 2) : Math.max(...S.map((p) => p[1])) * 1.1;
          s1.setView([1, NM], [0, top]);
          v.invalidate();
        }
        rebuild();
        v.render(() => {
          s1.path(S, { color: 'accent', width: 2.5 });
          if (isFinite(sRef)) { s1.hline(sRef, { color: 'green', dash: true, width: 2 }); s1.text(`$1/(1-\\rho)=${v.fix(sRef, 2)}$`, 1.4, sRef, { color: 'green', dy: -10, size: 13 }); }
          else if (kind.value === 'walk') s1.fn((N) => Math.sqrt((2 * N) / Math.PI), { color: 'muted', dash: true, domain: [1, NM], n: 120 });
          const tot = cnt.reduce((a, b) => a + b, 0);
          s2.bars(cnt.map((c) => c / tot), { x0: 0, dx: 1, color: rho < 1 - 1e-9 ? 'accent' : 'red' });
          if (rho < 1 - 1e-9) for (let k = 0; k < KB; k++) s2.dot(k, rho ** k * (1 - rho), { color: 'ink', r: 4.5 });
        });
        v.legend([['accent', 'simulation / partial sum', { area: true }], ['ink', 'geometric law', { dot: true }], ['green', '$1/(1-\\rho)$', { dash: true }]]);
        v.readout(() => {
          const last = S[S.length - 1][1];
          return rho < 1 - 1e-9
            ? `Transient: $\\rho=${v.fix(rho, 4)}$, so the series sums to $1/(1-\\rho)=${v.fix(sRef, 3)}$; after ${NM} steps $S_N=${v.fix(last, 3)}$.`
            : `Recurrent ($\\rho=1$): the partial sums reach ${v.fix(last, 2)} by $N=${NM}$ and keep climbing — the series diverges.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3', kind: 'Theorem', name: 'Recurrence is a class property',
      statement: String.raw`If $i\leftrightarrow j$ (the states communicate, 1.5), then $i$ is recurrent if and only if $j$ is recurrent. Consequently, in a communicating class either all states are recurrent or all are transient. Moreover, if $p^{(m)}_{ij}>0$ and $p^{(l)}_{ji}>0$, then for all $n$,
$$p^{(m+n+l)}_{ii}\;\ge\;p^{(m)}_{ij}\,p^{(n)}_{jj}\,p^{(l)}_{ji}.$$`,
      idea: String.raw`Chapman–Kolmogorov (1.2) splits a trip $i\to j$ in $m$ steps, a loop $j\to j$ in $n$ steps and a trip $j\to i$ in $l$ steps; the chain can make this particular sequence of moves, so $p^{(m+n+l)}_{ii}$ is at least their product. Summing over $n$ gives $\sum_k p^{(k)}_{ii}\ge c\sum_n p^{(n)}_{jj}$ with $c=p^{(m)}_{ij}p^{(l)}_{ji}>0$, so if $j$ is recurrent the sum for $i$ diverges as well (3.2). Swapping the roles of $i$ and $j$ gives the converse.`,
      caption: String.raw`Choose two states $i,j$ of the leak chain. If they communicate, the shortest route $i\to j$ is drawn in orange and $j\to i$ in blue, and the plot shows the partial sums $S^i_N=\sum_{n\le N}p^{(n)}_{ii}$ (blue), $S^j_N$ (orange) and the lower bound $c\,S^j_{N-m-l}$ (green) that the inequality forces on $S^i_N$. Slide $\lambda$ to 0: both sums grow together; for $\lambda>0$ both level off. Pick state 5 (which does not communicate with the others) and the bound disappears: one state can be transient while the other is recurrent.`,
      deps: ['stoch-3.2', 'stoch-1.5'], refs: ['Norris §1.5'], tags: ['recurrence', 'communicating classes'],
      viz(v) {
        const lam = v.slider('leak $\\lambda$', 0, 0.5, 0.15, { step: 0.01, onChange: () => rebuild() });
        const si = v.select('state $i$', ['0', '1', '2', '3', '4', '5'], '0', { onChange: () => rebuild() });
        const sj = v.select('state $j$', ['0', '1', '2', '3', '4', '5'], '2', { onChange: () => rebuild() });
        const NN = 250;
        const s1 = v.stage({ x: [-0.4, 10.4], y: [0, 6.4], axes: false, equal: true, height: 300, title: 'the chain' });
        const s2 = v.stage({ x: [0, NN], y: [0, 10], axes: 'box', gutter: true, height: 300, xlabel: 'number of steps $N$', ylabel: 'partial sums', title: 'return series of $i$ and $j$' });
        const G = v.graph(s1, { directed: true, layout: 'none', draggable: false, r: 16, nodes: leakNodes(), edges: [] });
        let P, rho, Si, Sj, m, l, c, pi, pj;
        const matRow = (P, i, n) => { let r = P.map((_, j) => (j === i ? 1 : 0)); for (let t = 0; t < n; t++) r = r.map((_, j) => r.reduce((a, x, k) => a + x * P[k][j], 0)); return r; };
        const route = (P, a, b) => { // shortest path a -> b along positive entries (BFS)
          const prev = new Array(6).fill(-2); prev[a] = -1; const q = [a];
          while (q.length) { const u = q.shift(); for (let w = 0; w < 6; w++) if (P[u][w] > 0 && prev[w] === -2) { prev[w] = u; q.push(w); } }
          if (a !== b && prev[b] === -2) return null;
          const path = [b]; while (path[0] !== a) path.unshift(prev[path[0]]);
          return path;
        };
        let pathIJ, pathJI;
        function rebuild() {
          P = leakChain(lam.value); rho = returnProbs(P);
          const i = +si.value, j = +sj.value; pi = i; pj = j;
          G.set({ directed: true, layout: 'none', draggable: false, r: 16, nodes: leakNodes(), edges: edgesOf(P) });
          const series = (a) => { let row = P.map((_, k) => (k === a ? 1 : 0)), sum = 0; const out = []; for (let n = 0; n <= NN; n++) { sum += row[a]; out.push([n, sum]); row = row.map((_, k) => row.reduce((acc, x, q) => acc + x * P[q][k], 0)); } return out; };
          Si = series(i); Sj = series(j);
          pathIJ = route(P, i, j); pathJI = route(P, j, i);
          m = pathIJ ? pathIJ.length - 1 : null; l = pathJI ? pathJI.length - 1 : null;
          c = null;
          if (m !== null && l !== null) {
            // shortest route need not be the most likely, but any m, l with positive probability gives a valid bound
            c = matRow(P, i, m)[j] * matRow(P, j, l)[i];
          }
          const top = Math.max(2, Si[NN][1], Sj[NN][1]) * 1.1; s2.setView([0, NN], [0, top]);
          v.invalidate();
        }
        rebuild();
        const inPath = (path, e) => path && path.some((u, k) => k < path.length - 1 && path[k] === e.from && path[k + 1] === e.to);
        v.render(() => {
          G.draw({
            nodeColor: (id) => (id === pi ? 'accent' : id === pj ? 'orange' : recolor(rho, id)), nodeFill: (id) => (id === pi ? 'accent' : id === pj ? 'orange' : null),
            nodeNote: (id) => (rho[id] > 1 - 1e-9 ? 'rec.' : 'trans.'), noteColor: (id) => recolor(rho, id),
            edgeColor: (e) => (inPath(pathIJ, e) ? 'orange' : inPath(pathJI, e) ? 'accent' : null),
            edgeWidth: (e) => (inPath(pathIJ, e) || inPath(pathJI, e) ? 4 : 1 + 2 * e.w), edgeLabel: (e) => pfmt(e.w),
          });
          s2.path(Si, { color: 'accent', width: 2.5 });
          if (pj !== pi) s2.path(Sj, { color: 'orange', width: 2.5 });
          if (c !== null && c > 0 && pj !== pi) s2.path(Sj.map(([n, s]) => [n + m + l, c * s]).filter(([n]) => n <= NN), { color: 'green', width: 2, dash: true });
        });
        v.legend([['accent', '$S^i_N$', {}], ['orange', '$S^j_N$', {}], ['green', '$c\\,S^j_{N-m-l}$ (bound)', { dash: true }]]);
        v.readout(() => {
          if (pi === pj) return 'Choose two different states $i\\ne j$.';
          if (c === null) return `States ${pi} and ${pj} do **not** communicate (no route ${m === null ? `${pi}→${pj}` : `${pj}→${pi}`}), so the theorem says nothing: they are ${recolor(rho, pi) === recolor(rho, pj) ? 'both ' + (rho[pi] > 1 - 1e-9 ? 'recurrent' : 'transient') + ' here, but need not be' : 'allowed to differ — and here they do'}.`;
          let ok = true; for (let N = m + l; N <= NN; N++) if (Si[N][1] < c * Sj[N - m - l][1] - 1e-9) ok = false;
          return `Shortest routes: $m=${m}$ steps $i\\to j$, $l=${l}$ steps $j\\to i$; $c=p^{(m)}_{ij}p^{(l)}_{ji}=${v.fix(c, 4)}$. The inequality $S^i_N\\ge c\\,S^j_{N-m-l}$ holds for every $N\\le${NN}$: **${ok ? 'yes' : 'NO'}**. Both states are ${rho[pi] > 1 - 1e-9 ? 'recurrent' : 'transient'}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4', kind: 'Theorem', name: 'Finite closed classes are recurrent',
      statement: String.raw`Every state in a finite closed communicating class is recurrent. In particular, an irreducible chain on a finite state space is recurrent, and a finite chain cannot have all its states transient. The finiteness and the closedness are both needed: a state of a finite class that has an exit can be transient (3.1), and an irreducible chain on an infinite state space can be transient (3.6).`,
      idea: String.raw`Let $C$ be finite and closed. The chain never leaves $C$, and $C$ has finitely many states, so by pigeonhole some state of $C$ is visited infinitely often with positive probability. That state has $\sum_n p^{(n)}=\infty$, hence is recurrent (3.2), and by 3.3 recurrence spreads to every state of its class, i.e. to all of $C$. If $C$ had an exit, the chain could drain out of it with positive probability and the pigeonhole argument would fail.`,
      caption: String.raw`Run one long path and slide the horizon $n$. Bars compare, for every state, the visits made in the first half of the run (orange) with those in the second half (blue). **Finite, closed**: every state keeps being visited, so both halves are filled. **Finite, leaky**: the class $\{0,1,2\}$ of 3.1 is drained into $\{3,4\}$ and the orange bars never get a blue partner. **Infinite**: a walk on $\mathbb Z$ with up-probability $p$ above $1/2$ has only finitely many visits to each site and marches off to infinity (visits outside the window are counted in the readout).`,
      deps: ['stoch-3.3'], refs: ['Norris §1.5'], tags: ['recurrence', 'pigeonhole'],
      viz(v) {
        const kind = v.select('state space', [{ value: 'closed', label: 'finite, closed class' }, { value: 'leaky', label: 'finite, leaky' }, { value: 'inf', label: 'infinite: walk on ℤ' }], 'closed', { onChange: () => rebuild() });
        const nS = v.slider('states', 3, 10, 6, { int: true, step: 1, onChange: () => rebuild() });
        const pu = v.slider('up-probability $p$', 0.5, 0.8, 0.6, { step: 0.01, onChange: () => rebuild() });
        const TT = v.slider('time $n$', 20, 20000, 2000, { log: true, int: true });
        let seed = 7; v.button('new chain', () => { seed++; rebuild(); });
        const s1 = v.stage({ x: [-0.4, 10.4], y: [0, 6.4], axes: false, equal: true, height: 320, title: 'the chain' });
        const s2 = v.stage({ x: [-0.7, 5.7], y: [0, 10], axes: 'box', gutter: true, height: 320, xlabel: 'state', ylabel: 'visits', title: 'visits: first half vs second half of the run' });
        const G = v.graph(s1, { directed: true, layout: 'none', draggable: false, r: 16, nodes: [{ id: 0, x: 1, y: 1 }], edges: [] });
        let P, path, n0, labels, lo = 0, hi = 0, W0 = 0;
        const MAXT = 20000, WIN = [-6, 25];
        function rebuild() {
          const k = kind.value; nS.el.hidden = k !== 'closed'; pu.el.hidden = k !== 'inf'; s1.el.style.display = k === 'inf' ? 'none' : '';
          const R = v.rng(seed * 101 + 9);
          if (k === 'closed') {
            const n = nS.value; n0 = n;
            P = Array.from({ length: n }, (_, i) => { const r = new Array(n).fill(0); r[(i + 1) % n] += 1; for (let e = 0; e < 2; e++) r[Math.floor(R() * n)] += R() * 1.5; return r; });
            P = P.map((r) => { const s = r.reduce((a, b) => a + b, 0); return r.map((x) => x / s); });
            const pos = Array.from({ length: n }, (_, i) => [5 + 3.2 * Math.cos(Math.PI / 2 - (2 * Math.PI * i) / n) * 1.5, 3.2 + 2.6 * Math.sin(Math.PI / 2 - (2 * Math.PI * i) / n)]);
            G.set({ directed: true, layout: 'none', draggable: false, r: 16, nodes: pos.map((p, i) => ({ id: i, label: String(i), x: p[0], y: p[1], notePos: 's' })), edges: edgesOf(P) });
            path = pathOf(P, R, 0, MAXT); labels = Array.from({ length: n }, (_, i) => String(i));
          } else if (k === 'leaky') {
            P = leakChain(0.1); n0 = 6;
            G.set({ directed: true, layout: 'none', draggable: false, r: 16, nodes: leakNodes(), edges: edgesOf(P) });
            path = pathOf(P, R, 5, MAXT); labels = ['0', '1', '2', '3', '4', '5'];
          } else {
            n0 = WIN[1] - WIN[0] + 1; const p = pu.value; path = new Int16Array(MAXT + 1); let x = 0; const full = [0];
            for (let t = 1; t <= MAXT; t++) { x += R() < p ? 1 : -1; full.push(x); }
            path = full; labels = null;
          }
          s2.setView(k === 'inf' ? [WIN[0] - 0.7, WIN[1] + 0.7] : [-0.7, n0 - 0.3], [0, 10]);
          v.invalidate();
        }
        rebuild();
        v.render(() => {
          const k = kind.value, T = TT.value, h = Math.floor(T / 2), base = k === 'inf' ? WIN[0] : 0, len = k === 'inf' ? WIN[1] - WIN[0] + 1 : n0;
          const a = new Array(len).fill(0), b = new Array(len).fill(0); let out = 0;
          for (let t = 0; t <= T; t++) { const idx = path[t] - (k === 'inf' ? WIN[0] : 0); if (idx < 0 || idx >= len) { out++; continue; } (t <= h ? a : b)[idx]++; }
          W0 = out;
          const top = Math.max(5, ...a, ...b) * 1.15; s2.setView(k === 'inf' ? [WIN[0] - 0.7, WIN[1] + 0.7] : [-0.7, len - 0.3], [0, top]);
          const wdt = k === 'inf' ? 0.4 : 0.38;
          for (let i = 0; i < len; i++) { const x = base + i; s2.rect(x - wdt, 0, x, a[i], { fill: 'orange', fillAlpha: 0.7, color: 'orange' }); s2.rect(x, 0, x + wdt, b[i], { fill: 'accent', fillAlpha: 0.7, color: 'accent' }); }
          lo = Math.min(...a.map((x, i) => x + b[i])); hi = Math.min(...b);
          if (k !== 'inf') G.draw({ nodeColor: (id) => (b[id] > 0 ? 'green' : 'red'), nodeNote: (id) => `${a[id] + b[id]}`, noteColor: (id) => (b[id] > 0 ? 'green' : 'red'), edgeWidth: (e) => 1 + 3 * e.w, edgeLabel: null });
        });
        v.legend([['orange', 'visits, first half of the run', { area: true }], ['accent', 'visits, second half', { area: true }]]);
        v.readout(() => {
          const T = TT.value;
          if (kind.value === 'inf') return `After $n=${T}$ steps the walk stands at ${path[T]}; ${W0} of the ${T + 1} time points fell outside the window ${WIN[0]}…${WIN[1]}. Every site is visited only finitely often: transient.`;
          return `Pigeonhole: some state has at least ${Math.ceil((T + 1) / n0)} visits (the average is $(n+1)/${n0}$). Fewest visits to any state in the second half: **${hi}**${hi === 0 ? ' — some states have been abandoned (green outline = still visited in the second half, red = abandoned).' : ' — every state is still being visited.'}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5', kind: 'Theorem', name: 'Pólya’s recurrence theorem',
      statement: String.raw`Simple symmetric random walk on $\mathbb Z^d$ (each step moves to one of the $2d$ nearest neighbours with probability $1/(2d)$) is recurrent for $d=1$ and $d=2$ and transient for every $d\ge3$. Equivalently, $\sum_n\Pr_0(S_{2n}=0)$ diverges for $d\le2$ and converges for $d\ge3$, because $\Pr_0(S_{2n}=0)\sim c_d\,n^{-d/2}$. In $d=3$ the probability of ever returning to the origin is $\approx0.3405$.`,
      scope: String.raw`Nearest-neighbour walk with uniform steps on the integer lattice. The constants $0.3405$ ($d=3$) and $0.1932$ ($d=4$) are numerical values from the literature (Watson 1939, McCrea–Whipple 1940; table of Montroll 1956 as listed by MathWorld), not consequences of the argument sketched here.`,
      idea: String.raw`By the recurrence criterion (3.2) it is enough to sum $u_{2n}=\Pr_0(S_{2n}=0)$. In one dimension $u_{2n}=\binom{2n}{n}4^{-n}$, and Stirling's formula (pma-8.22) gives $u_{2n}\sim1/\sqrt{\pi n}$. In two dimensions the coordinates in the rotated frame $(x+y,x-y)$ are independent one-dimensional walks, so $u_{2n}$ is its square, $\sim1/(\pi n)$: the harmonic series diverges. In $d$ dimensions, $u_{2n}\asymp n^{-d/2}$, and the $p$-series test (pma-3.28) says $\sum n^{-d/2}$ converges exactly when $d>2$.`,
      caption: String.raw`Choose the dimension $d$. Left: partial sums $\sum_{k\le n}u_{2k}$ on log-log axes, computed exactly; for $d=1,2$ they grow without bound (like $\sqrt n$ and $\log n$) and for $d\ge3$ they level off at the expected number of returns. Right: the probability that the walk has been back at the origin by time $T$ — exact curve (renewal equation) and the fraction of 800 simulated walkers. In $d=2$ it creeps to 1 so slowly that after 4000 steps about 29% of the walkers (exact value) have still not come home.`,
      deps: ['stoch-3.2', 'pma-8.22', 'pma-3.28'], refs: ['Norris §1.6'], credit: 'G. Pólya, 1921', tags: ['random walk', 'recurrence', 'dimension'],
      viz(v) {
        const dd = v.select('dimension $d$', ['1', '2', '3', '4'], '2', { onChange: () => rebuild() });
        const TS = v.slider('horizon $T$ (steps)', 20, 4000, 1000, { log: true, int: true });
        let seed = 2; v.button('resample', () => { seed++; rebuild(); });
        const NM = 2000, M = 800;
        const s1 = v.stage({ x: [1, NM], y: [0.5, 100], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'number of terms $n$', ylabel: '$\\sum_{k\\le n}u_{2k}$', title: 'the series of return probabilities' });
        const s2 = v.stage({ x: [0, 4000], y: [0, 1.05], axes: 'box', gutter: true, height: 320, xlabel: 'time $T$', ylabel: 'returned by time $T$', title: 'has the walk come home?' });
        let curves, Fcur, simFirst;
        function rebuild() {
          const d = +dd.value; curves = {};
          for (const D of [1, 2, 3, 4]) { const u = uSeq(D, NM); let s = 0; curves[D] = Array.from(u, (x, n) => { s += x; return [n + 1, s]; }); }
          const u = uSeq(d, NM); Fcur = returnedBy(u).F;
          const R = v.rng(seed * 29 + d); const first = new Int32Array(M);
          const x = new Int16Array(M * d);
          for (let t = 1; t <= 4000; t++) for (let w = 0; w < M; w++) {
            const r = Math.floor(R() * 2 * d), ax = r >> 1; x[w * d + ax] += r & 1 ? 1 : -1;
            if (!first[w]) { let z = true; for (let a = 0; a < d; a++) if (x[w * d + a]) { z = false; break; } if (z) first[w] = t; }
          }
          simFirst = Array.from(first).filter((t) => t > 0).sort((a, b) => a - b);
          v.invalidate();
        }
        rebuild();
        const COLS = { 1: 'blue', 2: 'orange', 3: 'green', 4: 'purple' };
        v.render(() => {
          const d = +dd.value;
          for (const D of [1, 2, 3, 4]) s1.path(curves[D], { color: COLS[D], width: D === d ? 3.2 : 1.4, alpha: D === d ? 1 : 0.45 });
          s1.text('d=1', NM, curves[1][NM][1], { color: 'blue', dx: -4, dy: -9, align: 'right', size: 12 });
          s1.text('d=2', NM, curves[2][NM][1], { color: 'orange', dx: -4, dy: -9, align: 'right', size: 12 });
          s1.text('d=3', NM, curves[3][NM][1], { color: 'green', dx: -4, dy: -9, align: 'right', size: 12 });
          s1.text('d=4', NM, curves[4][NM][1], { color: 'purple', dx: -4, dy: 12, align: 'right', size: 12 });
          const pts = []; for (let n = 0; n <= 2000; n += 4) pts.push([2 * n, Fcur[n]]);
          s2.path(pts, { color: COLS[d], width: 2.5 });
          const lim = POLYA_P[d]; s2.hline(lim, { color: 'muted', dash: true });
          s2.text(d <= 2 ? 'limit 1' : `limit ${lim.toFixed(4)}`, 3950, lim, { align: 'right', dy: 14, color: 'muted', size: 12 });
          // empirical cumulative fraction
          const emp = []; let k = 0; for (let t = 0; t <= 4000; t += 20) { while (k < simFirst.length && simFirst[k] <= t) k++; emp.push([t, k / M]); }
          s2.path(emp, { color: 'gold', width: 2 });
          s2.vline(TS.value, { color: 'faint', dash: true });
        });
        v.legend([['gold', 'simulated fraction (800 walkers)', {}], ['muted', 'Pólya limit', { dash: true }]]);
        v.readout(() => {
          const d = +dd.value, T = TS.value, n = Math.floor(T / 2), exact = Fcur[n];
          let k = 0; while (k < simFirst.length && simFirst[k] <= T) k++;
          const tot = curves[d][NM][1];
          return `$d=${d}$: returned by $T=${T}$ — exact **${v.fix(exact, 4)}**, simulated ${v.fix(k / M, 3)}. ${d >= 3 ? `The series converges: $\\sum_{n\\ge0}u_{2n}\\approx ${v.fix(tot, 4)}$ (partial sum to 2000 terms), the expected number of visits including time 0 is $1/(1-\\rho)$, so $\\rho\\approx${v.fix(1 - 1 / tot, 4)}$ (literature: ${POLYA_P[d]}).` : `The partial sum to ${NM} terms is already ${v.fix(tot, 2)} and still climbing: $\\rho=1$.`}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6', kind: 'Theorem', name: 'Biased random walks are transient',
      statement: String.raw`Let $S_n$ be the walk on $\mathbb Z$ that steps $+1$ with probability $p$ and $-1$ with probability $q=1-p$. If $p\ne q$, every state is transient, and the probability of ever returning to the starting point is $1-|p-q|=2\min(p,q)$. Only for $p=q=1/2$ is the walk recurrent.`,
      idea: String.raw`Here $\Pr_0(S_{2n}=0)=\binom{2n}{n}(pq)^n\sim(4pq)^n/\sqrt{\pi n}$ by Stirling, and $4pq<1$ whenever $p\ne q$, so the series converges geometrically and the state is transient (3.2). The return probability follows from gambler's ruin (2.4): after a first step up (probability $p$) the walk returns with probability $q/p$ when $p>q$, and symmetrically after a first step down, so $\rho=p\cdot\frac qp+q\cdot1=2q$ for $p>q$.`,
      caption: String.raw`Tilt the walk with $p$ (only $p\ge\frac12$ is needed by symmetry). Left: ten sample paths drift away at speed $2p-1$. Middle: the limiting return probability $2(1-p)$ (green) against the exact probability of having returned within 1000 steps (blue) and the simulated one (gold dots, 400 walkers per value of $p$). Right: the chance of having returned by time $T$ for the chosen $p$ levels off at $1-|p-q|$ instead of creeping up to 1. Near $p=\frac12$ the plateau is reached very slowly.`,
      deps: ['stoch-3.2', 'stoch-2.4'], refs: ['Norris §1.6'], tags: ['random walk', 'transience', 'drift'],
      viz(v) {
        const pu = v.slider('up-probability $p$', 0.5, 0.95, 0.6, { step: 0.01, onChange: () => rebuild() });
        let seed = 3; v.button('resample', () => { seed++; rebuild(); });
        const HZ = 1000;
        const s1 = v.stage({ x: [0, 300], y: [-60, 200], axes: 'box', gutter: true, height: 300, xlabel: 'time $n$', ylabel: 'position $S_n$', title: 'ten walks' });
        const s2 = v.stage({ x: [0.5, 1], y: [0, 1.05], axes: 'box', gutter: true, height: 300, xlabel: 'up-probability $p$', ylabel: 'return probability', title: 'return probability against $p$' });
        const s3 = v.stage({ x: [1, 2000], y: [0, 1.05], xlog: true, axes: 'box', gutter: true, height: 300, xlabel: 'time $T$', ylabel: 'returned by time $T$', title: 'returned by time $T$' });
        let walks, grid, simPts, Fp, simFrac, simSeed = -1;
        const Fof = (p) => { const q = 1 - p, N = 1000, u = new Float64Array(N + 1); u[0] = 1; for (let n = 1; n <= N; n++) u[n] = u[n - 1] * (2 * (2 * n - 1) / n) * p * q; return returnedBy(u).F; };
        function rebuild() {
          const p = pu.value, R = v.rng(seed * 7 + 5);
          walks = Array.from({ length: 10 }, () => { const S = [[0, 0]]; let x = 0; for (let t = 1; t <= 300; t++) { x += R() < p ? 1 : -1; S.push([t, x]); } return S; });
          const lo = Math.min(-20, ...walks.map((w) => Math.min(...w.map((q) => q[1])))), hi = Math.max(20, ...walks.map((w) => Math.max(...w.map((q) => q[1]))));
          s1.setView([0, 300], [lo * 1.1, hi * 1.1]);
          if (!grid) { grid = []; for (let i = 0; i <= 45; i++) { const pp = 0.5 + i * 0.01; grid.push([pp, Fof(pp)[500]]); } }
          if (simSeed !== seed) {
            simSeed = seed; simPts = [];
            for (let g = 0; g < 10; g++) {
              const pp = 0.5 + g * 0.05; let back = 0;
              for (let w = 0; w < 400; w++) { let x = 0; for (let t = 0; t < HZ; t++) { x += R() < pp ? 1 : -1; if (x === 0) { back++; break; } } }
              simPts.push([pp, back / 400]);
            }
          }
          Fp = Fof(p);
          const T2 = 2000, fr = new Float64Array(T2 + 1);
          for (let w = 0; w < 600; w++) { let x = 0; for (let t = 1; t <= T2; t++) { x += R() < p ? 1 : -1; if (x === 0) { fr[t]++; break; } } }
          simFrac = []; let c = 0, tPrev = 0; for (const t of Array.from({ length: 61 }, (_, i) => Math.round(Math.exp((Math.log(T2) * i) / 60)))) { for (let k = tPrev + 1; k <= t; k++) c += fr[k]; tPrev = Math.max(tPrev, t); if (t >= 1) simFrac.push([t, c / 600]); }
          v.invalidate();
        }
        rebuild();
        v.render(() => {
          const p = pu.value;
          walks.forEach((w, i) => s1.path(w, { color: STATE_COL[i % 8], width: 1.5, alpha: 0.85 }));
          s1.hline(0, { color: 'faint', dash: true });
          s1.fn((t) => (2 * p - 1) * t, { color: 'ink', dash: true, domain: [0, 300], n: 2 });
          s2.path(grid, { color: 'accent', width: 2 });
          s2.fn((x) => 2 * (1 - x), { color: 'green', width: 2.5, domain: [0.5, 1], n: 2 });
          simPts.forEach(([x, y]) => s2.dot(x, y, { color: 'gold', r: 4.5 }));
          s2.vline(p, { color: 'faint', dash: true });
          const ex = []; for (let n = 1; n <= 1000; n += 4) ex.push([2 * n, Fp[n]]);
          s3.path(ex, { color: 'accent', width: 2.5 });
          s3.path(simFrac, { color: 'gold', width: 2 });
          s3.hline(2 * (1 - p), { color: 'green', dash: true, width: 2 });
          s3.hline(1, { color: 'faint', dash: true });
        });
        v.legend([['green', 'limit $1-|p-q|$', { dash: true }], ['accent', 'exact, within the horizon', {}], ['gold', 'simulation', {}]]);
        v.readout(() => {
          const p = pu.value;
          return `$p=${v.fix(p, 2)}$: return probability $1-|p-q|=${v.fix(1 - Math.abs(2 * p - 1), 3)}$. Exact probability of returning within 2000 steps: ${v.fix(Fp[1000], 3)}; simulated: ${v.fix(simFrac[simFrac.length - 1][1], 3)}. ${p === 0.5 ? 'At $p=\\frac12$ the limit is 1 but the approach is slow.' : `Each ten steps the walk drifts about ${v.fix(10 * (2 * p - 1), 1)} sites, and $4pq=${v.fix(4 * p * (1 - p), 3)}<1$ makes the series $\\sum\\binom{2n}{n}(pq)^n$ converge.`}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7', kind: 'Definition', name: 'Positive and null recurrence',
      statement: String.raw`A recurrent state $i$ is **positive recurrent** if its mean return time $m_i=\mathbb E_i[T_i]$ is finite and **null recurrent** if $m_i=\infty$ (even though $T_i<\infty$ almost surely). Both properties, like recurrence itself, are shared by a whole communicating class. A positive recurrent state has $m_i=1/\pi_i$ for the stationary distribution $\pi$ of its class.`,
      scope: String.raw`The example drawn is a reflecting walk on $\{0,1,2,\dots\}$ (from 0 it steps to 1; elsewhere up with probability $p$, down with probability $1-p$). For this walk $m_0=\dfrac{2(1-p)}{1-2p}$ when $p<\frac12$, and return probability $\rho_0=\frac{1-p}{p}$ when $p>\frac12$.`,
      idea: String.raw`Recurrence says $T_i<\infty$ with probability one; it does not say $\mathbb E[T_i]<\infty$. The mean is $\sum_{n\ge0}\Pr_i(T_i>n)$, so what matters is how fast the tail of the return time decays. With drift toward 0 the tail decays geometrically and the mean is finite (here $m_0=1/\pi_0$ with $\pi_0=\frac{1-2p}{2(1-p)}$ from the stationary distribution). For $p=\frac12$ the tail decays only like $n^{-1/2}$: the sum diverges. For $p>\frac12$ the walk is transient and the tail never reaches zero.`,
      caption: String.raw`Set the up-probability $p$ of the reflecting walk. Left: the empirical survival function $\Pr(T_0>n)$ of the return time to 0 on log-log axes (3000 excursions, each stopped at 20000 steps). For $p<\frac12$ it falls off geometrically (a bending curve); at $p=\frac12$ it follows a straight line of slope $-\frac12$; for $p>\frac12$ it flattens at the escape probability $1-\rho_0$ (dashed). Right: running mean of the observed return times as excursions accumulate: it settles at $m_0$ (green) when $p<\frac12$ and keeps lurching upward at $p=\frac12$.`,
      deps: ['stoch-3.1', 'stoch-2.3'], refs: ['Norris §1.7'], tags: ['recurrence', 'return time'],
      viz(v) {
        const pu = v.slider('up-probability $p$', 0.2, 0.7, 0.4, { step: 0.01, onChange: () => rebuild() });
        let seed = 4; v.button('resample', () => { seed++; rebuild(); });
        const NEX = 3000, CAP = 20000;
        const s1 = v.stage({ x: [1, CAP], y: [2e-4, 1.2], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'time $n$', ylabel: '$\\Pr(T_0>n)$', title: 'tail of the return time' });
        const s2 = v.stage({ x: [1, NEX], y: [0, 10], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: 'number of excursions', ylabel: 'average return time', title: 'running mean of return times' });
        let surv, runMean, nRet, mean0;
        function rebuild() {
          const p = pu.value, R = v.rng(seed * 37 + 1), q = 1 - p;
          const times = [];
          for (let e = 0; e < NEX; e++) { let x = 1, t = 1; while (x > 0 && t < CAP) { x += R() < p ? 1 : -1; t++; } times.push(x === 0 ? t : Infinity); }
          const sorted = times.slice().sort((a, b) => a - b);
          surv = []; let k = 0;
          for (let i = 0; i <= 60; i++) { const n = Math.exp((Math.log(CAP) * i) / 60); while (k < sorted.length && sorted[k] <= n) k++; surv.push([n, Math.max(2e-4, (NEX - k) / NEX)]); }
          runMean = []; let sum = 0, cnt = 0;
          for (let e = 0; e < NEX; e++) { if (isFinite(times[e])) { sum += times[e]; cnt++; } if ((e + 1) % 5 === 0 || e < 20) runMean.push([e + 1, cnt ? sum / cnt : 0]); }
          nRet = cnt; mean0 = p < 0.5 ? (2 * q) / (1 - 2 * p) : Infinity;
          const top = Math.max(5, p < 0.5 ? mean0 * 2.2 : 0, ...runMean.map((r) => r[1])) * 1.05; s2.setView([1, NEX], [0, top]);
          v.invalidate();
        }
        rebuild();
        v.render(() => {
          const p = pu.value;
          s1.path(surv, { color: 'accent', width: 2.5 });
          if (Math.abs(p - 0.5) < 0.006) s1.fn((n) => Math.sqrt(2 / (Math.PI * n)), { color: 'muted', dash: true, domain: [2, CAP], n: 60 });
          if (p > 0.5) s1.hline(1 - (1 - p) / p, { color: 'red', dash: true, width: 2 });
          s2.path(runMean, { color: 'gold', width: 2 });
          if (isFinite(mean0)) s2.hline(mean0, { color: 'green', dash: true, width: 2 });
        });
        v.legend([['accent', 'empirical tail', {}], ['green', 'mean return time $m_0$', { dash: true }], ['muted', '$\\sqrt{2/\\pi n}$ ($p=\\frac12$)', { dash: true }], ['red', 'escape probability', { dash: true }]]);
        v.readout(() => {
          const p = pu.value;
          return p < 0.5 - 1e-9 ? `**Positive recurrent**: $m_0=2(1-p)/(1-2p)=${v.fix(mean0, 3)}$ (equivalently $1/\\pi_0$); observed average ${v.fix(runMean[runMean.length - 1][1], 3)} from ${nRet} returns.`
            : Math.abs(p - 0.5) < 0.006 ? `**Null recurrent** at $p=\\frac12$: every excursion returns, but the running mean ${v.fix(runMean[runMean.length - 1][1], 1)} (truncated at ${CAP} steps; ${NEX - nRet} excursions were still out) has no limit — $\\mathbb E[T_0]=\\infty$.`
              : `**Transient**: the walk escapes with probability $1-\\rho_0=${v.fix(1 - (1 - p) / p, 3)}$; ${NEX - nRet} of ${NEX} excursions had not returned by step ${CAP}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8', kind: 'Theorem', name: 'Simple random walk on ℤ is null recurrent',
      statement: String.raw`Let $T$ be the first return time to 0 of simple symmetric random walk on $\mathbb Z$. Then $\Pr_0(T<\infty)=1$, but $\Pr_0(T>2n)=\Pr_0(S_{2n}=0)=\binom{2n}{n}4^{-n}\sim 1/\sqrt{\pi n}$, so $\mathbb E_0[T]=\sum_n\Pr_0(T>n)=\infty$. The truncated mean grows like $\mathbb E[T\wedge 2N]\sim4\sqrt{N/\pi}$.`,
      idea: String.raw`The identity $\Pr_0(T>2n)=\Pr_0(S_{2n}=0)$ comes from the reflection principle and the ballot theorem (2.10): the walks of length $2n$ that avoid 0 after time 0 are in bijection with those that end at 0. Stirling's formula (pma-8.22) turns it into $1/\sqrt{\pi n}$. Pólya's theorem (3.5) already gave recurrence; the divergent series $\sum n^{-1/2}$ is the null part. The same $n^{-3/2}$ law for the density of first-passage times is the hitting-time theorem 2.11.`,
      caption: String.raw`Left: one long walk of $10^6$ steps; after its $k$-th return to 0 we plot the average of the $k$ return times so far. A positive recurrent state would level off; here it keeps climbing like $\sqrt{\text{time}}$ because the occasional huge excursion swamps the average. Right: the mean of $T$ cut off at $c$ steps, over 4000 simulated excursions (gold) and exactly, $2\sum_{m<c/2}\binom{2m}{m}4^{-m}$ (blue): it follows $4\sqrt{c/2\pi}$ (dashed) without bound instead of converging.`,
      deps: ['stoch-3.5', 'stoch-2.11'], refs: ['Norris §1.7', 'Grimmett–Stirzaker §3.10'], tags: ['null recurrence', 'random walk'],
      viz(v) {
        let seed = 6; v.button('new walk', () => { seed++; rebuild(); });
        const LEN = 1000000, NEX = 4000, CAPX = 100000;
        const s1 = v.stage({ x: [1, 1000], y: [0, 100], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: 'number of returns $k$', ylabel: 'average of the first $k$ return times', title: 'running average of return times (one long walk)' });
        const s2 = v.stage({ x: [2, CAPX], y: [1, 1000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'cut-off $c$', ylabel: '$\\mathbb E[\\min(T,c)]$', title: 'truncated mean return time' });
        let avg, trunc, exact, retCount, lastAvg;
        function rebuild() {
          const R = v.rng(seed * 53 + 2);
          let x = 0, last = 0; const rt = [];
          for (let t = 1; t <= LEN; t++) { x += R() < 0.5 ? 1 : -1; if (x === 0) { rt.push(t - last); last = t; } }
          retCount = rt.length; avg = []; let s = 0;
          rt.forEach((r, i) => { s += r; const k = i + 1; if (k <= 40 || k % 4 === 0) avg.push([k, s / k]); });
          lastAvg = avg.length ? avg[avg.length - 1][1] : 0;
          s1.setView([1, Math.max(10, rt.length)], [0, Math.max(10, ...avg.map((a) => a[1])) * 1.1]);
          // truncated means from independent excursions
          const T = new Float64Array(NEX);
          for (let e = 0; e < NEX; e++) { let y = 1, t = 1; while (y > 0 && t < CAPX) { y += R() < 0.5 ? 1 : -1; t++; } T[e] = t; }
          trunc = []; exact = [];
          // u_{2m}
          const M = CAPX / 2, u = new Float64Array(M + 1); u[0] = 1; for (let m = 1; m <= M; m++) u[m] = u[m - 1] * (2 * m - 1) / (2 * m);
          const pre = new Float64Array(M + 2); for (let m = 0; m <= M; m++) pre[m + 1] = pre[m] + u[m];
          for (let i = 0; i <= 50; i++) {
            const c = Math.round(Math.exp(Math.log(2) + (Math.log(CAPX / 2) * i) / 50)); let sum = 0; for (let e = 0; e < NEX; e++) sum += Math.min(T[e], c);
            trunc.push([c, sum / NEX]);
            // E[min(T, c)] = sum_{k=0}^{c-1} P(T>k); P(T>k) = u_{2 floor(k/2)} for k>=1... with P(T>0)=1: pairs (2m, 2m+1) both equal u_m.
            const mm = Math.floor(c / 2); let ex = 2 * pre[Math.min(mm, M + 1)]; if (c % 2 === 1) ex += u[Math.min(mm, M)];
            exact.push([c, ex]);
          }
          s2.setView([2, CAPX], [1, Math.max(...exact.map((e) => e[1])) * 1.5]);
          v.invalidate();
        }
        rebuild();
        v.render(() => {
          s1.path(avg, { color: 'gold', width: 2 });
          s2.path(exact, { color: 'accent', width: 2.5 });
          s2.path(trunc, { color: 'gold', width: 2 });
          s2.fn((c) => 4 * Math.sqrt(c / (2 * Math.PI)), { color: 'muted', dash: true, domain: [2, CAPX], n: 60 });
        });
        v.legend([['accent', 'exact truncated mean', {}], ['gold', 'simulation', {}], ['muted', '$4\\sqrt{c/2\\pi}$', { dash: true }]]);
        v.readout(() => `One walk of $10^6$ steps returned to 0 only ${retCount} times, and the average return time so far is ${v.fix(lastAvg, 0)} — about $10^6/${retCount}$. Truncating at $c=${CAPX}$ gives mean ${v.fix(exact[exact.length - 1][1], 1)}; doubling $c$ multiplies it by about $\\sqrt2$, so no finite limit exists: $\\mathbb E_0[T]=\\infty$.`);
      },
    },
  ],
};
