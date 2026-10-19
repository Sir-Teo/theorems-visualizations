// Rudin, Functional Analysis — Chapter 11 (part 3): automatic continuity, closed Gelfand images,
// involutions on Δ, maximal commutative subalgebras, commuting elements
//
// Source: full Rudin second-edition sections and proofs reviewed; see verification ledger.

const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cconj = (a) => [a[0], -a[1]];
const cabs = (a) => Math.hypot(a[0], a[1]);
const cexpi = (t) => [Math.cos(t), Math.sin(t)];
const mmul = (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => cadd(s, cmul(a, B[k][j])), [0, 0])));
const madd = (A, B) => A.map((row, i) => row.map((a, j) => cadd(a, B[i][j])));
const msub = (A, B) => A.map((row, i) => row.map((a, j) => csub(a, B[i][j])));
const fro = (A) => Math.sqrt(A.flat().reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
const diagC = (d) => d.map((z, i) => d.map((_, j) => (i === j ? z : [0, 0])));
const realM = (A) => A.map((r) => r.map((x) => [x, 0]));
/** Eigenvalues of a small complex matrix: characteristic polynomial (Faddeev–LeVerrier), then Durand–Kerner. */
function eigC(A) {
  const n = A.length, c = new Array(n + 1).fill(null); c[n] = [1, 0];
  let Mk = A.map((r) => r.map(() => [0, 0]));
  for (let k = 1; k <= n; k++) {
    const AM = mmul(A, Mk);
    Mk = AM.map((r, i) => r.map((z, j) => (i === j ? cadd(z, c[n - k + 1]) : z)));
    const T = mmul(A, Mk); let tr = [0, 0]; for (let i = 0; i < n; i++) tr = cadd(tr, T[i][i]);
    c[n - k] = [-tr[0] / k, -tr[1] / k];
  }
  const p = (z) => { let s = [0, 0]; for (let k = n; k >= 0; k--) s = cadd(cmul(s, z), c[k]); return s; };
  let R = Array.from({ length: n }, (_, k) => cmul([0.4, 0.9], cexpi(2 * Math.PI * k / n + 0.3)));
  const sc = 1 + Math.max(...c.slice(0, n).map(cabs)); R = R.map((z) => [z[0] * sc, z[1] * sc]);
  for (let it = 0; it < 300; it++) {
    let moved = 0;
    R = R.map((z, i) => { let d = [1, 0]; R.forEach((w, j) => { if (j !== i) d = cmul(d, csub(z, w)); }); const step = cdiv(p(z), d); moved = Math.max(moved, cabs(step)); return csub(z, step); });
    if (moved < 1e-13) break;
  }
  return R;
}
/** Operator 2-norm of a complex matrix (power iteration on A*A). */
function opnorm(A, it = 80) {
  const n = A[0].length; let v = Array.from({ length: n }, (_, i) => [1 / Math.sqrt(n), (i % 2 ? 0.37 : -0.21) / Math.sqrt(n)]), s = 0;
  for (let k = 0; k < it; k++) {
    const w = A.map((row) => row.reduce((acc, a, j) => cadd(acc, cmul(a, v[j])), [0, 0]));
    const u = A[0].map((_, j) => A.reduce((acc, row, i) => cadd(acc, cmul(cconj(row[j]), w[i])), [0, 0]));
    const nu = Math.sqrt(u.reduce((acc, z) => acc + z[0] * z[0] + z[1] * z[1], 0)); if (nu < 1e-300) return 0;
    s = Math.sqrt(nu); v = u.map((z) => [z[0] / nu, z[1] / nu]);
  }
  return s;
}
const fmtC = (v, z, d = 3) => `${v.fix(z[0], d)}${z[1] < 0 ? '-' : '+'}${v.fix(Math.abs(z[1]), d)}i`;
/** Polynomial (complex coefficient list) helpers. */
const pmul = (a, b) => { const r = Array.from({ length: a.length + b.length - 1 }, () => [0, 0]); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] = cadd(r[i + j], cmul(x, y)); })); return r; };
const peval = (a, z) => { let s = [0, 0]; for (let k = a.length - 1; k >= 0; k--) s = cadd(cmul(s, z), a[k]); return s; };

export default {
  collection: 'fa',
  chapter: 11,
  items: [
    // ------------------------------------------------------------------ 11.10
    {
      num: '11.10',
      kind: 'Theorem',
      name: 'Homomorphisms into semisimple algebras are continuous',
      statement: String.raw`Let $A$ be a Banach algebra and $B$ a commutative Banach algebra with unit that is semisimple. Then every homomorphism $\psi:A\to B$ is continuous.`,
      idea: String.raw`Use the closed graph theorem (2.15). Suppose $x_n\to x$ in $A$ and $\psi(x_n)\to y$ in $B$. For each $h\in\Delta_B$, $h\circ\psi$ is either $0$ or a complex homomorphism of $A$, and either way it is continuous (10.7). Hence $h(y)=\lim h(\psi(x_n))=h(\psi(x))$ for every $h\in\Delta_B$. So $y-\psi(x)$ lies in the radical of $B$ (11.9), which is $\{0\}$, and the graph of $\psi$ is closed. In particular a commutative semisimple Banach algebra carries only one Banach-algebra topology: apply the theorem to the identity map between two such norms.`,
      caption: String.raw`A homomorphism $\psi:\ell^1(\Z_+)\to C[0,1]$ is fixed by the function $g=\psi(z)$, through $\psi(x)(t)=\sum x_ng(t)^n$. Drag the three points the curve $g$ passes through ($t=0,\frac12,1$). Evaluation at $t$ composed with $\psi$ is a complex homomorphism of $\ell^1(\Z_+)$, so $g(t)$ must lie in its maximal ideal space, the closed disc (green). Then $|\psi(x)(t)|\le\norm x_1$: $\psi$ is continuous, with norm $\le1$. Right: a400-term approximation of $|\psi(x)(t)|$ for $x_n=(n+1)^{-2}$, against $\norm x_1$ (orange). Push the curve out of the disc: there the series diverges (red), and no such homomorphism exists.`,
      deps: ['fa-11.9', 'fa-11.8', 'fa-10.7', 'fa-2.15'],
      tags: ['commutative Banach algebras', 'automatic continuity'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, height: 340, axes: true, ticks: false, title: 'the curve $g([0,1])$ in $\\Delta_{\\ell^1(\\Z_+)}=\\overline U$' });
        const R = v.stage({ x: [0, 1], y: [0, 2.2], height: 340, axes: 'box', xlabel: 't', title: '$|\\psi(x)(t)|=|\\hat x(g(t))|$ and $\\|x\\|_1$' });
        const H = [[-0.75, -0.25], [0.05, 0.85], [0.8, -0.35]].map(([a, b], k) => L.handle(a, b, { color: 'blue', r: 6, label: ['g(0)', 'g(½)', 'g(1)'][k] }));
        const NX = 400, nx = Math.PI ** 2 / 6;
        let st = {};
        v.legend([['green', 'inside $\\Delta$: $\\psi(x)(t)$ is defined'], ['red', 'outside: the series diverges'], ['orange', '$\\|x\\|_1$', { dash: true }]]);
        v.render(() => {
          const P = H.map((h) => [h.x, h.y]);
          const g = (t) => { const l0 = (t - 0.5) * (t - 1) / 0.5, l1 = -t * (t - 1) / 0.25, l2 = t * (t - 0.5) / 0.5; return [l0 * P[0][0] + l1 * P[1][0] + l2 * P[2][0], l0 * P[0][1] + l1 * P[1][1] + l2 * P[2][1]]; };
          L.circle(0, 0, 1, { color: 'green', width: 2, fill: 'green', fillAlpha: 0.1 });
          const ts = M.linspace(0, 1, 301), G = ts.map(g);
          for (let i = 0; i < ts.length - 1; i++) { const out = cabs(G[i]) > 1 || cabs(G[i + 1]) > 1; L.line(G[i][0], G[i][1], G[i + 1][0], G[i + 1][1], { color: out ? 'red' : 'green', width: 3 }); }
          const val = (w) => { let s = [0, 0], p = [1, 0]; for (let n = 0; n < NX; n++) { s = cadd(s, [p[0] / (n + 1) ** 2, p[1] / (n + 1) ** 2]); p = cmul(p, w); } return cabs(s); };
          const inside = G.map((w) => cabs(w) <= 1), vals = G.map((w, i) => (inside[i] ? val(w) : NaN));
          let i0 = -1;
          for (let i = 0; i <= ts.length; i++) { const outHere = i < ts.length && !inside[i]; if (outHere && i0 < 0) i0 = i; if (!outHere && i0 >= 0) { R.vband(ts[i0], ts[Math.min(i, ts.length - 1)], { color: 'red', alpha: 0.12 }); i0 = -1; } }
          R.hline(nx, { color: 'orange', width: 1.8, dash: [6, 4] });
          R.path(ts.map((t, i) => (inside[i] ? [t, vals[i]] : null)), { color: 'green', width: 2.6 });
          const fin = vals.filter(isFinite), mx = fin.length ? Math.max(...fin) : 0;
          st = { mx, nx, outside: inside.some((b) => !b), gmax: Math.max(...G.map(cabs)) };
        });
        v.readout(() => {
          const s = st;
          return s.outside ? `$\\max_t|g(t)|=${v.fix(s.gmax, 3)}>1$: at those $t$, $x\\mapsto\\psi(x)(t)$ would be a complex homomorphism of $\\ell^1(\\Z_+)$ outside $\\Delta$, which is impossible, and indeed $\\sum x_ng(t)^n$ diverges there.` : `$\\max_t|\\psi(x)(t)|=${v.fix(s.mx, 4)}\\le\\|x\\|_1=${v.fix(s.nx, 4)}$. Every such $\\psi$ satisfies $\\|\\psi(x)\\|_\\infty\\le\\|\\hat x\\|_\\infty\\le\\|x\\|_1$, so it is continuous.`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.11
    {
      num: '11.11',
      kind: 'Lemma',
      name: 'Comparing ‖x²‖/‖x‖² with ‖x̂‖∞/‖x‖',
      statement: String.raw`Let $A$ be a commutative Banach algebra and put
$$r=\inf_{x\ne0}\frac{\norm{x^2}}{\norm x^2},\qquad s=\inf_{x\ne0}\frac{\norm{\hat x}_\infty}{\norm x}.$$
Then $s^2\le r\le s$.`,
      idea: String.raw`For every $x$, $\norm{x^2}\ge\norm{\widehat{x^2}}_\infty=\norm{\hat x}_\infty^2\ge s^2\norm x^2$, so $r\ge s^2$. Conversely $\norm{x^{2^k}}\ge r^{2^k-1}\norm x^{2^k}$ by induction, so the spectral radius formula (10.13) and 11.9 give $\norm{\hat x}_\infty=\lim\norm{x^{2^k}}^{2^{-k}}\ge r\norm x$, hence $s\ge r$. In the plane of the two ratios $u=\norm{\hat x}_\infty/\norm x$ and $w=\norm{x^2}/\norm x^2$, every element lies on or above the parabola $w=u^2$, and to the right of the line $u=r$.`,
      caption: String.raw`Each dot is a polynomial $x$, plotted at $u=\norm{\hat x}_\infty/\norm x$, $w=\norm{x^2}/\norm x^2$. Grey: random polynomials of degree $\le6$. Purple: the Rudin–Shapiro polynomials of length $2^k$, whose coefficients are all $\pm1$. In $\ell^1(\Z_+)$ every dot stays above the parabola $w=u^2$ (the pointwise form of $s^2\le r$), and the Rudin–Shapiro dots march toward $(0,0)$, so $r=s=0$ there. With the sup norm of the disc algebra every dot sits at $(1,1)$: $r=s=1$.`,
      deps: ['fa-11.9', 'fa-10.13'],
      tags: ['Gelfand transform', 'commutative Banach algebras'],
      viz(v) {
        const M = v.M;
        const alg = v.select('norm', [{ value: 'l1', label: '$\\ell^1(\\Z_+)$' }, { value: 'sup', label: 'disc algebra (sup norm)' }], 'l1');
        const kS = v.slider('Rudin–Shapiro polynomials up to length $2^k$, $k=$', 1, 8, 7, { int: true });
        let seed = 3, cache = { key: '' }, st = {};
        v.button('Resample', () => { seed = Math.floor(Math.random() * 1e9); cache.key = ''; });
        const S = v.stage({ x: [0, 1.2], y: [0, 1.08], height: 380, axes: 'box', xlabel: 'u = ‖x̂‖∞ / ‖x‖', ylabel: 'w = ‖x²‖ / ‖x‖²', title: 'one dot per element $x$' });
        const supOn = (c, m) => { let mx = 0; for (let i = 0; i < m; i++) mx = Math.max(mx, cabs(peval(c, [Math.cos(2 * Math.PI * i / m), Math.sin(2 * Math.PI * i / m)]))); return mx; };
        const l1 = (c) => c.reduce((s, z) => s + cabs(z), 0);
        v.legend([['muted', 'random polynomials', { dot: true }], ['purple', 'Rudin–Shapiro', { dot: true }], ['orange', '$w=u^2$', { dash: true }], ['red', 'forbidden: $w<u^2$', { area: true }]]);
        v.render(() => {
          const sup = alg.value === 'sup', K = kS.value, key = `${seed}|${K}`;
          if (cache.key !== key) {
            const rng = v.rng(seed), pts = [];
            for (let i = 0; i < 220; i++) { const d = 1 + Math.floor(rng() * 6), c = Array.from({ length: d + 1 }, () => [rng.normal(), rng.normal()]); const n = l1(c); pts.push([supOn(c, 256) / n, l1(pmul(c, c)) / (n * n)]); }
            let P = [[1, 0]], Q = [[1, 0]]; const rs = [];
            for (let k = 1; k <= K; k++) {
              const sh = P.length, zQ = Array.from({ length: sh }, () => [0, 0]).concat(Q);
              const P2 = zQ.map((z, j) => cadd(j < sh ? P[j] : [0, 0], z)), Q2 = zQ.map((z, j) => csub(j < sh ? P[j] : [0, 0], z));
              P = P2; Q = Q2; const n = l1(P); rs.push([supOn(P, 8 * P.length) / n, l1(pmul(P, P)) / (n * n), k]);
            }
            cache = { key, pts, rs };
          }
          S.between((u) => u * u, () => 0, 0, 1.08, { fill: 'red', fillAlpha: 0.07 });
          S.fn((u) => u * u, { color: 'orange', width: 1.8, dash: [6, 4], domain: [0, 1.04] });
          const pts = sup ? cache.pts.map(() => [1, 1]) : cache.pts, rs = sup ? cache.rs.map((p) => [1, 1, p[2]]) : cache.rs;
          S.dots(pts, { color: 'muted', r: 2.6 });
          rs.forEach(([u, w, k], i) => S.dot(u, w, { color: 'purple', r: 4.5, label: i === rs.length - 1 && !sup ? `length ${2 ** k}` : '', labelPos: 'ne' }));
          const all = [...pts, ...rs];
          st = { sEst: Math.min(...all.map((p) => p[0])), rEst: Math.min(...all.map((p) => p[1])), below: all.filter(([u, w]) => w < u * u - 1e-12).length, sup, last: rs[rs.length - 1] };
        });
        v.readout(() => {
          const s = st;
          if (s.sup) return 'Sup norm: $\\|x^2\\|=\\|x\\|^2$ and $\\|\\hat x\\|_\\infty=\\|x\\|$ for every $x$, so $r=s=1$.';
          return `Smallest ratios in this sample: $u_{\\min}=${v.fix(s.sEst, 4)}$, $w_{\\min}=${v.fix(s.rEst, 4)}$; dots below the parabola: ${s.below}. The longest Rudin–Shapiro polynomial has $u=${v.fix(s.last[0], 4)}$ and $w=${v.fix(s.last[1], 4)}$. In $\\ell^1(\\Z_+)$ both infima are $0$, consistent with $s^2\\le r\\le s$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.12
    {
      num: '11.12',
      kind: 'Theorem',
      name: 'Semisimple with closed range iff ‖x‖² ≤ K‖x²‖',
      statement: String.raw`Let $A$ be a commutative Banach algebra. Then $A$ is semisimple and $\hat A$ is a closed subalgebra of $C(\Delta)$ if and only if there is a constant $K<\infty$ with
$$\norm x^2\le K\norm{x^2}\qquad(x\in A).$$
In particular $\norm{\hat x}_\infty=\norm x$ for every $x$ if and only if $\norm{x^2}=\norm x^2$ for every $x$.`,
      idea: String.raw`With $r$ and $s$ as in Lemma 11.11, $s^2\le r\le s$, so $r>0$ exactly when $s>0$, and $r>0$ is the stated inequality with $K=1/r$. Now $s>0$ says $\norm{\hat x}_\infty\ge s\norm x$: then the Gelfand transform is one-to-one, so the radical is $\{0\}$, and $\hat A$ is complete, hence closed. Conversely, if $A$ is semisimple and $\hat A$ is closed, $x\mapsto\hat x$ is a continuous bijection of $A$ onto the Banach space $\hat A$, so its inverse is bounded (2.12) and $s>0$. When $K=1$, $s\ge r=1$ gives $\norm{\hat x}_\infty=\norm x$.`,
      caption: String.raw`$x=1+az+bz^2$ (drag $a,b$) in two Banach algebras with the same $\Delta=\overline U$: $\ell^1(\Z_+)$ (norm $\sum|c_n|$) and the disc algebra (sup norm). Left: $|\hat x|$ on $\Delta$; the dot marks its maximum $\norm{\hat x}_\infty=\rho(x)$. Right: $\norm{x^n}^{1/n}$ for $n=1,\dots,64$ (dots at $n=2^k$, the subsequence used in the proof). With the sup norm it is constant, because $\norm{x^2}=\norm x^2$. In $\ell^1$ it starts at $\norm x$ and converges to $\rho(x)$; monotonicity is not required. No constant $K$ works for $\ell^1(\Z_+)$ (see 11.11), so its Gelfand image is not closed in $C(\overline U)$.`,
      deps: ['fa-11.11', 'fa-11.9', 'fa-2.12'],
      tags: ['Gelfand transform', 'commutative Banach algebras'],
      viz(v) {
        const M = v.M;
        const nrm = v.select('norm', [{ value: 'l1', label: '$\\ell^1(\\Z_+)$: $\\sum|c_n|$' }, { value: 'sup', label: 'disc algebra: $\\max_{\\overline U}|x|$' }], 'l1');
        const L = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 340, axes: false, ticks: false, title: '$|\\hat x|$ on $\\Delta=\\overline U$; handles $a$, $b$' });
        const R = v.stage({ x: [-0.2, 6.5], y: [0, 3], height: 340, axes: 'box', xlabel: 'n', xticks: [0, 1, 2, 3, 4, 5, 6].map((k) => [k, String(2 ** k)]), title: '$\\|x^n\\|^{1/n}$ ($n$ on a log scale)' });
        const ha = L.handle(0, 0.8, { color: 'orange', label: 'a' });
        const hb = L.handle(0.7, 0, { color: 'purple', label: 'b' });
        let st = {}, cache = { key: '' };
        v.legend([['ink', '$\\|x^n\\|^{1/n}$'], ['orange', '$\\|x\\|$', { dash: true }], ['green', '$\\rho(x)=\\|\\hat x\\|_\\infty$', { dash: true }]]);
        v.render(() => {
          const a = [ha.x, ha.y], b = [hb.x, hb.y], x = [[1, 0], a, b];
          L.raster((p, q) => { if (p * p + q * q > 1) return null; const m = cabs(peval(x, [p, q])), t = Math.min(1, m / 3); return M.cmap(t, 'viridis'); }, { key: `${a}|${b}`, res: 3 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.5 });
          let rho = 0, arg = [1, 0];
          for (let i = 0; i < 1440; i++) { const z = cexpi(2 * Math.PI * i / 1440), m = cabs(peval(x, z)); if (m > rho) { rho = m; arg = z; } }
          L.dot(arg[0], arg[1], { color: 'green', r: 5, label: 'max', labelPos: arg[0] > 0 ? 'e' : 'w' });
          const key = `${a}|${b}`;
          if (cache.key !== key) {
            const l1 = []; let p = [[1, 0]];
            for (let n = 1; n <= 64; n++) { p = pmul(p, x); let s = 0; for (const c of p) s += cabs(c); l1.push(Math.pow(s, 1 / n)); }
            cache = { key, l1 };
          }
          const sup = nrm.value === 'sup', seq = sup ? cache.l1.map(() => rho) : cache.l1, nx = seq[0];
          R.setView(null, [Math.min(rho, nx) - 0.25 * Math.max(0.4, nx - rho), Math.max(rho, nx) + 0.25 * Math.max(0.4, nx - rho)]);
          R.hline(nx, { color: 'orange', width: 1.6, dash: [6, 4] });
          R.hline(rho, { color: 'green', width: 1.8, dash: [6, 4] });
          R.path(seq.map((y, i) => [Math.log2(i + 1), y]), { color: 'ink', width: 2.2 });
          [1, 2, 4, 8, 16, 32, 64].forEach((n) => R.dot(Math.log2(n), seq[n - 1], { color: 'ink', r: 3.5 }));
          st = { sup, nx, n2: sup ? rho * rho : cache.l1[1] ** 2, rho, last: seq[63] };
          st.q2 = st.n2 / (nx * nx); st.q1 = rho / nx;
        });
        v.readout(() => {
          const s = st;
          return `$\\|x^2\\|/\\|x\\|^2=${v.fix(s.q2, 4)}$ and $\\|\\hat x\\|_\\infty/\\|x\\|=${v.fix(s.q1, 4)}$ for this $x$; $\\|x^{64}\\|^{1/64}=${v.fix(s.last, 4)}\\to\\rho(x)=${v.fix(s.rho, 4)}$. ` + (s.sup ? 'Sup norm: $\\|x^2\\|=\\|x\\|^2$ and the Gelfand transform is an isometry.' : (s.nx - s.rho > 1e-6 ? 'In $\\ell^1(\\Z_+)$ the transform shrinks this $x$: $\\|\\hat x\\|_\\infty<\\|x\\|$.' : 'For this $x$ the two happen to agree.'));
        });
      },
    },
    // ------------------------------------------------------------------ 11.16
    {
      num: '11.16',
      kind: 'Theorem',
      name: 'Semisimple commutative involutions are continuous',
      statement: String.raw`Every involution on a semisimple commutative Banach algebra is continuous. More generally, any involution on a commutative Banach algebra induces $\tau(h)(x)=\overline{h(x^*)}$ on $\Delta$, with $\tau^2=\mathrm{id}$ and $\widehat{x^*}=\overline{\hat x\circ\tau}$; this induced map is a homeomorphism.`,
      idea: String.raw`(a) $\tilde h$ is linear and multiplicative because the involution reverses products and conjugates scalars, and $\tilde h(e)=1$ (11.15). $\tilde h_\alpha\to\tilde h$ whenever $h_\alpha\to h$ pointwise, so $\tau$ is continuous; it is its own inverse. (b) Closed graph theorem (2.15). If $x_n\to x$ and $x_n^*\to y$, then for every $h$, $h(y)=\lim h(x_n^*)=\lim\overline{\tilde h(x_n)}=\overline{\tilde h(x)}=h(x^*)$, since $\tilde h$ is continuous. So $y-x^*$ lies in the radical, which is $\{0\}$.`,
      caption: String.raw`Two involutions on algebras whose $\Delta$ you can see. **Disc algebra**, $f^*(z)=\overline{f(\bar z)}$: here $\tau(w)=\bar w$, a reflection of the disc. **$\ell^1(\Z)$**, $x^*_n=\overline{x_{-n}}$: here $\Delta=\T$ and $\tau=\mathrm{id}$. Drag the point $w$ and the coefficients of $f=c_0+c_1z+c_2z^2$ (right). The readout checks $\widehat{f^*}(w)=\overline{\hat f(\tau w)}$. The colour shows $|\operatorname{Im}\widehat{(f+f^*)}|$ for the hermitian element $f+f^*$: symmetry forces it to vanish on the fixed points of $\tau$ (the real diameter, or the whole circle).`,
      deps: ['fa-11.15', 'fa-11.9', 'fa-11.8', 'fa-2.15'],
      tags: ['involutions', 'commutative Banach algebras', 'automatic continuity'],
      viz(v) {
        const M = v.M;
        const alg = v.select('algebra', [{ value: 'disc', label: "disc algebra, $f^*(z)=\\overline{f(\\bar z)}$" }, { value: 'l1', label: "$\\ell^1(\\Z)$, $x^*_n=\\overline{x_{-n}}$" }], 'disc');
        const L = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 340, axes: true, ticks: false, title: '$\\Delta$, the point $w$ and $\\tau(w)$' });
        const R = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, height: 340, weight: 0.6, minWidth: 220, axes: true, ticks: false, title: 'coefficients $c_0,c_1,c_2$' });
        const hw = L.handle(0.45, 0.55, { color: 'blue', label: 'w', constrain: (x, y) => { const r = Math.hypot(x, y); if (alg.value === 'l1') return [x / (r || 1), y / (r || 1)]; return r > 1 ? [x / r, y / r] : [x, y]; } });
        const hc = [[0.2, 0.3], [0.6, -0.4], [-0.3, 0.5]].map(([x, y], k) => R.handle(x, y, { color: ['orange', 'purple', 'teal'][k], label: `c${'₀₁₂'[k]}` }));
        let st = {};
        v.legend([['blue', '$w$'], ['red', '$\\tau(w)$'], ['muted', '$|\\operatorname{Im}(f+f^*)^\\wedge|$ (bright = large)', { area: true }]]);
        v.render(() => {
          const disc = alg.value === 'disc', c = hc.map((h) => [h.x, h.y]);
          if (!disc) { const r = Math.hypot(hw.x, hw.y); if (Math.abs(r - 1) > 1e-9) hw.set(hw.x / (r || 1), hw.y / (r || 1)); }
          // f̂(w) = Σ c_n w^n; disc: (f*)^(w) = conj f̂(w̄); ℓ¹(Z): x* has coefficients conj c_{−n}, so (x*)^(w) = Σ conj(c_n) w^{−n} = conj f̂(w) on |w| = 1
          const fh = (z) => peval(c, z);
          const fsh = (z) => (disc ? cconj(fh(cconj(z))) : cconj(fh(z)));
          if (disc) L.raster((x, y) => { if (x * x + y * y > 1) return null; const z = [x, y], im = Math.abs(fh(z)[1] + fsh(z)[1]), t = Math.min(1, im / 1.5); return M.cmap(0.15 + 0.8 * t, 'magma'); }, { key: `d${c}`, res: 3 });
          else for (let i = 0; i < 360; i++) { const t0 = 2 * Math.PI * i / 360; L.line(Math.cos(t0), Math.sin(t0), Math.cos(t0 + 0.018), Math.sin(t0 + 0.018), { color: 'green', width: 6, alpha: 0.4 }); }
          L.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          if (disc) L.line(-1, 0, 1, 0, { color: 'green', width: 2.6 });
          const w = [hw.x, hw.y], tw = disc ? cconj(w) : w;
          L.dot(tw[0], tw[1], { color: 'red', r: 6, hollow: true, label: 'τ(w)', labelPos: 'se' });
          if (disc) L.line(w[0], w[1], tw[0], tw[1], { color: 'red', width: 1, dash: [3, 3] });
          R.circle(0, 0, 1, { color: 'muted', width: 1, dash: [3, 3] });
          const lhs = fsh(w), rhs = cconj(fh(tw)), herm = cadd(fh(w), fsh(w));
          st = { disc, lhs, rhs, herm, err: cabs(csub(lhs, rhs)) };
        });
        v.readout(() => {
          const s = st;
          return `$\\widehat{f^*}(w)=${fmtC(v, s.lhs)}$, $\\overline{\\hat f(\\tau w)}=${fmtC(v, s.rhs)}$ (difference $${s.err < 1e-14 ? '0' : v.sci(s.err, 1)}$ up to rounding). Hermitian element: $\\widehat{(f+f^*)}(w)=${fmtC(v, s.herm)}$` + (s.disc ? ' — guaranteed real on the real diameter, the fixed set of $\\tau$.' : ' — real everywhere on $\\Delta$: this involution is **symmetric** ($\\tau=\\mathrm{id}$).');
        });
      },
    },
    // ------------------------------------------------------------------ 11.22
    {
      num: '11.22',
      kind: 'Theorem',
      name: 'Commuting sets lie in inverse-closed commutative algebras',
      statement: String.raw`If $S$ is a pairwise commuting subset of a Banach algebra $A$, its double centralizer $B=\Gamma(\Gamma(S))$ is a commutative Banach algebra containing $S$ and the unit, and $\sigma_B(x)=\sigma_A(x)$ for all $x\in B$.`,
      idea: String.raw`Centralizers are closed unital subalgebras, and $S\subset\Gamma(\Gamma(S))$. Since $S$ commutes, its double centralizer commutes. If $x\in B$ is invertible in $A$, its inverse commutes with every element commuting with $x$, hence with every element of $\Gamma(S)$. Thus $x^{-1}\in B$, proving equality of spectra.`,
      caption: String.raw`$A=M_3(\C)$ and $x$ with eigenvalues $\lambda_1,\lambda_2,\lambda_3$ (drag them). When they are distinct, the commutant of $x$ is the algebra of polynomials in $x$, the double centralizer $B$ of dimension $3$. Drag $\lambda$: $(x-\lambda)^{-1}$ equals $p(x)$, where $p$ is the quadratic that interpolates $1/(t-\lambda)$ at the eigenvalues. So the inverse never leaves $B$, which is why $\sigma_B(x)=\sigma_A(x)$. The colour shows $\log_{10}\norm{(x-\lambda)^{-1}}_F$, singular only at the eigenvalues. At an exactly repeated eigenvalue the single centralizer grows and may be noncommutative; the double centralizer remains commutative.`,
      deps: ['fa-11.21','fa-10.10'],
      tags: ['Banach algebras', 'spectrum', 'commutants'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.6, 2.6], y: [-1.8, 1.8], equal: true, height: 360, axes: true, title: '$\\log_{10}\\|(x-\\lambda)^{-1}\\|_F$ over the $\\lambda$-plane' });
        const HL = [[1.1, 0.5], [-0.9, 0.8], [0.2, -1.0]].map(([a, b], k) => S.handle(a, b, { color: 'red', r: 6, label: `λ${'₁₂₃'[k]}` }));
        const hl = S.handle(0.4, 0.15, { color: 'teal', label: 'λ' });
        const Sm = [[1, 0.6, -0.4], [0, 1, 0.8], [0, 0, 1]], Si = [[1, -0.6, 0.88], [0, 1, -0.8], [0, 0, 1]];   // S and S⁻¹
        const resF = (L, z) => { const d = L.map((l) => cdiv([1, 0], csub(l, z))); let s2 = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let re = 0, im = 0; for (let k = 0; k < 3; k++) { const c = Sm[i][k] * Si[k][j]; re += c * d[k][0]; im += c * d[k][1]; } s2 += re * re + im * im; } return Math.sqrt(s2); };
        let st = {};
        v.legend([['red', 'eigenvalues of $x$'], ['teal', 'the point $\\lambda$']]);
        v.render(() => {
          const L = HL.map((h) => [h.x, h.y]), z = [hl.x, hl.y];
          S.heat((a, b) => Math.min(3, Math.log10(resF(L, [a, b]))), { range: [-0.3, 2.2], cmap: 'magma', res: 4, key: L.flat().map((t) => t.toFixed(3)).join(',') });
          const X = mmul(mmul(realM(Sm), diagC(L)), realM(Si)), X2 = mmul(X, X), I3 = diagC([[1, 0], [1, 0], [1, 0]]);
          let c0 = [0, 0], c1 = [0, 0], c2 = [0, 0], ok = true;
          for (let k = 0; k < 3; k++) {
            const [a, b] = [0, 1, 2].filter((j) => j !== k).map((j) => L[j]);
            const den = cmul(csub(L[k], a), csub(L[k], b)); if (cabs(den) < 1e-6) { ok = false; break; }
            const w = cdiv(cdiv([1, 0], csub(L[k], z)), den);   // Lagrange: w (t − a)(t − b)
            c2 = cadd(c2, w); c1 = csub(c1, cmul(w, cadd(a, b))); c0 = cadd(c0, cmul(w, cmul(a, b)));
          }
          const scl = (A, c) => A.map((r) => r.map((e) => cmul(e, c)));
          const Rz = mmul(mmul(realM(Sm), diagC(L.map((l) => cdiv([1, 0], csub(l, z))))), realM(Si));
          const res = ok ? fro(msub(madd(madd(scl(I3, c0), scl(X, c1)), scl(X2, c2)), Rz)) : NaN;
          const groups = []; L.forEach((l) => { const g = groups.find((q) => q[0][0] === l[0] && q[0][1] === l[1]); if (g) g[1]++; else groups.push([l, 1]); });
          st = { ok, res, c: [c0, c1, c2], dimC: groups.reduce((s, q) => s + q[1] * q[1], 0) };
        });
        v.readout(() => {
          const s = st;
          const dimTxt = `Commutant of $x$: dimension $${s.dimC}$` + (s.dimC === 3 ? ', the polynomials in $x$ (maximal commutative).' : ', not commutative (two eigenvalues coincide).');
          if (!s.ok) return dimTxt + ' The quadratic interpolation is ill-conditioned or repeated eigenvalues are present; move them apart.';
          return `$(x-\\lambda)^{-1}=c_0+c_1x+c_2x^2$ with $c_0=${fmtC(v, s.c[0], 2)}$, $c_1=${fmtC(v, s.c[1], 2)}$, $c_2=${fmtC(v, s.c[2], 2)}$; $\\|p(x)-(x-\\lambda)^{-1}\\|_F=${v.sci(s.res + 1e-17, 1)}$. ` + dimTxt;
        });
      },
    },
    // ------------------------------------------------------------------ 11.23
    {
      num: '11.23',
      kind: 'Theorem',
      name: 'Spectra of commuting elements: σ(x+y), σ(xy)',
      statement: String.raw`Let $A$ be a Banach algebra with unit, and let $x,y\in A$ commute. Then
$$\sigma(x+y)\subset\sigma(x)+\sigma(y),\qquad\sigma(xy)\subset\sigma(x)\,\sigma(y),$$
so $\rho(x+y)\le\rho(x)+\rho(y)$ and $\rho(xy)\le\rho(x)\rho(y)$. Without commutativity both inclusions can fail.`,
      idea: String.raw`By Zorn's lemma the commuting pair $x,y$ lies in a maximal commutative subalgebra $B$, and spectra relative to $B$ are the same as in $A$ (11.22). In the commutative algebra $B$, every $\lambda\in\sigma(x+y)$ is $h(x+y)=h(x)+h(y)$ for some $h\in\Delta_B$ (11.5), with $h(x)\in\sigma(x)$ and $h(y)\in\sigma(y)$; likewise $h(xy)=h(x)h(y)$. The **same** $h$ evaluates both elements, so only "paired" sums and products occur. The $2\times2$ matrices $\begin{pmatrix}0&1\\0&0\end{pmatrix}$ and $\begin{pmatrix}0&0\\1&0\end{pmatrix}$ have spectrum $\{0\}$, but their sum has spectrum $\{\pm1\}$.`,
      caption: String.raw`$A=M_3(\C)$, with $x$ diagonal in one basis (eigenvalues $\lambda_k$, red) and $y$ diagonal in a second basis that is rotated by the angle $\theta$ (eigenvalues $\mu_k$, blue). Grey dots: the nine sums $\lambda_j+\mu_k$ (or products). Green: the actual eigenvalues of $x+y$ (or $xy$), computed from the matrices. At $\theta=0$, $x$ and $y$ commute, and $\sigma(x+y)=\{\lambda_k+\mu_k\}$ sits on three of the nine dots. Turn $\theta$: the commutator grows and the eigenvalues leave the grid.`,
      deps: ['fa-11.22', 'fa-11.5', 'fa-10.13'],
      tags: ['Banach algebras', 'spectrum', 'commuting elements'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'sum', label: '$x+y$' }, { value: 'prod', label: '$xy$' }], 'sum');
        const thS = v.slider('angle $\\theta$ between the eigenbases', 0, 1.2, 0, { step: 0.005 });
        const S = v.stage({ x: [-3, 3], y: [-2.4, 2.4], equal: true, height: 380, axes: true, title: '$\\sigma(x)$, $\\sigma(y)$ and $\\sigma(x+y)$ in $\\C$' });
        const HL = [[1.1, 0.5], [-0.9, 0.8], [0.2, -1.0]].map(([a, b], k) => S.handle(a, b, { color: 'red', r: 6, label: `λ${'₁₂₃'[k]}` }));
        const HM = [[0.6, -0.3], [0.9, 0.9], [-1.2, -0.6]].map(([a, b], k) => S.handle(a, b, { color: 'blue', r: 6, label: `μ${'₁₂₃'[k]}` }));
        const Sm = [[1, 0.6, -0.4], [0, 1, 0.8], [0, 0, 1]], Si = [[1, -0.6, 0.4 + 0.48], [0, 1, -0.8], [0, 0, 1]];   // S and S⁻¹ (unipotent)
        let st = {};
        v.legend([['muted', 'all $\\lambda_j+\\mu_k$ (or $\\lambda_j\\mu_k$)'], ['green', 'eigenvalues of $x+y$ (or $xy$)'], ['green', 'paired values $\\lambda_k+\\mu_k$', { dot: true }]]);
        v.render(() => {
          const th = thS.value, prod = mode.value === 'prod', op = prod ? cmul : cadd;
          const L = HL.map((h) => [h.x, h.y]), Mu = HM.map((h) => [h.x, h.y]);
          const c1 = Math.cos(th), s1 = Math.sin(th), c2 = Math.cos(0.7 * th), s2 = Math.sin(0.7 * th);
          const Rot = [[c1, -s1, 0], [s1 * c2, c1 * c2, -s2], [s1 * s2, c1 * s2, c2]];        // orthogonal
          const RotT = Rot[0].map((_, j) => Rot.map((r) => r[j]));
          const X = mmul(mmul(realM(Sm), diagC(L)), realM(Si));
          const Y = mmul(mmul(mmul(mmul(realM(Sm), realM(Rot)), diagC(Mu)), realM(RotT)), realM(Si));
          const Z = prod ? mmul(X, Y) : madd(X, Y), ev = eigC(Z);
          const comm = fro(msub(mmul(X, Y), mmul(Y, X)));
          const grid = []; L.forEach((l) => Mu.forEach((m) => grid.push(op(l, m))));
          const paired = L.map((l, k) => op(l, Mu[k]));
          const ext = Math.max(2.4, 1.15 * Math.max(...[...grid, ...ev].map((z) => Math.max(Math.abs(z[0]) * 0.8, Math.abs(z[1])))));
          S.setView([-ext * 1.25, ext * 1.25], [-ext, ext]);
          grid.forEach((z) => S.dot(z[0], z[1], { color: 'muted', r: 4 }));
          paired.forEach((z) => S.dot(z[0], z[1], { color: 'green', r: 8, hollow: true }));
          ev.forEach((z) => S.dot(z[0], z[1], { color: 'green', r: 4.5 }));
          const off = Math.max(...ev.map((z) => Math.min(...grid.map((g) => cabs(csub(z, g))))));
          const rx = Math.max(...L.map(cabs)), ry = Math.max(...Mu.map(cabs)), rz = Math.max(...ev.map(cabs));
          st = { comm, off, rx, ry, rz, prod };
        });
        v.readout(() => {
          const s = st, bound = s.prod ? s.rx * s.ry : s.rx + s.ry;
          return `$\\|xy-yx\\|=${v.fix(s.comm, 3)}$. Largest distance from an eigenvalue of $x${s.prod ? '' : '+'}y$ to the grey grid: $${v.fix(s.off, 3)}$. $\\rho(x${s.prod ? '' : '+'}y)=${v.fix(s.rz, 3)}$ vs $\\rho(x)${s.prod ? '\\rho(y)' : '+\\rho(y)'}=${v.fix(bound, 3)}$` + (s.comm < 1e-9 ? ' — commuting: the inclusion holds.' : s.rz > bound + 1e-6 ? ' — the inequality **fails**: $x$ and $y$ do not commute.' : '.');
        });
      },
    },
  ],
};
