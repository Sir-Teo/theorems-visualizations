// Abstract Algebra (Judson) — Chapter 1: helpers shared by ch01.js and ch01-b.js (plain named exports).
//
// Three families of pictures run through the chapter: Venn diagrams driven by typed set expressions,
// arrow diagrams of maps between small finite sets (editable by dragging arrows), and relations on a
// small set drawn as 0/1 matrices next to the partitions they cut out.

/** Category colours for elements, blocks and classes (palette names only). */
export const CAT = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
export const LET = 'abcdefghijklmnopqrstuvwxyz';

// ------------------------------------------------------------------ set expressions
/**
 * Parse a set expression in A, B, C (U = universe, ∅ or 0 = empty set).
 * Operators: ∪ u + |   ∩ n & *   \ − -  (difference)   Δ ^ (symmetric difference)   complement: postfix ' or prefix ~.
 * ∩ binds tighter than ∪, \ and Δ (which associate to the left). Returns {ok, f(m), tex, vars} or {ok: false, error};
 * f takes a region code m (bit 0 = in A, bit 1 = in B, bit 2 = in C).
 */
export function parseSet(src) {
  const s = String(src).replace(/\s+/g, '');
  let i = 0;
  const fail = (msg) => { throw new Error(msg); };
  const UNION = '∪u+|', INTER = '∩n&*', DIFF = '\\−-', SYM = 'Δ^△';
  function expr() {
    let L = inter();
    while (i < s.length) {
      const c = s[i], op = UNION.includes(c) ? 'u' : DIFF.includes(c) ? 'd' : SYM.includes(c) ? 's' : null;
      if (!op) break; i++; L = { op, L, R: inter() };
    }
    return L;
  }
  function inter() { let L = unary(); while (i < s.length && INTER.includes(s[i])) { i++; L = { op: 'n', L, R: unary() }; } return L; }
  function unary() {
    if (s[i] === '~' || s[i] === '¬') { i++; return { op: 'c', L: unary() }; }
    let a = atom();
    while (s[i] === "'" || s[i] === '′' || s[i] === 'ᶜ' || s[i] === '’') { i++; a = { op: 'c', L: a }; }
    return a;
  }
  function atom() {
    const c = s[i];
    if (c === '(') { i++; const e = expr(); if (s[i] !== ')') fail('a “)” is missing'); i++; return e; }
    if (c === 'A' || c === 'B' || c === 'C' || c === 'U') { i++; return { v: c }; }
    if (c === '∅' || c === '0' || c === 'Ø' || c === 'ø') { i++; return { v: '0' }; }
    fail(c == null ? 'the expression stops too early' : `unexpected “${c}”`);
  }
  try {
    if (!s) fail('empty expression');
    const T = expr();
    if (i < s.length) fail(s[i] === ')' ? 'unmatched “)”' : `unexpected “${s[i]}”`);
    const vars = new Set(); (function walk(t) { if (t.v) { if ('ABC'.includes(t.v)) vars.add(t.v); } else { walk(t.L); if (t.R) walk(t.R); } })(T);
    return { ok: true, tree: T, f: compileSet(T), tex: setTex(T), vars };
  } catch (e) { return { ok: false, error: e.message }; }
}
function compileSet(t) {
  if (t.v) { const k = { A: 1, B: 2, C: 4 }[t.v]; return t.v === 'U' ? () => true : t.v === '0' ? () => false : (m) => !!(m & k); }
  const L = compileSet(t.L), R = t.R ? compileSet(t.R) : null;
  switch (t.op) {
    case 'c': return (m) => !L(m);
    case 'u': return (m) => L(m) || R(m);
    case 'n': return (m) => L(m) && R(m);
    case 'd': return (m) => L(m) && !R(m);
    default: return (m) => L(m) !== R(m);
  }
}
const LEVEL = { u: 1, d: 1, s: 1, n: 2 };
const OPTEX = { u: '\\cup', n: '\\cap', d: '\\setminus', s: '\\mathbin{\\triangle}' };
/** TeX of a parsed expression with only the parentheses that are needed (mixed ∪ / \ / Δ are always bracketed). */
export function setTex(t) {
  if (t.v) return t.v === '0' ? '\\varnothing' : t.v;
  if (t.op === 'c') { const inner = setTex(t.L); return t.L.v || t.L.op === 'c' ? `${inner}'` : `(${inner})'`; }
  const wrap = (c, right) => {
    const s = setTex(c);
    if (c.v || c.op === 'c') return s;
    const lc = LEVEL[c.op], lp = LEVEL[t.op];
    if (lc > lp) return s;
    if (lc === lp && c.op === t.op && (!right || t.op === 'u' || t.op === 'n')) return s;
    return `(${s})`;
  };
  return `${wrap(t.L, false)} ${OPTEX[t.op]} ${wrap(t.R, true)}`;
}
/** Region signature: which of the 8 (or 4) regions an expression contains. */
export const signature = (f, nsets = 3) => Array.from({ length: 1 << nsets }, (_, m) => f(m));
/** Region code of a point for circles [{x, y, r}, …]. */
export function regionOf(circles, x, y) { let m = 0; circles.forEach((c, k) => { if ((x - c.x) ** 2 + (y - c.y) ** 2 < c.r * c.r) m |= 1 << k; }); return m; }
/** Name of a region: e.g. m = 5 → "A ∩ B′ ∩ C" (TeX). */
export function regionTex(m, nsets = 3) { return ['A', 'B', 'C'].slice(0, nsets).map((n, k) => (m & (1 << k) ? n : `${n}'`)).join('\\cap '); }

/**
 * Draw a Venn diagram on stage s: universe rectangle U, the region set of f shaded (raster, cached by key),
 * then circle outlines and names. circles = [{x, y, r, name, color}].
 */
export function drawVenn(v, s, circles, f, o = {}) {
  const [x0, x1] = o.ux || s.xr, [y0, y1] = o.uy || s.yr, col = o.color || 'accent', key = o.key ?? JSON.stringify([circles.map((c) => [c.x, c.y, c.r]), o.sig || null, col, o.ux, o.uy]);
  if (f) {
    const on = v.ramp(o.depth ?? 0.42, col), sig = signature(f, circles.length);
    s.raster((x, y) => (x < x0 || x > x1 || y < y0 || y > y1 ? null : sig[regionOf(circles, x, y)] ? on : null), { key, id: o.id || 'venn', res: 2 });
  }
  s.rect(x0, y0, x1, y1, { color: 'muted', width: 1.4, fill: false });
  if (o.ulabel !== false) s.text('U', x0, y1, { dx: 7, dy: 11, color: 'muted', math: true, size: 15 });
  for (const c of circles) s.circle(c.x, c.y, c.r, { color: c.color || 'ink', width: 2, fill: false });
  for (const c of circles) if (c.name) {
    const a = c.namePos ?? Math.atan2(c.y - (y0 + y1) / 2, c.x - (x0 + x1) / 2), lx = c.x + Math.cos(a) * c.r * 0.82, ly = c.y + Math.sin(a) * c.r * 0.82;
    s.text(c.name, lx, ly, { color: c.color || 'ink', math: true, size: 17, align: 'center', weight: 700 });
  }
}
/** Deterministic, well-spread sample points inside [x0,x1]×[y0,y1] (jittered grid). */
export function samplePoints(v, n, [x0, x1], [y0, y1], seed = 3) {
  const r = v.rng(seed), cols = Math.ceil(Math.sqrt((n * (x1 - x0)) / (y1 - y0))), rows = Math.ceil(n / cols), out = [];
  const cells = []; for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) cells.push([i, j]);
  r.shuffle(cells);
  for (const [i, j] of cells.slice(0, n)) out.push([x0 + ((j + 0.2 + 0.6 * r()) / cols) * (x1 - x0), y0 + ((i + 0.2 + 0.6 * r()) / rows) * (y1 - y0)]);
  out.sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  return out;
}
/** {1, 3, 5} as TeX (∅ when empty); long sets are cut with an ellipsis. */
export function setList(arr, max = 14) {
  if (!arr.length) return '\\varnothing';
  const a = arr.length > max ? arr.slice(0, max).concat(['\\ldots']) : arr;
  return `\\{${a.join(', ')}\\}`;
}

// ------------------------------------------------------------------ arrow diagrams
/** n points evenly spaced on the vertical segment x, from yTop down to yBot (a single point sits in the middle). */
export function colPts(n, x, yTop, yBot) {
  if (n === 1) return [[x, (yTop + yBot) / 2]];
  return Array.from({ length: n }, (_, i) => [x, yTop + ((yBot - yTop) * i) / (n - 1)]);
}
/** Rounded "blob" around a column of points: the set drawn as an oval. */
export function drawBlob(v, s, pts, o = {}) {
  const padX = o.padX ?? 0.55, padY = o.padY ?? 0.55, ys = pts.map((p) => p[1]), x = pts[0][0];
  const lo = Math.min(...ys) - padY, hi = Math.max(...ys) + padY;
  s.rect(x - padX, lo, x + padX, hi, { radius: 999, fill: o.fill || 'muted', fillAlpha: o.fillAlpha ?? 0.07, color: o.color || 'muted', width: o.width ?? 1.4, alpha: o.alpha ?? 0.7 });
  if (o.name) s.text(o.name, x, hi, { dy: -14, align: 'center', color: o.nameColor || 'muted', size: o.nameSize ?? 17, math: true, weight: 600 });
}
/** Element dots with labels; st(i) may return {color, ring, hollow, label colour, r}. */
export function drawElems(v, s, pts, labels, o = {}) {
  pts.forEach(([x, y], i) => {
    const st = (o.style && o.style(i)) || {}, r = st.r ?? o.r ?? 6;
    if (st.ring) { const c = s.ctx; c.save(); c.beginPath(); c.arc(s.X(x), s.Y(y), r + 5, 0, 2 * Math.PI); c.strokeStyle = v.color(st.ring); c.lineWidth = 2.4; c.stroke(); c.restore(); }
    s.dot(x, y, { r, color: st.color || o.color || 'ink', hollow: st.hollow });
    const lab = labels[i]; if (lab == null) return;
    const side = o.side === 'left' ? -1 : 1;
    s.text(String(lab), x, y, { dx: side * (r + 7), align: side < 0 ? 'right' : 'left', color: st.labelColor || st.color || o.labelColor || 'ink', size: o.size ?? 14, math: o.math ?? true, weight: 600 });
  });
}
/** Arrow p → q in data coordinates, trimmed in pixels at both ends; bend (px) curves it (quadratic, to the left of p→q). */
export function mapArrow(v, s, p, q, st = {}) {
  const c = s.ctx, ax = s.X(p[0]), ay = s.Y(p[1]), bx = s.X(q[0]), by = s.Y(q[1]), L = Math.hypot(bx - ax, by - ay);
  if (L < 1) return;
  const t0 = st.trim0 ?? 9, t1 = st.trim1 ?? 10, bend = st.bend || 0, ux = (bx - ax) / L, uy = (by - ay) / L, nx = -uy, ny = ux;
  const mx = (ax + bx) / 2 + nx * bend, my = (ay + by) / 2 + ny * bend;
  // start/end trimmed along the curve's end tangents
  const sx0 = mx - ax, sy0 = my - ay, s0 = Math.hypot(sx0, sy0) || 1, ex0 = bx - mx, ey0 = by - my, e0 = Math.hypot(ex0, ey0) || 1;
  const Ax = ax + (sx0 / s0) * t0, Ay = ay + (sy0 / s0) * t0, Bx = bx - (ex0 / e0) * t1, By = by - (ey0 / e0) * t1;
  const col = v.color(st.color || 'ink', st.alpha), hs = st.head ?? 8, w = st.width ?? 1.8;
  c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.setLineDash(st.dash ? (st.dash === true ? [5, 4] : st.dash) : []);
  const tx = Bx - (ex0 / e0) * hs * 0.7, ty = By - (ey0 / e0) * hs * 0.7;
  c.beginPath(); c.moveTo(Ax, Ay); if (bend) c.quadraticCurveTo(mx, my, tx, ty); else c.lineTo(tx, ty); c.stroke(); c.setLineDash([]);
  if (st.head !== 0) {
    const ux2 = ex0 / e0, uy2 = ey0 / e0;
    c.beginPath(); c.moveTo(Bx, By); c.lineTo(Bx - ux2 * hs - uy2 * hs * 0.45, By - uy2 * hs + ux2 * hs * 0.45); c.lineTo(Bx - ux2 * hs + uy2 * hs * 0.45, By - uy2 * hs - ux2 * hs * 0.45); c.closePath(); c.fill();
  }
  c.restore();
}
/** A small loop arrow at p (the identity map drawn on one element). dir = +1 loops to the right, −1 to the left. */
export function loopArrow(v, s, p, st = {}) {
  const c = s.ctx, X = s.X(p[0]), Y = s.Y(p[1]), d = st.dir ?? 1, R = st.R ?? 10, col = v.color(st.color || 'green', st.alpha);
  const cx = X + d * (R + 6), phi = d > 0 ? Math.PI : 0, gap = 0.62, a0 = phi + gap, a1 = phi - gap + 2 * Math.PI;
  c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = st.width ?? 1.8;
  c.beginPath(); c.arc(cx, Y, R, a0, a1 - 0.25); c.stroke();
  const hx = cx + R * Math.cos(a1), hy = Y + R * Math.sin(a1), tx = -Math.sin(a1), ty = Math.cos(a1), hs = 7;
  c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx - tx * hs + ty * hs * 0.45, hy - ty * hs - tx * hs * 0.45); c.lineTo(hx - tx * hs - ty * hs * 0.45, hy - ty * hs + tx * hs * 0.45); c.closePath(); c.fill();
  c.restore();
}
/**
 * Drag-to-link editing for arrow diagrams. cols() returns [{pts, to}] where `to` is the index of the column its arrows point
 * into (or null for a column without outgoing arrows). Dragging from an element of a column with `to` to an element of
 * column `to` calls onLink(c, i, j); a click (press and release on an element) calls onTap(c, i). Returns {drag} for drawing
 * the rubber band: drag = {c, i, x, y} while a drag is in progress.
 */
export function linkEditor(v, s, cols, onLink, onTap, R = 18) {
  const ed = { drag: null };
  const near = (x, y, pts) => { let best = -1, bd = R; pts.forEach((p, k) => { const d = Math.hypot(s.X(p[0]) - s.X(x), s.Y(p[1]) - s.Y(y)); if (d < bd) { bd = d; best = k; } }); return best; };
  s.onDrag((x, y, ph) => {
    const C = cols();
    if (ph === 'start') {
      ed.drag = null;
      C.forEach((col, c) => { if (ed.drag || col.to == null) return; const i = near(x, y, col.pts); if (i >= 0) ed.drag = { c, i, x, y, moved: false }; });
      return;
    }
    if (!ed.drag) return;
    if (ph === 'move') { ed.drag.x = x; ed.drag.y = y; ed.drag.moved = true; return; }
    const { c, i } = ed.drag, tgt = C[C[c].to], j = tgt ? near(x, y, tgt.pts) : -1;
    if (ed.drag.moved && j >= 0) onLink(c, i, j);
    ed.drag = null;
  });
  if (onTap) s.onClick((x, y) => { const C = cols(); for (let c = 0; c < C.length; c++) { const i = near(x, y, C[c].pts); if (i >= 0) { onTap(c, i); return; } } });
  ed.rubber = (st = {}) => { if (!ed.drag || !ed.drag.moved) return; const p = cols()[ed.drag.c].pts[ed.drag.i]; mapArrow(v, s, p, [ed.drag.x, ed.drag.y], { color: 'gold', width: 2.2, dash: true, trim1: 0, ...st }); };
  return ed;
}
/** Properties of a map f: {0..m−1} → {0..n−1} given as an array. */
export function mapInfo(f, n) {
  const hits = Array.from({ length: n }, () => []);
  f.forEach((b, a) => { if (b != null && b >= 0) hits[b].push(a); });
  const collisions = hits.map((h, b) => [b, h]).filter(([, h]) => h.length > 1);
  const missed = hits.map((h, b) => (h.length ? -1 : b)).filter((b) => b >= 0);
  return { hits, collisions, missed, inj: !collisions.length, surj: !missed.length, bij: !collisions.length && !missed.length };
}
/** Badge text ✓ / ✗ for readouts. */
export const tick = (ok) => (ok ? '✓' : '✗');

// ------------------------------------------------------------------ relations and partitions
export const zeros = (n) => Array.from({ length: n }, () => Array(n).fill(false));
/** Failures of the three equivalence axioms, with witnesses. */
export function relChecks(R) {
  const n = R.length, refl = [], sym = [], trans = [];
  for (let i = 0; i < n; i++) if (!R[i][i]) refl.push(i);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (R[i][j] && !R[j][i]) sym.push([i, j]);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (R[i][j]) for (let k = 0; k < n; k++) if (R[j][k] && !R[i][k]) trans.push([i, j, k]);
  return { refl, sym, trans, ok: !refl.length && !sym.length && !trans.length };
}
/** Smallest equivalence relation containing R (reflexive–symmetric closure, then Warshall). */
export function eqClosure(R) {
  const n = R.length, S = R.map((row, i) => row.map((x, j) => x || R[j][i] || i === j));
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) if (S[i][k]) for (let j = 0; j < n; j++) if (S[k][j]) S[i][j] = true;
  return S;
}
/** Classes of an equivalence relation, in order of their smallest element. */
export function classesOf(R) {
  const n = R.length, seen = Array(n).fill(false), out = [];
  for (let i = 0; i < n; i++) if (!seen[i]) { const cl = []; for (let j = 0; j < n; j++) if (R[i][j] && R[j][i]) { cl.push(j); seen[j] = true; } if (!cl.includes(i)) { cl.unshift(i); seen[i] = true; } out.push(cl); }
  return out;
}
/** The relation "same block" of a partition given as a block index per element. */
export function relOfBlocks(block) { return block.map((b) => block.map((c) => b === c)); }
/** Bell numbers B_0 … B_n (number of partitions of an n-set). */
export function bell(n) { let row = [1]; const B = [1]; for (let i = 1; i <= n; i++) { const nr = [row[row.length - 1]]; for (const x of row) nr.push(nr[nr.length - 1] + x); row = nr; B.push(row[0]); } return B; }
