// Game Theory & Social Choice — Chapter 3 (part b): learning the value, Blotto, approachability, von Neumann's 1928 paper
import {
  C1, C2, nm, idx, TRI, triPt, triBary, triClamp, drawTriangle,
  solveZS, zsPure, guarantee, ceiling, ZS, copyM, matWindow, matCell, drawMat,
} from './ch03.shared.js';

const clamp = (t, a, b) => Math.min(b, Math.max(a, t));
const tx = (a) => String(Math.round(a * 1000) / 1000).replace('-', '\\!-');
const argmax = (a) => a.reduce((b, t, i) => (t > a[b] + 1e-12 ? i : b), 0);
const argmin = (a) => a.reduce((b, t, i) => (t < a[b] - 1e-12 ? i : b), 0);
const BIAS = [[0, -2, 3], [2, 0, -1], [-3, 1, 0]];

/** Robinson's fictitious play: both players best-respond (first index on ties) to the other's empirical counts. */
function fictitious(A, T) {
  const m = A.length, n = A[0].length;
  const cx = new Array(m).fill(0), cy = new Array(n).fill(0), rs = new Array(m).fill(0), cs = new Array(n).fill(0);
  let i = 0, j = 0;
  const X = [], Y = [], lo = [], hi = [];
  for (let t = 1; t <= T; t++) {
    cx[i]++; cy[j]++;
    for (let r = 0; r < m; r++) rs[r] += A[r][j];
    for (let c = 0; c < n; c++) cs[c] += A[i][c];
    X.push(cx.map((q) => q / t)); Y.push(cy.map((q) => q / t));
    lo.push(Math.min(...cs) / t); hi.push(Math.max(...rs) / t);
    i = argmax(rs); j = argmin(cs);
  }
  return { X, Y, lo, hi };
}

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

// ---------- Colonel Blotto: three battlefields, N soldiers each; payoff = battlefields won (ties half) - 3/2 ----------
const BL = {};
export function blotto(N) {
  if (BL[N]) return BL[N];
  const al = []; for (let a = 0; a <= N; a++) for (let b = 0; a + b <= N; b++) al.push([a, b, N - a - b]);
  const pay = (x, y) => x.reduce((s, xi, k) => s + (xi > y[k] ? 1 : xi === y[k] ? 0.5 : 0), 0) - 1.5;
  const A = al.map((x) => al.map((y) => pay(x, y)));
  return (BL[N] = { al, A, sol: solveZS(A), pure: zsPure(A) });
}

// ---------- vector payoffs for Blackwell approachability: r[i][j] = payoff vector when row plays i, column j ----------
const RV = [[[2, -1], [-1, 2], [0, 0]], [[-1, 0], [1, 1], [2, -2]], [[0, 2], [-2, 1], [1, -1]]];
const dirVal = (u) => { const S = solveZS(RV.map((r) => r.map((c) => -(u[0] * c[0] + u[1] * c[1])))); return { val: -S.v, x: S.x }; };
const DIRS = idx(180).map((k) => { const th = (2 * Math.PI * k) / 180, u = [Math.cos(th), Math.sin(th)]; return { u, val: dirVal(u).val }; });

export default {
  collection: 'game',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Algorithm',
      name: 'Fictitious play in zero-sum games (Robinson)',
      credit: 'G. W. Brown, 1951; Julia Robinson, 1951',
      statement: String.raw`In **fictitious play** two players repeat a zero-sum matrix game $A$. In round $t$ each player best-responds to the *empirical frequency* of the opponent's past actions (ties broken by a fixed rule): the row player plays $i_t\in\arg\max_i (A\bar y_{t-1})_i$ and the column player $j_t\in\arg\min_j(\bar x_{t-1}^{\mathsf T}A)_j$, where $\bar x_t,\bar y_t$ are the frequencies of past actions. **Robinson's theorem (1951):** for every finite zero-sum game,
$$\max_i(A\bar y_t)_i-\min_j(\bar x_t^{\mathsf T}A)_j\;\longrightarrow\;0\quad(t\to\infty),$$
so every limit point of $(\bar x_t,\bar y_t)$ is a pair of optimal strategies and both bounds $\min_j(\bar x_t^{\mathsf T}A)_j\le v\le\max_i(A\bar y_t)_i$ squeeze the value $v$. The play itself need not converge, only the frequencies; and the convergence can be slow: the classical bound (Robinson; Shapiro, 1958) is of order $t^{-1/(m+n-2)}$ for $m,n\ge2$ in an $m\times n$ game.`,
      idea: String.raw`Robinson's proof uses accumulated payoff vectors and induction on the number of actions. On an interval where every row and column is eligible as a best response, Lemmas 2–3 bound the gap by four times the largest absolute payoff times the interval length. If some action is never eligible, delete it and apply the induction hypothesis; Lemma 4 combines these cases to make the gap sublinear in time. The two bounds are exactly the weak-duality quantities of game-3.4: $g(\bar x_t)\le v\le h(\bar y_t)$, so the shrinking gap proves convergence of both frequencies to the optimal sets of game-3.3. The quoted later quantitative rate remains source-unconfirmed here; the convergence theorem alone does not give a dimension-independent square-root rate. Contrast game-3.7, where a regret bound gives $t^{-1/2}$ for all games.`,
      caption: String.raw`A $3\times3$ game; the two triangles are the simplices of mixed strategies. Gold paths trace the empirical frequencies $\bar x_t$ (left) and $\bar y_t$ (right) of the first $t$ rounds, and the green rings mark the optimal strategies; in Rock–Paper–Scissors the frequencies spiral in to the centre although the actual play cycles forever. Right panel: the upper bound $\max_i(A\bar y_t)_i$ (orange) and the lower bound $\min_j(\bar x_t^{\mathsf T}A)_j$ (blue) converge, generally non-monotonically, to the value (green), on a log time axis. Drag the slider to choose $t$; compare the slow, jagged progress with the smooth Hedge curve in game-3.7.`,
      deps: ['game-3.3'],
      refs: ['MSZ §5.2', 'Robinson (1951), Ann. Math. 54:296–301, Theorem and Lemmas 1–4; https://ranger.uta.edu/~weems/NOTES6319/PAPERSONE/robinson.pdf', 'Shapiro (1958), Comm. Pure Appl. Math. 11:587–593, DOI 10.1002/cpa.3160110408 (full rate proof unverified)'],
      tags: ['learning', 'fictitious play', 'zero-sum'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fictitious_play' },
      see: ['game-3.7'],
      verify: true,
      viz(v) {
        const games = {
          rps: { label: 'Rock–Paper–Scissors', A: ZS.rps.A },
          skew: { label: 'skew-symmetric', A: BIAS },
          saddle: { label: 'saddle point', A: ZS.saddle.A },
          rand: { label: 'random 3 × 3', A: idx(3).map((i) => idx(3).map((j) => [[3, -2, 1], [-1, 4, -3], [-4, 0, 2]][i][j])) },
        };
        let g = games.rps, run = null, key = '';
        const TM = 4000;
        const SX = v.stage({ x: [-0.12, 1.12], y: [-0.2, 1.02], equal: true, axes: false, height: 320, weight: 0.9, title: 'row frequencies x̄ₜ' });
        const SY = v.stage({ x: [-0.12, 1.12], y: [-0.2, 1.02], equal: true, axes: false, height: 320, weight: 0.9, title: 'column frequencies ȳₜ' });
        const SL = v.stage({ x: [1, TM], y: [-2, 2], xlog: true, axes: 'box', gutter: true, height: 320, weight: 1.2, xlabel: 'round t', ylabel: 'bounds on the value', title: 'min_j (x̄ₜᵀA)ⱼ  ≤  v  ≤  max_i (Aȳₜ)ᵢ' });
        v.select('game', Object.keys(games).map((k) => ({ value: k, label: games[k].label })), 'rps', { onChange: (k) => { g = games[k]; } });
        const T = v.slider('rounds $t$', 1, TM, 60, { int: true, log: true });
        v.render(() => {
          const A = g.A, k = g.label;
          if (key !== k) { run = { ...fictitious(A, TM), sol: solveZS(A), P: zsPure(A) }; key = k; }
          const t = Math.round(T.value), { X, Y, lo, hi, sol } = run;
          drawTriangle(SX, v, { labels: ['row 1', 'row 2', 'row 3'], labelColor: 'blue' }); drawTriangle(SY, v, { labels: ['col 1', 'col 2', 'col 3'], labelColor: 'orange' });
          const pxs = idx(t).filter((s) => s < 400 || s % Math.ceil(t / 400) === 0 || s === t - 1);
          SX.path(pxs.map((s) => triPt(X[s])), { color: 'gold', width: 1.6 }); SY.path(pxs.map((s) => triPt(Y[s])), { color: 'gold', width: 1.6 });
          SX.dot(...triPt(sol.x), { r: 11, hollow: true, color: 'green', width: 2.5 }); SY.dot(...triPt(sol.y), { r: 11, hollow: true, color: 'green', width: 2.5 });
          SX.dot(...triPt(X[t - 1]), { r: 6, color: 'blue' }); SY.dot(...triPt(Y[t - 1]), { r: 6, color: 'orange' });
          const R = Math.max(1, Math.ceil(Math.max(...A.flat().map(Math.abs))) * 0.6);
          SL.setView([1, TM], [Math.min(sol.v, ...lo.slice(0, 1)) - 0.2 * R, Math.max(sol.v, hi[0]) + 0.2 * R]);
          const pts = (a) => a.map((q, s) => [s + 1, q]).filter((_, s) => s < 300 || s % 8 === 0);
          SL.hline(sol.v, { color: 'green', width: 2, dash: true });
          SL.path(pts(hi), { color: 'orange', width: 1.6, alpha: 0.4 }); SL.path(pts(lo), { color: 'blue', width: 1.6, alpha: 0.4 });
          SL.path(pts(hi.slice(0, t)), { color: 'orange', width: 2.4 }); SL.path(pts(lo.slice(0, t)), { color: 'blue', width: 2.4 });
          SL.vline(t, { color: 'gold', dash: true, width: 1.5 });
          SL.dot(t, hi[t - 1], { r: 5, color: 'orange' }); SL.dot(t, lo[t - 1], { r: 5, color: 'blue' });
        });
        v.readout(() => {
          if (!run) return '';
          const t = Math.round(T.value), gp = run.hi[t - 1] - run.lo[t - 1], d = Math.hypot(...run.X[t - 1].map((q, i) => q - run.sol.x[i]));
          return `$t=${t}$: $\\min_j(\\bar x_t^{\\mathsf T}A)_j=${tx(run.lo[t - 1])}\\;\\le\\;v=${tx(run.sol.v)}\\;\\le\\;\\max_i(A\\bar y_t)_i=${tx(run.hi[t - 1])}$, gap $=${tx(gp)}$, $\\sqrt t\\cdot\\text{gap}=${v.fix(gp * Math.sqrt(t), 2)}$\n(first-index tie-breaking; one optimal $x^*$ is marked, others may exist: the distance to it is ${v.fix(d, 3)} here)`;
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
      idea: String.raw`Track the potential $\Phi_t=\ln\sum_i e^{\eta G_t(i)}$ with $G_t(i)$ the cumulative gain. Each round raises it by at most $\eta\,x_t\!\cdot g_t+\eta^2/8$ (Hoeffding's lemma), while at the end $\Phi_T\ge\eta\max_iG_T(i)$ and at the start $\Phi_0=\ln m$; rearranging yields the regret bound. For the game, regret against the best fixed row says: the row player did as well as the best row against the *actual* column play, which is the time average $\bar y_T$, so $\max_i(A\bar y_T)_i\le\frac1T\sum_t x_t^{\mathsf T}Ay_t+R^{\rm row}_T/T$; the symmetric bound for the column player and $\sum_tx_t^{\mathsf T}Ay_t$ cancelling gives the displayed $\varepsilon$. The averages converge; the individual iterates $x_t$ generally keep orbiting the optimum, as in game-3.6.`,
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
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Model',
      name: 'Colonel Blotto',
      credit: 'Discrete teaching variant; continuous Colonel Blotto model: Gross & Wagner, 1950',
      statement: String.raw`Two colonels each distribute $N$ indivisible soldiers over $3$ battlefields, secretly and simultaneously: a pure strategy is an allocation $x=(x_1,x_2,x_3)\in\mathbb Z_{\ge0}^3$ with $\sum_kx_k=N$. In the version drawn here the row colonel's payoff is the number of battlefields where she has more soldiers, counting a tie as one half, minus $3/2$ (so the game is symmetric and zero-sum with value $0$):
$$a(x,y)=\sum_{k=1}^3\bigl([x_k>y_k]+\tfrac12[x_k=y_k]\bigr)-\tfrac32 .$$
By the minimax theorem (game-3.3) it has a value and optimal mixed allocations, found by linear programming (game-3.4). For $N=3$ the allocation $(1,1,1)$ is a pure saddle point, but for every $N\ge4$ no pure allocation is safe: the best pure guarantee is $-\tfrac12<0=v$, and every optimal strategy mixes several allocations, scattered so that no reply wins more than it loses.`,
      idea: String.raw`A pure allocation is exposed to a reply that wins the two battlefields it neglects. For $N\ge4$, against any fixed allocation the opponent can place just enough soldiers to win two fields and sacrifice the third, which is why the pure security level is negative. Randomising over a symmetric family of allocations that are spread around the simplex removes this: every allocation of the opponent then loses as often as it wins against the mixture. By the minimax theorem such a mixture exists, the game being symmetric forces the value to be $0$, and the optimum can be computed as the solution of a linear programme with one variable per allocation. The displayed support is one discrete LP solution. Gross and Wagner’s original model instead divides resources continuously and constructs continuous optimal distributions; its exact supports are not the finite supports shown here. The payoff rule (battlefields won, ties half) is one of several in the literature (others reward only a majority of fields), and the supports differ with the rule and $N$.`,
      caption: String.raw`Every allocation is a point of the triangle (corners: all soldiers on one field). Green discs show one optimal mixture found by linear programming, the area of each disc proportional to its probability (the optimum is not unique, this is the simplex method's vertex). Drag the gold point to choose your own pure allocation and pick *your allocation* or *the optimal mixture* as the row strategy: the bars show your payoff against each of the opponent's pure allocations. A pure allocation always has a negative bar for $N\ge4$, the mixture has none. Change $N$ to see the support rearrange.`,
      deps: ['game-3.3', 'algo-11.19'],
      refs: ['MSZ §4.14'],
      tags: ['Blotto', 'mixed strategy', 'zero-sum'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Blotto_game' },
      viz(v) {
        const NS = v.slider('soldiers $N$', 3, 12, 5, { int: true });
        const row = v.select('row strategy', [{ value: 'pure', label: 'your allocation' }, { value: 'mix', label: 'the optimal mixture' }], 'pure');
        const ST = v.stage({ x: [-0.12, 1.12], y: [-0.2, 1.02], equal: true, axes: false, height: 360, weight: 0.95, title: 'allocations; green: optimal mixture' });
        const SB = v.stage({ x: [0, 1], y: [-1.6, 1.6], axes: 'box', gutter: true, height: 360, weight: 1.15, xlabel: 'opponent’s pure allocation', ylabel: 'payoff', yticks: [[-1.5, '−1.5'], [-1, '−1'], [-0.5, '−0.5'], [0, '0'], [0.5, '0.5'], [1, '1'], [1.5, '1.5']], xticks: [], title: 'payoff against each pure reply' });
        const h = ST.handle(...triPt([1 / 3, 1 / 3, 1 / 3]), { color: 'gold', r: 10, constrain: (x, y) => triClamp(x, y) });
        let info = null;
        v.render(() => {
          const N = NS.value, { al, A, sol, pure } = blotto(N), pts = al.map((a) => triPt(a.map((q) => q / N)));
          drawTriangle(ST, v, { labels: ['all on 1', 'all on 2', 'all on 3'], labelColor: 'muted' });
          pts.forEach((p) => ST.dot(p[0], p[1], { r: 2.5, color: 'faint' }));
          sol.x.forEach((q, i) => { if (q > 1e-9) { ST.dot(pts[i][0], pts[i][1], { r: 5 + 22 * Math.sqrt(q), color: 'green', alpha: 0.5 }); ST.text(al[i].join('-'), pts[i][0], pts[i][1], { dy: -14 - 12 * Math.sqrt(q), align: 'center', size: 10.5, color: 'green', weight: 700 }); } });
          // snap your allocation
          const b = triBary(h.x, h.y); let bi = 0, bd = Infinity;
          al.forEach((a, i) => { const d = Math.hypot(pts[i][0] - h.x, pts[i][1] - h.y); if (d < bd) { bd = d; bi = i; } });
          h.set(pts[bi][0], pts[bi][1]);
          const rowS = row.value === 'pure' ? idx(al.length).map((i) => (i === bi ? 1 : 0)) : sol.x;
          const pay = al.map((_, j) => rowS.reduce((s, xi, i) => s + xi * A[i][j], 0));
          const nB = al.length; SB.setView([0, nB], [-1.6, 1.6]);
          pay.forEach((p, j) => SB.rect(j + 0.1, Math.min(0, p), j + 0.9, Math.max(0, p), { fill: p < -1e-9 ? 'orange' : p > 1e-9 ? 'blue' : 'green', fillAlpha: 0.7, color: p < -1e-9 ? 'orange' : 'blue', width: 0.5 }));
          SB.hline(0, { color: 'ink', width: 1.5 });
          const worst = Math.min(...pay);
          info = { N, al, bi, worst, pure, nB, vstar: sol.v, rowS };
        });
        v.readout(() => {
          if (!info) return '';
          const { N, al, bi, worst, pure, nB, vstar } = info;
          const sp = info.rowS.filter((q) => q > 1e-9).length;
          return `$N=${N}$: ${nB} allocations   value $v=${tx(Math.abs(vstar) < 1e-9 ? 0 : vstar)}$   best pure guarantee $\\underline v=${tx(pure.maxmin)}$ ${pure.maxmin < -1e-9 ? '(no pure allocation is safe)' : '(a pure saddle point)'}\n${row.value === 'pure' ? `your allocation ${al[bi].join('-')}` : `the optimal mixture (${sp} allocations)`}: worst-case payoff over all pure replies $=${tx(worst)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Blackwell’s approachability theorem',
      credit: 'David Blackwell, 1956',
      statement: String.raw`In a repeated game, when players $1$ and $2$ choose actions $i_t,j_t$, player 1 receives a **vector payoff** $r(i_t,j_t)\in\mathbb R^d$ (a finite set of possibilities). A nonempty closed convex set $S\subset\mathbb R^d$ is **approachable** by player 1 if she has a strategy (a rule giving her mixed action from the history) such that the average payoff $\bar r_T=\frac1T\sum_{t\le T}r(i_t,j_t)$ satisfies $\operatorname{dist}(\bar r_T,S)\to0$ almost surely, uniformly against the opponent in the tail-probability sense of approachability. **Theorem (Blackwell 1956).** A nonempty closed convex set $S$ is approachable if and only if every half-space containing $S$ is approachable in the one-shot sense, i.e. for every unit vector $u$,
$$\min_{x\in\Delta}\max_j\;u\cdot r(x,j)\;\le\;\sup_{s\in S}u\cdot s .$$
The strategy is explicit: at time $t$, with $c_t$ the point of $S$ nearest to $\bar r_{t-1}$ and $u_t=\bar r_{t-1}-c_t\ne0$, play a minimax strategy of the scalar game $u_t\cdot r(x,j)$. For bounded payoffs the expected squared distance is $O(1/T)$; a deterministic $D/\sqrt T$ bound on each realized random path is not asserted. In the expected-payoff dynamics drawn below, the projection recursion gives a deterministic square-root bound. Thus approachability reduces to the scalar minimax theorem applied in each direction; this is its vector-valued analogue.`,
      idea: String.raw`Suppose the average $\bar r_{t-1}$ is outside $S$ at distance $d$, nearest point $c$, direction $u$. Her prescribed mixed action makes the *expected* next payoff lie on the $S$-side of the hyperplane through $c$ perpendicular to $u$, whatever the column player does; this is the half-space condition (a closest-point projection, rca-4.10, supplies $c$ and $u$). The new average is a convex combination of $\bar r_{t-1}$ and that payoff, so, for the expected-payoff dynamics in the picture, its distance obeys $t^2d_t^2\le(t-1)^2d_{t-1}^2+\|r_t-c\|^2$: the cross term has the right sign. For realized sampled actions this inequality holds after conditional expectation; summing controls expected squared distance, and Blackwell’s probability argument establishes almost-sure convergence. Necessity: if some half-space $\{z:u\cdot z\le h\}\supset S$ is not approachable one-shot, then by the scalar minimax theorem (game-3.3) player 2 has a reply that keeps $u\cdot\bar r_T$ above $h$ on average. Blackwell's theorem underlies calibration and no-regret learning, and it implies the Hedge guarantee of game-3.7.`,
      caption: String.raw`The nine dots are the payoff vectors $r(i,j)$ of a $3\times3$ game with vector payoffs (a model, chosen for the picture); the dashed hull is what she can get in one round. Drag the green target (disc or square) with its radius. The half-space test samples 180 directions: a negative margin disproves approachability, while a nonnegative sampled margin leaves the directions between samples unchecked. The gold path shows running averages $\bar r_t$; the black line is the half-space through the nearest point $c$ separating the target from the current average. If a half-space fails, some adversary can keep the average away; the selected random or cyclic adversary need not do so. The right plot compares $\operatorname{dist}(\bar r_t,S)$ with the projection bound $\sqrt{\sum\|r_s-c_s\|^2}/t$; its guarantee requires the full approachability condition. The payoff $r_t$ is that of her mixed action (an expectation) against the adversary's pure column.`,
      deps: ['game-3.3', 'rca-4.10', 'prob-4.1.1a'],
      refs: ['MSZ §14.5'],
      tags: ['approachability', 'vector payoffs', 'minimax'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Approachability_(game_theory)' },
      viz(v) {
        let seed = 1, sim = null, skey = '';
        const P = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: 'box', gutter: true, height: 400, weight: 1.1, xlabel: 'first component of the payoff', ylabel: 'second component', title: 'running average of the vector payoff' });
        const D = v.stage({ x: [1, 400], y: [1e-3, 5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 400, weight: 0.9, xlabel: 'round t', ylabel: 'distance to the target', title: 'dist(r̄ₜ, S)' });
        const shape = v.select('target', [{ value: 'disc', label: 'disc' }, { value: 'box', label: 'square' }], 'disc');
        const adv = v.select('adversary', [{ value: 'adapt', label: 'worst case' }, { value: 'rand', label: 'random' }, { value: 'cyc', label: 'cyclic' }], 'adapt');
        const R = v.slider('radius', 0.2, 2.5, 0.8, { step: 0.05 });
        const T = v.slider('rounds $t$', 1, 400, 120, { int: true, log: true });
        v.button('Resample', () => { seed += 1; });
        const hc = P.handle(0.6, 0.4, { color: 'green', r: 10, constrain: { x: [-3, 3], y: [-3, 3] } });
        const near = (a, c, r, sh) => { if (sh === 'disc') { const dx = a[0] - c[0], dy = a[1] - c[1], d = Math.hypot(dx, dy); return d <= r ? { p: a, d: 0 } : { p: [c[0] + (r * dx) / d, c[1] + (r * dy) / d], d: d - r }; } const p = [clamp(a[0], c[0] - r, c[0] + r), clamp(a[1], c[1] - r, c[1] + r)]; return { p, d: Math.hypot(a[0] - p[0], a[1] - p[1]) }; };
        const supp = (u, c, r, sh) => u[0] * c[0] + u[1] * c[1] + (sh === 'disc' ? r : r * (Math.abs(u[0]) + Math.abs(u[1])));
        const simulate = (c, r, sh, am, sd) => {
          const rg = v.rng(sd * 7 + 3), rr = (x, j) => [0, 1].map((k) => x.reduce((s, xi, i) => s + xi * RV[i][j][k], 0));
          let avg = [0, 0], cum = 0; const path = [], dist = [], bnd = [];
          for (let t = 1; t <= 400; t++) {
            const q = near(avg, c, r, sh); let x = t === 1 ? [1, 0, 0] : [1 / 3, 1 / 3, 1 / 3], u = null;
            if (t > 1 && q.d > 1e-12) { u = [(avg[0] - q.p[0]) / q.d, (avg[1] - q.p[1]) / q.d]; x = dirVal(u).x; }
            let j;
            if (am === 'adapt' && u) j = argmax(idx(3).map((jj) => { const p = rr(x, jj); return u[0] * p[0] + u[1] * p[1]; })); else if (am === 'cyc') j = (t - 1) % 3; else j = rg.int(0, 2);
            const p = rr(x, j); avg = t === 1 ? p : [((t - 1) * avg[0] + p[0]) / t, ((t - 1) * avg[1] + p[1]) / t];
            cum += (p[0] - q.p[0]) ** 2 + (p[1] - q.p[1]) ** 2;
            path.push(avg.slice()); dist.push(near(avg, c, r, sh).d); bnd.push(Math.sqrt(cum) / t);
          }
          return { path, dist, bnd };
        };
        let info = null;
        v.render(() => {
          const c = [hc.x, hc.y], r = R.value, sh = shape.value, am = adv.value, t = Math.round(T.value);
          const k = `${c[0].toFixed(3)}|${c[1].toFixed(3)}|${r}|${sh}|${am}|${seed}`;
          if (k !== skey) { sim = simulate(c, r, sh, am, seed); skey = k; }
          const margin = Math.min(...DIRS.map((d) => supp(d.u, c, r, sh) - d.val)), ok = margin >= -1e-9;
          if (sh === 'disc') P.circle(c[0], c[1], r, { fill: 'green', fillAlpha: 0.18, color: 'green', width: 2 }); else P.rect(c[0] - r, c[1] - r, c[0] + r, c[1] + r, { fill: 'green', fillAlpha: 0.18, color: 'green', width: 2 });
          const pts = [];
          RV.forEach((rw) => rw.forEach((q) => pts.push(q)));
          P.poly(v.M.hull(pts), { color: 'muted', width: 1.2, fill: false, dash: true });
          pts.forEach((q) => P.dot(q[0], q[1], { r: 4, color: 'muted' }));
          const path = sim.path.slice(0, t);
          P.path(path.filter((_, s) => s < 200 || s % 2 === 0), { color: 'gold', width: 1.6, alpha: 0.8 });
          const a = sim.path[t - 1], q = near(a, c, r, sh);
          if (q.d > 1e-9) { const u = [(a[0] - q.p[0]) / q.d, (a[1] - q.p[1]) / q.d], w = [-u[1], u[0]]; P.line(q.p[0] - 6 * w[0], q.p[1] - 6 * w[1], q.p[0] + 6 * w[0], q.p[1] + 6 * w[1], { color: 'ink', width: 2 }); P.dot(q.p[0], q.p[1], { r: 5, color: 'green' }); P.line(q.p[0], q.p[1], a[0], a[1], { color: 'red', width: 1.5 }); }
          P.dot(a[0], a[1], { r: 7, color: 'gold' });
          const dp = (a) => a.map((d, s) => (d > 1e-9 ? [s + 1, d] : null)).filter((q, s) => s < 100 || s % 2 === 0 || !q);
          D.path(dp(sim.dist), { color: 'gold', width: 2.2, alpha: 0.35 });
          D.path(dp(sim.dist.slice(0, t)), { color: 'gold', width: 2.4 });
          D.path(sim.bnd.map((d, s) => [s + 1, Math.max(d, 1e-4)]), { color: 'muted', width: 1.8, dash: true });
          D.vline(t, { color: 'gold', dash: true, width: 1.5 });
          P.corner(ok ? '180 sampled tests pass' : 'NOT approachable', 'tl', { color: ok ? 'green' : 'red', weight: 700, plate: true });
          info = { margin, ok, t, d: sim.dist[t - 1], b: sim.bnd[t - 1], bad: DIRS.filter((d) => supp(d.u, c, r, sh) - d.val < -1e-9).length };
        });
        v.readout(() => {
          if (!info) return '';
          const { margin, ok, t, d, b, bad } = info;
          return `half-space test over 180 directions: $\\min_u\\,[\\max_{s\\in S}u\\cdot s-\\operatorname{val}(u)]=${v.fix(margin, 3)}$ ${ok ? '$\\ge0$: sampled tests pass; unsampled directions are unchecked' : `$<0$ in ${bad} directions: not approachable`}\n$t=${t}$: $\\operatorname{dist}(\\bar r_t,S)=${v.fix(d, 4)}$ observed distance vs projection bound $\\sqrt{\\textstyle\\sum\\|r_s-c_s\\|^2}/t=${v.fix(b, 4)}$: ${d <= b + 1e-9 ? 'bound met at this round' : 'bound not met at this round'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Paper',
      name: 'Zur Theorie der Gesellschaftsspiele',
      paper: { authors: 'J. v. Neumann', year: 1928, title: 'Zur Theorie der Gesellschaftsspiele', venue: 'Mathematische Annalen 100: 295–320', doi: '10.1007/BF01448847' },
      introduces: ['game-3.3'],
      credit: 'John von Neumann, 1928',
      statement: String.raw`Von Neumann proved that **every finite two-person zero-sum game has a value in mixed strategies**: for any real matrix $A$ the quantities $\max_x\min_y x^{\mathsf T}Ay$ and $\min_y\max_x x^{\mathsf T}Ay$ over probability vectors are equal (game-3.3). In pure strategies the two security levels of a game can differ, which is the paper's starting point, so a player who must commit to one move is at the mercy of an opponent who guesses it; the cure is to randomise, and the theorem says that with the right mixture the game becomes "determined": neither player gains from knowing the other's *probabilities*. The paper works with the *Gesellschaftsspiel* (parlour game) as a mathematical object, defining strategies, the normal form and the value, and treats zero-sum games of two persons in full; §IV then analyses three-player coalitions, and §V discusses general coalitional values while leaving a complete general theory for more than three players open.`,
      idea: String.raw`The original paper first reduces a finite game with chance and partial observations to complete plans and expected payoffs (§I, pp. 298–302). It then compares pure security levels, using Matching Pennies and Rock–Paper–Scissors as examples (§II, pp. 302–306), and introduces probability vectors to close the gap. The proof in §III, pp. 307–311, successively eliminates variables in a continuous function with convex upper and lower level sets; its final one-dimensional argument uses closed intervals and semicontinuity. This is more specific than simply describing the proof as an application of a later fixed-point theorem. A footnote on p. 306 acknowledges Borel’s January 1927 question about symmetric games. The paper also studies three-player coalitions (§IV) and general coalition values (§V); its mixed minimax theorem concerns two-player zero-sum games.`,
      caption: String.raw`A $2\times2$ game you edit: click a cell and move the gold slider (Matching Pennies and a skew game are presets). Right: the row player's guarantee $g(p)=\min_j(p\,a_{1j}+(1-p)\,a_{2j})$ (blue) and the column player's ceiling $h(q)=\max_i(a_{i1}q+a_{i2}(1-q))$ (orange) over their mixing probabilities (the horizontal axis is $p$ for the blue curve, $q$ for the orange one). In pure strategies the best end points $\max(g(0),g(1))$ and $\min(h(0),h(1))$ differ, but the peak of the blue curve and the trough of the orange curve sit at one height, the value $v$: von Neumann's theorem. Drag the handles to read off guarantees, then click presets and edit entries: the two heights agree for every matrix.`,
      deps: ['game-3.2', 'pma-4.16'],
      refs: [],
      tags: ['minimax', 'history', 'mixed strategy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Minimax_theorem' },
      viz(v) {
        const keys = ['pennies', 'skew', 'saddle2', 'dom'];
        const PRE = { pennies: { label: 'Matching Pennies', A: [[1, -1], [-1, 1]] }, skew: { label: 'skew game', A: [[2, -3], [-1, 4]] }, saddle2: { label: 'saddle point', A: [[3, 2], [1, 0]] }, dom: { label: 'column 2 dominated', A: [[4, 6], [-2, 5]] } };
        let A = copyM(PRE.pennies.A), sel = [0, 0];
        const M = v.stage({ x: [-1.5, 3.9], y: [-1.7, 2.7], equal: true, axes: false, height: 340, weight: 0.9, title: 'a zero-sum game (payoffs to the row player)' });
        const S = v.stage({ x: [0, 1], y: [-4, 4], axes: 'box', gutter: true, height: 340, weight: 1.2, xlabel: 'mixing probability (p for blue, q for orange)', ylabel: 'payoff to the row player', title: 'both players’ security levels, as functions of the mixture' });
        const ed = v.slider('gold entry', -9, 9, 1, { int: true, onChange: (x) => { A[sel[0]][sel[1]] = x; } });
        v.select('game', keys.map((k) => ({ value: k, label: PRE[k].label })), 'pennies', { onChange: (k) => { A = copyM(PRE[k].A); sel = [0, 0]; ed.set(A[0][0]); } });
        M.onClick((x, y) => { const c = matCell(x, y, 2, 2); if (c) { sel = c; ed.set(A[c[0]][c[1]]); v.invalidate(); } });
        const hp = S.handle(0.5, 0, { color: 'blue', r: 9, constrain: (x) => [clamp(x, 0, 1), 0] });
        const hq = S.handle(0.5, 0, { color: 'orange', r: 9, constrain: (x) => [clamp(x, 0, 1), 0] });
        let info = null;
        v.render(() => {
          const P = zsPure(A), sol = solveZS(A);
          const w = matWindow(2, 2); M.setView(w.x, w.y);
          drawMat(M, A, { rowMin: P.rowMin, colMax: P.colMax, sel, rowMinHi: (i) => P.rowMin[i] === P.maxmin, colMaxHi: (j) => P.colMax[j] === P.minmax, mark: (i, j) => (P.saddles.some(([a, b]) => a === i && b === j) ? 'green' : null) });
          const R = Math.max(2, Math.ceil(Math.max(...A.flat().map(Math.abs))) + 1);
          S.setView([0, 1], [-R, R]);
          const g = (p) => Math.min(p * A[0][0] + (1 - p) * A[1][0], p * A[0][1] + (1 - p) * A[1][1]);
          const h = (q) => Math.max(q * A[0][0] + (1 - q) * A[0][1], q * A[1][0] + (1 - q) * A[1][1]);
          S.fn(g, { domain: [0, 1], color: 'blue', width: 3.5 }); S.fn(h, { domain: [0, 1], color: 'orange', width: 3.5 });
          S.hline(sol.v, { color: 'green', dash: true, width: 2 });
          S.dot(sol.x[0], sol.v, { r: 7, color: 'blue', hollow: true }); S.dot(sol.y[0], sol.v, { r: 7, color: 'orange', hollow: true });
          const p = hp.x, q = hq.x; hp.set(p, g(p)); hq.set(q, h(q));
          // pure end points
          S.dot(0, g(0), { r: 4, color: 'blue' }); S.dot(1, g(1), { r: 4, color: 'blue' }); S.dot(0, h(0), { r: 4, color: 'orange' }); S.dot(1, h(1), { r: 4, color: 'orange' });
          const gm = Math.max(g(0), g(1)), hm = Math.min(h(0), h(1));
          // best of g on a fine grid, and worst of h
          let G = -Infinity, H = Infinity; for (let k = 0; k <= 2000; k++) { G = Math.max(G, g(k / 2000)); H = Math.min(H, h(k / 2000)); }
          info = { p, q, gp: g(p), hq: h(q), gm, hm, G, H, v: sol.v, P };
        });
        v.readout(() => {
          if (!info) return '';
          const { p, q, gp, hq: hh, gm, hm, G, H, P } = info;
          return `pure strategies: $\\underline v=${tx(P.maxmin)}$ (blue end points), $\\overline v=${tx(P.minmax)}$ (orange end points)${P.maxmin < P.minmax ? ' — they differ' : ' — a saddle point'}\nmixed: $\\max_p g(p)=${v.fix(G, 4)}$ and $\\min_q h(q)=${v.fix(H, 4)}$ agree (difference $${v.sci(Math.abs(G - H) + 1e-16, 1)}$); your handles: $g(${v.fix(p, 2)})=${tx(gp)}$, $h(${v.fix(q, 2)})=${tx(hh)}$\nThe 1928 theorem asserts $\\max_p g=\\min_q h$ for every finite matrix; here it is checked on a grid for the game shown.`;
        });
      },
    },
  ],
};
