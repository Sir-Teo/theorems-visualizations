// Abstract Algebra (Judson) — Chapter 2: helpers shared by ch02.js and ch02-b.js (plain named exports).
//
// Elementary number theory done honestly (gcd, the Euclidean algorithm with back-substitution, divisors, primes,
// factorizations), plus the three pictures the chapter keeps returning to: a number line of integers, a row of
// labelled tiles, and factor trees whose leaves are primes.

export const mod = (a, n) => ((a % n) + n) % n;
export function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
/** Extended Euclid for integers: {g, x, y} with a·x + b·y = g = gcd(a, b) ≥ 0. */
export function egcd(a, b) {
  let [r0, r1, s0, s1, t0, t1] = [a, b, 1, 0, 0, 1];
  while (r1) { const q = Math.floor(r0 / r1); [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; [t0, t1] = [t1, t0 - q * t1]; }
  if (r0 < 0) { r0 = -r0; s0 = -s0; t0 = -t0; }
  return { g: r0, x: s0, y: t0 };
}
/**
 * The Euclidean algorithm for a ≥ b > 0 as rows {a, b, q, r} with a = b·q + r, ending with r = 0, and the Bézout
 * coefficients obtained by back-substitution: row i gets {s, t} with gcd = a_i·s + b_i·t.
 */
export function euclid(a, b) {
  const rows = [];
  while (b > 0) { const q = Math.floor(a / b), r = a - b * q; rows.push({ a, b, q, r }); [a, b] = [b, r]; }
  const k = rows.length; if (!k) return { rows, g: a };
  rows[k - 1].s = 0; rows[k - 1].t = 1;              // gcd = b_k = a_k·0 + b_k·1
  for (let i = k - 2; i >= 0; i--) { const n = rows[i + 1]; rows[i].s = n.t; rows[i].t = n.s - rows[i].q * n.t; }
  return { rows, g: rows[k - 1].b };
}
export function divisors(n) { n = Math.abs(n); const lo = [], hi = []; for (let d = 1; d * d <= n; d++) if (n % d === 0) { lo.push(d); if (d * d !== n) hi.unshift(n / d); } return lo.concat(hi); }
export function isPrime(n) { if (n < 2 || !Number.isInteger(n)) return false; if (n < 4) return true; if (n % 2 === 0) return false; for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false; return true; }
export function spf(n) { if (n % 2 === 0) return 2; for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return d; return n; }
export function primeFactors(n) { const out = []; while (n > 1) { const p = spf(n); out.push(p); n /= p; } return out; }
/** 2^{3}\cdot 3^{2}\cdot 5 as TeX (n > 1). */
export function factorTex(n) {
  const fs = primeFactors(n), m = new Map(); fs.forEach((p) => m.set(p, (m.get(p) || 0) + 1));
  return [...m].map(([p, e]) => (e > 1 ? `${p}^{${e}}` : String(p))).join('\\cdot ') || '1';
}
export const sub = (k) => String(k).replace(/-/g, '−');
/** Integer with a real minus sign, wrapped in parentheses when negative (for "a·(−5)"). */
export const par = (k) => (k < 0 ? `(${sub(k)})` : sub(k));
export const signed = (k) => (k < 0 ? `- ${-k}` : `+ ${k}`);

// ------------------------------------------------------------------ factor trees
/**
 * Factorizations n = a·b with 1 < a ≤ b (only even a, b when `even`, i.e. inside 2ℤ, where the "primes" are the
 * numbers that are not a product of two even numbers).
 */
export function splits(n, even = false) {
  const out = [];
  for (let a = 2; a * a <= n; a++) if (n % a === 0 && (!even || (a % 2 === 0 && (n / a) % 2 === 0))) out.push([a, n / a]);
  return out;
}
/** Build a factor tree; choose(n, path, options) → index into the split options (default 0). */
export function buildTree(n, choose = () => 0, even = false, path = '') {
  const opts = splits(n, even);
  if (!opts.length) return { n, path, leaf: true, opts };
  const k = Math.min(opts.length - 1, Math.max(0, choose(n, path, opts) | 0)), [a, b] = opts[k];
  return { n, path, opts, k, kids: [buildTree(a, choose, even, path + 'L'), buildTree(b, choose, even, path + 'R')] };
}
export function leaves(T) { return T.leaf ? [T.n] : T.kids.flatMap(leaves); }
export function depth(T) { return T.leaf ? 0 : 1 + Math.max(...T.kids.map(depth)); }
/** Positions: leaves evenly spaced across [x0, x1], parents centred over their children, rows dy apart from yTop. */
export function layoutTree(T, x0, x1, yTop, dy) {
  const L = leaves(T).length; let i = 0; const nodes = [];
  (function walk(t, d) {
    t.y = yTop - d * dy;
    if (t.leaf) { t.x = L === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * (i + 0.5)) / L; i++; }
    else { t.kids.forEach((c) => walk(c, d + 1)); t.x = (t.kids[0].x + t.kids[1].x) / 2; }
    nodes.push(t);
  })(T, 0);
  return nodes;
}
/**
 * Draw a laid-out factor tree: edges, then rounded number boxes (leaves green = prime, composites accent).
 * o.style(t) may return {fill, color, ring} overrides; o.hint marks nodes with other splits available.
 */
export function drawTree(v, s, T, o = {}) {
  const nodes = []; (function walk(t) { nodes.push(t); if (!t.leaf) t.kids.forEach(walk); })(T);
  for (const t of nodes) if (!t.leaf) for (const c of t.kids) s.line(t.x, t.y, c.x, c.y, { color: o.edge || 'muted', width: 1.6 });
  for (const t of nodes) {
    const st = (o.style && o.style(t)) || {}, txt = String(t.n), wpx = 11 + 8.2 * txt.length, hpx = 22;
    const w = wpx / 2 / s.scale, h = hpx / 2 / Math.abs(s.Y(0) - s.Y(1));
    const col = st.color || (t.leaf ? (o.leafColor || 'green') : 'accent');
    s.rect(t.x - w, t.y - h, t.x + w, t.y + h, { radius: 7, fill: st.fill || col, fillAlpha: st.fillAlpha ?? (t.leaf ? 0.3 : 0.12), color: col, width: st.ring ? 3 : 1.6 });
    s.text(txt, t.x, t.y, { align: 'center', size: 13, weight: 700, color: st.text || 'ink' });
    if (o.hint && !t.leaf && t.opts.length > 1) s.text(`${t.k + 1}/${t.opts.length}`, t.x + w, t.y + h, { size: 9.5, color: 'muted', dx: 2, dy: 3 });
  }
  return nodes;
}
/** Nearest tree node to (x, y) within `px` pixels. */
export function hitTree(s, nodes, x, y, px = 22) {
  let best = null, bd = px;
  for (const t of nodes) { const d = Math.hypot(s.X(t.x) - s.X(x), s.Y(t.y) - s.Y(y)); if (d < bd) { bd = d; best = t; } }
  return best;
}

// ------------------------------------------------------------------ number lines and tiles
/** Integer number line on stage s at height y from x0 to x1: axis, ticks, labels every `every` (tick spacing `step`). */
export function numberLine(v, s, x0, x1, y, o = {}) {
  const every = o.every ?? 5, step = o.step ?? 1, tick = o.tick ?? 5;
  s.line(x0 - 0.5 * step, y, x1 + 0.5 * step, y, { color: o.color || 'muted', width: 1.4 });
  for (let k = Math.ceil(x0 / step) * step; k <= x1; k += step) {
    const big = k % every === 0;
    s.ctx.save(); s.ctx.strokeStyle = v.color(o.color || 'muted'); s.ctx.lineWidth = big ? 1.4 : 1; s.ctx.beginPath(); s.ctx.moveTo(s.X(k), s.Y(y) - (big ? tick + 2 : tick)); s.ctx.lineTo(s.X(k), s.Y(y) + (big ? tick + 2 : tick)); s.ctx.stroke(); s.ctx.restore();
    if (big && o.labels !== false) s.text(sub(k), k, y, { dy: 15 + (o.labelDy || 0), align: 'center', size: o.size || 11, color: o.labelColor || 'muted' });
  }
}
/** A rounded tile with centred text, sized in pixels. */
export function tile(v, s, x, y, txt, o = {}) {
  const t = String(txt), wpx = o.w ?? Math.max(24, 10 + 7.6 * t.length), hpx = o.h ?? 24;
  const w = wpx / 2 / s.scale, h = hpx / 2 / Math.abs(s.Y(0) - s.Y(1)), col = o.color || 'muted';
  s.rect(x - w, y - h, x + w, y + h, { radius: o.radius ?? 6, fill: o.fill || col, fillAlpha: o.fillAlpha ?? 0.14, color: col, width: o.width ?? 1.4, alpha: o.alpha });
  s.text(t, x, y, { align: 'center', size: o.size || 12.5, weight: o.weight || 700, color: o.text || 'ink', alpha: o.alpha });
  return [w, h];
}
/** Arc from (x1, y) to (x2, y) bulging by `hpx` pixels (positive = up), with an arrowhead at the end. */
export function hop(v, s, x1, x2, y, hpx, st = {}) {
  const c = s.ctx, X1 = s.X(x1), X2 = s.X(x2), Y = s.Y(y), mx = (X1 + X2) / 2, my = Y - hpx * 2;
  c.save(); c.strokeStyle = v.color(st.color || 'accent', st.alpha); c.fillStyle = c.strokeStyle; c.lineWidth = st.width ?? 2; c.setLineDash(st.dash ? [5, 4] : []);
  c.beginPath(); c.moveTo(X1, Y); c.quadraticCurveTo(mx, my, X2, Y); c.stroke(); c.setLineDash([]);
  if (st.head !== false) {
    const tx = X2 - mx, ty = Y - my, L = Math.hypot(tx, ty) || 1, ux = tx / L, uy = ty / L, hs = 8;
    c.beginPath(); c.moveTo(X2, Y); c.lineTo(X2 - ux * hs - uy * hs * 0.45, Y - uy * hs + ux * hs * 0.45); c.lineTo(X2 - ux * hs + uy * hs * 0.45, Y - uy * hs - ux * hs * 0.45); c.closePath(); c.fill();
  }
  c.restore();
}
