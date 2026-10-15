// Linear Algebra Done Right — Chapter 6: Inner Product Spaces
// Part 3 (6.54–6.70): U⊥ = {0} only for U = V, orthogonal projections and their properties, the Riesz
// representation theorem revisited, minimizing the distance to a subspace (best approximation, e.g. of sin x by
// polynomials in the L² sense), and the pseudoinverse as the best approximate solver of Tx = w.
// Parts 1 and 2 are ch06.js and ch06-b.js.

// =====================================================================================================
// Shared helpers
// =====================================================================================================
const VC = ['blue', 'purple', 'teal'];
const ZERO = [0, 0, 0];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const unit3 = (a) => { const l = len3(a); return l > 1e-12 ? mul3(a, 1 / l) : [0, 0, 0]; };
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
const maxAbs = (A) => Math.max(0, ...A.flat().map(Math.abs));
const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
/** Orthonormal basis of span(vs) in R^n (Gram–Schmidt, twice); vectors already in the span are skipped. */
function orth(vs, tol = 1e-7) {
  const B = [];
  for (const x of vs) {
    let w = x.slice();
    for (let pass = 0; pass < 2; pass++) for (const e of B) { const d = w.reduce((s, c, i) => s + c * e[i], 0); w = w.map((c, i) => c - d * e[i]); }
    const l = Math.hypot(...w); if (l > tol * Math.max(1, Math.hypot(...x))) B.push(w.map((c) => c / l));
  }
  return B;
}
const projOnto = (x, B) => B.reduce((s, e) => { const d = x.reduce((t, c, i) => t + c * e[i], 0); return s.map((c, i) => c + d * e[i]); }, x.map(() => 0));
/** Orthonormal basis of the orthogonal complement of span(B) in R^n, B orthonormal. */
const compl = (B, n = 3) => orth([...B, ...Array.from({ length: n }, (_, k) => Array.from({ length: n }, (__, i) => +(i === k)))]).slice(B.length);
function perp(n) {
  const u = unit3(n), e = Math.abs(u[0]) < 0.6 ? [1, 0, 0] : Math.abs(u[1]) < 0.6 ? [0, 1, 0] : [0, 0, 1];
  const a = unit3(cross(u, e)); return [a, cross(u, a)];
}
const snapSpan = (p, B, tol) => { if (!B.length) return p; const q = projOnto(p, B); return len3(sub3(p, q)) < tol ? q : p; };
/** Draw span(B) (B orthonormal, in R³): a dot, a line, a disc, or a faint cube for R³. */
function spanDraw(sc, B, st = {}) {
  const col = st.color || 'green', R = st.r ?? 1.6;
  if (B.length === 0) sc.dot(ZERO, { color: col, r: st.dot ?? 6 });
  else if (B.length === 1) sc.line(mul3(B[0], -R), mul3(B[0], R), { color: col, width: st.width ?? 3.4, alpha: st.alpha ?? 0.75, dash: st.dash }, 16);
  else if (B.length === 2) sc.disc(B[0], B[1], R, { fill: col, color: col, fillAlpha: st.fillAlpha ?? 0.13, grid: st.grid ?? true, width: st.width ?? 1.2, alpha: st.alpha });
  else {
    const c = st.box ?? 1.2;
    const face = (k, sg) => [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([x, y]) => { const q = [0, 0, 0]; q[k] = sg * c; q[(k + 1) % 3] = x * c; q[(k + 2) % 3] = y * c; return q; });
    for (let k = 0; k < 3; k++) for (const sg of [-1, 1]) sc.poly(face(k, sg), { fill: col, color: col, fillAlpha: st.fillAlpha ?? 0.035, alpha: 0.35 });
  }
}
function corner3(sc, at, a, b, s = 0.14, st = {}) {
  const p = add3(at, mul3(a, s)), q = add3(add3(at, mul3(a, s)), mul3(b, s)), r = add3(at, mul3(b, s));
  sc.path([p, q, r], { color: st.color || 'ink', width: st.width ?? 1.3, alpha: st.alpha ?? 0.8 });
}
/** Right-angle marker in a 2D stage at `at` between unit directions a and b (s in data units). */
function corner2(S, at, a, b, s, st = {}) {
  S.path([[at[0] + a[0] * s, at[1] + a[1] * s], [at[0] + (a[0] + b[0]) * s, at[1] + (a[1] + b[1]) * s], [at[0] + b[0] * s, at[1] + b[1] * s]], { color: st.color || 'ink', width: st.width ?? 1.2, alpha: st.alpha ?? 0.8 });
}
function arr(S, p, q, color, label, st = {}) {
  S.arrow(p[0], p[1], q[0], q[1], { color, width: st.width ?? 2.6, head: st.head ?? 10, alpha: st.alpha, dash: st.dash });
  if (!label) return;
  const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1;
  S.tex(label, q[0], q[1], { color, dx: (st.off ?? 15) * dx / l, dy: -(st.off ?? 15) * dy / l, align: 'center', baseline: 'middle', size: st.size });
}
/** Show exactly the stages flagged true and resize the visible ones (call from onChange and once at setup). */
function layout(v, list) {
  for (const [S, on] of list) { S.el.hidden = !on; S.el.style.display = on ? '' : 'none'; }
  for (const [S, on] of list) if (on && typeof S.resize === 'function') S.resize();
  v.invalidate();
}
/** The infinite line {p + t d} clipped to the stage, as two endpoints. */
function lineThrough(S, p, d, color, st = {}) {
  const L = 40, l = Math.hypot(d[0], d[1]) || 1, e = [d[0] / l, d[1] / l];
  S.line(p[0] - L * e[0], p[1] - L * e[1], p[0] + L * e[0], p[1] + L * e[1], { color, ...st });
}
// ---- polynomials and quadrature
const pev = (c, x) => { let s = 0; for (let i = c.length - 1; i >= 0; i--) s = s * x + c[i]; return s; };
function polyTeX(c, d = 3, X = 'x') {
  let s = '';
  for (let i = c.length - 1; i >= 0; i--) {
    const a = c[i]; if (Math.abs(a) < 0.5 * 10 ** -d) continue;
    const m = Math.abs(a), num = i > 0 && Math.abs(m - 1) < 0.5 * 10 ** -d ? '' : tn(m, d);
    s += (s ? (a < 0 ? ' - ' : ' + ') : a < 0 ? '-' : '') + num + (i === 0 ? '' : i === 1 ? X : `${X}^{${i}}`);
  }
  return s || '0';
}
function glRule(N) {
  const x = [], w = [];
  for (let i = 1; i <= N; i++) {
    let z = Math.cos((Math.PI * (i - 0.25)) / (N + 0.5)), dp = 1;
    for (let it = 0; it < 100; it++) {
      let p0 = 1, p1 = z;
      for (let k = 2; k <= N; k++) { const p2 = ((2 * k - 1) * z * p1 - (k - 1) * p0) / k; p0 = p1; p1 = p2; }
      dp = (N * (z * p1 - p0)) / (z * z - 1);
      const dz = p1 / dp; z -= dz; if (Math.abs(dz) < 1e-15) break;
    }
    x.push(z); w.push(2 / ((1 - z * z) * dp * dp));
  }
  return { x, w };
}
const GL = glRule(32);
/** ∫_a^b f by 32-point Gauss–Legendre (split at the points in `cuts`, e.g. a kink). */
function gint(f, a, b, cuts = []) {
  const pts = [a, ...cuts.filter((c) => c > a && c < b), b];
  let s = 0;
  for (let k = 0; k + 1 < pts.length; k++) {
    const h = (pts[k + 1] - pts[k]) / 2, m = (pts[k + 1] + pts[k]) / 2;
    for (let i = 0; i < GL.x.length; i++) s += GL.w[i] * f(m + h * GL.x[i]) * h;
  }
  return s;
}
/** Orthonormal polynomials e_0..e_n on [−L, L] for ⟨f, g⟩ = ∫ fg (Gram–Schmidt on exact moments), ascending coefficients. */
function legendreON(n, L = 1) {
  const m = []; for (let k = 0; k <= 2 * n; k++) m.push(k % 2 ? 0 : (2 * L ** (k + 1)) / (k + 1));
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
/** Coefficients (ascending) of the interpolating polynomial through (xs, ys) (scaled Vandermonde for stability). */
function interpCoef(M, xs, ys, L = 1) {
  const V = xs.map((x) => xs.map((_, j) => (x / L) ** j));
  const c = M.solve(V, ys) || ys.map(() => 0);
  return c.map((a, j) => a / L ** j);
}

export default {
  collection: 'ladr',
  chapter: 6,
  items: [
  ],
};
