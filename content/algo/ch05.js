// Algorithms — Chapter 5: Search trees and hashing (items 5.1–5.10; 5.11–5.20 in ch05-b.js)

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const LG = Math.log2;
const fnv = (f, ...a) => (typeof f === 'function' ? f(...a) : f);
const plural = (n, w, ws) => `${n} ${n === 1 ? w : ws || w + 's'}`;

// ---------- binary trees: nodes {k, l, r, …}. A layout puts a node at x = its in-order rank and y = −depth,
// so the left-to-right order of the picture *is* the in-order sequence and a rotation only moves nodes up or down.
const nd = (k, o) => ({ k, l: null, r: null, ...o });
const cloneT = (t) => (t ? { ...t, l: cloneT(t.l), r: cloneT(t.r) } : null);
const inord = (t, out = []) => { if (t) { inord(t.l, out); out.push(t); inord(t.r, out); } return out; };
const hgt = (t) => (t ? 1 + Math.max(hgt(t.l), hgt(t.r)) : 0);          // nodes on a longest root-to-leaf path
const sizeT = (t) => (t ? 1 + sizeT(t.l) + sizeT(t.r) : 0);
const keysOf = (t) => inord(t).map((u) => u.k);
function bstAdd(t, k, o) {
  const z = nd(k, o); if (!t) return z;
  for (let u = t; ;) { if (k === u.k) return t; const s = k < u.k ? 'l' : 'r'; if (!u[s]) { u[s] = z; return t; } u = u[s]; }
}
const bstFrom = (keys, o) => keys.reduce((t, k) => bstAdd(t, k, o), null);
function layT(t) {
  const pos = new Map(), nodes = [], edges = []; let i = 0, h = 0;
  (function go(u, d, p) {
    if (!u) return;
    go(u.l, d + 1, u);
    const c = { k: u.k, x: i++, d, n: u, p: p ? p.k : null };
    pos.set(u.k, c); nodes.push(c); if (d > h) h = d;
    go(u.r, d + 1, u);
  })(t, 0, null);
  for (const c of nodes) if (c.p != null) edges.push([c.p, c.k]);
  return { pos, nodes, edges, n: nodes.length, h };
}
const snapT = (t) => layT(cloneT(t));
function treeView(L, o) {
  const n = Math.max(L.n, 1), h = L.h + (o.nil ? 0.8 : 0), e = o.nil ? 0.32 : 0;
  return [[-0.62 - e - (o.padL || 0), n - 0.38 + e + (o.padR || 0)], [-h - 0.58 - (o.padB || 0), 0.58 + (o.padT || 0)]];
}
const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [0.75, -0.75], nw: [-0.75, -0.75], se: [0.75, 0.75], sw: [-0.75, 0.75] };
/**
 * Draw a tree layout on stage s, gliding from o.prev while o.tw < 1. Options (functions get (key, cell)):
 * fill (solid disc), color (outline + tint), ring, label, labelColor, note → [text, colour, pos], alpha;
 * edgeColor / edgeWidth (parentKey, childKey); nil: draw NIL leaves (returned as {x, y, p, side});
 * padL/padR/padT/padB (data units around the tree), rmax, view: false (keep the stage's window).
 */
function drawT(s, L, o = {}) {
  const P = o.prev && o.tw != null && o.tw < 1 && o.prev !== L ? o.prev : null, tw = P ? o.tw : 1;
  let [vx, vy] = treeView(L, o);
  if (P) { const [px, py] = treeView(P, o); vx = [lerp(px[0], vx[0], tw), lerp(px[1], vx[1], tw)]; vy = [lerp(py[0], vy[0], tw), lerp(py[1], vy[1], tw)]; }
  if (o.view !== false) s.setView(vx, vy);
  const r = o.r ?? clamp(Math.min(s.sx * 0.4, s.sy * 0.34), 3.5, o.rmax ?? 15);
  const at = (k) => {
    const c = L.pos.get(k), q = P && P.pos.get(k);
    if (!c) return q ? [q.x, -q.d] : null;
    return q ? [lerp(q.x, c.x, tw), lerp(-q.d, -c.d, tw)] : [c.x, -c.d];
  };
  for (const [a, b] of L.edges) {
    const A = at(a), B = at(b);
    s.line(A[0], A[1], B[0], B[1], { color: fnv(o.edgeColor, a, b) || 'muted', width: fnv(o.edgeWidth, a, b) || 1.7, alpha: fnv(o.edgeAlpha, a, b) ?? 0.85 });
  }
  const nils = [];
  if (o.nil) {
    const hx = Math.max(2.6, r * 0.34) / s.sx, hy = Math.max(2.6, r * 0.34) / s.sy;
    for (const c of L.nodes) {
      const [x, y] = at(c.k);
      for (const [ch, dx, side] of [[c.n.l, -0.5, 'l'], [c.n.r, 0.5, 'r']]) if (!ch) {
        const X = x + dx, Y = y - 0.8; nils.push({ x: X, y: Y, p: c.k, side });
        s.line(x, y, X, Y, { color: 'faint', width: 1 });
        s.rect(X - hx, Y - hy, X + hx, Y + hy, { fill: fnv(o.nilColor, c.k, side) || 'ink', fillAlpha: 1, stroke: false });
      }
    }
  }
  if (P) for (const q of P.nodes) if (!L.pos.has(q.k) && tw < 0.95) s.dot(q.x, -q.d, { r, color: 'red', alpha: 0.55 * (1 - tw) });
  for (const c of L.nodes) {
    const [x, y] = at(c.k), fill = fnv(o.fill, c.k, c), col = fnv(o.color, c.k, c), ring = fnv(o.ring, c.k, c), al = fnv(o.alpha, c.k, c) ?? 1;
    if (ring) s.dot(x, y, { r: r + 4.5, hollow: true, color: ring, width: 2.6 });
    if (fill) s.dot(x, y, { r, color: fill, alpha: al });
    else { s.dot(x, y, { r, hollow: true, color: col || 'muted', width: col ? 2.4 : 1.6, alpha: al }); if (col) s.dot(x, y, { r: r - 1.2, color: col, alpha: 0.15 * al, ring: false }); }
    const lab = o.label ? o.label(c.k, c) : String(c.k);
    if (lab != null && lab !== '' && r >= 6.5) s.text(lab, x, y, { align: 'center', size: clamp(r * 0.88, 8, 13), weight: 700, color: fnv(o.labelColor, c.k, c) || (fill ? 'panel' : 'ink'), alpha: al, halo: false });
    const note = o.note && o.note(c.k, c);
    if (note) {
      const [txt, ncol, pos = 'ne'] = note, D = DIRS[pos];
      s.textPx(String(txt), s.X(x) + D[0] * (r + 3), s.Y(y) + D[1] * (r + 3), { align: D[0] > 0.1 ? 'left' : D[0] < -0.1 ? 'right' : 'center', baseline: D[1] > 0.1 ? 'top' : D[1] < -0.1 ? 'bottom' : 'middle', size: 11, weight: 700, color: ncol || 'muted' });
    }
  }
  return { r, at, nils };
}
/** Nearest node of layout L to the data point (x, y), within rad pixels. */
function hitT(s, L, x, y, rad = 16) {
  let best = null, bd = rad; const X = s.X(x), Y = s.Y(y);
  for (const c of L.nodes) { const d = Math.hypot(s.X(c.x) - X, s.Y(-c.d) - Y); if (d < bd) { bd = d; best = c; } }
  return best;
}
/** Nearest edge [parentKey, childKey] of layout L within rad pixels of (x, y). */
function hitEdge(s, L, x, y, rad = 8) {
  let best = null, bd = rad; const X = s.X(x), Y = s.Y(y);
  for (const [a, b] of L.edges) {
    const A = L.pos.get(a), B = L.pos.get(b), ax = s.X(A.x), ay = s.Y(-A.d), bx = s.X(B.x), by = s.Y(-B.d);
    const t = clamp(((X - ax) * (bx - ax) + (Y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1), 0, 1);
    const d = Math.hypot(ax + t * (bx - ax) - X, ay + t * (by - ay) - Y);
    if (d < bd) { bd = d; best = [a, b]; }
  }
  return best;
}

// ---------- 5.3: BST search / insert / delete as frames
const BST_CODE = {
  search: ['Tree-Search(x, k):', '  while x ≠ nil and k ≠ x.key', '    if k < x.key:  x ← x.left', '    else:  x ← x.right', '  return x'],
  insert: ['Tree-Insert(T, k):', '  y ← nil;  x ← T.root', '  while x ≠ nil', '    y ← x', '    if k < x.key:  x ← x.left  else:  x ← x.right', '  z ← new node with key k;  z.p ← y', '  if y = nil:  T.root ← z', '  elif k < y.key:  y.left ← z  else:  y.right ← z'],
  delete: ['Tree-Delete(T, k):', '  z ← Tree-Search(T.root, k)', '  if z.left = nil:  Transplant(T, z, z.right)', '  elif z.right = nil:  Transplant(T, z, z.left)', '  else  y ← Tree-Minimum(z.right)      ▷ successor', '    if y ≠ z.right:', '      Transplant(T, y, y.right);  y.right ← z.right', '    Transplant(T, z, y);  y.left ← z.left'],
};
function bstDelete(t, k) {
  const root = cloneT(t); let p = null, z = root;
  while (z && z.k !== k) { p = z; z = k < z.k ? z.l : z.r; }
  if (!z) return { root, found: false };
  const put = (par, old, nw) => { if (!par) return nw; if (par.l === old) par.l = nw; else par.r = nw; return root; };
  if (!z.l) return { root: put(p, z, z.r), found: true, kind: 'right' };
  if (!z.r) return { root: put(p, z, z.l), found: true, kind: 'left' };
  let yp = z, y = z.r; const sp = [y.k];
  while (y.l) { yp = y; y = y.l; sp.push(y.k); }
  const yr = keysOf(y.r), direct = yp === z;
  if (!direct) { yp.l = y.r; y.r = z.r; }
  y.l = z.l;
  return { root: put(p, z, y), found: true, kind: 'two', y: y.k, sp, yr, direct };
}
function bstOpFrames(t, op, k) {
  const L0 = snapT(t), F = [], path = [];
  const fr = (o) => F.push({ L: L0, path: path.slice(), op, k, ...o });
  const lines = { search: [3, 4, 5], insert: [5, 5, 3], delete: [2, 2, 2] }[op];
  fr({ line: op === 'insert' ? 2 : op === 'search' ? 2 : 2, note: op === 'search' ? `Search for ${k}, starting at the root.` : op === 'insert' ? `Insert ${k}: walk down from the root as in a search.` : `Delete ${k}: first find its node $z$.` });
  let u = t, par = null;
  while (u) {
    path.push(u.k);
    if (k === u.k) break;
    const left = k < u.k;
    fr({ cur: u.k, line: left ? lines[0] : lines[1], note: `${k} ${left ? '<' : '>'} ${u.k}: go ${left ? 'left' : 'right'}.` });
    par = u; u = left ? u.l : u.r;
  }
  const nilAt = !u && par ? [par.k, k < par.k ? 'l' : 'r'] : null;
  if (op === 'search') {
    if (u) fr({ cur: u.k, found: true, line: 5, note: `${k} = ${u.k}: **found** after ${plural(path.length, 'comparison')}.` });
    else fr({ nilAt, line: 5, note: `Fell off the tree at a nil pointer: ${k} is **not** in the set (${plural(path.length, 'comparison')}).` });
    return { F, root: t };
  }
  if (op === 'insert') {
    if (u) { fr({ cur: u.k, found: true, line: 3, note: `${k} is already in the tree; a set stores each key once, so nothing changes.` }); return { F, root: t }; }
    fr({ nilAt, line: 6, note: `x is nil after ${plural(path.length, 'comparison')}: the new key hangs here, as a leaf.` });
    const root = bstAdd(cloneT(t), k);
    fr({ L: snapT(root), newk: k, line: par ? 8 : 7, note: par ? `Attach ${k} as the ${k < par.k ? 'left' : 'right'} child of ${par.k}. Nothing else moves.` : `The tree was empty: ${k} becomes the root.` });
    return { F, root };
  }
  if (!u) { fr({ nilAt, line: 2, note: `${k} is not in the tree; nothing to delete.` }); return { F, root: t }; }
  const R = bstDelete(t, k), L1 = snapT(R.root);
  fr({ cur: k, line: 2, note: `Found $z$ = ${k} after ${plural(path.length, 'comparison')}.` });
  if (R.kind === 'right') fr({ L: L1, gone: k, line: 3, note: `$z$ has no left child: its right subtree${t && L0.pos.get(k).n.r ? '' : ' (empty)'} moves up into its place.` });
  else if (R.kind === 'left') fr({ L: L1, gone: k, line: 4, note: `$z$ has no right child: its left subtree moves up into its place.` });
  else {
    fr({ cur: k, sp: R.sp, succ: R.y, yr: R.yr, line: 5, note: `Two children: the successor $y$ = ${R.y} is the leftmost node of the right subtree (orange path). It has no left child.` });
    fr({ L: L1, gone: k, moved: R.y, line: R.direct ? 8 : [6, 7, 8], note: R.direct ? `$y$ = ${R.y} is $z$'s right child: it moves up into $z$'s place and adopts $z$'s left subtree.` : `$y$'s right subtree${R.yr.length ? ` (${R.yr.join(', ')})` : ''} takes $y$'s place; then $y$ = ${R.y} replaces $z$, adopting both of $z$'s subtrees. In-order is preserved.` });
  }
  return { F, root: R.root };
}

// ---------- 5.4: depths of every key of a BST built by inserting a permutation of 0..n−1, in O(n):
// when x is inserted its parent is the later-inserted of its current predecessor and successor.
function bstDepths(perm) {
  const n = perm.length, L = new Int32Array(n), R = new Int32Array(n), pr = new Int32Array(n), sc = new Int32Array(n), dep = new Int32Array(n);
  for (let i = 0; i < n; i++) { L[i] = i - 1; R[i] = i + 1 < n ? i + 1 : -1; }
  for (let i = n - 1; i >= 0; i--) { const x = perm[i]; pr[x] = L[x]; sc[x] = R[x]; if (L[x] >= 0) R[L[x]] = R[x]; if (R[x] >= 0) L[R[x]] = L[x]; }
  for (let i = 0; i < n; i++) { const x = perm[i]; dep[x] = Math.max(pr[x] >= 0 ? dep[pr[x]] : -1, sc[x] >= 0 ? dep[sc[x]] : -1) + 1; }
  return dep;
}
function orderPerm(kind, n, r) {
  const a = Array.from({ length: n }, (_, i) => i);
  if (kind === 'random') { for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  if (kind === 'sorted') return a;
  if (kind === 'zigzag') { const out = []; let lo = 0, hi = n - 1; while (lo <= hi) { out.push(lo++); if (lo <= hi) out.push(hi--); } return out; }
  const out = []; const q = [[0, n - 1]];            // medians first (breadth-first): a perfectly balanced tree
  while (q.length) { const [lo, hi] = q.shift(); if (lo > hi) continue; const m = (lo + hi) >> 1; out.push(m); q.push([lo, m - 1], [m + 1, hi]); }
  return out;
}
const harm = (n) => { let h = 0; for (let k = 1; k <= n; k++) h += 1 / k; return h; };

// ---------- 5.5: rotate a child above its parent
function rotateUp(t, ck) {
  const root = cloneT(t); let gp = null, p = null, c = root;
  while (c && c.k !== ck) { gp = p; p = c; c = ck < c.k ? c.l : c.r; }
  if (!c || !p) return null;
  let info;
  if (p.l === c) { info = { dir: 'right', top: p.k, low: c.k, A: keysOf(c.l), B: keysOf(c.r), C: keysOf(p.r) }; p.l = c.r; c.r = p; }
  else { info = { dir: 'left', top: p.k, low: c.k, A: keysOf(p.l), B: keysOf(c.l), C: keysOf(c.r) }; p.r = c.l; c.l = p; }
  let nr = root; if (!gp) nr = c; else if (gp.l === p) gp.l = c; else gp.r = c;
  return { root: nr, info };
}
const ROT_CODE = {
  right: ['Right-Rotate(T, y):        ▷ x = y.left', '  x ← y.left', '  y.left ← x.right          ▷ subtree B changes parent', '  x.p ← y.p;  put x where y was (or T.root ← x)', '  x.right ← y;  y.p ← x', '  ▷ three child links change: O(1) time'],
  left: ['Left-Rotate(T, x):         ▷ y = x.right', '  y ← x.right', '  x.right ← y.left          ▷ subtree B changes parent', '  y.p ← x.p;  put y where x was (or T.root ← y)', '  y.left ← x;  x.p ← y', '  ▷ three child links change: O(1) time'],
};

// ---------- 5.6–5.8: red–black trees (nodes carry c: 'R' | 'B')
/** CLRS black height of every node (NIL counts as a black leaf, the node itself does not), or NaN where the two sides disagree. */
function rbCheck(t) {
  const bh = new Map(), bad = new Set(), redred = new Set();
  (function go(u) {
    if (!u) return 0;
    const a = go(u.l), b = go(u.r), ca = a + (!u.l || u.l.c === 'B' ? 1 : 0), cb = b + (!u.r || u.r.c === 'B' ? 1 : 0);
    if (u.c === 'R') for (const ch of [u.l, u.r]) if (ch && ch.c === 'R') redred.add(ch.k);
    if (!(ca === cb) || isNaN(ca)) { bad.add(u.k); bh.set(u.k, NaN); return NaN; }
    bh.set(u.k, ca); return ca;
  })(t);
  return { bh, bad, redred, rootRed: !!t && t.c === 'R' };
}
/** Feasible (black height, colour) pairs of every node of a tree shape, and one valid colouring if there is any. */
function rbColourings(t) {
  const F = new Map(); // node → Map("b|c" → true)
  const opts = (ch) => { if (!ch) return [[1, 'B']]; const out = []; for (const key of F.get(ch).keys()) { const [b, c] = key.split('|'); out.push([+b + (c === 'B' ? 1 : 0), c]); } return out; };
  (function go(u) {
    if (!u) return; go(u.l); go(u.r);
    const m = new Map(), L = opts(u.l), R = opts(u.r);
    for (const c of ['B', 'R']) for (const [x, cl] of L) for (const [y, cr] of R) if (x === y && (c === 'B' || (cl === 'B' && cr === 'B'))) m.set(x + '|' + c, true);
    F.set(u, m);
  })(t);
  if (!t) return { ok: true, col: new Map(), bhs: [] };
  const bhs = [...F.get(t).keys()].filter((s) => s.endsWith('|B')).map((s) => +s.split('|')[0]).sort((a, b) => b - a);
  if (!bhs.length) return { ok: false, bhs };
  const col = new Map();
  (function put(u, b, c) {
    if (!u) return; col.set(u.k, c);
    for (const ch of [u.l, u.r]) {
      if (!ch) continue;
      const m = F.get(ch);
      if (m.has(b - 1 + '|B')) put(ch, b - 1, 'B'); else put(ch, b, 'R');
    }
  })(t, bhs[0], 'B');
  return { ok: true, col, bhs };
}
/** Tallest legal red–black trees: best[n] = max number of internal nodes on a root–NIL path, with a witness tree. */
function rbTallest(NMAX) {
  const BM = 11, NEG = -1e9, T = [], CH = [];
  // T[n][b][c] (c: 0 black, 1 red); CB(m, x, pc) = best child of m nodes contributing x to a parent of colour pc
  const CB = (m, x, pc) => { if (m === 0) return x === 1 ? 0 : NEG; let best = x - 1 >= 1 ? T[m][x - 1][0] : NEG; if (pc === 0) best = Math.max(best, T[m][x][1]); return best; };
  for (let n = 0; n <= NMAX; n++) {
    T.push([]); CH.push([]);
    for (let b = 0; b <= BM; b++) {
      T[n].push([NEG, NEG]); CH[n].push([null, null]);
      if (n === 0) continue;
      for (const c of [0, 1]) {
        let best = NEG, arg = null;
        for (let nl = 0; nl < n; nl++) {
          const a = CB(nl, b, c), bb = CB(n - 1 - nl, b, c); if (a < 0 || bb < 0) continue;
          const h = 1 + Math.max(a, bb); if (h > best) { best = h; arg = nl; }
        }
        T[n][b][c] = best; CH[n][b][c] = arg;
      }
    }
  }
  const best = [0], bOf = [0];
  for (let n = 1; n <= NMAX; n++) { let h = NEG, bb = 0; for (let b = 1; b <= BM; b++) if (T[n][b][0] > h) { h = T[n][b][0]; bb = b; } best.push(h); bOf.push(bb); }
  let key = 0;
  const build = (n, b, c) => {
    if (n === 0) return null;
    const nl = CH[n][b][c], kid = (m) => {
      if (m === 0) return null;
      const blk = b - 1 >= 1 ? T[m][b - 1][0] : NEG, red = c === 0 ? T[m][b][1] : NEG;
      return blk >= red ? build(m, b - 1, 0) : build(m, b, 1);
    };
    const l = kid(nl), u = { k: 0, c: c ? 'R' : 'B', l, r: null }; u.k = ++key; u.r = kid(n - 1 - nl); return u;
  };
  const tree = (n) => { key = 0; return n ? build(n, bOf[n], 0) : null; };
  return { best, tree };
}
const RB_CODE = [
  'RB-Insert(T, k):  BST-insert z;  z.color ← RED',
  'while z.p.color = RED              ▷ the only violation',
  '  y ← uncle of z  (sibling of z.p)',
  '  if y.color = RED:                ▷ case 1: recolour',
  '    z.p.color, y.color ← BLACK;  z.p.p.color ← RED',
  '    z ← z.p.p                      ▷ violation climbs 2 levels',
  '  else:',
  '    if z is an inner grandchild:   ▷ case 2: triangle',
  '      z ← z.p;  rotate at z, outward',
  '    z.p.color ← BLACK;  z.p.p.color ← RED   ▷ case 3: line',
  '    rotate at z.p.p;  the loop ends',
  'T.root.color ← BLACK',
];
const rbClone = (t, p = null) => { if (!t) return null; const u = { k: t.k, c: t.c, l: null, r: null, p }; u.l = rbClone(t.l, u); u.r = rbClone(t.r, u); return u; };
const rbPlain = (u) => (u ? { k: u.k, c: u.c, l: rbPlain(u.l), r: rbPlain(u.r) } : null);
function rbInsertFrames(t0, k) {
  let root = rbClone(t0); const F = [], stat = { rot: 0, rec: 0, cases: [] };
  const snap = (o) => F.push({ L: layT(rbPlain(root)), rot: stat.rot, cases: stat.cases.slice(), k, ...o });
  const rotate = (x, dir) => {
    const y = dir === 'left' ? x.r : x.l, inner = dir === 'left' ? 'l' : 'r', outer = dir === 'left' ? 'r' : 'l';
    x[outer] = y[inner]; if (y[inner]) y[inner].p = x; y.p = x.p;
    if (!x.p) root = y; else if (x === x.p.l) x.p.l = y; else x.p.r = y;
    y[inner] = x; x.p = y; stat.rot++;
  };
  let y = null, x = root; const path = [];
  while (x) { path.push(x.k); if (k === x.k) { snap({ path, cur: k, line: 1, note: `${k} is already in the tree.` }); return { F, root: t0 }; } y = x; x = k < x.k ? x.l : x.r; }
  const z0 = { k, c: 'R', l: null, r: null, p: y };
  if (!y) root = z0; else if (k < y.k) y.l = z0; else y.r = z0;
  let z = z0;
  snap({ path, z: k, line: 1, note: `Insert ${k} as in a BST (${plural(path.length, 'comparison')}) and colour it **red**: black heights are untouched, but ${y && y.c === 'R' ? `its parent ${y.k} is red too — a red–red violation` : y ? `its parent ${y.k} is black, so the tree is already valid` : 'it is the root, which must be black'}.` });
  while (z.p && z.p.c === 'R') {
    const p = z.p, g = p.p, left = p === g.l, u = left ? g.r : g.l;
    if (u && u.c === 'R') {
      p.c = 'B'; u.c = 'B'; g.c = 'R'; stat.rec += 3; stat.cases.push(1); z = g;
      snap({ z: g.k, line: [4, 5, 6], case: 1, note: `**Case 1** — the uncle ${u.k} is red: recolour parent and uncle black and the grandparent ${g.k} red. Black heights are unchanged; the possible violation moves up to ${g.k}.` });
      continue;
    }
    if (z === (left ? p.r : p.l)) {
      stat.cases.push(2); z = p; rotate(z, left ? 'left' : 'right');
      snap({ z: z.k, line: [8, 9], case: 2, note: `**Case 2** — uncle ${u ? u.k : 'nil'} is black and ${z.p.k}, ${z.k} form a triangle: rotate at ${z.k} to straighten it into a line (rotation ${stat.rot}).` });
    }
    stat.cases.push(3); const gp = z.p.p; z.p.c = 'B'; gp.c = 'R'; stat.rec += 2; rotate(gp, left ? 'right' : 'left');
    snap({ z: z.k, line: [10, 11], case: 3, note: `**Case 3** — a black-uncle line: colour ${z.p.k} black and ${gp.k} red, then rotate at ${gp.k}. The violation is gone (rotation ${stat.rot}).` });
  }
  if (root.c === 'R') { root.c = 'B'; stat.rec++; snap({ line: 12, note: `The root ${root.k} is red: colour it black, which adds one to every black height.` }); }
  const cs = stat.cases.length ? stat.cases.join(' → ') : 'none';
  snap({ line: 12, done: true, note: `Done: fix-up cases ${cs}, **${plural(stat.rot, 'rotation')}** (at most 2), ${stat.rec} recolourings.` });
  return { F, root: rbPlain(root) };
}
function rbBuild(keys) { let t = null; for (const k of keys) t = rbInsertFrames(t, k).root; return t; }

// ---------- 5.9: AVL trees (nodes carry h = number of levels of their subtree)
const Hh = (u) => (u ? u.h : 0);
const fixH = (u) => { u.h = 1 + Math.max(Hh(u.l), Hh(u.r)); };
function rotUpIn(root, ck) {
  let gp = null, p = null, c = root;
  while (c.k !== ck) { gp = p; p = c; c = ck < c.k ? c.l : c.r; }
  if (p.l === c) { p.l = c.r; c.r = p; } else { p.r = c.l; c.l = p; }
  fixH(p); fixH(c);
  if (!gp) return c; if (gp.l === p) gp.l = c; else gp.r = c; return root;
}
const AVL_CODE = [
  'AVL-Insert(T, k):  insert k as a leaf (BST insertion)',
  'for each ancestor a of the leaf, bottom-up:',
  '  update a.h;  bf(a) ← h(a.left) − h(a.right)',
  '  if bf(a) = ±2:                    ▷ a is out of balance',
  '    outer grandchild:  single rotation at a     ▷ LL / RR',
  '    inner grandchild:  double rotation          ▷ LR / RL',
  '    stop     ▷ the subtree has its old height again',
];
function avlInsertFrames(t0, k, on) {
  let root = cloneT(t0); const F = [], st = { single: 0, double: 0 };
  const snap = (o) => F.push({ L: snapT(root), k, ...o });
  const anc = []; let u = root;
  while (u) { anc.push(u); if (k === u.k) { snap({ cur: k, line: 1, note: `${k} is already in the tree.` }); return { F, root: t0, st }; } u = k < u.k ? u.l : u.r; }
  const z = nd(k, { h: 1 });
  if (!anc.length) root = z; else { const p = anc[anc.length - 1]; if (k < p.k) p.l = z; else p.r = z; }
  for (let i = anc.length - 1; i >= 0; i--) fixH(anc[i]);
  const badA = on ? anc.slice().reverse().find((a) => Math.abs(Hh(a.l) - Hh(a.r)) > 1) : null;
  const allBad = anc.filter((a) => Math.abs(Hh(a.l) - Hh(a.r)) > 1).map((a) => a.k);
  snap({ newk: k, path: anc.map((a) => a.k), line: [1, 2, 3], badSet: allBad, note: `Insert ${k} as a leaf and update the heights on the way back up. ` + (badA ? `The lowest ancestor out of balance is ${badA.k}.` : allBad.length ? `Rebalancing is off: ${allBad.length} ancestor${allBad.length > 1 ? 's are' : ' is'} out of balance and stay${allBad.length > 1 ? '' : 's'} so.` : 'Every balance factor is still −1, 0 or +1.') });
  if (badA) {
    const idx = anc.indexOf(badA), refix = () => { for (let j = idx - 1; j >= 0; j--) fixH(anc[j]); };
    const bf = Hh(badA.l) - Hh(badA.r), lh = bf > 0, ch = lh ? badA.l : badA.r, bc = Hh(ch.l) - Hh(ch.r);
    snap({ bad: badA.k, line: 4, note: `${badA.k} has balance factor ${bf > 0 ? '+' : ''}${bf}: its ${lh ? 'left' : 'right'} subtree is two levels taller. The new key went into the ${(lh ? bc < 0 : bc > 0) ? 'inner' : 'outer'} grandchild subtree.` });
    if (lh ? bc < 0 : bc > 0) {
      const g = lh ? ch.r : ch.l;
      root = rotUpIn(root, g.k); snap({ rotated: g.k, line: 6, note: `Double rotation, part 1: rotate ${g.k} above ${ch.k}.` });
      root = rotUpIn(root, g.k); st.double++; refix(); snap({ rotated: g.k, line: [6, 7], note: `Part 2: rotate ${g.k} above ${badA.k}. Now ${g.k} roots the subtree with balance 0, at its height before the insertion.` });
    } else { root = rotUpIn(root, ch.k); st.single++; refix(); snap({ rotated: ch.k, line: [5, 7], note: `Single rotation: ${ch.k} moves above ${badA.k}; the subtree is back to its height before the insertion.` }); }
  }
  return { F, root, st };
}
function heightsOf(t) { const m = new Map(); (function go(u) { if (!u) return 0; const h = 1 + Math.max(go(u.l), go(u.r)); m.set(u.k, h); return h; })(t); return m; }
function fibTree(h) { let key = 0; const go = (hh) => { if (hh <= 0) return null; const l = go(hh - 1), u = nd(0, { h: hh }); u.k = ++key; u.l = l; u.r = go(hh - 2); fixH(u); return u; }; return go(h); }
const bfsKeys = (t) => { const out = [], q = t ? [t] : []; while (q.length) { const u = q.shift(); out.push(u.k); if (u.l) q.push(u.l); if (u.r) q.push(u.r); } return out; };

// ---------- 5.10: B-trees of minimum degree t (CLRS: split full nodes on the way down)
const btClone = (u) => (u ? { keys: u.keys.slice(), kids: u.kids.map(btClone), hl: u.hl } : null);
function btSplit(x, i, t) {
  const y = x.kids[i], z = { keys: y.keys.slice(t), kids: y.kids.slice(t) }, m = y.keys[t - 1];
  y.keys = y.keys.slice(0, t - 1); y.kids = y.kids.slice(0, t);
  x.keys.splice(i, 0, m); x.kids.splice(i + 1, 0, z); return { m, y, z };
}
function btHas(u, k) { while (u) { let i = 0; while (i < u.keys.length && k > u.keys[i]) i++; if (u.keys[i] === k) return true; u = u.kids[i]; } return false; }
/** Insert k (frames when F is an array). Returns the new root. */
function btInsert(root, k, t, F) {
  const full = (u) => u.keys.length === 2 * t - 1;
  const snap = F ? (o, marks = []) => { for (const [u, h] of marks) u.hl = h; F.push({ root: btClone(root), k, ...o }); for (const [u] of marks) u.hl = null; } : () => {};
  if (!root) { root = { keys: [k], kids: [] }; snap({ line: 1, note: `The tree was empty: ${k} becomes the root, a leaf.` }, [[root, 'new']]); return root; }
  if (btHas(root, k)) { snap({ line: 1, note: `${k} is already in the tree.` }); return root; }
  if (full(root)) {
    const s = { keys: [], kids: [root] }; root = s; const { m, y, z } = btSplit(s, 0, t);
    snap({ line: [2, 3], mk: m, note: `The root is full (${2 * t - 1} keys): split it around its median ${m}, which becomes a new root. This is the **only** way the height grows, and it lifts every leaf at once.` }, [[s, 'up'], [y, 'split'], [z, 'split']]);
  }
  let x = root;
  for (;;) {
    let i = 0; while (i < x.keys.length && k > x.keys[i]) i++;
    if (!x.kids.length) { x.keys.splice(i, 0, k); snap({ line: 7, newk: k, note: `${k} goes into this leaf, which had room because full nodes were split on the way down.` }, [[x, 'cur']]); return root; }
    if (full(x.kids[i])) {
      const { m, y, z } = btSplit(x, i, t);
      snap({ line: [5, 6], mk: m, note: `The child on the way down is full: split it, moving its median ${m} up into the parent (which has room).` }, [[x, 'up'], [y, 'split'], [z, 'split']]);
      if (k > x.keys[i]) i++;
    } else snap({ line: 4, note: `Visit a node with ${plural(x.keys.length, 'key')}: ${k} belongs to child ${i + 1} of ${x.kids.length}.` }, [[x, 'cur']]);
    x = x.kids[i];
  }
}
function btStats(root) {
  let h = -1, leafD = new Set(), n = 0, minK = Infinity, maxK = 0;
  (function go(u, d, isRoot) { n += u.keys.length; if (!isRoot) { minK = Math.min(minK, u.keys.length); } maxK = Math.max(maxK, u.keys.length); if (!u.kids.length) { leafD.add(d); h = Math.max(h, d); } u.kids.forEach((c) => go(c, d + 1, false)); })(root, 0, true);
  return { h, leafD, n, minK, maxK };
}
const BT_CODE = [
  'B-Tree-Insert(T, k):',
  '  if the root is full:',
  '    split it; its median becomes the new root   ▷ height + 1',
  '  x ← root;  while x is not a leaf:',
  '    if the child c that k belongs in is full:',
  '      split c, moving its median up into x',
  '  insert k into the leaf x, keeping keys sorted',
];

export default {
  collection: 'algo',
  chapter: 5,
  title: 'Search trees and hashing',
  summary: String.raw`Two ways to maintain a dynamic set. Search trees keep the keys in order and pay for the height of the tree, so balancing schemes such as red–black trees, AVL trees and B-trees use rotations and node splits to keep that height logarithmic. Hash tables give up order for constant expected time, and universal families of hash functions make that guarantee hold for every input rather than only for random ones. Skip lists reach the logarithmic bounds of balanced trees by flipping coins.`,
  items: [
    // ------------------------------------------------------------------ 5.1
    {
      num: '5.1',
      kind: 'Definition',
      name: 'Stacks, queues and linked lists',
      statement: String.raw`A **stack** is a dynamic set with the operations PUSH$(x)$ and POP, where POP removes and returns the element inserted most recently (*last in, first out*). A **queue** has ENQUEUE$(x)$ and DEQUEUE, where DEQUEUE removes the element inserted *least* recently (*first in, first out*).

A **singly linked list** stores the elements in nodes, each holding a key and a pointer *next* to the following node (nil in the last node); the list is reached through a pointer *head* to its first node, and optionally *tail* to its last. A stack is a linked list with PUSH and POP at the head; a queue inserts at the tail and removes at the head. Every one of these operations reads and writes a constant number of memory cells, so each takes $O(1)$ time on the RAM (1.2), however long the list is.`,
      idea: String.raw`Each operation only touches the cells next to an end of the list: PUSH writes the new node's key and *next* and redirects *head*; ENQUEUE also redirects the old last node's *next* and *tail*; POP and DEQUEUE read the first node and redirect *head*. Nothing depends on $n$. Storing a queue in a plain array and closing the gap after each DEQUEUE instead costs $\Theta(n)$ per operation, which is why array queues are kept circular.`,
      caption: String.raw`Pick a stack or a queue and how it is stored, then press the operation buttons. Gold cells are the ones the last operation touched, orange arrows the pointers it changed, and the dashed node is the one just removed. The bar chart counts touched cells per operation: flat for the linked list, but a queue in an array that closes the gap pays for every element that shifts.`,
      deps: ['algo-1.2'],
      refs: ['CLRS 4e §10.1', 'CLRS 4e §10.2'],
      credit: 'Newell, Shaw & Simon (lists), 1955; Bauer & Samelson (stacks), 1957',
      tags: ['data structures'],
      viz(v) {
        const kind = v.select('', [{ value: 'stack', label: 'stack' }, { value: 'queue', label: 'queue' }], 'queue', { onChange: () => reset() });
        const impl = v.select('stored as', [{ value: 'list', label: 'linked list' }, { value: 'array', label: 'array' }], 'list', { onChange: () => reset() });
        const A = v.stage({ x: [-2, 14], y: [-1.1, 1.75], axes: false, height: 175, full: true });
        const B = v.stage({ x: [0.4, 30.6], y: [0, 14], axes: 'box', height: 160, full: true, title: 'cells touched by each operation (bars) and the size $n$ after it (line)', xlabel: 'operation' });
        const CAP = 11; let rng = v.rng(17), Q = [], last = null, hist = [];
        const isQ = () => kind.value === 'queue', isL = () => impl.value === 'list';
        function insert() {
          const op = isQ() ? 'enqueue' : 'push';
          if (Q.length >= CAP) { last = { op, full: true, cost: 0 }; return; }
          const val = rng.int(10, 99), n0 = Q.length;
          if (isQ() || !isL()) Q.push(val); else Q.unshift(val);
          const cost = isL() ? (isQ() ? 4 : 3) : 2;
          last = { op, val, cost, n0, ins: true }; hist.push({ cost, n: Q.length, ins: true });
        }
        function remove() {
          const op = isQ() ? 'dequeue' : 'pop';
          if (!Q.length) { last = { op, empty: true, cost: 1 }; hist.push({ cost: 1, n: 0 }); return; }
          const n0 = Q.length; let val, cost;
          if (isQ()) { val = Q.shift(); cost = isL() ? (n0 === 1 ? 4 : 3) : n0 + 1; }
          else if (isL()) { val = Q.shift(); cost = 3; } else { val = Q.pop(); cost = 2; }
          last = { op, val, cost, n0 }; hist.push({ cost, n: Q.length });
        }
        function reset() { rng = v.rng(17); Q = []; hist = []; for (const c of 'iiiiiriirriiiriiirrriiiri') (c === 'i' ? insert : remove)(); }
        const bI = v.button('Enqueue', () => insert()), bR = v.button('Dequeue', () => remove());
        v.button('10 random operations', () => { for (let k = 0; k < 10; k++) (rng() < (Q.length < 4 ? 0.75 : Q.length > 8 ? 0.3 : 0.55) ? insert : remove)(); });
        v.button('Reset', () => reset());
        reset();
        const box = (x0, x1, y0, y1, st) => A.rect(x0, y0, x1, y1, { fill: 'panel', fillAlpha: 1, color: 'muted', width: 1.4, ...st });
        v.render(() => {
          const li = isQ() ? 'Enqueue' : 'Push', lr = isQ() ? 'Dequeue' : 'Pop';
          if (bI.textContent !== li) bI.textContent = li; if (bR.textContent !== lr) bR.textContent = lr;
          const n = Q.length, Lst = last || {}, hot = 'gold', rew = 'orange';
          if (isL()) {
            const st = 1.55, cw = 0.72, pw = 0.36, hh = 0.36;
            A.setView([-2.05, Math.max(7, CAP) * st + 0.15], [-1.1, 1.75]);
            const newIdx = Lst.ins ? (isQ() ? n - 1 : 0) : -1, removed = !Lst.ins && Lst.val != null;
            const node = (x0, val, o = {}) => {
              const kc = o.hot ? hot : o.ghost ? 'faint' : 'muted';
              box(x0, x0 + cw, -hh, hh, { color: kc, width: o.hot ? 2.6 : 1.4, dash: o.ghost ? [4, 3] : null, fill: o.hot ? 'gold' : 'panel', fillAlpha: o.hot ? 0.18 : 1 });
              box(x0 + cw, x0 + cw + pw, -hh, hh, { color: kc, width: o.hot ? 2.6 : 1.4, dash: o.ghost ? [4, 3] : null, fill: o.hot ? 'gold' : 'panel', fillAlpha: o.hot ? 0.18 : 1 });
              A.text(String(val), x0 + cw / 2, 0, { align: 'center', size: 14, weight: 700, color: o.ghost ? 'faint' : 'ink' });
              if (o.nil) A.line(x0 + cw + 0.05, -hh + 0.05, x0 + cw + pw - 0.05, hh - 0.05, { color: o.ghost ? 'faint' : 'muted', width: 1.4 });
              else A.dot(x0 + cw + pw / 2, 0, { r: 3, color: o.ghost ? 'faint' : 'ink', ring: false });
            };
            if (removed) {
              node(-st, Lst.val, { ghost: true, nil: n === 0 });
              if (n) A.arrow(-st + cw + pw / 2, 0, -0.04, 0, { color: 'faint', width: 1.4, dash: [4, 3], head: 7 });
              A.text('removed', -st + cw / 2 + 0.18, -0.68, { align: 'center', size: 11, color: 'faint', weight: 600 });
            }
            for (let i = 0; i < n; i++) {
              const x0 = i * st;
              node(x0, Q[i], { hot: i === newIdx, nil: i === n - 1 });
              if (i < n - 1) {
                const changed = (Lst.ins && !isQ() && i === 0) || (Lst.ins && isQ() && i === n - 2);
                A.arrow(x0 + cw + pw / 2, 0, (i + 1) * st - 0.03, 0, { color: changed ? rew : 'ink', width: changed ? 2.6 : 1.5, head: 8 });
              }
            }
            const ptr = (label, i, dx, changed) => {
              const x = i < 0 ? -0.9 : i * st + cw / 2 + dx;
              A.text(label, x, 1.42, { align: 'center', size: 12.5, weight: 700, color: changed ? rew : 'ink' });
              if (i >= 0) A.arrow(x, 1.2, x, hh + 0.06, { color: changed ? rew : 'ink', width: changed ? 2.6 : 1.5, head: 8 });
              else A.text('nil', x, 0.85, { align: 'center', size: 12, color: 'muted' });
            };
            const both = n === 1 && isQ();
            ptr('head', n ? 0 : -1, both ? -0.2 : 0, (Lst.ins && (!isQ() || Lst.n0 === 0)) || removed);
            if (isQ()) ptr('tail', n ? n - 1 : -1, both ? 0.2 : 0, (Lst.ins) || (removed && n === 0));
          } else {
            const cw = 0.95;
            A.setView([-2.05, CAP * cw + 2.6], [-1.1, 1.75]);
            const hotSet = new Set();
            if (Lst.ins) hotSet.add(n - 1);
            if (!Lst.ins && Lst.val != null) { if (isQ()) for (let i = 0; i < n; i++) hotSet.add(i); else hotSet.add(n); }
            for (let i = 0; i < CAP; i++) {
              const used = i < n, hotc = hotSet.has(i);
              A.rect(i * cw, -0.38, (i + 1) * cw, 0.38, { fill: hotc ? 'gold' : used ? 'panel' : 'grid', fillAlpha: hotc ? 0.2 : 1, color: hotc ? hot : 'muted', width: hotc ? 2.4 : 1.2 });
              if (used) A.text(String(Q[i]), (i + 0.5) * cw, 0, { align: 'center', size: 14, weight: 700 });
              else if (!Lst.ins && !isQ() && i === n && Lst.val != null) A.text(String(Lst.val), (i + 0.5) * cw, 0, { align: 'center', size: 14, weight: 700, color: 'faint' });
              A.text(String(i + 1), (i + 0.5) * cw, -0.62, { align: 'center', size: 10.5, color: 'muted' });
            }
            if (!Lst.ins && Lst.val != null && isQ()) {
              A.text(String(Lst.val), -0.85, 0, { align: 'center', size: 14, weight: 700, color: 'faint' });
              A.text('removed', -0.85, -0.62, { align: 'center', size: 10.5, color: 'faint' });
              for (let i = 0; i < n; i++) A.arrow((i + 1.45) * cw, 0.48, (i + 0.6) * cw, 0.48, { color: rew, width: 1.6, head: 6 });
              A.text(`${n} entries shift left`, (n / 2 + 0.5) * cw, 0.95, { align: 'center', size: 12, weight: 700, color: rew });
            }
            const xl = CAP * cw + 1.25;
            A.rect(xl - 0.75, -0.38, xl + 0.75, 0.38, { fill: 'gold', fillAlpha: Lst.val != null ? 0.2 : 0, color: Lst.val != null ? hot : 'muted', width: Lst.val != null ? 2.4 : 1.2 });
            A.text(`n = ${n}`, xl, 0, { align: 'center', size: 13, weight: 700 });
            if (!isQ() && n) { const x = (n - 0.5) * cw; A.text('top', x, 1.42, { align: 'center', size: 12.5, weight: 700 }); A.arrow(x, 1.2, x, 0.44, { color: 'ink', width: 1.5, head: 8 }); }
            if (isQ() && n) { const x = 0.5 * cw; A.text('front', x, 1.42, { align: 'center', size: 12.5, weight: 700 }); A.arrow(x, 1.2, x, 0.44, { color: 'ink', width: 1.5, head: 8 }); }
          }
          // history chart
          const H = hist.slice(-30), ymax = Math.max(12, ...H.map((h) => Math.max(h.cost, h.n) + 1));
          B.setView([0.4, 30.6], [-0.18 * ymax, ymax]);
          H.forEach((h, i) => B.rect(i + 0.62, 0, i + 1.38, h.cost, { fill: h.ins ? 'gold' : 'accent', fillAlpha: 0.6, color: h.ins ? 'gold' : 'accent', width: 1 }));
          const line = []; H.forEach((h, i) => { line.push([i + 0.5, h.n]); line.push([i + 1.5, h.n]); });
          B.path(line, { color: 'muted', width: 2 });
        });
        v.legend([['gold', 'cells touched', { area: true }], ['orange', 'pointer changed'], ['accent', 'cost of a removal', { area: true }], ['muted', 'size $n$']]);
        v.readout(() => {
          const L = last; if (!L) return '';
          if (L.full) return `The demo holds at most ${CAP} elements: remove some first.`;
          if (L.empty) return `**${L.op}** on an empty ${kind.value}: an error (underflow), detected by reading one cell.`;
          const H = hist.slice(-30), worst = Math.max(...H.map((h) => h.cost)), nmax = Math.max(...H.map((h) => h.n));
          const head = `**${L.op} ${L.val}** touched **${L.cost}** cells · $n = ${Q.length}$ · most expensive of the last ${H.length}: ${worst} cells, with $n$ up to ${nmax}`;
          if (!isL() && isQ()) return head + ` · closing the gap after a dequeue costs $n+1$: **grows with $n$** ✗ (a circular array fixes it)`;
          return head + ` · every operation touches at most ${isL() ? 4 : 2} cells, whatever $n$ is: $O(1)$ ✓`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.2
    {
      num: '5.2',
      kind: 'Definition',
      name: 'Binary search tree',
      statement: String.raw`A **binary search tree** (BST) is a rooted binary tree whose nodes carry keys from a totally ordered set, such that for every node $x$:
every key in the left subtree of $x$ is less than $x.\mathit{key}$, and every key in the right subtree of $x$ is greater.

(Equal keys can be allowed on one fixed side.) Equivalently, the **in-order** traversal — left subtree, then the node, then the right subtree, recursively — lists the keys in increasing order. The condition is about whole subtrees: comparing each node only with its two children is *not* enough.`,
      idea: String.raw`The equivalence is induction on the tree: if both subtrees are BSTs their in-order sequences are sorted, and the subtree condition says exactly that the left block lies below $x.\mathit{key}$ and the right block above it, so the concatenation is sorted; conversely a sorted in-order sequence puts every left-subtree key before, hence below, $x.\mathit{key}$. This ordering lets a search discard a whole subtree at each comparison (5.3), so the cost of the operations is governed by the height.`,
      caption: String.raw`Drag a key onto another to swap them. An edge turns red when the child's subtree holds a key on the wrong side of the parent (red outlines mark the offending keys). The ribbon underneath is the in-order sequence, read straight down from the picture; red marks show where it decreases. **Trap** makes every parent–child pair look right although the tree is not a BST.`,
      deps: ['algo-5.1'],
      refs: ['CLRS 4e §12.1'],
      credit: 'Windley; Booth & Colin; Hibbard, 1960–62',
      tags: ['search trees'],
      viz(v) {
        const KEYS = [12, 17, 23, 31, 38, 44, 52, 66, 71, 85];
        const SHAPES = { a: [6, 3, 8, 2, 5, 7, 10, 1, 4, 9], b: [3, 1, 8, 2, 6, 9, 5, 7, 10, 4], c: [8, 2, 9, 1, 6, 10, 4, 7, 3, 5] };
        const shape = v.select('shape', [{ value: 'a', label: 'I' }, { value: 'b', label: 'II' }, { value: 'c', label: 'III' }], 'a', { onChange: () => { build(); trap(); } });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340 });
        let T = null, L = null, as = KEYS.slice(), range = new Map(), held = null, hover = null, ptr = null, msg = '';
        function build() {
          T = bstFrom(SHAPES[shape.value]); L = layT(T); range = new Map();
          (function go(u) { if (!u) return [Infinity, -Infinity]; const a = go(u.l), b = go(u.r), x = L.pos.get(u.k).x; const r = [Math.min(a[0], x), Math.max(b[1], x)]; range.set(u.k, r); return r; })(T);
        }
        function trap() {
          as = KEYS.slice(); msg = '';
          const u = L.nodes.find((c) => c.n.l && c.n.l.r);
          if (!u) { msg = 'This shape has no node whose left child has a right child, so no trap.'; return; }
          let g = u.n.l; while (g.r) g = g.r;
          const i = u.x, j = L.pos.get(g.k).x; [as[i], as[j]] = [as[j], as[i]];
        }
        build(); trap();
        v.button('Shuffle keys', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); as = r.shuffle(as.slice()); msg = ''; });
        v.button('Sort (make it a BST)', () => { as = KEYS.slice(); msg = ''; });
        v.button('Trap', () => trap());
        s.onDrag((x, y, ph) => {
          const c = hitT(s, L, x, y, 24);
          if (ph === 'start') { held = c ? c.x : null; ptr = [x, y]; hover = null; }
          else if (ph === 'move') { ptr = [x, y]; hover = c ? c.x : null; }
          else { if (held != null && c && c.x !== held) { [as[held], as[c.x]] = [as[c.x], as[held]]; msg = ''; } held = null; hover = null; }
        });
        let st = { bad: new Set(), off: new Set(), loc: 0, desc: 0 };
        v.render(() => {
          const bad = new Set(), off = new Set(); let loc = 0;
          for (const c of L.nodes) {
            const kp = as[c.x];
            for (const [ch, left] of [[c.n.l, true], [c.n.r, false]]) {
              if (!ch) continue; const [lo, hi] = range.get(ch.k); let wrong = false;
              for (let i = lo; i <= hi; i++) if (left ? as[i] > kp : as[i] < kp) { wrong = true; off.add(i); }
              if (wrong) bad.add(ch.k);
              const kc = as[L.pos.get(ch.k).x]; if (left ? kc > kp : kc < kp) loc++;
            }
          }
          let desc = 0; for (let i = 0; i + 1 < as.length; i++) if (as[i] > as[i + 1]) desc++;
          st = { bad, off, loc, desc };
          const yR = -L.h - 1.35;
          const dr = drawT(s, L, {
            padB: 1.25, label: (k, c) => (held === c.x ? '' : String(as[c.x])),
            color: (k, c) => (off.has(c.x) ? 'red' : null), fill: (k, c) => (held === c.x ? 'faint' : null),
            ring: (k, c) => (held != null && hover === c.x && hover !== held ? 'gold' : null),
            edgeColor: (a, b) => (bad.has(b) ? 'red' : null), edgeWidth: (a, b) => (bad.has(b) ? 3.6 : null),
          });
          for (const c of L.nodes) s.line(c.x, -c.d - (dr.r + 3) / s.sy, c.x, yR + 0.34, { color: 'faint', width: 1, dash: [2, 4] });
          as.forEach((k, i) => {
            const wrong = (i > 0 && as[i - 1] > k) || (i + 1 < as.length && k > as[i + 1]);
            s.rect(i - 0.4, yR - 0.3, i + 0.4, yR + 0.3, { fill: wrong ? 'red' : 'accent', fillAlpha: wrong ? 0.14 : 0.08, color: wrong ? 'red' : 'accent', width: 1.4 });
            s.text(String(k), i, yR, { align: 'center', size: 13, weight: 700, color: wrong ? 'red' : 'ink' });
            if (i + 1 < as.length && k > as[i + 1]) s.text('>', i + 0.5, yR, { align: 'center', size: 15, weight: 800, color: 'red' });
          });
          s.text('in-order', -0.55, yR + 0.52, { size: 11, color: 'muted', weight: 600 });
          if (held != null && ptr) { s.dot(ptr[0], ptr[1], { r: dr.r, color: 'gold' }); s.text(String(as[held]), ptr[0], ptr[1], { align: 'center', size: 13, weight: 700, color: 'panel', halo: false }); }
        });
        v.legend([['red', 'subtree on the wrong side of its parent'], ['accent', 'in-order ribbon', { area: true }]]);
        v.readout(() => {
          const { bad, loc, desc } = st, ok = desc === 0;
          return (msg ? msg + ' · ' : '') + `In-order ribbon ${ok ? 'is **sorted** ✓' : `has **${plural(desc, 'descent')}**`} · edges breaking the subtree rule: **${bad.size}** · parent–child comparisons alone flag ${loc}` +
            (loc === 0 && bad.size ? ' — **fooled**: a key further down is on the wrong side' : '') + ` · ${ok ? 'a binary search tree ✓' : 'not a binary search tree'} (sorted ribbon ⇔ no red edge: ${(desc === 0) === (bad.size === 0) ? '✓' : '✗'})`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.3
    {
      num: '5.3',
      kind: 'Algorithm',
      name: 'Search, insertion and deletion in a BST',
      statement: String.raw`In a binary search tree of height $h$:
(a) **Search** for $k$: start at the root; at a node with key $x.\mathit{key}\ne k$ go left if $k<x.\mathit{key}$ and right otherwise; stop at $k$ or at nil.
(b) **Insert** $k$: search for $k$ and attach a new leaf at the nil pointer where the search falls off.
(c) **Delete** the node $z$: if $z$ has at most one child, replace $z$ by that child (or by nil); if $z$ has two children, its successor $y$ (the minimum of the right subtree) has no left child, so $y$ is spliced out of its place — its right subtree moving up — and then put in $z$'s position.

Each operation preserves the BST property and follows a single root-to-leaf path, so it runs in $O(h)$ time.`,
      idea: String.raw`At every node the BST property (5.2) says on which side $k$ must lie, so one comparison discards the other subtree; the visited nodes form one downward path of at most $h+1$ nodes. A new leaf is placed exactly where a later search will look for it. In the two-child deletion the successor is the next key in in-order, so putting it where $z$ was keeps every left key smaller and every right key larger; finding it costs another walk down, still $O(h)$.`,
      caption: String.raw`Choose a key with the slider (or click a node), then **Search**, **Insert** or **Delete** and step through. Green is the path walked so far, gold the node being compared; in a two-child deletion the orange path finds the successor, whose right subtree (teal) moves up before the successor takes $z$'s place. The readout compares the path with the height.`,
      deps: ['algo-5.2'],
      refs: ['CLRS 4e §12.2', 'CLRS 4e §12.3'],
      credit: 'Hibbard (deletion), 1962',
      tags: ['search trees'],
      viz(v) {
        let tree = bstFrom([50, 30, 72, 18, 41, 60, 85, 9, 25, 36, 47, 66, 79, 93, 33, 38, 34]);
        const key = v.slider('key $k$', 1, 99, 30, { int: true });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, full: true });
        let run = bstOpFrames(tree, 'delete', 30); tree = run.root;
        const S = v.steps({ frames: run.F, code: BST_CODE.delete, codeTitle: 'delete', codePos: 'below', transition: 0.45, speed: 1.2, start: 3, still: 3 });
        const go = (op) => { run = bstOpFrames(tree, op, key.value); tree = run.root; S.setCode(BST_CODE[op], op); S.reset(run.F, { at: 0 }); S.play(); };
        v.button('Search', () => go('search')); v.button('Insert', () => go('insert')); v.button('Delete', () => go('delete'));
        v.button('Random tree', () => { const r = v.rng(Math.floor(Math.random() * 1e6)), ks = new Set(); while (ks.size < 15) ks.add(r.int(1, 99)); tree = bstFrom([...ks]); run = { F: [{ L: snapT(tree), path: [], op: 'search', k: key.value, line: 1, note: 'A fresh tree from 15 random keys.' }], root: tree }; S.reset(run.F); });
        s.onClick((x, y) => { const f = S.frame, c = hitT(s, f.L, x, y, 20); if (c) key.set(c.k); });
        v.render(() => {
          const f = S.frame, path = new Set(f.path), sp = new Set(f.sp || []), yr = new Set(f.yr || []);
          const dr = drawT(s, f.L, {
            prev: S.prev && S.prev.L, tw: S.tween, nil: false,
            fill: (k) => (k === f.cur || k === f.newk ? (f.found && f.op === 'search' ? 'green' : 'gold') : k === f.succ ? 'orange' : null),
            color: (k) => (k === f.moved ? 'orange' : yr.has(k) ? 'teal' : sp.has(k) ? 'orange' : path.has(k) ? 'green' : k === key.value ? 'accent' : null),
            edgeColor: (a, b) => (sp.has(a) && sp.has(b) ? 'orange' : path.has(a) && path.has(b) ? 'green' : null),
            edgeWidth: (a, b) => ((sp.has(a) && sp.has(b)) || (path.has(a) && path.has(b)) ? 3.4 : null),
          });
          if (f.nilAt) {
            const at = dr.at(f.nilAt[0]); if (at) {
              const X = at[0] + (f.nilAt[1] === 'l' ? -0.5 : 0.5), Y = at[1] - 0.75;
              s.line(at[0], at[1], X, Y, { color: 'red', width: 2, dash: [4, 3] });
              s.rect(X - 5 / s.sx, Y - 5 / s.sy, X + 5 / s.sx, Y + 5 / s.sy, { fill: 'red', fillAlpha: 0.25, color: 'red', width: 1.6 });
              s.text('nil', X, Y - 14 / s.sy, { align: 'center', baseline: 'top', size: 11, color: 'red', weight: 700 });
            }
          }
          s.corner(`height h = ${Math.max(0, f.L.h)}`, 'tr', { color: 'muted', weight: 600 });
        });
        v.legend([['green', 'search path', { dot: true }], ['gold', 'node compared now', { dot: true }], ['orange', 'successor path', { dot: true }], ['teal', 'subtree that moves up', { dot: true }]]);
        v.readout(() => {
          const f = S.frame, F0 = S.frames[0], last = S.frames[S.n - 1], sp = S.frames.find((g) => g.sp), total = last.path.length + (sp ? sp.sp.length : 0), h = F0.L.h;
          return `**${f.op} ${f.k}** · nodes visited so far ${f.path.length}${f.sp ? ` + ${f.sp.length} on the successor path` : ''} · whole operation ${total} · height before $h = ${h}$: one downward path, so at most $h + 1 = ${h + 1}$ nodes ${total <= h + 1 ? '✓' : '✗'} · $n = ${last.L.n}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.4
    {
      num: '5.4',
      kind: 'Theorem',
      name: 'Random BSTs have average depth about 2 ln n',
      statement: String.raw`Insert $n$ distinct keys into an empty binary search tree in an order chosen uniformly at random among all $n!$ orders. The expected depth of a node (number of edges from the root), averaged over the $n$ nodes, is
$$\bar D(n)=2\Bigl(1+\frac1n\Bigr)H_n-4=2\ln n-O(1),$$
where $H_n=1+\frac12+\dots+\frac1n$. (The expected *height* is also $\Theta(\log n)$, about $4.31\ln n$.) For a bad fixed order the same keys give depth $\Theta(n)$: sorted input builds a path, of average depth $(n-1)/2$.`,
      idea: String.raw`Key $j$ (in sorted order) is an ancestor of key $i$ exactly when $j$ is inserted first among the keys between $i$ and $j$ inclusive — the same event that makes quicksort compare them (3.11). For a random order that probability is $1/(|i-j|+1)$, so by linearity of expectation (3.3) the expected depth of $i$ is $\sum_{j\ne i}1/(|i-j|+1)=H_i+H_{n+1-i}-2$; averaging over $i$ gives the formula. The comparisons made while building the tree are exactly the comparisons of quicksort with the first element as pivot.`,
      caption: String.raw`Left: step through the insertions (green: the comparisons made by the newest key). Right, on a logarithmic $n$-axis where $\ln n$ is a straight line: the average depth and the height measured over 40 random orders up to $n = 65\,536$, against the exact expectation and $2\ln n$. Switch the order to **sorted** or **zig-zag** and both shoot off the chart; **medians first** gives the best possible tree.`,
      deps: ['algo-5.3', 'algo-3.11'],
      refs: ['CLRS 4e Ch. 12', 'Erickson notes: Treaps and Skip Lists'],
      credit: 'Hibbard, 1962',
      tags: ['search trees', 'randomized'],
      viz(v) {
        const order = v.select('insertion order', [{ value: 'random', label: 'random' }, { value: 'sorted', label: 'sorted' }, { value: 'zigzag', label: 'zig-zag' }, { value: 'medians', label: 'medians first' }], 'random', { onChange: () => S.reset() });
        const nS = v.slider('tree size $n$', 4, 40, 28, { int: true, onChange: () => S.reset() });
        let seed = 3;
        v.button('Shuffle', () => { seed++; S.reset({ at: 'end' }); });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, full: true, title: 'the tree built so far' });
        const P = v.stage({ x: [2, 65536], y: [0, 46], xlog: true, axes: 'box', height: 270, full: true, title: 'average depth and height against $n$ (log scale, 40 random orders per $n$)', xlabel: 'n' });
        let perm = [];
        const frames = () => {
          const n = nS.value; perm = orderPerm(order.value, n, v.rng(seed * 101 + n)).map((x) => x + 1);
          const F = [{ L: layT(null), path: [], note: `Insert the keys 1…${n} in ${order.value === 'random' ? 'a random' : 'this'} order: ${perm.slice(0, 14).join(', ')}${n > 14 ? ', …' : ''}` }];
          let t = null;
          perm.forEach((k, i) => {
            const path = []; for (let u = t; u; u = k < u.k ? u.l : u.r) path.push(u.k);
            t = bstAdd(t, k);
            F.push({ L: snapT(t), path, newk: k, note: `Insert ${k}: ${plural(path.length, 'comparison')}, so it lands at depth ${path.length}.` });
          });
          return F;
        };
        const S = v.steps({ frames, speed: 5, start: 'end', transition: 0.25 });
        // plot data: per order, depths of trees for n on a geometric grid
        const NS = []; for (let j = 2; j <= 32; j++) { const n = Math.round(2 ** (j / 2)); if (!NS.includes(n)) NS.push(n); }
        const cache = {};
        const series = (kind) => {
          if (cache[kind]) return cache[kind];
          const r = v.rng(777), out = [];
          for (const n of NS) {
            const trials = kind === 'random' ? (n <= 4096 ? 40 : 14) : 1; let sa = 0, sh = 0, amin = Infinity, amax = -Infinity, hmin = Infinity, hmax = -Infinity;
            for (let t = 0; t < trials; t++) {
              const d = bstDepths(orderPerm(kind, n, r)); let s = 0, h = 0; for (let i = 0; i < n; i++) { s += d[i]; if (d[i] > h) h = d[i]; }
              const a = s / n; sa += a; sh += h; amin = Math.min(amin, a); amax = Math.max(amax, a); hmin = Math.min(hmin, h); hmax = Math.max(hmax, h);
            }
            out.push({ n, avg: sa / trials, h: sh / trials, amin, amax, hmin, hmax, trials });
          }
          return (cache[kind] = out);
        };
        const Dexp = (n) => 2 * (1 + 1 / n) * harm(n) - 4;
        v.render(() => {
          const f = S.frame, path = new Set(f.path);
          drawT(T, f.L, {
            prev: S.prev && S.prev.L, tw: S.tween, rmax: 13,
            fill: (k) => (k === f.newk ? 'gold' : null), color: (k) => (path.has(k) ? 'green' : null),
            edgeColor: (a, b) => (path.has(a) && (path.has(b) || b === f.newk) ? 'green' : null), edgeWidth: (a, b) => (path.has(a) && (path.has(b) || b === f.newk) ? 3 : null),
          });
          T.setTitle(f.L.n ? `the tree built so far: $n = ${f.L.n}$, height **${f.L.h}**, while $\\lfloor\\log_2 n\\rfloor = ${Math.floor(LG(f.L.n))}$` : 'the tree built so far: empty');
          // plot
          const D = series(order.value);
          P.fn((n) => Math.floor(LG(n)), { color: 'faint', width: 1.4, dash: [3, 4] });
          P.fn((n) => 2 * Math.log(n), { color: 'gold', width: 2, dash: [7, 4] });
          P.fn(Dexp, { color: 'green', width: 2.2 });
          for (const d of D) {
            if (d.trials > 1) { P.line(d.n, d.amin, d.n, d.amax, { color: 'accent', width: 1.4 }); P.line(d.n, d.hmin, d.n, Math.min(d.hmax, 46), { color: 'orange', width: 1.4 }); }
            if (d.h <= 46) P.dot(d.n, d.h, { r: 3.2, color: 'orange' });
            if (d.avg <= 46) P.dot(d.n, d.avg, { r: 3.4, color: 'accent' });
          }
          if (order.value === 'sorted' || order.value === 'zigzag') {
            const off = D.find((d) => d.avg > 46);
            if (off) P.text('average depth (n − 1)/2: off the chart ↑', off.n * 1.3, 41, { size: 11.5, color: 'accent', weight: 700 });
          }
          if (f.L.n) P.vline(f.L.n, { color: 'muted', width: 1, dash: [2, 3] });
        });
        v.legend([['accent', 'average depth (40 trees)', { dot: true }], ['orange', 'height', { dot: true }], ['green', '$2(1+\\frac1n)H_n-4$'], ['gold', '$2\\ln n$', { dash: true }], ['faint', '$\\lfloor\\log_2 n\\rfloor$', { dash: true }]]);
        v.readout(() => {
          const f = S.frame, n = f.L.n, D = series(order.value), big = D[D.length - 1];
          let sum = 0; for (const c of f.L.nodes) sum += c.d;
          const here = n ? `Left tree: $n = ${n}$, height ${f.L.h}, average depth ${v.fix(sum / n, 2)} (random-order expectation ${v.fix(Dexp(n), 2)})` : 'Empty tree';
          const at = `at $n = ${big.n.toLocaleString('en').replace(/,/g, '{,}')}$${big.trials > 1 ? ` (mean of ${big.trials} trees)` : ''}: average depth **${v.fix(big.avg, 2)}**, height ${v.fix(big.h, 1)} · exact expectation ${v.fix(Dexp(big.n), 2)} · $2\\ln n = ${v.fix(2 * Math.log(big.n), 2)}$ · $\\log_2 n = ${v.fix(LG(big.n), 0)}$`;
          return `${here} · ${at}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.5
    {
      num: '5.5',
      kind: 'Definition',
      name: 'Tree rotations',
      statement: String.raw`Let $y$ be a node of a binary search tree with left child $x$, and let $A$, $B$ be the subtrees of $x$ and $C$ the right subtree of $y$. The **right rotation** at $y$ makes $x$ the root of this part of the tree, with $y$ as its right child, $A$ as $x$'s left subtree, and $B$, $C$ as $y$'s subtrees; the **left rotation** at $x$ is the inverse. A rotation changes $O(1)$ pointers, preserves the in-order sequence $A\,x\,B\,y\,C$ and hence the BST property, moves every node of $A$ one level up and every node of $C$ one level down, and leaves the depths in $B$ unchanged.`,
      idea: String.raw`In-order reads $A$, then $x$, then $B$, then $y$, then $C$ both before and after, so the key order — the BST property (5.2) — survives. Only three child links change ($y$'s left becomes $B$, $x$'s right becomes $y$, and $y$'s parent now points to $x$), so the cost is constant. Because a rotation shifts depth from one side to the other, the balanced trees of this chapter (5.8, 5.9) use rotations to repair the height after an insertion; any BST on $n$ keys can be turned into any other by at most $2n-6$ rotations.`,
      caption: String.raw`Click a node (or the edge above it) to rotate it above its parent. Nodes stay in their columns — the columns *are* the in-order sequence — and only move up or down: the boxes show $A$ rising one level, $C$ sinking one level and $B$ staying put. Use the step buttons to replay your rotations.`,
      deps: ['algo-5.2'],
      refs: ['CLRS 4e §13.2'],
      credit: 'Adelson-Velsky & Landis, 1962',
      tags: ['search trees'],
      viz(v) {
        const START = [3, 1, 9, 2, 6, 12, 4, 8, 10, 14, 5, 7, 11, 13, 15];
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, minWidth: 380 });
        const first = (t) => ({ t, L: snapT(t), note: 'Click a node to rotate it above its parent.' });
        let F = [first(bstFrom(START))];
        const S = v.steps({ frames: F, code: ROT_CODE.right, codeTitle: 'rotation', transition: 0.5, speed: 1 });
        let codeDir = 'right';
        const rotate = (ck) => {
          const cur = S.frame, R = rotateUp(cur.t, ck); if (!R) return;
          const I = R.info, h0 = cur.L.h, L = snapT(R.root);
          F = F.slice(0, S.i + 1); F.push({ t: R.root, L, info: I, line: [2, 3, 4, 5], h0, note: `${I.dir === 'right' ? 'Right' : 'Left'} rotation of the edge ${I.top}–${I.low}: ${I.low} moves up, ${I.top} moves down. Subtree $B$ = {${I.B.join(', ') || '∅'}} changes parent.` });
          const k = S.i; S.reset(F, { at: k }); S.next();
        };
        s.onClick((x, y) => {
          const L = S.frame.L, c = hitT(s, L, x, y, 18);
          if (c && c.p != null) return rotate(c.k);
          const e = hitEdge(s, L, x, y, 9); if (e) rotate(e[1]);
        });
        v.button('Reset', () => { F = [first(bstFrom(START))]; S.reset(F); });
        v.button('Random tree', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); F = [first(bstFrom(r.shuffle(START.slice())))]; S.reset(F); });
        // make one rotation so the picture opens mid-story
        rotate(9);
        const COL = { A: 'blue', B: 'purple', C: 'teal' };
        v.render(() => {
          const f = S.frame, I = f.info;
          if (I && I.dir !== codeDir) { codeDir = I.dir; S.setCode(ROT_CODE[codeDir], 'rotation'); }
          const grp = new Map(); if (I) for (const g of ['A', 'B', 'C']) for (const k of I[g]) grp.set(k, g);
          const yR = -f.L.h - 1.3;
          const dr = drawT(s, f.L, {
            prev: S.prev && S.prev.L, tw: S.tween, padB: 1.15, rmax: 14,
            fill: (k) => (I && k === I.low ? 'gold' : I && k === I.top ? 'orange' : null),
            color: (k) => (grp.has(k) ? COL[grp.get(k)] : null),
          });
          if (I) for (const g of ['A', 'B', 'C']) {
            const ks = I[g]; if (!ks.length) continue;
            let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
            for (const k of ks) { const [x, y] = dr.at(k); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
            const px = (dr.r + 5) / s.sx, py = (dr.r + 5) / s.sy;
            s.rect(x0 - px, y0 - py, x1 + px, y1 + py, { fill: COL[g], fillAlpha: 0.08, color: COL[g], width: 1.4, dash: [5, 4] });
            const shift = g === 'B' ? '±0' : (g === 'A') === (I.dir === 'right') ? '↑1' : '↓1';
            s.text(`${g} ${shift}`, (x0 + x1) / 2, y0 - py, { align: 'center', baseline: 'top', dy: 3, size: 12, weight: 700, color: COL[g] });
          }
          f.L.nodes.forEach((c) => {
            const g = grp.get(c.k), col = I && (c.k === I.low ? 'gold' : c.k === I.top ? 'orange' : g ? COL[g] : null);
            s.rect(c.x - 0.42, yR - 0.27, c.x + 0.42, yR + 0.27, { fill: col || 'grid', fillAlpha: col ? 0.2 : 0.6, color: col || 'faint', width: 1.2 });
            s.text(String(c.k), c.x, yR, { align: 'center', size: 12, weight: 700 });
          });
          s.text('in-order', -0.58, yR + 0.5, { size: 11, color: 'muted', weight: 600 });
        });
        v.legend([['gold', 'moves up', { dot: true }], ['orange', 'moves down', { dot: true }], ['blue', 'A'], ['purple', 'B'], ['teal', 'C']]);
        v.readout(() => {
          const f = S.frame, I = f.info, seq = f.L.nodes.map((c) => c.k), sorted = seq.every((k, i) => i === 0 || seq[i - 1] < k);
          if (!I) return `Height ${f.L.h} · in-order ${sorted ? 'sorted ✓' : '✗'} · ${plural(S.n - 1, 'rotation')} so far`;
          const dep = (L, k) => L.pos.get(k).d, prev = S.frames[S.i - 1].L;
          const chk = (g) => I[g].every((k) => dep(f.L, k) - dep(prev, k) === (g === 'B' ? 0 : (g === 'A') === (I.dir === 'right') ? -1 : 1));
          return `${I.dir} rotation at ${I.top}: depths in $A$ ${(I.dir === 'right' ? '−1' : '+1')} ${chk('A') ? '✓' : '✗'}, in $B$ unchanged ${chk('B') ? '✓' : '✗'}, in $C$ ${(I.dir === 'right' ? '+1' : '−1')} ${chk('C') ? '✓' : '✗'} · in-order sequence unchanged ${sorted ? '✓' : '✗'} · height ${f.h0} → **${f.L.h}** · rotation ${S.i} of ${S.n - 1}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.6
    {
      num: '5.6',
      kind: 'Definition',
      name: 'Red–black trees',
      statement: String.raw`A **red–black tree** is a binary search tree in which every node is coloured red or black, the nil pointers are treated as black leaves, and
(i) the root is black;
(ii) a red node has no red child;
(iii) for every node $x$, all paths from $x$ down to a nil leaf contain the same number of black nodes.

That number, not counting $x$ itself, is the **black height** $\mathrm{bh}(x)$. Not every tree shape can be coloured this way: (ii) and (iii) force every root-to-leaf path to be at most twice as long as any other, which is what keeps the height logarithmic (5.7).`,
      idea: String.raw`The colours encode a 2-3-4 tree (a B-tree with $t=2$, 5.10): merge every red node into its black parent and each merged group becomes a node with 2, 3 or 4 children, all of whose leaves lie at the same depth — that is property (iii). Red nodes are the "slack" that lets the tree be imperfect while black paths stay perfectly balanced, and since reds cannot be stacked, a path has at most one red per black.`,
      caption: String.raw`Click nodes to recolour them. Under each nil leaf is the number of black nodes on its path from the root; red edges mark a red node with a red child, and orange rings mark nodes whose two sides have different black heights (the others show $\mathrm{bh}$). Shape **III** is too lopsided to colour at all — try, then ask for a valid colouring.`,
      deps: ['algo-5.2'],
      refs: ['CLRS 4e §13.1'],
      credit: 'Bayer, 1972; Guibas & Sedgewick, 1978',
      tags: ['search trees', 'balanced trees'],
      viz(v) {
        const SH = { I: [40, 20, 60, 10, 30, 50, 70, 25, 35, 65], II: [60, 30, 80, 20, 40, 70, 90, 10, 25, 5], III: [50, 30, 70, 20, 40, 10, 25, 5, 80] };
        const shape = v.select('shape', [{ value: 'I', label: 'I' }, { value: 'II', label: 'II' }, { value: 'III', label: 'III' }], 'I', { onChange: () => setShape(false) });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340 });
        let T = null, L = null, col = new Map(), feas = null, msg = '';
        function setShape(first) {
          T = bstFrom(SH[shape.value]); L = layT(T); feas = rbColourings(T); msg = '';
          col = new Map(inord(T).map((u) => [u.k, 'B']));
          if (first && feas.ok) { col = new Map(feas.col); col.set(60, 'R'); }
        }
        setShape(true);
        s.onClick((x, y) => { const c = hitT(s, L, x, y, 18); if (c) { col.set(c.k, col.get(c.k) === 'R' ? 'B' : 'R'); msg = ''; } });
        v.button('Valid colouring', () => { if (feas.ok) { col = new Map(feas.col); msg = ''; } else msg = '**No valid colouring exists for this shape.**'; });
        v.button('All black', () => { col = new Map(inord(T).map((u) => [u.k, 'B'])); msg = ''; });
        v.button('Random colours', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); col = new Map(inord(T).map((u) => [u.k, r() < 0.35 ? 'R' : 'B'])); msg = ''; });
        let info = null;
        v.render(() => {
          for (const u of inord(T)) u.c = col.get(u.k);
          const chk = rbCheck(T), cnt = new Map();
          (function go(u, c) { if (!u) return; const cc = c + (u.c === 'B' ? 1 : 0); cnt.set(u.k, cc); go(u.l, cc); go(u.r, cc); })(T, 0);
          const dr = drawT(s, L, {
            nil: true, padB: 0.55, fill: (k) => (col.get(k) === 'R' ? 'red' : 'ink'),
            ring: (k, c) => (chk.bad.has(k) ? 'orange' : c.p == null && col.get(k) === 'R' ? 'red' : null),
            note: (k) => (chk.bad.has(k) ? ['≠', 'orange', 'ne'] : [`bh ${chk.bh.get(k)}`, 'muted', 'ne']),
            edgeColor: (a, b) => (chk.redred.has(b) ? 'red' : null), edgeWidth: (a, b) => (chk.redred.has(b) ? 4.5 : null),
          });
          const counts = dr.nils.map((q) => cnt.get(q.p)), freq = new Map(); counts.forEach((c) => freq.set(c, (freq.get(c) || 0) + 1));
          const mode = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0], eq = freq.size === 1;
          dr.nils.forEach((q, i) => s.text(String(counts[i]), q.x, q.y, { align: 'center', baseline: 'top', dy: 8, size: 12, weight: 800, color: eq ? 'green' : counts[i] === mode ? 'muted' : 'red' }));
          if (chk.rootRed) { const [x, y] = dr.at(T.k); s.text('root must be black', x, y, { dx: dr.r + 10, size: 11.5, weight: 700, color: 'red' }); }
          info = { chk, eq, lo: Math.min(...counts), hi: Math.max(...counts) };
        });
        v.legend([['ink', 'black node', { dot: true }], ['red', 'red node / red–red edge', { dot: true }], ['orange', 'black heights differ below', { dot: true }], ['green', 'black nodes on each root–nil path']]);
        v.readout(() => {
          const { chk, eq, lo, hi } = info, ok = !chk.rootRed && !chk.redred.size && eq;
          const lens = []; (function go(u, d) { if (!u) { lens.push(d); return; } go(u.l, d + 1); go(u.r, d + 1); })(T, 0);
          const shape = feas.ok ? `this shape can be coloured (root black height ${feas.bhs.join(' or ')})` : `this shape **cannot** be coloured: a root–nil path with ${Math.max(...lens)} nodes is more than twice one with ${Math.min(...lens)}`;
          return (msg ? msg + ' · ' : '') + `(i) root black ${chk.rootRed ? '✗' : '✓'} · (ii) no red–red edge ${chk.redred.size ? `✗ (${chk.redred.size})` : '✓'} · (iii) equal black counts ${eq ? `✓ (${lo} on every path)` : `✗ (from ${lo} to ${hi})`} · ${ok ? '**a red–black tree** ✓' : 'not a red–black tree'} · ${shape}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.7
    {
      num: '5.7',
      kind: 'Lemma',
      name: 'Red–black trees have height at most 2 log₂(n + 1)',
      statement: String.raw`A red–black tree with $n$ internal (key-carrying) nodes has height at most $2\log_2(n+1)$, where the height $h$ counts the internal nodes on a longest path from the root to a nil leaf. Consequently search, minimum, maximum, successor and predecessor take $O(\log n)$ time.`,
      idea: String.raw`First, by induction on the height of $x$, the subtree rooted at any node $x$ contains at least $2^{\mathrm{bh}(x)}-1$ internal nodes: each child has black height at least $\mathrm{bh}(x)-1$, so the subtree has at least $2(2^{\mathrm{bh}(x)-1}-1)+1$ nodes. Second, red nodes cannot be adjacent and the root is black (5.6), so at least half of the nodes on any root-to-leaf path are black: $\mathrm{bh}(\text{root})\ge h/2$. Together $n\ge 2^{h/2}-1$, i.e. $h\le 2\log_2(n+1)$. The tallest trees, computed below by dynamic programming over all legal colourings, nearly reach the bound: a red–black spine beside perfect all-black subtrees.`,
      caption: String.raw`The tree is the *tallest* legal red–black tree with $n$ nodes, found by an exhaustive dynamic program. Label the nodes by black height, subtree size or the guaranteed minimum $2^{\mathrm{bh}}-1$, and click a node to check the size bound on its subtree. Below, the tallest height for every $n \le 127$ stays under $2\log_2(n+1)$.`,
      deps: ['algo-5.6'],
      refs: ['CLRS 4e §13.1'],
      tags: ['balanced trees'],
      viz(v) {
        const R = rbTallest(127), cache = new Map();
        const nS = v.slider('$n$', 1, 40, 22, { int: true, onChange: () => { sel = null; } });
        const lab = v.select('label', [{ value: 'bh', label: 'black height' }, { value: 'size', label: 'subtree size' }, { value: 'bound', label: '$2^{bh}-1$' }], 'size');
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, full: true });
        const P = v.stage({ x: [0, 128], y: [0, 15], axes: 'box', height: 200, full: true, title: 'height of the tallest red–black tree with $n$ nodes', xlabel: 'n' });
        let sel = null, info = null;
        const get = (n) => { if (!cache.has(n)) { const t = R.tree(n); cache.set(n, { t, L: layT(t), chk: rbCheck(t), size: new Map(inord(t).map((u) => [u.k, sizeT(u)])) }); } return cache.get(n); };
        s.onClick((x, y) => { const g = get(nS.value), c = hitT(s, g.L, x, y, 18); sel = c && c.k !== sel ? c.k : null; });
        v.render(() => {
          const n = nS.value, g = get(n), sub = new Set(sel != null ? keysOf(g.L.pos.get(sel).n) : []);
          const val = (k) => { const b = g.chk.bh.get(k); return lab.value === 'bh' ? b : lab.value === 'size' ? g.size.get(k) : 2 ** b - 1; };
          drawT(s, g.L, {
            nil: true, rmax: 14, fill: (k, c) => (c.n.c === 'R' ? 'red' : 'ink'), label: (k) => String(val(k)),
            ring: (k) => (k === sel ? 'gold' : sub.has(k) ? 'gold' : null),
            edgeColor: (a, b) => (sub.has(a) && sub.has(b) ? 'gold' : null), edgeWidth: (a, b) => (sub.has(a) && sub.has(b) ? 3 : null),
          });
          const h = hgt(g.t); s.setTitle(`tallest legal tree for $n = ${n}$: height **${h}**, bound $2\\log_2(n+1) = ${v.fix(2 * LG(n + 1), 2)}$`);
          // plot
          const st = [], mn = [];
          for (let m = 1; m <= 127; m++) { st.push([m - 0.5, R.best[m]], [m + 0.5, R.best[m]]); mn.push([m - 0.5, Math.ceil(LG(m + 1))], [m + 0.5, Math.ceil(LG(m + 1))]); }
          P.path(mn, { color: 'faint', width: 1.5 });
          P.fn((m) => 2 * LG(m + 1), { color: 'orange', width: 2.2, dash: [7, 4], domain: [0.5, 128] });
          P.path(st, { color: 'red', width: 2.2 });
          P.vline(n, { color: 'muted', width: 1, dash: [2, 3] });
          P.dot(n, R.best[n], { r: 5, color: 'red' });
          info = { n, h, g };
        });
        v.legend([['red', 'tallest legal height'], ['orange', '$2\\log_2(n+1)$', { dash: true }], ['faint', 'shortest possible $\\lceil\\log_2(n+1)\\rceil$'], ['gold', 'selected subtree', { dot: true }]]);
        v.readout(() => {
          const { n, h, g } = info, root = g.t, bh = g.chk.bh.get(root.k);
          let allOk = true; for (const c of g.L.nodes) if (g.size.get(c.k) < 2 ** g.chk.bh.get(c.k) - 1) allOk = false;
          const s1 = sel != null ? `subtree of the selected node: ${g.size.get(sel)} nodes $\\ge 2^{${g.chk.bh.get(sel)}}-1 = ${2 ** g.chk.bh.get(sel) - 1}$ ✓ · ` : '';
          return s1 + `every node: size $\\ge 2^{\\mathrm{bh}}-1$ ${allOk ? '✓' : '✗'} · root: $\\mathrm{bh} = ${bh} \\ge h/2 = ${h / 2}$ ✓, so $n = ${n} \\ge 2^{${bh}}-1 = ${2 ** bh - 1}$ · height $h = ${h} \\le 2\\log_2(n+1) = ${v.fix(2 * LG(n + 1), 2)}$ ${h <= 2 * LG(n + 1) ? '✓' : '✗'} · over all $n \\le 127$ the tallest tree comes within ${v.fix(Math.min(...R.best.slice(1).map((b, i) => 2 * LG(i + 2) - b)), 2)} of the bound`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.8
    {
      num: '5.8',
      kind: 'Algorithm',
      name: 'Red–black insertion',
      statement: String.raw`To insert a key into a red–black tree, insert it as in a BST (5.3) and colour the new node $z$ red; then, while $z$'s parent is red, let $y$ be $z$'s uncle and
(1) if $y$ is red, colour the parent and $y$ black and the grandparent red, and continue from the grandparent;
(2) if $y$ is black and $z$ is an inner grandchild (a "triangle"), rotate at the parent to turn it into case 3;
(3) if $y$ is black and $z$ is an outer grandchild (a "line"), colour the parent black and the grandparent red and rotate at the grandparent — the loop ends.

Finally colour the root black. The result is a red–black tree; the insertion takes $O(\log n)$ time and performs **at most two rotations**.`,
      idea: String.raw`A red leaf leaves every black height unchanged, so property (iii) holds throughout; the only possible damage is one red–red edge between $z$ and its parent (or a red root). Each case preserves that invariant: case 1 only recolours, keeping black heights, and pushes the violation two levels up, so it repeats at most $O(\log n)$ times by 5.7; cases 2 and 3 rotate (5.5) and recolour so that the violation disappears and black heights are kept, after which the loop stops. Hence at most two rotations per insertion.`,
      caption: String.raw`Choose a key and press **Insert** (or **Insert ascending**, the input that turns a plain BST into a path), then step through the fix-up. The gold ring is $z$; a red edge is the one red–red violation the loop carries upward. Every node is checked at every step: its black height is shown beside it, and an orange ring would flag a node whose two sides disagree.`,
      deps: ['algo-5.5', 'algo-5.7'],
      refs: ['CLRS 4e §13.3'],
      credit: 'Guibas & Sedgewick, 1978',
      tags: ['balanced trees'],
      viz(v) {
        let tree = rbBuild([11, 2, 14, 1, 7, 15, 5, 8]);
        const key = v.slider('key $k$', 1, 99, 4, { int: true });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 360 });
        let run = rbInsertFrames(tree, 4); tree = run.root;
        const S = v.steps({ frames: run.F, code: RB_CODE, codeTitle: 'RB-Insert (case labels assume z.p is a left child)', transition: 0.45, speed: 1, start: 1, still: 1 });
        const go = (k) => { run = rbInsertFrames(tree, k); tree = run.root; S.reset(run.F, { at: 0 }); S.play(); };
        v.button('Insert', () => go(key.value));
        v.button('Insert ascending', () => { const m = tree ? Math.max(...keysOf(tree)) : 0; if (m < 99) { key.set(m + 1); go(m + 1); } });
        v.button('Random tree', () => { const r = v.rng(Math.floor(Math.random() * 1e6)), ks = new Set(); while (ks.size < 14) ks.add(r.int(1, 99)); tree = rbBuild([...ks]); run = { F: [{ L: layT(tree), cases: [], rot: 0, k: null, line: 12, note: 'A red–black tree built from 14 random keys.' }] }; S.reset(run.F); });
        v.button('Empty', () => { tree = null; run = { F: [{ L: layT(null), cases: [], rot: 0, k: null, note: 'The empty tree.' }] }; S.reset(run.F); });
        let info = null;
        v.render(() => {
          const f = S.frame, rootC = f.L.nodes.find((c) => c.p == null), chk = rbCheck(rootC ? rootC.n : null);
          drawT(s, f.L, {
            prev: S.prev && S.prev.L, tw: S.tween, nil: true, rmax: 14,
            fill: (k, c) => (c.n.c === 'R' ? 'red' : 'ink'), ring: (k) => (chk.bad.has(k) ? 'orange' : k === f.z ? 'gold' : null),
            note: (k) => (f.L.n <= 22 ? (chk.bad.has(k) ? ['≠', 'orange', 'ne'] : [String(chk.bh.get(k)), 'muted', 'ne']) : null),
            edgeColor: (a, b) => (chk.redred.has(b) ? 'red' : null), edgeWidth: (a, b) => (chk.redred.has(b) ? 4.5 : null),
          });
          info = { f, chk };
        });
        v.legend([['gold', 'z', { dot: true }], ['red', 'red node / red–red edge', { dot: true }], ['ink', 'black node', { dot: true }], ['muted', 'black height', { dot: true }]]);
        v.readout(() => {
          const { f, chk } = info, n = f.L.n, h = n ? f.L.h + 1 : 0;
          const cs = f.cases && f.cases.length ? f.cases.join(' → ') : '—';
          return `${f.k != null ? `insert ${f.k} · ` : ''}cases so far: ${cs} · rotations ${f.rot ?? 0} (never more than 2) · equal black heights at all ${n} nodes ${chk.bad.size ? '✗' : '✓'} · red–red edges: ${chk.redred.size}${chk.redred.size ? ' (only at $z$, as the loop invariant allows)' : ' ✓'} · height $h = ${h} \\le 2\\log_2(n+1) = ${v.fix(2 * LG(n + 1), 2)}$ ✓`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.9
    {
      num: '5.9',
      kind: 'Definition',
      name: 'AVL trees',
      statement: String.raw`An **AVL tree** is a binary search tree in which, at every node, the heights of the left and right subtrees differ by at most one; the difference $\mathrm{bf}(x)=h(x.\mathit{left})-h(x.\mathit{right})\in\{-1,0,+1\}$ is the node's **balance factor** (an empty subtree has height 0). After an insertion, the lowest ancestor whose balance factor became $\pm2$ is repaired by a single rotation (if the new key lies in an outer grandchild subtree) or a double rotation (inner grandchild), which restores the subtree's former height, so one repair suffices. An AVL tree with $n$ nodes has height
$$h<1.4405\,\log_2(n+2)-0.3277.$$`,
      idea: String.raw`Let $N(h)$ be the fewest nodes in an AVL tree of height $h$. The sparsest tree has subtrees of heights $h-1$ and $h-2$, so $N(h)=N(h-1)+N(h-2)+1$ with $N(1)=1$, $N(2)=2$; then $N(h)+1$ satisfies the Fibonacci recurrence and $N(h)=F_{h+2}-1\ge\varphi^{h}/\sqrt5-2$ by the closed form of linear recurrences (2.11). Inverting gives the bound with $1/\log_2\varphi=1.4405$. These sparsest trees, the *Fibonacci trees*, are the gold points on the right. Rebalancing uses the rotations of 5.5.`,
      caption: String.raw`Insert keys (try **Insert ascending**) and step through: the numbers beside the nodes are balance factors, a red ring marks a node that reached $\pm2$, gold is the new key and orange the node a rotation lifted. The right panel records the height after every insertion against the AVL bound. Switch to **plain BST** to see the same keys without rebalancing, or load a **Fibonacci tree**, the sparsest AVL tree of its height.`,
      deps: ['algo-5.5', 'algo-2.11'],
      refs: ['CLRS 4e Prob. 13-3'],
      credit: 'Adelson-Velsky & Landis, 1962',
      tags: ['balanced trees'],
      viz(v) {
        const mode = v.select('', [{ value: 'avl', label: 'AVL: rebalance' }, { value: 'bst', label: 'plain BST' }], 'avl', { onChange: () => replay() });
        const key = v.slider('key $k$', 1, 99, 50, { int: true });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 310, weight: 1.7, minWidth: 360 });
        const P = v.stage({ x: [0, 34], y: [0, 12.5], axes: 'box', height: 310, minWidth: 220, title: 'height after each insertion', xlabel: 'n' });
        let seq = [10, 20, 30, 40, 50, 60, 70, 80], tree = null, hist = [], tot = { single: 0, double: 0 };
        const on = () => mode.value === 'avl';
        function replay(lastFrames = true) {
          tree = null; hist = []; tot = { single: 0, double: 0 }; let F = null;
          seq.forEach((k, i) => { const r = avlInsertFrames(tree, k, on()); tree = r.root; tot.single += r.st.single; tot.double += r.st.double; hist.push([i + 1, hgt(tree)]); if (i === seq.length - 1) F = r.F; });
          if (S) S.reset(lastFrames && F ? F : [{ L: snapT(tree), k: null, note: 'Rebuilt.' }], { at: 'end' });
          return F;
        }
        let S = null;
        seq.push(75); const F0 = replay();
        S = v.steps({ frames: F0, code: AVL_CODE, codeTitle: 'AVL insertion', codePos: 'below', transition: 0.45, speed: 1, start: 1, still: 1 });
        const ins = (k) => { const r = avlInsertFrames(tree, k, on()); if (r.F.length && r.root !== tree) { seq.push(k); tree = r.root; tot.single += r.st.single; tot.double += r.st.double; hist.push([seq.length, hgt(tree)]); } S.reset(r.F, { at: 0 }); S.play(); };
        v.button('Insert', () => ins(key.value));
        v.button('Insert ascending', () => { const m = seq.length ? Math.max(...seq) : 0; if (m < 99) { key.set(m + 1); ins(m + 1); } });
        v.button('Fibonacci tree', () => { seq = bfsKeys(fibTree(6)); replay(false); });
        v.button('Empty', () => { seq = []; replay(false); });
        let info = null;
        v.render(() => {
          const f = S.frame, rootC = f.L.nodes.find((c) => c.p == null), H = heightsOf(rootC ? rootC.n : null), bad = new Set(f.badSet || []);
          const bf = (c) => (c.n.l ? H.get(c.n.l.k) : 0) - (c.n.r ? H.get(c.n.r.k) : 0);
          drawT(s, f.L, {
            prev: S.prev && S.prev.L, tw: S.tween, rmax: 14,
            fill: (k) => (k === f.newk ? 'gold' : k === f.rotated ? 'orange' : null),
            ring: (k, c) => (k === f.bad || Math.abs(bf(c)) > 1 ? 'red' : null),
            note: (k, c) => { const b = bf(c); return [b > 0 ? '+' + b : b < 0 ? '−' + -b : '0', Math.abs(b) > 1 ? 'red' : 'muted', 'ne']; },
          });
          // plot
          const n = hist.length, hmax = Math.max(6, ...hist.map((p) => p[1]));
          P.setView([0, Math.max(34, n + 1)], [0, Math.max(12.5, hmax + 1)]);
          P.fn((m) => Math.ceil(LG(m + 1)), { color: 'faint', width: 1.4, domain: [1, 200] });
          P.fn((m) => 1.4405 * LG(m + 2) - 0.3277, { color: 'red', width: 2, dash: [7, 4], domain: [0, 200] });
          for (let h = 1, a = 1, b = 2; h <= 12; h++) { const N = h === 1 ? 1 : h === 2 ? 2 : (() => { const c = a + b + 1; a = b; b = c; return c; })(); if (N <= 200) P.dot(N, h, { r: 4.5, color: 'gold' }); }
          P.path(hist.map(([m, h]) => [m, h]), { color: 'accent', width: 1.6, alpha: 0.6 });
          hist.forEach(([m, h]) => P.dot(m, h, { r: 3, color: h > 1.4405 * LG(m + 2) - 0.3277 ? 'red' : 'accent' }));
          info = { f, H, bad: f.L.nodes.filter((c) => Math.abs(bf(c)) > 1).length };
        });
        v.legend([['gold', 'new key / Fibonacci trees', { dot: true }], ['orange', 'lifted by a rotation', { dot: true }], ['red', '$|\\mathrm{bf}| = 2$ / bound $1.44\\log_2(n+2)-0.33$', { dot: true }], ['accent', 'measured height', { dot: true }]]);
        v.readout(() => {
          const { f, bad } = info, n = f.L.n, h = n ? f.L.h + 1 : 0, B = 1.4405 * LG(n + 2) - 0.3277;
          const mid = on() && !S.atEnd && bad > 0 ? '**mid-repair** (step to the end) · ' : '';
          return mid + `$n = ${n}$, height $h = ${h}$ levels · AVL bound $1.4405\\log_2(n+2)-0.3277 = ${v.fix(B, 2)}$ ${h < B ? '✓' : '✗ exceeded'} · nodes with $|\\mathrm{bf}| \\ge 2$: ${bad}${bad ? '' : ' ✓'} · rotations in this build: ${tot.single} single, ${tot.double} double`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.10
    {
      num: '5.10',
      kind: 'Definition',
      name: 'B-trees',
      statement: String.raw`A **B-tree of minimum degree** $t\ge2$ is a rooted search tree in which
(i) every node holds between $t-1$ and $2t-1$ keys in increasing order (the root at least one), and an internal node with $m$ keys has $m+1$ children, the keys of the $i$-th child lying between the node's $(i-1)$-st and $i$-th keys;
(ii) all leaves have the same depth $h$, the height.

Since level $i\ge1$ has at least $2t^{i-1}$ nodes with at least $t-1$ keys each, $n\ge 2t^h-1$, i.e. $h\le\log_t\frac{n+1}{2}$. Insertion walks down from the root, splitting every full node it meets around its median (which moves up into the parent), and adds the key to a leaf; the tree grows only at the root.`,
      idea: String.raw`Splitting full nodes on the way down guarantees that the parent of any node being split has room for the median, so one downward pass suffices. A split keeps both halves at depth unchanged; only a root split adds a level, and it adds it above *every* leaf at once, which is why all leaves stay at the same depth. With $t$ in the hundreds, a node fills a disk page and a search touches $h+1\approx\log_t n$ pages; $t=2$ gives 2-3-4 trees, the shape behind red–black trees (5.6).`,
      caption: String.raw`Insert keys (random or ascending) and step through: green is the node being visited, orange the two halves of a split and gold the parent that received the median. The dashed line shows every leaf at the same depth. Change $t$ to rebuild the same keys with wider nodes. Below: heights while inserting 20 000 random keys for $t = 2, 3, 5, 10$ against $\log_t\frac{n+1}{2}$.`,
      deps: ['algo-5.2'],
      refs: ['CLRS 4e §18.1', 'CLRS 4e §18.2'],
      credit: 'Bayer & McCreight, 1970',
      tags: ['balanced trees'],
      viz(v) {
        const tS = v.select('$t$', ['2', '3', '5'], '2', { onChange: () => replay() });
        const key = v.slider('key $k$', 1, 99, 50, { int: true });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, full: true });
        const P = v.stage({ x: [1, 20000], y: [0, 14], xlog: true, axes: 'box', height: 220, full: true, title: 'height while inserting random keys (solid) and the bound $\\log_t\\frac{n+1}{2}$ (dashed)', xlabel: 'n' });
        const rng0 = v.rng(41); let seq = []; while (seq.length < 18) { const k = rng0.int(1, 99); if (!seq.includes(k)) seq.push(k); }
        let root = null;
        function replay() {
          const t = +tS.value; root = null; for (const k of seq.slice(0, -1)) root = btInsert(root, k, t);
          const F = []; root = btInsert(root, seq[seq.length - 1], t, F); if (S) S.reset(F, { at: Math.max(0, F.findIndex((f) => f.mk != null)) }); return F;
        }
        let S = null; const F0 = replay();
        S = v.steps({ frames: F0, code: BT_CODE, codeTitle: 'B-Tree-Insert', codePos: 'below', speed: 1.2, start: Math.max(0, F0.findIndex((f) => f.mk != null)) });
        const ins = (k) => { const t = +tS.value, F = []; if (!btHas(root, k)) seq.push(k); root = btInsert(root, k, t, F); S.reset(F, { at: 0 }); S.play(); };
        v.button('Insert', () => ins(key.value));
        v.button('Insert random', () => { const free = []; for (let k = 1; k <= 99; k++) if (!btHas(root, k)) free.push(k); if (free.length) { const k = free[Math.floor(Math.random() * free.length)]; key.set(k); ins(k); } });
        v.button('Insert ascending', () => { const m = seq.length ? Math.max(...seq) : 0; if (m < 99) { key.set(m + 1); ins(m + 1); } });
        v.button('Reset', () => { seq = []; root = null; S.reset([{ root: null, note: 'The empty B-tree.' }]); });
        // height curves
        const TS = [2, 3, 5, 10], COL = { 2: 'accent', 3: 'teal', 5: 'purple', 10: 'orange' }, curves = {};
        for (const t of TS) { const r = v.rng(900 + t); let b = null; const pts = []; let last = -1; for (let n = 1; n <= 20000; n++) { b = btInsert(b, Math.floor(r() * 1e9), t); let h = 0; for (let u = b; u.kids.length; u = u.kids[0]) h++; if (h !== last) { if (pts.length) pts.push([n, last]); pts.push([n, h]); last = h; } } pts.push([20000, last]); curves[t] = pts; }
        let info = null;
        v.render(() => {
          const f = S.frame, rt = f.root, t = +tS.value, cw = 1, gap = 0.7, lev = 1.75, boxes = []; let cur = 0;
          const go = (u, d) => { const w = Math.max(1, u.keys.length) * cw; let b; if (!u.kids.length) { b = { u, x0: cur, d, w }; cur += w + gap; } else { const ch = u.kids.map((c) => go(c, d + 1)); const mid = (ch[0].x0 + ch[ch.length - 1].x0 + ch[ch.length - 1].w) / 2; b = { u, x0: mid - w / 2, d, w, ch }; } boxes.push(b); return b; };
          if (rt) go(rt, 0);
          const W = Math.max(cur - gap, 6), Hd = Math.max(0, ...boxes.map((b) => b.d));
          s.setView([-0.8, W + 0.8], [-Hd * lev - 1.1, 0.75]);
          const fs = clamp(s.sx * 0.45, 8, 13.5);
          for (const b of boxes) if (b.ch) b.ch.forEach((c, i) => { const x = b.x0 + i * cw; s.line(x, -b.d * lev - 0.36, c.x0 + c.w / 2, -c.d * lev + 0.36, { color: 'muted', width: 1.4 }); s.dot(x, -b.d * lev - 0.36, { r: 2.4, color: 'muted', ring: false }); });
          if (rt) { s.line(-0.6, -Hd * lev - 0.62, W + 0.6, -Hd * lev - 0.62, { color: 'green', width: 1.2, dash: [5, 4] }); s.text(`all leaves at depth h = ${Hd}`, W + 0.6, -Hd * lev - 0.62, { align: 'right', baseline: 'top', dy: 3, size: 11, color: 'green', weight: 600 }); }
          for (const b of boxes) {
            const y = -b.d * lev, hl = b.u.hl, col = hl === 'split' ? 'orange' : hl === 'up' ? 'gold' : hl === 'cur' || hl === 'new' ? 'green' : null;
            b.u.keys.forEach((k, i) => {
              const x = b.x0 + i * cw, star = (k === f.mk && hl === 'up') || k === f.newk;
              s.rect(x, y - 0.36, x + cw, y + 0.36, { fill: star ? 'gold' : col || 'panel', fillAlpha: star ? 0.5 : col ? 0.14 : 1, color: 'faint', width: 1 });
              s.text(String(k), x + cw / 2, y, { align: 'center', size: fs, weight: 700, color: 'ink' });
            });
            s.rect(b.x0, y - 0.36, b.x0 + b.w, y + 0.36, { color: col || 'muted', width: col ? 2.6 : 1.5 });
          }
          if (!rt) s.text('empty tree', W / 2, 0, { align: 'center', size: 13, color: 'muted' });
          // plot
          for (const tt of TS) {
            const a = tt === t ? 1 : 0.35;
            P.fn((n) => Math.log((n + 1) / 2) / Math.log(tt), { color: COL[tt], width: tt === t ? 2 : 1.3, dash: [6, 4], alpha: a, domain: [1, 20000] });
            P.path(curves[tt], { color: COL[tt], width: tt === t ? 2.6 : 1.5, alpha: a });
            const last = curves[tt][curves[tt].length - 1]; P.text(`t = ${tt}`, 20000, last[1], { align: 'right', baseline: 'bottom', dy: -3, size: 11.5, weight: 700, color: COL[tt], alpha: Math.max(a, 0.6) });
          }
          const st = rt ? btStats(rt) : null;
          if (st && st.n) P.dot(st.n, st.h, { r: 5, color: COL[t] });
          info = { st, t };
        });
        v.legend([['green', 'visited node / leaf level'], ['orange', 'split halves'], ['gold', 'receives the median', { area: true }]]);
        v.readout(() => {
          const { st, t } = info; if (!st) return 'Empty tree: insert a key.';
          const occ = st.n <= 2 * t - 1 || (st.minK >= t - 1 && st.maxK <= 2 * t - 1), B = Math.log((st.n + 1) / 2) / Math.log(t);
          return `$n = ${st.n}$ keys, $t = ${t}$ · non-root nodes hold ${st.minK === Infinity ? '—' : st.minK}–${st.maxK} keys, within $[t-1, 2t-1] = [${t - 1}, ${2 * t - 1}]$ ${occ ? '✓' : '✗'} · leaves all at depth ${[...st.leafD].join(', ')} ${st.leafD.size === 1 ? '✓' : '✗'} · $h = ${st.h} \\le \\log_t\\frac{n+1}{2} = ${v.fix(B, 2)}$ ${st.h <= B + 1e-9 ? '✓' : '✗'} · a search reads at most $h+1 = ${st.h + 1}$ nodes`;
        });
      },
    },
  ],
};
