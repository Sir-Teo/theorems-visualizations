// Probability: Theory and Examples (Durrett) — Chapter 5, part Z1: periodicity, convergence and tail fields (§5.6-5.7)
import { CLS, gcd, gcdAll, retTimes, ringChord, circlePos, drawGraph, cyclicChain, adjOfP, vecP, tvd, stationary, stepFrom, bfs, reflWalk, fx } from './ch05-z.shared.js';
import { logChoose } from './ch04-z.shared.js';

const markovDef = 'prob-5.1.1a';

export default {
  collection: 'prob',
  chapter: 5,
  items: [
    {
      num: '5.6.1',
      kind: 'Theorem',
      name: 'Visit frequencies converge to 1/E_yT_y',
      statement: String.raw`Let $y$ be a recurrent state of a Markov chain with $\rho_{xy}=P_x(T_y<\infty)$, and let $N_n(y)=\sum_{m\le n}\mathbf 1_{(X_m=y)}$. Then
$$\frac{N_n(y)}{n}\ \longrightarrow\ \frac{\mathbf 1_{(T_y<\infty)}}{E_yT_y}\qquad P_x\text{-a.s.},$$
where $1/\infty:=0$. So if $y$ is positive recurrent the long-run fraction of time spent at $y$ is $1/E_yT_y$; if $y$ is null recurrent, or $y$ is transient, it is $0$.`,
      idea: String.raw`By the strong Markov property (5.2.5) the successive return times $T_y^k-T_y^{k-1}$ are i.i.d. with mean $E_yT_y$ once the chain has hit $y$. The strong law (2.4.1) gives $T_y^k/k\to E_yT_y$. Between the $k$-th and $(k{+}1)$-st visit the counter $N_n(y)$ equals $k$, so $N_n(y)/n$ is squeezed between $k/T_y^{k+1}$ and $k/T_y^{k}$ and both sides tend to $1/E_yT_y$.`,
      caption: String.raw`Five independent runs of a reflecting walk on $\{0,1,2,\dots\}$ (from $0$ it must step to $1$; elsewhere it steps up with probability $q$). Curves show the fraction of time at $0$ against $n$ on a log axis. Switch $q$: with $q<\tfrac12$ the curves home in on $1/E_0T_0=\frac{1-2q}{2-2q}$; at $q=\tfrac12$ the walk is null recurrent and the fraction creeps to $0$ like $n^{-1/2}$; for $q>\tfrac12$ it is transient and the fraction drops to $0$ quickly.`,
      deps: ['prob-5.2.5', 'prob-2.4.1'],
      see: ['stoch-4.13'],
      tags: ['ergodic theorems', 'markov chains'],
      viz(v) {
        const qS = v.select('up-probability $q$', [{ value: 0.4, label: '$q=0.4$ (positive)' }, { value: 0.5, label: '$q=0.5$ (null)' }, { value: 0.6, label: '$q=0.6$ (transient)' }], 0.4);
        const nS = v.slider('$n$', 100, 20000, 5000, { log: true, int: true });
        let seed = 1; v.button('New runs', () => { seed++; });
        const S = v.stage({ x: [100, 20000], xlog: true, y: [0, 0.6], height: 340, axes: 'box', gutter: true, xlabel: '$n$', title: String.raw`$N_n(0)/n$, five runs` });
        const NMAX = 20000, PTS = [];
        for (let k = 0; k <= 80; k++) PTS.push(Math.round(100 * Math.pow(200, k / 80)));
        let key = '', runs = null;
        const get = () => {
          const kk = qS.value + '|' + seed; if (kk === key) return runs; key = kk;
          runs = [0, 1, 2, 3, 4].map((i) => {
            const p = reflWalk(qS.value, NMAX, v.rng(seed * 31 + i * 7 + 3)); let c = 0; const out = []; let pi = 0;
            for (let t = 1; t <= NMAX; t++) { if (p[t] === 0) c++; while (pi < PTS.length && PTS[pi] === t) { out.push([t, c / t]); pi++; } }
            return { pts: out, at: (n) => { let c2 = 0; for (let t = 1; t <= n; t++) if (p[t] === 0) c2++; return c2 / n; } };
          });
          return runs;
        };
        const pi0 = (q) => (q < 0.5 ? (1 - 2 * q) / (2 - 2 * q) : 0);
        v.render(() => {
          const rs = get(), q = qS.value, tgt = pi0(q);
          rs.forEach((r) => S.path(r.pts, { color: 'accent', width: 1.5, alpha: 0.75 }));
          S.hline(tgt, { color: 'green', width: 2.4, dash: [8, 5] });
          S.vline(nS.value, { color: 'gold', width: 1.4, dash: true });
          S.text(q < 0.5 ? '1/E₀T₀' : '0', 120, tgt + 0.025, { color: 'green', size: 12 });
        });
        v.legend([['accent', 'run of $N_n(0)/n$'], ['green', 'limit $1/E_0T_0$', { dash: true }], ['gold', '$n$', { dash: true }]]);
        v.readout(() => {
          const rs = get(), q = qS.value, n = Math.round(nS.value), vals = rs.map((r) => r.at(n));
          const lim = q < 0.5 ? `$1/E_0T_0=${fx(pi0(q), 4)}$ ($E_0T_0=${fx(1 / pi0(q), 2)}$)` : q === 0.5 ? '$E_0T_0=\\infty$, limit $0$' : 'transient, limit $0$';
          return `At $n=${n}$ the five fractions are ${vals.map((x) => fx(x, 3)).join(', ')}; ${lim}.`;
        });
      },
    },
    {
      num: '5.6.2a',
      kind: 'Definition',
      name: 'Period of a state',
      statement: String.raw`The **period** of a state $x$ is $d_x=\gcd\{n\ge1:\ p^n(x,x)>0\}$, the greatest common divisor of the lengths of closed paths through $x$ (taken as undefined, or $\infty$, if there are none). The state is **aperiodic** if $d_x=1$.`,
      idea: String.raw`Only the pattern of which return times are possible matters, not their probabilities, so the period can be read off the transition graph. Return to $x$ in $m$ steps and in $n$ steps implies return in $m+n$ steps, so the set of return times is closed under addition. A self-loop gives return time $1$ at once; an odd cycle added to an even one makes the gcd odd, and coprime cycle lengths drive it to $1$.`,
      caption: String.raw`A directed ring $0\to1\to\dots\to L-1\to0$ with an optional chord from $M-1$ back to $0$ (a second cycle of length $M$) and an optional self-loop at $0$. The bar chart lists every $n\le40$ at which a closed path of length $n$ from $0$ exists. Move $M$ or add the loop and watch the gcd collapse to $1$.`,
      deps: [markovDef],
      see: ['stoch-1.6'],
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), §5.6, p. 312 (definition before Example 5.6.3)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      tags: ['periodicity'],
      scope: String.raw`Durrett defines the period through $\{n\ge1: p^n(x,x)>0\}$; the page uses the same gcd definition, with $p^n$ replaced by its support (existence of a path).`,
      viz(v) {
        const L = v.slider('ring length $L$', 2, 9, 6, { int: true });
        const M = v.slider('chord length $M$', 1, 9, 9, { int: true });
        const loop = v.toggle('self-loop at 0', false);
        const G = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 320, title: 'transition graph' });
        const B = v.stage({ x: [0, 41], y: [0, 1.4], height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: String.raw`$n$ with $p^n(0,0)>0$` });
        v.render(() => {
          const l = L.value, m = Math.min(M.value, l), adj = ringChord(l, m, loop.value), rt = retTimes(adj, 0, 40), d = gcdAll(rt);
          drawGraph(G, circlePos(l, 1.1), adj, { colors: adj.map((_, i) => (i === 0 ? 'orange' : 'accent')), hl: 0 });
          const vals = Array.from({ length: 40 }, (_, i) => (rt.includes(i + 1) ? 1 : 0));
          B.bars(vals, { x0: 1, color: 'green' });
          for (let k = d; k <= 40 && d > 1; k += d) B.vline(k, { color: 'orange', width: 1, alpha: 0.45, dash: true });
          B.text(`d = ${d || '—'}`, 38, 1.25, { size: 14, color: 'ink', align: 'right' });
        });
        v.readout(() => {
          const l = L.value, m = Math.min(M.value, l), rt = retTimes(ringChord(l, m, loop.value), 0, 40), d = gcdAll(rt);
          const cyc = [l, ...(m < l ? [m] : []), ...(loop.value ? [1] : [])];
          return `Cycle lengths through $0$: ${cyc.join(', ')}. First return times: ${rt.slice(0, 8).join(', ')}…\n$d_0=\\gcd=${d}$${d === 1 ? ' — aperiodic' : ''}.`;
        });
      },
    },
    {
      num: '5.6.4',
      kind: 'Lemma',
      name: 'Period is a class property',
      statement: String.raw`If $x\leftrightarrow y$ (each can be reached from the other), then $d_x=d_y$. In an irreducible chain all states therefore have the same period, called the period of the chain.`,
      idea: String.raw`Choose $a,b$ with $p^a(x,y)>0$ and $p^b(y,x)>0$. Then $a+b$ is a return time to $x$, and so is $a+k+b$ for every return time $k$ of $y$; hence $d_x$ divides $a+b$ and $a+b+k$, so $d_x$ divides every return time $k$ of $y$, i.e. $d_x\mid d_y$. Swapping the roles gives $d_y\mid d_x$.`,
      caption: String.raw`A random irreducible chain built with $d$ cyclic classes. Each state is coloured by its period, computed on its own from return times $\le 60$, and the bars show the numbers. Press **New chain** for another graph; switch on the extra edge to break the cyclic structure and see every state's period fall to $1$ together, never one at a time.`,
      deps: ['prob-5.6.2a'],
      tags: ['periodicity'],
      viz(v) {
        const dS = v.select('design period $d$', [2, 3, 4].map((d) => ({ value: d, label: String(d) })), 3);
        const ex = v.toggle('add a shortcut edge', false);
        let seed = 1; v.button('New chain', () => { seed++; });
        const G = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 340, title: 'states coloured by period' });
        const B = v.stage({ x: [0, 13], y: [0, 5], height: 340, axes: 'box', gutter: true, xlabel: 'state', ylabel: '$d_x$', title: 'period of each state' });
        let key = '', ch = null, per = null;
        const get = () => { const k = dS.value + '|' + ex.value + '|' + seed; if (k !== key) { key = k; ch = cyclicChain(dS.value, 12 / dS.value > 3 ? 3 : Math.floor(12 / dS.value), v.rng(seed * 13 + 5), ex.value); per = ch.adj.map((_, i) => gcdAll(retTimes(ch.adj, i, 60))); } return { ch, per }; };
        v.render(() => {
          const { ch: c, per: p } = get();
          drawGraph(G, circlePos(c.n, 1.15), c.adj, { colors: p.map((d) => CLS[(d - 1) % CLS.length]), rad: 0.11 });
          B.setView([0, c.n + 1], [0, 5]);
          B.bars(p, { x0: 1, color: (val) => CLS[(val - 1) % CLS.length] });
        });
        v.readout(() => { const { ch: c, per: p } = get(); const same = p.every((d) => d === p[0]); return `Periods: ${p.join(', ')} — ${same ? `all equal to ${p[0]}` : 'not all equal'} (${c.n} states, designed period ${ex.value ? '1 after the shortcut' : dS.value}).`; });
      },
    },
    {
      num: '5.6.5',
      kind: 'Lemma',
      name: 'Aperiodic states return at all large times',
      statement: String.raw`If $x$ has period $1$, there is $n_0$ such that $p^n(x,x)>0$ for all $n\ge n_0$.`,
      idea: String.raw`The set $I$ of return times is closed under addition, and its gcd is $1$. A set of positive integers closed under addition and with gcd $1$ contains two consecutive integers $m$ and $m+1$ (write $1$ as an integer combination of its elements and split into positive and negative parts). Then every $n\ge m^2$ is $km+j(m+1)$-representable: write $n=km+r$ with $0\le r\le k$ and use $r$ copies of $m+1$ and $k-r$ copies of $m$.`,
      caption: String.raw`Choose cycle lengths $a,b$ (and optionally $c$) through $x$. Green bars are the integers $n$ for which a closed path of length $n$ exists, i.e. sums of the cycle lengths. When the gcd is $1$ the green set swallows every integer past the last grey gap (for two coprime lengths this gap is $ab-a-b$); when the gcd is $g>1$ only multiples of $g$ ever appear.`,
      deps: ['prob-5.6.2a'],
      see: ['stoch-1.7'],
      tags: ['periodicity'],
      viz(v) {
        const A = v.slider('cycle length $a$', 2, 14, 3, { int: true });
        const Bs = v.slider('cycle length $b$', 2, 14, 5, { int: true });
        const C = v.slider('third length $c$ (1 = off)', 1, 14, 1, { int: true });
        const NN = 90;
        const rep = () => { const gens = [A.value, Bs.value, ...(C.value > 1 ? [C.value] : [])], ok = new Uint8Array(NN + 1); ok[0] = 1; for (let n = 1; n <= NN; n++) ok[n] = gens.some((g) => n >= g && ok[n - g]) ? 1 : 0; return { gens, ok }; };
        const S = v.stage({ x: [0, NN + 1], y: [0, 1.5], height: 300, axes: 'box', gutter: true, xlabel: '$n$', title: String.raw`closed-path lengths $n$ from $x$` });
        v.render(() => {
          const { gens, ok } = rep(), g = gcdAll(gens);
          S.bars(Array.from({ length: NN }, (_, i) => (ok[i + 1] || (i + 1) % g === 0 ? 1 : 0.3)), { x0: 1, color: (val, i) => (ok[i + 1] ? 'green' : (i + 1) % g === 0 ? 'red' : 'grid') });
          let last = -1; for (let n = 1; n <= NN; n++) if (n % g === 0 && !ok[n]) last = n;
          if (last > 0) S.vline(last, { color: 'red', width: 1.5, dash: true });
        });
        v.legend([['green', 'return possible'], ['red', 'multiple of $g$ but not reachable']]);
        v.readout(() => {
          const { gens, ok } = rep(), g = gcdAll(gens); let last = 0; for (let n = 1; n <= NN; n++) if (n % g === 0 && !ok[n]) last = n;
          const [a, b] = [A.value, Bs.value];
          const th = C.value === 1 && gcd(a, b) === 1 ? ` (formula $ab-a-b=${a * b - a - b}$)` : '';
          return `Lengths ${gens.join(', ')}; $\\gcd=${g}$. ${g === 1 ? `Every $n>${last}$ is reachable: last gap at $n=${last || '—'}$${th}.` : `Only multiples of ${g} ever occur; among them the last gap is $n=${last}$.`}`;
        });
      },
    },
    {
      num: '5.6.6',
      kind: 'Theorem',
      name: 'Convergence theorem (coupling)',
      statement: String.raw`Let $p$ be irreducible, aperiodic, with a stationary distribution $\pi$. Then for every initial state $x$ and all $y$,
$$p^n(x,y)\to\pi(y)\quad(n\to\infty),$$
and, in fact, $\sum_y|p^n(x,y)-\pi(y)|\to0$. More precisely, if $(X_n,Y_n)$ are independent copies of the chain run until they first meet at $T$ and move together afterwards, with $X_0=x$ and $Y_0\sim\pi$, then $\|p^n(x,\cdot)-\pi\|_{TV}\le P(T>n)$.`,
      idea: String.raw`The product chain on pairs has the stationary distribution $\pi\times\pi$ so it is recurrent (5.5.10); aperiodicity of $p$ (via 5.6.5) makes the product chain irreducible, so the two copies meet almost surely. After the meeting time the copy started at $x$ has the same law as the one started at $\pi$, which is stationary at every time. Hence $|P(X_n\in B)-\pi(B)|\le P(T>n)\to0$.`,
      links: { thesis: 'https://numdam.org/item/THESE_1938__204__1_0/' },
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 5.6.6 and coupling proof, pp. 313–315'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      caption: String.raw`Left: the exact total variation distance from $\pi$ (green) and the simulated coupling tail $P(T>n)$ (orange, 1500 runs) for the chain started at state $0$; the true coupling tail bounds the green curve; the sampled orange curve has Monte Carlo error. Right: one coupled pair, with the meeting time marked. Switch to the periodic chain: the independent copies may sit in different classes forever, $P(T>n)$ stalls at about $\tfrac12$, and the distance does not tend to $0$.`,
      deps: ['prob-5.6.5', 'prob-5.5.10', 'prob-5.3.1'],
      see: ['stoch-4.7', 'stoch-5.7'],
      tags: ['convergence', 'coupling'],
      scope: String.raw`Needs irreducible, aperiodic and a stationary distribution. The attribution to Doeblin concerns the coupling idea for finite chains; the exact form of the theorem is the textbook's.`,
      viz(v) {
        const mode = v.select('chain', [{ value: 'ap', label: 'aperiodic' }, { value: 'per', label: 'period 2' }], 'ap');
        const nS = v.slider('$n$', 0, 30, 6, { int: true });
        let seed = 1; v.button('New coupled run', () => { seed++; });
        const L = v.stage({ x: [0, 30], y: [1e-4, 1.2], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: '$n$', title: String.raw`distance to $\pi$` });
        const R = v.stage({ x: [0, 30], y: [-0.5, 5.5], height: 330, axes: 'box', gutter: true, xlabel: '$n$', title: String.raw`a coupled pair $(X_n,Y_n)$` });
        const NS = 6, NM = 30;
        const AP = [[0.2, 0.5, 0.3, 0, 0, 0], [0, 0.1, 0.4, 0.5, 0, 0], [0.3, 0, 0, 0.3, 0.4, 0], [0, 0, 0.5, 0, 0.2, 0.3], [0.4, 0, 0, 0.3, 0.3, 0], [0.5, 0, 0, 0, 0.2, 0.3]];
        const chains = {};
        const build = (m) => {
          if (chains[m]) return chains[m];
          const P = m === 'ap' ? AP : cyclicChain(2, 3, v.rng(11)).P, pi = stationary(P);
          let mu = Array(NS).fill(0); mu[0] = 1; const tv = [];
          for (let n = 0; n <= NM; n++) { tv.push(tvd(mu, pi)); mu = vecP(mu, P); }
          const r = v.rng(99), cand = [], RUNS = 1500, meet = new Int32Array(NM + 1);
          const draw = () => { let u = r(), c = 0; for (let j = 0; j < NS; j++) { c += pi[j]; if (u < c) return j; } return NS - 1; };
          for (let k = 0; k < RUNS; k++) { let x = 0, y = draw(), T = x === y ? 0 : Infinity; for (let n = 1; n <= NM && T === Infinity; n++) { x = stepFrom(P, x, r); y = stepFrom(P, y, r); if (x === y) T = n; } if (T <= NM) for (let n = T; n <= NM; n++) meet[n]++; cand.push(T); }
          const tail = Array.from({ length: NM + 1 }, (_, n) => 1 - meet[n] / RUNS);
          return (chains[m] = { P, pi, tv, tail });
        };
        const pair = () => {
          const { P, pi } = build(mode.value), r = v.rng(seed * 17 + 1); const draw = () => { let u = r(), c = 0; for (let j = 0; j < NS; j++) { c += pi[j]; if (u < c) return j; } return NS - 1; };
          let x = 0, y = draw(), T = x === y ? 0 : -1; const X = [x], Y = [y];
          for (let n = 1; n <= NM; n++) { if (T >= 0) { x = stepFrom(P, x, r); y = x; } else { x = stepFrom(P, x, r); y = stepFrom(P, y, r); if (x === y) T = n; } X.push(x); Y.push(y); }
          return { X, Y, T };
        };
        v.render(() => {
          const c = build(mode.value), n = nS.value;
          L.path(c.tv.map((t, i) => [i, Math.max(1e-4, t)]), { color: 'green', width: 2.2 });
          L.path(c.tail.map((t, i) => [i, Math.max(1e-4, t)]), { color: 'orange', width: 2.2 });
          c.tv.forEach((t, i) => L.dot(i, Math.max(1e-4, t), { color: 'green', r: 2.5 }));
          L.vline(n, { color: 'gold', width: 1.4, dash: true });
          const q = pair();
          R.path(q.X.map((s, i) => [i, s]), { color: 'accent', width: 2 });
          R.path(q.Y.map((s, i) => [i, s + 0.08]), { color: 'orange', width: 2, dash: [6, 4] });
          if (q.T >= 0) { R.vline(q.T, { color: 'gold', width: 1.6, dash: true }); R.text('meet', q.T + 0.3, 5.1, { color: 'gold', size: 12 }); }
          else R.text('no meeting yet', 1, 5.1, { color: 'red', size: 12 });
        });
        v.legend([['green', '$\\|p^n(0,\\cdot)-\\pi\\|_{TV}$'], ['orange', '$P(T>n)$ (simulated)'], ['accent', '$X_n$ from $0$'], ['orange', '$Y_n$ from $\\pi$', { dash: true }]]);
        v.readout(() => { const c = build(mode.value), n = nS.value; return `At $n=${n}$: exact distance $${fx(c.tv[n], 4)}$; sampled $P(T>n)\\approx${fx(c.tail[n], 4)}\\pm${fx(2*Math.sqrt(c.tail[n]*(1-c.tail[n])/1500),4)}$ (two standard errors). The theoretical bound uses the true tail.${mode.value === 'per' ? ' The chain has period 2: the distance does not tend to 0.' : ''}`; });
      },
    },
    {
      num: '5.7.1',
      kind: 'Lemma',
      name: 'Cyclic decomposition of a periodic chain',
      statement: String.raw`Let $p$ be irreducible with period $d$. Fix a state $x_0$. Then the state space splits into $d$ disjoint classes $C_0,\dots,C_{d-1}$, where $C_r$ is the set of states reachable from $x_0$ in $n$ steps for some $n\equiv r\pmod d$, such that $p(y,z)>0$ with $y\in C_r$ forces $z\in C_{r+1\bmod d}$. The chain moves $C_0\to C_1\to\dots\to C_{d-1}\to C_0$ deterministically in class, and $p^d$ restricted to each $C_r$ is irreducible and aperiodic.`,
      idea: String.raw`If $y$ were reachable from $x_0$ in both $m$ and $n$ steps with $m\not\equiv n\pmod d$, then going from $y$ back to $x_0$ in some $k$ steps would give return times $m+k$ and $n+k$ whose gcd cannot be divisible by $d$, contradicting 5.6.4. So the residue of a path length is determined by the endpoint; one step shifts it by one.`,
      caption: String.raw`Choose a designed period $d$ and press **New chain**. With *arrange by class* off the states sit on a circle in a scrambled order, with it on the classes are columns and every arrow points one column to the right (cyclically). The classes are computed here from breadth-first distances, not from the construction. Drag $n$ to follow a path; the right panel shows the class index rotating.`,
      deps: ['prob-5.6.4'],
      tags: ['periodicity'],
      viz(v) {
        const dS = v.select('period $d$', [2, 3, 4].map((d) => ({ value: d, label: String(d) })), 3);
        const arr = v.toggle('arrange by class', true);
        const nS = v.slider('path length $n$', 0, 18, 7, { int: true });
        let seed = 1; v.button('New chain', () => { seed++; });
        const G = v.stage({ x: [-1.6, 1.6], y: [-1.5, 1.5], equal: true, axes: false, height: 340, title: 'the chain' });
        const R = v.stage({ x: [0, 18], y: [-0.5, 4], height: 340, axes: 'box', gutter: true, xlabel: '$n$', ylabel: 'class', title: String.raw`class of $X_n$` });
        let key = '', S = null;
        const get = () => {
          const k = dS.value + '|' + seed; if (k === key) return S; key = k;
          const d = dS.value, per = d === 4 ? 2 : 3, r = v.rng(seed * 5 + 1), ch = cyclicChain(d, per, r, false), perm = r.shuffle ? r.shuffle([...Array(ch.n).keys()]) : [...Array(ch.n).keys()];
          const inv = []; perm.forEach((p, i) => { inv[p] = i; });
          const adj = Array.from({ length: ch.n }, () => []), P = Array.from({ length: ch.n }, () => new Array(ch.n).fill(0));
          ch.adj.forEach((nb, i) => nb.forEach((j) => { adj[perm[i]].push(perm[j]); P[perm[i]][perm[j]] = ch.P[i][j]; }));
          const dist = bfs(adj, 0), dd = gcdAll(retTimes(adj, 0, 50)), cls = dist.map((x) => x % dd);
          const path = [0], rr = v.rng(seed * 3 + 2); for (let t = 0; t < 18; t++) path.push(stepFrom(P, path[t], rr));
          S = { adj, P, cls, dd, path, n: ch.n }; return S;
        };
        v.render(() => {
          const s = get(), n = nS.value, cnt = Array(s.dd).fill(0), pos = [];
          s.cls.forEach((c) => { cnt[c]++; });
          const seen = Array(s.dd).fill(0);
          s.cls.forEach((c, i) => { pos[i] = arr.value ? [-1.2 + (2.4 * c) / Math.max(1, s.dd - 1), (cnt[c] > 1 ? 1.2 - (2.4 * seen[c]++) / (cnt[c] - 1) : 0)] : circlePos(s.n, 1.2)[i]; });
          drawGraph(G, pos, s.adj, { colors: s.cls.map((c) => CLS[c]), rad: 0.11, hl: s.path[n], edgeW: 1.1 });
          for (let t = 0; t < n; t++) { const a = pos[s.path[t]], b = pos[s.path[t + 1]]; if (a !== b) G.arrow(a[0], a[1], b[0], b[1], { color: 'gold', width: 2.4, alpha: 0.8, head: 9 }); }
          R.setView([0, 18], [-0.5, s.dd - 0.5 + 0.5]);
          R.path(s.path.slice(0, n + 1).map((x, t) => [t, s.cls[x]]), { color: 'gold', width: 2 });
          s.path.slice(0, n + 1).forEach((x, t) => R.dot(t, s.cls[x], { color: CLS[s.cls[x]], r: 5 }));
        });
        v.readout(() => {
          const s = get(); let ok = 0, tot = 0; s.adj.forEach((nb, i) => nb.forEach((j) => { tot++; if (s.cls[j] === (s.cls[i] + 1) % s.dd) ok++; }));
          return `Computed period $d=${s.dd}$; ${ok} of ${tot} arrows go from $C_r$ to $C_{r+1}$. Class sizes: ${Array.from({ length: s.dd }, (_, r) => s.cls.filter((c) => c === r).length).join(', ')}.`;
        });
      },
    },
    {
      num: '5.7.2',
      kind: 'Theorem',
      name: 'Convergence theorem, periodic case',
      statement: String.raw`Let $p$ be irreducible with period $d$ and stationary distribution $\pi$, and let $x\in C_0$ and $y\in C_r$ (cyclic classes of 5.7.1). Then
$$p^{md+r}(x,y)\ \longrightarrow\ d\,\pi(y)\qquad(m\to\infty),$$
while $p^n(x,y)=0$ whenever $n\not\equiv r\pmod d$. In particular $p^n(x,y)$ has no limit for $d\ge2$.`,
      idea: String.raw`$p^d$ restricted to the class $C_r$ is irreducible and aperiodic (5.7.1), so the convergence theorem 5.6.6 applies to it and gives a limit that is a stationary law of $p^d$ on $C_r$. Since $\pi(C_r)=1/d$ for each class, that law is $d\pi(y)$ on $C_r$ (the chain spends equal time in each class).`,
      caption: String.raw`The probability $p^n(x,y)$ for a periodic chain started at $x=0$, as a function of $n$ with dots coloured by $n\bmod d$. Pick the target $y$. Only the residue class $r(y)$ lights up; along it the values converge to the green line $d\,\pi(y)$, on every other residue they stay at $0$ — so the plain sequence flips between the two forever.`,
      deps: ['prob-5.7.1', 'prob-5.6.6'],
      see: ['stoch-4.8'],
      tags: ['periodicity', 'convergence'],
      viz(v) {
        const dS = v.select('period $d$', [2, 3, 4].map((d) => ({ value: d, label: String(d) })), 3);
        const yS = v.slider('target state $y$', 0, 11, 4, { int: true });
        let seed = 1; v.button('New chain', () => { seed++; });
        const S = v.stage({ x: [0, 60], y: [0, 1], height: 340, axes: 'box', gutter: true, xlabel: '$n$', title: String.raw`$p^n(0,y)$` });
        let key = '', C = null;
        const get = () => {
          const k = dS.value + '|' + seed; if (k === key) return C; key = k;
          const d = dS.value, ch = cyclicChain(d, d === 4 ? 2 : 3, v.rng(seed * 7 + 3), false), pi = stationary(ch.P);
          let mu = Array(ch.n).fill(0); mu[0] = 1; const seq = [];
          for (let n = 0; n <= 60; n++) { seq.push(mu.slice()); mu = vecP(mu, ch.P); }
          C = { ...ch, pi, seq, d }; return C;
        };
        v.render(() => {
          const c = get(), y = Math.min(yS.value, c.n - 1), r = c.cls[y], lim = c.d * c.pi[y];
          S.setView([0, 60], [0, Math.max(0.3, 1.25 * lim, 1.1 * Math.max(...c.seq.map((m) => m[y])))]);
          S.hline(lim, { color: 'green', width: 2, dash: [8, 5] });
          const pts = c.seq.map((m, n) => [n, m[y]]);
          S.path(pts, { color: 'faint', width: 1 });
          pts.forEach(([n, p]) => S.dot(n, p, { color: CLS[n % c.d], r: 3.2 }));
          S.text(`d π(y) = ${fx(lim, 3)}`, 59, lim, { color: 'green', size: 12, align: 'right', dy: -10 });
        });
        v.legend([['green', '$d\\,\\pi(y)$', { dash: true }]]);
        v.readout(() => { const c = get(), y = Math.min(yS.value, c.n - 1), r = c.cls[y]; const tail = [57, 58, 59, 60].map((n) => `$p^{${n}}=${fx(c.seq[n][y], 4)}$`); return `State $y=${y}$ lies in class $r=${r}$ ($d=${c.d}$, $\\pi(y)=${fx(c.pi[y], 4)}$): along $n\\equiv${r}$ the values approach $${fx(c.d * c.pi[y], 4)}$; last four: ${tail.join(', ')}.`; });
      },
    },
    {
      num: '5.7.3',
      kind: 'Theorem',
      name: 'Tail σ-field of a periodic recurrent chain',
      statement: String.raw`Let $p$ be an irreducible recurrent chain of period $d$ with cyclic classes $C_0,\dots,C_{d-1}$. Up to null sets under any initial distribution, the tail $\sigma$-field is
$$\mathcal T=\sigma\big(\{X_0\in C_r\}:0\le r<d\big).$$
Thus every tail event is a union of starting-class events. If the initial distribution is concentrated on one cyclic class, the tail field is trivial, even when $d>1$; aperiodicity guarantees triviality for every initial distribution.`,
      idea: String.raw`With a fixed initial state, successive return excursions are i.i.d.; a tail event is invariant under finitely many permutations of these excursions, so Hewitt–Savage makes its probability $0$ or $1$. Within a cyclic class, reachability at compatible times makes that value identical for every starting state. Under a general initial distribution only the starting cyclic class can remain as tail information. Conversely that class can be recovered from arbitrarily late observations, so its events belong to the tail field. This argument uses recurrence and does not require positive recurrence.`,
      caption: String.raw`Thirty paths from random starting states, each plotted as the *tail label* $\kappa_n-n \bmod d$ against $n$ (slightly separated vertically). Every path is a flat line: the label is fixed from the start and can be read off at any later time. Right: the frequency of each label against the starting-class frequency. Switch on the shortcut edge and the structure breaks: the labels wander and the tail is trivial.`,
      deps: ['prob-5.7.1', 'prob-2.5.1a'],
      credit: 'Orey; proof of Blackwell and Freedman, 1964 (as credited by Durrett)',
      tags: ['tail sigma-field', 'periodicity'],
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 5.7.3 and proof, pp. 318–319'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      scope: String.raw`Recurrence suffices. Tail triviality for a periodic chain depends on its initial distribution: only classes given positive initial mass contribute tail atoms.`,
      viz(v) {
        const dS = v.select('period $d$', [2, 3, 4].map((d) => ({ value: d, label: String(d) })), 3);
        const brk = v.toggle('add a shortcut edge', false);
        let seed = 1; v.button('New paths', () => { seed++; });
        const L = v.stage({ x: [0, 40], y: [-0.7, 4], height: 340, axes: 'box', gutter: true, xlabel: '$n$', title: String.raw`tail label $(\kappa_n-n)\bmod d$` });
        const R = v.stage({ x: [0, 5], y: [0, 0.6], height: 340, axes: 'box', gutter: true, xlabel: 'label $r$', title: 'frequencies', minWidth: 220, weight: 0.7 });
        let key = '', D = null;
        const get = () => {
          const k = dS.value + '|' + brk.value + '|' + seed; if (k === key) return D; key = k;
          const d = dS.value, ch = cyclicChain(d, d === 4 ? 2 : 3, v.rng(seed * 3 + 1), brk.value), r = v.rng(seed * 101 + 9), paths = [];
          for (let i = 0; i < 30; i++) { let x = Math.floor(r() * ch.n); const st = ch.cls[x], tr = [(ch.cls[x]) % d]; const lab = [st]; for (let n = 1; n <= 40; n++) { x = stepFrom(ch.P, x, r); lab.push(((ch.cls[x] - n) % d + d) % d); } paths.push({ st, lab }); }
          D = { d, paths }; return D;
        };
        v.render(() => {
          const { d, paths } = get(); L.setView([0, 40], [-0.7, d - 0.3 + 0.5]);
          paths.forEach((p, i) => L.path(p.lab.map((l, n) => [n, l + (i - 15) * 0.012]), { color: CLS[p.st], width: 1.6, alpha: 0.85 }));
          const fr = Array(d).fill(0), fs = Array(d).fill(0); paths.forEach((p) => { fr[p.lab[40]]++; fs[p.st]++; });
          R.setView([0, d + 1], [0, 0.65]);
          fs.forEach((c, r) => R.rect(r + 0.55, 0, r + 0.95, c / 30, { fill: 'orange', fillAlpha: 0.4, color: 'orange' }));
          fr.forEach((c, r) => R.rect(r + 1.05, 0, r + 1.45, c / 30, { fill: 'green', fillAlpha: 0.5, color: 'green' }));
        });
        v.legend([['orange', 'starting class'], ['green', 'label at $n=40$']]);
        v.readout(() => { const { d, paths } = get(); const flat = paths.filter((p) => p.lab.every((l) => l === p.lab[0])).length; return `${flat} of 30 paths have a constant tail label$\\ (d=${d}${brk.value ? ', shortcut added: chain is aperiodic' : ''})$. ${brk.value ? 'The label no longer carries information about the start.' : 'The label equals the starting class on every path.'}`; });
      },
    },
    {
      num: '5.7.4',
      kind: 'Theorem',
      name: 'Tail events ↔ bounded space-time harmonic functions',
      statement: String.raw`For a tail event $A\in\mathcal T$, $h(x,n)=P(A\mid X_n=x)$ is a bounded function on $S\times\mathbb N$ satisfying $h(x,n)=\sum_yp(x,y)\,h(y,n+1)$ (space-time harmonic). Conversely, every bounded space-time harmonic function $h$ gives the tail-measurable bounded variable $\lim_nh(X_n,n)$, and $h(x,n)=E\big(\lim_mh(X_m,m)\mid X_n=x\big)$.`,
      idea: String.raw`The Markov property (5.2.3) at time $n+1$ gives $P(A\mid\mathcal F_{n+1})=h(X_{n+1},n+1)$; conditioning on $X_n$ yields the harmonic equation. For the converse, $h(X_n,n)$ is a bounded martingale by harmonicity, so it converges (4.2.11) and the limit is measurable with respect to the tail, since $h(X_n,n)$ only depends on the process from time $n$ on in the limit.`,
      caption: String.raw`A gambler's chain on $\{0,\dots,10\}$ (absorbed at both ends), with the tail event $A=\{\text{absorbed at }10\}$. Left: $h(x,n)$ estimated by simulation (300 runs per cell, horizon 400) as a heat map in space ($x$) and time ($n$). Right: each dot compares $h(x,n)$ (horizontal) with the one-step average $\sum_yp(x,y)h(y,n+1)$ (vertical); they stay on the diagonal up to sampling noise. The second option uses the period-2 chain and the event 'class label equals $n \bmod 2$ forever', which genuinely depends on $n$.`,
      deps: ['prob-4.6.9', 'prob-2.5.1a', 'prob-5.2.3'],
      tags: ['tail sigma-field', 'harmonic functions'],
      viz(v) {
        const mode = v.select('chain and event', [{ value: 'g', label: 'gambler, absorbed at 10' }, { value: 'per', label: 'period 2, class = $n$ mod 2' }], 'g');
        const pS = v.slider('up-probability $p$', 0.3, 0.7, 0.5, { step: 0.05 });
        let seed = 1; v.button('Re-estimate', () => { seed++; });
        const NX = 10, NT = 8, RUNS = 300;
        const H = v.stage({ x: [0, NT], y: [0, NX], height: 340, axes: 'box', gutter: true, xlabel: '$n$', ylabel: '$x$', title: String.raw`$h(x,n)=P(A\mid X_n=x)$ (estimated)` });
        const Sc = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 340, axes: 'box', gutter: true, xlabel: '$h(x,n)$', ylabel: String.raw`$\sum_y p(x,y)h(y,n{+}1)$`, title: 'harmonic check', minWidth: 260, weight: 0.8 });
        let key = '', D = null;
        const get = () => {
          const k = mode.value + '|' + pS.value + '|' + seed; if (k === key) return D; key = k;
          const r = v.rng(seed * 19 + 7), g = mode.value === 'g', p = pS.value;
          const per = cyclicChain(2, 3, v.rng(3), false), trans = (x) => (g ? (x === 0 || x === NX ? [[x, 1]] : [[x + 1, p], [x - 1, 1 - p]]) : per.adj[x].map((y) => [y, per.P[x][y]]));
          const nS = g ? NX + 1 : per.n, h = [];
          for (let n = 0; n <= NT; n++) { h.push([]); for (let x = 0; x < nS; x++) { let c = 0; for (let k = 0; k < RUNS; k++) { let y = x, m = n, t = 0; const stop = g ? 400 : 60; while (t < stop && !(g && (y === 0 || y === NX))) { const tr = trans(y); let u = r(), q = 0, nx = tr[tr.length - 1][0]; for (const [j, w] of tr) { q += w; if (u < q) { nx = j; break; } } y = nx; t++; } if (g ? y === NX : per.cls[y] === (n + t) % 2) c++; } h[n].push(c / RUNS); } }
          D = { h, nS, trans, g }; return D;
        };
        v.render(() => {
          const D2 = get(), { h, nS, trans, g } = D2; H.setView([0, NT + 1], [0, nS]);
          for (let n = 0; n <= NT; n++) for (let x = 0; x < nS; x++) H.rect(n, x, n + 1, x + 1, { fill: v.ramp(h[n][x], 'green'), fillAlpha: 1, stroke: false });
          H.hline(0, { color: 'faint' });
          for (let n = 0; n < NT; n++) for (let x = 0; x < nS; x++) { const avg = trans(x).reduce((s, [y, w]) => s + w * h[n + 1][y], 0); Sc.dot(h[n][x], avg, { color: 'accent', r: 3, alpha: 0.7 }); }
          Sc.line(0, 0, 1, 1, { color: 'green', width: 2, dash: [6, 4] });
        });
        v.readout(() => { const { h, nS, trans } = get(); let mx = 0; for (let n = 0; n < NT; n++) for (let x = 0; x < nS; x++) { const avg = trans(x).reduce((s, [y, w]) => s + w * h[n + 1][y], 0); mx = Math.max(mx, Math.abs(avg - h[n][x])); } return `Largest gap between $h(x,n)$ and its one-step average: ${fx(mx, 3)} (sampling noise is about $0.03$–$0.05$ with ${RUNS} runs per cell).`; });
      },
    },
    {
      num: '5.7.6',
      kind: 'Theorem',
      name: 'Tail σ-field of simple random walk',
      statement: String.raw`For simple symmetric random walk on $\mathbb Z$ (period 2), the tail $\sigma$-field is generated by the parity event $\{S_n\equiv n\ (\mathrm{mod}\ 2)\ \forall n\}$ and its complement: it consists of $\emptyset$, $\Omega$ and these two events up to null sets. Equivalently, if $x\equiv y\pmod 2$ then $\|P_x(S_n\in\cdot)-P_y(S_n\in\cdot)\|_{TV}\to0$, while for $x\not\equiv y$ it stays equal to $1$.`,
      idea: String.raw`For same-parity starts, run independent copies of the walk from $x$ and $y$: their difference is a lazy symmetric walk on $2\mathbb Z$, which is recurrent and hits $0$, so the copies meet and can then be glued together. By the coupling inequality the total variation distance is at most $P(T>n)\to0$, so no tail event distinguishes $x$ from $y$ (5.7.4). Walks of different parity never occupy the same site at the same time.`,
      caption: String.raw`Two walks from $x$ and $y$ (blue, orange), independent until they meet and then glued. Choose the starts: with equal parity they meet (gold line) in a random time, with different parity they never do. Right: the exact total variation distance between $P_x(S_n\in\cdot)$ and $P_y(S_n\in\cdot)$ as a function of $n$, decaying to $0$ for equal parity and stuck at $1$ otherwise.`,
      deps: ['prob-5.7.4'],
      tags: ['tail sigma-field', 'random walk'],
      viz(v) {
        const xS = v.slider('start $x$', -8, 8, 0, { int: true });
        const yS = v.slider('start $y$', -8, 8, 4, { int: true });
        let seed = 1; v.button('New walks', () => { seed++; });
        const W = v.stage({ x: [0, 80], y: [-14, 14], height: 340, axes: 'box', gutter: true, xlabel: '$n$', title: String.raw`coupled walks $S_n$` });
        const T = v.stage({ x: [0, 80], y: [0, 1.05], height: 340, axes: 'box', gutter: true, xlabel: '$n$', title: 'total variation distance', weight: 0.8, minWidth: 260 });
        const tvAt = (x, y, n) => { const dd = y - x; if (((dd % 2) + 2) % 2) return 1; const h2 = dd / 2; let s = 0; for (let k = Math.min(0, h2); k <= n + Math.max(0, h2); k++) { const a = k >= 0 && k <= n ? Math.exp(logChoose(n, k) - n * Math.LN2) : 0, j = k - h2; const b = j >= 0 && j <= n ? Math.exp(logChoose(n, j) - n * Math.LN2) : 0; s += Math.abs(a - b); } return Math.min(1, s / 2); };
        v.render(() => {
          const r = v.rng(seed * 23 + 5); let a = xS.value, b = yS.value, met = -1; const A = [a], B = [b];
          for (let n = 1; n <= 80; n++) { const sa = r() < 0.5 ? 1 : -1; a += sa; if (met >= 0) b = a; else { b += r() < 0.5 ? 1 : -1; if (a === b) met = n; } A.push(a); B.push(b); }
          W.setView([0, 80], [Math.min(-14, ...A, ...B) - 1, Math.max(14, ...A, ...B) + 1]);
          W.path(A.map((s, n) => [n, s]), { color: 'accent', width: 1.8 });
          W.path(B.map((s, n) => [n, s]), { color: 'orange', width: 1.8, dash: met >= 0 ? false : [6, 3] });
          if (met >= 0) W.vline(met, { color: 'gold', width: 1.6, dash: true });
          const pts = []; for (let n = 0; n <= 80; n += 1) pts.push([n, tvAt(xS.value, yS.value, n)]);
          T.path(pts, { color: 'green', width: 2.4 });
        });
        v.readout(() => { const same = ((yS.value - xS.value) % 2 + 2) % 2 === 0; return same ? `Same parity ($y-x=${yS.value - xS.value}$): the walks meet a.s.; $\\mathrm{TV}$ at $n=80$ is $${fx(tvAt(xS.value, yS.value, 80), 3)}$.` : `Different parity: the walks are never at the same site at the same time, TV $=1$ for every $n$.`; });
      },
    },
  ],
};
