// Game Theory & Social Choice — Chapter 2: Mixed strategies and the existence of equilibrium
import {
  C1, C2, EPS, FONT, nm, idx, splitU, expU, rowPay, colPay, regret, supportEnum, lemkeHowson, randGame,
  TRI, triPt, triBary, triClamp, drawTriangle, G2, d1, d2, indiff,
} from './ch02.shared.js';

const gameSelect = (v, keys, init, onChange) => v.select('game', keys.map((k) => ({ value: k, label: G2[k].label })), init, { onChange });
const cl01 = (t) => Math.min(1, Math.max(0, t));

export default {
  collection: 'game',
  chapter: 2,
  title: 'Mixed strategies and the existence of equilibrium',
  summary: String.raw`Once players may randomize, and judge a lottery by its expected payoff, every finite game has an equilibrium — Nash's theorem, proved with a fixed-point theorem applied to the best-reply correspondence. In a mixed equilibrium each player is indifferent among the actions she uses, and that single observation is what makes equilibria computable: by solving for indifference, by Lemke–Howson path following in two-player games, or by enumerating supports. Yet finding an equilibrium is a PPAD-complete problem, believed hard in general. The same equilibria can be reinterpreted or refined — as recommendations from a mediator (correlated equilibrium), as limits of trembling play (perfection), or as pure rules of players with private payoff shocks (Harsanyi purification) — and professional sportsmen mix, to a surprising degree, as the theory says they should.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Mixed strategies and expected payoffs',
      credit: 'von Neumann, 1928; von Neumann & Morgenstern, 1944',
      statement: String.raw`Let a finite strategic game have players $i$ with finite action sets $A_i$. A **mixed strategy** of player $i$ is a probability distribution $\sigma_i$ on $A_i$, i.e. a vector $(\sigma_i(a))_{a\in A_i}$ with $\sigma_i(a)\ge 0$ and $\sum_a\sigma_i(a)=1$; the set of these is the simplex $\Delta(A_i)$, and the pure strategies are its vertices. Players randomize **independently**, so the profile $\sigma=(\sigma_1,\dots,\sigma_n)$ induces the product distribution on action profiles, and player $i$'s **expected payoff** is
$$U_i(\sigma)=\sum_{a\in A}\Bigl(\prod_{j}\sigma_j(a_j)\Bigr)\,u_i(a).$$
The payoffs $u_i$ are now meaningful **up to positive affine maps** $u_i\mapsto\alpha u_i+\beta$, $\alpha>0$ (they are von Neumann–Morgenstern utilities, micro-13.2): the ranking of lotteries is unchanged by such a map, but a merely increasing transformation can reverse it. $U_i$ is linear in $\sigma_i$ for fixed $\sigma_{-i}$, so $U_i(\sigma_i,\sigma_{-i})=\sum_a\sigma_i(a)\,U_i(a,\sigma_{-i})$ is a weighted average of the pure-action payoffs.`,
      idea: String.raw`A mixed strategy is the simplest way to let a player hide her choice: the opponents face a known distribution, not a known action. Independence is what makes the probability of a cell the *product* $p_iq_j$ — a picture of areas in the unit square — and what makes $U_i$ bilinear. Because the expectation is linear in one's own mixture, a mixture can never beat the best pure action it contains; this is the seed of the indifference principle (game-2.2). Interpreting the numbers $u_i$ as expected-utility payoffs is an extra assumption beyond the ordinal preferences of game-1.1, justified by the von Neumann–Morgenstern axioms.

Write the realized payoff as the finite sum over profiles a of $u_i(a)\prod_j I_{j,a_j}$, where $I_{j,a_j}$ indicates player j's sampled action. Linearity of expectation (prob 1.6.1) moves expectation inside that sum. Independent players' action indicators have factored product expectations by prob 2.1.13, giving exactly $\prod_j\sigma_j(a_j)$ and hence the displayed expected-payoff formula. Indicators for different actions of the same player are not independent; no such factorization is used. Holding the other mixtures fixed then leaves an affine, indeed linear, function of one's own probabilities.`,
      caption: String.raw`Drag the gold point in the right panel, whose axes are $p$ (the row player's probability of the first row) and $q$ (the column player's probability of the first column). The left panel cuts the unit square into four rectangles of widths $q,1-q$ and heights $p,1-p$: the area of a rectangle is the probability of that cell, and the expected payoff is the area-weighted average of the payoffs printed in it. The right panel is the whole bilinear surface $U_1(p,q)$ or $U_2(p,q)$ as a heat map with level lines. Apply a transformation to player 1's payoffs: an affine one transforms $U_1$ the same way; the cubic one (increasing, not affine) can change which of two lotteries she prefers.`,
      deps: ['game-1.1', 'micro-13.2', 'prob-1.6.1', 'prob-2.1.13'],
      refs: ['Osborne §4.3', 'MSZ §5.1'],
      tags: ['mixed strategy', 'expected payoff'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Strategy_(game_theory)#Mixed_strategy' },
      viz(v) {
        const keys = ['chicken', 'pennies', 'bos', 'stag'];
        let g = G2.chicken;
        const M = v.stage({ x: [-0.3, 1.05], y: [-0.14, 1.14], axes: false, height: 340, weight: 1, title: 'the mixed profile as areas' });
        const H = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'p = P(row player plays the first row)', ylabel: 'q = P(column player plays the first column)', title: 'expected payoff over all mixed profiles' });
        const who = v.select('surface', [{ value: 0, label: '$U_1$' }, { value: 1, label: '$U_2$' }], 0);
        const tr = v.select('transform $u_1$', [{ value: 'id', label: 'none' }, { value: 'aff', label: '$2u_1+3$' }, { value: 'cube', label: '$u_1^3$' }], 'id');
        gameSelect(v, keys, 'chicken', (k) => { g = G2[k]; });
        const f = () => (tr.value === 'aff' ? (u) => 2 * u + 3 : tr.value === 'cube' ? (u) => u * u * u : (u) => u);
        const Atr = () => g.A.map((r) => r.map(f()));
        const U = (k, p, q) => { const A = k === 0 ? Atr() : g.B; return expU(A, A, [p, 1 - p], [q, 1 - q])[0]; };
        const h = H.handle(0.35, 0.65, { color: 'gold', label: '', constrain: { x: [0, 1], y: [0, 1] } });
        let info = null;
        v.render(() => {
          const p = h.x, q = h.y, A = Atr(), B = g.B, k = who.value;
          // heat map
          const vals = []; for (let a = 0; a <= 4; a++) for (let b = 0; b <= 4; b++) vals.push(U(k, a / 4, b / 4));
          const lo = Math.min(...vals), hi = Math.max(...vals), mid = (lo + hi) / 2, span = Math.max((hi - lo) / 2, 1e-6);
          H.heat((x, y) => U(k, x, y), { cmap: 'theme-diverging', neg: k === 0 ? 'blue' : 'orange', pos: k === 0 ? 'blue' : 'orange', range: [lo, hi], res: 3, key: `${g.label}|${tr.value}|${k}` });
          H.contour((x, y) => U(k, x, y), Array.from({ length: 7 }, (_, t) => lo + ((t + 1) * (hi - lo)) / 8), { color: 'ink', alpha: 0.3, width: 1 });
          H.line(p, 0, p, 1, { color: C1, alpha: 0.35, dash: true }); H.line(0, q, 1, q, { color: C2, alpha: 0.35, dash: true });
          // mosaic: columns split by q, rows by p
          const px = [q, 1 - q], py = [p, 1 - p], xs = [0, q, 1], ys = [1, 1 - p, 0];
          let e1 = 0, e2 = 0;
          for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
            const area = py[i] * px[j]; e1 += area * A[i][j]; e2 += area * B[i][j];
            const x0 = xs[j], x1 = xs[j + 1], y1 = ys[i], y0 = ys[i + 1];
            M.rect(x0, y0, x1, y1, { fill: 'accent', fillAlpha: 0.05 + 0.5 * area, color: 'muted', width: 1.2 });
            const w = M.X(x1) - M.X(x0), hh = M.Y(y0) - M.Y(y1);
            if (w > 62 && hh > 30) {
              M.text(`${nm(A[i][j])}, ${nm(B[i][j])}`, (x0 + x1) / 2, (y0 + y1) / 2 + (hh > 52 ? 0.035 : 0), { align: 'center', baseline: 'middle', size: 13, weight: 700, color: 'ink' });
              if (hh > 52) M.text(`${nm(100 * area, 1)}%`, (x0 + x1) / 2, (y0 + y1) / 2 - 0.045, { align: 'center', baseline: 'middle', size: 11, color: 'muted' });
            }
          }
          g.R.forEach((t, i) => M.text(`${t}  ${nm(100 * py[i], 0)}%`, -0.02, (ys[i] + ys[i + 1]) / 2, { align: 'right', baseline: 'middle', size: 12, weight: 700, color: C1 }));
          g.C.forEach((t, j) => M.text(`${t}  ${nm(100 * px[j], 0)}%`, (xs[j] + xs[j + 1]) / 2, 1.04, { align: 'center', baseline: 'bottom', size: 12, weight: 700, color: C2 }));
          const sc = f();
          // preference between the mixture and the pure row 0, original vs transformed
          const base = g.A, ref = (m) => expU(m, m, [p, 1 - p], [q, 1 - q])[0] - expU(m, m, [1, 0], [q, 1 - q])[0];
          const d0 = ref(base), dt = ref(A);
          info = { p, q, e1, e2, d0, dt, lot: sc };
        });
        v.readout(() => {
          if (!info) return '';
          const { p, q, e1, e2, d0, dt } = info;
          const pref = (d) => (Math.abs(d) < 1e-9 ? 'indifferent between' : d > 0 ? 'prefers' : 'rejects');
          const u0 = expU(g.A, g.A, [p, 1 - p], [q, 1 - q])[0];
          const line1 = `$U_1 = ${v.fix(e1, 3)}$, $U_2 = ${v.fix(e2, 3)}$ at $(p,q)=(${v.fix(p, 2)},${v.fix(q, 2)})$ — the area-weighted average of the four payoff pairs`;
          if (tr.value === 'id') return line1;
          const same = tr.value === 'aff' ? `$U_1$ of the new payoffs is $2\\cdot${v.fix(u0, 3)}+3 = ${v.fix(2 * u0 + 3, 3)}$ ✓ (affine: expectations commute with the map)` : `$f(U_1) = ${v.fix(u0 ** 3, 3)}$ but $U_1$ of the cubed payoffs is $${v.fix(e1, 3)}$ — expectations do **not** commute with a non-affine map`;
          const flip = Math.sign(d0) !== Math.sign(dt) && Math.abs(d0) > 1e-9 && Math.abs(dt) > 1e-9;
          return `${line1}\n${same}\nPlayer 1 ${pref(d0)} this mixture over pure ${g.R[0]} (original payoffs); with the transformed payoffs she ${pref(dt)} it${flip ? ' — **the ranking of the two lotteries has reversed**' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Indifference principle for mixed equilibria',
      credit: 'Nash, 1950–51',
      statement: String.raw`Let $\sigma^*$ be a mixed-strategy profile of a finite strategic game. Then $\sigma^*$ is a Nash equilibrium if and only if, for every player $i$, (a) every pure action $a$ in the support of $\sigma_i^*$ (those with $\sigma_i^*(a)>0$) gives player $i$ the same expected payoff against $\sigma_{-i}^*$, and (b) no action outside the support gives more than that common value. In particular, a player who mixes strictly between two actions must be **indifferent** between them, and the payoff of each mixing player at equilibrium equals $U_i(\sigma^*)$, the payoff of any action she uses. For a $2\times2$ game with a completely mixed equilibrium $(p^*,q^*)$, $p^*$ is the point at which the *column* player's two payoff lines cross, and $q^*$ the point where the row player's do.`,
      idea: String.raw`By linearity (game-2.1), $U_i(\sigma_i,\sigma^*_{-i})$ is the $\sigma_i$-weighted average of the pure payoffs $U_i(a,\sigma_{-i}^*)$. An average of numbers equals the maximum of the numbers only if every number carrying positive weight equals the maximum — this gives (a) and (b) from the definition of equilibrium (game-1.3), and conversely if (a) and (b) hold then no mixture can beat the common value. The principle turns the search for an equilibrium into a *finite* problem: guess the supports, solve the indifference equations, check the inequalities (game-2.5 and the algorithm used in this chapter's pictures).`,
      caption: String.raw`The left panel plots the row player's payoff from each of her two actions as a function of $q$, the column player's probability of the first column; the right panel does the same for the column player against $p$. Drag the two handles. The gold dot on each vertical line is the payoff from the player's own current mixture: a weighted average, so it sits strictly between the two lines unless she uses only the higher one. Only where the lines cross — which is where the *opponent* must mix to make her indifferent — can a mixed reply be a best reply. Choose the Prisoner's Dilemma: the lines never cross and no mixing is possible.`,
      deps: ['game-2.1', 'game-1.3'],
      refs: ['Osborne §4.3', 'Osborne §4.10'],
      tags: ['indifference', 'mixed equilibrium'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Nash_equilibrium#Proof_of_existence' },
      viz(v) {
        const keys = ['pennies', 'chicken', 'bos', 'stag', 'pd'];
        let g = G2.pennies;
        const SL = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'q = P(column player plays the first column)', ylabel: 'row player’s payoff', title: 'row player: payoff of each action' });
        const SR = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'p = P(row player plays the first row)', ylabel: 'column player’s payoff', title: 'column player: payoff of each action' });
        const hq = SL.handle(0.3, 0, { color: C2, label: 'q', constrain: 'x', r: 8 });
        const hp = SR.handle(0.7, 0, { color: C1, label: 'p', constrain: 'x', r: 8 });
        gameSelect(v, keys, 'pennies', (k) => { g = G2[k]; const A = g.A, B = g.B; const qs = indiff((q) => d1(A, q)), ps = indiff((p) => d2(B, p)); hq.set(qs ?? 0.3, hq.y); hp.set(ps ?? 0.7, hp.y); });
        v.button('Go to the mixed equilibrium', () => { const qs = indiff((q) => d1(g.A, q)), ps = indiff((p) => d2(g.B, p)); if (qs != null && ps != null) { hq.set(qs, hq.y); hp.set(ps, hp.y); } });
        let st = null;
        const panel = (S, h, lines, mix, cols, names) => {
          const lo = Math.min(...lines.flat()), hi = Math.max(...lines.flat()), pad = 0.12 * (hi - lo || 1);
          S.setView([0, 1], [lo - pad, hi + pad]);
          h.set(h.x, lo - pad + 0.0001);
          lines.forEach((ln, i) => { S.line(0, ln[0], 1, ln[1], { color: cols[i], width: 3 }); S.text(names[i], 0.98, ln[1], { align: 'right', baseline: ln[1] >= ln[0] ? 'bottom' : 'top', dy: ln[1] >= ln[0] ? -5 : 5, size: 11.5, weight: 700, color: cols[i] }); });
          const x = h.x, y0 = lines[0][0] + (lines[0][1] - lines[0][0]) * x, y1 = lines[1][0] + (lines[1][1] - lines[1][0]) * x, own = mix * y0 + (1 - mix) * y1;
          S.segment([x, y0], [x, y1], { color: 'muted', width: 2, alpha: 0.7 });
          S.dot(x, y0, { r: 5, color: cols[0] }); S.dot(x, y1, { r: 5, color: cols[1] });
          S.dot(x, own, { r: 8, color: 'gold' });
          return { y0, y1, own, best: Math.max(y0, y1) };
        };
        v.render(() => {
          const A = g.A, B = g.B, p = hp.x, q = hq.x;
          // row player's two lines against q; column player's two lines against p
          const rl = [[A[0][1], A[0][0]], [A[1][1], A[1][0]]], cl = [[B[1][0], B[0][0]], [B[1][1], B[0][1]]];
          const qs = indiff((t) => d1(A, t)), ps = indiff((t) => d2(B, t));
          const R = panel(SL, hq, rl, p, [C1, 'teal'], [g.R[0], g.R[1]]);
          const Cc = panel(SR, hp, cl, q, [C2, 'pink'], [g.C[0], g.C[1]]);
          if (qs != null) { SL.vline(qs, { color: 'green', dash: true, width: 1.5 }); SL.dot(qs, rl[0][1] * qs + rl[0][0] * (1 - qs), { r: 6, color: 'green', hollow: true }); }
          if (ps != null) { SR.vline(ps, { color: 'green', dash: true, width: 1.5 }); SR.dot(ps, cl[0][1] * ps + cl[0][0] * (1 - ps), { r: 6, color: 'green', hollow: true }); }
          const rg = Math.max(R.best - R.own, 0), cg = Math.max(Cc.best - Cc.own, 0);
          st = { p, q, qs, ps, rg, cg, R, Cc };
        });
        v.legend([[C1, 'row action 1'], ['teal', 'row action 2'], [C2, 'column action 1'], ['pink', 'column action 2'], ['gold', 'payoff of the player’s own mixture', { dot: true }], ['green', 'indifference point', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { p, q, qs, ps, rg, cg, R, Cc } = st;
          const eq = rg < 1e-6 && cg < 1e-6;
          const where = qs != null && ps != null ? `the lines cross at $q^*=${v.fix(qs, 3)}$ (row) and $p^*=${v.fix(ps, 3)}$ (column): the mixed equilibrium is $(p^*,q^*)$.` : 'the lines do not cross inside $[0,1]$: one action is always better, so no player ever mixes in equilibrium';
          return `Row payoffs at $q=${v.fix(q, 2)}$: ${v.fix(R.y0, 2)} vs ${v.fix(R.y1, 2)}, her mixture $p=${v.fix(p, 2)}$ earns ${v.fix(R.own, 2)} — a loss of **${v.fix(rg, 3)}** against her best action\nColumn payoffs at $p=${v.fix(p, 2)}$: ${v.fix(Cc.y0, 2)} vs ${v.fix(Cc.y1, 2)}, her mixture $q$ earns ${v.fix(Cc.own, 2)} — a loss of **${v.fix(cg, 3)}**\n${where}\n$(p,q)$ is ${eq ? '**an equilibrium ✓**' : 'not an equilibrium'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'Nash’s existence theorem',
      credit: 'John F. Nash, Jr., 1950 (Kakutani proof); 1951 (Brouwer proof)',
      statement: String.raw`Every finite strategic game — finitely many players, each with finitely many actions, arbitrary payoffs — has at least one Nash equilibrium in mixed strategies. Equivalently, the product of simplices $\Delta=\prod_i\Delta(A_i)$ contains a profile $\sigma^*$ such that $U_i(\sigma^*)\ge U_i(\tau_i,\sigma^*_{-i})$ for every player $i$ and every mixed $\tau_i$. Nash's second proof defines the continuous map $f:\Delta\to\Delta$,
$$f(\sigma)_{i}(a)=\frac{\sigma_i(a)+g_i^a(\sigma)}{1+\sum_{b}g_i^b(\sigma)},\qquad g_i^a(\sigma)=\max\bigl\{0,\;U_i(a,\sigma_{-i})-U_i(\sigma)\bigr\},$$
whose fixed points are exactly the equilibria; Brouwer's theorem gives a fixed point. Existence is all that is asserted: the equilibrium need not be unique, and iterating $f$ need not converge to it.`,
      idea: String.raw`The gain $g_i^a$ measures how much better the pure action $a$ is than the player's current mixture; $f$ shifts weight toward actions that do better. A profile is fixed by $f$ iff all gains vanish: if some gain were positive, then by the linearity of $U_i$ (game-2.1) some action in the support does *worse* than average, loses weight and the point moves; so a fixed point has no profitable deviation (game-2.2). The map is continuous (gains are continuous) and $\Delta$ is compact and convex, so Brouwer (top-13.11, and its set-valued cousin in game-2.4) applies. Mixing is what supplies the convex, compact $\Delta$: with pure strategies only, Matching Pennies has no fixed point (game-1.6).`,
      caption: String.raw`Each triangle is a simplex of mixed strategies of a $3\times3$ game (corners are pure actions): row player on the left, column player on the right. Drag the two gold starting points; the slider runs $n$ steps of Nash's map and draws the orbit. Green rings are all equilibria, found independently by solving every support. Whenever the orbit settles, it is on a green ring, and the regret curve (log scale) falls to zero. Not every game obliges — try the Rock–Paper–Scissors-type game and the *best-reply jump* map, which cycles forever.`,
      deps: ['game-2.2', 'top-13.11'],
      refs: ['MSZ §5.3'],
      tags: ['existence', 'fixed point'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Nash_equilibrium#Proof_of_existence' },
      viz(v) {
        const rng0 = (s) => v.rng(s);
        const games = {
          a: () => randGame(rng0(18), 3, 3), b: () => randGame(rng0(47), 3, 3), c: () => randGame(rng0(27), 3, 3),
          rps: () => ({ A: [[0, -1, 1], [1, 0, -1], [-1, 1, 0]], B: [[0, 1, -1], [-1, 0, 1], [1, -1, 0]] }),
          coord: () => ({ A: [[3, 0, 0], [0, 2, 0], [0, 0, 1]], B: [[3, 0, 0], [0, 2, 0], [0, 0, 1]] }),
        };
        let G = games.a(), EQ = supportEnum(G.A, G.B);
        const opts = { x: [-0.1, 1.1], y: [-0.13, 1.0], equal: true, axes: false, height: 300, weight: 1 };
        const SX = v.stage({ ...opts, title: 'row player’s mixed strategy' }), SY = v.stage({ ...opts, title: 'column player’s mixed strategy' });
        const SR = v.stage({ x: [0, 300], y: [1e-6, 12], ylog: true, axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'iteration n', ylabel: 'regret', title: 'distance from equilibrium' });
        const hx = SX.handle(0.5, 0.55, { color: 'gold', label: 'start', constrain: triClamp, r: 8 });
        const hy = SY.handle(0.55, 0.2, { color: 'gold', label: 'start', constrain: triClamp, r: 8 });
        const sel = v.select('game', [{ value: 'a', label: 'random A' }, { value: 'b', label: 'random B' }, { value: 'c', label: 'random C' }, { value: 'rps', label: 'Rock–Paper–Scissors' }, { value: 'coord', label: '3-way coordination' }], 'a', { onChange: (k) => { G = games[k](); EQ = supportEnum(G.A, G.B); } });
        const map = v.select('map', [{ value: 'nash', label: 'Nash’s map' }, { value: 'br', label: 'best-reply jump' }], 'nash');
        const N = v.slider('iterations $n$', 0, 300, 60, { int: true });
        v.button('Start at an equilibrium', () => { const e = EQ.find((q) => q.x.filter((t) => t > 1e-9).length > 1) || EQ[0]; if (e) { const a = triPt(e.x), b = triPt(e.y); hx.set(a[0], a[1]); hy.set(b[0], b[1]); } });
        const step = (x, y) => {
          const { A, B } = G, u = expU(A, B, x, y), ra = rowPay(A, y), cb = colPay(B, x);
          if (map.value === 'br') {
            const mx = Math.max(...ra), my = Math.max(...cb);
            const bx = ra.map((t) => (t > mx - 1e-12 ? 1 : 0)), by = cb.map((t) => (t > my - 1e-12 ? 1 : 0));
            const sx = bx.reduce((a, b) => a + b), sy = by.reduce((a, b) => a + b);
            return [bx.map((t) => t / sx), by.map((t) => t / sy)];
          }
          const gx = ra.map((t) => Math.max(0, t - u[0])), gy = cb.map((t) => Math.max(0, t - u[1])), sgx = gx.reduce((a, b) => a + b), sgy = gy.reduce((a, b) => a + b);
          return [x.map((t, i) => (t + gx[i]) / (1 + sgx)), y.map((t, j) => (t + gy[j]) / (1 + sgy))];
        };
        let st = null;
        v.render(() => {
          let x = triBary(hx.x, hx.y).map((t) => Math.max(0, t)), y = triBary(hy.x, hy.y).map((t) => Math.max(0, t));
          const sx = x.reduce((a, b) => a + b), sy = y.reduce((a, b) => a + b); x = x.map((t) => t / sx); y = y.map((t) => t / sy);
          const px = [triPt(x)], py = [triPt(y)], rg = [regret(G.A, G.B, x, y)];
          for (let n = 0; n < 300; n++) { [x, y] = step(x, y); if (n < N.value) { px.push(triPt(x)); py.push(triPt(y)); } rg.push(regret(G.A, G.B, x, y)); }
          // x, y are now the 300th iterate; recompute the n-th iterate
          let cx = triBary(hx.x, hx.y).map((t) => Math.max(0, t)), cy = triBary(hy.x, hy.y).map((t) => Math.max(0, t));
          { const a = cx.reduce((s, t) => s + t), b = cy.reduce((s, t) => s + t); cx = cx.map((t) => t / a); cy = cy.map((t) => t / b); }
          for (let n = 0; n < N.value; n++) [cx, cy] = step(cx, cy);
          drawTriangle(SX, v, { labels: ['T', 'M', 'B'], labelColor: C1 }); drawTriangle(SY, v, { labels: ['L', 'C', 'R'], labelColor: C2 });
          EQ.forEach((e) => { const a = triPt(e.x), b = triPt(e.y); SX.dot(a[0], a[1], { r: 11, hollow: true, color: 'green', width: 2.5 }); SY.dot(b[0], b[1], { r: 11, hollow: true, color: 'green', width: 2.5 }); });
          SX.path(px, { color: C1, width: 1.5, alpha: 0.7 }); SY.path(py, { color: C2, width: 1.5, alpha: 0.7 });
          SX.dots(px.slice(1, -1), { r: 2, color: C1 }); SY.dots(py.slice(1, -1), { r: 2, color: C2 });
          const ex = triPt(cx), ey = triPt(cy);
          SX.dot(ex[0], ex[1], { r: 6, color: C1 }); SY.dot(ey[0], ey[1], { r: 6, color: C2 });
          SR.path(rg.map((r, n) => [n, Math.max(r, 1e-6)]), { color: 'accent', width: 2 });
          SR.vline(N.value, { color: 'gold', width: 1.5, dash: true });
          const cur = regret(G.A, G.B, cx, cy), [fx, fy] = step(cx, cy);
          const moved = Math.hypot(...fx.map((t, i) => t - cx[i]), ...fy.map((t, j) => t - cy[j]));
          st = { cx, cy, cur, moved };
        });
        v.legend([[C1, 'row orbit'], [C2, 'column orbit'], ['green', 'Nash equilibria (all supports solved)', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const f = (a) => `(${a.map((t) => v.fix(t, 2)).join(', ')})`;
          const mixedCount = EQ.length;
          return `$n=${N.value}$: row ${f(st.cx)}, column ${f(st.cy)} · regret ${st.cur < 1e-9 ? '**0**' : '$' + v.sci(st.cur, 2) + '$'} · $\\lVert f(\\sigma)-\\sigma\\rVert=${v.fix(st.moved, 4)}$\nEnumerating supports finds **${mixedCount}** equilibri${mixedCount === 1 ? 'um' : 'a'}${mixedCount % 2 ? ' (odd, as for a generic game)' : ' (even: this game has ties, so it is not generic)'} — Nash: never zero ✓${map.value === 'br' ? ' · the pure jump need not settle: it has no continuity, and Brouwer does not apply to it' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Kakutani’s fixed-point theorem and best-response correspondences',
      credit: 'Shizuo Kakutani, 1941',
      statement: String.raw`Let $K\subset\R^d$ be nonempty, compact and convex, and let $\Phi$ assign to every $x\in K$ a **nonempty convex** subset $\Phi(x)\subseteq K$, in such a way that the graph $\{(x,y):y\in\Phi(x)\}$ is **closed**. Then $\Phi$ has a fixed point: some $x^*$ with $x^*\in\Phi(x^*)$. For a finite game, take $K=\prod_i\Delta(A_i)$ and let $\Phi(\sigma)=\prod_i\mathrm{BR}_i(\sigma_{-i})$ be the correspondence of mixed best replies. It has nonempty values (a continuous function on a compact set attains its maximum), convex values (the set of maximisers of a linear function on a simplex is a face), and a closed graph (payoffs are continuous), so it has a fixed point — and a fixed point of $\Phi$ is exactly a mixed Nash equilibrium (game-2.3). When $\Phi$ is single-valued the theorem is Brouwer's.`,
      idea: String.raw`Brouwer's theorem (top-13.11) needs a *function*; best replies are not functions, since at a point of indifference every mixture of the tied actions is a best reply. Kakutani's idea is to replace the correspondence by continuous approximating functions — average the values over a fine triangulation, using convexity to stay inside $K$ — and pass to a limit of their Brouwer fixed points using closedness of the graph. The pictures below make each hypothesis visible in a symmetric $2\times2$ game, where a fixed point is an intersection of the graph with the diagonal: closedness is what makes the graph run *vertically through* the jump rather than leap over it, and convexity fills in the segment.`,
      caption: String.raw`A symmetric $2\times2$ game: if both choose the first action with probability $x$ (the opponent's), the graph shows the set of best replies $y$ of one player; green points are where the graph meets the diagonal $y=x$, i.e. symmetric equilibria. Edit the four payoffs or load a game. Then **break a hypothesis**: *pure replies only* deletes the mixtures from the value at the indifference point (values no longer convex), and *one reply at the jump* keeps a single reply there (graph no longer closed). In Chicken either break destroys the only symmetric equilibrium.`,
      deps: ['top-13.11', 'game-2.2'],
      refs: ['MSZ §24.1', 'MSZ §5.4'],
      tags: ['fixed point', 'best reply'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kakutani_fixed-point_theorem' },
      viz(v) {
        const S = v.stage({ x: [-0.04, 1.04], y: [-0.05, 1.05], axes: 'box', gutter: true, height: 380, xlabel: 'opponent’s probability x of the first action', ylabel: 'my best replies y', title: 'the best-reply correspondence' });
        const sa = v.slider('$a=u(T,T)$', -3, 6, 2, { int: true }), sb = v.slider('$b=u(T,B)$', -3, 6, 1, { int: true });
        const sc = v.slider('$c=u(B,T)$', -3, 6, 3, { int: true }), sd = v.slider('$d=u(B,B)$', -3, 6, 0, { int: true });
        const pre = { chicken: [2, 1, 3, 0], stag: [4, 0, 3, 3], pd: [3, 0, 5, 1], coord: [2, 0, 0, 1] };
        v.select('load', [{ value: 'chicken', label: 'Chicken' }, { value: 'stag', label: 'Stag Hunt' }, { value: 'pd', label: 'Prisoner’s Dilemma' }, { value: 'coord', label: 'Coordination' }], 'chicken', { onChange: (k) => { [sa, sb, sc, sd].forEach((s, i) => s.set(pre[k][i])); } });
        const mode = v.select('values of the correspondence', [{ value: 'full', label: 'all best replies' }, { value: 'pure', label: 'pure replies only' }, { value: 'jump', label: 'one reply at the jump' }], 'full');
        let st = null;
        v.render(() => {
          const D = (x) => x * (sa.value - sc.value) + (1 - x) * (sb.value - sd.value), t = indiff(D);
          const D0 = D(0), D1 = D(1), zero = Math.abs(D0) < 1e-12 && Math.abs(D1) < 1e-12;
          const cuts = t != null ? [0, t, 1] : [0, 1];
          const hs = [], vs = [], rects = [], pts = [];
          // pieces on the open intervals between cuts, plus the value set at each cut where D = 0
          for (let k = 0; k + 1 < cuts.length; k++) {
            const lo = cuts[k], hi = cuts[k + 1], dm = D((lo + hi) / 2);
            if (zero) rects.push([lo, hi]); else hs.push([lo, hi, dm > 0 ? 1 : 0]);
          }
          const zeros = zero ? [] : [t != null ? t : Math.abs(D0) < 1e-12 ? 0 : Math.abs(D1) < 1e-12 ? 1 : null].filter((z) => z != null);
          for (const z of zeros) { if (mode.value === 'full') vs.push([z, 0, 1]); else if (mode.value === 'pure') { pts.push([z, 0], [z, 1]); } else pts.push([z, 0]); }
          // fixed points: intersections with y = x
          const fp = [];
          for (const [lo, hi, y] of hs) { const openL = zeros.some((z) => Math.abs(z - lo) < 1e-12), openR = zeros.some((z) => Math.abs(z - hi) < 1e-12); if (y >= lo - 1e-12 && y <= hi + 1e-12 && !(openL && Math.abs(y - lo) < 1e-12) && !(openR && Math.abs(y - hi) < 1e-12)) fp.push(y); }
          for (const [x, y0, y1] of vs) if (x >= y0 - 1e-12 && x <= y1 + 1e-12) fp.push(x);
          for (const [x, y] of pts) if (Math.abs(x - y) < 1e-12) fp.push(x);
          if (zero) fp.push(...[0, 0.5, 1]);
          S.line(0, 0, 1, 1, { color: 'muted', dash: true, width: 1.5 });
          S.text('y = x', 0.2, 0.26, { color: 'muted', size: 11.5 });
          for (const [lo, hi] of rects) S.rect(lo, 0, hi, 1, { fill: C1, fillAlpha: 0.2, stroke: false });
          for (const [lo, hi, y] of hs) S.line(lo, y, hi, y, { color: C1, width: 5, alpha: 0.85 });
          for (const [x, y0, y1] of vs) S.line(x, y0, x, y1, { color: C1, width: 5, alpha: 0.85 });
          for (const [x, y] of pts) S.dot(x, y, { r: 6.5, color: C1 });
          if (t != null) {
            if (mode.value === 'pure') { S.line(t, 0.05, t, 0.95, { color: 'red', dash: [3, 5], width: 2.5 }); S.text('mixtures removed', t, 0.5, { dx: 10, size: 11.5, color: 'red', align: 'left', weight: 700 }); }
            if (mode.value === 'jump') { S.dot(t, 1, { r: 7, hollow: true, color: 'red', width: 2 }); S.text('open end: the limit is missing', t, 1, { dx: 12, dy: 14, size: 11.5, color: 'red', align: 'left', weight: 700 }); }
          }
          [...new Set(fp.map((z) => Math.round(z * 1e6) / 1e6))].forEach((z) => S.dot(z, z, { r: 9, color: 'green' }));
          st = { t, fp: [...new Set(fp.map((z) => Math.round(z * 1e6) / 1e6))], zero };
        });
        v.legend([[C1, 'best replies $\\Phi(x)$'], ['green', 'fixed points $x\\in\\Phi(x)$', { dot: true }], ['red', 'value missing at the jump', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { t, fp, zero } = st, m = mode.value;
          const hyp = m === 'full' ? 'nonempty ✓ · convex ✓ · closed graph ✓' : m === 'pure' ? 'nonempty ✓ · **convex ✗** (the value at the jump is $\\{0,1\\}$) · closed graph ✓' : 'nonempty ✓ · convex ✓ · **closed graph ✗** (limits from the left and right are missing)';
          const where = zero ? 'every action is a best reply everywhere: the whole diagonal is fixed' : t != null ? `the reply switches at $x=${v.fix(t, 3)}$, the indifference point` : 'one action is a best reply for every $x$ (strictly dominant)';
          return `Hypotheses of Kakutani: ${hyp}\n${where} · **${fp.length}** fixed point${fp.length === 1 ? '' : 's'}${fp.length ? ': $x=' + fp.map((z) => v.fix(z, 3)).join(',\;') + '$' : ' — the conclusion fails'}${m !== 'full' && fp.length === 0 ? ' ✗' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Algorithm',
      name: 'Lemke–Howson algorithm',
      credit: 'Carlton E. Lemke & J. T. Howson, Jr., 1964',
      statement: String.raw`Let $(A,B)$ be a nondegenerate two-player game with $m\times n$ payoff matrices, scaled so all entries are positive. Label the points of $P=\{x\in\R^m: x\ge0,\ B^{\!\top}x\le\mathbf 1\}$ by $i$ when $x_i=0$ and by $m+j$ when the $j$-th inequality is tight, and those of $Q=\{y\in\R^n: y\ge0,\ Ay\le\mathbf 1\}$ by $m+j$ when $y_j=0$ and by $i$ when the $i$-th inequality is tight. A pair of vertices $(x,y)\ne(0,0)$ that together carry **all** the labels $1,\dots,m+n$ is, after normalising $x$ and $y$ to sum to one, a Nash equilibrium, and conversely. **Lemke–Howson**: starting from $(0,0)$, drop an arbitrary label $k$ — move along the edge of $P$ (or $Q$) that releases it — and then repeatedly pivot in the *other* polytope on the label that was just duplicated. The path of vertex pairs cannot revisit a pair and must end at a completely labelled pair other than $(0,0)$: **an equilibrium is found**. This gives a constructive proof that equilibria exist and that their number is odd.`,
      idea: String.raw`Every vertex pair has at most one duplicated label once label $k$ is allowed to be missing ("almost completely labelled"), so each pair has exactly two neighbours along the path — except $(0,0)$ and the equilibria, which have one. Following the path, a finite graph all of whose vertices have degree two except for the endpoints, from the endpoint $(0,0)$ must therefore end at another endpoint, an equilibrium (the parity argument is the discrete shadow of Brouwer's theorem, top-13.11). It works by the indifference principle (game-2.2): a label shared by two actions means the opponent is indifferent between them. The path is not a descent of any potential, so there is no guarantee that it is short (game-2.6).

The parity step uses the finite almost-completely-labelled graph described in the proof. Its internal vertices have degree two and its path endpoints degree one. The handshake lemma (graph 1.2.1) forces an even number of odd-degree vertices in each finite component. The component containing the artificial endpoint therefore has another endpoint; following its degree-two path cannot enter a cycle from an endpoint. This is the endpoint argument under the stated nondegeneracy assumptions, not a polynomial bound on the number of pivots or a guarantee for an unmodified degenerate implementation.`,
      caption: String.raw`The triangles are the mixed-strategy simplices of a $3\times3$ game; the shading shows the opponent's best reply (the region where each column — or row — is best), and the lines separating regions are where two actions tie. Pick a label to drop and move the step slider: blue is the path of $x$ (row player), orange the path of $y$; at each step one player's mixture moves along an edge of its subdivision. When the path stops at a pair that carries all six labels, the green dots on both triangles agree: that is an equilibrium. Drop a different label and, in a game with several equilibria, you may arrive at a different one.`,
      deps: ['game-2.2', 'graph-1.2.1'],
      refs: ['MSZ §5.2'],
      tags: ['algorithm', 'path following'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lemke%E2%80%93Howson_algorithm' },
      viz(v) {
        const mk = {
          a: () => randGame(v.rng(18), 3, 3), b: () => randGame(v.rng(47), 3, 3), c: () => randGame(v.rng(27), 3, 3),
          coord: () => ({ A: [[3.1, 0.1, 0.3], [0.2, 2.2, 0.1], [0.1, 0.4, 1.3]], B: [[2.9, 0.2, 0.1], [0.3, 2.1, 0.4], [0.2, 0.1, 1.1]] }),
        };
        let G = mk.a(), EQ = supportEnum(G.A, G.B), gk = 'a', LH = null, reg = null;
        const names = ['T', 'M', 'B', 'L', 'C', 'R'];
        const compute = () => { LH = lemkeHowson(G.A, G.B, lab.value); };
        const opts = { x: [-0.12, 1.12], y: [-0.14, 1.0], equal: true, axes: false, height: 320, weight: 1 };
        const SX = v.stage({ ...opts, title: 'row player’s simplex: column replies' }), SY = v.stage({ ...opts, title: 'column player’s simplex: row replies' });
        v.select('game', [{ value: 'a', label: 'random A' }, { value: 'b', label: 'random B' }, { value: 'c', label: 'random C' }, { value: 'coord', label: '3-way coordination' }], 'a', { onChange: (k) => { gk = k; G = mk[k](); EQ = supportEnum(G.A, G.B); compute(); } });
        const lab = v.select('drop label', names.map((t, i) => ({ value: i, label: t })), 3, { onChange: () => compute() });
        const stp = v.slider('pivot step', 0, 40, 40, { int: true });
        compute();
        const cols = [C2, 'teal', 'pink'], rowc = [C1, 'purple', 'gold'];
        const centroid = (f) => { const sum = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let a = 0; a <= 60; a++) for (let b = 0; a + b <= 60; b++) { const bc = [a / 60, b / 60, 1 - (a + b) / 60], k = f(bc); sum[k][0] += triPt(bc)[0]; sum[k][1] += triPt(bc)[1]; sum[k][2]++; } return sum.map((s) => (s[2] ? [s[0] / s[2], s[1] / s[2]] : null)); };
        v.render(() => {
          const path = LH.path, K = Math.min(stp.value, path.length - 1);
          const colBest = (bc) => colPay(G.B, bc).reduce((bi, t, j, arr) => (t > arr[bi] ? j : bi), 0);
          const rowBest = (bc) => rowPay(G.A, bc).reduce((bi, t, j, arr) => (t > arr[bi] ? j : bi), 0);
          const paint = (S, best, palette) => S.raster((x, y) => { const bc = triBary(x, y); if (bc.some((t) => t < 0)) return null; const c = v.rgb(palette[best(bc)]); return [c[0], c[1], c[2], 0.26]; }, { res: 3, key: `${gk}|${best === colBest}` });
          paint(SX, colBest, cols); paint(SY, rowBest, rowc);
          drawTriangle(SX, v, { labels: ['T', 'M', 'B'], labelColor: C1 }); drawTriangle(SY, v, { labels: ['L', 'C', 'R'], labelColor: C2 });
          centroid(colBest).forEach((c, j) => c && SX.text(`${names[3 + j]} best`, c[0], c[1], { align: 'center', size: 11.5, weight: 700, color: cols[j] }));
          centroid(rowBest).forEach((c, i) => c && SY.text(`${names[i]} best`, c[0], c[1], { align: 'center', size: 11.5, weight: 700, color: rowc[i] }));
          EQ.forEach((e) => { const a = triPt(e.x), b = triPt(e.y); SX.dot(a[0], a[1], { r: 11, hollow: true, color: 'green', width: 2.5 }); SY.dot(b[0], b[1], { r: 11, hollow: true, color: 'green', width: 2.5 }); });
          const norm = (z) => { const s = z.reduce((a, b) => a + b, 0); return s > 1e-9 ? triPt(z.map((t) => t / s)) : null; };
          const px = path.map((s) => norm(s.x)), py = path.map((s) => norm(s.y));
          const draw = (S, P, col) => {
            S.path(P.slice(0, K + 1), { color: col, width: 3 });
            P.slice(0, K + 1).forEach((q, k) => { if (q && (k === 0 || !P[k - 1] || Math.hypot(q[0] - P[k - 1][0], q[1] - P[k - 1][1]) > 1e-9)) { S.dot(q[0], q[1], { r: 4, color: col }); } });
            P.slice(0, K + 1).forEach((q, k) => { if (q && k > 0 && (!P[k - 1] || Math.hypot(q[0] - P[k - 1][0], q[1] - P[k - 1][1]) > 1e-9)) S.text(String(k), q[0], q[1], { dx: 8, dy: -8, size: 10.5, weight: 700, color: col }); });
          };
          draw(SX, px, C1); draw(SY, py, C2);
          const cur = path[K];
          const a = norm(cur.x), b = norm(cur.y);
          if (a) SX.dot(a[0], a[1], { r: 7, color: 'gold' }); if (b) SY.dot(b[0], b[1], { r: 7, color: 'gold' });
          reg = { K, cur, done: K === path.length - 1 && LH.ok };
        });
        v.legend([[C1, 'path of the row mixture $x$'], [C2, 'path of the column mixture $y$'], ['gold', 'current vertex pair', { dot: true }], ['green', 'equilibria', { dot: true }]]);
        v.readout(() => {
          if (!reg) return '';
          const { K, cur, done } = reg, f = (a) => (a.reduce((s, t) => s + t, 0) < 1e-9 ? '0' : `(${a.map((t) => v.fix(t / a.reduce((s, z) => s + z, 0), 2)).join(', ')})`);
          const move = cur.enter == null ? 'start at the artificial equilibrium $(0,0)$, which has every label' : `step ${K}: label **${names[cur.enter]}** enters, label **${names[cur.leave]}** leaves${cur.leave === lab.value ? ' — the dropped label is regained' : ` — **${names[cur.leave]}** is now duplicated: pivot on it in the other polytope`}`;
          const end = LH.ok ? `path length ${LH.steps} pivots` : 'the path did not close (degenerate game)';
          const verdict = done ? `\n**Completely labelled:** $x=${f(cur.x)}$, $y=${f(cur.y)}$ is a Nash equilibrium (regret $${v.sci(Math.max(regret(G.A, G.B, LH.x, LH.y), 1e-16), 1)}$ ✓); the game has ${EQ.length} equilibri${EQ.length === 1 ? 'um' : 'a'} in all` : '';
          return `Dropped label **${names[lab.value]}** · ${move} · ${end}${verdict}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Computing a Nash equilibrium is PPAD-complete',
      credit: 'Daskalakis, Goldberg & Papadimitriou, 2006 (four players; three players: Daskalakis & Papadimitriou and Chen & Deng, 2005–06); Chen & Deng, 2006 (two players)',
      statement: String.raw`**PPAD** is the class of total search problems reducible to END-OF-LINE: given a succinct (circuit) description of a directed graph in which every vertex has at most one predecessor and one successor, and a source $0^n$ with no predecessor, find some other end of a path — a sink, or another source. The problem NASH — given a finite game (even a two-player one), find an $\epsilon$-approximate Nash equilibrium for suitably small $\epsilon$ — is **PPAD-complete**: it lies in PPAD (Nash's theorem provides the totality, and the Lemke–Howson path of game-2.5 is such a line), and every problem in PPAD reduces to it. Hence a polynomial-time algorithm for equilibria would solve every PPAD problem, which is not believed possible. The theorem does not say equilibria are NP-hard to *find* (they always exist); it says the totality argument itself is as hard as the whole class.`,
      idea: String.raw`Membership: the lines of the Lemke–Howson algorithm are exactly END-OF-LINE instances over pairs of polytope vertices, with the successor function computed by one pivot (game-2.5). Hardness: Daskalakis, Goldberg and Papadimitriou built game gadgets (arithmetic circuits realised by equilibrium conditions) that simulate the Brouwer fixed-point problem on a discretised cube, itself PPAD-complete by Sperner-type arguments; Chen and Deng pushed the reduction down to two players. The takeaway for the picture: a path can be exponentially long though each step is cheap, and no known shortcut exists that sees where a path ends without walking it (algo-14.2 for the sibling notions NP and completeness).`,
      caption: String.raw`**Left:** a toy END-OF-LINE instance on the $2^n$ vertices (bit strings) of an $n$-bit vertex set, laid out on a circle in scrambled order. The successor rule is one cheap bit operation per vertex — yet the line from the source visits all $2^n$ vertices. Drag the slider to walk it; switch off *reveal* to see only the ground already covered. **Right:** the length of the Lemke–Howson path measured on random $n\times n$ games (mean and maximum over 60 games, one dropped label), against the $2^n-1$ steps of the worst-case line. Random games are easy; the hard families that make the algorithm exponential are specially constructed.`,
      deps: ['game-2.5', 'algo-14.2'],
      refs: ['MSZ §5.2'],
      tags: ['complexity', 'PPAD'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/PPAD_(complexity)' },
      viz(v) {
        const SL = v.stage({ x: [-1.3, 1.3], y: [-1.25, 1.25], equal: true, axes: false, height: 360, weight: 1, title: 'a line hidden in $2^n$ vertices' });
        const SR = v.stage({ x: [2, 10], y: [1, 2000], ylog: true, axes: 'box', gutter: true, height: 360, weight: 1.1, xlabel: 'size n (n × n game; n-bit vertex names)', ylabel: 'number of steps', title: 'path lengths' });
        const nb = v.slider('bits $n$', 2, 6, 4, { int: true });
        const walk = v.slider('steps walked $t$', 0, 63, 12, { int: true });
        const reveal = v.toggle('reveal the whole line', false);
        // measured Lemke-Howson path lengths on random n x n games
        const stats = (() => {
          const out = [];
          for (let n = 2; n <= 10; n++) {
            const r = v.rng(100 + n); let sum = 0, mx = 0, ok = 0;
            for (let t = 0; t < 60; t++) { const G = randGame(r, n, n), lh = lemkeHowson(G.A, G.B, r.int(0, 2 * n - 1)); if (lh.ok) { sum += lh.steps; mx = Math.max(mx, lh.steps); ok++; } }
            out.push({ n, mean: sum / Math.max(ok, 1), max: mx });
          }
          return out;
        })();
        let st = null, permN = -1, perm = [];
        v.render(() => {
          const n = nb.value, L = 2 ** n - 1;
          if (permN !== n) { perm = v.rng(7 + n).shuffle(Array.from({ length: 2 ** n }, (_, i) => i)); permN = n; }
          const t = Math.min(walk.value, L);
          const g = (k) => k ^ (k >> 1), pos = (k) => { const a = (2 * Math.PI * perm[g(k)]) / 2 ** n + 0.3; return [Math.cos(a), Math.sin(a)]; };
          const big = 2 ** n <= 32;
          for (let k = 0; k <= L; k++) { const q = pos(k); if (k < L && (reveal.value || k < t)) { const q2 = pos(k + 1); S_line(SL, q, q2, k < t ? C1 : 'faint', k < t ? 2.4 : 1.2, k < t ? 0.9 : 0.5); } }
          for (let k = 0; k <= L; k++) {
            const q = pos(k), seen = k <= t;
            SL.dot(q[0], q[1], { r: seen ? 4.5 : 3, color: seen ? C1 : 'faint', alpha: seen || reveal.value ? 1 : 0.55 });
            if (big && (seen || reveal.value)) SL.text(g(k).toString(2).padStart(n, '0'), q[0] * 1.14, q[1] * 1.14, { align: 'center', baseline: 'middle', size: 9.5, color: seen ? 'ink' : 'muted' });
          }
          const s0 = pos(0), sk = pos(L), w = pos(t);
          SL.dot(s0[0], s0[1], { r: 8, color: 'green' }); SL.text('source', s0[0], s0[1], { dx: 0, dy: -16, size: 11.5, weight: 700, color: 'green', align: 'center' });
          if (reveal.value || t === L) { SL.dot(sk[0], sk[1], { r: 8, color: 'red' }); SL.text('sink', sk[0], sk[1], { dy: -16, size: 11.5, weight: 700, color: 'red', align: 'center' }); }
          SL.dot(w[0], w[1], { r: 9, color: 'gold' });
          // right: measurements
          SR.fn((x) => 2 ** x - 1, { domain: [2, 10], color: 'red', width: 2, dash: true });
          SR.path(stats.map((s) => [s.n, Math.max(s.mean, 1)]), { color: 'accent', width: 2.5 });
          SR.path(stats.map((s) => [s.n, Math.max(s.max, 1)]), { color: 'blue', width: 1.5, dash: true });
          stats.forEach((s) => { SR.dot(s.n, Math.max(s.mean, 1), { r: 4, color: 'accent' }); });
          SR.vline(n, { color: 'gold', dash: true, width: 1.5 });
          SR.text('$2^n-1$', 8.6, 640, { color: 'red', size: 12, weight: 700, align: 'right' });
          st = { n, L, t, cur: stats.find((s) => s.n === n) };
        });
        function S_line(S, a, b, color, width, alpha) { S.line(a[0], a[1], b[0], b[1], { color, width, alpha }); }
        v.legend([[C1, 'part of the line already walked'], ['accent', 'Lemke–Howson pivots, mean (random games)'], ['blue', 'maximum of 60 games', { dash: true }], ['red', '$2^n-1$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { n, L, t, cur } = st;
          return `$n=${n}$: the line has $2^n-1=${L}$ steps; after $t=${t}$ the walker has learned nothing about where it ends, and each step costs only $O(n)$ bit operations (checking a step is easy)\nLemke–Howson on random $n\\times n$ games: mean **${v.fix(cur.mean, 1)}** pivots, max ${cur.max} — against $2^n-1=${L}$ for the worst-case line; PPAD-hardness says such lines can be forced by the game, not that random games are hard`;
        });
      },
    },
  ],
};
