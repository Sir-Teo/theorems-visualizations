// Rudin, Functional Analysis — Chapter 4: Duality in Banach Spaces (part 1: the normed dual, annihilators, 4.1–4.9)

// ---------------------------------------------------------------- shared helpers (planar ℓ^p geometry)
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
/** Conjugate exponent q with 1/p + 1/q = 1. */
const conj = (p) => (p === 1 ? Infinity : p === Infinity ? 1 : p / (p - 1));
/** ℓ^p norm of a plane vector (p may be Infinity). */
const pn = (x, p) => (p === Infinity ? Math.max(Math.abs(x[0]), Math.abs(x[1])) : p === 1 ? Math.abs(x[0]) + Math.abs(x[1]) : Math.pow(Math.abs(x[0]) ** p + Math.abs(x[1]) ** p, 1 / p));
/** TeX for an exponent. */
const pTeX = (p) => (p === Infinity ? '\\infty' : p === 1.5 ? '\\tfrac32' : String(Math.round(p * 1000) / 1000));
/** Points of the ℓ^p unit sphere, counter-clockwise from angle 0 (n divisible by 8 hits the corners). */
function sphere(p, n = 720) {
  const out = [];
  for (let i = 0; i < n; i++) { const t = 2 * Math.PI * i / n, c = Math.cos(t), s = Math.sin(t), r = 1 / pn([c, s], p); out.push([r * c, r * s]); }
  return out;
}
/** Minimise a convex function of one real variable on [a, b] (ternary search) → [argmin, min]. */
function convexMin(F, a, b, it = 90) {
  for (let i = 0; i < it; i++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (F(m1) > F(m2)) a = m1; else b = m2; }
  const t = (a + b) / 2; return [t, F(t)];
}
/** Draw the whole line {x : a·x = c} across a 2D stage. */
function levelLine(S, a, c, st) {
  const n2 = dot2(a, a); if (n2 < 1e-14) return;
  const p = [a[0] * c / n2, a[1] * c / n2], t = [-a[1], a[0]], k = 60 / Math.sqrt(n2);
  S.line(p[0] - t[0] * k, p[1] - t[1] * k, p[0] + t[0] * k, p[1] + t[1] * k, st);
}
/** A translucent planar square {c + s a + t b : |s|,|t| ≤ h} in a 3D stage, tiled so depth sorting works. */
function plane3(S, c, a, b, h, st, n = 6) {
  const P = (s, t) => [0, 1, 2].map((i) => c[i] + s * a[i] + t * b[i]);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const s0 = -h + 2 * h * i / n, s1 = -h + 2 * h * (i + 1) / n, t0 = -h + 2 * h * j / n, t1 = -h + 2 * h * (j + 1) / n;
    S.poly([P(s0, t0), P(s1, t0), P(s1, t1), P(s0, t1)], { fill: st.color, fillAlpha: st.fillAlpha ?? 0.16, stroke: false });
  }
  const C = [P(-h, -h), P(h, -h), P(h, h), P(-h, h)];
  S.path(C, { close: true, color: st.color, width: st.width ?? 1.3, alpha: 0.8 });
  for (const s of [-h / 2, 0, h / 2]) { S.line(P(s, -h), P(s, h), { color: st.color, width: 0.7, alpha: 0.35 }); S.line(P(-h, s), P(h, s), { color: st.color, width: 0.7, alpha: 0.35 }); }
}
const unit3 = (a) => { const n = Math.hypot(...a); return a.map((x) => x / n); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const PSEL = [{ value: 1, label: '$1$' }, { value: 1.5, label: '$\\tfrac32$' }, { value: 2, label: '$2$' }, { value: 3, label: '$3$' }, { value: Infinity, label: '$\\infty$' }];

export default {
  collection: 'fa',
  chapter: 4,
  title: 'Duality in Banach Spaces',
  summary: String.raw`For a normed space the dual $X^*$ is always a Banach space; it norms $X$ and its closed unit ball is weak$^*$-compact. Annihilators $M^\perp$ and $\,{}^\perp\!N$ translate subspaces of $X$ into weak$^*$-closed subspaces of $X^*$ and back, and identify the duals of subspaces and quotients. Every bounded operator $T$ has an adjoint $T^*$ of the same norm, with $\mathscr N(T^*)=\mathscr R(T)^\perp$; this leads to the closed range theorem and to duality criteria for surjectivity. The last part studies compact operators: they form a closed ideal, $T$ is compact exactly when $T^*$ is, and away from $0$ their spectrum consists of isolated eigenvalues of finite multiplicity — the Riesz–Schauder theory behind the Fredholm alternative.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Theorem',
      name: 'Bounded operators and the normed dual',
      statement: String.raw`For normed spaces $X$ and $Y$, $\mathscr B(X,Y)$ is the vector space of all bounded linear maps $T:X\to Y$ (bounded = continuous for linear maps), normed by
$$\|T\|=\sup\{\|Tx\|:\ x\in X,\ \|x\|\le1\},$$
so that $\|Tx\|\le\|T\|\,\|x\|$ for every $x$. With this norm $\mathscr B(X,Y)$ is a normed space, and it is a Banach space whenever $Y$ is complete. Taking for $Y$ the scalar field gives the **normed dual** $X^*$; for $x\in X$ and $x^*\in X^*$ one writes $\langle x,x^*\rangle=x^*(x)$.`,
      idea: String.raw`$\|T\|$ is the smallest constant $c$ with $\|Tx\|\le c\|x\|$: geometrically, the radius of the smallest ball of $Y$ that contains the image $T(B_X)$ of the unit ball. Subadditivity of a supremum gives the triangle inequality. If $\{T_n\}$ is Cauchy in this norm, each $\{T_nx\}$ is Cauchy in $Y$; when $Y$ is complete the pointwise limit $T$ is linear, bounded, and the uniform estimate on $B_X$ gives $\|T_n-T\|\to0$. Since the scalars are complete, $X^*$ is a Banach space even when $X$ is not.`,
      caption: String.raw`$T$ is a $2\times2$ matrix from $X=(\R^2,\|\cdot\|_p)$ to $Y=(\R^2,\|\cdot\|_r)$; drag its columns $Te_1,Te_2$ and pick the two norms. The blue region on the right is $T(B_X)$; the green ball is $\|T\|\,B_Y$, the smallest $Y$-ball containing it, and it touches at $Tx_0$. Drag $x$ around the unit sphere of $X$: $\|Tx\|_r$ never exceeds $\|T\|$. The readout checks the numerical supremum against closed forms where they exist.`,
      deps: ['fa-1.2'],
      see: ['rca-5.2', 'fa-3.1'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §4.1, pp. 92–93'],
      tags: ['operator norm', 'Banach spaces', 'duality'],
      viz(v) {
        const M = v.M;
        const PS = [{ value: 1, label: '$1$' }, { value: 2, label: '$2$' }, { value: 4, label: '$4$' }, { value: Infinity, label: '$\\infty$' }];
        const pS = v.select('norm on $X$: $p=$', PS, 2);
        const rS = v.select('norm on $Y$: $r=$', PS, Infinity);
        const L = v.stage({ x: [-1.5, 1.5], y: [-1.35, 1.35], equal: true, height: 330, ticks: false, title: '$X=(\\R^2,\\|\\cdot\\|_p)$ and its unit ball $B_X$' });
        const R = v.stage({ x: [-2.6, 2.6], y: [-2.3, 2.3], equal: true, height: 330, ticks: false, title: '$Y=(\\R^2,\\|\\cdot\\|_r)$: $\\;T(B_X)\\subset\\|T\\|\\,B_Y$' });
        const c1 = R.handle(1.15, 0.3, { color: 'orange', label: 'Te₁', labelPos: 'se' });
        const c2 = R.handle(-0.35, 0.95, { color: 'orange', label: 'Te₂', labelPos: 'nw' });
        let th = 1.1;
        const onS = (t) => { const c = Math.cos(t), s = Math.sin(t), n = pn([c, s], pS.value); return [c / n, s / n]; };
        const xh = L.handle(...onS(th), { color: 'accent', label: 'x', constrain: (x, y) => { th = Math.atan2(y, x); return onS(th); } });
        let st = {};
        v.render(() => {
          const p = pS.value, r = rS.value;
          [xh.x, xh.y] = onS(th);
          const T = (x) => [c1.x * x[0] + c2.x * x[1], c1.y * x[0] + c2.y * x[1]];
          const ball = sphere(p, 1440), img = ball.map(T);
          let k = 0, nT = 0;
          img.forEach((y, i) => { const n = pn(y, r); if (n > nT + 1e-12) { nT = n; k = i; } });
          const big = sphere(r, 720).map(([a, b]) => [nT * a, nT * b]);
          let ext = 1.7;
          for (const q of big.concat([[c1.x, c1.y], [c2.x, c2.y]])) ext = Math.max(ext, Math.abs(q[0]) * 1.1, Math.abs(q[1]) * 1.1);
          R.setView([-ext, ext], [-ext, ext]);
          // ---- X
          const x0 = ball[k];
          L.poly(ball, { fill: 'blue', fillAlpha: 0.15, color: 'blue', width: 2 });
          L.line(0, 0, xh.x, xh.y, { color: 'accent', width: 1.6 });
          L.dot(x0[0], x0[1], { color: 'green', r: 5, label: 'x₀', labelPos: x0[0] > 0 ? 'w' : 'e' });
          L.dot(-x0[0], -x0[1], { color: 'green', r: 3.5, alpha: 0.7 });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          // ---- Y
          R.poly(sphere(r, 400), { color: 'muted', width: 1.1, dash: [4, 4] });
          R.poly(big, { color: 'green', width: 2.3, fill: 'green', fillAlpha: 0.06 });
          R.poly(img, { fill: 'blue', fillAlpha: 0.22, color: 'blue', width: 2 });
          R.arrow(0, 0, c1.x, c1.y, { color: 'orange', width: 1.6, head: 8 });
          R.arrow(0, 0, c2.x, c2.y, { color: 'orange', width: 1.6, head: 8 });
          const Tx = T([xh.x, xh.y]);
          R.arrow(0, 0, Tx[0], Tx[1], { color: 'accent', width: 2.2, head: 9 });
          R.dot(Tx[0], Tx[1], { color: 'accent', r: 4, label: 'Tx', labelPos: 'ne' });
          R.dot(img[k][0], img[k][1], { color: 'green', r: 5, label: 'Tx₀', labelPos: img[k][0] > 0 ? 'e' : 'w' });
          R.corner(`‖T‖ = ${v.fmt(nT, 4)}`, 'tl', { color: 'green', weight: 600 });
          // closed forms
          let exact = null, how = '';
          const col = (j) => (j === 0 ? [c1.x, c1.y] : [c2.x, c2.y]);
          if (p === 1) { exact = Math.max(pn(col(0), r), pn(col(1), r)); how = '\\max_j\\|Te_j\\|_r'; }
          else if (p === Infinity) { exact = Math.max(pn(T([1, 1]), r), pn(T([1, -1]), r)); how = '\\max_{\\pm}\\|T(1,\\pm1)\\|_r'; }
          else if (p === 2 && r === 2) { exact = M.svd2([[c1.x, c2.x], [c1.y, c2.y]])[0]; how = '\\sigma_1(T)'; }
          st = { nT, nTx: pn(Tx, r), exact, how, p, r };
        });
        v.legend([['blue', 'unit ball $B_X$ and its image $T(B_X)$', { area: true }], ['green', '$\\|T\\|\\,B_Y$ (smallest $Y$-ball containing $T(B_X)$)'], ['muted', 'unit ball $B_Y$', { dash: true }], ['orange', 'columns $Te_1,Te_2$']]);
        v.readout(() => {
          const s = st;
          const chk = s.exact == null ? '' : ` — closed form $${s.how} = ${v.fix(s.exact, 4)}$`;
          return `$\\|T\\| = \\sup_{\\|x\\|_{${pTeX(s.p)}}\\le1}\\|Tx\\|_{${pTeX(s.r)}} = ${v.fix(s.nT, 4)}$${chk}. Current $x$: $\\|Tx\\|_{${pTeX(s.r)}} = ${v.fix(s.nTx, 4)}\\le\\|T\\|\\,\\|x\\|_{${pTeX(s.p)}} = ${v.fix(s.nT, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'X* is a Banach space that norms X; B* is weak*-compact',
      statement: String.raw`Let $X$ be a normed space with closed unit ball $B$, and norm $X^*$ by $\|x^*\|=\sup\{|\langle x,x^*\rangle|:x\in B\}$.
(a) With this norm $X^*$ is a Banach space.
(b) If $B^*$ is the closed unit ball of $X^*$, then $\|x\|=\sup\{|\langle x,x^*\rangle|:\ x^*\in B^*\}$ for every $x\in X$. Hence $x^*\mapsto\langle x,x^*\rangle$ is a bounded linear functional on $X^*$ whose norm is $\|x\|$.
(c) $B^*$ is weak$^*$-compact.`,
      idea: String.raw`(a) is the case $Y=$ scalars of 4.1. In (b), $|\langle x,x^*\rangle|\le\|x\|$ on $B^*$ is trivial; for the reverse, the Hahn–Banach theorem (3.3) extends the functional $\alpha x\mapsto\alpha\|x\|$ from the line through $x$ to some $x^*$ with $|x^*|\le\|\cdot\|$, so the supremum is even **attained**. (c) $B^*$ consists of the functionals bounded by $1$ on the neighbourhood $B$ of $0$ — the polar of $B$ — so the Banach–Alaoglu theorem (3.15) applies. By (b), $x\mapsto\langle x,\cdot\rangle$ is an isometric embedding of $X$ into $X^{**}$.`,
      caption: String.raw`Top: $X=(\R^2,\|\cdot\|_p)$ and $X^*=(\R^2,\|\cdot\|_q)$ with $\tfrac1p+\tfrac1q=1$. Drag $x$. On the right, the grey lines are level sets of the functional $x^*\mapsto\langle x,x^*\rangle$ on $X^*$; the highest level it reaches on $B^*$ is $\|x\|_p$, at the norming functional $x_0^*$. On the left, $x_0^*$ appears as the green supporting line of the ball $\|x\|\,B$ at $x$. Bottom, part (c) in infinite dimensions: in $(c_0)^*=\ell^1$ the coordinate functionals $\delta_n$ lie on the unit sphere and are pairwise at distance $2$, yet $\langle x,\delta_n\rangle=x_n\to0$ for every $x\in c_0$ — they converge weak$^*$ (not in norm) to $0\in B^*$.`,
      deps: ['fa-4.1', 'fa-3.3', 'fa-3.15', 'fa-3.14'],
      see: ['rca-5.20', 'rca-5.21', 'rca-6.16'],
      tags: ['duality', 'Hahn–Banach', 'weak* topology'],
      viz(v) {
        const pS = v.select('norm on $X$: $p=$', PSEL, 3);
        const nS = v.slider('index $n$ of $\\delta_n$ in (c)', 1, 36, 7, { int: true });
        const L = v.stage({ x: [-1.9, 1.9], y: [-1.55, 1.55], equal: true, height: 310, ticks: false, title: '(b) in $X=(\\R^2,\\|\\cdot\\|_p)$' });
        const R = v.stage({ x: [-1.9, 1.9], y: [-1.55, 1.55], equal: true, height: 310, ticks: false, title: '(b) in $X^*=(\\R^2,\\|\\cdot\\|_q)$: $\\;x^*\\mapsto\\langle x,x^*\\rangle$ on $B^*$' });
        const B = v.stage({ x: [0.2, 36.8], y: [-1.05, 1.15], height: 165, full: true, axes: true, xticks: [1, 5, 10, 15, 20, 25, 30, 35], yticks: [-1, -0.5, 0.5, 1], title: '(c) a fixed $x\\in c_0$ tested against $\\delta_1,\\delta_2,\\dots\\in B^*\\subset\\ell^1$: bars are $\\langle x,\\delta_n\\rangle=x_n$' });
        const xh = L.handle(0.72, 0.42, { color: 'accent', label: 'x' });
        const xc = (n) => 0.95 * Math.cos(0.83 * n + 0.4) / Math.pow(1 + 0.35 * (n - 1), 0.9);
        const env = (n) => 0.95 / Math.pow(1 + 0.35 * (n - 1), 0.9);
        const sub = (n) => String(n).split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join('');
        let st = {};
        v.render(() => {
          const p = pS.value, q = conj(p);
          const x = [xh.x, xh.y], nx = pn(x, p);
          const dball = sphere(q, 1440);
          let best = -Infinity, xs = dball[0];
          for (const d of dball) { const s = dot2(x, d); if (s > best) { best = s; xs = d; } }
          // ---- left: X
          L.poly(sphere(p, 400), { fill: 'blue', fillAlpha: 0.15, color: 'blue', width: 2 });
          if (nx > 1e-3) {
            L.poly(sphere(p, 400).map(([a, b]) => [nx * a, nx * b]), { color: 'blue', width: 1.2, dash: [5, 4] });
            levelLine(L, xs, nx, { color: 'green', width: 2.3 });
            levelLine(L, xs, -nx, { color: 'green', width: 1.4, dash: [6, 4] });
          }
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          const tn = Math.hypot(...xs);
          if (nx > 0.15) {
            const f = [xs[0] / tn, xs[1] / tn], t = [-f[1], f[0]], off = nx / tn;
            const lp = [f[0] * (off + 0.2) + t[0] * 0.9, f[1] * (off + 0.2) + t[1] * 0.9];
            if (Math.abs(lp[0]) < 1.75 && Math.abs(lp[1]) < 1.45) L.tex('\\langle\\cdot,x_0^*\\rangle=\\|x\\|', lp[0], lp[1], { color: 'green', size: 13 });
          }
          // ---- right: X*
          if (nx > 1e-3) for (let k = -6; k <= 6; k++) if (k) levelLine(R, x, k * nx / 3, { color: 'faint', width: 1 });
          R.poly(dball, { fill: 'purple', fillAlpha: 0.14, color: 'purple', width: 2 });
          if (nx > 1e-3) { levelLine(R, x, nx, { color: 'green', width: 2.2 }); levelLine(R, x, -nx, { color: 'green', width: 1.4, dash: [6, 4] }); }
          R.dot(0, 0, { color: 'ink', r: 2.5 });
          R.dot(xs[0], xs[1], { color: 'green', r: 5.5, label: 'x₀*', labelPos: xs[1] >= 0 ? 'ne' : 'se' });
          R.dot(-xs[0], -xs[1], { color: 'green', r: 3.5, alpha: 0.7 });
          R.corner(`q = ${q === Infinity ? '∞' : v.fmt(q, 3)}`, 'tl', { color: 'purple', weight: 600 });
          // ---- bottom: c0 and δ_n
          const n = nS.value;
          for (let k = 1; k <= 36; k++) {
            const val = xc(k);
            B.rect(k - 0.32, 0, k + 0.32, val, { fill: k === n ? 'gold' : 'blue', fillAlpha: k === n ? 0.9 : 0.45, stroke: false });
          }
          B.fn(env, { color: 'muted', width: 1, dash: [4, 4], domain: [1, 36] });
          B.fn((t) => -env(t), { color: 'muted', width: 1, dash: [4, 4], domain: [1, 36] });
          B.vline(n, { color: 'gold', width: 1.2, dash: [3, 3] });
          B.dot(n, xc(n), { color: 'gold', r: 5, label: `⟨x, δ${sub(n)}⟩`, labelPos: xc(n) >= 0 ? 'ne' : 'se' });
          B.corner('‖δₙ − δₘ‖₁ = 2 for n ≠ m — no norm-convergent subsequence', 'tr', { color: 'red', weight: 600 });
          st = { nx, best, xs, p, q, n, xn: xc(n) };
        });
        v.legend([['blue', 'unit ball $B$ of $X$', { area: true }], ['purple', 'unit ball $B^*$ of $X^*$', { area: true }], ['green', 'norming functional $x_0^*$ and its level line'], ['gold', '$\\langle x,\\delta_n\\rangle$', { dot: true }]]);
        v.readout(() => {
          const s = st;
          return `(b) $\\max_{x^*\\in B^*}\\langle x,x^*\\rangle = ${v.fix(s.best, 4)}$ at $x_0^*=(${v.fix(s.xs[0], 3)},\\,${v.fix(s.xs[1], 3)})$, and $\\|x\\|_{${pTeX(s.p)}} = ${v.fix(s.nx, 4)}$. $\\quad$ (c) $\\langle x,\\delta_{${s.n}}\\rangle = x_{${s.n}} = ${v.fix(s.xn, 4)}\\to0$, although $\\|\\delta_n\\|=1$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Definition',
      name: 'Annihilators',
      statement: String.raw`Let $X$ be a normed space, $M$ a subspace of $X$ and $N$ a subspace of $X^*$. Their **annihilators** are
$$M^\perp=\{x^*\in X^*:\ \langle x,x^*\rangle=0\ \text{for all } x\in M\},\qquad {}^\perp\!N=\{x\in X:\ \langle x,x^*\rangle=0\ \text{for all } x^*\in N\}.$$
$M^\perp$ is a subspace of $X^*$ that is closed in the norm and even in the weak$^*$-topology; $\,{}^\perp\!N$ is a norm-closed subspace of $X$.`,
      idea: String.raw`$M^\perp=\bigcap_{x\in M}\{x^*:\langle x,x^*\rangle=0\}$ is an intersection of kernels of the maps $x^*\mapsto\langle x,x^*\rangle$, which are weak$^*$-continuous by definition (3.14) and hence norm-continuous; likewise $\,{}^\perp\!N$ is an intersection of kernels of the continuous $x^*\in N$. In a Hilbert space, after identifying $H^*$ with $H$, $M^\perp$ is the orthogonal complement — but in general it lives in the *dual*.`,
      caption: String.raw`$X=\R^3$ and $X^*=\R^3$ with the pairing $\langle x,x^*\rangle=\sum x_ix_i^*$; drag either panel to rotate. Turn and tilt the subspace $M$ (a line or a plane). On the right $M^\perp$ is drawn in $X^*$ — in these coordinates it is the orthogonal complement of the faint ghost of $M$. Each $x^*\in M^\perp$ shows up on the left through its kernel, a plane that contains $M$; slide through the choices.`,
      deps: ['fa-4.1', 'fa-3.14'],
      see: ['rca-4.9'],
      tags: ['annihilators', 'duality'],
      viz(v) {
        const dimS = v.select('$M$ is', [{ value: 1, label: 'a line' }, { value: 2, label: 'a plane' }], 1);
        const az = v.slider('turn $M$', -180, 180, 5, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const el = v.slider('tilt $M$', -80, 80, 35, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const ph = v.slider('which $x^*\\in M^\\perp$', 0, 360, 20, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const L = v.stage3d({ range: 2.05, axisLength: 1.65, height: 340, yaw: -0.7, pitch: 0.38, labels: ['x₁', 'x₂', 'x₃'], title: '$X=\\R^3$: $M$ (blue) and $\\ker x^*$ (green)' });
        const R = v.stage3d({ range: 2.05, axisLength: 1.65, height: 340, yaw: -0.7, pitch: 0.38, labels: ['x₁*', 'x₂*', 'x₃*'], title: '$X^*=\\R^3$: the annihilator $M^\\perp$' });
        let st = {};
        v.render(() => {
          const A = az.value * Math.PI / 180, E = el.value * Math.PI / 180, F = ph.value * Math.PI / 180;
          const u = [Math.cos(E) * Math.cos(A), Math.cos(E) * Math.sin(A), Math.sin(E)];
          const a = unit3(Math.abs(u[2]) < 0.9 ? cross(u, [0, 0, 1]) : cross(u, [1, 0, 0])), b = cross(u, a);
          const line = dimS.value === 1;
          let xs, kerA, kerB, basisM;
          if (line) { // M = span u, M⊥ = span{a, b}
            xs = [0, 1, 2].map((i) => Math.cos(F) * a[i] + Math.sin(F) * b[i]);
            kerA = u; kerB = unit3(cross(xs, u)); basisM = [u];
          } else { // M = u⊥, M⊥ = span u
            const s = Math.cos(F) >= 0 ? 1 : -1, len = 0.35 + 0.65 * Math.abs(Math.cos(F));
            xs = u.map((t) => s * len * t); kerA = a; kerB = b; basisM = [a, b];
          }
          const xsn = unit3(xs);
          // ---- left: X
          plane3(L, [0, 0, 0], kerA, kerB, 1.15, { color: 'green', fillAlpha: 0.13 });
          if (line) { L.line(u.map((t) => -1.6 * t), u.map((t) => 1.6 * t), { color: 'blue', width: 4 }); L.tex('M', u.map((t) => 1.75 * t), { color: 'blue' }); }
          else { plane3(L, [0, 0, 0], a, b, 1.0, { color: 'blue', fillAlpha: 0.2, width: 2 }); L.tex('M', [0, 1, 2].map((i) => 1.05 * a[i] + 1.05 * b[i]), { color: 'blue' }); }
          L.dot([0, 0, 0], { color: 'ink', r: 3 });
          // ---- right: X*
          if (line) {
            R.line(u.map((t) => -1.45 * t), u.map((t) => 1.45 * t), { color: 'muted', width: 1.4, dash: [5, 4], alpha: 0.6 });
            plane3(R, [0, 0, 0], a, b, 1.15, { color: 'green', fillAlpha: 0.17, width: 1.8 });
            R.tex('M^\\perp', [0, 1, 2].map((i) => 1.25 * a[i] - 1.2 * b[i]), { color: 'green' });
          } else {
            plane3(R, [0, 0, 0], a, b, 0.95, { color: 'gray', fillAlpha: 0.06, width: 1 });
            R.line(u.map((t) => -1.6 * t), u.map((t) => 1.6 * t), { color: 'green', width: 4 });
            R.tex('M^\\perp', u.map((t) => 1.78 * t), { color: 'green' });
          }
          R.arrow([0, 0, 0], xs.map((t) => t * 1.05), { color: 'green', width: 2.6, head: 10 });
          R.text('x*', xs.map((t) => t * 1.22), { color: 'green', math: true, size: 17 });
          R.dot([0, 0, 0], { color: 'ink', r: 3 });
          st = { line, pair: basisM.map((m) => dot3(m, xs)), xs };
        });
        v.legend([['blue', 'the subspace $M\\subset X$'], ['green', '$M^\\perp\\subset X^*$, and on the left the kernel of one $x^*\\in M^\\perp$'], ['muted', 'ghost of $M$ in the coordinates of $X^*$', { dash: true }]]);
        v.readout(() => {
          const s = st;
          const prs = s.pair.map((t, i) => `\\langle m_${i + 1},x^*\\rangle = ${v.fix(Math.abs(t) < 5e-13 ? 0 : t, 3)}`).join(',\\ ');
          return `$x^*=(${s.xs.map((t) => v.fix(t, 2)).join(',\\,')})$; for a basis of $M$: $${prs}$. $\\;\\dim M+\\dim M^\\perp = ${s.line ? '1+2' : '2+1'} = 3$, and $\\,{}^\\perp(M^\\perp)=M$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'Double annihilators: norm closure and weak*-closure',
      statement: String.raw`Let $M$ be a subspace of a normed space $X$ and $N$ a subspace of $X^*$.
(a) $\,{}^\perp(M^\perp)$ is the norm-closure of $M$ in $X$.
(b) $({}^\perp\!N)^\perp$ is the weak$^*$-closure of $N$ in $X^*$.
In particular $M$ is dense in $X$ if and only if $M^\perp=\{0\}$, and $N$ is weak$^*$-dense in $X^*$ if and only if $\,{}^\perp\!N=\{0\}$.`,
      idea: String.raw`In both parts the double annihilator is a closed subspace (in the relevant topology) containing the original one. For (a), if $x_0$ is not in the closure of $M$, the Hahn–Banach theorem (3.5) gives $x^*\in M^\perp$ with $\langle x_0,x^*\rangle\ne0$, so $x_0\notin{}^\perp(M^\perp)$. For (b) argue the same way inside $X^*$ with its weak$^*$-topology: it is locally convex and its dual is $X$ (3.14, 3.10), so a point outside the weak$^*$-closure of $N$ is separated from it (3.7) by some $x\in{}^\perp\!N$. Norm-closedness of $N$ is not enough — its weak$^*$-closure can be much larger.`,
      caption: String.raw`$X=c_0$, $X^*=\ell^1$, $\langle x,y\rangle=\sum x_ny_n$. For a bounded $u$ the subspace $N=\{y\in\ell^1:\sum u_ny_n=0\}$ is norm-closed (a kernel of a bounded functional on $\ell^1$). It contains $y^{(k)}=e_1-\frac{u_1}{u_k}e_k$. Move $k$: if $u=(1,1,1,\dots)\notin c_0$, then $\langle x,y^{(k)}\rangle=x_1-x_k\to x_1$ for every $x\in c_0$, so $y^{(k)}\to e_1\notin N$ weak$^*$ — $N$ is weak$^*$-dense. If $u\in c_0$, the $y^{(k)}$ blow up and $N=({}^\perp\!N)^\perp$ is weak$^*$-closed. Grey bars: the test vector $x\in c_0$.`,
      deps: ['fa-4.6', 'fa-3.5', 'fa-3.7', 'fa-3.10', 'fa-3.14'],
      see: ['rca-5.19'],
      tags: ['annihilators', 'weak* topology', 'Hahn–Banach'],
      viz(v) {
        const US = {
          one: { label: '$u=(1,1,1,\\dots)$', u: () => 1, c0: false },
          alt: { label: '$u=(1,-1,1,\\dots)$', u: (n) => (n % 2 ? 1 : -1), c0: false },
          harm: { label: '$u=(1/n)\\in c_0$', u: (n) => 1 / n, c0: true },
        };
        const uS = v.select('', Object.entries(US).map(([value, o]) => ({ value, label: o.label })), 'one');
        const kS = v.slider('$k$', 2, 40, 7, { int: true });
        const NN = 40, M_ = v.M;
        const x = (n) => 0.78 * Math.cos(0.62 * (n - 1)) / Math.pow(1 + 0.25 * (n - 1), 1.1);
        const XT = [1, 5, 10, 15, 20, 25, 30, 35, 40];
        const A = v.stage({ x: [0.2, NN + 0.8], y: [-1.6, 1.45], height: 150, full: true, axes: true, xticks: XT, title: 'the element $y^{(k)}=e_1-\\frac{u_1}{u_k}e_k$ of $N$ (coordinates $n=1,\\dots,40$)' });
        const B = v.stage({ x: [0.2, NN + 0.8], y: [-1.1, 1.3], height: 215, full: true, axes: true, xticks: XT, title: 'pairings $\\langle x,y^{(j)}\\rangle$ for $j=2,3,\\dots$ against the target $\\langle x,e_1\\rangle=x_1$' });
        let st = {};
        v.render(() => {
          const U = US[uS.value], k = kS.value, u = U.u;
          const yk = -u(1) / u(k);
          // ---- A: y^(k)
          const lo = Math.min(-1.6, yk * 1.18), hi = Math.max(1.45, -lo * 0.25);
          A.setView(null, [lo, hi]);
          A.rect(1 - 0.34, 0, 1 + 0.34, 1, { fill: 'green', fillAlpha: 0.75, stroke: false });
          A.rect(k - 0.34, 0, k + 0.34, yk, { fill: 'red', fillAlpha: 0.75, stroke: false });
          A.text('1', 1.6, 0.85, { color: 'green', align: 'left', size: 12 });
          A.text(`−u₁/uₖ = ${v.fmt(yk, 3)}`, k + 0.6, yk * 0.5, { color: 'red', align: 'left', size: 12 });
          A.corner(`‖y⁽ᵏ⁾‖₁ = ${v.fmt(1 + Math.abs(yk), 3)}`, 'tr', { color: U.c0 ? 'red' : 'muted', weight: 600 });
          // ---- B: pairings
          const pr = [];
          for (let j = 2; j <= NN; j++) pr.push([j, x(1) - (u(1) / u(j)) * x(j)]);
          const ymax = Math.max(1.0, ...pr.map((p) => p[1])), ymin = Math.min(-0.3, ...pr.map((p) => p[1]), ...M_.range(NN).map((i) => x(i + 1)));
          B.setView(null, [ymin - 0.12 * (ymax - ymin), ymax + 0.3 * (ymax - ymin)]);
          for (let n = 1; n <= NN; n++) B.rect(n - 0.3, 0, n + 0.3, x(n), { fill: 'gray', fillAlpha: 0.32, stroke: false });
          if (!U.c0) B.hline(x(1), { color: 'green', width: 1.8, dash: [6, 4] });
          B.path(pr, { color: U.c0 ? 'red' : 'blue', width: 1.3, alpha: 0.6 });
          for (const [j, val] of pr) B.dot(j, val, { color: j === k ? 'gold' : (U.c0 ? 'red' : 'blue'), r: j === k ? 6 : 3.2 });
          if (!U.c0) B.tex('x_1=\\langle x,e_1\\rangle', NN + 0.5, x(1), { color: 'green', align: 'right', baseline: 'bottom', dy: -9, size: 13 });
          B.corner(U.c0 ? 'unbounded: no weak* limit' : 'converges to x₁: y⁽ʲ⁾ → e₁ weak*', 'tl', { color: U.c0 ? 'red' : 'green', weight: 600 });
          st = { U, k, pk: x(1) - (u(1) / u(k)) * x(k), x1: x(1), nk: 1 + Math.abs(yk), alt: uS.value === 'alt' };
        });
        v.legend([['green', '$e_1$-coordinate / the weak$^*$ limit $e_1$'], ['red', '$k$-th coordinate of $y^{(k)}$'], ['blue', '$\\langle x,y^{(j)}\\rangle$', { dot: true }], ['gray', 'test vector $x\\in c_0$', { area: true }]]);
        v.readout(() => {
          const s = st;
          const head = `$\\langle x,y^{(${s.k})}\\rangle = ${v.fix(s.pk, 4)}$, $\\;x_1 = ${v.fix(s.x1, 4)}$, $\\;\\|y^{(${s.k})}\\|_1 = ${v.fix(s.nk, 3)}$. `;
          if (!s.U.c0) return head + `Here $\\,{}^\\perp\\!N=\\{x\\in c_0: ${s.alt ? 'x_k=(-1)^{k+1}x_1\\ \\forall k' : 'x_1=x_2=\\cdots'}\\}=\\{0\\}$, so $({}^\\perp\\!N)^\\perp=\\ell^1$: $N$ is norm-closed but weak$^*$-dense, and $e_1\\notin N$ since $\\sum u_n(e_1)_n=1$.`;
          return head + `Here $\\,{}^\\perp\\!N=\\operatorname{span}\\{u\\}$ (as $u\\in c_0$), so $({}^\\perp\\!N)^\\perp=N$: $N$ is weak$^*$-closed; a weak$^*$-convergent sequence would be bounded.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Duals of subspaces and of quotient spaces',
      statement: String.raw`Let $M$ be a closed subspace of a Banach space $X$.
(a) By the Hahn–Banach theorem every $m^*\in M^*$ extends to some $x^*\in X^*$. Setting $\sigma m^*=x^*+M^\perp$ defines an isometric isomorphism $\sigma$ of $M^*$ onto $X^*/M^\perp$.
(b) Let $\pi:X\to X/M$ be the quotient map and $Y=X/M$. For $y^*\in Y^*$ put $\tau y^*=y^*\pi$. Then $\tau$ is an isometric isomorphism of $Y^*$ onto $M^\perp$.`,
      idea: String.raw`(a) Two extensions of $m^*$ differ by an element of $M^\perp$, so $\sigma$ is well defined, linear and onto (restrict any $x^*$ to $M$). Every extension has norm $\ge\|m^*\|$, and a norm-preserving one exists (3.3), so the quotient norm $\inf\{\|x^*+z^*\|:z^*\in M^\perp\}$ equals $\|m^*\|$. (b) $y^*\pi$ vanishes on $M$; conversely every $x^*\in M^\perp$ factors through $\pi$. Since $\pi$ maps the open unit ball of $X$ onto that of $X/M$, $\|y^*\pi\|=\|y^*\|$.`,
      caption: String.raw`$X=(\R^2,\|\cdot\|_p)$ with dual norm $\|\cdot\|_q$; turn the line $M$. **(a)** Choose $m^*$ on $M$. All its extensions form the green line $x^*+M^\perp$ in $X^*$ (parallel to $M^\perp$, dashed); drag along it — the norm is never below $\|m^*\|$, and the smallest one (where the coset touches $\|m^*\|B^*$) is the Hahn–Banach extension. **(b)** The unit ball of $X/M$ pulled back to $X$ is the orange strip $M+B$. A functional $x^*\in M^\perp$ (drag it) is constant along $M$, so it defines $y^*$ on $X/M$; the strip lies exactly between its level lines $\langle\cdot,x^*\rangle=\pm\|x^*\|_q$ (green), i.e. $\|y^*\|=\|x^*\|_q$. Drag $x$ to test one coset.`,
      deps: ['fa-4.6', 'fa-3.3', 'fa-4.3'],
      see: ['rca-5.16'],
      tags: ['duality', 'quotient spaces', 'annihilators'],
      viz(v) {
        const mode = v.select('', [{ value: 'a', label: '(a) $M^*\\cong X^*/M^\\perp$' }, { value: 'b', label: '(b) $(X/M)^*\\cong M^\\perp$' }], 'a');
        const pS = v.select('$p=$', PSEL, 1);
        const ang = v.slider('direction of $M$', 0, 180, 32, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const cS = v.slider('$m^*(u)$, $u\\in M$ with $\\|u\\|=1$', -1.2, 1.2, 0.7, { step: 0.01 });
        const L = v.stage({ x: [-2.1, 2.1], y: [-1.75, 1.75], equal: true, height: 330, ticks: false, title: '$X=(\\R^2,\\|\\cdot\\|_p)$' });
        const R = v.stage({ x: [-2.1, 2.1], y: [-1.75, 1.75], equal: true, height: 330, ticks: false, title: '$X^*=(\\R^2,\\|\\cdot\\|_q)$' });
        let geo = null;
        const onLine = (P, d) => (x, y) => { const t = (x - P[0]) * d[0] + (y - P[1]) * d[1]; return [P[0] + t * d[0], P[1] + t * d[1]]; };
        const ext = R.handle(0.3, 0.8, { color: 'green', label: 'x*', constrain: (x, y) => (geo ? onLine(geo.P0, geo.w)(x, y) : [x, y]) });
        const ann = R.handle(-0.5, 0.82, { color: 'green', label: 'x*', constrain: (x, y) => (geo ? onLine([0, 0], geo.w)(x, y) : [x, y]) });
        const xh = L.handle(0.9, -0.9, { color: 'accent', label: 'x' });
        let st = {}, lastKey = '';
        v.render(() => {
          const p = pS.value, q = conj(p), th = ang.value * Math.PI / 180;
          const d = [Math.cos(th), Math.sin(th)], u = [d[0] / pn(d, p), d[1] / pn(d, p)];  // ‖u‖_p = 1
          const w = [-Math.sin(th), Math.cos(th)];             // direction of M⊥ in X* (Euclidean normal)
          const isA = mode.value === 'a';
          ext.visible = isA; ann.visible = !isA; xh.visible = !isA;
          cS.el.style.opacity = isA ? 1 : 0.4;
          // coset {x* : <u, x*> = c}: base point P0 = c u/|u|²
          const c = cS.value, uu = dot2(u, u), P0 = [c * u[0] / uu, c * u[1] / uu];
          geo = { P0, w };
          const key = `${mode.value}|${p}|${ang.value}|${c}`;
          if (key !== lastKey) { // re-snap handles onto their lines
            const e = onLine(P0, w)(ext.x, ext.y); ext.x = e[0]; ext.y = e[1];
            const a = onLine([0, 0], w)(ann.x, ann.y); ann.x = a[0]; ann.y = a[1];
            lastKey = key;
          }
          const ballX = sphere(p, 720), ballD = sphere(q, 1440);
          L.line(-6 * d[0], -6 * d[1], 6 * d[0], 6 * d[1], { color: 'orange', width: 2.2 });
          L.tex('M', 1.85 * d[0] + 0.18 * w[0], 1.85 * d[1] + 0.18 * w[1], { color: 'orange', size: 16 });
          if (isA) {
            // ---- (a)
            const mn = Math.abs(c);   // ‖m*‖ = sup over ‖tu‖ ≤ 1 of |c t|
            L.poly(ballX, { fill: 'blue', fillAlpha: 0.14, color: 'blue', width: 2 });
            const xs = [ext.x, ext.y];
            if (Math.hypot(...xs) > 1e-6) { levelLine(L, xs, 1, { color: 'green', width: 2.2 }); levelLine(L, xs, -1, { color: 'green', width: 1.3, dash: [6, 4] }); }
            if (mn > 0.05) for (const sg of [1, -1]) { const m = [sg * u[0] / c, sg * u[1] / c]; if (Math.abs(m[0]) < 2.05 && Math.abs(m[1]) < 1.7) L.dot(m[0], m[1], { color: 'gold', r: 5, label: sg > 0 ? 'm* = 1' : 'm* = −1', labelPos: (m[1] > 0) === (sg > 0) ? 'nw' : 'se' }); }
            L.dot(0, 0, { color: 'ink', r: 2.5 });
            // X*: coset line, M⊥, scaled dual ball
            R.line(-6 * w[0], -6 * w[1], 6 * w[0], 6 * w[1], { color: 'green', width: 1.3, dash: [6, 5], alpha: 0.7 });
            R.tex('M^\\perp', 1.55 * w[0] - 0.22 * d[0], 1.55 * w[1] - 0.22 * d[1], { color: 'green', size: 14 });
            R.poly(ballD, { fill: 'purple', fillAlpha: 0.1, color: 'purple', width: 1.6 });
            if (mn > 1e-3) R.poly(ballD.map(([a, b]) => [mn * a, mn * b]), { color: 'purple', width: 2, dash: [3, 3] });
            R.line(P0[0] - 6 * w[0], P0[1] - 6 * w[1], P0[0] + 6 * w[0], P0[1] + 6 * w[1], { color: 'green', width: 3 });
            // minimal-norm point on the coset
            const [tm, nm] = convexMin((t) => pn([P0[0] + t * w[0], P0[1] + t * w[1]], q), -8, 8);
            const Pm = [P0[0] + tm * w[0], P0[1] + tm * w[1]];
            R.dot(Pm[0], Pm[1], { color: 'gold', r: 5, label: 'HB', labelPos: 'sw' });
            R.dot(0, 0, { color: 'ink', r: 2.5 });
            st = { isA, mn, nq: pn(xs, q), nm, p, q };
          } else {
            // ---- (b)
            const x = [xh.x, xh.y];
            // strip M + B: points with dist_p(x, M) ≤ 1, drawn as hull of B translated along M
            const strip = [];
            for (const b of sphere(p, 240)) { strip.push([b[0] + 9 * d[0], b[1] + 9 * d[1]]); strip.push([b[0] - 9 * d[0], b[1] - 9 * d[1]]); }
            L.poly(v.M.hull(strip), { fill: 'orange', fillAlpha: 0.13, stroke: false });
            L.poly(ballX, { fill: 'blue', fillAlpha: 0.14, color: 'blue', width: 2 });
            const xs = [ann.x, ann.y], nq = pn(xs, q);
            if (nq > 1e-6) {
              for (const lev of [-3, -2, -1, 1, 2, 3]) levelLine(L, xs, lev * nq / 3 * 2, { color: 'faint', width: 1 });
              levelLine(L, xs, nq, { color: 'green', width: 2.3 }); levelLine(L, xs, -nq, { color: 'green', width: 2.3 });
            }
            const [tm, dm] = convexMin((t) => pn([x[0] - t * d[0], x[1] - t * d[1]], p), -8, 8);
            const foot = [tm * d[0], tm * d[1]];
            L.line(x[0], x[1], foot[0], foot[1], { color: 'accent', width: 1.4, dash: [4, 3] });
            L.dot(foot[0], foot[1], { color: 'accent', r: 3.5 });
            L.dot(0, 0, { color: 'ink', r: 2.5 });
            // width of the strip in the direction of x*: sup over M+B of <·,x*> = ‖x*‖_q
            R.poly(ballD, { fill: 'purple', fillAlpha: 0.12, color: 'purple', width: 2 });
            R.line(-6 * w[0], -6 * w[1], 6 * w[0], 6 * w[1], { color: 'green', width: 3 });
            R.tex('M^\\perp', 1.55 * w[0] - 0.24 * d[0], 1.55 * w[1] - 0.24 * d[1], { color: 'green', size: 15 });
            R.dot(0, 0, { color: 'ink', r: 2.5 });
            const val = dot2(x, xs);
            st = { isA, nq, dm, val, ratio: dm > 1e-9 ? Math.abs(val) / dm : NaN, p, q };
          }
        });
        v.legend([['blue', 'unit ball of $X$', { area: true }], ['purple', 'unit ball of $X^*$', { area: true }], ['orange', '$M$ (and, in (b), the strip $M+B$)'], ['green', 'functionals: level lines in $X$, points in $X^*$']]);
        v.readout(() => {
          const s = st;
          if (s.isA) return `$\\|m^*\\| = ${v.fix(s.mn, 4)}$; $\\;$ this extension: $\\|x^*\\|_{${pTeX(s.q)}} = ${v.fix(s.nq, 4)}\\ge\\|m^*\\|$; $\\;$ quotient norm $\\|\\sigma m^*\\| = \\min_{z^*\\in M^\\perp}\\|x^*+z^*\\|_{${pTeX(s.q)}} = ${v.fix(s.nm, 4)}$.`;
          return `$\\|\\pi x\\| = \\operatorname{dist}_{${pTeX(s.p)}}(x,M) = ${v.fix(s.dm, 4)}$, $\\;\\langle x,x^*\\rangle = ${v.fix(s.val, 4)}$, so $|y^*(\\pi x)|/\\|\\pi x\\| = ${isFinite(s.ratio) ? v.fix(s.ratio, 4) : '—'}$ $=\\|y^*\\|$ $= \\|x^*\\|_{${pTeX(s.q)}} = ${v.fix(s.nq, 4)}$ ($Y=X/M$ is one-dimensional here).`;
        });
      },
    },
  ],
};
