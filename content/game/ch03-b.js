import blottoItem from './blotto-item.js';
import blackwellItem from './blackwell-item.js';
// Game Theory & Social Choice — Chapter 3 (part b): learning the value, Blotto, approachability, von Neumann's 1928 paper
import {
  C1, C2, nm, idx, TRI, triPt, triBary, triClamp, drawTriangle,
  solveZS, zsPure, guarantee, ceiling, ZS, copyM, matWindow, matCell, drawMat,
} from './ch03.shared.js';
import { FICTITIOUS_GAMES, fictitiousPlay, fictitiousBounds, lpGameCertificate } from './minimax-audit.js';
import { ENVELOPE_GAMES, validEnvelopeMatrix, twoByTwoEnvelopes } from './minimax-envelope-audit.js';

const clamp = (t, a, b) => Math.min(b, Math.max(a, t));
const tx = (a) => String(Math.round(a * 1000) / 1000).replace('-', '\\!-');
const argmax = (a) => a.reduce((b, t, i) => (t > a[b] + 1e-12 ? i : b), 0);
const argmin = (a) => a.reduce((b, t, i) => (t < a[b] - 1e-12 ? i : b), 0);
const BIAS = [[0, -2, 3], [2, 0, -1], [-3, 1, 0]];

/** Hedge (multiplicative weights) for the row player on gains G in [0,1]; the column player is an adversary, random, or Hedge too. */
function hedge(G, T, eta, mode, rng) {
  const m = G.length, n = G[0].length;
  const soft = (c) => { const mx = Math.max(...c), e = c.map((q) => Math.exp(eta * (q - mx))), s = e.reduce((a, b) => a + b, 0); return e.map((q) => q / s); };
  const W = new Array(m).fill(0), Vc = new Array(n).fill(0), rs = new Array(m).fill(0), cs = new Array(n).fill(0);
  const cx = new Array(m).fill(0), cy = new Array(n).fill(0);
  let alg = 0;
  const reg = [], gap = [], xs = [], xbar = [], ybar = [];
  for (let t = 1; t <= T; t++) {
    const x = soft(W);
    const xG = idx(n).map((j) => x.reduce((s, xi, i) => s + xi * G[i][j], 0));
    let y;
    if (mode === 'adv') { y = new Array(n).fill(0); y[argmin(xG)] = 1; } else if (mode === 'rand') { y = new Array(n).fill(0); y[rng.int(0, n - 1)] = 1; } else y = soft(Vc);
    const g = idx(m).map((i) => G[i].reduce((s, a, j) => s + a * y[j], 0));
    alg += x.reduce((s, xi, i) => s + xi * g[i], 0);
    for (let i = 0; i < m; i++) { W[i] += g[i]; rs[i] += g[i]; cx[i] += x[i]; }
    for (let j = 0; j < n; j++) { Vc[j] += 1 - xG[j]; cs[j] += xG[j]; cy[j] += y[j]; }
    reg.push(Math.max(...W) - alg);
    gap.push(Math.max(...rs) / t - Math.min(...cs) / t);
    xs.push(x); xbar.push(cx.map((q) => q / t)); ybar.push(cy.map((q) => q / t));
  }
  return { reg, gap, xs, xbar, ybar };
}



export default {
  collection: 'game',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Algorithm',
      name: 'Fictitious play in zero-sum games (Robinson)',
      credit: 'Julia Robinson, 1951 (procedure proposed by G. W. Brown)',
      statement: String.raw`Let $A$ be a finite real $m\times n$ zero-sum payoff matrix, with the row player maximizing and the column player minimizing. Start cumulative action counts at $r_0=0$, $c_0=0$. In **simultaneous fictitious play**, round $t\ge1$ chooses
$$\begin{aligned}i_t&\in\arg\max_i(Ac_{t-1})_i,\\j_t&\in\arg\min_j(r_{t-1}^{\mathsf T}A)_j,\\r_t&=r_{t-1}+e_{i_t},\\c_t&=c_{t-1}+e_{j_t}.\end{aligned}$$
Zero initial scores make the first choices arbitrary; no frequency at time zero is needed. Robinson also treats the **alternating** rule: choose the same $i_t$ first, update $r_t$, then choose $j_t\in\arg\min_j(r_t^{\mathsf T}A)_j$. Either rule allows any choice among tied best replies. Put $\bar x_t=r_t/t$, $\bar y_t=c_t/t$, $g(x)=\min_j(x^{\mathsf T}A)_j$, and $h(y)=\max_i(Ay)_i$. **Robinson's theorem (1951)** says, for either timing,
$$h(\bar y_t)-g(\bar x_t)\;\longrightarrow\;0\quad(t\to\infty),$$
so $g(\bar x_t)\le v\le h(\bar y_t)$ converge to the minimax value $v$ (game-3.3). Every limit point of the empirical pair is optimal; equivalently, its distance to the product of optimal-strategy sets tends to zero. This does not assert convergence to one particular optimal pair, convergence of the actions, monotonicity of either bound, or a convergence rate.`,
      idea: String.raw`Write $U(t)=r_t^{\mathsf T}A$ and $V(t)=Ac_t$. Robinson calls a row or column eligible on an interval if it is a best reply at some time in that interval. Her Lemmas 2–3 bound the spreads of the cumulative scores, and then their cross-gap, on intervals where every action is eligible. Lemma 4 handles the remaining intervals by induction on the total number of actions: an action that is never eligible is never selected and can be deleted, reducing to a smaller game. Partitioning a long run into such blocks gives $\max V(t)-\min U(t)=o(t)$; the same argument covers both update timings. Minimax brackets $v$ between $\min U(t)/t$ and $\max V(t)/t$, so their difference tending to zero forces both limits to $v$. Finally, compactness of the simplices and continuity of $g,h$ imply that every empirical limit pair is optimal. This is an outline of Robinson's block-induction proof, not a claim that either plotted bound improves every round.

The final empirical-limit step uses pma 3.6 on the compact product of the two probability simplices. Any convergent empirical subsequence has a feasible limit; continuity of the finite minimum/maximum payoff envelopes and the already proved vanishing gap make that limit optimal. If the empirical distance to the closed optimal-strategy product did not tend to zero, a subsequence staying a fixed positive distance away would have a convergent subsubsequence, contradicting that conclusion. Compactness upgrades optimality of limit points to distance convergence, not convergence to a uniquely selected pair or a rate for Robinson's block argument.`,
      caption: String.raw`Choose simultaneous updates (both see $t-1$ rounds) or alternating updates (the column also sees the newly chosen row). Ties use the first action index in this illustration. Gold paths retain every empirical point through round $t$; green rings mark one computed optimal pair, possibly among many. The blue lower security bound and orange upper bound can rise or fall locally. Faint curves retain the complete 4000-round record, bright curves its selected prefix, and the green dashed line is the computed value. The log time axis includes both endpoints with marker margins; its payoff range includes every excursion in the full record.`,
      deps: ['game-3.3', 'pma-3.6'],
      refs: ['Robinson (1951), pp. 296–301, Definition 1 and Lemmas 1–4'],
      tags: ['learning', 'fictitious play', 'zero-sum'],
      links: { source: 'https://ranger.uta.edu/~weems/NOTES6319/PAPERSONE/robinson.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Fictitious_play' },
      see: ['game-3.4', 'game-3.7'],
      verify: false,
      viz(v) {
        const games = FICTITIOUS_GAMES;
        let run = null, key = '';
        const TM = 4000;
        const SX = v.stage({ x: [-0.12, 1.12], y: [-0.2, 1.02], equal: true, axes: false, height: 320, weight: 0.9, title: 'row frequencies x̄ₜ' });
        const SY = v.stage({ x: [-0.12, 1.12], y: [-0.2, 1.02], equal: true, axes: false, height: 320, weight: 0.9, title: 'column frequencies ȳₜ' });
        const SL = v.stage({ x: [.65, TM * 1.55], y: [-2, 2], xlog: true, axes: 'box', gutter: true, height: 320, weight: 1.2, xlabel: 'round t', ylabel: 'bounds on the value', title: 'lower guarantee, upper ceiling' });
        const game = v.select('game', Object.keys(games).map((k) => ({ value: k, label: games[k].label })), 'rps');
        const mode = v.select('update timing', [{ value: 'simultaneous', label: 'simultaneous' }, { value: 'alternating', label: 'alternating' }], 'simultaneous');
        const T = v.slider('rounds $t$', 1, TM, 60, { int: true, log: true });
        v.render(() => {
          const A = games[game.value].A, k = `${game.value}:${mode.value}`;
          if (key !== k) { const sol = solveZS(A); run = { ...fictitiousPlay(A, TM, mode.value), sol, certificate: lpGameCertificate(A, sol) }; key = k; }
          const t = Math.round(T.value), { X, Y, lo, hi, sol } = run;
          drawTriangle(SX, v, { labels: ['row 1', 'row 2', 'row 3'], labelColor: 'blue' }); drawTriangle(SY, v, { labels: ['col 1', 'col 2', 'col 3'], labelColor: 'orange' });
          const pxs = idx(t);
          SX.path(pxs.map((s) => triPt(X[s])), { color: 'gold', width: 1.6 }); SY.path(pxs.map((s) => triPt(Y[s])), { color: 'gold', width: 1.6 });
          if (run.certificate.ok) { SX.dot(...triPt(sol.x), { r: 11, hollow: true, color: 'green', width: 2.5 }); SY.dot(...triPt(sol.y), { r: 11, hollow: true, color: 'green', width: 2.5 }); }
          SX.dot(...triPt(X[t - 1]), { r: 6, color: 'blue' }); SY.dot(...triPt(Y[t - 1]), { r: 6, color: 'orange' });
          const bounds = fictitiousBounds(run, sol.v);
          SL.setView(bounds.x, bounds.y);
          const pts = a => a.map((q, s) => [s + 1, q]);
          SL.hline(sol.v, { color: 'green', width: 2, dash: true });
          SL.path(pts(hi), { color: 'orange', width: 1.6, alpha: 0.4 }); SL.path(pts(lo), { color: 'blue', width: 1.6, alpha: 0.4 });
          SL.path(pts(hi.slice(0, t)), { color: 'orange', width: 2.4 }); SL.path(pts(lo.slice(0, t)), { color: 'blue', width: 2.4 });
          SL.vline(t, { color: 'gold', dash: true, width: 1.5 });
          SL.dot(t, hi[t - 1], { r: 5, color: 'orange' }); SL.dot(t, lo[t - 1], { r: 5, color: 'blue' });
        });
        v.readout(() => {
          if (!run) return '';
          const t = Math.round(T.value), gp = run.hi[t - 1] - run.lo[t - 1], [i, j] = run.actions[t - 1];
          return `$t=${t}$: lower $g=${tx(run.lo[t - 1])}$, computed value $v=${tx(run.sol.v)}$, upper $h=${tx(run.hi[t - 1])}$; gap $=${tx(gp)}$.\nRound ${t}: row ${i + 1}, column ${j + 1}. Row sees columns 1–${t - 1}; column sees rows 1–${mode.value === 'alternating' ? t : t - 1} (an empty prefix at zero). First-index ties.\nEvery point is retained; neither bound is required to move monotonically. Rings show one ${run.certificate.ok ? 'numerically certified' : 'uncertified'} optimal pair; convergence is to the optimal sets.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Algorithm',
      name: 'Multiplicative weights and no-regret learning',
      credit: 'Littlestone & Warmuth, 1994; Freund & Schapire, 1999',
      statement: String.raw`A learner repeatedly chooses a mixed strategy $x_t$ over $m$ actions; then an arbitrary gain vector $g_t\in[0,1]^m$ is revealed. The **multiplicative weights (Hedge)** rule plays $x_t(i)\propto\exp\bigl(\eta\sum_{s<t}g_s(i)\bigr)$. Its **regret** against the best fixed action,
$$R_T=\max_i\sum_{t\le T}g_t(i)-\sum_{t\le T}x_t\cdot g_t,$$
satisfies $R_T\le\dfrac{\ln m}{\eta}+\dfrac{\eta T}{8}$ for every sequence $g_1,\dots,g_T$ (adaptive or not), hence $R_T\le\sqrt{T\ln m/2}$ for $\eta=\sqrt{8\ln m/T}$: the average regret vanishes like $T^{-1/2}$. In a zero-sum game with payoffs scaled into $[0,1]$, if both players run Hedge, the time-averaged strategies $\bar x_T,\bar y_T$ form an $\varepsilon$-approximate minimax pair with
$$\varepsilon=\max_i(A\bar y_T)_i-\min_j(\bar x_T^{\mathsf T}A)_j\le\frac{R_T^{\rm row}+R_T^{\rm col}}{T}=O\!\bigl(\sqrt{\ln(mn)/T}\bigr),$$
which gives a constructive proof of the minimax theorem (game-3.3).`,
      idea: String.raw`Track the potential $\Phi_t=\ln\sum_i e^{\eta G_t(i)}$ with $G_t(i)$ the cumulative gain. Each round raises it by at most $\eta\,x_t\!\cdot g_t+\eta^2/8$ (Hoeffding's lemma), while at the end $\Phi_T\ge\eta\max_iG_T(i)$ and at the start $\Phi_0=\ln m$; rearranging yields the regret bound. For the game, regret against the best fixed row says: the row player did as well as the best row against the *actual* column play, which is the time average $\bar y_T$, so $\max_i(A\bar y_T)_i\le\frac1T\sum_t x_t^{\mathsf T}Ay_t+R^{\rm row}_T/T$; the symmetric bound for the column player and $\sum_tx_t^{\mathsf T}Ay_t$ cancelling gives the displayed $\varepsilon$. The averages converge; the individual iterates $x_t$ generally keep orbiting the optimum, as in game-3.6.

Use the bounded-variable exponential lemma in the proof of stat 1.16, rather than its independent-sample tail conclusion. At a single round introduce an auxiliary action index I with distribution $x_t$, so $g_t(I)\in[0,1]$. That lemma bounds its logarithmic moment generating function by $\eta x_t\cdot g_t+\eta^2/8$, exactly the potential increment used here. It is a one-round inequality for the realized gain vector; temporal independence of gains is unnecessary, even for adaptive full-information play. Summing these increments gives the stated finite-horizon bound, and the choice of eta depending on T makes the averaged minimax gap vanish rather than identifying a unique limiting strategy vector.`,
      caption: String.raw`A $3\times3$ game rescaled into $[0,1]$. Left: the learner's regret $R_t$ (gold) against Hedge's guarantee $\ln m/\eta+\eta t/8$ (dashed) and the $\sqrt{t\ln m/2}$ curve. Choose the opponent: one who answers each mixture with the worst column for you (an adaptive adversary), random columns, or another Hedge learner. Middle: the gap $\max_i(A\bar y_t)_i-\min_j(\bar x_t^{\mathsf T}A)_j$ of the *averaged* strategies on log axes; in self-play it follows the $t^{-1/2}$ bound. Right: the orbit of the learner's own mixture (gold) circling the optimum while the average (blue dot) settles on it. Change $\eta$: too small adapts slowly, too large chases noise. (In Rock–Paper–Scissors two Hedge learners start at the equilibrium and never leave it: use the skew game or an adversary.)`,
      deps: ['game-3.3', 'game-3.6', 'stat-1.16'],
      refs: ['MSZ §14.8'],
      tags: ['learning', 'no-regret', 'multiplicative weights'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Multiplicative_weight_update_method' },
      viz(v) {
        const games = { rps: { label: 'Rock–Paper–Scissors', A: ZS.rps.A }, skew: { label: 'skew-symmetric', A: BIAS }, rand: { label: 'random 3 × 3', A: [[3, -2, 1], [-1, 4, -3], [-4, 0, 2]] } };
        const T = 2000, m = 3;
        let g = games.skew, seed = 1;
        const SR = v.stage({ x: [1, T], y: [0, 40], axes: 'box', gutter: true, height: 320, weight: 1.05, xlabel: 'round t', ylabel: 'regret', title: 'regret of the learner' });
        const SG = v.stage({ x: [1, T], y: [1e-3, 1.5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, weight: 1.05, xlabel: 'round t', ylabel: 'gap of the averages', title: 'exploitability of x̄ₜ, ȳₜ' });
        const ST = v.stage({ x: [-0.12, 1.12], y: [-0.2, 1.02], equal: true, axes: false, height: 320, weight: 0.85, title: 'the learner’s mixture xₜ' });
        v.select('game', Object.keys(games).map((k) => ({ value: k, label: games[k].label })), 'skew', { onChange: (k) => { g = games[k]; } });
        const mode = v.select('opponent', [{ value: 'adv', label: 'adaptive adversary' }, { value: 'rand', label: 'random columns' }, { value: 'self', label: 'another Hedge learner' }], 'self');
        const E = v.slider('learning rate $\\eta$', 0.005, 2, Math.sqrt(8 * Math.log(m) / T), { log: true, sig: 2 });
        v.button('$\\eta$ tuned for $T=2000$', () => { E.set(Math.sqrt(8 * Math.log(m) / T)); });
        v.button('Resample', () => { seed += 1; });
        let run = null, info = null;
        v.render(() => {
          const A = g.A, lo = Math.min(...A.flat()), hi = Math.max(...A.flat()), G = A.map((r) => r.map((a) => (a - lo) / (hi - lo)));
          const eta = E.value, md = mode.value, sol = solveZS(G);
          run = hedge(G, T, eta, md, v.rng(seed * 17 + 1));
          const bound = (t) => Math.log(m) / eta + (eta * t) / 8, env = (t) => Math.sqrt((t * Math.log(m)) / 2);
          const peak = Math.max(...run.reg, bound(T)) * 1.05;
          SR.setView([1, T], [0, Math.max(5, peak)]);
          const sub = (a) => a.map((q, s) => [s + 1, q]).filter((_, s) => s < 200 || s % 10 === 0);
          SR.fn(bound, { domain: [1, T], color: 'muted', width: 2, dash: true }); SR.fn(env, { domain: [1, T], color: 'faint', width: 1.5, dash: true });
          SR.path(sub(run.reg.map((q) => Math.max(q, 0))), { color: 'gold', width: 2.4 });
          // gap panel
          SG.path(sub(run.gap.map((q) => Math.max(q, 1e-4))), { color: 'accent', width: 2.2 });
          if (md === 'self') SG.fn((t) => (2 * (Math.log(m) / eta + (eta * t) / 8)) / t, { domain: [1, T], color: 'muted', dash: true, width: 2 });
          SG.fn((t) => 1 / Math.sqrt(t), { domain: [1, T], color: 'faint', dash: true, width: 1 });
          SG.text('1/√t', 4, 0.5, { size: 11.5, color: 'faint' });
          // triangle
          drawTriangle(ST, v, { labels: ['row 1', 'row 2', 'row 3'], labelColor: 'blue' });
          ST.path(run.xs.filter((_, s) => s % 4 === 0).map((q) => triPt(q)), { color: 'gold', width: 1.4, alpha: 0.7 });
          ST.dot(...triPt(sol.x), { r: 11, hollow: true, color: 'green', width: 2.5 });
          ST.dot(...triPt(run.xbar[T - 1]), { r: 6, color: 'blue' }); ST.dot(...triPt(run.xs[T - 1]), { r: 5, color: 'gold' });
          info = { reg: run.reg[T - 1], bound: bound(T), gap: run.gap[T - 1], v: sol.v, eta, md, env: env(T) };
        });
        v.readout(() => {
          if (!info) return '';
          const { reg, bound, gap, md, env } = info;
          return `after $T=${T}$ rounds: regret $R_T=${v.fix(reg, 2)}$   guarantee $\\ln m/\\eta+\\eta T/8=${v.fix(bound, 2)}$ ${reg <= bound + 1e-9 ? '✓' : '✗'}   tuned $\\sqrt{T\\ln m/2}=${v.fix(env, 2)}$\ngap of the averaged strategies $=${v.fix(gap, 4)}$ ${md === 'self' ? '(both players Hedge: bounded by $2R_T/T$)' : '(the opponent is not learning, so the averages need not be optimal)'}`;
        });
      },
    },
    blottoItem,
    blackwellItem,
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Paper',
      name: 'Zur Theorie der Gesellschaftsspiele',
      paper: { authors: 'J. v. Neumann', year: 1928, title: 'Zur Theorie der Gesellschaftsspiele', venue: 'Mathematische Annalen 100: 295–320', doi: '10.1007/BF01448847' },
      introduces: ['game-3.3'],
      credit: 'John von Neumann, 1928',
      statement: String.raw`For a finite two-person zero-sum game with nonempty action sets and real payoff matrix $A$, von Neumann proves equality of the two mixed security levels:
$$\begin{aligned}\max_{x\in\Delta_m}\min_{y\in\Delta_n}x^{\mathsf T}Ay&=v,\\\min_{y\in\Delta_n}\max_{x\in\Delta_m}x^{\mathsf T}Ay&=v.\end{aligned}$$
Here $x,y$ are independent probability vectors (game-2.1), the row player maximizes and the column player minimizes expected payoff. Both optimal mixtures exist. A player using an optimal mixture secures the value even when the opponent knows its probabilities; the sampled action is not revealed before the opponent chooses. Pure security levels can differ (game-3.2), but can also coincide at a pure saddle.

The paper's two-player minimax theorem is in §§II–III. §I gives a finite contingent-plan reduction to normal form, including chance through expected payoffs. §§IV–V separately discuss three-player coalitions and higher player counts; these are not the displayed two-player theorem.`,
      idea: String.raw`In §III, von Neumann extends the bilinear payoff to continuous functions with convex upper level sets in the maximizing variables and convex lower level sets in the minimizing variables, his condition (K). Partial optimization preserves these properties. He then interchanges one maximum and one minimum using interval best-reply sets, semicontinuity and an interval fixed-point argument, and reorders the full sequence of optimization operators.

The modern $2\times2$ illustration has a shorter calculation: $g$ is the lower envelope of two affine lines and $h$ the upper envelope of two affine lines. Between a line intersection and the domain endpoints, each envelope is affine. Its extremum therefore occurs at an endpoint or intersection, with a whole interval of optima possible when a segment is flat. Evaluating these candidates handles pure saddles and ties as well as interior mixtures. The numerical difference shown measures floating-point agreement of these calculations; the general equality is the theorem.`,
      caption: String.raw`Choose a starting game, click any matrix cell and edit its integer payoff from $-9$ to $9$. Blue is $g(p)=\min_j[p\,a_{1j}+(1-p)\,a_{2j}]$, the row player's guarantee; orange is $h(q)=\max_i[a_{i1}q+a_{i2}(1-q)]$, the column player's ceiling. The common horizontal axis represents $p$ for blue and $q$ for orange. Drag either point or use its probability slider, including when points coincide. The modern calculation evaluates endpoints and line intersections, and reports the complete optimal probability intervals. The constant-game preset shows that neither optimal mixtures nor the location of an extremum need be unique.`,
      deps: ['game-3.2', 'game-2.1'],
      refs: ['von Neumann (1928), §§I–III, especially pp. 305–311; §§IV–V for coalition discussion'],
      tags: ['minimax', 'history', 'mixed strategy'],
      links: { source: 'https://home.uni-leipzig.de/socialcooperationresearch/wp-content/uploads/2020/05/Neumann_Zur_Theorie_der_Gesellschaftsspiele_Mathematische_Annalen_1928_Vol_100__1_295-320.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Minimax_theorem' },
      verify: false,
      viz(v) {
        let key = 'pennies', A = copyM(ENVELOPE_GAMES.pennies.A), sel = [0, 0], hp, hq;
        const M = v.stage({ x: [-1.5, 3.9], y: [-1.7, 2.7], equal: true, axes: false, height: 340, weight: 0.9, title: 'a zero-sum game (payoffs to the row player)' });
        const S = v.stage({ x: [-.1, 1.1], y: [-4, 4], axes: 'box', gutter: true, height: 340, weight: 1.2, xlabel: 'p (blue) or q (orange)', ylabel: 'row payoff', xticks: [[0, '0'], [.25, '¼'], [.5, '½'], [.75, '¾'], [1, '1']], title: 'security levels of the two mixtures' });
        const ed = v.slider('gold entry', -9, 9, 1, { int: true, onChange: (x) => { A[sel[0]][sel[1]] = x; } });
        const game = v.select('game', Object.entries(ENVELOPE_GAMES).map(([value, g]) => ({ value, label: g.label })), key, { onChange: (k) => { key = k; A = copyM(ENVELOPE_GAMES[k].A); sel = [0, 0]; ed.set(A[0][0]); } });
        M.onClick((x, y) => { const c = matCell(x, y, 2, 2); if (c) { sel = c; ed.set(A[c[0]][c[1]]); v.invalidate(); } });
        const pc = v.slider('row probability $p$', 0, 1, .3, { step: .01, onChange: x => hp?.set(x, 0) });
        const qc = v.slider('column probability $q$', 0, 1, .7, { step: .01, onChange: x => hq?.set(x, 0) });
        hp = S.handle(.3, 0, { color: 'blue', r: 9, constrain: (x) => [clamp(x, 0, 1), 0], onDrag: h => pc.set(h.x) });
        hq = S.handle(.7, 0, { color: 'orange', r: 9, constrain: (x) => [clamp(x, 0, 1), 0], onDrag: h => qc.set(h.x) });
        v.shareState('edited 1928 illustration', {
          get: () => ({ base: key, A: copyM(A), cell: sel.slice() }),
          validate: d => !!d && typeof d.base === 'string' && Object.hasOwn(ENVELOPE_GAMES, d.base) && validEnvelopeMatrix(d.A) && Array.isArray(d.cell) && d.cell.length === 2 && [0, 1].every(i => d.cell[i] === 0 || d.cell[i] === 1),
          set: d => { key = d.base; game.set(key); A = copyM(d.A); sel = d.cell.slice(); ed.set(A[sel[0]][sel[1]]); },
        });
        v.legend([{ color: 'blue', label: 'row guarantee $g(p)$' }, { color: 'orange', label: 'column ceiling $h(q)$' }, { color: 'green', label: 'mixed value' }]);
        let info = null;
        v.render(() => {
          const P = zsPure(A), sol = twoByTwoEnvelopes(A);
          const w = matWindow(2, 2); M.setView(w.x, w.y);
          drawMat(M, A, { rowMin: P.rowMin, colMax: P.colMax, sel, rowMinHi: (i) => P.rowMin[i] === P.maxmin, colMaxHi: (j) => P.colMax[j] === P.minmax, mark: (i, j) => (P.saddles.some(([a, b]) => a === i && b === j) ? 'green' : null) });
          const R = Math.max(2, Math.ceil(Math.max(...A.flat().map(Math.abs))) + 2);
          S.setView([-.1, 1.1], [-R, R]);
          const g = sol.guarantee, h = sol.ceiling;
          S.path(sol.rowCurve, { color: 'blue', width: 3.5 }); S.path(sol.columnCurve, { color: 'orange', width: 3.5 });
          S.hline(sol.value, { color: 'green', dash: true, width: 2 });
          for (const [range, y, color] of [[sol.pOptimal, sol.lower, 'blue'], [sol.qOptimal, sol.upper, 'orange']]) if (range[0] < range[1]) S.line(range[0], y, range[1], y, { color, width: 7, alpha: .4 });
          S.dot(sol.p, g(sol.p), { r: 7, color: 'blue', hollow: true }); S.dot(sol.q, h(sol.q), { r: 7, color: 'orange', hollow: true });
          const p = hp.x, q = hq.x; hp.set(p, g(p)); hq.set(q, h(q));
          // pure end points
          S.dot(0, g(0), { r: 4, color: 'blue' }); S.dot(1, g(1), { r: 4, color: 'blue' }); S.dot(0, h(0), { r: 4, color: 'orange' }); S.dot(1, h(1), { r: 4, color: 'orange' });
          info = { A: copyM(A), sel: sel.slice(), p, q, gp: g(p), hq: h(q), sol, P };
        });
        v.readout(() => {
          if (!info) return '';
          const { p, q, gp, hq: hh, sol, P } = info, interval = r => r[0] === r[1] ? `\\{${v.fix(r[0], 6)}\\}` : `[${v.fix(r[0], 6)}, ${v.fix(r[1], 6)}]`, diff = sol.difference === 0 ? '0' : v.sci(sol.difference, 2);
          return `Pure security levels: $\\underline v=${tx(P.maxmin)}$, $\\overline v=${tx(P.minmax)}$${P.maxmin < P.minmax ? ' — a positive pure gap' : ' — a pure saddle exists'}.\nAnalytic candidates: $\\max g\\approx${v.fix(sol.lower, 6)}$, $\\min h\\approx${v.fix(sol.upper, 6)}$. Floating-point difference $${diff}$ (${sol.difference <= sol.tolerance ? 'within' : 'outside'} tolerance $${v.sci(sol.tolerance, 1)}$).\nOptimal probability sets (decimal approximations): $p\\in${interval(sol.pOptimal)}$, $q\\in${interval(sol.qOptimal)}$. Your points: $g(${v.fix(p, 3)})=${v.fix(gp, 6)}$, $h(${v.fix(q, 3)})=${v.fix(hh, 6)}$.`;
        });
      },
    },
  ],
};
