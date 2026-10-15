// Linear Algebra Done Right — Chapter 6: Inner Product Spaces
// Part 1 (6.2–6.32): inner products and norms, orthogonality, the classical inequalities, orthonormal lists and
// bases, and the Gram–Schmidt procedure. Part 2 (ch06-b.js) continues with 6.35–6.70.

// ---------- shared helpers ----------
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
/** x² as TeX, with brackets around a negative x. */
const sqT = (x, d = 2) => (Number(tn(x, d)) < 0 ? `(${tn(x, d)})^2` : `${tn(x, d)}^2`);
/** A vector as TeX. */
const vt = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(', ')})`;
/** a + bi as TeX. */
function ct(re, im, d = 2) {
  const a = Number(tn(re, d)), b = Number(tn(im, d));
  if (b === 0) return tn(a, d);
  const bb = Math.abs(b) === 1 ? '' : tn(Math.abs(b), d);
  return a === 0 ? `${b < 0 ? '-' : ''}${bb}i` : `${tn(a, d)} ${b < 0 ? '-' : '+'} ${bb}i`;
}
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cbar = (a) => [a[0], -a[1]];
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const cabs = (a) => Math.hypot(a[0], a[1]);
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
const len2 = (a) => Math.hypot(a[0], a[1]);
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const unit3 = (a) => { const l = len3(a); return l > 1e-12 ? mul3(a, 1 / l) : [0, 0, 0]; };
const ZERO = [0, 0, 0];
/** The form (u, v) ↦ vᵀAu on ℝ² (linear in the first slot, like Axler's inner products). */
const formA = (A) => (u, v) => v[0] * (A[0][0] * u[0] + A[0][1] * u[1]) + v[1] * (A[1][0] * u[0] + A[1][1] * u[1]);
const mtex = (A, d = 2) => `\\begin{bmatrix}${A.map((r) => r.map((x) => tn(x, d)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
/**
 * The level set {x ∈ ℝ² : q(x) = c} of a quadratic form, traced in polar coordinates: r(θ) = √(c / q(cos θ, sin θ))
 * wherever that is real (null entries break the curve). rmax clips the far branches of hyperbolas and line pairs.
 */
function levelSet(q, c, rmax = 8, n = 360) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (TAU * i) / n, d = [Math.cos(t), Math.sin(t)], s = q(d);
    if (s * c > 1e-12) { const r = Math.sqrt(c / s); pts.push(r <= rmax ? [r * d[0], r * d[1]] : null); } else pts.push(null);
  }
  return pts;
}
/** Fans {r·(cos θ, sin θ) : q < 0} of a quadratic form — the vectors whose "square" is negative. */
function negativeCones(q, R = 9, n = 360) {
  const fans = []; let run = null;
  for (let i = 0; i <= n; i++) {
    const t = (TAU * i) / n, d = [Math.cos(t), Math.sin(t)];
    if (q(d) < -1e-12) { if (!run) run = [[0, 0]]; run.push([R * d[0], R * d[1]]); } else if (run) { fans.push(run); run = null; }
  }
  if (run) fans.push(run);
  return fans;
}
/** Minimum of q on the Euclidean unit circle, and a direction where q = 0 if q changes sign or touches 0. */
function formMin(q, n = 1440) {
  let mn = Infinity, at = null, zero = null; const vals = [];
  for (let i = 0; i < n; i++) { const t = (Math.PI * i) / n, s = q([Math.cos(t), Math.sin(t)]); vals.push(s); if (s < mn) { mn = s; at = t; } }
  if (Math.abs(mn) < 1e-9) zero = [Math.cos(at), Math.sin(at)];
  else if (mn < 0) for (let i = 0; i < n; i++) {
    const a = vals[i], b = i + 1 < n ? vals[i + 1] : q([-1, 0]);
    if (a > 0 && b <= 0 || a <= 0 && b > 0) {
      let lo = (Math.PI * i) / n, hi = (Math.PI * (i + 1)) / n;
      for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if ((q([Math.cos(m), Math.sin(m)]) > 0) === (a > 0)) lo = m; else hi = m; }
      zero = [Math.cos(lo), Math.sin(lo)]; break;
    }
  }
  return { min: mn, zero };
}
/** A small right-angle marker at o with legs along the directions a and b (data units, length s). */
function rightMark(S, o, a, b, s, st) {
  const la = len2(a), lb = len2(b); if (la < 1e-9 || lb < 1e-9) return;
  const p = [o[0] + (s * a[0]) / la, o[1] + (s * a[1]) / la], q = [o[0] + (s * b[0]) / lb, o[1] + (s * b[1]) / lb];
  S.path([p, [p[0] + q[0] - o[0], p[1] + q[1] - o[1]], q], { width: 1.6, ...st });
}
/** Right-angle marker in a scene3 at o between the directions a and b. */
function rightMark3(sc, o, a, b, s, st) {
  const A = mul3(unit3(a), s), B = mul3(unit3(b), s);
  sc.path([add3(o, A), add3(add3(o, A), B), add3(o, B)], { width: 1.5, ...st });
}
/** Orthonormal basis of span(vs) in ℝⁿ (Gram–Schmidt, twice for stability); vectors already in the span are skipped. */
function orthN(vs, tol = 1e-7) {
  const B = [];
  for (const x of vs) {
    let w = x.slice();
    for (let p = 0; p < 2; p++) for (const e of B) { const d = w.reduce((s, c, i) => s + c * e[i], 0); w = w.map((c, i) => c - d * e[i]); }
    const l = Math.hypot(...w); if (l > tol * Math.max(1, Math.hypot(...x))) B.push(w.map((c) => c / l));
  }
  return B;
}
/**
 * Show exactly the stages flagged true and resize the visible ones (the runtime's ResizeObserver watches only the
 * whole viz, so a stage shown again would otherwise keep a stale canvas size). Call from onChange and once at setup.
 */
function layout(v, list) {
  for (const [S, on] of list) { S.el.hidden = !on; S.el.style.display = on ? '' : 'none'; }
  for (const [S, on] of list) if (on && typeof S.resize === 'function') S.resize();
  v.invalidate();
}

// ---------- functions on [−1, 1] ----------
/** Value of the polynomial with ascending coefficients c at x. */
const pval = (c, x) => { let s = 0; for (let k = c.length - 1; k >= 0; k--) s = s * x + c[k]; return s; };
/** The quadratic through (x_k, y_k), k = 0, 1, 2, as ascending coefficients (Lagrange interpolation). */
function quadThrough(xs, ys) {
  const c = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    const [a, b] = xs.filter((_, j) => j !== k), den = (xs[k] - a) * (xs[k] - b), w = ys[k] / den;
    c[0] += w * a * b; c[1] -= w * (a + b); c[2] += w;
  }
  return c;
}
/** ∫_a^b f by composite Simpson's rule (exact for cubics; error ~1e-10 for the smooth functions used here). */
function simpson(f, a, b, n = 240) {
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}
/** ∫_{-1}^{1} f, split at 0 so that kinks and jumps at 0 (|x|, sign x) are integrated accurately. */
const integ = (f, a = -1, b = 1) => (a < 0 && b > 0 ? simpson(f, a, 0) + simpson(f, 0, b) : simpson(f, a, b));
/** The function inner product ⟨f, g⟩ = ∫_a^b f g. */
const ipF = (f, g, a = -1, b = 1) => integ((x) => f(x) * g(x), a, b);
/** Legendre polynomial P_k(x) (three-term recurrence). */
function legP(k, x) { let p0 = 1, p1 = x; if (k === 0) return 1; for (let n = 1; n < k; n++) { const p2 = ((2 * n + 1) * x * p1 - n * p0) / (n + 1); p0 = p1; p1 = p2; } return p1; }
/** The orthonormal Legendre polynomials on [−1, 1]: e_k = √((2k+1)/2) P_k, k = 0, 1, 2, … */
const legE = (k, x) => Math.sqrt((2 * k + 1) / 2) * legP(k, x);
const FCOL = ['accent', 'teal', 'purple', 'pink', 'orange', 'green', 'gold', 'red'];

export default {
  collection: 'ladr',
  chapter: 6,
  title: 'Inner Product Spaces',
  summary: String.raw`An inner product brings length and angle into an abstract vector space. The chapter first derives the basic geometry from the axioms alone — Pythagoras, the orthogonal decomposition, the Cauchy–Schwarz and triangle inequalities, the parallelogram equality — and then turns to orthonormal lists: they are automatically independent, satisfy Bessel's inequality, make coordinates into inner products, and are produced from any independent list by the Gram–Schmidt procedure, which yields orthonormal bases and Schur's triangular form. Linear functionals turn out to be inner products against a fixed vector (Riesz), and orthogonal complements and projections solve minimization problems, ending with the pseudoinverse as the best approximate solver of $Tx = w$.`,
  items: [
    // ------------------------------------------------------------------ 6.2
    {
      num: '6.2',
      kind: 'Definition',
      name: 'Inner product',
      statement: String.raw`An **inner product** on a vector space $V$ over $\mathbf F$ assigns to every ordered pair $(u, v)$ of vectors in $V$ a number $\langle u, v\rangle \in \mathbf F$ such that
- **positivity:** $\langle v, v\rangle \ge 0$ for all $v \in V$ (for $\lambda \in \mathbf C$, "$\lambda \ge 0$" means $\lambda$ is real and nonnegative);
- **definiteness:** $\langle v, v\rangle = 0$ if and only if $v = 0$;
- **additivity in the first slot:** $\langle u + v, w\rangle = \langle u, w\rangle + \langle v, w\rangle$ for all $u, v, w \in V$;
- **homogeneity in the first slot:** $\langle \lambda u, v\rangle = \lambda\langle u, v\rangle$ for all $\lambda \in \mathbf F$ and $u, v \in V$;
- **conjugate symmetry:** $\langle u, v\rangle = \overline{\langle v, u\rangle}$ for all $u, v \in V$.

An **inner product space** is a vector space together with an inner product on it (6.4). Examples: the Euclidean inner product $\langle w, z\rangle = w_1\bar z_1 + \cdots + w_n\bar z_n$ on $\mathbf F^n$; weighted versions $c_1 w_1\bar z_1 + \cdots + c_n w_n \bar z_n$ with all $c_k > 0$; and $\langle f, g\rangle = \int_{-1}^1 fg$ on the continuous real functions on $[-1, 1]$.`,
      idea: String.raw`The axioms abstract what the dot product does on $\mathbf R^n$: $x\cdot x = \|x\|^2$ is positive away from $0$, and $x \mapsto x\cdot y$ is linear. Over $\mathbf C$ the natural "length squared" of $z$ is $z_1\bar z_1 + \cdots + z_n\bar z_n$, so the second vector must be conjugated, and then swapping the two vectors conjugates the result — hence conjugate symmetry instead of plain symmetry. On $\mathbf R^2$ every function $\langle u, v\rangle = v^{\mathsf T}\!Au$ with $A$ symmetric and positive definite is an inner product; its "unit circle" $\{x : \langle x, x\rangle = 1\}$ is an ellipse, and its right angles are the ones that look right after squashing that ellipse back into a circle.`,
      caption: String.raw`Pick a candidate $\langle\cdot,\cdot\rangle$ on $\mathbf R^2$ and drag $u$, $v$, $w$. The blue curve is its "unit circle" $\langle x, x\rangle = 1$; the green dashed line is every $x$ with $\langle x, u\rangle = 0$ — drag $v$ onto it and a right-angle marker (a parallelogram, in a skewed geometry) appears. The panel tests the five axioms on your vectors. The last three candidates each break something: *not symmetric* tilts the two orthogonality lines apart, *indefinite* has vectors with $\langle x, x\rangle < 0$ (red cones), and $|x_1y_1| + |x_2y_2|$ is positive and symmetric but not linear.`,
      deps: ['ladr-1.20', 'ladr-4.2'],
      see: ['rca-4.1', 'fa-12.1'],
      tags: ['inner products'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Inner_product_space' },
      viz(v) {
        const FORMS = {
          dot: { A: [[1, 0], [0, 1]] }, w: { A: [[2, 0], [0, 0.5]] }, sk: { A: [[1.4, 0.6], [0.6, 0.8]] },
          ns: { A: [[1, 0.7], [-0.7, 1]] }, ind: { A: [[1, 0], [0, -0.6]] },
          abs: { f: (x, y) => Math.abs(x[0] * y[0]) + Math.abs(x[1] * y[1]) },
        };
        const START = { abs: [[1.2, 0.6], [-0.9, 0.7], [1, 0.4]] };
        const pre = v.select('', [
          { value: 'dot', label: 'dot product' }, { value: 'w', label: 'weighted' }, { value: 'sk', label: 'skewed' },
          { value: 'ns', label: 'not symmetric' }, { value: 'ind', label: 'indefinite' }, { value: 'abs', label: '$|x_1y_1| + |x_2y_2|$' },
        ], 'sk', { onChange: (k) => { const p = START[k] || [[1.3, 0.55], [-0.5, 1.2], [0.8, -1]]; u.set(...p[0]); vv.set(...p[1]); w.set(...p[2]); } });
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.1, 2.1], equal: true, height: 400, weight: 1.3, minWidth: 320 });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 280, title: 'the five axioms, tested' });
        let F = null, ip = null;
        const perpDir = (a) => { if (!F.A) return null; const A = F.A, n = [A[0][0] * a[0] + A[1][0] * a[1], A[0][1] * a[0] + A[1][1] * a[1]]; return len2(n) > 1e-9 ? [-n[1], n[0]] : null; }; // {x : ⟨x, a⟩ = 0}
        const u = S.handle(1.3, 0.55, { color: 'accent', label: 'u' });
        const vv = S.handle(-0.5, 1.2, {
          color: 'orange', label: 'v', constrain: (x, y) => {
            const d = perpDir([u.x, u.y]); if (!d) return [x, y];
            const L = len2(d), t = (x * d[0] + y * d[1]) / L, dist = Math.abs(x * d[1] - y * d[0]) / L;
            return dist < 0.09 && Math.abs(t) > 0.2 ? [(t * d[0]) / L, (t * d[1]) / L] : [x, y];
          },
        });
        const w = S.handle(0.8, -1, { color: 'teal', label: 'w', r: 6 });
        let st = null;
        v.render(() => {
          F = FORMS[pre.value]; ip = F.f || formA(F.A);
          const q = (x) => ip(x, x), U = [u.x, u.y], V = [vv.x, vv.y], W = [w.x, w.y];
          const mm = formMin(q);
          for (const fan of negativeCones(q)) S.poly(fan, { fill: 'red', fillAlpha: 0.1, stroke: false });
          if (mm.min < 0) S.path(levelSet(q, -1), { color: 'red', width: 1.4, dash: [5, 4] });
          S.path(levelSet(q, 1), { color: 'accent', width: 2.4 });
          if (mm.zero) { const z = mm.zero; S.line(-9 * z[0], -9 * z[1], 9 * z[0], 9 * z[1], { color: 'red', width: 1.2, alpha: 0.7 }); }
          const d = perpDir(U);
          if (d) { const L = 9 / len2(d); S.line(-d[0] * L, -d[1] * L, d[0] * L, d[1] * L, { color: 'green', width: 1.6, dash: [7, 5] }); }
          if (pre.value === 'ns') { const A = F.A, n = [A[0][0] * U[0] + A[0][1] * U[1], A[1][0] * U[0] + A[1][1] * U[1]], L = 9 / (len2(n) || 1); S.line(n[1] * L, -n[0] * L, -n[1] * L, n[0] * L, { color: 'red', width: 1.4, dash: [3, 4] }); }
          const perp = d && Math.abs(ip(V, U)) < 1e-9 && len2(V) > 0.1 && len2(U) > 0.1;
          if (perp) rightMark(S, [0, 0], U, V, 0.26, { color: 'green', width: 2 });
          S.arrow(0, 0, w.x, w.y, { color: 'teal', width: 2 });
          S.arrow(0, 0, vv.x, vv.y, { color: 'orange', width: 2.6 });
          S.arrow(0, 0, u.x, u.y, { color: 'accent', width: 2.6 });
          if (perp) S.corner(pre.value === 'ns' && Math.abs(ip(U, V)) > 1e-6 ? '⟨v, u⟩ = 0 but ⟨u, v⟩ ≠ 0' : 'v is orthogonal to u', 'tl', { color: pre.value === 'ns' ? 'red' : 'green', weight: 700 });
          // the axioms
          const near = (a, b) => Math.abs(a - b) < 1e-9 * (1 + Math.abs(a) + Math.abs(b));
          const uv = ip(U, V), vu = ip(V, U);
          const a1 = ip([U[0] + V[0], U[1] + V[1]], W), a2 = ip(U, W) + ip(V, W), h1 = ip([-2 * U[0], -2 * U[1]], V), h2 = -2 * uv;
          const rel = (ok) => (ok ? '=' : '\\ne');
          const rows = [
            ['positivity', `\\min_{x_1^2 + x_2^2 = 1}\\langle x, x\\rangle = ${tn(mm.min)}`, mm.min >= -1e-12],
            ['definiteness', mm.zero ? `\\langle x, x\\rangle = 0 \\text{ for } x = ${vt(mm.zero)}` : '\\langle x, x\\rangle = 0 \\text{ only for } x = 0', !mm.zero],
            ['additivity in slot 1', `\\langle u{+}v, w\\rangle = ${tn(a1)} ${rel(near(a1, a2))} ${tn(a2)} = \\langle u, w\\rangle {+} \\langle v, w\\rangle`, near(a1, a2)],
            ['homogeneity in slot 1', `\\langle -2u, v\\rangle = ${tn(h1)} ${rel(near(h1, h2))} ${tn(h2)} = -2\\langle u, v\\rangle`, near(h1, h2)],
            ['(conjugate) symmetry', `\\langle u, v\\rangle = ${tn(uv)} ${rel(near(uv, vu))} ${tn(vu)} = \\langle v, u\\rangle`, near(uv, vu)],
          ];
          rows.forEach(([name, f, ok], i) => {
            const y = 0.89 - i * 0.185;
            T.text(name, 0.04, y, { size: 12, weight: 700, color: 'muted' });
            T.tex(f, 0.04, y - 0.075, { align: 'left', size: 13 });
            T.text(ok ? '✓' : '✗', 0.97, y - 0.035, { color: ok ? 'green' : 'red', size: 19, weight: 700, align: 'right' });
          });
          st = { uv, vu, ok: rows.every((r) => r[2]), fails: rows.filter((r) => !r[2]).map((r) => r[0]) };
          v.legend([['accent', '$\\langle x, x\\rangle = 1$'], ['green', '$\\{x : \\langle x, u\\rangle = 0\\}$', { dash: true }], ...(mm.min < 0 ? [['red', '$\\langle x, x\\rangle < 0$', { area: true }]] : []), ...(pre.value === 'ns' ? [['red', '$\\{x : \\langle u, x\\rangle = 0\\}$', { dash: true }]] : [])]);
        });
        v.readout(() => {
          if (!st) return '';
          const def = F.A ? `$\\langle x, y\\rangle = y^{\\mathsf T}\\! A x$ with $A = ${mtex(F.A)}$` : '$\\langle x, y\\rangle = |x_1y_1| + |x_2y_2|$';
          return `${def}: $\\langle u, v\\rangle = ${tn(st.uv, 3)}$. ` + (st.ok ? 'All five axioms hold — **an inner product**.' : `**Not an inner product**: ${st.fails.join(', ')} fail${st.fails.length > 1 ? '' : 's'}.`);
        });
      },
    },
    // ------------------------------------------------------------------ 6.6
    {
      num: '6.6',
      kind: 'Theorem',
      name: 'Basic properties of an inner product',
      statement: String.raw`Let $V$ be an inner product space.
(a) For each fixed $v \in V$, the function $u \mapsto \langle u, v\rangle$ is a linear map from $V$ to $\mathbf F$.
(b) $\langle 0, v\rangle = 0$ for every $v \in V$.
(c) $\langle v, 0\rangle = 0$ for every $v \in V$.
(d) $\langle u, v + w\rangle = \langle u, v\rangle + \langle u, w\rangle$ for all $u, v, w \in V$.
(e) $\langle u, \lambda v\rangle = \bar\lambda\,\langle u, v\rangle$ for all $\lambda \in \mathbf F$ and $u, v \in V$.`,
      idea: String.raw`(a) is just additivity and homogeneity in the first slot, and (b) follows because a linear map sends $0$ to $0$ (3.10). Everything about the second slot is obtained by moving the vector to the first slot with conjugate symmetry, using the first-slot rule there, and moving back: for (e), $\langle u, \lambda v\rangle = \overline{\langle \lambda v, u\rangle} = \overline{\lambda\langle v, u\rangle} = \bar\lambda\,\overline{\langle v, u\rangle} = \bar\lambda\langle u, v\rangle$, where conjugation respects sums and products (4.4). So the second slot is additive but only *conjugate* homogeneous; over $\mathbf R$ the bar disappears.`,
      caption: String.raw`A concrete case: $\mathbf C^2$ with $\langle u, v\rangle = u_1\bar v_1 + u_2\bar v_2$. Drag the coordinates of $u$ (blue), $v$ (orange) and $w$ (teal) in the two left planes; the right plane shows the values, $\langle u, v\rangle$ built tip-to-tail from $u_1\bar v_1$ and $u_2\bar v_2$. Drag the gold scalar $\lambda$: in the first slot $\langle \lambda u, v\rangle$ turns *with* $\lambda$, in the second slot $\langle u, \lambda v\rangle$ turns the *opposite* way — it equals $\bar\lambda\langle u, v\rangle$, not the red $\lambda\langle u, v\rangle$. Make $\lambda$ real to see the two agree, and drop it on $0$ for (b) and (c).`,
      deps: ['ladr-6.2', 'ladr-3.10', 'ladr-3.1', 'ladr-4.4'],
      tags: ['inner products'],
      viz(v) {
        const mode = v.select('', [{ value: 'a', label: '$\\lambda$ in slot 1: (a)(b)' }, { value: 'e', label: '$\\lambda$ in slot 2: (c)(e)' }, { value: 'd', label: 'sum in slot 2: (d)' }], 'e');
        const opt = { equal: true, height: 290, minWidth: 220, xlabel: 'Re', ylabel: 'Im' };
        const P1 = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], ...opt, title: 'first coordinates' });
        const P2 = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], ...opt, title: 'second coordinates' });
        const P3 = v.stage({ x: [-3.8, 3.8], y: [-3.8, 3.8], ...opt, minWidth: 250, weight: 1.25, title: 'the inner products, in $\\mathbf C$' });
        const u1 = P1.handle(1.2, 0.5, { color: 'accent', label: 'u₁' }), v1 = P1.handle(0.9, -0.6, { color: 'orange', label: 'v₁' }), w1 = P1.handle(-0.9, -1.1, { color: 'teal', label: 'w₁', r: 6 });
        const u2 = P2.handle(-0.4, 1.0, { color: 'accent', label: 'u₂' }), v2 = P2.handle(0.7, 0.8, { color: 'orange', label: 'v₂' }), w2 = P2.handle(1.2, -0.5, { color: 'teal', label: 'w₂', r: 6 });
        const lam = P3.handle(0.55, 0.85, { color: 'gold', label: 'λ', constrain: (x, y) => (Math.hypot(x, y) < 0.14 ? [0, 0] : Math.abs(y) < 0.07 ? [x, 0] : [x, y]) });
        const C = (h) => [h.x, h.y];
        const ipC = (a1, a2, b1, b2) => cadd(cmul(a1, cbar(b1)), cmul(a2, cbar(b2)));
        const arcC = (S, r, t0, t1, col) => { let d = t1 - t0; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; if (Math.abs(d) > 0.03) S.curve((t) => [r * Math.cos(t), r * Math.sin(t)], t0, t0 + d, { color: col, width: 1.8, n: 50 }); };
        const lab = (S, s, p, col, dx = 10, dy = -10) => S.tex(s, p[0], p[1], { color: col, size: 14, dx, dy, align: dx >= 0 ? 'left' : 'right' });
        let st = null;
        v.render(() => {
          const md = mode.value, L = C(lam);
          w1.visible = w2.visible = md === 'd'; lam.visible = md !== 'd';
          const U1 = C(u1), U2 = C(u2), V1 = C(v1), V2 = C(v2), W1 = C(w1), W2 = C(w2);
          [[P1, U1, V1, W1, '1'], [P2, U2, V2, W2, '2']].forEach(([P, Uk, Vk, Wk, k]) => {
            if (md === 'a') { const p = cmul(L, Uk); P.arrow(0, 0, p[0], p[1], { color: 'accent', width: 1.6, dash: [5, 4] }); lab(P, `\\lambda u_${k}`, p, 'accent'); }
            if (md === 'e') { const p = cmul(L, Vk); P.arrow(0, 0, p[0], p[1], { color: 'orange', width: 1.6, dash: [5, 4] }); lab(P, `\\lambda v_${k}`, p, 'orange'); }
            if (md === 'd') { const p = cadd(Vk, Wk); P.poly([[0, 0], Vk, p, Wk], { color: 'green', width: 1, dash: [3, 4], fill: 'green', fillAlpha: 0.05 }); P.arrow(0, 0, p[0], p[1], { color: 'green', width: 1.8 }); lab(P, `v_${k}{+}w_${k}`, p, 'green'); P.arrow(0, 0, Wk[0], Wk[1], { color: 'teal', width: 2.2 }); }
            P.arrow(0, 0, Vk[0], Vk[1], { color: 'orange', width: 2.4 });
            P.arrow(0, 0, Uk[0], Uk[1], { color: 'accent', width: 2.4 });
          });
          const t1 = cmul(U1, cbar(V1)), uv = ipC(U1, U2, V1, V2);
          // ⟨u, v⟩ assembled from its two terms
          P3.arrow(0, 0, t1[0], t1[1], { color: 'muted', width: 1.3 }); P3.arrow(t1[0], t1[1], uv[0], uv[1], { color: 'muted', width: 1.3 });
          const tl = 0.5;
          if (cabs(t1) > 0.6) P3.tex('u_1\\bar v_1', t1[0] * tl, t1[1] * tl, { color: 'muted', size: 12, dx: 12 });
          let res = {};
          if (md === 'a' || md === 'e') {
            const naive = cmul(L, uv), good = md === 'a' ? naive : cmul(cbar(L), uv);
            const th = Math.atan2(uv[1], uv[0]), r0 = Math.min(cabs(uv), 1.2) * 0.7;
            P3.circle(0, 0, cabs(L), { color: 'gold', width: 0.8, dash: [2, 4], alpha: 0.6 });
            if (md === 'e') { P3.line(L[0], L[1], L[0], -L[1], { color: 'gold', width: 1, dash: [3, 3] }); P3.dot(L[0], -L[1], { color: 'gold', hollow: true, r: 5 }); if (Math.abs(L[1]) > 0.1) lab(P3, '\\bar\\lambda', [L[0], -L[1]], 'gold', 10, L[1] > 0 ? 12 : -12); }
            if (cabs(L) > 0.05 && cabs(uv) > 0.05) arcC(P3, r0, th, Math.atan2(good[1], good[0]), 'green');
            if (md === 'e' && cabs(cadd(naive, [-good[0], -good[1]])) > 0.02) { P3.dot(naive[0], naive[1], { color: 'red', hollow: true, r: 6, width: 2 }); lab(P3, '\\lambda\\langle u, v\\rangle', naive, 'red', 10, 12); }
            P3.dot(uv[0], uv[1], { color: 'accent', r: 5.5 }); lab(P3, '\\langle u, v\\rangle', uv, 'accent');
            P3.dot(good[0], good[1], { color: 'green', r: 6 });
            lab(P3, md === 'a' ? '\\langle \\lambda u, v\\rangle = \\lambda\\langle u, v\\rangle' : '\\langle u, \\lambda v\\rangle = \\bar\\lambda\\langle u, v\\rangle', good, 'green', good[0] >= 0 ? 10 : -10, 14);
            if (cabs(L) === 0) P3.corner(md === 'a' ? '(b): ⟨0, v⟩ = 0' : '(c): ⟨u, 0⟩ = 0', 'tl', { color: 'green', weight: 700 });
            else if (L[1] === 0) P3.corner('λ real: λ̄ = λ, no difference', 'tl', { color: 'muted', weight: 600 });
            const direct = md === 'a' ? ipC(cmul(L, U1), cmul(L, U2), V1, V2) : ipC(U1, U2, cmul(L, V1), cmul(L, V2));
            res = { naive, good, direct };
          } else {
            const uw = ipC(U1, U2, W1, W2), s = cadd(uv, uw), direct = ipC(U1, U2, cadd(V1, W1), cadd(V2, W2));
            P3.poly([[0, 0], uv, s, uw], { color: 'green', width: 1, dash: [3, 4], fill: 'green', fillAlpha: 0.06 });
            P3.arrow(0, 0, uw[0], uw[1], { color: 'teal', width: 2.2 }); P3.arrow(0, 0, uv[0], uv[1], { color: 'orange', width: 2.2 });
            P3.dot(direct[0], direct[1], { color: 'green', r: 6 });
            lab(P3, '\\langle u, v\\rangle', uv, 'orange'); lab(P3, '\\langle u, w\\rangle', uw, 'teal', 10, 12);
            lab(P3, '\\langle u, v{+}w\\rangle', direct, 'green', direct[0] >= 0 ? 10 : -10, -12);
            res = { uw, s, direct };
          }
          st = { md, uv, L, ...res };
        });
        v.legend([['accent', '$u$'], ['orange', '$v$'], ['teal', '$w$'], ['gold', '$\\lambda$', { dot: true }], ['green', 'computed directly', { dot: true }], ['red', 'the wrong guess $\\lambda\\langle u,v\\rangle$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { md, uv, L } = st;
          if (md === 'd') return `$\\langle u, v + w\\rangle = ${ct(...st.direct)}$ and $\\langle u, v\\rangle + \\langle u, w\\rangle = ${ct(...uv)} + (${ct(...st.uw)}) = ${ct(...st.s)}$ — additive in the second slot.`;
          if (md === 'a') return `$\\lambda = ${ct(...L)}$: $\\langle \\lambda u, v\\rangle = ${ct(...st.direct)} = \\lambda\\langle u, v\\rangle$ — linear in the first slot${cabs(L) === 0 ? ', and $\\langle 0, v\\rangle = 0$' : ''}.`;
          return `$\\lambda = ${ct(...L)}$: $\\langle u, \\lambda v\\rangle = ${ct(...st.direct)} = \\bar\\lambda\\langle u, v\\rangle$, while $\\lambda\\langle u, v\\rangle = ${ct(...st.naive)}$${L[1] === 0 ? ' (the same, since $\\lambda$ is real)' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.7
    {
      num: '6.7',
      kind: 'Definition',
      name: 'Norm',
      statement: String.raw`For $v$ in an inner product space $V$, the **norm** of $v$ is the nonnegative number
$$\|v\| = \sqrt{\langle v, v\rangle}.$$
For example, on $\mathbf F^n$ with the Euclidean inner product $\|(z_1, \dots, z_n)\| = \sqrt{|z_1|^2 + \cdots + |z_n|^2}$, and for continuous real functions on $[-1, 1]$ with $\langle f, g\rangle = \int_{-1}^1 fg$ it is $\|f\| = \big(\int_{-1}^1 f^2\big)^{1/2}$.`,
      idea: String.raw`Positivity makes the square root meaningful. On $\mathbf R^2$ with the dot product it is the ordinary length (Pythagoras). A different inner product gives a different length: its unit sphere $\{x : \|x\| = 1\}$ is the level set $\langle x, x\rangle = 1$, and $\|v\|$ says how many times that unit sphere must be scaled to pass through $v$. Thinking of a vector in $\mathbf R^n$ as a function $k \mapsto v_k$, $\|v\|^2 = \sum v_k^2$ is the area of the bars of $v_k^2$, and $\|f\|^2 = \int f^2$ is the same idea with infinitely many coordinates.`,
      caption: String.raw`**Vectors**: drag $v$ and the weights $c_1, c_2$ of $\langle x, y\rangle = c_1x_1y_1 + c_2x_2y_2$. Blue is the dot-product unit circle, orange the weighted unit ellipse; each ray meets them at $v/\|v\|$, and the dashed curves through $v$ are the spheres of radius $\|v\|$. The right panel shows $\|v\|^2$ as the area of bars of height $v_k^2$ and width $c_k$. **Functions**: drag the three handles to shape a quadratic $f$; $\|f\|^2$ is the shaded area under $f^2$.`,
      deps: ['ladr-6.2'],
      tags: ['norms'],
      viz(v) {
        const mode = v.select('', [{ value: 'R2', label: 'vectors in $\\mathbf R^2$' }, { value: 'fn', label: 'functions on $[-1, 1]$' }], 'R2', { onChange: () => show() });
        const c1 = v.slider('$c_1$', 0.25, 3, 2, { step: 0.05 }), c2 = v.slider('$c_2$', 0.25, 3, 0.5, { step: 0.05 });
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.2, 2.2], equal: true, height: 360, weight: 1.3, minWidth: 300 });
        const Fs = v.stage({ x: [-1.2, 1.2], y: [-2.2, 2.2], height: 360, weight: 1.3, minWidth: 300, title: '$f$, a quadratic on $[-1, 1]$' });
        const R = v.stage({ x: [-0.2, 4.2], y: [-0.3, 5], height: 360, minWidth: 250, axes: 'box', title: 'the norm squared, as an area' });
        const show = () => { const fn = mode.value === 'fn'; layout(v, [[S, !fn], [Fs, fn], [R, true]]); c1.el.hidden = c2.el.hidden = fn; };
        const vh = S.handle(1.5, 0.9, { color: 'accent', label: 'v' });
        const XS = [-0.75, 0, 0.75], fh = [[-0.75, -0.4], [0, 0.9], [0.75, 1.4]].map(([x, y]) => Fs.handle(x, y, { color: 'accent', constrain: (_, yy) => [x, Math.max(-2.1, Math.min(2.1, yy))] }));
        show();
        let st = null;
        v.render(() => {
          if (mode.value === 'R2') {
            const a = c1.value, b = c2.value, V = [vh.x, vh.y];
            const qE = (x) => x[0] * x[0] + x[1] * x[1], qW = (x) => a * x[0] * x[0] + b * x[1] * x[1];
            const nE = Math.sqrt(qE(V)), nW = Math.sqrt(qW(V));
            S.path(levelSet(qE, 1), { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.05 });
            S.path(levelSet(qW, 1), { color: 'orange', width: 2.2, fill: 'orange', fillAlpha: 0.05 });
            if (nE > 0.05) { S.path(levelSet(qE, nE * nE, 20), { color: 'accent', width: 1, dash: [4, 4], alpha: 0.7 }); S.path(levelSet(qW, nW * nW, 20), { color: 'orange', width: 1, dash: [4, 4], alpha: 0.7 }); }
            S.arrow(0, 0, V[0], V[1], { color: 'ink', width: 2.6 });
            if (nE > 0.05) {
              S.dot(V[0] / nE, V[1] / nE, { color: 'accent', r: 5 }); S.dot(V[0] / nW, V[1] / nW, { color: 'orange', r: 5 });
              S.tex('v/\\|v\\|_2', V[0] / nE, V[1] / nE, { color: 'accent', size: 13, dx: -8, dy: -12, align: 'right' });
              S.tex('v/\\|v\\|_c', V[0] / nW, V[1] / nW, { color: 'orange', size: 13, dx: 8, dy: 12, align: 'left' });
            }
            // bars of c_k v_k²: widths c_k, heights v_k²
            const h1 = V[0] * V[0], h2 = V[1] * V[1], top = Math.max(1.5, h1, h2) * 1.18;
            R.setView([-0.25, 2 * 3 + 0.9], [-0.06 * top, top]);
            const bar = (x0, wd, ht, col, k) => { R.rect(x0, 0, x0 + wd, ht, { fill: col, fillAlpha: 0.22, color: col, width: 1.6 }); R.tex(`v_${k}^2 = ${tn(ht)}`, x0 + wd / 2, ht, { color: col, size: 13, dy: -11 }); R.tex(`c_${k} = ${tn(wd)}`, x0 + wd / 2, 0, { color: 'muted', size: 12, dy: 11 }); };
            bar(0.2, a, h1, 'orange', 1); bar(0.2 + a + 0.5, b, h2, 'orange', 2);
            R.rect(0.2, 0, 1.2, h1, { color: 'accent', width: 1.2, dash: [4, 3] }); R.rect(0.2 + a + 0.5, 0, 0.2 + a + 1.5, h2, { color: 'accent', width: 1.2, dash: [4, 3] });
            R.corner(`area = ${pn(nW * nW)} = ‖v‖²_c`, 'tr', { color: 'orange', weight: 700 });
            R.corner(`dashed (c = 1): ${pn(nE * nE)} = ‖v‖²₂`, 'tr', { color: 'accent', weight: 600, dy: 18 });
            st = { R2: true, V, nE, nW, a, b };
          } else {
            const c = quadThrough(XS, fh.map((h) => h.y)), f = (x) => pval(c, x), f2 = (x) => f(x) * f(x);
            Fs.vline(-1, { color: 'faint', dash: [3, 4] }); Fs.vline(1, { color: 'faint', dash: [3, 4] });
            Fs.fn(f, { domain: [-1, 1], color: 'accent', width: 2.8 });
            const area = integ(f2), top = Math.max(1, ...Array.from({ length: 41 }, (_, i) => f2(-1 + i / 20))) * 1.15;
            R.setView([-1.2, 1.2], [-0.06 * top, top]);
            R.fn(f2, { domain: [-1, 1], color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.22 });
            R.tex('f^2', 0.96, f2(0.96), { color: 'accent', size: 15, dx: 6, dy: -10, align: 'left' });
            R.corner(`shaded area = ∫ f² = ${pn(area, 3)}`, 'tr', { color: 'accent', weight: 700 });
            R.corner(`‖f‖ = ${pn(Math.sqrt(area), 3)}`, 'tr', { color: 'accent', weight: 600, dy: 18 });
            st = { R2: false, c, area };
          }
        });
        v.legend([['accent', 'dot product $\\|\\cdot\\|_2$ (functions: $\\int f^2$)'], ['orange', 'weighted $\\|\\cdot\\|_c$']]);
        v.readout(() => {
          if (!st) return '';
          if (st.R2) { const { V, nE, nW, a, b } = st; return `$v = ${vt(V)}$: $\\|v\\|_2 = \\sqrt{${sqT(V[0])} + ${sqT(V[1])}} = ${tn(nE, 3)}$, $\\quad \\|v\\|_c = \\sqrt{${tn(a)}\\cdot ${sqT(V[0])} + ${tn(b)}\\cdot ${sqT(V[1])}} = ${tn(nW, 3)}$ — one vector, two lengths.`; }
          return `$f(x) = ${tn(st.c[0])} ${st.c[1] < 0 ? '-' : '+'} ${tn(Math.abs(st.c[1]))}x ${st.c[2] < 0 ? '-' : '+'} ${tn(Math.abs(st.c[2]))}x^2$: $\\|f\\|^2 = \\int_{-1}^1 f^2 = ${tn(st.area, 3)}$, so $\\|f\\| = ${tn(Math.sqrt(st.area), 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.9
    {
      num: '6.9',
      kind: 'Theorem',
      name: 'Basic properties of the norm',
      statement: String.raw`Suppose $v \in V$, an inner product space.
(a) $\|v\| = 0$ if and only if $v = 0$.
(b) $\|\lambda v\| = |\lambda|\,\|v\|$ for all $\lambda \in \mathbf F$.`,
      idea: String.raw`(a) is definiteness of the inner product, read through the square root. For (b), work with squares: $\|\lambda v\|^2 = \langle \lambda v, \lambda v\rangle = \lambda\bar\lambda\langle v, v\rangle = |\lambda|^2\|v\|^2$, pulling $\lambda$ out of the first slot and $\bar\lambda$ out of the second (6.6(e)), then use $\lambda\bar\lambda = |\lambda|^2$ (4.4) and take square roots. So (b) only needs the linearity axioms, while (a) needs definiteness.`,
      caption: String.raw`Drag $v$ and the slider $\lambda$. Left: the gold arrow $\lambda v$ with the norm's level curves through $v$ and $\lambda v$. Right: the graph of $\lambda \mapsto \|\lambda v\|$, computed from the inner product, lies exactly on the green V of slope $\|v\|$ and touches $0$ only at $\lambda = 0$. The third form $(x_1 - x_2)(y_1 - y_2)$ is not definite: drag $v$ onto the red line $x_1 = x_2$ (it snaps) and the whole graph collapses to $0$ although $v \ne 0$ — (a) fails, (b) survives.`,
      deps: ['ladr-6.7', 'ladr-6.6', 'ladr-4.4'],
      tags: ['norms'],
      viz(v) {
        const FORMS = { dot: (x) => x[0] * x[0] + x[1] * x[1], w: (x) => 2 * x[0] * x[0] + 0.5 * x[1] * x[1], deg: (x) => (x[0] - x[1]) ** 2 };
        const form = v.select('', [{ value: 'dot', label: 'dot product' }, { value: 'w', label: '$2x_1y_1 + \\frac12 x_2y_2$' }, { value: 'deg', label: '$(x_1 - x_2)(y_1 - y_2)$' }], 'w');
        const lam = v.slider('$\\lambda$', -2.5, 2.5, 1.6, { step: 0.01 });
        const S = v.stage({ x: [-3, 3], y: [-2.4, 2.4], equal: true, height: 370, weight: 1.25, minWidth: 300 });
        const G = v.stage({ x: [-2.7, 2.7], y: [-0.4, 4], height: 370, minWidth: 260, axes: true, xlabel: 'λ', title: 'the function $\\lambda \\mapsto \\|\\lambda v\\|$' });
        const vh = S.handle(0.95, 0.45, { color: 'accent', label: 'v', constrain: (x, y) => (form.value === 'deg' && Math.abs(x - y) < 0.12 ? [(x + y) / 2, (x + y) / 2] : [x, y]) });
        let st = null;
        v.render(() => {
          const q = FORMS[form.value], N = (x) => Math.sqrt(Math.max(0, q(x))), V = [vh.x, vh.y], l = lam.value, LV = [l * V[0], l * V[1]];
          const nv = N(V), nl = N(LV);
          if (form.value === 'deg') { S.line(-9, -9, 9, 9, { color: 'red', width: 2, alpha: 0.6 }); S.tex('\\|x\\| = 0', 1.9, 1.9, { color: 'red', size: 14, dx: 10, dy: 12, align: 'left' }); }
          S.path(levelSet(q, 1, 12), { color: 'muted', width: 1.2 });
          if (nv > 1e-6) S.path(levelSet(q, nv * nv, 14), { color: 'accent', width: 1.4, dash: [5, 4] });
          if (nl > 1e-6) S.path(levelSet(q, nl * nl, 14), { color: 'gold', width: 1.4, dash: [5, 4] });
          S.arrow(0, 0, LV[0], LV[1], { color: 'gold', width: 3.2 });
          S.arrow(0, 0, V[0], V[1], { color: 'accent', width: 2.4 });
          if (Math.abs(l) > 0.15) S.tex('\\lambda v', LV[0], LV[1], { color: 'gold', size: 15, dx: 12, dy: 10, align: 'left' });
          // the graph
          const top = Math.max(1.2, 2.7 * nv * 1.12);
          G.setView([-2.7, 2.7], [-0.1 * top, top]);
          G.fn((t) => Math.abs(t) * nv, { color: 'green', width: 6, alpha: 0.3 });
          G.fn((t) => N([t * V[0], t * V[1]]), { color: 'accent', width: 2.2 });
          G.vline(l, { color: 'gold', width: 1, dash: [3, 4] });
          G.dot(l, nl, { color: 'gold', r: 6 });
          G.dot(0, 0, { color: nv > 1e-9 ? 'green' : 'red', r: 5 });
          if (nv < 1e-9) G.corner('v ≠ 0 but ‖v‖ = 0: (a) fails', 'tl', { color: 'red', weight: 700 });
          else G.corner(`slope ‖v‖ = ${pn(nv, 3)}`, 'tl', { color: 'green', weight: 700 });
          st = { nv, nl, l, V };
        });
        v.legend([['accent', '$v$, level curve through $v$'], ['gold', '$\\lambda v$'], ['accent', '$\\|\\lambda v\\|$ computed'], ['green', '$|\\lambda|\\,\\|v\\|$']]);
        v.readout(() => {
          if (!st) return '';
          const { nv, nl, l, V } = st;
          return `$\\|\\lambda v\\| = ${tn(nl, 3)}$ and $|\\lambda|\\,\\|v\\| = ${tn(Math.abs(l), 2)} \\cdot ${tn(nv, 3)} = ${tn(Math.abs(l) * nv, 3)}$. ` + (nv < 1e-9 && len2(V) > 1e-9 ? 'Here $v \\ne 0$ has norm $0$: this form is not definite, so it is not an inner product.' : '$\\|v\\| = 0$ would force $v = 0$.');
        });
      },
    },
  ],
};
