// Circuit kit — schematics on a grid plus a solver: modified nodal analysis for DC (Newton for diodes), AC phasors at a
// frequency (and sweeps), and transients with backward-Euler / trapezoidal companion models. Wires are coloured by node
// voltage and current is shown as moving dots whose speed ∝ current. Reference: docs/kits-science.md.
//
//   const C = v.circuit(stage, [
//     { type: 'V', id: 'V1', a: 'in', b: 'gnd', value: 5, at: [0, 0, 0, 3] },
//     { type: 'R', id: 'R1', a: 'in', b: 'out', value: 1e3, at: [0, 3, 4, 3] },
//     { type: 'C', id: 'C1', a: 'out', b: 'gnd', value: 1e-4, at: [4, 3, 4, 0] },
//     { type: 'W', at: [4, 0, 0, 0] }, { type: 'GND', at: [2, 0] } ]);
//   const tr = C.transient(0.5, 1e-3);           // {t, v: {node: []}, i: {id: []}, at(time)}
//   v.animate((t) => C.draw({ result: tr.at(t / 4 * 0.5), t }), { period: 4 });
//
// Parts: R, C, L, V, I, SW (switch), D (diode: model 'shockley' | 'ideal'), OA (ideal op-amp: plus, minus, out, at: [x, y]),
// GND (at: [x, y]), W (wire polyline at: [x0, y0, x1, y1, …]), label (at: [x, y], text, node). Two-terminal parts take
// a, b (node names) and/or at: [x0, y0, x1, y1] (terminal positions); nets are joined by name and by geometry (wires,
// T-junctions), so wires need no names. Sign conventions: a part's current i flows from a to b through the part, power
// p = (v_a − v_b)·i is absorbed; a source with a = + terminal delivers −p. Current sources push `value` from a to b.
// The solver (Netlist) is DOM-free and exported.

const TAU = 2 * Math.PI;
const GROUND = new Set(['0', 'gnd', 'GND', 'ground']);
const TWO = new Set(['R', 'C', 'L', 'V', 'I', 'SW', 'D']);
const kp = (x, y) => `${Math.round(x * 1e6)},${Math.round(y * 1e6)}`;

// ------------------------------------------------------------------ formatting
const PFX = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
/** SI formatting with prefixes: si(1e-4, 'F') → '100 µF' (3 significant digits, real minus sign). */
export function si(x, unit = '', digits = 3) {
  if (x == null || !isFinite(x)) return '—';
  if (x === 0) return `0 ${unit}`.trim();
  const a = Math.abs(x), [m, p] = PFX.find(([m]) => a >= m * 0.9995) || PFX[PFX.length - 1];
  return `${(+(x / m).toPrecision(digits)).toString().replace('-', '−')} ${p}${unit}`.trim();
}
const UNIT = { R: 'Ω', C: 'F', L: 'H', V: 'V', I: 'A' };

// ------------------------------------------------------------------ dense LU (real and complex)
function luReal(A, n) {
  const piv = new Int32Array(n);
  for (let k = 0; k < n; k++) {
    let p = k, mx = Math.abs(A[k * n + k]); for (let i = k + 1; i < n; i++) { const v = Math.abs(A[i * n + k]); if (v > mx) { mx = v; p = i; } }
    if (mx < 1e-300) return null; piv[k] = p;
    if (p !== k) for (let j = 0; j < n; j++) { const t = A[k * n + j]; A[k * n + j] = A[p * n + j]; A[p * n + j] = t; }
    const d = A[k * n + k];
    for (let i = k + 1; i < n; i++) { const f = (A[i * n + k] /= d); if (f) for (let j = k + 1; j < n; j++) A[i * n + j] -= f * A[k * n + j]; }
  }
  return { A, piv, n };
}
function luSolveReal(F, b) {
  const { A, piv, n } = F, x = Float64Array.from(b);
  for (let k = 0; k < n; k++) { const p = piv[k]; if (p !== k) { const t = x[k]; x[k] = x[p]; x[p] = t; } } // rows were swapped whole, so permute first
  for (let k = 0; k < n; k++) for (let i = k + 1; i < n; i++) x[i] -= A[i * n + k] * x[k];
  for (let i = n - 1; i >= 0; i--) { let s = x[i]; for (let j = i + 1; j < n; j++) s -= A[i * n + j] * x[j]; x[i] = s / A[i * n + i]; }
  return x;
}
function solveComplex(Ar, Ai, br, bi, n) {
  for (let k = 0; k < n; k++) {
    let p = k, mx = Math.hypot(Ar[k * n + k], Ai[k * n + k]); for (let i = k + 1; i < n; i++) { const v = Math.hypot(Ar[i * n + k], Ai[i * n + k]); if (v > mx) { mx = v; p = i; } }
    if (mx < 1e-300) return null;
    if (p !== k) { for (let j = 0; j < n; j++) { let t = Ar[k * n + j]; Ar[k * n + j] = Ar[p * n + j]; Ar[p * n + j] = t; t = Ai[k * n + j]; Ai[k * n + j] = Ai[p * n + j]; Ai[p * n + j] = t; } let t = br[k]; br[k] = br[p]; br[p] = t; t = bi[k]; bi[k] = bi[p]; bi[p] = t; }
    const dr = Ar[k * n + k], di = Ai[k * n + k], dd = dr * dr + di * di;
    for (let i = k + 1; i < n; i++) {
      const ar = Ar[i * n + k], ai = Ai[i * n + k]; if (!ar && !ai) continue; const fr = (ar * dr + ai * di) / dd, fi = (ai * dr - ar * di) / dd;
      for (let j = k + 1; j < n; j++) { const xr = Ar[k * n + j], xi = Ai[k * n + j]; Ar[i * n + j] -= fr * xr - fi * xi; Ai[i * n + j] -= fr * xi + fi * xr; }
      br[i] -= fr * br[k] - fi * bi[k]; bi[i] -= fr * bi[k] + fi * br[k];
    }
  }
  const xr = new Float64Array(n), xi = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let sr = br[i], s_i = bi[i]; for (let j = i + 1; j < n; j++) { const ar = Ar[i * n + j], ai = Ai[i * n + j]; sr -= ar * xr[j] - ai * xi[j]; s_i -= ar * xi[j] + ai * xr[j]; }
    const dr = Ar[i * n + i], di = Ai[i * n + i], dd = dr * dr + di * di; xr[i] = (sr * dr + s_i * di) / dd; xi[i] = (s_i * dr - sr * di) / dd;
  }
  return [xr, xi];
}

// ------------------------------------------------------------------ waveforms
/** Value of a source at time t: number, function t → v, or {type: 'step'|'sine'|'pulse'|'square', …}. */
export function waveAt(w, t, dflt = 0) {
  if (w == null) return dflt; if (typeof w === 'number') return w; if (typeof w === 'function') return w(t);
  const { type } = w;
  if (type === 'step') return t < (w.t0 ?? 0) ? w.v0 ?? 0 : w.v1 ?? 1;
  if (type === 'sine') return (w.offset ?? 0) + (w.amp ?? 1) * Math.sin(TAU * (w.f ?? 1) * t + (w.phase ?? 0));
  if (type === 'pulse' || type === 'square') { const T = w.period ?? 1, d = w.duty ?? 0.5, u = (((t - (w.t0 ?? 0)) % T) + T) % T; return u < d * T ? w.v1 ?? 1 : w.v0 ?? 0; }
  return dflt;
}

// ================================================================== netlist
let AUTO = 0;
export class Netlist {
  /** parts: array of part specs (see header). opts {gmin}. */
  constructor(parts, opts = {}) {
    this.o = { gmin: 1e-12, Is: 1e-14, nd: 1, Vt: 0.025852, ...opts };
    const cnt = {};
    this.parts = parts.map((p) => { const q = { ...p, type: p.type === 'G' ? 'GND' : p.type }; if (!q.id) { cnt[q.type] = (cnt[q.type] || 0) + 1; q.id = q.type === 'W' ? `W${cnt.W}` : `${q.type}${cnt[q.type]}`; } return q; });
    this.byId = new Map(this.parts.map((p) => [p.id, p]));
    this._nets(); this._index();
  }
  // ---------------------------------------------------------------- topology
  /** Terminal list of a part: [{name, x, y, pin}]. */
  terminals(p) {
    const at = p.at || [];
    if (TWO.has(p.type)) return [{ pin: 'a', name: p.a, x: at[0], y: at[1] }, { pin: 'b', name: p.b, x: at[2], y: at[3] }];
    if (p.type === 'OA') { const [x, y] = at.length ? at : [NaN, NaN], k = p.scale ?? 1, f = p.flip ? -1 : 1, d = p.mirror ? -1 : 1; return [{ pin: 'minus', name: p.minus, x: x - 1.5 * k * d, y: y + 0.5 * k * f }, { pin: 'plus', name: p.plus, x: x - 1.5 * k * d, y: y - 0.5 * k * f }, { pin: 'out', name: p.out, x: x + 1.5 * k * d, y }]; }
    if (p.type === 'GND') return [{ pin: 'a', name: p.a ?? '0', x: at[0], y: at[1] }];
    if (p.type === 'label') return [{ pin: 'a', name: p.node, x: at[0], y: at[1] }];
    return [];
  }
  _nets() {
    const par = new Map(), find = (k) => { let r = k; while (par.get(r) !== r) r = par.get(r); let c = k; while (par.get(c) !== r) { const nx = par.get(c); par.set(c, r); c = nx; } return r; };
    const mk = (k) => { if (!par.has(k)) par.set(k, k); return k; }, uni = (a, b) => { const ra = find(mk(a)), rb = find(mk(b)); if (ra !== rb) par.set(ra, rb); };
    const nm = (s) => 'n:' + (GROUND.has(String(s)) ? '0' : s);
    // interesting points: terminals, wire vertices; wire segments get split at points lying on them
    const pts = new Map(); const addPt = (x, y) => { if (isFinite(x) && isFinite(y)) { const k = kp(x, y); if (!pts.has(k)) pts.set(k, [x, y]); mk('p:' + k); } };
    for (const p of this.parts) { for (const t of this.terminals(p)) addPt(t.x, t.y); if (p.type === 'W') for (let i = 0; i + 1 < p.at.length; i += 2) addPt(p.at[i], p.at[i + 1]); }
    this.segs = [];
    for (const p of this.parts) if (p.type === 'W') {
      for (let i = 0; i + 3 < p.at.length; i += 2) {
        const x0 = p.at[i], y0 = p.at[i + 1], x1 = p.at[i + 2], y1 = p.at[i + 3], L2 = (x1 - x0) ** 2 + (y1 - y0) ** 2; if (!L2) continue;
        const on = [[0, x0, y0], [1, x1, y1]];
        for (const [, [x, y]] of pts) { const t = ((x - x0) * (x1 - x0) + (y - y0) * (y1 - y0)) / L2; if (t <= 1e-9 || t >= 1 - 1e-9) continue; const cx = x0 + t * (x1 - x0), cy = y0 + t * (y1 - y0); if (Math.hypot(cx - x, cy - y) < 1e-7) on.push([t, x, y]); }
        on.sort((a, b) => a[0] - b[0]);
        for (let k = 0; k + 1 < on.length; k++) { const A = on[k], B = on[k + 1]; uni('p:' + kp(A[1], A[2]), 'p:' + kp(B[1], B[2])); this.segs.push({ wire: p.id, x0: A[1], y0: A[2], x1: B[1], y1: B[2] }); }
      }
    }
    for (const p of this.parts) for (const t of this.terminals(p)) {
      const pk = isFinite(t.x) && isFinite(t.y) ? 'p:' + kp(t.x, t.y) : null;
      if (p.type === 'GND') { if (pk) uni(pk, nm('0')); continue; }
      if (t.name != null && pk) uni(pk, nm(t.name)); else if (t.name != null) mk(nm(t.name));
    }
    mk(nm('0'));
    // name each net: a user name if it has one (ground wins), otherwise N1, N2, …
    const names = new Map(); let auto = 0;
    for (const k of par.keys()) if (k.startsWith('n:')) { const r = find(k), s = k.slice(2); if (!names.has(r) || s === '0') names.set(r, s); }
    this._find = find; this._netName = (k) => { const r = find(k); if (!names.has(r)) names.set(r, 'N' + ++auto); return names.get(r); };
    for (const k of par.keys()) this._netName(k);
    this.termNode = new Map(); // part.id → {pin: node}
    for (const p of this.parts) { const m = {}; for (const t of this.terminals(p)) m[t.pin] = t.name != null && !(isFinite(t.x) && isFinite(t.y)) ? this._netName(nm(t.name)) : isFinite(t.x) ? this._netName('p:' + kp(t.x, t.y)) : this._netName(nm(t.name)); this.termNode.set(p.id, m); }
    for (const s of this.segs) s.node = this._netName('p:' + kp(s.x0, s.y0));
    this.pointNode = (x, y) => (par.has('p:' + kp(x, y)) ? this._netName('p:' + kp(x, y)) : null);
    // ground: explicit, else the − terminal of the first voltage source
    const allNodes = new Set(); for (const m of this.termNode.values()) for (const v of Object.values(m)) allNodes.add(v);
    this.ground = '0';
    if (![...this.termNode.values()].some((m) => Object.values(m).includes('0'))) { const v = this.parts.find((p) => p.type === 'V'); this.ground = v ? this.termNode.get(v.id).b : [...allNodes][0]; }
    this.nodes = [...allNodes].filter((n) => n !== this.ground).sort();
  }
  _index() {
    this.ni = new Map(this.nodes.map((n, i) => [n, i])); let k = this.nodes.length; this.bi = new Map();
    for (const p of this.parts) if (['V', 'L', 'SW', 'OA'].includes(p.type) || (p.type === 'D' && p.model === 'ideal')) this.bi.set(p.id, k++);
    this.size = k;
  }
  node(p, pin) { const n = this.termNode.get(p.id)[pin]; return n === this.ground ? -1 : this.ni.get(n); }
  part(id) { return this.byId.get(id); }
  // ---------------------------------------------------------------- assembly
  _switchClosed(p, t) { if (p.closedAt == null && p.openAt == null) return p.closed !== false; return (p.closedAt == null || t >= p.closedAt) && (p.openAt == null || t < p.openAt); }
  /**
   * Build and solve the real MNA system. ctx: {t, h, method, state (companion history), dio (Newton points / ideal states)}.
   * Returns solution vector x.
   */
  _assemble(ctx) {
    const n = this.size, A = new Float64Array(n * n), b = new Float64Array(n), o = this.o;
    const add = (i, j, v) => { if (i >= 0 && j >= 0) A[i * n + j] += v; };
    const G = (a, c, g) => { add(a, a, g); add(c, c, g); add(a, c, -g); add(c, a, -g); };
    const I = (a, c, cur) => { if (a >= 0) b[a] -= cur; if (c >= 0) b[c] += cur; };
    const br = (k, a, c, Z, V) => { add(a, k, 1); add(c, k, -1); add(k, a, 1); add(k, c, -1); A[k * n + k] -= Z; b[k] += V; };
    for (let i = 0; i < this.nodes.length; i++) A[i * n + i] += o.gmin;
    const { t = 0, h = 0, method = 'be', st, dio } = ctx, trap = method === 'trap';
    for (const p of this.parts) {
      const a = TWO.has(p.type) ? this.node(p, 'a') : -1, c = TWO.has(p.type) ? this.node(p, 'b') : -1, k = this.bi.get(p.id);
      switch (p.type) {
        case 'R': G(a, c, 1 / p.value); break;
        case 'C': if (h) { const s = st[p.id], g = (trap ? 2 : 1) * p.value / h; G(a, c, g); I(a, c, trap ? -(g * s.v + s.i) : -g * s.v); } else if (ctx.icMode) br(this._icK(p), a, c, 0, ctx.st[p.id].v); break;
        case 'L': if (h) { const s = st[p.id], Z = (trap ? 2 : 1) * p.value / h; br(k, a, c, Z, trap ? -Z * s.i - s.v : -Z * s.i); } else if (ctx.icMode) { A[k * n + k] = 1; add(a, k, 1); add(c, k, -1); b[k] = ctx.st[p.id].i; } else br(k, a, c, 0, 0); break;
        case 'V': br(k, a, c, 0, ctx.vsrc ? ctx.vsrc(p) : waveAt(p.wave ?? p.value, t, 0)); break;
        case 'I': I(a, c, waveAt(p.wave ?? p.value, t, 0)); break;
        case 'SW': if (this._switchClosed(p, t)) br(k, a, c, p.ron ?? 0, 0); else { add(a, k, 1); add(c, k, -1); A[k * n + k] = 1; } break;
        case 'D': {
          if (p.model === 'ideal') { if (dio[p.id]) br(k, a, c, 0, p.vf ?? 0); else { add(a, k, 1); add(c, k, -1); A[k * n + k] = 1; } }
          else { const nVt = (p.n ?? o.nd) * o.Vt, Is = p.Is ?? o.Is, vd = dio[p.id] ?? 0, e = Math.exp(Math.min(vd / nVt, 80)), gd = Is / nVt * e + o.gmin, id = Is * (e - 1); G(a, c, gd); I(a, c, id - gd * vd); }
          break;
        }
        case 'OA': {
          const pl = this.node(p, 'plus'), mi = this.node(p, 'minus'), out = this.node(p, 'out'), A0 = p.gain ?? Infinity, clamp = dio[p.id];
          add(out, k, -1);
          if (clamp != null) { add(k, out, 1); b[k] = clamp; }
          else if (A0 === Infinity) { add(k, pl, 1); add(k, mi, -1); }
          else { add(k, out, 1); add(k, pl, -A0); add(k, mi, A0); }
          break;
        }
      }
    }
    return { A, b, n };
  }
  _icK(p) { return this._ick.get(p.id); }
  _solve(ctx) {
    const sys = this._assemble(ctx), sig = ctx.sig;
    if (sig != null && ctx.cache) { let F = ctx.cache.get(sig); if (!F) { F = luReal(sys.A, sys.n); ctx.cache.set(sig, F); } return F ? luSolveReal(F, sys.b) : null; }
    const F = luReal(sys.A, sys.n); return F ? luSolveReal(F, sys.b) : null;
  }
  /** Solve with nonlinear elements (diode Newton, ideal-diode and op-amp rail state iteration). */
  _nonlinear(ctx) {
    const dio = ctx.dio || {}; ctx.dio = dio; const D = this.parts.filter((p) => p.type === 'D'), OA = this.parts.filter((p) => p.type === 'OA' && p.rails), SW = this.parts.filter((p) => p.type === 'SW');
    let x = null, it = 0;
    const vab = (x, p) => { const a = this.node(p, 'a'), c = this.node(p, 'b'); return (a >= 0 ? x[a] : 0) - (c >= 0 ? x[c] : 0); };
    for (it = 0; it < 120; it++) {
      ctx.sig = ctx.cache ? JSON.stringify([D.filter((p) => p.model === 'ideal').map((p) => !!dio[p.id]), OA.map((p) => dio[p.id] ?? null), SW.map((p) => this._switchClosed(p, ctx.t ?? 0))]) : null;
      if (D.some((p) => p.model !== 'ideal')) ctx.sig = null;
      x = this._solve(ctx); if (!x) return null;
      let changed = false;
      for (const p of D) {
        const v = vab(x, p);
        if (p.model === 'ideal') { const k = this.bi.get(p.id), on = !!dio[p.id]; if (!on && v > (p.vf ?? 0) + 1e-9) { dio[p.id] = true; changed = true; } else if (on && x[k] < -1e-12) { dio[p.id] = false; changed = true; } }
        else {
          const nVt = (p.n ?? this.o.nd) * this.o.Vt, Is = p.Is ?? this.o.Is, vcrit = nVt * Math.log(nVt / (Math.SQRT2 * Is)), old = dio[p.id] ?? 0; let nv = v;
          if (nv > vcrit && Math.abs(nv - old) > 2 * nVt) nv = old > 0 ? (1 + (nv - old) / nVt > 0 ? old + nVt * Math.log(1 + (nv - old) / nVt) : vcrit) : nVt * Math.log(nv / nVt);
          if (Math.abs(nv - old) > 1e-9 + 1e-6 * Math.abs(old)) changed = true; dio[p.id] = nv;
        }
      }
      for (const p of OA) {
        const k = this.bi.get(p.id), out = this.node(p, 'out'), vo = out >= 0 ? x[out] : 0, [lo, hi] = p.rails, cl = dio[p.id];
        const pl = this.node(p, 'plus'), mi = this.node(p, 'minus'), dv = (pl >= 0 ? x[pl] : 0) - (mi >= 0 ? x[mi] : 0);
        if (cl == null && vo > hi + 1e-9) { dio[p.id] = hi; changed = true; } else if (cl == null && vo < lo - 1e-9) { dio[p.id] = lo; changed = true; }
        else if (cl === hi && dv < 0) { dio[p.id] = null; changed = true; } else if (cl === lo && dv > 0) { dio[p.id] = null; changed = true; }
        void k;
      }
      if (!changed) break;
    }
    ctx.iterations = it + 1; return x;
  }
  /** Package a solution vector into a result: {v: {node}, i: {id}, p: {id}, V(n), I(id), P(id)}. */
  _result(x, ctx, extra = {}) {
    const v = { [this.ground]: 0 }; this.nodes.forEach((n, i) => { v[n] = x[i]; });
    const i = {}, { h = 0, method = 'be', st, t = 0 } = ctx, trap = method === 'trap';
    const vn = (p, pin) => v[this.termNode.get(p.id)[pin]] ?? 0;
    for (const p of this.parts) {
      const k = this.bi.get(p.id), vab = TWO.has(p.type) ? vn(p, 'a') - vn(p, 'b') : 0;
      switch (p.type) {
        case 'R': i[p.id] = vab / p.value; break;
        case 'C': i[p.id] = h ? (trap ? 2 * p.value / h * (vab - st[p.id].v) - st[p.id].i : p.value / h * (vab - st[p.id].v)) : ctx.icMode ? x[this._icK(p)] : 0; break;
        case 'I': i[p.id] = waveAt(p.wave ?? p.value, t, 0); break;
        case 'D': if (p.model === 'ideal') i[p.id] = x[k]; else { const nVt = (p.n ?? this.o.nd) * this.o.Vt; i[p.id] = (p.Is ?? this.o.Is) * (Math.exp(Math.min(vab / nVt, 80)) - 1); } break;
        case 'OA': i[p.id] = x[k]; break;
        default: if (k != null) i[p.id] = x[k];
      }
    }
    const pw = {}; for (const p of this.parts) if (TWO.has(p.type)) pw[p.id] = (vn(p, 'a') - vn(p, 'b')) * (i[p.id] ?? 0);
    return mkResult({ v, i, p: pw, t, ok: true, ...extra });
  }
  // ---------------------------------------------------------------- analyses
  /** DC operating point at time t (default 0): capacitors open, inductors short, diodes by Newton. */
  dc(opts = {}) {
    const ctx = { t: opts.t ?? 0, h: 0, st: {}, dio: {} }; const x = this._nonlinear(ctx);
    if (!x) return mkResult({ v: {}, i: {}, p: {}, ok: false, error: 'singular circuit' });
    return this._result(x, ctx, { iterations: ctx.iterations });
  }
  /**
   * AC phasors at frequency f (Hz). Sources with an `ac` field ({mag, phase (deg)} or a number) drive the circuit; if no
   * source has one, every voltage source drives with amplitude `value`. Diodes are linearised at the DC operating point.
   * → {v: {node: [re, im]}, i: {id: [re, im]}, f, V(n), I(id), mag(n), phase(n)}
   */
  ac(f, opts = {}) {
    const w = TAU * f, n = this.size, Ar = new Float64Array(n * n), Ai = new Float64Array(n * n), br = new Float64Array(n), bi = new Float64Array(n);
    const anyAC = this.parts.some((p) => p.ac != null), op = this.parts.some((p) => p.type === 'D') ? this.dc() : null;
    const add = (i, j, re, im = 0) => { if (i >= 0 && j >= 0) { Ar[i * n + j] += re; Ai[i * n + j] += im; } };
    const Y = (a, c, re, im) => { add(a, a, re, im); add(c, c, re, im); add(a, c, -re, -im); add(c, a, -re, -im); };
    const phasor = (p) => { if (anyAC) { if (p.ac == null) return [0, 0]; const m = typeof p.ac === 'number' ? p.ac : p.ac.mag ?? 1, ph = (typeof p.ac === 'number' ? 0 : p.ac.phase ?? 0) * Math.PI / 180; return [m * Math.cos(ph), m * Math.sin(ph)]; } return p.type === 'V' ? [p.value ?? 0, 0] : [0, 0]; };
    const brS = (k, a, c, zr, zi, V) => { add(a, k, 1); add(c, k, -1); add(k, a, 1); add(k, c, -1); Ar[k * n + k] -= zr; Ai[k * n + k] -= zi; br[k] += V[0]; bi[k] += V[1]; };
    for (let i = 0; i < this.nodes.length; i++) Ar[i * n + i] += this.o.gmin;
    for (const p of this.parts) {
      const a = TWO.has(p.type) ? this.node(p, 'a') : -1, c = TWO.has(p.type) ? this.node(p, 'b') : -1, k = this.bi.get(p.id);
      switch (p.type) {
        case 'R': Y(a, c, 1 / p.value, 0); break;
        case 'C': Y(a, c, 0, w * p.value); break;
        case 'L': brS(k, a, c, 0, w * p.value, [0, 0]); break;
        case 'V': brS(k, a, c, 0, 0, phasor(p)); break;
        case 'I': { const [re, im] = phasor(p); if (a >= 0) { br[a] -= re; bi[a] -= im; } if (c >= 0) { br[c] += re; bi[c] += im; } break; }
        case 'SW': if (this._switchClosed(p, opts.t ?? 0)) brS(k, a, c, p.ron ?? 0, 0, [0, 0]); else { add(a, k, 1); add(c, k, -1); Ar[k * n + k] = 1; } break;
        case 'D': { if (p.model === 'ideal') { const on = (op?.I(p.id) ?? 0) > 1e-12; if (on) brS(k, a, c, 0, 0, [0, 0]); else { add(a, k, 1); add(c, k, -1); Ar[k * n + k] = 1; } } else { const nVt = (p.n ?? this.o.nd) * this.o.Vt, vd = op.V(this.termNode.get(p.id).a) - op.V(this.termNode.get(p.id).b); Y(a, c, (p.Is ?? this.o.Is) / nVt * Math.exp(Math.min(vd / nVt, 80)) + this.o.gmin, 0); } break; }
        case 'OA': { const pl = this.node(p, 'plus'), mi = this.node(p, 'minus'), out = this.node(p, 'out'), A0 = p.gain ?? Infinity; add(out, k, -1); if (A0 === Infinity) { add(k, pl, 1); add(k, mi, -1); } else { add(k, out, 1); add(k, pl, -A0); add(k, mi, A0); } break; }
      }
    }
    const sol = solveComplex(Ar, Ai, br, bi, n); if (!sol) return mkResult({ v: {}, i: {}, ok: false, error: 'singular circuit', f, complex: true });
    const [xr, xi] = sol, v = { [this.ground]: [0, 0] }; this.nodes.forEach((nd, i) => { v[nd] = [xr[i], xi[i]]; });
    const i = {}, vn = (p, pin) => v[this.termNode.get(p.id)[pin]] ?? [0, 0];
    for (const p of this.parts) {
      const k = this.bi.get(p.id); if (!TWO.has(p.type) && p.type !== 'OA') continue;
      const d = p.type === 'OA' ? [0, 0] : [vn(p, 'a')[0] - vn(p, 'b')[0], vn(p, 'a')[1] - vn(p, 'b')[1]];
      if (p.type === 'R') i[p.id] = [d[0] / p.value, d[1] / p.value];
      else if (p.type === 'C') i[p.id] = [-w * p.value * d[1], w * p.value * d[0]];
      else if (p.type === 'I') i[p.id] = phasor(p);
      else if (p.type === 'D' && p.model !== 'ideal') { const nVt = (p.n ?? this.o.nd) * this.o.Vt, vd = op.V(this.termNode.get(p.id).a) - op.V(this.termNode.get(p.id).b), g = (p.Is ?? this.o.Is) / nVt * Math.exp(Math.min(vd / nVt, 80)); i[p.id] = [g * d[0], g * d[1]]; }
      else if (k != null) i[p.id] = [xr[k], xi[k]];
    }
    const pw = {}; for (const p of this.parts) if (TWO.has(p.type) && i[p.id]) { const d = [vn(p, 'a')[0] - vn(p, 'b')[0], vn(p, 'a')[1] - vn(p, 'b')[1]], I0 = i[p.id]; pw[p.id] = 0.5 * (d[0] * I0[0] + d[1] * I0[1]); }
    return mkResult({ v, i, p: pw, f, ok: true, complex: true });
  }
  /** Frequency sweep: n points from f0 to f1 (log-spaced unless {log: false}). pick(res, f) → number (optional). → [{f, res, y}] */
  sweep(f0, f1, n = 200, opts = {}, pick) {
    if (typeof opts === 'function') { pick = opts; opts = {}; }
    const log = opts.log !== false, out = [];
    for (let k = 0; k < n; k++) { const f = log ? f0 * Math.pow(f1 / f0, k / (n - 1)) : f0 + (f1 - f0) * k / (n - 1), res = this.ac(f); out.push({ f, res, y: pick ? pick(res, f) : undefined }); }
    return out;
  }
  /**
   * Transient analysis from t = 0 to tEnd with step dt. opts {method: 'trap' (default) | 'be', uic (default true: capacitor
   * voltages and inductor currents start at their `ic`, default 0; false → start from the DC operating point)}.
   * → {t: Float64Array, v: {node: Float64Array}, i: {id: Float64Array}, at(time) → result snapshot, imax, vmax}
   */
  transient(tEnd, dt, opts = {}) {
    const N = Math.max(1, Math.round(tEnd / dt)), h = tEnd / N, method = opts.method || 'trap';
    const caps = this.parts.filter((p) => p.type === 'C'), inds = this.parts.filter((p) => p.type === 'L');
    const st = {}; for (const p of caps) st[p.id] = { v: p.ic ?? 0, i: 0 }; for (const p of inds) st[p.id] = { i: p.ic ?? 0, v: 0 };
    if (opts.uic === false) { const op = this.dc({ t: 0 }); for (const p of caps) st[p.id].v = op.V(this.termNode.get(p.id).a) - op.V(this.termNode.get(p.id).b); for (const p of inds) st[p.id].i = op.I(p.id); }
    // t = 0 snapshot: capacitors as voltage sources at their initial voltage, inductors as current sources
    this._ick = new Map(); let k = this.size; for (const p of caps) this._ick.set(p.id, k++);
    const size0 = this.size; this.size = k;
    const ctx0 = { t: 0, h: 0, st, dio: {}, icMode: true };
    let x0 = this._nonlinear(ctx0); this.size = size0;
    const T = new Float64Array(N + 1), V = Object.fromEntries(this.nodes.map((n) => [n, new Float64Array(N + 1)])), Ii = {};
    V[this.ground] = new Float64Array(N + 1);
    const ids = this.parts.filter((p) => TWO.has(p.type) || p.type === 'OA').map((p) => p.id); for (const id of ids) Ii[id] = new Float64Array(N + 1);
    const rec = (j, r) => { T[j] = r.t; for (const n in V) V[n][j] = r.v[n] ?? 0; for (const id of ids) Ii[id][j] = r.i[id] ?? 0; };
    if (x0) { const r0 = this._result(x0, ctx0); for (const p of inds) r0.i[p.id] = st[p.id].i; rec(0, r0); for (const p of caps) st[p.id].i = r0.i[p.id]; for (const p of inds) st[p.id].v = r0.V(this.termNode.get(p.id).a) - r0.V(this.termNode.get(p.id).b); }
    const cache = new Map(); let dio = {};
    for (let j = 1; j <= N; j++) {
      const t = j * h, m = j === 1 && method === 'trap' && opts.firstBE !== false ? 'be' : method;
      const ctx = { t, h, method: m, st, dio, cache: m === method ? cache : null }; const x = this._nonlinear(ctx);
      if (!x) break; dio = ctx.dio; const r = this._result(x, ctx); rec(j, r);
      for (const p of caps) { st[p.id].v = r.V(this.termNode.get(p.id).a) - r.V(this.termNode.get(p.id).b); st[p.id].i = r.i[p.id]; }
      for (const p of inds) { st[p.id].i = r.i[p.id]; st[p.id].v = r.V(this.termNode.get(p.id).a) - r.V(this.termNode.get(p.id).b); }
    }
    let imax = 0, vmax = 0; for (const id of ids) for (const x of Ii[id]) imax = Math.max(imax, Math.abs(x)); for (const n in V) for (const x of V[n]) vmax = Math.max(vmax, Math.abs(x));
    const self = this;
    return {
      t: T, v: V, i: Ii, h, imax, vmax, method,
      /** Linear interpolation of every node voltage / current at `time` → result (with V(), I(), P()). */
      at(time) {
        const u = Math.max(0, Math.min(N, time / h)), j = Math.min(N - 1, Math.floor(u)), f = u - j, v = {}, i = {};
        for (const n in V) v[n] = V[n][j] + f * (V[n][j + 1] - V[n][j]); for (const id of ids) i[id] = Ii[id][j] + f * (Ii[id][j + 1] - Ii[id][j]);
        const pw = {}; for (const p of self.parts) if (TWO.has(p.type)) pw[p.id] = ((v[self.termNode.get(p.id).a] ?? 0) - (v[self.termNode.get(p.id).b] ?? 0)) * (i[p.id] ?? 0);
        return mkResult({ v, i, p: pw, t: Math.min(time, tEnd), ok: true, imax, vmax });
      },
      /** [[t, value]] series of a node voltage (string) or of fn(snapshot index j). */
      series(node) { return Array.from(T, (t, j) => [t, typeof node === 'function' ? node(j) : V[node][j]]); },
    };
  }
}
function mkResult(r) {
  const c = !!r.complex;
  r.V = (n) => (r.v[n] ?? (c ? [0, 0] : 0)); r.I = (id) => (r.i[id] ?? (c ? [0, 0] : 0)); r.P = (id) => r.p?.[id] ?? 0;
  if (c) { r.mag = (n) => Math.hypot(...r.V(n)); r.phase = (n) => Math.atan2(r.V(n)[1], r.V(n)[0]); r.imag = (id) => Math.hypot(...r.I(id)); r.iphase = (id) => Math.atan2(r.I(id)[1], r.I(id)[0]); }
  return r;
}

// ================================================================== drawing
const FONT = (size, w = 600) => `${w} ${size}px Inter, system-ui, sans-serif`;
class CircuitKit {
  constructor(api, rt, stage, spec) {
    const parts = Array.isArray(spec) ? spec : spec.parts; this.o = { dots: true, colors: true, labels: true, names: true, dotSpeed: 70, dotSpacing: 18, junctions: true, ...(Array.isArray(spec) ? {} : spec) };
    this.api = api; this.rt = rt; this.s = stage; this.net = new Netlist(parts, this.o); this.parts = this.net.parts;
    this._phase = new Map(); this._lastT = null;
    if (stage && this.o.onEdit) stage.onClick((x, y) => { const p = this.hit(x, y); if (p) this.o.onEdit(p); });
  }
  part(id) { return this.net.part(id); }
  /** Change a part's value (or any field) and redraw. */
  set(id, value, field = 'value') { const p = this.part(id); if (!p) throw new Error('circuit: no part ' + id); p[field] = value; this.rt.invalidate(); return this; }
  /** A slider bound to a part's value (SI-formatted). opts {log (default true for R/C/L), unit, field, onChange}. */
  control(id, label, min, max, opts = {}) {
    const p = this.part(id), field = opts.field || 'value', unit = opts.unit ?? UNIT[p.type] ?? '';
    return this.api.slider(label, min, max, p[field], { log: opts.log ?? ['R', 'C', 'L'].includes(p.type), fmt: (x) => si(x, unit), ...opts, onChange: (x) => { p[field] = x; opts.onChange?.(x); } });
  }
  dc(o) { return this.net.dc(o); }
  ac(f, o) { return this.net.ac(f, o); }
  sweep(...a) { return this.net.sweep(...a); }
  transient(...a) { return this.net.transient(...a); }
  /** The part under data point (x, y) (within ~10 px of its axis), for click-to-edit. */
  hit(x, y) {
    const s = this.s, X = s.X(x), Y = s.Y(y); let best = null, bd = 12;
    for (const p of this.parts) {
      if (!TWO.has(p.type) || !p.at) continue; const ax = s.X(p.at[0]), ay = s.Y(p.at[1]), bx = s.X(p.at[2]), by = s.Y(p.at[3]), L2 = (bx - ax) ** 2 + (by - ay) ** 2;
      const t = Math.max(0, Math.min(1, ((X - ax) * (bx - ax) + (Y - ay) * (by - ay)) / (L2 || 1))), d = Math.hypot(X - ax - t * (bx - ax), Y - ay - t * (by - ay)); if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  // ---------------------------------------------------------------- wire currents (tree KCL per net)
  _wireCurrents(res) {
    const net = this.net, cur = new Map();
    // current injected into each net point by the parts attached there (complex for AC results)
    const pin = new Map();
    const addC = (k, re, im) => { const o = pin.get(k) || [0, 0]; o[0] += re; o[1] += im; pin.set(k, o); };
    for (const p of this.parts) {
      const T = net.terminals(p), val = res.I(p.id), I0 = Array.isArray(val) ? val : [val ?? 0, 0];
      if (TWO.has(p.type)) { addC(kp(T[0].x, T[0].y), -I0[0], -I0[1]); addC(kp(T[1].x, T[1].y), I0[0], I0[1]); }
      if (p.type === 'OA') addC(kp(T[2].x, T[2].y), I0[0], I0[1]);
    }
    // graph of wire segments; root components at ground symbols where possible
    const adj = new Map(), segs = net.segs;
    segs.forEach((s, i) => { for (const [k, o] of [[kp(s.x0, s.y0), kp(s.x1, s.y1)], [kp(s.x1, s.y1), kp(s.x0, s.y0)]]) { if (!adj.has(k)) adj.set(k, []); adj.get(k).push([o, i]); } });
    const gnd = new Set(this.parts.filter((p) => p.type === 'GND').map((p) => kp(p.at[0], p.at[1])));
    const seen = new Set(), keys = [...adj.keys()].sort((a, b) => (gnd.has(b) ? 1 : 0) - (gnd.has(a) ? 1 : 0));
    for (const root of keys) {
      if (seen.has(root)) continue;
      const order = [], parent = new Map([[root, null]]); seen.add(root); const stack = [root];
      while (stack.length) { const u = stack.pop(); order.push(u); for (const [w, si2] of adj.get(u) || []) if (!seen.has(w)) { seen.add(w); parent.set(w, [u, si2]); stack.push(w); } }
      const sub = new Map(); for (const u of order) sub.set(u, (pin.get(u) || [0, 0]).slice());
      for (let q = order.length - 1; q > 0; q--) {
        const u = order[q], [par, si2] = parent.get(u), s = segs[si2], fromU = kp(s.x0, s.y0) === u, f = sub.get(u);
        cur.set(si2, fromU ? [f[0], f[1]] : [-f[0], -f[1]]); // positive = along x0→x1
        const ps = sub.get(par); ps[0] += f[0]; ps[1] += f[1];
      }
    }
    return cur;
  }
  // ---------------------------------------------------------------- draw
  /**
   * Draw the schematic. opts {result (dc/ac/transient snapshot; default: a fresh DC solve), t (animation clock, s),
   * dots, colors, labels, vmax, imax, acRate (visual Hz for AC sloshing), probes}. → the result used.
   */
  draw(over = {}) {
    const o = { ...this.o, ...over }, s = this.s, api = this.api, c = s.ctx, net = this.net;
    const res = o.result || this.dc(), complex = !!res.complex, t = o.t ?? 0;
    const wvis = TAU * (o.acRate ?? 0.6);
    const re = (z) => (Array.isArray(z) ? z[0] * Math.cos(wvis * t) - z[1] * Math.sin(wvis * t) : z); // instantaneous value
    const nodesV = Object.keys(res.v || {}), vmax = o.vmax ?? (res.vmax || Math.max(1e-12, ...nodesV.map((n) => (complex ? Math.hypot(...res.v[n]) : Math.abs(res.v[n])))));
    const vcol = (n) => { if (!o.colors) return api.color('ink'); const v = re(res.V(n)) / vmax; return api.mix('muted', v >= 0 ? 'red' : 'blue', Math.min(1, Math.abs(v)) * 0.95); };
    const u = Math.min(s.sx, s.sy);
    // wires
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    for (const sg of net.segs) { c.strokeStyle = vcol(sg.node); c.lineWidth = 2.4; c.beginPath(); c.moveTo(s.X(sg.x0), s.Y(sg.y0)); c.lineTo(s.X(sg.x1), s.Y(sg.y1)); c.stroke(); }
    c.restore();
    // centroid for label sides
    let gx = 0, gy = 0, gn = 0; for (const p of this.parts) if (p.at) { gx += p.at[0] + (p.at[2] ?? p.at[0]); gy += p.at[1] + (p.at[3] ?? p.at[1]); gn += 2; } gx /= gn || 1; gy /= gn || 1;
    for (const p of this.parts) this._part(p, res, vcol, u, [gx, gy], o, t);
    // junction dots
    if (o.junctions) {
      const deg = new Map(), inc = (x, y) => { const k = kp(x, y); deg.set(k, (deg.get(k) || 0) + 1); };
      for (const sg of net.segs) { inc(sg.x0, sg.y0); inc(sg.x1, sg.y1); }
      for (const p of this.parts) if (p.type !== 'GND' && p.type !== 'label') for (const tm of net.terminals(p)) if (isFinite(tm.x)) inc(tm.x, tm.y);
      for (const sg of net.segs) for (const [x, y] of [[sg.x0, sg.y0], [sg.x1, sg.y1]]) if (deg.get(kp(x, y)) >= 3) { deg.set(kp(x, y), 0); c.beginPath(); c.arc(s.X(x), s.Y(y), 3.6, 0, TAU); c.fillStyle = vcol(sg.node); c.fill(); }
    }
    // current dots
    if (o.dots) this._dots(res, o, t, complex, wvis);
    return res;
  }
  _dots(res, o, t, complex, wvis) {
    const s = this.s, c = s.ctx, net = this.net, dt = this._lastT == null || t < this._lastT ? 0 : Math.min(0.1, t - this._lastT); this._lastT = t;
    const paths = [];
    const wc = this._wireCurrents(res);
    net.segs.forEach((sg, i) => paths.push(['w' + i, [[s.X(sg.x0), s.Y(sg.y0)], [s.X(sg.x1), s.Y(sg.y1)]], wc.get(i) || [0, 0]]));
    for (const p of this.parts) {
      const T = net.terminals(p); if (!T.length || !isFinite(T[0].x)) continue; const val = res.I(p.id), I0 = Array.isArray(val) ? val : [val ?? 0, 0];
      if (TWO.has(p.type)) paths.push(['p' + p.id, [[s.X(T[0].x), s.Y(T[0].y)], [s.X(T[1].x), s.Y(T[1].y)]], I0]);
      if (p.type === 'OA') { const k = p.scale ?? 1, d = p.mirror ? -1 : 1, ox = p.at[0] + 1 * k * d; paths.push(['p' + p.id, [[s.X(ox), s.Y(p.at[1])], [s.X(T[2].x), s.Y(T[2].y)]], I0]); }
    }
    const imax = o.imax ?? (res.imax || Math.max(1e-15, ...paths.map(([, , I]) => Math.hypot(I[0], I[1]))));
    const S = o.dotSpacing, col = this.api.color(o.dotColor || 'gold');
    c.save(); c.fillStyle = col;
    for (const [id, P, I] of paths) {
      const mag = Math.hypot(I[0], I[1]) / imax; if (mag < 2e-3) continue;
      let ph;
      if (complex) ph = (o.acAmp ?? 14) * mag * Math.sin(wvis * t + Math.atan2(I[1], I[0])) / 1; // sloshing displacement (px)
      else { ph = (this._phase.get(id) || 0) + (I[0] / imax) * o.dotSpeed * dt; this._phase.set(id, ph); }
      const L = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]); if (L < 1) continue;
      const off = ((ph % S) + S) % S;
      for (let d = off; d < L; d += S) { const f = d / L; c.beginPath(); c.arc(P[0][0] + f * (P[1][0] - P[0][0]), P[0][1] + f * (P[1][1] - P[0][1]), 2.5, 0, TAU); c.fill(); }
    }
    c.restore();
  }
  _part(p, res, vcol, u, G, o, t) {
    const s = this.s, c = s.ctx, api = this.api, net = this.net, ink = api.color('ink'), T = net.terminals(p), nodeOf = net.termNode.get(p.id);
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    if (p.type === 'GND') {
      const X = s.X(p.at[0]), Y = s.Y(p.at[1]), w = Math.max(10, u * 0.32), dir = p.dir === 'up' ? -1 : 1;
      c.strokeStyle = vcol(nodeOf.a); c.lineWidth = 2.4; c.beginPath(); c.moveTo(X, Y); c.lineTo(X, Y + dir * w * 0.55); c.stroke();
      c.strokeStyle = ink; c.lineWidth = 2;
      [1, 0.62, 0.26].forEach((k, i) => { c.beginPath(); c.moveTo(X - w * k, Y + dir * (w * 0.55 + i * w * 0.3)); c.lineTo(X + w * k, Y + dir * (w * 0.55 + i * w * 0.3)); c.stroke(); });
      c.restore(); return;
    }
    if (p.type === 'label') {
      const X = s.X(p.at[0]), Y = s.Y(p.at[1]), node = p.node ?? net.pointNode(p.at[0], p.at[1]);
      c.beginPath(); c.arc(X, Y, 3.6, 0, TAU); c.fillStyle = node ? vcol(node) : ink; c.fill();
      const raw = p.text ?? node ?? '', tex = /^\$.*\$$/.test(raw), V = o.probes !== false && p.show !== false && node && res.v ? res.V(node) : null;
      const val = V == null ? '' : Array.isArray(V) ? `|V| = ${si(Math.hypot(...V), 'V')}` : si(V, 'V');
      const dx = p.dx ?? 8, dy = p.dy ?? -10, al = dx < 0 ? 'right' : 'left', bl = dy < 0 ? 'bottom' : 'top'; c.restore();
      if (tex) { // TeX name with the live value on the line beyond it
        s.texPx(raw.slice(1, -1), X + dx, Y + dy + (bl === 'bottom' && val ? -15 : 0), { color: 'ink', size: 15, align: al, baseline: bl });
        if (val) s.textPx(val, X + dx, Y + dy + (bl === 'bottom' ? 0 : 19), { color: 'ink', size: 12, weight: 600, align: al, baseline: bl });
      } else s.textPx(raw + (raw && val ? ' = ' : '') + val, X + dx, Y + dy, { color: 'ink', size: 12, weight: 600, align: al, baseline: bl });
      return;
    }
    if (p.type === 'OA') { this._opamp(p, vcol, u, nodeOf); c.restore(); return; }
    if (!TWO.has(p.type) || !p.at) { c.restore(); return; }
    const A = [s.X(T[0].x), s.Y(T[0].y)], B = [s.X(T[1].x), s.Y(T[1].y)], L = Math.hypot(B[0] - A[0], B[1] - A[1]); if (L < 4) { c.restore(); return; }
    const ex = (B[0] - A[0]) / L, ey = (B[1] - A[1]) / L, nx = -ey, ny = ex;
    const body = Math.min(L - 8, Math.max(28, u * 0.95) * (p.type === 'V' || p.type === 'I' ? 0.9 : 1)), h0 = (L - body) / 2;
    const P = (x, y) => [A[0] + ex * (h0 + x) + nx * y, A[1] + ey * (h0 + x) + ny * y]; // local frame: x ∈ [0, body] along, y across
    // leads
    c.lineWidth = 2.4; c.strokeStyle = vcol(nodeOf.a); c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(...P(0, 0)); c.stroke();
    c.strokeStyle = vcol(nodeOf.b); c.beginPath(); c.moveTo(...P(body, 0)); c.lineTo(B[0], B[1]); c.stroke();
    c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = 2;
    const amp = Math.min(9, body * 0.2), line = (pts) => { c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(...P(...q)) : c.moveTo(...P(...q)))); c.stroke(); };
    let halfW = amp;
    switch (p.type) {
      case 'R': { const k = 6, pts = [[0, 0]]; for (let i = 0; i < k; i++) pts.push([body * (i + 0.5) / k, (i % 2 ? -1 : 1) * amp]); pts.push([body, 0]); line(pts); break; }
      case 'C': { const g = Math.max(5, body * 0.14), w = Math.min(15, body * 0.42); line([[0, 0], [body / 2 - g / 2, 0]]); line([[body / 2 + g / 2, 0], [body, 0]]); c.lineWidth = 2.6; line([[body / 2 - g / 2, -w], [body / 2 - g / 2, w]]); line([[body / 2 + g / 2, -w], [body / 2 + g / 2, w]]); halfW = w; break; }
      case 'L': { const k = 4, r = body / (2 * k); c.beginPath(); c.moveTo(...P(0, 0)); for (let i = 0; i < k; i++) { const cx = r * (2 * i + 1); for (let a = 0; a <= 16; a++) { const th = Math.PI - Math.PI * a / 16; c.lineTo(...P(cx + r * Math.cos(th), -r * Math.sin(th) * 1.25)); } } c.stroke(); halfW = r * 1.25; break; }
      case 'V': case 'I': {
        const R = Math.min(body / 2, 16), m = P(body / 2, 0); line([[0, 0], [body / 2 - R, 0]]); line([[body / 2 + R, 0], [body, 0]]);
        c.beginPath(); c.arc(m[0], m[1], R, 0, TAU); c.fillStyle = api.color('panel'); c.fill(); c.stroke(); c.fillStyle = ink;
        const sine = p.ac != null || (p.wave && p.wave.type === 'sine');
        if (p.type === 'I') { const q0 = P(body / 2 - R * 0.55, 0), q1 = P(body / 2 + R * 0.55, 0); c.beginPath(); c.moveTo(...q0); c.lineTo(q1[0] - ex * 5, q1[1] - ey * 5); c.stroke(); c.beginPath(); c.moveTo(...q1); c.lineTo(q1[0] - ex * 7 + nx * 4, q1[1] - ey * 7 + ny * 4); c.lineTo(q1[0] - ex * 7 - nx * 4, q1[1] - ey * 7 - ny * 4); c.closePath(); c.fill(); }
        else if (sine) { c.lineWidth = 1.7; c.beginPath(); for (let a = 0; a <= 24; a++) { const x = -R * 0.55 + R * 1.1 * a / 24, y = -Math.sin(a / 24 * TAU) * R * 0.32; const q = [m[0] + nx * x + ex * y, m[1] + ny * x + ey * y]; a ? c.lineTo(...q) : c.moveTo(...q); } c.stroke(); }
        else { c.font = FONT(13, 700); c.textAlign = 'center'; c.textBaseline = 'middle'; const qp = P(body / 2 - R * 0.48, 0), qm = P(body / 2 + R * 0.5, 0); c.fillText('+', qp[0], qp[1]); c.fillText('−', qm[0], qm[1]); }
        halfW = R; break;
      }
      case 'SW': {
        const closed = net._switchClosed(p, res.t ?? 0), r0 = P(body * 0.18, 0), r1 = P(body * 0.82, 0);
        line([[0, 0], [body * 0.18, 0]]); line([[body * 0.82, 0], [body, 0]]);
        const ang = closed ? 0 : 0.5, lx = body * 0.64, tip = [r0[0] + (ex * Math.cos(ang) + nx * Math.sin(ang)) * lx, r0[1] + (ey * Math.cos(ang) + ny * Math.sin(ang)) * lx];
        const side = ((A[0] + B[0]) / 2 - s.X(G[0])) * nx + ((A[1] + B[1]) / 2 - s.Y(G[1])) * ny >= 0 ? 1 : -1;
        const tip2 = closed ? r1 : [r0[0] + (ex * Math.cos(ang) + side * nx * Math.sin(ang)) * lx, r0[1] + (ey * Math.cos(ang) + side * ny * Math.sin(ang)) * lx];
        void tip; c.beginPath(); c.moveTo(...r0); c.lineTo(...tip2); c.stroke();
        for (const q of [r0, r1]) { c.beginPath(); c.arc(q[0], q[1], 3.2, 0, TAU); c.fillStyle = api.color('panel'); c.fill(); c.stroke(); }
        halfW = 10; break;
      }
      case 'D': {
        const w = Math.min(10, body * 0.28), x0 = body / 2 - w, x1 = body / 2 + w * 0.8; line([[0, 0], [x0, 0]]); line([[x1, 0], [body, 0]]);
        c.beginPath(); c.moveTo(...P(x0, -w)); c.lineTo(...P(x0, w)); c.lineTo(...P(x1, 0)); c.closePath(); c.fill(); c.lineWidth = 2.6; line([[x1, -w], [x1, w]]); halfW = w; break;
      }
    }
    c.restore();
    // labels: name over value, on the side away from the circuit's centre
    if (o.labels && p.label !== false) {
      const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], gpx = [s.X(G[0]), s.Y(G[1])];
      let side = p.labelSide ?? ((mid[0] - gpx[0]) * nx + (mid[1] - gpx[1]) * ny >= 0 ? 1 : -1);
      const off = halfW + 8, q = [mid[0] + nx * side * off, mid[1] + ny * side * off], horiz = Math.abs(nx * side) > 0.7;
      const al = horiz ? (nx * side > 0 ? 'left' : 'right') : 'center', unit = UNIT[p.type] ?? '';
      const valTxt = p.label ?? (p.type === 'SW' ? '' : p.type === 'D' ? (p.model === 'ideal' ? 'ideal' : '') : p.value != null && p.ac == null && !p.wave ? si(p.value, unit) : p.ac != null ? `${si(typeof p.ac === 'number' ? p.ac : p.ac.mag ?? 1, 'V')} ac` : '');
      const name = o.names ? p.name ?? p.id : '';
      const lines = [name, valTxt].filter(Boolean); const lh = 15, y0 = horiz ? q[1] - (lines.length - 1) * lh / 2 : ny * side > 0 ? q[1] + 7 : q[1] - 7 - (lines.length - 1) * lh;
      const bl = horiz ? 'middle' : ny * side > 0 ? 'top' : 'bottom';
      lines.forEach((txt, i) => {
        const m = i === 0 && name && txt.match(/^([A-Z])(\d+|[a-z]{1,3}|[A-Z]{1,2})?$/); // R1 → R₁, RL → R_L, Vin → V_in
        if (m) s.texPx(!m[2] ? m[1] : /\d/.test(m[2]) ? `${m[1]}_{${m[2]}}` : `${m[1]}_{\\mathrm{${m[2]}}}`, q[0], y0 + i * lh + (bl === 'top' ? -2 : bl === 'bottom' ? 2 : 0), { align: al, baseline: bl, size: 15, color: 'ink' });
        else s.textPx(txt, q[0], y0 + i * lh, { align: al, baseline: bl, size: i === 0 && name ? 13 : 11.5, color: i === 0 && name ? 'ink' : 'muted', weight: 600 });
      });
    }
  }
  _opamp(p, vcol, u, nodeOf) {
    const s = this.s, c = s.ctx, api = this.api, k = p.scale ?? 1, f = p.flip ? -1 : 1, d = p.mirror ? -1 : 1, [x, y] = p.at, ink = api.color('ink');
    const pt = (dx, dy) => [s.X(x + dx * d * k), s.Y(y + dy * k)];
    c.lineWidth = 2.4;
    for (const [pin, from, to] of [['minus', [-1.5, 0.5 * f], [-1, 0.5 * f]], ['plus', [-1.5, -0.5 * f], [-1, -0.5 * f]], ['out', [1, 0], [1.5, 0]]]) { c.strokeStyle = vcol(nodeOf[pin]); c.beginPath(); c.moveTo(...pt(...from)); c.lineTo(...pt(...to)); c.stroke(); }
    c.beginPath(); c.moveTo(...pt(-1, 1)); c.lineTo(...pt(-1, -1)); c.lineTo(...pt(1, 0)); c.closePath(); c.fillStyle = api.color('panel'); c.fill(); c.strokeStyle = ink; c.lineWidth = 2; c.stroke();
    c.fillStyle = ink; c.font = FONT(14, 700); c.textAlign = 'center'; c.textBaseline = 'middle';
    const m = pt(-0.72, 0.5 * f), q = pt(-0.72, -0.5 * f); c.fillText('−', m[0], m[1]); c.fillText('+', q[0], q[1]);
    if (this.o.labels && this.o.names && p.label !== false) { const L = pt(0.1, 1.05); s.textPx(p.label ?? p.id, L[0], L[1], { align: 'center', baseline: 'bottom', size: 12, color: 'muted', weight: 600 }); }
    void u;
  }
}

export default function circuit(api, rt, stage, spec) { return new CircuitKit(api, rt, stage, spec); }
