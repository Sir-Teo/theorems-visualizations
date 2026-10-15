// Algorithms — Chapter 3: Sorting and selection (part b: 3.11–3.19)

// ---------- shared helpers ----------
const TAG = ['blue', 'orange', 'green', 'purple', 'pink', 'teal'];
const LETTER = 'abcdefgh';
const NAMES = 'abcdefghijkl';
const range0 = (n) => Array.from({ length: n }, (_, i) => i);
const range1 = (n) => Array.from({ length: n }, (_, i) => i + 1);
const harmonic = (n) => { let s = 0; for (let i = 1; i <= n; i++) s += 1 / i; return s; };
function distinct(r, n, lo, hi) { const pool = []; for (let x = lo; x <= hi; x++) pool.push(x); return r.shuffle(pool).slice(0, n); }
/** Row of array cells (see ch03.js): o.style(i, v) → {fill, alpha, stroke, width, text, dash, hidden, tag}. */
function cells(s, vals, o = {}) {
  const { x0 = 0, y = 0, w = 1, h = 0.9, gap = 0.07, size = 13 } = o;
  vals.forEach((val, i) => {
    const st = (o.style && o.style(i, val)) || {};
    if (st.hidden) return;
    const X0 = x0 + i * w + gap, X1 = x0 + (i + 1) * w - gap;
    s.rect(X0, y, X1, y + h, { fill: st.fill || 'panel', fillAlpha: st.fill ? st.alpha ?? 0.25 : 1, color: st.stroke || 'muted', width: st.width || 1.2, dash: st.dash });
    if (st.tag != null) {
      s.rect(X0, y, X1, y + h * 0.16, { fill: TAG[st.tag % TAG.length], fillAlpha: 0.85, stroke: false });
      s.text(LETTER[st.tag], X1 - (X1 - X0) * 0.16, y + h * 0.36, { align: 'center', size: 10, weight: 700, color: TAG[st.tag % TAG.length], halo: false });
    }
    if (val != null && val !== '') s.text(String(val), (X0 + X1) / 2 - (st.tag != null ? (X1 - X0) * 0.08 : 0), y + h * (st.tag != null ? 0.58 : 0.5), { align: 'center', baseline: 'middle', size: st.size || size, weight: st.weight || 600, color: st.text || 'ink', halo: false });
  });
}

// ---------- 3.12: decision trees of real sorting algorithms ----------
function permutations(n) {
  const out = [], a = range1(n);
  const rec = (k) => { if (k === n) { out.push(a.slice()); return; } for (let i = k; i < n; i++) { [a[k], a[i]] = [a[i], a[k]]; rec(k + 1); [a[k], a[i]] = [a[i], a[k]]; } };
  rec(0);
  return out.sort((p, q) => p.join('').localeCompare(q.join('')));
}
function sortIds(alg, n, less) {
  const a = range0(n);
  if (alg === 'insertion') {
    for (let j = 1; j < n; j++) { const key = a[j]; let i = j - 1; while (i >= 0 && less(key, a[i])) { a[i + 1] = a[i]; i--; } a[i + 1] = key; }
  } else if (alg === 'merge') {
    const rec = (lo, hi) => {
      if (hi - lo < 2) return;
      const mid = (lo + hi) >> 1; rec(lo, mid); rec(mid, hi);
      const out = []; let i = lo, j = mid;
      while (i < mid && j < hi) out.push(less(a[j], a[i]) ? a[j++] : a[i++]);
      while (i < mid) out.push(a[i++]); while (j < hi) out.push(a[j++]);
      for (let k = lo; k < hi; k++) a[k] = out[k - lo];
    };
    rec(0, n);
  } else {
    for (let i = 0; i < n - 1; i++) { let m = i; for (let j = i + 1; j < n; j++) if (less(a[j], a[m])) m = j; [a[i], a[m]] = [a[m], a[i]]; }
  }
  return a;
}
/** Decision tree: internal nodes {cmp: [i, j], lt, gt}, leaves {perm}; returns {root, nodes, leaves, height}. */
function decisionTree(alg, n) {
  const root = { depth: 0 };
  for (const p of permutations(n)) {
    let node = root;
    const less = (i, j) => {
      if (!node.cmp) node.cmp = [i, j];
      const r = p[i] < p[j], key = r ? 'lt' : 'gt';
      node = node[key] ||= { depth: node.depth + 1, parent: node, side: key };
      return r;
    };
    sortIds(alg, n, less);
    node.perm = p;
  }
  const nodes = [], leaves = []; let height = 0;
  const walk = (u) => { nodes.push(u); if (u.perm) { u.x = leaves.length; leaves.push(u); height = Math.max(height, u.depth); return; } const kids = [u.lt, u.gt].filter(Boolean); kids.forEach(walk); u.x = kids.reduce((s, c) => s + c.x, 0) / kids.length; };
  walk(root);
  return { root, nodes, leaves, height };
}
const log2fact = (n) => { let s = 0; for (let k = 2; k <= n; k++) s += Math.log2(k); return s; };

// ---------- 3.13: counting sort trace ----------
const CS_CODE = ['for i ← 0 to k:   C[i] ← 0', 'for j ← 1 to n:   C[A[j]] ← C[A[j]] + 1        // tally', 'for i ← 1 to k:   C[i] ← C[i] + C[i−1]         // C[i] = #keys ≤ i', 'for j ← n downto 1                             // right to left', '  B[C[A[j]]] ← A[j]', '  C[A[j]] ← C[A[j]] − 1'];
function countingTrace(items, k, backwards) {
  const n = items.length, C = new Array(k + 1).fill(0), B = new Array(n).fill(null), frames = []; let ops = k + 1;
  const snap = (o) => frames.push({ C: C.slice(), B: B.slice(), ops, ...o });
  snap({ line: 1, note: `Clear the ${k + 1} counters C[0..${k}].` });
  items.forEach((it, j) => { C[it.key]++; ops++; snap({ line: 2, aj: j, ci: it.key, phase: 'tally', note: `Tally A[${j + 1}] = ${it.key}: C[${it.key}] becomes ${C[it.key]}.` }); });
  for (let i = 1; i <= k; i++) { C[i] += C[i - 1]; ops++; snap({ line: 3, ci: i, cprev: i - 1, phase: 'prefix', note: `Prefix sum: C[${i}] = ${C[i]} keys are ≤ ${i}, so the last ${i} goes to position ${C[i]}.` }); }
  const order = backwards ? range0(n).reverse() : range0(n);
  for (const j of order) {
    const it = items[j], pos = C[it.key]; B[pos - 1] = it; C[it.key]--; ops++;
    snap({ line: [4, 5, 6], aj: j, ci: it.key, bj: pos - 1, phase: 'place', note: `A[${j + 1}] = ${it.key}${LETTER[it.occ]} goes to B[${pos}]; C[${it.key}] drops to ${C[it.key]}.` });
  }
  return frames;
}

// ---------- 3.16 / 3.19: adversaries ----------
function reaches(beats, a, b) { const seen = new Set([a]), st = [a]; while (st.length) { const u = st.pop(); if (u === b) return true; for (const w of beats[u]) if (!seen.has(w)) { seen.add(w); st.push(w); } } return false; }

// ---------- 3.18: median of medians ----------
const MOM_CODE = ['SELECT(A, k):', '  if |A| ≤ 5g:  sort A and return its k-th smallest', '  split A into ⌈n/g⌉ groups of g;  sort each group', '  x ← SELECT(medians, ⌈|medians|/2⌉)       // median of medians', '  partition around x:  L = {a < x},  R = {a > x}', '  if k = |L| + 1:  return x', '  if k ≤ |L|:  return SELECT(L, k)   else  SELECT(R, k − |L| − 1)'];
function momCount(A0, k, g) {
  let c = 0;
  const isort = (a) => { for (let j = 1; j < a.length; j++) { const key = a[j]; let i = j - 1; while (i >= 0 && (c++, a[i] > key)) { a[i + 1] = a[i]; i--; } a[i + 1] = key; } return a; };
  const sel = (A, k) => {
    if (A.length <= 5 * g) return isort(A.slice())[k];
    const med = [];
    for (let s = 0; s < A.length; s += g) { const grp = isort(A.slice(s, s + g)); med.push(grp[(grp.length - 1) >> 1]); }
    const x = sel(med, (med.length - 1) >> 1), L = [], R = [];
    for (const a of A) { if (a === x) continue; c++; (a < x ? L : R).push(a); }
    if (k === L.length) return x;
    return k < L.length ? sel(L, k) : sel(R, k - L.length - 1);
  };
  sel(A0, k);
  return c;
}
function momWorst(g) {
  const memo = new Map(), n0 = 10 * g, h = Math.ceil(g / 2);
  const f = (n) => { if (n <= n0) return n * Math.max(1, Math.log2(n)); let r = memo.get(n); if (r !== undefined) return r; const m = Math.ceil(n / g); r = f(m) + f(n - h * (Math.ceil(m / 2) - 2)) + n; memo.set(n, r); return r; };
  return f;
}

export default {
  collection: 'algo',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Randomized quicksort makes about 2n ln n comparisons',
      credit: 'Hoare, 1962',
      statement: String.raw`Run quicksort on $n$ distinct keys, choosing each pivot uniformly at random from its subarray. Let $z_1<z_2<\dots<z_n$ be the keys in sorted order. Then $z_i$ and $z_j$ ($i<j$) are compared with probability exactly $\dfrac{2}{j-i+1}$, and the expected number of comparisons is
$$E[X]=\sum_{1\le i<j\le n}\frac{2}{j-i+1}=2(n+1)H_n-4n=2n\ln n+O(n)\approx 1.39\,n\log_2 n,$$
for every input order.`,
      idea: String.raw`Write $X$ as a sum of indicators $X_{ij}$, one per pair (3.3); each pair is compared at most once, and only when one of them is the pivot. Until some key of $Z_{ij}=\{z_i,\dots,z_j\}$ becomes a pivot, the whole block stays together in one subarray; the first pivot chosen from $Z_{ij}$ is uniform over its $j-i+1$ keys, and $z_i,z_j$ are compared exactly when that first pivot is $z_i$ or $z_j$. Summing $2/(d+1)$ over the pairs at distance $d$ gives harmonic sums, and $H_n=\ln n+O(1)$ (1.14) finishes the estimate.`,
      caption: String.raw`Each cell $(i,j)$ of the grid is a pair of keys by rank. **Above the diagonal**: how often that pair was compared over all simulated runs; **below the diagonal**: the prediction $2/(j-i+1)$, mirrored, so agreement shows as a symmetric picture. Click a cell to inspect its pair, add runs to sharpen the estimate, and change $n$. Right: every pair's frequency against its rank distance, with the curve $2/(d)$, $d=j-i+1$.`,
      deps: ['algo-3.9', 'algo-3.3', 'algo-1.14'],
      refs: ['CLRS 4e §7.4', 'KT §13.5'],
      tags: ['sorting', 'randomized'],
      viz(v) {
        const rng = v.rng(13);
        let n = 14, cnt = null, runs = 0, total = 0, sel = [2, 6];
        const once = () => {
          const A = rng.shuffle(range0(n)), st = [[0, n - 1]]; let c = 0;
          while (st.length) {
            const [p, r] = st.pop(); if (p >= r) continue;
            const k = p + Math.floor(rng() * (r - p + 1)); [A[k], A[r]] = [A[r], A[k]];
            const x = A[r]; let i = p - 1;
            for (let j = p; j < r; j++) { c++; cnt[Math.min(A[j], x) * n + Math.max(A[j], x)]++; if (A[j] <= x) { i++; [A[i], A[j]] = [A[j], A[i]]; } }
            [A[i + 1], A[r]] = [A[r], A[i + 1]]; st.push([p, i], [i + 2, r]);
          }
          runs++; total += c;
        };
        const reset = () => { n = nS.value; cnt = new Float64Array(n * n); runs = 0; total = 0; sel = [Math.min(sel[0], n - 2), Math.min(sel[1], n - 1)]; for (let t = 0; t < 400; t++) once(); };
        const nS = v.slider('$n$ keys', 6, 30, 14, { int: true, onChange: reset });
        v.button('+100 runs', () => { for (let t = 0; t < 100; t++) once(); });
        v.button('+2000 runs', () => { for (let t = 0; t < 2000; t++) once(); });
        reset();
        const G = v.stage({ x: [-1.2, 17.5], y: [-15.2, 1.4], equal: true, axes: false, height: 360, weight: 1.2, minWidth: 330 });
        const P = v.stage({ x: [1.5, 15.5], y: [-0.04, 1.06], axes: 'box', height: 360, weight: 1, minWidth: 270, title: 'frequency vs rank distance $d=j-i+1$', xlabel: 'd' });
        G.onClick((x, y) => { const j = Math.round(x), i = Math.round(-y); if (i >= 0 && j >= 0 && i < n && j < n && i !== j) sel = i < j ? [i, j] : [j, i]; });
        v.render(() => {
          G.setView([-1.2, n + 3.5], [-n - 0.9, 1.4]); P.setView([1.5, n + 0.5], [-0.04, 1.06]);
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            if (i === j) { G.text(String(i + 1), j, -i, { align: 'center', size: n > 20 ? 8.5 : 11, weight: 700, color: 'muted' }); continue; }
            const a = Math.min(i, j), b = Math.max(i, j), val = i < j ? cnt[a * n + b] / runs : 2 / (b - a + 1);
            G.rect(j - 0.47, -i - 0.47, j + 0.47, -i + 0.47, { fill: v.M.cmap(val, 'viridis'), fillAlpha: 1, stroke: false });
          }
          const [si, sj] = sel;
          G.rect(sj - 0.5, -si - 0.5, sj + 0.5, -si + 0.5, { color: 'red', width: 2.6 });
          G.rect(si - 0.5, -sj - 0.5, si + 0.5, -sj + 0.5, { color: 'red', width: 2.6, dash: [3, 2] });
          G.text('simulated ↗', n - 0.5, 0.95, { align: 'right', size: 11, color: 'ink' });
          G.text('↙ theory 2/(j−i+1)', -0.5, -n + 0.05, { size: 11, color: 'ink' });
          G.colorbar([0, 1], 'viridis', { pos: 'right', label: 'freq.' });
          // scatter
          P.fn((d) => 2 / d, { color: 'green', width: 2 });
          const pts = [];
          for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) pts.push([b - a + 1 + ((a * 7 + b * 3) % 9 - 4) * 0.035, cnt[a * n + b] / runs]);
          P.dots(pts, { r: 2.4, color: 'accent', alpha: 0.6 });
          P.dot(sj - si + 1, cnt[si * n + sj] / runs, { r: 6, color: 'red' });
        });
        v.legend([['accent', 'simulated pair frequency', { dot: true }], ['green', '$2/(j-i+1)$'], ['red', 'selected pair', { dot: true }]]);
        v.readout(() => {
          const [i, j] = sel, f = cnt[i * n + j] / runs, exact = 2 * (n + 1) * harmonic(n) - 4 * n;
          return `$z_{${i + 1}}, z_{${j + 1}}$ compared in **${v.fix(100 * f, 1)}%** of ${runs} runs; theory $2/(j-i+1) = ${v.fix(200 / (j - i + 1), 1)}\\%$ · mean comparisons **${v.fix(total / runs, 2)}** vs $2(n+1)H_n-4n = ${v.fix(exact, 2)}$ ($2n\\ln n = ${v.fix(2 * n * Math.log(n), 1)}$)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Comparison sorting needs Ω(n log n) comparisons',
      statement: String.raw`Any deterministic algorithm that sorts $n$ distinct keys by comparing pairs of them (and gains no other information about the keys) must make at least $\lceil\log_2 n!\rceil$ comparisons on some input. Since $\log_2 n! = n\log_2 n - n\log_2 e + O(\log n)$, every comparison sort has worst-case running time $\Omega(n\log n)$; the same bound holds for the average over all $n!$ input orders.`,
      idea: String.raw`Unwind the algorithm into a **decision tree**: each internal node is a comparison $a_i : a_j$, its two branches are the outcomes, and each leaf is reached by exactly the inputs that produce one output order. Different input orders must end at different leaves (the same rearrangement cannot sort both), so the tree has at least $n!$ leaves. A binary tree of height $h$ has at most $2^h$ leaves, so $h\ge\log_2 n!$, and $\log_2 n! = \Theta(n\log n)$ (1.15). The average leaf depth is at least $\log_2 n!$ as well, by Kraft's inequality. Merge sort meets the bound up to lower-order terms, so it is asymptotically optimal.`,
      caption: String.raw`The complete decision tree of a real sorting algorithm on 3 or 4 keys, built by running it on every input order. Each internal node $i{:}j$ compares $a_i$ with $a_j$ (left branch: $a_i<a_j$); each leaf is an input order, written as the ranks of $a_1\dots a_n$. Click a leaf (or step through the inputs) to light up its path. The red line is depth $\lceil\log_2 n!\rceil$: no algorithm can keep every leaf above it. Selection sort shows wasted comparisons as nodes with a single branch. Below: worst-case comparisons divided by $\lceil\log_2 n!\rceil$ for larger $n$.`,
      deps: ['algo-3.1', 'algo-1.15'],
      refs: ['CLRS 4e §8.1'],
      tags: ['sorting', 'lower bounds'],
      viz(v) {
        const nSel = v.select('$n$', [{ value: 3, label: '3 keys' }, { value: 4, label: '4 keys' }], 4, { onChange: () => { pick = 0; } });
        const alg = v.select('algorithm', [{ value: 'insertion', label: 'insertion sort' }, { value: 'merge', label: 'merge sort' }, { value: 'selection', label: 'selection sort' }], 'merge', { onChange: () => { pick = Math.min(pick, 5); } });
        let pick = 13, key = '', T = null;
        v.button('Next input', () => { pick = (pick + 1) % T.leaves.length; });
        const S = v.stage({ x: [-0.8, 23.8], y: [-6.8, 0.6], axes: false, height: 350, full: true });
        const P = v.stage({ x: [2, 256], y: [0.9, 2.15], xlog: true, axes: 'box', height: 180, full: true, title: 'worst-case comparisons $\\div \\lceil\\log_2 n!\\rceil$ (never below 1)', xlabel: 'n' });
        S.onClick((x, y) => { if (!T) return; let best = -1, bd = 18; T.leaves.forEach((L, k) => { const d = Math.hypot(S.X(L.x) - S.X(x), S.Y(-L.depth) - S.Y(y)); if (d < bd) { bd = d; best = k; } }); if (best >= 0) pick = best; });
        const ser = { merge: [], insertion: [], binins: [] };
        for (let k = 0; k <= 56; k++) {
          const m = Math.round(2 * 2 ** (k / 8)); if (ser.merge.length && ser.merge[ser.merge.length - 1][0] === m) continue;
          const lb = Math.ceil(log2fact(m) - 1e-9), L = Math.ceil(Math.log2(m) - 1e-12);
          let bi = 0; for (let j = 2; j <= m; j++) bi += Math.ceil(Math.log2(j) - 1e-12);
          ser.merge.push([m, (m * L - 2 ** L + 1) / lb]); ser.insertion.push([m, (m * (m - 1)) / 2 / lb]); ser.binins.push([m, bi / lb]);
        }
        v.render(() => {
          const n = nSel.value;
          if (key !== alg.value + n) { key = alg.value + n; T = decisionTree(alg.value, n); pick = Math.min(pick, T.leaves.length - 1); }
          const L = T.leaves.length, H = T.height, lb = Math.ceil(log2fact(n) - 1e-9);
          S.setView([-0.8, L - 0.2], [-H - 0.85, 0.55]);
          const leaf = T.leaves[pick], onPath = new Set(); for (let u = leaf; u; u = u.parent) onPath.add(u);
          S.hline(-lb, { color: 'red', width: 1.4, dash: [6, 4] });
          S.text(`depth ⌈log₂ ${n}!⌉ = ${lb}`, L - 0.25, -lb + 0.12, { align: 'right', baseline: 'bottom', size: 11, color: 'red' });
          const r = Math.max(9, Math.min(15, S.width / L * 0.42));
          for (const u of T.nodes) if (u.parent) {
            const on = onPath.has(u);
            S.line(u.parent.x, -u.parent.depth, u.x, -u.depth, { color: on ? 'green' : 'faint', width: on ? 3 : 1.3 });
            if (n === 3 || on) S.text(u.side === 'lt' ? '<' : '>', (u.parent.x * 0.4 + u.x * 0.6), -u.parent.depth - 0.6, { align: 'center', size: 11, weight: 700, color: on ? 'green' : 'muted' });
          }
          for (const u of T.nodes) {
            const on = onPath.has(u);
            if (u.perm) {
              S.dot(u.x, -u.depth, { r: 3.5, color: on ? 'green' : 'muted' });
              S.text(u.perm.join(''), u.x, -u.depth - 0.38, { align: 'center', size: n === 3 ? 12 : 10.5, weight: on ? 700 : 500, color: on ? 'green' : 'ink' });
            } else {
              const single = !(u.lt && u.gt);
              S.dot(u.x, -u.depth, { r, hollow: true, color: on ? 'green' : single ? 'orange' : 'muted', width: on ? 2.4 : 1.4 });
              if (on) S.dot(u.x, -u.depth, { r: r - 1, color: 'green', alpha: 0.2, ring: false });
              S.text(`${u.cmp[0] + 1}:${u.cmp[1] + 1}`, u.x, -u.depth, { align: 'center', size: r > 12 ? 11 : 9.5, weight: 600, color: 'ink', halo: false });
            }
          }
          // ratio plot
          P.hline(1, { color: 'red', width: 1.4, dash: [6, 4] });
          P.path(ser.insertion, { color: 'orange', width: 2 }); P.path(ser.binins, { color: 'purple', width: 2 }); P.path(ser.merge, { color: 'accent', width: 2 });
          P.text('insertion sort', 4.2, 1.95, { size: 11, color: 'orange' });
          P.text('binary insertion', 190, 1.02, { size: 11, color: 'purple', align: 'right', baseline: 'top' });
          P.text('merge sort', 190, 1.18, { size: 11, color: 'accent', align: 'right' });
          P.text('lower bound', 2.3, 0.96, { size: 11, color: 'red' });
        });
        v.legend([['green', 'path of the chosen input'], ['orange', 'node with a single branch (a wasted comparison)', { dot: true }], ['red', '$\\lceil\\log_2 n!\\rceil$', { dash: true }]]);
        v.readout(() => {
          if (!T) return '';
          const n = nSel.value, leaf = T.leaves[pick], L = T.leaves.length, lb = Math.ceil(log2fact(n) - 1e-9);
          const avg = T.leaves.reduce((s, u) => s + u.depth, 0) / L, fact = n === 3 ? 6 : 24;
          return `input $(a_1,\\dots,a_${n}) = (${leaf.perm.join(',')})$: **${leaf.depth}** comparisons · leaves $${L} = ${n}! $ · height **${T.height}** $\\ge \\lceil\\log_2 ${fact}\\rceil = ${lb}$ · average depth ${v.fix(avg, 2)} $\\ge \\log_2 ${n}! = ${v.fix(log2fact(n), 2)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Algorithm',
      name: 'Counting sort',
      credit: 'Seward, 1954',
      statement: String.raw`**Counting sort** sorts $n$ records whose keys are integers in $\{0,1,\dots,k\}$. It counts the records with each key in an array $C[0..k]$, turns the counts into prefix sums so that $C[i]$ is the number of keys $\le i$, and then scans the input **from right to left**, placing each record $A[j]$ at position $C[A[j]]$ of an output array $B$ and decrementing $C[A[j]]$.

It runs in $\Theta(n+k)$ time with $\Theta(n+k)$ extra memory, makes no comparisons between keys, and is stable. When $k=O(n)$ it sorts in linear time.`,
      idea: String.raw`After the prefix sums, the records with key $i$ must occupy positions $C[i-1]+1,\dots,C[i]$ of the output, so the last such record goes to $C[i]$; decrementing makes room for the previous one. Scanning right to left therefore fills each block of equal keys from its end backwards in reverse input order, which puts them in input order: stability. The lower bound of 3.12 does not apply because the algorithm uses keys as array indices instead of comparing them.`,
      caption: String.raw`Step through the three phases: tally into $C$, prefix-sum $C$, then place from right to left into $B$. Equal keys carry coloured letters (a, b, c in input order), so stability is visible in $B$. Switch off **right-to-left** to scan forwards instead: equal keys come out reversed (red). The right panel compares the work $2n+2k+1$ with the $n\log_2 n$ comparisons a comparison sort needs, for $n=1000$ keys as the key range $k$ grows: counting wins until $k$ is about $n\log n$.`,
      deps: ['algo-3.1'],
      see: ['algo-3.12'],
      refs: ['CLRS 4e §8.2'],
      tags: ['sorting'],
      viz(v) {
        const n = 10, rng = v.rng(29);
        let keys = [2, 4, 1, 2, 0, 4, 2, 1, 3, 1];
        const items = () => { const seen = {}; return keys.map((key, id) => { seen[key] = (seen[key] || 0) + 1; return { id, key, occ: seen[key] - 1 }; }); };
        const kS = v.slider('largest key $k$', 1, 9, 4, { int: true, onChange: (k) => { keys = keys.map((x) => Math.min(x, k)); S.reset(); } });
        const back = v.toggle('scan right to left (line 4)', true, { onChange: () => S.reset({ at: 'end' }) });
        v.button('New keys', () => { keys = Array.from({ length: n }, () => rng.int(0, kS.value)); S.reset(); });
        const M = v.stage({ x: [-1.6, n - 0.3], y: [-1.05, 4.0], axes: false, height: 320, weight: 2, minWidth: 380 });
        const P = v.stage({ x: [1, 1e7], y: [1e3, 3e7], xlog: true, ylog: true, axes: 'box', height: 320, weight: 1, minWidth: 240, title: 'work for $n = 1000$ keys in $\\{0,\\dots,k\\}$', xlabel: 'k' });
        const f0 = countingTrace(items(), kS.value, true);
        const S = v.steps({ frames: () => countingTrace(items(), kS.value, back.value), code: CS_CODE, codeTitle: 'Counting-Sort(A, B, k)', codePos: 'below', speed: 2, start: f0.findIndex((f) => f.phase === 'place') + 3 });
        const YA = 2.85, YC = 1.35, YB = -0.15;
        v.render(() => {
          const f = S.frame, k = kS.value, its = items();
          M.text('A', -1.05, YA + 0.42, { align: 'center', size: 15, weight: 700, color: 'muted' });
          M.text('C', -1.05, YC + 0.42, { align: 'center', size: 15, weight: 700, color: 'muted' });
          M.text('B', -1.05, YB + 0.42, { align: 'center', size: 15, weight: 700, color: 'muted' });
          cells(M, its.map((it) => it.key), { x0: -0.5, y: YA, h: 0.85, size: 15, style: (j) => ({ tag: its[j].occ, ...(j === f.aj ? { fill: 'gold', alpha: 0.4, stroke: 'gold', width: 2.4 } : {}) }) });
          for (let j = 0; j < n; j++) M.text(String(j + 1), j, YA + 1.02, { align: 'center', size: 10, color: 'muted' });
          cells(M, f.C, { x0: -0.5, y: YC, h: 0.85, size: 15, style: (i) => (i === f.ci ? { fill: 'orange', alpha: 0.35, stroke: 'orange', width: 2.4 } : i === f.cprev ? { stroke: 'orange', width: 1.8 } : null) });
          for (let i = 0; i <= k; i++) M.text(String(i), i, YC - 0.18, { align: 'center', size: 10, color: 'orange' });
          const bad = new Set();
          for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) { const a = f.B[p], b = f.B[q]; if (a && b && a.key === b.key && a.occ > b.occ) { bad.add(p); bad.add(q); } }
          cells(M, f.B.map((it) => (it ? it.key : '')), { x0: -0.5, y: YB, h: 0.85, size: 15, style: (p) => { const it = f.B[p]; if (!it) return { stroke: 'faint', dash: [3, 3] }; return { tag: it.occ, ...(p === f.bj ? { fill: 'gold', alpha: 0.4, stroke: 'gold', width: 2.4 } : bad.has(p) ? { stroke: 'red', width: 2.6 } : {}) }; } });
          for (let p = 0; p < n; p++) M.text(String(p + 1), p, YB - 0.2, { align: 'center', size: 10, color: 'muted' });
          if (f.phase === 'tally') M.arrow(f.aj, YA - 0.04, f.ci, YC + 0.92, { color: 'orange', width: 2 });
          if (f.phase === 'prefix') M.arrow(f.cprev + 0.2, YC + 1.0, f.ci - 0.2, YC + 1.0, { color: 'orange', width: 2, head: 7 });
          if (f.phase === 'place') { M.arrow(f.aj, YA - 0.04, f.bj, YB + 0.92, { color: 'gold', width: 2.2 }); }
          // cost panel
          const N = 1000;
          P.fn((x) => 2 * N + 2 * x + 1, { color: 'accent', width: 2.2 });
          P.hline(N * Math.log2(N), { color: 'orange', width: 2, dash: [6, 4] });
          P.vline((N * Math.log2(N) - 2 * N - 1) / 2, { color: 'muted', width: 1, dash: [2, 4] });
          P.text('counting sort: 2n + 2k + 1', 1.3, 3.2e3, { size: 11, color: 'accent' });
          P.text('n log₂ n comparisons', 1.3, 1.35e4, { size: 11, color: 'orange' });
          P.dot(k, 2 * N + 2 * k + 1, { r: 5.5, color: 'gold' });
        });
        v.legend([['gold', 'record being moved', { dot: true }], ['orange', 'counter touched', { dot: true }], ['red', 'equal keys out of order', { dot: true }]]);
        v.readout(() => {
          const f = S.frame, done = f.B.every((x) => x), its = f.B;
          let stable = true; for (let p = 0; p + 1 < n; p++) if (done && its[p].key === its[p + 1].key && its[p].occ > its[p + 1].occ) stable = false;
          return `steps so far **${f.ops}** of $2n + 2k + 1 = ${2 * n + 2 * kS.value + 1}$ · no key comparisons at all` + (done ? ` · output sorted ✓, ${stable ? 'equal keys in input order: **stable** ✓' : '**equal keys reversed: not stable** ✗'}` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Algorithm',
      name: 'Radix sort',
      credit: 'Hollerith, 1890 (card sorters)',
      statement: String.raw`**LSD radix sort** sorts $n$ integers of $d$ digits in base $b$ by sorting them $d$ times, on the least significant digit first and the most significant last, each time with a **stable** sort such as counting sort (3.13). It takes $\Theta(d(n+b))$ time. For $w$-bit keys and base $b=2^r$ this is $\Theta\big(\tfrac wr(n+2^r)\big)$, minimized near $r=\log_2 n$, giving $\Theta(wn/\log n)$; for $w=O(\log n)$ the sort is linear.`,
      idea: String.raw`Invariant: after pass $t$ the keys are sorted by their last $t$ digits. Pass $t+1$ orders them by digit $t+1$; keys whose digit $t+1$ ties keep their previous relative order because the pass is stable, and that order was already correct on the last $t$ digits. After $d$ passes they are sorted on all digits. Stability is essential: without it a pass can scramble ties and undo the earlier passes. As with counting sort, no keys are compared, so the $n\log n$ bound (3.12) does not apply.`,
      caption: String.raw`Ten 8-bit numbers written in the chosen base; step through the passes. In each column the green digits are the ones already sorted on (the invariant), the gold digit is the one this pass sorts by, and lines track each number from column to column. Switch **stable passes** off and ties are reversed in every pass: the final column comes out wrong (red). Below: the work $d(n+b)$ for 32-bit keys against $n\log_2 n$ as $n$ grows.`,
      deps: ['algo-3.13'],
      refs: ['CLRS 4e §8.3'],
      tags: ['sorting'],
      viz(v) {
        const n = 10, rng = v.rng(3);
        let vals = [170, 45, 75, 90, 2, 24, 182, 66, 131, 9];
        const base = v.select('base $b$', [2, 4, 8, 10, 16].map((b) => ({ value: b, label: String(b) })), 10, { onChange: () => S.reset({ at: 'end' }) });
        const stable = v.toggle('stable passes', true, { onChange: () => S.reset({ at: 'end' }) });
        v.button('New numbers', () => { vals = distinct(rng, n, 0, 255); S.reset({ at: 'end' }); });
        const C = v.stage({ x: [-0.5, 3.5], y: [-n + 0.4, 1.35], axes: false, height: 330, full: true });
        const P = v.stage({ x: [10, 1e8], y: [10, 1e10], xlog: true, ylog: true, axes: 'box', height: 190, full: true, title: 'work for sorting $n$ keys of 32 bits', xlabel: 'n' });
        const digitsOf = (x, b, d) => { const out = []; for (let t = 0; t < d; t++) { out.unshift(x % b); x = Math.floor(x / b); } return out; };
        const passes = () => {
          const b = base.value, d = Math.ceil(Math.log(256) / Math.log(b) - 1e-9);
          const cols = [range0(n)];
          for (let t = 0; t < d; t++) {
            const prev = cols[t], dig = (id) => Math.floor(vals[id] / b ** t) % b, buckets = Array.from({ length: b }, () => []);
            for (const id of prev) buckets[dig(id)].push(id);
            cols.push(buckets.flatMap((q) => (stable.value ? q : q.slice().reverse())));
          }
          return { b, d, cols, frames: cols.map((_, t) => ({ t, line: t === 0 ? [] : [1, 2], note: t === 0 ? `Input, written with ${d} digits in base ${b}.` : `Pass ${t}: ${stable.value ? 'stably ' : ''}sort by digit ${t} from the right (gold).` })) };
        };
        let R = passes();
        const S = v.steps({ frames: () => (R = passes()).frames, code: ['for t ← 1 to d          // least significant digit first', '  stably sort A on digit t   (counting sort, b buckets)'], codeTitle: 'Radix-Sort(A, d)', codePos: 'below', speed: 1, start: 'end' });
        v.render(() => {
          const { b, d, cols } = R, t = S.frame.t ?? d, ncol = d + 1;
          C.setView([-0.55, ncol - 0.45], [-n + 0.35, 1.35]);
          const colPx = C.width / (ncol + 0.1), dw = Math.min(13, (colPx * 0.66) / d), fs = Math.min(15, dw * 1.45), half = (dw * d) / 2 / C.scale;
          for (let c = 0; c <= t; c++) {
            const order = cols[c], X = C.X(c);
            C.text(c === 0 ? 'input' : `pass ${c}`, c, 0.95, { align: 'center', size: 11.5, weight: 600, color: c === t ? 'ink' : 'muted' });
            const sortedOK = (() => { const m = b ** c; for (let r = 0; r + 1 < n; r++) if (vals[order[r]] % m > vals[order[r + 1]] % m) return false; return true; })();
            order.forEach((id, r) => {
              const ds = digitsOf(vals[id], b, d);
              ds.forEach((dg, q) => {
                const pos = d - 1 - q; // 0 = least significant
                const col = c > 0 && pos === c - 1 ? 'gold' : pos < c - 1 || (c > 0 && pos === c - 1 && false) ? 'green' : pos < c ? 'green' : 'muted';
                C.textPx(dg.toString(b).toUpperCase(), X + (q - (d - 1) / 2) * dw, C.Y(-r), { align: 'center', size: fs, weight: pos < c ? 700 : 500, color: col, halo: false });
              });
              if (c === ncol - 1 && !sortedOK) C.dot(c + half + 0.12, -r, { r: 3, color: 'red' });
            });
            if (c > 0) {
              const prev = cols[c - 1], where = new Map(order.map((id, r) => [id, r]));
              prev.forEach((id, r0) => C.line(c - 1 + half + 0.06, -r0, c - half - 0.06, -where.get(id), { color: c === t ? 'accent' : 'faint', width: c === t ? 1.6 : 1.1, alpha: 0.8 }));
            }
            if (c > 0 && c === t) C.text(sortedOK ? `sorted by the last ${c} digit${c === 1 ? '' : 's'} ✓` : 'invariant broken ✗', c, -n + 0.52, { align: 'center', size: 10.5, color: sortedOK ? 'green' : 'red' });
          }
          // cost panel
          const bits = 32, passesFor = (bb) => Math.ceil(bits / Math.log2(bb) - 1e-9);
          P.fn((m) => m * Math.log2(m), { color: 'orange', width: 2, dash: [6, 4] });
          P.fn((m) => passesFor(b) * (m + b), { color: 'accent', width: 2.2 });
          P.fn((m) => { const r = Math.max(1, Math.min(16, Math.round(Math.log2(m)))); return Math.ceil(bits / r) * (m + 2 ** r); }, { color: 'green', width: 1.8, dash: [3, 3] });
          P.text(`base ${b}: ${passesFor(b)} passes`, 2e6, 3.6e6, { size: 11, color: 'accent', align: 'left' });
          P.text('n log₂ n', 1.4e3, 4e4, { size: 11, color: 'orange', align: 'right' });
        });
        v.legend([['green', 'digits already sorted on'], ['gold', 'digit of the current pass'], ['accent', 'radix sort, this base'], ['green', 'radix sort, best base $b \\approx n$', { dash: true }], ['orange', '$n\\log_2 n$', { dash: true }]]);
        v.readout(() => {
          const { b, d, cols } = R, last = cols[d], ok = last.every((id, r) => r === 0 || vals[last[r - 1]] <= vals[id]);
          return `base $b = ${b}$: $d = ${d}$ passes · work $d(n+b) = ${d}\\cdot(${n}+${b}) = ${d * (n + b)}$ vs $n\\log_2 n \\approx ${Math.round(n * Math.log2(n))}$ here; at $n = 10^6$ with $b = 2^{16}$: $2(10^6 + 65536) \\approx 2.1\\cdot 10^6$ vs $n\\log_2 n \\approx 2\\cdot 10^7$ · final order ${ok ? '**sorted** ✓' : '**not sorted** ✗ — the passes must be stable'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Algorithm',
      name: 'Bucket sort',
      statement: String.raw`**Bucket sort** sorts $n$ real numbers in $[0,1)$: it distributes them into $n$ buckets, number $x$ going to bucket $\lfloor nx\rfloor$, sorts each bucket by insertion sort (3.2), and concatenates the buckets in order.

If the inputs are drawn independently and uniformly from $[0,1)$, the expected running time is $\Theta(n)$: with $n_i$ the load of bucket $i$, the cost is $\Theta\big(n+\sum_i n_i^2\big)$ and $E\big[\sum_i n_i^2\big]=2n-1$. Without that assumption the worst case is $\Theta(n^2)$.`,
      idea: String.raw`Insertion sort on a bucket of $n_i$ keys costs $O(n_i^2)$, so the total is $O(n+\sum n_i^2)$. Write $n_i$ as a sum of indicators $X_{ij}$ that key $j$ lands in bucket $i$ (3.3); then $E[n_i^2]=\sum_j E[X_{ij}]+\sum_{j\ne l}E[X_{ij}X_{il}]=1+n(n-1)/n^2=2-1/n$. Summing over the $n$ buckets gives $2n-1$. The argument uses the uniformity of the input; clustered inputs pile into few buckets and the quadratic cost returns.`,
      caption: String.raw`The input values (top strip) drop into $n$ equal buckets and stack up; stacks are coloured by load. Switch the input distribution: uniform data spreads out with $\sum n_i^2\approx 2n$, while clustered or skewed data piles up and the sum, the true cost, blows up. **Resample** for a fresh draw. Below: $\sum n_i^2/n$ averaged over draws, as $n$ grows, for this distribution and for uniform data.`,
      deps: ['algo-3.2', 'algo-3.3'],
      refs: ['CLRS 4e §8.4'],
      tags: ['sorting', 'randomized'],
      viz(v) {
        const DIST = {
          uniform: (r, n) => r(),
          clustered: (r, n) => Math.min(0.9999, Math.max(0, r.normal(0.5, 0.05))),
          skewed: (r, n) => r() ** 4,
          one: (r, n) => r() / n,
        };
        const dist = v.select('input', [{ value: 'uniform', label: 'uniform' }, { value: 'clustered', label: 'clustered' }, { value: 'skewed', label: 'skewed ($u^4$)' }, { value: 'one', label: 'all in one bucket' }], 'uniform', { onChange: () => draw() });
        const nS = v.slider('$n$', 10, 120, 40, { int: true, onChange: () => draw() });
        const rng = v.rng(8);
        let xs = [];
        const draw = () => { const n = nS.value; xs = Array.from({ length: n }, () => DIST[dist.value](rng, n)); };
        v.button('Resample', draw);
        draw();
        const T = v.stage({ x: [0, 1], y: [-0.6, 10], axes: false, height: 300, full: true });
        const P = v.stage({ x: [10, 10000], y: [1, 3000], xlog: true, ylog: true, axes: 'box', height: 190, full: true, title: '$\\sum_i n_i^2 / n$, averaged over 20 draws', xlabel: 'n' });
        const curves = {}, r2 = v.rng(5);
        const curve = (name) => {
          if (curves[name]) return curves[name];
          const out = [];
          for (let k = 0; k <= 12; k++) {
            const n = Math.round(10 * 1000 ** (k / 12)); let tot = 0;
            for (let t = 0; t < 20; t++) { const load = new Int32Array(n); for (let j = 0; j < n; j++) load[Math.min(n - 1, Math.floor(n * DIST[name](r2, n)))]++; let s = 0; for (const c of load) s += c * c; tot += s; }
            out.push([n, tot / 20 / n]);
          }
          return (curves[name] = out);
        };
        let info = null;
        v.render(() => {
          const n = xs.length, B = Array.from({ length: n }, () => []);
          for (const x of xs) B[Math.min(n - 1, Math.floor(n * x))].push(x);
          B.forEach((q) => q.sort((a, b) => a - b));
          const mx = Math.max(...B.map((q) => q.length)), top = Math.max(6, mx) + 2.3;
          T.setView([0, 1], [-0.75, top]);
          for (let i = 0; i <= n; i++) T.line(i / n, 0, i / n, Math.max(1.2, mx + 0.3), { color: 'grid', width: 1 });
          T.line(0, 0, 1, 0, { color: 'muted', width: 1.4 });
          const pxPer = Math.min(T.width / n, T.height / top), rr = Math.max(1.8, Math.min(6.5, pxPer * 0.36));
          B.forEach((q, i) => {
            const L = q.length, col = L <= 1 ? 'green' : L === 2 ? 'accent' : L <= 4 ? 'orange' : 'red';
            q.forEach((x, k) => T.dot((i + 0.5) / n, k + 0.55, { r: rr, color: col }));
            if (L >= 3) T.text(String(L), (i + 0.5) / n, L + 0.75, { align: 'center', size: 10.5, weight: 700, color: col });
          });
          T.dots(xs.map((x) => [x, top - 0.9]), { r: 2.6, color: 'gold' });
          T.text('input values in [0, 1)', 0.002, top - 0.25, { size: 11, color: 'muted' });
          T.text('0', 0, -0.42, { size: 10.5, color: 'muted' }); T.text('1', 1, -0.42, { size: 10.5, color: 'muted', align: 'right' });
          T.text(`${n} buckets of width 1/${n}`, 0.5, -0.42, { size: 10.5, color: 'muted', align: 'center' });
          // cost panel
          P.fn((m) => 2 - 1 / m, { color: 'green', width: 1.4, dash: [6, 4] });
          P.path(curve('uniform'), { color: 'green', width: 2 }); P.dots(curve('uniform'), { r: 3, color: 'green' });
          if (dist.value !== 'uniform') { P.path(curve(dist.value), { color: 'red', width: 2 }); P.dots(curve(dist.value), { r: 3, color: 'red' }); }
          let s2 = 0, shifts = 0; for (const q of B) s2 += q.length * q.length;
          const order = xs.map((x) => Math.min(n - 1, Math.floor(n * x)));
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (order[i] === order[j] && xs[i] > xs[j]) shifts++;
          P.dot(n, s2 / n, { r: 6, color: 'gold' });
          info = { n, s2, shifts, mx };
        });
        v.legend([['gold', 'input value · this draw (below)', { dot: true }], ['green', 'uniform input; dashed: $E = 2 - 1/n$'], ['red', 'chosen distribution']]);
        v.readout(() => {
          if (!info) return '';
          const { n, s2, shifts, mx } = info;
          return `$\\sum_i n_i^2 = ${s2}$ (uniform expectation $2n-1 = ${2 * n - 1}$) · insertion-sort shifts inside buckets: ${shifts} · largest bucket: ${mx} key${mx === 1 ? '' : 's'}` + (s2 > 4 * n ? ' · **far above linear: the uniformity assumption fails**' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16',
      kind: 'Method',
      name: 'Adversary arguments: the maximum needs n − 1 comparisons',
      statement: String.raw`An **adversary argument** proves a lower bound by letting an opponent answer the algorithm's questions (here, comparisons) adaptively, choosing each answer to keep as many possibilities open as it can while staying consistent with all earlier answers. If the algorithm stops while two different inputs are still consistent and require different outputs, it can be wrong on one of them.

**Theorem.** Every comparison-based algorithm that finds the maximum of $n$ distinct keys makes at least $n-1$ comparisons in the worst case, and scanning the keys once achieves $n-1$.`,
      idea: String.raw`Before it can certify a maximum, the algorithm must know that every other key has lost at least one comparison: if two keys had never lost, the adversary could make either one the largest by raising its value, which contradicts no answer given so far. Each comparison produces at most one *new* loser, so with fewer than $n-1$ comparisons at least two keys are still unbeaten. The adversary in fact needs no cleverness here; for minimum and maximum together (3.19) it has to work harder.`,
      caption: String.raw`Gold keys have never lost. Play against the adversary by clicking two keys to compare them (an arrow points from winner to loser), or pick a strategy and step it. **Declare** whenever you like: if two keys are still unbeaten, the adversary shows values consistent with every answer in which a different key is the largest. The right panel tracks unbeaten keys against comparisons; no line can fall faster than the dashed one.`,
      deps: ['algo-3.1'],
      refs: ['CLRS 4e §9.1', 'Erickson notes: Lower Bounds'],
      tags: ['lower bounds'],
      viz(v) {
        let n = 8, beats = [], lost = [], cmps = 0, hist = [], pick = -1, last = null, msg = '', reveal = null, strat = null;
        const S = v.stage({ x: [-1.25, 1.25], y: [-1.15, 1.2], equal: true, axes: false, height: 320, weight: 1.3, minWidth: 300 });
        const P = v.stage({ x: [0, 16], y: [0, 8.6], axes: 'box', height: 320, weight: 1, minWidth: 240, title: 'unbeaten keys vs comparisons', xlabel: 'comparisons' });
        const G = v.graph(S, { nodes: [], edges: [], directed: true, layout: 'none', draggable: false, r: 16 });
        const unbeaten = () => range0(n).filter((i) => !lost[i]);
        const reset = () => {
          n = nS.value; beats = range0(n).map(() => new Set()); lost = new Array(n).fill(false); cmps = 0; hist = [[0, n]]; pick = -1; last = null; reveal = null; msg = '';
          G.set({ nodes: range0(n).map((i) => ({ id: i, label: NAMES[i], x: Math.sin((2 * Math.PI * i) / n), y: Math.cos((2 * Math.PI * i) / n) })), edges: [] });
          strat = mode.value === 'scan' ? { champ: 0, t: 1 } : { cur: range0(n), next: [] };
        };
        const compare = (a, b) => {
          if (a === b) return;
          let w;
          if (reaches(beats, a, b)) w = a; else if (reaches(beats, b, a)) w = b;
          else if (!lost[a] && lost[b]) w = a; else if (!lost[b] && lost[a]) w = b; else w = a;
          const l = w === a ? b : a;
          const fresh = !lost[l];
          beats[w].add(l); lost[l] = true; cmps++; hist.push([cmps, unbeaten().length]);
          G.addEdge(w, l); last = [w, l]; reveal = null;
          msg = `${NAMES[w]} > ${NAMES[l]}: ${fresh ? `${NAMES[l]} loses for the first time` : `${NAMES[l]} had already lost — this comparison eliminated no one`}.`;
        };
        const nextAuto = () => {
          if (unbeaten().length <= 1) { msg = 'Only one key is unbeaten: the maximum is certified.'; return; }
          if (mode.value === 'scan') { const { champ, t } = strat; if (t >= n) return; compare(champ, t); strat.champ = last[0]; strat.t++; }
          else if (mode.value === 'tournament') {
            const st = strat; if (st.cur.length < 2) { st.cur = st.cur.concat(st.next); st.next = []; }
            if (st.cur.length >= 2) { const a = st.cur.shift(), b = st.cur.shift(); compare(a, b); st.next.push(last[0]); }
          }
        };
        const mode = v.select('', [{ value: 'you', label: 'you play' }, { value: 'scan', label: 'linear scan' }, { value: 'tournament', label: 'knockout tournament' }], 'tournament', { onChange: (m) => { reset(); stepBtn.hidden = m === 'you'; } });
        const nS = v.slider('$n$', 3, 12, 8, { int: true, onChange: reset });
        const stepBtn = v.button('Next comparison', nextAuto);
        v.button('Declare the maximum', () => {
          const u = unbeaten();
          if (u.length === 1) { msg = `**${NAMES[u[0]]} is certainly the maximum**, after ${cmps} comparisons (the bound is $n-1 = ${n - 1}$).`; reveal = null; return; }
          const target = u[u.length - 1], other = u[0], h = new Array(n).fill(0);
          const height = (x) => { let best = 0; for (const y of beats[x]) best = Math.max(best, 1 + height(y)); return best; };
          for (let i = 0; i < n; i++) h[i] = height(i);
          const order = range0(n).sort((a, b) => (a === target) - (b === target) || h[a] - h[b] || a - b), val = new Array(n);
          order.forEach((id, k) => { val[id] = 10 * (k + 1); });
          reveal = val;
          msg = `**Not yet**: ${u.map((i) => NAMES[i]).join(', ')} never lost. These values agree with every answer so far, yet make **${NAMES[target]}** the largest — and the same trick works for ${NAMES[other]}.`;
        });
        v.button('Reset', reset);
        reset();
        for (let k = 0; k < 5; k++) nextAuto();
        G.onClick = ({ node }) => {
          if (mode.value !== 'you' || !node) return true;
          if (pick < 0) pick = node.id; else { if (pick !== node.id) compare(pick, node.id); pick = -1; }
          return true;
        };
        v.render(() => {
          G.draw({
            nodeFill: (id) => (!lost[id] ? 'gold' : null),
            nodeColor: (id) => (lost[id] ? 'muted' : 'gold'),
            nodeRing: (id) => (id === pick ? 'accent' : null),
            nodeNote: (id) => (reveal ? String(reveal[id]) : null),
            noteColor: 'red',
            edgeColor: (e) => (last && e.from === last[0] && e.to === last[1] ? 'orange' : 'muted'),
            edgeWidth: (e) => (last && e.from === last[0] && e.to === last[1] ? 3 : 1.5),
          });
          P.setView([0, Math.max(2 * n, cmps + 1)], [0, n + 0.6]);
          P.line(0, n, n - 1, 1, { color: 'red', width: 1.5, dash: [6, 4] });
          P.hline(1, { color: 'green', width: 1.2, dash: [3, 3] });
          const stair = []; hist.forEach(([k, c], i) => { if (i) stair.push([k, hist[i - 1][1]]); stair.push([k, c]); });
          P.path(stair, { color: 'gold', width: 2.6 }); P.dot(cmps, unbeaten().length, { r: 5.5, color: 'gold' });
          P.text('best possible: n − k', n * 0.55, n * 0.62, { size: 11, color: 'red' });
        });
        v.legend([['gold', 'never lost (could be the maximum)', { dot: true }], ['muted', 'has lost', { dot: true }], ['orange', 'last comparison (winner → loser)'], ['red', 'values the adversary reveals', { dot: true }]]);
        v.readout(() => `comparisons **${cmps}** · unbeaten keys **${unbeaten().length}** $\\ge n - \\text{comparisons} = ${n - cmps}$, so certifying the maximum takes $\\ge n-1 = ${n - 1}$ · ${msg || (mode.value === 'you' ? 'click two keys to compare them' : 'press Next comparison')}`);
      },
    },
    // ------------------------------------------------------------------ 3.17
    {
      num: '3.17',
      kind: 'Algorithm',
      name: 'Randomized selection (quickselect)',
      credit: 'Hoare, 1961',
      statement: String.raw`**Randomized select** finds the $k$-th smallest of $n$ distinct keys: partition around a uniformly random pivot (as in quicksort, 3.9); if the pivot has rank $k$, return it; otherwise recurse only into the side that contains rank $k$.

Its expected number of comparisons is linear for every $k$: exactly
$$E[C_{n,k}]=2\big((n+1)H_n-(n+3-k)H_{n+1-k}-(k+2)H_k+n+3\big)\le(2+2\ln 2)\,n\approx 3.39\,n,$$
the maximum being near the median. The worst case, when every pivot is an extreme key, is $\Theta(n^2)$.`,
      idea: String.raw`A random pivot lands in the middle half of the subarray with probability $1/2$, and then at least a quarter of the keys are discarded; so in expectation two partitions shrink the problem by a constant factor, and the costs form a geometric series (1.12), unlike quicksort, which must recurse on both sides. For the exact constant, use indicators (3.3): keys $z_i,z_j$ are compared exactly when the first pivot chosen from the block of keys between $\min(i,k)$ and $\max(j,k)$ is $z_i$ or $z_j$.`,
      caption: String.raw`Each row is one round: the bar is the range of ranks still alive, the gold tick the random pivot, the faded part the side thrown away; the green line marks the target rank $k$. Step through a run, start a new one, or move $k$ and $n$. Below: the comparison counts of 2000 runs, divided by $n$, against the exact expectation (green) and the worst-$k$ bound $3.39\,n$. Switch to the first-element pivot on sorted input to see the quadratic worst case.`,
      deps: ['algo-3.9', 'algo-3.3'],
      refs: ['CLRS 4e §9.2'],
      tags: ['selection', 'randomized'],
      viz(v) {
        const nS = v.slider('$n$', 20, 5000, 400, { int: true, log: true, onChange: () => { kS.value = kS.value; S.reset({ at: 'end' }); } });
        const kS = v.slider('rank $k$ as a fraction of $n$', 0, 1, 0.5, { step: 0.01, fmt: (x) => `k = ${Math.max(1, Math.round(x * nS.value))}`, onChange: () => S.reset({ at: 'end' }) });
        const piv = v.select('pivot', [{ value: 'random', label: 'random' }, { value: 'first', label: 'first element, sorted input' }], 'random', { onChange: () => S.reset({ at: 'end' }) });
        let seed = 21;
        v.button('New run', () => { seed++; S.reset({ at: 'end' }); });
        const F = v.stage({ x: [0.5, 400.5], y: [-8, 0.8], axes: false, height: 250, full: true, title: 'one run: the ranks still alive in each round' });
        const Hs = v.stage({ x: [0, 6], y: [0, 1], axes: 'box', height: 200, full: true, title: 'comparisons $\\div\\, n$ over 2000 runs' });
        const kOf = () => Math.max(1, Math.round(kS.value * nS.value));
        const trace = () => {
          const n = nS.value, k = kOf(), r = v.rng(seed), rounds = []; let lo = 1, hi = n, C = 0;
          // keys are the ranks 1..n, kept in a real array and partitioned for real
          let A = piv.value === 'first' ? range1(n) : r.shuffle(range1(n));
          for (;;) {
            const m = A.length; if (m === 1) { rounds.push({ lo, hi, p: A[0], m, found: true }); break; }
            const idx = piv.value === 'first' ? 0 : Math.floor(r() * m), x = A[idx], L = [], R = [];
            for (let j = 0; j < m; j++) if (j !== idx) { C++; (A[j] < x ? L : R).push(A[j]); }
            const found = x === k;
            rounds.push({ lo, hi, p: x, m, found, C });
            if (found) break;
            if (k < x) { A = L; hi = x - 1; } else { A = R; lo = x + 1; }
          }
          return rounds.map((rd, t) => ({ t, rounds, C: rd.C ?? rounds[t - 1]?.C ?? 0, total: C, line: rd.found ? [3] : [2, 4], note: rd.found ? `Round ${t + 1}: the pivot ${rd.p} has rank k — done after **${C}** comparisons.` : `Round ${t + 1}: ${rd.m} keys alive, pivot ${rd.p}; keep the ${k < rd.p ? 'left' : 'right'} side.` }));
        };
        const S = v.steps({ frames: trace, code: ['SELECT(A, p, r, k):', '  q ← RANDOMIZED-PARTITION(A, p, r)    // r − p comparisons', '  if q − p + 1 = k:  return A[q]', '  if k < q − p + 1:  return SELECT(A, p, q − 1, k)', '  else:  return SELECT(A, q + 1, r, k − (q − p + 1))'], codeTitle: 'Randomized-Select', codePos: 'below', speed: 1.5, start: 'end' });
        let hkey = '', hist = null;
        const simulate = (n, k) => {
          const r = v.rng(99), out = new Float64Array(2000);
          for (let t = 0; t < 2000; t++) {
            let lo = 1, hi = n, c = 0;
            for (;;) { const m = hi - lo + 1; if (m <= 1) break; const x = piv.value === 'first' ? lo : lo + Math.floor(r() * m); c += m - 1; if (x === k) break; if (k < x) hi = x - 1; else lo = x + 1; }
            out[t] = c / n;
          }
          return out;
        };
        v.render(() => {
          const f = S.frame, n = nS.value, k = kOf(), rounds = f.rounds || [];
          const nr = rounds.length;
          F.setView([0.5, n + 0.5], [-Math.max(nr, 6) + 0.2, 0.75]);
          F.vline(k, { color: 'green', width: 1.6, dash: [5, 4] });
          F.text(`k = ${k}`, k, 0.45, { align: 'center', size: 11, color: 'green', weight: 600 });
          const rowPx = F.height / Math.max(nr, 6), th = Math.min(0.62, Math.max(0.18, 1 - 3 / rowPx));
          rounds.slice(0, f.t + 1).forEach((rd, t) => {
            const y = -t - 0.2;
            F.rect(0.5, y - th / 2, n + 0.5, y + th / 2, { fill: 'grid', fillAlpha: 0.5, stroke: false });
            const keepL = k < rd.p, cur = t === f.t;
            F.rect(rd.lo - 0.5, y - th / 2, rd.hi + 0.5, y + th / 2, { fill: 'accent', fillAlpha: cur ? 0.3 : 0.14, stroke: false });
            if (!rd.found) F.rect(keepL ? rd.lo - 0.5 : rd.p - 0.5, y - th / 2, keepL ? rd.p + 0.5 : rd.hi + 0.5, y + th / 2, { fill: 'accent', fillAlpha: cur ? 0.55 : 0.4, stroke: false });
            const pw = Math.max(0.5, (n / F.width) * 1.6);
            F.rect(rd.p - pw, y - th / 2 - 0.05, rd.p + pw, y + th / 2 + 0.05, { fill: rd.found ? 'green' : 'gold', fillAlpha: 1, stroke: false });
            if (rowPx > 16) F.text(`${rd.m} alive`, n + 0.5, y, { align: 'right', size: 10, color: 'muted', dx: -4 });
          });
          // histogram
          const key = `${n}|${k}|${piv.value}`;
          if (key !== hkey) { hkey = key; hist = simulate(n, k); }
          const exact = piv.value === 'first' ? hist[0] : 2 * ((n + 1) * harmonic(n) - (n + 3 - k) * harmonic(n + 1 - k) - (k + 2) * harmonic(k) + n + 3) / n;
          const lo = Math.min(...hist), hi = Math.max(...hist), bound = 2 + 2 * Math.LN2;
          const x0 = piv.value === 'first' ? Math.max(0, lo - 1) : 0, x1 = piv.value === 'first' ? hi + 1 : Math.max(6, hi * 1.02);
          const Hd = v.M.histogram(Array.from(hist), { bins: 60, range: [x0, x1] }), top = Math.max(...Hd.counts);
          Hs.setView([x0, x1], [0, top * 1.22]);
          Hs.hist(Hd, { color: 'accent', fillAlpha: 0.35 });
          Hs.vline(exact, { color: 'green', width: 2 });
          if (piv.value === 'random') { Hs.vline(bound, { color: 'red', width: 1.6, dash: [6, 4] }); Hs.text('(2 + 2 ln 2) n', bound, top * 1.12, { size: 11, color: 'red', dx: 5 }); }
          Hs.text('exact E[C]/n', exact, top * 1.12, { size: 11, color: 'green', align: 'right', dx: -5 });
          if (S.atEnd) Hs.vline(f.total / n, { color: 'gold', width: 2.2 });
        });
        v.legend([['accent', 'ranks alive / kept side'], ['gold', 'pivot · this run (histogram)'], ['green', 'target rank $k$ · exact expectation'], ['red', 'bound for the worst $k$', { dash: true }]]);
        v.readout(() => {
          const f = S.frame, n = nS.value, k = kOf(), mean = hist ? hist.reduce((s, x) => s + x, 0) / hist.length : 0;
          const exact = 2 * ((n + 1) * harmonic(n) - (n + 3 - k) * harmonic(n + 1 - k) - (k + 2) * harmonic(k) + n + 3) / n;
          return `this run: ${f.rounds ? f.rounds.length : 0} rounds, **${f.total}** comparisons $= ${v.fix(f.total / n, 2)}\\,n$ · mean over 2000 runs ${v.fix(mean, 2)}$\\,n$` + (piv.value === 'random' ? ` · exact $E[C_{n,k}] = ${v.fix(exact, 3)}\\,n \\le 3.39\\,n$` : ` · deterministic: $\\sum_{t<k}(n-1-t) = ${f.total}$, quadratic for $k \\approx n/2$`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.18
    {
      num: '3.18',
      kind: 'Algorithm',
      name: 'Median of medians: selection in linear time',
      credit: 'Blum, Floyd, Pratt, Rivest & Tarjan, 1973',
      statement: String.raw`**Deterministic select** finds the $k$-th smallest of $n$ distinct keys in $O(n)$ worst-case time: split the keys into groups of $5$, find the median of each group, find the median $x$ of these $\lceil n/5\rceil$ medians **recursively**, partition around $x$, and recurse into the side containing rank $k$.

At least $3n/10-6$ keys lie on each side of $x$, so the running time satisfies $T(n)\le T(\lceil n/5\rceil)+T(7n/10+6)+O(n)$, whose solution is $T(n)=O(n)$ because $\tfrac15+\tfrac7{10}<1$.`,
      idea: String.raw`Arrange the groups as sorted columns and order the columns by their medians. Every key in the lower-left block (columns up to $x$'s, at or below the medians) is at most $x$, and every key in the upper-right block is at least $x$; each block holds about $3$ keys from half of the $n/5$ columns, i.e. $3n/10$. In the recursion tree (2.6) the subproblem sizes at each level add up to at most $\tfrac{9}{10}$ of the level above, so the level costs fall geometrically (1.12) and sum to at most $10\,cn$. With groups of $3$ the fractions add up to $\tfrac13+\tfrac23=1$, the levels stop shrinking and the bound degrades to $\Theta(n\log n)$.`,
      caption: String.raw`Step through one round on $9$ groups: sort each column (largest on top), order the columns by their medians, take the median of medians $x$ (gold), and see the green block that is surely smaller than $x$ and the red block that is surely larger. Switch the group size: with $g=3$ the guaranteed blocks shrink to a third. Bottom left: recursion-tree level costs as fractions of $n$ (geometric for $g=5,7$, flat for $g=3$). Bottom right: the worst-case recurrence $W(n)/n$ for each $g$, and comparisons of a real implementation on random input.`,
      deps: ['algo-3.17', 'algo-2.6', 'algo-1.12'],
      refs: ['CLRS 4e §9.3', 'Erickson Ch. 1'],
      tags: ['selection'],
      viz(v) {
        const m = 9, rng = v.rng(37);
        const gS = v.select('group size $g$', [{ value: 3, label: '3' }, { value: 5, label: '5' }, { value: 7, label: '7' }], 5, { onChange: () => { vals = distinct(rng, m * gS.value, 1, 99); S.reset({ at: 3 }); } });
        let vals = distinct(rng, m * 5, 1, 99);
        v.button('New keys', () => { vals = distinct(rng, m * gS.value, 1, 99); S.reset({ at: 3 }); });
        const Gd = v.stage({ x: [-0.7, m - 0.3], y: [-1.1, 5.7], axes: false, height: 300, full: true });
        const Lc = v.stage({ x: [-0.6, 10.6], y: [0, 1.15], axes: 'box', height: 200, weight: 1, minWidth: 250, title: 'recursion-tree level cost $\\div\\, n$', xlabel: 'level', yticks: [0.25, 0.5, 0.75, 1] });
        const Wp = v.stage({ x: [100, 1e6], y: [0, 26], xlog: true, axes: 'box', height: 200, weight: 1.3, minWidth: 300, title: 'comparisons $\\div\\, n$', xlabel: 'n' });
        const build = () => {
          const g = gS.value, n = m * g, frames = [], pos = (layout) => { const o = {}; layout.forEach((col, c) => col.forEach((id, r) => { o[id] = [c, r]; })); return o; };
          const raw = range0(m).map((c) => range0(g).map((r) => c * g + r));
          const sorted = raw.map((col) => col.slice().sort((a, b) => vals[a] - vals[b]));
          const mid = (g - 1) >> 1, byMed = sorted.slice().sort((A, B) => vals[A[mid]] - vals[B[mid]]);
          const mc = (m - 1) >> 1, x = byMed[mc][mid], X = vals[x];
          const less = vals.filter((y) => y < X).length;
          const lowBlock = new Set(), highBlock = new Set();
          byMed.forEach((col, c) => col.forEach((id, r) => { if (c <= mc && r <= mid && id !== x) lowBlock.add(id); if (c >= mc && r >= mid && id !== x) highBlock.add(id); }));
          frames.push({ pos: pos(raw), line: [3], note: `The ${n} keys, cut into ${m} groups of ${g} in input order.` });
          frames.push({ pos: pos(sorted), line: [3], med: true, note: `Sort each group (smallest at the bottom); its median sits in the middle row. Cost: a constant per group.` });
          frames.push({ pos: pos(byMed), line: [4], med: true, note: `Order the columns by their medians (in the algorithm this is not needed: the recursive call finds the median of the medians directly).` });
          frames.push({ pos: pos(byMed), line: [4], med: true, x, blocks: true, lowBlock, highBlock, note: `The median of medians is **${X}**. Green keys are ≤ ${X} for sure (${lowBlock.size} of them), red keys ≥ ${X} (${highBlock.size}).` });
          frames.push({ pos: pos(byMed), line: [5, 6, 7], med: true, x, blocks: true, lowBlock, highBlock, part: true, less, note: `Partition: ${less} keys are smaller than ${X}, ${n - 1 - less} larger. Either way the recursion keeps at most ${n - 1 - Math.min(lowBlock.size, highBlock.size)} of ${n} keys.` });
          return frames;
        };
        const S = v.steps({ frames: build, code: MOM_CODE, codeTitle: 'Select (median of medians)', codePos: 'below', speed: 0.7, start: 3, transition: 0.5 });
        // larger n
        const meas = {}, worst = {}, r2 = v.rng(4);
        for (const g of [3, 5, 7]) {
          const W = momWorst(g); worst[g] = []; meas[g] = [];
          for (let k = 0; k <= 40; k++) { const N = Math.round(100 * 10000 ** (k / 40)); worst[g].push([N, W(N) / N]); }
          for (let k = 0; k <= 8; k++) { const N = Math.round(100 * 200 ** (k / 8)); meas[g].push([N, momCount(r2.shuffle(range1(N)), N >> 1, g) / N]); }
        }
        v.render(() => {
          const f = S.frame, g = gS.value, p0 = S.prev.pos && Object.keys(S.prev.pos).length === Object.keys(f.pos).length ? S.prev.pos : f.pos, t = S.tween;
          Gd.setView([-0.7, m - 0.3], [-1.15, g + 0.75]);
          const mid = (g - 1) >> 1;
          if (f.med) Gd.hband(mid - 0.45, mid + 0.45, { color: 'gold', alpha: 0.08 });
          if (f.blocks) {
            const mc = (m - 1) >> 1;
            Gd.rect(-0.47, -0.47, mc + 0.47, mid + 0.47, { color: 'green', width: 2, dash: [5, 3] });
            Gd.rect(mc - 0.47, mid - 0.47, m - 0.53, g - 0.53, { color: 'red', width: 2, dash: [5, 3] });
          }
          vals.forEach((val, id) => {
            const [c1, r1] = f.pos[id], [c0, r0] = p0[id] || f.pos[id], c = c0 + (c1 - c0) * t, r = r0 + (r1 - r0) * t;
            let fill = null, stroke = 'muted', alpha = 0.3, width = 1.2;
            if (f.part) { fill = val < vals[f.x] ? 'green' : val > vals[f.x] ? 'red' : null; alpha = 0.16; }
            if (f.blocks && f.lowBlock.has(id)) { fill = 'green'; alpha = 0.4; stroke = 'green'; }
            if (f.blocks && f.highBlock.has(id)) { fill = 'red'; alpha = 0.35; stroke = 'red'; }
            if (f.med && r1 === mid) { stroke = 'gold'; width = 2; }
            if (id === f.x) { fill = 'gold'; alpha = 0.7; stroke = 'gold'; width = 2.6; }
            Gd.rect(c - 0.4, r - 0.4, c + 0.4, r + 0.4, { fill: fill || 'panel', fillAlpha: fill ? alpha : 1, color: stroke, width });
            Gd.text(String(val), c, r, { align: 'center', size: 13, weight: 600, color: 'ink', halo: false });
          });
          Gd.text(f.part ? `rank of x: ${f.less + 1} of ${m * g}` : `${m} groups of ${g}`, -0.45, -0.85, { size: 11.5, color: 'muted' });
          if (f.blocks) Gd.text(`guaranteed: ≥ ${f.lowBlock.size + 1} keys ≤ x, ≥ ${f.highBlock.size + 1} keys ≥ x  (≈ ${g === 5 ? '3n/10' : g === 3 ? 'n/3' : '2n/7'} each)`, m - 0.5, -0.85, { size: 11.5, color: 'ink', align: 'right' });
          // level costs
          const h = Math.ceil(g / 2), q = 1 / g + (1 - h / (2 * g)), Lq = []; let sum = 0;
          for (let l = 0; l <= 10; l++) { const c = q ** l; Lq.push(c); sum += c; Lc.rect(l - 0.34, 0, l + 0.34, c, { fill: g === 3 ? 'red' : 'accent', fillAlpha: 0.55, stroke: false }); }
          Lc.text(`each level × ${v.fix(q, 3)} → total ${g === 3 ? '≈ (levels) · n' : `≤ ${v.fix(1 / (1 - q), 1)} n`}`, 10.4, 1.08, { align: 'right', size: 11, color: g === 3 ? 'red' : 'accent', weight: 600 });
          // worst-case recurrence and measurements
          const COL = { 3: 'red', 5: 'accent', 7: 'teal' };
          for (const gg of [3, 5, 7]) {
            Wp.path(worst[gg], { color: COL[gg], width: gg === g ? 2.8 : 1.4, alpha: gg === g ? 1 : 0.55 });
            Wp.text(`g = ${gg}`, 1e6, worst[gg][worst[gg].length - 1][1], { align: 'right', baseline: 'bottom', size: 11, color: COL[gg], dy: -3 });
          }
          Wp.dots(meas[g], { r: 3.5, color: COL[g] });
          Wp.text('dots: real runs on random input', 120, 1.6, { size: 10.5, color: 'muted' });
        });
        v.legend([['gold', 'median row / median of medians $x$'], ['green', 'surely $\\le x$'], ['red', 'surely $\\ge x$ · groups of 3 (bottom)'], ['accent', 'groups of 5'], ['teal', 'groups of 7']]);
        v.readout(() => {
          const g = gS.value, h = Math.ceil(g / 2), q = 1 / g + 1 - h / (2 * g);
          return `$g = ${g}$: $T(n) \\le T(n/${g}) + T(${v.fix(1 - h / (2 * g), 3)}\\,n) + O(n)$, and $\\tfrac1{${g}} + ${v.fix(1 - h / (2 * g), 3)} = ${v.fix(q, 3)}$ ${q < 1 - 1e-9 ? '$< 1$: **linear**' : '$= 1$: the levels do not shrink, **$\\Theta(n\\log n)$** bound'} · worst-case recurrence at $n = 10^6$: $W(n) = ${v.fix(worst[g][worst[g].length - 1][1], 1)}\\,n$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.19
    {
      num: '3.19',
      kind: 'Theorem',
      name: 'Minimum and maximum together in ⌈3n/2⌉ − 2 comparisons',
      credit: 'Pohl, 1972',
      statement: String.raw`The minimum and the maximum of $n\ge2$ distinct keys can be found together with $\lceil 3n/2\rceil-2$ comparisons, and no comparison-based algorithm can do better in the worst case.

**Upper bound:** compare the keys in pairs; the larger of each pair competes for the maximum and the smaller for the minimum (an odd key out joins both contests), using $\lfloor n/2\rfloor$ comparisons plus about $n/2-1$ for each contest. Finding the two separately would cost $2n-3$.`,
      idea: String.raw`An adversary argument (3.16) with bookkeeping. Give each key one unit for "might still be the maximum" (it has never lost) and one for "might still be the minimum" (it has never won): $2n$ units at the start, and a correct algorithm must get down to $2$. The adversary keeps values it can still adjust (raise a key that never lost, lower one that never won) and answers so that a comparison destroys two units only when it involves two untouched keys; every other comparison destroys at most one. At most $\lfloor n/2\rfloor$ comparisons can involve two untouched keys, so at least $\lfloor n/2\rfloor + (2n-2-2\lfloor n/2\rfloor)=\lceil 3n/2\rceil-2$ comparisons are needed.`,
      caption: String.raw`The four boxes are the adversary's classes: untouched keys hold 2 units, keys that only won or only lost hold 1, keys that did both hold 0. Click two keys to compare them (or step a strategy) and watch the keys move between boxes; the gold arrow points from winner to loser. Only a comparison of two untouched keys removes two units. The right panel plots units left against comparisons: the pairing strategy (dashed) reaches 2 units in exactly $\lceil 3n/2\rceil-2$ comparisons, and no play can beat it.`,
      deps: ['algo-3.16'],
      refs: ['CLRS 4e §9.1', 'Erickson notes: Adversary Arguments'],
      tags: ['selection', 'lower bounds'],
      viz(v) {
        let n = 8, won, lostA, val, cmps, hist, pick = -1, last = null, msg = '', stage = null;
        const B = v.stage({ x: [0, 2], y: [0, 2], axes: false, height: 330, weight: 1.35, minWidth: 330 });
        const P = v.stage({ x: [0, 16], y: [0, 17], axes: 'box', height: 330, weight: 1, minWidth: 240, title: 'units left vs comparisons', xlabel: 'comparisons' });
        const units = () => { let u = 0; for (let i = 0; i < n; i++) u += (lostA[i] ? 0 : 1) + (won[i] ? 0 : 1); return u; };
        const lb = () => Math.ceil((3 * n) / 2) - 2;
        const reset = () => {
          n = nS.value; won = new Array(n).fill(false); lostA = new Array(n).fill(false); val = new Array(n).fill(0); cmps = 0; hist = [[0, 2 * n]]; pick = -1; last = null; msg = ''; stage = { phase: 0, t: 1, champ: 0, minC: -1 };
        };
        const compare = (x, y) => {
          if (x === y) return;
          const lo = Math.min(...val) - 1, hi = Math.max(...val) + 1;
          const can = (w, l) => !lostA[w] || !won[l] || val[w] > val[l];
          const cost = (w, l) => (won[w] ? 0 : 1) + (lostA[l] ? 0 : 1);
          let w = x, l = y;
          if (!can(x, y) || (can(y, x) && cost(y, x) < cost(x, y))) { w = y; l = x; }
          const before = units();
          if (!lostA[w]) val[w] = hi; else if (!won[l]) val[l] = lo;
          won[w] = true; lostA[l] = true; cmps++; const after = units(); hist.push([cmps, after]); last = [w, l];
          msg = `${NAMES[w]} > ${NAMES[l]}: ${before - after} unit${before - after === 1 ? '' : 's'} destroyed.`;
        };
        const auto = () => {
          if (units() <= 2) { msg = 'Done: one key never lost and one never won.'; return; }
          const N = range0(n).filter((i) => !won[i] && !lostA[i]), maxC = range0(n).filter((i) => !lostA[i]), minC = range0(n).filter((i) => !won[i]);
          if (mode.value === 'pair') {
            if (N.length >= 2) compare(N[0], N[1]);
            else if (maxC.length >= 2) compare(maxC[0], maxC[1]);
            else if (minC.length >= 2) compare(minC[0], minC[1]);
          } else {
            const st = stage;
            if (st.phase === 0) { compare(st.champ, st.t); st.champ = last[0]; st.t++; if (st.t >= n) { st.phase = 1; st.t = 0; st.minC = -1; } }
            else {
              while (st.t < n && st.t === st.champ) st.t++;
              if (st.minC < 0) { st.minC = st.t; st.t++; while (st.t < n && st.t === st.champ) st.t++; }
              if (st.t < n) { compare(st.minC, st.t); st.minC = last[1]; st.t++; }
            }
          }
        };
        const mode = v.select('', [{ value: 'you', label: 'you play' }, { value: 'pair', label: 'pairing strategy' }, { value: 'naive', label: 'max, then min' }], 'pair', { onChange: (m) => { reset(); stepBtn.hidden = m === 'you'; } });
        const nS = v.slider('$n$', 2, 12, 8, { int: true, onChange: reset });
        const stepBtn = v.button('Next comparison', auto);
        v.button('Reset', reset);
        reset();
        for (let k = 0; k < 6; k++) auto();
        const BOX = [
          { key: 'N', x0: 0, y0: 1, title: 'untouched — 2 units', sub: 'could be max or min', col: 'accent' },
          { key: 'W', x0: 1, y0: 1, title: 'won only — 1 unit', sub: 'could be the max', col: 'orange' },
          { key: 'L', x0: 0, y0: 0, title: 'lost only — 1 unit', sub: 'could be the min', col: 'purple' },
          { key: 'X', x0: 1, y0: 0, title: 'won and lost — 0 units', sub: 'neither', col: 'muted' },
        ];
        const cls = (i) => (won[i] ? (lostA[i] ? 'X' : 'W') : lostA[i] ? 'L' : 'N');
        let where = [];
        const place = () => {
          where = new Array(n);
          for (const b of BOX) {
            const ids = range0(n).filter((i) => cls(i) === b.key), per = 4;
            ids.forEach((id, k) => { const c = k % per, r = Math.floor(k / per); where[id] = [b.x0 + 0.17 + c * 0.22, b.y0 + 0.6 - r * 0.24]; });
          }
        };
        B.onClick((x, y) => {
          if (mode.value !== 'you') return;
          place(); let best = -1, bd = 22;
          for (let i = 0; i < n; i++) { const d = Math.hypot(B.X(where[i][0]) - B.X(x), B.Y(where[i][1]) - B.Y(y)); if (d < bd) { bd = d; best = i; } }
          if (best < 0) return;
          if (pick < 0) pick = best; else { if (pick !== best) compare(pick, best); pick = -1; }
        });
        v.render(() => {
          place();
          for (const b of BOX) {
            B.rect(b.x0 + 0.02, b.y0 + 0.02, b.x0 + 0.98, b.y0 + 0.98, { fill: b.col, fillAlpha: 0.07, color: b.col, width: 1.4 });
            B.text(b.title, b.x0 + 0.06, b.y0 + 0.9, { size: 12, weight: 700, color: b.col === 'muted' ? 'ink' : b.col });
            B.text(b.sub, b.x0 + 0.06, b.y0 + 0.81, { size: 10.5, color: 'muted' });
          }
          if (last) { const [w, l] = last, [x1, y1] = where[w], [x2, y2] = where[l], d = Math.hypot(x2 - x1, y2 - y1) || 1, k = 0.075 / d; B.arrow(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, x2 - (x2 - x1) * k, y2 - (y2 - y1) * k, { color: 'gold', width: 2.6 }); }
          for (let i = 0; i < n; i++) {
            const [x, y] = where[i], b = BOX.find((q) => q.key === cls(i));
            B.dot(x, y, { r: 15, color: b.col === 'muted' ? 'muted' : b.col, alpha: b.key === 'X' ? 0.45 : 0.85 });
            if (i === pick) B.dot(x, y, { r: 19, hollow: true, color: 'gold', width: 2.6 });
            B.text(NAMES[i], x, y, { align: 'center', size: 14, weight: 700, color: 'panel', halo: false });
          }
          // units plot
          P.setView([0, Math.max(2 * n, cmps + 1)], [0, 2 * n + 1]);
          const half = Math.floor(n / 2), best = [[0, 2 * n], [half, 2 * n - 2 * half], [lb(), 2]];
          P.path(best, { color: 'green', width: 1.6, dash: [6, 4] });
          P.hline(2, { color: 'muted', width: 1, dash: [2, 3] });
          P.vline(lb(), { color: 'red', width: 1.2, dash: [4, 4] });
          P.text(`⌈3n/2⌉ − 2 = ${lb()}`, lb(), 2 * n * 0.92, { size: 11, color: 'red', dx: 5 });
          P.path(hist, { color: 'gold', width: 2.6 }); P.dot(cmps, units(), { r: 5.5, color: 'gold' });
        });
        v.legend([['gold', 'your run / last comparison'], ['green', 'pairing strategy: the fastest possible', { dash: true }], ['red', 'lower bound', { dash: true }]]);
        v.readout(() => {
          const U = units(), done = U <= 2;
          const mx = range0(n).filter((i) => !lostA[i]), mn = range0(n).filter((i) => !won[i]);
          return `comparisons **${cmps}** · units left **${U}** (start $2n = ${2 * n}$, goal 2) · lower bound $\\lceil 3n/2\\rceil - 2 = ${lb()}$, naive $2n - 3 = ${2 * n - 3}$ · ` + (done ? `**max ${NAMES[mx[0]]}, min ${NAMES[mn[0]]}**, found in ${cmps} comparisons` : msg || 'click two keys to compare them');
        });
      },
    },
  ],
};
