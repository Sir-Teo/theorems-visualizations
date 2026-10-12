// Dependency-graph views: theorem lineage, chapter graph, chapter flow, and the global map.
import { resolveColor, withAlpha, inlineHTML, richHTML, escapeHTML } from './viz/core.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, parent) => { const el = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v); if (parent) parent.append(el); return el; };
const BOOK_VAR = { pma: 'var(--c-pma)', rca: 'var(--c-rca)', fa: 'var(--c-fa)' };
const BOOK_SHORT = { pma: 'PMA', rca: 'RCA', fa: 'FA' };
export const kindAbbr = (k) => ({ Theorem: 'Thm', Lemma: 'Lem', Corollary: 'Cor', Proposition: 'Prop', Definition: 'Def' }[k] || k);
export function displayNum(it) {
  const m = it.num.match(/^(\d+\.\d+)([a-z])$/);
  if (m) return it.kind === 'Corollary' ? `${m[1]}${m[2]}` : it.num;
  return it.num;
}
export function fullLabel(it) {
  const m = it.num.match(/^(\d+\.\d+)([a-z])$/);
  if (m && it.kind === 'Corollary') return `Corollary to ${m[1]}`;
  if (it.b === 'rca' && it.c === 0) return `${it.kind} (Prologue ${it.num.slice(2)})`;
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
  const g = svg('g', { class: 'gnode', transform: `translate(${x},${y})`, tabindex: 0, role: 'link', 'aria-label': `${fullLabel(it)}: ${plainName(it.name, 80)}` }, parent);
  const col = BOOK_VAR[it.b];
  const isDef = it.kind === 'Definition';
  svg('rect', {
    x: 0, y: 0, width: w, height: h, rx: compact ? 7 : 9,
    fill: target ? col : 'var(--panel)', stroke: col, 'stroke-width': target ? 0 : 1.3,
    'stroke-dasharray': isDef ? '4 3' : null, opacity: external ? 0.9 : 1,
  }, g);
  const t1 = svg('text', { x: 10, y: compact ? h / 2 + 4 : 15, 'font-size': 10.5, 'font-family': 'var(--font-mono)', fill: target ? 'var(--bg)' : col, 'font-weight': 500 }, g);
  t1.textContent = `${external || it.b !== extra ? BOOK_SHORT[it.b] + ' ' : ''}${kindAbbr(it.kind)} ${displayNum(it)}`;
  if (!compact) {
    const t2 = svg('text', { x: 10, y: 30, 'font-size': 12, fill: target ? 'var(--bg)' : 'var(--ink)', 'font-weight': target ? 600 : 450 }, g);
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
    g.addEventListener('mouseenter', () => {
      for (const e of edgeEls) { const on = e.dataset.a === id || e.dataset.b === id; e.classList.toggle('hot', on); e.style.opacity = on ? 1 : 0.25; }
    });
    g.addEventListener('mouseleave', () => { for (const e of edgeEls) { e.classList.remove('hot'); e.style.opacity = ''; } });
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
    for (const p of G.byId.get(x).deps) if (!dist.has(p)) { dist.set(p, d + 1); queue.push(p); }
  }
  const anc = [...dist.keys()];
  const down = dependents ? (G.children.get(id) || []).filter((c) => !dist.has(c)) : [];
  const ids = [...anc, ...down];
  const set = new Set(ids);
  let edges = [];
  for (const x of ids) for (const p of G.byId.get(x).deps) if (set.has(p)) edges.push([p, x]);
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
  const root = svg('svg', { class: 'lineage-svg', width, height, viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `Dependency lineage of ${fullLabel(me)}` }, host);
  const X = (p) => 8 + p.col * (W + CG), Y = (p) => height / 2 + p.row * (H + RG) - H / 2;
  const eg = svg('g', { fill: 'none' }, root);
  const edgeEls = [];
  for (const [a, b] of edges) {
    const pa = pos.get(a), pb = pos.get(b);
    const A = G.byId.get(a), B = G.byId.get(b);
    const cross = A.b !== B.b;
    const e = svg('path', { d: edgePath(X(pa) + W, Y(pa) + H / 2, X(pb), Y(pb) + H / 2), stroke: cross ? BOOK_VAR[A.b] : 'var(--ink-3)', 'stroke-width': 1.4, 'stroke-dasharray': cross ? '5 4' : null, opacity: 0.75, class: 'gedge' }, eg);
    e.dataset.a = a; e.dataset.b = b; edgeEls.push(e);
  }
  const nodeEls = new Map();
  for (const x of ids) {
    const p = pos.get(x); const it = G.byId.get(x);
    nodeEls.set(x, nodeGroup(root, it, X(p), Y(p), W, H, { target: x === id, compact, extra: me.b, onClick: x === id ? null : onOpen }));
  }
  wireHover(root, nodeEls, edgeEls);
  // scroll so the target is visible
  requestAnimationFrame(() => { const p = pos.get(id); host.scrollLeft = Math.max(0, X(p) - host.clientWidth * 0.6); host.scrollTop = Math.max(0, Y(p) + H / 2 - host.clientHeight / 2); });
  return { count: ids.length, ancestors: anc.length - 1, dependents: down.length };
}

// ------------------------------------------------------------ chapter graph
export function renderChapterGraph(host, G, book, ch, { onOpen, onOpenChapter } = {}) {
  host.innerHTML = '';
  const items = G.items.filter((it) => it.b === book && it.c === ch);
  if (!items.length) return;
  const inCh = new Set(items.map((i) => i.id));
  // external prerequisites collapsed by chapter
  const ext = new Map();
  for (const it of items) for (const d of it.deps) if (!inCh.has(d)) {
    const D = G.byId.get(d); const k = `${D.b}/${D.c}`;
    if (!ext.has(k)) ext.set(k, { key: k, b: D.b, c: D.c, items: new Set(), targets: new Map() });
    const E = ext.get(k); E.items.add(d); E.targets.set(it.id, (E.targets.get(it.id) || 0) + 1);
  }
  const extNodes = [...ext.values()].sort((a, b) => G.bookIdx[a.b] - G.bookIdx[b.b] || a.c - b.c);
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
  const root = svg('svg', { class: 'lineage-svg', width, height, viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Chapter dependency graph' }, host);
  const Y = (p) => 10 + p.idx * (H + RG);
  const wOf = (x) => x.startsWith('ext:') ? EW : W;
  const eg = svg('g', { fill: 'none' }, root);
  const edgeEls = [];
  for (const [a, b] of edges) {
    const pa = pos.get(a), pb = pos.get(b);
    const isExt = a.startsWith('ext:'); const E = isExt ? ext.get(a.slice(4)) : null;
    const e = svg('path', { d: edgePath(colX(pa.col) + wOf(a), Y(pa) + H / 2, colX(pb.col), Y(pb) + H / 2), stroke: isExt ? BOOK_VAR[E.b] : 'var(--ink-3)', 'stroke-width': isExt ? 1 + Math.min(3, E.targets.get(b) - 1) * 0.6 : 1.4, 'stroke-dasharray': isExt ? '4 4' : null, opacity: isExt ? 0.55 : 0.8, class: 'gedge' }, eg);
    e.dataset.a = a; e.dataset.b = b; edgeEls.push(e);
  }
  const nodeEls = new Map();
  for (const E of extNodes) {
    const k = 'ext:' + E.key; const p = pos.get(k);
    const g = svg('g', { class: 'gnode', transform: `translate(${colX(p.col)},${Y(p)})`, tabindex: 0, role: 'link' }, root);
    svg('rect', { x: 0, y: 0, width: EW, height: H, rx: 9, fill: 'var(--panel-2)', stroke: BOOK_VAR[E.b], 'stroke-width': 1, 'stroke-dasharray': '3 3' }, g);
    const t1 = svg('text', { x: 10, y: 15, 'font-size': 10.5, 'font-family': 'var(--font-mono)', fill: BOOK_VAR[E.b], 'font-weight': 500 }, g);
    t1.textContent = `${BOOK_SHORT[E.b]} ch. ${E.c}`;
    const t2 = svg('text', { x: 10, y: 30, 'font-size': 11.5, fill: 'var(--ink-2)' }, g);
    t2.textContent = `${E.items.size} result${E.items.size > 1 ? 's' : ''} used`;
    const tip = svg('title', {}, g); tip.textContent = [...E.items].map((d) => `${G.byId.get(d).num} ${plainName(G.byId.get(d).name, 60)}`).join('\n');
    g.addEventListener('click', () => onOpenChapter?.(E.b, E.c));
    nodeEls.set(k, g);
  }
  for (const it of items) { const p = pos.get(it.id); nodeEls.set(it.id, nodeGroup(root, it, colX(p.col), Y(p), W, H, { onClick: onOpen, extra: book })); }
  wireHover(root, nodeEls, edgeEls);
}

// ------------------------------------------------------------ chapter flow (home / book pages)
/** Three columns of chapters (one per book); curves show how many results of one chapter are used in another. */
export function renderFlow(host, G, { books = ['pma', 'rca', 'fa'], onOpenChapter } = {}) {
  host.innerHTML = '';
  const cols = books.map((b) => G.books.find((B) => B.id === b)).filter(Boolean);
  const ROWH = 25, TOP = 44, colW = books.length === 1 ? 420 : 300, GAP = books.length === 1 ? 0 : 120;
  const width = cols.length * colW + (cols.length - 1) * GAP + 80;
  const rows = Math.max(...cols.map((B) => B.chapters.length));
  const height = TOP + rows * ROWH + 16;
  const root = svg('svg', { class: 'flow-svg', viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'How the chapters depend on one another' }, host);
  root.style.minWidth = Math.min(width, books.length === 1 ? 520 : 860) + 'px';
  const P = new Map();
  cols.forEach((B, ci) => {
    const x = 60 + ci * (colW + GAP);
    const head = svg('text', { x, y: 20, 'font-size': 12, 'font-weight': 600, fill: BOOK_VAR[B.id], 'letter-spacing': '0.08em' }, root);
    head.textContent = B.title.toUpperCase();
    B.chapters.forEach((C, ri) => P.set(`${B.id}/${C.n}`, { x, y: TOP + ri * ROWH, B, C }));
  });
  const maxN = Math.max(1, ...G.chapterEdges.map((e) => e.n));
  const eg = svg('g', { fill: 'none' }, root);
  const edgeEls = [];
  for (const e of G.chapterEdges) {
    const a = P.get(e.from), b = P.get(e.to); if (!a || !b) continue;
    let d;
    if (a.B === b.B) {
      const bend = 14 + Math.abs(b.y - a.y) * 0.32;
      d = `M${a.x - 12},${a.y} C${a.x - 12 - bend},${a.y} ${b.x - 12 - bend},${b.y} ${b.x - 12},${b.y}`;
    } else {
      const x1 = a.x + colW - 28, x2 = b.x - 12, mx = (x2 - x1) * 0.5;
      d = `M${x1},${a.y} C${x1 + mx},${a.y} ${x2 - mx},${b.y} ${x2},${b.y}`;
    }
    const p = svg('path', { d, stroke: BOOK_VAR[a.B.id], 'stroke-width': 0.8 + 4.2 * Math.sqrt(e.n / maxN), opacity: 0.22, 'stroke-linecap': 'round', class: 'fedge' }, eg);
    p.dataset.a = e.from; p.dataset.b = e.to;
    const t = svg('title', {}, p); t.textContent = `${e.n} result${e.n > 1 ? 's' : ''} from ${a.B.short} ch. ${a.C.n} used in ${b.B.short} ch. ${b.C.n}`;
    edgeEls.push(p);
  }
  const rowsG = svg('g', {}, root);
  for (const [k, p] of P) {
    const g = svg('g', { class: 'gnode', transform: `translate(${p.x},${p.y})`, tabindex: 0, role: 'link', 'aria-label': `${p.B.short} chapter ${p.C.n}: ${p.C.title}` }, rowsG);
    svg('rect', { x: -16, y: -11, width: colW - 4, height: 22, rx: 6, fill: 'transparent', class: 'hit' }, g);
    svg('circle', { cx: -12, cy: 0, r: 3.2 + Math.sqrt(p.C.count || 1) * 0.55, fill: BOOK_VAR[p.B.id] }, g);
    const n = svg('text', { x: 2, y: 4, 'font-size': 11, 'font-family': 'var(--font-mono)', fill: 'var(--ink-3)' }, g); n.textContent = String(p.C.n).padStart(2, ' ');
    const t = svg('text', { x: 24, y: 4.5, 'font-size': 13, fill: 'var(--ink)' }, g); t.textContent = p.C.title.length > 36 ? p.C.title.slice(0, 35) + '…' : p.C.title;
    const c = svg('text', { x: colW - 30, y: 4, 'font-size': 10.5, 'font-family': 'var(--font-mono)', fill: 'var(--ink-3)', 'text-anchor': 'end' }, g); c.textContent = p.C.count || '';
    g.addEventListener('mouseenter', () => { root.classList.add('focus'); for (const e of edgeEls) { const on = e.dataset.a === k || e.dataset.b === k; e.style.opacity = on ? 0.85 : 0.05; } });
    g.addEventListener('mouseleave', () => { root.classList.remove('focus'); for (const e of edgeEls) e.style.opacity = ''; });
    g.addEventListener('click', () => onOpenChapter?.(p.B.id, p.C.n));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter') onOpenChapter?.(p.B.id, p.C.n); });
  }
}

// ------------------------------------------------------------ global map (canvas)
export class MapView {
  constructor(host, G, { onOpen, focus } = {}) {
    this.host = host; this.G = G; this.onOpen = onOpen;
    host.classList.add('map-page');
    host.innerHTML = `
      <canvas aria-label="Map of all results and their dependencies"></canvas>
      <div class="map-ui">
        <div class="card"><span class="eyebrow">Show</span>
          <label><input type="checkbox" data-b="pma" checked> <span class="book-dot" data-book="pma"></span>PMA</label>
          <label><input type="checkbox" data-b="rca" checked> <span class="book-dot" data-book="rca"></span>RCA</label>
          <label><input type="checkbox" data-b="fa" checked> <span class="book-dot" data-book="fa"></span>FA</label>
          <label><input type="checkbox" data-defs checked> definitions</label>
        </div>
        <button class="btn" data-fit type="button">Fit</button>
      </div>
      <div class="map-tip"></div>
      <div class="map-side card"></div>
      <div class="map-legend card">
        <span><svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="var(--c-accent)" stroke-width="2.5"/></svg>builds on (ancestors)</span>
        <span><svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="var(--c-green)" stroke-width="2.5"/></svg>used by (descendants)</span>
        <span>node size ∝ results that depend on it</span>
      </div>
      <div class="map-help">scroll / pinch to zoom · drag to pan · click a node · double-click to open</div>`;
    this.canvas = host.querySelector('canvas'); this.ctx = this.canvas.getContext('2d');
    this.tip = host.querySelector('.map-tip'); this.side = host.querySelector('.map-side');
    this.show = { pma: true, rca: true, fa: true, defs: true };
    host.querySelectorAll('input[data-b]').forEach((cb) => cb.addEventListener('change', () => { this.show[cb.dataset.b] = cb.checked; this.draw(); }));
    host.querySelector('input[data-defs]').addEventListener('change', (e) => { this.show.defs = e.target.checked; this.draw(); });
    host.querySelector('[data-fit]').addEventListener('click', () => this.fit(true));
    this.k = 1; this.tx = 0; this.ty = 0; this.hover = null; this.sel = null;
    this.nodes = G.items.map((it) => ({ it, x: it.x, y: it.y, r: Math.min(8, 2.6 + Math.sqrt(it.desc || 0) * 0.4) }));
    this.byId = new Map(this.nodes.map((n) => [n.it.id, n]));
    this.edges = [];
    for (const n of this.nodes) for (const d of n.it.deps) { const m = this.byId.get(d); if (m) this.edges.push([m, n]); }
    this.top = this.nodes.slice().sort((a, b) => (b.it.desc || 0) - (a.it.desc || 0)).slice(0, 60);
    this._bind();
    this.ro = new ResizeObserver(() => { this.resize(); if (!this.userMoved && !this.sel) this.fit(false); else this.draw(); });
    this.ro.observe(host);
    this.resize(); this.fit(false);
    if (focus && this.byId.has(focus)) this.select(this.byId.get(focus), true);
    this.onTheme = () => this.draw(); window.addEventListener('themechange', this.onTheme);
  }
  destroy() { this.ro.disconnect(); window.removeEventListener('themechange', this.onTheme); cancelAnimationFrame(this.anim); }
  visible(n) { return this.show[n.it.b] && (this.show.defs || n.it.kind !== 'Definition'); }
  resize() {
    const r = this.host.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1);
    this.W = r.width; this.H = r.height; this.canvas.width = this.W * d; this.canvas.height = this.H * d;
    this.canvas.style.width = this.W + 'px'; this.canvas.style.height = this.H + 'px'; this.dpr = d;
  }
  bounds() {
    const xs = this.nodes.map((n) => n.x), ys = this.nodes.map((n) => n.y);
    return [Math.min(...xs) - 60, Math.min(...ys) - 80, Math.max(...xs) + 60, Math.max(...ys) + 40];
  }
  fit(animate) {
    const [x0, y0, x1, y1] = this.bounds();
    const k = Math.min(this.W / (x1 - x0), (this.H - 90) / (y1 - y0));
    this.flyTo(k, this.W / 2 - k * (x0 + x1) / 2, (this.H + 40) / 2 - k * (y0 + y1) / 2, animate);
  }
  flyTo(k, tx, ty, animate = true) {
    cancelAnimationFrame(this.anim);
    if (!animate) { this.k = k; this.tx = tx; this.ty = ty; this.draw(); return; }
    const s = { k: this.k, tx: this.tx, ty: this.ty }, t0 = performance.now(), D = 600;
    const step = (now) => { const u = Math.min(1, (now - t0) / D), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; this.k = s.k + (k - s.k) * e; this.tx = s.tx + (tx - s.tx) * e; this.ty = s.ty + (ty - s.ty) * e; this.draw(); if (u < 1) this.anim = requestAnimationFrame(step); };
    this.anim = requestAnimationFrame(step);
  }
  focusNode(n) { const k = Math.max(this.k, 1.6); this.flyTo(k, this.W / 2 - n.x * k - (this.side.classList.contains('open') && this.W > 700 ? 180 : 0), this.H / 2 - n.y * k); }
  sx(x) { return x * this.k + this.tx; } sy(y) { return y * this.k + this.ty; }
  hit(px, py) {
    let best = null, bd = 12;
    for (const n of this.nodes) { if (!this.visible(n)) continue; const d = Math.hypot(this.sx(n.x) - px, this.sy(n.y) - py) - Math.max(2, n.r * Math.min(1.4, this.k)); if (d < bd) { bd = d; best = n; } }
    return best;
  }
  closure(n) {
    const anc = new Set(), desc = new Set();
    const up = [n.it.id]; while (up.length) { const x = up.pop(); for (const d of this.G.byId.get(x).deps) if (!anc.has(d)) { anc.add(d); up.push(d); } }
    const dn = [n.it.id]; while (dn.length) { const x = dn.pop(); for (const c of this.G.children.get(x) || []) if (!desc.has(c)) { desc.add(c); dn.push(c); } }
    return { anc, desc };
  }
  select(n, fly) {
    this.sel = n; this.selClosure = n ? this.closure(n) : null;
    if (!n) { this.side.classList.remove('open'); this.draw(); return; }
    const it = n.it; const { anc, desc } = this.selClosure;
    this.side.innerHTML = `<div class="eyebrow" style="color:${BOOK_VAR[it.b]}">${BOOK_SHORT[it.b]} · ${escapeHTML(fullLabel(it))}</div>
      <div class="nm">${inlineHTML(it.name)}</div><div class="st">${richHTML(it.st)}</div>
      <div class="stats-row"><span><b>${it.deps.length}</b> direct prerequisites</span><span><b>${anc.size}</b> in its full ancestry</span><span><b>${desc.size}</b> results rely on it</span></div>
      <div style="display:flex;gap:8px;margin-top:14px"><a class="btn primary" href="#/t/${it.id}">Open theorem →</a><button class="btn" type="button" data-close>Close</button></div>`;
    this.side.querySelector('[data-close]').addEventListener('click', () => this.select(null));
    this.side.classList.add('open');
    if (fly) this.focusNode(n); else this.draw();
  }
  _bind() {
    const cv = this.canvas; const ptrs = new Map(); let drag = null, pinch = null, moved = false;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('wheel', (e) => {
      e.preventDefault(); cancelAnimationFrame(this.anim); this.userMoved = true;
      const [px, py] = pos(e); const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
      const k = Math.min(8, Math.max(0.05, this.k * f)); const r = k / this.k;
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
        const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const k = Math.min(8, Math.max(0.05, pinch.k * d / pinch.d)); const r = k / pinch.k;
        this.k = k; this.tx = pinch.c[0] - (pinch.c[0] - pinch.tx) * r; this.ty = pinch.c[1] - (pinch.c[1] - pinch.ty) * r; moved = true; this.draw(); return;
      }
      if (drag) { const dx = p[0] - drag.p[0], dy = p[1] - drag.p[1]; if (Math.hypot(dx, dy) > 3) { moved = true; this.userMoved = true; } this.tx = drag.tx + dx; this.ty = drag.ty + dy; this.draw(); return; }
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
    this._key = (e) => { if (e.key === 'Escape') this.select(null); };
    window.addEventListener('keydown', this._key);
  }
  _tip(n, p) {
    if (!n) { this.tip.style.display = 'none'; return; }
    const it = n.it;
    this.tip.innerHTML = `<div class="eyebrow" style="color:${BOOK_VAR[it.b]}">${BOOK_SHORT[it.b]} · ${escapeHTML(fullLabel(it))}</div><div class="nm">${inlineHTML(it.name)}</div><div class="st">${richHTML(it.st)}</div>`;
    this.tip.style.display = 'block';
    const w = this.tip.offsetWidth, h = this.tip.offsetHeight;
    let x = p[0] + 16, y = p[1] + 16; if (x + w > this.W - 8) x = p[0] - w - 16; if (y + h > this.H - 8) y = p[1] - h - 16;
    this.tip.style.left = x + 'px'; this.tip.style.top = y + 'px';
  }
  draw() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => { this._raf = 0; this._draw(); });
  }
  _draw() {
    const c = this.ctx, k = this.k; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, this.W, this.H);
    const col = { pma: resolveColor('pma'), rca: resolveColor('rca'), fa: resolveColor('fa') };
    const focus = this.hover || this.sel;
    const fc = focus ? (focus === this.sel ? this.selClosure : this.closure(focus)) : null;
    if (focus && focus !== this.sel) this._hc = fc;
    // chapter bands
    c.font = '600 11px Inter, system-ui, sans-serif';
    for (const B of this.G.books) {
      if (!this.show[B.id]) continue;
      B.chapters.forEach((C, i) => {
        const b = C.band; if (!b) return;
        const x0 = this.sx(b.x0), x1 = this.sx(b.x1), y0 = this.sy(b.y0), y1 = this.sy(b.y1);
        if (x1 < 0 || x0 > this.W || y1 < 0 || y0 > this.H) return;
        c.fillStyle = withAlpha(B.id, i % 2 ? 0.035 : 0.065); c.beginPath(); c.roundRect(x0, y0, x1 - x0, y1 - y0, 8 * Math.min(1, k)); c.fill();
        const wpx = x1 - x0;
        c.fillStyle = withAlpha(B.id, 0.9); c.textAlign = 'left'; c.textBaseline = 'top';
        const label = wpx > 150 ? `${C.n} · ${C.title}` : wpx > 60 ? `Ch ${C.n}` : `${C.n}`;
        c.save(); c.beginPath(); c.rect(x0, y0, wpx, 30); c.clip(); c.fillText(label, x0 + 6, y0 + 7); c.restore();
      });
      const rowY = Math.min(...B.chapters.filter((C) => C.band).map((C) => C.band.y0));
      const rowX = Math.min(...B.chapters.filter((C) => C.band).map((C) => C.band.x0));
      if (isFinite(rowY)) { c.font = `italic 500 ${Math.max(15, Math.min(30, 26 * k))}px Newsreader, serif`; c.fillStyle = withAlpha(B.id, 1); c.textAlign = 'left'; c.textBaseline = 'bottom'; c.fillText(B.title, this.sx(rowX) + 4, this.sy(rowY) - 6); c.font = '600 11px Inter, system-ui, sans-serif'; }
    }
    // edges
    const drawEdges = (list, style, width) => {
      c.beginPath();
      for (const [a, b] of list) {
        const x1 = this.sx(a.x), y1 = this.sy(a.y), x2 = this.sx(b.x), y2 = this.sy(b.y);
        if (Math.max(x1, x2) < -50 || Math.min(x1, x2) > this.W + 50 || Math.max(y1, y2) < -50 || Math.min(y1, y2) > this.H + 50) continue;
        const dx = Math.max(20 * k, Math.abs(x2 - x1) * 0.45);
        c.moveTo(x1, y1); c.bezierCurveTo(x1 + dx, y1, x2 - dx, y2, x2, y2);
      }
      c.strokeStyle = style; c.lineWidth = width; c.stroke();
    };
    const vis = this.edges.filter(([a, b]) => this.visible(a) && this.visible(b));
    if (!fc) {
      for (const B of ['pma', 'rca', 'fa']) drawEdges(vis.filter(([a]) => a.it.b === B), withAlpha(B, 0.16), Math.max(0.6, Math.min(1.3, k)));
    } else {
      drawEdges(vis, withAlpha('ink', 0.05), 0.7);
      const id = focus.it.id; const A = new Set([...fc.anc, id]), D = new Set([...fc.desc, id]);
      drawEdges(vis.filter(([a, b]) => A.has(a.it.id) && A.has(b.it.id)), withAlpha('accent', 0.55), Math.max(1, Math.min(2, k * 1.2)));
      drawEdges(vis.filter(([a, b]) => D.has(a.it.id) && D.has(b.it.id)), withAlpha('green', 0.55), Math.max(1, Math.min(2, k * 1.2)));
    }
    // nodes
    const rk = Math.max(0.55, Math.min(1.5, k));
    for (const n of this.nodes) {
      if (!this.visible(n)) continue;
      const x = this.sx(n.x), y = this.sy(n.y); if (x < -20 || x > this.W + 20 || y < -20 || y > this.H + 20) continue;
      let alpha = 1;
      if (fc && n !== focus && !fc.anc.has(n.it.id) && !fc.desc.has(n.it.id)) alpha = 0.14;
      const r = Math.max(1.6, n.r * rk);
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
      if (n.it.kind === 'Definition') { c.fillStyle = withAlpha('panel', alpha); c.fill(); c.lineWidth = 1.4; c.strokeStyle = withAlpha(n.it.b, alpha); c.stroke(); }
      else { c.fillStyle = withAlpha(n.it.b, alpha); c.fill(); }
      if (n === focus || n === this.sel) { c.beginPath(); c.arc(x, y, r + 4, 0, Math.PI * 2); c.lineWidth = 2; c.strokeStyle = resolveColor('ink'); c.stroke(); }
    }
    // labels
    const occupied = [];
    const free = (x, y, w, h) => { for (const o of occupied) if (x < o[0] + o[2] && x + w > o[0] && y < o[1] + o[3] && y + h > o[1]) return false; occupied.push([x, y, w, h]); return true; };
    c.textBaseline = 'middle'; c.textAlign = 'left';
    const label = (n, strong) => {
      if (!this.visible(n)) return;
      const x = this.sx(n.x), y = this.sy(n.y); if (x < -100 || x > this.W || y < 0 || y > this.H) return;
      const txt = `${n.it.num} ${plainName(n.it.name, strong ? 60 : 30)}`;
      c.font = `${strong ? 600 : 500} ${strong ? 12.5 : 11}px Inter, system-ui, sans-serif`;
      const w = c.measureText(txt).width; const r = Math.max(1.6, n.r * rk);
      if (!strong && !free(x + r + 3, y - 7, w + 4, 14)) return;
      c.lineWidth = 3.5; c.strokeStyle = withAlpha('bg', 0.9); c.strokeText(txt, x + r + 4, y);
      c.fillStyle = resolveColor(strong ? 'ink' : 'muted'); c.fillText(txt, x + r + 4, y);
    };
    if (focus) label(focus, true);
    if (this.sel && this.sel !== focus) label(this.sel, true);
    if (k >= 1.15) for (const n of this.nodes) { if (fc && n !== focus && !fc.anc.has(n.it.id) && !fc.desc.has(n.it.id)) continue; label(n, false); }
    else if (k >= 0.35) for (const n of this.top) { if (fc && !fc.anc.has(n.it.id) && !fc.desc.has(n.it.id)) continue; label(n, false); }
  }
}
