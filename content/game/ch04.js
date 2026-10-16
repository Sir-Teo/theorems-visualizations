// Game Theory & Social Choice — Chapter 4: Extensive games and backward induction
import {
  nm, idx, leaf, dec, isLeaf, prep, backward, bpath, infoSets, pureStrategies, stratName, playBeh, asBeh, strategicForm, pureNash,
  drawTree, treeView, pickNode, nmz, randTree, solveGame,
} from './ch04.shared.js';

const ancestors = (n) => { const s = new Set(); for (let x = n; x; x = x.par) s.add(x); return s; };
const profilePay = (n, prof) => { let x = n; while (!isLeaf(x)) x = x.kids[prof[x.id]].n; return x.u; };
const bestDev = (n, j, prof) => (isLeaf(n) ? n.u[j] : n.p === j + 1 ? Math.max(...n.kids.map((k) => bestDev(k.n, j, prof))) : bestDev(n.kids[prof[n.id]].n, j, prof));

export default {
  collection: 'game',
  chapter: 4,
  title: 'Extensive games and backward induction',
  summary: String.raw`Games played over time are trees. In finite games of perfect information backward induction finds a subgame perfect equilibrium in pure strategies, proving that chess is determined, but its predictions in the centipede and chain-store games strain belief. Imperfect information brings information sets and behaviour strategies, equivalent to mixed strategies under perfect recall (Kuhn). Strategy stealing shows the first player wins Hex and Chomp without saying how, and the Sprague–Grundy theory solves all impartial games by reduction to Nim.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Extensive game with perfect information',
      statement: String.raw`An **extensive game with perfect information** is a finite rooted tree. Each non-terminal node is labelled with the player who moves there, and each edge leaving it with an action available to that player; each terminal node (leaf) carries a payoff for every player. Every player always observes the whole history, so a mover knows exactly which node she is at.

A **pure strategy** of a player is a *complete plan*: a choice of one action at **every** node where she would move, including nodes that her own earlier choices make unreachable. A profile of pure strategies determines a path from the root to a leaf, hence a payoff vector. The table of all these payoffs is the **strategic form** of the game (game-1.1), so every extensive game has a strategic-form counterpart, and Nash equilibrium (game-1.3) applies to it.`,
      idea: String.raw`The tree says *when* things happen, the matrix says *what each player has committed to*. A strategy must name an action at every decision node because it has to tell a mover what to do whatever happens: it is what a player could write on a card and hand to a deputy. The number of strategies is the product of the action counts over the player's nodes, so it grows far faster than the tree itself, while many different strategies lead to the same outcome. This is why the strategic form hides the order of moves, and why game-4.4 will need subgames to say which equilibria are sensible.`,
      caption: String.raw`Choose a game. Left: its tree (blue = player 1 moves, orange = player 2, payoffs at the leaves are player 1's, player 2's). Click a leaf and use the two sliders to change its payoffs. Right: the strategic form, one row or column per complete plan. Click a cell to light up the path that profile produces; green cells are Nash equilibria of the table.`,
      credit: 'Kuhn, 1950–53 (extensive form; von Neumann & Morgenstern, 1944)',
      deps: ['game-1.1'],
      refs: ['Osborne §5.1', 'MSZ §3.3'],
      tags: ['extensive form', 'strategy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Extensive-form_game' },
      verify: true,
      viz(v) {
        const MAKE = {
          entry: () => dec(1, [['Out', leaf(0, 2)], ['In', dec(2, [['Fight', leaf(-1, -1)], ['Accept', leaf(1, 1)]])]]),
          react: () => dec(1, [['L', dec(2, [['l', leaf(3, 1)], ['r', leaf(0, 0)]])], ['R', dec(2, [['l', leaf(1, 0)], ['r', leaf(2, 2)]])]]),
          centi: () => dec(1, [['Take', leaf(1, 0)], ['Pass', dec(2, [['Take', leaf(0, 2)], ['Pass', dec(1, [['Take', leaf(3, 1)], ['Pass', leaf(2, 4)]])]])]]),
        };
        let key = 'entry', P, F, sel = [0, 0], lf = null;
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.1, title: 'the game tree' });
        const M = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 0.9, title: 'its strategic form' });
        const TB = v.table(M, { rows: 2, cols: 2, square: false, cellAspect: 1.7, maxCell: 62, size: 14, labelSize: 12 });
        const s1 = v.slider('payoff to player 1 at the selected leaf', -3, 9, 0, { int: true, onChange: (x) => { if (lf) lf.u[0] = x; } });
        const s2 = v.slider('payoff to player 2 at the selected leaf', -3, 9, 0, { int: true, onChange: (x) => { if (lf) lf.u[1] = x; } });
        const build = () => { P = prep(MAKE[key]()); sel = [0, 0]; lf = P.leaves[0]; s1.set(lf.u[0]); s2.set(lf.u[1]); };
        v.select('game', [{ value: 'entry', label: 'entry game' }, { value: 'react', label: 'reaction game' }, { value: 'centi', label: 'take or pass' }], key, { onChange: (k) => { key = k; build(); } });
        build();
        T.onClick((x, y) => { const n = pickNode(P, x, y, 0.35); if (n && isLeaf(n)) { lf = n; s1.set(n.u[0]); s2.set(n.u[1]); } });
        M.onClick((x, y) => { const c = TB.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        let info;
        v.render(() => {
          F = strategicForm(P);
          const R = F.S1.length, C = F.S2.length;
          if (sel[0] >= R || sel[1] >= C) sel = [0, 0];
          const ne = pureNash(F.U), play = playBeh(P, asBeh(P, F.S1[sel[0]], F.S2[sel[1]]));
          const end = [...play.leafP.keys()][0], onp = ancestors(end);
          T.setView(treeView(P).x, treeView(P).y);
          drawTree(T, P, { edgeColor: (e) => (onp.has(e.to) && onp.has(e.from) ? 'gold' : null), edgeWidth: (e) => (onp.has(e.to) ? 4 : 1.6), nodeRing: (n) => (n === lf ? 'accent' : null), nodeFill: (n) => (n === lf ? 'accent' : null), nodeTag: (n) => (isLeaf(n) ? null : `${n.p}`) });
          if (lf) T.text('selected', lf.x, lf.y + 0.28, { align: 'center', baseline: 'bottom', size: 11, color: 'accent', weight: 700 });
          TB.draw({
            rows: R, cols: C, data: F.U, rowLabels: F.S1.map((s) => stratName(P, 1, s)), colLabels: F.S2.map((s) => stratName(P, 2, s)),
            rowLabelColor: () => 'blue', colLabelColor: () => 'orange', cornerLabel: '1 \\ 2',
            fill: (i, j) => (ne.some(([a, b]) => a === i && b === j) ? ['green', 0.3] : null), highlight: [[sel[0], sel[1], 'gold']],
          });
          info = { R, C, ne, u: play.u, nodes: P.nodes.length, leaves: P.nl };
        });
        v.readout(() => {
          const { R, C, ne, u, nodes, leaves } = info;
          return `${nodes} nodes, ${leaves} leaves; player 1 has ${R} pure strategies, player 2 has ${C}, the table has ${R * C} cells but the tree only ${leaves} outcomes\nselected profile (${stratName(P, 1, F.S1[sel[0]])} ; ${stratName(P, 2, F.S2[sel[1]])}) pays $(${nmz(u[0])},\\,${nmz(u[1])})$; pure Nash equilibria of the table: ${ne.length}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Method',
      name: 'Backward induction',
      statement: String.raw`In a finite game of perfect information (game-4.1), solve the tree from the leaves toward the root. At a node whose children are all already valued, the mover picks a child that maximises her own payoff coordinate, and the node is assigned that child's payoff vector. Repeating this up to the root assigns a payoff vector to every node. Following the chosen branches from the root gives the **equilibrium path**; the choices at *all* nodes, on or off that path, form a strategy profile. If several children tie for the mover, any may be chosen.`,
      idea: String.raw`The method rests on one observation: whoever moves at the last decision nodes faces a plain one-person optimisation, whose answer does not depend on anything else. Replace each last node by its resulting payoffs; the tree is now shorter, and the same reasoning applies again. Each step assumes that the people moving later will do what is best for themselves, so the profile built this way never relies on an empty threat. That property is made precise by subgame perfection (game-4.4).`,
      caption: String.raw`Step through the solution (or press play). The node being processed gets a gold ring, the chosen branch turns green and the node shows the payoff pair it hands upward. Change the depth, branching or roll a new random tree. Ties (the mover is indifferent) are shown by two green branches.`,
      credit: 'Zermelo, 1913; Kuhn, 1953',
      deps: ['game-4.1'],
      refs: ['Osborne §5.5'],
      tags: ['backward induction', 'algorithm'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Backward_induction' },
      verify: true,
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, title: 'solving a random game tree' });
        let seed = 7, P, order = [];
        const depth = v.select('depth', [2, 3, 4].map((d) => ({ value: d, label: String(d) })), 3, { onChange: () => rebuild() });
        const br = v.select('branching', [2, 3].map((d) => ({ value: d, label: String(d) })), 2, { onChange: () => rebuild() });
        const rebuild = () => {
          const b = depth.value === 4 && br.value === 3 ? 2 : br.value;
          P = prep(randTree(v.rng(seed), depth.value, b)); backward(P.root);
          order = P.nodes.filter((n) => !isLeaf(n)).sort((a, b2) => b2.d - a.d || a.x - b2.x);
          if (S) S.reset(frames());
        };
        const frames = () => [{ k: 0, note: 'Leaves carry payoffs (player 1, player 2). Start at the deepest decision nodes.' }, ...order.map((n, i) => ({
          k: i + 1, cur: n,
          note: `Player ${n.p} moves here: ${n.kids.map((kd) => nmz(kd.n.v[n.p - 1])).join(' vs ')} for herself, so she picks ${n.bi.map((j) => `“${n.kids[j].a}”`).join(' or ')}; the node is worth $(${nmz(n.v[0])},\\,${nmz(n.v[1])})$.`,
        }))];
        let S;
        v.button('new random tree', () => { seed += 1; rebuild(); });
        rebuild();
        S = v.steps({ frames: frames, still: 3 });
        v.render(() => {
          const f = S.frame, done = new Set(order.slice(0, f.k).concat([]));
          const vw = treeView(P); s.setView(vw.x, vw.y);
          const full = f.k === order.length, path = full ? new Set(bpath(P.root)) : null;
          drawTree(s, P, {
            size: P.nl > 16 ? 10.5 : 12.5,
            edgeColor: (e) => (done.has(e.from) ? (e.from.bi.includes(e.i) ? (path && path.has(e.to) && path.has(e.from) ? 'gold' : 'green') : 'faint') : null),
            edgeWidth: (e) => (done.has(e.from) && e.from.bi.includes(e.i) ? (path && path.has(e.to) ? 4.5 : 3) : 1.4),
            labelColor: (e) => (done.has(e.from) && !e.from.bi.includes(e.i) ? 'faint' : 'ink'),
            nodeRing: (n) => (n === f.cur ? 'gold' : null), values: (n) => done.has(n), size_: 0,
          });
        });
        v.readout(() => `value of the game at the root: $(${nmz(P.root.v[0])},\\,${nmz(P.root.v[1])})$ after ${order.length} node evaluations (one per decision node: work grows with the size of the tree, not with the number of strategies)`);
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Zermelo: chess is determined',
      statement: String.raw`Consider a finite two-player game of perfect information with no chance moves whose outcomes are *win for player 1*, *draw* or *win for player 2* (chess is such a game once the draw rules guarantee that play is finite). Then exactly one of the following holds: player 1 has a strategy that forces a win; player 2 has a strategy that forces a win; or both players have strategies that guarantee at least a draw. The game is **determined**: there is a value of the game, and with best play from the start it is realised.`,
      idea: String.raw`This is backward induction (game-4.2) applied to the three-valued payoffs $+1, 0, -1$ for player 1. Label each final position by its result and then label every earlier position by what the mover can force: win if some move leads to a position that is lost for the opponent, loss if all moves do, draw otherwise. Induction on the distance to the end gives every position, in particular the start, one of the three labels. For a game as large as chess the labelling exists but nobody has computed it; for small games it can be computed completely.`,
      caption: String.raw`Pick a game; the computer has solved every position reachable from the empty board. Each empty square is coloured by what the player to move gets by playing there: green = forces a win, gold = draw, red = loses against best play. Click squares to play (the other side is played by the computer if the switch is on) and watch the colours change. The bars count all reachable positions by value for the player to move.`,
      credit: 'Zermelo, 1913 (correct proof by Kálmán, 1928)',
      scope: String.raw`Finite games of perfect information without chance. Zermelo’s own argument concerned chess; the usual modern proof is by induction as above.`,
      deps: ['game-4.2'],
      refs: ['MSZ ch. 1'],
      tags: ['determinacy', 'chess', 'combinatorial game'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Zermelo%27s_theorem_(game_theory)' },
      verify: true,
      viz(v) {
        const mkLines = (W, H, K) => {
          const L = [];
          for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
            const cells = []; for (let t = 0; t < K; t++) { const rr = r + dr * t, cc = c + dc * t; if (rr < 0 || rr >= H || cc < 0 || cc >= W) break; cells.push(rr * W + cc); }
            if (cells.length === K) L.push(cells);
          }
          return L;
        };
        const GAMES = {
          ttt: { label: 'tic-tac-toe', W: 3, H: 3, K: 3, mis: false },
          mis: { label: 'misère tic-tac-toe', W: 3, H: 3, K: 3, mis: true },
          t34: { label: '3 × 4, three in a row', W: 4, H: 3, K: 3, mis: false },
        };
        const cache = {};
        const setup = (k) => {
          if (cache[k]) return cache[k];
          const g = GAMES[k], L = mkLines(g.W, g.H, g.K), N = g.W * g.H;
          const lineBy = (st, ch) => L.some((l) => l.every((i) => st[i] === ch));
          const mover = (st) => { let x = 0, o = 0; for (const c of st) { if (c === 'X') x++; else if (c === 'O') o++; } return x === o ? 'X' : 'O'; };
          const term = (st) => {
            const m = mover(st), other = m === 'X' ? 'O' : 'X';
            if (lineBy(st, other)) return g.mis ? 1 : -1;   // the player who just moved completed a line
            if (!st.includes('.')) return 0;
            return null;
          };
          const memo = new Map();
          const val = (st) => {
            if (memo.has(st)) return memo.get(st);
            const t = term(st); let r;
            if (t != null) r = t; else { const m = mover(st); r = -1; for (let i = 0; i < N; i++) if (st[i] === '.') { const x = -val(st.slice(0, i) + m + st.slice(i + 1)); if (x > r) r = x; } }
            memo.set(st, r); return r;
          };
          const empty = '.'.repeat(N); val(empty);
          const counts = [0, 0, 0]; memo.forEach((x) => { counts[x + 1]++; });
          return (cache[k] = { g, N, term, mover, val, empty, counts, rootVal: memo.get(empty) });
        };
        let key = 'ttt', G = setup(key), st = G.empty, comp = true, hist = [];
        const sg = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 330, title: 'the board (values for the player to move)' });
        const sb = v.stage({ x: [0.3, 3.7], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 0.8, yticks: [], xticks: [[1, 'loss'], [2, 'draw'], [3, 'win']], xlabel: 'value for the player to move', title: 'all reachable positions' });
        v.select('game', Object.keys(GAMES).map((k) => ({ value: k, label: GAMES[k].label })), key, { onChange: (k) => { key = k; G = setup(k); st = G.empty; hist = []; } });
        const tg = v.toggle('computer plays the other side', true, { onChange: () => {} });
        v.button('new game', () => { st = G.empty; hist = []; });
        v.button('undo', () => { if (hist.length) st = hist.pop(); });
        const play = (i) => { hist.push(st); st = st.slice(0, i) + G.mover(st) + st.slice(i + 1); };
        const best = () => { const m = G.mover(st); let bv = -2, bi = []; for (let i = 0; i < G.N; i++) if (st[i] === '.') { const ns = st.slice(0, i) + m + st.slice(i + 1), x = -G.val(ns); if (x > bv) { bv = x; bi = [i]; } else if (x === bv) bi.push(i); } return bi; };
        sg.onClick((x, y) => {
          const { W, H } = G.g;
          const cs = 0.9 / Math.max(W, H), x0 = 0.5 - cs * W / 2, y0 = 0.5 + cs * H / 2;
          const j = Math.floor((x - x0) / cs), i = Math.floor((y0 - y) / cs);
          if (i < 0 || i >= H || j < 0 || j >= W) return;
          const c = i * W + j; if (st[c] !== '.' || G.term(st) != null) return;
          play(c);
          if (tg.value && G.term(st) == null) { const bi = best(); play(bi[bi.length > 1 ? (st.length * 7 + hist.length) % bi.length : 0]); }
        });
        v.render(() => {
          const { W, H } = G.g, cs = 0.9 / Math.max(W, H), x0 = 0.5 - cs * W / 2, y0 = 0.5 + cs * H / 2, m = G.mover(st), over = G.term(st) != null;
          sg.setView([0, 1], [0, 1]);
          for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) {
            const c = i * W + j, ax = x0 + j * cs, ay = y0 - (i + 1) * cs;
            let fill = null, tx = null;
            if (st[c] === '.' && !over) { const r = -G.val(st.slice(0, c) + m + st.slice(c + 1)); fill = r > 0 ? 'green' : r < 0 ? 'red' : 'gold'; tx = r > 0 ? 'W' : r < 0 ? 'L' : 'D'; }
            sg.rect(ax, ay, ax + cs, ay + cs, { fill: fill || 'panel', fillAlpha: fill ? 0.28 : 0.0, color: 'muted', width: 1.5 });
            if (tx) sg.text(tx, ax + cs / 2, ay + cs / 2, { align: 'center', baseline: 'middle', size: 15, color: fill, weight: 700 });
            if (st[c] !== '.') sg.text(st[c], ax + cs / 2, ay + cs / 2, { align: 'center', baseline: 'middle', size: 34, color: st[c] === 'X' ? 'blue' : 'orange', weight: 800 });
          }
          const mx = Math.max(...G.counts);
          sb.setView([0.3, 3.7], [0, 1]);
          [['loss', 0, 'red'], ['draw', 1, 'gold'], ['win', 2, 'green']].forEach(([lab, k, col]) => {
            const x = k + 1; sb.rect(x - 0.32, 0, x + 0.32, 0.78 * G.counts[k] / mx, { fill: col, fillAlpha: 0.35, color: col, width: 1.5 });
            sb.text(String(G.counts[k]), x, 0.78 * G.counts[k] / mx + 0.04, { align: 'center', baseline: 'bottom', size: 12, weight: 700, color: col });
          });
        });
        v.readout(() => {
          const rv = G.rootVal, m = G.mover(st), t = G.term(st), x = G.val(st);
          const root = rv > 0 ? 'X (moving first) can force a win' : rv < 0 ? 'O (moving second) can force a win' : 'both sides can force a draw';
          const now = t != null ? (t === 0 ? 'game over: draw' : `game over: ${t < 0 ? (m === 'X' ? 'O' : 'X') : m} wins`) : `${m} to move, value ${x > 0 ? 'win' : x < 0 ? 'loss' : 'draw'} for ${m} with best play`;
          return `from the empty board: ${root} (${G.counts[0] + G.counts[1] + G.counts[2]} reachable positions, every one labelled)\n${now}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Definition',
      name: 'Subgame perfect equilibrium',
      statement: String.raw`In an extensive game with perfect information (game-4.1), each node $h$ starts a **subgame**: the part of the tree below $h$, with the same payoffs. A strategy profile is a **subgame perfect equilibrium** (SPE) if for *every* subgame the restriction of the profile to it is a Nash equilibrium (game-1.3) of that subgame. Equivalently no player can gain by changing her choices at some node while the others keep to the profile, even at nodes that the profile never reaches. Every SPE is a Nash equilibrium of the whole game; the converse fails.`,
      idea: String.raw`A Nash equilibrium only tests deviations that change what happens on the path actually played, so it can rest on a *threat* that would be carried out only off the path, where carrying it out hurts the threatener. Requiring equilibrium in each subgame forces every threat to be one the player would really want to execute once there. In finite perfect-information games this selects exactly the profiles that survive backward induction (game-4.2).`,
      caption: String.raw`Entry game: the entrant may stay out or enter; if she enters, the incumbent fights or accepts. Drag the sliders for the incumbent’s payoff from fighting and the entrant’s loss when fought. The table lists the pure Nash equilibria: green = also subgame perfect, red = Nash only, because it relies on a non-credible threat (dashed red). Click a cell to see its path.`,
      credit: 'Selten, 1965',
      deps: ['game-4.2', 'game-1.3'],
      refs: ['Osborne §5.4', 'MSZ §7.1'],
      tags: ['subgame perfection', 'credible threat'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Subgame_perfect_equilibrium' },
      verify: true,
      viz(v) {
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1.05, title: 'entry game (payoffs: entrant, incumbent)' });
        const M = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 0.95, title: 'strategic form' });
        const TB = v.table(M, { rows: 2, cols: 2, square: false, cellAspect: 1.8, maxCell: 62, size: 15, labelSize: 12.5, rowLabels: ['Out', 'In'], colLabels: ['Fight', 'Accept'], rowLabelColor: () => 'blue', colLabelColor: () => 'orange', cornerLabel: 'E \\ I' });
        const sf = v.slider('incumbent’s payoff if it fights an entrant', -2, 3, -0.5, { step: 0.5 });
        const sl = v.slider('entrant’s payoff if fought', -3, 0, -1, { step: 0.5 });
        let sel = [1, 1];
        M.onClick((x, y) => { const c = TB.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        let info;
        v.render(() => {
          const f = sf.value, l = sl.value;
          const root = dec(1, [['Out', leaf(0, 2)], ['In', dec(2, [['Fight', leaf(l, f)], ['Accept', leaf(1, 1)]])]]);
          const P = prep(root); backward(root);
          const F = strategicForm(P), ne = pureNash(F.U);
          // F.S1 order: Out, In ; F.S2: Fight, Accept
          const spe = [[1, f > 1 ? 0 : 1]]; if (f > 1) spe[0] = [0, 0]; else spe[0] = [1, 1];
          const isSPE = (i, j) => spe.some(([a, b]) => a === i && b === j);
          const play = playBeh(P, asBeh(P, F.S1[sel[0]], F.S2[sel[1]])), end = [...play.leafP.keys()][0], onp = ancestors(end);
          T.setView([-1.4, 2.7], [-3.0, 0.8]);
          const n2 = P.nodes[2], pathSPE = new Set(bpath(P.root));
          // subgame box
          T.rect(n2.x - 0.9, -2.8, n2.x + 0.9, n2.y + 0.5, { fill: 'purple', fillAlpha: 0.07, color: 'purple', width: 1.5, dash: true });
          T.text('subgame', n2.x + 0.85, -2.75, { align: 'right', baseline: 'bottom', size: 11.5, color: 'purple', weight: 700 });
          const threat = sel[1] === 0 && f < 1;
          drawTree(T, P, {
            edgeColor: (e) => (onp.has(e.to) && onp.has(e.from) ? 'gold' : (e.from === n2 && e.a === 'Fight' && ne.some(([a, b]) => b === 0 && a === 0) && f < 1 ? 'red' : null)),
            edgeWidth: (e) => (onp.has(e.to) && onp.has(e.from) ? 4.5 : pathSPE.has(e.to) && pathSPE.has(e.from) ? 3 : 1.6),
            labelColor: (e) => (pathSPE.has(e.to) && pathSPE.has(e.from) ? 'green' : 'ink'), nodeTag: (n) => (isLeaf(n) ? null : n.p === 1 ? 'entrant' : 'incumbent'),
          });
          if (f < 1) T.text('non-credible threat', n2.x - 0.95, -0.85, { align: 'right', size: 11.5, color: 'red', weight: 700 });
          TB.draw({
            data: F.U, fill: (i, j) => (ne.some(([a, b]) => a === i && b === j) ? (isSPE(i, j) ? ['green', 0.32] : ['red', 0.25]) : null), highlight: [[sel[0], sel[1], 'gold']],
          });
          info = { ne, spe: spe[0], f, F };
        });
        v.readout(() => {
          const { ne, spe, f, F } = info, nameOf = ([i, j]) => `(${['Out', 'In'][i]}, ${['Fight', 'Accept'][j]})`;
          const sub = f > 1 ? 'Fighting pays the incumbent more than accepting, so the threat is credible and the entrant stays out.' : f === 1 ? 'The incumbent is indifferent between fighting and accepting.' : 'In the subgame the incumbent prefers to accept, so “Fight” is an empty threat.';
          return `pure Nash equilibria: ${ne.map(nameOf).join(' and ')}; subgame perfect: **${nameOf(spe)}**\n${sub}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Kuhn: perfect-information games have a pure subgame perfect equilibrium',
      statement: String.raw`Every finite extensive game with perfect information has a subgame perfect equilibrium in pure strategies (game-4.4). One is obtained by backward induction (game-4.2); if no player is ever indifferent between two payoffs at a node, it is the only one. More generally the profiles produced by backward induction, with arbitrary tie-breaking, are exactly the pure subgame perfect equilibria.`,
      idea: String.raw`Induct on the height of the tree. A game of height $0$ is a single payoff vector. In a game of height $h+1$, solve each immediate subgame by the induction hypothesis, giving payoffs at the children; the mover at the root picks a child that is best for her, and plays on in that subgame as prescribed. No deviation helps in the subgames by hypothesis, and at the root the mover has chosen optimally among the continuation values, so no deviation helps there either. No mixing is needed because each choice is a single optimisation over finitely many numbers.`,
      caption: String.raw`A random tree with the backward-induction profile. The verifier tests every subgame: for each player it computes the best payoff she could get by changing her own choices (a dynamic programme over her nodes) and compares it with the profile’s payoff. Press “corrupt a choice” to flip one decision to a worse branch: the subgames above it fail. A corrupted choice off the equilibrium path can still leave a Nash equilibrium of the whole game, though not a subgame perfect one. The right plot shows why brute force does not scale.`,
      credit: 'Kuhn, 1953 (backward induction: Zermelo, 1913)',
      deps: ['game-4.4'],
      refs: ['MSZ §4.13', 'Osborne §5.5'],
      tags: ['subgame perfection', 'existence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Backward_induction' },
      verify: true,
      viz(v) {
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.35, title: 'a game tree and a pure profile' });
        const C = v.stage({ x: [1, 6], y: [0, 12], axes: 'box', gutter: true, height: 340, weight: 0.65, xlabel: 'depth of the tree (binary)', ylabel: 'log₁₀ of the count', title: 'strategies explode, the solution does not' });
        let seed = 3, P, prof, corrupted = null;
        const depth = v.select('depth', [2, 3, 4, 5].map((d) => ({ value: d, label: String(d) })), 4, { onChange: () => rebuild() });
        const rebuild = () => {
          P = prep(randTree(v.rng(seed), depth.value, 2, 0, 5)); backward(P.root);
          prof = {}; P.nodes.forEach((n) => { if (!isLeaf(n)) prof[n.id] = n.bi[0]; }); corrupted = null;
        };
        v.button('new random tree', () => { seed += 1; rebuild(); });
        v.button('corrupt a choice', () => {
          const r = v.rng(seed * 31 + (corrupted ? 5 : 1));
          const cand = P.nodes.filter((n) => !isLeaf(n) && n.kids.some((k, i) => k.n.v[n.p - 1] < n.v[n.p - 1] - 1e-9));
          if (!cand.length) return;
          const n = cand[r.int(0, cand.length - 1)];
          const worse = n.kids.map((k, i) => i).filter((i) => n.kids[i].n.v[n.p - 1] < n.v[n.p - 1] - 1e-9);
          prof[n.id] = worse[r.int(0, worse.length - 1)]; corrupted = n;
        });
        v.button('restore', () => { P.nodes.forEach((n) => { if (!isLeaf(n)) prof[n.id] = n.bi[0]; }); corrupted = null; });
        rebuild();
        const check = () => {
          let bad = 0, total = 0; const badSet = new Set();
          P.nodes.forEach((n) => {
            if (isLeaf(n)) return; total++;
            const u = profilePay(n, prof);
            if ([0, 1].some((j) => bestDev(n, j, prof) > u[j] + 1e-9)) { bad++; badSet.add(n); }
          });
          const u0 = profilePay(P.root, prof), nashAll = ![0, 1].some((j) => bestDev(P.root, j, prof) > u0[j] + 1e-9);
          return { bad, total, badSet, nashAll };
        };
        let info;
        v.render(() => {
          const vw = treeView(P); T.setView(vw.x, vw.y);
          const ck = check(), pathN = new Set(); { let x = P.root; pathN.add(x); while (!isLeaf(x)) { x = x.kids[prof[x.id]].n; pathN.add(x); } }
          drawTree(T, P, {
            size: P.nl > 16 ? 10 : 12, labelEdges: P.nl <= 8,
            edgeColor: (e) => (prof[e.from.id] === e.i ? (pathN.has(e.to) ? 'gold' : (ck.badSet.has(e.from) ? 'red' : 'green')) : null),
            edgeWidth: (e) => (prof[e.from.id] === e.i ? (pathN.has(e.to) ? 4.5 : 3) : 1.2),
            nodeRing: (n) => (ck.badSet.has(n) ? 'red' : n === corrupted ? 'purple' : null),
          });
          C.setView([1, 6], [0, 12]);
          const pts = [1, 2, 3, 4, 5].map((d) => {
            // binary tree of depth d, players alternate starting with 1: count decision nodes of player 1 and 2
            let n1 = 0, n2 = 0; for (let k = 0; k < d; k++) { if (k % 2 === 0) n1 += 2 ** k; else n2 += 2 ** k; }
            return [d, Math.log10(2 ** n1) + Math.log10(2 ** n2), Math.log10(2 ** d - 1)];
          });
          C.path(pts.map((p) => [p[0], p[1]]), { color: 'red', width: 2.5 }); pts.forEach((p) => C.dot(p[0], p[1], { r: 4, color: 'red' }));
          C.path(pts.map((p) => [p[0], p[2]]), { color: 'green', width: 2.5 }); pts.forEach((p) => C.dot(p[0], p[2], { r: 4, color: 'green' }));
          C.text('strategy profiles (both players)', 1.15, 10.2, { color: 'red', weight: 700, size: 12, align: 'left' });
          C.text('nodes (work of backward induction)', 5.95, 2.4, { color: 'green', weight: 700, size: 12, align: 'right' });
          C.vline(depth.value, { color: 'gold', width: 2 });
          info = { ck, d: depth.value, u: profilePay(P.root, prof) };
        });
        v.readout(() => {
          const { ck, d, u } = info, nodesDec = P.nodes.filter((n) => !isLeaf(n)).length;
          const verdict = ck.bad === 0 ? `all ${ck.total} subgames pass: a pure subgame perfect equilibrium` : `${ck.bad} of ${ck.total} subgames fail (red rings); whole game still a Nash equilibrium: ${ck.nashAll ? 'yes (the flaw is off the path)' : 'no'}`;
          return `${verdict}; payoff $(${nmz(u[0])},\\,${nmz(u[1])})$\n${nodesDec} decision nodes to solve by backward induction; the number of pure profiles in this tree is $2^{${nodesDec}}$ = ${(2 ** nodesDec).toLocaleString('en-US').replace(/,/g, ' ')}`;
        });
      },
    },
  ],
};
