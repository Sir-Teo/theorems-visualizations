// Linear Algebra Done Right (Axler, 4th ed.) — Chapter 8: Operators on Complex Vector Spaces
// Part 2 (this file): 8.17–8.28 — eigenvalues of nilpotent operators, generalized eigenspaces and the
// generalized eigenspace decomposition, multiplicities and the characteristic polynomial.
// Part 1 is ch08.js (8.1–8.16, with the chapter title and summary); 8.29–8.57 live in later part files.

// =====================================================================================================
// Shared helpers
// =====================================================================================================
/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
const pn = (x, d = 2) => tn(x, d).replace('-', '−');
const vtex = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\,')})`;

// ---------- real vectors and matrices ----------
const dotN = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const normN = (a) => Math.hypot(...a);
const addN = (a, b) => a.map((x, i) => x + b[i]);
const subN = (a, b) => a.map((x, i) => x - b[i]);
const sclN = (a, k) => a.map((x) => x * k);
const mv = (A, x) => A.map((r) => dotN(r, x));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
const ident = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const zerosM = (n, m = n) => Array.from({ length: n }, () => new Array(m).fill(0));
const shiftI = (A, t) => A.map((r, i) => r.map((x, j) => (i === j ? x - t : x)));
const mpow = (A, k) => { let P = ident(A.length); for (let i = 0; i < k; i++) P = mm(P, A); return P; };
const maxAbs = (A) => Math.max(0, ...A.flat().map(Math.abs));
const fromCols = (cols) => cols[0].map((_, i) => cols.map((c) => c[i]));
const colOf = (A, j) => A.map((r) => r[j]);
const conjM = (M, S, J) => mm(mm(S, J), M.inverse(S));
const traceN = (A) => A.reduce((s, r, i) => s + r[i], 0);
function orthN(vs, tol = 1e-7) {
  const B = [];
  for (const x of vs) {
    let w = x.slice();
    for (let p = 0; p < 2; p++) for (const e of B) { const d = dotN(w, e); w = w.map((c, i) => c - d * e[i]); }
    const l = normN(w); if (l > tol * Math.max(1, normN(x))) B.push(w.map((c) => c / l));
  }
  return B;
}
const projN = (x, B) => B.reduce((s, e) => addN(s, sclN(e, dotN(x, e))), x.map(() => 0));
function nullO(M, A, tol = 1e-9) {
  if (maxAbs(A) < 1e-13) return ident(A[0].length);
  const S = M.svd(A).S;
  return M.nullspace(A, tol * Math.max(1, S[0]));
}
function nullRref(M, A) {
  const n = A[0].length, { R, pivots } = M.rref(A);
  const free = []; for (let j = 0; j < n; j++) if (!pivots.includes(j)) free.push(j);
  return free.map((f) => { const x = new Array(n).fill(0); x[f] = 1; pivots.forEach((p, r) => { x[p] = -R[r][f]; }); return x; });
}
// exact rank of integer matrices, modulo a prime p with p² < 2⁵³
const PR = 67108859;
const modp = (x) => { const r = Math.round(x) % PR; return r < 0 ? r + PR : r; };
function invmod(a) { let [r0, r1, s0, s1] = [PR, a, 0, 1]; while (r1) { const q = Math.floor(r0 / r1); [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; } return modp(s0); }
const mulModM = (A, B) => A.map((r) => B[0].map((_, j) => { let s = 0; for (let k = 0; k < r.length; k++) s = (s + r[k] * B[k][j]) % PR; return s; }));
function rankInt(A) {
  const R = A.map((r) => r.map(modp)), m = R.length, n = R[0].length; let rk = 0;
  for (let c = 0; c < n && rk < m; c++) {
    let p = -1; for (let i = rk; i < m; i++) if (R[i][c]) { p = i; break; }
    if (p < 0) continue;
    [R[p], R[rk]] = [R[rk], R[p]];
    const iv = invmod(R[rk][c]);
    for (let i = rk + 1; i < m; i++) if (R[i][c]) { const f = (R[i][c] * iv) % PR; for (let k = c; k < n; k++) R[i][k] = modp(R[i][k] - ((f * R[rk][k]) % PR)); }
    rk++;
  }
  return rk;
}
/** dim null A^k for k = 0..K, A an integer matrix — exact. */
function nullDimsInt(A, K) {
  const n = A.length, Am = A.map((r) => r.map(modp)), out = [0]; let P = ident(n);
  for (let k = 1; k <= K; k++) { P = mulModM(P, Am); out.push(n - rankInt(P)); }
  return out;
}

// ---------- polynomials (ascending coefficient lists) ----------
function polyT(c, v = 'z', d = 2) {
  let s = '';
  for (let k = c.length - 1; k >= 0; k--) {
    const a = Number(c[k].toFixed(d)); if (a === 0) continue;
    const mag = Math.abs(a) === 1 && k > 0 ? '' : tn(Math.abs(a), d);
    const mon = k === 0 ? '' : k === 1 ? v : `${v}^{${k}}`;
    s += s ? ` ${a < 0 ? '-' : '+'} ${mag}${mon}` : `${a < 0 ? '-' : ''}${mag}${mon}`;
  }
  return s || '0';
}
/** Minimal polynomial from the definition: the first power A^k in span(I, …, A^{k−1}) (least squares). */
function minPoly(M, A, tol = 1e-7) {
  const n = A.length, scale = Math.max(1, maxAbs(A)), B = A.map((r) => r.map((x) => x / scale));
  const pw = [ident(n)], vecs = [ident(n).flat()];
  for (let k = 1; k <= n; k++) {
    const P = mm(B, pw[k - 1]), x = P.flat(), G = fromCols(vecs), c = M.lstsq(G, x);
    const res = normN(mv(G, c).map((y, i) => y - x[i]));
    if (res <= tol * Math.max(1, normN(x))) return [...c.map((t, j) => -t * scale ** (k - j)), 1];
    pw.push(P); vecs.push(x);
  }
  return [...new Array(n).fill(0), 1];
}
/** All zeros of a polynomial with real ascending coefficients: exact zeros at 0, the rest after rescaling z = ρw. */
function zerosOf(M, pc) {
  let z0 = 0; while (z0 < pc.length - 1 && pc[z0] === 0) z0++;
  const c = pc.slice(z0), out = Array.from({ length: z0 }, () => [0, 0]), n = c.length - 1;
  if (n < 1) return out;
  const a = c.map((x) => x / c[n]); let rho = 0;
  for (let k = 1; k <= n; k++) rho = Math.max(rho, Math.pow(Math.abs(a[n - k]), 1 / k));
  rho = rho || 1;
  return out.concat(M.polyRoots(a.map((x, k) => x / Math.pow(rho, n - k))).map((w) => [w.re * rho, Math.abs(w.im * rho) < 1e-12 ? 0 : w.im * rho]));
}

// ---------- complex numbers [re, im] and complex matrices ----------
const cadd = (z, w) => [z[0] + w[0], z[1] + w[1]];
const csub = (z, w) => [z[0] - w[0], z[1] - w[1]];
const cmul = (z, w) => [z[0] * w[0] - z[1] * w[1], z[0] * w[1] + z[1] * w[0]];
const csc = (z, k) => [z[0] * k, z[1] * k];
const cconj = (z) => [z[0], -z[1]];
const cabs = (z) => Math.hypot(z[0], z[1]);
function cdiv(z, w) { const d = w[0] * w[0] + w[1] * w[1]; return [(z[0] * w[0] + z[1] * w[1]) / d, (z[1] * w[0] - z[0] * w[1]) / d]; }
const cNorm = (x) => Math.sqrt(x.reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
const cIP = (x, y) => x.reduce((s, z, k) => cadd(s, cmul(z, cconj(y[k]))), [0, 0]);
const cMV = (A, x) => A.map((r) => r.reduce((s, z, k) => cadd(s, cmul(z, x[k])), [0, 0]));
const cMM = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, z, k) => cadd(s, cmul(z, B[k][j])), [0, 0])));
const cShift = (A, l) => A.map((r, i) => r.map((z, j) => (i === j ? csub(z, l) : z)));
const cIdent = (n) => ident(n).map((r) => r.map((x) => [x, 0]));
const cMaxAbs = (A) => Math.max(0, ...A.flat().map(cabs));
function cInv(M, A) { const n = A.length; const cols = ident(n).map((e) => M.solveC(A, e).map((z) => [z.re, z.im])); return A.map((_, i) => cols.map((c) => c[i])); }
function czT(z, d = 2) {
  const a = Number(z[0].toFixed(d)), b = Number(z[1].toFixed(d));
  if (b === 0) return tn(a, d);
  const bb = Math.abs(b) === 1 ? '' : tn(Math.abs(b), d);
  if (a === 0) return `${b < 0 ? '-' : ''}${bb}i`;
  return `${tn(a, d)} ${b < 0 ? '-' : '+'} ${bb}i`;
}
/** The real 2n×2m matrix of a complex n×m matrix (x + iy ↦ (x, y)). */
function realify(A) {
  const n = A.length, m = A[0].length, R = zerosM(2 * n, 2 * m);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const [a, b] = A[i][j]; R[i][j] = a; R[i][j + m] = -b; R[i + n][j] = b; R[i + n][j + m] = a; }
  return R;
}
/** Complex Gram–Schmidt (twice); vectors already in the span are skipped. */
function cOrth(vs, tol = 1e-7) {
  const B = [];
  for (const x of vs) {
    let w = x.map((z) => z.slice());
    for (let p = 0; p < 2; p++) for (const e of B) { const d = cIP(w, e); w = w.map((z, i) => csub(z, cmul(d, e[i]))); }
    const l = cNorm(w); if (l > tol * Math.max(1, cNorm(x))) B.push(w.map((z) => csc(z, 1 / l)));
  }
  return B;
}
/** Complex rank (via the realified matrix and its singular values, relative tolerance). */
function cRank(M, A, tol = 1e-8, floor = 1e-14) {
  if (cMaxAbs(A) < floor) return 0;
  const S = M.svd(realify(A)).S, t = Math.max(tol * S[0], floor);
  return Math.round(S.filter((s) => s > t).length / 2);
}
/** Orthonormal basis of the complex null space of A. */
function cNullO(M, A, tol = 1e-8, floor = 1e-14) {
  const m = A[0].length;
  if (cMaxAbs(A) < floor) return cIdent(m);
  const R = realify(A), S = M.svd(R).S, N = M.nullspace(R, Math.max(tol * S[0], floor));
  return cOrth(N.map((v) => Array.from({ length: m }, (_, i) => [v[i], v[i + m]])), 1e-6);
}
/** Group nearby eigenvalues (as [re, im]); each cluster is replaced by its mean (accurate even for defective ones). */
function clusters(vals, tol = 1e-3) {
  const out = [];
  for (const z of vals) { const g = out.find((q) => cabs(csub(csc(q.s, 1 / q.c), z)) < tol); if (g) { g.s = cadd(g.s, z); g.c++; } else out.push({ s: z.slice(), c: 1 }); }
  return out.map((q) => ({ z: csc(q.s, 1 / q.c), count: q.c }));
}
/** dim null (T − μI)^k for k = 0, 1, … until two consecutive agree (by 8.2 they then stay equal). Last entry = dim G(μ, T). */
function genDims(M, T, mu) {
  // null (T − μI)^k = {x : (T − μI)x ∈ null (T − μI)^{k−1}} = null of P⊥(T − μI), with P⊥ the orthogonal projection onto
  // the complement of the previous null space — no high powers, so no loss of accuracy
  const n = T.length, A = cShift(T, mu), d = [0], floor = 1e-9 * Math.max(1, Math.sqrt(A.flat().reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0)));
  let B = [];
  for (let k = 1; k <= n; k++) {
    const C = A.map((r) => r.slice());
    for (const b of B) { // C ← (I − b b*) C
      const w = C[0].map((_, j) => b.reduce((s, z, i) => cadd(s, cmul(cconj(z), C[i][j])), [0, 0]));
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) C[i][j] = csub(C[i][j], cmul(b[i], w[j]));
    }
    B = cNullO(M, C, 1e-9, floor);
    d.push(B.length);
    if (d[k] === d[k - 1]) break;
  }
  return d;
}
/** tr((zI − T)⁻¹) by Gauss–Jordan elimination with partial pivoting. */
function traceResolvent(T, z) {
  const n = T.length, A = T.map((r, i) => [...r.map((x, k) => (i === k ? csub(z, x) : csc(x, -1))), ...ident(n)[i].map((x) => [x, 0])]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let i = c + 1; i < n; i++) if (cabs(A[i][c]) > cabs(A[p][c])) p = i;
    [A[c], A[p]] = [A[p], A[c]];
    const iv = cdiv([1, 0], A[c][c]); A[c] = A[c].map((w) => cmul(w, iv));
    for (let i = 0; i < n; i++) if (i !== c) { const f = A[i][c]; if (f[0] || f[1]) A[i] = A[i].map((w, k) => csub(w, cmul(f, A[c][k]))); }
  }
  let tr = [0, 0]; for (let i = 0; i < n; i++) tr = cadd(tr, A[i][n + i]);
  return tr;
}
/**
 * Mean of the eigenvalues inside the circle |z − c| = r, by the argument principle: with R(z) = (zI − T)⁻¹,
 * (1/2πi)∮ tr R(z) dz counts them and (1/2πi)∮ z tr R(z) dz adds them up (trapezoid rule, N nodes).
 * Accurate even for a defective eigenvalue, whose computed roots form a small ring.
 */
function contourMean(T, c, r, N = 32) {
  let s0 = [0, 0], s1 = [0, 0];
  for (let j = 0; j < N; j++) {
    const th = (2 * Math.PI * j) / N, w = [r * Math.cos(th), r * Math.sin(th)], z = cadd(c, w), f = traceResolvent(T, z);
    s0 = cadd(s0, cmul(f, w)); s1 = cadd(s1, cmul(cmul(z, f), w));
  }
  return { count: Math.round(s0[0] / N), mean: cdiv(s1, s0) };
}
/** Eigenvalues of a complex matrix, clustered and sharpened, with algebraic (dim G) and geometric (dim E) multiplicities, all computed. */
function eigenData(M, T) {
  // A multiple eigenvalue comes out of any root finder as a little ring of nearby roots (radius ~ ε^{1/k}); group them
  // loosely first, and accept a grouping only when every group's computed multiplicity equals its number of roots.
  const vals = M.eigC(T, { vectors: false }).values.map((z) => [z.re, z.im]);
  let best = null;
  for (const tol of [0.06, 1e-2, 1e-3, 1e-5]) {
    const cl = clusters(vals, tol);
    const out = cl.map((c) => {
      const gap = Math.min(1.25, ...cl.filter((o) => o !== c).map((o) => cabs(csub(o.z, c.z))));
      const z = contourMean(T, c.z, 0.4 * gap).mean, d = genDims(M, T, z); return { z, count: c.count, alg: d[d.length - 1], geo: d[1] ?? 0, dims: d }; });
    if (!best) best = out;
    if (out.every((e) => e.alg === e.count)) { best = out; break; }
  }
  return best.sort((a, b) => a.z[0] - b.z[0] || a.z[1] - b.z[1]);
}
/** Random complex matrix close to the identity (well conditioned), from a seeded rng. */
const randS = (r, n, amp = 0.55) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => [(i === j ? 1 : 0) + r.uniform(-amp, amp), r.uniform(-amp, amp)]));
/** Random unitary matrix (Gram–Schmidt on random complex vectors). */
const randU = (r, n) => fromCols(cOrth(Array.from({ length: n }, () => Array.from({ length: n }, () => [r.uniform(-1, 1), r.uniform(-1, 1)]))));
/** Complex matrix with Jordan blocks: blocks = [[λ, size], …]. */
function jordanC(blocks) {
  const n = blocks.reduce((s, b) => s + b[1], 0), J = zerosM(n).map((r) => r.map(() => [0, 0])); let o = 0;
  for (const [l, k] of blocks) { for (let i = 0; i < k; i++) { J[o + i][o + i] = l.slice(); if (i + 1 < k) J[o + i][o + i + 1] = [1, 0]; } o += k; }
  return J;
}
/** Ascending complex coefficients of ∏ (z − λ_k)^{d_k}. */
function polyFromMult(list) {
  let c = [[1, 0]];
  for (const { z, d } of list) for (let t = 0; t < d; t++) { const nc = Array.from({ length: c.length + 1 }, () => [0, 0]); c.forEach((a, k) => { nc[k + 1] = cadd(nc[k + 1], a); nc[k] = csub(nc[k], cmul(a, z)); }); c = nc; }
  return c;
}
const cPolyEval = (c, z) => c.reduceRight((acc, a) => cadd(cmul(acc, z), a), [0, 0]);
/** (z − λ)^d, factored, as TeX. */
const factorT = (list, v = 'z') => list.map(({ z, d }) => {
  const re = Number(z[0].toFixed(2)), im = Number(z[1].toFixed(2));
  const b = im !== 0 ? `(${v} - (${czT(z)}))` : re === 0 ? v : `(${v} ${re > 0 ? '-' : '+'} ${tn(Math.abs(re))})`;
  return d > 1 ? `${b}^{${d}}` : b;
}).join('');
function cPolyT(c, d = 2) {
  let s = '';
  for (let k = c.length - 1; k >= 0; k--) {
    const z = [Number(c[k][0].toFixed(d)), Number(c[k][1].toFixed(d))]; if (z[0] === 0 && z[1] === 0) continue;
    const mon = k === 0 ? '' : k === 1 ? 'z' : `z^{${k}}`, real = z[1] === 0, one = real && Math.abs(z[0]) === 1 && k > 0;
    if (real) s += `${s ? (z[0] < 0 ? ' - ' : ' + ') : z[0] < 0 ? '-' : ''}${one ? '' : tn(Math.abs(z[0]), d)}${mon}`;
    else s += `${s ? ' + ' : ''}(${czT(z, d)})${mon}`;
  }
  return s || '0';
}

// ---------- drawing helpers ----------
function drawSpan(sc, B, st = {}) {
  const col = st.color || 'green', R = st.r ?? 1.7;
  if (B.length === 0) sc.dot([0, 0, 0], { color: col, r: st.dotR ?? 6 });
  else if (B.length === 1) sc.line(sclN(B[0], -R), sclN(B[0], R), { color: col, width: st.width ?? 3.6, alpha: st.alpha ?? 0.75 }, 16);
  else if (B.length === 2) sc.disc(B[0], B[1], R, { fill: col, color: col, fillAlpha: st.fillAlpha ?? 0.14, grid: st.grid ?? true });
  else {
    const c = st.box ?? 1.15, F = (k, sg) => { const p = [0, 0, 0]; p[k] = sg * c; return [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([x, y]) => { const q = p.slice(); q[(k + 1) % 3] = x * c; q[(k + 2) % 3] = y * c; return q; }); };
    for (let k = 0; k < 3; k++) for (const sg of [-1, 1]) sc.poly(F(k, sg), { fill: col, color: col, fillAlpha: 0.035, alpha: 0.3 });
  }
  return B.length;
}
function editable(v, s, T, get, o = {}) {
  const step = o.step ?? 1, lo = o.min ?? -9, hi = o.max ?? 9;
  let d = null;
  const put = (i, j, x) => { get()[i][j] = Math.round(v.M.clamp(x, lo, hi) / step) * step; o.onChange?.(i, j); };
  s.onDrag((x, y, ph) => {
    if (ph === 'start') {
      const c = T.hit(x, y);
      d = c && c.i >= 0 && c.j >= 0 && (!o.ok || o.ok(c.i, c.j)) ? { ...c, Y: s.Y(y), a: get()[c.i][c.j], moved: false } : null;
      if (c && o.onPick) o.onPick(c);
      return;
    }
    if (!d) return;
    const dy = d.Y - s.Y(y);
    if (ph === 'move' && (d.moved || Math.abs(dy) > 5)) { d.moved = true; put(d.i, d.j, d.a + Math.round(dy / 14) * step); }
    if (ph === 'end') {
      if (!d.moved) { const r = T.cellRect(d.i, d.j); put(d.i, d.j, d.a + (y > (r[1] + r[3]) / 2 ? step : -step)); }
      d = null;
    }
  });
}
/** A complex matrix as a grid of little copies of C, each entry an arrow (guide circle radius ↔ |z| = sc). */
function phasorTile(S, A, x0, y0, w, { frame = 'muted', frameW, sc = 1, color = 'accent', colorFn } = {}) {
  const m = A.length, n = A[0].length, cw = w / n, R = 0.4 * cw, k = R / sc;
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    const cx = x0 + (j + 0.5) * cw, cy = y0 + (m - i - 0.5) * cw, z = A[i][j], col = colorFn ? colorFn(i, j) : color;
    S.circle(cx, cy, R, { color: 'faint', width: 0.8, alpha: 0.6 });
    if (cabs(z) * k > 0.012 * cw) S.arrow(cx, cy, cx + z[0] * k, cy + z[1] * k, { color: col, width: 1.8, head: 6 });
    else S.dot(cx, cy, { r: 1.6, color: 'faint' });
  }
  S.rect(x0, y0, x0 + n * cw, y0 + m * cw, { color: frame, width: frameW ?? (frame === 'muted' ? 1.1 : 2.4) });
}
const PAL = ['blue', 'orange', 'teal', 'pink', 'purple', 'gold', 'green', 'red'];

export default {
  collection: 'ladr',
  chapter: 8,
  items: [
    // ------------------------------------------------------------------ 8.17
    {
      num: '8.17',
      kind: 'Theorem',
      name: 'Eigenvalues of a nilpotent operator',
      statement: String.raw`Suppose $T \in \mathcal L(V)$.
(a) If $T$ is nilpotent, then $0$ is an eigenvalue of $T$ and $T$ has no other eigenvalues.
(b) If $\mathbf F = \mathbf C$ and $0$ is the only eigenvalue of $T$, then $T$ is nilpotent.`,
      idea: String.raw`(a) If $T^m = 0$, then $T$ is not injective (otherwise $T^m$ would be), so $0$ is an eigenvalue; and if $Tv = \lambda v$ with $v \ne 0$, applying $T$ again and again gives $\lambda^m v = T^m v = 0$, so $\lambda = 0$. (b) The zeros of the minimal polynomial are exactly the eigenvalues (5.27). Over $\mathbf C$ the minimal polynomial splits into linear factors, so with $0$ as its only zero it is $z^m$, and $T^m = 0$. Over $\mathbf R$ this fails: a rotation block contributes a factor $z^2 + 1$ with no real zero.`,
      caption: String.raw`The matrix on the left is nilpotent, its structure hidden by an integer change of basis. Its eigenvalues — the zeros of its characteristic polynomial, computed exactly from the entries — all sit at $0$ (right), and the bars under the matrix show $\|T^k\|$ dropping to exactly $0$. Switch on the nudge to add a tiny $\varepsilon$ to one entry (click a cell to choose which): $0$ bursts into a ring of nonzero eigenvalues of radius about $\varepsilon^{1/n}$ — even $\varepsilon = 10^{-8}$ moves them visibly — and no power vanishes any more. The last operator is real with $0$ as its only real eigenvalue, yet not nilpotent: its other eigenvalues $\pm i$ are not in $\mathbf R$.`,
      deps: ['ladr-8.14', 'ladr-5.27', 'ladr-5.5'],
      tags: ['nilpotent', 'eigenvalues'],
      viz(v) {
        const M = v.M;
        const PRE = {
          n4: [[-1, -1, 1, 0], [-1, 1, 1, -1], [-1, -2, 1, 1], [-1, 1, 1, -1]],
          n5: [[-4, 1, -2, 3, -1], [1, 0, 1, -1, -1], [4, -1, 2, -2, 2], [-2, 1, -1, 3, 1], [2, -1, 1, -3, -1]],
          real: [[0, -1, 0], [1, -1, 1], [1, -1, 1]],
        };
        let cell = [3, 0];
        const pre = v.select('$T$', [{ value: 'n4', label: 'nilpotent $4\\times4$' }, { value: 'n5', label: 'nilpotent $5\\times5$' }, { value: 'real', label: 'real; $0$ the only real eigenvalue' }], 'n4', { onChange: (k) => { cell = [PRE[k].length - 1, 0]; } });
        const nud = v.toggle('nudge one entry by $\\varepsilon$', false);
        const eS = v.slider('$\\varepsilon$', 1e-10, 0.1, 1e-6, { log: true, fmt: (x) => x.toExponential(0) });
        const Q = v.stage({ x: [0, 1], y: [0, 1.32], axes: false, height: 370, weight: 0.85, minWidth: 240, title: '$\\mathcal M(T)$ and $\\|T^k\\|$ for $k = 1, \\dots, 7$' });
        const Z = v.stage({ x: [-1.4, 1.4], y: [-1.1, 1.1], equal: true, height: 370, weight: 1.15, xlabel: 'Re', ylabel: 'Im', title: 'the eigenvalues of $T$ in $\\mathbf C$' });
        let TT = null, TTn = 0;
        Q.onClick((x, y) => { const c = TT && TT.hit(x, y); if (c && c.i >= 0 && c.j >= 0) cell = [c.i, c.j]; });
        /** Faddeev–LeVerrier: char. polynomial coefficients c (ascending) and matrices M_k with adj(zI − T) = Σ M_k z^{n−k}. */
        const flv = (T) => {
          const n = T.length, c = new Array(n + 1).fill(0), Ms = []; c[n] = 1; let Mk = zerosM(n);
          for (let k = 1; k <= n; k++) { Mk = mm(T, Mk); for (let i = 0; i < n; i++) Mk[i][i] += c[n - k + 1]; Ms.push(Mk); c[n - k] = Math.round(-traceN(mm(T, Mk)) / k); }
          return { c, Ms };
        };
        let st = null;
        v.render(() => {
          const T = PRE[pre.value], n = T.length, on = nud.value, eps = on ? eS.value : 0;
          eS.el.hidden = !on;
          if (!TT || TTn !== n) { TT = v.table(Q, { rows: n, cols: n, region: [0.06, 0.5, 0.94, 1.3], maxCell: 50, size: 14 }); TTn = n; }
          const [ci, cj] = cell;
          TT.draw({
            value: (i, j) => (on && i === ci && j === cj ? `${pn(T[i][j], 0)}+ε` : T[i][j]), format: (x) => (typeof x === 'string' ? x : pn(x, 0)),
            fill: (i, j) => (on && i === ci && j === cj ? ['orange', 0.35] : T[i][j] ? ['accent', 0.07] : null),
            textColor: (i, j) => (on && i === ci && j === cj ? 'orange' : T[i][j] ? 'ink' : 'faint'), size: on ? 12.5 : 14,
          });
          // exact characteristic polynomial of T + εE_ij: det(zI − T) − ε·adj(zI − T)_ji
          const { c, Ms } = flv(T), pc = c.slice();
          if (eps) for (let m = 0; m < n; m++) pc[m] -= eps * Ms[n - m - 1][cj][ci];
          const ev = zerosOf(M, pc);
          // powers of the actual (nudged) matrix
          const Tn = T.map((r, i) => r.map((x, j) => x + (i === ci && j === cj ? eps : 0)));
          const norms = []; let P = ident(n);
          for (let k = 1; k <= 7; k++) { P = mm(P, Tn); norms.push(Math.sqrt(P.flat().reduce((s, x) => s + x * x, 0))); }
          // bars: log10 ‖T^k‖ mapped from [−10, 2] to [0.06, 0.42]
          const yOf = (x) => 0.06 + ((M.clamp(Math.log10(x), -10, 2) + 10) / 12) * 0.36;
          [[0, '1'], [-4, '10⁻⁴'], [-8, '10⁻⁸']].forEach(([e, lab]) => { Q.line(0.12, yOf(10 ** e), 0.96, yOf(10 ** e), { color: 'grid', width: 0.8 }); Q.text(lab, 0.1, yOf(10 ** e), { align: 'right', size: 10, color: 'muted' }); });
          norms.forEach((x, k) => {
            const xc = 0.18 + k * 0.115;
            if (x === 0) { Q.dot(xc, 0.075, { r: 4.5, color: 'green' }); Q.text('0', xc, 0.12, { align: 'center', size: 11, color: 'green', weight: 700 }); }
            else Q.rect(xc - 0.035, 0.06, xc + 0.035, yOf(x), { fill: x < 1e-9 ? 'orange' : 'accent', fillAlpha: 0.5, color: x < 1e-9 ? 'orange' : 'accent', width: 1 });
            Q.text(String(k + 1), xc, 0.025, { align: 'center', size: 10, color: 'muted' });
          });
          // eigenvalues in C
          const rmax = Math.max(0, ...ev.map(cabs)), R = rmax > 0 ? rmax * 1.55 : 1;
          Z.setView([-1.4 * R, 1.4 * R], [-1.1 * R, 1.1 * R]);
          if (on && rmax > 0 && pre.value !== 'real') Z.circle(0, 0, rmax, { color: 'orange', dash: [5, 4], width: 1.2 });
          const zeros = ev.filter((z) => cabs(z) === 0).length;
          ev.forEach((z) => { if (cabs(z) > 0) Z.dot(z[0], z[1], { r: 6, color: pre.value === 'real' && Math.abs(z[1]) > 0 && !on ? 'red' : on ? 'orange' : 'accent' }); });
          if (zeros) { Z.dot(0, 0, { r: 7.5, color: 'green' }); Z.tex(zeros > 1 ? `0\\ (\\times ${zeros})` : '0', 0, 0, { color: 'green', size: 14, dx: 14, dy: -14, align: 'left' }); }
          if (pre.value === 'real' && !on) ev.filter((z) => Math.abs(z[1]) > 1e-9).forEach((z) => Z.tex(z[1] > 0 ? 'i \\notin \\mathbf R' : '-i \\notin \\mathbf R', z[0], z[1], { color: 'red', size: 13, dx: 14, align: 'left' }));
          st = { n, ev, rmax, norms, eps, zeros, pc };
        });
        v.legend([['green', 'eigenvalue $0$', { dot: true }], ['orange', 'after the nudge', { dot: true }], ['accent', '$\\|T^k\\|$ (log scale)', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { n, ev, rmax, norms, eps, zeros } = st;
          if (pre.value === 'real' && !eps) return `Characteristic polynomial $${polyT(st.pc)} = z(z^2 + 1)$: eigenvalues $0, \\pm i$. Over $\\mathbf R$ the only eigenvalue is $0$, but $\\|T^k\\|$ stays at $${tn(norms[6], 3)}$ for $k = 7$ — **not nilpotent**: (b) needs $\\mathbf F = \\mathbf C$.`;
          if (!eps) return `Characteristic polynomial $z^{${n}}$: all ${zeros} eigenvalues are exactly $0$, and $T^{${norms.findIndex((x) => x === 0) + 1}} = 0$ exactly. **Nilpotent, and $0$ is the only eigenvalue.**`;
          return `After adding $\\varepsilon = ${v.sci(eps, 1)}$: the eigenvalues have moduli up to $${v.sci(rmax, 2)}$ (compare $\\varepsilon^{1/${n}} = ${v.sci(Math.pow(eps, 1 / n), 2)}$), ${zeros ? `with $${zeros}$ still at $0$` : 'none of them $0$'}, and $\\|T^{7}\\| = ${v.sci(norms[6], 1)} \\ne 0$: **the nudged matrix is not nilpotent.**`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.18
    {
      num: '8.18',
      kind: 'Theorem',
      name: 'Nilpotent ⟺ minimal polynomial zᵐ ⟺ strictly triangular',
      statement: String.raw`Suppose $T \in \mathcal L(V)$. The following are equivalent:
(a) $T$ is nilpotent;
(b) the minimal polynomial of $T$ is $z^m$ for some positive integer $m$;
(c) $V$ has a basis with respect to which the matrix of $T$ is strictly upper triangular — all entries on and below the diagonal are $0$.`,
      idea: String.raw`(a) ⇒ (b): if $T^k = 0$, then $z^k$ is a multiple of the minimal polynomial (5.29), which must therefore be a power of $z$. (b) ⇒ (c): the zeros of the minimal polynomial are the eigenvalues (5.27), so $0$ is the only eigenvalue; since $z^m$ splits, $T$ has an upper-triangular matrix (5.44) whose diagonal holds the eigenvalues (5.41) — all $0$. (c) ⇒ (a): a strictly upper-triangular matrix satisfies $T^{\dim V} = 0$ (5.40). A concrete basis for (c): start with a basis of $\operatorname{null}T$, extend it to one of $\operatorname{null}T^2$, and so on; $T$ maps each $\operatorname{null}T^{k+1}$ into $\operatorname{null}T^k$, so each new basis vector is sent into the span of the earlier ones.`,
      caption: String.raw`Edit the matrix of $T$ (click the top or bottom half of an entry, or drag it), or pick a preset. The three lamps test (a), (b) and (c) independently — $T^k$ computed exactly, the minimal polynomial computed from its definition, and a basis built from the chain of null spaces (right) — and they always light up or go dark together. When $T$ is nilpotent, the chain of null spaces reaches all of $\mathbf F^3$ and the matrix of $T$ in the adapted basis has zeros (green) on and below the diagonal. Change one entry and the chain stops short.`,
      deps: ['ladr-8.14', 'ladr-5.29', 'ladr-5.27', 'ladr-5.44', 'ladr-5.41', 'ladr-5.40'],
      tags: ['nilpotent', 'minimal polynomial'],
      viz(v) {
        const M = v.M;
        const PRE = { z3: [[-3, 9, 0], [-7, 9, 6], [4, 0, -6]], z2: [[1, 0, 1], [2, 0, 2], [-1, 0, -1]], not: [[-3, 9, 0], [-7, 9, 6], [4, 0, -5]] };
        let A = PRE.z3.map((r) => r.slice());
        v.select('preset', [{ value: 'z3', label: 'nilpotent (Example 8.15)' }, { value: 'z2', label: 'nilpotent, rank one' }, { value: 'not', label: 'one entry changed' }], 'z3', { onChange: (k) => { A = PRE[k].map((r) => r.slice()); } });
        const L = v.stage({ x: [0, 1], y: [0, 1.22], axes: false, height: 370, title: '$\\mathcal M(T)$ (editable) and the three conditions' });
        const R = v.stage({ x: [0, 1], y: [0, 1.22], axes: false, height: 370, title: 'in the basis adapted to $\\operatorname{null}T \\subseteq \\operatorname{null}T^2 \\subseteq \\operatorname{null}T^3$' });
        const TA = v.table(L, { rows: 3, cols: 3, region: [0.22, 0.6, 0.78, 1.18], maxCell: 50, size: 15 });
        editable(v, L, TA, () => A, { step: 1, min: -9, max: 9 });
        const TB = v.table(R, { rows: 3, cols: 3, region: [0.22, 0.6, 0.78, 1.18], maxCell: 50, size: 13.5 });
        let st = null;
        const lamp = (S, y, on, label) => {
          S.dot(0.07, y, { r: 9, color: on ? 'green' : 'red' });
          S.text(on ? '✓' : '✗', 0.07, y, { align: 'center', baseline: 'middle', size: 11, color: 'panel', weight: 700, halo: false });
          S.tex(label, 0.13, y, { align: 'left', size: 13.5, color: on ? 'ink' : 'muted' });
        };
        v.render(() => {
          const n = 3, d = nullDimsInt(A, n);
          const pw = [ident(n)]; for (let k = 1; k <= n; k++) pw.push(mm(pw[k - 1], A));
          const kz = pw.findIndex((P, k) => k > 0 && maxAbs(P) === 0);
          const mp = minPoly(M, A), isZm = mp.slice(0, -1).every((c) => Math.abs(c) < 1e-7);
          // the adapted basis
          const B = [];
          for (let k = 1; k <= n; k++) for (const b of nullRref(M, pw[k])) if (orthN([...B, b], 1e-9).length > B.length) B.push(b);
          let Mp = null, strict = false;
          if (B.length === n) {
            const Bm = fromCols(B); Mp = M.solve(Bm, mm(A, Bm)).map((r) => r.map((x) => (Math.abs(x) < 1e-9 ? 0 : x)));
            strict = Mp.every((r, i) => r.every((x, j) => j > i || x === 0));
          }
          TA.draw({ value: (i, j) => A[i][j], format: (x) => pn(x, 0), fill: (i, j) => (A[i][j] ? ['accent', 0.06 + 0.02 * Math.abs(A[i][j])] : null), textColor: (i, j) => (A[i][j] ? 'ink' : 'faint') });
          lamp(L, 0.44, kz > 0, kz > 0 ? `\\text{(a) } T^{${kz}} = 0` : '\\text{(a) } T, T^2, T^3 \\ne 0');
          lamp(L, 0.28, isZm, `\\text{(b) min. poly. } ${polyT(mp)}`);
          lamp(L, 0.12, strict, strict ? '\\text{(c) strictly upper triangular (right)}' : '\\text{(c) no such basis}');
          if (Mp) {
            TB.draw({ value: (i, j) => Mp[i][j], format: (x) => pn(x, 2), fill: (i, j) => (j <= i ? [Mp[i][j] === 0 ? 'green' : 'red', 0.22] : ['accent', 0.06]), textColor: (i, j) => (j <= i ? (Mp[i][j] === 0 ? 'green' : 'red') : 'ink') });
          } else {
            TB.draw({ value: () => '', fill: () => ['faint', 0.25] });
            R.text(`the chain stops at dimension ${d[n]} < 3`, 0.5, 0.89, { align: 'center', size: 12.5, color: 'red', weight: 700 });
          }
          // the chain of null spaces as nested bars
          for (let k = 1; k <= n; k++) {
            const y = 0.48 - (k - 1) * 0.15, w = 0.6 * (d[k] / n);
            R.rect(0.3, y - 0.045, 0.9, y + 0.045, { color: 'grid', width: 1 });
            if (d[k]) R.rect(0.3, y - 0.045, 0.3 + w, y + 0.045, { fill: ['teal', 'blue', 'purple'][k - 1], fillAlpha: 0.45, color: ['teal', 'blue', 'purple'][k - 1], width: 1.2 });
            R.tex(k === 1 ? '\\operatorname{null}T' : `\\operatorname{null}T^{${k}}`, 0.27, y, { align: 'right', size: 13 });
            R.text(`dim ${d[k]}`, 0.92, y, { size: 11.5, color: 'muted' });
          }
          st = { kz, mp, isZm, strict, B, d };
        });
        v.legend([['green', 'zero on or below the diagonal', { area: true }], ['teal', '$\\operatorname{null}T$', { area: true }], ['blue', '$\\operatorname{null}T^2$', { area: true }], ['purple', '$\\operatorname{null}T^3$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { kz, mp, strict, B, d } = st;
          if (strict) return `Adapted basis: $${B.map((b) => vtex(b)).join(',\\ ')}$ (first a basis of $\\operatorname{null}T$, then vectors of $\\operatorname{null}T^2$, …). $T$ is nilpotent ($T^{${kz}} = 0$), its minimal polynomial is $${polyT(mp)}$, and in this basis its matrix is strictly upper triangular — **all three hold**.`;
          return `$\\dim\\operatorname{null}T^k = ${d.slice(1).join(',\\ ')}$ for $k = 1, 2, 3$: the chain never reaches $\\mathbf F^3$, the minimal polynomial $${polyT(mp)}$ is not a power of $z$, and no power of $T$ is $0$ — **all three fail together**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.19
    {
      num: '8.19',
      kind: 'Definition',
      name: 'Generalized eigenspace G(λ, T)',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $\lambda \in \mathbf F$. The **generalized eigenspace** of $T$ corresponding to $\lambda$ is
$$G(\lambda, T) = \{v \in V : (T - \lambda I)^k v = 0 \text{ for some positive integer } k\},$$
the set of generalized eigenvectors of $T$ for $\lambda$ together with $0$. Taking $k = 1$ shows $E(\lambda, T) \subseteq G(\lambda, T)$. If $\lambda$ is not an eigenvalue of $T$, then $G(\lambda, T) = \{0\}$.`,
      idea: String.raw`The eigenspace $E(\lambda, T)$ collects the vectors that $T - \lambda I$ kills at once; $G(\lambda, T)$ collects those it kills eventually. It is a subspace — by 8.20 it is the null space of the single operator $(T - \lambda I)^{\dim V}$ — and it is where the eigenvalue $\lambda$ "lives" when there are too few eigenvectors.`,
      caption: String.raw`$T$ acts on $\mathbf R^3$ with eigenvalues $2$ (twice) and $-1$; the slider $c$ couples the two directions belonging to $2$. Slide $\lambda$ along the number line (right): $G(\lambda, T)$ (green) and $E(\lambda, T)$ (teal) are $\{0\}$ except at the eigenvalues. At $\lambda = 2$ with $c \ne 0$ the eigen-line sits inside a generalized eigen-plane; drag $v$ (it snaps onto the green plane) and watch $(T - 2I)v$ land on the teal line and $(T - 2I)^2v$ reach $0$. Set $c = 0$ and the line fills out the plane: then $E(2, T) = G(2, T)$.`,
      deps: ['ladr-8.8'],
      tags: ['generalized eigenvectors'],
      viz(v) {
        const M = v.M;
        const S0 = fromCols([[1, 0.2, -0.1], [0.25, 0.9, 0.35], [-0.3, 0.25, 1]]);
        const cS = v.slider('coupling $c$ inside the eigenvalue $2$', 0, 1.5, 1, { step: 0.05 });
        const lS = v.slider('$\\lambda$', -2, 3, 2, { step: 0.05 });
        const S = v.stage({ x: [-2, 2], y: [-1.8, 1.95], equal: true, axes: false, height: 380, weight: 1.3, title: '$E(\\lambda, T) \\subseteq G(\\lambda, T)$ in $\\mathbf R^3$' });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.33, axis: 1.45, lim: 1.3 });
        const N = v.stage({ x: [-2.3, 3.3], y: [-1.6, 3.3], height: 380, weight: 0.7, minWidth: 220, axes: false, title: 'dimensions as $\\lambda$ moves' });
        let cur = null;
        const snap = (p) => { if (!cur || cur.G.length !== 2) return p; const q = projN(p, cur.G); return normN(subN(p, q)) < 0.14 && normN(q) > 0.15 ? q : p; };
        const hv = sc.handle(addN(sclN(colOf(S0, 0), 0.35), sclN(colOf(S0, 1), 0.9)), { color: 'gold', label: 'v', snap });
        let st = null;
        v.render(() => {
          const c = cS.value, l = lS.value, T = conjM(M, S0, [[2, c, 0], [0, 2, 0], [0, 0, -1]]), A = shiftI(T, l);
          const P = [ident(3), A, mm(A, A), mm(mm(A, A), A)];
          const E = nullO(M, A, 1e-8), G = nullO(M, P[3], 1e-8);
          cur = { G };
          sc.begin();
          if (G.length) drawSpan(sc, G, { color: 'green', r: 1.6, width: 6, alpha: 0.4 }); else sc.dot([0, 0, 0], { r: 8, color: 'red' });
          if (E.length) drawSpan(sc, E, { color: 'teal', r: 1.75, width: 4, fillAlpha: 0.22 });
          const ch = [hv.p, mv(A, hv.p), mv(P[2], hv.p), mv(P[3], hv.p)], z = ch.findIndex((w) => normN(w) < 1e-8 * Math.max(1, normN(hv.p)));
          for (let k = 1; k <= 3; k++) {
            if ((z >= 0 && k >= z) || normN(ch[k]) > 2.3) break;
            sc.arrow([0, 0, 0], ch[k], { color: 'orange', width: 2.3, alpha: 1 - 0.2 * (k - 1) });
            sc.tex(k === 1 ? '(T-\\lambda I)v' : `(T-\\lambda I)^{${k}}v`, ch[k], { color: 'orange', size: 12.5, dx: 14, dy: -10 });
          }
          if (z > 0) sc.dot([0, 0, 0], { r: 6, color: 'green' });
          sc.arrow([0, 0, 0], hv.p, { color: 'gold', width: 2.8 });
          sc.flush();
          // ---- the number line of λ with dim E and dim G
          const dimAt = (x) => { const B = shiftI(T, x); return [nullO(M, B, 1e-8).length, nullO(M, mpow(B, 3), 1e-8).length]; };
          N.line(-2.1, 0, 3.1, 0, { color: 'muted', width: 1.4 });
          for (let t = -2; t <= 3; t++) { N.line(t, -0.08, t, 0.08, { color: 'muted' }); N.text(String(t).replace('-', '−'), t, -0.35, { align: 'center', size: 11, color: 'muted' }); }
          N.text('λ', 3.2, 0.25, { size: 14, math: true, color: 'muted' });
          for (const e of [2, -1]) {
            const [de, dg] = dimAt(e);
            N.rect(e - 0.32, 0.25, e - 0.04, 0.25 + 0.8 * de, { fill: 'teal', fillAlpha: 0.5, color: 'teal', width: 1 });
            N.rect(e + 0.04, 0.25, e + 0.32, 0.25 + 0.8 * dg, { fill: 'green', fillAlpha: 0.5, color: 'green', width: 1 });
            N.text(`${de}`, e - 0.18, 0.4 + 0.8 * de, { align: 'center', size: 11, color: 'teal', weight: 700 });
            N.text(`${dg}`, e + 0.18, 0.4 + 0.8 * dg, { align: 'center', size: 11, color: 'green', weight: 700 });
          }
          N.text('dim E', -2.1, 2.95, { size: 11.5, color: 'teal', weight: 700 }); N.text('dim G', -2.1, 2.6, { size: 11.5, color: 'green', weight: 700 });
          N.dot(l, 0, { r: 7, color: 'gold' });
          N.text(E.length ? 'an eigenvalue' : 'not an eigenvalue: G = {0}', l, -0.85, { align: 'center', size: 11.5, color: E.length ? 'green' : 'red', weight: 700 });
          st = { l, c, E, G, z, ch };
        });
        v.legend([['green', '$G(\\lambda, T)$', { area: true }], ['teal', '$E(\\lambda, T)$'], ['gold', '$v$'], ['orange', '$(T - \\lambda I)^k v$']]);
        v.readout(() => {
          if (!st) return '';
          const { l, E, G, z } = st;
          let s = `$\\lambda = ${tn(l)}$: $\\dim E(\\lambda, T) = ${E.length}$, $\\dim G(\\lambda, T) = ${G.length}$. `;
          if (!G.length) return s + 'Not an eigenvalue, so no nonzero vector is ever killed by a power of $T - \\lambda I$.';
          if (z === 1) s += '$v$ is an eigenvector: $(T - \\lambda I)v = 0$.';
          else if (z > 1) s += `$v \\in G(\\lambda, T)$ but not in $E(\\lambda, T)$: it takes $k = ${z}$ applications of $T - \\lambda I$ to reach $0$.`;
          else s += '$v \\notin G(\\lambda, T)$: no power of $T - \\lambda I$ sends it to $0$ (drag it onto the green subspace).';
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 8.20
    {
      num: '8.20',
      kind: 'Theorem',
      name: 'Description of generalized eigenspaces',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $\lambda \in \mathbf F$. Then
$$G(\lambda, T) = \operatorname{null}(T - \lambda I)^{\dim V}.$$
In particular $G(\lambda, T)$ is a subspace of $V$.`,
      idea: String.raw`Clearly $\operatorname{null}(T - \lambda I)^{\dim V} \subseteq G(\lambda, T)$. Conversely, if $(T - \lambda I)^k v = 0$ for some $k$, apply 8.1 and 8.3 to the operator $T - \lambda I$: its null spaces increase and are frozen from step $\dim V$ on, so $v \in \operatorname{null}(T - \lambda I)^{\max(k, \dim V)} = \operatorname{null}(T - \lambda I)^{\dim V}$. One fixed power does the job for every vector at once.`,
      caption: String.raw`$V = \mathcal P_4(\mathbf R)$ (dimension 5) and $(Tp)(x) = p(x+1)$, whose only eigenvalue is $1$; then $T - I$ is the forward difference $\Delta$. Drag the five values $p(0), \dots, p(4)$ (they fix $p$, of degree at most 4). The table lists the values of $(T - \lambda I)^k p$ at $x = 0, \dots, 4$: at $\lambda = 1$ each row is the difference of the row above, the degree drops by one per step, and the row $k = \deg p + 1$ is entirely $0$ (green) — never later than $k = 5 = \dim V$. The last column counts $\dim N_k$, where $N_k = \operatorname{null}(T - \lambda I)^k$: frozen from $k = 5$. Move $\lambda$ off $1$: no row ever vanishes, so $G(\lambda, T) = \{0\}$.`,
      deps: ['ladr-8.19', 'ladr-8.1', 'ladr-8.3'],
      tags: ['generalized eigenvectors'],
      viz(v) {
        const M = v.M, K = 6;
        const lS = v.slider('$\\lambda$', -1, 2.5, 1, { step: 0.05 });
        const F = v.stage({ x: [-0.5, 6.5], y: [-4.5, 6.5], height: 380, weight: 0.95, axes: true, title: '$p$ and $(T - \\lambda I)p$, $(T - \\lambda I)^2p$, …' });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 1.05, minWidth: 300, title: 'values of $(T - \\lambda I)^k p$ at $x = 0, 1, 2, 3, 4$' });
        const ys0 = [1, 3, 2, -1, 0.5];
        const hs = ys0.map((y, i) => F.handle(i, y, { color: 'accent', constrain: (x, yy) => [i, M.clamp(Math.round(yy * 2) / 2, -4, 6)] }));
        const TB = v.table(Q, { rows: K + 1, cols: 7, region: [0.02, 0.02, 0.98, 0.98], square: false, cellAspect: 1.45, maxCell: 44, size: 12.5,
          rowLabels: (k) => `$${k}$`, colLabels: ['$0$', '$1$', '$2$', '$3$', '$4$', '$\\deg$', '$\\dim N_k$'], cornerLabel: '$k \\backslash x$' });
        const Pas = Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => (j >= i ? M.binom(j, i) : 0)));
        const COL = ['accent', 'purple', 'teal', 'pink', 'orange', 'gold', 'green'];
        let st = null;
        v.render(() => {
          const l = lS.value, ys = hs.map((h) => h.y);
          // Newton forward differences at 0 give p at every integer and as a function
          const D = [ys.slice()]; for (let k = 1; k < 5; k++) D.push(D[k - 1].slice(1).map((y, i) => y - D[k - 1][i]));
          const p = (x) => { let s = 0, b = 1; for (let j = 0; j < 5; j++) { s += b * D[j][0]; b *= (x - j) / (j + 1); } return s; };
          const fk = (k, x) => { let s = 0; for (let j = 0; j <= k; j++) s += M.binom(k, j) * Math.pow(-l, k - j) * p(x + j); return s; };
          const rows = []; for (let k = 0; k <= K; k++) rows.push([0, 1, 2, 3, 4].map((x) => fk(k, x)));
          const tol = 1e-9 * Math.max(1, ...ys.map(Math.abs));
          const zero = rows.map((r) => r.every((y) => Math.abs(y) < tol * 10 ** 2));
          const deg = rows.map((r) => { if (r.every((y) => Math.abs(y) < tol * 100)) return -1; let d = 0, R = r.slice(); for (let j = 1; j < 5; j++) { R = R.slice(1).map((y, i) => y - R[i]); if (R.some((y) => Math.abs(y) > tol * 1e3)) d = j; } return d; });
          const isOne = Math.abs(l - 1) < 1e-12, Al = shiftI(Pas, l);
          const dn = []; for (let k = 0; k <= K; k++) dn.push(isOne ? 5 - rankInt(mpow(Al, k)) : 5 - M.rank(mpow(Al, k), 1e-9));
          // graph
          for (let k = Math.min(3, K); k >= 1; k--) if (!zero[k]) F.clip(() => F.fn((x) => fk(k, x), { color: COL[k], width: 1.6, alpha: 0.75, domain: [-0.5, 6.5] }));
          F.clip(() => F.fn(p, { color: 'accent', width: 3, domain: [-0.5, 6.5] }));
          F.vband(-0.3, 4.3, { color: 'accent', alpha: 0.04 });
          TB.draw({
            value: (k, j) => (j < 5 ? rows[k][j] : j === 5 ? (deg[k] < 0 ? '—' : deg[k]) : dn[k]),
            format: (x) => (typeof x === 'string' ? x : pn(x, Math.abs(x) >= 100 ? 0 : 2)),
            fill: (k, j) => (j < 5 ? (zero[k] ? ['green', 0.28] : [COL[Math.min(k, 6)], 0.07]) : j === 6 ? ['faint', 0.25] : null),
            textColor: (k, j) => (j < 5 && zero[k] ? 'green' : j === 6 ? 'muted' : 'ink'),
          });
          const kz = zero.findIndex((b) => b);
          st = { l, isOne, kz, deg, dn };
        });
        v.legend([['accent', '$p$ (drag its values)'], ['purple', '$(T - \\lambda I)p$'], ['teal', '$(T - \\lambda I)^2p$'], ['pink', '$(T - \\lambda I)^3p$'], ['green', 'a zero row', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { l, isOne, kz, deg } = st;
          if (deg[0] < 0) return 'Here $p = 0$; drag the values.';
          if (isOne) return `$\\lambda = 1$: $\\deg p = ${deg[0]}$, and $(T - I)^{${kz}}p = 0$ while $(T - I)^{${kz - 1}}p \\ne 0$. Every $p \\in \\mathcal P_4$ dies by $k = 5 = \\dim V$, so $G(1, T) = \\operatorname{null}(T - I)^5 = \\mathcal P_4$ — but on the space of all polynomials no single power would do.`;
          return `$\\lambda = ${tn(l)}$: $T - \\lambda I$ keeps the degree ($${deg[0]}$) and the leading coefficient is multiplied by $1 - \\lambda = ${tn(1 - l)} \\ne 0$ each time, so no row ever vanishes: $\\operatorname{null}(T - \\lambda I)^5 = \\{0\\} = G(\\lambda, T)$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.22
    {
      num: '8.22',
      kind: 'Theorem',
      name: 'Generalized eigenspace decomposition',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$ and $T \in \mathcal L(V)$, with distinct eigenvalues $\lambda_1, \dots, \lambda_m$. Then
(a) each $G(\lambda_k, T)$ is invariant under $T$;
(b) each $(T - \lambda_k I)|_{G(\lambda_k, T)}$ is nilpotent;
(c) $V = G(\lambda_1, T) \oplus \cdots \oplus G(\lambda_m, T)$.`,
      idea: String.raw`(a) $G(\lambda_k, T) = \operatorname{null}(T - \lambda_k I)^{\dim V}$ (8.20) is the null space of a polynomial in $T$, hence invariant (5.18). (b) On it, $(T - \lambda_k I)^{\dim V}$ is $0$ by that same description. (c) The sum is direct because generalized eigenvectors for distinct eigenvalues are linearly independent (8.12, with 1.45), and it is all of $V$ because $V$ has a basis of generalized eigenvectors (8.9). In a basis assembled from bases of the $G(\lambda_k, T)$, the matrix of $T$ is block diagonal, each block $\lambda_k I$ plus a nilpotent part.`,
      caption: String.raw`An operator on $\mathbf C^4$ built from the three eigenvalues you drag in the plane (left); with “defective”, $\lambda_1$ carries a $2\times2$ Jordan block, so the eigenvectors do not span $\mathbf C^4$. Everything is recomputed from the matrix: eigenvalues, the generalized eigenspaces $\operatorname{null}(T - \lambda I)^4$, and the matrix of $T$ in a basis of generalized eigenvectors. Each entry is drawn as an arrow in its own small copy of $\mathbf C$: the dense matrix (middle) becomes block diagonal (right), one coloured block per eigenvalue. Show the eigenvectors only: there are just three, the would-be change of basis has rank $3 < 4$. Drag two eigenvalues together and their blocks merge.`,
      deps: ['ladr-8.20', 'ladr-5.18', 'ladr-8.12', 'ladr-1.45', 'ladr-8.9'],
      tags: ['generalized eigenvectors', 'direct sums'],
      viz(v) {
        const M = v.M;
        const shape = v.select('$T$', [{ value: 'def', label: 'defective: a Jordan block for $\\lambda_1$' }, { value: 'diag', label: 'diagonalizable' }], 'def');
        const eo = v.toggle('eigenvectors only', false);
        let seed = 5;
        v.button('New change of basis', () => { seed += 1; });
        const Z = v.stage({ x: [-1.6, 1.6], y: [-1.45, 1.45], equal: true, height: 330, weight: 0.75, minWidth: 220, title: 'eigenvalues (drag)' });
        const P = v.stage({ x: [0, 2.3], y: [0, 1.25], equal: true, axes: false, height: 330, weight: 1.25, title: '$\\mathcal M(T)$: standard basis $\\to$ generalized eigenvectors' });
        const CC = ['blue', 'orange', 'teal', 'pink'];
        const snapTo = (others) => (x, y) => { for (const o of others()) if (Math.hypot(x - o.x, y - o.y) < 0.14) return [o.x, o.y]; return [x, y]; };
        const H = [];
        H.push(Z.handle(0.7, 0.55, { color: 'blue', label: '$\\lambda_1$', constrain: snapTo(() => [H[1], H[2]]) }));
        H.push(Z.handle(-0.75, 0.35, { color: 'orange', label: '$\\lambda_2$', constrain: snapTo(() => [H[0], H[2]]) }));
        H.push(Z.handle(-0.1, -0.85, { color: 'teal', label: '$\\lambda_3$', constrain: snapTo(() => [H[0], H[1]]) }));
        let st = null;
        v.render(() => {
          const ls = H.map((h) => [h.x, h.y]), r = v.rng(seed * 17 + 3), S0 = randU(r, 4);
          const blocks = shape.value === 'def' ? [[ls[0], 2], [ls[1], 1], [ls[2], 1]] : [[ls[0], 1], [ls[0], 1], [ls[1], 1], [ls[2], 1]];
          const T = cMM(cMM(S0, jordanC(blocks)), cInv(M, S0));
          const ed = eigenData(M, T);
          // bases: generalized eigenspaces (adapted to the chain of null spaces) or eigenspaces only
          const parts = ed.map((e, idx) => {
            const A = cShift(T, e.z), basis = [];
            let Pk = A;
            for (let k = 1; k <= (eo.value ? 1 : 4); k++) { for (const b of cNullO(M, Pk)) if (cOrth([...basis, b], 1e-6).length > basis.length) basis.push(b); Pk = cMM(Pk, A); }
            let hi = 0; H.forEach((h, k) => { if (Math.hypot(h.x - e.z[0], h.y - e.z[1]) < Math.hypot(H[hi].x - e.z[0], H[hi].y - e.z[1]) - 1e-9) hi = k; });
            return { ...e, basis, color: CC[hi] };
          });
          const cols = parts.flatMap((q) => q.basis), Bm = fromCols(cols), full = cols.length === 4 && cRank(M, Bm, 1e-9) === 4;
          let Mp = null;
          if (full) Mp = cMM(cInv(M, Bm), cMM(T, Bm));
          const scl = Math.max(cMaxAbs(T), Mp ? cMaxAbs(Mp) : 0);
          // ---- eigenvalue plane
          parts.forEach((q) => { const rr = 0.09 + 0.05 * q.alg; Z.circle(q.z[0], q.z[1], rr, { color: q.color, width: 2.2 }); Z.text(`d = ${q.alg}`, q.z[0] + rr, q.z[1], { color: q.color, size: 11.5, weight: 700, dx: 6, dy: 10, align: 'left' }); });
          // ---- tiles
          const w = 0.95;
          phasorTile(P, T, 0.1, 0.12, w, { sc: scl });
          P.tex('\\text{standard basis}', 0.1 + w / 2, 1.15, { size: 13, color: 'muted' });
          P.arrow(1.1, 0.6, 1.24, 0.6, { color: 'muted', width: 1.6 });
          if (full) {
            const owner = []; parts.forEach((q, i) => q.basis.forEach(() => owner.push(i)));
            phasorTile(P, Mp, 1.3, 0.12, w, { sc: scl, colorFn: (i, j) => (owner[i] === owner[j] ? parts[owner[i]].color : 'red') });
            let o = 0; const cw = w / 4;
            parts.forEach((q) => { const d = q.basis.length; P.rect(1.3 + o * cw, 0.12 + w - (o + d) * cw, 1.3 + (o + d) * cw, 0.12 + w - o * cw, { color: q.color, width: 2.6 }); o += d; });
            P.tex('\\text{generalized eigenvectors}', 1.3 + w / 2, 1.15, { size: 13, color: 'green' });
          } else {
            phasorTile(P, Bm, 1.3 + (w * (4 - cols.length)) / 8, 0.12, (w * cols.length) / 4, { sc: 1, color: 'red', frame: 'red' });
            P.tex(`\\text{the ${cols.length} eigenvectors: rank } ${cRank(M, Bm, 1e-9)} < 4`, 1.3 + w / 2, 1.15, { size: 13, color: 'red' });
          }
          let off = 0, nil = 0;
          if (full) {
            const owner = []; parts.forEach((q, i) => q.basis.forEach(() => owner.push(i)));
            Mp.forEach((row, i) => row.forEach((z, j) => { if (owner[i] !== owner[j]) off = Math.max(off, cabs(z)); }));
            let o = 0;
            parts.forEach((q) => { const d = q.basis.length, B = Mp.slice(o, o + d).map((rr) => rr.slice(o, o + d)), N = cShift(B, q.z); let Pn = N; for (let k = 1; k < d; k++) Pn = cMM(Pn, N); nil = Math.max(nil, cMaxAbs(Pn)); o += d; });
          }
          st = { parts, full, off, nil, n: cols.length };
        });
        v.legend([['blue', '$G(\\lambda_1, T)$ block'], ['orange', '$G(\\lambda_2, T)$'], ['teal', '$G(\\lambda_3, T)$'], ['red', 'off-block entry']]);
        v.readout(() => {
          if (!st) return '';
          const { parts, full, off, nil, n } = st;
          const dims = parts.map((q) => q.alg).join(' + ');
          if (!full) return `The eigenspaces have dimensions $${parts.map((q) => q.geo).join(' + ')} = ${n} < 4$: **no basis of eigenvectors**. The generalized eigenspaces have dimensions $${dims} = 4$.`;
          return `$\\mathbf C^4 = ${parts.map((q, i) => `G(${czT(q.z)}, T)`).join(' \\oplus ')}$, dimensions $${dims} = 4$. Largest entry outside the blocks: $${v.sci(off, 1)}$ (each $G$ is invariant); $(B - \\lambda I)^{d}$ for each block $B$ of size $d$: largest entry $${v.sci(nil, 1)}$ (the nilpotent part).`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.23
    {
      num: '8.23',
      kind: 'Definition',
      name: 'Multiplicity of an eigenvalue',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $\lambda$ is an eigenvalue of $T$. The **multiplicity** of $\lambda$ is the dimension of its generalized eigenspace,
$$\dim G(\lambda, T) = \dim\operatorname{null}(T - \lambda I)^{\dim V}$$
(the two agree by 8.20). Other books call this the *algebraic multiplicity*, and $\dim E(\lambda, T) = \dim\operatorname{null}(T - \lambda I)$ the *geometric multiplicity*.`,
      idea: String.raw`Counting eigenvectors undercounts an eigenvalue when there are too few of them; counting generalized eigenvectors does not. By 8.1 the numbers $\dim\operatorname{null}(T - \lambda I)^k$, $k = 1, 2, \dots$, climb from the geometric multiplicity up to the multiplicity and then freeze (8.3). No determinants are needed; 8.31 will show that the multiplicity is the number of times $\lambda$ appears on the diagonal of any upper-triangular matrix of $T$, and 9.62 that it agrees with the determinant-based definition.`,
      caption: String.raw`Edit the upper-triangular matrix (click the top or bottom half of an entry, or drag it; the entries below the diagonal stay $0$), or pick a preset. For each eigenvalue — each distinct diagonal entry — the bars show $\dim\operatorname{null}(T - \lambda I)^k$ for $k = 1, 2, 3, 4$, computed exactly: the first bar (teal) is the eigenspace, the last (green) the generalized eigenspace, whose dimension is the multiplicity. Nonzero entries above repeated diagonal entries make the teal bar fall short of the green one. The gold dots count how often $\lambda$ sits on the diagonal.`,
      deps: ['ladr-8.19', 'ladr-8.20'],
      tags: ['generalized eigenvectors'],
      viz(v) {
        const PRE = {
          defect: [[1, 1, 0.5, -1], [0, 1, 0, 2], [0, 0, -1, 1], [0, 0, 0, 1]],
          diag: [[1, 0, 0.5, 0], [0, 1, 0, 0], [0, 0, -1, 0], [0, 0, 0, 1]],
          distinct: [[2, 1, -1, 0.5], [0, -1, 1, 1], [0, 0, 0.5, -1], [0, 0, 0, -2]],
        };
        let A = PRE.defect.map((r) => r.slice());
        v.select('preset', [{ value: 'defect', label: '$1$ three times, few eigenvectors' }, { value: 'diag', label: '$1$ three times, more eigenvectors' }, { value: 'distinct', label: 'four distinct eigenvalues' }], 'defect', { onChange: (k) => { A = PRE[k].map((r) => r.slice()); } });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 0.85, minWidth: 240, title: 'an upper-triangular $\\mathcal M(T)$' });
        const G = v.stage({ x: [-0.25, 4], y: [-0.9, 5.1], height: 340, weight: 1.15, axes: false, title: '$\\dim\\operatorname{null}(T - \\lambda I)^k$, $k = 1, 2, 3, 4$, for each eigenvalue' });
        const TT = v.table(Q, { rows: 4, cols: 4, region: [0.04, 0.04, 0.96, 0.96], maxCell: 58, size: 15 });
        editable(v, Q, TT, () => A, { step: 0.5, min: -3, max: 3, ok: (i, j) => i <= j });
        let st = null;
        v.render(() => {
          const diag = A.map((r, i) => r[i]), eig = [...new Set(diag)].sort((a, b) => a - b);
          TT.draw({
            value: (i, j) => A[i][j], format: (x) => pn(x, 1),
            fill: (i, j) => (i > j ? ['faint', 0.3] : i === j ? [PAL[eig.indexOf(A[i][i]) % 8], 0.3] : A[i][j] ? ['accent', 0.07] : null),
            textColor: (i, j) => (i > j ? 'muted' : A[i][j] ? 'ink' : 'faint'), weight: (i, j) => (i === j ? 700 : 500),
          });
          const data = eig.map((l) => {
            const B = shiftI(A, l).map((r) => r.map((x) => 2 * x)); // scaled by 2: integer entries, exact ranks
            const dims = nullDimsInt(B, 4).slice(1);
            return { l, dims, times: diag.filter((x) => x === l).length };
          });
          const m = data.length, gw = 4 / m;
          for (let y = 1; y <= 4; y++) { G.line(0.05, y, 3.95, y, { color: 'grid', width: 0.8 }); G.text(String(y), -0.03, y, { align: 'right', size: 10.5, color: 'muted' }); }
          G.line(0.05, 0, 3.95, 0, { color: 'muted', width: 1.2 });
          data.forEach((d, g) => {
            const x0 = g * gw + gw * 0.14, bw = (gw * 0.72) / 4, col = PAL[g % 8];
            d.dims.forEach((h, k) => {
              const c = k === 0 ? 'teal' : k === 3 ? 'green' : 'muted';
              G.rect(x0 + k * bw + bw * 0.1, 0, x0 + (k + 0.9) * bw, h, { fill: c, fillAlpha: k === 0 || k === 3 ? 0.55 : 0.25, color: c, width: 1 });
              G.text(String(k + 1), x0 + (k + 0.5) * bw, -0.22, { align: 'center', size: 9.5, color: 'muted' });
            });
            G.tex(`\\lambda = ${tn(d.l, 1)}`, x0 + 2 * bw, -0.62, { size: 14, color: col });
            for (let t = 0; t < d.times; t++) G.dot(x0 + 2 * bw + (t - (d.times - 1) / 2) * 0.16, 4.55, { r: 5, color: 'gold' });
            G.text(`mult. ${d.dims[3]}`, x0 + 2 * bw, 4.95, { align: 'center', size: 12, color: 'green', weight: 700 });
          });
          st = { data };
        });
        v.legend([['teal', '$\\dim E(\\lambda, T)$', { area: true }], ['green', '$\\dim G(\\lambda, T)$ = multiplicity', { area: true }], ['gold', 'times on the diagonal', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          return st.data.map((d) => `$\\lambda = ${tn(d.l, 1)}$: $\\dim E = ${d.dims[0]}$, multiplicity $\\dim G = ${d.dims[3]}$${d.dims[0] < d.dims[3] ? ' (too few eigenvectors)' : ''}`).join('; ') + `. The multiplicities add up to $${st.data.reduce((s, d) => s + d.dims[3], 0)} = \\dim V$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.25
    {
      num: '8.25',
      kind: 'Theorem',
      name: 'Sum of the multiplicities equals dim V',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$ and $T \in \mathcal L(V)$. Then the sum of the multiplicities of all the eigenvalues of $T$ equals $\dim V$.`,
      idea: String.raw`By the generalized eigenspace decomposition (8.22), $V = G(\lambda_1, T) \oplus \cdots \oplus G(\lambda_m, T)$, and the dimension of a direct sum is the sum of the dimensions (3.94). The eigenspaces alone would not do: their dimensions add up to less than $\dim V$ whenever $T$ is not diagonalizable. Over $\mathbf R$ the theorem fails too, because a real operator may have too few real eigenvalues.`,
      caption: String.raw`A random operator on $\mathbf C^n$ — choose $n$, and “repeated” to build in Jordan blocks. Its eigenvalues are computed and clustered, and the multiplicity of each is computed as $\dim\operatorname{null}(T - \lambda I)^k$ once the chain has frozen. Left: the eigenvalues, each disc's area proportional to its multiplicity. Right: the multiplicities stacked end to end always fill the bar of length $n$, while the eigenspace dimensions (lower bar) may fall short. Choose “over $\mathbf R$” to count only the real eigenvalues of a random real matrix: the non-real conjugate pairs leave a red gap.`,
      deps: ['ladr-8.22', 'ladr-3.94', 'ladr-8.23'],
      tags: ['generalized eigenvectors'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n = \\dim V$', 2, 7, 5, { int: true });
        const kind = v.select('$T$', [{ value: 'rep', label: 'repeated eigenvalues' }, { value: 'rand', label: 'random complex' }, { value: 'real', label: 'random real' }, { value: 'realR', label: 'random real, over $\\mathbf R$' }], 'rep');
        let seed = 3;
        v.button('New matrix', () => { seed += 1; });
        const Z = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 340, weight: 0.9, minWidth: 230, xlabel: 'Re', ylabel: 'Im', title: 'eigenvalues, area ∝ multiplicity' });
        const B = v.stage({ x: [-0.6, 7.6], y: [0, 1], height: 340, weight: 1.1, axes: false, title: 'multiplicities stacked end to end' });
        const gen = (n, k, sd) => {
          const r = v.rng(sd * 97 + n * 13 + (k === 'rep' ? 1 : k === 'rand' ? 2 : 3));
          if (k === 'rand') return Array.from({ length: n }, () => Array.from({ length: n }, () => [r.uniform(-0.8, 0.8), r.uniform(-0.8, 0.8)]));
          if (k === 'real') return Array.from({ length: n }, () => Array.from({ length: n }, () => [r.uniform(-1, 1), 0]));
          const pts = []; for (let t = 0; t < 200 && pts.length < 4; t++) { const z = [r.uniform(-1.1, 1.1), r.uniform(-1.1, 1.1)]; if (cabs(z) < 1.2 && pts.every((q) => cabs(csub(q, z)) > 0.55)) pts.push(z); }
          const blocks = []; let left = n, i = 0;
          while (left > 0) { const s = Math.min(left, r.int(1, 3)); blocks.push([pts[i % pts.length], s]); left -= s; i++; if (r() < 0.3 && left > 0) { const s2 = Math.min(left, 1); blocks.push([pts[(i - 1) % pts.length], s2]); left -= s2; } }
          const S0 = randS(r, n, 0.5);
          return cMM(cMM(S0, jordanC(blocks)), cInv(M, S0));
        };
        let st = null;
        v.render(() => {
          const n = nS.value, k = kind.value === 'realR' ? 'real' : kind.value, T = gen(n, k, seed), ed = eigenData(M, T);
          const realOnly = kind.value === 'realR', isReal = (e) => Math.abs(e.z[1]) < 1e-7;
          const R = Math.max(1.3, ...ed.map((e) => cabs(e.z) * 1.3));
          Z.setView([-R, R], [-R, R]);
          ed.forEach((e, i) => {
            const on = !realOnly || isReal(e), col = on ? PAL[i % 8] : 'red', rad = 7 * Math.sqrt(e.alg);
            Z.dot(e.z[0], e.z[1], { r: rad, color: col, alpha: on ? 0.75 : 0.25 });
            if (e.alg > 1) Z.text(String(e.alg), e.z[0], e.z[1], { align: 'center', baseline: 'middle', size: 12, color: 'panel', weight: 700, halo: false });
          });
          if (realOnly) Z.hline(0, { color: 'green', width: 2.5, alpha: 0.5 });
          // stacked bars: multiplicities (top) and eigenspace dimensions (bottom)
          B.setView([-0.6, n + 0.6], [0, 1]);
          const bar = (y, key, label) => {
            let x = 0;
            B.text(label, 0, y + 0.1, { size: 12, color: 'muted' });
            ed.forEach((e, i) => {
              const on = !realOnly || isReal(e), d = e[key]; if (!d) return;
              if (on) { B.rect(x, y - 0.06, x + d, y + 0.06, { fill: PAL[i % 8], fillAlpha: 0.55, color: PAL[i % 8], width: 1.2 }); B.text(String(d), x + d / 2, y, { align: 'center', baseline: 'middle', size: 12, weight: 700, halo: false }); x += d; }
            });
            if (x < n - 1e-9) { B.rect(x, y - 0.06, n, y + 0.06, { color: 'red', width: 1.6, dash: [5, 4], fill: 'red', fillAlpha: 0.08 }); B.text(`missing ${n - x}`, (x + n) / 2, y, { align: 'center', baseline: 'middle', size: 11.5, color: 'red', weight: 700 }); }
            B.text(`sum = ${x}`, n + 0.05, y - 0.13, { align: 'right', size: 12, color: x === n ? 'green' : 'red', weight: 700 });
            return x;
          };
          for (let t = 0; t <= n; t++) { B.line(t, 0.12, t, 0.88, { color: 'grid', width: 0.8 }); B.text(String(t), t, 0.06, { align: 'center', size: 10.5, color: 'muted' }); }
          const sA = bar(0.68, 'alg', realOnly ? 'multiplicities of the real eigenvalues' : 'multiplicities dim G(λ, T)');
          const sG = bar(0.32, 'geo', realOnly ? 'eigenspaces of the real eigenvalues' : 'eigenspace dimensions dim E(λ, T)');
          B.line(n, 0.12, n, 0.88, { color: 'ink', width: 2 }); B.text(`n = ${n}`, n, 0.94, { align: 'center', size: 12, weight: 700 });
          st = { n, ed, sA, sG, realOnly };
        });
        v.legend([['blue', 'one colour per eigenvalue', { area: true }], ['red', 'not accounted for', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { n, ed, sA, sG, realOnly } = st;
          const list = ed.map((e) => `${czT(e.z)}\\ (${e.alg})`).join(',\\ ');
          if (realOnly) return `Eigenvalues (multiplicity): $${list}$. Over $\\mathbf R$ only the real ones count: their multiplicities add up to $${sA}$` + (sA < n ? ` $< ${n}$ — **the theorem needs $\\mathbf F = \\mathbf C$**.` : ' — this time all eigenvalues happen to be real (press **New matrix**).');
          return `Eigenvalues (multiplicity): $${list}$. Sum of multiplicities $= ${sA} = \\dim V$; sum of eigenspace dimensions $= ${sG}$` + (sG < n ? ` $< ${n}$: not diagonalizable, but the generalized eigenspaces still fill $\\mathbf C^{${n}}$.` : ': here $T$ is diagonalizable.');
        });
      },
    },
    // ------------------------------------------------------------------ 8.26
    {
      num: '8.26',
      kind: 'Definition',
      name: 'Characteristic polynomial (complex case)',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$ and $T \in \mathcal L(V)$. Let $\lambda_1, \dots, \lambda_m$ be the distinct eigenvalues of $T$, with multiplicities $d_1, \dots, d_m$. The **characteristic polynomial** of $T$ is
$$(z - \lambda_1)^{d_1} \cdots (z - \lambda_m)^{d_m}.$$`,
      idea: String.raw`It packages the eigenvalues and their multiplicities into one monic polynomial. For instance, the operator on $\mathbf C^3$ with matrix $\begin{pmatrix} 6 & 3 & 4 \\ 0 & 6 & 2 \\ 0 & 0 & 7 \end{pmatrix}$ has eigenvalue $6$ with multiplicity $2$ and eigenvalue $7$ with multiplicity $1$, so its characteristic polynomial is $(z - 6)^2(z - 7)$. Most books define it as $\det(zI - T)$; the two definitions agree (9.62), but this one needs no determinants.`,
      caption: String.raw`Drag the eigenvalues $\lambda_1, \lambda_2, \lambda_3$ and set their multiplicities: an operator with exactly that spectrum is built (one Jordan block per eigenvalue, or a diagonalizable one) and hidden by a random change of basis. From that matrix alone the eigenvalues and the dimensions of their generalized eigenspaces are recomputed, and the characteristic polynomial $q$ is formed. The plane is coloured by the phase of $q(z)$ (brightness bands mark $|q|$): around a zero of multiplicity $d$ the colours cycle $d$ times. Drag two eigenvalues onto each other and the multiplicities add; switch to diagonalizable — more eigenvectors — and $q$ does not change.`,
      deps: ['ladr-8.23'],
      tags: ['characteristic polynomial'],
      viz(v) {
        const M = v.M;
        const d1 = v.slider('$d_1$', 1, 3, 2, { int: true }), d2 = v.slider('$d_2$', 1, 3, 1, { int: true }), d3 = v.slider('$d_3$', 0, 2, 1, { int: true });
        const shape = v.select('built as', [{ value: 'jordan', label: 'one Jordan block per eigenvalue' }, { value: 'diag', label: 'diagonalizable' }], 'jordan');
        const Z = v.stage({ x: [-1.8, 1.8], y: [-1.25, 1.25], equal: true, height: 380, xlabel: 'Re', ylabel: 'Im', title: 'phase portrait of the characteristic polynomial $q$' });
        const H = [];
        const snapTo = (k) => (x, y) => { for (let j = 0; j < 3; j++) if (j !== k && H[j] && H[j].visible !== false && Math.hypot(x - H[j].x, y - H[j].y) < 0.15) return [H[j].x, H[j].y]; return [M.clamp(x, -1.7, 1.7), M.clamp(y, -1.15, 1.15)]; };
        H.push(Z.handle(0.65, 0.4, { color: 'ink', label: '$\\lambda_1$', constrain: snapTo(0) }));
        H.push(Z.handle(-0.8, 0.3, { color: 'ink', label: '$\\lambda_2$', constrain: snapTo(1) }));
        H.push(Z.handle(-0.05, -0.65, { color: 'ink', label: '$\\lambda_3$', constrain: snapTo(2) }));
        let st = null;
        v.render(() => {
          const ds = [d1.value, d2.value, d3.value];
          H[2].visible = ds[2] > 0;
          const blocks = [];
          ds.forEach((d, k) => { if (!d) return; const l = [H[k].x, H[k].y]; if (shape.value === 'jordan') blocks.push([l, d]); else for (let t = 0; t < d; t++) blocks.push([l, 1]); });
          const n = blocks.reduce((s, b) => s + b[1], 0), r = v.rng(7 + n), S0 = randS(r, n, 0.45);
          const T = cMM(cMM(S0, jordanC(blocks)), cInv(M, S0)), ed = eigenData(M, T);
          const list = ed.map((e) => ({ z: e.z, d: e.alg })), q = polyFromMult(list);
          const key = list.map((e) => `${e.z[0].toFixed(4)},${e.z[1].toFixed(4)},${e.d}`).join('|');
          Z.domain((z) => { const w = cPolyEval(q, [z.re, z.im]); return new M.Cx(w[0], w[1]); }, { key, res: 2, fade: 0.12 });
          Z.axes();
          list.forEach((e) => Z.text(`d = ${e.d}`, e.z[0], e.z[1], { size: 12.5, weight: 700, dx: 16, dy: 16 }));
          st = { list, q, n, ed };
        });
        v.readout(() => {
          if (!st) return '';
          const { list, q, n, ed } = st;
          return `Recomputed from the $${n}\\times${n}$ matrix: ${ed.map((e) => `$\\lambda = ${czT(e.z)}$ with $\\dim E = ${e.geo}$, multiplicity $${e.alg}$`).join('; ')}. Characteristic polynomial $q(z) = ${factorT(list)} = ${cPolyT(q)}$, of degree $${q.length - 1}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.28
    {
      num: '8.28',
      kind: 'Theorem',
      name: 'Degree and zeros of characteristic polynomial',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$ and $T \in \mathcal L(V)$. Then
(a) the characteristic polynomial of $T$ has degree $\dim V$;
(b) the zeros of the characteristic polynomial of $T$ are exactly the eigenvalues of $T$.`,
      idea: String.raw`(a) The degree of $(z - \lambda_1)^{d_1}\cdots(z - \lambda_m)^{d_m}$ is $d_1 + \cdots + d_m$, which is $\dim V$ by 8.25. (b) is built into the definition: the linear factors are exactly $z - \lambda_k$ for the eigenvalues $\lambda_k$. Both depend on using multiplicities: with the eigenspace dimensions in their place, the degree would come out too small for any operator without enough eigenvectors.`,
      caption: String.raw`A random operator on $\mathbf C^n$ (choose $n$; “repeated” builds in eigenvalues of multiplicity $2$ or $3$). Left: the surface $\log_{10}|q(z)|$ over a square of the complex plane, for the characteristic polynomial $q$ computed from the matrix (drag to rotate); it plunges down exactly at the eigenvalues (dots on the floor). Right: the number of zeros of $q$ inside the circle $|z| = r$, counted by the winding number of $q$ around that circle — it jumps by the multiplicity as $r$ passes each eigenvalue and ends at the degree, always $n$. Use eigenspace dimensions instead of multiplicities: with repeated eigenvalues the degree falls short of $n$.`,
      deps: ['ladr-8.25', 'ladr-8.26'],
      tags: ['characteristic polynomial'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n = \\dim V$', 1, 7, 6, { int: true });
        const kind = v.select('eigenvalues', [{ value: 'rep', label: 'repeated' }, { value: 'gen', label: 'generic' }], 'rep');
        const geo = v.toggle('use eigenspace dimensions instead of multiplicities', false);
        let seed = 6;
        v.button('New operator', () => { seed += 1; });
        const S3 = v.stage3d({ range: 1.75, height: 370, yaw: -0.6, pitch: 0.5, axes: false, weight: 1.15, minWidth: 280, title: '$\\log_{10}|q(z)|$ over the complex plane' });
        const W = v.stage({ x: [0.05, 30], xlog: true, y: [-0.4, 8], height: 370, weight: 0.85, minWidth: 240, axes: 'box', xlabel: 'r', title: 'zeros of $q$ inside $|z| = r$' });
        const gen = (n, k, sd) => {
          const r = v.rng(sd * 53 + n * 7 + (k === 'rep' ? 1 : 0));
          if (k === 'gen') return Array.from({ length: n }, () => Array.from({ length: n }, () => [r.uniform(-0.8, 0.8), r.uniform(-0.8, 0.8)]));
          const pts = []; for (let t = 0; t < 300 && pts.length < 4; t++) { const z = [r.uniform(-1.4, 1.4), r.uniform(-1.4, 1.4)]; if (cabs(z) > 0.25 && cabs(z) < 1.5 && pts.every((q) => cabs(csub(q, z)) > 0.6 && Math.abs(cabs(q) - cabs(z)) > 0.12)) pts.push(z); }
          const blocks = []; let left = n, i = 0;
          while (left > 0) { const s = Math.min(left, i === 0 ? Math.min(3, n) : r.int(1, 2)); blocks.push([pts[i % 4], s]); left -= s; i++; }
          const S0 = randS(r, n, 0.5);
          return cMM(cMM(S0, jordanC(blocks)), cInv(M, S0));
        };
        const cache = { key: null };
        let st = null;
        v.render(() => {
          const n = nS.value, k = kind.value, key = `${n}|${k}|${seed}|${geo.value}`;
          if (cache.key !== key) {
            const T = gen(n, k, seed), ed = eigenData(M, T), list = ed.map((e) => ({ z: e.z, d: geo.value ? e.geo : e.alg })), q = polyFromMult(list);
            const rs = [], wn = [];
            for (let i = 0; i <= 140; i++) {
              const rr = 0.05 * Math.pow(600, i / 140); let tot = 0, prev = null;
              for (let j = 0; j <= 400; j++) { const t = (2 * Math.PI * j) / 400, w = cPolyEval(q, [rr * Math.cos(t), rr * Math.sin(t)]), a = Math.atan2(w[1], w[0]); if (prev != null) { let da = a - prev; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; tot += da; } prev = a; }
              rs.push(rr); wn.push(Math.round(tot / (2 * Math.PI)));
            }
            const L = Math.max(0.8, ...ed.map((e) => Math.max(Math.abs(e.z[0]), Math.abs(e.z[1])))) * 1.2;
            Object.assign(cache, { key, T, ed, list, q, rs, wn, L });
          }
          const { ed, list, q, rs, wn, L } = cache;
          const raw = (x, y) => Math.log10(Math.max(1e-30, cabs(cPolyEval(q, [x, y]))));
          const smp = []; for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) smp.push(raw(L * (i / 6 - 1), L * (j / 6 - 1)));
          smp.sort((a, b) => a - b);
          const hi = smp[Math.floor(0.85 * smp.length)], lo = hi - 3.5;
          const hgt = (x, y) => M.clamp(raw(x, y), lo, hi);
          const zs = (h) => -0.7 + (1.1 * (h - lo)) / (hi - lo);
          S3.surface((a, b) => [a, b, zs(hgt(a * L, b * L))], [-1, 1], [-1, 1], { n: 44, colorFn: (a, b, P) => M.cmap((P[2] + 0.7) / 1.1, 'viridis'), alpha: 0.92 });
          S3.path([[-1, -1, -0.72], [1, -1, -0.72], [1, 1, -0.72], [-1, 1, -0.72]], { color: 'faint', width: 1, close: true });
          S3.text('Re', [1.15, -1, -0.72], { color: 'muted', math: true }); S3.text('Im', [-1, 1.15, -0.72], { color: 'muted', math: true });
          list.forEach((e) => { S3.dot([e.z[0] / L, e.z[1] / L, -0.74], { r: 5.5, color: 'red', bias: 0.3 }); if (e.d > 1) S3.text(`×${e.d}`, [e.z[0] / L, e.z[1] / L, -0.74], { color: 'red', size: 12, dx: 14, dy: 8 }); });
          // winding staircase
          const deg = q.length - 1;
          W.setView([0.05, 30], [-0.4, Math.max(deg, n) + 1]);
          W.hline(n, { color: 'green', width: 1.6, dash: [6, 4] });
          W.text(`n = ${n}`, 0.07, n + 0.3, { color: 'green', size: 12, weight: 700 });
          ed.forEach((e) => W.vline(cabs(e.z), { color: 'red', width: 1, alpha: 0.5, dash: [3, 4] }));
          const pts = []; rs.forEach((rr, i) => { pts.push([rr, wn[i]]); if (i + 1 < rs.length) pts.push([rs[i + 1], wn[i]]); });
          W.path(pts, { color: deg === n ? 'accent' : 'red', width: 2.6 });
          const errs = ed.map((e) => cabs(cPolyEval(q, e.z)));
          st = { n, deg, ed, list, errs, final: wn[wn.length - 1] };
        });
        v.legend([['red', 'eigenvalues (and their moduli, right)', { dot: true }], ['accent', 'number of zeros inside $|z| = r$'], ['green', '$\\dim V$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { n, deg, ed, list, errs, final } = st;
          const zs = list.map((e) => `${czT(e.z)}${e.d > 1 ? `\\ (\\times${e.d})` : ''}`).join(',\\ ');
          let s = `$q(z) = ${factorT(list)}$ has degree $${deg}$ (winding number for large $r$: $${final}$), zeros $${zs}$; $|q(\\lambda)| \\le ${v.sci(Math.max(...errs), 1)}$ at every eigenvalue. `;
          s += geo.value ? (deg < n ? `**Degree ${deg} < ${n} = \\dim V**: eigenspace dimensions undercount — only multiplicities give degree $\\dim V$.` : 'Here every eigenspace is as large as its generalized eigenspace, so nothing changes.') : `**Degree $= ${n} = \\dim V$**, and the zeros are exactly the ${ed.length} eigenvalues.`;
          return s;
        });
      },
    },
  ],
};
