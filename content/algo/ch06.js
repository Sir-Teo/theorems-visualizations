// Algorithms — Chapter 6: Amortized analysis and union–find (items 6.1–6.8; 6.9–6.14 in ch06-b.js)

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const LG = Math.log2;
const fnv = (f, ...a) => (typeof f === 'function' ? f(...a) : f);
const plural = (n, w, ws) => `${n} ${n === 1 ? w : ws || w + 's'}`;
const r2 = (x) => String(Math.round(x * 100) / 100).replace('-', '−');
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (n) => String(n).split('').map((d) => SUP[+d]).join('');
const sgn = (x) => (x > 0 ? '+' + r2(x) : r2(x));

/** A coin of pixel radius r at data point (x, y), shifted by dx, dy pixels; debt: a dashed red IOU instead. */
function coin(v, s, x, y, o = {}) {
  const r = o.r ?? 6, X = s.X(x) + (o.dx || 0), Y = s.Y(y) + (o.dy || 0), c = s.ctx, a = o.alpha ?? 1;
  c.save(); c.beginPath(); c.arc(X, Y, r, 0, 2 * Math.PI);
  if (o.debt) { c.fillStyle = v.color('red', 0.14 * a); c.fill(); c.setLineDash([2.5, 2]); c.lineWidth = 1.5; c.strokeStyle = v.color('red', a); c.stroke(); }
  else {
    c.fillStyle = v.color('gold', a); c.fill(); c.lineWidth = 1; c.strokeStyle = v.color('ink', 0.45 * a); c.stroke();
    c.beginPath(); c.arc(X, Y, r * 0.55, 0, 2 * Math.PI); c.strokeStyle = v.color('panel', 0.75 * a); c.stroke();
  }
  c.restore();
}
/** Set a chart's window with room for tick labels: l px on the left, b px at the bottom, r px right, t px on top. */
function pv(s, [x0, x1], [y0, y1], { l = 32, b = 26, r = 8, t = 0 } = {}) {
  const kx = (x1 - x0) / Math.max(40, s.width - l - r), ky = (y1 - y0) / Math.max(40, s.height - b - t);
  s.setView([x0 - l * kx, x1 + r * kx], [y0 - b * ky, y1 + t * ky]);
}
/** Step-shaped polyline through the values ys[0..] centred at x = x0, x0 + 1, … */
function stepPts(ys, x0 = 1) {
  const pts = [];
  ys.forEach((y, i) => { pts.push([x0 + i - 0.5, y], [x0 + i + 0.5, y]); });
  return pts;
}

// ---------- binary search trees: nodes {k, l, r}. A layout puts a node at x = its in-order rank and y = −depth,
// so a rotation only moves nodes up or down in their columns (as in chapter 5).
const nd = (k) => ({ k, l: null, r: null });
const cloneT = (t) => (t ? { k: t.k, l: cloneT(t.l), r: cloneT(t.r) } : null);
function bstAdd(t, k) {
  const z = nd(k); if (!t) return z;
  for (let u = t; ;) { if (k === u.k) return t; const s = k < u.k ? 'l' : 'r'; if (!u[s]) { u[s] = z; return t; } u = u[s]; }
}
const bstFrom = (keys) => keys.reduce((t, k) => bstAdd(t, k), null);
function layT(t) {
  const pos = new Map(), nodes = [], edges = []; let i = 0, h = 0;
  (function go(u, d, p) {
    if (!u) return;
    go(u.l, d + 1, u);
    const c = { k: u.k, x: i++, d, p: p ? p.k : null };
    pos.set(u.k, c); nodes.push(c); if (d > h) h = d;
    go(u.r, d + 1, u);
  })(t, 0, null);
  for (const c of nodes) if (c.p != null) edges.push([c.p, c.k]);
  return { pos, nodes, edges, n: nodes.length, h };
}
const snapT = (t) => layT(cloneT(t));
function treeView(L, o) {
  const n = Math.max(L.n, 1);
  return [[-0.62 - (o.padL || 0), n - 0.38 + (o.padR || 0)], [-L.h - 0.58 - (o.padB || 0), 0.58 + (o.padT || 0)]];
}
/** Draw layout L on stage s, gliding from o.prev while o.tw < 1. Functions get (key): fill, color, ring, label; edgeColor/edgeWidth (parent, child). */
function drawT(s, L, o = {}) {
  const P = o.prev && o.tw != null && o.tw < 1 && o.prev !== L ? o.prev : null, tw = P ? o.tw : 1;
  let [vx, vy] = treeView(L, o);
  if (P) { const [px, py] = treeView(P, o); vx = [lerp(px[0], vx[0], tw), lerp(px[1], vx[1], tw)]; vy = [lerp(py[0], vy[0], tw), lerp(py[1], vy[1], tw)]; }
  s.setView(vx, vy);
  const r = clamp(Math.min(s.sx * 0.4, s.sy * 0.34), 3.5, o.rmax ?? 15);
  const at = (k) => {
    const c = L.pos.get(k), q = P && P.pos.get(k);
    return q ? [lerp(q.x, c.x, tw), lerp(-q.d, -c.d, tw)] : [c.x, -c.d];
  };
  for (const [a, b] of L.edges) {
    const A = at(a), B = at(b);
    s.line(A[0], A[1], B[0], B[1], { color: fnv(o.edgeColor, a, b) || 'muted', width: fnv(o.edgeWidth, a, b) || 1.7, alpha: 0.85 });
  }
  for (const c of L.nodes) {
    const [x, y] = at(c.k), fill = fnv(o.fill, c.k), col = fnv(o.color, c.k), ring = fnv(o.ring, c.k);
    if (ring) s.dot(x, y, { r: r + 4.5, hollow: true, color: ring, width: 2.6 });
    if (fill) s.dot(x, y, { r, color: fill });
    else { s.dot(x, y, { r, hollow: true, color: col || 'muted', width: col ? 2.4 : 1.6 }); if (col) s.dot(x, y, { r: r - 1.2, color: col, alpha: 0.15, ring: false }); }
    if (r >= 6.5) s.text(String(c.k), x, y, { align: 'center', size: clamp(r * 0.86, 8, 13), weight: 700, color: fill ? 'panel' : 'ink', halo: false });
  }
  return { r, at };
}
function hitT(s, L, x, y, rad = 16) {
  let best = null, bd = rad; const X = s.X(x), Y = s.Y(y);
  for (const c of L.nodes) { const d = Math.hypot(s.X(c.x) - X, s.Y(-c.d) - Y); if (d < bd) { bd = d; best = c; } }
  return best;
}
/** Rotate the node with key ck above its parent; returns the new root (a fresh copy), or null if ck is the root. */
function rotUp(t, ck) {
  const root = cloneT(t); let gp = null, p = null, c = root;
  while (c && c.k !== ck) { gp = p; p = c; c = ck < c.k ? c.l : c.r; }
  if (!c || !p) return null;
  if (p.l === c) { p.l = c.r; c.r = p; } else { p.r = c.l; c.l = p; }
  if (!gp) return c; if (gp.l === p) gp.l = c; else gp.r = c; return root;
}
function pathTo(t, k) { const P = []; for (let u = t; u; u = k < u.k ? u.l : u.r) { P.push(u); if (u.k === k) break; } return P; }

const SPLAY_CODE = [
  'Splay(x):',
  '  while x is not the root:',
  '    p ← x.parent;  g ← p.parent',
  '    if g = nil:  rotate(x)                         ▷ zig',
  '    elif x, p are both left or both right children:',
  '      rotate(p);  rotate(x)                        ▷ zig-zig',
  '    else  rotate(x);  rotate(x)                    ▷ zig-zag',
];
const MTR_CODE = [
  'Move-to-root(x):            ▷ the rule splaying replaces',
  '  while x is not the root:',
  '    rotate(x)                ▷ one level at a time',
];
/** Frames that splay key x to the root of t (or move it up one rotation at a time when zz is false). */
function splayFrames(t0, x, zz) {
  const L0 = snapT(t0), path = pathTo(t0, x).map((u) => u.k), d0 = new Map(L0.nodes.map((c) => [c.k, c.d]));
  const F = [{ t: t0, L: L0, x, path, d0, rot: 0, line: [1, 2], showPath: true, note: `Access ${x}: the search walks down ${plural(path.length - 1, 'edge')} from the root (blue path). Now ${x} is rotated to the root.` }];
  let t = t0, rot = 0;
  for (;;) {
    const P = pathTo(t, x); if (P.length < 2) break;
    const p = P[P.length - 2], g = P.length > 2 ? P[P.length - 3] : null, xl = p.l === P[P.length - 1];
    const base = { x, path, d0, p: p.k, g: g ? g.k : null };
    if (!g || !zz) {
      t = rotUp(t, x); rot++;
      F.push({ ...base, t, L: snapT(t), rot, line: zz ? 4 : 3, note: g ? `Rotate ${x} above its parent ${p.k} (rotation ${rot}). ${x} rises one level, but ${p.k} only swaps places with it.` : `**Zig**: the parent ${p.k} is the root, so a single rotation finishes (rotation ${rot}).` });
      continue;
    }
    const pl = g.l === p, side = xl ? 'left' : 'right';
    if (xl === pl) {
      t = rotUp(t, p.k); rot++;
      F.push({ ...base, t, L: snapT(t), rot, line: [5, 6], note: `**Zig-zig**: ${x} and its parent ${p.k} are both ${side} children, so *first* rotate the parent ${p.k} above the grandparent ${g.k} …` });
      t = rotUp(t, x); rot++;
      F.push({ ...base, t, L: snapT(t), rot, line: [5, 6], note: `… *then* rotate ${x} above ${p.k}: ${x} climbs two levels and the whole path below the old grandparent folds in half.` });
    } else {
      t = rotUp(t, x); rot++;
      F.push({ ...base, t, L: snapT(t), rot, line: 7, note: `**Zig-zag**: ${x} is a ${side} child of a ${pl ? 'left' : 'right'} child: rotate ${x} above ${p.k} …` });
      t = rotUp(t, x); rot++;
      F.push({ ...base, t, L: snapT(t), rot, line: 7, note: `… and then above ${g.k}: ${x} climbs two levels, with ${p.k} and ${g.k} as its children.` });
    }
  }
  const L = snapT(t), mean = (f) => path.reduce((s, k) => s + f(k), 0) / path.length;
  const before = mean((k) => d0.get(k)), after = mean((k) => L.pos.get(k).d);
  F.push({ t, L, x, path, d0, rot, done: true, line: 2, note: `${x} is the root after ${plural(rot, 'rotation')}. The ${path.length} nodes of the old access path moved from mean depth ${r2(before)} to **${r2(after)}**.` });
  return { F, t };
}

// ---------- splay trees on arrays (keys 1..n, 0 = nil) with subtree sizes, for long access sequences
function splayArr(n, shape) {
  const L = new Int32Array(n + 1), R = new Int32Array(n + 1), P = new Int32Array(n + 1), Z = new Int32Array(n + 1);
  let root;
  if (shape === 'path') { for (let k = 1; k <= n; k++) { L[k] = k - 1; P[k] = k < n ? k + 1 : 0; Z[k] = k; } root = n; }
  else {
    const build = (lo, hi, par) => { if (lo > hi) return 0; const m = (lo + hi) >> 1; P[m] = par; L[m] = build(lo, m - 1, m); R[m] = build(m + 1, hi, m); Z[m] = hi - lo + 1; return m; };
    root = build(1, n, 0);
  }
  return { n, L, R, P, Z, root };
}
const phiArr = (T) => { let s = 0; for (let k = 1; k <= T.n; k++) s += LG(T.Z[k]); return s; };
function rotArr(T, x) { // rotate x above its parent; returns the change in Σ log₂ size
  const { L, R, P, Z } = T, p = P[x], g = P[p], before = LG(Z[x]) + LG(Z[p]);
  if (L[p] === x) { L[p] = R[x]; if (R[x]) P[R[x]] = p; R[x] = p; } else { R[p] = L[x]; if (L[x]) P[L[x]] = p; L[x] = p; }
  P[p] = x; P[x] = g;
  if (g) { if (L[g] === p) L[g] = x; else R[g] = x; } else T.root = x;
  Z[x] = Z[p]; Z[p] = 1 + (L[p] ? Z[L[p]] : 0) + (R[p] ? Z[R[p]] : 0);
  return LG(Z[x]) + LG(Z[p]) - before;
}
function splayKey(T, x, zz) {
  let r = 0, dphi = 0; const lemma = 3 * (LG(T.Z[T.root]) - LG(T.Z[x])) + 1;
  while (T.P[x]) {
    const p = T.P[x], g = T.P[p];
    if (!g || !zz) { dphi += rotArr(T, x); r++; }
    else if ((T.L[g] === p) === (T.L[p] === x)) { dphi += rotArr(T, p); dphi += rotArr(T, x); r += 2; }
    else { dphi += rotArr(T, x); dphi += rotArr(T, x); r += 2; }
  }
  return { r, dphi, lemma };
}

export default {
  collection: 'algo',
  chapter: 6,
  title: 'Amortized analysis and union–find',
  summary: String.raw`Some operations are occasionally expensive but cheap on average over *any* sequence. Aggregate counting, prepaid credits and potential functions are three ways to make that precise; they are applied to binary counters, to arrays that grow and shrink, and to self-adjusting splay trees. The chapter ends with the disjoint-set forest, whose two simple heuristics, union by rank and path compression, together bring the cost per operation down to the inverse Ackermann function: at most 4 for any input that fits in the universe.`,
  items: [
    // ------------------------------------------------------------------ 6.1
    {
      num: '6.1',
      kind: 'Concept',
      name: 'Amortized cost',
      statement: String.raw`Let a data structure offer a fixed set of operations, and let $c_i$ be the actual cost of the $i$-th operation of a sequence that starts from the initial state. Numbers $\hat c(\mathrm{op})$, one per kind of operation, are **amortized costs** if for **every** such sequence and every $n$,
$$\sum_{i=1}^{n} c_i \;\le\; \sum_{i=1}^{n} \hat c_i .$$
If every operation has amortized cost at most $a$, then *any* $n$ operations cost at most $an$ in total, even though a single operation may cost far more than $a$. This is a worst-case guarantee about sequences: no probability is involved (unlike average-case running time, 1.3), and it depends on the whole set of operations offered — adding one more operation can destroy it.`,
      idea: String.raw`Expensive operations are paid for by the cheap ones that must come before them. A counter's increment flips many bits only after earlier increments have set them; a stack can only multipop elements that were pushed one by one; an array doubles only after it has filled up. Aggregate counting (6.2), prepaid credits (6.3) and potential functions (6.4) are three ways to prove the inequality. Allowing DECREMENT on the counter breaks it: alternating around $2^k$ makes *every* operation flip all $k$ bits.`,
      caption: String.raw`Pick a structure and press its operation buttons, or let the adversary choose ten operations. Bars are actual costs, the gold line is the running average and the green line is the amortized bound: single bars spike, but the average never crosses the line. Turn on DECREMENT for the counter and press **Adversary ×10** to watch the bound fail.`,
      deps: ['algo-1.3'],
      refs: ['CLRS 4e Ch. 16'],
      credit: 'Tarjan, 1985',
      tags: ['amortized'],
      viz(v) {
        const kind = v.select('', [{ value: 'counter', label: 'binary counter' }, { value: 'stack', label: 'multipop stack' }, { value: 'array', label: 'doubling array' }], 'counter', { onChange: () => reset() });
        const dec = v.toggle('allow DECREMENT', false, { onChange: () => reset() });
        const A = v.stage({ x: [-1, 13], y: [-0.9, 1.3], axes: false, height: 118, full: true });
        const B = v.stage({ x: [0.3, 30.7], y: [0, 10], axes: 'box', height: 230, full: true, title: 'operation $i$: actual cost (bars), running average (gold line), amortized bound (green)' });
        const K = 10, MAXOPS = 300, BOUND = { counter: 2, stack: 2, array: 3 };
        let st, ops = [];
        const isC = () => kind.value === 'counter', isS = () => kind.value === 'stack';
        const trail = (b) => { let i = 0; while (i < K && st.bits[i] === b) i++; return Math.min(K, i + 1); };
        function apply(name) {
          if (ops.length >= MAXOPS) return;
          const o = { name };
          if (isC()) {
            const one = name === 'inc' ? 1 : 0, b = st.bits, flip = [];
            let i = 0; while (i < K && b[i] === one) { b[i] = 1 - one; flip.push(i); i++; }
            if (i < K) { b[i] = one; flip.push(i); }
            o.cost = flip.length; o.flip = flip;
          } else if (isS()) {
            if (name === 'push') { st.S.push(st.next++); o.cost = 1; o.pushed = true; }
            else { const k = name === 'pop' ? 1 : st.S.length; o.popped = st.S.splice(st.S.length - Math.min(k, st.S.length)); o.cost = o.popped.length; }
          } else {
            o.copied = st.n === st.cap ? st.n : 0; if (st.n === st.cap) st.cap = Math.max(1, 2 * st.cap);
            st.n++; o.cost = 1 + o.copied;
          }
          ops.push(o);
        }
        function reset() {
          ops = []; st = isC() ? { bits: Array(K).fill(0) } : isS() ? { S: [], next: 1 } : { cap: 0, n: 0 };
          if (isC()) { for (let i = 0; i < 24; i++) apply('inc'); if (dec.value) adversary(); }
          else if (isS()) for (const c of 'ppppppmppppoppppppppmppp') apply(c === 'p' ? 'push' : c === 'o' ? 'pop' : 'multi');
          else for (let i = 0; i < 33; i++) apply('append');
        }
        const b1 = v.button('Increment', () => apply(isC() ? 'inc' : isS() ? 'push' : 'append'));
        const b2 = v.button('Decrement', () => apply(isC() ? 'dec' : 'pop'));
        const b3 = v.button('Multipop(all)', () => apply('multi'));
        v.button('10 random', () => {
          const r = v.rng(ops.length * 7919 + 13);
          for (let t = 0; t < 10; t++) {
            if (isC()) apply(dec.value && r() < 0.35 ? 'dec' : 'inc');
            else if (isS()) { const u = r(); apply(u < 0.6 ? 'push' : u < 0.82 ? 'pop' : 'multi'); }
            else apply('append');
          }
        });
        function adversary() {
          for (let t = 0; t < 10; t++) {
            if (isC()) apply(dec.value && trail(0) > trail(1) ? 'dec' : 'inc');
            else if (isS()) apply(st.S.length >= 9 ? 'multi' : 'push');
            else apply('append');
          }
        }
        v.button('Adversary ×10', () => adversary());
        v.button('Reset', () => reset());
        reset();
        let info = {};
        v.render(() => {
          const lab1 = isC() ? 'Increment' : isS() ? 'Push' : 'Append', lab2 = isC() ? 'Decrement' : 'Pop';
          if (b1.textContent !== lab1) b1.textContent = lab1; if (b2.textContent !== lab2) b2.textContent = lab2;
          b2.hidden = isC() ? !dec.value : !isS(); b3.hidden = !isS(); dec.el.hidden = !isC();
          const last = ops[ops.length - 1] || {}, bound = BOUND[kind.value];
          // ---- the structure
          if (isC()) {
            A.setView([-1.6, K + 4.6], [-0.9, 1.3]);
            const val = st.bits.reduce((s, b, i) => s + b * 2 ** i, 0), fl = new Set(last.flip || []);
            for (let i = 0; i < K; i++) {
              const x = K - 1 - i, f = fl.has(i);
              A.rect(x - 0.42, -0.42, x + 0.42, 0.42, { fill: st.bits[i] ? 'accent' : 'panel', fillAlpha: st.bits[i] ? 0.3 : 1, color: f ? 'gold' : 'muted', width: f ? 3 : 1.2, radius: 3 });
              A.text(String(st.bits[i]), x, 0, { align: 'center', size: 15, weight: 700, color: f ? 'ink' : 'muted' });
              A.text('2' + sup(i), x, 0.72, { align: 'center', size: 10.5, color: 'muted' });
            }
            A.text(`= ${val}`, K - 0.2, 0, { size: 15, weight: 700 });
            A.text(last.name ? `${last.name === 'inc' ? 'increment' : 'decrement'}: ${plural(last.cost, 'bit')} flipped` : '', K - 0.2, -0.62, { size: 11.5, color: 'muted', weight: 600 });
          } else if (isS()) {
            const S = st.S, gh = (last.popped || []).length, W = Math.max(14, S.length + gh + 3);
            A.setView([-1.6, W], [-0.9, 1.45]);
            S.forEach((e, i) => {
              const top = i === S.length - 1, hot = top && last.pushed;
              A.rect(i + 0.06, -0.42, i + 0.94, 0.42, { fill: 'accent', fillAlpha: 0.22, color: hot ? 'gold' : 'muted', width: hot ? 3 : 1.2, radius: 3 });
              A.text(String(e), i + 0.5, 0, { align: 'center', size: 13, weight: 700 });
            });
            (last.popped || []).forEach((e, j) => {
              const i = S.length + j;
              A.rect(i + 0.06, -0.42, i + 0.94, 0.42, { color: 'faint', width: 1.2, dash: [4, 3], radius: 3 });
              A.text(String(e), i + 0.5, 0, { align: 'center', size: 13, weight: 600, color: 'faint' });
            });
            A.text('bottom', -0.2, 0, { align: 'right', size: 11, color: 'muted' });
            if (S.length) { A.arrow(S.length - 0.5, 1.08, S.length - 0.5, 0.5, { color: 'ink', width: 1.4, head: 7 }); A.text('top', S.length - 0.5, 1.12, { align: 'center', baseline: 'bottom', size: 11, color: 'muted', weight: 600 }); }
            if (gh) A.text(`popped ${gh}`, S.length + gh / 2, -0.62, { align: 'center', size: 11.5, color: 'muted', weight: 600 });
          } else {
            const cap = st.cap, W = Math.max(16, cap + 1.5);
            A.setView([-1.6, W], [-0.9, 1.3]);
            for (let i = 0; i < cap; i++) {
              const used = i < st.n, isNew = i === st.n - 1, cop = i < (last.copied || 0);
              A.rect(i + 0.06, -0.42, i + 0.94, 0.42, { fill: isNew ? 'gold' : cop ? 'orange' : used ? 'accent' : 'grid', fillAlpha: used ? 0.3 : 0.5, color: isNew ? 'gold' : cop ? 'orange' : used ? 'muted' : 'faint', width: isNew || cop ? 2 : 1, radius: 2 });
            }
            A.text(`size ${st.n}, capacity ${cap}`, 0, 0.78, { size: 11.5, color: 'muted', weight: 600 });
            if (last.copied) A.text(`the last append copied ${last.copied} elements into a new array of ${cap}`, last.copied / 2, -0.66, { align: 'center', size: 11.5, color: 'orange', weight: 600 });
          }
          // ---- the cost chart
          const N = ops.length; let tot = 0, maxC = 0, worstAvg = 0; const avg = [];
          ops.forEach((o, i) => { tot += o.cost; maxC = Math.max(maxC, o.cost); avg.push([i + 1, tot / (i + 1)]); worstAvg = Math.max(worstAvg, tot / (i + 1)); });
          const broken = worstAvg > bound + 1e-9, X1 = Math.max(30, N) + 0.7, Y1 = Math.max(maxC, bound * 1.6) * 1.14;
          pv(B, [0.3, X1], [0, Y1], { r: 112 });
          const bw = Math.min(0.74, 0.74 * 60 / Math.max(N, 60));
          ops.forEach((o, i) => B.rect(i + 1 - bw / 2, 0, i + 1 + bw / 2, o.cost, { fill: o.cost > bound ? 'orange' : 'accent', fillAlpha: 0.55, stroke: false }));
          B.hline(bound, { color: broken ? 'red' : 'green', dash: [8, 5], width: 2 });
          B.path(avg, { color: 'gold', width: 2.8 });
          B.text(`amortized bound ${bound}`, X1, bound, { baseline: 'bottom', dx: 6, dy: -3, size: 11.5, weight: 700, color: broken ? 'red' : 'green' });
          info = { N, tot, maxC, worstAvg, broken, bound };
        });
        v.legend([['accent', 'actual cost', { area: true }], ['orange', 'single operation above the bound', { area: true }], ['gold', 'running average (total ÷ i)'], ['green', 'amortized bound', { dash: true }]]);
        v.readout(() => {
          const { N, tot, maxC, worstAvg, broken, bound } = info;
          if (!N) return 'No operations yet.';
          const head = `**${N}** operations, total actual cost **${tot}**, average **${r2(tot / N)}** · most expensive single operation: **${maxC}**`;
          if (broken) {
            const val = st.bits.reduce((s, b, i) => s + b * 2 ** i, 0), prev = ops[N - 1].name === 'inc' ? (val + 1023) % 1024 : (val + 1) % 1024;
            return `${head} · ✗ a prefix has average ${r2(worstAvg)} > ${bound}: with DECREMENT allowed there is no constant amortized bound — the adversary steps back and forth between ${Math.min(val, prev)} and ${Math.max(val, prev)}, flipping ${ops[N - 1].cost} bits every time, and between $0$ and $2^{${K}} - 1$ it would flip all ${K}.`;
          }
          return `${head} · every prefix has average ≤ ${r2(worstAvg)} ≤ ${bound} ✓ — the expensive operations are paid for by the cheap ones before them.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.2
    {
      num: '6.2',
      kind: 'Method',
      name: 'Aggregate analysis',
      statement: String.raw`**Aggregate analysis** bounds the total actual cost $T(n)$ of any sequence of $n$ operations directly, and assigns every operation the amortized cost $T(n)/n$.

*Example (binary counter).* Incrementing a counter that starts at $0$ costs one unit per bit flipped. In $n$ increments, bit $i$ flips exactly $\lfloor n/2^i\rfloor$ times, so the total number of flips is
$$\sum_{i\ge 0}\Big\lfloor \frac{n}{2^i}\Big\rfloor \;=\; 2n-s_2(n)\;<\;2n,$$
where $s_2(n)$ is the number of 1s in the binary expansion of $n$. Each increment therefore has amortized cost less than $2$, although a single increment can flip $\lfloor\log_2 n\rfloor+1$ bits.`,
      idea: String.raw`The flips form a table with one column per increment and one row per bit. Adding up the columns gives the useless bound $n\cdot k$ for a $k$-bit counter, because a column can be tall. Adding up the rows instead is easy: bit $i$ changes exactly when $2^i$ divides the number of increments so far, so its row holds $\lfloor n/2^i\rfloor$ flips, and the row totals form a geometric series dominated by its first term (1.12). Aggregate analysis is exactly this change in the order of summation.`,
      caption: String.raw`Each column is one increment, written in binary (bit 0 at the bottom, blue cells are 1s), and a dot marks every bit it flips. Switch between adding up by columns (the cost of each increment, at most $k=7$) and by rows (bit $i$ flips every $2^i$ steps); hover over the grid to pick out a row or column. The lower chart shows the running total against $2j$.`,
      deps: ['algo-6.1', 'algo-1.12'],
      refs: ['CLRS 4e §16.1'],
      tags: ['amortized'],
      viz(v) {
        const nS = v.slider('$n$ increments', 1, 64, 40, { int: true });
        const by = v.select('add the flips up by', [{ value: 'col', label: 'increment (column)' }, { value: 'row', label: 'bit (row)' }], 'row');
        const K = 7, ROWC = ['blue', 'teal', 'green', 'gold', 'orange', 'red', 'purple'];
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, full: true, hover: true });
        const B = v.stage({ x: [0, 64], y: [0, 130], axes: 'box', height: 200, full: true, title: 'total number of flips after $j$ increments' });
        const flips = (j, i) => j % (1 << i) === 0;           // bit i flips at increment j ≥ 1
        const cost = (j) => { let c = 0; for (let i = 0; i < K; i++) if (flips(j, i)) c++; return c; };
        const pop = (n) => n.toString(2).split('').filter((c) => c === '1').length;
        let hov = { c: -1, r: -1 };
        v.render(() => {
          const n = nS.value, row = by.value === 'row', W = Math.max(n, 16);
          const Lpx = 46, Rpx = row ? 205 : 24, Tpx = row ? 14 : 66, ppu = (A.width - Lpx - Rpx) / W;
          const x0 = 0.5 - Lpx / ppu, x1 = W + 0.5 + Rpx / ppu;
          const ppy = (A.height - 26 - Tpx) / K;
          A.setView([x0, x1], [-0.5 - 26 / ppy, K - 0.5 + Tpx / ppy]);
          const P = A.pointer;
          hov = { c: -1, r: -1 };
          if (P && P.inside) {
            const c = Math.round(P.x), r = Math.round(P.y);
            if (c >= 1 && c <= n && P.y > -0.5) hov.c = c;
            if (r >= 0 && r < K && P.y < K - 0.5) hov.r = r;
          }
          const dr = clamp(Math.min(ppu, ppy) * 0.26, 2, 5.5);
          for (let i = 0; i < K; i++) {
            const hr = row && hov.r === i;
            if (hr) A.rect(0.5, i - 0.48, n + 0.5, i + 0.48, { fill: ROWC[i], fillAlpha: 0.12, color: ROWC[i], width: 1.5 });
            A.text(`bit ${i}`, 0.5, i, { align: 'right', dx: -6, size: 11.5, weight: hr ? 800 : 600, color: row ? ROWC[i] : 'muted' });
          }
          for (let j = 1; j <= n; j++) {
            const hc = !row && hov.c === j;
            if (hc) A.rect(j - 0.5, -0.48, j + 0.5, K - 0.52, { fill: 'gold', fillAlpha: 0.12, color: 'gold', width: 1.5 });
            for (let i = 0; i < K; i++) {
              const bit = (j >> i) & 1;
              A.rect(j - 0.43, i - 0.4, j + 0.43, i + 0.4, { fill: bit ? 'accent' : 'grid', fillAlpha: bit ? 0.3 : 0.5, stroke: false });
              if (flips(j, i)) A.dot(j, i, { r: dr, color: row ? ROWC[i] : 'gold', ring: false });
            }
          }
          if (row) {
            const bx = n + 1, blen = Math.min(70 / ppu, (Rpx - 120) / ppu);
            for (let i = 0; i < K; i++) {
              const c = Math.floor(n / 2 ** i);
              A.rect(bx, i - 0.28, bx + blen * c / n, i + 0.28, { fill: ROWC[i], fillAlpha: 0.55, stroke: false });
              A.text(`⌊${n}/${2 ** i}⌋ = ${c}`, bx + blen, i, { dx: 6, size: 11.5, weight: hov.r === i ? 800 : 600, color: c ? 'ink' : 'faint' });
            }
          } else {
            const yb = K - 0.3, sc = 0.2;
            A.line(0.5, yb + K * sc, n + 0.5, yb + K * sc, { color: 'red', dash: [5, 4], width: 1.3 });
            A.text(`k = ${K}: the most one increment can flip`, n + 0.5, yb + K * sc, { align: 'right', baseline: 'bottom', dy: -2, size: 11, color: 'red', weight: 600 });
            for (let j = 1; j <= n; j++) A.rect(j - 0.36, yb, j + 0.36, yb + cost(j) * sc, { fill: hov.c === j ? 'gold' : 'orange', fillAlpha: 0.7, stroke: false });
            A.text('cost', 0.5, yb + 0.5, { align: 'right', dx: -6, size: 11.5, weight: 600, color: 'orange' });
          }
          // running totals
          const cum = [0]; for (let j = 1; j <= n; j++) cum.push(cum[j - 1] + cost(j));
          pv(B, [0, n + 0.5], [0, row ? Math.max(2.2 * n, 4) : K * n * 1.04]);
          if (row) {
            let base = cum.map(() => 0);
            for (let i = 0; i < K; i++) {
              const top = base.map((b, j) => b + Math.floor(j / 2 ** i));
              if (top[n] > base[n] || i === 0) B.poly([...top.map((y, j) => [j, y]), ...base.map((y, j) => [j, y]).reverse()], { fill: ROWC[i], fillAlpha: 0.32, stroke: false });
              base = top;
            }
          } else B.fn((x) => K * x, { color: 'red', dash: [7, 5], width: 1.8, domain: [0, n] });
          B.fn((x) => 2 * x, { color: 'green', dash: [7, 5], width: 2, domain: [0, n] });
          B.path(cum.map((y, j) => [j, y]), { color: 'ink', width: 2.2 });
          B.text('2j', n, 2 * n, { align: 'right', baseline: 'bottom', dx: -4, dy: -2, size: 12, weight: 700, color: 'green' });
          if (!row) B.text(`${K}j  (k flips per increment)`, n * 0.62, K * n * 0.62, { align: 'right', dx: -8, size: 11.5, weight: 700, color: 'red' });
          if (hov.c > 0) B.vline(hov.c, { color: 'gold', width: 1.2, dash: [3, 3] });
        });
        v.readout(() => {
          const n = nS.value, row = by.value === 'row';
          v.legend([['accent', 'bit is 1', { area: true }], [row ? 'teal' : 'gold', row ? 'flip, coloured by bit' : 'flip (cost 1)', { dot: true }], ['ink', 'total flips'], ['green', '2j', { dash: true }], ...(row ? [] : [['red', 'kj', { dash: true }]])]);
          const terms = []; for (let i = 0; 2 ** i <= n; i++) terms.push(Math.floor(n / 2 ** i));
          const T = terms.reduce((a, b) => a + b, 0);
          const hc = hov.c > 0 ? ` · increment ${hov.c}: ${(hov.c - 1).toString(2)} → ${hov.c.toString(2)} flips **${cost(hov.c)}** bits` : hov.r >= 0 && row ? ` · bit ${hov.r} flips every $2^{${hov.r}} = ${2 ** hov.r}$ increments` : '';
          if (row) return `$n = ${n}$: total flips $=\\sum_i \\lfloor n/2^i\\rfloor = ${terms.join('+')} = ${T}$ $= 2n - s_2(n) = ${2 * n} - ${pop(n)}$ $< 2n$ ✓ — amortized cost per increment $< 2$${hc}`;
          return `adding by columns: each increment flips at most $k = ${K}$ bits, which only proves the total is at most $nk = ${K * n}$; the true total is ${T} $< 2n = ${2 * n}$, because increments that flip many bits are rare${hc}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.3
    {
      num: '6.3',
      kind: 'Method',
      name: 'Accounting method',
      statement: String.raw`In the **accounting method** each operation is charged an amortized cost $\hat c_i$, which may differ from its actual cost $c_i$. When $\hat c_i > c_i$ the difference is stored as **credit** on specific objects of the data structure, and later operations may spend stored credit to pay for their actual cost. If the total credit never becomes negative, that is $\sum_{i\le n}\hat c_i-\sum_{i\le n}c_i\ge 0$ for every sequence and every $n$, then the charges are valid amortized costs.

*Example (multipop stack).* With PUSH costing 1, POP costing 1 and MULTIPOP$(k)$ costing $\min(k,s)$ on a stack of size $s$, charge 2 for PUSH and 0 for POP and MULTIPOP: one unit pays for the push and one coin stays on the pushed element, ready to pay for its eventual removal. Then any $n$ operations cost at most $2n$.`,
      idea: String.raw`Credit is attached to the objects that will need it: every element on the stack carries exactly one coin, so a pop or a multipop of $m$ elements finds $m$ coins waiting on precisely the elements it removes. The bank balance equals the stack size, which is never negative, so the total actual cost is at most the total charge. Charging only 1 per push leaves nothing for the pops, and the balance goes into debt at the first pop; charging 3 is valid but loose.`,
      caption: String.raw`Press PUSH, POP and MULTIPOP$(k)$. Each push pays its charge in coins: one is spent on the push, the rest wait on the element (spent coins fade). A pop spends the coin on the element it removes. The chart shows the actual cost of each operation and the bank balance $\sum\hat c_i-\sum c_i$; switch the charge to 1 coin and the balance goes red.`,
      deps: ['algo-6.1', 'algo-5.1'],
      refs: ['CLRS 4e §16.2'],
      tags: ['amortized'],
      viz(v) {
        const ch = v.select('charge for PUSH', [{ value: 1, label: '1 coin' }, { value: 2, label: '2 coins' }, { value: 3, label: '3 coins' }], 2);
        const kS = v.slider('$k$ for MULTIPOP', 1, 8, 3, { int: true });
        const A = v.stage({ x: [-0.7, 6.6], y: [-1.1, 10.4], axes: false, height: 350, weight: 0.8, minWidth: 260 });
        const B = v.stage({ x: [0.3, 24.7], y: [-6, 10], axes: 'box', height: 350, weight: 1.35, xlabel: 'operation', title: 'actual cost (bars) and bank balance (line)' });
        const CAP = 10, DEFAULT = ['push', 'push', 'push', 'push', ['multi', 3], 'push', 'push', 'push', 'pop', 'push', 'push', 'push', 'push', ['multi', 5], 'push', 'push'];
        let log = DEFAULT.slice();
        function sim() {
          const c = ch.value, S = [], H = []; let surplus = 0, debt = 0, id = 0, tot = 0, chg = 0, firstNeg = -1, minBal = 0;
          for (const a of log) {
            const name = typeof a === 'string' ? a : a[0]; let cost = 0, charged = 0; const popped = [];
            if (name === 'push') { S.push({ id: ++id, coins: c - 1 }); cost = 1; charged = c; }
            else {
              const m = Math.min(name === 'pop' ? 1 : a[1], S.length); cost = m;
              for (let t = 0; t < m; t++) {
                const e = S.pop(); let coins = e.coins, from;
                if (coins > 0) { coins--; from = 'own'; } else if (surplus > 0) { surplus--; from = 'bank'; } else { debt++; from = 'debt'; }
                surplus += coins; popped.push({ id: e.id, from, extra: coins });
              }
            }
            const net = Math.min(surplus, debt); surplus -= net; debt -= net;
            tot += cost; chg += charged; const bal = chg - tot;
            if (bal < 0 && firstNeg < 0) firstNeg = H.length; minBal = Math.min(minBal, bal);
            H.push({ name, k: a[1], cost, charged, bal, popped });
          }
          return { S, surplus, debt, H, tot, chg, firstNeg, minBal };
        }
        const size = () => sim().S.length;
        v.button('Push', () => { if (size() < CAP) log.push('push'); });
        v.button('Pop', () => log.push('pop'));
        const bm = v.button('Multipop(3)', () => log.push(['multi', kS.value]));
        v.button('Random ×5', () => { const r = v.rng(log.length * 31 + 7); for (let t = 0; t < 5; t++) { const s = size(), u = r(); log.push(s >= CAP || (s > 2 && u < 0.3) ? (u < 0.12 ? 'pop' : ['multi', 1 + Math.floor(r() * 5)]) : 'push'); } });
        v.button('Undo', () => log.pop());
        v.button('Reset', () => { log = DEFAULT.slice(); });
        let R = null;
        v.render(() => {
          const lab = `Multipop(${kS.value})`; if (bm.textContent !== lab) bm.textContent = lab;
          R = sim();
          const { S, surplus, debt, H } = R, last = H[H.length - 1] || {}, c = ch.value;
          // ---- the stack with its coins
          A.setView([-0.7, 6.6], [-1.1, Math.max(6, S.length + (last.popped || []).length) + 0.4]);
          A.line(-0.2, 0, 2.4, 0, { color: 'muted', width: 2 });
          S.forEach((e, i) => {
            const hot = i === S.length - 1 && last.name === 'push';
            A.rect(0.1, i + 0.08, 2.1, i + 0.92, { fill: 'accent', fillAlpha: 0.2, color: hot ? 'gold' : 'muted', width: hot ? 3 : 1.3, radius: 4 });
            A.text(`x${e.id}`, 1.1, i + 0.5, { align: 'center', size: 13, weight: 700 });
            for (let q = 0; q < e.coins; q++) coin(v, A, 2.6, i + 0.5, { r: 7, dx: q * 16 });
          });
          (last.popped || []).forEach((p, j) => {
            const i = S.length + (last.popped.length - 1 - j);
            A.rect(0.1, i + 0.08, 2.1, i + 0.92, { color: 'faint', width: 1.2, dash: [4, 3], radius: 4 });
            A.text(`x${p.id}`, 1.1, i + 0.5, { align: 'center', size: 13, weight: 600, color: 'faint' });
            coin(v, A, 2.6, i + 0.5, { r: 7, alpha: p.from === 'debt' ? 1 : 0.3, debt: p.from === 'debt' });
            A.text(p.from === 'own' ? 'paid its pop' : p.from === 'bank' ? 'paid from bank' : 'unpaid!', 2.6, i + 0.5, { dx: 12, size: 10.5, color: p.from === 'debt' ? 'red' : 'faint', weight: 600 });
          });
          if (last.name === 'push' && S.length) { const i = S.length - 1; coin(v, A, 2.6, i + 0.5, { r: 7, dx: (c - 1) * 16, alpha: 0.3 }); A.text('paid the push', 2.6, i + 0.5, { dx: (c - 1) * 16 + 12, size: 10.5, color: 'faint', weight: 600 }); }
          A.text('stack', 1.1, -0.45, { align: 'center', size: 11.5, color: 'muted', weight: 600 });
          // bank: surplus coins and debts
          for (let q = 0; q < surplus; q++) coin(v, A, 4.7, 0.3, { r: 7, dy: -q * 5 });
          for (let q = 0; q < debt; q++) coin(v, A, 5.8, 0.3, { r: 7, dy: -q * 6, debt: true });
          A.text('spare', 4.7, -0.45, { align: 'center', size: 11.5, color: 'muted', weight: 600 });
          A.text('debt', 5.8, -0.45, { align: 'center', size: 11.5, color: debt ? 'red' : 'muted', weight: 600 });
          // ---- ledger
          const N = H.length, maxC = Math.max(1, ...H.map((h) => h.cost)), bals = H.map((h) => h.bal);
          const lo = Math.min(0, ...bals), hi = Math.max(maxC, ...bals, 3), X1 = Math.max(24, N) + 0.7;
          pv(B, [0.3, X1], [lo - 0.6, hi + 1.2]);
          H.forEach((h, i) => B.rect(i + 0.5, 0, i + 1.5, h.bal, { fill: h.bal < 0 ? 'red' : 'green', fillAlpha: 0.13, stroke: false }));
          H.forEach((h, i) => { if (h.cost) B.rect(i + 1 - 0.22, 0, i + 1 + 0.22, h.cost, { fill: 'orange', fillAlpha: 0.75, stroke: false }); });
          H.forEach((h, i) => B.line(i + 0.5, h.bal, i + 1.5, h.bal, { color: h.bal < 0 ? 'red' : 'green', width: 2.6 }));
          H.forEach((h, i) => { if (i) { const p = H[i - 1].bal; B.line(i + 0.5, p, i + 0.5, h.bal, { color: 'green', width: 1, alpha: 0.5 }); } });
          B.hline(0, { color: 'muted', width: 1.2 });
          B.text('balance', N + 0.6, last.bal ?? 0, { baseline: 'bottom', dy: -3, size: 11.5, weight: 700, color: (last.bal ?? 0) < 0 ? 'red' : 'green' });
        });
        v.legend([['orange', 'actual cost', { area: true }], ['green', 'bank balance (coins stored)'], ['red', 'debt', { area: true }]]);
        v.readout(() => {
          const { S, H, tot, chg, firstNeg, minBal } = R, c = ch.value, bal = chg - tot, pushes = H.filter((h) => h.name === 'push').length;
          if (firstNeg >= 0) return `✗ with ${plural(c, 'coin')} per push the balance went negative at operation ${firstNeg + 1} (a ${H[firstNeg].name === 'push' ? 'push' : H[firstNeg].name === 'pop' ? 'pop' : 'multipop'}): the push spends its only coin on itself and nothing is left on the element for its removal. Lowest balance ${minBal}, so these charges are **not** valid amortized costs.`;
          const per = c === 2 ? `one coin on each of the ${S.length} stacked elements` : `${c - 1} coins per stacked element plus spares`;
          return `balance **${bal}** coins (${per}), never negative ✓ — so the actual cost ${tot} ≤ total charge ${chg} = ${c} × ${pushes} pushes${c === 3 ? ' · valid but loose: the third coin is never needed' : ' · any $n$ operations cost at most $2n$'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.4
    {
      num: '6.4',
      kind: 'Method',
      name: 'Potential method',
      statement: String.raw`In the **potential method** one chooses a function $\Phi$ from states of the data structure to real numbers with $\Phi(D_i)\ge\Phi(D_0)$ for every state reachable from the initial state $D_0$. The amortized cost of the $i$-th operation is defined as
$$\hat c_i \;=\; c_i + \Phi(D_i)-\Phi(D_{i-1}).$$
The sum telescopes: $\sum_{i\le n}\hat c_i=\sum_{i\le n}c_i+\Phi(D_n)-\Phi(D_0)\ge\sum_{i\le n}c_i$, so the $\hat c_i$ are valid amortized costs. For a binary counter, $\Phi=$ number of 1 bits gives $\hat c\le 2$ per increment; for a multipop stack, $\Phi=$ stack size gives $\hat c\le 2$ for PUSH and $0$ for POP and MULTIPOP.`,
      idea: String.raw`The potential is the bank balance of the accounting method (6.3), but computed from the state alone instead of being tracked coin by coin. An increment that turns $t$ trailing 1s into 0s costs $t+1$ and lowers the number of 1s by $t-1$, so its amortized cost is exactly $2$: the expensive work is paid by released potential. A bad choice of $\Phi$ shows itself at once: with $\Phi=0$ the amortized costs are the actual ones, and with $\Phi=$ number of 0 bits they grow like $2t$ and $\Phi$ ends below where it started.`,
      caption: String.raw`Each column is one operation: the orange part of the actual cost is paid by the amortized charge, blue is the part of the charge deposited into $\Phi$, and the hatched part is paid by potential released. The heavy tick on each column is $\hat c_i=c_i+\Delta\Phi_i$: with a good potential the ticks lie flat on the green line. Change $\Phi$ to see what a bad potential looks like; the lower chart shows $\Phi$ charging and discharging like a battery.`,
      deps: ['algo-6.3'],
      refs: ['CLRS 4e §16.3'],
      credit: 'Sleator & Tarjan (potential functions), 1985',
      tags: ['amortized'],
      viz(v) {
        const str = v.select('', [{ value: 'counter', label: 'binary counter' }, { value: 'stack', label: 'multipop stack' }], 'counter', { onChange: () => reset() });
        const pc = v.select('$\\Phi$ =', [{ value: 'ones', label: '# 1 bits' }, { value: 'two', label: '2 × # 1 bits' }, { value: 'zero', label: '0' }, { value: 'zeros', label: '# 0 bits' }], 'ones');
        const ps = v.select('$\\Phi$ =', [{ value: 'size', label: 'stack size' }, { value: 'zero', label: '0' }, { value: 'neg', label: '− stack size' }], 'size');
        const A = v.stage({ x: [0.3, 24.7], y: [-1, 6], axes: 'box', height: 250, full: true, xlabel: 'operation i', title: 'actual cost $c_i$, change in potential $\\Delta\\Phi_i$, amortized cost $\\hat c_i = c_i + \\Delta\\Phi_i$' });
        const B = v.stage({ x: [0.3, 24.7], y: [0, 8], axes: 'box', height: 150, full: true, title: 'the potential $\\Phi(D_i)$' });
        const K = 8, PHI = { ones: (s) => s.ones, two: (s) => 2 * s.ones, zero: () => 0, zeros: (s) => K - s.ones, size: (s) => s.size, neg: (s) => -s.size };
        const BND = { ones: 2, two: 3, size: 2 };
        let ops = [], st;
        const isC = () => str.value === 'counter';
        function apply(name) {
          if (ops.length >= 120) return;
          let cost;
          if (isC()) { let i = 0; while (i < K && st.bits[i]) { st.bits[i] = 0; i++; } if (i < K) st.bits[i] = 1; cost = Math.min(i + 1, K); }
          else if (name === 'push') { st.size++; cost = 1; }
          else { const m = Math.min(name === 'pop' ? 1 : st.size, st.size); st.size -= m; cost = m; }
          ops.push({ name, cost, state: { ones: isC() ? st.bits.reduce((a, b) => a + b, 0) : 0, size: isC() ? 0 : st.size, bits: isC() ? st.bits.slice() : null } });
        }
        function reset() {
          ops = []; st = isC() ? { bits: Array(K).fill(0) } : { size: 0 };
          if (isC()) for (let i = 0; i < 20; i++) apply('inc');
          else for (const c of 'pppoppppmpppppopppmpp') apply(c === 'p' ? 'push' : c === 'o' ? 'pop' : 'multi');
        }
        const b1 = v.button('Increment', () => apply(isC() ? 'inc' : 'push'));
        const b2 = v.button('Pop', () => apply('pop'));
        const b3 = v.button('Multipop(all)', () => apply('multi'));
        v.button('Random ×8', () => { const r = v.rng(ops.length * 97 + 5); for (let t = 0; t < 8; t++) apply(isC() ? 'inc' : r() < 0.62 ? 'push' : r() < 0.5 ? 'pop' : 'multi'); });
        v.button('Reset', () => reset());
        reset();
        let info = {};
        v.render(() => {
          const lab = isC() ? 'Increment' : 'Push'; if (b1.textContent !== lab) b1.textContent = lab;
          b2.hidden = b3.hidden = isC(); pc.el.hidden = !isC(); ps.el.hidden = isC();
          const key = isC() ? pc.value : ps.value, phi = PHI[key], bound = BND[key];
          const s0 = { ones: 0, size: 0 }, phis = [phi(s0), ...ops.map((o) => phi(o.state))];
          const rows = ops.map((o, i) => { const d = phis[i + 1] - phis[i]; return { c: o.cost, d, a: o.cost + d }; });
          const N = rows.length, X1 = Math.max(24, N) + 0.7;
          const lo = Math.min(0, ...rows.map((r) => r.a)), hi = Math.max(3, ...rows.map((r) => Math.max(r.c, r.a)));
          pv(A, [0.3, X1], [lo - 0.3, hi + 0.9]);
          const w = Math.min(0.66, 0.66 * 50 / Math.max(N, 50));
          rows.forEach(({ c, d, a }, k) => {
            const i = k + 1, x0 = i - w / 2, x1 = i + w / 2;
            if (d >= 0) {
              if (c > 0) A.rect(x0, 0, x1, c, { fill: 'orange', fillAlpha: 0.62, stroke: false });
              if (d > 0) A.rect(x0, c, x1, c + d, { fill: 'blue', fillAlpha: 0.5, stroke: false });
            } else {
              const lo2 = Math.max(a, 0);
              if (lo2 > 0) A.rect(x0, 0, x1, lo2, { fill: 'orange', fillAlpha: 0.62, stroke: false });
              if (c > lo2) { A.rect(x0, lo2, x1, c, { fill: 'green', fillAlpha: 0.08, stroke: false, hatch: 'green', hatchGap: 5 }); A.rect(x0, lo2, x1, c, { color: 'green', width: 1.1 }); }
              if (a < 0) A.rect(x0, a, x1, 0, { fill: 'red', fillAlpha: 0.35, stroke: false });
            }
            A.line(x0 - 0.1, a, x1 + 0.1, a, { color: 'ink', width: 2.6 });
          });
          A.hline(0, { color: 'muted', width: 1 });
          if (bound != null) { A.hline(bound, { color: 'green', dash: [8, 5], width: 1.8 }); A.text(`ĉ ≤ ${bound}`, X1 - 0.3, bound, { align: 'right', baseline: 'bottom', dy: -3, size: 12, weight: 700, color: 'green' }); }
          // the battery
          const p0 = phis[0], pmin = Math.min(...phis), pmax = Math.max(...phis);
          pv(B, [0.3, X1], [Math.min(0, pmin) - 0.3, Math.max(pmax, 1) * 1.15 + 0.5]);
          phis.slice(1).forEach((p, k) => B.rect(k + 0.5, p0, k + 1.5, p, { fill: p < p0 ? 'red' : 'blue', fillAlpha: p < p0 ? 0.3 : 0.2, stroke: false }));
          B.path(stepPts(phis.slice(1)), { color: 'blue', width: 2 });
          B.hline(p0, { color: 'muted', width: 1.2, dash: [4, 3] });
          B.text('Φ(D₀)', X1, p0, { align: 'right', baseline: 'bottom', dy: -2, dx: -4, size: 11, color: 'muted', weight: 600 });
          const lastS = ops[N - 1] && ops[N - 1].state;
          if (lastS) B.setTitle(`the potential $\\Phi(D_i)$ — now ${isC() ? `counter = ${lastS.bits.slice().reverse().join('')}` : `stack size ${lastS.size}`}`);
          info = { rows, phis, bound, key };
        });
        v.legend([['orange', 'cost paid by the charge', { area: true }], ['blue', 'charge saved in Φ', { area: true }], ['green', 'cost paid by Φ', { area: true }], ['ink', '$\\hat c_i$']]);
        v.readout(() => {
          const { rows, phis, bound, key } = info, N = rows.length; if (!N) return '';
          const L = rows[N - 1], maxA = Math.max(...rows.map((r) => r.a)), sumA = rows.reduce((s, r) => s + r.a, 0), sumC = rows.reduce((s, r) => s + r.c, 0);
          const dP = phis[N] - phis[0], below = phis.some((p) => p < phis[0]);
          const head = `last operation: $c = ${L.c}$, $\\Delta\\Phi = ${sgn(L.d)}$, $\\hat c = ${r2(L.a)}$ · $\\sum c_i = \\sum\\hat c_i - (\\Phi_n - \\Phi_0) = ${r2(sumA)} - ${dP < 0 ? '(' + r2(dP) + ')' : r2(dP)} = ${sumC}$`;
          if (bound != null) return `${head} · every $\\hat c_i \\le ${bound}$ ✓ (largest ${r2(maxA)}) and $\\Phi \\ge \\Phi_0$ ✓, so any $n$ operations cost at most ${bound}n`;
          if (key === 'zero') return `${head} · with $\\Phi = 0$ the amortized cost is just the actual cost (max ${maxA}): nothing is saved for the expensive operations`;
          return `${head} · ✗ this potential ${below ? 'drops below $\\Phi_0$, so $\\sum\\hat c_i$ is not an upper bound, and ' : ''}gives amortized costs up to ${r2(maxA)} — they are not flat`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.5
    {
      num: '6.5',
      kind: 'Theorem',
      name: 'Dynamic arrays: amortized O(1) appends by doubling',
      statement: String.raw`A dynamic array stores its $n$ elements in a block of capacity $\mathrm{cap}\ge n$. APPEND writes into the next free slot at cost 1; if the block is full it first allocates a block of twice the capacity and copies the $n$ elements over, at cost $n$. Starting from an empty array, any sequence of $n$ appends costs less than $3n$, so APPEND has amortized cost $O(1)$ (at most 3).

More generally, growing by any constant factor $r>1$ gives amortized cost at most $1+r/(r-1)$, while growing by a constant *amount* makes $n$ appends cost $\Theta(n^2)$.`,
      idea: String.raw`Take $\Phi = 2n-\mathrm{cap}$, which is $\ge 0$ once the array is at least half full (always true after the first append). A cheap append raises $\Phi$ by 2, so it costs $1+2=3$. A full array has $\Phi = n$, and the append that doubles it costs $n+1$ but drops $\Phi$ from $n$ to $2$, again $3$ in total. In coins: every append leaves two coins behind, and when the array is full there is exactly one coin per element to pay for its copy. In aggregate terms the copies cost $1+2+4+\cdots<2n$, a geometric sum (1.12); additive growth turns them into an arithmetic sum.`,
      caption: String.raw`Drag the number of appends $n$, or press Append. Coins sit on the elements that were appended since the last resize; when the array is full they are exactly enough to pay for the copy. Below, the bars are actual costs, the blue sawtooth is the potential and the green dots are $c_i+\Delta\Phi_i$, flat at 3. Try $\times1.5$ (flat at 4) and $+4$, where no potential can help.`,
      deps: ['algo-6.4', 'algo-1.12'],
      refs: ['CLRS 4e §16.4'],
      tags: ['amortized', 'arrays'],
      viz(v) {
        const g = v.select('grow by', [{ value: 'x2', label: '×2' }, { value: 'x15', label: '×1.5' }, { value: 'add', label: '+4' }], 'x2');
        const nS = v.slider('appends $n$', 1, 64, 32, { int: true });
        v.button('Append', () => nS.set(Math.min(64, nS.value + 1)));
        const A = v.stage({ x: [-0.6, 32.6], y: [-3.9, 1.2], axes: false, equal: true, height: 132, full: true });
        const B = v.stage({ x: [0.3, 64.7], y: [0, 70], axes: 'box', height: 230, full: true, title: 'cost of append number $i$' });
        const ROW = 32, CH = { x2: 3, x15: 4, add: 3 }, PER = { x2: 2, x15: 3 };
        const grow = (c) => (g.value === 'x2' ? Math.max(1, 2 * c) : g.value === 'x15' ? Math.max(1, Math.ceil(1.5 * c)) : c + 4);
        const phiOf = (n, cap) => (g.value === 'x2' ? 2 * n - cap : g.value === 'x15' ? 3 * n - 2 * cap : null);
        function run(N) {
          let cap = 0, n = 0, tot = 0, lastR = 0; const H = [];
          for (let i = 1; i <= N; i++) {
            let copy = 0; if (n === cap) { copy = n; cap = grow(cap); lastR = i; }
            n++; const cost = 1 + copy; tot += cost;
            H.push({ i, cost, copy, cap, n, tot, phi: phiOf(n, cap), lastR });
          }
          return H;
        }
        let H = [];
        v.render(() => {
          const N = nS.value, mult = g.value !== 'add';
          H = run(N); const last = H[N - 1], cap = last.cap, rows = Math.ceil(cap / ROW);
          // ---- the array, 32 cells per row
          const cell = (idx) => { const c = idx % ROW, r = Math.floor(idx / ROW); return [c, -r * 1.25]; };
          A.setView([-0.6, ROW + 0.6], [-Math.max(rows, 3) * 1.25 - 0.1, 1.15]);
          const coinsOn = (idx) => {
            if (!mult || idx >= N) return 0;
            const iApp = idx + 1;                     // element idx was appended by operation idx + 1
            if (iApp < last.lastR) return 0;
            if (iApp === last.lastR) return H[last.lastR - 1].phi;
            return PER[g.value];
          };
          for (let idx = 0; idx < cap; idx++) {
            const [x, y] = cell(idx), used = idx < N, isNew = idx === N - 1, cop = idx < last.copy;
            A.rect(x + 0.06, y - 0.94, x + 0.94, y - 0.06, used ? { fill: isNew ? 'gold' : 'accent', fillAlpha: isNew ? 0.35 : 0.22, color: cop ? 'orange' : isNew ? 'gold' : 'muted', width: cop || isNew ? 2.2 : 1, radius: 2 } : { color: 'faint', width: 1, dash: [3, 3], radius: 2 });
            const k = coinsOn(idx);
            for (let q = 0; q < k; q++) coin(v, A, x + 0.5, y - 0.5, k < 3 ? { r: 4.4, dx: (q - (k - 1) / 2) * 9.4 } : { r: 4.2, dx: q < 2 ? (q - 0.5) * 9 : 0, dy: q < 2 ? 3.6 : -4.6 });
          }
          let msg;
          if (last.copy) msg = mult ? `append ${N}: the array was full, so it moved to a block of ${cap} — copying ${last.copy} elements, paid by the ${last.copy} coins that were waiting` : `append ${N}: copy ${last.copy} elements into a block of ${cap} — nothing was saved to pay for it`;
          else if (last.n === cap) msg = mult ? `full: ${cap} elements and ${last.phi} coins — exactly enough to copy them all on the next append` : `full: the next append copies ${cap} elements`;
          else msg = mult ? `size ${last.n}, capacity ${cap}: each append pays ${CH[g.value]} — 1 for the write, ${PER[g.value]} saved as coins` : `size ${last.n}, capacity ${cap}`;
          A.text(msg, -0.5, 0.55, { size: 12, weight: 600, color: last.copy ? 'orange' : 'ink' });
          // ---- costs, potential and amortized costs
          const maxC = Math.max(...H.map((h) => h.cost)), X1 = Math.max(32, N) + 0.7;
          const bank = H.map((h) => 3 * h.i - h.tot);
          const lo = mult ? 0 : Math.min(0, ...bank) * 1.06, hi = Math.max(maxC, mult ? Math.max(...H.map((h) => h.phi)) : 0, 6) * 1.1;
          pv(B, [0.3, X1], [lo, hi], { r: mult ? 92 : 8 });
          const bw = Math.min(0.72, 0.72 * 40 / Math.max(N, 40));
          H.forEach((h) => B.rect(h.i - bw / 2, 0, h.i + bw / 2, h.cost, { fill: h.copy ? 'orange' : 'accent', fillAlpha: 0.6, stroke: false }));
          if (mult) {
            B.path(stepPts(H.map((h) => h.phi)), { color: 'blue', width: 2 });
            const am = H.map((h, k) => h.cost + h.phi - (k ? H[k - 1].phi : 0));
            B.hline(CH[g.value], { color: 'green', dash: [8, 5], width: 1.6 });
            B.dots(am.map((a, k) => [k + 1, a]), { r: 2.8, color: 'green' });
            B.text(`cᵢ + ΔΦᵢ ≤ ${CH[g.value]}`, X1, CH[g.value], { baseline: 'bottom', dx: 6, dy: -3, size: 12, weight: 700, color: 'green' });
          } else {
            B.path(stepPts(bank), { color: 'red', width: 2 });
            B.path(H.map((h) => [h.i, h.tot / h.i]), { color: 'gold', width: 2.4 });
            B.hline(0, { color: 'muted', width: 1 });
            B.text('bank if every append pays 3: in debt', 1, lo, { baseline: 'bottom', dy: -6, size: 11.5, weight: 700, color: 'red' });
          }
        });
        v.readout(() => {
          const N = nS.value, last = H[N - 1];
          v.legend(g.value === 'add' ? [['accent', 'actual cost', { area: true }], ['orange', 'append that copies', { area: true }], ['red', 'bank: 3i − total cost'], ['gold', 'average cost so far']]
            : [['accent', 'actual cost', { area: true }], ['orange', 'append that copies', { area: true }], ['blue', 'potential Φ'], ['green', 'amortized cost', { dot: true }], ['gold', 'coin (credit)', { dot: true }]]);
          if (g.value === 'add') return `growing by +4: ${N} appends cost **${last.tot}** in total, an average of ${r2(last.tot / N)} that keeps rising (about $n/8$): the copies $4 + 8 + 12 + \\cdots$ form an arithmetic series of size $\\Theta(n^2)$, so no constant charge pays for them ✗`;
          const am = Math.max(...H.map((h, k) => h.cost + h.phi - (k ? H[k - 1].phi : 0)));
          const f = g.value === 'x2' ? '2n - \\mathrm{cap}' : '3n - 2\\,\\mathrm{cap}';
          return `$n = ${N}$: total cost **${last.tot}** ≤ ${CH[g.value]}n = ${CH[g.value] * N} ✓ (average ${r2(last.tot / N)}) · $\\Phi = ${f} = ${last.phi}$ coins stored, $\\Phi \\ge 0$ ✓ · every append has $c_i + \\Delta\\Phi_i \\le ${am}$ ✓`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.6
    {
      num: '6.6',
      kind: 'Theorem',
      name: 'Growing and shrinking tables without thrashing',
      statement: String.raw`Let a table support INSERT and DELETE, doubling its capacity when an insertion finds it full and halving it when, after a deletion, the load factor $\alpha = n/\mathrm{cap}$ falls below $\tfrac14$; each resize copies the $n$ current elements. Then any sequence of $m$ operations starting from an empty table costs $O(m)$: insertions have amortized cost at most 3 and deletions at most 2.

Halving as soon as $\alpha<\tfrac12$ fails: around a power of two, the sequence I, D, D, I, I, D, D, I, I, … resizes on every other operation, and $m$ operations can cost $\Theta(m\,n)$.`,
      idea: String.raw`After any resize the table is exactly half full, so many cheap operations must happen before the next one: at least $\mathrm{cap}/2$ insertions before it doubles, or $\mathrm{cap}/4$ deletions before it halves. The potential $\Phi = 2n-\mathrm{cap}$ when $\alpha\ge\tfrac12$ and $\Phi = \mathrm{cap}/2-n$ when $\alpha<\tfrac12$ is $0$ right after a resize and grows to exactly the number of elements to be copied when the next resize happens. With the ½ rule the table is half full right after doubling, so a single deletion already triggers a halving, and the gap between the thresholds that makes the argument work is gone.`,
      caption: String.raw`Both tables receive the same operations: red halves as soon as it is less than half full, green waits until it is less than a quarter full. Drag $t$ to scrub through the workload (copied cells are outlined in orange). The left chart is the total cost so far against $3t$, the right one the load factor: on the thrashing workload the red table bounces between half and full and pays for a copy every other step.`,
      deps: ['algo-6.5'],
      refs: ['CLRS 4e §16.4'],
      tags: ['amortized', 'arrays'],
      viz(v) {
        const T = 120;
        const wl = v.select('workload', [{ value: 'thrash', label: 'I, D, D, I, I, D, D, …' }, { value: 'walk', label: 'random ups and downs' }, { value: 'wave', label: 'grow, shrink, grow' }], 'thrash', { onChange: () => rebuild() });
        const kS = v.slider('first fill to $2^k$', 2, 5, 4, { int: true, onChange: () => rebuild() });
        const tS = v.slider('operations so far $t$', 1, T, T, { int: true });
        const A = v.stage({ x: [-0.5, 33], y: [-1.6, 3.4], axes: false, height: 160, full: true });
        const B = v.stage({ x: [0, T], y: [0, 400], axes: 'box', height: 220, weight: 1.15, title: 'total cost of the first $t$ operations' });
        const C = v.stage({ x: [0, T], y: [0, 1.1], axes: 'box', height: 220, weight: 0.85, title: 'load factor $\\alpha = n / \\mathrm{cap}$ after operation $t$', yticks: [[0.25, '¼'], [0.5, '½'], [1, '1']] });
        const POL = [{ lim: 0.5, color: 'red', name: 'halve when α < ½' }, { lim: 0.25, color: 'green', name: 'halve when α < ¼' }];
        function workload() {
          const k = kS.value, n0 = 2 ** k, ops = Array(n0).fill('I'), r = v.rng(11 + k);
          if (wl.value === 'thrash') { const pat = ['I', 'D', 'D', 'I']; for (let i = 0; ops.length < T; i++) ops.push(pat[i % 4]); }
          else if (wl.value === 'walk') { let n = n0; while (ops.length < T) { const pr = 0.5 + 0.4 * Math.cos((ops.length - n0) / 9), ins = n <= 1 || r() < pr; ops.push(ins ? 'I' : 'D'); n += ins ? 1 : -1; } }
          else { let n = n0, up = true; while (ops.length < T) { if (up && n >= 3 * n0) up = false; if (!up && n <= 2) up = true; ops.push(up ? 'I' : 'D'); n += up ? 1 : -1; } }
          return ops.slice(0, T);
        }
        function runTable(ops, lim) {
          let cap = 0, n = 0, tot = 0, maxAm = -Infinity; const H = [];
          const phi = (n, cap) => (cap === 0 ? 0 : n >= cap / 2 ? 2 * n - cap : cap / 2 - n);
          for (const o of ops) {
            const p0 = phi(n, cap); let copy = 0, rs = 0;
            if (o === 'I') { if (n === cap) { copy = n; cap = Math.max(1, 2 * cap); rs = 1; } n++; }
            else { n--; if (cap > 1 && n < cap * lim) { cap /= 2; copy = n; rs = -1; } }
            const cost = 1 + copy; tot += cost; const am = cost + phi(n, cap) - p0; maxAm = Math.max(maxAm, am);
            H.push({ o, cost, copy, cap, n, tot, rs, am });
          }
          return { H, maxAm };
        }
        let runs = [];
        function rebuild() { const ops = workload(); runs = POL.map((p) => runTable(ops, p.lim)); }
        rebuild();
        v.render(() => {
          const t = tS.value, CW = Math.max(...runs.map((R) => Math.max(...R.H.map((h) => h.cap))));
          A.setView([-0.5, CW + 0.5], [-0.75, 3.2]);
          POL.forEach((p, k) => {
            const h = runs[k].H[t - 1], y = k === 0 ? 1.85 : -0.15;
            const op = h.o === 'I' ? 'insert' : 'delete';
            A.text(p.name, -0.4, y + 1.05, { size: 12, weight: 700, color: p.color });
            A.text(`n = ${h.n}, cap = ${h.cap}, α = ${r2(h.n / h.cap)} · last operation: ${op}` + (h.copy ? `, copied ${h.copy}` : ''), CW + 0.5, y + 1.05, { align: 'right', size: 11.5, weight: 600, color: h.copy ? 'orange' : 'muted' });
            for (let j = 0; j < h.cap; j++) {
              const used = j < h.n, cop = j < h.copy;
              A.rect(j + 0.08, y, j + 0.92, y + 0.72, used ? { fill: p.color, fillAlpha: 0.3, color: cop ? 'orange' : 'muted', width: cop ? 2.2 : 0.8 } : { color: 'faint', width: 0.8, dash: [2, 2] });
            }
            for (const [fr, lab] of [[0.25, '¼'], [0.5, '½']]) {
              const xq = h.cap * fr, on = fr === p.lim;
              A.line(xq, y - 0.05, xq, y - 0.3, { color: on ? p.color : 'faint', width: on ? 2.2 : 1.2 });
              A.text(lab, xq, y - 0.32, { align: 'center', baseline: 'top', size: 10.5, color: on ? p.color : 'faint', weight: 700 });
            }
          });
          // cumulative cost
          const top = Math.max(3 * T, ...runs.map((R) => R.H[T - 1].tot)) * 1.05;
          pv(B, [0, T + 1], [0, top], { l: 36 });
          B.fn((x) => 3 * x, { color: 'ink', dash: [7, 5], width: 1.5, domain: [0, T] });
          B.text('3t', T * 0.9, 2.7 * T, { align: 'right', baseline: 'bottom', dy: -4, dx: -4, size: 12, weight: 700, color: 'muted' });
          pv(C, [0, T + 1], [0, 1.1], { l: 22 });
          for (const q of [0.25, 0.5, 1]) C.hline(q, { color: 'faint', dash: [4, 4], width: 1 });
          POL.forEach((p, k) => {
            const H = runs[k].H, pts = [[0, 0], ...H.map((h, i) => [i + 1, h.tot])], al = [...H.map((h, i) => [i + 1, h.n / h.cap])];
            B.path(pts, { color: p.color, width: 1.4, alpha: 0.3 }); B.path(pts.slice(0, t + 1), { color: p.color, width: 2.6 });
            C.path(al, { color: p.color, width: 1.2, alpha: 0.3 }); C.path(al.slice(0, t), { color: p.color, width: k ? 2.4 : 1.8 });
            B.dot(t, H[t - 1].tot, { r: 4, color: p.color });
          });
          B.vline(t, { color: 'gold', width: 1.4 }); C.vline(t, { color: 'gold', width: 1.4 });
        });
        v.legend([['red', 'halve when α < ½'], ['green', 'halve when α < ¼'], ['muted', '3t', { dash: true }], ['orange', 'cells copied by the last operation', { area: true }]]);
        v.readout(() => {
          const t = tS.value, [a, b] = runs.map((R) => R.H[t - 1]), rsA = runs[0].H.slice(0, t).filter((h) => h.rs).length, rsB = runs[1].H.slice(0, t).filter((h) => h.rs).length;
          return `after $t = ${t}$ operations — ½ rule: cost **${a.tot}** (${r2(a.tot / t)} per operation, ${plural(rsA, 'resize')}) · ¼ rule: cost **${b.tot}** (${r2(b.tot / t)} per operation, ${plural(rsB, 'resize')}) ${b.tot <= 3 * t ? '≤' : '>'} 3t = ${3 * t} ${b.tot <= 3 * t ? '✓' : '✗'} · with $\\Phi = 2n - \\mathrm{cap}$ ($\\alpha \\ge \\frac12$) or $\\mathrm{cap}/2 - n$ ($\\alpha < \\frac12$), every ¼-rule operation has amortized cost ≤ 3 ✓ (largest ${r2(runs[1].maxAm)}), while under the ½ rule the same potential allows ${r2(runs[0].maxAm)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.7
    {
      num: '6.7',
      kind: 'Definition',
      name: 'Splay trees',
      statement: String.raw`A **splay tree** is a binary search tree with no balance information. After every access to a node $x$ (search, insertion or the node at which a search ends), $x$ is **splayed** to the root by repeating the step below until $x$ is the root; with $p$ the parent of $x$ and $g$ the parent of $p$:

- **zig** — if $p$ is the root, rotate $x$ above $p$;
- **zig-zig** — if $x$ and $p$ are both left children or both right children, first rotate $p$ above $g$, then $x$ above $p$;
- **zig-zag** — otherwise, rotate $x$ above $p$ and then above $g$.

Insertion and deletion are reduced to accesses (insert as in a BST and splay the new node; to delete, splay the node and join its two subtrees).`,
      idea: String.raw`Each step is one or two rotations (5.5), so splaying keeps the in-order sequence. The zig-zig case is what makes splay trees work: rotating the grandparent edge first means that every node on the access path roughly halves its depth, so a long path is never left behind. Plain move-to-root, which only ever rotates $x$ above its current parent, moves $x$ up just as fast but leaves the rest of the path almost as deep, and an adversary can make every access expensive.`,
      caption: String.raw`Click any node to access it and step through the splay: the accessed node is gold, its parent orange and grandparent purple, and the blue rings mark the old access path. The panel on the right compares each path node's depth before (dashed outline) and now (solid), against about half the old depth (green ticks at $\lceil d/2\rceil+2$). Turn off the zig-zig rule to compare with plain move-to-root.`,
      deps: ['algo-5.5', 'algo-5.2'],
      refs: ['Erickson notes: Scapegoat and Splay Trees'],
      credit: 'Sleator & Tarjan, 1985',
      tags: ['search trees', 'amortized'],
      viz(v) {
        const zz = v.toggle('zig-zig rule (off: plain move-to-root)', true, { onChange: () => restart() });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 350, weight: 1.75, minWidth: 380 });
        const D = v.stage({ x: [0.3, 8.7], y: [0, 9], axes: 'box', height: 350, weight: 0.75, minWidth: 220, title: 'depths on the old path, root → x' });
        const START = [50, 10, 40, 48, 42, 47, 46, 44, 60, 5, 30, 43, 45, 49, 41];
        const first = (zzOn) => splayFrames(bstFrom(START), 44, zzOn).F;
        const S = v.steps({ frames: first(true), code: SPLAY_CODE, codeTitle: 'splay', codePos: 'below', transition: 0.45, speed: 1.1, still: 'end' });
        let codeZZ = true;
        function restart() { S.reset(first(zz.value), { at: 0 }); }
        const access = (k) => {
          const R = splayFrames(S.frame.t, k, zz.value), F = S.frames.slice(0, S.i + 1).concat(R.F), at = S.i + 1;
          S.reset(F, { at }); S.play();
        };
        s.onClick((x, y) => { const c = hitT(s, S.frame.L, x, y, 18); if (c) access(c.k); });
        v.button('Access the deepest node', () => { const L = S.frame.L; let b = L.nodes[0]; for (const c of L.nodes) if (c.d > b.d) b = c; access(b.k); });
        v.button('Reset', () => restart());
        v.render(() => {
          if (zz.value !== codeZZ) { codeZZ = zz.value; S.setCode(codeZZ ? SPLAY_CODE : MTR_CODE, codeZZ ? 'splay' : 'move-to-root'); }
          const f = S.frame, path = f.path || [], onPath = new Set(path), pe = new Set();
          for (let i = 1; i < path.length; i++) pe.add(path[i - 1] + ',' + path[i]);
          drawT(s, f.L, {
            prev: S.prev && S.prev.L, tw: S.tween, rmax: 15, padT: 0.1,
            fill: (k) => (k === f.x ? 'gold' : !f.done && k === f.p ? 'orange' : !f.done && k === f.g ? 'purple' : null),
            ring: (k) => (onPath.has(k) && k !== f.x ? 'accent' : null),
            edgeColor: (a, b) => (f.showPath && pe.has(a + ',' + b) ? 'accent' : null), edgeWidth: (a, b) => (f.showPath && pe.has(a + ',' + b) ? 3.5 : null),
          });
          const n = path.length, dmax = Math.max(3, ...path.map((k) => f.d0.get(k)));
          pv(D, [0.3, Math.max(n, 4) + 0.7], [0, dmax + 0.6], { l: 22 });
          D.setTicks(path.map((k, i) => [i + 1, String(k)]), null);
          path.forEach((k, i) => {
            const d0 = f.d0.get(k), d = f.L.pos.get(k).d;
            D.rect(i + 0.62, 0, i + 1.38, d0, { color: 'muted', width: 1.2, dash: [4, 3] });
            if (d > 0) D.rect(i + 0.74, 0, i + 1.26, d, { fill: k === f.x ? 'gold' : 'accent', fillAlpha: 0.7, stroke: false });
            else D.line(i + 0.74, 0, i + 1.26, 0, { color: k === f.x ? 'gold' : 'accent', width: 4 });
          });
          path.forEach((k, i) => { const y = Math.ceil(f.d0.get(k) / 2) + 2; if (y <= dmax + 0.5) D.line(i + 0.56, y, i + 1.44, y, { color: 'green', width: 2.2, dash: [4, 3] }); });
        });
        v.legend([['gold', 'x', { dot: true }], ['orange', 'parent p', { dot: true }], ['purple', 'grandparent g', { dot: true }], ['accent', 'old access path', { dot: true }], ['muted', 'depth before', { dash: true }], ['green', '⌈old depth / 2⌉ + 2', { dash: true }]]);
        v.readout(() => {
          const f = S.frame, path = f.path || [], L = f.L;
          if (!path.length) return '';
          const mean = (g) => path.reduce((s, k) => s + g(k), 0) / path.length, b = mean((k) => f.d0.get(k)), a = mean((k) => L.pos.get(k).d);
          const worse = path.filter((k) => L.pos.get(k).d > Math.ceil(f.d0.get(k) / 2) + 2).length;
          const verdict = !f.done ? 'splaying…' : worse ? `✗ ${plural(worse, 'node')} of the old path deeper than ⌈d/2⌉ + 2, d its old depth` : 'every node of the old path now has depth ≤ ⌈d/2⌉ + 2, d its old depth ✓';
          return `access ${f.x}: depth ${f.d0.get(f.x)} → ${L.pos.get(f.x).d} after ${plural(f.rot, 'rotation')} · old path nodes: mean depth ${r2(b)} → **${r2(a)}** (×${r2(a / (b || 1))}) · ${verdict} · tree height ${L.h}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.8
    {
      num: '6.8',
      kind: 'Theorem',
      name: 'Splay trees: O(log n) amortized per access (statement)',
      statement: String.raw`In a splay tree on $n$ keys, give each node $v$ the rank $r(v)=\log_2 s(v)$, where $s(v)$ is the number of nodes in its subtree, and let $\Phi=\sum_v r(v)$. Then splaying a node $x$ in a tree with root $t$ takes amortized time (rotations $+\Delta\Phi$) at most
$$3\,\big(r(t)-r(x)\big)+1 \;\le\; 3\log_2 n+1 \qquad\text{(access lemma).}$$
Consequently any $m$ accesses, starting from any tree on $n$ nodes, perform at most $m(3\log_2 n+1)+n\log_2 n$ rotations: $O((m+n)\log n)$ in total and $O(\log n)$ amortized per access, with no balance information stored.`,
      idea: String.raw`This is the potential method (6.4) with $\Phi=\sum\log_2 s(v)$. A zig-zig or zig-zag step costs two rotations and changes only the ranks of $x$, $p$, $g$; since $\log_2 a+\log_2 b\le 2\log_2(a+b)-2$, the step's amortized cost is at most $3(r'(x)-r(x))$. The sum over a splay telescopes to $3(r(t)-r(x))$, plus 1 for a final zig. Since $0\le\Phi\le n\log_2 n$, the potential can pay back at most $n\log_2 n$. Plain move-to-root has no such bound: on a path, accessing the keys in order costs $n-1$ rotations every time.`,
      caption: String.raw`Choose an access sequence, a starting tree and $n$; the left chart counts rotations against the bound $i(3\log_2 n+1)+\Phi_0-\Phi_i$ and the cruder straight line $i(3\log_2 n+1)+n\log_2 n$. On the right, each access's actual rotations (orange) can spike, but the amortized cost (green) never passes $3\log_2 n+1$. Turn off splaying to see move-to-root cross the bound.`,
      deps: ['algo-6.7', 'algo-6.4'],
      refs: ['Erickson notes: Scapegoat and Splay Trees'],
      credit: 'Sleator & Tarjan, 1985',
      tags: ['amortized', 'search trees'],
      viz(v) {
        const seqS = v.select('accesses', [{ value: 'seq', label: '1, 2, …, n, 1, 2, …' }, { value: 'random', label: 'random' }, { value: 'hot', label: '8 hot keys' }, { value: 'rev', label: 'bit-reversal' }], 'seq');
        const shS = v.select('start', [{ value: 'path', label: 'a path' }, { value: 'bal', label: 'balanced' }], 'path');
        const nS = v.select('$n$', [{ value: 63, label: '63' }, { value: 255, label: '255' }, { value: 1023, label: '1023' }], 255);
        const zz = v.toggle('splay (off: plain move-to-root)', true);
        const A = v.stage({ x: [0, 1000], y: [0, 1000], axes: 'box', height: 290, weight: 1.15, title: 'total rotations after $i$ accesses' });
        const B = v.stage({ x: [0, 1000], y: [0, 30], axes: 'box', height: 290, weight: 1, title: 'access $i$: rotations and amortized cost' });
        let cache = null, ckey = '';
        function compute() {
          const n = nS.value, m = 4 * n, key = [seqS.value, shS.value, n, zz.value].join('|');
          if (key === ckey) return cache;
          const T = splayArr(n, shS.value), r = v.rng(5), kb = Math.round(LG(n + 1));
          const hot = Array.from({ length: 8 }, (_, h) => Math.round((h + 0.5) * n / 8));
          const keyAt = (j) => {
            if (seqS.value === 'seq') return (j % n) + 1;
            if (seqS.value === 'random') return r.int(1, n);
            if (seqS.value === 'hot') return r() < 0.9 ? hot[r.int(0, 7)] : r.int(1, n);
            const idx = (j % n) + 1; let y = 0; for (let b = 0; b < kb; b++) if (idx & (1 << b)) y |= 1 << (kb - 1 - b); return y;
          };
          const phi0 = phiArr(T); let phi = phi0, tot = 0, maxAm = -Infinity, lemmaOK = true;
          const cum = [[0, 0]], bnd = [[0, phi0 - phi0]], rots = [], ams = [];
          for (let j = 0; j < m; j++) {
            const res = splayKey(T, keyAt(j), zz.value);
            phi += res.dphi; tot += res.r;
            const am = res.r + res.dphi; maxAm = Math.max(maxAm, am); if (am > res.lemma + 1e-9) lemmaOK = false;
            cum.push([j + 1, tot]); bnd.push([j + 1, (j + 1) * (3 * LG(n) + 1) + phi0 - phi]); rots.push(res.r); ams.push(am);
          }
          ckey = key; cache = { n, m, cum, bnd, rots, ams, tot, phi0, phi, maxAm, lemmaOK };
          return cache;
        }
        v.render(() => {
          const R = compute(), { n, m } = R, lin = (i) => i * (3 * LG(n) + 1) + n * LG(n);
          const top = Math.max(R.tot, lin(m)) * 1.05;
          pv(A, [0, m], [0, top], { l: 44, r: 18 });
          A.fn(lin, { color: 'green', dash: [7, 5], width: 1.6, domain: [0, m] });
          A.path(R.bnd, { color: 'green', width: 2 });
          A.path(R.cum, { color: R.tot > R.bnd[m][1] ? 'red' : 'accent', width: 2.6 });
          A.text('i(3 log₂n + 1) + n log₂n', m, lin(m), { align: 'right', baseline: 'bottom', dy: -3, dx: -4, size: 11, weight: 700, color: 'green' });
          const lineY = 3 * LG(n) + 1, cap = lineY * 2.6;
          const low = -lineY * 0.6; pv(B, [0, m], [low, cap], { l: 40, r: 18, b: 22 });
          const w = Math.max(m / B.width, 0.6);
          R.rots.forEach((x, j) => { if (x) B.rect(j + 0.5 - w / 2, 0, j + 0.5 + w / 2, Math.min(x, cap), { fill: 'orange', fillAlpha: 0.45, stroke: false }); });
          B.dots(R.ams.map((a, j) => [j + 0.5, Math.max(a, low)]), { r: 1.5, color: 'green' });
          B.hline(0, { color: 'muted', width: 1 });
          if (Math.min(...R.ams) < low) B.text(`amortized values below ${Math.round(low)} are drawn at the floor (lowest ${Math.round(Math.min(...R.ams))})`, 0, cap, { baseline: 'top', dy: 22, dx: 6, size: 11, color: 'green', weight: 600 });
          B.hline(lineY, { color: 'green', dash: [7, 5], width: 1.8 });
          B.text(`3 log₂ n + 1 = ${r2(lineY)}`, m, lineY, { align: 'right', baseline: 'bottom', dy: -3, dx: -4, size: 11.5, weight: 700, color: 'green' });
          if (Math.max(...R.rots) > cap) B.text(`orange bars clipped at ${Math.round(cap)} (largest: ${Math.max(...R.rots)})`, 0, cap, { baseline: 'top', dy: 4, dx: 6, size: 11, color: 'orange', weight: 600 });
        });
        v.legend([['accent', 'total rotations'], ['green', 'bound with $\\Phi_0 - \\Phi_i$'], ['green', 'crude bound', { dash: true }], ['orange', 'rotations in one access', { area: true }], ['green', 'amortized (rotations + ΔΦ)', { dot: true }]]);
        v.readout(() => {
          const R = compute(), { n, m } = R, ok = R.tot <= R.bnd[m][1] + 1e-9;
          const head = `$n = ${n}$, $m = ${m}$ accesses: **${R.tot}** rotations, ${r2(R.tot / m)} per access · bound $m(3\\log_2 n + 1) + \\Phi_0 - \\Phi_m = ${Math.round(R.bnd[m][1])}$ ${ok ? '✓' : '✗'}`;
          if (!zz.value) return `${head} · move-to-root: largest amortized cost ${r2(R.maxAm)} vs $3\\log_2 n + 1 = ${r2(3 * LG(n) + 1)}$ ${R.maxAm <= 3 * LG(n) + 1 ? '' : '✗'} — without the zig-zig rule the access lemma fails`;
          return `${head} · every access: rotations $+ \\Delta\\Phi \\le 3(r(t) - r(x)) + 1$ ${R.lemmaOK ? '✓' : '✗'} (largest ${r2(R.maxAm)} ≤ ${r2(3 * LG(n) + 1)})${seqS.value === 'seq' ? ' · sequential access is cheap: O(1) per access in the long run' : ''}`;
        });
      },
    },
  ],
};
