// Shared helpers for bioinf chapter 3 (alignment statistics and database search).
// Constants marked NCBI are copied from the BLAST source file blast_stat.c (ncbi-cxx-toolkit-public, src/algo/blast/core).
import { AA, B62, PAM250, PROT, aaIndex } from './ch02.shared.js';
export * from './ch02.shared.js';

// ───────────────────────────────────────────────────────────── random sequences
// Robinson & Robinson (1991) background amino-acid frequencies as used by NCBI BLAST, in the order of AA ('ARNDCQEGHILKMFPSTWYV')
const ROB = { A: 78.05, C: 19.25, D: 53.64, E: 62.95, F: 38.56, G: 73.77, H: 21.99, I: 51.42, K: 57.44, L: 90.19, M: 22.43, N: 44.87, P: 52.03, Q: 42.64, R: 51.29, S: 71.2, T: 58.41, V: 64.41, W: 13.3, Y: 32.16 };
export const BG = (() => { const q = AA.split('').map((c) => ROB[c]); const s = q.reduce((a, b) => a + b, 0); return q.map((x) => x / s); })();
const CUM = (() => { let c = 0; return BG.map((p) => (c += p)); })();

export function mkRng(seed) {
  let a = (seed >>> 0) || 1;
  const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.normal = () => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  return r;
}
export function randAA(r, n) { const a = new Uint8Array(n); for (let i = 0; i < n; i++) { const u = r(); let k = 0; while (k < 19 && CUM[k] < u) k++; a[i] = k; } return a; }
export function codes(str) { const a = new Uint8Array(str.length); for (let i = 0; i < str.length; i++) { const k = aaIndex(str[i]); a[i] = k === undefined ? 0 : k; } return a; }
export function shuffleCodes(r, a) { const b = Uint8Array.from(a); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
export const seqOf = (id) => codes(PROT[id].seq);

// ───────────────────────────────────────────────────────────── scoring systems
export const MAT = { blosum62: B62.flat(), pam250: PAM250.flat(), blosum45: null };
export const matFlat = (name, shift = 0) => { const M = MAT[name]; return shift ? M.map((x) => x + shift) : M; };
// Karlin–Altschul parameters from NCBI blast_stat.c (ungapped rows: lambda, K, H; gapped BLOSUM62 11/1)
export const NCBI = {
  blosum62: { lambda: 0.3176, K: 0.134, H: 0.4012, label: 'BLOSUM62, ungapped' },
  pam250: { lambda: 0.2252, K: 0.0868, H: 0.2223, label: 'PAM250, ungapped' },
  blosum45: { lambda: 0.2291, K: 0.0924, H: 0.2514, label: 'BLOSUM45, ungapped' },
  gapped62: { lambda: 0.267, K: 0.041, H: 0.14, label: 'BLOSUM62, gaps 11 + k' },
};
// mean score, the positive root lambda of sum q_a q_b e^{lambda s_ab} = 1, and the relative entropy H (nats) of the target frequencies
export function lambdaOf(S, q = BG) {
  let mean = 0, hi = -1e9; for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) { mean += q[i] * q[j] * S[i * 20 + j]; hi = Math.max(hi, S[i * 20 + j]); }
  const F = (l) => { let s = 0; for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) s += q[i] * q[j] * Math.exp(l * S[i * 20 + j]); return s - 1; };
  if (mean >= 0 || hi <= 0) return { mean, lambda: null, H: null, F };
  let a = 1e-6, b = 1; while (F(b) < 0) b *= 2;
  for (let k = 0; k < 100; k++) { const m = (a + b) / 2; if (F(m) < 0) a = m; else b = m; }
  const lambda = (a + b) / 2; let H = 0;
  for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) { const s = S[i * 20 + j]; H += q[i] * q[j] * Math.exp(lambda * s) * lambda * s; }
  return { mean, lambda, H, F };
}
export const bitScore = (S, lambda, K) => (lambda * S - Math.log(K)) / Math.LN2;
export const rawFromBits = (b, lambda, K) => (b * Math.LN2 + Math.log(K)) / lambda;
// BLAST-style length adjustment: l = ln(K (m-l)(n-l)) / H, iterated
export function lengthAdj(K, H, m, n) { let l = 0; for (let it = 0; it < 30; it++) { const v = K * Math.max(1, m - l) * Math.max(1, n - l); const nl = Math.max(0, Math.log(Math.max(v, 1)) / H); if (Math.abs(nl - l) < 1e-6) { l = nl; break; } l = nl; } return Math.min(l, Math.min(m, n) - 1); }
export const expect = (S, P, m, n, adj = true) => { const l = adj ? lengthAdj(P.K, P.H, m, n) : 0; return P.K * (m - l) * (n - l) * Math.exp(-P.lambda * S); };

// ───────────────────────────────────────────────────────────── fast alignment scores (no traceback)
// Smith–Waterman score with affine gaps: a gap of length k costs open + (k-1)*ext  (NCBI "existence 11, extension 1" is open = 12, ext = 1)
export function swScore(a, b, S, open, ext) {
  const n = a.length, m = b.length, H = new Int32Array(m + 1), E = new Int32Array(m + 1).fill(-1e6);
  let best = 0;
  for (let i = 1; i <= n; i++) {
    let diag = 0, F = -1e6; const row = a[i - 1] * 20; let hl = 0;
    for (let j = 1; j <= m; j++) {
      const up = H[j];
      const e = Math.max(E[j] - ext, up - open); E[j] = e;
      F = Math.max(F - ext, hl - open);
      let h = diag + S[row + b[j - 1]]; if (e > h) h = e; if (F > h) h = F; if (h < 0) h = 0;
      diag = up; H[j] = h; hl = h; if (h > best) best = h;
    }
  }
  return best;
}
// best ungapped segment over all diagonals
export function maxUngapped(a, b, S) {
  const n = a.length, m = b.length; let best = 0;
  for (let d = -(n - 1); d <= m - 1; d++) {
    let y = 0; const i0 = Math.max(0, -d), i1 = Math.min(n, m - d);
    for (let i = i0; i < i1; i++) { y += S[a[i] * 20 + b[i + d]]; if (y < 0) y = 0; else if (y > best) best = y; }
  }
  return best;
}
// number of excursions (locally maximal scoring segments, one per clump) by peak score, accumulated into cnt[peak]
export function excursions(a, b, S, cnt) {
  const n = a.length, m = b.length, top = cnt.length - 1;
  for (let d = -(n - 1); d <= m - 1; d++) {
    let y = 0, pk = 0; const i0 = Math.max(0, -d), i1 = Math.min(n, m - d);
    for (let i = i0; i < i1; i++) {
      const ny = y + S[a[i] * 20 + b[i + d]];
      if (ny <= 0) { if (pk > 0) { cnt[Math.min(top, pk)]++; pk = 0; } y = 0; } else { y = ny; if (y > pk) pk = y; }
    }
    if (pk > 0) cnt[Math.min(top, pk)]++;
  }
}
// longest common subsequence length
export function lcs(a, b) {
  const n = a.length, m = b.length; let prev = new Int32Array(m + 1), cur = new Int32Array(m + 1);
  for (let i = 1; i <= n; i++) {
    const x = a[i - 1]; cur[0] = 0;
    for (let j = 1; j <= m; j++) cur[j] = x === b[j - 1] ? prev[j - 1] + 1 : (prev[j] > cur[j - 1] ? prev[j] : cur[j - 1]);
    const t = prev; prev = cur; cur = t;
  }
  return prev[m];
}
// DNA-style local alignment score: +1 match, -mu mismatch, linear gap -delta per residue (floating point)
export function swLinear(a, b, mu, delta) {
  const n = a.length, m = b.length, H = new Float64Array(m + 1); let best = 0;
  for (let i = 1; i <= n; i++) {
    let diag = 0, left = 0; const x = a[i - 1];
    for (let j = 1; j <= m; j++) {
      const up = H[j]; let h = diag + (x === b[j - 1] ? 1 : -mu);
      const u = up - delta, l = left - delta; if (u > h) h = u; if (l > h) h = l; if (h < 0) h = 0;
      diag = up; H[j] = h; left = h; if (h > best) best = h;
    }
  }
  return best;
}
export function randDNA(r, n, k = 4) { const a = new Uint8Array(n); for (let i = 0; i < n; i++) a[i] = Math.floor(r() * k); return a; }

// ───────────────────────────────────────────────────────────── statistics
export function moments(xs) {
  const n = xs.length; let m = 0; for (const x of xs) m += x; m /= n;
  let v = 0, s3 = 0; for (const x of xs) { const d = x - m; v += d * d; s3 += d * d * d; }
  v /= Math.max(1, n - 1); const sd = Math.sqrt(v);
  return { n, mean: m, sd, skew: sd > 0 ? s3 / n / (sd * sd * sd) : 0 };
}
export const EULER = 0.5772156649015329;
export const gumbelPdf = (x, mu, beta) => { const z = (x - mu) / beta; return Math.exp(-z - Math.exp(-z)) / beta; };
export const gumbelSf = (x, mu, beta) => -Math.expm1(-Math.exp(-(x - mu) / beta));
export const normSf = (x, m, s) => 0.5 * erfcApprox((x - m) / (s * Math.SQRT2));
export const normPdf = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
function erfcApprox(x) { // Numerical Recipes erfc, relative error < 1.2e-7
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
export const sci = (x, d = 2) => { if (x === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(x))); const m = x / 10 ** e; return e >= -2 && e <= 3 ? String(+x.toPrecision(d)).replace('-', '−') : `${m.toFixed(d - 1)}×10^{${e}}`.replace('-', '−').replace('^{−', '^{−'); };
export const fx = (x, d = 2) => String(Number(x).toFixed(d)).replace('-', '−');

// ───────────────────────────────────────────────────────────── BLAST machinery (ungapped, protein)
// All words of length w that score >= T against some word of the query, as a table word-code -> query positions.
export function neighborMap(q, S, w, T) {
  const size = 20 ** w, map = new Array(size), n = q.length;
  const rowMax = new Int32Array(20); for (let a = 0; a < 20; a++) { let m = -99; for (let b = 0; b < 20; b++) m = Math.max(m, S[a * 20 + b]); rowMax[a] = m; }
  let nWords = 0, pairs = 0;
  const seen = new Uint8Array(size);
  for (let i = 0; i + w <= n; i++) {
    const rest = new Int32Array(w + 1); for (let k = w - 1; k >= 0; k--) rest[k] = rest[k + 1] + rowMax[q[i + k]];
    const rec = (k, code, sc) => {
      if (k === w) { (map[code] || (map[code] = [])).push(i); if (!seen[code]) { seen[code] = 1; nWords++; } pairs++; return; }
      const a = q[i + k];
      for (let b = 0; b < 20; b++) { const s2 = sc + S[a * 20 + b]; if (s2 + rest[k + 1] >= T) rec(k + 1, code * 20 + b, s2); }
    };
    rec(0, 0, 0);
  }
  return { map, nWords, pairs, w, T, n };
}
export function neighborsOf(qword, S, T, limit = 400) {
  const w = qword.length, out = [];
  const rowMax = new Int32Array(20); for (let a = 0; a < 20; a++) { let m = -99; for (let b = 0; b < 20; b++) m = Math.max(m, S[a * 20 + b]); rowMax[a] = m; }
  const rest = new Int32Array(w + 1); for (let k = w - 1; k >= 0; k--) rest[k] = rest[k + 1] + rowMax[qword[k]];
  const rec = (k, word, sc) => {
    if (k === w) { out.push({ word, score: sc }); return; }
    for (let b = 0; b < 20; b++) { const s2 = sc + S[qword[k] * 20 + b]; if (s2 + rest[k + 1] >= T) rec(k + 1, word + AA[b], s2); }
  };
  rec(0, '', 0); out.sort((x, y) => y.score - x.score); return out.slice(0, limit);
}
// db: Uint8Array of residue codes with the value 255 between sequences. Returns hits, extensions and ungapped high-scoring pairs.
export function blastSearch(q, db, nb, S, o) {
  const { w, X, twoHit, A = 40 } = o, n = q.length, N = db.length, map = nb.map;
  const lastEnd = new Int32Array(n + N + 1).fill(-1), lastHit = new Int32Array(n + N + 1).fill(-1e6);
  const sc = (a, b) => (b > 19 || a > 19 ? -1e6 : S[a * 20 + b]);
  const hits = [], hsps = []; let nHits = 0, nExt = 0, cells = 0;
  let code = 0, valid = 0;
  for (let j = 0; j < N; j++) {
    const c = db[j];
    if (c > 19) { valid = 0; code = 0; continue; }
    code = (code * 20 + c) % (20 ** w); valid++;
    if (valid < w) continue;
    const lst = map[code]; if (!lst) continue;
    const j0 = j - w + 1;
    for (let t = 0; t < lst.length; t++) {
      const i0 = lst[t], d = j0 - i0 + n; nHits++;
      let go = false;
      if (j0 < lastEnd[d]) { hits.push([i0, j0, 0]); continue; }
      if (!twoHit) go = true;
      else {
        const lh = lastHit[d];
        if (lh >= 0 && j0 - lh >= w && j0 - lh <= A) go = true;
        else if (j0 - lh >= w || lh < 0) lastHit[d] = j0;
      }
      hits.push([i0, j0, go ? 1 : 0]);
      if (!go) continue;
      nExt++;
      // ungapped extension with X-drop, right then left, starting from the word
      let s0 = 0; for (let k = 0; k < w; k++) s0 += sc(q[i0 + k], db[j0 + k]);
      let best = s0, cur = s0, ri = i0 + w, rj = j0 + w, bi = ri, bj = rj;
      while (ri < n && rj < N && db[rj] <= 19) { cur += sc(q[ri], db[rj]); cells++; ri++; rj++; if (cur > best) { best = cur; bi = ri; bj = rj; } else if (best - cur >= X) break; }
      const right = best; cur = best; let li = i0 - 1, lj = j0 - 1, ai = i0, aj = j0, best2 = best;
      while (li >= 0 && lj >= 0 && db[lj] <= 19) { cur += sc(q[li], db[lj]); cells++; if (cur > best2) { best2 = cur; ai = li; aj = lj; } else if (best2 - cur >= X) break; li--; lj--; }
      cells += w;
      lastEnd[d] = bj; lastHit[d] = -1e6;
      hsps.push({ i0: ai, j0: aj, i1: bi, j1: bj, score: best2, d: j0 - i0, seed: [i0, j0] });
    }
  }
  return { hits, hsps, nHits, nExt, cells };
}
// Concatenate sequences (code arrays) with separators; returns {db, starts, names}
export function makeDb(list) {
  let tot = 0; for (const [, c] of list) tot += c.length + 1;
  const db = new Uint8Array(tot).fill(255), starts = []; let p = 0;
  for (const [name, c] of list) { starts.push({ name, start: p, end: p + c.length }); db.set(c, p); p += c.length + 1; }
  return { db, starts, residues: tot - list.length };
}

// ───────────────────────────────────────────────────────────── spaced seeds
export const SEEDS = { contiguous: '11111111111', patternhunter: '111010010100110111' };
export const seedMask = (pat) => { let m = 0; for (let k = 0; k < pat.length; k++) if (pat[k] === '1') m |= 1 << (pat.length - 1 - k); return m; };
export const seedWeight = (pat) => pat.split('').filter((c) => c === '1').length;
// Keep the editable template's weight, including the one-bit and 19/20-bit cases.
export function randomSeedOfWeight(weight, seed) {
  if (!Number.isInteger(weight) || weight < 1 || weight > 20) throw new RangeError('Seed weight must be an integer from 1 to 20');
  if (weight === 1) return '1';
  const span = Math.max(18, weight), r = mkRng(seed), positions = [];
  for (let i = 1; i < span - 1; i++) positions.push(i);
  for (let i = positions.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [positions[i], positions[j]] = [positions[j], positions[i]]; }
  const pattern = Array(span).fill('0'); pattern[0] = pattern[span - 1] = '1';
  positions.slice(0, weight - 2).forEach(i => { pattern[i] = '1'; });
  return pattern.join('');
}
// uniform draws for N alignments of length L (so that sensitivity is monotone in p and seeds are compared on the same data)
export function seedData(seed, N, L) { const r = mkRng(seed), u = new Float32Array(N * L); for (let i = 0; i < u.length; i++) u[i] = r(); return { u, N, L }; }
// fraction of alignments (each position matches with probability p) hit by the seed, and the mean number of hits
export function seedSensitivity(D, pat, p) {
  const len = pat.length, mask = seedMask(pat), full = len >= 31 ? -1 : (1 << len) - 1, use = D.use || D.L; let hit = 0, tot = 0;
  for (let a = 0; a < D.N; a++) {
    let win = 0, c = 0; const base = a * D.L;
    for (let k = 0; k < use; k++) { win = ((win << 1) | (D.u[base + k] < p ? 1 : 0)) & full; if (k >= len - 1 && (win & mask) === mask) c++; }
    if (c) hit++; tot += c;
  }
  return { sens: hit / D.N, hits: tot / D.N };
}
// exact probability that an i.i.d. Bernoulli(p) 0/1 string of length L contains the seed (dynamic programming over the last span-1 positions)
export function seedExact(pat, p, L) {
  const span = pat.length, mask = seedMask(pat), nb = span - 1, size = 1 << nb, M = size - 1;
  let cur = new Float64Array(size); cur[0] = 1; let hit = 0;
  // state: last nb bits (with fewer than nb positions seen, the missing bits count as mismatches which cannot hit before span positions)
  for (let k = 0; k < L; k++) {
    const nxt = new Float64Array(size);
    for (let s = 0; s < size; s++) { const pr = cur[s]; if (!pr) continue;
      for (let b = 0; b < 2; b++) { const pb = pr * (b ? p : 1 - p), full = (s << 1) | b;
        if (k >= span - 1 && (full & mask) === mask) hit += pb; else nxt[full & M] += pb; } }
    cur = nxt;
  }
  return hit;
}
