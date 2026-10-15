// Tree kit — hierarchies: phylogenies, language families, syntax and decision trees, dendrograms. Reference: docs/kits-world.md.
//
//   const T = v.tree(stage, { data: '((A:1,B:2)AB:1,C:3);', layout: 'rect', lengths: true });
//   v.render(() => T.draw({ highlight: ['A', 'C'] }));
//
// Data: a Newick string, a nested object {name, length, children} (aliases: label, len, kids), nested arrays
// ([['A', 'B'], 'C']), or a tree built by v.trees('nj' | 'upgma', D, names). Layouts: 'rect' (cladogram/phylogram,
// orientation 'right' | 'left' | 'down' | 'up'; 'down' with lengths = dendrogram), 'radial' (circular, rotated labels),
// 'tidy' (top-down tidy tree for syntax and decision trees; node boxes sized to their labels), 'unrooted' (equal-angle,
// for neighbour-joining trees). lengths: true uses branch lengths, false aligns the leaves. Leaf labels never overlap:
// the font shrinks to the leaf spacing and, below 7 px, labels are thinned greedily. Click an internal node to collapse
// it into a wedge, click leaves to highlight the path between the last two (T.selected) — or pass draw({highlight}).
// DOM-free helpers (newick, toNewick, upgma, nj, patristic, mrca, path, midpoint, leaves) are reachable as v.trees(name, ...).

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const FONT = (size, w = 500, it = false) => `${it ? 'italic ' : ''}${w} ${size}px Inter, system-ui, sans-serif`;
const TAU = 2 * Math.PI;

// ------------------------------------------------------------------ data (DOM-free)
/** Parse Newick: '((A:0.1,B:0.2)AB:0.3,C:0.4)root;' → {name, length, children}. Quoted names and [comments] are supported. */
export function newick(str) {
  const s = String(str).replace(/\[[^\]]*\]/g, '').trim(); let i = 0;
  const name = () => {
    while (s[i] === ' ' || s[i] === '\n') i++;
    if (s[i] === "'") { let out = ''; i++; while (i < s.length) { if (s[i] === "'" && s[i + 1] === "'") { out += "'"; i += 2; } else if (s[i] === "'") { i++; break; } else out += s[i++]; } return out; }
    let out = ''; while (i < s.length && !',():;'.includes(s[i])) out += s[i++]; return out.trim().replace(/_/g, ' ');
  };
  const node = () => {
    const n = { name: '', children: [] }; while (s[i] === ' ' || s[i] === '\n') i++;
    if (s[i] === '(') { i++; do { while (s[i] === ' ' || s[i] === '\n') i++; n.children.push(node()); while (s[i] === ' ' || s[i] === '\n') i++; } while (s[i] === ',' && ++i); if (s[i] !== ')') throw new Error(`v.trees: Newick expected ')' at ${i}`); i++; }
    n.name = name(); while (s[i] === ' ') i++;
    if (s[i] === ':') { i++; let num = ''; while (i < s.length && /[0-9eE+\-.]/.test(s[i])) num += s[i++]; n.length = parseFloat(num); }
    return n;
  };
  const root = node(); return finalize(root);
}
/** Tree → Newick string (lengths rounded to `digits`). */
export function toNewick(t, digits = 6) {
  const q = (s) => (/[\s,():;'[\]]/.test(s) ? `'${s.replace(/'/g, "''")}'` : s);
  const go = (n) => `${n.children.length ? `(${n.children.map(go).join(',')})` : ''}${q(n.name || '')}${n.length != null && n.parent ? ':' + +n.length.toFixed(digits) : ''}`;
  return go(t) + ';';
}
/** Normalise any supported input into a tree with parent links, ids, depth (edges) and dist (sum of lengths). */
export function finalize(t) {
  const conv = (x) => {
    if (Array.isArray(x)) return { name: '', children: x.map(conv) };
    if (typeof x !== 'object' || x == null) return { name: String(x), children: [] };
    return { ...x, name: x.name ?? x.label ?? '', length: x.length ?? x.len ?? x.branch, children: (x.children || x.kids || []).map(conv) };
  };
  const root = conv(t); // always a fresh normalised copy (strings → leaves, arrays → unnamed internal nodes)
  let id = 0;
  const walk = (n, p, depth, dist) => { n.parent = p; n.id = id++; n.depth = depth; n.dist = dist; n.children ||= []; for (const c of n.children) walk(c, n, depth + 1, dist + (c.length ?? 1)); };
  walk(root, null, 0, 0); return root;
}
export const nodes = (t) => { const out = [], st = [t]; while (st.length) { const n = st.pop(); out.push(n); for (let k = n.children.length - 1; k >= 0; k--) st.push(n.children[k]); } return out; };
/** Leaves in left-to-right order. */
export const leaves = (t) => nodes(t).filter((n) => !n.children.length);
export const find = (t, name) => nodes(t).find((n) => n.name === name) || null;
const ancestors = (n) => { const out = []; for (let p = n; p; p = p.parent) out.push(p); return out; };
/** Most recent common ancestor of two nodes (or names). */
export function mrca(t, a, b) { a = typeof a === 'string' ? find(t, a) : a; b = typeof b === 'string' ? find(t, b) : b; if (!a || !b) return null; const A = new Set(ancestors(a)); for (const p of ancestors(b)) if (A.has(p)) return p; return null; }
/** Path a → … → mrca → … → b as a list of nodes. */
export function path(t, a, b) { a = typeof a === 'string' ? find(t, a) : a; b = typeof b === 'string' ? find(t, b) : b; const m = mrca(t, a, b); if (!m) return []; const up = []; for (let p = a; p !== m; p = p.parent) up.push(p); const down = []; for (let p = b; p !== m; p = p.parent) down.push(p); return [...up, m, ...down.reverse()]; }
/** Sum of branch lengths between two nodes. */
export function distance(t, a, b) { a = typeof a === 'string' ? find(t, a) : a; b = typeof b === 'string' ? find(t, b) : b; const m = mrca(t, a, b); return m ? a.dist + b.dist - 2 * m.dist : NaN; }
/** Patristic distance matrix between leaves (in leaf order, or in the order of `names`). */
export function patristic(t, names) { const L = names ? names.map((n) => find(t, n)) : leaves(t); return L.map((a) => L.map((b) => distance(t, a, b))); }

/** UPGMA (average linkage) on a symmetric distance matrix → ultrametric rooted tree (node.height = half the cluster distance). */
export function upgma(D, names = D.map((_, i) => String.fromCharCode(65 + i))) {
  let C = names.map((name, i) => ({ node: { name, children: [], height: 0 }, size: 1, i }));
  const d = D.map((r) => r.slice());
  let k = names.length;
  while (C.length > 1) {
    let bi = 0, bj = 1, bd = Infinity;
    for (let a = 0; a < C.length; a++) for (let b = a + 1; b < C.length; b++) { const x = d[C[a].i][C[b].i]; if (x < bd - 1e-12) { bd = x; bi = a; bj = b; } }
    const A = C[bi], B = C[bj], h = bd / 2, node = { name: '', children: [A.node, B.node], height: h };
    A.node.length = h - A.node.height; B.node.length = h - B.node.height;
    const row = d.map((r, q) => (A.size * d[A.i][q] + B.size * d[B.i][q]) / (A.size + B.size)); d.push(row); d.forEach((r, q) => r.push(row[q])); d[k][k] = 0;
    const merged = { node, size: A.size + B.size, i: k++ }; C = C.filter((_, q) => q !== bi && q !== bj); C.push(merged);
  }
  return finalize(C[0].node);
}
/** Neighbour joining (Saitou & Nei 1987) → tree whose root sits on the last joined edge (it is unrooted in meaning). Negative lengths are clamped to 0. */
export function nj(D, names = D.map((_, i) => String.fromCharCode(65 + i)), o = {}) {
  const d = D.map((r) => r.slice()); let act = names.map((name, i) => ({ node: { name, children: [] }, i })), k = names.length; const joins = [];
  while (act.length > 2) {
    const r = act.length, S = act.map((a) => act.reduce((s, b) => s + d[a.i][b.i], 0));
    let bi = 0, bj = 1, bq = Infinity;
    for (let a = 0; a < r; a++) for (let b = a + 1; b < r; b++) { const q = (r - 2) * d[act[a].i][act[b].i] - S[a] - S[b]; if (q < bq - 1e-12) { bq = q; bi = a; bj = b; } }
    const A = act[bi], B = act[bj], dab = d[A.i][B.i], la = dab / 2 + (S[bi] - S[bj]) / (2 * (r - 2)), lb = dab - la;
    A.node.length = Math.max(0, la); B.node.length = Math.max(0, lb);
    const node = { name: '', children: [A.node, B.node] }, row = d.map((rw, q) => (d[A.i][q] + d[B.i][q] - dab) / 2);
    d.push(row); d.forEach((rw, q) => rw.push(row[q])); d[k][k] = 0;
    joins.push({ a: A.node, b: B.node, la, lb, q: bq });
    act = act.filter((_, q) => q !== bi && q !== bj); act.push({ node, i: k++ });
  }
  const [A, B] = act, L = d[A.i][B.i]; let root;
  if (A.node.children.length) { B.node.length = Math.max(0, L); A.node.children.push(B.node); root = A.node; } else if (B.node.children.length) { A.node.length = Math.max(0, L); B.node.children.push(A.node); root = B.node; } else { A.node.length = B.node.length = L / 2; root = { name: '', children: [A.node, B.node] }; }
  const t = finalize(root); t.joins = joins; return o.midpoint ? midpoint(t) : t;
}
/** Re-root at the midpoint of the longest leaf-to-leaf path. */
export function midpoint(t) {
  const L = leaves(t); let best = [null, null, -1];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const x = distance(t, L[i], L[j]); if (x > best[2]) best = [L[i], L[j], x]; }
  const [a, b, D] = best; if (!a) return t; const P = path(t, a, b); let acc = 0, half = D / 2;
  // walk from a towards b until the midpoint falls on edge (u, w)
  for (let k = 0; k + 1 < P.length; k++) {
    const u = P[k], w = P[k + 1], e = u.parent === w ? u.length ?? 1 : w.length ?? 1;
    if (acc + e >= half - 1e-12) return reroot(t, u, w, half - acc);
    acc += e;
  }
  return t;
}
/** Re-root on the edge between adjacent nodes u and w, at distance x from u. */
export function reroot(t, u, w, x) {
  const adj = new Map(); const add = (p, q, l) => { (adj.get(p) || adj.set(p, []).get(p)).push([q, l]); };
  for (const n of nodes(t)) for (const c of n.children) { add(n, c, c.length ?? 1); add(c, n, c.length ?? 1); }
  const e = (adj.get(u).find(([q]) => q === w) || [null, 1])[1], root = { name: '', children: [] };
  const build = (n, from, len) => { const m = { ...n, children: [], length: len }; delete m.parent; for (const [q, l] of adj.get(n) || []) if (q !== from) m.children.push(build(q, n, l)); return m; };
  root.children.push(build(u, w, x), build(w, u, e - x));
  const t2 = finalize(collapseUnary(root)); return t2;
}
/** Non-trivial splits (bipartitions) of the leaf set, as sorted name strings, canonicalised to the side without the first leaf. */
export function splits(t) {
  const all = leaves(t).map((n) => n.name).sort(), first = all[0], out = new Set();
  for (const n of nodes(t)) { if (!n.parent || !n.children.length) continue; let side = leaves(n).map((q) => q.name); if (side.includes(first)) side = all.filter((x) => !side.includes(x)); if (side.length > 1 && side.length < all.length - 1) out.add(side.sort().join('|')); }
  return out;
}
/** Robinson–Foulds distance (unrooted): number of splits in one tree but not the other. */
export function rf(a, b) { const A = splits(a), B = splits(b); let d = 0; for (const x of A) if (!B.has(x)) d++; for (const x of B) if (!A.has(x)) d++; return d; }
function collapseUnary(n) { n.children = n.children.map(collapseUnary); if (n.parent !== undefined) delete n.parent; return n.children.length === 1 && !n.name && n.length != null ? Object.assign(n.children[0], { length: (n.children[0].length ?? 0) + n.length }) : n; }

// ================================================================== layouts (pixel space)
function measure(ctx, str, size, w = 500, it = false) { ctx.save(); ctx.font = FONT(size, w, it); const x = ctx.measureText(str).width; ctx.restore(); return x; }
class Tree {
  constructor(api, rt, stage, spec = {}) {
    if (!stage || typeof stage.X !== 'function') throw new Error('v.tree(stage, spec): the first argument must be a 2D stage');
    this.api = api; this.rt = rt; this.s = stage; stage.o.axes = false; stage.o.grid = false;
    this.o = { layout: 'rect', orientation: 'right', lengths: null, fontSize: 12.5, collapsible: true, selectable: true, internalLabels: false, scaleBar: null, ...spec };
    this.set(spec.data ?? spec.tree ?? spec.newick);
    this.selected = []; this.onSelect = spec.onSelect || null; this._pos = new Map(); this._bind();
  }
  /** Replace the tree (any supported input). */
  set(data) {
    if (data == null) data = { name: '', children: [] };
    this.root = typeof data === 'string' ? newick(data) : data.id != null && data.dist != null ? data : finalize(data);
    if (this.o.collapsed) for (const nm of this.o.collapsed) { const n = find(this.root, nm); if (n) n.collapsed = true; }
    this.rt.invalidate(); return this;
  }
  get leaves() { return leaves(this.root); }
  find(name) { return find(this.root, name); }
  mrca(a, b) { return mrca(this.root, a, b); }
  path(a, b) { return path(this.root, a, b); }
  distance(a, b) { return distance(this.root, a, b); }
  toggle(n) { n = typeof n === 'string' ? this.find(n) : n; if (n && n.children.length) { n.collapsed = !n.collapsed; this.rt.invalidate(); } return this; }
  get useLengths() { return this.o.lengths ?? nodes(this.root).some((n) => n.parent && n.length != null && n.length !== 1); }
  /** Visible leaves (collapsed clades count as one). */
  _vis() { const out = [], go = (n) => { if (!n.children.length || n.collapsed) out.push(n); else n.children.forEach(go); }; go(this.root); return out; }
  _kids(n) { return n.collapsed ? [] : n.children; }
  _label(n) { return n.collapsed ? `${n.name || 'clade'} (${leaves(n).length})` : n.name; }
  _bind() {
    const s = this.s;
    s.onClick((x, y) => {
      const px = s.X(x), py = s.Y(y); let best = null, bd = 12;
      for (const [n, p] of this._pos) { const d = Math.hypot(p[0] - px, p[1] - py) - (p.r || 0); if (d < bd) { bd = d; best = n; } }
      for (const [n, b] of this._lab || []) if (px >= b[0] && px <= b[2] && py >= b[1] && py <= b[3]) { best = n; break; }
      if (!best) { this.selected = []; this.onSelect?.(this.selected); return; }
      if (best.children.length && this.o.collapsible && !(best.collapsed && false)) { this.toggle(best); return; }
      if (this.o.selectable) { this.selected = [...this.selected.filter((q) => q !== best), best].slice(-2); this.onSelect?.(this.selected); }
    });
    s.canvas.style.cursor = 'pointer';
  }
  // ---------------------------------------------------------------- draw
  /**
   * Draw the tree. o: {layout, orientation, highlight: [nameA, nameB] | name | [nodes], colors: {cladeName: colour},
   * internalLabels, labels (true), nodes (dots, default: internal only when collapsible), scaleBar, edgeColor, width}.
   */
  draw(o = {}) {
    const op = { ...this.o, ...o }, s = this.s, c = s.ctx, W = s.width, H = s.height, col = (n, a) => this.api.color(n, a);
    this._pos = new Map(); this._lab = [];
    // highlighted path
    let hl = op.highlight ?? (this.selected.length ? this.selected : null), hlSet = new Set();
    if (hl) { const hs = (Array.isArray(hl) ? hl : [hl]).map((x) => (typeof x === 'string' ? this.find(x) : x)).filter(Boolean); if (hs.length >= 2) for (const n of path(this.root, hs[0], hs[1])) hlSet.add(n); else if (hs.length === 1) for (const n of ancestors(hs[0])) hlSet.add(n); this._hl = hs; } else this._hl = [];
    // clade colours (nearest coloured ancestor)
    const cmap = new Map(); if (op.colors) for (const [nm, cl] of Object.entries(op.colors)) { const n = this.find(nm); if (n) for (const d of nodes(n)) cmap.set(d, cl); }
    // (later colourings of nested clades win because nodes() visits ancestors first)
    const edgeCol = (n) => (hlSet.has(n) && hlSet.has(n.parent) ? 'accent' : cmap.get(n) || op.edgeColor || 'muted');
    const edgeW = (n) => (hlSet.has(n) && hlSet.has(n.parent) ? (op.width ?? 1.6) + 1.6 : op.width ?? 1.6);
    const L = op.layout;
    if (L === 'radial') this._radial(op, edgeCol, edgeW, cmap, hlSet);
    else if (L === 'tidy') this._tidy(op, edgeCol, edgeW, cmap, hlSet);
    else if (L === 'unrooted') this._unrooted(op, edgeCol, edgeW, cmap, hlSet);
    else this._rect(op, edgeCol, edgeW, cmap, hlSet);
    void c; void W; void H; void col;
    return this;
  }
  _text(str, X, Y, st = {}) { const c = this.s.ctx; c.save(); c.font = FONT(st.size || this.o.fontSize, st.weight || 500, st.italic); c.textAlign = st.align || 'left'; c.textBaseline = st.baseline || 'middle'; if (st.halo !== false) { c.lineWidth = 3.5; c.lineJoin = 'round'; c.strokeStyle = this.api.color('panel', 0.9); c.strokeText(str, X, Y); } c.fillStyle = this.api.color(st.color || 'ink', st.alpha); c.fillText(str, X, Y); c.restore(); }
  /** Internal-node label, skipped if it would overlap one already drawn (greedy, in drawing order). */
  _ilabel(str, X, Y, st, boxes) {
    const w = measure(this.s.ctx, str, st.size, 500, true), a = st.align || 'left', x0 = a === 'right' ? X - w : a === 'center' ? X - w / 2 : X, b = [x0 - 2, Y - st.size / 2 - 1, x0 + w + 2, Y + st.size / 2 + 1];
    if (b[0] < 0 || b[2] > this.s.width || boxes.some((q) => !(b[2] < q[0] || b[0] > q[2] || b[3] < q[1] || b[1] > q[3]))) return false;
    boxes.push(b); this._text(str, X, Y, { ...st, italic: true }); return true;
  }
  _seg(pts, color, w, alpha) { const c = this.s.ctx; c.save(); c.strokeStyle = this.api.color(color, alpha); c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); c.restore(); }
  _dot(n, X, Y, op, color) {
    const c = this.s.ctx, internal = n.children.length > 0, show = op.nodes ?? (internal && this.o.collapsible);
    this._pos.set(n, Object.assign([X, Y], { r: 3 }));
    if (!show && !(this._hl.includes(n))) return;
    c.beginPath(); c.arc(X, Y, internal ? (n.collapsed ? 4.5 : 3.2) : 3.4, 0, TAU);
    c.fillStyle = this.api.color(internal && !n.collapsed ? 'panel' : color); c.fill(); c.lineWidth = 1.5; c.strokeStyle = this.api.color(color); c.stroke();
  }
  /** Fit a font size to `gap` px between neighbouring labels, then thin labels greedily if still too dense. Returns {size, show(i)}. */
  _fit(gap, n) {
    const base = this.o.fontSize, size = clamp(gap - 1.5, 7, base); const step = gap >= 8.5 ? 1 : Math.ceil(8.5 / Math.max(gap, 0.1));
    return { size, show: (i) => i % step === 0, thinned: step > 1 };
  }
  _scaleBar(op, pxPerUnit, X, Y, align = 'left') {
    if (!(pxPerUnit > 0)) return;
    const target = 70 / pxPerUnit, p = 10 ** Math.floor(Math.log10(target)), m = target / p, u = (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p, w = u * pxPerUnit, x0 = align === 'left' ? X : X - w;
    this._seg([[x0, Y], [x0 + w, Y]], 'ink', 1.6); this._seg([[x0, Y - 3], [x0, Y + 3]], 'ink', 1.2); this._seg([[x0 + w, Y - 3], [x0 + w, Y + 3]], 'ink', 1.2);
    this._text(`${+u.toPrecision(3)}${op.unit ? ' ' + op.unit : ''}`, x0 + w / 2, Y - 9, { size: 11, color: 'muted', align: 'center' });
  }
  _rect(op, edgeCol, edgeW, cmap) {
    const s = this.s, c = s.ctx, W = s.width, H = s.height, vis = this._vis(), n = vis.length, orient = op.orientation || 'right', horiz = orient === 'right' || orient === 'left';
    const useLen = this.useLengths, depth = new Map(), height = new Map();
    const hgt = (u) => { if (height.has(u)) return height.get(u); const k = this._kids(u); const h = k.length ? 1 + Math.max(...k.map(hgt)) : 0; height.set(u, h); return h; };
    const H0 = hgt(this.root);
    const maxD = Math.max(1e-12, ...vis.map((u) => (useLen ? u.dist : 0)));
    const pos = (u) => (useLen ? u.dist / maxD : H0 ? (H0 - hgt(u)) / H0 : 0);
    // label room
    const scaleH = useLen && op.scaleBar !== false ? 22 : 0, pad = 10;
    const across = (horiz ? H : W) - 2 * pad - (horiz ? scaleH : 0), gap = across / Math.max(1, n);
    const fit = this._fit(horiz ? gap : Math.min(gap, 60), n), fs = horiz ? fit.size : Math.min(this.o.fontSize, Math.max(7, gap - 2));
    const labW = op.labels === false ? 0 : Math.max(0, ...vis.map((u) => measure(c, this._label(u), fs, 500, u.collapsed)));
    const along0 = pad, along1 = (horiz ? W : H) - pad - (horiz ? labW + 8 : (op.labels === false ? 0 : Math.min(labW, 80) + 10)) - (horiz ? 0 : scaleH);
    const leafIdx = new Map(vis.map((u, i) => [u, i]));
    const crossOf = new Map(); const cross = (u) => { if (crossOf.has(u)) return crossOf.get(u); const k = this._kids(u); const v = k.length ? (cross(k[0]) + cross(k[k.length - 1])) / 2 : pad + gap * (leafIdx.get(u) + 0.5); crossOf.set(u, v); return v; };
    const P = (u) => { const a = along0 + pos(u) * (along1 - along0), b = cross(u); return orient === 'right' ? [a, b] : orient === 'left' ? [W - a, b] : orient === 'down' ? [b, a] : [b, H - a]; };
    const all = nodes(this.root).filter((u) => !u.parent || !ancestors(u.parent).some((a) => a.collapsed));
    // edges: elbow from parent to child
    for (const u of all) {
      if (!u.parent) continue; const p = P(u.parent), q = P(u), mid = horiz ? [p[0], q[1]] : [q[0], p[1]];
      this._seg([p, mid, q], edgeCol(u), edgeW(u));
    }
    // collapsed wedges, labels, dots
    let lastShown = -1e9;
    vis.forEach((u, i) => {
      const q = P(u), color = cmap.get(u) || 'ink';
      if (u.collapsed) { const w = gap * 0.42, tip = horiz ? [q[0] + Math.min(40, (along1 - q[0]) * 0.6 + 14), q[1]] : [q[0], q[1] + 30]; c.save(); c.beginPath(); if (horiz) { c.moveTo(q[0], q[1]); c.lineTo(tip[0], q[1] - w); c.lineTo(tip[0], q[1] + w); } else { c.moveTo(q[0], q[1]); c.lineTo(q[0] - w, tip[1]); c.lineTo(q[0] + w, tip[1]); } c.closePath(); c.fillStyle = this.api.color(cmap.get(u) || 'muted', 0.25); c.fill(); c.strokeStyle = this.api.color(cmap.get(u) || 'muted', 0.8); c.lineWidth = 1.2; c.stroke(); c.restore(); }
      if (op.labels !== false && fit.show(i)) {
        const lab = this._label(u), off = u.collapsed ? (horiz ? Math.min(40, (along1 - q[0]) * 0.6 + 14) + 4 : 34) : 6, hlOn = this._hl.includes(u);
        const opts = { size: fs, color: hlOn ? 'accent' : color, weight: hlOn ? 700 : 500, italic: u.collapsed };
        if (orient === 'right') this._text(lab, q[0] + off, q[1], opts), this._lab.push([u, [q[0] + off, q[1] - fs / 2, q[0] + off + measure(c, lab, fs), q[1] + fs / 2]]);
        else if (orient === 'left') this._text(lab, q[0] - off, q[1], { ...opts, align: 'right' });
        else { const w = measure(c, lab, fs), X = q[0], Y = orient === 'down' ? q[1] + off : q[1] - off; if (gap >= fs + 2 || X - w / 2 > lastShown + 4) { if (gap < w + 4) { c.save(); c.translate(X, Y); c.rotate(orient === 'down' ? Math.PI / 2 : -Math.PI / 2); this._text(lab, 0, 0, { ...opts, align: 'left' }); c.restore(); } else this._text(lab, X, Y, { ...opts, align: 'center', baseline: orient === 'down' ? 'top' : 'bottom' }); lastShown = X + w / 2; } }
      }
    });
    const ib = [];
    for (const u of all) { const q = P(u); this._dot(u, q[0], q[1], op, cmap.get(u) || 'muted'); if (op.internalLabels && u.children.length && u.name && !u.collapsed) this._ilabel(u.name, q[0] + (horiz ? -4 : 6), q[1] + (horiz ? -9 : 0), { size: Math.min(11, fs), color: cmap.get(u) || 'muted', align: horiz ? 'right' : 'left' }, ib); }
    if (useLen && op.scaleBar !== false) this._scaleBar(op, (along1 - along0) / maxD, horiz ? pad : W - pad, horiz ? H - 10 : H - 10, horiz ? 'left' : 'right');
    this.layoutInfo = { fontSize: fs, thinned: fit.thinned, leaves: n };
  }
  _radial(op, edgeCol, edgeW, cmap) {
    const s = this.s, c = s.ctx, W = s.width, H = s.height, vis = this._vis(), n = vis.length, useLen = this.useLengths;
    const arc = (op.arc ?? 360) * Math.PI / 180, th0 = (op.start ?? 0) * Math.PI / 180, dth = arc / (arc >= TAU - 1e-9 ? n : Math.max(1, n - 1));
    const height = new Map(); const hgt = (u) => { if (height.has(u)) return height.get(u); const k = this._kids(u); const h = k.length ? 1 + Math.max(...k.map(hgt)) : 0; height.set(u, h); return h; };
    const H0 = hgt(this.root), maxD = Math.max(1e-12, ...vis.map((u) => (useLen ? u.dist : 0))), rel = (u) => (useLen ? u.dist / maxD : H0 ? (H0 - hgt(u)) / H0 : 0);
    const base = this.o.fontSize; let fs = base, labW = op.labels === false ? 0 : Math.max(0, ...vis.map((u) => measure(c, this._label(u), base, 500, u.collapsed)));
    let R = Math.min(W, H) / 2 - labW - 14;
    for (let it = 0; it < 3; it++) { fs = clamp(R * dth - 1.5, 7, base); const lw = labW * (fs / base); R = Math.max(30, Math.min(W, H) / 2 - lw - 14); }
    const fit = this._fit(R * dth, n);
    const cx = W / 2, cy = H / 2, leafIdx = new Map(vis.map((u, i) => [u, i]));
    const angOf = new Map(); const ang = (u) => { if (angOf.has(u)) return angOf.get(u); const k = this._kids(u); const a = k.length ? (ang(k[0]) + ang(k[k.length - 1])) / 2 : th0 + dth * leafIdx.get(u); angOf.set(u, a); return a; };
    const r0 = op.innerRadius ?? 0, rad = (u) => r0 + rel(u) * (R - r0), XY = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const all = nodes(this.root).filter((u) => !u.parent || !ancestors(u.parent).some((a) => a.collapsed));
    for (const u of all) {
      if (!u.parent) continue; const rp = rad(u.parent), a = ang(u), ap = ang(u.parent);
      // arc at the parent's radius from the parent's angle to the child's, then the radial segment out to the child
      const k = Math.max(2, Math.ceil(Math.abs(a - ap) * rp / 4)), pts = []; for (let i = 0; i <= k; i++) pts.push(XY(rp, ap + ((a - ap) * i) / k)); pts.push(XY(rad(u), a));
      this._seg(pts, edgeCol(u), edgeW(u));
    }
    vis.forEach((u, i) => {
      const a = ang(u), r = rad(u), color = cmap.get(u) || 'ink';
      if (u.collapsed) { const w = dth * 0.42, rr = r + 26; c.save(); c.beginPath(); c.moveTo(...XY(r, a)); c.lineTo(...XY(rr, a - w)); c.lineTo(...XY(rr, a + w)); c.closePath(); c.fillStyle = this.api.color(cmap.get(u) || 'muted', 0.25); c.fill(); c.strokeStyle = this.api.color(cmap.get(u) || 'muted', 0.8); c.stroke(); c.restore(); }
      if (op.labels === false || !fit.show(i)) return;
      const lab = this._label(u), off = (u.collapsed ? 30 : 6) + (useLen ? R - r : 0) * (op.alignLabels ? 1 : 0), [X, Y] = XY(r + off, a), left = Math.cos(a) < -1e-9, hlOn = this._hl.includes(u);
      c.save(); c.translate(X, Y); c.rotate(left ? a + Math.PI : a);
      this._text(lab, 0, 0, { size: fs, align: left ? 'right' : 'left', color: hlOn ? 'accent' : color, weight: hlOn ? 700 : 500, italic: u.collapsed }); c.restore();
      const w = measure(c, lab, fs); const [X2, Y2] = XY(r + off + w, a); this._lab.push([u, [Math.min(X, X2) - 3, Math.min(Y, Y2) - 6, Math.max(X, X2) + 3, Math.max(Y, Y2) + 6]]);
    });
    const ib = [];
    for (const u of all) { const [X, Y] = XY(rad(u), ang(u)); this._dot(u, X, Y, op, cmap.get(u) || 'muted'); if (op.internalLabels && u.children.length && u.name && !u.collapsed && u.parent) this._ilabel(u.name, X, Y - 9, { size: Math.min(10.5, fs), color: cmap.get(u) || 'muted', align: 'center' }, ib); }
    this.layoutInfo = { fontSize: fs, thinned: fit.thinned, leaves: n, radius: R };
  }
  _tidy(op, edgeCol, edgeW, cmap) {
    const s = this.s, c = s.ctx, W = s.width, H = s.height, fs = this.o.fontSize, padX = 9, boxH = fs + 10;
    const w = (u) => measure(c, this._label(u) || ' ', fs, u.children.length ? 600 : 500, u.collapsed) + 2 * padX;
    const gap = op.gap ?? 12;
    const lay = (u, d) => { // contour-based tidy layout (Reingold–Tilford style): returns items + left/right contours per depth
      const k = this._kids(u), half = w(u) / 2;
      if (!k.length) return { items: [[u, 0, d]], L: [-half], R: [half] };
      const subs = k.map((q) => lay(q, d + 1)), offs = [0], accL = subs[0].L.slice(), accR = subs[0].R.slice();
      for (let i = 1; i < subs.length; i++) { const S = subs[i]; let m = -Infinity; for (let lv = 0; lv < Math.min(accR.length, S.L.length); lv++) m = Math.max(m, accR[lv] - S.L[lv] + gap); offs[i] = m; for (let lv = 0; lv < S.R.length; lv++) { accR[lv] = S.R[lv] + m; if (lv >= accL.length) accL[lv] = S.L[lv] + m; } }
      const mid = (offs[0] + offs[offs.length - 1]) / 2, items = [[u, 0, d]];
      subs.forEach((S, i) => { for (const [q, x, dd] of S.items) items.push([q, x + offs[i] - mid, dd]); });
      return { items, L: [-half, ...accL.map((x) => x - mid)], R: [half, ...accR.map((x) => x - mid)] };
    };
    const T = lay(this.root, 0), maxD = Math.max(...T.items.map((it) => it[2])), lo = Math.min(...T.L), hi = Math.max(...T.R);
    const sc = Math.min(1, (W - 16) / Math.max(1, hi - lo)), cx = W / 2 - ((lo + hi) / 2) * sc;
    const rowH = maxD ? Math.min(op.rowHeight ?? 64, (H - 2 * (boxH / 2 + 8)) / maxD) : 0, y0 = boxH / 2 + 8;
    const alignLeaves = op.alignLeaves && !this.o.lengths;
    const P = new Map(T.items.map(([u, x, d]) => [u, [cx + x * sc, y0 + (alignLeaves && !this._kids(u).length ? maxD : d) * rowH]]));
    for (const [u] of T.items) if (u.parent && P.has(u.parent)) { const p = P.get(u.parent), q = P.get(u); this._seg([[p[0], p[1] + boxH / 2], [q[0], q[1] - boxH / 2]], edgeCol(u), edgeW(u)); if (op.edgeLabels && u.edge != null) this._text(String(u.edge), (p[0] + q[0]) / 2 + 4, (p[1] + q[1]) / 2, { size: fs - 1.5, color: 'muted', align: 'left' }); }
    for (const [u] of T.items) {
      const [X, Y] = P.get(u), lab = this._label(u), bw = w(u) * sc, internal = this._kids(u).length > 0, hlOn = this._hl.includes(u), color = cmap.get(u) || (internal ? 'accent' : 'ink');
      c.save(); const r = 6; c.beginPath(); c.moveTo(X - bw / 2 + r, Y - boxH / 2); c.arcTo(X + bw / 2, Y - boxH / 2, X + bw / 2, Y + boxH / 2, r); c.arcTo(X + bw / 2, Y + boxH / 2, X - bw / 2, Y + boxH / 2, r); c.arcTo(X - bw / 2, Y + boxH / 2, X - bw / 2, Y - boxH / 2, r); c.arcTo(X - bw / 2, Y - boxH / 2, X + bw / 2, Y - boxH / 2, r); c.closePath();
      c.fillStyle = this.api.color(internal ? color : 'panel', internal ? 0.13 : 0.95); c.fill(); c.strokeStyle = this.api.color(hlOn ? 'accent' : color, internal ? 0.7 : 0.45); c.lineWidth = hlOn ? 2.4 : 1.2; c.stroke(); c.restore();
      this._text(lab, X, Y + 0.5, { size: fs * Math.max(0.75, sc), align: 'center', weight: internal ? 600 : 500, color: internal ? color : 'ink', halo: false, italic: u.collapsed });
      this._pos.set(u, Object.assign([X, Y], { r: Math.min(bw, boxH) / 2 })); this._lab.push([u, [X - bw / 2, Y - boxH / 2, X + bw / 2, Y + boxH / 2]]);
    }
    this.layoutInfo = { fontSize: fs * Math.max(0.75, sc), scale: sc, leaves: this._vis().length };
  }
  _unrooted(op, edgeCol, edgeW, cmap) { // equal-angle layout (Felsenstein): each subtree gets a wedge proportional to its leaf count
    const s = this.s, c = s.ctx, W = s.width, H = s.height, useLen = this.useLengths, fs0 = this.o.fontSize;
    const cnt = new Map(); const count = (u) => { const k = this._kids(u); const v = k.length ? k.reduce((a, q) => a + count(q), 0) : 1; cnt.set(u, v); return v; }; count(this.root);
    const raw = new Map([[this.root, [0, 0]]]);
    const place = (u, a0, a1) => { let a = a0; const [x, y] = raw.get(u); for (const q of this._kids(u)) { const span = ((a1 - a0) * cnt.get(q)) / cnt.get(u), mid = a + span / 2, L = useLen ? q.length ?? 1 : 1; raw.set(q, [x + L * Math.cos(mid), y + L * Math.sin(mid)]); place(q, a, a + span); a += span; } };
    place(this.root, 0, TAU);
    const vis = this._vis(), labW = op.labels === false ? 0 : Math.max(0, ...vis.map((u) => measure(c, this._label(u), fs0))) + 10;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const [, [x, y]] of raw) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const scl = Math.min((W - 2 * labW - 20) / Math.max(1e-9, x1 - x0), (H - 2 * Math.min(labW, 40) - 30) / Math.max(1e-9, y1 - y0)), ox = W / 2 - ((x0 + x1) / 2) * scl, oy = H / 2 - ((y0 + y1) / 2) * scl;
    const P = (u) => { const [x, y] = raw.get(u); return [ox + x * scl, oy + y * scl]; };
    for (const [u] of raw) if (u.parent && raw.has(u.parent)) this._seg([P(u.parent), P(u)], edgeCol(u), edgeW(u));
    const boxes = [];
    for (const u of vis) {
      const q = P(u), p = u.parent ? P(u.parent) : [W / 2, H / 2], a = Math.atan2(q[1] - p[1], q[0] - p[0]), left = Math.cos(a) < 0, lab = this._label(u), w = measure(c, lab, fs0), hlOn = this._hl.includes(u);
      const X = q[0] + 6 * Math.cos(a), Y = q[1] + 6 * Math.sin(a), ex = X + (left ? -w : w) * Math.abs(Math.cos(a)), ey = Y + w * Math.sin(a) * (left ? -1 : 1);
      const box = [Math.min(X, ex) - 2, Math.min(Y, ey) - fs0 / 2, Math.max(X, ex) + 2, Math.max(Y, ey) + fs0 / 2];
      if (op.labels === false || boxes.some((b) => !(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3]))) continue; // greedy: never overlap
      boxes.push(box); this._lab.push([u, box]);
      c.save(); c.translate(X, Y); c.rotate(left ? a + Math.PI : a); this._text(lab, 0, 0, { size: fs0, align: left ? 'right' : 'left', color: hlOn ? 'accent' : cmap.get(u) || 'ink', weight: hlOn ? 700 : 500 }); c.restore();
    }
    for (const [u] of raw) { const q = P(u); this._dot(u, q[0], q[1], op, cmap.get(u) || 'muted'); }
    if (useLen && op.scaleBar !== false) this._scaleBar(op, scl, 12, H - 10, 'left');
    this.layoutInfo = { fontSize: fs0, leaves: vis.length };
  }
}

export default function tree(api, rt, stage, spec) { return new Tree(api, rt, stage, spec); }
export const TREES = { newick, toNewick, finalize, upgma, nj, patristic, mrca, path, distance, midpoint, reroot, leaves, nodes, find, splits, rf };
Object.assign(tree, TREES);
/** v.trees(name, ...args): newick, toNewick, upgma, nj, patristic, mrca, path, distance, midpoint, reroot, leaves, nodes, find, splits, rf; v.trees() → the table. */
export function trees(api, rt, name, ...args) {
  if (name == null) return TREES;
  const f = TREES[name]; if (!f) throw new Error(`v.trees: unknown helper "${name}" (${Object.keys(TREES).join(', ')})`);
  return f(...args);
}
