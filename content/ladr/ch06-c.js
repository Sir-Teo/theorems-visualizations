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
    // ------------------------------------------------------------------ 6.61
    {
      num: '6.61',
      kind: 'Theorem',
      name: 'Minimizing distance to a subspace',
      statement: String.raw`Suppose $U$ is a finite-dimensional subspace of $V$, $v\in V$ and $u\in U$. Then $$\|v-P_Uv\|\le\|v-u\|,$$ with equality if and only if $u=P_Uv$. In words: $P_Uv$ is the unique point of $U$ closest to $v$.`,
      idea: String.raw`Write $v-u=(v-P_Uv)+(P_Uv-u)$. The first piece lies in $U^\perp$ by 6.57(f) and the second lies in $U$, so Pythagoras (6.12) gives $$\|v-u\|^2=\|v-P_Uv\|^2+\|P_Uv-u\|^2\ge\|v-P_Uv\|^2,$$ with equality exactly when $P_Uv-u=0$. Combined with the formula 6.57(i) this solves concrete approximation problems: projecting $\sin x$ onto the polynomials of degree at most $5$ in $C[-\pi,\pi]$ with $\langle f,g\rangle=\int_{-\pi}^{\pi}fg$ gives $0.987862x-0.155271x^3+0.00564312x^5$, far better on $[-\pi,\pi]$ than the Taylor polynomial.`,
      caption: String.raw`**$\mathbf R^3$:** drag $v$ (gold) and your candidate $u$ in the plane $U$ (orange). The red distance $\|v-u\|$ is the hypotenuse of a right triangle whose legs are $v-P_Uv$ (green, perpendicular to $U$) and $P_Uv-u$ (in $U$) — so it can never beat the green one. Try. **Functions:** $v$ is $\sin x$ (or $|x|$) on $[-\pi,\pi]$ and $U=\mathcal P_n(\mathbf R)$. Drag the handles of your polynomial $u$ (orange; it starts as the Taylor polynomial); the red area between $v$ and $u$ is the error, and $\|v-u\|^2=\int_{-\pi}^{\pi}|v-u|^2$. The green curve is $P_Uv$, computed from an orthonormal basis of $U$ by 6.57(i); **Best** moves your handles onto it.`,
      deps: ['ladr-6.57', 'ladr-6.12'],
      see: ['rca-4.14', 'rca-4.10'],
      tags: ['projections', 'approximation'],
      viz(v) {
        const M = v.M, PI = Math.PI;
        const mode = v.select('$V$', [{ value: 'R3', label: '$\\mathbf R^3$, $U$ a plane' }, { value: 'F', label: '$C[-\\pi,\\pi]$, $U=\\mathcal P_n(\\mathbf R)$' }], 'R3', { onChange: (m) => show(m) });
        const S = v.stage({ x: [-1.8, 1.8], y: [-1.75, 1.75], equal: true, axes: false, height: 420, weight: 1.3 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.4, axis: 1.4, lim: 1.4 });
        const D = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 420, weight: 0.7, minWidth: 220, title: 'distance to $v$' });
        const F = v.stage({ x: [-3.45, 3.45], y: [-1.6, 1.6], height: 320, full: true, title: '$v$, your polynomial $u$ (drag the handles) and the best approximation $P_Uv$' });
        const E = v.stage({ x: [-3.45, 3.45], y: [-0.5, 0.5], height: 150, full: true, title: 'errors $v-u$ (red) and $v-P_Uv$ (green)' });
        const tgt = v.select('$v$', [{ value: 'sin', label: '$\\sin x$' }, { value: 'abs', label: '$|x|$' }], 'sin', { onChange: (t) => { bTay.hidden = t !== 'sin'; setTaylor(); best = Infinity; } });
        const nS = v.slider('$n$ (degree)', 1, 7, 5, { int: true, onChange: () => renode() });
        const bTay = v.button('Taylor', () => { setTaylor(); });
        const bBest = v.button('Best', () => { snapBest = true; });
        // ---- R³ part
        const nrm = unit3([0.25, -0.35, 0.9]), [pa, pb] = perp(nrm);
        const inP = (p) => sub3(p, mul3(nrm, dot3(p, nrm))), ex0 = [Math.cos(0.6), Math.sin(0.6), 0];   // ex0: horizontal on screen at the start
        const Vh = sc.handle(add3(mul3(inP(ex0), -0.45), mul3(nrm, 0.95)), { color: 'gold', label: 'v' });
        const Uh = sc.handle(mul3(inP(ex0), 0.8), { mode: 'plane', a: pa, b: pb, color: 'orange', label: 'u', snap: (p) => { const f = sub3(Vh.p, mul3(nrm, dot3(Vh.p, nrm))); return len3(sub3(p, f)) < 0.06 ? f : p; } });
        // ---- function part: u interpolates handles at Chebyshev nodes of [−0.97π, 0.97π]
        let nodes = chebNodes(5, -0.97 * PI, 0.97 * PI), snapBest = false, best = Infinity, lastV = null;
        const H = [];
        for (let j = 0; j < 8; j++) H.push(F.handle(0, 0, { color: 'orange', r: 6, constrain: (x, y) => [nodes[j] ?? 0, M.clamp(y, -3, 4)] }));
        const target = () => (tgt.value === 'sin' ? Math.sin : Math.abs);
        const taylor = (n) => { const c = new Array(n + 1).fill(0); for (let k = 1; k <= n; k += 2) c[k] = (k % 4 === 1 ? 1 : -1) / M.factorial(k); return c; };
        function setTaylor() {
          const n = nS.value;
          const c = tgt.value === 'sin' ? taylor(n) : [0.4, 0, Math.min(n, 2) === 2 ? 0.3 : 0];
          H.forEach((h, j) => { if (j <= n) { h.x = nodes[j]; h.y = pev(c, nodes[j]); } });
          best = Infinity; v.invalidate();
        }
        let ucoef = null;
        function renode() {
          const n = nS.value;
          nodes = chebNodes(n, -0.97 * PI, 0.97 * PI);
          H.forEach((h, j) => { h.visible = j <= n && mode.value === 'F'; if (j <= n) { h.x = nodes[j]; h.y = ucoef ? M.clamp(pev(ucoef, nodes[j]), -3, 4) : 0; } });
          best = Infinity; v.invalidate();
        }
        function show(m) {
          layout(v, [[S, m === 'R3'], [D, m === 'R3'], [F, m === 'F'], [E, m === 'F']]);
          Vh.visible = Uh.visible = m === 'R3';
          H.forEach((h, j) => { h.visible = m === 'F' && j <= nS.value; });
          for (const c of [tgt, nS]) c.el.hidden = m !== 'F';
          bTay.hidden = m !== 'F' || tgt.value !== 'sin'; bBest.hidden = m !== 'F';
          best = Infinity;
        }
        show('R3'); setTaylor();
        // orthonormal basis of P_n on [−π, π]: e_k(x) = ê_k(x/π)/√π with ê_k orthonormal on [−1, 1]
        const onb = (n) => legendreON(n).map((e) => e.map((a, i) => a / PI ** i / Math.sqrt(PI)));
        let cache = { key: '', pc: null };
        let st = null;
        v.render(() => {
          if (mode.value === 'R3') {
            v.legend([['blue', '$U$', { area: true }], ['green', '$v-P_Uv$, the shortest'], ['red', 'your $v-u$'], ['orange', '$P_Uv-u$ in $U$', { dash: true }]]);
            const p = Vh.p, f = sub3(p, mul3(nrm, dot3(p, nrm))), u = Uh.p;
            const dBest = len3(sub3(p, f)), dYou = len3(sub3(p, u)), leg = len3(sub3(f, u));
            if (!lastV || len3(sub3(lastV, p)) > 1e-9) { best = Infinity; lastV = p.slice(); }
            best = Math.min(best, dYou);
            sc.begin();
            sc.disc(pa, pb, 1.3, { fill: 'blue', color: 'blue', fillAlpha: 0.1, grid: true });
            sc.line(f, p, { color: 'green', width: 3 });
            if (leg > 1e-6) { sc.line(p, u, { color: 'red', width: 2.6 }); sc.line(f, u, { color: 'orange', width: 2, dash: [5, 4] }); if (leg > 0.06 && dBest > 0.06) corner3(sc, f, unit3(sub3(u, f)), nrm, 0.11, { color: 'ink' }); }
            sc.dot(f, { r: 5.5, color: 'green' }); sc.tex('P_Uv', f, { color: 'green', dx: -24, dy: 14, size: 13.5 });
            sc.arrow(ZERO, p, { color: 'gold', width: 1.6, head: 8, alpha: 0.55 });
            sc.flush();
            // the meter
            const sc2 = 0.62 / Math.max(1.2, dYou, dBest), y0 = 0.1;
            const bar = (x, h, col, lab, val) => { D.rect(x - 0.09, y0, x + 0.09, y0 + h * sc2, { fill: col, fillAlpha: 0.45, color: col, width: 1.5 }); D.tex(lab, x, y0 + h * sc2, { color: col, dy: -24, size: 13 }); D.text(pn(val, 3), x, y0 + h * sc2, { color: col, dy: -8, align: 'center', size: 12 }); };
            bar(0.27, dYou, 'red', '\\|v-u\\|', dYou); bar(0.73, dBest, 'green', '\\|v-P_Uv\\|', dBest);
            if (isFinite(best)) { D.hline(y0 + best * sc2, { color: 'gold', width: 1.6, dash: [5, 4] }); D.text('your best', 0.03, y0 + best * sc2, { color: 'gold', dy: -7, align: 'left', size: 11 }); }
            D.hline(y0, { color: 'muted', width: 1 });
            st = { m: 'R3', dBest, dYou, leg, best };
          } else {
            v.legend([['blue', '$v$'], ['orange', 'your $u$'], ['red', 'error area', { area: true }], ['green', '$P_Uv$', { dash: true }]]);
            const n = nS.value, f = target(), cuts = tgt.value === 'abs' ? [0] : [];
            const key = `${tgt.value}|${n}`;
            if (cache.key !== key) {
              const Eb = onb(n), w = Eb.map((e) => gint((x) => f(x) * pev(e, x), -PI, PI, cuts));
              const pc = new Array(n + 1).fill(0); Eb.forEach((e, k) => e.forEach((a, i) => { pc[i] += w[k] * a; }));
              cache = { key, pc };
            }
            const pc = cache.pc;
            if (snapBest) { snapBest = false; H.forEach((h, j) => { if (j <= n) h.y = pev(pc, nodes[j]); }); }
            const uc = interpCoef(M, nodes.slice(0, n + 1), H.slice(0, n + 1).map((h) => h.y), PI);
            ucoef = uc;
            const U = (x) => pev(uc, x), P = (x) => pev(pc, x);
            const yr = tgt.value === 'sin' ? [-1.6, 1.6] : [-0.6, 3.6];
            F.setView([-3.45, 3.45], yr);
            F.vline(-PI, { color: 'muted', width: 1, dash: [3, 3], alpha: 0.6 }); F.vline(PI, { color: 'muted', width: 1, dash: [3, 3], alpha: 0.6 });
            F.clip(() => {
              F.between(f, U, -PI, PI, { fill: 'red', fillAlpha: 0.22 });
              F.fn(f, { domain: [-PI, PI], color: 'blue', width: 3, n: 400 });
              F.fn(P, { domain: [-PI, PI], color: 'green', width: 2.4, dash: [7, 5], n: 300 });
              F.fn(U, { domain: [-PI, PI], color: 'orange', width: 2.4, n: 300 });
            });
            const eU = (x) => f(x) - U(x), eP = (x) => f(x) - P(x);
            let mx = 0.01; for (let i = 0; i <= 200; i++) { const x = -PI + (2 * PI * i) / 200; mx = Math.max(mx, Math.abs(eU(x)), Math.abs(eP(x))); }
            E.setView([-3.45, 3.45], [-mx * 1.15, mx * 1.15]);
            E.hline(0, { color: 'muted', width: 1 });
            E.fn(eU, { domain: [-PI, PI], color: 'red', width: 2, fill: 'red', fillAlpha: 0.18, n: 300 });
            E.fn(eP, { domain: [-PI, PI], color: 'green', width: 2.2, n: 300 });
            const dYou = Math.sqrt(Math.max(0, gint((x) => eU(x) ** 2, -PI, PI, cuts))), dBest = Math.sqrt(Math.max(0, gint((x) => eP(x) ** 2, -PI, PI, cuts)));
            const leg = Math.sqrt(Math.max(0, gint((x) => (P(x) - U(x)) ** 2, -PI, PI)));
            best = Math.min(best, dYou);
            st = { m: 'F', n, pc, dYou, dBest, leg, best, at3: [Math.abs(eP(3)), Math.abs(eU(3))], sin: tgt.value === 'sin' };
          }
        });
        v.readout(() => {
          if (!st) return '';
          const { dYou, dBest, leg, best: b } = st;
          const pyth = `Pythagoras: $${tn(dYou, 4)}^2 = ${tn(dBest, 4)}^2 + ${tn(leg, 4)}^2$ (the last term is $\\|P_Uv-u\\|^2$).`;
          if (st.m === 'R3') {
            return `Your $\\|v-u\\| = ${tn(dYou, 3)}$, best so far $${tn(b, 3)}$; the minimum is $\\|v-P_Uv\\| = ${tn(dBest, 3)}$. ${pyth} ${leg < 1e-9 ? 'You found it: $u = P_Uv$, the only minimizer.' : ''}`;
          }
          const { n, pc, at3, sin } = st;
          return `$P_Uv = ${polyTeX(pc, sin ? 6 : 4)}$. Your polynomial: $\\|v-u\\| = ${tn(dYou, 4)}$ (best so far $${tn(b, 4)}$); the minimum over $\\mathcal P_${n}(\\mathbf R)$ is $\\|v-P_Uv\\| = ${tn(dBest, 5)}$. ${pyth} At $x=3$ the errors are $${zs(at3[0])}$ for $P_Uv$ and $${tn(at3[1], 3)}$ for $u$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.67
    {
      num: '6.67',
      kind: 'Theorem',
      name: 'T restricted to (null T)⊥ is a bijection onto range T',
      statement: String.raw`Suppose $V$ is finite-dimensional and $T\in\mathcal L(V,W)$. Then the restriction $T|_{(\operatorname{null}T)^\perp}$ is an injective linear map of $(\operatorname{null}T)^\perp$ onto $\operatorname{range}T$.`,
      idea: String.raw`If $v\in(\operatorname{null}T)^\perp$ and $Tv=0$, then $v\in\operatorname{null}T\cap(\operatorname{null}T)^\perp=\{0\}$ (6.48(d)), so the restriction is injective. For $w=Tv\in\operatorname{range}T$, split $v=u+x$ with $u\in\operatorname{null}T$ and $x\in(\operatorname{null}T)^\perp$ (6.49); then $Tx=Tv-Tu=w$, so the restriction already hits all of $\operatorname{range}T$. Every vector of $W$ that $T$ reaches has exactly one preimage in $(\operatorname{null}T)^\perp$.`,
      caption: String.raw`$T\colon\mathbf R^3\to\mathbf R^2$. Left: $\operatorname{null}T$ (red) and the subspace $X$ we restrict to (green, drawn with a polar grid). Right: the image of that grid. With tilt $0°$, $X=(\operatorname{null}T)^\perp$ and the grid maps one-to-one onto $\operatorname{range}T$. Drag $y$ on the right: its unique preimage in $X$ is the green dot, where the orange set $T^{-1}(y)$ — a translate of $\operatorname{null}T$ — crosses $X$. Tilt $X$ towards $\operatorname{null}T$: the image grid flattens, and at $90°$ $X$ contains the null space and the restriction collapses. Switch to rank 1: then $(\operatorname{null}T)^\perp$ is a line and $\operatorname{range}T$ is a line.`,
      deps: ['ladr-6.48', 'ladr-6.49', 'ladr-3.15'],
      tags: ['projections', 'linear maps'],
      viz(v) {
        const M = v.M;
        const S3 = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], equal: true, axes: false, height: 400, title: '$V=\\mathbf R^3$' });
        const sc = v.scene3(S3, { yaw: -2.0, pitch: 0.32, axis: 1.4, lim: 1.4 });
        const SW = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 400, minWidth: 260, title: '$W=\\mathbf R^2$' });
        const rS = v.select('$T$', [{ value: '2', label: 'rank 2' }, { value: '1', label: 'rank 1' }], '2', { onChange: () => { const p = onRange(Yh.x, Yh.y); Yh.x = p[0]; Yh.y = p[1]; } });
        const al = v.slider('tilt $X$ towards $\\operatorname{null}T$', 0, 90, 0, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const A2 = [[0.9, 0.5, -0.6], [-0.3, 0.8, 0.7]], A1 = [[0.9, 0.5, -0.6], [0.45, 0.25, -0.3]];
        const rdir = [0.9 / Math.hypot(0.9, 0.45), 0.45 / Math.hypot(0.9, 0.45)];
        const onRange = (x, y) => { if (rS.value === '2') return [x, y]; const t = dot2([x, y], rdir); return [rdir[0] * t, rdir[1] * t]; };
        const Yh = SW.handle(0.9, 0.75, { color: 'gold', label: 'y', constrain: onRange });
        v.legend([['red', '$\\operatorname{null}T$'], ['green', 'the subspace $X$ and its image'], ['orange', '$T^{-1}(y)$', { dash: true }], ['gold', 'target $y$', { dot: true }]]);
        let st = null;
        v.render(() => {
          const A = rS.value === '2' ? A2 : A1, N = M.nullspace(A, 1e-9), P = compl(orth(N)), r = P.length;
          const t = (al.value * Math.PI) / 180;
          const X = P.slice(); X[r - 1] = add3(mul3(P[r - 1], Math.cos(t)), mul3(N[0], Math.sin(t)));   // still orthonormal
          const TX = X.map((x) => mv(A, x));
          const y = onRange(Yh.x, Yh.y);
          // the restricted map in the orthonormal basis X of X and the standard basis of W
          let pre = null, det = 0;
          if (r === 2) { const K = [[TX[0][0], TX[1][0]], [TX[0][1], TX[1][1]]]; det = M.det(K); if (Math.abs(det) > 1e-9) { const c = M.solve(K, y); pre = add3(mul3(X[0], c[0]), mul3(X[1], c[1])); } }
          else { const l2 = dot2(TX[0], TX[0]); det = Math.sqrt(l2); if (l2 > 1e-12) pre = mul3(X[0], dot2(y, TX[0]) / l2); }
          const ok = Math.abs(det) > 1e-6, col = ok ? 'green' : 'red';
          sc.begin();
          if (N.length === 1) sc.line(mul3(N[0], -1.7), mul3(N[0], 1.7), { color: 'red', width: 3.2, alpha: 0.8 }, 14);
          else sc.disc(N[0], N[1], 1.3, { fill: 'red', color: 'red', fillAlpha: 0.08, grid: false, alpha: 0.5 });
          const grid = (fn, rr) => { // circles and spokes of radius ≤ rr in the plane of X, mapped by fn
            const out = [];
            for (const R of [0.4, 0.8, 1.2]) { const pts = []; for (let i = 0; i <= 64; i++) { const a = (2 * Math.PI * i) / 64; pts.push(fn(R * Math.cos(a), R * Math.sin(a))); } out.push(pts); }
            for (let k = 0; k < 8; k++) { const a = (Math.PI * k) / 4; out.push([fn(0, 0), fn(rr * Math.cos(a), rr * Math.sin(a))]); }
            return out;
          };
          if (r === 2) {
            sc.disc(X[0], X[1], 1.2, { fill: col, color: col, fillAlpha: 0.1, grid: false, alpha: 0.6 });
            grid((s, q) => add3(mul3(X[0], s), mul3(X[1], q)), 1.2).forEach((pts) => sc.path(pts, { color: col, width: 1, alpha: 0.55 }));
          } else {
            sc.line(mul3(X[0], -1.6), mul3(X[0], 1.6), { color: col, width: 3.2, alpha: 0.8 }, 12);
            for (let k = -3; k <= 3; k++) if (k) sc.dot(mul3(X[0], 0.4 * k), { r: 3, color: col });
          }
          if (pre) {
            if (N.length === 1) sc.line(add3(pre, mul3(N[0], -1.4)), add3(pre, mul3(N[0], 1.4)), { color: 'orange', width: 2, dash: [6, 4] });
            else sc.disc(N[0], N[1], 0.7, { fill: 'orange', color: 'orange', fillAlpha: 0.08, alpha: 0.7, width: 1.2 }, pre);
            sc.dot(pre, { r: 6.5, color: 'green' }); sc.tex('x', pre, { color: 'green', dx: 12, dy: -12, size: 15 });
          }
          sc.flush();
          // W side
          if (rS.value === '2') SW.rect(-9, -9, 9, 9, { fill: 'teal', fillAlpha: 0.04, stroke: false });
          else lineThrough(SW, [0, 0], rdir, 'teal', { width: 8, alpha: 0.2 });
          SW.corner(rS.value === '2' ? 'range T = ℝ²' : 'range T = a line', 'tl', { color: 'teal' });
          if (r === 2) grid((s, q) => [s * TX[0][0] + q * TX[1][0], s * TX[0][1] + q * TX[1][1]], 1.2).forEach((pts) => SW.path(pts, { color: col, width: ok ? 1.3 : 3, alpha: ok ? 0.75 : 0.9 }));
          else for (let k = -3; k <= 3; k++) SW.dot(0.4 * k * TX[0][0], 0.4 * k * TX[0][1], { r: k ? 3.5 : 4, color: col });
          SW.dot(0, 0, { r: 3, color: 'ink' });
          if (!ok) SW.corner('the whole restriction collapses: not injective', 'bl', { color: 'red', weight: 600 });
          st = { r, det, ok, pre, y, tilt: al.value, check: pre ? Math.hypot(...mv(A, pre).map((c, i) => c - y[i])) : null };
        });
        v.readout(() => {
          if (!st) return '';
          const { r, det, ok, pre, y, tilt, check } = st;
          const what = r === 2 ? `$\\det$ of the restricted map in orthonormal coordinates: $${tn(det, 3)}$` : `$\\|Tx_1\\|$ for the unit vector $x_1$ spanning $X$: $${tn(det, 3)}$`;
          if (!ok) return `${what}. At $90°$ the subspace $X$ contains the null direction, so $T$ kills a nonzero vector of $X$: the restriction is not injective and its image is smaller than $\\operatorname{range}T$. Only a complement of $\\operatorname{null}T$ works, and $(\\operatorname{null}T)^\\perp$ is the natural one.`;
          return `${what} $\\ne 0$, so $T|_X$ is injective and onto $\\operatorname{range}T$. The target $y = ${vt(y)}$ has exactly one preimage in $X$: $x = ${vt(pre)}$ ($\\|Tx-y\\| = ${zs(check)}$). ${tilt === 0 ? 'Here $X = (\\operatorname{null}T)^\\perp$, which is what the pseudoinverse will use.' : 'Any complement of the null space would do; the theorem uses the orthogonal one.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.68
    {
      num: '6.68',
      kind: 'Definition',
      name: 'Pseudoinverse T†',
      statement: String.raw`Suppose $V$ is finite-dimensional and $T\in\mathcal L(V,W)$. The **pseudoinverse** $T^\dagger\in\mathcal L(W,V)$ of $T$ is defined by $$T^\dagger w=\bigl(T|_{(\operatorname{null}T)^\perp}\bigr)^{-1}P_{\operatorname{range}T}\,w\qquad(w\in W),$$ where $T|_{(\operatorname{null}T)^\perp}$ is regarded as an invertible map of $(\operatorname{null}T)^\perp$ onto $\operatorname{range}T$ (6.67).`,
      idea: String.raw`Two steps: first project $w$ orthogonally onto $\operatorname{range}T$, the closest vector that $T$ can actually reach; then take its unique preimage inside $(\operatorname{null}T)^\perp$. So $T^\dagger w=0$ for $w\in(\operatorname{range}T)^\perp$, and for $w\in\operatorname{range}T$, $T^\dagger w$ is the one solution of $Tv=w$ orthogonal to $\operatorname{null}T$. When $T$ is invertible both steps are trivial and $T^\dagger=T^{-1}$. $T^\dagger$ is also called the Moore–Penrose inverse.`,
      caption: String.raw`Drag $Te_1$ and $Te_2$ on the right to choose $T\colon\mathbf R^2\to\mathbf R^2$; $Te_2$ snaps onto the line of $Te_1$, making $T$ singular (rank 1). Drag $w$: step ① drops it perpendicularly onto $\operatorname{range}T$ (teal); step ② pulls the foot back to $V$. All its preimages form the orange line, a translate of $\operatorname{null}T$ (red); $T^\dagger w$ is where that line crosses $(\operatorname{null}T)^\perp$ (green). Pull $Te_2$ off the line: $T$ becomes invertible and $T^\dagger w=T^{-1}w$.`,
      deps: ['ladr-6.67', 'ladr-6.55'],
      credit: 'E. H. Moore, 1920; Roger Penrose, 1955',
      tags: ['pseudoinverse'],
      viz(v) {
        const M = v.M;
        const SV = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, height: 380, title: '$V=\\mathbf R^2$: ② the preimage in $(\\operatorname{null}T)^\\perp$' });
        const SW = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, height: 380, title: '$W=\\mathbf R^2$: ① project $w$ onto $\\operatorname{range}T$' });
        const T1 = SW.handle(1.2, 0.6, { color: 'blue', label: 'Te₁' });
        const T2 = SW.handle(-0.6, -0.3, { color: 'purple', label: 'Te₂', constrain: (x, y) => {
          const l = Math.hypot(T1.x, T1.y); if (l < 1e-6) return [x, y];
          const e = [T1.x / l, T1.y / l], t = x * e[0] + y * e[1], d = Math.abs(-x * e[1] + y * e[0]);
          return d < 0.12 ? [e[0] * t, e[1] * t] : [x, y];
        } });
        const Wh = SW.handle(0.9, 1.7, { color: 'gold', label: 'w' });
        v.legend([['teal', '$\\operatorname{range}T$'], ['red', '$\\operatorname{null}T$'], ['green', '$(\\operatorname{null}T)^\\perp$ and $T^\\dagger w$'], ['orange', 'all $v$ with $Tv=P_{\\operatorname{range}T}w$', { dash: true }]]);
        let st = null;
        v.render(() => {
          const A = [[T1.x, T2.x], [T1.y, T2.y]], w = [Wh.x, Wh.y];
          const R = orth([[T1.x, T1.y], [T2.x, T2.y]], 1e-6), N = M.nullspace(A, 1e-6 * (1 + maxAbs(A))), Pn = compl(orth(N), 2);
          const r = R.length;
          const Pw = projOnto(w, R);
          // (T restricted to (null T)⊥)⁻¹: solve in the orthonormal bases Pn of (null T)⊥ and R of range T
          let x = [0, 0];
          if (r === 2) x = M.solve(A, w);
          else if (r === 1) { const Tp = mv(A, Pn[0]), k = dot2(Tp, R[0]); x = Pn[0].map((c) => (c * dot2(Pw, R[0])) / k); }
          const Tx = mv(A, x), pinv = mv(M.pinv(A, 1e-6 * (1 + maxAbs(A))), w);
          // W panel
          if (r === 2) SW.rect(-9, -9, 9, 9, { fill: 'teal', fillAlpha: 0.05, stroke: false });
          else if (r === 1) lineThrough(SW, [0, 0], R[0], 'teal', { width: 7, alpha: 0.25 });
          arr(SW, [0, 0], [T1.x, T1.y], 'blue', null, { width: 2 }); arr(SW, [0, 0], [T2.x, T2.y], 'purple', null, { width: 2 });
          if (r === 1) {
            SW.line(w[0], w[1], Pw[0], Pw[1], { color: 'teal', width: 1.6, dash: [4, 3] });
            const dw = [w[0] - Pw[0], w[1] - Pw[1]], ld = Math.hypot(...dw);
            if (ld > 0.12) corner2(SW, Pw, [-R[0][0] * Math.sign(dot2(Pw, R[0]) || 1), -R[0][1] * Math.sign(dot2(Pw, R[0]) || 1)], [dw[0] / ld, dw[1] / ld], 0.13);
          }
          SW.dot(Pw[0], Pw[1], { r: 6, color: 'teal' }); SW.tex('P_{\\operatorname{range}T}\\,w', Pw[0], Pw[1], { color: 'teal', dx: 16, dy: 18, align: 'left', size: 13 });
          SW.dot(Tx[0], Tx[1], { r: 11, hollow: true, color: 'green', width: 1.6 });
          SW.dot(0, 0, { r: 3, color: 'ink' });
          // V panel
          if (r === 1) {
            lineThrough(SV, [0, 0], N[0], 'red', { width: 2.6, alpha: 0.85 });
            lineThrough(SV, [0, 0], Pn[0], 'green', { width: 2, alpha: 0.6 });
            lineThrough(SV, x, N[0], 'orange', { width: 2, dash: [6, 4] });
            corner2(SV, [0, 0], N[0], Pn[0], 0.18, { color: 'muted' });
          } else if (r === 2) SV.corner('null T = {0}: (null T)⊥ = V', 'tl', { color: 'green' });
          else SV.corner('T = 0: null T = V, so T†w = 0', 'tl', { color: 'red' });
          arr(SV, [0, 0], x, 'green', 'T^\\dagger w', { width: 3, size: 14 });
          SV.dot(0, 0, { r: 3, color: 'ink' });
          st = { r, x, Pw, err: Math.hypot(x[0] - pinv[0], x[1] - pinv[1]), back: Math.hypot(Tx[0] - Pw[0], Tx[1] - Pw[1]), inv: r === 2 ? M.inverse(A) : null };
        });
        v.readout(() => {
          if (!st) return '';
          const { r, x, Pw, err, back } = st;
          const head = `$T^\\dagger w = ${vt(x)}$, and $T(T^\\dagger w) = P_{\\operatorname{range}T}w = ${vt(Pw)}$ (difference $${zs(back)}$). The pseudoinverse computed from the SVD agrees to within $${zs(err)}$.`;
          if (r === 2) return head + ` Here $T$ is invertible: $\\operatorname{range}T = W$, $\\operatorname{null}T = \\{0\\}$, and $T^\\dagger = T^{-1}$.`;
          if (r === 1) return head + ` Of all the vectors on the orange line, $T^\\dagger w$ is the one orthogonal to $\\operatorname{null}T$ — and so the shortest, $\\|T^\\dagger w\\| = ${tn(Math.hypot(...x), 3)}$.`;
          return head;
        });
      },
    },
    // ------------------------------------------------------------------ 6.69
    {
      num: '6.69',
      kind: 'Theorem',
      name: 'Algebraic properties of the pseudoinverse',
      statement: String.raw`Suppose $V$ is finite-dimensional and $T\in\mathcal L(V,W)$.
(a) If $T$ is invertible, then $T^\dagger=T^{-1}$.
(b) $TT^\dagger=P_{\operatorname{range}T}$, the orthogonal projection of $W$ onto $\operatorname{range}T$.
(c) $T^\dagger T=P_{(\operatorname{null}T)^\perp}$, the orthogonal projection of $V$ onto $(\operatorname{null}T)^\perp$.`,
      idea: String.raw`(a) If $T$ is invertible, $(\operatorname{null}T)^\perp=V$ and $\operatorname{range}T=W$, so neither step of the definition does anything. (b) On $\operatorname{range}T$, $TT^\dagger$ undoes the restricted inverse and is the identity; on $(\operatorname{range}T)^\perp$, $T^\dagger$ is already $0$. These are the two values of $P_{\operatorname{range}T}$, and $W=\operatorname{range}T\oplus(\operatorname{range}T)^\perp$ (6.49), so the maps agree. (c) Likewise on $(\operatorname{null}T)^\perp$ the map $T^\dagger T$ is the identity and on $\operatorname{null}T$ it is $0$. In particular $T^\dagger T=I$ when $T$ is injective and $TT^\dagger=I$ when $T$ is surjective.`,
      caption: String.raw`$T$ is the operator on $\mathbf R^3$ whose matrix has columns $Te_1,Te_2,Te_3$ (drag them on the right; $Te_3$ snaps into the plane of $Te_1,Te_2$, and $Te_2$ onto the line of $Te_1$). Right: $TT^\dagger$ sends the gold $w$ straight down onto $\operatorname{range}T$. Left: $T^\dagger T$ sends the gold $x$ straight onto $(\operatorname{null}T)^\perp$, perpendicular to the red null space. Both maps are computed from the definition of $T^\dagger$, and the readout compares them with the orthogonal projections. Pull $Te_3$ out of the plane: $T$ becomes invertible, both maps become $I$, and $T^\dagger=T^{-1}$.`,
      deps: ['ladr-6.68', 'ladr-6.49'],
      tags: ['pseudoinverse'],
      viz(v) {
        const M = v.M;
        const SV = v.stage({ x: [-1.75, 1.75], y: [-1.75, 1.75], equal: true, axes: false, height: 380, title: '$V$: $T^\\dagger T = P_{(\\operatorname{null}T)^\\perp}$' });
        const scV = v.scene3(SV, { yaw: -0.65, pitch: 0.34, axis: 1.35, lim: 1.35, hint: false });
        const SW = v.stage({ x: [-1.75, 1.75], y: [-1.75, 1.75], equal: true, axes: false, height: 380, title: '$W$: $TT^\\dagger = P_{\\operatorname{range}T}$' });
        const scW = v.scene3(SW, { yaw: -0.65, pitch: 0.34, axis: 1.35, lim: 1.35 });
        const C1 = scW.handle([0.95, 0.15, -0.1], { color: 'blue', label: 'Te₁' });
        const C2 = scW.handle([0.05, 0.8, 0.45], { color: 'purple', label: 'Te₂', snap: (p) => snapSpan(p, orth([C1.p]), 0.1) });
        const C3 = scW.handle(add3(mul3([0.95, 0.15, -0.1], 0.6), mul3([0.05, 0.8, 0.45], -0.7)), { color: 'teal', label: 'Te₃', snap: (p) => snapSpan(p, orth([C1.p, C2.p]), 0.12) });
        const Wh = scW.handle([0.65, -0.05, 0.9], { color: 'gold', label: 'w' });
        const Xh = scV.handle([-0.2, 0.9, 0.9], { color: 'gold', label: 'x' });
        v.legend([['teal', '$\\operatorname{range}T$', { area: true }], ['red', '$\\operatorname{null}T$'], ['green', '$(\\operatorname{null}T)^\\perp$ and the images'], ['gold', '$w$, $x$', { dot: true }]]);
        let st = null;
        v.render(() => {
          const cols = [C1.p, C2.p, C3.p], A = fromCols(cols), tol = 1e-7;
          const R = orth(cols, tol), N = M.nullspace(A, 1e-6 * (1 + maxAbs(A))), P = compl(orth(N)), r = R.length;
          // T† from the definition: K = matrix of T restricted to (null T)⊥ (basis P) onto range T (basis R)
          const K = R.map((e) => P.map((p) => dot3(e, mv(A, p)))), Ki = r ? M.inverse(K) : null;
          const Tdag = (w) => { if (!r) return [0, 0, 0]; const c = mv(Ki, R.map((e) => dot3(e, w))); return P.reduce((s, p, j) => add3(s, mul3(p, c[j])), [0, 0, 0]); };
          const TD = fromCols([[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(Tdag));      // the matrix of T†
          const TTd = M.matMul(A, TD), TdT = M.matMul(TD, A);
          const PR = [0, 1, 2].map((i) => [0, 1, 2].map((j) => R.reduce((s, e) => s + e[i] * e[j], 0)));
          const PN = [0, 1, 2].map((i) => [0, 1, 2].map((j) => P.reduce((s, e) => s + e[i] * e[j], 0)));
          const w = Wh.p, x = Xh.p, pw = mv(TTd, w), px = mv(TdT, x);
          // W
          scW.begin();
          if (r === 2) scW.disc(R[0], R[1], 1.35, { fill: 'teal', color: 'teal', fillAlpha: 0.12, grid: true });
          else if (r === 1) scW.line(mul3(R[0], -1.6), mul3(R[0], 1.6), { color: 'teal', width: 4, alpha: 0.5 }, 12);
          else if (r === 3) spanDraw(scW, R, { color: 'teal', box: 1.1, fillAlpha: 0.03 });
          cols.forEach((c, i) => scW.arrow(ZERO, c, { color: VC[i], width: 2, head: 8, alpha: 0.8 }));
          if (len3(sub3(w, pw)) > 1e-6) { scW.line(w, pw, { color: 'green', width: 1.8, dash: [4, 3] }); if (len3(pw) > 0.08 && len3(sub3(w, pw)) > 0.08) corner3(scW, pw, unit3(mul3(pw, -1)), unit3(sub3(w, pw)), 0.11); }
          scW.arrow(ZERO, w, { color: 'gold', width: 2.2, head: 9 });
          scW.dot(pw, { r: 6.5, color: 'green' }); scW.tex('TT^\\dagger w', pw, { color: 'green', dx: 18, dy: 16, size: 13 });
          scW.flush();
          // V
          scV.begin();
          if (N.length === 1) scV.line(mul3(N[0], -1.6), mul3(N[0], 1.6), { color: 'red', width: 3.2, alpha: 0.8 }, 12);
          else if (N.length === 2) scV.disc(N[0], N[1], 1.3, { fill: 'red', color: 'red', fillAlpha: 0.08, grid: false, alpha: 0.5 });
          if (P.length === 2) scV.disc(P[0], P[1], 1.35, { fill: 'green', color: 'green', fillAlpha: 0.1, grid: true });
          else if (P.length === 1) scV.line(mul3(P[0], -1.6), mul3(P[0], 1.6), { color: 'green', width: 3, alpha: 0.6 }, 12);
          else if (P.length === 3) spanDraw(scV, P, { color: 'green', box: 1.1, fillAlpha: 0.03 });
          if (len3(sub3(x, px)) > 1e-6) { scV.line(x, px, { color: 'green', width: 1.8, dash: [4, 3] }); if (len3(px) > 0.08 && len3(sub3(x, px)) > 0.08) corner3(scV, px, unit3(mul3(px, -1)), unit3(sub3(x, px)), 0.11); }
          scV.arrow(ZERO, x, { color: 'gold', width: 2.2, head: 9 });
          scV.dot(px, { r: 6.5, color: 'green' }); scV.tex('T^\\dagger Tx', px, { color: 'green', dx: 18, dy: 16, size: 13 });
          scV.flush();
          if (r === 3) { SV.corner('null T = {0}: T†T = I', 'tl', { color: 'green' }); SW.corner('range T = W: TT† = I', 'tl', { color: 'green' }); }
          const Ai = r === 3 ? M.inverse(A) : null;
          st = { r, dB: maxAbs(msub(TTd, PR)), dC: maxAbs(msub(TdT, PN)), dA: Ai ? maxAbs(msub(TD, Ai)) : null, dS: maxAbs(msub(TD, M.pinv(A, 1e-6 * (1 + maxAbs(A))))), idem: maxAbs(msub(M.matMul(TTd, TTd), TTd)), sym: maxAbs(msub(TTd, M.transpose(TTd))), TTd };
        });
        v.readout(() => {
          if (!st) return '';
          const { r, dB, dC, dA, dS, idem, sym, TTd } = st;
          let s = `$\\operatorname{rank}T = ${r}$. (b) $\\max\\lvert TT^\\dagger - P_{\\operatorname{range}T}\\rvert = ${zs(dB)}$, and $TT^\\dagger = ${mtex(TTd)}$ is symmetric (${zs(sym)}) and idempotent (${zs(idem)}), as an orthogonal projection must be. (c) $\\max\\lvert T^\\dagger T - P_{(\\operatorname{null}T)^\\perp}\\rvert = ${zs(dC)}$. `;
          s += r === 3 ? `(a) $T$ is invertible and $\\max\\lvert T^\\dagger - T^{-1}\\rvert = ${zs(dA)}$.` : `$T$ is not invertible, so (a) says nothing; drag $Te_3$ out of the plane to see it.`;
          return s + ` ($T^\\dagger$ built from its definition matches the pseudoinverse computed from the SVD to within $${zs(dS)}$.)`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.70
    {
      num: '6.70',
      kind: 'Theorem',
      name: 'Pseudoinverse gives best approximate solution',
      statement: String.raw`Suppose $V$ is finite-dimensional, $T\in\mathcal L(V,W)$ and $w\in W$.
(a) For every $v\in V$, $$\|T(T^\dagger w)-w\|\le\|Tv-w\|,$$ with equality if and only if $v\in T^\dagger w+\operatorname{null}T$.
(b) If $v\in T^\dagger w+\operatorname{null}T$, then $\|T^\dagger w\|\le\|v\|$, with equality if and only if $v=T^\dagger w$.
So $T^\dagger w$ is the best approximate solution of $Tv=w$, and among all best approximate solutions it has the smallest norm.`,
      idea: String.raw`(a) Write $Tv-w=(Tv-TT^\dagger w)+(TT^\dagger w-w)$. The first term lies in $\operatorname{range}T$, and since $TT^\dagger=P_{\operatorname{range}T}$ (6.69(b)) the second lies in $(\operatorname{range}T)^\perp$ (6.57(f)). Pythagoras (6.12) gives $\|Tv-w\|^2=\|T(v-T^\dagger w)\|^2+\|TT^\dagger w-w\|^2$, with equality exactly when $v-T^\dagger w\in\operatorname{null}T$. (b) $T^\dagger w\in(\operatorname{null}T)^\perp$, so $v=(v-T^\dagger w)+T^\dagger w$ is again an orthogonal split and $\|v\|^2=\|v-T^\dagger w\|^2+\|T^\dagger w\|^2$.`,
      caption: String.raw`Three equations in two unknowns, $a_k\cdot x=w_k$, drawn as three lines in the plane of $x=(x_1,x_2)$ (each $a_k$ a unit vector, so the residual of an equation is the distance to its line). Drag the dots on the lines to change $w$ — the lines have no common point. The shading and the contours show $\|Tx-w\|$; drag your guess $x$ (gold) and try to beat $T^\dagger w$ (green): the red segments are the three residuals. Switch to **dependent columns**: all three lines are parallel, the best points fill a whole line (green dashed), and $T^\dagger w$ is the one closest to the origin.`,
      deps: ['ladr-6.69', 'ladr-6.57', 'ladr-6.12'],
      tags: ['pseudoinverse', 'approximation'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-3, 3], y: [-2.1, 2.1], equal: true, height: 430, xlabel: 'x₁', ylabel: 'x₂' });
        const mS = v.select('$T$', [{ value: 'ind', label: 'independent columns' }, { value: 'dep', label: 'dependent columns' }], 'ind', { onChange: () => setMode() });
        const ROWS = {
          ind: [[1, 0.2], [-0.35, 1], [0.75, 0.95]].map(([a, b]) => { const l = Math.hypot(a, b); return [a / l, b / l]; }),
          dep: [0, 1, 2].map(() => [Math.cos(1.1), Math.sin(1.1)]),
        };
        const W0 = { ind: [0.9, 0.7, -0.5], dep: [0.3, 1.1, 1.6] };
        let rows = ROWS.ind;
        const OFF = { ind: [0, 0, 0], dep: [-1.7, -0.5, 1.0] };              // where each line's handle sits along the line
        const at = (k, t) => { const a = rows[k], s = OFF[mS.value][k]; return [a[0] * t - a[1] * s, a[1] * t + a[0] * s]; };
        const LH = [0, 1, 2].map((k) => S.handle(0, 0, { color: VC[k], r: 6, constrain: (x, y) => { const a = rows[k]; return at(k, M.clamp(x * a[0] + y * a[1], -1.9, 1.9)); } }));
        const Xh = S.handle(-1.6, -1.2, { color: 'gold', label: 'x' });
        let best = Infinity, lastKey = '';
        function setMode() {
          rows = ROWS[mS.value];
          LH.forEach((h, k) => { const p = at(k, W0[mS.value][k]); h.x = p[0]; h.y = p[1]; });
          if (mS.value === 'dep') { Xh.x = 1.9; Xh.y = -0.2; } else { Xh.x = -1.6; Xh.y = -1.2; }
          best = Infinity; v.invalidate();
        }
        setMode();
        v.legend([['green', 'least-squares point $T^\\dagger w$'], ['red', 'residuals of your $x$'], ['gold', 'your guess $x$', { dot: true }], ['green', 'all best points', { dash: true }]]);
        let st = null;
        v.render(() => {
          const A = rows, w = LH.map((h, k) => h.x * rows[k][0] + h.y * rows[k][1]);
          const res = (x) => A.map((a, k) => a[0] * x[0] + a[1] * x[1] - w[k]);
          const f = (x) => res(x).reduce((s, r) => s + r * r, 0);
          const xs = mv(M.pinv(A, 1e-9), w), fmin = f(xs), dep = mS.value === 'dep';
          // shading by the residual (palette colour, alpha falls off with ‖Tx − w‖² − min)
          const g = v.rgb('green'), key = `${mS.value}|${w.map((c) => c.toFixed(3)).join(',')}`;
          S.raster((x, y) => { const d = f([x, y]) - fmin; return [g[0], g[1], g[2], Math.round(120 * Math.exp(-d / 0.9))]; }, { res: 3, key });
          // contours ‖Tx − w‖² = fmin + c
          const AtA = M.matMul(M.transpose(A), A), es = M.eigSym2(AtA);
          for (const c of [0.25, 0.75, 1.5, 2.5, 4]) {
            if (!dep) S.curve((t) => { const u = es.vectors[0], q = es.vectors[1], s1 = Math.sqrt(c / es.values[0]), s2 = Math.sqrt(c / es.values[1]); return [xs[0] + s1 * Math.cos(t) * u[0] + s2 * Math.sin(t) * q[0], xs[1] + s1 * Math.cos(t) * u[1] + s2 * Math.sin(t) * q[1]]; }, 0, 2 * Math.PI, { color: 'green', width: 1, alpha: 0.5, n: 120 });
            else { const a = A[0], h = Math.sqrt(c / 3); for (const s of [1, -1]) lineThrough(S, [xs[0] + s * h * a[0], xs[1] + s * h * a[1]], [-a[1], a[0]], 'green', { width: 1, alpha: 0.5 }); }
          }
          // the three lines a_k·x = w_k
          A.forEach((a, k) => lineThrough(S, [a[0] * w[k], a[1] * w[k]], [-a[1], a[0]], VC[k], { width: 2.2, alpha: 0.9 }));
          if (dep) {
            const a = A[0];
            lineThrough(S, xs, [-a[1], a[0]], 'green', { width: 2.2, dash: [7, 5] });
            S.line(0, 0, xs[0], xs[1], { color: 'green', width: 1.5, dash: [3, 3] });
            if (Math.hypot(...xs) > 0.2) corner2(S, xs, [-xs[0] / Math.hypot(...xs), -xs[1] / Math.hypot(...xs)], [-a[1], a[0]], 0.14, { color: 'green' });
          }
          const x = [Xh.x, Xh.y], r = res(x);
          A.forEach((a, k) => { const q = [x[0] - r[k] * a[0], x[1] - r[k] * a[1]]; S.line(x[0], x[1], q[0], q[1], { color: 'red', width: 2.2 }); S.dot(q[0], q[1], { r: 2.5, color: 'red' }); });
          S.dot(xs[0], xs[1], { r: 7, color: 'green' }); S.tex('T^\\dagger w', xs[0], xs[1], { color: 'green', dx: 22, dy: -16, size: 14 });
          S.dot(0, 0, { r: 3, color: 'ink' });
          if (key !== lastKey) { lastKey = key; best = Infinity; }
          const fx = Math.sqrt(f(x)); best = Math.min(best, fx);
          const onValley = dep && Math.abs(fx - Math.sqrt(fmin)) < 1e-3;
          st = { w, xs, fx, fmin: Math.sqrt(fmin), best, dep, onValley, nx: Math.hypot(...x), nxs: Math.hypot(...xs), r };
        });
        v.readout(() => {
          if (!st) return '';
          const { w, xs, fx, fmin, best: b, dep, onValley, nx, nxs, r } = st;
          let s = `$w = ${vt(w)}$, $T^\\dagger w = ${vt(xs)}$ with $\\|T(T^\\dagger w)-w\\| = ${tn(fmin, 4)}$. Your $x$: residuals $${r.map((c) => tn(c, 2)).join(',\\ ')}$, $\\|Tx-w\\| = ${tn(fx, 4)}$ (best so far $${tn(b, 4)}$) — never below the minimum. `;
          if (dep) s += onValley ? `Your $x$ is also a best point (on the green line), but $\\|x\\| = ${tn(nx, 3)} \\ge \\|T^\\dagger w\\| = ${tn(nxs, 3)}$ — part (b).` : `Every point of the green dashed line is a best point ($T^\\dagger w + \\operatorname{null}T$); $T^\\dagger w$ is the shortest, $\\|T^\\dagger w\\| = ${tn(nxs, 3)}$.`;
          else s += 'Here $\\operatorname{null}T = \\{0\\}$, so $T^\\dagger w$ is the only best point.';
          return s;
        });
      },
    },
  ],
};
