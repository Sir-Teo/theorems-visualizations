// Rudin, Principles of Mathematical Analysis — Chapter 9, part 3:
// the chain rule, partial derivatives, the Jacobian matrix, and the mean value inequality (9.15–9.19).

const TAU = 2 * Math.PI;
const mv = (A, x) => A.map((r) => r[0] * x[0] + r[1] * x[1]);
const mm = (A, B) => A.map((r) => [r[0] * B[0][0] + r[1] * B[1][0], r[0] * B[0][1] + r[1] * B[1][1]]);
/** Numerical Jacobian (central differences) of F: R² → R^m at p. */
function jac(F, p, h = 1e-5) {
  const a = F([p[0] + h, p[1]]), b = F([p[0] - h, p[1]]), c = F([p[0], p[1] + h]), d = F([p[0], p[1] - h]);
  return a.map((_, i) => [(a[i] - b[i]) / (2 * h), (c[i] - d[i]) / (2 * h)]);
}
function pm(A, d = 2) { return String.raw`\begin{pmatrix}` + A.map((r) => r.map((x) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d)).join('&')).join(String.raw`\\`) + String.raw`\end{pmatrix}`; }
function fitEqual(S, cx, cy, hw) { const a = S.height / S.width; if (a > 1) S.setView([cx - hw, cx + hw], [cy - hw * a, cy + hw * a]); else S.setView([cx - hw / a, cx + hw / a], [cy - hw, cy + hw]); }
function vecArrow(S, p, q, color, label, o = {}) {
  S.arrow(p[0], p[1], q[0], q[1], { color, width: o.width ?? 2.4, head: o.head ?? 9, dash: o.dash, alpha: o.alpha });
  if (label) {
    const dx = (q[0] - p[0]) * S.scale, dy = (q[1] - p[1]) * S.scale, L = Math.hypot(dx, dy) || 1, off = o.off ?? 14;
    S.tex(label, q[0], q[1], { color, size: o.size ?? 14, dx: (dx / L) * off + (o.dx || 0), dy: -(dy / L) * off + (o.dy || 0) });
  }
}
/** First root of q on [0,1] (sign change on a grid, then bisection); falls back to the minimiser of |q|. */
function firstRoot(q, n = 240) {
  let prev = q(1e-6), best = 1e-6, bv = Math.abs(prev);
  for (let i = 1; i <= n; i++) {
    const t = i / n * (1 - 2e-6) + 1e-6, val = q(t);
    if (Math.abs(val) < bv) { bv = Math.abs(val); best = t; }
    if (prev === 0) return (i - 1) / n;
    if (prev * val < 0) { let lo = (i - 1) / n, hi = t; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (q(lo) * q(m) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; }
    prev = val;
  }
  return best;
}

export default {
  collection: 'pma',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.15
    {
      num: '9.15',
      kind: 'Theorem',
      name: 'Chain rule',
      statement: String.raw`Let $E\subset\R^n$ be open, let $f$ map $E$ into $\R^m$ and be differentiable at $x_0$, and let $g$ map an open set containing $f(E)$ into $\R^k$ and be differentiable at $f(x_0)$. Then $F(x)=g(f(x))$ is differentiable at $x_0$, and
$$F'(x_0)=g'(f(x_0))\,f'(x_0).$$
The right side is a product (composition) of linear transformations.`,
      idea: String.raw`Write $y_0=f(x_0)$, $A=f'(x_0)$, $B=g'(y_0)$ and let $u(h)$, $v(k)$ be the remainders of $f$ at $x_0$ and of $g$ at $y_0$. With $k=f(x_0+h)-f(x_0)=Ah+u(h)$ one gets $F(x_0+h)-F(x_0)-BAh=Bu(h)+v(k)$. The first term is $o(|h|)$ because $\|B\|<\infty$ (9.7), and since $|k|\le(\|A\|+o(1))|h|$ and $k\to0$ (differentiability implies continuity), the second is $o(|h|)$ as well.`,
      caption: String.raw`Drag $x_0$ and shrink $r$. The gold curves are the images of the circle $|h|=r$ under $f$ and under $F=g\circ f$, rescaled by $1/r$; the dashed ellipses are the images of the unit circle under the linear maps $A=f'(x_0)$ and $BA$. The arrows push a tangent vector $w$ (angle $\theta$) through $A$ and then $B$. As $r\to0$ the gold curves settle onto the ellipses, and the readout compares $BA$ with a finite-difference Jacobian of $F$.`,
      deps: ['pma-9.11', 'pma-9.7'],
      see: ['pma-5.5'],
      tags: ['derivative', 'chain rule'],
      viz(v) {
        const f = ([x, y]) => [x + 0.35 * y * y, y - 0.3 * x * x + 0.25 * x * y];
        const df = ([x, y]) => [[1, 0.7 * y], [-0.6 * x + 0.25 * y, 1 + 0.25 * x]];
        const g = ([u, w]) => [u - 0.3 * w * w + 0.4 * Math.sin(w), w + 0.45 * Math.sin(1.2 * u)];
        const dg = ([u, w]) => [[1, -0.6 * w + 0.4 * Math.cos(w)], [0.54 * Math.cos(1.2 * u), 1]];
        const F = (p) => g(f(p));
        const D = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 260, minWidth: 250, title: 'domain: $x_0$ and the circle $|h|=r$' });
        const P = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 260, minWidth: 250, title: '$\\frac1r\\big(f(x_0+h)-f(x_0)\\big)$ and $A$' });
        const Q = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 260, minWidth: 250, title: '$\\frac1r\\big(F(x_0+h)-F(x_0)\\big)$ and $BA$' });
        const hx = D.handle(0.55, 0.45, { color: 'accent', label: 'x₀', labelPos: 'sw' });
        const rS = v.slider('$r$', 0.005, 1, 0.55, { log: true, decimals: 3 });
        const th = v.slider('direction $\\theta$ of $w$', 0, TAU, 0.6, { step: 0.01 });
        v.legend([['gold', 'rescaled images of the circle $|h|=r$'], ['accent', '$A$(unit circle), $Aw$', { dash: true }], ['green', '$BA$(unit circle), $BAw$', { dash: true }]]);
        let st = {};
        v.render(() => {
          const x0 = [hx.x, hx.y], r = rS.value, w = [Math.cos(th.value), Math.sin(th.value)];
          const A = df(x0), y0 = f(x0), B = dg(y0), BA = mm(B, A), F0 = F(x0);
          // domain
          for (let k = -6; k <= 6; k++) { D.line(k / 4, -3, k / 4, 3, { color: 'grid', width: 1 }); D.line(-3, k / 4, 3, k / 4, { color: 'grid', width: 1 }); }
          D.circle(x0[0], x0[1], r, { fill: 'gold', fillAlpha: 0.18, color: 'gold', width: 1.6 });
          vecArrow(D, x0, [x0[0] + r * w[0], x0[1] + r * w[1]], 'purple', 'rw', { width: 2, head: Math.min(9, r * D.scale * 0.5) });
          const circ = Array.from({ length: 121 }, (_, i) => [Math.cos(TAU * i / 120), Math.sin(TAU * i / 120)]);
          // middle: f
          const curveF = circ.map((u) => { const q = f([x0[0] + r * u[0], x0[1] + r * u[1]]); return [(q[0] - y0[0]) / r, (q[1] - y0[1]) / r]; });
          const ellA = circ.map((u) => mv(A, u));
          const nA = Math.max(...ellA.map((p) => Math.hypot(...p)));
          fitEqual(P, 0, 0, Math.max(1.3, nA * 1.35));
          P.poly(ellA, { color: 'accent', width: 1.8, dash: [6, 4], fill: 'accent', fillAlpha: 0.06 });
          P.path(curveF, { color: 'gold', width: 2.4 });
          vecArrow(P, [0, 0], mv(A, w), 'accent', 'Aw', { width: 2.4 });
          // right: F = g∘f
          const curveG = circ.map((u) => { const q = F([x0[0] + r * u[0], x0[1] + r * u[1]]); return [(q[0] - F0[0]) / r, (q[1] - F0[1]) / r]; });
          const ellBA = circ.map((u) => mv(BA, u));
          const nBA = Math.max(...ellBA.map((p) => Math.hypot(...p)));
          fitEqual(Q, 0, 0, Math.max(1.3, nBA * 1.35));
          Q.poly(ellBA, { color: 'green', width: 1.8, dash: [6, 4], fill: 'green', fillAlpha: 0.06 });
          Q.path(curveG, { color: 'gold', width: 2.4 });
          vecArrow(Q, [0, 0], mv(BA, w), 'green', 'BAw', { width: 2.4 });
          const err = Math.max(...circ.map((u, i) => Math.hypot(curveG[i][0] - ellBA[i][0], curveG[i][1] - ellBA[i][1])));
          st = { A, B, BA, J: jac(F, x0), err, r };
        });
        v.readout(() => {
          const s = st; if (!s.A) return '';
          return `$B\\,A = ${pm(s.B)}${pm(s.A)} = ${pm(s.BA, 3)}$, finite-difference $F'(x_0) \\approx ${pm(s.J, 3)}$. Largest gap between the gold curve and the ellipse on the right: $${v.fmt(s.err, 3)}$ at $r=${v.fmt(s.r, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.16
    {
      num: '9.16',
      kind: 'Definition',
      name: 'Partial derivatives',
      statement: String.raw`Let $f$ map an open set $E\subset\R^n$ into $\R^m$, let $\{e_1,\dots,e_n\}$ and $\{u_1,\dots,u_m\}$ be the standard bases of $\R^n$ and $\R^m$, and write $f=\sum_i f_iu_i$ with real component functions $f_i$. For $x\in E$, $1\le i\le m$ and $1\le j\le n$, the *partial derivative*
$$(D_jf_i)(x)=\lim_{t\to0}\frac{f_i(x+te_j)-f_i(x)}{t}$$
is defined whenever this limit exists. It is the ordinary derivative of $f_i$ along the line through $x$ in the direction $e_j$, all other coordinates being frozen.`,
      idea: String.raw`Each $D_jf_i$ is a one-variable derivative, so it only sees $f$ along $n$ lines through $x$. That is why partial derivatives can exist without $f$ being differentiable, or even continuous: the lines miss almost every direction of approach. When $f$ *is* differentiable, 9.17 shows that the partials assemble into the matrix of $f'(x)$, and then (as in Rudin's examples after 9.17) every directional derivative is $(D_uf)(x)=(\nabla f)(x)\cdot u$.`,
      caption: String.raw`A real function $f$ on $\R^2$ (drag to rotate). The blue and orange curves are the slices through $p$ along $e_1$ and $e_2$, with tangent lines of slope $D_1f(p)$ and $D_2f(p)$; they span the green candidate tangent plane. The purple slice goes in direction $u_\theta$ with its actual slope $D_uf(p)$, while the dashed green line has slope $\nabla f(p)\cdot u$. For the smooth surface these agree; for $x^2y/(x^2+y^2)$ at $p=0$ both partials are $0$, yet the purple tangent leaves the plane — partial derivatives alone do not make a derivative.`,
      deps: ['pma-5.1', 'pma-9.1'],
      tags: ['partial derivatives', 'directional derivatives'],
      viz(v) {
        const M = v.M;
        const FN = {
          smooth: { label: 'smooth surface', f: (x, y) => 0.55 * Math.sin(1.3 * x) * Math.cos(0.9 * y) + 0.2 * y, p: [0.45, -0.35] },
          bad: { label: '$x^2y/(x^2+y^2)$', f: (x, y) => (x === 0 && y === 0 ? 0 : (x * x * y) / (x * x + y * y)), p: [0, 0] },
        };
        const which = v.select('', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'bad');
        const pa = v.slider('$p_1$', -1, 1, 0, { step: 0.01 });
        const pb = v.slider('$p_2$', -1, 1, 0, { step: 0.01 });
        const th = v.slider('direction $\\theta$ of $u$', 0, TAU, 0.75, { step: 0.01 });
        const S = v.stage3d({ range: 1.55, height: 420, yaw: -0.6, pitch: 0.5, axes: false, full: true });
        let last = null, st = {};
        v.render(() => {
          const F = FN[which.value];
          if (last !== which.value) { last = which.value; pa.set(F.p[0]); pb.set(F.p[1]); }
          const f = F.f, a = pa.value, b = pb.value, u = [Math.cos(th.value), Math.sin(th.value)];
          const hh = 1e-5;
          const D1 = (f(a + hh, b) - f(a - hh, b)) / (2 * hh), D2 = (f(a, b + hh) - f(a, b - hh)) / (2 * hh);
          const Du = (f(a + hh * u[0], b + hh * u[1]) - f(a - hh * u[0], b - hh * u[1])) / (2 * hh);
          const pred = D1 * u[0] + D2 * u[1], z0 = f(a, b);
          const R = 1.2;
          for (const e of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) S.line(e.map((q) => -1.35 * q), e.map((q) => 1.35 * q), { color: 'faint', width: 1 });
          S.text('x₁', [1.45, 0, 0], { color: 'muted' }); S.text('x₂', [0, 1.45, 0], { color: 'muted' });
          S.surface((x, y) => [x, y, f(x, y)], [-R, R], [-R, R], { n: 30, alpha: 0.55, colorFn: (x, y, P) => M.cmap(0.5 + P[2] * 0.6, 'viridis') });
          // candidate tangent plane from the partials
          const L = 0.45;
          const pl = [[-L, -L], [L, -L], [L, L], [-L, L]].map(([dx, dy]) => [a + dx, b + dy, z0 + D1 * dx + D2 * dy]);
          S.poly(pl, { fill: 'green', fillAlpha: 0.22, color: 'green', alpha: 0.6, bias: -0.05 });
          // slices
          S.curve((t) => [t, b, f(t, b)], -R, R, { color: 'blue', width: 2.4, n: 120, bias: -0.1 });
          S.curve((t) => [a, t, f(a, t)], -R, R, { color: 'orange', width: 2.4, n: 120, bias: -0.1 });
          const tmax = Math.min(...[u[0], u[1]].map((c, i) => (Math.abs(c) < 1e-9 ? Infinity : (R - Math.sign(c) * [a, b][i]) / Math.abs(c))), ...[u[0], u[1]].map((c, i) => (Math.abs(c) < 1e-9 ? Infinity : (R + Math.sign(c) * [a, b][i]) / Math.abs(c))));
          S.curve((t) => [a + t * u[0], b + t * u[1], f(a + t * u[0], b + t * u[1])], -tmax, tmax, { color: 'purple', width: 2.4, n: 160, bias: -0.1 });
          const T = 0.6;
          S.line([a - T, b, z0 - T * D1], [a + T, b, z0 + T * D1], { color: 'blue', width: 3.4, bias: -0.2 });
          S.line([a, b - T, z0 - T * D2], [a, b + T, z0 + T * D2], { color: 'orange', width: 3.4, bias: -0.2 });
          S.line([a - T * u[0], b - T * u[1], z0 - T * Du], [a + T * u[0], b + T * u[1], z0 + T * Du], { color: 'purple', width: 3.4, bias: -0.2 });
          S.line([a - T * u[0], b - T * u[1], z0 - T * pred], [a + T * u[0], b + T * u[1], z0 + T * pred], { color: 'green', width: 2.4, dash: [5, 4], bias: -0.25 });
          S.dot([a, b, z0], { color: 'ink', r: 5, bias: -0.3 });
          S.tex('D_1f', [a + T, b, z0 + T * D1], { color: 'blue', size: 14, dx: 14 });
          S.tex('D_2f', [a, b - T, z0 - T * D2], { color: 'orange', size: 14, dx: -16 });
          S.tex('D_uf', [a + T * u[0], b + T * u[1], z0 + T * Du], { color: 'purple', size: 14, dy: -14 });
          v.legend([['blue', 'slice along $e_1$, slope $D_1f$'], ['orange', 'slice along $e_2$, slope $D_2f$'], ['purple', 'slice along $u$, slope $D_uf$'], ['green', 'plane and slope $\\nabla f\\cdot u$ built from the partials', { dash: true }]]);
          st = { D1, D2, Du, pred, bad: which.value === 'bad' && Math.hypot(a, b) < 1e-9 };
        });
        v.readout(() => {
          const s = st; if (s.D1 == null) return '';
          const ok = Math.abs(s.Du - s.pred) < 1e-3;
          return `$D_1f(p) = ${v.fix(s.D1, 3)}$, $\\;D_2f(p) = ${v.fix(s.D2, 3)}$; along $u$: $\\;D_uf(p) = ${v.fix(s.Du, 3)}$ versus $\\nabla f(p)\\cdot u = ${v.fix(s.pred, 3)}$ — ` + (ok ? 'they agree, as they must where $f$ is differentiable.' : 'they differ, so no linear map $f\'(p)$ can exist here.');
        });
      },
    },
    // ------------------------------------------------------------------ 9.17
    {
      num: '9.17',
      kind: 'Theorem',
      name: 'The derivative is the matrix of partial derivatives',
      statement: String.raw`Let $f$ map an open set $E\subset\R^n$ into $\R^m$ and be differentiable at $x\in E$. Then all partial derivatives $(D_jf_i)(x)$ exist, and
$$f'(x)e_j=\sum_{i=1}^m(D_jf_i)(x)\,u_i\qquad(1\le j\le n).$$
So the matrix of $f'(x)$ in the standard bases is the array $\big((D_jf_i)(x)\big)$ — its $j$-th column is the vector of partials $D_jf$ — and $f'(x)h=\sum_j h_j\,(D_jf)(x)$.`,
      idea: String.raw`Restrict the defining limit of $f'(x)$ to $h=te_j$: then $\frac{f(x+te_j)-f(x)}{t}-f'(x)e_j\to0$ as $t\to0$. Reading this componentwise (each $|f_i|\le|f|$) says that the difference quotient of $f_i$ in the direction $e_j$ converges to the $i$-th coordinate of $f'(x)e_j$. The converse fails (see 9.16); 9.21 supplies the extra hypothesis — continuity of the partials — that makes it true.`,
      caption: String.raw`Here $f$ is the polar-coordinate map $(r,\varphi)\mapsto(r\cos\varphi,r\sin\varphi)$. Drag $x=(r,\varphi)$ in the left panel. Its two coordinate lines map to a ray (blue) and a circle (orange). For a step $t$, the dashed arrows are the difference quotients $\frac{f(x+te_j)-f(x)}{t}$; as $t\to0$ they converge to the solid columns $D_1f$, $D_2f$ of $f'(x)$, which span the image of the unit square (green).`,
      deps: ['pma-9.11', 'pma-9.16', 'pma-9.9'],
      tags: ['partial derivatives', 'Jacobian matrix'],
      viz(v) {
        const f = ([r, p]) => [r * Math.cos(p), r * Math.sin(p)];
        const D = v.stage({ x: [-0.15, 2.5], y: [-0.5, 2.9], equal: true, height: 320, title: 'domain: $(r,\\varphi)$' });
        const T = v.stage({ x: [-2.5, 2.5], y: [-0.9, 2.7], equal: true, height: 320, title: 'target: $f(r,\\varphi)=(r\\cos\\varphi,\\,r\\sin\\varphi)$' });
        const hx = D.handle(1.4, 0.75, { color: 'accent', label: 'x', constrain: { x: [0.3, 2.2], y: [-0.3, 2.6] } });
        const tS = v.slider('step $t$', 0.01, 1.2, 0.7, { log: true, decimals: 3 });
        v.legend([['blue', 'line $x+te_1$ and its image'], ['orange', 'line $x+te_2$ and its image'], ['muted', 'difference quotients', { dash: true }], ['green', "columns $D_1f, D_2f$ of $f'(x)$"]]);
        let st = {};
        v.render(() => {
          const x = [hx.x, hx.y], t = tS.value, fx = f(x);
          const J = [[Math.cos(x[1]), -x[0] * Math.sin(x[1])], [Math.sin(x[1]), x[0] * Math.cos(x[1])]];
          // domain grid & image grid
          for (let k = 0; k <= 9; k++) D.line(k * 0.25, -1, k * 0.25, 3, { color: 'grid', width: 1 });
          for (let k = -2; k <= 11; k++) D.line(-1, k * 0.25, 3, k * 0.25, { color: 'grid', width: 1 });
          for (let k = 1; k <= 9; k++) T.curve((p) => f([k * 0.25, p]), -0.5, 3, { color: 'grid', width: 1.2, n: 80 });
          for (let k = -2; k <= 12; k++) T.curve((r) => f([r, k * 0.25]), 0, 2.4, { color: 'grid', width: 1.2, n: 4 });
          // coordinate lines
          D.line(0, x[1], 2.5, x[1], { color: 'blue', width: 1.6, alpha: 0.6 });
          D.line(x[0], -0.5, x[0], 2.9, { color: 'orange', width: 1.6, alpha: 0.6 });
          T.curve((r) => f([r, x[1]]), 0, 2.5, { color: 'blue', width: 1.8, alpha: 0.7, n: 4 });
          T.curve((p) => f([x[0], p]), -0.5, 2.9, { color: 'orange', width: 1.8, alpha: 0.7, n: 120 });
          // steps in the domain
          vecArrow(D, x, [x[0] + t, x[1]], 'blue', 'te_1', { width: 2.2, dash: [5, 4] });
          vecArrow(D, x, [x[0], x[1] + t], 'orange', 'te_2', { width: 2.2, dash: [5, 4] });
          // target: image of unit square under J, columns, difference quotients
          const c1 = [J[0][0], J[1][0]], c2 = [J[0][1], J[1][1]];
          T.poly([fx, [fx[0] + c1[0], fx[1] + c1[1]], [fx[0] + c1[0] + c2[0], fx[1] + c1[1] + c2[1]], [fx[0] + c2[0], fx[1] + c2[1]]], { fill: 'green', fillAlpha: 0.12, color: 'green', width: 1, alpha: 0.5 });
          const q1 = f([x[0] + t, x[1]]), q2 = f([x[0], x[1] + t]);
          const d1 = [(q1[0] - fx[0]) / t, (q1[1] - fx[1]) / t], d2 = [(q2[0] - fx[0]) / t, (q2[1] - fx[1]) / t];
          T.dot(q1[0], q1[1], { color: 'blue', r: 3.5 }); T.dot(q2[0], q2[1], { color: 'orange', r: 3.5 });
          vecArrow(T, fx, [fx[0] + d1[0], fx[1] + d1[1]], 'blue', null, { width: 2, dash: [5, 4] });
          vecArrow(T, fx, [fx[0] + d2[0], fx[1] + d2[1]], 'orange', null, { width: 2, dash: [5, 4] });
          vecArrow(T, fx, [fx[0] + c1[0], fx[1] + c1[1]], 'green', 'D_1f', { width: 2.8 });
          vecArrow(T, fx, [fx[0] + c2[0], fx[1] + c2[1]], 'green', 'D_2f', { width: 2.8 });
          T.dot(fx[0], fx[1], { color: 'accent', r: 5, label: 'f(x)', labelPos: 'sw' });
          st = { J, d1, d2, t, x };
        });
        v.readout(() => {
          const s = st; if (!s.J) return '';
          const Q = [[s.d1[0], s.d2[0]], [s.d1[1], s.d2[1]]];
          return `$f'(x) = \\begin{pmatrix} D_1f_1 & D_2f_1\\\\ D_1f_2 & D_2f_2\\end{pmatrix} = \\begin{pmatrix}\\cos\\varphi & -r\\sin\\varphi\\\\ \\sin\\varphi & r\\cos\\varphi\\end{pmatrix} = ${pm(s.J, 3)}$; difference quotients at $t = ${v.fmt(s.t, 3)}$: $${pm(Q, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.19
    {
      num: '9.19',
      kind: 'Theorem',
      name: 'Mean value inequality on convex sets',
      statement: String.raw`Let $f$ map a convex open set $E\subset\R^n$ into $\R^m$, be differentiable in $E$, and suppose there is a real number $M$ with $\|f'(x)\|\le M$ for every $x\in E$. Then
$$|f(b)-f(a)|\le M\,|b-a|\qquad\text{for all }a,b\in E.$$`,
      idea: String.raw`Convexity puts the whole segment $\gamma(t)=(1-t)a+tb$, $0\le t\le1$, inside $E$. By the chain rule $g=f\circ\gamma$ has $g'(t)=f'(\gamma(t))(b-a)$, so $|g'(t)|\le M|b-a|$. The one-variable mean value inequality for vector-valued functions (5.19) then gives $|g(1)-g(0)|\le M|b-a|$, which is the claim.`,
      caption: String.raw`The colours show a real function $f$ on $E$ ($m=1$); $M$ bounds $|\nabla f|$ on all of $E$. Drag $a$ and $b$. The right panel plots $g(t)=f((1-t)a+tb)$ inside the green cone of slopes $\pm M|b-a|$; on the convex disc it never leaves the cone. Switch to the slit annulus with $f=$ polar angle: $\|f'\|=1/|x|\le1$ there, but the segment from $a$ to $b$ leaves $E$ (red), $f$ jumps by nearly $2\pi$, and the inequality fails.`,
      deps: ['pma-9.15', 'pma-5.19', 'pma-9.6', 'pma-2.17'],
      see: ['pma-5.10'],
      tags: ['mean value theorem', 'convexity'],
      viz(v) {
        const M = v.M;
        const DOM = {
          disc: {
            label: 'convex disc', f: (x, y) => Math.sin(1.4 * x) + 0.6 * Math.cos(1.2 * y + 0.5 * x),
            // |∇f|² = (1.4cos(1.4x) − 0.3 sin s)² + (0.72 sin s)² ≤ 1.7² + 0.72², s = 1.2y + 0.5x: a bound for ‖f'‖ that is attained to 3 decimals on E
            M: Math.hypot(1.7, 0.72),
            inE: (x, y) => x * x + y * y < 1.75 * 1.75, a: [-1.0, -0.75], b: [1.15, 0.8], range: [-1.6, 1.6],
            clamp: (x, y) => { const r = Math.hypot(x, y), R = 1.72; return r > R ? [x * R / r, y * R / r] : [x, y]; },
          },
          slit: {
            label: 'slit annulus (not convex)', f: (x, y) => Math.atan2(y, x),
            inE: (x, y) => { const r = Math.hypot(x, y); return r > 1 && r < 2.3 && !(y === 0 && x < 0); }, a: [-1.6, 0.2], b: [-1.6, -0.2], range: [-Math.PI, Math.PI],
            clamp: (x, y) => { let r = Math.hypot(x, y), t = Math.atan2(y, x); r = M.clamp(r, 1.06, 2.24); t = M.clamp(t, -Math.PI + 0.04, Math.PI - 0.04); return [r * Math.cos(t), r * Math.sin(t)]; },
          },
        };
        const which = v.select('$E$:', Object.entries(DOM).map(([value, o]) => ({ value, label: o.label })), 'disc');
        const L = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 330, title: '$E$ coloured by $f$' });
        const R = v.stage({ x: [-0.05, 1.05], y: [-2, 2], height: 330, axes: 'box', xlabel: 't', title: '$g(t)=f((1-t)a+tb)$ and the cone $g(0)\\pm M|b-a|\\,t$' });
        const ha = L.handle(-1, -0.75, { color: 'blue', label: 'a', constrain: (x, y) => DOM[which.value].clamp(x, y) });
        const hb = L.handle(1.15, 0.8, { color: 'orange', label: 'b', constrain: (x, y) => DOM[which.value].clamp(x, y) });
        // M: an upper bound for ‖f'‖ on E (analytic; for the polar angle |∇θ| = 1/|x| < 1 on E with supremum 1)
        const supGrad = { disc: DOM.disc.M, slit: 1 };
        let last = null, st = {};
        v.render(() => {
          const key = which.value, Dm = DOM[key];
          if (last !== key) { last = key; ha.set(...Dm.a); hb.set(...Dm.b); }
          const a = [ha.x, ha.y], b = [hb.x, hb.y], Mx = supGrad[key];
          const [lo, hi] = Dm.range;
          L.raster((x, y) => (Dm.inE(x, y) ? M.cmap((Dm.f(x, y) - lo) / (hi - lo), 'diverging').concat(200) : null), { key, res: 2 });
          if (key === 'slit') { L.line(-2.3, 0, -1, 0, { color: 'ink', width: 2.4 }); L.circle(0, 0, 1, { color: 'ink', width: 1.2 }); L.circle(0, 0, 2.3, { color: 'ink', width: 1.2 }); }
          else L.circle(0, 0, 1.75, { color: 'ink', width: 1.2 });
          // segment, coloured by membership in E
          const N = 200; let run = [], inside = true;
          const seg = [];
          for (let i = 0; i <= N; i++) { const t = i / N, p = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]; seg.push({ t, p, in: Dm.inE(p[0], p[1]) && !(key === 'slit' && Math.abs(p[1]) < 1e-9 && p[0] < 0) }); }
          for (let i = 0; i < N; i++) { const ok = seg[i].in && seg[i + 1].in && !(key === 'slit' && seg[i].p[1] * seg[i + 1].p[1] < 0 && (seg[i].p[0] + seg[i + 1].p[0]) / 2 < 0); if (!ok) inside = false; L.line(seg[i].p[0], seg[i].p[1], seg[i + 1].p[0], seg[i + 1].p[1], { color: ok ? 'green' : 'red', width: 3 }); }
          // right panel
          const g = seg.map((s) => Dm.f(s.p[0], s.p[1]));
          const g0 = g[0], slope = Mx * M.dist(a, b);
          const ys = g.concat([g0 - slope, g0 + slope]);
          const ymin = Math.min(...ys), ymax = Math.max(...ys), pad = (ymax - ymin) * 0.12 + 0.1;
          R.setView([-0.05, 1.05], [ymin - pad, ymax + pad]);
          R.poly([[0, g0], [1, g0 + slope], [1, g0 - slope]], { fill: 'green', fillAlpha: 0.13, color: 'green', width: 1.2, alpha: 0.8 });
          const pts = []; for (let i = 0; i <= N; i++) { if (i && Math.abs(g[i] - g[i - 1]) > 1) pts.push(null); pts.push([seg[i].t, g[i]]); }
          R.path(pts, { color: 'ink', width: 2.4 });
          const fails = Math.abs(g[N] - g0) > slope + 1e-9;
          R.dot(0, g0, { color: 'blue', r: 5, label: 'f(a)', labelPos: 'e' });
          R.dot(1, g[N], { color: fails ? 'red' : 'orange', r: 5.5, label: 'f(b)', labelPos: 'w' });
          L.corner(inside ? '[a, b] ⊂ E' : '[a, b] leaves E', 'tl', { color: inside ? 'green' : 'red', weight: 600 });
          st = { Mx, d: M.dist(a, b), df: Math.abs(g[N] - g0), fails };
        });
        v.readout(() => {
          const s = st; if (s.Mx == null) return '';
          return `$M = ${v.fix(s.Mx, 3)} \\ge \\sup_E\\|f'\\|$, $\\;|f(b)-f(a)| = ${v.fix(s.df, 3)}$ ` + (s.fails ? `$>$ $M|b-a| = ${v.fix(s.Mx * s.d, 3)}$: the inequality fails because $E$ is not convex.` : `$\\le M|b-a| = ${v.fix(s.Mx * s.d, 3)}$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 9.19a
    {
      num: '9.19a',
      kind: 'Corollary',
      name: 'Zero derivative on a convex set means constant',
      statement: String.raw`If, in addition to the hypotheses of 9.19, $f'(x)=0$ for every $x\in E$, then $f$ is constant on $E$.`,
      idea: String.raw`The hypotheses of 9.19 hold with $M=0$, so $|f(b)-f(a)|\le0$ for all $a,b\in E$. Convexity is more than is needed: on a connected open set any two points are joined by a polygonal path whose segments each lie in a ball inside $E$, and applying the corollary on each ball chains the equalities together. On a disconnected set the conclusion is false.`,
      caption: String.raw`In each domain $f'=0$ at every point; colour shows the value of $f$. Drag $a$ and $b$. On the convex disc the segment $[a,b]$ stays in $E$ and $f(a)=f(b)$. On the C-shaped set the segment may leave $E$, but a green polygonal path through convex pieces of $E$ still connects them, so $f$ is still constant. On two disjoint discs no path exists and $f$ takes two values.`,
      deps: ['pma-9.19'],
      tags: ['mean value theorem', 'connectedness'],
      viz(v) {
        const M = v.M;
        const rects = [[-1.7, 0.75, 1.7, 1.55], [-1.7, -1.55, -0.85, 1.55], [-1.7, -1.55, 1.7, -0.75]];
        const inRect = (r, x, y) => x > r[0] && x < r[2] && y > r[1] && y < r[3];
        const DOM = {
          disc: { label: 'convex', inE: (x, y) => x * x + y * y < 1.6 * 1.6, val: () => 1, a: [-0.9, -0.5], b: [1.0, 0.8] },
          C: { label: 'connected, not convex', inE: (x, y) => rects.some((r) => inRect(r, x, y)), val: () => 1, a: [1.2, 1.15], b: [1.2, -1.15] },
          two: { label: 'two components', inE: (x, y) => Math.hypot(x + 1.05, y) < 0.85 || Math.hypot(x - 1.05, y) < 0.85, val: (x) => (x < 0 ? 1 : 2), a: [-1.1, 0.3], b: [1.0, -0.3] },
        };
        const which = v.select('$E$:', Object.entries(DOM).map(([value, o]) => ({ value, label: o.label })), 'C');
        const S = v.stage({ x: [-2.2, 2.2], y: [-1.8, 1.8], equal: true, height: 340 });
        const nearestIn = (Dm, x, y) => {
          if (Dm.inE(x, y)) return [x, y];
          let best = null, bd = Infinity;
          for (let i = 0; i < 48; i++) for (let k = 1; k <= 30; k++) { const t = TAU * i / 48, r = k * 0.03; const q = [x + r * Math.cos(t), y + r * Math.sin(t)]; if (Dm.inE(...q) && r < bd) { bd = r; best = q; break; } }
          return best || [x, y];
        };
        const ha = S.handle(-0.9, -0.5, { color: 'blue', label: 'a', constrain: (x, y) => nearestIn(DOM[which.value], x, y) });
        const hb = S.handle(1.0, 0.8, { color: 'orange', label: 'b', constrain: (x, y) => nearestIn(DOM[which.value], x, y) });
        // path through the convex pieces of the C-shape
        const W12 = [-1.27, 1.15], W23 = [-1.27, -1.15];
        const pieceOf = (p) => rects.map((r, i) => (inRect(r, p[0], p[1]) ? i : -1)).filter((i) => i >= 0);
        function chain(a, b) {
          const A = pieceOf(a), B = pieceOf(b);
          if (A.some((i) => B.includes(i))) return [a, b];
          const ia = Math.min(...A), ib = Math.max(...B);
          if (ia === 0 && ib === 2) return [a, W12, W23, b];
          if (ia === 0 && ib === 1) return [a, W12, b];
          if (ia === 1 && ib === 2) return [a, W23, b];
          const ja = Math.max(...A), jb = Math.min(...B);
          if (ja === 2 && jb === 0) return [a, W23, W12, b];
          if (ja === 2 && jb === 1) return [a, W23, b];
          return [a, W12, b];
        }
        let last = null, st = {};
        v.render(() => {
          const key = which.value, Dm = DOM[key];
          if (last !== key) { last = key; ha.set(...Dm.a); hb.set(...Dm.b); }
          const a = [ha.x, ha.y], b = [hb.x, hb.y];
          S.raster((x, y) => (Dm.inE(x, y) ? v.rgb(Dm.val(x, y) === 1 ? 'teal' : 'pink').slice(0, 3).concat(70) : null), { key, res: 2 });
          if (key === 'C') rects.forEach((r) => S.rect(r[0], r[1], r[2], r[3], { color: 'teal', width: 1, dash: [3, 3], alpha: 0.6 }));
          else if (key === 'disc') S.circle(0, 0, 1.6, { color: 'teal', width: 1.4 });
          else { S.circle(-1.05, 0, 0.85, { color: 'teal', width: 1.4 }); S.circle(1.05, 0, 0.85, { color: 'pink', width: 1.4 }); }
          // direct segment
          let segIn = true;
          for (let i = 0; i < 120; i++) { const t0 = i / 120, t1 = (i + 1) / 120; const p = M.vlerp(a, b, t0), q = M.vlerp(a, b, t1), m = M.vlerp(a, b, (t0 + t1) / 2); const ok = Dm.inE(...m); if (!ok) segIn = false; S.line(p[0], p[1], q[0], q[1], { color: ok ? 'green' : 'red', width: ok ? 2.6 : 2, dash: ok ? undefined : [5, 4] }); }
          let path = null;
          if (!segIn && key === 'C') { path = chain(a, b); S.path(path, { color: 'green', width: 3.2 }); path.slice(1, -1).forEach((w) => S.dot(w[0], w[1], { color: 'green', r: 4.5 })); }
          const fa = Dm.val(...a), fb = Dm.val(...b);
          S.corner(fa === fb ? `f(a) = f(b) = ${fa}` : `f(a) = ${fa} ≠ f(b) = ${fb}`, 'tl', { color: fa === fb ? 'green' : 'red', weight: 600 });
          v.legend([['teal', '$f=1$', { area: true }], ['pink', '$f=2$', { area: true }], ['green', 'segments inside convex pieces of $E$'], ['red', 'segment leaving $E$', { dash: true }]]);
          st = { key, segIn, path, same: fa === fb };
        });
        v.readout(() => {
          const s = st; if (!s.key) return '';
          if (s.segIn) return s.same ? '$[a,b]\\subset E$, so 9.19 with $M=0$ gives $|f(b)-f(a)|\\le 0\\cdot|b-a|=0$.' : '';
          if (s.key === 'C') return `$[a,b]$ leaves $E$, but the path $a\\to\\dots\\to b$ has ${s.path.length - 1} segments, each inside a convex piece of $E$; the corollary on each piece gives $f(a)=f(b)$.`;
          return 'No path inside $E$ joins $a$ to $b$: $f\'=0$ everywhere, yet $f(a)\\ne f(b)$. Convexity (or at least connectedness) is essential.';
        });
      },
    },
  ],
};
