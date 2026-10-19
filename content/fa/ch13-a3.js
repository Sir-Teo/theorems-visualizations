import {productDemo,commutatorDemo,graphClosedDemo} from './ch13.verified.shared.js';
// Rudin, Functional Analysis — Chapter 13 (part 3): adjoints of sums, products and inverses, null spaces
// and ranges, symmetric operators, closability, T*T, essential self-adjointness, maximal symmetry
//
// Source audit: complete relevant statements/proofs in Rudin, second edition, pp.347–385 inspected.

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
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const p10 = (k) => (k === 0 ? '1' : k === 1 ? '10' : '10' + (k < 0 ? '⁻' : '') + String(Math.abs(k)).split('').map((d) => SUP[+d]).join(''));
const decTicks = (lo, hi, step = 1) => { const t = []; for (let k = Math.ceil(lo / step) * step; k <= Math.floor(hi); k += step) t.push([k, p10(k)]); return t; };
/** Solve the tridiagonal system with sub-, main- and super-diagonals a, b, c (Thomas algorithm). */
function thomas(a, b, c, d) {
  const n = b.length, cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n);
  cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
  x[n - 1] = dp[n - 1]; for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}

export default {
  collection: 'fa',
  chapter: 13,
  items: [
    // ------------------------------------------------------------------ 13.2
    {
      num: '13.2',
      kind: 'Theorem',
      name: "The adjoint of a product reverses its factors",
      statement: String.raw`If S,T and ST are densely defined operators in H, then $T^*S^*\subset(ST)^*$. If in addition $S\in B(H)$, equality holds, including equality of domains.`,
      idea: String.raw`For x in D(ST) and y in D(T*S*), the adjoint identities successively give (STx,y)=(Tx,S*y)=(x,T*S*y). This proves graph inclusion. When S is bounded, D(ST)=D(T) and D(S*)=H; boundedness of x↦(STx,y) then gives S*y∈D(T*), proving the reverse inclusion.`,
      caption: String.raw`A real2×2 bounded example compares (ST)*x with T*S*x. The unreversed product S*T*x generally differs. Finite matrices have full domains; they illustrate the equality case, not the possible strict domain inclusion for unbounded factors.`,
      deps: ["fa-13.1", "fa-12.9"],
      tags: ['unbounded operators', 'adjoint', 'boundary conditions'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §13.2 (full relevant statement and proof inspected)'],
      viz: productDemo,
    },
    // ------------------------------------------------------------------ 13.5
    {
      num: '13.5',
      kind: "Concept",
      name: "Differentiation and multiplication have commutator I",
      statement: String.raw`On a common domain stable under differentiation and multiplication by x, such as polynomials or smooth compactly supported functions, $D M_x-M_xD=I$. Here Df=f′ and M_xf(x)=xf(x). At least one factor must be unbounded on the ambient normed space;13.6 explains why.`,
      idea: String.raw`The product rule gives (xf)′−xf′=f. Domains matter: a boundary-condition domain need not be preserved by M_x, so the displayed identity is asserted on a stable common core. Truncating polynomials introduces a top-degree boundary defect, which restores the zero trace required of a finite matrix commutator.`,
      caption: String.raw`Truncate the monomial basis at degree N−1 and change N. Differentiation lowers degree and truncated multiplication raises it. Their commutator equals1 on every lower degree, but its last diagonal entry is1−N, so the trace stays zero. The untruncated differential identity is not the commutator of two bounded operators.`,
      deps: ["fa-13.1"],
      tags: ['unbounded operators', 'adjoint', 'inverse'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §13.5 (full relevant statement and proof inspected)'],
      viz: commutatorDemo,
    },
    // ------------------------------------------------------------------ 13.9
    {
      num: '13.9',
      kind: 'Theorem',
      name: "Adjoints are closed operators",
      statement: String.raw`The adjoint of every densely defined operator is closed. Consequently every self-adjoint operator is closed.`,
      idea: String.raw`By13.8 its graph is an orthogonal complement in H×H, and every orthogonal complement is closed. Self-adjointness identifies T with this closed adjoint.`,
      caption: String.raw`Change the operator slope and increase the sequence index. A convergent sequence in the adjoint graph approaches a point still on that graph. This one-dimensional example illustrates the orthogonal-complement proof; unbounded adjoints need the same closed-subspace argument.`,
      deps: ["fa-13.8", "fa-12.2"],
      see: ['fa-12.10'],
      tags: ['unbounded operators', 'adjoint', 'range'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §13.9 (full relevant statement and proof inspected)'],
      viz: graphClosedDemo,
    },
    // ------------------------------------------------------------------ 13.11
    {
      num: '13.11',
      kind: 'Theorem',
      name: 'Symmetric operators: everywhere defined, invertible, onto',
      statement: String.raw`Let $T$ be densely defined and symmetric.
(a) If $\mathscr D(T)=H$, then $T$ is self-adjoint and bounded (Hellinger–Toeplitz).
(b) If $T$ is self-adjoint and one-to-one, then $\mathscr R(T)$ is dense and $T^{-1}$ is self-adjoint.
(c) If $\mathscr R(T)$ is dense, then $T$ is one-to-one.
(d) If $\mathscr R(T)=H$, then $T$ is self-adjoint and $T^{-1}\in B(H)$.`,
      idea: String.raw`An everywhere-defined symmetric operator equals its adjoint, so13.9 and the closed graph theorem give boundedness. If a self-adjoint T is injective, its range is dense by the adjoint identity. Rotating the graphs of T and T⁻¹ and applying13.10 proves that the inverse is self-adjoint. Symmetry also makes the kernel orthogonal to the range, proving(c). If T is onto, its inverse is symmetric and everywhere defined; apply(a), then(b).`,
      caption: String.raw`$Tu=-u''+bu'+cu$ on $L^2[0,\pi]$ with $u(0)=u(\pi)=0$. Left: the kernel $G(x,y)$ of $T^{-1}$ (Green's function), computed by inverting a finite-difference matrix (red $>0$, blue $<0$). With $b=0$, $T$ is self-adjoint and $G(x,y)=G(y,x)$; drag the point to compare it with its mirror. A drift $b\ne0$ breaks self-adjointness and the symmetry of $G$. Right: $\sigma(T^{-1})=\{1/(k^2+c+b^2/4)\}$, accumulating only at $0$. As $c\to-1-b^2/4$, $T$ stops being one-to-one and $\norm{T^{-1}}$ blows up.`,
      deps: ["fa-13.1", "fa-13.9", "fa-13.10", "fa-2.15"],
      tags: ['symmetric operators', 'self-adjoint operators', "Green's functions"],
      refs: ['Rudin, Functional Analysis, 2nd ed., §13.11 (full relevant statement and proof inspected)'],
      viz(v) {
        const M = v.M;
        const cS = v.slider('$c$', -3.5, 3, 0.5, { step: 0.01 });
        const bS = v.slider('drift $b$', -2, 2, 0, { step: 0.01 });
        const L = v.stage({ x: [0, Math.PI], y: [0, Math.PI], equal: true, height: 330, axes: 'box', xlabel: 'x', ylabel: 'y', title: '$G(x,y)$, the kernel of $T^{-1}$' });
        const R = v.stage({ x: [-1.2, 1.2], y: [-1, 1], height: 330, weight: 0.8, axes: false, ticks: false, title: '$\\sigma(T^{-1})$ on $\\R$' });
        const hp = L.handle(2.2, 0.8, { color: 'ink', label: '(x,y)' });
        const n = 120, h = Math.PI / (n + 1);
        let cache = { key: '' }, st = {};
        v.render(() => {
          const c = cS.value, b = bS.value, key = `${c}|${b}`;
          if (cache.key !== key) {
            const A = new Float64Array(n), Bd = new Float64Array(n), Cd = new Float64Array(n);
            for (let i = 0; i < n; i++) { A[i] = -1 / (h * h) - b / (2 * h); Bd[i] = 2 / (h * h) + c; Cd[i] = -1 / (h * h) + b / (2 * h); }
            const Gm = [];
            for (let j = 0; j < n; j++) { const e = new Float64Array(n); e[j] = 1 / h; Gm.push(thomas(A, Bd, Cd, e)); }   // column j = G(·, y_j)
            let mx = 0, asym = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { mx = Math.max(mx, Math.abs(Gm[j][i])); asym = Math.max(asym, Math.abs(Gm[j][i] - Gm[i][j])); }
            cache = { key, Gm, mx, asym };
          }
          const { Gm, mx } = cache;
          const at = (x, y) => { const i = M.clamp(Math.round(x / h) - 1, 0, n - 1), j = M.clamp(Math.round(y / h) - 1, 0, n - 1); return Gm[j][i]; };
          L.heat((x, y) => at(x, y), { range: [-mx, mx], cmap: 'diverging', res: 3, key: `g${key}` });
          L.line(0, 0, Math.PI, Math.PI, { color: 'ink', width: 1, dash: [4, 3] });
          L.dot(hp.y, hp.x, { color: 'ink', r: 4, hollow: true, label: '(y,x)', labelPos: 'ne' });
          const shift = c + b * b / 4, mu = [];
          for (let k = 1; k <= 30; k++) mu.push(1 / (k * k + shift));
          const sc = 1 / Math.max(1, ...mu.map(Math.abs));
          R.line(-1.15, 0, 1.15, 0, { color: 'muted', width: 1.2 });
          R.text('0', 0, -0.12, { color: 'muted', size: 12 });
          mu.forEach((m, k) => R.dot(m * sc, 0, { color: 'purple', r: k < 4 ? 5 : 3 }));
          R.text(sc < 1 ? `scale ×${v.fmt(sc, 2)}` : 'scale ×1', 0, 0.6, { color: 'muted', size: 12 });
          st = { g1: at(hp.x, hp.y), g2: at(hp.y, hp.x), asym: cache.asym, mx, norm: Math.max(...mu.map(Math.abs)), shift, b };
        });
        v.readout(() => {
          const s = st;
          return `$G(x,y)=${v.fix(s.g1, 4)}$, $G(y,x)=${v.fix(s.g2, 4)}$ (largest asymmetry $${v.fix(s.asym, 4)}$). ` + (Math.abs(s.b) < 1e-9 ? 'Self-adjoint $T$: the kernel is symmetric, so $T^{-1}$ is self-adjoint. ' : 'With drift, $T$ is not self-adjoint and neither is $T^{-1}$. ') + `$\\|T^{-1}\\|\\ge\\rho(T^{-1})=${v.fix(s.norm, 3)}$` + (Math.abs(s.shift + 1) < 0.15 ? ' — close to an eigenvalue $0$ of $T$.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 13.12
    {
      num: '13.12',
      kind: 'Theorem',
      name: 'Closed operators: D(T*) is dense and T** = T',
      statement: String.raw`If $T$ is a closed, densely defined operator in $H$, then $\mathscr D(T^*)$ is dense and $T^{**}=T$. More generally, a densely defined $T$ has a closed extension (it is **closable**) if and only if $\mathscr D(T^*)$ is dense, and then $T^{**}=\overline T$, the operator whose graph is $\overline{\mathscr G(T)}$.`,
      idea: String.raw`$V(a,b)=(-b,a)$ is unitary with $V^2=-I$, so 13.8 gives $V\mathscr G(T^*)=(V^2\mathscr G(T))^\perp=\mathscr G(T)^\perp$. If $z\perp\mathscr D(T^*)$, then $(0,z)$ is orthogonal to every $(-T^*y,y)$, that is, to $V\mathscr G(T^*)=\mathscr G(T)^\perp$, so $(0,z)\in\overline{\mathscr G(T)}$. When the closure of the graph is again a graph, as it is for closed or closable $T$, this forces $z=0$. Applying 13.8 once more, $\mathscr G(T^{**})=(V\mathscr G(T^*))^\perp=\mathscr G(T)^{\perp\perp}=\overline{\mathscr G(T)}$.`,
      caption: String.raw`Two operators on $L^2[0,1]$ and a sequence $f_n\to0$. **Closable**: $Tf=f'$ on $C^1$ functions, $f_n=\frac1n\sin n\pi x$. $Tf_n=\pi\cos n\pi x$ does not converge, and for every $g\in\mathscr D(T^*)$ (a dense set; here $g=\sin^2\pi x$), $(Tf_n,g)=(f_n,T^*g)\to0$. So no limit other than $0$ is possible. **Not closable**: $Tf=f(0)\cdot1$ on $C[0,1]$, $f_n=(1-nx)^+$. Now $(f_n,Tf_n)\to(0,1)$: the closure of the graph contains $(0,1)$ and is not a graph. Correspondingly $\mathscr D(T^*)=\{g:\int_0^1g=0\}$ is not dense, since it misses the constants. Bottom: $\norm{f_n}$ and the Cauchy test $\norm{Tf_n-Tf_{2n}}$ against $n$.`,
      deps: ["fa-13.8", "fa-13.10"],
      tags: ['closed operators', 'adjoint', 'graphs'],
      refs: ["Rudin, FA2,13.12 p.354; closability consequence in Exercise2 p.385"],

      viz(v) {
        const M = v.M;
        const mode = v.select('$T$', [{ value: 'cl', label: "closable: $Tf=f'$" }, { value: 'nc', label: 'not closable: $Tf=f(0)\\cdot1$' }], 'nc');
        const nS = v.slider('$n$', 1, 400, 12, { int: true, log: true });
        const T = v.stage({ x: [0, 1], y: [-3.4, 3.4], height: 240, full: true, axes: true, title: '$f_n$ (blue) and $Tf_n$ (orange)' });
        const B = v.stage({ x: [0, Math.log10(400)], y: [-3, 1], height: 190, full: true, axes: 'box', xlabel: 'n', xticks: [[0, '1'], [1, '10'], [2, '100']], yticks: decTicks(-3, 1), title: '$\\|f_n\\|$ (blue) and $\\|Tf_n-Tf_{2n}\\|$ (orange), log scale' });
        let st = {};
        v.legend([['blue', '$f_n\\to0$'], ['orange', '$Tf_n$']]);
        v.render(() => {
          const cl = mode.value === 'cl', n = nS.value;
          const f = cl ? (x) => Math.sin(n * Math.PI * x) / n : (x) => Math.max(0, 1 - n * x);
          const Tf = cl ? (x) => Math.PI * Math.cos(n * Math.PI * x) : () => 1;
          T.setView(null, cl ? [-3.6, 3.6] : [-0.3, 1.4]);
          T.fn(Tf, { color: 'orange', width: 2, n: 1600 });
          T.fn(f, { color: 'blue', width: 2.6, n: 1600 });
          const ns = M.linspace(0, Math.log10(400), 120).map((l) => Math.round(10 ** l));
          const nf = (m) => (cl ? 1 / (m * Math.SQRT2) : 1 / Math.sqrt(3 * m)), cauchy = () => (cl ? Math.PI : 1e-3);
          B.path(ns.map((m) => [Math.log10(m), Math.log10(nf(m))]), { color: 'blue', width: 2.4 });
          B.path(ns.map((m) => [Math.log10(m), Math.log10(cauchy(m))]), { color: 'orange', width: 2.4 });
          if (!cl) B.text('Tfₙ = 1 for every n: exactly Cauchy', 1.3, -2.75, { color: 'orange', size: 12 });
          B.vline(Math.log10(n), { color: 'muted', width: 1, dash: [3, 3] });
          const g = (x) => Math.sin(Math.PI * x) ** 2, ip = simpson((x) => Tf(x) * g(x), 0, 1, 4000);
          st = { cl, n, nf: nf(n), ip };
        });
        v.readout(() => {
          const s = st;
          return s.cl ? `$\\|f_n\\|=${v.fix(s.nf, 4)}\\to0$, but $Tf_n$ is not Cauchy ($\\|Tf_n-Tf_{2n}\\|=\\pi$). For $g=\\sin^2\\pi x\\in\\mathscr D(T^*)$, $(Tf_n,g)=${v.sci(Math.abs(s.ip) + 1e-17, 2)}\\to0$: any limit of $Tf_n$ would be orthogonal to the dense set $\\mathscr D(T^*)$, hence $0$. $T$ is closable, and $T^{**}=\\overline T$.` : `$\\|f_n\\|=${v.fix(s.nf, 4)}\\to0$ while $Tf_n=1$: $(f_n,Tf_n)\\to(0,1)$, so $\\overline{\\mathscr G(T)}$ is not the graph of an operator. $\\mathscr D(T^*)=1^\\perp$ is not dense, and $T^{**}$ is not even defined.`;
        });
      },
    },
    // ------------------------------------------------------------------ 13.13
    {
      num: '13.13',
      kind: 'Theorem',
      name: 'von Neumann: I + T*T is invertible and T*T is self-adjoint',
      statement: String.raw`Let $T$ be closed and densely defined, and $Q=I+T^*T$ with $\mathscr D(Q)=\mathscr D(T^*T)$. Then $Q$ maps $\mathscr D(Q)$ one-to-one onto $H$, and
$$B=Q^{-1},\qquad C=TQ^{-1}$$
are bounded, with $\norm B\le1$, $\norm C\le1$, $B\ge0$. Moreover $T^*T$ is self-adjoint, and $\mathscr D(T^*T)$ is a core for $T$.`,
      idea: String.raw`By 13.8, $H\times H=V\mathscr G(T)\oplus\mathscr G(T^*)$. Split $(0,h)=(-Tx,x)+(y,T^*y)$. The first components give $y=Tx$, so $x\in\mathscr D(T^*T)$, and the second give $h=x+T^*Tx=Qx$. Orthogonality of the two pieces gives $\norm h^2=\norm x^2+2\norm{Tx}^2+\norm{T^*Tx}^2$, hence $\norm{Bh}=\norm x\le\norm h$ and $\norm{Ch}=\norm{Tx}\le\norm h$. $B$ is bounded, symmetric and everywhere defined, so self-adjoint (13.11(a)), and $T^*T=B^{-1}-I$ is self-adjoint by 13.11(b).`,
      caption: String.raw`$T=d/dx$ on $L^2[0,1]$, closed on either domain. The formal expression $T^*T=-d^2/dx^2$ is the same, but its boundary conditions are not. If $\mathscr D(T)$ has no condition, then $T^*=-d/dx$ with $u(0)=u(1)=0$, and $T^*T$ carries the **Neumann** conditions. If $\mathscr D(T)$ has $f(0)=f(1)=0$, then $T^*T$ is the **Dirichlet** Laplacian. Top: for $g$ (choose), $u=Bg$ solves $u-u''=g$ (purple), and $Cg=u'$ (green). Note the boundary behaviour. Bottom: the multipliers of $B$ and $C$ in the eigenbasis of $T^*T$, all $\le1$ and $\le\frac12$.`,
      deps: ["fa-13.10", "fa-13.11", "fa-12.32"],
      tags: ['closed operators', 'self-adjoint operators', 'boundary conditions'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §13.13 (full relevant statement and proof inspected)'],
      viz(v) {
        const M = v.M;
        const dom = v.select('$\\mathscr D(T)$', [{ value: 'free', label: 'no condition (Neumann $T^*T$)' }, { value: 'dir', label: '$f(0)=f(1)=0$ (Dirichlet $T^*T$)' }], 'free');
        const gS = v.select('$g=$', [{ value: 'step', label: 'step' }, { value: 'ramp', label: '$x$' }, { value: 'spike', label: 'bump' }], 'step');
        const T = v.stage({ x: [0, 1], y: [-1, 1.4], height: 260, full: true, axes: true, title: '$g$ (gold), $u=Bg=(I+T^*T)^{-1}g$ (purple), $Cg=TBg=u\'$ (green)' });
        const Bs = v.stage({ x: [-0.6, 10.6], y: [-0.16, 1.1], height: 170, full: true, axes: 'box', xlabel: 'k', xticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], title: 'multipliers of $B$ (purple) and $C$ (green) on the $k$-th eigenfunction' });
        const K = 120;
        let cache = { key: '' }, st = {};
        v.legend([['gold', '$g$'], ['purple', '$u=Bg$'], ['green', '$Cg$']]);
        v.render(() => {
          const free = dom.value === 'free', gk = gS.value, key = `${free}|${gk}`;
          const g = gk === 'step' ? (x) => (x < 0.6 ? 1 : -0.3) : gk === 'ramp' ? (x) => x : (x) => { const t = (x - 0.3) / 0.12, s = 1 - t * t; return s > 0 ? Math.E * Math.exp(-1 / s) : 0; };
          if (cache.key !== key) {
            const basis = (k, x) => (free ? (k === 0 ? 1 : Math.SQRT2 * Math.cos(k * Math.PI * x)) : Math.SQRT2 * Math.sin(k * Math.PI * x));
            const dbasis = (k, x) => (free ? (k === 0 ? 0 : -Math.SQRT2 * k * Math.PI * Math.sin(k * Math.PI * x)) : Math.SQRT2 * k * Math.PI * Math.cos(k * Math.PI * x));
            const ks = []; for (let k = free ? 0 : 1; k <= K; k++) ks.push(k);
            const co = ks.map((k) => simpson((x) => g(x) * basis(k, x), 0, 1, 3000));
            const xs = M.linspace(0, 1, 401);
            const u = xs.map((x) => ks.reduce((s, k, i) => s + co[i] / (1 + k * k * Math.PI * Math.PI) * basis(k, x), 0));
            const du = xs.map((x) => ks.reduce((s, k, i) => s + co[i] / (1 + k * k * Math.PI * Math.PI) * dbasis(k, x), 0));
            cache = { key, xs, u, du };
          }
          const { xs, u, du } = cache;
          T.setView(null, span([...u, ...du, -0.4, 1.1], 1, 0.08));
          T.fn(g, { color: 'gold', width: 2, fill: 'gold', fillAlpha: 0.1, n: 800 });
          T.path(xs.map((x, i) => [x, u[i]]), { color: 'purple', width: 2.6 });
          T.path(xs.map((x, i) => [x, du[i]]), { color: 'green', width: 2.2 });
          [0, 1].forEach((x) => { const i = x ? xs.length - 1 : 0; T.dot(x, free ? du[i] : u[i], { color: free ? 'green' : 'purple', r: 5 }); });
          for (let k = free ? 0 : 1; k <= 10; k++) {
            const bm = 1 / (1 + k * k * Math.PI * Math.PI), cm = k * Math.PI / (1 + k * k * Math.PI * Math.PI);
            Bs.rect(k - 0.36, 0, k - 0.02, bm, { color: 'purple', fill: 'purple', fillAlpha: 0.55 });
            Bs.rect(k + 0.02, 0, k + 0.36, cm, { color: 'green', fill: 'green', fillAlpha: 0.55 });
          }
          Bs.hline(0, { color: 'muted', width: 1 });
          Bs.hline(1, { color: 'purple', width: 1, dash: [4, 3] }); Bs.hline(0.5, { color: 'green', width: 1, dash: [4, 3] });
          st = { free, e0: free ? du[0] : u[0], e1: free ? du[du.length - 1] : u[u.length - 1] };
        });
        v.readout(() => {
          const s = st;
          return s.free ? `Neumann: $u'(0)=${v.fix(s.e0, 4)}$, $u'(1)=${v.fix(s.e1, 4)}$. $\\|B\\|=1$ (attained on constants, $k=0$), $\\|C\\|\\le\\frac12$.` : `Dirichlet: $u(0)=${v.fix(s.e0, 4)}$, $u(1)=${v.fix(s.e1, 4)}$. $\\|B\\|=1/(1+\\pi^2)$, $\\|C\\|\\le\\frac12$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 13.14
    {
      num: '13.14',
      kind: "Definition",
      name: "Maximally symmetric operators",
      statement: String.raw`A symmetric operator T is maximally symmetric if it has no proper symmetric extension: whenever S is symmetric and $T\subset S$, one has S=T. This need not imply self-adjointness.`,
      idea: String.raw`Being symmetric is a statement about the inner products of pairs in the domain. Maximality asks whether any larger domain retains that property. Self-adjointness forces maximality by13.15; one-sided deficiency in13.20 shows that the converse fails.`,
      deps: ["fa-13.3"],
      tags: ['symmetric operators', 'essential self-adjointness', 'deficiency indices'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §13.14 (full relevant statement and proof inspected)'],
    },
    // ------------------------------------------------------------------ 13.15
    {
      num: '13.15',
      kind: 'Theorem',
      name: 'Self-adjoint operators are maximally symmetric',
      statement: String.raw`If $T$ is self-adjoint and $S$ is a symmetric extension of $T$, then $S=T$. So a self-adjoint operator has no proper symmetric extension, and two different self-adjoint extensions of the same symmetric operator never contain one another.`,
      idea: String.raw`$T\subset S$ gives $S^*\subset T^*$ (13.1), so $T\subset S\subset S^*\subset T^*=T$ and all four coincide. The model case is $-i\,d/dx$ on $[0,1]$. On $\{f(0)=f(1)=0\}$ it is symmetric but not self-adjoint, and its self-adjoint extensions $T_\theta$ form a circle. None of them contains another, and each one is a dead end for further symmetric extension.`,
      caption: String.raw`On $L^2[0,1]$, $T=-i\,d/dx$ is symmetric on functions with $f(0)=f(1)=0$: the boundary term $f(1)\bar g(1)-f(0)\bar g(0)$ in integration by parts vanishes (left panel: $(Tf,g)-(f,Tg)$ for the test pair shown). It is not self-adjoint — $T^*$ needs no boundary condition at all. Choose "no condition" to see symmetry fail on the larger domain. Its self-adjoint extensions are the $T_\theta$ with $f(1)=e^{i\theta}f(0)$, whose eigenfunctions $e^{i(\theta+2\pi k)x}$ have eigenvalues $\theta+2\pi k$ (right) — a different spectrum for each $\theta$. Slide $\theta$ and watch the spectrum (dots) shift.`,
      deps: ["fa-13.1", "fa-13.3", "fa-13.14"],
      tags: ['unbounded operators', 'self-adjoint operators', 'boundary conditions'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §13.15 (full relevant statement and proof inspected)'],
      viz(v) {
        const M = v.M;
        const thS = v.slider('$\\theta$ in $f(1)=e^{i\\theta}f(0)$', 0, 6.28, 1.2, { step: 0.01 });
        const bc = v.select('domain of $f$, $g$', [{ value: 'zero', label: '$f(0)=f(1)=0$' }, { value: 'theta', label: '$f(1)=e^{i\\theta}f(0)$' }, { value: 'none', label: 'no condition' }], 'theta');
        const L = v.stage({ x: [0, 1], y: [-1.6, 1.6], height: 300, axes: true, title: '$\\mathrm{Re}\\,f$ (blue), $\\mathrm{Re}\\,g$ (orange) in the chosen domain' });
        const R = v.stage({ x: [-14, 14], y: [-1, 1], height: 300, axes: true, title: 'spectrum of $T_\\theta$: $\\{\\theta+2\\pi k\\}$' });
        let st = {};
        v.render(() => {
          const th = thS.value, key = bc.value;
          // f(x) = a(x) e^{iθx} with a(0)=a(1) ⇒ f(1) = e^{iθ} f(0); g similar with another profile
          const prof = (key === 'zero') ? [(x) => Math.sin(Math.PI * x) * (1 + 0.5 * x), (x) => Math.sin(2 * Math.PI * x) + 0.3 * Math.sin(Math.PI * x)]
            : (key === 'theta') ? [(x) => 1 + 0.4 * Math.cos(2 * Math.PI * x), (x) => 0.6 + 0.5 * Math.sin(2 * Math.PI * x)]
              : [(x) => 1 + 0.6 * x, (x) => 0.4 + x * x];
          const ph = key === 'none' ? 0 : th;
          const F = (x) => [prof[0](x) * Math.cos(ph * x), prof[0](x) * Math.sin(ph * x)], G = (x) => [prof[1](x) * Math.cos(ph * x), prof[1](x) * Math.sin(ph * x)];
          const d = (H, x) => { const h = 1e-5, a = H(x + h), b = H(x - h); return [(a[0] - b[0]) / (2 * h), (a[1] - b[1]) / (2 * h)]; };
          const Tf = (H, x) => { const q = d(H, x); return [q[1], -q[0]]; };     // −i·H'
          const ip = (A, B) => { let re = 0, im = 0; const n = 2000; for (let i = 0; i <= n; i++) { const x = Math.min(1 - 1e-5, Math.max(1e-5, i / n)), w = (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) / (3 * n), a = A(x), b = B(x); re += w * (a[0] * b[0] + a[1] * b[1]); im += w * (a[1] * b[0] - a[0] * b[1]); } return [re, im]; };
          const lhs = ip((x) => Tf(F, x), G), rhs = ip(F, (x) => Tf(G, x));
          const defect = Math.hypot(lhs[0] - rhs[0], lhs[1] - rhs[1]);
          L.fn((x) => F(x)[0], { color: 'blue', width: 2.4 });
          L.fn((x) => G(x)[0], { color: 'orange', width: 2.2 });
          L.corner(`|(Tf, g) − (f, Tg)| = ${v.fmt(defect, 3)}`, 'bl', { color: defect < 1e-4 ? 'green' : 'red', weight: 600 });
          for (let k = -3; k <= 2; k++) { const l = th + 2 * Math.PI * k; if (Math.abs(l) < 14) R.dot(l, 0, { color: 'purple', r: 5.5 }); }
          for (let k = -1; k <= 1; k++) { const l = th + 2 * Math.PI * k; R.text(v.fmt(l, 2), l, 0, { dy: -14, color: 'purple', size: 11, align: 'center' }); }
          st = { key, defect };
        });
        v.readout(() => {
          const s = st;
          const tag = { zero: 'symmetric (boundary terms vanish) but not self-adjoint: its adjoint drops the boundary conditions', theta: 'symmetric and in fact self-adjoint: $\\mathscr D(T_\\theta^*)=\\mathscr D(T_\\theta)$', none: 'not symmetric on this domain: the boundary term $-i\\,(f(1)\\bar g(1)-f(0)\\bar g(0))$ survives' }[s.key];
          return `$|(Tf,g)-(f,Tg)| = ${v.sci(s.defect + 1e-17, 2)}$ — ${tag}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 13.16
    {
      num: '13.16',
      kind: 'Theorem',
      name: 'Symmetric operators: ‖(T ± i)x‖² = ‖Tx‖² + ‖x‖²',
      statement: String.raw`If $T$ is symmetric, with density not required,, then
$$\norm{(T\pm iI)x}^2=\norm{Tx}^2+\norm x^2\qquad(x\in\mathscr D(T)).$$
Consequently $T\pm iI$ are one-to-one with $\norm{(T\pm iI)x}\ge\norm x$; $T$ is closed if and only if $\mathscr R(T+iI)$ is closed, if and only if $\mathscr R(T-iI)$ is closed; and if $\mathscr R(T+iI)=H$ or $\mathscr R(T-iI)=H$, then $T$ is maximally symmetric.`,
      idea: String.raw`Expand: $\norm{Tx\pm ix}^2=\norm{Tx}^2+\norm x^2\pm2\operatorname{Re}\big(-i(Tx,x)\big)$, and $(Tx,x)$ is real for symmetric $T$. The identity says that $x\mapsto(T+iI)x$ is an isometry of $\mathscr G(T)$ onto $\mathscr R(T+iI)$, if the graph carries the norm $(\norm x^2+\norm{Tx}^2)^{1/2}$. So one is complete exactly when the other is. If $\mathscr R(T+iI)=H$ and $S\supset T$ is symmetric, then for $x\in\mathscr D(S)$ pick $y\in\mathscr D(T)$ with $(T+i)y=(S+i)x$. Since $S+iI$ is one-to-one by the same identity, $x=y\in\mathscr D(T)$, so $S=T$. This is the analytic heart of the Cayley transform 13.19.`,
      caption: String.raw`$T=-i\,d/dx$ on $L^2[0,1]$ and a real $f$ with prescribed end values $f(0)=p$, $f(1)=q$ (sliders) and interior shape $A$. Bars: $\norm{Tf}^2+\norm f^2$ (stacked), $\norm{(T+i)f}^2$ and $\norm{(T-i)f}^2$. The cross terms are $\mp(q^2-p^2)$, so the identity holds exactly when $|q|=|p|$, which is when $f$ lies in a domain $\{f(1)=e^{i\theta}f(0)\}$ on which $T$ is symmetric. Push $q$ away from $\pm p$: the bars come apart.`,
      deps: ["fa-13.3", "fa-13.14"],
      tags: ['symmetric operators', 'closed operators'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §13.16 (full relevant statement and proof inspected)'],
      viz(v) {
        const M = v.M;
        const pS = v.slider('$p=f(0)$', -1.5, 1.5, 0.8, { step: 0.01 });
        const qS = v.slider('$q=f(1)$', -1.5, 1.5, 0.8, { step: 0.01 });
        const AS = v.slider('interior shape $A$', -2, 2, 1.2, { step: 0.01 });
        v.button('make $q=p$', () => qS.set(pS.value));
        const L = v.stage({ x: [0, 1], y: [-3, 3], height: 300, axes: true, title: '$f$ (blue) and $|Tf|=|f\'|$ (orange)' });
        const R = v.stage({ x: [0.3, 3.7], y: [0, 10], height: 300, axes: false, title: 'the three squared norms' });
        let st = {};
        v.legend([['orange', '$\\|Tf\\|^2$'], ['blue', '$\\|f\\|^2$'], ['purple', '$\\|(T\\pm i)f\\|^2$']]);
        v.render(() => {
          const p = pS.value, q = qS.value, A = AS.value;
          const f = (x) => p * (1 - x) + q * x + A * Math.sin(Math.PI * x) + 0.4 * A * Math.sin(3 * Math.PI * x);
          const fd = (x) => q - p + A * Math.PI * Math.cos(Math.PI * x) + 1.2 * A * Math.PI * Math.cos(3 * Math.PI * x);
          const nf = simpson((x) => f(x) ** 2, 0, 1, 2000), nT = simpson((x) => fd(x) ** 2, 0, 1, 2000);
          const np = simpson((x) => (f(x) - fd(x)) ** 2, 0, 1, 2000), nm = simpson((x) => (f(x) + fd(x)) ** 2, 0, 1, 2000);   // (T+i)f = i(f−f'), (T−i)f = −i(f+f')
          L.setView(null, span([...M.linspace(0, 1, 101).map(f), ...M.linspace(0, 1, 101).map((x) => Math.abs(fd(x)))], 2, 0.1));
          L.fn((x) => Math.abs(fd(x)), { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.1 });
          L.fn(f, { color: 'blue', width: 2.6 });
          L.dot(0, p, { color: 'blue', r: 5, label: 'p' }); L.dot(1, q, { color: 'blue', r: 5, label: 'q', labelPos: 'nw' });
          const top = Math.max(nT + nf, np, nm) * 1.12;
          R.setView(null, [-0.1 * top, top]);
          R.hline(0, { color: 'muted', width: 1 });
          R.rect(0.7, 0, 1.3, nT, { color: 'orange', fill: 'orange', fillAlpha: 0.55 });
          R.rect(0.7, nT, 1.3, nT + nf, { color: 'blue', fill: 'blue', fillAlpha: 0.55 });
          R.rect(1.7, 0, 2.3, np, { color: 'purple', fill: 'purple', fillAlpha: 0.55 });
          R.rect(2.7, 0, 3.3, nm, { color: 'purple', fill: 'purple', fillAlpha: 0.35 });
          R.hline(nT + nf, { color: 'ink', width: 1, dash: [4, 3] });
          [['‖Tf‖² + ‖f‖²', 1], ['‖(T+i)f‖²', 2], ['‖(T−i)f‖²', 3]].forEach(([t, x]) => R.text(t, x, -0.05 * top, { color: 'muted', size: 12, align: 'center' }));
          st = { nf, nT, np, nm, bd: q * q - p * p };
        });
        v.readout(() => {
          const s = st, sym = Math.abs(s.bd) < 1e-3;
          return `$\\|Tf\\|^2+\\|f\\|^2=${v.fix(s.nT + s.nf, 3)}$, $\\|(T+i)f\\|^2=${v.fix(s.np, 3)}$, $\\|(T-i)f\\|^2=${v.fix(s.nm, 3)}$; boundary term $q^2-p^2=${v.fix(s.bd, 3)}$. ` + (sym ? '**Equal**: on a symmetric domain $(Tf,f)$ is real and the cross terms cancel.' : 'Not equal: $f$ lies in no domain on which $T$ is symmetric.');
        });
      },
    },
  ],
};
