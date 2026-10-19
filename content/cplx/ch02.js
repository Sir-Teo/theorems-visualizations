// Computational Complexity — Chapter 2: The web of NP-complete problems
// Part 1 (this file, with the chapter title and summary): 2.1–2.7 — 3-dimensional matching, exact cover and tiling,
// PARTITION/KNAPSACK, weak versus strong NP-hardness, integer programming and MAX-CUT. Part 2 is ch02-b.js (2.8–2.14).
//
// Honesty notes. Every reduction drawn here is executed: the gadgets are built from the instance on screen and the answers
// on both sides (a brute-force or DPLL/dancing-links solver) are compared live. Where a picture is only a model it says so.
import {
  clamp, sup, big, cnfSat, litStr, clauseTex, allModels, dpll, dlx, subsetSumTable, subsetSumFind, adjMask, popc,
  minVertexCover,
} from './ch02.shared.js';

// ---------------------------------------------------------------------------------------------------------------
// 3-dimensional matching: the reduction from 3SAT (Garey–Johnson style variable rings, clause triples, garbage collection).
const F3 = [
  { name: 'satisfiable, 3 variables', n: 3, cl: [[1, 2, -3], [-1, 2, 3], [1, -2, 3]] },
  { name: 'two clauses', n: 3, cl: [[1, 2, 3], [-1, -2, -3]] },
  { name: 'unsatisfiable, 2 variables', n: 2, cl: [[1, 2], [1, -2], [-1, 2], [-1, -2]] },
];
function build3DM(n, cl) {
  const m = cl.length, W = [], X = [], Y = [], triples = [];
  const idx = { W: new Map(), X: new Map(), Y: new Map() };
  const add = (S, key, list, name) => { idx[S].set(name, list.length); list.push(name); };
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) { add('W', 0, W, `u${i}_${j}`); add('W', 0, W, `ū${i}_${j}`); add('X', 0, X, `a${i}_${j}`); add('Y', 0, Y, `b${i}_${j}`); }
  for (let j = 1; j <= m; j++) { add('X', 0, X, `s${j}`); add('Y', 0, Y, `t${j}`); }
  const G = m * (n - 1);
  for (let k = 1; k <= G; k++) { add('X', 0, X, `g${k}`); add('Y', 0, Y, `h${k}`); }
  const tri = (kind, w, x, y, extra = {}) => triples.push({ kind, w, x, y, ...extra });
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    tri('T', `ū${i}_${j}`, `a${i}_${j}`, `b${i}_${j}`, { i, j });
    tri('F', `u${i}_${j}`, `a${i}_${j % m + 1}`, `b${i}_${j}`, { i, j });
  }
  cl.forEach((c, jj) => { const j = jj + 1; c.forEach((l) => tri('C', l > 0 ? `u${l}_${j}` : `ū${-l}_${j}`, `s${j}`, `t${j}`, { j, lit: l })); });
  for (const w of W) for (let k = 1; k <= G; k++) tri('G', w, `g${k}`, `h${k}`, { k });
  return { n, m, W, X, Y, triples, idx, G };
}
const dm3Cache = new Map();
function dm3(fi) {
  if (!dm3Cache.has(fi)) {
    const f = F3[fi], P = build3DM(f.n, f.cl);
    const rows = P.triples.map((t) => [P.idx.W.get(t.w), P.W.length + P.idx.X.get(t.x), P.W.length + P.X.length + P.idx.Y.get(t.y)]);
    const r = dlx(rows, P.W.length + P.X.length + P.Y.length, 0, { maxSol: 1, maxNodes: 4e5 });
    P.exact = r; P.sat = allModels(f.n, f.cl, 1).length > 0;
    dm3Cache.set(fi, P);
  }
  return dm3Cache.get(fi);
}


// ---------------------------------------------------------------------------------------------------------------
// Pentominoes as exact cover. Each of the 12 free pentominoes in every orientation and position is a row; cells are
// primary items (covered exactly once), the 12 pieces are secondary items (used at most once).
const PENT = {
  F: ['.##', '##.', '.#.'], I: ['#####'], L: ['####', '#...'], N: ['###.', '..##'], P: ['###', '##.'], T: ['###', '.#.', '.#.'],
  U: ['#.#', '###'], V: ['#..', '#..', '###'], W: ['#..', '##.', '.##'], X: ['.#.', '###', '.#.'], Y: ['####', '.#..'], Z: ['##.', '.#.', '.##'],
};
const PN = Object.keys(PENT);
const ORI = {};
(() => {
  const cellsOf = (p) => { const c = []; p.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') c.push([x, y]); })); return c; };
  const norm = (c) => { const mx = Math.min(...c.map((p) => p[0])), my = Math.min(...c.map((p) => p[1])); return c.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
  for (const k of PN) {
    const seen = new Set(), out = []; let c = cellsOf(PENT[k]);
    for (let f = 0; f < 2; f++) { for (let r = 0; r < 4; r++) { c = c.map(([x, y]) => [-y, x]); const n = norm(c), key = JSON.stringify(n); if (!seen.has(key)) { seen.add(key); out.push(n); } } c = c.map(([x, y]) => [-x, y]); }
    ORI[k] = out;
  }
})();
function tilingRows(W, H, holes) {
  const idx = new Map(); let n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!holes.has(y * W + x)) idx.set(y * W + x, n++);
  const rows = [], meta = [];
  PN.forEach((k, pi) => ORI[k].forEach((o) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const cs = []; let ok = true;
      for (const [dx, dy] of o) { const X = x + dx, Y = y + dy; if (X >= W || Y >= H || !idx.has(Y * W + X)) { ok = false; break; } cs.push(idx.get(Y * W + X)); }
      if (ok) { rows.push([...cs, n + pi]); meta.push({ pi, cells: cs }); }
    }
  }));
  return { rows, meta, n, idx };
}

// 3-PARTITION: m triples, bound B. Instance with all numbers in (B/4, B/2); `perturb` moves one unit between two numbers of
// different planted triples, which usually destroys all solutions (the search must then exhaust the tree).
function threePartInstance(m, B, seed, perturb) {
  let st = seed >>> 0; const r = () => { st = (st * 1664525 + 1013904223) >>> 0; return st / 4294967296; };
  const a = [], lo = Math.floor(B / 4);
  for (let i = 0; i < m; i++) for (;;) {
    const x = lo + 1 + Math.floor(r() * (B / 4 - 1)), y = lo + 1 + Math.floor(r() * (B / 4 - 1)), z = B - x - y;
    if (z > B / 4 && z < B / 2) { a.push(x, y, z); break; }
  }
  if (perturb && m > 1) {
    const i = Math.floor(r() * a.length); let j; do { j = Math.floor(r() * a.length); } while (Math.floor(j / 3) === Math.floor(i / 3));
    if (a[i] + 1 < B / 2 && a[j] - 1 > B / 4) { a[i]++; a[j]--; }
  }
  return a;
}
function threePartSearch(a, m, B, cap) {
  const v = a.slice().sort((x, y) => y - x), n = v.length, load = Array(m).fill(0), cnt = Array(m).fill(0);
  let nodes = 0, found = false, capped = false;
  (function rec(i) {
    if (found || capped) return; nodes++; if (nodes > cap) { capped = true; return; }
    if (i === n) { found = true; return; }
    const seen = new Set();
    for (let b = 0; b < m; b++) {
      if (cnt[b] >= 3 || load[b] + v[i] > B) continue; const key = `${load[b]},${cnt[b]}`; if (seen.has(key)) continue; seen.add(key);
      load[b] += v[i]; cnt[b]++; rec(i + 1); load[b] -= v[i]; cnt[b]--; if (found) return;
    }
  })(0);
  return { found, nodes, capped };
}

export default {
  collection: 'cplx',
  chapter: 2,
  title: 'The web of NP-complete problems',
  summary: String.raw`Thousands of problems from scheduling, packing, routing and puzzles are NP-complete, linked by gadget reductions. Numbers matter: some problems are hard only when their numbers are written in binary, others are hard even in unary. Structural results organize the landscape — every constraint-satisfaction problem over Booleans is either polynomial or NP-complete, sparse sets cannot be NP-complete unless P = NP — and conjectures predict that all NP-complete problems are essentially the same problem in disguise.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Theorem',
      name: '3-dimensional matching is NP-complete',
      statement: String.raw`Let $W,X,Y$ be disjoint sets of equal size $q$ and $T\subseteq W\times X\times Y$ a set of triples. **3-DIMENSIONAL MATCHING (3DM)** asks whether some $M\subseteq T$ with $|M|=q$ covers every element of $W\cup X\cup Y$ exactly once. 3DM is in NP (a matching is checked in linear time) and NP-complete: 3SAT $\le_p$ 3DM.`,
      idea: String.raw`From a 3CNF with $n$ variables and $m$ clauses build, for each variable, a *ring* of $2m$ triples in which neighbours share one private element, so the ring can be covered only by taking all the odd triples (set $x=\text{true}$) or all the even ones ($x=\text{false}$). Each ring leaves exactly one *free outside element* per literal occurrence; a clause gets three triples, one per literal, and can be matched only by grabbing a free outside element of a true literal. Finally garbage-collection triples absorb the $m(n-1)$ outside elements nobody used. A matching therefore forces a consistent truth assignment satisfying every clause — this is the same variable-gadget/clause-gadget pattern as the Cook–Levin reduction to 3SAT (toc-13.5), with "choose one of two states" now enforced by exact covering rather than by a Boolean constraint.`,
      caption: String.raw`**Click a variable ring** to flip it between the two ways of covering it (filled triples are in the matching). A clause (bottom) is matched by one of its literals whose outside element is *free* — the dashed line from the clause to the ring triple that holds that element turns green when the element is free and the clause takes it, grey while it is still free, and red if the clause has no free literal. The readout counts how many of the $3\cdot 2nm$ elements the resulting matching covers exactly once, and compares with a dancing-links search over *all* triples: a perfect matching exists exactly when the formula is satisfiable. Choose the unsatisfiable formula and no assignment — and no matching — works. (The picture shows each ring triple once; garbage triples are drawn as a single pool.)`,
      deps: ["toc-13.5","logic-2.5","alg-1.4a"],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Karp, 1972 (the gadget shown is the Garey–Johnson form)',
      tags: ['3DM', 'gadgets', 'reductions'],
      viz(v) {
        const fsel = v.select('formula', F3.map((f, i) => ({ value: i, label: f.name })), 0);
        const st = { a: [] };
        const s = v.stage({ x: [0, 12], y: [-0.3, 8], axes: false, equal: true, height: 400, full: true });
        let cur = -1, P, ring = [];
        const setup = () => {
          if (cur === fsel.value) return; cur = fsel.value; P = dm3(cur);
          const { n, m } = P; st.a = Array(n + 1).fill(1); st.a[0] = null; ring = [];
          for (let i = 1; i <= n; i++) {
            const cx = (12 * (i - 0.5)) / n, cy = 4.9, r = n === 2 ? 1.9 : 1.5, nodes = [];
            for (let k = 0; k < 2 * m; k++) { const th = Math.PI / 2 - (2 * Math.PI * k) / (2 * m); nodes.push({ x: cx + r * Math.cos(th), y: cy + r * Math.sin(th), kind: k % 2 === 0 ? 'T' : 'F', j: Math.floor(k / 2) + 1 }); }
            ring[i] = { cx, cy, r, nodes };
          }
        };
        s.onClick((x, y) => {
          setup(); let best = -1, bd = 1e9;
          for (let i = 1; i <= P.n; i++) { const d = Math.hypot(x - ring[i].cx, y - ring[i].cy); if (d < bd) { bd = d; best = i; } }
          if (bd < ring[best].r + 0.9) st.a[best] ^= 1;
        });
        v.button('Solve with DPLL', () => { setup(); const r = dpll(P.n, F3[cur].cl); if (r.model) st.a = r.model.map((x, i) => (i ? x : null)); });
        v.button('Flip all', () => { setup(); for (let i = 1; i <= P.n; i++) st.a[i] ^= 1; });
        let info = null;
        v.render(() => {
          setup(); const { n, m } = P, cl = F3[cur].cl, a = st.a;
          // chosen matching
          const count = new Map(); const bump = (e) => count.set(e, (count.get(e) || 0) + 1);
          const used = new Set();
          for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
            const t = a[i] ? { w: `ū${i}_${j}`, x: `a${i}_${j}`, y: `b${i}_${j}` } : { w: `u${i}_${j}`, x: `a${i}_${j % m + 1}`, y: `b${i}_${j}` };
            bump(t.w); bump(t.x); bump(t.y); used.add(t.w);
          }
          const claim = [];
          cl.forEach((c, jj) => {
            const j = jj + 1; let got = null;
            for (const l of c) { const e = l > 0 ? `u${l}_${j}` : `ū${-l}_${j}`; if (!used.has(e) && (a[Math.abs(l)] === 1) === (l > 0)) { got = { l, e }; break; } }
            if (got) { used.add(got.e); bump(got.e); bump(`s${j}`); bump(`t${j}`); }
            claim.push(got);
          });
          const freeW = P.W.filter((w) => !used.has(w));
          let gk = 0; for (const w of freeW) { if (gk < P.G) { gk++; bump(w); bump(`g${gk}`); bump(`h${gk}`); } }
          const all = [...P.W, ...P.X, ...P.Y]; let once = 0, miss = 0, dup = 0;
          for (const e of all) { const c = count.get(e) || 0; if (c === 1) once++; else if (c === 0) miss++; else dup++; }
          info = { once, miss, dup, total: all.length, ok: miss === 0 && dup === 0, satisfied: cnfSat(cl, a) };
          // ring drawing
          for (let i = 1; i <= n; i++) {
            const R = ring[i], nodes = R.nodes;
            for (let k = 0; k < nodes.length; k++) {
              const A = nodes[k], B = nodes[(k + 1) % nodes.length];
              s.line(A.x, A.y, B.x, B.y, { color: 'faint', width: 3, alpha: 0.7 });
            }
            s.text(`$x_{${i}}=$ ${a[i] ? 'true' : 'false'}`, R.cx, R.cy + R.r + 0.75, { align: 'center', baseline: 'middle', size: 15, weight: 700, color: a[i] ? 'green' : 'red' });
            nodes.forEach((N) => {
              const on = (N.kind === 'T') === (a[i] === 1);
              s.dot(N.x, N.y, { r: on ? 9 : 8, color: on ? 'accent' : 'muted', hollow: !on });
              s.text(N.kind === 'T' ? 'T' : 'F', N.x, N.y, { align: 'center', baseline: 'middle', size: 9.5, weight: 700, color: on ? 'panel' : 'muted', halo: false });
            });
          }
          // clauses
          cl.forEach((c, jj) => {
            const j = jj + 1, cx = (12 * (jj + 0.5)) / m, cy = 0.9, got = claim[jj];
            for (const l of c) {
              const i = Math.abs(l), N = ring[i].nodes[2 * (j - 1) + (l > 0 ? 1 : 0)]; // F_j holds u, T_j holds ū
              const isFree = !((l > 0 ? a[i] === 0 : a[i] === 1));
              const mine = got && got.l === l;
              s.line(cx, cy, N.x, N.y, { color: mine ? 'green' : isFree ? 'muted' : 'faint', width: mine ? 3 : 1.4, dash: !mine, alpha: mine ? 1 : isFree ? 0.8 : 0.4 });
            }
            s.dot(cx, cy, { r: 15, color: got ? 'green' : 'red', hollow: !got });
            s.text(`$c_{${j}}$`, cx, cy, { align: 'center', baseline: 'middle', size: 12, weight: 700, color: got ? 'panel' : 'red', halo: false });
            s.tex(clauseTex(c).replace(/\\lor/g, '\\lor'), cx, cy - 0.85, { size: 12, align: 'center', color: 'muted' });
          });
          s.text(`${P.triples.length} triples in all (${P.triples.filter((t) => t.kind === 'G').length} garbage)`, 11.9, 7.6, { align: 'right', size: 11, color: 'muted' });
        });
        v.legend([['accent', 'triple in the matching', { dot: true }], ['muted', 'triple left out', { dot: true }], ['green', 'clause takes a free literal element', { dot: true }], ['red', 'clause cannot be matched', { dot: true }]]);
        v.readout(() => {
          const P2 = P, f = F3[cur];
          return `$|W|=|X|=|Y|=2nm=${P2.W.length}$ · elements covered exactly once: **${info.once}/${info.total}** (missed ${info.miss}, doubly covered ${info.dup}) · assignment satisfies $\\varphi$: **${info.satisfied ? 'yes' : 'no'}** · this matching is perfect: ${info.ok ? '**yes**' : '**no**'}\n`
            + `Exhaustive dancing-links search over all ${P2.triples.length} triples: perfect matching exists — **${P2.exact.solutions.length ? 'yes' : P2.exact.capped ? 'search capped' : 'no'}**; formula $\\varphi$ satisfiable — **${P2.sat ? 'yes' : 'no'}** (n = ${f.n}, m = ${f.cl.length}).`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Exact cover and tiling puzzles are NP-complete',
      statement: String.raw`**EXACT COVER**: given a universe $U$ and a family $\mathcal S$ of subsets of $U$, is there a subfamily of pairwise disjoint sets whose union is $U$? EXACT COVER is NP-complete (3DM reduces to it, by taking $U=W\cup X\cup Y$ and each triple as a set), even when every set has exactly three elements. Consequently tiling problems — can a given region be tiled by a given set of polyomino shapes? — are NP-complete too when the region and the tile set are part of the input (they are in Garey–Johnson's catalogue); a *fixed* small puzzle, like the pentomino boards below, is of course finite and easy.`,
      idea: String.raw`3DM (2.1) is literally exact cover with triples as sets. Every tiling puzzle is an exact-cover *instance*: each placement of a tile (shape, orientation, position) is a set containing the cells it covers, and a tiling is a selection of disjoint placements covering every cell. Knuth's Algorithm X with dancing links searches this problem by always branching on the cell with the fewest placements; this is the best generic method, and still the number of nodes grows quickly with the board — unavoidable unless P = NP. Hardness for tilings comes from the reverse direction: gadget regions simulating variable choices and clauses (not shown).`,
      caption: String.raw`**Pentominoes on a board.** Each of the 12 pieces may be used at most once. Pick a **board** and a **solution** (the first solutions found by dancing links); **click a cell** to punch or fill a hole and watch the search fail or succeed. The lower panel is the exact-cover matrix of the chosen solution: one row per placed piece, one column per cell — each column has exactly one filled entry, which is the definition of an exact cover. The right panel plots the *number of search nodes needed to exhaust the board* (log scale) for rectangles of increasing area, measured live: the cost climbs by a large factor for every few extra cells.`,
      deps: ['cplx-2.1'],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Exact cover: Karp, 1972; dancing links: Knuth, 2000',
      tags: ['exact cover', 'tiling', 'search'],
      viz(v) {
        const BOARDS = [[3, 5], [5, 5], [5, 6], [5, 8], [6, 10]];
        const bsel = v.select('board', BOARDS.map(([w, h], i) => ({ value: i, label: `${w}×${h}` })), 3);
        const kS = v.slider('solution', 1, 60, 1, { int: true });
        const holes = new Set(); let holeBoard = -1;
        const s1 = v.stage({ x: [0, 8], y: [0, 5], axes: false, equal: true, height: 300, weight: 1.15, title: 'a tiling (click a cell to toggle a hole)' });
        const s2 = v.stage({ x: [0.5, 8.5], y: [1, 1e6], ylog: true, axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'cells to tile', ylabel: 'nodes to exhaust', title: 'cost of the search' });
        const s3 = v.stage({ x: [0, 60], y: [0, 12], axes: false, height: 180, full: true, title: 'exact-cover matrix of the chosen solution (rows: placed pieces, columns: cells)' });
        const COLS = ['blue', 'orange', 'green', 'red', 'purple', 'teal', 'pink', 'gold'];
        const colOf = (pi) => COLS[pi % 8];
        let cache = { key: '' }, growth = [], measuring = false;
        const solve = () => {
          const bi = bsel.value, [W, H] = BOARDS[bi];
          if (holeBoard !== bi) { holes.clear(); holeBoard = bi; }
          const key = `${bi}:${[...holes].sort().join(',')}`;
          if (cache.key === key) return cache;
          const T = tilingRows(W, H, holes);
          const r = dlx(T.rows, T.n, 12, { maxSol: 60, maxNodes: 4e5 });
          const r1 = dlx(T.rows, T.n, 12, { maxSol: 1, maxNodes: 4e5 });
          return (cache = { key, W, H, T, r, first: r1.nodes, area: T.n });
        };
        const measure = () => {
          if (measuring) return; measuring = true;
          const list = [[3, 5], [4, 5], [5, 5], [5, 6], [5, 7], [5, 8]]; let i = 0;
          const step = () => {
            if (i >= list.length) return;
            const [W, H] = list[i++], T = tilingRows(W, H, new Set()), r = dlx(T.rows, T.n, 12, { maxSol: 1e9, maxNodes: 4e6 });
            growth.push({ W, H, area: W * H, nodes: r.nodes, sols: r.solutions.length }); v.invalidate(); setTimeout(step, 30);
          };
          setTimeout(step, 50);
        };
        s1.onClick((x, y) => {
          const S = solve(), c = Math.floor(x), rr = S.H - 1 - Math.floor(y);
          if (c < 0 || c >= S.W || rr < 0 || rr >= S.H) return;
          const id = rr * S.W + c; if (holes.has(id)) holes.delete(id); else holes.add(id);
        });
        v.button('Clear holes', () => { holes.clear(); });
        v.render(() => {
          measure();
          const S = solve(), { W, H, T, r } = S, nsol = r.solutions.length;
          const pick = nsol ? Math.min(kS.value, nsol) - 1 : -1;
          s1.setView([-0.2, Math.max(W, 1) + 0.2], [-0.2, H + 0.2]);
          const owner = new Map(); // cell index in board -> piece index
          const cellOf = []; for (const [id, i] of T.idx) cellOf[i] = id;
          const placed = pick >= 0 ? r.solutions[pick].map((ri) => T.meta[ri]) : [];
          placed.forEach((p) => p.cells.forEach((c) => owner.set(cellOf[c], p.pi)));
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const id = y * W + x, py = H - 1 - y;
            if (holes.has(id)) { s1.rect(x + 0.08, py + 0.08, x + 0.92, py + 0.92, { fill: 'red', fillAlpha: 0.12, color: 'red', width: 1, hatch: true }); continue; }
            const pi = owner.get(id);
            if (pi === undefined) { s1.rect(x + 0.04, py + 0.04, x + 0.96, py + 0.96, { fill: 'faint', fillAlpha: 0.12, color: 'faint', width: 1 }); continue; }
            s1.rect(x, py, x + 1, py + 1, { fill: colOf(pi), fillAlpha: pi >= 8 ? 0.35 : 0.6, color: colOf(pi), width: 0.5, hatch: pi >= 8 });
          }
          // piece outlines + letters
          const ownerAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : owner.has(y * W + x) ? owner.get(y * W + x) : -2);
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const o = ownerAt(x, y); if (o < 0) continue; const py = H - 1 - y;
            if (ownerAt(x + 1, y) !== o) s1.line(x + 1, py, x + 1, py + 1, { color: 'ink', width: 2.2 });
            if (ownerAt(x - 1, y) !== o) s1.line(x, py, x, py + 1, { color: 'ink', width: 2.2 });
            if (ownerAt(x, y + 1) !== o) s1.line(x, py, x + 1, py, { color: 'ink', width: 2.2 });
            if (ownerAt(x, y - 1) !== o) s1.line(x, py + 1, x + 1, py + 1, { color: 'ink', width: 2.2 });
          }
          placed.forEach((p) => { const c = cellOf[p.cells[0]]; s1.text(PN[p.pi], (c % W) + 0.5, H - 1 - Math.floor(c / W) + 0.5, { align: 'center', baseline: 'middle', size: 13, weight: 800, color: 'ink', halo: false }); });
          if (pick < 0) s1.corner(S.area % 5 ? 'area not divisible by 5: no tiling' : r.capped ? 'search capped' : 'no tiling exists', 'tl', { color: 'red', weight: 700, plate: true });
          // matrix
          const n = S.area; s3.setView([0, Math.max(n, 20)], [0, 12.5]);
          placed.slice().sort((a, b) => a.pi - b.pi).forEach((p, row) => {
            const yy = 12 - row - 1; s3.text(PN[p.pi], -0.2, yy + 0.5, { align: 'right', size: 10, color: 'muted', halo: false });
            for (let c = 0; c < n; c++) s3.rect(c + 0.06, yy + 0.08, c + 0.94, yy + 0.92, { fill: p.cells.includes(c) ? colOf(p.pi) : 'faint', fillAlpha: p.cells.includes(c) ? 0.85 : 0.1, stroke: false });
          });
          // growth plot
          const pts = growth.map((g) => [g.area, g.nodes]);
          s2.setView([0, 45], [1, 1e6]);
          s2.path(pts, { color: 'accent', width: 2 }); s2.dots(pts, { color: 'accent', r: 4 });
          growth.forEach((g) => s2.text(`${g.W}×${g.H}`, g.area, g.nodes * 1.7, { size: 10, align: 'center', color: 'muted' }));
          if (S.area && !holes.size) { const g = growth.find((q) => q.W === W && q.H === H); if (g) s2.dot(g.area, g.nodes, { r: 8, color: 'gold', hollow: true }); }
          if (growth.length < 6) s2.corner('measuring…', 'tl', { color: 'muted' });
          S.placed = placed; S.pick = pick;
        });
        v.readout(() => {
          const S = solve(), r = S.r, g = growth.length >= 2 ? growth[growth.length - 1] : null;
          const cover = S.placed ? (() => { const c = Array(S.area).fill(0); S.placed.forEach((p) => p.cells.forEach((i) => c[i]++)); return c.every((x) => x === 1); })() : false;
          return `${S.area} cells · ${S.T.rows.length} placements (rows of the matrix) · solutions found: **${r.solutions.length}${r.solutions.length >= 60 ? '+' : ''}** · dancing-links nodes to the first solution: **${big(S.first)}** · each cell covered exactly once: **${S.pick >= 0 ? (cover ? 'yes' : 'NO') : '—'}**`
            + (g ? `\nExhausting a ${g.W}×${g.H} board (${g.area} cells) took **${big(g.nodes)}** nodes and has **${big(g.sols)}** tilings, each piece used at most once.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'PARTITION and KNAPSACK are NP-complete',
      statement: String.raw`**SUBSET-SUM**: given positive integers $a_1,\dots,a_n$ (in binary) and a target $t$, is there $I\subseteq[n]$ with $\sum_{i\in I}a_i=t$? **PARTITION**: can $a_1,\dots,a_m$ be split into two parts of equal sum? **KNAPSACK** (decision): given weights $w_i$, values $c_i$, a capacity $W$ and a goal $C$, is there $I$ with $\sum_I w_i\le W$ and $\sum_I c_i\ge C$? All three are in NP and NP-complete. Reductions: SUBSET-SUM $\le_p$ PARTITION (add two numbers $S+t$ and $2S-t$, where $S=\sum a_i$), and SUBSET-SUM $\le_p$ KNAPSACK (take $w_i=c_i=a_i$, $W=C=t$).`,
      idea: String.raw`SUBSET-SUM is NP-hard by a reduction from 3SAT/exact cover that writes each clause and variable as a *digit* of a large number (toc-13.11). To move to PARTITION add $p=S+t$ and $q=2S-t$: the total becomes $4S$, so each side must weigh $2S$; $p+q=3S>2S$ forces $p$ and $q$ onto opposite sides; the side holding $p$ needs exactly $S-t$ more from the $a_i$ and the side holding $q$ exactly $t$ — i.e. a subset summing to $t$. For KNAPSACK, give each item equal weight and value: weight $\le t$ and value $\ge t$ squeeze the sum to exactly $t$.`,
      caption: String.raw`Click a number to move it between the left and right pile (the same piles in all three views). **Subset-sum:** the right pile is the chosen subset; the bar shows its sum against the target $t$ (drag the slider). **Partition:** the numbers plus the two *balancing numbers* $p,q$ sit on a balance; it levels exactly when a subset-sum solution has been found, and the readout reads that solution back from the pile that holds $q$. **Knapsack:** weight and value are both $a_i$, capacity and goal both $t$. Drag $t$ to an unreachable value and all three problems say "no" together; "Solve" runs the dynamic program and fills in a witness.`,
      deps: ['toc-13.11'],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Karp, 1972',
      tags: ['subset sum', 'partition', 'knapsack'],
      viz(v) {
        let seed = 3, A = [], side = [], S = 0;
        const mode = v.select('view', [{ value: 'ss', label: 'SUBSET-SUM' }, { value: 'part', label: 'PARTITION' }, { value: 'knap', label: 'KNAPSACK' }], 'ss');
        const tS = v.slider('target $t$', 0, 300, 0, { int: true });
        const s = v.stage({ x: [-7, 7], y: [-0.3, 8.7], axes: false, equal: true, height: 410, full: true });
        const gen = () => {
          const r = v.rng(seed); A = []; for (let i = 0; i < 7; i++) A.push(6 + Math.floor(r() * 35));
          S = A.reduce((x, y) => x + y, 0); side = Array(A.length + 2).fill(0); side[A.length + 1] = 1;
          let t = 0; A.forEach((a) => { if (r() < 0.5) t += a; }); tS.set(Math.min(t, S));
          const pk = subsetSumFind(A, tS.value); if (pk && pk.length > 1) { pk.slice(1).forEach((i) => { side[i] = 1; }); }
        };
        gen();
        let hits = [];
        const items = () => [...A.map((a, i) => ({ v: a, i, k: 'a' })), { v: S + tS.value, i: A.length, k: 'p' }, { v: 2 * S - tS.value, i: A.length + 1, k: 'q' }];
        s.onClick((x, y) => { for (const h of hits) if (x >= h[0] && x <= h[2] && y >= h[1] && y <= h[3]) { side[h[4]] ^= 1; return; } });
        v.button('Solve (DP)', () => {
          const t = tS.value;
          if (mode.value === 'part') { const all = items().map((q) => q.v), pick = subsetSumFind(all, 2 * S); side = side.map(() => 0); if (pick) pick.forEach((i) => { side[i] = 1; }); }
          else { const pick = subsetSumFind(A, t); side = side.map((_, i) => (i === A.length + 1 ? 1 : 0)); if (pick) pick.forEach((i) => { side[i] = 1; }); }
        });
        v.button('Clear', () => { side = side.map((_, i) => (i === A.length + 1 ? 1 : 0)); });
        v.button('New numbers', () => { seed++; gen(); });
        const sums = () => {
          const it = items(), L = [0, 0]; it.forEach((q) => { if (mode.value === 'part' || q.k === 'a') L[side[q.i]] += q.v; });
          return L;
        };
        const COL = { a: 'accent', p: 'orange', q: 'purple' };
        v.render(() => {
          const t = tS.value, it = items(), md = mode.value, L = sums();
          tS.set(clamp(t, 0, S));
          hits = [];
          const showPQ = md === 'part';
          const piles = [[], []]; it.forEach((q) => { if (q.k === 'a' || showPQ) piles[side[q.i]].push(q); });
          let tilt = 0, dyL = 0, dyR = 0;
          if (md === 'part') {
            const th = clamp(((L[1] - L[0]) / (2 * S + 1)) * 0.9, -0.2, 0.2), len = 4.6, py = 7.2;
            tilt = th;
            const xl = -len * Math.cos(th), yl = py + len * Math.sin(th), xr = len * Math.cos(th), yr = py - len * Math.sin(th);
            s.poly([[-0.5, 6.3], [0.5, 6.3], [0, py]], { fill: 'muted', fillAlpha: 0.5, color: 'muted' });
            s.line(xl, yl, xr, yr, { color: 'ink', width: 5 }); s.dot(0, py, { r: 7, color: 'ink' });
            [[xl, yl], [xr, yr]].forEach(([x, y]) => { s.line(x, y, x - 1.2, y - 0.6, { color: 'muted', width: 1.5 }); s.line(x, y, x + 1.2, y - 0.6, { color: 'muted', width: 1.5 }); s.line(x - 1.2, y - 0.6, x + 1.2, y - 0.6, { color: 'ink', width: 4 }); });
            dyL = yl - 0.62; dyR = yr - 0.62;
            const ok = L[0] === L[1];
            s.text(`$${L[0]}$`, xl, yl + 0.55, { align: 'center', size: 14, weight: 700, color: ok ? 'green' : 'ink' });
            s.text(`$${L[1]}$`, xr, yr + 0.55, { align: 'center', size: 14, weight: 700, color: ok ? 'green' : 'ink' });
          }
          const cx = md === 'part' ? [-4.6 * Math.cos(tilt), 4.6 * Math.cos(tilt)] : [-3.8, 3.8], base = [md === 'part' ? dyL : 0.3, md === 'part' ? dyR : 0.3];
          [0, 1].forEach((p) => {
            piles[p].forEach((q, k) => {
              const x0 = cx[p] - 1.1, x1 = cx[p] + 1.1, y1 = md === 'part' ? base[p] - 0.04 - k * 0.52 : base[p] + 0.46 + k * 0.52, y0 = y1 - 0.46;
              const col = COL[q.k]; hits.push([x0, y0, x1, y1, q.i]);
              s.rect(x0, y0, x1, y1, { fill: col, fillAlpha: 0.35, color: col, width: 1.6, radius: 4 });
              s.text(String(q.v), (x0 + x1) / 2, (y0 + y1) / 2, { align: 'center', baseline: 'middle', size: 12.5, weight: 700, color: 'ink', halo: false });
            });
          });
          if (md !== 'part') {
            s.text(md === 'ss' ? 'not chosen' : 'left behind', cx[0], 4.5, { align: 'center', size: 12, color: 'muted' });
            s.text(md === 'ss' ? 'chosen subset' : 'in the knapsack', cx[1], 4.5, { align: 'center', size: 12, color: 'muted' });
            // bar(s)
            const draw = (y, label, val, goal, exact) => {
              const maxv = Math.max(S, goal) * 1.02, X = (u) => -6.5 + (13 * u) / maxv;
              s.rect(-6.5, y, 6.5, y + 0.5, { fill: 'faint', fillAlpha: 0.15, color: 'faint', width: 1 });
              let acc = 0; piles[1].forEach((q) => { s.rect(X(acc), y, X(acc + q.v), y + 0.5, { fill: 'accent', fillAlpha: 0.45, color: 'accent', width: 1 }); acc += q.v; });
              s.line(X(goal), y - 0.2, X(goal), y + 0.7, { color: 'green', width: 3 });
              s.text(`${label}`, -6.5, y + 0.95, { size: 12, color: 'muted' });
              s.text(`$${val}$ vs $t=${goal}$`, 6.5, y + 0.95, { align: 'right', size: 12.5, weight: 700, color: exact ? 'green' : val > goal ? 'red' : 'ink' });
            };
            if (md === 'ss') draw(6.4, 'sum of the chosen numbers', L[1], t, L[1] === t);
            else { draw(7.0, 'total weight $\\le t$', L[1], t, L[1] <= t); draw(5.6, 'total value $\\ge t$', L[1], t, L[1] >= t); }
          }
          s._tilt = tilt;
        });
        v.legend([['accent', 'numbers $a_i$', { dot: true }], ['orange', '$p=S+t$', { dot: true }], ['purple', '$q=2S-t$', { dot: true }]]);
        v.readout(() => {
          const t = tS.value, T = subsetSumTable(A, S), allv = items().map((q) => q.v), P = subsetSumTable(allv, 2 * S);
          const ss = !!T[t], part = !!P[2 * S];
          let best = 0; for (let x = t; x >= 0; x--) if (T[x]) { best = x; break; }
          const knap = best >= t, L = sums();
          let line;
          if (mode.value === 'ss') line = `chosen sum $=${L[1]}$ vs target $t=${t}$ → ${L[1] === t ? '**exact: a solution**' : `off by ${Math.abs(L[1] - t)}`}`;
          else if (mode.value === 'part') {
            const qSide = side[A.length + 1]; const back = A.map((a, i) => (side[i] === qSide ? a : 0)).reduce((x, y) => x + y, 0);
            line = `left $=${L[0]}$, right $=${L[1]}$ (total $4S=${4 * S}$) → ${L[0] === L[1] ? `**balanced** — the numbers on $q$'s side sum to $${back}$ ${back === t ? '$=t$ ✓' : ''}` : 'tipped'}`.replace('$$', '$');
          } else { const wsum = L[1]; line = `weight $${wsum}\\le ${t}$: ${wsum <= t ? 'ok' : '**too heavy**'} · value $${wsum}\\ge ${t}$: ${wsum >= t ? 'ok' : 'not yet'} → ${wsum === t ? '**solution**' : ''}`; }
          return `$S=${S}$, $t=${t}$ · ${line}\nDynamic programming: SUBSET-SUM **${ss ? 'yes' : 'no'}** · PARTITION of the $n+2$ numbers **${part ? 'yes' : 'no'}** · KNAPSACK (best value within capacity $t$ is $${best}$) **${knap ? 'yes' : 'no'}** — ${ss === part && part === knap ? 'the three answers agree' : 'DISAGREE'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Concept',
      name: 'Weak versus strong NP-hardness',
      statement: String.raw`An NP-complete problem with numerical parameters is **weakly NP-hard** if it is solvable in *pseudo-polynomial* time — polynomial in the *values* of the numbers, i.e. in the input length when the numbers are written in unary — and **strongly NP-hard** if it stays NP-complete when every number is bounded by a polynomial in the input length (equivalently, when numbers are written in unary). SUBSET-SUM, PARTITION and KNAPSACK are weakly NP-hard: a dynamic program over sums runs in $O(nt)$. 3-PARTITION (split $3m$ integers strictly between $B/4$ and $B/2$ into $m$ triples each summing to $B$), bin packing and many scheduling problems are strongly NP-hard; unless P = NP none of them has a pseudo-polynomial algorithm.`,
      idea: String.raw`The DP table for subset-sum has $n\times t$ cells: polynomial in $t$, but $t$ has only $\log_2 t$ bits, so the table is exponential in the input length written in binary and linear in it when written in unary (2.3 shows why binary is the honest encoding). That is the whole gap between "weak" and "strong". Strong hardness cannot be avoided by shrinking the numbers: the reduction for 3-PARTITION (from 3DM, 2.1, via numbers of polynomial size) produces numbers with $O(\log m)$ bits, so even an algorithm polynomial in unary-encoded values would solve NP-complete problems.`,
      caption: String.raw`**Left (knapsack/subset-sum dynamic program).** Choose the number of items and the number of decimal **digits** of the target; the dynamic program is actually run (up to about $10^7$ steps) and its steps counted at the current setting (the marker); the curves are the exact $nt$. Each extra digit multiplies the work by ten — exponential in the *binary* input length (orange) but *linear* in the *unary* length (grey). **Right (3-PARTITION).** The numbers are kept tiny ($B\le 1600$, i.e. polynomial) and the number of triples $m$ grows; a plain backtracking search needs roughly twenty times more nodes per extra triple, with no size-of-numbers escape: this is what "strongly" hard looks like (the nodes are measured live; ≥ marks a search stopped at 4·10⁵ nodes).`,
      deps: ['cplx-2.3', 'toc-12.9'],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Garey & Johnson, 1978 (strong NP-completeness)',
      tags: ['pseudo-polynomial', 'encoding'],
      viz(v) {
        const nS = v.slider('items $n$', 4, 12, 8, { int: true });
        const dS = v.slider('digits of target $t$', 1, 6, 4, { int: true });
        const bS = v.select('bound $B$ (3-PARTITION)', [40, 100, 400, 1600].map((b) => ({ value: b, label: String(b) })), 100);
        const A = v.stage({ x: [0.5, 7.5], y: [1, 1e9], ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'digits of $t$', ylabel: 'size / steps', title: 'knapsack dynamic program', weight: 1 });
        const B = v.stage({ x: [1.5, 7.5], y: [1, 1e6], ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'triples $m$', ylabel: 'search nodes', title: '3-PARTITION, tiny numbers', weight: 1 });
        const store = {}; // B -> {m: {nodes, capped}}
        const compute = (b) => {
          if (store[b]) return store[b]; const res = store[b] = {}; let m = 2;
          const step = () => {
            if (m > 7) return; let tot = 0, any = false;
            for (let sd = 1; sd <= 4; sd++) { const a = threePartInstance(m, b, sd * 37 + m, true), r = threePartSearch(a, m, b, 1e5); tot += r.nodes; any = any || r.capped; }
            res[m] = { nodes: tot / 4, capped: any }; m++; v.invalidate(); setTimeout(step, 20);
          };
          setTimeout(step, 30); return res;
        };
        const dpRun = (n, t) => {
          const r = v.rng(11 + n), a = []; for (let i = 0; i < n; i++) a.push(Math.max(1, Math.floor(t * (0.15 + 0.4 * r()))));
          const T = new Uint8Array(t + 1); T[0] = 1; let ops = 0;
          for (const x of a) for (let s = t; s >= x; s--) { ops++; if (T[s - x]) T[s] = 1; }
          return { ops, hit: !!T[t] };
        };
        let last = null;
        v.render(() => {
          const n = nS.value, d = dS.value;
          const ds = [1, 2, 3, 4, 5, 6, 7];
          const ops = ds.map((k) => n * 10 ** k), bin = ds.map((k) => n * Math.ceil(k * Math.log2(10))), un = ds.map((k) => n * 10 ** k);
          A.path(ds.map((k, i) => [k, ops[i]]), { color: 'accent', width: 3 });
          A.path(ds.map((k, i) => [k, bin[i]]), { color: 'orange', width: 3 });
          A.path(ds.map((k, i) => [k, un[i] * 0.7]), { color: 'muted', width: 2, dash: true });
          A.vline(d, { color: 'gold', dash: [4, 3], width: 1.5 });
          A.dot(d, ops[d - 1], { r: 6, color: 'accent' }); A.dot(d, bin[d - 1], { r: 6, color: 'orange' });
          if (!last || last.n !== n || last.d !== d) { last = dpRun(n, 10 ** d); last.n = n; last.d = d; }
          const b = bS.value, res = compute(b), ms = Object.keys(res).map(Number).sort((x, y) => x - y);
          B.path(ms.map((m) => [m, res[m].nodes]), { color: 'purple', width: 2.5 }); B.dots(ms.map((m) => [m, res[m].nodes]), { color: 'purple', r: 4 });
          ms.forEach((m) => { if (res[m].capped) B.text('≥', m, res[m].nodes * 1.6, { align: 'center', size: 12, color: 'purple' }); });
          if (ms.length < 6) B.corner('measuring…', 'tl', { color: 'muted' });
        });
        v.legend([['accent', 'DP steps $\\approx nt$'], ['orange', 'binary input length (bits)'], ['muted', 'unary input length', { dash: true }], ['purple', 'backtracking nodes, 3-PARTITION']]);
        v.readout(() => {
          const n = nS.value, d = dS.value, t = 10 ** d, bits = n * Math.ceil(d * Math.log2(10));
          return `$n=${n}$ numbers of $\\approx ${d}$ digits, $t=10^{${d}}$: the DP actually ran **${big(last.ops)}** steps · binary input length ≈ **${bits}** bits, so steps/bits = **${big(last.ops / bits)}** · unary input length $nt\\approx$ **${big(n * t)}**, so steps/length ≈ **${(last.ops / (n * t)).toFixed(2)}** ✓ linear\nAdding one digit multiplies the DP by 10 but adds only ${n * 3} bits: pseudo-polynomial, not polynomial. 3-PARTITION with $B\\le${bS.value}$ keeps growing by ≈ 20× per triple.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Integer linear programming is NP-complete',
      statement: String.raw`**ILP (0–1 integer programming)**: given an integer matrix $A$ and vector $b$, is there $x\in\{0,1\}^n$ with $Ax\ge b$? It is in NP and NP-complete, even though the same question over the *reals* (linear programming) is in P. Reduction: 3SAT $\le_p$ 0–1 ILP — for each clause $(\ell_1\lor\ell_2\lor\ell_3)$ add the inequality $\tilde\ell_1+\tilde\ell_2+\tilde\ell_3\ge 1$, where $\tilde\ell=x_i$ for a positive literal and $1-x_i$ for a negative one.`,
      idea: String.raw`A 0/1 assignment satisfies a clause exactly when the sum of its literal values is at least $1$, so the integer solutions of the system are the satisfying assignments of the formula (toc-13.5 supplies the 3SAT hardness). Geometrically each clause slices a corner off the cube $[0,1]^n$: the half-space $\tilde\ell_1+\tilde\ell_2+\tilde\ell_3\ge1$ cuts away exactly the one vertex that falsifies all three literals. The linear-programming relaxation (drop integrality, keep $0\le x\le1$) is solvable in polynomial time (algo-11.15 for the geometry of the optimum), but it can be non-empty while the formula is unsatisfiable — for instance $x_i=\tfrac12$ satisfies every 3-literal clause with room to spare — and that integrality gap is exactly where the hardness lives.`,
      caption: String.raw`Switch between **2 variables** (the plane: each 2-literal clause is a half-plane) and **3 variables** (the cube: each clause cuts off one corner). Toggle clauses on and off. Green dots are 0/1 points that satisfy all active clauses; red hollow dots are cut off. In the plane, red shading marks the regions excluded by individual clauses; the feasible LP polygon or segment is green, and the gold point marks the LP optimum. In the cube, red triangles mark the planes cutting off individual corners. In the plane, rotate the **objective direction** to see the LP optimum (a vertex of the feasible region, possibly fractional) next to the best *integer* point. Turn on all four clauses over two variables, or all eight over three: no 0/1 point survives, but the fractional point $(\tfrac12,\tfrac12,\dots)$ is still feasible, so the relaxation cannot decide the formula.`,
      deps: ["toc-13.5","algo-11.15","opt-4.4","opt-2.3","logic-2.5"],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Karp, 1972',
      tags: ['integer programming', 'relaxation'],
      viz(v) {
        const mode = v.select('variables', [{ value: 2, label: '2 (plane)' }, { value: 3, label: '3 (cube)' }], 2);
        // plane clauses: [label, [a1, a2], b] meaning a·(x,y) >= b
        const PC = [['x∨y', [1, 1], 1], ['x∨¬y', [1, -1], 0], ['¬x∨y', [-1, 1], 0], ['¬x∨¬y', [-1, -1], -1]];
        const pOn = [true, true, true, false];
        const pT = PC.map((c, i) => v.toggle(`$${c[0].replace('∨', '\\lor ').replace(/¬(\w)/g, '\\bar $1')}$`, pOn[i]));
        // cube clauses indexed by the cut vertex (bits x,y,z): the clause is falsified exactly by that vertex
        const cT = []; for (let m = 0; m < 8; m++) {
          const lits = [0, 1, 2].map((k) => ((m >> k) & 1 ? `\\bar ${'xyz'[k]}` : 'xyz'[k]));
          cT.push(v.toggle(`$(${lits.join('\\lor ')})$`, [0, 7, 3, 4].includes(m)));
        }
        const phi = v.slider('objective direction (°)', 0, 359, 225, { int: true });
        const S2 = v.stage({ x: [-0.3, 1.3], y: [-0.3, 1.3], equal: true, axes: 'box', gutter: true, height: 380, xlabel: '$x$', ylabel: '$y$', title: 'LP relaxation and integer points', weight: 1.2 });
        const S3 = v.stage3d({ range: 1.7, height: 380, yaw: 0.7, pitch: 0.45, labels: ['x', 'y', 'z'], axes: false });
        S3.el.style.display = 'none';
        const clip = (poly, a, b) => {
          const out = [], f = (p) => a[0] * p[0] + a[1] * p[1] - b;
          for (let i = 0; i < poly.length; i++) {
            const P = poly[i], Q = poly[(i + 1) % poly.length], fp = f(P), fq = f(Q);
            if (fp >= -1e-12) out.push(P);
            if ((fp >= -1e-12) !== (fq >= -1e-12)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
          }
          return out;
        };
        let info = {};
        v.render(() => {
          const m3 = mode.value === 3;
          S2.el.style.display = m3 ? 'none' : ''; S3.el.style.display = m3 ? '' : 'none';
          pT.forEach((t) => { t.el.hidden = m3; }); cT.forEach((t) => { t.el.hidden = !m3; }); phi.el && (phi.el.hidden = m3);
          if (!m3) {
            let poly = [[0, 0], [1, 0], [1, 1], [0, 1]];
            PC.forEach((c, i) => { if (pT[i].value) poly = clip(poly, c[1], c[2]); });
            const act = PC.filter((c, i) => pT[i].value);
            S2.rect(0, 0, 1, 1, { color: 'muted', width: 1.5 });
            act.forEach((c) => {
              // draw the boundary line of the half-plane clipped to the box and the forbidden side hatched
              const [a1, a2] = c[1], b = c[2];
              const pts = []; [[0, 0], [1, 0], [1, 1], [0, 1]].forEach((P, k, arr) => { const Q = arr[(k + 1) % 4], fp = a1 * P[0] + a2 * P[1] - b, fq = a1 * Q[0] + a2 * Q[1] - b; if (fp === 0) pts.push(P); else if (fp * fq < 0) { const t = fp / (fp - fq); pts.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); } });
              if (pts.length >= 2) S2.line(pts[0][0], pts[0][1], pts[1][0], pts[1][1], { color: 'orange', width: 2, dash: true });
              const bad = clip([[0, 0], [1, 0], [1, 1], [0, 1]], [-a1, -a2], -b);
              if (bad.length >= 3) S2.poly(bad, { fill: 'red', fillAlpha: 0.1, color: 'red', stroke: false });
            });
            const uniq = []; poly.forEach((p) => { if (!uniq.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-9)) uniq.push(p); });
            if (uniq.length >= 3) S2.poly(uniq, { fill: 'green', fillAlpha: 0.25, color: 'green', width: 2.2 });
            else if (uniq.length === 2) S2.line(uniq[0][0], uniq[0][1], uniq[1][0], uniq[1][1], { color: 'green', width: 4 });
            const ang = (phi.value * Math.PI) / 180, c = [Math.cos(ang), Math.sin(ang)];
            let lp = null; uniq.forEach((p) => { if (!lp || c[0] * p[0] + c[1] * p[1] > c[0] * lp[0] + c[1] * lp[1] + 1e-12) lp = p; });
            const ints = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([x, y]) => ({ x, y, ok: act.every((q) => q[1][0] * x + q[1][1] * y >= q[2]) }));
            let ip = null; ints.forEach((p) => { if (p.ok && (!ip || c[0] * p.x + c[1] * p.y > c[0] * ip.x + c[1] * ip.y)) ip = p; });
            if (lp) { S2.line(lp[0] - 0.9 * c[1], lp[1] + 0.9 * c[0], lp[0] + 0.9 * c[1], lp[1] - 0.9 * c[0], { color: 'gold', width: 1.5, dash: true }); S2.dot(lp[0], lp[1], { r: 8, color: 'gold', label: 'LP optimum', labelPos: 'ne' }); }
            S2.arrow(0.5, 0.5, 0.5 + 0.28 * c[0], 0.5 + 0.28 * c[1], { color: 'gold', width: 2.5 });
            ints.forEach((p) => S2.dot(p.x, p.y, { r: 7, color: p.ok ? 'green' : 'red', hollow: !p.ok, label: `(${p.x},${p.y})`, labelPos: p.x ? 'nw' : 'ne' }));
            info = { lp, ip, nint: ints.filter((p) => p.ok).length, empty: uniq.length === 0, act: act.length, c };
          } else {
            const act = []; cT.forEach((t, m) => { if (t.value) act.push(m); });
            const P = (x, y, z) => [2 * x - 1, 2 * y - 1, 2 * z - 1];
            const V = []; for (let m = 0; m < 8; m++) V.push([m & 1, (m >> 1) & 1, (m >> 2) & 1]);
            for (let a = 0; a < 8; a++) for (let k = 0; k < 3; k++) { const b = a ^ (1 << k); if (a < b) S3.line(P(...V[a]), P(...V[b]), { color: 'muted', width: 1.2 }); }
            act.forEach((m) => {
              const nb = [0, 1, 2].map((k) => V[m ^ (1 << k)]);
              S3.poly(nb.map((q) => P(...q)), { fill: 'red', fillAlpha: 0.22, color: 'red' });
            });
            const ok = V.map((q) => act.every((m) => !(q[0] === (m & 1) && q[1] === ((m >> 1) & 1) && q[2] === ((m >> 2) & 1))));
            V.forEach((q, m) => S3.dot(P(...q), { r: ok[m] ? 6 : 5, color: ok[m] ? 'green' : 'red', label: `${q.join('')}` }));
            S3.dot(P(0.5, 0.5, 0.5), { r: 7, color: 'gold', label: '(½,½,½)' });
            info = { nint: ok.filter(Boolean).length, act: act.length, cube: true };
          }
        });
        v.legend([['green', 'satisfies all active clauses', { dot: true }], ['red', 'cut off by a clause', { dot: true }], ['gold', 'fractional LP point / objective', { dot: true }]]);
        v.readout(() => {
          if (info.cube) return `${info.act} clause${info.act === 1 ? '' : 's'} active · 0/1 points surviving (= satisfying assignments): **${info.nint}** of 8 · the centre $(\\tfrac12,\\tfrac12,\\tfrac12)$ gives every clause the value $\\tfrac32\\ge1$, so the **LP relaxation is feasible ${info.nint === 0 ? 'although the formula is unsatisfiable' : '(and so is the formula)'}**.`;
          const f = (p) => `(${v.fix(p[0], 2)}, ${v.fix(p[1], 2)})`;
          return `${info.act} clause${info.act === 1 ? '' : 's'} active · integer feasible points: **${info.nint}** · LP optimum: **${info.lp ? f(info.lp) : 'infeasible'}** · best integer point: **${info.ip ? `(${info.ip.x}, ${info.ip.y})` : 'none'}**` + (info.lp && info.ip ? ` · LP value $${v.fix(info.c[0] * info.lp[0] + info.c[1] * info.lp[1], 3)}$ vs integer value $${v.fix(info.c[0] * info.ip.x + info.c[1] * info.ip.y, 3)}$` : '') + (info.lp && !info.ip ? ' — **the relaxation is feasible but no 0/1 point is: integrality gap**' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'MAX-CUT is NP-complete',
      statement: String.raw`**MAX-CUT**: given an undirected graph $G=(V,E)$ with edge weights and a number $K$, is there a partition $V=A\sqcup B$ such that the total weight of edges between $A$ and $B$ is at least $K$? It is in NP and NP-complete, already for unit weights. Reduction (shown here with weights): NAE-3SAT $\le_p$ MAX-CUT, where NAE-3SAT asks for an assignment under which every clause has at least one true and at least one false literal.`,
      idea: String.raw`For each variable $x_i$ make two vertices $x_i,\bar x_i$ joined by an edge of large weight $M=2m+1$: a cut of maximum weight will separate them, and "$x_i$ on the left" reads as $x_i=\text{true}$. For each clause put a triangle of weight-1 edges on its three literal vertices. A triangle contributes $2$ to the cut when its vertices are *not* all on one side (a triangle cannot be cut by three edges) and $0$ otherwise — exactly the NAE condition. Hence the best cut has weight $nM+2\cdot\#\{\text{NAE-satisfied clauses}\}$, and reaches $K=nM+2m$ iff the formula is NAE-satisfiable. NAE-3SAT itself is NP-complete by a reduction from 3SAT (toc-13.5) that adds one fresh variable per clause.`,
      caption: String.raw`**Drag a vertex across the middle line** to move it between the left and the right side; cut edges are drawn solid red. In the *gadget* instances the heavy gold edges are the variable edges and each clause is a triangle; the readout compares your cut with the exact optimum (exhaustive search over all $2^{|V|-1}$ partitions) and with the threshold $K=nM+2m$. Try to reach $K$ for the satisfiable formula, and see that for the unsatisfiable one no partition can: the best cut stays below $K$. The *random graph* instance is plain MAX-CUT with unit weights.`,
      deps: ["toc-13.5","graph-1.9.1b"],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Karp, 1972 (MAX-CUT via PARTITION); the NAE-3SAT gadget is the Garey–Johnson–Stockmeyer one',
      tags: ['max-cut', 'NAE-3SAT'],
      viz(v) {
        const INST = [
          { name: 'NAE-satisfiable formula', n: 4, cl: [[1, 2, -3], [-1, 3, 4], [2, -3, -4]] },
          { name: 'NAE-unsatisfiable formula', n: 3, cl: [[1, 2, 3], [1, 2, -3], [1, -2, 3], [-1, 2, 3]] },
          { name: 'random graph', n: 0, cl: [] },
        ];
        const sel = v.select('instance', INST.map((q, i) => ({ value: i, label: q.name })), 0);
        const s = v.stage({ x: [-5, 5], y: [-3.7, 3.7], axes: false, height: 400, full: true });
        const H = []; for (let i = 0; i < 8; i++) H.push(s.handle(0, 0, { color: 'accent', r: 12, label: '' }));
        let cur = -1, G = null, seedR = 4;
        const build = () => {
          const q = INST[sel.value]; let nodes = [], edges = [], K = null, M = 0, meta = {};
          if (q.n) {
            const m = q.cl.length; M = 2 * m + 1;
            for (let i = 1; i <= q.n; i++) nodes.push({ id: i - 1, name: `x${i}`, x: -2.6, y: 3.0 - (6 * (i - 1)) / (q.n - 1) });
            for (let i = 1; i <= q.n; i++) nodes.push({ id: q.n + i - 1, name: `¬x${i}`, x: 2.6, y: 3.0 - (6 * (i - 1)) / (q.n - 1) });
            const lit = (l) => (l > 0 ? l - 1 : q.n + (-l) - 1);
            for (let i = 0; i < q.n; i++) edges.push({ a: i, b: q.n + i, w: M, kind: 'var' });
            q.cl.forEach((c, j) => { const t = c.map(lit); [[0, 1], [1, 2], [0, 2]].forEach(([u, w]) => edges.push({ a: t[u], b: t[w], w: 1, kind: 'cl', j })); });
            K = q.n * M + 2 * m; meta = { n: q.n, m, M };
          } else {
            const r = v.rng(seedR); for (let i = 0; i < 8; i++) nodes.push({ id: i, name: `${i + 1}`, x: (i < 4 ? -2.6 : 2.6) + (r() - 0.5) * 1.4, y: 3 - ((i % 4) * 6) / 3 + (r() - 0.5) * 0.8 });
            for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) if (r() < 0.45) edges.push({ a: i, b: j, w: 1, kind: 'g' });
          }
          const N = nodes.length; let best = -1, bm = 0;
          for (let mk = 0; mk < (1 << (N - 1)); mk++) { let w = 0; for (const e of edges) if (((mk >> e.a) & 1) !== ((mk >> e.b) & 1)) w += e.w; if (w > best) { best = w; bm = mk; } }
          if (q.n) { // start from the assignment with the fewest NAE-satisfied clauses
            let worst = 1e9, wa = 0;
            for (let a = 0; a < (1 << q.n); a++) { let c = 0; q.cl.forEach((cl) => { const vals = cl.map((l) => (((a >> (Math.abs(l) - 1)) & 1) === 1) === (l > 0)); if (!(vals[0] === vals[1] && vals[1] === vals[2])) c++; }); if (c < worst) { worst = c; wa = a; } }
            for (let i = 0; i < q.n; i++) { const tr = (wa >> i) & 1; nodes[i].x = tr ? -2.6 : 2.6; nodes[q.n + i].x = tr ? 2.6 : -2.6; }
          }
          nodes.forEach((nd, i) => H[i].set(nd.x, nd.y));
          return { nodes, edges, K, M, best, bm, meta, q };
        };
        const setup = () => { if (cur === sel.value) return; cur = sel.value; G = build(); H.forEach((h, i) => { h.visible = i < G.nodes.length; }); };
        v.button('Show an optimal cut', () => { setup(); G.nodes.forEach((nd, i) => { const sd = (G.bm >> i) & 1; H[i].set(sd ? 2.6 : -2.6, H[i].y); }); });
        v.button('New random graph', () => { seedR++; cur = -1; sel.set(2); setup(); });
        let st = {};
        v.render(() => {
          setup(); const N = G.nodes.length;
          H.forEach((h, i) => { if (i < N) { h.constrain && 0; if (h.x < -4.6) h.set(-4.6, h.y); if (h.x > 4.6) h.set(4.6, h.y); if (Math.abs(h.x) < 0.25) h.set(h.x < 0 ? -0.25 : 0.25, h.y); } });
          const side = H.slice(0, N).map((h) => (h.x > 0 ? 1 : 0));
          s.rect(-5, -3.7, 0, 3.7, { fill: 'accent', fillAlpha: 0.05, stroke: false }); s.rect(0, -3.7, 5, 3.7, { fill: 'orange', fillAlpha: 0.06, stroke: false });
          s.vline(0, { color: 'muted', width: 1.5, dash: true });
          s.text('side $A$', -4.8, 3.4, { size: 13, color: 'accent', weight: 700 }); s.text('side $B$', 4.8, 3.4, { size: 13, color: 'orange', weight: 700, align: 'right' });
          let cut = 0, varCut = 0, naeOK = 0;
          G.edges.forEach((e) => {
            const A = H[e.a], B = H[e.b], c = side[e.a] !== side[e.b]; if (c) cut += e.w; if (c && e.kind === 'var') varCut++;
            const style = e.kind === 'var' ? { color: c ? 'gold' : 'faint', width: c ? 5 : 3, alpha: c ? 1 : 0.7 } : { color: c ? 'red' : 'faint', width: c ? 2.4 : 1.2, alpha: c ? 0.9 : 0.55 };
            s.line(A.x, A.y, B.x, B.y, style);
          });
          if (G.q.n) {
            G.q.cl.forEach((c) => { const sd = c.map((l) => side[l > 0 ? l - 1 : G.q.n + (-l) - 1]); if (!(sd[0] === sd[1] && sd[1] === sd[2])) naeOK++; });
            if (varCut === G.q.n) { /* assignment readable */ }
          }
          G.nodes.forEach((nd, i) => { const h = H[i]; h.color = side[i] ? 'orange' : 'accent'; h.label = nd.name; });
          st = { cut, varCut, naeOK, N };
        });
        v.legend([['gold', 'variable edge (weight $M$) — cut', { dash: false }], ['red', 'cut edge'], ['faint', 'uncut edge']]);
        v.readout(() => {
          setup(); const q = G.q;
          if (!q.n) return `unit weights, ${G.edges.length} edges · your cut: **${st.cut}** · maximum cut (exhaustive): **${G.best}** ${st.cut === G.best ? '— optimal' : `(you are ${G.best - st.cut} short)`}`;
          const full = st.varCut === q.n, pred = q.n * G.M + 2 * st.naeOK;
          const sat = G.best >= G.K;
          return `$n=${q.n}$ variables, $m=${q.cl.length}$ clauses, $M=${G.M}$ · your cut: **${st.cut}** · threshold $K=nM+2m=${G.K}$ · optimum: **${G.best}**\n`
            + (full ? `all ${q.n} variable edges are cut ⇒ an assignment is encoded; NAE-satisfied clauses: **${st.naeOK}/${q.cl.length}**, and cut = $nM+2\\cdot${st.naeOK}=${pred}$ ✓` : `only ${st.varCut}/${q.n} variable edges cut — not a valid assignment (and never optimal: the weight $M$ is too large to give up)`)
            + ` · optimum ≥ K ⇔ the formula is NAE-satisfiable: **${sat ? 'yes' : 'no'}**.`;
        });
      },
    },
  ],
};
