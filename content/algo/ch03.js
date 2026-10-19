// Algorithms — Chapter 3: Sorting and selection

// ---------- shared helpers ----------
const TAG = ['blue', 'orange', 'green', 'purple', 'pink', 'teal'];
const LETTER = 'abcdefgh';
const range1 = (n) => Array.from({ length: n }, (_, i) => i + 1);
/** Number of pairs i < j with a[i] > a[j] (nulls skipped). */
function inversions(a) {
  let c = 0;
  for (let i = 0; i < a.length; i++) if (a[i] != null) for (let j = i + 1; j < a.length; j++) if (a[j] != null && a[i] > a[j]) c++;
  return c;
}
/** Position of node i (0-based) of a complete binary tree: x in (0, 1), y = −depth. */
function hxy(i) { const d = Math.floor(Math.log2(i + 1)); return [(i + 1 - (1 << d) + 0.5) / (1 << d), -d]; }
const depthOf = (n) => (n > 0 ? Math.floor(Math.log2(n)) : 0);
/** Height of node i in a heap of n nodes (length of its leftmost downward path). */
function heightOf(i, n) { let h = 0, c = 2 * i + 1; while (c < n) { h++; c = 2 * c + 1; } return h; }
const nodeR = (s, D) => Math.max(6, Math.min(15, (s.width / (1 << D)) * 0.36));
/** A tree node: outlined disc, optional tint, centred label. */
function disc(s, x, y, r, label, o = {}) {
  const { stroke = 'muted', fill = null, alpha = 0.22, width = 1.6, text = 'ink', size } = o;
  s.dot(x, y, { r, hollow: true, color: stroke, width });
  if (fill) s.dot(x, y, { r: r - width / 2, color: fill, alpha, ring: false });
  if (label != null && r >= 7) s.text(String(label), x, y, { align: 'center', baseline: 'middle', size: size || Math.max(9, Math.min(13, r * 0.92)), weight: 600, color: text, halo: false });
}
/** Draw the first n entries of A as a complete binary tree; o.edge(p, c) and o.node(i) return styles. */
function drawHeapTree(s, A, n, o = {}) {
  const D = o.D ?? depthOf(n), r = o.r ?? nodeR(s, D);
  for (let i = 1; i < n; i++) {
    const p = (i - 1) >> 1, [x0, y0] = hxy(p), [x1, y1] = hxy(i), st = (o.edge && o.edge(p, i)) || {};
    s.line(x0, y0, x1, y1, { color: st.color || 'faint', width: st.width || 1.6, dash: st.dash });
  }
  for (let i = 0; i < n; i++) { const [x, y] = hxy(i), st = (o.node && o.node(i)) || {}; disc(s, x, y, r, st.label !== undefined ? st.label : A[i], st); }
  return r;
}
/** Index of the tree node nearest to (x, y) within the node radius, or −1. */
function hitNode(s, x, y, n, r) {
  let best = -1, bd = r + 6;
  for (let i = 0; i < n; i++) { const [nx, ny] = hxy(i), d = Math.hypot(s.X(nx) - s.X(x), s.Y(ny) - s.Y(y)); if (d < bd) { bd = d; best = i; } }
  return best;
}
/** A row of array cells: cell i spans [x0 + i·w, x0 + (i+1)·w] × [y, y + h]; o.style(i, v) → {fill, alpha, stroke, width, text, dash, hidden}. */
function cells(s, vals, o = {}) {
  const { x0 = 0, y = 0, w = 1, h = 0.9, gap = 0.07, size = 13 } = o;
  vals.forEach((val, i) => {
    const st = (o.style && o.style(i, val)) || {};
    if (st.hidden) return;
    const X0 = x0 + i * w + gap, X1 = x0 + (i + 1) * w - gap;
    s.rect(X0, y, X1, y + h, { fill: st.fill || 'panel', fillAlpha: st.fill ? st.alpha ?? 0.25 : 1, color: st.stroke || 'muted', width: st.width || 1.2, dash: st.dash });
    if (val != null && val !== '') s.text(String(val), (X0 + X1) / 2, y + h / 2, { align: 'center', baseline: 'middle', size: st.size || size, weight: st.weight || 600, color: st.text || 'ink', halo: false });
  });
}
/** Half-ellipse joining x1 and x2 (data units), bulging by `bulge` (negative = downward). */
function arc(s, x1, x2, y, bulge, st) {
  const pts = [];
  for (let k = 0; k <= 28; k++) { const t = (Math.PI * k) / 28; pts.push([(x1 + x2) / 2 - ((x2 - x1) / 2) * Math.cos(t), y + bulge * Math.sin(t)]); }
  s.path(pts, st);
}
/** Max-heapify the prefix A[0..n) in place (Floyd); returns the number of swaps. */
function floyd(A, n, less = (a, b) => a < b) {
  let swaps = 0;
  for (let i = (n >> 1) - 1; i >= 0; i--) {
    let k = i;
    for (;;) {
      const l = 2 * k + 1, r = l + 1; let g = k;
      if (l < n && less(A[g], A[l])) g = l;
      if (r < n && less(A[g], A[r])) g = r;
      if (g === k) break;
      [A[k], A[g]] = [A[g], A[k]]; k = g; swaps++;
    }
  }
  return swaps;
}
/** Distinct random integers in [lo, hi]. */
function distinct(r, n, lo, hi) { const pool = []; for (let x = lo; x <= hi; x++) pool.push(x); return r.shuffle(pool).slice(0, n); }

// ---------- 3.1: five card sorts, instrumented for stability and memory ----------
function sortCards(alg, cards, K) {
  let a = cards.slice(); const n = a.length; let extra = 1, cmps = 0;
  const lt = (x, y) => { cmps++; return x.rank < y.rank; };
  if (alg === 'insertion') {
    for (let j = 1; j < n; j++) { const key = a[j]; let i = j - 1; while (i >= 0 && lt(key, a[i])) { a[i + 1] = a[i]; i--; } a[i + 1] = key; }
  } else if (alg === 'selection') {
    for (let i = 0; i < n - 1; i++) { let m = i; for (let j = i + 1; j < n; j++) if (lt(a[j], a[m])) m = j; [a[i], a[m]] = [a[m], a[i]]; }
  } else if (alg === 'merge') {
    const buf = new Array(n); extra = n;
    const rec = (lo, hi) => {
      if (hi - lo < 2) return;
      const mid = (lo + hi) >> 1; rec(lo, mid); rec(mid, hi);
      let i = lo, j = mid, k = lo;
      while (i < mid && j < hi) buf[k++] = lt(a[j], a[i]) ? a[j++] : a[i++];
      while (i < mid) buf[k++] = a[i++];
      while (j < hi) buf[k++] = a[j++];
      for (k = lo; k < hi; k++) a[k] = buf[k];
    };
    rec(0, n);
  } else if (alg === 'heap') {
    const sift = (i, m) => { for (;;) { const l = 2 * i + 1, r = l + 1; let g = i; if (l < m && lt(a[g], a[l])) g = l; if (r < m && lt(a[g], a[r])) g = r; if (g === i) return; [a[i], a[g]] = [a[g], a[i]]; i = g; } };
    for (let i = (n >> 1) - 1; i >= 0; i--) sift(i, n);
    for (let m = n - 1; m > 0; m--) { [a[0], a[m]] = [a[m], a[0]]; sift(0, m); }
  } else if (alg === 'counting') {
    const C = new Array(K + 1).fill(0), B = new Array(n); extra = K + 1 + n;
    for (const c of a) C[c.rank]++;
    for (let i = 1; i <= K; i++) C[i] += C[i - 1];
    for (let j = n - 1; j >= 0; j--) B[--C[a[j].rank]] = a[j];
    a = B;
  }
  return { out: a, extra, cmps };
}

// ---------- 3.2: insertion sort trace ----------
const INS_CODE = ['for j ← 2 to n', '  key ← A[j]', '  i ← j − 1', '  while i > 0 and A[i] > key', '    A[i+1] ← A[i]        // shift: removes one inversion', '    i ← i − 1', '  A[i+1] ← key'];
function insertionTrace(vals) {
  const n = vals.length, A = vals.slice(), frames = [], inv0 = inversions(vals); let shifts = 0, cmps = 0;
  const snap = (o) => frames.push({ arr: A.slice(), shifts, cmps, inv0, key: null, hole: -1, ...o });
  snap({ line: [], sorted: 1, note: `The input has **${inv0}** inversions (arcs). The first key alone is a sorted prefix (green).` });
  for (let j = 1; j < n; j++) {
    const key = A[j]; let i = j - 1, hole = j; A[j] = null;
    snap({ line: [1, 2, 3], j, sorted: j, key, hole, note: `Lift the key **${key}** out of position ${j + 1}. Its orange arcs are the inversions it forms with larger keys of the prefix.` });
    while (i >= 0) {
      cmps++;
      const big = A[i] > key;
      snap({ line: 4, j, sorted: j, key, hole, cmp: i, note: big ? `${A[i]} > ${key}: this pair is inverted, so ${A[i]} must move right.` : `${A[i]} ≤ ${key}: no inversion here, stop.` });
      if (!big) break;
      A[i + 1] = A[i]; A[i] = null; hole = i; i--; shifts++;
      snap({ line: [5, 6], j, sorted: j, key, hole, note: `Shift one place right: exactly one inversion disappears (shifts = ${shifts}).` });
    }
    A[hole] = key;
    snap({ line: 7, j, sorted: j + 1, placed: hole, note: `Drop **${key}** into the gap: the first ${j + 1} keys are sorted and carry no arcs.` });
  }
  frames[frames.length - 1].note = `Sorted: **${shifts}** shifts, exactly the number of inversions, and ${cmps} comparisons.`;
  return frames;
}

// ---------- 3.5–3.7: heap traces ----------
const SIFT_CODE = ['MAX-HEAPIFY(A, i):', '  l ← 2i;   r ← 2i + 1', '  largest ← l  if l ≤ n and A[l] > A[i],  else i', '  if r ≤ n and A[r] > A[largest]:  largest ← r', '  if largest ≠ i', '    swap A[i] ↔ A[largest]', '    MAX-HEAPIFY(A, largest)      // one level down'];
function siftTrace(A0, n) {
  const A = A0.slice(), frames = [], path = [0]; let i = 0, swaps = 0, cmps = 0;
  const snap = (o) => frames.push({ A: A.slice(), i, swaps, cmps, path: path.slice(), ...o });
  snap({ line: 1, note: `The root now holds **${A[0]}**; everything below it is still a heap, so the only possible violations are at the root.` });
  for (;;) {
    const l = 2 * i + 1, r = l + 1; let g = i;
    if (l < n) { cmps++; if (A[l] > A[g]) g = l; }
    if (r < n) { cmps++; if (A[r] > A[g]) g = r; }
    const kids = [l, r].filter((k) => k < n);
    if (!kids.length) { snap({ line: [2, 3, 5], kids, largest: g, done: true, note: `**${A[i]}** has reached a leaf: no children, nothing to fix.` }); break; }
    if (g === i) { snap({ line: [3, 4, 5], kids, largest: g, done: true, note: `**${A[i]}** is at least as large as its children: the heap property holds everywhere.` }); break; }
    snap({ line: [3, 4], kids, largest: g, note: `Children ${kids.map((k) => A[k]).join(' and ')}: the larger, **${A[g]}**, beats ${A[i]}.` });
    [A[i], A[g]] = [A[g], A[i]]; swaps++; i = g; path.push(g);
    snap({ line: [6, 7], swapped: true, note: `Swap: ${A[i]} sinks one level (swap ${swaps}); any violation is now only below it.` });
  }
  return frames;
}
const BUILD_CODE = ['for i ← ⌊n/2⌋ downto 1', '  MAX-HEAPIFY(A, i)      // sinks at most height(i) levels'];
function buildTrace(A0) {
  const A = A0.slice(), n = A.length, D = depthOf(n), frames = [], byH = new Array(D + 1).fill(0); let swaps = 0;
  frames.push({ A: A.slice(), cur: -1, path: [], s: 0, swaps, byH: byH.slice(), line: [], note: 'Leaves (height 0) are heaps already. Work bottom-up from the last internal node.' });
  for (let i = (n >> 1) - 1; i >= 0; i--) {
    let k = i, s = 0; const path = [k];
    for (;;) {
      const l = 2 * k + 1, r = l + 1; let g = k;
      if (l < n && A[l] > A[g]) g = l;
      if (r < n && A[r] > A[g]) g = r;
      if (g === k) break;
      [A[k], A[g]] = [A[g], A[k]]; k = g; path.push(k); s++;
    }
    const h = heightOf(i, n); swaps += s; byH[h] += s;
    frames.push({ A: A.slice(), cur: i, path, s, h, swaps, byH: byH.slice(), line: [1, 2], note: `MAX-HEAPIFY at node ${i + 1} (height ${h}): ${s} swap${s === 1 ? '' : 's'}, at most ${h}.` });
  }
  frames[frames.length - 1].note += ` Done: a max-heap after **${swaps}** swaps in total.`;
  return frames;
}
const HS_CODE = ['BUILD-MAX-HEAP(A)', 'for i ← n downto 2', '  swap A[1] ↔ A[i]          // the max reaches its final place', '  heap-size ← heap-size − 1', '  MAX-HEAPIFY(A, 1)         // ≤ 2 comparisons per level'];
function heapsortTrace(vals) {
  const A = vals.slice(), n = A.length, frames = []; let cmps = 0, size = n;
  const snap = (o) => frames.push({ A: A.slice(), size, cmps, path: [], ...o });
  const sift = (i, m, each) => {
    const path = [i];
    for (;;) {
      const l = 2 * i + 1, r = l + 1; let g = i;
      if (l < m) { cmps++; if (A[l] > A[g]) g = l; }
      if (r < m) { cmps++; if (A[r] > A[g]) g = r; }
      if (g === i) return path;
      [A[i], A[g]] = [A[g], A[i]]; i = g; path.push(i);
      if (each) each(path.slice());
    }
  };
  snap({ line: [], note: 'The unsorted input, viewed as a complete binary tree.' });
  for (let i = (n >> 1) - 1; i >= 0; i--) sift(i, n);
  snap({ line: 1, note: `BUILD-MAX-HEAP used ${cmps} comparisons; the maximum, **${A[0]}**, sits at the root.` });
  for (let m = n - 1; m >= 1; m--) {
    [A[0], A[m]] = [A[m], A[0]]; size = m;
    snap({ line: [2, 3, 4], swap: [0, m], note: `Swap the maximum **${A[m]}** to position ${m + 1}, its final place; the heap shrinks to ${m}.` });
    sift(0, m, (path) => snap({ line: 5, path, cur: path[path.length - 1], note: `Sift ${A[path[path.length - 1]]} down: ${cmps} comparisons so far.` }));
  }
  snap({ line: [], size: 0, done: true, note: `Sorted with **${cmps}** comparisons.` });
  return frames;
}
function heapsortCount(a) {
  const A = a.slice(), n = A.length; let c = 0;
  const sift = (i, m) => { for (;;) { const l = 2 * i + 1, r = l + 1; let g = i; if (l < m) { c++; if (A[l] > A[g]) g = l; } if (r < m) { c++; if (A[r] > A[g]) g = r; } if (g === i) return; [A[i], A[g]] = [A[g], A[i]]; i = g; } };
  for (let i = (n >> 1) - 1; i >= 0; i--) sift(i, n);
  for (let m = n - 1; m >= 1; m--) { [A[0], A[m]] = [A[m], A[0]]; sift(0, m); }
  return c;
}

// ---------- 3.8: min-heap priority queue traces ----------
const PQ_CODE = {
  insert: ['INSERT(Q, k):', '  n ← n + 1;   A[n] ← k', '  i ← n', '  while i > 1 and A[parent(i)] > A[i]', '    swap A[i] ↔ A[parent(i)]', '    i ← parent(i)'],
  extract: ['EXTRACT-MIN(Q):', '  min ← A[1]', '  A[1] ← A[n];   n ← n − 1', '  MIN-HEAPIFY(A, 1)        // sift down one path', '  return min'],
  decrease: ['DECREASE-KEY(Q, i, k):', '  if k > A[i]:  error "new key is larger"', '  A[i] ← k', '  while i > 1 and A[parent(i)] > A[i]', '    swap A[i] ↔ A[parent(i)]', '    i ← parent(i)'],
};
function bubbleUp(A, i, frames, mk) {
  let sw = 0; const path = [i];
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (A[p] <= A[i]) { frames.push(mk({ cur: i, cmp: p, path: path.slice(), line: 4, note: `${A[p]} ≤ ${A[i]}: parent is not larger — stop.` })); break; }
    [A[p], A[i]] = [A[i], A[p]]; i = p; path.push(i); sw++;
    frames.push(mk({ cur: i, path: path.slice(), line: [5, 6], note: `Parent was larger: swap, ${A[i]} rises one level.` }));
  }
  return { sw, path };
}
function pqOp(op, A0, arg) {
  const A = A0.slice(), frames = [];
  const mk = (o) => ({ A: A.slice(), n: A.length, op, ...o });
  let sw = 0, msg = '', ok = true;
  if (op === 'insert') {
    A.push(arg); const i = A.length - 1;
    frames.push(mk({ cur: i, path: [i], line: [2, 3], note: `Append **${arg}** as the last leaf (position ${i + 1}).` }));
    sw = bubbleUp(A, i, frames, mk).sw;
    msg = `INSERT(${arg}): ${sw} swap${sw === 1 ? '' : 's'} up one path`;
  } else if (op === 'extract') {
    if (!A.length) return { A, frames: [mk({ line: [], note: 'The queue is empty.' })], sw: 0, ok: false, msg: 'the queue is empty' };
    const min = A[0], last = A.pop();
    if (A.length) A[0] = last;
    frames.push(mk({ cur: 0, path: [0], line: [2, 3], note: `Remove the minimum **${min}**; move the last leaf ${last} to the root.` }));
    let i = 0; const path = [0];
    for (;;) {
      const l = 2 * i + 1, r = l + 1; let g = i;
      if (l < A.length && A[l] < A[g]) g = l;
      if (r < A.length && A[r] < A[g]) g = r;
      if (g === i) { frames.push(mk({ cur: i, path: path.slice(), line: 4, note: `${A[i] ?? '—'} is no larger than its children — stop.` })); break; }
      [A[i], A[g]] = [A[g], A[i]]; i = g; path.push(i); sw++;
      frames.push(mk({ cur: i, path: path.slice(), line: 4, note: `A child was smaller: swap, ${A[i]} sinks one level.` }));
    }
    msg = `EXTRACT-MIN returned ${min}: ${sw} swap${sw === 1 ? '' : 's'} down one path`;
  } else {
    const [i, k] = arg;
    if (i < 0 || i >= A.length) return { A, frames: [mk({ line: [], note: 'Click a node first.' })], sw: 0, ok: false, msg: 'click a node to choose it first' };
    if (k > A[i]) { ok = false; frames.push(mk({ cur: i, path: [i], line: 2, bad: true, note: `**${k} > ${A[i]}**: DECREASE-KEY refuses — raising a key would need a sift-down instead.` })); return { A, frames, sw: 0, ok, msg: `refused: ${k} is larger than ${A0[i]}` }; }
    const old = A[i]; A[i] = k;
    frames.push(mk({ cur: i, path: [i], line: 3, note: `Lower ${old} to **${k}**.` }));
    sw = bubbleUp(A, i, frames, mk).sw;
    msg = `DECREASE-KEY ${old} → ${k}: ${sw} swap${sw === 1 ? '' : 's'} up one path`;
  }
  return { A, frames, sw, ok, msg };
}

// ---------- 3.9: quicksort (Lomuto) trace ----------
const QS_CODE = ['QUICKSORT(A, p, r):   if p < r', '  choose a pivot by the rule;  swap it into A[r]', '  x ← A[r];   i ← p − 1', '  for j ← p to r − 1', '    if A[j] ≤ x', '      i ← i + 1;   swap A[i] ↔ A[j]', '  swap A[i+1] ↔ A[r];   q ← i + 1', '  QUICKSORT(A, p, q − 1);   QUICKSORT(A, q + 1, r)'];
function quickTrace(vals, rule, rnd) {
  const A = vals.slice(), n = A.length, frames = [], calls = [], fin = new Array(n).fill(false); let cmps = 0;
  const snap = (o) => frames.push({ A: A.slice(), cmps, fin: fin.slice(), calls: calls.map((c) => ({ ...c })), ...o });
  const rec = (p, r, depth, parent) => {
    if (p > r) return;
    const call = { id: calls.length, p, r, depth, parent, q: null, size: r - p + 1 }; calls.push(call);
    const id = call.id;
    if (p === r) { fin[p] = true; call.q = p; snap({ cur: id, p, r, line: 1, note: `A single key (${A[p]}) is already sorted.` }); return; }
    let k = r;
    if (rule === 'first') k = p;
    else if (rule === 'random') k = p + Math.floor(rnd() * (r - p + 1));
    else if (rule === 'median3') {
      const m = (p + r) >> 1, t = [p, m, r]; cmps += 3;
      t.sort((a, b) => A[a] - A[b]); k = t[1];
    }
    if (k !== r) [A[k], A[r]] = [A[r], A[k]];
    const x = A[r]; let i = p - 1;
    snap({ cur: id, p, r, i, j: p, x, line: [2, 3], note: `Partition A[${p + 1}..${r + 1}] around the pivot **${x}**${k !== r ? ' (moved to the end)' : ''}.` });
    for (let j = p; j < r; j++) {
      cmps++;
      const le = A[j] <= x;
      if (le) { i++; [A[i], A[j]] = [A[j], A[i]]; }
      snap({ cur: id, p, r, i, j: j + 1, x, look: le ? i : j, line: le ? [5, 6] : [4, 5], note: le ? `${A[i]} ≤ ${x}: swap it into the green region.` : `${A[j]} > ${x}: it stays in the orange region.` });
    }
    [A[i + 1], A[r]] = [A[r], A[i + 1]]; const q = i + 1; fin[q] = true; call.q = q; call.left = q - p; call.right = r - q;
    snap({ cur: id, p, r, q, x, line: 7, note: `The pivot ${x} lands in its final place ${q + 1}: split ${q - p} | ${r - q}.` });
    rec(p, q - 1, depth + 1, id); rec(q + 1, r, depth + 1, id);
  };
  rec(0, n - 1, 0, -1);
  snap({ line: [], done: true, note: `Sorted with **${cmps}** comparisons.` });
  return { frames, cmps, calls: frames[frames.length - 1].calls };
}
/** Comparisons of quicksort with Lomuto partition (explicit stack); pivot 'first' or 'last'. */
function quickCount(a, rule) {
  const A = a.slice(); let c = 0; const st = [[0, A.length - 1]];
  while (st.length) {
    const [p, r] = st.pop(); if (p >= r) continue;
    if (rule === 'first') [A[p], A[r]] = [A[r], A[p]];
    const x = A[r]; let i = p - 1;
    for (let j = p; j < r; j++) { c++; if (A[j] <= x) { i++; const t = A[i]; A[i] = A[j]; A[j] = t; } }
    [A[i + 1], A[r]] = [A[r], A[i + 1]]; st.push([p, i], [i + 2, r]);
  }
  return c;
}
const binEntropy = (a) => (a <= 0 || a >= 1 ? 0 : -a * Math.log2(a) - (1 - a) * Math.log2(1 - a));

export default {
  collection: 'algo',
  chapter: 3,
  title: 'Sorting and selection',
  summary: String.raw`Sorting is the laboratory in which most techniques of algorithm analysis were first tried. Insertion sort, heapsort and quicksort put loop invariants, data-structure design and randomization to work, and a decision-tree argument shows that no comparison sort can beat $n\log n$. Counting, radix and bucket sort escape that bound by looking at the keys instead of comparing them, and selecting the $k$-th smallest element turns out to be possible in linear time, both with randomness and without it.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'The sorting problem; stability and sorting in place',
      statement: String.raw`**Sorting.** Given $n$ records $a_1,\dots,a_n$, each carrying a key from a totally ordered set, output the same records rearranged as $a_{\pi(1)},\dots,a_{\pi(n)}$ for a permutation $\pi$ with $\mathrm{key}(a_{\pi(1)})\le\mathrm{key}(a_{\pi(2)})\le\dots\le\mathrm{key}(a_{\pi(n)})$.

A sorting algorithm is **stable** if records with equal keys leave in the order they arrived: whenever $i<j$ and $\mathrm{key}(a_i)=\mathrm{key}(a_j)$, the record $a_i$ precedes $a_j$ in the output. It sorts **in place** if, apart from the input array, it uses only $O(1)$ extra memory cells (some authors also allow an $O(\log n)$ recursion stack).`,
      idea: String.raw`The keys determine the output only up to the order of ties; stability is the promise to break ties by input position. That is what lets a second sort on a more significant key keep the order produced by a first sort, the principle behind radix sort (3.14). Insertion and merge sort move a record past another only when its key is strictly smaller, so they are stable; selection sort and heapsort swap across long distances and can leapfrog an equal key. Memory is a separate axis: merge sort uses a buffer as long as the input, counting sort an array of counts plus an output array.`,
      caption: String.raw`Each card's key is its rank; the coloured stripe and letter record the order in which equal ranks were dealt (a before b before c). Choose an algorithm: lines join each card's input and output places, and turn **red** when two equal ranks come out swapped. **Deal** a new hand to try to catch a stable-looking run out. The right panel shows the extra memory each algorithm actually allocated.`,
      deps: ['algo-1.1'],
      refs: ['CLRS 4e §2.1'],
      tags: ['sorting'],
      viz(v) {
        const n = 10, K = 5;
        const ALGS = [
          { value: 'insertion', label: 'Insertion', short: 'Ins', name: 'Insertion sort', stable: true },
          { value: 'selection', label: 'Selection', short: 'Sel', name: 'Selection sort', stable: false },
          { value: 'merge', label: 'Merge', short: 'Merge', name: 'Merge sort', stable: true },
          { value: 'heap', label: 'Heap', short: 'Heap', name: 'Heapsort', stable: false },
          { value: 'counting', label: 'Counting', short: 'Count', name: 'Counting sort', stable: true },
        ];
        const alg = v.select('', ALGS.map(({ value, label }) => ({ value, label })), 'selection');
        const rng = v.rng(2031);
        let cards = [];
        const deal = () => {
          const seen = {};
          cards = Array.from({ length: n }, (_, id) => { const rank = rng.int(1, K); seen[rank] = (seen[rank] || 0) + 1; return { id, rank, occ: seen[rank] - 1 }; });
        };
        const hand0 = [3, 1, 3, 2, 1, 2, 4, 1, 4, 2], seen0 = {};
        cards = hand0.map((rank, id) => { seen0[rank] = (seen0[rank] || 0) + 1; return { id, rank, occ: seen0[rank] - 1 }; });
        v.button('Deal a new hand', deal);
        const S = v.stage({ x: [-0.6, n - 0.4], y: [-0.95, 3.6], axes: false, height: 300, weight: 2.7, minWidth: 420 });
        const G = v.stage({ x: [-0.7, 4.7], y: [-0.3, 1.22], axes: false, height: 300, weight: 1, minWidth: 210, title: 'extra memory allocated (cells)' });
        const W = 0.38, CH = 0.95, Y_IN = 2.15, Y_OUT = 0;
        const card = (c, x, y0, bad) => {
          S.rect(x - W, y0, x + W, y0 + CH, { fill: 'panel', fillAlpha: 1, color: bad ? 'red' : 'muted', width: bad ? 2.6 : 1.2 });
          S.rect(x - W, y0, x + W, y0 + 0.17 * CH, { fill: TAG[c.occ], fillAlpha: 0.85, stroke: false });
          S.text(String(c.rank), x, y0 + 0.62 * CH, { align: 'center', size: 20, weight: 700, color: 'ink', halo: false });
          S.text(LETTER[c.occ], x, y0 + 0.31 * CH, { align: 'center', size: 11, weight: 700, color: TAG[c.occ], halo: false });
        };
        let last = null;
        v.render(() => {
          const A = ALGS.find((a) => a.value === alg.value), res = sortCards(A.value, cards, K), pos = [];
          res.out.forEach((c, k) => { pos[c.id] = k; });
          const bad = new Set(); let flips = 0;
          for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) if (res.out[p].rank === res.out[q].rank && res.out[p].id > res.out[q].id) { flips++; bad.add(res.out[p].id); bad.add(res.out[q].id); }
          last = { A, res, flips };
          S.text('input, in the order dealt', -0.5, Y_IN + CH + 0.32, { size: 12, color: 'muted' });
          S.text(`output of ${A.name.toLowerCase()}, sorted by rank`, -0.5, Y_OUT - 0.38, { size: 12, color: 'muted' });
          for (const c of cards) {
            const x0 = c.id, x1 = pos[c.id], b = bad.has(c.id);
            S.curve((t) => { const u = 1 - t; return [u * u * u * x0 + 3 * u * u * t * x0 + 3 * u * t * t * x1 + t * t * t * x1, u * u * u * Y_IN + 3 * u * u * t * (Y_IN - 0.55) + 3 * u * t * t * (Y_OUT + CH + 0.55) + t * t * t * (Y_OUT + CH)]; }, 0, 1, { n: 40, color: b ? 'red' : 'muted', width: b ? 2.4 : 1.3, alpha: b ? 1 : 0.55 });
          }
          cards.forEach((c) => card(c, c.id, Y_IN, bad.has(c.id)));
          res.out.forEach((c, k) => card(c, k, Y_OUT, bad.has(c.id)));
          // memory gauge: every algorithm on this hand, the chosen one highlighted
          const ex = ALGS.map((a) => sortCards(a.value, cards, K).extra), top = Math.max(...ex);
          ALGS.forEach((a, k) => {
            const h = ex[k] / top, on = a.value === A.value;
            G.rect(k - 0.33, 0, k + 0.33, Math.max(h, 0.012), { fill: on ? 'accent' : 'muted', fillAlpha: on ? 0.8 : 0.3, color: on ? 'accent' : null, width: 1.4 });
            G.text(String(ex[k]), k, Math.max(h, 0.012) + 0.06, { align: 'center', size: 12, weight: 700, color: on ? 'accent' : 'muted' });
            G.text(a.short, k, -0.1, { align: 'center', size: 11, color: on ? 'ink' : 'muted', weight: on ? 700 : 500 });
            G.text(a.stable ? 'stable' : 'unstable', k, -0.22, { align: 'center', size: 9.5, color: a.stable ? 'green' : 'red' });
          });
          G.line(-0.6, 0, 4.6, 0, { color: 'faint', width: 1 });
        });
        v.readout(() => {
          if (!last) return '';
          const { A, res, flips } = last, inPlace = res.extra <= 1;
          const st = flips ? `**not stable**: on this hand ${flips} pair${flips === 1 ? '' : 's'} of equal ranks came out swapped (red)` : A.stable ? '**stable**: every rank keeps its dealt order a, b, c' : '**not stable** in general, although this hand happens to survive — deal again';
          return `${A.name} is ${st} · extra memory **${res.extra}** cell${res.extra === 1 ? '' : 's'} (${inPlace ? 'in place' : 'not in place'}) · ${res.cmps} key comparisons`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Algorithm',
      name: 'Insertion sort',
      statement: String.raw`**Insertion sort** sorts $A[1..n]$ in place. For $j=2,\dots,n$ it lifts out $\mathit{key}=A[j]$, shifts every element of the sorted prefix $A[1..j-1]$ that is larger than $\mathit{key}$ one position to the right, and drops $\mathit{key}$ into the gap.

**Correctness:** at the start of iteration $j$ the prefix $A[1..j-1]$ holds the original first $j-1$ elements in sorted order. **Cost:** the number of shifts equals the number of *inversions* $I=\#\{(i,j): i<j,\ A[i]>A[j]\}$ of the input, and the number of comparisons lies between $I$ and $I+n-1$. Hence the running time is $\Theta(n+I)$: $\Theta(n)$ on sorted input, $\Theta(n^2)$ on reversed input ($I=\binom n2$), and $\Theta(n^2)$ on average ($E[I]=n(n-1)/4$). It is stable.`,
      idea: String.raw`The loop invariant (1.4) is maintained because the key is placed after the last prefix element not exceeding it and before the shifted larger ones. Each shift moves the key leftward past exactly one larger element, which removes exactly one inversion and creates none, and the sort ends with zero inversions, so shifts $=I$. Every comparison either triggers a shift or ends an iteration, giving at most $I+n-1$ comparisons. For a random permutation each of the $\binom n2$ pairs is inverted with probability $1/2$.`,
      caption: String.raw`Step through the sort (or press play). Arcs below the array are the inversions: **orange** arcs join the lifted key (gold) to the larger prefix keys it must pass, and each shift deletes exactly one arc, so no arc ever spans the green sorted prefix. Click two cells to swap them and edit the input; the input selector tries the extremes. The right panel counts shifts for larger $n$: quadratic for reversed and random input, linear for nearly sorted input.`,
      deps: ['algo-3.1', 'algo-1.4'],
      refs: ['CLRS 4e §2.1'],
      tags: ['sorting'],
      viz(v) {
        const n = 10, rng = v.rng(31);
        const FAM = {
          random: () => rng.shuffle(range1(n)),
          nearly: () => { const a = range1(n); for (let k = 0; k < 2; k++) { const i = rng.int(0, n - 2); [a[i], a[i + 1]] = [a[i + 1], a[i]]; } return a; },
          reversed: () => range1(n).reverse(),
          sorted: () => range1(n),
        };
        let vals = [6, 2, 9, 4, 10, 1, 7, 3, 8, 5], pick = -1;
        const fam = v.select('input', [{ value: 'random', label: 'random' }, { value: 'nearly', label: 'nearly sorted' }, { value: 'reversed', label: 'reversed' }, { value: 'sorted', label: 'sorted' }], 'random', { onChange: (f) => { vals = FAM[f](); pick = -1; S.reset(); } });
        v.button('Shuffle', () => { fam.set('random'); vals = FAM.random(); pick = -1; S.reset(); });
        const M = v.stage({ x: [-0.6, n - 0.4], y: [-3.25, 2.45], axes: false, height: 300, weight: 1.9, minWidth: 380 });
        const P = v.stage({ x: [4, 1024], y: [0.5, 1e6], xlog: true, ylog: true, axes: 'box', height: 300, weight: 1, minWidth: 250, title: 'shifts (= inversions) vs $n$' });
        const f0 = insertionTrace(vals);
        const S = v.steps({ frames: () => insertionTrace(vals), code: INS_CODE, codeTitle: 'Insertion-Sort(A)', codePos: 'below', speed: 3, start: f0.findIndex((f) => f.j === 6 && f.line === 4) });
        // larger inputs, counted exactly
        const big = { random: [], nearly: [], reversed: [] }, r2 = v.rng(77);
        for (let k = 2; k <= 10; k++) {
          const m = 1 << k, a = range1(m);
          big.random.push([m, inversions(r2.shuffle(a))]);
          const b = a.slice(); for (let i = 0; i + 1 < m; i += 3) if (r2() < 0.5) [b[i], b[i + 1]] = [b[i + 1], b[i]];
          big.nearly.push([m, Math.max(0.6, inversions(b))]);
          big.reversed.push([m, (m * (m - 1)) / 2]);
        }
        M.onClick((x, y) => {
          const i = Math.round(x); if (i < 0 || i >= n || y < -0.15 || y > 1.05) return;
          if (pick < 0) pick = i; else { if (pick !== i) { [vals[pick], vals[i]] = [vals[i], vals[pick]]; S.reset(); } pick = -1; }
        });
        const logical = (f) => { const L = f.arr.slice(); if (f.hole >= 0) L[f.hole] = f.key; return L; };
        v.render(() => {
          const f = S.frame, L = logical(f);
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (L[i] > L[j]) {
            const k = i === f.hole || j === f.hole;
            arc(M, i, j, -0.1, -(0.3 + 0.27 * (j - i)), { color: k ? 'orange' : 'purple', width: k ? 2.3 : 1.3, alpha: k ? 1 : 0.6 });
          }
          cells(M, f.arr, {
            x0: -0.5, size: 15,
            style: (i, val) => {
              if (i === f.hole) return { fill: 'gold', alpha: 0.08, stroke: 'gold', dash: [4, 3] };
              const st = {};
              if (i < f.sorted) { st.fill = 'green'; st.alpha = i === f.placed ? 0.42 : 0.2; st.stroke = 'green'; }
              if (i === f.cmp) { st.fill = 'orange'; st.alpha = 0.35; st.stroke = 'orange'; st.width = 2.2; }
              if (S.i === 0 && i === pick) { st.stroke = 'accent'; st.width = 3; }
              return st;
            },
          });
          if (f.key != null) cells(M, [f.key], { x0: f.hole - 0.5, y: 1.3, size: 15, style: () => ({ fill: 'gold', alpha: 0.45, stroke: 'gold', width: 2 }) });
          if (f.key != null) M.text('key', f.hole, 2.38, { align: 'center', size: 11, color: 'gold', weight: 600 });
          // plot
          P.fn((m) => (m * (m - 1)) / 2, { color: 'red', width: 1.5, dash: [5, 4] });
          P.fn((m) => (m * (m - 1)) / 4, { color: 'accent', width: 1.5, dash: [5, 4] });
          P.fn((m) => m / 6, { color: 'green', width: 1.5, dash: [5, 4] });
          P.dots(big.reversed, { r: 3.5, color: 'red' }); P.dots(big.random, { r: 3.5, color: 'accent' }); P.dots(big.nearly, { r: 3.5, color: 'green' });
          P.text('n(n−1)/2', 30, 900, { size: 11, color: 'red', align: 'right' });
          P.text('n(n−1)/4', 140, 1500, { size: 11, color: 'accent', align: 'left' });
          P.text('n/6', 300, 140, { size: 11, color: 'green' });
          P.dot(n, Math.max(1, f.inv0), { r: 6, color: 'gold' });
        });
        v.legend([['purple', 'inversion (arc joins the two keys)'], ['orange', 'inversion the key will remove'], ['red', 'reversed input', { dot: true }], ['accent', 'random input', { dot: true }], ['green', 'nearly sorted', { dot: true }], ['gold', 'this input', { dot: true }]]);
        v.readout(() => {
          const f = S.frame, left = inversions(logical(f));
          return `shifts so far **${f.shifts}** + inversions left **${left}** $= ${f.shifts + left} =$ inversions of the input **${f.inv0}** ✓ · comparisons ${f.cmps}` + (S.atEnd ? ` $\\le$ shifts $+ (n-1) = ${f.inv0 + n - 1}$ · worst case $\\binom{${n}}{2} = ${(n * (n - 1)) / 2}$` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Method',
      name: 'Indicator random variables and linearity of expectation',
      statement: String.raw`For an event $E$ the **indicator** $I\{E\}$ is the random variable equal to $1$ if $E$ occurs and $0$ otherwise; its expectation is $E[I\{E\}]=\Pr[E]$. If a count can be written as a sum of indicators, $X=\sum_{i=1}^n X_i$, then by **linearity of expectation**
$$E[X]=\sum_{i=1}^n E[X_i]=\sum_{i=1}^n \Pr[X_i=1],$$
whether or not the $X_i$ are independent.

**Example (the hiring problem).** Candidates arrive in uniformly random order and each one better than all earlier candidates is hired. Candidate $i$ is hired exactly when it is the best of the first $i$, which has probability $1/i$, so the expected number of hires is $H_n=\sum_{i=1}^n 1/i=\ln n+O(1)$.`,
      idea: String.raw`Linearity holds because expectation is a sum over outcomes and sums can be reordered; no independence is used. The method replaces a hard question (the distribution of $X$) by $n$ easy ones (the probability of each small event). In the uniformly random hiring order the record indicators actually are independent, although that extra fact is unnecessary here. Among the first $i$ candidates each is equally likely to be the best, so $\Pr[X_i=1]=1/i$ and the harmonic estimate (1.14) finishes the job. The same move drives randomized quicksort (3.11), bucket sort (3.15) and quickselect (3.17).`,
      caption: String.raw`Top: one random interview order; gold bars are the hires, each better than everyone before (the green staircase is the best so far). Bottom: over all simulated orders, the fraction hiring at position $i$ (bars) against the indicator's expectation $1/i$ (green). Add orders and watch the bars settle on the curve and the mean number of hires settle on $H_n$.`,
      deps: ['algo-1.3', 'prob-1.6.1'],
      refs: ['CLRS 4e §5.2'],
      tags: ['probability'],
      viz(v) {
        const rng = v.rng(5);
        let n = 20, hires = [], total = 0, sum = 0, last = [], lastHires = 0;
        const trial = () => {
          const p = rng.shuffle(range1(n)); let best = 0, h = 0;
          p.forEach((q, i) => { if (q > best) { best = q; hires[i]++; h++; } });
          total++; sum += h; last = p; lastHires = h;
        };
        const resetStats = () => { n = nS.value; hires = new Array(n).fill(0); total = 0; sum = 0; for (let t = 0; t < 300; t++) trial(); };
        const nS = v.slider('$n$ candidates', 4, 60, 20, { int: true, onChange: () => resetStats() });
        v.button('Interview one more order', () => trial());
        v.button('+1000 orders', () => { for (let t = 0; t < 1000; t++) trial(); });
        resetStats();
        const T = v.stage({ x: [0.3, 20.7], y: [0, 22], axes: false, height: 190, full: true, title: 'one interview order: candidate quality in arrival order' });
        const B = v.stage({ x: [0.3, 20.7], y: [-0.11, 1.08], axes: true, height: 230, full: true, xlabel: 'i', title: 'fraction of orders hiring at position $i$, against $E[X_i]=\\Pr[\\text{candidate } i \\text{ is the best so far}]=1/i$' });
        v.render(() => {
          T.setView([0.3, n + 0.7], [0, n * 1.16]); B.setView([0.3, n + 0.7], [-0.11, 1.08]);
          const w = 0.36; let best = 0; const stair = [];
          last.forEach((q, i) => {
            const hire = q > best; if (hire) best = q;
            T.rect(i + 1 - w, 0, i + 1 + w, q, hire ? { fill: 'gold', fillAlpha: 0.75, color: 'gold', width: 1.2 } : { fill: 'muted', fillAlpha: 0.3, stroke: false });
            if (hire && n <= 40) T.text('hire', i + 1, q, { align: 'center', baseline: 'bottom', dy: -3, size: 10.5, weight: 600, color: 'gold' });
            stair.push([i + 1 - 0.5, best], [i + 1 + 0.5, best]);
          });
          T.path(stair, { color: 'green', width: 2 });
          B.bars(hires.map((h) => h / total), { x0: 1, color: 'accent', fillAlpha: 0.5, barWidth: 0.72 });
          B.path(range1(n).map((i) => [i, 1 / i]), { color: 'green', width: 1.6 });
          B.dots(range1(n).map((i) => [i, 1 / i]), { r: 3.3, color: 'green' });
        });
        v.legend([['gold', 'hired (best so far)'], ['green', 'best so far / the curve $1/i$'], ['accent', 'simulated frequency']]);
        v.readout(() => {
          const H = range1(n).reduce((s, i) => s + 1 / i, 0);
          return `$E[X]=\\sum_{i=1}^{${n}} E[X_i]=\\sum_{i=1}^{${n}}\\tfrac1i=H_{${n}}=${v.fix(H, 3)}$ · simulated mean over **${total}** orders: **${v.fix(sum / total, 3)}** · this order hired ${lastHires} · ($\\ln n = ${v.fix(Math.log(n), 2)}$)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Definition',
      name: 'Binary heap and the heap property',
      credit: 'Williams, 1964',
      statement: String.raw`A **binary heap** stores $n$ keys in an array $A[1..n]$ read as a *complete binary tree*: node $i$ has parent $\lfloor i/2\rfloor$ and children $2i$ and $2i+1$ (when these are at most $n$), so every level is full except possibly the last, which is filled from the left. The tree has height $\lfloor\log_2 n\rfloor$.

It is a **max-heap** if every node other than the root satisfies $A[\mathrm{parent}(i)]\ge A[i]$, and a **min-heap** if $A[\mathrm{parent}(i)]\le A[i]$. In a max-heap every subtree's largest key sits at its root; in particular $A[1]$ is a maximum.`,
      idea: String.raw`Index arithmetic replaces pointers: the tree shape is forced by $n$ alone, so the array needs no extra memory, and moving one level up or down is a halving or doubling of the index. Because the tree is complete, it has $\lfloor\log_2 n\rfloor+1$ levels, which bounds every root-to-leaf path. The heap property is local (one inequality per edge) but, chained along paths, it says each key dominates its whole subtree.`,
      caption: String.raw`The same keys as a tree (top) and as an array (bottom). Click a node or a cell to select it: its parent $\lfloor i/2\rfloor$ (orange) and children $2i$, $2i+1$ (teal) light up in both views. Change the selected key with the slider and every parent–child pair that breaks the heap order turns **red**. Switch between max- and min-heap order.`,
      deps: ['algo-3.1'],
      refs: ['CLRS 4e §6.1'],
      tags: ['heaps'],
      viz(v) {
        const NMAX = 15, rng = v.rng(4);
        const randArr = () => Array.from({ length: NMAX }, () => rng.int(1, 99));
        const less = (m) => (m === 'max' ? (a, b) => a < b : (a, b) => a > b);
        let A = randArr(); floyd(A, 12); A[4] = 93; let sel = 4;
        const nS = v.slider('$n$', 1, NMAX, 12, { int: true });
        const mode = v.select('', [{ value: 'max', label: 'max-heap' }, { value: 'min', label: 'min-heap' }], 'max');
        const key = v.slider('key of the selected node', 0, 99, A[sel], { int: true, onChange: (x) => { A[sel] = x; } });
        v.button('Random array', () => { A = randArr(); key.value = A[sel]; });
        v.button('Random heap', () => { A = randArr(); floyd(A, nS.value, less(mode.value)); key.value = A[sel]; });
        const T = v.stage({ x: [0, 1], y: [-3.55, 0.55], axes: false, height: 245, full: true });
        const R = v.stage({ x: [-0.6, NMAX - 0.4], y: [-0.85, 2.45], axes: false, height: 150, full: true, title: 'the same keys in an array: $\\mathrm{parent}(i)=\\lfloor i/2\\rfloor$, $\\mathrm{children}(i)=2i,\\ 2i+1$' });
        const choose = (i) => { if (i >= 0) { sel = i; key.value = A[i]; } };
        T.onClick((x, y) => choose(hitNode(T, x, y, nS.value, nodeR(T, 3))));
        R.onClick((x, y) => { const i = Math.round(x); if (i >= 0 && i < nS.value && y > -0.1 && y < 1) choose(i); });
        const info = () => {
          const n = nS.value, isBad = (p, c) => less(mode.value)(A[p], A[c]), bad = [];
          for (let c = 1; c < n; c++) if (isBad((c - 1) >> 1, c)) bad.push([(c - 1) >> 1, c]);
          return { n, bad, badSet: new Set(bad.flat()) };
        };
        v.render(() => {
          const { n, bad, badSet } = info();
          if (sel >= n) { sel = n - 1; key.value = A[sel]; }
          const par = sel > 0 ? (sel - 1) >> 1 : -1, kids = [2 * sel + 1, 2 * sel + 2].filter((k) => k < n);
          const isBadE = (p, c) => bad.some(([a, b]) => a === p && b === c);
          const r = drawHeapTree(T, A, n, {
            D: 3,
            edge: (p, c) => (isBadE(p, c) ? { color: 'red', width: 3.4 } : c === sel && p === par ? { color: 'orange', width: 2.4 } : p === sel ? { color: 'teal', width: 2.4 } : null),
            node: (i) => (i === sel ? { fill: 'gold', alpha: 0.45, stroke: badSet.has(i) ? 'red' : 'gold', width: 2.6 } : badSet.has(i) ? { stroke: 'red', width: 2.4, fill: 'red', alpha: 0.12 } : i === par ? { stroke: 'orange', width: 2.4 } : kids.includes(i) ? { stroke: 'teal', width: 2.4 } : null),
          });
          for (let i = 0; i < n; i++) { const [x, y] = hxy(i); T.textPx(String(i + 1), T.X(x) - r * 0.95, T.Y(y) - r * 0.95, { align: 'right', baseline: 'bottom', size: 10, color: 'muted' }); }
          // array view
          const show = Array.from({ length: NMAX }, (_, i) => (i < n ? A[i] : ''));
          cells(R, show, {
            x0: -0.5, size: 13,
            style: (i) => (i >= n ? { stroke: 'faint', dash: [3, 3] } : i === sel ? { fill: 'gold', alpha: 0.45, stroke: 'gold', width: 2.4 } : badSet.has(i) ? { stroke: 'red', width: 2.2, fill: 'red', alpha: 0.12 } : i === par ? { stroke: 'orange', width: 2.2 } : kids.includes(i) ? { stroke: 'teal', width: 2.2 } : null),
          });
          for (let i = 0; i < NMAX; i++) R.text(String(i + 1), i, -0.33, { align: 'center', size: 10.5, color: i < n ? 'muted' : 'faint' });
          kids.forEach((k, t) => {
            arc(R, sel, k, 1.0, 0.45 + 0.1 * (k - sel), { color: 'teal', width: 2 });
            R.tex(t ? '2i+1' : '2i', k + 0.1, 1.2, { size: 12, color: 'teal', align: 'left' });
          });
          if (par >= 0) {
            arc(R, par, sel, 1.0, 0.45 + 0.1 * (sel - par), { color: 'orange', width: 2 });
            R.tex('\\lfloor i/2\\rfloor', (sel + par) / 2, 1.0 + 0.45 + 0.1 * (sel - par), { size: 12, color: 'orange', baseline: 'bottom', dy: -1 });
          }
        });
        v.readout(() => {
          const { n, bad } = info(), i = sel + 1, kids = [2 * i, 2 * i + 1].filter((k) => k <= n);
          return `node $i=${i}$ (key ${A[sel]}) · parent $\\lfloor i/2\\rfloor = ${i > 1 ? Math.floor(i / 2) : '\\text{none (root)}'}$ · children ${kids.length ? kids.map((k) => `$${k}$`).join(', ') : 'none (a leaf)'} · height $\\lfloor\\log_2 ${n}\\rfloor = ${depthOf(n)}$ · ` +
            (bad.length ? `**${bad.length} violation${bad.length === 1 ? '' : 's'}**: not a ${mode.value}-heap` : `**no violations**: a valid ${mode.value}-heap, so $A[1] = ${A[0]}$ is the ${mode.value === 'max' ? 'maximum' : 'minimum'}`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Algorithm',
      name: 'Sift-down (max-heapify)',
      credit: 'Williams, 1964',
      statement: String.raw`**MAX-HEAPIFY$(A,i)$.** Suppose the subtrees rooted at the children of node $i$ are max-heaps but $A[i]$ may be smaller than a child. Let $\mathit{largest}$ be the index of the largest of $A[i]$, $A[2i]$, $A[2i+1]$ (children that exist). If $\mathit{largest}\ne i$, swap $A[i]$ with $A[\mathit{largest}]$ and recurse at $\mathit{largest}$.

Afterwards the subtree rooted at $i$ is a max-heap. The key moves down a single root-to-leaf path, so on a heap of $n$ nodes the procedure makes at most $\lfloor\log_2 n\rfloor$ swaps and at most $2\lfloor\log_2 n\rfloor$ comparisons: $O(h)$ time for a node of height $h$.`,
      idea: String.raw`Invariant: the only place the heap property can fail is between the current node and its children. Promoting the larger child repairs that spot, since the promoted key dominates the other child and, by the heap property below, its whole subtree; the sinking key may now violate only at its new position, one level lower. Every step descends a level, and a complete tree has $\lfloor\log_2 n\rfloor$ levels below the root (3.4).`,
      caption: String.raw`Choose a new (small) key for the root of a max-heap and step the sift-down: the gold node is the sinking key, the orange nodes are the children it is compared with, and the gold trail is the single path it follows. **Red** edges are heap violations: there is never more than one place where they occur. The ladder on the right counts swaps against the height $\lfloor\log_2 n\rfloor$.`,
      deps: ['algo-3.4'],
      refs: ['CLRS 4e §6.2'],
      tags: ['heaps'],
      viz(v) {
        const rng = v.rng(9);
        let base = [];
        const newHeap = () => { base = distinct(rng, 31, 10, 99); floyd(base, 31); };
        newHeap();
        const nS = v.slider('$n$', 3, 31, 15, { int: true, onChange: () => S.reset() });
        const kS = v.slider('new root key', 0, 99, 8, { int: true, onChange: () => S.reset() });
        v.button('New heap', () => { newHeap(); S.reset(); });
        const T = v.stage({ x: [0, 1], y: [-3.6, 0.6], axes: false, height: 300, weight: 3.2, minWidth: 380 });
        const G = v.stage({ x: [0, 1], y: [-3.6, 0.6], axes: false, height: 300, weight: 1, minWidth: 140, title: 'swaps vs height' });
        const trace = () => { const A = base.slice(0, nS.value); A[0] = kS.value; return siftTrace(A, nS.value); };
        const S = v.steps({ frames: trace, code: SIFT_CODE, codeTitle: 'Max-Heapify(A, 1)', codePos: 'below', speed: 1.2, start: 3 });
        v.render(() => {
          const f = S.frame, n = nS.value, D = depthOf(n), A = f.A, onPath = new Set(f.path);
          T.setView(null, [-D - 0.6, 0.6]); G.setView(null, [-D - 0.6, 0.6]);
          const pe = new Set(); for (let k = 1; k < f.path.length; k++) pe.add(f.path[k]);
          drawHeapTree(T, A, n, {
            edge: (p, c) => (A[p] < A[c] ? { color: 'red', width: 3.4 } : pe.has(c) && onPath.has(p) ? { color: 'gold', width: 3.4 } : null),
            node: (i) => (i === f.i ? { fill: f.done ? 'green' : 'gold', alpha: 0.5, stroke: f.done ? 'green' : 'gold', width: 2.6 } : f.kids && f.kids.includes(i) ? { stroke: 'orange', width: 2.4, fill: i === f.largest ? 'orange' : null, alpha: 0.3 } : onPath.has(i) ? { stroke: 'gold', width: 1.8 } : null),
          });
          // ladder
          for (let d = 0; d <= D; d++) { G.line(0.42, -d, 0.92, -d, { color: 'faint', width: 1.4 }); G.text(`level ${d}`, 0.38, -d, { align: 'right', size: 10.5, color: 'muted' }); }
          const dep = depthOf(f.i + 1);
          G.line(0.67, 0, 0.67, -D, { color: 'faint', width: 4, alpha: 0.5 });
          if (dep > 0) G.line(0.67, 0, 0.67, -dep, { color: 'gold', width: 4 });
          G.dot(0.67, -dep, { r: 7, color: f.done ? 'green' : 'gold' });
          G.text(`swaps ${f.swaps} ≤ ${D}`, 0.67, 0.42, { align: 'center', size: 13, weight: 700, color: f.done ? 'green' : 'gold' });
        });
        v.legend([['gold', 'sinking key and its path', { dot: true }], ['orange', 'children compared', { dot: true }], ['red', 'heap violation'], ['green', 'heap restored', { dot: true }]]);
        v.readout(() => {
          const f = S.frame, n = nS.value, D = depthOf(n), A = f.A; const bad = [];
          for (let c = 1; c < n; c++) if (A[(c - 1) >> 1] < A[c]) bad.push((c - 1) >> 1);
          const only = bad.every((p) => p === f.i);
          return `swaps **${f.swaps}** $\\le \\lfloor\\log_2 ${n}\\rfloor = ${D}$ · comparisons ${f.cmps} $\\le 2\\lfloor\\log_2 n\\rfloor = ${2 * D}$ · violations: ` +
            (bad.length ? `${bad.length}, all at the sinking key ${only ? '✓' : '✗'}` : 'none — a max-heap again ✓');
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Building a heap takes linear time',
      credit: 'Floyd, 1964',
      statement: String.raw`**BUILD-MAX-HEAP** turns an arbitrary array $A[1..n]$ into a max-heap by calling MAX-HEAPIFY$(A,i)$ for $i=\lfloor n/2\rfloor,\lfloor n/2\rfloor-1,\dots,1$. It is correct, and it runs in $O(n)$ time: the total number of swaps is at most
$$\sum_{h\ge 0} h\left\lceil\frac{n}{2^{h+1}}\right\rceil\ \le\ n\sum_{h\ge1}\frac{h}{2^h}=2n,$$
and the number of comparisons is at most twice that. (The bound $n\log_2 n$ obtained by charging $\log_2 n$ to every call is true but far from tight.)`,
      idea: String.raw`Invariant: when node $i$ is processed, the subtrees of its children are already heaps, because the loop runs bottom-up, so MAX-HEAPIFY's precondition (3.5) holds. The cost of a call is the height of its node, and heights are small for most nodes: about $n/2$ nodes are leaves of height $0$, $n/4$ have height $1$, $n/8$ height $2$, and so on. The resulting sum $\sum h/2^h$ is a convergent series dominated by its first terms (1.12), so the total is linear.`,
      caption: String.raw`Nodes are coloured by their height. Step through the calls from the last internal node back to the root; the gold trail is how far each key sank. The middle panel compares the swaps made from each height (filled) with the worst case $h\cdot n_h$ (outline): the tall bars sit at low heights, where the work is cheap. The bottom panel runs the construction for $n$ up to $65\,536$: total swaps divided by $n$ stays below $2$, while the naive $\log_2 n$ estimate keeps climbing.`,
      deps: ['algo-3.5', 'algo-1.12'],
      refs: ['CLRS 4e §6.3'],
      tags: ['heaps'],
      viz(v) {
        const HC = ['teal', 'blue', 'purple', 'orange', 'pink'], rng = v.rng(17);
        let pool = distinct(rng, 31, 10, 99);
        const gen = () => {
          const n = nS.value, a = pool.slice(0, n);
          return inp.value === 'ascending' ? a.sort((x, y) => x - y) : inp.value === 'descending' ? a.sort((x, y) => y - x) : a;
        };
        const nS = v.slider('$n$', 3, 31, 31, { int: true, onChange: () => S.reset({ at: 'end' }) });
        const inp = v.select('input', [{ value: 'random', label: 'random' }, { value: 'ascending', label: 'ascending (worst case)' }, { value: 'descending', label: 'descending (already a heap)' }], 'random', { onChange: () => S.reset({ at: 'end' }) });
        v.button('Shuffle', () => { pool = distinct(rng, 31, 10, 99); inp.set('random'); S.reset({ at: 'end' }); });
        const T = v.stage({ x: [0, 1], y: [-4.6, 0.6], axes: false, height: 270, weight: 2, minWidth: 380 });
        const H = v.stage({ x: [-0.6, 4.6], y: [-3, 30], axes: false, height: 270, weight: 1, minWidth: 200, title: 'swaps by height $h$ of the start node' });
        const P = v.stage({ x: [2, 65536], y: [-0.55, 4.6], xlog: true, axes: true, height: 190, full: true, title: 'total swaps $\\div\\, n$ for larger $n$', xlabel: 'n' });
        const S = v.steps({ frames: () => buildTrace(gen()), code: BUILD_CODE, codeTitle: 'Build-Max-Heap(A)', codePos: 'below', speed: 1.5, start: 10 });
        // larger n, counted exactly
        const big = { asc: [], rnd: [] }, r2 = v.rng(3);
        for (let k = 4; k <= 64; k++) {
          const m = Math.round(2 ** (k / 4)); if (big.asc.length && big.asc[big.asc.length - 1][0] === m) continue;
          const a = range1(m); big.asc.push([m, floyd(a.slice(), m) / m]); big.rnd.push([m, floyd(r2.shuffle(a), m) / m]);
        }
        v.render(() => {
          const f = S.frame, A = f.A, n = A.length, D = depthOf(n), onPath = new Set(f.path);
          T.setView(null, [-D - 0.6, 0.6]);
          const pe = new Set(f.path.slice(1));
          drawHeapTree(T, A, n, {
            edge: (p, c) => (pe.has(c) && onPath.has(p) ? { color: 'gold', width: 3.6 } : null),
            node: (i) => { const h = heightOf(i, n), c = HC[Math.min(h, 4)]; return i === f.cur ? { fill: 'gold', alpha: 0.55, stroke: 'gold', width: 2.6 } : onPath.has(i) ? { fill: c, alpha: 0.3, stroke: 'gold', width: 2.4 } : { fill: c, alpha: 0.22, stroke: c, width: 1.6 }; },
          });
          // per-height bars
          const nh = new Array(D + 1).fill(0); for (let i = 0; i < n; i++) nh[heightOf(i, n)]++;
          const cap = Math.max(4, ...nh.map((c, h) => c * h));
          H.setView([-0.6, D + 0.6], [-cap * 0.16, cap * 1.22]);
          for (let h = 0; h <= D; h++) {
            const c = HC[Math.min(h, 4)];
            H.rect(h - 0.32, 0, h + 0.32, nh[h] * h, { color: c, width: 1.6, dash: [4, 3] });
            if (f.byH[h]) H.rect(h - 0.32, 0, h + 0.32, f.byH[h], { fill: c, fillAlpha: 0.6, stroke: false });
            H.text(`${f.byH[h]}/${nh[h] * h}`, h, nh[h] * h + cap * 0.05, { align: 'center', size: 10.5, weight: 600, color: c });
            H.text(`h=${h}`, h, -cap * 0.06, { align: 'center', size: 10.5, color: 'muted' });
            H.text(`${nh[h]} node${nh[h] === 1 ? '' : 's'}`, h, -cap * 0.13, { align: 'center', size: 9.5, color: 'muted' });
          }
          H.line(-0.6, 0, D + 0.6, 0, { color: 'faint', width: 1 });
          // larger n
          P.hline(2, { color: 'green', width: 1.6, dash: [6, 4] });
          P.fn((m) => Math.log2(m), { color: 'orange', width: 1.6, dash: [6, 4] });
          P.path(big.asc, { color: 'red', width: 1.8 }); P.dots(big.asc, { r: 2.4, color: 'red' });
          P.path(big.rnd, { color: 'accent', width: 1.8 }); P.dots(big.rnd, { r: 2.4, color: 'accent' });
          P.text('bound 2', 40000, 2.18, { align: 'right', size: 11, color: 'green' });
          P.text('naive: log₂ n', 7.5, 4.25, { size: 11, color: 'orange', align: 'right' });
          if (S.atEnd) P.dot(n, f.swaps / n, { r: 6, color: 'gold' });
        });
        v.legend([['red', 'ascending input (worst case)'], ['accent', 'random input'], ['green', 'bound $2n$', { dash: true }], ['orange', 'naive $n\\log_2 n$', { dash: true }], ['gold', 'this run (at the last step)', { dot: true }]]);
        v.readout(() => {
          const f = S.frame, n = f.A.length; let bound = 0; for (let i = 0; i < n; i++) bound += heightOf(i, n);
          return `swaps so far **${f.swaps}**${f.cur >= 0 ? ` (this call ${f.s} $\\le$ height ${f.h})` : ''} · worst case $\\sum_h h\\,n_h = ${bound} \\le 2n = ${2 * n}$ · the naive estimate $n\\log_2 n \\approx ${Math.round(n * Math.log2(n))}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Algorithm',
      name: 'Heapsort',
      credit: 'Williams, 1964; Floyd, 1964',
      statement: String.raw`**Heapsort** sorts $A[1..n]$ in place: build a max-heap (3.6), then for $i=n,n-1,\dots,2$ swap the root $A[1]$ (the maximum of the heap) with $A[i]$, shrink the heap to $A[1..i-1]$ and restore it with MAX-HEAPIFY$(A,1)$ (3.5).

It runs in $O(n\log n)$ time in the worst case, using at most about $2n\log_2 n$ comparisons, and $O(1)$ extra memory. It is not stable.`,
      idea: String.raw`Invariant: before each iteration, $A[1..i]$ is a max-heap holding the $i$ smallest keys and $A[i+1..n]$ holds the $n-i$ largest keys in sorted order. Swapping the root to position $i$ extends the sorted suffix by the next largest key, and only the root can now violate the heap property, which one sift-down repairs. The build costs $O(n)$ and each of the $n-1$ sift-downs costs at most $2\lfloor\log_2 n\rfloor$ comparisons.`,
      caption: String.raw`Tree and bars show the same array. Step through: the root (maximum) swaps to the end of the heap, the green sorted suffix grows by one, and the new root sinks along the gold path. The right panel runs heapsort on random inputs of size up to $8192$: the comparison count divided by $n\log_2 n$ climbs toward $2$ but stays below it.`,
      deps: ['algo-3.6'],
      refs: ['CLRS 4e §6.4'],
      tags: ['sorting', 'heaps'],
      viz(v) {
        const rng = v.rng(23);
        let vals = [];
        const gen = () => {
          const a = distinct(rng, nS.value, 5, 99);
          vals = inp.value === 'sorted' ? a.sort((x, y) => x - y) : inp.value === 'reversed' ? a.sort((x, y) => y - x) : a;
        };
        const nS = v.slider('$n$', 5, 24, 14, { int: true, onChange: () => { gen(); S.reset(); } });
        const inp = v.select('input', ['random', 'sorted', 'reversed'], 'random', { onChange: () => { gen(); S.reset(); } });
        v.button('Shuffle', () => { inp.set('random'); gen(); S.reset(); });
        gen();
        const T = v.stage({ x: [0, 1], y: [-4.6, 0.6], axes: false, height: 245, weight: 1.6, minWidth: 360 });
        const P = v.stage({ x: [8, 8192], y: [0, 2.6], xlog: true, axes: 'box', height: 245, weight: 1, minWidth: 240, title: 'comparisons $\\div\\, n\\log_2 n$', xlabel: 'n' });
        const B = v.stage({ x: [-0.6, 13.6], y: [-14, 108], axes: false, height: 165, full: true });
        const f0 = heapsortTrace(vals);
        const S = v.steps({ frames: () => heapsortTrace(vals), code: HS_CODE, codeTitle: 'Heapsort(A)', codePos: 'below', speed: 2.5, start: Math.floor(f0.length * 0.45) });
        const big = [], r2 = v.rng(8);
        for (let k = 0; k <= 20; k++) { const m = Math.round(8 * 2 ** (k / 2)); big.push([m, heapsortCount(r2.shuffle(range1(m))) / (m * Math.log2(m))]); }
        v.render(() => {
          const f = S.frame, A = f.A, n = A.length, D = depthOf(n), onPath = new Set(f.path), pe = new Set(f.path.slice(1));
          T.setView(null, [-D - 0.6, 0.6]);
          const sw = new Set(f.swap || []);
          drawHeapTree(T, A, n, {
            D,
            edge: (p, c) => (c >= f.size ? { color: 'faint', width: 1, dash: [2, 4] } : pe.has(c) && onPath.has(p) ? { color: 'gold', width: 3.4 } : null),
            node: (i) => (i >= f.size ? { stroke: 'green', fill: 'green', alpha: sw.has(i) ? 0.4 : 0.12, width: 1.2, text: 'green' } : sw.has(i) ? { stroke: 'gold', fill: 'gold', alpha: 0.45, width: 2.4 } : i === f.cur ? { stroke: 'gold', fill: 'gold', alpha: 0.45, width: 2.4 } : onPath.has(i) ? { stroke: 'gold', width: 2 } : null),
          });
          // bars
          const top = Math.max(...A);
          B.setView([-0.6, n - 0.4], [-top * 0.16, top * 1.17]);
          A.forEach((val, i) => {
            const col = i >= f.size ? 'green' : sw.has(i) || i === f.cur ? 'gold' : onPath.has(i) ? 'orange' : 'accent';
            B.rect(i - 0.36, 0, i + 0.36, val, { fill: col, fillAlpha: col === 'accent' ? 0.45 : 0.7, color: col, width: 1.2 });
            B.text(String(val), i, val + top * 0.07, { align: 'center', size: 11, weight: 600, color: col === 'accent' ? 'ink' : col });
            B.text(String(i + 1), i, -top * 0.08, { align: 'center', size: 10, color: 'muted' });
          });
          if (f.size > 0 && f.size < n) { B.line(f.size - 0.5, -top * 0.02, f.size - 0.5, top * 1.12, { color: 'muted', width: 1.4, dash: [4, 3] }); B.text('heap', f.size - 0.62, top * 1.08, { align: 'right', size: 11, color: 'accent' }); B.text('sorted', f.size - 0.38, top * 1.08, { size: 11, color: 'green' }); }
          // plot
          P.hline(2, { color: 'red', width: 1.5, dash: [6, 4] }); P.hline(1, { color: 'green', width: 1.5, dash: [6, 4] });
          P.path(big, { color: 'accent', width: 2 }); P.dots(big, { r: 2.6, color: 'accent' });
          P.text('2n log₂ n', 7800, 2.13, { size: 11, color: 'red', align: 'right' }); P.text('n log₂ n', 7800, 1.13, { size: 11, color: 'green', align: 'right' });
          if (n >= 8) P.dot(n, f.cmps / (n * Math.log2(n)), { r: 5.5, color: 'gold' });
        });
        v.legend([['gold', 'root / swap / sinking key'], ['green', 'sorted suffix'], ['accent', 'heap part · random inputs (right)'], ['gold', 'this run so far', { dot: true }]]);
        v.readout(() => {
          const f = S.frame, n = f.A.length, ref = n * Math.log2(n);
          return `comparisons so far **${f.cmps}** · heap size ${f.size} · $2n\\log_2 n = ${Math.round(2 * ref)}$ ($n=${n}$)` + (S.atEnd ? ` · ratio to $n\\log_2 n$: **${v.fix(f.cmps / ref, 2)}**` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Definition',
      name: 'Priority queue (binary-heap implementation)',
      statement: String.raw`A **(min-)priority queue** maintains a set $Q$ of elements with keys under the operations INSERT$(Q,x)$, MINIMUM$(Q)$, EXTRACT-MIN$(Q)$ (remove and return an element of smallest key) and DECREASE-KEY$(Q,x,k)$ (lower the key of $x$ to $k$). A max-priority queue is defined symmetrically.

**Binary-heap implementation.** Store $Q$ as a min-heap (3.4). MINIMUM reads $A[1]$ in $O(1)$; INSERT appends a leaf and bubbles it up; DECREASE-KEY lowers a key and bubbles it up; EXTRACT-MIN moves the last leaf to the root and sifts it down (3.5). Each of the last three follows one root-to-leaf path and takes $O(\log n)$ time on a queue of $n$ elements.`,
      idea: String.raw`Each operation changes one key and so can break the heap property at only one node. A key that became smaller can violate only against its parent, so swapping it upward repairs the heap level by level; a key that became larger (the leaf moved to the root) can violate only against its children, which the sift-down repairs. Either way the work is bounded by the height $\lfloor\log_2 n\rfloor$. Priority queues drive Dijkstra's and Prim's algorithms and event simulations.`,
      caption: String.raw`Set a key with the slider and press **Insert**, or **Extract-min**; click a node to select it and press **Decrease-key** to lower it to the slider's value (raising it is refused). Each operation plays back step by step with its pseudocode, the path it travels in gold. The right panel records the swaps of every operation against the height $\lfloor\log_2 n\rfloor$ at that moment.`,
      deps: ['algo-3.5'],
      refs: ['CLRS 4e §6.5'],
      tags: ['heaps'],
      viz(v) {
        let A = [12, 25, 18, 40, 31, 27, 22, 55, 47, 38, 60, 35];
        floyd(A, A.length, (a, b) => a > b);
        let sel = 4, msg = '';
        const hist = [];
        const kS = v.slider('key', 1, 99, 9, { int: true });
        const T = v.stage({ x: [0, 1], y: [-5.2, 0.6], axes: false, height: 320, weight: 2.2, minWidth: 380 });
        const Hs = v.stage({ x: [-0.9, 12.7], y: [0, 5.6], axes: 'box', height: 320, weight: 1, minWidth: 220, title: 'swaps per operation (latest on the right)', yticks: [1, 2, 3, 4, 5], xticks: [] });
        for (const [op, arg] of [['insert', 44], ['extract'], ['insert', 16], ['decrease', [9, 6]], ['extract'], ['insert', 70], ['extract'], ['insert', 29]]) {
          const r0 = pqOp(op, A, arg);
          if (r0.ok) { A = r0.A; hist.push({ op, sw: r0.sw, h: depthOf(op === 'extract' ? A.length + 1 : A.length) }); }
        }
        const first = pqOp('insert', A, 9);
        A = first.A; hist.push({ op: 'insert', sw: first.sw, h: depthOf(A.length) }); msg = first.msg;
        const S = v.steps({ frames: first.frames, code: PQ_CODE.insert, codeTitle: 'Insert', codePos: 'below', speed: 1.6, start: 'end' });
        const run = (op) => {
          const arg = op === 'insert' ? kS.value : op === 'decrease' ? [sel, kS.value] : null;
          if (op === 'insert' && A.length >= 31) { msg = 'the picture holds at most 31 keys — extract some first'; return; }
          const res = pqOp(op, A, arg);
          msg = res.msg; S.setCode(PQ_CODE[op], { insert: 'Insert', extract: 'Extract-Min', decrease: 'Decrease-Key' }[op]);
          S.reset(res.frames); S.play();
          if (res.ok) { A = res.A; hist.push({ op, sw: res.sw, h: depthOf(Math.max(1, op === 'extract' ? A.length + 1 : A.length)) }); }
          if (sel >= A.length) sel = A.length - 1;
        };
        v.button('Insert', () => run('insert'));
        v.button('Extract-min', () => run('extract'));
        v.button('Decrease-key', () => run('decrease'));
        T.onClick((x, y) => { const f = S.frame, n = f.A.length, i = hitNode(T, x, y, n, nodeR(T, depthOf(n))); if (i >= 0) sel = i; });
        const OPC = { insert: 'accent', extract: 'orange', decrease: 'purple' };
        v.render(() => {
          const f = S.frame, B = f.A, n = B.length, D = Math.max(depthOf(n), 2), onPath = new Set(f.path || []), pe = new Set((f.path || []).slice(1));
          T.setView(null, [-D - 1.75, 0.6]);
          const r = drawHeapTree(T, B, n, {
            D,
            edge: (p, c) => ((onPath.has(p) && onPath.has(c)) && (pe.has(c) || pe.has(p)) ? { color: f.bad ? 'red' : 'gold', width: 3.4 } : null),
            node: (i) => (i === f.cur ? { fill: f.bad ? 'red' : 'gold', alpha: 0.5, stroke: f.bad ? 'red' : 'gold', width: 2.6 } : i === f.cmp ? { stroke: 'orange', width: 2.4 } : onPath.has(i) ? { stroke: 'gold', width: 2 } : i === sel && S.atEnd ? { stroke: 'purple', width: 2.6, fill: 'purple', alpha: 0.15 } : null),
          });
          if (S.atEnd && sel >= 0 && sel < n) { const [x, y] = hxy(sel); T.textPx('selected', T.X(x), T.Y(y) + r + 3, { align: 'center', baseline: 'top', size: 10, color: 'purple' }); }
          // array row under the tree
          const w = 1 / Math.max(n, 16), y0 = -D - 1.55;
          cells(T, B, { x0: 0.5 - (n * w) / 2, y: y0, w, h: 0.62, gap: w * 0.06, size: 11, style: (i) => (i === f.cur ? { fill: 'gold', alpha: 0.45, stroke: 'gold', width: 2 } : onPath.has(i) ? { stroke: 'gold', width: 1.8 } : null) });
          // history
          const H = hist.slice(-12);
          Hs.setView([-0.9, Math.max(12, H.length) + 0.7], [0, 5.6]);
          H.forEach((e, k) => {
            const x = k + 1;
            Hs.rect(x - 0.32, 0, x + 0.32, Math.max(e.sw, 0.06), { fill: OPC[e.op], fillAlpha: 0.65, stroke: false });
            Hs.line(x - 0.42, e.h, x + 0.42, e.h, { color: 'ink', width: 2 });
          });
        });
        v.legend([['accent', 'insert'], ['orange', 'extract-min'], ['purple', 'decrease-key'], ['ink', 'height $\\lfloor\\log_2 n\\rfloor$'], ['gold', 'path of the current operation']]);
        v.readout(() => `$n = ${A.length}$ · last operation: ${msg} · bound $\\lfloor\\log_2 n\\rfloor = ${depthOf(Math.max(1, A.length))}$ · minimum $A[1] = ${A.length ? A[0] : '\\text{—}'}$`);
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Algorithm',
      name: 'Quicksort and partitioning',
      credit: 'Hoare, 1961; partition scheme of Lomuto',
      statement: String.raw`**Quicksort** sorts $A[p..r]$ in place: if $p<r$, *partition* the subarray around a pivot $x$ (here the last element, after an optional pivot-selection swap), obtaining an index $q$ with
$$A[p..q-1]\le x=A[q]< A[q+1..r],$$
then sort $A[p..q-1]$ and $A[q+1..r]$ recursively. No combining step is needed.

**Lomuto partition.** Keep $x=A[r]$ and an index $i$; scan $j=p,\dots,r-1$, and whenever $A[j]\le x$ increment $i$ and swap $A[i]\leftrightarrow A[j]$; finally swap $A[i+1]\leftrightarrow A[r]$ and return $q=i+1$. It makes exactly $r-p$ comparisons.`,
      idea: String.raw`Partition maintains a three-region loop invariant (1.4): $A[p..i]\le x$, $A[i+1..j-1]>x$, and $A[j..r-1]$ not yet examined. Each step either leaves a large element in place or swaps a small one to the end of the first region, so the invariant survives, and at termination the pivot is swapped between the two regions, into its final sorted position. Divide and conquer (2.1) does the rest: each recursive call sorts a strictly smaller subarray. How balanced the splits are decides the running time (3.10).`,
      caption: String.raw`Step through the partition loop: **green** cells are $\le$ the gold pivot $x$, **orange** cells are $>x$, uncoloured cells are unexamined; $i$ and $j$ mark the region boundaries and the invariant is checked live. The recursion tree below is drawn over the same positions: each call sits at the place where its pivot lands, labelled with its size and coloured by how balanced its split was. Try the first-element pivot on sorted input to see the tree degenerate into a path.`,
      deps: ['algo-3.1', 'algo-2.1', 'algo-1.4'],
      refs: ['CLRS 4e §7.1'],
      tags: ['sorting'],
      viz(v) {
        const n = 12, rng = v.rng(41);
        let vals = [27, 9, 41, 16, 33, 5, 48, 21, 12, 37, 30, 18], seed = 7;
        const INP = { random: () => rng.shuffle(vals.slice().sort((a, b) => a - b)), sorted: () => vals.slice().sort((a, b) => a - b), reversed: () => vals.slice().sort((a, b) => b - a), few: () => Array.from({ length: n }, () => 10 * rng.int(1, 3)) };
        const rule = v.select('pivot', [{ value: 'last', label: 'last' }, { value: 'first', label: 'first' }, { value: 'median3', label: 'median of 3' }, { value: 'random', label: 'random' }], 'last', { onChange: () => S.reset() });
        const inp = v.select('input', [{ value: 'random', label: 'random' }, { value: 'sorted', label: 'sorted' }, { value: 'reversed', label: 'reversed' }, { value: 'few', label: 'few distinct' }], 'random', { onChange: (k) => { if (k === 'few') vals = INP.few(); else { if (!new Set(vals).size || new Set(vals).size < n) vals = distinct(rng, n, 1, 50); vals = INP[k](); } S.reset(); } });
        v.button('Shuffle', () => { vals = distinct(rng, n, 1, 50); seed++; inp.set('random'); S.reset(); });
        const A = v.stage({ x: [-0.6, n - 0.4], y: [-0.95, 1.75], axes: false, height: 150, full: true });
        const R = v.stage({ x: [-0.6, n - 0.4], y: [-4, 0.6], axes: false, height: 215, full: true, title: 'recursion tree, each call drawn above the position where its pivot lands' });
        let run = null;
        const trace = () => { const s = v.rng(seed); run = quickTrace(vals, rule.value, s); return run.frames; };
        const f0 = trace();
        const S = v.steps({ frames: trace, code: QS_CODE, codeTitle: 'Quicksort (Lomuto partition)', codePos: 'below', speed: 3, start: Math.max(0, f0.findIndex((f) => f.cur > 0 && f.r - f.p >= 5 && f.q == null && f.i != null && f.j - f.p >= 3)) });
        const BAL = (c) => { if (c.size <= 1 || c.q == null) return 'muted'; const b = Math.min(c.left, c.right) / Math.max(1, c.size - 1); return b >= 0.25 ? 'green' : b > 0 ? 'orange' : 'red'; };
        const inv = (f) => { if (f.i == null || f.j == null) return null; for (let k = f.p; k <= f.i; k++) if (!(f.A[k] <= f.x)) return false; for (let k = f.i + 1; k < f.j; k++) if (!(f.A[k] > f.x)) return false; return true; };
        v.render(() => {
          const f = S.frame, act = f.p != null && !f.done;
          cells(A, f.A, {
            x0: -0.5, size: 15,
            style: (k) => {
              if (act && k >= f.p && k <= f.r) {
                if (f.q != null) return k === f.q ? { fill: 'gold', alpha: 0.55, stroke: 'gold', width: 2.4 } : k < f.q ? { fill: 'green', alpha: 0.25, stroke: 'green' } : { fill: 'orange', alpha: 0.25, stroke: 'orange' };
                if (f.i != null) { if (k === f.r) return { fill: 'gold', alpha: 0.5, stroke: 'gold', width: 2.4 }; if (k <= f.i) return { fill: 'green', alpha: 0.28, stroke: 'green', width: k === f.look ? 2.6 : 1.2 }; if (k < f.j) return { fill: 'orange', alpha: 0.28, stroke: 'orange', width: k === f.look ? 2.6 : 1.2 }; return { stroke: 'ink', width: 1.4 }; }
                return { stroke: 'gold', width: 2 };
              }
              return f.fin[k] ? { stroke: 'ink', width: 2.2, text: 'ink' } : { stroke: 'faint', text: 'muted' };
            },
          });
          if (act && f.i != null && f.q == null) {
            const iX = Math.max(f.i, f.p - 1, -0.42);
            A.arrow(iX, -0.62, iX, -0.12, { color: 'green', width: 2, head: 7 }); A.text('i', iX, -0.78, { align: 'center', size: 13, color: 'green', math: true });
            if (f.j < f.r) { A.arrow(f.j, -0.62, f.j, -0.12, { color: 'ink', width: 2, head: 7 }); A.text('j', f.j, -0.78, { align: 'center', size: 13, color: 'ink', math: true }); }
            A.text(`x = ${f.x}`, f.r, 1.32, { align: 'center', size: 12, color: 'gold', weight: 700 });
          }
          if (act) { A.line(f.p - 0.46, 1.08, f.r + 0.46, 1.08, { color: 'accent', width: 2 }); A.text(`A[${f.p + 1}..${f.r + 1}]`, f.p - 0.46, 1.32, { size: 11.5, color: 'accent' }); }
          // recursion tree
          const C = f.calls, all = run.calls, maxD = Math.max(1, ...all.map((c) => c.depth));
          R.setView(null, [-maxD - 0.55, 0.6]);
          const xOf = (c) => (c.q != null ? c.q : (c.p + c.r) / 2);
          const rr = Math.max(5, Math.min(12, R.height / (maxD + 1.2) * 0.32));
          const future = all.slice(C.length); // calls still to come: a faint preview of the whole tree
          for (const c of future) if (c.parent >= 0) { const P = all[c.parent]; R.line(P.q, -P.depth, c.q, -c.depth, { color: 'faint', width: 1, dash: [3, 4] }); }
          for (const c of future) disc(R, c.q, -c.depth, rr, c.size, { stroke: 'faint', width: 1.2, text: 'faint', size: 10 });
          for (const c of C) if (c.parent >= 0) { const P = C[c.parent]; R.line(xOf(P), -P.depth, xOf(c), -c.depth, { color: 'muted', width: 1.6 }); }
          for (const c of C) {
            const col = BAL(c), cur = c.id === f.cur && !f.done;
            disc(R, xOf(c), -c.depth, rr, c.size, { stroke: cur ? 'gold' : col, fill: cur ? 'gold' : col, alpha: cur ? 0.5 : 0.2, width: cur ? 2.6 : 1.6, size: 11 });
          }
        });
        v.legend([['green', '≤ pivot · balanced split', { dot: true }], ['orange', '> pivot · lopsided split', { dot: true }], ['red', 'split 0 | n−1', { dot: true }], ['gold', 'pivot / current call', { dot: true }]]);
        v.readout(() => {
          const f = S.frame, ok = inv(f);
          return `comparisons so far **${f.cmps}** of ${run.cmps} for this input · $n\\log_2 n \\approx ${Math.round(n * Math.log2(n))}$, $\\binom{n}{2} = ${(n * (n - 1)) / 2}$` + (ok == null ? '' : ` · invariant $A[p..i] \\le x < A[i{+}1..j{-}1]$: ${ok ? '✓' : '✗'}`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Quicksort: Θ(n²) worst case, Θ(n log n) for balanced splits',
      statement: String.raw`Let $T(n)$ count partition comparisons in quicksort on $n$ distinct keys: partitioning $m$ keys costs $m-1$, and $T(0)=T(1)=0$. Pivot-selection costs are excluded.

(a) **Worst case.** If every partition is maximally unbalanced (sizes $0$ and $n-1$), as happens on sorted input with the first or last element as pivot, then $T(n)=T(n-1)+(n-1)=\binom n2=\Theta(n^2)$; this is the worst case.

(b) **Balanced splits.** If every partition of a subarray of size $m$ leaves at least $\lfloor\alpha(m-1)\rfloor$ keys on each side, for a fixed $0<\alpha\le\tfrac12$, then the recursion has depth $O(\log n)$ and $T(n)=\Theta(n\log n)$ (constants depend on $\alpha$). For the fixed proportional recurrence, with integer rounding, $T(n)\sim n\log_2 n/H(\alpha)$ with $H(\alpha)=-\alpha\log_2\alpha-(1-\alpha)\log_2(1-\alpha)$.`,
      idea: String.raw`Draw the recursion tree (2.6): the subarrays at one depth are disjoint, so each level costs fewer than $n$ comparisons, and the total is at most $n$ times the depth. With splits $0$ and $n-1$ the depth is $n-1$ and the level costs $n-1, n-2,\dots$ add up to $\binom n2$; a larger split cannot make the sum bigger. For rounded proportional splits a child size $m_1$ satisfies $m_1-1\le(1-\alpha)(m-1)$; this gives logarithmic depth. The total partition cost is the sum of key depths in the binary pivot tree; placing $n$ keys in a binary tree requires total depth at least $n\log_2 n-O(n)$, giving the lower bound. In the ideal recurrence, $\alpha=\tfrac12$ is the master-theorem case $T(n)=2T(n/2)+\Theta(n)$ (2.7). Even a 1 : 9 split is $\Theta(n\log n)$; the constant split condition is sufficient, not necessary, for this bound.`,
      caption: String.raw`Slide the split fraction $\alpha$. Left: the recursion tree as stacked rows, one row per level, each subarray a bar (its pivot a gold tick); the bars on the right of each row are that level's cost. At $\alpha=\tfrac12$ the displayed rounded tree has $\lfloor\log_2 n\rfloor+1$ rows (including singleton leaves); at $\alpha=0$ it is a staircase of $n$ rows. Small positive fractions can still round to zero on small subarrays. Right: comparisons against $n$ on log axes; the $\alpha$-split curve (blue) and the measured runs of real quicksort on sorted input (red, exactly $n(n-1)/2$; the dashed red reference is its leading term $n^2/2$) and on random input (green).`,
      deps: ['algo-3.9', 'algo-2.7', 'algo-2.6'],
      refs: ['CLRS 4e §7.2'],
      tags: ['sorting'],
      viz(v) {
        const aS = v.slider('split fraction $\\alpha$', 0, 0.5, 0.3, { step: 0.01 });
        const nS = v.slider('$n$ in the picture', 8, 128, 64, { int: true });
        const I = v.stage({ x: [0, 80], y: [-6, 0.4], axes: false, height: 320, weight: 1.15, minWidth: 330, title: 'recursion tree, one row per level' });
        const P = v.stage({ x: [8, 4096], y: [8, 1.2e7], xlog: true, ylog: true, axes: 'box', height: 320, weight: 1, minWidth: 300, title: 'comparisons vs $n$', xlabel: 'n' });
        // measured quicksort: Lomuto, first-element pivot
        const meas = { sorted: [], random: [] }, r2 = v.rng(12);
        for (let k = 3; k <= 11; k++) { const m = 1 << k, a = range1(m); meas.sorted.push([m, quickCount(a, 'first')]); meas.random.push([m, quickCount(r2.shuffle(a), 'first')]); }
        const N = 1 << 17; let cacheA = -1, Tm = null, slope = 0;
        const split = (m, a) => Math.floor(a * (m - 1) + 1e-9);
        const exact = (a) => {
          if (a === cacheA) return Tm;
          Tm = new Float64Array(N + 1);
          for (let m = 2; m <= N; m++) { const L = split(m, a); Tm[m] = m - 1 + Tm[L] + Tm[m - 1 - L]; }
          // growth constant: least-squares slope of T(n)/n against log2 n for n in [2^11, 2^17]
          const xs = [], ys = []; for (let k = 0; k <= 60; k++) { const m = Math.round(2 ** (11 + k / 10)); xs.push(Math.log2(m)); ys.push(Tm[m] / m); }
          slope = v.M.linreg(xs, ys).slope; cacheA = a; return Tm;
        };
        let info = null;
        v.render(() => {
          const a = aS.value, n = nS.value, T = exact(a);
          // icicle
          const rows = []; let depth = 0;
          const rec = (lo, m, d) => { if (m <= 0) return; depth = Math.max(depth, d); (rows[d] ||= []).push([lo, m]); if (m === 1) return; const L = split(m, a); rec(lo, L, d + 1); rec(lo + L + 1, m - 1 - L, d + 1); };
          rec(0, n, 0);
          const W = n * 1.32;
          I.setView([-n * 0.02, W], [-depth - 1.05, 0.08 + (depth + 1.1) * 0.07]);
          const rowH = I.height / (depth + 1.2), gap = rowH > 7 ? 0.14 : 0;
          rows.forEach((row, d) => {
            let cost = 0;
            for (const [lo, m] of row) {
              I.rect(lo + 0.04 * Math.min(1, m), -d - 1 + gap, lo + m - 0.04 * Math.min(1, m), -d - gap, { fill: m > 1 ? 'accent' : 'muted', fillAlpha: m > 1 ? 0.18 + 0.5 * (m / n) : 0.25, stroke: false });
              if (m > 1) { const q = lo + split(m, a); I.rect(q, -d - 1 + gap, q + 1, -d - gap, { fill: 'gold', fillAlpha: 0.95, stroke: false }); cost += m - 1; }
            }
            if (cost) I.rect(n * 1.04, -d - 1 + gap, n * 1.04 + (cost / n) * n * 0.26, -d - gap, { fill: 'orange', fillAlpha: 0.6, stroke: false });
          });
          I.line(n * 1.04 + n * 0.26, 0.05, n * 1.04 + n * 0.26, -depth - 1, { color: 'orange', width: 1, dash: [3, 3] });
          I.text('level cost', n * 1.17, 0.06, { align: 'center', baseline: 'bottom', size: 10.5, color: 'orange' });
          // plot
          const H = binEntropy(a);
          P.fn((m) => (m * m) / 2, { color: 'red', width: 1.2, dash: [5, 4] });
          P.fn((m) => m * Math.log2(m), { color: 'muted', width: 1.2, dash: [2, 4] });
          const pts = []; for (let k = 0; k <= 120; k++) { const m = Math.round(8 * 512 ** (k / 120)); pts.push([m, Math.max(1, T[m])]); }
          P.path(pts, { color: 'accent', width: 2.6 });
          if (H > 0) P.fn((m) => (m * Math.log2(m)) / H, { color: 'accent', width: 1.3, dash: [6, 4] });
          P.dots(meas.sorted, { r: 4, color: 'red' }); P.dots(meas.random, { r: 4, color: 'green' });
          P.text('n²/2', 600, 3.2e5, { size: 11, color: 'red', align: 'right' });
          P.text('n log₂ n', 1300, 5e3, { size: 11, color: 'muted', align: 'left' });
          P.dot(n, Math.max(1, T[n]), { r: 6, color: 'gold' });
          info = { a, n, depth, Tn: T[n], H };
        });
        v.legend([['accent', '$\\alpha$-split recurrence (exact)'], ['accent', 'leading term $n\\log_2 n / H(\\alpha)$', { dash: true }], ['red', 'quicksort, sorted input, first pivot', { dot: true }], ['green', 'quicksort, random input', { dot: true }], ['gold', 'current $n$', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { a, n, depth, Tn, H } = info;
          const pred = a > 0 ? `ideal shrink scale $\\log_{1/(1-\\alpha)} n = ${v.fix(Math.log(n) / -Math.log(1 - a), 1)}$; integer splits include rounding` : 'the worst case: depth $n-1$';
          const tail = a === 0 ? ` · $T(n) = \\binom{n}{2}$: quadratic` : ` · growth constant of $T(n)/n$ per doubling, fitted for $n\\le 2^{17}$: **${v.fix(slope, 3)}**, theory $1/H(\\alpha) = ${v.fix(1 / H, 3)}$` + (a < 0.02 ? ' (floors still matter: subarrays shorter than $1/\\alpha$ split $0\\,|\\,m{-}1$)' : '');
          return `$\\alpha = ${v.fix(a, 2)}$: depth **${depth}** for $n=${n}$ (${pred}) · $T(${n}) = ${Tn}$ comparisons` + tail;
        });
      },
    },
  ],
};
