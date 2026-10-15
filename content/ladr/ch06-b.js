// Linear Algebra Done Right — Chapter 6: Inner Product Spaces
// Part 2 (6.35–6.52): orthonormal bases exist and every orthonormal list extends to one, upper-triangular matrices in
// orthonormal bases and Schur's theorem, the Riesz representation theorem, and orthogonal complements — their basic
// properties, V = U ⊕ U⊥, dim U⊥ = dim V − dim U and (U⊥)⊥ = U. Part 1 is ch06.js, part 3 is ch06-c.js.

// =====================================================================================================
// Shared helpers
// =====================================================================================================
const VC = ['blue', 'purple', 'teal'];
const PC = ['blue', 'orange', 'purple', 'teal', 'pink', 'gold'];
const ZERO = [0, 0, 0];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const unit3 = (a) => { const l = len3(a); return l > 1e-12 ? mul3(a, 1 / l) : [0, 0, 0]; };
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
const mv = (A, x) => A.map((r) => r.reduce((s, a, j) => s + a * x[j], 0));
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** The same for canvas text (real minus sign). */
const pn = (x, d = 2) => tn(x, d).replace('-', '−');
const vt = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\,')})`;
/** A tiny number in TeX: 0 or a×10^k. */
function zs(x) {
  const a = Math.abs(x); if (a < 1e-15) return '0';
  if (a >= 1e-3) return tn(x, 4);
  const k = Math.floor(Math.log10(a)), m = x / 10 ** k;
  return `${m.toFixed(1)}\\times10^{${k}}`;
}
const mtex = (A, d = 2) => `\\begin{bmatrix}${A.map((r) => r.map((x) => tn(x, d)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
/** Orthonormal basis of span(vs) in R³ (Gram–Schmidt, twice); vectors already in the span are skipped. */
function orth(vs, tol = 1e-7) {
  const B = [];
  for (const x of vs) {
    let w = x.slice();
    for (let pass = 0; pass < 2; pass++) for (const e of B) w = sub3(w, mul3(e, dot3(w, e)));
    const l = len3(w); if (l > tol * Math.max(1, len3(x))) B.push(mul3(w, 1 / l));
  }
  return B;
}
const projOnto = (x, B) => B.reduce((s, e) => add3(s, mul3(e, dot3(x, e))), [0, 0, 0]);
/** Orthonormal basis of the orthogonal complement of span(B), B orthonormal. */
const compl = (B) => orth([...B, [1, 0, 0], [0, 1, 0], [0, 0, 1]]).slice(B.length);
/** An orthonormal pair spanning the plane perpendicular to n. */
function perp(n) {
  const u = unit3(n), e = Math.abs(u[0]) < 0.6 ? [1, 0, 0] : Math.abs(u[1]) < 0.6 ? [0, 1, 0] : [0, 0, 1];
  const a = unit3(cross(u, e)); return [a, cross(u, a)];
}
/** Snap p into span(B) (B orthonormal) when it is within tol of it. */
const snapSpan = (p, B, tol) => { if (!B.length) return p; const q = projOnto(p, B); return len3(sub3(p, q)) < tol ? q : p; };
/** Draw span(B) (B orthonormal, in R³) in a scene3: a dot, a line, a disc, or a faint cube for R³. */
function spanDraw(sc, B, st = {}) {
  const col = st.color || 'green', R = st.r ?? 1.6;
  if (B.length === 0) sc.dot(ZERO, { color: col, r: st.dot ?? 6 });
  else if (B.length === 1) sc.line(mul3(B[0], -R), mul3(B[0], R), { color: col, width: st.width ?? 3.4, alpha: st.alpha ?? 0.75, dash: st.dash }, 16);
  else if (B.length === 2) sc.disc(B[0], B[1], R, { fill: col, color: col, fillAlpha: st.fillAlpha ?? 0.13, grid: st.grid ?? true, width: st.width ?? 1.2 });
  else {
    const c = st.box ?? 1.2;
    const face = (k, sg) => [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([x, y]) => { const q = [0, 0, 0]; q[k] = sg * c; q[(k + 1) % 3] = x * c; q[(k + 2) % 3] = y * c; return q; });
    for (let k = 0; k < 3; k++) for (const sg of [-1, 1]) sc.poly(face(k, sg), { fill: col, color: col, fillAlpha: st.fillAlpha ?? 0.035, alpha: 0.35 });
  }
}
/** Small right-angle marker at `at` between the unit directions a and b. */
function corner3(sc, at, a, b, s = 0.14, st = {}) {
  const p = add3(at, mul3(a, s)), q = add3(add3(at, mul3(a, s)), mul3(b, s)), r = add3(at, mul3(b, s));
  sc.path([p, q, r], { color: st.color || 'ink', width: st.width ?? 1.3, alpha: st.alpha ?? 0.8 });
}
/** TeX title above (or below) a table. */
function ttl(s, T, tex, color = 'ink', below = false, size = 15) {
  const g = T.geo; if (!g) return;
  s.texPx(tex, g.X0 + (g.cols * g.cw) / 2, below ? g.Y0 + g.rows * g.ch + 14 : g.Y0 - g.lh - 13, { color, size });
}
// ---- polynomials (ascending coefficient arrays)
const pev = (c, x) => { let s = 0; for (let i = c.length - 1; i >= 0; i--) s = s * x + c[i]; return s; };
/** TeX for the polynomial Σ c_i x^i, highest degree first. */
function polyTeX(c, d = 3, X = 'x') {
  let s = '';
  for (let i = c.length - 1; i >= 0; i--) {
    const a = c[i]; if (Math.abs(a) < 0.5 * 10 ** -d) continue;
    const m = Math.abs(a), num = i > 0 && Math.abs(m - 1) < 0.5 * 10 ** -d ? '' : tn(m, d);
    s += (s ? (a < 0 ? ' - ' : ' + ') : a < 0 ? '-' : '') + num + (i === 0 ? '' : i === 1 ? X : `${X}^{${i}}`);
  }
  return s || '0';
}
const monoTeX = (j) => (j === 0 ? '1' : j === 1 ? 'x' : `x^{${j}}`);
/** Spread labels vertically (pixel gap ≥ gap); items {y (px)} are moved in place, order kept. */
function spread(items, gap = 15) {
  items.sort((a, b) => a.y - b.y);
  for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < gap) items[i].y = items[i - 1].y + gap;
}
// ---- complex 3×3 linear algebra (numbers are [re, im])
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const ccj = (a) => [a[0], -a[1]];
const cab = (a) => Math.hypot(a[0], a[1]);
const csq = (a) => { const r = Math.sqrt(cab(a)), t = Math.atan2(a[1], a[0]) / 2; return [r * Math.cos(t), r * Math.sin(t)]; };
const cmm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => cadd(s, cmul(a, B[k][j])), [0, 0])));
const cH = (A) => A[0].map((_, j) => A.map((r) => ccj(r[j])));
const cnorm = (x) => Math.sqrt(x.reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
const cip = (x, y) => x.reduce((s, z, i) => cadd(s, cmul(z, ccj(y[i]))), [0, 0]);
const cscv = (x, k) => x.map((z) => cmul(z, k));
/** Inverse of a complex n×n matrix via its real 2n×2n form. */
function cinv(M, A) {
  const n = A.length, R = [];
  for (let i = 0; i < 2 * n; i++) R.push(new Array(2 * n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const [x, y] = A[i][j]; R[i][j] = x; R[i][j + n] = -y; R[i + n][j] = y; R[i + n][j + n] = x;
  }
  const Ri = M.inverse(R); if (!Ri) return null;
  return A.map((_, i) => A.map((__, j) => [Ri[i][j], Ri[i + n][j]]));
}
/** Roots of the characteristic polynomial of a complex 3×3 matrix (Durand–Kerner, then Newton). */
function eig3c(A) {
  const tr = cadd(cadd(A[0][0], A[1][1]), A[2][2]);
  const m2 = (i, j) => csub(cmul(A[i][i], A[j][j]), cmul(A[i][j], A[j][i]));
  const c1 = cadd(cadd(m2(0, 1), m2(0, 2)), m2(1, 2));
  const det = cadd(cadd(cmul(A[0][0], csub(cmul(A[1][1], A[2][2]), cmul(A[1][2], A[2][1]))),
    cmul([-1, 0], cmul(A[0][1], csub(cmul(A[1][0], A[2][2]), cmul(A[1][2], A[2][0]))))),
    cmul(A[0][2], csub(cmul(A[1][0], A[2][1]), cmul(A[1][1], A[2][0]))));
  const p = (z) => cadd(cmul(cadd(cmul(csub(z, tr), z), c1), z), [-det[0], -det[1]]);
  const dp = (z) => cadd(csub(cmul([3, 0], cmul(z, z)), cmul([2, 0], cmul(tr, z))), c1);
  let r = [[0.4, 0.9], [-0.65, 0.42], [0.31, -0.77]].map((z) => cmul(z, [1 + cab(tr), 0]));
  for (let it = 0; it < 200; it++) {
    r = r.map((z, i) => { let d = [1, 0]; r.forEach((w, j) => { if (j !== i) d = cmul(d, csub(z, w)); }); return csub(z, cdiv(p(z), d)); });
  }
  return r.map((z) => { for (let k = 0; k < 3; k++) { const q = dp(z); if (cab(q) > 1e-14) z = csub(z, cdiv(p(z), q)); } return z; });
}
/** A unit eigenvector of the complex 3×3 matrix A for the eigenvalue lam (cross product of two rows of A − λI). */
function evec3c(A, lam) {
  const R = A.map((r, i) => r.map((z, j) => (i === j ? csub(z, lam) : z)));
  const cr = (a, b) => [csub(cmul(a[1], b[2]), cmul(a[2], b[1])), csub(cmul(a[2], b[0]), cmul(a[0], b[2])), csub(cmul(a[0], b[1]), cmul(a[1], b[0]))];
  let best = null, bn = -1;
  for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) { const c = cr(R[i], R[j]), n = cnorm(c); if (n > bn) { bn = n; best = c; } }
  if (bn < 1e-12) best = [[1, 0], [0, 0], [0, 0]];
  return cscv(best, [1 / cnorm(best), 0]);
}
/** Orthonormal columns [x, q2, q3] completing the unit vector x ∈ C³ (Gram–Schmidt with the standard basis). */
function unitary3(x) {
  const B = [x];
  for (let k = 0; k < 3 && B.length < 3; k++) {
    let w = [0, 1, 2].map((i) => [+(i === k), 0]);
    for (let pass = 0; pass < 2; pass++) for (const e of B) { const c = cip(w, e); w = w.map((z, i) => csub(z, cmul(c, e[i]))); }
    const n = cnorm(w); if (n > 1e-6) B.push(cscv(w, [1 / n, 0]));
  }
  return fromCols(B);
}

// ---- stages that come and go with a mode select
/** Show exactly the stages flagged true and resize the visible ones (call from onChange and once at setup). */
function layout(v, list) {
  for (const [S, on] of list) { S.el.hidden = !on; S.el.style.display = on ? '' : 'none'; }
  for (const [S, on] of list) if (on && typeof S.resize === 'function') S.resize();
  v.invalidate();
}
// ---- level lines of a functional φ(p) = c·p on R² (alternate strips tinted, values along one edge)
const kfmt = (x) => String(+x.toFixed(3)).replace('-', '−');
function niceStep(x) { const p = 10 ** Math.floor(Math.log10(x)); for (const m of [1, 2, 5, 10]) if (m * p >= x - 1e-12) return m * p; return 10 * p; }
const box2 = (S) => { const B = S.bounds; return [[B.x[0], B.y[0]], [B.x[1], B.y[0]], [B.x[1], B.y[1]], [B.x[0], B.y[1]]]; };
function clipHalf(poly, c, k, s) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const fp = s * (dot2(c, P) - k), fq = s * (dot2(c, Q) - k);
    if (fp >= 0) out.push(P);
    if ((fp >= 0) !== (fq >= 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
function seg2(S, c, k) {
  const box = box2(S), pts = [];
  for (let i = 0; i < 4; i++) {
    const P = box[i], Q = box[(i + 1) % 4], fp = dot2(c, P) - k, fq = dot2(c, Q) - k;
    if (fp === 0) pts.push(P); else if (fp * fq < 0) { const t = fp / (fp - fq); pts.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return pts.length >= 2 ? [pts[0], pts[1]] : null;
}
function levels(S, c, st = {}) {
  const n2 = dot2(c, c); if (n2 < 1e-14) return 0;
  const color = st.color || 'accent', box = box2(S), ph = box.map((p) => dot2(c, p));
  const lo = Math.min(...ph), hi = Math.max(...ph);
  let step = st.step || 1;
  const maxN = st.max || 22; if ((hi - lo) / step > maxN) step *= niceStep((hi - lo) / step / maxN);
  const k0 = Math.ceil(lo / step - 1e-9), k1 = Math.floor(hi / step + 1e-9);
  for (let k = k0 - 1; k <= k1; k++) if (((k % 2) + 2) % 2 === 0) {
    const P = clipHalf(clipHalf(box, c, k * step, 1), c, (k + 1) * step, -1);
    if (P.length > 2) S.poly(P, { fill: color, fillAlpha: st.fillAlpha ?? 0.07, stroke: false });
  }
  const d = [-c[1], c[0]], u = Math.abs(S.X(1) - S.X(0)), w = st.width ?? 1.3;
  let last = null;
  for (let k = k0; k <= k1; k++) {
    const sg = seg2(S, c, k * step); if (!sg) continue;
    S.line(sg[0][0], sg[0][1], sg[1][0], sg[1][1], { color, width: k === 0 ? w * 1.9 : w, alpha: st.alpha ?? 0.8 });
    const [p, q] = dot2(sg[0], d) >= dot2(sg[1], d) ? sg : [sg[1], sg[0]];
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]) * u; if (L < 40) continue;
    const t = 13 / L, x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t;
    if (last && Math.hypot(x - last[0], y - last[1]) * u < 19) continue;
    last = [x, y];
    S.text(kfmt(k * step), x, y, { size: 11, color, align: 'center', baseline: 'middle' });
  }
  return step;
}
/** Arrow p → q in a 2D stage with a TeX label just beyond the tip. */
function arr(S, p, q, color, label, st = {}) {
  S.arrow(p[0], p[1], q[0], q[1], { color, width: st.width ?? 2.6, head: st.head ?? 10, alpha: st.alpha, dash: st.dash });
  if (!label) return;
  const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1;
  S.tex(label, q[0], q[1], { color, dx: (st.off ?? 15) * dx / l, dy: -(st.off ?? 15) * dy / l, align: 'center', baseline: 'middle', size: st.size });
}
// ---- orthonormal polynomials on [−1, 1] (⟨p, q⟩ = ∫ pq) by Gram–Schmidt on the moments
function legendreON(n) {
  const m = []; for (let k = 0; k <= 2 * n; k++) m.push(k % 2 ? 0 : 2 / (k + 1));
  const ip = (p, q) => { let s = 0; for (let i = 0; i < p.length; i++) if (p[i]) for (let j = 0; j < q.length; j++) s += p[i] * m[i + j] * q[j]; return s; };
  const E = [];
  for (let j = 0; j <= n; j++) {
    let f = Array.from({ length: n + 1 }, (_, i) => +(i === j));
    for (let pass = 0; pass < 2; pass++) for (const e of E) { const c = ip(f, e); f = f.map((x, i) => x - c * e[i]); }
    const l = Math.sqrt(ip(f, f)); E.push(f.map((x) => x / l));
  }
  return E;
}
const chebNodes = (n, a = -1, b = 1) => Array.from({ length: n + 1 }, (_, j) => (a + b) / 2 - ((b - a) / 2) * Math.cos(((2 * j + 1) * Math.PI) / (2 * (n + 1))));
/** Coefficients (ascending) of the interpolating polynomial through (xs, ys). */
function interpCoef(M, xs, ys) {
  const V = xs.map((x) => xs.map((_, j) => x ** j));
  return M.solve(V, ys) || ys.map(() => 0);
}

export default {
  collection: 'ladr',
  chapter: 6,
  items: [
    // ------------------------------------------------------------------ 6.35
    {
      num: '6.35',
      kind: 'Theorem',
      name: 'Existence of orthonormal basis',
      statement: String.raw`Every finite-dimensional inner product space has an orthonormal basis.`,
      idea: String.raw`Choose any basis $v_1,\dots,v_n$ of $V$ and feed it to the Gram–Schmidt procedure 6.32. Step $j$ removes from $v_j$ its components along $e_1,\dots,e_{j-1}$ and divides what is left by its norm; that remainder is never $0$, because $v_j\notin\operatorname{span}(v_1,\dots,v_{j-1})$ and an inner product is definite. The output is an orthonormal list of length $n=\dim V$, and an orthonormal list of the right length is a basis (6.28).`,
      caption: String.raw`Step through Gram–Schmidt applied to the basis $1,x,\dots,x^n$ of $\mathcal P_n(\mathbf R)$. Each step turns the next dashed monomial into a coloured orthonormal polynomial $e_j$, and the Gram matrix $\bigl(\langle b_i,b_j\rangle\bigr)$ of the current list gains another row and column of the identity. With $\int_{-1}^1 pq$ the output is the normalized Legendre polynomials ($n=2$ gives $\sqrt{1/2}$, $\sqrt{3/2}\,x$, $\sqrt{45/8}\,(x^2-\tfrac13)$); $\int_0^1 pq$ gives a different orthonormal basis of the same space. The third choice only looks at the four points $t_j$ (grey lines). It is an inner product on $\mathcal P_n(\mathbf R)$ only while $n\le 3$: raise $n$ to $4$ and Gram–Schmidt meets a nonzero polynomial of norm $0$.`,
      deps: ['ladr-6.32', 'ladr-6.28'],
      tags: ['orthonormal', 'bases'],
      viz(v) {
        const NODES = [-0.8, -0.25, 0.3, 0.75];
        const F = v.stage({ x: [-1.1, 1.4], y: [-2.6, 2.6], height: 370, weight: 1.25, title: 'the list being orthonormalized' });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 370, weight: 0.85, minWidth: 250, title: 'Gram matrix $\\langle b_i, b_j\\rangle$ of the current list' });
        const ipS = v.select('$\\langle p,q\\rangle$', [{ value: 'L', label: '$\\int_{-1}^{1} pq$' }, { value: 'S', label: '$\\int_{0}^{1} pq$' }, { value: 'D', label: '$\\sum_{j=1}^{4} p(t_j)q(t_j)$' }], 'L', { onChange: () => St.reset(null, { at: 'end' }) });
        const nS = v.slider('$n$ in $\\mathcal P_n(\\mathbf R)$', 1, 5, 2, { int: true, onChange: () => St.reset(null, { at: 'end' }) });
        const moments = (kind, n) => {
          const m = [];
          for (let k = 0; k <= 2 * n; k++) m.push(kind === 'L' ? (k % 2 ? 0 : 2 / (k + 1)) : kind === 'S' ? 1 / (k + 1) : NODES.reduce((s, t) => s + t ** k, 0));
          return m;
        };
        let gs = null;
        const run = () => {
          const n = nS.value, kind = ipS.value, m = moments(kind, n);
          const ip = (p, q) => { let s = 0; for (let i = 0; i <= n; i++) if (p[i]) for (let j = 0; j <= n; j++) s += p[i] * m[i + j] * q[j]; return s; };
          const mono = (j) => Array.from({ length: n + 1 }, (_, i) => +(i === j));
          const E = [], fr = [{ k: 0, note: String.raw`Start from the basis $1, x, \dots, x^{${n}}$ of $\mathcal P_{${n}}(\mathbf R)$. Its Gram matrix is far from the identity: the monomials are neither orthogonal nor of norm $1$.` }];
          let fail = -1, ff = null;
          for (let j = 0; j <= n; j++) {
            let f = mono(j);
            for (let pass = 0; pass < 2; pass++) for (const e of E) { const c = ip(f, e); f = f.map((x, i) => x - c * e[i]); }
            const nf2 = ip(f, f), J = j + 1;
            const sub = j === 0 ? `f_1 = 1` : `f_{${J}} = ${monoTeX(j)} - \\sum_{i<${J}}\\langle ${monoTeX(j)}, e_i\\rangle e_i = ${polyTeX(f, 3)}`;
            if (nf2 < 1e-10) {
              fail = j; ff = f;
              fr.push({ k: J, fail: true, note: String.raw`$${sub}$ is not the zero polynomial, yet $\|f_{${J}}\|^2 = ${zs(Math.max(0, nf2))}$: it vanishes at all four points $t_j$. This "inner product" is not definite on $\mathcal P_{${n}}(\mathbf R)$, so Gram–Schmidt cannot normalize $f_{${J}}$.` });
              break;
            }
            const e = f.map((x) => x / Math.sqrt(nf2)); E.push(e);
            fr.push({ k: J, note: String.raw`$${sub}$, $\ \|f_{${J}}\| = ${tn(Math.sqrt(nf2), 4)}$, so $e_{${J}} = ${polyTeX(e, 3)}$.` });
          }
          gs = { n, kind, ip, E, fail, ff, mono };
          return fr;
        };
        const St = v.steps({ frames: run, start: 'end', still: 'end', speed: 0.8 });
        const T = v.table(Q, { rows: 6, cols: 6, region: [0.02, 0.02, 0.98, 0.92], maxCell: 58, size: 12 });
        v.legend([['muted', 'monomials still to process', { dash: true }], ['blue', 'orthonormal $e_j$ (one colour each)'], ['red', 'a nonzero vector of norm $0$']]);
        v.render(() => {
          const g = gs, k = St.frame.k ?? g.n + 1, n = g.n, xr = g.kind === 'S' ? [0, 1] : [-1, 1];
          const list = [];
          for (let j = 0; j <= n; j++) {
            if (j < g.E.length && j < k) list.push({ c: g.E[j], col: PC[j], lab: `e_{${j + 1}}`, done: true });
            else if (j === g.fail && k === j + 1) list.push({ c: g.ff, col: 'red', lab: `f_{${j + 1}}`, bad: true });
            else list.push({ c: g.mono(j), col: 'muted', lab: monoTeX(j), raw: true });
          }
          let mx = 1;
          for (const it of list) for (let i = 0; i <= 80; i++) mx = Math.max(mx, Math.abs(pev(it.c, xr[0] + ((xr[1] - xr[0]) * i) / 80)));
          const Y = Math.ceil(mx * 1.12 * 2) / 2, w = xr[1] - xr[0];
          F.setView([xr[0] - 0.06 * w, xr[1] + 0.22 * w], [-Y, Y]);
          if (g.kind === 'D') NODES.forEach((t, i) => { F.vline(t, { color: 'muted', width: 1, alpha: 0.5, dash: [3, 3] }); F.tex(`t_${i + 1}`, t, -Y, { color: 'muted', dx: 9, dy: -16, size: 12 }); });
          else F.vband(xr[0], xr[1], { color: 'accent', alpha: 0.04 });
          const labs = [];
          list.forEach((it) => {
            F.fn((x) => pev(it.c, x), { domain: xr, color: it.col, width: it.raw ? 1.3 : it.bad ? 3.2 : 2.5, dash: it.raw ? [5, 4] : null, alpha: it.raw ? 0.75 : 1, n: 200 });
            if (g.kind === 'D' && !it.raw) NODES.forEach((t) => F.dot(t, pev(it.c, t), { r: 3.2, color: it.col }));
            if (!it.raw) labs.push({ y: F.Y(pev(it.c, xr[1])), lab: it.lab, col: it.col });
          });
          spread(labs, 16);
          labs.forEach((l) => F.tex(l.lab, xr[1], F.invY(l.y), { color: l.col, dx: 18, align: 'left', baseline: 'middle', size: 13 }));
          // Gram matrix of the current list
          const N = n + 1, Gm = list.map((a) => list.map((b) => g.ip(a.c, b.c)));
          T.set({ rows: N, cols: N });
          T.draw({
            value: (i, j) => Gm[i][j], format: (x) => pn(x, 2),
            rowLabels: list.map((it) => `$${it.lab}$`), colLabels: list.map((it) => `$${it.lab}$`),
            rowLabelColor: (i) => list[i].col, colLabelColor: (j) => list[j].col,
            fill: (i, j) => {
              if (list[i].bad || list[j].bad) return ['red', i === j ? 0.32 : 0.12];
              if (list[i].done && list[j].done) return i === j ? ['green', 0.3] : ['green', 0.07];
              return Math.abs(Gm[i][j]) > 1e-9 ? ['orange', 0.08 + 0.18 * Math.min(1, Math.abs(Gm[i][j]))] : null;
            },
            size: N > 4 ? 11 : 13,
          });
        });
        v.readout(() => {
          const g = gs, k = St.frame.k ?? 0, m = Math.min(k, g.E.length);
          if (g.fail >= 0 && k === g.fail + 1) return `With four sample points, $\\sum_j p(t_j)^2 = 0$ for the nonzero polynomial $(x-t_1)(x-t_2)(x-t_3)(x-t_4)$, so the formula is not an inner product on $\\mathcal P_{${g.n}}(\\mathbf R)$ and 6.35 does not apply. Lower $n$ to $3$ or less and it is an inner product again.`;
          let dev = 0;
          for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) dev = Math.max(dev, Math.abs(g.ip(g.E[i], g.E[j]) - (i === j ? 1 : 0)));
          const head = m ? `$e_1,\\dots,e_{${m}}$ are orthonormal: $\\max_{i,j}\\lvert\\langle e_i,e_j\\rangle-\\delta_{ij}\\rvert = ${zs(dev)}$. ` : 'Nothing has been orthonormalized yet. ';
          return head + (m === g.n + 1 ? `That is ${m} orthonormal vectors in $\\mathcal P_{${g.n}}(\\mathbf R)$, whose dimension is ${m} — an orthonormal basis, by 6.28.` : `${g.n + 1 - m} more step${g.n - m ? 's' : ''} to an orthonormal basis.`);
        });
      },
    },
    // ------------------------------------------------------------------ 6.36
    {
      num: '6.36',
      kind: 'Corollary',
      name: 'Every orthonormal list extends to an orthonormal basis',
      statement: String.raw`Suppose $V$ is finite-dimensional. Then every orthonormal list $e_1,\dots,e_m$ in $V$ can be extended to an orthonormal basis $e_1,\dots,e_m,f_1,\dots,f_n$ of $V$.`,
      idea: String.raw`An orthonormal list is linearly independent (6.25), so it extends to a basis $e_1,\dots,e_m,v_1,\dots,v_n$ of $V$ (2.32). Run Gram–Schmidt (6.32) on this longer list. Its first $m$ steps change nothing — each $e_k$ is already orthogonal to the earlier ones and has norm $1$ — and the remaining steps turn $v_1,\dots,v_n$ into $f_1,\dots,f_n$. The result is an orthonormal list of length $\dim V$, hence an orthonormal basis (6.28).`,
      caption: String.raw`The given orthonormal list is blue (drag $e_1$ over the unit sphere, and $e_2$ around the circle perpendicular to $e_1$). The orange vectors $v_j$ complete it to a basis; drag them anywhere. Gram–Schmidt subtracts from each $v_j$ its projection onto the span of the earlier vectors (dashed drop) and normalizes the remainder to the green $f_j$. The blue vectors come out untouched, and the final frame is a unit cube. Drag a $v_j$ into the span of the earlier vectors (it snaps): the list is no longer a basis and that step of Gram–Schmidt produces the zero vector.`,
      deps: ['ladr-6.25', 'ladr-2.32', 'ladr-6.32', 'ladr-6.28'],
      see: ['rca-4.22'],
      tags: ['orthonormal', 'bases'],
      viz(v) {
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 430 });
        const sc = v.scene3(S, { yaw: -0.75, pitch: 0.3, axis: 1.45, lim: 1.4 });
        const mS = v.select('given orthonormal list', [{ value: '1', label: '$e_1$' }, { value: '2', label: '$e_1, e_2$' }], '1');
        const onSphere = (p) => (len3(p) > 1e-6 ? unit3(p) : [1, 0, 0]);
        const E1 = sc.handle(unit3([0.3, 0.2, 0.93]), { color: 'blue', label: 'e₁', snap: onSphere });
        const onCircle = (p) => { const q = sub3(p, mul3(E1.p, dot3(p, E1.p))); return len3(q) > 1e-6 ? unit3(q) : perp(E1.p)[0]; };
        const E2 = sc.handle(onCircle([-0.8, -0.5, 0.3]), { color: 'purple', label: 'e₂', snap: onCircle });
        const given = () => (mS.value === '1' ? [E1.p] : [E1.p, E2.p]);
        const V1 = sc.handle([0.8, 0.5, 0.15], { color: 'orange', label: 'v₁', snap: (p) => snapSpan(p, orth(given()), 0.1) });
        const V2 = sc.handle([-0.8, -0.4, 0.5], { color: 'orange', label: 'v₂', snap: (p) => snapSpan(p, orth([E1.p, V1.p]), 0.1) });
        v.legend([['blue', 'given orthonormal list'], ['orange', 'extension to a basis'], ['green', 'Gram–Schmidt output $f_j$'], ['muted', 'projection removed', { dash: true }]]);
        let st = null;
        v.render(() => {
          const m = +mS.value;
          E2.visible = m === 2; V2.visible = m === 1;
          // keep e₂ orthonormal to e₁ after e₁ moves
          if (m === 2) { const q = onCircle(E2.p); if (len3(sub3(q, E2.p)) > 1e-9) E2.set(q); }
          const list = m === 1 ? [E1.p, V1.p, V2.p] : [E1.p, E2.p, V1.p];
          const out = [], drops = [];
          let fail = -1;
          list.forEach((x, j) => {
            if (fail >= 0) return;
            let w = x.slice();
            const pr = projOnto(x, out);
            w = sub3(x, pr);
            for (const e of out) w = sub3(w, mul3(e, dot3(w, e)));
            const l = len3(w);
            if (l < 1e-6) { fail = j; drops.push({ from: x, to: pr }); return; }
            out.push(mul3(w, 1 / l)); drops.push({ from: x, to: pr });
          });
          sc.begin();
          S.circle(0, 0, 1, { color: 'faint', width: 1, dash: [4, 4] });
          if (fail < 0) {
            const [a, b, c] = out, cube = [[0, 0, 0], a, add3(a, b), b, c, add3(a, c), add3(add3(a, b), c), add3(b, c)];
            [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]].forEach((f) => sc.poly(f.map((i) => cube[i]), { fill: 'green', color: 'green', fillAlpha: 0.035, alpha: 0.28, width: 1 }));
          }
          if (m === 2) sc.disc(E1.p, E2.p, 1.15, { fill: 'blue', color: 'blue', fillAlpha: 0.06, grid: false, alpha: 0.4 });
          else sc.line(mul3(E1.p, -1.6), mul3(E1.p, 1.6), { color: 'blue', width: 1.2, alpha: 0.35, dash: [4, 4] });
          list.forEach((x, j) => {
            if (j < m) return;
            const d = drops[j]; if (!d) return;
            sc.arrow(ZERO, x, { color: 'orange', width: 1.8, head: 8, alpha: 0.85 });
            if (len3(sub3(d.from, d.to)) > 1e-3 && len3(d.to) > 1e-3) sc.line(d.from, d.to, { color: 'muted', width: 1.4, dash: [4, 3] });
            if (len3(d.to) > 1e-3) sc.dot(d.to, { r: 3, color: 'muted' });
          });
          out.forEach((e, j) => { if (j >= m) { sc.arrow(ZERO, e, { color: 'green', width: 3, head: 11 }); sc.tex(`f_{${j - m + 1}}`, e, { color: 'green', dx: 12, dy: -10, size: 14 }); } });
          for (let k = 0; k < m; k++) sc.arrow(ZERO, list[k], { color: k ? 'purple' : 'blue', width: 3.2, head: 11 });
          if (fail >= 0) sc.dot(list[fail], { r: 9, hollow: true, color: 'red', width: 2.4 });
          sc.flush();
          if (fail >= 0) S.corner(`${fail === m ? 'v₁' : 'v₂'} lies in the span of the earlier vectors: not a basis`, 'tl', { color: 'red', weight: 600 });
          const keep = out.slice(0, m).map((e, k) => len3(sub3(e, list[k])));
          let dev = 0; if (fail < 0) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) dev = Math.max(dev, Math.abs(dot3(out[i], out[j]) - (i === j ? 1 : 0)));
          st = { m, fail, keep, dev, out };
        });
        v.readout(() => {
          if (!st) return '';
          const { m, fail, keep, dev } = st;
          const kept = `Gram–Schmidt leaves the given list alone: ${keep.map((d, k) => `$\\|\\mathrm{GS}(e_${k + 1}) - e_${k + 1}\\| = ${zs(d)}$`).join(', ')}. `;
          if (fail >= 0) return kept + `But $${fail === m ? 'v_1' : 'v_2'}$ is a combination of the earlier vectors, so its remainder is $0$ and cannot be normalized. A different choice works: by 2.32 a linearly independent list always extends to a basis.`;
          const fs = m === 1 ? 'f_1, f_2' : 'f_1';
          return kept + `The output $${m === 1 ? 'e_1' : 'e_1, e_2'}, ${fs}$ is orthonormal ($\\max\\lvert\\langle\\cdot,\\cdot\\rangle-\\delta\\rvert = ${zs(dev)}$) and has length $3=\\dim\\mathbf R^3$: an orthonormal basis extending the given list.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.37
    {
      num: '6.37',
      kind: 'Theorem',
      name: 'Upper-triangular matrix in some orthonormal basis',
      statement: String.raw`Suppose $V$ is finite-dimensional and $T\in\mathcal L(V)$. Then $T$ has an upper-triangular matrix with respect to some orthonormal basis of $V$ if and only if the minimal polynomial of $T$ has the form $(z-\lambda_1)\cdots(z-\lambda_m)$ for some $\lambda_1,\dots,\lambda_m\in\mathbf F$.`,
      idea: String.raw`By 5.44 the condition on the minimal polynomial is exactly what is needed for an upper-triangular matrix in *some* basis $v_1,\dots,v_n$, and by 5.39 that means every $\operatorname{span}(v_1,\dots,v_k)$ is invariant under $T$. Gram–Schmidt (6.32) turns $v_1,\dots,v_n$ into an orthonormal basis $e_1,\dots,e_n$ with $\operatorname{span}(e_1,\dots,e_k)=\operatorname{span}(v_1,\dots,v_k)$ for every $k$ — the same nested invariant subspaces — so by 5.39 again the matrix with respect to $e_1,\dots,e_n$ is upper triangular. The converse is immediate from 5.44.`,
      caption: String.raw`$T$ is an operator on $\mathbf R^3$. The blue line $\operatorname{span}(v_1)$ and the purple plane $\operatorname{span}(v_1,v_2)$ are invariant: $v_1$ slides along an eigen-line and $v_2$ moves in an invariant plane ($v_3$ is free). Slide **straighten** from $0$ to $1$: the basis $b_k=(1-t)v_k+t\,e_k$ glides from the skewed $v_k$ to the Gram–Schmidt vectors $e_k$ without leaving the flag, so the matrix of $T$ stays upper triangular the whole way while the Gram matrix becomes $I$. **Next flag** picks another invariant flag. Switch $T$ to a rotation: it has no invariant flag, its minimal polynomial does not split over $\mathbf R$, and an entry below the diagonal refuses to vanish.`,
      deps: ['ladr-5.39', 'ladr-6.32', 'ladr-5.44'],
      tags: ['orthonormal', 'triangular'],
      viz(v) {
        const M = v.M;
        const Sm = fromCols([unit3([1, 0.3, -0.25]), unit3([0.55, 1, 0.35]), unit3([-0.35, 0.5, 1])]);
        const LAM = [1.4, 0.7, -0.6];
        const TA = M.matMul(M.matMul(Sm, [[LAM[0], 0, 0], [0, LAM[1], 0], [0, 0, LAM[2]]]), M.inverse(Sm));
        const ax = unit3([0.3, 0.35, 1]), th = (70 * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
        const K = [[0, -ax[2], ax[1]], [ax[2], 0, -ax[0]], [-ax[1], ax[0], 0]];
        const TR = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (i === j ? c : 0) + s * K[i][j] + (1 - c) * ax[i] * ax[j]));
        const E = M.eig(TA), ev = E.vectors.map(unit3), lam = E.values.map((z) => z.re);
        const flags = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) flags.push([i, j]);
        let fk = 0;
        const S = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, axes: false, height: 410, weight: 1.15 });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.33, axis: 1.45, lim: 1.4 });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 410, weight: 0.85, minWidth: 250 });
        const tS = v.select('$T$', [{ value: 'A', label: 'real eigenvalues' }, { value: 'R', label: 'a rotation of $\\mathbf R^3$' }], 'A', { onChange: () => place() });
        const t = v.slider('straighten $t$', 0, 1, 1, { step: 0.01 });
        const B1 = sc.handle(mul3(ev[0], 1.0), { mode: 'line', d: ev[0], color: 'blue', label: 'v₁' });
        const B2 = sc.handle([0, 0, 0], { mode: 'plane', a: [1, 0, 0], b: [0, 1, 0], color: 'purple', label: 'v₂' });
        const B3 = sc.handle([0.35, -0.75, 0.85], { color: 'teal', label: 'v₃' });
        const nextB = v.button('Next flag', () => { fk = (fk + 1) % flags.length; place(); });
        function place() {
          if (tS.value === 'A') {
            const [i, j] = flags[fk], P = orth([ev[i], ev[j]]);
            B1.d = ev[i]; B1.set(mul3(ev[i], 1.05));
            B2.mode = 'plane'; B2.a = P[0]; B2.b = P[1]; B2.set(add3(mul3(ev[i], 0.55), mul3(ev[j], 1.0)));
          } else {
            B1.d = ax; B1.set(mul3(ax, 1.05));
            B2.mode = 'free'; B2.set([0.95, 0.25, 0.55]);
          }
          if (Math.abs(M.det(fromCols([B1.p, B2.p, B3.p]))) < 0.1) B3.set(mul3(unit3(cross(B1.p, B2.p)), 1.0));
        }
        place();
        const TM = v.table(Q, { rows: 3, cols: 3, region: [0.05, 0.5, 0.95, 0.9], maxCell: 50, size: 14, rowLabels: ['$b_1$', '$b_2$', '$b_3$'], colLabels: ['$Tb_1$', '$Tb_2$', '$Tb_3$'] });
        const TG = v.table(Q, { rows: 3, cols: 3, region: [0.05, 0.03, 0.95, 0.4], maxCell: 40, size: 12, rowLabels: ['$b_1$', '$b_2$', '$b_3$'], colLabels: ['$b_1$', '$b_2$', '$b_3$'] });
        v.legend([['blue', '$\\operatorname{span}(b_1)$'], ['purple', '$\\operatorname{span}(b_1,b_2)$', { area: true }], ['muted', 'skewed $v_k$', { dash: true }], ['red', '$Tb_k$ leaving the flag', { dash: true }]]);
        let st = null;
        v.render(() => {
          const A = tS.value === 'A' ? TA : TR;
          nextB.hidden = tS.value !== 'A';
          const vs = [B1.p, B2.p, B3.p], det = M.det(fromCols(vs)), ok = Math.abs(det) > 0.02;
          const es = ok ? orth(vs) : null;
          if (es) es.forEach((e, k) => { if (dot3(e, vs[k]) < 0) es[k] = mul3(e, -1); });
          const b = ok ? vs.map((x, k) => lerp3(x, es[k], t.value)) : vs;
          const L1 = orth([b[0]]), P12 = orth([b[0], b[1]]);
          const Tb = b.map((x) => mv(A, x));
          sc.begin();
          if (P12.length === 2) sc.disc(P12[0], P12[1], 1.5, { fill: 'purple', color: 'purple', fillAlpha: 0.1, grid: true });
          if (L1.length) sc.line(mul3(L1[0], -1.9), mul3(L1[0], 1.9), { color: 'blue', width: 3.2, alpha: 0.45 }, 16);
          if (t.value > 0.02) vs.forEach((x, k) => sc.arrow(ZERO, x, { color: VC[k], width: 1.4, head: 7, alpha: 0.5, dash: [4, 3] }));
          const off = [0, 0];
          [0, 1].forEach((k) => {
            const tgt = k === 0 ? L1 : P12, f = projOnto(Tb[k], tgt), d = len3(sub3(Tb[k], f));
            off[k] = d;
            sc.arrow(ZERO, Tb[k], { color: d > 1e-6 ? 'red' : VC[k], width: 1.7, head: 8, alpha: 0.8, dash: [6, 3] });
            const pT = sc.P(Tb[k]), pB = sc.P(b[k]);
            if (Math.hypot(pT[0] - pB[0], pT[1] - pB[1]) > 0.28) sc.tex(`Tb_${k + 1}`, Tb[k], { color: d > 1e-6 ? 'red' : VC[k], dx: 15, dy: 10, size: 12 });
            if (d > 1e-6) sc.line(Tb[k], f, { color: 'red', width: 1.6, dash: [2, 3] });
          });
          b.forEach((x, k) => { sc.arrow(ZERO, x, { color: VC[k], width: 3, head: 11 }); sc.tex(`b_${k + 1}`, x, { color: VC[k], dx: -14, dy: -12, size: 14 }); });
          sc.flush();
          let C = null, G = null, low = 0, gdev = 0;
          if (ok) {
            const Bm = fromCols(b); C = M.matMul(M.inverse(Bm), M.matMul(A, Bm));
            G = b.map((x) => b.map((y) => dot3(x, y)));
            low = Math.max(Math.abs(C[1][0]), Math.abs(C[2][0]), Math.abs(C[2][1]));
            for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) gdev = Math.max(gdev, Math.abs(G[i][j] - (i === j ? 1 : 0)));
          }
          TM.draw({
            value: (i, j) => (ok ? C[i][j] : '—'), format: (x) => pn(x, 2),
            fill: (i, j) => (!ok || i <= j ? (i === j && ok ? ['gold', 0.14] : null) : Math.abs(C[i][j]) < 1e-6 ? ['green', 0.28] : ['red', 0.25]),
            textColor: (i, j) => VC[j],
          });
          TG.draw({
            value: (i, j) => (ok ? G[i][j] : '—'), format: (x) => pn(x, 2),
            fill: (i, j) => (!ok ? null : Math.abs(G[i][j] - (i === j ? 1 : 0)) < 5e-3 ? ['green', i === j ? 0.26 : 0.08] : ['orange', 0.1 + 0.2 * Math.min(1, Math.abs(G[i][j] - (i === j ? 1 : 0)))]),
          });
          ttl(Q, TM, '\\mathcal M\\bigl(T,(b_1,b_2,b_3)\\bigr)', 'ink', false, 14);
          ttl(Q, TG, '\\text{Gram matrix } \\langle b_i,b_j\\rangle', 'muted', false, 13);
          if (!ok) S.corner('v₁, v₂, v₃ are not a basis', 'tl', { color: 'red', weight: 700 });
          st = { ok, C, low, gdev, off, mode: tS.value, t: t.value };
        });
        v.readout(() => {
          if (!st || !st.ok) return 'Choose three linearly independent vectors.';
          const { C, low, gdev, mode, t: tt } = st;
          if (mode === 'A') {
            return `Largest entry below the diagonal: $${zs(low)}$ — upper triangular at $t = ${tn(tt)}$, as at every $t$, because each $b_k$ stays in $\\operatorname{span}(v_1,\\dots,v_k)$. Distance of the Gram matrix from $I$: $${zs(gdev)}$${gdev < 1e-9 ? ' — an orthonormal basis.' : '.'} The diagonal $${[0, 1, 2].map((k) => tn(C[k][k])).join(',\\ ')}$ lists eigenvalues; the minimal polynomial $(z-${tn(lam[0])})(z-${tn(lam[1])})(z${lam[2] < 0 ? '+' : '-'}${tn(Math.abs(lam[2]))})$ splits over $\\mathbf R$.`;
          }
          return `The only invariant line of the rotation is its axis and the only invariant plane is perpendicular to the axis, so no plane through the axis is invariant: $Tb_2$ leaves $\\operatorname{span}(b_1,b_2)$ and the entry in row 3, column 2 is $${tn(C[2][1])}\\ne0$. No basis at all — orthonormal or not — makes $T$ upper triangular, matching 6.37: the minimal polynomial $(z-1)(z^2-${tn(2 * Math.cos((70 * Math.PI) / 180), 3)}z+1)$ has a quadratic factor with no real roots.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.38
    {
      num: '6.38',
      kind: 'Theorem',
      name: "Schur's theorem",
      statement: String.raw`Suppose $V$ is a finite-dimensional complex inner product space and $T\in\mathcal L(V)$. Then $T$ has an upper-triangular matrix with respect to some orthonormal basis of $V$.`,
      idea: String.raw`Over $\mathbf C$ every nonconstant polynomial factors completely into linear factors (the fundamental theorem of algebra, second version 4.13), so the minimal polynomial of $T$ is $(z-\lambda_1)\cdots(z-\lambda_m)$ and 6.37 applies. Concretely: pick a unit eigenvector $e_1$, complete it to an orthonormal basis, and repeat inside $e_1^\perp$ with the compression of $T$; the diagonal of the triangular matrix lists the eigenvalues of $T$, with multiplicity.`,
      caption: String.raw`A complex $3\times3$ matrix $A=S\,\mathrm{diag}(\lambda_1,\lambda_2,\lambda_3)\,S^{-1}$: drag its eigenvalues $\lambda_k$ in $\mathbf C$ (**Resample** mixes in a new non-normal $S$). The matrix on the right is $Q^*AQ$ for the chosen orthonormal basis (the columns of $Q$); the gold squares on the left are its diagonal entries. In the standard basis they are scattered; after the first step ($e_1$ an eigenvector) column 1 is cleared; in the Schur basis the matrix is upper triangular and the gold squares sit exactly on the eigenvalues. Switch to $\mathbf F=\mathbf R$: a real matrix with eigenvalues $\lambda_1$ and $a\pm bi$ admits no real triangularizing basis — the red entry cannot be removed — until you drag $\lambda_2$ onto the real axis.`,
      deps: ['ladr-4.13', 'ladr-6.37'],
      credit: 'Issai Schur, 1909',
      tags: ['triangular', 'orthonormal'],
      viz(v) {
        const M = v.M;
        const Z = v.stage({ x: [-2.2, 2.2], y: [-1.7, 1.7], equal: true, height: 360, title: 'eigenvalues and diagonal entries in $\\mathbf C$', xticks: [-2, -1, 1, 2], yticks: [[-1, '−i'], [1, 'i']] });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, minWidth: 300 });
        const fS = v.select('$\\mathbf F$', [{ value: 'C', label: '$\\mathbf C$' }, { value: 'R', label: '$\\mathbf R$' }], 'C', { onChange: (val) => {
          if (val === 'R') { L1.set(L1.x, 0); L2.set(L2.x, Math.abs(L2.y) < 0.15 ? 0.7 : Math.abs(L2.y)); }
        } });
        const bS = v.select('basis', [{ value: 'std', label: 'standard' }, { value: 'e1', label: 'step 1: $e_1$ an eigenvector' }, { value: 'schur', label: 'Schur basis' }], 'schur');
        let seed = 7, Sc = null, Sr = null;
        const mk = () => {
          const r = v.rng(seed);
          for (let tries = 0; tries < 20; tries++) {
            const C = [0, 1, 2].map((i) => [0, 1, 2].map((j) => [r.uniform(-1, 1) + (i === j ? 1.1 : 0), r.uniform(-0.9, 0.9)]));
            const R = [0, 1, 2].map((i) => [0, 1, 2].map((j) => r.uniform(-1, 1) + (i === j ? 1.2 : 0)));
            if (cinv(M, C) && Math.abs(M.det(R)) > 0.4) { Sc = C; Sr = R; return; }
          }
        };
        mk();
        v.button('Resample', () => { seed += 1; mk(); });
        const L1 = Z.handle(-1.2, 0.6, { color: 'blue', label: 'λ₁', constrain: (x, y) => [x, fS.value === 'R' ? 0 : y] });
        const L2 = Z.handle(0.7, 0.85, { color: 'purple', label: 'λ₂', constrain: (x, y) => [x, fS.value === 'R' && Math.abs(y) < 0.1 ? 0 : y] });
        const L3 = Z.handle(1.0, -0.7, { color: 'teal', label: 'λ₃' });
        const TB = v.table(Q, { rows: 3, cols: 3, region: [0.02, 0.06, 0.98, 0.84], square: false, cellAspect: 2.25, maxCell: 52, size: 12.5, rowLabels: ['$e_1$', '$e_2$', '$e_3$'], colLabels: ['$Te_1$', '$Te_2$', '$Te_3$'] });
        v.legend([['blue', 'eigenvalues you drag', { dot: true }], ['gold', 'diagonal entries of $Q^*AQ$', { dot: true }], ['green', 'cleared entries', { area: true }]]);
        const ctx = (a, b) => { const re = Math.abs(a) < 5e-4 ? 0 : a, im = Math.abs(b) < 5e-4 ? 0 : b; if (!im) return pn(re); if (!re) return `${pn(im)}i`; return `${pn(re)}${im < 0 ? '−' : '+'}${pn(Math.abs(im))}i`; };
        let st = null;
        v.render(() => {
          const real = fS.value === 'R';
          L3.visible = !real;
          const l1 = [L1.x, real ? 0 : L1.y], l2 = [L2.x, L2.y], l3 = real ? [L2.x, -L2.y] : [L3.x, L3.y];
          let A;
          if (!real) {
            const D = [[l1, [0, 0], [0, 0]], [[0, 0], l2, [0, 0]], [[0, 0], [0, 0], l3]];
            A = cmm(cmm(Sc, D), cinv(M, Sc));
          } else {
            const Kr = [[l1[0], 0, 0], [0, l2[0], l2[1]], [0, -l2[1], l2[0]]];
            A = M.matMul(M.matMul(Sr, Kr), M.inverse(Sr)).map((r) => r.map((x) => [x, 0]));
          }
          // eigenvalues computed from A itself, matched to the handles
          const roots = eig3c(A), want = [l1, l2, l3], used = new Set();
          const lamC = want.map((w) => { let bi = -1, bd = Infinity; roots.forEach((z, i) => { const d = cab(csub(z, w)); if (!used.has(i) && d < bd) { bd = d; bi = i; } }); used.add(bi); return roots[bi]; });
          const realPair = real && Math.abs(l2[1]) > 1e-9;
          // step 1: a unit eigenvector for λ₁, completed to an orthonormal basis
          const x1 = evec3c(A, lamC[0]); // real when A and λ₁ are real (a cross product of real rows)
          const Q1 = unitary3(x1);
          let Qm = Q1, quasi = false;
          if (!realPair) {
            const B = cmm(cH(Q1), cmm(A, Q1)), b11 = B[1][1], b12 = B[1][2], b21 = B[2][1], b22 = B[2][2];
            const tr = cadd(b11, b22), dt = csub(cmul(b11, b22), cmul(b12, b21)), disc = csq(csub(cmul([0.25, 0], cmul(tr, tr)), dt));
            const mus = [cadd(cmul([0.5, 0], tr), disc), csub(cmul([0.5, 0], tr), disc)];
            const mu = cab(csub(mus[0], lamC[1])) <= cab(csub(mus[1], lamC[1])) ? mus[0] : mus[1];
            let y = [b12, csub(mu, b11)], y2 = [csub(mu, b22), b21];
            if (cnorm(y2) > cnorm(y)) y = y2;
            if (cnorm(y) < 1e-12) y = [[1, 0], [0, 0]];
            y = cscv(y, [1 / cnorm(y), 0]);
            const yp = [cmul([-1, 0], ccj(y[1])), ccj(y[0])];
            const Q2 = [[[1, 0], [0, 0], [0, 0]], [[0, 0], y[0], yp[0]], [[0, 0], y[1], yp[1]]];
            Qm = cmm(Q1, Q2);
          } else quasi = true;
          const I3 = [0, 1, 2].map((i) => [0, 1, 2].map((j) => [+(i === j), 0]));
          const Qs = bS.value === 'std' ? I3 : bS.value === 'e1' ? Q1 : Qm;
          const U = cmm(cH(Qs), cmm(A, Qs));
          const qdev = Math.max(...cmm(cH(Qs), Qs).flat().map((z, k) => cab(csub(z, [k % 4 === 0 ? 1 : 0, 0]))));
          const imQ = Math.max(...Qs.flat().map((z) => Math.abs(z[1])));
          // ℂ-plane
          Z.hline(0, { color: 'muted', width: 1, alpha: 0.5 });
          if (real) { Z.dot(l3[0], l3[1], { r: 6.5, color: 'purple', hollow: true }); Z.tex('\\bar\\lambda_2', l3[0], l3[1], { color: 'purple', dx: 24, dy: 20, size: 13 }); }
          lamC.forEach((z, k) => Z.dot(z[0], z[1], { r: 11, hollow: true, color: real && k === 2 ? 'purple' : VC[k], width: 1.5 }));
          [0, 1, 2].forEach((k) => {
            const z = U[k][k], X = Z.X(z[0]), Y = Z.Y(z[1]), h = 13;
            Z.ctx.save(); Z.ctx.strokeStyle = v.color('gold'); Z.ctx.lineWidth = 2.6; Z.ctx.fillStyle = v.color('gold', 0.18);
            Z.ctx.fillRect(X - h, Y - h, 2 * h, 2 * h); Z.ctx.strokeRect(X - h, Y - h, 2 * h, 2 * h);
            Z.ctx.fillStyle = v.color('gold'); Z.ctx.fillRect(X - 3, Y - 3, 6, 6); Z.ctx.restore();
          });
          const cleared = (i, j) => cab(U[i][j]) < 1e-8;
          TB.draw({
            value: (i, j) => ctx(U[i][j][0], U[i][j][1]),
            fill: (i, j) => (i < j ? null : i === j ? ['gold', 0.16] : cleared(i, j) ? ['green', 0.28] : bS.value === 'schur' ? ['red', 0.26] : ['orange', 0.12]),
            textColor: (i, j) => (i > j && cleared(i, j) ? 'green' : 'ink'),
          });
          ttl(Q, TB, `Q^*AQ${bS.value === 'std' ? ' = A' : ''}`, 'ink', false, 15);
          const lowMax = Math.max(cab(U[1][0]), cab(U[2][0]), cab(U[2][1]));
          st = { U, lamC, qdev, imQ, quasi, real, basis: bS.value, lowMax };
        });
        v.readout(() => {
          if (!st) return '';
          const { U, lamC, qdev, quasi, real, basis, lowMax, imQ } = st;
          const eigs = lamC.map((z) => ctx(z[0], z[1]).replace('−', '-')).join(',\\ ');
          const diag = [0, 1, 2].map((k) => ctx(U[k][k][0], U[k][k][1]).replace('−', '-')).join(',\\ ');
          const orthoTxt = `$\\|Q^*Q-I\\| = ${zs(qdev)}$`;
          if (real && quasi && basis !== 'std') return `The eigenvalues are $\\lambda_1 = ${ctx(lamC[0][0], 0).replace('−', '-')}$ and the nonreal pair $${ctx(lamC[1][0], Math.abs(lamC[1][1])).replace('−', '-').replace('+', '\\pm ')}$. A real unit eigenvector exists only for $\\lambda_1$; in any real orthonormal basis $e_1,e_2,e_3$ with $Te_1=\\lambda_1e_1$, the block on $e_1^\\perp$ has the nonreal eigenvalues $a\\pm bi$, so its lower entry is never $0$ (here $${ctx(U[2][1][0], U[2][1][1]).replace('−', '-')}$). The minimal polynomial has the irreducible factor $z^2-2az+a^2+b^2$: over $\\mathbf R$, 6.37 fails. Over $\\mathbf C$ (switch) the Schur basis exists.`;
          if (basis === 'std') return `In the standard basis the diagonal $${diag}$ has nothing to do with the eigenvalues $${eigs}$ (computed from the characteristic polynomial of $A$).`;
          if (basis === 'e1') return `$e_1$ is a unit eigenvector for $\\lambda_1$, so column 1 becomes $(\\lambda_1,0,0)$; ${orthoTxt}. The remaining $2\\times2$ block still has to be triangularized inside $e_1^\\perp$.`;
          return `Upper triangular: largest entry below the diagonal $${zs(lowMax)}$, ${orthoTxt}${real ? `, and $Q$ is real ($\\max\\lvert\\operatorname{Im}Q\\rvert = ${zs(imQ)}$)` : ''}. The diagonal $${diag}$ is exactly the list of eigenvalues $${eigs}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.42
    {
      num: '6.42',
      kind: 'Theorem',
      name: 'Riesz representation theorem',
      statement: String.raw`Suppose $V$ is finite-dimensional and $\varphi$ is a linear functional on $V$. Then there is a unique vector $v\in V$ such that $$\varphi(u)=\langle u,v\rangle\quad\text{for every }u\in V.$$ If $e_1,\dots,e_n$ is any orthonormal basis of $V$, this vector is $v=\overline{\varphi(e_1)}\,e_1+\dots+\overline{\varphi(e_n)}\,e_n$.`,
      idea: String.raw`Take an orthonormal basis $e_1,\dots,e_n$ (it exists by 6.35) and expand $u=\sum\langle u,e_k\rangle e_k$ (6.30). Linearity of $\varphi$ gives $\varphi(u)=\sum\langle u,e_k\rangle\varphi(e_k)=\bigl\langle u,\sum\overline{\varphi(e_k)}e_k\bigr\rangle$, so that sum works as $v$. If $v_1$ and $v_2$ both work, then $\langle u,v_1-v_2\rangle=0$ for every $u$; taking $u=v_1-v_2$ forces $v_1=v_2$. Uniqueness also shows that the formula gives the same $v$ whichever orthonormal basis is used.`,
      caption: String.raw`**$\mathbf R^2$:** the functional $\varphi$ is drawn by its level lines (drag the dot on the line $\varphi=1$). Turn the orthonormal basis with $\theta$: the pieces $\varphi(e_1)e_1$ and $\varphi(e_2)e_2$ change, but their sum $v$ (green) does not — it always points straight across the level lines, with length $1/(\text{spacing})$. Drag $u$ and compare $\varphi(u)$ with $\langle u,v\rangle$. **$\mathcal P_n(\mathbf R)$:** $\varphi(p)=\int_{-1}^1p(t)\cos(\pi t)\,dt$. The function $\cos\pi t$ is not a polynomial, yet a polynomial $q$ (green) represents $\varphi$. Drag the handles of $p$: the two integrands below differ, but their signed areas agree. Raise $n$ and $q$ creeps toward $\cos\pi t$.`,
      deps: ['ladr-6.35', 'ladr-6.30', 'ladr-3.110'],
      see: ['rca-4.12', 'fa-12.3'],
      credit: 'Frigyes Riesz, 1907',
      tags: ['duality', 'inner products'],
      viz(v) {
        const M = v.M;
        const mode = v.select('$V$', [{ value: 'R2', label: '$\\mathbf R^2$' }, { value: 'P', label: '$\\mathcal P_n(\\mathbf R)$, $\\langle p,q\\rangle=\\int_{-1}^1pq$' }], 'R2', { onChange: (m) => show(m) });
        const S2 = v.stage({ x: [-3.2, 3.2], y: [-2.25, 2.25], equal: true, height: 400 });
        const F = v.stage({ x: [-1.08, 1.08], y: [-1.6, 1.6], height: 270, full: true, title: '$p$ (drag the handles), $\\cos\\pi t$ and the representing polynomial $q$' });
        const G = v.stage({ x: [-1.08, 1.08], y: [-1.6, 1.6], height: 190, full: true, title: 'integrands: $p(t)\\cos\\pi t$ and $p(t)\\,q(t)$ — equal signed areas' });
        const th = v.slider('basis angle $\\theta$', 0, 360, 25, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const nS = v.slider('$n$', 1, 8, 2, { int: true, onChange: () => renode() });
        const Ph = S2.handle(0.55, 0.42, { color: 'accent', label: 'φ = 1', constrain: (x, y) => { const l = Math.hypot(x, y); return l < 0.3 ? (l < 1e-9 ? [0.3, 0] : [(0.3 * x) / l, (0.3 * y) / l]) : [x, y]; } });
        const Uh = S2.handle(1.6, -1.0, { color: 'gold', label: 'u' });
        // P_n mode: p interpolates handles at Chebyshev nodes
        let nodes = chebNodes(2), pc = [0.55, 0.5, -0.9];
        const H = [];
        for (let j = 0; j < 9; j++) H.push(F.handle(0, 0, { color: 'blue', r: 6, constrain: (x, y) => [nodes[j] ?? 0, M.clamp(y, -1.5, 1.5)] }));
        function renode() {
          const n = nS.value, old = pc.slice();
          nodes = chebNodes(n, -0.92, 0.92);
          H.forEach((h, j) => { h.visible = j <= n && mode.value === 'P'; if (j <= n) { h.x = nodes[j]; h.y = M.clamp(pev(old, nodes[j]), -1.5, 1.5); } });
          v.invalidate();
        }
        function show(m) {
          layout(v, [[S2, m === 'R2'], [F, m === 'P'], [G, m === 'P']]);
          th.el.hidden = m !== 'R2'; nS.el.hidden = m !== 'P';
          Ph.visible = Uh.visible = m === 'R2';
          renode();
        }
        show('R2');
        const phiP = (p) => M.integrate((t) => pev(p, t) * Math.cos(Math.PI * t), -1, 1, 600);
        let st = null, cacheN = -1, E = null, q = null;
        v.render(() => {
          if (mode.value === 'R2') {
            v.legend([['accent', 'level lines of $\\varphi$'], ['purple', '$\\varphi(e_1)e_1$', { dash: true }], ['teal', '$\\varphi(e_2)e_2$', { dash: true }], ['green', '$v$'], ['gold', 'test vector $u$', { dot: true }]]);
            const r2 = Ph.x * Ph.x + Ph.y * Ph.y, c = [Ph.x / r2, Ph.y / r2];           // φ(x) = c·x
            const phi = (x) => dot2(c, x);
            levels(S2, c, { color: 'accent' });
            const t = (th.value * Math.PI) / 180, e1 = [Math.cos(t), Math.sin(t)], e2 = [-Math.sin(t), Math.cos(t)];
            const a1 = phi(e1), a2 = phi(e2), p1 = [a1 * e1[0], a1 * e1[1]], p2 = [a2 * e2[0], a2 * e2[1]], vv = [p1[0] + p2[0], p1[1] + p2[1]];
            arr(S2, [0, 0], e1, 'muted', 'e_1', { width: 1.6, head: 7, size: 13 }); arr(S2, [0, 0], e2, 'muted', 'e_2', { width: 1.6, head: 7, size: 13 });
            S2.line(-4 * e1[0], -4 * e1[1], 4 * e1[0], 4 * e1[1], { color: 'muted', width: 0.8, alpha: 0.35 });
            S2.line(-4 * e2[0], -4 * e2[1], 4 * e2[0], 4 * e2[1], { color: 'muted', width: 0.8, alpha: 0.35 });
            arr(S2, [0, 0], p1, 'purple', null, { width: 2, head: 8, dash: [5, 4] });
            arr(S2, p1, vv, 'teal', null, { width: 2, head: 8, dash: [5, 4] });
            arr(S2, [0, 0], vv, 'green', 'v', { width: 3.2, head: 12, size: 15 });
            const u = [Uh.x, Uh.y];
            arr(S2, [0, 0], u, 'gold', null, { width: 2.2 });
            const f = (dot2(u, vv) / dot2(vv, vv)), ft = [vv[0] * f, vv[1] * f];
            S2.line(u[0], u[1], ft[0], ft[1], { color: 'gold', width: 1.2, dash: [3, 3] });
            S2.dot(0, 0, { r: 3, color: 'ink' });
            st = { m: 'R2', a1, a2, vv, phiU: phi(u), ipU: dot2(u, vv), sp: 1 / Math.hypot(...c) };
          } else {
            v.legend([['blue', '$p$'], ['muted', '$\\cos\\pi t$ (not in $\\mathcal P_n$)', { dash: true }], ['green', 'representer $q$'], ['orange', '$p\\cos\\pi t$', { area: true }]]);
            const n = nS.value;
            if (cacheN !== n) { cacheN = n; E = legendreON(n); const w = E.map((e) => phiP(e)); q = new Array(n + 1).fill(0); E.forEach((e, k) => e.forEach((x, i) => { q[i] += w[k] * x; })); }
            const xs = nodes.slice(0, n + 1), ys = H.slice(0, n + 1).map((h) => h.y);
            pc = interpCoef(M, xs, ys);
            F.hline(0, { color: 'muted', width: 0.8, alpha: 0.4 });
            F.fn((t) => Math.cos(Math.PI * t), { domain: [-1, 1], color: 'muted', width: 2, dash: [6, 4] });
            F.fn((t) => pev(q, t), { domain: [-1, 1], color: 'green', width: 3 });
            F.clip(() => F.fn((t) => pev(pc, t), { domain: [-1, 1], color: 'blue', width: 2.4 }));
            F.tex('q', 1, pev(q, 1), { color: 'green', dx: 12, size: 14, align: 'left' });
            G.hline(0, { color: 'muted', width: 0.8, alpha: 0.5 });
            const g1 = (t) => pev(pc, t) * Math.cos(Math.PI * t), g2 = (t) => pev(pc, t) * pev(q, t);
            let mx = 0.5; for (let i = 0; i <= 100; i++) { const t = -1 + i / 50; mx = Math.max(mx, Math.abs(g1(t)), Math.abs(g2(t))); }
            G.setView([-1.08, 1.08], [-mx * 1.15, mx * 1.15]);
            G.fn(g1, { domain: [-1, 1], color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.2 });
            G.fn(g2, { domain: [-1, 1], color: 'green', width: 2, fill: 'green', fillAlpha: 0.16 });
            const lhs = M.integrate(g1, -1, 1, 600), rhs = M.integrate(g2, -1, 1, 600);
            const dist = Math.sqrt(Math.max(0, M.integrate((t) => (Math.cos(Math.PI * t) - pev(q, t)) ** 2, -1, 1, 600)));
            st = { m: 'P', n, q, lhs, rhs, dist };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.m === 'R2') {
            const { a1, a2, vv, phiU, ipU, sp } = st;
            return `$\\varphi(e_1) = ${tn(a1)}$, $\\varphi(e_2) = ${tn(a2)}$, so $v = \\varphi(e_1)e_1+\\varphi(e_2)e_2 = ${vt(vv)}$ — the same vector for every $\\theta$. Test: $\\varphi(u) = ${tn(phiU, 3)}$ and $\\langle u,v\\rangle = ${tn(ipU, 3)}$. The level lines are $${tn(sp)}$ apart and $\\|v\\| = ${tn(Math.hypot(...vv))} = 1/${tn(sp)}$.`;
          }
          const { n, q, lhs, rhs, dist } = st;
          return `$q(x) = ${polyTeX(q, 4)}$${n === 2 ? ` $= \\tfrac{15}{2\\pi^2}(1-3x^2)$` : ''}. For the current $p$: $\\int_{-1}^1 p(t)\\cos(\\pi t)\\,dt = ${tn(lhs, 5)}$ and $\\langle p,q\\rangle = \\int_{-1}^1 pq = ${tn(rhs, 5)}$. Distance from $q$ to $\\cos\\pi t$: $\\|\\cos\\pi t - q\\| = ${tn(dist, 4)}$ — $q$ is the orthogonal projection of $\\cos\\pi t$ onto $\\mathcal P_${n}(\\mathbf R)$, so it improves as $n$ grows.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.46
    {
      num: '6.46',
      kind: 'Definition',
      name: 'Orthogonal complement U⊥',
      statement: String.raw`If $U$ is a subset of $V$, the **orthogonal complement** of $U$ is the set of vectors orthogonal to every vector of $U$: $$U^\perp=\{v\in V:\ \langle u,v\rangle=0\ \text{for every }u\in U\}.$$`,
      idea: String.raw`$U$ need not be a subspace — a single vector, or any list of vectors, has an orthogonal complement. A vector orthogonal to $u_1,\dots,u_k$ is orthogonal to every linear combination of them, so $U^\perp=(\operatorname{span}U)^\perp$: in $\mathbf R^3$ one nonzero vector has a plane as complement, two independent vectors a line, three independent vectors only $\{0\}$.`,
      caption: String.raw`$U$ is the set of blue arrows (one, two or three vectors; drag their tips). The green set is $U^\perp$. Drag the gold test vector $x$: the readout lists its inner products with the vectors of $U$, and $x$ snaps into $U^\perp$ when it gets close. Drag $u_2$ onto the line of $u_1$: the complement grows back to a plane — it only depends on $\operatorname{span}U$ (faint blue).`,
      deps: ['ladr-6.10'],
      see: ['rca-4.9'],
      tags: ['orthogonality'],
      viz(v) {
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 420 });
        const sc = v.scene3(S, { yaw: -0.65, pitch: 0.32, axis: 1.45, lim: 1.4 });
        const kS = v.select('$U$', [{ value: '1', label: '$\\{u_1\\}$' }, { value: '2', label: '$\\{u_1,u_2\\}$' }, { value: '3', label: '$\\{u_1,u_2,u_3\\}$' }], '1');
        const U1 = sc.handle([0.45, 0.35, 0.95], { color: 'blue', label: 'u₁' });
        const U2 = sc.handle([0.9, -0.55, 0.15], { color: 'blue', label: 'u₂', snap: (p) => snapSpan(p, orth([U1.p]), 0.1) });
        const U3 = sc.handle([-0.6, -0.8, 0.4], { color: 'blue', label: 'u₃', snap: (p) => snapSpan(p, orth([U1.p, U2.p]), 0.1) });
        const X = sc.handle([-0.7, 0.9, 0.3], { color: 'gold', label: 'x', snap: (p) => { const k = +kS.value, B = orth([U1.p, U2.p, U3.p].slice(0, k)), W = compl(B); return snapSpan(p, W, 0.12); } });
        v.legend([['blue', 'the set $U$'], ['green', '$U^\\perp$'], ['gold', 'test vector $x$']]);
        let st = null;
        v.render(() => {
          const k = +kS.value, us = [U1.p, U2.p, U3.p].slice(0, k);
          U2.visible = k >= 2; U3.visible = k >= 3;
          const B = orth(us), W = compl(B), x = X.p, ips = us.map((u) => dot3(u, x)), inn = ips.every((a) => Math.abs(a) < 1e-9);
          sc.begin();
          if (B.length < 3) spanDraw(sc, B, { color: 'blue', fillAlpha: 0.05, alpha: 0.25, width: 2, grid: false, r: 1.5 });
          spanDraw(sc, W, { color: 'green', r: 1.35, fillAlpha: 0.14, dot: 7 });
          us.forEach((u) => { sc.arrow(ZERO, u, { color: 'blue', width: 2.8 }); });
          const f = projOnto(x, W);
          if (!inn && W.length) { sc.line(x, f, { color: 'gold', width: 1.4, dash: [4, 3] }); sc.dot(f, { r: 3.5, color: 'green' }); }
          sc.arrow(ZERO, x, { color: inn ? 'green' : 'gold', width: 3, head: 11 });
          if (inn && len3(x) > 0.05) us.forEach((u) => corner3(sc, ZERO, unit3(u), unit3(x), 0.13, { color: 'green' }));
          sc.flush();
          S.corner(`dim span U = ${B.length}, dim U⊥ = ${W.length}`, 'tl', { color: 'muted' });
          st = { ips, inn, dU: B.length, dW: W.length, k };
        });
        v.readout(() => {
          if (!st) return '';
          const { ips, inn, dU, dW, k } = st;
          const list = ips.map((a, i) => `$\\langle u_${i + 1}, x\\rangle = ${tn(a, 3)}$`).join(', ');
          const what = ['only the zero vector', 'a line', 'a plane', 'all of $\\mathbf R^3$'][dW];
          return `${list}: ${inn ? '**$x \\in U^\\perp$**' : '$x\\notin U^\\perp$'}. Here $U$ has ${k} vector${k > 1 ? 's' : ''} spanning a ${dU}-dimensional subspace, and $U^\\perp$ is ${what}${dU < k ? ' — a redundant vector of $U$ adds no new condition' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.48
    {
      num: '6.48',
      kind: 'Theorem',
      name: 'Properties of orthogonal complement',
      statement: String.raw`(a) If $U$ is a subset of $V$, then $U^\perp$ is a subspace of $V$.
(b) $\{0\}^\perp=V$.
(c) $V^\perp=\{0\}$.
(d) If $U$ is a subset of $V$, then $U\cap U^\perp\subseteq\{0\}$.
(e) If $G\subseteq H\subseteq V$, then $H^\perp\subseteq G^\perp$.`,
      idea: String.raw`Each part is one line from the definition and the basic properties of the inner product (6.6). (a) $\langle u,0\rangle=0$, and $\langle u,v+w\rangle=\langle u,v\rangle+\langle u,w\rangle$, $\langle u,\lambda v\rangle=\bar\lambda\langle u,v\rangle$, so the conditions defining $U^\perp$ survive sums and scalar multiples (the subspace test 1.34). (b) Everything is orthogonal to $0$. (c) and (d): a vector orthogonal to itself has $\langle v,v\rangle=0$, so it is $0$. (e) A vector orthogonal to all of $H$ is in particular orthogonal to all of $G$: more conditions, fewer solutions.`,
      caption: String.raw`**(a), (d):** $U=\{u\}$ is a single vector, not a subspace, yet $U^\perp$ (green plane) is one: drag $x$ and $y$ inside it and slide $\lambda$ — the sum $x+y$ and the multiple $\lambda x$ never leave the plane. $u$ itself is not in $U^\perp$, since $\langle u,u\rangle=\|u\|^2>0$, so here $U\cap U^\perp$ is even empty. Drag $u$ to the origin: $U=\{0\}$ and $U^\perp$ becomes all of $\mathbf R^3$, which is (b). **(b), (c), (e):** the sets $\{0\}\subseteq\{0,g_1\}\subseteq\{0,g_1,g_2\}\subseteq\{0,g_1,g_2,g_3\}$ get bigger, and their complements shrink inside one another: $\mathbf R^3\supseteq$ plane $\supseteq$ line $\supseteq\{0\}$.`,
      deps: ['ladr-6.46', 'ladr-1.34', 'ladr-6.6'],
      tags: ['orthogonality'],
      viz(v) {
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 420 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.3, axis: 1.45, lim: 1.4 });
        const mS = v.select('show', [{ value: 'a', label: '(a), (d): $U^\\perp$ of one vector' }, { value: 'e', label: '(b), (c), (e): a growing set' }], 'a');
        const kS = v.select('set', [{ value: '0', label: '$\\{0\\}$' }, { value: '1', label: '$+\\,g_1$' }, { value: '2', label: '$+\\,g_2$' }, { value: '3', label: '$+\\,g_3$' }], '2');
        const lam = v.slider('$\\lambda$', -2, 2, -0.8, { step: 0.05 });
        const Uh = sc.handle([0.35, 0.3, 0.95], { color: 'blue', label: 'u', snap: (p) => (len3(p) < 0.15 ? [0, 0, 0] : p) });
        const inPlane = (p) => { const n = unit3(Uh.p); return len3(n) < 0.5 ? p : sub3(p, mul3(n, dot3(p, n))); };
        const Xh = sc.handle(inPlane([0.9, -0.2, 0]), { color: 'orange', label: 'x', snap: inPlane });
        const Yh = sc.handle(inPlane([-0.3, 0.8, 0]), { color: 'purple', label: 'y', snap: inPlane });
        const Gh = [sc.handle([0.2, 0.25, 1.0], { color: 'blue', label: 'g₁' }), sc.handle([0.95, -0.35, 0.1], { color: 'purple', label: 'g₂' }), sc.handle([-0.3, -0.9, 0.35], { color: 'teal', label: 'g₃' })];
        let st = null;
        v.render(() => {
          const md = mS.value;
          kS.el.hidden = md !== 'e'; lam.el.hidden = md !== 'a';
          Uh.visible = Xh.visible = Yh.visible = md === 'a';
          Gh.forEach((h, i) => { h.visible = md === 'e' && i < +kS.value; });
          sc.begin();
          if (md === 'a') {
            v.legend([['blue', '$U=\\{u\\}$'], ['green', '$U^\\perp$'], ['orange', '$x,\\ \\lambda x$'], ['purple', '$y$'], ['teal', '$x+y$']]);
            const u = Uh.p, zero = len3(u) < 1e-9;
            if (zero) { spanDraw(sc, [[1, 0, 0], [0, 1, 0], [0, 0, 1]], { color: 'green', box: 1.15, fillAlpha: 0.05 }); sc.dot(ZERO, { r: 7, color: 'blue' }); }
            else {
              const [a, b] = perp(u);
              sc.disc(a, b, 1.45, { fill: 'green', color: 'green', fillAlpha: 0.13, grid: true });
              // keep x, y in the plane after u moves
              for (const h of [Xh, Yh]) { const q = inPlane(h.p); if (len3(sub3(q, h.p)) > 1e-9) h.set(q); }
              const x = Xh.p, y = Yh.p, s = add3(x, y), lx = mul3(x, lam.value);
              sc.line(x, s, { color: 'muted', width: 1, dash: [3, 3] }); sc.line(y, s, { color: 'muted', width: 1, dash: [3, 3] });
              sc.arrow(ZERO, lx, { color: 'orange', width: 1.8, head: 8, alpha: 0.75, dash: [5, 3] });
              sc.tex('\\lambda x', lx, { color: 'orange', dx: 12, dy: 10, size: 13 });
              sc.arrow(ZERO, x, { color: 'orange', width: 2.6 }); sc.arrow(ZERO, y, { color: 'purple', width: 2.6 });
              sc.arrow(ZERO, s, { color: 'teal', width: 3 }); sc.tex('x+y', s, { color: 'teal', dx: 16, dy: -10, size: 13 });
              sc.arrow(ZERO, u, { color: 'blue', width: 3.2 });
              corner3(sc, ZERO, unit3(u), unit3(a), 0.15, { color: 'muted' });
            }
            sc.flush();
            st = { md, zero, u, ip: zero ? null : [Xh.p, Yh.p, add3(Xh.p, Yh.p), mul3(Xh.p, lam.value)].map((w) => dot3(u, w)) };
          } else {
            v.legend([['orange', 'complements of the smaller sets', { area: true }], ['green', 'complement of the current set'], ['blue', 'the vectors of the set']]);
            const k = +kS.value, gs = Gh.map((h) => h.p);
            const comps = [0, 1, 2, 3].map((j) => compl(orth(gs.slice(0, j))));
            for (let j = 0; j < k; j++) {
              const W = comps[j];
              if (W.length === 3) spanDraw(sc, W, { color: 'orange', box: 1.15, fillAlpha: 0.02 });
              else spanDraw(sc, W, { color: 'orange', fillAlpha: 0.05, r: 1.45, alpha: 0.35, width: 2, grid: false });
            }
            const W = comps[k];
            spanDraw(sc, W, { color: 'green', r: 1.45, fillAlpha: 0.15, box: 1.15, dot: 8 });
            gs.slice(0, k).forEach((g, i) => sc.arrow(ZERO, g, { color: VC[i], width: 3 }));
            sc.dot(ZERO, { r: 4, color: 'blue' });
            sc.flush();
            S.corner(`dims of the complements: ${comps.slice(0, k + 1).map((c) => c.length).join(' ⊇ ')}`, 'tl', { color: 'muted' });
            st = { md, k, dims: comps.map((c) => c.length) };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.md === 'a') {
            if (st.zero) return `$U=\\{0\\}$: every vector is orthogonal to $0$, so $U^\\perp=\\mathbf R^3$ — property (b). Now $U\\cap U^\\perp=\\{0\\}$.`;
            const [a, b, c, d] = st.ip;
            return `$\\langle u,x\\rangle = ${tn(a, 3)}$, $\\langle u,y\\rangle = ${tn(b, 3)}$, $\\langle u,x+y\\rangle = ${tn(c, 3)}$, $\\langle u,\\lambda x\\rangle = ${tn(d, 3)}$: $U^\\perp$ is closed under addition and scalar multiplication, and contains $0$ — a subspace (a). But $\\langle u,u\\rangle = ${tn(dot3(st.u, st.u), 3)} \\ne 0$, so $u\\notin U^\\perp$ and $U\\cap U^\\perp=\\varnothing\\subseteq\\{0\\}$ (d).`;
          }
          const { k, dims } = st, names = ['\\{0\\}', '\\{0,g_1\\}', '\\{0,g_1,g_2\\}', '\\{0,g_1,g_2,g_3\\}'];
          const what = (d) => ['\\{0\\}', '\\text{a line}', '\\text{a plane}', '\\mathbf R^3'][d];
          let s = `$(${names[k]})^\\perp = ${what(dims[k])}$. `;
          if (k === 0) s += 'Property (b): every vector is orthogonal to $0$.';
          else s += `Each enlargement adds a condition, so the complements shrink: $${dims.slice(0, k + 1).map(what).join('\\supseteq ')}$ — property (e).`;
          if (k === 3 && dims[3] === 0) s += ' The set now spans $\\mathbf R^3$, so its complement is $V^\\perp=\\{0\\}$ — property (c).';
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 6.49
    {
      num: '6.49',
      kind: 'Theorem',
      name: 'Direct sum of a subspace and its complement',
      statement: String.raw`Suppose $U$ is a finite-dimensional subspace of $V$. Then $$V=U\oplus U^\perp:$$ every $v\in V$ can be written in exactly one way as $v=u+w$ with $u\in U$ and $w\in U^\perp$.`,
      idea: String.raw`Let $e_1,\dots,e_m$ be an orthonormal basis of $U$ (6.35) and split $$v=\underbrace{\langle v,e_1\rangle e_1+\dots+\langle v,e_m\rangle e_m}_{u}+\underbrace{v-\langle v,e_1\rangle e_1-\dots-\langle v,e_m\rangle e_m}_{w}.$$ Then $u\in U$, and $\langle w,e_k\rangle=\langle v,e_k\rangle-\langle v,e_k\rangle=0$ for each $k$, so $w\in U^\perp$; hence $V=U+U^\perp$. Since $U\cap U^\perp=\{0\}$ by 6.48(d), the sum is direct (1.46).`,
      caption: String.raw`**$\mathbf R^3$:** $U$ is the blue plane (tilt it with $u_1,u_2$) and $U^\perp$ the green line. Drag $v$: it splits as $u$ in the plane plus $w$ on the line, with a right angle at the foot. Drag the orange $u'$ to try another split $v=u'+(v-u')$: the remainder $v-u'$ (red) is orthogonal to $U$ only when $u'=u$ (it snaps there). **Functions:** in $\mathcal P_5(\mathbf R)$ with $\langle f,g\rangle=\int_{-1}^1fg$, the even polynomials $U$ and the odd polynomials $U^\perp$ are orthogonal complements. Drag the handles of $f$: it splits into its even part and its odd part, and that split is exactly $P_Uf+(f-P_Uf)$.`,
      deps: ['ladr-6.35', 'ladr-6.48', 'ladr-1.46'],
      see: ['rca-4.11'],
      tags: ['orthogonality', 'direct sums'],
      viz(v) {
        const M = v.M;
        const mode = v.select('$V$', [{ value: 'R3', label: '$\\mathbf R^3$' }, { value: 'F', label: '$\\mathcal P_5(\\mathbf R)$: even $\\oplus$ odd' }], 'R3', { onChange: (m) => show(m) });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 420 });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.3, axis: 1.45, lim: 1.4 });
        const F = v.stage({ x: [-1.08, 1.08], y: [-1.7, 1.7], height: 400, full: true, title: '$f = f_{\\text{even}} + f_{\\text{odd}}$ with $\\int_{-1}^1 f_{\\text{even}}\\,f_{\\text{odd}} = 0$' });
        const U1 = sc.handle([1.0, 0.1, 0.15], { color: 'blue', label: 'u₁' });
        const U2 = sc.handle([0.1, 1.0, -0.25], { color: 'blue', label: 'u₂' });
        const Vh = sc.handle([0.35, 0.55, 1.05], { color: 'gold', label: 'v' });
        let base = orth([U1.p, U2.p]);
        const inU = (p) => { const B = orth([U1.p, U2.p]); if (B.length < 2) return p; let q = projOnto(p, B); const f = projOnto(Vh.p, B); return len3(sub3(q, f)) < 0.1 ? f : q; };
        const Up = sc.handle([0.9, -0.5, 0.05], { color: 'orange', label: "u'", snap: inU });
        const XS = [-0.92, -0.6, -0.25, 0.25, 0.6, 0.92];
        const init = (x) => 0.35 + 0.9 * x - 0.6 * x * x - 0.5 * x ** 3;
        const H = XS.map((x) => F.handle(x, init(x), { color: 'gold', r: 6, constrain: (xx, y) => [x, M.clamp(y, -1.6, 1.6)] }));
        function show(m) {
          layout(v, [[S, m === 'R3'], [F, m === 'F']]);
          [U1, U2, Vh, Up].forEach((h) => { h.visible = m === 'R3'; });
          H.forEach((h) => { h.visible = m === 'F'; });
        }
        show('R3');
        const EV = legendreON(5).filter((_, k) => k % 2 === 0);   // orthonormal basis of the even polynomials in P₅
        const ipF = (f, g) => M.integrate((t) => f(t) * g(t), -1, 1, 400);
        let st = null;
        v.render(() => {
          if (mode.value === 'R3') {
            v.legend([['blue', '$U$', { area: true }], ['green', '$U^\\perp$'], ['gold', '$v$'], ['orange', "another try $u'$"], ['red', "$v-u'$", { dash: true }]]);
            const B = orth([U1.p, U2.p]);
            if (B.length === 2) base = B;
            const nrm = unit3(cross(base[0], base[1]));
            // keep u' in the (possibly tilted) plane
            const qn = projOnto(Up.p, base); if (len3(sub3(qn, Up.p)) > 1e-9) Up.set(qn);
            const p = Vh.p, u = projOnto(p, base), w = sub3(p, u), up = Up.p, wr = sub3(p, up);
            sc.begin();
            sc.disc(base[0], base[1], 1.45, { fill: 'blue', color: 'blue', fillAlpha: 0.1, grid: true });
            sc.line(mul3(nrm, -1.7), mul3(nrm, 1.7), { color: 'green', width: 2.6, alpha: 0.8 }, 14);
            [U1, U2].forEach((h) => sc.arrow(ZERO, h.p, { color: 'blue', width: 1.8, head: 8, alpha: 0.7 }));
            const same = len3(sub3(up, u)) < 1e-9;
            if (!same) { sc.line(up, p, { color: 'red', width: 2, dash: [5, 3] }); sc.arrow(ZERO, up, { color: 'orange', width: 2, head: 8 }); }
            sc.arrow(ZERO, u, { color: 'blue', width: 3.2 }); sc.tex('u', u, { color: 'blue', dx: 12, dy: 12, size: 15 });
            sc.arrow(u, p, { color: 'green', width: 3 }); sc.arrow(ZERO, w, { color: 'green', width: 2, head: 8, alpha: 0.6, dash: [5, 3] });
            sc.tex('w', w, { color: 'green', dx: 12, dy: -6, size: 15 });
            sc.line(w, p, { color: 'muted', width: 1, dash: [3, 3] });
            if (len3(w) > 0.05 && len3(u) > 0.05) corner3(sc, u, unit3(mul3(u, -1)), unit3(w), 0.13, { color: 'ink' });
            sc.arrow(ZERO, p, { color: 'gold', width: 2.4, head: 9 });
            sc.flush();
            st = { m: 'R3', u, w, wr: base.map((e) => dot3(wr, e)), same, wu: base.map((e) => dot3(w, e)) };
          } else {
            v.legend([['gold', '$f$'], ['blue', '$f_{\\text{even}}=P_Uf$'], ['green', '$f_{\\text{odd}}=f-P_Uf$'], ['muted', '$f(-x)$', { dash: true }]]);
            const c = interpCoef(M, XS, H.map((h) => h.y)), f = (t) => pev(c, t);
            const fe = (t) => (f(t) + f(-t)) / 2, fo = (t) => (f(t) - f(-t)) / 2;
            // P_U f from the orthonormal basis of U (6.57(i)), independent of the even/odd formula
            const w = EV.map((e) => ipF(f, (t) => pev(e, t)));
            const PU = (t) => EV.reduce((s, e, k) => s + w[k] * pev(e, t), 0);
            F.hline(0, { color: 'muted', width: 0.8, alpha: 0.5 }); F.vline(0, { color: 'muted', width: 0.8, alpha: 0.5 });
            F.clip(() => {
              F.fn((t) => f(-t), { domain: [-1, 1], color: 'muted', width: 1.4, dash: [5, 4] });
              F.fn(fe, { domain: [-1, 1], color: 'blue', width: 2.6 });
              F.fn(fo, { domain: [-1, 1], color: 'green', width: 2.6 });
              F.fn(f, { domain: [-1, 1], color: 'gold', width: 3 });
            });
            let dPU = 0; for (let i = 0; i <= 50; i++) { const t = -1 + i / 25; dPU = Math.max(dPU, Math.abs(PU(t) - fe(t))); }
            st = { m: 'F', ip: ipF(fe, fo), dPU, nf: Math.sqrt(ipF(f, f)), ne: Math.sqrt(ipF(fe, fe)), no: Math.sqrt(ipF(fo, fo)) };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.m === 'R3') {
            const { u, w, wr, same, wu } = st;
            return `$v = u + w$ with $u = ${vt(u)}\\in U$ and $w = ${vt(w)}$, where $\\langle w,e_1\\rangle = ${tn(wu[0], 3)}$, $\\langle w,e_2\\rangle = ${tn(wu[1], 3)}$ for an orthonormal basis $e_1,e_2$ of $U$: $w\\in U^\\perp$. ` +
              (same ? `Your $u'$ is $u$ itself — the only choice that works.` : `The other try leaves $v-u'$ with $\\langle v-u',e_1\\rangle = ${tn(wr[0], 3)}$, $\\langle v-u',e_2\\rangle = ${tn(wr[1], 3)}$: not in $U^\\perp$. Uniqueness: if $u+w=u'+w'$ then $u-u'=w'-w\\in U\\cap U^\\perp=\\{0\\}$.`);
          }
          const { ip, dPU, nf, ne, no } = st;
          return `$\\langle f_{\\text{even}}, f_{\\text{odd}}\\rangle = ${zs(ip)}$, and $P_Uf$ computed from an orthonormal basis of the even polynomials differs from $f_{\\text{even}}$ by at most $${zs(dPU)}$. Pythagoras checks out: $\\|f\\|^2 = ${tn(nf * nf, 4)} = ${tn(ne * ne, 4)} + ${tn(no * no, 4)} = \\|f_{\\text{even}}\\|^2+\\|f_{\\text{odd}}\\|^2$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.51
    {
      num: '6.51',
      kind: 'Corollary',
      name: 'Dimension of orthogonal complement',
      statement: String.raw`Suppose $V$ is finite-dimensional and $U$ is a subspace of $V$. Then $$\dim U^\perp=\dim V-\dim U.$$`,
      idea: String.raw`By 6.49, $V=U\oplus U^\perp$, and the dimension of a direct sum of two subspaces is the sum of their dimensions (3.94, or 2.43 with $U\cap U^\perp=\{0\}$). Concretely, an orthonormal basis $e_1,\dots,e_m$ of $U$ extends to an orthonormal basis $e_1,\dots,e_m,f_1,\dots,f_k$ of $V$ (6.36), and then $f_1,\dots,f_k$ is an orthonormal basis of $U^\perp$, so $m+k=\dim V$.`,
      caption: String.raw`$V=\mathbf R^n$ with the dot product, and $U$ is spanned by the rows on the left (integer entries: click the top half of an entry to add $1$, the bottom half to subtract $1$, or drag it). On the right is an orthonormal basis of $U^\perp$, computed as the solutions of $u_i\cdot x=0$. The bar at the bottom counts dimensions: blue for $\dim U$, green for $\dim U^\perp$ — always $n$ cells in total. Make a row a combination of the others (**dependent row**): $\dim U$ drops below the number of rows, and $U^\perp$ gains a dimension.`,
      deps: ['ladr-6.49', 'ladr-3.94'],
      tags: ['orthogonality', 'dimension'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, full: true });
        const nS = v.slider('$n=\\dim V$', 2, 6, 5, { int: true });
        const kS = v.slider('rows spanning $U$', 0, 6, 2, { int: true });
        const r = v.rng(11);
        const A = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => r.int(-3, 3)));
        A[0] = [1, 2, 0, -1, 1, 0]; A[1] = [0, 1, 1, 2, -1, 1]; A[2] = [2, -1, 1, 0, 1, -2];
        v.button('Dependent row', () => {
          const k = Math.min(kS.value, nS.value); if (k < 2) return;
          const n = nS.value; for (let j = 0; j < n; j++) A[k - 1][j] = M.clamp(A[0][j] + A[1][j], -9, 9);
        });
        v.button('Randomize', () => { for (const row of A) for (let j = 0; j < 6; j++) row[j] = r.int(-3, 3); });
        const TU = v.table(S, { rows: 2, cols: 5, region: [0.0, 0.3, 0.47, 0.9], maxCell: 44, size: 13 });
        const TW = v.table(S, { rows: 3, cols: 5, region: [0.53, 0.3, 1.0, 0.9], maxCell: 44, size: 11 });
        let drag = null;
        S.onDrag((x, y, ph) => {
          if (ph === 'start') { const c = TU.hit(x, y); drag = c && c.i >= 0 && c.j >= 0 ? { ...c, Y: S.Y(y), a: A[c.i][c.j], moved: false } : null; return; }
          if (!drag) return;
          const dy = drag.Y - S.Y(y);
          if (ph === 'move' && (drag.moved || Math.abs(dy) > 5)) { drag.moved = true; A[drag.i][drag.j] = M.clamp(drag.a + Math.round(dy / 14), -9, 9); }
          if (ph === 'end') { if (!drag.moved) { const rc = TU.cellRect(drag.i, drag.j); A[drag.i][drag.j] = M.clamp(drag.a + (y > (rc[1] + rc[3]) / 2 ? 1 : -1), -9, 9); } drag = null; }
          v.invalidate();
        });
        let st = null;
        v.render(() => {
          const n = nS.value, k = Math.min(kS.value, n);
          const rows = A.slice(0, k).map((row) => row.slice(0, n));
          const rk = k ? M.rank(rows, 1e-9) : 0;
          const W = k ? M.nullspace(rows, 1e-9) : M.identity(n);
          const xs = (j) => `$x_{${j + 1}}$`;
          if (k) {
            TU.set({ rows: k, cols: n });
            TU.draw({ value: (i, j) => rows[i][j], rowLabels: (i) => `$u_{${i + 1}}$`, colLabels: xs, fill: () => ['blue', 0.1], textColor: () => 'blue' });
            ttl(S, TU, '\\text{rows spanning } U', 'blue', false, 14);
          } else S.tex('U=\\{0\\}\\ (\\text{no rows})', 0.235, 0.62, { color: 'blue', size: 16 });
          if (W.length) {
            TW.set({ rows: W.length, cols: n });
            TW.draw({ value: (i, j) => W[i][j], format: (x) => pn(x, 2), rowLabels: (i) => `$f_{${i + 1}}$`, colLabels: xs, fill: () => ['green', 0.1], textColor: () => 'green' });
            ttl(S, TW, '\\text{orthonormal basis of } U^\\perp', 'green', false, 14);
          } else S.tex('U^\\perp=\\{0\\}', 0.765, 0.62, { color: 'green', size: 16 });
          // dimension bar
          const x0 = 0.18, x1 = 0.82, y0 = 0.07, y1 = 0.17, cw = (x1 - x0) / n;
          for (let j = 0; j < n; j++) {
            const col = j < rk ? 'blue' : 'green';
            S.rect(x0 + j * cw + 0.004, y0, x0 + (j + 1) * cw - 0.004, y1, { fill: col, fillAlpha: 0.35, color: col, width: 1.5 });
          }
          if (rk) S.tex(`\\dim U = ${rk}`, x0 + (rk * cw) / 2, y1, { color: 'blue', dy: -13, size: 14 });
          if (n - rk) S.tex(`\\dim U^\\perp = ${n - rk}`, x0 + rk * cw + ((n - rk) * cw) / 2, y1, { color: 'green', dy: -13, size: 14 });
          S.tex(`n = ${n}`, x1, (y0 + y1) / 2, { color: 'ink', dx: 30, size: 14 });
          let cr = 0; rows.forEach((u) => W.forEach((f) => { cr = Math.max(cr, Math.abs(f.reduce((s, x, j) => s + x * u[j], 0))); }));
          let od = 0; W.forEach((f, i) => W.forEach((g, j) => { od = Math.max(od, Math.abs(f.reduce((s, x, t) => s + x * g[t], 0) - (i === j ? 1 : 0))); }));
          st = { n, k, rk, dW: W.length, cr, od };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, k, rk, dW, cr, od } = st;
          return `${k} row${k === 1 ? '' : 's'} of rank ${rk}: $\\dim U = ${rk}$${k > rk ? ` (only ${rk} of the ${k} rows are independent)` : ''}. The basis of $U^\\perp$ has $${dW}$ vectors, orthonormal to within $${zs(od)}$ and orthogonal to every row ($\\max\\lvert u_i\\cdot f_j\\rvert = ${zs(cr)}$). So $\\dim U^\\perp = ${dW} = ${n} - ${rk} = \\dim V-\\dim U$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.52
    {
      num: '6.52',
      kind: 'Theorem',
      name: 'Orthogonal complement of the orthogonal complement',
      statement: String.raw`Suppose $U$ is a finite-dimensional subspace of $V$. Then $$U=(U^\perp)^\perp.$$`,
      idea: String.raw`Every $u\in U$ is orthogonal to everything in $U^\perp$, so $U\subseteq(U^\perp)^\perp$. Conversely, take $v\in(U^\perp)^\perp$ and split it as $v=u+w$ with $u\in U$, $w\in U^\perp$ (6.49). Then $w=v-u$ lies in $(U^\perp)^\perp$ (both $v$ and $u$ do) and in $U^\perp$, so $w=0$ by 6.48(d), and $v=u\in U$.`,
      caption: String.raw`Step through: start with $U$ (blue), take its complement $U^\perp$ (green), then the complement of that (purple dashed). For a line or a plane the purple set lands exactly on $U$ — drag $u_1$, $u_2$ to tilt $U$ and repeat. Choose **a set of two vectors**: $U$ is then just two arrows, not a subspace, and $(U^\perp)^\perp$ is the whole plane they span — strictly bigger than $U$. The theorem needs $U$ to be a subspace.`,
      deps: ['ladr-6.49', 'ladr-6.48'],
      tags: ['orthogonality'],
      viz(v) {
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 420 });
        const sc = v.scene3(S, { yaw: -0.68, pitch: 0.3, axis: 1.45, lim: 1.4 });
        const uS = v.select('$U$', [{ value: 'line', label: 'a line' }, { value: 'plane', label: 'a plane' }, { value: 'set', label: 'a set of two vectors' }], 'line', { onChange: () => St.set(St.n - 1) });
        const U1 = sc.handle([0.55, 0.45, 0.9], { color: 'blue', label: 'u₁' });
        const U2 = sc.handle([0.95, -0.5, 0.2], { color: 'blue', label: 'u₂', snap: (p) => snapSpan(p, orth([U1.p]), 0.1) });
        const St = v.steps({
          frames: [
            { k: 0, note: String.raw`Start with $U$.` },
            { k: 1, note: String.raw`$U^\perp$: everything orthogonal to $U$.` },
            { k: 2, note: String.raw`$(U^\perp)^\perp$: everything orthogonal to $U^\perp$.` },
          ], start: 'end', still: 2, speed: 0.7,
        });
        let st = null;
        v.legend([['blue', '$U$'], ['green', '$U^\\perp$'], ['purple', '$(U^\\perp)^\\perp$', { dash: true }]]);
        v.render(() => {
          const md = uS.value, k = St.frame.k ?? 2;
          U2.visible = md !== 'line';
          const gens = md === 'line' ? [U1.p] : [U1.p, U2.p];
          const B = orth(gens), W = compl(B), WW = compl(W);
          sc.begin();
          if (md === 'set') { gens.forEach((g) => { sc.arrow(ZERO, g, { color: 'blue', width: 3.2 }); sc.dot(g, { r: 6, color: 'blue', top: true }); }); }
          else { spanDraw(sc, B, { color: 'blue', r: 1.45, fillAlpha: 0.12, width: 3.6 }); gens.forEach((g) => sc.arrow(ZERO, g, { color: 'blue', width: 2, head: 8, alpha: 0.7 })); }
          if (k >= 1) spanDraw(sc, W, { color: 'green', r: 1.3, fillAlpha: 0.13, width: 3.2 });
          if (k >= 2) {
            if (WW.length === 1) sc.line(mul3(WW[0], -1.75), mul3(WW[0], 1.75), { color: 'purple', width: 2.4, dash: [8, 5] });
            else if (WW.length === 2) {
              const pts = []; for (let i = 0; i <= 72; i++) { const t = (2 * Math.PI * i) / 72; pts.push(add3(mul3(WW[0], 1.55 * Math.cos(t)), mul3(WW[1], 1.55 * Math.sin(t)))); }
              sc.path(pts, { color: 'purple', width: 2.4, dash: [8, 5] });
              sc.disc(WW[0], WW[1], 1.55, { fill: 'purple', color: 'purple', fillAlpha: md === 'set' ? 0.12 : 0.04, grid: false, alpha: 0.2 });
            }
          }
          if (k >= 1 && W.length && B.length) corner3(sc, ZERO, B[0], W[0], 0.16, { color: 'ink' });
          sc.flush();
          // ‖P_U − P_{U⊥⊥}‖ (max entry of the difference of the projection matrices)
          const P = (Bs) => [0, 1, 2].map((i) => [0, 1, 2].map((j) => Bs.reduce((s, e) => s + e[i] * e[j], 0)));
          const PU = P(B), PW = P(WW);
          let d = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) d = Math.max(d, Math.abs(PU[i][j] - PW[i][j]));
          st = { md, k, dU: B.length, dW: W.length, dWW: WW.length, d };
        });
        v.readout(() => {
          if (!st) return '';
          const { md, k, dU, dW, dWW, d } = st;
          const nm = (x) => ['$\\{0\\}$', 'a line', 'a plane', '$\\mathbf R^3$'][x];
          if (k === 0) return `$U$ is ${md === 'set' ? 'a set of two vectors' : nm(dU)}.`;
          if (k === 1) return `$U^\\perp$ is ${nm(dW)} ($\\dim U^\\perp = 3 - ${dU}$).`;
          if (md === 'set') return `$(U^\\perp)^\\perp$ is ${nm(dWW)}: it contains the two vectors of $U$ but also every combination of them, so $U\\subsetneq(U^\\perp)^\\perp=\\operatorname{span}U$. Equality needs $U$ to be a subspace.`;
          return `$(U^\\perp)^\\perp$ is ${nm(dWW)} again, and it is $U$ itself: the orthogonal projections onto $U$ and onto $(U^\\perp)^\\perp$ agree to within $${zs(d)}$ in every matrix entry.`;
        });
      },
    },
  ],
};
