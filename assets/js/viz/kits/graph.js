// Graph kit — node-link diagrams for algorithms, networks, DAGs and trees. Reference: docs/kits.md.
//
//   const G = v.graph(stage, { nodes, edges, directed, weights, layout, editable });
//   v.render(() => G.draw({ nodeFill: (id) => …, edgeColor: (e) => …, highlightPath: [...] }));
//
// Positions live on the node objects in data coordinates (n.x, n.y). Layouts are computed in pixels
// inside the stage's view window, so circles stay round and labels keep their size.
// Algorithm helpers (bfs, dfs, dijkstra, topoSort, mst, maxflow) return results plus `code` (pseudocode)
// and `events`: complete snapshots with `line`, `note` and a default `view` for G.draw — feed them to v.steps.
// Generators: v.graphs('petersen'), v.graphs('grid', 4, 6), … return {nodes, edges, layout} to spread into a spec.
import { rng as RNG } from '../math.js';

const K = (id) => String(id);
const INF = Infinity;
const TAU = 2 * Math.PI;
const COMP = ['blue', 'orange', 'purple', 'teal', 'pink', 'gold', 'green', 'red'];
const FONT = (size, weight = 600) => `${weight} ${size}px Inter, system-ui, sans-serif`;
const isTex = (s) => typeof s === 'string' && s.length > 1 && s[0] === '$' && s[s.length - 1] === '$';
const val = (f, ...a) => (typeof f === 'function' ? f(...a) : f);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
/** Number → short label: integers as is, ∞, real minus sign. */
export const fmtNum = (x) => x == null ? '' : x === INF ? '∞' : x === -INF ? '−∞' : typeof x !== 'number' ? String(x)
  : (Number.isInteger(x) ? String(x) : x.toFixed(Math.abs(x) < 10 ? 2 : 1).replace(/\.?0+$/, '')).replace('-', '−');
const skipper = (x) => x == null ? () => false : typeof x === 'function' ? x : ((s) => (id) => s.has(K(id)))(new Set([...(x instanceof Set ? x : x)].map(K)));
const normEdge = (e) => {
  if (!Array.isArray(e)) return e;
  const o = { from: e[0], to: e[1] };
  if (e[2] != null && typeof e[2] === 'object') Object.assign(o, e[2]); else if (e[2] != null) o.w = e[2];
  return o;
};
function roundRect(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [0.72, -0.72], nw: [-0.72, -0.72], se: [0.72, 0.72], sw: [-0.72, 0.72] };

// ------------------------------------------------------------------ pseudocode (1-based lines in events)
const CODE = {
  bfs: ['for each vertex u:  d[u] ← ∞', 'd[s] ← 0;  Q ← ⟨s⟩', 'while Q is not empty', '  u ← dequeue(Q)', '  for each neighbour v of u', '    if d[v] = ∞', '      d[v] ← d[u] + 1;  π[v] ← u;  enqueue(Q, v)'],
  dfs: ['for each vertex u:  colour[u] ← white', 'for each vertex u:  if white, VISIT(u)', 'VISIT(u):  time += 1;  d[u] ← time;  u is grey', '  for each neighbour v of u', '    if v is white:  π[v] ← u;  VISIT(v)', '  time += 1;  f[u] ← time;  u is black'],
  dijkstra: ['for each vertex v:  d[v] ← ∞;  π[v] ← nil', 'd[s] ← 0;  Q ← all vertices', 'while Q is not empty', '  u ← extract-min(Q)', '  for each edge (u, v) of weight w', '    if d[u] + w < d[v]', '      d[v] ← d[u] + w;  π[v] ← u'],
  topo: ['compute indeg[v] for every vertex v', 'Q ← vertices with indeg 0', 'while Q is not empty', '  u ← dequeue(Q);  output u', '  for each edge (u, v)', '    indeg[v] ← indeg[v] − 1', '    if indeg[v] = 0:  enqueue(Q, v)', 'if fewer than |V| output:  cycle!'],
  mst: ['A ← ∅;  every vertex is its own tree', 'sort the edges by weight', 'for each edge (u, v) in that order', '  if find(u) ≠ find(v)', '    A ← A ∪ {(u, v)};  union(u, v)', '  else skip it  // it would close a cycle'],
  maxflow: ['f(e) ← 0 for every edge e', 'while the residual graph has an s–t path', '  p ← a shortest such path  (BFS)', '  c ← min residual capacity on p', '  push c along p  (cancel backward flow)', 'return f  // reachable from s = min cut'],
};

// ================================================================== Graph

// membership test for accept/start: an id, an array, a Set, or a predicate
const inSet = (x, id, n) => x == null || x === false ? false : typeof x === 'function' ? !!x(id, n) : x instanceof Set ? x.has(id) || x.has(K(id)) : Array.isArray(x) ? x.some((y) => K(y) === K(id)) : K(x) === K(id);
/** Ink colour readable on a solid fill: near-black on light fills, white on dark ones. */
function onFill(css) {
  let r = 128, g = 128, b = 128, m;
  if ((m = /^#([0-9a-f]{6})/i.exec(css))) { const v = parseInt(m[1], 16); r = v >> 16; g = (v >> 8) & 255; b = v & 255; }
  else if ((m = /^#([0-9a-f]{3})$/i.exec(css))) { r = parseInt(m[1][0] + m[1][0], 16); g = parseInt(m[1][1] + m[1][1], 16); b = parseInt(m[1][2] + m[1][2], 16); }
  else if ((m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(css))) { r = +m[1]; g = +m[2]; b = +m[3]; }
  const lin = (u) => { u /= 255; return u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.22 ? '#17171c' : '#ffffff';
}

class Graph {
  constructor(api, rt, stage, spec = {}) {
    if (!stage || typeof stage.X !== 'function') throw new Error('v.graph(stage, spec): the first argument must be a 2D stage');
    this.api = api; this.rt = rt; this.s = stage; this._v = 0; this._iv = -1;
    this.o = { r: 13, shape: 'circle', labelPos: 'in', notePos: 'n', fontSize: 12.5, seed: 1, rankdir: 'down', ...spec };
    this.directed = !!this.o.directed; this.weights = !!this.o.weights;
    this.onChange = spec.onChange || null; this.onClick = spec.onClick || null;
    const E = spec.editable === true ? { addNode: true, addEdge: true, deleteNode: true, deleteEdge: true, editWeight: true } : spec.editable || {};
    this.ed = {
      moveNode: spec.draggable !== false && E.moveNode !== false, addNode: !!E.addNode, addEdge: !!E.addEdge,
      deleteNode: !!E.deleteNode, deleteEdge: !!(E.deleteEdge ?? E.deleteNode), editWeight: !!E.editWeight && this.weights,
      minW: E.minWeight ?? 1, maxW: E.maxWeight ?? 9, weight: E.weight ?? 1,
    };
    this._sel = null; this._hover = null; this._rubber = null; this._geo = new Map();
    this.set(spec);
    if (E.maxWeight == null) this.ed.maxW = Math.max(9, Math.ceil(1.5 * Math.max(0, ...this._edges.map((e) => e.w ?? 1))));
    this.layout(spec.layout ?? (this._nodes.length && this._nodes.every((n) => n.x != null && n.y != null) ? 'none' : 'force'));
    this._bind();
  }

  // ---------------------------------------------------------------- data
  /** Replace nodes and/or edges. Nodes: objects or bare ids; edges: objects or [from, to, w | {…}]. */
  set({ nodes, edges, directed, weights, layout, editable, onChange, onClick, ...style } = {}) {
    if (directed != null) this.directed = !!directed; if (weights != null) this.weights = !!weights;
    Object.assign(this.o, style);
    const E = (edges || []).map(normEdge);
    let N = nodes;
    if (!N) { const seen = new Map(); for (const e of E) for (const id of [e.from, e.to]) if (!seen.has(K(id))) seen.set(K(id), { id }); N = [...seen.values()]; }
    this._nodes = N.map((n) => (n && typeof n === 'object' ? n : { id: n }));
    this._edges = E; this._v++; return this;
  }
  get nodes() { return this._nodes; }
  set nodes(a) { this._nodes = a.map((n) => (n && typeof n === 'object' ? n : { id: n })); this._v++; }
  get edges() { return this._edges; }
  set edges(a) { this._edges = a.map(normEdge); this._v++; }
  _index() {
    if (this._iv === this._v && this._in === this._nodes.length + ':' + this._edges.length) return;
    this._iv = this._v; this._in = this._nodes.length + ':' + this._edges.length;
    this._idx = new Map(this._nodes.map((n) => [K(n.id), n]));
    this._out = new Map(); this._inc = new Map();
    for (const n of this._nodes) { this._out.set(K(n.id), []); this._inc.set(K(n.id), []); }
    for (const e of this._edges) {
      const a = K(e.from), b = K(e.to); if (!this._out.has(a) || !this._out.has(b)) continue;
      this._out.get(a).push([e.to, e]); this._inc.get(b).push([e.from, e]);
      if (!this.isDirected(e) && a !== b) { this._out.get(b).push([e.from, e]); this._inc.get(a).push([e.to, e]); }
    }
  }
  isDirected(e) { return e.directed ?? this.directed; }
  node(id) { this._index(); return this._idx.get(K(id)) || null; }
  has(id) { return !!this.node(id); }
  /** First edge from a to b (either way round if it is undirected). */
  edge(a, b) { this._index(); const l = this._out.get(K(a)); const hit = l && l.find(([id]) => K(id) === K(b)); return hit ? hit[1] : null; }
  /** Out-neighbours (all neighbours if undirected): [{id, edge, w}]. */
  adj(id) { this._index(); return (this._out.get(K(id)) || []).map(([to, e]) => ({ id: to, edge: e, w: e.w ?? 1 })); }
  /** In-neighbours: [{id, edge, w}]. */
  inn(id) { this._index(); return (this._inc.get(K(id)) || []).map(([fr, e]) => ({ id: fr, edge: e, w: e.w ?? 1 })); }
  neighbors(id) { return this.adj(id).map((a) => a.id); }
  degree(id) { return this.adj(id).length; }
  /** Label text of a node (for notes and readouts). */
  lab(id) { const n = this.node(id); return String(n ? n.label ?? n.id : id).replace(/\n/g, ' '); }
  addNode(n, x, y) {
    if (n == null || typeof n !== 'object') n = { id: n ?? this._newId() };
    if (x != null) { n.x = x; n.y = y; }
    if (n.x == null) { const v = this.s.view || this.s.bounds; n.x = (v.x[0] + v.x[1]) / 2; n.y = (v.y[0] + v.y[1]) / 2; }
    this._nodes.push(n); this._v++; return n;
  }
  addEdge(from, to, w) { const e = { from, to, ...(w != null && typeof w === 'object' ? w : w != null ? { w } : {}) }; this._edges.push(e); this._v++; return e; }
  removeEdge(e, b) { if (b !== undefined) e = this.edge(e, b); const i = this._edges.indexOf(e); if (i >= 0) { this._edges.splice(i, 1); this._v++; } return this; }
  removeNode(id) {
    const k = K(id); this._nodes = this._nodes.filter((n) => K(n.id) !== k);
    this._edges = this._edges.filter((e) => K(e.from) !== k && K(e.to) !== k);
    if (this._sel && K(this._sel.id) === k) this._sel = null;
    this._v++; return this;
  }
  clear() { this._nodes = []; this._edges = []; this._v++; return this; }
  /** Adjacency matrix in node order (weights if `weighted`). */
  matrix(weighted = this.weights) {
    this._index(); const ix = new Map(this._nodes.map((n, i) => [K(n.id), i]));
    const A = this._nodes.map(() => this._nodes.map(() => 0));
    for (const e of this._edges) { const i = ix.get(K(e.from)), j = ix.get(K(e.to)); if (i == null || j == null) continue; const w = weighted ? e.w ?? 1 : 1; A[i][j] = w; if (!this.isDirected(e)) A[j][i] = w; }
    return A;
  }
  _newId() {
    const ids = this._nodes.map((n) => n.id);
    if (ids.length && ids.every((x) => typeof x === 'number')) return Math.max(...ids) + 1;
    for (const [a, z] of [[65, 90], [97, 122]]) if (ids.length && ids.every((x) => typeof x === 'string' && x.length === 1 && x.charCodeAt(0) >= a && x.charCodeAt(0) <= z))
      for (let c = a; c <= z; c++) if (!ids.includes(String.fromCharCode(c))) return String.fromCharCode(c);
    let k = ids.length; while (this.has('n' + k)) k++; return 'n' + k;
  }

  // ---------------------------------------------------------------- geometry
  _tw(str, size, weight = 600) { const c = this.s.ctx; c.save(); c.font = FONT(size, weight); const w = c.measureText(str).width; c.restore(); return w; }
  /** Pixel size of a node: {shape, r, hw, hh, lines, inside, tex}. */
  _size(n, o = this.o) {
    const lab = n.label ?? String(n.id), inside = (n.labelPos ?? o.labelPos) === 'in', tex = isTex(lab), fs = o.fontSize;
    const shape = n.shape ?? o.shape; let r = n.r ?? o.r;
    if (shape === 'box') {
      const lines = String(lab).split('\n'); const tw = inside ? (tex ? lab.length * 6.5 : Math.max(...lines.map((l) => this._tw(l, fs)))) : 0;
      return { shape, r, hw: Math.max(r, tw / 2 + 9), hh: Math.max(r * 0.85, lines.length * fs * 0.62 + 5), lines, inside, tex, lab };
    }
    if (inside && n.r == null && o.autoRadius !== false && lab !== '') r = Math.max(r, (tex ? lab.replace(/[\\{}^_$]/g, '').length * 4.2 : this._tw(String(lab), fs) / 2) + 5);
    return { shape: 'circle', r, hw: r, hh: r, lines: [String(lab)], inside, tex, lab };
  }
  _gnode(n) { const g = this._size(n); g.n = n; g.X = this.s.X(n.x); g.Y = this.s.Y(n.y); return g; }
  _inside(g, x, y, pad = 0) { return g.shape === 'box' ? Math.abs(x - g.X) <= g.hw + pad && Math.abs(y - g.Y) <= g.hh + pad : Math.hypot(x - g.X, y - g.Y) <= g.r + pad; }
  /** Pixel box (inside the stage's view window) that layouts fill. */
  _box(o = this.o) {
    const s = this.s, v = s.view || s.bounds;
    let mw = 0, mh = 0; for (const n of this._nodes) { const g = this._size(n, o); mw = Math.max(mw, g.hw); mh = Math.max(mh, g.hh); }
    const out = this._nodes.some((n) => (n.labelPos ?? o.labelPos) !== 'in') ? 16 : 0;
    const px = o.pad ?? mw + 8 + out, py = o.pad ?? mh + 8 + out;
    let l = s.X(v.x[0]) + px, r = s.X(v.x[1]) - px, t = s.Y(v.y[1]) + py, b = s.Y(v.y[0]) - py;
    if (r < l) l = r = (l + r) / 2; if (b < t) t = b = (t + b) / 2;
    return { l, r, t, b, w: r - l, h: b - t, cx: (l + r) / 2, cy: (t + b) / 2 };
  }
  _clampView(x, y) { const v = this.s.view || this.s.bounds; return [clamp(x, v.x[0], v.x[1]), clamp(y, v.y[0], v.y[1])]; }
  _clearVia(n) { for (const e of this._edges) if (e._via && (K(e.from) === K(n.id) || K(e.to) === K(n.id))) e._via = null; }

  // ---------------------------------------------------------------- layouts
  /** Recompute positions: 'force' | 'circle' | 'grid' | 'layered' | 'tree' | 'fit' | 'none'. opts override spec keys (seed, root, rankdir, cols, …). */
  layout(name = 'force', opts = {}) {
    const o = { ...this.o, ...opts }; this._index();
    for (const e of this._edges) e._via = null;
    if (!this._nodes.length) return this;
    const L = LAYOUTS[name]; if (!L) throw new Error(`v.graph: unknown layout "${name}"`);
    const box = this._box(o), P = L(this, box, o);
    if (P) this._nodes.forEach((n, i) => { if (P[i] && !(n.fixed && n.x != null && name !== 'none')) { n.x = this.s.invX(P[i][0]); n.y = this.s.invY(P[i][1]); } });
    this.layoutName = name; return this;
  }

  // ---------------------------------------------------------------- drawing
  /** Edge polyline in px, clipped at the node boundaries: {pts, mid, loop}. */
  _edgeGeo(e, GN, off, loopK) {
    const ga = GN.get(K(e.from)), gb = GN.get(K(e.to)); if (!ga || !gb) return null;
    let pts;
    if (ga === gb) {
      // self-loop: a teardrop pointing away from the neighbours
      let th = e.angle != null ? -e.angle * Math.PI / 180 : null;
      if (th == null) {
        let ax = 0, ay = 0; for (const { id } of this.adj(e.from).concat(this.inn(e.from))) { const g = GN.get(K(id)); if (g && g !== ga) { const d = Math.hypot(g.X - ga.X, g.Y - ga.Y) || 1; ax += (g.X - ga.X) / d; ay += (g.Y - ga.Y) / d; } }
        th = Math.hypot(ax, ay) > 0.3 ? Math.atan2(-ay, -ax) : -Math.PI / 2;
      }
      const R = Math.max(ga.hw, ga.hh) + 34 + 14 * loopK, sp = 0.52;
      const c1 = [ga.X + R * 1.35 * Math.cos(th - sp), ga.Y + R * 1.35 * Math.sin(th - sp)], c2 = [ga.X + R * 1.35 * Math.cos(th + sp), ga.Y + R * 1.35 * Math.sin(th + sp)];
      pts = []; for (let i = 0; i <= 48; i++) { const t = i / 48, u = 1 - t; pts.push([u * u * u * ga.X + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * ga.X, u * u * u * ga.Y + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * ga.Y]); }
    } else if (e._via && e._via.length) {
      // route through the dummy points with cubic segments whose tangents follow the rank axis (layered look)
      const P = [[ga.X, ga.Y], ...e._via.map(([x, y]) => [this.s.X(x), this.s.Y(y)]), [gb.X, gb.Y]], ax = e._viaAxis ?? 1; pts = [];
      for (let i = 0; i + 1 < P.length; i++) {
        const p = P[i], q = P[i + 1], h = (q[ax] - p[ax]) / 2, c1 = p.slice(), c2 = q.slice(); c1[ax] += h; c2[ax] -= h;
        for (let k = 0; k < 16; k++) { const t = k / 16, u = 1 - t; pts.push([0, 1].map((j) => u * u * u * p[j] + 3 * u * u * t * c1[j] + 3 * u * t * t * c2[j] + t * t * t * q[j])); }
      }
      pts.push([gb.X, gb.Y]);
    } else {
      const bend = e.bend ?? off;
      if (Math.abs(bend) < 0.5) pts = [[ga.X, ga.Y], [gb.X, gb.Y]];
      else {
        // canonical frame (lower key → higher key) so antiparallel edges bend to opposite sides
        const [p, q] = K(e.from) < K(e.to) ? [ga, gb] : [gb, ga];
        const dx = q.X - p.X, dy = q.Y - p.Y, L = Math.hypot(dx, dy) || 1;
        const cx = (ga.X + gb.X) / 2 - dy / L * 2 * bend, cy = (ga.Y + gb.Y) / 2 + dx / L * 2 * bend;
        pts = []; for (let i = 0; i <= 32; i++) { const t = i / 32, u = 1 - t; pts.push([u * u * ga.X + 2 * u * t * cx + t * t * gb.X, u * u * ga.Y + 2 * u * t * cy + t * t * gb.Y]); }
      }
    }
    const pad = 1.5;
    // clip the start at the source boundary and the end at the target boundary
    let i0 = 0; while (i0 < pts.length - 1 && this._inside(ga, pts[i0 + 1][0], pts[i0 + 1][1], pad)) i0++;
    let i1 = pts.length - 1; while (i1 > 0 && this._inside(gb, pts[i1 - 1][0], pts[i1 - 1][1], pad)) i1--;
    if (i0 >= i1 && ga !== gb) return null;
    const cross = (a, b, g) => { let lo = 0, hi = 1; const inA = this._inside(g, a[0], a[1], pad); for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2, x = a[0] + (b[0] - a[0]) * m, y = a[1] + (b[1] - a[1]) * m; if (this._inside(g, x, y, pad) === inA) lo = m; else hi = m; } return [a[0] + (b[0] - a[0]) * lo, a[1] + (b[1] - a[1]) * lo]; };
    const P0 = cross(pts[i0], pts[i0 + 1], ga), P1 = cross(pts[i1], pts[i1 - 1], gb);
    const out = [P0, ...pts.slice(i0 + 1, i1), P1];
    // arc-length midpoint (label anchor)
    let tot = 0; for (let k = 1; k < out.length; k++) tot += Math.hypot(out[k][0] - out[k - 1][0], out[k][1] - out[k - 1][1]);
    let acc = 0, mid = out[0];
    for (let k = 1; k < out.length; k++) { const d = Math.hypot(out[k][0] - out[k - 1][0], out[k][1] - out[k - 1][1]); if (acc + d >= tot / 2) { const t = d ? (tot / 2 - acc) / d : 0; mid = [out[k - 1][0] + (out[k][0] - out[k - 1][0]) * t, out[k - 1][1] + (out[k][1] - out[k - 1][1]) * t]; break; } acc += d; }
    return { pts: out, mid, len: tot, loop: ga === gb };
  }
  /**
   * Draw the graph (call inside v.render). Options (functions get (id, node) or (edge)): nodeColor, nodeFill (solid disc),
   * nodeLabel, nodeNote (small text beside the node), noteColor, nodeRing, labelColor, edgeColor, edgeWidth, edgeDash,
   * edgeLabel, edgeLabelColor, highlightPath: [ids], pathColor, dim: Set/array of node ids and edge objects, arrows.
   * Automata: accept (id | [ids] | Set | (id, node) => bool) draws a double ring; start (same forms) an incoming arrow, from startDir ('w').
   * These, labelPos and notePos can also be given once in the spec.
   */
  draw(o = {}) {
    const s = this.s, c = s.ctx, A = this.api; this._index();
    o = { ...this.o.style, ...o };
    const GN = new Map(); for (const n of this._nodes) if (n.hidden !== true && isFinite(n.x) && isFinite(n.y)) GN.set(K(n.id), this._gnode(n));
    const dimN = new Set(), dimE = new Set(); for (const d of o.dim || []) (d && typeof d === 'object' ? dimE.add(d) : dimN.add(K(d)));
    const pathE = new Set(), pathN = new Set(), hp = o.highlightPath || [];
    for (let k = 0; k < hp.length; k++) { pathN.add(K(hp[k])); if (k + 1 < hp.length) { const e = this.edge(hp[k], hp[k + 1]) || (!this.directed && this.edge(hp[k + 1], hp[k])); if (e) pathE.add(e); } }
    const pathCol = o.pathColor || 'green';
    // parallel/antiparallel groups → symmetric bends; loops get stacked
    const groups = new Map(), loops = new Map(), off = new Map(), loopK = new Map();
    for (const e of this._edges) {
      const a = K(e.from), b = K(e.to); if (!GN.has(a) || !GN.has(b)) continue;
      if (a === b) { const l = loops.get(a) || []; loopK.set(e, l.length); l.push(e); loops.set(a, l); continue; }
      const key = a < b ? a + '\u0001' + b : b + '\u0001' + a; const l = groups.get(key) || []; l.push(e); groups.set(key, l);
    }
    const gap = o.parallelGap ?? 26;
    for (const l of groups.values()) l.forEach((e, i) => off.set(e, (i - (l.length - 1) / 2) * gap));
    this._geo = new Map();
    for (const e of this._edges) { const g = this._edgeGeo(e, GN, off.get(e) || 0, loopK.get(e) || 0); if (g) this._geo.set(e, g); }
    const eStyle = (e) => {
      const custom = val(o.edgeColor, e) ?? (pathE.has(e) ? pathCol : e.color);
      const dim = dimE.has(e) || dimN.has(K(e.from)) || dimN.has(K(e.to));
      return { col: custom || 'muted', custom: !!custom, a: (dim ? 0.2 : 1) * (custom ? 1 : 0.78), w: val(o.edgeWidth, e) ?? e.width ?? (pathE.has(e) ? 3.4 : 1.7), dash: val(o.edgeDash, e) ?? e.dash };
    };
    // ---- edges
    for (const e of this._edges) {
      const g = this._geo.get(e); if (!g) continue; const st = eStyle(e); let pts = g.pts;
      c.save(); c.globalAlpha = st.a; c.strokeStyle = c.fillStyle = A.color(st.col); c.lineWidth = st.w; c.lineCap = 'round'; c.lineJoin = 'round';
      c.setLineDash(st.dash ? (st.dash === true ? [6, 5] : st.dash) : []);
      const arrow = (o.arrows ?? true) && this.isDirected(e);
      let tip, ux, uy; const hs = o.arrowSize ?? 6.5 + st.w * 1.2;
      if (arrow && g.len > hs * 1.2) {
        tip = pts[pts.length - 1]; let k = pts.length - 2, back = pts[k];
        while (k > 0 && Math.hypot(tip[0] - pts[k][0], tip[1] - pts[k][1]) < hs) back = pts[--k];
        const d = Math.hypot(tip[0] - back[0], tip[1] - back[1]) || 1; ux = (tip[0] - back[0]) / d; uy = (tip[1] - back[1]) / d;
        const cut = [tip[0] - ux * hs * 0.75, tip[1] - uy * hs * 0.75]; pts = pts.slice(0, k + 1).concat([cut]);
      }
      c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); c.setLineDash([]);
      if (tip) { c.beginPath(); c.moveTo(tip[0], tip[1]); c.lineTo(tip[0] - ux * hs - uy * hs * 0.46, tip[1] - uy * hs + ux * hs * 0.46); c.lineTo(tip[0] - ux * hs + uy * hs * 0.46, tip[1] - uy * hs - ux * hs * 0.46); c.closePath(); c.fill(); }
      c.restore();
    }
    // rubber band while dragging out a new edge
    if (this._rubber) { const g = GN.get(K(this._rubber.from.id)); if (g) { c.save(); c.strokeStyle = A.color('accent'); c.lineWidth = 2; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(g.X, g.Y); c.lineTo(this._rubber.px, this._rubber.py); c.stroke(); c.restore(); } }
    // ---- edge labels (weights) on a halo pill at the arc midpoint
    const efs = o.edgeFontSize ?? 11.5;
    for (const e of this._edges) {
      const g = this._geo.get(e); if (!g) continue;
      const txt = o.edgeLabel !== undefined ? val(o.edgeLabel, e) : e.label ?? (this.weights ? e.w ?? 1 : null);
      if (txt == null || txt === '') continue;
      const st = eStyle(e), str = typeof txt === 'number' ? fmtNum(txt) : String(txt), [X, Y] = g.mid;
      const tcol = val(o.edgeLabelColor, e) ?? (st.custom ? st.col : 'ink');
      if (isTex(str)) { s.texPx(str.slice(1, -1), X, Y, { color: tcol, size: 13.5, alpha: st.a < 0.5 ? 0.35 : 1 }); g.rect = [X - 12, Y - 9, 24, 18]; continue; }
      c.save(); c.globalAlpha = st.a < 0.5 ? 0.4 : 1; c.font = FONT(efs); const tw = c.measureText(str).width, pw = tw + 9, ph = efs + 6;
      roundRect(c, X - pw / 2, Y - ph / 2, pw, ph, ph / 2); c.fillStyle = A.color('panel', 0.95); c.fill();
      c.lineWidth = 1; c.strokeStyle = A.color(st.custom ? st.col : 'faint', st.custom ? 0.75 : 0.6); c.stroke();
      c.fillStyle = A.color(tcol); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(str, X, Y + 0.5); c.restore();
      g.rect = [X - pw / 2, Y - ph / 2, pw, ph];
    }
    // ---- nodes
    const fs = o.fontSize ?? this.o.fontSize, accept = o.accept ?? this.o.accept, start = o.start ?? this.o.start;
    for (const n of this._nodes) {
      const g = GN.get(K(n.id)); if (!g) continue; const id = n.id, k = K(id);
      const fill = val(o.nodeFill, id, n) ?? n.fill ?? null;
      const col = val(o.nodeColor, id, n) ?? n.color ?? (pathN.has(k) ? pathCol : null);
      const alpha = dimN.has(k) ? 0.28 : 1;
      c.save(); c.globalAlpha = alpha;
      const shape = (pad = 0) => { if (g.shape === 'box') roundRect(c, g.X - g.hw - pad, g.Y - g.hh - pad, 2 * (g.hw + pad), 2 * (g.hh + pad), 7 + pad); else { c.beginPath(); c.arc(g.X, g.Y, g.r + pad, 0, TAU); } };
      const ring = val(o.nodeRing, id, n);
      if (ring) { shape(4.5); c.lineWidth = 2.5; c.strokeStyle = A.color(ring); c.stroke(); }
      if (this._sel === n) { shape(5); c.lineWidth = 2; c.setLineDash([4, 3]); c.strokeStyle = A.color('accent'); c.stroke(); c.setLineDash([]); }
      else if (this._hover === n && (this.ed.moveNode || this.ed.addEdge)) { shape(5); c.fillStyle = A.color(col || fill || 'accent', 0.14); c.fill(); }
      shape();
      if (fill) { c.fillStyle = A.color(fill); c.fill(); c.lineWidth = 2; c.strokeStyle = A.color('panel'); c.stroke(); }
      else {
        c.fillStyle = A.color('panel'); c.fill(); if (col) { c.fillStyle = A.color(col, 0.16); c.fill(); }
        c.lineWidth = col ? 2.3 : 1.6; c.strokeStyle = A.color(col || 'muted'); c.stroke();
      }
      // automata: accepting states get an inner ring, start states an incoming arrow
      if (inSet(accept, id, n)) { shape(-3.6); c.lineWidth = 1.5; c.strokeStyle = fill ? A.color(onFill(A.color(fill))) : A.color(col || 'muted'); c.stroke(); }
      if (inSet(start, id, n)) {
        const [sx, sy] = DIRS[o.startDir ?? this.o.startDir ?? this._freeSide(n, g)] || DIRS.w, rr = (g.shape === 'box' ? Math.max(g.hw * Math.abs(sx), g.hh * Math.abs(sy)) : g.r) + 2, L = 22;
        const tx = g.X + sx * rr, ty = g.Y + sy * rr; c.strokeStyle = c.fillStyle = A.color('ink'); c.lineWidth = 1.8;
        c.beginPath(); c.moveTo(tx + sx * L, ty + sy * L); c.lineTo(tx + sx * 6, ty + sy * 6); c.stroke();
        c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + sx * 8 - sy * 4.5, ty + sy * 8 + sx * 4.5); c.lineTo(tx + sx * 8 + sy * 4.5, ty + sy * 8 - sx * 4.5); c.closePath(); c.fill();
      }
      c.restore();
      // label
      const lab = o.nodeLabel !== undefined ? val(o.nodeLabel, id, n) : g.lab;
      if (lab != null && lab !== '') {
        const str = typeof lab === 'number' ? fmtNum(lab) : String(lab);
        const lc = val(o.labelColor, id, n) ?? (g.inside && fill ? onFill(A.color(fill)) : g.inside ? 'ink' : col || fill || 'ink');
        if (g.inside) {
          if (isTex(str)) s.texPx(str.slice(1, -1), g.X, g.Y, { color: lc, size: o.texSize ?? 15, alpha });
          else {
            const lines = str.split('\n'), lh = fs * 1.2;
            c.save(); c.globalAlpha = alpha; c.font = FONT(lines.length > 1 || g.shape === 'box' ? fs - 0.5 : fs, g.shape === 'box' ? 500 : 600); c.fillStyle = A.color(lc); c.textAlign = 'center'; c.textBaseline = 'middle';
            lines.forEach((l, i) => c.fillText(l, g.X, g.Y + (i - (lines.length - 1) / 2) * lh + 0.5)); c.restore();
          }
        } else {
          const pos = n.labelPos ?? o.labelPos ?? this.o.labelPos, [dx, dy] = DIRS[pos] || DIRS.ne, offp = (g.shape === 'box' ? Math.max(g.hw * Math.abs(dx), g.hh * Math.abs(dy)) : g.r) + 5;
          const X = g.X + dx * offp, Y = g.Y + dy * offp, align = dx > 0.1 ? 'left' : dx < -0.1 ? 'right' : 'center', base = dy > 0.1 ? 'top' : dy < -0.1 ? 'bottom' : 'middle';
          if (isTex(str)) s.texPx(str.slice(1, -1), X, Y, { color: lc, size: o.texSize ?? 15, align, baseline: base, alpha });
          else s.textPx(str, X, Y, { color: lc, align, baseline: base, size: fs + 0.5, weight: 600, alpha });
        }
      }
      // note (e.g. a distance) beside the node
      const note = val(o.nodeNote, id, n);
      if (note != null && note !== '') {
        const str = typeof note === 'number' ? fmtNum(note) : String(note);
        const pos = n.notePos ?? o.notePos ?? this.o.notePos, [dx, dy] = DIRS[pos] || DIRS.n, offp = (g.shape === 'box' ? Math.max(g.hw * Math.abs(dx), g.hh * Math.abs(dy)) : g.r) + 4;
        const X = g.X + dx * offp, Y = g.Y + dy * offp, align = dx > 0.1 ? 'left' : dx < -0.1 ? 'right' : 'center', base = dy > 0.1 ? 'top' : dy < -0.1 ? 'bottom' : 'middle';
        const nc = val(o.noteColor, id, n) ?? 'muted';
        if (isTex(str)) s.texPx(str.slice(1, -1), X, Y, { color: nc, size: 14, align, baseline: base, alpha });
        else s.textPx(str, X, Y, { color: nc, align, baseline: base, size: o.noteSize ?? 12, weight: 700, alpha });
      }
    }
    return this;
  }

  /** The compass direction around node n (drawn at g) farthest from its incident edges and loops (for the start arrow). */
  _freeSide(n, g) {
    const angs = [];
    for (const e of this._edges) {
      const geo = this._geo?.get(e); if (!geo || (K(e.from) !== K(n.id) && K(e.to) !== K(n.id))) continue;
      for (const p of geo.pts) { const d = Math.hypot(p[0] - g.X, p[1] - g.Y); if (d > 2 && d < g.r * 4 + 30) angs.push(Math.atan2(p[1] - g.Y, p[0] - g.X)); }
    }
    let best = 'w', bs = -1;
    for (const k of ['w', 'nw', 'sw', 'n', 's', 'e', 'ne', 'se']) {
      const [dx, dy] = DIRS[k], a = Math.atan2(dy, dx);
      const sc = angs.length ? Math.min(...angs.map((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))))) : Math.PI;
      if (sc > bs + 1e-6) { bs = sc; best = k; }
    }
    return best;
  }

  // ---------------------------------------------------------------- hit testing (data coordinates)
  _hitNodePx(px, py, tol = 3) { for (let i = this._nodes.length - 1; i >= 0; i--) { const n = this._nodes[i]; if (n.hidden === true || !isFinite(n.x)) continue; const g = this._gnode(n); if (this._inside(g, px, py, tol)) return g; } return null; }
  _hitEdgePx(px, py, tol = 6) {
    let best = null, bd = tol;
    for (const [e, g] of this._geo) {
      if (g.rect && px >= g.rect[0] - 2 && px <= g.rect[0] + g.rect[2] + 2 && py >= g.rect[1] - 2 && py <= g.rect[1] + g.rect[3] + 2) return e;
      for (let k = 1; k < g.pts.length; k++) {
        const [ax, ay] = g.pts[k - 1], [bx, by] = g.pts[k], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
        const t = clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1), d = Math.hypot(px - ax - t * dx, py - ay - t * dy);
        if (d < bd) { bd = d; best = e; }
      }
    }
    return best;
  }
  /** Node object under (x, y) or null. */
  hitNode(x, y, tol = 3) { const g = this._hitNodePx(this.s.X(x), this.s.Y(y), tol); return g ? g.n : null; }
  /** Edge under (x, y) (on its line or its label) or null — uses the geometry of the last draw. */
  hitEdge(x, y, tol = 6) { return this._hitEdgePx(this.s.X(x), this.s.Y(y), tol); }
  hit(x, y) { const n = this.hitNode(x, y); if (n) return { node: n, id: n.id }; const e = this.hitEdge(x, y); return e ? { edge: e } : null; }

  // ---------------------------------------------------------------- interaction
  _edgeBetween(a, b) { const e = this.edge(a, b); return e && (this.isDirected(e) ? K(e.from) === K(a) : true) ? e : null; }
  _changed(kind, obj) { this.onChange?.(kind, obj, this); }
  _bind() {
    const s = this.s, cv = s.canvas, ed = this.ed;
    if (ed.moveNode || ed.addEdge || ed.addNode) cv.style.touchAction = 'none';
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', (e) => {
      if (s._active || (e.button ?? 0) > 0) return; // a stage handle won
      const [px, py] = pos(e), g = this._hitNodePx(px, py, e.pointerType === 'touch' ? 12 : 3);
      this._down = { px, py, g, shift: e.shiftKey, alt: e.altKey || e.metaKey, moved: false };
      if (g && (ed.moveNode || ed.addEdge)) { this._down.off = [g.X - px, g.Y - py]; try { cv.setPointerCapture(e.pointerId); } catch { /* synthetic */ } e.preventDefault(); }
    });
    cv.addEventListener('pointermove', (e) => {
      const [px, py] = pos(e), d = this._down;
      if (d) {
        if (!d.moved && Math.hypot(px - d.px, py - d.py) < 4) return; d.moved = true;
        if (!d.g) return;
        if (ed.addEdge && (d.shift || !ed.moveNode)) this._rubber = { from: d.g.n, px, py };
        else if (ed.moveNode) { const n = d.g.n; [n.x, n.y] = this._clampView(s.invX(px + d.off[0]), s.invY(py + d.off[1])); this._clearVia(n); this._dragging = n; }
        this.rt.invalidate(); return;
      }
      const g = this._hitNodePx(px, py, 3), h = g ? g.n : null;
      const eh = !g && (ed.editWeight || this.onClick) ? this._hitEdgePx(px, py) : null;
      if (h !== this._hover) { this._hover = h; if (ed.moveNode || ed.addEdge) this.rt.invalidate(); }
      if ((ed.moveNode || ed.addNode || ed.addEdge || ed.editWeight || this.onClick) && !s._active && !s.handles?.some((hd) => hd.hover)) cv.style.cursor = h ? (ed.moveNode ? 'grab' : 'pointer') : eh ? 'pointer' : ed.addNode ? 'copy' : '';
    });
    const up = (e) => {
      const d = this._down; this._down = null; if (!d) return;
      const [px, py] = pos(e);
      if (this._rubber) {
        const from = this._rubber.from; this._rubber = null; const g = this._hitNodePx(px, py, 8);
        if (g && g.n !== from && !this._edgeBetween(from.id, g.n.id)) this._changed('add-edge', this.addEdge(from.id, g.n.id, this.weights ? ed.weight : undefined));
        this.rt.invalidate(); return;
      }
      if (this._dragging) { const n = this._dragging; this._dragging = null; this._changed('move', n); this.rt.invalidate(); return; }
      if (!d.moved && e.type === 'pointerup') this._click(px, py, d);
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { if (this._hover && !this._down) { this._hover = null; this.rt.invalidate(); } });
    const key = (e) => {
      if (!this._sel || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')) return;
      if (e.key === 'Escape') { this._sel = null; this.rt.invalidate(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && ed.deleteNode) { const n = this._sel; this.removeNode(n.id); this._changed('remove-node', n); this.rt.invalidate(); e.preventDefault(); }
    };
    window.addEventListener('keydown', key); this.rt.cleanups.push(() => window.removeEventListener('keydown', key));
  }
  _click(px, py, d) {
    const [x, y] = this.s.inv(px, py), ed = this.ed, g = d.g || this._hitNodePx(px, py, 3), node = g ? g.n : null, edge = node ? null : this._hitEdgePx(px, py);
    if (this.onClick && this.onClick({ node, id: node ? node.id : null, edge, x, y, shift: d.shift, alt: d.alt }) === true) { this.rt.invalidate(); return; }
    if (d.alt) {
      if (node && ed.deleteNode) { this.removeNode(node.id); this._changed('remove-node', node); }
      else if (edge && ed.deleteEdge) { this.removeEdge(edge); this._changed('remove-edge', edge); }
    } else if (node) {
      if (!ed.addEdge) return;
      if (!this._sel) this._sel = node;
      else if (this._sel === node) this._sel = null;
      else {
        const ex = this._edgeBetween(this._sel.id, node.id);
        if (ex) { if (ed.deleteEdge) { this.removeEdge(ex); this._changed('remove-edge', ex); } }
        else this._changed('add-edge', this.addEdge(this._sel.id, node.id, this.weights ? ed.weight : undefined));
        this._sel = null;
      }
    } else if (edge) {
      if (ed.editWeight) { const w = (edge.w ?? 1) + (d.shift ? -1 : 1); edge.w = w > ed.maxW ? ed.minW : w < ed.minW ? ed.maxW : w; this._changed('weight', edge); }
    } else if (this._sel) this._sel = null;
    else if (ed.addNode) { const [cx, cy] = this._clampView(x, y); this._changed('add-node', this.addNode({ id: this._newId(), x: cx, y: cy })); }
    this.rt.invalidate();
  }

  // ---------------------------------------------------------------- algorithms
  _snap(st) { const o = {}; for (const k in st) o[k] = Array.isArray(st[k]) ? st[k].slice() : st[k] instanceof Map ? new Map(st[k]) : st[k] && typeof st[k] === 'object' ? { ...st[k] } : st[k]; return o; }
  _init(v) { const o = {}; for (const n of this._nodes) o[K(n.id)] = typeof v === 'function' ? v(n) : v; return o; }
  /** Vertex ids from the source to t along prev pointers ([] if unreachable). */
  path(prev, t) { const out = []; let u = t, guard = 0; while (u != null && guard++ <= this._nodes.length) { out.push(u); u = prev[K(u)]; } return out[out.length - 1] != null && guard <= this._nodes.length + 1 ? out.reverse() : []; }

  /** Breadth-first search. opts: {skip: ids|Set|fn(id, edge), detail: 'edge' (default) | 'node'}. */
  bfs(src, opts = {}) {
    this._index(); const skip = skipper(opts.skip), byNode = opts.detail === 'node', L = (id) => `**${this.lab(id)}**`;
    const st = { dist: this._init(INF), prev: this._init(null), prevEdge: this._init(null), queue: [src], done: [] };
    st.dist[K(src)] = 0; const events = [];
    const push = (ev) => { Object.assign(ev, this._snap(st)); ev.view = bfsView(ev); events.push(ev); };
    push({ type: 'init', line: [1, 2], node: src, note: `Start at ${L(src)}: it gets distance 0 and is the only vertex in the queue.` });
    while (st.queue.length) {
      const u = st.queue.shift(); st.done.push(u); const found = [], du = st.dist[K(u)];
      if (!byNode) push({ type: 'dequeue', line: 4, node: u, note: `Dequeue ${L(u)} (distance ${du}) and scan its neighbours.` });
      for (const { id: w, edge } of this.adj(u)) {
        if (skip(w, edge)) continue;
        if (st.dist[K(w)] === INF) {
          st.dist[K(w)] = du + 1; st.prev[K(w)] = u; st.prevEdge[K(w)] = edge; st.queue.push(w); found.push(w);
          if (!byNode) push({ type: 'discover', line: 7, node: u, edge, to: w, note: `${L(w)} is new: distance ${du} + 1 = ${du + 1}, parent ${L(u)}; enqueue it.` });
        } else if (!byNode) push({ type: 'edge', line: 6, node: u, edge, to: w, skipped: true, note: `${L(w)} was already discovered (distance ${fmtNum(st.dist[K(w)])}): nothing to do.` });
      }
      if (byNode) push({ type: 'visit', line: [4, 5, 6, 7], node: u, found, note: `Dequeue ${L(u)} (distance ${du})` + (found.length ? `; discover ${found.map(L).join(', ')} at distance ${du + 1}.` : '; no new neighbours.') });
    }
    push({ type: 'done', line: 3, note: `The queue is empty: ${st.done.length} vertices reached; the green edges form a shortest-path tree.` });
    return { dist: st.dist, prev: st.prev, prevEdge: st.prevEdge, order: st.done, events, code: CODE.bfs };
  }
  /** Depth-first search from src (or from every unvisited vertex in order). Edge kinds: tree, back, forward, cross. */
  dfs(src, opts = {}) {
    this._index(); const skip = skipper(opts.skip), L = (id) => `**${this.lab(id)}**`;
    const st = { color: this._init(0), d: this._init(null), f: this._init(null), prev: this._init(null), prevEdge: this._init(null), stack: [], order: [], post: [], kinds: new Map() };
    let time = 0; const events = [];
    const push = (ev) => { Object.assign(ev, this._snap(st)); ev.view = dfsView(ev); events.push(ev); };
    const enter = (u, from, edge) => {
      st.color[K(u)] = 1; st.d[K(u)] = ++time; st.order.push(u); st.stack.push(u);
      if (edge) { st.kinds.set(edge, 'tree'); st.prev[K(u)] = from; st.prevEdge[K(u)] = edge; }
      push({ type: 'enter', line: edge ? [5, 3] : [2, 3], node: u, edge, from, note: (edge ? `${L(u)} is white: tree edge ${this.lab(from)}→${this.lab(u)}. ` : `Start a search at ${L(u)}. `) + `Discover ${L(u)} at time ${time}.` });
    };
    const visit = (r) => {
      enter(r, null, null); const frames = [{ u: r, it: this.adj(r), k: 0 }];
      while (frames.length) {
        const top = frames[frames.length - 1];
        if (top.k < top.it.length) {
          const { id: w, edge } = top.it[top.k++];
          if (skip(w, edge) || st.kinds.has(edge)) continue;
          const c = st.color[K(w)];
          if (c === 0) { enter(w, top.u, edge); frames.push({ u: w, it: this.adj(w), k: 0 }); }
          else {
            const kind = c === 1 ? 'back' : !this.isDirected(edge) ? 'back' : st.d[K(top.u)] < st.d[K(w)] ? 'forward' : 'cross'; st.kinds.set(edge, kind);
            push({ type: kind, line: 4, node: top.u, edge, to: w, note: `${this.lab(top.u)}→${this.lab(w)} is a **${kind} edge** (${L(w)} is ${c === 1 ? 'grey: still on the stack' : 'black: finished'}).` });
          }
        } else {
          frames.pop(); st.color[K(top.u)] = 2; st.f[K(top.u)] = ++time; st.post.push(top.u); st.stack.pop();
          push({ type: 'finish', line: 6, node: top.u, note: `All neighbours of ${L(top.u)} done: finish it at time ${time}.` });
        }
      }
    };
    if (src != null) visit(src); else for (const n of this._nodes) if (st.color[K(n.id)] === 0 && !skip(n.id)) visit(n.id);
    push({ type: 'done', line: 2, note: `Search complete: discovery/finish times nest like parentheses.` });
    return { d: st.d, f: st.f, prev: st.prev, order: st.order, post: st.post, kinds: st.kinds, events, code: CODE.dfs };
  }
  /** Dijkstra's algorithm (non-negative weights). opts: {skip, all: also relax edges into finished vertices}. */
  dijkstra(src, opts = {}) {
    this._index(); const skip = skipper(opts.skip), L = (id) => `**${this.lab(id)}**`;
    const st = { dist: this._init(INF), prev: this._init(null), prevEdge: this._init(null), done: [] };
    st.dist[K(src)] = 0; const events = [], left = new Set(this._nodes.filter((n) => !skip(n.id)).map((n) => K(n.id)));
    const push = (ev) => { Object.assign(ev, this._snap(st)); ev.view = dijkstraView(ev); events.push(ev); };
    push({ type: 'init', line: [1, 2], node: src, note: `Every distance starts at ∞ except ${L(src)}, which gets 0.` });
    while (left.size) {
      let u = null; for (const n of this._nodes) { const k = K(n.id); if (left.has(k) && (u == null || st.dist[k] < st.dist[K(u)])) u = n.id; }
      if (u == null || st.dist[K(u)] === INF) { push({ type: 'unreachable', line: 3, note: `The remaining vertices have distance ∞: they cannot be reached from ${L(src)}.` }); break; }
      left.delete(K(u)); st.done.push(u); const du = st.dist[K(u)];
      push({ type: 'extract', line: 4, node: u, note: `Extract ${L(u)}, the closest unfinished vertex: its distance ${fmtNum(du)} is now final.` });
      for (const { id: v, edge, w } of this.adj(u)) {
        if (skip(v, edge) || (!opts.all && !left.has(K(v)))) continue;
        const old = st.dist[K(v)], nd = du + w, better = nd < old;
        if (better) { st.dist[K(v)] = nd; st.prev[K(v)] = u; st.prevEdge[K(v)] = edge; }
        push({ type: 'relax', line: better ? 7 : 6, node: u, edge, to: v, improved: better, old, new: nd,
          note: `Relax ${this.lab(u)}→${this.lab(v)}: ${fmtNum(du)} + ${fmtNum(w)} = ${fmtNum(nd)} ${better ? `< ${fmtNum(old)}, so ${L(v)} improves to ${fmtNum(nd)} via ${this.lab(u)}.` : `≥ ${fmtNum(old)}: no improvement.`}` });
      }
    }
    push({ type: 'done', line: 3, note: `Done. The green edges form the shortest-path tree from ${L(src)}.` });
    return { dist: st.dist, prev: st.prev, prevEdge: st.prevEdge, order: st.done, events, code: CODE.dijkstra };
  }
  /** Kahn's topological sort (edges read from → to). {order, cycle, events}. */
  topoSort() {
    this._index(); const L = (id) => `**${this.lab(id)}**`, ids = this._nodes.map((n) => n.id), out = new Map(ids.map((id) => [K(id), []]));
    const st = { indeg: this._init(0), queue: [], order: [], removed: [] };
    for (const e of this._edges) if (out.has(K(e.from)) && out.has(K(e.to))) { out.get(K(e.from)).push(e); st.indeg[K(e.to)]++; }
    for (const id of ids) if (!st.indeg[K(id)]) st.queue.push(id);
    const events = []; const push = (ev) => { Object.assign(ev, this._snap(st)); ev.view = topoView(ev); events.push(ev); };
    push({ type: 'init', line: [1, 2], note: `In-degrees computed; the sources ${st.queue.map(L).join(', ') || '(none)'} have in-degree 0.` });
    while (st.queue.length) {
      const u = st.queue.shift(); st.order.push(u);
      push({ type: 'pop', line: 4, node: u, note: `Output ${L(u)} as number ${st.order.length}.` });
      for (const e of out.get(K(u))) {
        const v = e.to; st.indeg[K(v)]--; st.removed.push(e); const z = st.indeg[K(v)] === 0; if (z) st.queue.push(v);
        push({ type: z ? 'push' : 'decrement', line: z ? 7 : 6, node: u, edge: e, to: v, note: `Remove ${this.lab(u)}→${this.lab(v)}: in-degree of ${L(v)} drops to ${st.indeg[K(v)]}${z ? ', so it joins the queue.' : '.'}` });
      }
    }
    const cycle = st.order.length < ids.length;
    push({ type: 'done', line: cycle ? 8 : 3, cycle, note: cycle ? `Stuck with ${ids.length - st.order.length} vertices left: they lie on a directed cycle.` : `All ${ids.length} vertices output: a topological order.` });
    return { order: st.order, cycle, events, code: CODE.topo };
  }
  /** Connected components (direction ignored): arrays of ids. */
  components() {
    this._index(); const seen = new Set(), out = [];
    for (const n of this._nodes) {
      if (seen.has(K(n.id))) continue; const comp = [], q = [n.id]; seen.add(K(n.id));
      while (q.length) { const u = q.shift(); comp.push(u); for (const { id } of this.adj(u).concat(this.inn(u))) if (!seen.has(K(id))) { seen.add(K(id)); q.push(id); } }
      out.push(comp);
    }
    return out;
  }
  /** Strongly connected components (Tarjan), in reverse topological order. */
  scc() {
    this._index(); let idx = 0; const I = {}, low = {}, on = new Set(), S = [], out = [];
    const go = (u) => {
      I[K(u)] = low[K(u)] = idx++; S.push(u); on.add(K(u));
      for (const { id: w } of this.adj(u)) { if (I[K(w)] == null) { go(w); low[K(u)] = Math.min(low[K(u)], low[K(w)]); } else if (on.has(K(w))) low[K(u)] = Math.min(low[K(u)], I[K(w)]); }
      if (low[K(u)] === I[K(u)]) { const c = []; let w; do { w = S.pop(); on.delete(K(w)); c.push(w); } while (K(w) !== K(u)); out.push(c); }
    };
    for (const n of this._nodes) if (I[K(n.id)] == null) go(n.id);
    return out;
  }
  /** Kruskal's minimum spanning tree/forest. {edges, weight, events}. */
  mst() {
    this._index(); const L = (id) => this.lab(id);
    const parent = new Map(this._nodes.map((n) => [K(n.id), K(n.id)])), size = new Map(this._nodes.map((n) => [K(n.id), 1])), colorOf = new Map();
    const find = (k) => { while (parent.get(k) !== k) { parent.set(k, parent.get(parent.get(k))); k = parent.get(k); } return k; };
    const sorted = this._edges.map((e, i) => [e, i]).filter(([e]) => parent.has(K(e.from)) && parent.has(K(e.to))).sort((a, b) => (a[0].w ?? 1) - (b[0].w ?? 1) || a[1] - b[1]).map(([e]) => e);
    const st = { chosen: [], rejected: [], comp: {}, weight: 0, sorted }; let used = 0;
    const comp = () => { const o = {}; for (const n of this._nodes) { const r = find(K(n.id)); o[K(n.id)] = size.get(r) > 1 ? colorOf.get(r) : null; } return o; };
    const events = []; const push = (ev) => { st.comp = comp(); Object.assign(ev, this._snap(st)); ev.view = mstView(ev); events.push(ev); };
    push({ type: 'init', line: [1, 2], note: `Sort the ${sorted.length} edges by weight: ${sorted.map((e) => fmtNum(e.w ?? 1)).join(', ')}. Every vertex starts as its own tree.` });
    for (const e of sorted) {
      const a = find(K(e.from)), b = find(K(e.to)), w = e.w ?? 1;
      if (a !== b) {
        const [big, small] = size.get(a) >= size.get(b) ? [a, b] : [b, a];
        const col = colorOf.get(big) ?? colorOf.get(small) ?? COMP[used++ % COMP.length];
        parent.set(small, big); size.set(big, size.get(a) + size.get(b)); colorOf.set(big, col); st.chosen.push(e); st.weight += w;
        push({ type: 'accept', line: 5, edge: e, note: `Edge ${L(e.from)}–${L(e.to)} (weight ${fmtNum(w)}) joins two different trees: **take it**. Total ${fmtNum(st.weight)}.` });
      } else { st.rejected.push(e); push({ type: 'reject', line: 6, edge: e, note: `Edge ${L(e.from)}–${L(e.to)} (weight ${fmtNum(w)}) has both ends in the same tree: it would close a cycle — **skip**.` }); }
    }
    push({ type: 'done', line: 3, note: `Done: ${st.chosen.length} edges, total weight **${fmtNum(st.weight)}**.` });
    return { edges: st.chosen, weight: st.weight, events, code: CODE.mst };
  }
  /** Residual arcs for a flow (array aligned with this.edges): [{from, to, w (residual capacity), forward, edge, key}]. */
  residual(flow) {
    const out = [];
    this._edges.forEach((e, i) => {
      const c = e.cap ?? e.w ?? 1, f = flow?.[i] ?? 0, lo = this.isDirected(e) ? 0 : -c;
      if (c - f > 1e-12) out.push({ from: e.from, to: e.to, w: +(c - f).toFixed(9), forward: true, edge: e, key: i + '+' });
      if (f - lo > 1e-12) out.push({ from: e.to, to: e.from, w: +(f - lo).toFixed(9), forward: false, edge: e, key: i + '-' });
    });
    return out;
  }
  /** Edmonds–Karp maximum flow (capacity = e.cap ?? e.w). {value, flow (by edge index), cut (source side ids), events}. */
  maxflow(s, t) {
    this._index(); const L = (id) => `**${this.lab(id)}**`, idx = new Map(this._edges.map((e, i) => [e, i]));
    const st = { flow: this._edges.map(() => 0), value: 0, path: [], residual: [], bottleneck: null, cut: null };
    const events = []; const push = (ev) => { st.residual = this.residual(st.flow); Object.assign(ev, this._snap(st)); ev.s = s; ev.t = t; ev.view = flowView(ev, idx, this); ev.residualView = residualView(ev); events.push(ev); };
    push({ type: 'init', line: 1, note: `Start with zero flow. The residual graph (right) is the network itself.` });
    for (let guard = 0; guard < 1000; guard++) {
      const R = this.residual(st.flow), out = new Map(this._nodes.map((n) => [K(n.id), []])); for (const a of R) out.get(K(a.from))?.push(a);
      const via = new Map([[K(s), null]]), q = [s];
      while (q.length && !via.has(K(t))) { const u = q.shift(); for (const a of out.get(K(u)) || []) if (!via.has(K(a.to))) { via.set(K(a.to), a); q.push(a.to); } }
      if (!via.has(K(t))) { st.cut = [...via.keys()]; st.path = []; st.bottleneck = null; break; }
      const path = []; for (let k = K(t); via.get(k); k = K(via.get(k).from)) path.unshift(via.get(k));
      const b = Math.min(...path.map((a) => a.w)); st.path = path; st.bottleneck = b;
      push({ type: 'path', line: [3, 4], note: `Augmenting path ${[s, ...path.map((a) => a.to)].map((id) => this.lab(id)).join(' → ')} (${path.length} arcs${path.some((a) => !a.forward) ? ', using a backward arc' : ''}); its bottleneck is **${fmtNum(b)}**.` });
      for (const a of path) st.flow[idx.get(a.edge)] += a.forward ? b : -b;
      st.value += b;
      push({ type: 'augment', line: 5, note: `Push ${fmtNum(b)} units along it: the flow value is now **${fmtNum(st.value)}**.` });
    }
    const cutSet = new Set(st.cut || []), cap = this._edges.filter((e) => cutSet.has(K(e.from)) && !cutSet.has(K(e.to))).reduce((x, e) => x + (e.cap ?? e.w ?? 1), 0);
    push({ type: 'done', line: [2, 6], note: `No augmenting path left: maximum flow **${fmtNum(st.value)}** = capacity ${fmtNum(cap)} of the cut {${(st.cut || []).map((k) => this.lab(k)).join(', ')}} | rest (red edges).` });
    return { value: st.value, flow: st.flow, cut: st.cut, events, code: CODE.maxflow };
  }
}

// ------------------------------------------------------------------ default views for algorithm events
const keyset = (a) => new Set((a || []).map(K));
function bfsView(ev) {
  const done = keyset(ev.done), inQ = keyset(ev.queue), tree = new Set(Object.values(ev.prevEdge).filter(Boolean)), cur = ev.node != null && ev.type !== 'done' ? K(ev.node) : null;
  const fresh = new Set(ev.type === 'visit' ? (ev.found || []).map((w) => ev.prevEdge[K(w)]) : []);
  return {
    nodeFill: (id) => (K(id) === cur ? 'gold' : done.has(K(id)) ? 'accent' : null),
    nodeColor: (id) => (inQ.has(K(id)) ? 'orange' : null),
    nodeNote: (id) => (ev.dist[K(id)] < INF ? ev.dist[K(id)] : null),
    noteColor: (id) => (done.has(K(id)) ? 'accent' : 'orange'),
    edgeColor: (e) => (e === ev.edge ? (ev.skipped ? 'red' : 'orange') : fresh.has(e) ? 'orange' : tree.has(e) ? 'green' : null),
    edgeWidth: (e) => (e === ev.edge || fresh.has(e) ? 3.4 : tree.has(e) ? 3 : null),
    edgeDash: (e) => e === ev.edge && !!ev.skipped,
  };
}
function dfsView(ev) {
  const cur = ev.node != null && ev.type !== 'done' ? K(ev.node) : null, KC = { tree: 'green', back: 'red', forward: 'purple', cross: 'teal' };
  return {
    nodeFill: (id) => (K(id) === cur ? 'gold' : ev.color[K(id)] === 2 ? 'accent' : null),
    nodeColor: (id) => (ev.color[K(id)] === 1 ? 'orange' : null),
    nodeNote: (id) => (ev.d[K(id)] != null ? `${ev.d[K(id)]}/${ev.f[K(id)] ?? '·'}` : null),
    noteColor: (id) => (ev.color[K(id)] === 2 ? 'accent' : 'orange'),
    edgeColor: (e) => KC[ev.kinds.get(e)] || null,
    edgeWidth: (e) => (e === ev.edge ? 3.6 : ev.kinds.get(e) === 'tree' ? 3 : ev.kinds.has(e) ? 2 : null),
    edgeDash: (e) => !!ev.kinds.get(e) && ev.kinds.get(e) !== 'tree',
  };
}
function dijkstraView(ev) {
  const done = keyset(ev.done), tree = new Set(Object.values(ev.prevEdge).filter(Boolean)), cur = ev.node != null && ev.type !== 'done' && ev.type !== 'init' ? K(ev.node) : null;
  return {
    nodeFill: (id) => (K(id) === cur ? 'gold' : done.has(K(id)) ? 'accent' : null),
    nodeColor: (id) => (ev.dist[K(id)] < INF ? 'orange' : null),
    nodeNote: (id) => fmtNum(ev.dist[K(id)]),
    noteColor: (id) => (done.has(K(id)) ? 'accent' : ev.dist[K(id)] < INF ? 'orange' : 'faint'),
    edgeColor: (e) => (e === ev.edge ? (ev.improved ? 'orange' : 'red') : tree.has(e) ? 'green' : null),
    edgeWidth: (e) => (e === ev.edge ? 3.6 : tree.has(e) ? 3 : null),
    edgeDash: (e) => e === ev.edge && !ev.improved,
  };
}
function topoView(ev) {
  const out = new Map((ev.order || []).map((id, i) => [K(id), i + 1])), inQ = keyset(ev.queue), removed = new Set(ev.removed);
  return {
    nodeFill: (id) => (ev.node != null && K(id) === K(ev.node) && ev.type === 'pop' ? 'gold' : out.has(K(id)) ? 'accent' : null),
    nodeColor: (id) => (inQ.has(K(id)) ? 'orange' : ev.type === 'done' && ev.cycle && !out.has(K(id)) ? 'red' : null),
    nodeNote: (id) => (out.has(K(id)) ? `#${out.get(K(id))}` : `in ${ev.indeg[K(id)]}`),
    noteColor: (id) => (out.has(K(id)) ? 'accent' : ev.indeg[K(id)] ? 'muted' : 'orange'),
    edgeColor: (e) => (e === ev.edge ? 'orange' : null),
    edgeWidth: (e) => (e === ev.edge ? 3.4 : null),
    dim: [...removed].filter((e) => e !== ev.edge),
  };
}
function mstView(ev) {
  const chosen = new Set(ev.chosen), rejected = new Set(ev.rejected);
  return {
    nodeColor: (id) => ev.comp[K(id)] || null,
    edgeColor: (e) => (e === ev.edge ? (ev.type === 'accept' ? 'green' : 'red') : chosen.has(e) ? 'green' : null),
    edgeWidth: (e) => (e === ev.edge ? 4 : chosen.has(e) ? 3.4 : null),
    edgeDash: (e) => rejected.has(e),
    dim: ev.type === 'done' ? [...rejected] : [...rejected].filter((e) => e !== ev.edge),
  };
}
function flowView(ev, idx, G) {
  const onPath = new Set(ev.path.map((a) => a.edge)), cut = ev.cut ? new Set(ev.cut.map(K)) : null;
  const maxC = Math.max(1, ...G.edges.map((e) => e.cap ?? e.w ?? 1));
  const isCut = (e) => cut && cut.has(K(e.from)) && !cut.has(K(e.to));
  return {
    edgeLabel: (e) => `${fmtNum(ev.flow[idx.get(e)])}/${fmtNum(e.cap ?? e.w ?? 1)}`,
    edgeColor: (e) => (isCut(e) ? 'red' : onPath.has(e) ? 'orange' : ev.flow[idx.get(e)] ? 'accent' : null),
    edgeWidth: (e) => (onPath.has(e) ? 3.6 : 1.5 + 3 * Math.abs(ev.flow[idx.get(e)]) / maxC),
    nodeColor: (id) => (cut ? (cut.has(K(id)) ? 'teal' : null) : K(id) === K(ev.s) || K(id) === K(ev.t) ? 'accent' : null),
  };
}
function residualView(ev) {
  const keys = new Set(ev.path.map((a) => a.key));
  return {
    edgeColor: (a) => (keys.has(a.key) ? 'orange' : a.forward ? null : 'purple'),
    edgeWidth: (a) => (keys.has(a.key) ? 3.4 : null),
    edgeDash: (a) => !a.forward && !keys.has(a.key),
    nodeColor: (id) => (ev.cut ? (ev.cut.map(K).includes(K(id)) ? 'teal' : null) : null),
  };
}

// ------------------------------------------------------------------ layouts (return px positions aligned with G.nodes)
function fitPts(P, box, keepAspect, maxScale = Infinity) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of P) { if (!p) continue; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  let sx = x1 > x0 ? box.w / (x1 - x0) : Infinity, sy = y1 > y0 ? box.h / (y1 - y0) : Infinity;
  if (keepAspect) sx = sy = Math.min(sx, sy);
  sx = Math.min(sx, maxScale); sy = Math.min(sy, maxScale); if (!isFinite(sx)) sx = 1; if (!isFinite(sy)) sy = 1;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return P.map((p) => p && [box.cx + (p[0] - cx) * sx, box.cy + (p[1] - cy) * sy]);
}
function crossings(P, E) {
  let c = 0; const ccw = (a, b, d) => (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
  for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) {
    const [a, b] = E[i], [p, q] = E[j]; if (a === p || a === q || b === p || b === q) continue;
    if (ccw(P[a], P[b], P[p]) * ccw(P[a], P[b], P[q]) < 0 && ccw(P[p], P[q], P[a]) * ccw(P[p], P[q], P[b]) < 0) c++;
  }
  return c;
}
const LAYOUTS = {
  none(G, box) { const miss = G.nodes.filter((n) => n.x == null || n.y == null); if (!miss.length) return null; const C = LAYOUTS.circle({ nodes: miss }, box); return G.nodes.map((n) => (miss.includes(n) ? C[miss.indexOf(n)] : null)); },
  /** Use the given x, y as relative coordinates (y up) and fit them into the view, keeping the aspect ratio. */
  fit(G, box) { return fitPts(G.nodes.map((n) => [n.x ?? 0, -(n.y ?? 0)]), box, true); },
  circle(G, box, o = {}) { const n = G.nodes.length, R = Math.min(box.w, box.h) / 2, a0 = ((o.startAngle ?? 90) * Math.PI) / 180; return G.nodes.map((_, i) => [box.cx + R * Math.cos(a0 - (TAU * i) / n), box.cy - R * Math.sin(a0 - (TAU * i) / n)]); },
  grid(G, box, o = {}) {
    const n = G.nodes.length, cols = o.cols ?? Math.ceil(Math.sqrt(n * Math.max(0.5, box.w / Math.max(1, box.h)))), rows = Math.ceil(n / cols);
    return fitPts(G.nodes.map((nd, i) => [nd.col ?? i % cols, nd.row ?? Math.floor(i / cols)]), box, true, rows === 1 && cols === 1 ? 1 : Infinity);
  },
  /** Seeded Fruchterman–Reingold (fixed iterations, best of several seeds by edge crossings). */
  force(G, box, o = {}) {
    const N = G.nodes, n = N.length, ix = new Map(N.map((nd, i) => [K(nd.id), i]));
    const E = G.edges.map((e) => [ix.get(K(e.from)), ix.get(K(e.to))]).filter(([a, b]) => a != null && b != null && a !== b);
    const fixed = N.map((nd) => !!nd.fixed && nd.x != null), anyFixed = fixed.some(Boolean);
    const W = Math.max(box.w, 1), H = Math.max(box.h, 1), k = Math.sqrt((W * H) / n) * (o.spread ?? 0.8), iters = o.iterations ?? 300;
    const run = (seed) => {
      const r = RNG(seed), P = N.map((nd, i) => (fixed[i] ? [G.s.X(nd.x) - box.l, G.s.Y(nd.y) - box.t] : [r() * W, r() * H]));
      for (let it = 0; it < iters; it++) {
        const t = (W / 6) * (1 - it / iters) + 0.3, D = P.map(() => [0, 0]);
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
          let dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], d2 = dx * dx + dy * dy; if (d2 < 1e-4) { dx = 0.01 * (i - j); dy = 0.01; d2 = 2e-4; }
          const f = (k * k) / d2; D[i][0] += dx * f; D[i][1] += dy * f; D[j][0] -= dx * f; D[j][1] -= dy * f;
        }
        for (const [a, b] of E) { const dx = P[a][0] - P[b][0], dy = P[a][1] - P[b][1], f = Math.hypot(dx, dy) / k; D[a][0] -= dx * f; D[a][1] -= dy * f; D[b][0] += dx * f; D[b][1] += dy * f; }
        for (let i = 0; i < n; i++) { D[i][0] -= (P[i][0] - W / 2) * 0.06; D[i][1] -= (P[i][1] - H / 2) * 0.06; }
        for (let i = 0; i < n; i++) if (!fixed[i]) { const d = Math.hypot(D[i][0], D[i][1]) || 1, m = Math.min(d, t); P[i][0] += (D[i][0] / d) * m; P[i][1] += (D[i][1] / d) * m; if (anyFixed) { P[i][0] = clamp(P[i][0], 0, W); P[i][1] = clamp(P[i][1], 0, H); } }
      }
      if (anyFixed) return P.map(([x, y]) => [x + box.l, y + box.t]);
      // rotate onto the principal axes (long axis along the long side of the box), then scale with limited stretch
      const cx = P.reduce((t, p) => t + p[0], 0) / n, cy = P.reduce((t, p) => t + p[1], 0) / n;
      let sxx = 0, syy = 0, sxy = 0; for (const [x, y] of P) { sxx += (x - cx) ** 2; syy += (y - cy) ** 2; sxy += (x - cx) * (y - cy); }
      const th = 0.5 * Math.atan2(2 * sxy, sxx - syy) + (box.w >= box.h ? 0 : Math.PI / 2), co = Math.cos(th), si = Math.sin(th);
      const Q = P.map(([x, y]) => [(x - cx) * co + (y - cy) * si, -(x - cx) * si + (y - cy) * co]);
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const [x, y] of Q) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const fx = x1 > x0 ? box.w / (x1 - x0) : Infinity, fy = y1 > y0 ? box.h / (y1 - y0) : Infinity, f = Math.min(fx, fy), str = o.stretch ?? 1.35;
      const kx = isFinite(f) ? Math.min(fx, f * str) : 1, ky = isFinite(f) ? Math.min(fy, f * str) : 1;
      const R = Q.map(([x, y]) => [box.cx + (x - (x0 + x1) / 2) * (isFinite(kx) ? kx : 1), box.cy + (y - (y0 + y1) / 2) * (isFinite(ky) ? ky : 1)]);
      // push apart nodes that ended up too close
      const rad = N.map((nd) => { const g = G._size(nd, o); return Math.max(g.hw, g.hh); });
      for (let it = 0; it < 40; it++) {
        let moved = false;
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
          const dx = R[j][0] - R[i][0], dy = R[j][1] - R[i][1], d = Math.hypot(dx, dy) || 0.01, m = rad[i] + rad[j] + 22;
          if (d < m) { const push = (m - d) / 2, ux = dx / d, uy = dy / d; R[i][0] -= ux * push; R[i][1] -= uy * push; R[j][0] += ux * push; R[j][1] += uy * push; moved = true; }
        }
        for (const p of R) { p[0] = clamp(p[0], box.l, box.r); p[1] = clamp(p[1], box.t, box.b); }
        if (!moved) break;
      }
      return R;
    };
    const tries = o.restarts ?? (n <= 40 ? 8 : 1); let best = null, bc = Infinity, bd = 0;
    for (let s = 0; s < tries; s++) {
      const P = run((o.seed ?? 1) + s * 7919), c = crossings(P, E);
      let md = Infinity; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) md = Math.min(md, Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]));
      if (c < bc || (c === bc && md > bd)) { best = P; bc = c; bd = md; }
    }
    return best;
  },
  /** Sugiyama-lite for DAGs: cycle breaking, longest-path layers, dummy nodes, barycentre ordering, aligned coordinates. */
  layered(G, box, o = {}) {
    const N = G.nodes, n = N.length, ix = new Map(N.map((nd, i) => [K(nd.id), i])), horiz = o.rankdir === 'right' || o.rankdir === 'left';
    const E = []; G.edges.forEach((e) => { const u = ix.get(K(e.from)), v = ix.get(K(e.to)); if (u != null && v != null && u !== v) E.push([u, v, e]); });
    // 1. break cycles (reverse DFS back edges)
    const out = N.map(() => []), state = new Uint8Array(n), rev = new Set(); E.forEach(([u], k) => out[u].push(k));
    const visit = (u) => { state[u] = 1; for (const k of out[u]) { const v = E[k][1]; if (state[v] === 1) rev.add(k); else if (!state[v]) visit(v); } state[u] = 2; };
    for (let u = 0; u < n; u++) if (!state[u]) visit(u);
    const D = E.map(([u, v], k) => (rev.has(k) ? [v, u] : [u, v]));
    const succ = N.map(() => []), pred = N.map(() => []); D.forEach(([u, v]) => { succ[u].push(v); pred[v].push(u); });
    // 2. layers: longest path, then pull sources down next to their children
    const indeg = pred.map((p) => p.length), order = [], q = []; for (let u = 0; u < n; u++) if (!indeg[u]) q.push(u);
    while (q.length) { const u = q.shift(); order.push(u); for (const v of succ[u]) if (!--indeg[v]) q.push(v); }
    const layer = new Array(n).fill(0);
    for (const u of order) { if (N[u].layer != null) layer[u] = Math.max(layer[u], N[u].layer); for (const v of succ[u]) layer[v] = Math.max(layer[v], layer[u] + 1); }
    for (let k = order.length - 1; k >= 0; k--) { const u = order[k]; if (!pred[u].length && succ[u].length && N[u].layer == null) layer[u] = Math.min(...succ[u].map((v) => layer[v])) - 1; }
    const nL = Math.max(0, ...layer) + 1;
    // 3. virtual nodes (real + dummies) and unit-length virtual edges
    const ext = (nd) => { const g = G._size(nd, o); return horiz ? 2 * g.hh : 2 * g.hw; };
    const V = N.map((nd, i) => ({ i, layer: layer[i], dummy: false, w: ext(nd), up: [], down: [] })), chains = [];
    D.forEach(([u, v], k) => { let a = u; const ch = []; for (let l = layer[u] + 1; l < layer[v]; l++) { const d = V.length; V.push({ layer: l, dummy: true, w: 0, up: [], down: [] }); ch.push(d); V[a].down.push(d); V[d].up.push(a); a = d; } V[a].down.push(v); V[v].up.push(a); chains[k] = ch; });
    let layers = Array.from({ length: nL }, () => []); V.forEach((x, k) => { x.k = k; layers[x.layer].push(x); });
    const setPos = (arr) => arr.forEach((x, p) => (x.pos = p)); layers.forEach(setPos);
    const count = () => { let c = 0; for (let l = 0; l + 1 < nL; l++) { const es = []; for (const x of layers[l]) for (const b of x.down) es.push([x.pos, V[b].pos]); for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) if ((es[i][0] - es[j][0]) * (es[i][1] - es[j][1]) < 0) c++; } return c; };
    // 4. crossing reduction: barycentre sweeps, keep the best ordering
    let best = layers.map((a) => a.slice()), bc = count();
    for (let it = 0; it < 24 && bc > 0; it++) {
      const down = it % 2 === 0;
      for (let s = 1; s < nL; s++) {
        const l = down ? s : nL - 1 - s, ref = down ? 'up' : 'down';
        for (const x of layers[l]) x.bc = x[ref].length ? x[ref].reduce((t, b) => t + V[b].pos, 0) / x[ref].length : x.pos;
        layers[l].sort((a, b) => a.bc - b.bc || a.pos - b.pos); setPos(layers[l]);
      }
      const c = count(); if (c < bc) { bc = c; best = layers.map((a) => a.slice()); }
    }
    layers = best; layers.forEach(setPos);
    // 5. coordinates across layers: ordered, separated, pulled toward neighbours
    const gap = o.gap ?? (horiz ? 14 : 22), sep = (a, b) => (a.w + b.w) / 2 + (a.dummy && b.dummy ? 10 : a.dummy || b.dummy ? 14 : gap);
    for (const arr of layers) { let x = 0; arr.forEach((v, p) => { if (p) x += sep(arr[p - 1], v); v.x = x; }); const m = x / 2; arr.forEach((v) => (v.x -= m)); }
    const place = (arr, want) => {
      const m = arr.length, a = new Array(m), b = new Array(m);
      for (let p = 0; p < m; p++) a[p] = p ? Math.max(want[p], a[p - 1] + sep(arr[p - 1], arr[p])) : want[p];
      for (let p = m - 1; p >= 0; p--) b[p] = p < m - 1 ? Math.min(want[p], b[p + 1] - sep(arr[p], arr[p + 1])) : want[p];
      arr.forEach((v, p) => (v.x = (a[p] + b[p]) / 2));
    };
    const mean = (x, refs) => (refs.length ? refs.reduce((t, b) => t + V[b].x, 0) / refs.length : x.x);
    for (let it = 0; it < 16; it++) {
      const down = it % 2 === 0;
      for (let s = 1; s < nL; s++) { const l = down ? s : nL - 1 - s, arr = layers[l]; place(arr, arr.map((x) => mean(x, x.dummy ? x.up.concat(x.down) : down ? x.up : x.down))); }
    }
    for (const arr of layers) place(arr, arr.map((x) => mean(x, x.up.concat(x.down))));
    // straighten dummy chains where the neighbours in their layers leave room
    chains.forEach((ch, k) => {
      const [u, v] = D[k];
      for (const d of ch) {
        const X = V[d], arr = layers[X.layer], p = X.pos, t = (X.layer - layer[u]) / (layer[v] - layer[u]), want = V[u].x + (V[v].x - V[u].x) * t;
        X.x = clamp(want, p > 0 ? arr[p - 1].x + sep(arr[p - 1], X) : -Infinity, p < arr.length - 1 ? arr[p + 1].x - sep(X, arr[p + 1]) : Infinity);
      }
    });
    // 6. to pixels
    let lo = Infinity, hi = -Infinity; for (const x of V) { lo = Math.min(lo, x.x); hi = Math.max(hi, x.x); }
    const across = horiz ? box.h : box.w, sc = hi > lo ? Math.min(o.stretch ?? 2.2, across / (hi - lo)) : 1, mid = (lo + hi) / 2, along = horiz ? box.w : box.h;
    const px = (x) => {
      const a = nL > 1 ? (x.layer / (nL - 1)) * along : along / 2, c = (x.x - mid) * sc;
      const A = o.rankdir === 'up' || o.rankdir === 'left' ? along - a : a;
      return horiz ? [box.l + A, box.cy + c] : [box.cx + c, box.t + A];
    };
    const P = V.map(px);
    D.forEach((_, k) => { const e = E[k][2], ch = chains[k]; if (ch.length) { const pts = ch.map((d) => [G.s.invX(P[d][0]), G.s.invY(P[d][1])]); e._via = rev.has(k) ? pts.reverse() : pts; e._viaAxis = horiz ? 0 : 1; } });
    return P.slice(0, n);
  },
  /** Tidy tree (Reingold–Tilford style contours) from o.root; o.tidy === false puts leaves at even spacing. Edges may carry side: 'left'|'right'. */
  tree(G, box, o = {}) {
    const N = G.nodes, horiz = o.rankdir === 'right' || o.rankdir === 'left', kids = new Map(), seen = new Set(), roots = [];
    let root = o.root; if (root == null) root = (G.directed ? N.find((nd) => !G.inn(nd.id).length)?.id : null) ?? N[0].id;
    const grow = (r) => {
      roots.push(r); seen.add(K(r)); const q = [r];
      while (q.length) {
        const u = q.shift(), ch = [];
        for (const { id, edge } of G.adj(u)) if (!seen.has(K(id))) { seen.add(K(id)); ch.push({ id, side: edge.side }); q.push(id); }
        if (ch.length === 1 && ch[0].side) ch.push({ phantom: true, side: ch[0].side === 'left' ? 'right' : 'left' });
        if (ch.some((c) => c.side)) ch.sort((a, b) => (a.side === 'left' ? 0 : 1) - (b.side === 'left' ? 0 : 1));
        kids.set(K(u), ch);
      }
    };
    grow(root); for (const nd of N) if (!seen.has(K(nd.id))) grow(nd.id);
    const half = (c) => { const nd = c.phantom ? null : G.node(c.id); const g = nd ? G._size(nd, o) : G._size({ id: '' }, o); return horiz ? g.hh : g.hw; };
    const gap = o.gap ?? (horiz ? 8 : 14); let leafX = 0;
    const lay = (c, depth) => {
      const ch = c.phantom ? [] : kids.get(K(c.id)) || [], h = half(c);
      if (!ch.length) { const x = o.tidy === false ? (leafX += 2 * h + gap) : 0; return { items: [[c, x, depth]], L: [x - h], R: [x + h], x }; }
      const subs = ch.map((k) => lay(k, depth + 1));
      if (o.tidy === false) { const x = (subs[0].x + subs[subs.length - 1].x) / 2; return { items: [[c, x, depth], ...subs.flatMap((s) => s.items)], x }; }
      const offs = [0]; const accL = subs[0].L.slice(), accR = subs[0].R.slice();
      for (let k = 1; k < subs.length; k++) {
        const S = subs[k]; let d = -Infinity; for (let lv = 0; lv < Math.min(accR.length, S.L.length); lv++) d = Math.max(d, accR[lv] - S.L[lv] + gap);
        offs[k] = d; for (let lv = 0; lv < S.R.length; lv++) { accR[lv] = S.R[lv] + d; if (lv >= accL.length) accL[lv] = S.L[lv] + d; }
      }
      const m = (offs[0] + offs[offs.length - 1]) / 2, items = [[c, 0, depth]];
      subs.forEach((S, k) => { for (const [w, x, dd] of S.items) items.push([w, x + offs[k] - m, dd]); });
      return { items, L: [-h, ...accL.map((x) => x - m)], R: [h, ...accR.map((x) => x - m)], x: 0 };
    };
    // forest: lay trees side by side
    const items = []; let right = null;
    for (const r of roots) {
      const T = lay({ id: r }, 0);
      if (o.tidy === false) { items.push(...T.items); continue; }
      let d = 0; if (right) { d = -Infinity; for (let lv = 0; lv < Math.min(right.length, T.L.length); lv++) d = Math.max(d, right[lv] - T.L[lv] + gap * 2); }
      for (const [w, x, dd] of T.items) items.push([w, x + d, dd]);
      const R = T.R.map((x) => x + d); right = right ? right.map((x, lv) => (lv < R.length ? R[lv] : x)).concat(R.slice(right.length)) : R;
    }
    const depthMax = Math.max(0, ...items.map((it) => it[2]));
    let lo = Infinity, hi = -Infinity; for (const [, x] of items) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
    const across = horiz ? box.h : box.w, along = horiz ? box.w : box.h, sc = hi > lo ? Math.min(o.stretch ?? 1.8, across / (hi - lo)) : 1, mid = (lo + hi) / 2;
    const pos = new Map();
    for (const [c, x, dd] of items) {
      if (c.phantom) continue; let a = depthMax ? (dd / depthMax) * along : along / 2; if (o.rankdir === 'up' || o.rankdir === 'left') a = along - a;
      const cc = (x - mid) * sc; pos.set(K(c.id), horiz ? [box.l + a, box.cy + cc] : [box.cx + cc, box.t + a]);
    }
    return N.map((nd) => pos.get(K(nd.id)) || null);
  },
};

// ------------------------------------------------------------------ generators: v.graphs(name, ...args)
const ids = (n) => Array.from({ length: n }, (_, i) => ({ id: i }));
export const GENERATORS = {
  /** Erdős–Rényi G(n, p); o.weights = [lo, hi] adds integer weights. */
  random(n = 8, p = 0.3, seed = 1, o = {}) {
    const r = RNG(seed), edges = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (r() < p) edges.push({ from: i, to: j, ...(o.weights ? { w: r.int(o.weights[0], o.weights[1]) } : {}) });
    return { nodes: ids(n), edges, layout: 'force', seed, ...(o.weights ? { weights: true } : {}) };
  },
  /** r × c grid graph; node id = i*c + j with row/col fields. */
  grid(r = 4, c = 5) {
    const nodes = [], edges = [];
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) { nodes.push({ id: i * c + j, row: i, col: j, x: j, y: -i }); if (j + 1 < c) edges.push({ from: i * c + j, to: i * c + j + 1 }); if (i + 1 < r) edges.push({ from: i * c + j, to: (i + 1) * c + j }); }
    return { nodes, edges, layout: 'fit' };
  },
  complete(n = 5) { const edges = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) edges.push({ from: i, to: j }); return { nodes: ids(n), edges, layout: 'circle' }; },
  cycle(n = 6) { return { nodes: ids(n), edges: ids(n).map((_, i) => ({ from: i, to: (i + 1) % n })), layout: 'circle' }; },
  path(n = 5) { return { nodes: ids(n).map((nd, i) => ({ ...nd, x: i, y: 0 })), edges: ids(n - 1).map((_, i) => ({ from: i, to: i + 1 })), layout: 'fit' }; },
  star(n = 6) { return { nodes: ids(n + 1), edges: ids(n).map((_, i) => ({ from: 0, to: i + 1 })), layout: 'force' }; },
  wheel(n = 6) { const nodes = [{ id: 0, x: 0, y: 0 }], edges = []; for (let i = 1; i <= n; i++) { const a = Math.PI / 2 - (TAU * (i - 1)) / n; nodes.push({ id: i, x: Math.cos(a), y: Math.sin(a) }); edges.push({ from: 0, to: i }, { from: i, to: (i % n) + 1 }); } return { nodes, edges, layout: 'fit' }; },
  /** Complete bipartite K_{m,n}: ids 0..m-1 on the left, m..m+n-1 on the right. */
  bipartite(m = 3, n = 3) { const nodes = [], edges = []; for (let i = 0; i < m; i++) nodes.push({ id: i, x: 0, y: -(i - (m - 1) / 2) }); for (let j = 0; j < n; j++) nodes.push({ id: m + j, x: Math.max(m, n) * 0.8, y: -(j - (n - 1) / 2) }); for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) edges.push({ from: i, to: m + j }); return { nodes, edges, layout: 'fit' }; },
  /** Complete k-ary tree of the given depth, rooted at 0. */
  tree(depth = 3, k = 2) { const nodes = [{ id: 0 }], edges = []; let level = [0], id = 1; for (let d = 0; d < depth; d++) { const next = []; for (const p of level) for (let c = 0; c < k; c++) { nodes.push({ id }); edges.push({ from: p, to: id }); next.push(id++); } level = next; } return { nodes, edges, layout: 'tree', root: 0 }; },
  hypercube(d = 3) { const n = 1 << d, edges = []; for (let i = 0; i < n; i++) for (let b = 0; b < d; b++) if (!(i & (1 << b))) edges.push({ from: i, to: i | (1 << b) }); return { nodes: ids(n).map((nd) => ({ ...nd, label: nd.id.toString(2).padStart(d, '0') })), edges, layout: 'force', shape: 'box' }; },
  petersen() {
    const nodes = [], edges = [];
    for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + (TAU * i) / 5; nodes.push({ id: i, x: Math.cos(a), y: Math.sin(a) }); }
    for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + (TAU * i) / 5; nodes.push({ id: i + 5, x: 0.48 * Math.cos(a), y: 0.48 * Math.sin(a) }); }
    for (let i = 0; i < 5; i++) edges.push({ from: i, to: (i + 1) % 5 }, { from: i, to: i + 5 }, { from: i + 5, to: ((i + 2) % 5) + 5 });
    return { nodes, edges, layout: 'fit' };
  },
  /** From a square matrix: non-zero A[i][j] → edge i→j (undirected if symmetric; weights if any entry ≠ 0/1). */
  fromAdjacency(A, labels) {
    const n = A.length, sym = A.every((row, i) => row.every((x, j) => x === A[j][i])), wt = A.some((row) => row.some((x) => x !== 0 && x !== 1)), edges = [];
    for (let i = 0; i < n; i++) for (let j = sym ? i : 0; j < n; j++) if (A[i][j]) edges.push({ from: i, to: j, ...(wt ? { w: A[i][j] } : {}) });
    return { nodes: ids(n).map((nd, i) => (labels ? { ...nd, label: labels[i] } : nd)), edges, directed: !sym, weights: wt, layout: 'circle' };
  },
};

export default function graph(api, rt, stage, spec) { return new Graph(api, rt, stage, spec); }
Object.assign(graph, GENERATORS); // v.graph.petersen() works too if core copies a kit's static members onto v.graph
/** v.graphs(name, ...args) → {nodes, edges, layout, …} to spread into a v.graph spec; v.graphs() → the generator table. */
export function graphs(api, rt, name, ...args) {
  if (name == null) return GENERATORS;
  const f = GENERATORS[name]; if (!f) throw new Error(`v.graphs: unknown generator "${name}" (${Object.keys(GENERATORS).join(', ')})`);
  return f(...args);
}
