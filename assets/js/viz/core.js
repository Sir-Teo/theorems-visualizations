// Visualization runtime. A theorem's `viz(v)` function receives the API built by
// `mount()` below; see AUTHORING.md for the full reference and examples.
import * as M from './math.js';
import { KITS } from './kits/index.js';

// ------------------------------------------------------------------ colours
const NAMES = ['ink', 'muted', 'faint', 'grid', 'bg', 'panel', 'accent', 'blue', 'red', 'green', 'orange', 'purple', 'teal', 'pink', 'gold', 'gray', 'pma', 'rca', 'fa'];
let PAL = null;
const RGB = new Map();
let normCtx = null;
function palette() {
  if (PAL) return PAL;
  const cs = getComputedStyle(document.documentElement);
  PAL = {};
  for (const n of NAMES) PAL[n] = cs.getPropertyValue('--c-' + n).trim() || '#888888';
  return PAL;
}
export function resetColors() { PAL = null; RGB.clear(); }
/** Palette names, then any `--c-<name>` custom property (collection colours from data/atlas.css), then the CSS colour itself. */
export function resolveColor(c) {
  if (c == null) return null; if (Array.isArray(c)) return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  const P = palette(); if (P[c] != null) return P[c];
  if (typeof c === 'string' && /^[a-z][a-z0-9-]*$/.test(c)) { const v = getComputedStyle(document.documentElement).getPropertyValue('--c-' + c).trim(); P[c] = v || c; return P[c]; }
  return c;
}
/** [r,g,b,a] (0–255, a in 0–1) of a palette name or any CSS colour. */
export function rgbOf(c) {
  if (Array.isArray(c)) return [c[0], c[1], c[2], c[3] ?? 1];
  const s = resolveColor(c);
  if (RGB.has(s)) return RGB.get(s);
  normCtx ||= document.createElement('canvas').getContext('2d');
  normCtx.fillStyle = '#000'; normCtx.fillStyle = s;
  const n = normCtx.fillStyle; let out;
  if (n[0] === '#') out = [parseInt(n.slice(1, 3), 16), parseInt(n.slice(3, 5), 16), parseInt(n.slice(5, 7), 16), 1];
  else { const m = n.match(/[\d.]+/g).map(Number); out = [m[0], m[1], m[2], m[3] ?? 1]; }
  RGB.set(s, out); return out;
}
export function withAlpha(c, a) {
  if (a == null || a >= 1) return resolveColor(c);
  const [r, g, b, a0] = rgbOf(c);
  return `rgba(${r},${g},${b},${a0 * Math.max(0, a)})`;
}
/** Blend two colours: t=0 → a, t=1 → b. */
export function mix(a, b, t) { const p = rgbOf(a), q = rgbOf(b); return `rgb(${p.slice(0, 3).map((x, i) => Math.round(x + (q[i] - x) * t)).join(',')})`; }
const prefersReduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// ------------------------------------------------------------------ rich text + TeX
export const MACROS = {
  '\\R': '\\mathbb{R}', '\\C': '\\mathbb{C}', '\\Q': '\\mathbb{Q}', '\\Z': '\\mathbb{Z}', '\\N': '\\mathbb{N}', '\\T': '\\mathbb{T}',
  '\\eps': '\\varepsilon', '\\Re': '\\operatorname{Re}', '\\Im': '\\operatorname{Im}',
  '\\norm': '\\left\\lVert #1\\right\\rVert', '\\abs': '\\left\\lvert #1\\right\\rvert', '\\ip': '\\langle #1,\\,#2\\rangle',
  '\\supp': '\\operatorname{supp}', '\\dist': '\\operatorname{dist}', '\\diam': '\\operatorname{diam}', '\\Ind': '\\operatorname{Ind}',
  '\\Res': '\\operatorname{Res}', '\\co': '\\operatorname{co}', '\\sgn': '\\operatorname{sgn}', '\\tr': '\\operatorname{tr}', '\\spn': '\\operatorname{span}',
};
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const escapeHTML = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c]);
export function katexHTML(tex, display = false) {
  const K = typeof window !== 'undefined' && window.katex;
  if (!K) return `<span class="tex-fallback">${escapeHTML(tex)}</span>`;
  if (window.__texStrict) {
    // a TeX command inside a non-raw JS string loses its backslash: "\frac" → form feed + "rac", "\theta" → tab + "heta", "\nu" → newline + "u"
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(tex) || /\n(?:eq|u|abla|ot|otin|ewline|exists|i\b|e\b)/.test(tex) || /\r(?:ho|ight|angle|m\b)/.test(tex) || /\t(?:ext|heta|au|imes|o\b|ilde|frac|riangle)/.test(tex))
      (window.__texErrors ||= []).push(`escaped backslash (use String.raw or \\\\) in: ${JSON.stringify(tex)}`);
    try { return K.renderToString(tex, { displayMode: display, throwOnError: true, macros: { ...MACROS }, strict: 'ignore' }); }
    catch (e) { (window.__texErrors ||= []).push(`${e.message} in: ${tex}`); }
  }
  return K.renderToString(tex, { displayMode: display, throwOnError: false, macros: { ...MACROS }, strict: 'ignore' });
}
/**
 * Render a "rich" string: text with $inline$ and $$display$$ TeX, **bold**, *italic*,
 * blank-line paragraphs, and lines starting with "(a)", "(i)", "- " rendered as list items.
 */
export function richHTML(src, { lists = true } = {}) {
  if (src == null) return '';
  const maths = [];
  let s = String(src).replace(/\$\$([\s\S]+?)\$\$|\$((?:\\.|[^$\\])+?)\$/g, (_, d, i) => {
    maths.push(d != null ? katexHTML(d.trim(), true) : katexHTML(i, false));
    return `\u0000${maths.length - 1}\u0000`;
  });
  s = escapeHTML(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, '$1<em>$2</em>');
  const paras = s.split(/\n\s*\n/).map((p) => {
    const lines = p.split('\n');
    const html = []; let buf = [];
    const flush = () => { if (buf.length) { html.push(`<span class="rich-line">${buf.join(' ')}</span>`); buf = []; } };
    for (const raw of lines) {
      const line = raw.trim();
      const m = lists && line.match(/^(\((?:[a-z]|[ivx]+|\d+)\)|-)\s+(.*)$/);
      if (m) { flush(); html.push(`<span class="rich-item"><span class="rich-tag">${m[1] === '-' ? '•' : m[1]}</span><span class="rich-body">${m[2]}</span></span>`); }
      else if (line) { if (buf.length === 0 && html.length && html[html.length - 1].startsWith('<span class="rich-item"') && !/^[A-Z]/.test(line)) { /* continuation of item */ html[html.length - 1] = html[html.length - 1].replace(/<\/span><\/span>$/, ` ${line}</span></span>`); } else buf.push(line); }
    }
    flush();
    return `<p>${html.join('')}</p>`;
  }).join('');
  return paras.replace(/\u0000(\d+)\u0000/g, (_, k) => maths[+k]);
}
export function renderRich(el, src) { el.innerHTML = richHTML(src); }
/** Inline-only variant (no <p> wrapper), for labels. */
export function inlineHTML(src) { const h = richHTML(src, { lists: false }); return h.replace(/^<p>/, '').replace(/<\/p>$/, '').replace(/<\/?span class="rich-line">/g, ''); }

// ------------------------------------------------------------------ DOM helper
function h(tag, cls, ...kids) { const el = document.createElement(tag); if (cls) el.className = cls; for (const k of kids) el.append(k); return el; }
const DPR = () => Math.min(3, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);

// ------------------------------------------------------------------ tick helpers
function niceStep(span, px, target = 80) {
  const raw = span * target / Math.max(px, 1);
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}
function tickLabel(x, step) {
  const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  return (Math.abs(x) < step * 1e-6 ? 0 : x).toFixed(Math.min(d, 6)).replace('-', '−');
}

// ================================================================== 2D stage
class Stage {
  constructor(rt, opts = {}) {
    this.rt = rt;
    const o = this.o = Object.assign({
      x: [-1, 1], y: [-1, 1], height: 340, equal: false, axes: true, grid: false, ticks: true, pad: 0,
      hover: false, title: null, weight: 1, minWidth: 260, xlabel: null, ylabel: null, xticks: null, yticks: null, aspect: null,
    }, opts);
    if (o.axes === 'none') o.axes = false;
    this.view = { x: [...o.x], y: [...o.y] };
    this.el = h('div', 'stage');
    this.el.style.flex = o.full ? '1 1 100%' : `${o.weight} 1 ${o.minWidth}px`;
    if (o.title) { const t = h('div', 'stage-title'); t.innerHTML = inlineHTML(o.title); this.el.append(t); this.titleEl = t; }
    this.box = h('div', 'stage-box');
    this.canvas = h('canvas');
    this.overlay = h('div', 'stage-overlay');
    this.box.append(this.canvas, this.overlay);
    this.el.append(this.box);
    rt.stagesEl.append(this.el);
    this.ctx = this.canvas.getContext('2d');
    this.handles = []; this._tex = []; this._texN = 0; this._raster = new Map();
    this._drag = []; this._click = []; this._hoverFns = [];
    this.pointer = { x: NaN, y: NaN, px: NaN, py: NaN, inside: false, down: false };
    this.W = 300; this.H = o.height;
    this._bind();
    this.canvas.style.touchAction = 'pan-y';
  }
  setTitle(s) {
    if (!this.titleEl) { this.titleEl = h('div', 'stage-title'); this.el.prepend(this.titleEl); }
    if (this.titleEl._src !== s) { this.titleEl.innerHTML = inlineHTML(s); this.titleEl._src = s; }
  }
  /** Replace the custom ticks (same format as the xticks/yticks options; null = automatic). */
  setTicks(xticks, yticks) { if (xticks !== undefined) this.o.xticks = xticks; if (yticks !== undefined) this.o.yticks = yticks; }
  resize() {
    const W = Math.max(120, Math.round(this.box.clientWidth || this.el.clientWidth || 300));
    const o = this.o;
    const HW = this.rt.stagesEl.clientWidth || W; // scale by the whole viz width so side-by-side panels stay equal
    let H = o.aspect ? W * o.aspect : o.height * (HW < 560 ? Math.max(0.72, HW / 560) : 1);
    H = Math.round(Math.max(80, Math.min(H, 900)));
    if (W === this.W && H === this.H && this.canvas.width) { return; }
    this.W = W; this.H = H;
    const d = DPR();
    this.canvas.width = Math.round(W * d); this.canvas.height = Math.round(H * d);
    this.canvas.style.width = W + 'px'; this.canvas.style.height = H + 'px';
    this.box.style.height = H + 'px';
    this._fit();
  }
  /** Change the visible window (data coordinates). */
  setView(x, y) {
    const same = (a, b) => !a || (Math.abs(a[0] - b[0]) < 1e-12 && Math.abs(a[1] - b[1]) < 1e-12);
    if (same(x, this.view.x) && same(y, this.view.y)) return;
    if (x) this.view.x = [...x]; if (y) this.view.y = [...y]; this._fit(); this.rt.invalidate();
  }
  _fit() {
    const { pad } = this.o; const W = this.W - 2 * pad, H = this.H - 2 * pad;
    let [x0, x1] = this.view.x, [y0, y1] = this.view.y;
    if (this.o.equal) {
      const s = Math.min(W / (x1 - x0), H / (y1 - y0));
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = W / s / 2, hh = H / s / 2;
      x0 = cx - hw; x1 = cx + hw; y0 = cy - hh; y1 = cy + hh;
    }
    this.xr = [x0, x1]; this.yr = [y0, y1];
    this.sx = W / (x1 - x0); this.sy = H / (y1 - y0);
  }
  // transforms
  X(x) { return this.o.pad + (x - this.xr[0]) * this.sx; }
  Y(y) { return this.H - this.o.pad - (y - this.yr[0]) * this.sy; }
  invX(px) { return this.xr[0] + (px - this.o.pad) / this.sx; }
  invY(py) { return this.yr[0] + (this.H - this.o.pad - py) / this.sy; }
  inv(px, py) { return [this.invX(px), this.invY(py)]; }
  get bounds() { return { x: this.xr.slice(), y: this.yr.slice() }; }
  get width() { return this.W; }
  get height() { return this.H; }
  /** pixels per data unit */
  get scale() { return this.sx; }

  begin() {
    const c = this.ctx, d = DPR();
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, this.W, this.H);
    c.globalAlpha = 1;
    this._texN = 0;
    if (this.o.grid) this.grid();
    if (this.o.axes) this.axes();
  }
  end() {
    for (const hd of this.handles) if (hd.visible !== false) this._drawHandle(hd);
    for (let i = this._texN; i < this._tex.length; i++) this._tex[i].style.display = 'none';
  }

  // ---------- axes & grid ----------
  _ticks(axis) {
    const custom = axis === 'x' ? this.o.xticks : this.o.yticks;
    const [a, b] = axis === 'x' ? this.xr : this.yr;
    if (custom) return custom.map((t) => Array.isArray(t) ? t : [t, tickLabel(t, 1e-3).replace(/\.?0+$/, '')]).filter(([v]) => v >= a - 1e-9 && v <= b + 1e-9);
    const px = axis === 'x' ? this.W : this.H;
    const step = niceStep(b - a, px, axis === 'x' ? 90 : 60);
    const out = [];
    for (let v = Math.ceil(a / step) * step; v <= b + step * 1e-9; v += step) out.push([v, tickLabel(v, step)]);
    return out;
  }
  grid(st = {}) {
    const c = this.ctx; c.save(); c.strokeStyle = resolveColor(st.color || 'grid'); c.lineWidth = 1; c.setLineDash([]);
    c.beginPath();
    for (const [v] of this._ticks('x')) { const x = Math.round(this.X(v)) + 0.5; c.moveTo(x, 0); c.lineTo(x, this.H); }
    for (const [v] of this._ticks('y')) { const y = Math.round(this.Y(v)) + 0.5; c.moveTo(0, y); c.lineTo(this.W, y); }
    c.stroke(); c.restore();
  }
  axes() {
    const c = this.ctx, o = this.o;
    const box = o.axes === 'box';
    const y0 = box || this.yr[0] > 0 || this.yr[1] < 0 ? this.yr[0] : 0;
    const x0 = box || this.xr[0] > 0 || this.xr[1] < 0 ? this.xr[0] : 0;
    const ax = Math.round(this.Y(y0)) + 0.5, ay = Math.round(this.X(x0)) + 0.5;
    c.save();
    c.strokeStyle = resolveColor('faint'); c.lineWidth = 1; c.setLineDash([]);
    c.beginPath(); c.moveTo(0, ax); c.lineTo(this.W, ax); c.moveTo(ay, 0); c.lineTo(ay, this.H); c.stroke();
    if (o.ticks) {
      c.fillStyle = resolveColor('muted'); c.font = '500 10.5px Inter, system-ui, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'top';
      const below = ax + 16 < this.H;
      for (const [v, lab] of this._ticks('x')) {
        const x = this.X(v); if (Math.abs(v - x0) < 1e-12 && !box) continue; if (x < 8 || x > this.W - 8) continue;
        c.beginPath(); c.moveTo(x, ax - 3); c.lineTo(x, ax + 3); c.stroke();
        c.textBaseline = below ? 'top' : 'bottom'; c.fillText(lab, x, below ? ax + 5 : ax - 5);
      }
      c.textAlign = 'right'; c.textBaseline = 'middle';
      const left = ay - 26 > 0;
      for (const [v, lab] of this._ticks('y')) {
        const y = this.Y(v); if (Math.abs(v - y0) < 1e-12 && !box) continue; if (y < 8 || y > this.H - 8) continue;
        c.beginPath(); c.moveTo(ay - 3, y); c.lineTo(ay + 3, y); c.stroke();
        c.textAlign = left ? 'right' : 'left'; c.fillText(lab, left ? ay - 6 : ay + 6, y);
      }
    }
    c.font = 'italic 15px Newsreader, "Times New Roman", serif'; c.fillStyle = resolveColor('muted');
    if (o.xlabel) { c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillText(o.xlabel, this.W - 6, ax - 5); }
    if (o.ylabel) { c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(o.ylabel, ay + 7, 5); }
    c.restore();
  }

  // ---------- style plumbing ----------
  _paint(st, defStroke = true, defWidth = 2) {
    const c = this.ctx;
    if (st.fill) { c.fillStyle = withAlpha(st.fill === true ? (st.color || 'ink') : st.fill, st.fillAlpha ?? 0.18); c.fill(st.evenodd ? 'evenodd' : 'nonzero'); }
    const doStroke = st.stroke !== false && (st.color != null || st.width != null || (defStroke && !st.fill));
    if (doStroke) {
      c.strokeStyle = withAlpha(st.color || 'ink', st.alpha);
      c.lineWidth = st.width ?? defWidth;
      c.setLineDash(st.dash === true ? [6, 5] : st.dash || []);
      c.lineCap = st.cap || 'round'; c.lineJoin = 'round';
      c.stroke();
      c.setLineDash([]);
    }
  }
  // ---------- primitives (data coordinates) ----------
  line(x1, y1, x2, y2, st = {}) { const c = this.ctx; c.beginPath(); c.moveTo(this.X(x1), this.Y(y1)); c.lineTo(this.X(x2), this.Y(y2)); this._paint(st); return this; }
  segment(p, q, st) { return this.line(p[0], p[1], q[0], q[1], st); }
  /** Polyline through [[x,y],...]; st.close for a closed polygon; st.fill to fill. */
  path(pts, st = {}) {
    if (!pts || pts.length < 2) return this;
    const c = this.ctx; c.beginPath(); let pen = false;
    for (const p of pts) {
      if (!p || !isFinite(p[0]) || !isFinite(p[1])) { pen = false; continue; }
      const X = this.X(p[0]), Y = this.Y(p[1]);
      if (pen) c.lineTo(X, Y); else { c.moveTo(X, Y); pen = true; }
    }
    if (st.close) c.closePath();
    this._paint(st); return this;
  }
  poly(pts, st = {}) { return this.path(pts, { close: true, ...st }); }
  /** Several closed rings filled together (use st.evenodd for holes). */
  rings(list, st = {}) {
    const c = this.ctx; c.beginPath();
    for (const pts of list) { pts.forEach((p, i) => i ? c.lineTo(this.X(p[0]), this.Y(p[1])) : c.moveTo(this.X(p[0]), this.Y(p[1]))); c.closePath(); }
    this._paint(st); return this;
  }
  /** Graph of y = f(x). st.domain=[a,b], st.n samples, st.fill to shade down to st.base (default 0). Breaks at discontinuities. */
  fn(f, st = {}) {
    const [a, b] = st.domain || this.xr;
    const lo = Math.max(a, this.xr[0] - (this.xr[1] - this.xr[0]) * 0.02), hi = Math.min(b, this.xr[1] + (this.xr[1] - this.xr[0]) * 0.02);
    if (!(hi > lo)) return this;
    const n = st.n || Math.max(240, Math.ceil(this.W * 1.5));
    const pts = []; let prev = null;
    const lim = this.H * 4;
    for (let i = 0; i <= n; i++) {
      const x = lo + (hi - lo) * i / n; let y;
      try { y = f(x); } catch { y = NaN; }
      const py = this.Y(y);
      const bad = !isFinite(y) || Math.abs(py) > lim + this.H;
      if (bad) { if (prev) pts.push(null); prev = null; continue; }
      if (prev && Math.abs(py - prev) > this.H * 0.8 && !st.connect) pts.push(null);
      pts.push([x, y]); prev = py;
    }
    if (st.fill) {
      const base = st.base ?? 0; const c = this.ctx;
      let run = [];
      const flushFill = () => { if (run.length > 1) { c.beginPath(); c.moveTo(this.X(run[0][0]), this.Y(base)); run.forEach((p) => c.lineTo(this.X(p[0]), this.Y(p[1]))); c.lineTo(this.X(run[run.length - 1][0]), this.Y(base)); c.closePath(); c.fillStyle = withAlpha(st.fill === true ? st.color || 'ink' : st.fill, st.fillAlpha ?? 0.18); c.fill(); } run = []; };
      for (const p of pts) { if (p) run.push(p); else flushFill(); }
      flushFill();
    }
    this.path(pts, { ...st, fill: null }); return this;
  }
  /** Parametric curve t ↦ g(t) = [x,y] for t in [t0,t1]. */
  curve(g, t0, t1, st = {}) {
    const n = st.n || 400; const pts = [];
    for (let i = 0; i <= n; i++) { const p = g(t0 + (t1 - t0) * i / n); pts.push(p && (p.re !== undefined ? [p.re, p.im] : p)); }
    return this.path(pts, st);
  }
  /** Shade the region between y=f(x) and y=g(x) for x in [a,b]. */
  between(f, g, a, b, st = {}) {
    const n = st.n || 200; const top = [], bot = [];
    for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; top.push([x, f(x)]); bot.push([x, g(x)]); }
    return this.path(top.concat(bot.reverse()), { fill: st.fill || st.color || 'accent', fillAlpha: st.fillAlpha ?? 0.18, stroke: false, close: true, ...st });
  }
  /** Filled dot with a fixed pixel radius st.r (default 4). st.hollow for an open circle; st.label + st.labelPos ('n','ne','e',...). */
  dot(x, y, st = {}) {
    if (!isFinite(x) || !isFinite(y)) return this;
    const c = this.ctx, r = st.r ?? 4, X = this.X(x), Y = this.Y(y);
    c.beginPath(); c.arc(X, Y, r, 0, M.TAU);
    const col = st.color || 'ink';
    if (st.hollow) { c.fillStyle = resolveColor('panel'); c.fill(); c.lineWidth = st.width ?? 1.8; c.strokeStyle = withAlpha(col, st.alpha); c.stroke(); }
    else {
      c.fillStyle = withAlpha(col, st.alpha); c.fill();
      if (st.ring !== false && r >= 3) { c.lineWidth = 1.5; c.strokeStyle = withAlpha('panel', 0.9); c.stroke(); }
    }
    if (st.label != null) this._labelAt(st.label, X, Y, r + 4, st.labelPos || 'ne', st.labelColor || col, st);
    return this;
  }
  /** Many dots at once (faster); pts = [[x,y],...]. */
  dots(pts, st = {}) {
    const c = this.ctx, r = st.r ?? 2.5; c.fillStyle = withAlpha(st.color || 'ink', st.alpha);
    c.beginPath();
    for (const p of pts) { if (!p || !isFinite(p[1])) continue; const X = this.X(p[0]), Y = this.Y(p[1]); c.moveTo(X + r, Y); c.arc(X, Y, r, 0, M.TAU); }
    c.fill(); return this;
  }
  /** Circle with radius r in data units (an ellipse if axes are not equal-scaled). */
  circle(x, y, r, st = {}) {
    const c = this.ctx; c.beginPath(); c.ellipse(this.X(x), this.Y(y), Math.abs(r * this.sx), Math.abs(r * this.sy), 0, 0, M.TAU);
    this._paint(st); return this;
  }
  /** Open ball in a general norm: st.p = 1, 2, Infinity, or any p ≥ 1. */
  ball(x, y, r, st = {}) {
    const p = st.p ?? 2; if (p === 2) return this.circle(x, y, r, st);
    return this.poly(M.unitBall(p, 160).map(([a, b]) => [x + r * a, y + r * b]), st);
  }
  rect(x0, y0, x1, y1, st = {}) {
    const c = this.ctx; const X0 = this.X(x0), X1 = this.X(x1), Y0 = this.Y(y0), Y1 = this.Y(y1);
    c.beginPath(); c.rect(Math.min(X0, X1), Math.min(Y0, Y1), Math.abs(X1 - X0), Math.abs(Y1 - Y0)); this._paint(st); return this;
  }
  /** Vertical strip a ≤ x ≤ b across the whole view (e.g. a δ-neighbourhood). */
  vband(a, b, st = {}) { const c = this.ctx; c.beginPath(); c.rect(this.X(a), 0, this.X(b) - this.X(a), this.H); c.fillStyle = withAlpha(st.color || 'accent', st.alpha ?? 0.12); c.fill(); if (st.edges) { this.vline(a, { color: st.color || 'accent', width: 1, dash: true, alpha: 0.7 }); this.vline(b, { color: st.color || 'accent', width: 1, dash: true, alpha: 0.7 }); } return this; }
  /** Horizontal strip a ≤ y ≤ b (e.g. an ε-band). */
  hband(a, b, st = {}) { const c = this.ctx; c.beginPath(); c.rect(0, this.Y(b), this.W, this.Y(a) - this.Y(b)); c.fillStyle = withAlpha(st.color || 'accent', st.alpha ?? 0.12); c.fill(); if (st.edges) { this.hline(a, { color: st.color || 'accent', width: 1, dash: true, alpha: 0.7 }); this.hline(b, { color: st.color || 'accent', width: 1, dash: true, alpha: 0.7 }); } return this; }
  vline(x, st = {}) { return this.line(x, this.yr[0] - 1e3 * (this.yr[1] - this.yr[0]), x, this.yr[1] + 1e3 * (this.yr[1] - this.yr[0]), { width: 1.2, ...st }); }
  hline(y, st = {}) { return this.line(this.xr[0] - 1e3 * (this.xr[1] - this.xr[0]), y, this.xr[1] + 1e3 * (this.xr[1] - this.xr[0]), y, { width: 1.2, ...st }); }
  /** Arrow from (x1,y1) to (x2,y2). st.head = head size px; st.both for double-headed. */
  arrow(x1, y1, x2, y2, st = {}) {
    const c = this.ctx, X1 = this.X(x1), Y1 = this.Y(y1), X2 = this.X(x2), Y2 = this.Y(y2);
    const L = Math.hypot(X2 - X1, Y2 - Y1); if (L < 0.5) return this;
    const hs = Math.min(st.head ?? 9, L * 0.45), ux = (X2 - X1) / L, uy = (Y2 - Y1) / L;
    const col = withAlpha(st.color || 'ink', st.alpha);
    c.beginPath(); c.moveTo(st.both ? X1 + ux * hs * 0.8 : X1, st.both ? Y1 + uy * hs * 0.8 : Y1); c.lineTo(X2 - ux * hs * 0.8, Y2 - uy * hs * 0.8);
    c.strokeStyle = col; c.lineWidth = st.width ?? 2; c.setLineDash(st.dash === true ? [6, 5] : st.dash || []); c.lineCap = 'round'; c.stroke(); c.setLineDash([]);
    const head = (X, Y, dx, dy) => { c.beginPath(); c.moveTo(X, Y); c.lineTo(X - dx * hs - dy * hs * 0.45, Y - dy * hs + dx * hs * 0.45); c.lineTo(X - dx * hs + dy * hs * 0.45, Y - dy * hs - dx * hs * 0.45); c.closePath(); c.fillStyle = col; c.fill(); };
    head(X2, Y2, ux, uy); if (st.both) head(X1, Y1, -ux, -uy);
    return this;
  }
  /** A thick interval [a,b] drawn at height y (number-line style). st.open = [leftOpen, rightOpen]. */
  interval(a, b, y = 0, st = {}) {
    const col = st.color || 'accent';
    this.line(a, y, b, y, { color: col, width: st.width ?? 5, cap: 'butt', alpha: st.alpha });
    const [lo, ro] = st.open || [false, false];
    this.dot(a, y, { color: col, r: st.r ?? 4.5, hollow: lo }); this.dot(b, y, { color: col, r: st.r ?? 4.5, hollow: ro });
    if (st.label) this.text(st.label, (a + b) / 2, y, { dy: -14, align: 'center', color: col, math: st.math ?? true });
    return this;
  }
  /** Brace-like dimension marker between two points with a label (e.g. "δ"). */
  measure(x1, y1, x2, y2, label, st = {}) {
    const col = st.color || 'muted';
    this.arrow(x1, y1, x2, y2, { color: col, width: 1.2, head: 6, both: true });
    if (label != null) {
      const X = (this.X(x1) + this.X(x2)) / 2, Y = (this.Y(y1) + this.Y(y2)) / 2;
      const dx = this.X(x2) - this.X(x1), dy = this.Y(y2) - this.Y(y1), L = Math.hypot(dx, dy) || 1;
      const off = st.offset ?? 12; const nx = -dy / L * off, ny = dx / L * off;
      this.textPx(label, X + nx, Y + ny, { align: 'center', color: col, math: st.math ?? true, size: st.size });
    }
    return this;
  }
  /** Vector field: F(x,y) → [u,v], arrows on a grid every st.spacing px. */
  field(F, st = {}) {
    const sp = st.spacing || 34, c = this.ctx; const col = st.color || 'muted';
    const pts = [];
    let maxL = 1e-12;
    for (let px = sp / 2; px < this.W; px += sp) for (let py = sp / 2; py < this.H; py += sp) {
      const [x, y] = this.inv(px, py); const [u, v] = F(x, y); const L = Math.hypot(u * this.sx, v * this.sy);
      if (isFinite(L)) { pts.push([px, py, u * this.sx, -v * this.sy, L]); maxL = Math.max(maxL, L); }
    }
    c.save(); c.strokeStyle = c.fillStyle = withAlpha(col, st.alpha ?? 0.75); c.lineWidth = st.width ?? 1.3;
    for (const [px, py, du, dv, L] of pts) {
      if (L < 1e-9) continue;
      const len = st.normalize === false ? Math.min(sp * 0.9, L * (st.scale ?? 1)) : sp * 0.42 * (0.35 + 0.65 * Math.sqrt(L / maxL));
      const ux = du / L, uy = dv / L, x0 = px - ux * len / 2, y0 = py - uy * len / 2, x1 = px + ux * len / 2, y1 = py + uy * len / 2;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * 5 - uy * 2.6, y1 - uy * 5 + ux * 2.6); c.lineTo(x1 - ux * 5 + uy * 2.6, y1 - uy * 5 - ux * 2.6); c.closePath(); c.fill();
    }
    c.restore(); return this;
  }
  /** Bars for a sequence: values[i] drawn at x = x0 + i*dx. st.width as fraction of dx. */
  bars(values, st = {}) {
    const x0 = st.x0 ?? 1, dx = st.dx ?? 1, w = (st.barWidth ?? 0.7) * dx, base = st.base ?? 0;
    values.forEach((v, i) => {
      const col = typeof st.color === 'function' ? st.color(v, i) : st.color || 'accent';
      this.rect(x0 + i * dx - w / 2, base, x0 + i * dx + w / 2, v, { fill: col, fillAlpha: st.fillAlpha ?? 0.75, stroke: false });
    });
    return this;
  }

  // ---------- text ----------
  _font(st) {
    const size = st.size || (st.math ? 16 : 12.5);
    return st.math ? `italic ${size}px Newsreader, "Times New Roman", serif` : `${st.weight || 500} ${size}px Inter, system-ui, sans-serif`;
  }
  textPx(str, X, Y, st = {}) {
    const c = this.ctx; c.save();
    c.font = this._font(st); c.textAlign = st.align || 'left'; c.textBaseline = st.baseline || 'middle';
    X += st.dx || 0; Y += st.dy || 0;
    if (st.halo !== false) { c.lineWidth = 4; c.lineJoin = 'round'; c.strokeStyle = withAlpha('panel', 0.85); c.strokeText(str, X, Y); }
    c.fillStyle = withAlpha(st.color || 'ink', st.alpha); c.fillText(str, X, Y);
    c.restore(); return this;
  }
  /** Canvas text at data coords. st: {size, color, align, baseline, dx, dy, math (italic serif), halo}. */
  text(str, x, y, st = {}) { return this.textPx(String(str), this.X(x), this.Y(y), st); }
  /** Status text pinned to a corner: pos = 'tl' | 'tr' | 'bl' | 'br'. */
  corner(str, pos = 'tl', st = {}) {
    const m = 10, X = pos[1] === 'l' ? m : this.W - m, Y = pos[0] === 't' ? m + 7 : this.H - m - 7;
    return this.textPx(String(str), X, Y, { align: pos[1] === 'l' ? 'left' : 'right', color: 'muted', size: 12, ...st });
  }
  _labelAt(label, X, Y, off, pos, color, st) {
    const dirs = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [0.75, -0.75], nw: [-0.75, -0.75], se: [0.75, 0.75], sw: [-0.75, 0.75] };
    const [dx, dy] = dirs[pos] || dirs.ne;
    const align = dx > 0.1 ? 'left' : dx < -0.1 ? 'right' : 'center';
    const baseline = dy > 0.1 ? 'top' : dy < -0.1 ? 'bottom' : 'middle';
    if (st.tex) this.texPx(label, X + dx * off, Y + dy * off, { color, align, baseline, size: st.labelSize });
    else this.textPx(String(label), X + dx * off, Y + dy * off, { color, align, baseline, math: st.math ?? true, size: st.labelSize });
  }
  /** KaTeX label at data coords (HTML overlay). st: {color, size(px), align: left|center|right, baseline: top|middle|bottom, dx, dy}. */
  tex(latex, x, y, st = {}) { return this.texPx(latex, this.X(x), this.Y(y), st); }
  texPx(latex, X, Y, st = {}) {
    let el = this._tex[this._texN];
    if (!el) { el = h('div', 'tex-label'); this.overlay.append(el); this._tex.push(el); }
    this._texN++;
    if (el._src !== latex) { el.innerHTML = katexHTML(latex); el._src = latex; }
    el.style.display = '';
    el.style.left = (X + (st.dx || 0)) + 'px'; el.style.top = (Y + (st.dy || 0)) + 'px';
    el.style.color = resolveColor(st.color || 'ink');
    el.style.fontSize = (st.size || 15) + 'px';
    el.style.opacity = st.alpha ?? 1;
    const ax = { left: '0', center: '-50%', right: '-100%' }[st.align || 'center'];
    const ay = { top: '0', middle: '-50%', bottom: '-100%' }[st.baseline || 'middle'];
    el.style.transform = `translate(${ax}, ${ay})`;
    return this;
  }

  // ---------- rasters ----------
  /**
   * Per-pixel image: fn(x,y) → [r,g,b] or [r,g,b,a] (0–255) or null (transparent).
   * st.res = pixel block size (default 2); st.key = cache key (recompute only when it changes); st.id to cache several layers.
   */
  raster(fn, st = {}) {
    const res = st.res || 2; const w = Math.ceil(this.W / res), hh = Math.ceil(this.H / res);
    const id = st.id || 'r';
    const key = st.key != null ? `${w}x${hh}|${this.xr}|${this.yr}|${st.key}` : null;
    let ent = this._raster.get(id);
    if (!ent || key == null || ent.key !== key) {
      const off = ent?.canvas || document.createElement('canvas');
      off.width = w; off.height = hh;
      const oc = off.getContext('2d'); const img = oc.createImageData(w, hh); const d = img.data;
      for (let j = 0; j < hh; j++) {
        const y = this.invY((j + 0.5) * res);
        for (let i = 0; i < w; i++) {
          const x = this.invX((i + 0.5) * res); const k = 4 * (j * w + i);
          const col = fn(x, y);
          if (!col) { d[k + 3] = 0; continue; }
          d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = col.length > 3 ? col[3] : 255;
        }
      }
      oc.putImageData(img, 0, 0);
      ent = { key, canvas: off }; this._raster.set(id, ent);
    }
    const c = this.ctx; c.save(); c.globalAlpha = st.alpha ?? 1; c.imageSmoothingEnabled = res > 1; c.drawImage(ent.canvas, 0, 0, w * res, hh * res); c.restore();
    return this;
  }
  /** Scalar heat map: fn(x,y) → number, coloured by st.cmap ('viridis'|'magma'|'diverging') over st.range=[lo,hi]. */
  heat(fn, st = {}) {
    const [lo, hi] = st.range || [0, 1]; const name = st.cmap || 'viridis';
    return this.raster((x, y) => { const v = fn(x, y); if (!isFinite(v)) return null; return M.cmap((v - lo) / (hi - lo), name); }, st);
  }
  /** Domain colouring of a complex function f(z: Cx) → Cx (hue = argument, shading = log-modulus contours). */
  domain(f, st = {}) {
    const contours = st.contours ?? true, sat = st.saturation ?? 0.62, gridLines = st.gridLines ?? false;
    return this.raster((x, y) => {
      let w; try { w = f(new M.Cx(x, y)); } catch { return null; }
      const re = w.re ?? w[0], im = w.im ?? w[1];
      if (!isFinite(re) || !isFinite(im)) return [250, 250, 250];
      const mod = Math.hypot(re, im); let l = 0.52;
      if (contours) { const t = M.fract(Math.log2(mod + 1e-300)); l = 0.42 + 0.2 * Math.pow(t, 0.7); }
      if (gridLines) { const gx = Math.abs(M.fract(re + 0.5) - 0.5), gy = Math.abs(M.fract(im + 0.5) - 0.5); if (Math.min(gx, gy) < 0.03) l *= 0.6; }
      return M.hsl2rgb(Math.atan2(im, re) / M.TAU, sat, l);
    }, st);
  }

  // ---------- interaction ----------
  /**
   * Draggable point. Create it ONCE (outside render). Returns {x, y}; read h.x/h.y while drawing.
   * st: {color, r, label, constrain: (x,y)=>[x,y] | 'x' | 'y' | {x:[a,b], y:[c,d]}, onDrag(h)}
   */
  handle(x, y, st = {}) {
    const hd = { x, y, color: st.color || 'accent', r: st.r ?? 7, label: st.label, labelPos: st.labelPos, constrain: st.constrain, onDrag: st.onDrag, visible: true, dragging: false, hover: false };
    hd.set = (nx, ny) => { hd.x = nx; hd.y = ny; this.rt.invalidate(); };
    this.handles.push(hd);
    this.canvas.style.touchAction = 'none';
    return hd;
  }
  /** Free dragging anywhere on the canvas: fn(x, y, phase) with phase 'start' | 'move' | 'end'. */
  onDrag(fn) { this._drag.push(fn); this.canvas.style.touchAction = 'none'; this.canvas.style.cursor = 'crosshair'; return this; }
  onClick(fn) { this._click.push(fn); this.canvas.style.cursor = 'pointer'; return this; }
  _drawHandle(hd) {
    const c = this.ctx, X = this.X(hd.x), Y = this.Y(hd.y), r = hd.r;
    c.save();
    if (hd.dragging || hd.hover) { c.beginPath(); c.arc(X, Y, r + 6, 0, M.TAU); c.fillStyle = withAlpha(hd.color, 0.18); c.fill(); }
    c.beginPath(); c.arc(X, Y, r, 0, M.TAU); c.fillStyle = resolveColor(hd.color); c.fill();
    c.lineWidth = 2.2; c.strokeStyle = resolveColor('panel'); c.stroke();
    c.beginPath(); c.arc(X, Y, r * 0.32, 0, M.TAU); c.fillStyle = withAlpha('panel', 0.9); c.fill();
    c.restore();
    if (hd.label) this._labelAt(hd.label, X, Y, r + 5, hd.labelPos || 'ne', hd.color, { math: true });
  }
  _hit(px, py, rad) {
    let best = null, bd = rad;
    for (const hd of this.handles) { if (hd.visible === false) continue; const d = Math.hypot(this.X(hd.x) - px, this.Y(hd.y) - py); if (d <= bd + hd.r * 0.5) { bd = d; best = hd; } }
    return best;
  }
  _constrain(hd, x, y) {
    const k = hd.constrain;
    if (typeof k === 'function') { const r = k(x, y); if (r) [x, y] = r; }
    else if (k === 'x') y = hd.y;
    else if (k === 'y') x = hd.x;
    else if (k && typeof k === 'object') { if (k.x) x = M.clamp(x, k.x[0], k.x[1]); if (k.y) y = M.clamp(y, k.y[0], k.y[1]); }
    x = M.clamp(x, this.xr[0], this.xr[1]); y = M.clamp(y, this.yr[0], this.yr[1]);
    return [x, y];
  }
  _bind() {
    const cv = this.canvas;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', (e) => {
      const [px, py] = pos(e);
      this.pointer.down = true;
      const hd = this._hit(px, py, e.pointerType === 'touch' ? 24 : 14);
      this._downAt = [px, py, performance.now()];
      if (hd) {
        this._active = hd; hd.dragging = true; this._off = [this.X(hd.x) - px, this.Y(hd.y) - py];
        cv.setPointerCapture(e.pointerId); e.preventDefault(); cv.style.cursor = 'grabbing'; this.rt.invalidate(); return;
      }
      if (this._drag.length) { this._dragging = true; cv.setPointerCapture(e.pointerId); e.preventDefault(); const [x, y] = this.inv(px, py); this._drag.forEach((f) => f(x, y, 'start')); this.rt.invalidate(); }
    });
    cv.addEventListener('pointermove', (e) => {
      const [px, py] = pos(e); const [x, y] = this.inv(px, py);
      Object.assign(this.pointer, { x, y, px, py, inside: true });
      if (this._active) {
        const hd = this._active; const [nx, ny] = this._constrain(hd, this.invX(px + this._off[0]), this.invY(py + this._off[1]));
        hd.x = nx; hd.y = ny; hd.onDrag?.(hd); this.rt.invalidate(); return;
      }
      if (this._dragging) { this._drag.forEach((f) => f(x, y, 'move')); this.rt.invalidate(); return; }
      if (this.handles.length) {
        const hit = this._hit(px, py, 14); let changed = false;
        for (const hd of this.handles) { const v = hd === hit; if (hd.hover !== v) { hd.hover = v; changed = true; } }
        cv.style.cursor = hit ? 'grab' : this._drag.length ? 'crosshair' : this._click.length ? 'pointer' : 'default';
        if (changed) this.rt.invalidate();
      }
      if (this.o.hover) this.rt.invalidate();
    });
    const up = (e) => {
      const [px, py] = pos(e); const [x, y] = this.inv(px, py);
      this.pointer.down = false;
      if (this._active) { this._active.dragging = false; this._active = null; cv.style.cursor = 'grab'; this.rt.invalidate(); }
      else if (this._dragging) { this._dragging = false; this._drag.forEach((f) => f(x, y, 'end')); this.rt.invalidate(); }
      if (this._downAt && Math.hypot(px - this._downAt[0], py - this._downAt[1]) < 5 && performance.now() - this._downAt[2] < 600 && e.type === 'pointerup') { this._click.forEach((f) => f(x, y)); if (this._click.length) this.rt.invalidate(); }
      this._downAt = null;
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { this.pointer.inside = false; let ch = false; for (const hd of this.handles) if (hd.hover) { hd.hover = false; ch = true; } if (this.o.hover || ch) this.rt.invalidate(); });
  }
}

// ================================================================== 3D stage
class Stage3D {
  constructor(rt, opts = {}) {
    this.rt = rt;
    const o = this.o = Object.assign({ height: 380, range: 1.6, yaw: -0.65, pitch: 0.42, zoom: 1, persp: 7, axes: true, axisLength: null, labels: ['x', 'y', 'z'], title: null, weight: 1, minWidth: 280, drag: true }, opts);
    this.yaw = o.yaw; this.pitch = o.pitch; this.zoom = o.zoom;
    this.el = h('div', 'stage stage-3d');
    this.el.style.flex = o.full ? '1 1 100%' : `${o.weight} 1 ${o.minWidth}px`;
    if (o.title) { const t = h('div', 'stage-title'); t.innerHTML = inlineHTML(o.title); this.el.append(t); }
    this.box = h('div', 'stage-box'); this.canvas = h('canvas'); this.overlay = h('div', 'stage-overlay');
    this.box.append(this.canvas, this.overlay); this.el.append(this.box); rt.stagesEl.append(this.el);
    this.ctx = this.canvas.getContext('2d'); this.q = []; this._tex = []; this._texN = 0;
    this.W = 300; this.H = o.height;
    if (o.drag) this._bind();
    const hint = h('div', 'stage-hint'); hint.textContent = 'drag to rotate'; this.box.append(hint);
  }
  resize() {
    const W = Math.max(120, Math.round(this.box.clientWidth || 300));
    const HW = this.rt.stagesEl.clientWidth || W;
    const H = Math.round(Math.max(200, this.o.height * (HW < 560 ? Math.max(0.75, HW / 560) : 1)));
    if (W === this.W && H === this.H && this.canvas.width) return;
    this.W = W; this.H = H; const d = DPR();
    this.canvas.width = Math.round(W * d); this.canvas.height = Math.round(H * d);
    this.canvas.style.width = W + 'px'; this.canvas.style.height = H + 'px'; this.box.style.height = H + 'px';
  }
  _bind() {
    const cv = this.canvas; cv.style.touchAction = 'none'; cv.style.cursor = 'grab';
    let last = null;
    cv.addEventListener('pointerdown', (e) => { last = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
    cv.addEventListener('pointermove', (e) => {
      if (!last) return; const dx = e.clientX - last[0], dy = e.clientY - last[1]; last = [e.clientX, e.clientY];
      this.yaw -= dx * 0.009; this.pitch = M.clamp(this.pitch + dy * 0.009, -1.52, 1.52); this.rt.invalidate();
      this.box.classList.add('touched');
    });
    const up = () => { last = null; cv.style.cursor = 'grab'; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }
  /** Rotate world → view coordinates: returns [sx, sy, depth] before scaling. */
  _view([x, y, z]) {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const xr = x * cy - y * sy, yr = x * sy + y * cy;
    return [xr, z * cp + yr * sp, yr * cp - z * sp];
  }
  /** Project a world point to canvas pixels: [px, py, depth]. */
  project(p) {
    const [vx, vy, d] = this._view(p);
    const s = Math.min(this.W, this.H) / (2 * this.o.range) * this.zoom;
    const f = this.o.persp ? this.o.persp * this.o.range / (this.o.persp * this.o.range + d) : 1;
    return [this.W / 2 + vx * s * f, this.H / 2 - vy * s * f, d];
  }
  begin() {
    const c = this.ctx, d = DPR(); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, this.W, this.H); this.q = []; this._texN = 0;
    if (this.o.axes) this.axes();
  }
  end() {
    this.q.sort((a, b) => b.d - a.d);
    for (const it of this.q) it.f(this.ctx);
    this.q = [];
    for (let i = this._texN; i < this._tex.length; i++) this._tex[i].style.display = 'none';
  }
  _push(d, f) { this.q.push({ d, f }); }
  axes() {
    const L = this.o.axisLength ?? this.o.range * 0.95;
    const lab = this.o.labels;
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((e, i) => {
      this.line(e.map((v) => -v * L), e.map((v) => v * L), { color: 'faint', width: 1 });
      if (lab && lab[i]) this.text(lab[i], e.map((v) => v * L * 1.07), { color: 'muted', math: true });
    });
  }
  line(p, q, st = {}) {
    const P = this.project(p), Q = this.project(q);
    this._push((P[2] + Q[2]) / 2 + (st.bias || 0), (c) => {
      c.beginPath(); c.moveTo(P[0], P[1]); c.lineTo(Q[0], Q[1]);
      c.strokeStyle = withAlpha(st.color || 'ink', st.alpha); c.lineWidth = st.width ?? 2; c.lineCap = 'round';
      c.setLineDash(st.dash === true ? [5, 4] : st.dash || []); c.stroke(); c.setLineDash([]);
    });
    return this;
  }
  path(pts, st = {}) { for (let i = 0; i + 1 < pts.length; i++) if (pts[i] && pts[i + 1]) this.line(pts[i], pts[i + 1], st); if (st.close && pts.length > 2) this.line(pts[pts.length - 1], pts[0], st); return this; }
  curve(g, t0, t1, st = {}) { const n = st.n || 200; const pts = []; for (let i = 0; i <= n; i++) pts.push(g(t0 + (t1 - t0) * i / n)); return this.path(pts, st); }
  arrow(p, q, st = {}) {
    const P = this.project(p), Q = this.project(q);
    this._push((P[2] + Q[2]) / 2 + (st.bias || 0), (c) => {
      const L = Math.hypot(Q[0] - P[0], Q[1] - P[1]); if (L < 1) return;
      const ux = (Q[0] - P[0]) / L, uy = (Q[1] - P[1]) / L, hs = Math.min(st.head ?? 9, L * 0.45);
      const col = withAlpha(st.color || 'ink', st.alpha);
      c.beginPath(); c.moveTo(P[0], P[1]); c.lineTo(Q[0] - ux * hs * 0.8, Q[1] - uy * hs * 0.8); c.strokeStyle = col; c.lineWidth = st.width ?? 2; c.lineCap = 'round'; c.stroke();
      c.beginPath(); c.moveTo(Q[0], Q[1]); c.lineTo(Q[0] - ux * hs - uy * hs * 0.45, Q[1] - uy * hs + ux * hs * 0.45); c.lineTo(Q[0] - ux * hs + uy * hs * 0.45, Q[1] - uy * hs - ux * hs * 0.45); c.closePath(); c.fillStyle = col; c.fill();
    });
    return this;
  }
  dot(p, st = {}) {
    const P = this.project(p);
    this._push(P[2] - 1e-3 + (st.bias || 0), (c) => {
      c.beginPath(); c.arc(P[0], P[1], st.r ?? 4, 0, M.TAU); c.fillStyle = withAlpha(st.color || 'ink', st.alpha); c.fill();
      if (st.ring !== false) { c.lineWidth = 1.4; c.strokeStyle = withAlpha('panel', 0.9); c.stroke(); }
      if (st.label) { c.font = 'italic 15px Newsreader, serif'; c.fillStyle = resolveColor(st.labelColor || st.color || 'ink'); c.textBaseline = 'bottom'; c.fillText(st.label, P[0] + 7, P[1] - 4); }
    });
    return this;
  }
  text(str, p, st = {}) {
    const P = this.project(p);
    this._push(P[2] - 0.01, (c) => {
      c.font = st.math ? `italic ${st.size || 16}px Newsreader, serif` : `500 ${st.size || 12.5}px Inter, system-ui, sans-serif`;
      c.textAlign = st.align || 'center'; c.textBaseline = 'middle';
      c.lineWidth = 4; c.strokeStyle = withAlpha('panel', 0.85); c.strokeText(str, P[0] + (st.dx || 0), P[1] + (st.dy || 0));
      c.fillStyle = withAlpha(st.color || 'ink', st.alpha); c.fillText(str, P[0] + (st.dx || 0), P[1] + (st.dy || 0));
    });
    return this;
  }
  tex(latex, p, st = {}) {
    const P = this.project(p);
    let el = this._tex[this._texN]; if (!el) { el = h('div', 'tex-label'); this.overlay.append(el); this._tex.push(el); } this._texN++;
    if (el._src !== latex) { el.innerHTML = katexHTML(latex); el._src = latex; }
    el.style.display = ''; el.style.left = (P[0] + (st.dx || 0)) + 'px'; el.style.top = (P[1] + (st.dy || 0)) + 'px';
    el.style.color = resolveColor(st.color || 'ink'); el.style.fontSize = (st.size || 15) + 'px'; el.style.transform = 'translate(-50%,-50%)';
    return this;
  }
  /** Filled planar polygon (list of 3D points). */
  poly(pts, st = {}) {
    const P = pts.map((p) => this.project(p)); const d = P.reduce((s, p) => s + p[2], 0) / P.length;
    const col = st.fill || st.color || 'accent';
    this._push(d + (st.bias || 0), (c) => {
      c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
      c.fillStyle = withAlpha(col, st.fillAlpha ?? 0.3); c.fill();
      if (st.stroke !== false) { c.strokeStyle = withAlpha(st.color || col, st.alpha ?? 0.9); c.lineWidth = st.width ?? 1.2; c.stroke(); }
    });
    return this;
  }
  /**
   * Parametric surface F(u,v) → [x,y,z] over [u0,u1]×[v0,v1].
   * st: {nu, nv, color, alpha (fill opacity, default .85), wire (bool), colorFn(u,v,p) → colour, shade (default true)}
   */
  surface(F, [u0, u1], [v0, v1], st = {}) {
    const nu = st.nu || st.n || 28, nv = st.nv || st.n || 28;
    const G = [];
    for (let i = 0; i <= nu; i++) { G.push([]); for (let j = 0; j <= nv; j++) { const u = u0 + (u1 - u0) * i / nu, v = v0 + (v1 - v0) * j / nv; G[i].push([F(u, v), u, v]); } }
    const L = M.normalize([-0.35, 0.55, 0.75]);
    const base = rgbOf(st.color || 'accent');
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = G[i][j][0], b = G[i + 1][j][0], c2 = G[i + 1][j + 1][0], d = G[i][j + 1][0];
      if (![a, b, c2, d].every((p) => p && p.every(isFinite))) continue;
      const P = [a, b, c2, d].map((p) => this.project(p));
      const depth = (P[0][2] + P[1][2] + P[2][2] + P[3][2]) / 4;
      const nW = M.cross3(M.vsub(c2, a), M.vsub(d, b));
      const nV = this._view(nW); const nl = Math.hypot(...nV) || 1;
      const k = st.shade === false ? 1 : 0.42 + 0.58 * Math.abs((nV[0] * L[0] + nV[1] * L[1] - nV[2] * L[2]) / nl);
      let rgb = base;
      if (st.colorFn) { const cc = st.colorFn(G[i][j][1], G[i][j][2], a); rgb = rgbOf(cc); }
      const fill = `rgba(${Math.round(rgb[0] * k)},${Math.round(rgb[1] * k)},${Math.round(rgb[2] * k)},${st.alpha ?? 0.88})`;
      this._push(depth, (c) => {
        c.beginPath(); c.moveTo(P[0][0], P[0][1]); c.lineTo(P[1][0], P[1][1]); c.lineTo(P[2][0], P[2][1]); c.lineTo(P[3][0], P[3][1]); c.closePath();
        c.fillStyle = fill; c.fill();
        c.lineWidth = 0.6; c.strokeStyle = st.wire ? withAlpha(st.wireColor || 'ink', 0.25) : fill; c.stroke();
      });
    }
    return this;
  }
}

// ================================================================== controls
function controlBox(rt, cls) { const el = h('div', 'ctl ' + cls); rt.controlsEl.append(el); return el; }
function makeSlider(rt, label, min, max, value, o = {}) {
  const el = controlBox(rt, 'ctl-slider');
  const lab = h('span', 'ctl-label'); lab.innerHTML = inlineHTML(label);
  const input = h('input'); input.type = 'range';
  const log = !!o.log;
  const toInput = (x) => log ? Math.log10(x) : x, fromInput = (u) => log ? Math.pow(10, u) : u;
  input.min = toInput(min); input.max = toInput(max);
  input.step = log ? (toInput(max) - toInput(min)) / 400 : (o.step ?? (o.int ? 1 : (max - min) / 200));
  input.value = toInput(value);
  input.setAttribute('aria-label', label.replace(/\$/g, ''));
  const out = h('output', 'ctl-value');
  const step = o.step ?? (o.int ? 1 : (max - min) / 200);
  const decimals = o.decimals ?? Math.max(0, Math.min(4, -Math.floor(Math.log10(step) + 1e-9)));
  const format = o.fmt || ((x) => o.int ? String(Math.round(x)) : M.fix(x, decimals));
  const ctl = {
    el, input,
    get value() { const x = fromInput(+input.value); return o.int ? Math.round(x) : x; },
    set value(x) { input.value = toInput(x); sync(); },
    set(x) { input.value = toInput(x); sync(); rt.invalidate(); },
  };
  const sync = () => { out.textContent = format(ctl.value); };
  input.addEventListener('input', () => { sync(); o.onChange?.(ctl.value); rt.invalidate(); });
  sync(); el.append(lab, input, out);
  return ctl;
}
function makeToggle(rt, label, value, o = {}) {
  const el = controlBox(rt, 'ctl-toggle'); const lab = h('label', 'switch');
  const input = h('input'); input.type = 'checkbox'; input.checked = !!value;
  const knob = h('span', 'switch-track'); const txt = h('span', 'ctl-label'); txt.innerHTML = inlineHTML(label);
  lab.append(input, knob, txt); el.append(lab);
  input.addEventListener('change', () => { o.onChange?.(input.checked); rt.invalidate(); });
  return { el, get value() { return input.checked; }, set value(v) { input.checked = !!v; }, set(v) { input.checked = !!v; rt.invalidate(); } };
}
function makeSelect(rt, label, options, value, o = {}) {
  const el = controlBox(rt, 'ctl-select');
  if (label) { const lab = h('span', 'ctl-label'); lab.innerHTML = inlineHTML(label); el.append(lab); }
  const seg = h('div', 'seg'); el.append(seg);
  const opts = options.map((x) => typeof x === 'object' ? x : { value: x, label: String(x) });
  let cur = value ?? opts[0].value; const btns = [];
  const ctl = { el, get value() { return cur; }, set(v) { cur = v; sync(); rt.invalidate(); } };
  const sync = () => btns.forEach((b, i) => b.classList.toggle('on', opts[i].value === cur));
  opts.forEach((op) => {
    const b = h('button'); b.type = 'button'; b.innerHTML = inlineHTML(op.label);
    b.addEventListener('click', () => { cur = op.value; sync(); o.onChange?.(cur); rt.invalidate(); });
    btns.push(b); seg.append(b);
  });
  sync(); return ctl;
}
function makeButton(rt, label, fn) {
  const b = h('button', 'btn ctl-button'); b.type = 'button'; b.innerHTML = inlineHTML(label);
  b.addEventListener('click', () => { fn?.(); rt.invalidate(); });
  rt.controlsEl.append(b); return b;
}

// ================================================================== runtime
class Runtime {
  constructor(host) {
    this.host = host; host.innerHTML = ''; host.classList.add('viz');
    this.stagesEl = h('div', 'viz-stages');
    this.legendEl = h('div', 'viz-legend');
    this.controlsEl = h('div', 'viz-controls');
    this.readoutEl = h('div', 'viz-readout');
    host.append(this.stagesEl, this.legendEl, this.controlsEl, this.readoutEl);
    this.stages = []; this.draws = []; this.anim = null; this.t = 0; this.playing = false; this.visible = true; this.dirty = true;
    this.cleanups = []; this.readoutFn = null; this.raf = 0; this.last = 0; this.dead = false;
    this.loop = this.loop.bind(this);
    this.ro = new ResizeObserver(() => {
      if (this._rz) return;
      this._rz = requestAnimationFrame(() => { this._rz = 0; if (this.dead) return; for (const s of this.stages) s.resize(); this.invalidate(); });
    });
    this.ro.observe(host);
    this.io = new IntersectionObserver((ents) => { const e = ents[ents.length - 1]; this.visible = e.isIntersecting; if (this.visible) this.invalidate(); });
    this.io.observe(host);
    this.onTheme = () => { this.invalidate(); };
    window.addEventListener('themechange', this.onTheme);
    this.onPause = () => { if (this.anim) { this.playing = false; this._syncPlay(); this.invalidate(); } };
    window.addEventListener('vizpause', this.onPause);
    this.api = this.makeApi();
  }
  invalidate() { this.dirty = true; if (!this.raf && !this.dead) this.raf = requestAnimationFrame(this.loop); }
  loop(ts) {
    this.raf = 0; if (this.dead) return;
    const animating = !!(this.anim && this.playing && this.visible);
    if (animating) {
      const dt = this.last ? Math.min(0.05, (ts - this.last) / 1000) : 0; this.last = ts;
      this.t += dt * (this.anim.speed || 1);
      if (this.anim.period) { if (this.t >= this.anim.period) { if (this.anim.once) { this.t = this.anim.period; this.playing = false; this._syncPlay(); } else this.t %= this.anim.period; } }
    } else this.last = 0;
    if ((this.dirty || animating) && this.visible) { this.dirty = false; this.frame(); }
    if (((animating && this.playing) || (this.dirty && this.visible)) && !this.raf && !this.dead) this.raf = requestAnimationFrame(this.loop);
  }
  frame() {
    for (const s of this.stages) s.begin();
    try { for (const f of this.draws) f(this.t); }
    catch (e) { this.fail(e); return; }
    for (const s of this.stages) s.end();
    if (this.readoutFn) {
      let str; try { str = this.readoutFn(this.t); } catch (e) { this.fail(e); return; }
      if (str !== this._ro) { this._ro = str; this.readoutEl.innerHTML = inlineHTML(str); }
    }
    this.frames = (this.frames || 0) + 1;
  }
  fail(e) {
    console.error('[viz]', e);
    (window.__vizErrors ||= []).push(String(e && e.stack || e));
    this.dead = true;
    const box = h('div', 'viz-error'); box.textContent = 'This visualization hit an error: ' + (e && e.message || e);
    this.host.append(box);
  }
  _addPlay() {
    if (this.playBtn) return;
    const wrap = h('div', 'ctl ctl-play');
    const b = h('button', 'btn btn-icon play'); b.type = 'button';
    b.addEventListener('click', () => { this.playing = !this.playing; if (this.playing && this.anim.once && this.anim.period && this.t >= this.anim.period) this.t = 0; this._syncPlay(); this.invalidate(); });
    const r = h('button', 'btn btn-icon'); r.type = 'button'; r.title = 'Restart'; r.setAttribute('aria-label', 'Restart animation'); r.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    r.addEventListener('click', () => { this.t = 0; this.invalidate(); });
    wrap.append(b, r); this.controlsEl.prepend(wrap); this.playBtn = b; this._syncPlay();
  }
  _syncPlay() {
    if (!this.playBtn) return;
    this.playBtn.setAttribute('aria-label', this.playing ? 'Pause animation' : 'Play animation');
    this.playBtn.title = this.playing ? 'Pause' : 'Play';
    this.playBtn.innerHTML = this.playing
      ? '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 5l12 7-12 7z" fill="currentColor"/></svg>';
  }
  destroy() {
    this.dead = true; cancelAnimationFrame(this.raf); cancelAnimationFrame(this._rz); this.ro.disconnect(); this.io.disconnect();
    window.removeEventListener('themechange', this.onTheme); window.removeEventListener('vizpause', this.onPause);
    for (const f of this.cleanups) { try { f(); } catch { /* ignore */ } }
  }
  makeApi() {
    const rt = this;
    const api = {
      /** 2D canvas panel. Call several times for side-by-side panels. */
      stage(o) { const s = new Stage(rt, o); rt.stages.push(s); s.resize(); return s; },
      /** 3D panel (drag to rotate). */
      stage3d(o) { const s = new Stage3D(rt, o); rt.stages.push(s); s.resize(); return s; },
      /** Register a draw function, re-run whenever anything changes. */
      render(f) { rt.draws.push(f); rt.invalidate(); },
      /** Register an animated draw function f(t) (t in seconds). opts: {period, speed, autoplay, once}. */
      animate(f, o = {}) {
        rt.draws.push(f); rt.anim = { speed: 1, period: null, autoplay: true, ...o };
        rt.playing = rt.anim.autoplay !== false && !prefersReduced() && !window.__vizStill;
        if (window.__vizStill && o.still != null) rt.t = o.still;
        rt._addPlay(); rt.invalidate();
      },
      slider: (label, min, max, value, o) => makeSlider(rt, label, min, max, value, o),
      toggle: (label, value, o) => makeToggle(rt, label, value, o),
      select: (label, options, value, o) => makeSelect(rt, label, options, value, o),
      button: (label, fn) => makeButton(rt, label, fn),
      /** Live text under the panels; f(t) returns a rich string (TeX allowed). */
      readout(f) { rt.readoutFn = f; rt.invalidate(); },
      /** Legend: items = [[colour, label], ...] or [{color, label, dash, dot}]. */
      legend(items) {
        rt.legendEl.innerHTML = '';
        for (const it of items) {
          const [color, label, extra] = Array.isArray(it) ? it : [it.color, it.label, it];
          const sw = h('span', 'lg-swatch' + (extra?.dot ? ' dot' : '') + (extra?.dash ? ' dash' : '') + (extra?.area ? ' area' : ''));
          sw.style.setProperty('--sw', resolveColor(color));
          const lab = h('span', 'lg-label'); lab.innerHTML = inlineHTML(label);
          const item = h('span', 'lg-item'); item.append(sw, lab); rt.legendEl.append(item);
        }
      },
      get t() { return rt.t; },
      set t(x) { rt.t = x; rt.invalidate(); },
      get playing() { return rt.playing; },
      play() { rt.playing = true; rt._syncPlay(); rt.invalidate(); },
      pause() { rt.playing = false; rt._syncPlay(); },
      restart() { rt.t = 0; rt.invalidate(); },
      invalidate: () => rt.invalidate(),
      /** Palette colour (optionally with alpha) as a CSS string. */
      color: (name, alpha) => withAlpha(name, alpha),
      rgb: (name) => rgbOf(name),
      mix,
      onCleanup: (f) => rt.cleanups.push(f),
      M, Cx: M.Cx, cx: M.cx, rng: M.rng, fmt: M.fmt, fix: M.fix, sci: M.sci,
      tex: katexHTML,
    };
    // add-on kits (assets/js/viz/kits): each is make(api, rt, ...args)
    for (const [name, make] of Object.entries(KITS)) api[name] = (...args) => make(api, rt, ...args);
    return api;
  }
}

/**
 * Mount a visualization into `host`. Returns a destroy() function.
 * `vizFn(v)` sets up stages/controls and registers render/animate callbacks.
 */
export function mount(host, vizFn) {
  const rt = new Runtime(host);
  try { vizFn(rt.api); } catch (e) { rt.fail(e); }
  rt.invalidate();
  return () => rt.destroy();
}
