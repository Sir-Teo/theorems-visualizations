// Timeline kit — time axes for history and deep time. Reference: docs/kits-world.md.
//
//   const T = v.timeline(stage, { scale: 'log', range: ['13.8 Ga', '10 yr'], events, spans, links, cursor: '66 Ma' });
//   v.render(() => T.draw());
//
// Times are years CE (negative = BCE), or strings: '3.5 Ga', '66 Ma', '12 ka', '10,000 BCE', '1450 CE', '1450', 'now',
// or {ago: n}. "Ago" is measured from spec.present (default 2025). Scales: 'linear' (zoom/pan by wheel and drag),
// 'log' (years ago on a log axis, old on the left), 'broken' (linear pieces with gaps: spec.segments).
// Events = dots with labels stacked in lanes above the axis by a greedy (priority, then time) lane algorithm that never
// overlaps labels — labels that do not fit are hidden and shown on hover. Spans = bars in tracks below the axis
// (eras, reigns, lifetimes). Links = dependency arcs between events. A draggable "now" cursor reports spansAt().
// DOM-free helpers (parseTime, fmtYear, fmtAgo, ticks, lanes, GEOLOGIC) are exported and reachable as v.timelines(name, ...).

export const PRESENT = 2025;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const FONT = (size, w = 500) => `${w} ${size}px Inter, system-ui, sans-serif`;
const COLS = ['blue', 'orange', 'teal', 'purple', 'pink', 'green', 'gold', 'red'];
const isEvent = (x) => !!x && x.year !== undefined && x.y0 === undefined;
const num = (s) => parseFloat(String(s).replace(/[,   _]/g, ''));

// ------------------------------------------------------------------ parsing and formatting (DOM-free)
/** Any time spec → year CE (negative = BCE). */
export function parseTime(t, present = PRESENT) {
  if (t == null) return NaN;
  if (typeof t === 'number') return t;
  if (typeof t === 'object') return t.ago != null ? present - t.ago : t.year ?? NaN;
  const s = String(t).trim(); let m;
  if (/^(now|present|today)$/i.test(s)) return present;
  if ((m = s.match(/^([\d.,   ]+)\s*(Ga|Gya|Gyr|Byr|Ma|Mya|Myr|ka|kya|kyr)(\s+ago)?$/i))) { const k = { g: 1e9, b: 1e9, m: 1e6, k: 1e3 }[m[2][0].toLowerCase()]; return present - num(m[1]) * k; }
  if ((m = s.match(/^([\d.,   ]+)\s*(years?|yrs?|yr|y)\s*(ago)?$/i))) return present - num(m[1]);
  if ((m = s.match(/^([\d.,   ]+)\s*BP$/i))) return 1950 - num(m[1]);
  if ((m = s.match(/^([\d.,   ]+)\s*(BCE|BC)$/i))) return -num(m[1]);
  if ((m = s.match(/^(?:AD\s*)?([\d.,   ]+)\s*(CE|AD)?$/i))) return num(m[1]);
  if ((m = s.match(/^[-−]\s*([\d.,]+)$/))) return -num(m[1]);
  return NaN;
}
const trim = (x) => {
  const a = Math.abs(x), d = a >= 100 ? 1 : a >= 10 ? 1 : a >= 1 ? 2 : 3;
  return (+x.toFixed(d)).toString();
};
/** Years before present → '13.8 Ga', '66 Ma', '300 ka', '850 yr ago', 'now'. o.short drops ' ago'. */
export function fmtAgo(ago, o = {}) {
  const a = Math.abs(ago);
  if (a < 0.5) return 'now';
  if (a >= 1e9 * 0.9995) return `${trim(ago / 1e9)} Ga`;
  if (a >= 1e6 * 0.9995) return `${trim(ago / 1e6)} Ma`;
  if (a >= 1e3 * (o.ka ?? 100) * 0.9995) return `${trim(ago / 1e3)} ka`; // o.ka: switch to ka from this many thousand years
  return `${Math.round(a).toLocaleString('en-US')} yr${o.short ? '' : ago < 0 ? ' ahead' : ' ago'}`;
}
/** Year CE → '3.5 Ga', '66 Ma', '300 ka' (deep time: ≥ 100 ka ago), else '10,000 BCE', '1450 CE' (o.era: true | false | 'auto' = CE only when needed). */
export function fmtYear(year, o = {}) {
  const present = o.present ?? PRESENT, ago = present - year;
  if (ago >= 1e5 * 0.9995) return fmtAgo(ago);
  const y = Math.round(year), g = (n) => (n >= 10000 ? n.toLocaleString('en-US') : String(n));
  if (y < 0) return `${g(-y)} BCE`;
  if (y === 0) return o.era === false ? '0' : '1 BCE';
  return o.era === false ? g(y) : o.era === true || o.era == null ? `${g(y)} CE` : g(y);
}
function niceStep(span, n) { const raw = span / Math.max(1, n), p = 10 ** Math.floor(Math.log10(raw)), m = raw / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
/** Linear ticks for years [y0, y1] over px pixels → [[year, label], …]; deep spans tick in ka/Ma/Ga from the present. */
export function linearTicks(y0, y1, px, present = PRESENT, target = 92) {
  const span = y1 - y0, out = []; if (!(span > 0)) return out;
  const step = niceStep(span, px / target), deep = present - y0 >= 2e5 && span >= 2e4;
  if (deep) { const a0 = present - y1, a1 = present - y0; for (let a = Math.ceil(a0 / step) * step; a <= a1 + step * 1e-9; a += step) out.push([present - a, fmtAgo(Math.abs(a) < step * 1e-6 ? 0 : a, { short: true, ka: step >= 1000 ? 1 : 100 })]); }
  else { const bce = y0 < 0; for (let y = Math.ceil(y0 / step) * step; y <= y1 + step * 1e-9; y += step) { const r = Math.round(y); out.push([y, r < 0 ? `${(-r >= 10000 ? (-r).toLocaleString('en-US') : -r)} BCE` : r === 0 ? (bce ? '1 CE' : '0') : bce ? `${r} CE` : String(r)]); } }
  return out;
}
/** Log ticks over years-ago [a0, a1] (a0 < a1) → [[ago, label|null], …]; null = minor tick. */
export function logTicks(a0, a1, pxPerDecade = 100) {
  const out = [], k0 = Math.floor(Math.log10(a0)), k1 = Math.ceil(Math.log10(a1));
  for (let k = k0; k <= k1; k++) for (const m of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    const a = m * 10 ** k; if (a < a0 * 0.999 || a > a1 * 1.001) continue;
    const lab = m === 1 || (pxPerDecade > 260 && (m === 2 || m === 5)) || (pxPerDecade > 600) ? fmtAgo(a, { short: true, ka: 1 }) : null;
    out.push([a, lab]);
  }
  return out;
}
/** Greedy lanes: boxes [{x0, x1, priority}] → lane index per box (−1 = no room), never overlapping (gap px). */
export function lanes(boxes, maxLanes = 6, gap = 6) {
  const order = boxes.map((b, i) => i).sort((i, j) => (boxes[j].priority || 0) - (boxes[i].priority || 0) || boxes[i].x0 - boxes[j].x0);
  const used = Array.from({ length: maxLanes }, () => []), out = new Array(boxes.length).fill(-1);
  for (const i of order) { const b = boxes[i]; for (let L = 0; L < maxLanes; L++) if (used[L].every(([a, c]) => b.x1 + gap <= a || b.x0 >= c + gap)) { used[L].push([b.x0, b.x1]); out[i] = L; break; } }
  return out;
}
// International Chronostratigraphic Chart (ICS v2024/12, stratigraphy.org), Ma. Rows: eons, eras, periods (Phanerozoic).
const ICS = {
  eon: [['Hadean', 4567, 4031], ['Archean', 4031, 2500], ['Proterozoic', 2500, 538.8], ['Phanerozoic', 538.8, 0]],
  era: [['Eoarchean', 4031, 3600], ['Paleoarchean', 3600, 3200], ['Mesoarchean', 3200, 2800], ['Neoarchean', 2800, 2500], ['Paleoproterozoic', 2500, 1600], ['Mesoproterozoic', 1600, 1000], ['Neoproterozoic', 1000, 538.8], ['Paleozoic', 538.8, 251.902], ['Mesozoic', 251.902, 66], ['Cenozoic', 66, 0]],
  period: [['Cambrian', 538.8, 486.85], ['Ordovician', 486.85, 443.1], ['Silurian', 443.1, 419.62], ['Devonian', 419.62, 358.86], ['Carboniferous', 358.86, 298.9], ['Permian', 298.9, 251.902], ['Triassic', 251.902, 201.4], ['Jurassic', 201.4, 143.1], ['Cretaceous', 143.1, 66], ['Paleogene', 66, 23.04], ['Neogene', 23.04, 2.58], ['Quaternary', 2.58, 0]],
};
const ICSCOL = { Hadean: 'pink', Archean: 'red', Proterozoic: 'orange', Phanerozoic: 'blue', Paleozoic: 'teal', Mesozoic: 'green', Cenozoic: 'gold' };
/** Geologic time scale as spans: GEOLOGIC(levels = ['eon', 'era', 'period']) → [{from, to, label, track, color}] (track = row). */
export function GEOLOGIC(levels = ['eon', 'era', 'period'], present = PRESENT) {
  const out = [];
  levels.forEach((lv, track) => ICS[lv].forEach(([label, a, b], i) => out.push({ label, from: present - a * 1e6, to: present - b * 1e6, track, color: ICSCOL[label] || COLS[(i + track * 3) % COLS.length], level: lv })));
  return out;
}

// ================================================================== the kit
class Timeline {
  constructor(api, rt, stage, spec = {}) {
    if (!stage || typeof stage.X !== 'function') throw new Error('v.timeline(stage, spec): the first argument must be a 2D stage');
    this.api = api; this.rt = rt; this.s = stage; stage.o.axes = false; stage.o.grid = false; stage.o.hover = true;
    this.o = { scale: 'linear', present: PRESENT, laneHeight: 17, trackHeight: 17, fontSize: 12, zoom: true, margin: 16, ...spec };
    this.present = this.o.present;
    this.set(spec);
    this.setScale(this.o.scale);
    this.cursor = spec.cursor != null && spec.cursor !== false ? this.parse(spec.cursor === true ? 'now' : spec.cursor) : null;
    this.selected = null; this.onSelect = spec.onSelect || null; this.onCursor = spec.onCursor || null;
    this._hit = []; this._bind();
  }
  parse(t) { return parseTime(t, this.present); }
  /** Switch between 'linear', 'log' and 'broken' (resets the zoom to spec.range). */
  setScale(scale) {
    this.o.scale = scale; const r = this.o.range ? this.o.range.map((t) => this.parse(t)) : this._autoRange();
    if (scale === 'log') { const a = r.map((y) => Math.max(this.o.minAgo ?? 1, this.present - y)); this.full = [Math.log10(Math.max(...a)), Math.log10(Math.min(...a))]; }
    else if (scale === 'broken') this.full = null;
    else this.full = [Math.min(...r), Math.max(...r)];
    this.view = this.full && this.full.slice(); this.rt.invalidate(); return this;
  }
  get scale() { return this.o.scale; }
  fmt(year, o) { return fmtYear(year, { present: this.present, ...o }); }
  /** Replace data: {events, spans, links}. Events: {t | year | ago, label, id, color, priority, note}; spans: {from, to, label, color, track}; links: [fromId, toId] or {from, to}. */
  set({ events, spans, links } = {}) {
    if (events) this.events = events.map((e, i) => ({ id: e.id ?? String(i), ...e, year: this.parse(e.year ?? e.t ?? (e.ago != null ? { ago: e.ago } : e.when)) }));
    if (spans) this.spans = spans.map((s, i) => ({ ...s, y0: this.parse(s.from), y1: this.parse(s.to), color: s.color || COLS[i % COLS.length] }));
    if (links) this.links = links.map((l) => (Array.isArray(l) ? { from: l[0], to: l[1] } : l));
    this.events ||= []; this.spans ||= []; this.links ||= [];
    return this;
  }
  _autoRange() { const ys = [...this.events.map((e) => e.year), ...this.spans.flatMap((s) => [s.y0, s.y1])].filter(isFinite); if (!ys.length) return [0, this.present]; const a = Math.min(...ys), b = Math.max(...ys), pad = (b - a) * 0.04 || 1; return [a - pad, b + pad]; }
  event(id) { return this.events.find((e) => String(e.id) === String(id)) || null; }
  // ---------------------------------------------------------------- mapping
  get L() { return this.o.margin; }
  get R() { return this.s.width - this.o.margin; }
  _segs() { // broken axis: pixel extents of each segment
    const S = (this.o.segments || []).map((g) => ({ y0: this.parse(g.from ?? g[0]), y1: this.parse(g.to ?? g[1]), w: g.weight ?? g[2] ?? 1 }));
    const gap = 18, tot = S.reduce((a, g) => a + g.w, 0), W = this.R - this.L - gap * (S.length - 1); let x = this.L;
    for (const g of S) { g.x0 = x; g.x1 = x + (W * g.w) / tot; x = g.x1 + gap; }
    return S;
  }
  /** Year → pixel x (NaN-safe; log axes clamp at spec.minAgo). */
  px(year) {
    const { L, R } = this;
    if (this.o.scale === 'log') { const u = Math.log10(Math.max(this.o.minAgo ?? 1, this.present - year)), [u0, u1] = this.view; return L + ((u0 - u) / (u0 - u1)) * (R - L); }
    if (this.o.scale === 'broken') {
      const S = this._segs(); if (!S.length) return L;
      for (const g of S) if (year >= g.y0 && year <= g.y1) return g.x0 + ((year - g.y0) / (g.y1 - g.y0)) * (g.x1 - g.x0);
      for (let i = 0; i + 1 < S.length; i++) if (year > S[i].y1 && year < S[i + 1].y0) return (S[i].x1 + S[i + 1].x0) / 2;
      return year < S[0].y0 ? S[0].x0 : S[S.length - 1].x1;
    }
    const [v0, v1] = this.view; return L + ((year - v0) / (v1 - v0)) * (R - L);
  }
  /** Pixel x → year. */
  year(px) {
    const { L, R } = this, f = (px - L) / (R - L);
    if (this.o.scale === 'log') { const [u0, u1] = this.view; return this.present - 10 ** (u0 + f * (u1 - u0)); }
    if (this.o.scale === 'broken') { const S = this._segs(); for (const g of S) if (px <= g.x1 + 9) return g.y0 + (clamp(px, g.x0, g.x1) - g.x0) / (g.x1 - g.x0) * (g.y1 - g.y0); return S.length ? S[S.length - 1].y1 : 0; }
    const [v0, v1] = this.view; return v0 + f * (v1 - v0);
  }
  _ticks() {
    const W = this.R - this.L;
    if (this.o.scale === 'log') { const [u0, u1] = this.view; return logTicks(10 ** u1, 10 ** u0, W / Math.max(1e-9, u0 - u1)).map(([a, l]) => [this.present - a, l]); }
    if (this.o.scale === 'broken') return this._segs().flatMap((g, i) => linearTicks(g.y0, g.y1, g.x1 - g.x0, this.present, 80).filter(([y]) => i === 0 || y > g.y0 + (g.y1 - g.y0) * 0.06)); // no crowding at a break
    return linearTicks(this.view[0], this.view[1], W, this.present);
  }
  /** Spans that contain a year (default: the cursor). */
  spansAt(year = this.cursor) { return this.spans.filter((s) => { const a = Math.min(s.y0, s.y1), b = Math.max(s.y0, s.y1); return year >= a && (year < b || b >= this.present); }); } // half-open: a boundary belongs to the younger span
  /** All events that `id` depends on, transitively (via links from → to). */
  ancestors(id) { const out = new Set(), st = [String(id)]; while (st.length) { const k = st.pop(); for (const l of this.links) if (String(l.to) === k && !out.has(String(l.from))) { out.add(String(l.from)); st.push(String(l.from)); } } return out; }
  descendants(id) { const out = new Set(), st = [String(id)]; while (st.length) { const k = st.pop(); for (const l of this.links) if (String(l.from) === k && !out.has(String(l.to))) { out.add(String(l.to)); st.push(String(l.to)); } } return out; }
  setView(a, b) { if (!this.full) return; const y0 = this.parse(a), y1 = this.parse(b); this.view = this.o.scale === 'log' ? [Math.log10(Math.max(1e-9, this.present - y0)), Math.log10(Math.max(this.o.minAgo ?? 1, this.present - y1))] : [y0, y1]; this.rt.invalidate(); }
  // ---------------------------------------------------------------- interaction
  _bind() {
    const s = this.s, cv = s.canvas; let st = null;
    const near = (px) => this.cursor != null && Math.abs(px - this.px(this.cursor)) < 9;
    s.onDrag((x, y, phase) => {
      const px = s.X(x);
      if (phase === 'start') { st = { px, mode: near(px) ? 'cursor' : this.o.zoom && this.full ? 'pan' : 'none', view: this.view && this.view.slice() }; }
      if (!st) return;
      if (st.mode === 'cursor') { this.cursor = this.year(clamp(px, this.L, this.R)); this.onCursor?.(this.cursor); }
      else if (st.mode === 'pan') { const k = (px - st.px) / (this.R - this.L), d = (st.view[1] - st.view[0]) * k; this.view = [st.view[0] - d, st.view[1] - d]; this._clampView(); }
      if (phase === 'end') st = null;
    });
    s.onClick((x, y) => {
      const px = s.X(x), py = s.Y(y); let best = null, bd = 12;
      for (const h of this._hit) { const d = h.box ? (px >= h.box[0] && px <= h.box[2] && py >= h.box[1] && py <= h.box[3] ? 0 : Infinity) : Math.hypot(px - h.x, py - h.y); if (d < bd) { bd = d; best = h; } }
      this.selected = best ? best.e : null; this.onSelect?.(this.selected);
    });
    cv.addEventListener('pointermove', () => { if (s.pointer.down) return; const px = s.pointer.px; cv.style.cursor = near(px) ? 'ew-resize' : this._hoverHit() ? 'pointer' : this.o.zoom && this.full ? 'grab' : 'default'; });
    if (this.o.zoom && this.full) cv.addEventListener('wheel', (e) => {
      e.preventDefault(); const r = cv.getBoundingClientRect(), px = e.clientX - r.left, f = (px - this.L) / (this.R - this.L), k = Math.exp(e.deltaY * 0.0016);
      const [a, b] = this.view, c = a + f * (b - a); this.view = [c - (c - a) * k, c + (b - c) * k]; this._clampView(); this.rt.invalidate();
    }, { passive: false });
  }
  _clampView() { // keep the view inside the full range (works for increasing and decreasing coordinates)
    const [f0, f1] = this.full, inc = f1 > f0, lo = Math.min(f0, f1), hi = Math.max(f0, f1), minSpan = this.o.scale === 'log' ? 0.3 : (hi - lo) * 1e-4;
    let [p, q] = inc ? this.view : [this.view[1], this.view[0]];
    if (q - p > hi - lo) { p = lo; q = hi; }
    if (q - p < minSpan) { const m = (p + q) / 2; p = m - minSpan / 2; q = m + minSpan / 2; }
    if (p < lo) { q += lo - p; p = lo; } if (q > hi) { p -= q - hi; q = hi; }
    this.view = inc ? [p, q] : [q, p];
  }
  _hoverHit() { const p = this.s.pointer; if (!p.inside) return null; for (const h of this._hit) { if (h.box ? p.px >= h.box[0] && p.px <= h.box[2] && p.py >= h.box[1] && p.py <= h.box[3] : Math.hypot(p.px - h.x, p.py - h.y) < 8) return h; } return null; }
  // ---------------------------------------------------------------- drawing
  _text(str, x, y, st = {}) { const c = this.s.ctx; c.save(); c.font = FONT(st.size || this.o.fontSize, st.weight || 500); c.textAlign = st.align || 'left'; c.textBaseline = st.baseline || 'middle'; if (st.halo !== false) { c.lineWidth = 4; c.lineJoin = 'round'; c.strokeStyle = this.api.color('panel', 0.9); c.strokeText(str, x, y); } c.fillStyle = this.api.color(st.color || 'ink', st.alpha); c.fillText(str, x, y); c.restore(); }
  _w(str, size = this.o.fontSize, weight = 500) { const c = this.s.ctx; c.save(); c.font = FONT(size, weight); const w = c.measureText(str).width; c.restore(); return w; }
  /** Draw axis, spans, links, events and cursor. o: {eventColor, labels: true, highlight: event id (its prerequisites light up)}. */
  draw(o = {}) {
    const s = this.s, c = s.ctx, col = (n, a) => this.api.color(n, a), { L, R } = this, H = s.height, fs = this.o.fontSize;
    const autoT = this._autoTracks(), tracks = this.spans.length ? Math.max(...autoT) + 1 : 0;
    const th = this.o.trackHeight, axisY = H - 8 - tracks * (th + 3) - (tracks ? 6 : 0) - 22, top = this.cursor != null ? 30 : 10;
    this._hit = [];
    const inView = (x) => x >= L - 1 && x <= R + 1;
    // spans
    this.spans.forEach((sp, i) => {
      const tr = sp.track ?? autoT[i], y = axisY + 26 + tr * (th + 3);
      let x0 = this.px(Math.min(sp.y0, sp.y1)), x1 = this.px(Math.max(sp.y0, sp.y1)); if (x1 < L || x0 > R) return;
      x0 = Math.max(x0, L); x1 = Math.min(x1, R); if (x1 - x0 < 0.5) x1 = x0 + 0.5;
      const sel = this.cursor != null && this.spansAt().includes(sp);
      c.fillStyle = col(sp.color, sel ? 0.42 : 0.24); c.fillRect(x0, y, x1 - x0, th);
      c.strokeStyle = col(sp.color, 0.75); c.lineWidth = 1; c.strokeRect(Math.round(x0) + 0.5, y + 0.5, Math.max(0, Math.round(x1 - x0) - 1), th - 1);
      const lab = sp.label || ''; let w = this._w(lab, fs - 1);
      if (lab && x1 - x0 > 14) {
        let txt = lab; if (w > x1 - x0 - 6) { while (txt.length > 1 && this._w(txt + '…', fs - 1) > x1 - x0 - 6) txt = txt.slice(0, -1); txt = txt.length > 1 ? txt + '…' : ''; w = 0; }
        if (txt) this._text(txt, (x0 + x1) / 2, y + th / 2 + 0.5, { size: fs - 1, align: 'center', color: 'ink', halo: false });
      }
      this._hit.push({ box: [x0, y, x1, y + th], e: sp, span: true });
    });
    // axis and ticks
    c.strokeStyle = col('muted', 0.9); c.lineWidth = 1.2; c.beginPath();
    if (this.o.scale === 'broken') { const S = this._segs(); for (const g of S) { c.moveTo(g.x0, axisY + 0.5); c.lineTo(g.x1, axisY + 0.5); } c.stroke(); c.lineWidth = 1.3; for (let i = 0; i + 1 < S.length; i++) { const m = (S[i].x1 + S[i + 1].x0) / 2; for (const d of [-3, 3]) { c.beginPath(); c.moveTo(m + d - 3, axisY + 6); c.lineTo(m + d + 3, axisY - 6); c.stroke(); } } }
    else { c.moveTo(L, axisY + 0.5); c.lineTo(R, axisY + 0.5); c.stroke(); }
    let lastX = -1e9;
    for (const [x, lab] of this._ticks().map(([y, l]) => [this.px(y), l]).sort((a, b) => a[0] - b[0])) {
      if (!inView(x)) continue;
      c.strokeStyle = col('muted', lab ? 0.9 : 0.45); c.lineWidth = 1; c.beginPath(); c.moveTo(Math.round(x) + 0.5, axisY); c.lineTo(Math.round(x) + 0.5, axisY + (lab ? 5 : 3)); c.stroke();
      if (lab) { const w = this._w(lab, fs - 1.5); const xx = clamp(x, L + w / 2, R - w / 2); if (xx - w / 2 > lastX + 6) { this._text(lab, xx, axisY + 13, { size: fs - 1.5, align: 'center', color: 'muted', halo: false }); lastX = xx + w / 2; } }
    }
    // events: lanes
    const lh = this.o.laneHeight, band = this.links.length ? this.o.linkBand ?? 58 : 0, base = axisY - 12 - band, maxLanes = Math.max(1, Math.floor((base - top + 4) / lh));
    const ev = this.events.filter((e) => isFinite(e.year)).map((e) => ({ e, x: this.px(e.year) })).filter((d) => inView(d.x));
    for (const d of ev) { const w = this._w(d.e.label ?? '', fs, d.e.priority > 0 ? 600 : 500); const right = d.x + 6 + w > R; d.w = w; d.right = right; d.x0 = right ? d.x - 4 - w : d.x - 2; d.x1 = right ? d.x + 2 : d.x + 4 + w; d.priority = (d.e.priority || 0) + (this.selected === d.e ? 100 : 0); }
    const lane = lanes(ev, maxLanes, 6); ev.forEach((d, i) => (d.lane = lane[i]));
    const evById = new Map(ev.map((d) => [String(d.e.id), d]));
    const hiSet = new Set(), hl = isEvent(this.selected) ? this.selected : o.highlight != null ? this.event(o.highlight) : null;
    if (hl) { hiSet.add(String(hl.id)); for (const k of this.ancestors(hl.id)) hiSet.add(k); }
    // links (arcs above the axis, prerequisite → dependent)
    for (const l of this.links) {
      const a = evById.get(String(l.from)), b = evById.get(String(l.to)); if (!a || !b) continue;
      const on = hl && hiSet.has(String(l.from)) && hiSet.has(String(l.to)), dim = hl && !on;
      const xa = a.x, xb = b.x, hgt = Math.min(band - 6, 10 + Math.abs(xb - xa) * 0.3), mx = (xa + xb) / 2; // arcs live in a band between the axis and the labels
      const cy = axisY - hgt * 1.33; // quadratic control point: apex at hgt
      c.strokeStyle = col(on ? 'accent' : l.color || 'muted', on ? 0.95 : dim ? 0.18 : 0.5); c.lineWidth = on ? 2 : 1.2;
      c.beginPath(); c.moveTo(xa, axisY - 4); c.quadraticCurveTo(mx, cy, xb, axisY - 4); c.stroke();
      // arrowhead at b along the curve's end tangent
      const tx = xb - mx, ty = axisY - 4 - cy, tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl, hs = on ? 7 : 6;
      c.fillStyle = c.strokeStyle; c.beginPath(); c.moveTo(xb, axisY - 4); c.lineTo(xb - ux * hs - uy * hs * 0.45, axisY - 4 - uy * hs + ux * hs * 0.45); c.lineTo(xb - ux * hs + uy * hs * 0.45, axisY - 4 - uy * hs - ux * hs * 0.45); c.closePath(); c.fill();
    }
    // stems first, then labels on a soft panel-coloured box (so stems and arcs pass behind them), then dots
    const sty = (d) => { const e = d.e, ec = e.color || o.eventColor || 'accent', on = hiSet.has(String(e.id)); return { e, ec, dim: !!hl && !on, sel: this.selected === e, ly: base - d.lane * lh }; };
    const lab = o.labels !== false;
    if (lab) for (const d of ev) if (d.lane >= 0) { const { ec, dim, ly } = sty(d); c.strokeStyle = col(ec, dim ? 0.15 : 0.45); c.lineWidth = 1; c.beginPath(); c.moveTo(Math.round(d.x) + 0.5, axisY - 4); c.lineTo(Math.round(d.x) + 0.5, ly + 6); c.stroke(); }
    if (lab) for (const d of ev) if (d.lane >= 0) {
      const { e, ec, dim, sel, ly } = sty(d), bx = d.right ? d.x - 6 - d.w : d.x + 2;
      c.fillStyle = col('panel', 0.82); roundRect(c, bx, ly - 8, d.w + 4, 16, 4); c.fill();
      this._text(e.label ?? '', d.right ? d.x - 4 : d.x + 4, ly, { color: dim ? 'muted' : sel ? ec : 'ink', alpha: dim ? 0.65 : 1, weight: e.priority > 0 || sel ? 600 : 500, align: d.right ? 'right' : 'left', halo: false });
      this._hit.push({ box: [d.x0, ly - 8, d.x1, ly + 8], e });
    }
    for (const d of ev) {
      const { e, ec, dim, sel } = sty(d);
      c.beginPath(); c.arc(d.x, axisY, sel ? 5.5 : 4.2, 0, 2 * Math.PI); c.fillStyle = col(ec, dim ? 0.35 : 1); c.fill(); c.lineWidth = 1.5; c.strokeStyle = col('panel', 0.95); c.stroke();
      this._hit.push({ x: d.x, y: axisY, e });
    }
    // hover tooltip for a hidden label (or any event)
    const hv = this._hoverHit();
    if (hv && !hv.span) { const d = ev.find((q) => q.e === hv.e); if (d && d.lane < 0) this._tip(`${hv.e.label} · ${this.fmt(hv.e.year)}`, d.x, axisY - 14); }
    else if (hv && hv.span) this._tip(`${hv.e.label}: ${this.fmt(hv.e.y0)} – ${this.fmt(hv.e.y1)}`, s.pointer.px, hv.box[1] - 6);
    // cursor
    if (this.cursor != null) {
      const x = this.px(this.cursor);
      if (inView(x)) {
        c.strokeStyle = col('red', 0.85); c.lineWidth = 1.5; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(x, 22); c.lineTo(x, H - 4); c.stroke(); c.setLineDash([]);
        const lab = this.fmt(this.cursor), w = this._w(lab, fs, 600) + 14, bx = clamp(x - w / 2, 2, s.width - w - 2);
        c.fillStyle = col('red', 0.95); roundRect(c, bx, 4, w, 19, 6); c.fill();
        this._text(lab, bx + w / 2, 14, { color: 'panel', weight: 600, align: 'center', halo: false });
      }
    }
    return this;
  }
  _autoTracks() { // greedy track assignment for spans without an explicit track
    const order = this.spans.map((s, i) => i).sort((i, j) => Math.min(this.spans[i].y0, this.spans[i].y1) - Math.min(this.spans[j].y0, this.spans[j].y1)), ends = [], out = [];
    for (const i of order) { const s = this.spans[i]; if (s.track != null) { out[i] = s.track; continue; } const a = Math.min(s.y0, s.y1); let t = ends.findIndex((e) => e <= a); if (t < 0) { t = ends.length; ends.push(0); } ends[t] = Math.max(s.y0, s.y1); out[i] = t; }
    return out;
  }
  _tip(str, x, y) {
    const c = this.s.ctx, w = this._w(str, this.o.fontSize, 500) + 12, bx = clamp(x - w / 2, 2, this.s.width - w - 2);
    c.fillStyle = this.api.color('ink', 0.88); roundRect(c, bx, y - 20, w, 19, 5); c.fill();
    this._text(str, bx + w / 2, y - 10, { color: 'panel', halo: false, align: 'center' });
  }
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

export default function timeline(api, rt, stage, spec) { return new Timeline(api, rt, stage, spec); }
export const TIMELINES = { parse: parseTime, format: fmtYear, ago: fmtAgo, linearTicks, logTicks, lanes, geologic: GEOLOGIC, PRESENT };
Object.assign(timeline, TIMELINES);
/** v.timelines(name, ...args): 'parse', 'format', 'ago', 'geologic' (→ spans), 'lanes', 'linearTicks', 'logTicks'; v.timelines() → the table. */
export function timelines(api, rt, name, ...args) {
  if (name == null) return TIMELINES;
  const f = TIMELINES[name]; if (f == null) throw new Error(`v.timelines: unknown helper "${name}" (${Object.keys(TIMELINES).join(', ')})`);
  return typeof f === 'function' ? f(...args) : f;
}
