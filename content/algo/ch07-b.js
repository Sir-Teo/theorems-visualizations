// Algorithms — Chapter 7: Dynamic programming (items 7.9–7.16; 7.1–7.8 in ch07.js)
import { clamp, plural, r2, big, tbig, pv, cleanWord, arcArrow, editTable, editTrace, alignCost, drawAlignment, knapTable, knapPick, inorderLayout } from './ch07.shared.js';

const DEPTHC = ['accent', 'purple', 'teal', 'orange', 'pink', 'blue', 'green'];
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = (n) => String(n).split('').map((d) => SUB[+d]).join('');

// ---------------------------------------------------------------- 7.9 Hirschberg
const HIRSCH_CODE = [
  'Hirschberg(x[i₀..i₁), y[j₀..j₁)):',
  '  if i₁ − i₀ ≤ 1 or j₀ = j₁:  align directly;  return',
  '  mid ← ⌊(i₀ + i₁)/2⌋',
  '  F ← last row of the DP of x[i₀..mid) against y[j₀..j₁)     ▷ forward, two rows',
  '  B ← first row of the DP of x[mid..i₁) against y[j₀..j₁)   ▷ backward, two rows',
  '  j* ← argmin F[j] + B[j]      ▷ the optimal path crosses row mid at column j*',
  '  Hirschberg(x[i₀..mid), y[j₀..j*));   Hirschberg(x[mid..i₁), y[j*..j₁))',
];
function hirschberg(X, Y) {
  const calls = []; let cells = 0, peak = 0;
  const fwd = (i0, i1, j0, j1) => {
    const w = j1 - j0; let prev = Array.from({ length: w + 1 }, (_, j) => j);
    for (let i = i0; i < i1; i++) { const cur = [i - i0 + 1]; for (let j = 1; j <= w; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (X[i] === Y[j0 + j - 1] ? 0 : 1)); cells++; } prev = cur; }
    return prev;
  };
  const bwd = (i0, i1, j0, j1) => {
    const w = j1 - j0; let prev = Array.from({ length: w + 1 }, (_, j) => w - j);
    for (let i = i1 - 1; i >= i0; i--) { const cur = []; cur[w] = i1 - i; for (let j = w - 1; j >= 0; j--) { cur[j] = Math.min(prev[j] + 1, cur[j + 1] + 1, prev[j + 1] + (X[i] === Y[j0 + j] ? 0 : 1)); cells++; } prev = cur; }
    return prev;
  };
  function rec(i0, i1, j0, j1, depth) {
    peak = Math.max(peak, 2 * (j1 - j0 + 1));
    if (i1 - i0 <= 1 || j1 === j0) {
      const xs = X.slice(i0, i1), ys = Y.slice(j0, j1), { P } = editTable(xs, ys), { path } = editTrace(xs, ys, P);
      cells += xs.length * ys.length;
      const pts = path.reverse().map(([a, b]) => [i0 + a, j0 + b]);
      calls.push({ i0, i1, j0, j1, depth, base: true, pts });
      return pts;
    }
    const mid = (i0 + i1) >> 1, F = fwd(i0, mid, j0, j1), B = bwd(mid, i1, j0, j1);
    let js = 0; for (let j = 1; j <= j1 - j0; j++) if (F[j] + B[j] < F[js] + B[js]) js = j;
    calls.push({ i0, i1, j0, j1, depth, mid, F, B, js: j0 + js, tot: F[js] + B[js] });
    const L = rec(i0, mid, j0, j0 + js, depth + 1), R = rec(mid, i1, j0 + js, j1, depth + 1);
    return L.concat(R.slice(1));
  }
  const pts = rec(0, X.length, 0, Y.length, 0), cols = [];
  for (let k = 1; k < pts.length; k++) {
    const [a, b] = pts[k - 1], [c, d] = pts[k];
    if (c > a && d > b) cols.push({ a: X[a], b: Y[b], op: X[a] === Y[b] ? 'match' : 'sub' }); else if (c > a) cols.push({ a: X[a], b: null, op: 'del' }); else cols.push({ a: null, b: Y[b], op: 'ins' });
  }
  return { calls, pts, cols, cells, peak };
}

// ---------------------------------------------------------------- 7.10 knapsack
const KNAP_CODE = [
  'K[0, c] ← 0 for every capacity c',
  'for i ← 1 to n:',
  '  for c ← 0 to W:',
  '    K[i, c] ← K[i−1, c]                                   ▷ skip item i',
  '    if wᵢ ≤ c:  K[i, c] ← max(K[i, c], K[i−1, c − wᵢ] + vᵢ)    ▷ take it',
  'trace back from (n, W): item i is taken iff K[i, c] ≠ K[i−1, c]',
];
function knapFrames(items, W) {
  const n = items.length, { K, take } = knapTable(items, W), F = [];
  F.push({ k: -1, line: 1, note: 'Row 0: with no items, every capacity is worth 0.' });
  for (let i = 1; i <= n; i++) for (let c = 0; c <= W; c++) {
    const { w, v } = items[i - 1], sk = K[i - 1][c], tk = w <= c ? K[i - 1][c - w] + v : null;
    F.push({ k: (i - 1) * (W + 1) + c, cur: [i, c], line: w <= c ? [4, 5] : 4,
      note: w <= c ? `Item ${i} (weight ${w}, value ${v}), capacity ${c}: skip it → ${sk}; take it → $K[${i - 1},${c - w}] + ${v} = ${tk}$. ${take[i][c] ? '**Take**' : '**Skip**'}: ${K[i][c]}.` : `Item ${i} weighs ${w} > ${c}: it does not fit, $K[${i},${c}] = K[${i - 1},${c}] = ${sk}$.` });
  }
  const path = [[n, W]]; let c = W;
  F.push({ k: n * (W + 1), path: path.slice(), line: 6, note: `Full table: the best value is $K[${n},${W}] = ${K[n][W]}$. Trace back from the corner.` });
  for (let i = n; i >= 1; i--) {
    const tk = take[i][c]; if (tk) c -= items[i - 1].w; path.push([i - 1, c]);
    F.push({ k: n * (W + 1), path: path.slice(), line: 6, hold: 0.8, note: tk ? `Row ${i}: the value changed from the row above, so item ${i} is in the knapsack; move left by its weight ${items[i - 1].w}.` : `Row ${i}: same value as the row above, item ${i} is left out.` });
  }
  return { F, K, take };
}

// ---------------------------------------------------------------- 7.12 coin change
const COIN_CODE = [
  'C[0] ← 0',
  'for a ← 1 to T:',
  '  C[a] ← 1 + min{ C[a − c] : coin c ≤ a }      ▷ ∞ if no coin fits',
  '  last[a] ← the coin achieving it',
  'pay T by repeatedly giving last[a] and setting a ← a − last[a]',
];
function coinSolve(coins, T) {
  const C = [0], last = [0];
  for (let a = 1; a <= T; a++) { let b = Infinity, bc = 0; for (const c of coins) if (c <= a && C[a - c] + 1 < b) { b = C[a - c] + 1; bc = c; } C.push(b); last.push(bc); }
  return { C, last };
}
const coinPick = (last, a) => { const out = []; while (a > 0 && last[a]) { out.push(last[a]); a -= last[a]; } return out; };
function greedyCoins(coins, a) { const out = [], cs = [...coins].sort((x, y) => y - x); for (const c of cs) while (a >= c) { out.push(c); a -= c; } return a === 0 ? out : null; }
const parseCoins = (str) => [...new Set(String(str).split(/[^0-9]+/).map(Number).filter((x) => x >= 1 && x <= 50))].sort((a, b) => a - b).slice(0, 6);

// ---------------------------------------------------------------- 7.13 matrix chain
const CHAIN_CODE = [
  'm[i, i] ← 0',
  'for ℓ ← 2 to n:                              ▷ chain length, diagonal by diagonal',
  '  for i ← 1 to n − ℓ + 1:   j ← i + ℓ − 1',
  '    m[i, j] ← min over i ≤ k < j of  m[i, k] + m[k+1, j] + $p_{i-1}\\,p_k\\,p_j$',
  '    s[i, j] ← the best k               ▷ the last multiplication splits at k',
  'read the parenthesization from s[1, n]',
];
function chainSolve(p, worst) {
  const n = p.length - 1, m = [], s = [];
  for (let i = 0; i <= n + 1; i++) { m.push(Array(n + 2).fill(0)); s.push(Array(n + 2).fill(0)); }
  for (let len = 2; len <= n; len++) for (let i = 1; i + len - 1 <= n; i++) {
    const j = i + len - 1; let best = worst ? -Infinity : Infinity, bk = i;
    for (let k = i; k < j; k++) { const c = m[i][k] + m[k + 1][j] + p[i - 1] * p[k] * p[j]; if (worst ? c > best : c < best) { best = c; bk = k; } }
    m[i][j] = best; s[i][j] = bk;
  }
  return { m, s, n };
}
const chainTree = (s, i, j) => (i === j ? { leaf: i, i, j } : { i, j, k: s[i][j], l: chainTree(s, i, s[i][j]), r: chainTree(s, s[i][j] + 1, j) });
const parenTeX = (s, i, j) => (i === j ? `A_{${i}}` : `(${parenTeX(s, i, s[i][j])}${parenTeX(s, s[i][j] + 1, j)})`);
const catalan = (k) => { let c = 1; for (let i = 0; i < k; i++) c = (c * 2 * (2 * i + 1)) / (i + 2); return Math.round(c); };

// ---------------------------------------------------------------- 7.14 optimal BST
const KEYS = 'ABCDEFGHIJ';
function obstSolve(f) {
  const n = f.length, C = [], R = [], Wt = [];
  for (let i = 0; i <= n + 1; i++) { C.push(Array(n + 2).fill(0)); R.push(Array(n + 2).fill(0)); Wt.push(Array(n + 2).fill(0)); }
  for (let i = 1; i <= n; i++) for (let j = i; j <= n; j++) Wt[i][j] = Wt[i][j - 1] + f[j - 1];
  for (let len = 1; len <= n; len++) for (let i = 1; i + len - 1 <= n; i++) {
    const j = i + len - 1; let b = Infinity, br = i;
    for (let r = i; r <= j; r++) { const c = C[i][r - 1] + C[r + 1][j]; if (c < b) { b = c; br = r; } }
    C[i][j] = b + Wt[i][j]; R[i][j] = br;
  }
  return { C, R, Wt, n };
}
const bstFromRoots = (R, i, j) => (i > j ? null : { key: R[i][j], l: bstFromRoots(R, i, R[i][j] - 1), r: bstFromRoots(R, R[i][j] + 1, j) });
const bstBalanced = (i, j) => { if (i > j) return null; const r = (i + j + 1) >> 1; return { key: r, l: bstBalanced(i, r - 1), r: bstBalanced(r + 1, j) }; };
const bstGreedy = (f, i, j) => { if (i > j) return null; let r = i; for (let k = i; k <= j; k++) if (f[k - 1] > f[r - 1]) r = k; return { key: r, l: bstGreedy(f, i, r - 1), r: bstGreedy(f, r + 1, j) }; };
const bstCost = (t, f, d = 1) => (t ? f[t.key - 1] * d + bstCost(t.l, f, d + 1) + bstCost(t.r, f, d + 1) : 0);
const OBST_CODE = [
  'for ℓ ← 1 to n:                          ▷ intervals of keys, by length',
  '  for i ← 1 to n − ℓ + 1:   j ← i + ℓ − 1',
  '    cost[i, j] ← f(i..j) + min over roots r of  cost[i, r−1] + cost[r+1, j]',
  '    root[i, j] ← the best r              ▷ empty intervals cost 0',
  'build the tree from root[1, n]: its children are root[1, r−1] and root[r+1, n] …',
];

// ---------------------------------------------------------------- 7.15 independent sets in trees
const TREE_IS_CODE = [
  'in postorder, for each vertex v with children c:',
  '  in(v)  ← w(v) + Σ out(c)               ▷ v in the set: children are not',
  '  out(v) ← Σ max(in(c), out(c))          ▷ v not in the set: children are free',
  'answer = max(in(root), out(root))',
  'top-down: take v if its parent is not taken and in(v) ≥ out(v)',
];

// ---------------------------------------------------------------- 7.16 Held–Karp
const HK_CODE = [
  'for every city j ≠ 0:  D[{j}, j] ← d(0, j)',
  'for every set S ⊆ {1, …, n−1}, by increasing size:',
  '  for every j ∈ S:',
  '    D[S, j] ← min over i ∈ S − {j} of  D[S − {j}, i] + d(i, j)',
  'tour length = min over j of  D[{1, …, n−1}, j] + d(j, 0)',
  'follow the minimizing i back to recover the tour',
];
const popc = (x) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
const setLab = (mask) => { const o = []; for (let k = 0; mask >> k; k++) if ((mask >> k) & 1) o.push(k + 1); return '{' + o.join(',') + '}'; };
function heldKarp(P) {
  const n = P.length, d = (a, b) => Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]), full = (1 << (n - 1)) - 1;
  const subs = []; for (let m = 1; m <= full; m++) subs.push(m); subs.sort((a, b) => popc(a) - popc(b) || a - b);
  const D = {}, Pa = {}; let ops = 0;
  for (const S of subs) {
    D[S] = {}; Pa[S] = {};
    for (let j = 1; j < n; j++) {
      if (!((S >> (j - 1)) & 1)) continue;
      const R = S & ~(1 << (j - 1));
      if (!R) { D[S][j] = d(0, j); Pa[S][j] = 0; ops++; continue; }
      let b = Infinity, bi = -1;
      for (let i = 1; i < n; i++) if ((R >> (i - 1)) & 1) { ops++; const c = D[R][i] + d(i, j); if (c < b) { b = c; bi = i; } }
      D[S][j] = b; Pa[S][j] = bi;
    }
  }
  let best = Infinity, bj = 1; for (let j = 1; j < n; j++) { ops++; const c = D[full][j] + d(j, 0); if (c < best) { best = c; bj = j; } }
  const tour = [0], cellsPath = []; let S = full, j = bj;
  while (j > 0) { tour.push(j); cellsPath.push([S, j]); const i = Pa[S][j]; S &= ~(1 << (j - 1)); j = i; }
  tour.push(0); tour.reverse();
  return { n, d, subs, D, Pa, best, tour, cellsPath, ops, full };
}
/** Partial path for table cell (S, j): from city 0 through S ending at j. */
function hkPath(H, S, j) { const out = []; while (j > 0) { out.unshift(j); const i = H.Pa[S][j]; S &= ~(1 << (j - 1)); j = i; } out.unshift(0); return out; }
function bruteTSP(P) {
  const n = P.length, d = (a, b) => Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]), rest = Array.from({ length: n - 1 }, (_, k) => k + 1);
  let best = Infinity, count = 0;
  (function perm(k) {
    if (k === rest.length) { count++; let L = d(0, rest[0]) + d(rest[rest.length - 1], 0); for (let t = 1; t < rest.length; t++) L += d(rest[t - 1], rest[t]); if (L < best) best = L; return; }
    for (let t = k; t < rest.length; t++) { [rest[k], rest[t]] = [rest[t], rest[k]]; perm(k + 1); [rest[k], rest[t]] = [rest[t], rest[k]]; }
  })(0);
  return { best, count };
}
const hkOps = (n) => { let t = 2 * (n - 1); for (let s = 2; s <= n - 1; s++) { let c = 1; for (let q = 0; q < s; q++) c = (c * (n - 1 - q)) / (q + 1); t += c * s * (s - 1); } return t; };
const fact = (k) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; };

export default {
  collection: 'algo',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.9
    {
      num: '7.9',
      kind: 'Algorithm',
      name: 'Linear-space alignment (Hirschberg)',
      statement: String.raw`**Hirschberg's algorithm** computes an optimal alignment (and the edit distance) of strings of lengths $m$ and $n$ in $O(mn)$ time but only $O(m+n)$ space. Split $x$ at its middle position $\mathrm{mid}$. A forward pass keeping two rows computes $F[j]$, the distance between $x_{1..\mathrm{mid}}$ and $y_{1..j}$, for all $j$; a backward pass computes $B[j]$, the distance between $x_{\mathrm{mid}+1..m}$ and $y_{j+1..n}$. Some optimal alignment path crosses row $\mathrm{mid}$ at a column $j^*$ minimizing $F[j]+B[j]$, and $F[j^*]+B[j^*]$ is the edit distance. Recurse on the two blocks $(x_{1..\mathrm{mid}},y_{1..j^*})$ and $(x_{\mathrm{mid}+1..m},y_{j^*+1..n})$; blocks with one row are aligned directly. The total work is at most about $2mn$ cell evaluations.`,
      idea: String.raw`Every alignment path from $(0,0)$ to $(m,n)$ in the edit graph (7.8) crosses the middle row somewhere, and the cheapest path through a point $(\mathrm{mid},j)$ costs exactly $F[j]+B[j]$ (best way in plus best way out). So the minimizing $j^*$ is a point of an optimal path, found in linear space because each pass keeps only two rows. Divide and conquer (2.1) then aligns the two independent blocks. The blocks' areas add up to half of the current block, so the work forms a geometric series $mn+mn/2+mn/4+\dots\le 2mn$, while memory never exceeds a couple of rows plus the recursion stack.`,
      caption: String.raw`**Type two strings.** Each step is one recursive call: the gold rectangle is its block, the forward pass covers the blue rows and the backward pass the orange rows, and the numbers in the middle row are $F[j]+B[j]$, also drawn as stacked bars below. The green dot at the minimum is a point of the optimal path; nested rectangles show the recursion so far. The last step joins the points into the optimal path, whose alignment is shown at the bottom.`,
      deps: ['algo-7.8', 'algo-2.1'],
      see: ['bioinf-2.5', 'bioinf-2.10'],
      refs: ['KT §6.7'],
      credit: 'Dan Hirschberg, 1975',
      tags: ['dynamic programming', 'divide and conquer'],
      viz(v) {
        const xi = v.input('x =', 'ALGORITHM', { width: 140, onChange: () => S.reset({ at: 'keep' }) });
        const yi = v.input('y =', 'ALTRUISTIC', { width: 140, onChange: () => S.reset({ at: 'keep' }) });
        const X = () => cleanWord(xi.value, 14) || 'A', Y = () => cleanWord(yi.value, 14) || 'A';
        const G = v.stage({ x: [-1, 11], y: [-10, 1], axes: false, height: 330, full: true });
        const Bs = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', height: 150, weight: 1, minWidth: 300, title: '$F[j]$ (blue) + $B[j]$ (orange) along the middle row' });
        const Al = v.stage({ x: [-1, 11], y: [-1, 1.8], axes: false, height: 120, weight: 1.4, minWidth: 340 });
        let H;
        const frames = () => {
          H = hirschberg(X(), Y()); const F = [];
          H.calls.forEach((c, k) => F.push({ k, line: c.base ? 2 : [3, 4, 5, 6], note: c.base ? `Block $x_{${c.i0 + 1}..${c.i1}}$ × $y_{${c.j0 + 1}..${c.j1}}$ has ${c.i1 - c.i0 <= 1 ? 'one row' : 'no columns'}: align it directly (green segment).` : `Block $x_{${c.i0 + 1}..${c.i1}}$ × $y_{${c.j0 + 1}..${c.j1}}$, middle row ${c.mid}. Forward and backward sweeps meet there; $F[j]+B[j]$ is smallest (${c.tot}) at column $j^* = ${c.js}$, so an optimal path passes through $(${c.mid}, ${c.js})$.` }));
          const tot = H.cols.length ? alignCost(H.cols, { ins: 1, del: 1, sub: 1 }) : 0;
          F.push({ k: H.calls.length, done: true, line: 7, hold: 2, note: `All blocks solved: the points join into an optimal path of cost **${tot}**, found while storing only ${H.peak} numbers at a time.` });
          return F;
        };
        const S = v.steps({ frames, code: HIRSCH_CODE, codeTitle: 'Hirschberg(x, y)', codePos: 'below', speed: 1, start: 0, still: 0 });
        v.render(() => {
          const f = S.frame, x = X(), y = Y(), m = x.length, n = y.length, calls = H.calls, cur = calls[f.k];
          G.setView([-1.3, n + 0.6], [-m - 0.6, 1.05]);
          for (let j = 0; j < n; j++) G.text(y[j], j + 0.5, 0.65, { align: 'center', size: 13.5, weight: 700, color: cur && !cur.base && j >= cur.j0 && j < cur.j1 ? 'ink' : 'muted' });
          for (let i = 0; i < m; i++) G.text(x[i], -0.8, -i - 0.5, { align: 'center', size: 13.5, weight: 700, color: cur && i >= cur.i0 && i < cur.i1 ? 'ink' : 'muted' });
          if (cur && !cur.base) {
            G.rect(cur.j0, -cur.i0, cur.j1, -cur.mid, { fill: 'blue', fillAlpha: 0.12, stroke: false });
            G.rect(cur.j0, -cur.mid, cur.j1, -cur.i1, { fill: 'orange', fillAlpha: 0.12, stroke: false });
          }
          for (let i = 0; i <= m; i++) G.line(0, -i, n, -i, { color: 'faint', width: 0.8, alpha: 0.6 });
          for (let j = 0; j <= n; j++) G.line(j, 0, j, -m, { color: 'faint', width: 0.8, alpha: 0.6 });
          const upto = f.done ? calls.length : f.k + 1;
          for (let k = 0; k < upto; k++) { const c = calls[k]; if (c.base) continue; G.rect(c.j0, -c.i0, c.j1, -c.i1, { color: DEPTHC[c.depth % DEPTHC.length], width: k === f.k ? 0 : 1.4, alpha: 0.8 }); }
          for (let k = 0; k < upto; k++) { const c = calls[k]; if (c.base) G.path(c.pts.map(([a, b]) => [b, -a]), { color: 'green', width: 3.2 }); }
          if (f.done) G.path(H.pts.map(([a, b]) => [b, -a]), { color: 'green', width: 4.5, alpha: 0.85 });
          if (cur) G.rect(cur.j0, -cur.i0, cur.j1, -cur.i1, { color: 'gold', width: 3.2 });
          for (let k = 0; k < upto; k++) { const c = calls[k]; if (!c.base) G.dot(c.js, -c.mid, { r: 6.5, color: 'green' }); }
          if (cur && !cur.base) {
            const rr = clamp(Math.min(G.sx, G.sy) * 0.3, 7, 13);
            for (let j = cur.j0; j <= cur.j1; j++) {
              const val = cur.F[j - cur.j0] + cur.B[j - cur.j0], best = j === cur.js;
              G.dot(j, -cur.mid, { r: rr, color: best ? 'green' : 'panel', ring: false }); if (!best) G.dot(j, -cur.mid, { r: rr, hollow: true, color: 'muted', width: 1.2 });
              G.text(String(val), j, -cur.mid, { align: 'center', size: clamp(rr * 0.95, 8, 12.5), weight: 700, color: best ? 'panel' : 'ink', halo: false });
            }
            G.text('mid', cur.j1, -cur.mid, { dx: rr + 5, size: 11, weight: 700, color: 'muted' });
          }
          // bars
          if (cur && !cur.base) {
            const w = cur.j1 - cur.j0, mx = Math.max(...cur.F.map((a, k) => a + cur.B[k]));
            pv(Bs, [cur.j0 - 0.6, cur.j1 + 0.6], [0, mx * 1.15], { l: 30, b: 24 });
            for (let k = 0; k <= w; k++) {
              const j = cur.j0 + k, a = cur.F[k], b = cur.B[k], best = j === cur.js;
              Bs.rect(j - 0.32, 0, j + 0.32, a, { fill: 'blue', fillAlpha: 0.45, stroke: false });
              Bs.rect(j - 0.32, a, j + 0.32, a + b, { fill: 'orange', fillAlpha: 0.45, stroke: false });
              if (best) Bs.rect(j - 0.38, 0, j + 0.38, a + b, { color: 'green', width: 2.6 });
              Bs.text(String(a + b), j, a + b, { align: 'center', baseline: 'bottom', dy: -2, size: 10.5, weight: best ? 800 : 500, color: best ? 'green' : 'muted' });
            }
            Bs.setTicks(Array.from({ length: w + 1 }, (_, k) => cur.j0 + k), null);
          } else { Bs.setView([0, 10], [0, 10]); Bs.setTicks([], []); Bs.corner(f.done ? 'done: every block is solved' : 'base case: aligned directly, no split', 'tl', { color: 'muted' }); }
          if (f.done) drawAlignment(Al, H.cols, { minCols: Math.max(H.cols.length, 10), cost: { ins: 1, del: 1, sub: 1 } });
          else {
            // the only memory in use: the two rows F and B of the current call
            Al.setView([-2.4, n + 0.7], [-1.15, 1.85]);
            if (cur && !cur.base) {
              const tile = (val, j, y, col, best) => { Al.rect(j - 0.42, y - 0.3, j + 0.42, y + 0.3, { fill: best ? 'green' : col, fillAlpha: best ? 0.35 : 0.16, color: best ? 'green' : col, width: best ? 2 : 1, radius: 3 }); Al.text(String(val), j, y, { align: 'center', size: 12, weight: 700, halo: false }); };
              for (let j = cur.j0; j <= cur.j1; j++) { tile(cur.F[j - cur.j0], j, 1.2, 'blue', j === cur.js); tile(cur.B[j - cur.j0], j, 0.35, 'orange', j === cur.js); }
              Al.text('F', -1.3, 1.2, { align: 'center', size: 13, weight: 800, color: 'blue', math: true }); Al.text('B', -1.3, 0.35, { align: 'center', size: 13, weight: 800, color: 'orange', math: true });
              Al.text(`stored right now: these 2 × ${cur.j1 - cur.j0 + 1} numbers (plus the recursion stack) — never the whole table`, -2.2, -0.62, { size: 11.5, weight: 600, color: 'muted' });
            } else Al.text('base case: a single row of x is aligned directly', -2.2, 0.6, { size: 12, color: 'muted' });
          }
        });
        v.legend([['gold', 'current block', { area: true }], ['blue', 'forward pass', { area: true }], ['orange', 'backward pass', { area: true }], ['green', 'points / pieces of the optimal path', { dot: true }]]);
        v.readout(() => {
          const x = X(), y = Y(), m = x.length, n = y.length, { D } = editTable(x, y), tot = alignCost(H.cols, { ins: 1, del: 1, sub: 1 });
          return `Hirschberg's alignment costs **${tot}** = full-table edit distance ${D[m][n]} ${tot === D[m][n] ? '✓' : '✗'} · ${H.calls.length} calls · at most **${H.peak}** numbers stored at once (two rows) instead of the $(m+1)(n+1) = ${(m + 1) * (n + 1)}$ of the full table · cells evaluated: ${H.cells} $\\le 2mn = ${2 * m * n}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.10
    {
      num: '7.10',
      kind: 'Algorithm',
      name: '0/1 knapsack',
      statement: String.raw`**Problem.** Given items $1,\dots,n$ with positive integer weights $w_i$ and values $v_i$, and an integer capacity $W$, choose a set of items of total weight at most $W$ and maximum total value; each item is taken whole or not at all.

**Recurrence.** Let $K[i,c]$ be the best value using only items $1..i$ with capacity $c$. Then $K[0,c]=0$ and
$$K[i,c]=\begin{cases}K[i-1,c] & w_i>c,\\ \max\big(K[i-1,c],\ K[i-1,c-w_i]+v_i\big) & w_i\le c.\end{cases}$$
The $(n+1)(W+1)$ table takes $\Theta(nW)$ time; item $i$ belongs to the traced-back solution exactly when $K[i,c]\ne K[i-1,c]$ along the way. (One row suffices for the value if capacities are scanned downwards.)`,
      idea: String.raw`Ask about the last item. An optimal set for $(i,c)$ either omits item $i$ — and is then optimal for $(i-1,c)$ — or contains it, and then the rest is an optimal set for $(i-1,c-w_i)$: optimal substructure (7.3) with the capacity as the extra index that makes the subproblems independent. The subproblems form a DAG from row $i-1$ to row $i$, so filling rows in order is valid. Greedy by value per unit weight, optimal for the fractional problem (10.7), fails here: in the classic instance it takes the densest item first and ends with 35 instead of 40.`,
      caption: String.raw`**Click a weight or value** in the item list to raise it (shift-click lowers it) and set the capacity. Each step fills one cell: the gold cell compares *skip* (the cell above) with *take* (the cell one row up and $w_i$ to the left); green cells are those where taking item $i$ won. The knapsack bar packs the optimal set for the current cell. After the fill, the trace-back walks up from the corner.`,
      deps: ['algo-7.3'],
      see: ['algo-10.7', 'cplx-2.3', 'algo-2.14'],
      refs: ['KT §6.4', 'Erickson Ch. 3'],
      tags: ['dynamic programming'],
      viz(v) {
        const items = [[1, 1], [2, 6], [5, 18], [6, 22], [7, 28]].map(([w, val]) => ({ w, v: val }));
        const WS = v.slider('capacity $W$', 1, 15, 11, { int: true, onChange: () => S.reset({ at: 'end' }) });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, full: true });
        const I = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, weight: 0.8, minWidth: 260 });
        const Kb = v.stage({ x: [-0.5, 15.5], y: [-1, 2], axes: false, height: 200, weight: 1.4, minWidth: 320 });
        const T = v.table(s, { square: false, maxCell: 40, cellAspect: 1.15, size: 14 });
        const TI = v.table(I, { rows: 5, cols: 3, square: false, maxCell: 32, cellAspect: 1.5, size: 14, colLabels: ['$w_i$', '$v_i$', '$v_i/w_i$'], rowLabels: (k) => `item ${k + 1}`, format: (val, i, j) => (j === 2 ? r2(val) : val) });
        let run;
        const S = v.steps({ frames: () => (run = knapFrames(items, WS.value)).F, code: KNAP_CODE, codeTitle: '0/1-Knapsack(w, v, W)', codePos: 'below', speed: 6, start: 58, still: 58 });
        I.onClick((x, y, mod) => { const c = TI.hit(x, y); if (!c || c.i < 0 || c.j < 0 || c.j > 1) return; const it = items[c.i], key = c.j ? 'v' : 'w'; it[key] = clamp(it[key] + (mod.shift ? -1 : 1), 1, c.j ? 40 : 12); S.reset({ at: 'keep' }); });
        const COLS = ['blue', 'teal', 'purple', 'orange', 'pink'];
        v.render(() => {
          const f = S.frame, W = WS.value, n = items.length, { K, take } = run, done = f.k >= n * (W + 1);
          const filled = (i, c) => i === 0 || done || (i - 1) * (W + 1) + c <= f.k;
          const key = (i, c) => i * 100 + c, path = new Set((f.path || []).map(([i, c]) => key(i, c)));
          const cur = f.cur, it = cur ? items[cur[0] - 1] : null, takeDep = cur && it.w <= cur[1] ? [cur[0] - 1, cur[1] - it.w] : null;
          T.draw({
            rows: n + 1, cols: W + 1, rowLabels: (i) => (i ? `${i}: w=${items[i - 1].w} v=${items[i - 1].v}` : 'none'), colLabels: (c) => String(c), cornerLabel: 'c →',
            value: (i, c) => (filled(i, c) ? K[i][c] : null),
            fill: (i, c) => (cur && cur[0] === i && cur[1] === c ? ['gold', 0.5] : takeDep && takeDep[0] === i && takeDep[1] === c ? ['green', 0.35] : cur && cur[0] - 1 === i && cur[1] === c ? ['orange', 0.35] : path.has(key(i, c)) ? ['green', 0.45] : filled(i, c) && i && take[i][c] ? ['green', 0.12] : null),
            weight: (i, c) => (path.has(key(i, c)) ? 800 : 500), highlight: cur ? [cur] : [], activeRow: cur?.[0],
          });
          if (cur) {
            T.arrow(cur, [cur[0] - 1, cur[1]], { color: take[cur[0]][cur[1]] ? 'faint' : 'orange', width: take[cur[0]][cur[1]] ? 1.6 : 2.6, trim: 0.45 });
            if (takeDep) T.arrow(cur, takeDep, { color: take[cur[0]][cur[1]] ? 'green' : 'faint', width: take[cur[0]][cur[1]] ? 2.6 : 1.6, trim: 0.45 });
          }
          const P = f.path || []; for (let k = 0; k + 1 < P.length; k++) T.arrow(P[k], P[k + 1], { color: 'green', width: 2.6, trim: 0.45 });
          // item list
          const pick = cur ? knapPick(items, take, cur[0], cur[1]) : knapPick(items, take, n, W), inPick = new Set(pick);
          TI.draw({ value: (i, j) => (j === 0 ? items[i].w : j === 1 ? items[i].v : items[i].v / items[i].w), fill: (i, j) => (j < 2 ? ['blue', 0.07] : null), activeRow: cur ? cur[0] - 1 : undefined, rowLabelColor: (i) => (inPick.has(i + 1) && (done || cur) ? 'green' : null), textColor: (i, j) => (j < 2 ? 'blue' : 'muted') });
          // knapsack bar for the current cell
          const cap = cur ? cur[1] : W, used = pick.reduce((t, k) => t + items[k - 1].w, 0), val = pick.reduce((t, k) => t + items[k - 1].v, 0);
          Kb.setView([-0.6, Math.max(W, 8) + 0.6], [-1.2, 2.2]);
          Kb.rect(0, 0, cap, 1, { color: 'ink', width: 2, radius: 3 });
          if (cap < W) Kb.rect(cap, 0, W, 1, { color: 'faint', width: 1, dash: [4, 3], radius: 3 });
          let x = 0; pick.forEach((k) => { const w = items[k - 1].w; Kb.rect(x + 0.04, 0.06, x + w - 0.04, 0.94, { fill: COLS[(k - 1) % 5], fillAlpha: 0.45, color: COLS[(k - 1) % 5], width: 1.4, radius: 3 }); Kb.text(`${k}`, x + w / 2, 0.66, { align: 'center', size: 13, weight: 800, halo: false }); Kb.text(`v${items[k - 1].v}`, x + w / 2, 0.3, { align: 'center', size: 10.5, weight: 600, halo: false }); x += w; });
          for (let c = 0; c <= Math.max(W, 8); c++) if (c <= W) Kb.text(String(c), c, -0.32, { align: 'center', size: 9.5, color: 'muted' });
          Kb.text(`${cur && !done ? `best packing for (items 1..${cur[0]}, capacity ${cap})` : `optimal packing, capacity ${W}`}: weight ${used}, value ${val}`, 0, 1.65, { size: 12, weight: 700, color: cur ? 'ink' : 'green' });
        });
        v.legend([['gold', 'cell being filled', { area: true }], ['orange', 'skip: K[i−1, c]', { area: true }], ['green', 'take: K[i−1, c − wᵢ] + vᵢ', { area: true }]]);
        v.readout(() => {
          const W = WS.value, n = items.length, { K, take } = run, best = knapPick(items, take, n, W), wt = best.reduce((t, k) => t + items[k - 1].w, 0);
          const ord = items.map((it, k) => k + 1).sort((a, b) => items[b - 1].v / items[b - 1].w - items[a - 1].v / items[a - 1].w); let room = W, gv = 0; const g = [];
          for (const k of ord) if (items[k - 1].w <= room) { g.push(k); room -= items[k - 1].w; gv += items[k - 1].v; }
          return `$K[${n},${W}] = ${K[n][W]}$ with items {${best.join(', ')}} of weight ${wt} ≤ ${W} · greedy by value per weight takes {${g.join(', ')}}: ${gv} ${gv < K[n][W] ? '✗' : '✓'} · table of $(n+1)(W+1) = ${(n + 1) * (W + 1)}$ cells`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.11
    {
      num: '7.11',
      kind: 'Concept',
      name: 'Pseudo-polynomial time',
      statement: String.raw`An algorithm whose input contains integers runs in **pseudo-polynomial time** if its running time is bounded by a polynomial in the input length *and the numeric values* of the integers — equivalently, polynomial in the length of the input when the integers are written in **unary**. Since a number $W$ takes only about $\log_2 W$ bits in binary, such a bound can be exponential in the actual input length.

The knapsack dynamic program (7.10) runs in $\Theta(nW)$ time: polynomial in $n$ and $W$, but with $b=\lceil\log_2(W+1)\rceil$ bits for $W$ the table has about $n\,2^{b}$ cells, so each extra bit of capacity doubles the work (and doubling the number of bits squares it). This is no accident: knapsack is NP-hard (weakly), so a running time polynomial in $n\log W$ is not expected. Problems that remain NP-hard even with numbers written in unary are called *strongly* NP-hard.`,
      idea: String.raw`In the RAM model (1.2) the input length counts bits. Multiply every weight and the capacity by $2^k$: the instance is the same problem with the same optimal set, the input grows by only $k$ bits per number, but the table grows by a factor $2^k$ — each column of the original table is simply repeated $2^k$ times. On a log–log plot of work against input length, every polynomial is a straight line; the knapsack table curves upward past all of them when numbers are written in binary, and becomes a straight line of slope 1 when they are written in unary, where the input itself is as long as the numbers are large.`,
      caption: String.raw`Drag **extra bits $k$**: every weight and the capacity of the knapsack instance of 7.10 are multiplied by $2^k$. Left: the input in binary, one row of bit cells per number, growing by $k$ bits each. Middle: the DP table, drawn as copies of the original $6\times 12$ table, doubling with every bit. Right: work against input length on log–log axes, where the dashed polynomials $L, L^2, L^3$ are straight lines: binary input (blue) curves up past all of them, unary input (purple) stays on a line.`,
      deps: ['algo-7.10', 'algo-1.2'],
      see: ['toc-12.9', 'cplx-2.4', 'cplx-2.3'],
      refs: ['KT §6.4'],
      tags: ['complexity'],
      viz(v) {
        const items = [[1, 1], [2, 6], [5, 18], [6, 22], [7, 28]].map(([w, val]) => ({ w, v: val })), W0 = 11, n = items.length;
        const kS = v.slider('extra bits $k$', 0, 20, 3, { int: true });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, weight: 1.15, minWidth: 260, title: 'input: the weights and $W$ in binary' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, weight: 0.85, minWidth: 220, title: 'table size: copies of the $k = 0$ table' });
        const C = v.stage({ x: [10, 1e8], y: [10, 1e8], xlog: true, ylog: true, axes: 'box', height: 260, full: true, xlabel: 'input length L (symbols)', title: 'DP table cells against input length (log–log)' });
        const bits = (x) => Math.max(1, Math.ceil(Math.log2(x + 1)));
        const Lbin = (k) => items.reduce((t, it) => t + bits(it.w) + k, 0) + bits(W0) + k;
        const Lun = (k) => (items.reduce((t, it) => t + it.w, 0) + W0) * 2 ** k;
        const cells = (k) => (n + 1) * (W0 * 2 ** k + 1);
        const L0 = Lbin(0), C0 = cells(0);
        v.render(() => {
          const k = kS.value;
          // bit rows
          const rows = [...items.map((it, i) => [`w${sub(i + 1)}`, it.w]), ['W', W0]], maxLen = bits(W0) + 20;
          A.setView([-3.2, maxLen + 0.6], [-rows.length - 1.1, 0.6]);
          rows.forEach(([lab, val], r) => {
            const s = (val * 2 ** k).toString(2), y = -r - 0.5;
            A.text(lab, -1.8, y, { align: 'center', size: 13, weight: 700, color: lab === 'W' ? 'ink' : 'muted', math: true });
            for (let t = 0; t < s.length; t++) {
              const orig = t < s.length - k, one = s[t] === '1';
              A.rect(t + 0.06, y - 0.34, t + 0.94, y + 0.34, { fill: orig ? 'accent' : 'orange', fillAlpha: one ? 0.75 : 0.12, color: orig ? 'accent' : 'orange', width: 0.8, radius: 2 });
            }
            A.text(`${s.length} bits`, s.length + 0.4, y, { size: 10.5, color: 'muted' });
          });
          A.corner(`L = ${Lbin(k)} bits in all (${Lbin(0)} for k = 0)`, 'bl', { color: 'ink', weight: 600 });
          // tiled table: 2^k copies of the k = 0 table
          const copies = 2 ** k, cols = 2 ** Math.ceil(k / 2), rws = 2 ** Math.floor(k / 2);
          const ar = (W0 + 1) / (n + 1), tw = cols * ar, th = rws, scl = Math.min(B.width / (tw * 1.08), (B.height - 30) / (th * 1.08));
          B.setView([-0.04 * tw, B.width / scl - 0.04 * tw], [0.04 * th - B.height / scl, 0.04 * th]);
          const bw = ar, bh = 1;
          if (copies <= 1024) {
            for (let r = 0; r < rws; r++) for (let c = 0; c < cols; c++) B.rect(c * bw, -r * bh, (c + 1) * bw, -(r + 1) * bh, { fill: r === 0 && c === 0 ? 'accent' : 'orange', fillAlpha: r === 0 && c === 0 ? 0.5 : 0.28, color: copies <= 64 ? 'panel' : null, width: copies <= 64 ? 1 : 0, stroke: copies <= 64 });
          } else { B.rect(0, 0, cols * bw, -rws * bh, { fill: 'orange', fillAlpha: 0.32, stroke: false }); B.rect(0, 0, bw, -bh, { fill: 'accent', fillAlpha: 0.6, stroke: false }); }
          B.corner(`${big(copies)} ${copies === 1 ? 'copy' : 'copies'} · ${big(cells(k))} cells`, 'bl', { color: 'ink', weight: 600, plate: true });
          // chart
          for (const d of [1, 2, 3]) {
            C.fn((L) => C0 * (L / L0) ** d, { color: 'muted', dash: [5, 4], width: 1.2, alpha: 0.8 });
            const Lx = L0 * (1e8 / C0) ** (1 / d) / (d === 1 ? 30 : 3); if (Lx < 1e8) C.text(d === 1 ? 'L' : `L${d === 2 ? '²' : '³'}`, Lx, C0 * (Lx / L0) ** d, { dx: -6, dy: -8, size: 11.5, weight: 700, color: 'muted', align: 'right' });
          }
          const bin = [], un = []; for (let q = 0; q <= 20; q++) { bin.push([Lbin(q), cells(q)]); un.push([Lun(q), cells(q)]); }
          C.path(bin, { color: 'blue', width: 1.6, alpha: 0.6 }); C.dots(bin, { color: 'blue', r: 3 });
          C.path(un, { color: 'purple', width: 1.6, alpha: 0.6 }); C.dots(un, { color: 'purple', r: 3 });
          C.dot(Lbin(k), cells(k), { r: 6.5, color: 'blue' }); C.dot(Lun(k), cells(k), { r: 6.5, color: 'purple' });
          C.text(`binary, k = ${k}`, Lbin(k), cells(k), { dx: 10, dy: -4, size: 11.5, weight: 700, color: 'blue' });
          C.text(`unary, k = ${k}`, Lun(k), cells(k), { dx: 10, dy: 12, size: 11.5, weight: 700, color: 'purple' });
        });
        v.legend([['accent', 'original bits / table', { area: true }], ['orange', 'added by scaling ×2ᵏ', { area: true }], ['blue', 'binary input'], ['purple', 'unary input'], ['muted', 'polynomials L, L², L³', { dash: true }]]);
        v.readout(() => {
          const k = kS.value, W = W0 * 2 ** k, sc = items.map((it) => ({ w: it.w * 2 ** k, v: it.v }));
          let check = '';
          if (k <= 12) { const { K, take } = knapTable(sc, W); check = ` · DP run on the scaled instance: value ${K[n][W]}, items {${knapPick(sc, take, n, W).join(', ')}} — the same answer as for $k = 0$ ✓`; }
          else check = ' · (too big to run here: same answer, $2^{' + k + '}$ times the work)';
          return `$W = 11\\cdot 2^{${k}} = ${tbig(W)}$ · input ${Lbin(k)} bits (+${Lbin(k) - L0}) · table $(n+1)(W+1) = ${tbig(cells(k))}$ cells, about $2^{${k}}$ = ${r2(cells(k) / C0)}× the $k=0$ table${check}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.12
    {
      num: '7.12',
      kind: 'Algorithm',
      name: 'Making change with arbitrary coins',
      statement: String.raw`**Problem.** Given coin denominations $c_1<\dots<c_k$ (unlimited supply of each) and an amount $T$, pay exactly $T$ with as few coins as possible, or report that it cannot be done.

**Recurrence.** Let $C[a]$ be the fewest coins paying $a$. Then $C[0]=0$ and
$$C[a]=1+\min\{\,C[a-c_i] : c_i\le a\,\}\qquad(\min\varnothing=\infty).$$
Filling $C[0..T]$ left to right takes $O(kT)$ time — pseudo-polynomial (7.11) — and remembering the minimizing coin recovers an optimal set. The greedy rule “always take the largest coin that fits” is optimal for some coin systems (such as $1,5,10,25$) but not in general: for coins $\{1,3,4\}$ and $T=6$ it pays $4+1+1$, while $3+3$ uses two coins.`,
      idea: String.raw`The last coin of an optimal payment of $a$ is some $c_i$, and the other coins must form an optimal payment of $a-c_i$ (otherwise swapping in a better one would save coins): optimal substructure (7.3), with the amount as the only index. The subproblem DAG has an edge $a\to a-c_i$ for every coin, so increasing amounts is a valid order, and $C[T]$ is a shortest path from $T$ to $0$ in this DAG. Greedy commits to the largest coin without looking back; when a smaller coin leads to a much cheaper remainder, as with $6=3+3$, the commitment costs coins.`,
      caption: String.raw`Pick a coin system (or **type your own**, up to six coins) and a target. Each step fills one amount: arcs jump back by each coin, and the green one gives the minimum. The row below shows what the greedy rule would pay for every amount — red where it uses more coins than necessary (or fails) — and the coin pictures compare both payments for the target. Try **US coins**, where greedy is always optimal, and coins **3, 5**, where some amounts cannot be paid at all.`,
      deps: ['algo-7.2'],
      see: ['nt-1.14', 'algo-10.1'],
      refs: ['Erickson Ch. 3'],
      tags: ['dynamic programming'],
      viz(v) {
        const ci = v.input('coins', '1, 3, 4', { width: 140, onChange: () => S.reset({ at: 'end' }) });
        v.select('', [{ value: '1, 3, 4', label: '1, 3, 4' }, { value: '1, 5, 10, 25', label: 'US coins' }, { value: '1, 7, 10', label: '1, 7, 10' }, { value: '3, 5', label: '3, 5' }], '1, 3, 4', { onChange: (val) => { ci.set(val); S.reset({ at: 'end' }); } });
        const TS = v.slider('target $T$', 1, 30, 6, { int: true, onChange: () => S.reset({ at: 'end' }) });
        const coins = () => { const c = parseCoins(ci.value); return c.length ? c : [1]; };
        const A = v.stage({ x: [-0.7, 30.7], y: [-2.4, 3.2], axes: false, height: 230, full: true });
        const P = v.stage({ x: [0, 20], y: [-2, 2], axes: false, height: 150, full: true });
        const frames = () => {
          const cs = coins(), T = TS.value, { C, last } = coinSolve(cs, T), F = [];
          F.push({ a: 0, upto: 0, C, last, line: 1, note: 'Paying 0 takes no coins.' });
          for (let a = 1; a <= T; a++) {
            const cand = cs.filter((c) => c <= a).map((c) => `$C[${a - c}] + 1 = ${C[a - c] === Infinity ? '\\infty' : C[a - c] + 1}$ (coin ${c})`);
            F.push({ a, upto: a, C, last, line: [2, 3, 4], note: cand.length ? `Amount ${a}: ${cand.join(', ')}. ${C[a] === Infinity ? 'No way to pay it: ∞.' : `Best: **${C[a]}** with a last coin of ${last[a]}.`}` : `Amount ${a}: no coin is small enough, $C[${a}] = \\infty$.` });
          }
          if (C[T] < Infinity) {
            const pay = coinPick(last, T); let a = T;
            pay.forEach((c, t) => { a -= c; F.push({ a: T, upto: T, C, last, trace: pay.slice(0, t + 1), at: a, line: 5, hold: 0.9, note: `Give a coin of ${c}; ${a ? `${a} is left, whose best last coin is ${last[a]}` : 'nothing is left'}.` }); });
            F[F.length - 1].note += ` In all ${pay.length} coins: ${pay.join(' + ')} = ${T}.`;
          }
          return F;
        };
        const S = v.steps({ frames, code: COIN_CODE, codeTitle: 'Make-Change(coins, T)', codePos: 'below', speed: 2, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame, cs = coins(), T = TS.value, { C, last } = f, a0 = f.a;
          A.setView([-1.9, Math.max(T, 12) + 0.6], [-2.45, 3.3]);
          const tr = f.trace ? new Set() : null; if (f.trace) { let a = T; tr.add(a); f.trace.forEach((c) => { a -= c; tr.add(a); }); }
          A.text('C[a]', -1.15, 0, { align: 'center', size: 12, weight: 700, color: 'muted' });
          A.text('greedy', -1.15, -1.05, { align: 'center', size: 12, weight: 700, color: 'muted' });
          A.text('a', -1.15, -1.85, { align: 'center', size: 12, weight: 700, color: 'muted', math: true });
          for (let a = 0; a <= T; a++) {
            const shown = a <= f.upto, cur = a === a0 && !f.trace, g = a ? greedyCoins(cs, a) : [], gn = g ? g.length : Infinity, worse = shown && gn > C[a];
            const col = cur ? 'gold' : tr && tr.has(a) ? 'green' : shown ? 'accent' : 'faint';
            A.rect(a - 0.42, -0.4, a + 0.42, 0.4, { fill: col, fillAlpha: cur ? 0.5 : tr && tr.has(a) ? 0.4 : shown ? 0.12 : 0.04, color: col, width: cur ? 2.2 : 1, radius: 3 });
            if (shown) A.text(C[a] === Infinity ? '∞' : String(C[a]), a, 0, { align: 'center', size: 13, weight: 700, halo: false });
            if (shown && a) A.text(g ? String(gn) : '✗', a, -1.05, { align: 'center', size: 12, weight: worse ? 800 : 500, color: worse ? 'red' : 'muted' });
            if (worse) A.rect(a - 0.4, -1.4, a + 0.4, -0.7, { color: 'red', width: 1.4, radius: 3 });
            A.text(String(a), a, -1.85, { align: 'center', size: 10.5, color: 'muted' });
          }
          if (!f.trace && a0 > 0) for (const c of cs) if (c <= a0) {
            const best = c === last[a0] && C[a0] < Infinity, h = Math.min(14 + c * 9, 70);
            const mid = arcArrow(A, a0, 0.42, a0 - c, 0.42, -h, { color: best ? 'green' : 'muted', width: best ? 2.6 : 1.4, alpha: best ? 1 : 0.7, headSize: 7 });
            A.text(`−${c}`, mid[0], mid[1], { align: 'center', baseline: 'bottom', dy: -2, size: 11, weight: 700, color: best ? 'green' : 'muted' });
          }
          if (f.trace) { let a = T; f.trace.forEach((c) => { const mid = arcArrow(A, a, 0.42, a - c, 0.42, -Math.min(14 + c * 9, 70), { color: 'green', width: 2.6, headSize: 7 }); A.text(`−${c}`, mid[0], mid[1], { align: 'center', baseline: 'bottom', dy: -2, size: 11, weight: 700, color: 'green' }); a -= c; }); }
          // coin pictures
          const dp = C[T] < Infinity ? coinPick(last, T) : null, gr = greedyCoins(cs, T), maxC = Math.max(...cs);
          P.setView([-4.2, 16], [-1.9, 1.9]);
          const row = (lab, list, y, col) => {
            P.text(lab, -0.4, y, { align: 'right', size: 12.5, weight: 700, color: col });
            if (!list) { P.text('cannot pay this amount', 0.2, y, { size: 12.5, color: 'red', weight: 600 }); return; }
            let x = 0.2; list.forEach((c) => { const r = 0.28 + 0.34 * Math.sqrt(c / maxC); P.circle(x + r, y, r, { fill: 'gold', fillAlpha: 0.55, color: 'gold', width: 1.6 }); P.text(String(c), x + r, y, { align: 'center', size: 12, weight: 800, halo: false }); x += 2 * r + 0.12; });
            P.text(`${list.length} ${list.length === 1 ? 'coin' : 'coins'}`, x + 0.3, y, { size: 12.5, weight: 700, color: col });
          };
          if (f.upto === T) { row('dynamic programming', dp, 0.85, 'green'); row('greedy (largest first)', gr, -0.85, gr && dp && gr.length > dp.length ? 'red' : !gr && dp ? 'red' : 'muted'); }
          else P.text(`the payments for T = ${T} appear when the array is full`, 6, 0, { align: 'center', size: 12.5, color: 'muted' });
        });
        v.legend([['gold', 'amount being computed', { area: true }], ['green', 'best last coin / optimal payment'], ['red', 'greedy uses more coins than needed', { area: true }]]);
        v.readout(() => {
          const cs = coins(), T = TS.value, M = 30, { C } = coinSolve(cs, M), bad = [];
          for (let a = 1; a <= M; a++) { const g = greedyCoins(cs, a); if ((g ? g.length : Infinity) > C[a]) bad.push(a); }
          const dp = coinSolve(cs, T), pay = dp.C[T] < Infinity ? coinPick(dp.last, T) : null, g = greedyCoins(cs, T);
          return `Coins {${cs.join(', ')}}, $T = ${T}$: $C[${T}] = ${pay ? pay.length : '\\infty'}$${pay ? ` (${pay.join(' + ')})` : ''} · greedy: ${g ? `${g.length} (${g.join(' + ')})` : 'gets stuck'}${(g ? g.length : Infinity) > dp.C[T] ? ' ✗' : ' ✓'} · amounts up to ${M} where greedy is not optimal: ${bad.length ? `**${bad.length}** (${bad.slice(0, 10).join(', ')}${bad.length > 10 ? ', …' : ''})` : 'none ✓'} · work $O(kT) = ${cs.length}\\cdot${T}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.13
    {
      num: '7.13',
      kind: 'Algorithm',
      name: 'Matrix-chain multiplication',
      statement: String.raw`**Problem.** Matrices $A_1,\dots,A_n$ with $A_i$ of size $p_{i-1}\times p_i$ are to be multiplied; multiplying a $p\times q$ by a $q\times r$ matrix costs $pqr$ scalar multiplications. Choose the parenthesization of $A_1A_2\cdots A_n$ with the least total cost (the product is the same for all of them, by associativity).

**Recurrence.** Let $m[i,j]$ be the least cost of computing $A_i\cdots A_j$. Then $m[i,i]=0$ and
$$m[i,j]=\min_{i\le k<j}\big(m[i,k]+m[k+1,j]+p_{i-1}\,p_k\,p_j\big),$$
where $k$ is the position of the last multiplication. Filling the table by increasing chain length takes $\Theta(n^3)$ time and $\Theta(n^2)$ space, and the recorded split points $s[i,j]$ give an optimal parenthesization. There are $C_{n-1}$ (Catalan) parenthesizations, which grows like $4^n/n^{3/2}$.`,
      idea: String.raw`The last multiplication splits the chain into $A_i\cdots A_k$ and $A_{k+1}\cdots A_j$, computed independently; in an optimal plan both halves must be computed optimally (cut and paste, 7.3), and the final product costs $p_{i-1}p_kp_j$ whatever happened inside. So each interval looks at its $j-i$ split points, and every interval it reads is shorter: diagonals of increasing length form a valid order. Costs differ enormously between parenthesizations, because a bad order creates large intermediate matrices that a good one avoids.`,
      caption: String.raw`**Type the dimensions** $p_0,p_1,\dots,p_n$ (up to 8 matrices), or press **Randomize**. The strip draws each matrix to scale. The table fills diagonal by diagonal: for the gold cell, the orange pairs are the halves of the best split. Below, the best parenthesization of the current interval as a tree (each internal node is one multiplication with its cost) beside the worst parenthesization of the whole chain.`,
      deps: ['algo-7.3'],
      see: ['comb-1.8', 'algo-4.2'],
      refs: ['CLRS 4e §14.2'],
      credit: 'Godbole, 1973',
      tags: ['dynamic programming'],
      viz(v) {
        const di = v.input('dimensions', '30 35 15 5 10 20 25', { width: 200, onChange: () => S.reset({ at: 'end' }) });
        const rng = v.rng(4);
        v.button('Randomize', () => { const k = 5 + Math.floor(rng() * 3); di.set(Array.from({ length: k + 1 }, () => 5 * (1 + Math.floor(rng() * 12))).join(' ')); S.reset({ at: 'end' }); });
        const dims = () => { const p = String(di.value).split(/[^0-9]+/).map(Number).filter((x) => x >= 1 && x <= 999).slice(0, 9); return p.length >= 3 ? p : [30, 35, 15, 5]; };
        const st = v.stage({ x: [0, 10], y: [0, 2], axes: false, height: 105, full: true });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, weight: 1, minWidth: 320 });
        const tr = v.stage({ x: [0, 10], y: [-5, 1], axes: false, height: 290, weight: 1.25, minWidth: 360 });
        const T = v.table(s, { square: false, maxCell: 52, cellAspect: 1.45, size: 13, subSize: 9.5, subColor: 'purple' });
        const frames = () => {
          const p = dims(), n = p.length - 1, { m, s: sp } = chainSolve(p), order = [], F = [];
          for (let len = 2; len <= n; len++) for (let i = 1; i + len - 1 <= n; i++) order.push([i, i + len - 1]);
          F.push({ k: -1, order, line: 1, note: 'A single matrix costs nothing: $m[i,i] = 0$ on the diagonal.' });
          order.forEach(([i, j], k) => {
            const cand = []; for (let q = i; q < j; q++) cand.push(`k=${q}: ${m[i][q]} + ${m[q + 1][j]} + ${p[i - 1]}·${p[q]}·${p[j]} = ${m[i][q] + m[q + 1][j] + p[i - 1] * p[q] * p[j]}`);
            F.push({ k, order, cur: [i, j], line: [3, 4, 5], note: `$A_{${i}}\\cdots A_{${j}}$: ${cand.join('; ')}. Best $k = ${sp[i][j]}$, $m[${i},${j}] = ${m[i][j]}$.` });
          });
          F[F.length - 1].note += ` Done: the whole chain costs **${m[1][n]}**.`;
          return F;
        };
        const S = v.steps({ frames, code: CHAIN_CODE, codeTitle: 'Matrix-Chain-Order(p)', codePos: 'below', speed: 1.2, start: 11, still: 11 });
        const drawTree = (t, p, x0, col, title) => {
          const L = inorderLayout(t, (u) => (u.leaf != null ? u.leaf : null)), D = L.depth || 1;
          const Y = (y) => -0.25 + y * (3.9 / Math.max(D, 3));
          tr.text(title, x0 + (t.i + t.j) / 2, 0.55, { align: 'center', size: 12.5, weight: 700, color: col });
          (function edges(u) { if (u.leaf != null) return; const [x, y] = L.pos.get(u); for (const c of [u.l, u.r]) { const [a, b] = L.pos.get(c); tr.line(x0 + x, Y(y), x0 + a, Y(b), { color: col, width: 1.6, alpha: 0.7 }); edges(c); } })(t);
          (function nodes(u) {
            const [x, y] = L.pos.get(u);
            if (u.leaf != null) { tr.rect(x0 + x - 0.4, Y(y) - 0.24, x0 + x + 0.4, Y(y) + 0.24, { fill: col, fillAlpha: 0.18, color: col, width: 1.3, radius: 4 }); tr.text(`A${sub(u.leaf)}`, x0 + x, Y(y), { align: 'center', size: 12, weight: 700, halo: false }); return; }
            const cost = p[u.i - 1] * p[u.k] * p[u.j];
            tr.dot(x0 + x, Y(y), { r: 5.5, color: col });
            tr.text(big(cost), x0 + x, Y(y), { align: 'center', baseline: 'bottom', dy: -7, size: 10.5, weight: 700, color: 'ink' });
            nodes(u.l); nodes(u.r);
          })(t);
        };
        v.render(() => {
          const f = S.frame, p = dims(), n = p.length - 1, { m, s: sp } = chainSolve(p), W = chainSolve(p, true);
          const idx = new Map(f.order.map(([i, j], k) => [i * 100 + j, k])), filled = (i, j) => i === j || (idx.has(i * 100 + j) && idx.get(i * 100 + j) <= f.k);
          // matrix strip, drawn to scale
          const mx = Math.max(...p), sc = (d) => 0.25 + 1.35 * Math.sqrt(d / mx), tot = p.slice(1).reduce((t, d) => t + sc(d), 0) + 0.45 * n;
          st.setView([-0.3, Math.max(tot, 8) + 0.3], [-0.35, 1.85]);
          let x = 0;
          for (let i = 1; i <= n; i++) {
            const w = sc(p[i]), h = sc(p[i - 1]), inCur = f.cur && i >= f.cur[0] && i <= f.cur[1];
            st.rect(x, 1.6 - h, x + w, 1.6, { fill: inCur ? 'gold' : 'accent', fillAlpha: inCur ? 0.4 : 0.15, color: inCur ? 'gold' : 'accent', width: 1.3 });
            st.text(`A${sub(i)}`, x + w / 2, 1.6 - h / 2, { align: 'center', size: 11.5, weight: 700, halo: false });
            st.text(`${p[i - 1]}×${p[i]}`, x + w / 2, -0.14, { align: 'center', size: 10, color: 'muted' });
            x += w + 0.45;
          }
          // table
          const cur = f.cur, bk = cur ? sp[cur[0]][cur[1]] : null;
          T.draw({
            rows: n, cols: n, rowLabels: (r) => `i=${r + 1}`, colLabels: (c) => `j=${c + 1}`,
            value: (r, c) => (c >= r && filled(r + 1, c + 1) ? m[r + 1][c + 1] : null),
            format: (val) => (val == null ? null : big(val)),
            fill: (r, c) => (c < r ? ['faint', 0.18] : cur && cur[0] === r + 1 && cur[1] === c + 1 ? ['gold', 0.5] : cur && ((r + 1 === cur[0] && c + 1 === bk) || (r + 1 === bk + 1 && c + 1 === cur[1])) ? ['orange', 0.4] : cur && ((r + 1 === cur[0] && c + 1 < cur[1] && c >= r) || (c + 1 === cur[1] && r + 1 > cur[0] && c >= r)) ? ['orange', 0.1] : null),
            sub: (r, c) => (c > r && filled(r + 1, c + 1) ? `k=${sp[r + 1][c + 1]}` : ''),
            highlight: cur ? [[cur[0] - 1, cur[1] - 1]] : [],
          });
          // trees: best for the current interval, worst for the whole chain
          const [ci, cj] = cur || [1, n], bt = chainTree(sp, ci, cj), wt = chainTree(W.s, 1, n);
          tr.setView([0.2, n + 1.6 + n + 0.8], [-4.6, 0.95]);
          drawTree(bt, p, 0, 'green', `best for A${sub(ci)}…A${sub(cj)}: ${big(m[ci][cj])}`);
          drawTree(wt, p, n + 1, 'red', `worst for the chain: ${big(W.m[1][n])}`);
        });
        v.legend([['gold', 'interval being computed', { area: true }], ['orange', 'the two halves of its best split', { area: true }], ['green', 'best parenthesization'], ['red', 'worst parenthesization']]);
        v.readout(() => {
          const p = dims(), n = p.length - 1, { m, s: sp } = chainSolve(p), W = chainSolve(p, true);
          return `Best: $${parenTeX(sp, 1, n)}$ with **${big(m[1][n])}** scalar multiplications · worst: $${parenTeX(W.s, 1, n)}$ with ${big(W.m[1][n])} (${r2(W.m[1][n] / m[1][n])}× more) · ${catalan(n - 1)} parenthesizations in all; the table has ${n * (n - 1) / 2} entries above the diagonal`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.14
    {
      num: '7.14',
      kind: 'Algorithm',
      name: 'Optimal binary search trees',
      statement: String.raw`**Problem.** Keys $k_1<\dots<k_n$ are searched with frequencies $f_1,\dots,f_n$. A search for $k_r$ in a binary search tree costs $1+\mathrm{depth}(k_r)$ comparisons. Find a binary search tree on these keys minimizing the total cost $\sum_r f_r\,(1+\mathrm{depth}(k_r))$.

**Recurrence.** Let $\mathrm{cost}[i,j]$ be the optimum for the keys $k_i,\dots,k_j$ ($0$ if $i>j$) and $F(i,j)=f_i+\dots+f_j$. Then
$$\mathrm{cost}[i,j]=F(i,j)+\min_{i\le r\le j}\big(\mathrm{cost}[i,r-1]+\mathrm{cost}[r+1,j]\big),$$
because making $k_r$ the root pushes every other key of the interval one level down. Filling intervals by increasing length takes $O(n^3)$ time ($O(n^2)$ with Knuth's monotonicity of the optimal roots); the recorded roots build the tree. (CLRS also weights unsuccessful searches; the recurrence has the same shape.)`,
      idea: String.raw`The keys of a subtree form a contiguous interval, and each subtree of an optimal tree must itself be optimal for its keys (cut and paste, 7.3); so it suffices to try every root $r$ and combine the optimal trees of the two sides. The extra $F(i,j)$ charges one comparison at the root to every search in the interval. Like matrix chains (7.13), the subproblems are intervals evaluated by length. Intuition says “put the most frequent key at the root”, but that greedy rule can be far from optimal: a popular key at the edge of the key range unbalances everything else.`,
      caption: String.raw`**Drag the bars** to set each key's search frequency. Step through the cost table, filled by interval length (the purple letter is the best root); the tree below the bars shows the optimal subtree for the current interval, with node size proportional to frequency, so popular keys rise toward the top. Use **tree shown** to compare a perfectly balanced tree and the greedy “most frequent key at the root” tree.`,
      deps: ['algo-7.13', 'algo-5.2'],
      see: ['algo-10.10', 'algo-6.7'],
      refs: ['CLRS 4e §14.5', 'Erickson Ch. 3'],
      credit: 'Knuth, 1971',
      tags: ['dynamic programming', 'search trees'],
      viz(v) {
        const f = [9, 4, 9, 3, 1, 4, 4], n = f.length;
        const showT = v.select('tree shown', [{ value: 'opt', label: 'optimal' }, { value: 'bal', label: 'balanced' }, { value: 'greedy', label: 'greedy (heaviest at root)' }], 'opt');
        const A = v.stage({ x: [0.3, n + 0.7], y: [-4.95, 3.6], axes: false, height: 330, weight: 1.15, minWidth: 340 });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, minWidth: 320 });
        const T = v.table(s, { rows: n, cols: n, maxCell: 46, size: 12.5, rowLabels: (r) => KEYS[r], colLabels: (c) => KEYS[c], cornerLabel: 'i \\ j', subColor: 'purple', subSize: 10 });
        const frames = () => {
          const R = obstSolve(f), order = [], F = [];
          for (let len = 1; len <= n; len++) for (let i = 1; i + len - 1 <= n; i++) order.push([i, i + len - 1]);
          order.forEach(([i, j], k) => {
            const cs = []; for (let r = i; r <= j; r++) cs.push(`${KEYS[r - 1]}: ${R.C[i][r - 1] + R.C[r + 1][j]}`);
            F.push({ k, order, cur: [i, j], line: [3, 4], note: `Keys ${KEYS[i - 1]}…${KEYS[j - 1]}: total frequency ${R.Wt[i][j]}; subtrees for each root — ${cs.join(', ')}. Best root **${KEYS[R.R[i][j] - 1]}**, cost ${R.C[i][j]}.` });
          });
          F.push({ k: order.length, order, done: true, line: 5, hold: 2, note: `Root of the whole tree: ${KEYS[R.R[1][n] - 1]}. Total cost ${R.C[1][n]}, an average of ${r2(R.C[1][n] / R.Wt[1][n])} comparisons per search.` });
          return F;
        };
        const S = v.steps({ frames, code: OBST_CODE, codeTitle: 'Optimal-BST(f)', codePos: 'below', speed: 2, start: 'end', still: 'end' });
        let drag = null;
        A.onDrag((x, y, ph) => {
          if (ph === 'start') { const k = Math.round(x); drag = k >= 1 && k <= n && y > 0 ? k : null; }
          else if (ph === 'move' && drag != null) { const val = clamp(Math.round((y - 0.4) / 0.28), 0, 10); if (val !== f[drag - 1]) { f[drag - 1] = val; S.reset({ at: 'keep' }); } }
          else if (ph === 'end') drag = null;
        });
        v.render(() => {
          const fr = S.frame, R = obstSolve(f), idx = new Map(fr.order.map(([i, j], k) => [i * 100 + j, k])), filled = (i, j) => idx.get(i * 100 + j) <= fr.k;
          const cur = fr.done ? null : fr.cur, [ci, cj] = cur || [1, n];
          // bars
          for (let k = 1; k <= n; k++) {
            const inI = k >= ci && k <= cj;
            A.rect(k - 0.3, 0.4, k + 0.3, 0.4 + f[k - 1] * 0.28, { fill: inI ? 'accent' : 'muted', fillAlpha: inI ? 0.45 : 0.15, color: inI ? 'accent' : 'muted', width: 1.2, radius: 3 });
            A.text(String(f[k - 1]), k, 0.4 + f[k - 1] * 0.28, { align: 'center', baseline: 'bottom', dy: -2, size: 11, weight: 700, color: 'muted' });
            A.text(KEYS[k - 1], k, 0.12, { align: 'center', size: 12.5, weight: 800, color: inI ? 'ink' : 'muted' });
          }
          A.line(0.5, 0.4, n + 0.5, 0.4, { color: 'muted', width: 1 });
          // tree
          const which = showT.value, t = which === 'bal' ? bstBalanced(1, n) : which === 'greedy' ? bstGreedy(f, 1, n) : cur ? bstFromRoots(R.R, ci, cj) : bstFromRoots(R.R, 1, n);
          const L = inorderLayout(t, (u) => u.key), dy = 3.85 / Math.max(L.depth, 3), Y = (y) => -0.5 + y * dy, fm = Math.max(1, ...f);
          if (which === 'opt' && cur) A.rect(ci - 0.45, -4.85, cj + 0.45, -0.12, { fill: 'gold', fillAlpha: 0.06, color: 'gold', width: 1, dash: [4, 3], radius: 6 });
          (function ed(u) { if (!u) return; const [x, y] = L.pos.get(u); for (const c of [u.l, u.r]) if (c) { const [a, b] = L.pos.get(c); A.line(x, Y(y), a, Y(b), { color: 'muted', width: 1.6 }); ed(c); } })(t);
          const col = which === 'opt' ? 'green' : which === 'bal' ? 'blue' : 'red';
          (function nd(u) { if (!u) return; const [x, y] = L.pos.get(u), r = 7 + 9 * Math.sqrt(f[u.key - 1] / fm); A.dot(x, Y(y), { r, color: col, alpha: 0.9 }); A.text(KEYS[u.key - 1], x, Y(y), { align: 'center', size: 12, weight: 800, color: 'panel', halo: false }); nd(u.l); nd(u.r); })(t);
          const tc = bstCost(t, f);
          A.corner(`${which === 'opt' ? (cur ? `optimal tree for ${KEYS[ci - 1]}…${KEYS[cj - 1]}` : 'optimal tree') : which === 'bal' ? 'balanced tree' : 'greedy tree'}: cost ${tc}`, 'tr', { color: col, weight: 700 });
          // table
          T.draw({
            value: (r, c) => (c >= r && filled(r + 1, c + 1) ? R.C[r + 1][c + 1] : null),
            sub: (r, c) => (c >= r && filled(r + 1, c + 1) ? KEYS[R.R[r + 1][c + 1] - 1] : ''),
            fill: (r, c) => (c < r ? ['faint', 0.18] : cur && cur[0] === r + 1 && cur[1] === c + 1 ? ['gold', 0.5] : cur && ((r + 1 === cur[0] && c + 1 === R.R[cur[0]][cur[1]] - 1) || (r + 1 === R.R[cur[0]][cur[1]] + 1 && c + 1 === cur[1])) ? ['orange', 0.4] : null),
            highlight: cur ? [[cur[0] - 1, cur[1] - 1]] : fr.done ? [[0, n - 1, 'green']] : [],
          });
        });
        v.legend([['accent', 'frequencies (drag)', { area: true }], ['gold', 'interval being computed', { area: true }], ['orange', 'its two sub-intervals for the best root', { area: true }]]);
        v.readout(() => {
          const R = obstSolve(f), o = R.C[1][n], b = bstCost(bstBalanced(1, n), f), g = bstCost(bstGreedy(f, 1, n), f), tot = R.Wt[1][n] || 1;
          return `Optimal cost **${o}** (${r2(o / tot)} comparisons per search) · perfectly balanced tree: ${b} ${b > o ? `(+${r2(100 * (b - o) / o)}%)` : '✓'} · greedy, most frequent key at the root: ${g} ${g > o ? `(+${r2(100 * (g - o) / o)}%)` : '✓'} · ${n * (n + 1) / 2} intervals, each trying every root`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.15
    {
      num: '7.15',
      kind: 'Algorithm',
      name: 'Dynamic programming on trees: independent sets',
      statement: String.raw`**Problem.** In a tree $T$ with vertex weights $w(v)\ge 0$, find an independent set (no two chosen vertices adjacent) of maximum total weight. (In general graphs this problem is NP-hard.)

**Algorithm.** Root the tree. For each vertex $v$ with children $c$, let $\mathrm{in}(v)$ be the best weight in the subtree of $v$ using $v$, and $\mathrm{out}(v)$ the best not using $v$. In postorder,
$$\mathrm{in}(v)=w(v)+\sum_{c}\mathrm{out}(c),\qquad \mathrm{out}(v)=\sum_c\max\big(\mathrm{in}(c),\mathrm{out}(c)\big),$$
and the answer is $\max(\mathrm{in}(r),\mathrm{out}(r))$ at the root $r$. This takes $O(n)$ time; a top-down pass that takes $v$ when its parent is not taken and $\mathrm{in}(v)\ge\mathrm{out}(v)$ recovers an optimal set.`,
      idea: String.raw`Subtrees are the subproblems: the subtrees of the children of $v$ interact only through $v$ itself, so once we know whether $v$ is in the set, the children's subtrees can be optimized independently — two numbers per vertex suffice (optimal substructure, 7.3). If $v$ is taken, its children must not be; if it is not, each child is free to do whatever is best for its subtree. Postorder is a topological order of this DAG of subtrees. The independence of the subtrees is exactly what a cycle destroys: with an extra edge, two vertices in different subtrees can conflict, and the tree recurrence no longer sees it.`,
      caption: String.raw`Step through the postorder: each vertex shows its weight, with **in** (green, best with the vertex) and **out** (orange, best without it) underneath. The top-down pass then lights up the optimal set. **Edit the tree**: choose what a click does — raise or lower a weight, add a child, or remove a subtree. Turn on the **extra edge** to close a cycle between two chosen vertices: the tree recurrence ignores it, and its answer is no longer independent.`,
      deps: ['algo-7.2'],
      see: ['toc-13.8', 'bioinf-5.11', 'algo-14.7'],
      refs: ['Erickson Ch. 3', 'KT §10.2'],
      tags: ['dynamic programming', 'trees'],
      viz(v) {
        const W = { 0: 3, 1: 5, 2: 2, 3: 4, 4: 6, 5: 1, 6: 4, 7: 3, 8: 2, 9: 5, 10: 1 }, par = { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 2, 7: 2, 8: 3, 9: 6, 10: 6 };
        let nextId = 11; const NAME = {}; const POOL = 'abcdefghijklmnopqrstuvwxyz';
        Object.keys(W).forEach((k) => { NAME[k] = POOL[k]; });
        const nm = (u) => NAME[u];
        const act = v.select('click a vertex to', [{ value: 'up', label: 'raise weight' }, { value: 'down', label: 'lower weight' }, { value: 'add', label: 'add a child' }, { value: 'del', label: 'remove subtree' }], 'up');
        const extra = v.toggle('extra edge (makes a cycle)', false);
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340 });
        const G = v.graph(s, { nodes: [], edges: [], layout: 'none', r: 15, draggable: false, fontSize: 13 });
        const ids = () => Object.keys(W).map(Number);
        const kids = (u) => ids().filter((k) => par[k] === u);
        function rebuild() {
          G.set({ nodes: ids().map((id) => ({ id })), edges: ids().filter((k) => k in par).map((k) => ({ from: par[k], to: k })) }).layout('tree', { root: 0 });
          const ys = G.nodes.map((q) => q.y), lo = Math.min(...ys), hi = Math.max(...ys); // leave room under the lowest row for the in | out labels
          G.nodes.forEach((q) => { q.y = hi > lo ? 0.15 + 0.74 * (q.y - lo) / (hi - lo) : 0.6; });
        }
        rebuild();
        const solve = () => {
          const inV = {}, outV = {}, order = [];
          (function post(u) { for (const c of kids(u)) post(c); inV[u] = W[u] + kids(u).reduce((t, c) => t + outV[c], 0); outV[u] = kids(u).reduce((t, c) => t + Math.max(inV[c], outV[c]), 0); order.push(u); })(0);
          const chosen = new Set(), dec = [];
          (function down(u, pTaken) { const take = !pTaken && inV[u] >= outV[u]; if (take) chosen.add(u); dec.push([u, take]); for (const c of kids(u)) down(c, take); })(0, false);
          return { inV, outV, order, chosen, dec };
        };
        const frames = () => {
          const R = solve(), F = [];
          R.order.forEach((u, k) => {
            const cs = kids(u);
            F.push({ R, k, cur: u, line: [1, 2, 3], note: cs.length ? `Vertex ${nm(u)} (weight ${W[u]}): in = ${W[u]} + ${cs.map((c) => R.outV[c]).join(' + ')} = **${R.inV[u]}**; out = ${cs.map((c) => `max(${R.inV[c]}, ${R.outV[c]})`).join(' + ')} = **${R.outV[u]}**.` : `Leaf ${nm(u)}: in = its weight ${W[u]}, out = 0.` });
          });
          R.dec.forEach(([u, tk], t) => F.push({ R, k: R.order.length, dec: t, cur: u, line: t === 0 ? [4, 5] : 5, hold: 0.7, note: `${t === 0 ? `Root: best = max(${R.inV[0]}, ${R.outV[0]}) = **${Math.max(R.inV[0], R.outV[0])}**. ` : ''}Vertex ${nm(u)}: ${tk ? 'taken' : par[u] != null && R.chosen.has(par[u]) ? 'its parent is taken, so it is not' : `not taken (out ${R.outV[u]} > in ${R.inV[u]})`}.` }));
          F.push({ R, k: R.order.length, dec: R.dec.length - 1, line: [4, 5], hold: 2, note: `Done: the green vertices {${[...R.chosen].map(nm).sort().join(', ')}} form an independent set of weight **${Math.max(R.inV[0], R.outV[0])}**, computed with two numbers per vertex in one postorder pass.` });
          return F;
        };
        const S = v.steps({ frames, code: TREE_IS_CODE, codeTitle: 'Tree-Independent-Set(T)', codePos: 'below', speed: 2, start: 'end', still: 'end' });
        G.onClick = ({ node }) => {
          if (!node) return true; const u = node.id, a = act.value;
          if (a === 'up') W[u] = Math.min(W[u] + 1, 20); else if (a === 'down') W[u] = Math.max(W[u] - 1, 0);
          else if (a === 'add' && ids().length < 16) { W[nextId] = 3; par[nextId] = u; NAME[nextId] = [...POOL].find((ch) => !Object.values(NAME).includes(ch)); nextId++; rebuild(); }
          else if (a === 'del' && u !== 0) { const gone = [u]; for (let q = 0; q < gone.length; q++) for (const c of kids(gone[q])) gone.push(c); gone.forEach((k) => { delete W[k]; delete par[k]; delete NAME[k]; }); rebuild(); }
          S.reset({ at: 'end' }); return true;
        };
        const extraEdge = (R) => {
          let best = null, bv = -1; const ch = [...R.chosen];
          for (let a = 0; a < ch.length; a++) for (let b = a + 1; b < ch.length; b++) { const x = ch[a], y = ch[b]; if (par[x] === y || par[y] === x) continue; if (W[x] + W[y] > bv) { bv = W[x] + W[y]; best = [x, y]; } }
          return best;
        };
        const brute = (edges) => {
          const L = ids(), n = L.length, pos = new Map(L.map((id, k) => [id, k])), E = edges.map(([a, b]) => [pos.get(a), pos.get(b)]); let best = 0;
          for (let m = 0; m < 1 << n; m++) { let ok = true; for (const [a, b] of E) if ((m >> a) & 1 && (m >> b) & 1) { ok = false; break; } if (!ok) continue; let t = 0; for (let k = 0; k < n; k++) if ((m >> k) & 1) t += W[L[k]]; if (t > best) best = t; }
          return best;
        };
        let info = {};
        v.render(() => {
          const f = S.frame, R = f.R, done = f.k >= R.order.length, computed = new Set(R.order.slice(0, Math.min(f.k + 1, R.order.length)));
          const decided = new Map(f.dec != null ? R.dec.slice(0, f.dec + 1) : []);
          const ex = extra.value ? extraEdge(R) : null;
          if (ex) {
            const A = G.node(ex[0]), B = G.node(ex[1]);
            arcArrow(s, A.x, A.y, B.x, B.y, 40, { color: 'red', width: 2.6, dash: [6, 4], head: false });
          }
          G.draw({
            nodeLabel: (id) => String(W[id]),
            nodeFill: (id) => (f.cur === id ? 'gold' : decided.get(id) ? 'green' : null),
            nodeColor: (id) => (decided.has(id) && !decided.get(id) ? 'muted' : kids(f.cur).includes(id) && !done ? 'orange' : 'accent'),
            edgeColor: (e) => (decided.get(e.from) && decided.get(e.to) ? 'red' : null),
            nodeNote: (id) => nm(id), noteColor: 'muted', notePos: 'nw',
          });
          const r = 15;
          for (const nd of G.nodes) {
            if (!computed.has(nd.id)) continue;
            const x = nd.x, y = nd.y;
            s.text(String(R.inV[nd.id]), x, y, { dy: r + 9, dx: -3, align: 'right', size: 11.5, weight: 800, color: 'green' });
            s.text('|', x, y, { dy: r + 9, align: 'center', size: 11, color: 'faint' });
            s.text(String(R.outV[nd.id]), x, y, { dy: r + 9, dx: 3, align: 'left', size: 11.5, weight: 800, color: 'orange' });
          }
          const treeE = ids().filter((k) => k in par).map((k) => [par[k], k]);
          info = { R, ex, bTree: brute(treeE), bEx: ex ? brute([...treeE, ex]) : null };
        });
        v.legend([['green', 'in(v): best with v / chosen', { dot: true }], ['orange', 'out(v): best without v', { dot: true }], ['gold', 'current vertex', { dot: true }], ['red', 'extra edge', { dash: true }]]);
        v.readout(() => {
          const { R, ex, bTree, bEx } = info, best = Math.max(R.inV[0], R.outV[0]), n = ids().length;
          const head = `${n} vertices · tree DP: **${best}** with {${[...R.chosen].map(nm).sort().join(', ')}} · brute force over all $2^{${n}}$ subsets: ${bTree} ${bTree === best ? '✓' : '✗'}`;
          if (!ex) return head + (extra.value ? ' · (no two non-adjacent chosen vertices to join)' : '');
          return `${head} · with the extra edge ${nm(ex[0])}–${nm(ex[1])} both ends are chosen, so the DP's set is **not independent** ✗; the true optimum of the graph with a cycle is ${bEx}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.16
    {
      num: '7.16',
      kind: 'Algorithm',
      name: 'Held–Karp: travelling salesman in O(n² 2ⁿ)',
      statement: String.raw`**Problem (TSP).** Given $n$ cities with distances $d(i,j)$, find a shortest tour visiting every city once and returning to the start.

**Held–Karp.** Fix city $0$ as the start. For every set $S\subseteq\{1,\dots,n-1\}$ and $j\in S$, let $D[S,j]$ be the length of a shortest path that starts at $0$, visits exactly the cities of $S$, and ends at $j$. Then $D[\{j\},j]=d(0,j)$ and
$$D[S,j]=\min_{i\in S\setminus\{j\}}\big(D[S\setminus\{j\},i]+d(i,j)\big),$$
and the optimal tour has length $\min_j\big(D[\{1,\dots,n-1\},j]+d(j,0)\big)$. There are $(n-1)2^{n-2}$ table entries, each a minimum over at most $n-2$ terms: $O(n^2 2^n)$ time and $O(n2^n)$ space, against the $(n-1)!$ orderings examined by brute force. Exponential, but exponentially better; no algorithm with running time $O(1.9999^n)$ is known for general TSP.`,
      idea: String.raw`What matters about a partial tour, for the purpose of finishing it, is only *which* cities it has visited and *where* it currently is — not the order in which it visited them. So all the $(|S|-1)!$ orderings of a set $S$ ending at $j$ collapse into one table entry holding the best of them, and the best path to $(S,j)$ consists of a best path to $(S\setminus\{j\},i)$ for some last-but-one city $i$, plus one edge (optimal substructure, 7.3). Sets are processed by increasing size, a topological order. The price is a table indexed by subsets, so the method is exponential: TSP is NP-hard, and Held–Karp trades $n!$ for $n^2 2^n$.`,
      caption: String.raw`**Drag the cities** and choose how many. The table has one row per set $S$ of visited cities and one column per last city $j$; step through it set by set. On the map, gold is the best path for the current row (from city 0 through $S$), and **clicking a table cell** draws the path behind that entry in purple. At the end the optimal tour is read back (green). The chart counts operations on a log scale: brute force (red) against Held–Karp (blue), with the time each would take at a billion operations per second.`,
      deps: ['algo-7.2'],
      see: ['toc-13.10', 'cplx-12.1', 'algo-14.16'],
      refs: ['Erickson notes: Fast Exponential Algorithms'],
      credit: 'Bellman, 1962; Held & Karp, 1962',
      tags: ['dynamic programming', 'tsp'],
      viz(v) {
        const NMAX = 7, rng = v.rng(9), init = [[1.2, 4.6], [3.2, 6.1], [6.4, 5.8], [8.6, 4.2], [7.4, 1.3], [3.9, 0.9], [5.2, 3.4]];
        const nS = v.slider('cities $n$', 4, NMAX, 5, { int: true, onChange: () => { sel = null; S.reset({ at: 'keep' }); } });
        const M = v.stage({ x: [0, 10], y: [0, 7], axes: false, equal: true, height: 330, weight: 1, minWidth: 300 });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, minWidth: 300 });
        const C = v.stage({ x: [3, 20], y: [1, 1e21], ylog: true, axes: 'box', height: 230, full: true, xlabel: 'n (cities)', title: 'operations (log scale): brute force $(n-1)!\\cdot n$ vs Held–Karp $\\approx (n-1)(n-2)\\,2^{n-3}$' });
        const H = init.map(([x, y], k) => M.handle(x, y, { color: k ? 'accent' : 'ink', r: 9, onDrag: () => { sel = null; S.reset({ at: 'end' }); } }));
        const T = v.table(s, { square: false, maxCell: 26, cellAspect: 2, size: 12, labelSize: 11 });
        let sel = null, run;
        const pts = () => H.slice(0, nS.value).map((h) => [h.x, h.y]);
        const frames = () => {
          run = heldKarp(pts()); const F = [], { subs, D, Pa } = run;
          subs.forEach((Sm, r) => {
            const js = []; for (let j = 1; j < run.n; j++) if ((Sm >> (j - 1)) & 1) js.push(j);
            const bj = js.reduce((a, b) => (D[Sm][b] < D[Sm][a] ? b : a));
            F.push({ r, Sm, bj, line: popc(Sm) === 1 ? 1 : [2, 3, 4], note: `$S = ${setLab(Sm).replace(/[{}]/g, (c) => '\\' + c)}$: ${js.map((j) => `$D[S,${j}] = ${r2(D[Sm][j])}$${popc(Sm) > 1 ? ` (via ${Pa[Sm][j]})` : ''}`).join(', ')}.` });
          });
          F.push({ r: subs.length, done: true, line: 5, note: `All ${subs.length} rows filled. Close the tour from the best last city: length **${r2(run.best)}**.` });
          F.push({ r: subs.length, done: true, tour: true, line: 6, hold: 2, note: `Following the minimizing predecessors back gives the tour ${run.tour.join(' → ')} of length **${r2(run.best)}**.` });
          return F;
        };
        const S = v.steps({ frames, code: HK_CODE, codeTitle: 'Held–Karp(d)', codePos: 'below', speed: 2, start: 9, still: 9 });
        s.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) { const Sm = run.subs[c.i], j = c.j + 1; sel = (Sm >> (j - 1)) & 1 ? [Sm, j] : null; } });
        v.render(() => {
          const f = S.frame, n = nS.value, P = pts(), { subs, D } = run, rows = subs.length;
          H.forEach((h, k) => { h.visible = k < n; });
          // table
          const big1 = rows <= 15, tourCells = new Set(f.tour ? run.cellsPath.map(([Sm, j]) => Sm * 10 + j) : []);
          let mx = 0; subs.forEach((Sm) => { for (const j in D[Sm]) mx = Math.max(mx, D[Sm][j]); });
          T.draw({
            rows, cols: n - 1, rowLabels: (r) => setLab(subs[r]), colLabels: (c) => `j=${c + 1}`, cornerLabel: 'S',
            value: (r, c) => (big1 && r <= f.r && D[subs[r]][c + 1] != null ? r2(D[subs[r]][c + 1]) : null),
            fill: (r, c) => { const Sm = subs[r], j = c + 1; if (D[Sm][j] == null) return ['faint', 0.22]; if (sel && sel[0] === Sm && sel[1] === j) return ['purple', 0.5]; if (tourCells.has(Sm * 10 + j)) return ['green', 0.5]; if (r === f.r && !f.done) return j === f.bj ? ['gold', 0.6] : ['gold', 0.25]; if (r > f.r) return null; return [...v.ramp(0.12 + 0.5 * D[Sm][j] / mx, 'accent'), 0.9]; },
            activeRow: f.done ? undefined : f.r, size: big1 ? 12 : 9,
          });
          // map
          const d = (a, b) => Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]);
          for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) M.line(P[a][0], P[a][1], P[b][0], P[b][1], { color: 'faint', width: 0.8, alpha: 0.5 });
          const drawPath = (path, col, w, close) => { const q = path.map((k) => P[k]); if (close) q.push(P[path[0]]); M.path(q, { color: col, width: w }); };
          if (f.tour) drawPath(run.tour, 'green', 4, false);
          else if (!f.done && f.Sm) drawPath(hkPath(run, f.Sm, f.bj), 'gold', 3.6, false);
          if (sel) drawPath(hkPath(run, sel[0], sel[1]), 'purple', 2.6, false);
          const inS = f.Sm && !f.done ? f.Sm : 0;
          for (let k = 0; k < n; k++) M.text(String(k), P[k][0], P[k][1], { dx: 13, dy: -11, size: 13, weight: 800, color: k === 0 ? 'ink' : (inS >> (k - 1)) & 1 ? 'gold' : 'accent' });
          // chart
          const bf = [], hk = []; for (let q = 3; q <= 20; q++) { bf.push([q, fact(q - 1) * q]); hk.push([q, hkOps(q)]); }
          const REF = [[1e9, '1 second'], [3.6e12, '1 hour'], [3.15e16, '1 year'], [3.15e19, '1000 years']];
          REF.forEach(([y, lab]) => { C.hline(y, { color: 'muted', dash: [3, 4], width: 1, alpha: 0.7 }); C.text(`${lab} at 10⁹ operations/s`, 8.2, y, { align: 'left', baseline: 'bottom', dy: -2, size: 10.5, color: 'muted', weight: 600 }); });
          C.path(bf, { color: 'red', width: 1.6, alpha: 0.6 }); C.dots(bf, { color: 'red', r: 3 });
          C.path(hk, { color: 'blue', width: 1.6, alpha: 0.6 }); C.dots(hk, { color: 'blue', r: 3 });
          C.vline(n, { color: 'gold', dash: [4, 3], width: 1.3 });
          C.dot(n, fact(n - 1) * n, { r: 6, color: 'red' }); C.dot(n, hkOps(n), { r: 6, color: 'blue' });
          C.text('brute force', 15.2, fact(14) * 15, { dx: -8, size: 11.5, weight: 700, color: 'red', align: 'right' });
          C.text('Held–Karp', 17, hkOps(17), { dy: 14, size: 11.5, weight: 700, color: 'blue', align: 'center' });
        });
        v.legend([['gold', 'current set S and its best path', { area: true }], ['purple', 'path of a clicked cell'], ['green', 'optimal tour'], ['faint', 'j ∉ S (no entry)', { area: true }]]);
        v.readout(() => {
          const n = nS.value, P = pts(), bf = bruteTSP(P), at = (ops) => { const sec = ops / 1e9; return sec < 1 ? `${r2(sec * 1000)} ms` : sec < 3600 ? `${r2(sec)} s` : sec < 3.15e7 ? `${r2(sec / 3600)} h` : `${big(sec / 3.15e7)} years`; };
          const selTxt = sel ? ` · clicked: $D[${setLab(sel[0]).replace(/[{}]/g, (c) => '\\' + c)}, ${sel[1]}] = ${r2(run.D[sel[0]][sel[1]])}$ = path ${hkPath(run, sel[0], sel[1]).join(' → ')}` : '';
          return `Held–Karp tour **${r2(run.best)}** = brute force ${r2(bf.best)} ${Math.abs(bf.best - run.best) < 1e-9 ? '✓' : '✗'} · table: ${run.subs.length} sets, ${run.ops} updates; brute force: ${bf.count} orderings · at $n = 20$ and $10^9$ operations per second: Held–Karp ${at(hkOps(20))}, brute force ${at(fact(19) * 20)}${selTxt}`;
        });
      },
    },
  ],
};
