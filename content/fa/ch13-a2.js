// Rudin, Functional Analysis — Chapter 13 (part 2): Cayley transform, spectral theorem, Stone's theorem, semigroups
//
// Numbering note: recalled, not checked against the book; items carry `verify: true`.

const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cabs = (a) => Math.hypot(a[0], a[1]);
const cexp = (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };
function span(vals, minSpan = 1, pad = 0.15) {
  let lo = Infinity, hi = -Infinity;
  for (const y of vals) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (!isFinite(lo)) return [-1, 1];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}

export default {
  book: 'fa',
  chapter: 13,
  items: [
    {
      num: '13.19',
      kind: 'Theorem',
      name: 'The Cayley transform',
      statement: String.raw`For a symmetric, densely defined $T$, the **Cayley transform**
$$U=(T-iI)(T+iI)^{-1}$$
is an isometry from $\mathscr R(T+iI)$ onto $\mathscr R(T-iI)$, $I-U$ is one-to-one, and $T=i(I+U)(I-U)^{-1}$. $T$ is closed iff $U$ is closed; $T$ is self-adjoint iff $U$ is **unitary** (defined on all of $H$, onto $H$). Conversely every unitary $U$ with $I-U$ one-to-one is the Cayley transform of a self-adjoint operator.`,
      idea: String.raw`For $x\in\mathscr D(T)$, symmetry kills the cross terms: $\norm{(T\pm iI)x}^2=\norm{Tx}^2+\norm x^2$. So $U$ maps $(T+i)x\mapsto(T-i)x$ isometrically. Self-adjointness is equivalent to $\mathscr R(T\pm iI)=H$, which is exactly unitarity of $U$. On numbers, $\lambda\mapsto\frac{\lambda-i}{\lambda+i}$ maps the real line onto the unit circle minus the point $1$ — the spectral version of the same fact.`,
      caption: String.raw`The scalar Cayley map $\kappa(\lambda)=\frac{\lambda-i}{\lambda+i}$ sends the real axis (left, blue ticks at the integers) onto the unit circle minus $1$ (right). Drag $\lambda$: real $\lambda$ land on the circle ($|\kappa|=1$), $\lambda$ in the upper half-plane inside, lower half-plane outside. A self-adjoint $T$ with spectrum on $\R$ becomes the unitary $U$ with spectrum on $\T$; $\pm\infty$ both go to $1$, which is why $I-U$ must be one-to-one. The $3\times3$ check in the readout: for $T$ symmetric with eigenvalues $\lambda_k$, $U$ has eigenvalues $\kappa(\lambda_k)$ and $\norm{U^*U-I}\approx0$.`,
      deps: ['fa-13.11', 'fa-13.8', 'fa-13.16'],
      tags: ['Cayley transform', 'self-adjoint operators', 'unitary operators'],
      verify: true,
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-4, 4], y: [-2.5, 2.5], equal: true, height: 320, axes: true, title: '$\\lambda$-plane' });
        const R = v.stage({ x: [-1.8, 1.8], y: [-1.5, 1.5], equal: true, height: 320, axes: true, title: '$\\kappa(\\lambda)=(\\lambda-i)/(\\lambda+i)$' });
        const hl = L.handle(1.3, 0.6, { color: 'purple', label: 'λ' });
        const kap = (z) => cdiv(csub(z, [0, 1]), cadd(z, [0, 1]));
        let st = {};
        v.legend([['blue', '$\\R$ and its image'], ['green', 'upper half-plane → inside'], ['purple', '$\\lambda$ and $\\kappa(\\lambda)$']]);
        v.render(() => {
          const z = [hl.x, hl.y], w = kap(z);
          L.hband(0, 5, { color: 'green', alpha: 0.06 });
          R.circle(0, 0, 1, { color: 'blue', width: 2.4, fill: 'green', fillAlpha: 0.06 });
          L.hline(0, { color: 'blue', width: 2.4 });
          for (let k = -4; k <= 4; k++) { L.dot(k, 0, { color: 'blue', r: 3 }); const q = kap([k, 0]); R.dot(q[0], q[1], { color: 'blue', r: 3 }); }
          R.dot(1, 0, { color: 'red', r: 5, hollow: true, label: '±∞', labelPos: 'e', math: false });
          // image of the horizontal line through λ
          R.curve((t) => kap([Math.tan(t), z[1]]), -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01, { color: 'purple', width: 1.4, dash: [5, 4], n: 300 });
          L.hline(z[1], { color: 'purple', width: 1.2, dash: [5, 4] });
          R.dot(w[0], w[1], { color: 'purple', r: 6 });
          // 3×3 check with a real symmetric T
          const Q = [[0.6, -0.64, 0.48], [0.8, 0.48, -0.36], [0, 0.6, 0.8]], l = [-1.3, 0.4, 2.2];
          const U = [0, 1, 2].map((i) => [0, 1, 2].map((j) => l.reduce((s, lk, k) => cadd(s, [kap([lk, 0])[0] * Q[i][k] * Q[j][k], kap([lk, 0])[1] * Q[i][k] * Q[j][k]]), [0, 0])));
          const UU = [0, 1, 2].map((i) => [0, 1, 2].map((j) => [0, 1, 2].reduce((s, k) => cadd(s, cmul([U[k][i][0], -U[k][i][1]], U[k][j])), [0, 0])));
          const def = Math.sqrt([0, 1, 2].reduce((s, i) => s + [0, 1, 2].reduce((t, j) => t + cabs(csub(UU[i][j], [i === j ? 1 : 0, 0])) ** 2, 0), 0));
          st = { z, w, r: cabs(w), def };
        });
        v.readout(() => `$|\\kappa(\\lambda)| = ${v.fix(st.r, 4)}$` + (Math.abs(st.z[1]) < 1e-3 ? ' — $\\lambda$ real, on the circle.' : st.z[1] > 0 ? ' $<1$ — upper half-plane.' : ' $>1$ — lower half-plane.') + ` For a symmetric $3\\times3$ $T$: $\\|U^*U-I\\| = ${v.sci(st.def + 1e-17, 1)}$.`);
      },
    },
    {
      num: '13.20',
      kind: 'Definition',
      name: 'Deficiency indices',
      statement: String.raw`For a closed symmetric densely defined $T$, the **deficiency indices** are $n_\pm=\dim\mathscr N(T^*\mp iI)$, the dimensions of the orthogonal complements of $\mathscr R(T\pm iI)$. $T$ is self-adjoint iff $n_+=n_-=0$; $T$ has self-adjoint extensions iff $n_+=n_-$, and they correspond to the unitary maps of $\mathscr N(T^*-iI)$ onto $\mathscr N(T^*+iI)$ (extensions of the Cayley transform to a unitary).`,
      idea: String.raw`The Cayley transform $U$ of $T$ is an isometry between closed subspaces with orthogonal complements of dimensions $n_+$ and $n_-$; a symmetric extension of $T$ is a partial isometry extending $U$, and it is unitary — the extension self-adjoint — exactly when it maps one complement onto the other. For $-i\,d/dx$ on $[0,1]$ with $f(0)=f(1)=0$, $n_\pm=1$ (spanned by $e^{\pm x}$), giving the circle of extensions $T_\theta$ of 13.15; on $[0,\infty)$, $n_+=1\ne n_-=0$ and no self-adjoint extension exists.`,
      deps: ['fa-13.19'],
      tags: ['deficiency indices', 'self-adjoint extensions'],
      verify: true,
    },
    {
      num: '13.27',
      kind: 'Theorem',
      name: 'The spectrum of Ψ(f) is the essential range of f',
      statement: String.raw`Let $E$ be a resolution of the identity on $\Omega$, $f:\Omega\to\C$ measurable, $\Psi(f)$ as in 13.24, and $\omega_\alpha=\{p\in\Omega:f(p)=\alpha\}$. Then $\alpha$ is an eigenvalue of $\Psi(f)$ if and only if $E(\omega_\alpha)\ne0$, and $\sigma(\Psi(f))$ is the essential range of $f$ (the set of $\lambda$ with $E(\{|f-\lambda|<\varepsilon\})\ne0$ for every $\varepsilon>0$), and for $\lambda$ outside it
$$\norm{(\Psi(f)-\lambda I)^{-1}}=\frac1{\operatorname{dist}(\lambda,\operatorname{ess\,range}f)} .$$
With the spectral theorem 13.30 this shows that a self-adjoint $T$ has $\sigma(T)\subset\R$ and $\norm{(T-\lambda I)^{-1}}\le1/|\operatorname{Im}\lambda|$.`,
      idea: String.raw`If $\lambda$ is outside the essential range, at distance $d$, then $g=1/(f-\lambda)$ is bounded by $1/d$ almost everywhere $[E]$, and 13.24(c) shows that the bounded operator $\Psi(g)$ is a two-sided inverse of $\Psi(f)-\lambda I$, with norm $1/d$. If $\lambda$ is in the essential range, the projections $E(\{|f-\lambda|<\varepsilon\})$ are nonzero, and unit vectors $x$ in their ranges have $\norm{(\Psi(f)-\lambda)x}\le\varepsilon$ by 13.24(a), so $\Psi(f)-\lambda I$ has no bounded inverse. Values that $f$ takes only on an $E$-null set do not count. Eigenvalues: if $E(\omega_\alpha)\ne0$, every $x$ in its range has $\Psi(f)x=\alpha x$; conversely $\norm{(\Psi(f)-\alpha)x}^2=\int|f-\alpha|^2dE_{x,x}=0$ forces $E_{x,x}$ to live on $\omega_\alpha$.`,
      caption: String.raw`The colour is $\log_{10}\norm{(\Psi(f)-\lambda)^{-1}}=-\log_{10}\operatorname{dist}(\lambda,\operatorname{ess\,range}f)$; drag $\lambda$. **Laplacian**: $T=-d^2/dx^2$ on $L^2[0,\pi]$ with Dirichlet conditions is $\Psi(\lambda)$ for its resolution of the identity, which has atoms at $1,4,9,\dots$ (red). This is the essential range, so the spectrum, all real, and the readout compares the resolvent norm with $1/|\operatorname{Im}\lambda|$. **Multiplication**: $\Psi(f)$ is multiplication by a continuous complex $f$ on $L^2[0,1]$, whose essential range is the curve $f([0,1])$ (green). Changing $f$ at the single point $t=\frac12$ (red ring) changes nothing, since a point is a null set.`,
      deps: ['fa-13.24', 'fa-12.21'],
      tags: ['spectrum', 'resolution of the identity', 'resolvent'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'lap', label: 'Laplacian $-d^2/dx^2$' }, { value: 'mul', label: 'multiplication by $f$' }], 'lap', { onChange: (m) => { if (m === 'lap') hl.set(11.5, 2.2); else hl.set(0.5, 0.35); } });
        const S = v.stage({ x: [-3, 40], y: [-8, 8], height: 340, full: true, axes: true, title: '' });
        const hl = S.handle(11.5, 2.2, { color: 'purple', label: 'λ' });
        const ev = M.range(7).map((k) => (k + 1) ** 2);
        const fc = (t) => { const r = 1 + 0.35 * Math.cos(6 * Math.PI * t); return [r * Math.cos(2 * Math.PI * t), r * Math.sin(2 * Math.PI * t)]; };
        const curve = M.linspace(0, 1, 361).map(fc), spike = [1.9, 1.15];
        let st = {};
        v.render(() => {
          const lap = mode.value === 'lap', z = [hl.x, hl.y];
          if (lap) {
            S.setView([-3, 40], [-8, 8]); S.setTitle('$\\log_{10}\\|(T-\\lambda)^{-1}\\|$ for $T=-d^2/dx^2$, Dirichlet');
            S.heat((x, y) => -Math.log10(Math.min(...ev.map((e) => Math.hypot(x - e, y))) + 1e-9), { range: [-1, 1.5], cmap: 'magma', res: 3, key: 'lap' });
            S.axes();
            ev.forEach((e) => S.dot(e, 0, { color: 'red', r: 4.5 }));
            S.text('…', 39, 0.8, { color: 'red', size: 16 });
            if (Math.abs(z[1]) > 0.05) { S.hline(z[1], { color: 'purple', width: 1, dash: [4, 4] }); S.hline(-z[1], { color: 'purple', width: 1, dash: [4, 4] }); }
            const dist = Math.min(...ev.map((e) => Math.hypot(z[0] - e, z[1])));
            st = { lap, res: 1 / dist, bound: Math.abs(z[1]) > 1e-9 ? 1 / Math.abs(z[1]) : Infinity };
          } else {
            S.setView([-4.3, 4.3], [-1.7, 1.7]); S.setTitle('$\\log_{10}\\|(\\Psi(f)-\\lambda)^{-1}\\|$, $f(t)=(1+0.35\\cos6\\pi t)e^{2\\pi it}$');
            const d = (x, y) => { let m = Infinity; for (const p of curve) m = Math.min(m, Math.hypot(x - p[0], y - p[1])); return m; };
            S.heat((x, y) => -Math.log10(d(x, y) + 1e-9), { range: [-1, 1.5], cmap: 'magma', res: 4, key: 'mul' });
            S.axes();
            S.path(curve, { color: 'green', width: 2.4 });
            S.dot(spike[0], spike[1], { color: 'red', r: 6, hollow: true });
            S.text('f(½), changed on a null set', spike[0] + 0.15, spike[1] + 0.22, { color: 'ink', size: 12, align: 'left' });
            st = { lap, res: 1 / d(z[0], z[1]), spikeDist: Math.hypot(z[0] - spike[0], z[1] - spike[1]) };
          }
        });
        v.readout(() => {
          const s = st;
          if (s.lap) return `$\\|(T-\\lambda)^{-1}\\| = 1/\\operatorname{dist}(\\lambda,\\sigma(T)) = ${v.fix(s.res, 4)}$` + (isFinite(s.bound) ? ` $\\le 1/|\\operatorname{Im}\\lambda| = ${v.fix(s.bound, 4)}$.` : ' — $\\lambda$ is real: the bound gives nothing, and $\\lambda$ may be in the spectrum.');
          return `$\\|(\\Psi(f)-\\lambda)^{-1}\\|=1/\\operatorname{dist}(\\lambda,f([0,1]))=${v.fix(s.res, 4)}$` + (s.spikeDist < 0.15 ? '. $\\lambda$ is near the value taken on the null set, but that value is not in the essential range, so the resolvent stays bounded.' : '.');
        });
      },
    },
    {
      num: '13.30',
      kind: 'Theorem',
      name: 'The spectral theorem for unbounded self-adjoint operators',
      statement: String.raw`Every self-adjoint $T$ (more generally every closed normal densely defined $T$) has a unique resolution of the identity $E$ on the Borel sets of $\sigma(T)\subset\R$ with
$$(Tx,y)=\int_{\sigma(T)}\lambda\,dE_{x,y}(\lambda)\qquad(x\in\mathscr D(T),\ y\in H),$$
where $\mathscr D(T)=\{x:\int\lambda^2\,dE_{x,x}(\lambda)<\infty\}$. Moreover $f(T)=\int f\,dE$ defines a functional calculus for all Borel $f$ (unbounded $f$ giving unbounded operators).`,
      idea: String.raw`Pass to the Cayley transform $U$, a unitary with $I-U$ one-to-one, and apply the bounded spectral theorem 12.23: $U=\int_\T\mu\,dE'(\mu)$, with $E'(\{1\})=0$. Pull $E'$ back to $\R$ through $\kappa^{-1}(\mu)=i\frac{1+\mu}{1-\mu}$. Unbounded $f$ are handled by truncation, $f_n=f1_{\{|f|\le n\}}$, and the domain is where the truncations converge.`,
      caption: String.raw`$T=-d^2/dx^2$ on $[0,\pi]$ (Dirichlet), eigenvalues $k^2$, eigenfunctions $\sqrt{2/\pi}\sin kx$. Pick $f$ (top, drawn with sine coefficients $c_k$): $E_{f,f}$ puts mass $c_k^2$ at $\lambda=k^2$ (bars, log-scaled $\lambda$ axis). $f$ is in $\mathscr D(T)$ iff $\sum k^4c_k^2<\infty$. The smooth bump (vanishing at both ends, $c_k=O(k^{-3})$) qualifies. The tent does not: $c_k\sim k^{-2}$, so $k^4c_k^2$ does not decay — its second derivative is a point mass, not an $L^2$ function. The step ($c_k\sim k^{-1}$) is worse still. The readout shows the partial sums of $\int\lambda^2dE_{f,f}$ converging or diverging.`,
      deps: ['fa-13.19', 'fa-12.23', 'fa-13.24'],
      see: ['fa-12.23'],
      tags: ['spectral theorem', 'unbounded operators'],
      verify: true,
      viz(v) {
        const M = v.M;
        const F = {
          bump: { label: 'smooth bump', f: (x) => Math.exp(-((x - 1.5) ** 2) / 0.2) - Math.exp(-(1.5 ** 2) / 0.2) * (1 - x / Math.PI) - Math.exp(-((Math.PI - 1.5) ** 2) / 0.2) * x / Math.PI },
          tent: { label: 'tent', f: (x) => (x < 1.2 ? x / 1.2 : (Math.PI - x) / (Math.PI - 1.2)) },
          step: { label: 'step $1_{[0,2]}$', f: (x) => (x < 2 ? 1 : 0) },
        };
        const which = v.select('$f=$', Object.entries(F).map(([value, o]) => ({ value, label: o.label })), 'bump');
        const NK = 120;
        const top = v.stage({ x: [0, Math.PI], y: [-0.4, 1.3], height: 200, full: true, axes: true, title: '$f$ and the partial sum of its eigen-expansion ($k\\le12$)' });
        const bot = v.stage({ x: [0, Math.log10(NK * NK)], y: [-9, 0.5], height: 220, full: true, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '10³'], [4, '10⁴']], xlabel: 'λ = k²', title: '$E_{f,f}$: mass $c_k^2$ at $\\lambda=k^2$ (log–log)' });
        const coefCache = new Map();
        const coefs = (key) => { if (!coefCache.has(key)) { const f = F[key].f, n = 6000; coefCache.set(key, M.range(NK).map((i) => { const k = i + 1; let s = 0; for (let j = 0; j <= n; j++) { const x = Math.PI * j / n, w = (j === 0 || j === n ? 1 : j % 2 ? 4 : 2) * Math.PI / (3 * n); s += w * f(x) * Math.sin(k * x); } return s * Math.sqrt(2 / Math.PI); })); } return coefCache.get(key); };
        let st = {};
        v.render(() => {
          const key = which.value, c = coefs(key);
          top.fn(F[key].f, { color: 'blue', width: 2.4, n: 800 });
          top.fn((x) => c.slice(0, 12).reduce((s, ck, i) => s + ck * Math.sqrt(2 / Math.PI) * Math.sin((i + 1) * x), 0), { color: 'orange', width: 1.6, dash: [5, 4], n: 800 });
          c.forEach((ck, i) => { const k = i + 1, y = Math.log10(ck * ck + 1e-30); if (y > -9) bot.line(Math.log10(k * k), -9, Math.log10(k * k), y, { color: 'purple', width: 2, alpha: 0.8 }); });
          bot.setTicks([[0, '1'], [1, '10'], [2, '100'], [3, '10³'], [4, '10⁴']], [0, -2, -4, -6, -8].map((k) => [k, k === 0 ? '1' : `10⁻${'²⁴⁶⁸'[(-k) / 2 - 1]}`]));
          const part = (m) => c.slice(0, m).reduce((s, ck, i) => s + (i + 1) ** 4 * ck * ck, 0);
          st = { key, p30: part(30), p60: part(60), p120: part(120) };
        });
        v.legend([['blue', '$f$'], ['orange', 'eigen-expansion, $k\\le12$', { dash: true }], ['purple', '$E_{f,f}(\\{k^2\\})=c_k^2$']]);
        v.readout(() => `Partial sums of $\\int\\lambda^2dE_{f,f}=\\|Tf\\|^2$: $${v.fix(st.p30, 1)}$ ($k\\le30$), $${v.fix(st.p60, 1)}$ ($k\\le60$), $${v.fix(st.p120, 1)}$ ($k\\le120$)` + (st.p120 > 1.5 * st.p60 ? ' — diverging: $f\\notin\\mathscr D(T)$.' : ' — converging: $f\\in\\mathscr D(T)$.'));
      },
    },
    {
      num: '13.38',
      kind: 'Theorem',
      name: "Stone's theorem: one-parameter unitary groups",
      statement: String.raw`If $T$ is self-adjoint, then $U_t=e^{itT}=\int e^{it\lambda}dE(\lambda)$ is a strongly continuous one-parameter group of unitary operators ($U_{s+t}=U_sU_t$, $U_0=I$, $t\mapsto U_tx$ continuous), and
$$\lim_{t\to0}\frac{U_tx-x}{t}=iTx\qquad\text{exactly for }x\in\mathscr D(T).$$
Conversely (Stone) every strongly continuous unitary group arises in this way from a unique self-adjoint $T$, its **generator**.`,
      idea: String.raw`Group law, unitarity and strong continuity are properties of the functions $e^{it\lambda}$ under the Borel calculus, plus dominated convergence. The difference quotient: $\norm{\frac{U_tx-x}{t}-iTx}^2=\int\big|\frac{e^{it\lambda}-1}{t}-i\lambda\big|^2dE_{x,x}$, which tends to $0$ by dominated convergence when $\int\lambda^2dE_{x,x}<\infty$, i.e. $x\in\mathscr D(T)$. For the converse one defines $T$ through the derivative, checks that $\mathscr R(T\pm iI)=H$, and concludes that it is self-adjoint (13.14, 13.19).`,
      caption: String.raw`$T=-i\,d/dx$ on $L^2(\R)$ generates the translation group $(U_tf)(x)=f(x+t)$; equivalently, in frequency space $U_t$ multiplies by $e^{it\xi}$. Drag $t$: the blue profile slides rigidly, $\norm{U_tf}=\norm f$. Bottom: the size of the difference quotient $\norm{\frac{U_tf-f}{t}}$ as $t\to0$ — it converges to $\norm{f'}$ for the smooth $f$, and blows up like $|t|^{-1/2}$ for the step $f=1_{[0,1]}$, which is not in $\mathscr D(T)$.`,
      deps: ['fa-13.30', 'fa-12.24', 'fa-7.9'],
      tags: ["Stone's theorem", 'unitary groups', 'generators'],
      verify: true,
      viz(v) {
        const M = v.M;
        const F = { smooth: { label: 'smooth $f$', f: (x) => Math.exp(-x * x) * (1 + 0.6 * Math.sin(2 * x)) }, step: { label: 'step $1_{[0,1]}$', f: (x) => (x >= 0 && x <= 1 ? 1 : 0) } };
        const which = v.select('$f=$', Object.entries(F).map(([value, o]) => ({ value, label: o.label })), 'smooth');
        const tS = v.slider('$t$', -3, 3, 0.8, { step: 0.01 });
        const top = v.stage({ x: [-5, 5], y: [-0.6, 1.6], height: 220, full: true, axes: true, title: '$f$ (faint) and $U_tf=f(\\cdot+t)$' });
        const bot = v.stage({ x: [-3, 0], y: [-0.5, 2.5], height: 200, full: true, axes: 'box', xticks: [[-3, '10⁻³'], [-2, '10⁻²'], [-1, '10⁻¹'], [0, '1']], xlabel: '|t|', title: '$\\log_{10}\\|(U_tf-f)/t\\|_2$ against $\\log_{10}|t|$' });
        const L2 = (g) => { let s = 0; const n = 8000; for (let i = 0; i <= n; i++) { const x = -8 + 16 * i / n; s += g(x) ** 2 * (i === 0 || i === n ? 0.5 : 1); } return Math.sqrt(s * 16 / n); };
        let st = {};
        v.render(() => {
          const key = which.value, f = F[key].f, t = tS.value;
          top.fn(f, { color: 'blue', width: 1.4, alpha: 0.35, n: 1500 });
          top.fn((x) => f(x + t), { color: 'blue', width: 2.6, n: 1500 });
          const ts = M.linspace(-3, 0, 31), q = ts.map((l) => { const h = 10 ** l; return [l, Math.log10(L2((x) => (f(x + h) - f(x)) / h))]; });
          bot.setView(null, span(q.map((p) => p[1]), 1, 0.2));
          bot.path(q, { color: key === 'smooth' ? 'green' : 'red', width: 2.4 });
          bot.dots(q, { color: key === 'smooth' ? 'green' : 'red', r: 2.6 });
          if (key === 'smooth') { const d = L2((x) => (f(x + 1e-5) - f(x - 1e-5)) / 2e-5); bot.hline(Math.log10(d), { color: 'green', width: 1.2, dash: [5, 4] }); }
          st = { key, n0: L2(f), nt: L2((x) => f(x + t)), last: 10 ** q[0][1] };
        });
        v.readout(() => `$\\|U_tf\\| = ${v.fix(st.nt, 4)} = \\|f\\| = ${v.fix(st.n0, 4)}$ (unitary). At $t=10^{-3}$: $\\|(U_tf-f)/t\\| = ${v.fix(st.last, 3)}$` + (st.key === 'smooth' ? ' — converging to $\\|Tf\\|=\\|f\'\\|$.' : ' — blowing up like $|t|^{-1/2}$: $f\\notin\\mathscr D(T)$.'));
      },
    },
    {
      num: '13.35',
      kind: 'Theorem',
      name: 'Semigroups and their infinitesimal generators (Hille–Yosida)',
      statement: String.raw`Let $\{Q(t)\}_{t\ge0}$ be a strongly continuous semigroup of bounded operators on a Banach space $X$ ($Q(0)=I$, $Q(s+t)=Q(s)Q(t)$). Its **infinitesimal generator** $A$, $Ax=\lim_{t\downarrow0}\frac{Q(t)x-x}{t}$ on the set where the limit exists, is closed and densely defined, and $Q(t)x$ solves $\frac d{dt}Q(t)x=AQ(t)x$. If $\norm{Q(t)}\le1$ (a contraction semigroup), then every $\lambda>0$ is in the resolvent set of $A$, $\norm{(\lambda I-A)^{-1}}\le1/\lambda$, and
$$Q(t)x=\lim_{n\to\infty}\Big(I-\frac tnA\Big)^{-n}x .$$
Conversely (Hille–Yosida), every closed densely defined $A$ with these resolvent bounds generates a contraction semigroup.`,
      idea: String.raw`Density of $\mathscr D(A)$: the averages $\frac1s\int_0^sQ(t)x\,dt$ belong to it and tend to $x$. The resolvent is the Laplace transform $(\lambda I-A)^{-1}x=\int_0^\infty e^{-\lambda t}Q(t)x\,dt$, whose norm is at most $\int e^{-\lambda t}dt=1/\lambda$. The exponential formula is the operator version of $(1-\frac{ta}n)^{-n}\to e^{ta}$, made uniform by the resolvent bound; Yosida's proof of the converse approximates $A$ by the bounded operators $A_\lambda=\lambda A(\lambda I-A)^{-1}$.`,
      caption: String.raw`The heat semigroup on $L^2[0,\pi]$ with Dirichlet conditions: $A=d^2/dx^2$, $Q(t)$ multiplies the sine coefficients by $e^{-k^2t}$. Top: an initial profile $f$ (a square wave with ramps at the ends) and $Q(t)f$ — instantly smooth for $t>0$. The dashed curve is the implicit-Euler approximation $(I-\frac tnA)^{-n}f$, which multiplies coefficient $k$ by $(1+k^2t/n)^{-n}$; increase $n$ to watch it converge. Bottom: these multipliers against $k$ — exact (green) and approximate (orange), all in $[0,1]$ (contractions).`,
      deps: ['fa-13.30', 'fa-13.24'],
      tags: ['semigroups', 'Hille–Yosida', 'heat equation'],
      verify: true,
      viz(v) {
        const M = v.M;
        const tS = v.slider('$\\log_{10}t$', -3.5, 0, -1.5, { step: 0.01, fmt: (x) => `t = ${(10 ** x).toExponential(1)}` });
        const nS = v.slider('$n$ (implicit Euler steps)', 1, 60, 3, { int: true });
        const top = v.stage({ x: [0, Math.PI], y: [-1.3, 1.3], height: 230, full: true, axes: true, title: '$f$, $Q(t)f$ and $(I-\\frac tnA)^{-n}f$' });
        const bot = v.stage({ x: [0, 60], y: [0, 1.05], height: 190, full: true, axes: 'box', xlabel: 'k', title: 'multipliers $e^{-k^2t}$ and $(1+k^2t/n)^{-n}$' });
        const K = 200;
        const f = (x) => { const s = Math.sin(5 * x) > 0 ? 1 : -1; return 0.9 * s * Math.min(1, x * 3, (Math.PI - x) * 3); };
        const c = (() => { const n = 8000; return M.range(K).map((i) => { const k = i + 1; let s = 0; for (let j = 0; j <= n; j++) { const x = Math.PI * j / n, w = (j === 0 || j === n ? 1 : j % 2 ? 4 : 2) * Math.PI / (3 * n); s += w * f(x) * Math.sin(k * x); } return s * 2 / Math.PI; }); })();
        const synth = (mult) => (x) => c.reduce((s, ck, i) => s + ck * mult(i + 1) * Math.sin((i + 1) * x), 0);
        let st = {};
        v.legend([['muted', '$f$'], ['green', '$Q(t)f$'], ['orange', '$(I-\\frac tnA)^{-n}f$', { dash: true }]]);
        v.render(() => {
          const t = 10 ** tS.value, n = nS.value;
          const ex = (k) => Math.exp(-k * k * t), ap = (k) => Math.pow(1 + k * k * t / n, -n);
          top.fn(f, { color: 'muted', width: 1.4, alpha: 0.7, n: 1200 });
          top.fn(synth(ex), { color: 'green', width: 2.6, n: 500 });
          top.fn(synth(ap), { color: 'orange', width: 2, dash: [6, 4], n: 500 });
          bot.path(M.range(60).map((i) => [i + 1, ex(i + 1)]), { color: 'green', width: 2.4 });
          bot.path(M.range(60).map((i) => [i + 1, ap(i + 1)]), { color: 'orange', width: 2, dash: [6, 4] });
          const err = Math.sqrt(c.reduce((s, ck, i) => s + (ck * (ex(i + 1) - ap(i + 1))) ** 2, 0) * Math.PI / 2);
          st = { err, t, n };
        });
        v.readout(() => `$t = ${v.sci(st.t, 2)}$: $\\|Q(t)f-(I-\\frac tnA)^{-n}f\\|_2 = ${v.sci(st.err + 1e-17, 2)}$ with $n=${st.n}$ — every multiplier lies in $[0,1]$, so all these operators are contractions.`);
      },
    },
  ],
};
