// Rudin, Functional Analysis — Chapter 4 (part 4): Riesz–Schauder theory of compact operators, 4.22–4.25

// ---------------------------------------------------------------- shared helpers
const PI = Math.PI;
const sub = (n) => String(n).split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join('');
const pn = (x, p) => (p === Infinity ? Math.max(Math.abs(x[0]), Math.abs(x[1])) : p === 1 ? Math.abs(x[0]) + Math.abs(x[1]) : Math.pow(Math.abs(x[0]) ** p + Math.abs(x[1]) ** p, 1 / p));
function sphere(p, n = 720) {
  const out = [];
  for (let i = 0; i < n; i++) { const t = 2 * PI * i / n, c = Math.cos(t), s = Math.sin(t), r = 1 / pn([c, s], p); out.push([r * c, r * s]); }
  return out;
}
function convexMin(F, a, b, it = 90) {
  for (let i = 0; i < it; i++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (F(m1) > F(m2)) a = m1; else b = m2; }
  const t = (a + b) / 2; return [t, F(t)];
}
/** Root of an increasing/decreasing sign change of F on [a, b] by bisection. */
function bisect(F, a, b, it = 60) { let fa = F(a); for (let i = 0; i < it; i++) { const m = (a + b) / 2, fm = F(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }

/** Eigen-decomposition of a symmetric tridiagonal matrix (diag d, off-diag e) by Sturm bisection + inverse iteration. */
function tridiagEig(d, e) {
  const n = d.length;
  const count = (x) => { let c = 0, q = d[0] - x; if (q < 0) c++; for (let i = 1; i < n; i++) { q = d[i] - x - e[i - 1] ** 2 / (q === 0 ? 1e-300 : q); if (q < 0) c++; } return c; };
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < n; i++) { const r = (i > 0 ? Math.abs(e[i - 1]) : 0) + (i < n - 1 ? Math.abs(e[i]) : 0); lo = Math.min(lo, d[i] - r); hi = Math.max(hi, d[i] + r); }
  const vals = [];
  for (let k = 0; k < n; k++) { let a = lo, b = hi; for (let it = 0; it < 80; it++) { const m = (a + b) / 2; if (count(m) > k) b = m; else a = m; } vals.push((a + b) / 2); }
  const vecs = vals.map((lam) => {
    const sh = lam + 1e-10 * Math.max(1, Math.abs(lam));
    let x = new Float64Array(n).fill(1).map((_, i) => 1 + 0.01 * Math.sin(i + 1));
    for (let it = 0; it < 3; it++) {
      // solve (T − sh I) y = x  (Thomas)
      const c = new Float64Array(n), y = new Float64Array(n);
      let b0 = d[0] - sh; c[0] = (n > 1 ? e[0] : 0) / b0; y[0] = x[0] / b0;
      for (let i = 1; i < n; i++) { const bi = d[i] - sh - e[i - 1] * c[i - 1]; c[i] = i < n - 1 ? e[i] / bi : 0; y[i] = (x[i] - e[i - 1] * y[i - 1]) / bi; }
      for (let i = n - 2; i >= 0; i--) y[i] -= c[i] * y[i + 1];
      let nr = 0; for (let i = 0; i < n; i++) nr += y[i] * y[i]; nr = Math.sqrt(nr);
      x = y.map((t) => t / nr);
    }
    return x;
  });
  return { vals, vecs };
}

export default {
  collection: 'fa',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.22
    {
      num: '4.22',
      kind: 'Lemma',
      name: 'Almost-orthogonal vectors (Riesz)',
      credit: 'F. Riesz',
      statement: String.raw`Let $M$ be a subspace of a normed space $X$ that is not dense in $X$, and let $r>1$. Then there is an $x\in X$ with $\|x\|<r$ and $\|x-y\|\ge1$ for every $y\in M$.`,
      idea: String.raw`Pick $x_0\notin\overline M$. Because this point lies outside the closure, $d=\operatorname{dist}(x_0,M)>0$, so some $y_0\in M$ has $\|x_0-y_0\|<rd$. Put $x=(x_0-y_0)/d$. Then $\|x\|<r$, and for $y\in M$, $\|x-y\|=\|x_0-(y_0+dy)\|/d\ge d/d=1$. The slack $r>1$ is needed because the distance from $x_0$ to $M$ need not be attained in infinite dimensions. This replaces orthogonal complements in the compactness arguments of 4.24.`,
      caption: String.raw`$X=(\R^2,\|\cdot\|_p)$ and $M$ a line. Drag $x_0$. Right: the distance $t\mapsto\|x_0-tu\|$ along $M$, its minimum $d$, and the window where it is below $rd$ (orange); the slider picks $y_0$ in that window. Left: the rescaled $x=(x_0-y_0)/d$ lands inside the ball $rB$ (green) but outside the red strip $\{\operatorname{dist}(\cdot,M)<1\}$. Push $r$ down to $1$ — the window shrinks to the nearest points (for $p=1,\infty$ there may be a whole segment of them).`,
      deps: ['fa-1.2'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §4.22, pp. 106'],
      tags: ['Riesz lemma', 'normed spaces'],
      viz(v) {
        const pS = v.select('$p=$', [{ value: 1, label: '$1$' }, { value: 2, label: '$2$' }, { value: Infinity, label: '$\\infty$' }], Infinity);
        const rS = v.slider('$r$', 1, 2.5, 1.5, { step: 0.01 });
        const cS = v.slider('choice of $y_0$ in the window', -1, 1, 0.55, { step: 0.01 });
        const L = v.stage({ x: [-2.7, 2.7], y: [-2.1, 2.1], equal: true, height: 340, ticks: false, title: '$X=(\\R^2,\\|\\cdot\\|_p)$' });
        const R = v.stage({ x: [-3.2, 3.2], y: [-0.15, 3.6], height: 340, axes: 'box', xticks: [-2, -1, 0, 1, 2], yticks: [1, 2, 3], title: 'distance from $x_0$ to the point $tu$ of $M$, against $t$' });
        const x0h = L.handle(0.55, 1.45, { color: 'gold', label: 'x₀' });
        const th = 0.38, d = [Math.cos(th), Math.sin(th)], nrm = [-d[1], d[0]];
        let st = {};
        v.render(() => {
          const p = pS.value, r = rS.value, x0 = [x0h.x, x0h.y];
          const phi = (t) => pn([x0[0] - t * d[0], x0[1] - t * d[1]], p);
          const [tm, dd] = convexMin(phi, -12, 12);
          if (dd < 1e-6) { L.corner('x₀ ∈ M — pick a point off M', 'tl', { color: 'red', weight: 600 }); }
          // window {t : φ(t) < r d}: find its ends (with ties for p = 1, ∞ the minimum set is a segment)
          const lev = r * dd + 1e-12;
          const t1 = phi(tm - 20) > lev ? bisect((t) => phi(t) - lev, tm - 20, tm) : tm - 20;
          const t2 = phi(tm + 20) > lev ? bisect((t) => phi(t) - lev, tm, tm + 20) : tm + 20;
          const ts = t1 + (t2 - t1) * (0.5 + 0.49 * cS.value), y0 = [ts * d[0], ts * d[1]];
          const x = dd > 1e-6 ? [(x0[0] - y0[0]) / dd, (x0[1] - y0[1]) / dd] : [0, 0];
          const [, dx] = convexMin((t) => pn([x[0] - t * d[0], x[1] - t * d[1]], p), -12, 12);
          // ---- left
          const strip = [];
          for (const b of sphere(p, 240)) { strip.push([b[0] + 9 * d[0], b[1] + 9 * d[1]]); strip.push([b[0] - 9 * d[0], b[1] - 9 * d[1]]); }
          L.poly(v.M.hull(strip), { fill: 'red', fillAlpha: 0.1, stroke: false });
          L.poly(sphere(p, 360).map(([a, b]) => [r * a, r * b]), { fill: 'green', fillAlpha: 0.12, color: 'green', width: 2 });
          L.poly(sphere(p, 360), { color: 'muted', width: 1, dash: [4, 4] });
          L.line(-6 * d[0], -6 * d[1], 6 * d[0], 6 * d[1], { color: 'teal', width: 2.4 });
          L.tex('M', 2.35 * d[0] - 0.2 * nrm[0], 2.35 * d[1] - 0.2 * nrm[1], { color: 'teal', size: 16 });
          L.line(t1 * d[0], t1 * d[1], t2 * d[0], t2 * d[1], { color: 'orange', width: 6, alpha: 0.6 });
          L.line(x0[0], x0[1], y0[0], y0[1], { color: 'orange', width: 1.4, dash: [4, 3] });
          L.dot(y0[0], y0[1], { color: 'orange', r: 5, label: 'y₀', labelPos: 'se' });
          L.arrow(0, 0, x[0], x[1], { color: 'accent', width: 2.4, head: 9 });
          L.dot(x[0], x[1], { color: 'accent', r: 5, label: 'x', labelPos: 'ne' });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          // ---- right
          R.vband(t1, t2, { color: 'orange', alpha: 0.14 });
          R.fn(phi, { color: 'ink', width: 2.2, domain: [-3.2, 3.2] });
          R.hline(dd, { color: 'blue', width: 1.4, dash: [5, 4] });
          R.hline(lev, { color: 'orange', width: 1.4, dash: [5, 4] });
          R.text('d', 3.1, dd, { color: 'blue', math: true, align: 'right', baseline: 'bottom', dy: -3 });
          R.text('r d', 3.1, lev, { color: 'orange', math: true, align: 'right', baseline: 'bottom', dy: -3 });
          R.dot(ts, phi(ts), { color: 'orange', r: 5.5 });
          R.dot(tm, dd, { color: 'blue', r: 4 });
          st = { dd, ny: phi(ts), nx: pn(x, p), dx, r };
        });
        v.legend([['teal', 'the subspace $M$'], ['red', '$\\{z:\\operatorname{dist}(z,M)<1\\}$', { area: true }], ['green', 'the ball $rB$', { area: true }], ['orange', 'admissible $y_0$: $\\|x_0-y_0\\|<rd$'], ['accent', '$x=(x_0-y_0)/d$']]);
        v.readout(() => {
          const s = st;
          if (s.dd < 1e-6) return 'Move $x_0$ off $M$.';
          if (s.r <= 1) return 'The lemma requires $r>1$: at $r=1$, $\\|x\\|<1$ is incompatible with $\\operatorname{dist}(x,M)\\ge1$.';
          return `$d=\\operatorname{dist}(x_0,M) = ${v.fix(s.dd, 3)}$, $\\;\\|x_0-y_0\\| = ${v.fix(s.ny, 3)} < rd = ${v.fix(s.r * s.dd, 3)}$. Hence $\\|x\\| = ${v.fix(s.nx, 3)} < r = ${v.fix(s.r, 2)}$ and $\\operatorname{dist}(x,M) = ${v.fix(s.dx, 3)}\\ge1$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.23
    {
      num: '4.23',
      kind: 'Theorem',
      name: 'For λ ≠ 0 the range of T − λI is closed',
      statement: String.raw`Let $X$ be a Banach space, $T\in\mathscr B(X)$ compact, and $\lambda\ne0$. Then $\mathscr R(T-\lambda I)$ is closed in $X$.`,
      idea: String.raw`$\mathscr N(T-\lambda I)$ is finite-dimensional (4.18(d)), so it has a closed complement $W$ (4.21(a)): $X=\mathscr N(T-\lambda I)\oplus W$, and $S=(T-\lambda I)|_W$ is one-to-one with the same range. It suffices that $\|Sx\|\ge c\|x\|$ on $W$ for some $c>0$. If not, there are unit vectors $x_n\in W$ with $Tx_n-\lambda x_n\to0$; compactness gives a subsequence with $Tx_n\to y$, hence $x_n\to y/\lambda$, a unit vector of $W$ killed by $T-\lambda I$ — impossible. The argument breaks down only at $\lambda=0$.`,
      caption: String.raw`$T=\operatorname{diag}(t_n)$ on $\ell^2$ with real $t_n\to0$ (alternating signs). Drag $\lambda$ along the axis on the right (it snaps to the eigenvalues and to $0$). Left: the diagonal $|t_n-\lambda|$ of $T-\lambda I$; zero entries (red) form the kernel, and the infimum $\gamma$ of the nonzero entries is the lower bound $c$ of the proof. Right: $\gamma$ as a function of $\lambda$ (log scale, eigenvalues marked in red). It dips towards $0$ next to each eigenvalue, but at the eigenvalue itself the zero entry belongs to the kernel and is excluded (hollow dots), so $\gamma(\lambda)>0$ for every $\lambda\ne0$. Only at $\lambda=0$ is $\gamma=0$: there infinitely many entries $t_n$ tend to $0$, and $\mathscr R(T)$ is dense but not closed.`,
      deps: ['fa-4.18', 'fa-4.21', 'fa-4.16', 'fa-1.26'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §4.23, pp. 107'],
      tags: ['compact operators', 'closed range'],
      viz(v) {
        const t = (n) => 0.92 * (n % 2 ? 1 : -0.78) / Math.pow(n, 0.75);
        const NB = 40, NG = 4000;
        const TS = []; for (let n = 1; n <= NG; n++) TS.push(t(n));
        const L = v.stage({ x: [-2.2, NB + 1], y: [-0.06, 1.95], height: 320, axes: 'box', xticks: [1, 10, 20, 30, 40], title: 'diagonal of $T-\\lambda I$: $|t_n-\\lambda|$' });
        const R = v.stage({ x: [-1.05, 1.05], y: [-4.3, 0.55], height: 320, axes: 'box', xticks: [-1, -0.5, 0, 0.5, 1], yticks: [[-4, '10⁻⁴'], [-3, '10⁻³'], [-2, '0.01'], [-1, '0.1'], [0, '1']], title: '$\\gamma(\\lambda)=\\inf\\{|t_n-\\lambda|: t_n\\ne\\lambda\\}$ (log scale)' });
        const snaps = [0].concat(TS.slice(0, 30));
        const lh = R.handle(0.32, -4.05, { color: 'gold', label: 'λ', constrain: (x) => { for (const z of snaps) if (Math.abs(x - z) < 0.018) return [z, -4.05]; return [x, -4.05]; } });
        const gamma = (lam) => { let g = Infinity; for (const z of TS) { const dd = Math.abs(z - lam); if (dd > 1e-12 && dd < g) g = dd; } return Math.min(g, Math.abs(lam) < 1e-12 ? 0 : g); };
        const LG = (g) => Math.log10(Math.max(g, 1e-4));
        const curve = []; for (let i = 0; i <= 1600; i++) { const lam = -1.02 + 2.04 * i / 1600; curve.push([lam, LG(gamma(lam))]); }
        let st = {};
        v.render(() => {
          const lam = lh.x;
          let g = gamma(lam), alpha = 0, top = 0;
          for (let n = 1; n <= NB; n++) {
            const dd = Math.abs(t(n) - lam); top = Math.max(top, dd);
            if (dd < 1e-12) { alpha++; L.dot(n, 0, { color: 'red', r: 5 }); continue; }
            L.rect(n - 0.36, 0, n + 0.36, dd, { fill: 'blue', fillAlpha: 0.55, stroke: false });
          }
          L.setView(null, [-0.06 * top, top * 1.15]);
          L.hline(Math.abs(lam), { color: 'muted', width: 1, dash: [3, 3] });
          L.hline(g, { color: g > 1e-9 ? 'green' : 'red', width: 2, dash: [6, 4] });
          L.corner(g > 1e-9 ? `γ = ${v.fmt(g, 3)} > 0` : 'γ = 0', 'tr', { color: g > 1e-9 ? 'green' : 'red', weight: 600 });
          // right: γ curve and eigenvalues
          R.path(curve, { color: 'green', width: 1.6 });
          for (let n = 1; n <= 30; n++) R.line(TS[n - 1], -4.3, TS[n - 1], -3.85, { color: 'red', width: 1.2 });
          for (let n = 1; n <= 12; n++) R.dot(TS[n - 1], LG(gamma(TS[n - 1])), { color: 'red', r: 3.5, hollow: true, width: 1.6 });
          R.dot(0, -4, { color: 'red', r: 5 }); R.corner('red dot: γ(0) = 0, so 𝓡(T) is not closed', 'tl', { color: 'red', weight: 600, size: 11.5 });
          R.line(lam, -4.05, lam, LG(g), { color: 'gold', width: 1.4, dash: [3, 3] });
          R.dot(lam, LG(g), { color: g > 1e-9 ? 'green' : 'red', r: 5 });
          st = { lam, g, alpha };
        });
        v.legend([['blue', 'entries $|t_n-\\lambda|\\ne0$', { area: true }], ['red', 'zero entries = kernel; eigenvalues $t_n$', { dot: true }], ['green', 'lower bound $\\gamma$ on a complement of the kernel']]);
        v.readout(() => {
          const s = st;
          if (Math.abs(s.lam) < 1e-12) return '$\\lambda=0$: $T$ is one-to-one but $\\gamma=\\inf|t_n|=0$, so $\\mathscr R(T)$ is not closed — the lemma needs $\\lambda\\ne0$.';
          return `$\\lambda = ${v.fix(s.lam, 3)}$: $\\;\\dim\\mathscr N(T-\\lambda I) = ${s.alpha}$, $\\;\\|(T-\\lambda I)x\\|\\ge${v.fix(s.g, 3)}\\,\\|x\\|$ on the complement of the kernel, so $\\mathscr R(T-\\lambda I)$ is closed` + (s.alpha ? ' (here a proper closed subspace).' : ' (here all of $\\ell^2$).');
        });
      },
    },
    // ------------------------------------------------------------------ 4.24
    {
      num: '4.24',
      kind: 'Theorem',
      name: 'Eigenvalues outside any disc about 0 are finite in number',
      statement: String.raw`Let $X$ be a Banach space, $T\in\mathscr B(X)$ compact, $r>0$, and let $E$ be a set of eigenvalues $\lambda$ of $T$ with $|\lambda|>r$. Then
(a) $\mathscr R(T-\lambda I)\ne X$ for every $\lambda\in E$, and
(b) $E$ is finite.`,
      idea: String.raw`Both parts come from one obstruction: there is no chain of closed subspaces $M_1\subsetneq M_2\subsetneq\cdots$ with $(T-\lambda_nI)M_n\subset M_{n-1}$ and $|\lambda_n|>r$. Otherwise 4.22 gives $y_n\in M_n$ with $\|y_n\|\le2$ and $\operatorname{dist}(y_n,M_{n-1})\ge1$, and for $m<n$, $Ty_n-Ty_m=\lambda_ny_n-z$ with $z\in M_{n-1}$, so $\|Ty_n-Ty_m\|\ge|\lambda_n|>r$ — no convergent subsequence, contradicting compactness. For (b) take $M_n$ spanned by eigenvectors of $n$ distinct $\lambda_i\in E$; for (a), if $T-\lambda I$ were onto with nonzero kernel, $M_n=\mathscr N((T-\lambda I)^n)$ would increase strictly.`,
      caption: String.raw`A compact, non-normal operator on $\ell^2$: upper triangular with diagonal $\mu_n=0.95\cdot0.86^{\,n-1}e^{2.4in}$ and geometrically decaying entries above it, so its eigenvalues are exactly the $\mu_n$, spiralling into $0$. Shrink the circle $|\lambda|=r$: outside it there are always finitely many (red). Right: the proof, computed on a $50\times50$ section — orthonormalising the eigenvectors of the red $\lambda_n$ gives $y_n$ with $\operatorname{dist}(y_n,M_{n-1})=1$, and every pair $m<n$ satisfies $\|Ty_n-Ty_m\|\ge|\lambda_n|$ (all dots above the diagonal).`,
      deps: ['fa-4.22', 'fa-4.16', 'fa-4.17'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §4.24, pp. 107–108'],
      tags: ['spectral theory', 'compact operators', 'eigenvalues'],
      viz(v) {
        const { Cx } = v.M;
        const rS = v.slider('$r$', 0.04, 0.9, 0.3, { step: 0.005 });
        const N = 50;
        const mu = []; for (let n = 1; n <= N; n++) mu.push(Cx.polar(0.95 * Math.pow(0.86, n - 1), 2.4 * n));
        const Tm = (j, k) => (k === j ? mu[j] : k > j ? Cx.polar(0.35 * Math.pow(0.7, k - j), 0.9 * (j + 2 * k)) : new Cx(0, 0));
        // eigenvectors by back-substitution: (T − μ_k)x = 0, x_k = 1, x_j = 0 for j > k
        const EV = mu.map((m, k) => {
          const x = Array.from({ length: N }, () => new Cx(0, 0)); x[k] = new Cx(1, 0);
          for (let j = k - 1; j >= 0; j--) { let s = new Cx(0, 0); for (let l = j + 1; l <= k; l++) s = s.add(Tm(j, l).mul(x[l])); x[j] = s.neg().div(mu[j].sub(m)); }
          return x;
        });
        const applyT = (x) => { const y = []; for (let j = 0; j < N; j++) { let s = new Cx(0, 0); for (let k = j; k < N; k++) s = s.add(Tm(j, k).mul(x[k])); y.push(s); } return y; };
        const nrm = (x) => Math.sqrt(x.reduce((s, z) => s + z.abs2(), 0));
        const ip = (x, y) => x.reduce((s, z, i) => s.add(z.mul(y[i].conj())), new Cx(0, 0));
        // orthonormalise in index order once; y_n ∈ M_n, y_n ⟂ M_{n−1}
        const Y = [], TY = [];
        for (let k = 0; k < 18; k++) {
          let w = EV[k].map((z) => new Cx(z.re, z.im));
          for (const q of Y) { const c = ip(w, q); w = w.map((z, i) => z.sub(c.mul(q[i]))); }
          const nn = nrm(w); w = w.map((z) => z.scale(1 / nn)); Y.push(w); TY.push(applyT(w));
        }
        const P = v.stage({ x: [-1.1, 1.1], y: [-1.05, 1.05], equal: true, height: 340, ticks: false, title: 'eigenvalues $\\mu_n$ in $\\C$ and the circle $|\\lambda|=r$' });
        const S = v.stage({ x: [0, 1.0], y: [0, 2.0], height: 340, axes: 'box', xlabel: '|λₙ|', title: 'pairs $m<n$ in $E$: $\\|Ty_n-Ty_m\\|$ against $|\\lambda_n|$' });
        let st = {};
        v.render(() => {
          const r = rS.value;
          P.circle(0, 0, r, { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.08 });
          P.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          let K = 0;
          for (let n = 0; n < N; n++) { const out = mu[n].abs() > r; if (out) K++; P.dot(mu[n].re, mu[n].im, { color: out ? 'red' : 'gray', r: out ? 4.5 : 2.6 }); }
          for (let n = 0; n < Math.min(K, 6); n++) P.text(`μ${sub(n + 1)}`, mu[n].re, mu[n].im, { color: 'red', size: 11, dx: 7, dy: -8 });
          P.dot(0, 0, { color: 'ink', r: 2.5, hollow: true });
          P.corner(`${K} eigenvalue${K === 1 ? '' : 's'} with |λ| > r`, 'tl', { color: 'red', weight: 600 });
          // pairs
          const KK = Math.min(K, 18);
          let ymax = 1.0, minRatio = Infinity, cnt = 0;
          const pts = [];
          for (let n = 1; n < KK; n++) for (let m = 0; m < n; m++) {
            const dd = nrm(TY[n].map((z, i) => z.sub(TY[m][i]))), a = mu[n].abs();
            pts.push([a, dd]); ymax = Math.max(ymax, dd); minRatio = Math.min(minRatio, dd / a); cnt++;
          }
          S.setView([0, 1.0], [0, ymax * 1.12]);
          S.line(0, 0, 1, 1, { color: 'muted', width: 1.4, dash: [5, 4] });
          S.vline(r, { color: 'orange', width: 1.4, dash: [4, 4] });
          S.text('‖Tyₙ − Tyₘ‖ = |λₙ|', 0.97, 0.97, { align: 'right', baseline: 'top', dy: 6, color: 'muted', size: 11 });
          for (const p of pts) S.dot(p[0], p[1], { color: 'red', r: 3.2, alpha: 0.8 });
          st = { K, cnt, minRatio, r };
        });
        v.legend([['red', 'eigenvalues in $E$ / pairs $(m,n)$', { dot: true }], ['gray', 'eigenvalues with $|\\lambda|\\le r$', { dot: true }], ['orange', 'the circle $|\\lambda|=r$']]);
        v.readout(() => {
          const s = st;
          const pr = s.cnt ? `$\\min_{m<n}\\|Ty_n-Ty_m\\|/|\\lambda_n| = ${v.fix(s.minRatio, 3)}\\ge1$ over ${s.cnt} pairs` : 'fewer than two eigenvalues outside the circle';
          return `$|E| = ${s.K}$ for $r=${v.fix(s.r, 3)}$; ${pr}. An infinite $E$ would give a bounded sequence $\\{y_n\\}$ with $\\{Ty_n\\}$ $r$-separated.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.25
    {
      num: '4.25',
      kind: 'Theorem',
      name: 'Riesz–Schauder theory; the Fredholm alternative',
      credit: 'Fredholm, 1903',
      statement: String.raw`Let $X$ be a Banach space and $T\in\mathscr B(X)$ compact.
(a) If $\lambda\ne0$, the four numbers
$$\alpha=\dim\mathscr N(T-\lambda I),\quad \beta=\dim X/\mathscr R(T-\lambda I),\quad \alpha^*=\dim\mathscr N(T^*-\lambda I),\quad \beta^*=\dim X^*/\mathscr R(T^*-\lambda I)$$
are equal and finite.
(b) If $\lambda\ne0$ and $\lambda\in\sigma(T)$, then $\lambda$ is an eigenvalue of $T$ and of $T^*$.
(c) $\sigma(T)$ is compact, at most countable, and has at most one limit point, namely $0$.`,
      idea: String.raw`$\alpha<\infty$ by 4.18(d) and $\alpha^*<\infty$ because $T^*$ is compact (4.19). The range $\mathscr R(T-\lambda I)$ is closed (4.23), so by 4.12, 4.9 and the closed range theorem 4.14, $\beta=\alpha^*$ and $\beta^*=\alpha$. To get $\alpha=\beta$: if $\alpha<\beta$, add to $T$ a finite-rank map sending $\mathscr N(T-\lambda I)$ one-to-one but not onto a complement of the range (4.21); the new compact operator minus $\lambda I$ would be one-to-one but not onto, contradicting 4.24(a) applied to its adjoint; symmetrically $\beta<\alpha$ is impossible. (b) follows from $\alpha=\beta=\alpha^*$, and (c) from 4.24(b). In words — the **Fredholm alternative**: for $\lambda\ne0$, either $(T-\lambda I)x=y$ has exactly one solution for every $y$, or the homogeneous equation has nonzero solutions, and then $(T-\lambda I)x=y$ is solvable exactly when $y$ is annihilated by the (equally many) solutions of $T^*y^*=\lambda y^*$.`,
      caption: String.raw`$(Tf)(s)=\int_0^1(\min(s,t)-st)\,w(t)f(t)\,dt$ with weight $w(t)=1+3t$ on $L^2(0,1)$ — compact, and not symmetric: $T^*$ has eigenfunctions $w\,u_n$ instead of $u_n$ (computed on a $160$-point grid). Left: $\|f\|$ for the solution of $(T-\lambda I)f=g$ as $\lambda$ varies, against the eigenvalues $\lambda_n\to0$. Move $\lambda$ (it snaps to $\lambda_1,\lambda_2,\lambda_3$): off the spectrum the solution is unique; at $\lambda_k$ it exists iff $\langle g,wu_k\rangle=0$. Choose $g\perp wu_1$ and the spike at $\lambda_1$ disappears. Right: $g$, the solution $f$, and the eigenfunctions of $T$ and $T^*$ at the nearest eigenvalue.`,
      deps: ['fa-4.18', 'fa-4.19', 'fa-4.23', 'fa-4.24', 'fa-4.14', 'fa-4.12', 'fa-4.9', 'fa-4.21'],
      tags: ['spectral theory', 'Fredholm alternative', 'compact operators'],
      viz(v) {
        const n = 160, h = 1 / (n + 1);
        const s = Array.from({ length: n }, (_, i) => (i + 1) * h);
        const w = s.map((t) => 1 + 3 * t), sw = w.map(Math.sqrt);
        // −u'' = k w u (Dirichlet), symmetrised: B = W^{-1/2} A W^{-1/2}
        const dg = s.map((_, i) => 2 / (h * h * w[i])), of = s.slice(0, n - 1).map((_, i) => -1 / (h * h * sw[i] * sw[i + 1]));
        const { vals, vecs } = tridiagEig(dg, of);
        const lam = vals.map((k) => 1 / k);                           // eigenvalues of T (descending)
        const U = vecs.map((vv) => Array.from(vv, (x, i) => x / sw[i]));       // eigenvectors of T:  u_n
        const Us = vecs.map((vv) => Array.from(vv, (x, i) => x * sw[i]));      // eigenvectors of T*: w u_n   (⟨u_n, w u_m⟩ = δ)
        const L2 = (f) => Math.sqrt(h * f.reduce((a, x) => a + x * x, 0));
        const sgn = (f) => { const i = f.reduce((b, x, j) => (Math.abs(x) > Math.abs(f[b]) ? j : b), 0); return f[i] < 0 ? -1 : 1; };
        const unitL2 = (f) => { const c = sgn(f) / L2(f); return f.map((x) => x * c); };
        const coeff = (g, k) => g.reduce((a, x, i) => a + x * Us[k][i], 0);
        const G0 = s.map(() => 1);
        const orth = (g, k) => { const c = coeff(g, k); return g.map((x, i) => x - c * U[k][i]); };
        const GS = {
          one: { label: '$g=1$', g: G0 },
          o1: { label: '$g\\perp wu_1$', g: orth(G0, 0) },
          o2: { label: '$g\\perp wu_2$', g: orth(G0.map((_, i) => Math.cos(3 * s[i])), 1) },
        };
        const gS = v.select('', Object.entries(GS).map(([value, o]) => ({ value, label: o.label })), 'one');
        const LO = lam[4] * 0.75, HI = lam[0] * 1.6, X0 = Math.log10(LO), X1 = Math.log10(HI);
        const lS = v.slider('$\\lambda$', LO, HI, Math.sqrt(lam[0] * lam[1]), { log: true, fmt: (x) => x.toFixed(4) });
        const TK = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5].filter((t) => t > LO && t < HI).map((t) => [Math.log10(t), String(t)]);
        const SP = v.stage({ x: [X0, X1], y: [-0.5, 4], height: 330, axes: 'box', xticks: TK, yticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']], title: '$\\|f\\|$ for $(T-\\lambda I)f=g$, against $\\lambda$ (log–log)' });
        const FN = v.stage({ x: [-0.02, 1.02], y: [-2.6, 2.6], height: 330, axes: true, xticks: [0, 0.5, 1], title: 'shapes (unit $L^2$ norm): $g$, $f$, $u_k$, $wu_k$' });
        const solve = (g, l, skip = -1) => { const f = new Float64Array(n); for (let k = 0; k < n; k++) { if (k === skip) continue; const c = coeff(g, k) / (lam[k] - l); for (let i = 0; i < n; i++) f[i] += c * U[k][i]; } return f; };
        const curves = {};
        for (const key of Object.keys(GS)) {
          const g = GS[key].g, cs = lam.map((_, k) => coeff(g, k)), pts = [];
          for (let i = 0; i <= 300; i++) {
            const x = X0 + (X1 - X0) * i / 300, l = 10 ** x;
            // ‖f‖² in L² is Σ_jk c_j c_k ⟨u_j,u_k⟩/((λ_j−l)(λ_k−l)); evaluate f directly on the grid
            const f = new Float64Array(n); for (let k = 0; k < n; k++) { const c = cs[k] / (lam[k] - l); if (Math.abs(c) < 1e-14) continue; for (let j = 0; j < n; j++) f[j] += c * U[k][j]; }
            pts.push([x, Math.log10(Math.max(1e-3, L2(f)))]);
          }
          curves[key] = pts;
        }
        let st = {};
        v.render(() => {
          const key = gS.value, g = GS[key].g;
          let l = lS.value, k0 = -1;
          for (let k = 0; k < 3; k++) if (Math.abs(Math.log(l / lam[k])) < 0.03) { l = lam[k]; k0 = k; }
          // nearest eigenvalue for display
          let kn = 0; for (let k = 0; k < 12; k++) if (Math.abs(Math.log(l / lam[k])) < Math.abs(Math.log(l / lam[kn]))) kn = k;
          // ---- left
          for (let k = 0; k < 40; k++) { const x = Math.log10(lam[k]); if (x > SP.bounds.x[0]) SP.vline(x, { color: 'red', width: k < 3 ? 1.6 : 1, alpha: k < 3 ? 0.7 : 0.35 }); }
          for (let k = 0; k < 4; k++) SP.text(`λ${sub(k + 1)}`, Math.log10(lam[k]), 3.85, { align: 'center', baseline: 'top', color: 'red', size: 11 });
          SP.path(curves[key], { color: 'blue', width: 2.2 });
          const ck = k0 >= 0 ? coeff(g, k0) : 0, solvable = k0 < 0 || Math.abs(ck) < 1e-8;
          let f = null;
          if (k0 < 0) f = solve(g, l);
          else if (solvable) f = solve(g, l, k0);
          const nf = f ? L2(f) : Infinity;
          SP.vline(Math.log10(l), { color: 'gold', width: 1.6, dash: [4, 3] });
          if (f) SP.dot(Math.log10(l), Math.log10(Math.max(1e-3, nf)), { color: 'gold', r: 6 });
          else SP.text('no solution', Math.log10(l), 3.3, { color: 'red', size: 12, weight: 600, align: 'center' });
          // ---- right
          const gN = L2(g);
          const uk = unitL2(U[kn]), usk = unitL2(Us[kn]);
          const fs = f ? Array.from(f).map((x) => x / nf) : null;
          const gs = g.map((x) => x / gN);
          const pts = (arr) => arr.map((x, i) => [s[i], x]), pts0 = (arr) => [[0, 0]].concat(pts(arr), [[1, 0]]);
          FN.path(pts0(uk), { color: 'red', width: 1.6, dash: [6, 4] });
          FN.path(pts0(usk), { color: 'purple', width: 1.6, dash: [2, 3] });
          FN.path(pts(gs), { color: 'gray', width: 2 });
          if (fs) FN.path(pts(fs), { color: 'blue', width: 2.6 });
          FN.corner(`eigenfunctions for λ${sub(kn + 1)} = ${v.fmt(lam[kn], 4)}`, 'tr', { color: 'muted', size: 11.5 });
          st = { l, k0, kn, ck: ck * Math.sqrt(h), solvable, nf, gN, lamk: lam[kn], c1: coeff(g, kn) * Math.sqrt(h) };
        });
        v.legend([['blue', 'solution $f$ / $\\|f\\|$'], ['gray', 'right-hand side $g$'], ['red', 'eigenfunction $u_k$ of $T$; eigenvalues', { dash: true }], ['purple', 'eigenfunction $wu_k$ of $T^*$', { dash: true }]]);
        v.readout(() => {
          const s2 = st;
          if (s2.k0 < 0) return `$\\lambda=${v.fix(s2.l, 4)}\\notin\\sigma(T)$: $\\alpha=\\beta=\\alpha^*=\\beta^*=0$, the solution is unique, $\\|f\\| = ${v.fix(s2.nf, 3)}$. Nearest eigenvalue $\\lambda_{${s2.kn + 1}}=${v.fix(s2.lamk, 4)}$, where $\\langle g,wu_{${s2.kn + 1}}\\rangle = ${v.fix(s2.c1, 4)}$.`;
          const kk = s2.k0 + 1;
          return `$\\lambda=\\lambda_{${kk}}$: $\\alpha=\\beta=\\alpha^*=\\beta^*=1$ ($\\mathscr N(T-\\lambda I)=\\operatorname{span}\\{u_{${kk}}\\}$, $\\mathscr N(T^*-\\lambda I)=\\operatorname{span}\\{wu_{${kk}}\\}$). $\\langle g,wu_{${kk}}\\rangle = ${v.fix(Math.abs(s2.ck) < 1e-8 ? 0 : s2.ck, 4)}$: ` + (s2.solvable ? `solvable, with solutions $f+c\\,u_{${kk}}$ ($\\|f\\| = ${v.fix(s2.nf, 3)}$).` : 'no solution — $g$ is not annihilated by the eigenvector of $T^*$.');
        });
      },
    },
  ],
};
