// Combinatorics — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports).
//
// Everything here is exact: derangements and surjections are counted by listing the objects, permanents
// by summing over all permutations and by Ryser's formula (with operation counters), tilings by
// exhaustive search or an exact transfer-matrix count, and domino shuffling is implemented in full and
// tested against the exact tilings of small Aztec diamonds (uniform over all 2^{n(n+1)/2} of them).
import { binom, fact, perms } from './ch02.shared.js';
export * from './ch02.shared.js';

// ------------------------------------------------------------------ derangements and fixed points
/** D_n as a BigInt by D_n = n D_{n−1} + (−1)^n. */
export function derangeBig(n) { let d = 1n; for (let i = 1; i <= n; i++) d = BigInt(i) * d + (i % 2 ? -1n : 1n); return d; }
export const derange = (n) => Number(derangeBig(n));
export const factBig = (n) => { let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i; return r; };
export const binomBigInt = (n, k) => { if (k < 0 || k > n) return 0n; let r = 1n; for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i); return r; };
/** Exact P(a uniformly random permutation of [n] has exactly k fixed points) = C(n,k) D_{n−k} / n!, k = 0..n. */
export function fixedPointPmf(n) {
  const den = factBig(n), S = 10n ** 24n, out = [];
  for (let k = 0; k <= n; k++) out.push(Number((binomBigInt(n, k) * derangeBig(n - k) * S) / den) / 1e24);
  return out;
}
export const poissonPmf = (lam, k) => { let r = Math.exp(-lam); for (let i = 1; i <= k; i++) r *= lam / i; return r; };
/** Total-variation distance between the fixed-point law of S_n and Poisson(1). */
export function tvToPoisson(n) {
  const p = fixedPointPmf(n); let s = 0, mass = 0;
  for (let k = 0; k <= n; k++) { const q = poissonPmf(1, k); s += Math.abs(p[k] - q); mass += q; }
  return 0.5 * (s + (1 - mass));
}
export const fixedPoints = (w) => w.reduce((c, x, i) => c + (x === i ? 1 : 0), 0);

// ------------------------------------------------------------------ surjections
/** Σ_j (−1)^j C(k,j) (k−j)^n, as a BigInt. */
export function surjFormula(n, k) { let s = 0n; for (let j = 0; j <= k; j++) s += (j % 2 ? -1n : 1n) * binomBigInt(k, j) * BigInt(k - j) ** BigInt(n); return s; }
/** Number of surjections [n] → [k] by running through all k^n functions. */
export function surjBrute(n, k) {
  const f = Array(n).fill(0), seen = Array(k).fill(0); let cnt = 0, hit = 0; const total = k ** n;
  for (let t = 0; t < total; t++) {
    let x = t; seen.fill(0); hit = 0;
    for (let i = 0; i < n; i++) { const b = x % k; x = (x - b) / k; if (!seen[b]) { seen[b] = 1; hit++; } }
    if (hit === k) cnt++;
  }
  return cnt;
}

// ------------------------------------------------------------------ permanents
/** Naive permanent: sum over all n! permutations of the products of n entries. Returns {value, ops} (mults + adds). */
export function permNaive(A) {
  const n = A.length; let value = 0, ops = 0;
  const used = Array(n).fill(false);
  const go = (i, prod) => {
    if (i === n) { value += prod; ops++; return; }
    for (let j = 0; j < n; j++) if (!used[j]) { used[j] = true; if (i) ops++; go(i + 1, prod * A[i][j]); used[j] = false; }
  };
  go(0, 1);
  return { value, ops };
}
/** Ryser: Σ_{S≠∅} (−1)^{n−|S|} Π_i Σ_{j∈S} a_ij, with the number of additions and multiplications performed. */
export function permRyser(A) {
  const n = A.length; let value = 0, ops = 0; const terms = [];
  for (let mask = 1; mask < (1 << n); mask++) {
    let prod = 1, size = 0;
    for (let j = 0; j < n; j++) if (mask >> j & 1) size++;
    for (let i = 0; i < n; i++) {
      let r = 0; for (let j = 0; j < n; j++) if (mask >> j & 1) r += A[i][j];
      ops += size - 1; if (i) ops++; prod *= r;
    }
    const t = ((n - size) % 2 ? -1 : 1) * prod; value += t; ops++; terms.push({ mask, size, t });
  }
  return { value, ops, terms };
}

// ------------------------------------------------------------------ rook numbers
/** Rook numbers r_k of a set of forbidden squares B[i][j] (n×n booleans): placements of k non-attacking rooks on B. */
export function rookNumbers(B) {
  const n = B.length, r = Array(n + 1).fill(0), used = Array(n).fill(false);
  const go = (i, k) => {
    if (i === n) { r[k]++; return; }
    go(i + 1, k);
    for (let j = 0; j < n; j++) if (B[i][j] && !used[j]) { used[j] = true; go(i + 1, k + 1); used[j] = false; }
  };
  go(0, 0);
  return r;
}
/** All placements of exactly k non-attacking rooks on B, as lists of [row, col] (at most `cap`). */
export function rookPlacements(B, k, cap = 5000) {
  const n = B.length, out = [], used = Array(n).fill(false), cur = [];
  const go = (i) => {
    if (out.length >= cap) return;
    if (cur.length === k) { out.push(cur.slice()); return; }
    if (i === n || cur.length + (n - i) < k) return;
    go(i + 1);
    for (let j = 0; j < n; j++) if (B[i][j] && !used[j]) { used[j] = true; cur.push([i, j]); go(i + 1); cur.pop(); used[j] = false; }
  };
  go(0);
  return out;
}
/** Permutations of [n] with no w(i) = j on a forbidden square, by listing all n! permutations. */
export function avoidBrute(B) { const n = B.length; return perms(Array.from({ length: n }, (_, i) => i)).filter((w) => w.every((j, i) => !B[i][j])).length; }

// ------------------------------------------------------------------ ménage numbers
/** U_n = Σ_k (−1)^k [C(2n−k,k) + C(2n−k−1,k−1)] (n−k)!  (BigInt): seatings of the men once the women are seated. */
export function menageU(n) {
  let s = 0n;
  for (let k = 0; k <= n; k++) s += (k % 2 ? -1n : 1n) * (binomBigInt(2 * n - k, k) + binomBigInt(2 * n - k - 1, k - 1)) * factBig(n - k);
  return s;
}
/** Brute force: permutations σ of [n] with σ(i) ∉ {i, i+1 mod n} (man i may not take either neighbouring seat of his wife). */
export function menageBrute(n) {
  const used = Array(n).fill(false); let cnt = 0;
  const go = (i) => {
    if (i === n) { cnt++; return; }
    for (let j = 0; j < n; j++) if (!used[j] && j !== i && j !== (i + 1) % n) { used[j] = true; go(i + 1); used[j] = false; }
  };
  go(0);
  return cnt;
}

// ------------------------------------------------------------------ Franklin's involution on partitions into distinct parts
/** Partitions of n into distinct parts, each decreasing, in reverse lexicographic order. */
export function distinctPartitions(n) {
  const out = [], cur = [];
  const go = (rem, mx) => { if (rem === 0) { out.push(cur.slice()); return; } for (let p = Math.min(rem, mx); p >= 1; p--) { cur.push(p); go(rem - p, p - 1); cur.pop(); } };
  go(n, n);
  return out;
}
/** Franklin's involution: returns {mate, fixed}; a distinct partition of n is paired with one of opposite parity of length. */
export function franklin(l) {
  const m = l.length; if (!m) return { mate: l, fixed: true };
  const a = l[m - 1]; let b = 1; while (b < m && l[b] === l[b - 1] - 1) b++;
  if (a <= b) {
    if (a === b && b === m) return { mate: l, fixed: true };
    const r = l.slice(0, m - 1); for (let i = 0; i < a; i++) r[i]++;
    return { mate: r, fixed: false };
  }
  if (a === b + 1 && b === m) return { mate: l, fixed: true };
  const r = l.slice(); for (let i = 0; i < b; i++) r[i]--; r.push(b);
  return { mate: r, fixed: false };
}
/** Coefficients of Π_{k=1}^{n}(1 − x^k) up to x^n. */
export function eulerProduct(n) {
  let c = Array(n + 1).fill(0); c[0] = 1;
  for (let k = 1; k <= n; k++) for (let i = n; i >= k; i--) c[i] -= c[i - k];
  return c;
}

// ------------------------------------------------------------------ lattice paths and LGV
export const pathCount = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; return dx < 0 || dy < 0 ? 0 : binom(dx + dy, dx); };
/** Determinant of a small real matrix by Gaussian elimination (rounded for integer inputs). */
export function detNum(M) {
  const n = M.length, A = M.map((r) => r.slice()); let d = 1;
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-12) return 0;
    if (p !== c) { [A[p], A[c]] = [A[c], A[p]]; d = -d; }
    d *= A[c][c];
    for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; }
  }
  return Math.round(d);
}
/** Uniformly random E/N lattice path from a to b (as a list of points), or null if none. */
export function randomPath(rng, a, b) {
  let dx = b[0] - a[0], dy = b[1] - a[1]; if (dx < 0 || dy < 0) return null;
  const pts = [[a[0], a[1]]]; let x = a[0], y = a[1];
  while (dx + dy > 0) { if (rng() * (dx + dy) < dx) { x++; dx--; } else { y++; dy--; } pts.push([x, y]); }
  return pts;
}
/** Number of vertex-disjoint families of E/N paths A_i → B_σ(i), for every σ, by exhaustive search. Returns {bySigma, signed}. */
export function disjointFamilies(A, B) {
  const k = A.length, out = []; let signed = 0;
  for (const sg of perms(Array.from({ length: k }, (_, i) => i))) {
    let cnt = 0; const occ = new Set(); const key = (x, y) => x + ',' + y;
    const go = (i) => {
      if (i === k) { cnt++; return; }
      const t = B[sg[i]];
      if (occ.has(key(A[i][0], A[i][1]))) return;
      const walk = (x, y, taken) => {
        if (x === t[0] && y === t[1]) { go(i + 1); return; }
        if (x < t[0]) { const kk = key(x + 1, y); if (!occ.has(kk)) { occ.add(kk); walk(x + 1, y); occ.delete(kk); } }
        if (y < t[1]) { const kk = key(x, y + 1); if (!occ.has(kk)) { occ.add(kk); walk(x, y + 1); occ.delete(kk); } }
      };
      occ.add(key(A[i][0], A[i][1])); walk(A[i][0], A[i][1]); occ.delete(key(A[i][0], A[i][1]));
    };
    go(0);
    let inv = 0; for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) if (sg[i] > sg[j]) inv++;
    out.push({ sigma: sg, count: cnt, sign: inv % 2 ? -1 : 1 }); signed += (inv % 2 ? -1 : 1) * cnt;
  }
  return { bySigma: out, signed };
}

// ------------------------------------------------------------------ plane partitions in a box and lozenge tilings
/** MacMahon's product Π_{i≤a, j≤b} (i+j+c−1)/(i+j−1), as an exact integer (BigInt). */
export function macmahon(a, b, c) {
  let num = 1n, den = 1n;
  for (let i = 1; i <= a; i++) for (let j = 1; j <= b; j++) { num *= BigInt(i + j + c - 1); den *= BigInt(i + j - 1); }
  return num / den;
}
/** Number of plane partitions in the a×b×c box by exhaustive search (rows weakly decreasing, columns weakly decreasing, entries ≤ c). */
export function ppBrute(a, b, c) {
  const P = Array.from({ length: a }, () => Array(b).fill(0)); let cnt = 0;
  const go = (t) => {
    if (t === a * b) { cnt++; return; }
    const i = Math.floor(t / b), j = t % b;
    const hi = Math.min(c, i ? P[i - 1][j] : c, j ? P[i][j - 1] : c);
    for (let h = 0; h <= hi; h++) { P[i][j] = h; go(t + 1); }
  };
  go(0);
  return cnt;
}
const SQ3 = Math.sqrt(3) / 2;
/** Isometric projection of (x, y, z): the box corner at the origin recedes, the viewer looks from (+,+,+). */
export const iso = (x, y, z) => [(x - y) * SQ3, z - (x + y) / 2];
/**
 * The lozenge tiling of the a×b×c hexagon given by the plane partition P (a rows, b columns): each cube stack
 * is seen from the (1,1,1) direction. Faces: 'z' (tops), 'x' (facing +x, incl. the back wall x = 0), 'y'.
 * Faces of type x and y carry the midpoints of their two vertical edges (left, right) for path tracing.
 */
export function ppFaces(P, a, b, c) {
  const h = (i, j) => (i >= a || j >= b ? 0 : P[i][j]), F = [];
  for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) { const z = P[i][j]; F.push({ t: 'z', i, j, k: z, pts: [iso(i, j, z), iso(i + 1, j, z), iso(i + 1, j + 1, z), iso(i, j + 1, z)] }); }
  for (let j = 0; j < b; j++) {
    for (let i = 0; i < a; i++) for (let k = h(i + 1, j); k < P[i][j]; k++) F.push(xface(i + 1, j, k));
    for (let k = P[0][j]; k < c; k++) F.push(xface(0, j, k));
  }
  for (let i = 0; i < a; i++) {
    for (let j = 0; j < b; j++) for (let k = h(i, j + 1); k < P[i][j]; k++) F.push(yface(i, j + 1, k));
    for (let k = P[i][0]; k < c; k++) F.push(yface(i, 0, k));
  }
  return F;
  function xface(x, j, k) { return { t: 'x', pts: [iso(x, j, k), iso(x, j + 1, k), iso(x, j + 1, k + 1), iso(x, j, k + 1)], L: iso(x, j + 1, k + 0.5), R: iso(x, j, k + 0.5) }; }
  function yface(i, y, k) { return { t: 'y', pts: [iso(i, y, k), iso(i + 1, y, k), iso(i + 1, y, k + 1), iso(i, y, k + 1)], L: iso(i, y, k + 0.5), R: iso(i + 1, y, k + 0.5) }; }
}
/** The c non-intersecting paths that cross the x- and y-lozenges from the left vertical side to the right one. */
export function ppPaths(faces) {
  const key = (p) => Math.round(p[0] * 1000) + ',' + Math.round(p[1] * 1000);
  const byL = new Map(), rights = new Set();
  for (const f of faces) if (f.L) { byL.set(key(f.L), f); rights.add(key(f.R)); }
  const paths = [];
  for (const f of faces) if (f.L && !rights.has(key(f.L))) {
    const pts = [f.L]; let g = f;
    while (g) { pts.push(g.R); g = byL.get(key(g.R)); }
    paths.push(pts);
  }
  return paths;
}
/** One random flip: add or remove a cube from the plane partition (keeping it a plane partition). */
export function ppFlip(P, a, b, c, rng) {
  const i = Math.floor(rng() * a), j = Math.floor(rng() * b), up = rng() < 0.5;
  if (up) { if (P[i][j] < c && (!i || P[i - 1][j] > P[i][j]) && (!j || P[i][j - 1] > P[i][j])) { P[i][j]++; return true; } }
  else if (P[i][j] > 0 && (i + 1 >= a || P[i + 1][j] < P[i][j]) && (j + 1 >= b || P[i][j + 1] < P[i][j])) { P[i][j]--; return true; }
  return false;
}

// ------------------------------------------------------------------ Aztec diamonds and domino shuffling
/** Cell (x, y) = the unit square [x,x+1]×[y,y+1]; the Aztec diamond of order n is the set |x+½| + |y+½| ≤ n. */
export const inAz = (n, x, y) => Math.abs(x + 0.5) + Math.abs(y + 0.5) <= n;
export function azCells(n) { const c = []; for (let y = -n; y < n; y++) for (let x = -n; x < n; x++) if (inAz(n, x, y)) c.push([x, y]); return c; }
const kk = (x, y) => x + ',' + y;
/** A domino {x, y, h}: horizontal covers (x,y),(x+1,y); vertical covers (x,y),(x,y+1). Its shuffling direction N S E W. */
export function domType(d, n) {
  const even = (((d.x + d.y + n) % 2) + 2) % 2 === 0;
  return d.h ? (even ? 'N' : 'S') : (even ? 'E' : 'W');
}
export const domCells = (d) => [[d.x, d.y], [d.x + (d.h ? 1 : 0), d.y + (d.h ? 0 : 1)]];
/**
 * One step of domino shuffling: a tiling `til` of the order-n diamond → a tiling of order n+1.
 * 1. destroy the "bad blocks" (two dominoes in a 2×2 block that would slide into each other),
 * 2. slide every other domino one step in its direction (N S E W),
 * 3. fill each remaining 2×2 hole with two horizontal or two vertical dominoes by a fair coin.
 * `info` (optional) receives {bad, slid, created, n} for drawing the intermediate pictures.
 */
export function shuffleStep(til, n, rnd, info) {
  const occ = new Map(); til.forEach((d, i) => domCells(d).forEach(([x, y]) => occ.set(kk(x, y), i)));
  const bad = new Set();
  til.forEach((d, i) => {
    const t = domType(d, n);
    if (d.h && t === 'N') { const j = occ.get(kk(d.x, d.y + 1)); if (j != null && til[j].h && til[j].x === d.x) { bad.add(i); bad.add(j); } }
    if (!d.h && t === 'E') { const j = occ.get(kk(d.x + 1, d.y)); if (j != null && !til[j].h && til[j].y === d.y) { bad.add(i); bad.add(j); } }
  });
  const out = [], cov = new Set();
  til.forEach((d, i) => {
    if (bad.has(i)) return; const t = domType(d, n);
    out.push({ x: d.x + (t === 'E') - (t === 'W'), y: d.y + (t === 'N') - (t === 'S'), h: d.h });
  });
  const slid = out.slice();
  for (const e of out) domCells(e).forEach(([x, y]) => cov.add(kk(x, y)));
  const created = [];
  for (let y = -(n + 1); y < n + 1; y++) for (let x = -(n + 1); x < n + 1; x++) if (inAz(n + 1, x, y) && !cov.has(kk(x, y))) {
    const h = rnd() < 0.5, pair = h ? [{ x, y, h: true }, { x, y: y + 1, h: true }] : [{ x, y, h: false }, { x: x + 1, y, h: false }];
    for (const d of pair) { out.push(d); created.push(d); domCells(d).forEach(([cx, cy]) => cov.add(kk(cx, cy))); }
    cov.add(kk(x + 1, y)); cov.add(kk(x, y + 1)); cov.add(kk(x + 1, y + 1));
  }
  if (info) { info.bad = [...bad].map((i) => til[i]); info.slid = slid; info.created = created; info.n = n; }
  return out;
}
/** A uniformly random tiling of the order-n Aztec diamond, grown from order 0 by n shuffling steps. */
export function azRandom(n, rnd) { let t = []; for (let m = 0; m < n; m++) t = shuffleStep(t, m, rnd); return t; }
export function azValid(til, n) {
  const seen = new Set();
  for (const d of til) for (const [x, y] of domCells(d)) { if (!inAz(n, x, y) || seen.has(kk(x, y))) return false; seen.add(kk(x, y)); }
  return seen.size === azCells(n).length;
}
/** Exhaustive count of the domino tilings of the order-n Aztec diamond (n ≤ 5 is instant). */
export function azCount(n) {
  const cells = azCells(n).sort((p, q) => p[1] - q[1] || p[0] - q[0]), cov = new Set(); let cnt = 0;
  const go = (i) => {
    while (i < cells.length && cov.has(kk(...cells[i]))) i++;
    if (i === cells.length) { cnt++; return; }
    const [x, y] = cells[i];
    if (inAz(n, x + 1, y) && !cov.has(kk(x + 1, y))) { cov.add(kk(x, y)); cov.add(kk(x + 1, y)); go(i + 1); cov.delete(kk(x, y)); cov.delete(kk(x + 1, y)); }
    if (inAz(n, x, y + 1) && !cov.has(kk(x, y + 1))) { cov.add(kk(x, y)); cov.add(kk(x, y + 1)); go(i + 1); cov.delete(kk(x, y)); cov.delete(kk(x, y + 1)); }
  };
  go(0);
  return cnt;
}
/** Domino colours by direction (palette names). */
export const DIR_COLOR = { N: 'blue', S: 'orange', E: 'green', W: 'red' };

// ------------------------------------------------------------------ domino tilings of an m × n rectangle
/** Transfer-matrix (broken profile) data for an m-row, n-column board: ways(pos, mask) = completions. */
export function rectTable(m, n) {
  const memo = new Map();
  const ways = (pos, mask) => {
    if (pos === m * n) return mask === 0 ? 1 : 0;
    const key = pos * (1 << n) + mask, hit = memo.get(key); if (hit !== undefined) return hit;
    const col = pos % n; let r = 0;
    if (mask & 1) r = ways(pos + 1, mask >> 1);
    else {
      if (col + 1 < n && !(mask & 2)) r += ways(pos + 1, (mask >> 1) | 1);   // horizontal: covers the next cell too
      if (pos + n < m * n) r += ways(pos + 1, (mask >> 1) | (1 << (n - 1)));  // vertical: occupies the cell below
    }
    memo.set(key, r); return r;
  };
  return ways;
}
export const rectCount = (m, n) => (m * n) % 2 ? 0 : rectTable(m, n)(0, 0);
/** Uniformly random tiling of the m×n board: list of dominoes {x, y, h} (x = column, y = row from the top). */
export function rectSample(m, n, rnd) {
  const ways = rectTable(m, n), out = []; let mask = 0;
  for (let pos = 0; pos < m * n; pos++) {
    const col = pos % n, row = (pos - col) / n;
    if (mask & 1) { mask >>= 1; continue; }
    const h = col + 1 < n && !(mask & 2) ? ways(pos + 1, (mask >> 1) | 1) : 0;
    const vv = pos + n < m * n ? ways(pos + 1, (mask >> 1) | (1 << (n - 1))) : 0;
    if (rnd() * (h + vv) < h) { out.push({ x: col, y: row, h: true }); mask = (mask >> 1) | 1; }
    else { out.push({ x: col, y: row, h: false }); mask = (mask >> 1) | (1 << (n - 1)); }
  }
  return out;
}
/** Kasteleyn / Temperley–Fisher product Π_{j≤⌈m/2⌉, k≤⌈n/2⌉} (4cos²(πj/(m+1)) + 4cos²(πk/(n+1))), with its factors. */
export function kasteleynProduct(m, n) {
  const f = []; let p = 1;
  for (let j = 1; j <= Math.ceil(m / 2); j++) for (let k = 1; k <= Math.ceil(n / 2); k++) {
    const v = 4 * Math.cos(Math.PI * j / (m + 1)) ** 2 + 4 * Math.cos(Math.PI * k / (n + 1)) ** 2; f.push({ j, k, v }); p *= v;
  }
  return { value: p, factors: f };
}
