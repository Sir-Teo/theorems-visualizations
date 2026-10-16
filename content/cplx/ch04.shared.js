// Computational Complexity — Chapter 4 (Boolean circuits): helpers shared by ch04.js and ch04-b.js.
// Re-exports the chapter-3 helpers (which re-export chapters 2 and, through ch03, the CNF/DPLL tools). New here: a small
// Boolean-circuit toolkit (builder, evaluator, size/depth, layered layout and a canvas drawing routine), exact gate counts
// for Lupanov-style block sharing, parallel-prefix networks, Turing-machine and cellular-automaton tableaux, and CNF
// restriction for self-reduction. Everything the pictures print is computed by these functions.
export * from './ch03.shared.js';
import { runTM, MACHINES } from './ch01.shared.js';
export { runTM, MACHINES };

// ---------------------------------------------------------------------------------------------------------------
// Circuits. A circuit is {g: [{t, ins, name?}], inputs: [ids], outs: [ids]}; gates are in topological order.
// Types: in, c0, c1, not, and, or, xor, nand, nor (and/or/xor accept any fan-in >= 1).
export const newC = () => ({ g: [], inputs: [], outs: [] });
export function addIn(C, name) { C.g.push({ t: 'in', ins: [], name }); C.inputs.push(C.g.length - 1); return C.g.length - 1; }
export function addG(C, t, ins, name) { C.g.push({ t, ins: ins.slice(), name }); return C.g.length - 1; }
export const GLYPH = { in: '', c0: '0', c1: '1', not: '¬', and: '∧', or: '∨', xor: '⊕', nand: '⊼', nor: '⊽' };
export const GATE_NAME = { not: 'NOT', and: 'AND', or: 'OR', xor: 'XOR', nand: 'NAND', nor: 'NOR' };
export function applyG(t, a) {
  switch (t) {
    case 'c0': return 0; case 'c1': return 1;
    case 'not': return 1 - a[0];
    case 'and': return a.every((x) => x) ? 1 : 0;
    case 'or': return a.some((x) => x) ? 1 : 0;
    case 'xor': return a.reduce((s, x) => s ^ x, 0);
    case 'nand': return a.every((x) => x) ? 0 : 1;
    case 'nor': return a.some((x) => x) ? 0 : 1;
    default: return 0;
  }
}
/** Values of every gate on the input vector x (aligned with C.inputs). */
export function evalC(C, x) {
  const val = new Array(C.g.length);
  let k = 0;
  for (let i = 0; i < C.g.length; i++) {
    const G = C.g[i];
    val[i] = G.t === 'in' ? (x[k++] ? 1 : 0) : applyG(G.t, G.ins.map((j) => val[j]));
  }
  return val;
}
/** Depth (longest path from an input, counting every gate) of each gate; fan-in-k gates count 1. */
export function levelsC(C) {
  const L = new Array(C.g.length).fill(0);
  C.g.forEach((G, i) => { if (G.t !== 'in' && G.t !== 'c0' && G.t !== 'c1') L[i] = 1 + Math.max(0, ...G.ins.map((j) => L[j])); });
  return L;
}
/** Gates that the outputs depend on (reachable backwards). */
export function liveC(C) {
  const live = new Array(C.g.length).fill(false);
  const st = C.outs.slice();
  while (st.length) { const i = st.pop(); if (live[i]) continue; live[i] = true; C.g[i].ins.forEach((j) => st.push(j)); }
  return live;
}
/** Size = number of non-input gates (constants excluded); fan-in-2 size counts a k-input gate as k-1. */
export function sizeC(C, binary = false) {
  const live = liveC(C);
  let s = 0;
  C.g.forEach((G, i) => {
    if (!live[i] || G.t === 'in' || G.t === 'c0' || G.t === 'c1') return;
    s += binary && G.ins.length > 2 ? G.ins.length - 1 : 1;
  });
  return s;
}
export function depthC(C, binary = false) {
  let L;
  if (!binary) L = levelsC(C);
  else {
    L = new Array(C.g.length).fill(0);
    C.g.forEach((G, i) => { if (G.t !== 'in' && G.t !== 'c0' && G.t !== 'c1') L[i] = Math.ceil(Math.log2(Math.max(1, G.ins.length))) + Math.max(0, ...G.ins.map((j) => L[j])) + (G.ins.length <= 1 ? 1 : 0); });
  }
  return Math.max(0, ...C.outs.map((i) => L[i]));
}
export function truthTableC(C) {
  const n = C.inputs.length, rows = [];
  for (let m = 0; m < (1 << n); m++) {
    const x = []; for (let i = 0; i < n; i++) x.push((m >> (n - 1 - i)) & 1);
    const v = evalC(C, x); rows.push({ x, y: C.outs.map((o) => v[o]) });
  }
  return rows;
}
/** Combine ids with an associative gate type as a chain, a balanced tree, or one unbounded-fan-in gate. */
export function foldC(C, t, ids, mode) {
  if (ids.length === 1) return ids[0];
  if (mode === 'flat') return addG(C, t, ids);
  if (mode === 'chain') { let a = ids[0]; for (let i = 1; i < ids.length; i++) a = addG(C, t, [a, ids[i]]); return a; }
  let lv = ids;
  while (lv.length > 1) { const nx = []; for (let i = 0; i + 1 < lv.length; i += 2) nx.push(addG(C, t, [lv[i], lv[i + 1]])); if (lv.length % 2) nx.push(lv[lv.length - 1]); lv = nx; }
  return lv[0];
}
/** Full adder / half adder / pass-through on ids, null = constant 0. Returns [sum, carry]. */
export function addBit(C, terms) {
  const t = terms.filter((x) => x != null);
  if (t.length === 0) return [null, null];
  if (t.length === 1) return [t[0], null];
  if (t.length === 2) return [addG(C, 'xor', t), addG(C, 'and', t)];
  const x = addG(C, 'xor', [t[0], t[1]]), s = addG(C, 'xor', [x, t[2]]);
  const c = addG(C, 'or', [addG(C, 'and', [t[0], t[1]]), addG(C, 'and', [x, t[2]])]);
  return [s, c];
}
/** Ripple-carry sum of two little-endian id arrays (null = 0). Returns width max+1 array. */
export function addVec(C, X, Y) {
  const w = Math.max(X.length, Y.length), out = []; let carry = null;
  for (let i = 0; i < w; i++) { const [s, c] = addBit(C, [X[i], Y[i], carry]); out.push(s); carry = c; }
  out.push(carry); return out;
}
export function adderC(n) {
  const C = newC(), a = [], b = [];
  for (let i = 0; i < n; i++) a.push(addIn(C, `a${i}`));
  for (let i = 0; i < n; i++) b.push(addIn(C, `b${i}`));
  C.outs = addVec(C, a, b).filter((x) => x != null);
  return C;
}
export function majC() {
  const C = newC(), x = addIn(C, 'x'), y = addIn(C, 'y'), z = addIn(C, 'z');
  C.outs = [foldC(C, 'or', [addG(C, 'and', [x, y]), addG(C, 'and', [y, z]), addG(C, 'and', [x, z])], 'chain')];
  return C;
}
export function xorC() {
  const C = newC(), x = addIn(C, 'x'), y = addIn(C, 'y');
  const nx = addG(C, 'not', [x]), ny = addG(C, 'not', [y]);
  C.outs = [addG(C, 'or', [addG(C, 'and', [x, ny]), addG(C, 'and', [nx, y])])];
  return C;
}
/** Multiplier verifier: inputs a, b (nb bits); output 1 iff a*b = N, a >= 2 and b >= 2. */
export function factorC(nb, N) {
  const C = newC(), a = [], b = [];
  for (let i = 0; i < nb; i++) a.push(addIn(C, `a${i}`));
  for (let i = 0; i < nb; i++) b.push(addIn(C, `b${i}`));
  let acc = [];
  for (let i = 0; i < nb; i++) {
    const row = new Array(i).fill(null).concat(a.map((aj) => addG(C, 'and', [aj, b[i]])));
    acc = i === 0 ? row : addVec(C, acc, row);
  }
  const checks = [];
  for (let i = 0; i < 2 * nb; i++) {
    const want = (N >> i) & 1, p = acc[i] ?? null;
    if (p == null) { if (want) checks.push(addG(C, 'c0', [])); }
    else checks.push(want ? p : addG(C, 'not', [p]));
  }
  if (N >= 1 << (2 * nb)) checks.push(addG(C, 'c0', []));
  checks.push(foldC(C, 'or', a.slice(1), 'chain'), foldC(C, 'or', b.slice(1), 'chain'));
  C.outs = [foldC(C, 'and', checks, 'chain')];
  C.prodBits = acc;
  return C;
}
/** Layered layout in the unit square: x by depth, y by barycentre ordering. Returns [[x, y], ...]. */
export function layoutC(C, o = {}) {
  const L = levelsC(C), live = liveC(C), maxL = Math.max(1, ...L.filter((_, i) => live[i]));
  const lv = Array.from({ length: maxL + 1 }, () => []);
  C.g.forEach((G, i) => { if (live[i] || G.t === 'in') lv[o.flatInputs ? L[i] : (G.t === 'in' ? 0 : L[i])].push(i); });
  const pos = new Array(C.g.length).fill(null);
  lv[0].forEach((i, k) => { pos[i] = [0, k]; });
  const yOf = new Array(C.g.length).fill(0);
  lv[0].forEach((i, k) => { yOf[i] = k; });
  for (let l = 1; l <= maxL; l++) {
    const arr = lv[l];
    arr.forEach((i) => { const ps = C.g[i].ins.map((j) => yOf[j]); yOf[i] = ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 0; });
    arr.sort((i, j) => yOf[i] - yOf[j]);
    arr.forEach((i, k) => { yOf[i] = k; });
  }
  const H = Math.max(1, ...lv.map((a) => a.length));
  lv.forEach((arr, l) => {
    arr.forEach((i, k) => {
      const m = arr.length;
      pos[i] = [maxL === 0 ? 0.5 : 0.04 + 0.92 * l / maxL, 0.5 + (k - (m - 1) / 2) / Math.max(H, 2) * (o.spread ?? 0.92)];
    });
  });
  return { pos, levels: L, live, maxL, H };
}
/** Draw a circuit given its layout. o: {vals, r, hoverGate, sel, color, names}. Returns hit regions [{id, x, y}] (data coords). */
export function drawC(s, C, lay, o = {}) {
  const { pos, live } = lay, vals = o.vals, r = o.r ?? 11, hits = [];
  C.g.forEach((G, i) => {
    if (!pos[i] || !(live[i] || G.t === 'in')) return;
    G.ins.forEach((j) => {
      const on = vals ? vals[j] : 0;
      s.line(pos[j][0], pos[j][1], pos[i][0], pos[i][1], { color: vals ? (on ? 'green' : 'muted') : 'muted', width: vals && on ? 2.2 : 1.2, alpha: vals && !on ? 0.55 : 0.95 });
    });
  });
  C.g.forEach((G, i) => {
    if (!pos[i] || !(live[i] || G.t === 'in')) return;
    const [x, y] = pos[i], v = vals ? vals[i] : null;
    const col = o.nodeColor ? o.nodeColor(i, G, v) : (v == null ? (G.t === 'in' ? 'accent' : 'muted') : v ? 'green' : (G.t === 'in' ? 'accent' : 'muted'));
    if (G.t === 'in') {
      s.dot(x, y, { r: r - 1, color: v ? 'green' : 'accent', hollow: !v, width: 2.2 });
      s.text(G.name ?? '', x, y, { align: 'center', baseline: 'middle', size: 10, color: v ? 'panel' : 'ink' });
    } else {
      s.dot(x, y, { r, color: col, hollow: true, width: o.sel === i ? 3.4 : 2.2 });
      s.text(GLYPH[G.t] + (G.ins.length > 2 && G.t !== 'not' ? '' : ''), x, y, { align: 'center', baseline: 'middle', size: 13, color: 'ink' });
      if (G.ins.length > 2) s.text(String(G.ins.length), x, y, { align: 'center', baseline: 'middle', size: 8, color: 'muted', dy: 11 });
    }
    hits.push({ id: i, x, y });
  });
  return hits;
}

// ---------------------------------------------------------------------------------------------------------------
// Counting circuits (4.2). log2 of the number of distinct circuits with s fan-in-2 gates over {AND, OR, NOT}, n inputs,
// is at most s*log2(3*(s+n)^2) (each gate picks a type and two of the s+n earlier wires); this is the standard upper bound.
export const log2Circuits = (s, n) => s * Math.log2(3 * (s + n) ** 2);
/** Least s with log2Circuits(s, n) >= 2^n (the counting threshold). */
export function shannonThreshold(n) {
  const target = 2 ** n; let lo = 1, hi = 2; while (log2Circuits(hi, n) < target) hi *= 2;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (log2Circuits(m, n) >= target) hi = m; else lo = m; }
  return hi;
}

// ---------------------------------------------------------------------------------------------------------------
// Lupanov-style synthesis (4.3). Truth table f (Uint8Array of 2^n, index = x*2^(n-k) + y with x the first k variables).
// Gates live in a hash-consed DAG (an identical gate is built once); functions are bit-packed for verification.
export function gateBuilder(n) {
  const W = Math.max(1, (1 << n) >> 5), key = new Map(), fn = [], list = [];
  const mk = (words) => words;
  const lit = [];
  for (let j = 0; j < n; j++) {
    const a = new Uint32Array(W);
    for (let m = 0; m < (1 << n); m++) if ((m >> (n - 1 - j)) & 1) a[m >> 5] |= 1 << (m & 31);
    lit.push(a);
  }
  const B = { n, W, size: 0, lit, fn, list };
  B.input = (j) => { const k = `x${j}`; if (!key.has(k)) { key.set(k, fn.length); fn.push(lit[j]); list.push(['in', j]); } return key.get(k); };
  B.not = (a) => {
    const k = `n${a}`; if (key.has(k)) return key.get(k);
    const r = new Uint32Array(W); for (let i = 0; i < W; i++) r[i] = ~fn[a][i];
    if ((1 << n) < 32) r[0] &= (1 << (1 << n)) - 1;
    key.set(k, fn.length); fn.push(mk(r)); list.push(['not', a]); B.size++; return fn.length - 1;
  };
  B.bin = (t, a, b) => {
    if (a > b) [a, b] = [b, a];
    const k = `${t}${a},${b}`; if (key.has(k)) return key.get(k);
    const r = new Uint32Array(W); for (let i = 0; i < W; i++) r[i] = t === 'a' ? fn[a][i] & fn[b][i] : fn[a][i] | fn[b][i];
    key.set(k, fn.length); fn.push(r); list.push([t, a, b]); B.size++; return fn.length - 1;
  };
  B.fold = (t, ids) => {
    if (!ids.length) return null;
    let lv = ids;
    while (lv.length > 1) { const nx = []; for (let i = 0; i + 1 < lv.length; i += 2) nx.push(B.bin(t, lv[i], lv[i + 1])); if (lv.length % 2) nx.push(lv[lv.length - 1]); lv = nx; }
    return lv[0];
  };
  const dcache = new Map();
  /** Decoder: the AND of literals of variables lo..hi-1 equal to the bits of v (variable lo is the most significant). */
  B.dec = (lo, hi, v) => {
    const k = `${lo},${hi},${v}`; if (dcache.has(k)) return dcache.get(k);
    let r;
    if (hi - lo === 1) r = v ? B.input(lo) : B.not(B.input(lo));
    else { const mid = (lo + hi) >> 1, lowBits = hi - mid; r = B.bin('a', B.dec(lo, mid, v >> lowBits), B.dec(mid, hi, v & ((1 << lowBits) - 1))); }
    dcache.set(k, r); return r;
  };
  return B;
}
/** Build a circuit for table f by splitting the 2^k rows into blocks of s rows. Returns {size, ok}. */
export function lupanov(f, n, k, s) {
  const B = gateBuilder(n), R = 1 << k, Cn = 1 << (n - k), terms = [];
  for (let r0 = 0; r0 < R; r0 += s) {
    const r1 = Math.min(R, r0 + s), groups = new Map();
    for (let c = 0; c < Cn; c++) {
      let pat = 0; for (let r = r0; r < r1; r++) if (f[r * Cn + c]) pat |= 1 << (r - r0);
      if (!pat) continue;
      if (!groups.has(pat)) groups.set(pat, []);
      groups.get(pat).push(c);
    }
    const g = new Map();
    for (const [pat, cols] of groups) g.set(pat, B.fold('o', cols.map((c) => B.dec(k, n, c))));
    for (let r = r0; r < r1; r++) {
      const parts = []; for (const [pat, id] of g) if ((pat >> (r - r0)) & 1) parts.push(id);
      const fr = B.fold('o', parts);
      if (fr != null) terms.push(B.bin('a', B.dec(0, k, r), fr));
    }
  }
  const out = B.fold('o', terms);
  let ok = true;
  const N = 1 << n;
  for (let m = 0; m < N && ok; m++) { const bit = out == null ? 0 : (B.fn[out][m >> 5] >> (m & 31)) & 1; if (bit !== f[m]) ok = false; }
  return { size: B.size, ok };
}
/** Smallest Lupanov-style size over a grid of (k, s). */
export function lupanovBest(f, n) {
  let best = null;
  for (let k = Math.max(1, Math.floor(Math.log2(n))); k <= n - 1; k++) {
    for (const s of [1, 2, 3, 4, 6, 8, 12]) {
      if (s > (1 << k)) continue;
      const r = lupanov(f, n, k, s);
      if (r.ok && (!best || r.size < best.size)) best = { ...r, k, s };
    }
  }
  return best;
}
/** Subfunction-sharing multiplexer tree: about 3 gates per distinct non-constant subfunction. */
export function muxSharing(f, n) {
  let level = [Array.from(f).join('')], gates = n;
  const all = new Set();
  for (let d = 0; d < n; d++) {
    const next = new Set();
    for (const t of level) { if (/^0+$|^1+$/.test(t)) continue; const h = t.length >> 1; next.add(t.slice(0, h)); next.add(t.slice(h)); }
    for (const t of level) { if (!/^0+$|^1+$/.test(t) && !all.has(t)) { all.add(t); gates += 3; } }
    level = [...next];
  }
  return gates;
}
export function randomTable(seed, n) {
  const r = (function* () { let x = (seed * 2654435761 + 977) >>> 0; while (true) { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; yield (x >>> 16) & 1; } })();
  const f = new Uint8Array(1 << n); for (let i = 0; i < f.length; i++) f[i] = r.next().value; return f;
}

// ---------------------------------------------------------------------------------------------------------------
// Parallel prefix (4.11). Inclusive scan over the carry operator (g, p) o (g', p') = (g | p&g', p&p') where the left pair is
// the more significant one. Network kinds: 'ks' Kogge-Stone, 'sk' Sklansky, 'rc' ripple (a chain).
export function prefixNet(n, kind) {
  const levels = [];
  if (kind === 'ks') for (let d = 1; d < n; d *= 2) levels.push(Array.from({ length: n - d }, (_, k) => [k + d, k]));
  else if (kind === 'sk') for (let d = 1; d < n; d *= 2) { const L = []; for (let i = 0; i < n; i++) if (i & d) L.push([i, ((i >> Math.log2(d)) << Math.log2(d)) - 1]); levels.push(L); }
  else for (let i = 1; i < n; i++) levels.push([[i, i - 1]]);
  return levels.filter((l) => l.length);
}
export function runPrefix(a, b, kind) {
  const n = a.length, g = a.map((x, i) => x & b[i]), p = a.map((x, i) => x ^ b[i]);
  let cur = g.map((x, i) => [x, p[i]]);
  const snaps = [cur.map((q) => q.slice())], net = prefixNet(n, kind);
  for (const lvl of net) {
    const nx = cur.map((q) => q.slice());
    for (const [i, j] of lvl) nx[i] = [cur[i][0] | (cur[i][1] & cur[j][0]), cur[i][1] & cur[j][1]];
    cur = nx; snaps.push(cur.map((q) => q.slice()));
  }
  const carry = [0].concat(cur.map((q) => q[0])), sum = p.map((x, i) => x ^ carry[i]);
  return { g, p, net, snaps, carry, sum, cout: carry[n], nodes: net.reduce((s, l) => s + l.length, 0) };
}

// ---------------------------------------------------------------------------------------------------------------
// Tableaux. Turing machine: rows are configurations (symbol per cell, head marker with state).
export function tableauTM(m, x, T, Wd) {
  const r = runTM(m, x, { maxSteps: T, trace: T, loopCheck: false });
  const rows = []; let last = null;
  for (let t = 0; t <= T; t++) {
    const sn = r.trace[t] ?? last; last = sn;
    const row = Array.from({ length: Wd }, () => ({ sym: '_', head: null }));
    for (let k = 0; k < sn.cells.length; k++) { const pos = sn.lo + k; if (pos >= 0 && pos < Wd) row[pos].sym = sn.cells[k]; }
    if (sn.h >= 0 && sn.h < Wd) row[sn.h].head = sn.q;
    rows.push(row);
  }
  return { rows, status: r.status, steps: r.steps, cellsUsed: r.cells };
}
/** Elementary cellular automaton rule on a ring: next row from a row. */
export function caStep(row, rule) {
  const n = row.length; return row.map((_, j) => (rule >> (4 * row[(j - 1 + n) % n] + 2 * row[j] + row[(j + 1) % n])) & 1);
}
export function caRun(init, rule, T) { const rows = [init.slice()]; for (let t = 0; t < T; t++) rows.push(caStep(rows[t], rule)); return rows; }

// ---------------------------------------------------------------------------------------------------------------
// CNF restriction for self-reduction (4.8). assign: Map var -> 0/1. Returns simplified clause list ([] = true, [[]] = false).
export function restrictCNF(cl, assign) {
  const out = [];
  for (const c of cl) {
    let sat = false; const rest = [];
    for (const l of c) { const v = assign.get(Math.abs(l)); if (v === undefined) rest.push(l); else if ((l > 0) === (v === 1)) { sat = true; break; } }
    if (!sat) out.push(rest);
  }
  return out;
}
export function hash32(str) { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }

// Small Turing machines with 3 states / 2 symbols, enumerated by a scrambled index (4.6).
export function smallTM(index) {
  // six transitions (state A,B,C x symbol 0,1), each of 16 options: write(2) x move(2) x next(4: A,B,C,HALT)
  let x = Math.imul(index + 1, 2654435761) >>> 0; x = (x ^ (x >>> 13)) >>> 0; x = Math.imul(x, 0x5bd1e995) >>> 0; x %= 16 ** 6;
  const tr = [];
  for (let i = 0; i < 6; i++) { const d = x % 16; x = Math.floor(x / 16); tr.push({ w: d & 1, mv: (d >> 1) & 1 ? 1 : -1, nx: d >> 2 }); }
  return tr;
}
export function runSmallTM(tr, maxSteps) {
  const tape = new Map(); let q = 0, h = 0, steps = 0;
  while (steps < maxSteps) {
    const s = tape.get(h) ?? 0, t = tr[q * 2 + s];
    tape.set(h, t.w); h += t.mv; steps++;
    if (t.nx === 3) return { halted: true, steps };
    q = t.nx;
  }
  return { halted: false, steps };
}
