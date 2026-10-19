// Probability: Theory and Examples (Durrett) — Chapter 5, part A1: §5.1 Examples and §5.2 Construction, Markov properties
import { clampN, cornerIn, fr, binomPmf, samplePoisson, sampleLaplace, sampleT3, logInts, ringPos, drawChain, drawMatrix, runChain, stepper, drawFrom, normRows, matPowSm, matMulSm, rhoTo, CLS_COL, serviceEntryQueueStep, serviceEntryQueueMean } from './ch05-a.shared.js';

const P3 = [[0.5, 0.3, 0.2], [0.2, 0.5, 0.3], [0.3, 0.2, 0.5]];
const P4 = normRows([[5, 3, 2, 0], [2, 4, 2, 2], [1, 2, 5, 2], [0, 3, 3, 4]]);
const P5 = [[0.1, 0.5, 0.4, 0, 0], [0.3, 0.1, 0.2, 0.4, 0], [0, 0.4, 0.1, 0.2, 0.3], [0.3, 0, 0.2, 0.2, 0.3], [0.5, 0, 0, 0.4, 0.1]];
const CHAIN5E = (e) => [[0.2, 0.5, 0.3, 0, 0], [0.4, 0.1, 0.5, 0, 0], [0.25 * (1 - e), 0.35 * (1 - e), 0.4 * (1 - e), e / 2, e / 2], [0, 0, 0, 0.5, 0.5], [0, 0, 0, 0.6, 0.4]];
const tvd = (a, b) => 0.5 * a.reduce((s, x, i) => s + Math.abs(x - b[i]), 0);

export default {
  collection: 'prob',
  chapter: 5,
  items: [
    // ======================================================================== 5.1 Examples
    {
      num: '5.1.1a',
      kind: 'Definition',
      name: 'Markov chain and transition probability',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), §5.1, p. 269; §5.2, p. 273 (general-space definition)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      statement: String.raw`A **transition probability** on a measurable space $(S,\mathscr S)$ is a function $p(x,A)$ such that $p(x,\cdot)$ is a probability measure for each $x$ and $x\mapsto p(x,A)$ is measurable for each $A$. A sequence $X_0,X_1,\dots$ of $S$-valued random variables is a **Markov chain** with transition probability $p$ when
$$P(X_{n+1}\in B\mid\mathscr F_n)=p(X_n,B)\qquad(B\in\mathscr S),$$
where $\mathscr F_n=\sigma(X_0,\dots,X_n)$: given the whole past, the next state is drawn from $p(X_n,\cdot)$ and only the present state matters. For a countable $S$ this is the matrix $p(x,y)$ with nonnegative entries and every row summing to $1$, and $P(X_{n+1}=y\mid X_n=x,\ \text{past})=p(x,y)$.`,
      idea: String.raw`The definition is a statement about conditional expectations (Section 4.1): the conditional law of $X_{n+1}$ given $\mathscr F_n$ is a *function of $X_n$ alone*. For a finite state space, averaging the indicator $1_{\{X_n=x,X_{n+1}=y\}}$ shows that the fraction of visits to $x$ followed by $y$ tends to $p(x,y)$ (a law of large numbers along the successive visits to $x$, made precise by the strong Markov property and the ergodic theorems later in the chapter).`,
      caption: String.raw`Pick a row and drag its four weights; the edge widths of the diagram are the normalised entries $p(i,j)$. A seeded chain hops along the edges. The gold dots in the right panel are the empirical frequencies of the move $i\to j$ among the first $N$ visits to $i$, the blue bars are the row of the matrix. Increase $N$ and watch the dots settle on the bars; with a small $N$ the row can look quite different.`,
      deps: ['prob-4.1.1a'],
      see: ['stoch-1.1'],
      tags: ['markov chains', 'foundations'],
      viz(v) {
        const n = 4, pos = ringPos(n, 1.0);
        const W = [[4, 3, 2, 1], [1, 1, 6, 2], [2, 2, 1, 5], [3, 1, 1, 5]];
        const row = v.select('row $i$', ['0', '1', '2', '3'], '0');
        let guard = false;
        const sl = [0, 1, 2, 3].map((j) => v.slider(`weight $w_{i${j}}$`, 0, 10, W[0][j], { step: 0.1, onChange: (val) => { if (!guard) { W[+row.value][j] = val; } } }));
        const sync = () => { guard = true; sl.forEach((s, j) => s.set(W[+row.value][j])); guard = false; };
        const N = v.slider('steps $N$', 20, 40000, 400, { log: true, int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const G = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 340, title: 'transition diagram' });
        const B = v.stage({ x: [-0.6, 3.6], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'next state $j$', xticks: [[0, '0'], [1, '1'], [2, '2'], [3, '3']], title: 'row $i$ against what the chain did', minWidth: 280 });
        let cache = null, last = '';
        const make = () => {
          const P = normRows(W.map((r) => (r.reduce((a, b) => a + b, 0) > 0 ? r : [1, 1, 1, 1])));
          const key = JSON.stringify(P) + seed;
          if (key !== last) { last = key; cache = { P, path: runChain(v.rng(seed * 977 + 3), P, 0, 40000) }; }
          return cache;
        };
        let info = {};
        v.render(() => {
          if (+row.value !== info.row) { info.row = +row.value; sync(); }
          const { P, path } = make(), steps = N.value, cnt = Array.from({ length: n }, () => Array(n).fill(0)), tot = Array(n).fill(0);
          for (let t = 0; t < steps; t++) { cnt[path[t]][path[t + 1]]++; tot[path[t]]++; }
          const i = +row.value;
          drawChain(G, P, { pos, labels: true, labelRow: i, cur: path[steps], fills: [0, 1, 2, 3].map((k) => (k === i ? 'orange' : 'accent')) });
          B.bars(P[i], { x0: 0, dx: 1, color: 'accent' });
          const emp = P[i].map((_, j) => (tot[i] ? cnt[i][j] / tot[i] : 0));
          B.dots(emp.map((e, j) => [j, e]), { r: 6, color: 'gold' });
          let mx = 0; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (tot[a]) mx = Math.max(mx, Math.abs(cnt[a][b] / tot[a] - P[a][b]));
          info.t = `After ${steps} steps the chain visited state $${i}$ ${tot[i]} times; largest gap over all rows $\\max_{a,b}|\\hat p(a,b)-p(a,b)|=${fr(mx, 3)}$.\nRow $${i}$: ${P[i].map((p, j) => `$p(${i},${j})=${fr(p, 2)}$`).join(',  ')}`;
        });
        v.readout(() => info.t || '');
      },
    },
    {
      num: '5.1.3',
      kind: 'Model',
      name: 'Ehrenfest chain',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Example 5.1.3, p. 270; Example 5.5.3, pp. 300–301'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      statement: String.raw`Distribute $r$ balls between two urns. At each step pick one of the $r$ balls uniformly at random and move it to the other urn. Let $X_n$ be the number of balls in the left urn. Then $(X_n)$ is a Markov chain on $\{0,\dots,r\}$ with
$$p(k,k-1)=\frac kr,\qquad p(k,k+1)=1-\frac kr,$$
and its stationary distribution is Binomial$(r,\tfrac12)$: in the long run each ball is in either urn with probability $\tfrac12$ independently. Moreover $E(X_n-\tfrac r2)=(1-\tfrac2r)^n(X_0-\tfrac r2)$.`,
      idea: String.raw`The binomial law is stationary by detailed balance: $\binom rk\frac{r-k}{r}=\binom r{k+1}\frac{k+1}{r}$, so the flow $k\to k+1$ equals the flow back. The drift $E(X_{n+1}-X_n\mid X_n)=1-2X_n/r$ always points toward $r/2$ and gives the geometric decay of the mean, with relaxation time of order $r/2$ steps, while fluctuations of size $\sqrt r/2$ persist forever.`,
      caption: String.raw`Left: one seeded trajectory, started with every ball in the left urn (or balanced), against the exact mean path $r/2+(1-2/r)^n(X_0-r/2)$ in green. Right: the histogram of $X_n$ over $60\,000$ steps after a burn-in against the Binomial$(r,\tfrac12)$ masses (gold). Raise $r$: the fluctuations shrink relative to $r$ but the relaxation slows down.`,
      deps: ['prob-5.1.1a'],
      see: ['stoch-1.11', 'thermo-5.15'],
      tags: ['markov chains', 'models'],
      scope: String.raw`This is the discrete-time Ehrenfest urn model. It has period $2$: the binomial law is stationary, while the law at a fixed time need not converge to it. The histogram here is a time average.`,
      viz(v) {
        const r = v.slider('balls $r$', 2, 60, 20, { int: true });
        const start = v.select('start', [{ value: 'all', label: 'all in the left urn' }, { value: 'half', label: 'balanced' }], 'all');
        let seed = 1; v.button('Resample', () => { seed++; });
        const T = 300;
        const A = v.stage({ x: [0, T], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'step $n$', title: '$X_n$, balls in the left urn' });
        const H = v.stage({ x: [-0.5, 1], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'balls in the left urn $k$', title: 'long-run histogram', minWidth: 280 });
        let key = '', S = null;
        const sim = (rr, x0, sd) => {
          const k = `${rr}|${x0}|${sd}`; if (k === key) return S; key = k;
          const rg = v.rng(sd * 313 + rr), out = new Int16Array(61000); let x = x0; out[0] = x;
          for (let i = 1; i < out.length; i++) { x += rg() < x / rr ? -1 : 1; out[i] = x; }
          return (S = out);
        };
        let info = '';
        v.render(() => {
          const rr = r.value, x0 = start.value === 'all' ? rr : Math.round(rr / 2), path = sim(rr, x0, seed);
          A.setView([0, T], [0, rr]);
          A.hline(rr / 2, { color: 'faint', dash: true });
          A.fn((nn) => rr / 2 + (1 - 2 / rr) ** nn * (x0 - rr / 2), { domain: [0, T], color: 'green', width: 2.5 });
          A.path(Array.from({ length: T + 1 }, (_, i) => [i, path[i]]), { color: 'accent', width: 1.4 });
          const cnt = new Float64Array(rr + 1); let m = 0, m2 = 0, tot = 0;
          for (let i = 1000; i < path.length; i++) { cnt[path[i]]++; m += path[i]; m2 += path[i] * path[i]; tot++; }
          const pm = binomPmf(rr, 0.5), emp = Array.from(cnt, (c) => c / tot), top = Math.max(...pm, ...emp) * 1.15;
          H.setView([-0.5, rr + 0.5], [0, top]);
          H.bars(emp, { x0: 0, dx: 1, color: 'accent' });
          H.dots(Array.from(pm, (p, k) => [k, p]), { r: 4, color: 'gold' });
          m /= tot; const va = m2 / tot - m * m;
          info = `Sample mean $${fr(m, 2)}$ (stationary mean $r/2=${fr(rr / 2, 2)}$), sample variance $${fr(va, 2)}$ (binomial: $r/4=${fr(rr / 4, 2)}$). Total variation distance to Binomial$(r,\\tfrac12)$: $${fr(tvd(emp, Array.from(pm)), 3)}$.`;
        });
        v.legend([['accent', 'simulation'], ['green', 'exact mean path'], ['gold', 'Binomial$(r,\\frac12)$', { dot: true }]]);
        v.readout(() => info);
      },
    },
    {
      num: '5.1.4',
      kind: 'Model',
      name: 'Wright–Fisher model',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Example 5.1.4, pp. 270–271; Exercise 5.2.9, p. 280'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      statement: String.raw`A population of $N$ gene copies carries two alleles. In each generation the $N$ copies are chosen independently, with replacement, from the previous generation, so that if $X_n$ is the number of copies of allele $A$ then, given $X_n=k$,
$$X_{n+1}\sim\text{Binomial}\Big(N,\frac kN\Big).$$
This is a Markov chain on $\{0,\dots,N\}$ in which $0$ and $N$ are absorbing, $X_n/N$ is a martingale, and so
$$P(\text{fixation at }N\mid X_0=k)=\frac kN,\qquad P(\text{fixation at }0\mid X_0=k)=1-\frac kN.$$`,
      idea: String.raw`Binomial sampling has mean $N\cdot k/N=k$, so $E(X_{n+1}\mid X_n)=X_n$: a bounded martingale, which converges, and the only possible limits are the absorbing points. Optional stopping at the absorption time then gives $k=E X_\tau=N\,P(X_\tau=N)$. Genetic drift is the random walk of the frequency; there is no drift in the mean, only variance $x(1-x)/N$ per generation.`,
      caption: String.raw`Twelve seeded frequency paths $X_n/N$ (orange) start from the same count. The right panel compares, over 300 independent populations, the fraction fixing at $N$ with the starting frequency $k/N$ (gold). Raise $N$ and drift slows (fixation takes longer); move $k$ and the fixation probability follows it.`,
      deps: ['prob-5.1.1a'],
      see: ['popgen-2.1'],
      tags: ['markov chains', 'genetics'],
      scope: String.raw`Neutral alleles, constant population size, non-overlapping generations, no mutation or selection.`,
      viz(v) {
        const Ns = v.slider('population $N$', 6, 100, 30, { int: true });
        const k0 = v.slider('start fraction $k/N$', 0.05, 0.95, 0.3, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'generation $n$', title: 'allele frequency $X_n/N$' });
        const B = v.stage({ x: [-0.5, 1.5], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: '', xticks: [[0, 'lost'], [1, 'fixed']], title: 'where the 300 populations end', minWidth: 260, weight: 0.7 });
        let key = '', S = null;
        const sim = (N, k, sd) => {
          const kk = `${N}|${k}|${sd}`; if (kk === key) return S; key = kk;
          const rg = v.rng(sd * 7919 + N), cap = 40 * N, trajs = []; let fixN = 0, tsum = 0;
          for (let run = 0; run < 300; run++) {
            let x = k, t = 0; const tr = run < 12 ? [x] : null;
            while (x > 0 && x < N && t < cap) { let y = 0; const p = x / N; for (let i = 0; i < N; i++) if (rg() < p) y++; x = y; t++; if (tr) tr.push(x); }
            if (x === N) fixN++; tsum += t; if (tr) trajs.push(tr);
          }
          return (S = { trajs, fixN, tsum });
        };
        let info = '';
        v.render(() => {
          const N = Ns.value, k = Math.max(1, Math.min(N - 1, Math.round(k0.value * N))), R = sim(N, k, seed);
          const tmax = Math.max(20, ...R.trajs.map((t) => t.length)) + 2;
          A.setView([0, tmax], [0, 1]);
          R.trajs.forEach((tr, i) => A.path(tr.map((x, t) => [t, x / N]), { color: CLS_COL[1], width: 1.3, alpha: 0.75 }));
          A.hline(k / N, { color: 'faint', dash: true });
          const fN = R.fixN / 300;
          B.bars([1 - fN, fN], { x0: 0, dx: 1, color: 'accent' });
          B.dots([[0, 1 - k / N], [1, k / N]], { r: 7, color: 'gold' });
          info = `$N=${N}$, start count $k=${k}$ (frequency $${fr(k / N, 3)}$). Fixed at $N$ in ${R.fixN} of 300 runs: $${fr(fN, 3)}$ against $k/N=${fr(k / N, 3)}$ (standard error about $${fr(Math.sqrt((k / N) * (1 - k / N) / 300), 3)}$). Mean time to absorption $${fr(R.tsum / 300, 1)}$ generations.`;
        });
        v.legend([['orange', 'frequency paths'], ['accent', 'simulated fixation frequency'], ['gold', 'prediction $k/N$, $1-k/N$', { dot: true }]]);
        v.readout(() => info);
      },
    },
    {
      num: '5.1.5',
      kind: 'Model',
      name: 'M/G/1 queue (embedded chain)',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Example 5.1.5 and equation (5.1.1), pp. 271–272; stationary mean from first and second moment drift'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      statement: String.raw`Customers arrive as a Poisson process of rate $\lambda$, independently of i.i.d. service times with mean $1/\mu$. Let $X_n$ count customers waiting when customer $n$ enters service, excluding that customer, and let $A_{n+1}$ count arrivals during that service. Then the $A$'s are i.i.d., $EA=\rho=\lambda/\mu$, and
$$X_{n+1}=(X_n+A_{n+1}-1)^+.$$
This is Durrett's embedded M/G/1 chain. For the deterministic and exponential service laws pictured, it is positive recurrent when $\rho<1$, null recurrent at $\rho=1$, and transient when $\rho>1$. When $\rho<1$, its stationary mean is $\rho^2(1+c^2)/(2(1-\rho))$, where $c^2$ is the squared coefficient of variation of service time.`,
      idea: String.raw`Poisson increments during successive independent service times produce independent arrival counts. If $X_n+A_{n+1}=0$, the server waits for the next arrival and that customer immediately starts service, leaving no one waiting; otherwise one customer leaves the waiting line for service. For the stationary mean, $EA^2=\rho+\rho^2(1+c^2)$. The first-moment drift gives $P(X=0)P(A=0)=1-\rho$; inserting this in the second-moment drift gives $2(1-\rho)EX=EA^2-EA=\rho^2(1+c^2)$. The mean formula assumes a finite service-time second moment.`,
      caption: String.raw`Choose the load $\rho$ and service law. Left: the number waiting at successive service entries, excluding the person entering service. Right: its running average (gold) against the stationary mean (green). Move $\rho$ above $1$ to see growth; close to $1$ from below, convergence is slow. Empty-queue frequency is compared with $(1-\rho)/P(A=0)$ for this embedding.`,
      deps: ['prob-5.1.1a'],
      see: ['stoch-11.11'],
      tags: ['markov chains', 'queues'],
      viz(v) {
        const rho = v.slider('load $\\rho=\\lambda/\\mu$', 0.2, 1.3, 0.8, { step: 0.01 });
        const kind = v.select('service time', [{ value: 'det', label: 'deterministic ($c^2=0$)' }, { value: 'exp', label: 'exponential ($c^2=1$)' }], 'det');
        let seed = 1; v.button('Resample', () => { seed++; });
        const NN = 20000, T = 400;
        const A = v.stage({ x: [0, T], y: [0, 10], axes: 'box', gutter: true, height: 320, xlabel: 'service entry $n$', title: 'customers waiting $X_n$' });
        const B = v.stage({ x: [10, NN], xlog: true, y: [0, 10], axes: 'box', gutter: true, height: 320, xlabel: '$n$ (log scale)', title: 'time average of $X_1,\\dots,X_n$', minWidth: 280 });
        let key = '', S = null;
        const sim = (rh, kd, sd) => {
          const k = `${rh}|${kd}|${sd}`; if (k === key) return S; key = k;
          const rg = v.rng(sd * 1013 + 5), th = rh / (1 + rh), out = new Float64Array(NN + 1); let x = 0;
          for (let i = 1; i <= NN; i++) { const a = kd === 'det' ? samplePoisson(rg, rh) : Math.floor(Math.log(1 - rg()) / Math.log(th)); x = serviceEntryQueueStep(x, a); out[i] = x; }
          return (S = out);
        };
        let info = '';
        v.render(() => {
          const rh = rho.value, kd = kind.value, X = sim(rh, kd, seed), c2 = kd === 'det' ? 0 : 1;
          const pk = serviceEntryQueueMean(rh, c2);
          let mxT = 6; for (let i = 0; i <= T; i++) mxT = Math.max(mxT, X[i]);
          A.setView([0, T], [0, mxT * 1.08]);
          A.path(Array.from({ length: T + 1 }, (_, i) => [i, X[i]]), { color: 'accent', width: 1.3 });
          const avg = [], idx = logInts(10, NN, 140); let s = 0, j = 0, top = Math.min(isFinite(pk) ? pk * 1.8 : 1, 60);
          for (let i = 1; i <= NN; i++) { s += X[i]; if (j < idx.length && i === idx[j]) { avg.push([i, s / i]); j++; } }
          avg.forEach((p) => { top = Math.max(top, p[1] * 1.1); });
          B.setView([10, NN], [0, Math.max(top, 2)]);
          B.path(avg, { color: 'gold', width: 2 });
          if (isFinite(pk)) B.hline(pk, { color: 'green', width: 2, dash: true });
          info = rh < 1 ? `$\\rho=${fr(rh, 2)}<1$: positive recurrent. Pollaczek–Khinchine mean $${fr(pk, 3)}$; time average after $${NN}$ service entries $${fr(s / NN, 3)}$. Fraction of service entries with no one waiting: $${fr(X.slice(1).reduce((q, x) => q + (x === 0 ? 1 : 0), 0) / NN, 3)}$ (predicted $(1-\\rho)/P(A=0)=${fr((1-rh)/(kd === 'det' ? Math.exp(-rh) : 1/(1+rh)), 3)}$).` : `$\\rho=${fr(rh, 2)}\\ge1$: no stationary law; $X_n$ is ${rh > 1 ? 'transient, growing like $(\\rho-1)n$' : 'null recurrent'}. Value after $${NN}$ service entries: ${X[NN]}.`;
        });
        v.readout(() => info);
      },
    },
    // ======================================================================== 5.2 Construction, Markov properties
    {
      num: '5.2.1',
      kind: 'Theorem',
      name: 'The canonical construction is a Markov chain',
      statement: String.raw`Let $S$ be countable (or a standard Borel space), $\mu$ a probability on $S$ and $p$ a transition probability. On $\Omega=S^{\{0,1,2,\dots\}}$ with the product $\sigma$-field there is a unique probability $P_\mu$ with
$$P_\mu(X_0=x_0,\dots,X_n=x_n)=\mu(x_0)\,p(x_0,x_1)\cdots p(x_{n-1},x_n),$$
where $X_n(\omega)=\omega_n$. Under $P_\mu$ the coordinate process is a Markov chain with transition probability $p$ and initial law $\mu$. For $\mu=\delta_x$ write $P_x$.`,
      idea: String.raw`The displayed finite-dimensional probabilities are consistent (sum out the last coordinate and the row of $p$ sums to $1$), so Kolmogorov's extension theorem (2.1.21) gives one probability on the product space; the $\pi$–$\lambda$ theorem (2.1.6) shows it is unique because cylinders form a $\pi$-system generating the product $\sigma$-field. The Markov property follows from the product form.`,
      caption: String.raw`A three-state chain with initial law $\mu=(0.5,0.3,0.2)$. Choose the length $n$ and a path $x_0,\dots,x_n$ with the sliders: the right-hand side of the formula is multiplied out factor by factor and compared with the frequency of that path among $30\,000$ seeded chains. The bar chart lists all $3^{n+1}$ paths (blue: formula, gold: simulation, gold ring: selected path); the masses sum to $1$.`,
      deps: ['prob-5.1.1a', 'prob-2.1.21', 'prob-2.1.6'],
      tags: ['markov chains', 'construction'],
      viz(v) {
        const mu = [0.5, 0.3, 0.2];
        const nS = v.slider('length $n$', 1, 4, 3, { int: true });
        const xs = [0, 1, 2, 3, 4].map((k) => v.slider(`$x_${k}$`, 0, 2, [0, 1, 1, 2, 0][k], { int: true }));
        let seed = 1; v.button('Resample', () => { seed++; });
        const B = v.stage({ x: [-1, 244], y: [0, 0.2], axes: 'box', gutter: true, height: 320, xlabel: 'path index (lexicographic in $x_0,x_1,\\dots$)', title: 'probabilities of all paths of length $n$' });
        let key = '', C = null;
        const count = (n, sd) => {
          const k = `${n}|${sd}`; if (k === key) return C; key = k;
          const rg = v.rng(sd * 41 + n), st = stepper(rg, P3), cnt = new Float64Array(3 ** (n + 1)), M = 30000;
          for (let i = 0; i < M; i++) { let x = drawFrom(rg, mu), id = x; for (let t = 0; t < n; t++) { x = st(x); id = id * 3 + x; } cnt[id]++; }
          return (C = cnt.map((c) => c / M));
        };
        let info = '';
        v.render(() => {
          const n = nS.value; xs.forEach((s, k) => { s.el.hidden = k > n; });
          const emp = count(n, seed), m = 3 ** (n + 1), ex = new Float64Array(m);
          for (let id = 0; id < m; id++) { let q = id, p = 1, prev = -1; const digs = []; for (let k = 0; k <= n; k++) { digs.unshift(q % 3); q = Math.floor(q / 3); } digs.forEach((x, k) => { p *= k === 0 ? mu[x] : P3[prev][x]; prev = x; }); ex[id] = p; }
          let sel = 0; for (let k = 0; k <= n; k++) sel = sel * 3 + xs[k].value;
          B.setView([-1, m], [0, Math.max(...ex, ...emp) * 1.15]);
          B.bars(Array.from(ex), { x0: 0, dx: 1, color: 'accent' });
          B.dots(Array.from(emp, (e, i) => [i, e]), { r: 2.2, color: 'gold' });
          B.dot(sel, ex[sel], { r: 8, hollow: true, color: 'gold' });
          const path = xs.slice(0, n + 1).map((s) => s.value);
          const fac = path.map((x, k) => (k === 0 ? `\\mu(${x})=${fr(mu[x], 2)}` : `p(${path[k - 1]},${x})=${fr(P3[path[k - 1]][x], 2)}`)).join('\\cdot ');
          info = `$P(X_0\\dots X_${n}=${path.join('')})=${fac}=${fr(ex[sel], 5)}$\nSimulated frequency of this path: $${fr(emp[sel], 5)}$.   Sum of all ${m} formula values: $${fr(ex.reduce((a, b) => a + b, 0), 6)}$.`;
        });
        v.legend([['accent', 'formula'], ['gold', 'frequency among 30 000 chains', { dot: true }]]);
        v.readout(() => info);
      },
    },
    {
      num: '5.2.2',
      kind: 'Theorem',
      name: 'Monotone class theorem',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 5.2.2 and proof, p. 275'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      statement: String.raw`Let $\mathscr A$ be a $\pi$-system containing $\Omega$ and let $\mathscr H$ be a vector space of bounded real functions on $\Omega$ such that

(i) $1_A\in\mathscr H$ for every $A\in\mathscr A$;

(ii) if $f_n\in\mathscr H$, $f_n\ge0$ and $f_n\uparrow f$ with $f$ bounded, then $f\in\mathscr H$.

Then $\mathscr H$ contains every bounded $\sigma(\mathscr A)$-measurable function.`,
      idea: String.raw`The sets $\mathscr L=\{A:1_A\in\mathscr H\}$ form a $\lambda$-system (closed under complements by $1-1_A$, under increasing limits by (ii), under proper differences by linearity) containing the $\pi$-system $\mathscr A$, so $\mathscr L\supset\sigma(\mathscr A)$ by Dynkin's $\pi$–$\lambda$ theorem (2.1.6). A bounded measurable function is an increasing limit of nonnegative simple functions (after adding a constant), which are linear combinations of indicators.`,
      caption: String.raw`Take $\Omega=[0,1)$ and the $\pi$-system $\mathscr A=\{[0,a)\}$. Pick a bounded target $f$ and raise the level $n$: the orange step function $f_n$ (the infimum of $f$ on each dyadic cell) is a linear combination of the indicators $1_{[0,k/2^n)}$ (a coefficient count is shown), and $f_n\uparrow f$ - which is exactly how closure under (i), linearity and (ii) reaches $f$. Switch to the second family, $\{[0,0.6),[0.3,0.9)\}$ and its span, which is *not* a $\pi$-system: the target $1_{[0.3,0.6)}$ is $\sigma(\mathscr A)$-measurable but the nearest function in $\mathscr H$ stays at a positive distance.`,
      deps: ['prob-2.1.6'],
      see: ['rca-8.3'],
      tags: ['measure', 'sigma-fields'],
      viz(v) {
        const fam = v.select('generating family', [{ value: 'pi', label: '$\\{[0,a)\\}$, a $\\pi$-system' }, { value: 'no', label: '$\\{[0,.6),[.3,.9)\\}$, not a $\\pi$-system' }], 'pi');
        const tg = v.select('target $f$', [{ value: 'sqrt', label: '$\\sqrt x$' }, { value: 'sin', label: '$(1+\\sin 2\\pi x)/2$' }], 'sqrt');
        const nS = v.slider('level $n$', 0, 7, 2, { int: true });
        const F = { sqrt: (x) => Math.sqrt(x), sin: (x) => (1 + Math.sin(2 * Math.PI * x)) / 2, ind: (x) => (x >= 0.37 && x < 0.81 ? 1 : 0) };
        const s = v.stage({ x: [0, 1], y: [-0.1, 1.15], axes: 'box', gutter: true, height: 340, xlabel: '$\\omega\\in[0,1)$', title: '$f$ and its approximation from $\\mathscr H$' });
        const G = 4096;
        let info = '';
        v.render(() => {
          const isPi = fam.value === 'pi'; tg.el.hidden = !isPi; nS.el.hidden = !isPi;
          if (isPi) {
            const f = F[tg.value], n = nS.value, m = 2 ** n, vals = [];
            for (let c = 0; c < m; c++) {
              const left = c / m, right = (c + 1) / m;
              vals.push(tg.value === 'sqrt' ? f(left) : left <= 0.75 && right >= 0.75 ? 0 : Math.min(f(left), f(right)));
            }
            const coef = vals.map((g, k) => g - (vals[k + 1] ?? 0)), nz = coef.filter((c) => Math.abs(c) > 1e-12).length;
            for (let c = 0; c < m; c++) s.rect(c / m, 0, (c + 1) / m, vals[c], { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1 });
            s.fn(f, { color: 'ink', width: 2.2, n: 500 });
            let err = 0; for (let i = 0; i < G; i++) { const x = (i + 0.5) / G; err = Math.max(err, f(x) - vals[Math.floor(x * m)]); }
            info = `Level $n=${n}$: $f_n$ is a combination of ${nz} indicators $1_{[0,a)}$ (the coefficients are the jumps of $f_n$), $0\\le f_n\\le f$ and $\\sup(f-f_n)=${fr(err, 3)}$. As $n\\uparrow$ the $f_n$ increase to $f$, so closure under increasing limits puts $f$ in $\\mathscr H$.`;
          } else {
            const edges = [0, 0.3, 0.6, 0.9, 1], len = [0.3, 0.3, 0.3, 0.1], bas = [[1, 1, 1, 1], [1, 1, 0, 0], [0, 1, 1, 0]], tar = [0, 1, 0, 0];
            const Aw = len.map((l, i) => bas.map((b) => Math.sqrt(l) * b[i])), bw = len.map((l, i) => Math.sqrt(l) * tar[i]);
            const co = v.M.lstsq(Aw, bw), proj = len.map((_, i) => bas.reduce((q, b, k) => q + co[k] * b[i], 0));
            const d = Math.sqrt(len.reduce((q, l, i) => q + l * (tar[i] - proj[i]) ** 2, 0));
            s.rect(0, 0, 0.6, 1, { fill: 'blue', fillAlpha: 0.1, stroke: false }); s.rect(0.3, 0, 0.9, 1, { fill: 'purple', fillAlpha: 0.1, stroke: false });
            for (let i = 0; i < 4; i++) { s.line(edges[i], proj[i], edges[i + 1], proj[i], { color: 'orange', width: 3 }); s.line(edges[i], tar[i], edges[i + 1], tar[i], { color: 'ink', width: 2, dash: true }); }
            s.tex('1_{[0.3,0.6)}', 0.45, 1.06, { color: 'ink' }); s.tex('[0,.6)', 0.12, 0.93, { color: 'blue' }); s.tex('[.3,.9)', 0.8, 0.93, { color: 'purple' });
            info = `Here $\\mathscr H=\\operatorname{span}\\{1,1_{[0,.6)},1_{[.3,.9)}\\}$ is closed under increasing limits (finite-dimensional) but $\\mathscr A$ is not closed under intersections: the best approximation (orange) of $1_{[0.3,0.6)}=1_{[0,.6)}1_{[.3,.9)}$ in $L^2$ is still at distance $${fr(d, 3)}>0$. The $\\pi$-system hypothesis cannot be dropped.`;
          }
        });
        v.readout(() => info);
      },
    },
    {
      num: '5.2.3',
      kind: 'Theorem',
      name: 'Markov property',
      statement: String.raw`Let $X_n$ be the coordinate chain under $P_\mu$ and $\theta_m$ the shift, $(\theta_m\omega)_k=\omega_{m+k}$. For every bounded measurable $Y:\Omega\to\mathbb R$ and $m\ge0$,
$$E_\mu(Y\circ\theta_m\mid\mathscr F_m)=E_{X_m}Y\qquad P_\mu\text{-a.s.}$$
In words: given $\mathscr F_m=\sigma(X_0,\dots,X_m)$, the future $(X_m,X_{m+1},\dots)$ is a chain started at $X_m$, whatever the past was.`,
      idea: String.raw`For $Y$ depending on finitely many coordinates, both sides are computed directly from the product formula of 5.2.1: for $A\in\mathscr F_m$ of the form $\{X_0=a_0,\dots,X_m=a_m\}$ the joint probability factorises as $P(A)\,E_{a_m}Y$. The monotone class theorem (5.2.2) extends the identity from such products to all bounded measurable $Y$.`,
      caption: String.raw`Condition on $X_m=y$ and split the $40\,000$ seeded chains by their previous state $X_{m-1}$ (three colours). The bars show the empirical law of the next two steps $(X_{m+1},X_{m+2})$ in each group, the gold dots the exact Markov prediction $p(y,z_1)p(z_1,z_2)$. For a Markov chain the three groups agree. Turn on *memory* (the next step also favours returning to where the chain just came from) and the groups separate: the Markov property fails.`,
      deps: ['prob-5.2.1', 'prob-5.2.2'],
      tags: ['markov chains'],
      viz(v) {
        const y = v.select('state $y$ at time $m$', ['0', '1', '2'], '0');
        const mS = v.slider('time $m$', 1, 6, 3, { int: true });
        const tau = v.slider('memory strength', 0, 3, 0, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const s = v.stage({ x: [-0.6, 8.6], y: [0, 0.4], axes: 'box', gutter: true, height: 340, xlabel: 'future $(X_{m+1},X_{m+2})$', title: 'law of the future given $X_m=y$, grouped by $X_{m-1}$', xticks: Array.from({ length: 9 }, (_, i) => [i, `${Math.floor(i / 3)}${i % 3}`]) });
        let key = '', R = null;
        const run = (yy, m, ta, sd) => {
          const k = `${yy}|${m}|${ta}|${sd}`; if (k === key) return R; key = k;
          const rg = v.rng(sd * 29 + m), cnt = [0, 1, 2].map(() => new Float64Array(9)), nG = [0, 0, 0];
          const nxt = (x, prev) => { const w = P3[x].map((p, z) => p * (1 + (prev === z ? ta : 0))); const s0 = w[0] + w[1] + w[2]; return drawFrom(rg, w.map((q) => q / s0)); };
          for (let i = 0; i < 40000; i++) {
            let x = drawFrom(rg, [1 / 3, 1 / 3, 1 / 3]), prev = -1, xm1 = -1;
            for (let t = 0; t < m; t++) { const nx = nxt(x, prev); prev = x; x = nx; }
            xm1 = prev; if (x !== yy) continue;
            const z1 = nxt(x, prev), z2 = nxt(z1, x); cnt[xm1][z1 * 3 + z2]++; nG[xm1]++;
          }
          return (R = { cnt, nG });
        };
        let info = '';
        v.render(() => {
          const yy = +y.value, { cnt, nG } = run(yy, mS.value, tau.value, seed), ex = Array.from({ length: 9 }, (_, i) => P3[yy][Math.floor(i / 3)] * P3[Math.floor(i / 3)][i % 3]);
          const laws = cnt.map((c, g) => Array.from(c, (q) => q / Math.max(1, nG[g])));
          s.setView([-0.6, 8.6], [0, Math.max(0.2, ...laws.flat(), ...ex) * 1.15]);
          laws.forEach((L, g) => L.forEach((q, i) => s.rect(i - 0.4 + g * 0.27, 0, i - 0.4 + (g + 1) * 0.27, q, { fill: CLS_COL[g], fillAlpha: 0.55, color: CLS_COL[g], width: 1 })));
          s.dots(ex.map((e, i) => [i, e]), { r: 5, color: 'gold' });
          let mx = 0; for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) mx = Math.max(mx, tvd(laws[a], laws[b]));
          const nmin = Math.max(1, Math.min(...nG)), noise = 0.8 * ex.reduce((q, p) => q + Math.sqrt(p * (1 - p) / nmin), 0) * 0.5;
          info = `Group sizes ($X_{m-1}=0,1,2$): ${nG.join(', ')}.   Largest total-variation gap between two groups: $${fr(mx, 3)}$ (pure sampling noise would give about $${fr(noise * 1.4, 3)}$).`;
        });
        v.legend([[CLS_COL[0], '$X_{m-1}=0$'], [CLS_COL[1], '$X_{m-1}=1$'], [CLS_COL[2], '$X_{m-1}=2$'], ['gold', 'Markov prediction', { dot: true }]]);
        v.readout(() => info);
      },
    },
    {
      num: '5.2.4',
      kind: 'Theorem',
      name: 'Chapman–Kolmogorov equation',
      statement: String.raw`For a chain on a countable state space and all $m,n\ge0$,
$$p^{m+n}(x,z)=\sum_{y}p^{m}(x,y)\,p^{n}(y,z),$$
that is, the $(m+n)$-step transition matrix is the product of the $m$-step and $n$-step matrices, and $p^n$ is the $n$th matrix power of $p$.`,
      idea: String.raw`Split the event $\{X_{m+n}=z\}$ according to the value $y$ of $X_m$ and apply the Markov property (5.2.3) at time $m$: $P_x(X_m=y,X_{m+n}=z)=P_x(X_m=y)P_y(X_n=z)$. Summing over the intermediate state $y$ is matrix multiplication.`,
      caption: String.raw`Move $m$ and $n$. The three matrices are $p^m$, $p^n$ and $p^{m+n}$ (darker is larger); the gold row of $p^m$ and gold column of $p^n$ combine, term by term, into the gold entry $(i,j)$ of the product. The bars at the right are the individual terms $p^m(i,k)p^n(k,j)$ - their sum (green bar) is the entry, and the gold dot is the frequency of that transition among $20\,000$ seeded chains.`,
      deps: ['prob-5.2.3'],
      see: ['stoch-1.2'],
      credit: 'S. Chapman, 1928; A. N. Kolmogorov, 1931 (independently, for continuous-time processes)',
      tags: ['markov chains'],
      viz(v) {
        const mS = v.slider('$m$', 1, 10, 2, { int: true }), nS = v.slider('$n$', 1, 10, 3, { int: true });
        const iS = v.slider('row $i$', 0, 3, 0, { int: true }), jS = v.slider('column $j$', 0, 3, 2, { int: true });
        const mk = (t) => v.stage({ x: [0, 4], y: [0, 4], equal: true, axes: false, height: 230, minWidth: 190, weight: 0.7, title: t });
        const SA = mk('$p^m$'), SB = mk('$p^n$'), SC = mk('$p^{m+n}$');
        const T = v.stage({ x: [-0.6, 3.6], y: [0, 0.5], axes: 'box', gutter: true, height: 230, minWidth: 210, weight: 0.8, xlabel: 'intermediate state $k$ (green: the sum)', xticks: [[0, '0'], [1, '1'], [2, '2'], [3, '3'], [4, 'Σ']], title: 'terms of the sum' });
        let info = '';
        v.render(() => {
          const m = mS.value, n = nS.value, i = iS.value, j = jS.value, Pm = matPowSm(P4, m), Pn = matPowSm(P4, n), Pt = matMulSm(Pm, Pn);
          drawMatrix(v, SA, Pm, { hl: (r) => r === i, size: 10 });
          drawMatrix(v, SB, Pn, { hl: (r, c) => c === j, size: 10 });
          drawMatrix(v, SC, Pt, { hl: (r, c) => r === i && c === j, size: 10 });
          const terms = [0, 1, 2, 3].map((k) => Pm[i][k] * Pn[k][j]), tot = terms.reduce((a, b) => a + b, 0);
          T.setView([-0.6, 4.6], [0, Math.max(0.3, ...terms, Pt[i][j]) * 1.15]);
          T.bars([...terms, tot], { x0: 0, dx: 1, color: (q, k) => (k < 4 ? 'accent' : 'green') });
          const rg = v.rng(11 + m * 17 + n), st = stepper(rg, P4); let hit = 0; const M = 20000;
          for (let q = 0; q < M; q++) { let x = i; for (let t = 0; t < m + n; t++) x = st(x); if (x === j) hit++; }
          T.dot(4, hit / M, { r: 6, color: 'gold' });
          info = `$p^{${m + n}}(${i},${j})=\\sum_k p^{${m}}(${i},k)\\,p^{${n}}(k,${j})=${terms.map((t) => fr(t, 3)).join('+')}=${fr(tot, 4)}$; entry of the matrix power: $${fr(Pt[i][j], 4)}$; simulated: $${fr(hit / M, 4)}$.`;
        });
        v.readout(() => info);
      },
    },
    {
      num: '5.2.5',
      kind: 'Theorem',
      name: 'Strong Markov property',
      statement: String.raw`Let $N$ be a stopping time with respect to $\mathscr F_n=\sigma(X_0,\dots,X_n)$. For bounded measurable $Y$,
$$E_\mu\big(Y\circ\theta_N\mid\mathscr F_N\big)=E_{X_N}Y\qquad\text{on }\{N<\infty\}.$$
After a stopping time the chain restarts afresh from where it stands, independently of $\mathscr F_N$.`,
      idea: String.raw`Decompose according to the value of $N$: on $\{N=n\}$, an event of $\mathscr F_n$ because $N$ is a stopping time (4.2.8a), the ordinary Markov property at the fixed time $n$ (5.2.3) gives the claim, and summing over $n$ proves it. The stopping-time property is exactly what makes $\{N=n\}$ visible to the past, so that conditioning on it does not tilt the future.`,
      caption: String.raw`Start at state 0 and stop when the chain first visits $y$. The panels compare the next two positions after the stopping time with fresh chains started at $y$ (gold dots: exact $p(y,\cdot)$ and $p^2(y,\cdot)$); $20\,000$ seeded runs. Switch to the *non*-stopping time "one step before the first visit to $y$": it peeks at the future, the next position is $y$ for certain, and the restart law is wrong.`,
      deps: ['prob-5.2.3', 'prob-4.2.8a'],
      see: ['stoch-2.8'],
      tags: ['markov chains', 'stopping times'],
      viz(v) {
        const yS = v.select('target state $y$', ['1', '2', '3', '4'], '3');
        const rule = v.select('random time', [{ value: 'T', label: '$T$ = first visit to $y$ (stopping time)' }, { value: 'S', label: '$T-1$ (not a stopping time)' }], 'T');
        let seed = 1; v.button('Resample', () => { seed++; });
        const mk = (t) => v.stage({ x: [-0.6, 4.6], y: [0, 1], axes: 'box', gutter: true, height: 300, minWidth: 260, xticks: [[0, '0'], [1, '1'], [2, '2'], [3, '3'], [4, '4']], title: t });
        const A = mk('position one step after the random time'), B = mk('position two steps after');
        let key = '', R = null;
        const run = (y, rl, sd) => {
          const k = `${y}|${rl}|${sd}`; if (k === key) return R; key = k;
          const rg = v.rng(sd * 83 + y), st = stepper(rg, P5), c1 = new Float64Array(5), c2 = new Float64Array(5), M = 20000;
          for (let i = 0; i < M; i++) {
            let x = 0, t = 0; while (x !== y && t < 5000) { x = st(x); t++; }
            const nx = st(x), n2 = st(nx);
            if (rl === 'T') { c1[nx]++; c2[n2]++; } else { c1[x]++; c2[nx]++; }
          }
          return (R = { e1: Array.from(c1, (c) => c / M), e2: Array.from(c2, (c) => c / M) });
        };
        let info = '';
        v.render(() => {
          const y = +yS.value, { e1, e2 } = run(y, rule.value, seed), P2 = matPowSm(P5, 2), q1 = P5[y], q2 = P2[y];
          [[A, e1, q1], [B, e2, q2]].forEach(([S, e, q]) => { S.setView([-0.6, 4.6], [0, Math.max(0.3, ...e, ...q) * 1.15]); S.bars(e, { x0: 0, dx: 1, color: 'accent' }); S.dots(q.map((p, k) => [k, p]), { r: 6, color: 'gold' }); });
          info = `Total variation distance between the empirical law and the fresh chain's law: one step after $${fr(tvd(e1, q1), 3)}$, two steps after $${fr(tvd(e2, q2), 3)}$ (sampling noise is about $0.01$).`;
        });
        v.legend([['accent', 'after the random time'], ['gold', 'fresh chain from $y$', { dot: true }]]);
        v.readout(() => info);
      },
    },
    {
      num: '5.2.6',
      kind: 'Theorem',
      name: 'k visits: P_x(T_yᵏ < ∞) = ρ_xy ρ_yyᵏ⁻¹',
      statement: String.raw`Let $T_y^0=0$ and $T_y^k=\inf\{n>T_y^{k-1}:X_n=y\}$ be the time of the $k$th visit to $y$, and $\rho_{xy}=P_x(T_y^1<\infty)$. Then for $k\ge1$
$$P_x(T_y^k<\infty)=\rho_{xy}\,\rho_{yy}^{\,k-1}.$$
Hence the number of visits $N(y)$ to $y$ after time $0$ satisfies $P_x(N(y)\ge k)=\rho_{xy}\rho_{yy}^{k-1}$: it is $0$ with probability $1-\rho_{xy}$ and otherwise geometric.`,
      idea: String.raw`Apply the strong Markov property (5.2.5) at the stopping time $T_y^{k-1}$: on $\{T_y^{k-1}<\infty\}$ the chain stands at $y$ and starts afresh, so the probability that it returns once more is $\rho_{yy}$, independently of the past. Multiplying the $k$ factors gives the formula.`,
      caption: String.raw`A five-state chain whose first three states leak into the closed pair $\{3,4\}$ at rate $e$. Choose where to start ($x$) and the target ($y$): blue bars are the exact law $P(N(y)=k)$ computed from $\rho_{xy}$ and $\rho_{yy}$ (found by solving a linear system), gold dots the histogram of $N(y)$ over $4000$ seeded runs of $600$ steps. The last bar collects "$\ge10$ visits". For a recurrent $y$, $\rho_{yy}=1$ and the geometric tail is flat.`,
      deps: ['prob-5.2.5'],
      tags: ['markov chains', 'recurrence'],
      viz(v) {
        const e = v.slider('leak rate $e$', 0.05, 0.6, 0.3, { step: 0.01 });
        const xS = v.select('start $x$', ['0', '1', '2', '3', '4'], '0'), yS = v.select('target $y$', ['0', '1', '2', '3', '4'], '2');
        let seed = 1; v.button('Resample', () => { seed++; });
        const K = 10;
        const s = v.stage({ x: [-0.6, K + 0.6], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'number of visits $N(y)$', xticks: Array.from({ length: K + 1 }, (_, k) => [k, k === K ? `≥${K}` : String(k)]), title: 'visits to $y$ after time 0' });
        let key = '', R = null;
        const run = (ee, x, y, sd) => {
          const k = `${ee}|${x}|${y}|${sd}`; if (k === key) return R; key = k;
          const P = CHAIN5E(ee), rg = v.rng(sd * 61 + x * 5 + y), st = stepper(rg, P), c = new Float64Array(K + 1), M = 4000;
          for (let i = 0; i < M; i++) { let z = x, n = 0; for (let t = 0; t < 600; t++) { z = st(z); if (z === y) n++; } c[Math.min(n, K)]++; }
          return (R = Array.from(c, (q) => q / M));
        };
        let info = '';
        v.render(() => {
          const ee = e.value, x = +xS.value, y = +yS.value, rho = rhoTo(CHAIN5E(ee), y), rxy = rho[x], ryy = rho[y];
          const ex = Array.from({ length: K + 1 }, (_, k) => (k === 0 ? 1 - rxy : k < K ? rxy * ryy ** (k - 1) * (1 - ryy) : rxy * ryy ** (K - 1)));
          const emp = run(ee, x, y, seed);
          s.setView([-0.6, K + 0.6], [0, Math.max(0.2, ...ex, ...emp) * 1.15]);
          s.bars(ex, { x0: 0, dx: 1, color: 'accent' });
          s.dots(emp.map((q, k) => [k, q]), { r: 6, color: 'gold' });
          info = `$\\rho_{${x}${y}}=${fr(rxy, 4)}$ and $\\rho_{${y}${y}}=${fr(ryy, 4)}$, so $P_${x}(N(${y})\\ge k)=${fr(rxy, 3)}\\cdot${fr(ryy, 3)}^{k-1}$.   Expected number of visits $${ryy >= 1 - 1e-9 ? (rxy > 0 ? '\\infty' : '0') : fr(rxy / (1 - ryy), 3)}$; the last bar is capped at $\\ge${K}$ visits.`;
        });
        v.legend([['accent', 'exact: $\\rho_{xy}\\rho_{yy}^{k-1}$ law'], ['gold', 'simulation', { dot: true }]]);
        v.readout(() => info);
      },
    },
    {
      num: '5.2.7',
      kind: 'Theorem',
      name: 'Reflection principle for symmetric random walks',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 5.2.7 and proof, pp. 278–279'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      statement: String.raw`Let $S_n=\xi_1+\dots+\xi_n$ where the $\xi_i$ are i.i.d. with a symmetric law. Then for every $a>0$,
$$P\Big(\max_{m\le n}S_m\ge a\Big)\le 2\,P(S_n\ge a).$$
When the walk cannot jump over $a$ (for instance, simple random walk and integer $a$) this is an identity in the form $P(\max_{m\le n}S_m\ge a)=P(S_n\ge a)+P(S_n>a)$.`,
      idea: String.raw`Let $\tau=\min\{m:S_m\ge a\}$. By the strong Markov property (5.2.5), after $\tau$ the walk $S_{\tau+k}-S_\tau$ is a fresh walk, and by symmetry it is as likely to end up above $S_\tau$ as below: $P(S_n\ge a\mid\tau\le n)\ge\tfrac12$. Reflecting the path after $\tau$ turns the walk that ended below $a$ into one that ends above it, which is the picture. Hence $P(S_n\ge a)\ge\tfrac12P(\tau\le n)$.`,
      caption: String.raw`Choose a symmetric step law (all scaled to variance 1), the horizon $n$ and the level $a=c\sqrt n$. Left: seeded walks; the first one that reaches the level is drawn thick, with its reflected twin (red, dashed) from the first hit onward. Right: from $12\,000$ walks, the three numbers $P(\max\ge a)$, $2P(S_n\ge a)$ and $P(S_n\ge a)$. The true first probability never exceeds the second; sampled values have Monte Carlo error. The identity-case ratio $P(\max\ge a)/P(S_n\ge a)$ is $2$ only up to the overshoot of $a$.`,
      deps: ['prob-5.2.5'],
      credit: 'reflection argument for walks and Brownian motion: D. Mirimanoff and Aebly, 1923 (André\'s 1887 ballot argument is often credited)',
      tags: ['random walk', 'maximal inequalities'],
      viz(v) {
        const law = v.select('step law', [{ value: 'srw', label: '$\\pm1$' }, { value: 'uni', label: 'uniform' }, { value: 'lap', label: 'Laplace' }, { value: 't3', label: '$t_3$' }], 'srw');
        const nS = v.slider('horizon $n$', 10, 200, 100, { int: true }), cS = v.slider('level $a/\\sqrt n$', 0.2, 3, 1.2, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [0, 200], y: [-20, 30], axes: 'box', gutter: true, height: 320, xlabel: 'step $m$', title: 'walks, the level $a$ and one reflected path' });
        const B = v.stage({ x: [-0.5, 3.5], y: [0, 1], axes: 'box', gutter: true, height: 320, minWidth: 260, weight: 0.8, xticks: [[0, 'P(Sₙ ≥ a)'], [1, 'P(max ≥ a)'], [2, '2P(Sₙ ≥ a)']], title: 'the inequality' });
        const step = { srw: (r) => (r() < 0.5 ? -1 : 1), uni: (r) => r.uniform(-Math.sqrt(3), Math.sqrt(3)), lap: (r) => sampleLaplace(r) / Math.SQRT2, t3: (r) => sampleT3(r) / Math.sqrt(3) };
        let key = '', R = null;
        const run = (lw, n, sd) => {
          const k = `${lw}|${n}|${sd}`; if (k === key) return R; key = k;
          const rg = v.rng(sd * 211 + n), mx = new Float64Array(12000), fin = new Float64Array(12000), paths = [];
          for (let i = 0; i < 12000; i++) { let s = 0, m = 0; const tr = i < 8 ? [0] : null; for (let t = 0; t < n; t++) { s += step[lw](rg); if (s > m) m = s; if (tr) tr.push(s); } mx[i] = m; fin[i] = s; if (tr) paths.push(tr); }
          return (R = { mx, fin, paths });
        };
        let info = '';
        v.render(() => {
          const n = nS.value, a = cS.value * Math.sqrt(n), { mx, fin, paths } = run(law.value, n, seed);
          let hit = 0, up = 0, hitUp = 0; for (let i = 0; i < mx.length; i++) { if (mx[i] >= a - 1e-9) { hit++; if (fin[i] >= a - 1e-9) hitUp++; } if (fin[i] >= a - 1e-9) up++; }
          const M = mx.length, pm = hit / M, pu = up / M;
          const lim = Math.max(a * 1.6, 4 * Math.sqrt(n) * 0.9); A.setView([0, n], [-lim, lim]);
          A.hline(a, { color: 'green', width: 2 });
          let shown = false;
          paths.forEach((tr, i) => {
            const t0 = tr.findIndex((x) => x >= a - 1e-9), col = t0 >= 0 && !shown ? 'accent' : 'muted';
            A.path(tr.map((x, t) => [t, x]), { color: col, width: col === 'accent' ? 2 : 1, alpha: col === 'accent' ? 1 : 0.5 });
            if (t0 >= 0 && !shown) { shown = true; A.path(tr.map((x, t) => [t, t <= t0 ? x : 2 * tr[t0] - x]).slice(t0), { color: 'red', width: 2, dash: true }); A.dot(t0, tr[t0], { r: 5, color: 'gold' }); }
          });
          B.setView([-0.5, 3.5], [0, Math.min(1.05, Math.max(0.05, 2 * pu * 1.2))]);
          B.bars([pu, pm, 2 * pu], { x0: 0, dx: 1, color: (q, i) => ['accent', 'orange', 'purple'][i] });
          info = `$P(\\max_{m\\le n}S_m\\ge a)=${fr(pm, 4)}$,  $2P(S_n\\ge a)=${fr(2 * pu, 4)}$ - the inequality holds: ${pm <= 2 * pu + 1e-9 ? 'yes' : 'no (sampling noise)'}.   $P(S_n\\ge a\\mid\\tau\\le n)=${fr(hit ? hitUp / hit : 0, 3)}\\ge\\tfrac12$.`;
        });
        v.readout(() => info);
      },
    },
  ],
};
