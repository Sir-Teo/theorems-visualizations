// Dependency-graph views: theorem lineage, chapter graph, chapter flow, and the global map.
import { resolveColor, withAlpha, inlineHTML, richHTML, escapeHTML } from './viz/core.js';
import { traceClippedCubic } from './map-path.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, parent) => { const el = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v); if (parent) parent.append(el); return el; };
function zoomControls(host, zoom, reset) {
  const tools = document.createElement('div'); tools.className = 'canvas-tools';
  tools.setAttribute('role', 'group'); tools.setAttribute('aria-label', 'View controls');
  tools.innerHTML = '<button class="btn btn-icon" type="button" data-zoom="1.4" aria-label="Zoom in">+</button><button class="btn btn-icon" type="button" data-zoom="0.7142857143" aria-label="Zoom out">−</button>' + (reset ? '<button class="btn" type="button" data-reset-view>Reset</button>' : '');
  tools.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => zoom(+b.dataset.zoom)));
  tools.querySelector('[data-reset-view]')?.addEventListener('click', reset);
  host.append(tools);
}
let A = null; // the atlas state built by app.js (collections, items, …)
/** Register the atlas so labels and colours can be looked up by collection id. */
export function setAtlas(G) { A = G; }
const COLV = (id) => `var(--c-${id})`;
export const colShort = (id) => A?.colById?.get(id)?.short || String(id).toUpperCase();
const KIND_ABBR = { Theorem: 'Thm', Lemma: 'Lem', Corollary: 'Cor', Proposition: 'Prop', Definition: 'Def', Principle: 'Prin', Postulate: 'Post', Algorithm: 'Alg', Concept: 'Conc', Phenomenon: 'Phen', Method: 'Meth', Paradox: 'Parad', Hypothesis: 'Hyp', Invention: 'Inv', Paper: 'Paper' };
export const kindAbbr = (k) => KIND_ABBR[k] || k;
/** Prerequisites of a node: written deps plus not-yet-written (planned) ones. */
export const depsOf = (it) => (it.pdeps ? [...it.deps, ...it.pdeps] : it.deps);
export function displayNum(it) { return it.num; }
export function fullLabel(it) {
  const m = it.num.match(/^([\d.]+\d)([a-z])$/);
  if (m && it.kind === 'Corollary') return `Corollary to ${m[1]}`;
  const lab = A?.colById?.get(it.col)?.chapterLabels?.[it.c];
  if (lab) return `${it.kind} (${lab} ${it.num.split('.').slice(1).join('.')})`;
  return `${it.kind} ${it.num}`;
}
const plainName = (s, n = 34) => { const t = s.replace(/\$([^$]*)\$/g, (_, x) => x.replace(/\\[a-zA-Z]+\s?/g, '').replace(/[{}^_]/g, '')); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

// ------------------------------------------------------------ layered layout
/** Columns from levelOf; rows ordered by barycentre sweeps. Returns Map id → {col,row}. */
function layered(ids, edges, levelOf, initialOrder) {
  const cols = new Map();
  for (const id of ids) { const l = levelOf(id); if (!cols.has(l)) cols.set(l, []); cols.get(l).push(id); }
  const levels = [...cols.keys()].sort((a, b) => a - b);
  for (const l of levels) cols.get(l).sort((a, b) => initialOrder(a) - initialOrder(b));
  const preds = new Map(ids.map((id) => [id, []])), succs = new Map(ids.map((id) => [id, []]));
  for (const [a, b] of edges) { if (preds.has(b) && succs.has(a)) { preds.get(b).push(a); succs.get(a).push(b); } }
  const rowOf = new Map();
  const assign = () => { for (const l of levels) cols.get(l).forEach((id, i) => rowOf.set(id, i - (cols.get(l).length - 1) / 2)); };
  assign();
  for (let it = 0; it < 10; it++) {
    const seq = it % 2 ? levels.slice().reverse() : levels;
    for (const l of seq) {
      const col = cols.get(l);
      const nb = (id) => { const n = (it % 2 ? succs : preds).get(id).map((x) => rowOf.get(x)); return n.length ? n.reduce((a, b) => a + b, 0) / n.length : rowOf.get(id); };
      const bv = new Map(col.map((id) => [id, nb(id)]));
      col.sort((a, b) => bv.get(a) - bv.get(b) || initialOrder(a) - initialOrder(b));
      col.forEach((id, i) => rowOf.set(id, i - (col.length - 1) / 2));
    }
  }
  const out = new Map();
  levels.forEach((l, ci) => cols.get(l).forEach((id, idx) => out.set(id, { col: ci, row: rowOf.get(id), idx, level: l })));
  return { pos: out, nCols: levels.length, maxRows: Math.max(...levels.map((l) => cols.get(l).length)) };
}

/** Remove edges implied by longer paths (within the given node set). */
function transitiveReduce(ids, edges) {
  const set = new Set(ids); const succ = new Map(ids.map((i) => [i, []]));
  for (const [a, b] of edges) if (set.has(a) && set.has(b)) succ.get(a).push(b);
  const reach = (from, to, skipDirect) => {
    const stack = succ.get(from).filter((x) => !(skipDirect && x === to)); const seen = new Set(stack);
    while (stack.length) { const x = stack.pop(); if (x === to) return true; for (const y of succ.get(x)) if (!seen.has(y)) { seen.add(y); stack.push(y); } }
    return false;
  };
  return edges.filter(([a, b]) => !reach(a, b, true));
}

function edgePath(x1, y1, x2, y2) {
  const dx = Math.max(24, (x2 - x1) * 0.5);
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

function nodeGroup(parent, it, x, y, w, h, { target = false, compact = false, onClick, external = false, extra = '' } = {}) {
  const g = svg('g', { class: 'gnode', transform: `translate(${x},${y})`, tabindex: onClick ? 0 : null, role: onClick ? 'link' : 'img', 'aria-label': `${fullLabel(it)}: ${plainName(it.name, 80)}` }, parent);
  const col = COLV(it.col);
  const isDef = it.kind === 'Definition';
  if (it.planned) g.classList.add('planned');
  svg('rect', {
    x: 0, y: 0, width: w, height: h, rx: compact ? 7 : 9,
    fill: target ? col : it.planned ? 'var(--bg-2)' : 'var(--panel)', stroke: col, 'stroke-width': target ? 0 : 1.3,
    'stroke-dasharray': it.planned ? '2 3' : isDef ? '4 3' : null, opacity: it.planned ? 0.75 : external ? 0.9 : 1,
  }, g);
  const t1 = svg('text', { x: 10, y: compact ? h / 2 + 4 : 15, 'font-size': 10.5, 'font-family': 'var(--font-mono)', fill: target ? 'var(--bg)' : col, 'font-weight': 500 }, g);
  t1.textContent = `${external || it.col !== extra ? colShort(it.col) + ' ' : ''}${kindAbbr(it.kind)} ${displayNum(it)}${it.planned && !compact ? ' · planned' : ''}`;
  if (!compact) {
    const t2 = svg('text', { x: 10, y: 30, 'font-size': 12, fill: target ? 'var(--bg)' : it.planned ? 'var(--ink-3)' : 'var(--ink)', 'font-weight': target ? 600 : 450 }, g);
    t2.textContent = plainName(it.name, Math.floor((w - 16) / 6.4));
  }
  const tip = svg('title', {}, g); tip.textContent = `${fullLabel(it)} — ${plainName(it.name, 200)}`;
  if (onClick) {
    g.addEventListener('click', () => onClick(it));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter') onClick(it); });
  }
  return g;
}

function wireHover(svgEl, nodeEls, edgeEls) {
  // highlight the edges touching a hovered node
  for (const [id, g] of nodeEls) {
    const highlight = () => {
      for (const e of edgeEls) { const on = e.dataset.a === id || e.dataset.b === id; e.classList.toggle('hot', on); e.style.opacity = on ? 1 : 0.25; }
    };
    const clear = () => { for (const e of edgeEls) { e.classList.remove('hot'); e.style.opacity = ''; } };
    g.addEventListener('mouseenter', highlight); g.addEventListener('focus', highlight);
    g.addEventListener('mouseleave', clear); g.addEventListener('blur', clear);
  }
}

// ------------------------------------------------------------ lineage (theorem page)
/**
 * Draw ancestors (up to `depth` steps) and direct dependents of `id` as a left→right layered graph.
 */
export function renderLineage(host, G, id, { depth = 2, dependents = true, reduce = true, onOpen } = {}) {
  host.innerHTML = '';
  const me = G.byId.get(id); if (!me) return;
  const dist = new Map([[id, 0]]); const queue = [id];
  while (queue.length) {
    const x = queue.shift(); const d = dist.get(x);
    if (d >= depth) continue;
    for (const p of depsOf(G.byId.get(x))) if (G.byId.has(p) && !dist.has(p)) { dist.set(p, d + 1); queue.push(p); }
  }
  const anc = [...dist.keys()];
  const down = dependents ? (G.allChildren.get(id) || []).filter((c) => !dist.has(c)) : [];
  const ids = [...anc, ...down];
  const set = new Set(ids);
  let edges = [];
  for (const x of ids) for (const p of depsOf(G.byId.get(x))) if (set.has(p)) edges.push([p, x]);
  if (reduce) edges = transitiveReduce(ids, edges);
  // level: target 0, dependents +1, ancestors −(longest path to target inside the set)
  const succIn = new Map(ids.map((i) => [i, []]));
  for (const [a, b] of edges) succIn.get(a).push(b);
  const L = new Map([[id, 0]]); for (const d of down) L.set(d, 1);
  const lev = (x, guard = new Set()) => {
    if (L.has(x)) return L.get(x); if (guard.has(x)) return -1; guard.add(x);
    const s = succIn.get(x).filter((y) => !down.includes(y));
    const v = s.length ? Math.min(...s.map((y) => lev(y, guard))) - 1 : -1;
    L.set(x, v); return v;
  };
  ids.forEach((x) => lev(x));
  const compact = ids.length > 46;
  const W = compact ? 104 : 196, H = compact ? 26 : 40, CG = compact ? 44 : 64, RG = compact ? 8 : 12;
  const { pos, nCols, maxRows } = layered(ids, edges, (x) => L.get(x), (x) => G.order.get(x));
  const width = nCols * W + (nCols - 1) * CG + 16, height = maxRows * (H + RG) + 16;
  const root = svg('svg', { class: 'lineage-svg', width, height, viewBox: `0 0 ${width} ${height}`, role: 'group', 'aria-label': `Dependency lineage of ${fullLabel(me)}` }, host);
  const X = (p) => 8 + p.col * (W + CG), Y = (p) => height / 2 + p.row * (H + RG) - H / 2;
  const eg = svg('g', { fill: 'none' }, root);
  const edgeEls = [];
  for (const [a, b] of edges) {
    const pa = pos.get(a), pb = pos.get(b);
    const A = G.byId.get(a), B = G.byId.get(b);
    const cross = A.col !== B.col;
    const e = svg('path', { d: edgePath(X(pa) + W, Y(pa) + H / 2, X(pb), Y(pb) + H / 2), stroke: cross ? COLV(A.col) : 'var(--ink-3)', 'stroke-width': 1.4, 'stroke-dasharray': cross || A.planned || B.planned ? '5 4' : null, opacity: A.planned || B.planned ? 0.45 : 0.75, class: 'gedge' }, eg);
    e.dataset.a = a; e.dataset.b = b; edgeEls.push(e);
  }
  const nodeEls = new Map();
  for (const x of ids) {
    const p = pos.get(x); const it = G.byId.get(x);
    nodeEls.set(x, nodeGroup(root, it, X(p), Y(p), W, H, { target: x === id, compact, extra: me.col, onClick: x === id ? null : onOpen }));
  }
  wireHover(root, nodeEls, edgeEls);
  // scroll so the target is visible
  requestAnimationFrame(() => { const p = pos.get(id); host.scrollLeft = Math.max(0, X(p) + W / 2 - host.clientWidth / 2); host.scrollTop = Math.max(0, Y(p) + H / 2 - host.clientHeight / 2); });
  return { count: ids.length, ancestors: anc.length - 1, dependents: down.length };
}

// ------------------------------------------------------------ chapter graph
export function renderChapterGraph(host, G, col, ch, { onOpen, onOpenChapter } = {}) {
  host.innerHTML = '';
  const items = G.items.filter((it) => it.col === col && it.c === ch);
  if (!items.length) return;
  const inCh = new Set(items.map((i) => i.id));
  // external prerequisites collapsed by chapter
  const ext = new Map();
  for (const it of items) for (const d of it.deps) if (!inCh.has(d)) {
    const D = G.byId.get(d); const k = `${D.col}/${D.c}`;
    if (!ext.has(k)) ext.set(k, { key: k, col: D.col, c: D.c, items: new Set(), targets: new Map() });
    const E = ext.get(k); E.items.add(d); E.targets.set(it.id, (E.targets.get(it.id) || 0) + 1);
  }
  const extNodes = [...ext.values()].sort((a, b) => G.colIdx.get(a.col) - G.colIdx.get(b.col) || a.c - b.c);
  const ids = [...extNodes.map((e) => 'ext:' + e.key), ...items.map((i) => i.id)];
  let edges = [];
  for (const it of items) for (const d of it.deps) if (inCh.has(d)) edges.push([d, it.id]);
  edges = transitiveReduce(items.map((i) => i.id), edges);
  for (const E of extNodes) for (const t of E.targets.keys()) edges.push(['ext:' + E.key, t]);
  const L = new Map();
  const lev = (it) => { if (L.has(it.id)) return L.get(it.id); L.set(it.id, 1); const v = Math.max(1, ...it.deps.filter((d) => inCh.has(d)).map((d) => lev(G.byId.get(d)) + 1)); L.set(it.id, v); return v; };
  items.forEach(lev);
  const levelOf = (x) => x.startsWith('ext:') ? 0 : L.get(x);
  const orderOf = (x) => x.startsWith('ext:') ? -1000 + extNodes.findIndex((e) => 'ext:' + e.key === x) : G.order.get(x);
  const { pos, nCols, maxRows } = layered(ids, edges, levelOf, orderOf);
  const W = 186, H = 40, CG = 58, RG = 10, EW = 150;
  const colX = (c) => c === 0 && extNodes.length ? 8 : 8 + (extNodes.length ? EW + CG : 0) + (c - (extNodes.length ? 1 : 0)) * (W + CG);
  const width = colX(nCols - 1) + W + 16, height = maxRows * (H + RG) + 20;
  const root = svg('svg', { class: 'lineage-svg', width, height, viewBox: `0 0 ${width} ${height}`, role: 'group', 'aria-label': 'Chapter dependency graph' }, host);
  const Y = (p) => 10 + p.idx * (H + RG);
  const wOf = (x) => x.startsWith('ext:') ? EW : W;
  const eg = svg('g', { fill: 'none' }, root);
  const edgeEls = [];
  for (const [a, b] of edges) {
    const pa = pos.get(a), pb = pos.get(b);
    const isExt = a.startsWith('ext:'); const E = isExt ? ext.get(a.slice(4)) : null;
    const e = svg('path', { d: edgePath(colX(pa.col) + wOf(a), Y(pa) + H / 2, colX(pb.col), Y(pb) + H / 2), stroke: isExt ? COLV(E.col) : 'var(--ink-3)', 'stroke-width': isExt ? 1 + Math.min(3, E.targets.get(b) - 1) * 0.6 : 1.4, 'stroke-dasharray': isExt ? '4 4' : null, opacity: isExt ? 0.55 : 0.8, class: 'gedge' }, eg);
    e.dataset.a = a; e.dataset.b = b; edgeEls.push(e);
  }
  const nodeEls = new Map();
  for (const E of extNodes) {
    const k = 'ext:' + E.key; const p = pos.get(k);
    const g = svg('g', { class: 'gnode', transform: `translate(${colX(p.col)},${Y(p)})`, tabindex: 0, role: 'link' }, root);
    svg('rect', { x: 0, y: 0, width: EW, height: H, rx: 9, fill: 'var(--panel-2)', stroke: COLV(E.col), 'stroke-width': 1, 'stroke-dasharray': '3 3' }, g);
    const t1 = svg('text', { x: 10, y: 15, 'font-size': 10.5, 'font-family': 'var(--font-mono)', fill: COLV(E.col), 'font-weight': 500 }, g);
    t1.textContent = `${colShort(E.col)} ch. ${E.c}`;
    const t2 = svg('text', { x: 10, y: 30, 'font-size': 11.5, fill: 'var(--ink-2)' }, g);
    t2.textContent = `${E.items.size} result${E.items.size > 1 ? 's' : ''} used`;
    const tip = svg('title', {}, g); tip.textContent = [...E.items].map((d) => `${G.byId.get(d).num} ${plainName(G.byId.get(d).name, 60)}`).join('\n');
    g.addEventListener('click', () => onOpenChapter?.(E.col, E.c));
    nodeEls.set(k, g);
  }
  for (const it of items) { const p = pos.get(it.id); nodeEls.set(it.id, nodeGroup(root, it, colX(p.col), Y(p), W, H, { onClick: onOpen, extra: col })); }
  wireHover(root, nodeEls, edgeEls);
}

// ------------------------------------------------------------ flow diagrams (home / field / collection pages)
/**
 * Columns of rows (chapters or collections); curves show how many results of one row are used in another.
 * columns: [{ title, color, rows: [{ key, n, label, count, color, planned, title }] }], edges: [{ from, to, n }]
 */
export function renderFlow(host, { columns, edges, onOpen, ariaLabel = 'How the parts depend on one another' }) {
  host.innerHTML = '';
  const cols = columns.filter((c) => c.rows.length);
  if (!cols.length) return;
  const one = cols.length === 1;
  const ROWH = 25, TOP = 44, colW = one ? 420 : cols.length > 4 ? 250 : 310, GAP = one ? 0 : cols.length > 4 ? 80 : 110;
  const width = cols.length * colW + (cols.length - 1) * GAP + 80;
  const rows = Math.max(...cols.map((C) => C.rows.length));
  const height = TOP + rows * ROWH + 16;
  const root = svg('svg', { class: 'flow-svg', viewBox: `0 0 ${width} ${height}`, role: 'group', 'aria-label': ariaLabel }, host);
  root.style.minWidth = Math.min(width, one ? 520 : 860) + 'px';
  const P = new Map();
  cols.forEach((C, ci) => {
    const x = 60 + ci * (colW + GAP);
    const head = svg('text', { x, y: 20, 'font-size': 12, 'font-weight': 600, fill: C.color, 'letter-spacing': '0.08em' }, root);
    const maxH = Math.floor((colW - 10) / 7.6);
    head.textContent = C.title.length > maxH ? C.title.slice(0, maxH - 1).toUpperCase() + '…' : C.title.toUpperCase();
    C.rows.forEach((R, ri) => P.set(R.key, { x, y: TOP + ri * ROWH, ci, R }));
  });
  const maxN = Math.max(1, ...edges.map((e) => e.n));
  const eg = svg('g', { fill: 'none' }, root);
  const edgeEls = [];
  for (const e of edges) {
    const a = P.get(e.from), b = P.get(e.to); if (!a || !b) continue;
    let d;
    if (a.ci === b.ci) {
      const bend = 14 + Math.abs(b.y - a.y) * 0.32;
      d = `M${a.x - 12},${a.y} C${a.x - 12 - bend},${a.y} ${b.x - 12 - bend},${b.y} ${b.x - 12},${b.y}`;
    } else if (a.ci < b.ci) {
      const x1 = a.x + colW - 28, x2 = b.x - 12, mx = (x2 - x1) * 0.5;
      d = `M${x1},${a.y} C${x1 + mx},${a.y} ${x2 - mx},${b.y} ${x2},${b.y}`;
    } else {
      const x1 = a.x - 12, x2 = b.x + colW - 28, mx = (x1 - x2) * 0.5;
      d = `M${x1},${a.y} C${x1 - mx},${a.y} ${x2 + mx},${b.y} ${x2},${b.y}`;
    }
    const p = svg('path', { d, stroke: a.R.color, 'stroke-width': 0.8 + 4.2 * Math.sqrt(e.n / maxN), opacity: 0.22, 'stroke-linecap': 'round', class: 'fedge' }, eg);
    p.dataset.a = e.from; p.dataset.b = e.to;
    const t = svg('title', {}, p); t.textContent = `${e.n} result${e.n > 1 ? 's' : ''} from ${a.R.title || a.R.label} used in ${b.R.title || b.R.label}`;
    edgeEls.push(p);
  }
  const rowsG = svg('g', {}, root);
  for (const [k, p] of P) {
    const R = p.R;
    const g = svg('g', { class: 'gnode' + (R.planned ? ' planned' : ''), transform: `translate(${p.x},${p.y})`, tabindex: 0, role: 'link', 'aria-label': R.title || R.label }, rowsG);
    svg('rect', { x: -16, y: -11, width: colW - 4, height: 22, rx: 6, fill: 'transparent', class: 'hit' }, g);
    svg('circle', R.planned ? { cx: -12, cy: 0, r: 3.4, fill: 'none', stroke: R.color, 'stroke-width': 1.2, 'stroke-dasharray': '2 2' } : { cx: -12, cy: 0, r: 3.2 + Math.sqrt(R.count || 1) * 0.55, fill: R.color }, g);
    const nx = R.n != null && R.n !== '' ? 2 : -6;
    if (R.n != null && R.n !== '') { const n = svg('text', { x: 2, y: 4, 'font-size': 11, 'font-family': 'var(--font-mono)', fill: 'var(--ink-3)' }, g); n.textContent = String(R.n).padStart(2, ' '); }
    const lx = nx + 22; const maxCh = Math.floor((colW - lx - 50) / 6.6);
    const t = svg('text', { x: lx, y: 4.5, 'font-size': 13, fill: R.planned ? 'var(--ink-3)' : 'var(--ink)' }, g); t.textContent = R.label.length > maxCh ? R.label.slice(0, maxCh - 1).trimEnd() + '…' : R.label;
    const full = svg('title', {}, g); full.textContent = `${R.title || R.label} — ${R.count ? `${R.count} results` : 'planned'}`;
    const c = svg('text', { x: colW - 30, y: 4, 'font-size': 10.5, 'font-family': 'var(--font-mono)', fill: 'var(--ink-3)', 'text-anchor': 'end' }, g); c.textContent = R.count || (R.planned ? '·' : '');
    g.addEventListener('mouseenter', () => { root.classList.add('focus'); for (const e of edgeEls) { const on = e.dataset.a === k || e.dataset.b === k; e.style.opacity = on ? 0.85 : 0.05; } });
    g.addEventListener('mouseleave', () => { root.classList.remove('focus'); for (const e of edgeEls) e.style.opacity = ''; });
    g.addEventListener('click', () => onOpen?.(R));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter') onOpen?.(R); });
  }
}
/** Flow whose columns are collections and rows their chapters. */
export function chapterFlow(G, colIds) {
  const columns = colIds.map((id) => G.colById.get(id)).filter(Boolean).map((C) => ({
    title: C.title, color: COLV(C.id),
    rows: C.chapters.map((Ch) => ({ key: `${C.id}/${Ch.n}`, col: C.id, ch: Ch.n, n: Ch.n, label: Ch.title || `Chapter ${Ch.n}`, title: `${C.short} ${Ch.n} · ${Ch.title}`, count: Ch.count, planned: !Ch.count, color: COLV(C.id) })),
  }));
  const want = new Set(colIds);
  return { columns, edges: G.chapterEdges.filter((e) => want.has(e.from.split('/')[0]) && want.has(e.to.split('/')[0])) };
}
/** Flow whose columns are groups (fields or areas) and rows their collections. */
export function collectionFlow(G, groups, { includePlanned = true } = {}) {
  const columns = groups.map((g) => ({
    title: g.title, color: g.color,
    rows: g.colIds.map((id) => G.colById.get(id)).filter((C) => C && (includePlanned || C.count)).map((C) => ({ key: C.id, col: C.id, label: C.title, title: C.title, count: C.count, planned: !C.count, color: COLV(C.id) })),
  }));
  return { columns, edges: G.collectionEdges };
}

// ------------------------------------------------------------ global map (canvas)
export class MapView {
  constructor(host, G, { onOpen, focus, loadShard, onQuery, query = '' } = {}) {
    this.host = host; this.G = G; this.onOpen = onOpen; this.loadShard = loadShard; this.hl = null;
    host.classList.add('map-page');
    this.fieldOf = new Map(G.collections.map((C) => [C.id, C.field]));
    this.nodes = [
      ...G.items.map((it) => ({ it, x: it.x, y: it.y, r: Math.min(8, 2.6 + Math.sqrt(it.desc || 0) * 0.4) })),
      ...G.planned.map((it) => ({ it, x: it.x, y: it.y, r: 2.2, ghost: true })),
    ];
    const fieldsHere = G.fields.filter((F) => this.nodes.some((n) => this.fieldOf.get(n.it.col) === F.id));
    host.innerHTML = `
      <canvas tabindex="0" aria-label="Map of all results and their dependencies. Use arrow keys to pan, plus and minus to zoom, and 0 to fit."></canvas>
      <div class="map-ui">
        <div class="card"><span class="eyebrow">Show</span>
          ${fieldsHere.map((F) => `<label><input type="checkbox" data-f="${F.id}" checked> <span class="col-dot" data-field="${F.id}" style="--bc:var(--f-${F.id})"></span>${escapeHTML(F.short)}</label>`).join('')}
          <label><input type="checkbox" data-defs checked> definitions</label>
          ${G.planned.length ? '<label><input type="checkbox" data-planned checked> planned</label>' : ''}
        </div>
        ${onQuery ? `<div class="card map-q"><input type="search" placeholder="Highlight: entropy, kind:paper, year:1900-1950…" aria-label="Highlight matching ideas on the map" value="${escapeHTML(query)}"><span class="map-q-n"></span></div>` : ''}
        <button class="btn" data-fit type="button">Fit</button>
      </div>
      <div class="map-tip"></div>
      <div class="map-side card" role="region" aria-label="Selected idea"></div>
      <div class="map-legend card">
        <span><svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="var(--c-accent)" stroke-width="2.5"/></svg>builds on (ancestors)</span>
        <span><svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="var(--c-green)" stroke-width="2.5"/></svg>used by (descendants)</span>
        ${G.planned.length ? '<span><svg width="12" height="12"><circle cx="6" cy="6" r="3.5" fill="none" stroke="var(--ink-3)" stroke-dasharray="2 2"/></svg>planned, not yet written</span>' : ''}
        <span>node size ∝ results that depend on it</span>
        <span>nearby links · details return after panning</span>
      </div>
      <div class="map-help">scroll / pinch to zoom · drag to pan · click a node · double-click to open</div>`;
    this.canvas = host.querySelector('canvas'); this.ctx = this.canvas.getContext('2d');
    this.tip = host.querySelector('.map-tip'); this.side = host.querySelector('.map-side');
    this.show = { fields: new Set(fieldsHere.map((F) => F.id)), defs: true, planned: true };
    host.querySelectorAll('input[data-f]').forEach((cb) => cb.addEventListener('change', () => { if (cb.checked) this.show.fields.add(cb.dataset.f); else this.show.fields.delete(cb.dataset.f); this.draw(); }));
    host.querySelector('input[data-defs]').addEventListener('change', (e) => { this.show.defs = e.target.checked; this.draw(); });
    host.querySelector('input[data-planned]')?.addEventListener('change', (e) => { this.show.planned = e.target.checked; this.draw(); });
    host.querySelector('[data-fit]').addEventListener('click', () => this.fit(true));
    const qi = host.querySelector('.map-q input');
    if (qi) { qi.addEventListener('input', () => { clearTimeout(this.queryTimer); this.queryTimer = setTimeout(() => onQuery(qi.value, true), 220); }); qi.addEventListener('keydown', (e) => { if (e.key === 'Enter') { clearTimeout(this.queryTimer); onQuery(qi.value, true); } }); }
    this.k = 1; this.tx = 0; this.ty = 0; this.hover = null; this.sel = null;
    this.byId = new Map(this.nodes.map((n) => [n.it.id, n]));
    this.edges = [];
    for (const n of this.nodes) for (const d of depsOf(n.it)) { const m = this.byId.get(d); if (m) this.edges.push([m, n]); }
    this.top = this.nodes.filter((n) => !n.ghost).sort((a, b) => (b.it.desc || 0) - (a.it.desc || 0)).slice(0, 80);
    // level of detail: when zoomed far out, edges are bundled per pair of collections
    const centers = new Map();
    for (const R of G.map?.rows || []) { const c = centers.get(R.col) || { x: 0, y: 0, n: 0 }; c.x += (R.x + R.x1) / 2; c.y += (R.y + R.y1) / 2; c.n++; centers.set(R.col, c); }
    for (const c of centers.values()) { c.x /= c.n; c.y /= c.n; }
    const bundles = new Map();
    for (const [a, b] of this.edges) {
      if (a.it.col === b.it.col) continue;
      const k = `${a.it.col}>${b.it.col}`; const e = bundles.get(k) || { a: a.it.col, b: b.it.col, n: 0, written: 0 }; e.n++; if (!a.ghost && !b.ghost) e.written++; bundles.set(k, e);
    }
    this.centers = centers; this.bundles = [...bundles.values()];
    this.maxBundle = Math.max(1, ...this.bundles.map((e) => e.n));
    this._bind();
    zoomControls(host, (factor) => this.zoom(factor));
    this.ro = new ResizeObserver(() => { this.resize(); if (!this.userMoved && !this.sel) this.fit(false); else this.draw(); });
    this.ro.observe(host);
    this.resize(); this.fit(false);
    if (focus && this.byId.has(focus)) this.select(this.byId.get(focus), true);
    this.onTheme = () => { this.panCache = null; this.textWidths?.clear(); this.draw(); }; window.addEventListener('themechange', this.onTheme);
    this.onFonts = () => { this.panCache = null; this.textWidths?.clear(); this.draw(); };
    document.fonts?.addEventListener('loadingdone', this.onFonts);
  }
  destroy() { this.dead = true; this.panCache = null; clearTimeout(this.detailTimer); document.fonts?.removeEventListener('loadingdone', this.onFonts); clearTimeout(this.queryTimer); this.ro.disconnect(); window.removeEventListener('themechange', this.onTheme); window.removeEventListener('keydown', this._key); cancelAnimationFrame(this.anim); cancelAnimationFrame(this._raf); }
  visible(n) { return this.show.fields.has(this.fieldOf.get(n.it.col)) && (this.show.defs || n.it.kind !== 'Definition') && (this.show.planned || !n.ghost); }
  /** Emphasize a set of ids (null clears); fit = zoom to them. */
  setHighlight(ids, { fit = false, label = '' } = {}) {
    this.hl = ids && ids.size ? ids : null;
    const n = this.host.querySelector('.map-q-n'); if (n) n.textContent = ids ? (ids.size ? `${ids.size.toLocaleString('en')} match${ids.size === 1 ? '' : 'es'}` : 'no matches') : label;
    if (fit && this.hl) this.fit(true); else this.draw();
  }
  resize() {
    const r = this.host.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1);
    this.W = r.width; this.H = r.height; this.canvas.width = this.W * d; this.canvas.height = this.H * d;
    this.canvas.style.width = this.W + 'px'; this.canvas.style.height = this.H + 'px'; this.dpr = d;
  }
  bounds() {
    const vis = this.nodes.filter((n) => this.visible(n) && (!this.hl || this.hl.has(n.it.id))); const ns = vis.length ? vis : this.nodes;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of ns) { if (n.x < x0) x0 = n.x; if (n.x > x1) x1 = n.x; if (n.y < y0) y0 = n.y; if (n.y > y1) y1 = n.y; }
    return [x0 - 60, y0 - 170, x1 + 60, y1 + 40];
  }
  fit(animate) {
    const [x0, y0, x1, y1] = this.bounds();
    const k = Math.min(this.W / (x1 - x0), (this.H - 90) / (y1 - y0));
    this.flyTo(k, this.W / 2 - k * (x0 + x1) / 2, (this.H + 40) / 2 - k * (y0 + y1) / 2, animate);
  }
  flyTo(k, tx, ty, animate = true) {
    cancelAnimationFrame(this.anim);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) animate = false;
    if (!animate) { this.k = k; this.tx = tx; this.ty = ty; this.draw(); return; }
    const s = { k: this.k, tx: this.tx, ty: this.ty }, t0 = performance.now(), D = 600;
    const step = (now) => { const u = Math.min(1, (now - t0) / D), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; this.beginMovement(); this.k = s.k + (k - s.k) * e; this.tx = s.tx + (tx - s.tx) * e; this.ty = s.ty + (ty - s.ty) * e; this.draw(); if (u < 1) this.anim = requestAnimationFrame(step); };
    this.anim = requestAnimationFrame(step);
  }
  zoom(factor) {
    cancelAnimationFrame(this.anim); this.userMoved = true; this.beginMovement();
    const k = Math.min(8, Math.max(0.01, this.k * factor)), r = k / this.k;
    this.tx = this.W / 2 - (this.W / 2 - this.tx) * r;
    this.ty = this.H / 2 - (this.H / 2 - this.ty) * r;
    this.k = k; this.draw();
  }
  focusNode(n) { const k = Math.max(this.k, 1.6); this.flyTo(k, this.W / 2 - n.x * k - (this.side.classList.contains('open') && this.W > 700 ? 180 : 0), this.H / 2 - n.y * k); }
  sx(x) { return x * this.k + this.tx; } sy(y) { return y * this.k + this.ty; }
  beginMovement() {
    // Keep every node during movement. Expensive link/text details return once
    // input settles, so crossing the raster boundary does not stall a drag.
    this.interacting = true; this.hover = null; this.tip.style.display = 'none';
    clearTimeout(this.detailTimer);
    this.detailTimer = setTimeout(() => { if (!this.dead) { this.interacting = false; this.draw(); } }, 160);
  }
  panTo(tx, ty) { this.beginMovement(); this.tx = tx; this.ty = ty; this.draw(); }
  textWidth(text) {
    this.textWidths ||= new Map();
    const key = this.ctx.font + '/' + this.ctx.letterSpacing + '\0' + text;
    if (!this.textWidths.has(key)) {
      if (this.textWidths.size > 20000) this.textWidths.clear();
      this.textWidths.set(key, this.ctx.measureText(text).width);
    }
    return this.textWidths.get(key);
  }
  hit(px, py) {
    let best = null, bd = 12;
    for (const n of this.nodes) { if (!this.visible(n)) continue; const d = Math.hypot(this.sx(n.x) - px, this.sy(n.y) - py) - Math.max(2, n.r * Math.min(1.4, this.k)) + (n.ghost ? 3 : 0); if (d < bd) { bd = d; best = n; } }
    return best;
  }
  closure(n) {
    const anc = new Set(), desc = new Set();
    const up = [n.it.id]; while (up.length) { const x = up.pop(); for (const d of depsOf(this.G.byId.get(x))) if (!anc.has(d) && this.G.byId.has(d)) { anc.add(d); up.push(d); } }
    const dn = [n.it.id]; while (dn.length) { const x = dn.pop(); for (const c of this.G.allChildren.get(x) || []) if (!desc.has(c)) { desc.add(c); dn.push(c); } }
    return { anc, desc };
  }
  head(it) {
    const C = this.G.colById.get(it.col);
    return `<div class="eyebrow" style="color:var(--c-${it.col})">${escapeHTML(C?.short || it.col)} · ${escapeHTML(fullLabel(it))}${it.planned ? ' · planned' : ''}</div>`;
  }
  /** Statements live in per-collection shards; fetch on demand and refresh `then`. */
  needSt(it, then) {
    if (it.st != null || it.planned || !this.loadShard) return;
    this.loadShard(it.col).then(() => { if (!this.dead) then(); });
  }
  select(n, fly) {
    this.sel = n; this.selClosure = n ? this.closure(n) : null;
    if (!n) { this.side.classList.remove('open'); this.draw(); return; }
    const it = n.it; const { anc, desc } = this.selClosure;
    this.side.innerHTML = `${this.head(it)}
      <div class="nm">${inlineHTML(it.name)}</div><div class="st">${it.planned ? '<span class="faint">On the syllabus, not written yet.</span>' : richHTML(it.st || '')}</div>
      <div class="stats-row"><span><b>${depsOf(it).length}</b> direct prerequisites</span><span><b>${anc.size}</b> in its full ancestry</span><span><b>${desc.size}</b> results rely on it</span></div>
      <div style="display:flex;gap:8px;margin-top:14px"><a class="btn primary" href="#/t/${it.id}">Open →</a><button class="btn" type="button" data-close>Close</button></div>`;
    this.side.querySelector('[data-close]').addEventListener('click', () => this.select(null));
    this.side.classList.add('open');
    this.needSt(it, () => { if (this.sel === n) this.select(n, false); });
    if (fly) this.focusNode(n); else this.draw();
  }
  _bind() {
    const cv = this.canvas; const ptrs = new Map(); let drag = null, pinch = null, moved = false;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('wheel', (e) => {
      e.preventDefault(); cancelAnimationFrame(this.anim); this.userMoved = true; this.beginMovement();
      const [px, py] = pos(e); const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
      const k = Math.min(8, Math.max(0.01, this.k * f)); const r = k / this.k;
      this.tx = px - (px - this.tx) * r; this.ty = py - (py - this.ty) * r; this.k = k; this.draw();
    }, { passive: false });
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, pos(e)); moved = false; cancelAnimationFrame(this.anim);
      if (ptrs.size === 1) drag = { p: pos(e), tx: this.tx, ty: this.ty };
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: this.k, c: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], tx: this.tx, ty: this.ty }; drag = null; }
    });
    cv.addEventListener('pointermove', (e) => {
      const p = pos(e);
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, p);
      if (pinch && ptrs.size === 2) {
        this.beginMovement();
        const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const k = Math.min(8, Math.max(0.01, pinch.k * d / pinch.d)); const r = k / pinch.k;
        this.k = k; this.tx = pinch.c[0] - (pinch.c[0] - pinch.tx) * r; this.ty = pinch.c[1] - (pinch.c[1] - pinch.ty) * r; moved = true; this.draw(); return;
      }
      if (drag) { const dx = p[0] - drag.p[0], dy = p[1] - drag.p[1]; if (Math.hypot(dx, dy) > 3) { moved = true; this.userMoved = true; this.panTo(drag.tx + dx, drag.ty + dy); } return; }
      const n = this.hit(p[0], p[1]);
      if (n !== this.hover) { this.hover = n; cv.style.cursor = n ? 'pointer' : 'grab'; this.draw(); }
      this._tip(n, p);
    });
    const up = (e) => {
      const p = pos(e); ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = null;
      if (drag && !moved) { const n = this.hit(p[0], p[1]); this.select(n || null, false); }
      drag = null;
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { this.hover = null; this._tip(null); this.draw(); });
    cv.addEventListener('dblclick', (e) => { const p = pos(e); const n = this.hit(p[0], p[1]); if (n) this.onOpen?.(n.it.id); });
    this._key = (e) => {
      if (e.key === 'Escape') this.select(null);
      if (e.target !== cv || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '+' || e.key === '=') this.zoom(1.4);
      else if (e.key === '-') this.zoom(1 / 1.4);
      else if (e.key === '0') this.fit(false);
      else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        cancelAnimationFrame(this.anim); this.userMoved = true;
        this.tx += e.key === 'ArrowLeft' ? 48 : e.key === 'ArrowRight' ? -48 : 0;
        this.ty += e.key === 'ArrowUp' ? 48 : e.key === 'ArrowDown' ? -48 : 0; this.beginMovement(); this.draw();
      } else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', this._key);
  }
  _tip(n, p) {
    if (!n) { this.tip.style.display = 'none'; this._tipN = null; return; }
    const it = n.it; this._tipN = n; this._tipP = p;
    this.tip.innerHTML = `${this.head(it)}<div class="nm">${inlineHTML(it.name)}</div><div class="st">${it.planned ? '<span class="faint">planned</span>' : richHTML(it.st || '')}</div>`;
    this.tip.style.display = 'block';
    const w = this.tip.offsetWidth, h = this.tip.offsetHeight;
    let x = p[0] + 16, y = p[1] + 16; if (x + w > this.W - 8) x = p[0] - w - 16; if (y + h > this.H - 8) y = p[1] - h - 16;
    this.tip.style.left = x + 'px'; this.tip.style.top = y + 'px';
    this.needSt(it, () => { if (this._tipN === n) this._tip(n, this._tipP); });
  }
  draw() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => { this._raf = 0; this._draw(); });
  }
  _draw() {
    // Panning translates the same picture. Keep a padded raster until the view
    // leaves it; picking still uses the actual nodes, and zoom/filter/focus
    // changes render from the full graph again.
    if (!this.W || !this.H) { this._paint(); return; }
    const key = `${this.k}/${this.W}/${this.H}/${this.dpr}/${!!this.interacting}/${this.show.defs}/${this.show.planned}/${this.hover?.it.id || ''}/${this.sel?.it.id || ''}/${[...this.show.fields].sort().join(',')}`;
    let cache = this.panCache;
    if (!cache || cache.key !== key || cache.highlight !== this.hl || Math.abs(this.tx-cache.tx) > cache.pad || Math.abs(this.ty-cache.ty) > cache.pad) {
      const pad = 192, canvas = cache?.canvas || document.createElement('canvas');
      const width = Math.ceil((this.W + 2*pad)*this.dpr), height = Math.ceil((this.H + 2*pad)*this.dpr);
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      const old = { ctx: this.ctx, W: this.W, H: this.H, tx: this.tx, ty: this.ty };
      try {
        this.ctx = canvas.getContext('2d'); this.W += 2*pad; this.H += 2*pad; this.tx += pad; this.ty += pad;
        this._paint();
      } finally { Object.assign(this, old); }
      cache = this.panCache = { key, highlight: this.hl, pad, canvas, tx: this.tx, ty: this.ty };
    }
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, this.W, this.H);
    c.drawImage(cache.canvas, this.tx-cache.tx-cache.pad, this.ty-cache.ty-cache.pad, this.W+2*cache.pad, this.H+2*cache.pad);
  }
  _paint() {
    const c = this.ctx, k = this.k; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, this.W, this.H);
    const focus = this.hover || this.sel;
    const fc = focus ? (focus === this.sel ? this.selClosure : this.closure(focus)) : null;
    const off = (x0, y0, x1, y1) => x1 < 0 || x0 > this.W || y1 < 0 || y0 > this.H;
    // field regions
    for (const F of this.G.map?.fields || []) {
      if (!this.show.fields.has(F.field)) continue;
      const x0 = this.sx(F.x0), y0 = this.sy(F.y0), x1 = this.sx(F.x1), y1 = this.sy(F.y1);
      if (off(x0, y0, x1, y1)) continue;
      c.fillStyle = withAlpha('field-' + F.field, 0.035); c.beginPath(); c.roundRect(x0, y0, x1 - x0, y1 - y0, 18 * Math.min(1, k * 4)); c.fill();
      // the title must fit its region: fall back to the short name, then shrink
      let fs = Math.max(13, Math.min(30, 60 * k)), txt = F.title.toUpperCase();
      c.save(); c.letterSpacing = '0.08em'; c.fillStyle = withAlpha('field-' + F.field, 0.95); c.textAlign = 'left'; c.textBaseline = 'bottom';
      const room = x1 - x0 - 8, fit = () => { c.font = `600 ${fs}px Inter, system-ui, sans-serif`; return this.textWidth(txt); };
      if (fit() > room) { txt = (this.G.fieldById?.get(F.field)?.short || F.field).toUpperCase(); if (fit() > room) { fs = Math.max(9, fs * room / this.textWidth(txt)); fit(); } }
      c.fillText(txt, x0 + 4, y0 - 4); c.restore();
    }
    // chapter bands
    c.font = '600 11px Inter, system-ui, sans-serif';
    for (const C of this.G.collections) {
      if (!this.show.fields.has(C.field)) continue;
      C.chapters.forEach((Ch, i) => {
        const b = Ch.band; if (!b) return;
        if (!Ch.count && !this.show.planned) return;
        const x0 = this.sx(b.x0), x1 = this.sx(b.x1), y0 = this.sy(b.y0), y1 = this.sy(b.y1);
        if (off(x0, y0, x1, y1)) return;
        c.fillStyle = withAlpha(C.id, (i % 2 ? 0.035 : 0.065) * (Ch.count ? 1 : 0.5)); c.beginPath(); c.roundRect(x0, y0, x1 - x0, y1 - y0, 8 * Math.min(1, k)); c.fill();
        const wpx = x1 - x0;
        if (wpx < 18 || this.interacting) return;
        c.fillStyle = withAlpha(C.id, Ch.count ? 0.9 : 0.5); c.textAlign = 'left'; c.textBaseline = 'top';
        const label = wpx > 150 ? `${Ch.n} · ${Ch.title}` : wpx > 60 ? `Ch ${Ch.n}` : `${Ch.n}`;
        c.save(); c.beginPath(); c.rect(x0, y0, wpx, 30); c.clip(); c.fillText(label, x0 + 6, y0 + 7); c.restore();
      });
    }
    for (const R of k < 0.13 || this.interacting ? [] : this.G.map?.rows || []) {
      if (!this.show.fields.has(this.fieldOf.get(R.col))) continue;
      const fs = Math.max(13, Math.min(28, 26 * k));
      const x = this.sx(R.x), y = this.sy(R.y); if (off(x, y - fs - 8, x + 600, y)) continue;
      c.font = `italic 500 ${fs}px Newsreader, serif`; c.fillStyle = withAlpha(R.col, 1); c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText(R.label, x + 4, y - 6);
    }
    c.font = '600 11px Inter, system-ui, sans-serif';
    // edges
    const drawEdges = (list, style, width, dash) => {
      c.beginPath();
      for (const [a, b] of list) {
        const x1 = this.sx(a.x), y1 = this.sy(a.y), x2 = this.sx(b.x), y2 = this.sy(b.y);
        // Unfocused long links between two offscreen nodes obscure the local
        // graph. Their full ancestry remains available on hover/selection.
        const nearby = (x,y) => x>=-50 && x<=this.W+50 && y>=-50 && y<=this.H+50;
        if (!fc && !nearby(x1,y1) && !nearby(x2,y2)) continue;
        const dx = Math.max(20 * k, Math.abs(x2 - x1) * 0.45);
        traceClippedCubic(c, [x1,y1,x1+dx,y1,x2-dx,y2,x2,y2], this.W, this.H);
      }
      c.strokeStyle = style; c.lineWidth = width; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]);
    };
    const far = k < 0.13;
    const vis = far && !fc ? [] : this.edges.filter(([a, b]) => this.visible(a) && this.visible(b));
    if (this.interacting) {
      // Links are refined after movement; nodes below remain complete.
    } else if (far && !fc) {
      // bundled collection-to-collection edges
      for (const e of this.bundles) {
        if (!this.show.fields.has(this.fieldOf.get(e.a)) || !this.show.fields.has(this.fieldOf.get(e.b))) continue;
        const n = this.show.planned ? e.n : e.written; if (!n) continue;
        const A = this.centers.get(e.a), B = this.centers.get(e.b); if (!A || !B) continue;
        const x1 = this.sx(A.x), y1 = this.sy(A.y), x2 = this.sx(B.x), y2 = this.sy(B.y);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.18;
        c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2);
        const t = Math.sqrt(n / this.maxBundle); // thin, faint strands for a few links; bold ones for the main roads
        c.strokeStyle = withAlpha(e.a, (0.06 + 0.32 * t) * (this.hl ? 0.08 : 1)); c.lineWidth = 0.6 + 7 * t; c.lineCap = 'round'; c.stroke();
      }
    } else if (!fc) {
      const byCol = new Map();
      for (const e of vis) { if (e[0].ghost || e[1].ghost) continue; const key = e[0].it.col; if (!byCol.has(key)) byCol.set(key, []); byCol.get(key).push(e); }
      for (const [col, list] of byCol) drawEdges(list, withAlpha(col, this.hl ? 0.05 : 0.16), Math.max(0.6, Math.min(1.3, k)));
      if (this.show.planned) drawEdges(vis.filter(([a, b]) => a.ghost || b.ghost), withAlpha('muted', 0.12), 0.7, [3, 3]);
    } else {
      drawEdges(vis, withAlpha('ink', 0.05), 0.7);
      const id = focus.it.id; const A = new Set([...fc.anc, id]), D = new Set([...fc.desc, id]);
      drawEdges(vis.filter(([a, b]) => A.has(a.it.id) && A.has(b.it.id)), withAlpha('accent', 0.55), Math.max(1, Math.min(2, k * 1.2)));
      drawEdges(vis.filter(([a, b]) => D.has(a.it.id) && D.has(b.it.id)), withAlpha('green', 0.55), Math.max(1, Math.min(2, k * 1.2)));
    }
    // nodes
    const rk = Math.max(0.55, Math.min(1.5, k));
    if (far && !fc) {
      // Nodes are grouped by collection in the catalog. Avoid reparsing the same
      // canvas colour for every dot in the 13k-node overview.
      const colors = new Map(); let fill;
      for (const n of this.nodes) {
        if (!this.visible(n)) continue;
        const x = this.sx(n.x), y = this.sy(n.y); if (x < -4 || x > this.W + 4 || y < -4 || y > this.H + 4) continue;
        const on = !this.hl || this.hl.has(n.it.id);
        const r = this.hl && on ? 3.4 : n.ghost ? 1 : Math.max(1.2, Math.min(3, n.r * k * 2.2));
        const alpha = !on ? 0.06 : n.ghost && !this.hl ? 0.35 : 0.95;
        const key = `${n.it.col}/${alpha}`;
        if (!colors.has(key)) colors.set(key, withAlpha(n.it.col, alpha));
        const color = colors.get(key);
        if (fill !== color) { c.fillStyle = color; fill = color; }
        c.fillRect(x - r, y - r, 2 * r, 2 * r);
        if (this.hl && on) { c.lineWidth = 1.2; c.strokeStyle = withAlpha('ink', 0.55); c.strokeRect(x - r - 1.5, y - r - 1.5, 2 * r + 3, 2 * r + 3); }
      }
    } else for (const n of this.nodes) {
      if (!this.visible(n)) continue;
      const x = this.sx(n.x), y = this.sy(n.y); if (x < -20 || x > this.W + 20 || y < -20 || y > this.H + 20) continue;
      let alpha = 1;
      if (fc && n !== focus && !fc.anc.has(n.it.id) && !fc.desc.has(n.it.id)) alpha = 0.14;
      const hit = this.hl && this.hl.has(n.it.id); if (this.hl && !hit && !fc) alpha = 0.1;
      const r = Math.max(n.ghost ? 1.4 : 1.6, n.r * rk);
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
      if (n.ghost) { c.lineWidth = 1; c.strokeStyle = withAlpha(n.it.col, alpha * 0.45); c.stroke(); }
      else if (n.it.kind === 'Definition') { c.fillStyle = withAlpha('panel', alpha); c.fill(); c.lineWidth = 1.4; c.strokeStyle = withAlpha(n.it.col, alpha); c.stroke(); }
      else { c.fillStyle = withAlpha(n.it.col, alpha); c.fill(); }
      if (hit) { c.beginPath(); c.arc(x, y, r + 2.5, 0, Math.PI * 2); c.lineWidth = 1.6; c.strokeStyle = withAlpha('accent', 0.9); c.stroke(); }
      if (n === focus || n === this.sel) { c.beginPath(); c.arc(x, y, r + 4, 0, Math.PI * 2); c.lineWidth = 2; c.strokeStyle = resolveColor('ink'); c.stroke(); }
    }
    if (this.interacting) return;
    // labels
    const occupied = [];
    const free = (x, y, w, h) => { for (const o of occupied) if (x < o[0] + o[2] && x + w > o[0] && y < o[1] + o[3] && y + h > o[1]) return false; occupied.push([x, y, w, h]); return true; };
    c.textBaseline = 'middle'; c.textAlign = 'left';
    const label = (n, strong) => {
      if (!this.visible(n)) return;
      const x = this.sx(n.x), y = this.sy(n.y); if (x < -100 || x > this.W || y < 0 || y > this.H) return;
      const txt = `${n.it.num} ${plainName(n.it.name, strong ? 60 : 30)}`;
      c.font = `${strong ? 600 : 500} ${strong ? 12.5 : 11}px Inter, system-ui, sans-serif`;
      const w = this.textWidth(txt); const r = Math.max(1.6, n.r * rk) + (this.hl && this.hl.has(n.it.id) ? 4 : 0);
      if (!strong && !free(x + r + 3, y - 7, w + 4, 14)) return;
      c.lineWidth = 3.5; c.strokeStyle = withAlpha('bg', 0.9); c.strokeText(txt, x + r + 4, y);
      c.fillStyle = resolveColor(strong ? 'ink' : n.ghost ? 'faint' : 'muted'); c.fillText(txt, x + r + 4, y);
    };
    if (focus) label(focus, true);
    if (this.sel && this.sel !== focus) label(this.sel, true);
    if (this.hl && !fc) { let m = 0; for (const n of this.nodes) { if (!this.hl.has(n.it.id)) continue; label(n, false); if (++m > 160) break; } return; }
    if (k >= 1.15) for (const n of this.nodes) { if (fc && n !== focus && !fc.anc.has(n.it.id) && !fc.desc.has(n.it.id)) continue; label(n, false); }
    else if (k >= 0.35) for (const n of this.top) { if (fc && !fc.anc.has(n.it.id) && !fc.desc.has(n.it.id)) continue; label(n, false); }
  }
}

// ------------------------------------------------------------ treemap overview (home page)
/** Squarified treemap layout: items [{value}] sorted descending → rectangles inside [x, y, w, h]. */
function squarify(items, x, y, w, h) {
  const out = []; let rest = items.slice(); const total = rest.reduce((s, it) => s + it.value, 0) || 1;
  const scale = (w * h) / total;
  let rx = x, ry = y, rw = w, rh = h;
  const worst = (row, side) => { const s = row.reduce((a, it) => a + it.value * scale, 0); const mx = Math.max(...row.map((it) => it.value * scale)), mn = Math.min(...row.map((it) => it.value * scale)); return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn)); };
  while (rest.length) {
    const side = Math.min(rw, rh); const row = [rest[0]]; let i = 1;
    while (i < rest.length && worst([...row, rest[i]], side) <= worst(row, side)) { row.push(rest[i]); i++; }
    const s = row.reduce((a, it) => a + it.value * scale, 0);
    if (rw >= rh) { const cw = s / rh; let cy = ry; for (const it of row) { const ch = (it.value * scale) / cw; out.push({ it, x: rx, y: cy, w: cw, h: ch }); cy += ch; } rx += cw; rw -= cw; }
    else { const ch = s / rw; let cx = rx; for (const it of row) { const cw = (it.value * scale) / ch; out.push({ it, x: cx, y: ry, w: cw, h: ch }); cx += cw; } ry += ch; rh -= ch; }
    rest = rest.slice(i);
  }
  return out;
}
/**
 * Everything at a glance: fields → collections (→ chapters when zoomed into a field), area ∝ ideas
 * (written + planned), solid = written, pale = planned. Click a field to zoom in, a collection to open it.
 */
export function renderTreemap(host, G, { field = null, onField, onCollection, onChapter, height = 520 } = {}) {
  host.innerHTML = '';
  const W = Math.max(320, host.clientWidth || 1000), H = field ? Math.round(height * 1.05) : height;
  const root = svg('svg', { class: 'treemap-svg', width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: 'group', 'aria-label': 'Treemap of every field and collection' }, host);
  const size = (C) => Math.max(40, (C.count || 0) + (C.planned || 0) || 80);
  const fields = (field ? G.fields.filter((F) => F.id === field) : G.fields).map((F) => {
    const cols = G.collections.filter((C) => C.field === F.id);
    return { F, cols, value: cols.reduce((s, C) => s + size(C), 0) };
  }).sort((a, b) => b.value - a.value);
  const PAD = 3, HEAD = 22;
  for (const fr of squarify(fields, 0, 0, W, H)) {
    const { F, cols } = fr.it; const fx = fr.x + PAD / 2, fy = fr.y + PAD / 2, fw = fr.w - PAD, fh = fr.h - PAD;
    const g = svg('g', { class: 'tm-field' + (field ? '' : ' zoomable'), 'data-field': F.id }, root);
    svg('rect', { x: fx, y: fy, width: fw, height: fh, rx: 8, fill: `var(--f-${F.id})`, 'fill-opacity': 0.08, stroke: `var(--f-${F.id})`, 'stroke-opacity': 0.5 }, g);
    const showHead = fh > 40 && fw > 60;
    if (showHead) {
      const t = svg('text', { 'pointer-events': 'none', x: fx + 8, y: fy + 15, 'font-size': 11.5, 'font-weight': 700, 'letter-spacing': '0.06em', fill: `var(--f-${F.id})` }, g);
      const label = (fw > 180 ? F.title : F.short).toUpperCase(); t.textContent = label.length * 7.6 > fw - 16 ? F.short.toUpperCase() : label;
    }
    if (!field) {
      const control = svg('rect', { x: fx, y: fy, width: fw, height: showHead ? HEAD : fh, rx: 4, fill: 'transparent', class: 'tm-field-control', tabindex: 0, role: 'button', 'aria-label': `Zoom into ${F.title}` }, g);
      control.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onField?.(F.id); } });
      g.addEventListener('click', (e) => { if (!e.target.closest('.tm-col')) onField?.(F.id); }); svg('title', {}, g).textContent = `${F.title} — click to zoom in`; }
    const inner = squarify(cols.map((C) => ({ C, value: size(C) })).sort((a, b) => b.value - a.value), fx + 4, fy + (showHead ? HEAD : 4), fw - 8, fh - (showHead ? HEAD : 4) - 4);
    for (const cr of inner) {
      const C = cr.it.C; const x = cr.x + 1.5, y = cr.y + 1.5, w = Math.max(0, cr.w - 3), h = Math.max(0, cr.h - 3);
      const cg = svg('g', { class: 'tm-col', tabindex: 0, role: 'link', 'aria-label': `${C.title}: ${C.count} written, ${C.planned} planned` }, g);
      const tot = (C.count || 0) + (C.planned || 0); const frac = tot ? C.count / tot : 0;
      svg('rect', { x, y, width: w, height: h, rx: 5, fill: `var(--c-${C.id})`, 'fill-opacity': 0.16, stroke: `var(--c-${C.id})`, 'stroke-opacity': 0.45, 'stroke-dasharray': tot ? null : '3 3' }, cg);
      if (frac > 0) svg('rect', { x, y: y + h * (1 - frac), width: w, height: h * frac, rx: 5, fill: `var(--c-${C.id})`, 'fill-opacity': 0.85 }, cg);
      // chapters when zoomed into one field
      if (field && C.chapters.length && w > 40 && h > 40) {
        const chs = squarify(C.chapters.map((Ch) => ({ Ch, value: Math.max(1, (Ch.count || 0) + (Ch.planned || 0)) })).sort((a, b) => b.value - a.value), x + 3, y + 22, w - 6, h - 25);
        for (const r of chs) {
          const Ch = r.it.Ch; const rr = svg('rect', { x: r.x + 0.5, y: r.y + 0.5, width: Math.max(0, r.w - 1), height: Math.max(0, r.h - 1), rx: 2, fill: 'var(--panel)', 'fill-opacity': Ch.count ? 0.18 : 0.5, stroke: 'var(--panel)', 'stroke-opacity': 0.9, class: 'tm-ch', tabindex: 0, role: 'link', 'aria-label': `${C.title}, chapter ${Ch.n}: ${Ch.title}` }, cg);
          svg('title', {}, rr).textContent = `${C.short} ${Ch.n} · ${Ch.title} — ${Ch.count || 0} written${Ch.planned ? `, ${Ch.planned} planned` : ''}`;
          rr.addEventListener('click', (e) => { e.stopPropagation(); onChapter?.(C.id, Ch.n); });
          rr.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.stopPropagation(); onChapter?.(C.id, Ch.n); } });
          if (r.w > 70 && r.h > 16) { const t = svg('text', { x: r.x + 4, y: r.y + 12, 'font-size': 10, fill: Ch.count && frac > 0.5 ? 'var(--bg)' : 'var(--ink-2)', 'pointer-events': 'none' }, cg); const mx = Math.floor((r.w - 8) / 5.6); t.textContent = (`${Ch.n} ${Ch.title}`).slice(0, mx); }
        }
      }
      if (w > 34 && h > 16) {
        const big = w > 120 && h > 34; const lab = big ? C.title : C.short;
        const mx = Math.floor((w - 10) / (big ? 6.4 : 6));
        const t = svg('text', { x: x + 5, y: y + 13, 'font-size': big ? 12 : 10.5, 'font-weight': 600, class: 'tm-label', fill: 'var(--ink)', 'pointer-events': 'none' }, cg);
        t.textContent = lab.length > mx ? (big && C.short.length <= mx ? C.short : lab.slice(0, Math.max(1, mx - 1)) + '…') : lab;
        if (h > 34 && w > 60 && !field) { const n = svg('text', { x: x + 5, y: y + 27, 'font-size': 10, 'font-family': 'var(--font-mono)', class: 'tm-label', fill: 'var(--ink-2)', 'pointer-events': 'none' }, cg); n.textContent = C.count ? `${C.count}${C.planned ? ` +${C.planned}` : ''}` : C.planned ? `${C.planned} planned` : 'planned'; }
      }
      svg('title', {}, cg).textContent = `${C.title} — ${C.count} written${C.planned ? `, ${C.planned} planned` : ''}`;
      cg.addEventListener('click', (e) => { e.stopPropagation(); onCollection?.(C.id); });
      cg.addEventListener('keydown', (e) => { if (e.key === 'Enter') onCollection?.(C.id); });
    }
  }
}

// ------------------------------------------------------------ timeline of ideas (canvas)
/** Piecewise time axis: the distant past is compressed, recent centuries get room. */
const T_BREAKS = [[-3000, 0], [-500, 0.06], [1500, 0.2], [1700, 0.34], [1850, 0.58], [1950, 0.86], [2030, 1]];
function tAxis(y) {
  if (y <= T_BREAKS[0][0]) return 0;
  for (let i = 1; i < T_BREAKS.length; i++) { const [y0, u0] = T_BREAKS[i - 1], [y1, u1] = T_BREAKS[i]; if (y <= y1) return u0 + ((y - y0) / (y1 - y0)) * (u1 - u0); }
  return 1;
}
function tAxisInv(u) {
  for (let i = 1; i < T_BREAKS.length; i++) { const [y0, u0] = T_BREAKS[i - 1], [y1, u1] = T_BREAKS[i]; if (u <= u1) return y0 + ((u - u0) / (u1 - u0)) * (y1 - y0); }
  return T_BREAKS[T_BREAKS.length - 1][0];
}
const fmtYear = (y) => (y < 0 ? `${Math.round(-y)} BCE` : `${Math.round(y)}`);
export class TimelineView {
  /** opts: onOpen(id), items (default: written items with a year), what ('dated ideas'), highlight (Set of ids). */
  constructor(host, G, { onOpen, items, what = 'dated ideas', highlight = null, fit = false } = {}) {
    this.host = host; this.G = G; this.onOpen = onOpen; this.hl = highlight;
    host.classList.add('timeline-page');
    this.items = (items || G.items).filter((it) => it.yr != null);
    this.fields = G.fields.filter((F) => this.items.some((it) => G.colById.get(it.col)?.field === F.id));
    host.innerHTML = `<canvas tabindex="0" aria-label="Timeline of ideas. Use left and right arrows to pan, plus and minus to zoom, and 0 to reset."></canvas><div class="map-tip"></div>
      <div class="map-help">${this.items.length} ${what} · scroll to zoom in time · drag to pan · click a dot to open</div>`;
    this.canvas = host.querySelector('canvas'); this.ctx = this.canvas.getContext('2d'); this.tip = host.querySelector('.map-tip');
    this.u0 = 0; this.u1 = 1; this.hover = null;
    if (fit && this.items.length) { const us = this.items.map((it) => tAxis(it.yr)); const a = Math.min(...us), b = Math.max(...us), pad = Math.max(0.02, (b - a) * 0.06); this.u0 = Math.max(0, a - pad); this.u1 = Math.min(1, b + pad); }
    this.initialRange = [this.u0, this.u1];
    zoomControls(host, (factor) => this.zoom(factor), () => { [this.u0, this.u1] = this.initialRange; this.layout(); this.draw(); });
    this.ro = new ResizeObserver(() => { this.resize(); this.layout(); this.draw(); }); this.ro.observe(host);
    this.onTheme = () => this.draw(); window.addEventListener('themechange', this.onTheme);
    this._bind(); this.resize(); this.layout(); this.draw();
  }
  destroy() { this.ro.disconnect(); window.removeEventListener('themechange', this.onTheme); }
  /** Emphasize a set of ids (null clears). */
  setHighlight(ids) { this.hl = ids && ids.size ? ids : null; this.draw(); }
  resize() { const r = this.host.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); this.W = r.width; this.H = r.height; this.canvas.width = this.W * d; this.canvas.height = this.H * d; this.canvas.style.width = this.W + 'px'; this.canvas.style.height = this.H + 'px'; this.dpr = d; }
  get left() { return this.W < 600 ? 86 : 150; }
  get right() { return this.W - (this.W < 600 ? 16 : 30); }
  zoom(factor) {
    const width = Math.max(0.004, Math.min(1, (this.u1 - this.u0) / factor)), mid = (this.u0 + this.u1) / 2;
    this.u0 = Math.max(0, Math.min(1 - width, mid - width / 2)); this.u1 = this.u0 + width;
    this.layout(); this.draw();
  }
  X(u) { const L = this.left, R = this.right; return L + ((u - this.u0) / (this.u1 - this.u0)) * (R - L); }
  layout() {
    // one lane per field; inside a lane, a beeswarm so dots never overlap at the current zoom
    const avail = this.H - 110; const laneH = Math.min(170, avail / Math.max(1, this.fields.length));
    const top = 50 + Math.max(0, (avail - laneH * this.fields.length) / 2);
    this.lanes = this.fields.map((F, i) => ({ F, y0: top + i * laneH, y1: top + (i + 1) * laneH }));
    this.axisY = top + laneH * this.fields.length + 8;
    const R = 3.6;
    for (const lane of this.lanes) {
      const its = this.items.filter((it) => this.G.colById.get(it.col).field === lane.F.id).map((it) => ({ it, x: this.X(tAxis(it.yr)) })).sort((a, b) => a.x - b.x || (b.it.desc || 0) - (a.it.desc || 0));
      const mid = (lane.y0 + lane.y1) / 2, maxOff = (lane.y1 - lane.y0) / 2 - R - 2; const placed = [];
      for (const p of its) {
        let off = 0; for (let k = 0; k < 200; k++) { off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (R * 2 + 0.6); if (Math.abs(off) > maxOff) { off = (Math.random() - 0.5) * 2 * maxOff; break; } const y = mid + off; if (!placed.some((q) => Math.abs(q.x - p.x) < R * 2 && Math.abs(q.y - y) < R * 2)) break; }
        p.y = mid + off; placed.push(p); while (placed.length && placed[0].x < p.x - R * 4) placed.shift();
        p.r = R;
      }
      lane.pts = its;
    }
  }
  _bind() {
    const cv = this.canvas; let drag = null;
    cv.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '+' || e.key === '=') this.zoom(1.4);
      else if (e.key === '-') this.zoom(1 / 1.4);
      else if (e.key === '0') { [this.u0, this.u1] = this.initialRange; this.layout(); this.draw(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const width = this.u1 - this.u0, delta = width * 0.12 * (e.key === 'ArrowLeft' ? -1 : 1);
        this.u0 = Math.max(0, Math.min(1 - width, this.u0 + delta)); this.u1 = this.u0 + width; this.layout(); this.draw();
      } else return;
      e.preventDefault();
    });
    const hit = (p) => { let best = null, bd = 10; for (const lane of this.lanes || []) for (const q of lane.pts) { if (q.x < this.left || q.x > this.right) continue; const d = Math.hypot(q.x - p[0], q.y - p[1]); if (d < bd) { bd = d; best = q; } } return best; };
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('wheel', (e) => { e.preventDefault(); const [px] = pos(e); const L = this.left, R = this.right; const u = this.u0 + ((px - L) / (R - L)) * (this.u1 - this.u0); const f = Math.exp(e.deltaY * 0.0015); let w = Math.min(1, Math.max(0.004, (this.u1 - this.u0) * f)); let a = u - (u - this.u0) * (w / (this.u1 - this.u0)); a = Math.max(0, Math.min(1 - w, a)); this.u0 = a; this.u1 = a + w; this.layout(); this.draw(); }, { passive: false });
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); drag = { x: pos(e)[0], u0: this.u0, u1: this.u1, moved: false }; });
    cv.addEventListener('pointermove', (e) => {
      const p = pos(e);
      if (drag) { const dx = p[0] - drag.x; if (Math.abs(dx) > 3) drag.moved = true; const w = drag.u1 - drag.u0; let a = drag.u0 - (dx / (this.right - this.left)) * w; a = Math.max(0, Math.min(1 - w, a)); this.u0 = a; this.u1 = a + w; this.layout(); this.draw(); return; }
      const best = hit(p);
      if (best !== this.hover) { this.hover = best; cv.style.cursor = best ? 'pointer' : 'grab'; this.draw(); }
      if (best) { const it = best.it; const C = this.G.colById.get(it.col); this.tip.innerHTML = `<div class="eyebrow" style="color:var(--c-${it.col})">${escapeHTML(C.short)} · ${escapeHTML(fullLabel(it))} · ${fmtYear(it.yr)}${it.au ? ` · ${escapeHTML(it.au)}` : ''}${it.planned ? ' · planned' : ''}</div><div class="nm">${inlineHTML(it.name)}</div>`; this.tip.style.display = 'block'; const w = this.tip.offsetWidth; this.tip.style.left = Math.max(8, Math.min(this.W - w - 8, p[0] + 14)) + 'px'; this.tip.style.top = Math.max(8, Math.min(this.H - this.tip.offsetHeight - 8, p[1] + 14)) + 'px'; } else this.tip.style.display = 'none';
    });
    cv.addEventListener('pointerup', (e) => { const point = hit(pos(e)); if (drag && !drag.moved && point) this.onOpen?.(point.it.id); drag = null; });
    cv.addEventListener('pointercancel', () => { drag = null; });
    cv.addEventListener('pointerleave', () => { this.hover = null; this.tip.style.display = 'none'; this.draw(); });
  }
  draw() {
    const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, this.W, this.H);
    // ticks: round years, coarser in the distant past; keep labels ≥ 56 px apart (major years win)
    c.font = '500 11px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top';
    const yA = tAxisInv(this.u0), yB = tAxisInv(this.u1);
    const steps = [1000, 500, 100, 50, 25, 10, 5, 1];
    const cand = []; for (const st of steps) for (let y = Math.ceil(yA / st) * st; y <= yB; y += st) if (!cand.some((q) => q.y === y)) cand.push({ y, st });
    const placed = [];
    for (const q of cand) { const x = this.X(tAxis(q.y)); if (x < this.left || x > this.right) continue; if (placed.some((p) => Math.abs(p - x) < 56)) continue; placed.push(x);
      c.strokeStyle = withAlpha('grid', 1); c.lineWidth = 1; c.beginPath(); c.moveTo(x, this.lanes[0].y0); c.lineTo(x, this.axisY); c.stroke(); c.fillStyle = resolveColor('muted'); c.fillText(fmtYear(q.y), x, this.axisY + 4); }
    for (const l of this.lanes) {
      c.fillStyle = withAlpha('field-' + l.F.id, 0.05); c.fillRect(0, l.y0 + 1, this.W, l.y1 - l.y0 - 2);
      c.fillStyle = withAlpha('field-' + l.F.id, 1); c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = '600 11.5px Inter, system-ui, sans-serif';
      c.fillText(l.F.short.toUpperCase(), 14, (l.y0 + l.y1) / 2);
      for (const q of l.pts) {
        if (q.x < this.left || q.x > this.right) continue;
        const on = !this.hl || this.hl.has(q.it.id), a = q === this.hover ? 1 : on ? 0.85 : 0.12;
        c.beginPath(); c.arc(q.x, q.y, q.r + (this.hl && on ? 1.2 : 0), 0, Math.PI * 2);
        if (q.it.planned) { c.fillStyle = withAlpha('panel', 1); c.fill(); c.lineWidth = 1.6; c.strokeStyle = withAlpha(q.it.col, a); c.stroke(); } // not yet written: hollow
        else { c.fillStyle = withAlpha(q.it.col, a); c.fill(); }
        if (q === this.hover) { c.lineWidth = 2; c.strokeStyle = resolveColor('ink'); c.stroke(); }
      }
    }
    // labels for the most important ideas in view, without overlap
    const occ = []; const free = (x, y, w, h) => { for (const o of occ) if (x < o[0] + o[2] && x + w > o[0] && y < o[1] + o[3] && y + h > o[1]) return false; occ.push([x, y, w, h]); return true; };
    const dots = this.lanes.flatMap((l) => l.pts).filter((q) => q.x > this.left && q.x < this.right);
    const blockers = dots.map((q) => [q.x - q.r, q.y - q.r, 2 * q.r, 2 * q.r]);
    const freeOfDots = (x, y, w, h, self) => !blockers.some((b, i) => dots[i] !== self && x < b[0] + b[2] && x + w > b[0] && y < b[1] + b[3] && y + h > b[1]);
    const all = dots.filter((q) => !this.hl || this.hl.has(q.it.id)).sort((a, b) => (b.it.kind === 'Paper') - (a.it.kind === 'Paper') || (b.it.desc || 0) - (a.it.desc || 0)).slice(0, 80);
    c.font = '500 11px Inter, system-ui, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left';
    for (const q of all) {
      const t = plainName(q.it.name, 34); const w = c.measureText(t).width;
      for (const [dx, dy] of [[6, 0], [6, -11], [6, 11], [-w - 10, 0]]) {
        const x = q.x + dx, y = q.y + dy; if (x < this.left || x + w > this.W - 6) continue;
        if (!freeOfDots(x, y - 7, w + 4, 14, q) || !free(x, y - 7, w + 4, 14)) continue;
        c.lineWidth = 3; c.strokeStyle = withAlpha('bg', 0.9); c.strokeText(t, x, y); c.fillStyle = resolveColor('muted'); c.fillText(t, x, y); break;
      }
    }
  }
}

// ------------------------------------------------------------ chord diagram of fields
/**
 * Chord diagram of dependency links between fields. edges: [{from, to, n}] where `from` is the field whose results
 * are used and `to` the field using them. Arcs are sized by each field's cross-field links; a ribbon joins two fields
 * and takes the colour of the one that supplies more. Hover an arc or ribbon to read the counts; click an arc to open the field.
 */
export function renderChord(host, { fields, edges, onField, size = 560 }) {
  host.innerHTML = '';
  const ids = fields.map((F) => F.id), ix = new Map(ids.map((id, i) => [id, i])), n = ids.length;
  const M = ids.map(() => new Array(n).fill(0));
  for (const e of edges) if (ix.has(e.from) && ix.has(e.to)) M[ix.get(e.from)][ix.get(e.to)] += e.n;
  const pair = (i, j) => M[i][j] + M[j][i];
  const tot = ids.map((_, i) => ids.reduce((s, _2, j) => s + (i === j ? 0 : pair(i, j)), 0));
  const keep = ids.map((_, i) => i).filter((i) => tot[i] > 0);
  const T = keep.reduce((s, i) => s + tot[i], 0); if (!T) { host.innerHTML = '<p class="muted">No cross-field links yet.</p>'; return; }
  const S = size, cx = S / 2, cy = S / 2, R = S / 2 - 78, ring = 13, gap = 0.035;
  const span = 2 * Math.PI - gap * keep.length;
  const root = svg('svg', { viewBox: `0 0 ${S} ${S}`, class: 'chord', role: 'group', 'aria-label': 'How the fields depend on one another' }, host);
  const P = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const arcD = (a0, a1, r0, r1) => { const lg = a1 - a0 > Math.PI ? 1 : 0, [x0, y0] = P(a0, r1), [x1, y1] = P(a1, r1), [x2, y2] = P(a1, r0), [x3, y3] = P(a0, r0); return `M${x0},${y0}A${r1},${r1} 0 ${lg} 1 ${x1},${y1}L${x2},${y2}A${r0},${r0} 0 ${lg} 0 ${x3},${y3}Z`; };
  // angular layout: each field's arc, subdivided into one segment per partner (partners in circular order)
  const arc = new Map(), seg = new Map();
  let a = -Math.PI / 2;
  for (const i of keep) {
    const w = (span * tot[i]) / T; arc.set(i, [a, a + w]);
    let b = a; const order = keep.filter((j) => j !== i).sort((p, q) => ((p - i + n) % n) - ((q - i + n) % n)).reverse();
    for (const j of order) { const sw = (span * pair(i, j)) / T; seg.set(`${i}:${j}`, [b, b + sw]); b += sw; }
    a += w + gap;
  }
  const gR = svg('g', { class: 'ribbons' }, root), gA = svg('g', { class: 'arcs' }, root), gL = svg('g', { class: 'labels' }, root);
  const rib = [];
  for (const i of keep) for (const j of keep) {
    if (j <= i || !pair(i, j)) continue;
    const [a0, a1] = seg.get(`${i}:${j}`), [b0, b1] = seg.get(`${j}:${i}`), r = R - 2;
    const [x0, y0] = P(a0, r), [x1, y1] = P(a1, r), [x2, y2] = P(b0, r), [x3, y3] = P(b1, r);
    const d = `M${x0},${y0}A${r},${r} 0 0 1 ${x1},${y1}Q${cx},${cy} ${x2},${y2}A${r},${r} 0 0 1 ${x3},${y3}Q${cx},${cy} ${x0},${y0}Z`;
    const src = M[i][j] >= M[j][i] ? i : j;
    const p = svg('path', { d, style: `fill:var(--f-${ids[src]});stroke:var(--f-${ids[src]})` }, gR);
    rib.push({ el: p, i, j });
  }
  const center = svg('text', { x: cx, y: cy - 8, 'text-anchor': 'middle', class: 'chord-c1' }, root);
  const center2 = svg('text', { x: cx, y: cy + 12, 'text-anchor': 'middle', class: 'chord-c2' }, root);
  const center3 = svg('text', { x: cx, y: cy + 30, 'text-anchor': 'middle', class: 'chord-c2' }, root);
  const totalLinks = edges.reduce((s, e) => s + (ix.has(e.from) && ix.has(e.to) ? e.n : 0), 0);
  const idle = () => { center.textContent = `${totalLinks.toLocaleString('en')} links`; center2.textContent = 'between fields'; center3.textContent = 'hover to trace'; };
  const F = (i) => fields[i];
  const focus = (fi, fj) => {
    for (const r of rib) r.el.classList.toggle('dim', fi != null && !(fj == null ? r.i === fi || r.j === fi : (r.i === fi && r.j === fj) || (r.i === fj && r.j === fi)));
    for (const [i, el] of arcEls) el.classList.toggle('dim', fi != null && i !== fi && i !== fj && (fj != null || !pair(i, fi)));
  };
  const arcEls = new Map();
  for (const i of keep) {
    const [a0, a1] = arc.get(i);
    const el = svg('path', { d: arcD(a0, a1, R, R + ring), class: 'chord-arc', style: `fill:var(--f-${ids[i]})`, tabindex: 0, role: 'link', 'aria-label': F(i).title }, gA);
    arcEls.set(i, el);
    const inN = keep.reduce((s, j) => s + (j === i ? 0 : M[j][i]), 0), outN = keep.reduce((s, j) => s + (j === i ? 0 : M[i][j]), 0);
    const enter = () => { focus(i); center.textContent = F(i).short || F(i).title; center2.textContent = `uses ${inN.toLocaleString('en')} results from other fields`; center3.textContent = `supplies ${outN.toLocaleString('en')} to them`; };
    el.addEventListener('pointerenter', enter); el.addEventListener('focus', enter);
    el.addEventListener('pointerleave', () => { focus(null); idle(); }); el.addEventListener('blur', () => { focus(null); idle(); });
    el.addEventListener('click', () => onField?.(ids[i]));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') onField?.(ids[i]); });
    // label outside the ring, along the radius
    const am = (a0 + a1) / 2, [lx, ly] = P(am, R + ring + 8), right = Math.cos(am) >= 0;
    const deg = (am * 180) / Math.PI, rot = right ? deg : deg + 180;
    const t = svg('text', { x: lx, y: ly, transform: `rotate(${rot} ${lx} ${ly})`, 'text-anchor': right ? 'start' : 'end', 'dominant-baseline': 'middle', class: 'chord-lab', style: `fill:var(--f-${ids[i]})` }, gL);
    t.textContent = F(i).short || F(i).title;
    t.addEventListener('click', () => onField?.(ids[i]));
  }
  for (const r of rib) {
    const { i, j } = r;
    r.el.addEventListener('pointerenter', () => { focus(i, j); center.textContent = `${F(i).short} ↔ ${F(j).short}`; center2.textContent = `${F(j).short} uses ${M[i][j].toLocaleString('en')} from ${F(i).short}`; center3.textContent = `${F(i).short} uses ${M[j][i].toLocaleString('en')} from ${F(j).short}`; });
    r.el.addEventListener('pointerleave', () => { focus(null); idle(); });
  }
  idle();
  return { focus: (a, b) => focus(a == null ? null : ix.get(a), b == null ? null : ix.get(b)), M, ids };
}
