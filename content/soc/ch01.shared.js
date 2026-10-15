// Networks & Collective Behavior — Chapter 1: helpers shared by ch01.js and ch01-b.js (plain named exports).

/** Mulberry32: seeded uniform [0, 1). */
export function rng32(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Fisher–Yates shuffle in place with a uniform generator R. */
export function shuffle(a, R) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
/** Standard normal deviate (Box–Muller) from a uniform generator. */
export function gauss(R) { let u = 0; while (u === 0) u = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * R()); }
/** Error function (Abramowitz–Stegun 7.1.26, |error| < 1.5e-7) and the standard normal c.d.f. */
export function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
export const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
/** Inverse standard normal c.d.f. (Acklam's rational approximation, relative error < 1.2e-9). */
export function PhiInv(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - pl) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// ---------- Schelling city: w × h torus, Moore neighbourhood; cells 0 = vacant, 1 = blue, 2 = orange ----------
/** A random city with exactly round(n(1 − vac)) residents, a share `shareA` of them blue. */
export function makeCity(w, h, vac, shareA, seed) {
  const n = w * h, R = rng32(seed), g = new Uint8Array(n);
  const nAg = Math.round(n * (1 - vac)), nA = Math.round(nAg * shareA);
  const idx = shuffle(Array.from({ length: n }, (_, i) => i), R);
  for (let k = 0; k < nAg; k++) g[idx[k]] = k < nA ? 1 : 2;
  return { w, h, g, R, t: 0 };
}
/** Neighbour counts by state of cell k (into out = [vacant, blue, orange]). */
export function nbCounts(C, k, out) {
  const { w, h, g } = C, i = k % w, j = (k / w) | 0; out[0] = out[1] = out[2] = 0;
  for (let dj = -1; dj <= 1; dj++) {
    const jj = (j + dj + h) % h;
    for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; out[g[jj * w + ((i + di + w) % w)]]++; }
  }
  return out;
}
/** Is the resident of cell k discontent: fewer than a fraction T of its occupied neighbours like itself? */
export function unhappyAt(C, k, T, c) { const s = C.g[k]; if (!s) return false; nbCounts(C, k, c); const occ = c[1] + c[2]; return occ > 0 && c[s] < T * occ - 1e-9; }
/**
 * One round: the discontented, in random order, each move (if still discontent when their turn comes) either to a random
 * vacancy (rule 'random') or to a random vacancy where they would be content (rule 'content'; they stay if none of up to
 * 80 sampled vacancies satisfies them). Returns {unhappy, moved}.
 */
export function cityStep(C, T, rule = 'random') {
  const { g, R } = C, n = g.length, c = new Int32Array(3), mov = [], empty = [];
  for (let k = 0; k < n; k++) { if (!g[k]) empty.push(k); else if (unhappyAt(C, k, T, c)) mov.push(k); }
  shuffle(mov, R); let moved = 0;
  for (const k of mov) {
    if (!empty.length) break;
    if (!unhappyAt(C, k, T, c)) continue;
    const s = g[k];
    if (rule === 'random') { const e = Math.floor(R() * empty.length), d = empty[e]; g[d] = s; g[k] = 0; empty[e] = k; moved++; continue; }
    g[k] = 0; let found = -1;
    for (let tr = 0; tr < 80; tr++) { const e = Math.floor(R() * empty.length), d = empty[e]; g[d] = s; const ok = !unhappyAt(C, d, T, c); g[d] = 0; if (ok) { found = e; break; } }
    if (found < 0) { g[k] = s; continue; }
    g[empty[found]] = s; empty[found] = k; moved++;
  }
  C.t++; return { unhappy: mov.length, moved };
}
/**
 * Segregation statistics: like = mean share of like neighbours (over residents with at least one neighbour), likeA/likeB by
 * group, unhappy = share of residents discontent at tolerance T; with vals, the per-resident like shares and flags.
 */
export function cityStats(C, T, vals = false) {
  const { g } = C, c = new Int32Array(3), out = vals ? [] : null, bad = vals ? [] : null;
  let s = 0, m = 0, sA = 0, mA = 0, sB = 0, mB = 0, un = 0, ag = 0;
  for (let k = 0; k < g.length; k++) {
    const st = g[k]; if (!st) continue; ag++; nbCounts(C, k, c); const occ = c[1] + c[2];
    if (!occ) continue;
    const f = c[st] / occ; s += f; m++; if (st === 1) { sA += f; mA++; } else { sB += f; mB++; }
    const u = f < T - 1e-9; if (u) un++;
    if (vals) { out.push(f); bad.push(u); }
  }
  return { like: m ? s / m : 0, likeA: mA ? sA / mA : 0, likeB: mB ? sB / mB : 0, unhappy: ag ? un / ag : 0, vals: out, bad };
}

// ---------- threshold models (Granovetter) ----------
/**
 * Cascade of a finite crowd. th = thresholds (number of others who must already be acting). Starting from nobody,
 * r(t + 1) = F(r(t)) with F(x) = #{i : θ_i ≤ x}. Returns {rs: [0, r1, r2, …, final], final, F (Int32Array, x = 0…N)}.
 */
export function cascade(th) {
  const N = th.length, F = new Int32Array(N + 1);
  for (const x of th) { const k = Math.max(0, Math.round(x)); if (k <= N) F[k]++; }
  for (let x = 1; x <= N; x++) F[x] += F[x - 1];
  const rs = [0]; let r = 0;
  for (let guard = 0; guard <= N + 1; guard++) { const nr = F[Math.min(r, N)]; if (nr === r) break; rs.push(nr); r = nr; }
  return { rs, final: r, F };
}
/** Smallest fixed point r ≥ 0 of a continuous non-decreasing map F on [0, top] (where iteration from 0 ends). */
export function firstCrossing(F, top) {
  const n = 4000; let prev = 0;
  if (F(0) <= 0) return 0;
  for (let i = 1; i <= n; i++) {
    const x = (top * i) / n;
    if (F(x) - x <= 0) { let lo = prev, hi = x; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (F(m) - m > 0) lo = m; else hi = m; } return hi; }
    prev = x;
  }
  return top;
}
