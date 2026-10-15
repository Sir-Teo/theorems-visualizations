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
/** Arrow from (x0, y0) that stops `gap` pixels short of (x1, y1), so that its head stays visible beside a handle there. */
function arrowTo(S, x0, y0, x1, y1, st = {}, gap = 8) {
  const L = Math.hypot(S.X(x1) - S.X(x0), S.Y(y1) - S.Y(y0));
  if (L < gap + 3) return;
  const t = (L - gap) / L;
  S.arrow(x0, y0, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, st);
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
        const START = { abs: [[1.2, 0.6], [-0.9, 0.7], [0.6, -1.1]] };
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
          arrowTo(S, 0, 0, w.x, w.y, { color: 'teal', width: 2 });
          arrowTo(S, 0, 0, vv.x, vv.y, { color: 'orange', width: 2.6 });
          arrowTo(S, 0, 0, u.x, u.y, { color: 'accent', width: 2.6 });
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
          v.legend([['accent', '$\\langle x, x\\rangle = 1$'], ...(d ? [['green', '$\\{x : \\langle x, u\\rangle = 0\\}$', { dash: true }]] : []), ...(mm.min < 0 ? [['red', '$\\langle x, x\\rangle < 0$', { area: true }]] : []), ...(pre.value === 'ns' ? [['red', '$\\{x : \\langle u, x\\rangle = 0\\}$', { dash: true }]] : [])]);
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
        const lam = P3.handle(0.75, -0.6, { color: 'gold', label: 'λ', constrain: (x, y) => (Math.hypot(x, y) < 0.14 ? [0, 0] : Math.abs(y) < 0.07 ? [x, 0] : [x, y]) });
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
            if (md === 'd') { const p = cadd(Vk, Wk); P.poly([[0, 0], Vk, p, Wk], { color: 'green', width: 1, dash: [3, 4], fill: 'green', fillAlpha: 0.05 }); P.arrow(0, 0, p[0], p[1], { color: 'green', width: 1.8 }); lab(P, `v_${k}{+}w_${k}`, p, 'green'); arrowTo(P, 0, 0, Wk[0], Wk[1], { color: 'teal', width: 2.2 }); }
            arrowTo(P, 0, 0, Vk[0], Vk[1], { color: 'orange', width: 2.4 });
            arrowTo(P, 0, 0, Uk[0], Uk[1], { color: 'accent', width: 2.4 });
          });
          const t1 = cmul(U1, cbar(V1)), uv = ipC(U1, U2, V1, V2);
          // keep every value in view
          const pts = [uv, t1, L, cmul(L, uv), cmul(cbar(L), uv)];
          if (md === 'd') { const uw = ipC(U1, U2, W1, W2); pts.push(uw, cadd(uv, uw)); }
          const R = Math.max(2.6, 1.22 * Math.max(...pts.map(cabs)));
          P3.setView([-R, R], [-R, R]);
          // ⟨u, v⟩ assembled from its two terms
          P3.arrow(0, 0, t1[0], t1[1], { color: 'muted', width: 1.3 }); P3.arrow(t1[0], t1[1], uv[0], uv[1], { color: 'muted', width: 1.3 });
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
            lab(P3, md === 'a' ? '\\langle \\lambda u, v\\rangle' : '\\langle u, \\lambda v\\rangle', good, 'green', good[0] >= 0 ? 10 : -10, 14);
            if (cabs(L) === 0) P3.corner(md === 'a' ? '(b): ⟨0, v⟩ = 0' : '(c): ⟨u, 0⟩ = 0', 'tl', { color: 'green', weight: 700 });
            else if (L[1] === 0) P3.corner('λ real: λ̄ = λ, no difference', 'tl', { color: 'muted', weight: 600 });
            const direct = md === 'a' ? ipC(cmul(L, U1), cmul(L, U2), V1, V2) : ipC(U1, U2, cmul(L, V1), cmul(L, V2));
            res = { naive, good, direct };
          } else {
            const uw = ipC(U1, U2, W1, W2), s = cadd(uv, uw), direct = ipC(U1, U2, cadd(V1, W1), cadd(V2, W2));
            P3.poly([[0, 0], uv, s, uw], { color: 'green', width: 1, dash: [3, 4], fill: 'green', fillAlpha: 0.06 });
            P3.arrow(0, 0, uw[0], uw[1], { color: 'teal', width: 2.2 }); P3.arrow(0, 0, uv[0], uv[1], { color: 'orange', width: 2.2 });
            P3.arrow(0, 0, s[0], s[1], { color: 'green', width: 1.4, dash: [4, 3] });
            P3.dot(direct[0], direct[1], { color: 'green', r: 6 });
            lab(P3, '\\langle u, v\\rangle', uv, 'orange'); lab(P3, '\\langle u, w\\rangle', uw, 'teal', 10, 12);
            lab(P3, '\\langle u, v{+}w\\rangle', direct, 'green', direct[0] >= 0 ? 10 : -10, -12);
            res = { uw, s, direct };
          }
          st = { md, uv, L, ...res };
        });
        v.legend([['accent', '$u$'], ['orange', '$v$'], ['teal', '$w$'], ['gold', '$\\lambda$', { dot: true }], ['muted', 'the terms $u_1\\bar v_1$, $u_2\\bar v_2$'], ['green', 'computed directly', { dot: true }], ['red', 'the wrong guess $\\lambda\\langle u,v\\rangle$', { dot: true }]]);
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
        const show = () => {
          const fn = mode.value === 'fn'; layout(v, [[S, !fn], [Fs, fn], [R, true]]); c1.el.hidden = c2.el.hidden = fn;
          R.setTicks(fn ? null : [], null); R.setTitle(fn ? '$f^2$: the shaded area is $\\|f\\|^2$' : 'bars $c_k v_k^2$: the total area is $\\|v\\|_c^2$');
        };
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
            arrowTo(S, 0, 0, V[0], V[1], { color: 'ink', width: 2.6 });
            if (nE > 0.05) {
              S.dot(V[0] / nE, V[1] / nE, { color: 'accent', r: 5 }); S.dot(V[0] / nW, V[1] / nW, { color: 'orange', r: 5 });
              S.tex('v/\\|v\\|_2', V[0] / nE, V[1] / nE, { color: 'accent', size: 13, dx: -8, dy: -12, align: 'right' });
              S.tex('v/\\|v\\|_c', V[0] / nW, V[1] / nW, { color: 'orange', size: 13, dx: 8, dy: 12, align: 'left' });
            }
            // bars of c_k v_k²: widths c_k, heights v_k²
            const h1 = V[0] * V[0], h2 = V[1] * V[1], top = Math.max(1.5, h1, h2) * 1.45;
            const x2 = 0.25 + Math.max(a, 1) + 0.55, xr = x2 + Math.max(b, 1) + 0.3;
            R.setView([0, xr], [-0.09 * top, top]);
            const bar = (x0, wd, ht, k) => {
              R.rect(x0, 0, x0 + 1, ht, { color: 'accent', width: 1.2, dash: [4, 3] });
              R.rect(x0, 0, x0 + wd, ht, { fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 1.6 });
              R.tex(`v_${k}^2 = ${tn(ht)}`, x0 + Math.max(wd, 1) / 2, ht, { color: 'ink', size: 13, dy: -11 });
              R.tex(`c_${k} = ${tn(wd)}`, x0 + wd / 2, 0, { color: 'orange', size: 12, dy: 11 });
            };
            bar(0.25, a, h1, 1); bar(x2, b, h2, 2);
            R.texPx(`\\text{orange area} = ${tn(nW * nW)} = \\|v\\|_c^2`, R.width - 10, 10, { color: 'orange', align: 'right', baseline: 'top', size: 14 });
            R.texPx(`\\text{dashed } (c_k = 1)\\text{: } ${tn(nE * nE)} = \\|v\\|_2^2`, R.width - 10, 34, { color: 'accent', align: 'right', baseline: 'top', size: 14 });
            st = { R2: true, V, nE, nW, a, b };
            v.legend([['accent', 'dot product: unit circle, $\\|\\cdot\\|_2$'], ['orange', 'weighted: unit ellipse, $\\|\\cdot\\|_c$'], ['muted', 'spheres through $v$', { dash: true }]]);
          } else {
            const c = quadThrough(XS, fh.map((h) => h.y)), f = (x) => pval(c, x), f2 = (x) => f(x) * f(x);
            Fs.vline(-1, { color: 'faint', dash: [3, 4] }); Fs.vline(1, { color: 'faint', dash: [3, 4] });
            Fs.fn(f, { domain: [-1, 1], color: 'accent', width: 2.8 });
            const area = integ(f2), top = Math.max(1, ...Array.from({ length: 41 }, (_, i) => f2(-1 + i / 20))) * 1.3;
            R.setView([-1.2, 1.2], [-0.06 * top, top]);
            R.fn(f2, { domain: [-1, 1], color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.22 });
            R.texPx(`\\int_{-1}^1 f^2 = ${tn(area, 3)},\\ \\|f\\| = ${tn(Math.sqrt(area), 3)}`, R.width / 2, 10, { color: 'accent', align: 'center', baseline: 'top', size: 14 });
            st = { R2: false, c, area };
            v.legend([['accent', '$f$ and $f^2$; area $= \\int_{-1}^1 f^2 = \\|f\\|^2$', { area: true }]]);
          }
        });
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
          if (form.value === 'deg') { S.line(-9, -9, 9, 9, { color: 'red', width: 2, alpha: 0.6 }); S.tex('\\|x\\| = 0 \\text{ on this line}', -1.9, -1.9, { color: 'red', size: 14, dx: 12, dy: 4, align: 'left' }); }
          S.path(levelSet(q, 1, 12), { color: 'muted', width: 1.2 });
          if (nv > 1e-6) S.path(levelSet(q, nv * nv, 14), { color: 'accent', width: 1.4, dash: [5, 4] });
          if (nl > 1e-6) S.path(levelSet(q, nl * nl, 14), { color: 'gold', width: 1.4, dash: [5, 4] });
          S.arrow(0, 0, LV[0], LV[1], { color: 'gold', width: 3.2 });
          arrowTo(S, 0, 0, V[0], V[1], { color: 'accent', width: 2 });
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
          st = { nv, nl, l, V, deg: form.value === 'deg' };
        });
        v.legend([['accent', '$v$, level curve through $v$'], ['gold', '$\\lambda v$'], ['accent', '$\\|\\lambda v\\|$ computed'], ['green', '$|\\lambda|\\,\\|v\\|$']]);
        v.readout(() => {
          if (!st) return '';
          const { nv, nl, l, V, deg } = st;
          return `$\\|\\lambda v\\| = ${tn(nl, 3)}$ and $|\\lambda|\\,\\|v\\| = ${tn(Math.abs(l), 2)} \\cdot ${tn(nv, 3)} = ${tn(Math.abs(l) * nv, 3)}$: (b) holds. ` + (nv < 1e-9 && len2(V) > 1e-9 ? 'But $v \\ne 0$ has norm $0$ — (a) fails, because this form is not definite (not an inner product).' : deg ? '(a) fails for this form: every $x$ on the red line has $\\|x\\| = 0$.' : 'And $\\|v\\| > 0$ for every $v \\ne 0$: (a).');
        });
      },
    },
    // ------------------------------------------------------------------ 6.10
    {
      num: '6.10',
      kind: 'Definition',
      name: 'Orthogonal vectors',
      statement: String.raw`Two vectors $u, v$ in an inner product space are **orthogonal** if $\langle u, v\rangle = 0$. The order does not matter, since $\langle u, v\rangle = 0$ exactly when $\langle v, u\rangle = \overline{\langle u, v\rangle} = 0$.`,
      idea: String.raw`In $\mathbf R^2$ with the dot product, $\langle u, v\rangle = \|u\|\,\|v\|\cos\theta$, so for nonzero vectors orthogonal means perpendicular. The definition keeps the algebra and drops the picture, which lets "perpendicular" make sense where no angle can be drawn — for instance between functions, where $\langle f, g\rangle = \int fg$ vanishes when the positive and negative parts of the product $fg$ cancel. Whether two vectors are orthogonal depends on the inner product, not only on the vectors.`,
      caption: String.raw`Functions on an interval with $\langle f, g\rangle = \int fg$. Choose $f$ (blue) and drag the three handles of the quadratic $g$ (orange). Below, the product $fg$: blue area counts positively, red area negatively, and $\langle f, g\rangle$ is the difference. Hunt for orthogonal pairs — the handles snap when the areas cancel exactly. Odd against even is always orthogonal on $[-1, 1]$; switch the interval to $[0, 1]$ and the same pair $1, x$ stops being orthogonal.`,
      deps: ['ladr-6.2'],
      tags: ['orthogonality'],
      viz(v) {
        const FS = { one: [1, 0, 0], x: [0, 1, 0], x2: [0, 0, 1], leg: [-1 / 3, 0, 1] };
        const fsel = v.select('$f =$', [{ value: 'one', label: '$1$' }, { value: 'x', label: '$x$' }, { value: 'x2', label: '$x^2$' }, { value: 'leg', label: '$x^2 - \\frac13$' }], 'one');
        const XS_S = [-0.7, 0, 0.7], XS_H = [0.15, 0.5, 0.85];
        let XS = XS_S, gh = [];
        const iv = v.select('on', [{ value: 's', label: '$[-1, 1]$' }, { value: 'h', label: '$[0, 1]$' }], 's', {
          onChange: (k) => { const gc = quadThrough(XS, gh.map((h) => h.y)); XS = k === 's' ? XS_S : XS_H; gh.forEach((h, i) => h.set(XS[i], pval(gc, XS[i]))); },
        });
        const G = v.stage({ x: [-1.15, 1.15], y: [-1.7, 1.9], height: 250, full: true, title: '$f$ (blue) and $g$ (orange)' });
        const P = v.stage({ x: [-1.15, 1.15], y: [-1.6, 1.6], height: 230, full: true, title: 'the product $fg$ — its signed area is $\\langle f, g\\rangle$' });
        const dom = () => (iv.value === 's' ? [-1, 1] : [0, 1]);
        const ipWith = (ys) => { const c = quadThrough(XS, ys), f = FS[fsel.value]; return ipF((x) => pval(f, x), (x) => pval(c, x), ...dom()); };
        gh = [[0.55], [-0.45], [1.15]].map(([y], k) => G.handle(XS[k], y, {
          color: 'orange', constrain: (_, yy) => {
            yy = Math.max(-1.6, Math.min(1.8, yy));
            const ys = gh.map((h) => h.y); ys[k] = 0; const i0 = ipWith(ys); ys[k] = 1; const slope = ipWith(ys) - i0;
            if (Math.abs(slope) > 1e-9) { const ys0 = -i0 / slope; if (Math.abs(yy - ys0) < 0.06) yy = ys0; }
            return [XS[k], yy];
          },
        }));
        let st = null;
        v.render(() => {
          const [a, b] = dom(), fc = FS[fsel.value], gc = quadThrough(XS, gh.map((h) => h.y));
          const f = (x) => pval(fc, x), g = (x) => pval(gc, x), fg = (x) => f(x) * g(x);
          const m = 0.08 * (b - a), xs = Array.from({ length: 41 }, (_, i) => a + ((b - a) * i) / 40);
          const R = Math.min(5.8, Math.max(1.3, 1.15 * Math.max(...xs.map((x) => Math.max(Math.abs(f(x)), Math.abs(g(x)))))));
          G.setView([a - m, b + m], [-R, R]);
          for (const S of [G, P]) { S.vband(a - 2 * m, a, { color: 'faint', alpha: 0.18 }); S.vband(b, b + 2 * m, { color: 'faint', alpha: 0.18 }); }
          G.fn(f, { color: 'accent', width: 1, alpha: 0.4 }); G.fn(g, { color: 'orange', width: 1, alpha: 0.4 });
          G.fn(f, { domain: [a, b], color: 'accent', width: 2.8 }); G.fn(g, { domain: [a, b], color: 'orange', width: 2.8 });
          const top = Math.max(1, ...Array.from({ length: 41 }, (_, i) => Math.abs(fg(a + ((b - a) * i) / 40)))) * 1.25;
          P.setView([a - m, b + m], [-top, top]);
          P.fn((x) => Math.max(0, fg(x)), { domain: [a, b], fill: 'accent', fillAlpha: 0.3, stroke: false });
          P.fn((x) => Math.min(0, fg(x)), { domain: [a, b], fill: 'red', fillAlpha: 0.3, stroke: false });
          P.fn(fg, { domain: [a, b], color: 'ink', width: 2 });
          const ip = ipF(f, g, a, b), pos = integ((x) => Math.max(0, fg(x)), a, b), neg = integ((x) => Math.max(0, -fg(x)), a, b);
          const nf = Math.sqrt(ipF(f, f, a, b)), ng = Math.sqrt(ipF(g, g, a, b)), orth = Math.abs(ip) < 1e-9;
          const ang = nf > 1e-9 && ng > 1e-9 ? (Math.acos(Math.max(-1, Math.min(1, ip / (nf * ng)))) * 180) / Math.PI : NaN;
          P.corner(`blue area +${pn(pos, 3)}`, 'tr', { color: 'accent', weight: 700, size: 13 });
          P.corner(`red area −${pn(neg, 3)}`, 'br', { color: 'red', weight: 700, size: 13 });
          if (orth) G.corner('⟨f, g⟩ = 0: f and g are orthogonal', 'tl', { color: 'green', weight: 700 });
          else if (isFinite(ang)) G.corner(`angle arccos(⟨f, g⟩ / ‖f‖‖g‖) = ${pn(ang, 1)}°`, 'tl', { color: 'muted', weight: 600 });
          st = { ip, pos, neg, orth, ang, a, b };
        });
        v.legend([['accent', '$f$; area where $fg > 0$', { area: true }], ['orange', '$g$'], ['red', 'area where $fg < 0$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { ip, pos, neg, orth, a } = st;
          return `$\\langle f, g\\rangle = \\int_{${a}}^{1} fg = ${tn(pos, 3)} - ${tn(neg, 3)} = ${tn(ip, 3)}$` + (orth ? ' — **orthogonal**: the blue and red areas cancel.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 6.11
    {
      num: '6.11',
      kind: 'Theorem',
      name: 'Orthogonality and 0',
      statement: String.raw`In an inner product space $V$:
(a) $0$ is orthogonal to every vector in $V$;
(b) $0$ is the only vector in $V$ that is orthogonal to itself.`,
      idea: String.raw`(a) is 6.6(b): $\langle 0, v\rangle = 0$ because $u \mapsto \langle u, v\rangle$ is linear. (b) is definiteness: $\langle v, v\rangle = 0$ forces $v = 0$. Without definiteness (b) fails — for the form $x_1y_1 - x_2y_2$ on $\mathbf R^2$ every vector on the diagonals is "orthogonal to itself".`,
      caption: String.raw`The shading is $\langle x, x\rangle$ (darker = larger; red = negative). Drag $v$: the dashed line is $v^\perp = \{x : \langle x, v\rangle = 0\}$, and the ring of test vectors is coloured by the sign of $\langle x, v\rangle$. Shrink $v$ to the origin (it snaps): every test vector turns green — (a). For an inner product, $\langle x, x\rangle$ vanishes only at the centre, so $v$ never lies on its own line $v^\perp$ — (b). Switch to $x_1y_1 - x_2y_2$ and drag $v$ onto a diagonal: $v \ne 0$ lies on $v^\perp$.`,
      deps: ['ladr-6.6', 'ladr-6.10', 'ladr-6.2'],
      tags: ['orthogonality'],
      viz(v) {
        const FORMS = { dot: [[1, 0], [0, 1]], sk: [[1.4, 0.6], [0.6, 0.8]], mink: [[1, 0], [0, -1]] };
        const form = v.select('', [{ value: 'dot', label: 'dot product' }, { value: 'sk', label: 'skewed inner product' }, { value: 'mink', label: '$x_1y_1 - x_2y_2$ (not definite)' }], 'sk');
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.05, 2.05], equal: true, height: 400, weight: 1.35, minWidth: 320 });
        const G = v.stage({ x: [0, 360], y: [-1.3, 2.3], height: 400, minWidth: 250, xlabel: 'θ°', xticks: [0, 90, 180, 270, 360], title: '$\\langle x, x\\rangle$ for $x = (\\cos\\theta, \\sin\\theta)$' });
        const vh = S.handle(1.1, 0.7, {
          color: 'gold', label: 'v', constrain: (x, y) => {
            if (Math.hypot(x, y) < 0.16) return [0, 0];
            if (form.value === 'mink' && Math.abs(Math.abs(x) - Math.abs(y)) < 0.1) { const r = (Math.abs(x) + Math.abs(y)) / 2; return [Math.sign(x) * r, Math.sign(y) * r]; }
            return [x, y];
          },
        });
        const ring = Array.from({ length: 28 }, (_, i) => [1.75 * Math.cos((TAU * i) / 28 + 0.05), 1.75 * Math.sin((TAU * i) / 28 + 0.05)]);
        let st = null;
        v.render(() => {
          const A = FORMS[form.value], ip = formA(A), q = (x) => ip(x, x), V = [vh.x, vh.y];
          const pos = v.rgb('accent'), neg = v.rgb('red'), bg = v.rgb('panel');
          S.raster((x, y) => {
            const s = q([x, y]), t = Math.min(1, Math.abs(s) / 9) ** 0.8, c = s >= 0 ? pos : neg;
            return [0, 1, 2].map((i) => Math.round(bg[i] + (c[i] - bg[i]) * 0.42 * t)).concat(255);
          }, { key: form.value + v.color('panel'), res: 3 });
          for (const lev of [0.25, 1, 2.25, 4]) S.path(levelSet(q, lev, 6), { color: 'accent', width: 0.8, alpha: 0.35 });
          if (form.value === 'mink') { for (const lev of [-0.25, -1, -2.25]) S.path(levelSet(q, lev, 6), { color: 'red', width: 0.8, alpha: 0.35 }); S.line(-3, -3, 3, 3, { color: 'red', width: 1.6, alpha: 0.7 }); S.line(-3, 3, 3, -3, { color: 'red', width: 1.6, alpha: 0.7 }); }
          S.axes();
          const zero = V[0] === 0 && V[1] === 0;
          if (!zero) { const n = [A[0][0] * V[0] + A[1][0] * V[1], A[0][1] * V[0] + A[1][1] * V[1]], L = 9 / len2(n); S.line(-n[1] * L, n[0] * L, n[1] * L, -n[0] * L, { color: 'green', width: 2, dash: [8, 5] }); }
          const vals = ring.map((x) => ip(x, V)), big = Math.max(1e-9, ...vals.map(Math.abs));
          ring.forEach((x, i) => {
            const s = vals[i];
            if (Math.abs(s) < 1e-9) S.dot(x[0], x[1], { color: 'green', r: 5.5 });
            else S.dot(x[0], x[1], { color: s > 0 ? 'accent' : 'orange', r: 3 + 2.5 * Math.abs(s) / big });
          });
          const self = q(V);
          if (zero) S.corner('v = 0: ⟨x, 0⟩ = 0 for every x — (a)', 'tl', { color: 'green', weight: 700 });
          else if (Math.abs(self) < 1e-9) S.corner('v ≠ 0 yet ⟨v, v⟩ = 0: v lies on its own v⊥', 'tl', { color: 'red', weight: 700 });
          else S.corner(`⟨v, v⟩ = ${pn(self, 3)} ≠ 0: v is not on v⊥`, 'tl', { color: 'ink', weight: 600 });
          if (!zero) arrowTo(S, 0, 0, V[0], V[1], { color: 'gold', width: 2.8 });
          if (!zero) { const n = [A[0][0] * V[0] + A[1][0] * V[1], A[0][1] * V[0] + A[1][1] * V[1]], L = len2(n), d = n[1] > 0 ? [n[1] / L, -n[0] / L] : [-n[1] / L, n[0] / L]; S.tex('v^\\perp', 1.55 * d[0], 1.55 * d[1], { color: 'green', size: 16, dx: 14 }); }
          // ⟨x, x⟩ around the unit circle
          const qs = []; let qmin = Infinity, qmax = -Infinity;
          for (let k = 0; k <= 360; k += 2) { const t = (k * Math.PI) / 180, val = q([Math.cos(t), Math.sin(t)]); qs.push([k, val]); qmin = Math.min(qmin, val); qmax = Math.max(qmax, val); }
          G.setView([0, 360], [Math.min(-0.3, qmin * 1.2), qmax * 1.25]);
          G.hline(0, { color: 'ink', width: 1.2 });
          G.fn((k) => Math.max(0, q([Math.cos((k * Math.PI) / 180), Math.sin((k * Math.PI) / 180)])), { fill: 'accent', fillAlpha: 0.15, stroke: false });
          G.fn((k) => Math.min(0, q([Math.cos((k * Math.PI) / 180), Math.sin((k * Math.PI) / 180)])), { fill: 'red', fillAlpha: 0.2, stroke: false });
          G.path(qs, { color: 'accent', width: 2.2 });
          if (!zero) { let k = (Math.atan2(V[1], V[0]) * 180) / Math.PI; if (k < 0) k += 360; const qv = q([Math.cos((k * Math.PI) / 180), Math.sin((k * Math.PI) / 180)]); G.vline(k, { color: 'gold', width: 1, dash: [3, 4] }); G.dot(k, qv, { color: Math.abs(qv) < 1e-9 ? 'red' : 'gold', r: 6 }); }
          G.corner(qmin > 1e-9 ? `minimum ${pn(qmin)} > 0: never 0` : 'touches 0: not definite', 'tl', { color: qmin > 1e-9 ? 'green' : 'red', weight: 700 });
          st = { V, self, zero, mink: form.value === 'mink' };
        });
        v.legend([['gold', '$v$'], ['green', '$v^\\perp$; test vectors with $\\langle x, v\\rangle = 0$', { dash: true }], ['accent', '$\\langle x, v\\rangle > 0$', { dot: true }], ['orange', '$\\langle x, v\\rangle < 0$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { V, self, zero, mink } = st;
          if (zero) return 'With $v = 0$: $\\langle x, 0\\rangle = 0$ for every test vector $x$, so $0$ is orthogonal to everything.';
          if (Math.abs(self) < 1e-9) return `$v = ${vt(V)} \\ne 0$ but $\\langle v, v\\rangle = 0$ — possible only because $x_1y_1 - x_2y_2$ is not definite.`;
          return `$\\langle v, v\\rangle = |v|^2\\,\\langle x, x\\rangle_{x = v/|v|} = ${tn(self, 3)} \\ne 0$: $v$ is not orthogonal to itself` + (mink ? (self < 0 ? ' (even negative: this form is not an inner product).' : ' — but drag it onto a diagonal: this form is not definite.') : '; the right graph never reaches $0$, so for an inner product only $v = 0$ is.');
        });
      },
    },
    // ------------------------------------------------------------------ 6.12
    {
      num: '6.12',
      kind: 'Theorem',
      name: 'Pythagorean theorem',
      statement: String.raw`Suppose $u, v$ are vectors in an inner product space. If $u$ and $v$ are orthogonal, then
$$\|u + v\|^2 = \|u\|^2 + \|v\|^2.$$`,
      idea: String.raw`Expand using additivity in both slots (6.6): $\|u + v\|^2 = \langle u + v, u + v\rangle = \|u\|^2 + \langle u, v\rangle + \langle v, u\rangle + \|v\|^2$. Orthogonality kills the two middle terms. In general the middle terms add up to $2\operatorname{Re}\langle u, v\rangle$, which is exactly the error in "Pythagoras" when the angle is not right.`,
      caption: String.raw`Drag the corner $u$ and the tip $u + v$. Squares are built on the legs $u$ (blue), $v$ (orange) and on $u + v$. When the corner is a right angle (it snaps), the two leg squares exactly fill the hypotenuse square — compare the bars on the right. Bend the angle and the bars disagree by $2\langle u, v\rangle$, shown in red.`,
      deps: ['ladr-6.10', 'ladr-6.7', 'ladr-6.6'],
      tags: ['orthogonality', 'norms'],
      credit: 'Babylonian tablets, c. 1800 BCE; Pythagorean school, c. 500 BCE',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pythagorean_theorem' },
      viz(v) {
        const S = v.stage({ x: [-3.3, 3.9], y: [-2.6, 3.4], equal: true, height: 420, weight: 1.45, minWidth: 330 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 420, minWidth: 220, title: 'areas' });
        const uh = S.handle(1.6, 0.35, { color: 'accent', label: 'u' });
        const bh = S.handle(1.145, 2.43, {
          color: 'orange', label: 'u+v', constrain: (x, y) => {
            const u = [uh.x, uh.y], d = [x - u[0], y - u[1]], lu = len2(u), ld = len2(d);
            if (lu > 0.2 && ld > 0.2 && Math.abs(dot2(u, d)) / (lu * ld) < 0.07) { const n = [-u[1] / lu, u[0] / lu], t = dot2(d, n); return [u[0] + t * n[0], u[1] + t * n[1]]; }
            return [x, y];
          },
        });
        const square = (P, Q, third, col, alpha) => {
          const d = [Q[0] - P[0], Q[1] - P[1]]; let n = [-d[1], d[0]];
          const m = [(P[0] + Q[0]) / 2 - third[0], (P[1] + Q[1]) / 2 - third[1]]; if (dot2(n, m) < 0) n = [-n[0], -n[1]];
          S.poly([P, Q, [Q[0] + n[0], Q[1] + n[1]], [P[0] + n[0], P[1] + n[1]]], { fill: col, fillAlpha: alpha, color: col, width: 1.4 });
          return [(P[0] + Q[0] + n[0]) / 2, (P[1] + Q[1] + n[1]) / 2];
        };
        let st = null;
        v.render(() => {
          const O = [0, 0], U = [uh.x, uh.y], B = [bh.x, bh.y], V = [B[0] - U[0], B[1] - U[1]];
          const nu2 = dot2(U, U), nv2 = dot2(V, V), ns2 = dot2(B, B), ip = dot2(U, V), right = Math.abs(ip) < 1e-9;
          const cU = square(O, U, B, 'accent', 0.16), cV = square(U, B, O, 'orange', 0.16), cS = square(O, B, U, right ? 'green' : 'red', 0.1);
          S.poly([O, U, B], { color: 'ink', width: 1, fill: 'ink', fillAlpha: 0.05 });
          if (right) rightMark(S, U, [-U[0], -U[1]], V, 0.22, { color: 'green', width: 2 });
          arrowTo(S, 0, 0, U[0], U[1], { color: 'accent', width: 2.6 });
          arrowTo(S, U[0], U[1], B[0], B[1], { color: 'orange', width: 2.6 });
          arrowTo(S, 0, 0, B[0], B[1], { color: right ? 'green' : 'red', width: 2.2 });
          S.tex(`${tn(nu2)}`, cU[0], cU[1], { color: 'accent', size: 15 }); S.tex(`${tn(nv2)}`, cV[0], cV[1], { color: 'orange', size: 15 }); S.tex(`${tn(ns2)}`, cS[0], cS[1], { color: right ? 'green' : 'red', size: 15 });
          // bars
          const mx = Math.max(nu2 + nv2, ns2) * 1.08, X = (t) => 0.08 + (0.84 * t) / mx, y1 = 0.62, y2 = 0.32, hh = 0.09;
          R.rect(X(0), y1, X(nu2), y1 + hh, { fill: 'accent', fillAlpha: 0.45, color: 'accent', width: 1.2 });
          R.rect(X(nu2), y1, X(nu2 + nv2), y1 + hh, { fill: 'orange', fillAlpha: 0.45, color: 'orange', width: 1.2 });
          R.rect(X(0), y2, X(ns2), y2 + hh, { fill: right ? 'green' : 'red', fillAlpha: 0.35, color: right ? 'green' : 'red', width: 1.2 });
          if (!right) { const a = Math.min(nu2 + nv2, ns2), b = Math.max(nu2 + nv2, ns2); R.rect(X(a), y2 - 0.035, X(b), y1 + hh + 0.035, { fill: 'red', fillAlpha: 0.12, stroke: false }); R.tex(`\\text{gap } |2\\langle u,v\\rangle| = ${tn(Math.abs(2 * ip))}`, 0.08, y2 - 0.09, { color: 'red', size: 14, align: 'left' }); }
          R.tex('\\|u\\|^2 + \\|v\\|^2', 0.08, y1 + hh + 0.06, { align: 'left', size: 14 });
          R.tex('\\|u + v\\|^2', 0.08, y2 + hh + 0.06, { align: 'left', size: 14 });
          R.corner(right ? 'u ⊥ v: equal' : 'not a right angle', 'tl', { color: right ? 'green' : 'red', weight: 700 });
          st = { nu2, nv2, ns2, ip, right };
        });
        v.legend([['accent', 'square on $u$'], ['orange', 'square on $v$'], ['green', 'square on $u+v$ (right angle)', { area: true }], ['red', 'not a right angle', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { nu2, nv2, ns2, ip, right } = st;
          return `$\\|u + v\\|^2 = ${tn(ns2, 3)}$, $\\|u\\|^2 + \\|v\\|^2 = ${tn(nu2, 3)} + ${tn(nv2, 3)} = ${tn(nu2 + nv2, 3)}$, difference $2\\langle u, v\\rangle = ${tn(2 * ip, 3)}$` + (right ? ' — orthogonal, so Pythagoras holds exactly.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 6.13
    {
      num: '6.13',
      kind: 'Theorem',
      name: 'An orthogonal decomposition',
      statement: String.raw`Suppose $u, v \in V$ with $v \ne 0$. Put
$$c = \frac{\langle u, v\rangle}{\|v\|^2}, \qquad w = u - \frac{\langle u, v\rangle}{\|v\|^2}\,v.$$
Then $u = cv + w$ and $\langle w, v\rangle = 0$: $u$ is a multiple of $v$ plus a vector orthogonal to $v$.`,
      idea: String.raw`Write $u = cv + (u - cv)$ for an unknown scalar $c$ and ask for $u - cv$ to be orthogonal to $v$. Since $\langle u - cv, v\rangle = \langle u, v\rangle - c\|v\|^2$ is an affine function of $c$ with nonzero slope $-\|v\|^2$, it vanishes for exactly one $c$, namely $\langle u, v\rangle / \|v\|^2$. Geometrically $cv$ is the shadow of $u$ on the line through $v$; this decomposition drives Cauchy–Schwarz (6.14).`,
      caption: String.raw`Drag $u$, $v$, and the gold point $cv$ along the line through $v$. The purple remainder $w = u - cv$ is perpendicular to $v$ only at one position (it snaps there). On the right, $c \mapsto \langle u - cv, v\rangle$ is a straight line crossing $0$ exactly at $c = \langle u, v\rangle/\|v\|^2$ — and the grey curve $\|u - cv\|$ bottoms out at the same $c$.`,
      deps: ['ladr-6.10', 'ladr-6.7', 'ladr-6.6'],
      tags: ['orthogonality'],
      viz(v) {
        const S = v.stage({ x: [-2.7, 2.7], y: [-2.1, 2.3], equal: true, height: 380, weight: 1.3, minWidth: 300 });
        const G = v.stage({ x: [-1, 2], y: [-2, 2], height: 380, minWidth: 260, xlabel: 'c', title: 'functions of $c$' });
        const uh = S.handle(0.7, 1.7, { color: 'accent', label: 'u' });
        const vh = S.handle(1.6, 0.55, { color: 'orange', label: 'v', constrain: (x, y) => (Math.hypot(x, y) < 0.3 ? [0.3 * Math.cos(Math.atan2(y, x)), 0.3 * Math.sin(Math.atan2(y, x))] : [x, y]) });
        let c = 0.5;
        const ph = S.handle(0, 0, {
          color: 'gold', r: 6, constrain: (x, y) => {
            const V = [vh.x, vh.y], n2 = dot2(V, V), cs = dot2([uh.x, uh.y], V) / n2;
            c = (x * V[0] + y * V[1]) / n2; if (Math.abs(c - cs) * Math.sqrt(n2) < 0.08) c = cs;
            return [c * V[0], c * V[1]];
          },
        });
        let st = null;
        v.render(() => {
          const U = [uh.x, uh.y], V = [vh.x, vh.y], n2 = dot2(V, V), nv = Math.sqrt(n2), cs = dot2(U, V) / n2;
          ph.x = c * V[0]; ph.y = c * V[1];
          const P = [ph.x, ph.y], W = [U[0] - P[0], U[1] - P[1]], wv = dot2(W, V), perp = Math.abs(c - cs) < 1e-12;
          S.line(-9 * V[0] / nv, -9 * V[1] / nv, 9 * V[0] / nv, 9 * V[1] / nv, { color: 'orange', width: 1, alpha: 0.4 });
          if (!perp) { S.line(U[0], U[1], cs * V[0], cs * V[1], { color: 'green', width: 1.2, dash: [3, 4] }); S.dot(cs * V[0], cs * V[1], { color: 'green', r: 3.5 }); }
          if (perp && len2(W) > 0.15) rightMark(S, P, W, len2(P) > 1e-6 ? [-P[0], -P[1]] : V, 0.2, { color: 'green', width: 2 });
          if (len2(P) > 0.05) S.arrow(0, 0, P[0], P[1], { color: 'gold', width: 3.4, alpha: 0.85 });
          arrowTo(S, 0, 0, V[0], V[1], { color: 'orange', width: 2.4 });
          arrowTo(S, P[0], P[1], U[0], U[1], { color: perp ? 'purple' : 'red', width: 2.4 });
          arrowTo(S, 0, 0, U[0], U[1], { color: 'accent', width: 2.6 });
          S.tex('cv', P[0] / 2, P[1] / 2, { color: 'gold', size: 15, dx: V[1] > 0 ? 10 : -10, dy: 12 });
          if (len2(W) > 0.3) S.tex('w', (P[0] + U[0]) / 2, (P[1] + U[1]) / 2, { color: perp ? 'purple' : 'red', size: 15, dx: 12 });
          // graphs
          const lo = Math.min(c, cs) - 1.3, hi = Math.max(c, cs) + 1.3, phi = (t) => dot2(U, V) - t * n2, nrm = (t) => Math.hypot(U[0] - t * V[0], U[1] - t * V[1]);
          const ys = [phi(lo), phi(hi), nrm(lo), nrm(hi)], yt = Math.max(1, ...ys.map(Math.abs)) * 1.1;
          G.setView([lo, hi], [-yt, yt]);
          G.fn(nrm, { color: 'muted', width: 2 });
          G.fn(phi, { color: 'purple', width: 2.4 });
          G.vline(cs, { color: 'green', width: 1.2, dash: [4, 4] });
          G.dot(cs, 0, { color: 'green', r: 5 }); G.dot(cs, nrm(cs), { color: 'green', r: 4 });
          G.vline(c, { color: 'gold', width: 1, alpha: 0.7 });
          G.dot(c, phi(c), { color: perp ? 'green' : 'gold', r: 6 }); G.dot(c, nrm(c), { color: 'gold', r: 4.5 });
          G.tex('\\langle u - cv, v\\rangle', lo + 0.1, phi(lo + 0.1), { color: 'purple', size: 14, align: 'left', dx: 6, dy: phi(lo) > 0 ? 16 : -16 });
          G.tex('\\|u - cv\\|', hi - 0.1, nrm(hi - 0.1), { color: 'muted', size: 14, align: 'right', dy: -14 });
          st = { c, cs, wv, perp, nv };
        });
        v.legend([['accent', '$u$'], ['orange', '$v$'], ['gold', '$cv$'], ['purple', '$w = u - cv$, when $\\perp v$'], ['red', '$u - cv$, not $\\perp v$']]);
        v.readout(() => {
          if (!st) return '';
          const { c, cs, wv, perp } = st;
          return `$\\dfrac{\\langle u, v\\rangle}{\\|v\\|^2} = ${tn(cs, 3)}$; your $c = ${tn(c, 3)}$ gives $\\langle u - cv, v\\rangle = ${tn(wv, 3)}$` + (perp ? ' — **orthogonal**: $u = cv + w$ with $w \\perp v$.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 6.14
    {
      num: '6.14',
      kind: 'Theorem',
      name: 'Cauchy–Schwarz inequality',
      statement: String.raw`For all $u, v$ in an inner product space,
$$|\langle u, v\rangle| \le \|u\|\,\|v\|,$$
with equality if and only if one of $u, v$ is a scalar multiple of the other. For example (6.16), $(x_1y_1 + \cdots + x_ny_n)^2 \le (x_1^2 + \cdots + x_n^2)(y_1^2 + \cdots + y_n^2)$ for real numbers, and $\big|\int_{-1}^1 fg\big|^2 \le \int_{-1}^1 f^2 \int_{-1}^1 g^2$ for continuous real $f, g$.`,
      idea: String.raw`If $v = 0$ both sides vanish. Otherwise split $u = cv + w$ with $w \perp v$ (6.13). Pythagoras (6.12) and $\|cv\| = |c|\,\|v\|$ (6.9) give $\|u\|^2 = |\langle u, v\rangle|^2 / \|v\|^2 + \|w\|^2 \ge |\langle u, v\rangle|^2/\|v\|^2$. Multiplied out: $\|u\|^2\|v\|^2 = |\langle u, v\rangle|^2 + (\|v\|\,\|w\|)^2$ — a right triangle whose hypotenuse is $\|u\|\,\|v\|$ and whose legs are $|\langle u, v\rangle|$ and $\|v\|\,\|w\|$, the area of the parallelogram spanned by $u$ and $v$. Equality means that leg vanishes: $w = 0$, i.e. $u$ is a multiple of $v$.`,
      caption: String.raw`Drag $u$ and $v$ in $\mathbf R^3$ (drag the background to rotate). The purple parallelogram they span has area $\|v\|\,\|w\|$, where $w$ is the part of $u$ perpendicular to $v$. The right panel is the identity behind the proof: a right triangle with legs $|\langle u, v\rangle|$ (green) and the parallelogram's area (purple), and hypotenuse $\|u\|\,\|v\|$ (blue). A leg never exceeds the hypotenuse. Hunt for equality: squeeze the parallelogram flat by lining $u$ up with $v$ (it snaps), and the triangle collapses onto its green leg.`,
      deps: ['ladr-6.13', 'ladr-6.12', 'ladr-6.9'],
      see: ['rca-4.2', 'pma-1.35'],
      tags: ['inequalities'],
      credit: 'Cauchy, 1821; Bunyakovsky, 1859; Schwarz, 1888',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cauchy%E2%80%93Schwarz_inequality' },
      viz(v) {
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.9, 2.1], equal: true, axes: false, height: 410, weight: 1.35, minWidth: 320 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 410, minWidth: 250, title: '$\\|u\\|^2\\|v\\|^2 = |\\langle u,v\\rangle|^2 + (\\|v\\|\\|w\\|)^2$' });
        const sc = v.scene3(S, { yaw: -0.65, pitch: 0.33, axis: 1.5, lim: 1.5 });
        const vh = sc.handle([1.1, 0.2, -0.25], { color: 'orange', label: 'v' });
        const uh = sc.handle([0.6, 0.4, 1.0], {
          color: 'accent', label: 'u', snap: (p) => {
            const V = vh.p, L = len3(p), lv = len3(V); if (L < 0.15 || lv < 0.15) return p;
            const cs = dot3(p, V) / (L * lv); if (Math.abs(cs) > 0.985) return mul3(V, (Math.sign(cs) * L) / lv);
            return p;
          },
        });
        let st = null;
        v.render(() => {
          const U = uh.p, V = vh.p, nv = len3(V), nu = len3(U), ip = dot3(U, V);
          const c = nv > 1e-9 ? ip / (nv * nv) : 0, P = mul3(V, c), W = sub3(U, P), nw = len3(W), area = nv * nw;
          sc.begin();
          sc.poly([ZERO, U, add3(U, V), V], { fill: 'purple', fillAlpha: 0.16, color: 'purple', width: 1 });
          if (nv > 1e-6) sc.line(mul3(V, -1.6 / nv), mul3(V, 1.6 / nv), { color: 'orange', width: 1, alpha: 0.35 }, 12);
          if (nw > 0.03) { sc.line(P, U, { color: 'purple', width: 1.8, dash: [5, 4] }); if (nw > 0.2 && len3(P) > 0.15) rightMark3(sc, P, W, mul3(P, -1), 0.13, { color: 'purple' }); }
          if (len3(P) > 0.04) sc.arrow(ZERO, P, { color: 'gold', width: 3, head: 9 });
          sc.arrow(ZERO, V, { color: 'orange', width: 2.6 });
          sc.arrow(ZERO, U, { color: 'accent', width: 2.6 });
          if (nw > 0.25) sc.tex('w', add3(P, mul3(W, 0.5)), { color: 'purple', size: 15, dx: 10 });
          sc.flush();
          if (nw < 1e-9) S.corner('u is a multiple of v: equality', 'tl', { color: 'green', weight: 700 });
          // the right triangle
          const a = Math.abs(ip), b = area, h = nu * nv, k = 0.74 / Math.max(h, 1e-6), x0 = 0.13, y0 = 0.14;
          R.poly([[x0, y0], [x0 + k * a, y0], [x0 + k * a, y0 + k * b]], { fill: 'accent', fillAlpha: 0.07, stroke: false });
          R.curve((t) => [x0 + k * h * Math.cos(t), y0 + k * h * Math.sin(t)], 0, Math.atan2(b, a), { color: 'faint', width: 1.2, dash: [3, 4], n: 60 });
          R.dot(x0 + k * h, y0, { color: 'accent', r: 3.5 });
          R.line(x0, y0, x0 + k * a, y0, { color: 'green', width: 4 });
          R.line(x0 + k * a, y0, x0 + k * a, y0 + k * b, { color: 'purple', width: 4 });
          R.line(x0, y0, x0 + k * a, y0 + k * b, { color: 'accent', width: 3 });
          if (b > 0.02 * h && a > 0.02 * h) R.path([[x0 + k * a - 0.03, y0], [x0 + k * a - 0.03, y0 + 0.03], [x0 + k * a, y0 + 0.03]], { color: 'muted', width: 1.2 });
          R.tex(`|\\langle u,v\\rangle| = ${tn(a)}`, x0 + (k * a) / 2, y0, { color: 'green', size: 14, dy: 16 });
          if (b > 0.05 * h) R.tex(`\\|v\\|\\|w\\| = ${tn(b)}`, x0 + k * a, y0 + (k * b) / 2, { color: 'purple', size: 14, align: a < 0.55 * h ? 'left' : 'right', dx: a < 0.55 * h ? 8 : -8 });
          R.texPx(`\\text{hypotenuse } \\|u\\|\\,\\|v\\| = ${tn(h)}`, 12, 12, { color: 'accent', size: 14, align: 'left', baseline: 'top' });

          st = { a, b, h, nw };
        });
        v.legend([['accent', '$u$; hypotenuse $\\|u\\|\\|v\\|$'], ['orange', '$v$'], ['gold', 'projection $cv$'], ['purple', 'parallelogram, area $\\|v\\|\\|w\\|$', { area: true }], ['green', '$|\\langle u, v\\rangle|$']]);
        v.readout(() => {
          if (!st) return '';
          const { a, b, h, nw } = st;
          return `$|\\langle u, v\\rangle| = ${tn(a, 3)} \\le ${tn(h, 3)} = \\|u\\|\\,\\|v\\|$; the squared gap $\\|u\\|^2\\|v\\|^2 - |\\langle u,v\\rangle|^2 = ${tn(h * h - a * a, 3)} = (\\text{area})^2 = ${tn(b * b, 3)}$.` + (nw < 1e-9 ? ' **Equality** — $u$ is a scalar multiple of $v$.' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 6.17
    {
      num: '6.17',
      kind: 'Theorem',
      name: 'Triangle inequality',
      statement: String.raw`For all $u, v$ in an inner product space,
$$\|u + v\| \le \|u\| + \|v\|,$$
with equality if and only if one of $u, v$ is a nonnegative real multiple of the other.`,
      idea: String.raw`Expand the square: $\|u + v\|^2 = \|u\|^2 + \|v\|^2 + 2\operatorname{Re}\langle u, v\rangle$. Two estimates follow: $\operatorname{Re}\langle u, v\rangle \le |\langle u, v\rangle|$ (6.18, from 4.4) and $|\langle u, v\rangle| \le \|u\|\,\|v\|$ (6.19, Cauchy–Schwarz). Together they give $\|u + v\|^2 \le (\|u\| + \|v\|)^2$. Equality needs both to be tight: Cauchy–Schwarz forces $u, v$ to be parallel, and the first step forces $\langle u, v\rangle$ to be real and nonnegative, so they point the same way.`,
      caption: String.raw`Drag the corner $u$ and the end point $u + v$. The bent path $u$ then $v$ is never shorter than the green shortcut. The dashed ellipse holds every corner giving a bent path of the same length — it always encloses the shortcut, and flattens onto it only at equality. On the right, the columns $\|u + v\| \le \sqrt{\|u\|^2 + \|v\|^2 + 2|\langle u, v\rangle|} \le \|u\| + \|v\|$ show the two steps of the proof. Hunt for equality: line $v$ up with $u$ (it snaps). Pointing $v$ backwards closes the Cauchy–Schwarz gap 6.19 but opens 6.18.`,
      deps: ['ladr-6.14', 'ladr-4.4'],
      see: ['rca-4.3'],
      tags: ['inequalities', 'norms'],
      viz(v) {
        const S = v.stage({ x: [-1.7, 3.1], y: [-1.5, 2.6], equal: true, height: 390, weight: 1.35, minWidth: 320 });
        const R = v.stage({ x: [0, 1], y: [0, 1], height: 390, minWidth: 250, axes: false, title: 'the proof, as lengths' });
        const uh = S.handle(1.5, 0.5, { color: 'accent', label: 'u' });
        const bh = S.handle(0.5, 1.7, {
          color: 'orange', label: 'u+v', constrain: (x, y) => {
            const U = [uh.x, uh.y], d = [x - U[0], y - U[1]], lu = len2(U), ld = len2(d);
            if (lu > 0.2 && ld > 0.2 && Math.abs(U[0] * d[1] - U[1] * d[0]) / (lu * ld) < 0.06) { const t = dot2(d, U) / lu; return [U[0] + (t * U[0]) / lu, U[1] + (t * U[1]) / lu]; }
            return [x, y];
          },
        });
        let st = null;
        v.render(() => {
          const U = [uh.x, uh.y], B = [bh.x, bh.y], V = [B[0] - U[0], B[1] - U[1]];
          const nu = len2(U), nv = len2(V), ns = len2(B), ip = dot2(U, V), mid = Math.sqrt(Math.max(0, nu * nu + nv * nv + 2 * Math.abs(ip))), L = nu + nv, eq = L - ns < 1e-9;
          // ellipse of corners with the same path length
          const a = L / 2, f = ns / 2, bmin = Math.sqrt(Math.max(0, a * a - f * f)), C = [B[0] / 2, B[1] / 2], e = ns > 1e-9 ? [B[0] / ns, B[1] / ns] : [1, 0];
          S.curve((t) => [C[0] + a * Math.cos(t) * e[0] - bmin * Math.sin(t) * e[1], C[1] + a * Math.cos(t) * e[1] + bmin * Math.sin(t) * e[0]], 0, TAU, { color: 'muted', width: 1.2, dash: [5, 5], n: 200 });
          S.dot(0, 0, { color: 'ink', r: 3.5 });
          S.arrow(0, 0, B[0], B[1], { color: 'green', width: 3 });
          arrowTo(S, 0, 0, U[0], U[1], { color: 'accent', width: 2.6 });
          arrowTo(S, U[0], U[1], B[0], B[1], { color: 'orange', width: 2.6 });
          S.corner(eq ? 'equality: v is a nonnegative multiple of u' : `bent path longer by ${pn(L - ns, 3)}`, 'tl', { color: eq ? 'green' : 'muted', weight: 700 });
          // three columns: ‖u + v‖ ≤ √(‖u‖² + ‖v‖² + 2|⟨u, v⟩|) ≤ ‖u‖ + ‖v‖
          const k = 0.78 / Math.max(L, 1e-6), y0 = 0.13, Y = (t) => y0 + k * t, wd = 0.15;
          for (const [t, col] of [[ns, 'green'], [mid, 'purple'], [L, 'ink']]) R.line(0.06, Y(t), 0.8, Y(t), { color: col, width: 1, dash: [3, 3], alpha: 0.7 });
          R.rect(0.12, y0, 0.12 + wd, Y(ns), { fill: 'green', fillAlpha: 0.35, color: 'green', width: 1.4 });
          R.rect(0.38, y0, 0.38 + wd, Y(mid), { fill: 'purple', fillAlpha: 0.25, color: 'purple', width: 1.4 });
          R.rect(0.64, y0, 0.64 + wd, Y(nu), { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1.4 });
          R.rect(0.64, Y(nu), 0.64 + wd, Y(L), { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1.4 });
          R.tex('\\|u{+}v\\|', 0.12 + wd / 2, y0, { color: 'green', size: 13, dy: 13 });
          R.tex('\\sqrt{\\cdots}', 0.38 + wd / 2, y0, { color: 'purple', size: 13, dy: 14 });
          R.tex('\\|u\\|{+}\\|v\\|', 0.64 + wd / 2, y0, { color: 'ink', size: 13, dy: 13 });
          const gap = (t0, t1, lbl, col) => { if (t1 - t0 > 0.02 * L) { R.arrow(0.86, Y(t0), 0.86, Y(t1), { color: col, width: 2, head: 7, both: true }); R.text(lbl, 0.885, (Y(t0) + Y(t1)) / 2, { color: col, size: 12, weight: 700 }); } };
          gap(ns, mid, '6.18', 'purple'); gap(mid, L, '6.19', 'red');
          if (eq) R.corner('both gaps closed', 'tl', { color: 'green', weight: 700 });
          st = { nu, nv, ns, L, mid, ip, eq };
        });
        v.legend([['accent', '$u$'], ['orange', '$v$'], ['green', '$u + v$'], ['muted', 'corners with the same path length', { dash: true }], ['purple', '6.18: $\\operatorname{Re}\\langle u,v\\rangle \\le |\\langle u,v\\rangle|$'], ['red', '6.19: Cauchy–Schwarz']]);
        v.readout(() => {
          if (!st) return '';
          const { nu, nv, ns, L, mid, ip } = st;
          return `$\\|u + v\\| = ${tn(ns, 3)} \\le ${tn(mid, 3)} \\le ${tn(L, 3)} = ${tn(nu, 3)} + ${tn(nv, 3)} = \\|u\\| + \\|v\\|$ (middle: $\\sqrt{\\|u\\|^2 + \\|v\\|^2 + 2|\\langle u,v\\rangle|}$, with $\\langle u, v\\rangle = ${tn(ip, 3)}$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.21
    {
      num: '6.21',
      kind: 'Theorem',
      name: 'Parallelogram equality',
      statement: String.raw`For all $u, v$ in an inner product space,
$$\|u + v\|^2 + \|u - v\|^2 = 2\big(\|u\|^2 + \|v\|^2\big):$$
the squared diagonals of a parallelogram add up to the sum of the squares of its four sides.`,
      idea: String.raw`Expand both squares as inner products: $\|u \pm v\|^2 = \|u\|^2 + \|v\|^2 \pm \big(\langle u, v\rangle + \langle v, u\rangle\big)$. Adding them cancels the cross terms. The identity is a fingerprint of norms that come from inner products: a norm such as $\|x\|_1 = |x_1| + |x_2|$ or $\|x\|_\infty = \max(|x_1|, |x_2|)$ violates it, and (Jordan–von Neumann) any norm satisfying it comes from an inner product.`,
      caption: String.raw`Drag $u$ and $v$ and turn the whole parallelogram with the slider. With a norm that comes from an inner product, the ratio $\big(\|u+v\|^2 + \|u-v\|^2\big) / \big(2\|u\|^2 + 2\|v\|^2\big)$ is exactly $1$ for every position — its graph on the right is flat. Choose the $\ell^p$ norm: the unit ball (grey) stops being an ellipse and the ratio wobbles as you rotate, except at $p = 2$.`,
      deps: ['ladr-6.7', 'ladr-6.6'],
      tags: ['norms'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Parallelogram_law' },
      viz(v) {
        const A = [[1.5, 0.7], [0.7, 0.9]];
        const nsel = v.select('norm', [{ value: 'dot', label: 'dot product' }, { value: 'sk', label: 'skewed inner product' }, { value: 'lp', label: '$\\ell^p$' }], 'lp', { onChange: () => { pS.el.hidden = nsel.value !== 'lp'; } });
        const pS = v.slider('$p$', 1, 6, 1, { step: 0.05 });
        const th = v.slider('rotate $\\theta$', 0, 360, 0, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.2, 2.2], equal: true, height: 370, weight: 1.25, minWidth: 300 });
        const G = v.stage({ x: [0, 360], y: [0.6, 1.4], height: 370, minWidth: 260, xlabel: 'θ°', xticks: [0, 90, 180, 270, 360], title: 'ratio of the two sides, as the picture turns' });
        const rot = (p, t) => [p[0] * Math.cos(t) - p[1] * Math.sin(t), p[0] * Math.sin(t) + p[1] * Math.cos(t)];
        let u0 = [1.2, 0.15], v0 = [0.35, 1.05];
        const tR = () => (th.value * Math.PI) / 180;
        const uh = S.handle(...u0, { color: 'accent', label: 'u', constrain: (x, y) => { u0 = rot([x, y], -tR()); return [x, y]; } });
        const vh = S.handle(...v0, { color: 'orange', label: 'v', constrain: (x, y) => { v0 = rot([x, y], -tR()); return [x, y]; } });
        const normOf = () => {
          if (nsel.value === 'dot') return (x) => Math.hypot(x[0], x[1]);
          if (nsel.value === 'sk') return (x) => Math.sqrt(formA(A)(x, x));
          const p = pS.value; return (x) => (Math.abs(x[0]) ** p + Math.abs(x[1]) ** p) ** (1 / p);
        };
        const ratio = (N, U, V) => (N([U[0] + V[0], U[1] + V[1]]) ** 2 + N([U[0] - V[0], U[1] - V[1]]) ** 2) / (2 * (N(U) ** 2 + N(V) ** 2));
        pS.el.hidden = nsel.value !== 'lp';
        let st = null;
        v.render(() => {
          const t = tR(), U = rot(u0, t), V = rot(v0, t), N = normOf();
          uh.x = U[0]; uh.y = U[1]; vh.x = V[0]; vh.y = V[1];
          // unit ball of the norm
          const ball = []; for (let i = 0; i <= 240; i++) { const a = (TAU * i) / 240, d = [Math.cos(a), Math.sin(a)], r = 1 / N(d); ball.push([r * d[0], r * d[1]]); }
          S.poly(ball, { fill: 'muted', fillAlpha: 0.1, color: 'muted', width: 1.2 });
          const s = [U[0] + V[0], U[1] + V[1]];
          S.poly([[0, 0], U, s, V], { fill: 'accent', fillAlpha: 0.05, color: 'ink', width: 1, alpha: 0.5 });
          S.line(V[0], V[1], U[0], U[1], { color: 'purple', width: 2.6 });
          S.arrow(0, 0, s[0], s[1], { color: 'green', width: 2.6 });
          arrowTo(S, 0, 0, U[0], U[1], { color: 'accent', width: 2.6 }); arrowTo(S, 0, 0, V[0], V[1], { color: 'orange', width: 2.6 });
          S.tex('u+v', s[0], s[1], { color: 'green', size: 14, dx: 12, dy: -8, align: 'left' });
          S.tex('u-v', 0.35 * U[0] + 0.65 * V[0], 0.35 * U[1] + 0.65 * V[1], { color: 'purple', size: 14, dx: -8, dy: -10, align: 'right' });

          // ratio as a function of the rotation angle
          const pts = []; let mn = Infinity, mx = -Infinity;
          for (let k = 0; k <= 360; k += 1) { const r = ratio(N, rot(u0, (k * Math.PI) / 180), rot(v0, (k * Math.PI) / 180)); pts.push([k, r]); mn = Math.min(mn, r); mx = Math.max(mx, r); }
          const spread = Math.max(0.12, 1.25 * Math.max(Math.abs(mx - 1), Math.abs(1 - mn)));
          G.setView([-10, 370], [1 - spread, 1 + spread]);
          G.hline(1, { color: 'green', width: 5, alpha: 0.3 });
          G.path(pts, { color: 'accent', width: 2.2 });
          const r0 = ratio(N, U, V);
          G.vline(th.value, { color: 'gold', width: 1, dash: [3, 4] }); G.dot(th.value, r0, { color: 'gold', r: 6 });
          const flat = mx - mn < 1e-9;
          G.corner(flat ? 'flat at 1: the equality holds everywhere' : `ranges over [${pn(mn, 3)}, ${pn(mx, 3)}]`, 'tl', { color: flat ? 'green' : 'red', weight: 700 });
          const lhs = N(s) ** 2 + N([U[0] - V[0], U[1] - V[1]]) ** 2, rhs = 2 * (N(U) ** 2 + N(V) ** 2);
          st = { lhs, rhs, r0, ip: nsel.value !== 'lp' || Math.abs(pS.value - 2) < 1e-9 };
        });
        v.legend([['green', '$u + v$'], ['purple', '$u - v$'], ['muted', 'unit ball of the norm', { area: true }], ['accent', 'ratio LHS / RHS']]);
        v.readout(() => {
          if (!st) return '';
          const { lhs, rhs, ip } = st;
          return `$\\|u+v\\|^2 + \\|u-v\\|^2 = ${tn(lhs, 3)}$ and $2(\\|u\\|^2 + \\|v\\|^2) = ${tn(rhs, 3)}$` + (ip ? ' — equal: this norm comes from an inner product.' : ' — this norm does not come from an inner product.');
        });
      },
    },
  ],
};
