// Algorithms — Chapter 7: Dynamic programming (items 7.1–7.8; 7.9–7.16 in ch07-b.js)
import { clamp, lerp, plural, r2, big, tbig, cleanWord, arcArrow, editTable, editTrace, alignCost, drawAlignment, OPCOL } from './ch07.shared.js';

const PHI = (1 + Math.sqrt(5)) / 2;
const fibN = (k) => { let a = 0, b = 1; for (let i = 0; i < k; i++) [a, b] = [b, a + b]; return a; };
/** A square of half-side r pixels centred at data point (x, y). */
function sq(s, x, y, r, st) { const X = s.X(x), Y = s.Y(y); s.rect(s.invX(X - r), s.invY(Y + r), s.invX(X + r), s.invY(Y - r), st); }

// ---------------------------------------------------------------- 7.1 Fibonacci call trees
/** Naive call tree of Fib(n) in preorder; cls = 'first' (computed with memoization), 'hit' (memo lookup) or 'gone' (never called). */
function fibTree(n) {
  const nodes = [];
  (function rec(k, parent, depth) {
    const nd = { id: nodes.length, k, parent, kids: [], depth };
    nodes.push(nd); if (parent != null) nodes[parent].kids.push(nd.id);
    if (k >= 2) { rec(k - 1, nd.id, depth + 1); rec(k - 2, nd.id, depth + 1); }
  })(n, null, 0);
  const seen = new Set();
  for (const nd of nodes) {
    const par = nd.parent == null ? null : nodes[nd.parent];
    if (par && par.cls !== 'first') nd.cls = 'gone';
    else if (!seen.has(nd.k)) { nd.cls = 'first'; seen.add(nd.k); }
    else nd.cls = 'hit';
  }
  return nodes;
}
/** Leaves evenly spaced in preorder, parents centred; nodes not kept sit on their nearest kept ancestor. */
function fibLayout(nodes, keep) {
  const X = [], Y = []; let leaf = 0;
  (function go(id) {
    const nd = nodes[id], kids = nd.kids.filter((c) => keep(nodes[c]));
    if (!kids.length) X[id] = leaf++; else { kids.forEach(go); X[id] = (X[kids[0]] + X[kids[kids.length - 1]]) / 2; }
    Y[id] = nd.depth;
  })(0);
  for (const nd of nodes) if (!keep(nd)) { let a = nd.parent; while (!keep(nodes[a])) a = nodes[a].parent; X[nd.id] = X[a]; Y[nd.id] = Y[a]; }
  return { X, Y, leaves: leaf };
}
const FIB_CODE = [
  'Fib(n):                                    ▷ naive',
  '  if n < 2: return n',
  '  return Fib(n − 1) + Fib(n − 2)',
  'MemoFib(n):                                ▷ memo[·] starts empty',
  '  if n < 2: return n',
  '  if memo[n] is empty:',
  '    memo[n] ← MemoFib(n − 1) + MemoFib(n − 2)',
  '  return memo[n]',
];

// ---------------------------------------------------------------- 7.2 evaluation orders on a grid DP
const GRID_CODE = [
  'for each cell (i, j) in the chosen order:',
  '  if (i, j) is blocked:  P[i, j] ← 0',
  '  elif (i, j) = (0, 0):  P[i, j] ← 1',
  '  else:  P[i, j] ← P[i−1, j] + P[i, j−1]  (+ P[i−1, j−1])',
  'return P[R−1, C−1]',
];
function gridOrder(kind, R, C) {
  const out = [];
  if (kind === 'cols') { for (let j = 0; j < C; j++) for (let i = 0; i < R; i++) out.push([i, j]); }
  else if (kind === 'diag') { for (let d = 0; d < R + C - 1; d++) for (let i = 0; i < R; i++) { const j = d - i; if (j >= 0 && j < C) out.push([i, j]); } }
  else if (kind === 'rtl') { for (let i = 0; i < R; i++) for (let j = C - 1; j >= 0; j--) out.push([i, j]); }
  else for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) out.push([i, j]);
  return out;
}
const gridDeps = (i, j, diag) => [[i - 1, j], [i, j - 1], ...(diag ? [[i - 1, j - 1]] : [])].filter(([a, b]) => a >= 0 && b >= 0);
function gridTruth(R, C, blocked, diag) {
  const P = Array.from({ length: R }, () => Array(C).fill(0));
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) P[i][j] = blocked.has(i + ',' + j) ? 0 : !i && !j ? 1 : gridDeps(i, j, diag).reduce((t, [a, b]) => t + P[a][b], 0);
  return P;
}
/** One evaluation step on table V (null = not computed yet): returns the value written and the dependencies that were still empty. */
function gridStep(V, i, j, blocked, diag) {
  if (blocked.has(i + ',' + j)) return { val: 0, deps: [], miss: [], kind: 2 };
  if (!i && !j) return { val: 1, deps: [], miss: [], kind: 3 };
  const deps = gridDeps(i, j, diag), miss = deps.filter(([a, b]) => V[a][b] == null);
  return { val: deps.reduce((t, [a, b]) => t + (V[a][b] ?? 0), 0), deps, miss, kind: 4 };
}
function gridFrames(kind, R, C, blocked, diag) {
  const truth = gridTruth(R, C, blocked, diag), V = Array.from({ length: R }, () => Array(C).fill(null)), F = [], bad = [];
  const cells = gridOrder(kind, R, C), rank = {};
  cells.forEach(([i, j], k) => { rank[i + ',' + j] = k + 1; });
  F.push({ V: V.map((r) => r.slice()), bad: [], rank, truth, line: 1, note: `Empty table. Each cell counts the monotone paths from the top-left cell to it, so it **reads** the cell above and the cell to its left${diag ? ' and the one diagonally above-left' : ''}. The small grey numbers give the order chosen.` });
  for (const [i, j] of cells) {
    const r = gridStep(V, i, j, blocked, diag); V[i][j] = r.val;
    r.miss.forEach((d) => bad.push([[i, j], d]));
    const terms = r.deps.map(([a, b]) => (V[a][b] == null ? '∅' : V[a][b])).join(' + ');
    const note = r.kind === 2 ? `Cell (${i}, ${j}) is blocked: no path ends there, $P = 0$.` : r.kind === 3 ? 'The start cell: exactly one (empty) path, $P[0,0] = 1$.'
      : r.miss.length ? `✗ $P[${i},${j}]$ needs ${r.miss.map(([a, b]) => `$P[${a},${b}]$`).join(' and ')}, which ${r.miss.length > 1 ? 'are' : 'is'} **still empty** (read as 0): it gets ${r.val}${r.val !== truth[i][j] ? `, but the true count is ${truth[i][j]}` : ''}.`
      : `$P[${i},${j}] = ${terms || 0} = ${r.val}$${r.val !== truth[i][j] ? ` — wrong (${truth[i][j]}), because an input was already wrong` : ''}.`;
    F.push({ V: V.map((row) => row.slice()), cur: [i, j], deps: r.deps, miss: r.miss, bad: bad.slice(), rank, truth, line: r.kind, note });
  }
  const ok = bad.length === 0, got = V[R - 1][C - 1], want = truth[R - 1][C - 1];
  F.push({ V: V.map((r) => r.slice()), bad: bad.slice(), rank, truth, done: true, line: 5, hold: 2, note: ok ? `Done. Every cell was evaluated after the cells it reads — the order is a **topological order** of the dependency DAG — and $P[${R - 1},${C - 1}] = ${got}$ paths ✓.` : `Done, but ${plural(bad.length, 'read')} of an empty cell happened (red arrows): the corner says ${got}, the true count is ${want} ✗. This order is not a topological order of the DAG.` });
  return F;
}

// ---------------------------------------------------------------- 7.3 optimal substructure on a grid of cell costs
const gridCosts = (R, C, r) => Array.from({ length: R * C }, () => 1 + Math.floor(r() * 9));
function gridNb(R, C) { return Array.from({ length: R * C }, (_, k) => { const i = Math.floor(k / C), j = k % C, o = []; if (i) o.push(k - C); if (j) o.push(k - 1); if (j < C - 1) o.push(k + 1); if (i < R - 1) o.push(k + C); return o; }); }
/** Cheapest path (sum of cell costs, both ends included) by Dijkstra. */
function cheapest(nb, cost, s, t) {
  const N = cost.length, d = Array(N).fill(Infinity), prev = Array(N).fill(-1), done = Array(N).fill(false); d[s] = cost[s];
  for (;;) {
    let u = -1; for (let k = 0; k < N; k++) if (!done[k] && (u < 0 || d[k] < d[u])) u = k;
    if (u < 0 || d[u] === Infinity) break; done[u] = true; if (u === t) break;
    for (const w of nb[u]) if (d[u] + cost[w] < d[w]) { d[w] = d[u] + cost[w]; prev[w] = u; }
  }
  const path = []; for (let u = t; u >= 0; u = prev[u]) path.unshift(u);
  return { val: d[t], path };
}
/** Most valuable simple path from s to t (exhaustive search over self-avoiding paths). */
function richest(nb, cost, s, t) {
  const vis = new Uint8Array(cost.length), path = [s]; let best = -1, bp = [s]; vis[s] = 1;
  if (s === t) return { val: cost[s], path: [s] };
  (function go(u, acc) {
    if (u === t) { if (acc > best) { best = acc; bp = path.slice(); } return; }
    for (const w of nb[u]) if (!vis[w]) { vis[w] = 1; path.push(w); go(w, acc + cost[w]); path.pop(); vis[w] = 0; }
  })(s, cost[s]);
  return { val: best, path: bp };
}

// ---------------------------------------------------------------- 7.4 rod cutting
const ROD_CODE = [
  'r[0] ← 0',
  'for j ← 1 to n:                         ▷ rods in increasing length',
  '  r[j] ← −∞',
  '  for i ← 1 to j:                       ▷ the first piece has length i',
  '    if p[i] + r[j − i] > r[j]:  r[j] ← p[i] + r[j − i];  s[j] ← i',
  'return r[n]',
  'while n > 0:  cut off s[n];  n ← n − s[n]   ▷ read the cuts back',
];
const PIECE = ['blue', 'teal', 'purple', 'orange', 'pink', 'green', 'red', 'gold'];
function rodSolve(p, n) {
  const r = [0], s = [0];
  for (let j = 1; j <= n; j++) { let b = -Infinity, bi = 0; for (let i = 1; i <= j; i++) if (p[i] + r[j - i] > b) { b = p[i] + r[j - i]; bi = i; } r[j] = b; s[j] = bi; }
  return { r, s };
}
const rodPieces = (s, j) => { const out = []; while (j > 0) { out.push(s[j]); j -= s[j]; } return out; };
function rodFrames(p, n) {
  const { r, s } = rodSolve(p, n), F = [];
  F.push({ j: 0, upto: 0, r, s, line: 1, note: 'A rod of length 0 earns nothing: $r_0 = 0$. Rods are now solved in increasing length.' });
  for (let j = 1; j <= n; j++) {
    const cand = [null]; for (let i = 1; i <= j; i++) cand.push(p[i] + r[j - i]);
    const bi = s[j];
    F.push({ j, upto: j, cand, bi, r, s, line: [2, 3, 4, 5], note: `Length ${j}: try every first piece $i = 1..${j}$ and add the best revenue for the rest, already in the table. Best: $p_{${bi}} + r_{${j - bi}} = ${p[bi]} + ${r[j - bi]} = ${r[j]}$, so $r_{${j}} = ${r[j]}$, $s_{${j}} = ${bi}$.` });
  }
  const pieces = []; let j = n;
  F.push({ j: n, upto: n, r, s, trace: [], tj: n, line: 6, note: `The table is full: the best revenue for length ${n} is $r_{${n}} = ${r[n]}$. Now follow the first-cut pointers $s_j$ back.` });
  while (j > 0) {
    pieces.push(s[j]); const was = j; j -= s[j];
    F.push({ j: n, upto: n, r, s, trace: pieces.slice(), tj: j, from: was, line: 7, hold: 1.2, note: `$s_{${was}} = ${s[was]}$: cut off a piece of length ${s[was]} (price ${p[s[was]]}), ${j ? `leaving length ${j}` : 'nothing is left'}.` });
  }
  F[F.length - 1].note += ` Pieces ${pieces.join(' + ')} earn ${pieces.map((k) => p[k]).join(' + ')} = **${r[n]}**.`;
  return F;
}

// ---------------------------------------------------------------- 7.5 weighted interval scheduling
const WIS_CODE = [
  'sort the intervals by finishing time:  f₁ ≤ f₂ ≤ … ≤ fₙ',
  'for j ← 1 to n:  p(j) ← largest i < j with fᵢ ≤ sⱼ   ▷ binary search',
  'OPT(0) ← 0',
  'for j ← 1 to n:',
  '  OPT(j) ← max( wⱼ + OPT(p(j)),  OPT(j − 1) )      ▷ take j, or skip it',
  'trace back from n: take j and jump to p(j), or step to j − 1',
];
function wisSolve(iv) {
  const A = iv.map((x, k) => ({ ...x, id: k })).sort((a, b) => a.f - b.f || a.s - b.s), n = A.length, p = [0], opt = [0], take = [false];
  for (let j = 1; j <= n; j++) {
    let lo = 0, hi = j - 1; // largest i in [0, j−1] with f_i ≤ s_j (f_0 = −∞)
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (A[mid - 1].f <= A[j - 1].s) lo = mid; else hi = mid - 1; }
    p.push(lo);
    const a = A[j - 1].w + opt[lo], b = opt[j - 1]; opt.push(Math.max(a, b)); take.push(a >= b);
  }
  const chosen = []; for (let j = n; j > 0;) { if (take[j]) { chosen.unshift(j); j = p[j]; } else j--; }
  return { A, n, p, opt, take, chosen };
}

// ---------------------------------------------------------------- 7.6 longest increasing subsequence
function lisFrames(a) {
  const n = a.length, L = [], pred = [], piles = [], back = [], F = []; let dpC = 0, bsC = 0;
  for (let i = 0; i < n; i++) {
    let best = 1, bp = -1; const cands = [];
    for (let j = 0; j < i; j++) { dpC++; if (a[j] < a[i]) { cands.push(j); if (L[j] + 1 > best) { best = L[j] + 1; bp = j; } } }
    L.push(best); pred.push(bp);
    let lo = 0, hi = piles.length; const probes = [];
    while (lo < hi) { const mid = (lo + hi) >> 1; probes.push(mid); bsC++; if (a[piles[mid][piles[mid].length - 1]] >= a[i]) hi = mid; else lo = mid + 1; }
    back[i] = lo > 0 ? piles[lo - 1][piles[lo - 1].length - 1] : -1;
    if (lo === piles.length) piles.push([]); piles[lo].push(i);
    F.push({ i, L: L.slice(), pred: pred.slice(), cands, piles: piles.map((p) => p.slice()), pile: lo, probes, dpC, bsC, line: [2, 3, 4],
      note: `$a_{${i + 1}} = ${a[i]}$: ${cands.length ? `the longest increasing run ending at an earlier, smaller element has length ${best - 1} (ending at $a_{${bp + 1}} = ${a[bp]}$), so $L_{${i + 1}} = ${best}$` : `no earlier element is smaller, so $L_{${i + 1}} = 1$`}. Patience: binary search puts ${a[i]} on pile ${lo + 1}${lo === piles.length - 1 && piles[lo].length === 1 ? ' (a new pile)' : ''}.` });
  }
  const len = Math.max(...L); let e = L.indexOf(len); const dpSeq = []; while (e >= 0) { dpSeq.unshift(e); e = pred[e]; }
  const pSeq = []; for (let c = piles[piles.length - 1][piles[piles.length - 1].length - 1]; c >= 0; c = back[c]) pSeq.unshift(c);
  F.push({ i: n - 1, L, pred, piles, done: true, dpSeq, pSeq, dpC, bsC, line: [5, 6], hold: 2, note: `Done: $\\max_i L_i = ${len}$ and there are **${piles.length}** piles. Following predecessor arrows from the best $L_i$ (green bars) and back-pointers from the last pile (green cards) both give increasing subsequences of length ${len}.` });
  return { F, back };
}
const LIS_CODE = [
  'for i ← 1 to n:',
  '  L[i] ← 1 + max{ L[j] : j < i, aⱼ < aᵢ }   (or 1)    ▷ O(n²)',
  '  pred[i] ← the j achieving it',
  '  put aᵢ on the leftmost pile whose top is ≥ aᵢ  ▷ binary search',
  'LIS length = max L[i] = number of piles',
  'read a longest run back along pred[·]',
];

// ---------------------------------------------------------------- 7.7 / 7.8 DP frames on two strings
const LCS_CODE = [
  'c[i, 0] ← 0;   c[0, j] ← 0',
  'for i ← 1 to m:',
  '  for j ← 1 to n:',
  '    if $x_i = y_j$:  c[i, j] ← c[i−1, j−1] + 1                ▷ ↖',
  '    else:  c[i, j] ← max(c[i−1, j], c[i, j−1])             ▷ ↑ or ←',
  'trace back from (m, n): every ↖ is a letter of the LCS',
];
function lcsFrames(X, Y) {
  const m = X.length, n = Y.length, c = Array.from({ length: m + 1 }, () => Array(n + 1).fill(null)), P = Array.from({ length: m + 1 }, () => Array(n + 1).fill(null)), F = [];
  const snap = (o) => F.push({ vals: c.map((r) => r.slice()), ptr: P.map((r) => r.slice()), ...o });
  for (let i = 0; i <= m; i++) c[i][0] = 0; for (let j = 0; j <= n; j++) c[0][j] = 0;
  snap({ line: 1, note: 'Row 0 and column 0 are 0: an empty string has only the empty common subsequence.' });
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const a = X[i - 1], b = Y[j - 1];
    if (a === b) { c[i][j] = c[i - 1][j - 1] + 1; P[i][j] = [-1, -1]; snap({ cur: [i, j], deps: [[i - 1, j - 1]], line: 4, note: `$x_{${i}} = y_{${j}} =$ **${a}**: extend the best for the shorter prefixes, $c[${i},${j}] = ${c[i - 1][j - 1]} + 1 = ${c[i][j]}$ ↖.` }); }
    else {
      const up = c[i - 1][j], left = c[i][j - 1]; c[i][j] = Math.max(up, left); P[i][j] = up >= left ? [-1, 0] : [0, -1];
      snap({ cur: [i, j], deps: [[i - 1, j], [i, j - 1]], line: 5, note: `**${a}** ≠ **${b}**: one of them is not in the LCS; keep the better of dropping $x_{${i}}$ (${up}, ↑) and dropping $y_{${j}}$ (${left}, ←): ${c[i][j]}.` });
    }
  }
  let i = m, j = n; const path = [[i, j]], pairs = [];
  snap({ path: path.slice(), pairs: [], line: 6, note: `The table is full: the LCS has length **${c[m][n]}**. Walk back from the corner along the arrows.` });
  while (i > 0 && j > 0) {
    const [di, dj] = P[i][j];
    if (di && dj) pairs.unshift([i - 1, j - 1]);
    i += di; j += dj; path.push([i, j]);
    snap({ path: path.slice(), pairs: pairs.slice(), line: 6, hold: 0.7, note: di && dj ? `↖ at (${i + 1}, ${j + 1}): **${X[i]}** belongs to the LCS.` : `${di ? '↑' : '←'}: skip ${di ? `$x_{${i + 1}}$ = ${X[i]}` : `$y_{${j + 1}}$ = ${Y[j]}`}.` });
  }
  const lcs = pairs.map(([a]) => X[a]).join('');
  F[F.length - 1].note = `Back at the border. The ↖ steps spell the LCS **${lcs || '(empty)'}**, length ${c[m][n]}.`;
  F[F.length - 1].hold = 2;
  return { F, lcs, len: c[m][n] };
}
const EDIT_CODE = [
  'D[i, 0] ← i·c_del;   D[0, j] ← j·c_ins',
  'for i ← 1 to m:',
  '  for j ← 1 to n:',
  '    D[i, j] ← min( D[i−1, j] + c_del,             ▷ delete $x_i$',
  '                   D[i, j−1] + c_ins,             ▷ insert $y_j$',
  '                   D[i−1, j−1] + [$x_i \\ne y_j$]·c_sub )  ▷ keep / substitute',
  'trace back from (m, n): the optimal alignment',
];
function editFrames(X, Y, c) {
  const { D, P } = editTable(X, Y, c), m = X.length, n = Y.length, F = [];
  const vals = Array.from({ length: m + 1 }, () => Array(n + 1).fill(null)), ptr = Array.from({ length: m + 1 }, () => Array(n + 1).fill(null));
  const snap = (o) => F.push({ vals: vals.map((r) => r.slice()), ptr: ptr.map((r) => r.slice()), ...o });
  for (let i = 0; i <= m; i++) { vals[i][0] = D[i][0]; ptr[i][0] = P[i][0]; }
  for (let j = 0; j <= n; j++) { vals[0][j] = D[0][j]; ptr[0][j] = P[0][j]; }
  snap({ line: 1, note: `Turning the first $i$ letters of x into nothing takes $i$ deletions; building the first $j$ letters of y from nothing takes $j$ insertions.` });
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    vals[i][j] = D[i][j]; ptr[i][j] = P[i][j];
    const same = X[i - 1] === Y[j - 1], del = D[i - 1][j] + c.del, ins = D[i][j - 1] + c.ins, dg = D[i - 1][j - 1] + (same ? 0 : c.sub);
    snap({ cur: [i, j], deps: [[i - 1, j], [i, j - 1], [i - 1, j - 1]], line: [4, 5, 6], note: `${same ? `**${X[i - 1]}** = **${Y[j - 1]}**: keep it for free` : `**${X[i - 1]}** → **${Y[j - 1]}** costs ${r2(c.sub)}`}. min(delete ${r2(del)}, insert ${r2(ins)}, ${same ? 'keep' : 'substitute'} ${r2(dg)}) = **${r2(D[i][j])}**.` });
  }
  const { path, cols } = editTrace(X, Y, P);
  snap({ path: [path[0]], shown: 0, line: 7, note: `Full table: the edit distance is $D[${m},${n}] = ${r2(D[m][n])}$. Follow the arrows back to $(0, 0)$.` });
  for (let k = 1; k < path.length; k++) {
    const cl = cols[cols.length - k];
    snap({ path: path.slice(0, k + 1), shown: k, line: 7, hold: 0.7, note: cl.op === 'match' ? `↖ keep **${cl.a}**.` : cl.op === 'sub' ? `↖ substitute **${cl.a}** → **${cl.b}** (${r2(c.sub)}).` : cl.op === 'del' ? `↑ delete **${cl.a}** (${r2(c.del)}).` : `← insert **${cl.b}** (${r2(c.ins)}).` });
  }
  F[F.length - 1].note = `The alignment below costs ${r2(alignCost(cols, c))} = $D[${m},${n}]$.`;
  F[F.length - 1].hold = 2;
  return { F, D, cols, path };
}
function lcsLen(X, Y) {
  const m = X.length, n = Y.length, c = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) c[i][j] = X[i - 1] === Y[j - 1] ? c[i - 1][j - 1] + 1 : Math.max(c[i - 1][j], c[i][j - 1]);
  return c[m][n];
}
/** Draw a DP table frame (values, pointers, current cell, dependencies, trace-back path) with the table kit. o.edit colours the path by operation. */
function drawDP(T, f, X, Y, o = {}) {
  const key = (i, j) => i * 100 + j, path = f.path || [], deps = new Set((f.deps || []).map(([i, j]) => key(i, j)));
  const isCur = (i, j) => f.cur && f.cur[0] === i && f.cur[1] === j;
  const step = new Map(); // path cell → the operation of the step taken out of it
  path.forEach(([a, b], k) => {
    const nx = path[k + 1]; if (!nx) { step.set(key(a, b), 'end'); return; }
    const di = a - nx[0], dj = b - nx[1];
    step.set(key(a, b), di && dj ? (X[a - 1] === Y[b - 1] ? 'match' : 'sub') : di ? 'del' : 'ins');
  });
  const pathFill = (op) => (op === 'match' ? ['green', 0.42] : !o.edit ? ['green', 0.14] : op === 'sub' ? ['orange', 0.38] : op === 'del' ? ['red', 0.22] : op === 'ins' ? ['purple', 0.22] : ['green', 0.14]);
  T.draw({
    rows: X.length + 1, cols: Y.length + 1, rowLabels: ['', ...X], colLabels: ['', ...Y], cornerLabel: '',
    value: (i, j) => f.vals[i][j], format: o.format,
    fill: (i, j) => (isCur(i, j) ? ['gold', 0.45] : deps.has(key(i, j)) ? ['orange', 0.3] : step.has(key(i, j)) ? pathFill(step.get(key(i, j))) : null),
    textColor: (i, j) => (f.vals[i][j] == null ? null : step.has(key(i, j)) || isCur(i, j) ? 'ink' : 'muted'),
    weight: (i, j) => (step.has(key(i, j)) || isCur(i, j) ? 700 : 500),
    highlight: f.cur ? [f.cur] : [], activeRow: f.cur?.[0], activeCol: f.cur?.[1],
  });
  for (let i = 0; i <= X.length; i++) for (let j = 0; j <= Y.length; j++) {
    const p = f.ptr[i][j]; if (!p || isCur(i, j)) continue;
    const on = step.has(key(i, j)), match = p[0] && p[1] && X[i - 1] === Y[j - 1];
    T.pointer(i, j, p, { color: on || match ? 'green' : 'faint', alpha: on ? 1 : match ? 0.6 : 1 });
  }
  if (f.cur) { const [di, dj] = f.ptr[f.cur[0]][f.cur[1]]; T.arrow(f.cur, [f.cur[0] + di, f.cur[1] + dj], { color: 'accent', width: 2.4 }); }
  for (let k = 0; k + 1 < path.length; k++) T.arrow(path[k], path[k + 1], { color: 'green', width: 2.6 });
}

export default {
  collection: 'algo',
  chapter: 7,
  title: 'Dynamic programming',
  summary: String.raw`When a recursive solution keeps solving the same subproblems, storing their answers turns exponential time into polynomial time. Designing a dynamic program means choosing the subproblems, writing the recurrence that links them, and evaluating it in an order that respects the dependencies — a topological order of the subproblem DAG. The classic examples range over sequences (longest increasing and common subsequences, edit distance and its linear-space version), knapsacks and coins (where the running time is polynomial in the numbers but not in their length), matrix chains, search trees, trees in general, and finally the travelling salesman, where a table over subsets beats trying every tour.`,
  items: [
    // ------------------------------------------------------------------ 7.1
    {
      num: '7.1',
      kind: 'Concept',
      name: 'Memoization',
      statement: String.raw`**Memoization** stores the value of a recursive function the first time it is computed for an argument, in a table indexed by the arguments, and answers every later call with the same argument by a table lookup. It changes nothing about the values returned (the function must be *pure*: its result depends only on its arguments), only the work: each distinct subproblem is solved once, so the running time becomes
$$\big(\text{number of distinct subproblems}\big)\times\big(\text{work per subproblem, not counting recursive calls}\big),$$
plus the cost of the lookups. For Fibonacci numbers $F_n=F_{n-1}+F_{n-2}$, the naive recursion makes $C(n)=2F_{n+1}-1=\Theta(\varphi^n)$ calls, whereas the memoized one makes $2n-1$ calls for $n\ge 1$ and runs in $O(n)$ additions.`,
      idea: String.raw`The naive call count obeys $C(n)=1+C(n-1)+C(n-2)$ with $C(0)=C(1)=1$, so $C(n)+1$ satisfies the Fibonacci recurrence and equals $2F_{n+1}$; by the linear-recurrence theorem (2.11) it grows like $\varphi^n$ with $\varphi=(1+\sqrt5)/2$. Yet there are only $n+1$ different arguments: the call tree is exponentially redundant, the same subtree for $F_k$ appearing $F_{n-k+1}$ times. With a table, the first call for $k$ (along the leftmost path of the tree) does the work and every later call returns at once, so the tree is pruned to a spine of $n$ computing calls and $n-1$ lookups. Merging equal calls turns the tree into the DAG of subproblems — the object every dynamic program is really computing on.`,
      caption: String.raw`Step through the four views: the naive call tree, its repeated calls in red, the memoized tree (gold squares are lookups that start no subtree), and the collapse of equal calls into the DAG of $n+1$ subproblems, which is just the memo table. **Click a node** to light up every call with the same argument; change $n$ and watch the counts on the log-scale chart, where the naive count climbs along $\varphi^{n}$ and the memoized one crawls along $2n-1$.`,
      deps: ['algo-2.11'],
      see: ['comb-1.8', 'algo-7.2'],
      refs: ['Erickson Ch. 3'],
      credit: 'Donald Michie, 1968 (the word “memo function”)',
      tags: ['dynamic programming'],
      viz(v) {
        const nS = v.slider('$n$', 2, 8, 6, { int: true, onChange: () => { build(); S.reset({ at: 'keep' }); } });
        const T = v.stage({ x: [0, 100], y: [-7, 1], axes: false, height: 330, full: true });
        const P = v.stage({ x: [0, 30], y: [1, 1e7], ylog: true, axes: 'box', height: 200, full: true, xlabel: 'n', title: 'calls made to compute $F_n$ (log scale)' });
        let n, tr, lay, sel = null, counts;
        const C = [1, 1]; for (let k = 2; k <= 30; k++) C.push(1 + C[k - 1] + C[k - 2]);
        const Mc = (k) => (k < 2 ? 1 : 2 * k - 1);
        function build() {
          n = nS.value; tr = fibTree(n);
          lay = { full: fibLayout(tr, () => true), memo: fibLayout(tr, (nd) => nd.cls !== 'gone') };
          counts = Array(n + 1).fill(0); tr.forEach((nd) => counts[nd.k]++);
          if (sel != null && sel > n) sel = null;
        }
        build();
        const frames = () => {
          const reps = tr.length - (n + 1), hits = tr.filter((d) => d.cls === 'hit').length;
          return [
            { st: 0, lay: 'full', line: [1, 2, 3], note: `The naive call tree of Fib(${n}) has **${tr.length}** calls: every call above the base cases starts two more.` },
            { st: 1, lay: 'full', line: 3, note: `Only ${n + 1} different arguments occur, so **${reps}** of the ${tr.length} calls (red) recompute a value that some earlier call already found.` },
            { st: 2, lay: 'memo', line: [6, 7, 8], note: `With a memo table the first call for each argument computes and stores it; the ${hits} later calls (gold squares) return at once — a table lookup, or a base case — and start no subtree: **${2 * n - 1}** calls in all.` },
            { st: 3, lay: 'dag', line: 7, note: `Merge equal calls: the tree collapses into the DAG of the ${n + 1} subproblems, with ${2 * n - 2} dependency arrows — exactly the memo table. Red numbers: how often the naive tree calls each one.` },
          ];
        };
        const S = v.steps({ frames, code: FIB_CODE, codeTitle: 'Fibonacci, naive and memoized', codePos: 'below', transition: 0.8, speed: 0.45, start: 1, still: 1 });
        const X0 = 12, XW = 82;
        const at = (L, id) => {
          if (L === 'dag') return [X0 + XW * tr[id].k / n, -(n - 1) / 2];
          const l = lay[L]; return [l.leaves > 1 ? X0 + XW * l.X[id] / (l.leaves - 1) : X0 + XW / 2, -l.Y[id]];
        };
        const alphaOf = (L, nd) => (L === 'memo' && nd.cls === 'gone' ? 0 : 1);
        const radius = (L) => {
          const sp = L === 'dag' ? XW / n : XW / Math.max(1, lay[L].leaves - 1);
          return clamp(Math.min(sp * T.sx * 0.4, T.sy * 0.36), 4, 13);
        };
        let curPos = [];
        T.onClick((x, y) => {
          let best = null, bd = 18; const X = T.X(x), Y = T.Y(y);
          tr.forEach((nd, id) => { const p = curPos[id]; if (!p || p[2] < 0.5) return; const d = Math.hypot(T.X(p[0]) - X, T.Y(p[1]) - Y); if (d < bd) { bd = d; best = nd.k; } });
          sel = best == null || best === sel ? null : best;
        });
        v.render(() => {
          const f = S.frame, pf = S.prev, tw = S.tween, L1 = f.lay || 'full', L0 = pf.lay || L1, st = f.st ?? 0;
          const yB = -(n - 1);
          T.setView([0, 100], [yB - 2.05, 0.75]);
          const r = lerp(radius(L0), radius(L1), tw);
          curPos = tr.map((nd, id) => { const a = at(L0, id), b = at(L1, id); return [lerp(a[0], b[0], tw), lerp(a[1], b[1], tw), lerp(alphaOf(L0, nd), alphaOf(L1, nd), tw)]; });
          const dagEnd = L1 === 'dag' && tw > 0.97;
          // edges
          if (dagEnd) {
            const yD = -(n - 1) / 2, bendPx = Math.min(XW / n * T.sx * 0.55, 34);
            for (let k = 2; k <= n; k++) {
              const xk = X0 + XW * k / n, x1 = X0 + XW * (k - 1) / n, x2 = X0 + XW * (k - 2) / n, up = k % 2 === 0, dy = (r * 0.75 / T.sy) * (up ? 1 : -1);
              T.arrow(xk - (r + 1) / T.sx, yD, x1 + (r + 1.5) / T.sx, yD, { color: 'accent', width: 1.8, head: 7 });
              arcArrow(T, xk - (r * 0.55) / T.sx, yD + dy, x2 + (r * 0.75) / T.sx, yD + dy, (up ? -1 : 1) * bendPx, { color: 'purple', width: 1.8, headSize: 7 });
            }
          } else {
            tr.forEach((nd, id) => {
              if (nd.parent == null) return;
              const A = curPos[nd.parent], B = curPos[id], al = Math.min(A[2], B[2]); if (al < 0.03) return;
              const col = st === 1 && nd.cls !== 'first' ? 'red' : st === 2 && nd.cls === 'hit' ? 'gold' : st === 2 && nd.cls === 'gone' ? 'red' : 'muted';
              T.line(A[0], A[1], B[0], B[1], { color: col, width: col === 'muted' ? 1.3 : 1.7, alpha: al * (col === 'muted' ? 0.75 : 0.85) });
            });
          }
          // nodes (back to front so that the first occurrence ends on top)
          for (let id = tr.length - 1; id >= 0; id--) {
            const nd = tr[id], [x, y, al] = curPos[id]; if (al < 0.03) continue;
            const hl = sel === nd.k;
            if (st === 2 && nd.cls === 'hit') {
              sq(T, x, y, r * 0.86, { fill: 'gold', fillAlpha: 0.9 * al, color: 'gold', width: 1.4, alpha: al });
              if (r >= 6.5) T.text(String(nd.k), x, y, { align: 'center', size: clamp(r * 0.95, 8, 13), weight: 700, color: 'ink', halo: false, alpha: al });
            } else {
              const fillC = st >= 2 ? (nd.cls === 'gone' ? null : 'accent') : null, edgeC = st === 1 && nd.cls !== 'first' ? 'red' : st === 2 && nd.cls === 'gone' ? 'red' : 'accent';
              if (fillC) T.dot(x, y, { r, color: fillC, alpha: al });
              else { T.dot(x, y, { r, hollow: true, color: edgeC, width: 1.8, alpha: al }); if (edgeC === 'red') T.dot(x, y, { r: r - 1.3, color: 'red', alpha: 0.18 * al, ring: false }); }
              if (r >= 6.5) T.text(String(nd.k), x, y, { align: 'center', size: clamp(r * 0.95, 8, 13), weight: 700, color: fillC ? 'panel' : 'ink', halo: false, alpha: al });
            }
            if (hl) T.dot(x, y, { r: r + 4, hollow: true, color: 'gold', width: 2.6, alpha: al });
          }
          // the memo table (and, under the DAG, how often the naive tree calls each subproblem)
          if (st >= 2) {
            const yM = yB - 1.05, w = Math.min(XW / n * 0.3, 3.6), hh = 0.27;
            T.text('memo[k]', 0.5, yM, { size: 12, weight: 700, color: 'muted' });
            if (st === 3) T.text('naive calls', 0.5, yM - 0.62, { size: 11, weight: 600, color: 'red' });
            for (let k = 0; k <= n; k++) {
              const x = X0 + XW * k / n;
              T.rect(x - w, yM - hh, x + w, yM + hh, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 1.2, radius: 3 });
              T.text(String(fibN(k)), x, yM, { align: 'center', size: 12, weight: 700, halo: false });
              T.text(`k = ${k}`, x, yM + hh + 0.2, { align: 'center', size: 10, color: 'muted' });
              if (st === 3) T.text(`×${counts[k]}`, x, yM - 0.62, { align: 'center', size: 11, weight: 700, color: 'red' });
            }
          } else T.text(`no table: ${tr.length} calls, ${n + 1} distinct arguments`, 0.5, yB - 1.05, { size: 12, weight: 600, color: 'muted' });
          // chart
          P.fn((x) => 2 * Math.pow(PHI, x + 1) / Math.sqrt(5), { color: 'red', dash: [6, 4], width: 1.4, alpha: 0.7 });
          P.fn((x) => Math.max(1, 2 * x - 1), { color: 'green', dash: [6, 4], width: 1.2, alpha: 0.6, domain: [1, 30] });
          P.dots(C.map((c, k) => [k, c]), { color: 'red', r: 2.8 });
          P.dots(C.map((_, k) => [k, Mc(k)]), { color: 'green', r: 2.8 });
          P.vline(n, { color: 'gold', dash: [4, 3], width: 1.4 });
          P.dot(n, C[n], { r: 6, color: 'red' }); P.dot(n, Mc(n), { r: 6, color: 'green' });
          P.text(`naive ${big(C[n])}`, n, C[n], { dx: 9, dy: -8, size: 11.5, weight: 700, color: 'red' });
          P.text(`memoized ${Mc(n)}`, n, Mc(n), { dx: 9, dy: 10, size: 11.5, weight: 700, color: 'green' });
        });
        v.legend([['accent', 'computing call', { dot: true }], ['red', 'repeated call', { dot: true }], ['gold', 'memo lookup', { dot: true }], ['red', 'naive $C(n)=2F_{n+1}-1$ and $\\tfrac{2}{\\sqrt5}\\varphi^{n+1}$', { dash: true }], ['green', 'memoized $2n-1$', { dash: true }]]);
        v.readout(() => {
          let calls = 0; const naive = (k) => { calls++; return k < 2 ? k : naive(k - 1) + naive(k - 2); }; const val = naive(n), cn = calls;
          calls = 0; const memo = []; const mf = (k) => { calls++; if (k < 2) return k; if (memo[k] == null) memo[k] = mf(k - 1) + mf(k - 2); return memo[k]; }; mf(n);
          const head = `$F_{${n}} = ${val}$ · naive recursion: **${cn}** calls, ${cn - (n + 1)} of them repeats · memoized: **${calls}** calls, ${calls - (n + 1)} of them answered at once · $C(${n})/C(${n - 1}) = ${r2(C[n] / C[n - 1])}$, tending to $\\varphi \\approx 1.618$`;
          return head + (sel != null ? ` · Fib(${sel}) is called **${counts[sel]}** times by the naive tree, once with memoization` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 7.2
    {
      num: '7.2',
      kind: 'Method',
      name: 'Dynamic programming',
      statement: String.raw`**Dynamic programming** solves a problem by
(a) choosing a family of **subproblems**, indexed by a few parameters, that includes the original problem;
(b) writing a **recurrence** expressing each subproblem's answer through the answers of strictly *smaller* subproblems, with base cases;
(c) evaluating the recurrence **bottom-up**, filling a table in an order in which every entry is computed after all the entries it reads.

The subproblems and the “reads” relation form a directed acyclic graph, the **subproblem DAG**; a valid evaluation order is exactly a topological order of it. If there are $S$ subproblems and each is evaluated in time $t$ from its inputs, the algorithm runs in time $O(S\,t)$ and space $O(S)$ (often less, when only a few earlier rows must be kept). Memoized recursion (7.1) computes the same table top-down, discovering a valid order on its own.`,
      idea: String.raw`Correctness is induction along the evaluation order: when a cell is evaluated, every cell it reads already holds its correct value, and the recurrence turns correct inputs into a correct output. If the order breaks the DAG, some cell reads a cell that is still empty, and the error then propagates to everything downstream. Running time is pure bookkeeping — one evaluation per cell. For counting monotone lattice paths in a grid (comb-1.10), $P[i,j]=P[i-1,j]+P[i,j-1]$: rows, columns and anti-diagonals are all valid orders, but sweeping a row from right to left reads $P[i,j-1]$ too early.`,
      caption: String.raw`The table counts monotone paths from the top-left cell (blocked cells admit none). Pick an **evaluation order** and step through it: the gold cell is computed from the orange cells it reads; small grey numbers give the order. Faint arrows are the dependency DAG. Try **right to left**: every cell reads an empty left neighbour (red arrow) and the wrong values spread. In **click your own** mode, fill cells in any order you like; **shift-click** blocks or unblocks a cell, and the diagonal toggle adds a third dependency (Delannoy paths).`,
      deps: ['algo-7.1'],
      see: ['comb-1.10', 'ctrl-10.5', 'algo-9.5'],
      refs: ['CLRS 4e §14.3', 'Erickson Ch. 3'],
      credit: 'Richard Bellman, 1950s',
      tags: ['dynamic programming'],
      viz(v) {
        const R = 5, C = 7, blocked = new Set(['1,2', '3,4']);
        const ord = v.select('order', [{ value: 'rows', label: 'row by row' }, { value: 'cols', label: 'column by column' }, { value: 'diag', label: 'anti-diagonals' }, { value: 'rtl', label: 'right to left' }, { value: 'click', label: 'click your own' }], 'rows', { onChange: () => restart(true) });
        const diag = v.toggle('diagonal steps too', false, { onChange: () => restart(true) });
        const dagT = v.toggle('dependency arrows', true);
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330 });
        const T = v.table(s, { rows: R, cols: C, maxCell: 52, size: 15.5, rowLabels: (i) => `i = ${i}`, colLabels: (j) => `j = ${j}`, subColor: 'faint', subSize: 10 });
        let CV, cBad, cLast;
        const clearClick = () => { CV = Array.from({ length: R }, () => Array(C).fill(null)); cBad = []; cLast = null; };
        clearClick();
        const S = v.steps({ frames: () => gridFrames(ord.value === 'click' ? 'rows' : ord.value, R, C, blocked, diag.value), code: GRID_CODE, codeTitle: 'Count-Paths(R, C)', codePos: 'below', speed: 3, start: 17, still: 17 });
        const resetBtn = v.button('Clear table', () => clearClick());
        function restart(fromCtl) {
          const click = ord.value === 'click';
          S.el.hidden = click; if (S.noteEl) S.noteEl.hidden = click; if (S.codeEl) S.codeEl.hidden = click; resetBtn.hidden = !click;
          clearClick(); if (click) [[0, 0], [0, 1], [1, 0], [2, 1]].forEach(([i, j]) => clickCell(i, j)); S.reset({ at: fromCtl ? 'end' : 'keep' });
        }
        resetBtn.hidden = true;
        s.onClick((x, y, mod) => {
          const c = T.hit(x, y); if (!c || c.i < 0 || c.j < 0) return;
          if (mod.shift) { const k = c.i + ',' + c.j; if (blocked.has(k)) blocked.delete(k); else if (k !== '0,0') blocked.add(k); restart(true); return; }
          if (ord.value !== 'click' || CV[c.i][c.j] != null) return;
          clickCell(c.i, c.j);
        });
        function clickCell(i, j) { const r = gridStep(CV, i, j, blocked, diag.value); CV[i][j] = r.val; r.miss.forEach((d) => cBad.push([[i, j], d])); cLast = { cur: [i, j], ...r }; }
        let view = {};
        v.render(() => {
          const click = ord.value === 'click', f = S.frame, truth = gridTruth(R, C, blocked, diag.value);
          const V = click ? CV : f.V, cur = click ? cLast?.cur : f.cur, deps = click ? cLast?.deps || [] : f.deps || [], miss = click ? cLast?.miss || [] : f.miss || [], bad = click ? cBad : f.bad || [];
          const has = (L, i, j) => L.some(([a, b]) => a === i && b === j), isB = (i, j) => blocked.has(i + ',' + j);
          T.draw({
            value: (i, j) => (isB(i, j) ? '×' : V[i][j]),
            fill: (i, j) => (cur && cur[0] === i && cur[1] === j ? ['gold', 0.5] : has(miss, i, j) ? ['red', 0.3] : has(deps, i, j) ? ['orange', 0.3] : isB(i, j) ? ['muted', 0.35] : V[i][j] != null ? ['accent', 0.08] : null),
            textColor: (i, j) => (isB(i, j) ? 'muted' : V[i][j] != null && V[i][j] !== truth[i][j] ? 'red' : 'ink'),
            weight: (i, j) => (V[i][j] != null && V[i][j] !== truth[i][j] ? 800 : 600),
            sub: click ? null : (i, j) => f.rank?.[i + ',' + j],
            highlight: cur ? [cur] : [],
          });
          if (dagT.value) for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
            if (isB(i, j) || (!i && !j)) continue;
            for (const [a, b] of gridDeps(i, j, diag.value)) T.pointer(i, j, [a - i, b - j], { color: 'faint', width: 1.2, head: 4.5, from: 0.62, to: 0.98 });
          }
          bad.forEach(([a, b]) => { const now = cur && a[0] === cur[0] && a[1] === cur[1]; T.arrow(a, b, { color: 'red', width: now ? 2.8 : 1.6, alpha: now ? 1 : 0.55, trim: 0.5 }); });
          if (cur) deps.filter((d) => !has(miss, d[0], d[1])).forEach((d) => T.arrow(cur, d, { color: 'orange', width: 2.2, trim: 0.5 }));
          const filled = V.flat().filter((x) => x != null).length;
          view = { click, filled, bad: bad.length, got: V[R - 1][C - 1], want: truth[R - 1][C - 1], done: click ? filled === R * C : !!f.done };
        });
        v.legend([['gold', 'being computed', { area: true }], ['orange', 'cells it reads', { area: true }], ['red', 'read before it was computed', { area: true }], ['faint', 'dependency DAG']]);
        v.readout(() => {
          const { click, filled, bad, got, want, done } = view, tot = R * C;
          const tail = done ? (bad === 0 ? ` · corner $= ${got}$ ✓ (the true count is ${want})` : ` · corner $= ${got}$ but the true count is ${want} ✗`) : '';
          if (click) return filled ? `You have filled ${filled} of ${tot} cells · reads of an empty cell: **${bad}**${tail}${!bad && !done ? ' · so far a valid (topological) order' : ''}` : 'Click the cells in any order to compute them. A cell whose inputs are not ready yet gets a red arrow.';
          return `Order **${ord.value === 'rtl' ? 'right to left' : ord.value === 'cols' ? 'column by column' : ord.value === 'diag' ? 'anti-diagonals' : 'row by row'}** · ${filled} of ${tot} cells computed · reads of an empty cell: **${bad}**${tail}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.3
    {
      num: '7.3',
      kind: 'Concept',
      name: 'Optimal substructure',
      statement: String.raw`An optimization problem has **optimal substructure** if every optimal solution is assembled from *optimal* solutions to subproblems of the same kind. Example: if $P$ is a cheapest path from $s$ to $t$ (positive costs) and $m$ lies on $P$, then the part of $P$ from $s$ to $m$ is a cheapest $s\to m$ path and the part from $m$ to $t$ is a cheapest $m\to t$ path. Optimal substructure, together with a polynomial number of distinct subproblems, is what makes a dynamic program possible.

It can fail. For the **longest (most valuable) simple path**, the piece of an optimal $s\to t$ path between $s$ and $m$ need not be an optimal simple $s\to m$ path, and gluing optimal simple $s\to m$ and $m\to t$ paths may revisit vertices: the subproblems are not independent, because they compete for the same vertices.`,
      idea: String.raw`*Cut and paste.* If the $s\to m$ piece of an optimal path $P$ were not cheapest, replace it by a cheaper $s\to m$ path; the result is an $s\to t$ walk cheaper than $P$, and with positive costs any repeated vertex could be cut out, making it cheaper still — contradicting optimality. The argument needs the pasted pieces to combine freely. For simple paths of maximum value they do not: a better $s\to m$ piece may use vertices that the $m\to t$ piece needs, so pasting produces a non-simple walk and the contradiction evaporates. (Longest simple path is NP-hard, and no polynomial dynamic program for it is known.)`,
      caption: String.raw`Numbers are cell costs; a path moves between neighbouring cells and costs the sum of its cells. Green: the best $s\to t$ path. **Click any cell** to make it the midpoint $m$: blue is the best $s\to m$ path, orange the best $m\to t$ path, each computed on its own. For the cheapest path they reproduce the pieces of the green path whenever $m$ is on it. Switch to the **most valuable simple path**: now the independent halves usually share cells (red, marked 2×) and the green path's pieces are not best for their own endpoints. **Shuffle** for new costs.`,
      deps: ['algo-7.2'],
      see: ['ctrl-10.5', 'algo-9.5', 'toc-13.9'],
      refs: ['CLRS 4e §14.3'],
      tags: ['dynamic programming'],
      viz(v) {
        const R = 4, C = 6, N = R * C, nb = gridNb(R, C), S0 = 0, T0 = N - 1;
        let seed = 5, cost = gridCosts(R, C, v.rng(seed)), m = null, cache = new Map();
        const mode = v.select('', [{ value: 'min', label: 'cheapest path' }, { value: 'max', label: 'most valuable simple path' }], 'min', { onChange: () => { m = null; } });
        v.button('Shuffle costs', () => { seed++; cost = gridCosts(R, C, v.rng(seed)); cache = new Map(); m = null; });
        const s = v.stage({ x: [-0.3, C + 0.3], y: [-R - 0.3, 0.3], axes: false, equal: true, height: 330 });
        const best = (a, b) => {
          const k = `${mode.value}|${a}|${b}`; if (!cache.has(k)) cache.set(k, mode.value === 'min' ? cheapest(nb, cost, a, b) : richest(nb, cost, a, b));
          return cache.get(k);
        };
        s.onClick((x, y) => { const j = Math.floor(x), i = Math.floor(-y); if (i >= 0 && i < R && j >= 0 && j < C) m = i * C + j; });
        const ctr = (k) => [(k % C) + 0.5, -Math.floor(k / C) - 0.5];
        const offPath = (path, d) => path.map((k) => { const [x, y] = ctr(k); return [x + d / s.sx, y + d / s.sy]; });
        let info = {};
        v.render(() => {
          const opt = best(S0, T0);
          if (m == null) m = opt.path[Math.floor(opt.path.length / 2)];
          const A = best(S0, m), B = best(m, T0), onP = opt.path.indexOf(m);
          const setA = new Set(A.path), overlap = B.path.filter((k) => k !== m && setA.has(k));
          for (let k = 0; k < N; k++) {
            const i = Math.floor(k / C), j = k % C;
            s.rect(j + 0.04, -i - 0.96, j + 0.96, -i - 0.04, { fill: 'orange', fillAlpha: 0.05 + 0.3 * (cost[k] - 1) / 8, color: 'faint', width: 1, radius: 4 });
            if (overlap.includes(k)) { s.rect(j + 0.07, -i - 0.93, j + 0.93, -i - 0.07, { color: 'red', width: 2, radius: 4, dash: [5, 3] }); s.text('2×', j + 0.86, -i - 0.8, { align: 'right', size: 11, weight: 800, color: 'red' }); }
          }
          s.path(opt.path.map(ctr), { color: 'green', width: 12, alpha: 0.34 });
          s.path(offPath(A.path, -4), { color: 'blue', width: 2.8 });
          s.path(offPath(B.path, 4), { color: 'orange', width: 2.8 });
          for (let k = 0; k < N; k++) { const [x, y] = ctr(k); s.dot(x, y, { r: 13, color: 'panel', ring: false }); s.dot(x, y, { r: 13, hollow: true, color: 'faint', width: 1 }); s.text(String(cost[k]), x, y, { align: 'center', size: 16, weight: 700, color: 'ink', halo: false }); }
          const lab = (k, t, col) => { const [x, y] = ctr(k); s.text(t, x - 0.36, y + 0.3, { align: 'center', size: 13, weight: 800, color: col }); };
          lab(S0, 's', 'ink'); lab(T0, 't', 'ink');
          const [mx, my] = ctr(m); s.rect(mx - 0.47, my - 0.47, mx + 0.47, my + 0.47, { color: 'gold', width: 3.5, radius: 5 }); s.text('m', mx + 0.34, my + 0.3, { align: 'center', size: 13, weight: 800, color: 'gold' });
          const pieceA = onP >= 0 ? opt.path.slice(0, onP + 1).reduce((t, k) => t + cost[k], 0) : null, pieceB = onP >= 0 ? opt.path.slice(onP).reduce((t, k) => t + cost[k], 0) : null;
          info = { opt, A, B, onP, overlap, pieceA, pieceB };
        });
        v.legend([['green', 'best $s\\to t$ path'], ['blue', 'best $s\\to m$ path'], ['orange', 'best $m\\to t$ path'], ['red', '2× = cell used by both halves', { dash: true }]]);
        v.readout(() => {
          const { opt, A, B, onP, overlap, pieceA, pieceB } = info, cm = cost[m];
          if (mode.value === 'min') {
            if (onP >= 0) return `$m$ is on the cheapest $s\\to t$ path (cost **${opt.val}**). Its pieces cost ${pieceA} and ${pieceB} (both counting $m$); the cheapest $s\\to m$ and $m\\to t$ paths, found independently, cost **${A.val}** and **${B.val}** ✓ — every piece of an optimal path is optimal, and $${A.val} + ${B.val} - ${cm} = ${opt.val}$.`;
            return `$m$ is off the cheapest path: the cheapest path through $m$ costs $${A.val} + ${B.val} - ${cm} = ${A.val + B.val - cm} > ${opt.val}$. Its two halves are still each optimal for their own endpoints.`;
          }
          const glue = overlap.length ? `gluing the best $s\\to m$ and $m\\to t$ paths revisits **${overlap.length}** ${overlap.length === 1 ? 'cell' : 'cells'}: not a simple path ✗` : 'here the two best halves happen to fit together';
          if (onP >= 0) return `The most valuable simple $s\\to t$ path is worth **${opt.val}**. Its $s\\to m$ piece is worth ${pieceA}, but the best simple $s\\to m$ path is worth **${A.val}**${A.val > pieceA ? ' ✗' : ''}; its $m\\to t$ piece ${pieceB} vs best **${B.val}**${B.val > pieceB ? ' ✗' : ''}; ${glue}.`;
          return `$m$ is off the best path (worth **${opt.val}**). Best simple $s\\to m$: ${A.val}, best simple $m\\to t$: ${B.val}; ${glue}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.4
    {
      num: '7.4',
      kind: 'Algorithm',
      name: 'Rod cutting',
      statement: String.raw`**Problem.** A rod of integer length $n$ can be cut into pieces of integer lengths; a piece of length $i$ sells for $p_i$. Find the maximum revenue $r_n$ over all ways of cutting (including no cut).

**Recurrence.** $r_0=0$ and, for $j\ge 1$,
$$r_j=\max_{1\le i\le j}\big(p_i+r_{j-i}\big),$$
where $i$ is the length of the first piece. Computing $r_1,\dots,r_n$ in increasing order, and recording the maximizing $s_j=i$, takes $\Theta(n^2)$ time and $\Theta(n)$ space; the optimal cuts are read back as $s_n,\ s_{n-s_n},\dots$. The naive recursion examines all $2^{n-1}$ ways of cutting.`,
      idea: String.raw`Optimal substructure (7.3): in an optimal cutting of a rod of length $j$ with first piece $i$, the remaining pieces must form an optimal cutting of length $j-i$, otherwise swapping in a better one would raise the revenue. So $r_j$ is the best over the $j$ choices of first piece, and each choice needs only a shorter, already computed value. There are $n+1$ subproblems and subproblem $j$ looks at $j$ candidates, so the work is $\sum j=n(n+1)/2$. Greedy rules fail: always cutting the piece with the best price per unit length gives $p_3+p_1=9<10=p_2+p_2$ for $n=4$ with the classic prices.`,
      caption: String.raw`**Click a price** $p_i$ to raise it (shift-click lowers it) and choose the rod length $n$. Step through: for each length $j$ the row $p_i+r_{j-i}$ lists every first piece, the best one (green) becomes $r_j$ and $s_j$, and the rod below shows that first piece (gold) followed by the best cutting of the rest. The trace-back colours the optimal pieces; the readout compares the greedy price-per-length rule.`,
      deps: ['algo-7.3'],
      refs: ['CLRS 4e §14.1'],
      tags: ['dynamic programming'],
      viz(v) {
        const p = [0, 1, 5, 8, 9, 10, 17, 17, 20, 24, 30];
        const nS = v.slider('rod length $n$', 1, 10, 8, { int: true, onChange: () => S.reset({ at: 'end' }) });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, full: true });
        const rod = v.stage({ x: [-0.4, 10.4], y: [-1, 1.4], axes: false, height: 120, full: true });
        const T = v.table(s, { rows: 4, cols: 11, square: false, maxCell: 44, cellAspect: 1.25, size: 15, rowLabels: ['$\\text{price } p_i$', '$p_i + r_{j-i}$', '$\\text{revenue } r_j$', '$\\text{first cut } s_j$'], cornerLabel: 'length' });
        const S = v.steps({ frames: () => rodFrames(p, nS.value), code: ROD_CODE, codeTitle: 'Cut-Rod(p, n)', codePos: 'below', speed: 1.4, start: 7, still: 7 });
        s.onClick((x, y, mod) => { const c = T.hit(x, y); if (c && c.i === 0 && c.j >= 1 && c.j <= nS.value) { p[c.j] = clamp(p[c.j] + (mod.shift ? -1 : 1), 0, 40); S.reset({ at: 'keep' }); } });
        v.render(() => {
          const f = S.frame, n = nS.value, j = f.j ?? 0, r = f.r, sArr = f.s, tr = f.trace;
          const trSet = new Set(); if (tr) { let L = n; tr.forEach((k) => { trSet.add(L); L -= k; }); }
          T.draw({
            cols: n + 1, colLabels: (k) => String(k),
            value: (i, k) => (i === 0 ? (k ? p[k] : null) : i === 1 ? (f.cand && k >= 1 && k <= j ? f.cand[k] : null) : i === 2 ? (k <= f.upto ? r[k] : null) : (k >= 1 && k <= f.upto ? sArr[k] : null)),
            fill: (i, k) => (i === 1 && f.cand && k === f.bi ? ['green', 0.4] : i === 1 && f.cand && k >= 1 && k <= j ? ['orange', 0.12] : i === 2 && k === j && f.cand ? ['gold', 0.45] : i === 2 && f.cand && k < j ? ['accent', 0.06] : (i === 2 || i === 3) && trSet.has(k) ? ['green', 0.25] : i === 0 && k >= 1 ? ['blue', 0.07] : null),
            textColor: (i, k) => (i === 0 ? 'blue' : null), weight: (i, k) => (i === 2 ? 700 : 500),
            highlight: f.cand ? [[2, j], [1, f.bi, 'green']] : f.from != null ? [[2, f.from, 'green']] : [],
            activeCol: f.cand ? j : undefined,
          });
          if (f.cand) {
            // r_j ← p_i + r_{j−i}: arrows from the chosen candidate to the price it used and the revenue it used
            T.arrow([1, f.bi], [0, f.bi], { color: 'green', width: 1.8, trim: 0.45 });
            if (j - f.bi >= 0) { const [ax, ay] = T.cellCenter(2, j), [bx] = T.cellCenter(2, j - f.bi), hh = (T.cellRect(2, j)[3] - T.cellRect(2, j)[1]); arcArrow(s, ax, ay - hh * 0.32, bx, ay - hh * 0.32, 12, { color: 'green', width: 2, headSize: 7 }); }
          }
          // the rod
          rod.setView([-0.35, Math.max(n, 4) + 0.35], [-0.95, 1.25]);
          const piece = (x0, len, col, txt, o = {}) => {
            rod.rect(x0 + 0.03, 0, x0 + len - 0.03, 0.62, { fill: col, fillAlpha: o.alpha ?? 0.35, color: col, width: o.width ?? 1.6, radius: 4, dash: o.dash });
            if (txt) rod.text(txt, x0 + len / 2, 0.31, { align: 'center', size: 12.5, weight: 700, color: 'ink', halo: false });
          };
          for (let k = 0; k < n; k++) rod.line(k, -0.12, k, -0.02, { color: 'faint', width: 1 });
          rod.text('0', 0, -0.32, { align: 'center', size: 10.5, color: 'muted' }); rod.text(String(n), n, -0.32, { align: 'center', size: 10.5, color: 'muted' });
          if (tr) {
            let x = 0; tr.forEach((k, t) => { piece(x, k, PIECE[t % PIECE.length], `${k} → ${p[k]}`); x += k; });
            if (x < n) piece(x, n - x, 'faint', '', { alpha: 0.05, dash: [4, 3], width: 1 });
            rod.text(`revenue so far ${tr.reduce((t, k) => t + p[k], 0)}${f.tj === 0 ? ` = r${n}` : ''}`, 0, 1.0, { size: 12.5, weight: 700, color: 'green' });
          } else if (f.cand) {
            piece(0, f.bi, 'gold', `${f.bi} → ${p[f.bi]}`, { alpha: 0.5 });
            let x = f.bi; rodPieces(sArr, j - f.bi).forEach((k) => { piece(x, k, 'green', `${k} → ${p[k]}`, { alpha: 0.18, width: 1.2 }); x += k; });
            if (j < n) piece(j, n - j, 'faint', '', { alpha: 0.04, dash: [4, 3], width: 1 });
            rod.text(`length ${j}: first piece ${f.bi} (gold) + best cutting of ${j - f.bi} (from $r_{${j - f.bi}}$) = ${r[j]}   ·   pieces are labelled length → price`, 0, 1.0, { size: 12.5, weight: 600, color: 'ink' });
          } else { piece(0, n, 'faint', '', { alpha: 0.05, dash: [4, 3], width: 1 }); rod.text('rod of length ' + n, 0, 1.0, { size: 12.5, color: 'muted' }); }
        });
        v.legend([['blue', 'prices (click to edit)', { area: true }], ['green', 'best first piece / optimal pieces', { area: true }], ['gold', 'value being computed', { area: true }]]);
        v.readout(() => {
          const n = nS.value, { r, s: sA } = rodSolve(p, n), pcs = rodPieces(sA, n);
          let g = 0, left = n; const gp = []; // greedy by price per unit length
          while (left > 0) { let bi = 1; for (let i = 1; i <= left; i++) if (p[i] / i > p[bi] / bi) bi = i; gp.push(bi); g += p[bi]; left -= bi; }
          return `Best revenue $r_{${n}} = ${r[n]}$ from pieces ${pcs.join(' + ')} · no cut: $p_{${n}} = ${p[n]}$ · greedy by price per unit length (${gp.join(' + ')}): **${g}** ${g === r[n] ? '✓ (lucky here)' : '✗'} · the naive recursion tries $2^{${n - 1}} = ${2 ** (n - 1)}$ cuttings, the table checks $${n}\\cdot ${n + 1}/2 = ${n * (n + 1) / 2}$ candidates`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.5
    {
      num: '7.5',
      kind: 'Algorithm',
      name: 'Weighted interval scheduling',
      statement: String.raw`**Problem.** Given $n$ intervals $[s_j,f_j)$ with weights $w_j>0$, choose pairwise disjoint intervals of maximum total weight.

**Algorithm.** Sort by finishing time, $f_1\le\dots\le f_n$, and let $p(j)$ be the largest $i<j$ with $f_i\le s_j$ (or $0$): the last interval compatible with $j$ that finishes before it. Then $\mathrm{OPT}(0)=0$ and
$$\mathrm{OPT}(j)=\max\big(w_j+\mathrm{OPT}(p(j)),\ \mathrm{OPT}(j-1)\big),$$
the two cases being “$j$ is in an optimal solution of the first $j$ intervals” and “it is not”. Sorting and computing every $p(j)$ by binary search take $O(n\log n)$; the table takes $O(n)$; tracing back which case won recovers an optimal set.`,
      idea: String.raw`Look at interval $j$, the one finishing last among the first $j$. If an optimal solution uses it, nothing overlapping $j$ can be used, and the intervals compatible with it are exactly $1,\dots,p(j)$ — a prefix, because of the sorting — so the rest is an optimal solution of that prefix. If it does not use $j$, it is an optimal solution of the first $j-1$. So two smaller prefixes suffice (optimal substructure, 7.3), $p(j)$ is found by binary search (1.5) over the sorted finishing times, and the naive two-way recursion, which takes exponential time, becomes linear once memoized. Greedy rules that work for unit weights (earliest finish, 10.4) fail as soon as weights differ.`,
      caption: String.raw`Rows are the intervals sorted by finishing time. Step through $j=1,\dots,n$: the dashed line at $s_j$ separates the compatible intervals, the hook points to $p(j)$, and $\mathrm{OPT}(j)$ compares *take* ($w_j+\mathrm{OPT}(p(j))$) with *skip* ($\mathrm{OPT}(j-1)$). The trace-back turns the chosen intervals green. **Drag an interval** sideways to move it, **click** it to raise its weight (shift-click lowers it).`,
      deps: ['algo-7.3', 'algo-1.5'],
      see: ['algo-10.4'],
      refs: ['KT §6.1'],
      tags: ['dynamic programming', 'scheduling'],
      viz(v) {
        const iv = [[0, 3, 3], [1, 4.5, 7], [3.5, 6, 1], [2, 7.5, 8], [6, 8.5, 4], [5, 10, 3], [8, 11, 6], [9.5, 12, 5]].map(([s, f, w]) => ({ s, f, w }));
        const s = v.stage({ x: [-1.6, 17.2], y: [-9, 1.4], axes: false, height: 360 });
        const frames = () => {
          const R = wisSolve(iv), F = [], { n, p, opt, take, A } = R;
          F.push({ R, j: 0, upto: 0, line: [1, 2, 3], note: `${n} intervals sorted by finishing time; $p(j)$ is found by binary search over the finishing times. $\\mathrm{OPT}(0) = 0$.` });
          for (let j = 1; j <= n; j++) {
            const a = A[j - 1].w + opt[p[j]], b = opt[j - 1];
            F.push({ R, j, upto: j, line: [4, 5], note: `$j = ${j}$: $p(${j}) = ${p[j]}$. Take it: $w_{${j}} + \\mathrm{OPT}(${p[j]}) = ${A[j - 1].w} + ${opt[p[j]]} = ${a}$; skip it: $\\mathrm{OPT}(${j - 1}) = ${b}$. So $\\mathrm{OPT}(${j}) = ${opt[j]}$ (${take[j] ? 'take' : 'skip'}).` });
          }
          const ch = []; let j = n;
          while (j > 0) {
            const was = j;
            if (take[j]) { ch.push(j); j = p[j]; } else j--;
            F.push({ R, j: was, upto: n, trace: ch.slice(), to: j, line: 6, hold: 0.9, note: take[was] ? `At ${was}: taking it won, so interval ${was} is chosen and we jump to $p(${was}) = ${j}$.` : `At ${was}: skipping won, step to ${j}.` });
          }
          F[F.length - 1].note += ` Chosen: ${ch.slice().reverse().join(', ')} with total weight **${opt[n]}**.`;
          return F;
        };
        const S = v.steps({ frames, code: WIS_CODE, codeTitle: 'Weighted-Interval-Scheduling', codePos: 'below', speed: 1.2, start: 6, still: 6 });
        let drag = null, lastRows = null;
        const rowOf = (y) => Math.round(-y);
        s.onDrag((x, y, ph) => {
          if (ph === 'start') { const R = lastRows; if (!R) return; const j = rowOf(y); if (j >= 1 && j <= R.n) { const it = R.A[j - 1]; if (x >= it.s - 0.3 && x <= it.f + 0.3) drag = { id: it.id, x0: x, s0: iv[it.id].s, f0: iv[it.id].f, moved: false }; } }
          else if (ph === 'move' && drag) {
            const it = iv[drag.id], len = drag.f0 - drag.s0; let ns = Math.round((drag.s0 + x - drag.x0) * 2) / 2; ns = clamp(ns, 0, 12 - len);
            if (ns !== it.s) { it.s = ns; it.f = ns + len; drag.moved = true; S.reset({ at: 'end' }); }
          } else if (ph === 'end') drag = null;
        });
        s.onClick((x, y, mod) => {
          const R = lastRows; if (!R) return; const j = rowOf(y); if (j < 1 || j > R.n) return; const it = R.A[j - 1];
          if (x >= it.s - 0.2 && x <= it.f + 0.2) { iv[it.id].w = clamp(iv[it.id].w + (mod.shift ? -1 : 1), 1, 12); S.reset({ at: 'end' }); }
        });
        v.render(() => {
          const f = S.frame, R = f.R, { n, A, p, opt, take } = R; lastRows = R;
          s.setView([-1.7, 17.3], [-n - 0.75, 1.35]);
          const chosen = new Set(f.trace || []), j = f.j, cur = f.trace ? null : j;
          // time axis
          for (let t = 0; t <= 12; t += 2) { s.line(t, 0.55, t, 0.65, { color: 'muted', width: 1 }); s.text(String(t), t, 0.95, { align: 'center', size: 10.5, color: 'muted' }); }
          s.line(0, 0.6, 12, 0.6, { color: 'muted', width: 1 });
          s.text('j', -1.1, 0.95, { align: 'center', size: 11, weight: 700, color: 'muted' });
          s.text('OPT(j)', 13.9, 0.95, { align: 'center', size: 11.5, weight: 700, color: 'muted' });
          if (cur) {
            const sj = A[cur - 1].s;
            s.rect(0, -n - 0.5, sj, 0.35, { fill: 'green', fillAlpha: 0.05, stroke: false });
            s.line(sj, 0.4, sj, -n - 0.5, { color: 'green', dash: [5, 4], width: 1.4 });
          }
          if (cur) { // hook from s_j up to the end of interval p(j), drawn under the bars
            const it = A[cur - 1], pj = p[cur], yj = -cur, yp = -pj, xe = pj ? A[pj - 1].f : 0;
            s.path([[it.s, yj + 0.27], [it.s, yp], [xe + 0.12, yp]], { color: 'purple', width: 2.2 });
            s.arrow(xe + 0.5, yp, xe + 0.02, yp, { color: 'purple', width: 2.2, head: 8 });
            s.text(`p(${cur}) = ${pj}`, it.s, yp, { dx: 8, size: 12, weight: 700, color: 'purple', plate: true });
          }
          for (let k = 1; k <= n; k++) {
            const it = A[k - 1], y = -k, isC = chosen.has(k), active = k === cur, compat = cur && k < cur && it.f <= A[cur - 1].s;
            const col = isC ? 'green' : active ? 'gold' : compat ? 'teal' : k <= f.upto ? 'accent' : 'muted';
            s.rect(it.s, y - 0.27, it.f, y + 0.27, { fill: col, fillAlpha: isC || active ? 0.55 : 0.22, color: col, width: active || isC ? 2.2 : 1.3, radius: 4 });
            s.text(`w = ${it.w}`, (it.s + it.f) / 2, y, { align: 'center', size: 12, weight: 700, color: 'ink', halo: false });
            s.text(String(k), -1.1, y, { align: 'center', size: 12.5, weight: 700, color: active ? 'gold' : 'muted' });
            // OPT column
            const shown = k <= f.upto;
            s.rect(13.25, y - 0.3, 14.55, y + 0.3, { fill: active ? 'gold' : isC ? 'green' : 'accent', fillAlpha: active ? 0.4 : isC ? 0.3 : shown ? 0.1 : 0.03, color: active ? 'gold' : 'faint', width: active ? 2 : 1, radius: 3 });
            if (shown) s.text(String(opt[k]), 13.9, y, { align: 'center', size: 13, weight: 700, color: 'ink', halo: false });
          }
          s.rect(13.25, -0.3, 14.55, 0.3, { fill: 'accent', fillAlpha: 0.1, color: 'faint', width: 1, radius: 3 }); s.text('0', 13.9, 0, { align: 'center', size: 13, weight: 700, halo: false });
          s.text('0', -1.1, 0, { align: 'center', size: 12.5, weight: 700, color: 'muted' });
          if (cur) {
            const pj = p[cur], yj = -cur, yp = -pj;
            // take / skip arrows in the OPT column
            const bT = Math.min(18 + 7 * (cur - pj), 60);
            const mid = arcArrow(s, 14.6, yj + 0.05, 14.6, yp - 0.05, -bT, { color: take[cur] ? 'green' : 'faint', width: take[cur] ? 2.4 : 1.5, headSize: 7 });
            arcArrow(s, 13.2, yj + 0.1, 13.2, -(cur - 1) - 0.1, 14, { color: take[cur] ? 'faint' : 'orange', width: take[cur] ? 1.5 : 2.4, headSize: 7 });
            s.text('take', mid[0], mid[1], { dx: 6, size: 11, weight: 700, color: take[cur] ? 'green' : 'muted' });
            s.text('skip', 13.2, yj + 0.5, { dx: -16, align: 'right', size: 11, weight: 700, color: take[cur] ? 'muted' : 'orange' });
          }
          if (f.trace && f.to != null) arcArrow(s, 14.6, -f.j, 14.6, -f.to, -Math.min(18 + 7 * (f.j - f.to), 60), { color: 'green', width: 2.4, headSize: 7 });
        });
        v.legend([['gold', 'interval j', { area: true }], ['teal', 'compatible with j (rows ≤ p(j))', { area: true }], ['purple', 'p(j): last compatible interval'], ['green', 'chosen set', { area: true }]]);
        v.readout(() => {
          const R = wisSolve(iv), ef = [], hv = []; let last = -Infinity;
          R.A.forEach((it) => { if (it.s >= last) { ef.push(it); last = it.f; } });
          [...R.A].sort((a, b) => b.w - a.w).forEach((it) => { if (hv.every((h) => it.f <= h.s || h.f <= it.s)) hv.push(it); });
          const W = (L) => L.reduce((t, it) => t + it.w, 0), o = R.opt[R.n];
          return `$\\mathrm{OPT}(${R.n}) = ${o}$ with intervals ${R.chosen.join(', ')} · greedy by earliest finish: ${W(ef)} ${W(ef) < o ? '✗' : '✓'} · greedy by heaviest first: ${W(hv)} ${W(hv) < o ? '✗' : '✓'} · ${R.n} binary searches for $p(j)$ + ${R.n} table entries`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.6
    {
      num: '7.6',
      kind: 'Algorithm',
      name: 'Longest increasing subsequence',
      statement: String.raw`**Problem.** Given a sequence $a_1,\dots,a_n$, find a longest strictly increasing subsequence $a_{i_1}<a_{i_2}<\dots<a_{i_k}$ with $i_1<\dots<i_k$.

**$O(n^2)$ dynamic program.** Let $L_i$ be the length of the longest increasing subsequence *ending at* $a_i$. Then
$$L_i = 1+\max\{L_j : j<i,\ a_j<a_i\}\qquad(\max\varnothing=0),$$
the answer is $\max_i L_i$, and predecessor pointers recover a subsequence.

**$O(n\log n)$ by patience sorting.** Deal the elements left to right onto piles, putting each $a_i$ on the leftmost pile whose top is $\ge a_i$ (found by binary search) or on a new pile at the right. The number of piles equals the length of a longest increasing subsequence, and back-pointers from each card to the top of the previous pile reconstruct one.`,
      idea: String.raw`The subproblem “longest run ending exactly at $i$” is the right one: a run ending at $a_i$ is a run ending at some smaller earlier $a_j$, extended by $a_i$ — optimal substructure (7.3) — and the DAG of subproblems has an edge $j\to i$ whenever $j<i$ and $a_j<a_i$, so the answer is a longest path in it. For patience sorting, pile tops increase from left to right (an invariant kept by the binary search, 1.5), and the card placed on pile $k$ always has a smaller card on pile $k-1$ before it, so $k$ piles give a run of length $k$; conversely, the elements of any increasing run must lie on different piles, since a pile is decreasing from bottom to top. So the two numbers agree.`,
      caption: String.raw`Bars are the sequence. Step through: each element shows $L_i$ in its badge, the orange bars are the earlier smaller elements it may extend, and the arrow points to its best predecessor. Below, the same element is dealt onto the patience piles (outlined tops were probed by the binary search). At the end both methods agree on the length. **Drag a bar** up or down to change its value, or **shuffle**.`,
      deps: ['algo-7.2', 'algo-1.5'],
      see: ['comb-1.3', 'comb-7.5', 'prob-6.5.2'],
      refs: ['Erickson Ch. 3'],
      credit: 'Patience sorting: C. L. Mallows, 1960s',
      tags: ['dynamic programming', 'sequences'],
      viz(v) {
        let a = [3, 9, 4, 12, 6, 2, 8, 10, 5, 11, 7, 13], rng = v.rng(17);
        const nS = v.slider('$n$', 6, 16, 12, { int: true, onChange: () => { shuffle(); } });
        function shuffle() { const pool = rng.shuffle(Array.from({ length: 15 }, (_, k) => k + 1)); a = pool.slice(0, nS.value); S.reset({ at: 'end' }); }
        v.button('Shuffle', () => shuffle());
        const A = v.stage({ x: [-0.7, 11.7], y: [-1.6, 21.5], axes: false, height: 260, full: true });
        const B = v.stage({ x: [-0.6, 8], y: [-1, 3], axes: false, height: 170, full: true, title: 'patience piles: each new card goes on the leftmost pile whose top card is at least as large' });
        let run;
        const S = v.steps({ frames: () => (run = lisFrames(a)).F, code: LIS_CODE, codeTitle: 'LIS, two ways', codePos: 'below', speed: 1.2, start: 7, still: 7 });
        let drag = null;
        A.onDrag((x, y, ph) => {
          if (ph === 'start') { const i = Math.round(x); drag = i >= 0 && i < a.length ? i : null; }
          else if (ph === 'move' && drag != null) { const nv = clamp(Math.round(y), 1, 15); if (nv !== a[drag]) { a[drag] = nv; S.reset({ at: 'end' }); } }
          else if (ph === 'end') drag = null;
        });
        v.render(() => {
          const f = S.frame, n = a.length, i = f.i, done = f.done;
          A.setView([-0.7, n - 0.3], [-1.7, Math.max(...a) + 5.2]);
          const cand = new Set(f.cands || []), dpSet = new Set(f.dpSeq || []);
          A.line(-0.5, 0, n - 0.5, 0, { color: 'muted', width: 1 });
          for (let k = 0; k < n; k++) {
            const shown = k <= i, cur = k === i && !done, inS = done && dpSet.has(k);
            const col = inS ? 'green' : cur ? 'gold' : cand.has(k) && !done ? 'orange' : shown ? 'accent' : 'muted';
            A.rect(k - 0.34, 0, k + 0.34, a[k], { fill: col, fillAlpha: inS || cur ? 0.6 : shown ? 0.3 : 0.1, color: col, width: cur || inS ? 2 : 1.1, radius: 3 });
            A.text(String(a[k]), k, -0.8, { align: 'center', size: 12, weight: 700, color: shown ? 'ink' : 'muted' });
            if (shown) {
              A.dot(k, a[k] + 1.25, { r: 10, color: inS ? 'green' : cur ? 'gold' : 'accent', alpha: inS || cur ? 1 : 0.85 });
              A.text(String(f.L[k]), k, a[k] + 1.25, { align: 'center', size: 11.5, weight: 800, color: 'panel', halo: false });
            }
          }
          const drawPred = (k, col, w) => { const j = f.pred[k]; if (j < 0) return; arcArrow(A, k - 0.12, a[k] + 2.05, j + 0.12, a[j] + 2.05, -Math.min(14 + 5 * (k - j), 38), { color: col, width: w, headSize: 7 }); };
          if (done) for (const k of f.dpSeq) drawPred(k, 'green', 2.4);
          else { for (let k = 0; k < i; k++) drawPred(k, 'faint', 1.2); drawPred(i, 'gold', 2.6); }
          // piles
          const piles = f.piles, depth = Math.max(...piles.map((p) => p.length)), pSet = new Set(f.pSeq || []);
          B.setView([-0.6, Math.max(piles.length, 6) - 0.4], [-0.75, Math.max(depth, 3) * 0.62 + 0.05]);
          piles.forEach((pl, k) => {
            B.text(`pile ${k + 1}`, k, -0.52, { align: 'center', size: 10.5, color: 'muted', weight: 600 });
            pl.forEach((idx, t) => {
              const y = t * 0.62, top = t === pl.length - 1, now = idx === i && !done, inS = done && pSet.has(idx);
              const col = inS ? 'green' : now ? 'gold' : top ? 'accent' : 'muted';
              B.rect(k - 0.36, y - 0.27, k + 0.36, y + 0.27, { fill: col, fillAlpha: now || inS ? 0.55 : top ? 0.22 : 0.08, color: col, width: now || inS ? 2.2 : 1.2, radius: 4 });
              B.text(String(a[idx]), k, y, { align: 'center', size: 13, weight: 700, color: top || now || inS ? 'ink' : 'muted', halo: false });
            });
          });
          if (!done && f.probes) f.probes.forEach((k) => { const pl = piles[k]; if (!pl || k === f.pile) return; const t = pl.length - 1; B.rect(k - 0.42, t * 0.62 - 0.33, k + 0.42, t * 0.62 + 0.33, { color: 'orange', width: 1.8, dash: [3, 3], radius: 5 }); });
          const bp = run.back;
          const link = (idx, col, w) => { const b = bp[idx]; if (b == null || b < 0) return; const pos = (q) => { for (let k = 0; k < piles.length; k++) { const t = piles[k].indexOf(q); if (t >= 0) return [k, t * 0.62]; } return null; }; const P1 = pos(idx), P2 = pos(b); if (P1 && P2) B.arrow(P1[0] - 0.36, P1[1], P2[0] + 0.38, P2[1], { color: col, width: w, head: 7 }); };
          if (done) f.pSeq.forEach((idx) => link(idx, 'green', 2.2)); else link(i, 'gold', 2.2);
        });
        v.legend([['gold', 'element being processed', { area: true }], ['orange', 'earlier smaller elements / probed piles', { area: true }], ['green', 'a longest increasing subsequence', { area: true }]]);
        v.readout(() => {
          const f = S.frame, L = Math.max(...f.L), k = f.piles.length, n = a.length, k2 = f.i + 1;
          return `After ${k2} of ${n} elements: $\\max L_i = ${L}$, piles $= ${k}$ ${L === k ? '✓' : ''} · comparisons so far: DP **${f.dpC}** (all $\\binom{n}{2} = ${n * (n - 1) / 2}$ by the end), patience binary search **${f.bsC}** (at most $n\\lceil\\log_2(n+1)\\rceil = ${n * Math.ceil(Math.log2(n + 1))}$)`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.7
    {
      num: '7.7',
      kind: 'Algorithm',
      name: 'Longest common subsequence',
      statement: String.raw`**Problem.** Given strings $x=x_1\cdots x_m$ and $y=y_1\cdots y_n$, find a longest string that is a subsequence of both (letters in order, not necessarily adjacent).

**Recurrence.** Let $c[i,j]$ be the LCS length of the prefixes $x_1\cdots x_i$ and $y_1\cdots y_j$. Then $c[i,0]=c[0,j]=0$ and
$$c[i,j]=\begin{cases}c[i-1,j-1]+1 & x_i=y_j,\\ \max\big(c[i-1,j],\,c[i,j-1]\big) & x_i\ne y_j.\end{cases}$$
Filling the table row by row takes $\Theta(mn)$ time; following the choices back from $(m,n)$ spells an LCS, each diagonal step contributing one letter. The length alone needs only two rows, $O(\min(m,n))$ space.`,
      idea: String.raw`Compare the last letters. If $x_i=y_j$, some LCS of the prefixes ends with this letter matched to itself (any LCS can be modified to do so), and the rest is an LCS of the two shorter prefixes. If they differ, an LCS cannot use both last letters, so it is an LCS of $x_{1..i-1}$ with $y_{1..j}$, or of $x_{1..i}$ with $y_{1..j-1}$ — whichever is longer. Each case refers only to smaller prefix pairs, so there are $(m+1)(n+1)$ subproblems, each solved in $O(1)$. A greedy scan that matches every letter as early as possible can miss the optimum.`,
      caption: String.raw`**Type two strings** (up to 10 letters). The table fills row by row: the gold cell is computed from the orange cells, and ↖ (a match, green), ↑ or ← record the choice. After the fill, the trace-back (green arrows) walks from the corner to the border, and every diagonal step lights up a letter of the LCS in both strings below.`,
      deps: ['algo-7.3'],
      see: ['bioinf-2.2', 'prob-6.4.4'],
      refs: ['CLRS 4e §14.4'],
      tags: ['dynamic programming', 'strings'],
      viz(v) {
        const xi = v.input('x =', 'ABCBDAB', { width: 130, onChange: () => S.reset({ at: 'end' }) });
        const yi = v.input('y =', 'BDCABA', { width: 130, onChange: () => S.reset({ at: 'end' }) });
        const X = () => cleanWord(xi.value) || 'A', Y = () => cleanWord(yi.value) || 'A';
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340 });
        const B = v.stage({ x: [-1, 11], y: [-0.6, 1.8], axes: false, height: 120, full: true });
        const T = v.table(s, { maxCell: 44, size: 15 });
        let run;
        const S = v.steps({ frames: () => (run = lcsFrames(X(), Y())).F, code: LCS_CODE, codeTitle: 'LCS-Length(x, y)', codePos: 'below', speed: 5, start: 27, still: 27 });
        v.render(() => {
          const f = S.frame, x = X(), y = Y(), m = x.length, n = y.length;
          drawDP(T, f, x, y);
          // the two strings
          const W = Math.max(m, n, 12);
          B.setView([-1.4, W - 0.2], [-0.4, 1.8]);
          const off = (L) => (W - L) / 2;
          const used = new Set((f.pairs || []).map(([p]) => 'x' + p)), usedY = new Set((f.pairs || []).map(([, q]) => 'y' + q));
          (f.pairs || []).forEach(([p, q]) => B.line(off(m) + p, 1.08, off(n) + q, 0.32, { color: 'green', width: 2.4 }));
          const tile = (ch, x0, y0, col, strong) => { B.rect(x0 - 0.32, y0 - 0.3, x0 + 0.32, y0 + 0.3, { fill: col, fillAlpha: strong ? 0.45 : 0.08, color: col, width: strong ? 2 : 1, radius: 4 }); B.text(ch, x0, y0, { align: 'center', size: 15, weight: 700, color: strong ? 'ink' : 'muted', halo: false }); };
          for (let p = 0; p < m; p++) tile(x[p], off(m) + p, 1.38, used.has('x' + p) ? 'green' : f.cur && f.cur[0] === p + 1 ? 'gold' : 'faint', used.has('x' + p) || (f.cur && f.cur[0] === p + 1));
          for (let q = 0; q < n; q++) tile(y[q], off(n) + q, 0.02, usedY.has('y' + q) ? 'green' : f.cur && f.cur[1] === q + 1 ? 'gold' : 'faint', usedY.has('y' + q) || (f.cur && f.cur[1] === q + 1));
          B.text('x', -1.0, 1.38, { align: 'center', size: 13, weight: 700, color: 'muted' }); B.text('y', -1.0, 0.02, { align: 'center', size: 13, weight: 700, color: 'muted' });
        });
        v.legend([['gold', 'current cell / letters compared', { area: true }], ['orange', 'cells it reads', { area: true }], ['green', 'trace-back and LCS letters', { area: true }]]);
        v.readout(() => {
          const x = X(), y = Y();
          // greedy: match each letter of x to its earliest possible occurrence in y
          let q = 0, g = ''; for (const ch of x) { const k = y.indexOf(ch, q); if (k >= 0) { g += ch; q = k + 1; } }
          return `LCS(${x}, ${y}) = **${run.lcs || '—'}**, length $c[${x.length},${y.length}] = ${run.len}$ · table of $(m+1)(n+1) = ${(x.length + 1) * (y.length + 1)}$ cells, $O(1)$ each · greedy earliest matching finds only ${g || '—'} (${g.length})${g.length < run.len ? ' ✗' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.8
    {
      num: '7.8',
      kind: 'Algorithm',
      name: 'Edit distance',
      statement: String.raw`**Problem.** The edit distance between strings $x=x_1\cdots x_m$ and $y=y_1\cdots y_n$ is the minimum total cost of a sequence of insertions (cost $c_{\rm ins}$), deletions ($c_{\rm del}$) and substitutions ($c_{\rm sub}$) turning $x$ into $y$; equivalently, the minimum cost of an **alignment**, which writes the two strings in columns, each column holding two letters (a match, cost 0, or a substitution) or a letter against a gap.

**Recurrence.** With $D[i,j]$ the distance between the prefixes $x_{1..i}$ and $y_{1..j}$: $D[i,0]=i\,c_{\rm del}$, $D[0,j]=j\,c_{\rm ins}$, and
$$D[i,j]=\min\big(D[i-1,j]+c_{\rm del},\ D[i,j-1]+c_{\rm ins},\ D[i-1,j-1]+[x_i\ne y_j]\,c_{\rm sub}\big).$$
The table takes $\Theta(mn)$ time and space; the trace-back yields an optimal alignment. Equivalently, $D[m,n]$ is a shortest path from corner to corner in the **edit graph**, a grid DAG with horizontal, vertical and diagonal edges.`,
      idea: String.raw`Look at the last column of an optimal alignment: it deletes $x_i$, inserts $y_j$, or aligns $x_i$ with $y_j$. Removing that column leaves an optimal alignment of the correspondingly shorter prefixes (optimal substructure, 7.3), so the three-way minimum is right. The table is a shortest-path computation in the edit graph evaluated in a topological order (rows), which is why the trace-back is a corner-to-corner path. If $c_{\rm sub}\ge c_{\rm ins}+c_{\rm del}$, a substitution is never better than deleting and inserting, matches are the only useful diagonals, and $D=(m-L)\,c_{\rm del}+(n-L)\,c_{\rm ins}$ with $L$ the LCS length (7.7).`,
      caption: String.raw`**Type two words** and set the three costs. The table fills row by row with back-pointers; the trace-back draws the optimal alignment below (green matches, orange substitutions, red deletions, purple insertions, with the cost of each column). Switch to the **edit graph** to see the same computation as a shortest path through a grid of free diagonals (matches) and costly steps. Raise the substitution cost to $2$ or more and watch substitutions vanish.`,
      deps: ['algo-7.3'],
      see: ['algo-7.7', 'bioinf-2.1', 'bioinf-2.5', 'cplx-12.5'],
      refs: ['Erickson Ch. 3', 'KT §6.6'],
      credit: 'Levenshtein, 1965; Wagner & Fischer, 1974',
      tags: ['dynamic programming', 'strings'],
      viz(v) {
        const xi = v.input('x =', 'ALGORITHM', { width: 130, onChange: () => S.reset({ at: 'end' }) });
        const yi = v.input('y =', 'ALTRUISTIC', { width: 130, onChange: () => S.reset({ at: 'end' }) });
        const cI = v.slider('$c_{\\rm ins}$', 0.5, 3, 1, { step: 0.5, onChange: () => S.reset({ at: 'end' }) });
        const cD = v.slider('$c_{\\rm del}$', 0.5, 3, 1, { step: 0.5, onChange: () => S.reset({ at: 'end' }) });
        const cS = v.slider('$c_{\\rm sub}$', 0.5, 3, 1, { step: 0.5, onChange: () => S.reset({ at: 'end' }) });
        const view = v.select('view', [{ value: 'table', label: 'table' }, { value: 'graph', label: 'edit graph' }], 'table');
        const X = () => cleanWord(xi.value) || 'A', Y = () => cleanWord(yi.value) || 'A', cost = () => ({ ins: cI.value, del: cD.value, sub: cS.value });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360 });
        const B = v.stage({ x: [-1, 11], y: [-1, 1.8], axes: false, height: 132, full: true });
        const T = v.table(s, { maxCell: 42, size: 14 });
        let run;
        const S = v.steps({ frames: () => (run = editFrames(X(), Y(), cost())).F, code: EDIT_CODE, codeTitle: 'Edit-Distance(x, y)', codePos: 'below', speed: 6, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame, x = X(), y = Y(), m = x.length, n = y.length, c = cost();
          if (view.value === 'table') { s.setView([0, 1], [0, 1]); drawDP(T, f, x, y, { format: (val) => (val == null ? null : r2(val)), edit: true }); }
          else {
            s.setView([-1.25, n + 0.55], [-m - 0.55, 1.1]);
            const key = (i, j) => i * 100 + j, onPath = new Set((f.path || []).map(([i, j]) => key(i, j)));
            const pathEdge = new Map(); for (let k = 0; k + 1 < (f.path || []).length; k++) { const [a, b] = f.path[k], [c2, d2] = f.path[k + 1]; pathEdge.set(key(a, b) + ':' + key(c2, d2), a > c2 && b > d2 ? (x[a - 1] === y[b - 1] ? 'match' : 'sub') : a > c2 ? 'del' : 'ins'); }
            const isPE = (a, b) => pathEdge.get(key(...a) + ':' + key(...b)), PC = (a, b) => OPCOL[isPE(a, b)];
            for (let j = 0; j < n; j++) s.text(y[j], j + 0.5, 0.72, { align: 'center', size: 14, weight: 700, color: f.cur && f.cur[1] === j + 1 ? 'gold' : 'muted' });
            for (let i = 0; i < m; i++) s.text(x[i], -0.85, -i - 0.5, { align: 'center', size: 14, weight: 700, color: f.cur && f.cur[0] === i + 1 ? 'gold' : 'muted' });
            for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) {
              if (j < n) s.line(j, -i, j + 1, -i, { color: PC([i, j + 1], [i, j]) || 'faint', width: isPE([i, j + 1], [i, j]) ? 4 : 1, alpha: 0.9 });
              if (i < m) s.line(j, -i, j, -i - 1, { color: PC([i + 1, j], [i, j]) || 'faint', width: isPE([i + 1, j], [i, j]) ? 4 : 1, alpha: 0.9 });
              if (i < m && j < n) { const mt = x[i] === y[j], pe = isPE([i + 1, j + 1], [i, j]); s.line(j, -i, j + 1, -i - 1, { color: pe ? PC([i + 1, j + 1], [i, j]) : mt ? 'green' : 'faint', width: pe ? 4 : mt ? 2.2 : 0.8, alpha: pe ? 1 : mt ? 0.5 : 0.6, dash: mt || pe ? null : [2, 3] }); }
            }
            if (f.cur) { const [i, j] = f.cur, [di, dj] = f.ptr[i][j]; [[i - 1, j], [i, j - 1], [i - 1, j - 1]].forEach(([a, b]) => s.line(b, -a, j, -i, { color: 'orange', width: 2.4 })); s.line(j + dj, -(i + di), j, -i, { color: 'accent', width: 3.4 }); }
            const rN = clamp(Math.min(s.sx, s.sy) * 0.27, 7, 14);
            for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) {
              const val = f.vals[i][j], cur = f.cur && f.cur[0] === i && f.cur[1] === j, on = onPath.has(key(i, j));
              s.dot(j, -i, { r: rN, color: cur ? 'gold' : on ? 'green' : val == null ? 'faint' : 'accent', alpha: val == null ? 0.25 : cur || on ? 1 : 0.85 });
              if (val != null && rN >= 9) s.text(r2(val), j, -i, { align: 'center', size: clamp(rN * 0.85, 8, 12), weight: 700, color: 'panel', halo: false });
            }
          }
          const shownFrom = run.cols.length - (f.shown ?? (f.path ? run.cols.length : 0));
          drawAlignment(B, run.cols, { cost: c, minCols: 10 });
          if (f.path && f.shown != null && f.shown < run.cols.length) {
            // grey out the columns not reached by the trace-back yet
            B.rect(-0.5, -0.95, shownFrom - 0.5, 1.6, { fill: 'panel', fillAlpha: 0.72, stroke: false });
          } else if (!f.path) B.rect(-0.5, -0.95, run.cols.length - 0.5, 1.6, { fill: 'panel', fillAlpha: 0.72, stroke: false });
        });
        v.legend([['green', 'match (free)', { area: true }], ['orange', 'substitution', { area: true }], ['red', 'deletion', { area: true }], ['purple', 'insertion', { area: true }]]);
        v.readout(() => {
          const x = X(), y = Y(), c = cost(), cols = run.cols, cnt = (op) => cols.filter((k) => k.op === op).length, d = run.D[x.length][y.length];
          const parts = [[cnt('sub'), 'substitution', c.sub], [cnt('del'), 'deletion', c.del], [cnt('ins'), 'insertion', c.ins]].filter(([k]) => k).map(([k, w, cc]) => `${plural(k, w)} × ${r2(cc)}`);
          const L = lcsLen(x, y), noSub = c.sub >= c.ins + c.del;
          return `$D(\\text{${x}}, \\text{${y}}) = ${r2(d)}$ = ${parts.join(' + ') || 'nothing to do'}; ${cnt('match')} letters kept · alignment cost ${r2(alignCost(cols, c))} ✓` + (noSub ? ` · $c_{\\rm sub} \\ge c_{\\rm ins} + c_{\\rm del}$: no substitutions, and $D = (m-L)c_{\\rm del} + (n-L)c_{\\rm ins} = ${r2((x.length - L) * c.del + (y.length - L) * c.ins)}$ with $L = \\mathrm{LCS} = ${L}$ ✓` : '');
        });
      },
    },
  ],
};
