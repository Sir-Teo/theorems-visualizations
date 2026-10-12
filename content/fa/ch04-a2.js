// Rudin, Functional Analysis — Chapter 4 (part 2): adjoints and the closed range theorem, 4.10–4.15

// ---------------------------------------------------------------- shared helpers
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
const conj = (p) => (p === 1 ? Infinity : p === Infinity ? 1 : p / (p - 1));
const pn = (x, p) => (p === Infinity ? Math.max(Math.abs(x[0]), Math.abs(x[1])) : p === 1 ? Math.abs(x[0]) + Math.abs(x[1]) : Math.pow(Math.abs(x[0]) ** p + Math.abs(x[1]) ** p, 1 / p));
const pTeX = (p) => (p === Infinity ? '\\infty' : String(p));
function sphere(p, n = 720) {
  const out = [];
  for (let i = 0; i < n; i++) { const t = 2 * Math.PI * i / n, c = Math.cos(t), s = Math.sin(t), r = 1 / pn([c, s], p); out.push([r * c, r * s]); }
  return out;
}
function levelLine(S, a, c, st) {
  const n2 = dot2(a, a); if (n2 < 1e-14) return;
  const p = [a[0] * c / n2, a[1] * c / n2], t = [-a[1], a[0]], k = 60 / Math.sqrt(n2);
  S.line(p[0] - t[0] * k, p[1] - t[1] * k, p[0] + t[0] * k, p[1] + t[1] * k, st);
}
const unit3 = (a) => { const n = Math.hypot(...a); return a.map((x) => x / n); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** Orthonormal frame [a, b, n] with n pointing in direction (az, el) (degrees). */
function frame(az, el) {
  const A = az * Math.PI / 180, E = el * Math.PI / 180;
  const n = [Math.cos(E) * Math.cos(A), Math.cos(E) * Math.sin(A), Math.sin(E)];
  const a = unit3(Math.abs(n[2]) < 0.95 ? cross(n, [0, 0, 1]) : cross(n, [1, 0, 0]));
  return [a, cross(n, a), n];
}
function plane3(S, a, b, h, st, n = 6) {
  const P = (s, t) => [0, 1, 2].map((i) => s * a[i] + t * b[i]);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const s0 = -h + 2 * h * i / n, s1 = -h + 2 * h * (i + 1) / n, t0 = -h + 2 * h * j / n, t1 = -h + 2 * h * (j + 1) / n;
    S.poly([P(s0, t0), P(s1, t0), P(s1, t1), P(s0, t1)], { fill: st.color, fillAlpha: st.fillAlpha ?? 0.16, stroke: false });
  }
  S.path([P(-h, -h), P(h, -h), P(h, h), P(-h, h)], { close: true, color: st.color, width: st.width ?? 1.4, alpha: 0.85 });
  for (const s of [-h / 2, 0, h / 2]) { S.line(P(s, -h), P(s, h), { color: st.color, width: 0.7, alpha: 0.35 }); S.line(P(-h, s), P(h, s), { color: st.color, width: 0.7, alpha: 0.35 }); }
}
/** Draw an n×n corner of an infinite matrix entry(i, j) (0-based) with its top-left cell at (x0, y0 + n). */
function matGrid(S, entry, n, x0, y0, color, fmt) {
  let mx = 1e-12; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) mx = Math.max(mx, Math.abs(entry(i, j)));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const a = entry(i, j), X = x0 + j, Y = y0 + n - 1 - i;
    S.rect(X, Y, X + 1, Y + 1, { color: 'grid', width: 0.8 });
    if (Math.abs(a) > 1e-12) {
      S.rect(X + 0.06, Y + 0.06, X + 0.94, Y + 0.94, { fill: color, fillAlpha: 0.12 + 0.6 * Math.abs(a) / mx, stroke: false });
      S.text(fmt(a), X + 0.5, Y + 0.5, { align: 'center', size: 9.5, color: 'ink', halo: false });
    }
  }
  S.rect(x0, y0, x0 + n, y0 + n, { color: 'muted', width: 1.2 });
}
const frac = (a) => { for (let d = 1; d <= 12; d++) { const n = Math.round(a * d); if (Math.abs(n / d - a) < 1e-9) return d === 1 ? String(n) : `${n}/${d}`; } return (Math.round(a * 100) / 100).toString(); };

export default {
  book: 'fa',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'The adjoint operator T* and ‖T*‖ = ‖T‖',
      statement: String.raw`Let $X$ and $Y$ be normed spaces. For every $T\in\mathscr B(X,Y)$ there is exactly one $T^*\in\mathscr B(Y^*,X^*)$ such that
$$\langle Tx,y^*\rangle=\langle x,T^*y^*\rangle\qquad(x\in X,\ y^*\in Y^*),$$
namely $T^*y^*=y^*\circ T$. This **adjoint** satisfies $\|T^*\|=\|T\|$.`,
      idea: String.raw`$y^*\circ T$ is a continuous linear functional on $X$, and the identity forces $T^*y^*=y^*\circ T$, which gives existence and uniqueness; $T^*$ is clearly linear. From $|\langle x,T^*y^*\rangle|\le\|y^*\|\,\|T\|\,\|x\|$ we get $\|T^*\|\le\|T\|$. Conversely, by 4.3(b), $\|Tx\|=\sup_{\|y^*\|\le1}|\langle Tx,y^*\rangle|=\sup_{\|y^*\|\le1}|\langle x,T^*y^*\rangle|\le\|T^*\|\,\|x\|$. With the bilinear pairing a matrix's adjoint is its plain transpose (no complex conjugation — that is the Hilbert-space adjoint of Chapter 12).`,
      caption: String.raw`$X=Y=(\R^2,\|\cdot\|_p)$, functionals drawn as vectors through the pairing. Drag $y^*$ on the right: its level lines (orange) are pulled back by $T$ to the level lines of $T^*y^*=y^*\circ T$ on the left — the transpose matrix acting on the dual vector. Drag $x$: it and $Tx$ always sit on the same level (gold), which is the identity $\langle Tx,y^*\rangle=\langle x,T^*y^*\rangle$. Try the rank-one $T$: all pulled-back level lines are parallel to $\mathscr N(T)$.`,
      deps: ['fa-4.1', 'fa-4.3'],
      see: ['rca-4.12'],
      tags: ['adjoint', 'duality', 'operator norm'],
      viz(v) {
        const MATS = {
          shear: { label: 'shear', A: [[1.1, 0.7], [0.15, 0.8]] },
          rot: { label: 'rotation-scaling', A: [[0.95, -0.7], [0.55, 0.85]] },
          diag: { label: 'diagonal', A: [[1.4, 0], [0, 0.55]] },
          rank1: { label: 'rank one', A: [[0.9, 0.6], [0.45, 0.3]] },
        };
        const mS = v.select('$T$', Object.entries(MATS).map(([value, o]) => ({ value, label: o.label })), 'shear');
        const pS = v.select('$p=$', [{ value: 1, label: '$1$' }, { value: 2, label: '$2$' }, { value: Infinity, label: '$\\infty$' }], 2);
        const L = v.stage({ x: [-2.1, 2.1], y: [-1.75, 1.75], equal: true, height: 330, ticks: false, title: '$X$: level lines of $T^*y^*$, unit ball $B_X$' });
        const R = v.stage({ x: [-2.1, 2.1], y: [-1.75, 1.75], equal: true, height: 330, ticks: false, title: '$Y$: level lines of $y^*$, image $T(B_X)$' });
        const yh = R.handle(0.75, 0.62, { color: 'orange', label: 'y*' });
        const xh = L.handle(0.55, 0.38, { color: 'accent', label: 'x', labelPos: 'sw' });
        let st = {};
        v.render(() => {
          const A = MATS[mS.value].A, p = pS.value, q = conj(p);
          const T = (x) => [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]];
          const Tt = (y) => [A[0][0] * y[0] + A[1][0] * y[1], A[0][1] * y[0] + A[1][1] * y[1]];
          const ys = [yh.x, yh.y], ts = Tt(ys), x = [xh.x, xh.y], Tx = T(x);
          const lev = dot2(Tx, ys), h = 0.4;
          for (let k = -9; k <= 9; k++) {
            const sty = { color: 'orange', width: k === 0 ? 1.6 : 1, alpha: k === 0 ? 0.8 : 0.4 };
            levelLine(R, ys, k * h, sty); levelLine(L, ts, k * h, sty);
          }
          levelLine(R, ys, lev, { color: 'gold', width: 2.4 }); levelLine(L, ts, lev, { color: 'gold', width: 2.4 });
          // X
          L.poly(sphere(p, 400), { fill: 'blue', fillAlpha: 0.14, color: 'blue', width: 2 });
          if (Math.hypot(...ts) > 1e-6) L.arrow(0, 0, ts[0], ts[1], { color: 'purple', width: 2.4, head: 10 });
          L.text('T*y*', ts[0], ts[1], { color: 'purple', math: true, dx: 8, dy: -10, size: 15 });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          // Y
          R.poly(sphere(p, 400).map(T), { fill: 'blue', fillAlpha: 0.2, color: 'blue', width: 2 });
          R.arrow(0, 0, ys[0], ys[1], { color: 'orange', width: 2.4, head: 10 });
          R.dot(0, 0, { color: 'ink', r: 2.5 });
          R.dot(Tx[0], Tx[1], { color: 'accent', r: 5, label: 'Tx', labelPos: 'sw' });
          L.text(`⟨x, T*y*⟩ = ${v.fmt(lev, 3)}`, x[0], x[1], { color: 'gold', dx: 14, dy: 16, size: 12, weight: 600 });
          R.text(`⟨Tx, y*⟩ = ${v.fmt(lev, 3)}`, Tx[0], Tx[1], { color: 'gold', dx: 14, dy: 16, size: 12, weight: 600 });
          // norms, computed independently
          let nT = 0; for (const s of sphere(p, 1440)) nT = Math.max(nT, pn(T(s), p));
          let nTs = 0; for (const s of sphere(q, 1440)) nTs = Math.max(nTs, pn(Tt(s), q));
          L.corner(`‖T*‖ = ${v.fmt(nTs, 4)}`, 'tl', { color: 'purple', weight: 600 });
          R.corner(`‖T‖ = ${v.fmt(nT, 4)}`, 'tl', { color: 'blue', weight: 600 });
          st = { lev, lev2: dot2(x, ts), nT, nTs, q, nts: pn(ts, q), nys: pn(ys, q) };
        });
        v.legend([['orange', 'level lines of $y^*$ and of $T^*y^*$'], ['gold', 'the common level $\\langle Tx,y^*\\rangle$'], ['purple', '$T^*y^*$ (as a vector)'], ['blue', '$B_X$ and $T(B_X)$', { area: true }]]);
        v.readout(() => {
          const s = st;
          return `$\\langle Tx,y^*\\rangle = ${v.fix(s.lev, 4)}$, $\\;\\langle x,T^*y^*\\rangle = ${v.fix(s.lev2, 4)}$. $\\quad\\|T\\| = \\max_{\\|x\\|\\le1}\\|Tx\\| = ${v.fix(s.nT, 4)}$ and $\\|T^*\\| = \\max_{\\|y^*\\|_{${pTeX(s.q)}}\\le1}\\|T^*y^*\\|_{${pTeX(s.q)}} = ${v.fix(s.nTs, 4)}$; here $\\|T^*y^*\\| = ${v.fix(s.nts, 3)}\\le\\|T\\|\\,\\|y^*\\| = ${v.fix(s.nT * s.nys, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Theorem',
      name: 'Null spaces and ranges: N(T*) = R(T)^⊥',
      statement: String.raw`Let $X$ and $Y$ be Banach spaces and $T\in\mathscr B(X,Y)$, and write $\mathscr N$ for null spaces and $\mathscr R$ for ranges. Then
$$\mathscr N(T^*)=\mathscr R(T)^\perp\qquad\text{and}\qquad \mathscr N(T)={}^\perp\mathscr R(T^*).$$`,
      idea: String.raw`Both are a chain of equivalences driven by $\langle Tx,y^*\rangle=\langle x,T^*y^*\rangle$. For the first: $y^*\in\mathscr N(T^*)$ iff $\langle x,T^*y^*\rangle=0$ for all $x$ iff $\langle Tx,y^*\rangle=0$ for all $x$ iff $y^*\in\mathscr R(T)^\perp$. For the second: $x\in\mathscr N(T)$ iff $\langle Tx,y^*\rangle=0$ for all $y^*$ (by 4.3(b), functionals separate points) iff $\langle x,T^*y^*\rangle=0$ for all $y^*$ iff $x\in{}^\perp\mathscr R(T^*)$.`,
      caption: String.raw`A rank-$2$ (or rank-$1$) map $T:\R^3\to\R^3$, with functionals drawn as vectors through the pairing $\sum x_ix_i^*$, so $T^*$ is the transpose and annihilators look like orthogonal complements. Left, in $X$: the null space $\mathscr N(T)$ (red) is exactly what $\mathscr R(T^*)$ (green) annihilates. Right, in $Y$: $\mathscr N(T^*)$ (red) annihilates the range $\mathscr R(T)$ (blue). Turn the two subspaces with the sliders; drag a panel to rotate it. The gold vectors are $x$ and $Tx$.`,
      deps: ['fa-4.10', 'fa-4.6', 'fa-4.3'],
      tags: ['adjoint', 'annihilators', 'range'],
      viz(v) {
        const rkS = v.select('rank of $T$', [{ value: 2, label: '$2$' }, { value: 1, label: '$1$' }], 2);
        const aS = v.slider('turn $\\mathscr N(T)$', -180, 180, 20, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const bS = v.slider('turn $\\mathscr R(T)$', -180, 180, -40, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const L = v.stage3d({ range: 1.8, axisLength: 1.5, height: 340, yaw: -0.7, pitch: 0.36, labels: ['', '', ''], title: '$X$: $\\mathscr N(T)$ and $\\mathscr R(T^*)$' });
        const R = v.stage3d({ range: 1.8, axisLength: 1.5, height: 340, yaw: -0.7, pitch: 0.36, labels: ['', '', ''], title: '$Y$: $\\mathscr R(T)$ and $\\mathscr N(T^*)$' });
        const x0 = [0.55, 0.75, 0.6];
        let st = {};
        v.render(() => {
          const rk = rkS.value;
          const [v1, v2, v3] = frame(aS.value, 48), [u1, u2, u3] = frame(bS.value, 58);
          const sg = [1.15, 0.8];
          // T = σ1 u1 v1ᵀ + σ2 u2 v2ᵀ (rank 2) or σ1 u1 v1ᵀ (rank 1); T* = transpose
          const T = (x) => { const c1 = sg[0] * dot3(v1, x), c2 = rk === 2 ? sg[1] * dot3(v2, x) : 0; return [0, 1, 2].map((i) => c1 * u1[i] + c2 * u2[i]); };
          const Ts = (y) => { const c1 = sg[0] * dot3(u1, y), c2 = rk === 2 ? sg[1] * dot3(u2, y) : 0; return [0, 1, 2].map((i) => c1 * v1[i] + c2 * v2[i]); };
          const line = (S, d, color, w = 4, len = 1.55) => S.line(d.map((t) => -len * t), d.map((t) => len * t), { color, width: w });
          if (rk === 2) {
            plane3(L, v1, v2, 1.05, { color: 'green', fillAlpha: 0.15 });
            line(L, v3, 'red');
            L.tex('\\mathscr N(T)', v3.map((t) => 1.68 * t), { color: 'red', size: 14 });
            L.tex('\\mathscr R(T^*)', [0, 1, 2].map((i) => 1.1 * v1[i] + 1.1 * v2[i]), { color: 'green', size: 14 });
            plane3(R, u1, u2, 1.05, { color: 'blue', fillAlpha: 0.15 });
            line(R, u3, 'red');
            R.tex('\\mathscr N(T^*)', u3.map((t) => 1.68 * t), { color: 'red', size: 14 });
            R.tex('\\mathscr R(T)', [0, 1, 2].map((i) => 1.1 * u1[i] + 1.1 * u2[i]), { color: 'blue', size: 14 });
          } else {
            plane3(L, v2, v3, 1.05, { color: 'red', fillAlpha: 0.13 });
            line(L, v1, 'green');
            L.tex('\\mathscr R(T^*)', v1.map((t) => 1.68 * t), { color: 'green', size: 14 });
            L.tex('\\mathscr N(T)', [0, 1, 2].map((i) => 1.1 * v2[i] + 1.1 * v3[i]), { color: 'red', size: 14 });
            plane3(R, u2, u3, 1.05, { color: 'red', fillAlpha: 0.13 });
            line(R, u1, 'blue');
            R.tex('\\mathscr R(T)', u1.map((t) => 1.68 * t), { color: 'blue', size: 14 });
            R.tex('\\mathscr N(T^*)', [0, 1, 2].map((i) => 1.1 * u2[i] + 1.1 * u3[i]), { color: 'red', size: 14 });
          }
          const Tx = T(x0);
          L.arrow([0, 0, 0], x0, { color: 'gold', width: 2.4, head: 9 }); L.text('x', x0.map((t) => t * 1.15), { color: 'gold', math: true, size: 16 });
          R.arrow([0, 0, 0], Tx, { color: 'gold', width: 2.4, head: 9 }); R.text('Tx', Tx.map((t) => t * 1.2), { color: 'gold', math: true, size: 16 });
          L.dot([0, 0, 0], { color: 'ink', r: 3 }); R.dot([0, 0, 0], { color: 'ink', r: 3 });
          // numerical checks
          const nT = rk === 2 ? [v3] : [v2, v3], nTs = rk === 2 ? [u3] : [u2, u3];
          const rTs = rk === 2 ? [v1, v2] : [v1], rT = rk === 2 ? [u1, u2] : [u1];
          let e1 = 0, e2 = 0, e3 = 0;
          for (const y of nTs) { e1 = Math.max(e1, Math.hypot(...Ts(y))); for (const r of rT) e2 = Math.max(e2, Math.abs(dot3(y, r))); }
          for (const x of nT) { e3 = Math.max(e3, Math.hypot(...T(x))); for (const r of rTs) e3 = Math.max(e3, Math.abs(dot3(x, r))); }
          st = { rk, e1, e2, e3 };
        });
        v.legend([['red', 'null spaces $\\mathscr N(T)$, $\\mathscr N(T^*)$'], ['blue', 'range $\\mathscr R(T)\\subset Y$'], ['green', 'range $\\mathscr R(T^*)\\subset X^*$'], ['gold', '$x$ and $Tx$']]);
        v.readout(() => {
          const s = st, z = (e) => v.fix(e < 5e-13 ? 0 : e, 3);
          return `rank $${s.rk}$: $\\dim\\mathscr N(T^*) = ${3 - s.rk}$ $= 3-\\dim\\mathscr R(T)$. Checks: $\\max\\|T^*y^*\\|$ over a basis of $\\mathscr N(T^*)$ $= ${z(s.e1)}$; $\\max|\\langle Tx,y^*\\rangle|$ for $Tx\\in\\mathscr R(T)$, $y^*\\in\\mathscr N(T^*)$: $${z(s.e2)}$; $\\max(\\|Tx\\|,|\\langle x,T^*y^*\\rangle|)$ for $x\\in\\mathscr N(T)$: $${z(s.e3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12a
    {
      num: '4.12a',
      kind: 'Corollary',
      name: 'Dense range iff the adjoint is one-to-one',
      statement: String.raw`Let $X$, $Y$ be Banach spaces and $T\in\mathscr B(X,Y)$.
(a) $\mathscr N(T^*)$ is weak$^*$-closed in $Y^*$.
(b) $\mathscr R(T)$ is dense in $Y$ if and only if $T^*$ is one-to-one.
(c) $T$ is one-to-one if and only if $\mathscr R(T^*)$ is weak$^*$-dense in $X^*$.`,
      idea: String.raw`(a) $\mathscr N(T^*)=\mathscr R(T)^\perp$ (4.12), and annihilators are weak$^*$-closed (4.6). (b) By 4.7(a) the closure of $\mathscr R(T)$ is $\,{}^\perp(\mathscr R(T)^\perp)={}^\perp\mathscr N(T^*)$, which is all of $Y$ exactly when $\mathscr N(T^*)=\{0\}$. (c) By 4.7(b) the weak$^*$-closure of $\mathscr R(T^*)$ is $({}^\perp\mathscr R(T^*))^\perp=\mathscr N(T)^\perp$, which is $X^*$ exactly when $\mathscr N(T)=\{0\}$. Quantitatively: the distance from $y$ to $\overline{\mathscr R(T)}$ is the size of the part of $y$ seen by $\mathscr N(T^*)$.`,
      caption: String.raw`Operators on real $\ell^2$ (so $T^*$ is the transpose). Left: the corner of the infinite matrix. Right: least-squares attempts to solve $Tx=y$ for $y=(0.9/n)$ using $x$ supported on the first $N$ coordinates (log scale). The residual (blue) tends to $0$ iff $\mathscr R(T)$ is dense iff $T^*$ is one-to-one; for the forward shift it stalls at $|y_1|$ because $e_1\in\mathscr N(T^*)$. The orange curve $\|x^{(N)}\|$ grows without bound: dense is not the same as closed (or onto).`,
      deps: ['fa-4.12', 'fa-4.7', 'fa-4.6'],
      tags: ['adjoint', 'dense range', 'weak* topology'],
      verify: true,
      viz(v) {
        const OPS = {
          diag: { label: '$\\operatorname{diag}(1/n)$' },
          fwd: { label: 'forward shift $Te_n=\\frac1n e_{n+1}$' },
          bwd: { label: 'its adjoint $Te_{n+1}=\\frac1n e_n$' },
        };
        const oS = v.select('$T=$', Object.entries(OPS).map(([value, o]) => ({ value, label: o.label })), 'fwd');
        const nS = v.slider('$N$', 1, 400, 120, { int: true });
        const G = v.stage({ x: [-0.6, 10.6], y: [-0.7, 10.4], equal: true, height: 320, axes: false, ticks: false, weight: 0.8, title: 'the $10\\times10$ corner of $T$ (row $i$ = coordinate of $Te_j$)' });
        const P = v.stage({ x: [-18, 412], y: [-2.3, 2.3], height: 320, axes: 'box', weight: 1.2, xticks: [1, 100, 200, 300, 400], yticks: [[-2, '0.01'], [-1, '0.1'], [0, '1'], [1, '10'], [2, '100']], title: 'residual $\\|y-Tx^{(N)}\\|$ and size $\\|x^{(N)}\\|$ (log scale)' });
        const w = (n) => 1 / n, y = (n) => 0.9 / n;
        const ENT = {
          diag: (i, j) => (i === j ? 1 / (i + 1) : 0),
          fwd: (i, j) => (i === j + 1 ? w(j + 1) : 0),
          bwd: (i, j) => (j === i + 1 ? w(i + 1) : 0),
        };
        // residual and ‖x^(N)‖ for N = 1..400, with tails summed to n = 20000
        const NT = 20000;
        const tail = new Float64Array(NT + 2); for (let n = NT; n >= 1; n--) tail[n] = tail[n + 1] + y(n) ** 2;
        const curves = {};
        for (const k of Object.keys(OPS)) {
          const res = [], siz = []; let s2 = 0;
          for (let N = 1; N <= 400; N++) {
            let r2;
            if (k === 'diag') { s2 += (y(N) / w(N)) ** 2; r2 = tail[N + 1]; }
            else if (k === 'fwd') { s2 += (y(N + 1) / w(N)) ** 2; r2 = y(1) ** 2 + tail[N + 2]; }
            else { if (N >= 2) s2 += (y(N - 1) / w(N - 1)) ** 2; r2 = tail[N]; }
            res.push([N, Math.log10(Math.sqrt(r2))]); siz.push([N, Math.log10(Math.max(1e-3, Math.sqrt(s2)))]);
          }
          curves[k] = { res, siz };
        }
        let st = {};
        v.render(() => {
          const k = oS.value, N = nS.value, C = curves[k];
          matGrid(G, ENT[k], 10, 0, 0, 'blue', frac);
          for (let j = 0; j < 10; j++) G.text(`e${'₁₂₃₄₅₆₇₈₉'[j] || '₁₀'}`, j + 0.5, 10.15, { align: 'center', size: 10, color: 'muted' });
          if (k === 'fwd') { G.rect(0, 9, 10, 10, { color: 'red', width: 2 }); G.text('row 1 is zero: e₁ ⟂ 𝓡(T)', 5, -0.35, { align: 'center', color: 'red', size: 11.5, weight: 600 }); }
          if (k === 'bwd') { G.rect(0, 0, 1, 10, { color: 'red', width: 2 }); G.text('column 1 is zero: Te₁ = 0', 5, -0.35, { align: 'center', color: 'red', size: 11.5, weight: 600 }); }
          P.path(C.res, { color: 'blue', width: 2.4 });
          P.path(C.siz, { color: 'orange', width: 2.4 });
          if (k === 'fwd') { P.hline(Math.log10(y(1)), { color: 'red', width: 1.4, dash: [6, 4] }); P.text('floor |y₁| = dist(y, closure of 𝓡(T))', 400, Math.log10(y(1)) - 0.2, { align: 'right', color: 'red', size: 11.5 }); }
          P.vline(N, { color: 'gold', width: 1.2, dash: [3, 3] });
          P.dot(N, C.res[N - 1][1], { color: 'blue', r: 5 }); P.dot(N, C.siz[N - 1][1], { color: 'orange', r: 5 });
          st = { k, N, res: 10 ** C.res[N - 1][1], siz: 10 ** C.siz[N - 1][1] };
        });
        v.legend([['blue', 'residual $\\|y-Tx^{(N)}\\|$'], ['orange', '$\\|x^{(N)}\\|$'], ['red', 'obstruction from $\\mathscr N(T^*)$', { dash: true }]]);
        v.readout(() => {
          const s = st;
          const head = `$N=${s.N}$: residual $${v.fix(s.res, 4)}$, $\\|x^{(N)}\\| = ${v.fix(s.siz, 2)}$. `;
          if (s.k === 'diag') return head + '$\\mathscr N(T^*)=\\{0\\}$, so $\\mathscr R(T)$ is dense (b); $T$ is one-to-one, so $\\mathscr R(T^*)=\\mathscr R(T)$ is weak$^*$-dense (c). Yet $y\\notin\\mathscr R(T)$: its preimage would be $(0.9,0.9,\\dots)\\notin\\ell^2$.';
          if (s.k === 'fwd') return head + '$T^*e_1=0$, so $\\mathscr R(T)$ is not dense: it lies in $e_1^{\\perp}$ (b). $T$ itself is one-to-one, so $\\mathscr R(T^*)$ is weak$^*$-dense (c) — select the adjoint to see it.';
          return head + '$T^*$ is the forward shift, which is one-to-one, so $\\mathscr R(T)$ is dense (b); but $Te_1=0$, so by (c) $\\mathscr R(T^*)$ is not weak$^*$-dense.';
        });
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Theorem',
      name: 'Surjectivity from a lower bound on the adjoint',
      statement: String.raw`Let $U$ and $V$ be the open unit balls of Banach spaces $X$ and $Y$, let $T\in\mathscr B(X,Y)$ and $\delta>0$. Then (a) $\Rightarrow$ (b) $\Rightarrow$ (c) $\Rightarrow$ (d), where
(a) $\|T^*y^*\|\ge\delta\|y^*\|$ for every $y^*\in Y^*$;
(b) $\overline{T(U)}\supset\delta V$;
(c) $T(U)\supset\delta V$;
(d) $T(X)=Y$.
Moreover, if (d) holds, then (a) holds for some $\delta>0$.`,
      idea: String.raw`(a)$\Rightarrow$(b): if $y_0\notin\overline{T(U)}$, separate it from this closed convex balanced set (3.7): some $y^*$ has $|\langle y,y^*\rangle|\le1$ on $T(U)$ but $|\langle y_0,y^*\rangle|>1$. Then $\|T^*y^*\|=\sup_{x\in U}|\langle Tx,y^*\rangle|\le1$, so $\delta\|y^*\|\le1<\|y^*\|\|y_0\|$ and $\|y_0\|>\delta$. (b)$\Rightarrow$(c) is the successive-approximation argument from the open mapping theorem, using completeness of $X$; (c)$\Rightarrow$(d) is scaling. If (d) holds, the open mapping theorem (2.11) gives $T(U)\supset\delta V$, and then $\|T^*y^*\|=\sup_{x\in U}|\langle Tx,y^*\rangle|\ge\sup_{y\in\delta V}|\langle y,y^*\rangle|=\delta\|y^*\|$.`,
      caption: String.raw`$X=Y=(\R^2,\|\cdot\|_p)$; drag the columns $Te_1$, $Te_2$. Right: the image $T(U)$ and the largest ball $\delta V$ inside it (green), found from $T^{-1}$. Left, in $Y^*$: the curve $y^*\mapsto\|T^*y^*\|\,y^*$ over the dual unit sphere — the support function of $T(U)$ — and the dual sphere scaled by $\delta$, which it touches at $y_0^*$. Both computations give the same $\delta$; the level line $\langle\cdot,y_0^*\rangle=\delta$ supports both $T(U)$ and $\delta V$. Make the columns parallel: $\delta\to0$, $T^*$ has a kernel, and $T$ is no longer onto.`,
      deps: ['fa-4.10', 'fa-3.7', 'fa-2.11', 'fa-4.3'],
      tags: ['adjoint', 'open mapping', 'surjectivity'],
      viz(v) {
        const pS = v.select('$p=$', [{ value: 1, label: '$1$' }, { value: 2, label: '$2$' }, { value: 4, label: '$4$' }, { value: Infinity, label: '$\\infty$' }], 2);
        const L = v.stage({ x: [-2.1, 2.1], y: [-1.75, 1.75], equal: true, height: 330, ticks: false, title: '$Y^*$: $\\|T^*y^*\\|$ along the dual unit sphere' });
        const R = v.stage({ x: [-2.1, 2.1], y: [-1.75, 1.75], equal: true, height: 330, ticks: false, title: '$Y$: $T(U)\\supset\\delta V$' });
        const c1 = R.handle(1.25, 0.35, { color: 'orange', label: 'Te₁', labelPos: 'se' });
        const c2 = R.handle(0.35, 0.95, { color: 'orange', label: 'Te₂', labelPos: 'nw' });
        let st = {};
        v.render(() => {
          const p = pS.value, q = conj(p);
          const A = [[c1.x, c2.x], [c1.y, c2.y]];
          const T = (x) => [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]];
          const Tt = (y) => [A[0][0] * y[0] + A[1][0] * y[1], A[0][1] * y[0] + A[1][1] * y[1]];
          const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
          // δ from the geometry: radial function of T(U) is 1/‖T⁻¹e‖_p for ‖e‖_p = 1
          const onS = (th, pp) => { const c = Math.cos(th), sn = Math.sin(th), r = pn([c, sn], pp); return [c / r, sn / r]; };
          // refine a sampled minimum of F(θ) by ternary search on the neighbouring interval
          const refine = (F, i0, N) => { let a = 2 * Math.PI * (i0 - 1) / N, b = 2 * Math.PI * (i0 + 1) / N; for (let it = 0; it < 60; it++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (F(m1) > F(m2)) a = m1; else b = m2; } return (a + b) / 2; };
          let dGeo = 0, eMin = [1, 0];
          if (Math.abs(det) > 1e-9) {
            const G = (th) => { const e = onS(th, p), z = [(A[1][1] * e[0] - A[0][1] * e[1]) / det, (-A[1][0] * e[0] + A[0][0] * e[1]) / det]; return 1 / pn(z, p); };
            let bi = 0, bv = Infinity; for (let i = 0; i < 1440; i++) { const g = G(2 * Math.PI * i / 1440); if (g < bv) { bv = g; bi = i; } }
            const th = refine(G, bi, 1440); dGeo = Math.min(bv, G(th)); eMin = onS(th, p);
          }
          // δ from the adjoint: min over ‖y*‖_q = 1 of ‖T*y*‖_q
          const H = (th) => pn(Tt(onS(th, q)), q);
          const ds = sphere(q, 1440);
          let bi = 0, dAdj = Infinity;
          const curve = ds.map((y, i) => { const n = pn(Tt(y), q); if (n < dAdj) { dAdj = n; bi = i; } return [n * y[0], n * y[1]]; });
          const thA = refine(H, bi, 1440); dAdj = Math.min(dAdj, H(thA));
          const yMin = onS(thA, q);
          const singular = Math.abs(det) <= 1e-9 || dGeo < 1e-6;
          // ---- Y*
          L.poly(ds, { color: 'purple', width: 1.2, dash: [4, 4], alpha: 0.8 });
          L.poly(curve, { fill: 'blue', fillAlpha: 0.12, color: 'blue', width: 2.2 });
          if (!singular) L.poly(ds.map(([a, b]) => [dAdj * a, dAdj * b]), { color: 'green', width: 2.2, fill: 'green', fillAlpha: 0.1 });
          L.line(0, 0, yMin[0], yMin[1], { color: 'green', width: 1.4, dash: [3, 3] });
          L.dot(yMin[0], yMin[1], { color: 'green', r: 5, label: 'y₀*', labelPos: yMin[0] >= 0 ? 'e' : 'w' });
          L.dot(dAdj * yMin[0], dAdj * yMin[1], { color: 'green', r: 4 });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          // ---- Y
          R.poly(sphere(p, 720).map(T), { fill: 'blue', fillAlpha: 0.2, color: 'blue', width: 2 });
          R.poly(sphere(p, 400), { color: 'muted', width: 1, dash: [4, 4] });
          if (!singular) {
            R.poly(sphere(p, 720).map(([a, b]) => [dGeo * a, dGeo * b]), { fill: 'green', fillAlpha: 0.18, color: 'green', width: 2.2 });
            levelLine(R, yMin, dAdj, { color: 'green', width: 1.3, dash: [6, 4] });
            levelLine(R, yMin, -dAdj, { color: 'green', width: 1.3, dash: [6, 4] });
            R.dot(dGeo * eMin[0], dGeo * eMin[1], { color: 'green', r: 4.5 });
          } else {
            levelLine(R, yMin, 0, { color: 'red', width: 1.6, dash: [6, 4] });
            R.corner('T(X) is a line: T is not onto', 'tl', { color: 'red', weight: 600 });
            L.corner('T* kills y₀*: no δ > 0 works', 'tl', { color: 'red', weight: 600 });
          }
          R.arrow(0, 0, c1.x, c1.y, { color: 'orange', width: 1.5, head: 8 });
          R.arrow(0, 0, c2.x, c2.y, { color: 'orange', width: 1.5, head: 8 });
          R.dot(0, 0, { color: 'ink', r: 2.5 });
          st = { dGeo, dAdj, q, singular };
        });
        v.legend([['blue', '$T(U)$; on the left $\\{\\|T^*y^*\\|\\,y^*\\}$', { area: true }], ['green', '$\\delta V$ and $\\delta\\cdot$(dual sphere)', { area: true }], ['purple', 'unit sphere of $Y^*$', { dash: true }], ['orange', 'columns of $T$']]);
        v.readout(() => {
          const s = st;
          return `largest $\\delta$ with $T(U)\\supset\\delta V$ (via $T^{-1}$): $${v.fix(s.dGeo, 4)}$; $\\;\\inf_{y^*\\ne0}\\|T^*y^*\\|/\\|y^*\\| = ${v.fix(s.dAdj, 4)}$` + (!s.singular ? ' — (a) and (c) hold with the same $\\delta$, so $T$ is onto.' : ' — both vanish: $\\mathscr N(T^*)\\ne\\{0\\}$ and $T(X)\\ne Y$.');
        });
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Theorem',
      name: 'Closed range theorem',
      statement: String.raw`Let $X$ and $Y$ be Banach spaces and $T\in\mathscr B(X,Y)$. The following three conditions are equivalent:
(a) $\mathscr R(T)$ is closed in $Y$;
(b) $\mathscr R(T^*)$ is weak$^*$-closed in $X^*$;
(c) $\mathscr R(T^*)$ is norm-closed in $X^*$.`,
      idea: String.raw`(a)$\Rightarrow$(b): if $\mathscr R(T)$ is closed, $T$ maps $X$ onto the Banach space $\mathscr R(T)$, so by the open mapping theorem every $x^*\in\mathscr N(T)^\perp$ defines a bounded functional on $\mathscr R(T)$ via $Tx\mapsto\langle x,x^*\rangle$; extending it (Hahn–Banach) gives $y^*$ with $T^*y^*=x^*$. Thus $\mathscr R(T^*)=\mathscr N(T)^\perp$, which is weak$^*$-closed (4.6, 4.12). (b)$\Rightarrow$(c) is trivial. (c)$\Rightarrow$(a): let $Z=\overline{\mathscr R(T)}$ and view $T$ as a map $S:X\to Z$ with dense range; then $S^*$ is one-to-one (4.12a) and has the same closed range, so it is bounded below, and 4.13 shows $S$ is onto $Z$.`,
      caption: String.raw`A weighted shift on $\ell^2$: $Te_k=w_ke_{k+1}$, with adjoint $T^*e_{k+1}=w_ke_k$, $T^*e_1=0$ (top diagram; arrow widths $\propto|w_k|$). Both $T$ and $T^*$ send orthonormal vectors to orthogonal ones, so each has closed range exactly when the nonzero weights stay away from $0$; the bottom plot shows the ratios $\|Te_k\|/\operatorname{dist}(e_k,\mathscr N(T))=\|T^*e_{k+1}\|/\operatorname{dist}(e_{k+1},\mathscr N(T^*))=|w_k|$ and their infimum. Choose the weights: the three conditions hold or fail together.`,
      deps: ['fa-4.12', 'fa-4.12a', 'fa-4.13', 'fa-4.7', 'fa-2.11', 'fa-3.6'],
      tags: ['closed range', 'adjoint', 'open mapping'],
      viz(v) {
        const WS = {
          osc: { label: '$w_k=1+\\frac12\\sin k$', w: (k) => 1 + 0.5 * Math.sin(k) },
          gap: { label: '$w_k=0$ for $k\\le3$, else $1$', w: (k) => (k <= 3 ? 0 : 1) },
          harm: { label: '$w_k=1/k$', w: (k) => 1 / k },
          mix: { label: '$w_k=1$ ($k$ odd), $\\frac1{\\sqrt k}$ ($k$ even)', w: (k) => (k % 2 ? 1 : 1 / Math.sqrt(k)) },
        };
        const wS = v.select('', Object.entries(WS).map(([value, o]) => ({ value, label: o.label })), 'harm');
        const nS = v.slider('ratios shown for $k\\le$', 10, 120, 60, { int: true });
        const K = 12;
        const A = v.stage({ x: [0.2, K + 0.9], y: [-0.75, 2.05], height: 175, full: true, axes: false, ticks: false, title: 'top row: $T$ (arrows to the right); bottom row: $T^*$ (arrows to the left)' });
        const B = v.stage({ x: [-3, 61], y: [-0.3, 1.72], height: 210, full: true, axes: true, title: 'lower-bound ratios $|w_k|$ (over $w_k\\ne0$) and their infimum $\\gamma(T)=\\gamma(T^*)$' });
        let st = {};
        v.render(() => {
          const W = WS[wS.value].w, N = nS.value;
          // ---- chain diagram
          for (const [row, yy, dir] of [['T', 1.3, 1], ['T*', 0, -1]]) {
            A.text(row, 0.35, yy, { math: true, size: 15, color: dir > 0 ? 'blue' : 'purple', align: 'left' });
            for (let k = 1; k <= K; k++) {
              const x = k + 0.15;
              if (k < K) {
                const wk = W(k), a = x + 0.17, b = x + 1 - 0.17;
                if (Math.abs(wk) > 1e-12) {
                  if (dir > 0) A.arrow(a, yy, b, yy, { color: 'blue', width: 1 + 4 * Math.min(1.5, Math.abs(wk)), head: 8 });
                  else A.arrow(b, yy, a, yy, { color: 'purple', width: 1 + 4 * Math.min(1.5, Math.abs(wk)), head: 8 });
                } else A.text('0', (a + b) / 2, yy, { color: 'red', size: 13, align: 'center', weight: 700 });
                if (dir > 0) A.text(v.fmt(wk, 2), (a + b) / 2, 0.68, { color: 'muted', size: 10.5, align: 'center' });
              }
              const dead = dir < 0 ? k === 1 : Math.abs(W(k)) < 1e-12;
              A.dot(x, yy, { color: dead ? 'red' : dir > 0 ? 'blue' : 'purple', r: 6, hollow: true, width: 2 });
              A.text(`e${String(k).split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join('')}${dead ? ' ↦ 0' : ''}`, x, yy + (dir > 0 ? 0.38 : -0.38), { align: 'center', size: 11, color: dead ? 'red' : 'muted' });
            }
          }
          A.text('…', K + 0.55, 1.3, { size: 16, color: 'muted' }); A.text('…', K + 0.55, 0, { size: 16, color: 'muted' });
          // ---- ratios
          B.setView([-0.055 * N, N + 1], null);
          let inf = Infinity, kinf = 1;
          for (let k = 1; k <= N; k++) {
            const wk = Math.abs(W(k));
            if (wk < 1e-12) { B.dot(k, 0, { color: 'red', r: 3.5, hollow: true }); continue; }
            if (wk < inf) { inf = wk; kinf = k; }
            B.dot(k, wk, { color: 'blue', r: 3.2 });
          }
          let infAll = Infinity; for (let k = 1; k <= 100000; k++) { const wk = Math.abs(W(k)); if (wk > 1e-12) infAll = Math.min(infAll, wk); }
          const closed = infAll > 1e-3;
          B.hline(closed ? infAll : 0, { color: closed ? 'green' : 'red', width: 1.8, dash: [6, 4] });
          B.dot(kinf, inf, { color: 'gold', r: 5.5 });
          B.corner(closed ? `γ = inf |w_k| = ${v.fmt(infAll, 3)} > 0: all ranges closed` : `inf over k ≤ ${N} is ${v.fmt(inf, 3)} and → 0: no range is closed`, 'tr', { color: closed ? 'green' : 'red', weight: 600 });
          st = { closed, infAll, key: wS.value };
        });
        v.legend([['blue', '$T$ and the ratios $|w_k|$'], ['purple', '$T^*$'], ['red', 'zero weights (kernel) / $\\inf=0$'], ['green', '$\\gamma>0$', { dash: true }]]);
        v.readout(() => {
          const s = st, mk = (b) => (b ? '\\text{yes}' : '\\text{no}');
          const extra = s.key === 'harm' ? ' For example $y=\\sum_k k^{-0.9}e_{k+1}\\in\\overline{\\mathscr R(T)}$, but its only candidate preimage $\\sum_k k^{0.1}e_k$ is not in $\\ell^2$.' : s.key === 'gap' ? ' Here $\\mathscr N(T)=\\operatorname{span}\\{e_1,e_2,e_3\\}$ and $\\mathscr R(T^*)=\\mathscr N(T)^\\perp$.' : '';
          return `(a) $\\mathscr R(T)$ closed: $${mk(s.closed)}$; $\\;$(b) $\\mathscr R(T^*)$ weak$^*$-closed: $${mk(s.closed)}$; $\\;$(c) $\\mathscr R(T^*)$ norm-closed: $${mk(s.closed)}$.` + extra;
        });
      },
    },
    // ------------------------------------------------------------------ 4.15
    {
      num: '4.15',
      kind: 'Theorem',
      name: 'Surjectivity of T and of T* by duality',
      statement: String.raw`Let $X$ and $Y$ be Banach spaces and $T\in\mathscr B(X,Y)$.
(a) $\mathscr R(T)=Y$ if and only if $T^*$ is one-to-one and $\mathscr R(T^*)$ is norm-closed.
(b) $\mathscr R(T^*)=X^*$ if and only if $T$ is one-to-one and $\mathscr R(T)$ is norm-closed.`,
      idea: String.raw`(a) If $\mathscr R(T)=Y$, then $\mathscr N(T^*)=\mathscr R(T)^\perp=\{0\}$ (4.12) and $\mathscr R(T)$ is closed, so $\mathscr R(T^*)$ is closed by 4.14. Conversely, $T^*$ one-to-one makes $\mathscr R(T)$ dense (4.12a), and closedness of $\mathscr R(T^*)$ makes $\mathscr R(T)$ closed (4.14). (b) If $\mathscr R(T^*)=X^*$, then $\mathscr N(T)={}^\perp\mathscr R(T^*)=\{0\}$ and $\mathscr R(T^*)$ is closed, hence so is $\mathscr R(T)$. Conversely, $T$ one-to-one makes $\mathscr R(T^*)$ weak$^*$-dense, and closedness of $\mathscr R(T)$ makes $\mathscr R(T^*)$ weak$^*$-closed (4.14).`,
      caption: String.raw`Three kinds of operator on $\ell^2$ (left: corners of $T$ and of its transpose $T^*$). Right: the attempt to solve $Tx=y$ for $y=(1,\tfrac12,\tfrac13,\dots)$ — bars are the coordinates of the only candidate $x$. For $D_\varepsilon=\operatorname{diag}(\varepsilon+\tfrac1n)$ with $\varepsilon>0$ the candidate is in $\ell^2$; at $\varepsilon=0$ it is $(1,1,1,\dots)$: $T^*$ is still one-to-one but its range is no longer closed, and $T$ is not onto. The forward shift cannot reach $y_1$; the backward shift is onto. The readout checks both equivalences.`,
      deps: ['fa-4.14', 'fa-4.12', 'fa-4.12a'],
      tags: ['surjectivity', 'adjoint', 'closed range'],
      viz(v) {
        const OPS = {
          diag: { label: '$D_\\varepsilon$' },
          bwd: { label: 'backward shift $S^*$' },
          fwd: { label: 'forward shift $S$' },
        };
        const oS = v.select('$T=$', Object.entries(OPS).map(([value, o]) => ({ value, label: o.label })), 'bwd');
        const eS = v.slider('$\\varepsilon$ in $D_\\varepsilon$', 0, 0.5, 0.1, { step: 0.01 });
        const G = v.stage({ x: [-0.4, 17.4], y: [-1.2, 8.6], equal: true, height: 215, axes: false, ticks: false, full: true, title: '$8\\times8$ corners of $T$ (left) and $T^*$ (right)' });
        const P = v.stage({ x: [-1.2, 40.8], y: [-0.15, 1.25], height: 210, full: true, axes: 'box', xticks: [1, 5, 10, 15, 20, 25, 30, 35, 40], title: 'coordinates $x_n$ of the solution of $Tx=y$, $y_n=1/n$' });
        let st = {};
        v.render(() => {
          const k = oS.value, e = eS.value;
          eS.el.style.opacity = k === 'diag' ? 1 : 0.4;
          const ent = {
            diag: (i, j) => (i === j ? e + 1 / (i + 1) : 0),
            bwd: (i, j) => (j === i + 1 ? 1 : 0),
            fwd: (i, j) => (i === j + 1 ? 1 : 0),
          }[k];
          matGrid(G, ent, 8, 0, 0, 'blue', (a) => v.fmt(a, 2));
          matGrid(G, (i, j) => ent(j, i), 8, 9, 0, 'purple', (a) => v.fmt(a, 2));
          G.tex('T', 4, -0.6, { color: 'blue', size: 16 }); G.tex('T^*', 13, -0.6, { color: 'purple', size: 16 });
          // candidate solution
          const yv = (n) => 1 / n;
          let xs = [], ok = true, why = '', norm2 = 0;
          const NB = 40, NT = 200000;
          if (k === 'diag') { for (let n = 1; n <= NB; n++) xs.push(yv(n) / (e + 1 / n)); for (let n = 1; n <= NT; n++) norm2 += (yv(n) / (e + 1 / n)) ** 2; ok = e > 0; }
          else if (k === 'bwd') { xs.push(0); for (let n = 2; n <= NB; n++) xs.push(yv(n - 1)); norm2 = Math.PI ** 2 / 6; ok = true; }
          else { xs = []; for (let n = 1; n <= NB; n++) xs.push(yv(n + 1)); ok = false; why = 'y₁ = 1 is never reached: ⟨y, e₁⟩ ≠ 0 but e₁ ∈ 𝓝(T*)'; }
          P.setView(null, [-0.15, Math.max(1.25, ...xs) * 1.08]);
          xs.forEach((a, i) => P.rect(i + 1 - 0.32, 0, i + 1 + 0.32, a, { fill: ok ? 'green' : 'red', fillAlpha: 0.55, stroke: false }));
          for (let n = 1; n <= NB; n++) P.dot(n, yv(n), { color: 'ink', r: 2.2 });
          if (k === 'fwd') P.rect(1 - 0.32, 0, 1 + 0.32, 1, { color: 'red', width: 2, dash: [4, 3] });
          const cor = k === 'diag' ? (ok ? `‖x‖₂ = ${v.fmt(Math.sqrt(norm2), 4)} < ∞ — solvable` : `x = (1, 1, 1, …) ∉ ℓ² — not solvable`) : k === 'bwd' ? `x = (0, y₁, y₂, …), ‖x‖₂ = ${v.fmt(Math.sqrt(norm2), 4)}` : why;
          P.corner(cor, 'tr', { color: ok ? 'green' : 'red', weight: 600 });
          // properties
          const P_ = {
            diag: { Tonto: e > 0, T1: true, RTc: e > 0, Ts1: true, RTsc: e > 0, Tsonto: e > 0 },
            bwd: { Tonto: true, T1: false, RTc: true, Ts1: true, RTsc: true, Tsonto: false },
            fwd: { Tonto: false, T1: true, RTc: true, Ts1: false, RTsc: true, Tsonto: true },
          }[k];
          st = P_;
        });
        v.legend([['ink', '$y_n=1/n$', { dot: true }], ['green', 'solution coordinates $x_n$', { area: true }], ['red', 'no solution in $\\ell^2$', { area: true }]]);
        v.readout(() => {
          const s = st, m = (b) => (b ? '✓' : '✗');
          return `(a) $\\mathscr R(T)=Y$: ${m(s.Tonto)} $\\iff$ $T^*$ one-to-one: ${m(s.Ts1)} and $\\mathscr R(T^*)$ closed: ${m(s.RTsc)}. $\\qquad$ (b) $\\mathscr R(T^*)=X^*$: ${m(s.Tsonto)} $\\iff$ $T$ one-to-one: ${m(s.T1)} and $\\mathscr R(T)$ closed: ${m(s.RTc)}.`;
        });
      },
    },
  ],
};
