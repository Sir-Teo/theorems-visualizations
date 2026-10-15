// Rudin, Real and Complex Analysis — Chapter 10 (part 2): paths, path integrals, the index, the local Cauchy theorem

// ---------------------------------------------------------------- helpers shared by this file
function phaseRGB(M, re, im, fade = 0, bg = null) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
// Closed Catmull–Rom spline through the control points P = [[x,y],...]; returns a closed polyline.
function catmullClosed(P, per = 40) {
  const n = P.length, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (p2[d] - p0[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (3 * p1[d] - p0[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  out.push(out[0].slice());
  return out;
}
// Winding number of a closed polyline about (x, y) — exact integer by signed crossings.
function windPoly(pts, x, y) {
  let w = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const x1 = pts[i][0], y1 = pts[i][1], x2 = pts[i + 1][0], y2 = pts[i + 1][1];
    const side = (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1);
    if (y1 <= y) { if (y2 > y && side > 0) w++; } else if (y2 <= y && side < 0) w--;
  }
  return w;
}
// Distance from (x, y) to a polyline.
function distPoly(pts, x, y) {
  let d = Infinity;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], dx = x2 - x1, dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1)));
    d = Math.min(d, Math.hypot(x - x1 - t * dx, y - y1 - t * dy));
  }
  return d;
}
// Orientation arrows along a polyline at the given fractions of its length.
function pathArrows(S, pts, fracs, color = 'ink', head = 11) {
  const n = pts.length - 1;
  for (const f of fracs) {
    const i = Math.min(n - 3, Math.max(2, Math.floor(f * n))), a = pts[i - 2], b = pts[i + 2], p = pts[i];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, h = 8 / S.scale;
    S.arrow(p[0] - dx / L * h, p[1] - dy / L * h, p[0] + dx / L * h, p[1] + dy / L * h, { color, head, width: 2.2 });
  }
}
// 5-point Gauss–Legendre rule on [0,1].
const GL5 = [[0.04691007703066802, 0.11846344252809454], [0.23076534494715845, 0.23931433524968324], [0.5, 0.28444444444444444], [0.7692346550528415, 0.23931433524968324], [0.9530899229693319, 0.11846344252809454]];
const sub = (n) => String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d] ?? d).join('');

export default {
  collection: 'rca',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ integration over paths
    {
      num: '10.8',
      kind: 'Definition',
      name: 'Curves, paths and closed paths',
      verify: true,
      statement: String.raw`A **curve** in a topological space $X$ is a continuous map $\gamma$ of a compact interval $[\alpha,\beta]\subset\R$ into $X$; $[\alpha,\beta]$ is its **parameter interval** and $\gamma^*$ denotes its range. If $\gamma(\alpha)=\gamma(\beta)$, $\gamma$ is a **closed curve**.

A **path** is a curve in the plane that is piecewise continuously differentiable: there are points $\alpha=s_0<s_1<\dots<s_n=\beta$ such that on each $[s_{j-1},s_j]$ the map $\gamma$ has a continuous derivative (one-sided at the ends). The one-sided derivatives at an $s_j$ need not agree. A **closed path** is a path which is a closed curve.`,
      idea: String.raw`Paths are the curves along which $\int f(\gamma(t))\gamma'(t)\,dt$ makes sense with nothing more than Riemann integration: $\gamma'$ is bounded and continuous except at finitely many corners. Polygons, circles and arcs — everything Cauchy's theorem needs — are paths, and $\gamma^*$ is compact, being a continuous image of $[\alpha,\beta]$.`,
      caption: String.raw`A closed path made of a segment, a curved (quadratic) piece and a second segment; drag the corners and the orange control point, or open the path. The gold point runs through the parameter interval $[0,3]$ carrying its velocity $\gamma'(t)$; at the corners the left and right derivatives differ, which the speed graph shows as jumps.`,
      deps: ['pma-6.26'],
      see: ['pma-6.27'],
      tags: ['paths'],
      viz(v) {
        const closed = v.toggle('closed path: $\\gamma(\\beta)=\\gamma(\\alpha)$', true);
        const S = v.stage({ x: [-2.8, 2.8], y: [-1.35, 1.45], equal: true, height: 300, full: true, axes: false, title: 'the path in the plane; $\\gamma^*$ is its range' });
        const T = v.stage({ x: [-0.08, 3.08], y: [0, 3], height: 160, full: true, axes: 'box', xticks: [[0, 'α = 0'], [1, 's₁ = 1'], [2, 's₂ = 2'], [3, 'β = 3']], title: "speed $|\\gamma'(t)|$ on the parameter interval" });
        const P0 = S.handle(-1.9, -0.8, { color: 'ink', label: 'γ(α)', labelPos: 'sw' });
        const P1 = S.handle(0.2, -1.0, { color: 'ink', label: 'γ(s₁)', labelPos: 's' });
        const Q = S.handle(2.4, 1.2, { color: 'orange', r: 6 });
        const P2 = S.handle(-0.2, 1.1, { color: 'ink', label: 'γ(s₂)', labelPos: 'n' });
        const P3 = S.handle(-2.2, 0.6, { color: 'ink', label: 'γ(β)', labelPos: 'w' });
        let st = null;
        v.animate((time) => {
          P3.visible = !closed.value;
          const A = [P0.x, P0.y], B = [P1.x, P1.y], C = [Q.x, Q.y], D = [P2.x, P2.y], E = closed.value ? A : [P3.x, P3.y];
          const g = (t) => {
            if (t <= 1) return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
            if (t <= 2) { const s = t - 1; return [0, 1].map((d) => (1 - s) ** 2 * B[d] + 2 * s * (1 - s) * C[d] + s * s * D[d]); }
            const s = t - 2; return [D[0] + (E[0] - D[0]) * s, D[1] + (E[1] - D[1]) * s];
          };
          const dg = (t, side = 0) => {
            if (t < 1 || (t === 1 && side < 0)) return [B[0] - A[0], B[1] - A[1]];
            if (t < 2 || (t === 2 && side < 0)) { const s = t - 1; return [0, 1].map((d) => 2 * ((1 - s) * (C[d] - B[d]) + s * (D[d] - C[d]))); }
            return [E[0] - D[0], E[1] - D[1]];
          };
          S.line(B[0], B[1], C[0], C[1], { color: 'orange', width: 1, dash: [3, 3] });
          S.line(C[0], C[1], D[0], D[1], { color: 'orange', width: 1, dash: [3, 3] });
          S.curve(g, 0, 3, { n: 600, color: 'accent', width: 3 });
          // one-sided tangents at the corners
          for (const [sj, P] of [[1, B], [2, D]]) {
            const l = dg(sj, -1), r = dg(sj, 1), ln = Math.hypot(...l) || 1, rn = Math.hypot(...r) || 1;
            S.arrow(P[0], P[1], P[0] + 0.45 * l[0] / ln, P[1] + 0.45 * l[1] / ln, { color: 'purple', width: 1.6, head: 7 });
            S.arrow(P[0], P[1], P[0] + 0.45 * r[0] / rn, P[1] + 0.45 * r[1] / rn, { color: 'teal', width: 1.6, head: 7 });
          }
          const t = 3 * ((time % 6) / 6), p = g(t), d = dg(t);
          S.arrow(p[0], p[1], p[0] + 0.3 * d[0], p[1] + 0.3 * d[1], { color: 'gold', width: 2.2, head: 9 });
          S.dot(p[0], p[1], { color: 'gold', r: 6 });
          S.tex("\\gamma'(t)", p[0] + 0.3 * d[0], p[1] + 0.3 * d[1], { color: 'gold', size: 14, dx: 14, dy: -8 });
          if (closed.value) S.corner('closed: γ(β) = γ(α)', 'tr', { color: 'green', weight: 600 });
          else S.corner('not closed: γ(β) ≠ γ(α)', 'tr', { color: 'red', weight: 600 });
          // speed graph
          const sp = (tt) => Math.hypot(...dg(tt));
          const ymax = Math.max(sp(0), sp(2.5), ...[0, 0.25, 0.5, 0.75, 1].map((s) => sp(1 + s))) * 1.25;
          T.setView(null, [0, Math.max(0.5, ymax)]);
          for (const [a, b] of [[0, 1], [1, 2], [2, 3]]) T.fn(sp, { domain: [a + 1e-9, b - 1e-9], color: 'accent', width: 2.4 });
          T.vline(1, { color: 'faint', dash: [3, 3] }); T.vline(2, { color: 'faint', dash: [3, 3] });
          for (const sj of [1, 2]) { T.dot(sj, Math.hypot(...dg(sj, -1)), { color: 'purple', r: 4.5 }); T.dot(sj, Math.hypot(...dg(sj, 1)), { color: 'teal', r: 4.5, hollow: true }); }
          T.vline(t, { color: 'gold', width: 1.5 });
          T.dot(t, sp(t), { color: 'gold', r: 5 });
          st = { t, p, d };
          v.legend([['accent', 'the path $\\gamma$'], ['gold', "$\\gamma(t)$ and velocity $\\gamma'(t)$", { dot: true }], ['purple', "left derivative $\\gamma'(s_j^-)$"], ['teal', "right derivative $\\gamma'(s_j^+)$"]]);
        }, { period: 6 });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$t = ${v.fix(s.t, 2)}$, $\\;\\gamma(t) = ${v.fix(s.p[0], 2)} ${s.p[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(s.p[1]), 2)}i$, $\\;\\gamma'(t) = ${v.fix(s.d[0], 2)} ${s.d[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(s.d[1]), 2)}i$.`;
        });
      },
    },
    {
      num: '10.9',
      kind: 'Definition',
      name: 'Integration over a path',
      verify: true,
      statement: String.raw`If $\gamma$ is a path with parameter interval $[\alpha,\beta]$ and $f$ is a continuous complex function on $\gamma^*$, the **integral of $f$ over $\gamma$** is
$$\int_\gamma f(z)\,dz=\int_\alpha^\beta f(\gamma(t))\,\gamma'(t)\,dt .$$
It does not change under a $C^1$ reparametrization $\gamma\circ\varphi$ with $\varphi$ an increasing map of an interval onto $[\alpha,\beta]$; reversing the direction changes its sign; and
$$\Bigl|\int_\gamma f(z)\,dz\Bigr|\le\|f\|_{\infty}\,\int_\alpha^\beta|\gamma'(t)|\,dt,$$
where $\|f\|_\infty$ is the maximum of $|f|$ on $\gamma^*$ and the last integral is the length of $\gamma$. Standard paths: the positively oriented circle $\gamma(t)=a+re^{it}$ $(0\le t\le2\pi)$, the oriented segment $[a,b]$, and for a triangle $\partial\Delta=[a,b]+[b,c]+[c,a]$.`,
      idea: String.raw`The definition pulls the integral back to the parameter interval, where it is an ordinary Riemann integral of a piecewise continuous function (pma-6.23). The substitution rule gives invariance under reparametrization, and the estimate is pma-6.25 applied to $f(\gamma)\gamma'$. Equivalently $\int_\gamma f$ is a limit of sums $\sum f(\zeta_k)(z_{k+1}-z_k)$ over points $z_k$ marching along $\gamma$.`,
      caption: String.raw`Drag $a$, $b$ and the bend $c$ of the path $[a,c]+[c,b]$, and change the number of sample points. On the right the products $f(\zeta_k)\,\Delta z_k$ are laid head to tail; their sum approaches $\int_\gamma f(z)\,dz$ (green), which always lies in the orange disc of radius $\|f\|_\infty\cdot\text{length}(\gamma)$. For $z^2$ moving $c$ does not change the integral; for $\bar z$ it does.`,
      deps: ['rca-10.8', 'pma-6.23'],
      see: ['pma-6.25'],
      tags: ['path integral'],
      viz(v) {
        const { Cx } = v.M;
        const one = new Cx(1, 0);
        const FN = {
          sq: { label: '$z^2$', f: (z) => z.mul(z) },
          conj: { label: '$\\bar z$', f: (z) => z.conj() },
          inv: { label: '$1/z$', f: (z) => one.div(z), pole: true },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const nS = v.slider('sample points per segment', 1, 40, 3, { int: true });
        const L = v.stage({ x: [-2, 2], y: [-1.5, 1.5], equal: true, height: 340, title: 'the path $\\gamma=[a,c]+[c,b]$ over the phase of $f$' });
        const R = v.stage({ x: [-3, 3], y: [-2, 2], equal: true, height: 340, title: '$\\sum_k f(\\zeta_k)\\,\\Delta z_k$ laid head to tail' });
        const a = L.handle(-1.3, -0.7, { color: 'ink', label: 'a', labelPos: 'sw' });
        const c = L.handle(0.2, 1.1, { color: 'orange', label: 'c', labelPos: 'n' });
        const b = L.handle(1.4, -0.4, { color: 'ink', label: 'b', labelPos: 'se' });
        let st = null;
        v.render(() => {
          const key = which.value, F = FN[key].f, n = nS.value;
          const A = new Cx(a.x, a.y), B = new Cx(b.x, b.y), C = new Cx(c.x, c.y);
          const segs = [[A, C], [C, B]];
          L.domain(F, { key, alpha: 0.5 });
          if (FN[key].pole) xMark(L, 0, 0);
          // exact value (composite Gauss) and length / sup norm
          let I = new Cx(0, 0), len = 0, sup = 0;
          for (const [u, w] of segs) {
            const d = w.sub(u); len += d.abs();
            for (let j = 0; j < 64; j++) for (const [x, wt] of GL5) { const z = u.add(d.scale((j + x) / 64)); const fz = F(z); I = I.add(fz.mul(d).scale(wt / 64)); sup = Math.max(sup, fz.abs()); }
          }
          // Riemann sum, tagged at the midpoints of the sub-segments
          const chain = [[0, 0]]; let Sm = new Cx(0, 0); const tags = [];
          for (const [u, w] of segs) {
            const d = w.sub(u).scale(1 / n);
            for (let k = 0; k < n; k++) { const z0 = u.add(d.scale(k + 0.5)); tags.push(z0); Sm = Sm.add(F(z0).mul(d)); chain.push([Sm.re, Sm.im]); }
          }
          // left panel drawing
          for (const [u, w] of segs) { L.line(u.re, u.im, w.re, w.im, { color: 'panel', width: 6 }); L.line(u.re, u.im, w.re, w.im, { color: 'ink', width: 2.6 }); }
          for (const [u, w] of segs) { const m = u.add(w).scale(0.5), m2 = u.add(w.sub(u).scale(0.56)); L.arrow(m.re, m.im, m2.re, m2.im, { color: 'ink', head: 11 }); }
          L.dots(tags.map((z) => [z.re, z.im]), { color: 'gold', r: 3.6 });
          // right panel
          const ML = sup * len;
          const span = Math.max(0.8, Math.abs(I.re) * 1.3, Math.abs(I.im) * 1.7, ...chain.map((p) => Math.max(Math.abs(p[0]) * 1.15, Math.abs(p[1]) * 1.5)));
          R.setView([-span * 1.25, span * 1.25], [-span, span]);
          if (ML < span * 1.5) R.circle(0, 0, ML, { color: 'orange', width: 1.6, dash: [6, 4], fill: 'orange', fillAlpha: 0.07 });
          for (let k = 0; k + 1 < chain.length; k++) R.arrow(chain[k][0], chain[k][1], chain[k + 1][0], chain[k + 1][1], { color: 'gold', width: 1.8, head: Math.min(9, 4 + 40 / chain.length) });
          R.dot(0, 0, { color: 'muted', r: 3.5 });
          R.dot(I.re, I.im, { color: 'green', r: 8, hollow: true, width: 2.4, label: '∫γ f', labelPos: 'ne' });
          R.dot(Sm.re, Sm.im, { color: 'gold', r: 4.5 });
          if (ML < span * 1.2) R.tex('\\|f\\|_\\infty\\cdot\\ell(\\gamma)', ML * 0.71, -ML * 0.71, { color: 'orange', size: 13, align: 'left', dx: 6, dy: 10 });
          if (ML >= span * 1.5) R.corner('the disc of radius ‖f‖∞·ℓ(γ) contains this whole view', 'tl', { color: 'orange', weight: 600 });
          st = { I, Sm, len, sup, ML };
          v.legend([['gold', 'terms $f(\\zeta_k)\\Delta z_k$ and the sample points $\\zeta_k$'], ['green', '$\\int_\\gamma f(z)\\,dz$', { dot: true }], ['orange', 'disc of radius $\\|f\\|_\\infty\\,\\ell(\\gamma)$', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const T = (w) => w.toString(4).replace('i', '\\,i');
          return `Sum $= ${T(s.Sm)}$, $\\;\\int_\\gamma f = ${T(s.I)}$; $\\;|\\int_\\gamma f| = ${v.fix(s.I.abs(), 3)} \\le \\|f\\|_\\infty\\,\\ell(\\gamma) = ${v.fix(s.sup, 3)}\\times${v.fix(s.len, 3)} = ${v.fix(s.ML, 3)}$.`;
        });
      },
    },
    {
      num: '10.10',
      kind: 'Theorem',
      name: 'The index of a closed path',
      statement: String.raw`Let $\gamma$ be a closed path and let $\Omega=\C\setminus\gamma^*$. For $z\in\Omega$ define
$$\Ind_\gamma(z)=\frac{1}{2\pi i}\int_\gamma\frac{d\zeta}{\zeta-z}.$$
Then $\Ind_\gamma$ is an integer-valued function on $\Omega$, constant on each component of $\Omega$, and equal to $0$ on the unbounded component of $\Omega$. It is called the **index** of $z$ with respect to $\gamma$ (the winding number).`,
      idea: String.raw`With $\varphi(t)=\exp\int_\alpha^t\frac{\gamma'(s)}{\gamma(s)-z}\,ds$ one checks that $\varphi/(\gamma-z)$ has derivative $0$, so $\varphi(t)=\frac{\gamma(t)-z}{\gamma(\alpha)-z}$ and $\varphi(\beta)=1$. Hence $2\pi i\Ind_\gamma(z)$ is a number whose exponential is $1$ — an integer multiple of $2\pi i$ (rca-0.6). By 10.7, $\Ind_\gamma$ is holomorphic, in particular continuous, on $\Omega$; a continuous integer-valued function is constant on connected sets; and $|\Ind_\gamma(z)|<1$ for large $|z|$ forces the value $0$ on the unbounded component.`,
      caption: String.raw`Drag the small control points to reshape the closed path (try making more loops) and drag the probe $z$. Regions are tinted by their index: blue for positive, red for negative, deeper for larger $|\Ind_\gamma|$, untinted where it is $0$. As the gold point runs once around $\gamma$, the right panel accumulates the turning of the vector $\gamma(t)-z$, counted in full turns; it always ends on an integer — the index.`,
      deps: ['rca-10.9', 'rca-10.7', 'rca-0.6'],
      see: ['pma-8.8'],
      tags: ['index', 'winding number'],
      viz(v) {
        const { TAU } = v.M;
        const S = v.stage({ x: [-2.4, 2.4], y: [-1.55, 1.55], equal: true, height: 360, weight: 1.45, ticks: false, title: 'components of $\\C\\setminus\\gamma^*$ tinted by $\\Ind_\\gamma$' });
        const R = v.stage({ x: [0, 1.04], y: [-0.5, 2.5], height: 360, axes: 'box', xlabel: 't', xticks: [0.25, 0.5, 0.75, 1], title: 'turning of $\\gamma(t)-z$ (full turns)' });
        const init = [[1.25, 0], [0.55, 0.95], [-0.45, 0.62], [-0.15, -0.25], [0.3, 0], [-0.15, 0.25], [-0.45, -0.62], [0.55, -0.95]].map(([x, y]) => [1.35 * x - 0.15, 1.3 * y]);
        const P = init.map(([x, y]) => S.handle(x, y, { color: 'ink', r: 5.5 }));
        const z = S.handle(0.02, -0.16, { color: 'gold', label: 'z', labelPos: 'se' });
        let cache = { key: null, labels: [] }, st = null;
        v.animate((time) => {
          const pts = catmullClosed(P.map((h) => [h.x, h.y]), 48), n = pts.length - 1;
          const key = P.map((h) => h.x.toFixed(4) + ',' + h.y.toFixed(4)).join(';') + '|' + S.bounds.x + S.bounds.y;
          const blue = v.rgb('blue'), red = v.rgb('red'), bg = v.rgb('panel');
          S.raster((x, y) => {
            const w = windPoly(pts, x, y); if (!w) return null;
            const c = w > 0 ? blue : red, al = Math.min(0.62, 0.2 + 0.17 * (Math.abs(w) - 1));
            return [bg[0] + (c[0] - bg[0]) * al, bg[1] + (c[1] - bg[1]) * al, bg[2] + (c[2] - bg[2]) * al, 255];
          }, { key, res: 3 });
          if (cache.key !== key) {
            const best = new Map(); const { x: [x0, x1], y: [y0, y1] } = S.bounds;
            for (let i = 1; i < 46; i++) for (let j = 1; j < 30; j++) {
              const x = x0 + (x1 - x0) * i / 46, y = y0 + (y1 - y0) * j / 30, w = windPoly(pts, x, y), d = distPoly(pts, x, y);
              const score = Math.min(d, 0.45) - 0.02 * Math.hypot(x, y);   // well inside the region, but not off in a corner
              if (!best.has(w) || best.get(w).score < score) best.set(w, { x, y, d, score });
            }
            cache = { key, labels: [...best.entries()] };
          }
          S.path(pts, { color: 'panel', width: 6 });
          S.path(pts, { color: 'ink', width: 2.4 });
          pathArrows(S, pts, [0.06, 0.31, 0.56, 0.81]);
          for (const [w, p] of cache.labels) if (p.d > 0.1 && Math.hypot(p.x - z.x, p.y - z.y) > 0.14) S.text(`${w}`, p.x, p.y, { color: w > 0 ? 'blue' : w < 0 ? 'red' : 'muted', size: 17, weight: 700, align: 'center' });
          // the probe and the turning vector
          const fr = (time % 6) / 6, k = Math.min(n, Math.round(fr * n)), zeta = pts[k];
          const dOn = distPoly(pts, z.x, z.y);
          S.line(z.x, z.y, zeta[0], zeta[1], { color: 'gold', width: 1.6, dash: [5, 4] });
          S.dot(zeta[0], zeta[1], { color: 'gold', r: 5.5 });
          // cumulative turning
          const turn = [[0, 0]]; let acc = 0, prev = Math.atan2(pts[0][1] - z.y, pts[0][0] - z.x);
          for (let i = 1; i <= n; i++) {
            const ang = Math.atan2(pts[i][1] - z.y, pts[i][0] - z.x); let d = ang - prev;
            if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; acc += d; prev = ang; turn.push([i / n, acc / TAU]);
          }
          const lo = Math.min(-0.5, ...turn.map((p) => p[1])) - 0.2, hi = Math.max(1.5, ...turn.map((p) => p[1])) + 0.3;
          R.setView(null, [lo, hi]);
          R.setTicks(null, Array.from({ length: 13 }, (_, i) => i - 6).filter((m) => m >= lo && m <= hi));
          for (let m = Math.ceil(lo); m <= hi; m++) R.hline(m, { color: m ? 'faint' : 'muted', width: 1, dash: m ? [3, 4] : null });
          R.path(turn, { color: 'gold', width: 1.4, alpha: 0.35 });
          R.path(turn.slice(0, k + 1), { color: 'gold', width: 2.6 });
          R.dot(fr, turn[k][1], { color: 'gold', r: 5 });
          const final = turn[n][1];
          R.dot(1, final, { color: final > 0.5 ? 'blue' : final < -0.5 ? 'red' : 'muted', r: 7, hollow: true, width: 2.4 });
          // the defining integral, numerically (midpoint rule on the polyline)
          let re = 0, im = 0;
          for (let i = 0; i < n; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2 - z.x, my = (pts[i][1] + pts[i + 1][1]) / 2 - z.y, dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], q = mx * mx + my * my; re += (dx * mx + dy * my) / q; im += (dy * mx - dx * my) / q; }
          st = { ind: windPoly(pts, z.x, z.y), val: [im / TAU, -re / TAU], dOn };
          v.legend([['ink', 'closed path $\\gamma$'], ['blue', '$\\Ind_\\gamma>0$', { area: true }], ['red', '$\\Ind_\\gamma<0$', { area: true }], ['gold', 'probe $z$ and the vector $\\gamma(t)-z$']]);
        }, { period: 6 });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.dOn < 0.02) return 'The probe is on $\\gamma^*$, where the index is not defined.';
          return `$\\dfrac{1}{2\\pi i}\\displaystyle\\int_\\gamma\\frac{d\\zeta}{\\zeta-z} = ${v.fix(s.val[0], 4)} ${s.val[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(s.val[1]), 4)}\\,i$ $\\;\\Rightarrow\\;\\Ind_\\gamma(z) = ${s.ind}$.`;
        });
      },
    },
    {
      num: '10.11',
      kind: 'Theorem',
      name: 'The index with respect to a circle',
      statement: String.raw`If $\gamma$ is the positively oriented circle with center $a$ and radius $r$, then
$$\Ind_\gamma(z)=\begin{cases}1&\text{if }|z-a|<r,\\ 0&\text{if }|z-a|>r.\end{cases}$$`,
      idea: String.raw`By 10.10 the index is constant on the open disc and $0$ outside the closed disc, so it suffices to compute it at the center: with $\gamma(t)=a+re^{it}$, the integrand $\frac{1}{2\pi i}\frac{\gamma'(t)}{\gamma(t)-a}$ is the constant $\frac{1}{2\pi}$, whose integral over $[0,2\pi]$ is $1$.`,
      caption: String.raw`Drag the center $a$, the radius handle and the point $z$. The right panel graphs the integrand $\frac{1}{2\pi i}\frac{\gamma'(t)}{\gamma(t)-z}$ over $0\le t\le2\pi$: its real part's signed area (green above, red below the axis) is the index, the imaginary part integrates to $0$. With $z=a$ the real part is the flat line $1/2\pi$; moving $z$ inside reshapes it without changing the area, crossing the circle flips the area to $0$.`,
      deps: ['rca-10.10'],
      tags: ['index', 'winding number'],
      viz(v) {
        const { Cx, TAU, PI } = v.M;
        const S = v.stage({ x: [-2, 2], y: [-1.55, 1.55], equal: true, height: 340, ticks: false, title: 'the circle $\\gamma(t)=a+re^{it}$, $0\\le t\\le 2\\pi$' });
        const R = v.stage({ x: [0, TAU], y: [-0.5, 1], height: 340, axes: true, xticks: [[PI / 2, 'π/2'], [PI, 'π'], [1.5 * PI, '3π/2'], [TAU, '2π']], xlabel: 't', title: 'the integrand $\\frac{1}{2\\pi i}\\frac{\\gamma\'(t)}{\\gamma(t)-z}$' });
        const a = S.handle(-0.2, 0, { color: 'ink', label: 'a', labelPos: 'sw' });
        const rh = S.handle(0.9, 0, { color: 'gray', r: 6 });
        const z = S.handle(0.35, 0.4, { color: 'accent', label: 'z', labelPos: 'ne' });
        let prev = [a.x, a.y];
        a.onDrag = () => { rh.x += a.x - prev[0]; rh.y += a.y - prev[1]; prev = [a.x, a.y]; };
        let st = null;
        v.animate((time) => {
          prev = [a.x, a.y];
          const ac = new Cx(a.x, a.y), r = Math.max(0.2, Math.hypot(rh.x - a.x, rh.y - a.y)), zc = new Cx(z.x, z.y);
          const q = (t) => Cx.polar(r, t).div(ac.add(Cx.polar(r, t)).sub(zc)).scale(1 / TAU);
          const inside = zc.sub(ac).abs() < r;
          S.circle(ac.re, ac.im, r, { fill: 'blue', fillAlpha: 0.1, stroke: false });
          S.circle(ac.re, ac.im, r, { color: 'ink', width: 2.4 });
          for (const t of [0.6, 2.7, 4.8]) { const p = ac.add(Cx.polar(r, t)), p2 = ac.add(Cx.polar(r, t + 0.2)); S.arrow(p.re, p.im, p2.re, p2.im, { color: 'ink', head: 12, width: 2.4 }); }
          S.text('Ind = 1', ac.re, ac.im - r * 0.55, { color: 'blue', align: 'center', size: 13, weight: 600 });
          S.text('Ind = 0', S.bounds.x[1] - 0.1, S.bounds.y[0] + 0.15, { color: 'muted', align: 'right', size: 13, weight: 600 });
          const t = TAU * ((time % 6) / 6), g = ac.add(Cx.polar(r, t));
          S.line(zc.re, zc.im, g.re, g.im, { color: 'gold', width: 1.5, dash: [5, 4] });
          S.dot(g.re, g.im, { color: 'gold', r: 5.5, label: 'γ(t)', labelPos: 'ne' });
          // integrand plot
          const N = 600; let I = new Cx(0, 0), mx = 0;
          const vals = [];
          for (let k = 0; k <= N; k++) { const w = q(TAU * k / N); vals.push(w); mx = Math.max(mx, Math.abs(w.re), Math.abs(w.im)); }
          for (let k = 0; k < N; k++) I = I.add(q(TAU * (k + 0.5) / N).scale(TAU / N));
          const top = Math.min(6, Math.max(0.3, mx * 1.15));
          R.setView(null, [-top * 0.75, top]);
          const re = (s) => q(s).re;
          R.fn((s) => Math.max(0, re(s)), { domain: [0, TAU], fill: 'green', fillAlpha: 0.25, color: 'green', width: 0.01, n: 400 });
          R.fn((s) => Math.min(0, re(s)), { domain: [0, TAU], fill: 'red', fillAlpha: 0.25, color: 'red', width: 0.01, n: 400 });
          R.fn(re, { domain: [0, TAU], color: 'ink', width: 2.2, n: 600 });
          R.fn((s) => q(s).im, { domain: [0, TAU], color: 'purple', width: 1.6, dash: [5, 4], n: 600 });
          R.hline(1 / TAU, { color: 'blue', width: 1, dash: [2, 4] });
          R.text('1/2π', PI, 1 / TAU, { color: 'blue', size: 11.5, align: 'center', dy: -9 });
          R.vline(t, { color: 'gold', width: 1.2 });
          R.dot(t, re(t), { color: 'gold', r: 4.5 });
          st = { I, inside, d: zc.sub(ac).abs(), r };
          v.legend([['ink', 'real part'], ['purple', 'imaginary part', { dash: true }], ['green', 'positive area', { area: true }], ['red', 'negative area', { area: true }]]);
        }, { period: 6 });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (Math.abs(s.d - s.r) < 0.03) return 'The point $z$ is on the circle, where the index is undefined.';
          const z4 = (x) => v.fix(Math.abs(x) < 5e-5 ? 0 : x, 4);
          return `$|z-a| = ${v.fix(s.d, 3)}$ ${s.inside ? '<' : '>'} $r = ${v.fix(s.r, 3)}$: $\\;\\int_0^{2\\pi}\\Re = ${z4(s.I.re)}$, $\\;\\int_0^{2\\pi}\\Im = ${z4(s.I.im)}$, so $\\Ind_\\gamma(z) = ${Math.round(s.I.re)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ the local Cauchy theorem
    {
      num: '10.12',
      kind: 'Theorem',
      name: 'Integrals of derivatives over closed paths vanish',
      statement: String.raw`Suppose $F\in H(\Omega)$ and $F'$ is continuous in $\Omega$. Then
$$\int_\gamma F'(z)\,dz=0$$
for every closed path $\gamma$ in $\Omega$.`,
      idea: String.raw`By the chain rule $(F\circ\gamma)'(t)=F'(\gamma(t))\gamma'(t)$ on each piece of the parameter interval, so the fundamental theorem of calculus gives $\int_\gamma F'(z)\,dz=F(\gamma(\beta))-F(\gamma(\alpha))$, which is $0$ because $\gamma$ is closed. (Continuity of $F'$ is assumed only so that the integral is a Riemann integral; 10.16 will show it is automatic.)`,
      caption: String.raw`Drag the five control points of the closed path. On the right the gold curve is the running integral $\int_{\gamma|[0,t]}f(z)\,dz$; when $f=F'$ it coincides with $F(\gamma(t))-F(\gamma(0))$ (green dashes) and therefore returns to $0$. $1/z$ and $\bar z$ have no primitive: around the origin $1/z$ leaves the gap $2\pi i\,\Ind_\gamma(0)$, and $\bar z$ leaves $2i$ times the signed area enclosed.`,
      deps: ['rca-10.9', 'rca-10.2', 'pma-6.24'],
      tags: ['Cauchy', 'path integral', 'primitive'],
      viz(v) {
        const { Cx } = v.M;
        const one = new Cx(1, 0);
        const FN = {
          cube: { label: "$3z^2=(z^3)'$", f: (z) => z.mul(z).scale(3), F: (z) => z.pow(3) },
          exp: { label: "$e^z=(e^z)'$", f: (z) => z.exp(), F: (z) => z.exp() },
          isq: { label: "$-z^{-2}=(1/z)'$", f: (z) => one.div(z.mul(z)).neg(), F: (z) => one.div(z), pole: true },
          inv: { label: '$1/z$', f: (z) => one.div(z), pole: true },
          conj: { label: '$\\bar z$', f: (z) => z.conj() },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'cube');
        const L = v.stage({ x: [-2, 2], y: [-1.5, 1.5], equal: true, height: 340, ticks: false, title: 'a closed path $\\gamma$ over the phase of $f$' });
        const R = v.stage({ x: [-2, 2], y: [-1.5, 1.5], equal: true, height: 340, title: 'running integral $\\int_{\\gamma|[0,t]} f(z)\\,dz$' });
        const P = [[0.9, 0.1], [0.45, 0.95], [-0.7, 0.75], [-0.85, -0.55], [0.35, -0.8]].map(([x, y]) => L.handle(x, y, { color: 'ink', r: 5.5 }));
        let st = null;
        v.animate((time) => {
          const key = which.value, F = FN[key];
          const pts = catmullClosed(P.map((h) => [h.x, h.y]), 60), n = pts.length - 1;
          L.domain(F.f, { key, alpha: 0.55 });
          if (F.pole) xMark(L, 0, 0);
          L.path(pts, { color: 'panel', width: 6 }); L.path(pts, { color: 'ink', width: 2.4 });
          pathArrows(L, pts, [0.1, 0.43, 0.76]);
          const run = [[0, 0]]; let I = new Cx(0, 0);
          for (let i = 0; i < n; i++) {
            const u = new Cx(pts[i][0], pts[i][1]), w = new Cx(pts[i + 1][0], pts[i + 1][1]), d = w.sub(u);
            for (const [x, wt] of GL5) I = I.add(F.f(u.add(d.scale(x))).mul(d).scale(wt));
            run.push([I.re, I.im]);
          }
          const prim = F.F ? pts.map((p) => { const w = F.F(new Cx(p[0], p[1])).sub(F.F(new Cx(pts[0][0], pts[0][1]))); return [w.re, w.im]; }) : null;
          const all = run.concat(prim || []);
          const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
          const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
          const hw = Math.max(1, (Math.max(...xs) - Math.min(...xs)) * 0.6, (Math.max(...ys) - Math.min(...ys)) * 0.6 * 1.33);
          R.setView([cx - hw, cx + hw], [cy - hw / 1.33, cy + hw / 1.33]);
          const k = Math.min(n, Math.round(((time % 6) / 6) * n));
          R.path(run, { color: 'gold', width: 1.4, alpha: 0.4 });
          R.path(run.slice(0, k + 1), { color: 'gold', width: 4 });
          if (prim) R.path(prim, { color: 'green', width: 1.8, dash: [6, 5] });
          R.dot(run[k][0], run[k][1], { color: 'gold', r: 5 });
          R.dot(0, 0, { color: 'ink', r: 4, label: '0', labelPos: 'sw' });
          const closedUp = I.abs() < 1e-6;
          R.dot(I.re, I.im, { color: closedUp ? 'green' : 'red', r: 8, hollow: true, width: 2.4, label: closedUp ? '' : '∮ f', labelPos: 'ne' });
          L.dot(pts[k][0], pts[k][1], { color: 'gold', r: 5.5 });
          let wind = 0; if (F.pole) wind = windPoly(pts, 0, 0);
          let area = 0; for (let i = 0; i < n; i++) area += (pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1]) / 2;
          R.corner(closedUp ? 'returns to 0: ∮γ F′ = F(end) − F(start) = 0' : 'does not return to 0', 'tl', { color: closedUp ? 'green' : 'red', weight: 600 });
          st = { I, key, wind, area };
          v.legend(F.F ? [['gold', 'running integral'], ['green', '$F(\\gamma(t))-F(\\gamma(0))$', { dash: true }]] : [['gold', 'running integral'], ['red', 'value of $\\oint_\\gamma f$', { dot: true }]]);
        }, { period: 6 });
        v.readout(() => {
          const s = st; if (!s) return '';
          const val = `$\\oint_\\gamma f(z)\\,dz = ${s.I.toString(4).replace('i', '\\,i')}$`;
          if (s.key === 'inv') return `${val} $= 2\\pi i\\cdot\\Ind_\\gamma(0)$ with $\\Ind_\\gamma(0) = ${s.wind}$: no primitive of $1/z$ exists in $\\C\\setminus\\{0\\}$.`;
          if (s.key === 'conj') return `${val} $= 2i\\cdot(\\text{signed area} = ${v.fix(s.area, 4)})$: $\\bar z$ is not a derivative.`;
          return `${val} — zero up to rounding, because $f=F'$ with $F$ holomorphic along $\\gamma$.`;
        });
      },
    },
    {
      num: '10.12a',
      kind: 'Corollary',
      name: 'Closed-path integrals of zⁿ vanish for n ≠ −1',
      statement: String.raw`For every closed path $\gamma$,
$$\int_\gamma z^n\,dz=0\qquad(n=0,1,2,\dots),$$
and the same holds for $n=-2,-3,-4,\dots$ provided $0\notin\gamma^*$.`,
      idea: String.raw`For $n\ne-1$, $z^n$ is the derivative of $z^{n+1}/(n+1)$, which is holomorphic in $\C$ (for $n\ge0$) or in $\C\setminus\{0\}$ (for $n\le-2$); apply 10.12. The exponent $n=-1$ is the exception: $1/z$ has no primitive in $\C\setminus\{0\}$, and $\frac{1}{2\pi i}\int_\gamma\frac{dz}{z}=\Ind_\gamma(0)$.`,
      caption: String.raw`Drag the center and the size handle, and pick a path. The bars show $\frac{1}{2\pi i}\int_\gamma z^n\,dz$ (real part blue, imaginary part orange) for $n=-5,\dots,5$, computed numerically. Every bar vanishes except at $n=-1$, where the bar equals $\Ind_\gamma(0)$: $1$, $2$ when the circle is run twice, $\pm1$ or $0$ for the figure eight, depending on where $0$ sits.`,
      deps: ['rca-10.12'],
      see: ['rca-10.10'],
      tags: ['path integral', 'index'],
      viz(v) {
        const { Cx, TAU, contourIntegral } = v.M;
        const pw = (z, n) => (n >= 0 ? z.pow(n) : new Cx(1, 0).div(z.pow(-n)));
        const nS = v.slider('exponent $n$ shown on the left', -5, 5, -1, { int: true });
        const kind = v.select('path', [{ value: 'once', label: 'circle' }, { value: 'twice', label: 'circle, twice' }, { value: 'eight', label: 'figure eight' }], 'once');
        const L = v.stage({ x: [-2, 2], y: [-1.5, 1.5], equal: true, height: 330, ticks: false, title: 'the path over the phase of $z^n$' });
        const R = v.stage({ x: [-5.7, 5.7], y: [-2.5, 2.5], height: 330, axes: true, xticks: [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5], title: '$\\frac{1}{2\\pi i}\\int_\\gamma z^n\\,dz$ for $n=-5,\\dots,5$' });
        const c = L.handle(0.35, 0.15, { color: 'ink', label: 'c', labelPos: 'ne' });
        const sz = L.handle(1.35, 0.15, { color: 'gray', r: 6 });
        let prev = [c.x, c.y];
        c.onDrag = () => { sz.x += c.x - prev[0]; sz.y += c.y - prev[1]; prev = [c.x, c.y]; };
        let st = null, lastK = null;
        v.render(() => {
          if (lastK !== kind.value) {   // place each path so that 0 starts off the path (inside a lobe for the figure eight)
            if (kind.value === 'eight') { c.set(0.95, 0.1); sz.set(1.95, 0.1); } else if (lastK === 'eight') { c.set(0.35, 0.15); sz.set(1.35, 0.15); }
            lastK = kind.value;
          }
          prev = [c.x, c.y];
          const ctr = new Cx(c.x, c.y), rho = Math.max(0.2, Math.hypot(sz.x - c.x, sz.y - c.y)), K = kind.value, nShow = nS.value;
          const g = (t) => {
            if (K === 'once') return ctr.add(Cx.polar(rho, TAU * t));
            if (K === 'twice') return ctr.add(Cx.polar(rho, 2 * TAU * t));
            const th = TAU * t; return ctr.add(new Cx(1.4 * rho * Math.sin(th), 0.8 * rho * Math.sin(th) * Math.cos(th)));
          };
          L.domain((z) => pw(z, nShow), { key: 'n' + nShow, alpha: 0.55 });
          const pts = Array.from({ length: 801 }, (_, i) => { const w = g(i / 800); return [w.re, w.im]; });
          let d0 = Infinity; for (const p of pts) d0 = Math.min(d0, Math.hypot(p[0], p[1]));
          L.path(pts, { color: 'panel', width: 6 }); L.path(pts, { color: 'ink', width: 2.4 });
          pathArrows(L, pts, K === 'eight' ? [0.12, 0.62] : [0.05, 0.38, 0.71]);
          L.dot(0, 0, { color: 'red', r: 5, label: '0', labelPos: 'sw' });
          const vals = [];
          for (let n = -5; n <= 5; n++) {
            if (n < 0 && d0 < 0.05) { vals.push(null); continue; }
            const I = contourIntegral((z) => pw(z, n), g, 1600).div(new Cx(0, TAU));
            vals.push(I);
          }
          R.vband(nShow - 0.45, nShow + 0.45, { color: 'gold', alpha: 0.12 });
          vals.forEach((I, i) => {
            const n = i - 5; if (!I) { R.text('—', n, 0.25, { color: 'red', align: 'center' }); return; }
            R.dot(n - 0.18, Math.max(-2.4, Math.min(2.4, I.re)), { color: 'blue', r: 3 });
            R.dot(n + 0.18, Math.max(-2.4, Math.min(2.4, I.im)), { color: 'orange', r: 3 });
            const cl = (x) => Math.max(-2.4, Math.min(2.4, x));
            R.rect(n - 0.34, 0, n - 0.02, cl(I.re), { fill: 'blue', fillAlpha: 0.8, stroke: false });
            R.rect(n + 0.02, 0, n + 0.34, cl(I.im), { fill: 'orange', fillAlpha: 0.8, stroke: false });
          });
          const m1 = vals[4];
          if (m1) R.text(`${Math.round(m1.re)} = Ind(0)`, -1, m1.re >= 0 ? Math.min(2.4, m1.re) + 0.22 : Math.max(-2.4, m1.re) - 0.22, { color: 'blue', align: 'center', size: 12, weight: 600 });
          if (d0 < 0.05) R.corner('0 lies on γ*: the integrals with n < 0 are undefined', 'tl', { color: 'red', weight: 600 });
          st = { vals, nShow, d0, ind: m1 ? Math.round(m1.re) : null };
          v.legend([['blue', 'real part', { area: true }], ['orange', 'imaginary part', { area: true }], ['red', 'the origin', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const I = s.vals[s.nShow + 5];
          if (!I) return 'The origin lies on the path, so $z^n$ with $n<0$ is not continuous on $\\gamma^*$.';
          return `$n = ${s.nShow}$: $\\;\\frac{1}{2\\pi i}\\int_\\gamma z^{${s.nShow}}\\,dz = ${I.toString(4).replace('i', '\\,i')}$` + (s.nShow === -1 ? ` $= \\Ind_\\gamma(0)$.` : ' — zero, as $z^n$ has the primitive $z^{n+1}/(n+1)$.');
        });
      },
    },
    {
      num: '10.13',
      kind: 'Theorem',
      name: 'Cauchy–Goursat theorem for triangles',
      statement: String.raw`Let $\Delta$ be a closed triangle in a plane open set $\Omega$, let $p\in\Omega$, and let $f$ be continuous on $\Omega$ with $f\in H(\Omega\setminus\{p\})$. Then
$$\int_{\partial\Delta}f(z)\,dz=0 .$$`,
      idea: String.raw`First let $p\notin\Delta$. Joining the midpoints of the sides splits $\Delta$ into four triangles whose boundary integrals add up to $\int_{\partial\Delta}f$ (the inner edges cancel), so one of them, $\Delta_1$, has $|\int_{\partial\Delta_1}f|\ge\frac14|\int_{\partial\Delta}f|$. Repeating gives nested triangles $\Delta_n$ with $|\int_{\partial\Delta}f|\le4^n|\int_{\partial\Delta_n}f|$, shrinking to a point $z_0$ (pma-2.36a). Differentiability at $z_0$ and 10.12a (linear functions integrate to $0$) give $|\int_{\partial\Delta_n}f|\le\eps\,d\,\ell\,4^{-n}$, so $|\int_{\partial\Delta}f|\le\eps\,d\,\ell$ for every $\eps>0$. If $p$ is a vertex, cut off a tiny corner triangle whose contribution is small because $f$ is bounded; other positions of $p$ reduce to this case.`,
      caption: String.raw`Drag the vertices and raise the subdivision level. The gold triangles are Rudin's nested choice $\Delta_0\supset\Delta_1\supset\cdots$ (largest $|\int_{\partial T}f|$ among the four pieces; ties broken toward the gold point $q$); the shading shows $|\int_{\partial T}f|$ on all pieces. Right: on a log scale, $4^j|\int_{\partial\Delta_j}f|$ (gold) against the proof's bound $4^j\eps_jd_j\ell_j$ (orange), which tends to $0$. For $\bar z$ and $|z|^2$ there is no $f'(z_0)$, no bound, and the integral is not $0$.`,
      deps: ['rca-10.12a', 'rca-10.2', 'rca-10.9', 'pma-2.36a'],
      tags: ['Cauchy', 'Goursat', 'triangles'],
      viz(v) {
        const { Cx } = v.M;
        const one = new Cx(1, 0);
        // E1(w) = (e^w − 1)/w and its derivative, via series near 0
        const E1 = (w) => { if (w.abs() > 0.7) return w.exp().sub(one).div(w); let s = new Cx(0, 0), t = one; for (let n = 0; n < 22; n++) { s = s.add(t.scale(1 / v.M.factorial(n + 1))); t = t.mul(w); } return s; };
        const dE1 = (w) => { if (w.abs() > 0.7) return w.exp().mul(w.sub(one)).add(one).div(w.mul(w)); let s = new Cx(0, 0), t = one; for (let n = 1; n < 22; n++) { s = s.add(t.scale(n / v.M.factorial(n + 1))); t = t.mul(w); } return s; };
        const which = v.select('$f$', [
          { value: 'exp', label: '$e^z$' },
          { value: 'gp', label: '$\\frac{e^z-e^p}{z-p}$ (continuous at $p$)' },
          { value: 'conj', label: '$\\bar z$' },
          { value: 'abs2', label: '$|z|^2$' },
        ], 'exp');
        const lev = v.slider('subdivision level $n$', 0, 6, 3, { int: true });
        const L = v.stage({ x: [-1.9, 1.9], y: [-1.45, 1.45], equal: true, height: 360, weight: 1.25, ticks: false, title: 'four-fold subdivision and the nested triangles $\\Delta_j$' });
        const R = v.stage({ x: [-0.3, 6.3], y: [-17, 1], height: 360, axes: 'box', xlabel: 'j', xticks: [0, 1, 2, 3, 4, 5, 6], title: '$\\log_{10}$ of $4^j\\,|\\int_{\\partial\\Delta_j}f|$ and of the bound' });
        const V = [L.handle(-1.5, -1.05, { color: 'ink', label: 'a', labelPos: 'sw' }), L.handle(1.55, -0.8, { color: 'ink', label: 'b', labelPos: 'se' }), L.handle(-0.1, 1.25, { color: 'ink', label: 'c', labelPos: 'n' })];
        const q = L.handle(0.25, -0.2, { color: 'gold', r: 5.5, label: 'q', labelPos: 'e' });
        const pH = L.handle(-0.55, -0.45, { color: 'purple', r: 5.5, label: 'p', labelPos: 'w' });
        const fns = (key, p) => {
          if (key === 'exp') return { f: (z) => z.exp(), d: (z) => z.exp() };
          if (key === 'gp') { const ep = p.exp(); return { f: (z) => ep.mul(E1(z.sub(p))), d: (z) => ep.mul(dE1(z.sub(p))) }; }
          if (key === 'conj') return { f: (z) => z.conj(), d: null };
          return { f: (z) => new Cx(z.abs2(), 0), d: null };
        };
        // ∫ over ∂T by composite 5-point Gauss (sub-intervals of length ≤ 0.12, so big triangles are integrated to rounding accuracy too)
        const triInt = (f, T) => {
          let s = new Cx(0, 0);
          for (let e = 0; e < 3; e++) {
            const u = T[e], w = T[(e + 1) % 3], d = w.sub(u), m = Math.max(1, Math.ceil(d.abs() / 0.12));
            for (let j = 0; j < m; j++) for (const [x, wt] of GL5) s = s.add(f(u.add(d.scale((j + x) / m))).mul(d).scale(wt / m));
          }
          return s;
        };
        const split = (T) => { const [A, B, C] = T, ab = A.add(B).scale(0.5), bc = B.add(C).scale(0.5), ca = C.add(A).scale(0.5); return [[A, ab, ca], [ab, B, bc], [ca, bc, C], [bc, ca, ab]]; };
        const inTri = (T, z) => { const s = (P, Q) => (Q.re - P.re) * (z.im - P.im) - (Q.im - P.im) * (z.re - P.re); const a = s(T[0], T[1]), b = s(T[1], T[2]), c = s(T[2], T[0]); return (a >= 0 && b >= 0 && c >= 0) || (a <= 0 && b <= 0 && c <= 0); };
        let st = null;
        v.render(() => {
          const key = which.value, nL = lev.value, p = new Cx(pH.x, pH.y);
          pH.visible = key === 'gp';
          const { f, d: df } = fns(key, p);
          const T0 = V.map((h) => new Cx(h.x, h.y)), qz = new Cx(q.x, q.y);
          // nested chain (computed deeper than shown, to locate z0)
          const chain = [T0], ints = [triInt(f, T0)];
          for (let j = 1; j <= 14; j++) {
            const kids = split(chain[j - 1]), I = kids.map((T) => triInt(f, T)), A = I.map((w) => w.abs()), m = Math.max(...A);
            // Rudin's choice: a piece with the largest |∫|; ties (all ≈ 0, or all equal) go to the piece containing q
            const tied = A.map((x) => m < 1e-13 * (1 + ints[0].abs()) || x >= m * (1 - 1e-6));
            let pick = kids.findIndex((T, i) => tied[i] && inTri(T, qz));
            if (pick < 0) pick = tied.indexOf(true);
            chain.push(kids[pick]); ints.push(I[pick]);
          }
          const z0 = chain[14].reduce((s, w) => s.add(w), new Cx(0, 0)).scale(1 / 3);
          // shading of all level-n pieces by |∫∂T f|
          let pieces = [T0]; for (let j = 0; j < nL; j++) pieces = pieces.flatMap(split);
          const vals = pieces.map((T) => triInt(f, T).abs()), vmax = Math.max(...vals);
          const scaleRef = Math.max(vmax, 1e-12);
          pieces.forEach((T, i) => {
            const rel = vmax > 1e-12 ? vals[i] / scaleRef : 0;
            L.poly(T.map((w) => [w.re, w.im]), { fill: 'accent', fillAlpha: 0.04 + 0.4 * rel, color: 'muted', width: nL > 4 ? 0.4 : 0.8, alpha: 0.6 });
          });
          for (let j = 1; j <= nL; j++) L.poly(chain[j].map((w) => [w.re, w.im]), { fill: 'gold', fillAlpha: 0.18 + 0.08 * j, color: 'gold', width: 1.6 });
          L.poly(T0.map((w) => [w.re, w.im]), { color: 'ink', width: 2.4 });
          for (let e = 0; e < 3; e++) { const u = T0[e], w = T0[(e + 1) % 3], m = u.add(w).scale(0.5), m2 = u.add(w.sub(u).scale(0.56)); L.arrow(m.re, m.im, m2.re, m2.im, { color: 'ink', head: 11 }); }
          L.dot(z0.re, z0.im, { color: 'red', r: 3.5, label: 'z₀', labelPos: 'nw' });
          // right panel: 4^j |∫∂Δj f| and the bound 4^j ε_j d_j ℓ_j = ε_j d ℓ
          const per = (T) => T[0].sub(T[1]).abs() + T[1].sub(T[2]).abs() + T[2].sub(T[0]).abs();
          const diam = (T) => Math.max(T[0].sub(T[1]).abs(), T[1].sub(T[2]).abs(), T[2].sub(T[0]).abs());
          const d0 = diam(T0), l0 = per(T0);
          const gold = [], orange = [];
          const fz0 = f(z0), dz0 = df ? df(z0) : null;
          for (let j = 0; j <= 6; j++) {
            gold.push([j, Math.max(-16.5, Math.log10(4 ** j * ints[j].abs() + 1e-300))]);
            if (dz0) {
              let eps = 0; const T = chain[j];
              for (let a = 0; a <= 4; a++) for (let b = 0; a + b <= 4; b++) {
                const z = T[0].scale((4 - a - b) / 4).add(T[1].scale(a / 4)).add(T[2].scale(b / 4)), h = z.sub(z0);
                if (h.abs() > 1e-12) eps = Math.max(eps, f(z).sub(fz0).sub(dz0.mul(h)).abs() / h.abs());
              }
              orange.push([j, Math.log10(eps * d0 * l0 + 1e-300)]);
            }
          }
          const I0 = ints[0].abs();
          const ys = gold.map((g) => g[1]).concat(orange.map((o) => o[1]));
          const top = Math.max(1, Math.ceil(Math.max(...ys)) + 0.6), bot = Math.min(-3, Math.floor(Math.min(...ys)) - 0.8);
          R.setView(null, [bot, top]);
          R.setTicks(undefined, Array.from({ length: 40 }, (_, i) => 2 - i).filter((k) => k >= bot && k <= top && (top - bot < 10 || k % 2 === 0)).map((k) => [k, k === 0 ? '1' : `10${k < 0 ? '⁻' : ''}${String(Math.abs(k)).split('').map((dd) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+dd]).join('')}`]));
          if (orange.length) { R.path(orange, { color: 'orange', width: 2.2, dash: [6, 4] }); R.dots(orange, { color: 'orange', r: 3.5 }); }
          R.path(gold, { color: 'gold', width: 2.4 });
          gold.forEach((g, j) => R.dot(g[0], g[1], { color: 'gold', r: j <= nL ? 5 : 3.5, alpha: j <= nL ? 1 : 0.5 }));
          if (Math.max(...gold.map((g) => g[1])) < -11) R.text('≈ rounding error of double precision', 0.05, Math.max(...gold.map((g) => g[1])) + 0.7, { color: 'gold', size: 11.5, align: 'left' });
          st = { I0: ints[0], key, d: !!dz0, z0 };
          v.legend(dz0 ? [['gold', '$4^j\\,|\\int_{\\partial\\Delta_j}f|$'], ['orange', "bound $\\eps_j\\,d\\,\\ell$ with $\\eps_j=\\sup_{\\Delta_j}\\frac{|f(z)-f(z_0)-f'(z_0)(z-z_0)|}{|z-z_0|}$", { dash: true }], ['accent', '$|\\int_{\\partial T}f|$ on the pieces', { area: true }]]
            : [['gold', '$4^j\\,|\\int_{\\partial\\Delta_j}f|$ — does not tend to $0$: there is no $f\'(z_0)$'], ['accent', '$|\\int_{\\partial T}f|$ on the pieces', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const val = `$\\int_{\\partial\\Delta} f(z)\\,dz = ${s.I0.toString(3).replace('i', '\\,i')}$`;
          return s.d ? `${val} — zero to machine precision, as the bound forces.` : `${val}: not zero, since $f$ is not holomorphic (for $\\bar z$ the value is $2i\\cdot\\text{area}(\\Delta)$).`;
        });
      },
    },
  ],
};
