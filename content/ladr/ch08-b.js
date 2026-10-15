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
function cRank(M, A, tol = 1e-8) {
  if (cMaxAbs(A) < 1e-14) return 0;
  const S = M.svd(realify(A)).S, t = tol * S[0];
  return Math.round(S.filter((s) => s > t).length / 2);
}
/** Orthonormal basis of the complex null space of A. */
function cNullO(M, A, tol = 1e-8) {
  const m = A[0].length;
  if (cMaxAbs(A) < 1e-14) return cIdent(m);
  const R = realify(A), S = M.svd(R).S, N = M.nullspace(R, tol * S[0]);
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
  const n = T.length, A = cShift(T, mu), d = [0]; let P = A;
  for (let k = 1; k <= n; k++) { d.push(n - cRank(M, P)); if (d[k] === d[k - 1]) break; P = cMM(P, A); }
  return d;
}
/** Eigenvalues of a complex matrix, clustered, with algebraic (dim G) and geometric (dim E) multiplicities, all computed. */
function eigenData(M, T) {
  const vals = M.eigC(T, { vectors: false }).values.map((z) => [z.re, z.im]);
  return clusters(vals).map((c) => { const d = genDims(M, T, c.z); return { z: c.z, count: c.count, alg: d[d.length - 1], geo: d[1] ?? 0, dims: d }; })
    .sort((a, b) => a.z[0] - b.z[0] || a.z[1] - b.z[1]);
}
/** Random complex matrix close to the identity (well conditioned), from a seeded rng. */
const randS = (r, n, amp = 0.55) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => [(i === j ? 1 : 0) + r.uniform(-amp, amp), r.uniform(-amp, amp)]));
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
const factorT = (list, v = 'z') => list.map(({ z, d }) => { const s = czT(z); const b = s === '0' ? v : `(${v} ${s.startsWith('-') ? '+' : '-'} ${s.startsWith('-') ? s.slice(1) : (z[0] !== 0 && z[1] !== 0 ? `(${s})` : s)})`; return d > 1 ? `${b}^{${d}}` : b; }).join('');
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
  ],
};
