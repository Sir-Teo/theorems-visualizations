// Table kit — grids of cells: DP tables, Cayley tables, payoff matrices, truth tables, transition matrices.
// Reference: docs/kits.md.
//
//   const T = v.table(stage, { rows, cols, value: (i, j) => …, rowLabels, colLabels, fill: (i, j) => colour });
//   v.render(() => { T.draw({ highlight: [[i, j]] }); T.arrow([i, j], [i - 1, j - 1]); });
//   stage.onClick((x, y) => { const c = T.hit(x, y); … });
//
// Row i counts down from the top, column j to the right. With fit (default) the table is centred in the stage
// and sized in pixels; with cell: [w, h] it sits at (x0, y0) = top-left corner of cell (0, 0) in data units.
import { cmap } from '../math.js';

const FONT = (size, weight = 500) => `${weight} ${size}px Inter, system-ui, sans-serif`;
const val = (f, ...a) => (typeof f === 'function' ? f(...a) : f);
const isTex = (s) => typeof s === 'string' && s.length > 1 && s[0] === '$' && s[s.length - 1] === '$';
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const minus = (s) => String(s).replace(/^-/, '−');

class Table {
  constructor(api, rt, stage, spec = {}) {
    if (!stage || typeof stage.X !== 'function') throw new Error('v.table(stage, spec): the first argument must be a 2D stage');
    this.api = api; this.rt = rt; this.s = stage;
    this.o = { rows: 3, cols: 3, size: 14, margin: 10, square: true, maxCell: 62, minCell: 14, fillAlpha: 0.28, ...spec };
    if (!spec.cell && spec.fit == null) this.o.fit = true;
    this.geo = null;
  }
  /** Change spec keys (rows, cols, value, …) for all later draws. */
  set(spec) { Object.assign(this.o, spec); return this; }
  get rows() { return this.o.rows; }
  get cols() { return this.o.cols; }
  _label(L, k) { return Array.isArray(L) ? L[k] : typeof L === 'function' ? L(k) : null; }
  _textW(str, size, weight = 600) {
    if (str == null) return 0; str = String(str);
    if (isTex(str)) return str.replace(/\\[a-zA-Z]+|[{}^_$\\]/g, (m) => (m.length > 2 ? 'x' : '')).length * size * 0.62 + 6;
    const c = this.s.ctx; c.save(); c.font = FONT(size, weight); const w = c.measureText(str).width; c.restore(); return w;
  }
  /** Geometry in px and data units: {X0, Y0, cw, ch, lw, lh, x0, y0, w, h}. */
  layout(o = this.o) {
    const s = this.s, rows = o.rows, cols = o.cols, sx = Math.abs(s.X(1) - s.X(0)), sy = Math.abs(s.Y(0) - s.Y(1));
    const ls = o.labelSize ?? Math.min(o.size, 13.5);
    let X0, Y0, cw, ch, lw = 0, lh = 0;
    if (o.cell) {
      cw = o.cell[0] * sx; ch = o.cell[1] * sy; X0 = s.X(o.x0 ?? 0); Y0 = s.Y(o.y0 ?? 0);
      if (o.rowLabels) lw = o.labelWidth != null ? o.labelWidth * sx : cw;
      if (o.colLabels) lh = o.labelHeight != null ? o.labelHeight * sy : ch * 0.8;
    } else {
      const m = o.margin, R = o.region; // region: [x0, y0, x1, y1] in data units, default the whole stage
      const l = R ? s.X(R[0]) : 0, r = R ? s.X(R[2]) : s.width, t = R ? s.Y(R[3]) : 0, b = R ? s.Y(R[1]) : s.height;
      if (o.rowLabels) { let mw = 0; for (let i = 0; i < rows; i++) mw = Math.max(mw, this._textW(this._label(o.rowLabels, i), ls)); lw = Math.max(24, mw + 16); }
      if (o.colLabels) lh = Math.max(22, ls * 1.9);
      cw = (r - l - 2 * m - lw) / cols; ch = (b - t - 2 * m - lh) / rows;
      if (o.square) cw = ch = Math.min(cw, ch);
      cw = Math.max(o.minCell, Math.min(o.maxCell * (o.cellAspect ?? 1), cw)); ch = Math.max(o.minCell, Math.min(o.maxCell, ch));
      const tw = lw + cols * cw, th = lh + rows * ch, align = o.align || 'center';
      const left = align === 'left' ? l + m : align === 'right' ? r - m - tw : (l + r - tw) / 2;
      X0 = left + lw; Y0 = (t + b - th) / 2 + lh;
    }
    return this.geo = { rows, cols, X0, Y0, cw, ch, lw, lh, x0: s.invX(X0), y0: s.invY(Y0), w: cw / sx, h: ch / sy };
  }
  _fillColor(f, o) {
    if (f == null || f === false) return null;
    if (Array.isArray(f) && f.length >= 3 && typeof f[0] === 'number') return [this.api.color(f, 1).replace('rgb(', 'rgba(').replace(')', `,${f[3] ?? o.heatAlpha ?? 0.9})`), f[3] ?? o.heatAlpha ?? 0.9, f];
    const [col, a] = Array.isArray(f) ? f : [f, o.fillAlpha];
    return [this.api.color(col, a), a, this.api.rgb(col)];
  }
  _fmt(v, o, i, j) {
    if (o.format) return typeof o.format === 'function' ? o.format(v, i, j) : typeof v === 'number' ? minus(v.toFixed(o.format)) : v;
    if (v == null || v === '') return null;
    if (typeof v === 'number') return v === Infinity ? '∞' : v === -Infinity ? '−∞' : Number.isNaN(v) ? '' : minus(Number.isInteger(v) ? String(v) : v.toFixed(2));
    if (typeof v === 'boolean') return v ? 'T' : 'F';
    return v;
  }
  /** Draw (call inside v.render); overrides any spec key for this draw only. */
  draw(over = {}) {
    const o = { ...this.o, ...over }, s = this.s, c = s.ctx, A = this.api, g = this.layout(o);
    const { rows, cols, X0, Y0, cw, ch, lw, lh } = g, W = cols * cw, H = rows * ch;
    const ink = A.rgb('ink'), panel = A.rgb('panel');
    c.save();
    // header bands
    c.fillStyle = A.color(o.headerFill ?? 'muted', 0.09);
    if (lh) c.fillRect(X0, Y0 - lh, W, lh);
    if (lw) c.fillRect(X0 - lw, Y0, lw, H);
    if (lh && lw && o.cornerLabel != null) c.fillRect(X0 - lw, Y0 - lh, lw, lh);
    // cells
    const textCol = [];
    for (let i = 0; i < rows; i++) {
      textCol.push([]);
      for (let j = 0; j < cols; j++) {
        const x = X0 + j * cw, y = Y0 + i * ch;
        c.fillStyle = A.color('panel'); c.fillRect(x, y, cw, ch);
        let f = val(o.fill, i, j); if (f == null && o.heat) { const t = o.heat(i, j); if (t != null && isFinite(t)) f = cmap(Math.min(1, Math.max(0, t)), o.cmap || 'viridis'); }
        const F = this._fillColor(f, o); let tc = null;
        if (F) {
          c.fillStyle = F[0]; c.fillRect(x, y, cw, ch);
          if (F[1] >= 0.55) { const rgb = F[2].slice(0, 3).map((x, k) => panel[k] + (x - panel[k]) * F[1]), L = lum(rgb); tc = Math.abs(L - lum(ink)) >= Math.abs(L - lum(panel)) ? 'ink' : 'panel'; }
        }
        textCol[i].push(tc);
      }
    }
    if (o.activeRow != null) { c.fillStyle = A.color(o.activeColor ?? 'accent', 0.07); c.fillRect(X0 - lw, Y0 + o.activeRow * ch, W + lw, ch); }
    if (o.activeCol != null) { c.fillStyle = A.color(o.activeColor ?? 'accent', 0.07); c.fillRect(X0 + o.activeCol * cw, Y0 - lh, cw, H + lh); }
    // grid lines
    c.lineWidth = 1; c.strokeStyle = A.color('faint', o.gridAlpha ?? 0.5); c.beginPath();
    for (let i = 1; i < rows; i++) { const y = Math.round(Y0 + i * ch) + 0.5; c.moveTo(X0 - lw, y); c.lineTo(X0 + W, y); }
    for (let j = 1; j < cols; j++) { const x = Math.round(X0 + j * cw) + 0.5; c.moveTo(x, Y0 - lh); c.lineTo(x, Y0 + H); }
    c.stroke();
    c.strokeStyle = A.color('muted', 0.55); c.lineWidth = 1.2; c.beginPath();
    if (lh) { c.moveTo(X0 - lw, Y0); c.lineTo(X0 + W, Y0); }
    if (lw) { c.moveTo(X0, Y0 - lh); c.lineTo(X0, Y0 + H); }
    c.stroke();
    c.strokeStyle = A.color('faint', 0.9); c.lineWidth = 1.2; c.strokeRect(X0 - (lw && lh ? lw : 0) + 0.5, Y0 - (lh && lw ? lh : 0) + 0.5, W + (lw && lh ? lw : 0) - 1, H + (lh && lw ? lh : 0) - 1);
    if (!(lw && lh)) { if (lh) c.strokeRect(X0 + 0.5, Y0 - lh + 0.5, W - 1, lh - 1); if (lw) c.strokeRect(X0 - lw + 0.5, Y0 + 0.5, lw - 1, H - 1); }
    // highlighted cells
    for (const h of o.highlight || []) {
      const [i, j, col] = h; if (i < 0 || j < 0 || i >= rows || j >= cols) continue;
      c.strokeStyle = A.color(col || o.highlightColor || 'accent'); c.lineWidth = 2.6; c.strokeRect(X0 + j * cw + 1.6, Y0 + i * ch + 1.6, cw - 3.2, ch - 3.2);
    }
    c.restore();
    // header labels
    const ls = o.labelSize ?? Math.min(o.size, 13.5);
    const label = (str, X, Y, col) => {
      if (str == null || str === '') return; str = String(str);
      if (isTex(str)) s.texPx(str.slice(1, -1), X, Y, { color: col, size: ls + 2 });
      else s.textPx(str, X, Y, { align: 'center', color: col, size: ls, weight: 600, halo: false });
    };
    for (let j = 0; j < cols && lh; j++) label(this._label(o.colLabels, j), X0 + (j + 0.5) * cw, Y0 - lh / 2, val(o.colLabelColor, j) ?? (o.activeCol === j ? o.activeColor ?? 'accent' : 'muted'));
    for (let i = 0; i < rows && lw; i++) label(this._label(o.rowLabels, i), X0 - lw / 2, Y0 + (i + 0.5) * ch, val(o.rowLabelColor, i) ?? (o.activeRow === i ? o.activeColor ?? 'accent' : 'muted'));
    if (lw && lh && o.cornerLabel != null) label(o.cornerLabel, X0 - lw / 2, Y0 - lh / 2, 'muted');
    // values
    const fs0 = Math.max(7, Math.min(o.size, ch * 0.5, cw * 0.5));
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const raw = o.value ? o.value(i, j) : o.data ? o.data[i]?.[j] : null;
      const v = this._fmt(raw, o, i, j); if (v == null || v === '') continue;
      const X = X0 + (j + 0.5) * cw, Y = Y0 + (i + 0.5) * ch, col = val(o.textColor, i, j) ?? textCol[i][j] ?? 'ink';
      if (Array.isArray(v)) { this._pair(v, X, Y, fs0, cw, o, i, j); continue; }
      const str = String(v);
      if (isTex(str)) { s.texPx(str.slice(1, -1), X, Y, { color: col, size: Math.min(fs0 + 2, ch * 0.55) }); continue; }
      const wt = val(o.weight, i, j) ?? 500; let fs = fs0; const tw = this._textW(str, fs, wt); if (tw > cw - 7) fs = Math.max(7, (fs * (cw - 7)) / tw);
      c.save(); c.font = FONT(fs, wt); c.fillStyle = A.color(col); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(str, X, Y + 0.5); c.restore();
    }
    // small annotations in the bottom-right corner of cells
    if (o.sub) for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const t = o.sub(i, j); if (t == null || t === '') continue;
      c.save(); c.font = FONT(o.subSize ?? Math.max(7, Math.min(10, ch * 0.24)), 600); c.fillStyle = A.color(val(o.subColor, i, j) ?? 'muted'); c.textAlign = 'right'; c.textBaseline = 'bottom';
      c.fillText(String(t), X0 + (j + 1) * cw - 3, Y0 + (i + 1) * ch - 2); c.restore();
    }
    return this;
  }
  _pair(parts, X, Y, fs, cw, o, i, j) {
    const c = this.s.ctx, A = this.api, cols = val(o.pairColors, i, j) || ['blue', 'red'], sep = o.pairSep ?? ', ';
    const strs = parts.map((p) => (typeof p === 'number' ? minus(Number.isInteger(p) ? p : p.toFixed(1)) : String(p)));
    const wt = val(o.weight, i, j) ?? 600;
    let w = strs.reduce((t, s2, k) => t + this._textW(s2, fs, wt) + (k ? this._textW(sep, fs, 400) : 0), 0);
    if (w > cw - 8) { fs = Math.max(7, (fs * (cw - 8)) / w); w = cw - 8; }
    c.save(); c.textBaseline = 'middle'; c.textAlign = 'left'; let x = X - w / 2;
    strs.forEach((s2, k) => {
      if (k) { c.font = FONT(fs, 400); c.fillStyle = A.color('muted'); c.fillText(sep, x, Y + 0.5); x += c.measureText(sep).width; }
      c.font = FONT(fs, wt); c.fillStyle = A.color(cols[k % cols.length]); c.fillText(s2, x, Y + 0.5); x += c.measureText(s2).width;
    });
    c.restore();
  }
  _g() { return this.geo || this.layout(); }
  /** Cell under data point (x, y): {i, j}; header cells give i = −1 or j = −1 (with header: 'col' | 'row'); null outside. */
  hit(x, y) {
    const g = this._g(), px = this.s.X(x), py = this.s.Y(y), j = Math.floor((px - g.X0) / g.cw), i = Math.floor((py - g.Y0) / g.ch);
    if (i >= 0 && i < g.rows && j >= 0 && j < g.cols) return { i, j };
    if (i >= 0 && i < g.rows && px < g.X0 && px >= g.X0 - g.lw) return { i, j: -1, header: 'row' };
    if (j >= 0 && j < g.cols && py < g.Y0 && py >= g.Y0 - g.lh) return { i: -1, j, header: 'col' };
    return null;
  }
  _pc(i, j) { const g = this._g(); return [g.X0 + (j + 0.5) * g.cw, g.Y0 + (i + 0.5) * g.ch]; }
  /** Centre of cell (i, j) in data coordinates (j = −1 / i = −1 address the header cells). */
  cellCenter(i, j) { const [X, Y] = this._pc(i, j); return [this.s.invX(X), this.s.invY(Y)]; }
  /** [x0, y0, x1, y1] of cell (i, j) in data coordinates. */
  cellRect(i, j) { const g = this._g(), X = g.X0 + j * g.cw, Y = g.Y0 + i * g.ch; return [this.s.invX(X), this.s.invY(Y + g.ch), this.s.invX(X + g.cw), this.s.invY(Y)]; }
  _arrowPx(ax, ay, bx, by, st) {
    const c = this.s.ctx, L = Math.hypot(bx - ax, by - ay); if (L < 2) return;
    const ux = (bx - ax) / L, uy = (by - ay) / L, hs = Math.min(st.head ?? 7, L * 0.5), col = this.api.color(st.color || 'accent', st.alpha);
    c.save(); c.strokeStyle = c.fillStyle = col; c.lineWidth = st.width ?? 1.8; c.lineCap = 'round'; c.setLineDash(st.dash ? (st.dash === true ? [4, 3] : st.dash) : []);
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx - ux * hs * 0.75, by - uy * hs * 0.75); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - ux * hs - uy * hs * 0.48, by - uy * hs + ux * hs * 0.48); c.lineTo(bx - ux * hs + uy * hs * 0.48, by - uy * hs - ux * hs * 0.48); c.closePath(); c.fill(); c.restore();
  }
  /** Arrow between two cells (e.g. a DP back-pointer), trimmed so it does not cover the values. st: {color, width, head, dash, trim}. */
  arrow(a, b, st = {}) {
    const g = this._g(), [ax, ay] = this._pc(a[0], a[1]), [bx, by] = this._pc(b[0], b[1]), L = Math.hypot(bx - ax, by - ay); if (L < 1) return this;
    const ux = (bx - ax) / L, uy = (by - ay) / L, tb = Math.min(ux ? g.cw / 2 / Math.abs(ux) : Infinity, uy ? g.ch / 2 / Math.abs(uy) : Infinity), k = st.trim ?? 0.56;
    this._arrowPx(ax + ux * tb * k, ay + uy * tb * k, bx - ux * tb * k, by - uy * tb * k, st);
    return this;
  }
  /** Small arrow inside cell (i, j) pointing towards the neighbour in direction [di, dj] (CLRS-style back-pointer). */
  pointer(i, j, [di, dj], st = {}) {
    const g = this._g(), [cx, cy] = this._pc(i, j), L = Math.hypot(di, dj) || 1, ux = dj / L, uy = di / L;
    const tb = Math.min(ux ? g.cw / 2 / Math.abs(ux) : Infinity, uy ? g.ch / 2 / Math.abs(uy) : Infinity);
    this._arrowPx(cx + ux * tb * (st.from ?? 0.5), cy + uy * tb * (st.from ?? 0.5), cx + ux * tb * (st.to ?? 0.94), cy + uy * tb * (st.to ?? 0.94), { color: 'muted', width: 1.5, head: 5.5, ...st });
    return this;
  }
  /** Outline a rectangular block of cells [i0..i1] × [j0..j1]. */
  box(i0, j0, i1, j1, st = {}) {
    const g = this._g(), c = this.s.ctx; c.save(); c.strokeStyle = this.api.color(st.color || 'accent', st.alpha); c.lineWidth = st.width ?? 2.4; c.setLineDash(st.dash ? [5, 4] : []);
    c.strokeRect(g.X0 + j0 * g.cw + 1.5, g.Y0 + i0 * g.ch + 1.5, (j1 - j0 + 1) * g.cw - 3, (i1 - i0 + 1) * g.ch - 3); c.restore(); return this;
  }
}

export default function table(api, rt, stage, spec) { return new Table(api, rt, stage, spec); }
