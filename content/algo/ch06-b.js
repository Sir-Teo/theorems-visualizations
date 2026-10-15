// Algorithms — Chapter 6: Amortized analysis and union–find (items 6.9–6.14; 6.1–6.8 in ch06.js)

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const LG = Math.log2;
const fnv = (f, ...a) => (typeof f === 'function' ? f(...a) : f);
const plural = (n, w, ws) => `${n} ${n === 1 ? w : ws || w + 's'}`;
const r2 = (x) => String(Math.round(x * 100) / 100).replace('-', '−');
const SETC = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (n) => String(n).split('').map((d) => SUP[+d]).join('');

/** Set a chart's window with room for tick labels: l px on the left, b px at the bottom, r px right, t px on top. */
function pv(s, [x0, x1], [y0, y1], { l = 32, b = 20, r = 8, t = 0 } = {}) {
  const kx = (x1 - x0) / Math.max(40, s.width - l - r), ky = (y1 - y0) / Math.max(40, s.height - b - t);
  s.setView([x0 - l * kx, x1 + r * kx], [y0 - b * ky, y1 + t * ky]);
}

// ---------- disjoint-set forests drawn with roots on top and parent pointers as arrows pointing up
/** Layout of the forest with parent array p (p[i] = i for a root): leaves at consecutive slots, parents centred above. */
function forestLayout(p) {
  const n = p.length, kids = Array.from({ length: n }, () => []), roots = [], mn = new Array(n);
  for (let i = 0; i < n; i++) (p[i] === i ? roots : kids[p[i]]).push(i);
  const minOf = (u) => { let m = u; for (const c of kids[u]) m = Math.min(m, minOf(c)); return (mn[u] = m); };
  roots.forEach(minOf);
  roots.sort((a, b) => mn[a] - mn[b]); for (const k of kids) k.sort((a, b) => mn[a] - mn[b]);
  const pos = new Map(); let slot = 0, h = 0;
  const place = (u, d) => {
    h = Math.max(h, d);
    if (!kids[u].length) { pos.set(u, { x: slot++, d }); return; }
    for (const c of kids[u]) place(c, d + 1);
    pos.set(u, { x: (pos.get(kids[u][0]).x + pos.get(kids[u][kids[u].length - 1]).x) / 2, d });
  };
  for (const r of roots) { place(r, 0); slot += 0.6; }
  return { pos, kids, roots, p: Array.from(p), w: slot - 0.6, h, n };
}
const rootOf = (p, x) => { while (p[x] !== x) x = p[x]; return x; };
const depthOf = (p, x) => { let d = 0; while (p[x] !== x) { x = p[x]; d++; } return d; };
/** Colour of each element: its tree's colour (trees with ≥ 2 elements get SETC colours in order of their smallest element). */
function treeColours(L) {
  const col = new Map(); let k = 0;
  for (const r of L.roots) {
    const c = L.kids[r].length ? SETC[k++ % SETC.length] : null;
    const go = (u) => { col.set(u, c); L.kids[u].forEach(go); }; go(r);
  }
  return col;
}
/**
 * Draw forest layout L on stage s (gliding from o.prev while o.tw < 1). Options (functions get the element id):
 * fill (solid disc), color (outline + tint), ring, label, labelColor, note → [text, colour, 'e' | 'n' | …],
 * edgeColor / edgeWidth (child, parent), ghost: [[child, oldParent]] dashed old pointers, padT/padB/padL/padR, rmax.
 */
function drawForest(s, L, o = {}) {
  const P = o.prev && o.tw != null && o.tw < 1 && o.prev !== L ? o.prev : null, tw = P ? o.tw : 1;
  const view = (M) => [[-0.65 - (o.padL || 0), Math.max(M.w - 1, 1) + 0.65 + (o.padR || 0)], [-Math.max(M.h, 1) - 0.62 - (o.padB || 0), 0.62 + (o.padT || 0)]];
  let [vx, vy] = view(L);
  if (P) { const [a, b] = view(P); vx = vx.map((x, i) => lerp(a[i], x, tw)); vy = vy.map((y, i) => lerp(b[i], y, tw)); }
  s.setView(vx, vy);
  const r = clamp(Math.min(s.sx * 0.38, s.sy * 0.3), 4, o.rmax ?? 15);
  const at = (i) => { const c = L.pos.get(i), q = P && P.pos.get(i); return q ? [lerp(q.x, c.x, tw), lerp(-q.d, -c.d, tw)] : [c.x, -c.d]; };
  const ptr = (i, j, st) => {
    const A = at(i), B = at(j), X1 = s.X(A[0]), Y1 = s.Y(A[1]), X2 = s.X(B[0]), Y2 = s.Y(B[1]), d = Math.hypot(X2 - X1, Y2 - Y1);
    if (d < 2 * r + 4) return;
    const ux = (X2 - X1) / d, uy = (Y2 - Y1) / d;
    s.arrow(s.invX(X1 + ux * (r + 1)), s.invY(Y1 + uy * (r + 1)), s.invX(X2 - ux * (r + 2)), s.invY(Y2 - uy * (r + 2)), st);
  };
  if (o.ghost) for (const [i, j] of o.ghost) if (L.pos.has(j)) ptr(i, j, { color: 'faint', width: 1.4, dash: [4, 4], head: 7 });
  for (let i = 0; i < L.n; i++) { const j = L.p[i]; if (j !== i) ptr(i, j, { color: fnv(o.edgeColor, i, j) || 'muted', width: fnv(o.edgeWidth, i, j) || 1.6, head: Math.max(6, Math.min(9, r * 0.7)) }); }
  for (let i = 0; i < L.n; i++) {
    const [x, y] = at(i), fill = fnv(o.fill, i), col = fnv(o.color, i), ring = fnv(o.ring, i);
    if (ring) s.dot(x, y, { r: r + 4, hollow: true, color: ring, width: 2.6 });
    if (fill) s.dot(x, y, { r, color: fill });
    else { s.dot(x, y, { r, hollow: true, color: col || 'muted', width: col ? 2.2 : 1.5 }); if (col) s.dot(x, y, { r: r - 1.1, color: col, alpha: 0.16, ring: false }); }
    const lab = o.label ? o.label(i) : String(i);
    if (lab != null && r >= 6.5) s.text(lab, x, y, { align: 'center', size: clamp(r * 0.86, 8, 13), weight: 700, color: fnv(o.labelColor, i) || (fill ? 'panel' : 'ink'), halo: false });
    const note = o.note && o.note(i);
    if (note) {
      const [txt, nc, pos = 'e'] = note, D = { e: [1, 0], n: [0, -1], ne: [0.72, -0.72], w: [-1, 0], s: [0, 1] }[pos];
      s.textPx(String(txt), s.X(x) + D[0] * (r + 3), s.Y(y) + D[1] * (r + 3), { align: D[0] > 0.1 ? 'left' : D[0] < -0.1 ? 'right' : 'center', baseline: D[1] > 0.1 ? 'top' : D[1] < -0.1 ? 'bottom' : 'middle', size: 10.5, weight: 700, color: nc || 'muted' });
    }
  }
  return { r, at };
}
function hitF(s, L, x, y, rad = 16) {
  let best = null, bd = rad; const X = s.X(x), Y = s.Y(y);
  for (const [i, c] of L.pos) { const d = Math.hypot(s.X(c.x) - X, s.Y(-c.d) - Y); if (d < bd) { bd = d; best = i; } }
  return best;
}

// ---------- 6.12: union by rank + path compression with witnesses (the members of a root's tree when it reached each rank)
function ufWorkload(n, kind, seed, track) {
  const p = new Int32Array(n), rank = new Int32Array(n); for (let i = 0; i < n; i++) p[i] = i;
  const mem = track ? Array.from({ length: n }, (_, i) => [i]) : null, W = track ? Array.from({ length: n }, (_, i) => [[i]]) : null;
  let s = (seed >>> 0) || 1;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }, ri = () => Math.floor(rnd() * n);
  const find = (x) => { let r = x; while (p[r] !== r) r = p[r]; while (p[x] !== r) { const nx = p[x]; p[x] = r; x = nx; } return r; };
  const union = (a, b) => {
    a = find(a); b = find(b); if (a === b) return;
    if (rank[a] > rank[b]) [a, b] = [b, a];
    p[a] = b; if (track) { mem[b] = mem[b].concat(mem[a]); mem[a] = null; }
    if (rank[a] === rank[b]) { rank[b]++; if (track) W[b][rank[b]] = mem[b].slice(); }
  };
  if (kind === 'doubling') { for (let st = 1; st < n; st *= 2) for (let i = 0; i + st < n; i += 2 * st) union(i, i + st); }
  else if (kind === 'unions') { for (let t = 0; t < 2 * n; t++) union(ri(), ri()); }
  else { for (let t = 0; t < 3 * n; t++) { if (rnd() < 0.45) union(ri(), ri()); else find(ri()); } }
  return { p, rank, W };
}

// ---------- 6.13: very large numbers as towers {h, x} meaning T_h(x), T_0(x) = x, T_{h+1}(x) = 2^{T_h(x)};
// normal form: x < 2^1000 and (h = 0 or x ≥ 1000), so normal forms compare lexicographically.
const BIG = 2 ** 1000;
function tn(h, x) {
  while (x >= BIG) { x = LG(x); h++; }
  while (h > 0 && x < 1000) { x = 2 ** x; h--; }
  return { h, x };
}
const T = (x) => tn(0, x);
const tcmp = (A, B) => (A.h !== B.h ? A.h - B.h : A.x - B.x);
const tlog = (A) => (A.h === 0 ? tn(0, LG(A.x)) : tn(A.h - 1, A.x));
const texp = (A) => (A.h === 0 && A.x < 1000 ? tn(0, 2 ** A.x) : tn(A.h + 1, A.x));
function tadd(A, B) {
  if (tcmp(A, B) < 0) [A, B] = [B, A];
  if (A.h === 0) return tn(0, A.x + B.x);
  if (A.h === 1 && B.h <= 1) { const b = B.h === 1 ? B.x : LG(Math.max(B.x, 1e-300)); return tn(1, A.x + LG(1 + 2 ** (b - A.x))); }
  return A;                                    // the smaller term is invisible at double precision
}
function tsub(A, B) {
  if (tcmp(A, B) < 0) return null;
  if (A.h === 0) return tn(0, A.x - B.x);
  if (A.h === 1 && B.h <= 1) { const b = B.h === 1 ? B.x : LG(Math.max(B.x, 1e-300)), d = b - A.x; return d === 0 ? T(0) : tn(1, A.x + LG(1 - 2 ** d)); }
  return A;
}
function tmul(A, B) {
  if ((A.h === 0 && A.x === 0) || (B.h === 0 && B.x === 0)) return T(0);
  if (A.h === 0 && B.h === 0 && A.x * B.x < BIG) return T(A.x * B.x);
  return texp(tadd(tlog(A), tlog(B)));
}
function tdiv(A, B) {
  if (B.h === 0 && B.x === 0) return null;
  if (A.h === 0 && B.h === 0) return T(A.x / B.x);
  if (tcmp(A, B) < 0) return T(0);
  const L = tsub(tlog(A), tlog(B)); return L ? texp(L) : T(0);
}
function tpow(A, B) {
  if (A.h === 0 && B.h === 0) { const v = A.x ** B.x; if (isFinite(v) && v < BIG) return T(v); }
  if (A.h === 0 && A.x <= 1) return T(A.x <= 0 ? 0 : A.x === 1 ? 1 : 0);
  return texp(tmul(B, tlog(A)));
}
/** Parse a typed number: + − × / ^ ^^ (tetration, right-associative like ^), parentheses, and literals such as 1e400. */
function parseBig(src) {
  const toks = String(src).replace(/↑↑/g, '^^').replace(/[×·]/g, '*').match(/\d+(\.\d+)?(e[+-]?\d+)?|\^\^|[-+*/^()]|\S/gi) || [];
  let i = 0;
  const peek = () => toks[i], eat = (t) => { if (toks[i] === t) { i++; return true; } return false; };
  const lit = (t) => {
    const v = Number(t); if (isFinite(v)) return T(v);
    const m = /^(\d+(?:\.\d+)?)e\+?(\d+)$/i.exec(t); if (!m) throw new Error(`cannot read ${t}`);
    return tn(1, LG(+m[1]) + +m[2] * LG(10));
  };
  const atom = () => {
    const t = peek(); if (t == null) throw new Error('unexpected end');
    if (eat('(')) { const v = sum(); if (!eat(')')) throw new Error('missing )'); return v; }
    if (/^\d/.test(t)) { i++; return lit(t); }
    throw new Error(`unexpected “${t}”`);
  };
  const power = () => {
    const b = atom();
    if (eat('^^')) {
      const k = power(); if (k.h > 0 || k.x > 2e5 || !Number.isInteger(k.x) || k.x < 1) throw new Error('a ^^ k needs a whole number 1 ≤ k ≤ 200000');
      let r = b; for (let j = 1; j < k.x; j++) r = tpow(b, r); return r;
    }
    if (eat('^')) return tpow(b, power());
    return b;
  };
  const prod = () => { let v = power(); for (;;) { if (eat('*')) v = tmul(v, power()); else if (eat('/')) { v = tdiv(v, power()); if (!v) throw new Error('division by zero'); } else return v; } };
  const sum = () => { let v = prod(); for (;;) { if (eat('+')) v = tadd(v, prod()); else if (eat('-')) { v = tsub(v, prod()); if (!v) throw new Error('negative result'); } else return v; } };
  const v = sum(); if (i < toks.length) throw new Error(`unexpected “${toks[i]}”`);
  return v;
}
const ONE = T(1);
const A2t = (N) => { const m = tadd(N, ONE); return tsub(tmul(texp(m), m), ONE); };            // A₂(j) = 2^{j+1}(j+1) − 1
function A3t(j) { let a = T(j); for (let i = 0; i <= j; i++) a = A2t(a); return a; }           // A₃(j) = A₂^{(j+1)}(j)
const A41 = (() => { let a = T(2047); for (let i = 0; i < 2048; i++) a = A2t(a); return a; })(); // A₄(1) = A₃(A₃(1)) = A₃(2047)
const AK1 = [T(2), T(3), T(7), T(2047), A41];
/** A_k applied to the tower N, when that is still representable (null otherwise). */
const Af = (k, N) => (k === 0 ? tadd(N, ONE) : k === 1 ? tadd(tmul(T(2), N), ONE) : k === 2 ? A2t(N) : k === 3 && N.h === 0 && N.x <= 5000 ? A3t(N.x) : null);
const alphaOf = (N) => { for (let k = 0; k < 5; k++) if (tcmp(AK1[k], N) >= 0) return k; return 5; };
function logStar(N) { let c = 0; while (tcmp(N, ONE) > 0 && c < 1e6) { N = tlog(N); c++; } return c; }
/** Number of 2s in a tower of about the same size: T_h(x) ≈ T_{h + s}(y) with y ≤ 1. */
const towerHeight = (N) => { let s = 0, x = N.x; if (N.h === 0 && x <= 1) return 0; while (x > 1) { x = LG(x); s++; } return N.h + s; };
const sciTeX = (x, d = 3) => { if (Math.abs(x) < 1e5) return String(Math.round(x * 10 ** (d - 2)) / 10 ** (d - 2)); const e = Math.floor(Math.log10(x)), m = x / 10 ** e; return `${m.toFixed(d - 2)}\\times10^{${e}}`; };
/** TeX for a tower number: exact below 10¹⁵, then 10^d, 10^10^d, 10^10^10^d, and 2↑↑H beyond. */
function tTeX(N) {
  if (N.h === 0 && N.x < 1e15) return String(Math.round(N.x));
  if (N.h === 0) { const e = Math.log10(N.x); return `\\approx 10^{${sciTeX(e)}}`; }
  if (N.h === 1) return `\\approx 10^{${sciTeX(N.x * Math.log10(2))}}`;
  if (N.h === 2) return `\\approx 10^{10^{${sciTeX((N.x + LG(Math.log10(2))) * Math.log10(2))}}}`;
  if (N.h === 3) return `\\approx 10^{10^{10^{${sciTeX(N.x * Math.log10(2))}}}}`;
  return `\\approx 2\\uparrow\\uparrow ${towerHeight(N)}`;
}

// ---------- 6.14: union–find costs under four heuristics, and the CLRS potential for union by rank + path compression
function ufCost(n, heur, wl, budget) {
  const p = new Int32Array(n), rk = new Int32Array(n), deepE = new Int32Array(n), deepD = new Int32Array(n);
  for (let i = 0; i < n; i++) { p[i] = i; deepE[i] = i; }
  const byRank = heur === 'both' || heur === 'rank', comp = heur === 'both' || heur === 'comp';
  let cost = 0, ops = 0, s = 12345;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }, ri = () => Math.floor(rnd() * n);
  const find = (x) => { let r = x; while (p[r] !== r) { r = p[r]; cost++; } cost++; if (comp) while (p[x] !== r) { const nx = p[x]; p[x] = r; x = nx; } return r; };
  const link = (a, b) => {                       // naive: a's root goes below b's root
    if (byRank && rk[a] > rk[b]) [a, b] = [b, a];
    p[a] = b; if (byRank && rk[a] === rk[b]) rk[b]++;
    if (deepD[a] + 1 > deepD[b]) { deepD[b] = deepD[a] + 1; deepE[b] = deepE[a]; }
    cost++;
  };
  const union = (a, b) => { ops++; const ra = find(a), rb = find(b); if (ra !== rb) link(ra, rb); return ra === rb ? ra : p[ra] === rb ? rb : ra; };
  const fnd = (x) => { ops++; return find(x); };
  const over = () => cost > budget;
  if (wl === 'random') { for (let t = 0; t < 4 * n && !over(); t++) { if (rnd() < 0.5) union(ri(), ri()); else fnd(ri()); } }
  else if (wl === 'doubling') {
    for (let st = 1; st < n && !over(); st *= 2) for (let i = 0; i + st < n && !over(); i += 2 * st) { const r = union(i, i + st); fnd(deepE[r]); }
    for (let t = 0; t < 2 * n && !over(); t++) fnd(ri());
  } else {
    for (let i = 1; i < n && !over(); i++) { union(0, i); fnd(0); }
    for (let t = 0; t < 2 * n && !over(); t++) fnd(ri());
  }
  return over() ? null : cost / ops;
}
const AKS = new Map();
function Aks(k, j) {                             // A_k(j) for small arguments, Infinity once it passes 10⁶
  if (k === 0) return j + 1;
  const key = k * 1000 + j; if (AKS.has(key)) return AKS.get(key);
  let a = j; for (let i = 0; i <= j && a !== Infinity; i++) { a = Aks(k - 1, a); if (a > 1e6) a = Infinity; }
  AKS.set(key, a); return a;
}
const alphaSmall = (n) => (n <= 2 ? 0 : n <= 3 ? 1 : n <= 7 ? 2 : n <= 2047 ? 3 : 4);
/** Run the workload with union by rank + path compression, recording actual and amortized cost of every FIND and LINK. */
function ufPotential(n, wl) {
  const p = new Int32Array(n), rk = new Int32Array(n), kids = Array.from({ length: n }, () => new Set()), phi = new Float64Array(n), a = alphaSmall(n);
  for (let i = 0; i < n; i++) p[i] = i;
  const phiOf = (x) => {
    if (p[x] === x || rk[x] === 0) return a * rk[x];
    const r = rk[x], q = rk[p[x]]; let lev = 0; while (Aks(lev + 1, r) <= q) lev++;
    let it = 0, y = r; for (;;) { y = Aks(lev, y); if (y > q) break; it++; }
    return (a - lev) * r - it;
  };
  let PHI = 0;
  const upd = (x) => { const v = phiOf(x); PHI += v - phi[x]; phi[x] = v; };
  const ev = []; let s = 777;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }, ri = () => Math.floor(rnd() * n);
  const deepE = Int32Array.from({ length: n }, (_, i) => i), deepD = new Int32Array(n);
  const find = (x) => {
    const before = PHI, path = [x]; while (p[path[path.length - 1]] !== path[path.length - 1]) path.push(p[path[path.length - 1]]);
    const r = path[path.length - 1];
    for (const w of path.slice(0, -1)) if (p[w] !== r) { kids[p[w]].delete(w); p[w] = r; kids[r].add(w); upd(w); }
    ev.push({ k: 'f', c: path.length, am: path.length + PHI - before }); return r;
  };
  const link = (x, y) => {
    const before = PHI;
    if (rk[x] > rk[y]) [x, y] = [y, x];
    p[x] = y; kids[y].add(x); upd(x);
    if (rk[x] === rk[y]) { rk[y]++; upd(y); for (const c of kids[y]) upd(c); }
    if (deepD[x] + 1 > deepD[y]) { deepD[y] = deepD[x] + 1; deepE[y] = deepE[x]; }
    ev.push({ k: 'l', c: 1, am: 1 + PHI - before }); return y;
  };
  const union = (u, w) => { const x = find(u), y = find(w); return x === y ? x : link(x, y); };
  if (wl === 'random') { for (let t = 0; t < 4 * n; t++) { if (rnd() < 0.5) union(ri(), ri()); else find(ri()); } }
  else if (wl === 'doubling') { for (let st = 1; st < n; st *= 2) for (let i = 0; i + st < n; i += 2 * st) find(deepE[union(i, i + st)]); for (let t = 0; t < 2 * n; t++) find(ri()); }
  else { for (let i = 1; i < n; i++) { union(0, i); find(0); } for (let t = 0; t < 2 * n; t++) find(ri()); }
  return { ev, alpha: a, PHI };
}

export default {
  collection: 'algo',
  chapter: 6,
  items: [
    // ------------------------------------------------------------------ 6.9
    {
      num: '6.9',
      kind: 'Definition',
      name: 'Disjoint-set (union–find) structure',
      statement: String.raw`A **disjoint-set** (union–find) structure maintains a partition of a set of elements into disjoint sets, each identified by a **representative** element, under the operations
- MAKE-SET$(x)$: add $x$ as a new singleton set;
- FIND$(x)$: return the representative of the set containing $x$ (so $x$ and $y$ are in the same set iff FIND$(x)=$ FIND$(y)$);
- UNION$(x,y)$: replace the sets containing $x$ and $y$ by their union.

In the **disjoint-set forest** representation each set is a rooted tree whose root is the representative, and every element stores only a pointer to its parent (a root points to itself). FIND follows parent pointers up to the root; UNION makes one root a child of the other. The cost of FIND is the depth of $x$, which the heuristics of 6.10 and 6.11 keep small.`,
      idea: String.raw`The forest stores far less than the partition — one pointer per element and no lists of members — yet it answers the only question asked, "same set or not?", because two elements are in the same set exactly when their pointer chains end at the same root. Linking a root below another root merges two trees in constant time without touching any other element. Union–find is what Kruskal's algorithm (10.15) uses to tell whether an edge closes a cycle.`,
      caption: String.raw`Click two elements (in either panel) to union their sets, or switch to **find** and click an element to follow its pointers to the representative. On the left the sets are drawn as bags; on the right as the trees of parent pointers that the structure actually stores, with each representative drawn solid.`,
      deps: ['algo-5.1'],
      refs: ['CLRS 4e §19.1', 'CLRS 4e §19.3'],
      credit: 'Galler & Fischer, 1964',
      tags: ['union-find', 'data structures'],
      viz(v) {
        const N = 12;
        const mode = v.select('click to', [{ value: 'union', label: 'union two elements' }, { value: 'find', label: 'find' }], 'union', { onChange: () => { sel = null; fpath = null; msg = ''; } });
        const A = v.stage({ x: [0, 9], y: [-6, 0], axes: false, equal: true, height: 300, weight: 1, minWidth: 280, title: 'the partition' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1.15, minWidth: 300, title: 'the forest of parent pointers' });
        let p, sel = null, fpath = null, msg = '', L = null, bagPos = new Map();
        const path = (x) => { const P = [x]; while (p[x] !== x) { x = p[x]; P.push(x); } return P; };
        function union(a, b, quiet) {
          const ra = rootOf(p, a), rb = rootOf(p, b);
          if (ra === rb) { msg = `${a} and ${b} are already in the same set (representative ${ra}): nothing to do.`; return; }
          p[rb] = ra; if (!quiet) msg = `Union(${a}, ${b}): the root ${rb} of ${b}'s tree now points to ${ra}, the root of ${a}'s tree. Nothing else changes.`;
        }
        function reset() { p = Array.from({ length: N }, (_, i) => i); for (const [a, b] of [[0, 3], [3, 5], [1, 7], [8, 9], [7, 10], [4, 9]]) union(a, b, true); sel = null; fpath = null; msg = ''; }
        reset();
        const click = (id) => {
          if (id == null) return;
          if (mode.value === 'find') { fpath = path(id); sel = null; msg = `Find(${id}) follows ${plural(fpath.length - 1, 'pointer')}: ${fpath.join(' → ')}. The representative is **${fpath[fpath.length - 1]}**.`; return; }
          fpath = null;
          if (sel == null) { sel = id; msg = `Selected ${id}; click a second element to union their sets.`; return; }
          if (sel === id) { sel = null; msg = ''; return; }
          union(sel, id); sel = null;
        };
        A.onClick((x, y) => { let best = null, bd = 16; for (const [i, q] of bagPos) { const d = Math.hypot(A.X(q[0]) - A.X(x), A.Y(q[1]) - A.Y(y)); if (d < bd) { bd = d; best = i; } } click(best); });
        B.onClick((x, y) => click(hitF(B, L, x, y, 17)));
        v.button('Random union', () => { const r = v.rng(p.reduce((s, x, i) => s + x * (i + 3), 7)); for (let t = 0; t < 20; t++) { const a = r.int(0, N - 1), b = r.int(0, N - 1); if (rootOf(p, a) !== rootOf(p, b)) { union(a, b); break; } } fpath = null; sel = null; });
        v.button('Reset', () => reset());
        v.render(() => {
          L = forestLayout(p);
          const col = treeColours(L), onPath = new Set(fpath || []), root = fpath && fpath[fpath.length - 1], pe = new Set();
          if (fpath) for (let i = 1; i < fpath.length; i++) pe.add(fpath[i - 1]);
          // bags: one circle per set, elements on a sunflower inside, packed in rows
          const sets = L.roots.map((r) => { const out = []; const go = (u) => { out.push(u); L.kids[u].forEach(go); }; go(r); return out.sort((a, b) => a - b); });
          const bags = sets.map((ids) => {
            const k = ids.length, loc = ids.map((_, i) => (k === 1 ? [0, 0] : [0.62 * Math.sqrt(i + 0.5) * Math.cos(i * 2.39996), 0.62 * Math.sqrt(i + 0.5) * Math.sin(i * 2.39996)]));
            return { ids, loc, R: (k === 1 ? 0 : Math.max(...loc.map(([a, b]) => Math.hypot(a, b)))) + 0.52 };
          });
          let x = 0, y = 0, rowH = 0, W = 0; const maxW = 8.4;
          for (const b of bags) { const d = 2 * b.R; if (x > 0 && x + d > maxW) { x = 0; y -= rowH + 0.3; rowH = 0; } b.cx = x + b.R; b.cy = y - b.R; x += d + 0.3; rowH = Math.max(rowH, d); W = Math.max(W, x - 0.3); }
          const H = -y + rowH;
          A.setView([-0.3, W + 0.3], [-H - 0.3, 0.3]);
          bagPos = new Map();
          bags.forEach((b) => {
            const c = col.get(b.ids[0]);
            if (b.ids.length > 1) A.circle(b.cx, b.cy, b.R, { fill: c, fillAlpha: 0.13, color: c, width: 2 });
            b.ids.forEach((id, i) => {
              const px = b.cx + b.loc[i][0], py = b.cy + b.loc[i][1]; bagPos.set(id, [px, py]);
              if (id === sel || onPath.has(id)) A.dot(px, py, { r: 15.5, hollow: true, color: id === root ? 'green' : 'gold', width: 3 });
              if (c) A.dot(px, py, { r: 12, color: c }); else A.dot(px, py, { r: 12, hollow: true, color: 'muted', width: 1.6 });
              A.text(String(id), px, py, { align: 'center', size: 12, weight: 700, color: c ? 'panel' : 'ink', halo: false });
            });
          });
          drawForest(B, L, {
            rmax: 14,
            fill: (i) => (p[i] === i ? col.get(i) || 'muted' : null),
            color: (i) => col.get(i),
            ring: (i) => (i === sel ? 'gold' : onPath.has(i) ? (i === root ? 'green' : 'gold') : null),
            edgeColor: (i) => (pe.has(i) ? 'gold' : null), edgeWidth: (i) => (pe.has(i) ? 3.4 : null),
          });
        });
        v.legend([['blue', 'one colour per set (singletons grey)', { dot: true }], ['gold', 'selected / find path', { dot: true }], ['green', 'representative found', { dot: true }]]);
        v.readout(() => {
          const sets = L.roots.map((r) => { const out = []; const go = (u) => { out.push(u); L.kids[u].forEach(go); }; go(r); return out.sort((a, b) => a - b); });
          return `${sets.map((s) => `{${s.join(', ')}}`).join(' · ')} — **${plural(sets.length, 'set')}**, tallest tree of height ${L.h}${msg ? ' · ' + msg : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.10
    {
      num: '6.10',
      kind: 'Theorem',
      name: 'Union by size keeps trees O(log n) deep',
      statement: String.raw`In a disjoint-set forest, let UNION always make the root of the tree with fewer elements a child of the root of the larger one (**union by size**). Then a tree with $s$ elements has height at most $\lfloor\log_2 s\rfloor$, so after any sequence of operations on $n$ elements every FIND takes $O(\log n)$ time. The bound is tight: uniting sets of equal size in pairs builds trees of height exactly $\log_2 n$. Without the size rule, $n-1$ unions can build a path of height $n-1$.`,
      idea: String.raw`Follow one element $x$. Its depth grows only when the root of its tree is linked below another root, and by the size rule that happens only when the other tree is at least as large, so the set containing $x$ at least doubles. A set cannot double more than $\log_2 n$ times, so $x$ never gets deeper than $\log_2|S_x|\le\log_2 n$. Union by rank (6.11) is the same idea with an upper bound on the height stored instead of the size.`,
      caption: String.raw`Step through the unions. Click any node to follow it: the chart plots its depth (blue) against $\log_2$ of the size of its set (green), and the depth can only rise when the set at least doubles. Try the three union orders, and switch off union by size to see the "big ∪ singleton" order build a path.`,
      deps: ['algo-6.9'],
      refs: ['CLRS 4e §19.3', 'Erickson notes: Disjoint Sets'],
      tags: ['union-find'],
      viz(v) {
        const ord = v.select('union order', [{ value: 'chain', label: 'big ∪ singleton' }, { value: 'pairs', label: 'equal sizes in pairs' }, { value: 'random', label: 'random' }], 'chain', { onChange: () => rebuild() });
        const nS = v.select('$n$', [{ value: 16, label: '16' }, { value: 32, label: '32' }], 16, { onChange: () => rebuild() });
        const bySize = v.toggle('union by size', true, { onChange: () => rebuild() });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.35, minWidth: 320 });
        const C = v.stage({ x: [0, 16], y: [0, 6], axes: 'box', height: 330, weight: 0.85, minWidth: 250, title: 'the followed element $x$ after each union' });
        const CODE = {
          size: ['Union(a, b):                     ▷ union by size', '  r ← Find(a);  s ← Find(b)', '  if r = s:  return', '  if size[r] > size[s]:  swap r, s', '  parent[r] ← s            ▷ the smaller tree goes below', '  size[s] ← size[s] + size[r]'],
          naive: ['Union(a, b):                     ▷ naive linking', '  r ← Find(a);  s ← Find(b)', '  if r = s:  return', '  ▷ no size test', "  parent[r] ← s            ▷ a's tree always goes below", '  size[s] ← size[s] + size[r]'],
        };
        let follow = 0, codeKey = 'size';
        function frames() {
          const n = nS.value, p = Array.from({ length: n }, (_, i) => i), size = Array(n).fill(1), r = v.rng(3);
          const F = [{ p: p.slice(), size: size.slice(), line: 1, note: `${n} singleton sets. Press ▶ to perform the unions one at a time.` }];
          const doUnion = (a, b) => {
            let ra = rootOf(p, a), rb = rootOf(p, b); if (ra === rb) return;
            const swap = bySize.value && size[ra] > size[rb]; if (swap) [ra, rb] = [rb, ra];
            const big = size[rb], small = size[ra];
            p[ra] = rb; size[rb] += size[ra];
            F.push({ p: p.slice(), size: size.slice(), a, b, child: ra, par: rb, line: bySize.value ? [4, 5, 6] : [5, 6], note: `Union(${a}, ${b}): the tree of ${ra} (${plural(small, 'element')}) goes below ${rb} (${plural(big, 'element')})${!bySize.value && small > big ? ' — the larger tree went below the smaller!' : '.'}` });
          };
          const n2 = n;
          if (ord.value === 'chain') for (let i = 1; i < n2; i++) doUnion(0, i);
          else if (ord.value === 'pairs') { for (let st = 1; st < n2; st *= 2) for (let i = 0; i + st < n2; i += 2 * st) doUnion(i, i + st); }
          else { let sets = n2; while (sets > 1) { const a = r.int(0, n2 - 1), b = r.int(0, n2 - 1); if (rootOf(p, a) !== rootOf(p, b)) { doUnion(a, b); sets--; } } }
          return F;
        }
        const S = v.steps({ frames: frames(), code: CODE.size, codeTitle: 'union', codePos: 'below', start: 'end', speed: 2.5, transition: 0.35 });
        function rebuild() { S.reset(frames(), { at: 'end' }); }
        let Lprev = null, Lcur = null, lastI = -1;
        A.onClick((x, y) => { const id = hitF(A, Lcur, x, y, 17); if (id != null) follow = id; });
        v.render(() => {
          const key = bySize.value ? 'size' : 'naive'; if (key !== codeKey) { codeKey = key; S.setCode(CODE[key], 'union'); }
          const f = S.frame, n = f.p.length; if (follow >= n) follow = 0;
          if (S.i !== lastI) { Lprev = Lcur; lastI = S.i; }
          Lcur = forestLayout(f.p);
          const prevL = S.prev && S.prev !== f ? forestLayout(S.prev.p) : null;
          const rx = rootOf(f.p, follow), inX = new Set(); for (let i = 0; i < n; i++) if (rootOf(f.p, i) === rx) inX.add(i);
          drawForest(A, Lcur, {
            prev: prevL, tw: S.tween, rmax: 13, padT: 0.15,
            fill: (i) => (i === follow ? 'gold' : f.p[i] === i ? (inX.has(i) ? 'accent' : 'muted') : null),
            color: (i) => (inX.has(i) ? 'accent' : null),
            edgeColor: (i) => (i === f.child ? 'orange' : null), edgeWidth: (i) => (i === f.child ? 3.4 : null),
            note: (i) => (f.p[i] === i && f.size[i] > 1 ? [String(f.size[i]), inX.has(i) ? 'accent' : 'muted', 'n'] : null),
          });
          // the followed element over all unions
          const F = S.frames, m = F.length - 1, dep = F.map((g) => depthOf(g.p, follow)), lsz = F.map((g) => LG(g.size[rootOf(g.p, follow)]));
          const maxD = F.map((g) => { let d = 0; for (let i = 0; i < n; i++) d = Math.max(d, depthOf(g.p, i)); return d; });
          const top = Math.max(LG(n) + 0.8, Math.max(...dep) + 0.6, Math.max(...maxD) + 0.6);
          pv(C, [0, Math.max(m, 1)], [0, top], { l: 26 });
          C.hline(LG(n), { color: 'red', dash: [6, 4], width: 1.4 });
          C.text(`log₂ n = ${LG(n)}`, Math.max(m, 1), LG(n), { align: 'right', baseline: 'bottom', dy: -2, size: 11, weight: 700, color: 'red' });
          const stair = (ys) => { const pts = []; ys.forEach((y, i) => { if (i) pts.push([i, ys[i - 1]]); pts.push([i, y]); }); return pts; };
          const i = S.i;
          C.path(stair(maxD), { color: 'orange', width: 1.2, dash: [3, 3], alpha: 0.8 });
          C.path(stair(lsz), { color: 'green', width: 1.2, alpha: 0.35 }); C.path(stair(lsz.slice(0, i + 1)), { color: 'green', width: 2.4 });
          C.path(stair(dep), { color: 'accent', width: 1.2, alpha: 0.35 }); C.path(stair(dep.slice(0, i + 1)), { color: 'accent', width: 2.8 });
          C.vline(i, { color: 'gold', width: 1.3 });
          C.dot(i, dep[i], { r: 4.5, color: dep[i] > lsz[i] + 1e-9 ? 'red' : 'gold' });
        });
        v.legend([['gold', 'followed element x (click to change)', { dot: true }], ['accent', 'depth of x'], ['green', 'log₂ |set of x|'], ['orange', 'tallest tree', { dash: true }], ['red', 'log₂ n', { dash: true }]]);
        v.readout(() => {
          const F = S.frames, f = S.frame, n = f.p.length, d = depthOf(f.p, follow), sz = f.size[rootOf(f.p, follow)], ok = d <= LG(sz) + 1e-9;
          const rises = []; for (let j = 1; j < F.length; j++) { const d0 = depthOf(F[j - 1].p, follow), d1 = depthOf(F[j].p, follow); if (d1 > d0) rises.push(`#${j} (${F[j - 1].size[rootOf(F[j - 1].p, follow)]} → ${F[j].size[rootOf(F[j].p, follow)]})`); }
          let maxD = 0; for (let i = 0; i < n; i++) maxD = Math.max(maxD, depthOf(f.p, i));
          return `$x = ${follow}$: depth **${d}**, set size ${sz}, $\\log_2 ${sz} = ${r2(LG(sz))}$ → depth ≤ log₂|set| ${ok ? '✓' : '✗'} · x got deeper at unions ${rises.length ? rises.join(', ') : '— (never)'}${bySize.value ? ', each time with its set at least doubling' : ''} · tallest tree ${maxD} ${maxD <= LG(n) ? '≤' : '>'} log₂ n = ${LG(n)} ${maxD <= LG(n) ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.11
    {
      num: '6.11',
      kind: 'Algorithm',
      name: 'Union by rank with path compression',
      statement: String.raw`Each element $x$ of a disjoint-set forest stores a parent pointer $x.p$ and an integer **rank** (0 for a new singleton). **Union by rank:** to link two roots, make the one of smaller rank a child of the other; if the ranks are equal, choose either and increase the new root's rank by 1. **Path compression:** FIND$(x)$, after reaching the root, resets the parent pointer of every node on the path from $x$ to point directly at the root.

Ranks never change except when a root gains a child of equal rank; ranks strictly increase along every path to a root, and the rank of a node is an upper bound on its height (equal to it without compression). Together the two heuristics make any $m$ operations on $n$ elements cost $O(m\,\alpha(n))$ (6.14). Path *halving* (point every second node of the path at its grandparent) achieves the same bound in a single pass.`,
      idea: String.raw`Union by rank is union by size (6.10) with a cheaper proxy: a root of rank $r$ has at least $2^r$ descendants, so heights stay logarithmic. Path compression does work now — one pass up, one pass resetting pointers — so that later FINDs on the same path take one step. Compression never moves a node to a different tree and never touches a rank, so ranks keep their meaning as an upper bound on height, which is exactly what the analysis of 6.12–6.14 needs.`,
      caption: String.raw`Click a node to FIND it: first its path to the root is highlighted, then every pointer on it is redirected to the root (old pointers dashed). The small numbers are ranks: they never change during a FIND. Switch to **union** to link two trees by rank, or compare full compression with path halving and with no compression at all.`,
      deps: ['algo-6.10', 'algo-6.9'],
      refs: ['CLRS 4e §19.3'],
      credit: 'McIlroy & Morris; Tarjan, 1975',
      tags: ['union-find'],
      viz(v) {
        const N = 20;
        const variant = v.select('FIND with', [{ value: 'full', label: 'path compression' }, { value: 'halve', label: 'path halving' }, { value: 'none', label: 'no compression' }], 'full');
        const mode = v.select('click to', [{ value: 'find', label: 'find' }, { value: 'union', label: 'union two' }], 'find', { onChange: () => { sel = null; } });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, full: true });
        const LINK = ['Union(x, y):  Link(Find-Set(x), Find-Set(y))', 'Link(x, y):', '  if x.rank > y.rank:  y.p ← x', '  else  x.p ← y', '    if x.rank = y.rank:  y.rank ← y.rank + 1'];
        const CODE = {
          full: ['Find-Set(x):', '  if x ≠ x.p:', '    x.p ← Find-Set(x.p)       ▷ path compression', '  return x.p', ...LINK],
          halve: ['Find-Set(x):                  ▷ path halving', '  while x ≠ x.p:', '    x.p ← x.p.p;  x ← x.p     ▷ skip over the parent', '  return x', ...LINK],
          none: ['Find-Set(x):                  ▷ no compression', '  while x ≠ x.p:', '    x ← x.p', '  return x', ...LINK],
        };
        let sel = null, codeV = 'full';
        const pathOf = (p, x) => { const P = [x]; while (p[x] !== x) { x = p[x]; P.push(x); } return P; };
        function compress(p, x, how) {
          const q = p.slice(), ghost = [], P = pathOf(p, x), root = P[P.length - 1];
          if (how === 'full') for (const w of P.slice(0, -1)) { if (q[w] !== root) { ghost.push([w, q[w]]); q[w] = root; } }
          else if (how === 'halve') { let w = x; while (q[w] !== w) { const g = q[q[w]]; if (g !== q[w]) { ghost.push([w, q[w]]); q[w] = g; } w = q[w]; } }
          return { q, ghost, P, root };
        }
        function build() {
          const p = Array.from({ length: N }, (_, i) => i), rank = Array(N).fill(0);
          const link = (a, b) => { if (rank[a] > rank[b]) p[b] = a; else { p[a] = b; if (rank[a] === rank[b]) rank[b]++; } };
          for (let st = 1; st < 16; st *= 2) for (let i = 0; i + st < 16; i += 2 * st) link(rootOf(p, i), rootOf(p, i + st));
          for (let st = 1; st < 4; st *= 2) for (let i = 16; i + st < 20; i += 2 * st) link(rootOf(p, i), rootOf(p, i + st));
          return { p, rank };
        }
        function findFrames(st, x, how) {
          const C = compress(st.p, x, how), F = [];
          F.push({ p: st.p, rank: st.rank, path: C.P, line: [1, 2], note: `Find(${x}): follow the parent pointers ${C.P.join(' → ')} — ${plural(C.P.length - 1, 'step')} up to the root ${C.root}.` });
          const why = how === 'none' ? 'Without compression nothing changes: the next Find on this path pays the same again.' : C.ghost.length ? `${how === 'full' ? 'Path compression' : 'Path halving'} redirects ${plural(C.ghost.length, 'pointer')} (dashed: the old ones)${how === 'full' ? `: every node on the path now points straight at ${C.root}` : ' to the grandparent'}. The ranks are untouched.` : 'Every node on the path already points at the root: nothing to compress.';
          F.push({ p: C.q, rank: st.rank, path: C.P, ghost: C.ghost, done: true, line: how === 'none' ? [2, 3, 4] : [3, 4], note: why });
          return F;
        }
        function unionFrames(st, a, b, how) {
          const A1 = compress(st.p, a, how), B1 = compress(A1.q, b, how), ra = A1.root, rb = B1.root, rank = st.rank.slice(), q = B1.q.slice();
          const F = [{ p: st.p, rank: st.rank, path: A1.P, path2: B1.P, line: 5, note: `Union(${a}, ${b}): first Find(${a}) = ${ra} and Find(${b}) = ${rb}${how !== 'none' ? ', compressing both paths' : ''}.` }];
          if (ra === rb) { F.push({ p: q, rank, ghost: [...A1.ghost, ...B1.ghost], done: true, line: 5, note: `${a} and ${b} are already in the same set.` }); return F; }
          let note;
          if (rank[ra] > rank[rb]) { q[rb] = ra; note = `rank ${rank[ra]} > rank ${rank[rb]}: ${rb} goes below ${ra}; no rank changes.`; }
          else if (rank[ra] < rank[rb]) { q[ra] = rb; note = `rank ${rank[ra]} < rank ${rank[rb]}: ${ra} goes below ${rb}; no rank changes.`; }
          else { q[ra] = rb; rank[rb]++; note = `equal ranks ${rank[ra]}: ${ra} goes below ${rb}, whose rank rises to **${rank[rb]}**.`; }
          F.push({ p: q, rank, ghost: [...A1.ghost, ...B1.ghost], linked: rank[ra] > st.rank[ra] ? rb : ra === q[ra] ? rb : ra, rankUp: rank[rb] !== st.rank[rb] ? rb : null, done: true, line: [6, 7, 8, 9], note: `Link: ${note}` });
          return F;
        }
        const start = build(), deepest = (p) => { let b = 0; for (let i = 0; i < p.length; i++) if (depthOf(p, i) > depthOf(p, b)) b = i; return b; };
        const S = v.steps({ frames: [{ p: start.p, rank: start.rank, line: 1, note: 'Two trees built by union by rank. Click a node to Find it.' }, ...findFrames(start, deepest(start.p), 'full')], code: CODE.full, codeTitle: 'disjoint-set forest', codePos: 'below', transition: 0.55, speed: 0.9, still: 'end' });
        const push = (F) => { const all = S.frames.slice(0, S.i + 1).concat(F), at = S.i + 1; S.reset(all, { at }); S.play(); };
        s.onClick((x, y) => {
          const id = hitF(s, forestLayout(S.frame.p), x, y, 17); if (id == null) return;
          const st = { p: S.frame.p, rank: S.frame.rank };
          if (mode.value === 'find') { sel = null; push(findFrames(st, id, variant.value)); return; }
          if (sel == null) { sel = id; v.invalidate(); return; }
          const a = sel; sel = null; if (a !== id) push(unionFrames(st, a, id, variant.value));
        });
        v.button('Find the deepest node', () => { const st = { p: S.frame.p, rank: S.frame.rank }; push(findFrames(st, deepest(st.p), variant.value)); });
        v.button('Rebuild', () => { sel = null; const b = build(); S.reset([{ p: b.p, rank: b.rank, line: 1, note: 'Two trees built by union by rank. Click a node to Find it.' }]); });
        v.render(() => {
          if (variant.value !== codeV) { codeV = variant.value; S.setCode(CODE[codeV], 'disjoint-set forest'); }
          const f = S.frame, L = forestLayout(f.p), prevL = S.prev && S.prev !== f ? forestLayout(S.prev.p) : null;
          const onP = new Set([...(f.path || []), ...(f.path2 || [])]), pe = new Set();
          for (const P of [f.path, f.path2]) if (P && !f.done) for (let i = 0; i + 1 < P.length; i++) pe.add(P[i]);
          const roots = new Set(L.roots);
          drawForest(s, L, {
            prev: prevL, tw: S.tween, rmax: 14, ghost: S.tween >= 0.999 ? f.ghost : null, padT: 0.1,
            fill: (i) => (roots.has(i) ? (onP.has(i) ? 'green' : 'accent') : null),
            color: (i) => (onP.has(i) ? 'gold' : null),
            ring: (i) => (i === sel ? 'gold' : null),
            edgeColor: (i) => (pe.has(i) ? 'gold' : f.ghost && f.ghost.some((g) => g[0] === i) ? 'green' : null),
            edgeWidth: (i) => (pe.has(i) ? 3.4 : f.ghost && f.ghost.some((g) => g[0] === i) ? 2.6 : null),
            note: (i) => [String(f.rank[i]), i === f.rankUp ? 'orange' : 'muted', 'e'],
          });
        });
        v.legend([['gold', 'find path', { dot: true }], ['green', 'root reached / new pointer'], ['faint', 'old pointer', { dash: true }], ['muted', 'small number = rank', { dot: true }]]);
        v.readout(() => {
          const f = S.frame, p = f.p, n = p.length;
          let inc = true; for (let i = 0; i < n; i++) if (p[i] !== i && f.rank[p[i]] <= f.rank[i]) inc = false;
          let h = 0; for (let i = 0; i < n; i++) h = Math.max(h, depthOf(p, i));
          let rankOK = true; for (let i = 0; i < n; i++) if (p[i] === i) { const L = forestLayout(p); const ht = (u) => (L.kids[u].length ? 1 + Math.max(...L.kids[u].map(ht)) : 0); if (ht(i) > f.rank[i]) rankOK = false; }
          const total = f.path ? `path of ${plural(f.path.length, 'node')}` : 'no Find yet';
          return `${total}${f.ghost ? ` · ${plural(f.ghost.length, 'pointer')} redirected` : ''} · ranks strictly increase toward every root ${inc ? '✓' : '✗'} · every root's height ≤ its rank ${rankOK ? '✓' : '✗'} · tallest tree now height **${h}**`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.12
    {
      num: '6.12',
      kind: 'Lemma',
      name: 'Rank lemma: few nodes have high rank',
      statement: String.raw`In a disjoint-set forest on $n$ elements with union by rank (with or without path compression), at any time:
(a) a root of rank $r$ has, or at the moment it got rank $r$ had, at least $2^r$ elements in its tree;
(b) at most $n/2^r$ nodes have rank $r$ or more;
(c) every rank is at most $\lfloor\log_2 n\rfloor$.`,
      idea: String.raw`(a) By induction: a root reaches rank $r$ only by absorbing another root of rank $r-1$, so its tree joins two trees of at least $2^{r-1}$ elements each; path compression never moves an element to another tree. (b) Charge each node that ever reaches rank $r$ with the $\ge 2^r$ elements of its tree at that moment. No element is charged twice: a later root of rank $r$ that contained those elements would have had to absorb a tree whose root already had rank $\ge r$, which pushes its own rank past $r$ first. So at most $n/2^r$ nodes ever reach rank $r$. (c) is (b) with $n/2^r<1$.`,
      caption: String.raw`On the left, a forest of 32 elements after a workload. Choose $r$ (or click a node to use its rank): every node of rank $\ge r$ is ringed, and the elements its tree had at the moment it reached rank $r$ are filled in its colour — at least $2^r$ of them, and the groups never overlap. On the right, the rank counts of a much larger run against $n/2^r$ on a log scale.`,
      deps: ['algo-6.11'],
      refs: ['CLRS 4e §19.4'],
      tags: ['union-find'],
      viz(v) {
        const wl = v.select('workload', [{ value: 'random', label: 'random unions and finds' }, { value: 'unions', label: 'random unions only' }, { value: 'doubling', label: 'equal ranks in pairs' }], 'random', { onChange: () => { small = ufWorkload(32, wl.value, 9, true); rS.set(Math.min(rS.value, maxR())); } });
        let small = ufWorkload(32, 'random', 9, true);
        const maxR = () => Math.max(...small.rank);
        const rS = v.slider('$r$', 0, 5, 2, { int: true });
        const kS = v.slider('$n$ for the histogram', 6, 16, 12, { int: true, fmt: (k) => String(2 ** k) });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.3, minWidth: 320, title: 'witness trees for rank $\\ge r$ ($n = 32$)' });
        const B = v.stage({ x: [-0.6, 12.6], y: [0.5, 5000], axes: 'box', ylog: true, height: 330, weight: 0.9, minWidth: 250, title: 'how many nodes have each rank' });
        let picked = null, cache = new Map();
        const big = () => { const key = wl.value + kS.value; if (!cache.has(key)) cache.set(key, ufWorkload(2 ** kS.value, wl.value, 4, false)); return cache.get(key); };
        A.onClick((x, y) => { const id = hitF(A, forestLayout(small.p), x, y, 16); if (id != null) { picked = id; rS.set(small.rank[id]); } });
        let info = {};
        v.render(() => {
          const r = Math.min(rS.value, 5), L = forestLayout(small.p), n = 32;
          const owners = []; for (let i = 0; i < n; i++) if (small.rank[i] >= r) owners.push(i);
          owners.sort((a, b) => small.rank[b] - small.rank[a] || a - b);
          const grp = new Map(); let overlap = false, sizes = [];
          owners.forEach((o, k) => { const Wset = small.W[o][r]; sizes.push(Wset.length); for (const e of Wset) { if (grp.has(e)) overlap = true; grp.set(e, k); } });
          const gc = (k) => SETC[k % SETC.length];
          drawForest(A, L, {
            rmax: 12, padT: 0.1,
            fill: (i) => (grp.has(i) && owners[grp.get(i)] === i ? gc(grp.get(i)) : null),
            color: (i) => (grp.has(i) ? gc(grp.get(i)) : null),
            ring: (i) => (i === picked ? 'ink' : small.rank[i] >= r ? gc(owners.indexOf(i)) : null),
            note: (i) => (small.rank[i] ? [String(small.rank[i]), small.rank[i] >= r ? 'ink' : 'faint', 'e'] : null),
            labelColor: (i) => (grp.has(i) && owners[grp.get(i)] === i ? 'panel' : grp.has(i) ? 'ink' : 'muted'),
          });
          // histogram for a large run
          const G = big(), N = 2 ** kS.value, cnt = Array(kS.value + 2).fill(0); for (const x of G.rank) cnt[x]++;
          const ge = cnt.map((_, k) => cnt.slice(k).reduce((a, b) => a + b, 0)), R = Math.max(...G.rank);
          B.setView([-0.6, kS.value + 0.6], [0.5, N * 1.6]);
          for (let k = 0; k <= kS.value; k++) if (cnt[k]) B.rect(k - 0.32, 0.5, k + 0.32, cnt[k], { fill: 'accent', fillAlpha: 0.5, stroke: false });
          B.path(Array.from({ length: kS.value + 1 }, (_, k) => [k, N / 2 ** k]), { color: 'red', dash: [6, 4], width: 1.8 });
          B.dots(Array.from({ length: kS.value + 1 }, (_, k) => [k, N / 2 ** k]), { r: 2.6, color: 'red' });
          const geP = []; for (let k = 0; k <= R; k++) geP.push([k, ge[k]]);
          B.path(geP, { color: 'purple', width: 2 }); geP.forEach(([x, y]) => B.dot(x, y, { r: 3.4, color: 'purple' }));
          B.vline(r, { color: 'gold', width: 1.2, dash: [3, 3] });
          let worst = 0, worstR = 0; ge.forEach((g, k) => { if (k <= R && g / (N / 2 ** k) > worst) { worst = g / (N / 2 ** k); worstR = k; } });
          info = { r, owners, sizes, overlap, N, R, worst, worstR, cntR: ge[r] ?? 0 };
        });
        v.legend([['accent', 'nodes of rank exactly r', { area: true }], ['purple', 'nodes of rank ≥ r', { dot: true }], ['red', 'bound n / 2ʳ', { dash: true }]]);
        v.readout(() => {
          const { r, owners, sizes, overlap, N, R, worst, worstR } = info, okS = sizes.every((z) => z >= 2 ** r);
          return `$n = 32$, $r = ${r}$: ${plural(owners.length, 'node')} of rank ≥ ${r} ${owners.length <= 32 / 2 ** r ? '≤' : '>'} $32/2^{${r}} = ${r2(32 / 2 ** r)}$ ${owners.length <= 32 / 2 ** r ? '✓' : '✗'}; their trees had ${sizes.join(', ') || '—'} elements when they reached rank ${r} (each ≥ $2^{${r}}$ ${okS ? '✓' : '✗'}) and ${overlap ? 'overlap ✗' : 'are disjoint ✓'} · histogram, $n = ${N}$: largest rank ${R} ≤ $\\log_2 n = ${kS.value}$ ✓, and #(rank ≥ r) ≤ $n/2^r$ for every r ✓ (tightest at r = ${worstR}: ${r2(worst * 100)}% of the bound)`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.13
    {
      num: '6.13',
      kind: 'Definition',
      name: 'Ackermann’s function and its inverse α(n)',
      statement: String.raw`For integers $k\ge 0$ and $j\ge 1$ define
$$A_k(j)=\begin{cases} j+1 & k=0,\\ A_{k-1}^{(j+1)}(j) & k\ge 1,\end{cases}$$
where $A_{k-1}^{(j+1)}$ is the $(j+1)$-fold iterate of $A_{k-1}$. Then $A_1(j)=2j+1$, $A_2(j)=2^{j+1}(j+1)-1$, $A_3(1)=2047$, and $A_4(1)=A_3(2047)$ is a tower of about 2050 twos, far more than $10^{80}$, the number of atoms in the observable universe. Its inverse is
$$\alpha(n)=\min\{k : A_k(1)\ge n\},$$
so $\alpha(n)=0,1,2,3$ for $n\le 2$, $n=3$, $4\le n\le 7$, $8\le n\le 2047$, and $\alpha(n)\le 4$ for every $n\le A_4(1)$: in practice a constant, though $\alpha(n)\to\infty$.`,
      idea: String.raw`Each level iterates the previous one: $A_0$ adds one, $A_1$ roughly doubles, $A_2$ exponentiates, $A_3$ builds towers of exponentials, and $A_4$ builds towers whose *height* is itself a tower. That is why the inverse grows more slowly than $\log^* n$ (the number of times $\log_2$ must be applied to get down to 1), which in turn grows more slowly than any iterated logarithm. This version of Ackermann's function is the one used by the union–find analysis (6.14).`,
      caption: String.raw`The table gives $A_k(j)$ (green cells are below $10^{80}$, red ones beyond); click a cell to see it unfolded into iterates of the row above. Type any $n$ — expressions such as 10^80, 2^65536 or the tower 2^^6 $= 2^{2^{2^{2^{2^2}}}}$ are allowed — and compare $\alpha(n)$ with $\log^* n$ and $\log_2\log_2 n$ on an axis that is itself doubly logarithmic. To push $\alpha$ to 5 you need a tower of about 2052 twos.`,
      deps: [],
      see: ['algo-6.14'],
      refs: ['CLRS 4e §19.4'],
      credit: 'Ackermann, 1928; inverse in the union–find bound: Tarjan, 1975',
      tags: ['union-find', 'growth'],
      viz(v) {
        const inp = v.input('$n$ =', '10^80', { width: 170, placeholder: 'e.g. 2^65536 or 2^^5' });
        for (const t of ['10^80', '2^65536', '2^^6', '2^^2052']) v.button(t.replace('^^', '↑↑'), () => inp.set(t));
        const TS = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, weight: 1, minWidth: 300, title: '$A_k(j)$' });
        const C = v.stage({ x: [0, 18], y: [0, 7], axes: 'box', height: 250, weight: 1.15, minWidth: 300, title: '$\\alpha(n)$, $\\log^* n$ and $\\log_2\\log_2 n$', xlabel: 'n',
          xticks: [[0, '2'], [1, '4'], [2, '16'], [3, '256'], [4, '2¹⁶'], [8.05, '10⁸⁰'], [12, '2⁴⁰⁹⁶'], [16, '2⁶⁵⁵³⁶']] });
        const K = 5, J = 5, ATOMS = T(1e80);
        const val = (k, j) => (k === 0 ? T(j + 1) : k === 1 ? T(2 * j + 1) : k === 2 ? A2t(T(j)) : k === 3 ? A3t(j) : j === 0 ? T(1) : j === 1 ? A41 : null);
        const vals = Array.from({ length: K }, (_, k) => Array.from({ length: J }, (_, j) => val(k, j)));
        const tab = v.table(TS, { rows: K, cols: J, square: false, cellAspect: 2.1, maxCell: 46, size: 12.5, rowLabels: (k) => `$k=${k}$`, colLabels: (j) => `$j=${j}$`, cornerLabel: '' });
        let cell = [3, 1];
        TS.onClick((x, y) => { const c = tab.hit(x, y); if (c && c.i >= 0 && c.j >= 0) cell = [c.i, c.j]; });
        const fmtCell = (N) => (N == null ? '$\\gg A_4(1)$' : `$${tTeX(N)}$`);
        let parsed = { N: T(1e80) }, lastSrc = null;
        v.render(() => {
          if (inp.value !== lastSrc) { lastSrc = inp.value; try { parsed = { N: parseBig(inp.value) }; } catch (e) { parsed = { err: e.message }; } }
          tab.draw({
            value: (i, j) => fmtCell(vals[i][j]),
            fill: (i, j) => (vals[i][j] == null || tcmp(vals[i][j], ATOMS) > 0 ? ['red', 0.16] : ['green', 0.13]),
            highlight: [[cell[0], cell[1], 'gold']],
          });
          // α, log* and log log on an axis spaced by log₂ log₂ n
          pv(C, [0, 18], [0, 7], { l: 22 });
          C.vline(8.05, { color: 'faint', dash: [4, 4] }); C.text('atoms in the universe', 8.05, 6.8, { dx: 4, baseline: 'top', size: 10.5, color: 'muted', weight: 600 });
          const alphaX = (x) => (x <= 0 ? 0 : x <= LG(LG(3)) ? 1 : x <= LG(LG(7)) ? 2 : x <= LG(LG(2047)) ? 3 : 4);
          const lstarX = (x) => { if (x <= 0) return 1; let c = 2, y = x; while (y > 1) { y = LG(y); c++; } return c; };
          C.fn((x) => 2 ** x, { color: 'red', width: 1.8, domain: [0, 3] });
          C.fn((x) => x, { color: 'orange', width: 1.8, domain: [0, 7] });
          C.fn(lstarX, { color: 'purple', width: 2.2, domain: [0, 18], n: 2000 });
          C.fn(alphaX, { color: 'green', width: 3, domain: [0, 18], n: 2000 });
          C.text('log₂ n', 2.7, 6.5, { align: 'left', size: 11, weight: 700, color: 'red', dx: 4 });
          C.text('log₂ log₂ n', 6.5, 6.5, { align: 'right', size: 11, weight: 700, color: 'orange', dx: -6 });
          C.text('log* n', 17.8, 5, { align: 'right', baseline: 'bottom', dy: -3, size: 11, weight: 700, color: 'purple' });
          C.text('α(n)', 17.8, 4, { align: 'right', baseline: 'bottom', dy: -3, size: 11, weight: 700, color: 'green' });
          if (parsed.N) {
            const N = parsed.N, a = alphaOf(N), ll = tlog(tlog(N)), X = tcmp(N, T(2)) <= 0 ? 0 : ll.h === 0 ? ll.x : Infinity;
            if (X <= 18) C.dot(Math.max(0, X), a, { r: 5.5, color: 'gold', label: 'your n', labelPos: 'n', labelColor: 'ink' });
            else { C.arrow(16.6, a + 0.75, 17.9, a + 0.75, { color: 'gold', width: 2.2 }); C.text(`your n: far off to the right, α = ${a}`, 16.5, a + 0.75, { align: 'right', size: 11, weight: 700, color: 'ink', dx: -4 }); }
          }
        });
        v.legend([['green', 'α(n)'], ['purple', 'log* n'], ['orange', 'log₂ log₂ n'], ['red', 'log₂ n'], ['gold', 'your n', { dot: true }]]);
        v.readout(() => {
          const [k, j] = cell, Vc = vals[k][j];
          let unfold;
          if (k === 0) unfold = `$A_0(${j}) = ${j} + 1 = ${j + 1}$`;
          else {
            const seq = [String(j)]; let a = T(j);
            for (let i = 0; i <= j; i++) { a = a && Af(k - 1, a); seq.push(a ? tTeX(a) : '\\cdots'); }
            unfold = `$A_${k}(${j}) = A_${k - 1}^{(${j + 1})}(${j})$: apply $A_${k - 1}$ ${j + 1} times, $${seq.join(' \\mapsto ')}$${Vc ? '' : ' — a tower of twos whose height is itself astronomically large'}`;
          }
          let head;
          if (parsed.err) head = `could not read $n$: ${parsed.err}`;
          else {
            const N = parsed.N, a = alphaOf(N), ls = logStar(N), lg = tlog(N);
            head = `$n ${tTeX(N).startsWith('\\approx') ? '' : '='} ${tTeX(N)}$: **α(n) = ${a}**, $\\log^* n = ${ls}$, $\\log_2 n ${lg.h === 0 && lg.x < 1e15 ? '\\approx ' + r2(lg.x) : tTeX(lg)}$ · ${a <= 4 ? `α(n) ≤ 4 holds for every n up to $A_4(1) ${tTeX(A41)}$` : 'beyond A₄(1): α(n) = 5 — but no physical quantity is anywhere near this'}`;
          }
          return `${head} · selected cell: ${unfold}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.14
    {
      num: '6.14',
      kind: 'Theorem',
      name: 'Union–find costs O(m α(n)) in total',
      statement: String.raw`A disjoint-set forest with union by rank and path compression performs any sequence of $m$ MAKE-SET, UNION and FIND operations, $n$ of which are MAKE-SET, in $O(m\,\alpha(n))$ time, where $\alpha$ is the inverse Ackermann function (6.13). In particular each operation costs $O(\alpha(n))$ amortized, and $\alpha(n)\le 4$ for all practical $n$. With only one of the two heuristics the amortized cost per operation can grow like $\log n$, and with neither like $n$. (Tarjan also showed that $\Theta(m\,\alpha(n))$ is optimal for pointer-based structures of this kind.)`,
      idea: String.raw`The proof is a potential argument (6.4). A non-root node $x$ of rank $r\ge1$ gets the potential $(\alpha(n)-\mathrm{level}(x))\,r-\mathrm{iter}(x)$, where $\mathrm{level}(x)$ is the largest $k$ with $\mathrm{rank}(x.p)\ge A_k(r)$ and $\mathrm{iter}(x)$ counts how often $A_{\mathrm{level}(x)}$ can be applied to $r$ without passing $\mathrm{rank}(x.p)$; roots get $\alpha(n)\cdot r$. Ranks increase along paths, and by the rank lemma (6.12) no rank exceeds $\log_2 n$, so $\mathrm{level}<\alpha(n)$. On a FIND path of $s$ nodes, all but at most $\alpha(n)+2$ have a later node of the same level, and compression lowers each of their potentials by at least 1: the FIND costs at most $\alpha(n)+2$ amortized. A LINK raises the potential by at most $\alpha(n)$.`,
      caption: String.raw`Left: total pointer steps per operation, measured on workloads of sizes $2^4$ to $2^{16}$ for the four combinations of heuristics, against $\log_2 n$, $\log^* n$ and $\alpha(n)$. Each single heuristic has a workload that defeats it; both together stay flat on all three. Right: one run with both heuristics, showing for every FIND its path length (orange) and its amortized cost with the potential above (green), which never exceeds $\alpha(n)+2$.`,
      deps: ['algo-6.12', 'algo-6.13', 'algo-6.4', 'algo-6.11'],
      refs: ['CLRS 4e §19.4'],
      credit: 'Tarjan, 1975',
      tags: ['union-find', 'amortized'],
      viz(v) {
        const wl = v.select('workload', [{ value: 'random', label: 'random' }, { value: 'doubling', label: 'equal sizes, then deep finds' }, { value: 'chain', label: 'big ∪ singleton, then finds' }], 'doubling');
        const kS = v.slider('$n$ (right panel)', 6, 12, 10, { int: true, fmt: (k) => String(2 ** k) });
        const A = v.stage({ x: [16, 65536], y: [0, 18], axes: 'box', xlog: true, height: 300, weight: 1.15, minWidth: 300, title: 'pointer steps per operation (m ≈ 4n)',
          xticks: [[16, '2⁴'], [64, '2⁶'], [256, '2⁸'], [1024, '2¹⁰'], [4096, '2¹²'], [16384, '2¹⁴'], [65536, '2¹⁶']] });
        const B = v.stage({ x: [0, 1], y: [0, 10], axes: 'box', height: 300, weight: 1, minWidth: 280, title: 'union by rank + compression: each FIND' });
        const HEUR = [{ key: 'both', label: 'rank + compression', color: 'green' }, { key: 'rank', label: 'rank only', color: 'blue' }, { key: 'comp', label: 'compression only', color: 'purple' }, { key: 'none', label: 'neither', color: 'red' }];
        const NS = Array.from({ length: 13 }, (_, i) => 2 ** (i + 4));
        const curves = new Map(), pots = new Map();
        const curve = (w) => { if (!curves.has(w)) curves.set(w, HEUR.map((h) => NS.map((n) => ufCost(n, h.key, w, 3e7)))); return curves.get(w); };
        const pot = (w, k) => { const key = w + k; if (!pots.has(key)) pots.set(key, ufPotential(2 ** k, w)); return pots.get(key); };
        const lstar = (n) => { let c = 0; while (n > 1) { n = LG(n); c++; } return c; };
        v.render(() => {
          const Cv = curve(wl.value), TOP = 18;
          pv(A, [16, 65536], [0, TOP], { l: 26, r: 10 });
          A.fn((n) => LG(n), { color: 'ink', dash: [6, 4], width: 1.2, alpha: 0.55 });
          A.fn(lstar, { color: 'ink', dash: [2, 3], width: 1.3, alpha: 0.6, n: 600 });
          A.fn(alphaSmall, { color: 'ink', width: 1, alpha: 0.4, n: 600 });
          A.text('log₂ n', 65536, 16, { align: 'right', baseline: 'bottom', dx: -4, dy: -2, size: 11, color: 'muted', weight: 700 });
          A.text('log* n', 65536, 4, { align: 'right', baseline: 'bottom', dx: -4, dy: -2, size: 11, color: 'muted', weight: 700 });
          A.text('α(n)', 300, 3, { align: 'right', baseline: 'top', dy: 3, size: 11, color: 'muted', weight: 700 });
          HEUR.forEach((h, k) => {
            const pts = NS.map((n, i) => (Cv[k][i] == null ? null : [n, Cv[k][i]]));
            A.clip(() => { A.path(pts, { color: h.color, width: k === 0 ? 3 : 2 }); pts.forEach((q) => { if (q && q[1] <= TOP) A.dot(q[0], q[1], { r: 3, color: h.color }); }); });
            const lastI = pts.reduce((b, q, i) => (q ? i : b), -1);
            if (lastI >= 0 && pts[lastI][1] > TOP) { const i0 = pts.findIndex((q) => q && q[1] > TOP); A.text(`${h.label} ↑`, NS[Math.max(0, i0 - 1)], TOP, { baseline: 'top', dy: 4, size: 11, weight: 700, color: h.color }); }
            else if (lastI >= 0 && lastI < NS.length - 1) A.text(`${h.label}: stopped (too slow)`, pts[lastI][0], pts[lastI][1], { dx: 6, size: 11, weight: 700, color: h.color });
          });
          // the potential check
          const P = pot(wl.value, kS.value), F = P.ev.filter((e) => e.k === 'f'), bound = P.alpha + 2, Lk = P.ev.filter((e) => e.k === 'l');
          const maxC = Math.max(...F.map((e) => e.c)), lo = -bound;
          pv(B, [0, F.length], [lo, Math.max(maxC, bound) + 1.2], { l: 26, r: 10 });
          B.hline(0, { color: 'muted', width: 1 });
          B.dots(F.map((e, i) => [i, e.c]), { r: 1.6, color: 'orange' });
          B.dots(F.map((e, i) => [i, Math.max(e.am, lo)]), { r: 1.6, color: 'green' });
          B.hline(bound, { color: 'green', dash: [7, 5], width: 1.8 });
          B.text(`α(n) + 2 = ${bound}`, F.length, bound, { align: 'right', baseline: 'bottom', dy: -3, dx: -4, size: 11.5, weight: 700, color: 'green' });
          B.corner(`n = ${2 ** kS.value}, ${F.length} finds, ${Lk.length} links`, 'tl', { size: 11.5 });
        });
        v.legend([...HEUR.map((h) => [h.color, h.label]), ['ink', 'log₂ n, log* n, α(n)', { dash: true }], ['orange', 'FIND path length', { dot: true }], ['green', 'amortized FIND cost', { dot: true }]]);
        v.readout(() => {
          const Cv = curve(wl.value), P = pot(wl.value, kS.value), F = P.ev.filter((e) => e.k === 'f'), Lk = P.ev.filter((e) => e.k === 'l');
          const maxAF = Math.max(...F.map((e) => e.am)), maxAL = Lk.length ? Math.max(...Lk.map((e) => e.am)) : 0, maxC = Math.max(...F.map((e) => e.c));
          const span = (k) => { const c = Cv[k], a = c[0], last = c.reduce((b, x, i) => (x != null ? i : b), 0); return `${r2(a)} → ${r2(c[last])}${last < NS.length - 1 ? ` (at $2^{${last + 4}}$)` : ''}`; };
          return `per operation from $n = 2^4$ to $2^{16}$ — rank + compression **${span(0)}**, rank only ${span(1)}, compression only ${span(2)}, neither ${span(3)} · right panel: FIND paths up to ${maxC} nodes, but every amortized FIND cost ≤ ${r2(maxAF)} ≤ α(n) + 2 = ${P.alpha + 2} ${maxAF <= P.alpha + 2 + 1e-9 ? '✓' : '✗'} and every LINK ≤ ${r2(maxAL)} ≤ α(n) + 1 ${maxAL <= P.alpha + 1 + 1e-9 ? '✓' : '✗'}`;
        });
      },
    },
  ],
};
