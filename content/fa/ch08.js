// Rudin, Functional Analysis — Chapter 8: Applications to Differential Equations
//
// Numbering checked against Google Books snippet view of the 2nd edition (1991); items still carry `verify: true`.
// In the visualisations, derivatives are written with d/dx; Rudin's D = −i d/dx appears only in 8.5.

const PSI_P = (() => {
  const add = (a, b) => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] || 0) + (b[i] || 0));
  const mul = (a, b) => { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; };
  const der = (a) => (a.length > 1 ? a.slice(1).map((c, i) => c * (i + 1)) : [0]);
  const s = [1, 0, -1], s2 = mul(s, s), P = [[1]];
  for (let k = 0; k < 4; k++) { const p = P[k]; P.push(add(add(mul(der(p), s2), mul(mul([0, 4 * k], s), p)), mul([0, -2], p))); }
  return P;
})();
function psiD(k, x) {
  const s = 1 - x * x; if (!(s > 0)) return 0;
  const c = PSI_P[k]; let p = 0; for (let i = c.length - 1; i >= 0; i--) p = p * x + c[i];
  return p * Math.exp(-1 / s - 2 * k * Math.log(s));
}
const E1 = Math.E;
const phiD = (k, x, c, r, A = 1) => A * E1 * psiD(k, (x - c) / r) / Math.pow(r, k);
function simpson(f, a, b, n) {
  if (!(b > a)) return 0;
  if (n % 2) n++;
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return s * h / 3;
}
function span(vals, minSpan = 1, pad = 0.15) {
  let lo = Infinity, hi = -Infinity;
  for (const y of vals) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (!isFinite(lo)) return [-1, 1];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}
// complex arithmetic on [re, im]
const C = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
  div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
  exp: (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; },
  abs: (a) => Math.hypot(a[0], a[1]),
  scale: (a, k) => [a[0] * k, a[1] * k],
  conj: (a) => [a[0], -a[1]],
};

export default {
  book: 'fa',
  chapter: 8,
  title: 'Applications to Differential Equations',
  summary: String.raw`A linear differential operator $P(D)$ with constant coefficients becomes multiplication by the polynomial $P$ under the Fourier transform. A fundamental solution — a distribution $E$ with $P(D)E=\delta$ — turns every equation $P(D)u=w$ with compactly supported $w$ into the formula $u=E*w$. The Malgrange–Ehrenpreis theorem says that fundamental solutions always exist: divide by $P$ on a contour that dodges its zeros, with a mean-value estimate for polynomials controlling the size. For elliptic operators, whose top-order symbol never vanishes off the origin, the division costs nothing at high frequencies, and every solution of $P(D)u=f$ is as smooth as $f$: elliptic regularity, with Weyl's lemma for the Laplacian as the prototype.`,
  items: [
    {
      num: '8.1',
      kind: 'Definition',
      name: 'Differential operators with constant coefficients; fundamental solutions',
      statement: String.raw`For a polynomial $P(\xi)=\sum_{|\alpha|\le N}c_\alpha\xi^\alpha$ in $n$ variables with complex coefficients, $P(D)=\sum c_\alpha D^\alpha$ (with $D_k=-i\,\partial/\partial x_k$) is a **linear differential operator with constant coefficients**, of order $N$ if some $c_\alpha\ne0$ with $|\alpha|=N$. A distribution $E\in\mathscr D'(\R^n)$ is a **fundamental solution** of $P(D)$ if
$$P(D)E=\delta .$$`,
      idea: String.raw`Under the Fourier transform $P(D)$ becomes multiplication by $P$, so a fundamental solution is "$\hat E=1/P$" — meaningful as it stands only when $P$ has no real zeros. Classical examples: $H$ for $d/dx$; $\frac1{2\pi}\log|x|$ for the Laplacian in $\R^2$; $-\frac{1}{4\pi|x|}$ for the Laplacian in $\R^3$; the heat kernel $H(t)\,(4\pi t)^{-1/2}e^{-x^2/4t}$ for $\partial_t-\partial_x^2$.`,
      caption: String.raw`$E=\frac1{2\pi}\log|x|$ in the plane, coloured, with its gradient field. That $\Delta E=\delta$ means: the flux of $\nabla E$ out of any closed curve is $1$ if the curve surrounds the origin and $0$ otherwise (Gauss). Drag the circle and change its radius: the readout integrates the flux numerically. It also checks the definition directly, $E(\Delta\varphi)=\varphi(0)$, for a radial bump $\varphi$ centred at the circle's centre.`,
      deps: ['fa-6.12', 'fa-6.7'],
      tags: ['differential equations', 'fundamental solutions'],
      verify: true,
      viz(v) {
        const M = v.M;
        const rS = v.slider('radius of the circle (and of $\\varphi$)', 0.2, 1.6, 0.9, { step: 0.01 });
        const S = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 400, axes: false, ticks: false, title: '$E=\\frac1{2\\pi}\\log|x|$ and $\\nabla E$' });
        const hc = S.handle(0.5, 0.3, { color: 'orange', label: 'c' });
        const E = (x, y) => Math.log(Math.hypot(x, y) + 1e-300) / (2 * Math.PI);
        let st = {};
        v.legend([['orange', 'circle $\\partial B(c,\\rho)$ and $\\varphi$\'s support'], ['ink', '$\\nabla E=\\frac{x}{2\\pi|x|^2}$']]);
        v.render(() => {
          const rho = rS.value, cx = hc.x, cy = hc.y;
          S.heat((x, y) => E(x, y), { range: [-0.45, 0.15], cmap: 'viridis', res: 3, key: 'E' });
          S.field((x, y) => { const r2 = x * x + y * y; return r2 < 0.01 ? [0, 0] : [x / (2 * Math.PI * r2), y / (2 * Math.PI * r2)]; }, { spacing: 36, color: 'ink', alpha: 0.55 });
          S.dot(0, 0, { color: 'red', r: 4.5, label: 'δ', labelPos: 'sw' });
          S.circle(cx, cy, rho, { color: 'orange', width: 2.6 });
          // flux
          const n = 720; let flux = 0;
          for (let i = 0; i < n; i++) { const t = M.TAU * (i + 0.5) / n, ux = Math.cos(t), uy = Math.sin(t), x = cx + rho * ux, y = cy + rho * uy, r2 = x * x + y * y; flux += (x * ux + y * uy) / (2 * Math.PI * r2) * rho * M.TAU / n; }
          // E(Δφ) with φ(x) = e ψ(|x−c|/ρ): radial Laplacian g'' + g'/r, in polar coordinates about c
          const g1 = (r) => phiD(1, r, 0, rho), g2 = (r) => phiD(2, r, 0, rho);
          let pair = 0; const nr = 160, nt = 180;
          for (let i = 0; i < nr; i++) { const r = rho * (i + 0.5) / nr, lap = g2(r) + g1(r) / r; for (let j = 0; j < nt; j++) { const t = M.TAU * (j + 0.5) / nt; pair += E(cx + r * Math.cos(t), cy + r * Math.sin(t)) * lap * r; } }
          pair *= (rho / nr) * (M.TAU / nt);
          const d0 = Math.hypot(cx, cy);
          const phi0 = d0 < rho ? phiD(0, d0, 0, rho) : 0;
          S.corner(`flux = ${v.fmt(flux, 4)}`, 'tl', { color: Math.abs(flux - 1) < 1e-3 ? 'green' : Math.abs(flux) < 1e-3 ? 'muted' : 'orange', weight: 700, size: 13 });
          st = { flux, pair, phi0, inside: d0 < rho, near: Math.abs(d0 - rho) < 0.03 };
        });
        v.readout(() => {
          const s = st;
          return `Flux of $\\nabla E$ through the circle: $${v.fix(s.flux, 4)}$ ` + (s.near ? '(the circle passes through the singularity)' : s.inside ? '— it surrounds the origin.' : '— the origin is outside.') + ` Definition check: $E(\\Delta\\varphi) = ${v.fix(s.pair, 4)}$ vs. $\\varphi(0) = ${v.fix(s.phi0, 4)}$.`;
        });
      },
    },
    {
      num: '8.1a',
      kind: 'Corollary',
      name: 'Solving P(D)u = w by convolution with a fundamental solution',
      statement: String.raw`If $E$ is a fundamental solution of $P(D)$ and $w\in\mathscr D'(\R^n)$ has compact support, then $u=E*w$ satisfies
$$P(D)u=w .$$
Every other solution of $P(D)u=w$ differs from $E*w$ by a solution of the homogeneous equation $P(D)u=0$.`,
      idea: String.raw`Derivatives of a convolution can be put on either factor (6.37), so $P(D)(E*w)=(P(D)E)*w=\delta*w=w$. The second sentence is linearity. Rudin makes this observation in the introduction 8.1, right after defining fundamental solutions (8.2 then fixes notation for the torus $T^n$). The point is that one distribution $E$, found once, solves the equation for every right-hand side with compact support — the superposition principle of physics.`,
      caption: String.raw`$P(D)=D^2+m^2=-\frac{d^2}{dx^2}+m^2$ on $\R$, with fundamental solution $E(x)=\frac{e^{-m|x|}}{2m}$ (faint, in the inset scale). Drag the three source bumps (orange) — their heights and positions — to build $w$; the solution $u=E*w$ (purple) is computed by quadrature. Then $-u''+m^2u$ is recomputed by finite differences (green, dashed) and lands on $w$.`,
      deps: ['fa-8.1', 'fa-6.37'],
      tags: ['differential equations', 'fundamental solutions', 'convolution'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mS = v.slider('mass $m$', 0.2, 3, 1, { step: 0.01 });
        const top = v.stage({ x: [-6, 6], y: [-1.6, 1.6], height: 200, full: true, axes: true, title: 'the source $w$ (drag the peaks) and $-u\'\'+m^2u$' });
        const bot = v.stage({ x: [-6, 6], y: [-1, 1], height: 230, full: true, axes: true, title: 'the response $u=E*w$; faint: $E$' });
        const H = [[-3, 1.1], [0.4, -0.7], [2.6, 0.8]].map(([x, y], k) => top.handle(x, y, { color: 'orange', r: 6, constrain: (a, b) => [M.clamp(a, -5, 5), M.clamp(b, -1.4, 1.4)] }));
        const r = 0.7;
        let st = {};
        v.legend([['orange', '$w$'], ['purple', '$u=E*w$'], ['green', '$-u\'\'+m^2u$ (finite differences)', { dash: true }]]);
        v.render(() => {
          const m = mS.value;
          const w = (x) => H.reduce((s, h) => s + phiD(0, x, h.x, r, h.y), 0);
          const E = (x) => Math.exp(-m * Math.abs(x)) / (2 * m);
          const xs = M.linspace(-6, 6, 481), hx = xs[1] - xs[0];
          // split each integral at the kink of E(x − ·)
          const conv1 = (x, h) => { const f = (y) => E(x - y) * phiD(0, y, h.x, r, h.y), lo = h.x - r, hi = h.x + r; return x > lo && x < hi ? simpson(f, lo, x, 80) + simpson(f, x, hi, 80) : simpson(f, lo, hi, 120); };
          const u = xs.map((x) => H.reduce((s, h) => s + conv1(x, h), 0));
          const Lu = xs.map((x, i) => (i === 0 || i === xs.length - 1 ? NaN : -(u[i + 1] - 2 * u[i] + u[i - 1]) / (hx * hx) + m * m * u[i]));
          top.fn(w, { color: 'orange', width: 2.6, fill: 'orange', fillAlpha: 0.15, n: 900 });
          top.path(xs.map((x, i) => [x, Lu[i]]), { color: 'green', width: 2, dash: [5, 4] });
          bot.setView(null, span([...u, 0, E(0) * 0.5], 0.4, 0.15));
          const sc = Math.max(...u.map(Math.abs)) / E(0) * 0.6 || 1;
          bot.fn((x) => sc * E(x), { color: 'muted', width: 1.4, dash: [3, 3] });
          bot.path(xs.map((x, i) => [x, u[i]]), { color: 'purple', width: 2.6 });
          const err = Math.max(...xs.map((x, i) => (isFinite(Lu[i]) ? Math.abs(Lu[i] - w(x)) : 0)));
          st = { err, m };
        });
        v.readout(() => `$\\max_x\\,|-u''+m^2u-w| = ${v.sci(st.err + 1e-16, 2)}$ (finite-difference step $0.025$). The decay length of the response is $1/m = ${v.fix(1 / st.m, 2)}$.`);
      },
    },
    {
      num: '8.3',
      kind: 'Lemma',
      name: 'Malgrange’s lemma: a mean-value bound for P·f',
      statement: String.raw`Let $P$ be a polynomial in $n$ variables, of degree $N$, with principal part $P_N$, and let $\sigma_n$ be the normalised Haar measure on the torus $T^n\subset\C^n$. There is a constant $A<\infty$, depending only on $P$, such that
$$|f(z)|\le A\,r^{-N}\int_{T^n}|f(z+rw)\,P(z+rw)|\,d\sigma_n(w)$$
for every entire function $f$ on $\C^n$, every $z\in\C^n$ and every $r>0$. The heart of it is the case $n=1$: if $Q(\lambda)=a\lambda^N+\dots$ and $F$ is holomorphic near the closed unit disc, then
$$|a\,F(0)|\le\frac1{2\pi}\int_{-\pi}^{\pi}\big|F(e^{i\theta})\,Q(e^{i\theta})\big|\,d\theta .$$`,
      idea: String.raw`Write $P(z)=a\prod(z-z_k)$ and reflect the roots inside the disc: $Q(z)=a\prod_{|z_k|<1}(1-\bar z_kz)\prod_{|z_k|\ge1}(z-z_k)$. On the circle $|Q|=|P|$, because $|1-\bar z_ke^{i\theta}|=|e^{i\theta}-z_k|$, and $|Q(0)|=|a|\prod_{|z_k|\ge1}|z_k|\ge|a|$. Then $|a f(0)|\le|f(0)Q(0)|\le\frac1{2\pi}\int|fQ|$ by the mean value property of the subharmonic function $|fQ|$. For $n$ variables fix $w\in T^n$ and apply this to $F(\lambda)=f(z+r\lambda w)$ and $Q(\lambda)=P(z+r\lambda w)$, whose leading coefficient is $r^NP_N(w)$. Integrate over $w\in T^n$, using the rotation invariance of $\sigma_n$; then $A=1/\int_{T^n}|P_N|\,d\sigma_n$.`,
      caption: String.raw`The one-variable step. $P(z)=a\prod_k(z-z_k)$: drag the three roots (red inside the disc, blue outside) and set $a$; $f(z)=e^{bz}$. Hollow dots are the reflected roots $1/\bar z_k$ used in the proof. Right: $|f(e^{i\theta})P(e^{i\theta})|$ around the circle, its mean (purple), and the lower bounds $|f(0)Q(0)|$ (green) and $|af(0)|$ (orange). The order mean $\ge|f(0)Q(0)|\ge|af(0)|$ never breaks, however you move the roots.`,
      deps: ['rca-15.18', 'rca-17.5'],
      tags: ['polynomials', 'subharmonic functions'],
      verify: true,
      viz(v) {
        const M = v.M;
        const aS = v.slider('leading coefficient $a$', 0.3, 2, 1, { step: 0.01 });
        const bS = v.slider('$b$ in $f(z)=e^{bz}$', -2, 2, 0.8, { step: 0.01 });
        const L = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 330, axes: true, ticks: false, title: 'roots of $P$ and their reflections' });
        const R = v.stage({ x: [-Math.PI, Math.PI], y: [0, 4], height: 330, axes: 'box', xticks: [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π']], xlabel: 'θ', title: '$|fP|$ on the unit circle' });
        const roots = [[0.45, 0.3], [-0.6, -0.5], [1.4, -0.9]].map(([x, y], k) => L.handle(x, y, { color: 'red', r: 6, label: `z${'₁₂₃'[k]}` }));
        let st = {};
        v.legend([['ink', '$|f(e^{i\\theta})P(e^{i\\theta})|$'], ['purple', 'its mean'], ['green', '$|f(0)Q(0)|$', { dash: true }], ['orange', '$|a f(0)|$', { dash: true }]]);
        v.render(() => {
          const a = aS.value, b = bS.value, Z = roots.map((h) => [h.x, h.y]);
          roots.forEach((h) => { h.color = Math.hypot(h.x, h.y) < 1 ? 'red' : 'blue'; });
          L.circle(0, 0, 1, { color: 'ink', width: 2 });
          Z.forEach((z) => { const r2 = z[0] * z[0] + z[1] * z[1]; if (r2 < 1 && r2 > 1e-4) { const w = [z[0] / r2, z[1] / r2]; L.dot(w[0], w[1], { hollow: true, color: 'red', r: 5 }); L.line(z[0], z[1], w[0], w[1], { color: 'red', width: 1, dash: [3, 3], alpha: 0.6 }); } });
          const P = (z) => Z.reduce((p, zk) => C.mul(p, C.sub(z, zk)), [a, 0]);
          const f = (z) => C.exp(C.scale(z, b));
          const ths = M.linspace(-Math.PI, Math.PI, 721), vals = ths.map((t) => C.abs(C.mul(f([Math.cos(t), Math.sin(t)]), P([Math.cos(t), Math.sin(t)]))));
          const mean = vals.slice(0, -1).reduce((s, x) => s + x, 0) / (vals.length - 1);
          const Q0 = a * Z.reduce((p, z) => (Math.hypot(z[0], z[1]) >= 1 ? p * Math.hypot(z[0], z[1]) : p), 1);
          R.setView(null, [0, Math.max(...vals, mean) * 1.12]);
          R.path(ths.map((t, i) => [t, vals[i]]), { color: 'ink', width: 2.2 });
          R.hline(mean, { color: 'purple', width: 2.2 });
          R.hline(Q0, { color: 'green', width: 1.8, dash: [6, 4] });
          R.hline(a, { color: 'orange', width: 1.8, dash: [3, 3] });
          st = { mean, Q0, af0: a, nIn: Z.filter((z) => Math.hypot(z[0], z[1]) < 1).length };
        });
        v.readout(() => {
          const s = st;
          return `Mean of $|fP|$ on the circle $=${v.fix(s.mean, 4)}\\;\\ge\\;|f(0)Q(0)| = ${v.fix(s.Q0, 4)}\\;\\ge\\;|af(0)| = ${v.fix(s.af0, 4)}$ (${s.nIn} root(s) reflected).`;
        });
      },
    },
    {
      num: '8.5',
      kind: 'Theorem',
      name: 'Malgrange–Ehrenpreis theorem',
      statement: String.raw`Every linear differential operator $P(D)\ne0$ with constant coefficients on $\R^n$ has a fundamental solution $E\in\mathscr D'(\R^n)$. Consequently $P(D)u=w$ has a solution $u\in\mathscr D'(\R^n)$ for every $w\in\mathscr D'(\R^n)$ with compact support.`,
      idea: String.raw`Formally $E(\varphi)=\int\hat\varphi(-\xi)/P(\xi)\,dm_n(\xi)$, which fails where $P$ vanishes. After a rotation, $P$ has a nonzero leading term in $\xi_n$; for each $\xi'=(\xi_1,\dots,\xi_{n-1})$ integrate in $\xi_n$ not along $\R$ but along a horizontal line $\operatorname{Im}\zeta=s(\xi')\in\{0,\pm1,\dots,\pm N\}$ that stays at distance $\ge1$-ish from the zeros of $P(\xi',\cdot)$ — $\hat\varphi$ is entire (Paley–Wiener), so Cauchy's theorem allows the shift. Lemma 8.3 bounds $|\hat\varphi/P|$ there by averages of $|\hat\varphi|$, which yields continuity of $E$, and $P(D)E=\delta$ because the shifted integrals of $\hat\varphi(-\zeta)$ give back $\varphi(0)$.`,
      caption: String.raw`The one-variable mechanism. $P(\zeta)=(\zeta-z_1)(\zeta-z_2)$ — drag its roots anywhere in $\C$, even onto the real axis. Choose the line $\operatorname{Im}\zeta=s$ (drag the handle on the left edge) on which $E_s(x)=\frac1{2\pi}\int_{\operatorname{Im}\zeta=s}\frac{e^{ix\zeta}}{P(\zeta)}d\zeta$ is computed; residues give it in closed form. Right: $E_s$ (real part solid, imaginary part dashed). Every admissible line gives a fundamental solution — the readout checks $E_s\big(P(-D)\varphi\big)=\varphi(0)$ for a test function $\varphi$ — and lines on different sides of a root differ by a solution of $P(D)u=0$.`,
      deps: ['fa-8.3', 'fa-7.22', 'fa-8.1', 'fa-7.15'],
      tags: ['differential equations', 'fundamental solutions', 'Malgrange–Ehrenpreis'],
      verify: true,
      viz(v) {
        const M = v.M;
        const Z = v.stage({ x: [-3, 3], y: [-2.6, 2.6], equal: true, height: 330, axes: true, title: '$\\zeta$-plane: zeros of $P$ and the line $\\operatorname{Im}\\zeta=s$' });
        const X = v.stage({ x: [-8, 8], y: [-1, 1], height: 330, axes: true, title: '$E_s(x)$' });
        const z1 = Z.handle(-1, -0.5, { color: 'red', label: 'z₁' });
        const z2 = Z.handle(1.2, 0.6, { color: 'red', label: 'z₂' });
        const hs = Z.handle(-2.8, 0.15, { color: 'purple', r: 7, label: 's', labelPos: 'e', constrain: (x, y) => [-2.8, M.clamp(y, -2.4, 2.4)] });
        const hc = X.handle(0.6, 0, { color: 'blue', label: 'φ', labelPos: 's', constrain: (x) => [M.clamp(x, -4, 4), 0] });
        const r = 1.3;
        let st = {};
        v.legend([['red', 'zeros of $P$'], ['purple', 'contour $\\operatorname{Im}\\zeta=s$; $\\mathrm{Re}\\,E_s$ (solid), $\\mathrm{Im}\\,E_s$ (dashed)'], ['blue', 'test function $\\varphi$']]);
        v.render(() => {
          const s = hs.y, R = [[z1.x, z1.y], [z2.x, z2.y]];
          const dP = [C.sub(R[0], R[1]), C.sub(R[1], R[0])];
          const tooClose = R.some((z) => Math.abs(z[1] - s) < 0.04) || C.abs(dP[0]) < 0.05;
          Z.hband(s - 0.04, s + 0.04, { color: tooClose ? 'red' : 'purple', alpha: 0.25 });
          Z.hline(s, { color: tooClose ? 'red' : 'purple', width: 2.4 });
          R.forEach((z, k) => { Z.circle(z[0], z[1], 0.16, { color: z[1] > s ? 'green' : 'orange', width: 2 }); });
          Z.text('above: used for x > 0', 2.95, 2.3, { color: 'green', size: 11, align: 'right' });
          Z.text('below: used for x < 0', 2.95, -2.3, { color: 'orange', size: 11, align: 'right' });
          // E_s by residues
          const Es = (x) => {
            let out = [0, 0];
            R.forEach((z, k) => {
              const above = z[1] > s;
              if ((x >= 0 && above) || (x < 0 && !above)) {             // E_s is continuous at 0, either branch will do
                const term = C.div(C.exp(C.mul([0, x], z)), dP[k]);       // e^{ixz}/P'(z)
                out = C.add(out, C.mul(x >= 0 ? [0, 1] : [0, -1], term));  // i Σ above (x>0), −i Σ below (x<0)
              }
            });
            return out;
          };
          if (!tooClose) {
            const xs = M.linspace(-8, 8, 801), V = xs.map(Es);
            X.setView(null, span([...V.map((p) => M.clamp(p[0], -30, 30)), ...V.map((p) => M.clamp(p[1], -30, 30)), 0.5, -0.5], 1, 0.12));
            X.path(xs.map((x, i) => [x, V[i][0]]), { color: 'purple', width: 2.4 });
            X.path(xs.map((x, i) => [x, V[i][1]]), { color: 'purple', width: 1.6, dash: [5, 4] });
            const c = hc.x, sc = 0.4 * (X.yr ? 1 : 1);
            X.fn((x) => phiD(0, x, c, r) * 0.5, { domain: [c - r, c + r], color: 'blue', width: 1.6, alpha: 0.7 });
            // check: E_s(P(−D)φ) with P(−D)φ = −φ'' − i(z1+z2)φ' + z1 z2 φ   (D = −i d/dx)
            const sum = C.add(R[0], R[1]), prod = C.mul(R[0], R[1]);
            const Pm = (x) => { const p0 = phiD(0, x, c, r), p1 = phiD(1, x, c, r), p2 = phiD(2, x, c, r); return C.add(C.add([-p2, 0], C.mul([0, -1], C.scale(sum, p1))), C.scale(prod, p0)); };
            const integ = (lo, hi) => { let re = 0, im = 0; const n = 1200, h = (hi - lo) / n; for (let i = 0; i <= n; i++) { const x = lo + i * h, w = (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * h / 3; const e = Es(x), p = Pm(x), q = C.mul(e, p); re += w * q[0]; im += w * q[1]; } return [re, im]; };
            const lo = c - r, hi = c + r;
            const pair = lo < 0 && hi > 0 ? C.add(integ(lo, -1e-12), integ(1e-12, hi)) : integ(lo, hi);
            st = { ok: true, pair, phi0: phiD(0, 0, c, r), nAbove: R.filter((z) => z[1] > s).length };
          } else { X.corner('the line runs through a zero of P — move it', 'tl', { color: 'red', weight: 600 }); st = { ok: false }; }
        });
        v.readout(() => {
          const s = st;
          if (!s.ok) return 'Choose $s$ away from the imaginary parts of the zeros (and keep the zeros distinct).';
          return `$E_s\\big(P(-D)\\varphi\\big) = ${v.fix(s.pair[0], 5)} ${s.pair[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(s.pair[1]), 5)}\\,i$ and $\\varphi(0) = ${v.fix(s.phi0, 5)}$. ${s.nAbove} zero(s) above the line: moving the line past a zero changes $E_s$ by a multiple of $e^{ixz_k}$, a solution of $P(D)u=0$.`;
        });
      },
    },
  ],
};
