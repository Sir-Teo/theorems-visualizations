// Rudin, Real and Complex Analysis — Chapter 5, part 3: Fourier coefficients of L^1 functions and the
// Hahn–Banach theorem (5.12–5.16).

// ∫_{-π}^{π} g(t) dt after the substitution t = sgn(s)·s², which tames an |t|^{-1/2} singularity at 0.
function integrateT(M, g, n = 6000) {
  const R = Math.sqrt(Math.PI);
  return M.integrate((s) => g(Math.sign(s) * s * s) * 2 * Math.abs(s), -R, R, n);
}
// dual exponent and the norm of a in the dual space of (R^2, ℓ^p)
const dualP = (p) => (p === 1 ? Infinity : p === Infinity ? 1 : p / (p - 1));

const SUP = (n) => String(n).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('');
const LEB3 = [];
function lebesgue3(M, N) {
  if (LEB3[N] == null) LEB3[N] = M.integrate((t) => Math.abs(M.dirichlet(N, t)), 0, Math.PI, 400 + 80 * N) / Math.PI;
  return LEB3[N];
}

export default {
  collection: 'rca',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.12
    {
      num: '5.12',
      kind: 'Theorem',
      name: 'Riemann–Lebesgue lemma on the circle',
      credit: 'Riemann & Lebesgue, 1854',
      statement: String.raw`For $f\in L^1(T)$ put $\hat f(n)=\int_T f(t)e^{-int}\,dm(t)$ $(n\in\Z)$. Then $|\hat f(n)|\le\norm{f}_1$ for every $n$, and
$$\lim_{\abs{n}\to\infty}\hat f(n)=0,$$
i.e. $\hat f$ belongs to the space $c_0$ of sequences on $\Z$ that vanish at infinity.`,
      idea: String.raw`The bound is immediate from $|e^{-int}|=1$. For a trigonometric polynomial $P$ of degree $d$, $\hat P(n)=0$ when $\abs n>d$. Trigonometric polynomials are dense in $C(T)$ (4.25), which is dense in $L^1(T)$ (3.14); so given $\eps$ pick $P$ with $\norm{f-P}_1<\eps$, and then $|\hat f(n)|=|(f-P)\hat{}\,(n)|\le\norm{f-P}_1<\eps$ for all $\abs n>d$.`,
      caption: String.raw`Pick an $L^1$ function (the middle one is unbounded) and a degree $d$. Top: $f$ and its Fejér mean $P=\sigma_df$, a trigonometric polynomial of degree $d$, with $\abs{f-P}$ shaded. Bottom: $|\hat f(n)|$, computed by quadrature. Every bar to the right of $n=d$ lies below the line at height $\norm{f-P}_1$ — exactly the estimate of the proof — and raising $d$ pushes the line down.`,
      deps: ['rca-4.25', 'rca-3.14'],
      see: ['rca-9.6'],
      verify: true,
      tags: ['Fourier coefficients', 'L1'],
      viz(v) {
        const M = v.M;
        const FN = {
          step: { label: '$\\chi_{[-1,1]}$', f: (t) => (Math.abs(t) <= 1 ? 1 : 0), y: [-0.6, 1.6] },
          sing: { label: '$\\tfrac12|t|^{-1/2}$', f: (t) => 0.5 / Math.sqrt(Math.abs(t) || 1e-300), y: [-0.6, 2.6] },
          jump: { label: 'sawtooth + jump', f: (t) => t / Math.PI + (t > 1.2 ? -1 : 0) + 0.3 * Math.cos(5 * t), y: [-2.3, 1.6] },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sing');
        const dS = v.slider('degree $d$', 0, 40, 8, { int: true });
        const top = v.stage({ x: [-Math.PI, Math.PI], y: [-0.6, 2.6], height: 230, full: true, xticks: [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], title: '$f$ and the trigonometric polynomial $P=\\sigma_d f$' });
        const bot = v.stage({ x: [-2.6, 61], y: [0, 1], height: 210, full: true, axes: 'box', title: '$|\\hat f(n)|$ for $n=0,1,\\dots,60$ $\\;$ (real $f$: $|\\hat f(-n)|=|\\hat f(n)|$)' });
        const NC = 60;
        const cache = {};
        const coeffs = (key) => {
          if (cache[key]) return cache[key];
          const f = FN[key].f, out = [];
          for (let k = 0; k <= NC; k++) {
            const re = integrateT(M, (t) => f(t) * Math.cos(k * t)) / M.TAU;
            const im = -integrateT(M, (t) => f(t) * Math.sin(k * t)) / M.TAU;
            out.push([re, im]);
          }
          const l1 = integrateT(M, (t) => Math.abs(f(t))) / M.TAU;
          return (cache[key] = { c: out, l1 });
        };
        let st = null;
        v.render(() => {
          const key = which.value, F = FN[key], d = dS.value, C = coeffs(key);
          // Fejér mean σ_d f(t) = Σ_{|k|≤d} (1-|k|/(d+1)) f̂(k) e^{ikt}, using f̂(-k) = conj f̂(k)
          const P = (t) => { let s = C.c[0][0]; for (let k = 1; k <= d; k++) { const w = 1 - k / (d + 1), [a, b] = C.c[k]; s += 2 * w * (a * Math.cos(k * t) - b * Math.sin(k * t)); } return s; };
          const err = integrateT(M, (t) => Math.abs(F.f(t) - P(t)), 4000) / M.TAU;
          top.setView(null, F.y);
          top.between((t) => Math.min(F.f(t), 40), P, -Math.PI, Math.PI, { fill: 'red', fillAlpha: 0.16, n: 900 });
          top.fn(F.f, { color: 'ink', width: 2.2, n: 1600 });
          top.fn(P, { color: 'green', width: 2.2 });
          const mags = C.c.map(([a, b]) => Math.hypot(a, b));
          const ymax = Math.max(...mags, err) * 1.15;
          bot.setView(null, [-0.12 * ymax, ymax]);
          bot.vband(d + 0.5, 61, { color: 'green', alpha: 0.06 });
          bot.bars(mags, { x0: 0, color: (val, i) => (i > d ? (val <= err + 1e-9 ? 'accent' : 'red') : 'muted') });
          bot.hline(err, { color: 'green', width: 1.8, dash: [6, 4] });
          bot.vline(d + 0.5, { color: 'green', width: 1.2 });
          bot.text(`‖f − P‖₁ = ${v.fix(err, 3)}`, 60, err, { align: 'right', dy: -10, color: 'green', size: 12 });
          bot.text(`n > d = ${d}`, d + 1, ymax * 0.88, { color: 'green', size: 12 });
          const tail = Math.max(0, ...mags.slice(d + 1));
          st = { d, err, l1: C.l1, tail, f0: mags[0] };
        });
        v.legend([['ink', '$f$'], ['green', '$P=\\sigma_d f$'], ['red', '$|f-P|$', { area: true }], ['accent', '$|\\hat f(n)|$, $n>d$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `$\\|f\\|_1 = ${v.fix(st.l1, 3)} \\ge \\sup_n|\\hat f(n)|$; $\\;\\|f-P\\|_1 = ${v.fix(st.err, 4)}$ and $\\max_{d<n\\le 60}|\\hat f(n)| = ${v.fix(st.tail, 4)} \\le \\|f-P\\|_1$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.13
    {
      num: '5.13',
      kind: 'Theorem',
      name: 'Fourier coefficients of L¹ functions do not fill c₀',
      statement: String.raw`The map $f\mapsto\hat f$ is a one-to-one bounded linear transformation of $L^1(T)$ **into**, but not **onto**, $c_0$.`,
      idea: String.raw`It maps into $c_0$ with norm $\le1$ by 5.12. If $\hat f=0$ then $\int fg\,dm=0$ for all trigonometric polynomials $g$, hence for all $g\in C(T)$ (4.25), hence $f=0$ a.e. If the map were onto, it would be a continuous bijection between Banach spaces, so by 5.10 $\|\hat f\|_\infty\ge\delta\norm{f}_1$ for some $\delta>0$. The Dirichlet kernels refute this: $\|\hat D_n\|_\infty=1$ while $\norm{D_n}_1\to\infty$ (5.11).`,
      caption: String.raw`Left: a bounded inverse (5.10) would force $\|\hat f\|_\infty/\norm{f}_1\ge\delta$ for every $f\in L^1(T)$. For the Dirichlet kernels this ratio is $1/\norm{D_k}_1$ (dots: quadrature for $k\le1000$; dashed: the asymptote $\frac{4}{\pi^2}\log k+1.27$). Drag $\delta$: it always falls below — though only at astronomically large $k$ for small $\delta$. Right: an explicit sequence in $c_0$ outside the range, $b_n=1/\log n$ as sine coefficients. For an odd $f\in L^1$ the sum $\sum b_n/n$ must converge (a classical criterion, not Rudin's argument); here it grows like $\log\log N$.`,
      deps: ['rca-5.12', 'rca-5.10', 'rca-5.11', 'rca-4.25'],
      see: ['rca-9.6'],
      tags: ['Fourier coefficients', 'open mapping'],
      viz(v) {
        const M = v.M;
        const dS = v.slider('$\\delta$', 0.1, 0.6, 0.26, { step: 0.005 });
        const L = v.stage({ x: [-0.4, 12.4], y: [-0.12, 1.05], height: 300, axes: 'box', xticks: [0, 2, 4, 6, 8, 10, 12].map((e) => [e, e === 0 ? '1' : '10' + SUP(e)]), title: '$\\|\\hat D_k\\|_\\infty/\\|D_k\\|_1 = 1/\\|D_k\\|_1$ against $k$ (log scale)' });
        const R = v.stage({ x: [Math.log(2) - 0.4, Math.log(1e6) + 0.6], y: [-0.3, 3.6], height: 300, axes: 'box', xticks: [2, 10, 100, 1e3, 1e4, 1e5, 1e6].map((n) => [Math.log(n), n >= 1e3 ? '10' + SUP(Math.round(Math.log10(n))) : String(n)]), title: '$\\sum_{n=2}^{N} b_n/n$ with $b_n=1/\\log n\\to0$' });
        const ks = M.range(20, 1); for (let k = 24; k < 1000; k = Math.ceil(k * 1.18)) ks.push(k); ks.push(1000);
        const pts = ks.map((k) => [Math.log10(k), 1 / lebesgue3(M, k)]);
        const asym = (e) => 1 / (4 / (Math.PI * Math.PI) * e * Math.LN10 + 1.27);
        // partial sums of 1/(n log n) on a log grid
        const S = []; { let sum = 0, nx = 2; for (let n = 2; n <= 1e6; n++) { sum += 1 / (n * Math.log(n)); if (n >= nx || n === 1e6) { S.push([Math.log(n), sum]); nx = Math.ceil(nx * 1.12); } } }
        let st = null;
        v.render(() => {
          const d = dS.value;
          const eCross = ((1 / d - 1.27) * Math.PI * Math.PI / 4) / Math.LN10;   // log10 of the crossing k (asymptotic)
          L.hband(d, 1.05, { color: 'green', alpha: 0.08 });
          L.hline(d, { color: 'green', width: 1.8 });
          L.tex(`\\delta = ${v.fix(d, 3)}`, 40.5, d, { color: 'green', align: 'right', baseline: 'bottom', dy: -3, size: 13 });
          L.fn(asym, { domain: [3, 12.4], color: 'accent', width: 1.6, dash: [6, 4] });
          L.dots(pts.filter((p) => p[1] >= d), { r: 3, color: 'accent' });
          L.dots(pts.filter((p) => p[1] < d), { r: 3, color: 'red' });
          if (eCross > 0 && eCross < 12.4) {
            L.vline(eCross, { color: 'red', width: 1.2, dash: [3, 3] });
            L.text(`k ≈ 10${SUP(Math.round(eCross))}`, eCross, 0.92, { dx: 6, color: 'red', size: 12 });
          }
          // right panel
          R.path(S, { color: 'red', width: 2.4 });
          R.fn((u) => Math.log(u) + 0.7947, { domain: [Math.log(3), Math.log(1e6)], color: 'muted', width: 1.4, dash: [5, 4] });
          R.text('log log N + 0.795', Math.log(1e5), Math.log(Math.log(1e5)) + 0.7947, { align: 'right', dy: -16, color: 'muted', size: 12 });
          st = { d, eCross, S: S[S.length - 1][1], r1000: pts[pts.length - 1][1], k1000: ks[ks.length - 1] };
        });
        v.legend([['accent', 'ratio for $D_k$ (dots exact, dashes asymptotic)'], ['red', 'below $\\delta$', { dot: true }], ['green', 'what a bounded inverse would require', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `At $k=${st.k1000}$ the ratio is $${v.fix(st.r1000, 4)}$; it drops below $\\delta=${v.fix(st.d, 3)}$ once $\\|D_k\\|_1>1/\\delta$, near $k\\approx 10^{${Math.max(0, Math.round(st.eCross))}}$. So no $\\delta>0$ works and the map is not onto. Right: $\\sum_{n\\le 10^6} b_n/n = ${v.fix(st.S, 3)}$ and still growing.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.15
    {
      num: '5.15',
      kind: 'Lemma',
      name: 'Complex functionals are determined by their real parts',
      statement: String.raw`Let $X$ be a complex vector space.
(a) If $f$ is a complex-linear functional on $X$ and $u=\Re f$, then $u$ is real-linear and $f(x)=u(x)-i\,u(ix)$ for all $x\in X$.
(b) If $u$ is a real-linear functional on $X$ and $f(x)=u(x)-i\,u(ix)$, then $f$ is complex-linear.
(c) If $X$ is normed and $f$, $u$ are as in (a) or (b), then $\norm{f}=\norm{u}$.`,
      idea: String.raw`Write $f=u+iv$ with $u,v$ real-linear. Then $u(ix)+iv(ix)=f(ix)=if(x)=iu(x)-v(x)$, so $v(x)=-u(ix)$. Conversely the formula makes $f(ix)=if(x)$, which together with real-linearity is complex-linearity. For the norms, $\abs{u}\le\abs{f}$ gives $\norm u\le\norm f$; and if $f(x)=\abs{f(x)}e^{i\theta}$ then $\abs{f(x)}=f(e^{-i\theta}x)=u(e^{-i\theta}x)\le\norm u\,\norm x$.`,
      caption: String.raw`Take $X=\C$. Drag the gradient $(\alpha,\beta)$ of the real-linear functional $u(x+iy)=\alpha x+\beta y$ (its level lines are drawn) and the point $z$. Right: $f(z)=u(z)-i\,u(iz)$ is built from the two real numbers $u(z)$ and $u(iz)$; it equals $(\alpha-i\beta)z$, so $f(iz)=i f(z)$ and $f$ maps the unit circle onto the circle of radius $\norm f=\norm u=\sqrt{\alpha^2+\beta^2}$.`,
      deps: ['rca-5.2'],
      see: ['fa-3.3'],
      verify: true,
      tags: ['Hahn–Banach', 'linear functional'],
      viz(v) {
        const L = v.stage({ x: [-1.9, 1.9], y: [-1.6, 1.6], equal: true, height: 330, title: 'domain $X=\\C$: level lines of $u$' });
        const R = v.stage({ x: [-2.3, 2.3], y: [-2, 2], equal: true, height: 330, title: 'values: $f(z)=u(z)-i\\,u(iz)$' });
        const g = L.handle(0.85, 0.5, { color: 'blue', label: '∇u' });
        const z = L.handle(0.62, -0.55, { color: 'gold', label: 'z' });
        let st = null;
        v.render(() => {
          const al = g.x, be = g.y, nu = Math.hypot(al, be);
          const u = (x, y) => al * x + be * y;
          // level lines u = k·0.4
          if (nu > 1e-6) {
            const n = [al / nu, be / nu], t = [-n[1], n[0]];
            for (let k = -8; k <= 8; k++) {
              const c = (k * 0.4) / nu, p = [n[0] * c, n[1] * c];
              L.line(p[0] - 5 * t[0], p[1] - 5 * t[1], p[0] + 5 * t[0], p[1] + 5 * t[1], { color: k === 0 ? 'blue' : 'faint', width: k === 0 ? 1.4 : 1, alpha: k === 0 ? 0.6 : 0.8 });
            }
          }
          L.circle(0, 0, 1, { color: 'muted', width: 1.4, dash: [5, 4] });
          L.arrow(0, 0, al, be, { color: 'blue', width: 2 });
          const iz = [-z.y, z.x];
          L.arrow(0, 0, z.x, z.y, { color: 'gold', width: 2 });
          L.arrow(0, 0, iz[0], iz[1], { color: 'purple', width: 2 });
          L.dot(iz[0], iz[1], { color: 'purple', r: 4.5, label: 'iz', labelPos: 'nw' });
          const uz = u(z.x, z.y), uiz = u(iz[0], iz[1]);
          const fz = [uz, -uiz];               // f(z) = u(z) - i u(iz)
          const fiz = [uiz, uz];               // f(iz) = u(iz) - i u(-z) = u(iz) + i u(z)
          // right panel
          R.circle(0, 0, nu, { color: 'green', width: 1.6, fill: 'green', fillAlpha: 0.06 });
          R.line(fz[0], 0, fz[0], fz[1], { color: 'faint', width: 1, dash: [3, 3] });
          R.line(0, fz[1], fz[0], fz[1], { color: 'faint', width: 1, dash: [3, 3] });
          R.line(0, 0, fz[0], 0, { color: 'blue', width: 3 });
          R.line(0, 0, 0, fz[1], { color: 'purple', width: 3 });
          R.tex('u(z)', fz[0], 0, { color: 'blue', baseline: fz[1] > 0 ? 'top' : 'bottom', dy: fz[1] > 0 ? 6 : -6, size: 14 });
          R.tex('-u(iz)', 0, fz[1], { color: 'purple', align: fz[0] > 0 ? 'right' : 'left', dx: fz[0] > 0 ? -6 : 6, size: 14 });
          R.arrow(0, 0, fz[0], fz[1], { color: 'gold', width: 2.4 });
          R.dot(fz[0], fz[1], { color: 'gold', r: 5, label: 'f(z)', labelPos: 'ne' });
          R.arrow(0, 0, fiz[0], fiz[1], { color: 'muted', width: 1.6, dash: [5, 4] });
          R.dot(fiz[0], fiz[1], { color: 'muted', r: 4, label: 'f(iz) = i f(z)', labelPos: fiz[0] >= 0 ? 'e' : 'w' });
          R.tex('|w|=\\|f\\|', nu * Math.cos(-0.8), nu * Math.sin(-0.8), { color: 'green', align: 'left', baseline: 'top', dx: 4, dy: 4, size: 13 });
          st = { al, be, nu, uz, uiz, fz };
        });
        v.legend([['blue', 'gradient of $u$, level lines'], ['gold', '$z$ and $f(z)$'], ['purple', '$iz$ and $-u(iz)$'], ['green', 'image of the unit circle', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const s = st;
          return `$u(z) = ${v.fix(s.uz, 3)}$, $\\;u(iz) = ${v.fix(s.uiz, 3)}$, $\\;f(z) = ${v.fix(s.fz[0], 3)} ${s.fz[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(s.fz[1]), 3)}\\,i = (\\alpha - i\\beta)\\,z$; $\\;\\|u\\| = \\|f\\| = ${v.fix(s.nu, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.16
    {
      num: '5.16',
      kind: 'Theorem',
      name: 'Hahn–Banach theorem',
      credit: 'Hahn & Banach, 1927',
      statement: String.raw`If $M$ is a subspace of a normed linear space $X$ and $f$ is a bounded linear functional on $M$, then $f$ extends to a bounded linear functional $F$ on $X$ with $\norm{F}=\norm{f}$.`,
      idea: String.raw`Real case, $\norm f=1$: to extend to $M+\R x_1$ one needs a value $\alpha=F(x_1)$ with $f(y)-\norm{y-x_1}\le\alpha\le\norm{y+x_1}-f(y)$ for all $y\in M$; such $\alpha$ exist because the triangle inequality makes every left side at most every right side. The Hausdorff maximality theorem (4.21) pushes this one-dimensional step to all of $X$. The complex case applies the real case to $u=\Re f$ and returns via $F(x)=U(x)-iU(ix)$ (5.15).`,
      caption: String.raw`$X=\R^2$ with the $\ell^p$ norm; $M$ is the line through $0$ (drag its direction) and $f$ has norm $1$ on $M$. Right: the dual plane, where an extension $F=\langle a,\cdot\rangle$ is a point on the orange line $\{a:\ a|_M=f\}$ and $\norm F=\norm{a}_q$. Admissible extensions form the green set where that line touches the dual ball: a whole interval when $M$ runs through a corner of the unit ball (try $p=1$ or $p=\infty$; the handle snaps to those directions), a single point otherwise and always for $p=2$. Drag $a$: on the left, the level lines $F=\pm1$ support the unit ball exactly when $\norm F=1$.`,
      deps: ['rca-5.15', 'rca-4.21', 'rca-5.2'],
      see: ['fa-3.2', 'fa-3.3', 'fa-3.4'],
      tags: ['Hahn–Banach', 'duality'],
      viz(v) {
        const M = v.M;
        const sel = v.select('$p$', [{ value: '1', label: '$1$' }, { value: '1.5', label: '$\\tfrac32$' }, { value: '2', label: '$2$' }, { value: '3', label: '$3$' }, { value: 'inf', label: '$\\infty$' }], 'inf');
        const L = v.stage({ x: [-1.85, 1.85], y: [-1.6, 1.6], equal: true, height: 340, axes: false, title: '$X=(\\R^2,\\|\\cdot\\|_p)$: unit ball, $M$, and $\\{F=\\pm1\\}$' });
        const R = v.stage({ x: [-1.85, 1.85], y: [-1.6, 1.6], equal: true, height: 340, axes: false, title: 'dual $(\\R^2,\\|\\cdot\\|_q)$: extensions $a$ with $a|_M=f$' });
        const mh = L.handle(Math.cos(Math.PI / 4) * 0.4, Math.sin(Math.PI / 4) * 0.4, { color: 'orange', label: 'M', constrain: (x, y) => { let t = Math.atan2(y, x); const q = Math.round(t / (Math.PI / 4)) * (Math.PI / 4); if (Math.abs(t - q) < 0.07) t = q; return [0.4 * Math.cos(t), 0.4 * Math.sin(t)]; } });
        mh.labelPos = 'nw';
        const ah = R.handle(0.6, 0.6, { color: 'gold', label: 'a' });
        let st = null;
        v.render(() => {
          const p = sel.value === 'inf' ? Infinity : +sel.value, q = dualP(p);
          const th = Math.atan2(mh.y, mh.x), m = [Math.cos(th), Math.sin(th)], mp = [-m[1], m[0]];
          const c = M.norm(m, p);              // f(m) = ‖m‖_p, so ‖f‖ = 1 on M
          // keep the handle on the affine line {a : <a,m> = c}
          let s = ah.x * mp[0] + ah.y * mp[1];
          s = M.clamp(s, -2.2, 2.2);
          const a = [c * m[0] + s * mp[0], c * m[1] + s * mp[1]];
          ah.x = a[0]; ah.y = a[1];
          const na = M.norm(a, q);
          // admissible face: {s : ‖c m + s mp‖_q ≤ 1}
          const nq = (ss) => M.norm([c * m[0] + ss * mp[0], c * m[1] + ss * mp[1]], q);
          let lo = -2.5, hi = 2.5;
          for (let k = 0; k < 80; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (nq(m1) < nq(m2)) hi = m2; else lo = m1; }
          const sStar = (lo + hi) / 2, tol = 1 + 1e-7;
          const edge = (dir) => { let a0 = sStar, a1 = sStar + dir * 3; if (nq(a1) <= tol) return a1; for (let k = 0; k < 60; k++) { const mm = (a0 + a1) / 2; if (nq(mm) <= tol) a0 = mm; else a1 = mm; } return a0; };
          const sLo = edge(-1), sHi = edge(1);
          // the proof's interval for F(x1), x1 = mp
          let plo = -Infinity, phi = Infinity;
          for (let k = 0; k <= 6000; k++) {
            const t = Math.sinh(-16 + 32 * k / 6000), y = [t * m[0], t * m[1]], fy = t * c;   // t up to ±4·10⁶
            plo = Math.max(plo, fy - M.norm([y[0] - mp[0], y[1] - mp[1]], p));
            phi = Math.min(phi, M.norm([y[0] + mp[0], y[1] + mp[1]], p) - fy);
          }
          const ok = na <= 1 + 1e-6;
          // ---- left: X
          L.poly(M.unitBall(p, 480), { fill: 'accent', fillAlpha: 0.13, color: 'accent', width: 1.8 });
          L.line(-4 * m[0], -4 * m[1], 4 * m[0], 4 * m[1], { color: 'orange', width: 2.2 });
          const x0 = [m[0] / c, m[1] / c];
          L.dot(x0[0], x0[1], { color: 'orange', r: 5 });
          L.tex('f=1', x0[0] - 0.24 * m[0] - 0.16 * mp[0], x0[1] - 0.24 * m[1] - 0.16 * mp[1], { color: 'orange', size: 14 });
          L.dot(-x0[0], -x0[1], { color: 'orange', r: 4 });
          // the whole fan of norm-preserving extensions: their level lines F = 1 all support the ball
          if (sHi - sLo > 1e-3) for (let k = 0; k <= 8; k++) {
            const sk = sLo + (sHi - sLo) * k / 8, ak = [c * m[0] + sk * mp[0], c * m[1] + sk * mp[1]], ank = Math.hypot(ak[0], ak[1]);
            const nk = [ak[0] / ank, ak[1] / ank], tk = [-nk[1], nk[0]], P0 = [nk[0] / ank, nk[1] / ank];
            L.line(P0[0] - 5 * tk[0], P0[1] - 5 * tk[1], P0[0] + 5 * tk[0], P0[1] + 5 * tk[1], { color: 'green', width: 1, alpha: 0.3 });
          }
          const an = Math.hypot(a[0], a[1]);
          if (an > 1e-6) {
            const n = [a[0] / an, a[1] / an], tt = [-n[1], n[0]];
            for (const sg of [1, -1]) {
              const P0 = [n[0] * sg / an, n[1] * sg / an];
              L.line(P0[0] - 5 * tt[0], P0[1] - 5 * tt[1], P0[0] + 5 * tt[0], P0[1] + 5 * tt[1], { color: ok ? 'green' : 'red', width: 2 });
            }
            const cands = [0.95, -0.95, 0.5, -0.5].map((k) => [n[0] / an + tt[0] * k, n[1] / an + tt[1] * k]);
            const lp = cands.find((c) => Math.abs(c[0]) < 1.6 && Math.abs(c[1]) < 1.4) || cands[0];
            L.tex('F=1', lp[0], lp[1], { color: ok ? 'green' : 'red', size: 14, align: 'left', dx: 6 });
          }
          L.dot(mp[0], mp[1], { color: 'muted', r: 3.5, label: 'x₁', labelPos: 'n' });
          // ---- right: dual plane
          R.poly(M.unitBall(q, 480), { fill: 'purple', fillAlpha: 0.1, color: 'purple', width: 1.8 });
          R.line(c * m[0] - 4 * mp[0], c * m[1] - 4 * mp[1], c * m[0] + 4 * mp[0], c * m[1] + 4 * mp[1], { color: 'orange', width: 1.6, dash: [6, 4] });
          const A = [c * m[0] + sLo * mp[0], c * m[1] + sLo * mp[1]], B = [c * m[0] + sHi * mp[0], c * m[1] + sHi * mp[1]];
          if (sHi - sLo > 1e-3) R.line(A[0], A[1], B[0], B[1], { color: 'green', width: 6 });
          R.dot(A[0], A[1], { color: 'green', r: 5 }); R.dot(B[0], B[1], { color: 'green', r: 5 });
          R.arrow(0, 0, a[0], a[1], { color: ok ? 'gold' : 'red', width: 2 });
          R.tex('\\{\\|a\\|_q\\le1\\}', -0.75, -1.05, { color: 'purple', size: 14 });
          st = { p, q, na, ok, sLo, sHi, plo, phi, s };
        });
        v.legend([['accent', 'unit ball of $X$', { area: true }], ['orange', 'subspace $M$; affine line $a|_M=f$'], ['purple', 'dual unit ball', { area: true }], ['green', 'norm-preserving extensions']]);
        v.readout(() => {
          if (!st) return '';
          const s = st, qs = s.q === Infinity ? '\\infty' : v.fmt(s.q, 3), fx = (x) => v.fix(Math.abs(x) < 5e-4 ? 0 : x, 3);
          return `$q=${qs}$, $\\;\\|F\\| = \\|a\\|_q = ${v.fix(s.na, 3)}$ ${s.ok ? '— a Hahn–Banach extension' : '$>1$ — not norm-preserving'}. Admissible $F(x_1)$: dual face $[${fx(s.sLo)},\\,${fx(s.sHi)}]$; proof's bound $\\sup_y(f(y)-\\|y-x_1\\|) = ${fx(s.plo)} \\le F(x_1) \\le ${fx(s.phi)} = \\inf_y(\\|y+x_1\\|-f(y))$.`;
        });
      },
    },
  ],
};
