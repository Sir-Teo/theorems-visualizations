// Computational Complexity — Chapter 2 (The web of NP-complete problems), part 2: 2.8–2.14
// SET-COVER and HITTING-SET, planar 3-colouring, hard puzzles, Schaefer's dichotomy theorem, Mahaney's theorem, the
// Berman–Hartmanis isomorphism conjecture, and Karp's 1972 paper. Part 1 is ch02.js (2.1–2.7).
//
// Honesty notes. Reductions are executed on the instance on screen and both sides are solved by brute force or DPLL. Two items
// (2.12, 2.13) rest on hypotheses that are believed false or open: their pictures simulate the *hypothetical* object (a sparse
// reduction, a pair of padding functions) and say so.
import {
  clamp, sup, big, cnfSat, litStr, clauseTex, cnfTex, allModels, dpll, dlx, subsetSumFind, adjMask, popc,
  minVertexCover, maxClique, threeColour, randomCNF,
} from './ch02.shared.js';

// ---------------------------------------------------------------------------------------------------------------
// The planar 3-colouring crossover gadget: terminals a=T0, b=T1, a'=T2, b'=T3 on the outer face (vertices 0..3), inner ring
// A (4..7), outer ring B (8..11), hub C (12). Found by an exhaustive search over 4-fold symmetric graphs on 13 vertices; the
// properties below (12 colourings, a=a' and b=b' always, every (a,b) possible) are re-verified at load time.
const GAD_E = [[0, 4], [1, 5], [2, 6], [3, 7], [0, 8], [1, 9], [2, 10], [3, 11], [0, 9], [1, 10], [2, 11], [3, 8], [4, 5], [5, 6], [6, 7], [4, 7], [4, 8], [5, 9], [6, 10], [7, 11], [4, 12], [5, 12], [6, 12], [7, 12]];
const GAD_P = (() => {
  const a = (d) => (d * Math.PI) / 180, P = [];
  for (let i = 0; i < 4; i++) P[i] = [Math.cos(a(90 * i)), Math.sin(a(90 * i))];
  for (let i = 0; i < 4; i++) P[4 + i] = [0.42 * Math.cos(a(90 * i - 22)), 0.42 * Math.sin(a(90 * i - 22))];
  for (let i = 0; i < 4; i++) P[8 + i] = [0.62 * Math.cos(a(90 * i - 45)), 0.62 * Math.sin(a(90 * i - 45))];
  P[12] = [0, 0]; return P;
})();
const GAD_COLS = (() => {
  const n = 13, adj = Array.from({ length: n }, () => []); GAD_E.forEach(([u, w]) => { adj[u].push(w); adj[w].push(u); });
  const col = Array(n).fill(-1), all = [];
  (function rec(k) { if (k === n) { all.push(col.slice()); return; } for (let c = 0; c < 3; c++) { if (adj[k].some((w) => w < k && col[w] === c)) continue; col[k] = c; rec(k + 1); } col[k] = -1; })(0);
  return all;
})();
const segCross = (p, q, r, s) => { const o = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); return o(p, q, r) * o(p, q, s) < -1e-12 && o(r, s, p) * o(r, s, q) < -1e-12; };
/** Replace every crossing of a straight-line drawing by the gadget. Returns the planarised graph with a straight-line drawing. */
function planarize(pos, edges, s = 0.12) {
  const cr = [];
  for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
    const [a, b] = edges[i], [c, d] = edges[j]; if (a === c || a === d || b === c || b === d) continue;
    if (!segCross(pos[a], pos[b], pos[c], pos[d])) continue;
    const p = pos[a], q = pos[b], r = pos[c], t = pos[d], den = (q[0] - p[0]) * (t[1] - r[1]) - (q[1] - p[1]) * (t[0] - r[0]);
    const t1 = ((r[0] - p[0]) * (t[1] - r[1]) - (r[1] - p[1]) * (t[0] - r[0])) / den, t2 = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / den;
    cr.push({ e1: i, e2: j, t1, t2, X: [p[0] + t1 * (q[0] - p[0]), p[1] + t1 * (q[1] - p[1])] });
  }
  const P = pos.map((p) => p.slice()), E = [], n0 = pos.length, orig = [];
  const dir = (e) => { const [a, b] = edges[e], dx = pos[b][0] - pos[a][0], dy = pos[b][1] - pos[a][1], L = Math.hypot(dx, dy); return [dx / L, dy / L]; };
  const onEdge = edges.map((_, e) => cr.filter((c) => c.e1 === e || c.e2 === e).sort((x, y) => (x.e1 === e ? x.t1 : x.t2) - (y.e1 === e ? y.t1 : y.t2)));
  const ioMap = new Map(); // `${crossing index}:${edge}` -> {inn, out}
  edges.forEach((ed, e) => {
    let prev = ed[0];
    onEdge[e].forEach((c) => {
      const d = dir(e), out = P.length; P.push([c.X[0] + s * d[0], c.X[1] + s * d[1]]);
      ioMap.set(`${cr.indexOf(c)}:${e}`, { inn: prev, out }); prev = out;
    });
    E.push([prev, ed[1]]);
  });
  cr.forEach((c, ci) => {
    const A = ioMap.get(`${ci}:${c.e1}`), B = ioMap.get(`${ci}:${c.e2}`), d1 = dir(c.e1), d2 = dir(c.e2);
    const id = Array(13); id[0] = A.inn; id[2] = A.out; id[1] = B.inn; id[3] = B.out;
    for (let k = 4; k < 13; k++) { const g = GAD_P[k]; id[k] = P.length; P.push([c.X[0] - s * (g[0] * d1[0] + g[1] * d2[0]), c.X[1] - s * (g[0] * d1[1] + g[1] * d2[1])]); }
    GAD_E.forEach(([u, w]) => E.push([id[u], id[w]]));
  });
  return { pos: P, edges: E, n0, cr };
}
const DRAWINGS = (() => {
  const reg = (n, R = 1, a0 = 90) => Array.from({ length: n }, (_, i) => [R * Math.cos(((a0 - (360 * i) / n) * Math.PI) / 180), R * Math.sin(((a0 - (360 * i) / n) * Math.PI) / 180)]);
  const k4 = { name: 'K₄ (not 3-colourable)', pos: [[-1, 1], [1, 1], [1, -1], [-1, -1]].map((p) => [p[0] * 0.8, p[1] * 0.8]), edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]] };
  const k5 = { name: 'K₅ (not 3-colourable)', pos: reg(5, 1), edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 2], [2, 4], [4, 1], [1, 3], [3, 0]] };
  const pet = { name: 'Petersen graph', pos: [...reg(5, 1), ...reg(5, 0.5)], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5], [1, 6], [2, 7], [3, 8], [4, 9], [5, 7], [7, 9], [9, 6], [6, 8], [8, 5]] };
  return [k4, k5, pet];
})();

// ---------------------------------------------------------------------------------------------------------------
// Sudoku as exact cover (N = n² symbols, boxes n×n): 4N² constraints, N³ candidate rows.
function sudokuSolve(n, grid, maxSol = 2) {
  const N = n * n, rows = [], meta = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (let d = 0; d < N; d++) {
    const g = grid[r * N + c]; if (g && g !== d + 1) continue;
    const b = Math.floor(r / n) * n + Math.floor(c / n);
    rows.push([r * N + c, N * N + r * N + d, 2 * N * N + c * N + d, 3 * N * N + b * N + d]); meta.push([r, c, d + 1]);
  }
  const res = dlx(rows, 4 * N * N, 0, { maxSol, maxNodes: 3e5 });
  return { sols: res.solutions.map((s) => { const g = Array(N * N).fill(0); s.forEach((ri) => { const [r, c, d] = meta[ri]; g[r * N + c] = d; }); return g; }), nodes: res.nodes, capped: res.capped, rows: rows.length };
}
const WIKI9 = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
// Minesweeper: a position is a list of revealed numbers; enumerate the mine layouts of the unrevealed cells consistent with it.
function mineSolve(W, H, num, cap = 4e5) {
  const idx = (x, y) => y * W + x, nb = (x, y) => { const o = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const X = x + dx, Y = y + dy; if (X >= 0 && X < W && Y >= 0 && Y < H) o.push(idx(X, Y)); } return o; };
  const cons = []; const frontier = new Set();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = num[idx(x, y)]; if (k === null) continue; const u = nb(x, y).filter((i) => num[i] === null); cons.push({ cell: idx(x, y), u, need: k }); u.forEach((i) => frontier.add(i)); }
  const F = [...frontier].sort((a, b) => a - b), pos = new Map(F.map((c, i) => [c, i]));
  const by = F.map(() => []); cons.forEach((c, ci) => c.u.forEach((i) => by[pos.get(i)].push(ci)));
  const have = cons.map(() => 0), left = cons.map((c) => c.u.length), a = Array(F.length).fill(-1);
  const tally = F.map(() => 0); let count = 0, nodes = 0, capped = false;
  (function rec(k) {
    if (capped) return; nodes++; if (nodes > cap) { capped = true; return; }
    if (k === F.length) { count++; a.forEach((x, i) => { if (x) tally[i]++; }); return; }
    for (const val of [0, 1]) {
      let ok = true; a[k] = val;
      for (const ci of by[k]) { have[ci] += val; left[ci]--; }
      for (const ci of by[k]) if (have[ci] > cons[ci].need || have[ci] + left[ci] < cons[ci].need) { ok = false; break; }
      if (ok) rec(k + 1);
      for (const ci of by[k]) { have[ci] -= val; left[ci]++; }
      a[k] = -1;
    }
  })(0);
  return { F, count, nodes, capped, tally, cons };
}

// ---------------------------------------------------------------------------------------------------------------
// Schaefer's dichotomy: Boolean relations, the six polymorphism tests, and instances.
const REL = [
  { id: 'or3', k: 3, tex: 'x\\lor y\\lor z', f: (a, b, c) => a | b | c },
  { id: 'nae', k: 3, tex: '\\mathrm{NAE}(x,y,z)', f: (a, b, c) => +!(a === b && b === c) },
  { id: 'one', k: 3, tex: '\\text{1-in-3}(x,y,z)', f: (a, b, c) => +(a + b + c === 1) },
  { id: 'x1', k: 3, tex: 'x\\oplus y\\oplus z=1', f: (a, b, c) => a ^ b ^ c },
  { id: 'x0', k: 3, tex: 'x\\oplus y\\oplus z=0', f: (a, b, c) => 1 - (a ^ b ^ c) },
  { id: 'horn', k: 3, tex: '\\bar x\\lor\\bar y\\lor z', f: (a, b, c) => (1 - a) | (1 - b) | c },
  { id: 'dhorn', k: 3, tex: 'x\\lor y\\lor\\bar z', f: (a, b, c) => a | b | (1 - c) },
  { id: 'or2', k: 2, tex: 'x\\lor y', f: (a, b) => a | b },
  { id: 'imp', k: 2, tex: 'x\\to y', f: (a, b) => (1 - a) | b },
  { id: 'neq', k: 2, tex: 'x\\ne y', f: (a, b) => a ^ b },
  { id: 'nand', k: 2, tex: '\\bar x\\lor\\bar y', f: (a, b) => (1 - a) | (1 - b) },
  { id: 'u1', k: 1, tex: 'x=1', f: (a) => a },
  { id: 'u0', k: 1, tex: 'x=0', f: (a) => 1 - a },
];
REL.forEach((r) => {
  r.tuples = []; for (let m = 0; m < (1 << r.k); m++) { const t = []; for (let i = 0; i < r.k; i++) t.push((m >> (r.k - 1 - i)) & 1); if (r.f(...t)) r.tuples.push(t); }
  r.set = new Set(r.tuples.map((t) => t.join('')));
});
const OPS = [
  { id: 'c0', name: '0-valid', ar: 1, f: () => 0, alg: 'set every variable to 0', sym: '0' },
  { id: 'c1', name: '1-valid', ar: 1, f: () => 1, alg: 'set every variable to 1', sym: '1' },
  { id: 'and', name: 'Horn', ar: 2, f: (a, b) => a & b, alg: 'unit propagation', sym: '∧' },
  { id: 'or', name: 'dual-Horn', ar: 2, f: (a, b) => a | b, alg: 'dual unit propagation', sym: '∨' },
  { id: 'maj', name: 'bijunctive', ar: 3, f: (a, b, c) => (a & b) | (b & c) | (a & c), alg: '2-SAT (implication graph)', sym: 'maj' },
  { id: 'xor', name: 'affine', ar: 3, f: (a, b, c) => a ^ b ^ c, alg: 'Gaussian elimination over GF(2)', sym: '⊕' },
];
/** Does relation r have polymorphism op? Returns {ok, witness: [tuples, result]}. */
function closedUnder(r, op) {
  const T = r.tuples, k = r.k; if (!T.length) return { ok: true };
  const idx = (n) => Array.from({ length: n }, () => 0);
  const comb = (pick) => { const res = []; for (let i = 0; i < k; i++) res.push(op.f(...pick.map((t) => t[i]))); return res; };
  if (op.ar === 1) { const res = comb([T[0]].map(() => Array(k).fill(0))); void res; const z = Array(k).fill(op.f(0)); return r.set.has(z.join('')) ? { ok: true } : { ok: false, w: [[], z] }; }
  const loop = (depth, pick) => {
    if (depth === op.ar) { const res = comb(pick); return r.set.has(res.join('')) ? null : { ok: false, w: [pick.slice(), res] }; }
    for (const t of T) { pick.push(t); const x = loop(depth + 1, pick); pick.pop(); if (x) return x; }
    return null;
  };
  return loop(0, []) || { ok: true };
}

// ---------------------------------------------------------------------------------------------------------------
// Self-reduction tree of a CNF and the Berman/Mahaney-style pruning with a *hypothetical* reduction to a sparse set.
function selfTree(n, cl) {
  const N = 1 << (n + 1), canon = Array(N), sat = Array(N).fill(false), depth = Array(N);
  const models = allModels(n, cl).map((a) => a.slice(1).join(''));
  for (let id = 1; id < N; id++) {
    const d = Math.floor(Math.log2(id)); depth[id] = d;
    const bits = []; for (let k = d - 1; k >= 0; k--) bits.push((id >> k) & 1); // x1..xd (bit string of the path)
    const pre = bits.join('');
    sat[id] = models.some((m) => m.startsWith(pre));
    const out = []; let dead = false;
    for (const c of cl) { let sat1 = false; const rest = []; for (const l of c) { const x = Math.abs(l); if (x <= d) { if ((bits[x - 1] === 1) === (l > 0)) { sat1 = true; break; } } else rest.push(l); } if (sat1) continue; if (!rest.length) { dead = true; break; } out.push(rest.sort((a, b) => a - b).join(' ')); }
    canon[id] = dead ? 'FALSE' : out.sort().join(' | ') || 'TRUE';
  }
  const hash = canon.map((c) => { if (!c) return 0; let h = 2166136261; for (let i = 0; i < c.length; i++) { h ^= c.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; });
  return { n, N, canon, sat, depth, hash, models: models.length };
}
/** DFS with a memo of the images of nodes found fruitless. image = 2*(hash mod p) + [node satisfiable]. */
function berman(T, p) {
  const n = T.n, status = Array(T.N).fill('unseen'), failed = new Set(); let visited = 0, win = null;
  const img = (id) => 2 * (T.hash[id] % p) + (T.sat[id] ? 1 : 0);
  (function visit(id) {
    if (win !== null) return;
    const im = img(id);
    if (failed.has(im)) { status[id] = 'pruned'; return; }
    status[id] = 'explored'; visited++;
    if (T.depth[id] === n) { if (T.sat[id]) { win = id; status[id] = 'win'; return; } failed.add(im); return; }
    visit(2 * id); if (win !== null) { return; } visit(2 * id + 1);
    if (win !== null) return; failed.add(im);
  })(1);
  return { status, visited, win, distinct: failed.size };
}

export default {
  collection: 'cplx',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'SET-COVER and HITTING-SET are NP-complete',
      statement: String.raw`**SET-COVER**: given a universe $U$, a family $\mathcal S$ of subsets of $U$ and a number $k$, are there $k$ sets of $\mathcal S$ whose union is $U$? **HITTING-SET**: given the same family and $k$, is there a set of $k$ elements of $U$ meeting every member of $\mathcal S$? Both are in NP and NP-complete. They are the same problem seen from two sides — swap the roles of "elements" and "sets" in the incidence matrix — and both contain VERTEX-COVER as the special case in which $U$ is the edge set and every element lies in exactly two sets.`,
      idea: String.raw`Given a graph $G$ and $k$, take the universe $U=E(G)$ and for each vertex $v$ the set $S_v$ of edges at $v$. Choosing vertices $C$ covers all edges iff the sets $\{S_v\}_{v\in C}$ cover $U$, so VERTEX-COVER (toc-13.7) reduces to SET-COVER with the same $k$. Transposing the incidence matrix gives HITTING-SET: now each edge is a set $\{u,v\}$ and a hitting set is a set of vertices touching every edge. NP-membership is immediate; the *greedy* algorithm (always take the set covering most uncovered elements) is a $\ln n$-approximation but not optimal, as the second instance shows.`,
      caption: String.raw`Click vertices (graph instance) or set chips (greedy-trap instance) to build a cover. The **matrix** on the right is the incidence matrix: in *set cover* view a row is a set and you need its columns to cover every column; flip to *hitting set* view and the same matrix is transposed — rows are now the sets to hit and columns the elements you pick. The counter compares your size with the **optimum** (found by exhaustive search) and with what **greedy** returns; on the trap instance greedy takes 3 sets while 2 suffice.`,
      deps: ['toc-13.7'],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Karp, 1972; greedy ln n bound: Johnson 1974, Lovász 1975',
      tags: ['set cover', 'hitting set', 'duality'],
      viz(v) {
        const inst = v.select('instance', [{ value: 'g', label: 'graph (vertex cover)' }, { value: 't', label: 'greedy trap' }], 'g');
        const view = v.select('view', [{ value: 'sc', label: 'set cover' }, { value: 'hs', label: 'hitting set' }], 'sc');
        const s1 = v.stage({ x: [0, 10], y: [0, 6.4], axes: false, equal: true, height: 360, weight: 1.1, title: 'instance' });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1, title: 'incidence matrix' });
        // graph instance
        const GN = 8, GE = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [0, 4], [1, 5], [2, 6]];
        const gpos = Array.from({ length: GN }, (_, i) => [5 + 2.4 * Math.cos(Math.PI / 2 - (2 * Math.PI * i) / GN), 3.4 + 2.5 * Math.sin(Math.PI / 2 - (2 * Math.PI * i) / GN)]);
        // trap instance: columns 0..6, top/bottom rows
        const TE = []; for (let c = 0; c < 7; c++) { TE.push([c, 1]); TE.push([c, 0]); } // element index 2c (top), 2c+1 (bottom)
        const setOf = (cols, rows) => { const r = []; cols.forEach((c) => rows.forEach((row) => r.push(2 * c + (row === 'top' ? 0 : 1)))); return r; };
        const TS = [
          { name: 'B₈', el: setOf([0, 1, 2, 3], ['top', 'bottom']) }, { name: 'B₄', el: setOf([4, 5], ['top', 'bottom']) }, { name: 'B₂', el: setOf([6], ['top', 'bottom']) },
          { name: 'top row', el: setOf([0, 1, 2, 3, 4, 5, 6], ['top']) }, { name: 'bottom row', el: setOf([0, 1, 2, 3, 4, 5, 6], ['bottom']) },
        ];
        const picked = new Set(); let curI = '';
        const model = () => {
          if (inst.value === 'g') return { sets: Array.from({ length: GN }, (_, v2) => ({ name: String(v2 + 1), el: GE.map((e, j) => (e.includes(v2) ? j : -1)).filter((j) => j >= 0) })), nU: GE.length };
          return { sets: TS, nU: 14 };
        };
        const optimum = (M) => {
          let best = 1e9, bm = 0; const n = M.sets.length;
          for (let m = 0; m < (1 << n); m++) { if (popc(m) >= best) continue; const cov = new Set(); M.sets.forEach((q, i) => { if ((m >> i) & 1) q.el.forEach((e) => cov.add(e)); }); if (cov.size === M.nU) { best = popc(m); bm = m; } }
          return { size: best, mask: bm };
        };
        const greedy = (M) => { const cov = new Set(), ch = []; while (cov.size < M.nU) { let bi = -1, bc = -1; M.sets.forEach((q, i) => { if (ch.includes(i)) return; const c = q.el.filter((e) => !cov.has(e)).length; if (c > bc) { bc = c; bi = i; } }); if (bc <= 0) break; ch.push(bi); M.sets[bi].el.forEach((e) => cov.add(e)); } return ch; };
        s1.onClick((x, y) => {
          if (inst.value === 'g') { let bi = -1, bd = 0.55; gpos.forEach(([px, py], i) => { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; bi = i; } }); if (bi >= 0) { if (picked.has(bi)) picked.delete(bi); else picked.add(bi); } }
          else { const i = Math.floor((x - 0.3) / 1.9); if (y < 1.4 && i >= 0 && i < 5 && x - 0.3 - i * 1.9 < 1.7) { if (picked.has(i)) picked.delete(i); else picked.add(i); } }
        });
        v.button('Greedy', () => { const M = model(); picked.clear(); greedy(M).forEach((i) => picked.add(i)); });
        v.button('Show an optimum', () => { const M = model(), o = optimum(M); picked.clear(); M.sets.forEach((_, i) => { if ((o.mask >> i) & 1) picked.add(i); }); });
        v.button('Clear', () => picked.clear());
        let st = {};
        v.render(() => {
          if (curI !== inst.value) { curI = inst.value; picked.clear(); const M0 = model(), o0 = optimum(M0); let first = true; M0.sets.forEach((_, i) => { if ((o0.mask >> i) & 1) { if (first) first = false; else picked.add(i); } }); }
          const M = model(), cov = new Map(); picked.forEach((i) => M.sets[i].el.forEach((e) => cov.set(e, (cov.get(e) || 0) + 1)));
          const unc = M.nU - cov.size;
          if (inst.value === 'g') {
            s1.setView([0, 10], [0, 6.8]);
            GE.forEach(([a, b], j) => { const c = cov.has(j); s1.line(gpos[a][0], gpos[a][1], gpos[b][0], gpos[b][1], { color: c ? 'green' : 'red', width: c ? 3 : 3.4, alpha: c ? 0.9 : 0.9, dash: !c }); });
            gpos.forEach(([x, y], i) => { const p = picked.has(i); s1.dot(x, y, { r: 14, color: p ? 'accent' : 'muted', hollow: !p }); s1.text(String(i + 1), x, y, { align: 'center', baseline: 'middle', size: 12, weight: 700, color: p ? 'panel' : 'ink', halo: false }); });
            s1.corner('red dashed edge = not yet covered', 'tl', { color: 'red' });
          } else {
            s1.setView([0, 10], [0, 6.8]);
            TE.forEach(([c, top], e) => { const x = 1.1 + c * 1.3, y = top ? 5.0 : 3.4, n = cov.get(e) || 0; s1.dot(x, y, { r: 11, color: n ? 'green' : 'red', hollow: !n }); if (n > 1) s1.text(`×${n}`, x + 0.45, y + 0.4, { size: 10, color: 'muted', halo: false }); });
            TS.forEach((q, i) => {
              const x0 = 0.3 + i * 1.9, p = picked.has(i);
              s1.rect(x0, 0.2, x0 + 1.7, 1.2, { fill: p ? 'accent' : 'faint', fillAlpha: p ? 0.4 : 0.12, color: p ? 'accent' : 'muted', width: p ? 2.5 : 1.2, radius: 6 });
              s1.text(`${q.name}`, x0 + 0.85, 0.85, { align: 'center', size: 12, weight: 700, halo: false }); s1.text(`${q.el.length} elements`, x0 + 0.85, 0.45, { align: 'center', size: 10, color: 'muted', halo: false });
            });
            s1.text('universe: 14 elements (green = covered)', 0.4, 6.2, { size: 12, color: 'muted' });
          }
          // matrix
          const T = view.value === 'hs', rows = T ? M.nU : M.sets.length, cols = T ? M.sets.length : M.nU;
          s2.setView([-1.6, cols + 0.2], [-0.2, rows + 1.2]);
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const si = T ? c : r, ei = T ? r : c, inS = M.sets[si].el.includes(ei), pk = picked.has(si);
            const y = rows - 1 - r;
            if (inS) s2.rect(c + 0.08, y + 0.08, c + 0.92, y + 0.92, { fill: pk ? 'accent' : 'ink', fillAlpha: pk ? 0.75 : 0.25, stroke: false });
            else s2.rect(c + 0.3, y + 0.3, c + 0.7, y + 0.7, { fill: 'faint', fillAlpha: 0.15, stroke: false });
          }
          // headers
          for (let r = 0; r < rows; r++) { const y = rows - 1 - r; const lab = T ? (inst.value === 'g' ? `${GE[r][0] + 1}–${GE[r][1] + 1}` : `e${r + 1}`) : M.sets[r].name; const ok = T ? (cov.has(r)) : picked.has(r); s2.text(lab, -0.15, y + 0.5, { align: 'right', baseline: 'middle', size: 10.5, color: T ? (ok ? 'green' : 'red') : (ok ? 'accent' : 'muted'), weight: ok ? 700 : 500, halo: false }); }
          for (let c = 0; c < cols; c++) { const lab = T ? M.sets[c].name : (inst.value === 'g' ? `${GE[c][0] + 1}${GE[c][1] + 1}` : `${c + 1}`); const ok = T ? picked.has(c) : cov.has(c); s2.text(lab, c + 0.5, rows + 0.5, { align: 'center', size: 9.5, color: T ? (ok ? 'accent' : 'muted') : (ok ? 'green' : 'red'), weight: 700, halo: false }); }
          s2.setTitle(T ? 'incidence matrix — rows: sets to hit, columns: elements to pick' : 'incidence matrix — rows: sets to pick, columns: elements to cover');
          st = { unc, k: picked.size, M };
        });
        v.legend([['accent', 'chosen', { dot: true }], ['green', 'covered / hit', { dot: true }], ['red', 'not yet covered / hit', { dot: true }]]);
        v.readout(() => {
          const M = st.M, o = optimum(M), g = greedy(M).length, hs = view.value === 'hs';
          const word = hs ? 'hitting set' : 'cover';
          return `your ${word}: **${st.k}** ${hs ? 'elements' : 'sets'} · ${hs ? 'sets not hit' : 'elements uncovered'}: **${st.unc}** ${st.unc === 0 ? '→ **valid**' : ''} · optimum: **${o.size}** · greedy: **${g}**${g > o.size ? ' (greedy is not optimal here)' : ''}`
            + (inst.value === 'g' ? `\nVERTEX-COVER ↔ SET-COVER: the graph has ${GE.length} edges (the universe) and ${GN} vertices (the sets); a vertex cover of size $k$ is exactly a set cover of size $k$ — min vertex cover $=${o.size}$.` : '\nGreedy grabs the biggest block first and ends up with one set too many; the two rows are the optimum. Ratios like this grow like $\\ln n$ on larger instances.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Planar 3-colouring is NP-complete',
      statement: String.raw`**PLANAR 3-COLOURING**: given a *planar* graph, can its vertices be coloured with three colours so that adjacent vertices differ? It is NP-complete (Stockmeyer 1973; Garey–Johnson–Stockmeyer 1976), even for planar graphs of maximum degree 4. In contrast, 2-colouring is easy and *4*-colouring of planar graphs is trivially "yes" by the four colour theorem.`,
      idea: String.raw`Reduce from 3-colouring of general graphs (toc-13.12). Draw the graph in the plane; wherever two edges cross, delete the crossing and insert a **crossover gadget**: a planar graph on 13 vertices with four terminals $a,b,a',b'$ on its outer face in this cyclic order such that in every 3-colouring $a'$ has the same colour as $a$ and $b'$ the same colour as $b$, while *every* choice of colours of $a$ and $b$ extends. Each edge is then a chain of wires — colour is carried along by the equalities — ending in an ordinary edge, so the planar graph is 3-colourable iff the original is.`,
      caption: String.raw`**Left, the gadget.** Click a terminal to pin it to a colour (click again to cycle; the fourth click unpins). The checker lists every 3-colouring of the 13-vertex graph that agrees with your pins and paints one: pin $a$ and $a'$ to different colours and no colouring survives. **Right, the reduction.** Pick a graph drawn with crossings and switch *crossings → gadgets* on: each red cross becomes a gadget and the result is a plane drawing with no crossings (checked by testing all pairs of segments). The readout counts 3-colourings of both graphs by exhaustive search: one exists exactly when the other does, and for $K_4$, $K_5$ neither has any.`,
      deps: ['toc-13.12'],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Stockmeyer, 1973; Garey, Johnson & Stockmeyer, 1976 (the 13-vertex gadget below was found by computer search, not copied)',
      tags: ['planar', 'graph colouring', 'gadgets'],
      viz(v) {
        const COL = ['blue', 'orange', 'green'];
        const sL = v.stage({ x: [-1.45, 1.45], y: [-1.3, 1.3], equal: true, axes: false, height: 330, weight: 1, title: 'the crossover gadget (click terminals)' });
        const sR = v.stage({ x: [-1.45, 1.45], y: [-1.3, 1.3], equal: true, axes: false, height: 330, weight: 1.15, title: 'reduction on a drawing with crossings' });
        const gsel = v.select('graph', DRAWINGS.map((d, i) => ({ value: i, label: d.name })), 0);
        const tog = v.toggle('replace crossings by gadgets', true);
        const pins = [null, null, null, null];
        const TERM = ['a', 'b', "a'", "b'"];
        sL.onClick((x, y) => { for (let i = 0; i < 4; i++) { const p = GAD_P[i]; if (Math.hypot(p[0] * 1.0 - x, p[1] * 1.0 - y) < 0.2) { pins[i] = pins[i] === null ? 0 : pins[i] === 2 ? null : pins[i] + 1; } } });
        v.button('Clear pins', () => { for (let i = 0; i < 4; i++) pins[i] = null; });
        const cacheR = {};
        const reduction = (gi) => {
          if (cacheR[gi]) return cacheR[gi];
          const D = DRAWINGS[gi], P = planarize(D.pos, D.edges);
          const c0 = threeColour(D.pos.length, D.edges, { limit: 2e5 });
          const c1 = threeColour(P.pos.length, P.edges, { limit: 2e5 });
          let crossings = 0; // segment crossings in the planarised drawing
          for (let i = 0; i < P.edges.length; i++) for (let j = i + 1; j < P.edges.length; j++) {
            const [a, b] = P.edges[i], [c, d] = P.edges[j]; if (a === c || a === d || b === c || b === d) continue;
            if (segCross(P.pos[a], P.pos[b], P.pos[c], P.pos[d])) crossings++;
          }
          let c00 = 0; for (let i = 0; i < D.edges.length; i++) for (let j = i + 1; j < D.edges.length; j++) { const [a, b] = D.edges[i], [c, d] = D.edges[j]; if (a === c || a === d || b === c || b === d) continue; if (segCross(D.pos[a], D.pos[b], D.pos[c], D.pos[d])) c00++; }
          return (cacheR[gi] = { D, P, c0, c1, crossings, c00 });
        };
        let info = {};
        v.render(() => {
          // left: gadget
          const ok = GAD_COLS.filter((c) => pins.every((p, i) => p === null || c[i] === p));
          const pick = ok[0];
          GAD_E.forEach(([u, w]) => sL.line(GAD_P[u][0], GAD_P[u][1], GAD_P[w][0], GAD_P[w][1], { color: 'muted', width: 1.8, alpha: 0.8 }));
          GAD_P.forEach((p, i) => {
            const c = pick ? pick[i] : null;
            if (i < 4) {
              sL.dot(p[0], p[1], { r: 13, color: c === null ? 'muted' : COL[c], hollow: c === null });
              sL.dot(p[0], p[1], { r: 4, color: pins[i] === null ? 'panel' : 'ink' });
              sL.text(TERM[i], p[0] * 1.17, p[1] * 1.17 + (i === 1 ? 0.05 : i === 3 ? -0.05 : 0), { align: 'center', baseline: 'middle', size: 15, weight: 800, halo: true });
            } else sL.dot(p[0], p[1], { r: 7, color: c === null ? 'faint' : COL[c], hollow: c === null });
          });
          if (!pick) sL.corner('no 3-colouring agrees with these pins', 'tl', { color: 'red', weight: 700, plate: true });
          // right: reduction
          const R = reduction(gsel.value), planar = tog.value, G = planar ? R.P : R.D, pos = planar ? R.P.pos : R.D.pos, ed = planar ? R.P.edges : R.D.edges;
          const cc = planar ? R.c1 : R.c0, n0 = R.D.pos.length;
          const sc = 0.95;
          ed.forEach(([u, w]) => sR.line(pos[u][0] * sc, pos[u][1] * sc, pos[w][0] * sc, pos[w][1] * sc, { color: 'muted', width: planar ? 1.2 : 2, alpha: 0.7 }));
          if (!planar) {
            for (let i = 0; i < R.D.edges.length; i++) for (let j = i + 1; j < R.D.edges.length; j++) {
              const [a, b] = R.D.edges[i], [c, d] = R.D.edges[j]; if (a === c || a === d || b === c || b === d) continue;
              if (segCross(R.D.pos[a], R.D.pos[b], R.D.pos[c], R.D.pos[d])) { const q = R.P.cr.find((x) => x.e1 === i && x.e2 === j); if (q) sR.text('✕', q.X[0] * sc, q.X[1] * sc, { align: 'center', baseline: 'middle', size: 20, color: 'red', weight: 800, halo: true }); }
            }
          }
          pos.forEach((p, i) => {
            const c = cc.first ? cc.first[i] : null;
            const big = i < n0;
            sR.dot(p[0] * sc, p[1] * sc, { r: big ? 9 : 3.5, color: c === null ? 'ink' : COL[c], hollow: c === null && big });
          });
          if (!cc.first) sR.corner('not 3-colourable', 'tl', { color: 'red', weight: 700, plate: true });
          info = { R, planar, patterns: new Set(GAD_COLS.map((c) => c.slice(0, 4).join(''))).size, nGad: GAD_COLS.length };
        });
        v.legend([['blue', 'colour 1', { dot: true }], ['orange', 'colour 2', { dot: true }], ['green', 'colour 3', { dot: true }]]);
        v.readout(() => {
          const R = info.R; const allEq = GAD_COLS.every((c) => c[0] === c[2] && c[1] === c[3]);
          const ab = new Set(GAD_COLS.map((c) => `${c[0]}${c[1]}`)).size;
          const cnt = (c) => (c.count >= 2e5 ? '≥ 2·10⁵' : big(c.count));
          return `gadget: ${info.nGad} proper 3-colourings; $a'=a$ and $b'=b$ in **${allEq ? 'all of them' : 'NOT all'}**, and **${ab}** of the 9 pairs $(a,b)$ occur (all colour pairs, equal or different)\n`
            + `${R.D.name}: ${R.D.pos.length} vertices, ${R.D.edges.length} edges, **${R.c00}** crossing${R.c00 === 1 ? '' : 's'} → planarised: **${R.P.pos.length}** vertices, ${R.P.edges.length} edges, **${R.crossings}** crossings left · 3-colourings: original **${cnt(R.c0)}**, planarised **${cnt(R.c1)}** ⇒ one is colourable iff the other is (${(R.c0.count > 0) === (R.c1.count > 0) ? '✓' : '✗'})`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Concept',
      name: 'Hard puzzles: Sudoku, Minesweeper and friends',
      statement: String.raw`Many popular puzzles are NP-complete when generalised to boards of unbounded size: completing an $n^2\times n^2$ **Sudoku** (Yato–Seta, 2003, via Latin-square completion), deciding whether a **Minesweeper** position is *consistent* with some placement of mines (Kaye, 2000), and the same for Tetris, Nonograms, Slitherlink, Sokoban (PSPACE-complete) and many others. Each is in NP — a filled board is checked in a single pass — and hard because small gadgets built from the puzzle's own rules simulate wires, gates and variables.`,
      idea: String.raw`Membership in NP is the easy half: guess the grid or the mine layout and check every rule. Hardness comes from gadget reductions of the same kind as in 2.1 and 2.9: a Minesweeper wire is a corridor of numbered cells in which a mine alternates between two positions, gates are patterns whose numbers permit exactly the rows of a truth table, and a position is consistent iff the circuit is satisfiable (the reduction, due to Kaye, is not drawn here). Sudoku is a worked exact-cover problem (2.2): each cell, row-digit, column-digit and box-digit is an item to cover exactly once, and a placement of a digit in a cell is a set of four items.`,
      caption: String.raw`**Sudoku:** click a cell to step its digit (shift-click goes back); the grid is converted into an exact-cover instance with $4N^2$ items and solved by dancing links — the readout reports the number of solutions (0, 1 or 2+), the search nodes and the size of the cover problem. "New puzzle" removes clues while the solution stays unique. **Minesweeper:** numbers are revealed, grey cells are unknown; the solver enumerates *every* mine layout consistent with the numbers and shades each unknown cell by the fraction of layouts in which it holds a mine (red = surely a mine, green = surely safe). Click a number to change it and break consistency — then no layout survives. Hardness of the generalised puzzles comes from gadgets not drawn here; the picture shows that *checking* is trivial and *deciding* is a search.`,
      deps: ['cplx-2.2', 'toc-13.4'],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Kaye, 2000 (Minesweeper); Yato & Seta, 2003 (Sudoku)',
      tags: ['puzzles', 'exact cover', 'consistency'],
      viz(v) {
        const mode = v.select('puzzle', [{ value: 'su', label: 'Sudoku' }, { value: 'ms', label: 'Minesweeper' }], 'su');
        const size = v.select('Sudoku size', [{ value: 2, label: '4×4' }, { value: 3, label: '9×9' }], 3);
        const s = v.stage({ x: [0, 10], y: [0, 10], axes: false, equal: true, height: 440, full: true });
        let su = { n: 3, grid: WIKI9.split('').map(Number), given: null, seed: 1 };
        su.given = su.grid.map((x) => x > 0);
        const loadSu = () => {
          const n = size.value; su.n = n; const N = n * n;
          if (n === 3 && su.seed === 1) su.grid = WIKI9.split('').map(Number);
          else {
            const r = v.rng(su.seed * 7 + n); const blank = Array(N * N).fill(0);
            // random full grid: shuffle a pattern
            const g = []; const base = (rr, cc) => (n * (rr % n) + Math.floor(rr / n) + cc) % N;
            const perm = r.shuffle([...Array(N).keys()]); const rowOrd = [], colOrd = [];
            r.shuffle([...Array(n).keys()]).forEach((b) => r.shuffle([...Array(n).keys()]).forEach((k) => rowOrd.push(b * n + k)));
            r.shuffle([...Array(n).keys()]).forEach((b) => r.shuffle([...Array(n).keys()]).forEach((k) => colOrd.push(b * n + k)));
            for (let rr = 0; rr < N; rr++) for (let cc = 0; cc < N; cc++) g.push(perm[base(rowOrd[rr], colOrd[cc])] + 1);
            const order = r.shuffle([...Array(N * N).keys()]); const grid = g.slice();
            for (const i of order) { const keep = grid[i]; grid[i] = 0; if (sudokuSolve(n, grid, 2).sols.length !== 1) grid[i] = keep; }
            su.grid = grid;
          }
          su.given = su.grid.map((x) => x > 0); su.res = null;
        };
        size.el.querySelectorAll && 0;
        v.button('New puzzle', () => { su.seed++; loadSu(); });
        v.button('Blank grid', () => { su.grid = su.grid.map(() => 0); su.given = su.grid.map(() => false); });
        // minesweeper
        let ms = { W: 9, H: 7, num: [], seed: 5, mines: [] };
        const genMs = () => {
          const { W, H } = ms, r = v.rng(ms.seed * 13); ms.mines = Array.from({ length: W * H }, () => r() < 0.2);
          const nb = (x, y) => { let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if ((dx || dy) && X >= 0 && X < W && Y >= 0 && Y < H && ms.mines[Y * W + X]) c++; } return c; };
          ms.num = Array.from({ length: W * H }, (_, i) => (!ms.mines[i] && r() < 0.45 ? nb(i % W, Math.floor(i / W)) : null));
          ms.res = null;
        };
        genMs();
        v.button('New Minesweeper position', () => { ms.seed++; genMs(); mode.set('ms'); });
        s.onClick((x, y, mod) => {
          if (mode.value === 'su') {
            const N = su.n * su.n, u = 9 / N, ox = 0.5, c = Math.floor((x - ox) / u), r = Math.floor((9.5 - y) / u);
            if (c < 0 || c >= N || r < 0 || r >= N) return; const i = r * N + c;
            su.grid[i] = (su.grid[i] + (mod && mod.shift ? N : 1)) % (N + 1); if (su.given[i] && 0) return; su.given[i] = su.grid[i] > 0 || su.given[i];
          } else {
            const c = Math.floor((x - 0.5) / (9 / ms.W)), r = Math.floor((9.5 - y) / (9 / ms.W)); if (c < 0 || c >= ms.W || r < 0 || r >= ms.H) return; const i = r * ms.W + c;
            if (ms.num[i] !== null) ms.num[i] = (ms.num[i] + 1) % 9;
          }
        });
        let info = {};
        v.render(() => {
          size.el.hidden = mode.value !== 'su';
          if (mode.value === 'su') {
            s.setView([0, 10], [0, 10]);
            if (su.n !== size.value) { su.seed = 1; loadSu(); }
            const n = su.n, N = n * n, u = 9 / N, ox = 0.5, oy = 9.5;
            const res = sudokuSolve(n, su.grid.map((x) => x), 2); info = { su: true, res, N };
            const sol = res.sols.length === 1 ? res.sols[0] : null;
            // conflicts
            const conflict = new Set();
            for (let i = 0; i < N * N; i++) { const d = su.grid[i]; if (!d) continue; const r = Math.floor(i / N), c = i % N; for (let j = 0; j < N * N; j++) { if (j === i || su.grid[j] !== d) continue; const r2 = Math.floor(j / N), c2 = j % N; if (r === r2 || c === c2 || (Math.floor(r / n) === Math.floor(r2 / n) && Math.floor(c / n) === Math.floor(c2 / n))) conflict.add(i); } }
            for (let i = 0; i < N * N; i++) {
              const r = Math.floor(i / N), c = i % N, x0 = ox + c * u, y1 = oy - r * u, d = su.grid[i];
              const box = (Math.floor(r / n) + Math.floor(c / n)) % 2 === 0;
              s.rect(x0, y1 - u, x0 + u, y1, { fill: conflict.has(i) ? 'red' : 'faint', fillAlpha: conflict.has(i) ? 0.25 : box ? 0.1 : 0.03, stroke: false });
              if (d) s.text(String(d > 9 ? String.fromCharCode(55 + d) : d), x0 + u / 2, y1 - u / 2, { align: 'center', baseline: 'middle', size: N === 4 ? 30 : 22, weight: su.given[i] ? 800 : 600, color: conflict.has(i) ? 'red' : su.given[i] ? 'ink' : 'accent', halo: false });
              else if (sol) s.text(String(sol[i]), x0 + u / 2, y1 - u / 2, { align: 'center', baseline: 'middle', size: N === 4 ? 26 : 18, color: 'green', weight: 500, halo: false, alpha: 0.55 });
            }
            for (let k = 0; k <= N; k++) { const th = k % n === 0 ? 3 : 1; s.line(ox + k * u, oy, ox + k * u, oy - 9, { color: 'ink', width: th, alpha: k % n === 0 ? 0.9 : 0.35 }); s.line(ox, oy - k * u, ox + 9, oy - k * u, { color: 'ink', width: th, alpha: k % n === 0 ? 0.9 : 0.35 }); }
          } else {
            s.setView([0, 10], [2.2, 10]);
            const { W, H } = ms, u = 9 / W, ox = 0.5, oy = 9.5;
            if (!ms.res) ms.res = mineSolve(W, H, ms.num);
            const res = ms.res; info = { ms: true, res }; // recomputed below if edited
            const fresh = mineSolve(W, H, ms.num); ms.res = fresh; info.res = fresh;
            const p = new Map(); fresh.F.forEach((c, i) => p.set(c, fresh.count ? fresh.tally[i] / fresh.count : null));
            for (let i = 0; i < W * H; i++) {
              const r = Math.floor(i / W), c = i % W, x0 = ox + c * u, y1 = oy - r * u;
              if (ms.num[i] !== null) {
                s.rect(x0 + 1.5 / 40, y1 - u + 1.5 / 40, x0 + u - 1.5 / 40, y1 - 1.5 / 40, { fill: 'panel', color: 'muted', width: 1 });
                const k = ms.num[i];
                if (!k) s.text('0', x0 + u / 2, y1 - u / 2, { align: 'center', baseline: 'middle', size: 16, color: 'faint', halo: false });
                if (k) s.text(String(k), x0 + u / 2, y1 - u / 2, { align: 'center', baseline: 'middle', size: 22, weight: 800, color: ['', 'blue', 'green', 'red', 'purple', 'orange', 'teal', 'pink', 'ink'][k] || 'ink', halo: false });
              } else {
                const q = p.get(i); const col = q === null || q === undefined ? 'muted' : q === 1 ? 'red' : q === 0 ? 'green' : 'gold';
                s.rect(x0 + 1.5 / 40, y1 - u + 1.5 / 40, x0 + u - 1.5 / 40, y1 - 1.5 / 40, { fill: col, fillAlpha: q === null || q === undefined ? 0.4 : 0.15 + 0.6 * (q === 1 ? 1 : q === 0 ? 0.8 : q), color: 'muted', width: 1 });
                if (q === null || q === undefined) s.text('?', x0 + u / 2, y1 - u / 2, { align: 'center', baseline: 'middle', size: 14, color: 'muted', halo: false });
                if (q !== null && q !== undefined && q > 0 && q < 1) s.text(`${Math.round(q * 100)}%`, x0 + u / 2, y1 - u / 2, { align: 'center', baseline: 'middle', size: 11, color: 'ink', halo: false });
                if (q === 1) s.text('✹', x0 + u / 2, y1 - u / 2, { align: 'center', baseline: 'middle', size: 20, color: 'red', halo: false });
              }
            }
          }
        });
        v.legend([['ink', 'given / revealed'], ['accent', 'your entry'], ['green', 'solution digit / surely safe'], ['red', 'conflict / surely a mine']]);
        v.readout(() => {
          if (info.su) { const r = info.res, N = info.N; return `${N}×${N} Sudoku → exact cover with ${4 * N * N} items and ${r.rows} candidate rows · solutions: **${r.sols.length === 0 ? 'none' : r.sols.length === 1 ? 'exactly one' : '2 or more'}** · dancing-links nodes: **${r.nodes}** · *checking* a filled grid: one pass over its ${3 * N} lines and boxes.`; }
          const r = info.res, sure = r.F.filter((c, i) => r.count && (r.tally[i] === r.count)).length, safe = r.F.filter((c, i) => r.count && r.tally[i] === 0).length;
          return `${r.cons.length} revealed numbers, ${r.F.length} unknown cells touching them · consistent mine layouts of those cells: **${r.capped ? '≥ ' : ''}${big(r.count)}** (search nodes ${big(r.nodes)}) · surely mines: **${sure}** · surely safe: **${safe}** ${r.count === 0 ? '— **inconsistent position**' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Theorem',
      name: 'Schaefer’s dichotomy theorem',
      statement: String.raw`Let $\Gamma$ be a finite set of Boolean relations. $\mathrm{CSP}(\Gamma)$ asks whether a conjunction of constraints, each an application of a relation of $\Gamma$ to some variables, is satisfiable. Then $\mathrm{CSP}(\Gamma)$ is in P if $\Gamma$ is **0-valid**, **1-valid**, **Horn**, **dual-Horn**, **bijunctive** (expressible by 2-clauses) or **affine** (expressible by linear equations over $\mathbb F_2$), and NP-complete otherwise. Equivalently: $\Gamma$ is tractable iff all its relations are closed under one common operation among the constant $0$, the constant $1$, $\wedge$, $\vee$, majority, and ternary $\oplus$.`,
      idea: String.raw`Each tractable class is a closure property that *survives conjunction*: if two solutions of a Horn formula are combined with $\wedge$ coordinate by coordinate, the result is a solution again, and likewise for the other five operations. That structure gives algorithms (unit propagation, 2-SAT, Gaussian elimination, or just "all 0"). If no single operation preserves all of $\Gamma$, a gadget argument — primitive-positive definitions built from the relations — manufactures the relations $x\lor y\lor z$ or $\mathrm{NAE}$ (up to fixing constants), and 3SAT (toc-13.5) reduces to $\mathrm{CSP}(\Gamma)$. The proof is a case analysis over Post's lattice of Boolean clones; here we test the closure properties directly.`,
      caption: String.raw`**Click relations** to put them into (or take them out of) your constraint language $\Gamma$. The table is computed, not looked up: for every relation and every operation we try *all* combinations of its tuples and report ✓ if the result is always again a tuple of the relation (✗ otherwise; for an NP-complete language the readout prints a counter-example). The last row asks whether *all selected* relations survive an operation; if some column is all-✓ the language is tractable, otherwise NP-complete. **Right:** a random instance over the selected relations is solved by brute force and its solutions are combined with each operation — in a tractable column 100% of the combinations are again solutions, elsewhere the fraction drops below 100%.`,
      deps: ['toc-13.5', 'toc-13.13'],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Schaefer, 1978',
      tags: ['CSP', 'dichotomy', 'polymorphism'],
      viz(v) {
        const sel = REL.map((r) => ['or2', 'imp', 'nand'].includes(r.id));
        const s1 = v.stage({ x: [0, 10.6], y: [-3, REL.length + 1.9], axes: false, height: 470, weight: 1.35, title: 'closure of each relation under the six operations' });
        const s2 = v.stage({ x: [-0.5, 5.5], y: [0, 1.15], axes: 'box', gutter: true, height: 470, weight: 0.85, xticks: OPS.map((o, j) => [j, o.sym]), xlabel: 'operation applied to solutions', ylabel: 'fraction that are solutions', title: 'combining solutions of a random instance' });
        let seed = 3;
        const rowY = (i) => REL.length - i; // row baseline
        s1.onClick((x, y) => { const i = Math.round(REL.length - y); if (i >= 0 && i < REL.length && x < 10.6) sel[i] = !sel[i]; });
        v.button('New random instance', () => { seed++; });
        const inst = (S) => {
          const R = REL.filter((_, i) => sel[i]); if (!R.length) return null;
          const r = v.rng(seed * 31 + R.length), n = 9, cons = [];
          for (let j = 0; j < 9; j++) { const rel = R[Math.floor(r() * R.length)], vs = []; while (vs.length < rel.k) { const x = Math.floor(r() * n); if (!vs.includes(x)) vs.push(x); } cons.push({ rel, vs }); }
          const sol = []; for (let m = 0; m < (1 << n); m++) { if (cons.every(({ rel, vs }) => rel.set.has(vs.map((x) => (m >> x) & 1).join('')))) sol.push(m); }
          return { cons, sol, n };
        };
        let table = null, tkey = '';
        let info = {};
        v.render(() => {
          // table
          const cell = OPS.map(() => []); const cx = (j) => 4.45 + j * 1.04;
          s1.text('relation', 0.3, REL.length + 1.1, { size: 11.5, color: 'muted', weight: 700 });
          OPS.forEach((op, j) => { s1.text(op.name, cx(j), REL.length + 1.3, { align: 'center', size: 9.5, weight: 700 }); s1.text(op.sym, cx(j), REL.length + 0.75, { align: 'center', size: 10, color: 'muted' }); });
          REL.forEach((r, i) => {
            const y = rowY(i), on = sel[i];
            s1.rect(0.1, y - 0.42, 10.5, y + 0.42, { fill: on ? 'accent' : 'faint', fillAlpha: on ? 0.14 : 0.05, color: on ? 'accent' : 'faint', width: on ? 1.5 : 0.8, radius: 4 });
            s1.text(`$${r.tex}$`, 0.4, y, { baseline: 'middle', size: 12.5, color: on ? 'ink' : 'muted' });
            s1.text(`${r.tuples.length} of ${1 << r.k}`, 3.6, y, { baseline: 'middle', align: 'right', size: 9.5, color: 'muted' });
            OPS.forEach((op, j) => {
              const c = closedUnder(r, op); cell[j].push(c);
              s1.rect(cx(j) - 0.32, y - 0.3, cx(j) + 0.32, y + 0.3, { fill: c.ok ? 'green' : 'red', fillAlpha: on ? (c.ok ? 0.55 : 0.28) : 0.12, stroke: false, radius: 3 });
              s1.text(c.ok ? '✓' : '✗', cx(j), y, { align: 'center', baseline: 'middle', size: 12, weight: 700, color: c.ok ? 'green' : 'red', halo: false });
            });
          });
          const used = REL.map((_, i) => i).filter((i) => sel[i]);
          const good = OPS.map((op, j) => used.length > 0 && used.every((i) => cell[j][i].ok));
          s1.line(0.1, 0.0, 10.5, 0.0, { color: 'ink', width: 1.5 });
          s1.text('all selected relations closed?', 0.4, -0.55, { baseline: 'middle', size: 11, weight: 700 });
          OPS.forEach((op, j) => { s1.rect(cx(j) - 0.4, -0.95, cx(j) + 0.4, -0.15, { fill: good[j] ? 'green' : 'red', fillAlpha: good[j] ? 0.7 : 0.25, stroke: false, radius: 4 }); s1.text(good[j] ? '✓' : '✗', cx(j), -0.55, { align: 'center', baseline: 'middle', size: 15, weight: 800, color: good[j] ? 'panel' : 'red', halo: false }); });
          const tract = good.findIndex((x) => x);
          const verdict = !used.length ? 'select some relations' : tract >= 0 ? `tractable — ${OPS[tract].name}: ${OPS[tract].alg}` : 'NP-complete: no common operation (3SAT reduces to this language)';
          s1.text(verdict, 5.3, -2.1, { align: 'center', size: 14, weight: 800, color: !used.length ? 'muted' : tract >= 0 ? 'green' : 'red' });
          // witnesses: first failing relation for first column that fails
          let wit = '';
          if (used.length && tract < 0) { const j = 4; const i = used.find((q) => !cell[j][q].ok); if (i !== undefined) { const w = cell[j][i].w; wit = `${OPS[j].name}: $${REL[i].tex}$ has solutions ${w[0].map((t) => `$(${t.join('')})$`).join(', ')} whose ${OPS[j].sym} is $(${w[1].join('')})$, not a solution`; } }
          // right: closure statistics
          const I = inst(); const bars = [];
          if (I && I.sol.length >= 2) {
            const r = v.rng(seed * 17 + 5), set = new Set(I.sol);
            OPS.forEach((op) => {
              let ok = 0, tot = 0;
              for (let t = 0; t < 400; t++) {
                const args = Array.from({ length: op.ar }, () => I.sol[Math.floor(r() * I.sol.length)]); let m = 0;
                for (let b = 0; b < I.n; b++) m |= op.f(...args.map((a) => (a >> b) & 1)) << b;
                tot++; if (set.has(m)) ok++;
              }
              bars.push(ok / tot);
            });
          }
          if (bars.length) { bars.forEach((f, j) => { s2.rect(j - 0.3, 0, j + 0.3, f, { fill: f > 0.9999 ? 'green' : 'red', fillAlpha: 0.55, color: f > 0.9999 ? 'green' : 'red', width: 1.5 }); s2.text(`${Math.round(f * 100)}%`, j, f + 0.05, { align: 'center', size: 11, weight: 700 }); }); s2.hline(1, { color: 'green', dash: true, alpha: 0.6 }); }
          else s2.text(I ? 'too few solutions — new instance' : 'select relations', 2.5, 0.5, { align: 'center', color: 'muted', size: 13 });
          info = { I, used, tract, wit, bars };
        });
        v.readout(() => {
          const { I, used, tract, wit } = info; if (!used.length) return 'Select at least one relation.';
          return `Γ = {${used.map((i) => `$${REL[i].tex}$`).join(', ')}} · ${tract >= 0 ? `**in P**: every relation is ${OPS[tract].name}` : '**NP-complete**: no operation preserves them all'}` + (wit ? `\n${wit}` : '') + (I ? `\nrandom instance: 9 variables, 9 constraints, **${I.sol.length}** solutions among 512 assignments.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Theorem',
      name: 'Mahaney’s theorem: no sparse NP-complete sets unless P = NP',
      statement: String.raw`A set $S\subseteq\{0,1\}^*$ is **sparse** if it contains at most polynomially many strings of each length, $|S\cap\{0,1\}^{n}|\le p(n)$. **Mahaney's theorem:** if some sparse set is NP-complete (under polynomial-time many-one reductions), then P = NP. Equivalently, unless P = NP, every NP-complete language is *dense*: no polynomial-time reduction can squeeze SAT into a polynomially thin set. (Berman, 1978, had proved the unary — "tally" — case first.)`,
      idea: String.raw`Suppose $f$ reduces SAT to a sparse $S$. Search for a satisfying assignment of $\varphi$ by the *self-reduction* (toc-13.14): fix $x_1,x_2,\dots$ one at a time, which yields a binary tree of $2^{n+1}-1$ restricted formulas, and $\varphi$ is satisfiable iff some leaf is. Because $f$ is a reduction, two nodes with the **same image** $f(\varphi_u)=f(\varphi_v)$ are equally satisfiable. A depth-first search that remembers the images of the subtrees it has already refuted can therefore skip any node whose image repeats. All images have polynomial length, and only polynomially many of them can lie in $S$ — but the images of unsatisfiable nodes lie *outside* $S$, which is what the ordered ("left-set") argument of Ogiwara and Watanabe controls in the general sparse case (not drawn here; the picture shows the tally-set case of Berman, where the count is immediate: at most $q(n)$ distinct images exist, so at most $n\,q(n)$ nodes are expanded).`,
      caption: String.raw`**Illustrative — a hypothetical reduction.** Nobody knows such an $f$ (it would give P = NP), so the picture *simulates* one: every node of the self-reduction tree of a real random 3-CNF is mapped to an image drawn from a pool of $p$ possible values for satisfiable and $p$ for unsatisfiable restrictions, equal restricted formulas getting equal images. The search (always left child first) is **real**: blue nodes are expanded, orange nodes are cut because their image is already known to be fruitless, faint nodes are never reached, green marks the satisfying leaf found. Drag the pool size $p$: with $p$ small only about $n\cdot p$ nodes are ever expanded; as $p$ grows towards the number of distinct formulas — a *dense* target — the pruning disappears and the full tree $2^{n+1}-1$ is explored. The right panel plots expanded nodes against $p$.`,
      deps: ['toc-13.14', 'toc-13.2'],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Mahaney, 1980–82 (Berman, 1978, for tally sets; Ogiwara & Watanabe, 1991, for the left-set proof)',
      tags: ['sparse sets', 'self-reduction', 'P vs NP'],
      verify: true,
      viz(v) {
        const nS = v.slider('variables $n$', 3, 7, 6, { int: true });
        const pS = v.slider('pool size $p$ of images', 1, 4096, 4, { log: true, int: true });
        const kind = v.select('formula', [{ value: 'sat', label: 'satisfiable' }, { value: 'unsat', label: 'unsatisfiable' }], 'unsat');
        let seed = 1; v.button('New formula', () => { seed++; });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true, title: 'self-reduction tree of $\\varphi$ (root at the top, leaves = full assignments)' });
        const s2 = v.stage({ x: [0, 12], y: [0, 9], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'pool size $p$ (log$_2$)', ylabel: 'expanded nodes (log$_2$)', xticks: [0, 2, 4, 6, 8, 10, 12].map((k) => [k, String(2 ** k)]), yticks: [0, 2, 4, 6, 8].map((k) => [k, String(2 ** k)] ) });
        let key = '', F = null, T = null;
        const make = () => {
          const n = nS.value, k = `${n}:${kind.value}:${seed}`; if (k === key) return; key = k;
          for (let t = 0; t < 400; t++) {
            const r = v.rng(seed * 1000 + t + n), m = Math.round((kind.value === 'sat' ? 3.4 : 6.5) * n), cl = []; // clause/variable ratio
            for (let j = 0; j < m; j++) { const vs = []; while (vs.length < 3) { const x = 1 + Math.floor(r() * n); if (!vs.includes(x)) vs.push(x); } cl.push(vs.map((x) => (r() < 0.5 ? x : -x))); }
            const sat = allModels(n, cl, 1).length > 0; if ((kind.value === 'sat') === sat) { F = { n, cl }; break; }
          }
          T = selfTree(F.n, F.cl); T.cache = {};
        };
        v.render(() => {
          make(); const n = F.n, p = Math.round(pS.value), R = berman(T, p);
          const X = (id) => { const d = T.depth[id], i = id - (1 << d); return ((i + 0.5) * (1 << (n - d))) / (1 << n); };
          const Y = (id) => 0.94 - (T.depth[id] * 0.88) / n;
          s.setView([0, 1], [0, 1]);
          for (let id = 2; id < T.N; id++) { const par = id >> 1; const on = R.status[id] !== 'unseen'; s.line(X(par), Y(par), X(id), Y(id), { color: on ? 'muted' : 'faint', width: on ? 1.4 : 0.8, alpha: on ? 0.9 : 0.5 }); }
          const rad = n >= 7 ? 3 : n >= 6 ? 4 : 6;
          for (let id = 1; id < T.N; id++) {
            const st = R.status[id], col = st === 'win' ? 'green' : st === 'explored' ? 'accent' : st === 'pruned' ? 'orange' : 'faint';
            s.dot(X(id), Y(id), { r: st === 'win' ? rad + 3 : rad, color: col, hollow: st === 'unseen' });
          }
          s.corner(`${F.cl.length} clauses, ${T.models} satisfying assignment${T.models === 1 ? '' : 's'}`, 'tl', { color: 'muted' });
          // right panel: nodes vs p
          const pts = []; for (let k = 0; k <= 12; k++) { const r2 = T.cache[k] ?? (T.cache[k] = berman(T, 2 ** k)); pts.push([k, Math.log2(r2.visited)]); }
          s2.path(pts, { color: 'accent', width: 2.5 }); s2.dots(pts, { color: 'accent', r: 3.5 });
          s2.hline(Math.log2(T.N - 1), { color: 'red', dash: true, alpha: 0.7 });
          s2.text(`full tree: ${T.N - 1} nodes`, 0.3, Math.log2(T.N - 1) + 0.35, { size: 11, color: 'red' });
          s2.vline(Math.log2(p), { color: 'gold', dash: [4, 3] }); s2.dot(Math.log2(p), Math.log2(R.visited), { r: 7, color: 'gold' });
          T.last = R;
        });
        v.legend([['accent', 'expanded', { dot: true }], ['orange', 'cut: image seen before', { dot: true }], ['green', 'satisfying leaf', { dot: true }], ['faint', 'never reached', { dot: true }]]);
        v.readout(() => {
          const R = T.last, n = F.n, ans = R.win !== null, truth = T.models > 0, p = Math.round(pS.value);
          return `$n=${n}$, pool $p=${p}$: expanded **${R.visited}** of ${T.N - 1} nodes (${(100 * R.visited / (T.N - 1)).toFixed(0)}%), cut **${R.status.filter((x) => x === 'pruned').length}** subtrees, distinct fruitless images **${R.distinct}** (bound $\\le$ ${p} here) · answer: **${ans ? 'satisfiable' : 'unsatisfiable'}** — ${ans === truth ? 'matches brute force ✓' : '**WRONG**'}`;
        });
      },
    },
  ],
};
