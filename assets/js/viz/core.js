// Visualization runtime. A theorem's `viz(v)` function receives the API built by
// `mount()` below; see AUTHORING.md for the full reference and examples.
import * as M from './math.js';
import { KITS } from './kits/index.js';
import { StateRegistry } from '../share-state.js';

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
/** Interpolate between two theme colours in linear light (t clamped to [0,1]) → [r,g,b] 0–255. */
export function themeRamp(t, to, from) {
  const a = rgbOf(from), b = rgbOf(to), u = Math.max(0, Math.min(1, +t || 0));
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const enc = (c) => Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
  return [0, 1, 2].map((k) => enc(lin(a[k]) + (lin(b[k]) - lin(a[k])) * u));
}
/** [r,g,b,a] (0–255, a in 0–1) of a palette name or any CSS colour. */
function rgbOf(c) {
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
/** "$5 and $10" is money, "$0 < x$" is maths: money when the $ count is odd, or when some $…$ pair reads like prices (a digit-led span followed by a plain word, with no TeX syntax inside). */
function looksLikeMoney(t) {
  const n = (t.match(/(^|[^\\])\$/g) || []).length; if (n % 2) return /\$\d/.test(t);
  for (const m of t.matchAll(/\$([^$]+)\$/g)) if (/^\d[\d,.]*\s/.test(m[1]) && /[A-Za-z]{2,}/.test(m[1]) && !/[\\^_{}=<>]/.test(m[1])) return true;
  return false;
}
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
  tex = String(tex).replace(/(?<!\\)%/g, '\\%'); // a bare % would start a TeX comment and swallow the rest of the line
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
export function richHTML(src, { lists = true, lineWrap = true } = {}) {
  if (src == null) return '';
  const maths = [];
  // \$ outside math is a literal dollar sign (inside math it is KaTeX's own \$)
  let raw = String(src), esc = '';
  if (raw.includes('\\$')) {
    for (let i = 0, inMath = false; i < raw.length; i++) {
      if (raw[i] === '\\' && raw[i + 1] === '$') { esc += inMath ? '\\$' : '\u0002'; i++; continue; }
      if (raw[i] === '\\') { esc += raw[i] + (raw[i + 1] ?? ''); i++; continue; }
      if (raw[i] === '$') { if (raw[i + 1] === '$') { esc += '$$'; i++; } else esc += '$'; inMath = !inMath; continue; }
      esc += raw[i];
    }
    raw = esc;
  }
  let s = raw.replace(/\$\$([\s\S]+?)\$\$|\$((?:\\.|[^$\\])+?)\$/g, (_, d, i) => {
    maths.push(d != null ? katexHTML(d.trim(), true) : katexHTML(i, false));
    return `\u0000${maths.length - 1}\u0000`;
  });
  s = escapeHTML(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, '$1<em>$2</em>');
  const paras = s.split(/\n\s*\n/).map((p) => {
    const lines = p.split('\n');
    const html = []; let buf = [];
    const flush = () => { if (buf.length) { html.push(lineWrap ? `<span class="rich-line">${buf.join(' ')}</span>` : buf.join(' ')); buf = []; } };
    for (const raw of lines) {
      const line = raw.trim();
      const m = lists && line.match(/^(\((?:[a-z]|[ivx]+|\d+)\)|-)\s+(.*)$/);
      if (m) { flush(); html.push(`<span class="rich-item"><span class="rich-tag">${m[1] === '-' ? '•' : m[1]}</span><span class="rich-body">${m[2]}</span></span>`); }
      else if (line) { if (buf.length === 0 && html.length && html[html.length - 1].startsWith('<span class="rich-item"') && !/^[A-Z]/.test(line)) { /* continuation of item */ html[html.length - 1] = html[html.length - 1].replace(/<\/span><\/span>$/, ` ${line}</span></span>`); } else buf.push(line); }
    }
    flush();
    return `<p>${html.join('')}</p>`;
  }).join('');
  return paras.replace(/\u0000(\d+)\u0000/g, (_, k) => maths[+k]).replace(/\u0002/g, '$');
}
export function renderRich(el, src) { el.innerHTML = richHTML(src); }
/** Inline-only variant (no <p> wrapper), for labels. */
export function inlineHTML(src) { return richHTML(src, { lists: false, lineWrap: false }).replace(/^<p>/, '').replace(/<\/p>$/, '').replace(/<\/p><p>/g, ' '); }

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
      xlog: false, ylog: false,
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
    rt.ro?.observe(this.box); // re-measure when shown again or resized by a neighbour
    this.el.append(this.box);
    rt.stagesEl.append(this.el);
    this.ctx = this.canvas.getContext('2d');
    this.handles = []; this._tex = []; this._texN = 0; this._raster = new Map();
    this._drag = []; this._click = []; this._hoverFns = [];
    this.pointer = { x: NaN, y: NaN, px: NaN, py: NaN, inside: false, down: false };
    this.W = 300; this.H = o.height;
    this._fit();
    this._bind();
    this.canvas.style.touchAction = 'pan-y';
  }
  setTitle(s) {
    if (!this.titleEl) { this.titleEl = h('div', 'stage-title'); this.el.prepend(this.titleEl); }
    if (this.titleEl._src !== s) { this.titleEl.innerHTML = inlineHTML(s); this.titleEl._src = s; }
  }
  /** Replace the custom ticks (same format as the xticks/yticks options; null = automatic). */
  setTicks(xticks, yticks) { const k = (t) => JSON.stringify(t ?? null); let ch = false; if (xticks !== undefined && k(xticks) !== k(this.o.xticks)) { this.o.xticks = xticks; ch = true; } if (yticks !== undefined && k(yticks) !== k(this.o.yticks)) { this.o.yticks = yticks; ch = true; } if (ch) this.rt.invalidate(); return this; }
  /** Change the axis labels (undefined = keep, null = none), e.g. per mode. */
  setLabels(xlabel, ylabel) { let ch = false; if (xlabel !== undefined && xlabel !== this.o.xlabel) { this.o.xlabel = xlabel; ch = true; } if (ylabel !== undefined && ylabel !== this.o.ylabel) { this.o.ylabel = ylabel; ch = true; } if (ch) { if (this.o.gutter) this._fit(); if (!this.rt._inFrame) this.rt.invalidate(); } return this; } // a gutter re-reserves room for a newly added label
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
  /**
   * Contour lines of f(x, y) by marching squares. levels: number or array. st: {color, alpha, width, dash, res (cells across), labels, fmt}.
   * Saddle cells are resolved with the cell-centre value.
   */
  contour(f, levels, st = {}) {
    const Ls = Array.isArray(levels) ? levels : [levels];
    const nx = Math.max(8, Math.round(st.res ?? 120)), ny = Math.max(8, Math.round(nx * this.H / Math.max(1, this.W)));
    const [x0, x1] = this.xr, [y0, y1] = this.yr, dx = (x1 - x0) / nx, dy = (y1 - y0) / ny;
    const F = new Float64Array((nx + 1) * (ny + 1));
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) F[j * (nx + 1) + i] = f(x0 + i * dx, y0 + j * dy);
    const c = this.ctx; c.save(); c.strokeStyle = withAlpha(st.color || 'muted', st.alpha ?? 1); c.lineWidth = st.width ?? 1.2; c.setLineDash(st.dash || []);
    const fmt = st.fmt || ((v) => M.fix(v, 2));
    const SEG = { 1: [['s', 'w']], 2: [['s', 'e']], 3: [['w', 'e']], 4: [['e', 'n']], 6: [['s', 'n']], 7: [['w', 'n']], 8: [['w', 'n']], 9: [['s', 'n']], 11: [['e', 'n']], 12: [['w', 'e']], 13: [['s', 'e']], 14: [['s', 'w']] };
    for (const L of Ls) {
      c.beginPath(); let lab = null;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const a = F[j * (nx + 1) + i] - L, b = F[j * (nx + 1) + i + 1] - L, d = F[(j + 1) * (nx + 1) + i] - L, e = F[(j + 1) * (nx + 1) + i + 1] - L;
        if (!(isFinite(a) && isFinite(b) && isFinite(d) && isFinite(e))) continue;
        const code = (a > 0) | ((b > 0) << 1) | ((e > 0) << 2) | ((d > 0) << 3); if (code === 0 || code === 15) continue;
        const X = x0 + i * dx, Y = y0 + j * dy;
        const pts = { s: [X + dx * a / (a - b), Y], e: [X + dx, Y + dy * b / (b - e)], n: [X + dx * d / (d - e), Y + dy], w: [X, Y + dy * a / (a - d)] };
        const up = (a + b + d + e) / 4 > 0;
        const segs = code === 5 ? (up ? [['s', 'e'], ['n', 'w']] : [['s', 'w'], ['e', 'n']]) : code === 10 ? (up ? [['s', 'w'], ['e', 'n']] : [['s', 'e'], ['n', 'w']]) : SEG[code];
        for (const [p, q] of segs) { const P = pts[p], Q = pts[q]; c.moveTo(this.X(P[0]), this.Y(P[1])); c.lineTo(this.X(Q[0]), this.Y(Q[1])); if (!lab && i > nx * 0.3 && i < nx * 0.7) lab = P; }
      }
      c.stroke();
      if (st.labels && lab) this.textPx(fmt(L), this.X(lab[0]), this.Y(lab[1]), { size: 10.5, color: st.color || 'muted', align: 'center' });
    }
    c.restore(); return this;
  }
  /** Run fn with drawing clipped to a data rectangle (default: the current window), e.g. s.clip(() => s.curve(f)). */
  clip(fn, x = this.xr, y = this.yr) {
    const c = this.ctx, a = this._px(x[0]), b = this._px(x[1]), p = this._py(y[0]), q = this._py(y[1]);
    c.save(); c.beginPath(); c.rect(Math.min(a, b), Math.min(p, q), Math.abs(b - a), Math.abs(q - p)); c.clip();
    try { fn(); } finally { c.restore(); }
    return this;
  }
  /** Change the visible window (data coordinates). */
  setView(x, y) {
    const close = (u, v) => Math.abs(u - v) <= 1e-12 * Math.max(1e-300, Math.abs(u), Math.abs(v)); // relative, so tiny log-axis limits still update
    const same = (a, b) => !a || (close(a[0], b[0]) && close(a[1], b[1]));
    if (same(x, this.view.x) && same(y, this.view.y)) return;
    if (x) this.view.x = [...x]; if (y) this.view.y = [...y]; this._fit(); this.rt.invalidate();
  }
  /** Switch either axis between linear and log (and equal/unequal aspect) in place, optionally with a new window: s.setScale({ylog: true, y: [1e-6, 1]}), s.setScale({equal: true}). Cheap to call every frame. */
  setScale({ xlog, ylog, x, y, equal } = {}) {
    const same = (xlog === undefined || !!xlog === !!this.o.xlog) && (ylog === undefined || !!ylog === !!this.o.ylog) && (equal === undefined || !!equal === !!this.o.equal);
    if (xlog !== undefined) this.o.xlog = !!xlog; if (ylog !== undefined) this.o.ylog = !!ylog; if (equal !== undefined) this.o.equal = !!equal;
    if (same) { if (x || y) this.setView(x, y); return this; }
    if (x) this.view.x = [...x]; if (y) this.view.y = [...y];
    for (const [k, on] of [['x', this.o.xlog], ['y', this.o.ylog]]) if (on && !(this.view[k][0] > 0 && this.view[k][1] > 0)) {
      const hi = Math.max(this.view[k][1], 1); this.view[k] = [hi * 1e-3, hi]; // a log window must be positive
    }
    this._fit(); this.rt.invalidate(); return this;
  }
  _fit() {
    // margins: pad on every side, or with gutter: true room outside the data area for tick and axis labels (box axes)
    const pad = this.o.pad || 0, gt = this.o.gutter, G = gt === true ? {} : gt || null;
    const m = this._m = G ? { l: G.l ?? 42, r: G.r ?? 12, t: G.t ?? (this.o.ylabel ? 34 : 10), b: G.b ?? (this.o.xlabel ? 42 : 24) } : { l: pad, r: pad, t: pad, b: pad }; // axis labels get their own row
    const W = this.W - m.l - m.r, H = this.H - m.t - m.b;
    // log axes: everything below works in log10 units; xr/yr (and bounds) stay in actual units
    const lx = this.lx = !!this.o.xlog, ly = this.ly = !!this.o.ylog;
    let [x0, x1] = this.view.x, [y0, y1] = this.view.y;
    if (lx) { x0 = Math.log10(x0); x1 = Math.log10(x1); }
    if (ly) { y0 = Math.log10(y0); y1 = Math.log10(y1); }
    if (this.o.equal) {
      const s = Math.min(W / (x1 - x0), H / (y1 - y0));
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = W / s / 2, hh = H / s / 2;
      x0 = cx - hw; x1 = cx + hw; y0 = cy - hh; y1 = cy + hh;
      this.xr = [lx ? 10 ** x0 : x0, lx ? 10 ** x1 : x1]; this.yr = [ly ? 10 ** y0 : y0, ly ? 10 ** y1 : y1];
    } else { this.xr = [...this.view.x]; this.yr = [...this.view.y]; }
    this._x0 = x0; this._y0 = y0;
    this.sx = W / (x1 - x0); this.sy = H / (y1 - y0);
  }
  // transforms (pixels per data unit sx/sy are per decade on a log axis)
  X(x) { return this._m.l + ((this.lx ? Math.log10(x) : x) - this._x0) * this.sx; }
  Y(y) { return this.H - this._m.b - ((this.ly ? Math.log10(y) : y) - this._y0) * this.sy; }
  invX(px) { const u = this._x0 + (px - this._m.l) / this.sx; return this.lx ? 10 ** u : u; }
  invY(py) { const u = this._y0 + (this.H - this._m.b - py) / this.sy; return this.ly ? 10 ** u : u; }
  // like X/Y, but a non-positive value on a log axis maps just outside the panel (left / bottom edge) instead of NaN
  _px(x) { return this.lx && !(x > 0) ? -2 : this.X(x); }
  _py(y) { return this.ly && !(y > 0) ? this.H + 2 : this.Y(y); }
  /** A data interval reaching far beyond the view along an axis (for infinite lines). */
  _far(axis) {
    const [a, b] = axis === 'x' ? this.xr : this.yr;
    if (axis === 'x' ? this.lx : this.ly) { const r = b / a; return [a / r, b * r]; }
    return [a - 1e3 * (b - a), b + 1e3 * (b - a)];
  }
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
    if (this.o.gutter) { const m = this._m; c.save(); c.beginPath(); c.rect(m.l, m.t, this.W - m.l - m.r, this.H - m.t - m.b); c.clip(); this._clipped = true; } // keep data out of the label gutter
  }
  end() {
    if (this._clipped) { this.ctx.restore(); this._clipped = false; }
    for (const hd of this.handles) if (hd.visible !== false) this._drawHandle(hd);
    for (let i = this._texN; i < this._tex.length; i++) this._tex[i].style.display = 'none';
  }

  // ---------- axes & grid ----------
  _ticks(axis) {
    const custom = axis === 'x' ? this.o.xticks : this.o.yticks;
    const [a, b] = axis === 'x' ? this.xr : this.yr;
    if (custom) return custom.map((t) => Array.isArray(t) ? t : [t, tickLabel(t, 1e-3).replace(/\.?0+$/, '')]).filter(([v]) => v >= a - 1e-9 && v <= b + 1e-9);
    if (axis === 'x' ? this.lx : this.ly) return this._logTicks(axis).major;
    const px = axis === 'x' ? this.W : this.H;
    const step = niceStep(b - a, px, axis === 'x' ? 90 : 60);
    const out = [];
    for (let v = Math.ceil(a / step) * step; v <= b + step * 1e-9; v += step) out.push([v, tickLabel(v, step)]);
    return out;
  }
  /**
   * Ticks of a log axis → {major: [[v, label]], minor: [v]}. Labels decades (1, 10, 100, 1k … or 10ⁿ for wide ranges),
   * adds 2·10ᵏ, 5·10ᵏ (or every mantissa) when there is room, thins to every n-th decade when crowded,
   * and falls back to linear nice steps on a sub-decade window. Minor ticks: the remaining m·10ᵏ (m = 2…9) when they fit.
   */
  _logTicks(axis) {
    const isX = axis === 'x', [a, b] = isX ? this.xr : this.yr, px = isX ? this.W : this.H;
    const la = Math.log10(a), lb = Math.log10(b), out = { major: [], minor: [] };
    if (!(lb > la) || !isFinite(la) || !isFinite(lb)) return out;
    const ppd = px / (lb - la), inR = (v) => v >= a * (1 - 1e-9) && v <= b * (1 + 1e-9);
    const k0 = Math.floor(la), k1 = Math.ceil(lb), kLo = Math.ceil(la - 1e-9), kHi = Math.floor(lb + 1e-9), decades = kHi - kLo + 1;
    const pow = Math.floor(la + 1e-9) < -3 || kHi > 5; // 10ⁿ labels outside 0.001 … 100k
    const label = (v) => {
      const k = Math.floor(Math.log10(v) + 1e-9), m = Number((v / 10 ** k).toPrecision(6));
      if (pow) return (m === 1 ? '' : m + '×') + M.pow10Text(k);
      return v >= 1000 ? Number((v / 1000).toPrecision(6)) + 'k' : String(Number(v.toPrecision(6)));
    };
    // spacing needed between labelled ticks: label width on x (≈ 6.3 px per character), a fixed row height on y
    const need = (vs) => (isX ? Math.max(28, 6.3 * Math.max(...vs.map((v) => label(v).length)) + 16) : 30);
    const interior = (vs) => vs.filter((v) => { const q = (Math.log10(v) - la) * ppd; return q >= 8 && q <= px - 8; }).length;
    const mant = (set) => { const vs = []; for (let k = k0; k <= k1; k++) for (const m of set) { const v = m * 10 ** k; if (inR(v)) vs.push(v); } return vs; };
    const sets = pow && decades >= 2 ? [[1]] : [[1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 5], [1, 3], [1]];
    let major = null;
    for (const set of sets) {
      const vs = mant(set); let g = Infinity;
      for (let i = 1; i < vs.length; i++) g = Math.min(g, Math.log10(vs[i] / vs[i - 1]) * ppd);
      if (vs.length >= 2 && interior(vs) >= 2 && g >= need(vs)) { major = vs; break; }
    }
    if (!major && decades >= 2) { // crowded: label every n-th decade, the others become minor ticks
      const dec = []; for (let k = kLo; k <= kHi; k++) dec.push(10 ** k);
      let n = Math.ceil(need(dec) / ppd); n = [1, 2, 3, 5, 10, 20, 25, 50, 100].find((s) => s >= n) ?? n;
      major = []; for (let k = kLo; k <= kHi; k++) (M.mod(k, n) === 0 ? major : out.minor).push(10 ** k);
    }
    if (!major) { // less than a decade visible: linear nice steps
      const step = niceStep(b - a, px, isX ? 90 : 60);
      for (let v = Math.ceil(a / step) * step; v <= b + step * 1e-9; v += step) out.major.push([v, tickLabel(v, step)]);
      return out;
    }
    out.major = major.map((v) => [v, label(v)]);
    if (ppd * Math.log10(10 / 9) >= 3.5) { const has = new Set(major.map((v) => v.toPrecision(8))); for (const v of mant([1, 2, 3, 4, 5, 6, 7, 8, 9])) if (!has.has(v.toPrecision(8))) out.minor.push(v); }
    return out;
  }
  grid(st = {}) {
    const c = this.ctx; c.save(); c.strokeStyle = resolveColor(st.color || 'grid'); c.lineWidth = 1; c.setLineDash([]);
    if (this.o.gutter) { const m = this._m; c.beginPath(); c.rect(m.l, m.t, this.W - m.l - m.r, this.H - m.t - m.b); c.clip(); } // grid stays inside the data area
    c.beginPath();
    for (const [v] of this._ticks('x')) { const x = Math.round(this.X(v)) + 0.5; c.moveTo(x, 0); c.lineTo(x, this.H); }
    for (const [v] of this._ticks('y')) { const y = Math.round(this.Y(v)) + 0.5; c.moveTo(0, y); c.lineTo(this.W, y); }
    c.stroke();
    if ((this.lx && !this.o.xticks) || (this.ly && !this.o.yticks)) { // fainter minor grid on log axes
      c.beginPath();
      if (this.lx && !this.o.xticks) for (const v of this._logTicks('x').minor) { const x = Math.round(this.X(v)) + 0.5; c.moveTo(x, 0); c.lineTo(x, this.H); }
      if (this.ly && !this.o.yticks) for (const v of this._logTicks('y').minor) { const y = Math.round(this.Y(v)) + 0.5; c.moveTo(0, y); c.lineTo(this.W, y); }
      c.globalAlpha = 0.45; c.stroke();
    }
    c.restore();
  }
  axes() {
    const c = this.ctx, o = this.o;
    const box = o.axes === 'box';
    const y0 = box || this.yr[0] > 0 || this.yr[1] < 0 ? this.yr[0] : 0;
    const x0 = box || this.xr[0] > 0 || this.xr[1] < 0 ? this.xr[0] : 0;
    const ax = Math.round(this.Y(y0)) + 0.5, ay = Math.round(this.X(x0)) + 0.5;
    c.save();
    c.strokeStyle = resolveColor('faint'); c.lineWidth = 1; c.setLineDash([]);
    c.beginPath(); if (o.gutter) { const m = this._m; c.moveTo(ay, ax); c.lineTo(this.W - m.r, ax); c.moveTo(ay, ax); c.lineTo(ay, m.t); } else { c.moveTo(0, ax); c.lineTo(this.W, ax); c.moveTo(ay, 0); c.lineTo(ay, this.H); } c.stroke();
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
      const left = ay - 26 > 0; let yLabW = 0;
      const yMax = (this.lx || this.ly) && !below ? this.H - 22 : this.H - 8; // log axes: keep the bottom-left corner for the x labels
      for (const [v, lab] of this._ticks('y')) {
        const y = this.Y(v); if (Math.abs(v - y0) < 1e-12 && !box) continue; if (y < 8 || y > yMax) continue;
        c.beginPath(); c.moveTo(ay - 3, y); c.lineTo(ay + 3, y); c.stroke();
        c.textAlign = left ? 'right' : 'left'; c.fillText(lab, left ? ay - 6 : ay + 6, y);
        if (!left) yLabW = Math.max(yLabW, c.measureText(lab).width);
      }
      this._labOff = { x: below ? 0 : 15, y: left ? 0 : yLabW + 6 }; // tick labels inside the panel push the axis labels inward
      if ((this.lx && !o.xticks) || (this.ly && !o.yticks)) { // unlabelled minor ticks on log axes
        c.beginPath();
        if (this.lx && !o.xticks) for (const v of this._logTicks('x').minor) { const x = this.X(v); if (x > 2 && x < this.W - 2) { c.moveTo(x, ax - 2); c.lineTo(x, ax + 2); } }
        if (this.ly && !o.yticks) for (const v of this._logTicks('y').minor) { const y = this.Y(v); if (y > 2 && y < this.H - 2) { c.moveTo(ay - 2, y); c.lineTo(ay + 2, y); } }
        c.stroke();
      }
    }
    c.font = 'italic 15px Newsreader, "Times New Roman", serif'; c.fillStyle = resolveColor('muted');
    const off = o.ticks ? this._labOff || { x: 0, y: 0 } : { x: 0, y: 0 };
    // labels with $…$ go through the KaTeX overlay ('$t$ (s)' mixes text and math; '$\\omega$' is pure TeX)
    const lab = (str, X, Y, align, baseline) => {
      const t = String(str), pure = /^\$[^$]+\$$/.test(t);
      if (/\$[^$]+\$/.test(t)) this.texPx(pure ? t.slice(1, -1) : t, X, Y, { color: 'muted', size: 15, align, baseline, rich: !pure });
      else { c.textAlign = align; c.textBaseline = baseline; c.fillText(t, X, Y); }
    };
    if (o.gutter) { const m = this._m; if (o.xlabel) lab(o.xlabel, m.l + (this.W - m.l - m.r) / 2, this.H - 3, 'center', 'bottom'); if (o.ylabel) lab(o.ylabel, Math.max(4, ay - 30), 3, 'left', 'top'); } // x label centred under the ticks, y label above the axis
    else {
    if (o.xlabel) lab(o.xlabel, this.W - 6, ax - 5 - off.x, 'right', 'bottom');
    if (o.ylabel) lab(o.ylabel, ay + 7 + off.y, 5, 'left', 'top');
    }
    c.restore();
  }

  // ---------- style plumbing ----------
  _paint(st, defStroke = true, defWidth = 2) {
    const c = this.ctx;
    if (st.fill) { c.fillStyle = withAlpha(st.fill === true ? (st.color || 'ink') : st.fill, st.fillAlpha ?? 0.18); c.fill(st.evenodd ? 'evenodd' : 'nonzero'); }
    const doStroke = st.stroke !== false && st.width !== 0 && (st.color != null || st.width != null || (defStroke && !st.fill)); // canvas ignores lineWidth = 0, so width 0 means no stroke
    if (doStroke) {
      c.strokeStyle = withAlpha(st.color || 'ink', st.alpha);
      c.lineWidth = st.width ?? defWidth;
      c.setLineDash(st.dash === true ? [6, 5] : st.dash || []);
      c.lineCap = st.cap || 'round'; c.lineJoin = 'round';
      c.stroke();
      c.setLineDash([]);
    }
    if (st.hatch) { // diagonal hatching inside the current path, last, because drawing it replaces the path: hatch: true | colour, hatchGap px, hatchAngle degrees
      c.save(); c.clip(st.evenodd ? 'evenodd' : 'nonzero');
      const gap = st.hatchGap ?? 6, a = ((st.hatchAngle ?? 45) * Math.PI) / 180, L = Math.hypot(this.W, this.H);
      c.strokeStyle = withAlpha(st.hatch === true ? (st.color || 'ink') : st.hatch, st.hatchAlpha ?? 0.55); c.lineWidth = st.hatchWidth ?? 1; c.setLineDash([]);
      c.beginPath(); const ux = Math.cos(a), uy = -Math.sin(a), nx = -uy, ny = ux;
      for (let k = -L; k <= L; k += gap) { const cx = this.W / 2 + nx * k, cy = this.H / 2 + ny * k; c.moveTo(cx - ux * L, cy - uy * L); c.lineTo(cx + ux * L, cy + uy * L); }
      c.stroke(); c.restore();
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
      if (!p || !Number.isFinite(p[0]) || !Number.isFinite(p[1]) || (this.lx && !(p[0] > 0)) || (this.ly && !(p[1] > 0))) { pen = false; continue; }
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
    let lo, hi;
    if (this.lx) { // sample uniformly in log10(x)
      const l0 = Math.log10(this.xr[0]), l1 = Math.log10(this.xr[1]), m = (l1 - l0) * 0.02;
      lo = Math.max(a > 0 ? Math.log10(a) : -Infinity, l0 - m); hi = Math.min(b > 0 ? Math.log10(b) : -Infinity, l1 + m);
    } else { lo = Math.max(a, this.xr[0] - (this.xr[1] - this.xr[0]) * 0.02); hi = Math.min(b, this.xr[1] + (this.xr[1] - this.xr[0]) * 0.02); }
    if (!(hi > lo)) return this;
    const n = st.n || Math.max(240, Math.ceil(this.W * 1.5));
    const pts = []; let prev = null;
    const lim = this.H * 4;
    for (let i = 0; i <= n; i++) {
      const u = lo + (hi - lo) * i / n, x = this.lx ? 10 ** u : u; let y;
      try { y = f(x); } catch { y = NaN; }
      const py = this.Y(y);
      const bad = !isFinite(y) || Math.abs(py) > lim + this.H || py !== py;
      if (bad) { if (prev) pts.push(null); prev = null; continue; }
      if (prev && Math.abs(py - prev) > this.H * 0.8 && !st.connect) pts.push(null);
      pts.push([x, y]); prev = py;
    }
    if (st.fill) {
      const base = st.base ?? 0; const c = this.ctx, Yb = this._py(base);
      let run = [];
      const flushFill = () => { if (run.length > 1) { c.beginPath(); c.moveTo(this.X(run[0][0]), Yb); run.forEach((p) => c.lineTo(this.X(p[0]), this.Y(p[1]))); c.lineTo(this.X(run[run.length - 1][0]), Yb); c.closePath(); c.fillStyle = withAlpha(st.fill === true ? st.color || 'ink' : st.fill, st.fillAlpha ?? 0.18); c.fill(); } run = []; };
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
    const lg = this.lx && a > 0 && b > 0;
    for (let i = 0; i <= n; i++) { const x = lg ? a * (b / a) ** (i / n) : a + (b - a) * i / n; top.push([x, f(x)]); bot.push([x, g(x)]); }
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
    const c = this.ctx; const X0 = this._px(x0), X1 = this._px(x1), Y0 = this._py(y0), Y1 = this._py(y1);
    const x = Math.min(X0, X1), y = Math.min(Y0, Y1), w = Math.abs(X1 - X0), h = Math.abs(Y1 - Y0), r = Math.min(st.radius ?? 0, w / 2, h / 2);
    c.beginPath(); if (r > 0 && c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); this._paint(st); return this;
  }
  /** Vertical strip a ≤ x ≤ b across the whole view (e.g. a δ-neighbourhood). */
  vband(a, b, st = {}) { const c = this.ctx; c.beginPath(); const m = this.o.gutter ? this._m : { t: 0, b: 0 }; c.rect(this._px(a), m.t, this._px(b) - this._px(a), this.H - m.t - m.b); c.fillStyle = withAlpha(st.color || 'accent', st.alpha ?? 0.12); c.fill(); if (st.edges) { this.vline(a, { color: st.color || 'accent', width: 1, dash: true, alpha: 0.7 }); this.vline(b, { color: st.color || 'accent', width: 1, dash: true, alpha: 0.7 }); } return this; }
  /** Horizontal strip a ≤ y ≤ b (e.g. an ε-band). */
  hband(a, b, st = {}) { const c = this.ctx; c.beginPath(); const m = this.o.gutter ? this._m : { l: 0, r: 0 }; c.rect(m.l, this._py(b), this.W - m.l - m.r, this._py(a) - this._py(b)); c.fillStyle = withAlpha(st.color || 'accent', st.alpha ?? 0.12); c.fill(); if (st.edges) { this.hline(a, { color: st.color || 'accent', width: 1, dash: true, alpha: 0.7 }); this.hline(b, { color: st.color || 'accent', width: 1, dash: true, alpha: 0.7 }); } return this; }
  vline(x, st = {}) { const [lo, hi] = this._far('y'); return this.line(x, lo, x, hi, { width: 1.2, ...st }); }
  hline(y, st = {}) { const [lo, hi] = this._far('x'); return this.line(lo, y, hi, y, { width: 1.2, ...st }); }
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
      const [x, y] = this.inv(px, py); const [u, v] = F(x, y);
      const kx = this.lx ? this.sx / (x * Math.LN10) : this.sx, ky = this.ly ? this.sy / (y * Math.LN10) : this.sy; // d(pixel)/d(data)
      const L = Math.hypot(u * kx, v * ky);
      if (isFinite(L)) { pts.push([px, py, u * kx, -v * ky, L]); maxL = Math.max(maxL, L); }
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
  /**
   * Histogram of raw values (binned by M.histogram with st.bins / st.range) or of a precomputed {edges, counts[, density]}.
   * st: {density (heights integrate to 1), color, fill, fillAlpha (.35), outline (true: step line on top), width, gap (px between bars), base}.
   */
  hist(data, st = {}) {
    const Hd = data && data.edges ? data : M.histogram(data || [], { bins: st.bins, range: st.range });
    const E = Hd.edges, n = E.length - 1; if (n < 1) return this;
    let ys = st.density ? Hd.density : Hd.counts ?? Hd.density;
    if (st.density && !ys) { const tot = Hd.counts.reduce((s, k) => s + k, 0); ys = Hd.counts.map((k, i) => (tot ? k / (tot * (E[i + 1] - E[i])) : 0)); }
    const c = this.ctx, col = st.color || 'accent', Yb = this._py(st.base ?? 0), Xs = E.map((e) => this._px(e));
    const gap = st.gap ?? (Math.abs(Xs[n] - Xs[0]) / n >= 7 ? 1 : 0), Yt = (y) => (y ? this._py(y) : Yb);
    c.save(); c.fillStyle = withAlpha(st.fill || col, st.fillAlpha ?? 0.35);
    for (let i = 0; i < n; i++) {
      if (!ys[i]) continue;
      const x = Math.min(Xs[i], Xs[i + 1]) + gap / 2, w = Math.abs(Xs[i + 1] - Xs[i]) - gap, y = Yt(ys[i]);
      if (w > 0) c.fillRect(x, Math.min(y, Yb), w, Math.abs(Yb - y));
    }
    if (st.outline !== false) {
      c.beginPath(); c.moveTo(Xs[0], Yb);
      for (let i = 0; i < n; i++) { const y = Yt(ys[i]); c.lineTo(Xs[i], y); c.lineTo(Xs[i + 1], y); }
      c.lineTo(Xs[n], Yb);
      c.strokeStyle = withAlpha(col, st.alpha); c.lineWidth = st.width ?? 1.5; c.lineJoin = 'miter'; c.setLineDash([]); c.stroke();
    }
    c.restore(); return this;
  }
  /**
   * Colour bar for a heat map, drawn on a small panel inside the stage edge.
   * range = [lo, hi]; cmap = 'viridis' | 'magma' | 'diverging' | (t ∈ [0,1]) → [r,g,b] or colour.
   * st: {pos: 'right' | 'left' | 'top' | 'bottom', label (plain text), tex (KaTeX label instead), ticks: [values], fmt(v) → string,
   *      length (fraction of the stage side, .6), thickness (px, 10), margin (px, 10)}.
   */
  colorbar(range, cmap = 'viridis', st = {}) {
    const [lo, hi] = range, pos = st.pos || 'right', vert = pos === 'right' || pos === 'left', c = this.ctx;
    const css = (v) => (Array.isArray(v) ? `rgb(${v[0] | 0},${v[1] | 0},${v[2] | 0})` : resolveColor(v));
    const color = typeof cmap === 'function' ? (t) => css(cmap(t)) : (t) => css(M.cmap(t, cmap));
    const th = st.thickness ?? 10, mg = st.margin ?? 10, len = Math.max(48, Math.round((vert ? this.H : this.W) * (st.length ?? 0.6)));
    const step = niceStep(Math.abs(hi - lo) || 1, len, vert ? 34 : 64), fmtT = st.fmt || ((v) => tickLabel(v, step));
    const tv = st.ticks || []; if (!st.ticks) for (let v = Math.ceil(Math.min(lo, hi) / step - 1e-9) * step; v <= Math.max(lo, hi) + step * 1e-9; v += step) tv.push(v);
    const ticks = tv.map((v) => [v, fmtT(v), (v - lo) / (hi - lo)]).filter(([, , t]) => t >= -1e-9 && t <= 1 + 1e-9);
    c.save();
    const tickFont = '500 10.5px Inter, system-ui, sans-serif', titleFont = '500 11.5px Inter, system-ui, sans-serif';
    c.font = tickFont; const labW = ticks.reduce((m, [, s]) => Math.max(m, c.measureText(s).width), 0);
    c.font = titleFont; const title = st.label || null, ttl = title || st.tex ? 17 : 0;
    const titleW = title ? c.measureText(title).width : st.tex ? st.tex.length * 6 : 0;
    let bx, by, bw, bh, barX, barY;
    if (vert) {
      bw = Math.max(8 + th + 6 + labW + 8, titleW + 16); bh = len + 16 + ttl;
      bx = pos === 'right' ? this.W - mg - bw : mg; by = Math.round((this.H - bh) / 2);
      barX = bx + 8; barY = by + 8 + ttl;
    } else {
      bw = Math.max(len + 16 + labW, titleW + 16); bh = 8 + ttl + th + 17;
      bx = Math.round((this.W - bw) / 2); by = pos === 'top' ? mg : this.H - mg - bh;
      barX = bx + (bw - len) / 2; barY = by + 6 + ttl;
    }
    const bW = vert ? th : len, bH = vert ? len : th;
    c.beginPath(); if (c.roundRect) c.roundRect(bx + 0.5, by + 0.5, bw, bh, 7); else c.rect(bx + 0.5, by + 0.5, bw, bh);
    c.fillStyle = withAlpha('panel', 0.86); c.fill(); c.strokeStyle = resolveColor('grid'); c.lineWidth = 1; c.stroke();
    const g = vert ? c.createLinearGradient(0, barY + bH, 0, barY) : c.createLinearGradient(barX, 0, barX + bW, 0);
    for (let i = 0; i <= 32; i++) g.addColorStop(i / 32, color(i / 32));
    c.fillStyle = g; c.fillRect(barX, barY, bW, bH);
    c.strokeStyle = withAlpha('ink', 0.35); c.strokeRect(barX + 0.5, barY + 0.5, bW - 1, bH - 1);
    c.font = tickFont; c.fillStyle = resolveColor('muted'); c.strokeStyle = resolveColor('muted'); c.beginPath();
    for (const [, s, t] of ticks) {
      if (vert) { const y = Math.round(barY + bH - t * bH) + 0.5; c.moveTo(barX + bW, y); c.lineTo(barX + bW + 3, y); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(s, barX + bW + 6, y); }
      else { const x = Math.round(barX + t * bW) + 0.5; c.moveTo(x, barY + bH); c.lineTo(x, barY + bH + 3); c.textAlign = 'center'; c.textBaseline = 'top'; c.fillText(s, x, barY + bH + 4); }
    }
    c.stroke();
    if (title) { c.font = titleFont; c.fillStyle = resolveColor('ink'); c.textAlign = vert ? 'left' : 'center'; c.textBaseline = 'middle'; c.fillText(title, vert ? bx + 8 : bx + bw / 2, by + 6 + ttl / 2); }
    c.restore();
    if (st.tex && !title) this.texPx(st.tex, vert ? bx + 8 : bx + bw / 2, by + 6 + ttl / 2, { align: vert ? 'left' : 'center', size: 13 });
    return this;
  }
  /**
   * Polar grid centred at st.center ([0, 0]): rings (a count, or an array of radii; default nice steps), spokes (count, 12),
   * up to st.rmax (default: largest nice radius that fits), with ring labels (along st.labelAngle) and angle labels
   * st.angles = 'deg' | 'rad' | false. st.color for the lines. Use with equal: true and axes: false.
   */
  polarGrid(st = {}) {
    const [cx, cy] = st.center || [0, 0], c = this.ctx, X0 = this.X(cx), Y0 = this.Y(cy);
    const fit = Math.min(cx - this.xr[0], this.xr[1] - cx, cy - this.yr[0], this.yr[1] - cy);
    let radii, rmax = st.rmax, step;
    if (Array.isArray(st.rings)) { radii = st.rings.slice(); rmax ??= Math.max(...radii); }
    else {
      step = niceStep(rmax ?? fit, 4, 1); rmax ??= Math.max(step, Math.floor(fit * 0.94 / step + 1e-9) * step);
      const n = typeof st.rings === 'number' ? st.rings : Math.max(1, Math.round(rmax / step));
      radii = M.range(n, 1).map((k) => rmax * k / n); step = rmax / n;
    }
    const spokes = st.spokes ?? 12, start = st.start ?? 0, col = st.color || 'grid';
    c.save(); c.lineWidth = 1; c.setLineDash([]);
    c.beginPath();
    for (let k = 0; k < spokes; k++) { const a = start + M.TAU * k / spokes; c.moveTo(X0, Y0); c.lineTo(X0 + rmax * this.sx * Math.cos(a), Y0 - rmax * this.sy * Math.sin(a)); }
    for (const r of radii) if (r < rmax) { c.moveTo(X0 + r * this.sx, Y0); c.ellipse(X0, Y0, r * this.sx, r * this.sy, 0, 0, M.TAU); }
    c.strokeStyle = resolveColor(col); c.stroke();
    c.beginPath(); c.ellipse(X0, Y0, rmax * this.sx, rmax * this.sy, 0, 0, M.TAU); c.strokeStyle = resolveColor(st.color || 'faint'); c.stroke();
    c.restore();
    if (st.labels !== false) {
      const la = st.labelAngle ?? start + Math.PI / spokes;
      const dec = step ? [0, 1, 2, 3, 4, 5, 6].find((d) => Math.abs(Math.round(step * 10 ** d) - step * 10 ** d) < 1e-6) ?? 6 : 6;
      for (const r of radii) this.textPx(String(Number(r.toFixed(dec))).replace('-', '−'), X0 + r * this.sx * Math.cos(la) + 3, Y0 - r * this.sy * Math.sin(la) - 2, { size: 10.5, color: 'muted', align: 'left', baseline: 'bottom' });
    }
    if (st.angles !== false) {
      const rad = st.angles === 'rad';
      for (let k = 0; k < spokes; k++) {
        const a = start + M.TAU * k / spokes, ca = Math.cos(a), sa = Math.sin(a);
        let lab;
        if (rad) { const g = M.gcd(2 * k, spokes), nu = 2 * k / g, de = spokes / g; lab = nu === 0 ? '0' : (nu === 1 ? '' : nu) + 'π' + (de === 1 ? '' : '/' + de); }
        else lab = Number((a * 180 / Math.PI).toFixed(1)) % 360 + '°';
        let px = X0 + (rmax * this.sx + 13) * ca, py = Y0 - (rmax * this.sy + 11) * sa;
        if (px < 12 || px > this.W - 12 || py < 9 || py > this.H - 9) { px = X0 + (rmax * this.sx - 13) * ca; py = Y0 - (rmax * this.sy - 11) * sa; }
        this.textPx(lab, px, py, { size: 10.5, color: 'muted', align: 'center', baseline: 'middle' });
      }
    }
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
    if (st.plate) { // rounded backing plate for text over busy pictures
      const m = c.measureText(str), w = m.width, hgt = (st.size || 12.5) * 1.25, pad = 5;
      const x0 = c.textAlign === 'right' ? X - w : c.textAlign === 'center' ? X - w / 2 : X;
      const y0 = c.textBaseline === 'top' ? Y : c.textBaseline === 'bottom' ? Y - hgt : Y - hgt / 2;
      c.beginPath(); if (c.roundRect) c.roundRect(x0 - pad, y0 - 2, w + 2 * pad, hgt + 4, 6); else c.rect(x0 - pad, y0 - 2, w + 2 * pad, hgt + 4);
      c.fillStyle = withAlpha('panel', 0.88); c.fill(); c.strokeStyle = withAlpha('faint', 0.6); c.lineWidth = 1; c.stroke();
    }
    if (st.halo !== false && !st.plate) { c.lineWidth = 4; c.lineJoin = 'round'; c.strokeStyle = withAlpha('panel', 0.85); c.strokeText(str, X, Y); }
    c.fillStyle = withAlpha(st.color || 'ink', st.alpha); c.fillText(str, X, Y);
    c.restore(); return this;
  }
  /** Text at data coords: canvas text, or the KaTeX overlay when it contains $…$. st: {size, color, align, baseline, dx, dy, math (italic serif), halo, plate (rounded backing box)}. */
  text(str, x, y, st = {}) {
    const t = String(str);
    if (/\$[^$]+\$/.test(t) && !looksLikeMoney(t)) { const pure = /^\$[^$]+\$$/.test(t); return this.texPx(pure ? t.slice(1, -1) : t, this.X(x) + (st.dx || 0), this.Y(y) + (st.dy || 0), { ...st, dx: 0, dy: 0, rich: !pure, align: st.align || 'left', baseline: st.baseline || 'middle', size: st.size ? st.size * 1.15 : 14 }); } // $…$ → KaTeX overlay
    return this.textPx(t, this.X(x), this.Y(y), st);
  }
  /** Status text pinned to a corner: pos = 'tl' | 'tr' | 'bl' | 'br'. */
  corner(str, pos = 'tl', st = {}) {
    const g = this.o.gutter ? this._m : { l: 0, r: 0, t: 0, b: 0 }, m = 10; // inside the data area when the stage has a gutter
    const X = pos[1] === 'l' ? g.l + m : this.W - g.r - m, Y = pos[0] === 't' ? g.t + m + 7 : this.H - g.b - m - 7;
    const o = { align: pos[1] === 'l' ? 'left' : 'right', color: 'muted', size: 12, ...st };
    if (/\$[^$]+\$/.test(str)) return this.texPx(String(str), X, Y, { ...o, rich: true }); // text with $…$ math: HTML overlay
    return this.textPx(String(str), X, Y, o);
  }
  _labelAt(label, X, Y, off, pos, color, st) {
    const dirs = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [0.75, -0.75], nw: [-0.75, -0.75], se: [0.75, 0.75], sw: [-0.75, 0.75] };
    const [dx, dy] = dirs[pos] || dirs.ne;
    const align = dx > 0.1 ? 'left' : dx < -0.1 ? 'right' : 'center';
    const baseline = dy > 0.1 ? 'top' : dy < -0.1 ? 'bottom' : 'middle';
    const m = typeof label === 'string' && /^\$[^$]+\$$/.test(label); // '$v_1$' renders as TeX
    if (st.tex || m) this.texPx(m ? label.slice(1, -1) : label, X + dx * off, Y + dy * off, { color, align, baseline, size: st.labelSize });
    else this.textPx(String(label), X + dx * off, Y + dy * off, { color, align, baseline, math: st.math ?? true, size: st.labelSize });
  }
  /** KaTeX label at data coords (HTML overlay). st: {color, size(px), align: left|center|right, baseline: top|middle|bottom, dx, dy, rich (text with $…$ math)}. */
  tex(latex, x, y, st = {}) { return this.texPx(latex, this.X(x), this.Y(y), st); }
  texPx(latex, X, Y, st = {}) {
    let el = this._tex[this._texN];
    if (!el) { el = h('div', 'tex-label'); this.overlay.append(el); this._tex.push(el); }
    this._texN++;
    const src = (st.rich ? 'R:' : 'T:') + latex;
    if (el._src !== src) { el.innerHTML = st.rich ? inlineHTML(latex) : katexHTML(latex); el._src = src; }
    el.style.fontFamily = st.rich ? 'Inter, system-ui, sans-serif' : '';
    el.style.display = '';
    el.style.left = (X + (st.dx || 0)) + 'px'; el.style.top = (Y + (st.dy || 0)) + 'px';
    el.style.color = resolveColor(st.color || 'ink');
    el.style.fontSize = (st.size || 15) + 'px';
    el.style.opacity = st.alpha ?? 1;
    el.classList.toggle('plate', !!st.plate);
    const ax = { left: '0', center: '-50%', right: '-100%' }[st.align || 'center'];
    const ay = { top: '0', middle: '-50%', bottom: '-100%' }[st.baseline || 'middle'];
    el.style.transform = `translate(${ax}, ${ay})`;
    return this;
  }

  // ---------- rasters ----------
  /**
   * Per-pixel image: fn(x,y) → [r,g,b] or [r,g,b,a] (0–255; an alpha ≤ 1 is read as a fraction, as v.rgb returns it) or null (transparent).
   * st.res = pixel block size (default 2); st.key = cache key (recompute only when it changes); st.id to cache several layers; st.rect = [x0, y0, x1, y1] limits it to a data rectangle.
   */
  raster(fn, st = {}) {
    const res = st.res || 2; const w = Math.ceil(this.W / res), hh = Math.ceil(this.H / res);
    const R = st.rect ? [Math.min(st.rect[0], st.rect[2]), Math.min(st.rect[1], st.rect[3]), Math.max(st.rect[0], st.rect[2]), Math.max(st.rect[1], st.rect[3])] : null; // limit to a data rectangle
    const id = st.id || 'r';
    const theme = typeof document !== 'undefined' ? document.documentElement.dataset.theme || (matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : '';
    const key = st.key != null ? `${w}x${hh}|${this.xr}|${this.yr}|${theme}|${st.rect || ''}|${st.key}` : null; // colours resolved from the theme must not survive a theme switch
    let ent = this._raster.get(id);
    if (!ent || key == null || ent.key !== key) {
      const off = ent?.canvas || document.createElement('canvas');
      off.width = w; off.height = hh;
      const oc = off.getContext('2d'); const img = oc.createImageData(w, hh); const d = img.data;
      for (let j = 0; j < hh; j++) {
        const y = this.invY((j + 0.5) * res);
        for (let i = 0; i < w; i++) {
          const x = this.invX((i + 0.5) * res); const k = 4 * (j * w + i);
          if (R && (x < R[0] || x > R[2] || y < R[1] || y > R[3])) { d[k + 3] = 0; continue; }
          const col = fn(x, y);
          if (!col) { d[k + 3] = 0; continue; }
          d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = col.length > 3 ? (col[3] <= 1 ? Math.round(col[3] * 255) : col[3]) : 255;
        }
      }
      oc.putImageData(img, 0, 0);
      ent = { key, canvas: off }; this._raster.set(id, ent);
    }
    const c = this.ctx; c.save(); c.globalAlpha = st.alpha ?? 1; c.imageSmoothingEnabled = res > 1; c.drawImage(ent.canvas, 0, 0, w * res, hh * res); c.restore();
    return this;
  }
  /** Scalar heat map: fn(x,y) → number, coloured by st.cmap ('viridis'|'magma'|'diverging'|'theme'|'theme-diverging'|(u)→[r,g,b]) over st.range=[lo,hi]. 'theme' ramps panel→st.color; 'theme-diverging' st.neg←panel→st.pos, so both read in light and dark. */
  heat(fn, st = {}) {
    const [lo, hi] = st.range || [0, 1]; const name = st.cmap || 'viridis';
    const col = name === 'theme' ? (u) => themeRamp(u, st.color || 'accent', 'panel') : name === 'theme-diverging' ? (u) => (u < 0.5 ? themeRamp(1 - 2 * u, st.neg || 'blue', 'panel') : themeRamp(2 * u - 1, st.pos || 'red', 'panel')) : typeof name === 'function' ? name : (u) => M.cmap(u, name);
    return this.raster((x, y) => { const v = fn(x, y); if (!isFinite(v)) return null; return col((v - lo) / (hi - lo)); }, st);
  }
  /** Domain colouring of a complex function f(z: Cx) → Cx (hue = argument, shading = log-modulus contours). */
  domain(f, st = {}) {
    const contours = st.contours ?? true, sat = st.saturation ?? 0.62, gridLines = st.gridLines ?? false;
    const fade = M.clamp(st.fade ?? 0, 0, 1), bg = fade ? rgbOf('panel') : null; // fade: blend toward the panel colour so labels on top stay legible
    const out = (rgb) => (fade ? rgb.map((v, i) => (i < 3 ? v + (bg[i] - v) * fade : v)) : rgb);
    return this.raster((x, y) => {
      let w; try { w = f(new M.Cx(x, y)); } catch { return null; }
      const re = w.re ?? w[0], im = w.im ?? w[1];
      if (!isFinite(re) || !isFinite(im)) return [250, 250, 250];
      const mod = Math.hypot(re, im); let l = 0.52;
      if (contours) { const t = M.fract(Math.log2(mod + 1e-300)); l = 0.42 + 0.2 * Math.pow(t, 0.7); }
      if (gridLines) { const gx = Math.abs(M.fract(re + 0.5) - 0.5), gy = Math.abs(M.fract(im + 0.5) - 0.5); if (Math.min(gx, gy) < 0.03) l *= 0.6; }
      return out(M.hsl2rgb(Math.atan2(im, re) / M.TAU, sat, l));
    }, st);
  }

  // ---------- interaction ----------
  /**
   * Draggable point. Create it ONCE (outside render). Returns {x, y}; read h.x/h.y while drawing.
   * st: {color, r, label, constrain: (x,y)=>[x,y] | 'x' | 'y' | {x:[a,b], y:[c,d]}, onDrag(h)}
   */
  handle(x, y, st = {}) {
    const hd = { x, y, color: st.color || 'accent', r: st.r ?? 7, label: st.label, labelPos: st.labelPos, constrain: st.constrain, onDrag: st.onDrag, visible: true, dragging: false, hover: false };
    hd.set = (nx, ny) => { if (hd.x === nx && hd.y === ny) return; hd.x = nx; hd.y = ny; if (!this.rt._inFrame) this.rt.invalidate(); }; // safe inside render
    this.handles.push(hd);
    this.rt.state.register('handle', `${this.rt.stages.indexOf(this)}:${this.handles.length - 1}`, {
      order: 10,
      get: () => [hd.x, hd.y], valid: p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite),
      set: p => { hd.set(...p); const [nx, ny] = this._constrain(hd, ...p, false); hd.set(nx, ny); hd.onDrag?.(hd); },
    });
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
  _constrain(hd, x, y, clampView = true) {
    const k = hd.constrain;
    if (typeof k === 'function') { const r = k(x, y); if (r) [x, y] = r; }
    else if (k === 'x') y = hd.y;
    else if (k === 'y') x = hd.x;
    else if (k && typeof k === 'object') { if (k.x) x = M.clamp(x, k.x[0], k.x[1]); if (k.y) y = M.clamp(y, k.y[0], k.y[1]); }
    if (clampView) { x = M.clamp(x, this.xr[0], this.xr[1]); y = M.clamp(y, this.yr[0], this.yr[1]); }
    return [x, y];
  }
  _bind() {
    const cv = this.canvas;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', (e) => {
      const [px, py] = pos(e);
      this.pointer.down = true;
      const hd = this._hit(px, py, e.pointerType === 'touch' ? 24 : 14);
      this._downAt = hd ? null : [px, py, performance.now()]; // a press on a handle is a drag, never a click
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
      if (this._downAt && Math.hypot(px - this._downAt[0], py - this._downAt[1]) < 5 && performance.now() - this._downAt[2] < 600 && e.type === 'pointerup') { const mod = { shift: e.shiftKey, alt: e.altKey, ctrl: e.ctrlKey || e.metaKey, button: e.button }; this._click.forEach((f) => f(x, y, mod)); if (this._click.length) this.rt.invalidate(); }
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
    rt.state.register('camera', String(rt.stages.length), {
      order: 30,
      get: () => [this.yaw, this.pitch, this.zoom],
      valid: p => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite) && Math.abs(p[0]) <= 1e6 && Math.abs(p[1]) <= Math.PI / 2 && p[2] > 0 && p[2] <= 1e4,
      set: ([yaw, pitch, zoom]) => { this.yaw = yaw; this.pitch = pitch; this.zoom = zoom; },
    });
    this.el = h('div', 'stage stage-3d');
    this.el.style.flex = o.full ? '1 1 100%' : `${o.weight} 1 ${o.minWidth}px`;
    if (o.title) { const t = h('div', 'stage-title'); t.innerHTML = inlineHTML(o.title); this.el.append(t); }
    this.box = h('div', 'stage-box'); this.canvas = h('canvas'); this.overlay = h('div', 'stage-overlay');
    this.box.append(this.canvas, this.overlay); this.el.append(this.box); rt.stagesEl.append(this.el);
    rt.ro?.observe(this.box); // re-measure when shown again or resized by a neighbour
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
    const src = (st.rich ? 'R:' : 'T:') + latex;
    if (el._src !== src) { el.innerHTML = st.rich ? inlineHTML(latex) : katexHTML(latex); el._src = src; }
    el.style.fontFamily = st.rich ? 'Inter, system-ui, sans-serif' : '';
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

// ================================================================== audio
// One AudioContext for the whole page, created lazily and only once the page has had a user gesture (browsers block
// autoplay). Nothing here may throw: without Web Audio (headless checks, old browsers) every call is a silent no-op.
let AUDIO = null;
function audioContext() {
  try {
    if (AUDIO) { if (AUDIO.state === 'suspended') AUDIO.resume().catch(() => {}); return AUDIO; }
    if (typeof window === 'undefined') return null;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    const ua = typeof navigator !== 'undefined' && navigator.userActivation;
    if (ua && !ua.hasBeenActive) return null; // no gesture yet: stay silent instead of queueing sound for later
    AUDIO = new C();
    if (AUDIO.state === 'suspended') { // older browsers without userActivation: resume on the next gesture
      const wake = () => { AUDIO.resume().catch(() => {}); for (const ev of ['pointerdown', 'keydown']) window.removeEventListener(ev, wake, true); };
      for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, wake, true);
    }
    return AUDIO;
  } catch { return null; }
}
const SPEAKER = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style="flex:none"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
/** The per-viz sound controller behind v.sound(). */
function makeSound(rt) {
  const voices = new Set(); let master = null;
  const NOOP = Object.freeze({ stop() {}, playing: false });
  const out = () => {
    if (rt.dead) return null;
    const ac = audioContext(); if (!ac) return null;
    if (!master) {
      master = ac.createGain(); master.gain.value = 0.9;
      const comp = ac.createDynamicsCompressor(); // soft safety limiter so chords never clip
      comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.2;
      master.connect(comp); comp.connect(ac.destination); master._comp = comp;
    }
    return ac;
  };
  const addVoice = (ac, srcs, env, lvl = null) => {
    const f0 = srcs[0]?._f;
    const v = {
      stop(fade = 0.03) {
        try { const t = ac.currentTime; env.gain.cancelScheduledValues(t); env.gain.setValueAtTime(env.gain.value, t); env.gain.linearRampToValueAtTime(0, t + fade); for (const s of srcs) s.stop(t + fade + 0.02); } catch { /* already stopped */ }
      },
      get playing() { return voices.has(v); },
      /** Change the loudness of a playing voice smoothly (1 = as started). */
      setGain(k) { try { (lvl || env).gain.setTargetAtTime(Math.max(0, k) * (lvl ? 1 : env._g0 ?? 1), ac.currentTime, 0.015); } catch { /* stopped */ } return v; },
      /** Retune a playing tone: its fundamental moves to f, other partials keep their ratios. */
      setFreq(f) { if (!(f > 0) || !f0) return v; try { for (const s of srcs) if (s.frequency) s.frequency.setTargetAtTime(s._f * f / f0, ac.currentTime, 0.01); } catch { /* stopped */ } return v; },
    };
    let left = srcs.length;
    for (const s of srcs) s.onended = () => { if (--left === 0) { voices.delete(v); try { env.disconnect(); } catch { /* ignore */ } rt.invalidate(); } };
    voices.add(v); rt.invalidate(); return v;
  };
  const envelope = (ac, o, t0, peak) => { // attack → hold until `duration` (or until stop() with sustain) → exponential-ish release
    const g = ac.createGain(), lvl = ac.createGain(), atk = Math.max(0.002, o.attack ?? 0.01), dur = Math.max(atk, o.duration ?? 1), rel = Math.max(0.005, o.release ?? 0.3);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + atk);
    if (!o.sustain) { g.gain.setValueAtTime(peak, t0 + dur); g.gain.setTargetAtTime(0, t0 + dur, rel / 5); }
    g.connect(lvl); lvl.connect(master); return { g, lvl, end: o.sustain ? Infinity : t0 + dur + rel, dur };
  };
  const toPartials = (p, o) => {
    if (typeof p === 'number') { const H = Math.max(1, o.harmonics ?? 1), roll = o.rolloff ?? 1; return M.range(H).map((k) => [p * (k + 1), 1 / Math.pow(k + 1, roll)]); }
    return p.map((q) => (Array.isArray(q) ? [q[0], q[1] ?? 1] : [q, 1]));
  };
  const play = (sets, o, scale) => {
    const ac = out(); if (!ac) return NOOP;
    try {
      const t0 = ac.currentTime + 0.01 + Math.max(0, o.delay ?? 0), nyq = ac.sampleRate / 2;
      const { g, lvl, end, dur } = envelope(ac, o, t0, (o.gain ?? 0.25) * scale), srcs = [];
      const f0 = sets[0]?.[0]?.[0];
      for (const parts of sets) {
        const tot = parts.reduce((s, [f, a]) => s + (f > 0 && f < nyq ? Math.abs(a) : 0), 0) || 1;
        for (const [f, a] of parts) {
          if (!(f > 0 && f < nyq) || !a) continue;
          const osc = ac.createOscillator(), pg = ac.createGain();
          osc.type = o.type || 'sine'; osc.frequency.value = f; osc._f = f; pg.gain.value = o.normalize === false ? a : a / tot;
          if (o.glide > 0 && f0 > 0) { osc.frequency.setValueAtTime(f, t0); osc.frequency.exponentialRampToValueAtTime(Math.min(nyq * 0.98, f * o.glide / f0), t0 + dur); } // chirp: the fundamental slides to `glide` Hz
          osc.connect(pg); pg.connect(g); osc.start(t0); if (Number.isFinite(end)) osc.stop(end + 0.05); srcs.push(osc);
        }
      }
      if (!srcs.length) { g.disconnect(); lvl.disconnect(); return NOOP; }
      return addVoice(ac, srcs, g, lvl);
    } catch { return NOOP; }
  };
  const isOpts = (x) => x != null && typeof x === 'object' && !Array.isArray(x);
  const snd = {
    /** false when the browser has no Web Audio (every call is then a no-op). */
    get available() { return typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext); },
    get playing() { return voices.size > 0; },
    get ctx() { return AUDIO; },
    get now() { return AUDIO ? AUDIO.currentTime : 0; },
    /** partials: a frequency, [f, …] (equal amplitudes) or [[f, amp], …]. opts: {duration 1, gain .25, attack .01, release .3, delay, type, harmonics, rolloff, normalize}. */
    tone: (partials, o = {}) => play([toPartials(partials, o)], o, 1),
    /** chord(f1, f2, …, opts?) — each note a frequency or a partial list [[f, a], …]; an array of numbers is a list of notes. */
    chord: (...args) => {
      const o = args.length && isOpts(args[args.length - 1]) ? args.pop() : {};
      const notes = args.flatMap((a) => (Array.isArray(a) && a.length && a.every((x) => typeof x === 'number') ? a : [a]));
      return notes.length ? play(notes.map((nt) => toPartials(nt, o)), o, 1 / Math.sqrt(notes.length)) : NOOP;
    },
    /** Play raw samples (Float32Array or array in [−1, 1]; louder input is normalised). opts: {gain .8, loop, delay, duration}. */
    samples: (data, sampleRate = 44100, o = {}) => {
      const ac = out(); if (!ac || !data || !data.length) return NOOP;
      try {
        let peak = 0; for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
        const k = o.normalize === false || peak <= 1 ? 1 : 1 / peak, buf = ac.createBuffer(1, data.length, sampleRate), ch = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) ch[i] = data[i] * k;
        const src = ac.createBufferSource(), g = ac.createGain(), t0 = ac.currentTime + 0.01 + Math.max(0, o.delay ?? 0);
        src.buffer = buf; src.loop = !!o.loop; g.gain.value = o.gain ?? 0.8;
        src.connect(g); g.connect(master); src.start(t0); if (o.duration) src.stop(t0 + o.duration);
        return addVoice(ac, [src], g);
      } catch { return NOOP; }
    },
    /** Noise burst. opts: {color: 'white' | 'pink' | 'brown', duration 1, gain .2, attack, release, delay}. */
    noise: (o = {}) => {
      const ac = out(); if (!ac) return NOOP;
      try {
        const t0 = ac.currentTime + 0.01 + Math.max(0, o.delay ?? 0), { g, lvl, end } = envelope(ac, o, t0, o.gain ?? 0.2);
        const n = Math.ceil((Number.isFinite(end) ? end - t0 + 0.1 : 2) * ac.sampleRate), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0); // sustained noise loops a 2 s buffer
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
        for (let i = 0; i < n; i++) {
          const w = Math.random() * 2 - 1;
          if (o.color === 'pink') { // Paul Kellet's filter
            b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
            b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
          } else if (o.color === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
        }
        const src = ac.createBufferSource(); src.buffer = buf; src.loop = !Number.isFinite(end); src.connect(g); src.start(t0); if (Number.isFinite(end)) src.stop(end + 0.05);
        return addVoice(ac, [src], g, lvl);
      } catch { return NOOP; }
    },
    /** Stop everything this viz is playing (short fade, no click). */
    stop: () => { for (const v of [...voices]) v.stop(); },
  };
  rt.cleanups.push(() => {
    for (const v of [...voices]) v.stop(0.01);
    voices.clear();
    try { if (master) { master.disconnect(); master._comp.disconnect(); } } catch { /* ignore */ }
    master = null;
  });
  return snd;
}

// ================================================================== controls
let controlId = 0;
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
  // the exact value is kept apart from the thumb position, so defaults and set() are never snapped to the step grid
  const roundSig = (x, sig) => (x === 0 ? 0 : +x.toPrecision(sig));
  let cur = value;
  const ctl = {
    el, input,
    get value() { return o.int ? Math.round(cur) : cur; },
    set value(x) { cur = x; input.value = toInput(x); sync(); },
    set(x) { cur = x; input.value = toInput(x); sync(); rt.invalidate(); },
  };
  const sync = () => { out.textContent = format(ctl.value); input.setAttribute('aria-valuetext', out.textContent); };
  input.addEventListener('input', () => { const x = fromInput(+input.value); cur = log ? roundSig(x, o.sig ?? 3) : x; sync(); o.onChange?.(ctl.value); rt.invalidate(); });
  sync(); el.append(lab, input, out);
  rt.state.register('slider', label, { get: () => ctl.value,
    valid: x => Number.isFinite(x) && x >= min && x <= max && (!o.int || Number.isInteger(x)),
    set: x => { if (x !== ctl.value) { ctl.set(x); o.onChange?.(ctl.value); } },
  });
  return ctl;
}
function makeToggle(rt, label, value, o = {}) {
  const el = controlBox(rt, 'ctl-toggle'); const lab = h('label', 'switch');
  const input = h('input'); input.type = 'checkbox'; input.checked = !!value;
  const knob = h('span', 'switch-track'); const txt = h('span', 'ctl-label'); txt.innerHTML = inlineHTML(label);
  lab.append(input, knob, txt); el.append(lab);
  input.addEventListener('change', () => { o.onChange?.(input.checked); rt.invalidate(); });
  const ctl = { el, get value() { return input.checked; }, set value(v) { input.checked = !!v; }, set(v) { input.checked = !!v; rt.invalidate(); } };
  rt.state.register('toggle', label, { get: () => ctl.value, valid: x => typeof x === 'boolean', set: x => { if (x !== ctl.value) { ctl.set(x); o.onChange?.(x); } } });
  return ctl;
}
/** Text field; with o.vars it compiles a formula (M.compileExpr) and exposes .fn, showing parse errors inline. */
function makeInput(rt, label, value = '', o = {}) {
  const el = controlBox(rt, 'ctl-input');
  if (label) { const lab = h('span', 'ctl-label'); lab.innerHTML = inlineHTML(label); el.append(lab); }
  const input = h('input'); input.type = 'text'; input.value = value; input.spellcheck = false; input.autocomplete = 'off';
  input.setAttribute('aria-label', String(label || '').replace(/\$/g, '') || o.placeholder || 'Expression');
  if (o.placeholder) input.placeholder = o.placeholder; if (o.width) input.style.width = typeof o.width === 'number' ? o.width + 'px' : o.width;
  const msg = h('span', 'ctl-input-err'); msg.id = `viz-input-error-${++controlId}`; msg.setAttribute('role', 'alert'); input.setAttribute('aria-describedby', msg.id); el.append(input, msg);
  let fn = null, error = null, cur = String(value);
  const compile = (src) => {
    if (!o.vars) { fn = null; error = null; return true; }
    const r = M.compileExpr(src, o.vars); error = r.error; if (r.f) fn = r.f;
    el.classList.toggle('bad', !!error); input.setAttribute('aria-invalid', String(!!error)); msg.textContent = error || ''; return !error;
  };
  compile(cur);
  let t = 0;
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { cur = input.value; if (compile(cur)) { o.onChange?.(cur, fn); rt.invalidate(); } }, 160); });
  input.addEventListener('keydown', (e) => e.stopPropagation()); // keep typing out of keyboard shortcuts
  const ctl = { el, get value() { return cur; }, get fn() { return fn; }, get error() { return error; },
    set(v) { input.value = cur = String(v); compile(cur); rt.invalidate(); } };
  rt.state.register('input', label, { get: () => ctl.value, valid: x => typeof x === 'string' && x.length <= 4096 && (!o.vars || !!M.compileExpr(x, o.vars).f),
    set: x => { if (x !== ctl.value) { ctl.set(x); o.onChange?.(ctl.value, ctl.fn); } },
  });
  rt.cleanups.push(() => clearTimeout(t));
  return ctl;
}
function makeSelect(rt, label, options, value, o = {}) {
  const el = controlBox(rt, 'ctl-select');
  if (label) { const lab = h('span', 'ctl-label'); lab.innerHTML = inlineHTML(label); el.append(lab); }
  const seg = h('div', 'seg'); el.append(seg);
  seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', String(label || '').replace(/\$/g, '') || 'Options');
  const opts = options.map((x) => typeof x === 'object' ? x : { value: x, label: String(x) });
  let cur = value ?? opts[0].value; const btns = [];
  const ctl = { el, get value() { return cur; }, set value(v) { ctl.set(v); }, set(v, so = {}) { if (v === cur) return; cur = v; sync(); if (so.fire) o.onChange?.(cur); if (!rt._inFrame) rt.invalidate(); } };
  const sync = () => btns.forEach((b, i) => { const on = opts[i].value === cur; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  opts.forEach((op) => {
    const b = h('button'); b.type = 'button'; b.innerHTML = inlineHTML(op.label);
    b.addEventListener('click', () => { cur = op.value; sync(); o.onChange?.(cur); rt.invalidate(); });
    btns.push(b); seg.append(b);
  });
  sync();
  rt.state.register('select', label, { get: () => [opts.findIndex(op => op.value === ctl.value), opts.map(op => String(op.label))],
    valid: x => Array.isArray(x) && x.length === 2 && Number.isInteger(x[0]) && x[0] >= 0 && x[0] < opts.length && JSON.stringify(x[1]) === JSON.stringify(opts.map(op => String(op.label))),
    set: x => ctl.set(opts[x[0]].value, { fire: true }),
  });
  return ctl;
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
    this.state = new StateRegistry(); this.customState = [];
    this.state.register('clock', '', {
      order: 40,
      get: () => this.anim ? this.t : null,
      valid: x => this.anim ? Number.isFinite(x) && x >= 0 && x <= 1e7 : x === null,
      set: x => { if (this.anim) { this.t = x; this.playing = false; this.last = 0; this._syncPlay(); } },
    });
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
    this._inFrame = true;
    try { for (const f of this.draws) f(this.t); }
    catch (e) { this._inFrame = false; this.fail(e); return; }
    this._inFrame = false;
    for (const s of this.stages) s.end();
    if (this.readoutFn) {
      let str; try { str = this.readoutFn(this.t); } catch (e) { this.fail(e); return; }
      if (str !== this._ro) { this._ro = str; this.readoutEl.innerHTML = String(str ?? '').split('\n').map((l) => inlineHTML(l)).join('<br>'); }
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
      /**
       * A fixed-step simulation that follows the animation clock: const S = v.sim(() => initialState, (state, dt, t) => {…}, {dt});
       * inside v.animate((t) => { S.advance(t); draw(S.state); }). It steps until it reaches t, restarts from init() when the clock
       * goes backwards (loop wrap, reset, --still jump), and caps the work per frame (maxSteps) so a big jump cannot freeze the page.
       */
      sim(init, step, { dt = 1 / 240, maxSteps = 20000 } = {}) {
        let state = init(), t = 0;
        return {
          get state() { return state; }, get t() { return t; },
          advance(T) { if (T < t - 1e-9) { state = init(); t = 0; } let n = 0; while (t + dt <= T + 1e-12 && n++ < maxSteps) { const r = step(state, dt, t); if (r !== undefined) state = r; t += dt; } return state; },
          reset() { state = init(); t = 0; return state; },
        };
      },
      slider: (label, min, max, value, o) => makeSlider(rt, label, min, max, value, o),
      toggle: (label, value, o) => makeToggle(rt, label, value, o),
      select: (label, options, value, o) => makeSelect(rt, label, options, value, o),
      /** Text / formula field: v.input('f(t, x) =', 'x (1 - x)', {vars: ['t', 'x']}) → {value, fn (last valid formula), error, set}. */
      input: (label, value, o) => makeInput(rt, label, value, o),
      button: (label, fn) => makeButton(rt, label, fn),
      /** Sound controller (one per viz): tone, chord, samples, noise, stop, playing. Silent no-op without Web Audio. */
      sound: () => (rt._sound ||= makeSound(rt)),
      /** Button with a speaker icon that stops any current sound and calls fn(sound). */
      soundButton(label, fn) {
        const b = makeButton(rt, label, () => { const s = api.sound(); s.stop(); fn?.(s); });
        b.innerHTML = SPEAKER + `<span>${inlineHTML(label)}</span>`;
        return b;
      },
      /** Live text under the panels; f(t) returns a rich string (TeX allowed). */
      readout(f) { rt.readoutFn = f; rt.invalidate(); },
      /** Legend: items = [[colour, label], ...] or [{color, label, dash, dot}]. */
      legend(items) {
        const sig = JSON.stringify(items); if (rt._legendSig === sig) return; rt._legendSig = sig; // calling it every frame is free when nothing changed
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
      /** Theme-aware sequential ramp: t ∈ [0,1] → [r,g,b] from `from` (default the panel colour) to `to` (default accent). */
      ramp: (t, to = 'accent', from = 'panel') => themeRamp(t, to, from),
      /** Theme-aware diverging ramp: t ∈ [−1,1] → [r,g,b], neg colour ← panel → pos colour. */
      diverge: (t, neg = 'blue', pos = 'red') => (t < 0 ? themeRamp(-t, neg, 'panel') : themeRamp(t, pos, 'panel')),
      mix,
      onCleanup: (f) => rt.cleanups.push(f),
      /** Register opaque data (edited graphs, samples, custom simulation state) for share links. */
      shareState(key, adapter) {
        if (typeof key !== 'string' || !key || !adapter || typeof adapter.get !== 'function' || typeof adapter.set !== 'function') throw new Error('shareState needs a stable key and get/set functions.');
        rt.customState.push(key);
        rt.state.register('custom', key, { order: 20, get: adapter.get, valid: adapter.validate || (() => true), set: adapter.set });
      },
      M, Cx: M.Cx, cx: M.cx, rng: M.rng, fmt: M.fmt, fix: M.fix, sci: M.sci,
      tex: katexHTML,
    };
    // add-on kits (assets/js/viz/kits): each is make(api, rt, ...args)
    for (const [name, make] of Object.entries(KITS)) api[name] = Object.assign((...args) => {
      const kit = make(api, rt, ...args);
      if (name === 'steps') rt.state.register('steps', '', {
        order: 50, get: () => [kit.i, kit.n],
        valid: x => Array.isArray(x) && x.length === 2 && x.every(Number.isInteger) && x[1] >= 0 && x[1] <= 1e6 && x[0] >= 0 && x[0] < Math.max(1, x[1]),
        set: ([i, n]) => { if (n !== kit.n) throw new Error('The saved proof steps no longer match.'); kit.pause(); kit.set(i); },
      });
      return kit;
    }, make);
    return api;
  }
}

/**
 * Mount a visualization into `host`. Returns a destroy() function.
 * `vizFn(v)` sets up stages/controls and registers render/animate callbacks.
 */
export function mount(host, vizFn, options = {}) {
  const setup = () => {
    const instance = new Runtime(host);
    try { vizFn(instance.api); } catch (error) { instance.fail(error); }
    return instance;
  };
  let rt = setup();
  if (options.state && !rt.dead) {
    try { rt.state.restore(options.state); }
    catch (error) {
      // A dependent adapter can reject only after control callbacks run. Discard every
      // partially replayed runtime, including its timers/listeners, and mount fresh defaults.
      rt.destroy(); rt = setup();
      const notice = h('div', 'viz-state-notice'); notice.setAttribute('role', 'status');
      notice.textContent = `Saved state could not be restored: ${error.message}`; host.prepend(notice);
      options.onStateError?.(error);
    }
  }
  rt.invalidate();
  const destroy = () => rt.destroy();
  destroy.snapshot = () => rt.state.capture();
  destroy.stateInfo = () => ({ custom: [...rt.customState] });
  return destroy;
}
