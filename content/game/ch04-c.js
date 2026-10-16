// Game Theory & Social Choice — Chapter 4 (part c): strategy stealing, Nim and Sprague–Grundy, hypercube tic-tac-toe
import { idx, nmz } from './ch04.shared.js';

// ---------------------------------------------------------------- Chomp
// A position is the list of column heights h[0..C-1] (non-increasing); the poisoned square is (row 0, column 0).
const chompKey = (h) => h.join(',');
const chompMoves = (h) => {
  const out = [];
  h.forEach((hj, j) => { for (let i = 0; i < hj; i++) if (i + j > 0) out.push({ i, j, h: h.map((x, k) => (k >= j ? Math.min(x, i) : x)) }); });
  return out;
};
function chompSolver() {
  const memo = new Map();
  const val = (h) => {   // +1 if the player to move wins, -1 if she loses
    const k = chompKey(h); if (memo.has(k)) return memo.get(k);
    const ms = chompMoves(h); let r = -1;
    for (const m of ms) if (val(m.h) === -1) { r = 1; break; }
    memo.set(k, r); return r;
  };
  return { val, memo };
}
const chompCache = {};
const chompFor = (R, C) => (chompCache[`${R}x${C}`] = chompCache[`${R}x${C}`] || chompSolver());

// ---------------------------------------------------------------- Hex
const hexNb = (n) => {
  const nb = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const l = [];
    for (const [dr, dc] of [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0]]) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < n && cc >= 0 && cc < n) l.push(rr * n + cc); }
    nb.push(l);
  }
  return nb;
};
/** Does the colour ch ('R': top-bottom, 'B': left-right) connect its two sides in the state string st? */
function hexWon(st, n, ch, nb) {
  const seen = new Uint8Array(n * n), stack = [];
  for (let k = 0; k < n; k++) { const i = ch === 'R' ? k : k * n; if (st[i] === ch) { seen[i] = 1; stack.push(i); } }
  while (stack.length) {
    const i = stack.pop(), r = Math.floor(i / n), c = i % n;
    if (ch === 'R' ? r === n - 1 : c === n - 1) return true;
    for (const j of nb[i]) if (!seen[j] && st[j] === ch) { seen[j] = 1; stack.push(j); }
  }
  return false;
}
const hexCache = {};
function hexSolver(n) {
  if (hexCache[n]) return hexCache[n];
  const nb = hexNb(n), memo = new Map();
  const mover = (st) => { let r = 0, b = 0; for (const c of st) { if (c === 'R') r++; else if (c === 'B') b++; } return r === b ? 'R' : 'B'; };
  const val = (st) => {   // +1 if the player to move wins (Hex has no draws)
    if (memo.has(st)) return memo.get(st);
    const m = mover(st); let r = -1;
    for (let i = 0; i < st.length && r < 1; i++) if (st[i] === '.') {
      const ns = st.slice(0, i) + m + st.slice(i + 1);
      if (hexWon(ns, n, m, nb) || val(ns) === -1) r = 1;
    }
    memo.set(st, r); return r;
  };
  return (hexCache[n] = { val, mover, nb });
}
// First-move results for 4 x 4 Hex, found offline by exhaustive search (about 2.3 million positions, ~4 s): cells r*4+c where Red's opening wins.
const HEX4_WINNING = [3, 6, 9, 12];

// ---------------------------------------------------------------- Nim / Grundy
const mex = (arr) => { const s = new Set(arr); let m = 0; while (s.has(m)) m++; return m; };
const GAMES = {
  nim: { label: 'Nim heap', moves: (n) => idx(n).map((k) => [k]), },
  sub123: { label: 'subtract 1, 2 or 3', moves: (n) => [1, 2, 3].filter((s) => s <= n).map((s) => [n - s]) },
  sub25: { label: 'subtract 2 or 5', moves: (n) => [2, 5].filter((s) => s <= n).map((s) => [n - s]) },
  kayles: { label: 'Kayles row', moves: (n) => { const o = []; for (let i = 0; i <= (n - 1) / 2; i++) if (n >= 1) o.push([i, n - 1 - i]); for (let i = 0; i <= (n - 2) / 2; i++) if (n >= 2) o.push([i, n - 2 - i]); return o; } },
};
function grundyTable(key, N) {
  const g = [];
  for (let n = 0; n <= N; n++) g.push(mex(GAMES[key].moves(n).map((m) => m.reduce((x, k) => x ^ g[k], 0))));
  return g;
}
/** Brute-force outcome of a sum of rows: is the position a loss for the player to move (normal play)? Memo on sorted rows. */
function sumSolver(key) {
  const memo = new Map();
  const lost = (rows) => {
    const k = rows.join(',');
    if (memo.has(k)) return memo.get(k);
    let res = true;
    outer: for (let a = 0; a < rows.length; a++) {
      if (a > 0 && rows[a] === rows[a - 1]) continue;
      for (const mv of GAMES[key].moves(rows[a])) {
        const nr = rows.slice(0, a).concat(rows.slice(a + 1), mv.filter((x) => x > 0)).sort((x, y) => x - y);
        if (lost(nr)) { res = false; break outer; }
      }
    }
    memo.set(k, res); return res;
  };
  return { lost, memo };
}

// ---------------------------------------------------------------- hypercube tic-tac-toe
function hcLines(n, d) {
  const enc = (a) => a.reduce((s, x, k) => s + x * n ** k, 0), set = new Set(), out = [];
  const rec = (k, spec) => {
    if (k === d) {
      if (!spec.some((s) => s < 0)) return;
      const cells = []; for (let t = 0; t < n; t++) cells.push(enc(spec.map((s) => (s >= 0 ? s : s === -1 ? t : n - 1 - t))));
      const key = cells.slice().sort((a, b) => a - b).join(',');
      if (!set.has(key)) { set.add(key); out.push(cells); }
      return;
    }
    for (let c = 0; c < n; c++) rec(k + 1, [...spec, c]);
    rec(k + 1, [...spec, -1]); rec(k + 1, [...spec, -2]);
  };
  rec(0, []);
  return out;
}
const hcCache = {};
/** Search for a 2-colouring of [n]^d with no monochromatic line. res: true (found), false (none exists: exhaustive), null (budget exhausted). */
function hcSearch(n, d, limit = 300000) {
  const key = `${n}^${d}`; if (hcCache[key]) return hcCache[key];
  const lines = hcLines(n, d), N = n ** d, byMax = Array.from({ length: N }, () => []);
  lines.forEach((l) => byMax[Math.max(...l)].push(l));
  const col = new Int8Array(N).fill(-1); let steps = 0, deep = -1, deepCol = null;
  const rec = (i) => {
    if (++steps > limit) return null;
    if (i > deep) { deep = i; deepCol = Array.from(col); }
    if (i === N) return true;
    for (const c of [0, 1]) {
      col[i] = c;
      if (byMax[i].every((l) => !l.every((x) => col[x] === c))) { const r = rec(i + 1); if (r !== false) return r; }
    }
    col[i] = -1; return false;
  };
  const res = rec(0);
  return (hcCache[key] = { res, col: res ? Array.from(col) : deepCol, deep, lines, N, steps });
}

export default {
  collection: 'game',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Theorem',
      name: 'Strategy stealing: the first player wins Hex and Chomp',
      statement: String.raw`**Chomp.** On any rectangular board with more than one square, the first player has a winning strategy. **Hex.** On any $n\times n$ board the first player (who moves without any swap rule) has a winning strategy. In both games the proof is non-constructive: it shows that a winning first move exists without saying which one it is.`,
      idea: String.raw`Both games are finite and cannot end in a draw (in Hex because exactly one player connects her sides, a fact equivalent to Brouwer’s theorem), so by Zermelo (game-4.3) one of the players wins with perfect play. Suppose the second player had a winning strategy. In Chomp let the first player eat only the top-right corner square: the second player’s winning reply to that move is also available to the first player as an opening move, because it removes at least the corner — so the first player could have played it at once and won, a contradiction. In Hex let the first player place any stone and then pretend it is not there, following the second player’s winning strategy as if she were second; an extra stone never hurts in Hex. Hence it is the first player who wins.`,
      caption: String.raw`**Chomp** (poisoned bottom-left square): choose the board size; every square is coloured green if eating it from here wins and red if it loses against best play, and the table on the right gives, for every size, a winning first move as (column, row) with the number of further winning moves, if any, after a plus sign: there is never none. Switch on “show the stealing argument” to see the argument on the full board. Click to play; the computer answers perfectly. **Hex**: Red (top to bottom) moves first on a small board; every opening is coloured by the exhaustively solved outcome. On $4\times 4$ the table was solved offline.`,
      credit: 'Hex: invented by Hein (1942) and independently by Nash (late 1940s), who gave the stealing argument; Chomp: Gale, 1974; Hex and Brouwer: Gale, 1979',
      scope: String.raw`Finite games without draws, where an extra move is never a disadvantage (Chomp: the move set shrinks monotonically; Hex: extra stones only help). Hex with the swap rule is a different game, a win for the second player.`,
      deps: ['game-4.3'],
      refs: ['MSZ §3.4'],
      tags: ['strategy stealing', 'Hex', 'Chomp'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Strategy-stealing_argument' },
      verify: true,
      viz(v) {
        const B = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 360, weight: 1.15, title: 'the board' });
        const Tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 0.85, title: 'a winning first move (column, row)' });
        const T = v.table(Tb, { rows: 5, cols: 7, square: false, cellAspect: 0.9, maxCell: 50, size: 13, labelSize: 11.5, rowLabels: [2, 3, 4, 5, 6].map((r) => `${r} rows`), colLabels: [2, 3, 4, 5, 6, 7, 8].map((c) => `${c}`), cornerLabel: 'cols' });
        let game = 'chomp', R = 3, C = 5, h = [3, 3, 3, 3, 3], hx = 3, hs = '.'.repeat(9), over = null;
        const mode = v.select('game', [{ value: 'chomp', label: 'Chomp' }, { value: 'hex', label: 'Hex' }], 'chomp', { onChange: (g) => { game = g; reset(); vis(); } });
        const sR = v.slider('rows', 2, 6, 3, { int: true, onChange: (x) => { R = x; reset(); } });
        const sC = v.slider('columns', 2, 8, 5, { int: true, onChange: (x) => { C = x; reset(); } });
        const sH = v.select('Hex board', [2, 3, 4].map((x) => ({ value: x, label: `${x} × ${x}` })), 3, { onChange: (x) => { hx = x; reset(); } });
        const steal = v.toggle('show the stealing argument', true);
        const comp = v.toggle('computer replies', true);
        v.button('new game', () => reset());
        const vis = () => { sR.el.hidden = sC.el.hidden = game !== 'chomp'; sH.el.hidden = game !== 'hex'; steal.el.hidden = game !== 'chomp'; };
        const reset = () => { over = null; if (game === 'chomp') h = Array(C).fill(R); else hs = '.'.repeat(hx * hx); };
        vis(); reset();
        // ---- Chomp geometry: cell (i,j) -> [x0, y0] lower-left corner
        const cg = () => { const cs = 0.9 / Math.max(R, C * 0.8); return { cs, x0: 0.5 - cs * C / 2, y0: 0.08 }; };
        const hexPos = (r, c) => [c + 0.5 * r, -0.866 * r];
        B.onClick((x, y) => {
          if (over) return;
          if (game === 'chomp') {
            const g = cg(), j = Math.floor((x - g.x0) / g.cs), i = Math.floor((y - g.y0) / g.cs);
            if (j < 0 || j >= C || i < 0 || i >= h[j] || (i === 0 && j === 0)) return;
            h = h.map((k, c) => (c >= j ? Math.min(k, i) : k));
            if (h[0] === 1 && h.every((k, c) => (c === 0 ? true : k === 0))) { over = 'you win: the computer must eat the poison'; return; }
            if (comp.value) {
              const S = chompFor(R, C), ms = chompMoves(h), w = ms.find((m) => S.val(m.h) === -1) || ms[0];
              if (!ms.length) { over = 'you must eat the poison: you lose'; return; }
              h = w.h; if (h[0] === 1 && h.every((k, c) => (c === 0 ? true : k === 0))) over = 'you must eat the poison: you lose';
            }
          } else {
            let best = -1, bd = 0.5;
            for (let r = 0; r < hx; r++) for (let c = 0; c < hx; c++) { const [px, py] = hexPos(r, c), d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = r * hx + c; } }
            if (best < 0 || hs[best] !== '.' || hx > 3) return;
            const S = hexSolver(hx), m = S.mover(hs);
            hs = hs.slice(0, best) + m + hs.slice(best + 1);
            if (hexWon(hs, hx, m, S.nb)) { over = `${m === 'R' ? 'Red' : 'Blue'} has connected: ${m === 'R' ? 'you win' : 'the computer wins'}`; return; }
            if (comp.value) {
              const m2 = S.mover(hs); let pick = -1;
              for (let i = 0; i < hs.length && pick < 0; i++) if (hs[i] === '.') { const ns = hs.slice(0, i) + m2 + hs.slice(i + 1); if (hexWon(ns, hx, m2, S.nb) || S.val(ns) === -1) pick = i; }
              if (pick < 0) pick = hs.indexOf('.');
              hs = hs.slice(0, pick) + m2 + hs.slice(pick + 1);
              if (hexWon(hs, hx, m2, S.nb)) over = `${m2 === 'R' ? 'Red' : 'Blue'} has connected: ${m2 === 'B' ? 'the computer wins' : 'you win'}`;
            }
          }
        });
        let info;
        v.render(() => {
          if (game === 'chomp') {
            const S = chompFor(R, C), g = cg(), ms = chompMoves(h), win = new Set(ms.filter((m) => S.val(m.h) === -1).map((m) => `${m.i},${m.j}`));
            B.setView([0, 1], [0, 1]);
            const full = h.every((k) => k === R);
            let stealInfo = null;
            if (steal.value && full) {
              const corner = chompMoves(h).find((m) => m.i === R - 1 && m.j === C - 1), cornerWins = S.val(corner.h) === -1;
              const reply = cornerWins ? null : chompMoves(corner.h).find((m) => S.val(m.h) === -1);
              stealInfo = { cornerWins, reply };
            }
            for (let j = 0; j < C; j++) for (let i = 0; i < h[j]; i++) {
              const x0 = g.x0 + j * g.cs, y0 = g.y0 + i * g.cs, poison = i === 0 && j === 0, w = win.has(`${i},${j}`);
              B.rect(x0 + 1 / 400, y0 + 1 / 400, x0 + g.cs - 1 / 400, y0 + g.cs - 1 / 400, { fill: poison ? 'ink' : w ? 'green' : 'red', fillAlpha: poison ? 0.55 : 0.28, color: 'muted', width: 1 });
              if (poison) B.text('poison', x0 + g.cs / 2, y0 + g.cs / 2, { align: 'center', baseline: 'middle', size: 12, weight: 700, color: 'panel' });
            }
            if (stealInfo) {
              const cx = g.x0 + (C - 1) * g.cs, cy = g.y0 + (R - 1) * g.cs;
              B.rect(cx, cy, cx + g.cs, cy + g.cs, { stroke: true, color: 'gold', width: 4, fill: false });
              B.text('1. take the corner', cx + g.cs / 2, cy + g.cs + 0.02, { align: 'center', baseline: 'bottom', size: 11.5, color: 'gold', weight: 700 });
              if (stealInfo.reply) {
                const r = stealInfo.reply, rx = g.x0 + r.j * g.cs, ry = g.y0 + r.i * g.cs;
                B.rect(rx, ry, g.x0 + C * g.cs, g.y0 + R * g.cs, { fill: 'purple', fillAlpha: 0.1, stroke: true, color: 'purple', width: 3, dash: true });
                B.text('2. her winning reply', rx + 0.01, ry - 0.02, { align: 'left', baseline: 'top', size: 11.5, color: 'purple', weight: 700, plate: true });
              }
            }
            info = { kind: 'chomp', win: win.size, S, stealInfo, ms: ms.length };
          } else {
            const S = hexSolver(hx), n = hx;
            B.setView([-1.4, n - 1 + 0.5 * (n - 1) + 1.4], [-0.866 * (n - 1) - 1.2, 1.2]);
            const hex = (r, c, o) => { const [px, py] = hexPos(r, c), rad = 0.577, pts = idx(6).map((k) => [px + rad * Math.cos(Math.PI / 6 + k * Math.PI / 3), py + rad * Math.sin(Math.PI / 6 + k * Math.PI / 3)]); B.poly(pts, o); };
            const topL = hexPos(0, 0), botL = hexPos(n - 1, 0);
            const yT = 0.75, yB = -0.866 * (n - 1) - 0.75, k = 0.5 / 0.866;
            B.line(-0.55, yT - 0.12, n - 0.45, yT - 0.12, { color: 'red', width: 6 });
            B.line(0.5 * (n - 1) - 0.55, yB + 0.12, 0.5 * (n - 1) + n - 0.45, yB + 0.12, { color: 'red', width: 6 });
            B.line(-0.62 - yT * k + 0.45, yT - 0.12 - 0.0, -0.62 - yB * k - 0.1, yB + 0.12, { color: 'blue', width: 6 });
            B.line(n - 0.38 - yT * k + 0.45, yT - 0.12, n - 0.38 - yB * k - 0.1, yB + 0.12, { color: 'blue', width: 6 });
            const empty = hs.split('').every((c) => c === '.');
            const mv = S.mover(hs), winMoves = [];
            for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
              const i = r * n + c, ch = hs[i], [px, py] = hexPos(r, c);
              let fill = 'panel', fa = 0, tx = null, col = null;
              if (ch === 'R') { fill = 'red'; fa = 0.7; } else if (ch === 'B') { fill = 'blue'; fa = 0.7; }
              else if (!over) {
                let w;
                if (n === 4) w = empty ? HEX4_WINNING.includes(i) : null;
                else { const ns = hs.slice(0, i) + mv + hs.slice(i + 1); w = hexWon(ns, n, mv, S.nb) || S.val(ns) === -1; }
                if (w != null) { fill = w ? 'green' : 'gold'; fa = 0.3; tx = w ? 'W' : 'L'; col = w ? 'green' : 'gold'; if (w) winMoves.push(i); }
              }
              hex(r, c, { fill, fillAlpha: fa, color: 'muted', width: 1.5 });
              if (tx) B.text(tx, px, py, { align: 'center', baseline: 'middle', size: 13, weight: 700, color: col });
            }
            info = { kind: 'hex', winMoves, empty, n, mv };
          }
          // table of winning-first-move counts
          T.draw({ data: [2, 3, 4, 5, 6].map((r) => [2, 3, 4, 5, 6, 7, 8].map((c) => {
            const S = chompFor(r, c), full = Array(c).fill(r), w = chompMoves(full).filter((m) => S.val(m.h) === -1); return `${w[0].j + 1},${w[0].i + 1}${w.length > 1 ? `+${w.length - 1}` : ''}`;
          })), fill: (i, j) => (game === 'chomp' && i + 2 === R && j + 2 === C ? ['gold', 0.4] : ['green', 0.12]), highlight: game === 'chomp' ? [[R - 2, C - 2, 'gold']] : [] });
        });
        v.readout(() => {
          if (info.kind === 'chomp') {
            const { win, stealInfo, ms } = info;
            const st = stealInfo ? (stealInfo.cornerWins ? 'The corner move itself already wins.' : 'The corner move loses, so the second player would have a winning reply; but that reply is also a legal opening move that does the same damage and more, so the first player can make it at once.') : 'Reset to the full board and switch on the argument to see it.';
            return `${over ? `**${over}**\n` : ''}${ms} legal moves, ${win} of them winning (green); the full board has at least one winning first move, as the theorem says\n${st}`;
          }
          const { winMoves, empty, n } = info;
          return `${over ? `**${over}**\n` : ''}${empty ? `${winMoves.length} of ${n * n} openings win for Red on the ${n} × ${n} board${n === 4 ? ' (solved offline: the short diagonal)' : ''}; so a winning first move exists, as stealing predicts` : `Red moves first; W/L give the result of each reply with perfect play afterwards`}\n${n === 4 ? 'The 4 × 4 board is too large to solve in the browser, so only the openings are shown.' : 'Click to move as Red or Blue alternately; the computer plays the winning reply when there is one.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Theorem',
      name: 'Nim and the Sprague–Grundy theorem',
      statement: String.raw`**Nim (Bouton).** In a game of Nim with heaps $a_1,\dots,a_k$, players alternately remove any positive number of tokens from one heap, and whoever takes the last token wins. The position is a loss for the player to move exactly when the **nim-sum** $a_1\oplus\cdots\oplus a_k$ (bitwise XOR) is $0$; otherwise there is a move to a position of nim-sum $0$. **Sprague–Grundy.** In any finite impartial game (both players have the same moves, normal play) define the Grundy value $g(P)=\operatorname{mex}\{g(Q): Q \text{ a move from } P\}$. A sum of such games, in which a move is made in one component, behaves exactly like Nim with heaps of sizes $g(P_i)$: it is a loss for the player to move iff $g(P_1)\oplus\cdots\oplus g(P_k)=0$.`,
      idea: String.raw`From a position of nim-sum $0$, every move changes exactly one heap and so changes the XOR, giving a nonzero position; from a nonzero nim-sum $s$ there is a heap $a$ whose leading bit of $s$ is set, and reducing it to $a\oplus s<a$ makes the XOR zero. Since the end position has nim-sum $0$, backward induction (game-4.2) tags exactly the XOR-zero positions as losses for the mover. The mex rule says that a game with Grundy value $g$ can move to every smaller value, just like a heap of size $g$, and possibly to larger ones that can be reversed; so each component can be replaced by the Nim heap $g$.`,
      caption: String.raw`**Nim**: click a token to take it and every token above it from that heap; the computer answers by making the XOR of the binary heap sizes zero whenever it can (the right panel shows the binary digits and their XOR). **Sum of games**: choose a game (a Nim heap, two subtraction games, Kayles rows); the bars are its Grundy values $g(n)$. The grid marks, for sums of two heaps $(a,b)$, those positions that the exhaustive search shows to be lost for the mover; they coincide with $g(a)=g(b)$, i.e. $g(a)\oplus g(b)=0$.`,
      credit: 'Bouton, 1901; Sprague, 1935; Grundy, 1939',
      deps: ['game-4.2'],
      refs: ['MSZ ch. 3'],
      tags: ['Nim', 'impartial games', 'combinatorial game'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sprague%E2%80%93Grundy_theorem' },
      verify: true,
      viz(v) {
        const A = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 340, weight: 1.1, title: 'Nim' });
        const Bb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 0.9, title: 'binary digits and the nim-sum' });
        let mode = 'nim', heaps = [3, 4, 5], over = null, seed = 1, key = 'kayles';
        const NMAX = 12;
        const sel = v.select('view', [{ value: 'nim', label: 'play Nim' }, { value: 'sum', label: 'Grundy values and sums' }], 'nim', { onChange: (m) => { mode = m; vis(); } });
        const gsel = v.select('game', Object.keys(GAMES).map((k) => ({ value: k, label: GAMES[k].label })), key, { onChange: (k) => { key = k; } });
        const sa = v.slider('heap $a$', 0, NMAX, 7, { int: true });
        const sb = v.slider('heap $b$', 0, NMAX, 5, { int: true });
        const comp = v.toggle('computer replies', true);
        const bNew = v.button('random position', () => { seed++; const r = v.rng(seed); heaps = idx(r.int(2, 4)).map(() => r.int(1, 7)); over = null; });
        const bRst = v.button('reset', () => { heaps = [3, 4, 5]; over = null; });
        const vis = () => { [gsel, sa, sb].forEach((c) => { c.el.hidden = mode !== 'sum'; }); comp.el.hidden = mode !== 'nim'; bNew.hidden = bRst.hidden = mode !== 'nim'; };
        vis();
        const xor = (a) => a.reduce((x, y) => x ^ y, 0);
        const cm = () => {
          const s = xor(heaps);
          if (s === 0) { const k = heaps.indexOf(Math.max(...heaps)); heaps[k] -= 1; }
          else { const k = heaps.findIndex((a) => (a ^ s) < a); heaps[k] = heaps[k] ^ s; }
        };
              A.onClick((x, y) => {
          if (mode !== 'nim' || over) return;
          const w = 0.88 / Math.max(heaps.length, 3), x0 = 0.06;
          const k = Math.floor((x - x0) / w), j = Math.floor((y - 0.1) / 0.085);
          if (k < 0 || k >= heaps.length || j < 0 || j >= heaps[k]) return;
          heaps[k] = j;
          if (xor(heaps) === 0 && heaps.every((a) => a === 0)) { over = 'you took the last token: you win'; return; }
          if (comp.value) { cm(); if (heaps.every((a) => a === 0)) over = 'the computer took the last token: you lose'; }
        });
        const solverCache = {}, sol = (k) => (solverCache[k] = solverCache[k] || sumSolver(k));
        let info;
        v.render(() => {
          if (mode === 'nim') {
            A.setView([0, 1], [0, 1]); A.setTitle('Nim: click a token');
            const w = 0.88 / Math.max(heaps.length, 3), x0 = 0.06;
            heaps.forEach((a, k) => {
              for (let j = 0; j < a; j++) A.circle(x0 + w * (k + 0.5), 0.1 + 0.085 * (j + 0.5), 0.034, { fill: 'blue', fillAlpha: 0.45, color: 'blue', width: 1.5 });
              A.text(String(a), x0 + w * (k + 0.5), 0.05, { align: 'center', baseline: 'middle', size: 14, weight: 700, color: 'ink' });
            });
            Bb.setView([0, 1], [0, 1]); Bb.setTitle('binary digits and the nim-sum');
            const bits = 4, s = xor(heaps), cw = 0.13, bx = 0.5 - cw * bits / 2;
            heaps.forEach((a, k) => {
              const y = 0.85 - 0.11 * k;
              Bb.text(`${a}`, bx - 0.05, y, { align: 'right', baseline: 'middle', size: 13, color: 'blue', weight: 700 });
              for (let b = 0; b < bits; b++) Bb.text(String((a >> (bits - 1 - b)) & 1), bx + cw * (b + 0.5), y, { align: 'center', baseline: 'middle', size: 18, weight: 600, color: 'ink' });
            });
            const yl = 0.85 - 0.11 * heaps.length - 0.02;
            Bb.line(bx, yl + 0.045, bx + cw * bits, yl + 0.045, { color: 'ink', width: 2 });
            for (let b = 0; b < bits; b++) { const bit = (s >> (bits - 1 - b)) & 1; Bb.text(String(bit), bx + cw * (b + 0.5), yl - 0.04, { align: 'center', baseline: 'middle', size: 20, weight: 800, color: bit ? 'red' : 'green' }); }
            Bb.text(`nim-sum ${s}`, bx - 0.05, yl - 0.04, { align: 'right', baseline: 'middle', size: 13, color: s ? 'red' : 'green', weight: 700 });
            info = { s, heaps: heaps.slice() };
          } else {
            const N = NMAX, g = grundyTable(key, N), a = sa.value, b = sb.value, S = sol(key);
            A.setView([-0.8, N + 0.8], [-0.9, Math.max(...g) + 1.8]); A.setTitle(`Grundy values of “${GAMES[key].label}”`);
            g.forEach((gv, n) => { A.rect(n - 0.36, 0, n + 0.36, gv, { fill: n === a || n === b ? 'gold' : 'blue', fillAlpha: n === a || n === b ? 0.55 : 0.28, color: n === a || n === b ? 'gold' : 'blue', width: 1.5 }); A.text(String(gv), n, gv + 0.08, { align: 'center', baseline: 'bottom', size: 12, weight: 700, color: 'ink' }); A.text(String(n), n, -0.15, { align: 'center', baseline: 'top', size: 11, color: 'muted' }); });
            Bb.setView([-1.2, N + 1.4], [-1.4, N + 1.2]); Bb.setTitle('sums of two heaps: lost for the mover (brute force)');
            let bad = 0;
            for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
              const lost = S.lost([i, j].filter((x) => x > 0).sort((x, y) => x - y)), pred = (g[i] ^ g[j]) === 0;
              if (lost !== pred) bad++;
              const sel2 = i === a && j === b;
              Bb.rect(j - 0.5, N - i - 0.5, j + 0.5, N - i + 0.5, { fill: lost ? 'green' : 'panel', fillAlpha: lost ? 0.45 : 0, color: sel2 ? 'gold' : 'faint', width: sel2 ? 3 : 0.5 });
            }
            Bb.text('b →', N / 2, N + 0.9, { align: 'center', size: 11.5, color: 'muted' }); Bb.text('a ↓', -0.9, N / 2, { align: 'center', size: 11.5, color: 'muted' });
            const lost = S.lost([a, b].filter((x) => x > 0).sort((x, y) => x - y));
            const moves = GAMES[key].moves(a).map((m) => m.reduce((x, k) => x ^ g[k], 0));
            info = { g, a, b, lost, bad, states: S.memo.size, moves };
          }
        });
        v.readout(() => {
          if (mode === 'nim') {
            const { s, heaps: hh } = info;
            return `${over ? `**${over}**\n` : ''}heaps ${hh.join(', ')}: nim-sum ${s} — ${hh.every((x) => x === 0) ? 'game over' : s === 0 ? 'a loss for the player to move (every move creates a nonzero XOR)' : `a win for the player to move: reduce a heap $h$ to $h\\oplus${s}$`}`;
          }
          const { g, a, b, lost, bad, states, moves } = info;
          return `$g(${a})=\\operatorname{mex}\\{${[...new Set(moves)].sort((x, y) => x - y).join(',')}\\}=${g[a]}$, $g(${b})=${g[b]}$, $g(a)\\oplus g(b)=${g[a] ^ g[b]}$ — exhaustive search says the sum $(${a},${b})$ is ${lost ? 'lost' : 'won'} for the mover\nmismatches between the search (${states} positions evaluated) and the XOR rule over the whole grid: ${bad}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Theorem',
      name: 'High-dimensional tic-tac-toe: the first player wins',
      statement: String.raw`Play tic-tac-toe on the board $[n]^d=\{1,\dots,n\}^d$ (two players alternately mark empty cells; the first to fill a whole line of $n$ cells, in any row, column, diagonal or higher-dimensional analogue, wins). There are $\frac{(n+2)^d-n^d}{2}$ lines. If $d$ is large enough that every two-colouring of $[n]^d$ contains a monochromatic line, which by the Hales–Jewett theorem happens for all $d\ge d_0(n)$, then the game can never end in a draw, and the first player has a winning strategy.`,
      idea: String.raw`If no full board colouring is free of monochromatic lines, then a completed game always has a winner. So by Zermelo (game-4.3) one of the players can force a win. If the second player could, the first player could steal her strategy (game-4.11): make an arbitrary first move, then answer as the second player would, ignoring the extra cell, and move arbitrarily whenever the strategy calls for the cell she already owns; an extra mark never hurts in a game of line-filling, so she wins too, which is absurd. As for Chomp and Hex, nothing says how to win. The theorem is only about large $d$: in $[3]^2$ the game is a draw, while for $n=3$ a line-free colouring ceases to exist already at $d=3$.`,
      caption: String.raw`Choose $n$ and $d$ (boards of $d=3,4$ are drawn as arrays of $n\times n$ boards). The program searches for a two-colouring with no monochromatic line (blue/orange cells). If one is found a draw is not excluded; if the exhaustive search says none exists, every play-out has a winner and the stealing argument applies. If none exists, the picture shows the furthest the search ever got and the cell (red) where every colouring creates a line. Click a cell to see all lines through it. The table on the right collects the result for the sizes that fit. “?” means the step budget ran out: no conclusion.`,
      credit: 'Hales & Jewett, 1963 (“Regularity and positional games”); Golomb & Hales, 2002 (survey)',
      scope: String.raw`Lines are the geometric lines of $[n]^d$ (each coordinate constant, increasing or decreasing). “Line-free colouring exists” does not mean a draw is achievable with best play: for $4^3$ such colourings exist, yet the first player is known to win (Patashnik, 1980, by computer).`,
      deps: ['comb-11.9', 'game-4.11'],
      refs: ['MSZ §3.4'],
      tags: ['tic-tac-toe', 'Hales–Jewett', 'strategy stealing'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hales%E2%80%93Jewett_theorem' },
      verify: true,
      viz(v) {
        const B = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 360, weight: 1.15, title: 'a two-colouring of the board' });
        const Tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 0.85, title: 'is there a line-free colouring?' });
        const T = v.table(Tb, { rows: 4, cols: 4, square: false, cellAspect: 1.3, maxCell: 62, size: 15, labelSize: 12.5, rowLabels: ['n = 2', 'n = 3', 'n = 4', 'n = 5'], colLabels: ['d=1', 'd=2', 'd=3', 'd=4'], cornerLabel: '' });
        let n = 3, d = 3, pick = null;
        const sn = v.slider('side $n$', 2, 5, 3, { int: true, onChange: (x) => { n = x; clamp(); } });
        const sd = v.slider('dimension $d$', 1, 4, 3, { int: true, onChange: (x) => { d = x; clamp(); } });
        const clamp = () => { while (n ** d > 256 && d > 1) { d -= 1; sd.set(d); } pick = null; };
        const coords = (i) => { const a = []; for (let k = 0; k < d; k++) { a.push(i % n); i = Math.floor(i / n); } return a; };
        const place = (i) => {   // grid position of the cell: coordinates 0,1 within a board, 2,3 select the board
          const a = coords(i), x = a[0] + (a[2] || 0) * (n + 0.8), y = (a[1] || 0) + (a[3] || 0) * (n + 0.8);
          return [x, y];
        };
        B.onClick((x, y) => {
          let best = null, bd = 0.6;
          for (let i = 0; i < n ** d; i++) { const [px, py] = place(i), dd = Math.hypot(px + 0.5 - x, py + 0.5 - y); if (dd < bd) { bd = dd; best = i; } }
          pick = best;
        });
        const SIZES = [2, 3, 4, 5];
        let info;
        v.render(() => {
          const S = hcSearch(n, d), N = n ** d, cols = d >= 3 ? n * n + 0.8 * (n - 1) + 0 : n, W = (d >= 3 ? n * (n + 0.8) - 0.8 : n), H = (d >= 4 ? n * (n + 0.8) - 0.8 : d >= 2 ? n : 1);
          const pad = 0.8; B.setView([-pad, W + pad], [-pad, H + pad]);
          const through = pick != null ? S.lines.filter((l) => l.includes(pick)) : [];
          const inLine = new Set(through.flat());
          for (let i = 0; i < N; i++) {
            const [px, py] = place(i), c = S.col ? S.col[i] : -1;
            const col = c === 0 ? 'blue' : c === 1 ? 'orange' : 'muted', stuck = S.res !== true && i === S.deep;
            B.rect(px + 0.06, py + 0.06, px + 0.94, py + 0.94, { fill: stuck ? 'red' : col, fillAlpha: c < 0 ? (stuck ? 0.35 : 0.08) : S.res === true ? 0.4 : 0.25, color: i === pick ? 'gold' : inLine.has(i) ? 'purple' : stuck ? 'red' : col, width: i === pick ? 3.5 : inLine.has(i) ? 3 : stuck ? 3 : 1 });
          }
          // draw the lines through the picked cell as polylines through cell centres
          through.forEach((l) => B.path(l.map((i) => { const [px, py] = place(i); return [px + 0.5, py + 0.5]; }), { color: 'purple', width: 2, alpha: 0.7 }));
          // table
          const cell = {};
          SIZES.forEach((nn) => [1, 2, 3, 4].forEach((dd) => { if (nn ** dd <= 256) cell[`${nn},${dd}`] = hcSearch(nn, dd); }));
          T.draw({
            data: SIZES.map((nn) => [1, 2, 3, 4].map((dd) => { const r = cell[`${nn},${dd}`]; return !r ? '' : r.res === true ? 'draw ok' : r.res === false ? 'no draws' : '?'; })),
            fill: (i, j) => { const r = cell[`${SIZES[i]},${j + 1}`]; if (!r) return null; return r.res === false ? ['green', 0.3] : r.res === true ? ['gold', 0.25] : ['muted', 0.2]; },
            highlight: [[n - 2, d - 1, 'accent']], size: 12,
          });
          info = { S, N, nl: S.lines.length, through: through.length };
        });
        v.readout(() => {
          const { S, N, nl, through } = info, f = ((n + 2) ** d - n ** d) / 2;
          const verdict = S.res === true ? 'a colouring with no monochromatic line exists, so a drawn full board is possible and this argument does not decide the game' : S.res === false ? 'NO colouring avoids a monochromatic line (exhaustive search): every full board has a winner, so by strategy stealing the first player wins' : 'search budget exhausted: no conclusion (neither a colouring nor a proof that none exists)';
          return `$[${n}]^{${d}}$ has ${N} cells and ${nl} lines (formula $\\frac{(n+2)^d-n^d}{2}=${f}$)${through ? `; the selected cell lies on ${through} of them` : ''}\n${verdict} (${S.steps} search steps)`;
        });
      },
    },
  ],
};
