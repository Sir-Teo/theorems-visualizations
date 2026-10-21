// Game Theory & Social Choice — Chapter 4: Extensive games and backward induction
import {
  nm, idx, leaf, dec, isLeaf, prep, backward, bpath, infoSets, pureStrategies, stratName, playBeh, asBeh, strategicForm, pureNash,
  drawTree, treeView, pickNode, nmz, randTree, solveGame,
} from './ch04.shared.js';
import { DETERMINACY_GAMES, solveLineGame, validLineHistory } from './determinacy-audit.js';
import { TREE_EXAMPLES, entryEquilibria, randomFiniteTree, solveFiniteTree, checkFiniteProfile, binaryTreeCounts, finiteTreeInspector } from './finite-tree-audit.js';

const ancestors = (n) => { const s = new Set(); for (let x = n; x; x = x.par) s.add(x); return s; };

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
      statement: String.raw`Here we use the **finite, deterministic** version of an extensive game with perfect information. There is a finite nonempty set of players and a finite rooted tree. Every nonterminal node has a nonempty finite set of outgoing actions, with distinct labels at that node, and exactly one player who moves there. Every terminal node carries a finite real payoff for each player. The whole history is observed, so the mover knows exactly which node has been reached. A root that is already terminal is allowed. There are no chance moves or simultaneous choices in this model; perfect information alone does not mean that a general extensive game is finite or has no chance moves.

A **pure strategy** is a complete plan: one action at every node assigned to that player, including nodes excluded by her own earlier choices. A player with no decision nodes has one empty plan. A pure profile determines one root-to-terminal path and its payoff vector. Taking these complete plans as actions produces the **strategic form** (game-1.1), whose Nash equilibria are defined by game-1.3.`,
      idea: String.raw`If player $i$ moves at nodes $H_i$ and has action set $A(h)$ at node $h$, then $|S_i|=\prod_{h\in H_i}|A(h)|$, with an empty product equal to one. The finite tree and its nonempty action sets ensure that a plan exists and that following a profile ends at a terminal node. Different plans can induce the same path because their off-path choices differ, and different terminal histories can have equal payoff vectors. Strategy counts can grow exponentially: in a binary tree with $D$ decision nodes the total number of pure profiles is $2^D$. Such growth is not universal; nodes with only one action add no choices. The strategic form retains every payoff comparison but does not itself display the timing; subgames in game-4.4 add restrictions at histories that a chosen profile does not reach.

The product rule comb 1.1 counts complete plans: one independent specification is made at each of the player's decision nodes, with $|A(h)|$ choices there, so the number is their product. These are plan choices, not probabilities or independence of play. If the player never moves the empty product is one. Multiplying across players gives the full profile count; in a binary tree with D decision nodes this is $2^D$, while chance nodes are excluded by this finite deterministic model.`,
      caption: String.raw`Choose a game. Left: its tree (blue = player 1 moves, orange = player 2, payoffs at the leaves are player 1's, player 2's). Click a leaf and use the two sliders to change its payoffs. Right: the strategic form, one row or column per complete plan. Click a cell to light up the path that profile produces; green cells are Nash equilibria of the table.`,
      credit: 'von Neumann & Morgenstern, 1944; Kuhn, 1953 (formulation)',
      deps: ['game-1.1', 'game-1.3', 'comb-1.1'],
      refs: ['Bonanno (2024), §§3.1, 3.3', 'Osborne & Rubinstein (1994), §§6.1.1–6.1.3; notes pp.114–115'],
      tags: ['extensive form', 'strategy'],
      links: { source: 'https://faculty.econ.ucdavis.edu/faculty/bonanno/PDF/GT_book.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Extensive-form_game' },
      verify: false,
      viz(v) {
        const MAKE = TREE_EXAMPLES;
        let key = 'entry', P, F, sel = [0, 0], lf = null;
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.1, title: 'the game tree' });
        const M = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 0.9, title: 'its strategic form' });
        const TB = v.table(M, { rows: 2, cols: 2, square: false, cellAspect: 1.7, maxCell: 62, size: 14, labelSize: 12 });
        const s1 = v.slider('payoff to player 1 at the selected leaf', -3, 9, 0, { int: true, onChange: (x) => { if (lf) lf.u[0] = x; } });
        const s2 = v.slider('payoff to player 2 at the selected leaf', -3, 9, 0, { int: true, onChange: (x) => { if (lf) lf.u[1] = x; } });
        const build = () => { P = prep(MAKE[key]()); sel = [0, 0]; lf = P.leaves[0]; s1.set(lf.u[0]); s2.set(lf.u[1]); };
        const game = v.select('game', [{ value: 'entry', label: 'entry game' }, { value: 'react', label: 'reaction game' }, { value: 'centi', label: 'take or pass' }], key, { onChange: (k) => { key = k; build(); } });
        build();
        v.shareState('edited finite tree', {
          get: () => ({ game: key, payoffs: P.leaves.map(n => n.u.slice()), leaf: P.leaves.indexOf(lf), cell: sel.slice() }),
          validate: d => { if (!d || typeof d.game !== 'string' || !Object.hasOwn(MAKE, d.game) || !Array.isArray(d.payoffs)) return false; const q = prep(MAKE[d.game]()), f = strategicForm(q); return d.payoffs.length === q.leaves.length && d.payoffs.every(u => Array.isArray(u) && u.length === 2 && u.every(x => Number.isInteger(x) && x >= -3 && x <= 9)) && Number.isInteger(d.leaf) && d.leaf >= 0 && d.leaf < q.leaves.length && Array.isArray(d.cell) && d.cell.length === 2 && d.cell.every(Number.isInteger) && d.cell[0] >= 0 && d.cell[0] < f.S1.length && d.cell[1] >= 0 && d.cell[1] < f.S2.length; },
          set: d => { key = d.game; game.set(key); build(); P.leaves.forEach((n, i) => { n.u = d.payoffs[i].slice(); }); lf = P.leaves[d.leaf]; sel = d.cell.slice(); s1.set(lf.u[0]); s2.set(lf.u[1]); },
        });
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
          return `${nodes} nodes, ${leaves} terminal histories; player 1 has ${R} pure strategies, player 2 has ${C}; ${R * C} profile cells can lead to just ${leaves} terminal histories\nselected profile (${stratName(P, 1, F.S1[sel[0]])} ; ${stratName(P, 2, F.S2[sel[1]])}) pays $(${nmz(u[0])},\\,${nmz(u[1])})$; pure Nash equilibria of the table: ${ne.length}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Method',
      name: 'Backward induction',
      statement: String.raw`In the finite deterministic perfect-information model of game-4.1, label each terminal node by its payoff vector. At a decision node whose children are already valued, choose an action maximizing the mover's coordinate of those continuation vectors, record that action, and assign its vector to the node. Continue until the root is valued. This records a complete pure profile, including off-path choices; game-4.5 proves that it is subgame perfect. A terminal root needs no evaluation. Nonterminal nodes have nonempty finite action sets, so every maximization is attained. If actions tie for the mover, select one and propagate its entire vector: another tie selection can change the payoffs faced by ancestors.`,
      idea: String.raw`The method rests on one observation: whoever moves at the last decision nodes faces a plain one-person optimisation, whose answer does not depend on anything else. Replace each last node by its resulting payoffs; the tree is now shorter, and the same reasoning applies again. Each step assumes that the people moving later will do what is best for themselves, so the profile built this way never relies on an empty threat. That property is made precise by subgame perfection (game-4.4).`,
      caption: String.raw`Step through the complete postorder evaluation, including every off-path node. The inspector shows the current node and its immediate children at readable size; click a child or use root/parent/previous/next to inspect any node. “Follow evaluated node” returns to the active step. Gold marks the selected action; green marks another tied best action under the displayed continuations. Choose first or last listed action on ties, change depth or binary/ternary branching, or generate a seeded tree. Every displayed tree has exactly the selected branching. Randomness generates the fixed example; there are no chance moves during play.`,
      credit: 'Kuhn, 1953 (finite-game existence; modern backward-induction proof)',
      deps: ['game-4.1'],
      refs: ['Bonanno (2024), Definition 3.2.1', 'Osborne & Rubinstein (1994), Proposition 99.2'],
      tags: ['backward induction', 'algorithm'],
      links: { source: 'https://faculty.econ.ucdavis.edu/faculty/bonanno/PDF/GT_book.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Backward_induction' },
      verify: false,
      viz(v) {
        const stage = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, title: 'one node and its immediate continuations' });
        let P, solution, S, inspector;
        const depth = v.select('depth', [2, 3, 4].map(d => ({ value: d, label: String(d) })), 3, { onChange: () => rebuild() });
        const branching = v.select('branching', [2, 3].map(d => ({ value: d, label: String(d) })), 2, { onChange: () => rebuild() });
        const seed = v.slider('tree seed', 1, 64, 7, { int: true, onChange: () => rebuild() });
        const tie = v.select('ties', [{ value: 'first', label: 'first action' }, { value: 'last', label: 'last action' }], 'first', { onChange: () => rebuild() });
        const follow = v.toggle('follow evaluated node', true);
        const frames = () => [{ k: 0, note: 'Only terminal nodes are valued initially. Each step evaluates one decision node after all its children.' }, ...solution.order.map((n, i) => ({
          k: i + 1, cur: n,
          note: `${n.id}, player ${n.p}: child payoffs for the mover are ${n.kids.map(k => solution.values.get(k.n)[n.p - 1]).join(', ')}. Choose “${n.kids[solution.profile[n.id]].a}”; propagate $(${solution.values.get(n).join(', ')})$. ${solution.ties.get(n).length} maximizing action(s) under these continuations.`,
        }))];
        const rebuild = () => { P = randomFiniteTree(v.rng(seed.value), depth.value, branching.value); solution = solveFiniteTree(P.root, tie.value); inspector?.reset(); if (S) S.reset(frames()); };
        v.button('new random tree', () => { seed.set(seed.value % 64 + 1); rebuild(); });
        rebuild();
        inspector = finiteTreeInspector(v, stage, () => P, { onNavigate: () => follow.set(false) });
        S = v.steps({ frames, still: 3 });
        let info;
        v.render(() => {
          const f = S.frame, evaluated = new Set(solution.order.slice(0, f.k)), visibleValues = new Map([...solution.values].filter(([n]) => !n.kids || evaluated.has(n)));
          const active = follow.value ? f.cur || P.root : undefined;
          info = { focus: inspector.draw({ focus: active, values: visibleValues, profile: Object.fromEntries([...evaluated].map(n => [n.id, solution.profile[n.id]])), ties: new Map([...solution.ties].filter(([n]) => evaluated.has(n))) }), evaluated: f.k };
        });
        v.readout(() => `${P.nodes.length} nodes, ${P.leaves.length} terminal histories; branching ${branching.value}, depth ${depth.value}, seed ${seed.value}. Evaluated ${info.evaluated} of ${solution.order.length} decision nodes.\nInspecting ${info.focus.node.id}: ${info.focus.history}. Root payoff for the complete ${tie.value}-tie solution: $(${solution.value.join(', ')})$. This is one solution, not necessarily a unique payoff or profile.`);
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Zermelo: chess is determined',
      statement: String.raw`Consider a finite two-player game of perfect information with no chance moves whose outcomes are *win for player 1*, *draw* or *win for player 2* (chess is such a game once the draw rules guarantee that play is finite). Then exactly one of the following holds: player 1 has a strategy that forces a win; player 2 has a strategy that forces a win; or both players have strategies that guarantee at least a draw. The game is **determined**: there is a value of the game, and with best play from the start it is realised.`,
      idea: String.raw`Assign terminal histories the fixed player-1 payoffs $+1,0,-1$. At a player-1 node take the maximum of the child values; at a player-2 node take their minimum. Induction on the finite remaining tree proves that each player can guarantee the resulting value against every opposing strategy. A root value $+1$ gives player 1 a winning strategy, $-1$ gives player 2 one, and $0$ gives each a strategy guaranteeing at least a draw. The pictures use alternating moves and values for the next player: a node is winning if some child is losing for the opponent, losing if every child is winning for the opponent, and drawn otherwise. This finite-tree proof is a modern formulation. Zermelo's original argument instead uses sets of continuations and explicitly allows infinite play as a draw.`,
      caption: String.raw`Pick a game; the computer has solved every position reachable from the empty board. Each empty square is coloured by what the player to move gets by playing there: green = forces a win, gold = draw, red = loses against best play. Click squares to play (the other side is played by the computer if the switch is on) and watch the colours change. The bars count all reachable positions by value for the player to move.`,
      credit: 'Ernst Zermelo, 1913 (chess); modern finite-tree formulation',
      scope: String.raw`A finite rooted game tree, two players who prefer their own win to a draw to a loss, observed histories and no chance moves. Modern chess fits only after its termination rules are specified. Zermelo's 1913 paper, pp.501–504, instead permits infinite play as a draw; this widget does not reproduce his continuation sets or proposed move bound. The three small line games are solved exhaustively without symmetry reduction, stopping immediately on a completed line. Undo removes one individual move, including a computer reply. Saved states include the board and the complete undo history.`,
      deps: ['game-4.2'],
      refs: ['Zermelo (1913), Proceedings of the Fifth ICM, vol. II, pp.501–504', 'Bonanno (2024), §3.5, Theorem 3.5.2, pp.92–93'],
      tags: ['determinacy', 'chess', 'combinatorial game'],
      links: { source: 'https://www.mathunion.org/fileadmin/ICM/Proceedings/ICM1912.2/ICM1912.2.ocr.pdf#page=503', textbook: 'https://faculty.econ.ucdavis.edu/faculty/bonanno/PDF/GT_book.pdf#page=92', wikipedia: 'https://en.wikipedia.org/wiki/Zermelo%27s_theorem_(game_theory)' },
      verify: false,
      viz(v) {
        const GAMES = DETERMINACY_GAMES, cache = {};
        const setup = key => cache[key] || (cache[key] = solveLineGame(GAMES[key]));
        let key = 'ttt', G = setup(key), st = G.empty, hist = [];
        const sg = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 330, title: 'the board (values for the player to move)' });
        const sb = v.stage({ x: [0.3, 3.7], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 0.8, yticks: [], xticks: [[1, 'loss'], [2, 'draw'], [3, 'win']], xlabel: 'value for the player to move', title: 'all reachable positions' });
        const game = v.select('game', Object.keys(GAMES).map((k) => ({ value: k, label: GAMES[k].label })), key, { onChange: (k) => { key = k; G = setup(k); st = G.empty; hist = []; } });
        const tg = v.toggle('computer replies after your move', true);
        v.shareState('line-game board and undo history', {
          get: () => ({ game: key, board: st, history: hist.slice() }),
          validate: d => !!d && typeof d.game === 'string' && Object.hasOwn(GAMES, d.game) && validLineHistory(setup(d.game), d.board, d.history),
          set: d => { game.set(d.game); key = d.game; G = setup(key); st = d.board; hist = d.history.slice(); },
        });
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
      statement: String.raw`In the finite deterministic perfect-information model of game-4.1, each decision node starts a **subgame** containing that node and all its descendants, with the same movers, actions and terminal payoffs. A pure profile is a **subgame perfect equilibrium** (SPE) if its restriction to every subgame, including the whole game, is a Nash equilibrium (game-1.3). Thus no player gains by replacing any of her contingent choices in any subgame while the opponents' complete plans stay fixed. Terminal subgames, if included, impose no conditions. Every SPE is a Nash equilibrium; a Nash equilibrium can fail a proper-subgame test.

For this finite model, it is equivalent to check every single-node deviation: at each decision node its mover cannot improve by changing just that action while retaining the profile's later choices. This equivalence requires a test at every node, including off-path nodes; it does not mean that checking only deviations on the initial path is sufficient.`,
      idea: String.raw`A root-game Nash test compares whole strategies from the initial history; changing only a decision that remains unreachable cannot change the root payoff. Subgame perfection instead starts the comparison at each history. To prove the single-node criterion, assume that no one-action deviation helps at any node. Take any multi-action deviation and undo a deepest changed decision of the deviator. All later decisions are already prescribed, so the local condition says that undoing this choice cannot lower the deviator's payoff, either from that node or from the starting subgame. Repeat until all changes have been undone. Finiteness makes the reduction terminate, proving that the entire deviation could not improve on the profile. In the entry example, fighting when it pays the incumbent less than acceptance fails its own subgame test, even when the entrant stays out and that choice is off-path. Ties are weak best replies and must all be retained.`,
      caption: String.raw`The entrant chooses Out or In; after In the incumbent chooses Fight or Accept. The sliders cover every half-unit payoff, including the incumbent's tie at 1 and the entrant's tie at 0. Click any table cell to show its path. Green cells are pure SPE; red cells are pure Nash equilibria that fail a subgame test. Unshaded cells fail Nash. The readout lists every pure equilibrium, including multiple SPE at ties; it does not classify mixed equilibria.`,
      credit: 'Selten, 1965',
      deps: ['game-4.1', 'game-1.3'],
      refs: ['Osborne & Rubinstein (1994), Definition 97.2 and Lemma 98.2; notes pp.114–115', 'Bonanno (2024), Definition 4.4.1'],
      tags: ['subgame perfection', 'credible threat'],
      links: { source: 'https://faculty.econ.ucdavis.edu/faculty/bonanno/PDF/GT_book.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Subgame_perfect_equilibrium' },
      verify: false,
      viz(v) {
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1.05, title: 'entry game (payoffs: entrant, incumbent)' });
        const M = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 0.95, title: 'strategic form' });
        const TB = v.table(M, { rows: 2, cols: 2, square: false, cellAspect: 1.8, maxCell: 62, size: 15, labelSize: 12.5, rowLabels: ['Out', 'In'], colLabels: ['Fight', 'Accept'], rowLabelColor: () => 'blue', colLabelColor: () => 'orange', cornerLabel: 'E \\ I' });
        const sf = v.slider('incumbent’s payoff if it fights an entrant', -2, 3, -0.5, { step: 0.5 });
        const sl = v.slider('entrant’s payoff if fought', -3, 0, -1, { step: 0.5 });
        let sel = [1, 1];
        M.onClick((x, y) => { const c = TB.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        v.shareState('selected entry profile', { get: () => sel.slice(), validate: x => Array.isArray(x) && x.length === 2 && x.every(a => a === 0 || a === 1), set: x => { sel = x.slice(); } });
        let info;
        v.render(() => {
          const f = sf.value, l = sl.value;
          const result = entryEquilibria(f, l), P = result.P;
          const F = strategicForm(P), ne = result.nash;
          // F.S1 order: Out, In ; F.S2: Fight, Accept
          const spe = result.spe;
          const isSPE = (i, j) => spe.some(([a, b]) => a === i && b === j);
          const play = playBeh(P, asBeh(P, F.S1[sel[0]], F.S2[sel[1]])), end = [...play.leafP.keys()][0], onp = ancestors(end);
          T.setView([-1.4, 2.7], [-3.0, 0.8]);
          const n2 = P.nodes[2];
          // subgame box
          T.rect(n2.x - 0.9, -2.8, n2.x + 0.9, n2.y + 0.5, { fill: 'purple', fillAlpha: 0.07, color: 'purple', width: 1.5, dash: true });
          T.text('subgame', n2.x + 0.85, -2.75, { align: 'right', baseline: 'bottom', size: 11.5, color: 'purple', weight: 700 });
          drawTree(T, P, {
            edgeColor: (e) => (onp.has(e.to) && onp.has(e.from) ? 'gold' : (e.from === n2 && e.a === 'Fight' && ne.some(([a, b]) => b === 0 && a === 0) && f < 1 ? 'red' : null)),
            edgeWidth: (e) => (onp.has(e.to) && onp.has(e.from) ? 4.5 : 1.6),
            nodeTag: (n) => (isLeaf(n) ? null : `P${n.p}`),
          });
          TB.draw({
            data: F.U, fill: (i, j) => (ne.some(([a, b]) => a === i && b === j) ? (isSPE(i, j) ? ['green', 0.32] : ['red', 0.25]) : null), highlight: [[sel[0], sel[1], 'gold']],
          });
          info = { ne, spe, f, l, F, selected: sel.slice() };
        });
        v.readout(() => {
          const { ne, spe, f, l } = info, nameOf = ([i, j]) => `(${['Out', 'In'][i]}, ${['Fight', 'Accept'][j]})`;
          const sub = f > 1 ? 'The incumbent strictly prefers Fight.' : f === 1 ? 'The incumbent is indifferent: Fight and Accept are both optimal in its subgame.' : 'The incumbent strictly prefers Accept; an off-path Fight threat is not credible.';
          return `pure Nash: ${ne.map(nameOf).join('; ')}\npure SPE (${spe.length}): ${spe.map(nameOf).join('; ')}\n${sub} ${l === 0 ? 'Against Fight the entrant is indifferent between Out and In.' : 'Against Fight the entrant strictly prefers Out.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Kuhn: perfect-information games have a pure subgame perfect equilibrium',
      statement: String.raw`Every finite deterministic extensive game with perfect information, nonempty action sets at decision nodes and real terminal payoffs (game-4.1), has a **pure subgame perfect equilibrium** (game-4.4). Backward induction (game-4.2), selecting one maximizing action at each evaluated node, constructs one. Varying tie selections consistently throughout the recursion yields exactly all pure SPE.

Existence does not imply uniqueness of the profile, path or payoff. A sufficient condition for a unique pure SPE is that each player assigns distinct payoffs to every two distinct terminal histories. Ties can allow several pure SPE, but a tie need not create several initial outcomes. The theorem concerns a finite tree, not merely a finite number of stages with infinitely many available actions.`,
      idea: String.raw`Induct on height. A terminal root has the unique empty profile. Otherwise select a pure SPE in every child subgame by induction. Players other than the root mover cannot choose a different child, and cannot improve inside it. The mover chooses the largest of her finitely many continuation payoffs; even if she also changes later choices, the selected child-subgame equilibrium prevents an improvement there. Thus the assembled profile is Nash in the whole game and in every proper subgame. Conversely, restricting any pure SPE to child subgames gives their pure SPE, and its root action must maximize those prescribed continuation payoffs; induction therefore reconstructs it by backward induction. If each player's payoffs distinguish all terminal histories, induction makes every such maximizing action unique. Infinite action sets can defeat attainment even in one stage: a single player choosing $a\in(0,1)$ with payoff $a$ has no optimal pure strategy. Chance moves and their expected-payoff extension are outside the deterministic model illustrated here.

The induction is strong induction on the finite tree height (ALG 2.5), with the terminal game at height zero as the base case. At height h+1, every child subgame has some height at most h, possibly different from its siblings, so the induction hypothesis supplies its complete pure SPE, including choices off the eventual root path. Select one such profile in every child and maximize the root mover's payoff over the finitely many resulting continuations. A deviator cannot improve inside any selected child by the child equilibrium property, and the root mover cannot improve by selecting another child because of that maximization. The same induction also proves the converse: restricting any pure SPE to each child supplies one of the recursively admitted profiles, while its root action must be a maximizer. Thus the recursion retains exactly all pure SPE when ties are kept. This uses the height of a finite game tree, not an assertion about infinite-horizon games.`,
      caption: String.raw`The complete seeded binary tree is solved, including off-path nodes; the inspector shows one node and its immediate children without compressing dozens of leaf labels. Root/parent/previous/next and child clicks reach every original node. At the inspected decision node, choose action 1 or 2 to edit the complete profile; “corrupt a choice” starts from the computed profile and selects one strictly worse choice, when available. The verifier tests all subgames by allowing each player to change all her own decisions; red rings mark exactly the failing subgames. A failure can leave the root-game Nash test passing; it need not affect every ancestor. Restore returns to the chosen first/last tie solution. The count plot compares all pure profiles with decision-node evaluations, not an empirical runtime benchmark.`,
      credit: 'Kuhn, 1953 (modern pure-SPE formulation)',
      deps: ['game-4.2', 'game-4.4', 'alg-2.5'],
      refs: ['Osborne & Rubinstein (1994), Proposition 99.2 and following uniqueness discussion; notes pp.114–115', 'Bonanno (2024), §§3.2, 4.4'],
      tags: ['subgame perfection', 'existence'],
      links: { source: 'https://faculty.econ.ucdavis.edu/faculty/bonanno/PDF/GT_book.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Backward_induction' },
      verify: false,
      viz(v) {
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.1, title: 'inspected node and the current pure profile' });
        const C = v.stage({ x: [.7, 5.3], y: [-.4, 10.2], axes: 'box', gutter: true, height: 340, weight: .9, xlabel: 'binary-tree depth', ylabel: 'log₁₀ of count', title: 'pure profiles versus decision nodes' });
        let P, solution, profile, inspector, changed = null;
        const depth = v.select('depth', [2, 3, 4, 5].map(d => ({ value: d, label: String(d) })), 4, { onChange: () => rebuild() });
        const seed = v.slider('tree seed', 1, 64, 3, { int: true, onChange: () => rebuild() });
        const tie = v.select('ties', [{ value: 'first', label: 'first action' }, { value: 'last', label: 'last action' }], 'first', { onChange: () => rebuild() });
        const restore = () => { profile = { ...solution.profile }; changed = null; };
        const rebuild = () => { P = randomFiniteTree(v.rng(seed.value), depth.value, 2, 5); solution = solveFiniteTree(P.root, tie.value); restore(); inspector?.reset(); };
        v.button('new random tree', () => { seed.set(seed.value % 64 + 1); rebuild(); });
        rebuild(); inspector = finiteTreeInspector(v, T, () => P, { maxNodes: 63 });
        for (const action of [0, 1]) v.button(`choose action ${action + 1}`, () => { const n = inspector.node; if (n.kids) { profile[n.id] = action; changed = n.id; } });
        v.button('corrupt a choice', () => {
          restore();
          const candidates = P.nodes.filter(n => n.kids && n.kids.some(k => solution.values.get(k.n)[n.p - 1] < solution.values.get(n)[n.p - 1]));
          if (!candidates.length) return;
          const n = candidates[(seed.value - 1) % candidates.length], a = n.kids.findIndex(k => solution.values.get(k.n)[n.p - 1] < solution.values.get(n)[n.p - 1]);
          profile[n.id] = a; changed = n.id; inspector.go(n);
        });
        v.button('restore profile', restore);
        v.shareState('edited complete profile', { get: () => P.nodes.filter(n => n.kids).map(n => profile[n.id]),
          validate: x => Array.isArray(x) && x.length >= 3 && x.length <= 31 && x.every(a => a === 0 || a === 1),
          set: x => { const nodes = P.nodes.filter(n => n.kids); if (x.length !== nodes.length) throw new Error('Saved profile does not match this tree.'); profile = Object.fromEntries(nodes.map((n, i) => [n.id, x[i]])); changed = null; } });
        v.legend([{ color: 'red', label: 'number of complete pure profiles' }, { color: 'green', label: 'decision-node evaluations' }]);
        let info;
        v.render(() => {
          const check = checkFiniteProfile(P.root, profile), focus = inspector.draw({ values: check.values, profile, badSet: check.badSet });
          const pts = [1, 2, 3, 4, 5].map(d => [d, binaryTreeCounts(d)]);
          C.path(pts.map(([d, n]) => [d, n.profilesLog10]), { color: 'red', width: 2.5 });
          C.path(pts.map(([d, n]) => [d, n.nodesLog10]), { color: 'green', width: 2.5 });
          pts.forEach(([d, n]) => { C.dot(d, n.profilesLog10, { r: 4, color: 'red' }); C.dot(d, n.nodesLog10, { r: 4, color: 'green' }); });
          C.vline(depth.value, { color: 'gold', width: 1.5 });
          info = { check, focus, changed };
        });
        v.readout(() => {
          const { check: ck, focus } = info, decisions = solution.order.length;
          return `Pure SPE: ${ck.spe ? 'yes' : 'no'}; root-game Nash: ${ck.nash ? 'yes' : 'no'}. ${ck.bad} of ${ck.total} decision-node subgames fail; terminal subgames pass automatically. Current root payoff $(${ck.value.join(', ')})$.\nInspecting ${focus.node.id}: ${focus.history}. ${focus.node.kids ? `Selected action: ${profile[focus.node.id] + 1} (${focus.node.kids[profile[focus.node.id]].a}).` : 'Terminal payoff; no action to edit.'}\nBinary depth ${depth.value}, seed ${seed.value}: ${P.nodes.length} nodes, ${P.leaves.length} terminal histories, ${decisions} decision-node evaluations; $2^{${decisions}}$ complete pure profiles (${(2 ** decisions).toLocaleString('en-US').replace(/,/g, ' ')}). Computed profile uses ${tie.value}-action ties; arbitrary edits are checked separately.`;
        });
      },
    },
  ],
};
