// Linear Algebra Done Right (Axler, 4th ed.) — Chapter 9: Multilinear Algebra and Determinants
// Part 6 (9.59–9.67): positive operators, |det| and singular values, volume, the characteristic polynomial as
// det(zI − T), the Cayley–Hamilton theorem over R by complexification, trace and determinant as coefficients,
// Hadamard's inequality and the Vandermonde determinant. Part 5 (9.50–9.58) is ch09-e.js.

// =====================================================================================================
// Shared helpers
// =====================================================================================================
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sub = (k) => String(k).split('').map((d) => SUBS[+d]).join('');
const TAU = 2 * Math.PI;
/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** The same for canvas text (real minus sign). */
const pn = (x, d = 2) => tn(x, d).replace('-', '−');
/** TeX for a complex number given as [re, im]. */
function ctn(z, d = 2) {
  const e = 0.5 * 10 ** -d, a = Math.abs(z[0]) < e ? 0 : z[0], b = Math.abs(z[1]) < e ? 0 : z[1];
  if (b === 0) return tn(a, d);
  const bs = tn(Math.abs(b), d) === '1' ? '' : tn(Math.abs(b), d);
  if (a === 0) return `${b < 0 ? '-' : ''}${bs}i`;
  return `${tn(a, d)} ${b < 0 ? '-' : '+'} ${bs}i`;
}
/** Compact canvas text for a complex number. */
const cpn = (z, d = 2) => ctn(z, d).replace(/ /g, '').replace(/-/g, '−');
const mtex = (A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((x) => tn(x, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
const vtex = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\,')})`;
/** "a + b" in TeX with the sign of b folded in. */
const plus = (b, d = 2) => (b < 0 ? `- ${tn(-b, d)}` : `+ ${tn(b, d)}`);
/** Polynomial (ascending real coefficients) as TeX in the variable v. */
function polyTeX(c, v = 'z', d = 2) {
  let s = '';
  for (let k = c.length - 1; k >= 0; k--) {
    const x = c[k]; if (Math.abs(x) < 0.5 * 10 ** -d) continue;
    const mon = k === 0 ? '' : k === 1 ? v : `${v}^{${k}}`, a = tn(Math.abs(x), d), co = a === '1' && mon ? '' : a;
    s += s ? ` ${x < 0 ? '-' : '+'} ${co}${mon}` : `${x < 0 ? '-' : ''}${co}${mon}`;
  }
  return s || '0';
}
const nice = (x, list = [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 40, 60, 100]) => list.find((t) => t >= x) ?? list[list.length - 1];

// ---------- real vectors and matrices ----------
const add = (a, b) => a.map((x, i) => x + b[i]);
const subv = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const len = (a) => Math.hypot(...a);
const mv = (A, x) => A.map((r) => dot(r, x));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const transp = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const clone = (A) => A.map((r) => r.slice());
const maxAbs = (A) => Math.max(0, ...A.flat().map(Math.abs));
const det2 = (T) => T[0][0] * T[1][1] - T[0][1] * T[1][0];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// ---------- complex numbers and matrices ----------
const C1 = [1, 0];
const toC = (x) => (Array.isArray(x) ? x : x && x.re !== undefined ? [x.re, x.im] : [x, 0]);
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cabs = (a) => Math.hypot(a[0], a[1]);
const cscl = (a, k) => [a[0] * k, a[1] * k];
const cM = (A) => A.map((r) => r.map(toC));
const cEye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? [1, 0] : [0, 0])));
const cMul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => cadd(s, cmul(x, B[k][j])), [0, 0])));
const cShift = (A, lam) => A.map((r, i) => r.map((z, j) => (i === j ? csub(z, lam) : z)));
const cMax = (A) => Math.max(0, ...A.flat().map(cabs));
/** Determinant of a complex matrix by Gaussian elimination with partial pivoting. */
function cDet(A) {
  const n = A.length, R = A.map((r) => r.map((z) => toC(z).slice()));
  let d = [1, 0];
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (cabs(R[r][c]) > cabs(R[p][c])) p = r;
    if (cabs(R[p][c]) === 0) return [0, 0];
    if (p !== c) { [R[p], R[c]] = [R[c], R[p]]; d = cscl(d, -1); }
    d = cmul(d, R[c][c]);
    for (let r = c + 1; r < n; r++) { const f = cdiv(R[r][c], R[c][c]); if (f[0] || f[1]) for (let k = c; k < n; k++) R[r][k] = csub(R[r][k], cmul(f, R[c][k])); }
  }
  return d;
}
/** det(zI − A) for a real matrix A and complex z, straight from the matrix (no eigenvalues, no coefficients). */
const detShift = (A, z) => cDet(A.map((r, i) => r.map((x, j) => (i === j ? [z[0] - x, z[1]] : [-x, 0]))));
/** Rank of a complex matrix by row reduction with partial pivoting (entries below rtol·max|entry| count as 0). */
function cRank(A, rtol = 1e-8) {
  const m = A.length, n = A[0].length, R = A.map((r) => r.map((z) => z.slice()));
  const t = rtol * Math.max(1e-300, cMax(A)); let rank = 0;
  for (let col = 0, row = 0; col < n && row < m; col++) {
    let p = row; for (let i = row + 1; i < m; i++) if (cabs(R[i][col]) > cabs(R[p][col])) p = i;
    if (cabs(R[p][col]) <= t) continue;
    [R[row], R[p]] = [R[p], R[row]];
    for (let i = row + 1; i < m; i++) { const f = cdiv(R[i][col], R[row][col]); if (f[0] || f[1]) R[i] = R[i].map((z, j) => csub(z, cmul(f, R[row][j]))); }
    row++; rank++;
  }
  return rank;
}

// ---------- exact multiplicities for integer matrices (rational polynomials in BigInt) ----------
const bgcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const Q = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = bgcd(n, d); return g > 1n ? [n / g, d / g] : [n, d]; };
const qsub = (a, b) => Q(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const qmul = (a, b) => Q(a[0] * b[0], a[1] * b[1]);
const qdiv = (a, b) => Q(a[0] * b[1], a[1] * b[0]);
const ptrim = (p) => { const a = p.slice(); while (a.length > 1 && a[a.length - 1][0] === 0n) a.pop(); return a; };
const pder = (p) => (p.length < 2 ? [Q(0n)] : p.slice(1).map((c, k) => qmul(c, Q(BigInt(k + 1)))));
function pdm(a, b) {
  a = ptrim(a); b = ptrim(b); const db = b.length - 1, r = a.slice();
  if (a.length - 1 < db) return { q: [Q(0n)], r: a };
  const q = Array(a.length - db).fill(Q(0n));
  for (let k = a.length - 1 - db; k >= 0; k--) { const f = qdiv(r[k + db], b[db]); q[k] = f; for (let j = 0; j <= db; j++) r[k + j] = qsub(r[k + j], qmul(f, b[j])); }
  return { q: ptrim(q), r: ptrim(r.slice(0, Math.max(1, db))) };
}
const pzero = (p) => ptrim(p).every((c) => c[0] === 0n);
function pgcd(a, b) { a = ptrim(a); b = ptrim(b); while (!pzero(b)) { const r = pdm(a, b).r; a = b; b = r; } const lc = a[a.length - 1]; return a.map((c) => qdiv(c, lc)); }
/**
 * Eigenvalues with exact multiplicities of a real matrix with integer entries: the characteristic polynomial (exact
 * for small integers) is split into square-free layers by repeated gcds with the derivative, in exact rational
 * arithmetic; each layer has simple zeros, found accurately by polyRoots and a Newton polish. → {cp, eig: [{lam, m}]}.
 */
function spectrumInt(M, A) {
  const c = M.charPoly(A).map((x) => Math.round(x)), p = c.map((x) => Q(BigInt(x)));
  const g = [p];
  while (ptrim(g[g.length - 1]).length > 1) { const h = g[g.length - 1]; g.push(pgcd(h, pder(h))); }
  const s = []; for (let k = 1; k < g.length; k++) s.push(pdm(g[k - 1], g[k]).q);
  const out = [];
  s.forEach((sk, k) => {
    const layer = k + 1 < s.length ? pdm(sk, s[k + 1]).q : sk, coef = ptrim(layer).map((q) => Number(q[0]) / Number(q[1]));
    if (coef.length < 2) return;
    for (const z of M.polyRoots(coef)) {
      let w = [z.re, z.im];
      for (let it = 0; it < 3; it++) {
        let f = [0, 0], fp = [0, 0];
        for (let j = coef.length - 1; j >= 0; j--) { fp = cadd(cmul(fp, w), f); f = cadd(cmul(f, w), [coef[j], 0]); }
        if (cabs(fp) > 1e-300) w = csub(w, cdiv(f, fp));
      }
      const sc = 1 + cabs(w);
      if (Math.abs(w[1]) < 1e-10 * sc) w[1] = 0;
      for (const i of [0, 1]) if (Math.abs(w[i] - Math.round(w[i])) < 1e-9 * sc) w[i] = Math.round(w[i]);
      out.push({ lam: w, m: k + 1 });
    }
  });
  return { cp: c, eig: out.sort((a, b) => a.lam[0] - b.lam[0] || a.lam[1] - b.lam[1]) };
}

// ---------- drawing and editing ----------
function colHandles(S, A, cols = ['accent', 'orange'], names = ['$Te_1$', '$Te_2$']) {
  const H = [0, 1].map((k) => S.handle(A[0][k], A[1][k], { color: cols[k], label: names[k] }));
  return { H, get A() { return [[H[0].x, H[1].x], [H[0].y, H[1].y]]; }, set(B) { H[0].set(B[0][0], B[1][0]); H[1].set(B[0][1], B[1][1]); } };
}
function editable(s, T, o) {
  let d = null;
  s.onDrag((x, y, ph) => {
    if (ph === 'start') {
      const c = T.geo ? T.hit(x, y) : null;
      d = c && c.i >= 0 && c.j >= 0 && (!o.ok || o.ok(c.i, c.j)) ? { ...c, Y: s.Y(y), done: 0, moved: false } : null;
      if (!d && o.miss) o.miss(x, y);
      return;
    }
    if (!d) return;
    const dy = d.Y - s.Y(y);
    if (ph === 'move' && (d.moved || Math.abs(dy) > 5)) { d.moved = true; const k = Math.round(dy / 14); if (k !== d.done) { o.bump(d.i, d.j, k - d.done); d.done = k; } }
    if (ph === 'end') {
      if (!d.moved) { const r = T.cellRect(d.i, d.j); o.bump(d.i, d.j, y > (r[1] + r[3]) / 2 ? 1 : -1); }
      d = null;
    }
  });
}
function ttl(s, T, tex, color = 'ink', below = false, size = 15) {
  const g = T.geo; if (!g) return;
  s.texPx(tex, g.X0 + (g.cols * g.cw) / 2, below ? g.Y0 + g.rows * g.ch + 15 : g.Y0 - g.lh - 14, { color, size });
}
function ppiped(sc, a, b, c, st = {}) {
  const o = [0, 0, 0], ab = add(a, b), ac = add(a, c), bc = add(b, c), abc = add(ab, c);
  for (const f of [[o, a, ab, b], [c, ac, abc, bc], [o, a, ac, c], [b, ab, abc, bc], [o, b, bc, c], [a, ab, abc, ac]]) {
    sc.poly(f, { fill: st.color || 'accent', fillAlpha: st.fillAlpha ?? 0.1, color: st.color || 'accent', width: st.width ?? 1, alpha: st.alpha ?? 0.55 });
  }
}
/** A panel-coloured plate in pixel coordinates, to keep a label legible over a busy background. */
function plate(S, X0, Y0, w, h) { S.rect(S.invX(X0), S.invY(Y0), S.invX(X0 + w), S.invY(Y0 + h), { fill: 'panel', fillAlpha: 0.88, stroke: false, radius: 6 }); }
/** Corner status text (top left) on a plate. */
function plateCorner(S, str, color, size = 12.5) {
  const c = S.ctx; c.save(); c.font = `700 ${size}px Inter, system-ui, sans-serif`; const w = c.measureText(str).width; c.restore();
  plate(S, 4, 5, w + 14, size + 12);
  S.textPx(str, 11, 11 + size / 2, { color, weight: 700, size, halo: false });
}
/** Latitude and longitude curves of the unit sphere, mapped through F (a wireframe of F(sphere)). */
function wireSphere(sc, F, st = {}, nLat = 5, nLon = 6, n = 40) {
  for (let i = 1; i <= nLat; i++) {
    const ph = (Math.PI * i) / (nLat + 1), pts = [];
    for (let k = 0; k <= n; k++) { const t = (TAU * k) / n; pts.push(F([Math.sin(ph) * Math.cos(t), Math.sin(ph) * Math.sin(t), Math.cos(ph)])); }
    sc.path(pts, st);
  }
  for (let j = 0; j < nLon; j++) {
    const t = (Math.PI * j) / nLon, pts = [];
    for (let k = 0; k <= n; k++) { const ph = (TAU * k) / n; pts.push(F([Math.sin(ph) * Math.cos(t), Math.sin(ph) * Math.sin(t), Math.cos(ph)])); }
    sc.path(pts, st);
  }
}

export default {
  collection: 'ladr',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.59
    {
      num: '9.59',
      kind: 'Theorem',
      name: 'Positive operators have nonnegative determinant',
      statement: String.raw`Suppose $V$ is an inner product space and $T \in \mathcal L(V)$ is a positive operator ($T$ is self-adjoint and $\langle Tv, v\rangle \ge 0$ for all $v \in V$). Then $\det T \ge 0$. The converse is false: a self-adjoint operator with an even number of negative eigenvalues has positive determinant without being positive.`,
      idea: String.raw`By the spectral theorem (7.29, 7.31), $V$ has an orthonormal basis $e_1, \dots, e_n$ of eigenvectors of $T$, so the matrix of $T$ in this basis is diagonal with the eigenvalues $\lambda_1, \dots, \lambda_n$ on the diagonal. By 9.53 and 9.48, $\det T = \lambda_1 \cdots \lambda_n$. Every eigenvalue of a positive operator is nonnegative (7.38), so the product is $\ge 0$. This fits the analogy that positive operators play the role of the nonnegative numbers.`,
      caption: String.raw`Left: a self-adjoint operator $T$ on $\mathbf R^2$, built from its eigenvalues $\lambda_1, \lambda_2$ (sliders) and an orthonormal eigenbasis (drag $e_1$ around the circle). The background is the quadratic form $v \mapsto \langle Tv, v\rangle$: blue where it is positive, red where it is negative, with the zero lines dark. The rectangle spanned by $\lambda_1e_1$ and $\lambda_2e_2$ is $T$ applied to the unit square on $e_1, e_2$, so its signed area is $\det T = \lambda_1\lambda_2$. Right: many random self-adjoint $n$-by-$n$ matrices, plotted by their smallest eigenvalue against $\operatorname{sign}(\det)\,|\det|^{1/n}$. The positive ones, right of the axis, never fall in the red quadrant. Push $\lambda_2$ below $0$ to make a saddle: the determinant turns negative. The converse fails: the orange points left of the axis have $\det > 0$ (an even number of negative eigenvalues) but are not positive.`,
      deps: ['ladr-7.38', 'ladr-7.29', 'ladr-7.31', 'ladr-9.53', 'ladr-9.48'],
      tags: ['determinants', 'positivity'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 340, minWidth: 280, title: '$\\langle Tv, v\\rangle$ and $T$(unit square on $e_1, e_2$)' });
        const R = v.stage({ x: [-3, 3], y: [-3, 3], height: 340, minWidth: 280, axes: true, xlabel: 'smallest eigenvalue', ylabel: 'sign(det)·|det|^(1/n)', title: 'random self-adjoint matrices' });
        const l1 = v.slider('$\\lambda_1$', -2, 2.5, 1.6, { step: 0.05 }), l2 = v.slider('$\\lambda_2$', -2, 2.5, 0.7, { step: 0.05 });
        const nS = v.select('$n$ for the samples', [2, 3, 4, 6], 2);
        const e1 = L.handle(Math.cos(0.5), Math.sin(0.5), { color: 'ink', label: '$e_1$', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        let cache = null, st = null;
        const samples = (n) => {
          if (cache && cache.n === n) return cache.pts;
          const r = v.rng(11 + n), pts = [];
          for (let s = 0; s < 500; s++) {
            const B = Array.from({ length: n }, () => Array.from({ length: n }, () => r.normal()));
            const A = s % 2 ? mm(transp(B), B).map((row) => row.map((x) => x / n)) : B.map((row, i) => row.map((x, j) => (x + B[j][i]) / 2));
            const lm = M.eigSym(A).values[n - 1], d = M.det(A);
            pts.push([lm, Math.sign(d) * Math.abs(d) ** (1 / n)]);
          }
          cache = { n, pts };
          return pts;
        };
        v.render(() => {
          const th = Math.atan2(e1.y, e1.x), u = [Math.cos(th), Math.sin(th)], w = [-u[1], u[0]], a = l1.value, b = l2.value;
          const T = [[a * u[0] * u[0] + b * w[0] * w[0], a * u[0] * u[1] + b * w[0] * w[1]], [a * u[0] * u[1] + b * w[0] * w[1], a * u[1] * u[1] + b * w[1] * w[1]]];
          const d = M.det(T), pos = a >= 0 && b >= 0;
          const q = (x, y) => x * (T[0][0] * x + T[0][1] * y) + y * (T[1][0] * x + T[1][1] * y);
          const m = Math.max(0.5, Math.abs(a), Math.abs(b)) * 9;
          L.raster((x, y) => { const c = M.cmap(M.clamp(0.5 - q(x, y) / (2 * m), 0, 1), 'diverging'); return [c[0], c[1], c[2], 150]; }, { res: 3, key: `${a}|${b}|${th}` });
          L.contour(q, [0], { color: 'ink', width: 1.6, res: 90 });
          L.contour(q, [-1, 1], { color: 'ink', width: 0.8, dash: [3, 4], res: 90 });
          L.circle(0, 0, 1, { color: 'ink', width: 1, alpha: 0.4 });
          L.poly([[0, 0], u, add(u, w), w], { color: 'ink', width: 1.2, dash: [4, 4] });
          const A1 = scl(u, a), B1 = scl(w, b), col = d < 0 ? 'red' : pos ? 'green' : 'orange';
          L.poly([[0, 0], A1, add(A1, B1), B1], { fill: col, fillAlpha: 0.35, color: col, width: 2 });
          L.arrow(0, 0, A1[0], A1[1], { color: 'accent', width: 2.6 }); L.arrow(0, 0, B1[0], B1[1], { color: 'purple', width: 2.6 });
          L.tex('\\lambda_1e_1', A1[0], A1[1], { color: 'accent', size: 13, dx: A1[0] >= 0 ? 18 : -18, dy: -12 });
          L.tex('\\lambda_2e_2', B1[0], B1[1], { color: 'purple', size: 13, dx: B1[0] >= 0 ? 18 : -18, dy: -12 });
          plateCorner(L, pos ? `positive: det = ${pn(d, 3)} ≥ 0` : d < 0 ? `saddle: det = ${pn(d, 3)} < 0` : `not positive, det = ${pn(d, 3)}`, col);
          // the samples
          const n = nS.value, pts = samples(n);
          R.rect(0, -3, 3, 0, { fill: 'red', fillAlpha: 0.08, stroke: false });
          R.text('positive and det < 0: never', 1.5, -2.6, { align: 'center', color: 'red', size: 12, weight: 600 });
          const P = pts.filter((p) => p[0] >= 0), Nn = pts.filter((p) => p[0] < 0 && p[1] < 0), Np = pts.filter((p) => p[0] < 0 && p[1] >= 0);
          R.dots(Nn, { r: 2.4, color: 'muted', alpha: 0.6 });
          R.dots(Np, { r: 2.4, color: 'orange', alpha: 0.7 });
          R.dots(P, { r: 2.4, color: 'green', alpha: 0.7 });
          if (n === 2) R.dot(Math.min(a, b), Math.sign(d) * Math.sqrt(Math.abs(d)), { r: 7, color: 'gold', label: 'T', labelPos: 'ne' });
          st = { T, a, b, d, pos, n, nPos: P.length, minPos: Math.min(...P.map((p) => p[1])), nNp: Np.length, N: pts.length };
        });
        v.legend([['green', 'positive', { dot: true }], ['orange', 'not positive, $\\det \\ge 0$', { dot: true }], ['muted', 'not positive, $\\det < 0$', { dot: true }], ['gold', 'the $T$ on the left ($n = 2$)', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { T, a, b, d, pos, n, nPos, minPos, nNp, N } = st;
          const head = `$T = ${mtex(T, 2)}$ has eigenvalues $${tn(a, 2)}, ${tn(b, 2)}$ and $\\det T = ${tn(d, 4)}$ ${pos ? '$\\ge 0$: positive, as the theorem says.' : d < 0 ? '$< 0$ — but $T$ is not positive (a saddle), so the theorem does not apply.' : '$\\ge 0$ although $T$ is not positive: the converse fails.'}`;
          return `${head} Samples ($n = ${n}$): ${nPos} of ${N} are positive, and the smallest value of $\\operatorname{sign}(\\det)|\\det|^{1/n}$ among them is $${minPos === 0 ? '0' : v.sci(minPos, 2)} \\ge 0$; ${nNp} non-positive ones still have $\\det \\ge 0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.60
    {
      num: '9.60',
      kind: 'Theorem',
      name: '|det T| = product of singular values',
      statement: String.raw`Suppose $V$ is an inner product space and $T \in \mathcal L(V)$ has singular values $s_1, \dots, s_n$. Then
$$|\det T| = \sqrt{\det(T^*T)} = s_1 s_2 \cdots s_n.$$`,
      idea: String.raw`By 9.56(c) and 9.49, $|\det T|^2 = \overline{\det T}\,\det T = \det(T^*)\det T = \det(T^*T)$. The operator $T^*T$ is positive with eigenvalues $s_1^2, \dots, s_n^2$ (7.65), and it has an orthonormal eigenbasis (7.29, 7.31). Its matrix in that basis is diagonal, so $\det(T^*T) = s_1^2 \cdots s_n^2$. Taking square roots gives the result. Geometrically, $T$ maps the unit ball onto an ellipsoid with semi-axes $s_1, \dots, s_n$. The eigenvalues of $T$ are a different list, and only the products of their moduli agree.`,
      caption: String.raw`Drag the columns $Te_1, Te_2, Te_3$ (drag the background to rotate) or pick a preset. The blue wireframe is $T$ applied to the unit sphere: an ellipsoid whose semi-axes $s_ku_k$ (thick arrows) come from the singular value decomposition. Right, on a logarithmic axis, where multiplying means adding lengths: the factors $s_1, s_2, s_3$ are laid head to tail as a staircase that ends at $s_1s_2s_3$ (green dashed line). The bars for $|\det T|$ (computed by row reduction) and $\sqrt{\det(T^*T)}$ end on the same line. The bottom staircase multiplies another list. For the shear, the moduli of the eigenvalues are individually different from the singular values, yet their product lands in the same place (9.55). The column lengths overshoot, which is Hadamard's inequality (9.66). Products of diagonal entries land anywhere.`,
      deps: ['ladr-9.56', 'ladr-9.49', 'ladr-7.65', 'ladr-7.29', 'ladr-7.31'],
      see: ['ladr-9.55', 'ladr-9.66'],
      tags: ['determinants', 'singular values'],
      viz(v) {
        const M = v.M;
        const PRE = { gen: [[1.3, 0.3, -0.2], [0.2, 0.8, 0.5], [-0.3, 0.2, 1.1]], shear: [[0.7, 1.4, 0], [0, 0.7, 0.9], [0, 0, 1.2]], rot: [[0.4, -1.2, 0], [1.2, 0.4, 0], [0, 0, 0.6]], thin: [[1.3, 1.2, 0.2], [0.2, 0.3, 0.1], [0.1, 0.2, 0.25]] };
        const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 340, minWidth: 280, title: '$T$(unit sphere) and its semi-axes $s_k u_k$' });
        const B = v.stage({ x: [0.25, 4], y: [0, 6.2], xlog: true, height: 340, minWidth: 280, axes: 'box', yticks: [], title: 'factors laid head to tail on a log scale' });
        const sc = v.scene3(S, { yaw: 0.6, pitch: 0.3, axis: 1.6, lim: 1.7 });
        const CC = ['blue', 'pink', 'teal'], SCOL = ['purple', 'orange', 'green'];
        let A = PRE.gen.map((r) => r.slice());
        const col = (k) => A.map((r) => r[k]);
        const H = [0, 1, 2].map((k) => sc.handle(col(k), { color: CC[k], label: `$Te_${k + 1}$`, onDrag: (h) => { h.p.forEach((x, i) => { A[i][k] = x; }); } }));
        v.select('', [{ value: 'gen', label: 'generic' }, { value: 'shear', label: 'shear (not normal)' }, { value: 'rot', label: 'rotation-scaling' }, { value: 'thin', label: 'nearly flat' }], 'gen', { onChange: (k) => { A = PRE[k].map((r) => r.slice()); H.forEach((h, j) => h.set(col(j))); } });
        const cmp = v.select('compare with', [{ value: 'eig', label: '$|\\lambda_k|$' }, { value: 'col', label: 'column lengths' }, { value: 'diag', label: '$|A_{k,k}|$' }], 'eig');
        let st = null;
        v.render(() => {
          const { U, S: s, V } = M.svd(A), d = M.det(A), dtt = M.det(mm(transp(A), A));
          const ev = M.eig(A, { vectors: false }).values.map((z) => Math.hypot(z.re, z.im)).sort((x, y) => y - x);
          sc.begin();
          wireSphere(sc, (p) => p, { color: 'muted', width: 0.7, alpha: 0.35 }, 3, 4, 32);
          wireSphere(sc, (p) => mv(A, p), { color: 'accent', width: 1.1, alpha: 0.75 });
          for (let k = 0; k < 3; k++) { const ax = [U[0][k] * s[k], U[1][k] * s[k], U[2][k] * s[k]]; sc.line(scl(ax, -1), [0, 0, 0], { color: SCOL[k], width: 1.4, dash: [4, 4] }, 1); sc.arrow([0, 0, 0], ax, { color: SCOL[k], width: 3.2 }); }
          H.forEach((h, k) => sc.line([0, 0, 0], h.p, { color: CC[k], width: 1.4, alpha: 0.8 }, 4));
          sc.flush();
          S.corner(`s = ${s.map((x) => pn(x, 3)).join(', ')}`, 'tl', { color: 'ink', weight: 700 });
          // log bars: each list as a staircase of factors, laid head to tail on a log axis
          const other = cmp.value === 'eig' ? ev : cmp.value === 'col' ? [0, 1, 2].map((k) => len(col(k))) : [0, 1, 2].map((k) => Math.abs(A[k][k]));
          const prodS = s[0] * s[1] * s[2], adet = Math.abs(d), rdet = Math.sqrt(Math.max(0, dtt));
          const partial = (l) => l.reduce((acc, f) => [...acc, acc[acc.length - 1] * f], [1]);
          const allP = [...partial(s), ...partial(other), adet, rdet].filter((x) => x > 1e-6);
          const lo = Math.min(0.5, Math.min(...allP) / 1.6), hi = Math.max(2, Math.max(...allP) * 1.6), cl = (x) => M.clamp(x, lo, hi);
          B.setView([lo, hi], [0, 6.2]);
          B.vline(1, { color: 'muted', width: 1 });
          B.vline(cl(prodS), { color: 'green', width: 1.6, dash: [5, 4] });
          const stair = (y0, label, list, cols, alt) => {
            B.text(label, lo, y0 + 0.45, { dx: 6, align: 'left', size: 12, color: alt ? 'gold' : 'ink', weight: 700 });
            let x = 1;
            list.forEach((f, k) => {
              const nx = x * f, x0 = cl(x), x1 = cl(nx), y = y0 - 0.42 * k, h = 0.13;
              B.rect(Math.min(x0, x1), y - h, Math.max(x0, x1), y + h, { fill: cols[k], fillAlpha: 0.55, color: cols[k], width: 1.2 });
              if (k) B.line(x0, y + h, x0, y + 0.42 - h, { color: 'muted', width: 1, dash: [2, 2] });
              B.text(`×${pn(f, 2)}`, x1, y, { dx: nx >= x ? 6 : -6, align: nx >= x ? 'left' : 'right', size: 11, color: 'ink' });
              x = nx;
            });
            return x;
          };
          const endS = stair(5.4, 'singular values s₁, s₂, s₃', s, SCOL, false);
          B.rect(Math.min(1, cl(adet)), 3.65, Math.max(1, cl(adet)), 3.91, { fill: 'green', fillAlpha: 0.55, color: 'green', width: 1.2 });
          B.text(`|det T| = ${pn(adet, 3)}`, lo, 4.18, { dx: 6, align: 'left', size: 12, color: 'green', weight: 700 });
          B.rect(Math.min(1, cl(rdet)), 3.2, Math.max(1, cl(rdet)), 3.46, { fill: 'green', fillAlpha: 0.25, color: 'green', width: 1.2, dash: [4, 3] });
          B.text(`√det(T*T) = ${pn(rdet, 3)}`, cl(rdet), 3.33, { dx: rdet >= 1 ? 6 : -6, align: rdet >= 1 ? 'left' : 'right', size: 11, color: 'green' });
          const endO = stair(2.0, { eig: '|eigenvalues|', col: 'column lengths', diag: '|diagonal entries|' }[cmp.value], other, ['gold', 'gold', 'gold'], true);
          B.dot(cl(endO), 2.0 - 0.84, { r: 4, color: Math.abs(endO - adet) < 1e-6 * (1 + adet) ? 'green' : 'red' });
          st = { s, d, dtt, prodS, ev, other };
        });
        v.legend([['accent', '$T$(unit sphere)'], ['purple', 'semi-axes / singular values'], ['green', '$|\\det T|$'], ['gold', 'the comparison list']]);
        v.readout(() => {
          if (!st) return '';
          const { s, d, dtt, prodS, other } = st, po = other.reduce((p, x) => p * x, 1);
          const what = { eig: 'the moduli of the eigenvalues', col: 'the column lengths', diag: 'the moduli of the diagonal entries' }[cmp.value];
          return `$s_1s_2s_3 = ${s.map((x) => tn(x, 3)).join(' \\cdot ')} = ${tn(prodS, 5)}$, $|\\det T| = ${tn(Math.abs(d), 5)}$, $\\sqrt{\\det(T^*T)} = ${tn(Math.sqrt(Math.max(0, dtt)), 5)}$. The product of ${what} is $${tn(po, 5)}$${cmp.value === 'col' ? ' $\\ge |\\det T|$' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.61
    {
      num: '9.61',
      kind: 'Corollary',
      name: 'T changes volume by a factor of |det T|',
      statement: String.raw`Suppose $T \in \mathcal L(\mathbf R^n)$ and $\Omega \subseteq \mathbf R^n$. Then
$$\operatorname{volume} T(\Omega) = |\det T|\,(\operatorname{volume} \Omega).$$
The factor is the same for every region $\Omega$; this is why $|\det|$ of a derivative appears in the change of variables formula of multivariable calculus.`,
      idea: String.raw`If $T$ is invertible, 7.111 says that $T$ multiplies every volume by the product of its singular values, and 9.60 identifies that product with $|\det T|$. If $T$ is not invertible, $T(\Omega)$ lies in a proper subspace, which has volume $0$, and $\det T = 0$ (9.50). Linearity is what makes the factor independent of $\Omega$. For a nonlinear map the local factor $|\det|$ of the derivative changes from point to point.`,
      caption: String.raw`Left: a region $\Omega$ (green) and its image (blue) under $F(x) = Tx + \beta\,g(x)$, where $g(x) = 0.35\,x_1x$ is a fixed quadratic map (drag the background to rotate). Both volumes are measured independently, as the volume enclosed by a triangulated surface (the divergence theorem: a sum of signed tetrahedra). Right: the measured ratio $\operatorname{vol} F(\Omega) / \operatorname{vol}\Omega$ as $\Omega$ slides along the $x$-axis. Move it with *position* and resize it with *size*. With $\beta = 0$ the map is linear, and the curve is flat at $|\det T|$ (green dashed) for every shape, position and size. Raise $\beta$ to break linearity: the ratio starts to depend on where $\Omega$ is.`,
      deps: ['ladr-7.111', 'ladr-9.60'],
      see: ['rca-2.23'],
      tags: ['determinants', 'geometry'],
      viz(v) {
        const M = v.M;
        const PRE = { gen: [[1.5, 0.4, 0.1], [-0.2, 1.1, 0.3], [0.2, -0.3, 1.2]], shear: [[1, 0.9, 0.4], [0, 1, 0.7], [0, 0, 1]], flip: [[0.2, 1.1, 0], [1.0, 0.1, 0.2], [0.1, 0.2, 0.9]], flat: [[1, 0.5, 0.8], [0.2, 0.9, 0.6], [0.4, 0.3, 0.55]] };
        let T = PRE.gen;
        const S = v.stage({ x: [-2.2, 2.2], y: [-2, 2.2], equal: true, axes: false, height: 340, minWidth: 280, title: '$\\Omega$ (green) and $F(\\Omega)$ (blue)' });
        const G = v.stage({ x: [-1, 1], y: [0, 2], height: 340, minWidth: 280, axes: 'box', xlabel: 'position of Ω', title: 'measured $\\operatorname{vol} F(\\Omega)/\\operatorname{vol} \\Omega$' });
        const sc = v.scene3(S, { yaw: 0.55, pitch: 0.3, axis: 1.7, lim: 2 });
        v.select('$T$', [{ value: 'gen', label: 'generic' }, { value: 'shear', label: 'shear' }, { value: 'flip', label: '$\\det T < 0$' }, { value: 'flat', label: 'nearly singular' }], 'gen', { onChange: (k) => { T = PRE[k]; } });
        const shape = v.select('$\\Omega$', [{ value: 'blob', label: 'blob' }, { value: 'ball', label: 'ball' }, { value: 'cube', label: 'cube' }], 'blob');
        const pos = v.slider('position', -1, 1, 0.3, { step: 0.01 }), size = v.slider('size', 0.3, 0.9, 0.6, { step: 0.01 });
        const beta = v.slider('bend $\\beta$ (break linearity)', 0, 0.6, 0, { step: 0.01 });
        const NU = 28, NV = 16;
        const radial = (kind, d) => (kind === 'ball' ? 1 : kind === 'cube' ? 1 / Math.max(...d.map(Math.abs)) : 1 + 0.22 * Math.sin(3 * Math.atan2(d[1], d[0])) * (1 - d[2] * d[2]) + 0.15 * d[2]);
        /** Surface grid of Ω (points P[i][j]), i over longitude, j over latitude including the poles. */
        const mesh = (kind, c, r) => {
          const P = [];
          for (let i = 0; i < NU; i++) {
            const u = (TAU * i) / NU, row = [];
            for (let j = 0; j <= NV; j++) { const w = (Math.PI * j) / NV, d = [Math.sin(w) * Math.cos(u), Math.sin(w) * Math.sin(u), Math.cos(w)]; row.push(add(c, scl(d, r * radial(kind, d)))); }
            P.push(row);
          }
          return P;
        };
        /** Enclosed volume of the triangulated grid (divergence theorem), signed. */
        const vol = (P) => {
          let s = 0;
          const tri = (a, b, c) => { s += dot(a, cross(b, c)) / 6; };
          for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const i1 = (i + 1) % NU, a = P[i][j], b = P[i1][j], c = P[i1][j + 1], d = P[i][j + 1]; tri(a, b, c); tri(a, c, d); }
          return s;
        };
        const F = (x, b) => add(mv(T, x), scl(x, 0.35 * b * x[0]));
        const ratioAt = (p, kind, r, b) => { const P = mesh(kind, [p, 0, 0], r); return Math.abs(vol(P.map((row) => row.map((x) => F(x, b)))) / vol(P)); };
        let st = null;
        v.render(() => {
          const kind = shape.value, r = size.value, b = beta.value, p = pos.value, dT = M.det(T);
          const P = mesh(kind, [p, 0, 0], r), FP = P.map((row) => row.map((x) => F(x, b))), v0 = Math.abs(vol(P)), v1 = Math.abs(vol(FP));
          sc.begin();
          const drawGrid = (Pm, color, alpha, w) => {
            for (let j = 2; j < NV; j += 2) sc.path([...Pm.map((row) => row[j]), Pm[0][j]], { color, width: w, alpha });
            for (let i = 0; i < NU; i += 2) sc.path(Pm[i], { color, width: w, alpha });
          };
          drawGrid(P, 'green', 0.7, 1);
          drawGrid(FP, 'accent', 0.85, 1.2);
          sc.flush();
          S.corner(`vol Ω = ${pn(v0, 4)}   vol F(Ω) = ${pn(v1, 4)}`, 'tl', { color: 'ink', weight: 700, size: 12 });
          // the ratio curve
          const xs = M.linspace(-1, 1, 21), ys = xs.map((x) => ratioAt(x, kind, r, b));
          const top = nice(1.25 * Math.max(Math.abs(dT), ...ys, 0.2), [0.5, 1, 1.5, 2, 3, 4, 5]);
          G.setView([-1, 1], [0, top]);
          G.hline(Math.abs(dT), { color: 'green', width: 2, dash: [6, 4] });
          G.text(`|det T| = ${pn(Math.abs(dT), 3)}`, 1, Math.abs(dT), { dx: -6, dy: -12, align: 'right', color: 'green', weight: 700, size: 12 });
          G.path(xs.map((x, i) => [x, ys[i]]), { color: b ? 'red' : 'accent', width: 2.6 });
          G.dots(xs.map((x, i) => [x, ys[i]]), { r: 2.6, color: b ? 'red' : 'accent' });
          G.dot(p, v1 / v0, { r: 6.5, color: 'gold' });
          const spread = Math.max(...ys) - Math.min(...ys);
          st = { v0, v1, dT, b, spread, lo: Math.min(...ys), hi: Math.max(...ys) };
        });
        v.legend([['green', '$\\Omega$ and the line $|\\det T|$'], ['accent', '$F(\\Omega)$, measured ratio'], ['gold', 'current position', { dot: true }], ['red', 'ratio when $F$ is not linear']]);
        v.readout(() => {
          if (!st) return '';
          const { v0, v1, dT, b, spread, lo, hi } = st;
          if (b) return `$F$ is not linear ($\\beta = ${tn(b, 2)}$): here the ratio is $${tn(v1 / v0, 4)}$, and along the slide it ranges from $${tn(lo, 3)}$ to $${tn(hi, 3)}$ — no single factor, because the local factor $|\\det F'(x)|$ varies with $x$.`;
          return `$\\operatorname{vol}T(\\Omega) / \\operatorname{vol}\\Omega = ${tn(v1, 5)} / ${tn(v0, 5)} = ${tn(v1 / v0, 6)}$ and $|\\det T| = ${tn(Math.abs(dT), 6)}$; along the whole slide the ratio varies by only $${v.sci(Math.max(spread, 1e-17), 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.62
    {
      num: '9.62',
      kind: 'Theorem',
      name: 'Over C, characteristic polynomial equals det(zI − T)',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$ and $T \in \mathcal L(V)$, with distinct eigenvalues $\lambda_1, \dots, \lambda_m$ of multiplicities $d_1, \dots, d_m$ (that is, $d_k = \dim G(\lambda_k, T)$). Then for every $z \in \mathbf C$,
$$\det(zI - T) = (z - \lambda_1)^{d_1} \cdots (z - \lambda_m)^{d_m}.$$
So the characteristic polynomial of 8.26 can be computed from any matrix of $T$ as a determinant.`,
      idea: String.raw`Choose a basis in which $T$ has an upper-triangular matrix with each $\lambda_k$ on the diagonal exactly $d_k$ times (8.37). In the same basis $zI - T$ is upper triangular with diagonal entries $z - \lambda_k$, each appearing $d_k$ times. Its determinant is the product of the diagonal (9.48), and it does not depend on the basis (9.53). The exponents are the dimensions of the *generalized* eigenspaces; the eigenspaces can be smaller.`,
      caption: String.raw`The background is a phase portrait of $z \mapsto \det(zI - A)$, computed as a determinant at every pixel with no eigenvalues involved. The colour is the argument and the shading shows the modulus. At a zero of order $d$ the colours wind $d$ times around. Edit the integer matrix on the right (click the top or bottom half of an entry, or drag it), or pick a preset. Drag the gold probe circle and its rim handle: the readout counts how many times $\det(zI - A)$ winds around $0$ along the circle, and compares that with $\sum \dim G(\lambda, A)$ over the eigenvalues inside. The table lists, for each eigenvalue, $\dim E(\lambda, A)$, $\dim G(\lambda, A)$ (both from ranks) and the exponent in $\det(zI - A)$. For a non-diagonalizable matrix the exponent follows $\dim G$, not $\dim E$.`,
      deps: ['ladr-8.37', 'ladr-9.48', 'ladr-8.26', 'ladr-9.53'],
      tags: ['determinants', 'characteristic polynomial'],
      viz(v) {
        const M = v.M;
        const PRE = {
          jordan: [[2, 4, 3, -4], [0, 6, 3, -4], [0, -3, -1, 3], [0, 4, 3, -2]],
          diag: [[2, 3, 3, -3], [0, 5, 3, -3], [0, -3, -1, 3], [0, 3, 3, -1]],
          cx: [[1, -2, 0, 2], [1, -3, 0, 4], [-1, 1, 0, -1], [0, -3, -1, 4]],
          nil: [[-1, 1, 0, 0], [-2, 0, -1, 2], [1, 0, 0, -1], [-1, 0, -1, 1]],
        };
        let A = clone(PRE.jordan), st = null, reprobe = true;
        v.select('', [{ value: 'jordan', label: '$2, 2, 2, -1$, not diagonalizable' }, { value: 'diag', label: '$2, 2, 2, -1$, diagonalizable' }, { value: 'cx', label: '$\\pm i$ and $1, 1$' }, { value: 'nil', label: 'nilpotent' }], 'jordan', { onChange: (k) => { A = clone(PRE[k]); reprobe = true; } });
        const D = v.stage({ x: [-3, 4], y: [-2.6, 2.6], equal: true, height: 360, weight: 1.3, minWidth: 300, title: 'phase portrait of $z \\mapsto \\det(zI - A)$' });
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, minWidth: 250 });
        const TA = v.table(E, { rows: 4, cols: 4, region: [0.08, 0.5, 0.92, 0.9], maxCell: 44, size: 13.5 });
        const TE = v.table(E, { rows: 3, cols: 4, region: [0.02, 0.08, 0.98, 0.42], maxCell: 50, square: false, cellAspect: 1.9, size: 12.5 });
        editable(E, TA, { bump: (i, j, k) => { A[i][j] = M.clamp(A[i][j] + k, -9, 9); } });
        const ctr = D.handle(2.25, 0.35, { color: 'gold' });
        const rim = D.handle(2.25, -0.55, { color: 'gold', r: 5 });
        let last = [2.25, 0.35];
        ctr.onDrag = () => { rim.x += ctr.x - last[0]; rim.y += ctr.y - last[1]; last = [ctr.x, ctr.y]; };
        v.render(() => {
          last = [ctr.x, ctr.y];
          const n = A.length, { eig, cp } = spectrumInt(M, A), Ac = cM(A);
          if (reprobe && eig.length) {
            reprobe = false;
            const e = eig.reduce((b, f) => (f.m > b.m ? f : b), eig[0]);
            ctr.x = e.lam[0] + 0.2; ctr.y = e.lam[1] - 0.25; rim.x = ctr.x; rim.y = ctr.y - 0.85; last = [ctr.x, ctr.y];
          }
          const key = JSON.stringify(A);
          D.domain((z) => { const w = detShift(A, [z.re, z.im]); return v.cx(w[0], w[1]); }, { key, res: 2, fade: 0.12 });
          D.axes();
          // dimensions from ranks
          const data = eig.map((e) => {
            const N = cShift(Ac, e.lam); let P = cEye(n); for (let k = 0; k < n; k++) P = cMul(P, N);
            return { ...e, dE: n - cRank(N, 1e-9), dG: n - cRank(P, 1e-9) };
          });
          // the probe circle and its winding number
          const c = [ctr.x, ctr.y], rr = Math.max(0.05, Math.hypot(rim.x - ctr.x, rim.y - ctr.y));
          let wind = 0, prev = null, minMod = Infinity; const K = 720;
          for (let k = 0; k <= K; k++) {
            const t = (TAU * k) / K, f = detShift(A, [c[0] + rr * Math.cos(t), c[1] + rr * Math.sin(t)]), a = Math.atan2(f[1], f[0]);
            minMod = Math.min(minMod, cabs(f));
            if (prev !== null) { let da = a - prev; if (da > Math.PI) da -= TAU; if (da < -Math.PI) da += TAU; wind += da; }
            prev = a;
          }
          wind = Math.round(wind / TAU);
          const inside = data.filter((e) => Math.hypot(e.lam[0] - c[0], e.lam[1] - c[1]) < rr), dSum = inside.reduce((s, e) => s + e.dG, 0);
          const near = data.some((e) => Math.abs(Math.hypot(e.lam[0] - c[0], e.lam[1] - c[1]) - rr) < 0.06);
          D.circle(c[0], c[1], rr, { color: 'ink', width: 3.2, alpha: 0.5 });
          D.circle(c[0], c[1], rr, { color: 'gold', width: 2 });
          data.forEach((e) => {
            D.dot(e.lam[0], e.lam[1], { r: 5, color: 'ink' });
            D.text(`${cpn(e.lam, 2)}${e.m > 1 ? `  ×${e.m}` : ''}`, e.lam[0], e.lam[1], { dy: -16, align: 'center', size: 12.5, weight: 700, color: 'ink' });
          });
          plateCorner(D, near ? 'the circle passes through a zero' : `winding number ${wind} · Σ dim G inside = ${dSum}`, near ? 'red' : wind === dSum ? 'green' : 'red');
          // the editor and the table of dimensions
          TA.draw({ value: (i, j) => A[i][j], fill: (i, j) => (i === j ? ['gold', 0.14] : null) });
          ttl(E, TA, 'A', 'ink', false, 16);
          TE.draw({
            rows: data.length + 1, cols: 4,
            value: (i, j) => (i === 0 ? ['$\\lambda$', '$\\dim E$', '$\\dim G$', 'exponent'][j] : [cpn(data[i - 1].lam, 2), data[i - 1].dE, data[i - 1].dG, data[i - 1].m][j]),
            fill: (i, j) => (i === 0 ? ['muted', 0.12] : j === 1 && data[i - 1].dE < data[i - 1].m ? ['red', 0.18] : j >= 2 ? ['green', 0.14] : null),
            weight: (i) => (i === 0 ? 700 : 500),
          });
          st = { eig: data, cp, wind, dSum, near, inside };
        });
        v.legend([['ink', 'zeros, labelled with their order', { dot: true }], ['gold', 'probe circle'], ['red', '$\\dim E$ smaller than the exponent', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { eig, cp, wind, dSum, near } = st;
          const fac = eig.map((e) => { const l = e.lam, base = cabs(l) < 1e-9 ? 'z' : `(z ${Math.abs(l[1]) < 1e-9 ? plus(-l[0], 3) : Math.abs(l[0]) < 1e-9 ? `${l[1] < 0 ? '+' : '-'} ${ctn([0, Math.abs(l[1])], 3)}` : `- (${ctn(l, 3)})`})`; return e.m > 1 ? `${base}^{${e.m}}` : base; }).join('');
          const ok = eig.every((e) => e.dG === e.m);
          const probe = near ? 'Move the probe circle off the zeros.' : `Along the probe circle $\\det(zI - A)$ winds ${wind} time${Math.abs(wind) === 1 ? '' : 's'} around $0$, and the generalized eigenspaces inside have total dimension ${dSum}${wind === dSum ? ' — equal.' : '.'}`;
          const pt = polyTeX(cp, 'z', 0);
          return `$\\det(zI - A) = ${pt}${pt === fac ? '' : ` = ${fac}`}$; every exponent equals $\\dim G(\\lambda, A)$${ok ? '' : ' — check failed'}. ${probe}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.63
    {
      num: '9.63',
      kind: 'Definition',
      name: 'Characteristic polynomial',
      statement: String.raw`Suppose $T \in \mathcal L(V)$, over $\mathbf R$ or $\mathbf C$. The **characteristic polynomial** of $T$ is the polynomial
$$z \mapsto \det(zI - T).$$
By the formula 9.46 it is a monic polynomial of degree $\dim V$, and by 9.51 its zeros in $\mathbf F$ are exactly the eigenvalues of $T$. When $\mathbf F = \mathbf C$ it agrees with the definition 8.26 (by 9.62).`,
      idea: String.raw`Choose any basis and let $A$ be the matrix of $T$; then $\det(zI - T) = \det(zI - A)$ (9.53). In the formula 9.46 for $\det(zI - A)$, every term is a product of $n$ entries of $zI - A$, each of degree at most $1$ in $z$. Only the identity permutation picks all $n$ diagonal entries $z - A_{k,k}$, so the sum is a polynomial of degree $n$ with leading coefficient $1$. The new definition makes sense over $\mathbf R$, where an operator may have no eigenvalues at all. That is why 8.26, a product over the eigenvalues, could not be used there.`,
      caption: String.raw`The gold dots are $\det(\lambda I - A)$ evaluated directly at many real $\lambda$, one determinant per dot. Drag the $n + 1$ orange nodes along the axis: the curve is the polynomial interpolating the determinant at those nodes alone. It passes through every gold dot and has leading coefficient $1$, so the function really is a monic polynomial of degree $n$. Its real zeros (green) are the eigenvalues of $A$ in $\mathbf R$. Edit the matrix (click the top or bottom half of an entry) or change $n$. The complex plane at the bottom right shows all $n$ zeros. The red ones are not real, so they are not eigenvalues when $\mathbf F = \mathbf R$. Switch the convention to $\det(A - \lambda I)$: same zeros, but for odd $n$ the polynomial is no longer monic.`,
      deps: ['ladr-9.41'],
      see: ['ladr-8.26', 'ladr-9.46', 'ladr-9.51'],
      tags: ['characteristic polynomial'],
      viz(v) {
        const M = v.M;
        const PRE = { 2: [[1, -2], [2, 1]], 3: [[1, 2, 0], [-1, 0, 1], [2, 1, 1]], 4: [[0, 1, 0, 2], [-1, 0, 1, 0], [1, 0, 1, 1], [0, 1, -2, 1]] };
        let A = clone(PRE[3]);
        const P = v.stage({ x: [-3, 3], y: [-8, 8], height: 300, full: true, axes: true, xlabel: 'λ', title: 'gold: $\\det(\\lambda I - A)$ at each $\\lambda$; curve: the interpolant through the orange nodes' });
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, minWidth: 240 });
        const Z = v.stage({ x: [-3, 3], y: [-2, 2], equal: true, height: 230, minWidth: 260, title: 'all zeros in $\\mathbf C$' });
        const nS = v.select('$n$', [2, 3, 4], 3, { onChange: (k) => { A = clone(PRE[k]); place(k); } });
        const conv = v.select('convention', [{ value: 'zi', label: '$\\det(\\lambda I - A)$' }, { value: 'iz', label: '$\\det(A - \\lambda I)$' }], 'zi');
        const TT = v.table(E, { rows: 3, cols: 3, region: [0.1, 0.12, 0.9, 0.82], maxCell: 46, size: 14 });
        editable(E, TT, { bump: (i, j, k) => { A[i][j] = M.clamp(A[i][j] + k, -9, 9); } });
        // the window is centred on tr A / n (the mean of the zeros), in steps of 0.5
        const centre = () => Math.round((2 * A.reduce((s, r, i) => s + r[i], 0)) / A.length) / 2;
        let win = [-2.8, 2.8];
        const H = [0, 1, 2, 3, 4].map((k) => P.handle(0, 0, { color: 'orange', r: 6, constrain: (x) => [M.clamp(x, win[0] + 0.1, win[1] - 0.1), 0] }));
        const place = (n) => { const m = centre(); H.forEach((h, k) => { h.visible = k <= n; h.set(m - 2.2 + (4.4 * k) / n + 0.13, 0); }); };
        place(3);
        let st = null;
        v.render(() => {
          const n = A.length, sgn = conv.value === 'iz' && n % 2 ? -1 : 1;
          const f = (x) => sgn * M.det(A.map((r, i) => r.map((a, j) => (i === j ? x - a : -a))));
          // interpolate through the nodes: solve the Vandermonde system for the coefficients
          const xs = H.slice(0, n + 1).map((h) => h.x), distinct = xs.every((x, i) => xs.every((y, j) => i === j || Math.abs(x - y) > 1e-3));
          let c = null;
          if (distinct) c = M.solve(xs.map((x) => Array.from({ length: n + 1 }, (_, k) => x ** k)), xs.map(f));
          const pv = (x) => c.reduce((s, a, k) => s + a * x ** k, 0);
          const m = centre(); win = [m - 2.8, m + 2.8];
          H.forEach((h) => { h.x = M.clamp(h.x, win[0] + 0.1, win[1] - 0.1); });
          const grid = M.linspace(win[0], win[1], 61), vals = grid.map(f), mid = grid.map((x, i) => (Math.abs(x - m) <= 1.9 ? Math.abs(vals[i]) : 0));
          const Y = nice(1.15 * Math.max(3, ...mid), [3, 4, 6, 8, 10, 15, 20, 30, 40, 60]);
          P.setView(win, [-Y, Y]);
          if (c) P.fn(pv, { color: 'accent', width: 2.6 });
          P.dots(grid.map((x, i) => [x, vals[i]]), { r: 3, color: 'gold' });
          xs.forEach((x) => { const y = f(x); P.line(x, 0, x, y, { color: 'orange', width: 1, dash: [3, 3] }); P.dot(x, y, { r: 5.5, color: 'orange' }); });
          const ev = M.eig(A, { vectors: false }).values.map((z) => [z.re, z.im]);
          const real = ev.filter((z) => Math.abs(z[1]) < 1e-9).map((z) => z[0]).sort((a, b) => a - b);
          real.forEach((x) => P.dot(x, 0, { r: 7, color: 'green', hollow: true, width: 2.6 }));
          const dev = c ? Math.max(...grid.map((x, i) => Math.abs(pv(x) - vals[i]) / (1 + Math.abs(vals[i])))) : NaN;
          plateCorner(P, c ? `leading coefficient ${pn(c[n], 6)}` : 'two nodes coincide', c && Math.abs(c[n] - 1) < 1e-6 ? 'green' : 'red');
          // editor
          TT.draw({ rows: n, cols: n, value: (i, j) => A[i][j], fill: (i, j) => (i === j ? ['gold', 0.14] : null) });
          ttl(E, TT, 'A', 'ink', false, 16);
          // zeros in C
          const R = nice(1.2 * Math.max(1.5, ...ev.map((z) => Math.max(Math.abs(z[0]), 1.5 * Math.abs(z[1])))), [2, 3, 4, 5, 6, 8, 10]);
          const Ry = Math.max(R / 1.5, 1.5 * Math.max(...ev.map((z) => Math.abs(z[1]))) + 0.4);
          Z.setView([-R, R], [-Ry, Ry]);
          ev.filter((z) => Math.abs(z[1]) >= 1e-9).forEach((z) => Z.dot(z[0], z[1], { r: 6, color: 'red', label: cpn(z, 2), labelPos: z[1] < 0 ? 's' : 'n' }));
          real.forEach((x, k) => Z.dot(x, 0, { r: 6, color: 'green', label: pn(x, 2), labelPos: k % 2 ? 's' : 'n' }));
          st = { n, c, dev, real, ev, sgn };
        });
        v.legend([['gold', '$\\det(\\lambda I - A)$, computed pointwise', { dot: true }], ['orange', 'interpolation nodes', { dot: true }], ['accent', 'interpolating polynomial'], ['green', 'real zeros = eigenvalues', { dot: true }], ['red', 'non-real zeros', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { n, c, dev, real, ev, sgn } = st;
          if (!c) return 'Two interpolation nodes coincide; pull them apart.';
          const nonreal = ev.length - real.length;
          const zs = real.length > 1 ? `its real zeros $${real.map((x) => tn(x, 3)).join(', ')}$ are the eigenvalues of $A$ in $\\mathbf R$` : real.length ? `its real zero $${tn(real[0], 3)}$ is the only eigenvalue of $A$ in $\\mathbf R$` : 'it has no real zero, so over $\\mathbf R$ this operator has no eigenvalue';
          return `The interpolant through ${n + 1} values is $${polyTeX(c, '\\lambda', 3)}$, and it matches the determinant at all 61 sample points (largest relative gap $${v.sci(Math.max(dev, 1e-17), 1)}$): a polynomial of degree ${n} with leading coefficient $${tn(c[n], 4)}$${sgn < 0 ? ' — not monic with this convention' : ''}. ${zs[0].toUpperCase() + zs.slice(1)}${nonreal ? `; ${nonreal} zero${nonreal > 1 ? 's are' : ' is'} not real` : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.64
    {
      num: '9.64',
      kind: 'Theorem',
      name: 'Cayley–Hamilton theorem over R and C',
      statement: String.raw`Suppose $T \in \mathcal L(V)$, where $\mathbf F$ is $\mathbf R$ or $\mathbf C$, and $q$ is the characteristic polynomial of $T$ (9.63). Then $q(T) = 0$.`,
      idea: String.raw`Over $\mathbf C$ this is 8.29, since $q$ is the polynomial of 8.26 by 9.62. Over $\mathbf R$, $T$ may have no eigenvalues, so complexify. Let $A$ be the matrix of $T$ in some basis, and let $S$ be the operator on $\mathbf C^n$ with matrix $A$. For real $z$, $q(z) = \det(zI - A) = \det(zI - S)$. Two polynomials that agree on $\mathbf R$ are equal, so $q$ is also the characteristic polynomial of $S$. The complex case gives $q(S) = 0$, and $q(S)$, $q(A)$ and the matrix of $q(T)$ are the same real matrix. So $q(T) = 0$.`,
      caption: String.raw`Left, the real plane: drag $Te_1$ and $Te_2$ to set $T$, and drag $v$ (gold). The path $T^2v$, then $-(\operatorname{tr}T)\,Tv$, then $(\det T)\,v$ (blue, orange, purple), laid head to tail, closes at $0$ for every $v$: that is $q(T)v = 0$. Right, the complexification: when $T$ has no real eigenvalue, its eigenvalue $\lambda \in \mathbf C$ with eigenvector $x \in \mathbf C^2$ turns $v$ into a complex coordinate $\zeta$ with $v = 2\operatorname{Re}(\zeta x)$. Then $T^kv = 2\operatorname{Re}(\zeta\lambda^k x)$, so the left path is the image, under the real-linear map $w \mapsto 2\operatorname{Re}(wx)$ (teal grid), of the triangle $\zeta\lambda^2, -(\operatorname{tr}T)\zeta\lambda, (\det T)\zeta$ in $\mathbf C$. That triangle closes because $q(\lambda) = 0$. To break it, switch on *use my own $p$* and drag its coefficients: both paths stop closing.`,
      deps: ['ladr-9.62', 'ladr-8.29', 'ladr-9.63', 'ladr-9.53'],
      see: ['ladr-5.29'],
      tags: ['characteristic polynomial'],
      credit: 'Cayley, 1858; Hamilton (for quaternions), 1853; Frobenius, 1878 (general proof)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cayley%E2%80%93Hamilton_theorem' },
      viz(v) {
        const M = v.M;
        const PRE = { rot: [[0.8, -1.3], [1.1, 0.6]], spiral: [[1.2, -0.9], [1.6, 0.2]], real: [[1.4, 0.6], [0.5, -0.7]], shear: [[1, 1], [0, 1]] };
        const L = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, height: 340, minWidth: 280, title: 'in $\\mathbf R^2$: $T^2v - (\\operatorname{tr}T)Tv + (\\det T)v$' });
        const Rt = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 340, minWidth: 280, title: 'in $\\mathbf C$: $\\zeta\\lambda^2 - (\\operatorname{tr}T)\\zeta\\lambda + (\\det T)\\zeta$' });
        const C = colHandles(L, PRE.rot);
        const vh = L.handle(1.0, 0.6, { color: 'gold', label: 'v' });
        v.select('', [{ value: 'rot', label: 'no real eigenvalue' }, { value: 'spiral', label: 'another one' }, { value: 'real', label: 'two real eigenvalues' }, { value: 'shear', label: 'shear (repeated)' }], 'rot', { onChange: (k) => C.set(PRE[k]) });
        const own = v.toggle('use my own $p(z) = z^2 + c_1z + c_0$ (break)', false);
        const c1S = v.slider('$c_1$', -3, 3, -1, { step: 0.05 }), c0S = v.slider('$c_0$', -3, 3, 2, { step: 0.05 });
        let view = '', st = null;
        v.render(() => {
          const T = C.A, t = T[0][0] + T[1][1], d = det2(T), p = [vh.x, vh.y];
          const c1 = own.value ? c1S.value : -t, c0 = own.value ? c0S.value : d;
          c1S.el.style.opacity = c0S.el.style.opacity = own.value ? 1 : 0.45;
          const Tp = mv(T, p), T2p = mv(T, Tp);
          const P1 = T2p, P2 = add(P1, scl(Tp, c1)), P3 = add(P2, scl(p, c0)), tol = 1e-9 * (1 + len(T2p));
          const disc = t * t - 4 * d, cx = disc < -1e-12;
          // real eigen data / complex eigenvector
          let lam = null, x = null, zeta = null;
          if (cx) {
            lam = [t / 2, Math.sqrt(-disc) / 2];
            const [a, b] = T[0], [cc, e] = T[1];
            x = Math.abs(b) > Math.abs(cc) ? [[b, 0], [lam[0] - a, lam[1]]] : [[lam[0] - e, lam[1]], [cc, 0]];
            const nx = Math.hypot(...x.flat()); x = x.map((z) => cscl(z, 1 / nx));
            // v = 2 Re(ζ x): solve 2[Re x, −Im x] (ζr, ζi) = v
            const B = [[2 * x[0][0], -2 * x[0][1]], [2 * x[1][0], -2 * x[1][1]]];
            zeta = M.solve(B, p);
            const Phi = (w) => [2 * (w[0] * x[0][0] - w[1] * x[0][1]), 2 * (w[0] * x[1][0] - w[1] * x[1][1])];
            for (let k = -6; k <= 6; k++) {
              const a1 = Phi([k * 0.5, -6]), a2 = Phi([k * 0.5, 6]), b1 = Phi([-6, k * 0.5]), b2 = Phi([6, k * 0.5]);
              L.line(a1[0], a1[1], a2[0], a2[1], { color: 'teal', width: 0.8, alpha: 0.28 }); L.line(b1[0], b1[1], b2[0], b2[1], { color: 'teal', width: 0.8, alpha: 0.28 });
            }
            const u1 = Phi([1, 0]), u2 = Phi([0, 1]);
            L.arrow(0, 0, u1[0], u1[1], { color: 'teal', width: 1.6, dash: [5, 4], head: 7 }); L.arrow(0, 0, u2[0], u2[1], { color: 'teal', width: 1.6, dash: [5, 4], head: 7 });
            L.tex('2\\operatorname{Re}x', u1[0], u1[1], { color: 'teal', size: 12, dx: 26, dy: 8 });
            L.tex('-2\\operatorname{Im}x', u2[0], u2[1], { color: 'teal', size: 12, dx: 28, dy: -8 });
          } else {
            const zs = Math.abs(disc) < 1e-12 ? [t / 2] : [(t - Math.sqrt(disc)) / 2, (t + Math.sqrt(disc)) / 2];
            for (const z of zs) { const B = [[z - T[0][0], -T[0][1]], [-T[1][0], z - T[1][1]]], e = Math.abs(B[0][0]) + Math.abs(B[0][1]) > 1e-9 ? [-B[0][1], B[0][0]] : [-B[1][1], B[1][0]], l = len(e) || 1; L.line(-5 * e[0] / l, -5 * e[1] / l, 5 * e[0] / l, 5 * e[1] / l, { color: 'green', width: 1.4, dash: [7, 5], alpha: 0.7 }); }
          }
          // the real path
          const c0l = [T[0][0], T[1][0]], c1l = [T[0][1], T[1][1]];
          L.arrow(0, 0, c0l[0], c0l[1], { color: 'accent', width: 1.3, alpha: 0.45, head: 7 }); L.arrow(0, 0, c1l[0], c1l[1], { color: 'orange', width: 1.3, alpha: 0.45, head: 7 });
          L.dots([Tp, T2p], { r: 3, color: 'muted' });
          L.text('Tv', Tp[0], Tp[1], { dx: 8, dy: 10, math: true, color: 'muted', size: 13 });
          L.arrow(0, 0, P1[0], P1[1], { color: 'blue', width: 2.8 });
          L.arrow(P1[0], P1[1], P2[0], P2[1], { color: 'orange', width: 2.8 });
          L.arrow(P2[0], P2[1], P3[0], P3[1], { color: 'purple', width: 2.8 });
          const closed = len(P3) < tol;
          if (!closed) { L.line(0, 0, P3[0], P3[1], { color: 'red', width: 2, dash: [3, 3] }); L.dot(P3[0], P3[1], { r: 5, color: 'red' }); } else L.dot(0, 0, { r: 7, hollow: true, color: 'green', width: 2.6 });
          L.corner(closed ? 'closes: q(T)v = 0' : own.value ? 'p(T)v ≠ 0' : 'gap', 'tl', { color: closed ? 'green' : 'red', weight: 700 });
          // the complex picture
          let pts = [[0, 0]];
          if (cx) {
            const l2 = cmul(lam, lam), Q1 = cmul(zeta, l2), Q2 = cadd(Q1, cscl(cmul(zeta, lam), c1)), Q3 = cadd(Q2, cscl(zeta, c0));
            pts = [Q1, Q2, Q3, zeta, cmul(zeta, lam), lam, [lam[0], -lam[1]]];
            const ext = Math.max(1.5, ...pts.map((z) => Math.max(Math.abs(z[0]), Math.abs(z[1])))), Rv = nice(1.2 * ext, [1.5, 2, 3, 4, 5, 6, 8, 10, 15, 20]), key = String(Rv);
            if (key !== view) { view = key; Rt.setView([-Rv, Rv], [-Rv, Rv]); }
            Rt.arrow(0, 0, Q1[0], Q1[1], { color: 'blue', width: 2.8 });
            Rt.arrow(Q1[0], Q1[1], Q2[0], Q2[1], { color: 'orange', width: 2.8 });
            Rt.arrow(Q2[0], Q2[1], Q3[0], Q3[1], { color: 'purple', width: 2.8 });
            const cl2 = cabs(Q3) < 1e-9 * (1 + cabs(Q1));
            if (!cl2) { Rt.line(0, 0, Q3[0], Q3[1], { color: 'red', width: 2, dash: [3, 3] }); Rt.dot(Q3[0], Q3[1], { r: 5, color: 'red' }); } else Rt.dot(0, 0, { r: 7, hollow: true, color: 'green', width: 2.6 });
            Rt.dot(zeta[0], zeta[1], { r: 5, color: 'gold', label: 'ζ', labelPos: 'ne' });
            Rt.dot(lam[0], lam[1], { r: 8, hollow: true, color: 'accent', width: 2.4, label: 'λ', labelPos: 'ne' });
            Rt.dot(lam[0], -lam[1], { r: 8, hollow: true, color: 'accent', width: 2.4 });
            Rt.tex('\\bar\\lambda', lam[0], -lam[1], { color: 'accent', size: 15, dx: 16, dy: 14 });
            Rt.corner(cl2 ? 'closes: ζ·q(λ) = 0' : `gap ζ·p(λ)`, 'tl', { color: cl2 ? 'green' : 'red', weight: 700 });
          } else {
            const zs = Math.abs(disc) < 1e-12 ? [t / 2, t / 2] : [(t - Math.sqrt(disc)) / 2, (t + Math.sqrt(disc)) / 2];
            const ext = Math.max(1.5, ...zs.map((z) => Math.max(z * z, Math.abs(z)))), Rv = nice(1.2 * ext, [1.5, 2, 3, 4, 5, 6, 8, 10, 15, 20]), key = 'r' + Rv;
            if (key !== view) { view = key; Rt.setView([-Rv, Rv], [-Rv, Rv]); }
            zs.forEach((z, k) => {
              const sg = k ? -1 : 1, y = (q) => sg * (0.32 + 0.14 * q) * Rv, a = z * z, b = a + c1 * z, c = b + c0;
              Rt.arrow(0, y(0), a, y(0), { color: 'blue', width: 2.4 }); Rt.line(a, y(0), a, y(1), { color: 'muted', width: 1, dash: [2, 2] });
              Rt.arrow(a, y(1), b, y(1), { color: 'orange', width: 2.4 }); Rt.line(b, y(1), b, y(2), { color: 'muted', width: 1, dash: [2, 2] });
              Rt.arrow(b, y(2), c, y(2), { color: 'purple', width: 2.4 });
              Rt.line(0, 0, 0, y(2), { color: 'faint', width: 1 });
              Rt.dot(c, y(2), { r: 4.5, color: Math.abs(c) < 1e-9 * (1 + a * a) ? 'green' : 'red' });
              Rt.tex(`\\lambda_${k + 1}^2 ${c1 < 0 ? '-' : '+'} ${tn(Math.abs(c1), 2)}\\lambda_${k + 1} ${c0 < 0 ? '-' : '+'} ${tn(Math.abs(c0), 2)}`, Rt.xr[0], y(2.9), { align: 'left', dx: 8, size: 12.5, color: 'muted' });
              Rt.dot(z, 0, { r: 7, hollow: true, color: 'accent', width: 2.4, label: `λ${sub(k + 1)}`, labelPos: k ? 'se' : 'ne' });
            });
            Rt.corner('real eigenvalues: no complexification needed', 'tl', { color: 'muted', weight: 600 });
          }
          const qT = mm(T, T).map((r, i) => r.map((a, j) => a + c1 * T[i][j] + c0 * (i === j ? 1 : 0)));
          st = { t, d, qT, closed, lam, cx, c1, c0, gap: len(P3) };
        });
        v.legend([['blue', '$T^2v$ / $\\zeta\\lambda^2$'], ['orange', '$c_1Tv$ / $c_1\\zeta\\lambda$'], ['purple', '$c_0v$ / $c_0\\zeta$'], ['teal', 'the map $w \\mapsto 2\\operatorname{Re}(wx)$'], ['red', 'gap: $p(T)v \\ne 0$']]);
        v.readout(() => {
          if (!st) return '';
          const { t, d, qT, lam, cx, c1, c0 } = st;
          const zero = maxAbs(qT) < 1e-9 * (1 + t * t + Math.abs(d));
          const name = own.value ? 'p' : 'q';
          const poly = `${name}(z) = ${polyTeX([c0, c1, 1], 'z', 3)}`;
          const cxs = cx ? ` Over $\\mathbf R$, $T$ has no eigenvalue at all; its complexification has $\\lambda = ${ctn(lam, 3)}$ and $\\bar\\lambda$, and $${name}(\\lambda) = ${ctn(cadd(cadd(cmul(lam, lam), cscl(lam, c1)), [c0, 0]), 3)}$.` : '';
          return `$${poly}$ and, in real arithmetic, $${name}(T) = ${mtex(qT, 3)}$${zero ? ' — the zero matrix.' : '.'}${cxs}${own.value && !zero ? ' Since $p \\ne q$, the path does not close.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.65
    {
      num: '9.65',
      kind: 'Theorem',
      name: 'Characteristic polynomial, trace, and determinant',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $n = \dim V$, over $\mathbf R$ or $\mathbf C$. Then the characteristic polynomial of $T$ has the form
$$z^n - (\operatorname{tr} T)\,z^{n-1} + \cdots + (-1)^n \det T.$$`,
      idea: String.raw`The constant term of a polynomial is its value at $0$, here $\det(0I - T) = \det(-T) = (-1)^n\det T$ (since $\det(\lambda T) = \lambda^n\det T$, 9.42). For the next coefficient, let $A$ be the matrix of $T$ in some basis and expand $\det(zI - A)$ by the permutation formula 9.46. The identity permutation contributes $(z - A_{1,1})\cdots(z - A_{n,n})$, whose $z^{n-1}$ coefficient is $-(A_{1,1} + \cdots + A_{n,n}) = -\operatorname{tr} T$. Any other permutation moves at least two indices, so its product has at most $n - 2$ diagonal factors and no $z^{n-1}$ term. Over $\mathbf C$ this was 8.54; this proof works over $\mathbf R$ too.`,
      caption: String.raw`Left: the matrix $zI - A$. Click the top or bottom half of an entry to change the corresponding entry of $A$ by $\pm 1$. Right: the permutation formula, one row per permutation $\sigma$ in one-line notation, with its sign and the coefficients of $\operatorname{sgn}(\sigma)\prod_k (zI - A)_{\sigma(k), k}$. Click a row to light up the entries it multiplies. The bottom row adds the columns to give the characteristic polynomial. The $z^{n-1}$ column has a single nonzero entry, from the identity, equal to $-\operatorname{tr} A$. The constant column adds up to $q(0) = (-1)^n\det A$. Switch the convention to $\det(A - zI)$ to see that the signs in the theorem belong to the monic convention.`,
      deps: ['ladr-9.63', 'ladr-9.46', 'ladr-8.51'],
      see: ['ladr-8.54'],
      tags: ['characteristic polynomial', 'trace'],
      viz(v) {
        const M = v.M;
        const PRE = { 3: [[2, 1, -1], [-1, 3, 1], [2, 1, 1]], 2: [[3, -1], [2, 1]] };
        let A = clone(PRE[3]), sel = 0, st = null;
        const nS = v.select('$n$', [2, 3], 3, { onChange: (k) => { A = clone(PRE[k]); sel = 0; } });
        const conv = v.select('convention', [{ value: 'zi', label: '$\\det(zI - A)$' }, { value: 'iz', label: '$\\det(A - zI)$' }], 'zi');
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 0.8, minWidth: 240 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1.25, minWidth: 330 });
        const TL = v.table(L, { rows: 3, cols: 3, region: [0.04, 0.3, 0.96, 0.86], maxCell: 74, square: false, cellAspect: 1.15, size: 14 });
        const TR = v.table(R, { rows: 8, cols: 6, region: [0.02, 0.03, 0.98, 0.94], maxCell: 40, square: false, cellAspect: 1.7, colWeights: [1.5, 0.75, 1, 1, 1, 1], size: 13 });
        editable(L, TL, { bump: (i, j, k) => { A[i][j] = M.clamp(A[i][j] + k, -9, 9); } });
        R.onClick((x, y) => { const c = TR.hit(x, y); if (c && c.i >= 1 && c.i <= st.perms.length) sel = c.i - 1; });
        const perms = (n) => { const out = []; const go = (p, rest) => { if (!rest.length) { out.push(p); return; } rest.forEach((r, k) => go([...p, r], rest.filter((_, j) => j !== k))); }; go([], [...Array(n).keys()]); return out; };
        const sign = (p) => { let s = 1; for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) if (p[i] > p[j]) s = -s; return s; };
        const pmul = (a, b) => { const c = Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { c[i + j] += x * y; })); return c; };
        v.render(() => {
          const n = A.length, flip = conv.value === 'iz', P = perms(n);
          // entry (i, j) of zI − A (or A − zI) as a polynomial [constant, z]
          const ent = (i, j) => (flip ? [A[i][j], i === j ? -1 : 0] : [-A[i][j], i === j ? 1 : 0]);
          const rows = P.map((p) => { let c = [sign(p)]; for (let k = 0; k < n; k++) c = pmul(c, ent(p[k], k)); while (c.length < n + 1) c.push(0); return c; });
          const tot = Array(n + 1).fill(0); rows.forEach((c) => c.forEach((x, k) => { tot[k] += x; }));
          const tr = A.reduce((s, r, i) => s + r[i], 0), d = M.det(A);
          sel = Math.min(sel, P.length - 1);
          const pick = P[sel];
          const entTex = (i, j) => { const a = A[i][j]; if (i !== j) return tn(flip ? a : -a, 0); return flip ? `${tn(a, 0)} - z` : a === 0 ? 'z' : `z ${a < 0 ? '+' : '-'} ${tn(Math.abs(a), 0)}`; };
          TL.draw({ rows: n, cols: n, value: (i, j) => `$${entTex(i, j)}$`, fill: (i, j) => (pick[j] === i ? ['gold', 0.45] : i === j ? ['muted', 0.08] : null), highlight: pick.map((i, j) => [i, j, 'gold']) });
          ttl(L, TL, flip ? 'A - zI' : 'zI - A', 'ink', false, 16);
          L.texPx(`\\operatorname{tr} A = ${tn(tr, 0)}, \\quad \\det A = ${tn(d, 3)}`, L.width / 2, L.height - 26, { size: 14, color: 'muted' });
          // the permutation table
          const cols = n + 3, colLab = ['$\\sigma$', 'sign', ...Array.from({ length: n + 1 }, (_, k) => (n - k === 0 ? '$1$' : n - k === 1 ? '$z$' : `$z^{${n - k}}$`))];
          TR.draw({
            rows: P.length + 2, cols, colWeights: [1.5, 0.75, ...Array(n + 1).fill(1)],
            value: (i, j) => {
              if (i === 0) return colLab[j];
              if (i === P.length + 1) return j === 0 ? 'sum' : j === 1 ? '' : pn(tot[n - (j - 2)], 3);
              const p = P[i - 1];
              if (j === 0) return `(${p.map((x) => x + 1).join(', ')})`;
              if (j === 1) return sign(p) > 0 ? '+' : '−';
              const x = rows[i - 1][n - (j - 2)];
              return Math.abs(x) < 1e-12 ? '·' : pn(x, 3);
            },
            fill: (i, j) => {
              if (i === 0) return ['muted', 0.12];
              if (i === P.length + 1) return j === 3 ? ['green', 0.3] : j === n + 2 ? ['purple', 0.25] : j >= 2 ? ['muted', 0.1] : null;
              if (i - 1 === sel) return ['gold', 0.22];
              return j === 3 && Math.abs(rows[i - 1][n - 1]) > 1e-12 ? ['green', 0.14] : null;
            },
            textColor: (i, j) => (i > 0 && i <= P.length && j >= 2 && Math.abs(rows[i - 1][n - (j - 2)]) < 1e-12 ? 'faint' : 'ink'),
            weight: (i) => (i === 0 || i === P.length + 1 ? 700 : 500),
          });
          st = { n, tot, tr, d, flip, perms: P };
        });
        v.legend([['gold', 'the selected permutation', { area: true }], ['green', '$z^{n-1}$ coefficient', { area: true }], ['purple', 'constant term', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { n, tot, tr, d, flip } = st;
          const lead = tot[n], second = tot[n - 1], c0 = tot[0];
          const ok1 = Math.abs(second + tr) < 1e-9, ok0 = Math.abs(c0 - (n % 2 ? -d : d)) < 1e-9 * (1 + Math.abs(d));
          if (flip) return `With $\\det(A - zI)$ the polynomial is $${polyTeX(tot, 'z', 3)}$: leading coefficient $${tn(lead, 0)}$, $z^{${n - 1}}$ coefficient $${tn(second, 3)}$, constant $${tn(c0, 3)} = \\det A$. ${n % 2 ? 'For odd $n$ every sign flips: the formula of the theorem is for the monic $\\det(zI - A)$.' : 'For even $n$ the two conventions agree.'}`;
          return `$q(z) = ${polyTeX(tot, 'z', 3)}$. Only the identity contributes to $z^{${n - 1}}$: $${tn(second, 3)} = -\\operatorname{tr}A$ ${ok1 ? '✓' : '✗'}. The constant term is $q(0) = ${tn(c0, 3)} = (-1)^{${n}}\\det A$ ${ok0 ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.66
    {
      num: '9.66',
      kind: 'Theorem',
      name: "Hadamard's inequality",
      statement: String.raw`Suppose $A$ is an $n$-by-$n$ matrix with columns $v_1, \dots, v_n \in \mathbf F^n$. Then, with the Euclidean norm on $\mathbf F^n$,
$$|\det A| \le \prod_{k=1}^n \|v_k\|.$$
For real $A$: among all parallelepipeds with edges of lengths $\|v_1\|, \dots, \|v_n\|$, the box with orthogonal edges has the largest volume.`,
      idea: String.raw`If $A$ is not invertible, $\det A = 0$ and there is nothing to prove. Otherwise write $A = QR$ with $Q$ unitary and $R$ upper triangular with positive diagonal (7.58). Then $|\det A| = |\det Q|\,|\det R| = |\det R|$ by 9.49 and 9.58, and $|\det R| = R_{1,1} \cdots R_{n,n}$ by 9.48. Each $R_{k,k}$ is at most the length of the column $R_{\cdot,k}$, and $\|R_{\cdot,k}\| = \|QR_{\cdot,k}\| = \|v_k\|$ because $Q$ is an isometry. Geometrically, $R_{k,k}$ is the distance from $v_k$ to $\operatorname{span}(v_1, \dots, v_{k-1})$, a height of the parallelepiped, and a height is never longer than its edge.`,
      caption: String.raw`Drag the columns $v_1, v_2, v_3$ (drag the background to rotate), or pick a preset. The dashed orange arrows are the Gram–Schmidt heights. The height of $v_2$ above the line of $v_1$ and the height of $v_3$ above the plane of $v_1, v_2$ are the numbers $R_{2,2}$ and $R_{3,3}$ of the QR factorization, with $R_{1,1} = \|v_1\|$. Right: each solid bar $R_{k,k}$ sits inside the pale bar $\|v_k\|$. The last two bars compare the volume $|\det A| = R_{1,1}R_{2,2}R_{3,3}$ with $\prod\|v_k\|$. Make the columns orthogonal and the bars fill up: equality. The inequality needs the Euclidean norm. Switch to $\|\cdot\|_\infty$ with the $\pm 1$ preset, where $|\det A| = 4$ beats a product of $1$.`,
      deps: ['ladr-7.58', 'ladr-9.49', 'ladr-9.58', 'ladr-9.48'],
      see: ['ladr-9.60'],
      tags: ['determinants', 'inequalities'],
      credit: 'Hadamard, 1893',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hadamard%27s_inequality' },
      viz(v) {
        const M = v.M;
        const PRE = { gen: [[1.2, 0.6, 0.2], [0.1, 1.0, 0.7], [0.3, -0.2, 0.9]], orth: [[1.2, -0.5, 0], [0.5, 1.2, 0], [0, 0, 0.9]], pm: [[1, 1, 1], [1, -1, 1], [1, 1, -1]], flat: [[1, 0.9, 0.3], [0.2, 0.4, 1.1], [0.3, 0.5, 0.2]] };
        const S = v.stage({ x: [-2, 2], y: [-1.7, 2.3], equal: true, axes: false, height: 340, minWidth: 280, title: 'the parallelepiped of $v_1, v_2, v_3$ and its heights' });
        const B = v.stage({ x: [0, 5], y: [0, 1], height: 340, minWidth: 260, axes: 'box', xticks: [], title: 'heights $R_{k,k}$ inside the lengths $\\|v_k\\|$' });
        const sc = v.scene3(S, { yaw: 0.6, pitch: 0.3, axis: 1.6, lim: 1.7 });
        const CC = ['blue', 'pink', 'teal'];
        let A = clone(PRE.gen);
        const col = (k) => A.map((r) => r[k]);
        const H = [0, 1, 2].map((k) => sc.handle(col(k), { color: CC[k], label: `$v_${k + 1}$`, onDrag: (h) => { h.p.forEach((x, i) => { A[i][k] = x; }); } }));
        v.select('', [{ value: 'gen', label: 'generic' }, { value: 'orth', label: 'orthogonal' }, { value: 'pm', label: '$\\pm 1$ entries' }, { value: 'flat', label: 'nearly flat' }], 'gen', { onChange: (k) => { A = clone(PRE[k]); H.forEach((h, j) => h.set(col(j))); } });
        const nrm = v.select('norm of the columns', [{ value: 2, label: '$\\|\\cdot\\|_2$' }, { value: 1, label: '$\\|\\cdot\\|_1$' }, { value: Infinity, label: '$\\|\\cdot\\|_\\infty$ (break)' }], 2);
        let st = null;
        v.render(() => {
          const vs = [0, 1, 2].map(col), d = M.det(A), p = nrm.value;
          const norm = (x) => (p === 2 ? len(x) : p === 1 ? x.reduce((s, t) => s + Math.abs(t), 0) : Math.max(...x.map(Math.abs)));
          // Gram–Schmidt heights
          const e1 = scl(vs[0], 1 / (len(vs[0]) || 1)), f2 = scl(e1, dot(vs[1], e1)), h2 = subv(vs[1], f2), e2 = scl(h2, 1 / (len(h2) || 1));
          const f3 = add(scl(e1, dot(vs[2], e1)), scl(e2, dot(vs[2], e2))), h3 = subv(vs[2], f3);
          const R = [len(vs[0]), len(h2), len(h3)];
          sc.begin();
          ppiped(sc, vs[0], vs[1], vs[2], { color: 'accent', fillAlpha: 0.1 });
          sc.line([0, 0, 0], scl(vs[0], 1.25), { color: 'blue', width: 1, alpha: 0.4, dash: [3, 3] }, 1);
          sc.poly([[0, 0, 0], vs[0], add(vs[0], vs[1]), vs[1]], { fill: 'blue', fillAlpha: 0.12, edge: false });
          sc.line(vs[1], f2, { color: 'orange', width: 1, dash: [3, 3] }, 1);
          sc.arrow(f2, vs[1], { color: 'orange', width: 2.2, dash: [5, 3] });
          sc.arrow(f3, vs[2], { color: 'orange', width: 2.2, dash: [5, 3] });
          sc.dot(f2, { r: 3, color: 'orange' }); sc.dot(f3, { r: 3, color: 'orange' });
          H.forEach((h, k) => sc.arrow([0, 0, 0], h.p, { color: CC[k], width: 2.8 }));
          sc.flush();
          S.corner(`|det A| = ${pn(Math.abs(d), 4)}`, 'tl', { color: 'accent', weight: 700 });
          // bars
          const L = vs.map(norm), prodL = L[0] * L[1] * L[2], vol = R[0] * R[1] * R[2];
          const top = nice(1.15 * Math.max(...L, ...R, prodL, vol, 1), [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 15]);
          B.setView([0, 5.4], [-0.09 * top, top]);
          B.hline(0, { color: 'muted', width: 1 });
          const bar = (x, h, color, a, w = 0.32) => B.rect(x - w, 0, x + w, h, { fill: color, fillAlpha: a, color, width: 1.2 });
          for (let k = 0; k < 3; k++) {
            bar(k + 0.6, L[k], CC[k], 0.18, 0.36);
            bar(k + 0.6, R[k], R[k] > L[k] + 1e-9 ? 'red' : CC[k], 0.7, 0.2);
            B.tex(`k = ${k + 1}`, k + 0.6, -0.045 * top, { size: 12, color: 'muted' });
          }
          const bad = vol > prodL + 1e-9;
          bar(4.1, prodL, 'gold', 0.2, 0.36); bar(4.1, vol, bad ? 'red' : 'green', 0.7, 0.2);
          B.tex('\\text{volume}', 4.1, -0.045 * top, { size: 12, color: 'muted' });
          const close = Math.abs(B.Y(vol) - B.Y(prodL)) < 18;
          B.text(`∏‖v‖ = ${pn(prodL, 3)}`, 4.1, prodL, { dy: bad && close ? 14 : -10, align: 'center', size: 11.5, color: 'gold', weight: 700 });
          B.text(`|det| = ${pn(vol, 3)}`, 4.1, vol, { dy: !bad && close ? 14 : -10, align: 'center', size: 11.5, color: bad ? 'red' : 'green', weight: 700 });
          B.vline(3.35, { color: 'faint', width: 1 });
          st = { d, R, L, prodL, vol, bad, p, cosines: [dot(vs[0], vs[1]) / (len(vs[0]) * len(vs[1])), dot(vs[0], vs[2]) / (len(vs[0]) * len(vs[2])), dot(vs[1], vs[2]) / (len(vs[1]) * len(vs[2]))] };
        });
        v.legend([['accent', 'the parallelepiped'], ['orange', 'heights (Gram–Schmidt)', { dash: true }], ['gold', '$\\prod\\|v_k\\|$', { area: true }], ['green', '$|\\det A| = \\prod R_{k,k}$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { d, R, L, prodL, vol, bad, p, cosines } = st;
          const nm = p === 2 ? '' : p === 1 ? '_1' : '_\\infty';
          const orth = cosines.every((c) => Math.abs(c) < 1e-3);
          const head = `$|\\det A| = ${tn(Math.abs(d), 4)} = R_{1,1}R_{2,2}R_{3,3} = ${R.map((x) => tn(x, 3)).join(' \\cdot ')}$`;
          if (bad) return `${head} $>$ $\\prod\\|v_k\\|${nm} = ${tn(prodL, 4)}$: **the inequality fails** for this norm — Hadamard's inequality is about Euclidean lengths.`;
          return `${head} $\\le \\prod\\|v_k\\|${nm} = ${L.map((x) => tn(x, 3)).join(' \\cdot ')} = ${tn(prodL, 4)}$ (ratio $${tn(vol / prodL, 4)}$)${orth && p === 2 ? ' — the columns are orthogonal, so **equality**.' : '.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.67
    {
      num: '9.67',
      kind: 'Theorem',
      name: 'Determinant of Vandermonde matrix',
      statement: String.raw`Suppose $n > 1$ and $\beta_1, \dots, \beta_n \in \mathbf F$. Then the Vandermonde matrix, whose row $j$ is $(1, \beta_j, \beta_j^2, \dots, \beta_j^{n-1})$, has determinant
$$\det\begin{pmatrix} 1 & \beta_1 & \cdots & \beta_1^{n-1} \\ \vdots & \vdots & & \vdots \\ 1 & \beta_n & \cdots & \beta_n^{n-1}\end{pmatrix} = \prod_{1 \le j < k \le n} (\beta_k - \beta_j).$$
In particular it is invertible exactly when the $\beta_j$ are distinct.`,
      idea: String.raw`The Vandermonde matrix $A$ is the matrix of the evaluation map $S\colon \mathcal P_{n-1}(\mathbf F) \to \mathbf F^n$, $Sp = (p(\beta_1), \dots, p(\beta_n))$, with respect to the basis $1, z, \dots, z^{n-1}$. Switch to the Newton basis $1, (z - \beta_1), (z - \beta_1)(z - \beta_2), \dots$. The change of basis $T$ (sending $z^k$ to the $k$-th Newton polynomial) has an upper-triangular matrix $B$ with $1$'s on the diagonal, so $\det B = 1$ (9.48). The matrix $C = AB$ of $ST$ (3.81) holds the values of the Newton polynomials at the nodes. It is lower triangular, because the $k$-th Newton polynomial vanishes at $\beta_1, \dots, \beta_k$, and its diagonal entries are $\prod_{j<k}(\beta_k - \beta_j)$. So $\det A = \det A \det B = \det C$, which is the product of that diagonal (9.56(a), 9.48).`,
      caption: String.raw`Drag the nodes $\beta_1, \dots, \beta_n$ along the bottom line; the slider sets $n$. Each arc joins a pair $j < k$. It is teal when $\beta_k - \beta_j > 0$ and red when it is negative, and the number of red arcs fixes the sign of the determinant. Top left: the Newton polynomials $N_0, N_1, \dots$, each vanishing at the earlier nodes. Top right: the matrix $C$ of their values at the nodes. It is lower triangular, and its diagonal products multiply to $\det A$, computed separately by row reduction. Push two nodes together and everything vanishes. To break the theorem, skip a power: the columns $1, \beta, \dots, \beta^{n-2}, \beta^{n}$ give a determinant that is the product of the differences times $\beta_1 + \cdots + \beta_n$.`,
      deps: ['ladr-9.48', 'ladr-3.81', 'ladr-9.49', 'ladr-9.56'],
      tags: ['determinants', 'polynomials'],
      credit: 'Vandermonde, 1772 (attributed)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vandermonde_matrix' },
      viz(v) {
        const M = v.M;
        const CC = ['blue', 'pink', 'teal', 'purple', 'orange', 'green'];
        const P = v.stage({ x: [-2.4, 2.4], y: [-3, 3], height: 300, weight: 1.25, minWidth: 300, title: 'Newton polynomials $N_k(z) = \\prod_{j \\le k}(z - \\beta_j)$' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, minWidth: 260 });
        const Lst = v.stage({ x: [-2.4, 2.4], y: [-0.35, 1.1], height: 170, full: true, axes: false, title: 'the nodes and the pairwise differences $\\beta_k - \\beta_j$, $j < k$' });
        const nS = v.slider('$n$', 2, 6, 4, { int: true, step: 1 });
        const cols = v.select('columns', [{ value: 'v', label: '$1, \\beta, \\dots, \\beta^{n-1}$' }, { value: 'g', label: '$1, \\dots, \\beta^{n-2}, \\beta^{n}$ (break)' }], 'v');
        const init = [-1.6, 0.6, -0.5, 1.7, -1.1, 1.15];
        const B = init.map((x, k) => Lst.handle(x, 0, { color: CC[k], label: `β${sub(k + 1)}`, labelPos: 's', constrain: (x) => [M.clamp(x, -2.3, 2.3), 0] }));
        const TB = v.table(R, { rows: 4, cols: 4, region: [0.04, 0.2, 0.96, 0.88], maxCell: 58, size: 12.5 });
        let st = null;
        v.render(() => {
          const n = nS.value, bs = B.slice(0, n).map((h) => h.x), gen = cols.value === 'g';
          B.forEach((h, k) => { h.visible = k < n; });
          const A = bs.map((b) => Array.from({ length: n }, (_, k) => b ** (gen && k === n - 1 ? n : k)));
          const dA = M.det(A);
          let prod = 1, neg = 0; for (let k = 0; k < n; k++) for (let j = 0; j < k; j++) { prod *= bs[k] - bs[j]; if (bs[k] < bs[j]) neg++; }
          const N = (k, z) => { let s = 1; for (let j = 0; j < k; j++) s *= z - bs[j]; return s; };
          const Cm = bs.map((b) => Array.from({ length: n }, (_, k) => N(k, b))), diagP = Cm.reduce((s, r, i) => s * r[i], 1);
          // Newton polynomials
          const ymax = nice(1.25 * Math.max(1.5, ...Cm.flat().map(Math.abs)), [1.5, 2, 3, 4, 6, 8, 10, 15, 20, 30, 50, 100]);
          P.setView([-2.4, 2.4], [-ymax, ymax]);
          bs.forEach((b) => P.vline(b, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.6 }));
          for (let k = 0; k < n; k++) P.fn((z) => N(k, z), { color: CC[k], width: 2.2 });
          for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) P.dot(bs[j], Cm[j][k], { r: j < k ? 3 : 4, color: CC[k], hollow: j < k, width: 1.6 });
          // the matrix C
          TB.draw({ rows: n, cols: n, value: (i, j) => (j > i ? '0' : pn(Cm[i][j], 2)), textColor: (i, j) => (j > i ? 'faint' : 'ink'), fill: (i, j) => (i === j ? ['green', 0.22] : j < i ? [CC[j], 0.1] : null), size: n > 4 ? 11 : 12.5 });
          ttl(R, TB, 'C = \\big(N_{k}(\\beta_j)\\big)', 'ink', false, 14);
          R.texPx(`\\textstyle\\prod \\text{diagonal} = ${tn(diagP, 3)}`, R.width / 2, R.height - 20, { size: 14, color: 'green' });
          // nodes and arcs
          Lst.hline(0, { color: 'muted', width: 1.4 });
          for (let k = 0; k < n; k++) for (let j = 0; j < k; j++) {
            const a = bs[j], b = bs[k], m = (a + b) / 2, r = Math.abs(b - a) / 2, h = 0.18 + 0.75 * Math.min(1, r / 2.2);
            Lst.curve((t) => [m + r * Math.cos(t), h * Math.sin(t)], 0, Math.PI, { color: b > a ? 'teal' : 'red', width: 1.8, alpha: 0.75, n: 60 });
          }
          Lst.corner(`${neg} red arc${neg === 1 ? '' : 's'} → sign ${neg % 2 ? '−' : '+'}`, 'tr', { color: neg % 2 ? 'red' : 'teal', weight: 700 });
          st = { n, dA, prod, diagP, gen, neg, sum: bs.reduce((s, x) => s + x, 0), minGap: Math.min(...bs.flatMap((x, i) => bs.slice(i + 1).map((y) => Math.abs(x - y)))) };
        });
        v.legend([['teal', '$\\beta_k > \\beta_j$'], ['red', '$\\beta_k < \\beta_j$'], ['green', 'diagonal of $C$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { n, dA, prod, diagP, gen, sum, minGap } = st;
          if (gen) return `Columns $1, \\dots, \\beta^{${n - 2}}, \\beta^{${n}}$: $\\det = ${tn(dA, 4)}$, while $\\prod_{j<k}(\\beta_k - \\beta_j) = ${tn(prod, 4)}$. Their ratio is $${Math.abs(prod) > 1e-9 ? tn(dA / prod, 4) : '—'} = \\beta_1 + \\cdots + \\beta_${n} = ${tn(sum, 4)}$: without consecutive powers the formula changes (it still vanishes on collisions).`;
          return `$\\det A = ${tn(dA, 5)}$ (row reduction), $\\prod_{j<k}(\\beta_k - \\beta_j) = ${tn(prod, 5)}$, and the diagonal of $C$ multiplies to $${tn(diagP, 5)}$.${minGap < 0.02 ? ' Two nodes (nearly) coincide: two equal rows, determinant $0$.' : ''}`;
        });
      },
    },
  ],
};
