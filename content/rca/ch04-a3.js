// Rudin, Real and Complex Analysis — Chapter 4, part 3: ℓ²(A), the isometry lemma,
// Bessel / Riesz–Fischer, maximal orthonormal sets and Parseval (4.15–4.20).

/** TeX scientific notation for small numbers */
const sci = (x) => { if (x === 0) return '0'; if (Math.abs(x) >= 1e-3) return x.toFixed(4); const e = Math.floor(Math.log10(Math.abs(x))); return `${(x / 10 ** e).toFixed(1)}\\times10^{${e}}`; };

/** Haar coefficients of samples xs (midpoint grid of size 2^L on [0,1]) for levels 0..J-1: c[j][k]. */
function haarCoeffs(xs, J) {
  const N = xs.length, pre = [0];
  for (let i = 0; i < N; i++) pre.push(pre[i] + xs[i] / N);
  const S = (a, b) => pre[Math.round(b * N)] - pre[Math.round(a * N)];
  const c = [];
  for (let j = 0; j < J; j++) {
    const row = [], w = 1 / 2 ** j;
    for (let k = 0; k < 2 ** j; k++) row.push(2 ** (j / 2) * (S(k * w, (k + 0.5) * w) - S((k + 0.5) * w, (k + 1) * w)));
    c.push(row);
  }
  return c;
}
/** Values of Σ_{j<J} Σ_k c[j][k] h_{jk} on the 2^J dyadic cells of level J. */
function haarSynth(c, J) {
  const n = 2 ** J, out = new Array(n).fill(0);
  for (let j = 0; j < J; j++) {
    const per = n / 2 ** j;
    for (let m = 0; m < n; m++) { const k = Math.floor(m / per), half = (m % per) < per / 2 ? 1 : -1; out[m] += c[j][k] * 2 ** (j / 2) * half; }
  }
  return out;
}

export default {
  book: 'rca',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.15
    {
      num: '4.15',
      kind: 'Definition',
      name: 'Sums over arbitrary index sets; the space ℓ²(A)',
      statement: String.raw`If $0\le\varphi(\alpha)\le\infty$ for each $\alpha$ in a set $A$, then $\sum_{\alpha\in A}\varphi(\alpha)$ denotes the supremum of all finite sums $\varphi(\alpha_1)+\dots+\varphi(\alpha_n)$ with distinct $\alpha_i\in A$ — the integral of $\varphi$ against counting measure on $A$. The space $\ell^2(A)$ consists of all complex $\varphi$ on $A$ with $\sum_{\alpha\in A}|\varphi(\alpha)|^2<\infty$; it is $L^2$ of counting measure, hence a Hilbert space with inner product $(\varphi,\psi)=\sum_{\alpha\in A}\varphi(\alpha)\overline{\psi(\alpha)}$. Each $\varphi\in\ell^2(A)$ vanishes off a countable set, and the functions with finite support are dense in $\ell^2(A)$.`,
      idea: String.raw`Completeness is Theorem 3.11 applied to counting measure. If $\sum|\varphi|^2<\infty$ then for each $n$ only finitely many $\alpha$ have $|\varphi(\alpha)|^2>1/n$, so the support is countable; and truncating to a finite set changes the norm by a tail that can be made small. $\ell^2(A)$ is the model target space: by 4.17–4.19 every Hilbert space is isomorphic to some $\ell^2(A)$.`,
      deps: ['rca-3.11'],
      verify: true,
      tags: ['Hilbert space', 'counting measure'],
    },

    // ------------------------------------------------------------------ 4.16
    {
      num: '4.16',
      kind: 'Lemma',
      name: 'Isometric on a dense set ⇒ isometry onto',
      statement: String.raw`Suppose that
(a) $X$ and $Y$ are metric spaces and $X$ is complete;
(b) $f:X\to Y$ is continuous;
(c) $X$ has a dense subset $X_0$ on which $f$ is an isometry;
(d) $f(X_0)$ is dense in $Y$.
Then $f$ is an isometry of $X$ onto $Y$.`,
      idea: String.raw`Continuity carries the identity $d(f(x),f(x'))=d(x,x')$ from the dense set $X_0$ to all of $X$. For $y\in Y$ pick $x_n\in X_0$ with $f(x_n)\to y$; since $f$ is an isometry, $(x_n)$ is Cauchy in $X$, so it converges to some $x$ by completeness, and $f(x)=\lim f(x_n)=y$ by continuity. Rudin uses this in 4.17 with $X=\overline P$ and $Y=\ell^2(A)$.`,
      caption: String.raw`$X=[0,1]$ (top), $Y=[0,1]$ (bottom), $f(t)=1-t$, and $X_0$ the dyadic rationals, whose images are dense in $Y$. Drag the gold target $y\in Y$ and add terms with the slider: dyadic points $x_n$ with $f(x_n)\to y$ are exactly as close together as their images, so they form a Cauchy sequence, and completeness of $X$ supplies the green preimage. The lower panel zooms in (with $Y$ flipped so $f$ maps straight down). Now remove the point $c=1/\sqrt2$ from $X$: when $y=f(c)$ (the handle snaps there) the Cauchy sequence has no limit in $X$ — $f$ is still an isometry with dense image, but no longer onto.`,
      deps: ['pma-3.12'],
      verify: true,
      tags: ['completeness', 'isometry'],
      viz(v) {
        const M = v.M;
        const c = Math.SQRT1_2, fc = 1 - c;
        const space = v.select('$X$', [{ value: 'full', label: '$X=[0,1]$ (complete)' }, { value: 'hole', label: '$X=[0,1]\\setminus\\{c\\}$ (not complete)' }], 'full');
        const nn = v.slider('terms $n$', 1, 16, 9, { int: true });
        const S = v.stage({ x: [-0.07, 1.07], y: [-0.45, 1.5], height: 230, full: true, axes: false });
        const Z = v.stage({ x: [0, 1], y: [-0.6, 1.6], height: 180, full: true, axes: false, title: 'zoom around the limit' });
        const hy = S.handle(0.36, 0, { color: 'gold', label: 'y', constrain: (px) => { let x = M.clamp(px, 0, 1); if (space.value === 'hole' && Math.abs(x - fc) < 0.03) x = fc; return [x, 0]; } });
        let st = {};
        v.render(() => {
          const N = nn.value, hole = space.value === 'hole', y = hy.x, target = 1 - y;
          const missing = hole && Math.abs(target - c) < 1e-9;
          S.line(0, 1, 1, 1, { color: 'accent', width: 3 });
          S.line(0, 0, 1, 0, { color: 'orange', width: 3 });
          S.tex('X', -0.035, 1, { color: 'accent', size: 18 });
          S.tex('Y', -0.035, 0, { color: 'orange', size: 18 });
          S.tex('f(t)=1-t', 1.0, 0.5, { color: 'muted', align: 'right', size: 14 });
          const D = M.range(33).map((i) => i / 32);
          S.dots(D.map((t) => [t, 1]), { color: 'accent', r: 2.4 });
          S.dots(D.map((t) => [1 - t, 0]), { color: 'orange', r: 2.4 });
          // dyadic approximations of level n, alternately from below and above
          const seq = M.range(N, 1).map((n) => (n % 2 ? Math.floor(target * 2 ** n) : Math.ceil(target * 2 ** n)) / 2 ** n);
          seq.forEach((t, i) => {
            const a = 0.3 + 0.7 * (i + 1) / N;
            S.line(t, 1, 1 - t, 0, { color: 'gold', width: 1.2, alpha: a * 0.6 });
            S.dot(t, 1, { color: 'gold', r: 3.6, alpha: a }); S.dot(1 - t, 0, { color: 'gold', r: 3.6, alpha: a });
          });
          if (hole) { S.dot(c, 1, { color: 'red', hollow: true, r: 6, width: 2.2 }); S.tex('c', c, 1, { color: 'red', dy: -17 }); }
          if (!missing) { S.line(target, 1, y, 0, { color: 'green', width: 2, dash: [5, 4] }); S.dot(target, 1, { color: 'green', r: 5.5 }); S.tex('x', target, 1, { color: 'green', dy: -17 }); }
          S.corner(missing ? 'y = f(c) has no preimage: f is not onto' : hole ? 'this y is hit — now drag y onto f(c)' : 'every y ∈ Y is hit: f is onto', 'tl', { color: missing ? 'red' : hole ? 'muted' : 'green', weight: 600 });
          // zoom: X near target on top, Y near y (flipped) below, same scale
          const w = Math.max(1.15 * 2 ** -Math.max(1, N - 4), 3e-6);
          Z.setView([target - w, target + w], null);
          Z.line(target - 2 * w, 1, target + 2 * w, 1, { color: 'accent', width: 3 });
          Z.line(target - 2 * w, 0, target + 2 * w, 0, { color: 'orange', width: 3 });
          seq.forEach((t, i) => {
            if (Math.abs(t - target) > 1.2 * w) return;
            Z.line(t, 1, t, 0, { color: 'gold', width: 1.2, alpha: 0.5 });
            Z.dot(t, 1, { color: 'gold', r: 4.5 }); Z.dot(t, 0, { color: 'gold', r: 4.5 });
            Z.tex(`x_{${i + 1}}`, t, 1, { dy: i % 2 ? -18 : 18, color: 'gold', size: 13 });
          });
          if (missing) { Z.dot(target, 1, { color: 'red', hollow: true, r: 7, width: 2.4 }); Z.tex('c\\notin X', target, 1, { color: 'red', dy: 22 }); }
          else Z.dot(target, 1, { color: 'green', r: 5 });
          Z.dot(target, 0, { color: 'gold', r: 6, hollow: true, width: 2.2 });
          Z.text(`window width ${v.fmt(2 * w, 2)}`, target + w, -0.42, { align: 'right', size: 11.5, color: 'muted', dx: -6 });
          Z.tex('X', target - w, 1, { color: 'accent', align: 'left', dx: 8, dy: -16 });
          Z.tex('Y', target - w, 0, { color: 'orange', align: 'left', dx: 8, dy: 16 });
          const gap = N > 1 ? Math.abs(seq[N - 1] - seq[N - 2]) : NaN;
          st = { gap, err: Math.abs(seq[N - 1] - target), target, missing, N };
          v.legend([['accent', '$X$, dots: $X_0$'], ['orange', '$Y$, dots: $f(X_0)$'], ['gold', '$x_n\\in X_0$ with $f(x_n)\\to y$'], ['green', 'the preimage $x$']]);
        });
        v.readout(() => {
          const s = st; if (s.N == null) return '';
          return `$d(x_n,x) = d(f(x_n),y) = ${sci(s.err)}$ for $n=${s.N}$` + (isFinite(s.gap) ? `, $\\;d(x_n,x_{n-1}) = d(f(x_n),f(x_{n-1})) = ${sci(s.gap)}$` : '') + (s.missing ? '; the limit would be $c=1/\\sqrt2$, **which is not in $X$**.' : `; $\\;x = ${v.fix(s.target, 4)}\\in X$ and $f(x) = y$.`);
        });
      },
    },

    // ------------------------------------------------------------------ 4.17
    {
      num: '4.17',
      kind: 'Theorem',
      name: "Bessel's inequality and the Riesz–Fischer theorem",
      statement: String.raw`Let $\{u_\alpha:\alpha\in A\}$ be an orthonormal set in a Hilbert space $H$ and let $P$ be the set of finite linear combinations of the $u_\alpha$. Then for every $x\in H$
$$\sum_{\alpha\in A}|\hat x(\alpha)|^2\le\|x\|^2\qquad\text{(Bessel's inequality)},$$
and $x\mapsto\hat x$ is a continuous linear map of $H$ **onto** $\ell^2(A)$ whose restriction to the closure $\overline P$ is an isometry of $\overline P$ onto $\ell^2(A)$.`,
      idea: String.raw`Bessel's inequality is the supremum over finite $F\subset A$ of the finite version in 4.14(b); it shows $\hat x\in\ell^2(A)$ and gives continuity. By 4.14(a) the map is an isometry on $P$ and carries $P$ onto the finitely supported functions, which are dense in $\ell^2(A)$ (4.15). Since $\overline P$ is complete, Lemma 4.16 upgrades this to an isometry of $\overline P$ onto $\ell^2(A)$; surjectivity is the Riesz–Fischer theorem.`,
      caption: String.raw`Orthonormal set: the Haar functions $h_{jk}$ on $[0,1]$ (levels $j<J$), indexed by the dyadic tiles in the middle panel. **Bessel** ($x\mapsto\hat x$): the cumulative energy $\sum|\hat x|^2$ climbs level by level but stays below $\|x\|^2$; this set omits the constant $1$, so a gap $|\!\int x|^2$ remains forever. **Riesz–Fischer** ($c\mapsto x$): prescribe $c_{jk}=\pm2^{-js}$. For $s>\tfrac12$ the sequence is in $\ell^2$, the partial sums are Cauchy and converge to a function whose coefficients are exactly $c$ (with $\|x\|^2=\sum|c|^2$); for $s\le\tfrac12$ the energy diverges.`,
      deps: ['rca-4.14', 'rca-4.15', 'rca-4.16'],
      see: ['pma-8.12'],
      tags: ['orthonormal', 'Bessel', 'Riesz–Fischer'],
      viz(v) {
        const M = v.M;
        const L = 12, NG = 2 ** L;
        const grid = M.range(NG).map((i) => (i + 0.5) / NG);
        const FX = {
          sq: { label: '$t^2$', f: (t) => t * t },
          bump: { label: 'bump', f: (t) => Math.exp(-60 * (t - 0.32) ** 2) + 0.5 * Math.exp(-200 * (t - 0.75) ** 2) },
          cos: { label: '$\\cos 7t$', f: (t) => Math.cos(7 * t) },
          step: { label: '$\\chi_{[0.3,1]}$', f: (t) => (t >= 0.3 ? 1 : 0) },
        };
        const cache = {};
        const getX = (key) => {
          if (!cache[key]) {
            const xs = grid.map(FX[key].f);
            const nx = xs.reduce((s, x) => s + x * x, 0) / NG, mean = xs.reduce((s, x) => s + x, 0) / NG;
            cache[key] = { xs, nx, mean, c: haarCoeffs(xs, L) };
          }
          return cache[key];
        };
        const R = M.rng(7); const SIGNS = M.range(L).map((j) => M.range(2 ** j).map(() => (R() < 0.5 ? -1 : 1)));
        const dir = v.select('', [{ value: 'bessel', label: '$x\\mapsto\\hat x$ (Bessel)' }, { value: 'rf', label: '$c\\mapsto x$ (Riesz–Fischer)' }], 'bessel');
        const which = v.select('$x$', Object.entries(FX).map(([value, F]) => ({ value, label: F.label })), 'bump');
        const sS = v.slider('decay $s$ of $c_{jk}=\\pm2^{-js}$', 0.3, 1.4, 0.8, { step: 0.01 });
        const JJ = v.slider('levels $J$', 1, 9, 5, { int: true });
        const A = v.stage({ x: [-0.02, 1.02], y: [-1, 1.4], height: 280, minWidth: 300, axes: 'box', yticks: [0], title: 'in $H=L^2[0,1]$' });
        const T = v.stage({ x: [-0.13, 1.01], y: [-9.3, 0.3], height: 280, minWidth: 300, axes: false, title: 'in $\\ell^2(A)$: tiles $(j,k)$ coloured by the coefficient' });
        const E = v.stage({ x: [-0.7, 8.7], y: [0, 1], height: 190, full: true, axes: 'box', yticks: [], xticks: M.range(9).map((j) => [j, `j ≤ ${j}`]), title: 'cumulative energy $\\sum_{j\'\\le j}\\sum_k|c_{j\'k}|^2$' });
        const pos = v.rgb('accent'), neg = v.rgb('red');
        let st = {};
        v.render(() => {
          const J = JJ.value, bessel = dir.value === 'bessel', s = sS.value;
          let c, nx = null, mean = 0, fJ, xs = null;
          if (bessel) {
            const X = getX(which.value); c = X.c; nx = X.nx; mean = X.mean; xs = X.xs;
            // partial sum over levels < J = (average on level-J cells) - mean  (projection, computed directly)
            const n = 2 ** J, per = NG / n; fJ = [];
            for (let m = 0; m < n; m++) { let a = 0; for (let i = m * per; i < (m + 1) * per; i++) a += xs[i]; fJ.push(a / per - mean); }
          } else {
            c = SIGNS.map((row, j) => row.map((e) => e * 2 ** (-j * s)));
            fJ = haarSynth(c, J);
          }
          // ----- H panel
          const vals = fJ.concat(xs ? [Math.min(...xs), Math.max(...xs)] : []);
          const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals), pad = 0.12 * (hi - lo + 0.2);
          A.setView(null, [lo - pad, hi + pad]);
          A.line(0, 0, 1, 0, { color: 'faint', width: 1 });
          if (xs) A.path(grid.filter((_, i) => i % 8 === 0).map((t, i) => [t, xs[i * 8]]), { color: 'ink', width: 2.2 });
          const n = fJ.length, step = [];
          fJ.forEach((y, m) => { step.push([m / n, y], [(m + 1) / n, y]); });
          A.path(step, { color: bessel ? 'green' : 'gold', width: 2.2 });
          // ----- tiles
          const Jshow = Math.min(9, L);
          let cmax = 1e-9; for (let j = 0; j < Jshow; j++) for (const x of c[j]) cmax = Math.max(cmax, Math.abs(x));
          for (let j = 0; j < Jshow; j++) {
            const w = 1 / 2 ** j;
            c[j].forEach((val, k) => {
              const a = Math.min(1, Math.abs(val) / cmax) ** 0.6, col = val >= 0 ? pos : neg;
              T.rect(k * w, -j - 0.92, (k + 1) * w, -j, { fill: `rgb(${col[0]},${col[1]},${col[2]})`, fillAlpha: j < J ? 0.08 + 0.85 * a : 0.04 + 0.25 * a, stroke: false });
            });
            T.text(`j = ${j}`, -0.065, -j - 0.46, { size: 11, align: 'center', color: j < J ? 'ink' : 'muted' });
          }
          T.line(0, -J + 0.04, 1, -J + 0.04, { color: 'gold', width: 2, dash: [5, 3] });
          // ----- energy
          const lev = c.map((row) => row.reduce((a, x) => a + x * x, 0));
          const cum = []; lev.reduce((a, e, j) => { cum.push(a + e); return a + e; }, 0);
          const allL = cum[L - 1];
          let total, ceiling;
          if (bessel) { ceiling = nx; total = nx - mean * mean; }
          else { ceiling = null; total = s > 0.5 ? 1 / (1 - 2 ** (1 - 2 * s)) : Infinity; }
          const ymax = (bessel ? ceiling : isFinite(total) ? total : cum[8]) * 1.22 || 1;
          E.setView(null, [-0.1 * ymax, ymax]);
          E.bars(cum.slice(0, 9), { x0: 0, barWidth: 0.6, color: (val, j) => (j < J ? (bessel ? 'green' : 'gold') : 'faint') });
          if (bessel) {
            E.line(-0.7, ceiling, 8.7, ceiling, { color: 'ink', width: 2 });
            E.tex('\\|x\\|^2', 8.6, ceiling, { align: 'right', baseline: 'bottom', dy: -3, size: 13 });
            E.line(-0.7, total, 8.7, total, { color: 'green', width: 1.6, dash: [6, 4] });
            E.tex('\\sum_{A}|\\hat x|^2=\\|x\\|^2-|\\textstyle\\int x|^2', -0.6, total, { color: 'green', align: 'left', baseline: 'bottom', dy: -4, size: 13 });
          } else if (isFinite(total)) {
            E.line(-0.7, total, 8.7, total, { color: 'green', width: 1.6, dash: [6, 4] });
            E.tex('\\sum_A|c|^2', 8.6, total, { color: 'green', align: 'right', baseline: 'bottom', dy: -3, size: 13 });
          } else E.corner('Σ|c|² = ∞: c ∉ ℓ², no function has these coefficients', 'tl', { color: 'red', weight: 600 });
          v.legend(bessel ? [['ink', '$x$'], ['green', '$\\sum_{j<J}\\sum_k\\hat x(j,k)h_{jk}$ (misses the mean of $x$)'], ['accent', '$c>0$', { area: true }], ['red', '$c<0$', { area: true }]]
            : [['gold', 'partial sum $x_J=\\sum_{j<J}\\sum_k c_{jk}h_{jk}$'], ['accent', '$c>0$', { area: true }], ['red', '$c<0$', { area: true }]]);
          const nfJ = fJ.reduce((a, y) => a + y * y, 0) / fJ.length;
          st = { bessel, J, cumJ: cum[J - 1], nx, mean, total, allL, nfJ, s, step2: lev[J - 1] };
        });
        v.readout(() => {
          const q = st; if (q.J == null) return '';
          if (q.bessel) return `$\\sum_{j<${q.J}}\\sum_k|\\hat x(j,k)|^2 = ${v.fix(q.cumJ, 4)} \\le \\sum_{A}|\\hat x|^2 \\approx ${v.fix(q.allL, 4)} < \\|x\\|^2 = ${v.fix(q.nx, 4)}$; the gap $${v.fix(q.nx - q.allL, 4)} \\approx |\\int x|^2 = ${v.fix(q.mean * q.mean, 4)}$ is the part of $x$ outside $\\overline P$.`;
          return `$\\|x_J\\|^2 = ${v.fix(q.nfJ, 4)} = \\sum_{j<${q.J}}\\sum_k|c_{jk}|^2 = ${v.fix(q.cumJ, 4)}$ (isometry on $P$); $\\;\\|x_J-x_{J-1}\\|^2 = 2^{(J-1)(1-2s)} = ${v.fix(q.step2, 4)}$` + (q.s > 0.5 ? ` — Cauchy, limit has norm$^2$ $${v.fix(q.total, 4)}$.` : ' — does not tend to $0$ fast enough: $\\sum|c|^2=\\infty$.');
        });
      },
    },

    // ------------------------------------------------------------------ 4.18
    {
      num: '4.18',
      kind: 'Theorem',
      name: 'Maximal orthonormal sets and Parseval’s identity',
      statement: String.raw`For an orthonormal set $\{u_\alpha:\alpha\in A\}$ in a Hilbert space $H$ the following are equivalent:
(i) $\{u_\alpha\}$ is a maximal orthonormal set in $H$;
(ii) the finite linear combinations of the $u_\alpha$ are dense in $H$;
(iii) $\sum_{\alpha\in A}|\hat x(\alpha)|^2=\|x\|^2$ for every $x\in H$;
(iv) $\sum_{\alpha\in A}\hat x(\alpha)\overline{\hat y(\alpha)}=(x,y)$ for all $x,y\in H$ (Parseval's identity).
A maximal orthonormal set is also called complete, or an orthonormal basis.`,
      idea: String.raw`(i)⇒(ii): if the closure of the span were a proper closed subspace, Corollary 4.11a would give a unit vector orthogonal to every $u_\alpha$, contradicting maximality. (ii)⇒(iii): by 4.17, $x\mapsto\hat x$ is an isometry on $\overline P=H$. (iii)⇒(iv): an inner product is determined by norms (expand $\|x+\lambda y\|^2$ for $\lambda=1,i$). (iv)⇒(i): a unit $u$ orthogonal to all $u_\alpha$ would have $\hat u=0$ yet $(u,u)=1$.`,
      caption: String.raw`$H=L^2(T)$ with $(f,g)=\frac1{2\pi}\int_{-\pi}^{\pi}f\bar g$ and orthonormal functions $1,\ \sqrt2\cos nt,\ \sqrt2\sin nt$. Choose a subfamily and a function $x$. With the full family the partial sums (gold) converge to $x$ and the energy fills $\|x\|^2$; drop the constant, the sines or the cosines and the sums converge only to the projection $Px$ (green dashed). The red residual $x-Px$ is a nonzero vector orthogonal to every member — a witness that (i), (ii), (iii) all fail together.`,
      deps: ['rca-4.17', 'rca-4.11a'],
      see: ['pma-8.16'],
      tags: ['orthonormal basis', 'Parseval'],
      viz(v) {
        const M = v.M;
        const NG = 2048, TAU = M.TAU;
        const grid = M.range(NG).map((i) => -Math.PI + TAU * (i + 0.5) / NG);
        const FX = {
          bump: { label: 'bump', f: (t) => Math.exp(-2.5 * (t - 1) ** 2) },
          step: { label: '$\\chi_{[-0.5,2]}$', f: (t) => (t >= -0.5 && t <= 2 ? 1 : 0) },
          exp: { label: '$e^{t/2}$', f: (t) => Math.exp(t / 2) },
        };
        const SETS = {
          all: { label: 'all', cst: true, cos: true, sin: true },
          nocst: { label: 'no constant', cst: false, cos: true, sin: true },
          even: { label: '$1$ and cosines', cst: true, cos: true, sin: false },
          odd: { label: 'sines only', cst: false, cos: false, sin: true },
        };
        const NMAX = 400;
        const cache = {};
        const getX = (key) => {
          if (cache[key]) return cache[key];
          const xs = grid.map(FX[key].f);
          const a = [], b = [];
          for (let n = 0; n <= NMAX; n++) {
            let sa = 0, sb = 0;
            for (let i = 0; i < NG; i++) { sa += xs[i] * Math.cos(n * grid[i]); sb += xs[i] * Math.sin(n * grid[i]); }
            a.push((n ? Math.SQRT2 : 1) * sa / NG); b.push(n ? Math.SQRT2 * sb / NG : 0);
          }
          const nx = xs.reduce((s, x) => s + x * x, 0) / NG;
          return (cache[key] = { xs, a, b, nx, xe: grid.map((t, i) => (xs[i] + xs[NG - 1 - i]) / 2) });
        };
        const set = v.select('orthonormal set', Object.entries(SETS).map(([value, S]) => ({ value, label: S.label })), 'odd');
        const which = v.select('$x$', Object.entries(FX).map(([value, F]) => ({ value, label: F.label })), 'step');
        const NN = v.slider('$N$', 0, 40, 7, { int: true });
        const T = v.stage({ x: [-Math.PI, Math.PI], y: [-0.6, 1.4], height: 290, full: true, axes: 'box', yticks: [0], xticks: [[-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2']], title: '$x$, partial sums over the chosen family, and the residual' });
        const B = v.stage({ x: [-0.8, 40.8], y: [0, 1], height: 190, full: true, axes: 'box', yticks: [], xticks: [0, 10, 20, 30, 40], title: 'energy captured: $\\sum_{n\\le N}|\\hat x(\\alpha)|^2$ over the family' });
        let st = {};
        v.render(() => {
          const S = SETS[set.value], X = getX(which.value), N = NN.value;
          const w = (n, kind) => (kind === 'c' ? (n === 0 ? S.cst : S.cos) : S.sin);
          // energy in each frequency for the family
          const en = M.range(NMAX + 1).map((n) => (w(n, 'c') ? X.a[n] ** 2 : 0) + (n > 0 && w(n, 's') ? X.b[n] ** 2 : 0));
          const cum = []; en.reduce((acc, e) => { cum.push(acc + e); return acc + e; }, 0);
          // projection onto the closed span: x, x - mean, even part, odd part
          const mean = X.a[0];
          const Px = grid.map((t, i) => { const x = X.xs[i], e = X.xe[i]; return set.value === 'all' ? x : set.value === 'nocst' ? x - mean : set.value === 'even' ? e : x - e; });
          const r = X.xs.map((x, i) => x - Px[i]);
          const sN = grid.map((t) => {
            let s = 0;
            for (let n = 0; n <= N; n++) { if (w(n, 'c')) s += X.a[n] * (n ? Math.SQRT2 * Math.cos(n * t) : 1); if (n > 0 && w(n, 's')) s += X.b[n] * Math.SQRT2 * Math.sin(n * t); }
            return s;
          });
          const all = [...X.xs, ...Px, ...r, ...sN], lo = Math.min(0, ...all), hi = Math.max(...all), pad = 0.1 * (hi - lo);
          T.setView(null, [lo - pad, hi + pad]);
          T.line(-4, 0, 4, 0, { color: 'faint', width: 1 });
          const pts = (arr) => grid.map((t, i) => (i % 4 ? null : [t, arr[i]])).filter(Boolean);
          const rn = Math.sqrt(r.reduce((s, x) => s + x * x, 0) / NG);
          if (rn > 1e-6) T.path(pts(r).concat([[Math.PI, 0], [-Math.PI, 0]]), { fill: 'red', fillAlpha: 0.1, stroke: false, close: true });
          T.path(pts(X.xs), { color: 'ink', width: 2.4 });
          T.path(pts(Px), { color: 'green', width: 2, dash: [6, 4] });
          T.path(pts(sN), { color: 'gold', width: 2.2 });
          if (rn > 1e-6) T.path(pts(r), { color: 'red', width: 2 });
          T.corner(rn > 1e-6 ? 'not maximal: x − Px ≠ 0 is orthogonal to the whole family' : 'complete family: partial sums → x', 'tl', { color: rn > 1e-6 ? 'red' : 'green', weight: 600 });
          // bars
          B.setView(null, [-0.1 * X.nx, X.nx * 1.2]);
          B.bars(cum.slice(0, 41), { x0: 0, barWidth: 0.7, color: (val, n) => (n <= N ? 'gold' : 'faint') });
          B.line(-0.8, X.nx, 40.8, X.nx, { color: 'ink', width: 2 });
          B.tex('\\|x\\|^2', 40.5, X.nx, { align: 'right', baseline: 'bottom', dy: -2, size: 13 });
          const nP = X.nx - rn * rn;
          if (rn > 1e-6) { B.line(-0.8, nP, 40.8, nP, { color: 'green', width: 1.6, dash: [6, 4] }); B.tex('\\|Px\\|^2', 40.5, nP, { color: 'green', align: 'right', baseline: 'top', dy: 3, size: 13 }); }
          // orthogonality check of the residual against the family (n ≤ 60)
          let worst = 0;
          if (rn > 1e-6) for (let n = 0; n <= 60; n++) {
            let sa = 0, sb = 0;
            for (let i = 0; i < NG; i++) { sa += r[i] * Math.cos(n * grid[i]); sb += r[i] * Math.sin(n * grid[i]); }
            if (w(n, 'c')) worst = Math.max(worst, Math.abs(sa / NG) * (n ? Math.SQRT2 : 1));
            if (n > 0 && w(n, 's')) worst = Math.max(worst, Math.abs(Math.SQRT2 * sb / NG));
          }
          const eN = Math.sqrt(X.xs.reduce((s, x, i) => s + (x - sN[i]) ** 2, 0) / NG);
          v.legend([['ink', '$x$'], ['gold', `partial sum $s_N$`], ['green', '$Px$ (limit of $s_N$)', { dash: true }], ['red', 'residual $x-Px$']]);
          st = { rn, worst, cumN: cum[N], cumAll: cum[NMAX], nx: X.nx, eN, N };
        });
        v.readout(() => {
          const q = st; if (q.nx == null) return '';
          const ok = q.rn < 1e-6;
          return `$\\|x-s_N\\|_2 = ${v.fix(q.eN, 4)}$ $\\to \\|x-Px\\|_2 = ${v.fix(q.rn, 4)}$; $\\;\\sum_{n\\le ${q.N}} = ${v.fix(q.cumN, 4)}$, $\\sum_{n\\le 400} = ${v.fix(q.cumAll, 4)}$ versus $\\|x\\|^2 = ${v.fix(q.nx, 4)}$. ` +
            (ok ? 'Parseval holds (up to the tail beyond $n=400$): the family is complete.' : `The residual has $\\max_{n\\le60}|(x-Px,u_\\alpha)| = ${sci(q.worst)}$ — it is orthogonal to the family, so the family is not maximal and (iii) fails by $\\|x-Px\\|^2 = ${v.fix(q.rn * q.rn, 4)}$.`);
        });
      },
    },

    // ------------------------------------------------------------------ 4.19
    {
      num: '4.19',
      kind: 'Definition',
      name: 'Hilbert space isomorphisms; H ≅ ℓ²(A)',
      statement: String.raw`Hilbert spaces $H_1$ and $H_2$ are *isomorphic* if there is a one-to-one linear map $\Lambda$ of $H_1$ onto $H_2$ that preserves inner products: $(\Lambda x,\Lambda y)=(x,y)$ for all $x,y\in H_1$. Such a $\Lambda$ is a Hilbert space isomorphism. By 4.17 and 4.18, if $\{u_\alpha:\alpha\in A\}$ is a maximal orthonormal set in $H$, then $x\mapsto\hat x$ is a Hilbert space isomorphism of $H$ onto $\ell^2(A)$.`,
      idea: String.raw`Under (ii) of 4.18 the closure $\overline P$ is all of $H$, so 4.17 makes $x\mapsto\hat x$ an isometry of $H$ onto $\ell^2(A)$, and Parseval (iv) says it preserves inner products. Together with 4.22 (maximal orthonormal sets exist) this shows every Hilbert space is, up to isomorphism, an $\ell^2(A)$; the cardinality of $A$ is the only invariant.`,
      deps: ['rca-4.17', 'rca-4.18'],
      see: ['rca-9.13'],
      verify: true,
      tags: ['isomorphism', 'Hilbert space'],
    },

    // ------------------------------------------------------------------ 4.20
    {
      num: '4.20',
      kind: 'Definition',
      name: 'Partially and totally ordered sets',
      statement: String.raw`A set $\mathscr P$ is *partially ordered* by a binary relation $\le$ if for all $a,b,c\in\mathscr P$:
(a) $a\le b$ and $b\le c$ imply $a\le c$;
(b) $a\le a$;
(c) $a\le b$ and $b\le a$ imply $a=b$.
A subset $\mathscr Q\subset\mathscr P$ is *totally ordered* if every pair $a,b\in\mathscr Q$ satisfies $a\le b$ or $b\le a$. A totally ordered subset is *maximal* if no element can be added to it without destroying total order. The typical example: a collection of sets ordered by inclusion.`,
      idea: String.raw`In 4.22 the partially ordered set is the family of orthonormal sets containing a given one, ordered by inclusion; a totally ordered subfamily is a chain whose union is again orthonormal. The Hausdorff maximality theorem (4.21) produces maximal chains.`,
      deps: [],
      tags: ['order', 'set theory'],
    },
  ],
};
