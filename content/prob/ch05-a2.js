// Probability: Theory and Examples (Durrett) — Chapter 5, part A2: §5.3 Recurrence and transience
import { fr, ringPos, drawChain, nodeAt, runChain, stepper, rhoTo, classes, absorbProb, chain5, CHAIN7, CLS_COL, logInts, logFact } from './ch05-a.shared.js';

const REC = (rho) => rho >= 1 - 1e-9;
/** Click-to-wire graph on `n` nodes: click a node, then another (or the same) to toggle the edge; rows are uniform on their edges. */
function wiring(v, S, pos, adj, afterChange) {
  let sel = -1;
  S.onClick((x, y) => {
    const i = nodeAt(pos, x, y);
    if (i < 0) sel = -1; else if (sel < 0) sel = i; else { adj[sel][i] = !adj[sel][i]; sel = -1; }
    afterChange(); v.invalidate();
  });
  return {
    get sel() { return sel; },
    P() { return adj.map((row, i) => { const r = row.map((a) => (a ? 1 : 0)), c = r.reduce((s, q) => s + q, 0); return c ? r.map((q) => q / c) : r.map((_, j) => (i === j ? 1 : 0)); }); },
  };
}
const ADJ6 = () => { const A = Array.from({ length: 6 }, () => Array(6).fill(false)); [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3], [1, 1]].forEach(([i, j]) => { A[i][j] = true; }); return A; };
const set = (a) => `$\\{${a.join(',')}\\}$`;

export default {
  collection: 'prob',
  chapter: 5,
  items: [
    {
      num: '5.3.1a',
      kind: 'Definition',
      name: 'Recurrent and transient states',
      verify: true,
      statement: String.raw`Let $T_y=\inf\{n\ge1:X_n=y\}$ and $\rho_{yy}=P_y(T_y<\infty)$. The state $y$ is **recurrent** if $\rho_{yy}=1$ (the chain started at $y$ returns with probability $1$) and **transient** if $\rho_{yy}<1$. By 5.2.6 a recurrent state is visited infinitely often almost surely, a transient state only finitely often, and the number of visits is geometric with mean $\rho_{yy}/(1-\rho_{yy})$.`,
      idea: String.raw`The dichotomy comes from the formula $P_y(T_y^k<\infty)=\rho_{yy}^k$ of 5.2.6: either the factor is $1$ and the visits never stop, or it is below $1$ and the tail decays geometrically. This is the first example of a *zero-one* behaviour of a chain: for a given state, the number of returns is either almost surely infinite or almost surely finite.`,
      caption: String.raw`The five-state chain of the previous items: states $0,1,2$ communicate and leak (rate $e$, through state $2$) into the closed pair $\{3,4\}$. Pick $y$ and the leak. Left: nodes are green when $\rho_{yy}=1$ and red when $<1$. Right: the running fraction of seeded runs from $y$ that came back within $300$ steps settles on the exact $\rho_{yy}$ (green line). Slide $e$ down towards $0$: the red states turn green only at exactly $e=0$, where $\{0,1,2\}$ becomes closed; any tiny leak makes all three transient.`,
      deps: ['prob-5.2.6'],
      see: ['stoch-3.1'],
      tags: ['markov chains', 'recurrence'],
      viz(v) {
        const e = v.slider('leak $e$', 0, 0.5, 0.15, { step: 0.01 });
        const yS = v.select('state $y$', ['0', '1', '2', '3', '4'], '2');
        let seed = 1; v.button('Resample', () => { seed++; });
        const G = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 320, title: 'transition diagram' });
        const R = v.stage({ x: [1, 4000], xlog: true, y: [0, 1], axes: 'box', gutter: true, height: 320, minWidth: 280, xlabel: 'number of runs', title: 'running estimate of $\\rho_{yy}$' });
        let key = '', est = null;
        const run = (ee, y, sd) => {
          const k = `${ee}|${y}|${sd}`; if (k === key) return est; key = k;
          const P = chain5(ee), rg = v.rng(sd * 17 + y), st = stepper(rg, P), out = new Float64Array(4000); let c = 0;
          for (let i = 0; i < 4000; i++) { let x = y, back = false; for (let t = 0; t < 300; t++) { x = st(x); if (x === y) { back = true; break; } } if (back) c++; out[i] = c / (i + 1); }
          return (est = out);
        };
        let info = '';
        v.render(() => {
          const ee = e.value, y = +yS.value, P = chain5(ee), rho = [0, 1, 2, 3, 4].map((k) => rhoTo(P, k)[k]);
          drawChain(G, P, { pos: ringPos(5, 1.05), fills: rho.map((r) => (REC(r) ? 'green' : 'red')), rings: rho.map((_, k) => k === y), labels: true, minP: 0.02 });
          const est2 = run(ee, y, seed), pts = logInts(1, 4000, 120).map((i) => [i, est2[i - 1]]);
          R.path(pts, { color: 'gold', width: 2 });
          R.hline(rho[y], { color: 'green', width: 2, dash: true });
          info = `$\\rho_{yy}=${fr(rho[y], 4)}$: state $${y}$ is **${REC(rho[y]) ? 'recurrent' : 'transient'}**. After 4000 runs the estimate is $${fr(est2[3999], 3)}$ (truncation at 300 steps biases it down slightly for $\\rho_{yy}$ near 1).\nAll states: ${rho.map((r, k) => `$\\rho_{${k}${k}}=${fr(r, 3)}$`).join(',  ')}`;
        });
        v.readout(() => info);
      },
    },
    {
      num: '5.3.1',
      kind: 'Theorem',
      name: 'y recurrent ⇔ E_y N(y) = ∞',
      statement: String.raw`Let $N(y)=\sum_{n\ge1}1_{\{X_n=y\}}$ be the number of visits to $y$. Then
$$E_yN(y)=\sum_{n=1}^\infty p^n(y,y)=\frac{\rho_{yy}}{1-\rho_{yy}}\quad(\rho_{yy}<1),$$
so $y$ is recurrent if and only if $\sum_{n}p^n(y,y)=\infty$.`,
      idea: String.raw`By 5.2.6 $P_y(N(y)\ge k)=\rho_{yy}^k$, so $N(y)$ is geometric when $\rho_{yy}<1$ and the sum of the tail probabilities gives $\rho_{yy}/(1-\rho_{yy})$; for $\rho_{yy}=1$ every tail equals $1$ and the expectation is infinite. The identity $E_yN(y)=\sum p^n(y,y)$ is just linearity of expectation applied to the indicators.`,
      caption: String.raw`Partial sums $s_K=\sum_{n\le K}p^n(y,y)$ for three situations. A recurrent state (the closed pair of the leaky chain, or the symmetric walk $p=\frac12$, whose sum grows like $\sqrt K$) gives an unbounded curve; a transient one (state $2$ of the leaky chain, or the biased walk) levels off at exactly $\rho_{yy}/(1-\rho_{yy})$ (green). Right: $p^n(y,y)$ itself on log axes.`,
      deps: ['prob-5.3.1a', 'prob-5.2.6'],
      see: ['stoch-3.2'],
      tags: ['recurrence'],
      viz(v) {
        const cs = v.select('case', [{ value: 'walk', label: 'walk on $\\mathbb Z$' }, { value: 'tran', label: 'leaky chain, state 2' }, { value: 'rec', label: 'leaky chain, state 3' }], 'walk');
        const pS = v.slider('walk: up-probability $p$', 0.5, 0.75, 0.5, { step: 0.005 });
        const eS = v.slider('chain: leak $e$', 0.02, 0.5, 0.2, { step: 0.01 });
        const K = 3000;
        const A = v.stage({ x: [0, K], y: [0, 10], axes: 'box', gutter: true, height: 320, xlabel: '$K$', title: 'partial sums $\\sum_{n\\le K}p^n(y,y)$' });
        const B = v.stage({ x: [1, K], xlog: true, y: [1e-4, 1], ylog: true, axes: 'box', gutter: true, height: 320, minWidth: 260, xlabel: '$n$', title: '$p^n(y,y)$', weight: 0.8 });
        let info = '';
        v.render(() => {
          const c = cs.value; pS.el.hidden = c !== 'walk'; eS.el.hidden = c === 'walk';
          const u = new Float64Array(K + 1); let rho;
          if (c === 'walk') {
            const p = pS.value, pq = p * (1 - p); let w = 1; for (let k = 1; 2 * k <= K; k++) { w *= ((2 * (2 * k - 1)) / k) * pq; u[2 * k] = w; } rho = 1 - Math.abs(2 * p - 1);
          } else {
            const P = chain5(eS.value), y = c === 'tran' ? 2 : 3; let vec = [0, 0, 0, 0, 0]; vec[y] = 1;
            for (let n = 1; n <= K; n++) { const nv = [0, 0, 0, 0, 0]; for (let i = 0; i < 5; i++) if (vec[i]) for (let j = 0; j < 5; j++) nv[j] += vec[i] * P[i][j]; vec = nv; u[n] = vec[y]; }
            rho = rhoTo(P, y)[y];
          }
          const idx = Array.from({ length: 150 }, (_, q) => Math.max(1, Math.round(((q + 1) / 150) * K))); let s = 0, j = 0; const pts = [], pu = [];
          for (let n = 1; n <= K; n++) { s += u[n]; if (n === idx[j]) { pts.push([n, s]); if (u[n] > 0) pu.push([n, u[n]]); j++; } }
          const lim = REC(rho) ? Math.max(2, s * 1.1) : Math.max(2, rho / (1 - rho) * 1.25, s * 1.1);
          A.setView([0, K], [0, lim]); A.path(pts, { color: 'accent', width: 2.2 });
          if (!REC(rho)) A.hline(rho / (1 - rho), { color: 'green', width: 2, dash: true });
          B.path(c === 'walk' ? pu.filter((q) => q[0] % 2 === 0) : pu, { color: 'orange', width: 2 });
          info = REC(rho) ? `$\\rho_{yy}=1$: $\\sum_{n\\le ${K}}p^n(y,y)=${fr(s, 2)}$ and the sum diverges (for the walk it grows like $\\sqrt{K}$, for the finite closed class linearly).` : `$\\rho_{yy}=${fr(rho, 4)}$: predicted total $\\rho_{yy}/(1-\\rho_{yy})=${fr(rho / (1 - rho), 3)}$; partial sum at $K=${K}$: $${fr(s, 3)}$.`;
        });
        v.readout(() => info);
      },
    },
    {
      num: '5.3.2',
      kind: 'Theorem',
      name: 'Recurrence is contagious',
      statement: String.raw`If $x$ is recurrent and $\rho_{xy}>0$, then $y$ is recurrent and $\rho_{xy}=\rho_{yx}=1$.`,
      idea: String.raw`Because $\rho_{xy}>0$ the chain can make an excursion from $x$ to $y$ with positive probability. If from $y$ there were a positive probability $1-\rho_{yx}$ of never coming back to $x$, then every visit to $x$ would carry a positive chance of ending in $y$ and never returning, contradicting recurrence of $x$ ($\rho_{xx}=1$). So $\rho_{yx}=1$, and combining the two directions gives $\sum_n p^n(y,y)\ge\sum p^{k}(y,x)p^n(x,x)p^{l}(x,y)=\infty$, using 5.3.1.`,
      caption: String.raw`Wire your own chain: click a node and then another to toggle the edge between them (click the same node twice for a self-loop); every state moves uniformly to its successors. Choose the marked state $x$. Reachable states are ringed. If $x$ is recurrent, all reachable states turn green and the list shows $\rho_{xz}=\rho_{zx}=1$ for each; if $x$ is transient nothing is promised, and indeed you can make a reachable state that never returns to $x$. Reset restores the starting chain.`,
      deps: ['prob-5.3.1'],
      see: ['stoch-3.3'],
      tags: ['recurrence'],
      viz(v) {
        const pos = ringPos(6, 1.05), adj = ADJ6();
        const xS = v.select('marked state $x$', ['0', '1', '2', '3', '4', '5'], '3');
        v.button('Reset', () => { const A = ADJ6(); adj.forEach((r, i) => r.forEach((_, j) => { adj[i][j] = A[i][j]; })); });
        const S = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 400, title: 'click two nodes to toggle an edge' });
        const W = wiring(v, S, pos, adj, () => {});
        let info = '';
        v.render(() => {
          const P = W.P(), x = +xS.value, rx = rhoTo(P, x), recX = REC(rx[x]), reachable = [], lines = [];
          const rhoInto = P.map((_, z) => rhoTo(P, z)); // rhoInto[z][w] = rho_{w z}
          const fills = P.map((_, z) => (REC(rhoInto[z][z]) ? 'green' : 'red'));
          for (let z = 0; z < 6; z++) if (z !== x && rhoInto[z][x] > 1e-12) reachable.push(z);
          reachable.forEach((z) => lines.push(`$\\rho_{${x}${z}}=${fr(rhoInto[z][x], 3)}$, $\\rho_{${z}${x}}=${fr(rx[z], 3)}$ (state ${z} is ${REC(rhoInto[z][z]) ? 'recurrent' : 'transient'})`));
          drawChain(S, P, { pos, fills, rings: P.map((_, z) => z === x || reachable.includes(z)), cur: W.sel, labels: false });
          info = `Marked state ${x} is **${recX ? 'recurrent' : 'transient'}**. States reachable from it: ${reachable.length ? set(reachable) : 'none besides itself'}.\n${lines.join('\n')}${recX ? `\nTheorem check: every reachable state has $\\rho_{xz}=\\rho_{zx}=1$ and is recurrent: ${reachable.every((z) => Math.abs(rhoInto[z][x] - 1) < 1e-8 && Math.abs(rx[z] - 1) < 1e-8 && REC(rhoInto[z][z])) ? 'yes' : 'NO'}.` : ''}`;
        });
        v.readout(() => info);
      },
    },
    {
      num: '5.3.2a',
      kind: 'Definition',
      name: 'Closed and irreducible sets',
      verify: true,
      statement: String.raw`A set $A\subset S$ is **closed** if $x\in A$ and $\rho_{xy}>0$ imply $y\in A$ (equivalently $p(x,y)=0$ for $x\in A$, $y\notin A$): once in $A$ the chain stays in $A$. A set $B$ is **irreducible** if $\rho_{xy}>0$ for all $x,y\in B$ (every state of $B$ can reach every other). The chain is irreducible if $S$ is. The communicating classes of $S$ partition it, and a class is irreducible.`,
      idea: String.raw`Reachability $x\to y$ is transitive, so "$x\to y$ and $y\to x$" is an equivalence relation whose classes are the irreducible pieces; the classes form a partially ordered set under reachability, and a class is closed exactly when it is a *maximal* element, with no arrow leaving it.`,
      caption: String.raw`Wire your own transition graph (click a node, then a second node or the same node, to toggle the edge). The communicating classes are recomputed live and coloured; a thick ring marks the nodes of a **closed** class. The readout lists each class with the probability it leaks out per step from its worst state, and says whether the whole chain is irreducible.`,
      deps: ['prob-5.1.1a'],
      see: ['stoch-1.5'],
      tags: ['markov chains'],
      viz(v) {
        const pos = ringPos(6, 1.05), adj = ADJ6();
        v.button('Reset', () => { const A = ADJ6(); adj.forEach((r, i) => r.forEach((_, j) => { adj[i][j] = A[i][j]; })); });
        const S = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 400, title: 'click two nodes to toggle an edge' });
        const W = wiring(v, S, pos, adj, () => {});
        let info = '';
        v.render(() => {
          const P = W.P(), C = classes(P);
          drawChain(S, P, { pos, fills: C.cls.map((c) => CLS_COL[c % CLS_COL.length]), rings: C.cls.map((c) => C.closed[c]), cur: W.sel, labels: true, minP: 0.02 });
          const lines = C.list.map((mem, c) => { const leak = Math.max(...mem.map((i) => P[i].reduce((s, p, j) => s + (C.cls[j] !== c ? p : 0), 0))); return `class ${set(mem)}: ${C.closed[c] ? '**closed**' : 'not closed'}, largest exit probability $${fr(leak, 3)}$`; });
          info = `${lines.join('\n')}\n${C.list.length === 1 ? 'The chain is **irreducible** (one class, necessarily closed).' : `Not irreducible: ${C.list.length} classes, ${C.closed.filter(Boolean).length} closed.`}`;
        });
        v.readout(() => info);
      },
    },
    {
      num: '5.3.3',
      kind: 'Theorem',
      name: 'Finite closed sets contain a recurrent state',
      statement: String.raw`If $C$ is a finite closed set, then $C$ contains at least one recurrent state; if $C$ is also irreducible, every state of $C$ is recurrent.`,
      idea: String.raw`Started in $C$ the chain spends all its time in the finite set $C$, so if every state had $\rho_{yy}<1$ the expected total $\sum_{y\in C}E_xN(y)=\sum_y \rho_{xy}/(1-\rho_{yy})$ would be finite, yet the total number of visits in infinitely many steps is infinite. Hence some $y\in C$ has $E_xN(y)=\infty$, i.e. is recurrent (5.3.1); contagion (5.3.2) spreads this over an irreducible $C$.`,
      caption: String.raw`Choose a set $C$ and drag the leak $e$ of the five-state chain. Each curve is the mean number of visits to a state up to time $n$ over $200$ seeded runs started in $C$. If $C$ is closed some curve must be unbounded (the dashed line $n/|C|$ is the pigeonhole bound on the largest). Choose $C=\{0,1,2\}$ with $e>0$: $C$ is not closed, the chain escapes, and all of its curves flatten - the hypothesis matters.`,
      deps: ['prob-5.3.2', 'prob-5.3.2a', 'prob-5.3.1'],
      see: ['stoch-3.4'],
      tags: ['recurrence'],
      viz(v) {
        const e = v.slider('leak $e$', 0, 0.5, 0.2, { step: 0.01 });
        const cS = v.select('start set $C$', [{ value: 'all', label: '$\\{0,\\dots,4\\}$' }, { value: 'rec', label: '$\\{3,4\\}$' }, { value: 'tr', label: '$\\{0,1,2\\}$' }], 'all');
        let seed = 1; v.button('Resample', () => { seed++; });
        const T = 3000;
        const s = v.stage({ x: [0, T], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'time $n$', title: 'mean visits to each state up to time $n$' });
        let key = '', M = null;
        const run = (ee, cc, sd) => {
          const k = `${ee}|${cc}|${sd}`; if (k === key) return M; key = k;
          const P = chain5(ee), rg = v.rng(sd * 43 + 5), st = stepper(rg, P), C = cc === 'all' ? [0, 1, 2, 3, 4] : cc === 'rec' ? [3, 4] : [0, 1, 2];
          const acc = Array.from({ length: 5 }, () => new Float64Array(T + 1)), R = 200;
          for (let i = 0; i < R; i++) { let x = C[i % C.length]; const cnt = [0, 0, 0, 0, 0]; for (let n = 1; n <= T; n++) { x = st(x); cnt[x]++; if (n % 10 === 0 || n === T) for (let y = 0; y < 5; y++) acc[y][n] += cnt[y] / R; } }
          return (M = { acc, C });
        };
        let info = '';
        v.render(() => {
          const ee = e.value, cc = cS.value, { acc, C } = run(ee, cc, seed), P = chain5(ee);
          const closed = C.every((i) => P[i].every((p, j) => p < 1e-12 || C.includes(j)));
          const mx = Math.max(...acc.map((a) => a[T])); s.setView([0, T], [0, Math.max(10, mx * 1.1, closed ? T / C.length * 1.05 : 0)]);
          for (let y = 0; y < 5; y++) { const pts = []; for (let n = 0; n <= T; n += 10) pts.push([n, acc[y][n]]); s.path(pts, { color: CLS_COL[y], width: 2 }); }
          if (closed) s.line(0, 0, T, T / C.length, { color: 'muted', dash: true, width: 1.5 });
          const rec = [0, 1, 2, 3, 4].filter((y) => REC(rhoTo(P, y)[y]));
          info = `$C=$ ${set(C)} is **${closed ? 'closed' : 'not closed'}**. Mean visits at $n=${T}$: ${acc.map((a, y) => `$N_{${y}}=${fr(a[T], 1)}$`).join(', ')}. Recurrent states (exact): ${rec.length ? set(rec) : 'none'}.${closed ? ` Largest count $\\ge n/|C|=${fr(T / C.length, 0)}$: ${mx >= T / C.length - 1 ? 'yes' : 'no'}.` : ''}`;
        });
        v.legend([[CLS_COL[0], 'state 0'], [CLS_COL[1], 'state 1'], [CLS_COL[2], 'state 2'], [CLS_COL[3], 'state 3'], [CLS_COL[4], 'state 4']]);
        v.readout(() => info);
      },
    },
    {
      num: '5.3.5',
      kind: 'Theorem',
      name: 'Decomposition theorem',
      statement: String.raw`Let $R=\{y:\rho_{yy}=1\}$ be the set of recurrent states. Then $R=\bigcup_i R_i$ is a disjoint union of closed irreducible sets $R_i$, and every state outside $R$ is transient. (If $x$ is recurrent, its communicating class is closed and consists of recurrent states; a finite chain started in a transient state is eventually absorbed in some $R_i$ with probability $1$.)`,
      idea: String.raw`Contagion (5.3.2) says that the states reachable from a recurrent $x$ are recurrent and lead back to $x$, so they form one communicating class, which is closed because nothing recurrent can leave it. Different recurrent classes cannot communicate. States that are not recurrent are transient by definition.`,
      caption: String.raw`A seven-state chain: transient states $\{0,1,2\}$ (grey) and two closed recurrent classes $\{3,4\}$ (blue) and $\{5,6\}$ (orange). Choose the starting state. Left: the diagram. Middle: six seeded paths leave the grey band and settle in one of the coloured bands forever. Right: the exact absorption probabilities $P_x(\text{absorbed in }R_i)$ (blue bars, from a linear system) against the frequencies in $4000$ simulated runs (gold).`,
      deps: ['prob-5.3.2', 'prob-5.3.2a'],
      tags: ['recurrence', 'markov chains'],
      viz(v) {
        const xS = v.select('start $x$', ['0', '1', '2'], '0');
        let seed = 1; v.button('Resample', () => { seed++; });
        const G = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 320, title: 'transition diagram', minWidth: 250 });
        const Pth = v.stage({ x: [0, 40], y: [-0.5, 6.5], axes: 'box', gutter: true, height: 320, minWidth: 250, xlabel: 'time $n$', yticks: [0, 1, 2, 3, 4, 5, 6], title: 'six paths' });
        const B = v.stage({ x: [-0.5, 2.5], y: [0, 1], axes: 'box', gutter: true, height: 320, minWidth: 200, weight: 0.7, xticks: [[0, 'R₁ = {3,4}'], [1, 'R₂ = {5,6}']], title: 'absorption probability' });
        const fills = ['muted', 'muted', 'muted', 'accent', 'accent', 'orange', 'orange'];
        let key = '', R = null;
        const run = (x, sd) => {
          const k = `${x}|${sd}`; if (k === key) return R; key = k;
          const rg = v.rng(sd * 5 + x), paths = Array.from({ length: 6 }, () => runChain(rg, CHAIN7, x, 40)); let c = 0;
          const st = stepper(rg, CHAIN7);
          for (let i = 0; i < 4000; i++) { let z = x; for (let t = 0; t < 300 && z < 3; t++) z = st(z); if (z === 3 || z === 4) c++; }
          return (R = { paths, f1: c / 4000 });
        };
        let info = '';
        v.render(() => {
          const x = +xS.value, { paths, f1 } = run(x, seed), h = absorbProb(CHAIN7, [3, 4]), C = classes(CHAIN7);
          drawChain(G, CHAIN7, { pos: ringPos(7, 1.1), fills, rings: C.cls.map((c) => C.closed[c]), minP: 0.02 });
          Pth.rect(0, 4.5, 40, 6.5, { fill: 'orange', fillAlpha: 0.12, stroke: false });
          Pth.rect(0, 2.5, 40, 4.5, { fill: 'accent', fillAlpha: 0.12, stroke: false });
          paths.forEach((p, i) => Pth.path(Array.from(p, (z, t) => [t, z]), { color: CLS_COL[i + 2], width: 1.6 }));
          B.bars([h[x], 1 - h[x]], { x0: 0, dx: 1, color: (q, i) => (i === 0 ? 'accent' : 'orange') });
          B.dots([[0, f1], [1, 1 - f1]], { r: 6, color: 'gold' });
          info = `Start $x=${x}$: $P_x(\\text{absorbed in }\\{3,4\\})=${fr(h[x], 4)}$ (simulated $${fr(f1, 3)}$), $P_x(\\text{absorbed in }\\{5,6\\})=${fr(1 - h[x], 4)}$. Decomposition found by the algorithm: transient ${set(C.list.filter((_, c) => !C.closed[c]).flat())}, closed classes ${C.list.filter((_, c) => C.closed[c]).map(set).join(', ')}.`;
        });
        v.legend([['accent', 'exact'], ['gold', 'simulation', { dot: true }]]);
        v.readout(() => info);
      },
    },
    {
      num: '5.3.8',
      kind: 'Theorem',
      name: 'Lyapunov criterion for recurrence',
      statement: String.raw`Let $X_n$ be an irreducible chain on a countable $S$. Suppose there are a finite set $F$ and a function $\varphi\ge0$ such that $\{x:\varphi(x)\le M\}$ is finite for every $M$ (so $\varphi\to\infty$ at infinity) and
$$E_x\varphi(X_1)\le\varphi(x)\qquad(x\notin F).$$
Then $X_n$ is recurrent.`,
      idea: String.raw`Stop the chain when it enters $F$: until then $\varphi(X_n)$ is a nonnegative supermartingale, so (4.8.4) the chance that it ever climbs above $M$ is at most $\varphi(x)/M$. A transient chain would leave every finite set for good, hence on the event of never entering $F$ it would have $\varphi(X_n)\to\infty$; that event therefore has probability $\le\varphi(x)/M$ for every $M$, i.e. zero. So $F$ is entered, then again and again, some state of the finite set $F$ is visited infinitely often, and irreducibility makes every state recurrent.`,
      caption: String.raw`A birth-death chain on $\{0,1,2,\dots\}$ with up-probability $p_x=\frac12+\frac b{x+1}$ ($p_0=1$). Pick $\varphi$ and the outward push $b$: the bars show the drift $E_x\varphi(X_1)-\varphi(x)$ (green if $\le0$, red if positive), and the readout reports the largest $x$ where the drift is positive: the finite set $F=\{0,\dots,x\}$ the criterion needs, or that none was found. For $\varphi=\log(1+x)$ the criterion can succeed for $b$ up to about $1/4$, whereas $\varphi(x)=x$ already fails for every $b>0$ although the chain is then still recurrent for small $b$: the criterion is sufficient, not necessary, and a good $\varphi$ is the art. The right panel is one seeded path.`,
      deps: ['prob-4.8.4', 'prob-5.3.2a'],
      tags: ['recurrence', 'lyapunov'],
      viz(v) {
        const b = v.slider('push outward $b$', 0, 0.6, 0.1, { step: 0.01 });
        const ph = v.select('Lyapunov function $\\varphi$', [{ value: 'x', label: '$x$' }, { value: 'log', label: '$\\log(1+x)$' }, { value: 'sq', label: '$x^2$' }], 'log');
        let seed = 1; v.button('Resample', () => { seed++; });
        const XM = 60;
        const D = v.stage({ x: [0, XM], y: [-0.1, 0.1], axes: 'box', gutter: true, height: 320, xlabel: 'state $x$', title: 'drift $E_x\\varphi(X_1)-\\varphi(x)$' });
        const P = v.stage({ x: [0, 3000], y: [0, 30], axes: 'box', gutter: true, height: 320, minWidth: 280, xlabel: 'time $n$', title: 'one seeded path of the chain' });
        const F = { x: (x) => x, log: (x) => Math.log(1 + x), sq: (x) => x * x };
        let key = '', path = null;
        const sim = (bb, sd) => {
          const k = `${bb}|${sd}`; if (k === key) return path; key = k;
          const rg = v.rng(sd * 3 + 1), out = new Int32Array(3001); let x = 0;
          for (let n = 1; n <= 3000; n++) { x = x === 0 ? 1 : rg() < 0.5 + bb / (x + 1) ? x + 1 : x - 1; out[n] = x; }
          return (path = out);
        };
        let info = '';
        v.render(() => {
          const bb = b.value, f = F[ph.value], drift = (x) => { const p = 0.5 + bb / (x + 1); return p * f(x + 1) + (1 - p) * f(x - 1) - f(x); };
          let last = -1; for (let x = 1; x <= 400; x++) if (drift(x) > 1e-12) last = x;
          const vals = Array.from({ length: XM }, (_, i) => drift(i + 1)), mx = Math.max(...vals.map(Math.abs), 1e-6);
          D.setView([0, XM + 1], [-mx * 1.3, mx * 1.3]);
          vals.forEach((d, i) => D.rect(i + 0.6, 0, i + 1.4, d, { fill: d <= 1e-12 ? 'green' : 'red', fillAlpha: 0.6, stroke: false }));
          D.hline(0, { color: 'ink' });
          const X = sim(bb, seed); let mxx = 5, z = 0; for (let n = 0; n <= 3000; n++) { mxx = Math.max(mxx, X[n]); if (X[n] === 0) z++; }
          P.setView([0, 3000], [0, mxx * 1.1]); P.path(Array.from({ length: 3001 }, (_, n) => [n, X[n]]), { color: 'accent', width: 1.2 });
          info = last < 0 ? `Drift $\\le0$ for every $x\\ge1$ checked up to 400: the criterion holds with $F=\\{0\\}$ (so the chain is recurrent). Visits to $0$ in the seeded path: ${z}.` : last >= 400 ? `Drift still positive at $x=400$: the criterion **fails** for this $\\varphi$ (it says nothing about recurrence). Visits to $0$ in the seeded path: ${z}.` : `Drift $\\le0$ for all $x>${last}$: the criterion holds with the finite set $F=\\{0,\\dots,${last}\\}$ (checked to $x=400$), so the chain is recurrent. Visits to $0$ in the seeded path: ${z}.`;
        });
        v.readout(() => info);
      },
    },
    {
      num: '5.3.10',
      kind: 'Theorem',
      name: 'Exit probabilities of birth-and-death chains',
      statement: String.raw`Let $X_n$ be a birth-and-death chain on the integers with $p(i,i+1)=p_i$, $p(i,i-1)=q_i=1-p_i$, all $p_i\in(0,1)$. Define the scale function $s$ by $s(0)=0$, $s(x+1)-s(x)=\prod_{j=1}^{x}\frac{q_j}{p_j}$ (empty product $1$). For $a<x<b$,
$$P_x(T_a<T_b)=\frac{s(b)-s(x)}{s(b)-s(a)},$$
where $T_z$ is the hitting time of $z$ (and $s(X_n)$ is a martingale up to the exit time).`,
      idea: String.raw`The recursion $p_x(s(x+1)-s(x))=q_x(s(x)-s(x-1))$ says exactly that $s$ is harmonic: $E_xs(X_1)=s(x)$. So $s(X_{n\wedge T})$ is a bounded martingale up to $T=T_a\wedge T_b$, and optional stopping (4.8.2) gives $s(x)=s(a)P_x(T_a<T_b)+s(b)P_x(T_b<T_a)$, which is the formula once $P_x(T_b<T_a)=1-P_x(T_a<T_b)$.`,
      caption: String.raw`Sites $0,\dots,12$. Drag the orange handles to set each up-probability $p_i$ (or use a preset). Choose the exit interval $[a,b]$. Blue bars are the exact $P_x(T_a<T_b)$ from the scale function; gold dots are simulation frequencies (600 seeded runs per starting point). The right panel plots $s(x)$ itself: where $s$ is steep the exit probability falls quickly, where it is flat it barely changes.`,
      deps: ['prob-4.8.2'],
      see: ['stoch-2.4'],
      tags: ['birth-death', 'optional stopping'],
      viz(v) {
        const K = 12;
        const aS = v.slider('left exit $a$', 0, 8, 0, { int: true }), bS = v.slider('right exit $b$', 4, K, K, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const pv = Array(K + 1).fill(0.5);
        const Hs = v.stage({ x: [-0.5, K + 0.5], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'site $i$', title: 'up-probabilities $p_i$ (drag)', minWidth: 260 });
        const hs = []; for (let i = 1; i < K; i++) { const h = Hs.handle(i, 0.5, { color: 'orange', r: 7, constrain: { x: [i, i], y: [0.08, 0.92] } }); h.onDrag = () => { pv[i] = h.y; }; hs.push(h); }
        const preset = (f) => { hs.forEach((h, k) => { const i = k + 1, y = Math.min(0.92, Math.max(0.08, f(i))); h.set(i, y); pv[i] = y; }); };
        v.button('Fair', () => preset(() => 0.5)); v.button('Push right', () => preset((i) => 0.6)); v.button('Push left', () => preset((i) => 0.4)); v.button('Wall at 6', () => preset((i) => (i < 6 ? 0.65 : 0.35)));
        const B = v.stage({ x: [-0.5, K + 0.5], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'start $x$', title: '$P_x(T_a<T_b)$', minWidth: 260 });
        const Sc = v.stage({ x: [-0.5, K + 0.5], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'site $x$', title: 'scale function $s(x)$', minWidth: 220, weight: 0.8 });
        let key = '', sims = null;
        const simulate = (a, b, sd) => {
          const k = `${a}|${b}|${sd}|${pv.join()}`; if (k === key) return sims; key = k;
          const rg = v.rng(sd * 19 + a * 7 + b), out = [];
          for (let x = a + 1; x < b; x++) { let c = 0; for (let r = 0; r < 600; r++) { let z = x; while (z > a && z < b) z += rg() < pv[z] ? 1 : -1; if (z === a) c++; } out[x] = c / 600; }
          return (sims = out);
        };
        let info = '';
        v.render(() => {
          const a = Math.min(aS.value, bS.value - 2), b = bS.value; for (let i = 1; i < K; i++) hs[i - 1].set(i, pv[i]);
          const dl = [1]; for (let x = 1; x < K; x++) dl[x] = dl[x - 1] * ((1 - pv[x]) / pv[x]);
          const s = [0]; for (let x = 0; x < K; x++) s[x + 1] = s[x] + dl[x];
          const ex = (x) => (s[b] - s[x]) / (s[b] - s[a]), sm = simulate(a, b, seed);
          const pts = []; let worst = 0;
          for (let x = a; x <= b; x++) pts.push(ex(x));
          B.bars(pts, { x0: a, dx: 1, color: 'accent' });
          B.dots(pts.map((_, k) => [a + k, a + k === a ? 1 : a + k === b ? 0 : sm[a + k]]), { r: 5, color: 'gold' });
          for (let x = a + 1; x < b; x++) worst = Math.max(worst, Math.abs(ex(x) - sm[x]));
          const ms = s[K];
          Sc.path(s.map((q, x) => [x, q / ms]), { color: 'purple', width: 2 });
          Sc.dots(s.map((q, x) => [x, q / ms]), { r: 4, color: 'purple' });
          Sc.tex(`s(${K})=${fr(ms, 2)}`, 0.5, 0.92, { size: 11, color: 'muted', align: 'left' });
          info = `Exit interval $[${a},${b}]$: largest gap between formula and simulation $${fr(worst, 3)}$ (standard error about $0.02$). Midpoint $x=${Math.floor((a + b) / 2)}$: formula $${fr(ex(Math.floor((a + b) / 2)), 4)}$.`;
        });
        v.legend([['accent', 'scale-function formula'], ['gold', 'simulation', { dot: true }]]);
        v.readout(() => info);
      },
    },
    {
      num: '5.3.11',
      kind: 'Theorem',
      name: 'Recurrence criterion for birth-and-death chains',
      statement: String.raw`Let $X_n$ be an irreducible birth-and-death chain on $\{0,1,2,\dots\}$ with up-probabilities $p_x$ and down-probabilities $q_x=1-p_x$ ($q_0=0$). Then $X_n$ is recurrent if and only if
$$\sum_{m=0}^{\infty}\prod_{j=1}^{m}\frac{q_j}{p_j}=\infty.$$`,
      idea: String.raw`With $s$ the scale function of 5.3.10, the chain started at $0$ reaches level $N$ before returning to $0$ with probability $P_0(T_N<T_0)=p_0/s(N)$. The chain is recurrent exactly when this escape probability tends to $0$ as $N\to\infty$, i.e. when $s(N)=\sum_{m<N}\prod_{j\le m}q_j/p_j\to\infty$. (Reaching ever higher levels without returning is the only way to be transient on a half-line.)`,
      caption: String.raw`Choose a family of up-probabilities and the parameter $b$. Left: the partial sums $s(M)=\sum_{m<M}\prod_{j\le m}q_j/p_j$ on log-log axes - a curve that keeps rising is divergence. Right: the escape probability $1/s(N)$ of reaching level $N$ before returning to $0$ (orange line), with simulated frequencies (gold; hollow if no run escaped in 3000). With $p_x=\frac12+\frac b{x+1}$ the sum diverges exactly for $b\le\frac14$ (at $b=\frac14$ only like $\log M$); with $p_x=\frac12+\frac b{\sqrt{x+1}}$ any $b>0$ is transient.`,
      deps: ['prob-5.3.10'],
      see: ['stoch-1.10'],
      tags: ['birth-death', 'recurrence'],
      viz(v) {
        const fam = v.select('family', [{ value: 'inv', label: '$\\frac12+\\frac{b}{x+1}$' }, { value: 'sqrt', label: '$\\frac12+\\frac{b}{\\sqrt{x+1}}$' }, { value: 'const', label: '$\\frac12+b$' }], 'inv');
        const b = v.slider('parameter $b$', -0.2, 0.5, 0.25, { step: 0.005 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const MM = 10000;
        const A = v.stage({ x: [1, MM], xlog: true, y: [1, 1e3], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$M$', title: 'partial sums $s(M)$' });
        const E = v.stage({ x: [1, 64], xlog: true, y: [1e-4, 1], ylog: true, axes: 'box', gutter: true, height: 320, minWidth: 260, xlabel: 'level $N$', title: 'escape probability $P_0(T_N<T_0)=1/s(N)$' });
        let key = '', sim = null;
        const pOf = (f, bb, x) => Math.min(0.98, Math.max(0.02, f === 'inv' ? 0.5 + bb / (x + 1) : f === 'sqrt' ? 0.5 + bb / Math.sqrt(x + 1) : 0.5 + bb));
        const run = (f, bb, sd) => {
          const k = `${f}|${bb}|${sd}`; if (k === key) return sim; key = k;
          const rg = v.rng(sd * 23 + 1), out = {};
          for (const N of [2, 4, 8, 16, 32, 64]) { let c = 0; for (let r = 0; r < 3000; r++) { let z = 1; while (z > 0 && z < N) z += rg() < pOf(f, bb, z) ? 1 : -1; if (z === N) c++; } out[N] = c / 3000; }
          return (sim = out);
        };
        let info = '';
        v.render(() => {
          const f = fam.value, bb = b.value, s = new Float64Array(MM + 1); let prod = 1, acc = 0;
          for (let m = 0; m <= MM; m++) { if (m >= 1) prod *= (1 - pOf(f, bb, m)) / pOf(f, bb, m); acc += prod; s[m + 0] = acc; }
          // s[m] = sum_{k=0}^{m} prod_k ; partial sum over m < M is s[M-1]
          const idx = logInts(1, MM, 150), pts = idx.map((M) => [M, Math.max(1, Math.min(1e300, s[M - 1]))]).filter((q) => isFinite(q[1]));
          A.setView([1, MM], [1, Math.max(10, ...pts.map((q) => q[1])) * 1.5]); A.path(pts, { color: 'accent', width: 2.2 });
          const sN = (N) => s[N - 1], esc = Array.from({ length: 64 }, (_, i) => [i + 1, Math.max(1e-4, 1 / sN(i + 1))]);
          E.path(esc, { color: 'orange', width: 2.2 });
          const sm = run(f, bb, seed);
          Object.entries(sm).forEach(([N, fr3]) => { E.dot(+N, Math.max(fr3, 1 / 3000), { r: 6, color: 'gold', hollow: fr3 === 0 }); });
          const r1 = s[99], r2 = s[999], r3 = s[9999], d1 = r2 - r1, d2 = r3 - r2;
          info = `$s(10^2)=${fr(r1, 2)}$, $s(10^3)=${fr(r2, 2)}$, $s(10^4)=${fr(r3, 2)}$. Gain per decade: $${fr(d1, 2)}$ then $${fr(d2, 2)}$, ratio $${fr(d2 / d1, 2)}$: ${d2 / d1 >= 0.7 ? 'the gain does not shrink - the series diverges (recurrent), even if as slowly as $\\log M$' : 'the gain shrinks fast - the series converges (transient)'}. Escape to level 64: formula $${fr(1 / sN(64), 4)}$, simulated $${fr(sm[64], 4)}$.`;
        });
        v.legend([['accent', 'partial sums'], ['orange', 'escape probability'], ['gold', 'simulation', { dot: true }]]);
        v.readout(() => info);
      },
    },
  ],
};
