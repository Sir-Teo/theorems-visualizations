// Rudin, Real and Complex Analysis — Chapter 9, part 3: the Plancherel theorem and L² (9.13–9.16).
// Normalisation: dm = dx/√(2π) throughout.

const S = 1 / Math.sqrt(2 * Math.PI);
const R2PI = Math.sqrt(Math.PI / 2); // S·√(π/2) = 1/2
const sinc = (u) => (Math.abs(u) < 1e-6 ? 1 - (u * u) / 6 : Math.sin(u) / u);

// Sine integral Si(x) = ∫_0^x sin(u)/u du: power series for |x| ≤ 20, asymptotic series beyond (error < 1e-9).
function Si(x) {
  const ax = Math.abs(x);
  if (ax <= 20) {
    let s = 0, term = x;
    for (let n = 0; n < 80; n++) { s += term / (2 * n + 1); term *= (-x * x) / ((2 * n + 2) * (2 * n + 3)); if (Math.abs(term) < 1e-18) break; }
    return s;
  }
  const y = 1 / (ax * ax); let f = 1, g = 1, tf = 1, tg = 1;
  for (let k = 1; k <= 10; k++) { tf *= -(2 * k - 1) * (2 * k) * y; tg *= -(2 * k) * (2 * k + 1) * y; f += tf; g += tg; }
  return Math.sign(x) * (Math.PI / 2 - (f / ax) * Math.cos(ax) - g * y * Math.sin(ax));
}
// Midpoint sum of F over [a,b] with n nodes (F sampled at cell centres).
function mid(F, a, b, n) { const h = (b - a) / n; let s = 0; for (let k = 0; k < n; k++) s += F(a + (k + 0.5) * h); return s * h; }
function simpson(f, a, b, n) { if (n % 2) n++; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3; }

export default {
  collection: 'rca',
  chapter: 9,
  items: [
    {
      num: '9.16', kind: 'Definition', name: 'Translation-invariant subspaces',
      statement: String.raw`A subspace $M\subset L^2(\mathbb R)$ is **translation-invariant** if $f\in M$ implies $f_\alpha\in M$ for every real $\alpha$, where $f_\alpha(x)=f(x-\alpha)$. Plancherel turns this condition into invariance of the transformed subspace under multiplication by $e^{-i\alpha t}$.`,
      idea: String.raw`A spatial shift multiplies the Fourier transform by a phase of modulus one, so it preserves a prescribed spectral zero set. Closing the subspace is essential to the classification in 9.17. Its proof uses an orthogonal projection rather than intersecting uncountably many zero sets, each defined only up to a null set.`,
      deps: ['rca-9.13', 'rca-9.2'], see: ['rca-9.17'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Section 9.16, pp. 188–189'],
    },
    // ------------------------------------------------------------------ 9.13
    {
      num: '9.13',
      kind: 'Theorem',
      name: 'The Plancherel theorem',
      credit: 'Plancherel, 1910',
      statement: String.raw`To every $f\in L^2$ one can assign a function $\hat f\in L^2$ (determined up to a null set) such that:
(a) if $f\in L^1\cap L^2$, then $\hat f$ is the Fourier transform of 9.1;
(b) $\norm{\hat f}_2=\norm f_2$ for every $f\in L^2$;
(c) $f\mapsto\hat f$ is a Hilbert space isomorphism of $L^2$ onto $L^2$;
(d) if $\varphi_A(t)=\int_{-A}^{A}f(x)e^{-ixt}\,dm(x)$ and $\psi_A(x)=\int_{-A}^{A}\hat f(t)e^{ixt}\,dm(t)$, then $\norm{\varphi_A-\hat f}_2\to0$ and $\norm{\psi_A-f}_2\to0$ as $A\to\infty$.`,
      idea: String.raw`For $f\in L^1\cap L^2$ let $\tilde f(x)=\overline{f(-x)}$ and $g=f*\tilde f$. Then $g$ is continuous and bounded with $g(0)=\norm f_2^2$, and $\hat g=|\hat f|^2\ge0$ by 9.2. By 9.8, $(g*h_\lambda)(0)=\int H(\lambda t)|\hat f(t)|^2\,dm(t)$; as $\lambda\to0$ the left side tends to $g(0)$ (9.9) and the right side increases to $\norm{\hat f}_2^2$. So the transform is an $L^2$-isometry on the dense subspace $L^1\cap L^2$ (3.14) and extends uniquely to an isometry of $L^2$. Its range is closed, and it is dense because its orthogonal complement is $\{0\}$ by the uniqueness theorem; 4.16 makes it onto. Finally $f\chi_{[-A,A]}\to f$ in $L^2$, so their transforms $\varphi_A$ converge to $\hat f$, which is (d).`,
      caption: String.raw`Choose $f$ — $\frac{\sin x}{x}$ is in $L^2$ but not in $L^1$, so $\hat f$ cannot be defined by an integral — and move the cut-off $A$. Left: $f$ with the window $[-A,A]$. Right: the transforms $\varphi_A$ of the truncations (blue) approaching the Plancherel transform $\hat f$ (green) in the mean, while the Gibbs overshoot persists. Bottom: four norms computed independently — two in space, two in frequency (on $|t|\le400$). They agree pairwise, as (b) predicts, and the error pair shrinks to $0$, as (d) predicts.`,
      deps: ['rca-9.2', 'rca-9.8', 'rca-9.9', 'rca-9.12', 'rca-4.16', 'rca-3.14'],
      see: ['fa-7.9', 'rca-4.26', 'pma-8.16'],
      tags: ['Plancherel', 'L2', 'Hilbert space'],
      viz(v) {
        const FF = {
          sinc: {
            label: '$\\frac{\\sin x}{x}\\in L^2\\setminus L^1$', f: (x) => sinc(x), xr: [-26, 26], tr: [-3.2, 3.2], yr: [-0.4, 1.15],
            hat: (t) => (Math.abs(t) < 1 ? R2PI : Math.abs(t) === 1 ? R2PI / 2 : 0),
            phi: (t, A) => S * (Si(A * (1 + t)) + Si(A * (1 - t))),
            n2: Math.PI * S, inA: (A) => 2 * S * (Si(2 * A) - Math.sin(A) ** 2 / A),
          },
          exp2: {
            label: '$e^{-|x|}$', f: (x) => Math.exp(-Math.abs(x)), xr: [-6, 6], tr: [-6, 6], yr: [-0.15, 1.15],
            hat: (t) => (2 * S) / (1 + t * t),
            phi: (t, A) => (2 * S * (1 - Math.exp(-A) * (Math.cos(A * t) - t * Math.sin(A * t)))) / (1 + t * t),
            n2: S, inA: (A) => S * (1 - Math.exp(-2 * A)),
          },
          rect: {
            label: '$\\chi_{[-1,1]}$', f: (x) => (Math.abs(x) <= 1 ? 1 : 0), xr: [-3, 3], tr: [-14, 14], yr: [-0.25, 1.15],
            hat: (t) => 2 * S * sinc(t),
            phi: (t, A) => 2 * S * Math.min(A, 1) * sinc(Math.min(A, 1) * t),
            n2: 2 * S, inA: (A) => 2 * S * Math.min(A, 1),
          },
        };
        const which = v.select('$f$', Object.entries(FF).map(([value, o]) => ({ value, label: o.label })), 'sinc');
        const Asl = v.slider('cut-off $A$', 0.5, 40, 5, { log: true, decimals: 2 });
        const X = v.stage({ x: [-26, 26], y: [-0.4, 1.15], height: 250, axes: 'box', xlabel: 'x', title: 'space: $f$ and the window $[-A,A]$' });
        const T = v.stage({ x: [-3.2, 3.2], y: [-0.25, 1.5], height: 250, xlabel: 't', title: 'frequency: $\\varphi_A$ and $\\hat f$' });
        const E = v.stage({ x: [0, 1], y: [0, 4.4], height: 170, full: true, axes: false, title: 'norms, computed on each side separately' });
        let key = '', st = null;
        v.render(() => {
          const F = FF[which.value], A = Asl.value;
          if (key !== which.value) { key = which.value; X.setView(F.xr, F.yr); X.setTicks(null, [0.5, 1]); T.setView(F.tr, null); }
          // space panel
          X.vband(-A, A, { color: 'blue', alpha: 0.08, edges: true });
          X.fn(F.f, { color: 'ink', width: 1.6, n: 1600 });
          X.fn(F.f, { color: 'blue', width: 2.4, domain: [-A, A], n: 1600 });
          X.corner(`A = ${v.fix(A, 2)}`, 'tr', { color: 'blue' });
          // frequency panel
          const ht = Math.max(F.hat(0), 0.3);
          T.setView(null, [-0.3 * ht, 1.35 * ht]);
          T.fn(F.hat, { color: 'green', width: 3, n: 1600, fill: 'green', fillAlpha: 0.1 });
          T.fn((t) => F.phi(t, A), { color: 'blue', width: 2, n: 1200 });
          // norms
          const n2 = F.n2, xin = F.inA(A), xout = n2 - xin;
          // |t| ≤ 40 on a fine grid, 40 ≤ |t| ≤ 400 on a coarser one (cell edges at t = ±1, where f̂ may jump)
          const I = (G) => mid(G, -40, 40, 20000) + mid(G, 40, 400, 9000) + mid(G, -400, -40, 9000);
          const tin = S * I((t) => F.phi(t, A) ** 2);
          const tout = S * I((t) => (F.phi(t, A) - F.hat(t)) ** 2);
          const rows = [
            ['\\|f\\chi_{[-A,A]}\\|_2', Math.sqrt(xin), 'blue', 'space'], ['\\|\\varphi_A\\|_2', Math.sqrt(Math.max(0, tin)), 'blue', 'frequency'],
            ['\\|f-f\\chi_{[-A,A]}\\|_2', Math.sqrt(Math.max(0, xout)), 'red', 'space'], ['\\|\\hat f-\\varphi_A\\|_2', Math.sqrt(Math.max(0, tout)), 'red', 'frequency'],
          ];
          const full = Math.sqrt(n2), x0 = 0.22, W = 0.5;
          E.line(x0 + W, 0.05, x0 + W, 4.35, { color: 'green', width: 1.4, dash: [4, 4] });
          E.tex(`\\|f\\|_2=\\|\\hat f\\|_2=${v.fix(full, 4)}`, x0 + W + 0.012, 0.3, { color: 'green', align: 'left', baseline: 'middle', size: 13 });
          rows.forEach(([lab, val, col, side], i) => {
            const y = 3.85 - i * 0.86 - (i >= 2 ? 0.2 : 0);
            E.rect(x0, y - 0.28, x0 + (W * val) / full, y + 0.28, { fill: col, fillAlpha: side === 'space' ? 0.55 : 0.25, color: col, width: 1.2 });
            E.tex(lab, x0 - 0.012, y, { align: 'right', color: 'ink', size: 14 });
            E.text(`${v.fix(val, 4)}  (${side})`, x0 + W + 0.015, y, { color: col, size: 12 });
          });
          v.legend([['ink', '$f$'], ['blue', '$f\\chi_{[-A,A]}$ and its transform $\\varphi_A$'], ['green', 'Plancherel transform $\\hat f$']]);
          st = { A, x: Math.sqrt(xin), t: Math.sqrt(tin), xo: Math.sqrt(Math.max(0, xout)), to: Math.sqrt(Math.max(0, tout)) };
        });
        v.readout(() => st && `$A=${v.fix(st.A, 2)}$: $\\;\\|f\\chi_{[-A,A]}\\|_2=${v.fix(st.x, 4)}$ vs $\\|\\varphi_A\\|_2=${v.fix(st.t, 4)}$; $\\;\\|f-f\\chi_{[-A,A]}\\|_2=${v.fix(st.xo, 4)}$ vs $\\|\\hat f-\\varphi_A\\|_2=${v.fix(st.to, 4)}\\to0$`);
      },
    },
    // ------------------------------------------------------------------ 9.14
    {
      num: '9.14',
      kind: 'Theorem',
      name: 'Pointwise inversion for f ∈ L² with f̂ ∈ L¹',
      statement: String.raw`If $f\in L^2$ and its Plancherel transform $\hat f$ belongs to $L^1$, then
$$f(x)=\int_{-\infty}^{\infty}\hat f(t)\,e^{ixt}\,dm(t)\qquad\text{for almost every }x.$$`,
      idea: String.raw`By 9.13(d), $\psi_A=\int_{-A}^{A}\hat f(t)e^{ixt}\,dm(t)$ converges to $f$ in $L^2$, so a sequence $\psi_{A_n}$ converges to $f$ almost everywhere (3.12). On the other hand $\hat f\in L^1$ makes $\psi_A$ converge to $\int\hat f(t)e^{ixt}\,dm(t)$ uniformly, with error at most $\int_{|t|>A}|\hat f|\,dm$ (dominated convergence, 1.34). The two limits must agree a.e. No assumption $f\in L^1$ is needed: $\frac{x}{1+x^2}$ and $\frac{\sin x}{x}$ are not integrable, yet the formula holds at every point.`,
      caption: String.raw`Choose $f$ and move $A$. Left: $\hat f$ (for $\frac{x}{1+x^2}$ it is purely imaginary; its imaginary part is drawn) with the part outside $[-A,A]$ in red. Right: $f$ and the partial inverse $\psi_A$. Bottom: $\sup_x|\psi_A-f|$ and $\norm{\psi_A-f}_2$ against $A$ (log–log, by quadrature), with the bound $\int_{|t|>A}|\hat f|\,dm$ dashed. When $\hat f\in L^1$ the convergence is uniform; for $\chi_{[-1,1]}$, where $\hat f\notin L^1$, only the $L^2$ error tends to $0$ and the sup error stays near $\frac12$ at the jumps.`,
      deps: ['rca-9.13', 'rca-3.12', 'rca-1.34'],
      tags: ['inversion', 'L2'],
      viz(v) {
        const FF = {
          odd: {
            label: '$\\frac{x}{1+x^2}$', f: (x) => x / (1 + x * x), xr: [-8, 8], fy: [-0.75, 0.75], tr: [-6, 6], im: true, L1: true,
            hat: (t) => -R2PI * Math.sign(t) * Math.exp(-Math.abs(t)),
            psi: (x, A) => (x - Math.exp(-A) * (Math.sin(A * x) + x * Math.cos(A * x))) / (1 + x * x),
            tail: (A) => Math.exp(-A),
          },
          sinc: {
            label: '$\\frac{\\sin x}{x}$', f: (x) => sinc(x), xr: [-16, 16], fy: [-0.4, 1.15], tr: [-3, 3], im: false, L1: true,
            hat: (t) => (Math.abs(t) < 1 ? R2PI : 0),
            psi: (x, A) => Math.min(A, 1) * sinc(Math.min(A, 1) * x),
            tail: (A) => Math.max(0, 1 - A),
          },
          rect: {
            label: '$\\chi_{[-1,1]}$', f: (x) => (Math.abs(x) <= 1 ? 1 : 0), xr: [-3, 3], fy: [-0.25, 1.2], tr: [-30, 30], im: false, L1: false,
            hat: (t) => 2 * S * sinc(t),
            psi: (x, A) => (Si(A * (1 + x)) + Si(A * (1 - x))) / Math.PI,
            tail: () => Infinity,
          },
        };
        const which = v.select('$f$', Object.entries(FF).map(([value, o]) => ({ value, label: o.label })), 'odd');
        const Asl = v.slider('$A$', 0.3, 40, 2.5, { log: true, decimals: 2 });
        const Tf = v.stage({ x: [-6, 6], y: [-1.4, 1.4], height: 240, xlabel: 't', title: 'frequency: $\\hat f$ and the window $[-A,A]$' });
        const Xs = v.stage({ x: [-8, 8], y: [-0.75, 0.75], height: 240, xlabel: 'x', title: 'space: $f$ and $\\psi_A(x)=\\int_{-A}^{A}\\hat f(t)e^{ixt}dm(t)$' });
        const Er = v.stage({ x: [-0.55, 1.65], y: [-8, 0.4], height: 200, full: true, axes: 'box', xticks: [[-0.5, '0.3'], [0, '1'], [1, '10'], [1.6, '40']], yticks: [[-8, '10⁻⁸'], [-6, '10⁻⁶'], [-4, '10⁻⁴'], [-2, '10⁻²'], [0, '1']], title: 'errors against $A$ (log–log)' });
        const LA = v.M.linspace(Math.log10(0.3), Math.log10(40), 36);
        let key = '', curves = null, st = null;
        function errs(F, A) {
          let sup = 0;
          for (let x = -10; x <= 10; x += 0.0037) { const d = Math.abs(F.psi(x, A) - F.f(x)); if (d > sup) sup = d; }
          const l2 = Math.sqrt(S * mid((x) => (F.psi(x, A) - F.f(x)) ** 2, -40, 40, 4000));
          return [sup, l2];
        }
        v.render(() => {
          const F = FF[which.value], A = Asl.value;
          if (key !== which.value) {
            key = which.value;
            Tf.setView(F.tr, F.im ? [-1.45, 1.45] : [-0.3, 1.45]); Xs.setView(F.xr, F.fy);
            const e = LA.map((la) => errs(F, 10 ** la));
            curves = { sup: LA.map((la, i) => [la, Math.log10(Math.max(1e-8, e[i][0]))]), l2: LA.map((la, i) => [la, Math.log10(Math.max(1e-8, e[i][1]))]) };
          }
          const H = (t) => F.hat(t);
          // frequency panel
          Tf.fn(H, { color: 'red', width: 1.6, n: 1600, fill: 'red', fillAlpha: 0.12 });
          Tf.fn(H, { color: F.im ? 'orange' : 'green', width: 2.6, n: 1600, domain: [-A, A], fill: F.im ? 'orange' : 'green', fillAlpha: 0.18 });
          Tf.vline(-A, { color: 'muted', dash: [4, 4], width: 1 }); Tf.vline(A, { color: 'muted', dash: [4, 4], width: 1 });
          if (F.im) Tf.texPx('\\Im\\hat f\\ \\text{shown}\\ (\\Re\\hat f=0)', 12, 12, { color: 'orange', align: 'left', baseline: 'top', size: 13 });
          // space panel
          Xs.fn(F.f, { color: 'ink', width: 2, n: 1600 });
          Xs.fn((x) => F.psi(x, A), { color: 'blue', width: 2.2, n: 1200 });
          // error panel
          const [sup, l2] = errs(F, A);
          const la = Math.log10(A);
          if (F.L1) Er.fn((u) => Math.log10(Math.max(1e-9, F.tail(10 ** u))), { color: 'muted', width: 1.4, dash: [5, 4] });
          Er.path(curves.sup, { color: F.L1 ? 'green' : 'red', width: 2.4 });
          Er.path(curves.l2, { color: 'purple', width: 2.2 });
          Er.dot(la, Math.log10(Math.max(1e-8, sup)), { color: F.L1 ? 'green' : 'red', r: 5 });
          Er.dot(la, Math.log10(Math.max(1e-8, l2)), { color: 'purple', r: 5 });
          if (which.value === 'sinc') Er.texPx('\\hat f=0 \\text{ off } [-1,1]:\\ \\psi_A=f \\text{ exactly once } A\\ge1', 14, Er.height - 40, { color: 'green', align: 'left', baseline: 'bottom', size: 14 });
          if (!F.L1) Er.texPx('\\hat f\\notin L^1:\\ \\text{uniform convergence fails, } L^2 \\text{ convergence survives}', 14, Er.height - 40, { color: 'red', align: 'left', baseline: 'bottom', size: 14 });
          v.legend([['ink', '$f$'], ['blue', '$\\psi_A$'], [F.L1 ? 'green' : 'red', '$\\sup_x|\\psi_A-f|$'], ['purple', '$\\|\\psi_A-f\\|_2$'], ...(F.L1 ? [['muted', '$\\int_{|t|>A}|\\hat f|\\,dm$', { dash: true }]] : [])]);
          st = { A, sup, l2, tail: F.tail(A), L1: F.L1 };
        });
        v.readout(() => st && `$A=${v.fix(st.A, 2)}$: $\\;\\sup_{|x|\\le10}|\\psi_A-f|=${v.sci(st.sup, 3)}$` + (st.L1 ? ` $\\le\\int_{|t|>A}|\\hat f|\\,dm=${v.sci(st.tail, 3)}$` : '') + `; $\\;\\|\\psi_A-f\\|_2=${v.sci(st.l2, 3)}$ (on $|x|\\le40$)`);
      },
    },
    // ------------------------------------------------------------------ 9.16
    {
      num: '9.17',
      kind: 'Theorem',
      name: 'Closed translation-invariant subspaces of L²',
      statement: String.raw`For a measurable set $E\subset\R$ let $M_E$ be the set of all $f\in L^2$ whose Plancherel transform vanishes a.e. on $E$. Then $M_E$ is a closed subspace of $L^2$ invariant under all translations $f\mapsto f_\alpha$. Conversely, every closed translation-invariant subspace of $L^2$ equals $M_E$ for some measurable $E$, and $M_E=M_{E'}$ exactly when $E$ and $E'$ differ by a set of measure zero.`,
      idea: String.raw`Plancherel turns translations into multiplication by $e_\alpha(t)=e^{-i\alpha t}$. Let $P$ be the orthogonal projection onto the transformed subspace. Orthogonality and invariance imply $(f-Pf)\overline{Pg}$ has Fourier transform zero, hence vanishes a.e. by uniqueness. Interchanging $f,g$ gives $f\,Pg=g\,Pf$. Fix a strictly positive $g\in L^2$ and set $\phi=Pg/g$; then $Pf=\phi f$. From $P^2=P$, $\phi^2=\phi$ a.e., so $\phi$ is an indicator and the subspace consists precisely of functions vanishing on $E=\{\phi=0\}$. This avoids an uncountable intersection of pointwise zero sets.`,
      caption: String.raw`First mode: $E=[-b,-a]\cup[a,b]$ — drag $a$ and $b$. $Pf$ (green) is the orthogonal projection of $f(x)=(1+x)e^{-x^2/2}$ onto $M_E$, namely $f-\int_E\hat f(t)e^{ixt}\,dm(t)$. Slide $\alpha$: the gold dots are $|\widehat{(Pf)_\alpha}|^2$ computed by quadrature over $|x|\le100$, and they stay at $0$ on $E$ (the small ripple at the edges of $E$ is truncation: $Pf\notin L^1$ decays like $1/x$). Second mode: the functions supported in $[-2,2]$ form a closed subspace that translates leave; $\hat f$ is entire, so it vanishes on no interval and no set $E$ describes this subspace.`,
      deps: ['rca-9.13', 'rca-9.2', 'rca-4.11'],
      tags: ['L2', 'invariant subspaces', 'Plancherel'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Section 9.16 and Theorem 9.17, pp. 188–190'],
      viz(v) {
        const mode = v.select('', [{ value: 'E', label: '$M_E$: spectral gap on $E$' }, { value: 'supp', label: 'supported in $[-2,2]$ (not invariant)' }], 'E');
        const al = v.slider('translation $\\alpha$', -4, 4, 1.6, { step: 0.05 });
        const Xs = v.stage({ x: [-6, 7], y: [-0.85, 1.35], height: 250, axes: 'box', xlabel: 'x', yticks: [-0.5, 0.5, 1], title: 'space' });
        const Ts = v.stage({ x: [-4.2, 4.2], y: [-0.12, 1.25], height: 250, xlabel: 't', title: 'frequency: squared moduli of the transforms' });
        const ha = Ts.handle(0.6, 0, { color: 'red', r: 6, label: 'a', labelPos: 's', constrain: (x) => [v.M.clamp(x, 0, 3.6), 0] });
        const hb = Ts.handle(1.6, 0, { color: 'red', r: 6, label: 'b', labelPos: 's', constrain: (x) => [v.M.clamp(x, 0.05, 3.9), 0] });
        const f = (x) => (1 + x) * Math.exp(-x * x / 2);
        const fh2 = (t) => (1 + t * t) * Math.exp(-t * t);
        const fs = (x) => (Math.abs(x) <= 2 ? (1 - (x * x) / 4) * (1 + 0.5 * x) : 0);
        const XG = v.M.linspace(-100, 100, 4001), DX = XG[1] - XG[0];
        const TS = v.M.linspace(-3.9, 3.9, 40);
        let keyP = '', P = null, keyQ = '', Q = null, Qe = null, keyS = '', Sh = null, st = null;
        // Q(x) = ∫_E f̂(t) e^{ixt} dm(t) for symmetric E (real): 2S ∫_a^b e^{-t²/2}(cos xt + t sin xt) dt on the whole x-grid.
        // Simpson in t, fine enough to resolve |x| ≤ 100; e^{ix_k t} by a rotation recurrence in k.
        function qGrid(a, b) {
          const out = new Float64Array(XG.length);
          if (!(b > a)) return out;
          let n = Math.max(200, Math.ceil((b - a) / 0.005)); if (n % 2) n++;
          const h = (b - a) / n;
          for (let j = 0; j <= n; j++) {
            const t = a + j * h, w = (j === 0 || j === n ? 1 : j % 2 ? 4 : 2) * h / 3 * 2 * S * Math.exp(-t * t / 2);
            let cr = Math.cos(XG[0] * t), ci = Math.sin(XG[0] * t); const rr = Math.cos(DX * t), ri = Math.sin(DX * t);
            for (let k = 0; k < XG.length; k++) { out[k] += w * (cr + t * ci); const nr = cr * rr - ci * ri; ci = cr * ri + ci * rr; cr = nr; }
          }
          return out;
        }
        const interp = (arr, x) => { const u = (x - XG[0]) / DX; const i = Math.floor(u); if (i < 0 || i >= arr.length - 1) return 0; return arr[i] + (arr[i + 1] - arr[i]) * (u - i); };
        // |Σ_k y_k e^{-i x_k t} S Δx|² for samples y_k on the grid (rotation recurrence in k)
        const ft2s = (ys, t) => {
          let cr = Math.cos(XG[0] * t), ci = -Math.sin(XG[0] * t); const rr = Math.cos(DX * t), ri = -Math.sin(DX * t);
          let re = 0, im = 0;
          for (let k = 0; k < ys.length; k++) { re += ys[k] * cr; im += ys[k] * ci; const nr = cr * rr - ci * ri; ci = cr * ri + ci * rr; cr = nr; }
          return (S * DX) ** 2 * (re * re + im * im);
        };
        const ft2 = (g, t) => ft2s(XG.map(g), t);
        v.render(() => {
          const isE = mode.value === 'E', alpha = al.value;
          ha.visible = isE; hb.visible = isE;
          Ts.o.axes = isE ? true : 'box';
          if (isE) { Ts.setView([-4.2, 4.2], [-0.12, 1.25]); Ts.setTicks(null, null); Xs.setView([-6, 7], [-0.85, 1.35]); }
          else { Ts.setView([-14, 14], [-8.5, 1]); Ts.setTicks(null, [[-8, '10⁻⁸'], [-6, '10⁻⁶'], [-4, '10⁻⁴'], [-2, '10⁻²'], [0, '1']]); Xs.setView([-6, 7], [-0.3, 1.35]); }
          const a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x);
          if (isE) {
            const kp = `${a}|${b}`;
            if (kp !== keyP) { keyP = kp; const q = qGrid(a, b); P = XG.map((x, k) => f(x) - q[k]); keyQ = ''; }
            const kq = `${kp}|${alpha}`;
            if (kq !== keyQ) {
              keyQ = kq;
              const m = Math.round(alpha / DX);
              const sh = XG.map((x, k) => (k - m >= 0 && k - m < P.length ? P[k - m] : 0)); // samples of (Pf)_α
              Q = TS.map((t) => [t, ft2s(sh, t)]);
              const nE = Math.max(20, Math.round((b - a) / 0.02));
              let eE = 0, eF = 0;
              for (let j = 0; j < nE; j++) { const t = a + ((b - a) * (j + 0.5)) / nE; eE += 2 * S * ft2s(sh, t) * (b - a) / nE; eF += 2 * S * fh2(t) * (b - a) / nE; }
              Qe = { eE, eF };
            }
            // frequency
            Ts.vband(a, b, { color: 'red', alpha: 0.14, edges: true }); Ts.vband(-b, -a, { color: 'red', alpha: 0.14, edges: true });
            Ts.fn(fh2, { color: 'muted', width: 1.4, dash: [5, 4] });
            Ts.fn((t) => (Math.abs(t) >= a && Math.abs(t) <= b ? 0 : fh2(t)), { color: 'green', width: 2.6, fill: 'green', fillAlpha: 0.14, n: 1600 });
            Ts.dots(Q, { color: 'gold', r: 3.6 });
            Ts.tex('E', (a + b) / 2, 1.12, { color: 'red' }); Ts.tex('E', -(a + b) / 2, 1.12, { color: 'red' });
            // space
            Xs.fn(f, { color: 'muted', width: 1.4, dash: [5, 4] });
            Xs.fn((x) => interp(P, x), { color: 'green', width: 2.4 });
            Xs.fn((x) => interp(P, x - alpha), { color: 'blue', width: 2.2 });
            const nP = Math.sqrt(S * DX * P.reduce((s, y) => s + y * y, 0));
            v.legend([['muted', '$f$, $|\\hat f|^2$', { dash: true }], ['green', '$Pf\\in M_E$, $|\\widehat{Pf}|^2$'], ['blue', '$(Pf)_\\alpha$'], ['gold', '$|\\widehat{(Pf)_\\alpha}|^2$ by quadrature', { dot: true }], ['red', '$E$', { area: true }]]);
            st = { isE, nP, alpha, ...Qe };
          } else {
            if (keyS !== 'S') { keyS = 'S'; Sh = v.M.linspace(-14, 14, 701).map((t) => [t, ft2(fs, t)]); }
            const mx = Math.max(...Sh.map((p) => p[1]));
            Xs.vband(-2, 2, { color: 'green', alpha: 0.1, edges: true });
            Xs.fn(fs, { color: 'green', width: 2.4, n: 1200 });
            Xs.fn((x) => fs(x - alpha), { color: 'blue', width: 2.2, n: 1200 });
            Xs.fn((x) => (Math.abs(x) > 2 && fs(x - alpha) !== 0 ? fs(x - alpha) : NaN), { color: 'red', width: 3.2, n: 1200 });
            Ts.path(Sh.map(([t, y]) => [t, Math.log10(Math.max(1e-9, y / mx))]), { color: 'green', width: 2.2 });
            Ts.texPx('\\log_{10}|\\hat f|^2\\ (\\hat f \\text{ entire: no interval of zeros})', Ts.width - 12, 12, { color: 'muted', align: 'right', baseline: 'top', size: 13 });
            const out = Math.sqrt(S * mid((x) => (Math.abs(x) > 2 ? fs(x - alpha) ** 2 : 0), -8, 8, 3200));
            v.legend([['green', '$f$ supported in $[-2,2]$; $|\\hat f|^2$ (normalised)'], ['blue', '$f_\\alpha$'], ['red', 'part of $f_\\alpha$ outside $[-2,2]$']]);
            st = { isE, out, alpha };
          }
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.isE) return `$\\alpha=${v.fix(s.alpha, 2)}$: energy of $(Pf)_\\alpha$ on $E$: $\\int_E|\\widehat{(Pf)_\\alpha}|^2dm=${v.sci(s.eE, 2)}$ (quadrature on $|x|\\le100$), against $\\int_E|\\hat f|^2dm=${v.fix(s.eF, 4)}$ for $f$ itself; $\\;\\|Pf\\|_2=${v.fix(s.nP, 4)}$`;
          return `$\\|f_\\alpha\\chi_{\\{|x|>2\\}}\\|_2=${v.fix(s.out, 4)}$ — for $\\alpha\\ne0$ the translate is no longer in the subspace.`;
        });
      },
    },
  ],
};
