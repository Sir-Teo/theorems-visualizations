// Algorithms — Chapter 7 (dynamic programming): helpers shared by ch07.js and ch07-b.js.

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const plural = (n, w, ws) => `${n} ${n === 1 ? w : ws || w + 's'}`;
/** Round to at most 2 decimals, real minus sign. */
export const r2 = (x) => (x === Infinity ? '∞' : String(Math.round(x * 100) / 100).replace('-', '−'));
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const sup = (n) => String(n).split('').map((d) => (d === '-' ? '⁻' : SUP[+d])).join('');
/** Plain-text big number: 12,345 or 1.23 × 10⁹. */
export function big(x) {
  if (!isFinite(x)) return '∞';
  if (Math.abs(x) >= 1e7) { const e = Math.floor(Math.log10(Math.abs(x))); return `${(x / 10 ** e).toFixed(2)} × 10${sup(e)}`; }
  return Math.round(x).toLocaleString('en-US');
}
/** TeX big number: 12{,}345 or 1.23\times10^{9}. */
export function tbig(x) {
  if (!isFinite(x)) return '\\infty';
  if (Math.abs(x) >= 1e7) { const e = Math.floor(Math.log10(Math.abs(x))); return `${(x / 10 ** e).toFixed(2)}\\times10^{${e}}`; }
  return Math.round(x).toLocaleString('en-US').replace(/,/g, '{,}');
}
/** Set a chart's window with room for tick labels: l px on the left, b px at the bottom, r px right, t px on top. */
export function pv(s, [x0, x1], [y0, y1], { l = 34, b = 26, r = 10, t = 6 } = {}) {
  const kx = (x1 - x0) / Math.max(40, s.width - l - r), ky = (y1 - y0) / Math.max(40, s.height - b - t);
  s.setView([x0 - l * kx, x1 + r * kx], [y0 - b * ky, y1 + t * ky]);
}
/** Keep letters and digits, upper-case, at most max characters. */
export const cleanWord = (str, max = 10) => String(str || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, max);
/** Quadratic Bézier arrow in data coordinates, bulging by `bend` pixels to the left of the direction a → b. */
export function arcArrow(s, ax, ay, bx, by, bend, st = {}) {
  const X1 = s.X(ax), Y1 = s.Y(ay), X2 = s.X(bx), Y2 = s.Y(by), L = Math.hypot(X2 - X1, Y2 - Y1) || 1;
  const nx = (Y2 - Y1) / L, ny = -(X2 - X1) / L, CX = (X1 + X2) / 2 + nx * bend, CY = (Y1 + Y2) / 2 + ny * bend;
  const pts = [];
  for (let k = 0; k <= 24; k++) { const t = k / 24, u = 1 - t; pts.push([s.invX(u * u * X1 + 2 * u * t * CX + t * t * X2), s.invY(u * u * Y1 + 2 * u * t * CY + t * t * Y2)]); }
  s.path(pts.slice(0, 23), { color: st.color || 'muted', width: st.width ?? 1.6, alpha: st.alpha, dash: st.dash });
  if (st.head !== false) { const p = pts[21], q = pts[24]; s.arrow(p[0], p[1], q[0], q[1], { color: st.color || 'muted', width: st.width ?? 1.6, head: st.headSize ?? 7, alpha: st.alpha }); }
  return pts[12];
}

// ---------------------------------------------------------------- edit distance (7.8, 7.9)
/** Full edit-distance table with costs c = {ins, del, sub}. P[i][j] = back-pointer [di, dj]; ties prefer a match, then deletion, then insertion, then substitution. */
export function editTable(X, Y, c = { ins: 1, del: 1, sub: 1 }) {
  const m = X.length, n = Y.length, D = [], P = [];
  for (let i = 0; i <= m; i++) { D.push(new Array(n + 1).fill(0)); P.push(new Array(n + 1).fill(null)); }
  for (let i = 1; i <= m; i++) { D[i][0] = D[i - 1][0] + c.del; P[i][0] = [-1, 0]; }
  for (let j = 1; j <= n; j++) { D[0][j] = D[0][j - 1] + c.ins; P[0][j] = [0, -1]; }
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const dg = D[i - 1][j - 1] + (X[i - 1] === Y[j - 1] ? 0 : c.sub), dl = D[i - 1][j] + c.del, is = D[i][j - 1] + c.ins;
    const b = Math.min(dg, dl, is), same = X[i - 1] === Y[j - 1]; D[i][j] = b;
    P[i][j] = same && b === dg ? [-1, -1] : b === dl ? [-1, 0] : b === is ? [0, -1] : [-1, -1];
  }
  return { D, P, m, n };
}
/** Follow back-pointers from (m, n): path of cells (from the corner back to (0, 0)) and alignment columns in forward order. */
export function editTrace(X, Y, P) {
  let i = X.length, j = Y.length; const path = [[i, j]], cols = [];
  while (i > 0 || j > 0) {
    const [di, dj] = P[i][j];
    if (di && dj) cols.unshift({ a: X[i - 1], b: Y[j - 1], op: X[i - 1] === Y[j - 1] ? 'match' : 'sub', i, j });
    else if (di) cols.unshift({ a: X[i - 1], b: null, op: 'del', i, j });
    else cols.unshift({ a: null, b: Y[j - 1], op: 'ins', i, j });
    i += di; j += dj; path.push([i, j]);
  }
  return { path, cols };
}
/** Cost of an alignment (list of columns) under costs c. */
export const alignCost = (cols, c) => cols.reduce((t, k) => t + (k.op === 'sub' ? c.sub : k.op === 'del' ? c.del : k.op === 'ins' ? c.ins : 0), 0);
export const OPCOL = { match: 'green', sub: 'orange', del: 'red', ins: 'purple' };
/**
 * Two rows of letter tiles (top = x, bottom = y) for an alignment, fitted into stage s.
 * o: {upto (columns shown in colour), cost: c (shows the cost under each column), minCols, labels: [top, bottom]}
 */
export function drawAlignment(s, cols, o = {}) {
  const n = Math.max(cols.length, o.minCols ?? 8), lab = o.labels || ['x', 'y'];
  s.setView([-1.25, n - 0.25], [-0.95, 1.75]);
  const tw = 0.42, th = 0.36, k0 = o.upto ?? cols.length;
  s.text(lab[0], -0.75, 1.15, { align: 'center', size: 13, weight: 700, color: 'muted' });
  s.text(lab[1], -0.75, 0.1, { align: 'center', size: 13, weight: 700, color: 'muted' });
  cols.forEach((cl, k) => {
    const on = k < k0, col = on ? OPCOL[cl.op] : 'faint';
    const tile = (ch, y) => {
      if (ch == null) { s.line(k - 0.22, y, k + 0.22, y, { color: on ? col : 'faint', width: 2.4 }); return; }
      s.rect(k - tw, y - th, k + tw, y + th, { fill: col, fillAlpha: on ? (cl.op === 'match' ? 0.22 : 0.3) : 0.08, color: col, width: on ? 1.6 : 1, radius: 4 });
      s.text(ch, k, y, { align: 'center', size: 15, weight: 700, color: on ? 'ink' : 'muted', halo: false });
    };
    tile(cl.a, 1.15); tile(cl.b, 0.1);
    if (on && cl.a != null && cl.b != null) s.line(k, 0.79, k, 0.46, { color: col, width: cl.op === 'match' ? 2.4 : 1.6, dash: cl.op === 'sub' ? [3, 3] : null });
    if (o.cost && on) {
      const cc = cl.op === 'sub' ? o.cost.sub : cl.op === 'del' ? o.cost.del : cl.op === 'ins' ? o.cost.ins : 0;
      s.text(cc ? r2(cc) : '·', k, -0.62, { align: 'center', size: 11, weight: 600, color: cc ? OPCOL[cl.op] : 'faint' });
    }
  });
  if (o.cost) s.text('cost', -0.75, -0.62, { align: 'center', size: 11, color: 'muted' });
}

// ---------------------------------------------------------------- 0/1 knapsack (7.10, 7.11)
/** K[i][w] = best value with items 1..i and capacity w; take[i][w] = item i is used in that optimum. */
export function knapTable(items, W) {
  const n = items.length, K = [new Float64Array(W + 1)], take = [new Uint8Array(W + 1)];
  for (let i = 1; i <= n; i++) {
    const { w, v } = items[i - 1], prev = K[i - 1], row = new Float64Array(W + 1), tk = new Uint8Array(W + 1);
    for (let c = 0; c <= W; c++) { row[c] = prev[c]; if (w <= c && prev[c - w] + v > row[c]) { row[c] = prev[c - w] + v; tk[c] = 1; } }
    K.push(row); take.push(tk);
  }
  return { K, take };
}
/** Items chosen by tracing back from (i, c). */
export function knapPick(items, take, i, c) {
  const out = [];
  for (let k = i; k >= 1; k--) if (take[k][c]) { out.unshift(k); c -= items[k - 1].w; }
  return out;
}

// ---------------------------------------------------------------- binary trees drawn with leaves/keys in order
/** Positions for a binary tree {key, l, r} (or {leaf: i}) with x = in-order slot and y = −depth. */
export function inorderLayout(t, xOf) {
  const pos = new Map(); let maxD = 0;
  (function go(u, d) {
    if (!u) return; maxD = Math.max(maxD, d);
    go(u.l, d + 1); go(u.r, d + 1);
    const x = xOf ? xOf(u) : null;
    pos.set(u, [x != null ? x : (pos.get(u.l)[0] + pos.get(u.r)[0]) / 2, -d]);
  })(t, 0);
  return { pos, depth: maxD };
}
