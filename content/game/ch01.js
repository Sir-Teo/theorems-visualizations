// Game Theory & Social Choice — Chapter 1: Strategic games and Nash equilibrium

// ---------- shared helpers ----------
// House style for two-player games: player 1 chooses rows (blue), player 2 chooses columns (orange); pure Nash
// equilibria are green, the reader's current cell is gold, and a profitable deviation is an arrow in the colour of
// the player who deviates. Payoff tables are G = { R: row names, C: column names, U[i][j] = [u1, u2] }.
const C1 = 'blue', C2 = 'orange', EPS = 1e-9;
const FONT = (size, w = 600) => `${w} ${size}px Inter, system-ui, sans-serif`;
const nm = (x) => { const r = Math.round(x * 100) / 100; return String(r === 0 ? 0 : r).replace('-', '−'); };
const idx = (n) => Array.from({ length: n }, (_, k) => k);
const copyU = (U) => U.map((row) => row.map((c) => c.slice()));
const mkGame = (R, C, U, extra = {}) => ({ R: R.slice(), C: C.slice(), U: copyU(U), ...extra });
const prof = (G, i, j) => `(${G.R[i]}, ${G.C[j]})`;
/** Player 1's best replies to column j (among the rows listed), and player 2's best replies to row i. */
function br1(U, j, rows = idx(U.length)) { const m = Math.max(...rows.map((i) => U[i][j][0])); return rows.filter((i) => U[i][j][0] >= m - EPS); }
function br2(U, i, cols = idx(U[0].length)) { const m = Math.max(...cols.map((j) => U[i][j][1])); return cols.filter((j) => U[i][j][1] >= m - EPS); }
const isNE = (U, i, j) => br1(U, j).includes(i) && br2(U, i).includes(j);
function pureNE(U) { const out = []; U.forEach((row, i) => row.forEach((_, j) => { if (isNE(U, i, j)) out.push([i, j]); })); return out; }
const listNE = (G, ne) => (ne.length ? ne.map(([i, j]) => prof(G, i, j)).join(', ') : 'none');
/** Each player's most profitable unilateral deviation from (i, j): {r: {to, gain} | null, c: {to, gain} | null}. */
function deviations(U, i, j) {
  const b1 = br1(U, j), b2 = br2(U, i), t1 = b1.includes(i) ? i : b1[0], t2 = b2.includes(j) ? j : b2[0];
  const g1 = U[t1][j][0] - U[i][j][0], g2 = U[i][t2][1] - U[i][j][1];
  return { r: g1 > EPS ? { to: t1, gain: g1 } : null, c: g2 > EPS ? { to: t2, gain: g2 } : null };
}
/** Arrow in pixels on a canvas context. */
function arrowPx(v, c, ax, ay, bx, by, col, w = 2, head = 8, alpha = 1) {
  const L = Math.hypot(bx - ax, by - ay); if (L < 3) return;
  const ux = (bx - ax) / L, uy = (by - ay) / L, hs = Math.min(head, L * 0.5);
  c.save(); c.strokeStyle = c.fillStyle = v.color(col, alpha); c.lineWidth = w; c.lineCap = 'round';
  c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx - ux * hs * 0.8, by - uy * hs * 0.8); c.stroke();
  c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - ux * hs - uy * hs * 0.5, by - uy * hs + ux * hs * 0.5); c.lineTo(bx - ux * hs + uy * hs * 0.5, by - uy * hs - ux * hs * 0.5); c.closePath(); c.fill();
  c.restore();
}
/**
 * Draw the bimatrix game G on stage s (pixel layout inside o.box = [left, top, right, bottom], default the whole stage).
 * o: style 'pair' (u1, u2) | 'split' (Schelling: u1 bottom-left, u2 top-right, each shaded on its own scale);
 *    br (underline best replies, default true), ne (shade pure equilibria, default true), sel [i, j] (gold cell),
 *    arrows 'none' | 'sel' | 'all' (profitable deviations), deadR / deadC (Sets of struck-out rows / columns),
 *    fill(i, j) → [colour, alpha], tint(i, j, k) → colour of payoff k, rowHL / colHL (tinted row / column),
 *    sub(i, j) → small corner tag, players ['Player 1', 'Player 2'] or false, maxW, maxH, size.
 * Returns the layout {X0, Y0, cw, ch, cx(j), cy(i), hit(x, y)} (hit takes data coordinates).
 */
function bimatrix(v, s, G, o = {}) {
  const c = s.ctx, U = G.U, m = G.R.length, n = G.C.length;
  const box = o.box || [0, 0, s.width, s.height];
  const deadR = o.deadR || new Set(), deadC = o.deadC || new Set();
  const liveR = idx(m).filter((i) => !deadR.has(i)), liveC = idx(n).filter((j) => !deadC.has(j));
  const ls = o.labelSize ?? 13, P = o.players === false ? null : o.players || ['Player 1', 'Player 2'];
  c.save(); c.font = FONT(ls, 650);
  const rlw = Math.max(...G.R.map((r) => c.measureText(r).width)) + 16; c.restore();
  const lw = rlw + (P ? 22 : 0), lh = 24 + (P ? 18 : 0), pad = o.pad ?? 6;
  const cw = Math.min(o.maxW ?? 120, (box[2] - box[0] - 2 * pad - lw) / n);
  const ch = Math.min(o.maxH ?? 72, (box[3] - box[1] - 2 * pad - lh) / m);
  const X0 = Math.round((box[0] + box[2] - lw - n * cw) / 2 + lw), Y0 = Math.round((box[1] + box[3] - lh - m * ch) / 2 + lh);
  const cx = (j) => X0 + (j + 0.5) * cw, cy = (i) => Y0 + (i + 0.5) * ch;
  const ne = o.ne === false ? [] : pureNE(U), isNe = (i, j) => ne.some(([a, b]) => a === i && b === j);
  const all1 = U.flat().map((u) => u[0]), all2 = U.flat().map((u) => u[1]);
  const lo1 = Math.min(...all1), hi1 = Math.max(...all1), lo2 = Math.min(...all2), hi2 = Math.max(...all2);
  c.save();
  // header bands and labels
  c.fillStyle = v.color('muted', 0.08); c.fillRect(X0, Y0 - 24, n * cw, 24); c.fillRect(X0 - rlw, Y0, rlw, m * ch);
  c.font = FONT(ls, 650); c.textBaseline = 'middle'; c.textAlign = 'center';
  G.C.forEach((t, j) => { c.fillStyle = v.color(deadC.has(j) ? 'faint' : C2); c.fillText(t, cx(j), Y0 - 12); });
  G.R.forEach((t, i) => { c.fillStyle = v.color(deadR.has(i) ? 'faint' : C1); c.fillText(t, X0 - rlw / 2, cy(i)); });
  if (P) {
    c.font = FONT(12, 700); c.fillStyle = v.color(C2); c.fillText(P[1], X0 + (n * cw) / 2, Y0 - 34);
    c.save(); c.translate(X0 - rlw - 11, Y0 + (m * ch) / 2); c.rotate(-Math.PI / 2); c.fillStyle = v.color(C1); c.fillText(P[0], 0, 0); c.restore();
  }
  // cell backgrounds
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    const x = X0 + j * cw, y = Y0 + i * ch, dead = deadR.has(i) || deadC.has(j);
    c.fillStyle = v.color('panel'); c.fillRect(x, y, cw, ch);
    if (o.style === 'split') {
      const a1 = 0.04 + 0.42 * (U[i][j][0] - lo1) / (hi1 - lo1 || 1), a2 = 0.04 + 0.42 * (U[i][j][1] - lo2) / (hi2 - lo2 || 1);
      c.fillStyle = v.color(C1, a1); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + ch); c.lineTo(x + cw, y + ch); c.closePath(); c.fill();
      c.fillStyle = v.color(C2, a2); c.beginPath(); c.moveTo(x, y); c.lineTo(x + cw, y); c.lineTo(x + cw, y + ch); c.closePath(); c.fill();
      c.strokeStyle = v.color('faint', 0.8); c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + cw, y + ch); c.stroke();
    }
    const f = o.fill && o.fill(i, j);
    if (f) { c.fillStyle = v.color(f[0], f[1] ?? 0.2); c.fillRect(x, y, cw, ch); }
    else if (isNe(i, j) && !dead) { c.fillStyle = v.color('green', 0.15); c.fillRect(x, y, cw, ch); }
    if (dead) { c.fillStyle = v.color('faint', 0.2); c.fillRect(x, y, cw, ch); }
  }
  if (o.colHL != null) { c.fillStyle = v.color(C1, 0.08); c.fillRect(X0 + o.colHL * cw, Y0 - 24, cw, m * ch + 24); }
  if (o.rowHL != null) { c.fillStyle = v.color(C2, 0.08); c.fillRect(X0 - rlw, Y0 + o.rowHL * ch, n * cw + rlw, ch); }
  // grid
  c.strokeStyle = v.color('faint', 0.75); c.lineWidth = 1; c.beginPath();
  for (let i = 1; i < m; i++) { const y = Math.round(Y0 + i * ch) + 0.5; c.moveTo(X0 - rlw, y); c.lineTo(X0 + n * cw, y); }
  for (let j = 1; j < n; j++) { const x = Math.round(X0 + j * cw) + 0.5; c.moveTo(x, Y0 - 24); c.lineTo(x, Y0 + m * ch); }
  c.stroke();
  c.strokeStyle = v.color('muted', 0.7); c.lineWidth = 1.3; c.strokeRect(X0 + 0.5, Y0 + 0.5, n * cw - 1, m * ch - 1);
  // payoffs
  const fs = o.size ?? Math.max(10, Math.min(18, ch * 0.3, cw * (o.style === 'split' ? 0.2 : 0.16)));
  const txt = (str, X, Y, align, col, size, under, alpha = 1) => {
    c.font = FONT(size, 650); c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = v.color(col, alpha); c.fillText(str, X, Y);
    if (under) { const w = c.measureText(str).width, x0 = align === 'right' ? X - w : align === 'center' ? X - w / 2 : X; c.fillRect(x0 - 1, Y + size * 0.58, w + 2, 2.2); }
  };
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    const dead = deadR.has(i) || deadC.has(j), a = dead ? 0.32 : 1, u = U[i][j];
    const b1 = o.br !== false && !dead && br1(U, j, liveR).includes(i), b2 = o.br !== false && !dead && br2(U, i, liveC).includes(j);
    const k1 = (o.tint && o.tint(i, j, 0)) || C1, k2 = (o.tint && o.tint(i, j, 1)) || C2;
    const x = X0 + j * cw, y = Y0 + i * ch;
    if (o.style === 'split') {
      txt(nm(u[0]), x + cw * 0.28, y + ch * 0.7, 'center', k1, fs * 1.05, b1, a);
      txt(nm(u[1]), x + cw * 0.72, y + ch * 0.3, 'center', k2, fs * 1.05, b2, a);
    } else {
      txt(nm(u[0]), cx(j) - 6, cy(i), 'right', k1, fs, b1, a);
      txt(',', cx(j), cy(i), 'center', 'muted', fs, false, a);
      txt(nm(u[1]), cx(j) + 6, cy(i), 'left', k2, fs, b2, a);
    }
    if (o.sub) { const t = o.sub(i, j); if (t) { c.font = FONT(10, 600); c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillStyle = v.color('muted', 0.9); c.fillText(t, x + cw - 4, y + ch - 3); } }
  }
  // struck-out strategies
  c.strokeStyle = v.color('red', 0.55); c.lineWidth = 2;
  for (const i of deadR) { c.beginPath(); c.moveTo(X0 - rlw + 4, cy(i)); c.lineTo(X0 + n * cw - 4, cy(i)); c.stroke(); }
  for (const j of deadC) { c.beginPath(); c.moveTo(cx(j), Y0 - 22); c.lineTo(cx(j), Y0 + m * ch - 4); c.stroke(); }
  // equilibrium and selection outlines
  for (const [i, j] of ne) if (!deadR.has(i) && !deadC.has(j)) { c.strokeStyle = v.color('green'); c.lineWidth = 2; c.strokeRect(X0 + j * cw + 1.5, Y0 + i * ch + 1.5, cw - 3, ch - 3); }
  if (o.sel) { const [i, j] = o.sel; c.strokeStyle = v.color('gold'); c.lineWidth = 3; c.strokeRect(X0 + j * cw + 3, Y0 + i * ch + 3, cw - 6, ch - 6); }
  // deviation arrows
  const from = o.arrows === 'all' ? liveR.flatMap((i) => liveC.map((j) => [i, j])) : o.arrows === 'sel' && o.sel ? [o.sel] : [];
  for (const [i, j] of from) {
    const d = deviations(U, i, j);
    if (d.r) { const x = X0 + j * cw + Math.min(16, cw * 0.12) + 5 * i, dir = Math.sign(d.r.to - i); arrowPx(v, c, x, cy(i) + dir * ch * 0.04, x, cy(d.r.to) - dir * ch * 0.14, C1, 2.2, 8); }
    if (d.c) { const y = Y0 + i * ch + Math.min(14, ch * 0.2) + 4 * j, dir = Math.sign(d.c.to - j); arrowPx(v, c, cx(j) + dir * cw * 0.04, y, cx(d.c.to) - dir * cw * 0.14, y, C2, 2.2, 8); }
  }
  c.restore();
  return {
    X0, Y0, cw, ch, m, n, cx, cy, lw: rlw, lh,
    hit(x, y) {
      const px = s.X(x), py = s.Y(y), j = Math.floor((px - X0) / cw), i = Math.floor((py - Y0) / ch);
      if (i >= 0 && i < m && j >= 0 && j < n) return { i, j };
      if (i >= 0 && i < m && px < X0 && px >= X0 - rlw) return { i, j: -1 };
      if (j >= 0 && j < n && py < Y0 && py >= Y0 - 24) return { i: -1, j };
      return null;
    },
  };
}
/** Click a cell to select it (gold); two integer sliders then edit its payoffs. o: {game(), layout(), onEdit, onSelect, min, max}. */
function payoffEditor(v, s, o) {
  const ed = { sel: o.sel || [0, 0] };
  const mk = (k) => v.slider(`gold cell: $u_${k + 1}$`, o.min ?? -5, o.max ?? 10, 0, { int: true, onChange: (x) => { const G = o.game(), [i, j] = ed.sel; if (G.U[i] && G.U[i][j]) { G.U[i][j][k] = x; if (o.onEdit) o.onEdit(); } } });
  ed.s1 = mk(0); ed.s2 = mk(1);
  ed.sync = () => { const G = o.game(); ed.sel = [Math.min(ed.sel[0], G.R.length - 1), Math.min(ed.sel[1], G.C.length - 1)]; const u = G.U[ed.sel[0]][ed.sel[1]]; ed.s1.set(u[0]); ed.s2.set(u[1]); };
  s.onClick((x, y) => { const L = o.layout(), h = L && L.hit(x, y); if (h && h.i >= 0 && h.j >= 0) { ed.sel = [h.i, h.j]; ed.sync(); if (o.onSelect) o.onSelect(); } });
  ed.sync();
  return ed;
}
const showStage = (S, on) => { S.el.hidden = !on; S.el.style.display = on ? '' : 'none'; };

// ---------- the classic two-by-two games (presets) ----------
const CLASSICS = {
  pd: { label: 'Prisoner’s Dilemma', G: mkGame(['C', 'D'], ['C', 'D'], [[[3, 3], [0, 5]], [[5, 0], [1, 1]]]) },
  stag: { label: 'Stag Hunt', G: mkGame(['Stag', 'Hare'], ['Stag', 'Hare'], [[[4, 4], [0, 3]], [[3, 0], [3, 3]]]) },
  chicken: { label: 'Chicken', G: mkGame(['Swerve', 'Straight'], ['Swerve', 'Straight'], [[[2, 2], [1, 3]], [[3, 1], [0, 0]]]) },
  pennies: { label: 'Matching Pennies', G: mkGame(['Heads', 'Tails'], ['Heads', 'Tails'], [[[1, -1], [-1, 1]], [[-1, 1], [1, -1]]]) },
  coord: { label: 'Coordination', G: mkGame(['Left', 'Right'], ['Left', 'Right'], [[[2, 2], [0, 0]], [[0, 0], [1, 1]]]) },
  bos: { label: 'Bach or Stravinsky', G: mkGame(['Bach', 'Strav.'], ['Bach', 'Strav.'], [[[2, 1], [0, 0]], [[0, 0], [1, 2]]]) },
};

export default {
  collection: 'game',
  chapter: 1,
  title: 'Strategic games and Nash equilibrium',
  summary: String.raw`A strategic game lists the players, the actions open to each, and how each player ranks the possible outcomes. A Nash equilibrium is a profile in which nobody gains by deviating alone — a fixed point of the players' best responses. The classic two-by-two games show what can happen: the Prisoner's Dilemma has a unique equilibrium that is bad for everyone, coordination games have several, and Matching Pennies has none in pure strategies. Deleting dominated strategies step by step solves some games outright — the beauty contest collapses to zero, and the public goods game to free riding — while the war of attrition shows equilibria in which someone must back down.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Strategic-form game',
      credit: 'John von Neumann, 1928; von Neumann & Morgenstern, 1944',
      statement: String.raw`A **strategic game** (a game in strategic or normal form) consists of
(a) a finite set $N$ of **players**;
(b) for each player $i\in N$, a nonempty set $A_i$ of **actions** (pure strategies);
(c) for each player $i$, a complete and transitive **preference relation** $\succsim_i$ on the set $A = \prod_{j\in N} A_j$ of **action profiles** $a = (a_j)_{j\in N}$.

The players choose simultaneously, none seeing the others' choices, and the profile $a$ fixes the outcome. Preferences are usually represented by **payoff functions** $u_i: A\to\R$ with $u_i(a)\ge u_i(b) \iff a\succsim_i b$; any strictly increasing transformation of $u_i$ represents the same preferences, hence the same game. One writes $a_{-i}$ for the actions of all players other than $i$ and $(a_i', a_{-i})$ for the profile in which $i$ alone switches to $a_i'$. With two players and finitely many actions the game is a **bimatrix**: rows are player 1's actions, columns player 2's, and cell $(r, c)$ holds the pair $\bigl(u_1(r,c),\,u_2(r,c)\bigr)$.`,
      idea: String.raw`The definition strips a strategic situation to three ingredients: who decides, what each can do, and how each ranks every combination of choices. Only each player's *ranking* of profiles matters, because the analysis only ever compares $u_i$ across player $i$'s own alternatives — it never compares one player's numbers with another's or adds them up (once players randomize, game-2.1, the numbers matter up to positive affine maps, as in expected utility, micro-13.2). The essential feature is interdependence: $u_i$ depends on the whole profile, so what is best for one player can depend on what the others do. Simultaneity is a statement about information, not clocks: drawn as a tree, the second mover's decision nodes form a single information set (game-4.9).`,
      caption: String.raw`Click a cell to select it (gold) and set its payoffs with the sliders. Each cell is split: player 1's payoff bottom-left in blue, player 2's top-right in orange, each shaded on its own player's scale. The right panel shows the same game as **each player's ranking** of the profiles — lines that cross mark opposed interests — or as a **game tree**, where the dashed line joins player 2's nodes into one information set. *Rescale $u_1$* changes player 1's numbers by an increasing map: the table changes, the ranking — and so the game — does not.`,
      deps: ['micro-4.3'],
      refs: ['Osborne §2.1', 'MSZ §4.1'],
      tags: ['strategic form', 'preferences'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Normal-form_game' },
      viz(v) {
        const base = {
          '2x2': mkGame(['T', 'B'], ['L', 'R'], [[[3, 1], [0, 0]], [[1, 2], [2, 3]]]),
          '2x3': mkGame(['T', 'B'], ['L', 'C', 'R'], [[[4, 1], [0, 3], [2, 2]], [[1, 4], [3, 0], [2, 1]]]),
          '3x3': mkGame(['T', 'M', 'B'], ['L', 'C', 'R'], [[[4, 3], [1, 1], [2, 5]], [[3, 0], [5, 4], [0, 2]], [[2, 2], [0, 6], [6, 1]]]),
        };
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 310, title: 'the payoff table' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 310, title: 'the same game, seen differently' });
        let L = null, rescaled = false;
        const size = v.select('actions', [{ value: '2x2', label: '2 × 2' }, { value: '2x3', label: '2 × 3' }, { value: '3x3', label: '3 × 3' }], '3x3', { onChange: () => { rescaled = false; ed.sync(); } });
        const view = v.select('right panel', [{ value: 'rank', label: 'rankings' }, { value: 'tree', label: 'game tree' }], 'rank');
        const G = () => base[size.value];
        const ed = payoffEditor(v, A, { game: G, layout: () => L, onEdit: () => { rescaled = false; } });
        const rng = v.rng(11);
        v.button('Rescale $u_1$ (increasing map)', () => {
          const g = G(), vals = [...new Set(g.U.flat().map((u) => u[0]))].sort((a, b) => a - b), map = new Map();
          let w = rng.int(-5, -1); const gaps = vals.map(() => rng.int(1, 3));
          const span = gaps.slice(1).reduce((t, x) => t + x, 0); if (w + span > 10) w = 10 - span;
          vals.forEach((x, k) => { if (k) w += gaps[k]; map.set(x, Math.max(-5, w)); });
          g.U.forEach((row) => row.forEach((u) => { u[0] = map.get(u[0]); }));
          rescaled = true; ed.sync();
        });
        const profiles = (g) => idx(g.R.length).flatMap((i) => idx(g.C.length).map((j) => [i, j]));
        function drawTree(g, sel) {
          const m = g.R.length, n = g.C.length, N = m * n, ry = 0.86, y2 = 0.57, yl = 0.29;
          const x2 = (i) => (i + 0.5) / m, xl = (i, j) => (i * n + j + 0.5) / N;
          const on1 = (i) => i === sel[0], on2 = (i, j) => i === sel[0] && j === sel[1];
          for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) B.line(x2(i), y2, xl(i, j), yl, { color: on2(i, j) ? 'gold' : 'muted', width: on2(i, j) ? 3.2 : 1.5 });
          for (let i = 0; i < m; i++) B.line(0.5, ry, x2(i), y2, { color: on1(i) ? 'gold' : 'muted', width: on1(i) ? 3.2 : 1.5 });
          B.line(x2(0) - 0.035, y2, x2(m - 1) + 0.035, y2, { color: C2, width: 1.8, dash: [5, 4] });
          for (let i = 0; i < m; i++) {
            const mx = (0.5 + x2(i)) / 2, my = (ry + y2) / 2, side = x2(i) < 0.49 ? -1 : x2(i) > 0.51 ? 1 : 1;
            B.text(g.R[i], mx, my, { dx: 10 * side, align: side < 0 ? 'right' : 'left', color: C1, size: 12.5, weight: 700 });
            for (let j = 0; j < n; j++) {
              const t = 0.42, ex = x2(i) + (xl(i, j) - x2(i)) * t, ey = y2 + (yl - y2) * t, sd = xl(i, j) < x2(i) - 1e-6 ? -1 : xl(i, j) > x2(i) + 1e-6 ? 1 : 1;
              B.text(g.C[j], ex, ey, { dx: 6 * sd, align: sd < 0 ? 'right' : 'left', color: C2, size: 11, weight: 700 });
            }
          }
          B.dot(0.5, ry, { r: 12, color: C1 }); B.text('1', 0.5, ry, { align: 'center', color: 'panel', size: 12.5, weight: 700, halo: false });
          for (let i = 0; i < m; i++) { B.dot(x2(i), y2, { r: 11, color: C2 }); B.text('2', x2(i), y2, { align: 'center', color: 'panel', size: 12, weight: 700, halo: false }); }
          for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
            const x = xl(i, j), u = g.U[i][j], on = on2(i, j);
            B.dot(x, yl, { r: on ? 5 : 3.5, color: on ? 'gold' : 'ink' });
            B.text(nm(u[0]), x, yl - 0.075, { align: 'center', color: C1, size: 12.5, weight: on ? 800 : 600 });
            B.text(nm(u[1]), x, yl - 0.145, { align: 'center', color: C2, size: 12.5, weight: on ? 800 : 600 });
          }
          B.text('dashed: one information set — 2 moves without seeing 1’s choice', 0.5, 0.035, { align: 'center', color: 'muted', size: 11 });
        }
        function drawRank(g, sel) {
          const P = profiles(g), xs = [0.36, 0.64], cols = [C1, C2], ys = [[], []];
          for (const k of [0, 1]) {
            const vals = [...new Set(P.map(([i, j]) => g.U[i][j][k]))].sort((a, b) => a - b), K = vals.length;
            P.forEach(([i, j], q) => { const lev = vals.indexOf(g.U[i][j][k]); ys[k][q] = 0.13 + 0.68 * (K > 1 ? lev / (K - 1) : 0.5); });
            B.arrow(xs[k], 0.07, xs[k], 0.87, { color: cols[k], width: 1.6, head: 7, alpha: 0.7 });
            B.text(k ? 'player 2 prefers ↑' : 'player 1 prefers ↑', xs[k], 0.94, { align: 'center', color: cols[k], size: 12, weight: 700 });
          }
          P.forEach(([i, j], q) => { if (i !== sel[0] || j !== sel[1]) B.line(xs[0], ys[0][q], xs[1], ys[1][q], { color: 'faint', width: 1.5 }); });
          const qs = P.findIndex(([i, j]) => i === sel[0] && j === sel[1]);
          B.line(xs[0], ys[0][qs], xs[1], ys[1][qs], { color: 'gold', width: 3.2 });
          const ctx = B.ctx;
          for (const k of [0, 1]) {
            const groups = new Map();
            P.forEach(([i, j], q) => { const y = ys[k][q]; if (!groups.has(y)) groups.set(y, []); groups.get(y).push(q); });
            for (const [y, qq] of groups) {
              B.dot(xs[k], y, { r: 4.5, color: qq.includes(qs) ? 'gold' : cols[k] });
              const str = qq.map((q) => prof(g, P[q][0], P[q][1])).join('  ') + `   ${nm(g.U[P[qq[0]][0]][P[qq[0]][1]][k])}`;
              let size = 11.5; ctx.save(); ctx.font = FONT(size, 600); const w = ctx.measureText(str).width; ctx.restore();
              const room = (k ? 1 - xs[1] : xs[0]) * B.width - 16; if (w > room) size = Math.max(8, (size * room) / w);
              B.text(str, xs[k], y, { dx: k ? 10 : -10, align: k ? 'left' : 'right', color: qq.includes(qs) ? 'ink' : 'muted', size, weight: qq.includes(qs) ? 700 : 500 });
            }
          }
          B.text('heights are ranks, not payoffs: rescaling cannot move them', 0.5, 0.025, { align: 'center', color: 'muted', size: 10.5 });
        }
        let st = null;
        v.render(() => {
          const g = G();
          L = bimatrix(v, A, g, { style: 'split', sel: ed.sel, br: false, ne: false, maxH: 78 });
          if (view.value === 'tree') drawTree(g, ed.sel); else drawRank(g, ed.sel);
          const P = profiles(g); let con = 0, dis = 0;
          for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) {
            const [i, j] = P[a], [k, l] = P[b], s1 = Math.sign(g.U[i][j][0] - g.U[k][l][0]), s2 = Math.sign(g.U[i][j][1] - g.U[k][l][1]);
            if (s1 * s2 > 0) con++; else if (s1 * s2 < 0) dis++;
          }
          const best = (k) => { const mx = Math.max(...P.map(([i, j]) => g.U[i][j][k])); return P.filter(([i, j]) => g.U[i][j][k] === mx).map(([i, j]) => prof(g, i, j)).join(' or '); };
          st = { g, n: P.length, tau: (con - dis) / ((P.length * (P.length - 1)) / 2), b1: best(0), b2: best(1) };
        });
        v.legend([[C1, 'player 1 (rows): $u_1$'], [C2, 'player 2 (columns): $u_2$'], ['gold', 'selected profile']]);
        v.readout(() => {
          if (!st) return '';
          const { g, n, tau, b1, b2 } = st, [i, j] = ed.sel, u = g.U[i][j];
          const mood = tau > 0.999 ? '**identical rankings** (pure common interest)' : tau < -0.999 ? '**exactly opposite rankings** (strictly competitive)' : tau > 0.3 ? 'mostly common interest' : tau < -0.3 ? 'mostly opposed interests' : '**mixed motives**';
          return `$|A_1|\\times|A_2| = ${g.R.length}\\times${g.C.length} = ${n}$ action profiles · gold profile ${prof(g, i, j)}: $u_1 = ${nm(u[0])}$, $u_2 = ${nm(u[1])}$ · player 1 likes ${b1} best, player 2 likes ${b2} best · rank agreement (Kendall $\\tau$) $= ${v.fix(tau, 2)}$: ${mood}${rescaled ? ' · **$u_1$ rescaled: every number changed, the ranking did not**' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Best responses',
      credit: 'Antoine Augustin Cournot, 1838 (reaction functions)',
      statement: String.raw`In a strategic game, a **best response** of player $i$ to a list $a_{-i}$ of the other players' actions is an action that maximizes $i$'s payoff while the others' actions are held fixed. The **best-response correspondence** is
$$B_i(a_{-i}) = \{\, a_i\in A_i \;:\; u_i(a_i, a_{-i}) \ge u_i(a_i', a_{-i}) \text{ for all } a_i'\in A_i \,\}.$$
$B_i(a_{-i})$ is nonempty when $A_i$ is finite (or compact with $u_i$ continuous in $a_i$), and it may contain several actions; when it is always a single action, $b_i(a_{-i})$ is called the **best-response function**. In a bimatrix, player 1's best responses to column $c$ are the rows holding the largest first entry of that column, and player 2's best responses to row $r$ are the columns holding the largest second entry of that row.`,
      idea: String.raw`A best response is a one-person decision problem: freeze everyone else and optimize. With finitely many actions it is a maximum over finitely many numbers, which always exists, and ties make $B_i$ a set. With a continuum of actions a maximizer exists when payoffs are continuous on a compact set, and for a smooth concave payoff it solves the first-order condition $\partial u_i/\partial a_i = 0$: for $u_i = a_i\,(c + b\,a_j - a_i)$ this gives the line $b_i(a_j) = (c + b\,a_j)/2$, clipped at the edges of the action set. Its slope says whether actions are *strategic complements* ($b > 0$: I do more when you do more) or *substitutes* ($b < 0$). A Nash equilibrium (game-1.3) is a point where the players' best responses are consistent with one another.`,
      caption: String.raw`*Finite actions:* best replies are underlined — blue under the largest first number in each column, orange under the largest second number in each row. Click a cell to fix the opponents' actions: the bars show player 1's payoffs against that column and player 2's against that row, best replies solid; the sliders edit the gold cell (make a tie and $B_i$ has two elements). *Continuous actions:* drag the gold point $(a_1, a_2)$. Left: player 1's payoff against the current $a_2$, peaking at $b_1(a_2)$. Right: every row is shaded by $u_1$ relative to its own best value, so the dark ridge *is* the best-response curve; the arrows point to each player's best reply. Try $b < 0$.`,
      deps: ['game-1.1'],
      refs: ['Osborne §2.8'],
      tags: ['best response'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Best_response' },
      viz(v) {
        const M = v.M;
        const mode = v.select('actions', [{ value: 'fin', label: 'finite (table)' }, { value: 'cont', label: 'continuous' }], 'fin', { onChange: () => layout() });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, title: 'best replies underlined' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, title: 'one decision problem per opponent action' });
        const Cc = v.stage({ x: [0, 10], y: [-20, 30], axes: 'box', height: 300, xlabel: 'a₁', ylabel: 'u₁', title: 'player 1’s payoff, $a_2$ held fixed' });
        const D = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', height: 300, xlabel: 'a₁', ylabel: 'a₂', title: 'best-response curves $b_1$ (blue), $b_2$ (orange)' });
        const g = mkGame(['T', 'M', 'B'], ['L', 'C', 'R'], [[[2, 1], [4, 3], [1, 3]], [[5, 2], [1, 0], [3, 4]], [[3, 4], [2, 2], [4, 1]]]);
        let L = null;
        const ed = payoffEditor(v, A, { game: () => g, layout: () => L, sel: [0, 1] });
        const cS = v.slider('$c$ (stand-alone value)', 0, 8, 4, { step: 0.1 });
        const bS = v.slider('$b$ (complementarity)', -1, 1, 0.5, { step: 0.05 });
        const shade = v.select('shade', [{ value: 1, label: '$u_1$ by row' }, { value: 2, label: '$u_2$ by column' }], 1);
        const H = D.handle(7, 3, { color: 'gold', label: 'a', constrain: { x: [0, 10], y: [0, 10] } });
        function layout() {
          const fin = mode.value === 'fin';
          showStage(A, fin); showStage(B, fin); showStage(Cc, !fin); showStage(D, !fin);
          ed.s1.el.hidden = ed.s2.el.hidden = !fin; cS.el.hidden = bS.el.hidden = shade.el.hidden = fin;
          v.invalidate();
        }
        layout();
        const bestR = (aj) => M.clamp((cS.value + bS.value * aj) / 2, 0, 10);
        const u = (ai, aj) => ai * (cS.value + bS.value * aj - ai);
        function bars(y0, y1, vals, names, best, col, title, lo, hi) {
          const n = vals.length, base = y0 + 0.08, top = y1 - 0.1, Y = (x) => base + ((x - lo) / (hi - lo)) * (top - base), w = 0.5 / n;
          B.text(title, 0.5, y1 - 0.03, { align: 'center', color: col, size: 12.5, weight: 700 });
          B.line(0.08, Y(0), 0.92, Y(0), { color: 'muted', width: 1 });
          vals.forEach((x, k) => {
            const xc = 0.14 + (0.72 * (k + 0.5)) / n, on = best.includes(k);
            B.rect(xc - w / 2, Y(0), xc + w / 2, Y(x), { fill: col, fillAlpha: on ? 0.85 : 0.22, color: col, width: on ? 2 : 1 });
            B.text(nm(x), xc, Y(x), { dy: x >= 0 ? -9 : 9, align: 'center', color: on ? 'ink' : 'muted', size: 12, weight: on ? 800 : 500 });
            B.text(names[k] + (on ? ' ★' : ''), xc, base - 0.035, { align: 'center', color: on ? col : 'muted', size: 12, weight: 700 });
          });
        }
        let st = null;
        v.render(() => {
          if (mode.value === 'fin') {
            const [i, j] = ed.sel;
            L = bimatrix(v, A, g, { sel: ed.sel, ne: false, colHL: j, rowHL: i });
            const all = g.U.flat().flat(), lo = Math.min(0, ...all), hi = Math.max(1, ...all);
            const v1 = g.R.map((_, k) => g.U[k][j][0]), v2 = g.C.map((_, k) => g.U[i][k][1]);
            const b1 = br1(g.U, j), b2 = br2(g.U, i);
            bars(0.52, 1, v1, g.R, b1, C1, `player 1’s payoffs if 2 plays ${g.C[j]}`, lo, hi);
            bars(0.0, 0.48, v2, g.C, b2, C2, `player 2’s payoffs if 1 plays ${g.R[i]}`, lo, hi);
            const both = []; g.U.forEach((row, a) => row.forEach((_, b) => { if (isNE(g.U, a, b)) both.push(prof(g, a, b)); }));
            st = { fin: true, i, j, b1, b2, both };
          } else {
            const c = cS.value, b = bS.value, a1 = H.x, a2 = H.y, k1 = c + b * a2, best1 = bestR(a2), best2 = bestR(a1);
            // left: u1(·, a2)
            let lo = Infinity, hi = -Infinity; for (let x = 0; x <= 10; x += 0.1) { const y = u(x, a2); lo = Math.min(lo, y); hi = Math.max(hi, y); }
            const pad = Math.max(2, (hi - lo) * 0.12); Cc.setView([0, 10], [lo - pad, hi + pad]);
            Cc.hline(0, { color: 'faint', width: 1 });
            Cc.fn((x) => u(x, a2), { domain: [0, 10], color: C1, width: 2.8 });
            Cc.vline(best1, { color: 'green', dash: [5, 4], width: 1.4 });
            Cc.dot(best1, u(best1, a2), { r: 6, color: 'green', label: `b₁(a₂) = ${v.fix(best1, 2)}`, labelPos: best1 > 6 ? 'nw' : 'ne' });
            Cc.dot(a1, u(a1, a2), { r: 5.5, color: 'gold', label: 'a₁', labelPos: a1 > best1 ? 'se' : 'sw' });
            // right: shaded payoff, best-response curves
            const sh = shade.value, base = v.rgb(sh === 1 ? C1 : C2), pnl = v.rgb('panel');
            D.raster((x, y) => {
              const own = sh === 1 ? x : y, oth = sh === 1 ? y : x, k = c + b * oth, bst = M.clamp(k / 2, 0, 10);
              const top = bst * (k - bst), bot = Math.min(0, 10 * (k - 10)), t = (own * (k - own) - bot) / (top - bot || 1), a = 0.6 * Math.pow(M.clamp(t, 0, 1), 3);
              return [pnl[0] + (base[0] - pnl[0]) * a, pnl[1] + (base[1] - pnl[1]) * a, pnl[2] + (base[2] - pnl[2]) * a];
            }, { res: 3, key: `${c}|${b}|${sh}|${v.color(C1)}|${v.color('panel')}` });
            D.axes();
            D.curve((t) => [bestR(t), t], 0, 10, { color: C1, width: 2.8 });
            D.curve((t) => [t, bestR(t)], 0, 10, { color: C2, width: 2.8 });
            const as = c / (2 - b), inBox = as >= 0 && as <= 10;
            if (inBox) { D.dot(as, as, { r: 9, hollow: true, color: 'green', width: 2.5 }); D.text('mutual best replies (1.3)', as, as, { dx: 12, dy: 12, color: 'green', size: 11.5, weight: 700, align: 'left', baseline: 'top' }); }
            D.line(0, a2, 10, a2, { color: 'gold', dash: [4, 4], width: 1.2 });
            D.arrow(a1, a2, best1, a2, { color: C1, width: 2.4, head: 9 });
            D.arrow(a1, a2, a1, best2, { color: C2, width: 2.4, head: 9 });
            st = { fin: false, c, b, a1, a2, best1, best2, k1, as, inBox };
          }
        });
        v.legend([[C1, 'player 1'], [C2, 'player 2'], ['gold', 'current choice'], ['green', 'best reply / crossing']]);
        v.readout(() => {
          if (!st) return '';
          if (st.fin) {
            const { i, j, b1, b2, both } = st, set = (G, ks) => `\\{\\text{${ks.map((k) => G[k]).join(', ')}}\\}`;
            return `$B_1(\\text{${g.C[j]}}) = ${set(g.R, b1)}$ — player 1's best ${b1.length > 1 ? 'replies (a tie)' : 'reply'} when 2 plays ${g.C[j]} · $B_2(\\text{${g.R[i]}}) = ${set(g.C, b2)}$${b2.length > 1 ? ' (a tie: two best replies)' : ''} · cells with both entries underlined: ${both.length ? both.join(', ') : 'none'} — these are the Nash equilibria of game-1.3`;
          }
          const { a1, a2, best1, best2, as, inBox } = st;
          return `$b_1(a_2) = \\mathrm{clip}\\bigl((c + b\\,a_2)/2\\bigr) = ${v.fix(best1, 2)}$: at your $a_1 = ${v.fix(a1, 2)}$ player 1 earns $${v.fix(u(a1, a2), 2)}$, the best reply earns $${v.fix(u(best1, a2), 2)}$ · $b_2(a_1) = ${v.fix(best2, 2)}$ · slope $b/2 = ${v.fix(bS.value / 2, 3)}$: ${bS.value > 0 ? '**strategic complements**' : bS.value < 0 ? '**strategic substitutes**' : 'independent'} · ${inBox ? `curves cross at $a_1 = a_2 = c/(2-b) = ${v.fix(as, 2)}$` : 'curves cross outside the box'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Nash equilibrium',
      credit: 'John F. Nash, 1950',
      statement: String.raw`A **Nash equilibrium** of a strategic game is an action profile $a^*$ from which no player can gain by changing her own action while the others keep theirs:
$$u_i(a^*_i, a^*_{-i}) \;\ge\; u_i(a_i, a^*_{-i})\qquad\text{for every player } i \text{ and every action } a_i\in A_i.$$
Equivalently $a^*_i\in B_i(a^*_{-i})$ for every $i$: each player's action is a best response to the others' — $a^*$ is a fixed point of the best-response correspondence $a\mapsto B_1(a_{-1})\times\cdots\times B_n(a_{-n})$. In a bimatrix the (pure) Nash equilibria are the cells in which both entries are best replies. A game may have no pure equilibrium (game-1.6), exactly one (game-1.4) or several (game-1.5).`,
      idea: String.raw`The condition is stability against *unilateral* deviations and nothing more: it does not ask that the outcome be good for anyone (game-1.4), and it says nothing about how players get there. One reading is a steady state of players who have learned what others typically do and have no reason to change; another is a self-enforcing agreement — if everyone expects $a^*$, nobody wants to break it. Checking a cell takes one look down its column and one along its row. The arrows of profitable deviations form a directed graph on the cells whose sinks are exactly the equilibria. In a random $m\times n$ game with continuous payoffs, each cell is a best reply for player 1 with probability $1/m$ and for player 2 with probability $1/n$, independently, so the expected number of pure equilibria is exactly $mn\cdot\frac1m\cdot\frac1n = 1$, and the chance that there is none tends to $1/e$ (Dresher, 1970). Existence in general needs mixed strategies (game-2.3).`,
      caption: String.raw`Every cell that is not an equilibrium sends an arrow: blue when player 1 gains by switching rows, orange when player 2 gains by switching columns (each to a best reply). Green cells have no outgoing arrow — they are the Nash equilibria. Pick a classic game, click a cell to inspect it and edit its payoffs, or draw a random game. Right: the number of pure equilibria in 4000 random $n\times n$ games — the average is always 1, the share with none tends to $1/e$, and the gold bar is the game on the left.`,
      deps: ['game-1.2'],
      refs: ['Osborne §2.6', 'MSZ §4.8'],
      tags: ['Nash equilibrium'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Nash_equilibrium' },
      viz(v) {
        const presets = { ...Object.fromEntries(['pd', 'stag', 'chicken', 'pennies', 'coord'].map((k) => [k, CLASSICS[k]])), x3: { label: '3 × 3', G: mkGame(['T', 'M', 'B'], ['L', 'C', 'R'], [[[3, 3], [0, 1], [1, 0]], [[1, 0], [2, 2], [4, 1]], [[0, 2], [1, 4], [2, 3]]]) } };
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1.25, title: 'deviation arrows; equilibria have none' });
        const B = v.stage({ x: [-0.6, 5.6], y: [0, 1], axes: 'box', height: 320, ylabel: 'share of games', xticks: [0, 1, 2, 3, 4, 5], title: 'how many pure equilibria? random $n\\times n$ games' });
        let g = mkGame(presets.x3.G.R, presets.x3.G.C, presets.x3.G.U), L = null, seed = 3;
        const pick = v.select('game', Object.entries(presets).map(([k, p]) => ({ value: k, label: p.label })), 'x3', { onChange: (k) => { const p = presets[k].G; g = mkGame(p.R, p.C, p.U); ed.sync(); if (g.R.length === g.C.length) nS.set(g.R.length); } });
        const ed = payoffEditor(v, A, { game: () => g, layout: () => L, sel: [2, 2] });
        const allArrows = v.toggle('all arrows', true);
        const nS = v.slider('random games: $n\\times n$, $n =$', 2, 10, 3, { int: true });
        v.button('Random game', () => { const r = v.rng(++seed * 7919), m = g.R.length, n = g.C.length; g = mkGame(g.R, g.C, idx(m).map(() => idx(n).map(() => [r.int(0, 9), r.int(0, 9)]))); ed.sync(); });
        const cache = new Map();
        function stats(n) {
          if (cache.has(n)) return cache.get(n);
          const r = v.rng(1000 + n), T = 4000, counts = new Array(n + 1).fill(0), a = new Float64Array(n * n), b = new Float64Array(n * n);
          for (let t = 0; t < T; t++) {
            for (let k = 0; k < n * n; k++) { a[k] = r(); b[k] = r(); }
            let c = 0;
            for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
              let ok = true; for (let k = 0; k < n && ok; k++) { if (a[k * n + j] > a[i * n + j] || b[i * n + k] > b[i * n + j]) ok = false; }
              if (ok) c++;
            }
            counts[c]++;
          }
          const out = { p: counts.map((x) => x / T), mean: counts.reduce((s, x, k) => s + k * x, 0) / T };
          cache.set(n, out); return out;
        }
        let st = null;
        v.render(() => {
          L = bimatrix(v, A, g, { sel: ed.sel, arrows: allArrows.value ? 'all' : 'sel' });
          const ne = pureNE(g.U), n = nS.value, S = stats(n), kmax = Math.max(4, Math.min(n, 6), ne.length);
          const ytop = Math.max(0.5, Math.max(...S.p) * 1.18); B.setView([-0.6, kmax + 0.6], [-0.075 * ytop, ytop]);
          B.setTicks(idx(kmax + 1), null);
          const pois = (k) => Math.exp(-1) / v.M.factorial(k);
          for (let k = 0; k <= kmax; k++) {
            const p = S.p[k] || 0, cur = k === ne.length && g.R.length === n && g.C.length === n;
            B.rect(k - 0.34, 0, k + 0.34, p, { fill: k === 0 ? 'red' : 'green', fillAlpha: 0.35, color: k === 0 ? 'red' : 'green', width: 1.2 });
            if (cur) B.rect(k - 0.4, 0, k + 0.4, Math.max(p, 0.02), { color: 'gold', width: 3 });
            if (p > 0.004) B.text(v.fix(p, 3), k, p, { dy: -9, align: 'center', size: 11, color: 'ink' });
          }
          B.path(idx(kmax + 1).map((k) => [k, pois(k)]), { color: 'purple', width: 1.6, dash: [5, 4] });
          B.dots(idx(kmax + 1).map((k) => [k, pois(k)]), { r: 3.5, color: 'purple' });
          st = { ne, S, n };
        });
        v.legend([[C1, 'player 1 gains by moving'], [C2, 'player 2 gains by moving'], ['green', 'Nash equilibrium', { area: true }], ['purple', 'Poisson(1): the large-$n$ limit', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { ne, S, n } = st, [i, j] = ed.sel, d = deviations(g.U, i, j);
          const here = !d.r && !d.c ? `gold cell ${prof(g, i, j)} **is a Nash equilibrium**: player 1 cannot beat ${nm(g.U[i][j][0])} in column ${g.C[j]}, player 2 cannot beat ${nm(g.U[i][j][1])} in row ${g.R[i]}`
            : `gold cell ${prof(g, i, j)} is **not** an equilibrium: ${[d.r && `player 1 gains ${nm(d.r.gain)} by switching to ${g.R[d.r.to]}`, d.c && `player 2 gains ${nm(d.c.gain)} by switching to ${g.C[d.c.to]}`].filter(Boolean).join('; ')}`;
          return `${here} · pure equilibria: **${listNE(g, ne)}** · random ${n}×${n} games: mean number $${v.fix(S.mean, 3)}$ (exactly 1 in theory), share with none $${v.fix(S.p[0], 3)}$ ($1/e \\approx 0.368$ as $n\\to\\infty$)`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Paradox',
      name: 'Prisoner’s Dilemma',
      credit: 'Merrill Flood & Melvin Dresher, 1950; named by Albert W. Tucker',
      statement: String.raw`Two players each choose to **cooperate** (C) or **defect** (D). Mutual cooperation pays each the *reward* $R$, mutual defection the *punishment* $P$; a defector facing a cooperator gets the *temptation* $T$ and the cooperator the *sucker's payoff* $S$. If
$$T > R > P > S,$$
then D is strictly better than C for each player whatever the other does, so (D, D) is the **unique Nash equilibrium** — yet both players prefer (C, C), because $R > P$. Choices that are individually rational produce an outcome that is worse for everyone: the equilibrium is not Pareto efficient. Other orderings of the four payoffs give different games (Stag Hunt, Chicken, Harmony, Deadlock).`,
      scope: String.raw`Holds for a single play with payoffs ordered $T > R > P > S$ and players who care only about their own payoff; when the game is repeated indefinitely, cooperation can be sustained (game-5.5).`,
      idea: String.raw`Compare D with C column by column: against a cooperator D earns $T > R$, against a defector $P > S$. The advantage holds whichever column player 2 picks, so no belief about the opponent can make C attractive — D *strictly dominates* C (made precise in game-1.7), for both players by symmetry, and the only profile without a profitable deviation is (D, D). The paradox is the gap between individual and collective rationality: in the payoff plane the equilibrium outcome $(P, P)$ lies strictly south-west of $(R, R)$. It is the template for arms races, overfishing, price wars and the public goods game (game-1.9); escaping it requires changing the game — repetition (game-5.2, game-5.5), enforceable contracts, or preferences that are not purely selfish.`,
      caption: String.raw`Tune $T, R, P, S$. In the table every arrow points towards D, and in the payoff plane the equilibrium (D, D) sits inside the green region of outcomes that would make *both* players better off — as long as $T > R > P > S$. Break the ordering and the game changes its name. Below, play against the computer: it best-responds to your last move, always cooperates, or flips a coin. A short sample match is pre-played; press *New match* to start your own. The dashed line is what D would have earned you in every round against the same computer moves — never less than what you got.`,
      deps: ['game-1.3'],
      refs: ['Osborne §2.2'],
      tags: ['prisoner’s dilemma', 'social dilemma'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Prisoner%27s_dilemma' },
      viz(v) {
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 260, minWidth: 380, title: 'the game' });
        const Pl = v.stage({ x: [-0.9, 10.8], y: [-1.3, 10.8], axes: 'box', height: 260, minWidth: 380, title: 'payoff plane: $u_1$ (you) across, $u_2$ up' });
        const Hs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, minWidth: 380, title: 'the last rounds' });
        const Ch = v.stage({ x: [0, 8], y: [0, 30], axes: 'box', height: 200, minWidth: 380, title: 'running payoffs, round by round' });
        const sl = {};
        for (const [k, val, lab] of [['T', 5, 'temptation'], ['R', 3, 'reward'], ['P', 1, 'punishment'], ['S', 0, 'sucker']]) sl[k] = v.slider(`$${k}$ (${lab})`, 0, 10, val, { step: 0.5 });
        const opp = v.select('computer', [{ value: 'br', label: 'best-responds' }, { value: 'allc', label: 'always C' }, { value: 'coin', label: 'coin flip' }], 'br', { onChange: () => replay(SAMPLE) });
        const game = () => { const { T, R, P, S } = Object.fromEntries(Object.entries(sl).map(([k, s]) => [k, s.value])); return { T, R, P, S, G: mkGame(['C', 'D'], ['C', 'D'], [[[R, R], [S, T]], [[T, S], [P, P]]]) }; };
        const SAMPLE = [0, 0, 1, 0, 1, 1];
        let hist = [], rng = v.rng(5), sample = true;
        const compMove = () => {
          if (opp.value === 'allc') return 0;
          if (opp.value === 'coin') return rng() < 0.5 ? 0 : 1;
          const pred = hist.length ? hist[hist.length - 1].you : 0, b = br2(game().G.U, pred);
          return b[b.length - 1];
        };
        const play = (you) => { hist.push({ you, opp: compMove() }); };
        function replay(moves) { hist = []; rng = v.rng(5); for (const m of moves) play(m); sample = moves.length > 0; }
        replay(SAMPLE);
        v.button('Cooperate', () => { if (sample) replay([]); play(0); });
        v.button('Defect', () => { if (sample) replay([]); play(1); });
        v.button('New match', () => replay([]));
        const classify = ({ T, R, P, S }) => {
          if (T > R && R > P && P > S) return 'Prisoner’s Dilemma';
          if (R > T && T > P && P > S) return 'Stag Hunt';
          if (R > T && T >= P && P > S) return 'Stag Hunt (boundary)';
          if (T > R && R > S && S > P) return 'Chicken (Snowdrift)';
          if (T > P && P > R && R > S) return 'Deadlock';
          if (R > T && S > P) return 'Harmony';
          return 'a boundary case (some payoffs tie)';
        };
        let st = null;
        v.render(() => {
          const gm = game(), U = gm.G.U, ne = pureNE(U), last = hist[hist.length - 1];
          bimatrix(v, A, gm.G, { arrows: 'all', players: ['You', 'Computer'], sel: last ? [last.you, last.opp] : null, sub: (i, j) => ['R', 'S | T', 'T | S', 'P'][2 * i + j] });
          // payoff plane
          const pts = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([i, j]) => ({ i, j, x: U[i][j][0], y: U[i][j][1] }));
          for (const [i, j] of ne) Pl.rect(U[i][j][0], U[i][j][1], 10.8, 10.8, { fill: 'green', fillAlpha: 0.1, stroke: false });
          for (const p of pts) {
            const isne = ne.some(([a, b]) => a === p.i && b === p.j), on = last && last.you === p.i && last.opp === p.j;
            const same = pts.filter((q) => Math.abs(q.x - p.x) < 0.6 && Math.abs(q.y - p.y) < 0.6 && (q.i * 2 + q.j) < (p.i * 2 + p.j)).length;
            if (isne) Pl.dot(p.x, p.y, { r: 10, hollow: true, color: 'green', width: 2.5 });
            Pl.dot(p.x, p.y, { r: 6, color: on ? 'gold' : p.i === 0 && p.j === 0 ? 'teal' : 'ink' });
            const right = p.x < 7.5;
            Pl.text(prof(gm.G, p.i, p.j), p.x, p.y, { dx: right ? 14 : -14, dy: 14 * same, align: right ? 'left' : 'right', color: on ? 'gold' : p.i === 0 && p.j === 0 ? 'teal' : 'ink', size: 12.5, weight: 700 });
          }
          if (ne.length) Pl.text('both better off than at the equilibrium', 10.6, 10.5, { align: 'right', baseline: 'top', color: 'green', size: 11, weight: 600 });
          // history strip
          const N = hist.length, show = hist.slice(-10), k0 = N - show.length, w = 0.76 / 10;
          if (!N) Hs.text('press Cooperate or Defect to play a round', 0.6, 0.5, { align: 'center', color: 'muted', size: 13 });
          Hs.text('you', 0.02, 0.7, { color: C1, size: 12, weight: 700 });
          Hs.text('computer', 0.02, 0.42, { color: C2, size: 12, weight: 700 });
          Hs.text('your payoff', 0.02, 0.16, { color: 'muted', size: 11.5 });
          show.forEach((h, q) => {
            const x = 0.22 + (q + 0.5) * w;
            for (const [who, y] of [[h.you, 0.7], [h.opp, 0.42]]) { Hs.rect(x - w * 0.4, y - 0.1, x + w * 0.4, y + 0.1, { fill: who ? 'red' : 'teal', fillAlpha: 0.75, stroke: false }); Hs.text(who ? 'D' : 'C', x, y, { align: 'center', color: 'panel', size: 13, weight: 800, halo: false }); }
            Hs.text(nm(U[h.you][h.opp][0]), x, 0.16, { align: 'center', size: 12, color: 'ink', weight: 600 });
            Hs.text(String(k0 + q + 1), x, 0.92, { align: 'center', size: 10, color: 'muted' });
          });
          if (sample && N) Hs.text('sample match', 0.99, 0.02, { align: 'right', baseline: 'bottom', size: 10.5, color: 'muted' });
          // running payoffs
          let cy = 0, cc = 0, cd = 0; const sy = [[0, 0]], sc = [[0, 0]], sd = [[0, 0]], sr = [[0, 0]];
          hist.forEach((h, q) => { cy += U[h.you][h.opp][0]; cc += U[h.you][h.opp][1]; cd += U[1][h.opp][0]; sy.push([q + 1, cy]); sc.push([q + 1, cc]); sd.push([q + 1, cd]); sr.push([q + 1, (q + 1) * gm.R]); });
          const X = Math.max(6, N), Ymax = Math.max(4, cy, cc, cd, X * gm.R) * 1.12, tk = Math.ceil(X / 10);
          Ch.setView([-0.3, X + 0.3], [-0.09 * Ymax, Ymax]);
          Ch.setTicks(idx(Math.floor(X / tk) + 1).map((k) => k * tk), null);
          Ch.path(sr, { color: 'green', width: 1.6, dash: [2, 3] });
          Ch.path(sd, { color: C1, width: 1.8, dash: [6, 4] });
          Ch.path(sc, { color: C2, width: 2.2 });
          Ch.path(sy, { color: C1, width: 2.6 }); Ch.dots(sy, { r: 3, color: C1 });
          st = { gm, ne, cy, cc, cd, N, regret: cd - cy };
        });
        v.legend([[C1, 'you'], [C2, 'computer'], [C1, 'you, had you played D each round', { dash: true }], ['green', 'both cooperate every round', { dash: true }], ['gold', 'last round played']]);
        v.readout(() => {
          if (!st) return '';
          const { gm, ne, cy, cc, cd, N } = st, name = classify(gm), dom = gm.T > gm.R && gm.P > gm.S;
          const head = `**${name}** · ${dom ? 'D strictly dominates C ($T > R$ and $P > S$)' : `D does not dominate C (${gm.T > gm.R ? '' : '$T \\le R$'}${gm.T <= gm.R && gm.P <= gm.S ? ', ' : ''}${gm.P > gm.S ? '' : '$P \\le S$'})`} · pure equilibria: ${listNE(gm.G, ne)}${ne.length === 1 && ne[0][0] === 1 && ne[0][1] === 1 && gm.R > gm.P ? ` — while (C, C) would give both $R = ${nm(gm.R)} > P = ${nm(gm.P)}$` : ''}`;
          return N ? `${head} · after ${N} round${N > 1 ? 's' : ''}: you ${nm(cy)}, computer ${nm(cc)}; D in every round would have given you ${nm(cd)}${cd > cy ? ` (+${nm(cd - cy)})` : ''}; mutual cooperation would have given each ${nm(N * gm.R)}` : head;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Model',
      name: 'Coordination games: Bach or Stravinsky and the Stag Hunt',
      credit: 'Jean-Jacques Rousseau, 1755 (stag hunt); Luce & Raiffa, 1957; Harsanyi & Selten, 1988 (risk dominance)',
      statement: String.raw`In a **coordination game** both players gain from choosing matching actions, and there are two pure Nash equilibria. In the **Stag Hunt** each hunter either joins a stag hunt, which succeeds only if both join, or hunts hare alone; with payoffs $(\text{Stag},\text{Stag}) = (4,4)$, $(\text{Stag},\text{Hare}) = (0,3)$, $(\text{Hare},\text{Stag}) = (3,0)$, $(\text{Hare},\text{Hare}) = (3,3)$ both (Stag, Stag) and (Hare, Hare) are equilibria: the first is better for both (it is **payoff dominant**), the second is safer. In **Bach or Stravinsky** (the Battle of the Sexes) both want to attend the same concert but disagree on which; each of the two equilibria favours one player. In a $2\times2$ game with equilibria $(r, c)$ and $(r', c')$, the first **risk-dominates** the second when the product of the players' losses from deviating alone is larger there:
$$\bigl[u_1(r,c) - u_1(r',c)\bigr]\bigl[u_2(r,c) - u_2(r,c')\bigr] \;>\; \bigl[u_1(r',c') - u_1(r,c')\bigr]\bigl[u_2(r',c') - u_2(r',c)\bigr].$$`,
      scope: String.raw`Nash equilibrium says which conventions are self-enforcing, not which one is played; that depends on expectations and history outside the model. The basins drawn here assume populations that adjust gradually towards best replies.`,
      idea: String.raw`Equilibrium alone cannot choose between the two conventions; expectations do. A population picture makes this concrete: if a share $y$ of potential partners hunt stag, stag earns $4y$ and hare a sure 3, so stag is a best reply only when $y > 3/4$. If, round after round, some players switch to a best reply against the current mix on the other side, every starting mix flows to one of the two equilibria, and the shares at which each side is indifferent split the square of mixes into two **basins**. In symmetric games the risk-dominant equilibrium has the larger basin — here (Hare, Hare), although (Stag, Stag) pays more — which is why trust is fragile. In Bach or Stravinsky the basins are lopsided in a different way: each equilibrium is favoured by one side. The point where the basins meet is itself an equilibrium, in mixed strategies (game-2.2).`,
      caption: String.raw`Pick a game, or click a cell and edit its payoffs. Right: a population of row players and one of column players; the horizontal axis is the share of row players choosing their first action, the vertical one the share of column players. Each round a fifth of each population switches to its best reply against the other side's current mix, so the gold path from the draggable start flows to an equilibrium corner. The background colours every start by where it ends up — the basins — divided at the indifference shares (dashed). In the Stag Hunt the hare basin is larger although stag pays more; raise the stag payoff and watch the basins trade places. Make the game a Prisoner's Dilemma and one basin swallows the square.`,
      deps: ['game-1.3'],
      refs: ['Osborne §2.3', 'Osborne §2.5'],
      tags: ['coordination', 'equilibrium selection'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stag_hunt' },
      viz(v) {
        const keys = ['stag', 'bos', 'coord', 'pd'];
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 0.9, title: 'two equilibria (green)' });
        const Q = v.stage({ x: [-0.17, 1.04], y: [-0.15, 1.05], axes: false, height: 330, weight: 1.1, title: 'basins of the best-reply dynamics' });
        let g = mkGame(CLASSICS.stag.G.R, CLASSICS.stag.G.C, CLASSICS.stag.G.U), L = null;
        const pick = v.select('game', keys.map((k) => ({ value: k, label: CLASSICS[k].label })), 'stag', { onChange: (k) => { const p = CLASSICS[k].G; g = mkGame(p.R, p.C, p.U); ed.sync(); } });
        const ed = payoffEditor(v, A, { game: () => g, layout: () => L });
        const H = Q.handle(0.62, 0.86, { color: 'gold', label: 'start', constrain: { x: [0, 1], y: [0, 1] } });
        const LAM = 0.2;
        const diff1 = (U, y) => y * (U[0][0][0] - U[1][0][0]) + (1 - y) * (U[0][1][0] - U[1][1][0]);
        const diff2 = (U, x) => x * (U[0][0][1] - U[0][1][1]) + (1 - x) * (U[1][0][1] - U[1][1][1]);
        function flow(U, x, y, keep) {
          const path = keep ? [[x, y]] : null;
          for (let t = 0; t < 140; t++) {
            const d1 = diff1(U, y), d2 = diff2(U, x), tx = d1 > EPS ? 1 : d1 < -EPS ? 0 : x, ty = d2 > EPS ? 1 : d2 < -EPS ? 0 : y;
            x += LAM * (tx - x); y += LAM * (ty - y);
            if (keep) path.push([x, y]);
            if (Math.abs(tx - x) < 2e-3 && Math.abs(ty - y) < 2e-3) break;
          }
          const end = (x > 0.98 ? 1 : x < 0.02 ? 0 : -1) + 2 * (y > 0.98 ? 1 : y < 0.02 ? 0 : -9);
          return { path, corner: end === 3 ? 'TL' : end === 0 ? 'BR' : end === 1 ? 'TR' : end === 2 ? 'BL' : null };
        }
        // corner keys: 'TL' = (row 0, col 0) at (1, 1); 'BR' = (row 1, col 1) at (0, 0); 'TR' = (row 0, col 1) at (1, 0); 'BL' = (row 1, col 0) at (0, 1)
        const CC = { TL: 'teal', BR: 'purple', TR: 'gold', BL: 'pink' }, POS = { TL: [1, 1], BR: [0, 0], TR: [1, 0], BL: [0, 1] }, CELL = { TL: [0, 0], BR: [1, 1], TR: [0, 1], BL: [1, 0] };
        let shareKey = '', shares = {}, legKey = '';
        let st = null;
        v.render(() => {
          const U = g.U, ne = pureNE(U);
          L = bimatrix(v, A, g, { sel: ed.sel, maxH: 92, maxW: 132 });
          const pnl = v.rgb('panel'), rgb = Object.fromEntries(Object.entries(CC).map(([k, c]) => [k, v.rgb(c)])), faint = v.rgb('faint');
          const key = JSON.stringify(U) + v.color('panel') + v.color('teal');
          Q.raster((x, y) => {
            if (x < 0 || x > 1 || y < 0 || y > 1) return null;
            const { corner } = flow(U, x, y, false), c = corner ? rgb[corner] : faint, a = corner ? 0.3 : 0.15;
            return [pnl[0] + (c[0] - pnl[0]) * a, pnl[1] + (c[1] - pnl[1]) * a, pnl[2] + (c[2] - pnl[2]) * a];
          }, { res: 4, key });
          // the unit square of population mixes, with its own axes
          Q.rect(0, 0, 1, 1, { color: 'muted', width: 1.2 });
          for (const t of [0, 0.25, 0.5, 0.75, 1]) {
            Q.line(t, 0, t, -0.015, { color: 'muted', width: 1 }); Q.text(t === 0 || t === 1 ? String(t) : v.fix(t, 2), t, -0.02, { align: 'center', baseline: 'top', size: 10.5, color: 'muted' });
            Q.line(0, t, -0.012, t, { color: 'muted', width: 1 }); Q.text(t === 0 || t === 1 ? String(t) : v.fix(t, 2), -0.018, t, { align: 'right', size: 10.5, color: 'muted' });
          }
          Q.text(`share of row players choosing ${g.R[0]} →`, 0.5, -0.082, { align: 'center', baseline: 'top', size: 11.5, color: C1, weight: 600 });
          const ctx = Q.ctx; ctx.save(); ctx.translate(Q.X(-0.135), Q.Y(0.5)); ctx.rotate(-Math.PI / 2); ctx.font = FONT(11.5, 600); ctx.fillStyle = v.color(C2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`share of column players choosing ${g.C[0]} →`, 0, 0); ctx.restore();
          if (key !== shareKey) {
            shareKey = key; shares = {}; const K = 50;
            for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) { const { corner } = flow(U, (a + 0.5) / K, (b + 0.5) / K, false); const c = corner || 'none'; shares[c] = (shares[c] || 0) + 1 / (K * K); }
          }
          // indifference lines and the tipping point
          const den1 = (U[0][0][0] - U[1][0][0]) - (U[0][1][0] - U[1][1][0]), ys = den1 ? -(U[0][1][0] - U[1][1][0]) / den1 : NaN;
          const den2 = (U[0][0][1] - U[0][1][1]) - (U[1][0][1] - U[1][1][1]), xs = den2 ? -(U[1][0][1] - U[1][1][1]) / den2 : NaN;
          const okx = xs > 0 && xs < 1, oky = ys > 0 && ys < 1;
          if (oky) { Q.line(0, ys, 1, ys, { color: C1, dash: [6, 4], width: 1.6 }); Q.text(`row players indifferent at ${v.fix(ys, 2)}`, 0.02, ys, { dy: ys > 0.5 ? 10 : -9, color: C1, size: 11, weight: 600, align: 'left' }); }
          if (okx) {
            Q.line(xs, 0, xs, 1, { color: C2, dash: [6, 4], width: 1.6 });
            const c2 = Q.ctx; c2.save(); c2.translate(Q.X(xs) + (xs > 0.5 ? -9 : 9), Q.Y(0.03)); c2.rotate(-Math.PI / 2); c2.font = FONT(11, 600); c2.fillStyle = v.color(C2); c2.textAlign = 'left'; c2.textBaseline = 'middle'; c2.fillText(`column players indifferent at ${v.fix(xs, 2)}`, 0, 0); c2.restore();
          }
          if (okx && oky) { Q.dot(xs, ys, { r: 6, hollow: true, color: 'ink', width: 2 }); Q.text('tipping point', xs, ys, { dx: xs > 0.82 ? -10 : 10, dy: ys > 0.25 ? 13 : -13, align: xs > 0.82 ? 'right' : 'left', size: 11.5, weight: 700, color: 'ink' }); }
          for (const [i, j] of ne) {
            const k = Object.keys(CELL).find((q) => CELL[q][0] === i && CELL[q][1] === j), [px, py] = POS[k];
            Q.dot(px, py, { r: 7, color: 'green' });
            Q.text(prof(g, i, j), px, py, { dx: px ? -12 : 12, dy: py ? 13 : -13, align: px ? 'right' : 'left', baseline: py ? 'top' : 'bottom', color: CC[k], size: 12.5, weight: 800 });
          }
          const fl = flow(U, H.x, H.y, true);
          Q.path(fl.path, { color: 'gold', width: 2.6 }); Q.dots(fl.path.filter((_, k) => k % 3 === 0), { r: 2.4, color: 'gold' });
          // deviation-loss products for risk dominance
          let rd = null;
          if (ne.length === 2) {
            const prod = ([i, j]) => (U[i][j][0] - U[1 - i][j][0]) * (U[i][j][1] - U[i][1 - j][1]);
            const [e1, e2] = ne, p1 = prod(e1), p2 = prod(e2);
            const pareto = (a, b) => U[a[0]][a[1]][0] >= U[b[0]][b[1]][0] && U[a[0]][a[1]][1] >= U[b[0]][b[1]][1] && (U[a[0]][a[1]][0] > U[b[0]][b[1]][0] || U[a[0]][a[1]][1] > U[b[0]][b[1]][1]);
            rd = { e1, e2, p1, p2, pd: pareto(e1, e2) ? e1 : pareto(e2, e1) ? e2 : null };
          }
          st = { ne, fl, rd, okx, oky, xs, ys };
          const lk = g.R.join() + g.C.join();
          if (lk !== legKey) { legKey = lk; v.legend([['teal', `basin of ${prof(g, 0, 0)}`, { area: true }], ['purple', `basin of ${prof(g, 1, 1)}`, { area: true }], ['gold', 'adjustment path from the start'], ['green', 'pure equilibrium', { dot: true }]]); }
        });

        v.readout(() => {
          if (!st) return '';
          const { ne, fl, rd } = st, cn = (k) => (k ? prof(g, CELL[k][0], CELL[k][1]) : 'nowhere (it keeps cycling)');
          const bs = Object.entries(shares).filter(([, x]) => x > 0.001).map(([k, x]) => `${k === 'none' ? 'no limit' : prof(g, CELL[k][0], CELL[k][1])} ${Math.round(100 * x)}%`).join(', ');
          let sel = '';
          if (rd) {
            const n1 = prof(g, ...rd.e1), n2 = prof(g, ...rd.e2), r = rd.p1 > rd.p2 ? n1 : rd.p2 > rd.p1 ? n2 : null;
            sel = ` · deviation-loss products: ${n1} ${nm(rd.p1)}, ${n2} ${nm(rd.p2)} → ${r ? `**${r} is risk-dominant**` : 'no risk dominance'}; ${rd.pd ? `**${prof(g, ...rd.pd)} is payoff-dominant**` : 'neither is payoff-dominant (the players disagree)'}`;
          }
          return `pure equilibria: ${listNE(g, ne)} · the gold path ends at **${cn(fl.corner)}** · basin sizes: ${bs}${sel}`;
        });
      },
    },
  ],
};
