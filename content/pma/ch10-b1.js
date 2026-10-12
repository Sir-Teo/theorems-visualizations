// Rudin, Principles of Mathematical Analysis — Chapter 10 (part b1): 10.25–10.31
// Pulling integrals back along a map, oriented affine simplexes, affine chains, boundaries
// (with the boundary of a boundary), differentiable chains and positively oriented boundaries.
// The chapter title lives in ch10.js.

// 8-point Gauss–Legendre rule on [0,1].
const GLX = [0.0198550717512319, 0.1016667612931866, 0.2372337950418355, 0.4082826787521751, 0.5917173212478249, 0.7627662049581645, 0.8983332387068134, 0.9801449282487681];
const GLW = [0.0506142681451881, 0.1111905172266872, 0.1568533229389436, 0.1813418916891810, 0.1813418916891810, 0.1568533229389436, 0.1111905172266872, 0.0506142681451881];
/** Composite Gauss–Legendre: ∫_a^b f with m panels of 8 nodes. */
function quad(f, a, b, m = 4) {
  const h = (b - a) / m; let s = 0;
  for (let i = 0; i < m; i++) for (let k = 0; k < 8; k++) s += GLW[k] * f(a + h * (i + GLX[k]));
  return s * h;
}
/** ∫ over the standard simplex Q² = {u ≥ 0, u1 + u2 ≤ 1} of g(u1, u2) (collapsed coordinates). */
function quadQ2(g, m = 2) { return quad((s) => (1 - s) * quad((t) => g(s, (1 - s) * t), 0, 1, m), 0, 1, m); }
const det2 = (a, b) => a[0] * b[1] - a[1] * b[0];
const sub2 = (p, q) => [p[0] - q[0], p[1] - q[1]];
const add2 = (p, q) => [p[0] + q[0], p[1] + q[1]];
const lerp2 = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const cen = (P) => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
/** Line integral of the 1-form a dx + b dy (w(x,y) = [a,b]) along the curve g on [0,1] (derivative by central differences). */
function lineInt(w, g, m = 4) {
  const h = 1e-5;
  return quad((t) => { const p = g(t), q = g(t + h), r = g(t - h); const [a, b] = w(p[0], p[1]); return a * (q[0] - r[0]) / (2 * h) + b * (q[1] - r[1]) / (2 * h); }, 0, 1, m);
}
/** Arrowhead (with a short stem) centred at the data point m, pointing along the data direction d. */
function headAt(S, m, d, st = {}) {
  const X = S.X(m[0]), Y = S.Y(m[1]);
  let dx = S.X(m[0] + d[0]) - X, dy = S.Y(m[1] + d[1]) - Y; const L = Math.hypot(dx, dy); if (!(L > 1e-12)) return;
  dx /= L; dy /= L; const hd = st.head ?? 9, len = hd * 2.3;
  const a = S.inv(X - dx * len / 2, Y - dy * len / 2), b = S.inv(X + dx * len / 2, Y + dy * len / 2);
  S.arrow(a[0], a[1], b[0], b[1], { color: st.color || 'ink', head: hd, width: st.width ?? 2, alpha: st.alpha });
}
/** Segment p→q with an arrowhead part-way along. */
function segArrow(S, p, q, st = {}) { S.line(p[0], p[1], q[0], q[1], st); headAt(S, lerp2(p, q, st.at ?? 0.55), sub2(q, p), st); }
/** Polyline with arrowheads at the given fractions of its length (by index). */
function pathArrows(S, pts, st = {}, fr = [0.55]) {
  S.path(pts, st);
  for (const f of fr) { const x = f * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(x)); headAt(S, lerp2(pts[i], pts[i + 1], x - i), sub2(pts[i + 1], pts[i]), st); }
}
/** Small circular arrow about c (radius r, data units), counter-clockwise if sgn > 0. */
function spinArrow(S, c, r, sgn, st = {}) {
  const a0 = 0.35 * Math.PI, sweep = 1.45 * Math.PI * sgn;
  const pts = []; for (let i = 0; i <= 40; i++) { const a = a0 + sweep * i / 40; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); }
  S.path(pts, st);
  const n = pts.length; headAt(S, pts[n - 1], sub2(pts[n - 1], pts[n - 3]), { ...st, head: st.head ?? 8 });
}
const SUBS = '₀₁₂₃₄';

export default {
  book: 'pma',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.25
    {
      num: '10.25',
      kind: 'Theorem',
      name: 'Integrals transform by pulling the form back',
      statement: String.raw`Pushing a $k$-surface forward and pulling a $k$-form back give the same integral. Precisely: suppose $E\subset\R^n$ and $V\subset\R^m$ are open, $T:E\to V$ is a $\mathscr{C}'$-mapping, $\Phi$ is a $k$-surface in $E$ and $\omega$ is a $k$-form in $V$. The composite $T\Phi=T\circ\Phi$ is then a $k$-surface in $V$, and
$$\int_{T\Phi}\omega=\int_{\Phi}\omega_T ,$$
where $\omega_T$ denotes the pullback of $\omega$ to $E$ (substitute $y=T(x)$ in $\omega$).`,
      idea: String.raw`Both sides are integrals over the parameter domain $D$ shared by $\Phi$ and $T\Phi$. By 10.24, $\int_\Phi\omega_T$ is the integral over $D$ of the pulled-back form $(\omega_T)_\Phi$, and by 10.23 that form equals $\omega_{T\circ\Phi}$, whose integral over $D$ is $\int_{T\Phi}\omega$. For a $1$-form the content is the chain rule: $\omega$ evaluated on the velocity $(T\circ\Phi)'=T'(\Phi)\,\Phi'$ equals $\omega_T$ evaluated on $\Phi'$, so the two integrands agree at *every* parameter value, not merely after integration. $T$ need not be one-to-one.`,
      caption: String.raw`Drag the end points and the grey control point of the curve $\Phi$ in $E$ (left). The right panel shows $T\Phi$, the image of a grid under $T$, and the form $\omega$; the left panel shows $\omega_T$ (arrows are coefficient vectors). The bottom panel plots both running integrals against the parameter $u$: along $T\Phi$ in $V$ (blue) and along $\Phi$ in $E$ (orange, dashed). They coincide for every $u$; the gold arrows are the velocities $\Phi'(u)$ and $(T\Phi)'(u)=T'(\Phi(u))\Phi'(u)$.`,
      deps: ['pma-10.24', 'pma-10.23', 'pma-10.21'],
      tags: ['differential forms', 'change of variables'],
      verify: true,
      viz(v) {
        const MAPS = {
          sq: { label: '$T(z)=z^2$ (not one-to-one)', T: (x, y) => [x * x - y * y, 2 * x * y], J: (x, y) => [[2 * x, -2 * y], [2 * y, 2 * x]] },
          bend: { label: 'a bending map', T: (x, y) => [x + 0.45 * Math.sin(1.6 * y), y + 0.3 * x * x], J: (x, y) => [[1, 0.72 * Math.cos(1.6 * y)], [0.6 * x, 1]] },
        };
        const FORMS = {
          rot: { label: '$\\omega=-y\\,dx+x\\,dy$', w: (x, y) => [-y, x] },
          mix: { label: '$\\omega=\\cos y\\,dx+xy\\,dy$', w: (x, y) => [Math.cos(y), x * y] },
        };
        const mp = v.select('$T$:', Object.entries(MAPS).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const fm = v.select('', Object.entries(FORMS).map(([value, o]) => ({ value, label: o.label })), 'rot');
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.5, 1.5], equal: true, height: 300, title: '$E$: the curve $\\Phi$ and the form $\\omega_T$' });
        const R = v.stage({ x: [-3.1, 3.1], y: [-2.9, 2.9], equal: true, height: 300, title: '$V$: the curve $T\\Phi$ and the form $\\omega$' });
        const B = v.stage({ x: [0, 1], y: [-1, 1], height: 160, full: true, axes: 'box', xlabel: 'u', title: 'running integrals over the parameter interval $[0,u]$' });
        const P0 = L.handle(-1.25, -0.2, { color: 'accent', label: 'Φ(0)', labelPos: 'sw' });
        const P1 = L.handle(0.1, 1.45, { color: 'gray', r: 6 });
        const P2 = L.handle(1.25, 0.25, { color: 'accent', label: 'Φ(1)', labelPos: 'se' });
        v.legend([['accent', '$\\int_{T\\Phi|_{[0,u]}}\\omega$ (computed in $V$)'], ['orange', '$\\int_{\\Phi|_{[0,u]}}\\omega_T$ (computed in $E$)', { dash: true }], ['gold', 'moving point and its velocity', { dot: true }]]);
        const N = 600;
        let st = null;
        v.animate((t) => {
          const Mp = MAPS[mp.value], W = FORMS[fm.value].w;
          const phi = (u) => { const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u; return [a * P0.x + b * P1.x + c * P2.x, a * P0.y + b * P1.y + c * P2.y]; };
          const dphi = (u) => [2 * (1 - u) * (P1.x - P0.x) + 2 * u * (P2.x - P1.x), 2 * (1 - u) * (P1.y - P0.y) + 2 * u * (P2.y - P1.y)];
          const gam = (u) => { const p = phi(u); return Mp.T(p[0], p[1]); };
          const dgam = (u) => { const h = 1e-5, a = gam(u + h), b = gam(u - h); return [(a[0] - b[0]) / (2 * h), (a[1] - b[1]) / (2 * h)]; };
          const wT = (x, y) => { const [a, b] = W(...Mp.T(x, y)); const J = Mp.J(x, y); return [a * J[0][0] + b * J[1][0], a * J[0][1] + b * J[1][1]]; };
          // the grid of E and its image
          for (let i = -3; i <= 3; i++) {
            const c = i * 0.5;
            L.line(c, -1.5, c, 1.5, { color: 'grid', width: 1 }); L.line(-1.5, c, 1.5, c, { color: 'grid', width: 1 });
            R.curve((s) => Mp.T(c, s), -1.5, 1.5, { color: 'grid', width: 1, n: 80 }); R.curve((s) => Mp.T(s, c), -1.5, 1.5, { color: 'grid', width: 1, n: 80 });
          }
          L.field(wT, { spacing: 30, color: 'muted', alpha: 0.55 });
          R.field(W, { spacing: 30, color: 'muted', alpha: 0.55 });
          // running integrals (trapezoid in u; the integrands are computed independently on each side)
          const IV = [[0, 0]], IE = [[0, 0]]; let sV = 0, sE = 0, prevV = null, prevE = null;
          for (let i = 0; i <= N; i++) {
            const u = i / N;
            const g = gam(u), dg = dgam(u), wv = W(g[0], g[1]);
            const p = phi(u), dp = dphi(u), we = wT(p[0], p[1]);
            const fV = wv[0] * dg[0] + wv[1] * dg[1], fE = we[0] * dp[0] + we[1] * dp[1];
            if (i > 0) { sV += (fV + prevV) / (2 * N); sE += (fE + prevE) / (2 * N); IV.push([u, sV]); IE.push([u, sE]); }
            prevV = fV; prevE = fE;
          }
          // curves
          L.curve(phi, 0, 1, { color: 'panel', width: 6 }); L.curve(phi, 0, 1, { color: 'accent', width: 3 });
          R.curve(gam, 0, 1, { color: 'panel', width: 6, n: 300 }); R.curve(gam, 0, 1, { color: 'accent', width: 3, n: 300 });
          L.line(P0.x, P0.y, P1.x, P1.y, { color: 'gray', width: 1, dash: [3, 4] }); L.line(P1.x, P1.y, P2.x, P2.y, { color: 'gray', width: 1, dash: [3, 4] });
          headAt(L, phi(0.75), dphi(0.75), { color: 'accent', head: 10 });
          headAt(R, gam(0.75), dgam(0.75), { color: 'accent', head: 10 });
          // moving point and velocities
          const u = Math.min(1, (t % 6) / 5);
          const p = phi(u), dp = dphi(u), g = gam(u), dg = dgam(u);
          L.arrow(p[0], p[1], p[0] + 0.25 * dp[0], p[1] + 0.25 * dp[1], { color: 'gold', width: 2.4 });
          R.arrow(g[0], g[1], g[0] + 0.25 * dg[0], g[1] + 0.25 * dg[1], { color: 'gold', width: 2.4 });
          L.dot(p[0], p[1], { color: 'gold', r: 5.5 }); R.dot(g[0], g[1], { color: 'gold', r: 5.5 });
          R.tex('T\\Phi', gam(1)[0], gam(1)[1], { color: 'accent', dx: 14, dy: -10 });
          // bottom
          const ys = IV.map((q) => q[1]).concat(IE.map((q) => q[1]));
          const lo = Math.min(0, ...ys), hi = Math.max(0, ...ys), pad = Math.max(0.1, (hi - lo) * 0.12);
          B.setView(null, [lo - pad, hi + pad]);
          B.hline(0, { color: 'faint', width: 1 });
          B.path(IV, { color: 'accent', width: 4 });
          B.path(IE, { color: 'orange', width: 2, dash: [6, 5] });
          const k = Math.round(u * N);
          B.vline(u, { color: 'gold', width: 1, dash: [3, 3] });
          B.dot(u, IV[k][1], { color: 'gold', r: 4.5 });
          st = { sV, sE, u, cur: IV[k][1] };
        }, { period: 6 });
        v.readout(() => {
          if (!st) return '';
          return `$\\int_{T\\Phi}\\omega = ${v.fix(st.sV, 5)}$ (in $V$), $\\;\\int_\\Phi\\omega_T = ${v.fix(st.sE, 5)}$ (in $E$) — difference $${v.sci(Math.abs(st.sV - st.sE) + 1e-16, 2)}$, i.e. quadrature error only.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.26
    {
      num: '10.26',
      kind: 'Definition',
      name: 'Oriented affine simplexes',
      statement: String.raw`Call a map between vector spaces *affine* when it differs from a linear map by a constant, i.e. $f-f(0)$ is linear. The *standard simplex* $Q^k\subset\R^k$ consists of the points $u=(u_1,\dots,u_k)$ with all $u_i\ge0$ and $u_1+\dots+u_k\le1$.

For points $p_0,p_1,\dots,p_k$ of $\R^n$, the *oriented affine $k$-simplex* $\sigma=[p_0,p_1,\dots,p_k]$ is the $k$-surface with parameter domain $Q^k$ given by the affine map
$$\sigma(u)=p_0+\sum_{i=1}^k u_i\,(p_i-p_0)\qquad(u\in Q^k),$$
which sends $0$ to $p_0$ and $e_i$ to $p_i$. The order of the vertices is part of the data: listing the same vertices in another order gives $\bar\sigma=\varepsilon\sigma$, with $\varepsilon=\pm1$ the sign of the permutation. A $0$-simplex is a point carrying a sign, $+p_0$ or $-p_0$. When $k=n$, $\sigma$ is called *positively* or *negatively oriented* according to the sign of $\det[p_1-p_0,\dots,p_k-p_0]$.`,
      idea: String.raw`Affine simplexes are the building blocks for chains: they are the simplest $k$-surfaces, they can be glued along faces, and their boundaries are again simplexes (10.29). The determinant of the linear part $u\mapsto\sum u_i(p_i-p_0)$ is the Jacobian of $\sigma$; its sign records the orientation, which is why swapping two vertices reverses the sign of every integral (10.27). The identity map of $Q^k$ is the simplex $[0,e_1,\dots,e_k]$, positively oriented.`,
      caption: String.raw`Drag the point $u$ in $Q^2$ (left) and the vertices $p_0,p_1,p_2$ (right). The image point is reached from $p_0$ by going $u_1$ of the way along $p_1-p_0$ (orange) and then $u_2$ of the way along $p_2-p_0$ (purple); grid lines of $Q^2$ go to grid lines of $\sigma$. Drag $p_2$ across the line through $p_0,p_1$: the determinant changes sign and the simplex becomes negatively oriented (red).`,
      deps: ['pma-10.11'],
      tags: ['simplexes', 'orientation'],
      viz(v) {
        const Lq = v.stage({ x: [-0.22, 1.25], y: [-0.22, 1.2], equal: true, height: 300, axes: false, title: 'parameter domain $Q^2$' });
        const R = v.stage({ x: [-2.1, 2.1], y: [-1.5, 1.75], equal: true, height: 300, axes: false, title: '$\\sigma=[p_0,p_1,p_2]$ in $\\R^2$' });
        const a = Lq.handle(0.58, 0.18, { color: 'gold', label: 'u', constrain: (x, y) => { x = Math.max(0, x); y = Math.max(0, y); const s = x + y; if (s > 1) { x /= s; y /= s; } return [x, y]; } });
        const p = [R.handle(-1.35, -0.95, { color: 'ink', label: 'p₀', labelPos: 'sw' }), R.handle(1.45, -0.55, { color: 'ink', label: 'p₁', labelPos: 'se' }), R.handle(-0.15, 1.35, { color: 'ink', label: 'p₂', labelPos: 'n' })];
        v.legend([['orange', '$u_1(p_1-p_0)$'], ['purple', '$u_2(p_2-p_0)$'], ['gold', '$u$ and $\\sigma(u)$', { dot: true }]]);
        let st = null;
        v.render(() => {
          const P = p.map((h) => [h.x, h.y]);
          const A1 = sub2(P[1], P[0]), A2 = sub2(P[2], P[0]);
          const J = det2(A1, A2), pos = J > 0, col = pos ? 'accent' : 'red';
          const sig = (u1, u2) => [P[0][0] + u1 * A1[0] + u2 * A2[0], P[0][1] + u1 * A1[1] + u2 * A2[1]];
          // Q^2 and its grid
          Lq.poly([[0, 0], [1, 0], [0, 1]], { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.6 });
          for (let i = 1; i < 8; i++) { const c = i / 8; Lq.line(c, 0, c, 1 - c, { color: 'muted', alpha: 0.35, width: 1 }); Lq.line(0, c, 1 - c, c, { color: 'muted', alpha: 0.35, width: 1 }); }
          Lq.arrow(0, 0, 1, 0, { color: 'orange', width: 2.4 }); Lq.arrow(0, 0, 0, 1, { color: 'purple', width: 2.4 });
          Lq.tex('e_1', 1, 0, { color: 'orange', dy: 14 }); Lq.tex('e_2', 0, 1, { color: 'purple', dx: -14 }); Lq.tex('0', 0, 0, { color: 'muted', dx: -10, dy: 10 });
          Lq.line(0, 0, a.x, 0, { color: 'orange', width: 3.5 }); Lq.line(a.x, 0, a.x, a.y, { color: 'purple', width: 3.5 });
          // the simplex and the image grid
          R.poly(P, { fill: col, fillAlpha: 0.13, color: col, width: 2 });
          for (let i = 1; i < 8; i++) { const c = i / 8; R.segment(sig(c, 0), sig(c, 1 - c), { color: 'muted', alpha: 0.35, width: 1 }); R.segment(sig(0, c), sig(1 - c, c), { color: 'muted', alpha: 0.35, width: 1 }); }
          R.arrow(P[0][0], P[0][1], P[1][0], P[1][1], { color: 'orange', width: 2, alpha: 0.6 });
          R.arrow(P[0][0], P[0][1], P[2][0], P[2][1], { color: 'purple', width: 2, alpha: 0.6 });
          const m = sig(a.x, 0), q = sig(a.x, a.y);
          R.segment(P[0], m, { color: 'orange', width: 3.5 }); R.segment(m, q, { color: 'purple', width: 3.5 });
          R.dot(q[0], q[1], { color: 'gold', r: 6, label: 'σ(u)', labelPos: 'ne' });
          // orientation: the circulation p0 → p1 → p2
          const c = cen(P), per = Math.hypot(...A1) + Math.hypot(...A2) + Math.hypot(...sub2(P[2], P[1]));
          const inr = Math.abs(J) / per;
          if (inr > 0.06) spinArrow(R, c, 0.42 * inr, Math.sign(J), { color: col, width: 2 });
          R.corner(pos ? 'positively oriented: det > 0' : (Math.abs(J) < 1e-9 ? 'degenerate' : 'negatively oriented: det < 0'), 'tl', { color: col, weight: 600 });
          st = { q, J, pos, u: [a.x, a.y] };
        });
        v.readout(() => {
          if (!st) return '';
          return `$u=(${v.fix(st.u[0], 2)},\\,${v.fix(st.u[1], 2)})$, $\\;\\sigma(u)=p_0+u_1(p_1-p_0)+u_2(p_2-p_0)=(${v.fix(st.q[0], 2)},\\,${v.fix(st.q[1], 2)})$; $\\;J_\\sigma=\\det[p_1-p_0,\\;p_2-p_0]=${v.fix(st.J, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.27
    {
      num: '10.27',
      kind: 'Theorem',
      name: 'Reordering vertices multiplies integrals by ±1',
      statement: String.raw`Reordering the vertices of an oriented affine simplex changes integrals over it by a sign at most. If $\sigma$ is an oriented affine $k$-simplex in an open set $E\subset\R^n$ and $\bar\sigma=\varepsilon\sigma$, where $\varepsilon=\pm1$ is the sign of the permutation carrying the vertex list of $\sigma$ to that of $\bar\sigma$, then every $k$-form $\omega$ in $E$ satisfies
$$\int_{\bar\sigma}\omega=\varepsilon\int_\sigma\omega .$$`,
      idea: String.raw`For $k=0$ this is the definition. For $k\ge1$ every permutation is a product of transpositions, so it suffices to swap two vertices. Swapping $p_i$ and $p_j$ with $i,j\ge1$ is the change of variables $u_i\leftrightarrow u_j$, a flip of $Q^k$ that swaps two columns of the Jacobian matrix. Swapping $p_0$ with $p_1$ corresponds to the affine bijection $u_1\mapsto1-u_1-\dots-u_k$ of $Q^k$, which also has Jacobian $-1$. In both cases the integrand over $Q^k$ is the same function composed with a measure-preserving map of $Q^k$, multiplied by $-1$, because the integral of a $k$-form uses the *signed* Jacobian determinant.`,
      caption: String.raw`The form is $\omega=f\,dx\wedge dy$ with $f$ shown as shading. Choose an ordering $\bar\sigma$ of the vertices $A,B,C$ and drag them. The grid and the arrows show how $\bar\sigma$ parametrizes the same triangle starting from its first vertex. The bar chart computes all six integrals independently: even permutations (blue) give $\int_\sigma\omega$, odd ones (red) give exactly its negative.`,
      deps: ['pma-10.26', 'pma-9.34', 'pma-10.9'],
      tags: ['simplexes', 'orientation'],
      viz(v) {
        const NM = ['A', 'B', 'C'];
        const PERMS = [[0, 1, 2], [1, 2, 0], [2, 0, 1], [1, 0, 2], [0, 2, 1], [2, 1, 0]];
        const SG = [1, 1, 1, -1, -1, -1];
        const lab = (pm) => '[' + pm.map((i) => NM[i]).join(',') + ']';
        const which = v.select('$\\bar\\sigma=$', PERMS.map((pm, i) => ({ value: i, label: '$' + lab(pm) + '$' })), 3);
        const f = (x, y) => 1 + 0.6 * Math.sin(1.7 * x + 0.4) * Math.cos(1.3 * y) + 0.25 * y;
        const S = v.stage({ x: [-2, 2], y: [-1.5, 1.7], equal: true, height: 320, axes: false, title: '$\\omega=f\\,dx\\wedge dy$ and the simplex $\\bar\\sigma$' });
        const Bs = v.stage({ x: [-0.6, 5.6], y: [-3, 3], height: 320, axes: 'box', weight: 0.8, xticks: PERMS.map((pm, i) => [i, lab(pm)]), title: '$\\int_{\\bar\\sigma}\\omega$ for all six orderings' });
        const H = [S.handle(-1.3, -0.95, { color: 'ink' }), S.handle(1.4, -0.7, { color: 'ink' }), S.handle(0.1, 1.15, { color: 'ink' })];
        v.legend([['orange', 'first edge: $p_1-p_0$'], ['purple', 'second edge: $p_2-p_0$'], ['accent', 'even ordering ($\\varepsilon=+1$)', { area: true }], ['red', 'odd ordering ($\\varepsilon=-1$)', { area: true }]]);
        let st = null;
        v.render(() => {
          S.heat(f, { range: [-0.6, 2.6], cmap: 'viridis', res: 3, alpha: 0.4, key: 'f' });
          const pts = H.map((h) => [h.x, h.y]);
          const vals = PERMS.map((pm) => {
            const P = pm.map((i) => pts[i]); const A1 = sub2(P[1], P[0]), A2 = sub2(P[2], P[0]); const J = det2(A1, A2);
            return quadQ2((u1, u2) => f(P[0][0] + u1 * A1[0] + u2 * A2[0], P[0][1] + u1 * A1[1] + u2 * A2[1]) * J, 3);
          });
          const k = which.value, pm = PERMS[k], P = pm.map((i) => pts[i]);
          const A1 = sub2(P[1], P[0]), A2 = sub2(P[2], P[0]), J = det2(A1, A2), col = J > 0 ? 'accent' : 'red';
          const sig = (u1, u2) => [P[0][0] + u1 * A1[0] + u2 * A2[0], P[0][1] + u1 * A1[1] + u2 * A2[1]];
          S.poly(P, { fill: col, fillAlpha: 0.16, color: col, width: 2.2 });
          for (let i = 1; i < 6; i++) { const c = i / 6; S.segment(sig(c, 0), sig(c, 1 - c), { color: 'ink', alpha: 0.25, width: 1 }); S.segment(sig(0, c), sig(1 - c, c), { color: 'ink', alpha: 0.25, width: 1 }); }
          S.arrow(P[0][0], P[0][1], ...lerp2(P[0], P[1], 0.97), { color: 'orange', width: 3, head: 11 });
          S.arrow(P[0][0], P[0][1], ...lerp2(P[0], P[2], 0.97), { color: 'purple', width: 3, head: 11 });
          ['p_0', 'p_1', 'p_2'].forEach((s, i) => { const d = sub2(P[i], cen(P)), L = Math.hypot(...d) || 1; S.tex(`${s}=${NM[pm[i]]}`, P[i][0] + 0.3 * d[0] / L, P[i][1] + 0.3 * d[1] / L, { color: 'ink', size: 15 }); });
          const c = cen(P), per = Math.hypot(...A1) + Math.hypot(...A2) + Math.hypot(...sub2(P[2], P[1]));
          if (Math.abs(J) / per > 0.06) spinArrow(S, c, 0.5 * Math.abs(J) / per, Math.sign(J), { color: col, width: 2 });
          // bars
          const mx = Math.max(0.2, ...vals.map(Math.abs)) * 1.3;
          Bs.setView(null, [-mx, mx]);
          Bs.hline(0, { color: 'faint', width: 1 });
          Bs.hline(vals[0], { color: 'accent', width: 1, dash: [4, 4], alpha: 0.7 }); Bs.hline(-vals[0], { color: 'red', width: 1, dash: [4, 4], alpha: 0.7 });
          Bs.bars(vals, { x0: 0, dx: 1, color: (_, i) => (SG[i] > 0 ? 'accent' : 'red'), barWidth: 0.62 });
          Bs.rect(k - 0.42, 0, k + 0.42, vals[k], { color: 'ink', width: 2 });
          st = { vals, k };
        });
        v.readout(() => {
          if (!st) return '';
          const { vals, k } = st, e = SG[k];
          return `$\\bar\\sigma=${lab(PERMS[k])}$ is an ${e > 0 ? 'even' : 'odd'} permutation of $\\sigma=[A,B,C]$, so $\\varepsilon=${e > 0 ? '+1' : '-1'}$: $\\;\\int_{\\bar\\sigma}\\omega=${v.fix(vals[k], 5)}$ and $\\varepsilon\\int_{\\sigma}\\omega=${v.fix(e * vals[0], 5)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.28
    {
      num: '10.28',
      kind: 'Definition',
      name: 'Affine chains',
      statement: String.raw`Finite formal sums of simplexes are called chains. An *affine $k$-chain* in an open set $E\subset\R^n$ is a finite list $\sigma_1,\dots,\sigma_r$ of oriented affine $k$-simplexes in $E$, in which the same simplex may occur several times; it is written
$$\Gamma=\sigma_1+\dots+\sigma_r ,$$
and a $k$-form $\omega$ in $E$ is integrated over it term by term: $\int_\Gamma\omega=\sum_{i}\int_{\sigma_i}\omega$. A chain is not a point set: writing $-\sigma$ for $\sigma$ with two vertices exchanged, the chain $\sigma+(-\sigma)$ integrates every form to $0$ by 10.27, while $\sigma+\sigma=2\sigma$ doubles every integral.`,
      idea: String.raw`Chains are what boundaries are made of (10.29): the boundary of a simplex is a signed sum of simplexes of one dimension lower. Defining the integral additively makes $\Gamma\mapsto\int_\Gamma\omega$ a linear function of the chain, so integer coefficients behave exactly like multiplicities, and oppositely oriented copies cancel.`,
      caption: String.raw`Drag $A$, $B$, $C$ and set the integer coefficients of the three oriented segments $\sigma_1=[A,B]$, $\sigma_2=[B,C]$, $\sigma_3=[C,A]$; negative coefficients reverse the arrows. The bar chart shows each contribution $c_i\int_{\sigma_i}\omega$ and their sum $\int_\Gamma\omega$. With all coefficients $1$ the chain is $\partial[A,B,C]$; for the exact form $d(xy)$ every closed chain integrates to $0$.`,
      deps: ['pma-10.26', 'pma-10.27'],
      tags: ['chains', 'simplexes'],
      viz(v) {
        const FORMS = {
          rot: { label: '$\\omega=-y\\,dx+x\\,dy$', w: (x, y) => [-y, x] },
          ex: { label: '$\\omega=d(xy)=y\\,dx+x\\,dy$', w: (x, y) => [y, x] },
        };
        const fm = v.select('', Object.entries(FORMS).map(([value, o]) => ({ value, label: o.label })), 'rot');
        const cs = [v.slider('$c_1$', -2, 2, 1, { int: true }), v.slider('$c_2$', -2, 2, 1, { int: true }), v.slider('$c_3$', -2, 2, 1, { int: true })];
        const S = v.stage({ x: [-2, 2], y: [-1.45, 1.6], equal: true, height: 320, axes: false, title: '$\\Gamma=c_1[A,B]+c_2[B,C]+c_3[C,A]$' });
        const Bs = v.stage({ x: [0.4, 4.6], y: [-3, 3], height: 320, axes: 'box', weight: 0.75, xticks: [[1, 'c₁∫σ₁'], [2, 'c₂∫σ₂'], [3, 'c₃∫σ₃'], [4, '∫Γ ω']], title: 'contributions $c_i\\int_{\\sigma_i}\\omega$ and the total' });
        const H = [S.handle(-1.35, -0.85, { color: 'ink', label: 'A', labelPos: 'sw' }), S.handle(1.35, -0.9, { color: 'ink', label: 'B', labelPos: 'se' }), S.handle(0.2, 1.25, { color: 'ink', label: 'C', labelPos: 'n' })];
        v.legend([['accent', 'positive coefficient'], ['red', 'negative coefficient (orientation reversed)'], ['green', '$\\int_\\Gamma\\omega$', { area: true }]]);
        let st = null;
        v.render(() => {
          const W = FORMS[fm.value].w;
          S.field(W, { spacing: 32, color: 'muted', alpha: 0.4 });
          const P = H.map((h) => [h.x, h.y]), C0 = cen(P);
          const segs = [[0, 1], [1, 2], [2, 0]];
          const I = segs.map(([i, j]) => lineInt(W, (t) => lerp2(P[i], P[j], t), 2));
          const c = cs.map((s) => s.value);
          segs.forEach(([i, j], k) => {
            const a = P[i], b = P[j], ck = c[k];
            if (ck === 0) { S.segment(a, b, { color: 'faint', width: 1.6, dash: [5, 5] }); return; }
            const col = ck > 0 ? 'accent' : 'red', dir = ck > 0 ? sub2(b, a) : sub2(a, b);
            S.segment(a, b, { color: col, width: 1.8 + 1.4 * Math.abs(ck) });
            const fr = Math.abs(ck) === 1 ? [0.5] : [0.4, 0.6];
            for (const f of fr) headAt(S, lerp2(a, b, f), dir, { color: col, head: 11, width: 2 });
            const mid = lerp2(a, b, 0.5), out = sub2(mid, C0), Lo = Math.hypot(...out) || 1;
            S.text(`${ck === 1 ? '' : ck === -1 ? '−' : String(ck).replace('-', '−')}σ${SUBS[k + 1]}`, mid[0] + 0.3 * out[0] / Lo, mid[1] + 0.3 * out[1] / Lo, { color: col, math: true, align: 'center', size: 17 });
          });
          const contrib = I.map((x, k) => c[k] * x), tot = contrib.reduce((s, x) => s + x, 0);
          const mx = Math.max(0.5, ...contrib.map(Math.abs), Math.abs(tot)) * 1.25;
          Bs.setView(null, [-mx, mx]);
          Bs.hline(0, { color: 'faint', width: 1 });
          Bs.bars(contrib, { x0: 1, dx: 1, color: (_, k) => (c[k] >= 0 ? 'accent' : 'red'), barWidth: 0.6 });
          Bs.bars([tot], { x0: 4, dx: 1, color: 'green', barWidth: 0.6 });
          st = { I, c, tot, ex: fm.value === 'ex' };
        });
        v.readout(() => {
          if (!st) return '';
          const { I, c, tot, ex } = st;
          const terms = I.map((x, k) => `${c[k]}\\cdot(${v.fix(x, 3)})`).join(' + ');
          let note = '';
          if (c[0] === 1 && c[1] === 1 && c[2] === 1) note = ' Here $\\Gamma=\\partial[A,B,C]$.';
          if (ex && c[0] === c[1] && c[1] === c[2] && c[0] !== 0) note += ' The chain is closed and $\\omega$ is exact, so the integral vanishes.';
          return `$\\int_\\Gamma\\omega=\\sum_i c_i\\int_{\\sigma_i}\\omega=${terms.replace(/\+ -/g, '- ')}=${v.fix(tot, 4)}$.${note}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.29
    {
      num: '10.29',
      kind: 'Definition',
      name: 'Boundary of an oriented simplex',
      statement: String.raw`The *boundary* of an oriented affine $k$-simplex $\sigma=[p_0,p_1,\dots,p_k]$ ($k\ge1$) is the alternating sum of its faces, the $(k-1)$-simplexes obtained by deleting one vertex at a time:
$$\partial\sigma=\sum_{j=0}^{k}(-1)^j\,[p_0,\dots,p_{j-1},p_{j+1},\dots,p_k].$$
Thus $\partial[p_0,p_1]=p_1-p_0$, and
$$\partial[p_0,p_1,p_2]=[p_1,p_2]-[p_0,p_2]+[p_0,p_1]=[p_0,p_1]+[p_1,p_2]+[p_2,p_0].$$
For an affine chain, $\partial$ is applied to each simplex and the results are added.`,
      idea: String.raw`The alternating signs make the faces fit together coherently: the boundary of a triangle runs once around it, and the four faces of a tetrahedron all receive the outward (or all the inward) orientation. Applying $\partial$ twice, every $(k-2)$-face appears twice with opposite signs, so $\partial\partial\sigma=0$ — the boundary of a boundary is zero. (Rudin derives this in Remark 10.35 from Stokes' theorem and $d^2=0$; it is also a direct count, made below.)`,
      caption: String.raw`Left ($k=2$): drag the vertices. In the first mode each face of $\partial\sigma$ is drawn as written, with its sign; absorbing the minus sign into $[p_0,p_2]$ turns it into $[p_2,p_0]$ and the three faces form one circuit. In the second mode the boundary of each face is drawn as signed end points: every vertex receives a $+$ and a $-$. Right ($k=3$, drag to rotate): the faces of $\partial[p_0,p_1,p_2,p_3]$ all point outward, and in $\partial\partial$ each edge carries two opposite arrows.`,
      deps: ['pma-10.28'],
      tags: ['chains', 'boundary'],
      viz(v) {
        const mode = v.select('', [{ value: 'd1', label: 'faces of $\\partial\\sigma$, with signs' }, { value: 'd2', label: 'boundary of the boundary, $\\partial\\partial\\sigma$' }], 'd1');
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.45, 1.6], equal: true, height: 330, axes: false, title: '$k=2$: $\\sigma=[p_0,p_1,p_2]$' });
        const T3 = v.stage3d({ range: 1.3, height: 330, axes: false, yaw: -1.0, pitch: 0.5, title: '$k=3$: $\\tau=[p_0,p_1,p_2,p_3]$' });
        const H = [S.handle(-1.3, -0.95, { color: 'ink', label: 'p₀', labelPos: 'sw' }), S.handle(1.35, -0.75, { color: 'ink', label: 'p₁', labelPos: 'se' }), S.handle(-0.05, 1.15, { color: 'ink', label: 'p₂', labelPos: 'n' })];
        // tetrahedron [0, e1, e2, e3], centred
        const Q = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]].map((p) => p.map((x) => 1.45 * (x - 0.25)));
        const FC = ['accent', 'orange', 'purple', 'teal'];
        const V3 = v.M;
        let st = null;
        v.render(() => {
          const P = H.map((h) => [h.x, h.y]), C = cen(P);
          const J = det2(sub2(P[1], P[0]), sub2(P[2], P[0]));
          S.poly(P, { fill: J > 0 ? 'accent' : 'red', fillAlpha: 0.07, stroke: false });
          const faces = [{ v: [1, 2], s: 1 }, { v: [0, 2], s: -1 }, { v: [0, 1], s: 1 }];
          const ins = (p, k = 0.14) => lerp2(p, C, k);
          if (mode.value === 'd1') {
            P.forEach((p, i) => S.segment(p, P[(i + 1) % 3], { color: 'faint', width: 1 }));
            faces.forEach(({ v: [i, j], s }) => {
              const a = ins(P[i]), b = ins(P[j]), col = s > 0 ? 'accent' : 'red';
              segArrow(S, lerp2(a, b, 0.06), lerp2(a, b, 0.94), { color: col, width: 2.6, head: 11, at: 0.6 });
              const mid = lerp2(P[i], P[j], 0.5), out = sub2(mid, C), L = Math.hypot(...out) || 1;
              S.tex(`${s > 0 ? '+' : '-'}[p_${i},p_${j}]`, mid[0] + 0.24 * out[0] / L, mid[1] + 0.24 * out[1] / L, { color: col, size: 15 });
            });
          } else {
            P.forEach((p, i) => S.segment(p, P[(i + 1) % 3], { color: 'ink', alpha: 0.35, width: 1.4 }));
            faces.forEach(({ v: [i, j], s }) => {
              // ∂(s[p_i,p_j]) = s p_j − s p_i, drawn near the end points of that edge
              [[j, s], [i, -s]].forEach(([q, sg]) => {
                const other = q === i ? j : i;
                const pos = lerp2(ins(P[q], 0.2), ins(P[other], 0.2), 0.2);
                S.dot(pos[0], pos[1], { color: sg > 0 ? 'green' : 'red', r: 11, alpha: 0.18, ring: false });
                S.tex(`${sg > 0 ? '+' : '-'}p_${q}`, pos[0], pos[1], { color: sg > 0 ? 'green' : 'red', size: 14 });
              });
            });
            S.corner('each vertex: one + and one −, net 0', 'tl', { color: 'green', weight: 600 });
          }
          // ---- 3D: the tetrahedron
          const TC = [0, 0, 0];
          for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) T3.line(Q[a], Q[b], { color: 'ink', alpha: 0.35, width: 1.2 });
          const counts = new Map();
          for (let j = 0; j < 4; j++) {
            const idx = [0, 1, 2, 3].filter((i) => i !== j), s = j % 2 ? -1 : 1;
            const cyc = s > 0 ? idx : [idx[0], idx[2], idx[1]];
            const fc = [0, 1, 2].map((d) => (Q[idx[0]][d] + Q[idx[1]][d] + Q[idx[2]][d]) / 3);
            const shrink = mode.value === 'd1' ? 0.78 : 0.7;
            const pts = cyc.map((i) => Q[i].map((x, d) => fc[d] + shrink * (x - fc[d])));
            T3.poly(pts, { fill: FC[j], fillAlpha: mode.value === 'd1' ? 0.26 : 0.12, color: FC[j], width: 1 });
            if (mode.value === 'd1') {
              const n = V3.normalize(V3.cross3(V3.vsub(Q[cyc[1]], Q[cyc[0]]), V3.vsub(Q[cyc[2]], Q[cyc[0]])));
              const tip = V3.vadd(fc, V3.vscale(n, 0.42));
              T3.arrow(fc, tip, { color: FC[j], width: 2.4, head: 9 });
              T3.tex(`${s > 0 ? '+' : '-'}[${idx.map((i) => 'p_' + i).join(',')}]`, V3.vadd(fc, V3.vscale(n, 0.6)), { color: FC[j], size: 13 });
            } else {
              for (let e = 0; e < 3; e++) {
                const a = pts[e], b = pts[(e + 1) % 3];
                T3.line(a, b, { color: FC[j], width: 2 });
                T3.arrow(V3.vlerp(a, b, 0.42), V3.vlerp(a, b, 0.6), { color: FC[j], width: 2, head: 9 });
                const ia = cyc[e], ib = cyc[(e + 1) % 3], key = Math.min(ia, ib) + '' + Math.max(ia, ib);
                counts.set(key, (counts.get(key) || 0) + (ia < ib ? 1 : -1));
              }
            }
          }
          Q.forEach((p, i) => T3.text('p' + SUBS[i], V3.vadd(p, V3.vscale(V3.normalize(V3.vsub(p, TC)), 0.16)), { color: 'ink', math: true }));
          st = { mode: mode.value, counts };
        });
        v.readout(() => {
          if (!st) return '';
          if (st.mode === 'd1') return '$\\partial[p_0,p_1,p_2]=[p_1,p_2]-[p_0,p_2]+[p_0,p_1]=[p_0,p_1]+[p_1,p_2]+[p_2,p_0]$, one circuit; $\\;\\partial[p_0,p_1,p_2,p_3]=[p_1,p_2,p_3]-[p_0,p_2,p_3]+[p_0,p_1,p_3]-[p_0,p_1,p_2]$, and every face normal (right-hand rule, sign included) points out of the tetrahedron.';
          const net = [...st.counts.values()];
          return `$\\partial\\partial[p_0,p_1,p_2]=(p_2-p_1)-(p_2-p_0)+(p_1-p_0)=0$. For the tetrahedron, $\\partial\\partial\\tau$ has $12$ edge terms; the net multiplicity of each of the ${net.length} edges is $${net.join(',\\,')}$, so $\\partial\\partial\\tau=0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.30
    {
      num: '10.30',
      kind: 'Definition',
      name: 'Differentiable simplexes and chains',
      statement: String.raw`Curved simplexes are affine ones pushed through smooth maps. Let $E\subset\R^n$ and $V\subset\R^m$ be open and let $T:E\to V$ be a $\mathscr{C}''$-mapping, one-to-one or not. Each oriented affine $k$-simplex $\sigma$ in $E$ yields the *oriented $k$-simplex of class $\mathscr{C}''$* $\Phi=T\circ\sigma$ in $V$, a $k$-surface with parameter domain $Q^k$, whose boundary is defined by pushing forward that of $\sigma$:
$$\partial\Phi=T(\partial\sigma),$$
the $(k-1)$-chain formed by composing $T$ with every face of $\sigma$. Finite sums $\Psi=\Phi_1+\dots+\Phi_r$ of such simplexes are the *$k$-chains of class $\mathscr{C}''$* in $V$; they are integrated and differentiated termwise, $\int_\Psi\omega=\sum_i\int_{\Phi_i}\omega$ and $\partial\Psi=\sum_i\partial\Phi_i$.`,
      idea: String.raw`Curved simplexes are affine simplexes pushed forward by a smooth map, and their boundaries are pushed forward with them. Because $T$ may collapse things, parts of $\partial\Phi$ can degenerate to points (where every $1$-form integrates to $0$) or be traversed twice in opposite directions (where integrals cancel). Rudin's sphere (Example 10.32) shows both: the rectangle $[0,\pi]\times[0,2\pi]$ — the sum of two affine simplexes — is mapped onto the unit sphere by $\Sigma(u,v)=(\sin u\cos v,\sin u\sin v,\cos u)$, and $\partial\Sigma=0$.`,
      caption: String.raw`The gold point runs around $\partial D$ on the left; on the right its image runs around $\partial\Phi=\Sigma(\partial D)$. The edge $\gamma_4$ ($u=0$) collapses to the north pole, and $\gamma_1$, $\gamma_3$ run along the same meridian in opposite directions (drawn slightly apart). Only the latitude circle $\gamma_2$ survives. Slide $u_{\max}$ to $\pi$: $\gamma_2$ shrinks to the south pole and the boundary of the whole sphere integrates every $1$-form to $0$.`,
      deps: ['pma-10.29', 'pma-10.26', 'pma-10.25'],
      tags: ['chains', 'boundary', 'surfaces'],
      viz(v) {
        const PI = Math.PI, TAU = 2 * PI;
        const um = v.slider('$u_{\\max}$', 0.5, PI, 2.35, { step: 0.01 });
        const D = v.stage({ x: [-0.55, 3.75], y: [-0.7, 6.95], equal: true, height: 370, weight: 0.7, minWidth: 220, axes: 'box', xlabel: 'u', ylabel: 'v', xticks: [[0, '0'], [PI / 2, 'π/2'], [PI, 'π']], yticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], title: 'parameter rectangle $D=[0,u_{\\max}]\\times[0,2\\pi]$' });
        const S3 = v.stage3d({ range: 1.3, height: 370, yaw: -0.55, pitch: 0.35, title: '$\\Phi=\\Sigma|_D$ on the unit sphere' });
        const Sg = (u, w) => [Math.sin(u) * Math.cos(w), Math.sin(u) * Math.sin(w), Math.cos(u)];
        const EC = ['accent', 'green', 'orange', 'purple'];
        v.legend([['accent', '$\\gamma_1$'], ['green', '$\\gamma_2$'], ['orange', '$\\gamma_3$'], ['purple', '$\\gamma_4$ (collapses to a pole)'], ['gold', 'moving point', { dot: true }]]);
        const lam = (p, d) => p[2] * d[0] + p[0] * d[1]; // λ = z dx + x dy
        let st = null;
        v.animate((t) => {
          const U = um.value;
          const E = [{ a: [0, 0], b: [U, 0] }, { a: [U, 0], b: [U, TAU] }, { a: [U, TAU], b: [0, TAU] }, { a: [0, TAU], b: [0, 0] }];
          // left panel
          D.rect(0, 0, U, TAU, { fill: 'accent', fillAlpha: 0.1, stroke: false });
          D.line(U, 0, 0, TAU, { color: 'muted', width: 1, dash: [4, 4] });
          D.tex('\\sigma_1', U * 0.3, TAU * 0.3, { color: 'muted', size: 13 }); D.tex('\\sigma_2', U * 0.7, TAU * 0.7, { color: 'muted', size: 13 });
          E.forEach((e, i) => segArrow(D, e.a, e.b, { color: EC[i], width: 3.2, head: 11 }));
          D.tex('\\gamma_1', U / 2, 0, { color: EC[0], dy: 15 }); D.tex('\\gamma_2', U, PI, { color: EC[1], dx: 18 });
          D.tex('\\gamma_3', U / 2, TAU, { color: EC[2], dy: -15 }); D.tex('\\gamma_4', 0, PI, { color: EC[3], dx: -18 });
          const s = (t % 8) / 2, i = Math.min(3, Math.floor(s)), q = lerp2(E[i].a, E[i].b, s - i);
          D.dot(q[0], q[1], { color: 'gold', r: 6 });
          // right panel: surface and the image of ∂D
          S3.surface(Sg, [0, U], [0, TAU], { nu: 16, nv: 40, color: 'accent', alpha: 0.42 });
          if (U < PI - 0.02) S3.surface(Sg, [U, PI], [0, TAU], { nu: 8, nv: 40, color: 'gray', alpha: 0.1, shade: false });
          const off = 0.07, mer = (w, u0, u1) => { const pts = []; for (let k = 0; k <= 40; k++) pts.push(Sg(u0 + (u1 - u0) * k / 40, w)); return pts; };
          const m1 = mer(off, 0, U), m3 = mer(-off, U, 0);
          S3.path(m1, { color: EC[0], width: 3, bias: -0.02 }); S3.path(m3, { color: EC[2], width: 3, bias: -0.02 });
          S3.arrow(m1[18], m1[23], { color: EC[0], width: 3, head: 11, bias: -0.03 }); S3.arrow(m3[18], m3[23], { color: EC[2], width: 3, head: 11, bias: -0.03 });
          if (U < PI - 0.02) {
            const lat = []; for (let k = 0; k <= 90; k++) lat.push(Sg(U, TAU * k / 90));
            S3.path(lat, { color: EC[1], width: 3, bias: -0.02 });
            for (const k of [20, 65]) S3.arrow(lat[k], lat[k + 4], { color: EC[1], width: 3, head: 11, bias: -0.03 });
          } else S3.dot([0, 0, -1], { color: EC[1], r: 6, label: 'S' });
          S3.dot([0, 0, 1], { color: EC[3], r: 6, label: 'N' });
          S3.dot(Sg(q[0], q[1] === TAU ? TAU : q[1]), { color: 'gold', r: 6, bias: -0.05 });
          // integrals of λ = z dx + x dy over the four pieces
          const I = E.map((e) => quad((tt) => { const h = 1e-5, a = lerp2(e.a, e.b, tt), p = Sg(a[0], a[1]); const pa = Sg(...lerp2(e.a, e.b, tt + h)), pb = Sg(...lerp2(e.a, e.b, tt - h)); return lam(p, [(pa[0] - pb[0]) / (2 * h), (pa[1] - pb[1]) / (2 * h)]); }, 0, 1, 6));
          st = { I, U };
        }, { period: 8 });
        v.readout(() => {
          if (!st) return '';
          const { I, U } = st, tot = I.reduce((a, b) => a + b, 0);
          return `For $\\lambda=z\\,dx+x\\,dy$: $\\int_{\\gamma_1}\\lambda=${v.fix(I[0], 4)}$, $\\int_{\\gamma_2}\\lambda=${v.fix(I[1], 4)}$, $\\int_{\\gamma_3}\\lambda=${v.fix(I[2], 4)}$, $\\int_{\\gamma_4}\\lambda=${v.fix(I[3], 4)}$; total $\\int_{\\partial\\Phi}\\lambda=${v.fix(tot, 4)}$` + (U > PI - 0.02 ? ' — the whole sphere: $\\partial\\Sigma=0$.' : ` $=\\pi\\sin^2 u_{\\max}$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 10.31
    {
      num: '10.31',
      kind: 'Definition',
      name: 'Positively oriented boundaries',
      statement: String.raw`The standard simplex carries a preferred orientation: the identity map $\sigma_0=[0,e_1,\dots,e_n]$ of $Q^n$ is a positively oriented $n$-simplex, and the chain $\partial\sigma_0$ is called the *positively oriented boundary* of $Q^n$.

Maps that preserve orientation transport it. If $E=T(Q^n)$ for a one-to-one $\mathscr{C}''$-mapping $T:Q^n\to\R^n$ whose Jacobian is positive (at least on the interior of $Q^n$), put $\partial E=\partial T=T(\partial\sigma_0)$. If a set $\Omega$ is the union of finitely many such pieces $E_i=T_i(Q^n)$ with pairwise disjoint interiors, its positively oriented boundary is the $(n-1)$-chain $\partial\Omega=\partial T_1+\dots+\partial T_r$.`,
      idea: String.raw`Positive Jacobians make every piece induce the same orientation on the edges it shares with its neighbours, but in opposite directions, so all interior faces cancel and only the geometric boundary of $\Omega$ survives, traversed with $\Omega$ on its left (when $n=2$). For example the unit square is the union of $[0,e_1,e_2]$ and $[e_1+e_2,e_2,e_1]$; their common diagonal appears with both orientations and drops out. (Rudin notes, without proof, that $\partial\Omega$ does not depend on how $\Omega$ is cut into pieces.)`,
      caption: String.raw`Left: the positively oriented boundary of $Q^2$, one colour per face. Right: each piece $T_i(Q^2)$ carries its own boundary $\partial T_i=T_i(\partial\sigma_0)$, drawn just inside it in the same colours. Interior edges (grey dashes) are traversed twice in opposite directions and cancel; what is left (green) is $\partial\Omega$. In the second mode drag the corners of $T(I^2)$: when the Jacobian of the bilinear map $T$ becomes negative somewhere, the construction fails. The readout checks $\int_{\partial\Omega}x\,dy=\operatorname{area}(\Omega)$.`,
      deps: ['pma-10.30', 'pma-9.24'],
      tags: ['boundary', 'orientation'],
      viz(v) {
        const mode = v.select('', [{ value: 'sq', label: 'unit square $I^2$' }, { value: 'quad', label: '$T(I^2)$, $T$ bilinear' }, { value: 'ann', label: 'annulus (polar coordinates)' }], 'ann');
        const aR = v.slider('inner radius $a$', 0.15, 0.8, 0.42, { step: 0.01 });
        const Q = v.stage({ x: [-0.28, 1.3], y: [-0.28, 1.3], equal: true, height: 340, axes: false, weight: 0.7, minWidth: 220, title: '$Q^2$ and its positively oriented boundary $\\partial\\sigma_0$' });
        const S = v.stage({ x: [-1.3, 1.3], y: [-1.25, 1.25], equal: true, height: 340, axes: false, title: '$\\Omega=\\bigcup T_i(Q^2)$ and the chains $\\partial T_i=T_i(\\partial\\sigma_0)$' });
        const C = [S.handle(-1.2, -0.9, { color: 'ink' }), S.handle(1.3, -1.05, { color: 'ink' }), S.handle(1.05, 1.05, { color: 'ink' }), S.handle(-1.0, 0.85, { color: 'ink' })];
        const FCOL = ['purple', 'teal', 'orange']; // images of [e1,e2], [e2,0], [0,e1]
        v.legend([['orange', 'image of $[0,e_1]$'], ['purple', 'image of $[e_1,e_2]$'], ['teal', 'image of $-[0,e_2]=[e_2,0]$'], ['muted', 'interior edges (cancel)', { dash: true }], ['green', '$\\partial\\Omega$']]);
        let last = null, st = null;
        const rectSimps = (r0, r1, t0, t1) => [[[r0, t0], [r1, t0], [r0, t1]], [[r1, t1], [r0, t1], [r1, t0]]];
        v.render(() => {
          const m = mode.value;
          if (m !== last) {
            last = m;
            if (m === 'sq') S.setView([-0.3, 1.3], [-0.3, 1.3]);
            else if (m === 'quad') S.setView([-1.6, 1.6], [-1.35, 1.35]);
            else S.setView([-1.3, 1.3], [-1.25, 1.25]);
          }
          aR.el.hidden = m !== 'ann';
          C.forEach((h) => { h.visible = m === 'quad'; });
          // ---- Q^2 and ∂σ0 = [e1,e2] − [0,e2] + [0,e1]
          const q0 = [[0, 0], [1, 0], [0, 1]];
          Q.poly(q0, { fill: 'accent', fillAlpha: 0.1, stroke: false });
          [[1, 2], [2, 0], [0, 1]].forEach(([a, b], k) => segArrow(Q, q0[a], q0[b], { color: FCOL[k], width: 3, head: 11 }));
          Q.tex('[e_1,e_2]', 0.62, 0.62, { color: FCOL[0], size: 14, align: 'left' });
          Q.tex('-[0,e_2]', 0, 0.5, { color: FCOL[1], size: 14, dx: -6, align: 'right' });
          Q.tex('[0,e_1]', 0.5, 0, { color: FCOL[2], size: 14, dy: 14 });
          Q.tex('0', 0, 0, { color: 'muted', dx: -9, dy: 9, size: 13 }); Q.tex('e_1', 1, 0, { color: 'muted', dx: 6, dy: 10, size: 13 }); Q.tex('e_2', 0, 1, { color: 'muted', dx: -10, dy: -6, size: 13 });
          // ---- the map and the pieces
          let T, JT, simps;
          if (m === 'sq') { T = (u, w) => [u, w]; JT = () => 1; simps = rectSimps(0, 1, 0, 1); }
          else if (m === 'quad') {
            const q = C.map((h) => [h.x, h.y]);
            T = (u, w) => [0, 1].map((d) => (1 - u) * (1 - w) * q[0][d] + u * (1 - w) * q[1][d] + u * w * q[2][d] + (1 - u) * w * q[3][d]);
            JT = (u, w) => { const Tu = [0, 1].map((d) => (1 - w) * (q[1][d] - q[0][d]) + w * (q[2][d] - q[3][d])), Tw = [0, 1].map((d) => (1 - u) * (q[3][d] - q[0][d]) + u * (q[2][d] - q[1][d])); return det2(Tu, Tw); };
            simps = rectSimps(0, 1, 0, 1);
          } else {
            const a = aR.value; T = (r, th) => [r * Math.cos(th), r * Math.sin(th)]; JT = (r) => r;
            simps = []; for (let k = 0; k < 3; k++) simps.push(...rectSimps(a, 1, (k * 2 * Math.PI) / 3, ((k + 1) * 2 * Math.PI) / 3));
          }
          let jmin = Infinity;
          if (m === 'ann') jmin = aR.value; else for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) jmin = Math.min(jmin, JT(i / 12, j / 12));
          const ok = jmin > 0;
          const img = (p, q, n = 24) => { const pts = []; for (let k = 0; k <= n; k++) pts.push(T(...lerp2(p, q, k / n))); return pts; };
          simps.forEach((sm, i) => {
            const outline = [...img(sm[0], sm[1]), ...img(sm[1], sm[2]), ...img(sm[2], sm[0])];
            S.poly(outline, { fill: ok ? (i % 2 ? 'purple' : 'accent') : 'red', fillAlpha: ok ? 0.09 : 0.16, color: 'faint', width: 0.8 });
          });
          // the oriented edges of every ∂T_i: images of [e1,e2] = [b,c], [e2,0] = [c,a], [0,e1] = [a,b]
          const edges = [];
          simps.forEach((sm, i) => { [[1, 2], [2, 0], [0, 1]].forEach(([x, y], k) => edges.push({ p: sm[x], q: sm[y], i, k, c: cen(sm) })); });
          const K = edges.map((e) => ({ a: T(...e.p), b: T(...e.q), m: T(...lerp2(e.p, e.q, 0.5)) }));
          const close = (x, y) => Math.hypot(x[0] - y[0], x[1] - y[1]) < 1e-6;
          edges.forEach((e, k) => { e.cancel = edges.some((f, l) => l !== k && close(K[k].a, K[l].b) && close(K[k].b, K[l].a) && close(K[k].m, K[l].m)); });
          edges.filter((e) => e.cancel).forEach((e) => S.path(img(e.p, e.q), { color: 'muted', width: 1.3, dash: [5, 5] }));
          edges.forEach((e) => {
            const shr = (p) => lerp2(p, e.c, 0.14);
            pathArrows(S, img(shr(e.p), shr(e.q)), { color: ok ? FCOL[e.k] : 'red', width: 1.8, head: 8 }, [0.55]);
          });
          const outer = edges.filter((e) => !e.cancel);
          outer.forEach((e) => pathArrows(S, img(e.p, e.q, 60), { color: ok ? 'green' : 'red', width: 3.2, head: 12, alpha: 0.9 }, [0.5]));
          if (m === 'quad') ['T(0,0)', 'T(1,0)', 'T(1,1)', 'T(0,1)'].forEach((s, i) => S.text(s, C[i].x, C[i].y, { color: 'muted', size: 12, align: 'center', dy: C[i].y > 0 ? -16 : 18 }));
          // ∫ x dy over ∂Ω and the area ∬ J_T
          const xdy = (x, y) => [0, x];
          const bd = outer.reduce((s, e) => s + lineInt(xdy, (t) => T(...lerp2(e.p, e.q, t)), 6), 0);
          const all = edges.reduce((s, e) => s + lineInt(xdy, (t) => T(...lerp2(e.p, e.q, t)), 6), 0);
          const area = simps.reduce((s, sm) => { const A1 = sub2(sm[1], sm[0]), A2 = sub2(sm[2], sm[0]), J = det2(A1, A2); return s + quadQ2((u1, u2) => JT(sm[0][0] + u1 * A1[0] + u2 * A2[0], sm[0][1] + u1 * A1[1] + u2 * A2[1]) * J, 3); }, 0);
          if (!ok) S.corner('Jacobian of T < 0 somewhere: not allowed', 'tl', { color: 'red', weight: 600 });
          else S.corner(m === 'sq' ? 'I² = [0,e₁,e₂] + [e₁+e₂,e₂,e₁]' : m === 'ann' ? 'six pieces; seams and diagonals cancel' : 'Jacobian of T > 0', 'tl', { color: 'green', weight: 600 });
          st = { bd, all, area, ok, n: outer.length, c: edges.length - outer.length, m };
        });
        v.readout(() => {
          if (!st) return '';
          const what = st.m === 'ann' ? ' (outer circle counter-clockwise, inner circle clockwise)' : '';
          return `${st.c} edges cancel in pairs, ${st.n} remain${what}. $\\;\\sum_i\\int_{\\partial T_i}x\\,dy=${v.fix(st.all, 4)}$, $\\;\\int_{\\partial\\Omega}x\\,dy=${v.fix(st.bd, 4)}$, $\\;\\iint J_T=${v.fix(st.area, 4)}$` + (st.ok ? ' $=\\operatorname{area}(\\Omega)$.' : ' — with a sign-changing Jacobian this is no longer the area.');
        });
      },
    },
  ],
};
