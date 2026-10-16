// Combinatorics — Chapter 2: helpers shared by ch02.js and ch02-b.js (plain named exports).
//
// Permutations are 0-indexed arrays w (w[i] = image of i, or the i-th letter of the one-line word) and
// are displayed 1-indexed. Statistics (inv, des, maj, cycles, records) are computed from the definitions;
// every histogram in the chapter is a tally over all n! permutations, never a formula.
import { CAT, cyclesOf, perms, fact, binom } from './ch01.shared.js';
export * from './ch01.shared.js';

const permCache = new Map();
/** All permutations of {0,…,n−1} (cached), as one-line arrays in lexicographic order. */
export function allPerms(n) {
  if (!permCache.has(n)) permCache.set(n, perms(Array.from({ length: n }, (_, i) => i)));
  return permCache.get(n);
}
export const range = (n) => Array.from({ length: n }, (_, i) => i);

// ------------------------------------------------------------------ statistics
export function inversions(w) { let c = 0; for (let i = 0; i < w.length; i++) for (let j = i + 1; j < w.length; j++) if (w[i] > w[j]) c++; return c; }
/** Descent positions i (0-based: w[i] > w[i+1]). */
export const descentSet = (w) => { const d = []; for (let i = 0; i + 1 < w.length; i++) if (w[i] > w[i + 1]) d.push(i); return d; };
export const des = (w) => descentSet(w).length;
/** Major index: sum of the (1-based) descent positions. */
export const maj = (w) => descentSet(w).reduce((a, i) => a + i + 1, 0);
export const cycleCount = (p) => cyclesOf(p).length;
/** Indices of left-to-right maxima (records). */
export function lrMaxima(w) { const r = []; let m = -1; w.forEach((x, i) => { if (x > m) { m = x; r.push(i); } }); return r; }
export const sgn = (w) => (inversions(w) % 2 ? -1 : 1);
export const lcmAll = (a) => { const g = (x, y) => (y ? g(y, x % y) : x); return a.reduce((l, x) => (l * x) / g(l, x), 1); };

// ------------------------------------------------------------------ display
/** One-line word, 1-indexed; spaces when some entry has two digits. */
export const wordStr = (w) => (w.length > 9 ? w.map((x) => x + 1).join(' ') : w.map((x) => x + 1).join(''));
/** "(1 5 3)(2)" for a list of cycles (0-indexed in, 1-indexed out). */
export const cycStr = (cs) => cs.map((c) => '(' + c.map((x) => x + 1).join(' ') + ')').join('');
export const cycTex = (cs) => cs.map((c) => '(' + c.map((x) => x + 1).join('\\,') + ')').join('');
/** Cycle type as a partition, longest first. */
export const cycleType = (p) => cyclesOf(p).map((c) => c.length).sort((a, b) => b - a);
export const shuffled = (rng, n) => rng.shuffle(range(n));

// ------------------------------------------------------------------ polynomials in q (arrays of coefficients, ascending)
export function polyMul(a, b) { const r = Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; }
export function polyAdd(a, b) { const r = Array(Math.max(a.length, b.length)).fill(0); a.forEach((x, i) => { r[i] += x; }); b.forEach((x, i) => { r[i] += x; }); return r; }
export const polyEval = (a, q) => a.reduceRight((s, c) => s * q + c, 0);
/** [m]_q = 1 + q + … + q^{m−1}. */
export const qInt = (m) => Array(Math.max(m, 0)).fill(1);
/** [n]_q! as a coefficient array. */
export function qFactPoly(n) { let r = [1]; for (let i = 1; i <= n; i++) r = polyMul(r, qInt(i)); return r; }
/** Gaussian binomial by [n,k] = [n−1,k−1] + q^k [n−1,k]. */
export function qBinomPoly(n, k) {
  if (k < 0 || k > n) return [0];
  const T = Array.from({ length: n + 1 }, () => Array(n + 1).fill(null));
  const go = (a, b) => {
    if (b < 0 || b > a) return [0];
    if (b === 0 || b === a) return [1];
    if (T[a][b]) return T[a][b];
    const shifted = Array(b).fill(0).concat(go(a - 1, b));
    return (T[a][b] = polyAdd(go(a - 1, b - 1), shifted));
  };
  return go(n, k);
}
/** TeX for a polynomial in q (highest power first when `desc`), at most `max` terms, then an ellipsis. */
export function polyTex(a, { max = 7, desc = false } = {}) {
  const terms = [];
  a.forEach((c, i) => { if (c) terms.push(`${c === 1 && i > 0 ? '' : c}${i === 0 ? '' : i === 1 ? 'q' : `q^{${i}}`}`); });
  const ord = desc ? terms.reverse() : terms;
  return ord.length > max ? ord.slice(0, max - 1).join(' + ') + ' + \\cdots' : ord.join(' + ') || '0';
}

// ------------------------------------------------------------------ drawing
/** Quadratic arrow with a head at the end, in pixels (P is a pen from ch01.shared). */
export function arrowQuad(P, x1, y1, cx, cy, x2, y2, st = {}) {
  P.quad(x1, y1, cx, cy, x2, y2, st);
  let ux = x2 - cx, uy = y2 - cy; const L = Math.hypot(ux, uy) || 1; ux /= L; uy /= L;
  const h = st.head ?? 6;
  P.path([[x2, y2], [x2 - ux * h - uy * h * 0.5, y2 - uy * h + ux * h * 0.5], [x2 - ux * h + uy * h * 0.5, y2 - uy * h - ux * h * 0.5]], { fill: st.color || 'ink', color: st.color || 'ink', width: 1, alpha: st.alpha, close: true });
}
/** A small box with a centred number (a letter of a word). */
export function letterBox(P, x, y, w, h, label, st = {}) {
  P.rect(x, y, w, h, { fill: st.fill || 'panel', fillAlpha: st.fillAlpha ?? 1, color: st.color || 'muted', width: st.width ?? 1.2, r: 4, alpha: st.alpha });
  P.text(String(label), x + w / 2, y + h / 2, { align: 'center', size: st.size ?? Math.min(15, h * 0.55), color: st.text || 'ink', weight: st.weight ?? 600, halo: false });
}
