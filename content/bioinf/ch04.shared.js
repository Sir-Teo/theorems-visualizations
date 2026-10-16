// Shared helpers for bioinf chapter 4 (Markov chains and hidden Markov models).
// Re-exports the chapter-3 helpers (which re-export chapter 2's).
export * from './ch03.shared.js';
import { mkRng, BG, AA, swScore, matFlat, codes } from './ch03.shared.js';

export const NUC = 'ACGT';
export const f3 = (x, d = 3) => String(Number(x).toFixed(d)).replace('-', '−');
export const sumArr = (a) => a.reduce((s, x) => s + x, 0);
export const rowNorm = (M) => M.map((r) => { const s = sumArr(r); return r.map((x) => x / s); });
export const log2 = (x) => Math.log(x) / Math.LN2;

// ───────────────────────────────────────────────────────────── CpG island chains
// Transition probabilities of the "+" (CpG island) and "-" (non-island) first-order chains as printed in
// Durbin, Eddy, Krogh & Mitchison, Biological Sequence Analysis (1998), p. 50 (checked against lecture notes that reproduce the table;
// the book's table itself was not opened). Rows are the previous nucleotide, columns the next, order A C G T.
export const CPG_PLUS = rowNorm([[0.180, 0.274, 0.426, 0.120], [0.171, 0.368, 0.274, 0.188], [0.161, 0.339, 0.375, 0.125], [0.079, 0.355, 0.384, 0.182]]);
export const CPG_MINUS = rowNorm([[0.300, 0.205, 0.285, 0.210], [0.322, 0.298, 0.078, 0.302], [0.248, 0.246, 0.298, 0.208], [0.177, 0.239, 0.292, 0.292]]);
export const BETA = CPG_PLUS.map((r, i) => r.map((p, j) => log2(p / CPG_MINUS[i][j])));

/** Sample n nucleotides (codes 0..3) from a chain with transition matrix P; first symbol uniform. */
export function sampleChain(P, n, r) {
  const x = new Uint8Array(n); let c = Math.floor(r() * 4);
  for (let t = 0; t < n; t++) {
    if (t > 0) { const u = r(); let a = 0, k = 0; while (k < 3 && (a += P[c][k]) < u) k++; c = k; }
    x[t] = c;
  }
  return x;
}
/** Maximum-likelihood transition matrix (with optional add-pseudo smoothing) from a code array; also the raw count matrix. */
export function estimateChain(x, pseudo = 0) {
  const C = [0, 1, 2, 3].map(() => [0, 0, 0, 0]);
  for (let t = 1; t < x.length; t++) C[x[t - 1]][x[t]]++;
  const P = C.map((row) => { const s = sumArr(row) + 4 * pseudo; return row.map((c) => (s > 0 ? (c + pseudo) / s : 0.25)); });
  return { C, P };
}
export const toStr = (x) => Array.from(x, (c) => NUC[c]).join('');
export const fromStr = (s) => Uint8Array.from(String(s).toUpperCase().replace(/[^ACGT]/g, ''), (ch) => NUC.indexOf(ch));

// ───────────────────────────────────────────────────────────── generic discrete HMM
// h = { K, M, A[K][K], E[K][M], pi[K], names }.  Observations are integers in 0..M-1.
export function sampleHMM(h, T, r) {
  const path = new Uint8Array(T), obs = new Uint8Array(T);
  const draw = (p) => { const u = r(); let a = 0, k = 0; while (k < p.length - 1 && (a += p[k]) < u) k++; return k; };
  let s = draw(h.pi);
  for (let t = 0; t < T; t++) { if (t > 0) s = draw(h.A[s]); path[t] = s; obs[t] = draw(h.E[s]); }
  return { path, obs };
}

/** Viterbi in log space.  Returns V[t][k] (natural log), ptr[t][k], the best path and its log probability. */
export function viterbi(h, obs) {
  const T = obs.length, K = h.K, V = [], ptr = [];
  const lA = h.A.map((r) => r.map(Math.log)), lE = h.E.map((r) => r.map(Math.log));
  V.push(Array.from({ length: K }, (_, k) => Math.log(h.pi[k]) + lE[k][obs[0]])); ptr.push(new Array(K).fill(-1));
  for (let t = 1; t < T; t++) {
    const v = [], p = [];
    for (let k = 0; k < K; k++) {
      let best = -Infinity, bj = 0;
      for (let j = 0; j < K; j++) { const c = V[t - 1][j] + lA[j][k]; if (c > best) { best = c; bj = j; } }
      v.push(best + lE[k][obs[t]]); p.push(bj);
    }
    V.push(v); ptr.push(p);
  }
  let k = 0; for (let j = 1; j < K; j++) if (V[T - 1][j] > V[T - 1][k]) k = j;
  const logp = V[T - 1][k], path = new Uint8Array(T);
  for (let t = T - 1; t >= 0; t--) { path[t] = k; if (t > 0) k = ptr[t][k]; }
  return { V, ptr, path, logp };
}

/** Scaled forward pass: alpha[t][k] sums to 1 over k, c[t] are the scaling constants, logL = sum log c. */
export function forwardScaled(h, obs) {
  const T = obs.length, K = h.K, alpha = [], c = [];
  let logL = 0;
  for (let t = 0; t < T; t++) {
    const a = new Array(K);
    for (let k = 0; k < K; k++) {
      let s = 0;
      if (t === 0) s = h.pi[k]; else for (let j = 0; j < K; j++) s += alpha[t - 1][j] * h.A[j][k];
      a[k] = s * h.E[k][obs[t]];
    }
    const z = sumArr(a); c.push(z); logL += Math.log(z);
    alpha.push(a.map((x) => x / z));
  }
  return { alpha, c, logL };
}
export function backwardScaled(h, obs, c) {
  const T = obs.length, K = h.K, beta = new Array(T);
  beta[T - 1] = new Array(K).fill(1);
  for (let t = T - 2; t >= 0; t--) {
    const b = new Array(K);
    for (let j = 0; j < K; j++) { let s = 0; for (let k = 0; k < K; k++) s += h.A[j][k] * h.E[k][obs[t + 1]] * beta[t + 1][k]; b[j] = s / c[t + 1]; }
    beta[t] = b;
  }
  return beta;
}
/** Posterior state probabilities gamma[t][k] = P(state_t = k | obs). */
export function posterior(h, obs) {
  const F = forwardScaled(h, obs), B = backwardScaled(h, obs, F.c);
  const gamma = F.alpha.map((a, t) => { const g = a.map((x, k) => x * B[t][k]); const s = sumArr(g); return g.map((x) => x / s); });
  return { gamma, alpha: F.alpha, beta: B, c: F.c, logL: F.logL };
}
/** log joint probability of a given path and observations. */
export function logJoint(h, path, obs) {
  let s = Math.log(h.pi[path[0]]) + Math.log(h.E[path[0]][obs[0]]);
  for (let t = 1; t < obs.length; t++) s += Math.log(h.A[path[t - 1]][path[t]]) + Math.log(h.E[path[t]][obs[t]]);
  return s;
}
/** One Baum–Welch (EM) step; pi is kept fixed.  Returns the new model and the log likelihood of the OLD model. */
export function baumWelchStep(h, obs, tiny = 1e-9) {
  const T = obs.length, K = h.K, M = h.M;
  const P = posterior(h, obs), A = Array.from({ length: K }, () => new Array(K).fill(tiny)), E = Array.from({ length: K }, () => new Array(M).fill(tiny));
  for (let t = 0; t < T; t++) {
    for (let k = 0; k < K; k++) E[k][obs[t]] += P.gamma[t][k];
    if (t < T - 1) {
      for (let j = 0; j < K; j++) for (let k = 0; k < K; k++) A[j][k] += P.alpha[t][j] * h.A[j][k] * h.E[k][obs[t + 1]] * P.beta[t + 1][k] / P.c[t + 1];
    }
  }
  return { h: { ...h, A: rowNorm(A), E: rowNorm(E) }, logL: P.logL };
}
/** Unscaled forward recursion in plain probabilities; returns totals P(x_1..x_t) per t (with optional single-precision rounding). */
export function forwardRaw(h, obs, single = false) {
  const K = h.K, rd = single ? Math.fround : (x) => x, tot = [];
  let a = new Array(K);
  for (let t = 0; t < obs.length; t++) {
    const n = new Array(K);
    for (let k = 0; k < K; k++) {
      let s = 0;
      if (t === 0) s = rd(h.pi[k]); else for (let j = 0; j < K; j++) s = rd(s + rd(a[j] * rd(h.A[j][k])));
      n[k] = rd(s * rd(h.E[k][obs[t]]));
    }
    a = n; tot.push(sumArr(a));
  }
  return tot;
}
/** Forward recursion in log space (log-sum-exp); returns log P(x_1..x_t) per t (natural log). */
export function forwardLog(h, obs) {
  const K = h.K, lA = h.A.map((r) => r.map(Math.log)), lE = h.E.map((r) => r.map(Math.log)), out = [];
  let a = h.pi.map((p, k) => Math.log(p) + lE[k][obs[0]]);
  const lse = (xs) => { const m = Math.max(...xs); return m === -Infinity ? m : m + Math.log(sumArr(xs.map((x) => Math.exp(x - m)))); };
  out.push(lse(a));
  for (let t = 1; t < obs.length; t++) {
    a = Array.from({ length: K }, (_, k) => lse(a.map((x, j) => x + lA[j][k])) + lE[k][obs[t]]);
    out.push(lse(a));
  }
  return out;
}

// ───────────────────────────────────────────────────────────── the occasionally dishonest casino
/** Durbin et al. ch. 3: fair die, loaded die with P(six) = 1/2; switching probabilities as parameters. */
export function casino({ aFL = 0.05, aLF = 0.1, p6 = 0.5 } = {}) {
  const q = (1 - p6) / 5;
  return { K: 2, M: 6, names: ['Fair', 'Loaded'], A: [[1 - aFL, aFL], [aLF, 1 - aLF]], E: [new Array(6).fill(1 / 6), [q, q, q, q, q, p6]], pi: [aLF / (aFL + aLF), aFL / (aFL + aLF)] };
}

// ───────────────────────────────────────────────────────────── pair HMM (Durbin et al. ch. 4)
/** Pair HMM with states M, X, Y.  par = {delta, eps, tau, ident}; match emission p(a,a) = ident/4, p(a,b) = (1-ident)/12; q(a) = 1/4. */
export function pairHMM(x, y, par) {
  const n = x.length, m = y.length, { delta: d, eps: e, tau: tau, ident } = par;
  const p = (a, b) => (a === b ? ident / 4 : (1 - ident) / 12), q = 0.25;
  const mk = () => Array.from({ length: n + 2 }, () => new Float64Array(m + 2));
  const fM = mk(), fX = mk(), fY = mk(), bM = mk(), bX = mk(), bY = mk();
  const am = 1 - 2 * d - tau, ax = 1 - e - tau;
  fM[0][0] = 1;
  for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
    if (i === 0 && j === 0) continue;
    if (i > 0 && j > 0) fM[i][j] = p(x[i - 1], y[j - 1]) * (am * fM[i - 1][j - 1] + ax * (fX[i - 1][j - 1] + fY[i - 1][j - 1]));
    if (i > 0) fX[i][j] = q * (d * fM[i - 1][j] + e * fX[i - 1][j]);
    if (j > 0) fY[i][j] = q * (d * fM[i][j - 1] + e * fY[i][j - 1]);
  }
  const total = tau * (fM[n][m] + fX[n][m] + fY[n][m]);
  bM[n][m] = bX[n][m] = bY[n][m] = tau;
  for (let i = n; i >= 0; i--) for (let j = m; j >= 0; j--) {
    if (i === n && j === m) continue;
    const diag = i < n && j < m ? p(x[i], y[j]) * bM[i + 1][j + 1] : 0, down = i < n ? q * bX[i + 1][j] : 0, right = j < m ? q * bY[i][j + 1] : 0;
    bM[i][j] = am * diag + d * down + d * right;
    bX[i][j] = ax * diag + e * down;
    bY[i][j] = ax * diag + e * right;
  }
  const post = Array.from({ length: n }, (_, i) => Array.from({ length: m }, (_, j) => (fM[i + 1][j + 1] * bM[i + 1][j + 1]) / total));
  // Viterbi (log) with traceback
  const NEG = -Infinity, L = Math.log, mk2 = () => Array.from({ length: n + 1 }, () => new Array(m + 1).fill(NEG));
  const vM = mk2(), vX = mk2(), vY = mk2(), tM = mk2(), tX = mk2(), tY = mk2();
  vM[0][0] = 0;
  const arg = (c) => { let b = 0; for (let k = 1; k < c.length; k++) if (c[k] > c[b]) b = k; return b; };
  for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
    if (i === 0 && j === 0) continue;
    if (i > 0 && j > 0) { const c = [vM[i - 1][j - 1] + L(am), vX[i - 1][j - 1] + L(ax), vY[i - 1][j - 1] + L(ax)], b = arg(c); vM[i][j] = c[b] + L(p(x[i - 1], y[j - 1])); tM[i][j] = b; }
    if (i > 0) { const c = [vM[i - 1][j] + L(d), vX[i - 1][j] + L(e)], b = arg(c); vX[i][j] = c[b] + L(q); tX[i][j] = b; }
    if (j > 0) { const c = [vM[i][j - 1] + L(d), vY[i][j - 1] + L(e)], b = arg(c); vY[i][j] = c[b] + L(q); tY[i][j] = b; }
  }
  const fin = [vM[n][m], vX[n][m], vY[n][m]]; let st = arg(fin);
  const logVit = fin[st] + L(tau), ops = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    ops.push([st, i, j]);
    if (st === 0) { const b = tM[i][j]; i--; j--; st = b; } else if (st === 1) { const b = tX[i][j]; i--; st = b === 0 ? 0 : 1; } else { const b = tY[i][j]; j--; st = b === 0 ? 0 : 2; }
  }
  ops.reverse();
  return { fM, total, post, vit: ops, logVit, n, m };
}

// ───────────────────────────────────────────────────────────── profile HMM (Durbin et al. ch. 5)
/** Build a profile HMM from an alignment (array of equal-length strings, '-' for gaps).  Columns with at most half gaps are match columns. */
export function buildProfile(msa, pseudo = 1) {
  const R = AA.length, N = msa.length, W = msa[0].length;
  const isMatch = []; for (let c = 0; c < W; c++) isMatch.push(msa.filter((s) => s[c] === '-').length <= N / 2);
  const L = isMatch.filter(Boolean).length;
  // states per node k=0..L: M_k, I_k, D_k ; transitions out of node k to node k+1
  const eM = Array.from({ length: L + 2 }, () => new Array(R).fill(pseudo / R * 0 + 0)), cnt = Array.from({ length: L + 1 }, () => ({ M: [0, 0, 0], I: [0, 0, 0], D: [0, 0, 0] }));
  // state codes: 0 M, 1 I, 2 D ; transition targets: [to M_{k+1}, to I_k, to D_{k+1}]
  for (const s of msa) {
    let k = 0, prev = 0; // begin acts like M_0
    for (let c = 0; c < W; c++) {
      const ch = s[c];
      if (isMatch[c]) {
        k++;
        const st = ch === '-' ? 2 : 0;
        cnt[k - 1][['M', 'I', 'D'][prev]][st === 0 ? 0 : 2]++;
        if (st === 0) eM[k][AA.indexOf(ch)]++;
        prev = st;
      } else if (ch !== '-') {
        cnt[k][['M', 'I', 'D'][prev]][1]++; prev = 1;
      }
    }
    cnt[L][['M', 'I', 'D'][prev]][0]++; // to End (treated as M_{L+1})
  }
  const trans = cnt.map((o) => ({ M: normPlus(o.M, pseudo), I: normPlus(o.I, pseudo), D: normPlus(o.D, pseudo) }));
  const emit = eM.slice(0, L + 1).map((row, k) => (k === 0 ? null : normPlus(row, pseudo)));
  const matchCols = []; isMatch.forEach((m, c) => { if (m) matchCols.push(c); });
  return { L, emit, trans, matchCols, isMatch, counts: cnt, N };
}
const normPlus = (a, p) => { const s = sumArr(a) + p * a.length; return a.map((x) => (x + p) / s); };

/** Viterbi log-odds score (bits) of a sequence of residue codes against the profile; insert emissions equal the background (score 0). Also returns the state path. */
export function profileViterbi(P, x, bg = BG) {
  const L = P.L, n = x.length, NEG = -1e9;
  const lt = P.trans.map((o) => ({ M: o.M.map(log2), I: o.I.map(log2), D: o.D.map(log2) }));
  const le = P.emit.map((row) => (row ? row.map((p, a) => log2(p / bg[a])) : null));
  const mk = () => Array.from({ length: L + 2 }, () => new Float64Array(n + 1).fill(NEG));
  const M = mk(), I = mk(), D = mk(), bM = mk(), bI = mk(), bD = mk();
  M[0][0] = 0;
  for (let k = 0; k <= L + 1; k++) for (let i = 0; i <= n; i++) {
    if (k === 0 && i === 0) continue;
    if (k >= 1 && k <= L && i >= 1) {
      const c = [M[k - 1][i - 1] + lt[k - 1].M[0], I[k - 1][i - 1] + lt[k - 1].I[0], D[k - 1][i - 1] + lt[k - 1].D[0]];
      const b = c[0] >= c[1] && c[0] >= c[2] ? 0 : c[1] >= c[2] ? 1 : 2; M[k][i] = c[b] + le[k][x[i - 1]]; bM[k][i] = b;
    }
    if (k >= 0 && k <= L && i >= 1) {
      const c = [M[k][i - 1] + lt[k].M[1], I[k][i - 1] + lt[k].I[1], D[k][i - 1] + lt[k].D[1]];
      const b = c[0] >= c[1] && c[0] >= c[2] ? 0 : c[1] >= c[2] ? 1 : 2; I[k][i] = c[b]; bI[k][i] = b;
    }
    if (k >= 1 && k <= L) {
      const c = [M[k - 1][i] + lt[k - 1].M[2], I[k - 1][i] + lt[k - 1].I[2], D[k - 1][i] + lt[k - 1].D[2]];
      const b = c[0] >= c[1] && c[0] >= c[2] ? 0 : c[1] >= c[2] ? 1 : 2; D[k][i] = c[b]; bD[k][i] = b;
    }
    if (k === L + 1) {
      const c = [M[L][i] + lt[L].M[0], I[L][i] + lt[L].I[0], D[L][i] + lt[L].D[0]];
      const b = c[0] >= c[1] && c[0] >= c[2] ? 0 : c[1] >= c[2] ? 1 : 2; if (i === n) { M[k][i] = c[b]; bM[k][i] = b; }
    }
  }
  const score = M[L + 1][n];
  // traceback
  const path = []; let k = L + 1, i = n, st = bM[k][i];
  k = L; path.push(['E', L + 1, n]);
  while (k > 0 || i > 0) {
    path.push([['M', 'I', 'D'][st], k, i]);
    let b;
    if (st === 0) { b = bM[k][i]; k--; i--; } else if (st === 1) { b = bI[k][i]; i--; } else { b = bD[k][i]; k--; }
    st = b;
    if (k === 0 && i === 0) break;
  }
  path.reverse();
  return { score, path };
}

/** Simple model of protein family evolution used for illustration: conserved and variable sites; returns an MSA and its ancestor. */
export function simulateFamily(seed, { L = 40, nSeq = 14, conserved = 0.4, keepC = 0.93, keepV = 0.3, delP = 0.03, insP = 0.05 } = {}) {
  const r = mkRng(seed), draw = () => { const u = r(); let a = 0, k = 0; while (k < 19 && (a += BG[k]) < u) k++; return k; };
  const anc = Array.from({ length: L }, draw), cons = Array.from({ length: L }, () => r() < conserved);
  const members = [];
  for (let s = 0; s < nSeq; s++) members.push(deriveMember(r, anc, cons, { keepC, keepV, delP, insP, draw }));
  // alignment columns: for gap g (0..L) insertion columns up to max insertion length, then site columns
  const cols = [];
  for (let g = 0; g <= L; g++) {
    const mx = Math.max(...members.map((m) => m.ins[g].length));
    for (let q = 0; q < mx; q++) cols.push(members.map((m) => (q < m.ins[g].length ? AA[m.ins[g][q]] : '-')));
    if (g < L) cols.push(members.map((m) => (m.site[g] < 0 ? '-' : AA[m.site[g]])));
  }
  const msa = members.map((_, s) => cols.map((c) => c[s]).join(''));
  return { msa, anc, cons, draw, r };
}
export function deriveMember(r, anc, cons, { keepC, keepV, delP, insP, draw }) {
  const L = anc.length, site = [], ins = [];
  for (let g = 0; g <= L; g++) {
    const a = []; while (r() < insP && a.length < 3) a.push(draw()); ins.push(a);
    if (g < L) site.push(r() < delP ? -1 : r() < (cons[g] ? keepC : keepV) ? anc[g] : draw());
  }
  return { site, ins };
}
export const memberString = (m) => { let s = ''; for (let g = 0; g < m.site.length + 1; g++) { s += m.ins[g].map((a) => AA[a]).join(''); if (g < m.site.length && m.site[g] >= 0) s += AA[m.site[g]]; } return s; };
export const aaCodes = (s) => codes(s);
export { swScore, matFlat };
