// Rudin, Principles of Mathematical Analysis — Chapter 10 (part b3): 10.42–10.51
// Vector analysis in R³: vector fields with their 1- and 2-forms, gradient/curl/divergence,
// Green's theorem, area elements, line and surface integrals, Stokes' formula and the
// divergence theorem. The chapter title lives in ch10.js.

const GLX = [0.0198550717512319, 0.1016667612931866, 0.2372337950418355, 0.4082826787521751, 0.5917173212478249, 0.7627662049581645, 0.8983332387068134, 0.9801449282487681];
const GLW = [0.0506142681451881, 0.1111905172266872, 0.1568533229389436, 0.1813418916891810, 0.1813418916891810, 0.1568533229389436, 0.1111905172266872, 0.0506142681451881];
/** Composite 8-point Gauss–Legendre rule for ∫_a^b f (m panels). */
function quad(f, a, b, m = 4) {
  const h = (b - a) / m; let s = 0;
  for (let i = 0; i < m; i++) for (let k = 0; k < 8; k++) s += GLW[k] * f(a + h * (i + GLX[k]));
  return s * h;
}
/** ∬ over [a0,a1]×[b0,b1]. */
function quad2(f, a0, a1, b0, b1, m = 2, n = m) { return quad((u) => quad((w) => f(u, w), b0, b1, n), a0, a1, m); }
/** ∫ over the standard simplex Q² of g(u1, u2). */
function quadQ2(g, m = 2) { return quad((s) => (1 - s) * quad((t) => g(s, (1 - s) * t), 0, 1, m), 0, 1, m); }
const det2 = (a, b) => a[0] * b[1] - a[1] * b[0];
const sub2 = (p, q) => [p[0] - q[0], p[1] - q[1]];
const lerp2 = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const sc3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
/** Partial derivatives of a surface Φ(u,w) by central differences. */
function partials(P, u, w, h = 1e-5) {
  const a = P(u + h, w), b = P(u - h, w), c = P(u, w + h), d = P(u, w - h);
  return [sc3(sub3(a, b), 1 / (2 * h)), sc3(sub3(c, d), 1 / (2 * h))];
}
/** curl and div of a 3D field by central differences. */
function curlNum(F, p, h = 1e-4) {
  const d = (i, j) => { const e = [0, 0, 0]; e[j] = h; return (F(add3(p, e))[i] - F(sub3(p, e))[i]) / (2 * h); };
  return [d(2, 1) - d(1, 2), d(0, 2) - d(2, 0), d(1, 0) - d(0, 1)];
}
function divNum(F, p, h = 1e-4) {
  let s = 0; for (let j = 0; j < 3; j++) { const e = [0, 0, 0]; e[j] = h; s += (F(add3(p, e))[j] - F(sub3(p, e))[j]) / (2 * h); } return s;
}
/** Arrowhead centred at m along the data direction d (2D stage). */
function headAt(S, m, d, st = {}) {
  const X = S.X(m[0]), Y = S.Y(m[1]);
  let dx = S.X(m[0] + d[0]) - X, dy = S.Y(m[1] + d[1]) - Y; const L = Math.hypot(dx, dy); if (!(L > 1e-12)) return;
  dx /= L; dy /= L; const hd = st.head ?? 9, len = hd * 2.3;
  const a = S.inv(X - dx * len / 2, Y - dy * len / 2), b = S.inv(X + dx * len / 2, Y + dy * len / 2);
  S.arrow(a[0], a[1], b[0], b[1], { color: st.color || 'ink', head: hd, width: st.width ?? 2, alpha: st.alpha });
}
function segArrow(S, p, q, st = {}) { S.line(p[0], p[1], q[0], q[1], st); headAt(S, lerp2(p, q, st.at ?? 0.55), sub2(q, p), st); }
/** 3D polyline with arrowheads at fractions of its length (by index). */
function path3Arrows(S, pts, st = {}, fr = [0.5]) {
  S.path(pts, st);
  for (const f of fr) { const i = Math.min(pts.length - 2, Math.max(0, Math.round(f * (pts.length - 1)))); S.arrow(pts[Math.max(0, i - 1)], pts[i + 1], { color: st.color, width: st.width ?? 2, head: st.head ?? 10, bias: st.bias }); }
}
/** Diverging colour (array) for a value in [−m, m]. */
const div = (v, x, m) => v.M.cmap(0.5 + 0.5 * v.M.clamp(x / m, -1, 1), 'diverging');

export default {
  collection: 'pma',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.42
    {
      num: '10.42',
      kind: 'Definition',
      name: 'Vector fields; gradient, curl and divergence',
      statement: String.raw`A *vector field* on an open set $E\subset\R^3$ is simply a continuous map $F=F_1e_1+F_2e_2+F_3e_3$ of $E$ into $\R^3$. Each vector field determines a $1$-form and a $2$-form,
$$\lambda_F=F_1\,dx+F_2\,dy+F_3\,dz,\qquad \omega_F=F_1\,dy\wedge dz+F_2\,dz\wedge dx+F_3\,dx\wedge dy .$$
For $u\in\mathscr{C}'(E)$ the *gradient* is $\nabla u=(D_1u)e_1+(D_2u)e_2+(D_3u)e_3$; for $F$ of class $\mathscr{C}'$ the *curl* and the *divergence* are
$$\nabla\times F=(D_2F_3-D_3F_2)e_1+(D_3F_1-D_1F_3)e_2+(D_1F_2-D_2F_1)e_3,\qquad \nabla\cdot F=D_1F_1+D_2F_2+D_3F_3 .$$
These are what the exterior derivative produces: $du=\lambda_{\nabla u}$, $\;d\lambda_F=\omega_{\nabla\times F}$, $\;d\omega_F=(\nabla\cdot F)\,dx\wedge dy\wedge dz$.`,
      idea: String.raw`The dictionary $F\leftrightarrow\lambda_F\leftrightarrow\omega_F$ turns the single operator $d$ into the three classical ones, so Stokes' theorem (10.33) becomes Green's theorem, Stokes' formula and the divergence theorem. Read through Stokes' theorem on tiny discs and balls, the curl measures circulation per unit area and the divergence measures outward flux per unit volume.`,
      caption: String.raw`A planar field ($F_3=0$, no $z$-dependence), so $\nabla\times F=(D_1F_2-D_2F_1)e_3$. Drag the probe $p$ and shrink the circle. In *curl* mode the right panel plots the circulation $\oint\lambda_F$ around the circle divided by its area against the radius $r$; in *divergence* mode it plots the outward flux divided by the area. As $r\to0$ both curves land on the exact value at $p$ (dashed), computed from the formulas above.`,
      deps: ['pma-10.11', 'pma-10.18'],
      tags: ['vector analysis', 'curl', 'divergence'],
      viz(v) {
        const M = v.M;
        const F = (x, y) => [Math.sin(y) + 0.4 * x * Math.cos(y), Math.sin(x) + 0.3 * y * y];
        const CURL = (x, y) => Math.cos(x) - Math.cos(y) + 0.4 * x * Math.sin(y);
        const DIV = (x, y) => 0.4 * Math.cos(y) + 0.6 * y;
        const mode = v.select('', [{ value: 'curl', label: 'curl: circulation per area' }, { value: 'div', label: 'divergence: flux per area' }], 'curl');
        const rS = v.slider('radius $r$', 0.04, 1.1, 0.6, { step: 0.01 });
        const S = v.stage({ x: [-2.6, 2.6], y: [-1.8, 1.8], equal: true, height: 340, axes: false, title: '$F=(\\sin y+0.4x\\cos y)\\,e_1+(\\sin x+0.3y^2)\\,e_2$' });
        const B = v.stage({ x: [0, 1.15], y: [-2, 2], height: 340, axes: 'box', weight: 0.7, minWidth: 220, xlabel: 'r', title: 'ratio against the radius' });
        const p = S.handle(0.9, 0.35, { color: 'gold', label: 'p' });
        let st = null;
        const circ = (px, py, r) => quad((t) => { const c = Math.cos(t), s = Math.sin(t); const f = F(px + r * c, py + r * s); return (-f[0] * s + f[1] * c) * r; }, 0, 2 * Math.PI, 6) / (Math.PI * r * r);
        const flux = (px, py, r) => quad((t) => { const c = Math.cos(t), s = Math.sin(t); const f = F(px + r * c, py + r * s); return (f[0] * c + f[1] * s) * r; }, 0, 2 * Math.PI, 6) / (Math.PI * r * r);
        v.render(() => {
          const isC = mode.value === 'curl', G = isC ? CURL : DIV, ratio = isC ? circ : flux;
          S.heat(G, { range: [-2.2, 2.2], cmap: 'diverging', res: 3, alpha: 0.45, key: mode.value });
          S.field((x, y) => F(x, y), { spacing: 32, color: 'ink', alpha: 0.45 });
          const r = rS.value;
          const pts = []; for (let i = 0; i <= 120; i++) { const t = (2 * Math.PI * i) / 120; pts.push([p.x + r * Math.cos(t), p.y + r * Math.sin(t)]); }
          S.path(pts, { color: 'gold', width: 2.6 });
          for (let k = 0; k < 12; k++) {
            const t = (2 * Math.PI * k) / 12, c = Math.cos(t), s = Math.sin(t), q = [p.x + r * c, p.y + r * s], f = F(q[0], q[1]);
            const comp = isC ? -f[0] * s + f[1] * c : f[0] * c + f[1] * s, d = isC ? [-s, c] : [c, s], L = 0.3 * comp;
            if (Math.abs(L) > 0.01) S.arrow(q[0], q[1], q[0] + L * d[0], q[1] + L * d[1], { color: comp > 0 ? 'green' : 'red', width: 2, head: 7 });
          }
          // ratio against r, and the limiting value
          const rs = M.linspace(0.03, 1.12, 70), ys = rs.map((x) => ratio(p.x, p.y, x));
          const ex = G(p.x, p.y), lo = Math.min(ex, ...ys), hi = Math.max(ex, ...ys), pad = Math.max(0.15, (hi - lo) * 0.2);
          B.setView([0, 1.15], [lo - pad, hi + pad]);
          B.setTitle(isC ? '$\\frac{1}{\\pi r^2}\\oint\\lambda_F$ against $r$' : '$\\frac{1}{\\pi r^2}\\oint F\\cdot n\\,ds$ against $r$');
          B.hline(ex, { color: 'ink', width: 1.4, dash: [6, 4] });
          B.path(rs.map((x, i) => [x, ys[i]]), { color: 'gold', width: 2.6 });
          const cur = ratio(p.x, p.y, r);
          B.dot(r, cur, { color: 'gold', r: 5 }); B.dot(0, ex, { color: 'ink', r: 4.5 });
          st = { isC, cur, ex, r };
        });
        v.legend([['red', 'heat: value of the curl / divergence (positive)', { area: true }], ['blue', 'negative', { area: true }], ['green', 'tangential / normal component along the circle']]);
        v.readout(() => {
          if (!st) return '';
          return st.isC ? `$\\frac{1}{\\pi r^2}\\oint_{|x-p|=r}\\lambda_F=${v.fix(st.cur, 4)}$ at $r=${v.fix(st.r, 2)}$; $\\;(\\nabla\\times F)(p)\\cdot e_3=D_1F_2-D_2F_1=${v.fix(st.ex, 4)}$.`
            : `$\\frac{1}{\\pi r^2}\\oint_{|x-p|=r}F\\cdot n\\,ds=${v.fix(st.cur, 4)}$ at $r=${v.fix(st.r, 2)}$; $\\;(\\nabla\\cdot F)(p)=D_1F_1+D_2F_2=${v.fix(st.ex, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.43
    {
      num: '10.43',
      kind: 'Theorem',
      name: 'curl ∇u = 0 and div curl G = 0, with converses',
      statement: String.raw`On an open set $E\subset\R^3$, two compositions of the classical operators vanish identically on $\mathscr{C}''$ data:
(a) $\nabla\times(\nabla u)=0$ for every $u\in\mathscr{C}''(E)$;
(b) $\nabla\cdot(\nabla\times G)=0$ for every vector field $G$ of class $\mathscr{C}''$ in $E$.
When $E$ is $\mathscr{C}''$-equivalent to a convex set, these are the only obstructions. For a vector field $F$ of class $\mathscr{C}'$ in such an $E$:
- converse of (a): $\nabla\times F=0$ implies $F=\nabla u$ for some $u\in\mathscr{C}''(E)$;
- converse of (b): $\nabla\cdot F=0$ implies $F=\nabla\times G$ for some vector field $G$ of class $\mathscr{C}''$ in $E$.`,
      idea: String.raw`Translate into forms (10.42): $\nabla\times\nabla u$ corresponds to $d(du)$ and $\nabla\cdot(\nabla\times G)$ to $d(d\lambda_G)$, both $0$ because $d^2=0$ (10.20). For the converses, $\nabla\times F=0$ says $\lambda_F$ is closed and $\nabla\cdot F=0$ says $\omega_F$ is closed; by 10.39–10.40 closed forms are exact on such $E$, and exactness of $\lambda_F$ or $\omega_F$ is precisely $F=\nabla u$ or $F=\nabla\times G$. Without the hypothesis on $E$ the converses fail: the vortex field around the $z$-axis and the inverse-square field are the standard counterexamples.`,
      caption: String.raw`Pick a case. In (a) and (a$'$) a horizontal loop is drawn: the curl of the field is $0$ (sampled maximum in the readout), yet around the excluded $z$-axis (red) the vortex field circulates $2\pi$, so it is no gradient. In (b) and (b$'$) a sphere is shaded by $F\cdot n$: both fields have divergence $0$, but the inverse-square field sends flux $4\pi$ out of every sphere around the excluded origin, so it is no curl. Slide the loop or sphere off the singular set and the integral drops to $0$.`,
      deps: ['pma-10.42', 'pma-10.20', 'pma-10.39', 'pma-10.40'],
      see: ['rca-10.10'],
      tags: ['vector analysis', 'closed forms'],
      refs: ['Rudin, Principles of Mathematical Analysis, 3rd ed., Theorem 10.43 and proof, pp. 281–282'],
      viz(v) {
        const CASES = {
          a: { label: '(a) $F=\\nabla u$', F: (p) => [Math.cos(p[0]) * p[1] + p[2], Math.sin(p[0]), p[0]], kind: 'loop', test: 'curl' },
          a2: { label: "(a$'$) vortex $\\frac{-y\\,e_1+x\\,e_2}{x^2+y^2}$", F: (p) => { const r2 = p[0] * p[0] + p[1] * p[1]; return [-p[1] / r2, p[0] / r2, 0]; }, kind: 'loop', test: 'curl' },
          b: { label: '(b) $F=\\nabla\\times G$', F: (p) => [p[1] - p[0], p[0], p[2] - Math.cos(p[1])], kind: 'sphere', test: 'div' },
          b2: { label: "(b$'$) $\\frac{x}{|x|^3}$", F: (p) => { const r = len3(p); return sc3(p, 1 / (r * r * r)); }, kind: 'sphere', test: 'div' },
        };
        const cs = v.select('', Object.entries(CASES).map(([value, o]) => ({ value, label: o.label })), 'a2');
        const off = v.slider('offset of the loop / sphere', 0, 1.35, 0.25, { step: 0.01 });
        const rad = v.slider('radius', 0.3, 1.0, 0.8, { step: 0.01 });
        const S3 = v.stage3d({ range: 2.0, height: 400, yaw: -0.6, pitch: 0.45, full: true });
        let st = null;
        v.render(() => {
          const C = CASES[cs.value], F = C.F, o = off.value, R = rad.value;
          // field samples: in the plane of the loop, or on the sphere and a sparse grid
          const arrowAt = (p, len, col, w) => { const f = F(p), L = len3(f); if (!(L > 1e-9) || !isFinite(L)) return; S3.arrow(p, add3(p, sc3(f, len * Math.min(1, Math.sqrt(L)) / L)), { color: col, width: w, head: 7 }); };
          const grid = [-1.5, -0.5, 0.5, 1.5], zs = [-1, 0, 1];
          if (C.kind === 'loop') {
            for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (i || j) arrowAt([0.7 * i, 0.7 * j, 0.4], 0.32, 'orange', 1.8);
            for (const x of grid) for (const y of grid) for (const z of [-1.1, 1.3]) arrowAt([x, y, z], 0.3, 'muted', 1.1);
          } else {
            for (const x of grid) for (const y of grid) for (const z of zs) arrowAt([x, y, z], 0.3, 'muted', 1.1);
          }
          // singular sets
          if (cs.value === 'a2') S3.line([0, 0, -1.8], [0, 0, 1.8], { color: 'red', width: 2.5, dash: [6, 4] });
          if (cs.value === 'b2') S3.dot([0, 0, 0], { color: 'red', r: 6 });
          // test of the identity at sample points
          let worst = 0;
          for (const x of grid) for (const y of grid) for (const z of zs) {
            const p = [x * 0.9 + 0.07, y * 0.9 + 0.05, z * 0.9 + 0.03];
            worst = Math.max(worst, C.test === 'curl' ? len3(curlNum(F, p)) : Math.abs(divNum(F, p)));
          }
          let I;
          if (C.kind === 'loop') {
            const c = [o, 0, 0.4], g = (t) => add3(c, [R * Math.cos(t), R * Math.sin(t), 0]);
            const pts = []; for (let i = 0; i <= 90; i++) pts.push(g((2 * Math.PI * i) / 90));
            S3.path(pts, { color: 'accent', width: 3.4, bias: -0.2 });
            for (const t0 of [0.6, 2.7, 4.8]) S3.arrow(g(t0 - 0.12), g(t0 + 0.12), { color: 'accent', width: 3.4, head: 13, bias: -0.25 });
            I = quad((t) => dot3(F(g(t)), [-R * Math.sin(t), R * Math.cos(t), 0]), 0, 2 * Math.PI, 8);
            S3.dot(c, { color: 'accent', r: 3 });
          } else {
            const c = [o, 0, 0], P = (th, ph) => add3(c, [R * Math.sin(th) * Math.cos(ph), R * Math.sin(th) * Math.sin(ph), R * Math.cos(th)]);
            const m = cs.value === 'b2' ? 1.2 : 1.5;
            S3.surface(P, [0.001, Math.PI - 0.001], [0, 2 * Math.PI], { nu: 18, nv: 30, alpha: 0.6, colorFn: (th, ph, q) => div(v, dot3(F(q), sc3(sub3(q, c), 1 / R)), m) });
            for (const [th, ph] of [[0.4, 0.5], [1.1, 0.2], [1.1, 2.3], [1.1, 4.4], [2.0, 1.2], [2.0, 3.3], [2.0, 5.4], [2.7, 0.8]]) arrowAt(P(th, ph), 0.4, 'orange', 2);
            I = quad2((th, ph) => dot3(F(P(th, ph)), sc3(sub3(P(th, ph), c), R * Math.sin(th))), 0, Math.PI, 0, 2 * Math.PI, 4, 6);
          }
          st = { C, worst, I, k: C.kind, key: cs.value };
        });
        v.readout(() => {
          if (!st) return '';
          const { worst, I, k, key } = st;
          const head = k === 'loop' ? `sampled $\\max|\\nabla\\times F|=${v.sci(worst + 1e-16, 2)}$; $\\;\\oint\\lambda_F=${v.fix(I, 4)}$` : `sampled $\\max|\\nabla\\cdot F|=${v.sci(worst + 1e-16, 2)}$; $\\;\\int_{\\text{sphere}}F\\cdot n\\,dA=${v.fix(I, 4)}$`;
          if (key === 'a') return head + ' — a gradient circulates $0$ around every loop.';
          if (key === 'b') return head + ' — a curl has zero flux through every sphere.';
          if (key === 'a2') return head + (Math.abs(I) > 1 ? ' $=2\\pi$: curl-free but not a gradient on $\\R^3$ minus the $z$-axis.' : ' — this loop does not go around the $z$-axis.');
          return head + (Math.abs(I) > 1 ? ' $=4\\pi$: divergence-free but not a curl on $\\R^3\\setminus\\{0\\}$.' : ' — this sphere does not enclose the origin.');
        });
      },
    },
    // ------------------------------------------------------------------ 10.45
    {
      num: '10.45',
      kind: 'Theorem',
      name: "Green's theorem",
      credit: 'Green, 1828',
      statement: String.raw`**Green's theorem.** For functions $\alpha,\beta\in\mathscr{C}'(E)$ on an open set $E\subset\R^2$, and a closed set $\Omega\subset E$ that has a positively oriented boundary $\partial\Omega$ in the sense of 10.31, the line integral of $\alpha\,dx+\beta\,dy$ around $\partial\Omega$ equals a double integral over $\Omega$:
$$\int_{\partial\Omega}(\alpha\,dx+\beta\,dy)=\int_\Omega\Big(\frac{\partial\beta}{\partial x}-\frac{\partial\alpha}{\partial y}\Big)\,dA .$$
The choice $\alpha=-y$, $\beta=x$ yields the area formula $A(\Omega)=\frac12\int_{\partial\Omega}(x\,dy-y\,dx)$.`,
      idea: String.raw`Put $\lambda=\alpha\,dx+\beta\,dy$. Then $d\lambda=(D_1\beta-D_2\alpha)\,dx\wedge dy$, and the identity is $\int_{\partial\Omega}\lambda=\int_\Omega d\lambda$, the case $k=m=2$ of Stokes' theorem (10.33). Positive orientation matters: traversing the boundary clockwise changes the sign of the left side only.`,
      caption: String.raw`Drag the seven vertices of the polygon $\Omega$ (a union of triangles, as in 10.31) over the shaded map of $\partial\beta/\partial x-\partial\alpha/\partial y$. The readout compares the line integral, computed edge by edge, with the double integral over $\Omega$, computed on a triangulation. With the area form the right side is the area. Drag a vertex across the polygon to reverse the traversal: the line integral changes sign while $\int_\Omega$ does not.`,
      deps: ['pma-10.33', 'pma-10.31'],
      see: ['rca-10.35', 'rca-10.14'],
      tags: ['Green', 'Stokes'],
      viz(v) {
        const M = v.M;
        const FORMS = {
          wave: { label: '$\\alpha=0.8\\cos 2y,\\ \\beta=\\sin 1.7x+0.3xy$', w: (x, y) => [0.8 * Math.cos(2 * y), Math.sin(1.7 * x) + 0.3 * x * y], c: (x, y) => 1.7 * Math.cos(1.7 * x) + 0.3 * y + 1.6 * Math.sin(2 * y) },
          area: { label: 'area: $\\alpha=-\\tfrac12y,\\ \\beta=\\tfrac12x$', w: (x, y) => [-y / 2, x / 2], c: () => 1 },
          ex: { label: 'exact: $\\alpha=2xy,\\ \\beta=x^2$', w: (x, y) => [2 * x * y, x * x], c: () => 0 },
        };
        const fm = v.select('', Object.entries(FORMS).map(([value, o]) => ({ value, label: o.label })), 'wave');
        const S = v.stage({ x: [-2.4, 2.4], y: [-1.6, 1.6], equal: true, height: 380, axes: false, full: true });
        const H = [[-1.5, -0.7], [-0.2, -1.2], [1.3, -1.0], [1.7, 0.1], [0.9, 1.1], [-0.3, 0.6], [-1.3, 1.0]].map(([x, y]) => S.handle(x, y, { color: 'ink', r: 6 }));
        v.legend([['red', '$\\partial\\beta/\\partial x-\\partial\\alpha/\\partial y>0$', { area: true }], ['blue', '$<0$', { area: true }], ['green', 'positively oriented $\\partial\\Omega$'], ['orange', 'clockwise traversal']]);
        let st = null;
        const crosses = (P) => {
          const n = P.length, ccw = (a, b, c) => det2(sub2(b, a), sub2(c, a));
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
            if (j === i + 1 || (i === 0 && j === n - 1)) continue;
            const a = P[i], b = P[(i + 1) % n], c = P[j], d = P[(j + 1) % n];
            if (ccw(a, b, c) * ccw(a, b, d) < 0 && ccw(c, d, a) * ccw(c, d, b) < 0) return true;
          }
          return false;
        };
        v.render(() => {
          const F = FORMS[fm.value];
          S.heat(F.c, { range: [-3.4, 3.4], cmap: 'diverging', res: 3, alpha: 0.5, key: fm.value });
          const P = H.map((h) => [h.x, h.y]), n = P.length;
          const A = M.polyArea(P), pos = A > 0, bad = crosses(P);
          // line integral, edge by edge
          let line = 0; for (let i = 0; i < n; i++) line += quad((t) => { const p = lerp2(P[i], P[(i + 1) % n], t), d = sub2(P[(i + 1) % n], P[i]); const w = F.w(p[0], p[1]); return w[0] * d[0] + w[1] * d[1]; }, 0, 1, 2);
          // ∫_Ω dω on the fan triangulation (signed), then corrected to the region integral
          let fan = 0; for (let i = 1; i < n - 1; i++) { const a = P[0], A1 = sub2(P[i], a), A2 = sub2(P[i + 1], a), J = det2(A1, A2); fan += quadQ2((u1, u2) => F.c(a[0] + u1 * A1[0] + u2 * A2[0], a[1] + u1 * A1[1] + u2 * A2[1]) * J, 3); }
          const region = pos ? fan : -fan;
          S.poly(P, { fill: bad ? 'red' : 'ink', fillAlpha: 0.08, stroke: false });
          const col = bad ? 'red' : pos ? 'green' : 'orange';
          for (let i = 0; i < n; i++) segArrow(S, P[i], P[(i + 1) % n], { color: col, width: 3, head: 11 });
          S.corner(bad ? 'the boundary crosses itself: no region Ω' : pos ? 'counter-clockwise: ∂Ω positively oriented' : 'clockwise: this is −∂Ω', 'tl', { color: col, weight: 600 });
          st = { line, region, A: Math.abs(A), pos, bad, f: fm.value };
        });
        v.readout(() => {
          if (!st) return '';
          const { line, region, A, pos, bad, f } = st;
          let s = `$\\oint(\\alpha\\,dx+\\beta\\,dy)=${v.fix(line, 5)}$ along the drawn boundary; $\\;\\int_\\Omega(\\partial_x\\beta-\\partial_y\\alpha)\\,dA=${v.fix(region, 5)}$`;
          if (f === 'area') s += ` (the area is $${v.fix(A, 5)}$)`;
          if (bad) return s + '. The polygon is not a simple closed curve, so it bounds no region.';
          return s + (pos ? '.' : ' — the drawn loop runs clockwise, so it is $-\\partial\\Omega$ and the signs are opposite.');
        });
      },
    },
    // ------------------------------------------------------------------ 10.46
    {
      num: '10.46',
      kind: 'Definition',
      name: 'Area elements in R³',
      statement: String.raw`For a $2$-surface $\Phi$ of class $\mathscr{C}'$ in $\R^3$, with parameter domain $D\subset\R^2$ and $(x,y,z)=\Phi(u,v)$, form at each $(u,v)\in D$ the vector
$$N(u,v)=\frac{\partial(y,z)}{\partial(u,v)}\,e_1+\frac{\partial(z,x)}{\partial(u,v)}\,e_2+\frac{\partial(x,y)}{\partial(u,v)}\,e_3 ,$$
which is the cross product $\Phi_u\times\Phi_v$ of the partial derivatives. The *area element* of $\Phi$ is $dA=|N(u,v)|\,du\,dv$: functions $f$ continuous on $\Phi(D)$ are integrated by
$$\int_\Phi f\,dA=\int_D f(\Phi(u,v))\,|N(u,v)|\,du\,dv,$$
and $A(\Phi)=\int_D|N|$ is the *area* of $\Phi$. Wherever $N\ne0$, the unit vector $n=N/|N|$ is the normal of $\Phi$.`,
      idea: String.raw`A small parameter square of side $h$ at $(u,v)$ is mapped approximately onto the parallelogram spanned by $h\Phi_u$ and $h\Phi_v$, whose area is $h^2|\Phi_u\times\Phi_v|=h^2|N|$; summing gives the area integral. The components of $N$ are the Jacobians of the projections of $\Phi$ to the three coordinate planes, which is how $N$ will appear when the $2$-form $\omega_F$ is integrated over $\Phi$ (10.49).`,
      caption: String.raw`Drag the corner $(u,v)$ of the small square in the parameter domain (left) and change its size $h$. On the surface (right; drag to rotate) its image is outlined in gold, with the edges $h\Phi_u$ (orange) and $h\Phi_v$ (purple) and the normal $N$ (green). The readout compares $h^2|N|$ with the true area of the curved patch (computed on a fine mesh); the ratio tends to $1$ as $h\to0$. On the sphere $|N|=\sin u$ vanishes at the poles.`,
      deps: ['pma-10.42', 'pma-10.11'],
      tags: ['surfaces', 'area'],
      viz(v) {
        const PI = Math.PI;
        const SURF = {
          sph: { label: 'sphere $\\Sigma$', P: (u, w) => [Math.sin(u) * Math.cos(w), Math.sin(u) * Math.sin(w), Math.cos(u)], D: [[0, PI], [0, 2 * PI]], exact: 4 * PI, ex: '4\\pi', h0: [1.05, 5.95] },
          tor: { label: 'torus, $a=1$, $b=0.4$', P: (u, w) => [(1 + 0.4 * Math.cos(u)) * Math.cos(w), (1 + 0.4 * Math.cos(u)) * Math.sin(w), 0.4 * Math.sin(u)], D: [[0, 2 * PI], [0, 2 * PI]], exact: 4 * PI * PI * 0.4, ex: '4\\pi^2ab', h0: [0.7, 5.2] },
          gr: { label: 'graph $z=0.5\\sin 2u\\cos 2v$', P: (u, w) => [u, w, 0.5 * Math.sin(2 * u) * Math.cos(2 * w)], D: [[-1.2, 1.2], [-1.2, 1.2]], exact: null, h0: [0.2, -0.3] },
        };
        const sf = v.select('', Object.entries(SURF).map(([value, o]) => ({ value, label: o.label })), 'sph');
        const hS = v.slider('size $h$ of the square', 0.03, 0.6, 0.35, { step: 0.01 });
        const L = v.stage({ x: [-0.2, 3.4], y: [-0.3, 6.6], height: 360, axes: 'box', weight: 0.6, minWidth: 220, xlabel: 'u', title: 'parameter domain $D$ in the $(u,v)$-plane' });
        const S3 = v.stage3d({ range: 1.45, height: 360, yaw: -0.6, pitch: 0.45, title: 'the surface $\\Phi(D)$' });
        const q = L.handle(1.05, 5.95, { color: 'gold', label: '(u,v)', labelPos: 'sw' });
        v.legend([['orange', '$h\\,\\Phi_u$'], ['purple', '$h\\,\\Phi_v$'], ['green', '$N=\\Phi_u\\times\\Phi_v$'], ['gold', 'the square and its image']]);
        let last = null, st = null, total = null;
        v.render(() => {
          const Sf = SURF[sf.value], P = Sf.P, [[u0, u1], [w0, w1]] = Sf.D, h = hS.value;
          if (last !== sf.value) {
            last = sf.value;
            const pu = (u1 - u0) * 0.08, pw = (w1 - w0) * 0.06;
            L.setView([u0 - pu, u1 + pu], [w0 - pw, w1 + pw]);
            L.setTicks(sf.value === 'gr' ? null : [[0, '0'], [PI / 2, 'π/2'], [PI, 'π'], ...(u1 > 4 ? [[2 * PI, '2π']] : [])], sf.value === 'gr' ? null : [[0, '0'], [PI, 'π'], [2 * PI, '2π']]);
            q.set(...Sf.h0);
            q.constrain = { x: [u0, u1], y: [w0, w1] };
            total = quad2((u, w) => { const [a, b] = partials(P, u, w); return len3(cross3(a, b)); }, u0, u1, w0, w1, 6, 6);
          }
          const uu = Math.min(q.x, u1 - h), ww = Math.min(q.y, w1 - h);
          // left
          L.rect(u0, w0, u1, w1, { fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 1.2 });
          L.rect(uu, ww, uu + h, ww + h, { fill: 'gold', fillAlpha: 0.35, color: 'gold', width: 2 });
          L.arrow(uu, ww, uu + h, ww, { color: 'orange', width: 2.2, head: 8 }); L.arrow(uu, ww, uu, ww + h, { color: 'purple', width: 2.2, head: 8 });
          // right
          S3.surface(P, [u0, u1], [w0, w1], { nu: 26, nv: 40, color: 'accent', alpha: 0.32 });
          const edge = []; const K = 16;
          for (let i = 0; i <= K; i++) edge.push(P(uu + (h * i) / K, ww));
          for (let i = 0; i <= K; i++) edge.push(P(uu + h, ww + (h * i) / K));
          for (let i = 0; i <= K; i++) edge.push(P(uu + h - (h * i) / K, ww + h));
          for (let i = 0; i <= K; i++) edge.push(P(uu, ww + h - (h * i) / K));
          S3.path(edge, { color: 'gold', width: 3, bias: -0.3 });
          const p0 = P(uu, ww), [Pu, Pw] = partials(P, uu, ww), N = cross3(Pu, Pw), nN = len3(N);
          S3.arrow(p0, add3(p0, sc3(Pu, h)), { color: 'orange', width: 2.6, head: 9, bias: -0.4 });
          S3.arrow(p0, add3(p0, sc3(Pw, h)), { color: 'purple', width: 2.6, head: 9, bias: -0.4 });
          if (nN > 1e-6) S3.arrow(p0, add3(p0, sc3(N, 0.5 / Math.max(nN, 0.5))), { color: 'green', width: 2.8, head: 10, bias: -0.4 });
          S3.dot(p0, { color: 'gold', r: 4.5, bias: -0.5 });
          // true patch area on a fine mesh (sum of triangle areas)
          let patch = 0; const m = 24;
          for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
            const a = P(uu + (h * i) / m, ww + (h * j) / m), b = P(uu + (h * (i + 1)) / m, ww + (h * j) / m), c = P(uu + (h * (i + 1)) / m, ww + (h * (j + 1)) / m), d = P(uu + (h * i) / m, ww + (h * (j + 1)) / m);
            patch += 0.5 * len3(cross3(sub3(b, a), sub3(c, a))) + 0.5 * len3(cross3(sub3(c, a), sub3(d, a)));
          }
          st = { nN, h, patch, total, Sf };
        });
        v.readout(() => {
          if (!st) return '';
          const { nN, h, patch, total, Sf } = st;
          return `$|N|=${v.fix(nN, 4)}$, $\\;h^2|N|=${v.fix(h * h * nN, 5)}$ vs. patch area $${v.fix(patch, 5)}$ (ratio $${v.fix(patch > 1e-12 ? (h * h * nN) / patch : 1, 4)}$). Total $\\int_D|N|=${v.fix(total, 4)}$` + (Sf.exact ? ` $=${Sf.ex}\\approx${v.fix(Sf.exact, 4)}$.` : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 10.48
    {
      num: '10.48',
      kind: 'Definition',
      name: 'Line integrals of vector fields',
      statement: String.raw`For a continuous vector field $F$ on an open set $E\subset\R^3$ and a $\mathscr{C}'$-curve $\gamma:[0,1]\to E$, the integral of the $1$-form $\lambda_F$ along $\gamma$ is
$$\int_\gamma\lambda_F=\int_0^1 F(\gamma(t))\cdot\gamma'(t)\,dt .$$
Where $\gamma'(t)\ne0$, write $T(t)=\gamma'(t)/|\gamma'(t)|$ for the unit tangent and $ds=|\gamma'(t)|\,dt$ for the *line element*; then $\int_\gamma\lambda_F=\int_\gamma(F\cdot T)\,ds$ — the tangential component of $F$ integrated with respect to arc length.`,
      idea: String.raw`Pulling $\lambda_F=F_1dx+F_2dy+F_3dz$ back along $\gamma$ gives $\sum_iF_i(\gamma)\gamma_i'\,dt=F(\gamma)\cdot\gamma'\,dt$; writing $\gamma'=|\gamma'|\,T$ splits this into the tangential component $F\cdot T$ and the length element $ds$. Only the component of $F$ along the curve contributes, and the value is independent of how fast $\gamma$ is traversed.`,
      caption: String.raw`The gold point travels along the curve with its unit tangent $T$ (black) and the field $F$ (orange). The right panel plots the tangential component $F\cdot T$ against arc length $s$; the signed area under it is $\int_\gamma\lambda_F$ (green where $F$ helps the motion, red where it opposes it). The readout computes the integral twice — in the parameter $t$ and in arc length $s$. For the gradient field it depends only on the end points.`,
      deps: ['pma-10.42'],
      tags: ['vector analysis', 'line integrals'],
      viz(v) {
        const FIELDS = {
          sw: { label: '$F=-y\\,e_1+x\\,e_2+0.6\\,e_3$', F: (p) => [-p[1], p[0], 0.6] },
          sh: { label: '$F=z\\,e_1+x\\,e_2+y\\,e_3$', F: (p) => [p[2], p[0], p[1]] },
          gr: { label: '$F=\\nabla(xyz)$', F: (p) => [p[1] * p[2], p[0] * p[2], p[0] * p[1]], u: (p) => p[0] * p[1] * p[2] },
        };
        const fs = v.select('', Object.entries(FIELDS).map(([value, o]) => ({ value, label: o.label })), 'sh');
        const turns = v.slider('turns', 0.5, 2.5, 1.25, { step: 0.05 });
        const S3 = v.stage3d({ range: 1.6, height: 360, yaw: -0.7, pitch: 0.4, title: 'the curve $\\gamma$ and the field $F$' });
        const B = v.stage({ x: [0, 1], y: [-1, 1], height: 360, axes: 'box', weight: 0.85, minWidth: 240, xlabel: 's', title: 'tangential component $F\\cdot T$ against arc length' });
        v.legend([['orange', '$F$ along $\\gamma$'], ['ink', 'unit tangent $T$'], ['green', '$F\\cdot T>0$', { area: true }], ['red', '$F\\cdot T<0$', { area: true }]]);
        let st = null;
        v.animate((tt) => {
          const Fd = FIELDS[fs.value], F = Fd.F, k = turns.value;
          const g = (t) => { const a = 2 * Math.PI * k * t; const r = 1 - 0.35 * t; return [r * Math.cos(a), r * Math.sin(a), 1.6 * t - 0.8]; };
          const dg = (t) => { const h = 1e-5, a = g(t + h), b = g(t - h); return sc3(sub3(a, b), 1 / (2 * h)); };
          const N = 500, pts = [], s = [0], ft = [];
          for (let i = 0; i <= N; i++) { const t = i / N; pts.push(g(t)); const d = dg(t), L = len3(d); ft.push(dot3(F(g(t)), d) / L); if (i) s.push(s[i - 1] + len3(sub3(pts[i], pts[i - 1]))); }
          const Ltot = s[N];
          // integral in t (Gauss–Legendre) and in s (trapezoid on the arc-length grid)
          const It = quad((t) => dot3(F(g(t)), dg(t)), 0, 1, 16);
          let Is = 0; for (let i = 1; i <= N; i++) Is += 0.5 * (ft[i] + ft[i - 1]) * (s[i] - s[i - 1]);
          // 3D
          S3.path(pts, { color: 'accent', width: 3 });
          for (let i = 0; i <= 24; i++) { const t = i / 24, p = g(t), f = F(p), Lf = len3(f); if (Lf > 1e-9) S3.arrow(p, add3(p, sc3(f, (0.32 * Math.min(1, Lf)) / Lf)), { color: 'orange', width: 1.6, head: 6 }); }
          const u = (tt % 6) / 6, p = g(u), d = dg(u), T = sc3(d, 1 / len3(d)), f = F(p);
          S3.arrow(p, add3(p, sc3(T, 0.45)), { color: 'ink', width: 2.6, head: 9, bias: -0.3 });
          S3.arrow(p, add3(p, sc3(f, 0.45 / Math.max(1, len3(f)))), { color: 'orange', width: 2.6, head: 9, bias: -0.3 });
          S3.dot(p, { color: 'gold', r: 6, bias: -0.4 });
          S3.dot(pts[0], { color: 'ink', r: 4, label: 'γ(0)' }); S3.dot(pts[N], { color: 'ink', r: 4, label: 'γ(1)' });
          // 2D: F·T against s
          const lo = Math.min(0, ...ft), hi = Math.max(0, ...ft), pad = Math.max(0.1, (hi - lo) * 0.12);
          B.setView([0, Ltot], [lo - pad, hi + pad]);
          const curve = ft.map((y, i) => [s[i], y]);
          B.fn((x) => { let i = Math.min(N - 1, Math.max(0, s.findIndex((q) => q >= x) - 1)); const fr = (x - s[i]) / (s[i + 1] - s[i] || 1); const y = ft[i] + (ft[i + 1] - ft[i]) * fr; return Math.max(0, y); }, { domain: [0, Ltot], color: 'green', width: 0.01, fill: 'green', fillAlpha: 0.3, n: 400 });
          B.fn((x) => { let i = Math.min(N - 1, Math.max(0, s.findIndex((q) => q >= x) - 1)); const fr = (x - s[i]) / (s[i + 1] - s[i] || 1); const y = ft[i] + (ft[i + 1] - ft[i]) * fr; return Math.min(0, y); }, { domain: [0, Ltot], color: 'red', width: 0.01, fill: 'red', fillAlpha: 0.3, n: 400 });
          B.hline(0, { color: 'faint', width: 1 });
          B.path(curve, { color: 'ink', width: 2 });
          const iu = Math.round(u * N); B.vline(s[iu], { color: 'gold', width: 1, dash: [3, 3] }); B.dot(s[iu], ft[iu], { color: 'gold', r: 5 });
          st = { It, Is, Ltot, du: Fd.u ? Fd.u(pts[N]) - Fd.u(pts[0]) : null };
        }, { period: 6 });
        v.readout(() => {
          if (!st) return '';
          return `$\\int_0^1F(\\gamma(t))\\cdot\\gamma'(t)\\,dt=${v.fix(st.It, 5)}$, $\\;\\int_0^{L}(F\\cdot T)\\,ds=${v.fix(st.Is, 5)}$ with length $L=${v.fix(st.Ltot, 4)}$` + (st.du != null ? `; $\\;u(\\gamma(1))-u(\\gamma(0))=${v.fix(st.du, 5)}$.` : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 10.49
    {
      num: '10.49',
      kind: 'Definition',
      name: 'Surface integrals: flux through a 2-surface',
      statement: String.raw`For a continuous vector field $F$ on an open set $E\subset\R^3$ and a $2$-surface $\Phi$ of class $\mathscr{C}'$ in $E$ with parameter domain $D$, the integral of the $2$-form $\omega_F$ over $\Phi$ is the *flux* of $F$ through $\Phi$:
$$\int_\Phi\omega_F=\int_D F(\Phi(u,v))\cdot N(u,v)\,du\,dv=\int_\Phi(F\cdot n)\,dA,$$
the integral of the normal component of $F$ (with $N$, $n$, $dA$ as in 10.46).`,
      idea: String.raw`By definition of the integral of a $2$-form, $\int_\Phi\omega_F=\int_D\big(F_1\tfrac{\partial(y,z)}{\partial(u,v)}+F_2\tfrac{\partial(z,x)}{\partial(u,v)}+F_3\tfrac{\partial(x,y)}{\partial(u,v)}\big)$, and the three Jacobians are the components of $N$. Writing $N=|N|\,n$ separates the normal component $F\cdot n$ from the area element. The orientation of $\Phi$ is built in: exchanging the roles of $u$ and $v$ reverses $N$ and the sign of the flux.`,
      caption: String.raw`The saddle $\Phi(u,v)=(u,v,0.6(u^2-v^2))$ over $D=[-1,1]^2$ is shaded by $F\cdot n$ (right; drag to rotate), with a few normals $n$ in green and $F$ in orange. The left panel shows the integrand $F(\Phi)\cdot N$ on $D$; its integral is the flux. Swap the parameters: every normal flips, the colours invert, and the flux changes sign.`,
      deps: ['pma-10.46', 'pma-10.42'],
      tags: ['vector analysis', 'flux', 'surfaces'],
      viz(v) {
        const FIELDS = {
          up: { label: '$F=e_3$', F: () => [0, 0, 1] },
          rad: { label: '$F=x\\,e_1+y\\,e_2+(z+1)\\,e_3$', F: (p) => [p[0], p[1], p[2] + 1] },
          tw: { label: '$F=-y\\,e_1+x\\,e_2+(x^2-0.4)\\,e_3$', F: (p) => [-p[1], p[0], p[0] * p[0] - 0.4] },
        };
        const fs = v.select('', Object.entries(FIELDS).map(([value, o]) => ({ value, label: o.label })), 'rad');
        const swap = v.toggle('swap $u$ and $v$', false);
        const L = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, height: 340, axes: 'box', weight: 0.65, minWidth: 220, xlabel: 'u', ylabel: 'v', title: 'integrand $F(\\Phi)\\cdot N$ on $D$' });
        const S3 = v.stage3d({ range: 1.5, height: 340, yaw: -0.6, pitch: 0.5, title: '$\\Phi(D)$ shaded by $F\\cdot n$' });
        const Phi0 = (u, w) => [u, w, 0.6 * (u * u - w * w)];
        v.legend([['red', 'positive flux density', { area: true }], ['blue', 'negative', { area: true }], ['green', 'unit normal $n$'], ['orange', '$F$']]);
        let st = null;
        v.render(() => {
          const F = FIELDS[fs.value].F, sw = swap.value;
          const P = sw ? (u, w) => Phi0(w, u) : Phi0; // the parametrisation actually used
          const dens = (u, w) => { const [a, b] = partials(P, u, w); return dot3(F(P(u, w)), cross3(a, b)); };
          const m = 2.2;
          L.heat((u, w) => dens(u, w), { range: [-m, m], cmap: 'diverging', res: 3, key: `${fs.value}${sw}` });
          L.rect(-1, -1, 1, 1, { color: 'ink', width: 1.5 });
          L.arrow(-1, -1, -0.45, -1, { color: 'orange', width: 2.6, head: 9 }); L.arrow(-1, -1, -1, -0.45, { color: 'purple', width: 2.6, head: 9 });
          L.tex('u', -0.4, -1, { color: 'orange', dy: 12, size: 13 }); L.tex('v', -1, -0.4, { color: 'purple', dx: -10, size: 13 });
          S3.surface(P, [-1, 1], [-1, 1], { nu: 24, nv: 24, alpha: 0.8, colorFn: (u, w) => { const [a, b] = partials(P, u, w); const N = cross3(a, b); return div(v, dot3(F(P(u, w)), N) / len3(N), 1.6); } });
          for (const u of [-0.6, 0, 0.6]) for (const w of [-0.6, 0, 0.6]) {
            const p = P(u, w), [a, b] = partials(P, u, w), N = cross3(a, b), n = sc3(N, 1 / len3(N)), f = F(p);
            S3.arrow(p, add3(p, sc3(n, 0.4)), { color: 'green', width: 2.2, head: 8, bias: -0.2 });
            const Lf = len3(f); if (Lf > 1e-9) S3.arrow(p, add3(p, sc3(f, 0.35 / Math.max(1, Lf))), { color: 'orange', width: 1.8, head: 7, bias: -0.2 });
          }
          // the flux two ways: Jacobian form of ω_F, and (F·n)|N|
          const I1 = quad2((u, w) => {
            const [a, b] = partials(P, u, w), f = F(P(u, w));
            const Jyz = a[1] * b[2] - a[2] * b[1], Jzx = a[2] * b[0] - a[0] * b[2], Jxy = a[0] * b[1] - a[1] * b[0];
            return f[0] * Jyz + f[1] * Jzx + f[2] * Jxy;
          }, -1, 1, -1, 1, 3, 3);
          const I2 = quad2((u, w) => { const [a, b] = partials(P, u, w), N = cross3(a, b), nN = len3(N); return dot3(F(P(u, w)), sc3(N, 1 / nN)) * nN; }, -1, 1, -1, 1, 3, 3);
          st = { I1, I2, sw };
        });
        v.readout(() => {
          if (!st) return '';
          return `$\\int_\\Phi\\omega_F=\\int_D\\Big(F_1\\frac{\\partial(y,z)}{\\partial(u,v)}+F_2\\frac{\\partial(z,x)}{\\partial(u,v)}+F_3\\frac{\\partial(x,y)}{\\partial(u,v)}\\Big)=${v.fix(st.I1, 5)}$, $\\;\\int_\\Phi(F\\cdot n)\\,dA=${v.fix(st.I2, 5)}$` + (st.sw ? ' (parameters swapped: $N$ reversed).' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 10.50
    {
      num: '10.50',
      kind: 'Theorem',
      name: "Stokes' formula",
      credit: 'Kelvin & Stokes, 1850',
      statement: String.raw`**Stokes' formula.** The flux of the curl of a vector field through a surface equals the circulation of the field around the boundary of the surface:
$$\int_\Phi(\nabla\times F)\cdot n\,dA=\int_{\partial\Phi}(F\cdot T)\,ds ,$$
valid for every vector field $F$ of class $\mathscr{C}'$ on an open set $E\subset\R^3$ and every $2$-surface $\Phi$ of class $\mathscr{C}''$ lying in $E$.`,
      idea: String.raw`Let $H=\nabla\times F$. By 10.42, $\omega_H=d\lambda_F$, so the left side is $\int_\Phi\omega_H=\int_\Phi d\lambda_F$ (10.49), which equals $\int_{\partial\Phi}\lambda_F$ by Stokes' theorem (10.33); that is the right side by 10.48. Consequently the flux of $\nabla\times F$ is the same through *every* surface with the same boundary.`,
      caption: String.raw`The caps $z=h(1-x^2-y^2)$ over the unit disc all have the unit circle (green) as boundary. Change the height $h$ (negative values make a bowl) and watch the surface, shaded by $(\nabla\times F)\cdot n$, change; the right panel plots the flux against $h$ — a flat line at the value of the circulation $\oint F\cdot T\,ds$. Reversing the orientation flips $n$ and $T$ together.`,
      deps: ['pma-10.33', 'pma-10.43', 'pma-10.46', 'pma-10.48', 'pma-10.49'],
      see: ['rca-10.35'],
      tags: ['Stokes', 'vector analysis'],
      viz(v) {
        const FIELDS = {
          f1: { label: '$F=(2z-y)\\,e_1+(x+z^2)\\,e_2+xy\\,e_3$', F: (p) => [2 * p[2] - p[1], p[0] + p[2] * p[2], p[0] * p[1]], C: (p) => [p[0] - 2 * p[2], 2 - p[1], 2] },
          f2: { label: '$F=-y^3e_1+x^3e_2+zx\\,e_3$', F: (p) => [-(p[1] ** 3), p[0] ** 3, p[2] * p[0]], C: (p) => [0, -p[2], 3 * p[0] * p[0] + 3 * p[1] * p[1]] },
        };
        const fs = v.select('', Object.entries(FIELDS).map(([value, o]) => ({ value, label: o.label })), 'f1');
        const hS = v.slider('height $h$', -1.3, 1.6, 0.9, { step: 0.01 });
        const flip = v.toggle('reverse orientation', false);
        const S3 = v.stage3d({ range: 1.6, height: 360, yaw: -0.55, pitch: 0.42, title: 'the cap $\\Phi_h$ shaded by $(\\nabla\\times F)\\cdot n$' });
        const B = v.stage({ x: [-1.3, 1.6], y: [0, 7], height: 360, axes: 'box', weight: 0.8, minWidth: 240, xlabel: 'h', title: 'flux of $\\nabla\\times F$ through $\\Phi_h$' });
        v.legend([['green', 'boundary circle $\\partial\\Phi$'], ['ink', 'normal $n$'], ['gold', '$\\int_{\\Phi_h}(\\nabla\\times F)\\cdot n\\,dA$'], ['ink', '$\\oint F\\cdot T\\,ds$', { dash: true }]]);
        let st = null, cacheKey = null, curve = null;
        const capP = (h, sg) => (r, th) => { const a = sg > 0 ? th : -th; return [r * Math.cos(a), r * Math.sin(a), h * (1 - r * r)]; };
        const fluxOf = (Fd, h, sg) => quad2((r, th) => { const P = capP(h, sg); const [a, b] = partials(P, r, th); return dot3(Fd.C(P(r, th)), cross3(a, b)); }, 0, 1, 0, 2 * Math.PI, 2, 4);
        v.render(() => {
          const Fd = FIELDS[fs.value], h = hS.value, sg = flip.value ? -1 : 1;
          const P = capP(h, sg);
          const nrm = (r, th) => { const [a, b] = partials(P, Math.max(r, 1e-3), th); const N = cross3(a, b); return sc3(N, 1 / len3(N)); };
          S3.surface(P, [0, 1], [0, 2 * Math.PI], { nu: 14, nv: 40, alpha: 0.85, colorFn: (r, th, q) => div(v, dot3(Fd.C(q), nrm(r, th)), 4) });
          for (const [r, th] of [[0, 0], [0.6, 0.3], [0.6, 2.4], [0.6, 4.5]]) { const p = P(r, th), n = nrm(r, th); S3.arrow(p, add3(p, sc3(n, 0.45)), { color: 'ink', width: 2, head: 8, bias: -0.3 }); }
          const circ = []; for (let i = 0; i <= 100; i++) { const t = (2 * Math.PI * i) / 100; circ.push([Math.cos(sg * t), Math.sin(sg * t), 0]); }
          path3Arrows(S3, circ, { color: 'green', width: 3.4, head: 12, bias: -0.1 }, [0.12, 0.45, 0.78]);
          // the two sides
          const flux = fluxOf(Fd, h, sg);
          const line = quad((t) => { const p = [Math.cos(sg * t), Math.sin(sg * t), 0], d = [-sg * Math.sin(sg * t), sg * Math.cos(sg * t), 0]; return dot3(Fd.F(p), d); }, 0, 2 * Math.PI, 8);
          const key = fs.value + sg;
          if (key !== cacheKey) { cacheKey = key; curve = v.M.linspace(-1.3, 1.6, 30).map((x) => [x, fluxOf(Fd, x, sg)]); }
          const lo = Math.min(0, line, ...curve.map((c) => c[1])), hi = Math.max(0, line, ...curve.map((c) => c[1])), pad = Math.max(0.5, (hi - lo) * 0.15);
          B.setView([-1.3, 1.6], [lo - pad, hi + pad]);
          B.hline(0, { color: 'faint', width: 1 });
          B.path(curve, { color: 'gold', width: 4 });
          B.hline(line, { color: 'ink', width: 1.6, dash: [6, 5] });
          B.vline(h, { color: 'gold', width: 1, dash: [3, 3] });
          B.dot(h, flux, { color: 'gold', r: 5.5 });
          st = { flux, line };
        });
        v.readout(() => {
          if (!st) return '';
          return `$\\int_\\Phi(\\nabla\\times F)\\cdot n\\,dA=${v.fix(st.flux, 5)}$ (surface integral with $N=\\Phi_r\\times\\Phi_\\theta$), $\\;\\int_{\\partial\\Phi}F\\cdot T\\,ds=${v.fix(st.line, 5)}$ (line integral over the circle).`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.51
    {
      num: '10.51',
      kind: 'Theorem',
      name: 'The divergence theorem',
      credit: 'Ostrogradsky, 1826',
      statement: String.raw`**The divergence theorem.** The outward flux of a vector field through the boundary of a solid equals the integral of its divergence over the solid:
$$\int_\Omega(\nabla\cdot F)\,dV=\int_{\partial\Omega}(F\cdot n)\,dA .$$
This holds for every vector field $F$ of class $\mathscr{C}'$ on an open set $E\subset\R^3$ and every closed set $\Omega\subset E$ that has a positively oriented boundary $\partial\Omega$ in the sense of 10.31.`,
      idea: String.raw`By 10.42, $d\omega_F=(\nabla\cdot F)\,dx\wedge dy\wedge dz=(\nabla\cdot F)\,dV$, where $dV$ is the volume element. Stokes' theorem (10.33) applied to the $2$-form $\omega_F$ gives $\int_\Omega d\omega_F=\int_{\partial\Omega}\omega_F$, and the right side is the outward flux by 10.49. The hypothesis that $F$ is $\mathscr{C}'$ on a neighbourhood of all of $\Omega$ is essential: a singularity inside $\Omega$ can carry flux that no divergence accounts for.`,
      caption: String.raw`The bumpy closed surface $\rho=1+a\sin^2\theta\cos3\varphi$ (shifted by the offset) is shaded by the outward normal component $F\cdot n$. The readout computes the flux as a surface integral and $\int_\Omega\nabla\cdot F$ as a triple integral in spherical coordinates. The right panel plots both against the offset. For the inverse-square field ($\nabla\cdot F=0$ away from $0$) the flux is $4\pi$ while the origin lies inside — $F$ is not $\mathscr{C}'$ on $\Omega$ — and drops to $0$ once it is outside.`,
      deps: ['pma-10.33', 'pma-10.42', 'pma-10.49', 'pma-10.31'],
      tags: ['divergence theorem', 'vector analysis'],
      viz(v) {
        const FIELDS = {
          cub: { label: '$F=x^3e_1+y^3e_2+z^3e_3$', F: (p) => [p[0] ** 3, p[1] ** 3, p[2] ** 3], D: (p) => 3 * (p[0] * p[0] + p[1] * p[1] + p[2] * p[2]), m: 3 },
          mix: { label: '$F=xy\\,e_1+yz\\,e_2+(zx+z)\\,e_3$', F: (p) => [p[0] * p[1], p[1] * p[2], p[2] * p[0] + p[2]], D: (p) => p[1] + p[2] + p[0] + 1, m: 2 },
          pt: { label: '$F=x/|x|^3$ (singular at $0$)', F: (p) => { const r = len3(p); return sc3(p, 1 / (r * r * r)); }, D: () => 0, m: 1.5 },
        };
        const fs = v.select('', Object.entries(FIELDS).map(([value, o]) => ({ value, label: o.label })), 'mix');
        const aS = v.slider('bumpiness $a$', 0, 0.45, 0.3, { step: 0.01 });
        const oS = v.slider('offset', 0, 2.2, 0.35, { step: 0.01 });
        const S3 = v.stage3d({ range: 2.0, height: 360, yaw: -0.5, pitch: 0.35, title: '$\\partial\\Omega$ shaded by the outward $F\\cdot n$' });
        const B = v.stage({ x: [0, 2.2], y: [-1, 1], height: 360, axes: 'box', weight: 0.8, minWidth: 240, title: 'both sides against the offset of $\\Omega$' });
        v.legend([['gold', 'flux $\\int_{\\partial\\Omega}F\\cdot n\\,dA$'], ['purple', '$\\int_\\Omega\\nabla\\cdot F\\,dV$', { dash: true }], ['red', 'outward', { area: true }], ['blue', 'inward', { area: true }]]);
        const rho = (a, th, ph) => 1 + a * Math.sin(th) ** 2 * Math.cos(3 * ph);
        const both = (Fd, a, o) => {
          const c = [o, 0, 0];
          const P = (th, ph) => { const r = rho(a, th, ph); return add3(c, [r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th)]); };
          const flux = quad2((th, ph) => { const [A, Bv] = partials(P, th, ph); return dot3(Fd.F(P(th, ph)), cross3(A, Bv)); }, 0, Math.PI, 0, 2 * Math.PI, 3, 5);
          const vol = quad2((th, ph) => { const R = rho(a, th, ph), s = Math.sin(th); return quad((r) => Fd.D(add3(c, [r * s * Math.cos(ph), r * s * Math.sin(ph), r * Math.cos(th)])) * r * r * s, 0, R, 1); }, 0, Math.PI, 0, 2 * Math.PI, 2, 3);
          return { flux, vol, P, c };
        };
        let st = null, ck = null, curves = null;
        v.render(() => {
          const Fd = FIELDS[fs.value], a = aS.value, o = oS.value;
          const { flux, vol, P, c } = both(Fd, a, o);
          const nrm = (th, ph) => { const [A, Bv] = partials(P, Math.min(Math.max(th, 1e-3), Math.PI - 1e-3), ph); const N = cross3(A, Bv); return sc3(N, 1 / len3(N)); };
          S3.surface(P, [0, Math.PI], [0, 2 * Math.PI], { nu: 22, nv: 40, alpha: 0.62, colorFn: (th, ph, q) => div(v, dot3(Fd.F(q), nrm(th, ph)), Fd.m) });
          for (const [th, ph] of [[0.3, 0.4], [0.9, 0.3], [0.9, 2.4], [0.9, 4.5], [1.6, 1.3], [1.6, 3.4], [1.6, 5.5], [2.3, 0.3], [2.3, 2.4], [2.3, 4.5], [2.85, 1.0]]) {
            const p = P(th, ph), f = Fd.F(p), L = len3(f);
            if (L > 1e-9) S3.arrow(p, add3(p, sc3(f, 0.5 * Math.min(1, L) / L)), { color: 'orange', width: 2, head: 8, bias: -0.3 });
          }
          if (fs.value === 'pt') S3.dot([0, 0, 0], { color: 'red', r: 6, bias: -0.5 });
          S3.dot(c, { color: 'ink', r: 3 });
          const key = `${fs.value}|${a}`;
          if (key !== ck) { ck = key; curves = v.M.linspace(0, 2.2, 23).map((x) => { const r = both(Fd, a, x); return [x, r.flux, r.vol]; }); }
          const ys = curves.flatMap((q) => [q[1], q[2]]).concat([flux, vol]);
          const lo = Math.min(0, ...ys), hi = Math.max(0, ...ys), pad = Math.max(0.5, (hi - lo) * 0.12);
          B.setView([0, 2.2], [lo - pad, hi + pad]);
          B.hline(0, { color: 'faint', width: 1 });
          B.path(curves.map((q) => [q[0], q[1]]), { color: 'gold', width: 3 });
          B.path(curves.map((q) => [q[0], q[2]]), { color: 'purple', width: 2, dash: [6, 4] });
          B.vline(o, { color: 'muted', width: 1, dash: [3, 3] });
          B.dot(o, flux, { color: 'gold', r: 5.5 }); B.dot(o, vol, { color: 'purple', r: 4 });
          if (fs.value === 'pt') B.hline(4 * Math.PI, { color: 'red', width: 1, dash: [3, 4], alpha: 0.7 });
          const inside = rho(a, Math.PI / 2, Math.PI) > o;
          st = { flux, vol, pt: fs.value === 'pt', inside };
        });
        v.readout(() => {
          if (!st) return '';
          const { flux, vol, pt, inside } = st;
          const s = `$\\int_{\\partial\\Omega}F\\cdot n\\,dA=${v.fix(flux, 4)}$, $\\;\\int_\\Omega(\\nabla\\cdot F)\\,dV=${v.fix(vol, 4)}$`;
          if (!pt) return s + ' — equal, as the theorem asserts.';
          return s + (inside ? ' — the origin is inside $\\Omega$, where $F$ is not $\\mathscr{C}\'$: the flux is $4\\pi$, the hypothesis fails.' : ' — the origin is outside, $F$ is $\\mathscr{C}\'$ near $\\Omega$, and both sides vanish.');
        });
      },
    },
  ],
};
