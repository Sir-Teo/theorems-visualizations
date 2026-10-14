// Rudin, Functional Analysis — Chapter 13: Unbounded Operators (part 1: graphs, adjoints, symmetric operators)
//
// Numbering note: recalled, not checked against the book; items carry `verify: true`.

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
const p10 = (k) => (k === 0 ? '1' : '10' + (k < 0 ? '⁻' : '') + String(Math.abs(k)).split('').map((d) => SUP[+d]).join(''));

export default {
  book: 'fa',
  chapter: 13,
  title: 'Unbounded Operators',
  summary: String.raw`Differential operators on $L^2$ are not bounded and are defined only on dense subspaces, so the theory is rebuilt around graphs. An operator is closed if its graph is closed; its adjoint is read off from the graph via the rotation $(x,y)\mapsto(-y,x)$, and is always closed. Symmetric operators satisfy $(Tx,y)=(x,Ty)$; self-adjoint ones in addition have $\mathscr D(T^*)=\mathscr D(T)$, which is the difference between $-i\,d/dx$ on an interval with or without boundary conditions. The Cayley transform $(T-i)(T+i)^{-1}$ turns self-adjoint operators into unitary ones, which carries the spectral theorem over: every self-adjoint (indeed every normal) unbounded operator is $\int\lambda\,dE(\lambda)$, with real spectrum, and generates the unitary group $e^{itT}$. The chapter ends with semigroups of operators $e^{tA}$ and their infinitesimal generators (Hille–Yosida).`,
  items: [
    {
      num: '13.1',
      kind: 'Definition',
      name: 'Unbounded operators, graphs, closed operators',
      statement: String.raw`An **operator in $H$** is a linear map $T:\mathscr D(T)\to H$ defined on a subspace $\mathscr D(T)\subset H$, its **domain**; it is **densely defined** if $\mathscr D(T)$ is dense. Its **graph** is $\mathscr G(T)=\{(x,Tx):x\in\mathscr D(T)\}\subset H\times H$. $T$ is **closed** if $\mathscr G(T)$ is closed, i.e. $x_n\to x$, $Tx_n\to y$ with $x_n\in\mathscr D(T)$ imply $x\in\mathscr D(T)$ and $Tx=y$. $S$ **extends** $T$, $T\subset S$, if $\mathscr G(T)\subset\mathscr G(S)$.`,
      idea: String.raw`By the closed graph theorem, a closed operator defined on all of $H$ is bounded; so the interesting closed operators live on proper dense domains. Differentiation is the model: on $L^2[0,1]$ the graph of $f\mapsto f'$ on smooth functions is not closed, but its closure is the derivative on absolutely continuous functions with $f'\in L^2$.`,
      caption: String.raw`$T=d/dx$ on $L^2[0,1]$, defined on $C^1$ functions. The functions $f_n$ (blue) — smooth ramps of width $1/n$ — converge in $L^2$ to the step function $H(x-\frac12)$, which is not in any domain of a derivative; their derivatives $f_n'$ (orange) are spikes whose $L^2$ norms $\norm{f_n'}_2=\sqrt n\cdot c$ blow up. So $(f_n,Tf_n)$ does **not** converge in $H\times H$ and the closedness of $T$'s closure is not violated. Switch to $g_n=\frac1{\sqrt n}\sin(nx)$: $g_n\to0$ but $Tg_n=\sqrt n\cos(nx)$ is unbounded — $T$ is not bounded, yet closable.`,
      deps: ['fa-2.15', 'fa-12.1'],
      tags: ['unbounded operators', 'closed operators', 'graphs'],
      verify: true,
      viz(v) {
        const M = v.M;
        const which = v.select('sequence', [{ value: 'ramp', label: 'ramps $f_n\\to H(x-\\frac12)$' }, { value: 'osc', label: '$g_n=n^{-1/2}\\sin nx$' }], 'ramp');
        const nS = v.slider('$n$', 1, 200, 12, { int: true, log: true });
        const top = v.stage({ x: [0, 1], y: [-1.2, 1.4], height: 220, full: true, axes: true, title: '$x_n$ (blue)' });
        const mid = v.stage({ x: [0, 1], y: [-1, 1], height: 200, full: true, axes: true, title: '$Tx_n=x_n\'$ (orange)' });
        const bot = v.stage({ x: [0, Math.log10(200)], y: [-2.5, 1.5], height: 170, full: true, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100']], xlabel: 'n', title: '$\\|x_n-x\\|_2$ (blue) and $\\|Tx_n\\|_2$ (orange), log scale' });
        let st = {};
        v.render(() => {
          const key = which.value, n = nS.value;
          const ramp = (m) => (x) => { const u = (x - 0.5) * m + 0.5; return u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u); };
          const rampD = (m) => (x) => { const u = (x - 0.5) * m + 0.5; return u <= 0 || u >= 1 ? 0 : 6 * u * (1 - u) * m; };
          const f = key === 'ramp' ? ramp(n) : (x) => Math.sin(n * x) / Math.sqrt(n), fd = key === 'ramp' ? rampD(n) : (x) => Math.sqrt(n) * Math.cos(n * x);
          const lim = key === 'ramp' ? (x) => (x > 0.5 ? 1 : 0) : () => 0;
          top.fn(lim, { color: 'ink', width: 1.4, dash: [5, 4] });
          top.fn(f, { color: 'blue', width: 2.4, n: 2000 });
          const fdv = M.linspace(0, 1, 2001).map(fd), mx = Math.max(...fdv.map(Math.abs));
          mid.setView(null, [-Math.max(1, mx) * 1.1, Math.max(1, mx) * 1.1]);
          mid.fn(fd, { color: 'orange', width: 2, n: 2000, fill: 'orange', fillAlpha: 0.12 });
          const errs = (m) => { const g = key === 'ramp' ? ramp(m) : (x) => Math.sin(m * x) / Math.sqrt(m), gd = key === 'ramp' ? rampD(m) : (x) => Math.sqrt(m) * Math.cos(m * x); return [Math.sqrt(simpson((x) => (g(x) - lim(x)) ** 2, 0, 1, 4000)), Math.sqrt(simpson((x) => gd(x) ** 2, 0, 1, 4000))]; };
          const ns = M.range(30).map((i) => Math.round(Math.pow(200, i / 29))), E = ns.map(errs);
          bot.setTicks([[0, '1'], [1, '10'], [2, '100']], [-2, -1, 0, 1].map((k) => [k, p10(k)]));
          bot.path(ns.map((m, i) => [Math.log10(m), Math.log10(E[i][0] + 1e-9)]), { color: 'blue', width: 2.2 });
          bot.path(ns.map((m, i) => [Math.log10(m), Math.log10(E[i][1])]), { color: 'orange', width: 2.2 });
          bot.vline(Math.log10(n), { color: 'muted', width: 1, dash: [3, 3] });
          const e = errs(n);
          st = { key, e };
        });
        v.readout(() => `$\\|x_n-x\\|_2 = ${v.fix(st.e[0], 4)}\\to0$ while $\\|Tx_n\\|_2 = ${v.fix(st.e[1], 2)}\\to\\infty$: ` + (st.key === 'ramp' ? 'the graph points $(x_n,Tx_n)$ do not converge, so the step function is not forced into the domain.' : '$T$ is unbounded — no constant $C$ gives $\\|Tx\\|\\le C\\|x\\|$.'));
      },
    },
    {
      num: '13.3',
      kind: 'Definition',
      name: 'The adjoint of a densely defined operator',
      statement: String.raw`If $T$ is densely defined, $\mathscr D(T^*)$ is the set of $y\in H$ for which $x\mapsto(Tx,y)$ is a bounded functional on $\mathscr D(T)$; for such $y$ there is a unique $T^*y$ with
$$(Tx,y)=(x,T^*y)\qquad(x\in\mathscr D(T)).$$
$T$ is **symmetric** if $T\subset T^*$, i.e. $(Tx,y)=(x,Ty)$ for $x,y\in\mathscr D(T)$; **self-adjoint** if $T=T^*$ (same domain); **normal** if $T$ is closed, densely defined and $T^*T=TT^*$.`,
      idea: String.raw`Density of $\mathscr D(T)$ makes $T^*y$ unique (Riesz representation 12.3 on the closure). The smaller $\mathscr D(T)$, the larger $\mathscr D(T^*)$: shrinking a domain makes the adjoint bigger. Symmetric operators sit below their adjoints; self-adjoint ones are fixed points of this order-reversing operation.`,
      deps: ['fa-13.1', 'fa-12.3'],
      tags: ['unbounded operators', 'adjoint'],
      verify: true,
    },
    {
      num: '13.8',
      kind: 'Theorem',
      name: 'The adjoint via the graph: G(T*) = (V G(T))^⊥',
      statement: String.raw`Let $V(a,b)=(-b,a)$ on $H\times H$. If $T$ is densely defined, then
$$\mathscr G(T^*)=\big(V\mathscr G(T)\big)^\perp .$$
Consequently $T^*$ is closed, $T$ is closable iff $T^*$ is densely defined, and then $T^{**}=\overline T$; $H\times H=V\mathscr G(T)\oplus\mathscr G(T^*)$ when $T$ is closed.`,
      idea: String.raw`$(y,z)\perp V\mathscr G(T)$ means $(-Tx,y)+(x,z)=0$ for all $x\in\mathscr D(T)$, i.e. $(Tx,y)=(x,z)$, i.e. $y\in\mathscr D(T^*)$ and $z=T^*y$. Orthogonal complements are closed, so $T^*$ is closed. Applying the same identity twice and using $V^2=-I$ gives $\mathscr G(T^{**})=\overline{\mathscr G(T)}$ whenever $T^*$ is densely defined.`,
      caption: String.raw`The finite-dimensional skeleton: $H=\R$, so $H\times H=\R^2$ and an operator $T$ is multiplication by a number $t$ (slope). Its graph is the blue line; $V$ rotates it by $90^\circ$ (orange); the orthogonal complement of the rotated line (green) is the graph of $T^*$ — here again slope $t$, since real $1\times1$ matrices are self-adjoint. For $H=\R^2$ and a non-symmetric $2\times2$ matrix $T$ (the slider sets its entry $T_{12}$) the graphs are planes in $\R^4$; the readout checks that the graph of the transpose is orthogonal to $V\mathscr G(T)$, i.e. that it is $\mathscr G(T^*)$.`,
      deps: ['fa-13.3', 'fa-12.2'],
      tags: ['unbounded operators', 'adjoint', 'graphs'],
      verify: true,
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.2, 2.2], y: [-2, 2], equal: true, height: 360, axes: true, xlabel: 'x', ylabel: 'Tx', title: '$H\\times H=\\R^2$: graphs of $T$, $V\\mathscr G(T)$ and $\\mathscr G(T^*)$' });
        const ht = S.handle(1.4, 0.7, { color: 'blue', label: 'slope t', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [1.6 * x / r, 1.6 * y / r]; } });
        const aS = v.slider('$2\\times2$ case: entry $T_{12}$', -2, 2, 0.8, { step: 0.01 });
        let st = {};
        v.legend([['blue', '$\\mathscr G(T)$'], ['orange', '$V\\mathscr G(T)$'], ['green', '$(V\\mathscr G(T))^\\perp=\\mathscr G(T^*)$', { dash: true }]]);
        v.render(() => {
          const d = [ht.x, ht.y], vd = [-d[1], d[0]], perp = [-vd[1], vd[0]];
          const L = (u, col, w, dash) => S.line(-3 * u[0], -3 * u[1], 3 * u[0], 3 * u[1], { color: col, width: w, dash });
          L(d, 'blue', 2.6); L(vd, 'orange', 2.2); L(perp, 'green', 2.2, [7, 5]);
          const t = Math.abs(d[0]) > 1e-9 ? d[1] / d[0] : Infinity;
          // 2×2 check: G(T*) ⟂ V G(T) in R⁴
          const T = [[0.7, aS.value], [-0.4, 1.1]], Tt = [[0.7, -0.4], [aS.value, 1.1]];
          let mx = 0;
          for (const e of [[1, 0], [0, 1]]) for (const f of [[1, 0], [0, 1]]) {
            const Te = M.matVec(T, e), Ttf = M.matVec(Tt, f);
            const Vg = [-Te[0], -Te[1], e[0], e[1]], g = [f[0], f[1], Ttf[0], Ttf[1]];
            mx = Math.max(mx, Math.abs(Vg.reduce((s, x, i) => s + x * g[i], 0)));
          }
          st = { t, mx, a: aS.value };
        });
        v.readout(() => `$H=\\R$: $T=$ multiplication by $t = ${isFinite(st.t) ? v.fix(st.t, 3) : '\\infty'}$, and $\\mathscr G(T^*)$ is the same line. $H=\\R^2$: $\\max|\\langle Vg,g^*\\rangle| = ${v.sci(st.mx + 1e-17, 1)}$ over basis graph vectors, with $T^*=T^\\top$ ($T_{12}=${v.fix(st.a, 2)}$ moves to position $21$).`);
      },
    },
    {
      num: '13.11',
      kind: 'Theorem',
      name: 'Self-adjoint vs symmetric: the role of the domain',
      statement: String.raw`Let $T$ be symmetric and densely defined. (a) If $\mathscr D(T)=H$, then $T$ is bounded and self-adjoint (Hellinger–Toeplitz). (b) If $T$ is self-adjoint and $S$ is a symmetric extension of $T$, then $S=T$: self-adjoint operators are **maximally symmetric**. (c) If $\mathscr R(T)=H$, then $T$ is self-adjoint and $T^{-1}\in B(H)$.`,
      idea: String.raw`(a) $T=T^*$ on $H$, and $T^*$ is closed (13.8), so the closed graph theorem makes $T$ bounded. (b) $T\subset S\subset S^*\subset T^*=T$. (c) $T$ is one-to-one (if $Tx=0$, then $(x,Ty)=(Tx,y)=0$ for all $y$, and $\mathscr R(T)=H$ gives $x=0$), and $T^{-1}$ is symmetric and everywhere defined, hence bounded and self-adjoint by (a); then so is $T=(T^{-1})^{-1}$.`,
      caption: String.raw`On $L^2[0,1]$, $T=-i\,d/dx$ is symmetric on functions with $f(0)=f(1)=0$: the boundary term $f(1)\bar g(1)-f(0)\bar g(0)$ in integration by parts vanishes (left panel: $(Tf,g)-(f,Tg)$ for the test pair shown). It is not self-adjoint — $T^*$ needs no boundary condition at all. Choose "no condition" to see symmetry fail on the larger domain. The self-adjoint extensions are $T_\theta$ with $f(1)=e^{i\theta}f(0)$, whose eigenfunctions $e^{i(\theta+2\pi k)x}$ have eigenvalues $\theta+2\pi k$ (right) — a different spectrum for each $\theta$. Slide $\theta$ and watch the spectrum (dots) shift.`,
      deps: ['fa-13.8', 'fa-2.15'],
      tags: ['unbounded operators', 'self-adjoint operators', 'boundary conditions'],
      verify: true,
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
  ],
};
