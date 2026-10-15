// Linear Algebra Done Right (Axler, 4th ed.) — Chapter 9: Multilinear Algebra and Determinants
// Part 4 (9.37–9.49): the alternating (dim V)-forms make a 1-dimensional space and detect linear independence;
// the determinant of an operator and of a matrix, the determinant as an alternating multilinear form of the
// columns, the permutation formula, upper-triangular matrices, and multiplicativity.
// Parts 1–3 (9.1–9.36) are ch09.js, ch09-b.js and ch09-c.js.

// =====================================================================================================
// Shared helpers
// =====================================================================================================
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sb = (k) => String(k).split('').map((d) => SUBS[+d]).join('');
/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** The same for canvas text (real minus sign). */
const pn = (x, d = 2) => tn(x, d).replace('-', '−');
/** Rounding residues below 1e-12 shown as 0, negative numbers in parentheses (for products in TeX). */
const zt = (x, d = 3) => (Math.abs(x) < 1e-12 ? '0' : x < 0 ? `(${tn(x, d)})` : tn(x, d));
/** TeX for a number that may be a rounding residue. */
const small = (v, x, d = 3) => (Math.abs(x) >= 1e-9 ? tn(x, d) : x === 0 ? '0' : v.sci(x, 1));
/** TeX for a real matrix (array of rows). */
const mtex = (A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((x) => tn(x, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
/** A "nice" bound ≥ x from a list. */
const nice = (x, list = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 40, 60, 100, 150, 200]) => list.find((t) => t >= x) ?? list[list.length - 1];
const TAU = 2 * Math.PI;

// ---------- vectors and matrices ----------
const ZERO = [0, 0, 0];
const add = (a, b) => a.map((x, i) => x + b[i]);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const len = (a) => Math.hypot(...a);
const unit = (a) => { const l = len(a); return l > 1e-12 ? scl(a, 1 / l) : a.map(() => 0); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const det2 = (a, b) => a[0] * b[1] - a[1] * b[0];
const det3 = (a, b, c) => dot(a, cross(b, c));
const mv = (A, x) => A.map((r) => dot(r, x));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const madd = (A, B) => A.map((r, i) => r.map((x, j) => x + B[i][j]));
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
const colsOf = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const dett = (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0];

// ---------- permutations ----------
function perms(n) {
  const out = [];
  const rec = (pre, rest) => {
    if (!rest.length) { out.push(pre); return; }
    rest.forEach((x, i) => rec([...pre, x], [...rest.slice(0, i), ...rest.slice(i + 1)]));
  };
  rec([], Array.from({ length: n }, (_, i) => i + 1));
  return out;
}
function invPos(a) {
  const r = [];
  for (let p = 0; p < a.length; p++) for (let q = p + 1; q < a.length; q++) if (a[p] > a[q]) r.push([p, q]);
  return r;
}
const sign = (a) => (invPos(a).length % 2 ? -1 : 1);
const ptex = (p) => `(${p.join(', ')})`;
/** The permutation formula Σ sign(j) A[j₁,1] ⋯ A[jₙ,n] (signs optional: without them, the permanent). */
const permSum = (A, signs = true) => perms(A.length).reduce((s, p) => s + (signs ? sign(p) : 1) * p.reduce((q, j, k) => q * A[j - 1][k], 1), 0);

// ---------- drawing ----------
const CC = ['orange', 'purple', 'teal'];
const oriCol = (x, eps = 1e-4) => (Math.abs(x) < eps ? 'green' : x > 0 ? 'blue' : 'red');
function pped(sc, a, b, c, st, o = ZERO) {
  const ab = add(a, b), ac = add(a, c), bc = add(b, c), abc = add(ab, c);
  for (const f of [[ZERO, a, ab, b], [c, ac, abc, bc], [ZERO, a, ac, c], [b, ab, abc, bc], [ZERO, b, bc, c], [a, ab, abc, ac]]) sc.poly(f.map((p) => add(o, p)), st);
}
function ppedEdges(sc, a, b, c, st, o = ZERO) {
  const V = [ZERO, a, b, c, add(a, b), add(a, c), add(b, c), add(add(a, b), c)].map((p) => add(o, p));
  for (const [i, j] of [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 4], [2, 6], [3, 5], [3, 6], [4, 7], [5, 7], [6, 7]]) sc.line(V[i], V[j], st, 1);
}
/** Faint grid lines x = k, y = k (|k| ≤ n) of a 2D stage, mapped by F (a point map). */
function gridImage(S, F, n = 3, st = {}) {
  for (let k = -n; k <= n; k++) {
    const a = [], b = [];
    for (let i = 0; i <= 40; i++) { const t = -n + (2 * n * i) / 40; a.push(F([k, t])); b.push(F([t, k])); }
    S.path(a, { color: 'grid', width: 1, ...st }); S.path(b, { color: 'grid', width: 1, ...st });
  }
}
/** Small arc near the origin from the direction of a to the direction of b (the shorter way), with an arrowhead. */
function orientArc(S, a, b, r, color) {
  const t0 = Math.atan2(a[1], a[0]); let dt = Math.atan2(b[1], b[0]) - t0;
  while (dt > Math.PI) dt -= TAU; while (dt < -Math.PI) dt += TAU;
  if (Math.abs(dt) < 0.05) return;
  const pts = []; for (let i = 0; i <= 30; i++) { const t = t0 + (dt * i) / 30; pts.push([r * Math.cos(t), r * Math.sin(t)]); }
  S.path(pts.slice(0, -2), { color, width: 2 });
  S.arrow(pts[pts.length - 3][0], pts[pts.length - 3][1], pts[30][0], pts[30][1], { color, width: 2, head: 8 });
}
/** Draggable images T(1,0), T(0,1) of the standard basis — the columns of a 2×2 matrix — snapped to a grid. */
function colHandles(S, A0, o = {}) {
  const g = o.grid ?? 0.05, snap = (x, y) => [Math.round(x / g) * g, Math.round(y / g) * g];
  const h1 = S.handle(A0[0][0], A0[1][0], { color: o.c1 ?? 'teal', label: o.l1 ?? 'Te₁', constrain: snap });
  const h2 = S.handle(A0[0][1], A0[1][1], { color: o.c2 ?? 'pink', label: o.l2 ?? 'Te₂', constrain: snap });
  return { h1, h2, get A() { return [[h1.x, h2.x], [h1.y, h2.y]]; }, set(A) { h1.set(A[0][0], A[1][0]); h2.set(A[0][1], A[1][1]); } };
}
/** Signed area of a closed polygon. */
const area = (P) => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += P[j][0] * P[i][1] - P[i][0] * P[j][1]; return a / 2; };
/**
 * Make the cells of table T on stage s editable: click the upper / lower half of a cell for ±1 step, or drag it
 * up / down. o.bump(i, j, k) applies k steps; o.ok(i, j) says which cells may change.
 */
function editable(s, T, o) {
  let d = null;
  s.onDrag((x, y, ph) => {
    if (ph === 'start') {
      const c = T.geo ? T.hit(x, y) : null;
      d = c && c.i >= 0 && c.j >= 0 && (!o.ok || o.ok(c.i, c.j)) ? { ...c, Y: s.Y(y), done: 0, moved: false } : null;
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

export default {
  collection: 'ladr',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.37
    {
      num: '9.37',
      kind: 'Theorem',
      name: 'Alternating (dim V)-forms form a 1-dimensional space',
      statement: String.raw`The vector space $V^{(\dim V)}_{\mathrm{alt}}$ of alternating $(\dim V)$-linear forms on $V$ has dimension $1$: there is a nonzero alternating $(\dim V)$-linear form $\alpha$ on $V$, and every other one is a scalar multiple of $\alpha$.`,
      idea: String.raw`Let $n = \dim V$. *At most one dimension:* if $\alpha \ne 0$, pick $e_1, \dots, e_n$ with $\alpha(e_1, \dots, e_n) \ne 0$; by 9.28 this list is linearly independent, hence a basis. Given any alternating $\alpha'$, put $c = \alpha'(e_1, \dots, e_n)/\alpha(e_1, \dots, e_n)$. By 9.36 both $\alpha'$ and $c\alpha$ are their value on $e_1, \dots, e_n$ times the same sum of signed products of coordinates, so $\alpha' = c\alpha$. *At least one:* with $\varphi_1, \dots, \varphi_n$ the dual basis (3.114), $\alpha(v_1, \dots, v_n) = \sum \operatorname{sign}(j_1, \dots, j_n)\,\varphi_{j_1}(v_1)\cdots\varphi_{j_n}(v_n)$ is $n$-linear, alternating (when $v_1 = v_2$ the terms for $(j_1, j_2, \dots)$ and $(j_2, j_1, \dots)$ cancel) and equals $1$ on $e_1, \dots, e_n$.`,
      caption: String.raw`Left: drag $u$ and $v$. The form $\alpha(u, v) = u_1v_2 - u_2v_1$ is the signed area of the blue parallelogram; $\alpha'(u, v) = \alpha(Tu, Tv)$ for a random $T$ (press *new* $\alpha'$) is a different-looking alternating form, the signed area of the dashed orange parallelogram. Right: one dot $(\alpha(u, v), \alpha'(u, v))$ for each of 300 random pairs, and the gold dot for your pair — they all lie on one line through $0$, so $\alpha' = c\,\alpha$. Choose *$\alpha'$ not alternating* (a general bilinear form) or *$2$-forms on $\mathbf R^3$* (where $m = 2 < \dim V$; $\alpha$ and $\alpha'$ are the signed areas of the shadows on two coordinate planes): the dots spread out and no multiple works.`,
      deps: ['ladr-9.36', 'ladr-9.28', 'ladr-3.114'],
      tags: ['multilinear', 'dimension'],
      viz(v) {
        const S = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 370, minWidth: 280 });
        const P = v.stage({ x: [-3, 3], y: [-3, 3], height: 370, minWidth: 280, xlabel: 'α(u, v)', ylabel: 'α′(u, v)', title: 'one dot per pair $(u, v)$' });
        const mode = v.select('', [{ value: 'r2', label: "two alternating 2-forms on $\\mathbf R^2$" }, { value: 'na', label: "$\\alpha'$ not alternating" }, { value: 'r3', label: 'two alternating 2-forms on $\\mathbf R^3$' }], 'r2');
        let seed = 4, T2 = [[1, 1], [-1, 1]], B2 = [[1, 2], [-1, 1]];
        const regen = () => {
          const r = v.rng(seed);
          do { T2 = [[r.int(-1, 1), r.int(-2, 2)], [r.int(-1, 1), r.int(-1, 1)]]; } while (Math.abs(dett(T2)) < 1 || Math.abs(dett(T2)) > 2 || T2.flat().filter((x) => x).length < 3);
          do { B2 = [[r.int(-2, 2), r.int(-2, 2)], [r.int(-2, 2), r.int(-2, 2)]]; } while (B2[0][0] === 0 && B2[1][1] === 0);
        };
        regen();
        v.button("new $\\alpha'$", () => { seed++; regen(); });
        const snap = (x, y) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
        const hu = S.handle(1.0, 0.3, { color: CC[0], label: 'u', constrain: snap });
        const hv = S.handle(0.2, 0.9, { color: CC[1], label: 'v', constrain: snap });
        const sc = v.scene3(S, { yaw: -0.65, pitch: 0.42, axis: 1.45, lim: 1.5 });
        const Hu = sc.handle([1.1, 0.3, 0.6], { color: CC[0], label: 'u' });
        const Hv = sc.handle([0.15, 1.0, 0.75], { color: CC[1], label: 'v' });
        const r0 = v.rng(21), U = (k) => Array.from({ length: k }, () => r0.uniform(-1.5, 1.5));
        const pairs2 = Array.from({ length: 300 }, () => [U(2), U(2)]), pairs3 = Array.from({ length: 300 }, () => [U(3), U(3)]);
        let st = null, view = 0;
        v.render(() => {
          const md = mode.value, three = md === 'r3';
          hu.visible = hv.visible = !three;
          if (Hu.visible !== three) { Hu.visible = three; Hv.visible = three; }
          const al = (a, b) => a[0] * b[1] - a[1] * b[0];
          const al2 = md === 'r2' ? (a, b) => det2(mv(T2, a), mv(T2, b)) : md === 'na' ? (a, b) => dot(a, mv(B2, b)) : (a, b) => a[1] * b[2] - a[2] * b[1];
          const pts = (three ? pairs3 : pairs2).map(([a, b]) => [al(a, b), al2(a, b)]);
          const u = three ? Hu.p : [hu.x, hu.y], w = three ? Hv.p : [hv.x, hv.y], cur = [al(u, w), al2(u, w)];
          if (three) {
            sc.begin();
            const fl = (p) => [p[0], p[1], 0], wl = (p) => [0, p[1], p[2]], par = (f) => [ZERO, f(u), add(f(u), f(w)), f(w)];
            sc.poly(par((p) => p), { fill: 'muted', color: 'muted', fillAlpha: 0.12, alpha: 0.6 });
            sc.poly(par(fl), { fill: oriCol(cur[0], 1e-6), color: oriCol(cur[0], 1e-6), fillAlpha: 0.25, alpha: 0.8 });
            sc.poly(par(wl), { fill: 'orange', color: 'orange', fillAlpha: 0.22, alpha: 0.8 });
            for (const p of [u, w, add(u, w)]) { sc.line(p, fl(p), { color: 'faint', width: 1, dash: [3, 3] }, 1); sc.line(p, wl(p), { color: 'faint', width: 1, dash: [3, 3] }, 1); }
            sc.arrow(ZERO, u, { color: CC[0], width: 3 }); sc.arrow(ZERO, w, { color: CC[1], width: 3 });
            sc.flush();
            S.corner('α = shadow on the xy-plane, α′ = shadow on the yz-plane', 'tl', { color: 'muted', weight: 600, size: 11.5 });
          } else {
            for (let k = -4; k <= 4; k++) { S.line(k, -5, k, 5, { color: 'grid', width: 1 }); S.line(-5, k, 5, k, { color: 'grid', width: 1 }); }
            S.line(-5, 0, 5, 0, { color: 'muted', width: 1 }); S.line(0, -5, 0, 5, { color: 'muted', width: 1 });
            if (md === 'r2') { const Tu = mv(T2, u), Tw = mv(T2, w); S.poly([[0, 0], Tu, add(Tu, Tw), Tw], { color: 'orange', width: 1.6, dash: [6, 4], fill: 'orange', fillAlpha: 0.06 }); }
            S.poly([[0, 0], u, add(u, w), w], { fill: oriCol(cur[0], 1e-9), color: oriCol(cur[0], 1e-9), width: 1.6, fillAlpha: 0.2 });
            S.arrow(0, 0, u[0], u[1], { color: CC[0], width: 3 }); S.arrow(0, 0, w[0], w[1], { color: CC[1], width: 3 });
            S.corner(md === 'r2' ? "orange: P(Tu, Tv), area α′(u, v)" : "α′(u, v) = uᵀBv: no area picture", 'tl', { color: md === 'r2' ? 'orange' : 'muted', weight: 600, size: 11.5 });
          }
          // the scatter
          const Rr = nice(1.08 * Math.max(1, ...pts.map((p) => Math.max(Math.abs(p[0]), Math.abs(p[1]))), Math.abs(cur[0]), Math.abs(cur[1])), [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20]);
          if (Rr !== view) { view = Rr; P.setView([-Rr, Rr], [-Rr, Rr]); }
          let sxx = 0, syy = 0, sxy = 0; for (const [x, y] of pts) { sxx += x * x; syy += y * y; sxy += x * y; }
          const cos = Math.abs(sxy) / Math.sqrt(sxx * syy || 1), c = sxy / (sxx || 1);
          if (md === 'r2') P.line(-Rr, -c * Rr, Rr, c * Rr, { color: 'green', width: 1.6, dash: [6, 4] });
          P.dots(pts, { r: 2.6, color: 'accent', alpha: 0.55 });
          P.dot(cur[0], cur[1], { r: 6.5, color: 'gold' });
          P.corner(md === 'r2' ? `$\\alpha' = ${tn(c, 3)}\\,\\alpha$ on every pair` : 'no line through 0 fits', md === 'r2' && c < 0 ? 'bl' : 'tl', { color: md === 'r2' ? 'green' : 'red', weight: 700, size: 13 });
          st = { md, cos, c, cur, T2, B2 };
        });
        v.legend([['accent', '300 random pairs', { dot: true }], ['gold', 'your pair', { dot: true }], ['green', "the line $\\alpha' = c\\,\\alpha$", { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { md, cos, c, cur, T2, B2 } = st, [[a, b], [cc, d]] = T2;
          const f = (p, q, s) => `${p ? `${p}${s}_1` : ''}${q ? `${q < 0 ? ' - ' : p ? ' + ' : ''}${Math.abs(q) === 1 ? '' : Math.abs(q)}${s}_2` : ''}`.replace(/^1(?=[a-z])/, '').replace(/^-1(?=[a-z])/, '-') || '0';
          const corr = `the correlation of the two value lists is $|\\cos\\theta| = ${tn(cos, 6)}$`;
          if (md === 'r2') return `$\\alpha'(u, v) = (${f(a, b, 'u')})(${f(cc, d, 'v')}) - (${f(cc, d, 'u')})(${f(a, b, 'v')})$. Your pair: $\\alpha = ${tn(cur[0], 3)}$, $\\alpha' = ${tn(cur[1], 3)}$. Over all pairs ${corr}: $\\alpha' = c\\,\\alpha$ with $c = \\alpha'(e_1, e_2)/\\alpha(e_1, e_2) = ${tn(c, 4)}$ — on $\\mathbf R^2$ the alternating $2$-forms make a $1$-dimensional space.`;
          if (md === 'na') return `$\\alpha'(u, v) = u^{\\mathsf T}${mtex(B2, 0)}v$ is bilinear but not alternating ($\\alpha'(e_1, e_1) = ${B2[0][0]}$, $\\alpha'(e_2, e_2) = ${B2[1][1]}$); ${corr} — not a multiple of $\\alpha$, as it lies outside $V^{(2)}_{\\mathrm{alt}}$.`;
          return `On $\\mathbf R^3$, $\\alpha = u_1v_2 - u_2v_1$ and $\\alpha' = u_2v_3 - u_3v_2$ are both alternating $2$-forms, yet ${corr}: neither is a multiple of the other. Here $m = 2 < \\dim V = 3$ and $V^{(2)}_{\\mathrm{alt}}$ has dimension $3$ — the theorem needs $m = \\dim V$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.39
    {
      num: '9.39',
      kind: 'Theorem',
      name: 'Alternating (dim V)-forms and linear independence',
      statement: String.raw`Let $n = \dim V$. Suppose $\alpha$ is a nonzero alternating $n$-linear form on $V$ and $e_1, \dots, e_n$ is a list of vectors in $V$. Then
$$\alpha(e_1, \dots, e_n) \ne 0 \iff e_1, \dots, e_n \text{ is linearly independent.}$$`,
      idea: String.raw`If $\alpha(e_1, \dots, e_n) \ne 0$, the list is independent, since alternating forms kill dependent lists (9.28). Conversely, an independent list of length $n = \dim V$ is a basis (2.38). As $\alpha \ne 0$, some list $v_1, \dots, v_n$ has $\alpha(v_1, \dots, v_n) \ne 0$; but by 9.36 that value is $\alpha(e_1, \dots, e_n)$ times a sum of signed products of coordinates, so $\alpha(e_1, \dots, e_n) \ne 0$. Both hypotheses matter: the zero form vanishes everywhere, and with fewer slots than $\dim V$ a nonzero alternating form can vanish on an independent list (Exercise 9B.7).`,
      caption: String.raw`Left ($n = \dim V = 2$): drag $v_1$ and $v_2$; the shading shows $w \mapsto \alpha(v_1, w)$ for $\alpha = c\cdot$(signed area), blue positive and red negative, and its zero set is exactly the green line $\operatorname{span}(v_1)$ — so $\alpha(v_1, v_2) = 0$ only when $v_2$ is a multiple of $v_1$ ($v_2$ snaps onto the line). Set $c = 0$ to break the hypothesis $\alpha \ne 0$. Right ($n = 2 < \dim V = 3$): $\alpha(u, w) = u_1w_2 - u_2w_1$, the signed area of the shadow on the floor. Its zero set for fixed $v_1$ is the whole green vertical plane, and $v_2$ in that plane (as it starts) gives $\alpha = 0$ although $v_1, v_2$ are independent.`,
      deps: ['ladr-9.28', 'ladr-2.38', 'ladr-9.36'],
      tags: ['multilinear', 'independence'],
      viz(v) {
        const L = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 370, minWidth: 280, ticks: false, title: '$n = \\dim V = 2$: $w \\mapsto \\alpha(v_1, w)$' });
        const R = v.stage({ x: [-1.5, 2.1], y: [-1.45, 2.15], equal: true, axes: false, height: 370, minWidth: 290, title: '$n = 2 < \\dim V = 3$' });
        const cS = v.slider('$c$ in $\\alpha = c\\cdot$(signed area)', -2, 2, 1, { step: 0.05 });
        const near = (x, y, d) => { const n2 = d[0] ** 2 + d[1] ** 2; if (n2 < 1e-9) return [x, y]; const t = (x * d[0] + y * d[1]) / n2, px = t * d[0], py = t * d[1]; return Math.hypot(x - px, y - py) < 0.12 ? [px, py] : [x, y]; };
        const h1 = L.handle(1.4, 0.5, { color: CC[0], label: 'v₁' });
        const h2 = L.handle(0.2, 1.4, { color: CC[1], label: 'v₂', constrain: (x, y) => near(x, y, [h1.x, h1.y]) });
        const sc = v.scene3(R, { yaw: -1.0, pitch: 0.38, axis: 1.45, lim: 1.5 });
        const planeOf = () => { const p = H1.p, d = unit([p[0], p[1], 0]); return { d, n: [-d[1], d[0], 0] }; };
        const H1 = sc.handle([1.0, 0.35, 0.3], { color: CC[0], label: 'v₁' });
        const H2 = sc.handle([0.2, 0.07, 1.05], {
          color: CC[1], label: 'v₂',
          snap: (p) => { const { n } = planeOf(), dd = dot(p, n); return Math.abs(dd) < 0.09 ? sub(p, scl(n, dd)) : p; },
        });
        const rgba = (name, a) => { const c = v.rgb(name); return [c[0], c[1], c[2], Math.round(255 * Math.min(1, Math.max(0, a)))]; };
        let st = null;
        v.render(() => {
          const c = cS.value, v1 = [h1.x, h1.y], v2 = [h2.x, h2.y], a12 = c * det2(v1, v2);
          L.raster((x, y) => { const z = c * det2(v1, [x, y]); return Math.abs(z) < 1e-12 ? null : rgba(z > 0 ? 'blue' : 'red', Math.min(0.3, 0.08 * Math.abs(z))); }, { key: `${v1}|${c}`, res: 3 });
          if (Math.abs(c) > 1e-9 && len(v1) > 1e-9) {
            const d = scl(unit(v1), 4), q = scl(unit(v1), -1.75); L.line(-d[0], -d[1], d[0], d[1], { color: 'green', width: 3, alpha: 0.85 });
            L.tex('\\operatorname{span}(v_1)', q[0], q[1], { color: 'green', size: 14, dx: v1[0] * v1[1] >= 0 ? 16 : -16, dy: 14 });
          }
          L.poly([[0, 0], v1, add(v1, v2), v2], { color: oriCol(a12, 1e-9), width: 1.6, fill: oriCol(a12, 1e-9), fillAlpha: 0.15 });
          L.arrow(0, 0, v1[0], v1[1], { color: CC[0], width: 3 }); L.arrow(0, 0, v2[0], v2[1], { color: CC[1], width: 3 });
          const indep = Math.abs(det2(v1, v2)) > 1e-9;
          L.corner(Math.abs(c) < 1e-9 ? 'α = 0: zero on every list' : `α(v₁, v₂) = ${pn(a12, 3)}: ${indep ? 'independent' : 'dependent'}`, 'tl', { color: Math.abs(c) < 1e-9 ? 'red' : 'ink', weight: 700 });
          // right: the shadow form on R³
          const p1 = H1.p, p2 = H2.p, b12 = p1[0] * p2[1] - p1[1] * p2[0], indep3 = len(cross(p1, p2)) > 1e-6, { d } = planeOf();
          sc.begin();
          const wall = (s1, t1) => add(scl(d, s1), [0, 0, t1]);
          sc.poly([wall(-1.2, -0.4), wall(1.5, -0.4), wall(1.5, 1.45), wall(-1.2, 1.45)], { fill: 'green', color: 'green', fillAlpha: 0.08, alpha: 0.5 });
          for (const s1 of [-0.6, 0, 0.6, 1.2]) sc.line(wall(s1, -0.4), wall(s1, 1.45), { color: 'green', width: 0.8, alpha: 0.35 }, 4);
          for (const t1 of [0, 0.5, 1]) sc.line(wall(-1.2, t1), wall(1.5, t1), { color: 'green', width: 0.8, alpha: 0.35 }, 4);
          const fl = (p) => [p[0], p[1], 0];
          sc.poly([ZERO, p1, add(p1, p2), p2], { fill: 'muted', color: 'muted', fillAlpha: 0.12, alpha: 0.6 });
          sc.poly([ZERO, fl(p1), fl(add(p1, p2)), fl(p2)], { fill: oriCol(b12, 1e-6), color: oriCol(b12, 1e-6), fillAlpha: 0.3, alpha: 0.9, width: 2 });
          for (const p of [p1, p2, add(p1, p2)]) sc.line(p, fl(p), { color: 'faint', width: 1, dash: [3, 3] }, 1);
          sc.arrow(ZERO, p1, { color: CC[0], width: 3 }); sc.arrow(ZERO, p2, { color: CC[1], width: 3 });
          sc.flush();
          R.corner(`α(v₁, v₂) = ${pn(Math.abs(b12) < 1e-12 ? 0 : b12, 3)}: ${indep3 ? 'independent' : 'dependent'}`, 'tl', { color: Math.abs(b12) < 1e-6 && indep3 ? 'red' : 'muted', weight: 700 });
          st = { c, a12, indep, b12, indep3 };
        });
        v.legend([['blue', '$\\alpha > 0$', { area: true }], ['red', '$\\alpha < 0$', { area: true }], ['green', 'zero set of $w \\mapsto \\alpha(v_1, w)$']]);
        v.readout(() => {
          if (!st) return '';
          const { c, a12, indep, b12, indep3 } = st;
          const left = Math.abs(c) < 1e-9 ? 'Left: $\\alpha = 0$, so $\\alpha(v_1, v_2) = 0$ even for independent $v_1, v_2$ — the hypothesis $\\alpha \\ne 0$ is needed.' : `Left: $\\alpha(v_1, v_2) = ${tn(a12, 3)}$ and $v_1, v_2$ ${indep ? 'are independent' : 'are dependent'} — ${(Math.abs(a12) > 1e-9) === indep ? 'as 9.39 predicts' : 'contradiction'}.`;
          const right = indep3 && Math.abs(b12) < 1e-6 ? `Right: $\\alpha(v_1, v_2) = ${zt(b12)}$ although $v_1, v_2$ are independent — with $n = 2 < \\dim \\mathbf R^3$ the theorem fails (Exercise 9B.7).` : `Right: $\\alpha(v_1, v_2) = ${tn(b12, 3)}$; drag $v_2$ into the green plane to make it $0$ while keeping $v_1, v_2$ independent.`;
          return `${left} ${right}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.41
    {
      num: '9.41',
      kind: 'Definition',
      name: 'Determinant of an operator',
      statement: String.raw`For $T \in \mathcal L(V)$ and $\alpha \in V^{(m)}_{\mathrm{alt}}$, define $\alpha_T \in V^{(m)}_{\mathrm{alt}}$ by $\alpha_T(v_1, \dots, v_m) = \alpha(Tv_1, \dots, Tv_m)$ (9.40). The **determinant** of $T$, written $\det T$, is the unique number in $\mathbf F$ such that
$$\alpha_T = (\det T)\,\alpha \quad\text{for all } \alpha \in V^{(\dim V)}_{\mathrm{alt}}.$$`,
      idea: String.raw`$\alpha_T$ is again alternating ($v_j = v_k$ forces $Tv_j = Tv_k$), and $\alpha \mapsto \alpha_T$ is a linear map of $V^{(\dim V)}_{\mathrm{alt}}$ to itself. That space is $1$-dimensional (9.37), and a linear map of a $1$-dimensional space is multiplication by a unique scalar — this scalar is $\det T$. No basis is involved. Geometrically, on $\mathbf R^2$ with $\alpha$ the signed area: $T$ multiplies the signed area of *every* parallelogram by the same factor. For instance $\det I = 1$, $\det(\lambda T) = \lambda^n \det T$, and if $T$ has a basis of eigenvectors with eigenvalues $\lambda_1, \dots, \lambda_n$ then $\det T = \lambda_1 \cdots \lambda_n$ (9.42).`,
      caption: String.raw`Left: drag $u$ and $v$ anywhere. Right: drag $Te_1$ and $Te_2$ to change $T$; the grid shows the image of the square grid, the faint parallelogram the image of the unit square, and the coloured one $P(Tu, Tv)$ (blue: same orientation, red: reversed — the small arcs turn from the first vector to the second). Bottom: the ratio $\alpha(Tu, Tv)/\alpha(u, v)$ for 300 random pairs — a single spike at $\det T$, whatever the pair. With *eigenbasis*, $u$ and $v$ are eigenvectors (purple dashed lines) and the factor is $\lambda_1\lambda_2$. Choose *a nonlinear map* $F$ to leave $\mathcal L(V)$: the ratios scatter and no determinant exists.`,
      deps: ['ladr-9.37', 'ladr-9.27'],
      see: ['pma-9.33'],
      tags: ['determinants'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Determinant' },
      viz(v) {
        const M = v.M;
        const D = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 320, minWidth: 260, ticks: false, title: 'in $V = \\mathbf R^2$' });
        const I = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, height: 320, minWidth: 260, ticks: false, title: 'after $T$' });
        const Rt = v.stage({ x: [-5, 5], y: [0, 1], height: 110, full: true, axes: false, title: 'the ratio $\\alpha(Tu, Tv)/\\alpha(u, v)$ for 300 random pairs $u, v$' });
        const PRE = { gen: [[1.3, -0.4], [0.5, 1.1]], eig: [[1.5, 0.5], [0.25, 0.75]], refl: [[0.3, 1.2], [1.1, 0.4]], sing: [[1.2, 0.6], [0.6, 0.3]], nl: [[1, 0], [0, 1]] };
        const hu = D.handle(1.2, 0.3, { color: CC[0], label: 'u' }), hv = D.handle(0.4, 1.3, { color: CC[1], label: 'v' });
        const H = colHandles(I, PRE.gen);
        const pre = v.select('$T$', [{ value: 'gen', label: 'generic' }, { value: 'eig', label: 'eigenbasis' }, { value: 'refl', label: 'orientation-reversing' }, { value: 'sing', label: 'not invertible' }, { value: 'nl', label: 'a nonlinear map' }], 'gen', {
          onChange: (k) => {
            H.set(PRE[k]);
            if (k === 'eig') { const e = M.eig(PRE.eig).vectors.map((x) => scl(unit(x), 1.3)); hu.set(e[0][0], e[0][1]); hv.set(e[1][0], e[1][1]); }
            else { hu.set(1.2, 0.3); hv.set(0.4, 1.3); }
          },
        });
        const N = (p) => [p[0] + 0.28 * p[1] * p[1], p[1] - 0.22 * p[0] * p[0]];
        const r0 = v.rng(12), pairs = [];
        while (pairs.length < 300) { const a = [r0.uniform(-1.5, 1.5), r0.uniform(-1.5, 1.5)], b = [r0.uniform(-1.5, 1.5), r0.uniform(-1.5, 1.5)]; if (Math.abs(det2(a, b)) > 0.2) pairs.push([a, b, r0.uniform(0.2, 0.8)]); }
        let st = null, view = 0;
        v.render(() => {
          I.setTitle(pre.value === 'nl' ? 'after the nonlinear map $F$' : 'after $T$');
          const T = H.A, nl = pre.value === 'nl', F = nl ? (p) => mv(T, N(p)) : (p) => mv(T, p), dT = dett(T);
          const u = [hu.x, hu.y], w = [hv.x, hv.y], au = det2(u, w), Fu = F(u), Fw = F(w), aT = det2(Fu, Fw);
          // the domain
          gridImage(D, (p) => p, 2);
          D.poly([[0, 0], [1, 0], [1, 1], [0, 1]], { fill: 'muted', fillAlpha: 0.12, color: 'muted', width: 1 });
          D.poly([[0, 0], u, add(u, w), w], { fill: oriCol(au, 1e-9), color: oriCol(au, 1e-9), fillAlpha: 0.2, width: 1.6 });
          D.arrow(0, 0, u[0], u[1], { color: CC[0], width: 3 }); D.arrow(0, 0, w[0], w[1], { color: CC[1], width: 3 });
          orientArc(D, u, w, 0.45, oriCol(au, 1e-9));
          // eigen-directions (real eigenvalues only)
          const ev = M.eig(T), real = !nl && ev.values.every((z) => Math.abs(z.im) < 1e-9);
          if (real) ev.vectors.forEach((e) => { if (!e) return; const d = scl(unit(e), 5); for (const S of [D, I]) S.line(-d[0], -d[1], d[0], d[1], { color: 'purple', dash: [5, 5], width: 1.2, alpha: 0.7 }); });
          // the image
          gridImage(I, F, 2);
          const sq = []; for (let i = 0; i <= 20; i++) sq.push(F([i / 20, 0])); for (let i = 0; i <= 20; i++) sq.push(F([1, i / 20])); for (let i = 20; i >= 0; i--) sq.push(F([i / 20, 1])); for (let i = 20; i >= 0; i--) sq.push(F([0, i / 20]));
          I.poly(sq, { fill: 'muted', fillAlpha: 0.12, color: 'muted', width: 1 });
          if (nl) {
            const cur = []; const at = (s, t) => F(add(scl(u, s), scl(w, t)));
            for (let i = 0; i <= 20; i++) cur.push(at(i / 20, 0)); for (let i = 0; i <= 20; i++) cur.push(at(1, i / 20)); for (let i = 20; i >= 0; i--) cur.push(at(i / 20, 1)); for (let i = 20; i >= 0; i--) cur.push(at(0, i / 20));
            I.poly(cur, { color: 'gold', width: 1.6, dash: [5, 4] });
          }
          I.poly([[0, 0], Fu, add(Fu, Fw), Fw], { fill: oriCol(aT, 1e-9), color: oriCol(aT, 1e-9), fillAlpha: 0.2, width: 1.6 });
          I.arrow(0, 0, Fu[0], Fu[1], { color: CC[0], width: 3 }); I.arrow(0, 0, Fw[0], Fw[1], { color: CC[1], width: 3 });
          orientArc(I, Fu, Fw, 0.45, oriCol(aT, 1e-9));
          I.corner(nl ? 'F nonlinear: curves, no single factor' : `det T = ${pn(dT, 3)}`, 'tl', { color: nl ? 'red' : oriCol(dT, 1e-9), weight: 700, size: 13 });
          // the ratios
          const rs = pairs.map(([a, b]) => det2(F(a), F(b)) / det2(a, b));
          const Rr = nl ? 5 : Math.max(3, Math.ceil(Math.abs(dT) * 1.25));
          if (Rr !== view) { view = Rr; Rt.setView([-Rr, Rr], [0, 1]); }
          Rt.line(-Rr, 0.18, Rr, 0.18, { color: 'muted', width: 1 });
          const stp = Rr > 6 ? 2 : 1;
          for (let k = -Math.floor((Rr - 0.3) / stp) * stp; k <= Rr - 0.3; k += stp) { Rt.line(k, 0.14, k, 0.22, { color: 'muted', width: 1 }); Rt.text(pn(k, 0), k, 0.05, { align: 'center', size: 10.5, color: 'muted' }); }
          if (!nl) { Rt.line(dT, 0.18, dT, 0.95, { color: 'green', width: 2 }); Rt.text(`det T = ${pn(dT, 3)}`, dT, 0.9, { size: 12, weight: 700, color: 'green', dx: 8 }); }
          Rt.dots(pairs.map(([, , j], i) => [Math.max(-Rr, Math.min(Rr, rs[i])), 0.3 + 0.55 * j]), { r: 2.6, color: nl ? 'red' : 'accent', alpha: 0.6 });
          const lo = Math.min(...rs), hi = Math.max(...rs);
          st = { nl, dT, au, aT, lo, hi, ev, real, spread: Math.max(...rs.map((x) => Math.abs(x - dT))) };
        });
        v.legend([['orange', '$u$ and $Tu$'], ['purple', '$v$ and $Tv$'], ['blue', 'positively oriented', { area: true }], ['red', 'orientation reversed', { area: true }], ['purple', 'eigenvector lines', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { nl, dT, au, aT, lo, hi, ev, real, spread } = st;
          if (nl) return `$F$ is not linear, so $\\alpha_F(u, v) = \\alpha(Fu, Fv)$ is not a $2$-linear form, and the ratio $\\alpha(Fu, Fv)/\\alpha(u, v)$ ranges from $${tn(lo, 2)}$ to $${tn(hi, 2)}$ over the random pairs — no single number, so no determinant.`;
          const ratio = Math.abs(au) > 1e-9 ? `$\\alpha(Tu, Tv)/\\alpha(u, v) = ${tn(aT, 3)}/${zt(au)} = ${tn(aT / au, 4)}$` : '$\\alpha(u, v) = 0$, so the ratio is undefined';
          const l = ev.values;
          const eig = real ? ` The eigenvalues are $${tn(l[0].re, 3)}$ and $${tn(l[1].re, 3)}$, with product $${tn(l[0].re * l[1].re, 3)} = \\det T$ (9.42).` : ` The eigenvalues $${tn(l[0].re, 3)} \\pm ${tn(Math.abs(l[0].im), 3)}i$ are not real; still $\\lambda\\bar\\lambda = ${tn(l[0].re ** 2 + l[0].im ** 2, 3)} = \\det T$.`;
          return `${ratio}; $\\det T = \\alpha(Te_1, Te_2)/\\alpha(e_1, e_2) = ${tn(dT, 4)}$. Over 300 random pairs the ratio differs from $\\det T$ by at most $${small(v, spread)}$: $\\alpha_T = (\\det T)\\,\\alpha$.${eig}${Math.abs(dT) < 1e-9 ? ' Here $\\det T = 0$: $T$ flattens every parallelogram.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.43
    {
      num: '9.43',
      kind: 'Definition',
      name: 'Determinant of a matrix',
      statement: String.raw`Suppose $n$ is a positive integer and $A$ is an $n$-by-$n$ matrix with entries in $\mathbf F$. Let $T \in \mathcal L(\mathbf F^n)$ be the operator whose matrix with respect to the standard basis of $\mathbf F^n$ is $A$. The **determinant** of $A$ is $\det A = \det T$.`,
      idea: String.raw`The columns of $A$ are $Te_1, \dots, Te_n$. If $\alpha$ is the alternating $n$-form with $\alpha(e_1, \dots, e_n) = 1$, then $\det A = (\det T)\,\alpha(e_1, \dots, e_n) = \alpha(Te_1, \dots, Te_n)$: the determinant is $\alpha$ evaluated on the columns. On $\mathbf R^3$, with $\alpha$ the signed volume, $\det A$ is the signed volume of the image of the unit cube, the parallelepiped spanned by the columns — positive if the columns keep the orientation of $e_1, e_2, e_3$, negative if they reverse it. For example $\det I = 1$, and a diagonal matrix has determinant the product of its diagonal entries (9.44). The definition needs $A$ square: a non-square matrix is not the matrix of an operator on one space.`,
      caption: String.raw`Drag the three columns $Ae_1, Ae_2, Ae_3$ (drag the background to rotate), or edit the entries of $A$ on the right (click the top or bottom half of an entry, or drag it). The dashed cube is $[0,1]^3$ and the shaded box is its image: blue when $Ae_1, Ae_2, Ae_3$ is right-handed like $e_1, e_2, e_3$, red when it is left-handed, flat and green when $\det A = 0$. Try the presets. Choose *$3 \times 2$* to break the hypothesis that $A$ is square: the image of the unit square is a parallelogram in $\mathbf R^3$ with an area, but there is no operator on one space and no determinant.`,
      deps: ['ladr-9.41', 'ladr-5.35'],
      tags: ['determinants'],
      viz(v) {
        const S = v.stage({ x: [-1.45, 2.15], y: [-1.4, 2.1], equal: true, axes: false, height: 400, weight: 1.35, minWidth: 320 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 250, title: 'the matrix $A$' });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.32, axis: 1.5, lim: 1.6 });
        const PRE = { gen: [[1.1, 0.2, -0.1], [0.2, 0.9, 0.5], [0.2, -0.3, 0.8]], shear: [[1, 0, 0], [0.8, 1, 0], [0.4, 0.5, 1]], refl: [[0, 1, 0], [1, 0, 0], [0, 0, 1]], sing: [[0.9, 0.1, 0], [0.1, 0.8, 0.4], [0.5, 0.5, 0.2]] };
        const g = (p) => p.map((x) => Math.round(x * 10) / 10);
        const H = PRE.gen.map((c, k) => sc.handle(c, { color: CC[k], label: `Ae${sb(k + 1)}`, snap: g }));
        const shape = v.select('', [{ value: 'sq', label: '$A$ is $3 \\times 3$' }, { value: 'ns', label: '$A$ is $3 \\times 2$ (not square)' }], 'sq');
        v.select('preset', [{ value: 'gen', label: 'generic' }, { value: 'shear', label: 'shear' }, { value: 'refl', label: 'swap $e_1, e_2$' }, { value: 'sing', label: 'singular' }], 'gen', { onChange: (k) => PRE[k].forEach((c, j) => H[j].set(c)) });
        const TA = v.table(R, { rows: 3, cols: 3, region: [0.04, 0.42, 0.96, 0.95], maxCell: 58, size: 15, rowLabels: (i) => `$${i + 1}$`, colLabels: (j) => `$Ae_${j + 1}$` });
        editable(R, TA, { ok: (i, j) => shape.value === 'sq' || j < 2, bump: (i, j, k) => { const p = H[j].p.slice(); p[i] = Math.max(-1.6, Math.min(1.6, Math.round((p[i] + 0.1 * k) * 10) / 10)); H[j].set(p); } });
        let st = null;
        v.render(() => {
          const ns = shape.value === 'ns';
          if (H[2].visible === ns) H[2].visible = !ns;
          const C = H.map((h) => h.p), A = fromCols(ns ? C.slice(0, 2) : C), d = ns ? NaN : det3(C[0], C[1], C[2]);
          sc.begin();
          if (ns) {
            sc.poly([ZERO, [1, 0, 0], [1, 1, 0], [0, 1, 0]], { fill: 'muted', color: 'muted', fillAlpha: 0.08, alpha: 0.6 });
            sc.poly([ZERO, C[0], add(C[0], C[1]), C[1]], { fill: 'gold', color: 'gold', fillAlpha: 0.22, alpha: 0.85, width: 1.8 });
          } else {
            ppedEdges(sc, [1, 0, 0], [0, 1, 0], [0, 0, 1], { color: 'muted', width: 1, dash: [3, 4], alpha: 0.7 });
            pped(sc, C[0], C[1], C[2], { fill: oriCol(d, 1e-3), color: oriCol(d, 1e-3), fillAlpha: 0.13, alpha: 0.6 });
          }
          C.slice(0, ns ? 2 : 3).forEach((c, k) => sc.arrow(ZERO, c, { color: CC[k], width: 3.2 }));
          sc.flush();
          const ar = len(cross(C[0], C[1]));
          S.corner(ns ? `image of the unit square: area ${pn(ar, 3)}, no sign` : Math.abs(d) < 1e-3 ? 'flat: volume 0' : d > 0 ? 'right-handed: orientation kept' : 'left-handed: orientation reversed', 'tl', { color: ns ? 'gold' : oriCol(d, 1e-3), weight: 700 });
          TA.draw({ cols: ns ? 2 : 3, value: (i, j) => A[i][j], format: (x) => pn(x, 1), fill: (i, j) => [CC[j], 0.2] });
          if (ns) {
            R.tex('\\det A \\text{ is not defined}', 0.5, 0.3, { size: 17, color: 'red' });
            R.tex(`\\text{area of }A([0,1]^2) = \\sqrt{\\det(A^{\\mathsf T}A)} = ${tn(ar, 3)}`, 0.5, 0.18, { size: 13.5, color: 'muted' });
          } else {
            R.tex(`\\det A = ${tn(d, 3)}`, 0.5, 0.3, { size: 20, color: oriCol(d, 1e-3) });
            R.tex(`= \\text{signed volume of }A([0,1]^3)`, 0.5, 0.18, { size: 13.5, color: 'muted' });
            R.tex(`\\text{formula 9.46: } ${tn(permSum(A), 3)}`, 0.5, 0.08, { size: 13, color: 'muted' });
          }
          st = { ns, d, ar, A };
        });
        v.legend([['blue', 'orientation kept', { area: true }], ['red', 'orientation reversed', { area: true }], ['muted', 'unit cube', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { ns, d, ar, A } = st;
          if (ns) return `$A = ${mtex(A, 1)}$ maps $\\mathbf R^2$ to $\\mathbf R^3$, so it is not the matrix of an operator on one space: there is no $\\alpha_T$ and no $\\det A$. The image of the unit square still has an area, $${tn(ar, 3)}$, but no sign — turning $\\mathbf R^3$ around turns the parallelogram over.`;
          return `$\\det A = ${tn(d, 3)}$: the signed volume $Ae_1 \\cdot (Ae_2 \\times Ae_3)$ of the image of the unit cube, which has volume $|\\det A| = ${tn(Math.abs(d), 3)}$ and ${Math.abs(d) < 1e-3 ? 'is flat — $A$ is not invertible' : d > 0 ? 'the same orientation as $e_1, e_2, e_3$' : 'the opposite orientation'}. (Computed independently by the permutation formula 9.46: $${tn(permSum(A), 3)}$.)`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.45
    {
      num: '9.45',
      kind: 'Theorem',
      name: 'Determinant is an alternating multilinear form',
      statement: String.raw`Suppose $n$ is a positive integer. The map that takes a list $v_1, \dots, v_n$ of vectors in $\mathbf F^n$ to $\det\begin{pmatrix} v_1 & \cdots & v_n \end{pmatrix}$ — the determinant of the matrix whose $k$th column is $v_k$ — is an alternating $n$-linear form on $\mathbf F^n$.`,
      idea: String.raw`Let $T$ be the operator with $Te_k = v_k$, whose matrix is $\begin{pmatrix} v_1 & \cdots & v_n\end{pmatrix}$, and let $\alpha$ be the alternating $n$-form with $\alpha(e_1, \dots, e_n) = 1$ (9.37). Then $\det\begin{pmatrix} v_1 & \cdots & v_n\end{pmatrix} = \det T = (\det T)\,\alpha(e_1, \dots, e_n) = \alpha(Te_1, \dots, Te_n) = \alpha(v_1, \dots, v_n)$, using the definitions 9.43 and 9.41. So the determinant of the columns *is* the form $\alpha$. In particular a matrix with two equal columns has determinant $0$, and swapping two columns changes its sign (9.30). In $\mathbf R^2$: $\det(c, a)$ is the signed area $|c| \cdot h(a)$, where $h(a)$ is the signed height of $a$ above the line through $c$ — and $h$ is linear in $a$.`,
      caption: String.raw`The columns of a $2 \times 2$ matrix are $c$ (purple) and $a$ (blue); $\det(c, a)$ is the signed area of their parallelogram — base $|c|$ times the signed height of $a$ above the dashed line through $c$ (positive on the side that $c$ turns towards counterclockwise). *Additive in column 2:* drag $a$ and $a'$ (orange). The orange parallelogram on $c$ and $a'$ is stacked on top of the blue one, and together they reach exactly the height of the green dashed parallelogram on $c$ and $a + a'$ (right: the heights, with signs). *Homogeneous:* the slider scales $a$ by $\lambda$, and the area scales by $\lambda$, sign included. *Equal columns:* $a$ snaps onto $c$ and the area is $0$. Toggle *unsigned area* to replace $\det$ by $|\det|$: it still vanishes on equal columns, but additivity fails when $a$ and $a'$ lie on opposite sides of the line (as they start), and homogeneity fails for $\lambda < 0$.`,
      deps: ['ladr-9.43', 'ladr-9.41', 'ladr-9.27'],
      see: ['pma-9.34'],
      tags: ['determinants', 'multilinear'],
      viz(v) {
        const S = v.stage({ x: [-1.7, 3.1], y: [-1.5, 2.6], equal: true, height: 370, weight: 1.45, minWidth: 320, ticks: false });
        const Hs = v.stage({ x: [0, 1], y: [-1, 1], axes: false, height: 370, minWidth: 220, title: 'signed heights above the line $\\mathbf R c$' });
        const mode = v.select('', [{ value: 'add', label: 'additive in column 2' }, { value: 'hom', label: 'homogeneous in column 2' }, { value: 'alt', label: 'equal columns' }], 'add');
        const absT = v.toggle('unsigned area $|\\det|$ instead', false);
        const lam = v.slider('$\\lambda$', -2, 2, 1.6, { step: 0.05 });
        const snap = (x, y) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
        const hc = S.handle(1.9, 0.3, { color: 'purple', label: 'c', constrain: snap });
        const ha = S.handle(0.4, 1.3, { color: 'blue', label: 'a', constrain: (x, y) => { const p = snap(x, y); return mode.value === 'alt' && Math.hypot(p[0] - hc.x, p[1] - hc.y) < 0.35 ? [hc.x, hc.y] : p; } });
        const hb = S.handle(0.6, -0.5, { color: 'orange', label: 'a′', constrain: snap });
        v.button('set $a = c$', () => { mode.set('alt'); ha.set(hc.x, hc.y); });
        let st = null, view = 0;
        v.render(() => {
          const md = mode.value, A = absT.value, D = (x, y) => (A ? Math.abs(det2(x, y)) : det2(x, y));
          lam.el.hidden = md !== 'hom'; hb.visible = md === 'add';
          const a = [ha.x, ha.y], b = [hb.x, hb.y], c = [hc.x, hc.y], lc = len(c);
          const d = scl(unit(c), 7); S.line(-d[0], -d[1], d[0], d[1], { color: 'muted', dash: [6, 5], width: 1.2 });
          const par = (o, x, y, st2) => S.poly([o, add(o, x), add(add(o, x), y), add(o, y)], st2);
          let rows = [];
          if (md === 'add') {
            const ab = add(a, b);
            par([0, 0], c, a, { fill: 'blue', color: 'blue', fillAlpha: 0.2, width: 1.4 });
            par(a, c, b, { fill: 'orange', color: 'orange', fillAlpha: 0.2, width: 1.4 });
            par([0, 0], c, ab, { color: 'green', width: 2.2, dash: [7, 4] });
            S.arrow(0, 0, ab[0], ab[1], { color: 'green', width: 2, dash: [5, 4] });
            S.arrow(a[0], a[1], ab[0], ab[1], { color: 'orange', width: 2.6 });
            S.tex("a + a'", ab[0], ab[1], { color: 'green', size: 14, dx: 16, dy: 16 });
            rows = [['a', D(c, a), 'blue'], ["a'", D(c, b), 'orange'], ["a + a'", D(c, ab), 'green']];
          } else if (md === 'hom') {
            const la = scl(a, lam.value);
            par([0, 0], c, a, { color: 'blue', width: 1.2, dash: [4, 4] });
            par([0, 0], c, la, { fill: oriCol(det2(c, la), 1e-9), color: oriCol(det2(c, la), 1e-9), fillAlpha: 0.2, width: 1.6 });
            S.arrow(0, 0, la[0], la[1], { color: 'gold', width: 2.6 });
            S.tex('\\lambda a', la[0], la[1], { color: 'gold', size: 14, dx: 14, dy: -10 });
            rows = [['a', D(c, a), 'blue'], ['\\lambda a', D(c, la), 'gold']];
          } else {
            par([0, 0], c, a, { fill: oriCol(det2(c, a), 1e-9), color: oriCol(det2(c, a), 1e-9), fillAlpha: 0.2, width: 1.6 });
            rows = [['a', D(c, a), 'blue']];
          }
          S.arrow(0, 0, c[0], c[1], { color: 'purple', width: 3 });
          S.arrow(0, 0, a[0], a[1], { color: 'blue', width: 3 });
          // heights panel: det = |c| · height
          const hts = rows.map((r) => [r[0], lc > 1e-9 ? r[1] / lc : 0, r[2]]);
          const Y = nice(1.15 * Math.max(0.5, ...hts.map((h) => Math.abs(h[1])), md === 'add' ? Math.abs(hts[0][1]) + Math.abs(hts[1][1]) : 0, md === 'hom' ? Math.abs(lam.value * hts[0][1]) : 0), [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8]);
          if (Y !== view) { view = Y; Hs.setView([0, 1], [-Y * 1.12, Y * 1.12]); }
          Hs.line(0.04, 0, 0.96, 0, { color: 'muted', width: 1.2 });
          const bar = (x, y0, y1, col, w = 0.13) => Hs.rect(x - w, y0, x + w, y1, { fill: col, fillAlpha: 0.55, color: col, width: 1.2 });
          if (md === 'add') {
            const [h1, h2, h3] = hts.map((h) => h[1]);
            bar(0.3, 0, h1, 'blue'); bar(0.39, h1, h1 + h2, 'orange', 0.05); bar(0.7, 0, h3, 'green');
            if (Math.abs(h2) > 0.05) Hs.arrow(0.39, h1, 0.39, h1 + h2, { color: 'orange', width: 2, head: 8 });
            Hs.line(0.12, h1 + h2, 0.88, h1 + h2, { color: 'ink', dash: [3, 3], width: 1 });
            Hs.text('a, then a′', 0.3, -Y * 1.04, { align: 'center', size: 12, color: 'muted' }); Hs.text('a + a′', 0.7, -Y * 1.04, { align: 'center', size: 12, color: 'muted' });
          } else if (md === 'hom') {
            bar(0.3, 0, lam.value * hts[0][1], 'blue'); bar(0.7, 0, hts[1][1], 'gold');
            Hs.text('λ · (height of a)', 0.3, -Y * 1.04, { align: 'center', size: 11.5, color: 'muted' }); Hs.text('height of λa', 0.7, -Y * 1.04, { align: 'center', size: 11.5, color: 'muted' });
          } else {
            bar(0.5, 0, hts[0][1], 'green');
            Hs.text('height of a', 0.5, -Y * 1.04, { align: 'center', size: 12, color: 'muted' });
          }
          const fn = A ? '|\\det|' : '\\det';
          S.corner(`$${fn}(c, a) = ${tn(D(c, a), 3)}$`, 'tl', { color: 'ink', weight: 700, size: 13 });
          v.legend([['purple', 'column 1: $c$'], ['blue', 'column 2: $a$'], ...(md === 'add' ? [['orange', "$a'$"], ['green', "$a + a'$", { dash: true }]] : md === 'hom' ? [['gold', '$\\lambda a$']] : [])]);
          st = { md, A, a, b, c, D, lamv: lam.value };
        });
        v.readout(() => {
          if (!st) return '';
          const { md, A, a, b, c, D, lamv } = st, fn = A ? '|\\det|' : '\\det';
          if (md === 'add') {
            const L = D(c, add(a, b)), Rr = D(c, a) + D(c, b), ok = Math.abs(L - Rr) < 1e-9;
            return `$${fn}(c, a + a') = ${tn(L, 3)}$ and $${fn}(c, a) + ${fn}(c, a') = ${zt(D(c, a))} + ${zt(D(c, b))} = ${tn(Rr, 3)}$: ${ok ? 'equal — linear in the second column' : '**not equal** — $|\\det|$ is not linear, because $a$ and $a\'$ lie on opposite sides of the line'}.`;
          }
          if (md === 'hom') {
            const L = D(c, scl(a, lamv)), Rr = lamv * D(c, a), ok = Math.abs(L - Rr) < 1e-9;
            return `$${fn}(c, \\lambda a) = ${tn(L, 3)}$ and $\\lambda\\,${fn}(c, a) = ${zt(lamv, 2)}\\cdot ${zt(D(c, a))} = ${tn(Rr, 3)}$: ${ok ? 'equal' : '**not equal** — for $\\lambda < 0$ the unsigned area cannot change sign'}.`;
          }
          const eq = Math.hypot(a[0] - c[0], a[1] - c[1]) < 1e-9;
          return eq ? `The columns are equal and $${fn}(c, c) = ${tn(D(c, a), 3)}$: a matrix with two equal columns has determinant $0$. (Swapping two different columns would multiply $\\det$ by $-1$.)` : `Drag $a$ onto $c$ (it snaps) or press *set* $a = c$: then $${fn}(c, a) = 0$. Meanwhile $\\det(c, a) = ${tn(det2(c, a), 3)}$ and $\\det(a, c) = ${tn(det2(a, c), 3)}$ — swapping the columns flips the sign.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.46
    {
      num: '9.46',
      kind: 'Theorem',
      name: 'Formula for determinant of a matrix',
      statement: String.raw`Suppose $n$ is a positive integer and $A$ is an $n$-by-$n$ matrix. Then
$$\det A = \sum_{(j_1, \dots, j_n) \in \operatorname{perm} n} \big(\operatorname{sign}(j_1, \dots, j_n)\big)\,A_{j_1,1} \cdots A_{j_n,n}.$$
For instance $\det A = A_{1,1}A_{2,2} - A_{2,1}A_{1,2}$ when $n = 2$.`,
      idea: String.raw`Apply 9.36 with $V = \mathbf F^n$, the standard basis $e_1, \dots, e_n$, and the alternating form $\alpha(v_1, \dots, v_n) = \det\begin{pmatrix} v_1 & \cdots & v_n\end{pmatrix}$ (9.45). Taking $v_k$ to be the $k$th column of $A$, the coordinates are $b_{j,k} = A_{j,k}$, and $\alpha(e_1, \dots, e_n) = \det I = 1$. Each term picks one entry from each column, no two from the same row — a rook placement — and its sign counts the inverted pairs. The sum has $n!$ terms, so it is a definition-level formula, not an algorithm: $10!$ is over three million.`,
      caption: String.raw`Step through the $n!$ terms (▶ plays them). Left: the term for $(j_1, \dots, j_n)$ takes the gold entries $A_{j_k, k}$, one per column; each red segment joins two gold entries that form an inverted pair (the later column sits higher), so $\operatorname{sign} = (-1)^{\#\text{red}}$. Edit the entries by clicking the top or bottom half of a cell, or dragging it. Right: every term as a bar (blue $+$, red $-$) and the running sum in gold, which ends on the green line $\det A$, computed independently by row reduction. Turn the signs off to get the *permanent*: a different number, and not alternating.`,
      deps: ['ladr-9.36', 'ladr-9.45', 'ladr-9.32'],
      see: ['pma-9.33'],
      tags: ['determinants', 'permutations'],
      viz(v) {
        const M = v.M;
        const A = { 2: [[3, 1], [2, 4]], 3: [[2, -1, 3], [1, 4, -2], [-1, 2, 1]], 4: [[2, 1, 0, 3], [1, -1, 2, 0], [0, 3, 1, -2], [1, 0, 2, 1]] };
        const nS = v.select('$n$', [{ value: '2', label: '$2 \\times 2$' }, { value: '3', label: '$3 \\times 3$' }, { value: '4', label: '$4 \\times 4$' }], '3', { onChange: () => ST.reset() });
        const sg = v.toggle('include the signs', true);
        const Ms = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, minWidth: 260, title: 'one entry from each column' });
        const Bs = v.stage({ x: [0, 1], y: [-1, 1], axes: false, height: 340, minWidth: 300, weight: 1.15, title: 'the terms, and their running sum' });
        const TM = v.table(Ms, { rows: 3, cols: 3, region: [0.03, 0.24, 0.97, 0.97], maxCell: 58, size: 17, rowLabels: (j) => `$${j + 1}$`, colLabels: (k) => `$${k + 1}$` });
        editable(Ms, TM, { bump: (i, j, k) => { const B = A[nS.value]; B[i][j] = M.clamp(B[i][j] + k, -9, 9); } });
        const term = (B, p, s) => (s ? sign(p) : 1) * p.reduce((q, j, k) => q * B[j - 1][k], 1);
        const ST = v.steps({
          frames: () => perms(+nS.value).map((p, i) => ({ p, i, note: () => { const B = A[nS.value], s = sg.value; return `$${ptex(p)}$: ${invPos(p).length} inverted pair${invPos(p).length === 1 ? '' : 's'}, sign $${sign(p) > 0 ? '+1' : '-1'}$; term $${s ? (sign(p) > 0 ? '+' : '-') : ''}${p.map((j, k) => `A_{${j},${k + 1}}`).join('')} = ${tn(term(B, p, s), 2)}$`; } })),
          start: 3, still: 3, speed: 1.2, counter: 'term',
        });
        let st = null, view = 0;
        v.render(() => {
          const n = +nS.value, B = A[n], s = sg.value, fr = ST.frame, p = fr.p || perms(n)[0], i = fr.i ?? 0;
          const P = perms(n), terms = P.map((q) => term(B, q, s)), part = []; terms.reduce((acc, x, k) => (part[k] = acc + x), 0);
          const gold = new Set(p.map((j, k) => `${j - 1},${k}`));
          TM.draw({ rows: n, cols: n, value: (r, c) => B[r][c], fill: (r, c) => (gold.has(`${r},${c}`) ? ['gold', 0.45] : null), weight: (r, c) => (gold.has(`${r},${c}`) ? 700 : 500), textColor: (r, c) => (gold.has(`${r},${c}`) ? 'ink' : 'muted') });
          const rr = TM.geo ? 0.3 * TM.geo.cw : 12;
          for (const [k, l] of invPos(p)) {
            const a = TM.cellCenter(p[k] - 1, k), b = TM.cellCenter(p[l] - 1, l), A_ = [Ms.X(a[0]), Ms.Y(a[1])], B_ = [Ms.X(b[0]), Ms.Y(b[1])], Lp = Math.hypot(B_[0] - A_[0], B_[1] - A_[1]);
            const e = [(B_[0] - A_[0]) / Lp, (B_[1] - A_[1]) / Lp], P1 = Ms.inv(A_[0] + e[0] * rr, A_[1] + e[1] * rr), P2 = Ms.inv(B_[0] - e[0] * rr, B_[1] - e[1] * rr);
            Ms.line(P1[0], P1[1], P2[0], P2[1], { color: 'red', width: 2.6, alpha: 0.85 }); Ms.dot(P1[0], P1[1], { r: 3, color: 'red' }); Ms.dot(P2[0], P2[1], { r: 3, color: 'red' });
          }
          const N = invPos(p).length;
          Ms.tex(`${ptex(p)}\\text{: } ${N}\\text{ red, so } \\operatorname{sign} = ${sign(p) > 0 ? '+1' : '-1'}`, 0.5, 0.11, { size: 15, color: sign(p) > 0 ? 'blue' : 'red' });
          // the bars and the running sum
          const det = M.det(B), all = [...terms, ...part, det], NL = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 40, 60, 80, 100, 150, 200, 300, 400];
          const hi = nice(1.1 * Math.max(1, ...all), NL), mn = Math.min(0, ...all), lo = mn < -0.05 * hi ? -nice(1.1 * -mn, NL) : -0.15 * hi;
          const key = `${lo}|${hi}`;
          if (key !== view) { view = key; Bs.setView([0, 1], [lo - 0.06 * (hi - lo), hi + 0.06 * (hi - lo)]); }
          const m = P.length, x0 = 0.1, wd = 0.86 / m, X = (k) => x0 + wd * (k + 0.5);
          Bs.line(0.06, 0, 0.98, 0, { color: 'muted', width: 1 });
          Bs.line(0.06, lo, 0.06, hi, { color: 'muted', width: 1 });
          for (const t of [hi, hi / 2, 0, ...(lo < -0.2 * hi ? [lo / 2, lo] : [])]) { Bs.line(0.05, t, 0.07, t, { color: 'muted', width: 1 }); Bs.text(pn(t, 1), 0.045, t, { align: 'right', size: 10, color: 'muted' }); }
          Bs.line(0.06, det, 0.98, det, { color: 'green', width: 1.8, dash: [6, 4] });
          Bs.text(`det A = ${pn(det, 2)}`, 0.97, det, { align: 'right', size: 12, weight: 700, color: 'green', dy: det >= 0 ? -10 : 10 });
          terms.forEach((x, k) => {
            const c = s ? (sign(P[k]) > 0 ? 'blue' : 'red') : 'teal', on = k <= i;
            Bs.rect(X(k) - wd * 0.36, 0, X(k) + wd * 0.36, x, { fill: c, fillAlpha: on ? 0.6 : 0.12, color: c, width: k === i ? 2.4 : 0.8, alpha: on ? 1 : 0.4 });
          });
          Bs.path(part.slice(0, i + 1).map((y, k) => [X(k), y]), { color: 'gold', width: 2.4 });
          Bs.dots(part.slice(0, i + 1).map((y, k) => [X(k), y]), { r: 3, color: 'gold' });
          Bs.dot(X(i), part[i], { r: 6, color: 'gold' });
          v.legend([...(s ? [['blue', 'term, sign $+1$', { area: true }], ['red', 'term, sign $-1$', { area: true }]] : [['teal', 'term without its sign', { area: true }]]), ['gold', 'running sum'], ['green', '$\\det A$ by row reduction', { dash: true }]]);
          st = { n, s, sum: part[m - 1], det, i, m, partial: part[i], B };
        });

        v.readout(() => {
          if (!st) return '';
          const { n, s, sum, det, i, m, partial, B } = st;
          const head = `After ${i + 1} of the $${n}! = ${m}$ terms the running sum is $${tn(partial, 2)}$; the full sum is $${tn(sum, 3)}$`;
          if (s) return `${head}, and $\\det A = ${tn(det, 3)}$ by row reduction — ${Math.abs(sum - det) < 1e-9 * Math.max(1, Math.abs(det)) ? 'the same' : 'different'}.`;
          const C = B.map((r) => [r[0], r[0], ...r.slice(2)]);
          return `${head} without the signs — the *permanent* — while $\\det A = ${tn(det, 3)}$. The permanent is not alternating: with column 2 replaced by column 1 it gives $${tn(permSum(C, false), 2)}$, not $0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.48
    {
      num: '9.48',
      kind: 'Theorem',
      name: 'Determinant of upper-triangular matrix',
      statement: String.raw`Suppose $A$ is an upper-triangular matrix with $\lambda_1, \dots, \lambda_n$ on the diagonal. Then
$$\det A = \lambda_1 \cdots \lambda_n.$$`,
      idea: String.raw`In the formula 9.46, a permutation $(j_1, \dots, j_n)$ other than $(1, \dots, n)$ has $j_k > k$ for some $k$ (the entries cannot all satisfy $j_k \le k$ unless $j_k = k$ for every $k$), and then the factor $A_{j_k,k}$ lies below the diagonal, so it is $0$. Only the identity permutation survives, contributing $A_{1,1}\cdots A_{n,n} = \lambda_1 \cdots \lambda_n$. Geometrically, upper-triangular means $Ae_k \in \operatorname{span}(e_1, \dots, e_k)$: the image of the unit cube is a sheared box whose base $P(Ae_1, Ae_2)$ has area $\lambda_1\lambda_2$ and whose height above the base is $\lambda_3$.`,
      caption: String.raw`The columns of an upper-triangular $A$: $Ae_1$ slides along the $x$-axis (length $\lambda_1$), $Ae_2$ moves in the $xy$-plane, $Ae_3$ anywhere (drag the background to rotate). The shaded box is the image of the unit cube; its orange base has area $\lambda_1\lambda_2$ and the dashed drop line from $Ae_3$ is the height $\lambda_3$, so its volume is the volume of the dashed green box with edges $\lambda_1, \lambda_2, \lambda_3$, however the box is sheared. Right: the six terms of the formula — all but one contain an entry below the diagonal, which is $0$. Turn on the toggle to lift $Ae_1$ off the $x$-axis (then drag it anywhere): $A$ is no longer triangular, other terms come alive, and $\det A \ne \lambda_1\lambda_2\lambda_3$.`,
      deps: ['ladr-9.46', 'ladr-5.38'],
      see: ['ladr-5.41'],
      tags: ['determinants', 'triangular'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-1.15, 2.45], y: [-1.3, 2.2], equal: true, axes: false, height: 400, weight: 1.3, minWidth: 310 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 270, title: 'the six terms of the formula 9.46' });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.3, axis: 1.5, lim: 1.6 });
        const g = (p) => p.map((x) => Math.round(x * 20) / 20);
        const H1 = sc.handle([1.05, 0, 0], { mode: 'line', d: [1, 0, 0], color: CC[0], label: 'Ae₁', snap: g });
        const H1f = sc.handle([1.05, 0, 0], { color: CC[0], label: 'Ae₁', snap: g });
        const H2 = sc.handle([0.45, 0.85, 0], { mode: 'plane', a: [1, 0, 0], b: [0, 1, 0], color: CC[1], label: 'Ae₂', snap: g });
        const H3 = sc.handle([0.3, 0.3, 0.8], { color: CC[2], label: 'Ae₃', snap: g });
        H1f.visible = false;
        const free = v.toggle('let $Ae_1$ leave the $x$-axis (not upper triangular)', false, {
          onChange: (on) => { if (on) { H1f.set(add(H1.p, [0, -0.35, 0.45])); H1f.visible = true; H1.visible = false; } else { H1.set([H1f.p[0], 0, 0]); H1.visible = true; H1f.visible = false; } },
        });
        const P = perms(3);
        let st = null;
        v.render(() => {
          const c1 = free.value ? H1f.p : H1.p, C = [c1, H2.p, H3.p], A = fromCols(C), d = det3(...C);
          const lam = [A[0][0], A[1][1], A[2][2]], prodD = lam[0] * lam[1] * lam[2];
          sc.begin();
          ppedEdges(sc, [1, 0, 0], [0, 1, 0], [0, 0, 1], { color: 'muted', width: 1, dash: [2, 4], alpha: 0.5 });
          if (!free.value) ppedEdges(sc, [lam[0], 0, 0], [0, lam[1], 0], [0, 0, lam[2]], { color: 'green', width: 1.4, dash: [6, 4], alpha: 0.8 });
          pped(sc, C[0], C[1], C[2], { fill: oriCol(d, 1e-3), color: oriCol(d, 1e-3), fillAlpha: 0.1, alpha: 0.55 });
          if (!free.value) {
            sc.poly([ZERO, C[0], add(C[0], C[1]), C[1]], { fill: 'orange', color: 'orange', fillAlpha: 0.3, alpha: 0.9, bias: -0.01 });
            sc.line(C[2], [C[2][0], C[2][1], 0], { color: CC[2], width: 2, dash: [4, 3] }, 1);
          }
          C.forEach((c, k) => sc.arrow(ZERO, c, { color: CC[k], width: 3.2 }));
          sc.flush();
          S.corner(free.value ? 'not upper triangular' : 'Aeₖ ∈ span(e₁, …, eₖ): upper triangular', 'tl', { color: free.value ? 'red' : 'muted', weight: 700, size: 12 });
          // terms
          R.tex(`A = ${mtex(A, 2)}`, 0.5, 0.86, { size: 15 });
          const rows = P.map((p) => {
            const val = sign(p) * p.reduce((q, j, k) => q * A[j - 1][k], 1);
            const below = p.findIndex((j, k) => j > k + 1);
            return { p, val, below };
          });
          rows.forEach((r, i) => {
            const y = 0.66 - 0.078 * i, id = r.below < 0, zero = Math.abs(r.val) < 1e-9;
            R.tex(`${sign(r.p) > 0 ? '+' : '-'}${r.p.map((j, k) => `A_{${j},${k + 1}}`).join('')}`, 0.05, y, { align: 'left', size: 14, color: id ? 'green' : zero ? 'muted' : 'red' });
            R.text(pn(r.val, 3), 0.62, y, { align: 'right', size: 12.5, weight: 600, color: id ? 'green' : zero ? 'muted' : 'red' });
            if (!id) R.text(`A${sb(r.p[r.below])},${sb(r.below + 1)} below diag.`, 0.66, y, { size: 11.5, color: zero ? 'faint' : 'red' });
          });
          R.line(0.04, 0.66 - 0.078 * 5.6, 0.96, 0.66 - 0.078 * 5.6, { color: 'muted', width: 1 });
          R.tex(`\\det A = ${tn(d, 3)}`, 0.27, 0.13, { size: 15, color: oriCol(d, 1e-3) });
          R.tex(`\\lambda_1\\lambda_2\\lambda_3 = ${tn(prodD, 3)}`, 0.73, 0.13, { size: 15, color: Math.abs(d - prodD) < 1e-9 ? 'green' : 'red' });
          st = { d, prodD, A, ev: M.eig(A, { vectors: false }).values, free: free.value };
        });
        v.legend([['orange', 'base $P(Ae_1, Ae_2)$, area $\\lambda_1\\lambda_2$', { area: true }], ['green', 'box with edges $\\lambda_1, \\lambda_2, \\lambda_3$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { d, prodD, ev, free } = st;
          const evs = ev.map((z) => (Math.abs(z.im) < 1e-9 ? tn(z.re, 3) : `${tn(z.re, 3)} ${z.im < 0 ? '-' : '+'} ${tn(Math.abs(z.im), 3)}i`)).join(',\\ ');
          const pe = ev.reduce((q, z) => [q[0] * z.re - q[1] * z.im, q[0] * z.im + q[1] * z.re], [1, 0])[0];
          if (!free) return `$\\det A = ${tn(d, 3)} = \\lambda_1\\lambda_2\\lambda_3$: only the identity term survives. The eigenvalues of a triangular matrix are its diagonal entries (5.41) — here $${evs}$ — so the determinant is also their product.`;
          return `$A$ is not upper triangular: $\\det A = ${tn(d, 3)}$ but the product of the diagonal entries is $${tn(prodD, 3)}$${Math.abs(d - prodD) < 1e-9 ? ' (equal only by accident)' : ''}. The eigenvalues $${evs}$ are no longer the diagonal entries, yet their product $${tn(pe, 3)}$ still equals $\\det A$ (9.55).`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.49
    {
      num: '9.49',
      kind: 'Theorem',
      name: 'Determinant is multiplicative',
      statement: String.raw`(a) Suppose $S, T \in \mathcal L(V)$. Then $\det(ST) = (\det S)(\det T)$.

(b) Suppose $A$ and $B$ are square matrices of the same size. Then $\det(AB) = (\det A)(\det B)$.`,
      idea: String.raw`For $\alpha \in V^{(\dim V)}_{\mathrm{alt}}$: $\alpha_{ST}(v_1, \dots, v_n) = \alpha(STv_1, \dots, STv_n) = (\det S)\,\alpha(Tv_1, \dots, Tv_n) = (\det S)(\det T)\,\alpha(v_1, \dots, v_n)$, applying the definition of $\det S$ to the vectors $Tv_k$ and then that of $\det T$. So $\alpha_{ST} = (\det S)(\det T)\,\alpha$, which is (a). For (b), take $S, T$ with matrices $A, B$; then $AB$ is the matrix of $ST$ (3.43). No formula for the determinant is needed: $T$ scales every signed area by $\det T$ and $S$ then scales by $\det S$.`,
      caption: String.raw`Drag $Te_1, Te_2$ in the middle panel and $Se_1, Se_2$ in the right one (the faint dashed parallelogram is $S$ applied to the unit square, of area $\det S$), and drag the gold blob in the left panel. $T$ multiplies the signed area of the unit square and of the blob by $\det T$; $S$ multiplies the result by $\det S$; the readout compares $\det(ST)$, computed from the product matrix, with $(\det S)(\det T)$. Choose *add* to see that the determinant is not additive: the area of $(S + T)$(square) is not $\det S + \det T$.`,
      deps: ['ladr-9.41', 'ladr-3.43'],
      see: ['pma-9.35'],
      tags: ['determinants'],
      viz(v) {
        const M = v.M;
        const A = v.stage({ x: [-1.6, 2.6], y: [-1.6, 2.6], equal: true, height: 290, minWidth: 240, ticks: false, title: '$V$' });
        const B = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 290, minWidth: 240, ticks: false, title: '$T(V)$' });
        const C = v.stage({ x: [-4.2, 4.2], y: [-4.2, 4.2], equal: true, height: 290, minWidth: 240, ticks: false, title: '$S(T(V))$' });
        const mode = v.select('', [{ value: 'st', label: 'compose: $ST$' }, { value: 'sum', label: 'add: $S + T$' }], 'st');
        const HT = colHandles(B, [[1.2, -0.5], [0.4, 1.1]], { l1: 'Te₁', l2: 'Te₂' });
        const HS = colHandles(C, [[1.3, 0.6], [-0.3, 1.5]], { l1: 'Se₁', l2: 'Se₂', c1: 'orange', c2: 'purple' });
        const hb = A.handle(-0.8, 1.4, { color: 'gold', r: 6 });
        const SQ = [[0, 0], [1, 0], [1, 1], [0, 1]];
        let st = null;
        v.render(() => {
          const T = HT.A, Sm = HS.A, sum = mode.value === 'sum';
          C.setTitle(sum ? '$(S + T)(V)$' : '$S(T(V))$');
          const blob = M.blob(hb.x, hb.y, 0.42, 3, 0.3, 120);
          const map = (X, P) => P.map((p) => mv(X, p)), ST = mm(Sm, T), SpT = madd(Sm, T);
          const lbl = (S, P, txt, col) => { const c = P.reduce((s, p) => add(s, p), [0, 0]).map((x) => x / P.length); S.tex(txt, c[0], c[1], { color: col, size: 13 }); };
          // V
          gridImage(A, (p) => p, 3);
          A.poly(SQ, { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 1.5 });
          A.poly(blob, { fill: 'gold', fillAlpha: 0.35, color: 'gold', width: 1.4 });
          lbl(A, SQ, '1', 'accent');
          // T(V)
          gridImage(B, (p) => mv(T, p), 2);
          const dT = dett(T), dS = dett(Sm);
          B.poly(map(T, SQ), { fill: oriCol(dT, 1e-9), fillAlpha: 0.25, color: oriCol(dT, 1e-9), width: 1.5 });
          B.poly(map(T, blob), { fill: 'gold', fillAlpha: 0.35, color: 'gold', width: 1.4 });
          lbl(B, map(T, SQ), tn(dT, 2), oriCol(dT, 1e-9));
          // S(T(V)) or (S + T)(V)
          const X = sum ? SpT : ST, dX = dett(X);
          gridImage(C, (p) => mv(X, p), 2);
          C.poly(map(Sm, SQ), { color: 'purple', width: 1.4, dash: [5, 4] });
          C.poly(map(X, SQ), { fill: oriCol(dX, 1e-9), fillAlpha: 0.25, color: oriCol(dX, 1e-9), width: 1.5 });
          if (!sum) C.poly(map(X, blob), { fill: 'gold', fillAlpha: 0.35, color: 'gold', width: 1.4 });
          lbl(C, map(X, SQ), tn(dX, 2), oriCol(dX, 1e-9));
          C.corner(`det S = ${pn(dS, 2)} (dashed)`, 'bl', { color: 'purple', weight: 600, size: 11.5 });
          st = { sum, dT, dS, dX, a0: area(blob), a1: area(map(T, blob)), a2: area(map(ST, blob)), dTS: dett(mm(T, Sm)), comm: Math.max(...mm(T, Sm).flat().map((x, i) => Math.abs(x - ST.flat()[i]))) };
        });
        v.legend([['accent', 'unit square and its images (label: signed area)', { area: true }], ['gold', 'a blob and its images', { area: true }], ['red', 'orientation reversed', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { sum, dT, dS, dX, a0, a1, a2, dTS, comm } = st;
          if (sum) return `$\\det(S + T) = ${tn(dX, 3)}$, but $\\det S + \\det T = ${zt(dS)} + ${zt(dT)} = ${tn(dS + dT, 3)}$: the determinant is multiplicative, not additive.`;
          return `$\\det T = ${tn(dT, 3)}$, $\\det S = ${tn(dS, 3)}$, and $\\det(ST) = ${tn(dX, 3)}$ from the product matrix $= (\\det S)(\\det T) = ${tn(dS * dT, 3)}$. The blob: signed area $${tn(a0, 3)} \\to ${tn(a1, 3)} \\to ${tn(a2, 3)}$, ratios $${tn(a1 / a0, 4)}$ and $${tn(a2 / a1, 4)}$. Also $\\det(TS) = ${tn(dTS, 3)}$, the same, although ${comm > 1e-9 ? '$TS \\ne ST$' : '$TS = ST$ here'}.`;
        });
      },
    },
  ],
};
