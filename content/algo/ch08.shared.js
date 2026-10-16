// Algorithms — Chapter 8 (graph search): helpers shared by ch08.js and ch08-b.js.
// Every search here is written out (with frame snapshots for v.steps) so the pictures can show
// exactly the state the text talks about; independent brute-force checks sit at the bottom.

export const K = (id) => String(id);
/** Component colours (gold is kept for "current", so it comes late). */
export const COMP = ['blue', 'orange', 'purple', 'teal', 'pink', 'green', 'gold', 'red'];
/** BFS layer colours. */
export const LAYER = ['ink', 'blue', 'teal', 'green', 'orange', 'pink', 'purple', 'red', 'gold'];
export const KIND_COL = { tree: 'green', back: 'red', forward: 'purple', cross: 'teal' };
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const plural = (n, w, ws) => `${n} ${n === 1 ? w : ws || w + 's'}`;
export const ids = (G) => G.nodes.map((n) => n.id);
export const labOf = (G) => (id) => G.lab(id);
/** Out-neighbours (rev = in-neighbours); undirected edges count both ways (graph-kit semantics). */
export const nbrs = (G, u, rev) => (rev ? G.inn(u) : G.adj(u));
/** Nodes from a {id: [x, y]} table. */
export const nodesAt = (P, extra = {}) => Object.entries(P).map(([id, [x, y]]) => ({ id, x, y, ...(extra[id] || {}) }));

// ---------------------------------------------------------------- depth-first search with snapshots
export const DFS_CODE = [
  'DFS(G):  colour every vertex white;  time ← 0',
  '  for each vertex u in order:  if u is white:  Visit(u)',
  'Visit(u):  time ← time + 1;  d[u] ← time;  colour u grey',
  '  for each edge u → v:',
  '    if v is white:  π[v] ← u;  Visit(v)        ▷ tree edge',
  '    else: v grey → back edge;  v black → forward / cross',
  '  time ← time + 1;  f[u] ← time;  colour u black',
];
/**
 * DFS of G over the roots in the given order (default: node order), on the reversed graph if rev.
 * Returns {d, f, prev, prevEdge, kinds (Map edge → kind), post, root, events}. Every event is a snapshot:
 * {type: start|enter|back|forward|cross|finish|done, u, w, edge, line, time, color, d, f, prev, stack, kinds, post, root}.
 */
export function dfsTrace(G, o = {}) {
  const roots = o.roots || ids(G), rev = !!o.rev, L = (id) => `**${G.lab(id)}**`;
  const color = {}, d = {}, f = {}, prev = {}, prevEdge = {}, root = {}, stack = [], post = [], kinds = new Map(), events = [];
  for (const id of ids(G)) { color[K(id)] = 0; d[K(id)] = null; f[K(id)] = null; prev[K(id)] = null; prevEdge[K(id)] = null; root[K(id)] = null; }
  let time = 0;
  const snap = (e) => events.push({ ...e, time, color: { ...color }, d: { ...d }, f: { ...f }, prev: { ...prev }, prevEdge: { ...prevEdge }, root: { ...root }, stack: stack.slice(), post: post.slice(), kinds: new Map(kinds) });
  if (o.events !== false) snap({ type: 'init', line: 1, note: 'Every vertex starts white; the clock is at 0.' });
  const isDir = (e) => G.isDirected(e);
  const enter = (u, from, edge, r) => {
    color[K(u)] = 1; d[K(u)] = ++time; stack.push(u); root[K(u)] = r;
    if (edge) { kinds.set(edge, 'tree'); prev[K(u)] = from; prevEdge[K(u)] = edge; }
    if (o.events !== false) snap({ type: edge ? 'enter' : 'start', u, w: u, edge, from, line: edge ? [5, 3] : [2, 3],
      note: (edge ? `${L(u)} is white: tree edge ${G.lab(from)}→${G.lab(u)}. ` : `${L(u)} is white: start a new tree at it. `) + `Discover ${L(u)} at time ${time}.` });
  };
  for (const r0 of roots) {
    if (color[K(r0)] !== 0 || (o.skip && o.skip(r0))) continue;
    enter(r0, null, null, r0);
    const fr = [{ u: r0, it: nbrs(G, r0, rev), k: 0 }];
    while (fr.length) {
      const top = fr[fr.length - 1];
      if (top.k < top.it.length) {
        const { id: w, edge } = top.it[top.k++];
        if (kinds.has(edge) || (o.skip && o.skip(w, edge))) continue;
        const c = color[K(w)];
        if (c === 0) { enter(w, top.u, edge, r0); fr.push({ u: w, it: nbrs(G, w, rev), k: 0 }); }
        else {
          const kind = c === 1 || !isDir(edge) ? 'back' : d[K(top.u)] < d[K(w)] ? 'forward' : 'cross';
          kinds.set(edge, kind);
          if (o.events !== false) snap({ type: kind, u: top.u, w, edge, line: [4, 6], note: `${G.lab(top.u)}→${G.lab(w)}: ${L(w)} is ${c === 1 ? 'grey (on the stack)' : 'black (finished)'} — a **${kind} edge**.` });
        }
      } else {
        fr.pop(); color[K(top.u)] = 2; f[K(top.u)] = ++time; post.push(top.u); stack.pop();
        if (o.events !== false) snap({ type: 'finish', u: top.u, w: top.u, line: 7, note: `Every edge out of ${L(top.u)} has been examined: finish it at time ${time}.` });
      }
    }
  }
  if (o.events !== false) snap({ type: 'done', line: 2, note: `Done: ${2 * ids(G).length} timestamps, one discovery and one finish per vertex.` });
  return { d, f, prev, prevEdge, kinds, post, root, events };
}
/** Default G.draw options for a DFS snapshot: gold = current, grey = orange ring, black = accent fill, edges by kind. */
export function dfsView(ev, o = {}) {
  const cur = ev.type !== 'done' && ev.type !== 'init' ? K(ev.u) : null;
  return {
    nodeFill: (id) => (K(id) === cur ? 'gold' : ev.color[K(id)] === 2 ? 'accent' : null),
    nodeColor: (id) => (ev.color[K(id)] === 1 ? 'orange' : null),
    nodeNote: o.notes === false ? null : (id) => (ev.d[K(id)] != null ? `${ev.d[K(id)]}/${ev.f[K(id)] ?? '·'}` : null),
    noteColor: (id) => (ev.color[K(id)] === 2 ? 'accent' : 'orange'),
    edgeColor: (e) => KIND_COL[ev.kinds.get(e)] || null,
    edgeWidth: (e) => (e === ev.edge ? 4 : ev.kinds.get(e) === 'tree' ? 3 : ev.kinds.has(e) ? 2.2 : null),
    edgeDash: (e) => !!ev.kinds.get(e) && ev.kinds.get(e) !== 'tree',
  };
}
/** Is a an ancestor of b (or equal) in the DFS forest given by prev pointers? */
export function isAnc(prev, a, b) { let x = b, g = 0; while (x != null && g++ < 999) { if (K(x) === K(a)) return true; x = prev[K(x)]; } return false; }
/** Kind of edge u → v from the final timestamps alone (CLRS's interval characterisation). */
export function kindByTimes(R, e, directed) {
  const u = K(e.from), w = K(e.to), d = R.d, f = R.f;
  const swap = !directed && R.prevEdge[u] === e; // an undirected tree edge stored child → parent
  const [a, b] = swap ? [w, u] : [u, w];
  if (R.prevEdge[b] === e) return 'tree';
  if (!directed) return 'back';
  if (d[b] <= d[a] && f[a] <= f[b]) return 'back';
  if (d[a] < d[b] && f[b] < f[a]) return 'forward';
  if (f[b] < d[a]) return 'cross';
  return '?';
}

// ---------------------------------------------------------------- low values (undirected): cut vertices, bridges, blocks
export const LOW_CODE = [
  'Visit(u):  time += 1;  d[u] ← low[u] ← time',
  '  for each edge uw other than the one to π[u]:',
  '    if w unvisited:  π[w] ← u;  push uw;  Visit(w)',
  '      low[u] ← min(low[u], low[w])',
  '      if low[w] ≥ d[u]:  u separates w’s subtree  ▷ pop a block',
  '      if low[w] > d[u]:  uw is a bridge',
  '    elif d[w] < d[u]:  push uw;  low[u] ← min(low[u], d[w])  ▷ back edge',
  'root: a cut vertex iff it has ≥ 2 tree children',
];
/** Hopcroft–Tarjan on an undirected graph, with snapshots. skip(id) removes vertices. */
export function lowTrace(G, o = {}) {
  const L = (id) => `**${G.lab(id)}**`, d = {}, low = {}, prev = {}, kids = {}, events = [], cut = new Set(), bridges = new Set(), blocks = [], est = [], blockOf = new Map();
  for (const id of ids(G)) { d[K(id)] = null; low[K(id)] = null; prev[K(id)] = null; kids[K(id)] = 0; }
  let time = 0; const stack = [];
  const snap = (e) => events.push({ ...e, d: { ...d }, low: { ...low }, prev: { ...prev }, stack: stack.slice(), cut: new Set(cut), bridges: new Set(bridges), blockOf: new Map(blockOf), nb: blocks.length });
  snap({ type: 'init', line: 1, note: 'No vertex visited yet.' });
  for (const r of ids(G)) {
    if (d[K(r)] != null || (o.skip && o.skip(r))) continue;
    d[K(r)] = low[K(r)] = ++time; stack.push(r);
    snap({ type: 'start', u: r, line: 1, note: `Start a DFS at ${L(r)}: d = low = ${time}.` });
    const fr = [{ u: r, it: G.adj(r), k: 0, pe: null }];
    while (fr.length) {
      const top = fr[fr.length - 1], u = top.u;
      if (top.k < top.it.length) {
        const { id: w, edge } = top.it[top.k++];
        if (edge === top.pe || K(w) === K(u) || (o.skip && o.skip(w))) continue;
        if (d[K(w)] == null) {
          est.push(edge); prev[K(w)] = u; kids[K(u)]++; d[K(w)] = low[K(w)] = ++time; stack.push(w);
          snap({ type: 'enter', u: w, edge, line: [3, 1], note: `Tree edge ${G.lab(u)}–${G.lab(w)}: discover ${L(w)} with d = low = ${time}.` });
          fr.push({ u: w, it: G.adj(w), k: 0, pe: edge });
        } else if (d[K(w)] < d[K(u)]) {
          est.push(edge); const old = low[K(u)]; low[K(u)] = Math.min(old, d[K(w)]);
          snap({ type: 'back', u, w, edge, line: 7, note: `Back edge ${G.lab(u)}–${G.lab(w)} reaches up to d = ${d[K(w)]}: low(${G.lab(u)}) = min(${old}, ${d[K(w)]}) = ${low[K(u)]}.` });
        }
      } else {
        fr.pop(); stack.pop();
        const p = prev[K(u)];
        if (p == null) {
          if (kids[K(u)] >= 2) cut.add(K(u));
          snap({ type: 'root', u, line: 8, note: `Back at the root ${L(u)}: it has ${plural(kids[K(u)], 'tree child', 'tree children')}, so it is ${kids[K(u)] >= 2 ? '' : '**not** '}a cut vertex.` });
          continue;
        }
        const old = low[K(p)]; low[K(p)] = Math.min(old, low[K(u)]);
        const sep = low[K(u)] >= d[K(p)], br = low[K(u)] > d[K(p)];
        let note = `${L(u)} finishes with low = ${low[K(u)]}; low(${G.lab(p)}) = min(${old}, ${low[K(u)]}) = ${low[K(p)]}.`;
        if (sep) {
          const blk = []; let e; do { e = est.pop(); blk.push(e); blockOf.set(e, blocks.length); } while (e && e !== top.pe);
          blocks.push(blk);
          if (prev[K(p)] != null) cut.add(K(p));
          if (br) bridges.add(top.pe);
          note += ` Since low(${G.lab(u)}) = ${low[K(u)]} ${br ? '>' : '≥'} d(${G.lab(p)}) = ${d[K(p)]}, nothing below ${G.lab(u)} climbs above ${G.lab(p)}: ${prev[K(p)] != null ? `**${G.lab(p)} is a cut vertex**` : `${G.lab(p)} (the root) closes a block`}${br ? ` and **${G.lab(p)}–${G.lab(u)} is a bridge**` : ''}; block #${blocks.length} popped (${plural(blk.length, 'edge')}).`;
        }
        snap({ type: 'return', u, w: p, edge: top.pe, sep, br, line: sep ? (br ? [4, 5, 6] : [4, 5]) : 4, note });
      }
    }
  }
  snap({ type: 'done', line: 8, note: `Done: ${plural(cut.size, 'cut vertex', 'cut vertices')}, ${plural(bridges.size, 'bridge')}, ${plural(blocks.length, 'biconnected block')}.` });
  return { d, low, prev, cut, bridges, blocks, blockOf, events };
}

// ---------------------------------------------------------------- Tarjan's SCC algorithm with snapshots
export const TARJAN_CODE = [
  'Visit(u):  d[u] ← low[u] ← next number;  push u on S',
  '  for each edge u → w:',
  '    if w unvisited:  Visit(w);  low[u] ← min(low[u], low[w])',
  '    elif w is on S:  low[u] ← min(low[u], d[w])',
  '    (else w is in a finished component: ignore)',
  '  if low[u] = d[u]:  pop S down to u  →  one component',
];
export function tarjanTrace(G) {
  const L = (id) => `**${G.lab(id)}**`, d = {}, low = {}, on = new Set(), S = [], comps = [], compOf = {}, events = [];
  for (const id of ids(G)) { d[K(id)] = null; low[K(id)] = null; compOf[K(id)] = null; }
  let t = 0;
  const snap = (e) => events.push({ ...e, d: { ...d }, low: { ...low }, S: S.slice(), comps: comps.map((c) => c.slice()), compOf: { ...compOf }, call: e.call || [] });
  snap({ type: 'init', line: 1, note: 'Stack S is empty; nothing numbered yet.' });
  for (const r of ids(G)) {
    if (d[K(r)] != null) continue;
    const fr = [{ u: r, it: G.adj(r), k: 0 }]; d[K(r)] = low[K(r)] = ++t; S.push(r); on.add(K(r));
    const call = () => fr.map((x) => x.u);
    snap({ type: 'enter', u: r, line: 1, call: call(), note: `Visit ${L(r)}: number ${t}, low ${t}; push it on S.` });
    while (fr.length) {
      const top = fr[fr.length - 1], u = top.u;
      if (top.k < top.it.length) {
        const { id: w, edge } = top.it[top.k++];
        if (d[K(w)] == null) {
          d[K(w)] = low[K(w)] = ++t; S.push(w); on.add(K(w)); fr.push({ u: w, it: G.adj(w), k: 0, pe: edge });
          snap({ type: 'enter', u: w, edge, line: [3, 1], call: call(), note: `${G.lab(u)}→${G.lab(w)}: ${L(w)} is new — number ${t}, push it.` });
        } else if (on.has(K(w))) {
          const old = low[K(u)]; low[K(u)] = Math.min(old, d[K(w)]);
          snap({ type: 'stackedge', u, w, edge, line: 4, call: call(), note: `${G.lab(u)}→${G.lab(w)}: ${L(w)} is still on S (same component so far): low(${G.lab(u)}) = min(${old}, ${d[K(w)]}) = ${low[K(u)]}.` });
        } else snap({ type: 'deadedge', u, w, edge, line: 5, call: call(), note: `${G.lab(u)}→${G.lab(w)}: ${L(w)} already belongs to finished component #${compOf[K(w)] + 1}: ignore.` });
      } else {
        fr.pop();
        if (low[K(u)] === d[K(u)]) {
          const c = []; let w; do { w = S.pop(); on.delete(K(w)); c.push(w); compOf[K(w)] = comps.length; } while (K(w) !== K(u));
          comps.push(c);
          snap({ type: 'pop', u, comp: c, line: 6, call: call(), note: `low(${G.lab(u)}) = d(${G.lab(u)}) = ${d[K(u)]}: nothing above ${G.lab(u)} is reachable, so pop {${c.map((x) => G.lab(x)).join(', ')}} as component **#${comps.length}**.` });
        }
        if (fr.length) {
          const p = fr[fr.length - 1].u, old = low[K(p)]; low[K(p)] = Math.min(old, low[K(u)]);
          snap({ type: 'return', u: p, w: u, edge: top.pe, line: 3, call: call(), note: `Back in ${L(p)}: low(${G.lab(p)}) = min(${old}, low(${G.lab(u)}) = ${low[K(u)]}) = ${low[K(p)]}.` });
        }
      }
    }
  }
  snap({ type: 'done', line: 6, note: `Done: ${plural(comps.length, 'component')}, found sinks first (reverse topological order of the component DAG).` });
  return { d, low, comps, compOf, events };
}

// ---------------------------------------------------------------- independent (brute-force) checks
/** Warshall transitive closure: R[i][j] = there is a walk of ≥ 1 edge from ids[i] to ids[j]. */
export function closure(G) {
  const I = ids(G), ix = new Map(I.map((id, i) => [K(id), i])), n = I.length, R = I.map(() => new Array(n).fill(false));
  for (const e of G.edges) { const a = ix.get(K(e.from)), b = ix.get(K(e.to)); if (a == null || b == null) continue; R[a][b] = true; if (!G.isDirected(e)) R[b][a] = true; }
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) if (R[i][k]) for (let j = 0; j < n; j++) if (R[k][j]) R[i][j] = true;
  return { I, ix, R };
}
/** SCCs from mutual reachability: {comps, compOf}. */
export function sccBrute(G) {
  const { I, R } = closure(G), compOf = {}, comps = [];
  I.forEach((u, i) => {
    if (compOf[K(u)] != null) return; const c = [];
    I.forEach((w, j) => { if (i === j || (R[i][j] && R[j][i])) { c.push(w); compOf[K(w)] = comps.length; } });
    comps.push(c);
  });
  return { comps, compOf };
}
/** Number of connected components of an undirected graph without vertex `skipV` and edge `skipE` (union–find). */
export function countComps(G, skipV, skipE) {
  const I = ids(G).filter((id) => skipV == null || K(id) !== K(skipV)), par = new Map(I.map((id) => [K(id), K(id)]));
  const find = (x) => { while (par.get(x) !== x) { par.set(x, par.get(par.get(x))); x = par.get(x); } return x; };
  let c = I.length;
  for (const e of G.edges) { if (e === skipE) continue; const a = K(e.from), b = K(e.to); if (!par.has(a) || !par.has(b)) continue; const x = find(a), y = find(b); if (x !== y) { par.set(x, y); c--; } }
  return c;
}
/** Unit-weight distances from s by Bellman–Ford relaxation (no queue): dist map, Infinity if unreachable. */
export function relaxDist(G, s, skip) {
  const D = {}; for (const id of ids(G)) D[K(id)] = Infinity; D[K(s)] = 0;
  for (let changed = true, g = 0; changed && g < 999; g++) {
    changed = false;
    for (const e of G.edges) {
      const a = K(e.from), b = K(e.to); if (skip && (skip(e.from) || skip(e.to))) continue;
      if (D[a] + 1 < D[b]) { D[b] = D[a] + 1; changed = true; }
      if (!G.isDirected(e) && D[b] + 1 < D[a]) { D[a] = D[b] + 1; changed = true; }
    }
  }
  return D;
}
/** Number of topological orders by dynamic programming over subsets (n ≤ 16); 0 if there is a cycle. */
export function countTopo(G) {
  const I = ids(G), n = I.length, ix = new Map(I.map((id, i) => [K(id), i])), need = new Array(n).fill(0);
  if (n > 18) return null;
  for (const e of G.edges) { const a = ix.get(K(e.from)), b = ix.get(K(e.to)); if (a == null || b == null) continue; if (a === b) return 0; need[b] |= 1 << a; }
  const N = new Float64Array(1 << n); N[0] = 1;
  for (let m = 0; m < 1 << n; m++) { if (!N[m]) continue; for (let j = 0; j < n; j++) if (!(m >> j & 1) && (need[j] & m) === need[j]) N[m | 1 << j] += N[m]; }
  return N[(1 << n) - 1];
}
/** Number of proper 2-colourings (n ≤ 20) by trying them all. */
export function twoColourings(G) {
  const I = ids(G), n = I.length, ix = new Map(I.map((id, i) => [K(id), i])), E = [];
  if (n > 20) return null;
  for (const e of G.edges) { const a = ix.get(K(e.from)), b = ix.get(K(e.to)); if (a != null && b != null) E.push([a, b]); }
  let cnt = 0;
  for (let m = 0; m < 1 << n; m++) { let ok = true; for (const [a, b] of E) if ((m >> a & 1) === (m >> b & 1)) { ok = false; break; } if (ok) cnt++; }
  return cnt;
}

// ---------------------------------------------------------------- drawing helpers
/** Soft rounded hull around node positions (data coords), padded by pad px. */
export function blob(v, s, pts, pad, st) {
  const P = [];
  for (const [x, y] of pts) { const X = s.X(x), Y = s.Y(y); for (let k = 0; k < 18; k++) { const a = (2 * Math.PI * k) / 18; P.push([X + pad * Math.cos(a), Y + pad * Math.sin(a)]); } }
  const H = v.M.hull(P).map(([X, Y]) => [s.invX(X), s.invY(Y)]);
  s.poly(H, { fill: st.color, fillAlpha: st.alpha ?? 0.12, color: st.color, width: 1.2, alpha: st.edge ?? 0.5, dash: st.dash });
}
/**
 * A row of labelled cells (queue, stack, list) in pixel geometry: top-left (X0, Y0) px, cell w × h px.
 * items: [{label, fill?, color?, note?, alpha?}] · o: {title, w, h, gap, maxW (shrink to fit), size}.
 * Returns the pixel centres of the cells.
 */
export function strip(s, items, X0, Y0, o = {}) {
  const gap = o.gap ?? 4, h = o.h ?? 26; let w = o.w ?? 30;
  let x = X0;
  if (o.title) { s.textPx(o.title, X0, Y0 + h / 2, { size: 12, weight: 600, color: 'muted', align: 'left' }); x += o.titleW ?? 70; }
  if (o.maxW && items.length) w = Math.min(w, (o.maxW - (x - X0) - gap * (items.length - 1)) / items.length);
  w = Math.max(w, 12);
  const centres = [];
  if (!items.length && o.empty) s.textPx(o.empty, x, Y0 + h / 2, { size: 12, color: 'faint', align: 'left' });
  items.forEach((it, i) => {
    const X = x + i * (w + gap), col = it.color || 'muted';
    s.rect(s.invX(X), s.invY(Y0 + h), s.invX(X + w), s.invY(Y0), { fill: it.fill || col, fillAlpha: it.fill ? it.fillAlpha ?? 0.85 : 0.1, color: col, width: it.width ?? 1.4, radius: 4, alpha: it.alpha });
    s.textPx(String(it.label), X + w / 2, Y0 + h / 2 + 0.5, { align: 'center', size: o.size ?? (w < 22 ? 10.5 : 12.5), weight: 700, color: it.fill ? it.ink || 'panel' : it.ink || 'ink', halo: false, alpha: it.alpha });
    if (it.note != null) s.textPx(String(it.note), X + w / 2, Y0 + h + 9, { align: 'center', size: 10.5, weight: 600, color: it.noteColor || 'muted' });
    centres.push([X + w / 2, Y0 + h / 2]);
  });
  return centres;
}
/** Quadratic arc from px (X1, Y) to (X2, Y) bulging up (h < 0) or down (h > 0), with an arrowhead at the end. */
export function arcPx(s, X1, X2, Y, h, st = {}) {
  const pts = [], CX = (X1 + X2) / 2, CY = Y + 2 * h;
  for (let k = 0; k <= 24; k++) { const t = k / 24, u = 1 - t; pts.push([s.invX(u * u * X1 + 2 * u * t * CX + t * t * X2), s.invY(u * u * Y + 2 * u * t * CY + t * t * Y)]); }
  s.path(pts.slice(0, st.head === false ? 25 : 23), { color: st.color || 'muted', width: st.width ?? 1.6, dash: st.dash, alpha: st.alpha });
  if (st.head !== false) { const p = pts[22], q = pts[24]; s.arrow(p[0], p[1], q[0], q[1], { color: st.color || 'muted', width: st.width ?? 1.6, head: st.headSize ?? 7, alpha: st.alpha }); }
}
