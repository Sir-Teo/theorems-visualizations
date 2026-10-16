// Probability: Theory and Examples (Durrett) — Chapter 5, part Z2: Harris chains on a general state space (§5.8)
import { PHI, gcd, phi, fx, minor, harrisStep, stationaryVar, gridAR, splitGrid, vecP, vecM, matVecR, matMulS, cdfSample, tvNormal, stationary } from './ch05-z.shared.js';

const markovDef = 'prob-5.1.1a';
const SPLIT_CREDIT = 'Harris, 1956 (Harris chains); splitting: Nummelin and Athreya–Ney, 1978';
const bars = (S, vals, x0, w, opts) => vals.forEach((h, i) => S.rect(x0 + i * w, 0, x0 + (i + 1) * w, h, opts));

/** Regeneration cycles of the AR(1) chain: occupation counts of the states X_0..X_{T-1} of each cycle (X_0 ~ nu). */
function cycles(mn, N, rng, nb, lo, hi, cap = 600000) {
  const counts = new Float64Array(nb), w = (hi - lo) / nb; let x = mn.sample(rng), c = 0, steps = 0, T = 0;
  while (c < N && steps < cap) {
    const b = Math.floor((x - lo) / w); if (b >= 0 && b < nb) counts[b]++; T++;
    const [y, reg] = harrisStep(x, mn, rng); steps++; x = y; if (reg) c++;
  }
  return { counts, N: c, meanT: T / Math.max(1, c), steps };
}
const dens = (counts, N, w) => Array.from(counts, (c) => c / (N * w));

export default {
  collection: 'prob',
  chapter: 5,
  items: [
    {
      num: '5.8.1a',
      kind: 'Definition',
      name: 'Harris chain',
      statement: String.raw`A Markov chain $X_n$ on a measurable space $(S,\mathcal S)$ is a **Harris chain** if there are sets $A,B\in\mathcal S$ and a measure $\rho$ with $\rho(B)>0$ such that
(i) $P_z(\tau_A<\infty)>0$ for every $z\in S$, where $\tau_A=\inf\{n\ge0: X_n\in A\}$, and
(ii) $p(x,C)\ge\rho(C)$ for all $x\in A$ and all measurable $C\subset B$.
The condition (ii) is a *minorization*: from every point of $A$ the next step contains a common piece $\rho$ that does not depend on the point.`,
      idea: String.raw`On a countable space any single state $A=B=\{a\}$ works, with $\rho=p(a,\cdot)$. In general (ii) lets one flip a coin with probability $\varepsilon=\rho(B)$ at each visit to $A$ and, on heads, draw the next state from the fixed law $\nu=\rho/\varepsilon$ — whatever the current point of $A$ was. These coin flips produce *regeneration times* at which the future is independent of the past; the splitting of 5.8.4 makes this exact.`,
      caption: String.raw`The chain $X_{n+1}=aX_n+\xi$ with $\xi\sim N(0,1)$ and $A=B=[-c,c]$. Left: a path; gold dots mark steps where the minorization coin came up heads and the state was redrawn from $\nu$. Right: the transition densities $p(x,\cdot)$ from $x=-c,0,c$ (blue) all lie above the green shape $\varepsilon\nu$, the largest common minorant. Widen $c$ and $\varepsilon$ shrinks; make $a$ small and it grows.`,
      deps: [markovDef],
      credit: 'T. E. Harris, 1956; the A, B, ρ formulation is the textbook’s',
      verify: true,
      tags: ['general state space'],
      scope: String.raw`The page uses $A=B$ and an explicit $\rho=\varepsilon\nu$ on all of $\mathbb R$ for the AR(1) kernel; the textbook’s definition allows $A\ne B$ and a $\rho$ living on a part of the space.`,
      viz(v) {
        const st = {};
        const aS = v.slider('$a$', 0.2, 0.95, 0.7, { step: 0.05 });
        const cS = v.slider('$c$', 0.25, 2, 1, { step: 0.05 });
        let seed = 1; v.button('New path', () => { seed++; });
        const P = v.stage({ x: [0, 150], y: [-5, 5], height: 330, axes: 'box', gutter: true, xlabel: '$n$', ylabel: '$X_n$', title: 'path and regeneration steps' });
        const D = v.stage({ x: [-5, 5], y: [0, 0.65], height: 330, axes: 'box', gutter: true, xlabel: '$y$', title: String.raw`$p(x,\cdot)$ and $\varepsilon\nu$`, weight: 0.8, minWidth: 260 });
        v.render(() => {
          const a = aS.value, c = cS.value, mn = minor(a, -c, c), r = v.rng(seed * 11 + 3); let x = 0, reg = 0, vis = 0; const path = [x], regs = [];
          for (let n = 1; n <= 150; n++) { if (Math.abs(x) <= c) vis++; const [y, g] = harrisStep(x, mn, r); x = Math.max(-9, Math.min(9, y)); path.push(x); if (g) { reg++; regs.push(n); } }
          P.hband(-c, c, { color: 'orange', alpha: 0.18 });
          P.path(path.map((y, n) => [n, y]), { color: 'accent', width: 1.5 });
          regs.forEach((n) => P.dot(n, path[n], { color: 'gold', r: 4.5 }));
          [-c, 0, c].forEach((x0, i) => D.fn((y) => phi(y - a * x0), { color: 'accent', width: 1.6, alpha: 0.4 + 0.3 * (i === 1) }));
          D.fn((y) => mn.eps * mn.nu(y), { color: 'green', width: 2.6, fill: true, fillAlpha: 0.35 });
          D.text(`ε = ${fx(mn.eps, 3)}`, 4.8, 0.58, { align: 'right', color: 'green', size: 14 });
          st.stats = { eps: mn.eps, reg, vis };
        });
        v.legend([['orange', 'the set $A=[-c,c]$'], ['gold', 'regeneration'], ['accent', '$p(x,\\cdot)$, $x=-c,0,c$'], ['green', '$\\varepsilon\\nu$']]);
        v.readout(() => { const s = st.stats || {}; return `$\\varepsilon=${fx(s.eps || 0, 3)}$. In 150 steps: ${s.vis} visits to $A$, ${s.reg} regenerations (expected about $\\varepsilon\\cdot${s.vis}=${fx((s.eps || 0) * (s.vis || 0), 1)}$).`; });
      },
    },
    {
      num: '5.8.4',
      kind: 'Lemma',
      name: 'Splitting identities for the auxiliary kernel',
      statement: String.raw`Let $X_n$ be a Harris chain with $A=B$ and $p(x,\cdot)\ge\varepsilon\nu$ for $x\in A$. On $\bar S=S\cup\{\alpha\}$ define the kernel $v$ from $S$ to $\bar S$ by $v(x,\cdot)=\delta_x$ for $x\notin A$ and $v(x,\cdot)=(1-\varepsilon)\delta_x+\varepsilon\delta_\alpha$ for $x\in A$, and the kernel $\bar p$ from $\bar S$ to $S$ by $\bar p(\alpha,\cdot)=\nu$, $\bar p(x,\cdot)=p(x,\cdot)$ for $x\notin A$, and $\bar p(x,\cdot)=\frac{p(x,\cdot)-\varepsilon\nu}{1-\varepsilon}$ for $x\in A$. Then each $\bar p(x,\cdot)$ is a probability measure and
$$v\,\bar p=p .$$`,
      idea: String.raw`For $x\notin A$ both sides are $p(x,\cdot)$. For $x\in A$, $v\bar p(x,\cdot)=(1-\varepsilon)\bar p(x,\cdot)+\varepsilon\bar p(\alpha,\cdot)=\big(p(x,\cdot)-\varepsilon\nu\big)+\varepsilon\nu$. Positivity of $\bar p(x,\cdot)$ is exactly the minorization $p(x,\cdot)\ge\varepsilon\nu$. So a $p$-step is the same as first deciding whether to jump to the pseudo-state $\alpha$, and then drawing from $\nu$ (if at $\alpha$) or from the remainder kernel.`,
      credit: SPLIT_CREDIT,
      verify: true,
      caption: String.raw`The AR(1) chain $X'=aX+\xi$ discretised to $41$ cells on $[-5,5]$. The heat maps show $p$ ($41\times41$), $v$ ($41\times42$, last column $=\alpha$) and $\bar p$ ($42\times41$, last row $=\alpha$ equal to $\nu$). The rows between the orange lines are those of $A$: there $v$ puts mass $\varepsilon$ on the $\alpha$-column and $\bar p$ has the $\varepsilon\nu$ removed. The readout multiplies $v\bar p$ and compares it with $p$.`,
      deps: ['prob-5.8.1a'],
      tags: ['general state space'],
      viz(v) {
        const aS = v.slider('$a$', 0.2, 0.9, 0.6, { step: 0.05 });
        const cS = v.slider('$c$', 0.25, 2.5, 1, { step: 0.05 });
        const K = 41;
        const mk = (M, rows, cols, name, extra) => v.stage({ x: [0, cols], y: [0, rows], height: 250, axes: false, aspect: rows / cols, minWidth: 240, title: name, ...(extra || {}) });
        const Sp = mk(null, K, K, '$p$'), Sv = mk(null, K, K + 1, '$v$'), Sb = mk(null, K + 1, K, String.raw`$\bar p$`);
        let key = '', G = null;
        const get = () => { const k = aS.value + '|' + cS.value; if (k !== key) { key = k; const g = gridAR(aS.value, K, 5), sp = splitGrid(g, cS.value); G = { g, sp }; } return G; };
        const heatOf = (S, M, rows, cols, mx, k) => {
          S.heat((x, y) => { const i = Math.floor(rows - y), j = Math.floor(x); return M[i] && M[i][j] !== undefined ? Math.sqrt(M[i][j] / mx) : NaN; }, { range: [0, 1], cmap: 'theme', color: 'accent', rect: [0, 0, cols, rows], res: 3, key: k });
        };
        v.render(() => {
          const { g, sp } = get(), k = key;
          const mx = Math.max(...g.P.flat());
          heatOf(Sp, g.P, K, K, mx, 'p' + k); heatOf(Sv, sp.V, K, K + 1, 1, 'v' + k); heatOf(Sb, sp.Pb, K + 1, K, Math.max(...sp.Pb.flat()), 'b' + k);
          const rowsA = sp.inA.map((b, i) => (b ? i : -1)).filter((i) => i >= 0);
          if (rowsA.length) { const top = K - rowsA[0], bot = K - rowsA[rowsA.length - 1] - 1; [Sp, Sv].forEach((S, q) => { S.hline(top, { color: 'orange', width: 1.4 }); S.hline(bot, { color: 'orange', width: 1.4 }); }); Sb.hline(K + 1 - rowsA[0], { color: 'orange', width: 1.4 }); Sb.hline(K + 1 - rowsA[rowsA.length - 1] - 1, { color: 'orange', width: 1.4 }); }
          Sv.vline(K, { color: 'green', width: 1.4 }); Sb.hline(1, { color: 'green', width: 1.4 });
        });
        v.readout(() => {
          const { g, sp } = get(), VP = matMulS(sp.V, sp.Pb); let err = 0, neg = 0, rowErr = 0;
          VP.forEach((row, i) => row.forEach((x, j) => { err = Math.max(err, Math.abs(x - g.P[i][j])); }));
          sp.Pb.forEach((row) => { rowErr = Math.max(rowErr, Math.abs(row.reduce((a, b) => a + b, 0) - 1)); row.forEach((x) => { if (x < -1e-15) neg++; }); });
          return `$\\varepsilon=${fx(sp.eps, 4)}$. $\\max|v\\bar p-p|=${err.toExponential(1)}$; the rows of $\\bar p$ sum to $1$ within ${rowErr.toExponential(1)}$ and ${neg} entries are negative.`;
        });
      },
    },
    {
      num: '5.8.5',
      kind: 'Lemma',
      name: 'The split chain is a Markov chain',
      statement: String.raw`Let $\bar X_0,\bar X_1,\bar X_2,\dots$ alternate between $S$ and $\bar S$: $\bar X_{2n}\in S$, $\bar X_{2n+1}\sim v(\bar X_{2n},\cdot)$ and $\bar X_{2n+2}\sim\bar p(\bar X_{2n+1},\cdot)$, each time using only the current state. This is a (time-inhomogeneous, alternating) Markov chain, and $\bar X_{2n}$ has the same law as the original chain $X_n$. The odd-time states $Z_n=\bar X_{2n+1}$ form a Markov chain on $\bar S$ with kernel $\bar p v$; whenever $Z_n=\alpha$ the next original state is drawn from $\nu$, whatever happened before.`,
      idea: String.raw`The construction is by definition Markov, and $v\bar p=p$ (5.8.4) shows that the even-time marginals are the original chain: two steps of the alternating chain are one step of $p$. The regeneration property is read off the kernel $\bar p(\alpha,\cdot)=\nu$, which does not depend on how the chain reached $\alpha$.`,
      credit: SPLIT_CREDIT,
      verify: true,
      caption: String.raw`Simulate the odd-time chain $Z_n$ (kernel $\bar pv$, on the 41-cell discretisation) and look at the step *after* each visit to $\alpha$, split by the previous state of $Z$: negative cell (blue), positive cell (orange) or $\alpha$ itself (purple). All three conditional histograms trace the same law, $\nu v$ (green), though the pasts differ.`,
      deps: ['prob-5.8.4'],
      tags: ['general state space'],
      viz(v) {
        const aS = v.slider('$a$', 0.2, 0.9, 0.6, { step: 0.05 });
        const cS = v.slider('$c$', 0.5, 2.5, 1.5, { step: 0.05 });
        const nS = v.slider('steps', 2000, 80000, 30000, { log: true, int: true });
        let seed = 1; v.button('New run', () => { seed++; });
        const K = 41;
        const S = v.stage({ x: [-5, 5], y: [0, 0.6], height: 340, axes: 'box', gutter: true, xlabel: String.raw`cell $x$ of $Z_{n+1}$ (probability per unit length)`, title: String.raw`law of $Z_{n+1}$ given $Z_n=\alpha$` });
        let key = '', R = null;
        const get = () => {
          const k = aS.value + '|' + cS.value + '|' + nS.value + '|' + seed; if (k === key) return R; key = k;
          const g = gridAR(aS.value, K, 5), sp = splitGrid(g, cS.value), r = v.rng(seed * 29 + 1);
          const Kb = matMulS(sp.Pb, sp.V), cnt = [0, 1, 2].map(() => new Float64Array(K + 1)), tot = [0, 0, 0]; let z = 0, vis = 0, prevz = -1;
          for (let n = 0; n < nS.value; n++) {
            const nz = cdfSample(Kb[z], r);
            if (z === K) { vis++; if (prevz >= 0) { const grp = prevz === K ? 2 : g.xs[prevz] < 0 ? 0 : 1; cnt[grp][nz]++; tot[grp]++; } }
            prevz = z; z = nz;
          }
          const tau = vecM(sp.nu, sp.V);
          R = { g, sp, cnt, tot, tau, vis }; return R;
        };
        v.render(() => {
          const { g, sp, cnt, tot, tau } = get(); const h = g.h;
          const cols = ['accent', 'orange', 'purple'];
          cnt.forEach((c, q) => { if (tot[q] > 0) S.path(Array.from({ length: K }, (_, i) => [g.xs[i], c[i] / tot[q] / h]), { color: cols[q], width: 1.8, alpha: 0.9 }); });
          S.path(Array.from({ length: K }, (_, i) => [g.xs[i], tau[i] / h]), { color: 'green', width: 3, alpha: 0.7, dash: [8, 5] });
        });
        v.legend([['accent', 'previous $Z$ in a negative cell'], ['orange', 'previous $Z$ in a positive cell'], ['purple', 'previous $Z=\\alpha$'], ['green', '$\\nu v$ (S-part)', { dash: true }]]);
        v.readout(() => { const { sp, cnt, tot, tau, vis } = get(); const tv = (q) => (tot[q] ? 0.5 * Array.from({ length: K }, (_, i) => Math.abs(cnt[q][i] / tot[q] - tau[i])).reduce((a, b) => a + b, 0) : NaN); return `${vis} visits to $\\alpha$ ($\\varepsilon=${fx(sp.eps, 3)}$); sample sizes ${tot.join(' / ')}. TV distance of each conditional law from $\\nu v$: ${[0, 1, 2].map((q) => fx(tv(q), 3)).join(', ')}.`; });
      },
    },
    {
      num: '5.8.6',
      kind: 'Lemma',
      name: 'Expectations transfer to the split chain',
      statement: String.raw`With $\bar X$ the alternating split chain of 5.8.5 started at $\bar X_0=x\in S$ and a bounded function $f$ on $S$,
$$E_x f(X_n)=E_x f(\bar X_{2n}),\qquad E_x f(X_{n+1})=E_x\,\bar f(\bar X_{2n+1}),$$
where $\bar f(y)=\sum_z\bar p(y,z)f(z)=(\bar pf)(y)$, in particular $\bar f(\alpha)=\int f\,d\nu$. So the original chain's expectations can be computed on the split chain, where $\alpha$ is an atom.`,
      idea: String.raw`Since $v\bar p=p$ (5.8.4), a double step of the alternating chain has kernel $p$, so $\bar X_{2n}$ has the law of $X_n$ by induction. For the odd times, one more $\bar p$-step from $\bar X_{2n+1}$ lands on $\bar X_{2n+2}\overset{d}{=}X_{n+1}$; averaging $f$ over that step gives $\bar pf$.`,
      credit: SPLIT_CREDIT,
      verify: true,
      caption: String.raw`Choose a test function and a starting cell. Curves: $E f(X_n)$ computed exactly for the original discretised chain (blue) and from the alternating chain (green dashes) — they coincide. Dots: simulation of the alternating chain (3000 runs) at even times $2n$ (gold) and the odd-time quantity $E\bar f(\bar X_{2n+1})$ (purple), both landing on the blue curve up to sampling noise.`,
      deps: ['prob-5.8.5'],
      tags: ['general state space'],
      viz(v) {
        const fS = v.select('$f$', [{ value: 'x', label: '$x$' }, { value: 'x2', label: '$x^2$' }, { value: 'ind', label: '$1_{x>1}$' }, { value: 'cos', label: '$\\cos 2x$' }], 'x2');
        const x0S = v.slider('start $x_0$', -4.5, 4.5, 3, { step: 0.25 });
        const aS = v.slider('$a$', 0.3, 0.9, 0.7, { step: 0.05 });
        let seed = 1; v.button('Resimulate', () => { seed++; });
        const K = 41, NN = 14;
        const S = v.stage({ x: [0, NN], y: [-1, 1], height: 340, axes: 'box', gutter: true, xlabel: '$n$', title: String.raw`$E_x f(X_n)$` });
        const F = { x: (x) => x, x2: (x) => x * x, ind: (x) => (x > 1 ? 1 : 0), cos: (x) => Math.cos(2 * x) };
        let key = '', R = null;
        const get = () => {
          const k = fS.value + '|' + x0S.value + '|' + aS.value + '|' + seed; if (k === key) return R; key = k;
          const g = gridAR(aS.value, K, 5), sp = splitGrid(g, 1), f = g.xs.map(F[fS.value]), fb = matVecR(sp.Pb, f), r = v.rng(seed * 37 + 5);
          let i0 = 0; g.xs.forEach((x, i) => { if (Math.abs(x - x0S.value) < Math.abs(g.xs[i0] - x0S.value)) i0 = i; });
          const Kb = matMulS(sp.Pb, sp.V); let mu = new Array(K).fill(0); mu[i0] = 1; let mz = vecM(mu, sp.V);
          const ex = [], sp2 = [], odd = [];
          for (let n = 0; n <= NN; n++) { ex.push(mu.reduce((s, m, i) => s + m * f[i], 0)); mu = vecP(mu, g.P); }
          mu = new Array(K).fill(0); mu[i0] = 1; let ev = mu.slice(), zs = vecM(ev, sp.V);
          for (let n = 0; n <= NN; n++) { sp2.push(ev.reduce((s, m, i) => s + m * f[i], 0)); odd.push(zs.reduce((s, m, i) => s + m * fb[i], 0)); ev = vecM(zs, sp.Pb); zs = vecM(ev, sp.V); }
          const RUNS = 3000, mcE = new Float64Array(NN + 1), mcO = new Float64Array(NN + 1);
          for (let k = 0; k < RUNS; k++) { let x = i0; for (let n = 0; n <= NN; n++) { mcE[n] += f[x]; const z = cdfSample(sp.V[x], r); mcO[n] += fb[z]; x = cdfSample(sp.Pb[z], r); } }
          R = { ex, sp2, odd, mcE: Array.from(mcE, (s) => s / RUNS), mcO: Array.from(mcO, (s) => s / RUNS), i0, g }; return R;
        };
        v.render(() => {
          const { ex, sp2, odd, mcE, mcO } = get(); const all = [...ex, ...mcE, ...mcO], lo = Math.min(...all), hi = Math.max(...all), pad = 0.15 * (hi - lo || 1);
          S.setView([0, NN], [lo - pad, hi + pad]);
          S.path(ex.map((y, n) => [n, y]), { color: 'accent', width: 3 });
          S.path(sp2.map((y, n) => [n, y]), { color: 'green', width: 2, dash: [8, 5] });
          mcE.forEach((y, n) => S.dot(n, y, { color: 'gold', r: 4 }));
          mcO.forEach((y, n) => S.dot(n, y, { color: 'purple', r: 3, hollow: true }));
        });
        v.legend([['accent', 'original chain (exact)'], ['green', 'alternating chain (exact)', { dash: true }], ['gold', 'simulated $f(\\bar X_{2n})$'], ['purple', 'simulated $\\bar f(\\bar X_{2n+1})$ vs $E f(X_{n+1})$']]);
        v.readout(() => { const { ex, sp2, odd, mcE } = get(); let e1 = 0, e2 = 0, e3 = 0; ex.forEach((y, n) => { e1 = Math.max(e1, Math.abs(y - sp2[n])); e3 = Math.max(e3, Math.abs(y - mcE[n])); if (n < NN) e2 = Math.max(e2, Math.abs(ex[n + 1] - odd[n])); }); return `Exact original vs exact alternating: max difference ${e1.toExponential(1)}; odd-time identity (against $Ef(X_{n+1})$): ${e2.toExponential(1)}; simulation vs exact: ${fx(e3, 3)}.`; });
      },
    },
    {
      num: '5.8.8',
      kind: 'Theorem',
      name: 'Recurrence of Harris chains',
      statement: String.raw`Let $X_n$ be a Harris chain with $A,B,\rho$ as in 5.8.1a. If $P_z(X_n\in A\text{ i.o.})=1$ for every $z$ (equivalently, the atom $\alpha$ of the split chain is recurrent), then the chain is **Harris recurrent**: for every measurable $C$ with $\rho(C)>0$, $P_z(X_n\in C\text{ i.o.})=1$ for all $z\in S$.`,
      idea: String.raw`Each visit to $A$ triggers, independently, a regeneration with probability $\varepsilon$ (a visit of the split chain to $\alpha$). If $A$ is visited i.o., infinitely many of these independent coin flips succeed (Borel–Cantelli II), so $\alpha$ is visited i.o. After each visit the next state is drawn from $\nu$, and $\nu$ charges the sets $C$ in question, so by the strong Markov property (5.2.5) the independent excursions from $\alpha$ hit $C$ infinitely often.`,
      credit: SPLIT_CREDIT,
      verify: true,
      caption: String.raw`A long run of $X_{n+1}=aX_n+\xi$ with $A=[-1,1]$ and $\lambda=$ Lebesgue measure; gold ticks are visits to $\alpha$ (regenerations). Right: running counts of regenerations (gold) and of visits to $C=[1,1.5]$ (accent). For $a<1$ both grow linearly; at $a=1$ (recurrent, but only like a Gaussian random walk) they grow like $\sqrt n$; for $a=1.15$ the chain is transient, the counts stop and the path escapes.`,
      deps: ['prob-5.8.5', 'prob-5.2.5'],
      tags: ['general state space', 'recurrence'],
      scope: String.raw`The statement is a faithful paraphrase only for the typical situation $B\subset A$ and $\nu\ll\lambda$; the exact formulation of 'Harris recurrent' in the source should be checked.`,
      viz(v) {
        const st = {};
        const aS = v.select('$a$', [0.5, 0.9, 1, 1.15].map((a) => ({ value: a, label: String(a) })), 0.9);
        const nS = v.slider('steps $N$', 500, 20000, 8000, { log: true, int: true });
        let seed = 1; v.button('New run', () => { seed++; });
        const P = v.stage({ x: [0, 8000], y: [-8, 8], height: 330, axes: 'box', gutter: true, xlabel: '$n$', ylabel: '$X_n$', title: 'path; ticks are visits to $\\alpha$' });
        const C = v.stage({ x: [0, 8000], y: [0, 100], height: 330, axes: 'box', gutter: true, xlabel: '$n$', title: 'running counts', weight: 0.9 });
        let key = '', R = null;
        const get = () => {
          const k = aS.value + '|' + nS.value + '|' + seed; if (k === key) return R; key = k;
          const a = aS.value, mn = minor(a, -1, 1), r = v.rng(seed * 41 + 2), N = nS.value; let x = 0;
          const path = [], regs = [], cReg = [], cC = []; let nr = 0, nc = 0;
          for (let n = 1; n <= N; n++) { const [y, g] = harrisStep(x, mn, r); x = Math.max(-1e9, Math.min(1e9, y)); if (g) { nr++; regs.push(n); } if (x >= 1 && x <= 1.5) nc++; if (n % Math.ceil(N / 400) === 0) { path.push([n, x]); cReg.push([n, nr]); cC.push([n, nc]); } }
          R = { path, regs, cReg, cC, nr, nc, eps: mn.eps, N }; return R;
        };
        v.render(() => {
          const { path, regs, cReg, cC, N } = get(); const mx = Math.max(6, ...path.map((p) => Math.abs(p[1]))), ym = Math.max(5, ...cReg.map((p) => p[1]), ...cC.map((p) => p[1]));
          P.setView([0, N], [-Math.min(mx, 1e4) * 1.05, Math.min(mx, 1e4) * 1.05]);
          P.hband(-1, 1, { color: 'orange', alpha: 0.25 });
          P.path(path, { color: 'accent', width: 1.2 });
          const vy = Math.min(mx, 1e4) * 1.05;
          regs.forEach((n) => P.line(n, -vy, n, -vy * 0.85, { color: 'gold', width: 1, alpha: 0.7 }));
          C.setView([0, N], [0, ym * 1.1]);
          C.path(cReg, { color: 'gold', width: 2.4 }); C.path(cC, { color: 'accent', width: 2 });
        });
        v.legend([['orange', '$A=[-1,1]$'], ['gold', 'regenerations'], ['accent', 'visits to $C=[1,1.5]$']]);
        v.readout(() => { const { nr, nc, eps, N } = get(); return `$\\varepsilon=${fx(eps, 3)}$. After ${N} steps: ${nr} visits to $\\alpha$, ${nc} visits to $C$ (Lebesgue measure ${0.5}).${aS.value > 1 ? ' The chain is transient: it escapes to infinity.' : ''}`; });
      },
    },
    {
      num: '5.8.9',
      kind: 'Theorem',
      name: 'Recurrent Harris chains have σ-finite stationary measures',
      statement: String.raw`If $X_n$ is a recurrent Harris chain, then $\mu(C)=E_\alpha\sum_{n=0}^{T_\alpha-1}\mathbf 1_{(\bar X_n\in C)}$ (occupation measure of one excursion of the split chain from $\alpha$, projected to $S$) defines a stationary $\sigma$-finite measure for $p$: $\int\mu(dx)p(x,C)=\mu(C)$. It is finite exactly when $E_\alpha T_\alpha<\infty$.`,
      idea: String.raw`This is the cycle trick of 5.5.7 applied to the atom $\alpha$ of the split chain: the expected number of visits to a state between two visits to $\alpha$ is a stationary measure for the split chain. Projecting to $S$ gives a measure for the original chain, using the correspondence between stationary measures established in 5.8.10.`,
      caption: String.raw`For $X_{n+1}=aX_n+\xi$ with $A=[-c,c]$ and its regeneration law $\nu$, histogram the states $X_0,\dots,X_{T-1}$ visited during each cycle between regenerations, and divide by the number of cycles. After normalising, the histogram (accent) matches the exact stationary normal density $N(0,1/(1-a^2))$ (green). The un-normalised total mass per cycle is $E\,T$ (the mean cycle length).`,
      deps: ['prob-5.5.7', 'prob-5.8.4'],
      credit: SPLIT_CREDIT,
      verify: true,
      tags: ['general state space', 'stationary measures'],
      viz(v) {
        const st = {};
        const aS = v.slider('$a$', 0.2, 0.9, 0.7, { step: 0.05 });
        const cS = v.slider('$c$', 0.5, 2.5, 1.2, { step: 0.05 });
        const nS = v.slider('cycles', 50, 20000, 1000, { log: true, int: true });
        let seed = 1; v.button('New cycles', () => { seed++; });
        const S = v.stage({ x: [-5, 5], y: [0, 0.8], height: 340, axes: 'box', gutter: true, xlabel: '$x$', title: 'occupation density of the cycles' });
        const NB = 50;
        v.render(() => {
          const a = aS.value, mn = minor(a, -cS.value, cS.value), res = cycles(mn, nS.value, v.rng(seed * 43 + 1), NB, -5, 5), w = 10 / NB, tot = res.counts.reduce((s, c) => s + c, 0);
          const d = Array.from(res.counts, (c) => c / (tot * w));
          bars(S, d, -5, w, { fill: 'accent', fillAlpha: 0.3, color: 'accent' });
          const s2 = stationaryVar(a);
          S.fn((x) => phi(x / Math.sqrt(s2)) / Math.sqrt(s2), { color: 'green', width: 2.6 });
          let tvv = 0; d.forEach((y, i) => { const x0 = -5 + i * w; tvv += Math.abs(y - (PHI((x0 + w) / Math.sqrt(s2)) - PHI(x0 / Math.sqrt(s2))) / w) * w; });
          st.out = { ET: res.meanT, N: res.N, eps: mn.eps, tv: tvv / 2, steps: res.steps };
        });
        v.legend([['accent', 'excursion occupation (normalised)'], ['green', 'exact $N(0,1/(1-a^2))$']]);
        v.readout(() => { const o = st.out || {}; return `$\\varepsilon=${fx(o.eps || 0, 3)}$; ${o.N} cycles, ${o.steps} steps; mean cycle length $E\\,T\\approx${fx(o.ET || 0, 2)}$ (total mass of $\\mu$). TV distance of the normalised histogram from the normal: ${fx(o.tv || 0, 3)}.`; });
      },
    },
    {
      num: '5.8.10',
      kind: 'Lemma',
      name: 'Stationary measures of chain and split chain correspond',
      statement: String.raw`If $\mu$ is a stationary measure for $p$ (a measure on $S$ with $\mu p=\mu$), then $\bar\mu=\mu v$ on $\bar S$ is stationary for the split chain's odd-time kernel $\bar p v$, i.e. $\bar\mu\,\bar pv=\bar\mu$. Conversely, if $\bar\mu$ is stationary for $\bar pv$ then $\mu=\bar\mu\bar p$ is stationary for $p$.`,
      idea: String.raw`Both directions use only $v\bar p=p$ (5.8.4). If $\mu p=\mu$ then $(\mu v)(\bar pv)=\mu(v\bar p)v=\mu pv=\mu v$. Conversely $(\bar\mu\bar p)p=\bar\mu(\bar pv)\bar p=\bar\mu\bar p$. The same associativity move transports stationarity in both directions.`,
      credit: SPLIT_CREDIT,
      verify: true,
      caption: String.raw`On the 41-cell discretisation of the AR(1) chain: the stationary vector $\pi$ (grey outline), its image $\bar\pi=\pi v$ (blue; the mass on $A$ is multiplied by $1-\varepsilon$) and the extra atom $\alpha$ with mass $\varepsilon\pi(A)$ (orange bar at the right end). The readout shows how close $\bar\pi\bar pv-\bar\pi$ and $\bar\pi\bar p-\pi$ are to zero.`,
      deps: ['prob-5.8.4'],
      tags: ['general state space', 'stationary measures'],
      viz(v) {
        const aS = v.slider('$a$', 0.2, 0.9, 0.7, { step: 0.05 });
        const cS = v.slider('$c$', 0.25, 2.5, 1, { step: 0.05 });
        const S = v.stage({ x: [-5.5, 7], y: [0, 0.3], height: 340, axes: 'box', gutter: true, xlabel: 'cell $x$; the bar at $x=6$ is $\\alpha$', title: String.raw`$\pi$ and $\bar\pi=\pi v$` });
        v.render(() => {
          const g = gridAR(aS.value, 41, 5), sp = splitGrid(g, cS.value), pi = stationary(g.P, 6000), pb = vecM(pi, sp.V), w = g.h * 0.9;
          pi.forEach((p, i) => S.rect(g.xs[i] - g.h / 2, 0, g.xs[i] + g.h / 2, p, { color: 'ink', fill: false, width: 1, alpha: 0.7 }));
          pb.slice(0, 41).forEach((p, i) => S.rect(g.xs[i] - w / 2, 0, g.xs[i] + w / 2, p, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1 }));
          S.rect(5.75, 0, 6.25, pb[41], { fill: 'orange', fillAlpha: 0.6, color: 'orange' });
          const orange = sp.inA.map((b, i) => (b ? g.xs[i] : null)).filter((x) => x !== null);
          if (orange.length) S.hband(0, 0.004, { color: 'orange', alpha: 0.4 });
        });
        v.legend([['ink', '$\\pi$'], ['accent', '$\\bar\\pi=\\pi v$ on $S$'], ['orange', '$\\bar\\pi(\\alpha)=\\varepsilon\\pi(A)$']]);
        v.readout(() => {
          const g = gridAR(aS.value, 41, 5), sp = splitGrid(g, cS.value), pi = stationary(g.P, 6000), pb = vecM(pi, sp.V);
          const K2 = matMulS(sp.Pb, sp.V), pb2 = vecM(pb, K2), back = vecM(pb, sp.Pb);
          const e1 = Math.max(...pb.map((x, i) => Math.abs(x - pb2[i]))), e2 = Math.max(...pi.map((x, i) => Math.abs(x - back[i])));
          return `$\\varepsilon=${fx(sp.eps, 3)}$. $\\max|\\bar\\pi\\,\\bar pv-\\bar\\pi|=${e1.toExponential(1)}$, $\\max|\\bar\\pi\\bar p-\\pi|=${e2.toExponential(1)}$ (the power iteration for $\\pi$ is itself accurate only to about 1e-8).`;
        });
      },
    },
    {
      num: '5.8.11',
      kind: 'Theorem',
      name: 'Recurrent Harris chains: stationary measure is unique',
      statement: String.raw`A recurrent Harris chain has, up to a constant multiple, only one $\sigma$-finite stationary measure. Consequently, the measures $\mu_A$ built from different regeneration pairs $(A,\nu)$ differ only by a constant factor, and the normalised ones coincide.`,
      idea: String.raw`Transfer to the split chain (5.8.10): a stationary measure of the original chain gives a stationary measure of the split chain, which is a recurrent chain with an atom $\alpha$ for which uniqueness holds (5.5.9). Hence $\mu$ is a multiple of the occupation measure $\mu_A$ of 5.8.9, and the multiple cancels on normalising, for whichever regeneration set was used.`,
      credit: 'Harris, 1956; uniqueness proof via the splitting of Nummelin and Athreya–Ney, 1978',
      verify: true,
      caption: String.raw`Two regeneration sets for the same chain $X'=aX+\xi$: $A_1=[-c_1,c_1]$ and $A_2=[m-c_2,m+c_2]$. Left: the raw excursion occupation measures $\mu_{A_1}$ (blue) and $\mu_{A_2}$ (orange), whose total masses are the mean cycle lengths and so differ. Right: after dividing by total mass both histograms land on the one stationary normal density (green).`,
      deps: ['prob-5.8.9', 'prob-5.8.10', 'prob-5.5.9'],
      tags: ['general state space', 'stationary measures'],
      viz(v) {
        const st = {};
        const aS = v.slider('$a$', 0.3, 0.9, 0.7, { step: 0.05 });
        const c1 = v.slider('$c_1$', 0.5, 2.5, 1, { step: 0.05 });
        const mS = v.slider('$m$', -2, 3, 1.5, { step: 0.25 });
        const c2 = v.slider('$c_2$', 0.5, 2.5, 0.7, { step: 0.05 });
        let seed = 1; v.button('New cycles', () => { seed++; });
        const NB = 50, N = 4000;
        const L = v.stage({ x: [-5, 6], y: [0, 4], height: 320, axes: 'box', gutter: true, xlabel: '$x$', title: String.raw`raw measures $\mu_{A_1},\mu_{A_2}$ (mass per cycle)` });
        const R = v.stage({ x: [-5, 6], y: [0, 0.6], height: 320, axes: 'box', gutter: true, xlabel: '$x$', title: 'normalised' });
        v.render(() => {
          const a = aS.value, w = 11 / NB, s2 = stationaryVar(a);
          const m1 = minor(a, -c1.value, c1.value), m2 = minor(a, mS.value - c2.value, mS.value + c2.value);
          const r1 = cycles(m1, N, v.rng(seed * 5 + 1), NB, -5, 6), r2 = cycles(m2, N, v.rng(seed * 5 + 2), NB, -5, 6);
          const d1 = dens(r1.counts, r1.N, w), d2 = dens(r2.counts, r2.N, w);
          const mx = Math.max(...d1, ...d2) * 1.1;
          L.setView([-5, 6], [0, mx]);
          bars(L, d1, -5, w, { fill: 'accent', fillAlpha: 0.3, color: 'accent' }); bars(L, d2, -5, w, { fill: 'orange', fillAlpha: 0.3, color: 'orange' });
          const n1 = d1.reduce((s, x) => s + x * w, 0), n2 = d2.reduce((s, x) => s + x * w, 0);
          bars(R, d1.map((x) => x / n1), -5, w, { fill: 'accent', fillAlpha: 0.25, color: 'accent' }); bars(R, d2.map((x) => x / n2), -5, w, { fill: 'orange', fillAlpha: 0.25, color: 'orange' });
          R.fn((x) => phi(x / Math.sqrt(s2)) / Math.sqrt(s2), { color: 'green', width: 2.6 });
          st.out = { n1, n2, e1: m1.eps, e2: m2.eps };
        });
        v.legend([['accent', '$A_1$'], ['orange', '$A_2$'], ['green', 'exact stationary density']]);
        v.readout(() => { const o = st.out || {}; return `$\\varepsilon_1=${fx(o.e1 || 0, 3)}$, $\\varepsilon_2=${fx(o.e2 || 0, 3)}$. Total masses $E\\,T_1\\approx${fx(o.n1 || 0, 2)}$ and $E\\,T_2\\approx${fx(o.n2 || 0, 2)}$: the measures differ by a constant factor (ratio ${fx((o.n1 || 0) / (o.n2 || 1), 3)}); normalised, they agree.`; });
      },
    },
    {
      num: '5.8.12',
      kind: 'Theorem',
      name: 'Convergence theorem for Harris chains',
      statement: String.raw`Let $X_n$ be a recurrent Harris chain with a stationary probability measure $\pi$ that is aperiodic (in the sense that the split chain's atom $\alpha$ has $\gcd\{n:\bar p^n(\alpha,\alpha)>0\}=1$). Then for every initial state $x$ ,
$$\|p^n(x,\cdot)-\pi\|_{TV}\to0 .$$`,
      idea: String.raw`Pass to the split chain, which has the atom $\alpha$ and the stationary law $\bar\pi$ (5.8.10, 5.8.11), and apply the coupling convergence theorem 5.6.6 there; expectations transfer back to the original chain by 5.8.6. Recurrence (5.8.8) supplies the needed returns to $\alpha$.`,
      credit: 'coupling idea of Doeblin; Harris chains: Harris, 1956; splitting: Nummelin and Athreya–Ney, 1978',
      verify: true,
      caption: String.raw`The chain $X_{n+1}=aX_n+\xi$ started at $x_0$ far from the centre. Left: a histogram of $X_n$ over 4000 simulated chains at the chosen $n$, the exact law $N(a^nx_0,(1-a^{2n})/(1-a^2))$ (blue) and the stationary law $N(0,1/(1-a^2))$ (green). Right: the exact total variation distance against $n$ on a log scale — geometric decay for $|a|<1$; set $a=1$ and nothing converges.`,
      deps: ['prob-5.8.8', 'prob-5.8.6', 'prob-5.8.11', 'prob-5.6.6'],
      tags: ['general state space', 'convergence'],
      viz(v) {
        const aS = v.slider('$a$', 0.3, 0.95, 0.8, { step: 0.05 });
        const x0 = v.slider('start $x_0$', -20, 20, 12, { step: 1 });
        const nS = v.slider('$n$', 0, 40, 5, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const H = v.stage({ x: [-8, 20], y: [0, 0.6], height: 330, axes: 'box', gutter: true, xlabel: '$x$', title: String.raw`law of $X_n$` });
        const T = v.stage({ x: [0, 40], y: [1e-4, 1.2], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: '$n$', title: 'total variation distance to $\\pi$', weight: 0.9 });
        let key = '', sims = null;
        const getSims = () => {
          const k = aS.value + '|' + x0.value + '|' + seed; if (k === key) return sims; key = k;
          const r = v.rng(seed * 53 + 7), a = aS.value, R = 4000, xs = new Float64Array(R).fill(x0.value); sims = [Array.from(xs)];
          for (let n = 1; n <= 40; n++) { for (let k2 = 0; k2 < R; k2++) xs[k2] = a * xs[k2] + r.normal(); sims.push(Array.from(xs)); }
          return sims;
        };
        const law = (n, a, x) => ({ m: a ** n * x, v: n === 0 ? 1e-12 : (1 - a ** (2 * n)) / (1 - a * a) });
        v.render(() => {
          const a = aS.value, n = nS.value, s2 = stationaryVar(a), L = law(n, a, x0.value), xs = getSims()[n];
          const lo = Math.min(-8, x0.value - 8), hi = Math.max(20, x0.value + 8);
          H.setView([lo, hi], [0, 0.7]);
          H.hist(xs, { bins: 60, range: [lo, hi], density: true, color: 'accent', fillAlpha: 0.25 });
          const sd = Math.sqrt(L.v); if (n > 0) H.fn((x) => phi((x - L.m) / sd) / sd, { color: 'accent', width: 2.2 });
          H.fn((x) => phi(x / Math.sqrt(s2)) / Math.sqrt(s2), { color: 'green', width: 2.6 });
          const pts = []; for (let k = 0; k <= 40; k++) { const q = law(k, a, x0.value); pts.push([k, Math.max(1e-4, tvNormal(q.m, q.v, 0, s2))]); }
          T.path(pts, { color: 'green', width: 2.4 }); T.dot(n, pts[n][1], { color: 'gold', r: 5 }); T.vline(n, { color: 'gold', width: 1.2, dash: true });
        });
        v.legend([['accent', 'simulated / exact law of $X_n$'], ['green', 'stationary law']]);
        v.readout(() => { const a = aS.value, n = nS.value, L = law(n, a, x0.value); return `$n=${n}$: $X_n\\sim N(${fx(L.m, 2)},${fx(L.v, 2)})$; stationary variance $${fx(stationaryVar(a), 2)}$; $\\|p^n(x_0,\\cdot)-\\pi\\|_{TV}=${fx(tvNormal(L.m, L.v, 0, stationaryVar(a)), 4)}$.`; });
      },
    },
    {
      num: '5.8.13',
      kind: 'Lemma',
      name: 'Exponential minus independent Y has an exponential tail',
      statement: String.raw`Let $X$ be exponential with rate $\lambda$ and $Y\ge0$ independent of $X$. Then for $t\ge0$
$$P(X-Y>t)=P(X-Y>0)\,e^{-\lambda t},\qquad P(X-Y>0)=E\,e^{-\lambda Y}.$$
That is, conditionally on $X>Y$ the excess $X-Y$ is again exponential with rate $\lambda$.`,
      idea: String.raw`Condition on $Y=y\ge0$ and use the memoryless property of $X$: $P(X>y+t)=e^{-\lambda y}e^{-\lambda t}$. Integrating over the law of $Y$ gives $P(X-Y>t)=E e^{-\lambda Y}\,e^{-\lambda t}$. If $Y$ may be negative the identity fails for small $t$, because $P(X>y+t)=1$ when $y+t<0$.`,
      see: ['stoch-11.12'],
      verify: true,
      scope: String.raw`The syllabus entry has no hypothesis on $Y$; the statement here requires $Y\ge0$ (or at least that the identity is only asserted for $t$ beyond the smallest negative value of $Y$) — please compare with the source before relying on the general version.`,
      tags: ['queues', 'distributions'],
      caption: String.raw`$X\sim\mathrm{Exp}(\lambda)$ and an independent $Y$ chosen from the menu. The accent curve is the empirical conditional tail $P(X-Y>t\mid X-Y>0)$ from 40000 samples on a log scale; the green line is $e^{-\lambda t}$. For $Y\ge0$ they coincide; the last menu entry lets $Y$ be negative (uniform on $[-1,2]$) and the curve bends for $t<1$.`,
      deps: ['prob-2.1.12'],
      viz(v) {
        const st = {};
        const yS = v.select('law of $Y$', [{ value: 'c', label: '$Y=0.7$' }, { value: 'u', label: '$U(0,3)$' }, { value: 'b', label: '$\\{0,2\\}$' }, { value: 'neg', label: '$U(-1,2)$ (can be $<0$)' }], 'u');
        const lS = v.slider('rate $\\lambda$', 0.3, 2, 1, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const S = v.stage({ x: [0, 6], y: [1e-3, 1.2], ylog: true, height: 340, axes: 'box', gutter: true, xlabel: '$t$', title: String.raw`$P(X-Y>t\mid X-Y>0)$` });
        v.render(() => {
          const lam = lS.value, r = v.rng(seed * 59 + 4), N = 40000, ds = [];
          for (let k = 0; k < N; k++) { const x = -Math.log(1 - r()) / lam; let y; switch (yS.value) { case 'c': y = 0.7; break; case 'u': y = 3 * r(); break; case 'b': y = r() < 0.5 ? 0 : 2; break; default: y = -1 + 3 * r(); } if (x - y > 0) ds.push(x - y); }
          ds.sort((a, b) => a - b); const M = ds.length, pts = [];
          for (let i = 0; i <= 120; i++) { const t = (6 * i) / 120; let lo = 0, hi = M; while (lo < hi) { const mid = (lo + hi) >> 1; if (ds[mid] <= t) lo = mid + 1; else hi = mid; } const s = (M - lo) / M; pts.push([t, Math.max(1e-3, s)]); }
          S.path(pts, { color: 'accent', width: 2.6 });
          S.fn((t) => Math.exp(-lam * t), { color: 'green', width: 2.2, dash: [8, 5] });
          st.out = { p: M / N, N };
        });
        v.legend([['accent', 'empirical tail'], ['green', '$e^{-\\lambda t}$', { dash: true }]]);
        v.readout(() => { const lam = lS.value, p = (st.out || {}).p || 0; const ex = { c: Math.exp(-lam * 0.7), u: (1 - Math.exp(-3 * lam)) / (3 * lam), b: 0.5 * (1 + Math.exp(-2 * lam)), neg: null }[yS.value]; return `Empirical $P(X-Y>0)=${fx(p, 4)}$; ${ex === null ? 'for $Y$ taking negative values the formula $Ee^{-\\lambda Y}$ no longer applies and the tail is not a pure exponential.' : `$Ee^{-\\lambda Y}=${fx(ex, 4)}$.`}`; });
      },
    },
  ],
};
