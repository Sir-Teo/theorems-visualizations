// Quantum Information & Computation — Chapter 4: helpers shared by ch04.js and ch04-b.js.
// Re-exports the chapter-3 helpers (which re-export chapters 2 and 1). New here: SU(2) as unit quaternions (single-qubit gates
// up to global phase), the Clifford+T net and Solovay–Kitaev recursion, Pauli-string algebra on complex matrices, and the
// Aaronson–Gottesman stabilizer tableau.
export * from './ch03.shared.js';
import { cmul, cadd, cabs2, mmul, adj, cplx, GATE } from './ch03.shared.js';

// ------------------------------------------------------------------ SU(2) / SO(3) by unit quaternions [w, x, y, z]
export const qmul = (a, b) => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
export const qconj = (a) => [a[0], -a[1], -a[2], -a[3]];
export const qnorm = (a) => { const n = Math.hypot(...a) || 1; return a.map((x) => x / n); };
/** Rotation by angle th about the unit axis n. */
export const qrot = (n, th) => { const L = Math.hypot(...n) || 1, s = Math.sin(th / 2) / L; return [Math.cos(th / 2), n[0] * s, n[1] * s, n[2] * s]; };
/** Euclidean distance between the unit quaternions q and ±p: equals the operator-norm distance of the SU(2) matrices, minimised over the global sign. */
export const qdist = (a, b) => { let d1 = 0, d2 = 0; for (let i = 0; i < 4; i++) { d1 += (a[i] - b[i]) ** 2; d2 += (a[i] + b[i]) ** 2; } return Math.sqrt(Math.min(d1, d2)); };
/** Rotate a 3-vector by the rotation q. */
export function qapply(q, p) { const r = qmul(qmul(q, [0, p[0], p[1], p[2]]), qconj(q)); return [r[1], r[2], r[3]]; }
/** Angle and axis of q (angle in [0, π] after fixing the sign so that w ≥ 0). */
export function qangleAxis(q) {
  const s = q[0] < 0 ? -1 : 1, w = Math.min(1, s * q[0]), v = [s * q[1], s * q[2], s * q[3]], sn = Math.hypot(...v);
  return { angle: 2 * Math.atan2(sn, w), axis: sn > 0 ? v.map((x) => x / sn) : [0, 0, 1] };
}
/** The gates H, T, T† (and S) as rotations of the Bloch sphere. */
export const QG = {
  H: [0, Math.SQRT1_2, 0, Math.SQRT1_2],
  T: qrot([0, 0, 1], Math.PI / 4), t: qrot([0, 0, 1], -Math.PI / 4),
  S: qrot([0, 0, 1], Math.PI / 2), s: qrot([0, 0, 1], -Math.PI / 2),
};
export const qkey = (q) => { let s = 1; for (const x of q) { if (Math.abs(x) > 1e-9) { s = x < 0 ? -1 : 1; break; } } return q.map((x) => Math.round(s * x * 1e6) / 1e6 + 0).join(','); };

// ------------------------------------------------------------------ words in {H, T, t} (t = T†)
export const GL = { H: 'H', T: 'T', t: 'T†', S: 'S', s: 'S†' };
const INV = { H: 'H', T: 't', t: 'T', S: 's', s: 'S' };
/** Free reduction: cancel adjacent g g^{-1} (and HH). */
export function reduceWord(w) { const out = []; for (const g of w) { if (out.length && INV[out[out.length - 1]] === g) out.pop(); else out.push(g); } return out; }
export const wordInv = (w) => w.slice().reverse().map((g) => INV[g]);
/** Quaternion of the matrix product g1 g2 … gk (so gk acts first). */
export function wordQ(w) { let q = [1, 0, 0, 0]; for (const g of w) q = qmul(q, QG[g]); return q; }
/** Net of all distinct rotations reachable by words in {H, T, T†} of length ≤ L (shortest word kept). */
const netCache = new Map();
export function buildNet(L) {
  if (netCache.has(L)) return netCache.get(L);
  const seen = new Map(), start = { q: [1, 0, 0, 0], w: [] }; seen.set(qkey(start.q), start);
  let frontier = [start];
  for (let l = 1; l <= L; l++) {
    const next = [];
    for (const e of frontier) for (const g of ['H', 'T', 't']) {
      if (e.w.length && INV[e.w[e.w.length - 1]] === g) continue;
      const q = qmul(e.q, QG[g]), k = qkey(q); if (seen.has(k)) continue;
      const ne = { q, w: [...e.w, g] }; seen.set(k, ne); next.push(ne);
    }
    frontier = next;
  }
  const net = [...seen.values()]; netCache.set(L, net); return net;
}
export function nearestInNet(net, q) { let best = null, bd = 9; for (const e of net) { const d = qdist(e.q, q); if (d < bd) { bd = d; best = e; } } return best; }

/** Balanced group commutator: unit quaternions V, W with V W V† W† = D (Dawson–Nielsen). */
export function groupCommutator(D) {
  const { angle: phi, axis } = qangleAxis(D);
  const k = Math.sin(phi / 2) ** 2, u = k / (2 * (1 + Math.sqrt(Math.max(0, 1 - k)))), a = Math.sqrt(u), th = 2 * Math.asin(Math.min(1, Math.sqrt(a)));
  const V = qrot([1, 0, 0], th), W = qrot([0, 1, 0], th), C = qmul(qmul(V, W), qmul(qconj(V), qconj(W)));
  const ax = qangleAxis(C).axis, dot = ax[0] * axis[0] + ax[1] * axis[1] + ax[2] * axis[2];
  const cr = [ax[1] * axis[2] - ax[2] * axis[1], ax[2] * axis[0] - ax[0] * axis[2], ax[0] * axis[1] - ax[1] * axis[0]];
  let S;
  if (Math.hypot(...cr) < 1e-14) S = dot > 0 ? [1, 0, 0, 0] : qrot(Math.abs(ax[0]) < .9 ? [0,-ax[2],ax[1]] : [-ax[2],0,ax[0]],Math.PI);
  else S = qrot(cr, Math.acos(Math.max(-1, Math.min(1, dot))));
  return { V: qmul(qmul(S, V), qconj(S)), W: qmul(qmul(S, W), qconj(S)), theta: th, phi };
}
/** Solovay–Kitaev recursion. Returns {q, word, trace: [{n, err, len}]}. */
export function solovayKitaev(net, U, depth) {
  const rec = (Uq, n) => {
    if (n === 0) { const e = nearestInNet(net, Uq); return { q: e.q, w: e.w.slice() }; }
    const P = rec(Uq, n - 1), D = qmul(Uq, qconj(P.q)), { V, W } = groupCommutator(D);
    const Vp = rec(V, n - 1), Wp = rec(W, n - 1);
    const w = reduceWord([...Vp.w, ...Wp.w, ...wordInv(Vp.w), ...wordInv(Wp.w), ...P.w]);
    return { q: wordQ(w), w };
  };
  const trace = []; for (let n = 0; n <= depth; n++) { const r = rec(U, n); trace.push({ n, err: qdist(r.q, U), len: r.w.length, word: r.w }); }
  return trace;
}

// ------------------------------------------------------------------ complex matrices (arrays of rows of [re, im]) and Pauli strings
export const kronC = (A, B) => { const n = A.length, m = B.length, R = Array.from({ length: n * m }, () => Array.from({ length: n * m }, () => [0, 0]));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < m; k++) for (let l = 0; l < m; l++) R[i * m + k][j * m + l] = cmul(A[i][j], B[k][l]); return R; };
export const traceC = (A) => A.reduce((s, r, i) => cadd(s, r[i]), [0, 0]);
export const PAULI4 = { I: GATE.I(), X: GATE.X(), Y: GATE.Y(), Z: GATE.Z() };
/** 2^n × 2^n matrix of the Pauli string such as 'XZ'. */
export function pauliMat(str) { let M = cplx([[1]]); for (const ch of str) M = kronC(M, PAULI4[ch]); return M; }
export const PAULI_STRINGS2 = (() => { const out = []; for (const a of 'IXYZ') for (const b of 'IXYZ') out.push(a + b); return out; })();
/** Decompose a 2-qubit matrix M = Σ c_P P in the Pauli basis (c_P = tr(P M)/4). */
export function pauliDecompose(M) {
  const out = [];
  for (const s of PAULI_STRINGS2) { const c = traceC(mmul(pauliMat(s), M)); const z = [c[0] / 4, c[1] / 4]; if (cabs2(z) > 1e-12) out.push({ s, c: z }); }
  return out;
}
/** 4×4 matrices of the 2-qubit gates used in the Clifford table. */
export function gate2(name) {
  const I = GATE.I(), one = (g, q) => (q === 0 ? kronC(GATE[g](), I) : kronC(I, GATE[g]()));
  if (name === 'CX01') return cplx([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]]);
  if (name === 'CX10') return cplx([[1, 0, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0], [0, 1, 0, 0]]);
  if (name === 'CZ') return cplx([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, -1]]);
  return one(name[0], +name[1]);
}
export const conjugate = (U, P) => mmul(U, mmul(P, adj(U)));

// ------------------------------------------------------------------ Aaronson–Gottesman stabilizer tableau (CHP)
export class Tableau {
  constructor(n) {
    this.n = n; const R = 2 * n + 1;
    this.x = Array.from({ length: R }, () => new Uint8Array(n)); this.z = Array.from({ length: R }, () => new Uint8Array(n)); this.r = new Uint8Array(R);
    for (let i = 0; i < n; i++) { this.x[i][i] = 1; this.z[n + i][i] = 1; }
  }
  clone() { const t = new Tableau(this.n); t.x = this.x.map((a) => a.slice()); t.z = this.z.map((a) => a.slice()); t.r = this.r.slice(); return t; }
  h(a) { for (let i = 0; i < 2 * this.n; i++) { this.r[i] ^= this.x[i][a] & this.z[i][a]; const t = this.x[i][a]; this.x[i][a] = this.z[i][a]; this.z[i][a] = t; } }
  s(a) { for (let i = 0; i < 2 * this.n; i++) { this.r[i] ^= this.x[i][a] & this.z[i][a]; this.z[i][a] ^= this.x[i][a]; } }
  cx(a, b) { for (let i = 0; i < 2 * this.n; i++) { this.r[i] ^= this.x[i][a] & this.z[i][b] & (this.x[i][b] ^ this.z[i][a] ^ 1); this.x[i][b] ^= this.x[i][a]; this.z[i][a] ^= this.z[i][b]; } }
  rowsum(h, i) {
    const n = this.n; let e = 2 * this.r[h] + 2 * this.r[i];
    for (let j = 0; j < n; j++) {
      const x1 = this.x[i][j], z1 = this.z[i][j], x2 = this.x[h][j], z2 = this.z[h][j];
      if (x1 && z1) e += z2 - x2; else if (x1) e += z2 * (2 * x2 - 1); else if (z1) e += x2 * (1 - 2 * z2);
    }
    this.r[h] = ((e % 4) + 4) % 4 === 2 ? 1 : 0;
    for (let j = 0; j < n; j++) { this.x[h][j] ^= this.x[i][j]; this.z[h][j] ^= this.z[i][j]; }
  }
  /** Measure qubit a in the Z basis; `coin` is a function returning 0 or 1 for a random outcome. Returns {bit, random}. */
  measure(a, coin) {
    const n = this.n; let p = -1;
    for (let i = n; i < 2 * n; i++) if (this.x[i][a]) { p = i; break; }
    if (p >= 0) {
      for (let i = 0; i < 2 * n; i++) if (i !== p && this.x[i][a]) this.rowsum(i, p);
      this.x[p - n] = this.x[p].slice(); this.z[p - n] = this.z[p].slice(); this.r[p - n] = this.r[p];
      this.x[p].fill(0); this.z[p].fill(0); this.z[p][a] = 1; this.r[p] = coin(); return { bit: this.r[p], random: true };
    }
    const s = 2 * n; this.x[s].fill(0); this.z[s].fill(0); this.r[s] = 0;
    for (let i = 0; i < n; i++) if (this.x[i][a]) this.rowsum(s, i + n);
    return { bit: this.r[s], random: false };
  }
  /** Stabilizer generators as strings such as '+XZI'. */
  stabilizers() {
    const out = [];
    for (let i = this.n; i < 2 * this.n; i++) { let s = this.r[i] ? '−' : '+'; for (let j = 0; j < this.n; j++) s += 'IXZY'[this.x[i][j] + 2 * this.z[i][j] === 3 ? 3 : this.x[i][j] + 2 * this.z[i][j]]; out.push(s); }
    return out;
  }
}
