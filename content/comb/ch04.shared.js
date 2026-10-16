// Combinatorics — Chapter 4: helpers shared by ch04.js and ch04-b.js (plain named exports).
//
// Power series are plain arrays of Numbers (index = exponent) truncated at a given length N; every
// operation is computed from the definition (convolution, the recurrence for 1/A, Horner for A∘B, the
// recurrence for exp), never from a closed form, so that a closed form in a readout is a real check.
import { binom, fact } from './ch03.shared.js';
export * from './ch03.shared.js';

// ------------------------------------------------------------------ truncated power series
export const sZero = (N) => Array(N).fill(0);
export function sMul(a, b, N = Math.min(a.length, b.length)) {
  const r = sZero(N);
  for (let i = 0; i < N; i++) { if (!a[i]) continue; for (let j = 0; i + j < N; j++) r[i + j] += a[i] * (b[j] || 0); }
  return r;
}
/** 1/A for a_0 ≠ 0: b_n = −(Σ_{k≥1} a_k b_{n−k}) / a_0. */
export function sInv(a, N = a.length) {
  const b = sZero(N);
  b[0] = 1 / a[0];
  for (let n = 1; n < N; n++) { let s = 0; for (let k = 1; k <= n; k++) s += (a[k] || 0) * b[n - k]; b[n] = -s / a[0]; }
  return b;
}
/** A(B(x)) for b_0 = 0, by Horner: a_0 + B(a_1 + B(a_2 + …)). */
export function sCompose(a, b, N = a.length) {
  let r = sZero(N);
  for (let k = Math.min(a.length, N) - 1; k >= 0; k--) { r = sMul(r, b, N); r[0] += a[k]; }
  return r;
}
/** exp(B) for b_0 = 0, from A' = B'A: n a_n = Σ_{k=1}^n k b_k a_{n−k}. */
export function sExp(b, N = b.length) {
  const a = sZero(N); a[0] = 1;
  for (let n = 1; n < N; n++) { let s = 0; for (let k = 1; k <= n; k++) s += k * (b[k] || 0) * a[n - k]; a[n] = s / n; }
  return a;
}
export function sPow(a, m, N = a.length) { let r = sZero(N); r[0] = 1; for (let i = 0; i < m; i++) r = sMul(r, a, N); return r; }
export const sTrunc = (a, N) => Array.from({ length: N }, (_, i) => a[i] || 0);
/** Coefficients of P(x)/Q(x) (Q[0] ≠ 0) by long division: q_0 a_n = p_n − Σ_{k≥1} q_k a_{n−k}. */
export function ratCoeffs(P, Q, N) {
  const a = [];
  for (let n = 0; n < N; n++) { let s = P[n] || 0; for (let k = 1; k <= Math.min(n, Q.length - 1); k++) s -= Q[k] * a[n - k]; a.push(s / Q[0]); }
  return a;
}
/** Number of terms to decimals: integers exact, others 3 significant digits. */
export function numStr(x) {
  if (!isFinite(x)) return '∞';
  if (Math.abs(x - Math.round(x)) < 1e-9 * Math.max(1, Math.abs(x))) return String(Math.round(x)).replace('-', '−');
  const s = Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3 ? x.toExponential(2) : String(+x.toPrecision(3));
  return s.replace('-', '−');
}
/** Simple rational TeX for small denominators (1/2, 5/6, …), else a decimal. */
export function fracTex(x) {
  if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
  for (let d = 2; d <= 720; d++) { const nn = x * d; if (Math.abs(nn - Math.round(nn)) < 1e-9) return `${nn < 0 ? '-' : ''}\\frac{${Math.abs(Math.round(nn))}}{${d}}`; }
  return String(+x.toPrecision(3));
}

// ------------------------------------------------------------------ BigInt sequences
export const bigFact = (n) => { let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i; return r; };
export function catalanBig(N) { const c = [1n]; for (let n = 0; n < N; n++) c.push((c[n] * BigInt(2 * (2 * n + 1))) / BigInt(n + 2)); return c; }
export function motzkinBig(N) { const m = [1n, 1n]; for (let n = 1; n < N; n++) m.push((BigInt(2 * n + 3) * m[n] + BigInt(3 * n) * m[n - 1]) / BigInt(n + 2)); return m; }
export function fibBig(N) { const f = [0n, 1n]; for (let i = 2; i <= N; i++) f.push(f[i - 1] + f[i - 2]); return f; }
/** Number of partitions p(0..N) by Euler's pentagonal recurrence. */
export function partitionsBig(N) {
  const p = [1n];
  for (let n = 1; n <= N; n++) {
    let s = 0n;
    for (let k = 1; ; k++) {
      const g1 = (k * (3 * k - 1)) / 2, g2 = (k * (3 * k + 1)) / 2;
      if (g1 > n) break;
      const sg = k % 2 ? 1n : -1n; s += sg * p[n - g1]; if (g2 <= n) s += sg * p[n - g2];
    }
    p.push(s);
  }
  return p;
}
export const bigToNum = (b) => Number(b);
/** log of a positive BigInt without overflow. */
export function bigLog(b) { const s = b.toString(); if (s.length < 300) return Math.log(Number(b)); return Math.log(Number(s.slice(0, 15))) + (s.length - 15) * Math.LN10; }

// ------------------------------------------------------------------ trees and graphs
export const circlePts = (n, R = 1, a0 = Math.PI / 2) => Array.from({ length: n }, (_, i) => [R * Math.cos(a0 - (2 * Math.PI * i) / n), R * Math.sin(a0 - (2 * Math.PI * i) / n)]);
export class DSU {
  constructor(n) { this.p = Array.from({ length: n }, (_, i) => i); }
  find(x) { while (this.p[x] !== x) { this.p[x] = this.p[this.p[x]]; x = this.p[x]; } return x; }
  union(a, b) { a = this.find(a); b = this.find(b); if (a === b) return false; this.p[a] = b; return true; }
}
/** Prüfer encoding of a labelled tree (0-based vertices, edges [a,b]): repeatedly delete the smallest leaf. Returns {code, leaves} (leaf removed at each step) and the final edge. */
export function pruferEncode(n, edges) {
  const adj = Array.from({ length: n }, () => new Set());
  edges.forEach(([a, b]) => { adj[a].add(b); adj[b].add(a); });
  const code = [], leaves = [];
  for (let t = 0; t < n - 2; t++) {
    let leaf = -1; for (let i = 0; i < n; i++) if (adj[i].size === 1) { leaf = i; break; }
    const nb = [...adj[leaf]][0]; code.push(nb); leaves.push(leaf); adj[leaf].delete(nb); adj[nb].delete(leaf);
  }
  const rest = []; for (let i = 0; i < n; i++) if (adj[i].size === 1) rest.push(i);
  return { code, leaves, last: rest };
}
/** Decoding: for each code letter, join the smallest vertex not occurring later in the code (and not yet used) to it; the last edge joins the two remaining. */
export function pruferDecode(n, code) {
  const deg = Array(n).fill(1); code.forEach((c) => deg[c]++);
  const edges = [], leaves = [];
  for (const c of code) {
    let leaf = -1; for (let i = 0; i < n; i++) if (deg[i] === 1) { leaf = i; break; }
    edges.push([leaf, c]); leaves.push(leaf); deg[leaf]--; deg[c]--;
  }
  const rest = []; for (let i = 0; i < n; i++) if (deg[i] === 1) rest.push(i);
  edges.push(rest.slice(0, 2));
  return { edges, leaves };
}
export const edgeKey = ([a, b]) => (a < b ? `${a}-${b}` : `${b}-${a}`);
