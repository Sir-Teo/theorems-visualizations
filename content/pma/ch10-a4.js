// Rudin, Principles of Mathematical Analysis — Chapter 10 (part 4: 10.18–10.21)
// The exterior derivative, the product rule and d² = 0, pullbacks.

function divRGB(v, pos = 'blue', neg = 'red', gain = 0.8) {
  const P = v.rgb('panel'), A = v.rgb(pos), B = v.rgb(neg);
  return (t) => {
    if (!isFinite(t)) return null;
    const w = Math.pow(Math.min(1, Math.abs(t)), 0.75) * gain, C = t >= 0 ? A : B;
    return [P[0] + (C[0] - P[0]) * w, P[1] + (C[1] - P[1]) * w, P[2] + (C[2] - P[2]) * w];
  };
}
const themeKey = (v) => v.color('panel') + v.color('blue');
/** Raster of level lines {f = k·step} for each entry {f, step, color}; about 1.3 px wide. */
function levelLines(v, S, list, key, id = 'lv') {
  const cols = list.map((L) => v.rgb(L.color));
  S.raster((x, y) => {
    const px = (S.bounds.x[1] - S.bounds.x[0]) / S.width;
    for (let k = 0; k < list.length; k++) {
      const { f, step } = list[k], z = f(x, y);
      if (!isFinite(z)) continue;
      const gx = (f(x + px, y) - z) / px, gy = (f(x, y + px) - z) / px, g = Math.hypot(gx, gy) / step * px;
      const d = Math.abs(z / step - Math.round(z / step));
      if (d < 0.6 * g) return [cols[k][0], cols[k][1], cols[k][2], 225];
    }
    return null;
  }, { key: key + themeKey(v), res: 1, id });
}
const D1 = (f, h = 1e-4) => (x, y) => (f(x + h, y) - f(x - h, y)) / (2 * h);
const D2 = (f, h = 1e-4) => (x, y) => (f(x, y + h) - f(x, y - h)) / (2 * h);

export default {
  collection: 'pma',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.18
    {
      num: '10.18',
      kind: 'Definition',
      name: 'The exterior derivative d',
      credit: 'É. Cartan, 1899',
      statement: String.raw`For a $0$-form $f\in\mathscr C'(E)$ put
$$df=\sum_{i=1}^n(D_if)(\mathbf x)\,dx_i .$$
If $\omega=\sum_Ib_I(\mathbf x)\,dx_I$ is the standard presentation of a $k$-form of class $\mathscr C'$ in $E$, its **exterior derivative** is the $(k+1)$-form
$$d\omega=\sum_I(db_I)\wedge dx_I .$$
For example, in $\R^2$, $d(P\,dx+Q\,dy)=(D_1Q-D_2P)\,dx\wedge dy$.`,
      idea: String.raw`For a $0$-form the chain rule gives, along any $\mathscr C'$ curve $\gamma$ from $\mathbf p$ to $\mathbf q$, $\int_\gamma df=\int_0^1(f\circ\gamma)'(t)\,dt=f(\mathbf q)-f(\mathbf p)$ (Example 10.19): $df$ integrates to the change of $f$. Since $\int_\gamma x\,dy$ over a closed curve is an area and not $0$, the form $x\,dy$ is not $df$ for any $f$. For a $1$-form in the plane, $d\omega$ measures circulation per unit area around small loops — a first glimpse of Stokes' theorem (10.33).`,
      caption: String.raw`**0-form:** the shading and thin contours show $f$, the arrows the coefficients $(D_1f,D_2f)$ of $df$. Drag the endpoints and the control point of $\gamma$; on the right the running integral $\int_0^t df(\gamma'(s))\,ds$ (blue) lies exactly on $f(\gamma(t))-f(\gamma(0))$ (dashed green). **1-form:** the shading is the coefficient $D_1Q-D_2P$ of $d\omega$ (blue $>0$, red $<0$). Drag the small square: its circulation $\oint\omega$ divided by its area (right) tends to that coefficient at the centre as the square shrinks.`,
      deps: ['pma-10.14', 'pma-10.17', 'pma-9.17'],
      see: ['pma-10.33'],
      tags: ['exterior derivative', 'differential forms'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 0, label: '$d$ of a $0$-form' }, { value: 1, label: '$d$ of a $1$-form' }], 0);
        const side = v.slider('side of the square', 0.05, 1.6, 0.9, { step: 0.01 });
        const L = v.stage({ x: [-2.2, 2.2], y: [-1.8, 1.8], equal: true, height: 340, title: 'x' });
        const R = v.stage({ x: [-0.02, 1.02], y: [-1, 1], height: 340, axes: 'box', title: 'x' });
        const f = (x, y) => Math.sin(1.3 * x) * Math.cos(y) + 0.25 * x * y;
        const fx = (x, y) => 1.3 * Math.cos(1.3 * x) * Math.cos(y) + 0.25 * y, fy = (x, y) => -Math.sin(1.3 * x) * Math.sin(y) + 0.25 * x;
        const P = (x, y) => 0.5 * y * y, Q = (x, y) => Math.sin(1.5 * x);
        const curl = (x, y) => 1.5 * Math.cos(1.5 * x) - y;
        const g0 = L.handle(-1.7, -1.1, { color: 'ink', label: 'p', labelPos: 'sw' });
        const g1 = L.handle(-0.2, 1.7, { color: 'gray', r: 5 });
        const g2 = L.handle(1.6, -0.6, { color: 'ink', label: 'q' });
        const c = L.handle(0.2, 0.3, { color: 'gold', label: 'c' });
        let st = {};
        v.render(() => {
          const m = +mode.value;
          side.el.hidden = m === 0; g0.visible = g1.visible = g2.visible = m === 0; c.visible = m === 1;
          if (m === 0) {
            L.setTitle('$f$ and the coefficients of $df$; a curve $\\gamma$ from $\\mathbf p$ to $\\mathbf q$');
            R.setTitle('$\\int_0^t df(\\gamma\'(s))\\,ds$ versus $f(\\gamma(t))-f(\\gamma(0))$');
            const col = divRGB(v, 'teal', 'pink', 0.55);
            L.raster((x, y) => col(f(x, y) / 1.4), { key: 'f' + themeKey(v), res: 3 });
            levelLines(v, L, [{ f, step: 0.25, color: 'faint' }], 'fl');
            L.field((x, y) => [fx(x, y), fy(x, y)], { spacing: 38, color: 'ink', alpha: 0.5 });
            const A = [g0.x, g0.y], B = [g1.x, g1.y], C = [g2.x, g2.y];
            const gam = (t) => [0, 1].map((i) => (1 - t) * (1 - t) * A[i] + 2 * (1 - t) * t * B[i] + t * t * C[i]);
            const dg = (t) => [0, 1].map((i) => 2 * (1 - t) * (B[i] - A[i]) + 2 * t * (C[i] - B[i]));
            L.path([A, B, C], { color: 'faint', width: 1, dash: [3, 4] });
            L.curve(gam, 0, 1, { color: 'gold', width: 3.2, n: 200 });
            for (const s of [0.3, 0.7]) { const a = gam(s), b = gam(s + 0.01); L.arrow(a[0], a[1], b[0], b[1], { color: 'gold', head: 11, width: 0.1 }); }
            const integrand = (t) => { const p = gam(t), d = dg(t); return fx(p[0], p[1]) * d[0] + fy(p[0], p[1]) * d[1]; };
            const ts = M.linspace(0, 1, 201), run = [0];
            for (let i = 1; i < ts.length; i++) run.push(run[i - 1] + M.integrate(integrand, ts[i - 1], ts[i], 6));
            const diff = ts.map((t) => f(...gam(t)) - f(...A));
            const lo = Math.min(0, ...run, ...diff), hi = Math.max(0, ...run, ...diff), pad = 0.15 * (hi - lo || 1);
            R.setView([-0.02, 1.02], [lo - pad, hi + pad]);
            R.path(ts.map((t, i) => [t, run[i]]), { color: 'blue', width: 4, alpha: 0.6 });
            R.path(ts.map((t, i) => [t, diff[i]]), { color: 'green', width: 2, dash: [6, 4] });
            R.hline(0, { color: 'faint', width: 1 });
            R.dot(1, run[200], { color: 'blue', r: 5, label: '∫γ df', labelPos: 'w' });
            st = { m, I: run[200], d: f(...C) - f(...A) };
            v.legend([['teal', '$f>0$', { area: true }], ['pink', '$f<0$', { area: true }], ['ink', 'coefficients $(D_1f,D_2f)$ of $df$'], ['blue', 'running $\\int df$'], ['green', '$f(\\gamma(t))-f(\\mathbf p)$', { dash: true }]]);
          } else {
            L.setTitle('$\\omega=\\tfrac12y^2\\,dx+\\sin(1.5x)\\,dy$, shaded by the coefficient of $d\\omega$');
            R.setTitle('circulation $\\oint_{\\partial\\square}\\omega$ divided by the area, against the side');
            const col = divRGB(v, 'blue', 'red', 0.6);
            L.raster((x, y) => col(curl(x, y) / 3), { key: 'c' + themeKey(v), res: 3 });
            L.field((x, y) => [P(x, y), Q(x, y)], { spacing: 36, color: 'ink', alpha: 0.5 });
            const s = side.value, x0 = c.x - s / 2, y0 = c.y - s / 2;
            const circ = (h) => {
              const a = c.x - h / 2, b = c.y - h / 2;
              return M.integrate((t) => P(t, b), a, a + h, 40) + M.integrate((t) => Q(a + h, t), b, b + h, 40) - M.integrate((t) => P(t, b + h), a, a + h, 40) - M.integrate((t) => Q(a, t), b, b + h, 40);
            };
            L.rect(x0, y0, x0 + s, y0 + s, { color: 'gold', width: 2.6, fill: 'gold', fillAlpha: 0.12 });
            const corners = [[x0, y0], [x0 + s, y0], [x0 + s, y0 + s], [x0, y0 + s]];
            for (let k = 0; k < 4; k++) { const A = corners[k], B = corners[(k + 1) % 4], m0 = M.vlerp(A, B, 0.4), m1 = M.vlerp(A, B, 0.6); L.arrow(m0[0], m0[1], m1[0], m1[1], { color: 'gold', width: 2.6, head: 9 }); }
            const hs = M.linspace(0.04, 1.6, 80), rs = hs.map((h) => circ(h) / (h * h)), k0 = curl(c.x, c.y);
            const lo = Math.min(...rs, k0), hi = Math.max(...rs, k0), pad = 0.2 * (hi - lo || 1);
            R.setView([0, 1.65], [lo - pad, hi + pad]);
            R.hline(k0, { color: 'green', dash: [6, 4], width: 1.6 });
            R.text(`(D₁Q − D₂P)(c) = ${v.fix(k0, 3)}`, 1.6, k0, { color: 'green', align: 'right', baseline: 'bottom', dy: -4, size: 11.5 });
            R.path(hs.map((h, i) => [h, rs[i]]), { color: 'gold', width: 2.4 });
            const now = circ(s) / (s * s);
            R.dot(s, now, { color: 'gold', r: 5 });
            st = { m, k0, now, s };
            v.legend([['blue', '$D_1Q-D_2P>0$', { area: true }], ['red', '$D_1Q-D_2P<0$', { area: true }], ['ink', 'coefficients $(P,Q)$ of $\\omega$'], ['gold', 'circulation / area'], ['green', 'coefficient of $d\\omega$ at the centre', { dash: true }]]);
          }
        });
        v.readout(() => (st.m === 0
          ? `$\\int_\\gamma df=${v.fix(st.I, 5)}$ and $f(\\mathbf q)-f(\\mathbf p)=${v.fix(st.d, 5)}$ — the same for every curve from $\\mathbf p$ to $\\mathbf q$.`
          : `Side $${v.fix(st.s, 2)}$: $\\;\\frac{1}{\\text{area}}\\oint\\omega=${v.fix(st.now, 4)}$; $\\;d\\omega=(D_1Q-D_2P)\\,dx\\wedge dy$ has coefficient $${v.fix(st.k0, 4)}$ at the centre. (Why the limit holds is Stokes' theorem, 10.33.)`));
      },
    },
    // ------------------------------------------------------------------ 10.20
    {
      num: '10.20',
      kind: 'Theorem',
      name: 'Product rule for d, and d² = 0',
      statement: String.raw`Let $E\subset\R^n$ be open.
(a) If $\omega$ is a $k$-form and $\lambda$ an $m$-form, both of class $\mathscr C'$ in $E$, then
$$d(\omega\wedge\lambda)=(d\omega)\wedge\lambda+(-1)^k\,\omega\wedge d\lambda .$$
(b) If $\omega$ is of class $\mathscr C''$ in $E$, then $d(d\omega)=0$.`,
      idea: String.raw`(a) By linearity take $\omega=f\,dx_I$, $\lambda=g\,dx_J$. Then $d(\omega\wedge\lambda)=d(fg)\wedge dx_I\wedge dx_J=(g\,df+f\,dg)\wedge dx_I\wedge dx_J$, and moving the $1$-form $dg$ past the $k$ differentials of $dx_I$ costs $(-1)^k$ (10.16). (b) For a $0$-form, $d(df)=\sum_{i,j}(D_{ij}f)\,dx_i\wedge dx_j$; the mixed partials are symmetric for $f\in\mathscr C''$ (9.41) while $dx_i\wedge dx_j$ is antisymmetric, so the terms cancel in pairs. For $\omega=f\,dx_I$, (a) gives $d\omega=df\wedge dx_I$ and $d(d\omega)=d(df)\wedge dx_I=0$, since $d(dx_I)=0$.`,
      caption: String.raw`Three panels compare the coefficient functions (blue $>0$, red $<0$), all computed by numerical differentiation of the forms themselves. In (a) the left panel equals the middle one plus or minus the right one, with the sign $(-1)^k$; for $k=1$ in $\R^3$ (the slice $z=0$ is shown) the minus sign is essential. In (b) the terms of $d(d\,\cdot)$ cancel and the sum is identically $0$ up to rounding; in $\R^3$, $\omega=A_1dx+A_2dy+A_3dz$ has $d\omega=c_1\,dy\wedge dz+c_2\,dz\wedge dx+c_3\,dx\wedge dy$ with $\mathbf c=\operatorname{curl}\mathbf A$. Drag $\mathbf p$ to read the numbers.`,
      deps: ['pma-10.18', 'pma-10.17', 'pma-10.16', 'pma-9.41a'],
      tags: ['exterior derivative', 'differential forms'],
      viz(v) {
        const M = v.M;
        // ---- data
        const f = (x, y, z = 0) => Math.exp(-0.4 * (x * x + y * y)) * (1 + 0.6 * x) + 0.2 * y * z;
        const lamP = (x, y) => Math.sin(1.4 * y) + 0.3 * x, lamQ = (x, y) => 0.6 * x * y - Math.cos(x);
        // 3D vector fields A, B (1-forms A·dx, B·dx) and their curls, evaluated numerically
        const A = (x, y, z) => [Math.sin(1.3 * y) + z * x * Math.cos(y), z * Math.sin(1.5 * x * y) + 0.5 * Math.cos(x), 0.6 * x * y * y + z * Math.cos(x - y)];
        const Bf = (x, y, z) => [y * y * 0.4, Math.sin(1.2 * x) + 0.2 * z, x - 0.5 * y * z];
        const h3 = 1e-4;
        const pd = (F, i, k, x, y, z) => { const e = [0, 0, 0]; e[k] = h3; return (F(x + e[0], y + e[1], z + e[2])[i] - F(x - e[0], y - e[1], z - e[2])[i]) / (2 * h3); };
        const curlF = (F, x, y, z) => [pd(F, 2, 1, x, y, z) - pd(F, 1, 2, x, y, z), pd(F, 0, 2, x, y, z) - pd(F, 2, 0, x, y, z), pd(F, 1, 0, x, y, z) - pd(F, 0, 1, x, y, z)];
        const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        const dotp = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        const divF = (F, x, y, z) => pd(F, 0, 0, x, y, z) + pd(F, 1, 1, x, y, z) + pd(F, 2, 2, x, y, z);
        const cA = (k) => (s, t, u) => curlF(A, s, t, u)[k];
        const MODES = {
          a0: { label: '(a) $k=0$ in $\\R^2$', kind: 'a', sign: 1,
            T: ['$d(f\\lambda)$', '$=\\;df\\wedge\\lambda$', '$+\\;f\\,d\\lambda$'],
            F: [(x, y) => D1((s, t) => f(s, t) * lamQ(s, t))(x, y) - D2((s, t) => f(s, t) * lamP(s, t))(x, y),
              (x, y) => D1(f)(x, y) * lamQ(x, y) - D2(f)(x, y) * lamP(x, y),
              (x, y) => f(x, y) * (D1(lamQ)(x, y) - D2(lamP)(x, y))] },
          a1: { label: '(a) $k=1$ in $\\R^3$', kind: 'a', sign: -1,
            T: ['$d(\\omega\\wedge\\lambda)$', '$=\\;d\\omega\\wedge\\lambda$', '$-\\;\\omega\\wedge d\\lambda$'],
            F: [(x, y) => divF((s, t, u) => cross(A(s, t, u), Bf(s, t, u)), x, y, 0),
              (x, y) => dotp(curlF(A, x, y, 0), Bf(x, y, 0)),
              (x, y) => dotp(A(x, y, 0), curlF(Bf, x, y, 0))] },
          b0: { label: '(b) $d(df)$ in $\\R^2$', kind: 'b',
            T: ['$D_1(D_2f)$', '$-\\;D_2(D_1f)$', '$=$ coefficient of $d(df)$'],
            F: [(x, y) => D1(D2(f, 1e-3), 1e-3)(x, y), (x, y) => D2(D1(f, 1e-3), 1e-3)(x, y), (x, y) => D1(D2(f, 1e-3), 1e-3)(x, y) - D2(D1(f, 1e-3), 1e-3)(x, y)] },
          b1: { label: '(b) $d(d\\omega)$ in $\\R^3$', kind: 'b',
            T: ['$D_1c_1+D_2c_2$', '$+\\;D_3c_3$', '$=$ coefficient of $d(d\\omega)$'],
            F: [(x, y) => pd((s, t, u) => [cA(0)(s, t, u)], 0, 0, x, y, 0) + pd((s, t, u) => [cA(1)(s, t, u)], 0, 1, x, y, 0),
              (x, y) => pd((s, t, u) => [cA(2)(s, t, u)], 0, 2, x, y, 0),
              (x, y) => divF((s, t, u) => curlF(A, s, t, u), x, y, 0)] },
        };
        const which = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'a0');
        const S = [0, 1, 2].map(() => v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 260, minWidth: 250, title: 'x' }));
        const p = S[0].handle(0.5, -0.4, { color: 'gold', label: 'p' });
        let st = {}, cache = {};
        v.legend([['blue', 'coefficient $>0$', { area: true }], ['red', 'coefficient $<0$', { area: true }], ['gold', 'the point $\\mathbf p$', { dot: true }]]);
        v.render(() => {
          const Mo = MODES[which.value];
          if (!cache[which.value]) {
            let mx = 1e-9, err = 0;
            for (const x of M.linspace(-1.5, 1.5, 25)) for (const y of M.linspace(-1.5, 1.5, 25)) {
              const a = Mo.F[0](x, y), b = Mo.F[1](x, y), c = Mo.F[2](x, y);
              mx = Math.max(mx, Math.abs(a), Math.abs(b), Math.abs(c));
              err = Math.max(err, Math.abs(Mo.kind === 'a' ? a - (b + Mo.sign * c) : c));
            }
            cache[which.value] = { mx, err };
          }
          const { mx, err } = cache[which.value];
          const col = divRGB(v, 'blue', 'red', 0.8);
          S.forEach((Sk, k) => {
            Sk.setTitle(Mo.T[k]);
            Sk.raster((x, y) => col(Mo.F[k](x, y) / mx), { key: which.value + k + themeKey(v), res: 3 });
            if (k) Sk.dot(p.x, p.y, { color: 'gold', r: 5 });
          });
          const vals = Mo.F.map((F) => F(p.x, p.y));
          S[2].corner(Mo.kind === 'a' ? `max over grid |left − right| = ${err.toExponential(1)}` : `max over grid |coefficient| = ${err.toExponential(1)}`, 'bl', { color: 'green', weight: 600, size: 11 });
          st = { vals, mode: which.value };
        });
        v.readout(() => {
          const [a, b, c] = st.vals, F = (x) => v.fix(x, 5);
          if (st.mode === 'a0') return `At $\\mathbf p$: $\\;d(f\\lambda)=${F(a)}\\,dx\\wedge dy$, $\\;df\\wedge\\lambda+f\\,d\\lambda=(${F(b)}${c < 0 ? '-' : '+'}${F(Math.abs(c))})\\,dx\\wedge dy=${F(b + c)}\\,dx\\wedge dy$.`;
          if (st.mode === 'a1') return `At $\\mathbf p$ (with $z=0$), coefficients of $dx\\wedge dy\\wedge dz$: $\\;d(\\omega\\wedge\\lambda)=${F(a)}$, $\\;d\\omega\\wedge\\lambda-\\omega\\wedge d\\lambda=${F(b)}-(${F(c)})=${F(b - c)}$; with a $+$ sign it would be $${F(b + c)}$.`;
          if (st.mode === 'b0') return `At $\\mathbf p$: $\\;D_1D_2f=${F(a)}$, $\\;D_2D_1f=${F(b)}$, so $d(df)=(D_1D_2f-D_2D_1f)\\,dx\\wedge dy=${v.fix(c, 7)}\\,dx\\wedge dy\\approx0$.`;
          return `At $\\mathbf p$ ($z=0$): $\\;D_1c_1+D_2c_2=${F(a)}$, $\\;D_3c_3=${F(b)}$, so $d(d\\omega)$ has coefficient $${v.fix(c, 7)}\\approx0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.21
    {
      num: '10.21',
      kind: 'Definition',
      name: 'Change of variables in a form (pullback)',
      statement: String.raw`Let $E\subset\R^n$ be open, $T$ a $\mathscr C'$-mapping of $E$ into an open set $V\subset\R^m$ with components $t_1,\dots,t_m$ (so $y_i=t_i(\mathbf x)$), and let $\omega=\sum_Ib_I(\mathbf y)\,dy_I$ be a $k$-form in $V$ in standard presentation. Each
$$dt_i=\sum_{j=1}^n(D_jt_i)(\mathbf x)\,dx_j$$
is a $1$-form in $E$, and $T$ carries $\omega$ to the $k$-form in $E$
$$\omega_T=\sum_Ib_I(T(\mathbf x))\,dt_{i_1}\wedge\cdots\wedge dt_{i_k}.$$
In words: substitute $\mathbf y=T(\mathbf x)$ in the coefficients and replace each $dy_i$ by $dt_i$.`,
      idea: String.raw`At a single point a $1$-form is a row vector (covector), and $\omega_T(\mathbf x)$ is the row $\big(b_1(T\mathbf x),\dots,b_m(T\mathbf x)\big)$ times the Jacobian matrix $T'(\mathbf x)$. So $\omega_T$ applied to a vector $\mathbf w$ at $\mathbf x$ equals $\omega$ applied to the pushed-forward vector $T'(\mathbf x)\mathbf w$ at $T(\mathbf x)$. In particular $dt_i=(dy_i)_T$ is the differential of the component $t_i$, perpendicular to the level curves $t_i=$ const — the preimages of the coordinate lines.`,
      caption: String.raw`Right: the target $V$ with its coordinate lines $y_1=$ const (blue), $y_2=$ const (orange) and the covector $\omega(T\mathbf p)$ (green). Left: the domain $E$, where the same lines pull back to the level curves of $t_1$ and $t_2$, and the pulled-back covector $\omega_T(\mathbf p)=\omega(T\mathbf p)\,T'(\mathbf p)$. Drag $\mathbf p$ and the tip of the tangent vector $\mathbf w$ (gold); its image $T'(\mathbf p)\mathbf w$ is drawn on the right, and the readout checks $\omega_T(\mathbf p)\mathbf w=\omega(T\mathbf p)\,T'(\mathbf p)\mathbf w$. With $\omega=dy_1$ the green covector on the left is $dt_1$, normal to the blue curve through $\mathbf p$.`,
      deps: ['pma-10.11', 'pma-10.18', 'pma-10.17', 'pma-9.17'],
      tags: ['pullback', 'differential forms', 'change of variables'],
      viz(v) {
        const M = v.M;
        const T = (x, y) => [x + 0.3 * y * y - 0.1, y + 0.35 * Math.sin(1.6 * x)];
        const W = {
          dy1: { label: '$dy_1$', b: () => [1, 0] },
          mix: { label: '$y_2\\,dy_1+dy_2$', b: (y) => [y[1], 1] },
          rot: { label: '$-y_2\\,dy_1+y_1\\,dy_2$', b: (y) => [-y[1], y[0]] },
        };
        const which = v.select('$\\omega$', Object.entries(W).map(([value, o]) => ({ value, label: o.label })), 'mix');
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 340, title: 'domain $E$: level curves of $t_1,t_2$ and $\\omega_T(\\mathbf p)$' });
        const R = v.stage({ x: [-1.7, 1.9], y: [-1.9, 1.9], equal: true, height: 340, title: 'target $V$: coordinate lines and $\\omega(T\\mathbf p)$' });
        const p = L.handle(0.35, 0.2, { color: 'ink', label: 'p', labelPos: 'sw' });
        const wt = L.handle(0.95, 0.55, { color: 'gold', r: 6 });
        let prev = [p.x, p.y];
        p.onDrag = () => { wt.x += p.x - prev[0]; wt.y += p.y - prev[1]; prev = [p.x, p.y]; };
        let st = {};
        v.legend([['blue', '$y_1=$ const and its preimage $t_1=$ const'], ['orange', '$y_2=$ const and $t_2=$ const'], ['green', 'covectors $\\omega$, $\\omega_T$'], ['gold', 'vectors $\\mathbf w$, $T\'(\\mathbf p)\\mathbf w$']]);
        v.render(() => {
          prev = [p.x, p.y];
          const O = W[which.value];
          levelLines(v, L, [{ f: (x, y) => T(x, y)[0], step: 0.25, color: 'blue' }, { f: (x, y) => T(x, y)[1], step: 0.25, color: 'orange' }], 'E');
          for (let k = -12; k <= 12; k++) { R.vline(k * 0.25, { color: 'blue', width: 1, alpha: 0.7 }); R.hline(k * 0.25, { color: 'orange', width: 1, alpha: 0.7 }); }
          // image of the domain square
          const bd = []; const sq = [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]];
          for (let k = 0; k < 4; k++) for (let t = 0; t < 1; t += 0.02) { const a = M.vlerp(sq[k], sq[(k + 1) % 4], t); bd.push(T(a[0], a[1])); }
          R.poly(bd, { color: 'ink', width: 1.8, fill: 'ink', fillAlpha: 0.04 });
          L.rect(-1.5, -1.5, 1.5, 1.5, { color: 'ink', width: 1.8 });
          const J = [[D1((x, y) => T(x, y)[0])(p.x, p.y), D2((x, y) => T(x, y)[0])(p.x, p.y)], [D1((x, y) => T(x, y)[1])(p.x, p.y), D2((x, y) => T(x, y)[1])(p.x, p.y)]];
          const q = T(p.x, p.y), b = O.b(q);
          const pb = [b[0] * J[0][0] + b[1] * J[1][0], b[0] * J[0][1] + b[1] * J[1][1]];
          const w = [wt.x - p.x, wt.y - p.y], Tw = [J[0][0] * w[0] + J[0][1] * w[1], J[1][0] * w[0] + J[1][1] * w[1]];
          const sc = 0.45;
          R.arrow(q[0], q[1], q[0] + b[0] * sc, q[1] + b[1] * sc, { color: 'green', width: 3, head: 10 });
          R.arrow(q[0], q[1], q[0] + Tw[0], q[1] + Tw[1], { color: 'gold', width: 2.6, head: 9 });
          R.dot(q[0], q[1], { color: 'ink', r: 5, label: 'Tp', labelPos: 'sw' });
          L.arrow(p.x, p.y, p.x + pb[0] * sc, p.y + pb[1] * sc, { color: 'green', width: 3, head: 10 });
          L.arrow(p.x, p.y, wt.x, wt.y, { color: 'gold', width: 2.6, head: 9 });
          L.tex('\\omega_T(\\mathbf p)', p.x + pb[0] * sc, p.y + pb[1] * sc, { color: 'green', align: 'left', dx: 6, dy: -8, size: 14 });
          R.tex('\\omega(T\\mathbf p)', q[0] + b[0] * sc, q[1] + b[1] * sc, { color: 'green', align: 'left', dx: 6, dy: -8, size: 14 });
          st = { J, b, pb, w, Tw };
        });
        v.readout(() => {
          const { J, b, pb, w, Tw } = st, f = (x) => v.fix(x, 3);
          return `$\\omega_T(\\mathbf p)=(${f(b[0])},\\,${f(b[1])})\\begin{pmatrix}${f(J[0][0])}&${f(J[0][1])}\\\\ ${f(J[1][0])}&${f(J[1][1])}\\end{pmatrix}=(${f(pb[0])},\\,${f(pb[1])})$. $\\quad\\omega_T(\\mathbf p)\\mathbf w=${v.fix(pb[0] * w[0] + pb[1] * w[1], 4)}$, $\\;\\omega(T\\mathbf p)\\,T'(\\mathbf p)\\mathbf w=${v.fix(b[0] * Tw[0] + b[1] * Tw[1], 4)}$.`;
        });
      },
    },
  ],
};
