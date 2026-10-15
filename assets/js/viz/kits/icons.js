// Icons kit — icon arrays (natural frequencies, risk), waffles, split blocks (conditioning) and parliament hemicycles.
// Reference: docs/kits.md §7.
//
//   const I = v.icons(stage, { n: 1000, groups: [{ n: 9, color: 'red', label: 'cancer, test +' }, …], order: 'group' });
//   v.render(() => I.draw());
//   I.set({ block: (i) => (positive(i) ? 0 : 1), blockLabels: ['test +', 'test −'] }); // icons glide into two blocks
//
// Icon i belongs to the first group whose running count covers it (groups are consecutive runs of icons); the rest use
// spec.rest. spec.style(i) overrides that per icon. Positions are computed in pixels inside spec.region (data units,
// default the whole stage), so icons stay square on any stage. Every change of layout, order, blocks or n glides
// (spec.tween ms) unless the page is a still capture or the reader prefers reduced motion.
const FONT = (size, w = 500) => `${w} ${size}px Inter, system-ui, sans-serif`;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const stillish = () => (typeof window !== 'undefined' && window.__vizStill) || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
const LAYOUT_KEYS = ['n', 'groups', 'layout', 'cols', 'rows', 'fill', 'from', 'order', 'seed', 'block', 'blocks', 'blockLabels', 'blockWidths', 'region', 'margin', 'inner', 'maxCell'];
const same = (a, b) => (typeof a === 'function' || typeof b === 'function' ? a === b : a === b || JSON.stringify(a) === JSON.stringify(b));

/** Seats of a parliament hemicycle for n seats: rows of equal spacing between inner·R and R, seats per row proportional
 *  to the row radius. → [{x, y, r: row radius, a: angle}] in units of R, centre (0, 0), sorted left to right by angle
 *  (ties inner first), plus the seat spacing d. */
export function hemicycle(n, inner = 0.38) {
  if (n <= 0) return { seats: [], d: 1 };
  let rows = 1, caps, radii, d;
  for (; rows < 60; rows++) {
    d = (1 - inner) / rows; radii = []; caps = [];
    for (let j = 0; j < rows; j++) { const r = inner + d * (j + 0.5); radii.push(r); caps.push(Math.max(1, Math.floor((Math.PI * r) / d) + 1)); }
    if (caps.reduce((a, b) => a + b, 0) >= n) break;
  }
  // seats per row ∝ radius (largest remainder), never above the row's capacity
  const tot = radii.reduce((a, b) => a + b, 0), raw = radii.map((r) => (n * r) / tot), per = raw.map((x, j) => Math.min(caps[j], Math.floor(x)));
  let left = n - per.reduce((a, b) => a + b, 0);
  const byRem = raw.map((x, j) => [x - Math.floor(x), j]).sort((a, b) => b[0] - a[0]);
  while (left > 0) { let moved = false; for (const [, j] of byRem) { if (left > 0 && per[j] < caps[j]) { per[j]++; left--; moved = true; } } if (!moved) break; }
  const seats = [];
  for (let j = 0; j < rows; j++) for (let s = 0; s < per[j]; s++) {
    const a = per[j] === 1 ? Math.PI / 2 : Math.PI - (Math.PI * s) / (per[j] - 1);
    seats.push({ x: radii[j] * Math.cos(a), y: radii[j] * Math.sin(a), r: radii[j], a });
  }
  seats.sort((p, q) => q.a - p.a || p.r - q.r);
  return { seats, d };
}

/** Seeded Fisher–Yates permutation of 0..n−1. */
function shuffled(n, seed) {
  let s = (seed >>> 0) || 1; const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  const p = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  return p;
}

class Icons {
  constructor(api, rt, stage, spec = {}) {
    if (!stage || typeof stage.X !== 'function') throw new Error('v.icons(stage, spec): the first argument must be a 2D stage');
    this.api = api; this.rt = rt; this.s = stage;
    this.o = { layout: 'grid', shape: 'auto', order: 'index', fill: 'rows', from: 'top', gap: 0.18, margin: 8, inner: 0.38, tween: 650, hover: true, seed: 1, maxCell: 46, rest: { color: 'muted', alpha: 0.35 }, ...spec };
    this._ver = 0; this._sig = ''; this._cur = null; this._from = null; this._t0 = 0; this._hover = -1;
    this._bind();
  }
  // ------------------------------------------------------------------ spec
  /** Change spec keys; layout changes glide from the current positions. Cheap to call every frame inside v.render:
   *  values are compared by content and a re-layout that lands every icon where it already was is not a change. */
  set(spec) {
    let lay = false, any = false;
    for (const k of Object.keys(spec)) if (!same(spec[k], this.o[k])) { any = true; if (LAYOUT_KEYS.includes(k)) lay = true; }
    Object.assign(this.o, spec); if (lay) this._ver++; if (any && !this.rt._inFrame) this.rt.invalidate(); return this;
  }
  get n() { const o = this.o; return o.n ?? (o.groups ? o.groups.reduce((a, g) => a + (g.n || 0), 0) : 100); }
  /** Group index of icon i (−1 = rest). */
  groupOf(i) { const G = this.o.groups || []; let c = 0; for (let k = 0; k < G.length; k++) { c += G[k].n || 0; if (i < c) return k; } return -1; }
  /** Style of icon i: {color, alpha, hollow, ring, mark, label} or null (not drawn). */
  styleOf(i) {
    if (this.o.style) { const st = this.o.style(i); if (st !== undefined) return st; }
    const k = this.groupOf(i); return k >= 0 ? this.o.groups[k] : this.o.rest;
  }
  /** Counts per group (and rest) → [{label, color, n}] */
  counts() {
    const G = this.o.groups || [], out = G.map((g) => ({ label: g.label, color: g.color, n: g.n || 0 }));
    const rest = this.n - out.reduce((a, g) => a + g.n, 0); if (rest > 0) out.push({ label: this.o.rest.label, color: this.o.rest.color, n: rest, rest: true });
    return out;
  }
  /** Put the groups (with their counts) in the panel legend. o.rest: include the rest (default when it has a label). */
  legend(o = {}) {
    const N = this.n, fmt = o.format || ((c) => `${c.label} (${c.n.toLocaleString('en-US')}${o.percent ? ` = ${((100 * c.n) / N).toFixed(o.digits ?? 1)}%` : ''})`);
    this.api.legend(this.counts().filter((c) => c.label && (!c.rest || o.rest !== false)).map((c) => ({ color: c.color, label: fmt(c), dot: true })));
    return this;
  }
  // ------------------------------------------------------------------ layout
  _region() {
    const s = this.s, R = this.o.region, m = this.o.margin;
    const l = R ? s.X(R[0]) : 0, r = R ? s.X(R[2]) : s.W, t = R ? s.Y(R[3]) : 0, b = R ? s.Y(R[1]) : s.H;
    return { l: l + m, r: r - m, t: t + m, b: b - m };
  }
  _orderKeys(n) {
    const o = this.o, ord = o.order;
    if (Array.isArray(ord)) return (i) => ord[i] ?? i;
    if (ord === 'group') return (i) => { const g = this.groupOf(i); return (g < 0 ? 1e6 : g) * 1e7 + i; };
    if (ord === 'shuffle') { const p = shuffled(n, o.seed); const inv = new Array(n); p.forEach((v, k) => { inv[v] = k; }); return (i) => inv[i]; }
    if (typeof ord === 'function') return ord;
    return (i) => i;
  }
  /** Target positions in px: {pos: Float64Array(2n), cell, blocks: [{x0, x1, y0, y1, label}]} */
  _layout() {
    const o = this.o, n = this.n, R = this._region(), W = Math.max(10, R.r - R.l), H = Math.max(10, R.b - R.t);
    const key = this._orderKeys(n), pos = new Float64Array(2 * n);
    if (o.layout === 'hemicycle') {
      const { seats, d } = hemicycle(n, o.inner), Rpx = Math.min(W / (2 + d), H / (1 + d)), cx = (R.l + R.r) / 2;
      const base = R.t + (H - Rpx * (1 + d)) / 2 + Rpx * (1 + d / 2), idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => key(a) - key(b));
      idx.forEach((i, k) => { const st = seats[k]; pos[2 * i] = cx + st.x * Rpx; pos[2 * i + 1] = base - st.y * Rpx; });
      return { pos, cell: d * Rpx, blocks: [], center: [cx, base], R: Rpx };
    }
    // grid (optionally split into blocks side by side)
    const nb = o.blocks ?? (o.block ? 1 + Math.max(0, ...Array.from({ length: n }, (_, i) => o.block(i) ?? 0)) : 1);
    const members = Array.from({ length: nb }, () => []);
    for (let i = 0; i < n; i++) { const b = o.block ? o.block(i) : 0; if (b == null || b < 0) continue; members[Math.min(nb - 1, b)].push(i); }
    for (const m of members) m.sort((a, b) => key(a) - key(b));
    const labH = o.blockLabels ? 26 : 0, gapX = nb > 1 ? Math.max(14, W * 0.04) : 0;
    // block widths: proportional to √count by default so big blocks get more room, o.blockWidths to override
    const wts = o.blockWidths || members.map((m) => Math.sqrt(Math.max(1, m.length))), wt = wts.reduce((a, b) => a + b, 0);
    const bw = wts.map((w) => ((W - gapX * (nb - 1)) * w) / wt), Hb = H - labH;
    const fits = (c) => members.every((m, b) => { const cols = o.cols || Math.max(1, Math.floor(bw[b] / c)); return Math.ceil(m.length / cols) * c <= Hb + 1e-6 && cols * c <= bw[b] + 1e-6; });
    let cell;
    if (o.cols) cell = Math.min(...members.map((m, b) => Math.min(bw[b] / o.cols, Hb / Math.max(1, o.rows || Math.ceil(m.length / o.cols)))));
    else { let lo = 0.5, hi = Math.min(o.maxCell, Hb, ...bw); if (fits(hi)) lo = hi; else for (let it = 0; it < 40; it++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; } cell = lo; }
    cell = Math.min(cell, o.maxCell);
    const blocks = []; let x = R.l;
    members.forEach((m, b) => {
      const cols = o.cols || Math.max(1, Math.floor(bw[b] / cell + 1e-9)), rows = o.rows || Math.max(1, Math.ceil(m.length / cols));
      const gw = cols * cell, gh = rows * cell, x0 = x + (bw[b] - gw) / 2, y0 = R.t + labH + (nb > 1 ? 0 : (Hb - gh) / 2);
      m.forEach((i, k) => {
        let c, r; if (o.fill === 'columns') { c = Math.floor(k / rows); r = k % rows; } else { r = Math.floor(k / cols); c = k % cols; }
        if (o.from === 'bottom') r = rows - 1 - r;
        pos[2 * i] = x0 + (c + 0.5) * cell; pos[2 * i + 1] = y0 + (r + 0.5) * cell;
      });
      const usedRows = Math.max(1, o.fill === 'columns' ? Math.min(rows, m.length) : Math.ceil(m.length / cols));
      blocks.push({ x0, x1: x0 + gw, y0, y1: y0 + (o.from === 'bottom' ? gh : usedRows * cell), xc: x + bw[b] / 2, label: o.blockLabels ? (typeof o.blockLabels === 'function' ? o.blockLabels(b, m.length) : o.blockLabels[b]) : null, n: m.length, members: m });
      x += bw[b] + gapX;
    });
    // icons in no block sit where they were (or at the region centre) and are hidden
    const hidden = new Uint8Array(n); if (o.block) for (let i = 0; i < n; i++) { const b = o.block(i); if (b == null || b < 0) { hidden[i] = 1; pos[2 * i] = (R.l + R.r) / 2; pos[2 * i + 1] = (R.t + R.b) / 2; } }
    return { pos, cell, blocks, hidden };
  }
  _ensure() {
    const s = this.s, sig = `${s.W}x${s.H}|${this._ver}|${this.n}|${JSON.stringify(this.o.region || null)}`;
    if (sig === this._sig) return;
    const L = this._layout(), resized = this._sig && this._sig.split('|')[0] !== sig.split('|')[0];
    if (this._cur && !resized && L.pos.length === this._cur.pos.length && L.pos.every((x, i) => Math.abs(x - this._cur.pos[i]) < 0.01) && (L.hidden || []).every((h, i) => h === (this._cur.hidden?.[i] ?? 0))) {
      this._cur = L; this._sig = sig; return; // nothing moved: keep any glide in progress
    }
    if (this._cur && !resized && this.o.tween > 0 && !stillish()) {
      const n = this.n, from = new Float64Array(2 * n), cp = this._shown();
      for (let i = 0; i < 2 * n; i++) from[i] = i < cp.length ? cp[i] : L.pos[i];
      this._from = from; this._t0 = performance.now();
    } else this._from = null;
    this._cur = L; this._sig = sig;
  }
  /** Currently displayed px positions (mid-glide aware). */
  _shown() {
    const L = this._cur; if (!this._from) return L.pos;
    const u = Math.min(1, (performance.now() - this._t0) / this.o.tween), e = ease(u), p = new Float64Array(L.pos.length);
    for (let i = 0; i < p.length; i++) p[i] = this._from[i] + (L.pos[i] - this._from[i]) * e;
    if (u >= 1) this._from = null; else this.rt.invalidate();
    return p;
  }
  // ------------------------------------------------------------------ geometry for content
  /** Centre of icon i in data units. */
  pos(i) { this._ensure(); const p = this._cur.pos; return [this.s.invX(p[2 * i]), this.s.invY(p[2 * i + 1])]; }
  /** Icon cell size in px. */
  get cell() { this._ensure(); return this._cur.cell; }
  /** Blocks of the grid layout in data units: [{x0, y0, x1, y1, n, label, members}]. */
  blocks() { this._ensure(); const s = this.s; return this._cur.blocks.map((b) => ({ ...b, x0: s.invX(b.x0), x1: s.invX(b.x1), y0: s.invY(b.y1), y1: s.invY(b.y0) })); }
  /** Bounding box [x0, y0, x1, y1] (data units) of the icons satisfying pred(i), or of group k when pred is a number. */
  bbox(pred) {
    this._ensure(); const f = typeof pred === 'number' ? (i) => this.groupOf(i) === pred : pred, p = this._cur.pos, h = this._cur.cell / 2;
    let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
    for (let i = 0; i < this.n; i++) { if (!f(i) || this._cur.hidden?.[i]) continue; a = Math.min(a, p[2 * i] - h); c = Math.max(c, p[2 * i] + h); b = Math.min(b, p[2 * i + 1] - h); d = Math.max(d, p[2 * i + 1] + h); }
    if (a === Infinity) return null; const s = this.s; return [s.invX(a), s.invY(d), s.invX(c), s.invY(b)];
  }
  /** Icon under a data-space point (or −1). */
  hit(x, y) { return this._hitPx(this.s.X(x), this.s.Y(y)); }
  _hitPx(X, Y) {
    if (!this._cur) return -1; const p = this._cur.pos, r = this._cur.cell * 0.6; let best = -1, bd = r * r;
    for (let i = 0; i < this.n; i++) { if (this._cur.hidden?.[i]) continue; const dx = p[2 * i] - X, dy = p[2 * i + 1] - Y, d2 = dx * dx + dy * dy; if (d2 < bd) { bd = d2; best = i; } }
    return best;
  }
  _bind() {
    const s = this.s, cv = s.canvas; if (!cv) return;
    const at = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointermove', (e) => { if (!this.o.hover && !this.o.onClick) return; const [X, Y] = at(e), h = this._hitPx(X, Y); if (h !== this._hover) { this._hover = h; this.rt.invalidate(); } });
    cv.addEventListener('pointerleave', () => { if (this._hover >= 0) { this._hover = -1; this.rt.invalidate(); } });
    cv.addEventListener('click', (e) => { if (!this.o.onClick) return; const [X, Y] = at(e), i = this._hitPx(X, Y); if (i >= 0 && this.o.onClick(i, { group: this.groupOf(i), style: this.styleOf(i) }) !== false) this.rt.invalidate(); });
  }
  // ------------------------------------------------------------------ drawing
  _glyph(path, shape, X, Y, c) {
    if (shape === 'dot') { path.moveTo(X + c * 0.42, Y); path.arc(X, Y, c * 0.42, 0, 2 * Math.PI); return; }
    if (shape === 'square') { const h = c * 0.44; if (path.roundRect) path.roundRect(X - h, Y - h, 2 * h, 2 * h, c * 0.12); else path.rect(X - h, Y - h, 2 * h, 2 * h); return; }
    // person: head + shoulders/body pictogram in a c × c cell
    const hr = c * 0.17, hy = Y - c * 0.27, w = c * 0.27, top = Y - c * 0.04, bot = Y + c * 0.47, sh = c * 0.13;
    path.moveTo(X + hr, hy); path.arc(X, hy, hr, 0, 2 * Math.PI);
    path.moveTo(X - w, bot); path.lineTo(X - w, top + sh); path.quadraticCurveTo(X - w, top, X - w + sh, top);
    path.lineTo(X + w - sh, top); path.quadraticCurveTo(X + w, top, X + w, top + sh); path.lineTo(X + w, bot); path.closePath();
  }
  /** Draw the icons. over: {dim: pred(i) → dims icons, highlight: pred(i) → rings, label: false hides block labels}. */
  draw(over = {}) {
    this._ensure();
    const o = this.o, s = this.s, c = s.ctx, n = this.n, L = this._cur, P = this._shown(), g = L.cell * (1 - o.gap);
    const shape = o.shape === 'auto' ? (L.cell >= 13 && o.layout !== 'hemicycle' ? 'person' : 'dot') : o.shape;
    const hovG = o.hover && this._hover >= 0 ? this.groupOf(this._hover) : null, hovSt = this._hover >= 0 ? this.styleOf(this._hover) : null;
    const batches = new Map(), rings = [], marks = [];
    for (let i = 0; i < n; i++) {
      if (L.hidden?.[i] && !this._from) continue;
      const st = this.styleOf(i); if (!st) continue;
      let a = st.alpha ?? 1;
      if (over.dim && over.dim(i)) a *= 0.22;
      if (hovSt && o.hover === true && (o.style ? st.label !== hovSt.label : this.groupOf(i) !== hovG)) a *= 0.45;
      const k = `${st.color}|${a.toFixed(3)}|${st.hollow ? 1 : 0}|${st.shape || ''}`;
      if (!batches.has(k)) batches.set(k, { st, a, path: new Path2D() });
      this._glyph(batches.get(k).path, st.shape || shape, P[2 * i], P[2 * i + 1], g);
      if (st.ring || (over.highlight && over.highlight(i))) rings.push([P[2 * i], P[2 * i + 1], st.ring || over.ringColor || 'ink']);
      if (st.mark) marks.push([P[2 * i], P[2 * i + 1], st.markColor || 'ink']);
    }
    c.save();
    for (const { st, a, path } of batches.values()) {
      if (st.hollow) { c.strokeStyle = this.api.color(st.color, a); c.lineWidth = Math.max(1, L.cell * 0.07); c.stroke(path); }
      else { c.fillStyle = this.api.color(st.color, a); c.fill(path); }
    }
    for (const [X, Y, col] of rings) { c.beginPath(); c.arc(X, Y, L.cell * 0.52, 0, 2 * Math.PI); c.strokeStyle = this.api.color(col, 0.9); c.lineWidth = Math.max(1.2, L.cell * 0.07); c.stroke(); }
    for (const [X, Y, col] of marks) { const h = L.cell * 0.3; c.beginPath(); c.moveTo(X - h, Y - h); c.lineTo(X + h, Y + h); c.moveTo(X + h, Y - h); c.lineTo(X - h, Y + h); c.strokeStyle = this.api.color(col, 0.9); c.lineWidth = Math.max(1.2, L.cell * 0.09); c.lineCap = 'round'; c.stroke(); }
    c.restore();
    if (over.label !== false) for (const b of L.blocks) if (b.label) s.textPx(String(b.label), b.xc, b.y0 - 10, { align: 'center', baseline: 'bottom', size: 12.5, color: 'ink', weight: 600 });
    // hover tooltip: the icon's label and how many share it
    if (o.hover && this._hover >= 0 && hovSt && hovSt.label) {
      const same = o.style ? Array.from({ length: n }, (_, i) => i).filter((i) => this.styleOf(i)?.label === hovSt.label).length : (hovG >= 0 ? o.groups[hovG].n : this.counts().find((q) => q.rest)?.n ?? 0);
      const str = `${hovSt.label} · ${same.toLocaleString('en-US')} of ${n.toLocaleString('en-US')}`, X = P[2 * this._hover], Y = P[2 * this._hover + 1] - L.cell * 0.7;
      const w = (c.font = FONT(12), c.measureText(str).width), XX = Math.min(s.W - w / 2 - 8, Math.max(w / 2 + 8, X));
      s.textPx(str, XX, Math.max(14, Y), { align: 'center', baseline: 'bottom', size: 12, plate: true });
    }
    return this;
  }
}

export default function icons(api, rt, stage, spec) { return new Icons(api, rt, stage, spec); }
/** v.hemicycle(n, inner) → seat positions (DOM-free). */
export function seats(api, rt, n, inner) { return hemicycle(n, inner); }
