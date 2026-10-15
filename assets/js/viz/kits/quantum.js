// Quantum kit — a state-vector simulator for ≤ 6 qubits plus pictures: Bloch spheres, circuit diagrams with a step-through
// highlight, and amplitude bar charts with phase as colour. Reference: docs/kits-science.md.
//
//   const Q = v.quantum();                         // namespace bound to this viz (or one-off: v.quantum('bloch', s3, ψ))
//   const qc = Q.circuit(2).h(0).cx(0, 1).measure();
//   v.render(() => { const k = step.value, psi = qc.state(k);
//     Q.diagram(sd, qc, { step: k }); Q.amplitudes(sa, psi); Q.bloch(s3, psi.bloch(0)); });
//
// Conventions: basis labels are written q0 q1 … q(n−1) left to right (q0 is the most significant bit), all qubits start
// in |0⟩, rotation gates take the angle first (rx(θ, q), as in Qiskit). States expose probs(), sample(shots, rng),
// bloch(q) (the reduced Bloch vector, shorter than 1 when q is entangled) and ket() (TeX). Everything except the
// drawing helpers is DOM-free and exported (Circuit, QState, GATES).

const TAU = 2 * Math.PI, S2 = Math.SQRT1_2;
const c = (re, im = 0) => [re, im];
const ei = (t) => [Math.cos(t), Math.sin(t)];

// ------------------------------------------------------------------ gates (2×2 complex matrices, entries [re, im])
export const GATES = {
  I: () => [[c(1), c(0)], [c(0), c(1)]],
  H: () => [[c(S2), c(S2)], [c(S2), c(-S2)]],
  X: () => [[c(0), c(1)], [c(1), c(0)]],
  Y: () => [[c(0), c(0, -1)], [c(0, 1), c(0)]],
  Z: () => [[c(1), c(0)], [c(0), c(-1)]],
  S: () => [[c(1), c(0)], [c(0), c(0, 1)]],
  Sdg: () => [[c(1), c(0)], [c(0), c(0, -1)]],
  T: () => [[c(1), c(0)], [c(0), ei(Math.PI / 4)]],
  Tdg: () => [[c(1), c(0)], [c(0), ei(-Math.PI / 4)]],
  Rx: (t) => [[c(Math.cos(t / 2)), c(0, -Math.sin(t / 2))], [c(0, -Math.sin(t / 2)), c(Math.cos(t / 2))]],
  Ry: (t) => [[c(Math.cos(t / 2)), c(-Math.sin(t / 2))], [c(Math.sin(t / 2)), c(Math.cos(t / 2))]],
  Rz: (t) => [[ei(-t / 2), c(0)], [c(0), ei(t / 2)]],
  P: (t) => [[c(1), c(0)], [c(0), ei(t)]],
};
const TWO = new Set(['CX', 'CZ', 'SWAP']);
const LABEL = { Sdg: 'S†', Tdg: 'T†' };

// ------------------------------------------------------------------ state
export class QState {
  constructor(n, re, im) { this.n = n; this.N = 1 << n; this.re = re || new Float64Array(this.N); this.im = im || new Float64Array(this.N); if (!re) this.re[0] = 1; }
  static ket(bits) { const n = bits.length, s = new QState(n); s.re[0] = 0; s.re[parseInt(bits, 2)] = 1; return s; }
  /** From amplitudes [[re, im], …] or numbers (normalised). */
  static from(amps) {
    const N = amps.length, n = Math.round(Math.log2(N)); if (1 << n !== N) throw new Error('quantum: amplitude count must be a power of 2');
    const s = new QState(n); let nn = 0; amps.forEach((a, i) => { const [r, m] = Array.isArray(a) ? a : [a.re ?? a, a.im ?? 0]; s.re[i] = r; s.im[i] = m; nn += r * r + m * m; });
    const k = 1 / Math.sqrt(nn || 1); for (let i = 0; i < N; i++) { s.re[i] *= k; s.im[i] *= k; } return s;
  }
  clone() { return new QState(this.n, this.re.slice(), this.im.slice()); }
  bit(q) { return 1 << (this.n - 1 - q); }
  label(i) { return i.toString(2).padStart(this.n, '0'); }
  amp(i) { return { re: this.re[i], im: this.im[i], abs: Math.hypot(this.re[i], this.im[i]), arg: Math.atan2(this.im[i], this.re[i]) }; }
  probs() { const p = new Float64Array(this.N); for (let i = 0; i < this.N; i++) p[i] = this.re[i] ** 2 + this.im[i] ** 2; return p; }
  prob(bits) { const i = typeof bits === 'string' ? parseInt(bits, 2) : bits; return this.re[i] ** 2 + this.im[i] ** 2; }
  norm() { let s = 0; for (let i = 0; i < this.N; i++) s += this.re[i] ** 2 + this.im[i] ** 2; return Math.sqrt(s); }
  /** Apply a 2×2 complex matrix U to qubit q, optionally only where control qubit(s) are 1. */
  apply(U, q, controls = []) {
    const m = this.bit(q), cm = controls.reduce((a, k) => a | this.bit(k), 0), { re, im } = this;
    const [[a, b], [cc, d]] = U;
    for (let i = 0; i < this.N; i++) {
      if (i & m || (i & cm) !== cm) continue; const j = i | m;
      const xr = re[i], xi = im[i], yr = re[j], yi = im[j];
      re[i] = a[0] * xr - a[1] * xi + b[0] * yr - b[1] * yi; im[i] = a[0] * xi + a[1] * xr + b[0] * yi + b[1] * yr;
      re[j] = cc[0] * xr - cc[1] * xi + d[0] * yr - d[1] * yi; im[j] = cc[0] * xi + cc[1] * xr + d[0] * yi + d[1] * yr;
    }
    return this;
  }
  swap(a, b) { const ma = this.bit(a), mb = this.bit(b); for (let i = 0; i < this.N; i++) if (i & ma && !(i & mb)) { const j = (i & ~ma) | mb; [this.re[i], this.re[j]] = [this.re[j], this.re[i]]; [this.im[i], this.im[j]] = [this.im[j], this.im[i]]; } return this; }
  /** Projective measurement of qubit q (collapses): returns 0 or 1. */
  measure(q, rng = Math.random) {
    const m = this.bit(q); let p1 = 0; for (let i = 0; i < this.N; i++) if (i & m) p1 += this.re[i] ** 2 + this.im[i] ** 2;
    const out = rng() < p1 ? 1 : 0, k = 1 / Math.sqrt(out ? p1 : 1 - p1 || 1);
    for (let i = 0; i < this.N; i++) { if (!!(i & m) === !!out) { this.re[i] *= k; this.im[i] *= k; } else { this.re[i] = 0; this.im[i] = 0; } }
    return out;
  }
  /** Sample `shots` full measurements: {counts: {'00': k, …}, freqs: Float64Array}. rng() ∈ [0, 1). */
  sample(shots = 1000, rng = Math.random) {
    const p = this.probs(), cdf = new Float64Array(this.N); let s = 0; for (let i = 0; i < this.N; i++) { s += p[i]; cdf[i] = s; }
    const hits = new Float64Array(this.N);
    for (let k = 0; k < shots; k++) { const u = rng() * s; let lo = 0, hi = this.N - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] > u) hi = m; else lo = m + 1; } hits[lo]++; }
    const counts = {}; hits.forEach((h, i) => { if (h) counts[this.label(i)] = h; });
    return { counts, freqs: hits.map((h) => h / shots), shots };
  }
  /** Reduced density matrix of qubit q: [[ρ00, ρ01], [ρ10, ρ11]] with complex entries [re, im]. */
  rho(q) {
    const m = this.bit(q); let r00 = 0, r11 = 0, xr = 0, xi = 0;
    for (let i = 0; i < this.N; i++) { if (i & m) continue; const j = i | m, ar = this.re[i], ai = this.im[i], br = this.re[j], bi = this.im[j]; r00 += ar * ar + ai * ai; r11 += br * br + bi * bi; xr += ar * br + ai * bi; xi += ai * br - ar * bi; }
    return [[c(r00), c(xr, xi)], [c(xr, -xi), c(r11)]];
  }
  /** Bloch vector [x, y, z] of qubit q (length 1 for a pure product state, < 1 if entangled). */
  bloch(q = 0) { const r = this.rho(q); return [2 * r[0][1][0], -2 * r[0][1][1], r[0][0][0] - r[1][1][0]]; }
  /** Purity tr ρ_q² ∈ [1/2, 1] of qubit q. */
  purity(q = 0) { const [x, y, z] = this.bloch(q); return (1 + x * x + y * y + z * z) / 2; }
  /** von Neumann entropy (bits) of qubit q's reduced state: entanglement entropy for a pure n-qubit state. */
  entropy(q = 0) { const r = Math.min(1, Math.hypot(...this.bloch(q))), h = (p) => (p > 1e-12 ? -p * Math.log2(p) : 0); return h((1 + r) / 2) + h((1 - r) / 2); }
  /** TeX ket expansion, e.g. "\tfrac{1}{\sqrt2}|00\rangle + …" with amplitudes rounded to `digits`. */
  ket(digits = 3, tol = 1e-9) {
    const terms = [];
    for (let i = 0; i < this.N; i++) {
      const re = this.re[i], im = this.im[i]; if (re * re + im * im < tol) continue;
      terms.push([coefTeX(re, im, digits), `|${this.label(i)}\\rangle`]);
    }
    if (!terms.length) return '0';
    return terms.map(([k, b], j) => { const neg = k.startsWith('-'); const kk = neg ? k.slice(1) : k; return (j ? (neg ? ' - ' : ' + ') : neg ? '-' : '') + (kk === '1' ? '' : kk) + b; }).join('');
  }
}
function coefTeX(re, im, d) { // eslint-disable-line no-param-reassign
  const r = (x) => (+x.toFixed(d)).toString(), eps = 0.5 * 10 ** -d;
  if (Math.abs(im) < eps) im = 0; if (Math.abs(re) < eps) re = 0;
  const known = (x) => { const a = Math.abs(x); for (const [v, t] of [[S2, '\\tfrac{1}{\\sqrt2}'], [0.5, '\\tfrac12'], [1, '1'], [Math.sqrt(3) / 2, '\\tfrac{\\sqrt3}{2}']]) if (Math.abs(a - v) < 1e-9) return (x < 0 ? '-' : '') + t; return null; };
  if (Math.abs(im) < 1e-12) return known(re) ?? r(re);
  if (Math.abs(re) < 1e-12) { const k = known(im) ?? r(im); return k === '1' ? 'i' : k === '-1' ? '-i' : k[0] === '-' ? '-i' + k.slice(1) : 'i' + k; }
  return `(${r(re)}${im < 0 ? '-' : '+'}${r(Math.abs(im))}i)`;
}

// ------------------------------------------------------------------ circuit
export class Circuit {
  constructor(n) { if (!(n >= 1 && n <= 6)) throw new Error('quantum.circuit(n): 1 ≤ n ≤ 6 qubits'); this.n = n; this.ops = []; this._cache = new Map(); }
  _push(op) { for (const q of op.q) if (!(q >= 0 && q < this.n)) throw new Error(`quantum: qubit ${q} out of range`); this.ops.push(op); this._cache.clear(); return this; }
  /** Generic gate by name: add('H', [0]), add('Rx', [1], θ), add('CX', [0, 1]). */
  add(g, q, theta) { return this._push({ g, q: [].concat(q), theta }); }
  h(q) { return this.add('H', q); } x(q) { return this.add('X', q); } y(q) { return this.add('Y', q); } z(q) { return this.add('Z', q); }
  s(q) { return this.add('S', q); } sdg(q) { return this.add('Sdg', q); } t(q) { return this.add('T', q); } tdg(q) { return this.add('Tdg', q); }
  rx(t, q) { return this.add('Rx', q, t); } ry(t, q) { return this.add('Ry', q, t); } rz(t, q) { return this.add('Rz', q, t); } p(t, q) { return this.add('P', q, t); }
  cx(ctl, tgt) { return this.add('CX', [ctl, tgt]); } cnot(ctl, tgt) { return this.cx(ctl, tgt); }
  cz(a, b) { return this.add('CZ', [a, b]); } swap(a, b) { return this.add('SWAP', [a, b]); }
  /** Measurement marker(s) for the diagram (simulation keeps the state; use probs()/sample()). No argument = all qubits. */
  measure(q) { for (const k of q == null ? [...Array(this.n).keys()] : [].concat(q)) this._push({ g: 'M', q: [k] }); return this; }
  /** Change the angle of op k (for sliders) — invalidates cached states. */
  setTheta(k, t) { if (this.ops[k] && this.ops[k].theta !== t) { this.ops[k].theta = t; this._cache.clear(); } return this; }
  clear() { this.ops = []; this._cache.clear(); return this; }
  /** Number of unitary steps (measurement markers excluded). */
  get length() { return this.ops.length; }
  /** State after the first k ops (default: all). Cached per prefix. */
  state(k = this.ops.length) {
    k = Math.max(0, Math.min(this.ops.length, k | 0));
    const key = k + '|' + this.ops.slice(0, k).map((o) => o.g + o.q + (o.theta ?? '')).join(';');
    if (this._cache.has(key)) return this._cache.get(key).clone();
    const s = new QState(this.n);
    for (let i = 0; i < k; i++) applyOp(s, this.ops[i]);
    if (this._cache.size > 64) this._cache.clear(); this._cache.set(key, s.clone()); return s;
  }
  probs(k) { return this.state(k).probs(); }
  sample(shots, rng, k) { return this.state(k).sample(shots, rng); }
  /** Column layout for the diagram: [{col, op, k}] and the number of columns. */
  layout() {
    const last = new Array(this.n).fill(-1), out = [];
    this.ops.forEach((op, k) => { const lo = Math.min(...op.q), hi = Math.max(...op.q); let col = 0; for (let q = lo; q <= hi; q++) col = Math.max(col, last[q] + 1); for (let q = lo; q <= hi; q++) last[q] = col; out.push({ col, op, k }); });
    return { items: out, ncols: Math.max(0, ...last.map((x) => x + 1)) };
  }
}
export function applyOp(s, op) {
  const { g, q, theta } = op;
  if (g === 'M' || g === 'I') return s;
  if (g === 'CX') return s.apply(GATES.X(), q[1], [q[0]]);
  if (g === 'CZ') return s.apply(GATES.Z(), q[1], [q[0]]);
  if (g === 'SWAP') return s.swap(q[0], q[1]);
  const G = GATES[g]; if (!G) throw new Error('quantum: unknown gate ' + g);
  return s.apply(G(theta), q[0]);
}
/** Normalise any single-qubit description to a Bloch vector: QState (qubit q), [x,y,z], {theta, phi}, or amplitudes [[re,im],[re,im]]. */
export function toBloch(st, q = 0) {
  if (st instanceof QState) return st.bloch(q);
  if (Array.isArray(st) && st.length === 3 && st.every((x) => typeof x === 'number')) return st;
  if (st && st.theta != null) return [Math.sin(st.theta) * Math.cos(st.phi || 0), Math.sin(st.theta) * Math.sin(st.phi || 0), Math.cos(st.theta)];
  if (Array.isArray(st) && st.length === 2) return QState.from(st).bloch(0);
  throw new Error('quantum.bloch: cannot read the state');
}
/** Pretty angle: multiples of π/4 as TeX-free text (π/2, 3π/4, −π), otherwise 2 decimals. */
export function fmtAngle(t) {
  if (Math.abs(t) < 0.005) return '0';
  const k = t / (Math.PI / 4); if (Math.abs(k - Math.round(k)) < 1e-6) {
    const n = Math.round(k); if (n === 0) return '0'; const g = gcd(Math.abs(n), 4), num = n / g, den = 4 / g;
    return `${num < 0 ? '−' : ''}${Math.abs(num) === 1 ? '' : Math.abs(num)}π${den === 1 ? '' : '/' + den}`;
  }
  return t.toFixed(2).replace('-', '−');
}
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
/** Phase → palette colour around a wheel (0 ↦ blue, π/2 ↦ pink, π ↦ orange, −π/2 ↦ green). */
const WHEEL = ['blue', 'purple', 'pink', 'red', 'orange', 'gold', 'green', 'teal', 'blue'];
export function phaseColor(api, phi) {
  const t = ((phi / TAU) % 1 + 1) % 1 * (WHEEL.length - 1), i = Math.floor(t), f = t - i;
  return api.mix(WHEEL[i], WHEEL[Math.min(WHEEL.length - 1, i + 1)], f);
}

// ================================================================== drawing
const FONT = (size, w = 600) => `${w} ${size}px Inter, system-ui, sans-serif`;
function rr(cx, x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }

/** Bloch sphere on a Stage3D (the stage's own axes are switched off). opts {color, trail, trailColor, angles, project, labels, extra: [{v, color, label}]}. */
function bloch(api, s3, state, o = {}) {
  if (!s3 || typeof s3.project !== 'function') throw new Error('quantum.bloch(stage3d, state): the first argument must be a 3D stage');
  s3.o.axes = false;
  const r = toBloch(state, o.qubit ?? 0), col = o.color || 'accent';
  const cy = Math.cos(s3.yaw), sy = Math.sin(s3.yaw), cp = Math.cos(s3.pitch), sp = Math.sin(s3.pitch);
  const U = [cy, -sy, 0], Up = [sy * sp, cy * sp, cp], D = [sy * cp, cy * cp, -sp];
  const depth = (p) => p[0] * D[0] + p[1] * D[1] + p[2] * D[2];
  const sil = Array.from({ length: 97 }, (_, k) => { const a = TAU * k / 96; return [0, 1, 2].map((i) => Math.cos(a) * U[i] + Math.sin(a) * Up[i]); });
  s3.poly(sil, { fill: 'accent', fillAlpha: 0.045, stroke: false, bias: 50 });
  s3.path(sil, { color: 'muted', width: 1.3, alpha: 0.7, bias: 49 });
  const circle = (f) => { const pts = Array.from({ length: 97 }, (_, k) => f(TAU * k / 96)); for (let k = 0; k < 96; k++) { const m = [(pts[k][0] + pts[k + 1][0]) / 2, (pts[k][1] + pts[k + 1][1]) / 2, (pts[k][2] + pts[k + 1][2]) / 2], back = depth(m) > 0; s3.line(pts[k], pts[k + 1], { color: 'faint', width: back ? 1 : 1.2, alpha: back ? 0.45 : 0.95, bias: back ? 20 : 0 }); } };
  circle((a) => [Math.cos(a), Math.sin(a), 0]); circle((a) => [Math.cos(a), 0, Math.sin(a)]); circle((a) => [0, Math.cos(a), Math.sin(a)]);
  const L = 1.22;
  for (const e of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) s3.line(e.map((x) => -L * x), e.map((x) => L * x), { color: 'faint', width: 1, alpha: 0.9, bias: 5 });
  if (o.labels !== false) {
    const lab = [[[0, 0, 1.36], '|0\\rangle'], [[0, 0, -1.36], '|1\\rangle'], [[1.38, 0, 0], '|{+}\\rangle'], [[-1.38, 0, 0], '|{-}\\rangle'], [[0, 1.38, 0], '|{+i}\\rangle'], [[0, -1.38, 0], '|{-i}\\rangle']];
    for (const [p, t] of lab) s3.tex(t, p, { color: 'muted', size: 13 });
  }
  if (o.trail && o.trail.length > 1) s3.path(o.trail, { color: o.trailColor || 'gold', width: 2.2, alpha: 0.9 });
  for (const e of o.extra || []) { s3.arrow([0, 0, 0], e.v, { color: e.color || 'muted', width: 1.8 }); if (e.label) s3.tex(e.label, e.v.map((x) => x * 1.15), { color: e.color || 'muted', size: 13 }); }
  const len = Math.hypot(...r);
  if (o.project !== false && len > 1e-6) { s3.line(r, [r[0], r[1], 0], { color: 'muted', width: 1, dash: [3, 3] }); s3.line([0, 0, 0], [r[0], r[1], 0], { color: 'muted', width: 1, dash: [3, 3] }); }
  if (o.angles && len > 1e-6) {
    const th = Math.acos(Math.max(-1, Math.min(1, r[2] / len))), ph = Math.atan2(r[1], r[0]), rho = [Math.cos(ph), Math.sin(ph), 0], R = 0.32;
    s3.curve((u) => [R * Math.sin(u) * rho[0], R * Math.sin(u) * rho[1], R * Math.cos(u)], 0, th, { color: 'orange', width: 1.6, n: 30 });
    s3.tex('\\theta', [R * 1.45 * Math.sin(th / 2) * rho[0], R * 1.45 * Math.sin(th / 2) * rho[1], R * 1.45 * Math.cos(th / 2)], { color: 'orange', size: 13 });
    if (Math.hypot(r[0], r[1]) > 0.05 * len) { s3.curve((u) => [0.26 * Math.cos(u), 0.26 * Math.sin(u), 0], 0, ph, { color: 'purple', width: 1.6, n: 30 }); s3.tex('\\varphi', [0.4 * Math.cos(ph / 2), 0.4 * Math.sin(ph / 2), 0], { color: 'purple', size: 13 }); }
  }
  if (len > 1e-6) s3.arrow([0, 0, 0], r, { color: col, width: 2.8, head: 11 });
  s3.dot(r, { color: col, r: len > 1e-6 ? 4.5 : 5.5 });
  s3.dot([0, 0, 0], { color: 'muted', r: 2.2, ring: false });
  return { vector: r, length: len, theta: Math.acos(Math.max(-1, Math.min(1, r[2] / (len || 1)))), phi: Math.atan2(r[1], r[0]) };
}

const PICK = new WeakMap();
/**
 * Circuit diagram on a 2D stage (create it with axes: false). opts {step (ops applied; that column is highlighted),
 * labels: ['q_0', …] (TeX), init: '0', highlight colour, onPick(k) (click a gate → k + 1)}. → layout {x: [col centres], pick(px, py)}.
 */
function diagram(api, s, qc, o = {}) {
  const cx = s.ctx, W = s.W, H = s.H, n = qc.n, { items, ncols } = qc.layout();
  const left = o.left ?? 64, right = o.right ?? 18, top = o.top ?? 18, bottom = o.bottom ?? 18;
  const dy = Math.min(o.wireGap ?? 56, (H - top - bottom) / Math.max(1, n)), y0 = top + (H - top - bottom - dy * n) / 2 + dy / 2;
  const colW = Math.min(o.colWidth ?? 70, (W - left - right) / Math.max(1, ncols)), x0 = left + colW / 2;
  const X = (col) => x0 + col * colW, Y = (q) => y0 + q * dy, step = o.step ?? qc.ops.length;
  const ink = api.color('ink'), muted = api.color('muted'), panel = api.color('panel');
  // highlight band for the column of the last applied op
  const cur = step > 0 && items[step - 1] ? items[step - 1].col : null;
  if (cur != null) { rr(cx, X(cur) - colW / 2 + 4, Y(0) - dy / 2 + 4, colW - 8, dy * n - 8, 10); cx.fillStyle = api.color(o.highlight || 'gold', 0.16); cx.fill(); }
  // wires
  cx.save(); cx.strokeStyle = muted; cx.lineWidth = 1.4;
  const xEnd = o.wireEnd === 'full' ? W - right + 6 : Math.min(W - right + 6, X(Math.max(0, ncols - 1)) + colW * 0.5 + 24);
  for (let q = 0; q < n; q++) { cx.beginPath(); cx.moveTo(left - 8, Y(q)); cx.lineTo(xEnd, Y(q)); cx.stroke(); }
  cx.restore();
  for (let q = 0; q < n; q++) s.texPx(`${o.labels ? String(o.labels[q]).replace(/^\$+|\$+$/g, '') : `q_${q}`}\\ |${o.init?.[q] ?? '0'}\\rangle`, left - 12, Y(q), { align: 'right', color: 'ink', size: 14 });
  const boxes = [];
  items.forEach(({ col, op, k }) => {
    const done = k < step, alpha = done ? 1 : 0.38, x = X(col);
    cx.save(); cx.globalAlpha = alpha; cx.lineWidth = 1.8;
    const line = (qa, qb) => { cx.beginPath(); cx.moveTo(x, Y(qa)); cx.lineTo(x, Y(qb)); cx.strokeStyle = ink; cx.stroke(); };
    const dot = (q) => { cx.beginPath(); cx.arc(x, Y(q), 5, 0, TAU); cx.fillStyle = ink; cx.fill(); };
    if (op.g === 'CX') {
      line(op.q[0], op.q[1]); dot(op.q[0]); const ty = Y(op.q[1]);
      cx.beginPath(); cx.arc(x, ty, 11, 0, TAU); cx.fillStyle = panel; cx.fill(); cx.strokeStyle = ink; cx.stroke();
      cx.beginPath(); cx.moveTo(x - 11, ty); cx.lineTo(x + 11, ty); cx.moveTo(x, ty - 11); cx.lineTo(x, ty + 11); cx.stroke();
    } else if (op.g === 'CZ') { line(op.q[0], op.q[1]); dot(op.q[0]); dot(op.q[1]); }
    else if (op.g === 'SWAP') {
      line(op.q[0], op.q[1]); cx.strokeStyle = ink;
      for (const q of op.q) { cx.beginPath(); cx.moveTo(x - 7, Y(q) - 7); cx.lineTo(x + 7, Y(q) + 7); cx.moveTo(x + 7, Y(q) - 7); cx.lineTo(x - 7, Y(q) + 7); cx.stroke(); }
    } else if (op.g === 'M') {
      const y = Y(op.q[0]), w = 34, h = 28; rr(cx, x - w / 2, y - h / 2, w, h, 5); cx.fillStyle = panel; cx.fill(); cx.strokeStyle = ink; cx.stroke();
      cx.beginPath(); cx.arc(x, y + 7, 11, Math.PI * 1.15, Math.PI * 1.85); cx.stroke(); cx.beginPath(); cx.moveTo(x, y + 7); cx.lineTo(x + 8, y - 7); cx.stroke();
    } else {
      const y = Y(op.q[0]), param = op.theta != null, w = param ? Math.min(colW - 8, 50) : 34, h = param ? 38 : 32;
      rr(cx, x - w / 2, y - h / 2, w, h, 6); cx.fillStyle = panel; cx.fill(); cx.fillStyle = api.color(o.gateColor || 'accent', 0.13); cx.fill(); cx.strokeStyle = api.color(o.gateColor || 'accent'); cx.stroke();
      cx.fillStyle = ink; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      const name = LABEL[op.g] || op.g, by = param ? y - 6 : y;
      if (name.length === 2 && name[0] === 'R') { cx.font = FONT(15); const wR = cx.measureText('R').width; cx.fillText('R', x - 3, by); cx.font = FONT(10.5); cx.fillText(name[1], x - 3 + wR / 2 + 3.5, by + 4); }
      else { cx.font = FONT(15); cx.fillText(name, x, by); }
      if (param) { cx.font = FONT(10.5, 500); cx.fillStyle = muted; cx.fillText(fmtAngle(op.theta), x, y + 10); }
    }
    cx.restore();
    boxes.push({ k, x, y0: Y(Math.min(...op.q)) - 18, y1: Y(Math.max(...op.q)) + 18 });
  });
  const L = { x: Array.from({ length: ncols }, (_, i) => X(i)), y: Array.from({ length: n }, (_, q) => Y(q)), colWidth: colW,
    pick(px, py) { const b = boxes.find((b) => Math.abs(px - b.x) < colW / 2 && py >= b.y0 - 10 && py <= b.y1 + 10); return b ? b.k : null; } };
  if (o.onPick) {
    let rec = PICK.get(s); if (!rec) { rec = {}; PICK.set(s, rec); s.onClick((x, y) => { const k = rec.L?.pick(s.X(x), s.Y(y)); if (k != null) rec.cb?.(k + 1); }); }
    rec.L = L; rec.cb = o.onPick;
  }
  return L;
}

/**
 * Amplitude / probability bars of a state on a 2D stage (axes: false). Bar colour = phase (wheel inset), height = |a|² (mode 'prob',
 * default) or |a| (mode 'amp'). opts {counts: sample result or freqs to overlay as hollow markers, values (print numbers), wheel}.
 */
function amplitudes(api, s, st, o = {}) {
  const cx = s.ctx, W = s.W, H = s.H, N = st.N, mode = o.mode || 'prob';
  const left = 40, right = o.wheel === false ? 12 : 58, top = 16, bottom = st.n > 4 ? 40 : 28;
  const ph = H - top - bottom, bw = (W - left - right) / N, base = H - bottom, Y = (v) => base - v * ph;
  cx.save(); cx.font = FONT(10.5, 500); cx.textAlign = 'right'; cx.textBaseline = 'middle';
  for (const v of [0, 0.25, 0.5, 0.75, 1]) { cx.strokeStyle = api.color(v ? 'grid' : 'faint'); cx.lineWidth = 1; cx.beginPath(); cx.moveTo(left, Math.round(Y(v)) + 0.5); cx.lineTo(W - right, Math.round(Y(v)) + 0.5); cx.stroke(); cx.fillStyle = api.color('muted'); cx.fillText(String(v), left - 6, Y(v)); }
  cx.save(); cx.translate(11, top + ph / 2); cx.rotate(-Math.PI / 2); cx.textAlign = 'center'; cx.fillText(mode === 'prob' ? 'probability |a|²' : 'amplitude |a|', 0, 0); cx.restore();
  const freqs = o.counts ? (o.counts.freqs || o.counts) : null;
  const every = Math.max(1, Math.ceil(N / Math.max(1, Math.floor((W - left - right) / 30))));
  for (let i = 0; i < N; i++) {
    const a = st.amp(i), v = mode === 'prob' ? a.abs ** 2 : a.abs, x = left + i * bw, w = Math.max(2, bw * 0.68), xc = x + bw / 2;
    if (v > 1e-12) { rr(cx, xc - w / 2, Y(v), w, base - Y(v), Math.min(4, w / 3)); cx.fillStyle = phaseColor(api, a.arg); cx.globalAlpha = 0.88; cx.fill(); cx.globalAlpha = 1; }
    if (freqs && freqs[i] > 0) { const fy = Y(mode === 'prob' ? freqs[i] : Math.sqrt(freqs[i])); cx.strokeStyle = api.color('ink'); cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(xc - w / 2 - 2, fy); cx.lineTo(xc + w / 2 + 2, fy); cx.stroke(); }
    if (o.values !== false && v > 0.005 && bw > 26) { cx.fillStyle = api.color('ink'); cx.textAlign = 'center'; cx.textBaseline = 'bottom'; cx.font = FONT(10.5, 600); cx.fillText(v.toFixed(v > 0.995 ? 0 : 3).replace(/0+$/, '').replace(/\.$/, ''), xc, Y(v) - 3); }
    if (i % every === 0) {
      cx.fillStyle = api.color('muted'); cx.font = `500 ${N > 16 ? 9.5 : 11.5}px "JetBrains Mono", ui-monospace, monospace`; cx.textBaseline = 'top'; cx.textAlign = 'center';
      if (st.n > 4) { cx.save(); cx.translate(xc, base + 4); cx.rotate(-Math.PI / 4); cx.textAlign = 'right'; cx.textBaseline = 'middle'; cx.fillText(st.label(i), 0, 0); cx.restore(); }
      else cx.fillText(`|${st.label(i)}⟩`, xc, base + 6);
    }
  }
  if (o.wheel !== false) {
    const R = 15, wx = W - right / 2 - 2, wy = top + R + 6;
    // canvas angles grow clockwise on screen, phases counter-clockwise: phase φ sits at canvas angle −φ
    for (let k = 0; k < 48; k++) { cx.beginPath(); cx.arc(wx, wy, R, -(k + 0.6) / 48 * TAU, -(k - 0.6) / 48 * TAU, false); cx.lineWidth = 6; cx.strokeStyle = phaseColor(api, k / 48 * TAU); cx.stroke(); }
    cx.fillStyle = api.color('muted'); cx.font = FONT(9.5, 500); cx.textAlign = 'center'; cx.textBaseline = 'top'; cx.fillText('phase', wx, wy + R + 6);
    cx.textBaseline = 'middle'; cx.fillText('0', wx + R + 9, wy); cx.fillText('π', wx - R - 8, wy);
  }
  cx.restore();
  return { barWidth: bw, left };
}

// ================================================================== namespace
/** v.quantum() → namespace; v.quantum('bloch', …) → call one helper directly. */
export default function quantum(api, rt, name, ...args) {
  const ns = {
    circuit: (n) => new Circuit(n),
    ket: (bits) => QState.ket(bits),
    state: (amps) => QState.from(amps),
    bloch: (s3, st, o) => bloch(api, s3, st, o),
    diagram: (s, qc, o) => diagram(api, s, qc, o),
    amplitudes: (s, st, o) => amplitudes(api, s, st, o),
    phaseColor: (phi) => phaseColor(api, phi),
    toBloch, fmtAngle, GATES, Circuit, QState,
  };
  if (name == null) return ns;
  if (!(name in ns)) throw new Error(`v.quantum('${name}'): unknown helper (have ${Object.keys(ns).join(', ')})`);
  return typeof ns[name] === 'function' && !/^[A-Z]/.test(name) ? ns[name](...args) : ns[name];
}
