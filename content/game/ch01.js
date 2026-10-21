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
  const rowArrow = (i, j, to) => { const x = X0 + j * cw + Math.min(16, cw * 0.12) + 5 * i, dir = Math.sign(to - i); arrowPx(v, c, x, cy(i) + dir * ch * 0.04, x, cy(to) - dir * ch * 0.14, C1, 2.2, 8); };
  const colArrow = (i, j, to) => { const y = Y0 + i * ch + Math.min(14, ch * 0.2) + 4 * j, dir = Math.sign(to - j); arrowPx(v, c, cx(j) + dir * cw * 0.04, y, cx(to) - dir * cw * 0.14, y, C2, 2.2, 8); };
  for (const [i, j] of from) { const d = deviations(U, i, j); if (d.r) rowArrow(i, j, d.r.to); if (d.c) colArrow(i, j, d.c.to); }
  for (const [i, j, i2, j2] of o.arrowList || []) { if (i2 !== i) rowArrow(i, j, i2); else if (j2 !== j) colArrow(i, j, j2); }
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
          // a random strictly increasing map onto integers in [−5, 10]: random gaps of 1–3, shrunk until they fit
          const gaps = vals.map((_, k) => (k ? rng.int(1, 3) : 0)), sum = () => gaps.reduce((t, x) => t + x, 0);
          while (sum() > 15) { const k = gaps.findIndex((x) => x > 1); gaps[k]--; }
          let w = rng.int(-5, 10 - sum());
          vals.forEach((x, k) => { w += gaps[k]; map.set(x, w); });
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
      caption: String.raw`*Finite actions:* best replies are underlined — blue under the largest first number in each column, orange under the largest second number in each row. Click a cell to fix the opponents' actions: the bars show player 1's payoffs against that column and player 2's against that row, best replies solid; the sliders edit the gold cell (make a tie and $B_i$ has two elements). *Continuous actions:* drag the gold point $(a_1, a_2)$. Left: player 1's payoff against the current $a_2$, peaking at $b_1(a_2)$. Right: every row is shaded by how little player 1 loses against her best reply in that row, so the dark ridge *is* the best-response curve; the arrows point to each player's best reply. Try $b < 0$.`,
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
            lo = Math.max(lo, Math.min(-4, hi - 26)); const pad = Math.max(2, (hi - lo) * 0.12); Cc.setView([-0.4, 10.2], [lo - pad, hi + pad]);
            Cc.hline(0, { color: 'faint', width: 1 });
            Cc.fn((x) => u(x, a2), { domain: [0, 10], color: C1, width: 2.8 });
            Cc.vline(best1, { color: 'green', dash: [5, 4], width: 1.4 });
            Cc.dot(best1, u(best1, a2), { r: 6, color: 'green', label: `b₁(a₂) = ${v.fix(best1, 2)}`, labelPos: best1 > 6 ? 'nw' : 'ne' });
            Cc.dot(a1, u(a1, a2), { r: 5.5, color: 'gold', label: 'a₁', labelPos: a1 > best1 ? 'se' : 'sw' });
            // right: shaded payoff, best-response curves
            const sh = shade.value, base = v.rgb(sh === 1 ? C1 : C2), pnl = v.rgb('panel');
            D.raster((x, y) => {
              const own = sh === 1 ? x : y, oth = sh === 1 ? y : x, k = c + b * oth, bst = M.clamp(k / 2, 0, 10);
              const loss = bst * (k - bst) - own * (k - own), a = 0.62 * Math.exp(-loss / 3);
              return [pnl[0] + (base[0] - pnl[0]) * a, pnl[1] + (base[1] - pnl[1]) * a, pnl[2] + (base[2] - pnl[2]) * a];
            }, { res: 3, key: `${c}|${b}|${sh}|${v.color(C1)}|${v.color('panel')}` });
            D.axes();
            D.curve((t) => [bestR(t), t], 0, 10, { color: 'panel', width: 6 }); D.curve((t) => [t, bestR(t)], 0, 10, { color: 'panel', width: 6 });
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
        const B = v.stage({ x: [-0.95, 5.6], y: [0, 1], axes: 'box', height: 320, ylabel: 'share of games', xticks: [0, 1, 2, 3, 4, 5], title: 'how many pure equilibria? random $n\\times n$ games' });
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
          const ytop = Math.max(0.5, Math.max(...S.p) * 1.18); B.setView([-0.95, kmax + 0.6], [-0.075 * ytop, ytop]);
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
      caption: String.raw`Pick a game, or click a cell and edit its payoffs. Right: a population of row players and one of column players; the horizontal axis is the share of row players choosing their first action, the vertical one the share of column players. Each round a tenth of each population switches to its best reply against the other side's current mix, so the gold path from the draggable start flows to an equilibrium corner. The background colours every start by where it ends up — the basins — divided at the indifference shares (dashed). In the Stag Hunt the hare basin is larger although stag pays more; raise the stag payoff and watch the basins trade places. Make the game a Prisoner's Dilemma and one basin swallows the square.`,
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
        const H = Q.handle(0.62, 0.86, { color: 'gold', label: 'start', labelPos: 'w', constrain: { x: [0, 1], y: [0, 1] } });
        const LAM = 0.1;
        const diff1 = (U, y) => y * (U[0][0][0] - U[1][0][0]) + (1 - y) * (U[0][1][0] - U[1][1][0]);
        const diff2 = (U, x) => x * (U[0][0][1] - U[0][1][1]) + (1 - x) * (U[1][0][1] - U[1][1][1]);
        function flow(U, x, y, keep) {
          const path = keep ? [[x, y]] : null;
          for (let t = 0; t < 400; t++) {
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
          A.setTitle(`${ne.length} pure equilibri${ne.length === 1 ? 'um' : 'a'} (green)`);
          const bnd = (shares.none || 0) > 0.001, lk = JSON.stringify(ne) + g.R.join() + g.C.join() + bnd;
          if (lk !== legKey) {
            legKey = lk;
            const items = ne.map(([i, j]) => { const k = Object.keys(CELL).find((q) => CELL[q][0] === i && CELL[q][1] === j); return [CC[k], `basin of ${prof(g, i, j)}`, { area: true }]; });
            v.legend([...items, ...(bnd ? [['faint', 'boundary: circles the tipping point', { area: true }]] : []), ['gold', 'adjustment path from the start'], ['green', 'pure equilibrium', { dot: true }]]);
          }
        });

        v.readout(() => {
          if (!st) return '';
          const { ne, fl, rd } = st, cn = (k) => (k ? prof(g, CELL[k][0], CELL[k][1]) : 'nowhere (it keeps cycling)');
          const bs = Object.entries(shares).filter(([, x]) => x > 0.001).map(([k, x]) => `${k === 'none' ? 'on the boundary' : prof(g, CELL[k][0], CELL[k][1])} ${Math.round(100 * x)}%`).join(', ');
          let sel = '';
          if (rd) {
            const n1 = prof(g, ...rd.e1), n2 = prof(g, ...rd.e2), r = rd.p1 > rd.p2 ? n1 : rd.p2 > rd.p1 ? n2 : null;
            sel = ` · deviation-loss products: ${n1} ${nm(rd.p1)}, ${n2} ${nm(rd.p2)} → ${r ? `**${r} is risk-dominant**` : 'no risk dominance'}; ${rd.pd ? `**${prof(g, ...rd.pd)} is payoff-dominant**` : 'neither is payoff-dominant (the players disagree)'}`;
          }
          return `pure equilibria: ${listNE(g, ne)} · the gold path ends at **${cn(fl.corner)}** · basin sizes: ${bs}${sel}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Model',
      name: 'Matching Pennies: no pure equilibrium',
      statement: String.raw`Two players each show a coin, Heads or Tails. Player 1 wins a point from player 2 if the coins match; player 2 wins a point from player 1 if they differ. The game is **zero-sum** and has **no Nash equilibrium in pure strategies**: in each of the four profiles the loser gains by switching her coin. Rock–Paper–Scissors has the same property with three actions each. An equilibrium does exist once players may randomize — each plays Heads and Tails with probability $\tfrac12$ (game-2.1, game-2.2).`,
      scope: String.raw`A model of pure conflict with no stable deterministic behaviour: it predicts unpredictability. Any small change that gives one player a dominant action (try *one payoff changed*) restores a pure equilibrium.`,
      idea: String.raw`Follow the best replies around the table: at (Heads, Heads) player 2 wants Tails; at (Heads, Tails) player 1 wants Tails; at (Tails, Tails) player 2 wants Heads; at (Tails, Heads) player 1 wants Heads — and we are back where we started. The deviation arrows (game-1.3) form a cycle with no sink, so no cell is a Nash equilibrium, and the dynamic in which players take turns to best-respond never settles. In play this means that any predictable choice can be exploited: an opponent who can forecast your coin always beats it. The only stable behaviour is to be unpredictable — the mixed equilibrium of game-2.2, whose predictions hold up remarkably well in penalty kicks and tennis serves (game-2.8).`,
      caption: String.raw`Left: the arrows of the players' best replies chase each other around the table, and the gold token — the players taking turns to best-respond — circles forever. Switch to Rock–Paper–Scissors (a six-cell cycle) or to *one payoff changed*, where the chase stops at an equilibrium. Right: you are the matcher against the computer, which predicts your next move from your history and best-responds to its prediction. A pre-played sample of a "human-looking" sequence shows how quickly patterns are punished; press *New match* and try to beat it. Only the computer that plays at random cannot be exploited — and cannot exploit you.`,
      deps: ['game-1.3'],
      refs: ['Osborne §2.4'],
      tags: ['matching pennies', 'zero-sum'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Matching_pennies' },
      viz(v) {
        const RPS = mkGame(['Rock', 'Paper', 'Scissors'], ['Rock', 'Paper', 'Scissors'], idx(3).map((i) => idx(3).map((j) => { const w = i === j ? 0 : (i - j + 3) % 3 === 1 ? 1 : -1; return [w, -w]; })));
        const games = {
          pennies: { label: 'Matching Pennies', G: CLASSICS.pennies.G, sample: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0], start: [0, 0] },
          rps: { label: 'Rock–Paper–Scissors', G: RPS, sample: [0, 0, 1, 0, 0, 2, 0, 1, 0, 0], start: [0, 0] },
          settle: { label: 'one payoff changed', G: mkGame(['Heads', 'Tails'], ['Heads', 'Tails'], [[[1, 2], [-1, 1]], [[-1, 1], [1, -1]]]), sample: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0], start: [1, 1] },
        };
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'best replies chase each other' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'you (the matcher) against the computer' });
        const which = v.select('game', Object.entries(games).map(([k, g]) => ({ value: k, label: g.label })), 'pennies', { onChange: () => { setButtons(); replay(games[which.value].sample); v.restart(); } });
        const comp = v.select('computer', [{ value: 'last', label: 'counters your last move' }, { value: 'habit', label: 'learns your habits' }, { value: 'rand', label: 'plays at random' }], 'habit', { onChange: () => replay(games[which.value].sample) });
        const G = () => games[which.value].G;
        let hist = [], rng = v.rng(9), sample = true;
        function predict() {
          const mine = hist.map((h) => h.you), n = G().R.length;
          if (!mine.length) return null;
          if (comp.value === 'last') return mine[mine.length - 1];
          const last = mine[mine.length - 1], cnt = new Array(n).fill(0), all = new Array(n).fill(0);
          mine.forEach((m, k) => { all[m]++; if (k && mine[k - 1] === last) cnt[m]++; });
          const use = cnt.some((c) => c > 0) ? cnt : all;
          return use.indexOf(Math.max(...use));
        }
        function compMove() {
          const n = G().C.length;
          if (comp.value === 'rand') return { m: rng.int(0, n - 1), pred: null };
          const pr = predict();
          if (pr == null) return { m: rng.int(0, n - 1), pred: null };
          const b = br2(G().U, pr); return { m: b[rng.int(0, b.length - 1)], pred: pr };
        }
        const play = (you) => { const { m, pred } = compMove(); hist.push({ you, opp: m, pred }); };
        function replay(moves) { hist = []; rng = v.rng(9); for (const m of moves) play(m); sample = moves.length > 0; }
        const btns = idx(3).map((k) => v.button('move', () => { if (sample) replay([]); play(k); }));
        v.button('Random move', () => { if (sample) replay([]); play(Math.floor(Math.random() * G().R.length)); });
        v.button('New match', () => replay([]));
        function setButtons() { const g = G(); btns.forEach((b, k) => { b.hidden = k >= g.R.length; if (k < g.R.length) b.textContent = g.R[k]; }); }
        setButtons(); replay(games.pennies.sample);
        function brPath(U, i, j, steps) {
          const path = [[i, j, -1]]; let turn = 0;
          for (let t = 0; t < steps; t++) {
            const d = deviations(U, i, j); let moved = -1;
            for (let k = 0; k < 2 && moved < 0; k++) { const who = (turn + k) % 2; if (who === 0 && d.r) { i = d.r.to; moved = 0; } else if (who === 1 && d.c) { j = d.c.to; moved = 1; } }
            if (moved < 0) break;
            turn = 1 - moved; path.push([i, j, moved]);
          }
          return path;
        }
        const STEP = 0.9;
        let st = null;
        v.animate((t) => {
          const g = G(), U = g.U, s0 = games[which.value].start, path = brPath(U, s0[0], s0[1], 200), n = path.length, settled = n < 201;
          let k, f;
          if (settled) { const T = (n - 1) * STEP + 2.5, tt = t % T; k = Math.min(n - 1, Math.floor(tt / STEP)); f = k >= n - 1 ? 0 : Math.min(1, (tt - k * STEP) / (STEP * 0.6)); }
          else { k = Math.floor(t / STEP) % (n - 1); f = Math.min(1, (t % STEP) / (STEP * 0.6)); }
          const edges = new Map(); for (let q = 0; q + 1 < n; q++) { const e = [path[q][0], path[q][1], path[q + 1][0], path[q + 1][1]]; edges.set(e.join(), e); }
          const L = bimatrix(v, A, g, { arrowList: [...edges.values()], players: ['You', 'Computer'], maxH: g.R.length > 2 ? 72 : 90, maxW: 130 });
          const at = (i, j) => [L.cx(j), L.cy(i) + L.ch * 0.3];
          for (let q = Math.max(0, k - 3); q < k; q++) { const [px, py] = at(path[q][0], path[q][1]); A.dot(A.invX(px), A.invY(py), { r: 4 + 1.2 * (3 - (k - q)), color: 'gold', alpha: 0.2 + 0.18 * (3 - (k - q)) }); }
          const nx = path[Math.min(k + 1, n - 1)], e = f * f * (3 - 2 * f), [x0, y0] = at(path[k][0], path[k][1]), [x1, y1] = at(nx[0], nx[1]);
          A.dot(A.invX(x0 + (x1 - x0) * e), A.invY(y0 + (y1 - y0) * e), { r: 8, color: 'gold' });
          const mover = k + 1 < n ? nx[2] : -1;
          A.corner(mover < 0 ? 'nobody wants to move: an equilibrium' : mover === 0 ? `you switch to ${g.R[nx[0]]}` : `computer switches to ${g.C[nx[1]]}`, 'tl', { color: mover < 0 ? 'green' : mover === 0 ? C1 : C2, weight: 700 });
          // play panel: the last rounds and the running score
          const N = hist.length, show = hist.slice(-12), k0 = N - show.length, w = 0.74 / 12, letter = (s) => s[0];
          B.text('you', 0.02, 0.88, { color: C1, size: 12, weight: 700 });
          B.text('computer', 0.02, 0.74, { color: C2, size: 12, weight: 700 });
          B.text('you win', 0.02, 0.61, { color: 'muted', size: 11.5 });
          if (!N) B.text('pick a move to play a round', 0.6, 0.74, { align: 'center', color: 'muted', size: 13 });
          show.forEach((h, q) => {
            const x = 0.25 + (q + 0.5) * w, r = U[h.you][h.opp][0];
            B.rect(x - w * 0.42, 0.835, x + w * 0.42, 0.925, { fill: C1, fillAlpha: 0.75, stroke: false });
            B.rect(x - w * 0.42, 0.695, x + w * 0.42, 0.785, { fill: C2, fillAlpha: 0.75, stroke: false });
            B.text(letter(g.R[h.you]), x, 0.88, { align: 'center', color: 'panel', size: 12.5, weight: 800, halo: false });
            B.text(letter(g.C[h.opp]), x, 0.74, { align: 'center', color: 'panel', size: 12.5, weight: 800, halo: false });
            B.text(r > 0 ? `+${nm(r)}` : nm(r), x, 0.61, { align: 'center', color: r > 0 ? 'green' : r < 0 ? 'red' : 'muted', size: 12, weight: 700 });
            B.text(String(k0 + q + 1), x, 0.965, { align: 'center', size: 9.5, color: 'muted' });
          });
          let sc = 0; const pts = [[0, 0]]; hist.forEach((h, q) => { sc += U[h.you][h.opp][0]; pts.push([q + 1, sc]); });
          const S = Math.max(3, ...pts.map((p) => Math.abs(p[1]))), X = Math.max(10, N), mx = (x) => 0.25 + (0.73 * x) / X, my = (y) => 0.25 + (0.16 * y) / S;
          B.line(0.25, my(0), 0.98, my(0), { color: 'faint', width: 1 });
          B.text('your running score', 0.02, 0.5, { color: 'muted', size: 11.5 });
          B.text(`+${S}`, 0.23, my(S), { align: 'right', size: 10, color: 'muted' }); B.text('0', 0.23, my(0), { align: 'right', size: 10, color: 'muted' }); B.text(`−${S}`, 0.23, my(-S), { align: 'right', size: 10, color: 'muted' });
          B.path(pts.map(([x, y]) => [mx(x), my(y)]), { color: sc >= 0 ? 'green' : 'red', width: 2.4 });
          B.dot(mx(N), my(sc), { r: 4, color: sc >= 0 ? 'green' : 'red' });
          if (sample && N) B.text('sample match', 0.98, 0.02, { align: 'right', baseline: 'bottom', size: 10.5, color: 'muted' });
          const guessed = hist.filter((h) => h.pred === h.you).length;
          st = { g, N, sc, guessed, ne: pureNE(U), wins: hist.filter((h) => U[h.you][h.opp][0] > 0).length };
        }, { still: 2.2 });
        v.legend([[C1, 'you gain by switching'], [C2, 'computer gains by switching'], ['gold', 'best-reply dynamics', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { g, N, sc, guessed, ne, wins } = st;
          const head = ne.length ? `pure equilibrium ${listNE(g, ne)}: the chase stops there` : '**no pure equilibrium**: from every cell an arrow leads away';
          return `${head} · after ${N} round${N === 1 ? '' : 's'} you won ${wins} and scored **${sc > 0 ? '+' : ''}${nm(sc)}** · the computer predicted your move ${guessed} time${guessed === 1 ? '' : 's'}${comp.value === 'rand' ? ' (it is not even trying)' : ''} · ${ne.length ? 'with a pure equilibrium the chase ends: the computer has one best reply, so predictability no longer costs you' : 'being predictable is fatal; randomizing (game-2.2) is the only defence'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Definition',
      name: 'Dominated strategies and iterated elimination',
      statement: String.raw`Action $a_i$ of player $i$ is **strictly dominated** by action $a_i'$ if $u_i(a_i', a_{-i}) > u_i(a_i, a_{-i})$ for **every** list $a_{-i}$ of the other players' actions; it is **weakly dominated** if $\ge$ holds for every $a_{-i}$ and $>$ for at least one. An action that strictly dominates all the others is **strictly dominant**. **Iterated elimination of strictly dominated strategies (IESDS)** deletes, round after round, the actions that are strictly dominated in the game that remains, until none is left. In a finite game:
(a) a strictly dominated action is never a best response, so it is used in no Nash equilibrium, and every Nash equilibrium survives IESDS;
(b) the set of surviving profiles does not depend on the order in which dominated actions are deleted;
(c) if exactly one profile survives, it is the unique Nash equilibrium — the game is **dominance solvable**.

For weak dominance (b) fails: different deletion orders can leave different games, and Nash equilibria can be deleted.`,
      idea: String.raw`A rational player never uses a strictly dominated action, whatever she believes about the others. If that is known, each player can delete the others' dominated actions as well, and then her own actions that have become dominated, and so on — each round uses one more level of "I know that you know that I am rational". Equilibria are never deleted, because an equilibrium action is a best response to the equilibrium profile (game-1.3) and a strictly dominated action is a best response to nothing. Order does not matter because strict dominance survives the shrinking of the opponents' action sets: an action dominated now stays dominated later (if its dominator is deleted, the dominator's own dominator beats it too, and finiteness ends the chain), so any two complete deletion sequences end in the same game. Weak dominance can be destroyed by deleting the one column where the strict inequality held, which is why order then matters. Some actions are dominated only by a randomization over others (game-2.1); the full theory is rationalizability.`,
      caption: String.raw`Step through the elimination. Each step outlines a dominated strategy in red and a strategy that beats it in green, with their payoffs coloured in the surviving part of the table — compare them cell by cell. Choose the order (whole rounds, player 1 first, player 2 first): the right panel runs all three orders on the same game and shows that they end in the same survivors. Then pick *order matters*, which switches on *weak dominance*: now the order decides which game survives (switch it off and nothing is strictly dominated). *Random 4 × 4* draws a new game.`,
      deps: ['game-1.1', 'game-1.3'],
      refs: ['Osborne §2.9', 'Osborne §12.2'],
      tags: ['dominance', 'rationality'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Strategic_dominance' },
      viz(v) {
        const games = {
          g44: { label: '4 × 4', G: mkGame(['A', 'B', 'C', 'D'], ['W', 'X', 'Y', 'Z'], [
            [[4, 1], [2, 2], [3, 3], [2, 2]], [[3, 2], [1, 3], [1, 2], [4, 1]], [[2, 1], [3, 4], [4, 2], [3, 1]], [[3, 1], [1, 0], [2, 0], [1, 5]]]) },
          pd: { label: 'Prisoner’s Dilemma', G: CLASSICS.pd.G },
          weak: { label: 'order matters', G: mkGame(['T', 'M', 'B'], ['L', 'R'], [[[1, 1], [0, 0]], [[1, 1], [2, 1]], [[0, 0], [2, 1]]]) },
        };
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'strike out dominated strategies' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'the same game under three deletion orders' });
        let g = games.g44.G, rs = 0;
        v.select('game', Object.entries(games).map(([k, x]) => ({ value: k, label: x.label })), 'g44', { onChange: (k) => { g = games[k].G; if (k === 'weak') weak.set(true); S.reset(); } });
        const ORD = [{ value: 'round', label: 'whole rounds' }, { value: 'rows', label: 'player 1 first' }, { value: 'cols', label: 'player 2 first' }];
        const order = v.select('order', ORD, 'round', { onChange: () => S.reset() });
        const weak = v.toggle('weak dominance', false, { onChange: () => S.reset() });
        v.button('Random 4 × 4', () => { const r = v.rng(++rs * 104729 + 7); g = mkGame(['A', 'B', 'C', 'D'], ['W', 'X', 'Y', 'Z'], idx(4).map(() => idx(4).map(() => [r.int(0, 9), r.int(0, 9)]))); S.reset(); });
        function iesds(o, wk) {
          const U = g.U, m = g.R.length, n = g.C.length, frames = [], seq = [];
          let R = idx(m), C = idx(n);
          const pay = (who, d, x) => (who === 0 ? U[d][x][0] : U[x][d][1]);
          const domBy = (who, k) => {
            const mine = who === 0 ? R : C, other = who === 0 ? C : R;
            for (const d of mine) {
              if (d === k) continue; let ge = true, gt = true, some = false;
              for (const x of other) { const a = pay(who, d, x), b = pay(who, k, x); if (!(a > b + EPS)) gt = false; if (a < b - EPS) ge = false; if (a > b + EPS) some = true; }
              if (wk ? ge && some : gt) return d;
            }
            return -1;
          };
          const find = (who) => (who === 0 ? R : C).map((k) => ({ who, k, by: domBy(who, k) })).filter((e) => e.by >= 0);
          const nmS = (who, k) => (who === 0 ? g.R[k] : g.C[k]);
          const why = (e) => { const other = e.who === 0 ? C : R; return `${e.who === 0 ? 'player 1' : 'player 2'}: **${nmS(e.who, e.by)}** ${wk ? 'weakly' : 'strictly'} dominates **${nmS(e.who, e.k)}** (${other.map((x) => { const a = pay(e.who, e.by, x), b = pay(e.who, e.k, x); return `${nm(a)} ${a > b + EPS ? '>' : '='} ${nm(b)}`; }).join(', ')})`; };
          frames.push({ R: R.slice(), C: C.slice(), cur: [], note: `The full ${m} × ${n} game. A strategy is ${wk ? '*weakly* dominated if another strategy of the same player does at least as well against every surviving opposing strategy, and better against one' : '*strictly* dominated if another strategy of the same player does better against every surviving opposing strategy'}.` });
          for (let round = 1; round < 30; round++) {
            let batch;
            if (o === 'round') batch = [...find(0), ...find(1)];
            else { const first = o === 'rows' ? 0 : 1; let f = find(first); if (!f.length) f = find(1 - first); batch = f.slice(0, 1); }
            if (!batch.length) break;
            frames.push({ R: R.slice(), C: C.slice(), cur: batch, note: `${o === 'round' ? `Round ${round}` : `Step ${round}`}: ${batch.map(why).join('; ')}.` });
            for (const e of batch) { if (e.who === 0) R = R.filter((i) => i !== e.k); else C = C.filter((j) => j !== e.k); seq.push({ ...e, round }); }
          }
          const ne = pureNE(U), lost = ne.filter(([i, j]) => !R.includes(i) || !C.includes(j));
          const survive = `{${R.map((i) => g.R[i]).join(', ')}} × {${C.map((j) => g.C[j]).join(', ')}}`;
          const one = R.length === 1 && C.length === 1;
          frames.push({ R: R.slice(), C: C.slice(), cur: [], final: true, note: seq.length === 0 ? `Nothing is ${wk ? 'weakly' : 'strictly'} dominated: elimination stops before it starts.` : one ? `Only ${prof(g, R[0], C[0])} survives: ${wk ? 'it is a Nash equilibrium (weak elimination may have deleted others)' : 'the game is dominance solvable and this is its unique Nash equilibrium'}.` : `No strategy is ${wk ? 'weakly' : 'strictly'} dominated any more; ${survive} survives${lost.length ? ` — and the Nash equilibri${lost.length > 1 ? 'a' : 'um'} ${lost.map(([i, j]) => prof(g, i, j)).join(', ')} ${lost.length > 1 ? 'were' : 'was'} deleted` : ', containing every Nash equilibrium'}.` });
          return { frames, seq, R, C, survive };
        }
        const S = v.steps({ frames: () => iesds(order.value, weak.value).frames, speed: 1, still: 2 });
        let st = null;
        v.render(() => {
          const f = S.frame; if (!f || !f.R) return;
          const m = g.R.length, n = g.C.length, deadR = new Set(idx(m).filter((i) => !f.R.includes(i))), deadC = new Set(idx(n).filter((j) => !f.C.includes(j))), cur = f.cur || [];
          const tint = (i, j, k) => {
            for (const e of cur) {
              if (e.who === 0 && k === 0 && f.C.includes(j)) { if (i === e.k) return 'red'; if (i === e.by) return 'green'; }
              if (e.who === 1 && k === 1 && f.R.includes(i)) { if (j === e.k) return 'red'; if (j === e.by) return 'green'; }
            }
            return null;
          };
          const one = f.final && f.R.length === 1 && f.C.length === 1;
          const L = bimatrix(v, A, g, { deadR, deadC, br: false, ne: false, tint, maxH: 70, fill: (i, j) => (one && i === f.R[0] && j === f.C[0] ? ['green', 0.2] : null) });
          const c = A.ctx; c.save();
          const box = (who, k, col, dash) => {
            c.strokeStyle = v.color(col); c.lineWidth = 2.4; c.setLineDash(dash ? [6, 4] : []);
            if (who === 0) c.strokeRect(L.X0 - L.lw + 2, L.Y0 + k * L.ch + 2, L.lw + n * L.cw - 4, L.ch - 4);
            else c.strokeRect(L.X0 + k * L.cw + 2, L.Y0 - 22, L.cw - 4, m * L.ch + 20);
          };
          for (const e of cur) { box(e.who, e.by, 'green', false); box(e.who, e.k, 'red', true); }
          c.restore();
          // the three orders side by side
          const runs = ORD.map((o) => ({ ...o, r: iesds(o.value, weak.value) }));
          const same = runs.every((x) => x.r.survive === runs[0].r.survive);
          const bc = B.ctx, W = B.width, Hh = B.height;
          runs.forEach((ru, q) => {
            const y0 = Hh * (0.1 + q * 0.27), active = ru.value === order.value;
            if (active) { bc.fillStyle = v.color('gold', 0.1); bc.fillRect(8, y0 - 6, W - 16, Hh * 0.24); }
            B.textPx(ru.label + (active ? '  (stepping)' : ''), 16, y0 + 9, { color: active ? 'ink' : 'muted', size: 12, weight: 700 });
            let x = 16; const yc = y0 + 34; let lastRound = 0;
            bc.save(); bc.font = FONT(12, 700);
            for (const e of ru.r.seq) {
              if (ru.value === 'round' && lastRound && e.round !== lastRound) { bc.fillStyle = v.color('faint'); bc.fillRect(x, yc - 11, 1.5, 22); x += 7; }
              lastRound = e.round;
              const t = e.who === 0 ? g.R[e.k] : g.C[e.k], w = bc.measureText(t).width + 12, col = e.who === 0 ? C1 : C2;
              bc.fillStyle = v.color(col, 0.16); bc.fillRect(x, yc - 11, w, 22); bc.strokeStyle = v.color(col, 0.8); bc.lineWidth = 1.2; bc.strokeRect(x + 0.5, yc - 10.5, w - 1, 21);
              bc.fillStyle = v.color(col); bc.textAlign = 'center'; bc.textBaseline = 'middle'; bc.fillText(t, x + w / 2, yc + 0.5);
              bc.strokeStyle = v.color('red', 0.7); bc.beginPath(); bc.moveTo(x + 3, yc); bc.lineTo(x + w - 3, yc); bc.stroke();
              x += w + 5;
            }
            bc.restore();
            if (!ru.r.seq.length) { B.textPx('nothing to delete', x, yc, { color: 'muted', size: 12 }); x += 112; }
            B.textPx(`→  ${ru.r.survive}`, x + 4, yc, { color: 'ink', size: 12.5, weight: 700 });
          });
          B.textPx(same ? '✓ the same survivors whatever the order' : '✗ the orders disagree: weak dominance is order-dependent', W / 2, Hh * 0.93, { align: 'center', color: same ? 'green' : 'red', size: 13, weight: 700 });
          st = { f, same, runs };
        });
        v.legend([['red', 'dominated (deleted now)', { dash: true }], ['green', 'a strategy that beats it'], [C1, 'player 1’s strategies'], [C2, 'player 2’s strategies']]);
        v.readout(() => {
          if (!st) return '';
          const { f, same, runs } = st;
          return `surviving now: {${f.R.map((i) => g.R[i]).join(', ')}} × {${f.C.map((j) => g.C[j]).join(', ')}} · ${weak.value ? 'weak' : 'strict'} dominance · ${same ? `all three orders end in ${runs[0].r.survive}` : `the orders end in ${runs.map((x) => `${x.r.survive} (${x.label})`).join(', ')}`} · Nash equilibria of the full game: ${listNE(g, pureNE(g.U))}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Model',
      name: 'Keynes’s beauty contest: guess 2/3 of the average',
      credit: 'John Maynard Keynes, 1936 (the metaphor); Rosemarie Nagel, 1995 (experiments)',
      statement: String.raw`In the **$p$-beauty contest** (guessing game) each of $n$ players picks a number $x_i\in[0, 100]$. The target is $p$ times the average guess, $t = \frac{p}{n}\sum_j x_j$ with $0 < p < 1$ (classically $p = 2/3$), and the guess closest to $t$ wins (in a smooth version, player $i$'s payoff is $-|x_i - t|$). Guesses above $100p$ are dominated; once they are deleted, guesses above $100p^2$ are dominated in the remaining game, and so on: after $k$ rounds of iterated elimination only $[0, 100p^k]$ survives, so the unique Nash equilibrium is for everybody to guess $0$. Experimental subjects do not: first-round averages for $p = 2/3$ are typically between 20 and 40, consistent with one to three steps of reasoning.`,
      scope: String.raw`The equilibrium assumes that rationality is common knowledge. With $p = 1$ nothing is ever eliminated and every common guess is an equilibrium; real winners depend on how deeply the others reason.`,
      idea: String.raw`Keynes (1936) compared professional investment to a newspaper competition in which one must pick not the prettiest faces but those that others will think prettiest — or what others think others will think. The guessing game makes the levels precise. The target can never exceed $100p$, so any guess above $100p$ does worse than $100p$ itself whatever the others do (strictly, with the smooth payoff): it is dominated. If everyone knows this, the target cannot exceed $100p^2$, and so on — iterated elimination (game-1.7) squeezes the surviving interval geometrically to $\{0\}$. Real people stop after a step or two: *level-$k$* reasoners guess about $50p^k$, which produced the spikes near 33 and 22 in Nagel's 1995 experiments, and against such a population the winning guess is far from 0. Knowing how deeply others reason matters more than reasoning deeper yourself (behav-6.6).`,
      caption: String.raw`Top: rounds of elimination — after round $k$ only guesses up to $100p^k$ survive, collapsing to the equilibrium 0. Bottom: a simulated population of 400 players with Poisson-distributed reasoning depth (level 0 guesses at random, level $k$ guesses about $50p^k$); green marks the target, $p$ times the average. Drag the gold marker to place your guess and see where it ranks. Raise the mean depth $\tau$ and the target sinks towards 0; make everyone fully rational and the only good guess is 0; set $p = 1$ and nothing can be eliminated.`,
      deps: ['game-1.7'],
      refs: ['Osborne ch. 12'],
      tags: ['beauty contest', 'iterated dominance', 'bounded rationality'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Guess_2/3_of_the_average' },
      viz(v) {
        const M = v.M, N = 400, K = 5;
        const A = v.stage({ x: [-2, 102], y: [-K - 1.7, 0.7], axes: false, height: 200, full: true, title: 'iterated elimination: guesses that survive $k$ rounds' });
        const B = v.stage({ x: [-2, 102], y: [-4, 40], axes: false, height: 250, full: true, title: 'a simulated population — drag the gold marker to place your guess' });
        const pS = v.slider('$p$ (target $= p\\times$ average)', 0.1, 1, 2 / 3, { step: 0.01 });
        const tS = v.slider('mean depth of reasoning $\\tau$', 0, 4, 1, { step: 0.1 });
        const rat = v.toggle('everyone else fully rational', false);
        let seed = 1; v.button('New population', () => { seed++; });
        const H = B.handle(30, 30, { color: 'gold', label: 'you', constrain: (x) => [M.clamp(x, 0, 100), H.y] });
        function population() {
          const r = v.rng(seed * 977 + 13), p = pS.value, tau = tS.value, out = [];
          for (let k = 0; k < N; k++) {
            const u = r(), noise = r.normal(0, 2.5), u0 = r() * 100;
            let L = 0, P = Math.exp(-tau), S = P; while (u > S && L < 25) { L++; P *= tau / L; S += P; }
            out.push({ g: rat.value ? 0 : L === 0 ? u0 : M.clamp(50 * Math.pow(p, L) + noise, 0, 100), L });
          }
          return out;
        }
        let st = null;
        v.render(() => {
          const p = pS.value;
          // ----- elimination ladder
          for (let k = 0; k <= K; k++) {
            const y = -k, hi = 100 * Math.pow(p, k);
            if (hi < 100) A.rect(hi, y - 0.3, 100, y + 0.3, { fill: 'red', fillAlpha: 0.1, stroke: false });
            A.rect(0, y - 0.3, hi, y + 0.3, { fill: 'accent', fillAlpha: 0.25 + 0.45 * (k / K), stroke: false });
            const wpx = (hi / 104) * A.width, lab = k === 0 ? 'all guesses' : `round ${k}`, cut = k === 0 ? '[0, 100]' : `≤ ${v.fix(hi, 1)}`;
            if (wpx > 74) A.text(lab, 1, y, { color: 'panel', size: 11.5, weight: 700, halo: false });
            if (hi > 92) A.text(cut, hi, y, { dx: -6, color: 'panel', size: 11.5, weight: 700, align: 'right', halo: false });
            else A.text(cut, hi, y, { dx: 6, color: 'ink', size: 11.5, weight: 600, align: 'left' });
            if (wpx <= 74) A.text(lab, hi, y, { dx: 60, color: 'muted', size: 11, align: 'left' });
          }
          A.dot(0, -K - 1, { r: 6, color: 'green' });
          A.text(p < 1 ? 'k → ∞: only 0 survives — the unique Nash equilibrium' : 'k → ∞: still all of [0, 100]', 0, -K - 1, { dx: 12, color: p < 1 ? 'green' : 'red', size: 12, weight: 700, align: 'left' });
          if (p < 1) {
            if (100 * p * p * p < 52) {
              A.text('red: beaten by the cutoff whatever the others guess (round 1),', 99, -3, { align: 'right', color: 'red', size: 11, weight: 600 });
              A.text('or once everyone knows the earlier rounds were eliminated', 99, -4, { align: 'right', color: 'red', size: 11, weight: 600 });
            }
          } else A.text('p = 1: no guess is ever dominated — every common guess is an equilibrium', 99, -2.5, { align: 'right', color: 'red', size: 12.5, weight: 700 });
          // ----- population histogram
          const pop = population(), you = H.x, gs = pop.map((q) => q.g), avg = (gs.reduce((s, x) => s + x, 0) + you) / (N + 1), target = p * avg;
          const hst = M.histogram(gs, { bins: 50, range: [0, 100] }), top = Math.max(10, ...hst.counts) * 1.3;
          B.setView([-2, 102], [-0.13 * top, top]);
          B.hist(gs, { bins: 50, range: [0, 100], color: 'accent', fillAlpha: 0.35 });
          B.line(0, 0, 100, 0, { color: 'muted', width: 1 });
          for (let x = 0; x <= 100; x += 10) { B.line(x, 0, x, -0.025 * top, { color: 'muted', width: 1 }); B.text(String(x), x, -0.035 * top, { align: 'center', baseline: 'top', size: 10.5, color: 'muted' }); }
          for (let k = 0; k <= 4 && !rat.value; k++) { const x = 50 * Math.pow(p, k); B.text(`L${k}`, x, top * 0.97, { align: 'center', baseline: 'top', size: 10.5, color: 'purple', weight: 700 }); B.line(x, top * 0.9, x, top * 0.86, { color: 'purple', width: 1.4 }); }
          B.line(avg, 0, avg, top * 0.8, { color: 'purple', width: 1.6, dash: [5, 4] });
          B.text(`average ${v.fix(avg, 1)}`, avg, top * 0.8, { dx: 5, align: 'left', baseline: 'bottom', color: 'purple', size: 11.5, weight: 600 });
          B.line(target, 0, target, top * 0.7, { color: 'green', width: 2.6 });
          B.text(`target ${v.fix(target, 1)}`, target, top * 0.7, { dx: target > 85 ? -5 : 5, align: target > 85 ? 'right' : 'left', baseline: 'bottom', color: 'green', size: 12, weight: 700 });
          H.y = top * 0.55;
          B.line(you, 0, you, H.y, { color: 'gold', width: 1.6, dash: [3, 3] });
          let best = Infinity, win = null; for (const x of [...gs, you]) { const d = Math.abs(x - target); if (d < best) { best = d; win = x; } }
          B.dot(win, 0, { r: 6, color: 'green' });
          const dYou = Math.abs(you - target), rank = 1 + gs.filter((x) => Math.abs(x - target) < dYou).length;
          const lv = pop.reduce((s, q) => s + q.L, 0) / N;
          st = { avg, target, win, dYou, rank, lv, rank0: 1 + gs.filter((x) => Math.abs(x - target) < target).length };
        });
        v.legend([['accent', 'guesses of the simulated players', { area: true }], ['purple', 'average (and level-$k$ guesses $50p^k$)', { dash: true }], ['green', 'target and winning guess'], ['gold', 'your guess']]);
        v.readout(() => {
          if (!st) return '';
          const { avg, target, win, dYou, rank } = st;
          const eqTxt = pS.value >= 1 ? 'with $p = 1$ elimination predicts nothing' : rat.value ? 'everyone else plays the equilibrium 0, so only 0 can win' : `iterated elimination predicts 0, but against this population a guess of 0 would rank ${st.rank0} of ${N + 1}`;
          return `average guess $${v.fix(avg, 2)}$ → target $p\\times\\text{avg} = ${v.fix(target, 2)}$ · winning guess $${v.fix(win, 2)}$ · your guess $${v.fix(H.x, 1)}$ is $${v.fix(dYou, 2)}$ away: **rank ${rank} of ${N + 1}**${rank === 1 ? ' — you win' : ''} · ${eqTxt}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Model',
      name: 'Public goods game and free riding',
      statement: String.raw`Each of $n$ players has an endowment $e$ and contributes $g_i\in[0, e]$ to a common pool; the pool is multiplied by $r$ and shared equally, so player $i$ ends with
$$\pi_i = e - g_i + \frac{r}{n}\sum_{j=1}^n g_j.$$
If $1 < r < n$, each unit contributed returns only $r/n < 1$ to its contributor (the *marginal per-capita return*), so contributing nothing strictly dominates every positive contribution and the unique Nash equilibrium is $g_i = 0$ for all, with payoff $e$ each — although if everyone contributed fully, each would get $re > e$. If $r > n$, full contribution is dominant; if $r < 1$, contributing is wasteful even for the group.`,
      scope: String.raw`Holds for players who maximize their own money payoff in a single play. In laboratory groups, contributions typically start near half the endowment and decay with repetition; the option to punish free riders can sustain them (behav-6.3).`,
      idea: String.raw`Player $i$'s payoff is linear in her own contribution with slope $r/n - 1$, the same whatever the others do: their contributions shift the line up but never tilt it. With $r < n$ the best response to anything is $g_i = 0$, a strictly dominant strategy (game-1.7). Each unit contributed creates $r$ units of value, of which the contributor captures only $r/n$; the rest spills over to the others, a positive externality she ignores — free riding (micro-12.10). It is the $n$-player Prisoner's Dilemma (game-1.4): everyone's dominant choice yields $e$, universal cooperation $re$.`,
      caption: String.raw`Left: the group around the common pot. Each disc shows how much of a player's endowment of 10 goes into the pot (teal) and, outside, the payoff after the pot — multiplied by $r$ — is split equally. Set your contribution with the slider and click the other players to change theirs. Right: your payoff against your own contribution, one line for each level of the others' giving: with $r < n$ every line falls with slope $r/n - 1$, so giving 0 (green) is best whatever they do, while the purple line — everyone giving the same amount — rises. Push $r$ above $n$ and the lines tilt up.`,
      deps: ['game-1.7', 'micro-12.10'],
      refs: ['Osborne §2.8'],
      tags: ['public goods', 'free riding', 'social dilemma'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Public_goods_game' },
      viz(v) {
        const M = v.M, E = 10;
        const A = v.stage({ x: [-1.4, 1.4], y: [-1.22, 1.22], equal: true, axes: false, height: 340, title: 'the group and the common pot' });
        const B = v.stage({ x: [-0.4, 10.6], y: [0, 30], axes: 'box', height: 340, title: 'your payoff against your contribution $g_1$' });
        const nS = v.slider('players $n$', 2, 12, 4, { int: true });
        const rS = v.slider('multiplier $r$', 0.5, 15, 1.6, { step: 0.1 });
        const gS = v.slider('your contribution $g_1$', 0, 10, 10, { step: 0.5 });
        let others = [10, 6, 2, 8, 4, 0, 10, 5, 3, 7, 1];
        v.button('Others give everything', () => { others = others.map(() => 10); });
        v.button('Others give nothing', () => { others = others.map(() => 0); });
        const pos = (k, n) => { const a = -Math.PI / 2 + (2 * Math.PI * k) / n; return [0.82 * Math.cos(a), 0.82 * Math.sin(a)]; };
        A.onClick((x, y) => { const n = nS.value; for (let k = 1; k < n; k++) { const [px, py] = pos(k, n); if (Math.hypot(x - px, y - py) < 0.2) { const o = others[k - 1]; others[k - 1] = o >= 10 ? 0 : o >= 5 ? 10 : 5; return; } } });
        let st = null;
        v.render(() => {
          const n = nS.value, r = rS.value, gs = [gS.value, ...others.slice(0, n - 1)], G = gs.reduce((s, x) => s + x, 0), share = (r * G) / n, pay = gs.map((g) => E - g + share);
          const rp = 0.15 + 0.2 * Math.sqrt(G / (E * n)), c = A.ctx, sc = Math.min(1, 6 / n);
          // flows
          gs.forEach((g, k) => {
            const [px, py] = pos(k, n), L = Math.hypot(px, py), ux = -px / L, uy = -py / L, ox = -uy * 0.035, oy = ux * 0.035, a = 0.15, b = L - rp - 0.04;
            if (g > 0) A.arrow(px + ux * a + ox, py + uy * a + oy, px + ux * b + ox, py + uy * b + oy, { color: 'teal', width: (1 + 0.45 * g) * sc + 0.6, head: 8 });
            if (share > 0) A.arrow(px + ux * b - ox, py + uy * b - oy, px + ux * a - ox, py + uy * a - oy, { color: 'green', width: (1 + (0.45 * Math.min(share, 30)) / 3) * sc + 0.6, head: 8, alpha: 0.85 });
          });
          // pot
          A.circle(0, 0, rp, { fill: 'teal', fillAlpha: 0.22, color: 'teal', width: 2 });
          A.text(`pot ${nm(G)}`, 0, 0.06, { align: 'center', color: 'teal', size: 12.5, weight: 800 });
          A.text(`× ${v.fix(r, 1)} = ${v.fix(r * G, 1)}`, 0, -0.06, { align: 'center', color: 'ink', size: 11.5, weight: 600 });
          A.text(`÷ ${n}: each gets ${v.fix(share, 1)}`, 0, -0.17, { align: 'center', color: 'green', size: 11.5, weight: 700 });
          // players
          gs.forEach((g, k) => {
            const [px, py] = pos(k, n), X = A.X(px), Y = A.Y(py), R = 0.13 * A.scale, you = k === 0;
            c.save();
            c.beginPath(); c.arc(X, Y, R, 0, Math.PI * 2); c.fillStyle = v.color('panel'); c.fill(); c.fillStyle = v.color('faint', 0.25); c.fill();
            if (g > 0) { c.beginPath(); c.moveTo(X, Y); c.arc(X, Y, R, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * g) / E); c.closePath(); c.fillStyle = v.color('teal', 0.75); c.fill(); }
            c.beginPath(); c.arc(X, Y, R, 0, Math.PI * 2); c.lineWidth = you ? 3 : 1.5; c.strokeStyle = v.color(you ? C1 : 'muted'); c.stroke();
            c.restore();
            A.text(nm(g), px, py, { align: 'center', color: 'ink', size: 12, weight: 800 });
            const L = Math.hypot(px, py), lx = (px / L) * 1.08, ly = (py / L) * 1.06;
            A.text(you ? `you: ${v.fix(pay[k], 1)}` : v.fix(pay[k], 1), lx, ly, { align: Math.abs(lx) < 0.25 ? 'center' : lx > 0 ? 'left' : 'right', color: you ? C1 : 'ink', size: you ? 12.5 : 11.5, weight: you ? 800 : 600 });
          });
          // payoff lines
          const O = G - gS.value, f = (g, o) => E - g + (r * (g + o)) / n, oMax = E * (n - 1);
          const yMax = Math.max(f(0, oMax), E + (r - 1) * E, f(E, oMax), 12) * 1.12, yMin = Math.min(0, E + (r - 1) * E, f(E, 0)) - 0.1 * yMax;
          B.setView([-0.4, 10.6], [yMin, yMax]);
          B.line(0, f(0, 0), 10, f(10, 0), { color: 'faint', width: 1.6, dash: [5, 4] });
          B.line(0, f(0, oMax), 10, f(10, oMax), { color: 'faint', width: 1.6, dash: [5, 4] });
          B.text('others give everything', 0.2, f(0.2, oMax), { dy: -10, align: 'left', color: 'muted', size: 11 });
          B.text('others give nothing', 0.2, f(0.2, 0), { dy: 11, align: 'left', color: 'muted', size: 11 });
          B.line(0, f(0, O), 10, f(10, O), { color: C1, width: 2.8 });
          B.line(0, E, 10, E + (r - 1) * 10, { color: 'purple', width: 2.2, dash: [7, 4] });
          B.text('if everyone gave g₁', 10, E + (r - 1) * 10, { dy: r > 1 ? -9 : 10, align: 'right', color: 'purple', size: 11.5, weight: 700 });
          const bestG = r < n - 1e-9 ? 0 : r > n + 1e-9 ? 10 : null;
          if (bestG != null) { B.dot(bestG, f(bestG, O), { r: 9, hollow: true, color: 'green', width: 2.5 }); B.text(`best: give ${bestG}`, bestG, f(bestG, O), { dx: bestG ? -14 : 14, dy: -15, align: bestG ? 'right' : 'left', color: 'green', size: 12, weight: 700 }); }
          else B.line(0, f(0, O), 10, f(10, O), { color: 'green', width: 4, alpha: 0.5 });
          B.dot(gS.value, f(gS.value, O), { r: 6, color: 'gold' });
          st = { n, r, G, share, pay, O, bestG, f };
        });
        v.legend([['teal', 'contributions into the pot'], ['green', 'equal shares back / best reply'], [C1, 'you: payoff vs your $g_1$ (others fixed)'], ['purple', 'everyone gives the same', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { n, r, pay, O, bestG, f } = st, mpcr = r / n;
          const dom = bestG === 0 ? `giving 0 would pay you $${v.fix(f(0, O), 1)}$ — more, whatever the others give (**free riding is dominant**)` : bestG === 10 ? `giving everything is dominant ($r > n$: each unit returns more than it costs)` : 'you are exactly indifferent ($r = n$)';
          return `marginal per-capita return $r/n = ${v.fix(mpcr, 3)}$: each unit you give returns $${v.fix(mpcr, 2)}$ to you (net $${v.fix(mpcr - 1, 2)}$) and creates $${v.fix(r - 1, 2)}$ for the group · your payoff $${v.fix(pay[0], 1)}$; ${dom} · all give 10 → each gets $${v.fix(r * 10, 1)}$; all give 0 → each keeps 10${r > 1 && r < n ? ' — a social dilemma' : r <= 1 ? ' — contributing destroys value ($r \\le 1$)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Model',
      name: 'War of attrition',
      credit: 'John Maynard Smith, 1974',
      statement: String.raw`Two players compete for a prize worth $v$ to each. Each chooses a time $t_i\ge 0$ at which to concede if the other has not conceded yet; staying in the contest costs each player $1$ per unit of time. The player who concedes later wins the prize, and both pay until the first concession: with $t_1 > t_2$, player 1 gets $v - t_2$ and player 2 gets $-t_2$ (a tie splits the prize). The **pure Nash equilibria** are exactly the profiles in which one player concedes at once and the other's planned time is at least $v$: $(t_1, t_2) = (t, 0)$ or $(0, t)$ with $t\ge v$. There is also a symmetric equilibrium in which each player concedes at a random, exponentially distributed time with mean $v$; then each player's expected payoff is $0$ — the fight dissipates the whole prize (game-2.2).`,
      scope: String.raw`Complete information, equal valuations and a constant cost of time; contests over territory, strikes and standards battles fit this shape. With privately known valuations the equilibrium becomes a bidding rule (an all-pay auction).`,
      idea: String.raw`Fix the opponent's time $t_2$. Conceding at once gives 0; holding out beyond $t_2$ wins $v - t_2$, positive exactly when $t_2 < v$; conceding at any time in between only adds cost. So player 1's best response (game-1.2) is "outlast her" when $t_2 < v$ and "concede now" when $t_2 > v$ — a correspondence with a jump, drawn as the shaded regions. A profile is an equilibrium where both players' regions meet: one concedes immediately and the other is prepared to stay at least $v$, so that conceding is right for the first and staying is right for the second. These equilibria are asymmetric — somebody must be the one who backs down — which is why the symmetric equilibrium randomizes: with exponential quitting times of mean $v$ every concession time earns 0 in expectation. Maynard Smith introduced the game to explain animal contests settled by display rather than fighting.`,
      caption: String.raw`Drag the gold profile $(t_1, t_2)$: player 1's best responses are shaded blue, player 2's orange, and the arrows show each player's profitable change of plan. The equilibria are the green segments, where both best responses meet — one side concedes at once, the other would stay at least $v$. Right: each player's payoff against her own concession time given the other's — a falling line (paying to stay), a jump at the opponent's time, then the flat prize level. Turn on *random concession times* to simulate the symmetric equilibrium (game-2.2): each dot is a contest, and on average the fight burns the whole prize.`,
      deps: ['game-1.3'],
      refs: ['Osborne §3.4'],
      tags: ['war of attrition', 'contests'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/War_of_attrition_(game)' },
      viz(v) {
        const M = v.M;
        const A = v.stage({ x: [-1.2, 10.4], y: [-1.45, 10.4], axes: false, height: 350, title: 'concession times: best responses and equilibria' });
        const Bp = v.stage({ x: [-0.4, 10.4], y: [-11, 9], axes: 'box', height: 350, title: 'payoff against one’s own concession time' });
        const vS = v.slider('prize $v$ (cost: 1 per unit of time)', 1, 8, 4, { step: 0.1 });
        const sim = v.toggle('random concession times (game-2.2)', false);
        const snap = (t) => (t < 0.18 ? 0 : Math.round(M.clamp(t, 0, 10) * 20) / 20);
        const H = A.handle(6.5, 2.5, { color: 'gold', label: '(t₁, t₂)', constrain: (x, y) => [snap(x), snap(y)] });
        v.button('Jump to an equilibrium', () => H.set(Math.min(10, Math.ceil(vS.value) + 2), 0));
        const pay = (a, b, V) => (a > b + 1e-9 ? V - b : a < b - 1e-9 ? -a : V / 2 - a);
        const bestTo = (b, V) => (V - b > 1e-9 ? { val: V - b, to: Math.min(10.2, b + 1.2), desc: `any time after ${v.fix(b, 2)}` } : { val: 0, to: 0, desc: 'concede at once' });
        let simKey = '', simPts = [], simStat = null;
        let st = null;
        v.render(() => {
          const V = vS.value, t1 = H.x, t2 = H.y, c = A.ctx;
          // axes
          A.line(0, 0, 10.2, 0, { color: 'muted', width: 1.2 }); A.line(0, 0, 0, 10.2, { color: 'muted', width: 1.2 });
          for (let k = 0; k <= 10; k += 2) { A.text(String(k), k, -0.35, { align: 'center', baseline: 'top', size: 10.5, color: 'muted' }); A.text(String(k), -0.3, k, { align: 'right', size: 10.5, color: 'muted' }); }
          A.text('t₁ (player 1 concedes) →', 10.2, -0.75, { align: 'right', baseline: 'top', size: 11.5, color: C1, weight: 600 });
          c.save(); c.translate(A.X(-0.85), A.Y(10.2)); c.rotate(-Math.PI / 2); c.font = FONT(11.5, 600); c.fillStyle = v.color(C2); c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText('t₂ (player 2 concedes) →', 0, 0); c.restore();
          // best-response regions
          const Vc = Math.min(V, 10.2);
          A.poly([[0, 0], [10.2, 0], [10.2, Vc], [Vc, Vc]], { fill: C1, fillAlpha: 0.16, stroke: false });
          A.poly([[0, 0], [0, 10.2], [Vc, 10.2], [Vc, Vc]], { fill: C2, fillAlpha: 0.16, stroke: false });
          A.line(0, 0, Vc, Vc, { color: 'faint', width: 1, dash: [3, 3] });
          if (V < 10.2) { A.line(0, V, 0, 10.2, { color: C1, width: 7, alpha: 0.5 }); A.line(V, 0, 10.2, 0, { color: C2, width: 7, alpha: 0.5 }); }
          A.line(V, 0, V, 10.2, { color: 'faint', width: 1, dash: [5, 4] }); A.line(0, V, 10.2, V, { color: 'faint', width: 1, dash: [5, 4] });
          A.text('v', V, 10.2, { dx: 5, align: 'left', baseline: 'top', size: 13, color: 'muted', math: true }); A.text('v', 10.2, V, { dy: -4, align: 'right', baseline: 'bottom', size: 13, color: 'muted', math: true });
          if (V < 10.2) { A.line(0, V, 0, 10.2, { color: 'green', width: 4 }); A.line(V, 0, 10.2, 0, { color: 'green', width: 4 }); }
          if (V < 9.2) {
            A.text('1 concedes at once,', 0.3, (V + 10.2) / 2 + 0.3, { align: 'left', size: 11, color: 'green', weight: 700 });
            A.text('2 would stay ≥ v', 0.3, (V + 10.2) / 2 - 0.3, { align: 'left', size: 11, color: 'green', weight: 700 });
            A.text('2 concedes at once, 1 would stay ≥ v', (V + 10.2) / 2, 0.3, { align: 'center', baseline: 'bottom', size: 11, color: 'green', weight: 700 });
          }
          // simulated symmetric equilibrium
          if (sim.value) {
            const key = `${V}`;
            if (key !== simKey) {
              simKey = key; const r = v.rng(31); simPts = []; let s1 = 0, cost = 0; const T = 20000;
              for (let k = 0; k < T; k++) { const a = -V * Math.log(1 - r()), b = -V * Math.log(1 - r()); s1 += pay(a, b, V); cost += 2 * Math.min(a, b); if (k < 260) simPts.push([a, b]); }
              simStat = { mean: s1 / T, cost: cost / T, T };
            }
            A.dots(simPts.filter(([a, b]) => a > b && a <= 10.2 && b <= 10.2), { r: 2.6, color: C1, alpha: 0.7 });
            A.dots(simPts.filter(([a, b]) => a <= b && a <= 10.2 && b <= 10.2), { r: 2.6, color: C2, alpha: 0.7 });
          }
          // deviation arrows
          const u1 = pay(t1, t2, V), u2 = pay(t2, t1, V), b1 = bestTo(t2, V), b2 = bestTo(t1, V);
          const g1 = b1.val - u1, g2 = b2.val - u2;
          if (g1 > 1e-9) A.arrow(t1, t2, b1.to, t2, { color: C1, width: 2.6, head: 10 });
          if (g2 > 1e-9) A.arrow(t1, t2, t1, b2.to, { color: C2, width: 2.6, head: 10 });
          if (g1 <= 1e-9 && g2 <= 1e-9) A.dot(t1, t2, { r: 12, hollow: true, color: 'green', width: 2.5 });
          // payoff curves
          const ymax = Math.max(V, 1) + 1.5; Bp.setView([-0.4, 10.4], [-11, ymax]);
          Bp.hline(0, { color: 'faint', width: 1, dash: [4, 4] });
          Bp.text('concede at once: 0', 10.2, 0, { dy: -8, align: 'right', size: 10.5, color: 'muted' });
          const curve = (other, col, w) => {
            Bp.line(0, 0, other, -other, { color: col, width: w, alpha: w > 3 ? 0.55 : 1 });
            Bp.line(other, V - other, 10.4, V - other, { color: col, width: w, alpha: w > 3 ? 0.55 : 1 });
            Bp.dot(other, -other, { r: 4, hollow: true, color: col }); Bp.dot(other, V - other, { r: 4, hollow: true, color: col }); Bp.dot(other, V / 2 - other, { r: 3.5, color: col });
          };
          curve(t2, C1, 5); curve(t1, C2, 2.4);
          Bp.dot(t1, u1, { r: 7, color: C1, label: 'player 1', labelPos: u1 > V - 2 ? 'se' : 'ne' }); Bp.dot(t2, u2, { r: 7, color: C2, label: 'player 2', labelPos: u2 > V - 2 ? 'se' : 'ne' });
          st = { V, t1, t2, u1, u2, b1, b2, g1, g2 };
        });
        v.legend([[C1, 'player 1’s best responses', { area: true }], [C2, 'player 2’s best responses', { area: true }], ['green', 'pure Nash equilibria'], ['gold', 'current profile', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { V, t1, t2, u1, u2, b1, b2, g1, g2 } = st;
          const ne = g1 <= 1e-9 && g2 <= 1e-9;
          const dev = ne ? '**a Nash equilibrium**: neither player gains by changing plan' : [g1 > 1e-9 && `player 1 gains ${v.fix(g1, 2)} (${b1.desc})`, g2 > 1e-9 && `player 2 gains ${v.fix(g2, 2)} (${b2.desc})`].filter(Boolean).join('; ');
          const sm = sim.value && simStat ? ` · ${simStat.T} random contests (exponential, mean $v$): player 1's average payoff $${v.fix(simStat.mean, 3)}$ (theory 0), average total cost $${v.fix(simStat.cost, 2)}$ vs prize $v = ${v.fix(V, 2)}$` : '';
          return `$(t_1, t_2) = (${v.fix(t1, 2)}, ${v.fix(t2, 2)})$: payoffs $u_1 = ${v.fix(u1, 2)}$, $u_2 = ${v.fix(u2, 2)}$ — ${dev}${sm}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Paper',
      name: 'Equilibrium Points in n-Person Games',
      paper: { authors: 'John F. Nash, Jr.', year: 1950, title: 'Equilibrium Points in n-Person Games', venue: 'Proceedings of the National Academy of Sciences 36 (1): 48–49', doi: '10.1073/pnas.36.1.48' },
      introduces: ['game-1.3', 'game-2.3'],
      credit: 'John F. Nash, Jr., 1950',
      statement: String.raw`Nash's one-page note proved that **every finite game has an equilibrium point**. Take any number $n$ of players, each with finitely many pure strategies, and let each player randomize: a *mixed strategy* is a probability vector over her pure strategies, and payoffs are evaluated in expectation. An **equilibrium point** is an $n$-tuple of mixed strategies in which each player's strategy maximizes her expected payoff against the others' — what is now called a (mixed) Nash equilibrium (game-1.3, game-2.3). The proof: the correspondence $\Phi$ that sends a profile $\sigma$ to the set of profiles of best replies to $\sigma$ has a closed graph and nonempty convex values on the compact convex product of simplices, so by Kakutani's fixed-point theorem some $\sigma^*\in\Phi(\sigma^*)$ — and a fixed point of $\Phi$ is exactly an equilibrium point. The result covers all finite games, zero-sum or not; it asserts existence only, not uniqueness, nor how players would find or agree on an equilibrium.`,
      idea: String.raw`Von Neumann (1928, game-3.11) had shown that every two-person zero-sum game has a value in mixed strategies, and von Neumann and Morgenstern (1944) treated games with more players through coalitions and side payments. Nash, a 21-year-old Princeton graduate student, set coalitions aside: he asked only for a profile from which no single player wants to move, defined it for any number of players and any payoffs, and proved in a page that it always exists, using Kakutani's 1941 extension of Brouwer's theorem to set-valued maps (game-2.4) — a simplification he credited to David Gale; his 1951 *Annals* paper gave a proof by Brouwer's theorem. Randomization is what makes it work: it makes each strategy set convex and each set of best replies convex (all mixtures of best pure replies), exactly Kakutani's hypotheses, while in pure strategies the fixed point can vanish (game-1.6). The note founded non-cooperative game theory, the standard language for strategic interaction in economics, biology and political science, and earned Nash a share of the 1994 Nobel memorial prize in economics with Harsanyi and Selten.`,
      caption: String.raw`Pick a game shape or click a cell and edit it. The square holds every pair of mixed strategies: $p$ is the probability that player 1 plays the first row, $q$ that player 2 plays the first column. Blue is player 1's best-response correspondence, orange player 2's — each a step that runs across the square where that player is indifferent. Their crossings are Nash's equilibrium points (green). Drag the gold profile $\sigma$: the purple set is $\Phi(\sigma)$, the profile of best replies to it, and $\sigma$ is an equilibrium exactly when it lies in its own image. Coordination gives three crossings, Matching Pennies and the Prisoner's Dilemma one — never none. Switch to *pure strategies only*: without the convex square, Matching Pennies loses its fixed point.`,
      deps: ['game-2.4', 'game-3.11'],
      refs: [],
      tags: ['Nash equilibrium', 'fixed point', 'existence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Nash_equilibrium' },
      viz(v) {
        const keys = ['coord', 'pennies', 'pd', 'chicken', 'bos'];
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 0.85, title: 'a 2 × 2 game you edit' });
        const Q = v.stage({ x: [-0.17, 1.08], y: [-0.15, 1.1], axes: false, height: 340, weight: 1.15, title: 'best replies in the square of mixed strategies' });
        let g = mkGame(CLASSICS.coord.G.R, CLASSICS.coord.G.C, CLASSICS.coord.G.U), L = null;
        v.select('game', keys.map((k) => ({ value: k, label: CLASSICS[k].label })), 'coord', { onChange: (k) => { const p = CLASSICS[k].G; g = mkGame(p.R, p.C, p.U); ed.sync(); } });
        const ed = payoffEditor(v, A, { game: () => g, layout: () => L });
        const pure = v.toggle('pure strategies only', false);
        // p = P(player 1 plays row 0), q = P(player 2 plays column 0); d1(q), d2(p) = payoff advantage of the first action
        const d1 = (q) => { const U = g.U; return q * (U[0][0][0] - U[1][0][0]) + (1 - q) * (U[0][1][0] - U[1][1][0]); };
        const d2 = (p) => { const U = g.U; return p * (U[0][0][1] - U[0][1][1]) + (1 - p) * (U[1][0][1] - U[1][1][1]); };
        const brSet = (d) => (d > EPS ? [1, 1] : d < -EPS ? [0, 0] : [0, 1]);
        /** Graph of a best-reply correspondence: segments [[own, other], …] and the indifference value of `other`. */
        function graph(d) {
          const a = d(0), b = d(1), val = (x) => (x > EPS ? 1 : x < -EPS ? 0 : null);
          if (Math.abs(a) < EPS && Math.abs(b) < EPS) return { all: true, segs: [], ts: null };
          let ts = null;
          if ((a > EPS && b < -EPS) || (a < -EPS && b > EPS)) ts = a / (a - b); else if (Math.abs(a) < EPS) ts = 0; else if (Math.abs(b) < EPS) ts = 1;
          if (ts == null) return { segs: [[[val(a), 0], [val(a), 1]]], ts };
          const lo = val(a) ?? val(b), hi = val(b) ?? val(a), segs = [];
          if (ts > 0) segs.push([[lo, 0], [lo, ts]]);
          segs.push([[0, ts], [1, ts]]);
          if (ts < 1) segs.push([[hi, ts], [hi, 1]]);
          return { segs, ts };
        }
        function equilibria() {
          const G1 = graph(d1), G2 = graph(d2);
          if (G1.all || G2.all || [G1.ts, G2.ts].some((t) => t === 0 || t === 1)) return { pts: [], degenerate: true, G1, G2 };
          const P = [0, 1].concat(G2.ts != null ? [G2.ts] : []), Qs = [0, 1].concat(G1.ts != null ? [G1.ts] : []), pts = [];
          const inSet = (x, s) => x >= s[0] - 1e-9 && x <= s[1] + 1e-9;
          for (const p of P) for (const q of Qs) if (inSet(p, brSet(d1(q))) && inSet(q, brSet(d2(p)))) pts.push([p, q]);
          return { pts, degenerate: false, G1, G2 };
        }
        const H = Q.handle(0.3, 0.75, { color: 'gold', label: 'σ', constrain: (x, y) => {
          if (pure.value) return [x < 0.5 ? 0 : 1, y < 0.5 ? 0 : 1];
          for (const [p, q] of equilibria().pts) if (Math.hypot((x - p) * 1.4, y - q) < 0.035) return [p, q];
          return [v.M.clamp(x, 0, 1), v.M.clamp(y, 0, 1)];
        } });
        let st = null;
        v.render(() => {
          L = bimatrix(v, A, g, { sel: ed.sel, maxH: 92, maxW: 132 });
          const eq = equilibria(), purePts = pureNE(g.U).map(([i, j]) => [1 - i, 1 - j]);
          if (pure.value) { H.x = H.x < 0.5 ? 0 : 1; H.y = H.y < 0.5 ? 0 : 1; }
          // the square
          Q.rect(0, 0, 1, 1, { fill: pure.value ? 'faint' : 'muted', fillAlpha: pure.value ? 0.12 : 0.04, color: 'muted', width: 1.2 });
          for (const t of [0, 0.5, 1]) { Q.text(String(t), t, -0.035, { align: 'center', baseline: 'top', size: 10.5, color: 'muted' }); Q.text(String(t), -0.035, t, { align: 'right', size: 10.5, color: 'muted' }); }
          Q.text(`p = P(player 1 plays ${g.R[0]}) →`, 0.5, -0.085, { align: 'center', baseline: 'top', size: 11.5, color: C1, weight: 600 });
          const cx = Q.ctx; cx.save(); cx.translate(Q.X(-0.135), Q.Y(0.5)); cx.rotate(-Math.PI / 2); cx.font = FONT(11.5, 600); cx.fillStyle = v.color(C2); cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(`q = P(player 2 plays ${g.C[0]}) →`, 0, 0); cx.restore();
          if (pure.value) {
            Q.text('only the four corners exist', 0.5, 0.5, { align: 'center', color: 'muted', size: 12, weight: 600 });
            for (const [p, q] of purePts) Q.dot(p, q, { r: 16, hollow: true, color: 'green', width: 2.5 });
            for (const q of [0, 1]) { const s = brSet(d1(q)); for (const p of [0, 1]) if (p >= s[0] && p <= s[1]) Q.dot(p, q, { r: 11, hollow: true, color: C1, width: 3.5 }); }
            for (const p of [0, 1]) { const s = brSet(d2(p)); for (const q of [0, 1]) if (q >= s[0] && q <= s[1]) Q.dot(p, q, { r: 6.5, hollow: true, color: C2, width: 3 }); }
          } else {
            if (eq.G1.all) Q.rect(0, 0, 1, 1, { fill: C1, fillAlpha: 0.12, stroke: false });
            if (eq.G2.all) Q.rect(0, 0, 1, 1, { fill: C2, fillAlpha: 0.12, stroke: false });
            for (const [[o0, t0], [o1, t1]] of eq.G1.segs) Q.line(o0, t0, o1, t1, { color: C1, width: 6, alpha: 0.75 });
            for (const [[o0, t0], [o1, t1]] of eq.G2.segs) Q.line(t0, o0, t1, o1, { color: C2, width: 2.8 });
            for (const [p, q] of eq.pts) Q.dot(p, q, { r: 9, color: 'green' });
          }
          // the gold profile and its image Φ(σ) = BR1(q) × BR2(p)
          const p = H.x, q = H.y, s1 = pure.value ? [0, 1].filter((x) => { const s = brSet(d1(q)); return x >= s[0] && x <= s[1]; }) : brSet(d1(q)), s2 = pure.value ? [0, 1].filter((x) => { const s = brSet(d2(p)); return x >= s[0] && x <= s[1]; }) : brSet(d2(p));
          let fixed, near;
          if (pure.value) {
            for (const a of s1) for (const b of s2) Q.dot(a, b, { r: 6, color: 'purple' });
            fixed = s1.includes(p) && s2.includes(q); near = [s1[0], s2[0]];
          } else {
            const [a0, a1] = s1, [b0, b1] = s2;
            if (a0 === a1 && b0 === b1) Q.dot(a0, b0, { r: 7, color: 'purple' });
            else Q.rect(a0 - 0.004, b0 - 0.004, a1 + 0.004, b1 + 0.004, { fill: 'purple', fillAlpha: 0.18, color: 'purple', width: 3 });
            near = [v.M.clamp(p, a0, a1), v.M.clamp(q, b0, b1)]; fixed = Math.hypot(near[0] - p, near[1] - q) < 1e-6;
          }
          if (!fixed) Q.arrow(p, q, near[0], near[1], { color: 'purple', width: 2, head: 9, dash: [5, 4] });
          else Q.dot(p, q, { r: 14, hollow: true, color: 'green', width: 2.5 });
          Q.text(fixed ? 'σ ∈ Φ(σ): a fixed point' : 'Φ(σ)', near[0], near[1], { dx: near[0] > 0.6 ? -12 : 12, dy: near[1] > 0.5 ? 16 : -16, align: near[0] > 0.6 ? 'right' : 'left', color: fixed ? 'green' : 'purple', size: 12, weight: 700 });
          st = { eq, purePts, p, q, s1, s2, fixed };
        });
        v.legend([[C1, 'player 1’s best replies $B_1(q)$'], [C2, 'player 2’s best replies $B_2(p)$'], ['green', 'equilibrium point (crossing)', { dot: true }], ['purple', 'image $\\Phi(\\sigma)$ of the gold profile']]);
        v.readout(() => {
          if (!st) return '';
          const { eq, purePts, p, q, s1, s2, fixed } = st;
          const iv = (s) => (pure.value ? `\\{${s.join(', ')}\\}` : s[0] === s[1] ? `\\{${s[0]}\\}` : '[0, 1]');
          const img = `$\\sigma = (${v.fix(p, 2)}, ${v.fix(q, 2)}) \\mapsto \\Phi(\\sigma) = ${iv(s1)}\\times${iv(s2)}$ — ${fixed ? '**a fixed point, i.e. an equilibrium point**' : 'not a fixed point'}`;
          if (pure.value) return `${img} · pure strategies only: **${purePts.length} fixed point${purePts.length === 1 ? '' : 's'}**${purePts.length ? '' : ' — the strategy set {0, 1} is not convex, so Kakutani’s theorem does not apply and existence fails'}`;
          if (eq.degenerate) return `${img} · a non-generic game (a payoff tie makes a player indifferent along an edge or everywhere): equilibria can form a continuum, but there is always at least one, as Nash proved`;
          const mixed = eq.pts.filter(([a, b]) => a > 0 && a < 1 && b > 0 && b < 1);
          return `${img} · **${eq.pts.length} equilibrium point${eq.pts.length === 1 ? '' : 's'}**: ${eq.pts.length - mixed.length} pure${mixed.length ? `, one mixed at $p = ${v.fix(mixed[0][0], 3)}$, $q = ${v.fix(mixed[0][1], 3)}$` : ''} · Nash (1950): at least one in every finite game ✓ · today: a generic game has an **odd** number (Wilson, 1971) — here ${eq.pts.length} ${eq.pts.length % 2 ? '✓' : '✗'} — and finding one is PPAD-hard in general (game-2.6)`;
        });
      },
    },
  ],
};
