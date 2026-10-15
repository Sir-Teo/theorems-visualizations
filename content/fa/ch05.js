// Rudin, Functional Analysis — Chapter 5: Some Applications

// ---------------------------------------------------------------- shared helpers (batch 1)
/** ∫_a^b F(t) dt for a vector function F: t ↦ [x, y] (composite Simpson, 2m panels). */
function vint(F, a, b, m = 2) {
  const n = 2 * m, h = (b - a) / n; let sx = 0, sy = 0;
  for (let i = 0; i <= n; i++) { const w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; const p = F(a + i * h); sx += w * p[0]; sy += w * p[1]; }
  return [sx * h / 3, sy * h / 3];
}
/** The zonotope Σ_k [0, v_k] in the plane: ccw vertex list P (2M vertices) plus the data needed to read off
 *  coefficients λ ∈ [0,1]^M of a boundary point. Edge e (P[e] → P[e+1]) moves along generator order[e mod M]. */
function zonotope(vs) {
  const M = vs.length, flip = [], w = [];
  let B0 = [0, 0];
  for (let k = 0; k < M; k++) {
    const v = vs[k], f = v[1] < 0 || (v[1] === 0 && v[0] < 0);
    flip.push(f); w.push(f ? [-v[0], -v[1]] : v);
    if (f) B0 = [B0[0] + v[0], B0[1] + v[1]];
  }
  const order = Array.from({ length: M }, (_, i) => i).sort((i, j) => Math.atan2(w[i][1], w[i][0]) - Math.atan2(w[j][1], w[j][0]));
  const P = [B0]; let p = B0;
  for (const k of order) { p = [p[0] + w[k][0], p[1] + w[k][1]]; P.push(p); }
  for (const k of order) { p = [p[0] - w[k][0], p[1] - w[k][1]]; P.push(p); }
  P.pop();
  return { P, flip, order, M, c: [(P[0][0] + P[M][0]) / 2, (P[0][1] + P[M][1]) / 2] };
}
/** Coefficients λ (one per generator) of the boundary point P[e] + τ(P[e+1] − P[e]). */
function zonoCoefs(Z, e, tau) {
  const { M, order, flip } = Z, mu = new Array(M).fill(0);
  if (e < M) { for (let i = 0; i < e; i++) mu[order[i]] = 1; mu[order[e]] = tau; }
  else { const i0 = e - M; mu[order[i0]] = 1 - tau; for (let i = i0 + 1; i < M; i++) mu[order[i]] = 1; }
  return mu.map((m, k) => (flip[k] ? 1 - m : m));
}
function pointIn([x, y], P) {
  let inside = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; }
  return inside;
}
/** Some λ ∈ [0,1]^M with Σ λ_k v_k = y (y inside the zonotope): interpolate between the centre and the boundary point on the ray. */
function zonoSolve(Z, y) {
  const { P, c, M } = Z, d = [y[0] - c[0], y[1] - c[1]];
  if (Math.hypot(d[0], d[1]) < 1e-14) return new Array(M).fill(0.5);
  let best = null;
  for (let e = 0; e < 2 * M; e++) {
    const A = P[e], B = P[(e + 1) % (2 * M)], ex = B[0] - A[0], ey = B[1] - A[1], ax = A[0] - c[0], ay = A[1] - c[1];
    const det = -d[0] * ey + d[1] * ex; if (Math.abs(det) < 1e-18) continue;
    const s = (-ax * ey + ay * ex) / det, tau = (d[0] * ay - d[1] * ax) / det;
    if (s > 0 && tau >= -1e-9 && tau <= 1 + 1e-9 && (!best || s < best.s)) best = { s, e, tau: Math.min(1, Math.max(0, tau)) };
  }
  if (!best) return new Array(M).fill(0.5);
  const t = Math.min(1, 1 / best.s), lb = zonoCoefs(Z, best.e, best.tau);
  return lb.map((l) => (1 - t) * 0.5 + t * l);
}
/** Rudin's extreme-point step in R²: while ≥ 3 coefficients are fractional, move along a null combination
 *  of their vectors until one of them hits 0 or 1. Afterwards at most 2 cells are fractional. */
function reduceCells(cells) {
  const isF = (l) => l > 1e-11 && l < 1 - 1e-11;
  let fr = [];
  cells.forEach((c, k) => { if (isF(c.lam)) fr.push(k); else c.lam = c.lam < 0.5 ? 0 : 1; });
  while (fr.length >= 3) {
    const ids = fr.slice(-3), V = ids.map((k) => cells[k].v);
    const R1 = [V[0][0], V[1][0], V[2][0]], R2 = [V[0][1], V[1][1], V[2][1]];
    const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const nn = (a) => Math.hypot(a[0], a[1], a[2]);
    let h = cr(R1, R2);
    if (nn(h) < 1e-22) { const R = nn(R1) > nn(R2) ? R1 : R2; h = nn(R) < 1e-22 ? [1, -1, 0] : cr(R, [1, 0, 0]); if (nn(h) < 1e-22) h = cr(R, [0, 1, 0]); }
    let tm = Infinity;
    ids.forEach((k, q) => { const l = cells[k].lam; if (h[q] > 0) tm = Math.min(tm, (1 - l) / h[q]); else if (h[q] < 0) tm = Math.min(tm, -l / h[q]); });
    ids.forEach((k, q) => { let l = cells[k].lam + tm * h[q]; if (l < 1e-11) l = 0; else if (l > 1 - 1e-11) l = 1; cells[k].lam = l; });
    fr = fr.filter((k) => isF(cells[k].lam));
  }
}
/** A measurable set E ⊂ [0,1] (finite union of intervals) with ∫_E F = y, for y in the range: Lyapunov made constructive. */
function lyapunovSet(F, y, levels = 7) {
  // start from as coarse a partition as possible (fewer intervals in E); refine only if y is outside its zonotope
  let cells = [], Z = null;
  for (const Mc of [24, 72, 216, 360]) {
    cells = [];
    for (let k = 0; k < Mc; k++) { const a = k / Mc, b = (k + 1) / Mc; cells.push({ a, b, v: vint(F, a, b, 2), lam: 0 }); }
    Z = zonotope(cells.map((c) => c.v));
    if (pointIn(y, Z.P)) break;
  }
  const lam = zonoSolve(Z, y);
  cells.forEach((c, k) => { c.lam = lam[k]; });
  reduceCells(cells);
  for (let L = 0; L < levels; L++) {
    const out = [];
    for (const c of cells) {
      if (c.lam > 0 && c.lam < 1) { for (let j = 0; j < 8; j++) { const a = c.a + (c.b - c.a) * j / 8, b = c.a + (c.b - c.a) * (j + 1) / 8; out.push({ a, b, v: vint(F, a, b, 1), lam: c.lam }); } }
      else out.push(c);
    }
    cells = out; reduceCells(cells);
  }
  const E = [];
  for (const c of cells) if (c.lam === 1) { const last = E[E.length - 1]; if (last && Math.abs(last[1] - c.a) < 1e-12) last[1] = c.b; else E.push([c.a, c.b]); }
  let m = [0, 0];
  for (const [a, b] of E) { const n = Math.max(1, Math.ceil((b - a) * 64)); for (let j = 0; j < n; j++) { const w = vint(F, a + (b - a) * j / n, a + (b - a) * (j + 1) / n, 3); m = [m[0] + w[0], m[1] + w[1]]; } }
  return { E, m };
}

export default {
  collection: 'fa',
  chapter: 5,
  title: 'Some Applications',
  summary: String.raw`A tour of what the abstract machinery of Chapters 1–4 can do. The closed graph theorem shows that closed subspaces of $L^p$ made of bounded functions are finite-dimensional; Krein–Milman yields Lyapunov's convexity theorem for vector measures and Bishop's generalized Stone–Weierstrass theorem; duality gives peak-interpolation theorems and the representation of $L^1$ functions as sums of Poisson kernels. Fixed-point theorems (Kakutani, Markov–Kakutani, Ryll-Nardzewski) produce Haar measure on compact groups and invariant extensions of functionals, and averaging over a compact group shows that $H^1$ and the disc algebra are not complemented.`,
  items: [
    // ------------------------------------------------------------------ a continuity theorem
    {
      num: '5.1',
      kind: 'Theorem',
      name: 'Weakly continuous linear maps between F-spaces are continuous',
      statement: String.raw`Let $X$ and $Y$ be $F$-spaces and let $\Lambda:X\to Y$ be linear. Suppose $\Gamma$ is a collection of continuous linear functionals on $Y$ that separates the points of $Y$, and that $\gamma\circ\Lambda$ is continuous on $X$ for every $\gamma\in\Gamma$. Then $\Lambda$ is continuous.`,
      idea: String.raw`By the closed graph theorem (2.15) it is enough to show that the graph of $\Lambda$ is closed. If $x_n\to x$ in $X$ and $\Lambda x_n\to y$ in $Y$, then for each $\gamma\in\Gamma$ both $\gamma(\Lambda x_n)\to\gamma(y)$ (continuity of $\gamma$) and $\gamma(\Lambda x_n)\to\gamma(\Lambda x)$ (continuity of $\gamma\Lambda$). Hence $\gamma(y)=\gamma(\Lambda x)$ for all $\gamma$, and since $\Gamma$ separates points, $y=\Lambda x$. Completeness of $X$ and $Y$ is what makes the closed graph theorem available.`,
      caption: String.raw`$X=Y=\ell^2$, $\Gamma$ = the coordinate functionals $e_i^*$, and $\Lambda$ an infinite matrix, so $e_i^*\circ\Lambda$ is the row $i$ (continuous iff the row lies in $\ell^2$). Every row is in $\ell^2$ for all three matrices. For the Hilbert and Cesàro matrices $\Lambda$ maps all of $\ell^2$ into $\ell^2$, and the theorem forces boundedness: the norms of the $N\times N$ sections stay below $\pi$ and $2$. The diagonal matrix $\mathrm{diag}(i)$ is coordinatewise continuous too, but it does not map $\ell^2$ into $\ell^2$ (it sends $x=(1/i)$ to $(1,1,1,\dots)$), so the theorem does not apply and the section norms blow up.`,
      deps: ['fa-2.15'],
      tags: ['closed graph theorem', 'F-spaces'],
      verify: true,
      viz(v) {
        const H = (n) => { let s = 0; for (let k = 1; k <= n; k++) s += 1 / k; return s; };
        const MATS = {
          hil: { label: 'Hilbert $\\tfrac{1}{i+j-1}$', a: (i, j) => 1 / (i + j - 1), lim: Math.PI, limLab: 'π', row: (i) => { let s = 0; for (let m = i; m < i + 4000; m++) s += 1 / (m * m); return Math.sqrt(s + 1 / (i + 3999.5)); }, lx: (i) => (i === 1 ? Math.PI * Math.PI / 6 : H(i - 1) / (i - 1)) },
          ces: { label: 'Cesàro $\\tfrac1i\\,[j\\le i]$', a: (i, j) => (j <= i ? 1 / i : 0), lim: 2, limLab: '2', row: (i) => 1 / Math.sqrt(i), lx: (i) => H(i) / i },
          dia: { label: '$\\mathrm{diag}(i)$', a: (i, j) => (i === j ? i : 0), lim: null, row: (i) => i, lx: () => 1 },
        };
        const which = v.select('$\\Lambda=$', Object.entries(MATS).map(([value, o]) => ({ value, label: o.label })), 'hil');
        const rowS = v.slider('row $i$ (the functional $e_i^*\\circ\\Lambda$)', 1, 16, 3, { int: true });
        const L = v.stage({ x: [-1.2, 16.4], y: [-0.4, 16.8], equal: true, height: 330, axes: false, title: 'the matrix $(a_{ij})_{i,j\\le16}$ of $\\Lambda$' });
        const NS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128];
        const R = v.stage({ x: [-0.2, 7.3], y: [0, 4.2], height: 330, axes: 'box', xticks: NS.filter((n) => (n & (n - 1)) === 0).map((n) => [Math.log2(n), String(n)]), xlabel: 'N', title: 'sections $\\Lambda_N$: $\\|\\Lambda_N\\|$ and $\\|P_N\\Lambda x\\|_2$ for $x=(1/i)$' });
        const cache = {};
        function curves(key) {
          if (cache[key]) return cache[key];
          const Mx = MATS[key], out = [];
          for (const N of NS) {
            const A = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => Mx.a(i + 1, j + 1)));
            let x = new Array(N).fill(1 / Math.sqrt(N)), s = 0;
            for (let it = 0; it < 80; it++) {
              const y = A.map((r) => r.reduce((t, a, j) => t + a * x[j], 0));
              const z = new Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) z[j] += A[i][j] * y[i];
              const nz = Math.hypot(...z); s = Math.sqrt(nz); x = z.map((t) => t / nz);
            }
            let q = 0; for (let i = 1; i <= N; i++) q += Mx.lx(i) ** 2;
            out.push({ N, op: s, lx: Math.sqrt(q) });
          }
          return (cache[key] = out);
        }
        let st = {};
        v.legend([['blue', 'size of $a_{ij}$', { area: true }], ['orange', 'row $i$ = the functional $e_i^*\\circ\\Lambda$'], ['accent', '$\\|\\Lambda_N\\|$'], ['gold', '$\\|P_N\\Lambda x\\|_2$, $x_i=1/i$'], ['green', 'the bound forced by 5.1', { dash: true }]]);
        v.render(() => {
          const key = which.value, Mx = MATS[key], n = 16, ri = rowS.value;
          let amax = 0; for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) amax = Math.max(amax, Math.abs(Mx.a(i, j)));
          for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) {
            const t = Math.pow(Math.abs(Mx.a(i, j)) / amax, 0.55);
            L.rect(j - 1, n - i, j - 0.06, n - i + 0.94, { fill: v.mix('panel', 'blue', 0.08 + 0.92 * t), fillAlpha: 1, stroke: false });
          }
          L.rect(-0.08, n - ri - 0.08, n + 0.02, n - ri + 1.02, { color: 'orange', width: 2.4 });
          for (const k of [1, 4, 8, 12, 16]) { L.text(String(k), -0.55, n - k + 0.47, { size: 10.5, color: 'muted', align: 'center' }); L.text(String(k), k - 0.53, n + 0.45, { size: 10.5, color: 'muted', align: 'center' }); }
          L.text('j →', n - 0.4, n + 0.45, { size: 10.5, color: 'muted', align: 'right', dx: 26 });
          L.text('i ↓', -0.55, n + 0.45, { size: 10.5, color: 'muted', align: 'center' });
          const C = curves(key);
          if (Mx.lim) { R.hline(Mx.lim, { color: 'green', dash: [6, 4], width: 1.6 }); R.text(`limit ${Mx.limLab}`, 7.2, Mx.lim, { align: 'right', dy: -10, color: 'green', size: 11.5 }); }
          R.path(C.map((c) => [Math.log2(c.N), c.op]), { color: 'accent', width: 2.4 });
          R.path(C.map((c) => [Math.log2(c.N), c.lx]), { color: 'gold', width: 2.4 });
          for (const c of C) { R.dot(Math.log2(c.N), c.op, { color: 'accent', r: 3 }); R.dot(Math.log2(c.N), c.lx, { color: 'gold', r: 3 }); }
          if (!Mx.lim) R.corner('Λ does not map ℓ² into ℓ²: sections are unbounded', 'tl', { color: 'red', weight: 600 });
          else R.corner('Λ maps ℓ² into ℓ² ⇒ Λ is bounded', 'tl', { color: 'green', weight: 600 });
          st = { key, ri, rn: Mx.row(ri), last: C[C.length - 1] };
        });
        v.readout(() => {
          const s = st, Mx = MATS[s.key];
          const head = `$\\|e_{${s.ri}}^*\\circ\\Lambda\\| = \\|\\text{row } ${s.ri}\\|_2 = ${v.fix(s.rn, 4)}<\\infty$ — every $e_i^*\\circ\\Lambda$ is continuous. `;
          return head + (Mx.lim ? `At $N=128$: $\\|\\Lambda_N\\| = ${v.fix(s.last.op, 3)}\\le ${Mx.limLab}$ and $\\|P_N\\Lambda x\\|_2=${v.fix(s.last.lx, 3)}$ converges.` : `But $\\Lambda x=(1,1,1,\\dots)\\notin\\ell^2$ for $x=(1/i)\\in\\ell^2$; $\\|\\Lambda_N\\| = N$. The hypothesis "$\\Lambda:X\\to Y$" is what fails.`);
        });
      },
    },
    // ------------------------------------------------------------------ closed subspaces of L^p
    {
      num: '5.2',
      kind: 'Theorem',
      name: 'Closed subspaces of Lᵖ inside L^∞ are finite-dimensional',
      statement: String.raw`Let $\mu$ be a probability measure on a measure space $\Omega$, let $0<p<\infty$, and let $S$ be a closed subspace of $L^p(\mu)$ such that $S\subset L^\infty(\mu)$. Then $S$ is finite-dimensional.`,
      idea: String.raw`The inclusion $j:S\to L^\infty$ has a closed graph (convergence in $L^p$ or in $L^\infty$ forces a.e. convergence of a subsequence), and $S$ is an $F$-space, so $j$ is continuous: $\|f\|_\infty\le M\|f\|_p$ on $S$. This upgrades to $\|f\|_\infty\le K\|f\|_2$ (for $p\le2$ because $\|f\|_p\le\|f\|_2$; for $p>2$ by $\|f\|_p^p\le\|f\|_\infty^{p-2}\|f\|_2^2$). If $\varphi_1,\dots,\varphi_n\in S$ are orthonormal in $L^2$, testing $\sum c_k\varphi_k$ for unit vectors $c$ gives $\sum_k|\varphi_k(x)|^2\le K^2$ a.e.; integrating, $n\le K^2$.`,
      caption: String.raw`$S_n=\spn\{\varphi_1,\dots,\varphi_n\}$ for an orthonormal family on $[0,1]$. Drag $x_0$ along the lower curve $k(x)=\sum_k\varphi_k(x)^2$ (its average is exactly $n$). The upper panel shows the test function $f=\sum_k\varphi_k(x_0)\varphi_k\in S_n$: $f(x_0)=k(x_0)$ while $\|f\|_2=\sqrt{k(x_0)}$. So the constant $M$ in $\|f\|_\infty\le M\|f\|_p$ must grow with $n$ — no infinite-dimensional $S$ can have one.`,
      deps: ['fa-5.1', 'fa-2.15', 'rca-3.12'],
      tags: ['closed graph theorem', 'Lp spaces'],
      verify: true,
      viz(v) {
        const M = v.M;
        const leg = (k, x) => { let a = 1, b = x; if (k === 0) return 1; for (let j = 1; j < k; j++) { const c = ((2 * j + 1) * x * b - j * a) / (j + 1); a = b; b = c; } return b; };
        const BASES = {
          trig: { label: 'trigonometric', phi: (k, x) => (k === 0 ? 1 : k % 2 ? Math.SQRT2 * Math.cos(2 * Math.PI * ((k + 1) >> 1) * x) : Math.SQRT2 * Math.sin(2 * Math.PI * (k >> 1) * x)) },
          leg: { label: 'Legendre', phi: (k, x) => Math.sqrt(2 * k + 1) * leg(k, 2 * x - 1) },
          step: { label: 'steps $\\sqrt n\\,\\chi_{I_k}$', phi: (k, x, n) => (Math.min(n - 1, Math.floor(x * n)) === k ? Math.sqrt(n) : 0) },
          rad: { label: 'Rademacher', phi: (k, x) => (Math.sin(Math.pow(2, k + 1) * Math.PI * x) >= 0 ? 1 : -1) },
        };
        const which = v.select('basis', Object.entries(BASES).map(([value, o]) => ({ value, label: o.label })), 'leg');
        const nS = v.slider('$n=\\dim S_n$', 1, 12, 6, { int: true });
        const pS = v.select('$p$', [{ value: 1, label: '$p=1$' }, { value: 2, label: '$p=2$' }, { value: 4, label: '$p=4$' }], 2);
        const top = v.stage({ x: [-0.02, 1.02], y: [-2, 8], height: 250, full: true, axes: 'box', title: 'the test function $f=\\sum_k\\varphi_k(x_0)\\varphi_k\\in S_n$' });
        const bot = v.stage({ x: [-0.02, 1.02], y: [0, 10], height: 170, full: true, axes: 'box', title: '$k(x)=\\sum_{k\\le n}\\varphi_k(x)^2$ — average value $n$' });
        const G = 2048, xs = M.range(G).map((m) => (m + 0.5) / G);
        let tab = null, tabKey = '';
        const table = (key, n) => {
          const kk = `${key}|${n}`; if (tabKey === kk) return tab;
          const B = BASES[key];
          const Phi = M.range(n).map((k) => xs.map((x) => B.phi(k, x, n)));
          const kx = xs.map((_, m) => Phi.reduce((s, r) => s + r[m] * r[m], 0));
          tabKey = kk; tab = { Phi, kx }; return tab;
        };
        const x0 = bot.handle(0.02, 1, { color: 'accent', label: 'x₀', constrain: (x) => { const t = table(which.value, nS.value); const m = M.clamp(Math.floor(x * G), 0, G - 1); return [xs[m], t.kx[m]]; } });
        let st = {};
        v.legend([['blue', '$f$'], ['purple', '$\\|f\\|_p$', { dash: true }], ['red', '$\\|f\\|_\\infty$', { dash: true }], ['green', 'mean of $k$ $=n$', { dash: true }]]);
        v.render(() => {
          const key = which.value, n = nS.value, p = pS.value, T = table(key, n), B = BASES[key];
          const m0 = M.clamp(Math.floor(x0.x * G), 0, G - 1); x0.x = xs[m0]; x0.y = T.kx[m0];
          const c = M.range(n).map((k) => B.phi(k, xs[m0], n));
          const f = xs.map((_, m) => c.reduce((s, ck, k) => s + ck * T.Phi[k][m], 0));
          const fmax = Math.max(...f.map(Math.abs)), fmin = Math.min(...f);
          const np = Math.pow(M.mean(f.map((y) => Math.pow(Math.abs(y), p))), 1 / p);
          top.setView(null, [Math.min(-0.15 * fmax, fmin * 1.15), fmax * 1.18]);
          top.hline(np, { color: 'purple', dash: [6, 4], width: 1.5 });
          top.hline(fmax, { color: 'red', dash: [6, 4], width: 1.5 });
          top.path(xs.map((x, m) => [x, f[m]]), { color: 'blue', width: 2.2 });
          top.vline(xs[m0], { color: 'accent', dash: [3, 4], width: 1 });
          top.dot(xs[m0], f[m0], { color: 'accent', r: 5, label: 'f(x₀) = k(x₀)', labelPos: xs[m0] > 0.7 ? 'w' : 'e' });
          const kmax = Math.max(...T.kx);
          bot.setView(null, [0, Math.max(n * 1.4, kmax * 1.15)]);
          bot.path(xs.map((x, m) => [x, T.kx[m]]).concat([[1, 0], [0, 0]]), { fill: 'orange', fillAlpha: 0.14, stroke: false, close: true });
          bot.path(xs.map((x, m) => [x, T.kx[m]]), { color: 'ink', width: 2 });
          bot.hline(n, { color: 'green', dash: [6, 4], width: 1.6 });
          bot.text(`n = ${n}`, 0.995, n, { align: 'right', dy: -9, color: 'green', size: 11.5 });
          const ratio = fmax / np, lower = p <= 2 ? Math.sqrt(T.kx[m0]) : Math.pow(T.kx[m0], 1 / p);
          st = { n, p, fmax, np, ratio, lower, k0: T.kx[m0], kmax, key };
        });
        v.readout(() => {
          const s = st;
          const bound = s.p <= 2 ? `\\sqrt{k(x_0)} = ${v.fix(s.lower, 3)}` : `k(x_0)^{1/${s.p}} = ${v.fix(s.lower, 3)}`;
          return `$k(x_0)=${v.fix(s.k0, 3)}$: $\\|f\\|_\\infty=${v.fix(s.fmax, 3)}$, $\\|f\\|_${s.p}=${v.fix(s.np, 3)}$, ratio $${v.fix(s.ratio, 3)}\\ \\ge\\ ${bound}$. Since $\\int_0^1 k=n=${s.n}$, some $x_0$ has $k(x_0)\\ge n$; here $\\max k=${v.fix(s.kmax, 2)}$, so any constant with $\\|f\\|_\\infty\\le M\\|f\\|_${s.p}$ on $S_n$ needs $M\\ge ${s.p <= 2 ? `\\sqrt{${s.n}}` : `${s.n}^{1/${s.p}}`}$.`;
        });
      },
    },
    {
      num: '5.3',
      kind: 'Theorem',
      name: 'L^∞ cannot be replaced by L^q: lacunary subspaces',
      statement: String.raw`The conclusion of 5.2 fails if $L^\infty$ is replaced by $L^q$ with $q<\infty$. For instance, let $n_1<n_2<\cdots$ be positive integers with $n_{k+1}\ge 2n_k$, and let $S$ be the closed subspace of $L^2(\T)$ spanned by the functions $e^{in_k\theta}$. Then $S$ is infinite-dimensional, $S\subset L^4(\T)$, and
$$\|f\|_4\le 2^{1/4}\,\|f\|_2\qquad(f\in S),$$
so $S$ is also a closed subspace of $L^4$ on which the two norms are equivalent.`,
      idea: String.raw`For a finite sum $f=\sum c_ke^{in_k\theta}$, $\|f\|_4^4=\|f^2\|_2^2$, and $f^2=\sum_{j,k}c_jc_ke^{i(n_j+n_k)\theta}$. Lacunarity makes each frequency $n_j+n_k$ ($j\le k$) arise from only one pair, so Parseval gives $\|f\|_4^4=\sum|c_k|^4+4\sum_{j<k}|c_j|^2|c_k|^2\le2\|f\|_2^4$. The inequality passes to $L^2$-limits, so the $L^2$-closure of these sums lies in $L^4$. Rudin's point is that 5.2 needs the full strength of $L^\infty$: with more work (Riesz products, Khintchine) lacunary spans sit inside every $L^q$, $q<\infty$.`,
      caption: String.raw`Choose the frequencies and coefficients and add terms. Top: $|f(\theta)|$ with its $L^2$, $L^4$ and sup norms. Bottom: the ratios $\|f\|_4/\|f\|_2$ (exact, from the frequency pairs) and $\|f\|_\infty/\|f\|_2$ as the number of terms grows. For $n_k=2^{k-1}$ the $L^4$ ratio never crosses $2^{1/4}$ while the sup ratio grows like $\sqrt N$: $S\subset L^4$ but $S\not\subset L^\infty$. For consecutive frequencies the $L^4$ ratio grows too.`,
      deps: ['fa-5.2', 'rca-4.26'],
      tags: ['Lp spaces', 'lacunary series'],
      verify: true,
      viz(v) {
        const M = v.M;
        const SETS = { pow: { label: '$n_k=2^{k-1}$', n: (k) => 2 ** (k - 1) }, sq: { label: '$n_k=k^2$', n: (k) => k * k }, lin: { label: '$n_k=k$', n: (k) => k } };
        const r0 = v.rng(7), PH = M.range(16).map(() => r0.uniform(0, M.TAU));
        const COEF = { eq: { label: 'all $c_k=1$', c: () => [1, 0] }, ph: { label: 'random phases', c: (k) => [Math.cos(PH[k]), Math.sin(PH[k])] }, dec: { label: '$c_k=1/\\sqrt k$', c: (k) => [1 / Math.sqrt(k), 0] } };
        const which = v.select('frequencies', Object.entries(SETS).map(([value, o]) => ({ value, label: o.label })), 'pow');
        const cw = v.select('coefficients', Object.entries(COEF).map(([value, o]) => ({ value, label: o.label })), 'eq');
        const nS = v.slider('number of terms $N$', 1, 11, 6, { int: true });
        const top = v.stage({ x: [0, M.TAU], y: [0, 7], height: 240, full: true, axes: 'box', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [1.5 * Math.PI, '3π/2'], [M.TAU, '2π']], title: '$|f(\\theta)|$ for $f=\\sum_{k\\le N}c_k e^{in_k\\theta}$' });
        const bot = v.stage({ x: [0.4, 11.6], y: [0, 3.6], height: 180, full: true, axes: 'box', xticks: M.range(11, 1), xlabel: 'N', title: 'norm ratios against the number of terms' });
        const cache = {};
        function norms(sk, ck, N) {
          const key = `${sk}|${ck}|${N}`; if (cache[key]) return cache[key];
          const fr = M.range(N, 1).map(SETS[sk].n), c = M.range(N, 1).map((k) => COEF[ck].c(k));
          const n2 = Math.sqrt(M.sum(c, (z) => z[0] * z[0] + z[1] * z[1]));
          const acc = new Map();
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const m = fr[i] + fr[j], z = acc.get(m) || [0, 0]; acc.set(m, [z[0] + c[i][0] * c[j][0] - c[i][1] * c[j][1], z[1] + c[i][0] * c[j][1] + c[i][1] * c[j][0]]); }
          let s4 = 0; for (const z of acc.values()) s4 += z[0] * z[0] + z[1] * z[1];
          const reps = new Map(); for (let i = 0; i < N; i++) for (let j = i; j < N; j++) { const m = fr[i] + fr[j]; reps.set(m, (reps.get(m) || 0) + 1); }
          const coll = [...reps.values()].filter((r) => r > 1).length;
          const S = Math.min(16384, Math.max(1024, 8 * fr[N - 1]));
          const th = [], ab = []; let ninf = 0;
          for (let m = 0; m <= S; m++) {
            const t = M.TAU * m / S; let re = 0, im = 0;
            for (let k = 0; k < N; k++) { const a = fr[k] * t, ca = Math.cos(a), sa = Math.sin(a); re += c[k][0] * ca - c[k][1] * sa; im += c[k][0] * sa + c[k][1] * ca; }
            const r = Math.hypot(re, im); th.push(t); ab.push(r); if (r > ninf) ninf = r;
          }
          return (cache[key] = { n2, n4: Math.pow(s4, 0.25), ninf, th, ab, coll });
        }
        let st = {};
        v.legend([['blue', '$|f(\\theta)|$', { area: true }], ['purple', '$\\|f\\|_2$', { dash: true }], ['teal', '$\\|f\\|_4$ and $\\|f\\|_4/\\|f\\|_2$'], ['red', '$\\|f\\|_\\infty$ and $\\|f\\|_\\infty/\\|f\\|_2$'], ['green', '$2^{1/4}$', { dash: true }]]);
        v.render(() => {
          const sk = which.value, ck = cw.value, N = nS.value, R = norms(sk, ck, N);
          top.setView(null, [0, R.ninf * 1.15]);
          const pts = R.th.map((t, m) => [t, R.ab[m]]);
          top.path(pts.concat([[M.TAU, 0], [0, 0]]), { fill: 'blue', fillAlpha: 0.13, stroke: false, close: true });
          top.path(pts, { color: 'blue', width: R.th.length > 4000 ? 0.8 : 1.4 });
          top.hline(R.n2, { color: 'purple', dash: [6, 4], width: 1.6 });
          top.hline(R.n4, { color: 'teal', width: 2 });
          top.hline(R.ninf, { color: 'red', dash: [6, 4], width: 1.6 });
          top.text('‖f‖₂', M.TAU, R.n2, { align: 'right', dx: -4, dy: -9, color: 'purple', size: 11.5 });
          top.text('‖f‖₄', M.TAU * 0.9, R.n4, { align: 'right', dx: -4, dy: -9, color: 'teal', size: 11.5 });
          top.text('‖f‖∞', M.TAU, R.ninf, { align: 'right', dx: -4, dy: 10, color: 'red', size: 11.5 });
          const all = M.range(11, 1).map((k) => norms(sk, ck, k));
          const hi = Math.max(1.6, ...all.map((r) => r.ninf / r.n2)) * 1.1;
          bot.setView(null, [0.8, hi]);
          bot.hline(Math.pow(2, 0.25), { color: 'green', dash: [6, 4], width: 1.6 });
          bot.path(all.map((r, k) => [k + 1, r.n4 / r.n2]), { color: 'teal', width: 2.2 });
          bot.path(all.map((r, k) => [k + 1, r.ninf / r.n2]), { color: 'red', width: 2.2 });
          all.forEach((r, k) => { const on = k + 1 === N; bot.dot(k + 1, r.n4 / r.n2, { color: 'teal', r: on ? 5.5 : 3 }); bot.dot(k + 1, r.ninf / r.n2, { color: 'red', r: on ? 5.5 : 3 }); });
          const worst = Math.max(...all.map((r) => r.n4 / r.n2));
          bot.corner(worst <= Math.pow(2, 0.25) + 1e-9 ? 'L⁴/L² ratio ≤ 2^(1/4) ≈ 1.189 for every N' : 'L⁴/L² ratio exceeds 2^(1/4) ≈ 1.189', 'tl', { color: worst <= Math.pow(2, 0.25) + 1e-9 ? 'green' : 'red', weight: 600 });
          st = { R, N, sk };
        });
        v.readout(() => {
          const { R, N } = st; const ok = R.coll === 0;
          return `$N=${N}$: $\\|f\\|_2=${v.fix(R.n2, 3)}$, $\\|f\\|_4=${v.fix(R.n4, 3)}$ (ratio $${v.fix(R.n4 / R.n2, 3)}${ok ? '\\le 2^{1/4}=1.189' : ''}$), $\\|f\\|_\\infty=${v.fix(R.ninf, 3)}$ (ratio $${v.fix(R.ninf / R.n2, 3)}$). ` + (ok ? 'No sum $n_j+n_k$ arises from two different pairs, so $\\|f\\|_4^4\\le2\\|f\\|_2^4$: the $L^4$ and $L^2$ norms are equivalent, while the sup norm is not.' : `${R.coll} sum${R.coll === 1 ? '' : 's'} $n_j+n_k$ arise from two different pairs; such collisions are what let $\\|f\\|_4/\\|f\\|_2$ grow when the frequencies are not lacunary.`);
        });
      },
    },
    // ------------------------------------------------------------------ the range of a vector-valued measure
    {
      num: '5.4',
      kind: 'Definition',
      name: 'Vector-valued measures and atoms',
      statement: String.raw`Let $\mathscr M$ be a $\sigma$-algebra in a set $\Omega$. A (finite) **$\R^n$-valued measure** on $\mathscr M$ is a map $\mu=(\mu_1,\dots,\mu_n):\mathscr M\to\R^n$ whose components $\mu_i$ are real (signed, finite) measures; its **range** is $\mu(\mathscr M)=\{\mu(E):E\in\mathscr M\}$. A positive measure $\lambda$ has an **atom** $E$ if $\lambda(E)>0$ and every measurable $F\subset E$ has $\lambda(F)=0$ or $\lambda(F)=\lambda(E)$; $\mu$ is **non-atomic** when $\lambda=|\mu_1|+\cdots+|\mu_n|$ has no atoms.`,
      idea: String.raw`Atoms are exactly what can stop the range from being convex: a single point mass $\delta_{t_0}$ takes only the values $0$ and $1$. Writing $d\mu_i=f_i\,d\lambda$ (Radon–Nikodym) turns $\mu$ into the linear map $g\mapsto\int g f\,d\lambda$ applied to characteristic functions, which is how Lyapunov's theorem (5.5) is attacked.`,
      deps: ['rca-6.1'],
      tags: ['vector measures'],
      verify: true,
    },
    {
      num: '5.5',
      kind: 'Theorem',
      name: "Lyapunov's convexity theorem",
      statement: String.raw`If $\mu=(\mu_1,\dots,\mu_n)$ is a non-atomic $\R^n$-valued measure on a $\sigma$-algebra $\mathscr M$, then its range $\mu(\mathscr M)$ is a compact convex subset of $\R^n$.`,
      idea: String.raw`Let $\lambda=\sum|\mu_i|$ and $d\mu_i=f_i\,d\lambda$. The set $K=\{g\in L^\infty(\lambda):0\le g\le1\}$ is weak$^*$-compact and convex (3.15), and $Tg=(\int gf_1\,d\lambda,\dots,\int gf_n\,d\lambda)$ is weak$^*$-continuous, so $T(K)$ is compact, convex and contains the range. For $y\in T(K)$ the fibre $K_y=K\cap T^{-1}(y)$ has an extreme point $g$ (Krein–Milman, 3.23). If $g$ were not a characteristic function, some set $E$ of positive measure has $\eps\le g\le1-\eps$ on it; as $\lambda$ has no atoms, $L^\infty(E)$ is infinite-dimensional, so it contains $h\ne0$ with $|h|\le\eps$ and $Th=0$, and $g=\frac12[(g+h)+(g-h)]$ contradicts extremality. So $g=\chi_A$ and $y=\mu(A)$.`,
      caption: String.raw`$\mu=(\mu_1,\mu_2)$ on $[0,1]$ with densities $(f_1,f_2)$ (right). Left, blue: the range of $\mu$. Collapsing each of $N$ cells to a point mass gives an *atomic* measure whose range is only the $2^N$ gold points; their hull is the orange zonotope, which fills in the blue set as $N$ grows. Drag $y$: the right panel shows a set $E$ with $\mu(E)=y$, found by Rudin's extreme-point argument (move along null combinations until at most two cells are fractional, subdivide, repeat). Switch on the atom to see the range become a non-convex union of two copies.`,
      deps: ['fa-5.4', 'fa-3.15', 'fa-3.23', 'rca-6.16', 'rca-6.10'],
      tags: ['vector measures', 'Krein–Milman', 'convexity'],
      viz(v) {
        const M = v.M;
        const DENS = {
          lens: { label: '$(1,\\;2t)$', f: (t) => [1, 2 * t], atom: [0.32, -0.3] },
          disc: { label: '$(\\cos2\\pi t,\\;\\sin2\\pi t)$', f: (t) => [Math.cos(M.TAU * t), Math.sin(M.TAU * t)], atom: [0.6, 0.26] },
          wavy: { label: 'wavy', f: (t) => [0.55 + Math.sin(3 * Math.PI * t) ** 2, 1.25 * Math.cos(5.5 * t) - 0.2], atom: [-0.12, 0.4] },
        };
        const which = v.select('densities $(f_1,f_2)$', Object.entries(DENS).map(([value, o]) => ({ value, label: o.label })), 'lens');
        const NS = v.slider('cells $N$ of the atomic approximation', 1, 10, 5, { int: true });
        const atomT = v.toggle('add an atom at $t_0=0.7$', false);
        const L = v.stage({ x: [-0.1, 1.1], y: [-0.1, 1.1], equal: true, height: 360, ticks: false, title: 'the range $\\{\\mu(E)\\}$ in $\\R^2$' });
        const R = v.stage({ x: [-0.02, 1.02], y: [-1.2, 2.2], height: 360, axes: 'box', xlabel: 't', title: 'densities on $[0,1]$ and a set $E$ with $\\mu(E)=y$' });
        const cache = {};
        function base(key) {
          if (cache[key]) return cache[key];
          const F = DENS[key].f, Mf = 360;
          const Z = zonotope(M.range(Mf).map((k) => vint(F, k / Mf, (k + 1) / Mf, 1)));
          return (cache[key] = { poly: Z.P, c: Z.c, tot: [2 * Z.c[0], 2 * Z.c[1]] });
        }
        const inPoly = (p, P) => M.pointInPoly(p, P);
        const y = L.handle(0.5, 0.45, { color: 'accent', label: 'y', constrain: (x, yy) => {
          const B = base(which.value), a = atomT.value ? DENS[which.value].atom : null;
          const H = a ? M.hull(B.poly.concat(B.poly.map((q) => [q[0] + a[0], q[1] + a[1]]))) : B.poly;
          return inPoly([x, yy], H) ? [x, yy] : M.closestOnConvexPoly([x, yy], H);
        } });
        let last = null, st = {};
        v.legend([['blue', 'range of $\\mu$', { area: true }], ['orange', 'hull of the $N$-cell atomic approximation'], ['gold', 'its $2^N$ values', { dot: true }], ['green', '$E$ and $\\mu(E)$', { area: true }]]);
        v.render(() => {
          const key = Object.keys(DENS).includes(which.value) ? which.value : 'lens', D = DENS[key], F = D.f, B = base(key), N = NS.value;
          const a = atomT.value ? D.atom : null;
          if (last !== key + (a ? 'A' : '')) {
            const all = a ? B.poly.concat(B.poly.map((q) => [q[0] + a[0], q[1] + a[1]])) : B.poly;
            const xs = all.map((q) => q[0]), ys = all.map((q) => q[1]);
            const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), pd = 0.12 * Math.max(x1 - x0, y1 - y0);
            L.setView([x0 - pd, x1 + pd], [y0 - pd, y1 + pd]);
            if (last == null || last.replace('A', '') !== key) { const q = B.poly[Math.floor(B.poly.length * 0.18)]; y.x = M.lerp(B.c[0], q[0], 0.55); y.y = M.lerp(B.c[1], q[1], 0.55); }
            last = key + (a ? 'A' : '');
            let lo = Infinity, hi = -Infinity; for (let t = 0; t <= 1; t += 0.005) { const p = F(t); lo = Math.min(lo, p[0], p[1]); hi = Math.max(hi, p[0], p[1]); }
            R.setView(null, [Math.min(0, lo) - 0.25 * (hi - lo), hi + 0.25 * (hi - lo)]);
          }
          // ---- left: the range, the atomic approximation, the point y
          const copies = a ? [[0, 0], a] : [[0, 0]];
          for (const sh of copies) L.poly(B.poly.map((q) => [q[0] + sh[0], q[1] + sh[1]]), { fill: 'blue', fillAlpha: 0.17, color: 'blue', width: 1.8 });
          if (a) L.poly(M.hull(B.poly.concat(B.poly.map((q) => [q[0] + a[0], q[1] + a[1]]))), { color: 'red', width: 1.2, dash: [5, 4] });
          const ws = M.range(N).map((j) => vint(F, j / N, (j + 1) / N, 6));
          const gens = a ? ws.concat([a]) : ws;
          L.poly(zonotope(gens).P, { color: 'orange', width: 1.6 });
          const sums = [];
          for (let mask = 0; mask < 1 << gens.length; mask++) { let sx = 0, sy = 0; for (let j = 0; j < gens.length; j++) if (mask >> j & 1) { sx += gens[j][0]; sy += gens[j][1]; } sums.push([sx, sy]); }
          L.dots(sums, { color: 'gold', r: gens.length > 9 ? 1.8 : 2.8 });
          L.dot(0, 0, { color: 'ink', r: 3, label: 'μ(∅)', labelPos: 'sw' });
          L.dot(B.tot[0] + (a ? a[0] : 0), B.tot[1] + (a ? a[1] : 0), { color: 'ink', r: 3, label: 'μ(Ω)', labelPos: 'ne' });
          // ---- construct E
          const yy = [y.x, y.y];
          let res = null, useAtom = false;
          if (inPoly(yy, B.poly)) res = lyapunovSet(F, yy);
          else if (a && inPoly([yy[0] - a[0], yy[1] - a[1]], B.poly)) { res = lyapunovSet(F, [yy[0] - a[0], yy[1] - a[1]]); useAtom = true; res.m = [res.m[0] + a[0], res.m[1] + a[1]]; }
          if (res) L.dot(res.m[0], res.m[1], { color: 'green', r: 8, hollow: true, width: 2.4 });
          else L.corner('y is in the convex hull but no set E has μ(E) = y', 'tl', { color: 'red', weight: 600 });
          // ---- right: densities, partition, E
          if (res) for (const [s, t] of res.E) R.vband(s, t, { color: 'green', alpha: 0.2 });
          for (let j = 1; j < N; j++) R.vline(j / N, { color: 'orange', width: 1, dash: [3, 4], alpha: 0.8 });
          R.hline(0, { color: 'faint', width: 1 });
          R.fn((t) => F(t)[0], { domain: [0, 1], color: 'blue', width: 2.3 });
          R.fn((t) => F(t)[1], { domain: [0, 1], color: 'purple', width: 2.3 });
          R.tex('f_1', 0.03, F(0.03)[0], { color: 'blue', dy: -13, align: 'left' });
          R.tex('f_2', 0.97, F(0.97)[1], { color: 'purple', dy: -13, align: 'right' });
          if (a) { const [r0, r1] = R.bounds.y; const ac = useAtom ? 'green' : res ? 'muted' : 'red'; R.arrow(0.7, r0 + 0.08 * (r1 - r0), 0.7, r1 - 0.12 * (r1 - r0), { color: ac, width: 2.2 }); R.text(useAtom ? 'atom ∈ E' : 'atom', 0.7, r1 - 0.06 * (r1 - r0), { color: ac, align: 'center', size: 11.5 }); }
          st = { yy, res, useAtom, a, N };
        });
        v.readout(() => {
          const s = st;
          if (!s.res) return `$y=(${v.fix(s.yy[0], 3)},\\,${v.fix(s.yy[1], 3)})$ is a convex combination of values of $\\mu$, but the atom makes the range a union of two copies with a gap: the non-atomic hypothesis is essential.`;
          const err = Math.hypot(s.res.m[0] - s.yy[0], s.res.m[1] - s.yy[1]);
          return `$y=(${v.fix(s.yy[0], 4)},\\,${v.fix(s.yy[1], 4)})$; $E$ is a union of ${s.res.E.length} interval${s.res.E.length === 1 ? '' : 's'}${s.useAtom ? ' plus the atom' : ''} and $\\mu(E)=(${v.fix(s.res.m[0], 4)},\\,${v.fix(s.res.m[1], 4)})$, error $${v.M.sci(err, 2)}$. The atomic approximation attains only $2^{${s.N + (s.a ? 1 : 0)}}$ values.`;
        });
      },
    },
  ],
};
