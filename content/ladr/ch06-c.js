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
    // ------------------------------------------------------------------ 6.54
    {
      num: '6.54',
      kind: 'Theorem',
      name: 'U⊥ = {0} ⟺ U = V for finite-dimensional U',
      statement: String.raw`Suppose $U$ is a finite-dimensional subspace of $V$. Then $$U^\perp=\{0\}\iff U=V.$$`,
      idea: String.raw`If $U^\perp=\{0\}$, then 6.52 and 6.48(b) give $U=(U^\perp)^\perp=\{0\}^\perp=V$. Conversely, if $U=V$ then $U^\perp=V^\perp=\{0\}$ by 6.48(c). In practice this is a test: to show that a subspace is everything, show that the only vector orthogonal to it is $0$. The finite-dimensionality of $U$ matters — in the space of continuous functions on $[-1,1]$ the polynomials form a proper subspace whose orthogonal complement is $\{0\}$.`,
      caption: String.raw`The sphere is the set of unit vectors in $\mathbf R^3$. Each spanning vector $u_k$ of $U$ cuts out a great circle: the unit vectors orthogonal to it. A unit vector in $U^\perp$ must lie on every circle at once (green). With three vectors spanning $\mathbf R^3$ each pair of circles still meets (small rings), but never all three at one point. With one vector that is a whole circle; with two independent vectors, two antipodal points $\pm w$; with three, no common point is left, so $U^\perp=\{0\}$. Drag $u_3$ into the plane of $u_1,u_2$ (it snaps): $U$ is no longer all of $\mathbf R^3$ and the common points $\pm w$ reappear.`,
      deps: ['ladr-6.52', 'ladr-6.48'],
      tags: ['orthogonality'],
      viz(v) {
        const S = v.stage({ x: [-1.75, 1.75], y: [-1.65, 1.65], equal: true, axes: false, height: 430 });
        const sc = v.scene3(S, { yaw: -0.65, pitch: 0.35, axis: 1.4, lim: 1.35 });
        const kS = v.select('$U = \\operatorname{span}$ of', [{ value: '1', label: '$u_1$' }, { value: '2', label: '$u_1, u_2$' }, { value: '3', label: '$u_1, u_2, u_3$' }], '3');
        const H = [
          sc.handle([0.42, 0.02, 0.95], { color: 'blue', label: 'u₁' }),
          sc.handle([-0.38, -0.97, 0.06], { color: 'purple', label: 'u₂', snap: (p) => snapSpan(p, orth([H[0].p]), 0.1) }),
          sc.handle([0.9, -0.35, -0.35], { color: 'teal', label: 'u₃', snap: (p) => snapSpan(p, orth([H[0].p, H[1].p]), 0.12) }),
        ];
        v.legend([['blue', 'circle of unit vectors $\\perp u_k$ (one colour each)'], ['green', 'unit vectors in $U^\\perp$'], ['muted', 'back of the sphere', { dash: true }]]);
        let st = null;
        v.render(() => {
          const k = +kS.value, us = H.slice(0, k).map((h) => h.p);
          H.forEach((h, i) => { h.visible = i < k; });
          const B = orth(us), W = compl(B);
          sc.begin();
          S.circle(0, 0, 1, { color: 'muted', width: 1.3, alpha: 0.7, fill: 'muted', fillAlpha: 0.04 });
          const great = (a, b, col, w) => {
            for (let i = 0; i < 96; i++) {
              const t0 = (2 * Math.PI * i) / 96, t1 = (2 * Math.PI * (i + 1)) / 96;
              const p = add3(mul3(a, Math.cos(t0)), mul3(b, Math.sin(t0))), q = add3(mul3(a, Math.cos(t1)), mul3(b, Math.sin(t1)));
              const back = sc.P(mul3(add3(p, q), 0.5))[2] > 0;
              sc.line(p, q, back ? { color: col, width: 1.1, alpha: 0.45, dash: [3, 4] } : { color: col, width: w, alpha: 0.95 }, 1);
            }
          };
          us.forEach((u, i) => { if (len3(u) > 1e-6) { const [a, b] = perp(u); great(a, b, VC[i], 2.4); } });
          if (W.length === 2) great(W[0], W[1], 'green', 4.2);
          us.forEach((u, i) => sc.arrow(ZERO, u, { color: VC[i], width: 2.8 }));
          if (k === 3 && W.length === 0) for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) {
            const c = unit3(cross(us[i], us[j]));
            if (len3(c) > 0.5) for (const s of [1, -1]) { const q = mul3(c, s); sc.dot(q, { r: 4.5, color: sc.P(q)[2] > 0 ? 'muted' : 'ink', hollow: true, width: 1.6 }); }
          }
          if (W.length === 1) {
            const w = W[0];
            sc.line(mul3(w, -1.5), mul3(w, 1.5), { color: 'green', width: 1.4, dash: [5, 4], alpha: 0.8 });
            for (const s of [1, -1]) { sc.dot(mul3(w, s), { r: 8, color: 'green' }); sc.tex(s > 0 ? 'w' : '-w', mul3(w, s), { color: 'green', dx: 15, dy: -12, size: 15 }); }
          }
          if (W.length === 0) S.corner('the circles have no common point: U⊥ = {0}', 'tl', { color: 'green', weight: 600 });
          else S.corner(`dim U = ${B.length}: U⊥ is ${['', 'a line', 'a plane', ''][W.length]}`, 'tl', { color: 'muted' });
          sc.flush();
          st = { k, dU: B.length, dW: W.length };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, dU, dW } = st;
          if (dW === 0) return `$\\dim U = 3$: $U = \\mathbf R^3$, and no unit vector is orthogonal to all of $u_1, u_2, u_3$ — $U^\\perp = \\{0\\}$, as the theorem predicts.`;
          return `$\\dim U = ${dU}$${dU < k ? ` (only ${dU} of the ${k} vectors are independent)` : ''}, so $U \\ne \\mathbf R^3$ — and indeed $U^\\perp$ contains nonzero vectors: ${dW === 1 ? 'the line through $\\pm w$' : 'a whole plane, cutting the sphere in the green circle'}, $\\dim U^\\perp = ${dW}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.55
    {
      num: '6.55',
      kind: 'Definition',
      name: 'Orthogonal projection P_U',
      statement: String.raw`Suppose $U$ is a finite-dimensional subspace of $V$. The **orthogonal projection** of $V$ onto $U$ is the operator $P_U\in\mathcal L(V)$ defined as follows: for $v\in V$, write $v=u+w$ with $u\in U$ and $w\in U^\perp$, and set $$P_Uv=u.$$`,
      idea: String.raw`The decomposition $v=u+w$ exists and is unique because $V=U\oplus U^\perp$ (6.49), so $P_Uv$ is well defined. Geometrically $P_Uv$ is the foot of the perpendicular dropped from $v$ to $U$ — the shadow of $v$ when light falls along $U^\perp$. For a line, $U=\operatorname{span}(u)$, the formula is $P_Uv=\frac{\langle v,u\rangle}{\|u\|^2}u$.`,
      caption: String.raw`The blue plane $U$ can be tilted by dragging its normal $n$. The gold cube is centred at $v$ (drag it); its shadow on $U$ is cast by light travelling along $U^\perp$, so every point drops straight down: $P_Uv$ is the foot of the perpendicular, and $v-P_Uv$ lies on the green line $U^\perp$. Switch to **oblique**: light along a slanted direction still lands in $U$ and projecting twice still changes nothing, but the remainder is no longer orthogonal to $U$ — that map is a projection, but not $P_U$ (whose foot stays marked in green).`,
      deps: ['ladr-6.49'],
      see: ['fa-12.14'],
      tags: ['projections'],
      viz(v) {
        const S = v.stage({ x: [-1.85, 1.85], y: [-1.75, 1.75], equal: true, axes: false, height: 440 });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.42, axis: 1.4, lim: 1.4 });
        const kind = v.select('light', [{ value: 'orth', label: 'along $U^\\perp$ (orthogonal)' }, { value: 'obl', label: 'oblique' }], 'orth');
        const N = sc.handle(mul3(unit3([0.15, -0.25, 0.95]), 1.15), { color: 'green', label: 'n', snap: (p) => (len3(p) < 0.4 ? mul3(unit3(p.some((c) => c) ? p : [0, 0, 1]), 0.4) : p) });
        const Vh = sc.handle([0.55, 0.3, 1.05], { color: 'gold', label: 'v' });
        const RT = (() => { const a = 0.5, b = 0.35, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b); return [[ca, -sa * cb, sa * sb], [sa, ca * cb, -ca * sb], [0, sb, cb]]; })();
        const H = 0.26, corners = [];
        for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) corners.push(mv(RT, [x * H, y * H, z * H]));
        const faces = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
        v.legend([['blue', '$U$', { area: true }], ['green', '$U^\\perp$'], ['gold', '$v$ and the cube'], ['muted', 'light rays', { dash: true }], ['red', 'remainder not $\\perp U$', { dash: true }]]);
        let st = null;
        v.render(() => {
          const n = unit3(N.p), [a, b] = perp(n), obl = kind.value === 'obl';
          const d = obl ? unit3(add3(n, mul3(a, 0.85))) : n;
          const P = (x) => sub3(x, mul3(d, dot3(x, n) / dot3(d, n)));
          const c = Vh.p, pts = corners.map((q) => add3(c, q)), sh = pts.map(P);
          sc.begin();
          sc.disc(a, b, 1.35, { fill: 'blue', color: 'blue', fillAlpha: 0.1, grid: true });
          sc.line(mul3(n, -1.6), mul3(n, 1.6), { color: 'green', width: 2.2, alpha: 0.65 }, 12);
          // the shadow: convex hull of the projected corners, in plane coordinates
          const hull = v.M.hull(sh.map((p) => [dot3(p, a), dot3(p, b)])).map(([s, t]) => add3(mul3(a, s), mul3(b, t)));
          sc.poly(hull, { fill: 'ink', color: 'ink', fillAlpha: 0.16, alpha: 0.45, width: 1 });
          [0, 3, 5, 6].forEach((i) => sc.line(pts[i], sh[i], { color: 'muted', width: 1, dash: [3, 4], alpha: 0.8 }));
          faces.forEach((f) => sc.poly(f.map((i) => pts[i]), { fill: 'gold', color: 'gold', fillAlpha: 0.13, alpha: 0.85, width: 1.3 }));
          const u = P(c), w = sub3(c, u), perpOK = Math.abs(dot3(w, a)) < 1e-9 && Math.abs(dot3(w, b)) < 1e-9;
          sc.arrow(ZERO, u, { color: 'blue', width: 3, head: 10 }); sc.tex(obl ? 'Pv' : 'P_Uv', u, { color: 'blue', dx: -22, dy: 16, size: 14 });
          if (obl) { const t = sub3(c, mul3(n, dot3(c, n))); sc.dot(t, { r: 5, color: 'green' }); sc.line(c, t, { color: 'green', width: 1.2, alpha: 0.6, dash: [2, 3] }); sc.tex('P_Uv', t, { color: 'green', dx: 18, dy: 12, size: 12.5 }); }
          sc.line(c, u, { color: perpOK ? 'green' : 'red', width: 2.4, dash: perpOK ? null : [5, 3] });
          if (!obl && len3(w) > 0.08 && len3(u) > 0.08) corner3(sc, u, unit3(mul3(u, -1)), unit3(w), 0.12, { color: 'ink' });
          sc.arrow(ZERO, c, { color: 'gold', width: 2.4, head: 9 });
          sc.flush();
          const PP = P(u);
          st = { u, w, ip: [dot3(w, a), dot3(w, b)], obl, idem: len3(sub3(PP, u)), inU: Math.abs(dot3(u, n)), dOrth: Math.abs(dot3(c, n)), dHere: len3(w) };
        });
        v.readout(() => {
          if (!st) return '';
          const { u, w, ip, obl, idem, inU, dOrth, dHere } = st;
          const base = `$v = ${vt(add3(u, w))}$ splits as $u = ${vt(u)}$ in $U$ (its normal component is $${zs(inU)}$) plus $w = v-u$ with $\\langle w,e_1\\rangle = ${tn(ip[0], 3)}$, $\\langle w,e_2\\rangle = ${tn(ip[1], 3)}$ for an orthonormal basis $e_1,e_2$ of $U$. `;
          if (!obl) return base + `So $w\\in U^\\perp$ and $P_Uv = u$; the decomposition is the unique one from $V = U\\oplus U^\\perp$.`;
          return base + `The oblique map also lands in $U$ and is idempotent ($\\|P(Pv)-Pv\\| = ${zs(idem)}$), but $w\\notin U^\\perp$, so it is not $P_U$. Its remainder has length $${tn(dHere, 3)}$, longer than the perpendicular distance $${tn(dOrth, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.57
    {
      num: '6.57',
      kind: 'Theorem',
      name: 'Properties of orthogonal projection P_U',
      statement: String.raw`Suppose $U$ is a finite-dimensional subspace of $V$. Then
(a) $P_U\in\mathcal L(V)$;
(b) $P_Uu=u$ for every $u\in U$;
(c) $P_Uw=0$ for every $w\in U^\perp$;
(d) $\operatorname{range}P_U=U$;
(e) $\operatorname{null}P_U=U^\perp$;
(f) $v-P_Uv\in U^\perp$ for every $v\in V$;
(g) $P_U^2=P_U$;
(h) $\|P_Uv\|\le\|v\|$ for every $v\in V$;
(i) if $e_1,\dots,e_m$ is an orthonormal basis of $U$ and $v\in V$, then $P_Uv=\langle v,e_1\rangle e_1+\dots+\langle v,e_m\rangle e_m$.`,
      idea: String.raw`Everything follows from the unique decomposition $v=u+w$, $u\in U$, $w\in U^\perp$ (6.49). Decompositions add and scale, so $P_U$ is linear (a). For $u\in U$ the decomposition is $u+0$, and for $w\in U^\perp$ it is $0+w$, giving (b), (c), and from them (d), (e). (f) says $v-P_Uv=w$. (g): $P_U(P_Uv)=P_Uu=u$. (h) is Pythagoras (6.12): $\|v\|^2=\|u\|^2+\|w\|^2\ge\|u\|^2$. (i) is the explicit decomposition in the proof of 6.49.`,
      caption: String.raw`Drag $v$ (gold). $P_Uv$ is built by formula (i) from the orthonormal basis $e_1,e_2$ of the blue plane: the purple and teal pieces $\langle v,e_k\rangle e_k$ add up to $P_Uv$. Turn the basis with $\theta$ — the pieces change, their sum does not. The panel on the right checks every property numerically, and the bar shows $\|v\|^2=\|P_Uv\|^2+\|v-P_Uv\|^2$, which is (h). Drag $v$ into the plane or onto the green line (it snaps there) to watch (b), (c) and (e) in action.`,
      deps: ['ladr-6.55', 'ladr-6.49', 'ladr-6.12'],
      tags: ['projections'],
      viz(v) {
        const S = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], equal: true, axes: false, height: 430, weight: 1.15 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.4, axis: 1.4, lim: 1.4 });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 430, weight: 0.85, minWidth: 270, title: 'the nine properties, checked' });
        const th = v.slider('basis angle $\\theta$ in $U$', 0, 360, 75, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const n = unit3([0.35, -0.45, 0.82]), [a0, b0] = perp(n);
        const Vh = sc.handle([0.75, 0.35, 0.95], { color: 'gold', label: 'v', snap: (p) => { const t = dot3(p, n); if (Math.abs(t) < 0.09) return sub3(p, mul3(n, t)); const q = mul3(n, t); return len3(sub3(p, q)) < 0.09 ? q : p; } });
        const r = [0.3, -0.8, 0.45];                                   // a fixed second vector for the linearity test
        v.legend([['blue', '$U$ and $P_Uv$'], ['purple', '$\\langle v,e_1\\rangle e_1$', { dash: true }], ['teal', '$\\langle v,e_2\\rangle e_2$', { dash: true }], ['green', '$v-P_Uv\\in U^\\perp$']]);
        let st = null;
        v.render(() => {
          const t = (th.value * Math.PI) / 180, e1 = add3(mul3(a0, Math.cos(t)), mul3(b0, Math.sin(t))), e2 = add3(mul3(a0, -Math.sin(t)), mul3(b0, Math.cos(t)));
          const P = (x) => add3(mul3(e1, dot3(x, e1)), mul3(e2, dot3(x, e2)));        // formula (i)
          const Pdef = (x) => sub3(x, mul3(n, dot3(x, n)));                               // the decomposition v = u + w, w ∈ U⊥ = span(n)
          const x = Vh.p, px = P(x), w = sub3(x, px), c1 = mul3(e1, dot3(x, e1)), c2 = mul3(e2, dot3(x, e2));
          sc.begin();
          sc.disc(a0, b0, 1.3, { fill: 'blue', color: 'blue', fillAlpha: 0.1, grid: true });
          sc.line(mul3(n, -1.6), mul3(n, 1.6), { color: 'green', width: 2, alpha: 0.6 }, 12);
          sc.arrow(ZERO, e1, { color: 'muted', width: 1.5, head: 7 }); sc.tex('e_1', e1, { color: 'muted', dx: 10, dy: 12, size: 13 });
          sc.arrow(ZERO, e2, { color: 'muted', width: 1.5, head: 7 }); sc.tex('e_2', e2, { color: 'muted', dx: 10, dy: 12, size: 13 });
          sc.arrow(ZERO, c1, { color: 'purple', width: 2, head: 8, dash: [5, 3] }); sc.arrow(c1, px, { color: 'teal', width: 2, head: 8, dash: [5, 3] });
          sc.line(c2, px, { color: 'muted', width: 1, dash: [2, 3] }); sc.line(ZERO, c2, { color: 'teal', width: 1, alpha: 0.5, dash: [2, 3] });
          if (len3(px) > 1e-6) { sc.arrow(ZERO, px, { color: 'blue', width: 3.2 }); sc.tex('P_Uv', px, { color: 'blue', dx: 16, dy: 14, size: 14 }); }
          else sc.dot(ZERO, { r: 6, color: 'blue' });
          if (len3(w) > 1e-6) { sc.line(px, x, { color: 'green', width: 2.6 }); if (len3(px) > 0.08 && len3(w) > 0.08) corner3(sc, px, unit3(mul3(px, -1)), unit3(w), 0.12); }
          sc.arrow(ZERO, x, { color: 'gold', width: 2.4, head: 9 });
          sc.flush();
          // the checks
          const u0 = add3(e1, mul3(e2, -0.6));
          const chk = [
            ['(a)', String.raw`\|P(2v+r)-2Pv-Pr\|`, len3(sub3(P(add3(mul3(x, 2), r)), add3(mul3(px, 2), P(r))))],
            ['(b)', String.raw`\|Pu-u\|`, len3(sub3(P(u0), u0)), null, String.raw`u=e_1-0.6e_2\in U`],
            ['(c)', String.raw`\|Pn\|`, len3(P(n)), null, String.raw`n\in U^\perp`],
            ['(d)', String.raw`\operatorname{dist}(Pv,U)`, Math.abs(dot3(px, n))],
            ['(e)', String.raw`\|Pv\| = \operatorname{dist}(v,U^\perp)`, len3(px), len3(sub3(x, mul3(n, dot3(x, n))))],
            ['(f)', String.raw`\max_k\lvert\langle v-Pv,e_k\rangle\rvert`, Math.max(Math.abs(dot3(w, e1)), Math.abs(dot3(w, e2)))],
            ['(g)', String.raw`\|P(Pv)-Pv\|`, len3(sub3(P(px), px))],
            ['(i)', String.raw`\|\textstyle\sum\langle v,e_k\rangle e_k - u\|`, len3(sub3(px, Pdef(x)))],
          ];
          chk.forEach(([lab, txt, val, val2, note], i) => {
            const y = 0.95 - i * 0.092, isE = lab === '(e)';
            const ok = isE ? Math.abs(val - val2) < 1e-9 : Math.abs(val) < 1e-9;
            Q.tex(`\\text{${lab}}`, 0.02, y, { align: 'left', color: 'muted', size: 12.5 });
            Q.tex((isE ? `${txt} = ${tn(val, 3)}` : `${txt} = ${zs(val)}`) + (note ? `\\quad {\\scriptstyle (${note})}` : ''), 0.12, y, { align: 'left', color: ok ? 'ink' : 'red', size: 12.5 });
            Q.tex(ok ? '\\checkmark' : '\\times', 0.97, y, { align: 'right', color: ok ? 'green' : 'red', size: 14 });
          });
          // (h): stacked bar of squared lengths
          const nv = dot3(x, x), np = dot3(px, px), nw = dot3(w, w), L = 0.8 / Math.max(nv, 1e-9) * Math.min(1, nv / 2.5 + 0.55);
          const y0 = 0.07, y1 = 0.13, x0 = 0.12;
          Q.tex('\\text{(h)}', 0.02, (y0 + y1) / 2 + 0.06, { align: 'left', color: 'muted', size: 12.5 });
          Q.rect(x0, y0, x0 + np * L, y1, { fill: 'blue', fillAlpha: 0.45, color: 'blue', width: 1 });
          Q.rect(x0 + np * L, y0, x0 + (np + nw) * L, y1, { fill: 'green', fillAlpha: 0.45, color: 'green', width: 1 });
          Q.rect(x0, y1 + 0.015, x0 + nv * L, y1 + 0.045, { fill: 'gold', fillAlpha: 0.5, color: 'gold', width: 1 });
          Q.tex(`\\|Pv\\|^2 = ${tn(np)} \\le \\|v\\|^2 = ${tn(nv)}`, x0, y1 + 0.1, { align: 'left', size: 12.5, color: 'ink' });
          st = { px, w, np, nv, inU: len3(w) < 1e-9, inPerp: len3(px) < 1e-9, all: chk.every(([lab, , a2, b2]) => (lab === '(e)' ? Math.abs(a2 - b2) < 1e-9 : Math.abs(a2) < 1e-9)) };
        });
        v.readout(() => {
          if (!st) return '';
          const { px, w, np, nv, inU, inPerp, all } = st;
          let s = `$P_Uv = ${vt(px)}$, $v-P_Uv = ${vt(w)}$; ${all ? 'every check passes' : 'a check fails'} for this $v$ and this basis. `;
          if (inU) s += '$v$ lies in $U$, so $P_Uv = v$ — property (b).';
          else if (inPerp) s += '$v$ lies in $U^\\perp$, so $P_Uv = 0$ — properties (c) and (e).';
          else s += `Pythagoras: $${tn(nv, 3)} = ${tn(np, 3)} + ${tn(nv - np, 3)}$, so $\\|P_Uv\\| < \\|v\\|$ unless $v\\in U$.`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 6.58
    {
      num: '6.58',
      kind: 'Theorem',
      name: 'Riesz representation theorem, revisited',
      statement: String.raw`Suppose $V$ is finite-dimensional. For $v\in V$ define $\varphi_v\in V'$ by $\varphi_v(u)=\langle u,v\rangle$. Then $v\mapsto\varphi_v$ is a one-to-one function from $V$ onto $V'$. (It is linear when $\mathbf F=\mathbf R$; when $\mathbf F=\mathbf C$ it is conjugate-linear, $\varphi_{\lambda v}=\bar\lambda\varphi_v$.)`,
      idea: String.raw`One-to-one is the uniqueness in 6.42. For onto, a new argument through complements: if $\varphi\ne0$ then $\operatorname{null}\varphi\ne V$, so $(\operatorname{null}\varphi)^\perp\ne\{0\}$ (6.49), and it is one-dimensional by 6.51 and 3.21. Pick any nonzero $w$ in it and set $v=\frac{\varphi(w)}{\|w\|^2}w$. Then $\varphi(v)=\|v\|^2$, and splitting $u=\bigl(u-\frac{\varphi(u)}{\varphi(v)}v\bigr)+\frac{\varphi(u)}{\varphi(v)}v$ — the first part lies in $\operatorname{null}\varphi$, hence is orthogonal to $v$ — gives $\langle u,v\rangle=\varphi(u)$.`,
      caption: String.raw`A functional $\varphi$ on $\mathbf R^3$ is drawn by its null plane (orange) and its level plane $\varphi=1$ (drag the dot there to change $\varphi$). The green line is $(\operatorname{null}\varphi)^\perp$. Slide the purple $w$ along that line — any nonzero choice — and the formula $v=\frac{\varphi(w)}{\|w\|^2}w$ always returns the same green vector, the representer. Since $\varphi(v)=\|v\|^2$, its tip lies on the level plane of height $\|v\|^2$. Drag the gold test vector $u$: the readout compares $\varphi(u)$ with $\langle u,v\rangle$ for every position.`,
      deps: ['ladr-6.49', 'ladr-6.42', 'ladr-3.110'],
      tags: ['duality', 'inner products'],
      viz(v) {
        const S = v.stage({ x: [-1.85, 1.85], y: [-1.8, 1.8], equal: true, axes: false, height: 430 });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.36, axis: 1.4, lim: 1.4 });
        const Fh = sc.handle([0.49, -0.163, 0.653], { color: 'accent', label: 'φ = 1', snap: (p) => (len3(p) < 0.4 ? mul3(unit3(p.some((c) => c) ? p : [0, 0, 1]), 0.4) : p) });
        const cOf = () => { const p = Fh.p, r2 = dot3(p, p); return mul3(p, 1 / r2); };
        const Wh = sc.handle(mul3(unit3(cOf()), -0.7), { mode: 'line', d: unit3(cOf()), color: 'purple', label: 'w', snap: (p) => { const d = unit3(cOf()), t = dot3(p, d); return Math.abs(t) < 0.25 ? mul3(d, t < 0 ? -0.25 : 0.25) : p; } });
        const Uh = sc.handle([1.0, 0.1, 0.5], { color: 'gold', label: 'u' });
        v.legend([['orange', '$\\operatorname{null}\\varphi$', { area: true }], ['accent', 'level plane $\\varphi=1$', { area: true }], ['green', '$(\\operatorname{null}\\varphi)^\\perp$ and $v$'], ['purple', 'any $w\\ne0$ on it']]);
        let st = null;
        v.render(() => {
          const c = cOf(), d = unit3(c);
          if (len3(sub3(Wh.d, d)) > 1e-12) Wh.d = d;                // keep w on the (moving) perpendicular line
          const [a, b] = perp(c), phi = (x) => dot3(c, x);
          sc.begin();
          sc.disc(a, b, 1.25, { fill: 'orange', color: 'orange', fillAlpha: 0.12, grid: true });
          sc.disc(a, b, 0.75, { fill: 'accent', color: 'accent', fillAlpha: 0.08, alpha: 0.6 }, Fh.p);
          const vv = mul3(Wh.p, phi(Wh.p) / dot3(Wh.p, Wh.p));
          sc.line(mul3(d, -1.7), mul3(d, 1.7), { color: 'green', width: 2.4, alpha: 0.7 }, 12);
          corner3(sc, ZERO, a, d, 0.15, { color: 'ink' });
          sc.arrow(ZERO, Wh.p, { color: 'purple', width: 2.4, head: 9 });
          sc.arrow(ZERO, vv, { color: 'green', width: 3.6, head: 12 }); sc.tex('v', vv, { color: 'green', dx: -14, dy: -10, size: 16 });
          const u = Uh.p, f = mul3(d, dot3(u, d));
          sc.line(u, f, { color: 'gold', width: 1.2, dash: [3, 3] }); sc.dot(f, { r: 3, color: 'gold' });
          sc.arrow(ZERO, u, { color: 'gold', width: 2.2, head: 9 });
          sc.flush();
          st = { c, w: Wh.p, vv, phiW: phi(Wh.p), phiU: phi(u), ipU: dot3(u, vv), phiV: phi(vv), nv2: dot3(vv, vv) };
        });
        v.readout(() => {
          if (!st) return '';
          const { w, vv, phiW, phiU, ipU, phiV, nv2 } = st;
          return `$\\varphi(w) = ${tn(phiW, 3)}$, $\\|w\\|^2 = ${tn(dot3(w, w), 3)}$, so $v = \\frac{\\varphi(w)}{\\|w\\|^2}\\,w = ${vt(vv)}$ — whatever nonzero $w$ you pick on the line. Check: $\\varphi(v) = ${tn(phiV, 3)} = \\|v\\|^2 = ${tn(nv2, 3)}$, and for the test vector $\\varphi(u) = ${tn(phiU, 3)}$, $\\langle u,v\\rangle = ${tn(ipU, 3)}$. Different functionals give different $v$ (6.42), so $v\\mapsto\\varphi_v$ is a bijection $V\\to V'$.`;
        });
      },
    },
  ],
};
