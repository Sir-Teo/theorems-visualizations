// Game Theory & Social Choice — Chapter 3: Zero-sum games and the minimax theorem
import {
  C1, C2, nm, idx, TRI, triPt, triBary, triClamp, drawTriangle,
  lpMax, solveZS, zsPure, guarantee, ceiling, ZS, copyM, matWindow, matCell, drawMat,
} from './ch03.shared.js';

const clamp = (t, a, b) => Math.min(b, Math.max(a, t));
const tx = (a) => String(Math.round(a * 1000) / 1000).replace('-', '\\!-');
const sg = (a) => (a < 0 ? '−' : '') + Math.abs(Math.round(a * 1000) / 1000);

export default {
  collection: 'game',
  chapter: 3,
  title: 'Zero-sum games and the minimax theorem',
  summary: String.raw`When one player's gain is the other's loss, playing safe and playing optimally coincide. In pure strategies the best a player can guarantee, the maxmin, can fall short of what the opponent concedes, the minmax; a saddle point exists exactly when they meet. Von Neumann's minimax theorem says that once both players randomize the gap always closes: every finite zero-sum game has a value. It follows from a separating hyperplane in the plane of payoff vectors, equivalently from linear-programming duality, and small games are solved with a picture of lines. The value can also be learned: fictitious play and multiplicative weights, two simple adaptive rules, converge to it. The same duality is behind Colonel Blotto's mixed allocations, Yao's principle for randomized algorithms (a cross-listed result), and Blackwell's extension to vector payoffs.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Zero-sum games: maxmin and minmax values',
      credit: 'von Neumann, 1928',
      statement: String.raw`A **two-player zero-sum game** in strategic form is a matrix $A=(a_{ij})$, $i\in\{1,\dots,m\}$, $j\in\{1,\dots,n\}$: if the row player (maximiser) chooses $i$ and the column player (minimiser) chooses $j$, the column player pays the row player $a_{ij}$, so $u_1=a_{ij}$ and $u_2=-a_{ij}$ (game-1.1). Choosing row $i$ guarantees at least its **row minimum** $\min_j a_{ij}$, whatever the opponent does. The best guarantee over pure rows is the **maxmin value**
$$\underline v=\max_i\min_j a_{ij}.$$
Likewise column $j$ concedes at most its column maximum $\max_i a_{ij}$, and the best such ceiling is the **minmax value**
$$\overline v=\min_j\max_i a_{ij}.$$
These are the security levels of the two players: the row player can ensure at least $\underline v$, the column player can ensure the row player gets at most $\overline v$. A row attaining $\underline v$ is a **maxmin strategy**, a column attaining $\overline v$ a **minmax strategy**.`,
      idea: String.raw`The definition asks each player to be pessimistic: assume the opponent will find the reply that hurts most, and choose the action that makes this worst case as good as possible. Because the game is zero-sum, one player's worst case is exactly the other's best reply, so there is no conflict between caution and rationality. The only question is whether the two security levels $\underline v$ and $\overline v$ coincide, and that is the content of game-3.2 (they need not, but $\underline v\le\overline v$ always) and of the minimax theorem game-3.3 (they do once mixing is allowed).`,
      caption: String.raw`Left: the payoff matrix; blue shades are good for the row player, orange for the column player. Click a cell and use the slider to edit it. Blue numbers on the right are row minima, orange numbers underneath column maxima; the largest row minimum and the smallest column maximum are green. Right: on the payoff axis, $\underline v$ (blue) never lies to the right of $\overline v$ (orange). The green dot is the value in mixed strategies (computed by linear programming): it always lies in the gap between them. Try Matching Pennies, where the gap is widest, then the saddle-point game, where it closes.`,
      deps: ['game-1.1'],
      refs: ['Osborne §11.1', 'MSZ §4.12'],
      tags: ['zero-sum', 'maxmin', 'security level'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Zero-sum_game' },
      viz(v) {
        const keys = ['saddle', 'pennies', 'rps', 'wide', 'skew'];
        let A = copyM(ZS.saddle.A), sel = [0, 0];
        const M = v.stage({ x: [-1.5, 5.4], y: [-1.7, 3.7], equal: true, axes: false, height: 340, weight: 1.15, title: 'the payoff matrix (to the row player)' });
        const L = v.stage({ x: [-4, 4], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 0.85, xlabel: 'payoff to the row player', yticks: [], title: 'what each side can guarantee' });
        const ed = v.slider('gold entry', -9, 9, A[0][0], { int: true, onChange: (x) => { A[sel[0]][sel[1]] = x; } });
        v.select('game', keys.map((k) => ({ value: k, label: ZS[k].label })), 'saddle', { onChange: (k) => { A = copyM(ZS[k].A); sel = [0, 0]; ed.set(A[0][0]); } });
        M.onClick((x, y) => { const c = matCell(x, y, A.length, A[0].length); if (c) { sel = c; ed.set(A[c[0]][c[1]]); v.invalidate(); } });
        let info = null;
        v.render(() => {
          const m = A.length, n = A[0].length, P = zsPure(A), S = solveZS(A);
          const w = matWindow(m, n); M.setView(w.x, w.y);
          drawMat(M, A, {
            rowMin: P.rowMin, colMax: P.colMax, sel, rowMinHi: (i) => P.rowMin[i] === P.maxmin, colMaxHi: (j) => P.colMax[j] === P.minmax,
            mark: (i, j) => (P.saddles.some(([a, b]) => a === i && b === j) ? 'green' : null),
          });
          const R = Math.max(3, Math.ceil(Math.max(...A.flat().map(Math.abs))) + 1);
          L.setView([-R, R], [0, 1]);
          L.line(-R, 0.5, R, 0.5, { color: 'faint', width: 1.5 });
          L.rect(P.maxmin, 0.4, P.minmax, 0.6, { fill: 'purple', fillAlpha: 0.22, stroke: false });
          L.dot(P.maxmin, 0.5, { r: 8, color: 'blue' }); L.text('maxmin', P.maxmin, 0.72, { align: 'center', size: 12, weight: 700, color: 'blue' });
          L.dot(P.minmax, 0.5, { r: 8, color: 'orange' }); L.text('minmax', P.minmax, 0.28, { align: 'center', size: 12, weight: 700, color: 'orange' });
          L.dot(S.v, 0.5, { r: 5, color: 'green' }); L.text('value v', S.v, 0.88, { align: 'center', size: 12, weight: 700, color: 'green' });
          info = { P, S };
        });
        v.readout(() => {
          if (!info) return '';
          const { P, S } = info;
          const head = `$\\underline v=\\max_i\\min_j a_{ij}=${tx(P.maxmin)}$, $\\overline v=\\min_j\\max_i a_{ij}=${tx(P.minmax)}$, gap $\\overline v-\\underline v=${tx(P.minmax - P.maxmin)}\\ge0$`;
          const tail = P.saddles.length ? `a saddle point exists: pure play already solves the game, value ${sg(P.maxmin)}` : `no pure saddle point; with mixed strategies (game-3.3) the value is $v=${tx(S.v)}$, inside the gap`;
          return `${head}\n${tail}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Saddle points: maxmin ≤ minmax, with equality at a saddle',
      statement: String.raw`For every real matrix $A$,
$$\max_i\min_j a_{ij}\;\le\;\min_j\max_i a_{ij}.$$
A **saddle point** is an entry $a_{i^*j^*}$ that is the minimum of its row and the maximum of its column. The following are equivalent: (a) $A$ has a saddle point $(i^*,j^*)$; (b) $\max_i\min_j a_{ij}=\min_j\max_i a_{ij}$; (c) $(i^*,j^*)$ is a pure Nash equilibrium of the game with payoffs $(a_{ij},-a_{ij})$ (game-1.3). In that case $a_{i^*j^*}$ is the common value, and **all saddle points have the same value** and are interchangeable: if $(i,j)$ and $(i',j')$ are saddle points, so are $(i,j')$ and $(i',j)$.`,
      idea: String.raw`For any row $i$ and column $j$, the entry is squeezed: $\min_{j'}a_{ij'}\le a_{ij}\le\max_{i'}a_{i'j}$. Taking the maximum over $i$ on the left and the minimum over $j$ on the right gives $\underline v\le\overline v$, since the middle term does not depend on the order of the choices. Equality at a saddle is a restatement: if $a_{i^*j^*}$ is its row's minimum and its column's maximum, then $\underline v\ge\min_j a_{i^*j}=a_{i^*j^*}=\max_i a_{ij^*}\ge\overline v$. A saddle entry is exactly a mutual best reply, i.e. a pure equilibrium (game-1.3), and the same squeeze shows that two saddles have equal value and can be recombined.`,
      caption: String.raw`The blue ticks are the row minima $r_i$ and the orange ticks the column maxima $c_j$; the squeeze says every blue tick lies at or left of every orange tick. Click a cell $(i,j)$: the gold chain shows $r_i\le a_{ij}\le c_j$ for that cell. Edit the gold entry with the slider and watch the ticks move: a saddle point (green outline in the matrix) appears exactly when the largest blue tick and the smallest orange tick coincide, and in "several saddles" every pair can be recombined. Matching Pennies has no saddle: blue stops short of orange.`,
      deps: ['game-3.1', 'game-1.3'],
      refs: ['MSZ §4.12', 'Osborne §11.4'],
      tags: ['saddle point', 'zero-sum', 'pure equilibrium'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Saddle_point#Game_theory' },
      viz(v) {
        const keys = ['twosad', 'saddle', 'pennies', 'rps', 'skew'];
        let A = copyM(ZS.twosad.A), sel = [1, 1];
        const M = v.stage({ x: [-1.5, 5.4], y: [-1.7, 3.7], equal: true, axes: false, height: 340, weight: 1, title: 'click a cell' });
        const N = v.stage({ x: [-4, 4], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'payoff to the row player', yticks: [], title: 'the squeeze  r_i ≤ a_ij ≤ c_j' });
        const ed = v.slider('gold entry', -9, 9, A[sel[0]][sel[1]], { int: true, onChange: (x) => { A[sel[0]][sel[1]] = x; } });
        v.select('game', keys.map((k) => ({ value: k, label: ZS[k].label })), 'twosad', { onChange: (k) => { A = copyM(ZS[k].A); sel = [Math.min(sel[0], A.length - 1), Math.min(sel[1], A[0].length - 1)]; ed.set(A[sel[0]][sel[1]]); } });
        M.onClick((x, y) => { const c = matCell(x, y, A.length, A[0].length); if (c) { sel = c; ed.set(A[c[0]][c[1]]); v.invalidate(); } });
        let info = null;
        v.render(() => {
          const m = A.length, n = A[0].length, P = zsPure(A);
          const w = matWindow(m, n); M.setView(w.x, w.y);
          drawMat(M, A, {
            rowMin: P.rowMin, colMax: P.colMax, sel, rowMinHi: (i) => P.rowMin[i] === P.maxmin, colMaxHi: (j) => P.colMax[j] === P.minmax,
            mark: (i, j) => (P.saddles.some(([a, b]) => a === i && b === j) ? 'green' : null),
          });
          const R = Math.max(3, Math.ceil(Math.max(...A.flat().map(Math.abs))) + 1);
          N.setView([-R, R], [0, 1]);
          N.line(-R, 0.5, R, 0.5, { color: 'faint', width: 1.5 });
          P.rowMin.forEach((r, i) => { N.line(r, 0.5, r, 0.74, { color: 'blue', width: 3 }); N.text(`r${i + 1}`, r, 0.78, { align: 'center', size: 11.5, weight: 700, color: 'blue' }); });
          P.colMax.forEach((c, j) => { N.line(c, 0.5, c, 0.26, { color: 'orange', width: 3 }); N.text(`c${j + 1}`, c, 0.2, { align: 'center', size: 11.5, weight: 700, color: 'orange' }); });
          const [i, j] = sel, r = P.rowMin[i], a = A[i][j], c = P.colMax[j];
          N.arrow(r, 0.5, a, 0.5, { color: 'gold', width: 2.5, head: 8 }); N.arrow(a, 0.5, c, 0.5, { color: 'gold', width: 2.5, head: 8 });
          N.dot(a, 0.5, { r: 7, color: 'gold' });
          const same = P.maxmin === P.minmax;
          N.vline(P.maxmin, { color: same ? 'green' : 'blue', alpha: 0.45, dash: true, width: 1.5 });
          N.vline(P.minmax, { color: same ? 'green' : 'orange', alpha: 0.45, dash: true, width: 1.5 });
          const sad = P.saddles, inter = sad.every(([a1, b1]) => sad.every(([a2, b2]) => sad.some(([a3, b3]) => a3 === a1 && b3 === b2)));
          info = { P, i, j, r, a, c, sad, inter };
        });
        v.readout(() => {
          if (!info) return '';
          const { P, i, j, r, a, c, sad, inter } = info;
          const l1 = `cell (${i + 1}, ${j + 1}): $r_${i + 1}=${tx(r)}\\;\\le\\;a_{${i + 1}${j + 1}}=${tx(a)}\\;\\le\\;c_${j + 1}=${tx(c)}$ ✓   $\\underline v=${tx(P.maxmin)}\\le\\overline v=${tx(P.minmax)}$`;
          const l2 = sad.length ? `${sad.length} saddle point${sad.length > 1 ? 's' : ''} (${sad.map(([x, y]) => `${x + 1},${y + 1}`).join('; ')}), all of value ${sg(P.maxmin)}${sad.length > 1 ? `; interchangeable: ${inter ? 'yes ✓' : 'no'}` : ''}` : `no saddle point: $\\underline v<\\overline v$, so no pure profile is an equilibrium`;
          return `${l1}\n${l2}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Von Neumann’s minimax theorem',
      credit: 'John von Neumann, 1928',
      statement: String.raw`Let $A$ be a real $m\times n$ matrix and let $\Delta_m,\Delta_n$ be the simplices of mixed strategies (game-2.1). Then
$$\max_{x\in\Delta_m}\min_{y\in\Delta_n}x^{\mathsf T}Ay\;=\;\min_{y\in\Delta_n}\max_{x\in\Delta_m}x^{\mathsf T}Ay\;=:\;v.$$
Both extrema are attained: there are optimal strategies $x^*,y^*$ with $x^{*\mathsf T}Ay\ge v$ for all $y$ and $x^{\mathsf T}Ay^*\le v$ for all $x$. Equivalently, $(x^*,y^*)$ is a saddle point of the mixed extension, i.e. a Nash equilibrium (game-2.3), and every equilibrium of the zero-sum game has payoff $v$ and consists of optimal strategies. So in mixed strategies the maxmin and minmax of game-3.1 coincide even when they differ in pure strategies.`,
      idea: String.raw`The proof used here is geometric. If $\min_y\max_x\,x^{\mathsf T}Ay=w$, the convex set $H=\{Ay:y\in\Delta_n\}\subset\mathbb R^m$ of payoff vectors the column player can force never meets the open orthant $\{z:z_i<w\ \forall i\}$, because every point of $H$ has a coordinate $\ge w$. Two disjoint convex sets, one of them open, can be separated by a hyperplane (the Hahn–Banach separation theorem, fa-3.4): there is a vector $x\ne0$ with $x^{\mathsf T}z\ge x^{\mathsf T}z'$ for $z\in H$ and $z'$ in the orthant. Letting $z'\to(w,\dots,w)$ and noting $x\ge0$ (otherwise the orthant is unbounded in the wrong direction) gives, after normalising $x\in\Delta_m$, $\min_y x^{\mathsf T}Ay\ge w$. So the row player can guarantee $w=\overline v$, and with $\underline v\le\overline v$ (game-3.2) the values agree. Von Neumann's own 1928 proof was far more intricate; the separation argument and the duality proof of game-3.4 are later simplifications.`,
      caption: String.raw`A game with two rows: each column $j$ is the point $(a_{1j},a_{2j})$, the payoff vector against that column. The column player can reach any point of the blue hull by mixing columns. The row player's mixture $(p,1-p)$ is the normal of a line; the guarantee $c(p)=\min_j\,(p\,a_{1j}+(1-p)\,a_{2j})$ is where the line (which keeps the hull on one side) crosses the diagonal $z_1=z_2$, at the corner $(c,c)$ of the red quadrant. Drag $p$: the quadrant creeps toward the hull, and it touches it exactly at $p^*$ where the corner is the green point $(v,v)$ (or the touching point lies on the boundary in a saddle case). No quadrant can cross the hull, and no line can do better: that is the theorem.`,
      deps: ['game-3.2', 'game-2.1', 'fa-3.4'],
      refs: ['MSZ §5.6', 'MSZ §24.2'],
      tags: ['minimax', 'separation', 'value'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Minimax_theorem' },
      viz(v) {
        const games = {
          tri: { label: 'three columns', A: [[5, 1, -2], [-3, 0, 4]] },
          pennies: { label: 'Matching Pennies', A: [[1, -1], [-1, 1]] },
          saddle: { label: 'saddle point', A: [[1, 2, 6], [4, 3, 5]] },
          four: { label: 'four columns', A: [[3, -2, 4, -1], [-3, 2, -1, 1]] },
        };
        let g = games.tri;
        const S = v.stage({ x: [-5, 7], y: [-5, 7], equal: true, axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'payoff if row player plays row 1', ylabel: 'payoff if row 2', title: 'payoff vectors the column player can force' });
        const sel = v.select('game', Object.keys(games).map((k) => ({ value: k, label: games[k].label })), 'tri', { onChange: (k) => { g = games[k]; } });
        const P = v.slider('row mixture $p$ = P(row 1)', 0, 1, 0.5, { step: 0.005 });
        v.button('Optimal $p^*$', () => { P.set(solveZS(g.A).x[0]); });
        const cp = (A, p) => Math.min(...A[0].map((_, j) => p * A[0][j] + (1 - p) * A[1][j]));
        let info = null;
        v.render(() => {
          const A = g.A, n = A[0].length, pts = A[0].map((_, j) => [A[0][j], A[1][j]]), sol = solveZS(A);
          const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
          const lo = Math.min(...xs, ...ys, sol.v) - 1.6, hi = Math.max(...xs, ...ys, sol.v) + 1.6;
          S.setView([lo, hi], [lo, hi]);
          const p = P.value, c = cp(A, p);
          // quadrant below the corner (c, c)
          S.rect(lo - 5, lo - 5, c, c, { fill: 'red', fillAlpha: 0.13, color: 'red', width: 1.2 });
          S.line(lo - 5, sol.v, sol.v, sol.v, { color: 'green', dash: true, width: 1.5 }); S.line(sol.v, lo - 5, sol.v, sol.v, { color: 'green', dash: true, width: 1.5 });
          S.line(lo, lo, hi, hi, { color: 'faint', dash: true, width: 1 });
          // the hull of the column points
          const hull = v.M.hull(pts);
          if (hull.length > 2) S.poly(hull, { fill: 'accent', fillAlpha: 0.16, color: 'accent', width: 2 }); else S.path(hull.concat(hull.length === 2 ? [] : []), { color: 'accent', width: 3 });
          // separating line  p z1 + (1-p) z2 = c
          const d = [-(1 - p), p], K = 40;
          S.line(c - d[0] * K, c - d[1] * K, c + d[0] * K, c + d[1] * K, { color: 'ink', width: 2.4 });
          S.arrow(c, c, c + 1.5 * p, c + 1.5 * (1 - p), { color: 'ink', width: 2, head: 8 });
          S.dot(c, c, { r: 6, color: 'red' });
          pts.forEach((q, j) => S.dot(q[0], q[1], { r: 6, color: 'blue', label: `col ${j + 1}`, labelPos: 'ne' }));
          const zs = [0, 1].map((i) => A[i].reduce((s, a, j) => s + a * sol.y[j], 0));
          S.dot(zs[0], zs[1], { r: 6, color: 'gold', hollow: true, label: 'A y*', labelPos: 'sw' });
          S.dot(sol.v, sol.v, { r: 7, color: 'green', hollow: true });
          info = { p, c, sol, n, P: zsPure(A), side: Math.min(...pts.map((q) => p * q[0] + (1 - p) * q[1])) };
        });
        v.readout(() => {
          if (!info) return '';
          const { p, c, sol, P } = info;
          const at = Math.abs(p - sol.x[0]) < 0.006 || (sol.x[0] < 1e-6 && p < 0.006) || (sol.x[0] > 1 - 1e-6 && p > 0.994);
          return `$p=${v.fix(p, 3)}$: guarantee $c(p)=\\min_j(p\\,a_{1j}+(1-p)\\,a_{2j})=${tx(c)}\\;\\le\\;v=${tx(sol.v)}$, with $p^*=${v.fix(sol.x[0], 3)}$ ${at ? '— the quadrant now touches the hull: $c(p^*)=v$' : ''}\npure strategies only: $\\underline v=${tx(P.maxmin)}$, $\\overline v=${tx(P.minmax)}$ ${P.maxmin < P.minmax ? '(a gap that mixing closes)' : '(already a saddle point)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Minimax by linear-programming duality',
      credit: 'von Neumann, Dantzig, Gale, Kuhn & Tucker, 1947–1951',
      statement: String.raw`Let $A$ be an $m\times n$ matrix and shift it so that $B=A+s\mathbf 1\mathbf 1^{\mathsf T}>0$. Consider the pair of linear programmes
$$(\mathrm P)\;\max\ \mathbf 1^{\mathsf T}z\ \text{ s.t. }\ Bz\le\mathbf 1,\ z\ge0,\qquad(\mathrm D)\;\min\ \mathbf 1^{\mathsf T}w\ \text{ s.t. }\ B^{\mathsf T}w\ge\mathbf 1,\ w\ge0.$$
They are dual to each other, both are feasible and bounded, and by LP duality (algo-11.19) their optimal values are equal: $\mathbf 1^{\mathsf T}z^*=\mathbf 1^{\mathsf T}w^*=:1/(v+s)$. Then $y^*=z^*/\mathbf 1^{\mathsf T}z^*$ and $x^*=w^*/\mathbf 1^{\mathsf T}w^*$ are optimal mixed strategies and $v$ is the value of $A$. Weak duality alone already gives $\min_j (x^{\mathsf T}A)_j\le v\le\max_i(Ay)_i$ for every $x,y$, and strong duality says there is no gap at the optimum; this reproves the minimax theorem (game-3.3).`,
      idea: String.raw`Dividing by $\mathbf 1^{\mathsf T}z$ turns the constraints $Bz\le\mathbf 1$ into "every row pays the row player at most $1/\mathbf 1^{\mathsf T}z$ against $y=z/\mathbf 1^{\mathsf T}z$", so maximising $\mathbf 1^{\mathsf T}z$ minimises the ceiling the column player concedes; the dual programme does the same for the row player's guarantee. Weak duality (any feasible $w$ and $z$ have $\mathbf 1^{\mathsf T}w\ge w^{\mathsf T}Bz\ge\mathbf 1^{\mathsf T}z$) is the inequality $\underline v\le\overline v$ again, and strong duality, proved by the simplex method or by separation, closes the gap. Dantzig recalled that von Neumann saw the connection when they met in October 1947; the converse, that every linear programme can be written as a matrix game, is more delicate.`,
      caption: String.raw`A $3\times3$ game. Drag the blue point to choose the row player's mixture $x$ in her simplex (shading: her guarantee $g(x)=\min_j(x^{\mathsf T}A)_j$, brightest at the optimum) and the orange point to choose the column player's $y$ (shading: his ceiling $h(y)=\max_i(Ay)_i$, brightest at the optimum). Bottom line: $g(x)\le v\le h(y)$ always, which is weak duality. The gap closes only when both players sit at optimal strategies, which "Snap to the LP solution" does: the simplex method on $(\mathrm P)$ and $(\mathrm D)$ ends with equal objective values, shown in the readout. Pick another matrix with the button.`,
      deps: ['game-3.3', 'algo-11.19'],
      refs: ['MSZ §24.3'],
      tags: ['linear programming', 'duality', 'minimax'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Zero-sum_game#Solving' },
      verify: true,
      viz(v) {
        let seed = 7, kind = 'bias';
        const BIAS = [[0, -2, 3], [2, 0, -1], [-3, 1, 0]];
        const gen = () => { if (kind === 'bias') return copyM(BIAS); const r = v.rng(seed * 101 + 3); return idx(3).map(() => idx(3).map(() => r.int(-5, 5))); };
        let A = gen(), key = 'bias';
        const Tx = v.stage({ x: [-0.12, 1.12], y: [-0.2, 1.02], equal: true, axes: false, height: 330, weight: 1, title: 'row player: her mixture x' });
        const Ty = v.stage({ x: [-0.12, 1.12], y: [-0.2, 1.02], equal: true, axes: false, height: 330, weight: 1, title: 'column player: his mixture y' });
        const Nl = v.stage({ x: [-6, 6], y: [0, 1], axes: 'box', gutter: true, height: 150, weight: 2, full: true, xlabel: 'payoff to the row player', yticks: [], title: 'weak duality  g(x) ≤ v ≤ h(y)' });
        v.select('matrix', [{ value: 'bias', label: 'skew-symmetric' }, { value: 'rand', label: 'random' }], 'bias', { onChange: (k) => { kind = k; A = gen(); key = `${k}${seed}`; hx.set(...triPt([1 / 3, 1 / 3, 1 / 3])); hy.set(...triPt([1 / 3, 1 / 3, 1 / 3])); } });
        v.button('New random matrix', () => { seed += 1; kind = 'rand'; A = gen(); key = `rand${seed}`; hx.set(...triPt([1 / 3, 1 / 3, 1 / 3])); hy.set(...triPt([1 / 3, 1 / 3, 1 / 3])); });
        const hx = Tx.handle(...triPt([0.6, 0.2, 0.2]), { color: 'blue', r: 9, constrain: (x, y) => triClamp(x, y) });
        const hy = Ty.handle(...triPt([0.2, 0.2, 0.6]), { color: 'orange', r: 9, constrain: (x, y) => triClamp(x, y) });
        let S = null, Skey = '';
        v.button('Snap to the LP solution', () => { hx.set(...triPt(S.x)); hy.set(...triPt(S.y)); });
        const bary = (h) => { const b = triBary(h.x, h.y).map((t) => Math.max(0, t)), s = b[0] + b[1] + b[2] || 1; return b.map((t) => t / s); };
        let info = null;
        v.render(() => {
          if (Skey !== key) { S = solveZS(A); Skey = key; }
          const P = zsPure(A), x = bary(hx), y = bary(hy), gx = guarantee(A, x), hy_ = ceiling(A, y);
          const lo = Math.min(...P.rowMin), hi = Math.max(...P.colMax);
          drawTriangle(Tx, v, { labels: ['row 1', 'row 2', 'row 3'], labelColor: 'blue' }); drawTriangle(Ty, v, { labels: ['col 1', 'col 2', 'col 3'], labelColor: 'orange' });
          const cb = v.rgb('blue'), co = v.rgb('orange');
          Tx.raster((X, Y) => { const b = triBary(X, Y); if (b.some((t) => t < 0)) return null; const t = clamp((guarantee(A, b) - lo) / (S.v - lo + 1e-9), 0, 1); return [cb[0], cb[1], cb[2], 0.07 + 0.6 * t * t]; }, { res: 3, key: `gx${key}` });
          Ty.raster((X, Y) => { const b = triBary(X, Y); if (b.some((t) => t < 0)) return null; const t = clamp((hi - ceiling(A, b)) / (hi - S.v + 1e-9), 0, 1); return [co[0], co[1], co[2], 0.07 + 0.6 * t * t]; }, { res: 3, key: `hy${key}` });
          drawTriangle(Tx, v, { labels: ['row 1', 'row 2', 'row 3'], labelColor: 'blue' }); drawTriangle(Ty, v, { labels: ['col 1', 'col 2', 'col 3'], labelColor: 'orange' });
          Tx.dot(...triPt(S.x), { r: 11, hollow: true, color: 'green', width: 2.5 }); Ty.dot(...triPt(S.y), { r: 11, hollow: true, color: 'green', width: 2.5 });
          const R = Math.max(3, Math.ceil(Math.max(...A.flat().map(Math.abs))) + 1);
          Nl.setView([-R, R], [0, 1]);
          Nl.line(-R, 0.5, R, 0.5, { color: 'faint', width: 1.5 });
          Nl.rect(gx, 0.4, hy_, 0.6, { fill: 'purple', fillAlpha: 0.22, stroke: false });
          Nl.dot(gx, 0.5, { r: 8, color: 'blue' }); Nl.text('g(x)', gx, 0.78, { align: 'center', size: 12, weight: 700, color: 'blue' });
          Nl.dot(hy_, 0.5, { r: 8, color: 'orange' }); Nl.text('h(y)', hy_, 0.78, { align: 'center', size: 12, weight: 700, color: 'orange' });
          Nl.dot(S.v, 0.5, { r: 5, color: 'green' }); Nl.text('v', S.v, 0.2, { align: 'center', size: 12, weight: 700, color: 'green' });
          info = { x, y, gx, hy_, S };
        });
        v.readout(() => {
          if (!info) return '';
          const { x, y, gx, hy_, S: s } = info;
          const sum = (a) => a.reduce((p, q) => p + q, 0);
          return `$g(x)=${tx(gx)}\\;\\le\\;v=${tx(s.v)}\\;\\le\\;h(y)=${tx(hy_)}$, gap $h(y)-g(x)=${tx(hy_ - gx)}\\ge0$\nLP with $B=A+${s.s}$: simplex stopped after ${s.pivots} pivots; $\\mathbf 1^{\\mathsf T}z^*=${v.fix(sum(s.z), 4)}$ (P), $\\mathbf 1^{\\mathsf T}w^*=${v.fix(sum(s.w), 4)}$ (D), and $1/(v+s)=${v.fix(1 / (s.v + s.s), 4)}$ ✓\n$x^*=(${s.x.map((t) => v.fix(t, 3)).join(', ')})$, $y^*=(${s.y.map((t) => v.fix(t, 3)).join(', ')})$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Method',
      name: 'Solving 2 × n games graphically',
      statement: String.raw`Let $A$ be a $2\times n$ matrix and let the row player play row 1 with probability $p\in[0,1]$. Against column $j$ she receives
$$L_j(p)=p\,a_{1j}+(1-p)\,a_{2j},$$
a line in $p$. Against a column player who chooses the worst column, her guarantee is the **lower envelope** $g(p)=\min_jL_j(p)$, a concave piecewise-linear function. The **value** is $v=\max_{p\in[0,1]}g(p)$ (game-3.3) and the maximiser $p^*$ is an optimal strategy. At $p^*$ either the maximum is at an end point of $[0,1]$ or it is a crossing of two lines of opposite slope; the columns whose lines pass through the peak form the support of an optimal $y^*$, which mixes (at most) two of them so that the row player is indifferent between her rows. An analogous construction with $m\times2$ games uses the upper envelope.`,
      idea: String.raw`Fixing $p$, the column player's best reply to the row mixture is a pure column (a minimum of linear functions over the simplex is attained at a vertex), so the guarantee is the lower envelope of $n$ lines, and the row player's problem is to find its highest point, a one-dimensional LP. The peak of a concave piecewise-linear function sits at a vertex of the envelope: either an end of the interval or a crossing of a rising line and a falling line. Mixing those two columns with weights that make the two rows pay equally yields a column strategy whose ceiling is exactly the peak height, so the two security levels agree, a hands-on view of the minimax theorem for a $2\times n$ game.`,
      caption: String.raw`Each column is a line over $p$, drawn through two draggable handles: the left one at $p=0$ gives the payoff if the row player plays row 2, the right one at $p=1$ gives the payoff for row 1. The bold curve is the lower envelope $g(p)$; its summit is the value, marked in green. Lines through the summit are the column player's support. Drag the handles to change the game, change the number of columns, or drag the gold point along $p$ to read the guarantee. Make the summit sit at an end point to see a pure optimum.`,
      deps: ['game-3.3'],
      refs: ['MSZ §5.2'],
      tags: ['zero-sum', 'graphical method', 'linear programming'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Minimax_theorem' },
      viz(v) {
        const INIT = [[3, -1], [-2, 2], [2, -2], [-1, 1]]; // [payoff at p=1, payoff at p=0] for four columns
        const COLS = ['accent', 'purple', 'teal', 'pink'];
        const st = INIT.map((r) => r.slice());
        const S = v.stage({ x: [0, 1], y: [-4, 4], axes: 'box', gutter: true, height: 380, weight: 1.4, xlabel: 'p = P(row player plays row 1)', ylabel: 'payoff to the row player', title: 'one line per column; her guarantee is the lowest line' });
        const nS = v.select('columns', [2, 3, 4].map((k) => ({ value: k, label: String(k) })), 3);
        const snap = (y) => clamp(Math.round(y * 2) / 2, -4, 4);
        const h1 = INIT.map((r, j) => S.handle(1, r[0], { color: COLS[j], r: 8, constrain: (x, y) => [1, snap(y)] }));
        const h0 = INIT.map((r, j) => S.handle(0, r[1], { color: COLS[j], r: 8, constrain: (x, y) => [0, snap(y)] }));
        const hp = S.handle(0.3, 0, { color: 'gold', r: 8, constrain: (x) => [clamp(x, 0, 1), 0] });
        let info = null;
        v.render(() => {
          const n = nS.value;
          INIT.forEach((_, j) => { h1[j].visible = j < n; h0[j].visible = j < n; });
          const A = [idx(n).map((j) => h1[j].y), idx(n).map((j) => h0[j].y)];
          const L = (j, p) => p * A[0][j] + (1 - p) * A[1][j];
          const g = (p) => Math.min(...idx(n).map((j) => L(j, p)));
          idx(n).forEach((j) => S.line(0, A[1][j], 1, A[0][j], { color: COLS[j], width: 2, alpha: 0.85 }));
          S.fn(g, { domain: [0, 1], color: 'ink', width: 4 });
          const sol = solveZS(A), pst = sol.x[0], val = sol.v;
          const act = idx(n).filter((j) => Math.abs(L(j, pst) - val) < 1e-7);
          S.hline(val, { color: 'green', dash: true, width: 1.5 }); S.vline(pst, { color: 'green', dash: true, width: 1.5 });
          S.dot(pst, val, { r: 8, color: 'green' });
          const p = hp.x; hp.set(p, 0);
          S.vline(p, { color: 'gold', alpha: 0.6, width: 1.5 }); S.dot(p, g(p), { r: 6, color: 'gold' });
          S.text('guarantee g(p)', p, g(p), { dx: 10, dy: -10, size: 11.5, weight: 700, color: 'gold' });
          info = { A, pst, val, act, p, gp: g(p), y: sol.y, n, P: zsPure(A) };
        });
        v.readout(() => {
          if (!info) return '';
          const { pst, val, act, p, gp, y, P } = info;
          const sup = act.map((j) => `col ${j + 1}`).join(', ');
          const where = pst < 1e-6 ? 'at the end point $p=0$' : pst > 1 - 1e-6 ? 'at the end point $p=1$' : 'at a crossing of two lines';
          return `$g(${v.fix(p, 3)})=${tx(gp)}$   value $v=\\max_p g(p)=${tx(val)}$ at $p^*=${v.fix(pst, 3)}$ (${where})\nlines through the summit: ${sup}; an optimal $y^*=(${y.map((t) => v.fix(t, 3)).join(', ')})$   pure play: $\\underline v=${tx(P.maxmin)}$, $\\overline v=${tx(P.minmax)}$`;
        });
      },
    },
  ],
};
