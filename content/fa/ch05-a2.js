// Rudin, Functional Analysis — Chapter 5 (part 2): generalized Stone–Weierstrass, interpolation

// ---------------------------------------------------------------- complex helpers ([re, im] pairs)
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cabs = (a) => Math.hypot(a[0], a[1]);
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cexp = (a) => { const r = Math.exp(a[0]); return [r * Math.cos(a[1]), r * Math.sin(a[1])]; };
const cpow = (a, N) => { const r = Math.pow(cabs(a), N), t = Math.atan2(a[1], a[0]) * N; return [r * Math.cos(t), r * Math.sin(t)]; };
/** Gaussian elimination with partial pivoting for a small complex system A c = b. */
function csolve(A, b) {
  const m = b.length, M = A.map((r, i) => r.map((x) => x.slice()).concat([b[i].slice()]));
  for (let c = 0; c < m; c++) {
    let p = c; for (let r = c + 1; r < m; r++) if (cabs(M[r][c]) > cabs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    if (cabs(M[c][c]) < 1e-300) return null;
    for (let r = 0; r < m; r++) if (r !== c) { const f = cdiv(M[r][c], M[c][c]); for (let k = c; k <= m; k++) M[r][k] = csub(M[r][k], cmul(f, M[c][k])); }
  }
  return M.map((r, i) => cdiv(r[m], r[i]));
}
/** Peak-function interpolant on the circle: F(z) = Σ c_j p_j(z)^N, p_j(z) = (1 + conj(ζ_j) z)/2, with F(ζ_k) = t_k exactly.
 *  Each p_j peaks at ζ_j (|p_j| < 1 elsewhere on the closed disc), so p_j^N concentrates there as N grows. */
function peakInterp(zetas, targets, N) {
  const p = (j, z) => [(1 + zetas[j][0] * z[0] + zetas[j][1] * z[1]) / 2, (zetas[j][0] * z[1] - zetas[j][1] * z[0]) / 2];
  const A = zetas.map((zk) => zetas.map((_, j) => cpow(p(j, zk), N)));
  const c = csolve(A, targets) || targets;
  return { c, F: (z) => { let s = [0, 0]; for (let j = 0; j < zetas.length; j++) s = cadd(s, cmul(c[j], cpow(p(j, z), N))); return s; } };
}
/** Vandermonde-with-Arnoldi least squares by polynomials in z on sample points Z (complex), values Fv. */
function arnoldiLS(Z, Fv, dmax) {
  const m = Z.length, ip = (a, b) => { let s = [0, 0]; for (let i = 0; i < m; i++) s = cadd(s, [a[i][0] * b[i][0] + a[i][1] * b[i][1], a[i][0] * b[i][1] - a[i][1] * b[i][0]]); return s; };
  const Q = [Z.map(() => [1 / Math.sqrt(m), 0])], H = [];
  for (let k = 1; k <= dmax; k++) {
    let w = Q[k - 1].map((q, i) => cmul(Z[i], q));
    const h = Array.from({ length: k }, () => [0, 0]);
    for (let pass = 0; pass < 2; pass++) for (let j = 0; j < k; j++) { const c = ip(Q[j], w); h[j] = cadd(h[j], c); w = w.map((x, i) => csub(x, cmul(c, Q[j][i]))); }
    const nw = Math.sqrt(w.reduce((s, x) => s + x[0] * x[0] + x[1] * x[1], 0));
    Q.push(w.map((x) => [x[0] / nw, x[1] / nw])); H.push({ h, nw });
  }
  const coef = Q.map((q) => ip(q, Fv));
  // sup error on the samples for every degree
  let r = Fv.map((x) => x.slice()); const errs = [];
  for (let k = 0; k <= dmax; k++) { r = r.map((x, i) => csub(x, cmul(coef[k], Q[k][i]))); errs.push(Math.max(...r.map(cabs))); }
  const evalAt = (z, d) => {
    const q = [[1 / Math.sqrt(m), 0]]; let s = cmul(coef[0], q[0]);
    for (let k = 1; k <= d; k++) { let w = cmul(z, q[k - 1]); const { h, nw } = H[k - 1]; for (let j = 0; j < k; j++) w = csub(w, cmul(h[j], q[j])); q.push([w[0] / nw, w[1] / nw]); s = cadd(s, cmul(coef[k], q[k])); }
    return s;
  };
  return { errs, evalAt };
}

export default {
  collection: 'fa',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ a generalized Stone–Weierstrass theorem
    {
      num: '5.6',
      kind: 'Definition',
      name: 'Antisymmetric sets of a function algebra',
      statement: String.raw`Let $S$ be a compact Hausdorff space and $A$ a closed subalgebra of $C(S)$ that contains the constants. A set $E\subset S$ is **$A$-antisymmetric** if every $f\in A$ whose restriction to $E$ is real-valued is constant on $E$. Single points are antisymmetric, the closure of an antisymmetric set is antisymmetric, and two antisymmetric sets that meet have an antisymmetric union; hence the **maximal** $A$-antisymmetric sets are closed and form a partition of $S$.`,
      idea: String.raw`Antisymmetric sets are the places where $A$ is "as far from self-adjoint as possible". If $A$ is closed under complex conjugation, then $\Re f$ and $\Im f$ belong to $A$, so an antisymmetric set is one on which every member of $A$ is constant; when $A$ also separates points these are single points. For the disc algebra on $\bar D$ the whole disc is antisymmetric, because a holomorphic function that is real on an open set is constant.`,
      deps: [],
      tags: ['function algebras', 'Stone–Weierstrass'],
      verify: true,
    },
    {
      num: '5.7',
      kind: 'Theorem',
      name: "Bishop's generalized Stone–Weierstrass theorem",
      statement: String.raw`Let $A$ be a closed subalgebra of $C(S)$, $S$ compact Hausdorff, that contains the constants, and let $\mathscr K$ be the collection of maximal $A$-antisymmetric sets. If $g\in C(S)$ and, for every $E\in\mathscr K$, the restriction $g|_E$ agrees with the restriction to $E$ of some member of $A$, then $g\in A$.

In particular, if $A$ is closed under conjugation and separates points, every $E\in\mathscr K$ is a point and $A=C(S)$ (the complex Stone–Weierstrass theorem).`,
      idea: String.raw`Suppose $g\notin A$. By Hahn–Banach and the Riesz representation theorem some measure $\mu$ annihilating $A$ has $\int g\,d\mu\ne0$. The annihilating measures of norm $\le1$ form a weak$^*$-compact convex set (3.15), on which $\mu\mapsto\int g\,d\mu$ is a nonzero continuous linear functional, so it is nonzero at some extreme point $\mu$ (Krein–Milman, 3.23). *de Branges' lemma*: the support of such an extreme point is antisymmetric — if $f\in A$ were real and non-constant there, normalized to $0<f<1$, then $\mu=\|f\mu\|\frac{f\mu}{\|f\mu\|}+\|(1-f)\mu\|\frac{(1-f)\mu}{\|(1-f)\mu\|}$ would split $\mu$ into other annihilating measures, as $A$ is an algebra. So $\mu$ lives on one $E\in\mathscr K$, where $g$ agrees with a member of $A$, forcing $\int g\,d\mu=0$.`,
      caption: String.raw`$S=\bar D\cup I$, a closed disc and a segment $I=[2,\,2.6]$, and $A$ the uniform closure of the polynomials on $S$. The maximal antisymmetric sets are $\bar D$ and the single points of $I$, so Bishop's theorem says: $g\in A$ iff $g$ is holomorphic inside the disc — nothing is required on $I$. Pick $g$ and the degree $d$; the colours show $|g-p_d|$ for the least-squares polynomial $p_d$, and the bars its sup error. When $g|_{\bar D}\notin A(\bar D)$ an annihilating measure supported on the antisymmetric set $\bar D$ certifies a lower bound for the distance (dashed).`,
      deps: ['fa-5.6', 'fa-3.15', 'fa-3.23', 'fa-3.5', 'rca-6.19'],
      see: ['pma-7.32', 'pma-7.33'],
      tags: ['Stone–Weierstrass', 'Krein–Milman', 'function algebras'],
      verify: true,
      viz(v) {
        const M = v.M;
        const onD = (z) => z[0] * z[0] + z[1] * z[1] <= 1 + 1e-9;
        const G = {
          hol: { label: '$e^z$ on $\\bar D$, $\\cos 8(x-2.3)$ on $I$', f: (z) => (onD(z) ? cexp(z) : [Math.cos(8 * (z[0] - 2.3)), 0]), lb: 0 },
          conj: { label: '$\\bar z$ on $\\bar D$, $x$ on $I$', f: (z) => (onD(z) ? [z[0], -z[1]] : [z[0], 0]), lb: 1, cert: '\\mu=\\tfrac{1}{2\\pi}e^{i\\theta}d\\theta \\text{ on } \\T', val: '\\int\\bar z\\,d\\mu=1,\\ \\|\\mu\\|=1' },
          mod: { label: '$|z|^2$ on $\\bar D$, $x^2$ on $I$', f: (z) => (onD(z) ? [z[0] * z[0] + z[1] * z[1], 0] : [z[0] * z[0], 0]), lb: 0.5, cert: '\\mu=\\delta_0-\\tfrac{d\\theta}{2\\pi}', val: '\\int|z|^2d\\mu=-1,\\ \\|\\mu\\|=2' },
        };
        const which = v.select('$g=$', Object.entries(G).map(([value, o]) => ({ value, label: o.label })), 'hol');
        const DMAX = 36;
        const dS = v.slider('degree $d$ of $p_d$', 0, DMAX, 22, { int: true });
        const L = v.stage({ x: [-1.2, 2.75], y: [-1.25, 1.25], equal: true, height: 320, axes: false, title: '$S=\\bar D\\cup I$ coloured by $|g-p_d|$' });
        const R = v.stage({ x: [-0.8, DMAX + 0.8], y: [0, 1.6], height: 320, axes: 'box', xlabel: 'd', title: '$\\sup_S|g-p_d|$ against the degree' });
        // sample points of S
        const Z = [];
        for (let k = 0; k < 220; k++) { const t = M.TAU * k / 220; Z.push([Math.cos(t), Math.sin(t)]); }
        for (const r of [0.25, 0.5, 0.75, 0.9]) for (let k = 0; k < 48; k++) { const t = M.TAU * (k + 0.5) / 48; Z.push([r * Math.cos(t), r * Math.sin(t)]); }
        Z.push([0, 0]);
        for (let k = 0; k <= 110; k++) Z.push([2 + 0.6 * k / 110, 0]);
        const cache = {};
        const fit = (key) => cache[key] || (cache[key] = arnoldiLS(Z, Z.map(G[key].f), DMAX));
        let st = {};
        v.legend([['orange', 'maximal antisymmetric sets: $\\bar D$ and the points of $I$'], ['blue', 'sup error of $p_d$', { area: true }], ['red', 'certified lower bound for $\\operatorname{dist}(g,A)$', { dash: true }]]);
        v.render(() => {
          const key = which.value, Gk = G[key], d = dS.value, F = fit(key);
          const col = (e) => { const c = M.cmap(Math.min(1, e), 'magma'); return c; };
          L.raster((x, y) => { if (x * x + y * y > 1) return null; const z = [x, y]; return col(cabs(csub(Gk.f(z), F.evalAt(z, d)))); }, { res: 3, key: `${key}|${d}` });
          L.circle(0, 0, 1, { color: 'orange', width: 2.4 });
          for (let k = 0; k < 100; k++) {
            const x0 = 2 + 0.6 * k / 100, x1 = 2 + 0.6 * (k + 1) / 100, z = [(x0 + x1) / 2, 0], c = col(cabs(csub(Gk.f(z), F.evalAt(z, d))));
            L.line(x0, 0, x1, 0, { color: `rgb(${c[0]},${c[1]},${c[2]})`, width: 12, cap: 'butt' });
          }
          L.dot(2, 0, { color: 'orange', r: 3.5 }); L.dot(2.6, 0, { color: 'orange', r: 3.5 });
          L.tex('\\bar D', -0.93, 0.93, { color: 'orange', size: 17, align: 'right' });
          L.tex('I', 2.3, 0.2, { color: 'orange', size: 17 });
          // colour bar
          const [bx0, bx1] = [1.75, 2.65], by = -0.95;
          for (let k = 0; k < 40; k++) { const c = col(k / 39); L.rect(bx0 + (bx1 - bx0) * k / 40, by, bx0 + (bx1 - bx0) * (k + 1) / 40, by + 0.12, { fill: `rgb(${c[0]},${c[1]},${c[2]})`, fillAlpha: 1, stroke: false }); }
          L.text('0', bx0, by - 0.12, { size: 10.5, color: 'muted', align: 'center' });
          L.text('≥ 1', bx1, by - 0.12, { size: 10.5, color: 'muted', align: 'center' });
          L.text('colour = |g − p|', (bx0 + bx1) / 2, by + 0.26, { size: 10.5, color: 'muted', align: 'center' });
          const hi = Math.max(1.2, ...F.errs) * 1.08;
          R.setView(null, [0, hi]);
          R.bars(F.errs, { x0: 0, dx: 1, color: (e, i) => (i === d ? 'blue' : 'faint'), barWidth: 0.62 });
          if (Gk.lb) { R.hline(Gk.lb, { color: 'red', dash: [6, 4], width: 1.8 }); R.tex(Gk.cert, DMAX + 0.6, Gk.lb, { color: 'red', align: 'right', baseline: 'bottom', size: 13, dy: -4 }); }
          R.corner(Gk.lb ? 'g is not holomorphic in the disc: g ∉ A' : 'g is holomorphic in the disc, arbitrary on I: g ∈ A', 'tr', { color: Gk.lb ? 'red' : 'green', weight: 600 });
          st = { key, d, err: F.errs[d] };
        });
        v.readout(() => {
          const s = st, Gk = G[s.key];
          if (!Gk.lb) return `$\\sup_S|g-p_{${s.d}}|\\approx ${v.fix(s.err, 4)}$, and the errors keep falling as $d$ grows: on each maximal antisymmetric set $g$ agrees with a member of $A$ (with $g$ itself on $\\bar D$, and with a constant at each point of $I$), so Bishop's theorem gives $g\\in A$ — although no single entire function equals $e^z$ on $\\bar D$ and $\\cos8(x-2.3)$ on $I$.`;
          return `$\\sup_S|g-p_{${s.d}}|\\approx ${v.fix(s.err, 4)}$ never drops below $${Gk.lb}$: the measure $${Gk.cert}$ annihilates every polynomial and has $${Gk.val}$, so $\\operatorname{dist}(g,A)\\ge ${Gk.lb}$. It lives on the antisymmetric set $\\bar D$, exactly as de Branges' lemma predicts.`;
        });
      },
    },
    // ------------------------------------------------------------------ two interpolation theorems
    {
      num: '5.8',
      kind: 'Theorem',
      name: 'Interpolation on null sets for annihilating measures',
      statement: String.raw`Let $S$ be a compact Hausdorff space, $Y$ a closed subspace of $C(S)$, and $K\subset S$ a compact set such that $|\mu|(K)=0$ for every measure $\mu\in M(S)$ that annihilates $Y$. Then the restriction map $F\mapsto F|_K$ carries the open unit ball of $Y$ onto the open unit ball of $C(K)$: every $f\in C(K)$ with $\|f\|_K<1$ is $F|_K$ for some $F\in Y$ with $\|F\|_S<1$.`,
      idea: String.raw`Let $R:Y\to C(K)$ be restriction. Its adjoint sends $\mu\in M(K)=C(K)^*$ to the functional $F\mapsto\int_K F\,d\mu$ on $Y$, whose norm is the distance from $\mu$ to the annihilator $Y^\perp$ in $M(S)$. Every $\sigma\in Y^\perp$ has $|\sigma|(K)=0$, so $\sigma$ and $\mu$ are mutually singular and $\|\mu-\sigma\|=\|\mu\|+\|\sigma\|\ge\|\mu\|$. Thus $R^*$ is an isometry, and Theorem 4.13 turns "$\|R^*\mu\|\ge\|\mu\|$" into "$R$ maps the open unit ball onto the open unit ball".`,
      caption: String.raw`$Y$ = the disc algebra (as a subspace of $C(\T)$) and $K=\{\zeta_1,\dots,\zeta_m\}\subset\T$, which is Lebesgue-null — and by the F. and M. Riesz theorem every measure annihilating $Y$ is absolutely continuous, so the hypothesis holds. Drag the points $\zeta_j$ on the circle and the targets $f(\zeta_j)$ inside the unit disc. The interpolant $F=\sum_jc_jp_j^N$, $p_j(z)=\frac{1+\bar\zeta_jz}{2}$, matches the data exactly; the right panel shows the curve $F(\T)$. Increase $N$ until it fits inside the unit circle: then $\|F\|<1$.`,
      deps: ['fa-4.13', 'rca-6.19'],
      see: ['rca-17.13'],
      tags: ['interpolation', 'duality', 'disc algebra'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mS = v.select('$m=|K|$', [2, 3, 4, 5].map((k) => ({ value: k, label: String(k) })), 3);
        const NS = v.slider('$N$ (peaking exponent)', 1, 80, 6, { int: true });
        const L = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 340, axes: false, title: '$\\bar D$: phase of $F$ (brightness $=|F|$) and $K\\subset\\T$' });
        const R = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, height: 340, axes: true, ticks: false, title: 'values: the curve $F(\\T)$ and the data $f(\\zeta_j)$' });
        const ANG = [0.35, 2.2, 3.7, 4.9, 5.7], VAL = [[0.55, 0.4], [-0.6, 0.35], [0.1, -0.75], [0.7, -0.3], [-0.3, -0.2]];
        const onCircle = (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; };
        const zs = ANG.map((a, j) => L.handle(Math.cos(a), Math.sin(a), { color: 'orange', label: `ζ${'₁₂₃₄₅'[j]}`, constrain: onCircle }));
        const gs = VAL.map((p, j) => R.handle(p[0], p[1], { color: 'gold', label: `f(ζ${'₁₂₃₄₅'[j]})`, constrain: (x, y) => { const r = Math.hypot(x, y); return r > 0.95 ? [0.95 * x / r, 0.95 * y / r] : [x, y]; } }));
        let st = {};
        v.legend([['orange', 'points of $K$'], ['gold', 'data $f(\\zeta_j)$, $\\|f\\|_K<1$'], ['blue', '$F(\\T)$'], ['green', 'unit circle: $\\|F\\|<1$ inside', { dash: true }]]);
        v.render(() => {
          const m = mS.value, N = NS.value;
          zs.forEach((h, j) => { h.visible = j < m; }); gs.forEach((h, j) => { h.visible = j < m; });
          const zeta = zs.slice(0, m).map((h) => [h.x, h.y]), tg = gs.slice(0, m).map((h) => [h.x, h.y]);
          const { F } = peakInterp(zeta, tg, N);
          L.raster((x, y) => { const r2 = x * x + y * y; if (r2 > 1) return null; const w = F([x, y]); const a = cabs(w); return M.hsl2rgb(Math.atan2(w[1], w[0]) / M.TAU, 0.6, 0.12 + 0.62 * Math.min(1, a)); }, { res: 3 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          const curve = []; let sup = 0;
          for (let k = 0; k <= 720; k++) { const t = M.TAU * k / 720, w = F([Math.cos(t), Math.sin(t)]); curve.push(w); sup = Math.max(sup, cabs(w)); }
          R.circle(0, 0, 1, { color: 'green', width: 1.8, dash: [6, 4], fill: sup < 1 ? 'green' : null, fillAlpha: 0.06 });
          R.path(curve, { color: 'blue', width: 2 });
          let err = 0;
          zeta.forEach((z, j) => { const w = F(z); err = Math.max(err, cabs(csub(w, tg[j]))); R.dot(w[0], w[1], { color: 'blue', r: 3.5 }); });
          R.corner(sup < 1 ? `‖F‖ = ${v.fmt(sup, 4)} < 1` : `‖F‖ = ${v.fmt(sup, 4)} ≥ 1 — raise N`, 'tl', { color: sup < 1 ? 'green' : 'red', weight: 600 });
          st = { sup, err, N, gmax: Math.max(...tg.map(cabs)) };
        });
        v.readout(() => `$\\|f\\|_K=${v.fix(st.gmax, 3)}<1$; $\\max_j|F(\\zeta_j)-f(\\zeta_j)|=${v.M.sci(st.err, 2)}$ (exact interpolation), $\\|F\\|_\\T=${v.fix(st.sup, 4)}$ ${st.sup < 1 ? '$<1$: $F$ lies in the open unit ball of $Y$, as 5.8 promises.' : '$\\ge1$ — the peaks $p_j^N$ are still too wide; a larger $N$ works.'} As $N\\to\\infty$, $\\|F\\|\\to\\|f\\|_K$.`);
      },
    },
    {
      num: '5.9',
      kind: 'Theorem',
      name: "Bishop's peak-interpolation theorem",
      statement: String.raw`Let $S$, $Y$ and $K$ be as in 5.8: $Y$ a closed subspace of $C(S)$ and $K\subset S$ compact with $|\mu|(K)=0$ for every $\mu\in Y^\perp$. Let $\psi\in C(S)$ be strictly positive and $f\in C(K)$ with $|f(p)|<\psi(p)$ for all $p\in K$. Then there is $F\in Y$ with $F|_K=f$ and $|F(x)|<\psi(x)$ for **every** $x\in S$.

For the disc algebra and a closed set $K\subset\T$ of Lebesgue measure $0$ this contains the *Rudin–Carleson theorem*: every $f\in C(K)$ extends to a member of the disc algebra (with the dominant $\psi$ as close to $|f|$ on $K$ as desired).`,
      idea: String.raw`5.8 gives an extension of norm $<1$; the work is to control the size pointwise. One builds $F=\sum_nF_n$, where $F_n\in Y$ interpolates the error left on $K$ after the first $n-1$ steps and is chosen, again via the isometry of $R^*$ and Theorem 4.13, small away from a shrinking neighbourhood of $K$; the errors decrease geometrically, so the series converges in $Y$ and the bound $|F|<\psi$ survives in the limit. For the disc algebra the hypothesis comes from the F. and M. Riesz theorem: annihilating measures are absolutely continuous, so they do not charge a null set $K$.`,
      caption: String.raw`The disc algebra on $\T$, unrolled to $\theta\in[0,2\pi]$. Choose a dominant $\psi$ and drag the three data points $(\theta_j,|f(\theta_j)|)$ anywhere below it. The interpolant is $F=h\cdot\sum_jc_jp_j^N$, where $h$ is the outer function with $|h|=\psi$ on $\T$, so $|F|/\psi=|\sum_jc_jp_j^N|$. Raise $N$ until $|F|<\psi$ on the whole circle (green), not only on $K$.`,
      deps: ['fa-5.8', 'fa-4.13'],
      see: ['rca-17.13'],
      tags: ['interpolation', 'disc algebra', 'peak sets'],
      verify: true,
      viz(v) {
        const M = v.M;
        const PSI = {
          one: { label: '$\\psi\\equiv1$', f: () => 1 },
          bump: { label: 'bump', f: (t) => 0.3 + 0.75 * Math.exp(-2.2 * (1 - Math.cos(t - 3.4))) },
          wave: { label: 'wavy', f: (t) => 0.62 + 0.25 * Math.sin(t) + 0.1 * Math.cos(3 * t) },
        };
        const which = v.select('dominant $\\psi$', Object.entries(PSI).map(([value, o]) => ({ value, label: o.label })), 'bump');
        const NS = v.slider('$N$ (peaking exponent)', 1, 120, 4, { int: true });
        const top = v.stage({ x: [0, M.TAU], y: [0, 1.25], height: 280, full: true, axes: 'box', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [1.5 * Math.PI, '3π/2'], [M.TAU, '2π']], title: '$|F(e^{i\\theta})|$ under the dominant $\\psi(\\theta)$' });
        const bot = v.stage({ x: [0, M.TAU], y: [0, 1.3], height: 150, full: true, axes: 'box', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [1.5 * Math.PI, '3π/2'], [M.TAU, '2π']], yticks: [0, 0.5, 1], title: 'the ratio $|F|/\\psi$ — must stay below $1$ everywhere' });
        const cache = {};
        function outer(key) {
          if (cache[key]) return cache[key];
          const psi = PSI[key].f, S = 512, K = 80, lg = M.range(S).map((m) => Math.log(psi(M.TAU * m / S)));
          const a = M.range(K + 1).map((k) => { let re = 0, im = 0; for (let m = 0; m < S; m++) { const t = M.TAU * m / S; re += lg[m] * Math.cos(k * t); im -= lg[m] * Math.sin(k * t); } return [re / S, im / S]; });
          const h = (z) => { let s = [a[0][0], 0], zk = [1, 0]; for (let k = 1; k <= K; k++) { zk = cmul(zk, z); s = cadd(s, cmul([2 * a[k][0], 2 * a[k][1]], zk)); } return cexp(s); };
          return (cache[key] = { h, psi });
        }
        const PH = [0.3, 2.4, 4.4], T0 = [1.2, 3.1, 5.0], Y0 = [0.5, 0.6, 0.4];
        const hs = T0.map((t, j) => top.handle(t, Y0[j], { color: 'gold', label: `f(ζ${'₁₂₃'[j]})`, constrain: (x, y) => { const xx = M.clamp(x, 0.08, M.TAU - 0.08); const P = PSI[which.value].f(xx); return [xx, M.clamp(y, 0.03, 0.96 * P)]; } }));
        let st = {}, last = null;
        v.legend([['red', 'dominant $\\psi$'], ['gold', 'data $|f(\\zeta_j)|<\\psi(\\zeta_j)$'], ['blue', '$|F|$ on $\\T$'], ['green', '$|F|<\\psi$ everywhere', { area: true }]]);
        v.render(() => {
          const key = which.value, O = outer(key), N = NS.value;
          if (last !== key) { last = key; hs.forEach((h, j) => { const P = O.psi(h.x); h.y = Math.min(h.y, 0.85 * P); }); }
          const zeta = hs.map((h) => [Math.cos(h.x), Math.sin(h.x)]);
          const data = hs.map((h, j) => [h.y * Math.cos(PH[j]), h.y * Math.sin(PH[j])]);
          const targets = data.map((g, j) => cdiv(g, O.h(zeta[j])));
          const { F } = peakInterp(zeta, targets, N);
          const n = 900, pts = [], rat = []; let worst = 0;
          for (let k = 0; k <= n; k++) { const t = M.TAU * k / n, z = [Math.cos(t), Math.sin(t)], f = F(z), Ft = cabs(cmul(O.h(z), f)); pts.push([t, Ft]); const r = Ft / O.psi(t); rat.push([t, r]); worst = Math.max(worst, r); }
          const ymax = Math.max(1.15, ...pts.map((p) => p[1])) * 1.08;
          top.setView(null, [0, Math.max(ymax, 1.1 * Math.max(...M.range(200).map((k) => O.psi(M.TAU * k / 200))))]);
          const ok = worst < 1;
          top.between((t) => O.psi(t), () => 0, 0, M.TAU, { fill: ok ? 'green' : 'red', fillAlpha: 0.07, n: 300 });
          top.fn((t) => O.psi(t), { color: 'red', width: 2.2, domain: [0, M.TAU] });
          top.path(pts, { color: 'blue', width: 2.2 });
          hs.forEach((h) => top.vline(h.x, { color: 'orange', width: 1, dash: [3, 4] }));
          top.tex('\\psi', 0.45, O.psi(0.45), { color: 'red', dy: -14, align: 'left' });
          bot.setView(null, [0, Math.max(1.3, worst * 1.1)]);
          bot.hband(1, 99, { color: 'red', alpha: 0.08 });
          bot.hline(1, { color: 'red', width: 1.6, dash: [6, 4] });
          bot.path(rat, { color: ok ? 'green' : 'red', width: 2.2 });
          hs.forEach((h) => bot.vline(h.x, { color: 'orange', width: 1, dash: [3, 4] }));
          bot.corner(ok ? `max |F|/ψ = ${v.fix(worst, 3)} < 1` : `max |F|/ψ = ${v.fix(worst, 3)} ≥ 1 — raise N`, 'tr', { color: ok ? 'green' : 'red', weight: 600 });
          let err = 0; zeta.forEach((z, j) => { err = Math.max(err, cabs(csub(cmul(O.h(z), F(z)), data[j]))); });
          st = { worst, err, N };
        });
        v.readout(() => `Interpolation error on $K$: $${v.M.sci(st.err, 2)}$. $\\max_\\T|F|/\\psi=${v.fix(st.worst, 4)}$ ${st.worst < 1 ? '$<1$: $|F|<\\psi$ on all of $\\T$ and $F(\\zeta_j)=f(\\zeta_j)$ — the conclusion of 5.9.' : '$\\ge1$: at this $N$ the peaks leak past $\\psi$; the theorem says some $F$ works, and a larger $N$ finds one.'}`);
      },
    },
  ],
};
