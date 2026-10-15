// Rudin, Real and Complex Analysis — Chapter 4, part 2: closest points, projections,
// the Riesz representation theorem, orthonormal sets (4.10–4.14).

const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
/** TeX scientific notation for small numbers */
const sci = (x) => { if (x === 0) return '0'; if (Math.abs(x) >= 1e-3) return x.toFixed(4); const e = Math.floor(Math.log10(Math.abs(x))); return `${(x / 10 ** e).toFixed(1)}\\times10^{${e}}`; };
function rightAngle(S, p, u, w, size, st = {}) {
  const a = [p[0] + u[0] * size, p[1] + u[1] * size];
  const b = [p[0] + (u[0] + w[0]) * size, p[1] + (u[1] + w[1]) * size];
  const c = [p[0] + w[0] * size, p[1] + w[1] * size];
  S.path([a, b, c], { color: 'muted', width: 1.2, ...st });
}
/** Composite Simpson grid on [a,b] with n panels: {t, w} so that ∫f ≈ Σ w_i f(t_i). */
function simpsonGrid(a, b, n) {
  const t = [], w = [], h = (b - a) / n;
  for (let i = 0; i <= n; i++) { t.push(a + i * h); w.push((i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * h / 3); }
  return { t, w };
}
/** Orthonormal Legendre polynomials on [-1,1] evaluated on the grid: P[k][i]. */
function legendreTable(t, K) {
  const raw = [t.map(() => 1), t.slice()];
  for (let k = 1; k < K; k++) raw.push(t.map((s, i) => ((2 * k + 1) * s * raw[k][i] - k * raw[k - 1][i]) / (k + 1)));
  return raw.slice(0, K + 1).map((row, k) => row.map((x) => x * Math.sqrt((2 * k + 1) / 2)));
}

export default {
  collection: 'rca',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Closed convex sets have a unique closest point',
      statement: String.raw`Every nonempty, closed, convex subset $E$ of a Hilbert space $H$ contains a unique element of smallest norm. Applied to the translate $E-x$, this says: for every $x\in H$ there is exactly one $x_0\in E$ with $\|x-x_0\|=\inf_{y\in E}\|x-y\|$.`,
      idea: String.raw`The parallelogram law $\|x+y\|^2+\|x-y\|^2=2\|x\|^2+2\|y\|^2$ gives, for $x,y\in E$ and $\delta=\inf_E\|\cdot\|$,
$$\tfrac14\|x-y\|^2=\tfrac12\|x\|^2+\tfrac12\|y\|^2-\big\|\tfrac{x+y}2\big\|^2\le\tfrac12\|x\|^2+\tfrac12\|y\|^2-\delta^2,$$
because the midpoint lies in $E$ by convexity. Hence any two minimizers coincide, and a minimizing sequence is Cauchy; completeness (4.4) gives a limit, closedness keeps it in $E$, and continuity of the norm (4.6) gives it norm $\delta$.`,
      caption: String.raw`Drag $x$, the gold points $y_1,y_2\in E$ and (for the polygon) its teal corners. The dashed circle of radius $\delta=\operatorname{dist}(x,E)$ touches $E$ in the green closest point. The parallelogram on $x,y_1,y_2$ is the proof: if both $y_i$ are nearly as close as $\delta$ and the midpoint $m$ stays in $E$, then $y_1,y_2$ must be close to each other. Drag both $y_i$ toward $x_0$ and watch the bound squeeze $\|y_1-y_2\|$ to $0$. Switch to a non-convex $E$ (two closest points, $m\notin E$) or a non-closed $E$ (the infimum is not attained).`,
      deps: ['rca-4.4', 'rca-4.8', 'rca-4.6'],
      see: ['fa-3.4'],
      tags: ['convexity', 'projection', 'parallelogram law'],
      viz(v) {
        const M = v.M;
        const DISCS = [[-1.35, 0.85, 0.8], [1.35, 0.85, 0.8]];
        let hx, y1, y2;
        const mode = v.select('$E$', [{ value: 'convex', label: 'closed and convex' }, { value: 'nonconvex', label: 'not convex' }, { value: 'open', label: 'not closed' }], 'convex', {
          onChange: (m) => {
            V.forEach((h) => { h.visible = m !== 'nonconvex'; });
            if (m === 'nonconvex') { hx.set(0, -0.95); y1.set(-0.9, 0.3); y2.set(0.85, 0.35); }
            else { hx.set(-1.7, 0.15); y1.set(0.3, -0.3); y2.set(0.35, 0.62); }
          },
        });
        const S = v.stage({ x: [-3.2, 3.2], y: [-2.1, 2.1], equal: true, height: 390, axes: false });
        const V = [[0.3, -1.3], [2.1, -1.0], [2.6, 0.5], [1.5, 1.5], [0.1, 0.6]].map(([x, y]) => S.handle(x, y, { color: 'teal', r: 5.5 }));
        const hull = () => M.hull(V.map((h) => [h.x, h.y]));
        const nearestOnDiscs = (p) => {
          let best = null, bd = Infinity;
          for (const [cx, cy, r] of DISCS) {
            const d = Math.hypot(p[0] - cx, p[1] - cy), q = d <= r ? p.slice() : [cx + (p[0] - cx) * r / d, cy + (p[1] - cy) * r / d];
            const dd = M.dist(p, q); if (dd < bd) { bd = dd; best = q; }
          }
          return best;
        };
        const projIn = (p) => {
          if (mode.value === 'nonconvex') return nearestOnDiscs(p);
          const H = hull();
          if (mode.value !== 'open') return M.closestOnConvexPoly(p, H);
          // open set: stay a little inside the boundary
          let bq = null, bd = Infinity;
          for (let i = 0; i < H.length; i++) { const q = M.closestOnSegment(p, H[i], H[(i + 1) % H.length]); const d = M.dist(p, q); if (d < bd) { bd = d; bq = q; } }
          if (M.pointInPoly(p, H) && bd > 0.03) return p.slice();
          const c = H.reduce((s, z) => M.vadd(s, M.vscale(z, 1 / H.length)), [0, 0]);
          return M.vlerp(bq, c, 0.03);
        };
        hx = S.handle(-1.7, 0.15, { color: 'accent', label: 'x', constrain: (px, py) => (mode.value === 'nonconvex' && Math.abs(px) < 0.08 ? [0, py] : [px, py]) });
        y1 = S.handle(0.3, -0.3, { color: 'gold', r: 6, label: 'y₁', constrain: (px, py) => projIn([px, py]) });
        y2 = S.handle(0.35, 0.62, { color: 'gold', r: 6, label: 'y₂', constrain: (px, py) => projIn([px, py]) });
        let st = {};
        v.render(() => {
          const md = mode.value, x = [hx.x, hx.y];
          // keep y1, y2 inside E after the set moves
          for (const h of [y1, y2]) { const q = projIn([h.x, h.y]); h.x = q[0]; h.y = q[1]; }
          // the set E and the nearest point(s)
          let nearest = [], delta, inE;
          if (md === 'nonconvex') {
            for (const [cx, cy, r] of DISCS) S.circle(cx, cy, r, { fill: 'teal', fillAlpha: 0.2, color: 'teal', width: 2 });
            const ds = DISCS.map(([cx, cy, r]) => Math.max(0, Math.hypot(x[0] - cx, x[1] - cy) - r));
            delta = Math.min(...ds);
            DISCS.forEach(([cx, cy, r], i) => {
              if (ds[i] - delta < 1e-6) { const d = Math.hypot(x[0] - cx, x[1] - cy); nearest.push(d <= r ? x.slice() : [cx + (x[0] - cx) * r / d, cy + (x[1] - cy) * r / d]); }
            });
            inE = (p) => DISCS.some(([cx, cy, r]) => Math.hypot(p[0] - cx, p[1] - cy) <= r + 1e-9);
            S.line(0, -3, 0, 3, { color: 'faint', width: 1, dash: [2, 4] });
          } else {
            const H = hull();
            S.poly(H, { fill: 'teal', fillAlpha: 0.2, color: 'teal', width: 2, dash: md === 'open' ? [6, 5] : null });
            const q = M.closestOnConvexPoly(x, H);
            delta = M.dist(x, q); nearest = [q];
            inE = (p) => M.pointInPoly(p, H) || M.dist(p, M.closestOnConvexPoly(p, H)) < 1e-9;
          }
          S.tex('E', md === 'nonconvex' ? -1.35 : hull().reduce((s, z) => s + z[0], 0) / V.length, md === 'nonconvex' ? 1.25 : hull().reduce((s, z) => s + z[1], 0) / V.length + 0.15, { color: 'teal', size: 20 });
          if (md === 'nonconvex') S.tex('E', 1.35, 1.25, { color: 'teal', size: 20 });
          // ball of radius delta about x
          if (delta > 1e-6) S.circle(x[0], x[1], delta, { color: 'accent', width: 1.4, dash: [5, 4], fill: 'accent', fillAlpha: 0.05 });
          // parallelogram on x, y1, y2
          const a = [y1.x, y1.y], b = [y2.x, y2.y], m = M.vscale(M.vadd(a, b), 0.5), far = M.vsub(M.vadd(a, b), x);
          S.poly([x, a, far, b], { color: 'muted', width: 1, dash: [3, 4], fill: 'muted', fillAlpha: 0.04 });
          S.line(x[0], x[1], a[0], a[1], { color: 'gold', width: 1.8 });
          S.line(x[0], x[1], b[0], b[1], { color: 'gold', width: 1.8 });
          S.line(a[0], a[1], b[0], b[1], { color: 'orange', width: 2.2 });
          S.line(x[0], x[1], m[0], m[1], { color: 'purple', width: 1.6, dash: [5, 4] });
          const mIn = inE(m);
          S.dot(m[0], m[1], { color: mIn ? 'purple' : 'red', r: 5, label: 'm', labelPos: 'e', labelColor: mIn ? 'purple' : 'red' });
          for (const q of nearest) {
            if (md === 'open') S.dot(q[0], q[1], { color: 'red', hollow: true, r: 6, width: 2.4 });
            else S.dot(q[0], q[1], { color: 'green', r: 6.5 });
          }
          if (md !== 'open') nearest.forEach((q) => S.tex('x_0', q[0], q[1], md === 'convex' ? { color: 'green', dx: -8, dy: -8, align: 'right', baseline: 'bottom' } : { color: 'green', dx: q[0] < 0 ? -12 : 12, dy: 12, align: q[0] < 0 ? 'right' : 'left', baseline: 'top' }));
          const status = md === 'convex' ? ['a unique closest point x₀ ∈ E', 'green']
            : md === 'open' ? ['inf of ‖x − y‖ over E is not attained', 'red']
              : nearest.length > 1 ? ['two closest points — uniqueness fails', 'red'] : ['closest point unique here, but m ∉ E can happen', 'red'];
          S.corner(status[0], 'tl', { color: status[1], weight: 600 });
          const d1 = M.dist(a, x), d2 = M.dist(b, x), dm = M.dist(m, x), lhs = M.dist(a, b) ** 2;
          st = { lhs, id: 2 * d1 * d1 + 2 * d2 * d2 - 4 * dm * dm, bound: 2 * d1 * d1 + 2 * d2 * d2 - 4 * delta * delta, mIn, delta, d1, d2 };
          v.legend([['teal', '$E$', { area: true }], ['gold', '$y_1,y_2\\in E$'], ['orange', '$y_1-y_2$'], ['purple', 'midpoint $m=\\frac{y_1+y_2}{2}$', { dash: true }], ['accent', 'radius $\\delta=\\inf_{y\\in E}\\|x-y\\|$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (s.lhs == null) return '';
          return `$\\|y_1-y_2\\|^2 = ${v.fix(s.lhs, 3)} = 2\\|y_1-x\\|^2+2\\|y_2-x\\|^2-4\\|m-x\\|^2$ (parallelogram law) $` + (s.mIn ? '\\le' : '\\not\\le') + ` 2\\|y_1-x\\|^2+2\\|y_2-x\\|^2-4\\delta^2 = ${v.fix(s.bound, 3)}$` + (s.mIn ? ' since $m\\in E$.' : ' — **the midpoint left $E$**.');
        });
      },
    },

    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Theorem',
      name: 'Orthogonal decomposition H = M ⊕ M⊥',
      statement: String.raw`Let $M$ be a closed subspace of a Hilbert space $H$.
(a) Every $x\in H$ has a unique decomposition $x=Px+Qx$ with $Px\in M$ and $Qx\in M^\perp$.
(b) $Px$ is the point of $M$ nearest to $x$, and $Qx$ is the point of $M^\perp$ nearest to $x$.
(c) The maps $P:H\to M$ and $Q:H\to M^\perp$ are linear.
(d) $\|x\|^2=\|Px\|^2+\|Qx\|^2$.`,
      idea: String.raw`The coset $x+M$ is closed and convex, so by 4.10 it has an element $Qx$ of smallest norm; put $Px=x-Qx\in M$. Minimality of $\|Qx\|$ against $Qx-\alpha y$ ($y\in M$) forces $(Qx,y)=0$, so $Qx\in M^\perp$. Uniqueness follows from $M\cap M^\perp=\{0\}$; linearity from uniqueness; (d) from $Px\perp Qx$; and (b) from $\|x-y\|^2=\|Qx\|^2+\|Px-y\|^2$ for $y\in M$.`,
      caption: String.raw`In $\R^3$ with $M$ a plane through $0$. Drag $Px$ in the right panel (this moves $x$ inside the direction of $M$) and set the height $(x,n)$ of $x$ above $M$ with the slider; rotate the 3D view. The competitor $s\in M$ is always farther from $x$ than $Px$: the circles show $\|x-s\|$, centred at $Px$, because $\|x-s\|^2=\|Qx\|^2+\|Px-s\|^2$.`,
      deps: ['rca-4.10', 'rca-4.9'],
      see: ['pma-8.11'],
      tags: ['projection', 'orthogonality'],
      viz(v) {
        const M = v.M;
        const tilt = v.slider('tilt of $M$', 0, 1.3, 0.42, { step: 0.01 });
        const hh = v.slider('$(x,n)$', -1.4, 1.4, 1.05, { step: 0.01 });
        const S3 = v.stage3d({ range: 1.75, height: 390, yaw: -0.8, pitch: 0.36, minWidth: 300, title: '$\\R^3 = M\\oplus M^\\perp$', labels: null, axes: false });
        const P = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, height: 390, minWidth: 300, axes: false, title: 'inside $M$, in an orthonormal basis $e_1,e_2$' });
        const hp = P.handle(0.85, 0.45, { color: 'green', label: 'Px' });
        const hs = P.handle(-0.7, -0.75, { color: 'gold', label: 's' });
        let st = {};
        v.render(() => {
          const th = tilt.value, h = hh.value;
          const e1 = [1, 0, 0], e2 = [0, Math.cos(th), Math.sin(th)], n = [0, -Math.sin(th), Math.cos(th)];
          const at = (a, b, c = 0) => [0, 1, 2].map((i) => a * e1[i] + b * e2[i] + c * n[i]);
          const Px = at(hp.x, hp.y), Qx = M.vscale(n, h), x = M.vadd(Px, Qx), s = at(hs.x, hs.y);
          const R = 1.55;
          S3.poly([at(-R, -R), at(R, -R), at(R, R), at(-R, R)], { fill: 'teal', fillAlpha: 0.13, color: 'teal', alpha: 0.6, bias: 50 });
          for (let k = -3; k <= 3; k++) {
            S3.line(at(k * 0.5, -R), at(k * 0.5, R), { color: 'teal', alpha: 0.22, width: 0.8, bias: 40 });
            S3.line(at(-R, k * 0.5), at(R, k * 0.5), { color: 'teal', alpha: 0.22, width: 0.8, bias: 40 });
          }
          S3.line(M.vscale(n, -1.7), M.vscale(n, 1.7), { color: 'purple', width: 1.8, alpha: 0.75 });
          S3.tex('M^{\\perp}', M.vscale(n, 1.85), { color: 'purple' });
          S3.tex('M', at(R * 0.92, R * 0.92), { color: 'teal', size: 17 });
          // decomposition
          S3.line(x, Px, { color: 'muted', width: 1.4, dash: [5, 4] });
          S3.line(x, Qx, { color: 'muted', width: 1.4, dash: [5, 4] });
          S3.line(x, s, { color: 'gold', width: 2 });
          S3.line(Px, s, { color: 'gold', width: 1.4, dash: [4, 4] });
          const u = M.dist(s, Px) > 0.15 ? M.normalize(M.vsub(s, Px)) : e1, sg = Math.sign(h) || 1, k = 0.13;
          S3.path([M.vadd(Px, M.vscale(u, k)), M.vadd(Px, M.vadd(M.vscale(u, k), M.vscale(n, sg * k))), M.vadd(Px, M.vscale(n, sg * k))], { color: 'muted', width: 1.2 });
          S3.arrow([0, 0, 0], Px, { color: 'green', width: 2.4 });
          S3.arrow([0, 0, 0], Qx, { color: 'purple', width: 2.4 });
          S3.arrow([0, 0, 0], x, { color: 'accent', width: 2.6 });
          S3.dot([0, 0, 0], { color: 'ink', r: 3 });
          S3.dot(x, { color: 'accent', r: 5.5, label: 'x' });
          S3.dot(Px, { color: 'green', r: 5, label: 'Px' });
          S3.dot(Qx, { color: 'purple', r: 5, label: 'Qx' });
          S3.dot(s, { color: 'gold', r: 5, label: 's' });
          // right panel: distance circles centred at Px
          const p = [hp.x, hp.y];
          for (let j = 1; j <= 8; j++) {
            const D = Math.abs(h) + 0.25 * j, rho = Math.sqrt(D * D - h * h);
            P.circle(p[0], p[1], rho, { color: 'gold', width: 1, alpha: 0.35 });
          }
          P.line(-3, 0, 3, 0, { color: 'grid', width: 1 }); P.line(0, -3, 0, 3, { color: 'grid', width: 1 });
          P.arrow(0, 0, 1, 0, { color: 'muted', width: 1.6, head: 7 }); P.arrow(0, 0, 0, 1, { color: 'muted', width: 1.6, head: 7 });
          P.tex('e_1', 1, 0, { color: 'muted', dy: 12, size: 13 }); P.tex('e_2', 0, 1, { color: 'muted', dx: -12, size: 13 });
          P.line(p[0], p[1], hs.x, hs.y, { color: 'gold', width: 1.8, dash: [4, 4] });
          P.dot(0, 0, { color: 'ink', r: 3 });
          const nPx = Math.hypot(...Px), nQx = Math.abs(h), dxs = M.dist(x, s);
          P.corner(`‖x − s‖ = ${v.fix(dxs, 3)}  ≥  ‖x − Px‖ = ${v.fix(nQx, 3)}`, 'bl', { color: 'green', weight: 600 });
          v.legend([['accent', '$x$'], ['green', '$Px\\in M$'], ['purple', '$Qx\\in M^\\perp$'], ['gold', 'competitor $s\\in M$']]);
          st = { nx: Math.hypot(...x), nPx, nQx, dxs, dps: M.dist(Px, s) };
        });
        v.readout(() => {
          const s = st; if (s.nx == null) return '';
          return `$\\|x\\|^2 = ${v.fix(s.nx ** 2, 3)} = \\|Px\\|^2+\\|Qx\\|^2 = ${v.fix(s.nPx ** 2, 3)} + ${v.fix(s.nQx ** 2, 3)}$; $\\;\\|x-s\\|^2 = ${v.fix(s.dxs ** 2, 3)} = \\|Qx\\|^2 + \\|Px-s\\|^2 = ${v.fix(s.nQx ** 2, 3)} + ${v.fix(s.dps ** 2, 3)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.11a
    {
      num: '4.11a',
      kind: 'Corollary',
      name: 'A proper closed subspace has a nonzero normal vector',
      statement: String.raw`If $M$ is a closed subspace of a Hilbert space $H$ and $M\ne H$, then there is a $y\in H$ with $y\ne0$ and $y\perp M$.`,
      idea: String.raw`Pick any $x\in H\setminus M$ and take $y=Qx=x-Px$ from 4.11. It lies in $M^\perp$, and it is not $0$ because otherwise $x=Px\in M$.`,
      caption: String.raw`An explicit instance: $H=L^2[-1,1]$ and $M$ the polynomials of degree $\le n$ (closed, since finite-dimensional). Pick $x$ and $n$: the red residual $y=x-Px$ is nonzero, and its coefficients against the orthonormal Legendre basis $p_0,\dots,p_n$ of $M$ vanish (green bars) — $y\perp M$. Choose $x=t^2$ with $n\ge2$ to see the corollary's hypothesis $x\notin M$ fail.`,
      deps: ['rca-4.11'],
      tags: ['orthogonality', 'projection'],
      viz(v) {
        const M = v.M;
        const FX = {
          abs: { label: '$|t|$', f: (t) => Math.abs(t) },
          exp: { label: '$e^{t}$', f: (t) => Math.exp(t) },
          sgn: { label: '$\\operatorname{sgn} t$', f: (t) => Math.sign(t) },
          cos: { label: '$\\cos 4t$', f: (t) => Math.cos(4 * t) },
          sq: { label: '$t^2$', f: (t) => t * t },
        };
        const which = v.select('$x$', Object.entries(FX).map(([value, F]) => ({ value, label: F.label })), 'abs');
        const nn = v.slider('$n=\\dim M-1$', 0, 9, 2, { int: true });
        const K = 12;
        const G = simpsonGrid(-1, 1, 1200), P = legendreTable(G.t, K);
        const ip = (f, g) => f.reduce((s, x, i) => s + G.w[i] * x * g[i], 0);
        const T = v.stage({ x: [-1.05, 1.05], y: [-1.3, 2.9], height: 280, full: true, axes: 'box' });
        const B = v.stage({ x: [-0.7, K + 0.7], y: [-0.6, 0.6], height: 200, full: true, axes: 'box', xticks: M.range(K + 1), title: 'coefficients $(y,p_k)$ of the residual against the Legendre basis' });
        let st = {};
        v.render(() => {
          const F = FX[which.value], n = nn.value;
          const xs = G.t.map(F.f);
          const c = P.slice(0, n + 1).map((p) => ip(xs, p));
          const Px = G.t.map((_, i) => c.reduce((s, ck, k) => s + ck * P[k][i], 0));
          const y = xs.map((x, i) => x - Px[i]);
          const cy = P.map((p) => ip(y, p));
          const ny = Math.sqrt(Math.max(0, ip(y, y)));
          const lo = Math.min(...xs, ...y, ...Px), hi = Math.max(...xs, ...y, ...Px), pad = 0.12 * (hi - lo + 0.5);
          T.setView(null, [lo - pad, hi + pad]);
          const pts = (arr) => G.t.map((t, i) => (i % 2 ? null : [t, arr[i]])).filter(Boolean);
          T.line(-1, 0, 1, 0, { color: 'faint', width: 1 });
          T.path(pts(y).concat([[1, 0], [-1, 0]]), { fill: 'red', fillAlpha: 0.1, stroke: false, close: true });
          T.path(pts(xs), { color: 'ink', width: 2.4 });
          T.path(pts(Px), { color: 'green', width: 2.4 });
          T.path(pts(y), { color: 'red', width: 2.2 });
          T.corner(ny < 1e-6 ? 'x ∈ M, so y = x − Px = 0: no conclusion' : `y = x − Px ≠ 0,  ‖y‖₂ = ${v.fix(ny, 4)}`, 'tl', { color: ny < 1e-6 ? 'red' : 'green', weight: 600 });
          // bars
          const top = Math.max(0.15, ...cy.map(Math.abs)) * 1.25;
          B.setView(null, [-top, top]);
          B.vband(-0.5, n + 0.5, { color: 'green', alpha: 0.08 });
          B.bars(cy, { x0: 0, color: (val, k) => (k <= n ? 'green' : 'red'), barWidth: 0.55 });
          B.dots(cy.map((val, k) => [k, val]), { color: 'ink', r: 2.2 });
          B.tex('M=\\operatorname{span}\\{p_0,\\dots,p_n\\}', (n + 0.5) / 2 - 0.25, top, { color: 'green', baseline: 'top', dy: 6, size: 13, align: n < 2 ? 'left' : 'center' });
          v.legend([['ink', '$x$'], ['green', '$Px$ (best polynomial of degree $\\le n$)'], ['red', '$y=x-Px$']]);
          st = { ny, maxIn: Math.max(...cy.slice(0, n + 1).map(Math.abs)), n };
        });
        v.readout(() => {
          const s = st; if (s.ny == null) return '';
          return `$\\|y\\|_2 = ${v.fix(s.ny, 5)}$, $\\;\\max_{k\\le ${s.n}}|(y,p_k)| = ${sci(s.maxIn)}$` + (s.ny < 1e-6 ? ' — here $x\\in M$; choose a function outside $M$.' : ' — so $y\\ne0$ and $y\\perp M$.');
        });
      },
    },

    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Theorem',
      name: 'Riesz representation of bounded functionals on H',
      statement: String.raw`If $L$ is a continuous linear functional on a Hilbert space $H$, there is a unique $y\in H$ such that
$$Lx=(x,y)\qquad\text{for all }x\in H .$$
Moreover $\|L\|=\|y\|$.`,
      idea: String.raw`If $L=0$ take $y=0$. Otherwise the null space $M$ of $L$ is a closed subspace (continuity) different from $H$, so by the corollary 4.11a there is $z\perp M$ with $\|z\|=1$. For any $x$, the vector $(Lx)z-(Lz)x$ lies in $M$, hence is orthogonal to $z$, which gives $Lx=(Lz)(x,z)=(x,\overline{Lz}\,z)$. So $y=\overline{Lz}\,z$. Uniqueness: if $(x,y)=(x,y')$ for all $x$, take $x=y-y'$. Schwarz gives $\|L\|\le\|y\|$ and $x=y$ gives equality.`,
      caption: String.raw`Left ($H=\R^2$): set $L$ by its values on $e_1,e_2$ and drag $x$. The thin lines are level sets $\{Lx=c\}$; the teal line is the kernel $M$. Rudin's construction picks a unit $z\perp M$ and puts $y=(Lz)\,z$ — the normal vector to the kernel, with length $\|L\|$. Right ($H=L^2[0,1]$): the local average $L_hf=\frac1h\int_{c-h/2}^{c+h/2}f$ is represented by the box $y_h$ of height $1/h$. Shrink $h$: $L_hf\to f(c)$, but $\|L_h\|=\|y_h\|=h^{-1/2}\to\infty$ — point evaluation is not continuous on $L^2$, so it has no representer.`,
      deps: ['rca-4.11a', 'rca-4.9', 'rca-4.6'],
      see: ['rca-6.16', 'rca-6.10'],
      tags: ['duality', 'linear functional'],
      viz(v) {
        const M = v.M;
        const la = v.slider('$L(e_1)$', -1.5, 1.5, 1.2, { step: 0.01 });
        const lb = v.slider('$L(e_2)$', -1.5, 1.5, 0.75, { step: 0.01 });
        const hs = v.slider('$h$', 0.004, 0.5, 0.16, { log: true, fmt: (x) => x.toFixed(3) });
        const L = v.stage({ x: [-2.5, 2.5], y: [-1.9, 1.9], equal: true, height: 340, axes: false, title: '$H=\\R^2$: kernel, level lines and $y$' });
        const R = v.stage({ x: [-0.03, 1.03], y: [-2, 8], height: 340, axes: 'box', title: '$H=L^2[0,1]$: averaging near $c$' });
        const hx = L.handle(-0.4, 1.5, { color: 'accent', label: 'x' });
        const f = (t) => Math.sin(2 * Math.PI * t) + 0.6 * Math.cos(5 * t) + 0.3;
        const c0 = 0.62;
        let st = {};
        v.render(() => {
          const a = la.value, b = lb.value, x = [hx.x, hx.y], nL = Math.hypot(a, b);
          const Lx = a * x[0] + b * x[1];
          if (nL < 1e-3) {
            L.corner('L = 0, so y = 0 and the kernel is all of H', 'tl', { color: 'muted', weight: 600 });
            L.dot(0, 0, { color: 'green', r: 6 });
          } else {
            const z = [a / nL, b / nL], t = [-z[1], z[0]];
            for (let k = -16; k <= 16; k++) {
              const p = M.vscale(z, (k * 0.5) / nL);
              L.line(p[0] - t[0] * 9, p[1] - t[1] * 9, p[0] + t[0] * 9, p[1] + t[1] * 9, { color: k === 0 ? 'teal' : 'faint', width: k === 0 ? 3 : 1 });
            }
            const tt = t[1] > 0 ? [-t[0], -t[1]] : t;
            L.tex('M=\\ker L', tt[0] * 1.35, tt[1] * 1.35, { color: 'teal', dx: -12 * z[0], dy: 12 * z[1], align: z[0] > 0 ? 'right' : 'left' });
            // decomposition x = (x - (x,z)z) + (x,z) z
            const xz = dot2(x, z), xm = M.vsub(x, M.vscale(z, xz));
            L.arrow(0, 0, xm[0], xm[1], { color: 'teal', width: 1.6, dash: [5, 4] });
            L.line(xm[0], xm[1], x[0], x[1], { color: 'purple', width: 1.6, dash: [5, 4] });
            if (Math.abs(xz) > 0.1 && Math.hypot(...xm) > 0.1) rightAngle(L, xm, M.vscale(M.normalize(xm), -1), M.vscale(z, Math.sign(xz)), 0.12);
            L.arrow(0, 0, a, b, { color: 'green', width: 4.5, alpha: 0.85 });
            L.arrow(0, 0, z[0], z[1], { color: 'purple', width: 2, head: 8 });
            L.tex('z', z[0] / 2, z[1] / 2, { color: 'purple', dx: 14 * t[0], dy: -14 * t[1] });
            L.tex('y=(Lz)\\,z', a, b, { color: 'green', dx: 16 * z[0], dy: -16 * z[1], align: z[0] >= 0 ? 'left' : 'right' });
          }
          L.arrow(0, 0, x[0], x[1], { color: 'accent', width: 2.2 });
          L.dot(0, 0, { color: 'ink', r: 3 });
          // right panel
          const h = hs.value, lo = c0 - h / 2, hi = c0 + h / 2, H = 1 / h;
          const avg = M.integrate(f, lo, hi, 200) / h;
          const top = 8;
          R.vband(lo, hi, { color: 'green', alpha: 0.1 });
          R.rect(lo, 0, hi, Math.min(H, top * 0.93), { fill: 'green', fillAlpha: 0.22, color: 'green', width: 1.6 });
          if (H > top * 0.93) { R.arrow(c0, top * 0.75, c0, top * 0.97, { color: 'green', head: 8 }); R.text(`height 1/h = ${v.fix(H, 0)}`, Math.min(hi + 0.02, 0.7), top * 0.88, { color: 'green', size: 12 }); }
          else R.tex('y_h', hi, H, { color: 'green', align: 'left', dx: 6, baseline: 'bottom' });
          R.fn(f, { domain: [0, 1], color: 'accent', width: 2.4 });
          R.tex('f', 0.08, f(0.08), { color: 'accent', dy: -14 });
          R.dot(c0, f(c0), { color: 'red', r: 4.5 });
          R.tex('f(c)', c0 - h / 2, f(c0), { color: 'red', align: 'right', dx: -6, size: 13 });
          R.dot(c0, avg, { color: 'green', r: 5, hollow: true, width: 2.2 });
          R.tex('L_hf', c0 + h / 2, avg, { color: 'green', align: 'left', dx: 6, size: 13 });
          st = { a, b, Lx, xy: dot2(x, [a, b]), nL, h, avg, fc: f(c0) };
          v.legend([['teal', 'kernel $M$'], ['purple', 'unit $z\\perp M$'], ['green', 'representer $y$ / $y_h$'], ['accent', '$x$ / test function $f$']]);
        });
        v.readout(() => {
          const s = st; if (s.Lx == null) return '';
          return `$Lx = ${v.fix(s.Lx, 3)} = (x,y)$ with $y = (${v.fix(s.a, 2)}, ${v.fix(s.b, 2)})$, $\\|L\\| = \\|y\\| = ${v.fix(s.nL, 3)}$. $\\quad$ Right: $L_hf = (f,y_h) = ${v.fix(s.avg, 4)}$, $f(c) = ${v.fix(s.fc, 4)}$, $\\|L_h\\| = \\|y_h\\|_2 = h^{-1/2} = ${v.fix(1 / Math.sqrt(s.h), 2)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Definition',
      name: 'Orthonormal sets and Fourier coefficients',
      statement: String.raw`Vectors $x_1,\dots,x_k$ in a vector space are *independent* if $c_1x_1+\dots+c_kx_k=0$ only when all $c_j=0$; a set is independent if each of its finite subsets is, and its *span* is the set of finite linear combinations of its members. A set $\{u_\alpha:\alpha\in A\}$ in an inner product space is *orthonormal* if $(u_\alpha,u_\beta)=0$ for $\alpha\ne\beta$ and $\|u_\alpha\|=1$ for every $\alpha$. For $x\in H$, the numbers
$$\hat x(\alpha)=(x,u_\alpha)\qquad(\alpha\in A)$$
are the *Fourier coefficients* of $x$ relative to $\{u_\alpha\}$. Orthonormal sets are independent.`,
      idea: String.raw`Taking the inner product of $\sum c_ju_{\alpha_j}=0$ with $u_{\alpha_i}$ kills every term except $c_i$, so orthonormal sets are independent. The Fourier coefficients are the coordinates a vector would have if $\{u_\alpha\}$ were a basis; Theorems 4.14–4.18 measure how much of $x$ they actually capture. The model is $u_n(t)=e^{int}$ in $L^2(T)$ (4.23).`,
      deps: ['rca-4.1'],
      tags: ['orthonormal', 'Fourier'],
    },

    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Theorem',
      name: 'Best approximation from a finite orthonormal set',
      statement: String.raw`Let $\{u_\alpha:\alpha\in A\}$ be orthonormal in $H$, let $F\subset A$ be finite, and let $M_F$ be the span of $\{u_\alpha:\alpha\in F\}$.
(a) If $\varphi$ is a complex function on $A$ vanishing outside $F$, then $y=\sum_{\alpha\in F}\varphi(\alpha)u_\alpha\in M_F$ satisfies $\hat y(\alpha)=\varphi(\alpha)$ for all $\alpha\in A$, and $\|y\|^2=\sum_{\alpha\in F}|\varphi(\alpha)|^2$.
(b) If $x\in H$ and $s_F(x)=\sum_{\alpha\in F}\hat x(\alpha)u_\alpha$, then $\|x-s_F(x)\|<\|x-s\|$ for every $s\in M_F$ other than $s_F(x)$, and
$$\sum_{\alpha\in F}|\hat x(\alpha)|^2\le\|x\|^2 .$$`,
      idea: String.raw`(a) is a direct computation using orthonormality. For (b), $\hat x(\alpha)=\widehat{s_F(x)}(\alpha)$ for $\alpha\in F$, so $x-s_F(x)\perp M_F$; hence for $s\in M_F$ the Pythagorean identity gives $\|x-s\|^2=\|x-s_F(x)\|^2+\|s_F(x)-s\|^2$. Taking $s=0$ yields $\|x\|^2=\|x-s_F(x)\|^2+\sum_F|\hat x(\alpha)|^2$.`,
      caption: String.raw`Orthonormal set $u_k(t)=2^{1/2}\sin k\pi t$ in $L^2[0,1]$, $F=\{1,\dots,5\}$. The green bars are the Fourier coefficients $\hat x(k)$, the gold handles the coefficients $c_k$ of a competitor $s=\sum c_ku_k\in M_F$ — drag them. The readout checks $\|x-s\|^2=\|x-s_F(x)\|^2+\sum|c_k-\hat x(k)|^2$: the green curve $s_F(x)$ always wins, and the energy it captures never exceeds $\|x\|^2$.`,
      deps: ['rca-4.13'],
      see: ['pma-8.11'],
      tags: ['orthonormal', 'best approximation'],
      viz(v) {
        const M = v.M;
        const NF = 5;
        const FX = {
          pluck: { label: 'plucked string', f: (t) => (t < 0.3 ? t / 0.3 : (1 - t) / 0.7) },
          ramp: { label: '$t$', f: (t) => t },
          step: { label: '$\\chi_{[0.2,0.6]}$', f: (t) => (t >= 0.2 && t <= 0.6 ? 1 : 0) },
          wave: { label: '$t\\sin 9t$', f: (t) => t * Math.sin(9 * t) },
        };
        const G = { t: [], w: [] }; const NG = 4000;
        for (let i = 0; i < NG; i++) { G.t.push((i + 0.5) / NG); G.w.push(1 / NG); }
        const U = M.range(NF, 1).map((k) => G.t.map((t) => Math.SQRT2 * Math.sin(k * Math.PI * t)));
        const ip = (f, g) => f.reduce((s, x, i) => s + G.w[i] * x * g[i], 0);
        let coef = null, xs = null;
        const compute = (key) => { xs = G.t.map(FX[key].f); coef = U.map((u) => ip(xs, u)); };
        const OFF = [0.18, -0.15, 0.12, 0.1, -0.12];
        const which = v.select('$x$', Object.entries(FX).map(([value, F]) => ({ value, label: F.label })), 'pluck', {
          onChange: (k) => { compute(k); H.forEach((h, i) => { h.y = coef[i] + OFF[i]; }); },
        });
        const T = v.stage({ x: [-0.02, 1.02], y: [-0.6, 1.3], height: 330, minWidth: 300, xlabel: 't', title: '$x$, the best approximation $s_F(x)$, and a competitor $s$' });
        const B = v.stage({ x: [0.3, NF + 0.7], y: [-0.6, 1.0], height: 330, minWidth: 300, axes: 'box', xticks: M.range(NF, 1), title: 'coefficients: $\\hat x(k)$ (bars) and $c_k$ (handles)' });
        compute('pluck');
        const H = M.range(NF).map((i) => B.handle(i + 1, coef[i] + OFF[i], { color: 'gold', r: 6.5, constrain: (px, py) => [i + 1, py] }));
        v.button('set $s=s_F(x)$', () => { H.forEach((h, i) => { h.y = coef[i]; }); });
        let st = {};
        v.render(() => {
          const c = H.map((h) => h.y);
          const sF = G.t.map((_, i) => coef.reduce((s, a, k) => s + a * U[k][i], 0));
          const sv = G.t.map((_, i) => c.reduce((s, a, k) => s + a * U[k][i], 0));
          const lo = Math.min(...xs, ...sv, ...sF), hi = Math.max(...xs, ...sv, ...sF), pad = 0.12 * (hi - lo);
          T.setView(null, [lo - pad, hi + pad]);
          const pts = (arr) => G.t.map((t, i) => (i % 8 ? null : [t, arr[i]])).filter(Boolean).concat([[1, arr[NG - 1]]]);
          T.path(pts(xs), { color: 'ink', width: 2.4 });
          T.path(pts(sv), { color: 'gold', width: 2.2 });
          T.path(pts(sF), { color: 'green', width: 2.6 });
          // bars
          const vals = coef.concat(c), blo = Math.min(0, ...vals), bhi = Math.max(0, ...vals), bp = 0.18 * (bhi - blo + 0.2);
          B.setView(null, [blo - bp, bhi + bp]);
          B.bars(coef, { x0: 1, color: 'green', barWidth: 0.5, fillAlpha: 0.55 });
          c.forEach((ck, i) => B.line(i + 1, ck, i + 1, coef[i], { color: 'red', width: 2, dash: [3, 3] }));
          const e2 = ip(xs.map((x, i) => x - sv[i]), xs.map((x, i) => x - sv[i]));
          const eF = ip(xs.map((x, i) => x - sF[i]), xs.map((x, i) => x - sF[i]));
          const dev = c.reduce((s, ck, i) => s + (ck - coef[i]) ** 2, 0);
          v.legend([['ink', '$x$'], ['green', '$s_F(x)=\\sum_{k\\le5}\\hat x(k)u_k$'], ['gold', '$s=\\sum c_ku_k$'], ['red', '$c_k-\\hat x(k)$', { dash: true }]]);
          st = { e2, eF, dev, cap: coef.reduce((s, a) => s + a * a, 0), nx: ip(xs, xs) };
        });
        v.readout(() => {
          const s = st; if (s.e2 == null) return '';
          return `$\\|x-s\\|^2 = ${v.fix(s.e2, 4)} = \\|x-s_F(x)\\|^2 + \\sum|c_k-\\hat x(k)|^2 = ${v.fix(s.eF, 4)} + ${v.fix(s.dev, 4)}$; $\\;\\sum_{k\\le5}|\\hat x(k)|^2 = ${v.fix(s.cap, 4)} \\le \\|x\\|^2 = ${v.fix(s.nx, 4)}$.`;
        });
      },
    },
  ],
};
